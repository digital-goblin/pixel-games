// ---------- Core RPG types ----------

export type StatKey = "str" | "dex" | "int" | "vit" | "luck";

export type StatBlock = Record<StatKey, number>;

export const ZERO_STATS: StatBlock = { str: 0, dex: 0, int: 0, vit: 0, luck: 0 };

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipSlot = "weapon" | "head" | "chest" | "legs" | "accessory";

export type ItemKind = EquipSlot | "consumable" | "material";

// A scaling weapon deals damage off one primary stat.
export type ScalingStat = "str" | "dex" | "int";

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  /** which equipment slot this occupies, if equippable */
  slot?: EquipSlot;
  /** base tier 1..5, used to gate drops and scale numbers */
  tier: number;
  /** flat attack contributed by a weapon before stat scaling */
  atk?: number;
  /** which stat a weapon scales with */
  scaling?: ScalingStat;
  /** flat defense contributed by armor */
  def?: number;
  /** flat stat bonuses granted while equipped */
  stats?: Partial<StatBlock>;
  /** for consumables: heal a % of max hp */
  healPct?: number;
  /** base gold value */
  value: number;
  /** icon palette index for the code-drawn sprite */
  icon: string;
  desc?: string;
}

// A concrete item instance in the player's bag (rolled rarity + affixes).
export interface ItemStack {
  uid: string;
  defId: string;
  rarity: Rarity;
  qty: number;
  /** rolled multiplier applied to atk/def from rarity, e.g. 1.0..1.6 */
  roll: number;
}

export interface ClassDef {
  id: string;
  name: string;
  desc: string;
  base: StatBlock;
  /** stat gained per level */
  growth: StatBlock;
  /** preferred weapon scaling — used for starting gear + tips */
  affinity: ScalingStat;
  passive: string;
  color: string; // sprite palette key
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: number;
  hp: number;
  atk: number;
  def: number;
  /** xp + gold rewards */
  xp: number;
  gold: number;
  color: string;
  /** loot table: [itemDefId, dropChance] */
  drops: [string, number][];
}

export interface Hero {
  classId: string;
  level: number;
  xp: number;
  hp: number; // current hp (for the running battle)
  equipment: Partial<Record<EquipSlot, ItemStack>>;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastSeen: number;

  // walking / idle economy
  lifetimeSteps: number;
  stepsToday: number;
  energy: number; // banked, spent on expeditions
  energyMax: number;

  gold: number;
  gems: number;

  hero: Hero;
  bag: ItemStack[];

  // companions
  pets: PetStack[];
  activePetUid: string | null;
  egg: EggState | null;

  // progression
  zone: number; // current adventure zone index
  kills: number;
  bestZone: number;

  // idle bookkeeping
  lastStepSample: number;

  settings: {
    sfx: boolean;
  };
}

// ---------- Companions / pets ----------

// Passive bonuses a companion contributes while active.
export interface PetBonus {
  atkPct: number; // +% attack
  defPct: number; // +% defense
  critAdd: number; // +crit chance (absolute, 0..1)
  luckAdd: number; // +luck (loot)
  goldPct: number; // +% gold from kills
}

export interface PetSpecies {
  id: string;
  name: string;
  sprite: string; // reuses an enemy sprite key in sprites.ts
  desc: string;
  base: Partial<PetBonus>; // bonus at common rarity, scaled by rarity
  eggWeight: number; // how often this species rolls from an egg
}

export interface PetStack {
  uid: string;
  speciesId: string;
  rarity: Rarity;
}

// An egg that incubates from real-world steps and hatches into a PetStack.
export interface EggState {
  speciesId: string;
  rarity: Rarity;
  stepsRequired: number;
  stepsDone: number;
}

// Fully-derived combat stats after class + level + equipment.
export interface DerivedStats {
  maxHp: number;
  atk: number;
  def: number;
  critChance: number; // 0..1
  critMult: number;
  stats: StatBlock;
}
