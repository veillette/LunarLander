/**
 * StarfieldNode.ts
 *
 * The space backdrop: a deterministic scatter of stars plus Earth — the blue
 * marble you'd see hanging in the black sky from the Moon's surface. Purely
 * decorative — no model binding. The screen's background color (deep space /
 * white in projector mode) is set on the Screen itself.
 */

import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, RadialGradient } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";

// Small deterministic PRNG (mulberry32) so the starfield is identical every run.
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

/** A closed, smoothly-lumpy blob (continents, clouds) centered on the origin. */
function lumpyBlob(rand: () => number, radius: number, lobes: number): Shape {
  const pts: Vector2[] = [];
  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * 2 * Math.PI;
    const r = radius * (0.5 + rand() * 0.75);
    pts.push(new Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
  }
  const shape = new Shape();
  const mid = (a: Vector2, b: Vector2) => a.average(b);
  shape.moveToPoint(mid(pts[lobes - 1] as Vector2, pts[0] as Vector2));
  for (let i = 0; i < lobes; i++) {
    const cur = pts[i] as Vector2;
    const next = pts[(i + 1) % lobes] as Vector2;
    shape.quadraticCurveToPoint(cur, mid(cur, next));
  }
  shape.close();
  return shape;
}

export class StarfieldNode extends Node {
  public constructor(bounds: Bounds2) {
    super({ pickable: false });

    const rand = mulberry32(0x1ec3a17);
    for (let i = 0; i < LunarLanderConstants.STAR_COUNT; i++) {
      const x = bounds.minX + rand() * bounds.width;
      // Keep stars in the upper ~80% so they don't litter the ground.
      const y = bounds.minY + rand() * bounds.height * 0.8;
      const radius = 0.4 + rand() * 1.3;
      this.addChild(
        new Circle(radius, {
          x,
          y,
          fill: LunarLanderColors.starColorProperty,
          opacity: 0.4 + rand() * 0.6,
        }),
      );
    }

    this.addChild(StarfieldNode.buildEarth(bounds));
  }

  /**
   * Earth in the upper-left: a blue ocean sphere shaded 3-D (sun from the
   * upper-left), green continents and white clouds clipped to the disk, polar
   * ice caps, a shadowed night side, and a thin atmospheric halo + limb.
   */
  private static buildEarth(bounds: Bounds2): Node {
    const radius = 24;
    const earth = new Node({
      x: bounds.minX + bounds.width * 0.16,
      y: bounds.minY + bounds.height * 0.16,
      pickable: false,
    });

    // ── Atmospheric glow: stacked translucent rings peeking out behind the disk ──
    earth.addChild(new Circle(radius + 4, { fill: LunarLanderColors.earthAtmosphereColorProperty, opacity: 0.1 }));
    earth.addChild(new Circle(radius + 2, { fill: LunarLanderColors.earthAtmosphereColorProperty, opacity: 0.18 }));

    // ── Ocean sphere, lit from the upper-left ───────────────────────────────────
    const ocean = new RadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.1, 0, 0, radius * 1.15);
    ocean.addColorStop(0, LunarLanderColors.earthOceanHighlightColorProperty);
    ocean.addColorStop(0.6, LunarLanderColors.earthOceanColorProperty);
    ocean.addColorStop(1, LunarLanderColors.earthOceanShadowColorProperty);
    earth.addChild(new Circle(radius, { fill: ocean }));

    // Everything painted on the globe is clipped to the disk so it never spills.
    const surface = new Node({ clipArea: Shape.circle(0, 0, radius) });
    earth.addChild(surface);

    // ── Continents: green blobs with a slight drop-shadow for relief ────────────
    const landRand = mulberry32(0xea27d);
    const continents = [
      { x: -8, y: -7, r: 11, lobes: 8 },
      { x: 8, y: 1, r: 13, lobes: 9 },
      { x: -3, y: 12, r: 8, lobes: 7 },
      { x: 12, y: -10, r: 6, lobes: 6 },
    ];
    for (const c of continents) {
      const shape = lumpyBlob(landRand, c.r, c.lobes);
      surface.addChild(
        new Path(shape, { x: c.x + 1, y: c.y + 1.5, fill: LunarLanderColors.earthLandShadowColorProperty }),
      );
      surface.addChild(new Path(shape, { x: c.x, y: c.y, fill: LunarLanderColors.earthLandColorProperty }));
    }

    // ── Polar ice caps (clipped to crescents at the top and bottom) ─────────────
    surface.addChild(
      new Circle(8, { x: 0, y: -radius + 2, fill: LunarLanderColors.earthIceColorProperty, opacity: 0.9 }),
    );
    surface.addChild(
      new Circle(7, { x: 3, y: radius - 1, fill: LunarLanderColors.earthIceColorProperty, opacity: 0.85 }),
    );

    // ── Wispy clouds ────────────────────────────────────────────────────────────
    const cloudRand = mulberry32(0xc10d5);
    for (let i = 0; i < 6; i++) {
      const angle = cloudRand() * 2 * Math.PI;
      const dist = cloudRand() * radius * 0.8;
      surface.addChild(
        new Path(lumpyBlob(cloudRand, 4 + cloudRand() * 4, 7), {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          fill: LunarLanderColors.earthCloudColorProperty,
          opacity: 0.45 + cloudRand() * 0.3,
        }),
      );
    }

    // ── Night side: a soft shadow swelling from the lower-right ──────────────────
    surface.addChild(
      new Circle(radius, {
        x: radius * 0.55,
        y: radius * 0.55,
        fill: LunarLanderColors.earthOceanShadowColorProperty,
        opacity: 0.32,
      }),
    );

    // ── Bright atmospheric limb on the lit edge ─────────────────────────────────
    earth.addChild(
      new Circle(radius, { stroke: LunarLanderColors.earthAtmosphereColorProperty, lineWidth: 1.2, opacity: 0.5 }),
    );

    return earth;
  }
}
