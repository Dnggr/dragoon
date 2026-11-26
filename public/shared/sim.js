// Dragoon simulation, slither.io style. Pure: no DOM, no network, no timers.
// Used by the browser (practice mode) now and by the server in Phase 3.
// Units: 1 unit = about one body-segment width. Numbers are PROPOSED, tune in playtests
// (see docs/GAME_DESIGN.md).

export const TICK_MS = 50;      // 20 ticks per second
const DT = TICK_MS / 1000;
export const SPEED = 6;         // units per second, always moving forward
export const HEAD_HP = 150;
export const SEG_HP = 50;
export const HEAD_R = 0.6;
export const SEG_R = 0.5;
export const PICKUP_R = 0.3;
const SPACING = 0.7;            // distance between segment centers
const START_LEN = 5;
const TURN_MAX = 4.5;           // rad/s for a short dragon
const TURN_MIN = 1.5;           // rad/s floor for a very long dragon
const TURN_LOSS = 0.04;         // rad/s lost per segment (longer = slower to turn)
const KILL_DIST = 0.9;          // head to another dragon's segment; a bit under touching, so it feels fair
const PICKUP_RANGE = 0.9;       // head to pickup distance that collects it
const SAFE_SPAWN = 6;           // spawn at least this far from other dragons
const TYPES = ['gun', 'rapid', 'shield', 'missile'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomColor = () => `hsl(${Math.floor(rand(0, 360))} 85% 60%)`;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const turnRate = (len) => Math.max(TURN_MIN, TURN_MAX - TURN_LOSS * len);

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

export function createState(w = 80, h = 60) {
  return { tick: 0, w, h, walls: [], dragons: {}, pickups: [], bullets: [] };
}

// body[0] is the head. px/py = position one tick ago, used by the renderer to interpolate.
export function addDragon(s, id, name, color) {
  const mx = Math.min(10, s.w / 3), my = Math.min(10, s.h / 3);
  for (let tries = 0; tries < 200; tries++) {
    const x = rand(mx, s.w - mx), y = rand(my, s.h - my);
    const angle = Math.atan2(s.h / 2 - y, s.w / 2 - x);   // face the middle of the map
    const body = Array.from({ length: START_LEN }, (_, i) => {
      const bx = x - Math.cos(angle) * SPACING * i, by = y - Math.sin(angle) * SPACING * i;
      return { x: bx, y: by, px: bx, py: by, hp: i === 0 ? HEAD_HP : SEG_HP };
    });
    if (body.some((seg) => hitsWall(s, seg.x, seg.y, HEAD_R + 1))) continue;
    const crowded = Object.values(s.dragons).some((o) =>
      o.alive && o.body.some((seg) => dist(x, y, seg.x, seg.y) < SAFE_SPAWN));
    if (crowded) continue;
    s.dragons[id] = { name, color, alive: true, angle, target: angle, body };
    return s.dragons[id];
  }
}

export function spawnPickup(s) {
  for (let i = 0; i < 50; i++) {
    const x = rand(1, s.w - 1), y = rand(1, s.h - 1);
    if (!hitsWall(s, x, y, PICKUP_R + 0.2)) {
      s.pickups.push({ x, y, type: pick(TYPES), color: randomColor() });
      return;
    }
  }
}

// inputs: { [dragonId]: { angle } }  angle = radians the dragon should turn toward
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
  // each segment follows the one in front, never farther than SPACING
  for (let i = 1; i < d.body.length; i++) {
    const prev = d.body[i - 1], seg = d.body[i];
    const dx = seg.x - prev.x, dy = seg.y - prev.y, len = Math.hypot(dx, dy);
    if (len > SPACING) {
      seg.x = prev.x + (dx * SPACING) / len;
      seg.y = prev.y + (dy * SPACING) / len;
    }
  }
}

// Death: wall, border, or head touching any OTHER dragon's segment. No self-collision.
function isDead(s, d, alive) {
  const h = d.body[0];
  if (hitsWall(s, h.x, h.y, HEAD_R)) return true;
  return alive.some((o) => o !== d && o.body.some((seg) => dist(h.x, h.y, seg.x, seg.y) < KILL_DIST));
}

// Every segment becomes a random-type pickup tinted with the dragon's color.
function scatter(s, d) {
  for (const seg of d.body) s.pickups.push({ x: seg.x, y: seg.y, type: pick(TYPES), color: d.color });
  d.alive = false;
  d.body = [];
}

// Collecting a pickup grows the dragon by one segment at the tail.
function collect(s, d) {
  const h = d.body[0];
  for (let i = s.pickups.length - 1; i >= 0; i--) {
    const p = s.pickups[i];
    if (dist(h.x, h.y, p.x, p.y) > PICKUP_RANGE) continue;
    s.pickups.splice(i, 1);
    const tail = d.body.at(-1);
    d.body.push({ x: tail.x, y: tail.y, px: tail.px, py: tail.py, hp: SEG_HP });
  }
}
