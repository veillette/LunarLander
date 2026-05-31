/**
 * ThrottleControlNode.ts
 *
 * On-screen touch controls mirroring the keyboard: thrust up/down, tilt
 * left/right, and a full-thrust toggle. Each button calls the same model method
 * the keyboard does, so touch and keyboard stay in sync.
 */
import { HBox, type Node, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ArrowButton, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const HOLD_DELAY = 350; // ms before press-and-hold begins repeating
const HOLD_INTERVAL = 120; // ms between repeats while held
const BUTTON_BASE_COLOR = "#c8c8d0";

export class ThrottleControlNode extends VBox {
  public constructor(model: LunarLanderModel) {
    const controls = StringManager.getInstance().getControlStrings();

    const arrowOptions = {
      baseColor: BUTTON_BASE_COLOR,
      fireOnHold: true,
      fireOnHoldDelay: HOLD_DELAY,
      fireOnHoldInterval: HOLD_INTERVAL,
      arrowWidth: 18,
      arrowHeight: 16,
    };

    const thrustUp = new ArrowButton("up", () => model.increaseThrust(), {
      ...arrowOptions,
      accessibleName: controls.moreThrustStringProperty,
    });
    const thrustDown = new ArrowButton("down", () => model.decreaseThrust(), {
      ...arrowOptions,
      accessibleName: controls.lessThrustStringProperty,
    });
    const tiltLeft = new ArrowButton("left", () => model.tiltLeft(), {
      ...arrowOptions,
      accessibleName: controls.tiltLeftStringProperty,
    });
    const tiltRight = new ArrowButton("right", () => model.tiltRight(), {
      ...arrowOptions,
      accessibleName: controls.tiltRightStringProperty,
    });

    const thrustColumn = new VBox({ spacing: 6, children: [thrustUp, thrustDown] });
    const row: Node = new HBox({ spacing: 10, align: "center", children: [tiltLeft, thrustColumn, tiltRight] });

    const fullThrust = new TextPushButton(controls.fullThrustStringProperty, {
      font: new PhetFont(13),
      baseColor: BUTTON_BASE_COLOR,
      listener: () => model.toggleFullThrust(),
    });

    super({ spacing: 8, align: "center", children: [row, fullThrust] });
  }
}
