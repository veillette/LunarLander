/**
 * ThrottleControlNode.ts
 *
 * On-screen touch controls mirroring the keyboard: thrust up/down, tilt
 * left/right, and a full-thrust toggle. Each button calls the same model method
 * the keyboard does, so touch and keyboard stay in sync.
 */
import { Shape } from "scenerystack/kite";
import { HBox, Node, Path, VBox } from "scenerystack/scenery";
import { ArrowButton, RectangularPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const HOLD_DELAY = 350; // ms before press-and-hold begins repeating
const HOLD_INTERVAL = 120; // ms between repeats while held

export class ThrottleControlNode extends VBox {
  public constructor(model: LunarLanderModel) {
    const controls = StringManager.getInstance().getControlStrings();
    const a11y = StringManager.getInstance().getA11yStrings();

    const arrowOptions = {
      baseColor: LunarLanderColors.controlButtonColorProperty,
      fireOnHold: true,
      fireOnHoldDelay: HOLD_DELAY,
      fireOnHoldInterval: HOLD_INTERVAL,
      arrowWidth: 18,
      arrowHeight: 16,
    };

    const thrustUp = new ArrowButton("up", () => model.increaseThrust(), {
      ...arrowOptions,
      accessibleName: controls.moreThrustStringProperty,
      accessibleHelpText: a11y.moreThrustHelpTextStringProperty,
    });
    const thrustDown = new ArrowButton("down", () => model.decreaseThrust(), {
      ...arrowOptions,
      accessibleName: controls.lessThrustStringProperty,
      accessibleHelpText: a11y.lessThrustHelpTextStringProperty,
    });
    const tiltLeft = new ArrowButton("left", () => model.tiltLeft(), {
      ...arrowOptions,
      accessibleName: controls.tiltLeftStringProperty,
      accessibleHelpText: a11y.tiltLeftHelpTextStringProperty,
    });
    const tiltRight = new ArrowButton("right", () => model.tiltRight(), {
      ...arrowOptions,
      accessibleName: controls.tiltRightStringProperty,
      accessibleHelpText: a11y.tiltRightHelpTextStringProperty,
    });

    const thrustColumn = new VBox({ spacing: 6, children: [thrustUp, thrustDown] });
    const row: Node = new HBox({ spacing: 10, align: "center", children: [tiltLeft, thrustColumn, tiltRight] });

    // A flame icon (matching the lander's own plume) stands in for "full thrust".
    const fullThrust = new RectangularPushButton({
      content: ThrottleControlNode.createFlameIcon(),
      baseColor: LunarLanderColors.controlButtonColorProperty,
      xMargin: 12,
      yMargin: 6,
      accessibleName: controls.fullThrustStringProperty,
      accessibleHelpText: a11y.fullThrustHelpTextStringProperty,
      listener: () => model.toggleFullThrust(),
    });

    // Group the flight controls under an accessible heading so screen-reader
    // users find them as a labeled region with the buttons nested beneath.
    super({
      spacing: 8,
      align: "center",
      children: [row, fullThrust],
      accessibleHeading: a11y.flightControlsHeadingStringProperty,
      accessibleHelpText: a11y.flightControlsHelpTextStringProperty,
    });
  }

  /** A small upward-pointing flame (outer plume / mid / hot core), in view pixels. */
  private static createFlameIcon(): Node {
    const length = 24;
    const plume = (halfWidth: number, len: number): Shape =>
      new Shape()
        .moveTo(-halfWidth, 0)
        .quadraticCurveTo(-halfWidth * 0.4, -len * 0.7, 0, -len)
        .quadraticCurveTo(halfWidth * 0.4, -len * 0.7, halfWidth, 0)
        .close();

    return new Node({
      children: [
        new Path(plume(7, length), { fill: LunarLanderColors.flameColorProperty }),
        new Path(plume(4.3, length * 0.72), { fill: LunarLanderColors.flameMidColorProperty }),
        new Path(plume(2, length * 0.42), { fill: LunarLanderColors.flameCoreColorProperty }),
      ],
    });
  }
}
