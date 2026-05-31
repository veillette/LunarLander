/**
 * AttitudeIndicatorNode.ts
 *
 * A small dial showing the lander's tilt: a craft marker rotates within a fixed
 * ring to indicate the current angle. Rotation matches the lander sprite, so a
 * positive tilt leans the marker toward +x.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";

const RADIUS = 22;

export class AttitudeIndicatorNode extends Node {
  public constructor(angleProperty: TReadOnlyProperty<number>) {
    super({ pickable: false });

    const ring = new Circle(RADIUS, {
      fill: LunarLanderColors.readoutBackgroundColorProperty,
      stroke: LunarLanderColors.panelStrokeProperty,
      lineWidth: 1.5,
    });

    // Fixed top reference tick (level / 0°).
    const topTick = new Line(0, -RADIUS, 0, -RADIUS + 6, {
      stroke: LunarLanderColors.foregroundColorProperty,
      lineWidth: 2,
    });

    // Rotating craft marker (an upward triangle).
    const marker = new Path(new Shape().moveTo(0, -12).lineTo(7, 8).lineTo(-7, 8).close(), {
      fill: LunarLanderColors.landerAccentColorProperty,
      stroke: LunarLanderColors.foregroundColorProperty,
      lineWidth: 1,
    });

    this.children = [ring, topTick, marker];

    angleProperty.link((angle) => {
      marker.rotation = angle;
    });
  }
}
