/**
 * MessageNode.ts
 *
 * A transient banner shown after the lander touches down: the landing result
 * (soft / hard / crash / boulder) plus the touchdown speed. Derived entirely
 * from model state, so it updates with the crash state and the locale.
 */
import { DerivedProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Panel } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import { CrashState } from "../model/CrashState.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { FATAL_SPEED } = LunarLanderConstants;

export class MessageNode extends Node {
  public constructor(model: LunarLanderModel, center: Vector2) {
    const visibleProperty = new DerivedProperty([model.crashStateProperty], (state) => state !== CrashState.IN_FLIGHT);
    super({ visibleProperty, pickable: false });

    const m = StringManager.getInstance().getMessageStrings();

    const resultProperty = new DerivedProperty(
      [
        model.crashStateProperty,
        model.hitBoulderProperty,
        model.landingSpeedProperty,
        m.softLandingStringProperty,
        m.hardLandingStringProperty,
        m.crash1StringProperty,
        m.crash2StringProperty,
        m.hitBoulderStringProperty,
      ],
      (state, hitBoulder, speed, soft, hard, crash1, crash2, boulder) => {
        if (hitBoulder) {
          return boulder;
        }
        if (state === CrashState.SOFT_LANDED) {
          return soft;
        }
        if (state === CrashState.HARD_LANDED) {
          return hard;
        }
        if (state === CrashState.CRASH_LANDED) {
          return speed > FATAL_SPEED ? crash2 : crash1;
        }
        return "";
      },
    );

    const speedProperty = new DerivedProperty(
      [m.landingSpeedEqStringProperty, model.landingSpeedProperty],
      (eq, speed) => `${eq}${speed.toFixed(2)} m/s`,
    );

    const content = new VBox({
      align: "center",
      spacing: 4,
      children: [
        new Text(resultProperty, {
          font: new PhetFont({ size: 18, weight: "bold" }),
          fill: LunarLanderColors.foregroundColorProperty,
        }),
        new Text(speedProperty, { font: new PhetFont(14), fill: LunarLanderColors.foregroundColorProperty }),
      ],
    });

    const panel = new Panel(content, {
      fill: LunarLanderColors.overlayFillProperty,
      stroke: LunarLanderColors.panelStrokeProperty,
      cornerRadius: 6,
      xMargin: 16,
      yMargin: 10,
    });
    this.addChild(panel);

    // Re-center whenever the content changes (and on locale change).
    resultProperty.link(() => {
      this.center = center;
    });
  }
}
