import type {
  BattleLine,
} from "../systems/combat";
import type { EnemyDef, GameState, ItemStack, PetStack } from "./types";
import { deriveStats, effectiveLuck } from "../systems/equipment";
import { estimateWin, simulateBattle } from "../systems/combat";
import { addToBag, makeStack, rollDrops } from "../systems/loot";
import { grantXp } from "../systems/leveling";
import { zoneEnemies, zoneName } from "../data/enemies";
import { CLASS_BY_ID } from "../data/classes";
import { itemDef } from "../data/items";
import { rarityWeights } from "../data/rarities";
import { chance, pick, weighted } from "./rng";
import { activePetBonus, bossEgg, progressEgg } from "../systems/pets";
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
  isBoss: boolean;
  win: boolean;
  xp: number;
  gold: number;
  gems: number;
  levels: number;
  drops: ItemStack[];
  eggDropped: boolean;
  log: BattleLine[];
  zoneAdvanced: boolean;
}

// The zone-ending encounter (the KILLS_PER_ZONE-th kill) is a boss.
export function isBossNext(state: GameState): boolean {
  return state.kills % KILLS_PER_ZONE === KILLS_PER_ZONE - 1;
}

// Build the elite zone boss: a scaled-up version of the toughest local enemy.
export function makeBoss(zone: number): EnemyDef {
  const pool = zoneEnemies(zone);
  const base = pool[pool.length - 1]; // highest tier in the zone
  return {
    ...base,
    id: base.id + "_boss",
    name: `${zoneName(zone)} Warden`,
    hp: Math.round(base.hp * 4.2),
    atk: Math.round(base.atk * 1.7),
    def: Math.round(base.def * 1.5),
    xp: Math.round(base.xp * 6),
    gold: Math.round(base.gold * 6),
  };
}

// Guaranteed elevated loot for a boss kill (at least one gear piece).
function bossDrops(enemy: EnemyDef, luck: number): ItemStack[] {
  const gear = enemy.drops.filter(([id]) => !!itemDef(id).slot);
  const out: ItemStack[] = [];
  for (const [id, p] of gear) {
    if (chance(Math.min(0.9, p * 4))) {
      out.push(makeStack(id, weighted(rarityWeights(luck + 30))));
    }
  }
  if (out.length === 0 && gear.length > 0) {
    const [id] = pick(gear);
    out.push(makeStack(id, weighted(rarityWeights(luck + 30))));
  }
  return out.slice(0, 3);
}

// Resolve a single encounter in the current zone, applying all rewards to
// state. `live` = produce a per-hit log for display; offline skips the log.
export function runEncounter(
  state: GameState,
  live: boolean,
): EncounterOutcome | null {
  if (state.energy < ENCOUNTER_COST) return null;

  const derived = deriveStats(state);
  const boss = isBossNext(state);
  const enemy = boss ? makeBoss(state.zone) : pick(zoneEnemies(state.zone));
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
  let gems = 0;
  let levels = 0;
  let eggDropped = false;
  const drops: ItemStack[] = [];
  let zoneAdvanced = false;

  if (win) {
    const petGold = activePetBonus(state).goldPct;
    xp = enemy.xp;
    gold = Math.round(enemy.gold * (1 + petGold));
    state.gold += gold;
    levels = grantXp(state.hero, xp).levelsGained;

    const luck = effectiveLuck(state);
    const rolled = boss ? bossDrops(enemy, luck) : rollDrops(enemy, luck);
    for (const s of rolled) {
      addToBag(state.bag, s);
      drops.push(s);
    }

    if (boss) {
      gems = 2 + state.zone;
      // a boss guarantees an egg if you're not already incubating one
      if (!state.egg) {
        state.egg = bossEgg();
        eggDropped = true;
      } else {
        gems += 2; // otherwise a little extra shiny
      }
      state.gems += gems;
    }

    state.kills += 1;
    if (state.kills % KILLS_PER_ZONE === 0) {
      state.zone += 1;
      state.bestZone = Math.max(state.bestZone, state.zone);
      zoneAdvanced = true;
    }
  }

  return { enemy, isBoss: boss, win, xp, gold, gems, levels, drops, eggDropped, log, zoneAdvanced };
}

export interface OfflineSummary {
  elapsedMs: number;
  encounters: number;
  wins: number;
  xp: number;
  gold: number;
  gems: number;
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
    gems: 0,
    levels: 0,
    drops: [],
    capped,
  };

  const goldBefore = state.gold;
  const gemsBefore = state.gems;
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
  summary.gems = state.gems - gemsBefore;
  return summary;
}

export interface StepSync {
  steps: number;
  hatched: PetStack | null;
}

// Reconcile a fresh step sample from the source: steps become energy AND
// incubate the active egg. Returns the delta and any pet that hatched.
export async function syncSteps(
  state: GameState,
  source: StepSource,
  now: number,
): Promise<StepSync> {
  const today = await source.todaySteps();
  // If the counter went backwards (new day / new source), rebase without award.
  const delta = today >= state.stepsToday ? today - state.stepsToday : 0;
  state.stepsToday = today;
  let hatched: PetStack | null = null;
  if (delta > 0) {
    state.lifetimeSteps += delta;
    addEnergy(state, delta);
    hatched = progressEgg(state, delta);
  }
  state.lastStepSample = now;
  return { steps: delta, hatched };
}
