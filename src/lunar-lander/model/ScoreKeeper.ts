/**
 * ScoreKeeper.ts
 *
 * Tracks the player's score and landing tallies. Mirrors ScoreKeeper.as:
 *   - each zone scores at most once (the first time it is landed on)
 *   - a crash landing "uses up" the zone but earns no points
 *   - a soft landing in a fresh scored zone earns a bonus
 */
import { NumberProperty } from "scenerystack/axon";
import { CrashState } from "./CrashState.js";
import LunarLanderConstants from "./LunarLanderConstants.js";

export class ScoreKeeper {
  public readonly scoreProperty = new NumberProperty(0);
  public readonly nbrSoftLandingsProperty = new NumberProperty(0);
  public readonly nbrHardLandingsProperty = new NumberProperty(0);

  // landedOn[zoneIndex] — whether the zone has already been counted.
  private readonly landedOn: boolean[] = [];

  /**
   * Record a landing in the given zone. zoneIndex 0 means "not on a scored pad".
   * Scoring happens only the first time a zone is touched and only for
   * non-crash landings (matching the original).
   */
  public recordLanding(zoneIndex: number, crashState: CrashState): void {
    if (zoneIndex <= 0 || this.landedOn[zoneIndex]) {
      return;
    }
    this.landedOn[zoneIndex] = true;

    if (crashState === CrashState.CRASH_LANDED) {
      return;
    }

    const zoneScore = LunarLanderConstants.SPOT_SCORES[zoneIndex] ?? 0;
    this.scoreProperty.value += zoneScore;

    if (crashState === CrashState.SOFT_LANDED) {
      this.nbrSoftLandingsProperty.value += 1;
      this.scoreProperty.value += LunarLanderConstants.SOFT_LANDING_BONUS;
    } else if (crashState === CrashState.HARD_LANDED) {
      this.nbrHardLandingsProperty.value += 1;
    }
  }

  public reset(): void {
    this.scoreProperty.reset();
    this.nbrSoftLandingsProperty.reset();
    this.nbrHardLandingsProperty.reset();
    this.landedOn.length = 0;
  }
}
