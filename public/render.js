// Draws a state snapshot. Never changes the state.
import { HEAD_R, SEG_R, PICKUP_R } from './shared/sim.js';

const VIEW_W = 32;                 // world units visible across the screen
const LETTER = { gun: 'G', rapid: 'R', shield: 'S', missile: 'M' };
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
let cam = { x: 40, y: 30 };        // last camera center (kept when the dragon is dead)
let view = { camX: 0, camY: 0, size: 40 };

export function resize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

// Screen pixel -> world position, using the camera of the last draw().
export function toWorld(px, py) {
  return { x: view.camX + px / view.size, y: view.camY + py / view.size };
}

// alpha = how far we are into the current tick (0..1), used to slide between ticks.
export function draw(ctx, canvas, state, meId, alpha, glow) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = canvas.width / W;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pos = (seg) => ({ x: seg.px + (seg.x - seg.px) * alpha, y: seg.py + (seg.y - seg.py) * alpha });
  const size = W / VIEW_W;
  const viewH = H / size;
  const me = state.dragons[meId];
  if (me?.alive) cam = pos(me.body[0]);
  const camX = clamp(cam.x - VIEW_W / 2, 0, Math.max(0, state.w - VIEW_W));
  const camY = clamp(cam.y - viewH / 2, 0, Math.max(0, state.h - viewH));
  view = { camX, camY, size };
  const sx = (x) => (x - camX) * size;
  const sy = (y) => (y - camY) * size;

  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#10131a';
  ctx.fillRect(sx(0), sy(0), state.w * size, state.h * size);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';   // faint grid so movement is visible
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.max(0, Math.ceil(camX / 2) * 2); x <= Math.min(state.w, camX + VIEW_W); x += 2) {
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
  for (const pk of state.pickups) {
    const cx = sx(pk.x), cy = sy(pk.y);
    if (cx < -size || cy < -size || cx > W + size || cy > H + size) continue;
    ctx.shadowBlur = glow ? size * 0.8 : 0;
    ctx.shadowColor = pk.color;
    ctx.fillStyle = pk.color;
    ctx.beginPath();
    ctx.arc(cx, cy, PICKUP_R * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = `bold ${size * 0.34}px sans-serif`;
    ctx.fillText(LETTER[pk.type], cx, cy + 1);
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  for (const d of Object.values(state.dragons)) {
    for (let i = d.body.length - 1; i >= 0; i--) {   // tail first so the head ends up on top
      const { x, y } = pos(d.body[i]);
      ctx.shadowBlur = glow && i === 0 ? size * 0.7 : 0;
      ctx.shadowColor = d.color;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), (i === 0 ? HEAD_R : SEG_R) * size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    if (!d.body.length) continue;

    const head = pos(d.body[0]);
    const hx = sx(head.x), hy = sy(head.y);
    const fx = Math.cos(d.angle), fy = Math.sin(d.angle);
    for (const side of [-1, 1]) {                    // two eyes at the front of the head
      const ex = hx + fx * size * 0.25 - fy * side * size * 0.28;
      const ey = hy + fy * size * 0.25 + fx * side * size * 0.28;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, ey, size * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ex + fx * size * 0.05, ey + fy * size * 0.05, size * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(11, size * 0.35)}px sans-serif`;
    ctx.fillText(d.name, hx, hy - size * 0.95);
  }
}
