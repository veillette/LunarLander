/**
 * LunarLanderScreen.ts
 *
 * The single screen: wires the model and view factories and passes screen-level
 * options (name, background color, tandem) to the parent Screen class.
 */
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import LunarLanderColors from "../LunarLanderColors.js";
import { LunarLanderModel } from "./model/LunarLanderModel.js";
import { LunarLanderScreenView } from "./view/LunarLanderScreenView.js";

type LunarLanderScreenOptions = ScreenOptions & { tandem: Tandem };

export class LunarLanderScreen extends Screen<LunarLanderModel, LunarLanderScreenView> {
  public constructor(options: LunarLanderScreenOptions) {
    super(
      () => new LunarLanderModel(),
      (model) => new LunarLanderScreenView(model, { tandem: options.tandem.createTandem("view") }),
      {
        backgroundColorProperty: LunarLanderColors.spaceBackgroundColorProperty,
        ...options,
      },
    );
  }
}
