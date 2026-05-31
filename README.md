# Lunar Lander

A TypeScript [SceneryStack](https://scenerystack.org/) port of the classic PhET
**Lunar Lander** Flash simulation. Pilot a lunar module down to a soft landing on
the moon's surface: manage thrust and tilt against gravity while your fuel runs
down, score points for touching different flat zones, and avoid boulders and
high-speed crashes.

Built with Vite 8, TypeScript 6, and Biome 2, packaged as an installable PWA with
English and French localization and a projector (light) color profile.

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## How to play

| Control | Keyboard | On-screen |
|---|---|---|
| More / less thrust | ↑ / ↓ | thrust ▲ / ▼ |
| Tilt left / right | ← / → | ◄ / ► |
| Toggle full thrust | Space | "Full Thrust" |
| Pause / help | P | "Help/Pause" |
| Reset | R | Reset All |

Land gently (under 2 m/s and roughly level) for a **soft landing** plus a bonus;
under 6 m/s is a **hard landing**; faster than that is a crash. Each flat zone
scores once — narrower zones are worth more. Don't touch the boulders.

## Physics

The model reproduces the original equations and constants exactly:
lunar gravity `g = 1.6 m/s²`, empty mass `6839 kg`, descent fuel `816.5 kg`,
max thrust `45000 N`, specific impulse `3050 m/s` (Tsiolkovsky rocket equation for
fuel burn). It integrates on a fixed `40 ms` timestep with real-frame accumulation,
so trajectories match the tuned original regardless of frame rate.

A headless check of the physics/landing/scoring runs without a browser:

```bash
npm run sanity
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check (`src` + `scripts`) |
| `npm run lint` | Biome lint check |
| `npm run fix` | Lint + auto-fix + format |
| `npm run icons` | Generate PNG icons from `icons/icon.svg` |
| `npm run sanity` | Headless physics/landing/scoring checks (tsx) |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
src/
  init.ts assert.ts splash.ts brand.ts main.ts   # SceneryStack bootstrap chain
  LunarLanderNamespace.ts                         # namespace for color registration
  LunarLanderColors.ts                            # dynamic colors (dark + projector)
  i18n/
    StringManager.ts                              # singleton i18n accessor (key-parity checked)
    strings_en.json  strings_fr.json
  lunar-lander/
    LunarLanderScreen.ts                          # Screen (model + view factories)
    model/
      LunarLanderConstants.ts                     # physics + layout constants
      CrashState.ts  Lander.ts                    # flight state + kinematics
      Terrain.ts  TerrainData.ts                  # hand-designed terrain + queries
      ScoreKeeper.ts                              # per-zone scoring
      LunarLanderModel.ts                         # step / landing / collision / scoring
    view/
      LunarLanderScreenView.ts                    # transform, assembly, keyboard
      StarfieldNode TerrainNode LanderNode        # scene
      VectorsNode ExplosionNode MessageNode
      ControlPanel ReadoutsNode FuelGaugeNode     # instruments
      AttitudeIndicatorNode ScoreReadoutNode
      ThrottleControlNode                         # on-screen touch controls
      StartOverlayNode HelpDialog                 # overlays
      LunarLanderSoundView.ts                     # synthesized tambo sound
scripts/
  generate-icons.ts                               # PNG/ICO from icons/icon.svg
  sanity/physics-sanity.ts  shims.ts              # headless model checks
```

## Notes on the port

- The terrain geometry, sounds, and exact initial conditions lived in the binary
  `.fla` and could not be extracted. The terrain is a hand-designed, data-driven
  recreation (15 flat pads whose widths are inversely related to their point
  values, plus slopes and boulders); the sounds are synthesized with tambo
  oscillators and a noise burst. The physics constants and per-zone scores are
  reproduced verbatim from the original ActionScript.
- The original's landing "level" test (`angle < 0.2`, signed) is replaced with the
  symmetric `Math.abs(angle) < 0.2` so either tilt direction is treated equally.

## License

MIT
