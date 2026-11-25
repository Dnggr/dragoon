# CHECKLIST

Legend: `[x]` done, `[ ]` todo. Phase order is PROPOSED until the user says "go".
Phases marked (depends on Q#) can change based on the answers in `AI_ACTIVITY.md` open questions.

## Phases

### Phase 0: Plan (current)
- [x] `.gitignore`
- [x] `README.md`
- [x] `AI_RULES.md`
- [x] `docs/CHECKLIST.md`, `docs/ARCHITECTURE.md`, `docs/AI_ACTIVITY.md`
- [x] Sketch saved to `docs/sketch.png`
- [ ] User answers open questions Q1 to Q5
- [ ] User says "go"
Done when: all boxes ticked and ARCHITECTURE.md statuses say CONFIRMED.

### Phase 1: Single-player dragon, no network (depends on Q1)
- [ ] `public/index.html` + canvas + `public/style.css`
- [ ] `shared/sim.js`: pure `step(state, inputs)` on a grid
- [ ] Keyboard turning, no 180-degree reversal
- [ ] Body follows head, grows when eating
- [ ] Color picker via `<input type="color">`, body tinted
- [ ] Death on wall edge / self hit
Done when: I can play alone in a browser tab, locally.

### Phase 2: Deploy static client to Vercel
- [ ] Push to GitHub, import in Vercel (Other, Output Directory `public`)
Done when: the public URL runs Phase 1.

### Phase 3: Multiplayer (depends on Q2)
- [ ] `server/server.js` with `ws`: rooms by code, join/leave, tick loop
- [ ] Client lobby: name, color, room code
- [ ] Server sends snapshots; client renders them
- [ ] Deploy the server (host per Q2)
Done when: two browsers on different devices see each other move.

### Phase 4: Map and walls (depends on Q5)
- [ ] Wall layout in shared state
- [ ] Wall collision behavior per Q5
- [ ] Draw walls
Done when: dragons collide with / hide behind walls as decided.

### Phase 5: Pickups and weapons (depends on Q3, Q4)
- [ ] Pickup spawning per Q3
- [ ] 4 types: bullet, bullet (variant), shield, missile
- [ ] Glow rendering (`shadowBlur`)
- [ ] Fire key, bullets/missiles travel and hit
Done when: all 4 pickups can be collected and used in a match.

### Phase 6: Match flow
- [ ] Win condition, game over screen, rematch
Done when: a full match can be played start to finish.

## Bugs
| ID | Description | Status |
|---|---|---|
| (none yet) | | |

## Dev suggestions (parked, NOT approved, do not build)
- Spectator mode for dead players
- Touch controls for phones
- Sound effects via Web Audio
- Bots to fill empty slots
- Auto-reconnect to the same room
- Client-side prediction / lag compensation
- Map editor / multiple maps
