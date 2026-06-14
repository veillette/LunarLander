/**
 * LunarLanderPreferencesModel.ts
 *
 * Sim-specific preferences (Preferences → Simulation) for Lunar Lander. Each
 * preference Property takes its initial value from the corresponding query
 * parameter in lunarLanderQueryParameters.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import LunarLanderNamespace from "../LunarLanderNamespace.js";
import lunarLanderQueryParameters from "./lunarLanderQueryParameters.js";

export class LunarLanderPreferencesModel {
  /** Whether velocity / force vectors are shown by default. */
  public readonly showVectorsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showVectorsProperty = new BooleanProperty(
      lunarLanderQueryParameters.showVectors,
      tandem ? { tandem: tandem.createTandem("showVectorsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showVectorsProperty.reset();
  }
}

LunarLanderNamespace.register("LunarLanderPreferencesModel", LunarLanderPreferencesModel);
