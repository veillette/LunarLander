/**
 * TerrainNode.ts
 *
 * Draws the lunar surface (a filled polygon from the terrain segments), markers
 * highlighting the flat landing pads, and the boulders. Built directly in view
 * coordinates from the model-view transform.
 */
import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Line, Node, Path } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { Terrain } from "../model/Terrain.js";

export class TerrainNode extends Node {
  public constructor(terrain: Terrain, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false });

    // ── Surface polygon ─────────────────────────────────────────────────────
    const shape = new Shape();
    const points: Vector2[] = [];
    const segments = terrain.segments;
    const first = segments[0];
    if (first) {
      const startHeight = first.kind === "flat" ? first.height : first.height0;
      points.push(modelViewTransform.modelToViewXY(first.x0, startHeight));
    }
    for (const segment of segments) {
      const endHeight = segment.kind === "flat" ? segment.height : segment.height1;
      points.push(modelViewTransform.modelToViewXY(segment.x1, endHeight));
    }

    const firstPoint = points[0];
    if (firstPoint) {
      shape.moveToPoint(firstPoint);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        if (p) {
          shape.lineToPoint(p);
        }
      }
      // Close down to the bottom of the world and back.
      const bottomY = modelViewTransform.modelToViewY(LunarLanderConstants.MODEL_MIN_Y);
      shape.lineTo(modelViewTransform.modelToViewX(terrain.maxX), bottomY);
      shape.lineTo(modelViewTransform.modelToViewX(terrain.minX), bottomY);
      shape.close();
    }

    this.addChild(
      new Path(shape, {
        fill: LunarLanderColors.terrainColorProperty,
        stroke: LunarLanderColors.terrainStrokeColorProperty,
        lineWidth: 1.5,
      }),
    );

    // ── Landing-pad markers ─────────────────────────────────────────────────
    for (const segment of segments) {
      if (segment.kind === "flat") {
        const p0 = modelViewTransform.modelToViewXY(segment.x0, segment.height);
        const p1 = modelViewTransform.modelToViewXY(segment.x1, segment.height);
        this.addChild(
          new Line(p0.x, p0.y, p1.x, p1.y, {
            stroke: LunarLanderColors.landingZoneColorProperty,
            lineWidth: 4,
            lineCap: "round",
          }),
        );
      }
    }

    // ── Boulders ────────────────────────────────────────────────────────────
    for (const boulder of terrain.boulders) {
      const center = modelViewTransform.modelToViewXY(boulder.x, boulder.surface + boulder.radius);
      const viewRadius = Math.abs(modelViewTransform.modelToViewDeltaX(boulder.radius));
      this.addChild(
        new Circle(viewRadius, {
          x: center.x,
          y: center.y,
          fill: LunarLanderColors.boulderColorProperty,
          stroke: LunarLanderColors.boulderStrokeColorProperty,
          lineWidth: 1.5,
        }),
      );
    }
  }
}
