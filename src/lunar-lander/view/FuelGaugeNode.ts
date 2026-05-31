/**
 * FuelGaugeNode.ts
 *
 * A vertical fuel gauge: a "fuel(kg)" label, an "F"/"E" labeled track, and a
 * bar whose height tracks the remaining-fuel fraction. The bar turns a warning
 * color when the low-fuel threshold is crossed.
 */
import { Multilink } from "scenerystack/axon";
import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { INITIAL_FUEL } = LunarLanderConstants;
const TRACK_WIDTH = 18;
const TRACK_HEIGHT = 70;
const LABEL_FONT = new PhetFont(12);
const TICK_FONT = new PhetFont({ size: 11, weight: "bold" });

export class FuelGaugeNode extends Node {
  public constructor(model: LunarLanderModel) {
    super({ pickable: false });

    const readouts = StringManager.getInstance().getReadoutStrings();
    const fuelGauge = StringManager.getInstance().getFuelGaugeStrings();

    const track = new Rectangle(0, 0, TRACK_WIDTH, TRACK_HEIGHT, {
      fill: LunarLanderColors.fuelGaugeTrackColorProperty,
      stroke: LunarLanderColors.panelStrokeProperty,
      lineWidth: 1,
    });
    const bar = new Rectangle(0, 0, TRACK_WIDTH, 0, { fill: LunarLanderColors.fuelBarColorProperty });

    const caption = new Text(readouts.fuelStringProperty, {
      font: LABEL_FONT,
      fill: LunarLanderColors.foregroundColorProperty,
      centerX: TRACK_WIDTH / 2,
      bottom: -4,
    });
    const fullLabel = new Text(fuelGauge.fullStringProperty, {
      font: TICK_FONT,
      fill: LunarLanderColors.foregroundColorProperty,
      left: TRACK_WIDTH + 4,
      top: -2,
    });
    const emptyLabel = new Text(fuelGauge.emptyStringProperty, {
      font: TICK_FONT,
      fill: LunarLanderColors.foregroundColorProperty,
      left: TRACK_WIDTH + 4,
      bottom: TRACK_HEIGHT + 2,
    });

    this.children = [caption, track, bar, fullLabel, emptyLabel];

    Multilink.multilink([model.lander.remainingFuelProperty, model.lowFuelProperty], (fuel, low) => {
      const fraction = Math.max(0, Math.min(1, fuel / INITIAL_FUEL));
      const h = fraction * TRACK_HEIGHT;
      bar.setRect(0, TRACK_HEIGHT - h, TRACK_WIDTH, h);
      bar.fill = low ? LunarLanderColors.fuelBarWarningColorProperty : LunarLanderColors.fuelBarColorProperty;
    });
  }
}
