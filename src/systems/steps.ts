// ---------------------------------------------------------------------------
// StepSource is the seam between the game and where step data comes from.
//
//  - In the browser / during development we use SimulatedStepSource.
//  - On iOS (Capacitor) you implement HealthKitStepSource against a HealthKit
//    plugin (e.g. @perfood/capacitor-healthkit or a custom bridge) so the SAME
//    game code reads REAL steps. Nothing else in the game needs to change.
//
// The contract is intentionally tiny: "how many steps has the user taken today?"
// The engine diffs successive samples to derive newly-earned energy, which is
// exactly how you'd query HealthKit (sum of HKQuantityTypeIdentifierStepCount
// for the current day).
// ---------------------------------------------------------------------------

export interface StepSource {
  readonly name: string;
  init(): Promise<void>;
  /** cumulative steps for the current local day */
  todaySteps(): Promise<number>;
  /** dev-only manual injection; real sources may omit */
  addManual?(steps: number): void;
}

export const STEP_TO_ENERGY = 1; // 1 step == 1 energy

// A source you can drive by hand (and optionally auto-walk) for development.
export class SimulatedStepSource implements StepSource {
  readonly name = "simulated";
  private steps = 0;
  private autoPerSec: number;

  constructor(opts: { startSteps?: number; autoPerSec?: number } = {}) {
    this.steps = opts.startSteps ?? 0;
    this.autoPerSec = opts.autoPerSec ?? 0;
  }

  async init(): Promise<void> {
    // no-op for the simulator
  }

  async todaySteps(): Promise<number> {
    return Math.floor(this.steps);
  }

  addManual(steps: number): void {
    this.steps += steps;
  }

  /** call from the game loop with a dt in seconds to simulate ambient walking */
  autoWalk(dtSeconds: number): void {
    if (this.autoPerSec > 0) this.steps += this.autoPerSec * dtSeconds;
  }
}

// Placeholder for the native implementation. On your Mac, after
// `npx cap add ios`, install a HealthKit plugin and fill this in. See README.
export class HealthKitStepSource implements StepSource {
  readonly name = "healthkit";
  async init(): Promise<void> {
    throw new Error(
      "HealthKitStepSource not wired up yet — implement against a Capacitor HealthKit plugin on iOS.",
    );
  }
  async todaySteps(): Promise<number> {
    return 0;
  }
}
