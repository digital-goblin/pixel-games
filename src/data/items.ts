import type { ItemDef } from "../game/types";

// Data-driven item catalog. Numbers are BASE values; rarity roll multiplies
// atk/def at drop time. `icon` selects a code-drawn sprite in sprites.ts.
export const ITEMS: ItemDef[] = [
  // ---------- Weapons (STR) ----------
  { id: "w_rusty_sword", name: "Rusty Sword", kind: "weapon", slot: "weapon", tier: 1, atk: 6, scaling: "str", value: 8, icon: "sword", desc: "Seen better centuries." },
  { id: "w_iron_sword", name: "Iron Sword", kind: "weapon", slot: "weapon", tier: 2, atk: 12, scaling: "str", value: 26, icon: "sword" },
  { id: "w_war_axe", name: "War Axe", kind: "weapon", slot: "weapon", tier: 3, atk: 21, scaling: "str", value: 70, icon: "axe", desc: "Heavy, mean, effective." },
  { id: "w_greatblade", name: "Greatblade", kind: "weapon", slot: "weapon", tier: 4, atk: 34, scaling: "str", value: 180, icon: "sword" },
  { id: "w_doomcleaver", name: "Doomcleaver", kind: "weapon", slot: "weapon", tier: 5, atk: 52, scaling: "str", stats: { str: 4 }, value: 460, icon: "axe", desc: "It hums for battle." },

  // ---------- Weapons (DEX) ----------
  { id: "w_short_bow", name: "Short Bow", kind: "weapon", slot: "weapon", tier: 1, atk: 5, scaling: "dex", value: 9, icon: "bow" },
  { id: "w_hunter_bow", name: "Hunter's Bow", kind: "weapon", slot: "weapon", tier: 2, atk: 11, scaling: "dex", stats: { luck: 1 }, value: 30, icon: "bow" },
  { id: "w_twin_daggers", name: "Twin Daggers", kind: "weapon", slot: "weapon", tier: 3, atk: 18, scaling: "dex", stats: { dex: 2 }, value: 78, icon: "dagger" },
  { id: "w_wind_glaive", name: "Wind Glaive", kind: "weapon", slot: "weapon", tier: 4, atk: 30, scaling: "dex", value: 190, icon: "dagger" },
  { id: "w_stormfang", name: "Stormfang", kind: "weapon", slot: "weapon", tier: 5, atk: 47, scaling: "dex", stats: { dex: 4, luck: 2 }, value: 480, icon: "dagger", desc: "Crackles with static." },

  // ---------- Weapons (INT) ----------
  { id: "w_apprentice_staff", name: "Apprentice Staff", kind: "weapon", slot: "weapon", tier: 1, atk: 5, scaling: "int", value: 10, icon: "staff" },
  { id: "w_oak_wand", name: "Oak Wand", kind: "weapon", slot: "weapon", tier: 2, atk: 11, scaling: "int", stats: { int: 1 }, value: 32, icon: "staff" },
  { id: "w_frost_rod", name: "Frost Rod", kind: "weapon", slot: "weapon", tier: 3, atk: 19, scaling: "int", value: 82, icon: "staff" },
  { id: "w_arcane_scepter", name: "Arcane Scepter", kind: "weapon", slot: "weapon", tier: 4, atk: 31, scaling: "int", stats: { int: 3 }, value: 195, icon: "staff" },
  { id: "w_sunfire_staff", name: "Sunfire Staff", kind: "weapon", slot: "weapon", tier: 5, atk: 49, scaling: "int", stats: { int: 5 }, value: 500, icon: "staff", desc: "Warm to the touch." },

  // ---------- Head ----------
  { id: "a_leather_cap", name: "Leather Cap", kind: "head", slot: "head", tier: 1, def: 3, value: 7, icon: "cap" },
  { id: "a_iron_helm", name: "Iron Helm", kind: "head", slot: "head", tier: 2, def: 7, value: 24, icon: "helm" },
  { id: "a_ranger_hood", name: "Ranger Hood", kind: "head", slot: "head", tier: 3, def: 11, stats: { dex: 2 }, value: 66, icon: "hood" },
  { id: "a_dragon_helm", name: "Dragonbone Helm", kind: "head", slot: "head", tier: 5, def: 22, stats: { vit: 3 }, value: 300, icon: "helm" },

  // ---------- Chest ----------
  { id: "a_cloth_tunic", name: "Cloth Tunic", kind: "chest", slot: "chest", tier: 1, def: 4, value: 9, icon: "tunic" },
  { id: "a_chainmail", name: "Chainmail", kind: "chest", slot: "chest", tier: 2, def: 10, value: 34, icon: "plate" },
  { id: "a_mage_robe", name: "Mage Robe", kind: "chest", slot: "chest", tier: 3, def: 13, stats: { int: 3 }, value: 90, icon: "robe" },
  { id: "a_plate_armor", name: "Plate Armor", kind: "chest", slot: "chest", tier: 4, def: 20, stats: { vit: 2 }, value: 210, icon: "plate" },
  { id: "a_aegis_mail", name: "Aegis Mail", kind: "chest", slot: "chest", tier: 5, def: 30, stats: { vit: 4, str: 2 }, value: 520, icon: "plate", desc: "Turns aside blows." },

  // ---------- Legs ----------
  { id: "a_worn_pants", name: "Worn Pants", kind: "legs", slot: "legs", tier: 1, def: 3, value: 6, icon: "greaves" },
  { id: "a_leather_greaves", name: "Leather Greaves", kind: "legs", slot: "legs", tier: 2, def: 6, stats: { dex: 1 }, value: 22, icon: "greaves" },
  { id: "a_iron_greaves", name: "Iron Greaves", kind: "legs", slot: "legs", tier: 3, def: 10, value: 64, icon: "greaves" },
  { id: "a_titan_greaves", name: "Titan Greaves", kind: "legs", slot: "legs", tier: 5, def: 19, stats: { vit: 2 }, value: 290, icon: "greaves" },

  // ---------- Accessories ----------
  { id: "ac_copper_ring", name: "Copper Ring", kind: "accessory", slot: "accessory", tier: 1, stats: { luck: 1 }, value: 12, icon: "ring" },
  { id: "ac_swift_band", name: "Band of Swiftness", kind: "accessory", slot: "accessory", tier: 3, stats: { dex: 3, luck: 1 }, value: 88, icon: "ring" },
  { id: "ac_ember_amulet", name: "Ember Amulet", kind: "accessory", slot: "accessory", tier: 3, stats: { int: 3 }, value: 92, icon: "amulet" },
  { id: "ac_ogre_charm", name: "Ogre Charm", kind: "accessory", slot: "accessory", tier: 4, stats: { str: 4, vit: 1 }, value: 160, icon: "amulet" },
  { id: "ac_luck_clover", name: "Four-Leaf Clover", kind: "accessory", slot: "accessory", tier: 4, stats: { luck: 6 }, value: 175, icon: "ring", desc: "Loot smiles upon you." },

  // ---------- Consumables ----------
  { id: "c_minor_potion", name: "Minor Potion", kind: "consumable", tier: 1, healPct: 0.4, value: 10, icon: "potion", desc: "A rush of vigor — grants a burst of energy." },
  { id: "c_greater_potion", name: "Greater Potion", kind: "consumable", tier: 3, healPct: 0.75, value: 40, icon: "potion", desc: "A powerful draught — grants a large energy surge." },

  // ---------- Materials ----------
  { id: "m_slime_gel", name: "Slime Gel", kind: "material", tier: 1, value: 3, icon: "gel" },
  { id: "m_iron_ore", name: "Iron Ore", kind: "material", tier: 2, value: 6, icon: "ore" },
  { id: "m_shadow_essence", name: "Shadow Essence", kind: "material", tier: 4, value: 25, icon: "gel" },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

export function itemDef(id: string): ItemDef {
  const d = ITEM_BY_ID[id];
  if (!d) throw new Error(`Unknown item: ${id}`);
  return d;
}
