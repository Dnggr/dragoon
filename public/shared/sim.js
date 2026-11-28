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
// Guns: 1 barrel at the start, +1 per Gun orb (cap MAX_GUNS). Barrel i sits on body block i and every barrel
// fires along d.aim (world radians toward the cursor). Rapid orbs raise the fire rate.
export const GUN_LEN = 0.85;          // drawn barrel length from the block center (render.js); bullets spawn at its tip
export const BULLET_R = 0.15;
export const MAX_GUNS = 5;
// Every projectile type has its own speed (units/s), range (units) and damage (times damageMult(d), stored on the
// projectile, NOT applied to dragons yet). Walls are 3+ units thick, so a per-tick wall check cannot skip one.
export const WEAPONS = {
  basic:   { speed: 12, range: 24, dmg: 4,  r: BULLET_R },
  missile: { speed: 9,  range: 36, dmg: 10, r: 0.2, turn: 0.1, seek: 24 },   // turn = rad/tick, seek = homing radius
};
const ttlOf = (w) => Math.ceil(w.range / (w.speed * DT));
export const MAX_MISSILES = 3;        // missiles per cast (the starter missile counts, each Missile orb adds one)
export const MISSILE_CD = 120;        // ticks: 6 s between casts
export const MAX_SHIELD = 120;
const SHIELD_STEP = 40;               // shield HP per Shield orb. It only shows for now: nothing deals damage yet.
export const VOLLEY_TICKS = 1000 / TICK_MS / 2.5;   // base fire rate: 2.5 volleys per second
const RAPID_STEP = 0.1;               // +10% fire rate per Rapid orb
const MAX_RAPID = 5;                  // +50%
const SPACING = 0.8;            // distance between block centers
export const START_LEN = 5;
const TURN_MAX = 4.5;           // rad/s for a short dragon
const TURN_MIN = 1.5;           // rad/s floor for a very long dragon
const TURN_LOSS = 0.04;         // rad/s lost per block (longer = slower to turn)
// Walls are solid for the whole dragon. The head dies on contact (circle radius 0.6 = about the corner of its square,
// so it never visibly sinks into a wall). Body blocks are pushed out instead (no damage), so the tail cannot cut through
// a corner. A wall's collision box is the top face PLUS its front lip (WALL_LIP, drawn by render.js).
export const WALL_LIP = 0.7;
const HEAD_WALL_R = 0.6;
const SEG_WALL_R = 0.45;
const BULK_PER_BLOCK = 0.03;    // camera "bigness" grows 3% per block beyond the start length (on top of the shard size)
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
// How big the dragon is overall (shards AND length). The camera zooms out with this.
export const bulkOf = (d) => scaleOf(d) * (1 + BULK_PER_BLOCK * Math.max(0, d.body.length - START_LEN));

// Shortest signed angle from a to b, in (-PI, PI].
function angleDiff(a, b) {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  else if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

// walls are rectangles { x, y, w, h }. The map border counts as a wall.
// The box of a wall is its top face plus the front lip below it.
function hitsWall(s, x, y, r) {
  if (x < r || y < r || x > s.w - r || y > s.h - r) return true;
  return s.walls.some((w) =>
    dist(x, y, Math.min(Math.max(x, w.x), w.x + w.w), Math.min(Math.max(y, w.y), w.y + w.h + WALL_LIP)) < r);
}

// Push a block out of walls and the border along the shortest way. Returns how far it moved.
function pushOut(s, seg, r) {
  const ox = seg.x, oy = seg.y;
  seg.x = Math.min(Math.max(seg.x, r), s.w - r);
  seg.y = Math.min(Math.max(seg.y, r), s.h - r);
  for (const w of s.walls) {
    const bottom = w.y + w.h + WALL_LIP;
    const cx = Math.min(Math.max(seg.x, w.x), w.x + w.w), cy = Math.min(Math.max(seg.y, w.y), bottom);
    const d = dist(seg.x, seg.y, cx, cy);
    if (d >= r) continue;
    if (d > 1e-6) { seg.x = cx + ((seg.x - cx) / d) * r; seg.y = cy + ((seg.y - cy) / d) * r; continue; }
    const gaps = [seg.x - w.x, w.x + w.w - seg.x, seg.y - w.y, bottom - seg.y];   // center is inside: leave by the nearest side
    const m = Math.min(...gaps);
    if (m === gaps[0]) seg.x = w.x - r;
    else if (m === gaps[1]) seg.x = w.x + w.w + r;
    else if (m === gaps[2]) seg.y = w.y - r;
    else seg.y = bottom + r;
  }
  return dist(ox, oy, seg.x, seg.y);
}

export function createState(w = 80, h = 60, walls = []) {
  return { tick: 0, w, h, walls, dragons: {}, pickups: [], bullets: [], events: [] };
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
    s.dragons[id] = { name, color, alive: true, angle, target: angle, aim: angle, fire: false, cast: false, reload: 0, guns: 1, rapid: 0, missiles: 1, mcd: 0, shield: 0, frags: 0, level: 0, body };
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

// inputs: { [dragonId]: { angle, aim, fire } }
//   angle = radians the dragon should turn toward (undefined = keep heading)
//   aim   = world radians from the head toward the cursor (undefined = keep the last aim)
//   fire  = true while the fire button is held (undefined = keep the last state)
//   cast  = true while the missile button (right click) is held (undefined = keep the last state)
// s.events is rebuilt every tick: things that just happened (muzzle, wall, fizzle, boom, death, pickup, level, scrape)
// for the effects layer. The sim never reads it.
export function step(s, inputs = {}) {
  s.tick++;
  s.events = [];
  const alive = Object.values(s.dragons).filter((d) => d.alive);
  Object.entries(s.dragons).forEach(([id, d]) => {
    if (!d.alive) return;
    const inp = inputs[id] || {};
    if (Number.isFinite(inp.angle)) d.target = inp.angle;   // ignores NaN, strings, undefined
    if (Number.isFinite(inp.aim)) d.aim = inp.aim;
    if (typeof inp.fire === 'boolean') d.fire = inp.fire;
    if (typeof inp.cast === 'boolean') d.cast = inp.cast;
    moveDragon(s, d);
  });
  moveBullets(s);
  // decide all deaths first so head-on hits kill both dragons
  const dead = alive.filter((d) => isDead(s, d, alive));
  for (const d of dead) scatter(s, d);
  for (const [id, d] of Object.entries(s.dragons)) {
    if (!d.alive) continue;
    collect(s, d);
    fire(s, id, d);
    launch(s, id, d);
  }
}

// Bullets fly straight and die on a wall, the border, or at the end of their range. Missiles also turn toward the
// nearest other dragon. px/py = position one tick ago, used by the renderer to interpolate.
function moveBullets(s) {
  s.bullets = s.bullets.filter((b) => {
    b.px = b.x;
    b.py = b.y;
    if (b.kind === 'missile') seek(s, b);
    b.x += b.vx;
    b.y += b.vy;
    if (hitsWall(s, b.x, b.y, b.r)) { impact(s, b); return false; }
    if (--b.ttl > 0) return true;
    s.events.push({ t: b.kind === 'missile' ? 'boom' : 'fizzle', x: b.x, y: b.y, c: s.dragons[b.owner]?.color });
    return false;
  });
}

// Turn a missile toward the nearest other living dragon inside its seek radius (no target = straight on).
function seek(s, b) {
  const w = WEAPONS.missile;
  let best, bd = w.seek;
  for (const [id, o] of Object.entries(s.dragons)) {
    if (!o.alive || id === b.owner) continue;
    const dd = dist(b.x, b.y, o.body[0].x, o.body[0].y);
    if (dd < bd) { bd = dd; best = o.body[0]; }
  }
  if (!best) return;
  const a = Math.atan2(b.vy, b.vx);
  const na = a + Math.max(-w.turn, Math.min(w.turn, angleDiff(a, Math.atan2(best.y - b.y, best.x - b.x))));
  b.vx = Math.cos(na) * w.speed * DT;
  b.vy = Math.sin(na) * w.speed * DT;
}

// Find the surface the projectile hit (bisect the last step) and report it.
function impact(s, b) {
  let lo = 0, hi = 1;
  const at = (f) => [b.px + (b.x - b.px) * f, b.py + (b.y - b.py) * f];
  for (let i = 0; i < 6; i++) {
    const m = (lo + hi) / 2;
    if (hitsWall(s, ...at(m), b.r)) hi = m; else lo = m;
  }
  const [x, y] = at(lo), [hx, hy] = at(hi);
  const edge = hx < b.r * 1.5 || hy < b.r * 1.5 || hx > s.w - b.r * 1.5 || hy > s.h - b.r * 1.5;
  s.events.push({ t: b.kind === 'missile' ? 'boom' : 'wall', x, y, a: Math.atan2(b.vy, b.vx), edge, c: s.dragons[b.owner]?.color });
}

function shoot(s, id, d, kind, x, y, a, extra = {}) {
  const w = WEAPONS[kind], speed = w.speed * DT;
  if (hitsWall(s, x, y, w.r)) {                          // the barrel tip is inside a wall: the shot dies on the spot
    s.events.push({ t: kind === 'missile' ? 'boom' : 'wall', x, y, a, edge: false, c: d.color });
    return;
  }
  s.bullets.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: w.r, owner: id, kind,
    ttl: ttlOf(w), life: ttlOf(w), dmg: w.dmg * damageMult(d), ...extra });
}

// Hold fire: one bullet per barrel, from the tip of each barrel, along the aim.
function fire(s, id, d) {
  d.reload = Math.max(d.reload - 1, -1);                 // floor of -1 so a long pause does not store a burst
  if (!d.fire || d.reload > 0) return;
  d.reload += VOLLEY_TICKS / (1 + RAPID_STEP * d.rapid);
  const k = scaleOf(d), cos = Math.cos(d.aim), sin = Math.sin(d.aim);
  for (const seg of d.body.slice(0, d.guns)) {           // ponytail: a dragon shorter than its gun count just fires fewer
    const x = seg.x + cos * GUN_LEN * k, y = seg.y + sin * GUN_LEN * k;
    shoot(s, id, d, 'basic', x, y, d.aim);
    s.events.push({ t: 'muzzle', x, y, a: d.aim, c: d.color });
  }
}

// Right click: a salvo of missiles from the head, spread a little, then a cooldown.
function launch(s, id, d) {
  d.mcd = Math.max(d.mcd - 1, 0);
  if (!d.cast || d.mcd > 0) return;
  d.mcd = MISSILE_CD;
  const head = d.body[0], k = scaleOf(d);
  for (let i = 0; i < d.missiles; i++) {
    const a = d.aim + (i - (d.missiles - 1) / 2) * 0.22;
    const x = head.x + Math.cos(a) * GUN_LEN * k, y = head.y + Math.sin(a) * GUN_LEN * k;
    shoot(s, id, d, 'missile', x, y, a);
    s.events.push({ t: 'muzzle', x, y, a, c: d.color, big: true });
  }
}

function moveDragon(s, d) {
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
    const moved = pushOut(s, seg, SEG_WALL_R * scaleOf(d));      // blocks never sit inside a wall
    if (moved > 0.03 && i % 2 === 0) s.events.push({ t: 'scrape', x: seg.x, y: seg.y, c: d.color });
  }
}

// Death: wall, border, or head touching any OTHER dragon's block. No self-collision.
function isDead(s, d, alive) {
  const h = d.body[0], hr = HEAD_R * scaleOf(d);
  if (hitsWall(s, h.x, h.y, HEAD_WALL_R * scaleOf(d))) return true;
  return alive.some((o) => {
    if (o === d) return false;
    const k = scaleOf(o);
    return o.body.some((seg, i) => dist(h.x, h.y, seg.x, seg.y) < KILL_FACTOR * (hr + (i ? SEG_R : HEAD_R) * k));
  });
}

// Death: every block becomes a random-type orb, plus shards (about 2 per block, plus half of the shards eaten).
function scatter(s, d) {
  s.events.push({ t: 'death', x: d.body[0].x, y: d.body[0].y, c: d.color, k: scaleOf(d) });
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
    s.events.push({ t: 'pickup', x: p.x, y: p.y, c: p.color, orb: p.type !== 'frag' });
    if (p.type === 'frag') { eatShard(s, d); continue; }
    growTail(d);                                          // every orb adds a block, then its own effect
    if (p.type === 'gun') d.guns = Math.min(MAX_GUNS, d.guns + 1);
    if (p.type === 'rapid') d.rapid = Math.min(MAX_RAPID, d.rapid + 1);
    if (p.type === 'missile') d.missiles = Math.min(MAX_MISSILES, d.missiles + 1);
    if (p.type === 'shield') d.shield = Math.min(MAX_SHIELD, d.shield + SHIELD_STEP);
  }
}

// An orb adds one block at the tail.
function growTail(d) {
  const tail = d.body.at(-1), max = Math.round(SEG_HP * hpMult(d.level));
  d.body.push({ x: tail.x, y: tail.y, px: tail.px, py: tail.py, hp: max, max });
}

// A shard is XP. Every FRAGS_PER_LEVEL shards = a level: all blocks get more max HP (and heal by the gain).
function eatShard(s, d) {
  d.frags++;
  const level = Math.floor(Math.min(d.frags, MAX_FRAGS) / FRAGS_PER_LEVEL);
  if (level === d.level) return;
  d.level = level;
  s.events.push({ t: 'level', x: d.body[0].x, y: d.body[0].y, c: d.color });
  d.body.forEach((seg, i) => {
    const max = Math.round((i ? SEG_HP : HEAD_HP) * hpMult(level));
    seg.hp += max - seg.max;
    seg.max = max;
  });
}
