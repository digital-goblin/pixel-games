import type { GameState } from "./types";
import { SAVE_VERSION } from "./state";
import { newEgg } from "../systems/pets";

const SAVE_KEY = "stepquest.save.v1";

export function saveGame(state: GameState, now: number): void {
  state.lastSeen = now;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("saveGame failed", e);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== "object") return null;
    return migrate(parsed);
  } catch (e) {
    console.warn("loadGame failed", e);
    return null;
  }
}

// Forward migrations are additive: fill in fields introduced by newer versions
// so existing saves keep working instead of being wiped.
function migrate(old: GameState): GameState | null {
  if (old.version > SAVE_VERSION) return null; // save from the future — refuse
  // v2: companions
  if (!Array.isArray(old.pets)) old.pets = [];
  if (old.activePetUid === undefined) old.activePetUid = null;
  if (old.egg === undefined) old.egg = newEgg();
  old.version = SAVE_VERSION;
  return old;
}

export function wipeSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) != null;
  } catch {
    return false;
  }
}
