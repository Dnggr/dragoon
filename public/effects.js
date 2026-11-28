// Visual effects only. main.js feeds it the sim's per-tick `state.events`, render.js calls drawFx() every frame.
// Particles live in world units and never touch the sim state. Sprites are Kenney CC0 (public/assets/sprites/fx).
const MAX = 700;                       // hard cap so a long firefight cannot pile up particles
const rand = (a, b) => a + Math.random() * (b - a);
const parts = [];
const img = {};
for (const [name, file] of Object.entries({
  burst: 'burst.png', smoke: 'greyCloud1.png', fire: 'orangeCloud1.png', boom: 'regularExplosion04.png', flash: 'shotOrange.png',
})) {
  const i = new Image();
  i.onload = () => { img[name] = i; };
  i.src = `assets/sprites/fx/${file}`;     // a missing sprite just means that particle draws as a dot
}

// kind: 'img' (sprite), 'spark' (streak), 'debris' (spinning square), 'ring', 'scorch' (mark left on a wall)
function add(p) {
  if (parts.length >= MAX) parts.shift();
  parts.push({ vx: 0, vy: 0, rot: 0, vr: 0, s0: 0.3, s1: 0.3, a: 1, add: false, under: false, color: '#fff', ...p, t: 0 });
}

// n particles flying out around angle `a` (spread = half-width in radians), speed in units/s.
function spray(n, x, y, a, spread, v0, v1, life, color, kind = 'spark', size = 0.1) {
  for (let i = 0; i < n; i++) {
    const ang = a + rand(-spread, spread), v = rand(v0, v1);
    add({ kind, x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: rand(life * 0.6, life), s0: size, s1: size * 0.4, color, add: kind === 'spark', rot: ang, vr: rand(-8, 8) });
  }
}
const puff = (name, x, y, s0, s1, life, a, v = 0.6) =>
  add({ kind: 'img', img: name, x, y, vx: rand(-v, v), vy: rand(-v, v), life, s0, s1, a, rot: rand(0, 6.3), vr: rand(-1, 1) });

const HANDLERS = {
  // a flash at the barrel tip and a few sparks thrown forward
  muzzle(e) {
    add({ kind: 'img', img: 'flash', x: e.x, y: e.y, life: 0.08, s0: e.big ? 1.3 : 0.8, s1: e.big ? 1.8 : 1.1, a: 1, add: true, rot: e.a + Math.PI / 2, off: -0.35 });
    spray(e.big ? 6 : 2, e.x, e.y, e.a, 0.35, 4, 9, 0.18, '#ffd27a', 'spark', 0.07);
  },
  // a bullet hit a wall: flash, sparks thrown back, dust, and a mark that stays for a few seconds
  wall(e) {
    const back = e.a + Math.PI, c = e.edge ? '#ff6b5e' : '#ffd27a';
    add({ kind: 'img', img: 'burst', x: e.x, y: e.y, life: 0.14, s0: 0.3, s1: 1.0, a: 0.9, add: true, rot: rand(0, 6.3) });
    spray(8, e.x, e.y, back, 1.0, 3, 8, 0.4, c, 'spark', 0.08);
    puff('smoke', e.x, e.y, 0.4, 1.1, 0.5, 0.3);
    add({ kind: 'scorch', x: e.x, y: e.y, life: 4, s0: 0.22, s1: 0.22, a: 0.5, under: true, color: '#000' });
    add({ kind: 'scorch', x: e.x, y: e.y, life: 0.8, s0: 0.3, s1: 0.1, a: 0.9, under: true, color: c, add: true });
  },
  // a bullet ran out of range: it fizzles
  fizzle(e) {
    puff('smoke', e.x, e.y, 0.2, 0.7, 0.35, 0.25);
    spray(3, e.x, e.y, 0, Math.PI, 0.5, 2, 0.3, e.c || '#ffd27a', 'spark', 0.06);
  },
  // missile exploded (wall, range end, or barrel inside a wall)
  boom(e) {
    add({ kind: 'img', img: 'boom', x: e.x, y: e.y, life: 0.5, s0: 1.2, s1: 4.2, a: 1, rot: rand(0, 6.3) });
    add({ kind: 'ring', x: e.x, y: e.y, life: 0.35, s0: 0.5, s1: 3.2, a: 0.8, color: '#ffb35e', add: true });
    puff('fire', e.x, e.y, 1, 2.8, 0.45, 0.9);
    for (let i = 0; i < 3; i++) puff('smoke', e.x, e.y, 1, 3, 0.9, 0.5, 1.2);
    spray(16, e.x, e.y, 0, Math.PI, 3, 11, 0.55, '#ffcf6a', 'spark', 0.1);
    add({ kind: 'scorch', x: e.x, y: e.y, life: 6, s0: 0.9, s1: 0.9, a: 0.45, under: true, color: '#000' });
  },
  // a dragon died: big explosion, shockwave, pieces of it in its own color
  death(e) {
    const k = e.k || 1;
    add({ kind: 'img', img: 'boom', x: e.x, y: e.y, life: 0.6, s0: 2 * k, s1: 7 * k, a: 1, rot: rand(0, 6.3) });
    add({ kind: 'ring', x: e.x, y: e.y, life: 0.5, s0: 0.8 * k, s1: 6 * k, a: 0.9, color: e.c, add: true });
    puff('fire', e.x, e.y, 1.5 * k, 4 * k, 0.5, 0.9);
    for (let i = 0; i < 4; i++) puff('smoke', e.x, e.y, 1.5, 4, 1.1, 0.5, 1.5);
    spray(22, e.x, e.y, 0, Math.PI, 2, 9, 1, e.c, 'debris', 0.28 * k);
  },
  // orb or shard picked up
  pickup(e) {
    if (!e.orb) { spray(3, e.x, e.y, 0, Math.PI, 1, 3, 0.25, e.c, 'spark', 0.06); return; }
    add({ kind: 'ring', x: e.x, y: e.y, life: 0.3, s0: 0.4, s1: 1.8, a: 0.9, color: e.c, add: true });
    spray(7, e.x, e.y, 0, Math.PI, 2, 5, 0.35, e.c, 'spark', 0.08);
  },
  level(e) {
    add({ kind: 'ring', x: e.x, y: e.y, life: 0.6, s0: 0.6, s1: 4, a: 1, color: '#ffe27a', add: true });
    add({ kind: 'ring', x: e.x, y: e.y, life: 0.8, s0: 0.3, s1: 5.5, a: 0.7, color: e.c, add: true });
    add({ kind: 'img', img: 'burst', x: e.x, y: e.y, life: 0.35, s0: 0.8, s1: 3, a: 1, add: true });
  },
  // a body block is sliding along a wall
  scrape(e) {
    spray(2, e.x, e.y, rand(0, 6.3), Math.PI, 1, 3.5, 0.25, '#ffe9b0', 'spark', 0.05);
  },
};

export function addEvents(events) {
  for (const e of events) HANDLERS[e.t]?.(e);
}

// Missiles leave a fire + smoke trail. Called once per frame, so the amount depends on dt.
function trails(state, alpha, dt) {
  for (const b of state.bullets) {
    if (b.kind !== 'missile') continue;
    const x = b.px + (b.x - b.px) * alpha, y = b.py + (b.y - b.py) * alpha;
    if (Math.random() < dt * 60) puff('fire', x, y, 0.35, 0.1, 0.2, 0.9, 0.2);
    if (Math.random() < dt * 30) puff('smoke', x, y, 0.3, 0.9, 0.6, 0.35, 0.3);
  }
}

export function clearFx() { parts.length = 0; }

// layer 'under' = marks on the floor/walls (drawn before dragons), 'over' = everything else.
// sx/sy turn world units into screen pixels, size = pixels per world unit.
let last = 0;
export function updateFx(state, alpha, now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.05);   // seconds since the previous frame, capped (background tab)
  last = now;
  trails(state, alpha, dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.kind === 'spark' || p.kind === 'debris') { p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt; }
  }
}

export function drawFx(ctx, sx, sy, size, layer) {
  const under = layer === 'under';
  for (const p of parts) {
    if (p.under !== under) continue;
    const u = p.t / p.life, fade = p.a * (1 - u * u), s = (p.s0 + (p.s1 - p.s0) * u) * size;
    const x = sx(p.x), y = sy(p.y);
    ctx.globalAlpha = Math.max(0, fade);
    ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    if (p.kind === 'img') {
      const im = img[p.img];
      if (!im) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      const h = s * im.height / im.width;
      ctx.drawImage(im, -s / 2, -h / 2 + (p.off || 0) * size, s, h);   // off: shift along the sprite's "up" (negative = forward)
      ctx.restore();
    } else if (p.kind === 'spark') {                       // a short streak along its velocity
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, s * 0.5);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - p.vx * 0.04 * size, y - p.vy * 0.04 * size);
      ctx.stroke();
    } else if (p.kind === 'debris') {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, size * 0.1 * (1 - u));
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'scorch') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
