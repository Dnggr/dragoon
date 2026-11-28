// Dragoon simulation. Slither.io-style movement, square dragons. Pure: no DOM, no network, no timers.
// Used by the browser (practice mode) now and by the server in Phase 3.
// Units: 1 unit is about one body-block width. Numbers are PROPOSED, tune in playtests
// (see docs/GAME_DESIGN.md).

export const TICK_MS = 50;      // 20 ticks per second
const DT = TICK_MS / 1000;
export const SPEED = 6;         // units per second, always moving forward
export const HEAD_HP = 150;
export const SEG_HP = 50;
// Drawn square sizes (render.js) and the collision circles that sit between inscribed and circumscribed.
export const HEAD_SIDE = 0.95;
export const SEG_SIDE = 0.7;
export const PICKUP_SIDE = 0.7;
export const FRAG_SIDE = 0.3;
export const HEAD_R = 0.5;
export const SEG_R = 0.4;
const SPACING = 0.8;            // distance between block centers
const START_LEN = 5;
const TURN_MAX = 4.5;           // rad/s for a short dragon
const TURN_MIN = 1.5;           // rad/s floor for a very long dragon
const TURN_LOSS = 0.04;         // rad/s lost per block (longer = slower to turn)
const KILL_FACTOR = 0.82;       // kill when head-to-block distance < this * (sum of radii): a bit forgiving
const PICKUP_RANGE = 0.8;       // head to pickup distance that collects it (scaled with dragon size)
const SAFE_SPAWN = 6;           // spawn at least this far from other dragons
const TYPES = ['gun', 'rapid', 'shield', 'missile'];

// Shards: small XP pickups with no name. More shards = higher level, more HP, more damage, bigger body.
const FRAGS_PER_LEVEL = 10;
const MAX_FRAGS = 100;          // effects stop growing here (nothing stacks forever)
const SCALE_PER_FRAG = 0.01;    // body size +1% per shard, x2 at MAX_FRAGS
const HP_PER_LEVEL = 0.10;      // +10% max HP per level
const DMG_PER_LEVEL = 0.08;     // +8% damage per level (used by attacks from Phase 5)

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomColor = () => `hsl(${Math.floor(rand(0, 360))} 85% 60%)`;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const turnRate = (len) => Math.max(TURN_MIN, TURN_MAX - TURN_LOSS * len);
const hpMult = (level) => 1 + HP_PER_LEVEL * level;

export const scaleOf = (d) => 1 + SCALE_PER_FRAG * Math.min(d.frags, MAX_FRAGS);
export const damageMult = (d) => 1 + DMG_PER_LEVEL * d.level;

// Shortest signed angle from a to b, in (-PI, PI].
function angleDiff(a, b) {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  else if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

// walls are rectangles { x, y, w, h }. The map border counts as a wall.
function hitsWall(s, x, y, r) {
  if (x < r || y < r || x > s.w - r || y > s.h - r) return true;
  return s.walls.some((w) =>
    dist(x, y, Math.min(Math.max(x, w.x), w.x + w.w), Math.min(Math.max(y, w.y), w.y + w.h)) < r);
}

export function createState(w = 80, h = 60, walls = []) {
  return { tick: 0, w, h, walls, dragons: {}, pickups: [], bullets: [] };
}

// body[0] is the head. px/py = position one tick ago, used by the renderer to interpolate.
export function addDragon(s, id, name, color) {
  const mx = Math.min(10, s.w / 3), my = Math.min(10, s.h / 3);
  for (let tries = 0; tries < 200; tries++) {
    const x = rand(mx, s.w - mx), y = rand(my, s.h - my);
    const angle = Math.atan2(s.h / 2 - y, s.w / 2 - x);   // face the middle of the map
    const body = Array.from({ length: START_LEN }, (_, i) => {
      const bx = x - Math.cos(angle) * SPACING * i, by = y - Math.sin(angle) * SPACING * i;
      const hp = i === 0 ? HEAD_HP : SEG_HP;
      return { x: bx, y: by, px: bx, py: by, hp, max: hp };
    });
    if (body.some((seg) => hitsWall(s, seg.x, seg.y, HEAD_R + 1))) continue;
    // open ground ahead too: every 3 units up to 15 in front of the head (about 2.5 s of flying)
    if ([3, 6, 9, 12, 15].some((k) => hitsWall(s, x + Math.cos(angle) * k, y + Math.sin(angle) * k, HEAD_R + 1))) continue;
    const crowded = Object.values(s.dragons).some((o) =>
      o.alive && o.body.some((seg) => dist(x, y, seg.x, seg.y) < SAFE_SPAWN));
    if (crowded) continue;
    s.dragons[id] = { name, color, alive: true, angle, target: angle, frags: 0, level: 0, body };
    return s.dragons[id];
  }
}

// type 'frag' = small shard (XP). No type = random orb (gun, rapid, shield, missile).
export function spawnPickup(s, type) {
  for (let i = 0; i < 50; i++) {
    const x = rand(1, s.w - 1), y = rand(1, s.h - 1);
    if (!hitsWall(s, x, y, 0.5)) {
      s.pickups.push({ x, y, type: type || pick(TYPES), color: randomColor() });
      return;
    }
  }
}

// inputs: { [dragonId]: { angle } }  angle = radians the dragon should turn toward (undefined = keep heading)
export function step(s, inputs = {}) {
  s.tick++;
  const alive = Object.values(s.dragons).filter((d) => d.alive);
  Object.entries(s.dragons).forEach(([id, d]) => {
    if (!d.alive) return;
    const a = inputs[id]?.angle;
    if (Number.isFinite(a)) d.target = a;   // ignores NaN, strings, undefined
    moveDragon(d);
  });
  // decide all deaths first so head-on hits kill both dragons
  const dead = alive.filter((d) => isDead(s, d, alive));
  for (const d of dead) scatter(s, d);
  for (const d of alive) if (d.alive) collect(s, d);
}

function moveDragon(d) {
  for (const seg of d.body) { seg.px = seg.x; seg.py = seg.y; }
  const max = turnRate(d.body.length) * DT;
  d.angle += Math.max(-max, Math.min(max, angleDiff(d.angle, d.target)));
  const head = d.body[0];
  head.x += Math.cos(d.angle) * SPEED * DT;
  head.y += Math.sin(d.angle) * SPEED * DT;
  // each block follows the one in front, never farther than the spacing (spacing grows with size)
  const gap = SPACING * scaleOf(d);
  for (let i = 1; i < d.body.length; i++) {
    const prev = d.body[i - 1], seg = d.body[i];
    const dx = seg.x - prev.x, dy = seg.y - prev.y, len = Math.hypot(dx, dy);
    if (len > gap) {
      seg.x = prev.x + (dx * gap) / len;
      seg.y = prev.y + (dy * gap) / len;
    }
  }
}

// Death: wall, border, or head touching any OTHER dragon's block. No self-collision.
function isDead(s, d, alive) {
  const h = d.body[0], hr = HEAD_R * scaleOf(d);
  if (hitsWall(s, h.x, h.y, hr)) return true;
  return alive.some((o) => {
    if (o === d) return false;
    const k = scaleOf(o);
    return o.body.some((seg, i) => dist(h.x, h.y, seg.x, seg.y) < KILL_FACTOR * (hr + (i ? SEG_R : HEAD_R) * k));
  });
}

// Death: every block becomes a random-type orb, plus shards (about 2 per block, plus half of the shards eaten).
function scatter(s, d) {
  const put = (x, y, type) => s.pickups.push({
    x: Math.min(Math.max(x, 0.3), s.w - 0.3), y: Math.min(Math.max(y, 0.3), s.h - 0.3), type, color: d.color });
  for (const seg of d.body) put(seg.x, seg.y, pick(TYPES));
  const shards = Math.min(120, d.body.length * 2 + Math.floor(d.frags / 2));
  for (let i = 0; i < shards; i++) {
    const seg = d.body[i % d.body.length];
    put(seg.x + rand(-0.5, 0.5), seg.y + rand(-0.5, 0.5), 'frag');
  }
  d.alive = false;
  d.body = [];
}

function collect(s, d) {
  const h = d.body[0], range = PICKUP_RANGE * scaleOf(d);
  for (let i = s.pickups.length - 1; i >= 0; i--) {
    const p = s.pickups[i];
    if (dist(h.x, h.y, p.x, p.y) > range) continue;
    s.pickups.splice(i, 1);
    if (p.type === 'frag') eatShard(d); else growTail(d);
  }
}

// An orb adds one block at the tail.
function growTail(d) {
  const tail = d.body.at(-1), max = Math.round(SEG_HP * hpMult(d.level));
  d.body.push({ x: tail.x, y: tail.y, px: tail.px, py: tail.py, hp: max, max });
}

// A shard is XP. Every FRAGS_PER_LEVEL shards = a level: all blocks get more max HP (and heal by the gain).
function eatShard(d) {
  d.frags++;
  const level = Math.floor(Math.min(d.frags, MAX_FRAGS) / FRAGS_PER_LEVEL);
  if (level === d.level) return;
  d.level = level;
  d.body.forEach((seg, i) => {
    const max = Math.round((i ? SEG_HP : HEAD_HP) * hpMult(level));
    seg.hp += max - seg.max;
    seg.max = max;
  });
}
