# Implementation Notes - Lunar Lander Simulation

## Architecture Overview

The Lunar Lander simulation is structured using a Model-View pattern with high fidelity to the original Flash/ActionScript implementation. It models thrust, fuel burn, terrain collision, and landing scoring.

### High-Level Architecture

The simulation follows a modular architecture:

- **Model Layer (`src/lunar-lander/model/`)**: Lander physics, terrain lookup, crash/landing state, and scoring
- **View Layer (`src/lunar-lander/view/`)**: World rendering, instruments, camera, sound, and accessibility content

Data flows primarily from Model → View. Keyboard and on-screen controls update thrust and tilt through the model.

### Model-View Transform

A uniform-scale mapping with **inverted Y** connects model coordinates to view space. A dynamic camera zooms based on altitude (`ZOOM_START_ALTITUDE`, `ZOOM_MAX`) and pans with a dead zone toward the landing site.

## Model Components

### Core Model Design

`LunarLanderModel` owns the `Lander`, `Terrain`, and `ScoreKeeper` and runs the physics step each frame.

### Component Specialization

Each model component has a single responsibility:

1. **Lander**: Position, velocity, angle, fuel, and thrust
2. **Terrain**: Surface height lookup from hand-designed `TerrainData.ts`
3. **ScoreKeeper**: Landing zone scoring
4. **CrashState**: `IN_FLIGHT`, `SOFT`, `HARD`, or `CRASH`

### Physics Simulation Approach

Integration uses a fixed 40 ms timestep with real-frame accumulation.

Key physical quantities:

- Lunar gravity: 1.6 m/s²
- Fuel consumption via Tsiolkovsky rocket equation
- Soft landing threshold: < 2 m/s, level attitude
- Hard landing threshold: < 6 m/s

Constants are centralized in `LunarLanderConstants.ts`. Headless sanity checks live in `scripts/sanity/`.

## View Components

### LunarLanderScreenView as Coordinator

The screen view assembles the world scene, camera transforms, keyboard controls, and overlay UI.

Specialized view classes handle specific aspects:

1. **LanderNode**, **TerrainNode**, **StarfieldNode**: World rendering inside a zoomable `worldNode`
2. **VectorsNode**: Force and velocity vectors
3. **FuelGaugeNode**, **AttitudeIndicatorNode**, **ReadoutsNode**, **ScoreReadoutNode**: Instrument panel
4. **ThrottleControlNode**: On-screen thrust control
5. **StartOverlayNode**: Start gate before play begins
6. **ExplosionNode**, **MessageNode**: Crash and landing feedback
7. **LunarLanderSoundView**: Procedural tambo audio (thrust, RCS, alarm, explosion)
8. **LunarLanderScreenSummaryContent**, **LunarLanderKeyboardHelpContent**: Accessibility

### Color Scheme

Colors are defined in `LunarLanderColors.ts` as `ProfileColorProperty` instances for default and projector profiles.

### Performance Optimizations

- Camera zoom reduces visible terrain detail at high altitude
- Starfield and terrain are static between level loads

Sound nodes and keyboard listeners should be disposed if the screen lifecycle changes; most objects persist for the app lifetime.
