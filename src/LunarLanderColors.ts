/**
 * LunarLanderColors.ts
 *
 * All dynamic colors for the simulation, defined as ProfileColorProperty so they
 * switch automatically between the "default" (dark / space) theme and the
 * "projector" (light) theme selected in Preferences → Visual.
 *
 * Never hardcode hex values in view files — add an entry here instead.
 */
import { Color, ProfileColorProperty } from "scenerystack/scenery";
import lunarLander from "./LunarLanderNamespace.js";

const { BLACK, WHITE } = Color;

function profileColor(name: string, def: Color | string, projector: Color | string): ProfileColorProperty {
  return new ProfileColorProperty(lunarLander, name, { default: def, projector });
}

// Neutral panel fills that contrast with either theme.
const PANEL_FILL_DARK = new Color(28, 32, 48);
const PANEL_FILL_LIGHT = new Color(240, 240, 240);
const PANEL_STROKE_DARK = "rgba(255, 255, 255, 0.4)";
const PANEL_STROKE_LIGHT = "rgba(0, 0, 0, 0.4)";

const LunarLanderColors = {
  // ── Sky / space ─────────────────────────────────────────────────────────────
  spaceBackgroundColorProperty: profileColor("spaceBackground", "#05050f", WHITE),
  starColorProperty: profileColor("star", WHITE, "#1a1a2e"),
  moonColorProperty: profileColor("moon", "#d8d8e0", "#9090a0"),

  // ── Terrain (shaded: sunlit rim → mid → shadowed base) ───────────────────────
  terrainHighlightColorProperty: profileColor("terrainHighlight", "#ddbb7e", "#c4a468"),
  terrainColorProperty: profileColor("terrain", "#c2a06a", "#b08e58"),
  terrainShadowColorProperty: profileColor("terrainShadow", "#7e6234", "#6a5230"),
  terrainStrokeColorProperty: profileColor("terrainStroke", "#8a7038", "#7a6230"),
  terrainRimColorProperty: profileColor("terrainRim", "#f3dca0", "#d8bc78"),
  terrainCraterColorProperty: profileColor("terrainCrater", "rgba(110,84,40,0.40)", "rgba(120,96,52,0.35)"),
  landingZoneColorProperty: profileColor("landingZone", "#e0c888", "#c8a860"),

  // ── Boulders (3D-shaded rocks) ───────────────────────────────────────────────
  boulderHighlightColorProperty: profileColor("boulderHighlight", "#f59a44", "#e07f2a"),
  boulderColorProperty: profileColor("boulder", "#d2691e", "#b8551a"),
  boulderShadowColorProperty: profileColor("boulderShadow", "#7c3a10", "#6a340d"),
  boulderStrokeColorProperty: profileColor("boulderStroke", "#5e2c0a", "#572808"),

  // ── Lander ──────────────────────────────────────────────────────────────────
  landerHighlightColorProperty: profileColor("landerHighlight", "#ececf2", "#c6c6d0"),
  landerBodyColorProperty: profileColor("landerBody", "#c8c8d0", "#a8a8b4"),
  landerShadeColorProperty: profileColor("landerShade", "#86889a", "#6c6e80"),
  landerAccentColorProperty: profileColor("landerAccent", "#8890a8", "#6a7088"),
  // Apollo-style gold-foil descent stage.
  landerFoilColorProperty: profileColor("landerFoil", "#d4a83e", "#bb9132"),
  landerFoilShadeColorProperty: profileColor("landerFoilShade", "#9a7420", "#86641c"),
  landerLegColorProperty: profileColor("landerLeg", "#c4c8d4", "#80869a"),
  landerEngineColorProperty: profileColor("landerEngine", "#5a5a6a", "#46465a"),
  landerWindowColorProperty: profileColor("landerWindow", "#1a2438", "#14202f"),
  flameColorProperty: profileColor("flame", "#ffb030", "#ff8c10"),
  flameMidColorProperty: profileColor("flameMid", "#ffd84a", "#ffc230"),
  flameCoreColorProperty: profileColor("flameCore", "#fff6d8", "#fff0b0"),
  rcsPuffColorProperty: profileColor("rcsPuff", "rgba(255,255,255,0.85)", "rgba(120,120,140,0.85)"),
  explosionColorProperty: profileColor("explosion", "#ff7020", "#e85a10"),

  // ── Vectors (same hue on both themes, matching the original sim) ──────────────
  velocityVectorColorProperty: profileColor("velocityVector", "#35cc35", "#1f9e1f"),
  accelerationVectorColorProperty: profileColor("accelerationVector", "#cd2520", "#cd2520"),

  // ── Panels / text / readouts ──────────────────────────────────────────────────
  panelFillProperty: profileColor("panelFill", PANEL_FILL_DARK, PANEL_FILL_LIGHT),
  panelStrokeProperty: profileColor("panelStroke", PANEL_STROKE_DARK, PANEL_STROKE_LIGHT),
  foregroundColorProperty: profileColor("foreground", WHITE, BLACK),
  readoutBackgroundColorProperty: profileColor("readoutBackground", "#0f1424", "#e8e8ee"),
  readoutTextColorProperty: profileColor("readoutText", "#7CFC00", "#0a6a00"),

  // ── Fuel gauge ────────────────────────────────────────────────────────────────
  fuelBarColorProperty: profileColor("fuelBar", "#35cc35", "#1f9e1f"),
  fuelBarWarningColorProperty: profileColor("fuelBarWarning", "#ff5030", "#d83018"),
  fuelGaugeTrackColorProperty: profileColor("fuelGaugeTrack", "#1a1f30", "#d0d0d8"),

  // ── Overlays ────────────────────────────────────────────────────────────────
  overlayFillProperty: profileColor("overlayFill", "rgba(5,5,15,0.82)", "rgba(255,255,255,0.85)"),
};

lunarLander.register("LunarLanderColors", LunarLanderColors);

export default LunarLanderColors;
