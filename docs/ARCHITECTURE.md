# ARCHITECTURE

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).

## Overview
Authoritative game simulation runs in ONE place (the server in multiplayer). Clients send inputs and draw snapshots. Same pure `step()` function is used everywhere so single-player (Phase 1) and multiplayer share logic.

## Stack
- Client: plain HTML + Canvas 2D + ES modules. No framework, no bundler. [PROPOSED, from idea brief]
- Server: Node.js + `ws` package (only dependency). [PROPOSED]
- Hosting: client on Vercel (static). Server host decided by Q2.

## Folder structure
```
dragoon/
  AI_RULES.md
  README.md
  .gitignore
  docs/
    CHECKLIST.md
    ARCHITECTURE.md
    AI_ACTIVITY.md
    sketch.png
  public/            <- deployed to Vercel (Output Directory)
    index.html
    style.css
    config.js        <- server URL
    main.js          <- boot, game loop, wiring
    input.js         <- keyboard -> {dir, fire}
    render.js        <- canvas drawing, glow
    net.js           <- WebSocket client (Phase 3)
  shared/
    sim.js           <- pure step(state, inputs), used by client and server
  server/            <- Phase 3
    server.js        <- ws server, rooms, tick loop
  package.json       <- added in Phase 3 (not before)
```
Note: `shared/` must be reachable by the browser. Phase 1 decides the simplest way (likely place `sim.js` under `public/` and import it from the server by relative path). Resolve then, log it here.

## Responsibilities
- `sim.js`: movement, growth, collisions, pickups, bullets. No DOM, no network, no timers.
- `render.js`: reads state, draws. Never mutates state.
- `input.js`: turns key events into the latest intent.
- `server.js`: owns rooms and state, calls `step()` every tick, broadcasts snapshots.

## State shape (grid, PROPOSED, depends on Q1)
```js
state = {
  tick: 0,
  w: 40, h: 30,                       // grid cells
  walls: [[x, y]],
  dragons: {                          // keyed by player id
    id: { name, color, body: [[x, y]], // head first
          dir: 'up'|'down'|'left'|'right',
          alive: true, shield: 0, ammo: { bullet: 0, bullet2: 0, missile: 0 } }
  },
  pickups: [{ x, y, type }],          // type: 'bullet'|'bullet2'|'shield'|'missile'
  bullets: [{ x, y, dx, dy, owner, kind }]
}
```

## Network protocol (JSON over WebSocket, PROPOSED)
Client -> server:
- `{t:'join', room, name, color}`
- `{t:'input', dir}`
- `{t:'fire', kind}`

Server -> client:
- `{t:'joined', id, room}`
- `{t:'state', ...state}` every tick (~8 to 10 per second)
- `{t:'over', winner}`

No client-side prediction in v1 (ponytail: grid ticks are slow enough; interpolate visuals only if needed).

## Hosting and deploy (researched Nov 2026)
- Vercel Functions now support WebSockets (public beta June 2026, GA Oct 2026), but a connection ends when the function hits its max duration (default 5 min) and connections can land on different instances, so shared room state would need an external store.
- A game tick loop wants one long-lived process holding room state in memory.
- Options for Q2:
  - A) Static client on Vercel + tiny Node `ws` server on an always-on host (Render, Fly.io, Railway). Simplest correct. DEFAULT.
  - B) WebRTC peer-to-peer, one browser is the host. No game server, but needs signaling, host leaving kills the room, and some networks block P2P without a TURN relay.
  - C) Everything on Vercel WebSockets + external pub/sub for room state. Most moving parts.

## Browser-native features used
Canvas 2D, `requestAnimationFrame`, `keydown`/`keyup`, `<input type="color">`, `shadowBlur` (glow), `WebSocket`, `URLSearchParams` (room code in link), `crypto.randomUUID` (player id), `structuredClone`.

## Key decisions
| Decision | Why | Status |
|---|---|---|
| Plain JS + Canvas, no framework | Brief asked for it; game is one canvas | PROPOSED |
| Grid-based, fixed tick | Matches segmented snake sketch, simple deterministic sim | PROPOSED (Q1) |
| Server-authoritative | Prevents cheating, one source of truth | PROPOSED (Q2) |
| Shared pure `step()` | Single-player and server use identical logic | PROPOSED |
| No `package.json` until Phase 3 | Client needs zero dependencies | PROPOSED |

## Open questions
See `docs/AI_ACTIVITY.md` (Q1 to Q5).
