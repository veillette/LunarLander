/**
 * LunarLanderKeyboardHelpContent.ts
 *
 * Content for the standard SceneryStack keyboard-help dialog (opened from the
 * keyboard "?" button joist adds to the navigation bar). Built from the
 * scenery-phet keyboard-help template: a two-column layout with a "Flight
 * Controls" section (thrust + tilt + full thrust) and a "Game Controls"
 * section (reset + pause/play), matching the keys wired up in
 * LunarLanderScreenView.addKeyboardControls.
 */
import {
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  LetterKeyNode,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class LunarLanderKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getKeyboardHelpStrings();

    // ── Flight Controls: thrust (↑↓), tilt (←→), full thrust (Space) ──
    const flightControls = new KeyboardHelpSection(strings.flightControlsHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.thrustStringProperty,
        KeyboardHelpIconFactory.upDownArrowKeysRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(
        strings.tiltStringProperty,
        KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(strings.fullThrustStringProperty, TextKeyNode.space()),
    ]);

    // ── Game Controls: reset (R), pause/play (P) ──
    const gameControls = new KeyboardHelpSection(strings.gameControlsHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(strings.resetStringProperty, new LetterKeyNode("R")),
      KeyboardHelpSectionRow.labelWithIcon(strings.pausePlayStringProperty, new LetterKeyNode("P")),
    ]);

    // Align the icon columns so both sections line up.
    KeyboardHelpSection.alignHelpSectionIcons([flightControls, gameControls]);

    super([flightControls], [gameControls]);
  }
}
