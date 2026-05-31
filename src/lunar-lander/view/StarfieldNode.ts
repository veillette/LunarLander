/**
 * StarfieldNode.ts
 *
 * The space backdrop: a deterministic scatter of stars plus a small moon
 * decoration. Purely decorative — no model binding. The screen's background
 * color (deep space / white in projector mode) is set on the Screen itself.
 */
import type { Bounds2 } from "scenerystack/dot";
import { Circle, Node } from "scenerystack/scenery";
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

    // Moon decoration in the upper-left.
    const moonRadius = 22;
    const moonX = bounds.minX + bounds.width * 0.16;
    const moonY = bounds.minY + bounds.height * 0.16;
    const moon = new Circle(moonRadius, { x: moonX, y: moonY, fill: LunarLanderColors.moonColorProperty });
    this.addChild(moon);
    // A couple of craters.
    moon.addChild(new Circle(4, { x: -6, y: -4, fill: LunarLanderColors.moonColorProperty, opacity: 0.5 }));
    moon.addChild(new Circle(3, { x: 7, y: 3, fill: LunarLanderColors.moonColorProperty, opacity: 0.5 }));
    moon.addChild(new Circle(2.5, { x: 2, y: -9, fill: LunarLanderColors.moonColorProperty, opacity: 0.5 }));
  }
}
