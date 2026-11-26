// Boot, screen switching and the practice game loop.
import { createState, addDragon, spawnPickup, step, scaleOf, damageMult, TICK_MS } from './shared/sim.js';
import { loadSettings, saveSettings } from './settings.js';
import { createInput } from './input.js';
import { draw, resize } from './render.js';

const ME = 'me';
const PRACTICE_ORBS = 30;
const PRACTICE_SHARDS = 120;
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
  state = createState();
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

function tick() {
  const shards = state.pickups.filter((p) => p.type === 'frag').length;
  for (let i = PRACTICE_SHARDS - shards; i > 0; i--) spawnPickup(state, 'frag');
  for (let i = PRACTICE_ORBS - (state.pickups.length - shards); i > 0; i--) spawnPickup(state);
  step(state, { [ME]: { angle: input.angle() } });
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
  draw(ctx, canvas, state, ME, acc / TICK_MS, settings.glow);
  const me = state.dragons[ME];
  $('hud').textContent = me.alive
    ? `HP ${me.body[0].hp}/${me.body[0].max}   Level ${me.level}   Shards ${me.frags}\nDamage x${damageMult(me).toFixed(2)}   Size x${scaleOf(me).toFixed(2)}   Length ${me.body.length}`
    : 'Dead';
  raf = requestAnimationFrame(frame);
}

$('btn-practice').addEventListener('click', startPractice);
$('btn-respawn').addEventListener('click', spawnMe);
$('btn-menu').addEventListener('click', leave);
$('btn-leave').addEventListener('click', leave);
window.addEventListener('resize', () => resize(canvas));
