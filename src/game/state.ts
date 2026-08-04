import type { GameState, ScalingStat } from "./types";
import { CLASS_BY_ID } from "../data/classes";
import { makeStack } from "../systems/loot";
import { energyMaxFor } from "./engine";

export const SAVE_VERSION = 1;

const STARTER_WEAPON: Record<ScalingStat, string> = {
  str: "w_rusty_sword",
  dex: "w_short_bow",
  int: "w_apprentice_staff",
};

export function newGame(classId: string, now: number): GameState {
  const cls = CLASS_BY_ID[classId];
  if (!cls) throw new Error(`Unknown class: ${classId}`);

  const state: GameState = {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    lifetimeSteps: 0,
    stepsToday: 0,
    energy: 60, // a little starting energy so there's something to watch
    energyMax: 0,
    gold: 0,
    gems: 0,
    hero: {
      classId,
      level: 1,
      xp: 0,
      hp: 0,
      equipment: {
        weapon: makeStack(STARTER_WEAPON[cls.affinity], "common"),
        chest: makeStack("a_cloth_tunic", "common"),
      },
    },
    bag: [makeStack("c_minor_potion", "common", 2)],
    zone: 1,
    kills: 0,
    bestZone: 1,
    lastStepSample: now,
    settings: { sfx: true },
  };
  state.energyMax = energyMaxFor(state);
  return state;
}
