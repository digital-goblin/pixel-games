import type {
  EggState,
  GameState,
  PetBonus,
  PetStack,
  Rarity,
} from "../game/types";
import { PET_SPECIES, petSpecies } from "../data/pets";
import { RARITY_ORDER } from "../data/rarities";
import { randInt, weighted } from "../game/rng";

const ZERO_BONUS: PetBonus = { atkPct: 0, defPct: 0, critAdd: 0, luckAdd: 0, goldPct: 0 };

// Rarity multiplies a species' base bonus and sets how many steps its egg needs.
const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.2,
  epic: 3,
  legendary: 4,
};

const EGG_STEPS: Record<Rarity, number> = {
  common: 1500,
  uncommon: 3000,
  rare: 6000,
  epic: 12000,
  legendary: 20000,
};

// Pet eggs skew common — legendaries are a long-walk reward.
const EGG_RARITY_WEIGHTS: [Rarity, number][] = [
  ["common", 100],
  ["uncommon", 40],
  ["rare", 14],
  ["epic", 3.5],
  ["legendary", 0.7],
];

let petUid = 1;
function makePetUid(id: string) {
  return `pet-${id}-${(petUid++).toString(36)}${randInt(100, 999)}`;
}

export function petBonus(stack: PetStack): PetBonus {
  const sp = petSpecies(stack.speciesId);
  const m = RARITY_MULT[stack.rarity];
  const out: PetBonus = { ...ZERO_BONUS };
  for (const k of Object.keys(out) as (keyof PetBonus)[]) {
    out[k] = (sp.base[k] ?? 0) * m;
  }
  return out;
}

export function activePet(state: GameState): PetStack | null {
  if (!state.activePetUid) return null;
  return state.pets.find((p) => p.uid === state.activePetUid) ?? null;
}

export function activePetBonus(state: GameState): PetBonus {
  const p = activePet(state);
  return p ? petBonus(p) : { ...ZERO_BONUS };
}

// Roll a fresh egg (species + rarity + step cost).
export function newEgg(rarityBiasWeights = EGG_RARITY_WEIGHTS): EggState {
  const rarity = weighted(rarityBiasWeights);
  const species = weighted(PET_SPECIES.map((s) => [s.id, s.eggWeight] as [string, number]));
  return {
    speciesId: species,
    rarity,
    stepsRequired: EGG_STEPS[rarity],
    stepsDone: 0,
  };
}

// A guaranteed-good egg (boss reward): never common, skewed higher.
export function bossEgg(): EggState {
  return newEgg([
    ["uncommon", 50],
    ["rare", 30],
    ["epic", 12],
    ["legendary", 3],
  ] as [Rarity, number][]);
}

// Advance the incubating egg by `steps`. Returns a hatched pet if it completed.
export function progressEgg(state: GameState, steps: number): PetStack | null {
  if (!state.egg || steps <= 0) return null;
  state.egg.stepsDone += steps;
  if (state.egg.stepsDone < state.egg.stepsRequired) return null;
  // hatch!
  const hatched: PetStack = {
    uid: makePetUid(state.egg.speciesId),
    speciesId: state.egg.speciesId,
    rarity: state.egg.rarity,
  };
  state.pets.push(hatched);
  // auto-equip the first pet
  if (!state.activePetUid) state.activePetUid = hatched.uid;
  // start the next egg
  state.egg = newEgg();
  return hatched;
}

// Compact label for the bonus a pet grants.
export function petBonusLabel(stack: PetStack): string {
  const b = petBonus(stack);
  const parts: string[] = [];
  if (b.atkPct) parts.push(`+${Math.round(b.atkPct * 100)}% ATK`);
  if (b.defPct) parts.push(`+${Math.round(b.defPct * 100)}% DEF`);
  if (b.critAdd) parts.push(`+${Math.round(b.critAdd * 100)}% crit`);
  if (b.luckAdd) parts.push(`+${Math.round(b.luckAdd)} luck`);
  if (b.goldPct) parts.push(`+${Math.round(b.goldPct * 100)}% gold`);
  return parts.join(", ") || "—";
}

export function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}
