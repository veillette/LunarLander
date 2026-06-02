/**
 * LunarLanderConstants.ts
 *
 * All physics and layout magic numbers for the simulation, in one place.
 *
 * Physics constants are taken verbatim from the original Flash sim
 * (Lander.as / Constants.as). The model integrates the lander's ABSOLUTE
 * position (x, yAbs) in model metres with the original equations; the
 * "altitude" readout is yAbs minus the terrain surface elevation at x.
 */

const MAX_THRUST = 45000; // N — maximum descent-engine thrust

const LunarLanderConstants = {
  // ── Physics (exact, from the Flash original) ────────────────────────────────
  GRAVITY: 1.6, // m/s² — lunar surface gravity
  MASS_EMPTY: 6839, // kg — descent + ascent stages including ascent fuel
  INITIAL_FUEL: 816.5, // kg — descent-stage fuel (8165 kg full / 10)
  MAX_THRUST, // N
  ISP: 3050, // m/s — effective exhaust velocity (specific impulse), for the rocket equation

  // ── Landing classification thresholds ──────────────────────────────────────
  SOFT_SPEED: 2.0, // m/s — below this (and roughly level) is a soft landing
  HARD_SPEED: 6.0, // m/s — below this (and roughly level) is a hard landing
  FATAL_SPEED: 12.0, // m/s — above this the crew is killed
  LEVEL_ANGLE_TOLERANCE: 0.2, // rad (~11.5°) — max tilt for a non-crash landing

  // ── Controls ────────────────────────────────────────────────────────────────
  THRUST_STEP: 0.05 * MAX_THRUST, // N — thrust change per key press (5% of max)
  TILT_STEP: (3 * Math.PI) / 180, // rad — tilt change per key press (3°)
  LOW_FUEL_FRACTION: 0.1, // fraction of initial fuel that triggers the low-fuel alarm

  // ── Fixed timestep ──────────────────────────────────────────────────────────
  // The original physics ran on a fixed 40 ms tick; the integration formulas bake
  // dt in, so we substep at this fixed dt and accumulate the real frame dt.
  FIXED_DT: 0.04, // s (40 ms)
  MAX_CATCHUP_STEPS: 5, // bound on substeps per frame, to avoid a spiral on a stall

  // ── Model world (vertical extent for the view transform) ────────────────────
  // The horizontal extent (range) is defined by the terrain (terrain.maxX).
  MODEL_MIN_Y: 0, // m — bottom of the visible world (terrain bodies fill down to here)
  MODEL_MAX_ALTITUDE: 200, // m — top of the visible world (absolute elevation)

  // ── Camera (zoom toward the landing site as the lander descends) ─────────────
  // Like the Flash original, the view stays wide while the lander is high, then
  // smoothly zooms in on the spot directly below it as the clearance drops.
  ZOOM_START_ALTITUDE: 70, // m — at or above this clearance the view is unzoomed (z = 1)
  ZOOM_MAX: 3, // × — zoom factor at touchdown (altitude 0)
  // The mirror image: when the lander climbs above the top of the world it would
  // leave the (clipped) play area, so the view zooms back out to keep it on-screen,
  // pinning it to a band ZOOM_OUT_TOP_FRACTION below the top edge.
  ZOOM_OUT_TOP_FRACTION: 0.12, // fraction of play-area height the lander rides below the top while climbing
  ZOOM_OUT_MIN: 0.4, // × — floor on the zoom-out factor (shows up to ~MODEL_MAX_ALTITUDE / this)

  // ── Initial lander state ────────────────────────────────────────────────────
  INITIAL_X: 30, // m — horizontal start (over a wide, easy pad on the left)
  INITIAL_ALTITUDE: 120, // m — start clearance above the local surface
  INITIAL_ANGLE: 0, // rad — upright
  INITIAL_THRUST: 0, // N

  // Collision half-extent of the lander, in model metres (for boulder/terrain tests).
  LANDER_RADIUS: 6, // m

  // ── Scoring ─────────────────────────────────────────────────────────────────
  // Per-zone point values, indexed by zoneIndex (index 0 = "no zone"). Narrower,
  // harder-to-reach zones are worth more. Taken verbatim from ScoreKeeper.as.
  SPOT_SCORES: [0, 30, 10, 10, 5, 10, 10, 5, 10, 10, 5, 10, 5, 10, 50, 30] as const,
  SOFT_LANDING_BONUS: 10, // extra points for a soft landing in a scored zone

  // ── View layout ─────────────────────────────────────────────────────────────
  SCREEN_VIEW_MARGIN: 16, // px
  CONTROL_PANEL_WIDTH: 232, // px
  STAR_COUNT: 140,
  EXPLOSION_DURATION: 1.1, // s — explosion animation length
  RCS_PUFF_DURATION: 0.18, // s — side-thruster puff visibility
} as const;

export default LunarLanderConstants;
