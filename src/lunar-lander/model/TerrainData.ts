/**
 * TerrainData.ts
 *
 * Hand-designed, fixed lunar terrain. The original geometry lived inside the
 * binary .fla and could not be extracted, so this recreates a representative
 * surface that matches the original's gameplay:
 *   - 15 flat landing pads, one per scored zone (zoneIndex 1..15)
 *   - pad WIDTH is inversely related to its point value (narrow = worth more)
 *   - gentle slopes between pads, with a few boulders as obstacles
 *
 * The layout is deterministic (no randomness) so every game uses the same,
 * tuned terrain. Pads are laid left-to-right; the total width defines the
 * model's horizontal extent (see Terrain.maxX).
 */
import LunarLanderConstants from "./LunarLanderConstants.js";

export type FlatSegment = { kind: "flat"; x0: number; x1: number; height: number; zoneIndex: number };
export type SlopeSegment = { kind: "slope"; x0: number; x1: number; height0: number; height1: number };
export type TerrainSegment = FlatSegment | SlopeSegment;
export type Boulder = { x: number; surface: number; radius: number };

export type TerrainData = {
  readonly segments: ReadonlyArray<TerrainSegment>;
  readonly boulders: ReadonlyArray<Boulder>;
  readonly minX: number;
  readonly maxX: number;
  readonly startX: number;
};

// Pad width (m) as a function of its point value: smaller score ⇒ wider/easier pad.
function widthForScore(score: number): number {
  if (score >= 50) {
    return 7;
  }
  if (score >= 30) {
    return 8;
  }
  if (score >= 10) {
    return 10;
  }
  return 14; // 5-point pads are the widest
}

// Hand-tuned pad elevations (m), one per zone — gentle lunar undulation.
const PAD_HEIGHTS = [28, 24, 30, 22, 34, 26, 32, 24, 30, 26, 36, 22, 30, 40, 26] as const;

// Zone the lander starts above (a wide, easy 5-point pad).
const START_ZONE = 4;

// Gaps (between consecutive pads) that carry a boulder, keyed by the left zone index.
const BOULDER_GAPS = new Set<number>([2, 6, 11]);

const LEAD_IN = 16; // m of terrain before the first pad
const BASE_GAP = 7; // m between pads
const BOULDER_GAP = 16; // m for gaps that hold a boulder
const TAIL = 18; // m of terrain after the last pad

function build(): TerrainData {
  const scores = LunarLanderConstants.SPOT_SCORES;
  const segments: TerrainSegment[] = [];
  const boulders: Boulder[] = [];

  let x = 0;
  let startX = LunarLanderConstants.INITIAL_X;

  // Lead-in slope from x=0 up to the first pad.
  const firstHeight = PAD_HEIGHTS[0];
  segments.push({ kind: "slope", x0: 0, x1: LEAD_IN, height0: firstHeight - 4, height1: firstHeight });
  x = LEAD_IN;

  for (let zone = 1; zone <= 15; zone++) {
    const height = PAD_HEIGHTS[zone - 1] ?? 28;
    const width = widthForScore(scores[zone] ?? 5);

    // The flat landing pad for this zone.
    segments.push({ kind: "flat", x0: x, x1: x + width, height, zoneIndex: zone });
    if (zone === START_ZONE) {
      startX = x + width / 2;
    }
    x += width;

    // Slope down/up to the next pad (or a tail after the last).
    if (zone < 15) {
      const nextHeight = PAD_HEIGHTS[zone] ?? height;
      const hasBoulder = BOULDER_GAPS.has(zone);
      const gap = hasBoulder ? BOULDER_GAP : BASE_GAP;
      segments.push({ kind: "slope", x0: x, x1: x + gap, height0: height, height1: nextHeight });
      if (hasBoulder) {
        const bx = x + gap / 2;
        const surface = (height + nextHeight) / 2;
        boulders.push({ x: bx, surface, radius: 6 });
      }
      x += gap;
    }
  }

  // Tail slope down off the right edge.
  const lastHeight = PAD_HEIGHTS[14];
  segments.push({ kind: "slope", x0: x, x1: x + TAIL, height0: lastHeight, height1: lastHeight - 6 });
  x += TAIL;

  return { segments, boulders, minX: 0, maxX: x, startX };
}

const TERRAIN_DATA: TerrainData = build();

export default TERRAIN_DATA;
