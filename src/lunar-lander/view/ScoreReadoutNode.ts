/**
 * ScoreReadoutNode.ts
 *
 * Shows the running score and the soft / hard landing tallies.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty } from "scenerystack/axon";
import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const LABEL_FONT = new PhetFont(14);
const VALUE_FONT = new PhetFont({ size: 14, weight: "bold" });

function row(label: TReadOnlyProperty<string>, value: TReadOnlyProperty<number>): Node {
  const labelText = new Text(label, { font: LABEL_FONT, fill: LunarLanderColors.foregroundColorProperty });
  const valueText = new Text(new DerivedProperty([value], (n) => `${n}`), {
    font: VALUE_FONT,
    fill: LunarLanderColors.foregroundColorProperty,
  });
  return new HBox({ spacing: 6, children: [labelText, valueText] });
}

export class ScoreReadoutNode extends VBox {
  public constructor(model: LunarLanderModel) {
    const s = StringManager.getInstance().getScoreStrings();
    super({
      align: "left",
      spacing: 3,
      children: [
        row(s.scoreColonStringProperty, model.scoreKeeper.scoreProperty),
        row(s.softLandingsColonStringProperty, model.scoreKeeper.nbrSoftLandingsProperty),
        row(s.hardLandingsColonStringProperty, model.scoreKeeper.nbrHardLandingsProperty),
      ],
    });
  }
}
