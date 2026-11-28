// Boot, screen switching and the practice game loop.
import { createState, addDragon, spawnPickup, step, scaleOf, damageMult, MAX_GUNS, TICK_MS } from './shared/sim.js';
import { MAP } from './shared/map.js';
import { loadSettings, saveSettings } from './settings.js';
import { createInput } from './input.js';
import { draw, resize, toWorld } from './render.js';

const ME = 'me';
// Same pickup density as the old 80 x 60 map (30 orbs and 120 shards there), scaled to the map area.
const PRACTICE_ORBS = Math.round(MAP.w * MAP.h / 160);
const PRACTICE_SHARDS = Math.round(MAP.w * MAP.h / 40);
const $ = (id) => document.getElementById(id);
const screens = { menu: $('menu'), settings: $('settings'), game: $('game') };
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const settings = loadSettings();
const input = createInput(() => !screens.game.hidden);

let state, dead, last, acc, raf;

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

// ---- settings screen ----
function openSettings() {
  $('set-name').value = settings.name;
  $('set-color').value = settings.color;
  $('set-glow').checked = settings.glow;
  show('settings');
}
$('set-name').addEventListener('input', (e) => {
  settings.name = e.target.value.trim().slice(0, 12) || 'Player';
  saveSettings(settings);
});
$('set-color').addEventListener('input', (e) => { settings.color = e.target.value; saveSettings(settings); });
$('set-glow').addEventListener('change', (e) => { settings.glow = e.target.checked; saveSettings(settings); });
$('btn-settings').addEventListener('click', openSettings);
$('btn-back').addEventListener('click', () => show('menu'));

// ---- practice game ----
function spawnMe() {
  addDragon(state, ME, settings.name, settings.color);
  input.reset();                 // go straight until a key is pressed
  dead = false;
  $('dead').hidden = true;
}

function startPractice() {
  state = createState(MAP.w, MAP.h, MAP.walls);
  show('game');
  resize(canvas);
  spawnMe();
  last = performance.now();
  acc = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

function leave() {
  input.reset();
  cancelAnimationFrame(raf);
  show('menu');
}

// World angle from your head to the cursor. undefined (keep the last aim) until the mouse has moved,
// or while the cursor sits on the head, where the angle is meaningless.
function aimAngle(me) {
  const m = input.mouse();
  if (!m) return undefined;
  const w = toWorld(m.x, m.y), head = me.body[0];
  return Math.hypot(w.x - head.x, w.y - head.y) < 0.2 ? undefined : Math.atan2(w.y - head.y, w.x - head.x);
}

function tick() {
  const shards = state.pickups.filter((p) => p.type === 'frag').length;
  for (let i = PRACTICE_SHARDS - shards; i > 0; i--) spawnPickup(state, 'frag');
  for (let i = PRACTICE_ORBS - (state.pickups.length - shards); i > 0; i--) spawnPickup(state);
  step(state, { [ME]: { angle: input.angle(), aim: aimAngle(state.dragons[ME]), fire: input.firing() } });
  if (!state.dragons[ME].alive) {
    dead = true;
    $('dead').hidden = false;
  }
}

function frame(now) {
  acc += Math.min(now - last, 250);   // cap so a background tab does not fast-forward
  last = now;
  while (acc >= TICK_MS && !dead) { tick(); acc -= TICK_MS; }
  if (dead) acc = 0;
  draw(ctx, canvas, state, ME, acc / TICK_MS, settings.glow, input.mouse());
  const me = state.dragons[ME];
  $('hud').textContent = me.alive
    ? `HP ${me.body[0].hp}/${me.body[0].max}   Level ${me.level}   Shards ${me.frags}\nDamage x${damageMult(me).toFixed(2)}   Size x${scaleOf(me).toFixed(2)}   Length ${me.body.length}\nGuns ${me.guns}/${MAX_GUNS}   Fire rate +${me.rapid * 10}%`
    : 'Dead';
  raf = requestAnimationFrame(frame);
}

$('btn-practice').addEventListener('click', startPractice);
$('btn-respawn').addEventListener('click', spawnMe);
$('btn-menu').addEventListener('click', leave);
$('btn-leave').addEventListener('click', leave);
window.addEventListener('resize', () => resize(canvas));
