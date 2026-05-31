/**
 * StartOverlayNode.ts
 *
 * The intro overlay shown before the game begins: title, objective, the keyboard
 * controls, and a Start button. Visible until the player starts (hasStarted).
 */
import { DerivedProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

export class StartOverlayNode extends Node {
  public constructor(model: LunarLanderModel, playAreaBounds: Bounds2, onStart: () => void) {
    const visibleProperty = new DerivedProperty([model.hasStartedProperty], (started) => !started);
    super({ visibleProperty });

    const strings = StringManager.getInstance();
    const help = strings.getHelpStrings();
    const controls = strings.getControlStrings();
    const foreground = LunarLanderColors.foregroundColorProperty;

    const background = new Rectangle(playAreaBounds, { fill: LunarLanderColors.overlayFillProperty });

    const title = new Text(strings.getTitleStringProperty(), {
      font: new PhetFont({ size: 30, weight: "bold" }),
      fill: foreground,
    });

    const instructions = new RichText(help.instructionsStringProperty, {
      font: new PhetFont(15),
      fill: foreground,
      lineWrap: Math.min(520, playAreaBounds.width * 0.75),
      align: "center",
    });

    const hintFont = new PhetFont(13);
    const hints = new VBox({
      align: "left",
      spacing: 3,
      children: [
        new Text(help.upDownThrustStringProperty, { font: hintFont, fill: foreground }),
        new Text(help.leftRightTiltStringProperty, { font: hintFont, fill: foreground }),
        new Text(help.spaceFullThrustStringProperty, { font: hintFont, fill: foreground }),
      ],
    });

    const startButton = new TextPushButton(controls.startStringProperty, {
      font: new PhetFont({ size: 20, weight: "bold" }),
      baseColor: "#35cc35",
      xMargin: 18,
      yMargin: 8,
      listener: onStart,
    });

    const content = new VBox({
      align: "center",
      spacing: 16,
      children: [title, instructions, hints, startButton],
    });
    content.center = playAreaBounds.center;

    this.children = [background, content];
  }
}
