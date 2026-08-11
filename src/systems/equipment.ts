import type {
  DerivedStats,
  GameState,
  ItemStack,
  StatBlock,
  StatKey,
} from "../game/types";
import { ZERO_STATS } from "../game/types";
import { CLASS_BY_ID } from "../data/classes";
import { itemDef } from "../data/items";
import { activePetBonus } from "./pets";

const STAT_KEYS: StatKey[] = ["str", "dex", "int", "vit", "luck"];

function addStats(a: StatBlock, b: Partial<StatBlock>): StatBlock {
  const out = { ...a };
  for (const k of STAT_KEYS) out[k] += b[k] ?? 0;
  return out;
}

// Per-class combat multipliers driven by their passive.
function classMods(classId: string) {
  switch (classId) {
    case "knight":
      return { atk: 1, def: 1.12, crit: 0, critMult: 0, luck: 0 };
    case "ranger":
      return { atk: 1, def: 1, crit: 0.08, critMult: 0, luck: 0 };
    case "mage":
      return { atk: 1.15, def: 1, crit: 0, critMult: 0, luck: 0 };
    case "rogue":
      return { atk: 1, def: 1, crit: 0, critMult: 0.35, luck: 0.2 };
    default:
      return { atk: 1, def: 1, crit: 0, critMult: 0, luck: 0 };
  }
}

// The single source of truth for a hero's effective combat numbers.
export function deriveStats(state: GameState): DerivedStats {
  const hero = state.hero;
  const cls = CLASS_BY_ID[hero.classId];
  const mods = classMods(hero.classId);

  // 1) base stats: class base + growth per level + equipment stat bonuses
  let stats: StatBlock = { ...ZERO_STATS };
  stats = addStats(stats, cls.base);
  for (const k of STAT_KEYS) stats[k] += cls.growth[k] * (hero.level - 1);

  const equips = Object.values(hero.equipment).filter(Boolean) as ItemStack[];
  for (const stack of equips) {
    const def = itemDef(stack.defId);
    if (def.stats) stats = addStats(stats, def.stats);
  }

  // active companion contributes luck directly and %-modifiers below
  const pet = activePetBonus(state);
  stats.luck += pet.luckAdd;

  // 2) weapon attack
  let weaponAtk = 0;
  let scalingStat: StatKey = "str";
  const weapon = hero.equipment.weapon;
  if (weapon) {
    const wdef = itemDef(weapon.defId);
    weaponAtk = (wdef.atk ?? 0) * weapon.roll;
    scalingStat = (wdef.scaling ?? "str") as StatKey;
  } else {
    // bare fists scale off str
    weaponAtk = 2;
  }
  const scaling = stats[scalingStat] * 1.5;
  const atk = Math.max(1, Math.round((weaponAtk + scaling) * mods.atk * (1 + pet.atkPct)));

  // 3) defense from armor + vitality
  let armorDef = 0;
  for (const stack of equips) {
    const def = itemDef(stack.defId);
    if (def.def) armorDef += def.def * stack.roll;
  }
  const defense = Math.round((armorDef + stats.vit * 0.6) * mods.def * (1 + pet.defPct));

  // 4) hp
  const maxHp = Math.round(30 + stats.vit * 9 + hero.level * 6);

  // 5) crit
  const critChance = Math.min(
    0.75,
    0.05 + stats.dex * 0.004 + stats.luck * 0.005 + mods.crit + pet.critAdd,
  );
  const critMult = 1.5 + mods.critMult + stats.luck * 0.008;

  return { maxHp, atk, def: defense, critChance, critMult, stats };
}

// Effective loot-luck (rogue bonus folded in) for drop rolls.
export function effectiveLuck(state: GameState): number {
  const d = deriveStats(state);
  const mult = state.hero.classId === "rogue" ? 1.2 : 1;
  return d.stats.luck * mult;
}
