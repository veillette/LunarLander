/**
 * lunarLanderQueryParameters.ts
 *
 * Sim-specific startup query parameters for Lunar Lander. All entries are public
 * and provide the initial values for the sim-specific preferences in
 * LunarLanderPreferencesModel.
 *
 * Usage: append e.g. `?showVectors=false` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import LunarLanderNamespace from "../LunarLanderNamespace.js";

const lunarLanderQueryParameters = QueryStringMachine.getAll({
  /** Whether velocity / force vectors are shown by default. */
  showVectors: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

LunarLanderNamespace.register("lunarLanderQueryParameters", lunarLanderQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default lunarLanderQueryParameters;
