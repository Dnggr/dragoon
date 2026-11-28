// Corner minimap: floor zone colors, walls, border, the visible area, and your own dragon.
// Enemies are not shown on purpose (walls are for hiding behind, see the sketch). Never changes the state.
import { ZONES } from './shared/map.js';

const PX = 2;                         // pixels per world unit in the pre-rendered layer
const MARGIN = 12;
let layer, layerKey;

// Zones + walls never change during a match, so they are painted once.
function buildLayer(state) {
  const c = document.createElement('canvas');
  c.width = state.w * PX;
  c.height = state.h * PX;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0d13';
  g.fillRect(0, 0, c.width, c.height);
  for (const z of ZONES) {
    const grad = g.createRadialGradient(z.x * PX, z.y * PX, 0, z.x * PX, z.y * PX, z.r * PX);
    grad.addColorStop(0, z.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.45;
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.globalAlpha = 1;
  g.fillStyle = '#9aa6c4';
  for (const w of state.walls) g.fillRect(w.x * PX, w.y * PX, w.w * PX, w.h * PX);
  return c;
}

// me = the player's dragon (or undefined), head = its interpolated head position, view = visible world rectangle.
export function drawMinimap(ctx, W, H, state, me, head, view) {
  if (layerKey !== `${state.w}x${state.h}`) { layer = buildLayer(state); layerKey = `${state.w}x${state.h}`; }
  const mw = Math.min(240, Math.max(140, W * 0.18)), mh = mw * state.h / state.w;
  const x = W - mw - MARGIN, y = H - mh - MARGIN;
  const mx = (wx) => x + (wx / state.w) * mw, my = (wy) => y + (wy / state.h) * mh;

  ctx.globalAlpha = 0.9;
  ctx.drawImage(layer, x, y, mw, mh);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e8453c';        // same red as the map border
  ctx.strokeRect(x, y, mw, mh);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, mw, mh);
  ctx.clip();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';   // what the camera shows right now
  ctx.strokeRect(mx(view.x), my(view.y), (view.w / state.w) * mw, (view.h / state.h) * mh);
  if (me?.alive) {                             // your head: a triangle pointing the way you fly
    ctx.translate(mx(head.x), my(head.y));
    ctx.rotate(me.angle);
    ctx.fillStyle = me.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
