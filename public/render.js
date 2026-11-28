// Draws a state snapshot. Never changes the state. Dragons are squares (see docs/sketch.png).
// Depth comes from: tinted floor pools, raised walls with a front lip and cast shadow, drop shadows
// under dragons and orbs, two layers of drifting embers that move faster than the floor, and a vignette.
import { HEAD_SIDE, SEG_SIDE, PICKUP_SIDE, FRAG_SIDE, scaleOf } from './shared/sim.js';
import { ZONES, EMBLEM } from './shared/map.js';

const VIEW_W = 32;                 // world units visible across the screen for a small dragon
const ZOOM_PER_SIZE = 0.4;         // camera zooms out by 0.4 per +1.0 of dragon size (slither-style)
const LETTER = { gun: 'G', rapid: 'R', shield: 'S', missile: 'M' };   // fallback if an icon fails to load
const WALL_LIP = 0.7;              // visible front face of a wall, in units (looks like wall height)
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const mod = (v, m) => ((v % m) + m) % m;
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };   // stable "random" 0..1
let cam = { x: 40, y: 30 };        // last camera center (kept when the dragon is dead)
let zoomW = VIEW_W;                // current visible width, eases toward the target
let lastScale = 1;

// ---- icons (game-icons.net, CC BY 3.0, see public/assets/CREDITS.md) ----
// Each SVG is drawn once into a small canvas so drawing it every frame stays cheap.
const icons = {};
for (const name of ['gun', 'rapid', 'shield', 'missile', 'dragon']) {
  const img = new Image();
  img.onload = () => {
    const px = name === 'dragon' ? 512 : 64;
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, px, px);
    if (name === 'dragon') {                    // floor emblem: recolor the black icon to a soft light violet
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#b9a8ff';
      g.fillRect(0, 0, px, px);
    }
    icons[name] = c;
  };
  img.src = `assets/icons/${name}.svg`;       // if it fails to load, orbs keep their letter
}

// ---- floor: soft color pools and cloud blotches, painted once at low resolution ----
const FLOOR_PX = 4;                // pixels per world unit in the pre-rendered floor
let floor, floorKey;

function buildFloor(w, h) {
  const c = document.createElement('canvas');
  c.width = w * FLOOR_PX;
  c.height = h * FLOOR_PX;
  const g = c.getContext('2d');
  g.fillStyle = '#10131a';
  g.fillRect(0, 0, c.width, c.height);
  const pool = (x, y, r, color, alpha) => {
    const grad = g.createRadialGradient(x * FLOOR_PX, y * FLOOR_PX, 0, x * FLOOR_PX, y * FLOOR_PX, r * FLOOR_PX);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color.length === 7 ? `${color}00` : 'rgba(0,0,0,0)');
    g.globalAlpha = alpha;
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
  };
  for (let i = 0; i < 220; i++) {              // light and dark clouds so the floor is not one flat color
    const dark = i % 2 === 0;
    pool(hash(i * 3 + 1) * w, hash(i * 3 + 2) * h, 4 + hash(i * 3 + 3) * 12, dark ? '#000000' : '#ffffff', dark ? 0.16 : 0.035);
  }
  for (const z of ZONES) pool(z.x, z.y, z.r, z.color, 0.2);
  g.globalAlpha = 1;
  return c;
}

// A square of the given side centered at (x, y), turned by angle.
function square(ctx, x, y, side, angle, outline = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillRect(-side / 2, -side / 2, side, side);
  if (outline) ctx.strokeRect(-side / 2, -side / 2, side, side);
  ctx.restore();
}

export function resize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

// Stone block with a front lip, lit from the top left. Shadows are drawn first for ALL walls (see draw).
function wallShadow(ctx, x, y, w, h, lip) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + lip * 0.5, y + lip * 0.6, w + lip * 1.6, h + lip * 2.2);   // wide soft part
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + lip * 0.4, y + lip * 0.4, w + lip * 0.8, h + lip * 1.4);   // dark core
}

function wallBlock(ctx, wall, x, y, w, h, size, lip) {
  ctx.fillStyle = '#1b1f2b';                                  // front lip, darker than the top
  ctx.fillRect(x, y + h, w, lip);
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(x, y + h, w, lip * 0.35);
  ctx.fillStyle = '#4a5266';                                  // top face
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';                       // stone seams, every 3 units along the long side
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (wall.w >= wall.h) for (let u = 3; u < wall.w; u += 3) { ctx.moveTo(x + u * size, y); ctx.lineTo(x + u * size, y + h); }
  else for (let u = 3; u < wall.h; u += 3) { ctx.moveTo(x, y + u * size); ctx.lineTo(x + w, y + u * size); }
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, size * 0.07);                 // bevel: light on top/left, dark on bottom/right
  ctx.strokeStyle = 'rgba(190,205,255,0.35)';
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.stroke();
}

// Two layers of faint embers drifting on screen. They shift faster than the world when the camera moves,
// which reads as floating above the floor.
function embers(ctx, W, H, size, camX, camY, now) {
  for (const [f, count, r, alpha] of [[1.3, 30, 0.07, 0.22], [1.8, 14, 0.14, 0.14]]) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffb870';
    for (let i = 0; i < count; i++) {
      const x = mod(hash(i * 7 + f * 100) * W - camX * f * size, W);
      const y = mod(hash(i * 11 + f * 50) * H - camY * f * size - now * 0.012 * f, H);
      ctx.beginPath();
      ctx.arc(x, y, r * size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// alpha = how far we are into the current tick (0..1), used to slide between ticks.
export function draw(ctx, canvas, state, meId, alpha, glow) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = canvas.width / W;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const now = performance.now();

  const pos = (seg) => ({ x: seg.px + (seg.x - seg.px) * alpha, y: seg.py + (seg.y - seg.py) * alpha });
  const me = state.dragons[meId];
  if (me?.alive) {
    cam = pos(me.body[0]);
    lastScale = scaleOf(me);
  }
  zoomW += (VIEW_W * (1 + ZOOM_PER_SIZE * (lastScale - 1)) - zoomW) * 0.1;   // bigger dragon = wider view
  const size = W / zoomW;
  const viewH = H / size;
  const camX = clamp(cam.x - zoomW / 2, 0, Math.max(0, state.w - zoomW));
  const camY = clamp(cam.y - viewH / 2, 0, Math.max(0, state.h - viewH));
  const sx = (x) => (x - camX) * size;
  const sy = (y) => (y - camY) * size;
  const onScreen = (x, y, w, h) => sx(x + w) > 0 && sy(y + h) > 0 && sx(x) < W && sy(y) < H;

  ctx.fillStyle = '#05060a';                                  // void outside the map
  ctx.fillRect(0, 0, W, H);

  // floor: only the visible part of the pre-rendered image
  if (floorKey !== `${state.w}x${state.h}`) { floor = buildFloor(state.w, state.h); floorKey = `${state.w}x${state.h}`; }
  const vw = Math.min(zoomW, state.w - camX), vh = Math.min(viewH, state.h - camY);
  ctx.drawImage(floor, camX * FLOOR_PX, camY * FLOOR_PX, vw * FLOOR_PX, vh * FLOOR_PX, sx(camX), sy(camY), vw * size, vh * size);

  ctx.fillStyle = 'rgba(255,255,255,0.02)';                   // big checker panels, 8 units
  for (let gx = Math.floor(camX / 8) * 8; gx < camX + zoomW; gx += 8) {
    for (let gy = Math.floor(camY / 8) * 8; gy < camY + viewH; gy += 8) {
      if (gx >= 0 && gy >= 0 && gx < state.w && gy < state.h && ((gx + gy) / 8) % 2 === 0) ctx.fillRect(sx(gx), sy(gy), 8 * size, 8 * size);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';                // faint grid so movement is visible
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.max(0, Math.ceil(camX / 4) * 4); x <= Math.min(state.w, camX + zoomW); x += 4) {
    ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(state.h));
  }
  for (let y = Math.max(0, Math.ceil(camY / 4) * 4); y <= Math.min(state.h, camY + viewH); y += 4) {
    ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(state.w), sy(y));
  }
  ctx.stroke();

  if (icons.dragon && onScreen(EMBLEM.x - EMBLEM.size / 2, EMBLEM.y - EMBLEM.size / 2, EMBLEM.size, EMBLEM.size)) {
    ctx.globalAlpha = 0.14;
    ctx.drawImage(icons.dragon, sx(EMBLEM.x - EMBLEM.size / 2), sy(EMBLEM.y - EMBLEM.size / 2), EMBLEM.size * size, EMBLEM.size * size);
    ctx.globalAlpha = 1;
  }

  // border: red haze fading inward (clipped to the map), then the glowing line
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx(0), sy(0), state.w * size, state.h * size);
  ctx.clip();
  ctx.strokeStyle = '#e8453c';
  for (const [width, a] of [[10, 0.05], [5, 0.07], [2, 0.12]]) {
    ctx.globalAlpha = a;
    ctx.lineWidth = width * size;
    ctx.strokeRect(sx(0), sy(0), state.w * size, state.h * size);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = glow ? size * 0.8 : 0;
  ctx.shadowColor = '#e8453c';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx(0), sy(0), state.w * size, state.h * size);
  ctx.shadowBlur = 0;

  const lip = WALL_LIP * size;
  const seen = state.walls.filter((w) => onScreen(w.x, w.y, w.w + 2, w.h + 3));
  for (const w of seen) wallShadow(ctx, sx(w.x), sy(w.y), w.w * size, w.h * size, lip);
  for (const w of seen) wallBlock(ctx, w, sx(w.x), sy(w.y), w.w * size, w.h * size, size, lip);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2;
  for (const pk of state.pickups) {
    const cx = sx(pk.x), cy = sy(pk.y);
    if (cx < -size || cy < -size || cx > W + size || cy > H + size) continue;
    if (pk.type === 'frag') {                          // shard: small glowing diamond, no label
      ctx.shadowBlur = glow ? size * 0.8 : 0;
      ctx.shadowColor = pk.color;
      ctx.fillStyle = pk.color;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      square(ctx, cx, cy, FRAG_SIDE * size, Math.PI / 4);
      continue;
    }
    const bob = Math.sin(now / 450 + pk.x * 3 + pk.y) * 0.08 * size;   // orbs float: shadow stays, card bobs
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    square(ctx, cx + size * 0.12, cy + size * 0.22, PICKUP_SIDE * size * 0.9, 0, false);
    ctx.shadowBlur = glow ? size * 0.8 : 0;
    ctx.shadowColor = pk.color;
    ctx.fillStyle = pk.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    square(ctx, cx, cy + bob, PICKUP_SIDE * size, 0);
    ctx.shadowBlur = 0;
    if (icons[pk.type]) {
      const s = PICKUP_SIDE * size * 0.82;
      ctx.drawImage(icons[pk.type], cx - s / 2, cy + bob - s / 2, s, s);
    } else {
      ctx.fillStyle = '#000';
      ctx.font = `bold ${size * 0.4}px sans-serif`;
      ctx.fillText(LETTER[pk.type], cx, cy + bob + 1);
    }
  }
  ctx.shadowBlur = 0;

  ctx.lineWidth = 2;
  for (const d of Object.values(state.dragons)) {       // drop shadows first, so the dragon hovers
    const k = scaleOf(d);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    d.body.forEach((seg, i) => {
      const p = pos(seg);
      square(ctx, sx(p.x) + size * 0.3 * k, sy(p.y) + size * 0.42 * k, (i === 0 ? HEAD_SIDE : SEG_SIDE) * k * size, 0, false);
    });
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  for (const d of Object.values(state.dragons)) {
    const k = scaleOf(d);
    const pts = d.body.map(pos);
    for (let i = pts.length - 1; i >= 0; i--) {         // tail first so the head ends up on top
      const angle = i === 0 ? d.angle : Math.atan2(pts[i - 1].y - pts[i].y, pts[i - 1].x - pts[i].x);
      ctx.shadowBlur = glow && i === 0 ? size * 0.7 : 0;
      ctx.shadowColor = d.color;
      ctx.fillStyle = d.color;
      square(ctx, sx(pts[i].x), sy(pts[i].y), (i === 0 ? HEAD_SIDE : SEG_SIDE) * k * size, angle);
    }
    ctx.shadowBlur = 0;
    if (!pts.length) continue;

    const hx = sx(pts[0].x), hy = sy(pts[0].y);
    const fx = Math.cos(d.angle), fy = Math.sin(d.angle);
    for (const side of [-1, 1]) {                       // two eyes at the front of the head
      const ex = hx + fx * size * 0.22 * k - fy * side * size * 0.22 * k;
      const ey = hy + fy * size * 0.22 * k + fx * side * size * 0.22 * k;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, ey, size * 0.12 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ex + fx * size * 0.04 * k, ey + fy * size * 0.04 * k, size * 0.06 * k, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(11, size * 0.35)}px sans-serif`;
    ctx.fillText(d.name, hx, hy - size * 0.9 * k);
  }

  embers(ctx, W, H, size, camX, camY, now);

  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
