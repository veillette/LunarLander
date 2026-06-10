# Lunar Lander

A [SceneryStack](https://scenerystack.org/) port of the classic PhET **Lunar Lander** simulation. Pilot a
lunar module to a soft landing by managing thrust and tilt while fuel runs down and terrain hazards loom.

## Features

- Thrust and tilt controls via keyboard and on-screen buttons
- Soft, hard, and crash landings with per-zone scoring on narrow flat pads
- Physics model matching the original (lunar gravity, Tsiolkovsky fuel burn, fixed timestep)
- Synthesized tambo sound effects and hand-designed terrain with boulders
- English and French UI, projector color profile, and PWA support
- Headless physics sanity checks via `npm run sanity`

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
| `npm run sanity` | Headless physics/landing/scoring checks |
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

## License

MIT. The original PhET simulation is Copyright © University of Colorado; this is an independent reimplementation.

## Contributing

See [OpenPhysics contributing guidelines](https://github.com/OpenPhysics/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
