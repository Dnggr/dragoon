// Keyboard (WASD or arrows) -> the direction the dragon should turn toward.
// Mouse -> cursor position (for aim and camera pan) and the held left button (fire).
// Right click, wheel and cards arrive in Phases 6 and 7.
const KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(isActive) {
  const held = new Set();
  let mouse = null;                   // { x, y } in CSS pixels (the canvas fills the window), null until the mouse moves
  let firing = false;
  const input = {
    reset() { held.clear(); firing = false; },
    // Screen-space angle in radians (W = up, D = right, diagonals by combining keys).
    // undefined when no direction is held, so the dragon keeps its heading.
    angle() {
      const dx = Number(held.has('right')) - Number(held.has('left'));
      const dy = Number(held.has('down')) - Number(held.has('up'));
      return dx || dy ? Math.atan2(dy, dx) : undefined;
    },
    mouse() { return mouse; },
    firing() { return firing; },
  };
  window.addEventListener('keydown', (e) => {
    const key = KEYS[e.code];
    if (!key || !isActive()) return;
    e.preventDefault();               // stop arrow keys from scrolling the page
    held.add(key);
  });
  window.addEventListener('keyup', (e) => {
    const key = KEYS[e.code];
    if (key) held.delete(key);
  });
  window.addEventListener('mousemove', (e) => { mouse = { x: e.clientX, y: e.clientY }; });
  // Only a press on the canvas fires, so the Leave / Respawn / Menu buttons never shoot.
  window.addEventListener('mousedown', (e) => { if (e.button === 0 && isActive() && e.target.id === 'canvas') firing = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) firing = false; });
  window.addEventListener('blur', () => { held.clear(); firing = false; });   // no stuck keys or stuck trigger when the tab loses focus
  return input;
}
