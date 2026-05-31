/**
 * ControlPanel.ts
 *
 * The right-hand instrument panel: an attitude indicator, the numeric readouts,
 * the fuel gauge, and the Sound / Vectors checkboxes.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Panel, VerticalCheckboxGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";
import { AttitudeIndicatorNode } from "./AttitudeIndicatorNode.js";
import { FuelGaugeNode } from "./FuelGaugeNode.js";
import { ReadoutsNode } from "./ReadoutsNode.js";

const LABEL_FONT = new PhetFont(14);

function labelText(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: LABEL_FONT, fill: LunarLanderColors.foregroundColorProperty });
}

export class ControlPanel extends Panel {
  public constructor(model: LunarLanderModel) {
    const controls = StringManager.getInstance().getControlStrings();

    const checkboxGroup = new VerticalCheckboxGroup(
      [
        { property: model.showVectorsProperty, createNode: () => labelText(controls.vectorsStringProperty) },
        { property: model.soundEnabledProperty, createNode: () => labelText(controls.soundStringProperty) },
      ],
      {
        spacing: 8,
        checkboxOptions: {
          checkboxColor: LunarLanderColors.foregroundColorProperty,
          checkboxColorBackground: LunarLanderColors.readoutBackgroundColorProperty,
        },
      },
    );

    const content = new VBox({
      align: "center",
      spacing: 12,
      children: [
        new AttitudeIndicatorNode(model.lander.angleProperty),
        new ReadoutsNode(model),
        new FuelGaugeNode(model),
        checkboxGroup,
      ],
    });

    super(content, {
      fill: LunarLanderColors.panelFillProperty,
      stroke: LunarLanderColors.panelStrokeProperty,
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 10,
      align: "center",
    });
  }
}
