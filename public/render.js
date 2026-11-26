// Draws a state snapshot. Never changes the state. Dragons are squares (see docs/sketch.png).
import { HEAD_SIDE, SEG_SIDE, PICKUP_SIDE, FRAG_SIDE, scaleOf } from './shared/sim.js';

const VIEW_W = 32;                 // world units visible across the screen for a small dragon
const ZOOM_PER_SIZE = 0.4;         // camera zooms out by 0.4 per +1.0 of dragon size (slither-style)
const LETTER = { gun: 'G', rapid: 'R', shield: 'S', missile: 'M' };
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
let cam = { x: 40, y: 30 };        // last camera center (kept when the dragon is dead)
let zoomW = VIEW_W;                // current visible width, eases toward the target
let lastScale = 1;

export function resize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

// A square of the given side centered at (x, y), turned by angle.
function square(ctx, x, y, side, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillRect(-side / 2, -side / 2, side, side);
  ctx.strokeRect(-side / 2, -side / 2, side, side);
  ctx.restore();
}

// alpha = how far we are into the current tick (0..1), used to slide between ticks.
export function draw(ctx, canvas, state, meId, alpha, glow) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = canvas.width / W;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#10131a';
  ctx.fillRect(sx(0), sy(0), state.w * size, state.h * size);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';   // faint grid so movement is visible
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.max(0, Math.ceil(camX / 2) * 2); x <= Math.min(state.w, camX + zoomW); x += 2) {
    ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(state.h));
  }
  for (let y = Math.max(0, Math.ceil(camY / 2) * 2); y <= Math.min(state.h, camY + viewH); y += 2) {
    ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(state.w), sy(y));
  }
  ctx.stroke();
  ctx.strokeStyle = '#e8453c';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx(0), sy(0), state.w * size, state.h * size);

  ctx.fillStyle = '#4a5160';
  for (const w of state.walls) ctx.fillRect(sx(w.x), sy(w.y), w.w * size, w.h * size);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2;
  for (const pk of state.pickups) {
    const cx = sx(pk.x), cy = sy(pk.y);
    if (cx < -size || cy < -size || cx > W + size || cy > H + size) continue;
    ctx.shadowBlur = glow ? size * 0.8 : 0;
    ctx.shadowColor = pk.color;
    ctx.fillStyle = pk.color;
    if (pk.type === 'frag') {                          // shard: small glowing diamond, no label
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      square(ctx, cx, cy, FRAG_SIDE * size, Math.PI / 4);
      continue;
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';         // orb: glowing square card with its letter
    square(ctx, cx, cy, PICKUP_SIDE * size, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.fillText(LETTER[pk.type], cx, cy + 1);
  }
  ctx.shadowBlur = 0;

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
}
