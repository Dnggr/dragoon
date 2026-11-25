# ARCHITECTURE

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).
Gameplay rules and numbers: see `docs/GAME_DESIGN.md`.

## PENDING DECISION: slither.io-style movement (user suggestion, not yet approved)
If approved, this REPLACES the grid decision. Until the user says "go", everything below stays grid-based.
- Free continuous movement: the head always moves forward and turns toward the mouse cursor at a limited turn rate (slower when longer). Left click attack fires toward the cursor.
- Body = chain of circles; each follows the one in front at a fixed spacing (no grid, no path history). Every circle keeps its HP; the cut rule still applies.
- Kill rules: head touching another dragon's body, a wall, or the map border = death. No self-collision (slither rule).
- Collision = circle distance checks (small forgiving radius), bullets are circles too. No grid, no turn queue, no cell interpolation.
- Sim tick stays 20/s (tune to 30 if it feels choppy); client interpolates snapshots.
- Network note: snapshots carry every segment position, bigger than the grid version. Quantize numbers, cap length, and measure in Phase 3.
- Reused as-is: menu, settings, screens, game loop, scatter-as-pickups idea. Rewritten: `sim.js`, `render.js`, `input.js` (mouse instead of keys).

## Overview
One authoritative simulation. Solo practice (Phase 1) runs it in the browser; multiplayer (Phase 3) runs it on a Node `ws` server. Clients send inputs and draw snapshots. The same pure `step()` is used in both.

## Stack
- Client: plain HTML + Canvas 2D + ES modules. No framework, no bundler. CONFIRMED
- Server: Node.js + `ws` (only dependency), separate always-on host. CONFIRMED (hosting A)
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
    index.html  style.css  config.js
    main.js               <- boot, screen switching, game loop
    settings.js           <- localStorage (name, color, glow)
    input.js              <- keyboard + mouse -> intent
    render.js             <- canvas, camera, interpolation, glow
    net.js                <- WebSocket client (Phase 3)
    shared/
      sim.js              <- pure step(state, inputs), constants at top
  server/                 <- Phase 3
    server.js             <- ws server, rooms, tick loop (imports ../public/shared/sim.js)
  package.json            <- added in Phase 3, not before
```

## Responsibilities
- `sim.js` (built in Phase 1: createState, addDragon, spawnPickup, step, scatter): movement, growth, collisions, HP/damage/cut, scatter, pickups, bullets, skills, cooldowns, status effects, card offers. No DOM, no network, no timers.
- `render.js`: reads snapshots, draws; camera follows own head; lerps dragons between grid cells; never mutates state.
- `input.js`: keys + mouse -> `{dir, aim, fire, cast, select}`.
- `settings.js`: `localStorage` with defaults.
- `server.js`: owns rooms and state, calls `step()` every tick, broadcasts snapshots.

## Simulation model (PROPOSED)
- Fixed tick, 20/s. Dragons move one cell every 3 ticks (grid). Bullets and missiles use float positions but move less than 1 cell per tick, so one cell lookup per tick is enough (no tunneling, no geometry library).
- World bigger than the screen (about 80x60 cells); viewport about 32x20 cells centered on the head.
- Mouse aim: client converts cursor to a world angle relative to its head and sends the angle.
- Because dragons move in grid steps but the screen updates at 60 fps, rendering interpolation is required from Phase 1.

## State shape (CONFIRMED structure, PROPOSED numbers)
```js
state = {
  tick: 0, w: 80, h: 60,
  walls: [[x, y]],
  dragons: {                               // keyed by player id
    id: { name, color, alive,
          body: [{ x, y, px, py, hp }],    // body[0] is the head; px/py = previous cell (render interpolation)
          dir: 'up'|'down'|'left'|'right',   // last moved
          nextDir: 'up'|'down'|'left'|'right', // queued turn, applied on the next move
          aim: 0,                          // radians
          guns: 1, rapid: 0,               // barrels, fire-rate stacks
          shield: 0,                       // shield HP
          skills: ['missile'], sel: 0,     // equipped right-click skills
          cd: { missile: 0 },              // ticks left per skill
          perks: { burning: 1 },           // perk -> stacks
          status: { burn: 0, slow: 0 },    // ticks left
          pickups: 0, cardAt: 6, offer: null }
  },
  pickups: [{ x, y, type, color }],        // 'gun'|'rapid'|'shield'|'missile'
  bullets: [{ x, y, vx, vy, owner, kind, ttl, target }]   // kind: 'bullet'|'missile'
}
```

## Network protocol (JSON over WebSocket, PROPOSED)
Client -> server:
- `{t:'join', room, name, color}`
- `{t:'input', dir, aim, fire}` about 20/s
- `{t:'cast'}` right click, `{t:'select', i}` wheel/Q, `{t:'card', i}` pick card
Server -> client:
- `{t:'joined', id, room}`
- `{t:'state', ...state}` every tick
- `{t:'over', winner}`
No client-side prediction in v1 (ponytail). Interpolation only. Aim and fire are applied at the server's next tick, so expect one round trip of delay.

## Hosting and deploy (researched Nov 2026)
Vercel Functions support WebSockets (GA Oct 2026), but a connection ends at the function max duration (default 5 min) and connections can land on different instances. A tick loop needs one long-lived process holding room state, so the server runs on an always-on host (Render, Fly.io or Railway). Vercel serves only the static client.

## Browser-native features used
Canvas 2D, `requestAnimationFrame`, `keydown`/`keyup`, `mousemove`/`mousedown`/`mouseup`/`wheel`/`contextmenu`, `<input type="color">`, `localStorage`, `hidden` attribute, `shadowBlur` (glow), `WebSocket`, `URLSearchParams`, `crypto.randomUUID`, `structuredClone`.

## Key decisions
| Decision | Why | Status |
|---|---|---|
| Plain JS + Canvas, no framework | Game is one canvas | CONFIRMED |
| Grid movement, fixed tick | Matches segmented sketch, deterministic | CONFIRMED |
| Server-authoritative, separate host (A) | One source of truth, long-lived tick loop | CONFIRMED |
| No login, guests + localStorage | Nothing worth saving yet | CONFIRMED |
| Cut-the-body rule, HP on every part | User request | CONFIRMED |
| Mouse aim + left/right click, desktop only | User request | CONFIRMED (details PROPOSED) |
| Free-aim bullets on a grid world | Bullets under 1 cell/tick, cell lookup only | PROPOSED |
| Perks and skills as cards, built last | Core combat must be fun first | PROPOSED |
| Shared pure `step()` | Solo and server use identical logic | PROPOSED |
| No `package.json` until Phase 3 | Client has zero dependencies | PROPOSED |
