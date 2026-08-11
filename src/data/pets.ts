import type { PetSpecies } from "../game/types";

// Companions reuse enemy sprites (see sprites.ts) so they need no new art.
// `base` is the bonus at Common rarity; higher rarities multiply it.
export const PET_SPECIES: PetSpecies[] = [
  {
    id: "slimeling",
    name: "Slimeling",
    sprite: "slime",
    desc: "Squishy and greedy — finds extra coin.",
    base: { goldPct: 0.15 },
    eggWeight: 30,
  },
  {
    id: "batling",
    name: "Batling",
    sprite: "bat",
    desc: "Keen senses sniff out better loot.",
    base: { luckAdd: 4 },
    eggWeight: 26,
  },
  {
    id: "wolfpup",
    name: "Wolf Pup",
    sprite: "wolf",
    desc: "Fierce little hunter — sharper strikes.",
    base: { critAdd: 0.05 },
    eggWeight: 22,
  },
  {
    id: "bonepal",
    name: "Bone Pal",
    sprite: "skeleton",
    desc: "A loyal rattling guardian.",
    base: { defPct: 0.12 },
    eggWeight: 16,
  },
  {
    id: "emberwhelp",
    name: "Ember Whelp",
    sprite: "dragon",
    desc: "A baby dragon that hits hard.",
    base: { atkPct: 0.14 },
    eggWeight: 6,
  },
];

export const PET_BY_ID: Record<string, PetSpecies> = Object.fromEntries(
  PET_SPECIES.map((p) => [p.id, p]),
);

export function petSpecies(id: string): PetSpecies {
  const s = PET_BY_ID[id];
  if (!s) throw new Error(`Unknown pet species: ${id}`);
  return s;
}
