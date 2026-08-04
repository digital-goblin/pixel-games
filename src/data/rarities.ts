import type { Rarity } from "../game/types";

export interface RarityDef {
  id: Rarity;
  label: string;
  weight: number; // base drop weight
  rollMin: number; // stat multiplier range
  rollMax: number;
  valueMult: number;
}

export const RARITIES: Record<Rarity, RarityDef> = {
  common: { id: "common", label: "Common", weight: 100, rollMin: 0.9, rollMax: 1.05, valueMult: 1 },
  uncommon: { id: "uncommon", label: "Uncommon", weight: 46, rollMin: 1.05, rollMax: 1.2, valueMult: 2 },
  rare: { id: "rare", label: "Rare", weight: 18, rollMin: 1.2, rollMax: 1.4, valueMult: 4.5 },
  epic: { id: "epic", label: "Epic", weight: 5.5, rollMin: 1.4, rollMax: 1.65, valueMult: 11 },
  legendary: { id: "legendary", label: "Legendary", weight: 1.1, rollMin: 1.65, rollMax: 2.0, valueMult: 30 },
};

export const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

// Luck nudges the weights toward better rarities.
export function rarityWeights(luck: number): [Rarity, number][] {
  const lf = 1 + luck * 0.03;
  return RARITY_ORDER.map((r) => {
    const base = RARITIES[r].weight;
    // higher rarities benefit more from luck
    const tierBoost = RARITY_ORDER.indexOf(r);
    return [r, base * Math.pow(lf, tierBoost)] as [Rarity, number];
  });
}
