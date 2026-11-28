# ARCHITECTURE

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).
Gameplay rules and numbers: see `docs/GAME_DESIGN.md`.

## Overview
One authoritative simulation. Solo practice runs it in the browser; multiplayer (Phase 3) runs it on a Node `ws` server. Clients send inputs and draw snapshots. The same pure `step()` is used in both.

## Stack
- Client: plain HTML + Canvas 2D + ES modules. No framework, no bundler. CONFIRMED
- Server: Node.js + `ws` (only dependency), separate always-on host near the players. CONFIRMED (hosting A)
- Client hosting: Vercel static, Output Directory `public`. CONFIRMED

## No login, no save game (CONFIRMED)
Players are guests. Name, color and settings live in `localStorage`. They join a room with a code. Nothing is stored server-side.

## Screens (single page, no router)
Three `<section>` elements in `index.html`, switched by `main.js` with the `hidden` attribute.
- `#menu`: title, Practice, Create Room, Join Room (code input), Settings
- `#settings`: name, color picker, glow on/off, Back
- `#game`: canvas + HUD (Phase 1: head HP + length; later shield, barrels, skill + cooldown), Leave, and a small `#dead` panel with Respawn / Menu
Later: `#lobby` (Phase 3), `#over` (Phase 8).

## Folder structure
```
dragoon/
  AI_RULES.md  README.md  .gitignore
  docs/
    CHECKLIST.md  ARCHITECTURE.md  AI_ACTIVITY.md  GAME_DESIGN.md  sketch.png
  public/                 <- deployed to Vercel
    index.html  style.css  config.js (Phase 3)
    assets/               <- icons/*.svg (game-icons.net, CC BY 3.0) + CREDITS.md
    main.js               <- boot, screen switching, game loop, HUD
    settings.js           <- localStorage (name, color, glow)
    input.js              <- WASD/arrows -> steering angle (mouse aim + clicks in Phases 5/6)
    render.js             <- canvas, square dragons, camera + zoom, interpolation, glow
    net.js                <- WebSocket client (Phase 3)
    shared/
      sim.js              <- pure step(state, inputs), constants at top
      map.js              <- map data: size, wall rects, floor zones, emblem (no logic)
  server/                 <- Phase 3
    server.js             <- ws server, rooms, tick loop (imports ../public/shared/sim.js)
  package.json            <- added in Phase 3, not before
```

## Responsibilities
- `sim.js` (Phase 1 exports: createState, addDragon, spawnPickup, step, constants): movement, chain body, collisions, orbs, shards (xp, levels, size), scatter. Later: HP/damage/cut, bullets, skills, cooldowns, status effects, card offers. No DOM, no network, no timers.
- `render.js`: reads snapshots, draws dragons as rotated squares, camera follows own head and zooms out with size, slides blocks between ticks. Never mutates state.
- `input.js`: held WASD/arrow keys -> one steering angle (undefined = no key). `main.js` passes it to `step()` each tick.
- `settings.js`: `localStorage` with defaults.
- `server.js`: owns rooms and state, calls `step()` every tick, broadcasts snapshots.

## Simulation model (CONFIRMED: slither-style; numbers PROPOSED)
- Fixed tick, 20/s. Positions are floats in world units. Dragons always move forward at SPEED; the head turns toward `target` at a limited turn rate (shorter = faster).
- Body is a chain of circles: each segment is pulled toward the one in front, never farther than SPACING. No path history needed. A new segment appears at the tail.
- Collision: circle distance checks (radii scale with dragon size), O(dragons x blocks) per tick, fine for 2 to 4 players. Head vs another dragon's block < 0.82 x sum of radii = death; head vs wall rect or border = death. No self-collision.
- Look: dragons, orbs and shards are drawn as squares (rotated along the chain), as in the sketch. Collision stays circles because they are simpler and fair.
- Shards: `d.frags` counts eaten shards; `level = floor(frags/10)`; `scaleOf(d) = 1 + 0.01 * frags` (capped at 100). Level-up raises every block's max HP and heals by the gain.
- Death of several dragons in one tick is decided before any scatter, so head-on hits kill both.
- Rendering: each segment keeps `px,py` (position one tick ago); the client draws `p + (cur - p) * alpha`. In multiplayer the client will interpolate between snapshots instead (Phase 3).
- World 200x150 units (`shared/map.js`; `createState(w, h, walls)` defaults to 80x60 with no walls). Camera shows 32 units across and follows the head, clamped to the map.
- Depth rendering (`render.js`): the floor (cloud blotches + `ZONES` color pools) is painted once into an offscreen canvas at 4 px/unit and only the visible part is drawn; walls draw all shadows first, then block + front lip; orbs and dragons get offset drop shadows; embers are drawn in screen space with a parallax factor above 1; icons are rasterized once from SVG into small canvases and fall back to the letter if they fail to load. Collision is unchanged: the wall rectangle is exactly the lit top face.
- Steering: WASD/arrows -> screen-space angle (y points down) -> `target`. Mouse is reserved for aiming in Phase 5.

## State shape (CONFIRMED structure, PROPOSED numbers)
```js
state = {
  tick: 0, w: 80, h: 60,
  walls: [{ x, y, w, h }],
  dragons: {                               // keyed by player id
    id: { name, color, alive,
          angle, target,                   // radians: current heading, wanted heading
          frags: 0, level: 0,              // shards eaten, level (10 shards each)
          body: [{ x, y, px, py, hp, max }], // body[0] is the head; px/py = one tick ago
          guns: 1, rapid: 0, shield: 0,    // Phase 5+
          skills: ['missile'], sel: 0, cd: { missile: 0 },   // Phase 6+
          perks: {}, status: { burn: 0, slow: 0 },           // Phase 7+
          pickups: 0, cardAt: 6, offer: null }
  },
  pickups: [{ x, y, type, color }],        // 'gun'|'rapid'|'shield'|'missile'
  bullets: [{ x, y, vx, vy, owner, kind, ttl, target }]      // Phase 5+
}
```
Phase 1 dragons have name, color, alive, angle, target, frags, level, body. Pickup type `'frag'` is a shard; the other four types are orbs.

## Network protocol (JSON over WebSocket, PROPOSED)
Client -> server:
- `{t:'join', room, name, color}`
- `{t:'input', angle, aim, fire}` about 20/s (angle = steering from WASD, aim = world-space radians toward the cursor, Phase 5)
- `{t:'cast'}` right click, `{t:'select', i}` wheel/Q, `{t:'card', i}` pick card
Server -> client:
- `{t:'joined', id, room}`
- `{t:'state', ...state}` every tick
- `{t:'over', winner}`
Snapshots carry every segment, so they are bigger than a grid game would need. In Phase 3: round numbers to 2 decimals, cap dragon length, measure bytes per snapshot, and only then decide if a lighter format is needed.
No client-side prediction in v1 (ponytail). Interpolation only. Input is applied at the server's next tick, so expect one round trip of delay; pick a server region close to the players.

## Hosting and deploy (researched Nov 2026)
Vercel Functions support WebSockets (GA Oct 2026), but a connection ends at the function max duration (default 5 min) and connections can land on different instances. A tick loop needs one long-lived process holding room state, so the server runs on an always-on host (Render, Fly.io or Railway). Vercel serves only the static client.

## Browser-native features used
Canvas 2D (`translate`/`rotate` for squares), `requestAnimationFrame`, `keydown`/`keyup`/`blur`, later `mousemove`/`mousedown`/`mouseup`/`wheel`/`contextmenu`, `<input type="color">`, `localStorage`, `hidden` attribute, `shadowBlur` (glow), `WebSocket`, `URLSearchParams`, `crypto.randomUUID`, `structuredClone`.

## Key decisions
| Decision | Why | Status |
|---|---|---|
| Plain JS + Canvas, no framework | Game is one canvas | CONFIRMED |
| Slither-style free movement and camera only, steered with WASD (replaced the grid and mouse steering) | User request; keeps the mouse free for aiming | CONFIRMED |
| Square dragons, not circles | Sketch; only camera and movement are copied from slither | CONFIRMED |
| Shards = XP (level, HP, damage, size) | User request | CONFIRMED (numbers PROPOSED) |
| No self-collision | Tight turns would constantly kill you | CONFIRMED |
| No free boost, Wing Boost is a skill | Avoid scope; right click is for skills | CONFIRMED |
| Rectangular map with rect walls (from sketch), 200x150, 4-way symmetric | User sketch; user asked for a big map | CONFIRMED (layout PROPOSED) |
| Map data in `shared/map.js`, visuals (zones, emblem) beside it | Server will import the same file in Phase 3 | PROPOSED |
| Spawn needs 15 units of open ground ahead | Walls made instant deaths possible | PROPOSED |
| Server-authoritative, separate host (A) | One source of truth, long-lived tick loop | CONFIRMED |
| No login, guests + localStorage | Nothing worth saving yet | CONFIRMED |
| Cut-the-body rule, HP on every part | User request | CONFIRMED |
| Mouse aim + left/right click, desktop only | User request | CONFIRMED (details PROPOSED) |
| Perks and skills as cards, built last | Core combat must be fun first | PROPOSED |
| Shared pure `step()` | Solo and server use identical logic | PROPOSED |
| No `package.json` until Phase 3 | Client has zero dependencies | PROPOSED |
