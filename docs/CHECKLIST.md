# CHECKLIST

Legend: `[x]` done, `[ ]` todo. Do not start a phase without the user saying "go".

## Phases

### Phase 0: Plan (done)
- [x] `.gitignore`, `README.md`, `AI_RULES.md`, all docs, sketch saved
- [x] Q1 to Q5, QA to QF answered; user said "go"
- [x] Slither-style pivot approved (QG to QJ accepted as defaults)

### Phase 1: Single-player dragon + screens, no network (current, built, awaiting playtest)
- [x] `public/index.html`: three `<section>` screens (menu, settings, game), `hidden` attribute, no router
- [x] Main menu: title, Practice (solo), Create Room / Join Room (disabled until Phase 3), Settings
- [x] Settings: name, color (`<input type="color">`), glow on/off, saved in `localStorage`. No login.
- [x] `public/shared/sim.js`: pure `step(state, inputs)`, 20 ticks/s, free movement, chain body
- [x] Mouse steering with limited turn rate (slower when longer), dead zone
- [x] World 80x60, camera follows the head, smooth interpolation between ticks
- [x] Pickup collection grows the dragon by 1 segment at the tail
- [x] Every part has HP (constants in `sim.js`), not damaged yet
- [x] Death on border/wall/other dragon's body; no self-collision
- [x] On death all segments scatter as colored pickups (dragon's color)
- [x] Practice mode keeps 60 pickups on the map
- [x] Respawn / Menu panel after death
- [ ] User playtest in a real browser confirms it works and feels right (never seen in a real browser yet, see AI_ACTIVITY)
Done when: menu, settings, solo play, death and scatter work locally and feel like slither.io.

### Phase 2: Deploy static client to Vercel
- [ ] Push to GitHub, import in Vercel (Framework: Other, Output Directory `public`)
Done when: the public URL runs Phase 1.

### Phase 3: Multiplayer (hosting A: separate Node `ws` server)
- [ ] `server/server.js` with `ws`: rooms by code, join/leave, 20 Hz tick loop
- [ ] Menu: Create Room (6-char code + shareable link), Join Room
- [ ] Lobby: player list, host starts the match
- [ ] Server sends snapshots (numbers rounded to 2 decimals, length capped); client interpolates between snapshots
- [ ] Measure snapshot size and decide if a lighter format is needed
- [ ] Deploy the server (Render/Fly/Railway, region near players), URL in `public/config.js`
Done when: two browsers on different devices play in the same room.

### Phase 4: Map and walls
- [ ] Wall rectangles in shared state; kill on touch, block bullets
- [ ] Draw walls (render already supports them)
Done when: dragons and bullets collide with walls.

### Phase 5: Basic attack + stat pickups (test with two browser tabs)
- [ ] Left click hold = basic attack toward the cursor; bullets as circles, per-tick distance check
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
- Orbs drift toward the head (magnet) like slither
- Zoom out as the dragon grows
- Spectator mode for dead players
- Touch controls for phones (virtual joystick)
- Sound effects via Web Audio + mute setting
- Rebindable keys in Settings
- Bots / training dummy for solo combat testing
- Auto-reconnect to the same room
- Client-side prediction / lag compensation
- Map editor / multiple maps
- Fun twists to brainstorm for Phase 8 (arena shrinking, chain-reaction missiles)
