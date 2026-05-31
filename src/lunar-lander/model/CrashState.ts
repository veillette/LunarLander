/**
 * CrashState.ts
 *
 * The lander's flight/landing status. TypeScript 6 `erasableSyntaxOnly` forbids
 * `enum`, so this is a frozen object plus a derived union type.
 */
export const CrashState = {
  IN_FLIGHT: "inFlight",
  SOFT_LANDED: "softLanded",
  HARD_LANDED: "hardLanded",
  CRASH_LANDED: "crashLanded",
} as const;

export type CrashState = (typeof CrashState)[keyof typeof CrashState];
