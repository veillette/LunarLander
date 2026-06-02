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

  /**
   * Dusty surface detail, all clipped to the terrain body and layered back-to-front:
   *   1. broad, very faint "mare" patches that give the regolith tonal variation,
   *   2. 3-D craters (raised lit rim on the sunward side, shadowed bowl, lit far wall),
   *   3. scattered pebbles (a dark rock with a tiny lit cap),
   *   4. a dense sprinkle of fine grain.
   * Sun is from the upper-left, matching the boulders.
   */
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

    // Surface Y (view px) directly below a given view x.
    const surfaceViewY = (x: number) =>
      modelViewTransform.modelToViewY(terrain.surfaceY(modelViewTransform.viewToModelX(x)));

    // ── 1. Broad mare patches: overlapping low-opacity dark blobs for soft shading ──
    const mareCount = Math.max(3, Math.round(viewWidth / 220));
    for (let i = 0; i < mareCount; i++) {
      const x = minX + rand() * viewWidth;
      const r = 50 + rand() * 90;
      const y = surfaceViewY(x) + r * 0.55 + rand() * 50;
      // A couple of stacked translucent discs read as a soft, edgeless smudge.
      layer.addChild(new Circle(r, { x, y, fill: LunarLanderColors.terrainShadowColorProperty, opacity: 0.1 }));
      layer.addChild(
        new Circle(r * 0.6, { x, y: y - r * 0.1, fill: LunarLanderColors.terrainShadowColorProperty, opacity: 0.12 }),
      );
    }

    // ── 2. Craters ──────────────────────────────────────────────────────────────
    const craterCount = Math.max(14, Math.round(viewWidth / 44));
    for (let i = 0; i < craterCount; i++) {
      const x = minX + rand() * viewWidth;
      const radius = 3 + rand() * 7;
      // Keep the whole crater (incl. its rim halo) below the surface so it never pokes through.
      const y = surfaceViewY(x) + radius * 1.4 + 3 + rand() * 24;
      const fresh = rand() < 0.35;

      // Raised rim catching the sun on the upper-left.
      layer.addChild(
        new Circle(radius * 1.2, {
          x: x - radius * 0.12,
          y: y - radius * 0.12,
          fill: LunarLanderColors.terrainHighlightColorProperty,
          opacity: fresh ? 0.45 : 0.22,
        }),
      );
      // Shadowed bowl.
      layer.addChild(
        new Circle(radius, { x, y, fill: LunarLanderColors.terrainCraterColorProperty, opacity: fresh ? 1 : 0.8 }),
      );
      // Lit far wall on the lower-right (away from the sun).
      layer.addChild(
        new Circle(radius * 0.78, {
          x: x + radius * 0.3,
          y: y + radius * 0.32,
          fill: LunarLanderColors.terrainRimColorProperty,
          opacity: 0.22,
        }),
      );
    }

    // ── 3. Pebbles: a dark rock with a tiny lit cap on the sunward shoulder ────────
    const pebbleCount = Math.max(20, Math.round(viewWidth / 34));
    for (let i = 0; i < pebbleCount; i++) {
      const x = minX + rand() * viewWidth;
      const radius = 1.2 + rand() * 2.6;
      const y = surfaceViewY(x) + radius + 4 + rand() * 28;
      layer.addChild(new Circle(radius, { x, y, fill: LunarLanderColors.terrainShadowColorProperty, opacity: 0.55 }));
      layer.addChild(
        new Circle(radius * 0.5, {
          x: x - radius * 0.3,
          y: y - radius * 0.3,
          fill: LunarLanderColors.terrainHighlightColorProperty,
          opacity: 0.6,
        }),
      );
    }

    // ── 4. Fine grain: a dense sprinkle of faint dust specks ───────────────────────
    const grainCount = Math.max(80, Math.round(viewWidth / 8));
    for (let i = 0; i < grainCount; i++) {
      const x = minX + rand() * viewWidth;
      const radius = 0.5 + rand() * 1.4;
      const y = surfaceViewY(x) + radius + 2 + rand() * 40;
      const dark = rand() < 0.5;
      layer.addChild(
        new Circle(radius, {
          x,
          y,
          fill: dark ? LunarLanderColors.terrainCraterColorProperty : LunarLanderColors.terrainRimColorProperty,
          opacity: 0.2 + rand() * 0.3,
        }),
      );
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
