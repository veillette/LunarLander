/**
 * LunarLanderPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound to
 * LunarLanderPreferencesModel Properties (initial values from query parameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import LunarLanderNamespace from "../LunarLanderNamespace.js";
import type { LunarLanderPreferencesModel } from "./LunarLanderPreferencesModel.js";

export class LunarLanderPreferencesNode extends VBox {
  public constructor(preferencesModel: LunarLanderPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
    });

    const showVectorsCheckbox = new Checkbox(
      preferencesModel.showVectorsProperty,
      new Text(prefStrings.showVectorsStringProperty, { font: new PhetFont(14) }),
      {
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("showVectorsCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, showVectorsCheckbox],
    });
  }
}

LunarLanderNamespace.register("LunarLanderPreferencesNode", LunarLanderPreferencesNode);
