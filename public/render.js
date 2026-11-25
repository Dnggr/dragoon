// Draws a state snapshot. Never changes the state.
import { MOVE_EVERY } from './shared/sim.js';

const VIEW_W = 32;                 // cells visible across the screen
const LETTER = { gun: 'G', rapid: 'R', shield: 'S', missile: 'M' };
const FORWARD = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let cam = { x: 40, y: 30 };        // last camera center in cells (kept when the dragon is dead)

export function resize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

// alpha = how far we are into the current tick (0..1)
export function draw(ctx, canvas, state, meId, alpha, glow) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = canvas.width / W;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Dragons move in grid steps; p slides them between cells so it looks smooth.
  const p = ((state.tick % MOVE_EVERY) + alpha) / MOVE_EVERY;
  const pos = (seg) => ({ x: seg.px + (seg.x - seg.px) * p, y: seg.py + (seg.y - seg.py) * p });

  const size = W / VIEW_W;
  const viewH = H / size;
  const me = state.dragons[meId];
  if (me?.alive) {
    const h = pos(me.body[0]);
    cam = { x: h.x + 0.5, y: h.y + 0.5 };
  }
  const camX = Math.min(Math.max(cam.x - VIEW_W / 2, 0), Math.max(0, state.w - VIEW_W));
  const camY = Math.min(Math.max(cam.y - viewH / 2, 0), Math.max(0, state.h - viewH));
  const sx = (x) => (x - camX) * size;
  const sy = (y) => (y - camY) * size;

  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#10131a';
  ctx.fillRect(sx(0), sy(0), state.w * size, state.h * size);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.max(0, Math.floor(camX)); x <= Math.min(state.w, Math.ceil(camX + VIEW_W)); x++) {
    ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(state.h));
  }
  for (let y = Math.max(0, Math.floor(camY)); y <= Math.min(state.h, Math.ceil(camY + viewH)); y++) {
    ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(state.w), sy(y));
  }
  ctx.stroke();
  ctx.strokeStyle = '#e8453c';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx(0), sy(0), state.w * size, state.h * size);

  ctx.fillStyle = '#4a5160';
  for (const [x, y] of state.walls) ctx.fillRect(sx(x), sy(y), size, size);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const pk of state.pickups) {
    const cx = sx(pk.x) + size / 2, cy = sy(pk.y) + size / 2;
    if (cx < -size || cy < -size || cx > W + size || cy > H + size) continue;
    ctx.shadowBlur = glow ? size * 0.8 : 0;
    ctx.shadowColor = pk.color;
    ctx.fillStyle = pk.color;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = `bold ${size * 0.34}px sans-serif`;
    ctx.fillText(LETTER[pk.type], cx, cy + 1);
  }

  for (const d of Object.values(state.dragons)) {
    for (let i = d.body.length - 1; i >= 0; i--) {   // tail first so the head ends up on top
      const { x, y } = pos(d.body[i]);
      const inset = i === 0 ? size * 0.04 : size * 0.1;
      ctx.shadowBlur = glow && i === 0 ? size * 0.7 : 0;
      ctx.shadowColor = d.color;
      ctx.fillStyle = d.color;
      ctx.fillRect(sx(x) + inset, sy(y) + inset, size - 2 * inset, size - 2 * inset);
    }
    ctx.shadowBlur = 0;
    if (!d.body.length) continue;

    const head = pos(d.body[0]);
    const hx = sx(head.x) + size / 2, hy = sy(head.y) + size / 2;
    const [fx, fy] = FORWARD[d.dir];
    ctx.fillStyle = '#fff';
    for (const side of [-1, 1]) {                    // two eyes, front of the head
      ctx.beginPath();
      ctx.arc(hx + fx * size * 0.2 - fy * side * size * 0.18, hy + fy * size * 0.2 + fx * side * size * 0.18, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = `${Math.max(11, size * 0.35)}px sans-serif`;
    ctx.fillText(d.name, hx, hy - size * 0.8);
  }
}
