# CHECKLIST

Legend: `[x]` done, `[ ]` todo. Do not start a phase without the user saying "go".

## Phases

### Phase 0: Plan (done)
- [x] `.gitignore`, `README.md`, `AI_RULES.md`
- [x] `docs/CHECKLIST.md`, `docs/ARCHITECTURE.md`, `docs/AI_ACTIVITY.md`, `docs/GAME_DESIGN.md`
- [x] Sketch saved to `docs/sketch.png`
- [x] Q1 to Q5 answered; QA = cut the body, QB = yes but long battles
- [x] Design extended: mouse aim + camera, left click attack, right click skills, perks/cards
- [x] User said "go" (QC to QF accepted as defaults)
Done when: the user says "go".

### Phase 1: Single-player dragon + screens, no network (current, built, awaiting playtest)
- [x] `public/index.html`: three `<section>` screens (menu, settings, game), `hidden` attribute, no router
- [x] Main menu: title, Practice (solo), Create Room / Join Room (disabled until Phase 3), Settings
- [x] Settings: name, color (`<input type="color">`), glow on/off, saved in `localStorage`. No login.
- [x] `public/shared/sim.js`: pure `step(state, inputs)`, 20 ticks/s, dragon moves 1 cell per 3 ticks
- [x] World larger than the screen; camera follows the head; smooth render between ticks
- [x] Keyboard turning (arrows/WASD), no 180-degree reversal
- [x] Body follows head; grows when collecting a pickup
- [x] Every part has HP (constants in `sim.js`)
- [x] Death on wall/body hit; all segments scatter as pickups tinted with the dragon's color
- [x] Practice mode spawns pickups so growth and scatter can be tested
- [ ] User playtest in a real browser confirms it works and feels right (not yet seen in a real browser, see AI_ACTIVITY)
Done when: menu, settings, solo play, death and scatter work locally.

### PENDING: Slither-style rework of Phase 1 (only if the user says "go")
- [ ] `sim.js`: float positions, heading angle, turn rate toward target angle, chain-follow body, circle collisions, no self-collision
- [ ] `input.js`: mouse position -> target angle (keys removed)
- [ ] `render.js`: draw circles, camera follows head, no cell interpolation
- [ ] Pickups: orbs collected within a radius of the head; scatter along the body on death
- [ ] Update GAME_DESIGN.md and ARCHITECTURE.md (grid sections replaced), re-run tests
Done when: Practice feels like slither.io: mouse steers, smooth body, orbs, border/wall death.

### Phase 2: Deploy static client to Vercel
- [ ] Push to GitHub, import in Vercel (Framework: Other, Output Directory `public`)
Done when: the public URL runs Phase 1.

### Phase 3: Multiplayer (hosting A: separate Node `ws` server)
- [ ] `server/server.js` with `ws`: rooms by code, join/leave, 20 Hz tick loop
- [ ] Menu: Create Room (6-char code + shareable link), Join Room
- [ ] Lobby: player list, host starts the match
- [ ] Server sends snapshots; client interpolates and renders them
- [ ] Deploy the server (Render/Fly/Railway), URL in `public/config.js`
Done when: two browsers on different devices play in the same room.

### Phase 4: Map and walls
- [ ] Wall layout in shared state; walls block movement and bullets
- [ ] Draw walls
Done when: dragons and bullets collide with walls.

### Phase 5: Aim + basic attack + stat pickups (test with two browser tabs)
- [ ] Mouse aim (crosshair), cursor to world angle, sent with input
- [ ] Left click hold = basic attack; bullets as float positions, cell lookup per tick
- [ ] Damage segments; cut rule (rear scatters); head HP 0 = death
- [ ] Pickups: Gun (barrels, fan), Rapid; glow rendering respects the setting
- [ ] Shield pickup: auto-deploy, shield HP absorbs first
Done when: a 1v1 with base kit lasts about 40 s and feels fair.

### Phase 6: Right-click skills
- [ ] Skill slot + cooldown + wheel/Q cycle, `contextmenu` blocked
- [ ] Homing Missile (+ Missile pickup adds missiles per cast)
- [ ] Fire Breath + Burn, Wing Boost
Done when: all three skills work in a match and cooldowns show in the HUD.

### Phase 7: Perks and cards
- [ ] Card offers at pickup milestones, press 1/2/3
- [ ] Perks from GAME_DESIGN.md; Frost Roar + Slow if time allows
- [ ] Playtest the 4 example builds, tune numbers
Done when: at least 3 distinct builds are viable.

### Phase 8: Match flow
- [ ] Win condition: last dragon alive; game over screen; rematch; back to menu
- [ ] "More fun" twists the user wants (brainstorm first)
Done when: a full match can be played start to finish.

## Bugs
| ID | Description | Status |
|---|---|---|
| (none yet) | | |

## Dev suggestions (parked, NOT approved, do not build)
- Optional accounts/login + saved stats
- "Hide in cover" wall tiles that hide dragons
- Guns mounted on segments (lose a segment = lose its gun)
- Spectator mode for dead players
- Touch controls for phones
- Sound effects via Web Audio + mute setting
- Rebindable keys in Settings
- Bots / training dummy for solo combat testing
- Auto-reconnect to the same room
- Client-side prediction / lag compensation
- Map editor / multiple maps
- Fun twists to brainstorm for Phase 8 (arena shrinking, chain-reaction missiles)
