// Keyboard -> the dragon's wanted direction. Mouse aim arrives in Phase 5.
const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function createInput(isActive) {
  const input = { dir: 'right', reset() { input.dir = 'right'; } };
  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.code];
    if (!dir || !isActive()) return;
    e.preventDefault(); // stop arrow keys from scrolling the page
    input.dir = dir;
  });
  return input;
}
