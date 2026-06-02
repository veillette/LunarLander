/**
 * TerrainData.ts
 *
 * A wide, fixed lunar surface. The original geometry lived inside the binary
 * .fla and could not be extracted, so this generates a representative field:
 *   - 40 flat landing pads (zoneIndex 1..40) spread across the surface
 *   - pad WIDTH is inversely related to its point value (narrow = worth more)
 *   - rolling-hill gaps between pads, with 35 boulders scattered as obstacles
 *
 * The layout is generated from a fixed seed, so it is fully deterministic: every
 * game uses the same terrain. Pads are laid left-to-right; the total width defines
 * the model's horizontal extent (see Terrain.maxX).
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

// ── Generator parameters ──────────────────────────────────────────────────────
const PAD_COUNT = 40; // scored landing pads spread across the surface
const BOULDER_COUNT = 35; // obstacle boulders scattered through the inter-pad gaps
const START_PAD = 19; // 0-based index of the wide, easy pad the lander starts above

const LEAD = 130; // m of rolling hills before the first pad
const TAIL = 150; // m of rolling hills after the last pad
const MIN_GAP = 30; // m — minimum hill gap between pads (keeps boulders clear of pads)
const GAP_SPREAD = 24; // m — extra random gap width on top of MIN_GAP
const HILL_STEP = 12; // m between hill vertices

// Small deterministic PRNG (mulberry32) so the generated terrain is identical every run.
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

// Gentle, deterministic per-pad elevation (m), bounded well under the world top.
function padHeight(i: number): number {
  return 30 + 11 * Math.sin(i * 0.55 + 0.7) + 5 * Math.sin(i * 1.9);
}

/**
 * Append a run of gentle, deterministic rolling hills as slope segments from
 * (x0, hStart) to (x1, hEnd). The undulation is enveloped to zero at both ends
 * (sin πt) so each run joins its neighbour at exactly hStart / hEnd.
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

/** Surface elevation at x over already-built segments (mirrors Terrain.surfaceY). */
function surfaceYAt(segments: ReadonlyArray<TerrainSegment>, x: number): number {
  for (const s of segments) {
    if (x >= s.x0 && x <= s.x1) {
      if (s.kind === "flat") {
        return s.height;
      }
      const t = s.x1 === s.x0 ? 0 : (x - s.x0) / (s.x1 - s.x0);
      return s.height0 + t * (s.height1 - s.height0);
    }
  }
  return 0;
}

function build(): TerrainData {
  const scores = LunarLanderConstants.SPOT_SCORES;
  const rand = mulberry32(0x5eed42);
  const segments: TerrainSegment[] = [];
  const boulders: Boulder[] = [];

  let x = 0;
  let startX = LunarLanderConstants.INITIAL_X;

  // Leading margin of rolling hills up to the first pad.
  appendHills(segments, x, x + LEAD, 28, padHeight(0));
  x += LEAD;

  // Pads laid left-to-right, each followed by a rolling-hill gap to the next.
  const gapCenters: number[] = []; // x of each inter-pad gap centre (boulder candidates)
  for (let i = 0; i < PAD_COUNT; i++) {
    const zone = i + 1;
    const height = padHeight(i);
    // The start pad is forced wide (easy) regardless of its score.
    const width = i === START_PAD ? 14 : widthForScore(scores[zone] ?? 5);

    segments.push({ kind: "flat", x0: x, x1: x + width, height, zoneIndex: zone });
    if (i === START_PAD) {
      startX = x + width / 2;
    }
    x += width;

    if (i < PAD_COUNT - 1) {
      const gap = MIN_GAP + Math.round(rand() * GAP_SPREAD);
      gapCenters.push(x + gap / 2);
      appendHills(segments, x, x + gap, height, padHeight(i + 1));
      x += gap;
    }
  }

  // Trailing margin of rolling hills off the last pad.
  appendHills(segments, x, x + TAIL, padHeight(PAD_COUNT - 1), 26);
  x += TAIL;

  // Boulders: sample BOULDER_COUNT inter-pad gap centres (slopes only, so a boulder
  // never sits on a pad), skipping the two gaps flanking the start pad to keep the
  // start area clear. Even sampling spreads them across the whole surface.
  const eligible = gapCenters.filter((_, gi) => gi !== START_PAD - 1 && gi !== START_PAD);
  for (let k = 0; k < BOULDER_COUNT; k++) {
    const idx = eligible.length <= 1 ? 0 : Math.round((k * (eligible.length - 1)) / (BOULDER_COUNT - 1));
    const bx = eligible[idx] ?? eligible[0] ?? startX;
    const radius = 5 + Math.round(rand() * 3); // 5..8 m
    boulders.push({ x: bx, surface: surfaceYAt(segments, bx), radius });
  }

  return { segments, boulders, minX: 0, maxX: x, startX };
}

const TERRAIN_DATA: TerrainData = build();

export default TERRAIN_DATA;
