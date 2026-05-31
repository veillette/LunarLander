/**
 * ReadoutsNode.ts
 *
 * The instrument readouts: altitude, range, v_x, v_y and thrust. Each row pairs
 * a localized label with a NumberDisplay bound to the corresponding model
 * Property. Labels are right-aligned to a common width so the values line up.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { AlignGroup, HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberDisplay, PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const LABEL_FONT = new PhetFont(13);
const VALUE_FONT = new PhetFont({ size: 13, family: "monospace" });

const { MAX_THRUST, MODEL_MAX_ALTITUDE } = LunarLanderConstants;

type RowSpec = {
  label: TReadOnlyProperty<string>;
  property: TReadOnlyProperty<number>;
  range: Range;
  decimalPlaces: number;
};

function createRow(row: RowSpec, labelGroup: AlignGroup): Node {
  const label = new Text(row.label, { font: LABEL_FONT, fill: LunarLanderColors.foregroundColorProperty });
  const numberDisplay = new NumberDisplay(row.property, row.range, {
    align: "right",
    decimalPlaces: row.decimalPlaces,
    minBackgroundWidth: 64,
    cornerRadius: 3,
    xMargin: 5,
    yMargin: 2,
    backgroundFill: LunarLanderColors.readoutBackgroundColorProperty,
    backgroundStroke: LunarLanderColors.panelStrokeProperty,
    textOptions: { font: VALUE_FONT, fill: LunarLanderColors.readoutTextColorProperty },
  });
  return new HBox({
    spacing: 6,
    children: [labelGroup.createBox(label, { xAlign: "right" }), numberDisplay],
  });
}

export class ReadoutsNode extends VBox {
  public constructor(model: LunarLanderModel) {
    const r = StringManager.getInstance().getReadoutStrings();
    const labelGroup = new AlignGroup({ matchVertical: false });

    const rows: RowSpec[] = [
      {
        label: r.altitudeStringProperty,
        property: model.altitudeProperty,
        range: new Range(0, MODEL_MAX_ALTITUDE),
        decimalPlaces: 1,
      },
      {
        label: r.rangeStringProperty,
        property: model.rangeProperty,
        range: new Range(0, model.terrain.maxX),
        decimalPlaces: 0,
      },
      { label: r.vXStringProperty, property: model.vXProperty, range: new Range(-40, 40), decimalPlaces: 1 },
      { label: r.vYStringProperty, property: model.vYProperty, range: new Range(-40, 40), decimalPlaces: 1 },
      {
        label: r.thrustStringProperty,
        property: model.lander.thrustProperty,
        range: new Range(0, MAX_THRUST),
        decimalPlaces: 0,
      },
    ];

    super({ align: "right", spacing: 4, children: rows.map((row) => createRow(row, labelGroup)) });
  }
}
