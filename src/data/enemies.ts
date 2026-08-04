import type { EnemyDef } from "../game/types";

// Zones scale the base enemy stats up; these are the tier-1 archetypes.
export const ENEMIES: EnemyDef[] = [
  {
    id: "slime",
    name: "Green Slime",
    tier: 1,
    hp: 22,
    atk: 5,
    def: 1,
    xp: 6,
    gold: 4,
    color: "slime",
    drops: [
      ["m_slime_gel", 0.55],
      ["w_rusty_sword", 0.05],
      ["a_cloth_tunic", 0.05],
      ["c_minor_potion", 0.08],
    ],
  },
  {
    id: "bat",
    name: "Cave Bat",
    tier: 1,
    hp: 18,
    atk: 7,
    def: 0,
    xp: 7,
    gold: 5,
    color: "bat",
    drops: [
      ["w_short_bow", 0.06],
      ["a_leather_cap", 0.06],
      ["ac_copper_ring", 0.03],
    ],
  },
  {
    id: "goblin",
    name: "Goblin Raider",
    tier: 2,
    hp: 40,
    atk: 11,
    def: 3,
    xp: 14,
    gold: 12,
    color: "goblin",
    drops: [
      ["m_iron_ore", 0.4],
      ["w_iron_sword", 0.07],
      ["a_chainmail", 0.05],
      ["a_leather_greaves", 0.06],
      ["c_minor_potion", 0.1],
    ],
  },
  {
    id: "wolf",
    name: "Dire Wolf",
    tier: 2,
    hp: 46,
    atk: 14,
    def: 2,
    xp: 16,
    gold: 11,
    color: "wolf",
    drops: [
      ["w_hunter_bow", 0.06],
      ["a_ranger_hood", 0.04],
    ],
  },
  {
    id: "skeleton",
    name: "Skeleton Warrior",
    tier: 3,
    hp: 78,
    atk: 20,
    def: 6,
    xp: 30,
    gold: 24,
    color: "skeleton",
    drops: [
      ["w_war_axe", 0.07],
      ["a_iron_greaves", 0.06],
      ["w_frost_rod", 0.05],
      ["c_greater_potion", 0.08],
    ],
  },
  {
    id: "cultist",
    name: "Shadow Cultist",
    tier: 4,
    hp: 120,
    atk: 28,
    def: 9,
    xp: 52,
    gold: 44,
    color: "cultist",
    drops: [
      ["m_shadow_essence", 0.35],
      ["w_arcane_scepter", 0.06],
      ["a_mage_robe", 0.05],
      ["a_plate_armor", 0.05],
      ["ac_ogre_charm", 0.03],
    ],
  },
  {
    id: "ogre",
    name: "Ogre Brute",
    tier: 4,
    hp: 165,
    atk: 34,
    def: 11,
    xp: 66,
    gold: 60,
    color: "ogre",
    drops: [
      ["w_greatblade", 0.06],
      ["a_plate_armor", 0.06],
      ["ac_ogre_charm", 0.05],
      ["ac_luck_clover", 0.02],
    ],
  },
  {
    id: "dragon",
    name: "Ashwing Dragon",
    tier: 5,
    hp: 320,
    atk: 48,
    def: 16,
    xp: 140,
    gold: 160,
    color: "dragon",
    drops: [
      ["w_doomcleaver", 0.05],
      ["w_stormfang", 0.05],
      ["w_sunfire_staff", 0.05],
      ["a_dragon_helm", 0.05],
      ["a_aegis_mail", 0.04],
      ["a_titan_greaves", 0.04],
    ],
  },
];

export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e]),
);

// Which enemies can appear in a given zone (1-indexed), plus a scaling factor.
export function zoneEnemies(zone: number): EnemyDef[] {
  // Each zone widens the pool and scales stats. Zone 1 = tier 1 only.
  const maxTier = Math.min(5, 1 + Math.floor((zone - 1) / 2));
  const minTier = Math.max(1, maxTier - 2);
  const pool = ENEMIES.filter((e) => e.tier >= minTier && e.tier <= maxTier);
  const scale = zoneScale(zone);
  return pool.map((e) => ({
    ...e,
    hp: Math.round(e.hp * scale),
    atk: Math.round(e.atk * scale),
    def: Math.round(e.def * scale),
    xp: Math.round(e.xp * (1 + (zone - 1) * 0.15)),
    gold: Math.round(e.gold * (1 + (zone - 1) * 0.18)),
  }));
}

export function zoneScale(zone: number): number {
  return Math.pow(1.16, zone - 1);
}

export const ZONE_NAMES = [
  "Green Meadow",
  "Whisper Cave",
  "Ruined Keep",
  "Bone Wastes",
  "Ember Marsh",
  "Shadowfen",
  "Ogre Hills",
  "Ashwing Peak",
];

export function zoneName(zone: number): string {
  return ZONE_NAMES[(zone - 1) % ZONE_NAMES.length] + (zone > ZONE_NAMES.length ? ` +${Math.floor((zone - 1) / ZONE_NAMES.length)}` : "");
}
