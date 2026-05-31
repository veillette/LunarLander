/**
 * HelpDialog.ts
 *
 * A modal listing the keyboard controls, opened by the Help/Pause button.
 * Uses dark text since the dialog renders on a light background in both themes.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Dialog } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";

const TEXT_COLOR = "#1a1a1a";

function line(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: new PhetFont(15), fill: TEXT_COLOR });
}

export function createHelpDialog(hideCallback: () => void): Dialog {
  const help = StringManager.getInstance().getHelpStrings();

  const content = new VBox({
    align: "left",
    spacing: 8,
    children: [
      line(help.controlLanderStringProperty),
      line(help.upDownThrustStringProperty),
      line(help.leftRightTiltStringProperty),
      line(help.spaceFullThrustStringProperty),
      line(help.rResetStringProperty),
      line(help.pPauseStringProperty),
    ],
  });

  return new Dialog(content, {
    title: new Text(help.titleStringProperty, { font: new PhetFont({ size: 18, weight: "bold" }), fill: TEXT_COLOR }),
    hideCallback,
  });
}
