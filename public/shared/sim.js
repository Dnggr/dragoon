// Dragoon simulation. Pure: no DOM, no network, no timers.
// Used by the browser (practice mode) now and by the server in Phase 3.
// Numbers here are PROPOSED values from docs/GAME_DESIGN.md, tune in playtests.

export const TICK_MS = 50;     // 20 ticks per second
export const MOVE_EVERY = 3;   // a dragon moves 1 cell every 3 ticks
export const HEAD_HP = 150;
export const SEG_HP = 50;
const START_LEN = 4;
const TYPES = ['gun', 'rapid', 'shield', 'missile'];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const cell = (s, x, y) => y * s.w + x;
const inside = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h;
const randInt = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[randInt(arr.length)];
const randomColor = () => `hsl(${randInt(360)} 85% 60%)`;

export function createState(w = 80, h = 60) {
  return { tick: 0, w, h, walls: [], dragons: {}, pickups: [], bullets: [] };
}

// Cells a head must not enter: walls and every body segment.
function solidCells(s) {
  const set = new Set(s.walls.map(([x, y]) => cell(s, x, y)));
  for (const d of Object.values(s.dragons)) for (const seg of d.body) set.add(cell(s, seg.x, seg.y));
  return set;
}

// Places a dragon of START_LEN cells facing right. body[0] is the head.
// px/py = previous cell, used only by the renderer to interpolate.
export function addDragon(s, id, name, color) {
  const taken = solidCells(s);
  for (let tries = 0; tries < 200; tries++) {
    const x = START_LEN + randInt(s.w - 2 * START_LEN);
    const y = 2 + randInt(s.h - 4);
    const body = Array.from({ length: START_LEN }, (_, i) => ({
      x: x - i, y, px: x - i, py: y, hp: i === 0 ? HEAD_HP : SEG_HP,
    }));
    // ponytail: no safe-distance check from other heads, fine for solo; revisit in Phase 3
    if (body.some((seg) => taken.has(cell(s, seg.x, seg.y)))) continue;
    s.dragons[id] = { name, color, alive: true, dir: 'right', nextDir: 'right', body };
    return s.dragons[id];
  }
}

export function spawnPickup(s) {
  const taken = solidCells(s);
  for (const p of s.pickups) taken.add(cell(s, p.x, p.y));
  for (let i = 0; i < 50; i++) {
    const x = randInt(s.w), y = randInt(s.h);
    if (!taken.has(cell(s, x, y))) {
      s.pickups.push({ x, y, type: pick(TYPES), color: randomColor() });
      return;
    }
  }
}

// inputs: { [dragonId]: { dir: 'up'|'down'|'left'|'right' } }
export function step(s, inputs = {}) {
  s.tick++;
  for (const [id, d] of Object.entries(s.dragons)) {
    const want = inputs[id]?.dir;
    // compare with the direction last MOVED, so two quick turns can never reverse into yourself
    if (d.alive && Object.hasOwn(DIRS, want) && want !== OPPOSITE[d.dir]) d.nextDir = want;
  }
  if (s.tick % MOVE_EVERY === 0) moveDragons(s);
}

function moveDragons(s) {
  const pickupAt = new Map(s.pickups.map((p) => [cell(s, p.x, p.y), p]));
  const blocked = new Set(s.walls.map(([x, y]) => cell(s, x, y)));

  const moves = Object.values(s.dragons).filter((d) => d.alive).map((d) => {
    d.dir = d.nextDir;
    const [dx, dy] = DIRS[d.dir];
    const nx = d.body[0].x + dx, ny = d.body[0].y + dy;
    const ok = inside(s, nx, ny);
    return { d, nx, ny, ok, eats: ok && pickupAt.has(cell(s, nx, ny)) };
  });

  // The tail cell is free this move unless the dragon eats (then the tail stays).
  const headCount = new Map();
  for (const m of moves) {
    m.d.body.forEach((seg, i) => {
      if (i < m.d.body.length - 1 || m.eats) blocked.add(cell(s, seg.x, seg.y));
    });
    if (m.ok) headCount.set(cell(s, m.nx, m.ny), (headCount.get(cell(s, m.nx, m.ny)) || 0) + 1);
  }

  for (const m of moves) {
    const c = m.ok && cell(s, m.nx, m.ny);
    m.dead = !m.ok || blocked.has(c) || headCount.get(c) > 1;
  }

  for (const m of moves) {
    if (m.dead) continue;
    const { body } = m.d;
    const tail = { x: body.at(-1).x, y: body.at(-1).y };
    for (let i = body.length - 1; i >= 0; i--) {
      const seg = body[i];
      seg.px = seg.x; seg.py = seg.y;
      seg.x = i === 0 ? m.nx : body[i - 1].x;   // body[i-1] is not moved yet when i > 0
      seg.y = i === 0 ? m.ny : body[i - 1].y;
    }
    if (m.eats) {
      s.pickups.splice(s.pickups.indexOf(pickupAt.get(cell(s, m.nx, m.ny))), 1);
      body.push({ x: tail.x, y: tail.y, px: tail.x, py: tail.y, hp: SEG_HP });
    }
  }

  for (const m of moves) if (m.dead) scatter(s, m.d);
}

// Death: every segment becomes a random-type pickup tinted with the dragon's color.
function scatter(s, d) {
  for (const seg of d.body) s.pickups.push({ x: seg.x, y: seg.y, type: pick(TYPES), color: d.color });
  d.alive = false;
  d.body = [];
}
