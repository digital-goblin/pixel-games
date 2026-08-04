import type { Hero } from "../game/types";

// Smooth escalating curve. Level 1->2 costs ~40, scales ~1.55 exponent.
export function xpToNext(level: number): number {
  return Math.floor(40 * Math.pow(level, 1.55));
}

export function totalXpForLevel(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpToNext(l);
  return sum;
}

export interface XpResult {
  levelsGained: number;
}

// Mutates hero: adds xp and applies any level-ups. Returns how many levels.
export function grantXp(hero: Hero, amount: number): XpResult {
  hero.xp += amount;
  let gained = 0;
  while (hero.xp >= xpToNext(hero.level)) {
    hero.xp -= xpToNext(hero.level);
    hero.level += 1;
    gained += 1;
  }
  return { levelsGained: gained };
}
