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
- [x] WASD / arrow steering with limited turn rate (slower when longer); no key = keep heading (replaced mouse steering)
- [x] Dragons drawn as squares (sketch), not circles
- [x] World 200x150 (was 80x60, see Map pass below), camera follows the head and zooms out as the dragon grows, smooth interpolation between ticks
- [x] Orb pickup adds 1 block at the tail
- [x] Shards: small no-name XP pickups; 10 shards = 1 level (+10% max HP per block, +8% damage stat); body grows 1% per shard (x2 at 100); also drop on death
- [x] Every part has HP (constants in `sim.js`), not damaged yet
- [x] Death on border/wall/other dragon's body; no self-collision
- [x] On death all segments scatter as colored pickups (dragon's color)
- [x] Practice mode keeps 187 orbs and 750 shards on the map (same density as before, scaled to the area); HUD shows HP, level, shards, damage, size, length
- [x] Respawn / Menu panel after death
- [ ] User playtest in a real browser confirms it works and feels right (never seen in a real browser yet, see AI_ACTIVITY)
Done when: menu, settings, solo play, death and scatter work locally and feel like slither.io.

### Map pass (user request, done before Phase 2, awaiting playtest)
- [x] Big map: 200x150, 4-way symmetric, 50 walls (central fortress with 4 gates + inner pillars, corner L-keeps, lane ridges, pillar lattice), data in `public/shared/map.js`
- [x] Depth: tinted floor pools, raised walls (front lip + cast shadow), drop shadows under dragons and orbs, floating orbs, 2 ember layers (parallax), vignette, red border haze
- [x] Icons on orbs (game-icons.net, CC BY 3.0, credited in `public/assets/CREDITS.md` and on the menu); dragon-head emblem on the fortress floor
- [x] Spawn looks 15 units ahead so walls cannot kill a fresh dragon
- [ ] User playtest: map size, wall layout, speed across 200 units (about 33 s edge to edge), zone colors
- [x] Minimap: bottom-right corner map with zone colors, walls, border, the visible area (white box) and your dragon (triangle). Enemies are not shown on purpose. `public/minimap.js`
- [ ] User playtest: minimap size and readability
Not done: tileset sprites for floor and walls. Kenney CC0 packs ARE reachable from the build sandbox through the GitHub mirror `shorepine/kenney` (see `public/assets/CREDITS.md`), floor and walls are still drawn in code.

### Combat pass (user request, Session 10, awaiting playtest)
- [x] Free sprites: more Kenney CC0 (barrels 2 and 3, missile, muzzle flash, explosion, burst, smoke, fire), credited in `public/assets/CREDITS.md`
- [x] Gun UI: weapon slots under the HUD (game-icons on light tiles: barrels, fire rate, shield HP, missile count + cooldown); barrels cycle 3 sprites, sit on a round turret cap, are drawn above the eyes and kick back after a volley
- [x] Walls solid for the whole dragon: collision box = top face + front lip (head and bullets no longer sink into the lip); head dies at radius 0.6 (corner of its square); body blocks are pushed out of walls and the border (no damage), so the tail cannot cut a corner
- [x] Camera zoom uses shards AND length (`bulkOf`): view 32 units wide at the start, up to 96 (`MAX_VIEW`)
- [x] "Other guns": Missile (right click, 1 to 3 homing missiles per cast, 6 s cooldown, built early from Phase 6) and Shield (+40 HP per orb, cap 120, shown as a ring + HUD). The multi-barrel Gun is checked by test (5 barrels = 5 bullets per volley)
- [x] Ranges: basic 24 units, missile 36 units (`WEAPONS` in `sim.js`); a faint dashed line + ring shows the basic range along the aim; shots fade and fizzle at the end
- [x] Effects (`public/effects.js`, fed by `state.events`): muzzle flash, wall hit (flash, sparks, dust, scorch mark), fizzle, missile explosion with fire/smoke trail, dragon death explosion with debris, pickup / level-up rings, sparks when a body block scrapes a wall
- [ ] User playtest in a real browser: gun slot look, effect amount and speed, zoom curve (`ZOOM_PER_SIZE`, `BULK_PER_BLOCK`), wall feel
- [ ] Shield absorbs damage and bullets/missiles hurt dragons (still waits for the damage + cut rule in Phase 5)

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

### Phase 4: Map and walls (mostly done early in the Map pass)
- [x] Wall rectangles in shared state; kill on touch
- [x] Walls block bullets (built with bullets, Phase 5; the border stops them too); wall box now includes the front lip (Combat pass)
- [x] Draw walls
Done when: dragons and bullets collide with walls.

### Phase 5: Aim + basic attack + stat pickups (test with two browser tabs)
- [x] Mouse aim (crosshair sprite as the cursor, cursor to world angle, sent as `aim`)
- [x] Camera pans toward the cursor (user request, 40% of the way, eased)
- [x] Left click hold = basic attack toward the cursor; bullets as sprites, per-tick wall check. `damageMult(d)` is stored on each bullet (`dmg`) but NOT applied to dragons yet
- [x] Guns are visible barrel sprites mounted on body blocks (user request, replaces the fan: barrel i on block i, all fire along the aim)
- [ ] Damage segments; cut rule (rear scatters); head HP 0 = death (bullets fly through dragons until this is built; needs a swept check, see GAME_DESIGN)
- [x] Pickups: Gun (+1 barrel, cap 5), Rapid (+10% fire rate, cap +50%); glow rendering respects the setting
- [ ] User playtest: aim feel, camera pan strength (`PAN` in `render.js`), fire rate, barrel and hull sprites
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
- Shards drift toward the head (magnet) like slither
- Level-up flash/sound
- Spectator mode for dead players
- Touch controls for phones (virtual joystick)
- Sound effects via Web Audio + mute setting
- Rebindable keys in Settings
- Bots / training dummy for solo combat testing
- Auto-reconnect to the same room
- Client-side prediction / lag compensation
- Map editor / multiple maps
- Pixel tileset for floor and walls (Kenney CC0 packs: kenney.nl is not reachable from the build sandbox, but the GitHub mirror `shorepine/kenney` is, see `public/assets/CREDITS.md`)
- Losing a gun when its block is cut (barrels are mounted on blocks now; waits for the cut rule)
- Explosion / smoke / hit sprites (Kenney Explosion Pack, Smoke Particles, Particle Pack are in the same mirror)
- Fun twists to brainstorm for Phase 8 (arena shrinking, chain-reaction missiles)
