/**
 * TerrainNode.ts
 *
 * Draws the lunar surface as a softly-rolling, shaded landform (rather than a
 * raw polygon of straight segments), markers highlighting the flat landing
 * pads, and 3-D-shaded boulders. The collision geometry still lives in the
 * model (Terrain); this is purely the iconic, Flash-style presentation:
 *   - the silhouette's sharp corners are rounded into hills,
 *   - the body is filled with a sunlit-to-shadow vertical gradient,
 *   - a bright rim traces the lit top edge,
 *   - a sprinkle of craters/speckle gives it a dusty lunar texture,
 *   - boulders are irregular rocks lit from the upper-left.
 */
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Line, LinearGradient, Node, Path, RadialGradient } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { Terrain } from "../model/Terrain.js";

// Small deterministic PRNG (mulberry32) so the texture/boulders are identical every run.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Largest fillet radius (view px) used to round the terrain's corners into hills.
const CORNER_RADIUS = 26;

/** Append a rounded-corner polyline (open) to `shape`: long runs stay straight, corners curve. */
function appendRoundedTop(shape: Shape, points: Vector2[], maxRadius: number): void {
  const first = points[0];
  if (!first) {
    return;
  }
  shape.moveToPoint(first);
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as Vector2;
    const cur = points[i] as Vector2;
    const next = points[i + 1] as Vector2;
    const toPrev = prev.minus(cur);
    const toNext = next.minus(cur);
    const r = Math.min(maxRadius, toPrev.magnitude * 0.5, toNext.magnitude * 0.5);
    if (r < 0.5) {
      shape.lineToPoint(cur);
      continue;
    }
    shape.lineToPoint(cur.plus(toPrev.withMagnitude(r)));
    shape.quadraticCurveToPoint(cur, cur.plus(toNext.withMagnitude(r)));
  }
  shape.lineToPoint(points[points.length - 1] as Vector2);
}

export class TerrainNode extends Node {
  public constructor(terrain: Terrain, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false });

    // ── Top profile (one point per segment vertex, in view px) ──────────────
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
    if (points.length < 2) {
      return;
    }

    const minX = modelViewTransform.modelToViewX(terrain.minX);
    const maxX = modelViewTransform.modelToViewX(terrain.maxX);
    const bottomY = modelViewTransform.modelToViewY(LunarLanderConstants.MODEL_MIN_Y);
    const topY = Math.min(...points.map((p) => p.y));

    // ── Filled body (rounded top, closed down to the world floor) ───────────
    const bodyShape = new Shape();
    appendRoundedTop(bodyShape, points, CORNER_RADIUS);
    bodyShape.lineTo(maxX, bottomY);
    bodyShape.lineTo(minX, bottomY);
    bodyShape.close();

    const fill = new LinearGradient(0, topY, 0, bottomY);
    fill.addColorStop(0, LunarLanderColors.terrainHighlightColorProperty);
    fill.addColorStop(0.18, LunarLanderColors.terrainColorProperty);
    fill.addColorStop(1, LunarLanderColors.terrainShadowColorProperty);
    const body = new Path(bodyShape, { fill });
    this.addChild(body);

    // ── Dusty texture: craters + speckle, clipped to the terrain body ───────
    this.addChild(TerrainNode.buildTexture(terrain, modelViewTransform, bodyShape, minX, maxX));

    // ── Lit top edge: a darker base line under a bright sunlit rim ───────────
    const rimShape = new Shape();
    appendRoundedTop(rimShape, points, CORNER_RADIUS);
    this.addChild(new Path(rimShape, { stroke: LunarLanderColors.terrainStrokeColorProperty, lineWidth: 3 }));
    this.addChild(new Path(rimShape, { stroke: LunarLanderColors.terrainRimColorProperty, lineWidth: 1.4 }));

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
      this.addChild(TerrainNode.buildBoulder(center.x, center.y, viewRadius, boulder.x));
    }
  }

  /** Craters and speckle scattered just under the surface, clipped to the body. */
  private static buildTexture(
    terrain: Terrain,
    modelViewTransform: ModelViewTransform2,
    clipShape: Shape,
    minX: number,
    maxX: number,
  ): Node {
    const layer = new Node({ pickable: false, clipArea: clipShape });
    const rand = mulberry32(0x10a5e7);
    const viewWidth = maxX - minX;
    const count = Math.max(24, Math.round(viewWidth / 26));

    for (let i = 0; i < count; i++) {
      const x = minX + rand() * viewWidth;
      // Place the dimple wholly below the surface so it never pokes through the rim.
      const surfaceY = modelViewTransform.modelToViewY(terrain.surfaceY(modelViewTransform.viewToModelX(x)));
      const radius = 1.6 + rand() * 5;
      const y = surfaceY + radius + 3 + rand() * 26;
      if (rand() < 0.45) {
        // A small crater: shadowed bowl with a faint lit lower rim.
        layer.addChild(new Circle(radius, { x, y, fill: LunarLanderColors.terrainCraterColorProperty }));
        layer.addChild(
          new Circle(radius, {
            x,
            y: y + radius * 0.5,
            fill: LunarLanderColors.terrainRimColorProperty,
            opacity: 0.18,
          }),
        );
      } else {
        // A speckle of dust.
        layer.addChild(
          new Circle(radius * 0.5, { x, y, fill: LunarLanderColors.terrainCraterColorProperty, opacity: 0.5 }),
        );
      }
    }
    return layer;
  }

  /** An irregular rock lit from the upper-left, seated at (cx, cy) with rough radius r. */
  private static buildBoulder(cx: number, cy: number, r: number, seedX: number): Node {
    const node = new Node({ x: cx, y: cy, pickable: false });
    const rand = mulberry32(0x9e37 + Math.round(seedX * 131));

    // Build a lumpy closed outline (local coords around the origin).
    const lobes = 9;
    const pts: Vector2[] = [];
    for (let i = 0; i < lobes; i++) {
      const angle = (i / lobes) * 2 * Math.PI;
      const radius = r * (0.78 + rand() * 0.34);
      pts.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }

    // Smooth the polygon with quadratics through edge midpoints (closed loop).
    const shape = new Shape();
    const mid = (a: Vector2, b: Vector2) => a.average(b);
    shape.moveToPoint(mid(pts[lobes - 1] as Vector2, pts[0] as Vector2));
    for (let i = 0; i < lobes; i++) {
      const cur = pts[i] as Vector2;
      const next = pts[(i + 1) % lobes] as Vector2;
      shape.quadraticCurveToPoint(cur, mid(cur, next));
    }
    shape.close();

    // Light from the upper-left: highlight near (−r/3, −2r/5), shadow at the far edge.
    const fill = new RadialGradient(-r * 0.32, -r * 0.4, r * 0.08, 0, 0, r * 1.15);
    fill.addColorStop(0, LunarLanderColors.boulderHighlightColorProperty);
    fill.addColorStop(0.55, LunarLanderColors.boulderColorProperty);
    fill.addColorStop(1, LunarLanderColors.boulderShadowColorProperty);
    node.addChild(new Path(shape, { fill, stroke: LunarLanderColors.boulderStrokeColorProperty, lineWidth: 1.2 }));

    // A small specular pop on the lit shoulder.
    node.addChild(
      new Circle(r * 0.16, {
        x: -r * 0.34,
        y: -r * 0.4,
        fill: LunarLanderColors.boulderHighlightColorProperty,
        opacity: 0.7,
      }),
    );
    return node;
  }
}
