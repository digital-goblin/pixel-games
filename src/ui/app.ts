import "../style.css";
import type { EquipSlot, GameState, ItemStack } from "../game/types";
import { CLASSES, CLASS_BY_ID } from "../data/classes";
import { itemDef } from "../data/items";
import { RARITIES } from "../data/rarities";
import { zoneName } from "../data/enemies";
import { deriveStats } from "../systems/equipment";
import { xpToNext } from "../systems/leveling";
import { SimulatedStepSource } from "../systems/steps";
import {
  ENCOUNTER_COST,
  ENCOUNTER_MS,
  KILLS_PER_ZONE,
  addEnergy,
  heroName,
  offlineProgress,
  runEncounter,
  syncSteps,
  type EncounterOutcome,
} from "../game/engine";
import { hasSave, loadGame, saveGame, wipeSave } from "../game/save";
import { newGame } from "../game/state";
import {
  drawEnemy,
  drawHero,
  drawItemIcon,
  drawScene,
  pixelate,
} from "./sprites";

type Tab = "adventure" | "hero" | "bag";

const now = () => Date.now();

function fmt(n: number): string {
  n = Math.floor(n);
  if (n < 1000) return "" + n;
  if (n < 1e6) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + "k";
  if (n < 1e9) return (n / 1e6).toFixed(2) + "M";
  return (n / 1e9).toFixed(2) + "B";
}

function rarityClass(r: string) {
  return `rarity-${r}`;
}

function sellPrice(stack: ItemStack): number {
  const def = itemDef(stack.defId);
  const rd = RARITIES[stack.rarity];
  return Math.max(1, Math.round(def.value * rd.valueMult * stack.roll * 0.5) * stack.qty);
}

export class App {
  private root: HTMLElement;
  private state: GameState | null = null;
  private source = new SimulatedStepSource({ autoPerSec: 0 });
  private tab: Tab = "adventure";

  private log: { text: string; cls: string }[] = [];
  private currentEnemy: string | null = null;
  private currentEnemyName = "";
  private acc = 0;
  private lastFrame = 0;
  private lastSave = 0;
  private attackFlash = 0;
  private selectedUid: string | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  boot() {
    const existing = hasSave() ? loadGame() : null;
    if (existing) {
      this.state = existing;
      this.start();
    } else {
      this.renderClassSelect();
    }
  }

  // ---------------- New game ----------------
  private renderClassSelect() {
    this.root.innerHTML = `
      <div class="screen" style="padding-bottom:12px">
        <div class="panel">
          <h2>StepQuest</h2>
          <p class="muted">A walking RPG. Your real-world steps become energy that
          sends your hero on endless auto-battling expeditions. Pick a class to begin.</p>
        </div>
        <div class="panel">
          <h2>Choose your class</h2>
          <div class="class-grid" id="classGrid"></div>
          <button class="primary wide" id="startBtn" style="margin-top:12px" disabled>Begin the Quest</button>
        </div>
      </div>`;
    const grid = this.root.querySelector<HTMLElement>("#classGrid")!;
    let chosen: string | null = null;
    for (const c of CLASSES) {
      const card = document.createElement("div");
      card.className = "class-card";
      card.dataset.id = c.id;
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      card.appendChild(canvas);
      const ctx = canvas.getContext("2d")!;
      pixelate(ctx);
      drawHero(ctx, 0, 0, 2, c.color);
      const meta = document.createElement("div");
      meta.innerHTML = `<div class="cname">${c.name}</div><div class="cdesc">${c.desc}<br><span class="tag">${c.passive}</span></div>`;
      card.appendChild(meta);
      card.addEventListener("click", () => {
        chosen = c.id;
        grid.querySelectorAll(".class-card").forEach((n) => n.classList.remove("selected"));
        card.classList.add("selected");
        this.root.querySelector<HTMLButtonElement>("#startBtn")!.disabled = false;
      });
      grid.appendChild(card);
    }
    this.root.querySelector<HTMLButtonElement>("#startBtn")!.addEventListener("click", () => {
      if (!chosen) return;
      this.state = newGame(chosen, now());
      saveGame(this.state, now());
      this.start();
    });
  }

  // ---------------- Start / offline ----------------
  private async start() {
    const s = this.state!;
    // reconcile any simulated steps, then compute offline gains
    await syncSteps(s, this.source, now());
    const summary = offlineProgress(s, now());
    this.renderShell();
    this.switchTab("adventure");
    if (summary.encounters > 0) {
      const parts = [`${summary.wins} wins`];
      if (summary.gold) parts.push(`+${fmt(summary.gold)}g`);
      if (summary.xp) parts.push(`+${fmt(summary.xp)}xp`);
      if (summary.levels) parts.push(`+${summary.levels} lvl`);
      if (summary.drops.length) parts.push(`${summary.drops.length} items`);
      this.toast(`Welcome back! ${parts.join("  ")}`);
    }
    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ---------------- Shell / chrome ----------------
  private renderShell() {
    this.root.innerHTML = `
      <div class="topbar">
        <div class="row">
          <div class="brand">StepQuest</div>
          <div class="currency">
            <span class="gold">◆ <span id="gold">0</span></span>
            <span class="gem">✦ <span id="gems">0</span></span>
          </div>
        </div>
        <div class="statline"><span>ENERGY</span>
          <div class="bar"><div class="fill energy" id="energyFill"></div><div class="label" id="energyLbl"></div></div>
        </div>
      </div>
      <div class="toast-wrap" id="toasts"></div>
      <div class="screen" id="screen"></div>
      <div class="tabbar">
        <button data-tab="adventure"><span class="ico">⚔️</span>Adventure</button>
        <button data-tab="hero"><span class="ico">🛡️</span>Hero</button>
        <button data-tab="bag"><span class="ico">🎒</span>Bag</button>
      </div>`;
    this.root.querySelectorAll<HTMLButtonElement>(".tabbar button").forEach((b) => {
      b.addEventListener("click", () => this.switchTab(b.dataset.tab as Tab));
    });
  }

  private switchTab(tab: Tab) {
    this.tab = tab;
    this.root.querySelectorAll<HTMLButtonElement>(".tabbar button").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    this.renderTab();
    this.refreshHud();
  }

  // ---------------- Frame loop ----------------
  private frame(t: number) {
    const dt = Math.min(0.1, (t - this.lastFrame) / 1000);
    this.lastFrame = t;
    const s = this.state!;

    // simulate ambient walking if enabled
    this.source.autoWalk(dt);

    // encounter cadence
    this.acc += dt * 1000;
    if (this.acc >= ENCOUNTER_MS) {
      this.acc = 0;
      // fold in any simulated steps before fighting
      syncSteps(s, this.source, now());
      const out = runEncounter(s, true);
      if (out) this.onEncounter(out);
      this.refreshHud();
      if (this.tab === "adventure") this.updateSceneHud();
    }

    // save every 5s
    if (t - this.lastSave > 5000) {
      this.lastSave = t;
      saveGame(s, now());
    }

    if (this.tab === "adventure") this.drawSceneFrame(t);
    requestAnimationFrame((n) => this.frame(n));
  }

  private onEncounter(out: EncounterOutcome) {
    this.currentEnemy = out.enemy.color;
    this.currentEnemyName = out.enemy.name;
    this.attackFlash = performance.now();
    for (const line of out.log) this.pushLog(line.text, line.cls);
    if (out.win) {
      const rewards: string[] = [];
      if (out.gold) rewards.push(`+${out.gold}g`);
      if (out.xp) rewards.push(`+${out.xp}xp`);
      this.pushLog(`  → ${rewards.join("  ")}`, "win");
      for (const d of out.drops) {
        const def = itemDef(d.defId);
        this.pushLog(`  ★ ${RARITIES[d.rarity].label} ${def.name}!`, "loot");
      }
      if (out.levels > 0) this.toast(`Level up! Now level ${this.state!.hero.level}`);
      if (out.zoneAdvanced) this.toast(`Zone cleared → ${zoneName(this.state!.zone)}`);
    }
  }

  private pushLog(text: string, cls: string) {
    this.log.push({ text, cls });
    if (this.log.length > 40) this.log.shift();
    if (this.tab === "adventure") {
      const el = this.root.querySelector<HTMLElement>("#combatLog");
      if (el) {
        el.innerHTML = this.log.map((l) => `<div class="${l.cls}">${l.text}</div>`).join("");
        el.scrollTop = el.scrollHeight;
      }
    }
  }

  // ---------------- HUD ----------------
  private refreshHud() {
    const s = this.state;
    if (!s) return;
    const set = (id: string, v: string) => {
      const el = this.root.querySelector(`#${id}`);
      if (el) el.textContent = v;
    };
    set("gold", fmt(s.gold));
    set("gems", fmt(s.gems));
    const ef = this.root.querySelector<HTMLElement>("#energyFill");
    if (ef) ef.style.width = `${(s.energy / s.energyMax) * 100}%`;
    set("energyLbl", `${Math.floor(s.energy)} / ${s.energyMax}`);
  }

  // ---------------- Tabs ----------------
  private renderTab() {
    const screen = this.root.querySelector<HTMLElement>("#screen");
    if (!screen) return;
    if (this.tab === "adventure") this.renderAdventure(screen);
    else if (this.tab === "hero") this.renderHero(screen);
    else this.renderBag(screen);
  }

  private renderAdventure(screen: HTMLElement) {
    const s = this.state!;
    screen.innerHTML = `
      <div class="row-between" style="margin-bottom:8px">
        <div><span class="tag">ZONE ${s.zone}</span> ${zoneName(s.zone)}</div>
        <div class="muted">${s.kills % KILLS_PER_ZONE}/${KILLS_PER_ZONE} to next</div>
      </div>
      <div class="scene-wrap">
        <canvas id="scene" width="200" height="112"></canvas>
        <div class="scene-hud">
          <div class="who hero"><div class="name" id="hHeroName"></div><div id="hHeroLvl" class="muted"></div></div>
          <div class="who enemy"><div class="name" id="hEnemyName">seeking...</div><div id="hZone" class="muted"></div></div>
        </div>
      </div>
      <div class="combat-log" id="combatLog"></div>
      <div class="panel" style="margin-top:12px">
        <h2>Steps → Energy</h2>
        <p class="muted">On iPhone this fills automatically from Apple Health.
        Here in the browser, simulate a walk:</p>
        <div class="btn-row" style="margin-top:8px">
          <button id="walk250">🚶 +250</button>
          <button id="walk1000">🏃 +1,000</button>
          <button id="walk5000">⚡ +5,000</button>
        </div>
        <div class="muted" style="margin-top:8px">Lifetime steps: <span id="lifeSteps">0</span></div>
      </div>`;
    const bind = (id: string, n: number) =>
      screen.querySelector<HTMLButtonElement>(`#${id}`)!.addEventListener("click", () => {
        this.source.addManual(n);
        syncSteps(s, this.source, now()).then(() => {
          this.refreshHud();
          this.updateSceneHud();
          this.toast(`+${fmt(n)} steps → energy`);
        });
      });
    bind("walk250", 250);
    bind("walk1000", 1000);
    bind("walk5000", 5000);
    this.pushLog("Expedition begins...", "hit");
    this.updateSceneHud();
  }

  private updateSceneHud() {
    const s = this.state!;
    const set = (id: string, v: string) => {
      const el = this.root.querySelector(`#${id}`);
      if (el) el.textContent = v;
    };
    set("hHeroName", heroName(s));
    set("hHeroLvl", `Lv ${s.hero.level}`);
    set("hEnemyName", s.energy >= ENCOUNTER_COST ? this.currentEnemyName || "seeking..." : "resting — need steps");
    set("hZone", zoneName(s.zone));
    set("lifeSteps", fmt(s.lifetimeSteps));
  }

  private drawSceneFrame(t: number) {
    const canvas = this.root.querySelector<HTMLCanvasElement>("#scene");
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    pixelate(ctx);
    const s = this.state!;
    drawScene(ctx, canvas.width, canvas.height, s.zone);
    const bob = Math.sin(t / 300) * 1.5;
    const flash = performance.now() - this.attackFlash;
    const lunge = flash < 250 ? (1 - flash / 250) * 8 : 0;
    const groundY = canvas.height - 18 - 48;
    // hero
    const cls = CLASS_BY_ID[s.hero.classId];
    drawHero(ctx, 26 + lunge, groundY + bob, 3, cls.color);
    // enemy (only when actively fighting)
    if (s.energy >= ENCOUNTER_COST && this.currentEnemy) {
      const ebob = Math.sin(t / 260 + 1) * 1.5;
      drawEnemy(ctx, 116 - lunge, groundY + ebob, 3, this.currentEnemy);
    } else if (s.energy < ENCOUNTER_COST) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "8px monospace";
      ctx.fillText("Walk to refuel!", 96, groundY + 24);
    }
  }

  // ---------------- Hero tab ----------------
  private renderHero(screen: HTMLElement) {
    const s = this.state!;
    const cls = CLASS_BY_ID[s.hero.classId];
    const d = deriveStats(s);
    const xpNext = xpToNext(s.hero.level);
    const slots: EquipSlot[] = ["weapon", "head", "chest", "legs", "accessory"];
    screen.innerHTML = `
      <div class="panel">
        <div class="row-between">
          <div>
            <div style="font-size:16px;color:var(--accent)">${cls.name}</div>
            <div class="muted">Level ${s.hero.level} · ${zoneName(s.zone)} · ${fmt(s.kills)} kills</div>
          </div>
          <canvas id="heroBig" width="64" height="64"></canvas>
        </div>
        <div class="statline" style="margin-top:10px"><span>XP</span>
          <div class="bar"><div class="fill xp" style="width:${(s.hero.xp / xpNext) * 100}%"></div>
          <div class="label">${fmt(s.hero.xp)} / ${fmt(xpNext)}</div></div>
        </div>
        <div class="muted" style="margin-top:8px">${cls.passive}</div>
      </div>
      <div class="panel">
        <h2>Combat stats</h2>
        <div class="statgrid">
          ${statRow("❤ Max HP", fmt(d.maxHp))}
          ${statRow("⚔ Attack", fmt(d.atk))}
          ${statRow("🛡 Defense", fmt(d.def))}
          ${statRow("✦ Crit", `${Math.round(d.critChance * 100)}% ×${d.critMult.toFixed(2)}`)}
        </div>
        <h2 style="margin-top:12px">Attributes</h2>
        <div class="statgrid">
          ${statRow("STR", "" + d.stats.str)}
          ${statRow("DEX", "" + d.stats.dex)}
          ${statRow("INT", "" + d.stats.int)}
          ${statRow("VIT", "" + d.stats.vit)}
          ${statRow("LUCK", "" + d.stats.luck)}
        </div>
      </div>
      <div class="panel">
        <h2>Equipment</h2>
        <div class="equip-slots" id="equipSlots"></div>
        <div class="muted">Tap an equipped item to unequip it.</div>
      </div>
      <div class="panel">
        <h2>Danger zone</h2>
        <button id="wipeBtn" class="wide">Reset save (new game)</button>
      </div>`;
    // hero sprite
    const hc = screen.querySelector<HTMLCanvasElement>("#heroBig")!;
    const hctx = hc.getContext("2d")!;
    pixelate(hctx);
    drawHero(hctx, 0, 0, 4, cls.color);
    // equip slots
    const holder = screen.querySelector<HTMLElement>("#equipSlots")!;
    for (const slot of slots) {
      const stack = s.hero.equipment[slot];
      const el = this.itemSlotEl(stack, slot);
      if (stack) el.addEventListener("click", () => this.unequip(slot));
      holder.appendChild(el);
    }
    screen.querySelector<HTMLButtonElement>("#wipeBtn")!.addEventListener("click", () => {
      if (confirm("Reset all progress and start a new game?")) {
        wipeSave();
        location.reload();
      }
    });
  }

  // ---------------- Bag tab ----------------
  private renderBag(screen: HTMLElement) {
    const s = this.state!;
    screen.innerHTML = `
      <div class="panel">
        <div class="row-between">
          <h2 style="margin:0">Bag (${s.bag.length})</h2>
          <div class="gold" style="color:var(--accent)">◆ ${fmt(s.gold)}</div>
        </div>
        <div class="grid" id="bagGrid" style="margin-top:10px"></div>
        <div id="itemDetail"></div>
      </div>`;
    const grid = screen.querySelector<HTMLElement>("#bagGrid")!;
    if (s.bag.length === 0) {
      grid.innerHTML = `<div class="muted">Empty. Send your hero adventuring to find loot!</div>`;
      return;
    }
    // sort: equippable by rarity desc, then materials
    const order = ["legendary", "epic", "rare", "uncommon", "common"];
    const sorted = [...s.bag].sort(
      (a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity),
    );
    for (const stack of sorted) {
      const el = this.itemSlotEl(stack, undefined);
      el.classList.toggle("selected", stack.uid === this.selectedUid);
      el.addEventListener("click", () => {
        this.selectedUid = stack.uid;
        this.renderBag(screen);
      });
      grid.appendChild(el);
    }
    if (this.selectedUid) {
      const stack = s.bag.find((x) => x.uid === this.selectedUid);
      if (stack) this.renderItemDetail(screen.querySelector<HTMLElement>("#itemDetail")!, stack);
    }
  }

  private renderItemDetail(host: HTMLElement, stack: ItemStack) {
    const def = itemDef(stack.defId);
    const equippable = !!def.slot;
    const consumable = def.kind === "consumable";
    const lines: string[] = [];
    if (def.atk) lines.push(`<div class="stat">⚔ +${Math.round(def.atk * stack.roll)} attack</div>`);
    if (def.def) lines.push(`<div class="stat">🛡 +${Math.round(def.def * stack.roll)} defense</div>`);
    if (def.stats)
      for (const [k, v] of Object.entries(def.stats))
        lines.push(`<div class="stat">+${v} ${k.toUpperCase()}</div>`);
    if (consumable) lines.push(`<div class="stat">⚡ Energy surge</div>`);
    host.innerHTML = `
      <div class="item-card">
        <div class="iname ${rarityClass(stack.rarity)}">${def.name}${stack.qty > 1 ? " ×" + stack.qty : ""}</div>
        <div class="itype">${RARITIES[stack.rarity].label} · ${def.kind}${def.scaling ? " · " + def.scaling.toUpperCase() : ""}</div>
        ${lines.join("")}
        ${def.desc ? `<div class="muted" style="margin-top:6px">${def.desc}</div>` : ""}
        <div class="btn-row" style="margin-top:10px">
          ${equippable ? `<button class="primary" id="equipBtn">Equip</button>` : ""}
          ${consumable ? `<button class="primary" id="useBtn">Use</button>` : ""}
          <button id="sellBtn">Sell ◆${fmt(sellPrice(stack))}</button>
        </div>
      </div>`;
    const eq = host.querySelector<HTMLButtonElement>("#equipBtn");
    if (eq) eq.addEventListener("click", () => this.equip(stack));
    const use = host.querySelector<HTMLButtonElement>("#useBtn");
    if (use) use.addEventListener("click", () => this.useConsumable(stack));
    host.querySelector<HTMLButtonElement>("#sellBtn")!.addEventListener("click", () => this.sell(stack));
  }

  // ---------------- Item slot element ----------------
  private itemSlotEl(stack: ItemStack | undefined, slot: EquipSlot | undefined): HTMLElement {
    const el = document.createElement("div");
    el.className = "slot";
    if (slot) el.dataset.slot = slot;
    if (!stack) {
      el.classList.add("empty");
      return el;
    }
    el.dataset.rarity = stack.rarity;
    const def = itemDef(stack.defId);
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    pixelate(ctx);
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue(`--r-${stack.rarity}`)
      .trim() || "#ffcc4d";
    drawItemIcon(ctx, 32, def.icon, accent);
    if (stack.qty > 1) {
      const q = document.createElement("div");
      q.className = "qty";
      q.textContent = "" + stack.qty;
      el.appendChild(q);
    }
    return el;
  }

  // ---------------- Item actions ----------------
  private equip(stack: ItemStack) {
    const s = this.state!;
    const def = itemDef(stack.defId);
    if (!def.slot) return;
    // remove from bag
    s.bag = s.bag.filter((x) => x.uid !== stack.uid);
    // send currently-equipped back to bag
    const cur = s.hero.equipment[def.slot];
    if (cur) s.bag.push(cur);
    s.hero.equipment[def.slot] = stack;
    this.selectedUid = null;
    saveGame(s, now());
    this.toast(`Equipped ${def.name}`);
    this.renderTab();
    this.refreshHud();
  }

  private unequip(slot: EquipSlot) {
    const s = this.state!;
    const cur = s.hero.equipment[slot];
    if (!cur) return;
    s.bag.push(cur);
    delete s.hero.equipment[slot];
    saveGame(s, now());
    this.renderTab();
  }

  private useConsumable(stack: ItemStack) {
    const s = this.state!;
    const def = itemDef(stack.defId);
    const surge = Math.round((def.healPct ?? 0.4) * s.energyMax);
    addEnergy(s, surge);
    this.decrement(stack);
    this.toast(`Used ${def.name} · +${fmt(surge)} energy`);
    saveGame(s, now());
    this.renderTab();
    this.refreshHud();
  }

  private sell(stack: ItemStack) {
    const s = this.state!;
    s.gold += sellPrice(stack);
    // selling removes the whole stack
    s.bag = s.bag.filter((x) => x.uid !== stack.uid);
    if (this.selectedUid === stack.uid) this.selectedUid = null;
    saveGame(s, now());
    this.renderTab();
    this.refreshHud();
  }

  private decrement(stack: ItemStack) {
    const s = this.state!;
    stack.qty -= 1;
    if (stack.qty <= 0) {
      s.bag = s.bag.filter((x) => x.uid !== stack.uid);
      if (this.selectedUid === stack.uid) this.selectedUid = null;
    }
  }

  // ---------------- Toast ----------------
  private toast(msg: string) {
    const host = this.root.querySelector<HTMLElement>("#toasts");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}

function statRow(label: string, value: string): string {
  return `<div class="row-between" style="font-size:11px;padding:3px 0">
    <span class="muted">${label}</span><span>${value}</span></div>`;
}
