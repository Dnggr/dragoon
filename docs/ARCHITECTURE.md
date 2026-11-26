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
    main.js               <- boot, screen switching, game loop, mouse -> steering angle
    settings.js           <- localStorage (name, color, glow)
    input.js              <- mouse position (clicks in Phases 5/6)
    render.js             <- canvas, camera, interpolation, glow, toWorld()
    net.js                <- WebSocket client (Phase 3)
    shared/
      sim.js              <- pure step(state, inputs), constants at top
  server/                 <- Phase 3
    server.js             <- ws server, rooms, tick loop (imports ../public/shared/sim.js)
  package.json            <- added in Phase 3, not before
```

## Responsibilities
- `sim.js` (Phase 1 exports: createState, addDragon, spawnPickup, step, constants): movement, chain body, collisions, pickups, scatter. Later: HP/damage/cut, bullets, skills, cooldowns, status effects, card offers. No DOM, no network, no timers.
- `render.js`: reads snapshots, draws, camera follows own head, slides segments between ticks, converts mouse pixels to world coordinates. Never mutates state.
- `input.js`: mouse position. `main.js` converts it to an angle each tick.
- `settings.js`: `localStorage` with defaults.
- `server.js`: owns rooms and state, calls `step()` every tick, broadcasts snapshots.

## Simulation model (CONFIRMED: slither-style; numbers PROPOSED)
- Fixed tick, 20/s. Positions are floats in world units. Dragons always move forward at SPEED; the head turns toward `target` at a limited turn rate (shorter = faster).
- Body is a chain of circles: each segment is pulled toward the one in front, never farther than SPACING. No path history needed. A new segment appears at the tail.
- Collision: circle distance checks, O(dragons x segments) per tick, fine for 2 to 4 players. Head vs another dragon's segment < KILL_DIST = death; head vs wall rect or border = death. No self-collision.
- Death of several dragons in one tick is decided before any scatter, so head-on hits kill both.
- Rendering: each segment keeps `px,py` (position one tick ago); the client draws `p + (cur - p) * alpha`. In multiplayer the client will interpolate between snapshots instead (Phase 3).
- World 80x60 units; camera shows 32 units across and follows the head, clamped to the map.
- Mouse steering: client converts cursor pixels to a world point (`toWorld`), then to an angle from the head. Dead zone 0.4 units.

## State shape (CONFIRMED structure, PROPOSED numbers)
```js
state = {
  tick: 0, w: 80, h: 60,
  walls: [{ x, y, w, h }],
  dragons: {                               // keyed by player id
    id: { name, color, alive,
          angle, target,                   // radians: current heading, wanted heading
          body: [{ x, y, px, py, hp }],    // body[0] is the head; px/py = one tick ago
          guns: 1, rapid: 0, shield: 0,    // Phase 5+
          skills: ['missile'], sel: 0, cd: { missile: 0 },   // Phase 6+
          perks: {}, status: { burn: 0, slow: 0 },           // Phase 7+
          pickups: 0, cardAt: 6, offer: null }
  },
  pickups: [{ x, y, type, color }],        // 'gun'|'rapid'|'shield'|'missile'
  bullets: [{ x, y, vx, vy, owner, kind, ttl, target }]      // Phase 5+
}
```
Phase 1 dragons only have name, color, alive, angle, target, body.

## Network protocol (JSON over WebSocket, PROPOSED)
Client -> server:
- `{t:'join', room, name, color}`
- `{t:'input', angle, fire}` about 20/s (angle = world-space radians toward the cursor)
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
Canvas 2D, `requestAnimationFrame`, `mousemove`/`mousedown`/`mouseup`/`wheel`/`contextmenu`, `<input type="color">`, `localStorage`, `hidden` attribute, `shadowBlur` (glow), `WebSocket`, `URLSearchParams`, `crypto.randomUUID`, `structuredClone`.

## Key decisions
| Decision | Why | Status |
|---|---|---|
| Plain JS + Canvas, no framework | Game is one canvas | CONFIRMED |
| Slither-style free movement, mouse steering (replaced the grid) | User request, fits aiming and scatter | CONFIRMED |
| No self-collision | Tight turns would constantly kill you | CONFIRMED |
| No free boost, Wing Boost is a skill | Avoid scope; right click is for skills | CONFIRMED |
| Rectangular map with rect walls (from sketch) | User sketch | CONFIRMED |
| Server-authoritative, separate host (A) | One source of truth, long-lived tick loop | CONFIRMED |
| No login, guests + localStorage | Nothing worth saving yet | CONFIRMED |
| Cut-the-body rule, HP on every part | User request | CONFIRMED |
| Mouse aim + left/right click, desktop only | User request | CONFIRMED (details PROPOSED) |
| Perks and skills as cards, built last | Core combat must be fun first | PROPOSED |
| Shared pure `step()` | Solo and server use identical logic | PROPOSED |
| No `package.json` until Phase 3 | Client has zero dependencies | PROPOSED |
