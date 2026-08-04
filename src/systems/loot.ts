import type { EnemyDef, ItemStack, Rarity } from "../game/types";
import { chance, rng, randInt, weighted } from "../game/rng";
import { RARITIES, rarityWeights } from "../data/rarities";
import { itemDef } from "../data/items";

let uidCounter = 1;
function makeUid(defId: string): string {
  return `${defId}#${(uidCounter++).toString(36)}${randInt(100, 999)}`;
}

// Build a concrete stack, rolling a rarity multiplier within its band.
export function makeStack(
  defId: string,
  rarity: Rarity,
  qty = 1,
): ItemStack {
  const rd = RARITIES[rarity];
  const def = itemDef(defId);
  // Equippables get a rolled multiplier; stackables (mats/consumables) don't.
  const equippable = def.kind !== "consumable" && def.kind !== "material";
  const roll = equippable ? rd.rollMin + rng() * (rd.rollMax - rd.rollMin) : 1;
  return {
    uid: makeUid(defId),
    defId,
    rarity,
    qty,
    roll: Math.round(roll * 100) / 100,
  };
}

// Roll the enemy's drop table. Returns 0..N stacks (usually 0-1).
export function rollDrops(enemy: EnemyDef, luck: number): ItemStack[] {
  const out: ItemStack[] = [];
  for (const [defId, p] of enemy.drops) {
    const def = itemDef(defId);
    if (chance(p)) {
      // materials/consumables always common; gear rolls rarity by luck
      const rarity =
        def.kind === "material" || def.kind === "consumable"
          ? "common"
          : weighted(rarityWeights(luck));
      out.push(makeStack(defId, rarity, 1));
    }
  }
  return out;
}

// Merge a stack into a bag, combining materials/consumables by def+rarity.
export function addToBag(bag: ItemStack[], stack: ItemStack): void {
  const def = itemDef(stack.defId);
  const stackable = def.kind === "material" || def.kind === "consumable";
  if (stackable) {
    const existing = bag.find(
      (s) => s.defId === stack.defId && s.rarity === stack.rarity,
    );
    if (existing) {
      existing.qty += stack.qty;
      return;
    }
  }
  bag.push(stack);
}
