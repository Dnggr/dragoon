// Keyboard (WASD or arrows) -> the direction the dragon should turn toward.
// Mouse aim and clicks arrive in Phases 5 and 6.
const KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(isActive) {
  const held = new Set();
  const input = {
    reset() { held.clear(); },
    // Screen-space angle in radians (W = up, D = right, diagonals by combining keys).
    // undefined when no direction is held, so the dragon keeps its heading.
    angle() {
      const dx = Number(held.has('right')) - Number(held.has('left'));
      const dy = Number(held.has('down')) - Number(held.has('up'));
      return dx || dy ? Math.atan2(dy, dx) : undefined;
    },
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
  window.addEventListener('blur', () => held.clear());   // no stuck keys when the tab loses focus
  return input;
}
