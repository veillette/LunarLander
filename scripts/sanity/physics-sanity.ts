/**
 * physics-sanity.ts
 *
 * Headless checks of the pure model math. This WSL box has no headless-browser
 * libraries, so we cannot render; instead we import the model under tsx (with
 * browser-global shims) and assert the physics, landing, and scoring behave.
 *
 * Run: npx tsx scripts/sanity/physics-sanity.ts
 */
import "./shims.js"; // MUST be first — installs browser-global stubs

import { Vector2 } from "scenerystack/dot";
import { CrashState } from "../../src/lunar-lander/model/CrashState.js";
import LunarLanderConstants from "../../src/lunar-lander/model/LunarLanderConstants.js";
import { LunarLanderModel } from "../../src/lunar-lander/model/LunarLanderModel.js";

const { GRAVITY, INITIAL_ALTITUDE, MASS_EMPTY, INITIAL_FUEL, MAX_THRUST, FIXED_DT, SPOT_SCORES, SOFT_LANDING_BONUS } =
  LunarLanderConstants;

let failures = 0;
function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name} ${detail}`);
  }
}
function approx(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

function run(label: string, fn: () => void): void {
  console.log(`\n${label}`);
  fn();
}

// (a) Free-fall: thrust 0 → impact speed ≈ sqrt(2 g h), classified as a crash.
run("free-fall from initial altitude", () => {
  const model = new LunarLanderModel();
  model.isPlayingProperty.value = true;
  let steps = 0;
  while (model.crashStateProperty.value === CrashState.IN_FLIGHT && steps < 5000) {
    model.step(FIXED_DT);
    steps++;
  }
  const expected = Math.sqrt(2 * GRAVITY * INITIAL_ALTITUDE);
  check("landed within step budget", model.crashStateProperty.value !== CrashState.IN_FLIGHT, `steps=${steps}`);
  check(
    "impact speed ≈ sqrt(2 g h)",
    approx(model.landingSpeedProperty.value, expected, 0.4),
    `got ${model.landingSpeedProperty.value.toFixed(3)}, expected ${expected.toFixed(3)}`,
  );
  check("crash (impact > hard threshold)", model.crashStateProperty.value === CrashState.CRASH_LANDED);
});

// (b) Hover: thrust = m·g holds altitude (approximately) and does not crash.
run("hover at thrust = m·g", () => {
  const model = new LunarLanderModel();
  model.isPlayingProperty.value = true;
  const startAltitude = model.altitudeProperty.value;
  model.lander.thrustProperty.value = (MASS_EMPTY + INITIAL_FUEL) * GRAVITY;
  for (let i = 0; i < 75; i++) {
    // ~3 s
    model.lander.thrustProperty.value = model.lander.massProperty.value * GRAVITY; // re-balance as fuel burns
    model.step(FIXED_DT);
  }
  check("still in flight", model.crashStateProperty.value === CrashState.IN_FLIGHT);
  check(
    "altitude roughly held",
    approx(model.altitudeProperty.value, startAltitude, 3),
    `Δ=${(model.altitudeProperty.value - startAltitude).toFixed(3)} m`,
  );
});

// (c) Fuel depletes to zero and forces thrust to zero.
run("fuel depletion cuts thrust", () => {
  const model = new LunarLanderModel();
  model.isPlayingProperty.value = true;
  model.lander.thrustProperty.value = MAX_THRUST;
  let steps = 0;
  while (model.lander.remainingFuelProperty.value > 0 && steps < 5000) {
    model.lander.thrustProperty.value = MAX_THRUST; // keep commanding full thrust
    model.step(FIXED_DT);
    steps++;
  }
  check("fuel reached zero", model.lander.remainingFuelProperty.value === 0, `steps=${steps}`);
  check("thrust forced to zero", model.lander.thrustProperty.value === 0);
});

// (d) Controlled gentle descent onto the start pad → soft landing + score (once).
run("soft landing scores once", () => {
  const model = new LunarLanderModel();
  model.isPlayingProperty.value = true;
  const x = model.terrain.startX;
  const surf = model.terrain.surfaceY(x);
  model.lander.positionProperty.value = new Vector2(x, surf + 0.4);
  model.lander.velocityProperty.value = new Vector2(0, -1.0); // 1 m/s down → soft
  model.lander.thrustProperty.value = 0;
  let steps = 0;
  while (model.crashStateProperty.value === CrashState.IN_FLIGHT && steps < 100) {
    model.step(FIXED_DT);
    steps++;
  }
  const zone = model.terrain.zoneAt(x);
  const expectedScore = (SPOT_SCORES[zone] ?? 0) + SOFT_LANDING_BONUS;
  check("soft landed", model.crashStateProperty.value === CrashState.SOFT_LANDED, model.crashStateProperty.value);
  check("on a scored zone", zone > 0, `zone=${zone}`);
  check(
    "score = pad + soft bonus",
    model.scoreKeeper.scoreProperty.value === expectedScore,
    `got ${model.scoreKeeper.scoreProperty.value}, expected ${expectedScore}`,
  );
  check("one soft landing tallied", model.scoreKeeper.nbrSoftLandingsProperty.value === 1);

  // Landing on the same zone again must not score again.
  model.scoreKeeper.recordLanding(zone, CrashState.SOFT_LANDED);
  check("re-landing same zone does not re-score", model.scoreKeeper.scoreProperty.value === expectedScore);
});

// (e) Terrain queries: zone lookup and boulder circle test.
run("terrain queries", () => {
  const model = new LunarLanderModel();
  const t = model.terrain;
  check("startX is on a pad", t.zoneAt(t.startX) > 0, `zone=${t.zoneAt(t.startX)}`);
  check("there are boulders", t.boulders.length > 0, `count=${t.boulders.length}`);
  const b = t.boulders[0];
  if (b) {
    const centerY = b.surface + b.radius;
    check("boulder center registers a hit", t.boulderHit(b.x, centerY, LunarLanderConstants.LANDER_RADIUS));
    check("point far above terrain is clear", !t.boulderHit(b.x, centerY + 500, LunarLanderConstants.LANDER_RADIUS));
  }
});

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
