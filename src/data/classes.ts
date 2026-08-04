import type { ClassDef } from "../game/types";

// Four starting archetypes. Each has a distinct stat identity, a scaling
// affinity that decides which weapons feel best, and a flavor passive.
export const CLASSES: ClassDef[] = [
  {
    id: "knight",
    name: "Knight",
    desc: "Sturdy frontliner. High HP and defense — outlasts everything.",
    base: { str: 6, dex: 3, int: 1, vit: 7, luck: 2 },
    growth: { str: 2, dex: 1, int: 0, vit: 3, luck: 1 },
    affinity: "str",
    passive: "Bulwark: +12% defense.",
    color: "steel",
  },
  {
    id: "ranger",
    name: "Ranger",
    desc: "Nimble striker. Dexterity scaling with frequent crits.",
    base: { str: 4, dex: 7, int: 2, vit: 4, luck: 4 },
    growth: { str: 1, dex: 3, int: 0, vit: 1, luck: 2 },
    affinity: "dex",
    passive: "Keen Eye: +8% crit chance.",
    color: "forest",
  },
  {
    id: "mage",
    name: "Mage",
    desc: "Glass cannon. Intelligence scaling hits like a truck.",
    base: { str: 2, dex: 3, int: 8, vit: 3, luck: 3 },
    growth: { str: 0, dex: 1, int: 3, vit: 1, luck: 1 },
    affinity: "int",
    passive: "Arcane Might: +15% attack.",
    color: "violet",
  },
  {
    id: "rogue",
    name: "Rogue",
    desc: "Lucky opportunist. Crits hard and finds better loot.",
    base: { str: 3, dex: 6, int: 3, vit: 3, luck: 6 },
    growth: { str: 1, dex: 2, int: 1, vit: 1, luck: 3 },
    affinity: "dex",
    passive: "Fortune: +20% loot rarity luck & crit damage.",
    color: "crimson",
  },
];

export const CLASS_BY_ID: Record<string, ClassDef> = Object.fromEntries(
  CLASSES.map((c) => [c.id, c]),
);
