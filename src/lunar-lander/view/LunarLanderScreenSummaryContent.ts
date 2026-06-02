/**
 * LunarLanderScreenSummaryContent.ts
 *
 * The accessible screen summary read by screen readers (SceneryStack's
 * Interactive Description). It describes the play area, the controls, an
 * interaction hint, and — most importantly — a live "current details" paragraph
 * that reflects the lander's state (altitude, range, velocity, thrust, fuel,
 * score) so a screen-reader user can re-read the situation at any time. Live
 * one-shot events (landings, crashes, low fuel) are announced separately via
 * accessible responses from LunarLanderScreenView.
 */
import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import { CrashState } from "../model/CrashState.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

export class LunarLanderScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: LunarLanderModel) {
    const a11y = StringManager.getInstance().getA11yStrings();
    const summary = a11y.screenSummary;
    const details = a11y.currentDetails;

    // Live snapshot of the lander state. Numbers are rounded so the text only
    // changes when a meaningful (readable) value changes rather than every frame.
    const currentDetailsProperty = new DerivedProperty(
      [
        model.hasStartedProperty,
        model.crashStateProperty,
        model.altitudeProperty,
        model.rangeProperty,
        model.vXProperty,
        model.vYProperty,
        model.lander.thrustProperty,
        model.lander.remainingFuelProperty,
        model.scoreKeeper.scoreProperty,
        details.beforeStartStringProperty,
        details.inFlightStringProperty,
        details.landedStringProperty,
      ],
      (started, crashState, altitude, range, vx, vy, thrust, fuel, score, beforeStart, inFlight, landed) => {
        if (!started) {
          return beforeStart;
        }
        const values = {
          altitude: Math.round(altitude),
          range: Math.round(range),
          vx: vx.toFixed(1),
          vy: vy.toFixed(1),
          thrust: Math.round(thrust),
          fuel: Math.round(fuel),
          score: score,
        };
        return StringUtils.fillIn(crashState === CrashState.IN_FLIGHT ? inFlight : landed, values);
      },
    );

    super({
      playAreaContent: summary.playAreaStringProperty,
      controlAreaContent: summary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: summary.interactionHintStringProperty,
    });
  }
}
