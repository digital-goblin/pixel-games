import type {
  BattleLine,
} from "../systems/combat";
import type { EnemyDef, GameState, ItemStack } from "./types";
import { deriveStats, effectiveLuck } from "../systems/equipment";
import { estimateWin, simulateBattle } from "../systems/combat";
import { addToBag, rollDrops } from "../systems/loot";
import { grantXp } from "../systems/leveling";
import { zoneEnemies } from "../data/enemies";
import { CLASS_BY_ID } from "../data/classes";
import { pick } from "./rng";
import { STEP_TO_ENERGY, type StepSource } from "../systems/steps";

export const ENCOUNTER_COST = 10; // energy (== steps) per fight
export const ENCOUNTER_MS = 2500; // live cadence between fights
export const KILLS_PER_ZONE = 12;
const OFFLINE_ENCOUNTER_CAP = 3000; // don't simulate more than this at once

export function energyMaxFor(state: GameState): number {
  return 400 + state.hero.level * 25;
}

export function addEnergy(state: GameState, steps: number): void {
  const gain = steps * STEP_TO_ENERGY;
  state.energyMax = energyMaxFor(state);
  state.energy = Math.min(state.energyMax, state.energy + gain);
}

export function heroName(state: GameState): string {
  return CLASS_BY_ID[state.hero.classId]?.name ?? "Hero";
}

export interface EncounterOutcome {
  enemy: EnemyDef;
  win: boolean;
  xp: number;
  gold: number;
  levels: number;
  drops: ItemStack[];
  log: BattleLine[];
  zoneAdvanced: boolean;
}

// Resolve a single encounter in the current zone, applying all rewards to
// state. `live` = produce a per-hit log for display; offline skips the log.
export function runEncounter(
  state: GameState,
  live: boolean,
): EncounterOutcome | null {
  if (state.energy < ENCOUNTER_COST) return null;

  const derived = deriveStats(state);
  const pool = zoneEnemies(state.zone);
  const enemy = pick(pool);
  state.energy -= ENCOUNTER_COST;

  let win: boolean;
  let log: BattleLine[] = [];
  if (live) {
    const r = simulateBattle(derived, enemy, heroName(state));
    win = r.win;
    log = r.log;
  } else {
    win = estimateWin(derived, enemy);
  }

  let xp = 0;
  let gold = 0;
  let levels = 0;
  const drops: ItemStack[] = [];
  let zoneAdvanced = false;

  if (win) {
    xp = enemy.xp;
    gold = enemy.gold;
    state.gold += gold;
    levels = grantXp(state.hero, xp).levelsGained;

    const rolled = rollDrops(enemy, effectiveLuck(state));
    for (const s of rolled) {
      addToBag(state.bag, s);
      drops.push(s);
    }

    state.kills += 1;
    if (state.kills % KILLS_PER_ZONE === 0) {
      state.zone += 1;
      state.bestZone = Math.max(state.bestZone, state.zone);
      zoneAdvanced = true;
    }
  }

  return { enemy, win, xp, gold, levels, drops, log, zoneAdvanced };
}

export interface OfflineSummary {
  elapsedMs: number;
  encounters: number;
  wins: number;
  xp: number;
  gold: number;
  levels: number;
  drops: ItemStack[];
  capped: boolean;
}

// "While you were away" — spend banked energy over elapsed real time.
export function offlineProgress(state: GameState, now: number): OfflineSummary {
  const elapsedMs = Math.max(0, now - state.lastSeen);
  const byTime = Math.floor(elapsedMs / ENCOUNTER_MS);
  const byEnergy = Math.floor(state.energy / ENCOUNTER_COST);
  let n = Math.min(byTime, byEnergy);
  const capped = n > OFFLINE_ENCOUNTER_CAP;
  if (capped) n = OFFLINE_ENCOUNTER_CAP;

  const summary: OfflineSummary = {
    elapsedMs,
    encounters: 0,
    wins: 0,
    xp: 0,
    gold: 0,
    levels: 0,
    drops: [],
    capped,
  };

  const goldBefore = state.gold;
  for (let i = 0; i < n; i++) {
    const out = runEncounter(state, false);
    if (!out) break;
    summary.encounters++;
    if (out.win) {
      summary.wins++;
      summary.xp += out.xp;
      summary.levels += out.levels;
      summary.drops.push(...out.drops);
    }
  }
  summary.gold = state.gold - goldBefore;
  return summary;
}

// Reconcile a fresh step sample from the source into banked energy.
export async function syncSteps(
  state: GameState,
  source: StepSource,
  now: number,
): Promise<number> {
  const today = await source.todaySteps();
  // If the counter went backwards (new day / new source), rebase without award.
  const delta = today >= state.stepsToday ? today - state.stepsToday : 0;
  state.stepsToday = today;
  if (delta > 0) {
    state.lifetimeSteps += delta;
    addEnergy(state, delta);
  }
  state.lastStepSample = now;
  return delta;
}
