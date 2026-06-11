/**
 * StringManager.ts
 *
 * Centralizes localized string access. Strings are loaded from per-locale JSON
 * and wrapped in reactive StringProperties so the UI updates automatically when
 * the user switches language in Preferences → Language.
 *
 * To add a string: add the key to strings_en.json AND strings_fr.json (the
 * satisfies checks below error if any key is missing from either), then expose
 * it through a getter here.
 */
import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// satisfies errors immediately if either locale file is missing keys from the other.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);

const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance().
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  public getScreenNames(): { lunarLanderStringProperty: ReadOnlyProperty<string> } {
    return {
      lunarLanderStringProperty: stringProperties.screens.lunarLanderStringProperty,
    };
  }

  public getReadoutStrings() {
    return stringProperties.readouts;
  }

  public getFuelGaugeStrings() {
    return stringProperties.fuelGauge;
  }

  public getControlStrings() {
    return stringProperties.controls;
  }

  public getScoreStrings() {
    return stringProperties.score;
  }

  public getMessageStrings() {
    return stringProperties.messages;
  }

  public getHelpStrings() {
    return stringProperties.help;
  }

  public getKeyboardHelpStrings() {
    return stringProperties.keyboardHelp;
  }

  /** Accessibility (Interactive Description) strings: screen summary, alerts, control help text. */
  public getA11yStrings() {
    return stringProperties.a11y;
  }
}
