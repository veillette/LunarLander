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

// Wide stretches of empty rolling hills flanking the scored pads, so the moon
// extends well beyond a single screen — the view pans to follow the lander and,
// when it climbs, zooms out to reveal more of this terrain.
const LEFT_MARGIN = 240; // m of rolling hills before the lead-in
const RIGHT_MARGIN = 240; // m of rolling hills after the tail
const HILL_STEP = 12; // m between hill vertices

/**
 * Append a run of gentle, deterministic rolling hills as slope segments from
 * (x0, hStart) to (x1, hEnd). The undulation is enveloped to zero at both ends
 * (sin πt) so each margin joins its neighbour at exactly hStart / hEnd.
 */
function appendHills(segments: TerrainSegment[], x0: number, x1: number, hStart: number, hEnd: number): void {
  const span = x1 - x0;
  const steps = Math.max(2, Math.round(span / HILL_STEP));
  let prevX = x0;
  let prevH = hStart;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + t * span;
    const base = hStart + (hEnd - hStart) * t;
    const envelope = Math.sin(Math.PI * t); // 0 at both ends, 1 in the middle
    const undulation = envelope * (7 * Math.sin(x * 0.08) + 4 * Math.sin(x * 0.19 + 1.3));
    const h = i === steps ? hEnd : base + undulation;
    segments.push({ kind: "slope", x0: prevX, x1: x, height0: prevH, height1: h });
    prevX = x;
    prevH = h;
  }
}

function build(): TerrainData {
  const scores = LunarLanderConstants.SPOT_SCORES;
  const segments: TerrainSegment[] = [];
  const boulders: Boulder[] = [];

  let x = 0;
  let startX = LunarLanderConstants.INITIAL_X;

  const firstHeight = PAD_HEIGHTS[0];

  // Left margin of rolling hills, leading into the original lead-in slope.
  appendHills(segments, 0, LEFT_MARGIN, 30, firstHeight - 4);
  x = LEFT_MARGIN;

  // Lead-in slope up to the first pad.
  segments.push({ kind: "slope", x0: x, x1: x + LEAD_IN, height0: firstHeight - 4, height1: firstHeight });
  x += LEAD_IN;

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

  // Tail slope down off the last pad, then a right margin of rolling hills.
  const lastHeight = PAD_HEIGHTS[14];
  segments.push({ kind: "slope", x0: x, x1: x + TAIL, height0: lastHeight, height1: lastHeight - 6 });
  x += TAIL;
  appendHills(segments, x, x + RIGHT_MARGIN, lastHeight - 6, 28);
  x += RIGHT_MARGIN;

  return { segments, boulders, minX: 0, maxX: x, startX };
}

const TERRAIN_DATA: TerrainData = build();

export default TERRAIN_DATA;
