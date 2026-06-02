/**
 * ControlPanel.ts
 *
 * The right-hand instrument panel: an attitude indicator, the numeric readouts,
 * the fuel gauge, and the Vectors visibility toggle (icon button). Sound is
 * controlled by the navigation-bar speaker, so it is not duplicated here.
 */
import { VBox } from "scenerystack/scenery";
import { EyeToggleButton } from "scenerystack/scenery-phet";
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

    // Eye open/closed → show/hide the velocity & acceleration vectors. Scaled to
    // half the base toggle size to keep it unobtrusive now that it stands alone.
    const vectorsButton = new EyeToggleButton(model.showVectorsProperty, {
      baseColor: LunarLanderColors.controlButtonColorProperty,
      minWidth: TOGGLE_BUTTON_SIZE,
      minHeight: TOGGLE_BUTTON_SIZE,
      scale: 0.5,
      accessibleName: controls.vectorsStringProperty,
    });

    const content = new VBox({
      align: "center",
      spacing: 12,
      children: [
        new AttitudeIndicatorNode(model.lander.angleProperty),
        new ReadoutsNode(model),
        new FuelGaugeNode(model),
        vectorsButton,
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
