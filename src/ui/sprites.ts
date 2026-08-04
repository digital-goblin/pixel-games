// Code-drawn placeholder pixel art. Everything here is deliberately swappable:
// once you have real spritesheets, replace these draw* functions with
// drawImage() calls and the rest of the game is unaffected.
//
// We draw on a small integer grid (1 unit == `px` device pixels) with image
// smoothing disabled, which gives crisp pixel-art edges at any scale.

export function pixelate(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = false;
}

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, ox: number, oy: number, px: number, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x * px, oy + y * px, w * px, h * px);
}

// ---------------- Hero ----------------

const CLASS_ARMOR: Record<string, { armor: string; dark: string; accent: string }> = {
  steel: { armor: "#8a90a8", dark: "#565c74", accent: "#c9d0e8" },
  forest: { armor: "#4a8a4a", dark: "#2f5f2f", accent: "#8fe08f" },
  violet: { armor: "#8a5ac0", dark: "#593a83", accent: "#c9a2ff" },
  crimson: { armor: "#c0453a", dark: "#7d2820", accent: "#ff8a7a" },
};

// classId maps to a color key via CLASSES color; caller passes the color key.
export function drawHero(ctx: Ctx, ox: number, oy: number, px: number, colorKey: string) {
  const c = CLASS_ARMOR[colorKey] ?? CLASS_ARMOR.steel;
  const skin = "#eab98a";
  const skinD = "#c9925f";
  const hair = "#3a2a1a";
  const boot = "#3a2f4a";
  // 16x16 grid, hero facing right
  // head
  rect(ctx, ox, oy, px, 6, 1, 5, 4, hair);
  rect(ctx, ox, oy, px, 6, 2, 5, 3, skin);
  rect(ctx, ox, oy, px, 6, 1, 5, 1, hair);
  rect(ctx, ox, oy, px, 10, 3, 1, 1, "#0a0818"); // eye
  rect(ctx, ox, oy, px, 8, 4, 3, 1, skinD);
  // torso (armor)
  rect(ctx, ox, oy, px, 5, 5, 7, 5, c.armor);
  rect(ctx, ox, oy, px, 5, 5, 7, 1, c.accent);
  rect(ctx, ox, oy, px, 5, 9, 7, 1, c.dark);
  // belt
  rect(ctx, ox, oy, px, 5, 10, 7, 1, boot);
  // arms
  rect(ctx, ox, oy, px, 4, 6, 1, 3, c.dark);
  rect(ctx, ox, oy, px, 12, 6, 1, 3, c.dark);
  rect(ctx, ox, oy, px, 12, 8, 2, 1, skin); // sword hand
  // legs
  rect(ctx, ox, oy, px, 6, 11, 2, 3, c.dark);
  rect(ctx, ox, oy, px, 9, 11, 2, 3, c.dark);
  rect(ctx, ox, oy, px, 6, 14, 2, 1, boot);
  rect(ctx, ox, oy, px, 9, 14, 2, 1, boot);
  // weapon hint (blade)
  rect(ctx, ox, oy, px, 14, 3, 1, 6, "#d8d8e8");
  rect(ctx, ox, oy, px, 13, 8, 3, 1, "#8a6a2a");
}

// ---------------- Enemies ----------------

export function drawEnemy(ctx: Ctx, ox: number, oy: number, px: number, key: string) {
  switch (key) {
    case "slime":
      return drawSlime(ctx, ox, oy, px);
    case "bat":
      return drawBat(ctx, ox, oy, px);
    case "goblin":
      return drawGoblin(ctx, ox, oy, px);
    case "wolf":
      return drawWolf(ctx, ox, oy, px);
    case "skeleton":
      return drawSkeleton(ctx, ox, oy, px);
    case "cultist":
      return drawCultist(ctx, ox, oy, px);
    case "ogre":
      return drawOgre(ctx, ox, oy, px);
    case "dragon":
      return drawDragon(ctx, ox, oy, px);
    default:
      return drawSlime(ctx, ox, oy, px);
  }
}

function drawSlime(ctx: Ctx, ox: number, oy: number, px: number) {
  const b = "#6fe07a", d = "#3ba14a";
  rect(ctx, ox, oy, px, 4, 9, 8, 5, b);
  rect(ctx, ox, oy, px, 3, 11, 10, 3, b);
  rect(ctx, ox, oy, px, 5, 7, 6, 2, b);
  rect(ctx, ox, oy, px, 3, 13, 10, 1, d);
  rect(ctx, ox, oy, px, 6, 9, 1, 2, "#0a0818"); // eyes
  rect(ctx, ox, oy, px, 9, 9, 1, 2, "#0a0818");
  rect(ctx, ox, oy, px, 5, 8, 6, 1, "#b6ffce"); // shine
}

function drawBat(ctx: Ctx, ox: number, oy: number, px: number) {
  const b = "#7a5aa8", d = "#4a316f";
  rect(ctx, ox, oy, px, 7, 7, 2, 4, b); // body
  rect(ctx, ox, oy, px, 2, 6, 5, 2, d); // left wing
  rect(ctx, ox, oy, px, 1, 5, 3, 2, d);
  rect(ctx, ox, oy, px, 9, 6, 5, 2, d); // right wing
  rect(ctx, ox, oy, px, 12, 5, 3, 2, d);
  rect(ctx, ox, oy, px, 6, 5, 1, 1, b); // ears
  rect(ctx, ox, oy, px, 9, 5, 1, 1, b);
  rect(ctx, ox, oy, px, 7, 7, 1, 1, "#ffcc4d"); // eyes
  rect(ctx, ox, oy, px, 8, 7, 1, 1, "#ffcc4d");
}

function drawGoblin(ctx: Ctx, ox: number, oy: number, px: number) {
  const s = "#7bbf5a", d = "#4d7d38", cloth = "#8a5a2b";
  rect(ctx, ox, oy, px, 6, 3, 4, 3, s); // head
  rect(ctx, ox, oy, px, 4, 3, 2, 1, s); // ears
  rect(ctx, ox, oy, px, 10, 3, 2, 1, s);
  rect(ctx, ox, oy, px, 7, 4, 1, 1, "#ff5d6c"); // eyes
  rect(ctx, ox, oy, px, 9, 4, 1, 1, "#ff5d6c");
  rect(ctx, ox, oy, px, 5, 6, 6, 5, cloth); // body
  rect(ctx, ox, oy, px, 4, 7, 1, 3, s); // arms
  rect(ctx, ox, oy, px, 11, 7, 1, 3, s);
  rect(ctx, ox, oy, px, 6, 11, 2, 3, d); // legs
  rect(ctx, ox, oy, px, 9, 11, 2, 3, d);
  rect(ctx, ox, oy, px, 11, 5, 1, 5, "#c9c9d8"); // spear
}

function drawWolf(ctx: Ctx, ox: number, oy: number, px: number) {
  const b = "#8a8f9c", d = "#5a5f6c";
  rect(ctx, ox, oy, px, 3, 8, 8, 4, b); // body
  rect(ctx, ox, oy, px, 10, 6, 4, 3, b); // head
  rect(ctx, ox, oy, px, 10, 5, 1, 1, d); // ear
  rect(ctx, ox, oy, px, 12, 5, 1, 1, d);
  rect(ctx, ox, oy, px, 13, 7, 1, 1, "#ff5d6c"); // eye
  rect(ctx, ox, oy, px, 2, 9, 2, 1, d); // tail
  rect(ctx, ox, oy, px, 4, 12, 1, 2, d); // legs
  rect(ctx, ox, oy, px, 6, 12, 1, 2, d);
  rect(ctx, ox, oy, px, 8, 12, 1, 2, d);
  rect(ctx, ox, oy, px, 10, 12, 1, 2, d);
  rect(ctx, ox, oy, px, 13, 8, 1, 1, "#e8e6ff"); // fang
}

function drawSkeleton(ctx: Ctx, ox: number, oy: number, px: number) {
  const bone = "#e8e6d8", d = "#9a9788";
  rect(ctx, ox, oy, px, 6, 2, 4, 3, bone); // skull
  rect(ctx, ox, oy, px, 7, 3, 1, 1, "#6de0ff"); // eyes
  rect(ctx, ox, oy, px, 9, 3, 1, 1, "#6de0ff");
  rect(ctx, ox, oy, px, 7, 5, 2, 1, d); // jaw
  rect(ctx, ox, oy, px, 6, 6, 4, 1, bone); // ribs top
  rect(ctx, ox, oy, px, 7, 7, 2, 4, bone); // spine
  rect(ctx, ox, oy, px, 5, 7, 6, 1, d); // ribs
  rect(ctx, ox, oy, px, 5, 9, 6, 1, d);
  rect(ctx, ox, oy, px, 4, 6, 1, 4, bone); // arm
  rect(ctx, ox, oy, px, 11, 6, 1, 4, bone);
  rect(ctx, ox, oy, px, 6, 11, 1, 3, bone); // legs
  rect(ctx, ox, oy, px, 9, 11, 1, 3, bone);
  rect(ctx, ox, oy, px, 11, 4, 1, 7, "#c9c9d8"); // sword
}

function drawCultist(ctx: Ctx, ox: number, oy: number, px: number) {
  const robe = "#5a3a8a", d = "#3a2560", skin = "#c9a27a";
  rect(ctx, ox, oy, px, 5, 2, 6, 3, d); // hood
  rect(ctx, ox, oy, px, 6, 3, 4, 2, skin); // face
  rect(ctx, ox, oy, px, 7, 3, 1, 1, "#ff5d6c"); // eyes
  rect(ctx, ox, oy, px, 9, 3, 1, 1, "#ff5d6c");
  rect(ctx, ox, oy, px, 4, 5, 8, 9, robe); // robe
  rect(ctx, ox, oy, px, 4, 5, 8, 1, "#7a5aa8");
  rect(ctx, ox, oy, px, 7, 6, 2, 6, d); // seam
  rect(ctx, ox, oy, px, 3, 6, 1, 5, robe); // arms
  rect(ctx, ox, oy, px, 12, 6, 1, 5, robe);
  rect(ctx, ox, oy, px, 12, 4, 1, 8, "#8a6a2a"); // staff
  rect(ctx, ox, oy, px, 12, 3, 1, 1, "#ffcc4d"); // staff gem
}

function drawOgre(ctx: Ctx, ox: number, oy: number, px: number) {
  const s = "#b98a5a", d = "#7d5a34", cloth = "#4d3d2b";
  rect(ctx, ox, oy, px, 5, 2, 6, 4, s); // head
  rect(ctx, ox, oy, px, 6, 4, 1, 1, "#ffcc4d"); // eyes
  rect(ctx, ox, oy, px, 9, 4, 1, 1, "#ffcc4d");
  rect(ctx, ox, oy, px, 6, 5, 4, 1, d); // mouth
  rect(ctx, ox, oy, px, 6, 5, 1, 1, "#fff"); // tusks
  rect(ctx, ox, oy, px, 9, 5, 1, 1, "#fff");
  rect(ctx, ox, oy, px, 3, 6, 10, 6, s); // huge body
  rect(ctx, ox, oy, px, 4, 8, 8, 2, cloth); // strap
  rect(ctx, ox, oy, px, 2, 6, 1, 5, d); // arms
  rect(ctx, ox, oy, px, 13, 6, 1, 5, d);
  rect(ctx, ox, oy, px, 4, 12, 3, 2, d); // legs
  rect(ctx, ox, oy, px, 9, 12, 3, 2, d);
  rect(ctx, ox, oy, px, 0, 8, 2, 2, "#6b4a24"); // club
}

function drawDragon(ctx: Ctx, ox: number, oy: number, px: number) {
  const b = "#c0553a", d = "#7d3320", wing = "#e08a5a";
  rect(ctx, ox, oy, px, 5, 7, 6, 4, b); // body
  rect(ctx, ox, oy, px, 10, 5, 4, 3, b); // head/neck
  rect(ctx, ox, oy, px, 13, 6, 1, 1, "#ffcc4d"); // eye
  rect(ctx, ox, oy, px, 13, 8, 2, 1, d); // snout
  rect(ctx, ox, oy, px, 1, 4, 5, 4, wing); // left wing
  rect(ctx, ox, oy, px, 0, 3, 3, 2, d);
  rect(ctx, ox, oy, px, 3, 3, 2, 5, b); // wing membrane frame
  rect(ctx, ox, oy, px, 1, 11, 2, 1, d); // tail
  rect(ctx, ox, oy, px, 3, 11, 3, 2, b);
  rect(ctx, ox, oy, px, 6, 11, 1, 2, d); // legs
  rect(ctx, ox, oy, px, 9, 11, 1, 2, d);
  rect(ctx, ox, oy, px, 10, 4, 1, 1, d); // horn
}

// ---------------- Scene background ----------------

const ZONE_SKY = ["#1a2a4a", "#241a3a", "#2a1a2a", "#1a1a24", "#2a1f14", "#141a24", "#241a14", "#2a1420"];
const ZONE_GROUND = ["#2f6b3a", "#3a2f5a", "#4a3a3a", "#3a3a44", "#4a3a24", "#243a34", "#4a3a2a", "#3a2430"];

export function drawScene(ctx: Ctx, w: number, h: number, zone: number) {
  const sky = ZONE_SKY[(zone - 1) % ZONE_SKY.length];
  const gnd = ZONE_GROUND[(zone - 1) % ZONE_GROUND.length];
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // stars/dots
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < 18; i++) {
    const x = (i * 53 + zone * 7) % w;
    const y = (i * 29) % (h - 30);
    ctx.fillRect(x, y, 1, 1);
  }
  // ground
  const groundY = h - 18;
  ctx.fillStyle = gnd;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, groundY, w, 2);
  // a few silhouette hills
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for (let i = 0; i < 4; i++) {
    const hx = i * (w / 3) - 10 + (zone % 3) * 6;
    ctx.fillRect(hx, groundY - 8, 30, 8);
  }
}

// ---------------- Item icons ----------------

export function drawItemIcon(ctx: Ctx, size: number, iconKey: string, accent: string) {
  ctx.clearRect(0, 0, size, size);
  const px = size / 16;
  const g = "#3a3550"; // grey metal
  const gL = "#c9c9d8";
  const wood = "#8a6a3a";
  const P = (x: number, y: number, w: number, h: number, c: string) => rect(ctx, 0, 0, px, x, y, w, h, c);
  switch (iconKey) {
    case "sword":
      P(7, 2, 2, 9, gL); P(6, 3, 1, 7, "#fff"); P(5, 11, 6, 1, wood); P(7, 12, 2, 2, wood);
      break;
    case "axe":
      P(7, 3, 1, 11, wood); P(8, 3, 4, 3, g); P(8, 3, 4, 1, gL); P(4, 3, 3, 3, g);
      break;
    case "bow":
      P(5, 2, 1, 12, wood); P(6, 2, 2, 1, wood); P(6, 13, 2, 1, wood); P(10, 3, 1, 10, gL);
      break;
    case "dagger":
      P(7, 3, 2, 7, gL); P(6, 9, 4, 1, wood); P(7, 10, 2, 3, wood);
      break;
    case "staff":
      P(8, 3, 1, 11, wood); P(7, 2, 3, 2, accent); P(8, 2, 1, 1, "#fff");
      break;
    case "helm":
      P(5, 4, 6, 4, g); P(5, 4, 6, 1, gL); P(6, 8, 4, 2, g); P(7, 5, 2, 2, "#0a0818");
      break;
    case "cap":
      P(5, 5, 6, 3, wood); P(5, 8, 6, 1, "#5a4a2a");
      break;
    case "hood":
      P(5, 4, 6, 5, "#4a6a4a"); P(6, 6, 4, 2, "#0a0818");
      break;
    case "plate":
      P(4, 4, 8, 7, g); P(4, 4, 8, 1, gL); P(7, 5, 2, 5, "#5a5f74"); P(4, 5, 1, 5, gL);
      break;
    case "robe":
      P(5, 4, 6, 8, accent); P(7, 5, 2, 6, "#0a0818"); P(5, 4, 6, 1, "#fff");
      break;
    case "tunic":
      P(5, 4, 6, 6, "#8a5a3a"); P(4, 5, 1, 3, "#6a4530"); P(11, 5, 1, 3, "#6a4530");
      break;
    case "greaves":
      P(5, 4, 2, 9, g); P(9, 4, 2, 9, g); P(5, 4, 2, 1, gL); P(9, 4, 2, 1, gL);
      break;
    case "ring":
      P(6, 5, 4, 4, accent); P(7, 6, 2, 2, "#0a0818"); P(7, 4, 2, 1, "#fff");
      break;
    case "amulet":
      P(6, 4, 4, 1, gL); P(5, 5, 1, 2, gL); P(10, 5, 1, 2, gL); P(7, 7, 2, 3, accent);
      break;
    case "potion":
      P(6, 6, 4, 6, accent); P(7, 4, 2, 2, gL); P(6, 6, 4, 1, "#fff"); P(7, 9, 2, 2, "#fff");
      break;
    case "ore":
      P(5, 8, 6, 4, "#7a7a8a"); P(6, 6, 3, 2, "#9a9aaa"); P(7, 7, 1, 1, accent);
      break;
    case "gel":
      P(5, 8, 6, 4, accent); P(6, 7, 4, 1, accent); P(6, 9, 1, 1, "#fff");
      break;
    default:
      P(6, 6, 4, 4, accent);
  }
}
