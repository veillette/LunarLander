/**
 * LunarLanderSoundView.ts
 *
 * Procedurally synthesized sound (the original Flash audio assets are locked in
 * the .fla and could not be extracted). Uses tambo oscillators + a noise burst:
 *   - a continuous thrust drone whose level tracks the effective thrust,
 *   - a short RCS blip on each tilt,
 *   - a low-fuel / empty-tank alarm beep,
 *   - a noise burst on explosion.
 * All generators are registered with tambo's soundManager, so the
 * navigation-bar speaker mutes them globally.
 */
import { Multilink } from "scenerystack/axon";
import { NoiseGenerator, OscillatorSoundGenerator, soundManager } from "scenerystack/tambo";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { MAX_THRUST } = LunarLanderConstants;

const RCS_BEEP_DURATION = 0.12; // s
const ALARM_BEEP_DURATION = 0.3; // s
const EXPLOSION_DURATION = 0.7; // s

export class LunarLanderSoundView {
  private readonly thrust: OscillatorSoundGenerator;
  private readonly rcs: OscillatorSoundGenerator;
  private readonly alarm: OscillatorSoundGenerator;
  private readonly explosion: NoiseGenerator;

  private rcsTimer = 0;
  private alarmTimer = 0;
  private explosionTimer = 0;

  public constructor(model: LunarLanderModel) {
    this.thrust = new OscillatorSoundGenerator({ initialFrequency: 90, initialOutputLevel: 0 });
    this.rcs = new OscillatorSoundGenerator({ initialFrequency: 320, initialOutputLevel: 0 });
    this.alarm = new OscillatorSoundGenerator({ initialFrequency: 740, initialOutputLevel: 0 });
    this.explosion = new NoiseGenerator({ noiseType: "brown", initialOutputLevel: 0 });

    soundManager.addSoundGenerator(this.thrust);
    soundManager.addSoundGenerator(this.rcs);
    soundManager.addSoundGenerator(this.alarm);
    soundManager.addSoundGenerator(this.explosion);

    // Oscillators run continuously at level 0; we modulate output level to play.
    this.thrust.play();
    this.rcs.play();
    this.alarm.play();
    this.explosion.start();

    // Thrust drone tracks the effective thrust fraction.
    Multilink.multilink([model.lander.thrustProperty, model.lander.remainingFuelProperty], (thrust, fuel) => {
      const fraction = fuel > 0 ? thrust / MAX_THRUST : 0;
      this.thrust.setOutputLevel(fraction > 0.01 ? 0.18 * fraction : 0, 0.05);
    });

    // RCS blip on each tilt.
    model.tiltEmitter.addListener(() => {
      this.rcs.setOutputLevel(0.12, 0.01);
      this.rcsTimer = RCS_BEEP_DURATION;
    });

    // Explosion noise burst.
    model.explosionEmitter.addListener(() => {
      this.explosion.setOutputLevel(0.4, 0.02);
      this.explosionTimer = EXPLOSION_DURATION;
    });

    // Low-fuel and empty-tank alarm beeps (fire on the transition, like the original).
    model.lowFuelProperty.lazyLink((low) => {
      if (low) {
        this.beepAlarm();
      }
    });
    model.lander.remainingFuelProperty.lazyLink((fuel, oldFuel) => {
      if (fuel === 0 && oldFuel > 0) {
        this.beepAlarm();
      }
    });
  }

  private beepAlarm(): void {
    this.alarm.setOutputLevel(0.15, 0.01);
    this.alarmTimer = ALARM_BEEP_DURATION;
  }

  public step(dt: number): void {
    if (this.rcsTimer > 0) {
      this.rcsTimer -= dt;
      if (this.rcsTimer <= 0) {
        this.rcs.setOutputLevel(0, 0.02);
      }
    }
    if (this.alarmTimer > 0) {
      this.alarmTimer -= dt;
      if (this.alarmTimer <= 0) {
        this.alarm.setOutputLevel(0, 0.02);
      }
    }
    if (this.explosionTimer > 0) {
      this.explosionTimer -= dt;
      if (this.explosionTimer <= 0) {
        this.explosion.setOutputLevel(0, 0.05);
      }
    }
  }
}
