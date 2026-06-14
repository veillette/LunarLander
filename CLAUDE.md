# CLAUDE.md — Lunar Lander

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

SceneryStack port of the classic PhET Flash Lunar Lander. Pilot the module with thrust and tilt; score zone landings; avoid boulders and high-speed crashes.

## Key files

| Area | Files |
|---|---|
| Model | `LunarLanderModel.ts`, `Lander.ts`, `Terrain.ts`, `TerrainData.ts`, `ScoreKeeper.ts`, `CrashState.ts` |
| Constants | `LunarLanderConstants.ts` — physics, layout, scoring (matches original ActionScript) |
| View | `LunarLanderScreenView.ts`, `LanderNode`, `TerrainNode`, `ControlPanel`, instrument nodes |
| Sound | `LunarLanderSoundView.ts` — synthesized tambo oscillators + noise burst |
| Overlays | `StartOverlayNode`, help dialog, on-screen throttle controls |

## Accessibility

Conforms to the shared [OpenPhysics accessibility convention](https://github.com/OpenPhysics/OpenPhysics/blob/main/ACCESSIBILITY.md):
`LunarLanderScreenView` registers `LunarLanderScreenSummaryContent` (structured regions + live
current-details) via the `screenSummaryContent` super-option, orders the PDOM through
`pdomControlAreaNode`, and exposes a11y strings via `StringManager.getA11yStrings()`. This
sim's `ScreenSummaryContent` is the reference example for live model-derived current-details.

## Physics (port fidelity)

- Lunar gravity `g = 1.6 m/s²`; empty mass `6839 kg`; max thrust `45000 N`; Tsiolkovsky fuel burn
- Fixed `40 ms` integration timestep with real-frame accumulation (matches original tuning)
- Soft landing: < 2 m/s and roughly level; hard: < 6 m/s; crash above that

## Terrain

Hand-designed data in `TerrainData.ts` — flat pads (width inversely related to point value), slopes, boulders. Not procedural.
