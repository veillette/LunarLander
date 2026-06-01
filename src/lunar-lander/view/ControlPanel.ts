/**
 * ControlPanel.ts
 *
 * The right-hand instrument panel: an attitude indicator, the numeric readouts,
 * the fuel gauge, and the Vectors / Sound visibility toggles (icon buttons).
 */
import { HBox, VBox } from "scenerystack/scenery";
import { EyeToggleButton, SoundToggleButton } from "scenerystack/scenery-phet";
import { Panel } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";
import { AttitudeIndicatorNode } from "./AttitudeIndicatorNode.js";
import { FuelGaugeNode } from "./FuelGaugeNode.js";
import { ReadoutsNode } from "./ReadoutsNode.js";

const TOGGLE_BUTTON_SIZE = 44;

export class ControlPanel extends Panel {
  public constructor(model: LunarLanderModel) {
    const controls = StringManager.getInstance().getControlStrings();

    const toggleOptions = {
      baseColor: LunarLanderColors.controlButtonColorProperty,
      minWidth: TOGGLE_BUTTON_SIZE,
      minHeight: TOGGLE_BUTTON_SIZE,
    };

    // Eye open/closed → show/hide the velocity & acceleration vectors.
    const vectorsButton = new EyeToggleButton(model.showVectorsProperty, {
      ...toggleOptions,
      accessibleName: controls.vectorsStringProperty,
    });
    // Speaker on/off → enable/disable the sound effects.
    const soundButton = new SoundToggleButton(model.soundEnabledProperty, {
      ...toggleOptions,
      accessibleName: controls.soundStringProperty,
    });

    const toggleButtons = new HBox({ spacing: 12, children: [vectorsButton, soundButton] });

    const content = new VBox({
      align: "center",
      spacing: 12,
      children: [
        new AttitudeIndicatorNode(model.lander.angleProperty),
        new ReadoutsNode(model),
        new FuelGaugeNode(model),
        toggleButtons,
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
