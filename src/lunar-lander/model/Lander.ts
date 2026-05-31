/**
 * Lander.ts
 *
 * The lunar module's kinematic state, as a cohesive sub-model of reactive
 * Properties. Position is the lander's ABSOLUTE location (x, yAbs) in model
 * metres; the model integrates these with the original physics equations.
 */
import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range, Vector2, Vector2Property } from "scenerystack/dot";
import LunarLanderConstants from "./LunarLanderConstants.js";

const { MASS_EMPTY, INITIAL_FUEL, MAX_THRUST, GRAVITY, INITIAL_ANGLE, INITIAL_THRUST } = LunarLanderConstants;

export class Lander {
  private readonly initialPosition: Vector2;

  public readonly positionProperty: Vector2Property;
  public readonly velocityProperty: Vector2Property;
  public readonly accelerationProperty: Vector2Property;
  public readonly angleProperty: NumberProperty;
  public readonly thrustProperty: NumberProperty;
  public readonly remainingFuelProperty: NumberProperty;
  public readonly massProperty: TReadOnlyProperty<number>;

  public constructor(initialPosition: Vector2) {
    this.initialPosition = initialPosition;

    this.positionProperty = new Vector2Property(initialPosition.copy());
    this.velocityProperty = new Vector2Property(new Vector2(0, 0));
    this.accelerationProperty = new Vector2Property(new Vector2(0, -GRAVITY));
    this.angleProperty = new NumberProperty(INITIAL_ANGLE);
    this.thrustProperty = new NumberProperty(INITIAL_THRUST, { range: new Range(0, MAX_THRUST) });
    this.remainingFuelProperty = new NumberProperty(INITIAL_FUEL, { range: new Range(0, INITIAL_FUEL) });

    this.massProperty = new DerivedProperty([this.remainingFuelProperty], (fuel) => MASS_EMPTY + fuel);
  }

  public reset(): void {
    this.positionProperty.value = this.initialPosition.copy();
    this.velocityProperty.reset();
    this.accelerationProperty.reset();
    this.angleProperty.reset();
    this.thrustProperty.reset();
    this.remainingFuelProperty.reset();
  }
}
