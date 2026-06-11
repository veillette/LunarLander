# Lunar Lander

A [SceneryStack](https://scenerystack.org/) port of the classic PhET **Lunar Lander** simulation. Pilot a
lunar module to a soft landing by managing thrust and tilt while fuel runs down and terrain hazards loom.

## Features

- Thrust and tilt controls via keyboard and on-screen buttons
- Soft, hard, and crash landings with per-zone scoring on narrow flat pads
- Physics model matching the original (lunar gravity, Tsiolkovsky fuel burn, fixed timestep)
- Synthesized tambo sound effects and hand-designed terrain with boulders
- English and French UI, projector color profile, and PWA support

### How to Play

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

### Physics

The model reproduces the original equations and constants exactly:
lunar gravity `g = 1.6 m/s²`, empty mass `6839 kg`, descent fuel `816.5 kg`,
max thrust `45000 N`, specific impulse `3050 m/s` (Tsiolkovsky rocket equation for
fuel burn). It integrates on a fixed `40 ms` timestep with real-frame accumulation,
so trajectories match the tuned original regardless of frame rate.

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run clean` | Remove `dist/` |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^6 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.4 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1 | PWA + service worker |

### Project Structure

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
  generate-icons.ts                               # PNG/ICO from public/icons/icon.svg
```

## License

MIT. The original PhET simulation is Copyright © University of Colorado; this is an independent reimplementation.

## Contributing

See [OpenPhysics contributing guidelines](https://github.com/OpenPhysics/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
