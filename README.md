# StepQuest — a walking RPG + idle game

Your real-world steps become **energy**. Energy sends your hero on endless
**auto-battling expeditions** — killing monsters, leveling up, and collecting
weapons, armor, and loot while you're away.

This repo is the **game engine + UI as a web app**, deliberately structured so
it can be wrapped into a **native iOS app with Capacitor** that reads real steps
from **Apple Health**. ~90% of the game is platform-agnostic; only the step
_source_ changes between web (simulated) and iOS (HealthKit).

> Status: **playable vertical slice.** Classes, weapons/armor/accessories,
> loot rarity, equipment, an idle auto-battle loop, zones, offline progression,
> and saving all work today. See the roadmap for what's next.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Pick a class, then use the **Walk +250 / +1,000 / +5,000** buttons on the
Adventure tab to simulate steps (these stand in for Apple Health while in the
browser). Energy banks up, and your hero auto-fights every ~2.5s. Close the tab
and come back to see **offline progression** ("while you were away").

Other scripts:

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

---

## How it's put together

```
src/
  data/            # pure content tables — safe to expand endlessly
    classes.ts     #   4 classes (Knight/Ranger/Mage/Rogue), stats + passives
    items.ts       #   weapons (str/dex/int), armor, accessories, consumables
    enemies.ts     #   enemies + zone scaling + zone names
    rarities.ts    #   common→legendary weights, roll bands, luck scaling
  game/
    types.ts       # all core types (GameState, ItemDef, Hero, …)
    rng.ts         # seedable PRNG + weighted/pick helpers
    state.ts       # newGame() starting loadout
    save.ts        # localStorage save/load (+ migration hook)
    engine.ts      # THE loop: steps→energy, runEncounter(), offlineProgress()
  systems/
    steps.ts       # StepSource abstraction  ← swap point for HealthKit
    leveling.ts    # xp curve + level-ups
    equipment.ts   # deriveStats(): class+level+gear → combat numbers
    combat.ts      # simulateBattle() (live log) + estimateWin() (offline)
    loot.ts        # drop rolls, rarity, bag merging
  ui/
    sprites.ts     # ALL art is code-drawn here ← swap point for real sprites
    app.ts         # screens, tabs, the render/animation loop, interactions
  main.ts          # entry point
```

Two seams are designed to be replaced:

1. **`systems/steps.ts` — where steps come from.** Everything reads the
   `StepSource` interface (`todaySteps(): Promise<number>`). Today we use
   `SimulatedStepSource`. On iOS you implement `HealthKitStepSource` and nothing
   else changes.
2. **`ui/sprites.ts` — the art.** Every creature/item is drawn with code so the
   game looks like a pixel RPG with zero assets. Replace each `draw*` with a
   `drawImage()` once you have real spritesheets (owned or AI-generated).

---

## Shipping to iOS (on your Mac)

The web build is Capacitor-ready (`capacitor.config.ts` already points at
`dist/`).

```bash
# on your Mac, with Xcode installed
npm i @capacitor/core @capacitor/cli @capacitor/ios
npm run build
npx cap add ios
npx cap sync
npx cap open ios      # opens Xcode → run on device
```

### Wire up real steps (HealthKit)

1. Add a HealthKit-capable Capacitor plugin (e.g. a community HealthKit plugin,
   or a small custom bridge querying `HKQuantityTypeIdentifierStepCount`).
2. In Xcode: add the **HealthKit** capability and the
   `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` keys to
   `Info.plist`.
3. Implement `HealthKitStepSource` in `src/systems/steps.ts` so `todaySteps()`
   returns the summed step count for the current day, and select it in
   `ui/app.ts` when running natively.

Because the engine only ever asks "how many steps today?", real steps flow
through the exact same energy → expedition → loot pipeline you already see in
the browser.

---

## Design notes

- **Idle economy.** 1 step = 1 energy (capped by `energyMax`). Each encounter
  costs `ENCOUNTER_COST` energy and resolves on a timer while active; offline,
  banked energy is spent over elapsed real time via `offlineProgress()`.
- **Combat.** Defense uses diminishing returns (`atk/(atk+def)`) so it never
  hard-caps damage. Live fights produce a per-hit log; offline fights use a fast
  win estimate to stay cheap over thousands of encounters.
- **Loot.** Rarity is weighted and nudged by LUCK (Rogues get a bonus). Rolled
  rarity multiplies an item's base atk/def within a band.
- **Save.** Autosaves every 5s and on most actions to `localStorage`
  (`stepquest.save.v1`).

---

## Roadmap (the "more to do")

Content scales cheaply because it's data-driven; systems are the bigger lifts.

- [ ] **Real HealthKit source** (native) + background step sync
- [ ] **Skill trees / abilities** per class; active skills in combat
- [ ] **Crafting & upgrades** (materials already drop — spend them)
- [ ] **Bosses** at zone milestones with guaranteed loot
- [ ] **Pets/companions** (the SideQuest hook — hatch by walking)
- [ ] **Prestige / ascension** loop for long-term idle depth
- [ ] **Daily step goals & streaks**, quests, achievements
- [ ] **Guilds / leaderboards** (needs a backend)
- [ ] Real pixel spritesheets replacing the code-drawn placeholders
- [ ] Sound & music, haptics on iOS

## License

MIT
