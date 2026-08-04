import type { GameState } from "./types";
import { SAVE_VERSION } from "./state";

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
    if (parsed.version !== SAVE_VERSION) {
      // No migrations yet — future versions handle upgrades here.
      return migrate(parsed);
    }
    return parsed;
  } catch (e) {
    console.warn("loadGame failed", e);
    return null;
  }
}

function migrate(old: GameState): GameState | null {
  // Placeholder for forward migrations. For now, refuse mismatched saves.
  if (old.version > SAVE_VERSION) return null;
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
