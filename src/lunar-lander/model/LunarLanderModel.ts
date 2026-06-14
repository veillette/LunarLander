/**
 * LunarLanderModel.ts
 *
 * Top-level, view-independent model. Holds the lander, terrain and score, and
 * advances the physics on a fixed timestep using the original Flash equations.
 *
 * Coordinates: the lander's positionProperty is its ABSOLUTE location (x, yAbs)
 * in model metres. The terrain surface elevation at x is terrain.surfaceY(x);
 * the lander has landed when yAbs ≤ surfaceY(x). The "altitude" readout is the
 * clearance yAbs − surfaceY(x).
 */
import {
  BooleanProperty,
  DerivedProperty,
  Emitter,
  NumberProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { LunarLanderPreferencesModel } from "../../preferences/LunarLanderPreferencesModel.js";
import lunarLanderQueryParameters from "../../preferences/lunarLanderQueryParameters.js";
import { CrashState } from "./CrashState.js";
import { Lander } from "./Lander.js";
import LunarLanderConstants from "./LunarLanderConstants.js";
import { ScoreKeeper } from "./ScoreKeeper.js";
import { Terrain } from "./Terrain.js";

const {
  MASS_EMPTY,
  GRAVITY,
  MAX_THRUST,
  ISP,
  SOFT_SPEED,
  HARD_SPEED,
  LEVEL_ANGLE_TOLERANCE,
  THRUST_STEP,
  TILT_STEP,
  LOW_FUEL_FRACTION,
  INITIAL_FUEL,
  FIXED_DT,
  MAX_CATCHUP_STEPS,
  INITIAL_ALTITUDE,
  LANDER_RADIUS,
} = LunarLanderConstants;

export class LunarLanderModel implements TModel {
  public readonly terrain: Terrain;
  public readonly lander: Lander;
  public readonly scoreKeeper = new ScoreKeeper();

  public readonly crashStateProperty = new Property<CrashState>(CrashState.IN_FLIGHT);
  public readonly landingSpeedProperty = new NumberProperty(0);
  public readonly hitBoulderProperty = new BooleanProperty(false);

  // Paused until the player presses Start; then gated by the Play/Pause control.
  public readonly isPlayingProperty = new BooleanProperty(false);
  public readonly hasStartedProperty = new BooleanProperty(false);

  public readonly showVectorsProperty = new BooleanProperty(lunarLanderQueryParameters.showVectors);

  public readonly lowFuelProperty: TReadOnlyProperty<boolean>;

  // Readout conveniences (derived from the lander state).
  public readonly altitudeProperty: TReadOnlyProperty<number>;
  public readonly rangeProperty: TReadOnlyProperty<number>;
  public readonly vXProperty: TReadOnlyProperty<number>;
  public readonly vYProperty: TReadOnlyProperty<number>;

  // One-shot view/sound triggers.
  public readonly tiltEmitter = new Emitter<[number]>({ parameters: [{ valueType: "number" }] });
  public readonly explosionEmitter = new Emitter();

  private timeAccumulator = 0;

  private readonly preferences: LunarLanderPreferencesModel;

  public constructor(preferences: LunarLanderPreferencesModel) {
    this.preferences = preferences;
    this.showVectorsProperty.value = preferences.showVectorsProperty.value;
    this.terrain = new Terrain();

    const startX = this.terrain.startX;
    const initialPosition = new Vector2(startX, this.terrain.surfaceY(startX) + INITIAL_ALTITUDE);
    this.lander = new Lander(initialPosition);

    this.lowFuelProperty = new DerivedProperty(
      [this.lander.remainingFuelProperty],
      (fuel) => fuel <= LOW_FUEL_FRACTION * INITIAL_FUEL,
    );

    this.altitudeProperty = new DerivedProperty([this.lander.positionProperty], (pos) =>
      Math.max(0, pos.y - this.terrain.surfaceY(pos.x)),
    );
    this.rangeProperty = new DerivedProperty([this.lander.positionProperty], (pos) => pos.x);
    this.vXProperty = new DerivedProperty([this.lander.velocityProperty], (v) => v.x);
    this.vYProperty = new DerivedProperty([this.lander.velocityProperty], (v) => v.y);
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  /** Set thrust, clamped to [0, MAX_THRUST]. No-op when out of fuel (matches the original). */
  private setThrust(newThrust: number): void {
    if (this.lander.remainingFuelProperty.value <= 0) {
      return;
    }
    this.lander.thrustProperty.value = Math.max(0, Math.min(MAX_THRUST, newThrust));
  }

  public increaseThrust(): void {
    this.setThrust(this.lander.thrustProperty.value + THRUST_STEP);
  }

  public decreaseThrust(): void {
    this.setThrust(this.lander.thrustProperty.value - THRUST_STEP);
  }

  /** Space bar: toggle between full thrust and zero. */
  public toggleFullThrust(): void {
    this.setThrust(this.lander.thrustProperty.value < MAX_THRUST ? MAX_THRUST : 0);
  }

  public tiltLeft(): void {
    this.tilt(-1);
  }

  public tiltRight(): void {
    this.tilt(1);
  }

  private tilt(direction: number): void {
    if (this.crashStateProperty.value === CrashState.CRASH_LANDED) {
      return;
    }
    // The RCS puff/sound fire whenever the thrusters are used (even on a pad).
    this.tiltEmitter.emit(direction);
    if (this.crashStateProperty.value === CrashState.IN_FLIGHT) {
      this.lander.angleProperty.value += direction * TILT_STEP;
    }
  }

  /** Dismiss the start overlay and begin play. */
  public startGame(): void {
    this.hasStartedProperty.value = true;
    this.isPlayingProperty.value = true;
  }

  // ── Stepping ────────────────────────────────────────────────────────────────

  public step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }
    this.timeAccumulator = Math.min(this.timeAccumulator + dt, FIXED_DT * MAX_CATCHUP_STEPS);
    while (this.timeAccumulator >= FIXED_DT && this.isPlayingProperty.value) {
      this.timeAccumulator -= FIXED_DT;
      this.stepInternal(FIXED_DT);
    }
  }

  /** Advance the physics by exactly one fixed slice, using the original equations. */
  private stepInternal(h: number): void {
    if (this.crashStateProperty.value === CrashState.CRASH_LANDED) {
      return; // terminal — no flight after a crash until reset
    }

    const lander = this.lander;
    const pos = lander.positionProperty.value;
    const vel = lander.velocityProperty.value;
    const angle = lander.angleProperty.value;
    const fuelBefore = lander.remainingFuelProperty.value;
    const thrust = lander.thrustProperty.value;

    let x = pos.x;
    let y = pos.y;
    let vX = vel.x;
    let vY = vel.y;

    const eff = fuelBefore > 0 ? thrust : 0;
    const m = MASS_EMPTY + fuelBefore;
    let aX = (eff * Math.sin(angle)) / m;
    let aY = (eff * Math.cos(angle)) / m - GRAVITY;

    // Position-Verlet style update (identical to the Flash original).
    x += h * vX + 0.5 * h * h * aX;
    y += h * vY + 0.5 * h * h * aY;
    vX += aX * h;
    vY += aY * h;

    // Burn fuel via the rocket equation; cut thrust when the tank is empty.
    const fuel = Math.max(0, fuelBefore - (eff * h) / ISP);
    lander.remainingFuelProperty.value = fuel;
    if (fuel <= 0) {
      lander.thrustProperty.value = 0;
    }

    x = Math.max(this.terrain.minX, Math.min(this.terrain.maxX, x));
    const surf = this.terrain.surfaceY(x);

    if (this.crashStateProperty.value === CrashState.IN_FLIGHT) {
      if (this.terrain.boulderHit(x, y, LANDER_RADIUS)) {
        // Struck a boulder — game over (legs damaged, fuel lost).
        this.landingSpeedProperty.value = Math.hypot(vX, vY);
        vX = 0;
        vY = 0;
        aX = 0;
        aY = 0;
        lander.remainingFuelProperty.value = 0;
        lander.thrustProperty.value = 0;
        this.hitBoulderProperty.value = true;
        this.crashStateProperty.value = CrashState.CRASH_LANDED;
        this.explosionEmitter.emit();
      } else if (y <= surf) {
        // Touchdown.
        y = surf;
        const landingSpeed = Math.hypot(vX, vY);
        vX = 0;
        vY = 0;
        aX = 0;
        aY = 0;
        lander.thrustProperty.value = 0;
        this.landingSpeedProperty.value = landingSpeed;

        // The original literally tested `angle < 0.2` (signed); the corrected,
        // symmetric test treats either tilt direction equally.
        const level = Math.abs(angle) < LEVEL_ANGLE_TOLERANCE;
        let newState: CrashState;
        if (landingSpeed < SOFT_SPEED && level) {
          newState = CrashState.SOFT_LANDED;
        } else if (landingSpeed < HARD_SPEED && level) {
          newState = CrashState.HARD_LANDED;
        } else {
          newState = CrashState.CRASH_LANDED;
          lander.remainingFuelProperty.value = 0;
        }

        lander.angleProperty.value = 0;
        const zone = this.terrain.zoneAt(x);
        this.scoreKeeper.recordLanding(zone, newState);
        this.crashStateProperty.value = newState;
        if (newState === CrashState.CRASH_LANDED) {
          this.explosionEmitter.emit();
        }
      }
    } else if (y > surf) {
      // Was resting on a pad and has now lifted off.
      this.crashStateProperty.value = CrashState.IN_FLIGHT;
    } else {
      // Still resting on the pad.
      y = surf;
      vX = 0;
      vY = 0;
      aX = 0;
      aY = 0;
    }

    lander.positionProperty.value = new Vector2(x, y);
    lander.velocityProperty.value = new Vector2(vX, vY);
    lander.accelerationProperty.value = new Vector2(aX, aY);
  }

  public reset(): void {
    this.lander.reset();
    this.scoreKeeper.reset();
    this.crashStateProperty.reset();
    this.landingSpeedProperty.reset();
    this.hitBoulderProperty.reset();
    this.isPlayingProperty.reset();
    this.hasStartedProperty.reset();
    this.showVectorsProperty.reset();
    this.showVectorsProperty.value = this.preferences.showVectorsProperty.value;
    this.timeAccumulator = 0;
  }
}
