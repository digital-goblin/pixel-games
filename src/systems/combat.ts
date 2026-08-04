import type { DerivedStats, EnemyDef } from "../game/types";
import { chance, rng } from "../game/rng";

export interface BattleLine {
  text: string;
  cls: "hit" | "crit" | "win" | "lose" | "loot";
}

export interface BattleResult {
  win: boolean;
  rounds: number;
  heroHpLeft: number;
  damageDealt: number;
  log: BattleLine[];
}

function dmg(atk: number, def: number): number {
  // Defense has diminishing returns so it never fully negates damage.
  const raw = atk * (atk / (atk + def));
  const variance = 0.85 + rng() * 0.3;
  return Math.max(1, Math.round(raw * variance));
}

// Deterministic-ish quick simulation of one encounter. Produces a short log
// suitable for the on-screen combat feed.
export function simulateBattle(
  hero: DerivedStats,
  enemy: EnemyDef,
  heroName: string,
): BattleResult {
  let heroHp = hero.maxHp;
  let enemyHp = enemy.hp;
  const log: BattleLine[] = [];
  let rounds = 0;
  let damageDealt = 0;
  const maxRounds = 60;

  while (heroHp > 0 && enemyHp > 0 && rounds < maxRounds) {
    rounds++;
    // hero strikes
    let hd = dmg(hero.atk, enemy.def);
    const crit = chance(hero.critChance);
    if (crit) hd = Math.round(hd * hero.critMult);
    enemyHp -= hd;
    damageDealt += hd;
    log.push({
      text: crit
        ? `${heroName} CRITS ${enemy.name} for ${hd}!`
        : `${heroName} hits ${enemy.name} for ${hd}.`,
      cls: crit ? "crit" : "hit",
    });
    if (enemyHp <= 0) break;

    // enemy strikes back
    const ed = dmg(enemy.atk, hero.def);
    heroHp -= ed;
    log.push({ text: `${enemy.name} hits back for ${ed}.`, cls: "hit" });
  }

  const win = enemyHp <= 0;
  log.push(
    win
      ? { text: `${enemy.name} defeated!`, cls: "win" }
      : { text: `${heroName} retreats...`, cls: "lose" },
  );

  // keep the log short for display
  const trimmed = log.length > 6 ? log.slice(-6) : log;
  return { win, rounds, heroHpLeft: Math.max(0, heroHp), damageDealt, log: trimmed };
}

// Fast win-probability estimate for OFFLINE progression (no per-hit log).
export function estimateWin(hero: DerivedStats, enemy: EnemyDef): boolean {
  const heroDps = hero.atk * (hero.atk / (hero.atk + enemy.def)) * (1 + hero.critChance * (hero.critMult - 1));
  const enemyDps = enemy.atk * (enemy.atk / (enemy.atk + hero.def));
  const heroTurnsToKill = enemy.hp / Math.max(1, heroDps);
  const enemyTurnsToKill = hero.maxHp / Math.max(1, enemyDps);
  return heroTurnsToKill <= enemyTurnsToKill;
}
