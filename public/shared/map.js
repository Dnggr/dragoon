// Dragoon map data. Plain data, no logic: the browser draws it, the sim collides with it,
// and the Phase 3 server will import this same file so everyone plays the same map.
// Units are the same as sim.js (1 unit is about one body-block width).
// Layout is mirrored in all four corners so every spawn area is fair.

const W = 200;
const H = 150;

// [x, y, w, h] mirrored across the middle: the rect plus its left/right and top/bottom twins.
const mirror = (x, y, w, h) => [
  [x, y, w, h], [W - x - w, y, w, h], [x, H - y - h, w, h], [W - x - w, H - y - h, w, h],
];
const touches = (a, b, gap) =>
  a[0] - gap < b[0] + b[2] && a[0] + a[2] + gap > b[0] && a[1] - gap < b[1] + b[3] && a[1] + a[3] + gap > b[1];

// Big pieces first (dragon fortress in the middle, corner keeps, ridges that make lanes).
const big = [
  // Fortress ring around the center: 48 x 40, wall 4 thick, a 10-unit gate in the middle of each side.
  ...mirror(76, 55, 19, 4),     // top and bottom walls
  ...mirror(76, 59, 4, 11),     // left and right walls
  ...mirror(85, 64, 3, 3),      // four pillars inside (5 units from the ring)
  // Corner keeps: an L-shaped wall in each corner to hide behind.
  ...mirror(22, 22, 24, 4),
  ...mirror(22, 26, 4, 20),
  // Ridges that split the open ground into lanes.
  ...mirror(58, 34, 30, 4),
  ...mirror(40, 56, 4, 38),
  ...mirror(90, 16, 20, 4),
  ...mirror(16, 65, 4, 20),
];

// Small 3 x 3 pillars on a loose grid, only where they leave 6+ units around every other wall.
const pillars = [];
for (const gx of [20, 40, 60, 80]) {
  for (const gy of [15, 35, 55]) {
    const p = [gx, gy, 3, 3];
    if (!big.some((b) => touches(p, b, 6))) pillars.push(...mirror(...p));
  }
}

const unique = (list) => [...new Map(list.map((r) => [r.join(), r])).values()];
const walls = unique([...big, ...pillars]).map(([x, y, w, h]) => ({ x, y, w, h }));

export const MAP = { w: W, h: H, walls };

// Floor tints (visual only, no collision). Colored pools of light that tell the corners apart,
// because a map this big has no minimap yet.
export const ZONES = [
  { x: 100, y: 75, r: 55, color: '#7a5cff' },
  { x: 30, y: 25, r: 65, color: '#e8453c' },
  { x: 170, y: 25, r: 65, color: '#2fb8ff' },
  { x: 30, y: 125, r: 65, color: '#34d27b' },
  { x: 170, y: 125, r: 65, color: '#ffb02e' },
];

// Dragon-head emblem painted on the floor inside the fortress (visual only).
export const EMBLEM = { x: 100, y: 75, size: 22 };
