/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screen, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. It triggers the full bootstrap chain:
 *
 *   brand.ts → splash.ts → assert.ts → init.ts
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first — triggers: init.ts → assert.ts → splash.ts → brand.ts
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import LunarLanderColors from "./LunarLanderColors.js";
import { LunarLanderScreen } from "./lunar-lander/LunarLanderScreen.js";
import { LunarLanderPreferencesModel } from "./preferences/LunarLanderPreferencesModel.js";
import { LunarLanderPreferencesNode } from "./preferences/LunarLanderPreferencesNode.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from lunarLanderQueryParameters.
  const lunarLanderPreferences = new LunarLanderPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new LunarLanderScreen({
      preferences: lunarLanderPreferences,
      // The screen name Property updates automatically when the locale changes
      name: stringManager.getScreenNames().lunarLanderStringProperty,
      tandem: Tandem.ROOT.createTandem("lunarLanderScreen"),
      backgroundColorProperty: LunarLanderColors.spaceBackgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new LunarLanderPreferencesNode(lunarLanderPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
      audioOptions: {
        // Enables the sound system (the lander synthesizes its own sounds via tambo)
        supportsSound: true,
      },
    }),

    // Credits shown in Help → About.
    credits: {
      leadDesign: "Mike Dubson (original Flash)",
      softwareDevelopment: "SceneryStack port",
      team: "PhET Interactive Simulations",
    },
  });

  sim.start();
});
