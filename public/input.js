// Mouse position (screen pixels). main.js turns it into a steering angle each tick.
// Click attacks and right-click skills arrive in Phases 5 and 6.
export function createInput() {
  const input = { mx: 0, my: 0, moved: false, reset() { input.moved = false; } };
  window.addEventListener('mousemove', (e) => {
    input.mx = e.clientX;
    input.my = e.clientY;
    input.moved = true;
  });
  return input;
}
