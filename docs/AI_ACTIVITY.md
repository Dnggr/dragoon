# AI ACTIVITY LOG (append-only, newest at the bottom)

## 2026-11-25: Session 1 (Phase 0, planning only)
Changed:
- Created `.gitignore`, `README.md`, `AI_RULES.md`, `docs/CHECKLIST.md`, `docs/ARCHITECTURE.md`, `docs/AI_ACTIVITY.md`
- Saved sketch to `docs/sketch.png`

Notes:
- Attached `dragoon.xml` / `dragoon_1.xml` (Repomix packs) contained zero files. Treated the project as greenfield. If code exists elsewhere, re-pack from the repo root and re-attach.
- Sketch reading: P1 dragon (segmented body) -> arrow -> scattered colored blocks ("any color") -> arrow -> 4 glowing pickups (1 bullet, 2 bullet, 3 shield, 4 missile). Map box: "walls or anything that will cover the dragons". Title: multiplayer.
- No game code written.

Open questions (blocking Phase 1):
- Q1 Movement: grid tick-based or free movement? (default: grid)
- Q2 Hosting for realtime: separate Node `ws` server, WebRTC P2P, or Vercel WS + external store? (default: separate Node `ws` server)
- Q3 Pickup source and growth: do dragon segments scatter as colored pieces that become the glowing pickups (as the sketch arrows suggest), or do pickups spawn randomly? Do dragons grow? (default: dead dragon's segments scatter as pickups, random type; dragons grow when collecting)
- Q4 Combat: what differs between bullet 1 and bullet 2, what do shield and missile do, what does a hit do? (default: bullet 1 = single straight shot, bullet 2 = fast shot; both remove 1 tail segment; shield blocks 1 hit; missile = slow, removes 3 segments; head collision = death)
- Q5 Walls: block movement, block bullets, hide dragons, or all? (default: block movement and bullets; "hiding" deferred)

Assumed defaults (change anytime): 2 to 4 players per room, 6-character room code in a shareable link, last dragon alive wins.

Next: wait for answers to Q1 to Q5 and a "go".

## 2026-11-25: Session 2 (Phase 0, planning only)
User answers: Q1 grid. Q2 hosting A (static Vercel + separate Node `ws` server). Q3 default, plus: when a dragon dies it scatters, and every part of the dragon has health. Q4 default, head collision = death like snake.io, user wants it "more fun" (twists parked for Phase 6). Q5 default (walls block movement and bullets).
New requests: main screen and settings screen; asked whether players should log in.
Decision: no login, guests with name/color in `localStorage` (recommended, user did not object).
Changed: rewrote `docs/CHECKLIST.md` (screens in Phase 1, scatter/HP, statuses) and `docs/ARCHITECTURE.md` (screens, folder layout, HP state shape, CONFIRMED tags). No game code written.

Open questions (defaults apply if the user says "go"):
- QA: when a segment reaches 0 HP, does it cut the body (segments behind it scatter as pickups, front part lives), or is just that one segment removed? (default: cut; the rear part scatters)
- QB: damage and HP numbers. (default: segment HP 3, head HP 5; bullet 1 dmg, bullet2 1 dmg but faster, missile 3 dmg; head HP 0 = death; shield absorbs 1 hit)

Next: wait for "go", then Phase 1.

## 2026-11-25: Session 3 (Phase 0, planning only)
User answers: QA yes (cut the body, rear scatters). QB yes, but battles must be long and nothing overpowered.
New requests: manual mouse aiming with camera panning toward the enemy; left click = basic attack; right click = skills; bullets per basic attack = number of Gun pickups; shield has its own HP and auto-deploys; missile is homing with modest damage; asked whether to change the guns; wants perks for combos and builds; wants right-click skills.
Changed: created `docs/GAME_DESIGN.md` (controls, balance targets, retuned pickups, 4 skills, 2 status effects, 9 perks, 4 example builds). Rewrote `docs/CHECKLIST.md` (combat/skills/perks phases split, aim moved to Phase 5) and `docs/ARCHITECTURE.md` (20 Hz tick, camera, interpolation, aim/skill state and protocol). Added GAME_DESIGN.md to the read-first list in `AI_RULES.md`. No game code written.
Pushback given: aim + skills + perks doubled the scope; perks/skills are built last (Phases 6 and 7) so the core fight is tuned first. Desktop only because mouse aim has no good phone equivalent.

Open questions (defaults apply if the user says "go"):
- QC: camera follows your head and the mouse only aims (you move with the keyboard)? Or did "camera panning" mean something else? (default: follows head, keyboard moves, mouse aims)
- QD: accept the retuned pickups: Gun (+1 barrel, cap 5), Rapid (+fire rate) replacing the second bullet, Shield, Missile? (default: yes)
- QE: perks and extra skills come from "choose 1 of 3" cards at pickup milestones? (default: yes)
- QF: accept the balance numbers in GAME_DESIGN.md (head 150, segment 50, bullet 4 dmg, about 40 s 1v1 kill)? (default: yes, tuned in playtests)

Next: wait for "go", then Phase 1.

## 2026-11-25: Session 4 (Phase 1 built)
User said "go" (QC to QF accepted as defaults).
Created: `public/index.html`, `style.css`, `main.js`, `settings.js`, `input.js`, `render.js`, `public/shared/sim.js`.
What works: menu (Practice; Create/Join Room disabled), settings (name max 12, color picker, glow, saved in `localStorage`), practice game on an 80x60 grid with a 32-cell-wide camera following the head, smooth interpolation between cells, arrows/WASD with no reversing, growth on pickup, HP on every part (not damaged yet), death on wall/body hit with all segments scattering as random-type pickups tinted with the dragon's color, Respawn/Menu panel, 25 pickups kept on the map. Pickup letters: G gun, R rapid, S shield, M missile (effects arrive in Phases 5 and 6; for now every pickup only grows you).
Testing done: node unit tests of `sim.js` (move cadence, HP stays with segment, no reverse, border death + scatter, eating, self/other-body/head-on collisions, spawn avoids solids) and a jsdom run of the whole client with a mocked canvas (screens, settings persistence, game loop, death, respawn, leave). Test files were not added to the repo.
NOT tested: real browser rendering. Nobody has looked at the canvas output yet, so visual problems (sizes, eyes, glow, camera feel) are possible.
Decisions made without asking (small): added a Respawn/Menu panel on death; name capped at 12 chars; world 80x60, view 32 cells wide; pickups drawn as glowing circles with a type letter.
Known limitations: spawn has no safe-distance check from other dragons (solo only, revisit in Phase 3); a pickup can land under a surviving head on a scatter move (harmless).
Bugs found: none.

Next: user playtests Phase 1 and reports anything off, then "go" for Phase 2 (deploy static client to Vercel).

## 2026-11-25: Session 5 (suggestion, no code)
User suggested slither.io-style movement and map. Logged as a PENDING DECISION in ARCHITECTURE.md and a PENDING block in CHECKLIST.md; no confirmed doc was rewritten yet, grid Phase 1 code is untouched.
Open questions (defaults apply on "go"):
- QG: mouse steers (head turns toward cursor, slower when longer), WASD removed, attack fires toward the cursor? (default: yes)
- QH: no self-collision, only other dragons' bodies, walls and the border kill? (default: yes)
- QI: no free boost in v1, Wing Boost stays a right-click skill? (default: yes)
- QJ: keep the rectangular map with obstacle walls from the sketch, not a big circle arena? (default: yes)
Next: wait for "go", then rewrite Phase 1 in slither style and re-test.

## 2026-11-25: Session 6 (Phase 1 rewritten, slither style)
User said "go" on the slither-style pivot (QG to QJ accepted as defaults): mouse steers, no self-collision, no free boost, rectangular map.
Rewrote: `public/shared/sim.js` (float positions, heading + limited turn rate, chain-follow body, circle collisions, rect walls + border, scatter, pickup growth, safe-distance spawn), `render.js` (circles, eyes, camera, `toWorld`), `input.js` (mouse only), `main.js` (mouse -> world angle -> steer, dead zone, 60 practice pickups). Small edits to `index.html` (controls text, mouse hint) and `style.css` (crosshair cursor). Reused unchanged: `settings.js`, screens, game loop shape.
Docs: rewrote GAME_DESIGN.md, ARCHITECTURE.md, CHECKLIST.md, README.md (grid and pending sections replaced). The old grid-based Phase 1 is gone.
Constants (PROPOSED): speed 6 u/s, turn 4.5 rad/s - 0.04 per segment (floor 1.5), spacing 0.7, head r 0.6, segment r 0.5, kill distance 0.9, start length 5, map 80x60.
Testing done (files not in repo): node unit tests for sim (forward speed, chain spacing, hp stays with segment, turn limit + shortest direction + length slowdown + bad inputs ignored, border/wall death + scatter, passing beside a wall, eating, hitting another body, head-on kills both, no self-collision, 1.0 gap safe / 0.8 gap deadly, pickups avoid walls); render tests (camera center, 40 px/unit, interpolation, edge clamp, dead dragon draws); jsdom run of the whole client with a mocked canvas (screens, settings saved, game loop, death, respawn, leave).
NOT tested: real browser rendering and the feel of steering (turn rate, speed, camera). Nobody has looked at the canvas output yet.
Note: if the mouse stays at screen center the dragon keeps steering toward the center and circles. That is normal slither behavior, not a bug.
Known limitations: growth has no cap yet (scatter can create very long dragons); pickups can be collected the instant a dead dragon scatters next to a survivor; touch devices have no steering.
Bugs found: none.

Next: user playtests Phase 1 (speed, turning, camera, glow) and reports tuning changes, then "go" for Phase 2 (deploy static client to Vercel).

## 2026-11-25: Session 7 (Phase 1 fixes)
User attached `dragoon_e551c1.xml`: a Repomix pack of the repo, identical to our files (no user edits).
User feedback: dragon should be square, not circle; only the camera and the snake movement are copied from slither.io; steering should be WASD, not the mouse; add small no-name fragments that act as XP (level up: more health, more damage, body gradually bigger with how many were eaten). User asked for a zip of modified files only (overrides the usual full-project zip for this delivery).
My reading: "its square and not circle" = the dragon should be square blocks like the sketch (we had circles). If you meant something else, say so.
Changed: `public/shared/sim.js` (shards, levels, size scale, per-block max HP, size-scaled collisions and spacing, new constants, shards drop on death), `render.js` (squares drawn rotated along the chain, shards as small diamonds, orbs as square cards, camera zooms out with size), `input.js` (WASD/arrows, mouse removed), `main.js` (steering from keys, 30 orbs + 120 shards in practice, bigger HUD), `index.html` (texts), `style.css` (HUD line breaks, crosshair cursor removed), and docs (GAME_DESIGN, ARCHITECTURE, CHECKLIST, README, this log).
Decisions made without asking: arrows also steer; 10 shards per level, +10% max HP per level, +8% damage per level, +1% size per shard, all capped at 100 shards (level 10, x2); level-up heals by the HP gained; shards do not add blocks (orbs do); practice orbs lowered from 60 to 30 because shards now supply growth; collision stays circles under the squares.
Testing done (files not in repo): node tests for sim (all earlier cases updated, plus shards, level-up heal, cap, size effects, shard/orb scatter, typed vs shard spawn), input (WASD/arrows, diagonals, cancel, reset, blur, inactive), render (squares only, eyes are the only circles, zoom out at max size), and a jsdom run of the whole client (screens, settings, keys only prevented inside the game, death, respawn, leave).
NOT tested: real browser rendering and feel. The damage bonus is only a number on the HUD until Phase 5 adds attacks.
Next: user playtests, then "go" for Phase 2 (deploy static client to Vercel).

## 2026-11-28: Session 8 (map pass: big map, depth, icons)
User asked: fix the map first, add depth, make it big, find free sprites and icons. Treated that prompt as the "go" (AI_RULES wants a "go" per phase) and delivered a zip of changed files only (prompt overrides the whole-project rule).
Docs vs prompt check: no conflict with the code. Note: the checklist's current phase is still "Phase 1, awaiting playtest"; this work is a Map pass plus the early half of Phase 4 (walls exist and kill, bullets blocking waits for Phase 5).
Created: `public/shared/map.js` (200x150, 50 walls, 5 floor zones, emblem), `public/assets/icons/{gun,rapid,shield,missile,dragon}.svg`, `public/assets/CREDITS.md`.
Changed: `sim.js` (`createState(w, h, walls)`; spawn needs 15 units of open ground ahead), `main.js` (uses MAP; orbs and shards scale with area: 187 and 750), `render.js` (rewritten: offscreen floor, raised walls, shadows, floating orbs, embers, vignette, icons with letter fallback), `index.html` (credit line), docs.
Assets: game-icons.net via GitHub (per-author folders, CC BY 3.0). Looked for tilesets: Kenney Hexagon pack (CC0, npm) rejected as isometric city art that clashes with the neon look; no other CC0 2D tileset was reachable from the sandbox (allowed hosts: GitHub, npm, PyPI), so floor and walls are drawn in code.
Decisions made without asking: size 200x150; mirror-symmetric layout; pickup density kept the same as before; wall top face = collision rect exactly (the lip and shadow are decoration); dragons stay squares.
Bug found and fixed in this session: first layout put a pillar row on the map center line, mirroring it into a touching 3x6 slab; a first spawn check (9 units ahead) still let 10% of spawns hit a wall within 2 s, now 15 units, 0 of 1500.
Testing done (files not in repo): node tests on the real map (1500 spawns survive 2 s straight, 6000 pickups none in walls, flying through a fortress gate, dying on a wall and on the border, passing beside a pillar, step cost 0.13 ms with 937 pickups and 4 dragons); frames rendered to PNG with node-canvas and checked by eye (fortress, corner, size x2, fortress center); `main.js` smoke run with a stubbed DOM (start, 10 s of frames, death, respawn, about 4 ms per frame on CPU).
NOT tested: a real browser (GPU speed, SVG icon loading over HTTP, devicePixelRatio above 1, touch). Feel of a 200-unit map at speed 6 (about 33 s edge to edge) and the wall layout are untested by a human.
Known limitations: no minimap, so navigation relies on zone colors and the emblem; dragons overlapping a wall's front lip are drawn on top of it (the lip is decoration at floor level); a size x2 dragon has only 5 units of clearance between the inner pillars and the fortress ring.
Next: user playtests; then "go" for Phase 2 (deploy) or tell me what to change (size, wall density, zone colors, minimap).

Follow-up (same day): user asked to add the minimap to the checklist. Added as an unchecked item in the Map pass block (removed from parked suggestions). No code changed.

## 2026-11-28: Session 9 (sprites, minimap, mouse aim + camera pan, firing, guns on the dragon)
User asked: find free sprites and icons; add the minimap; make the guns attach to the player (sprites for the body and the guns); mouse aim with camera panning and firing. Treated the goal list as the "go" (AI_RULES wants a "go" per phase) and delivered a zip of new and modified files only (the prompt overrides the whole-project rule, as in Session 8).
Docs vs prompt check: no conflict with the code. Two notes: (1) AI_RULES says "deliver a whole-project zip after every step", the prompt says changed files only by default, the prompt won. (2) "Guns mounted on segments" was parked as NOT approved; the request approves it, so it moved into Phase 5 (built) and the parked list.
Created: `public/minimap.js`, `public/assets/sprites/{tankBody_sand,tankSand_barrel1,bulletSand1,crosshair_white_large}.png`.
Changed: `public/shared/sim.js` (bullets, firing, Gun and Rapid effects, `aim`/`fire`/`reload`/`guns`/`rapid` on dragons), `render.js` (tinted hull sprites, barrels, bullets, cursor pan, `toWorld`, minimap call), `input.js` (cursor + held left button), `main.js` (aim from cursor, fire, HUD line for guns and fire rate), `index.html` (texts, Kenney credit), `style.css` (crosshair cursor, HUD/controls ignore the mouse, controls leave room for the minimap), `public/assets/CREDITS.md`, README, and all four docs.
Assets: the previous session said no CC0 sprite pack was reachable. Wrong for GitHub: the whole Kenney library (CC0) is mirrored at github.com/shorepine/kenney and can be fetched file by file with a partial clone (the GitHub REST API is rate limited, plain git is not). Picked from Topdown Tanks Remastered: hull (`tankBody_sand`, cream so it tints well), barrel (`tankSand_barrel1`), bullet (`bulletSand1`); crosshair from Shooting Gallery. Rejected: the colored tank hulls (cannot be recolored per player), `tankDark_barrel*` (dark olive, invisible on the dark floor). The mirror's license was not re-checked on kenney.nl (unreachable).
Decisions made without asking:
- Barrel i is mounted on body block i and all barrels fire parallel along the aim (GAME_DESIGN said "small fan" from the head; changed in the docs, PROPOSED). Start with 1 barrel, Gun orb +1 (cap 5), Rapid orb +10% (cap +50%), both as in GAME_DESIGN. Shield and Missile orbs still only add a block.
- Bullets: 12 units/s, 40 ticks of range, 2.5 volleys/s base, sprite tinted with the owner's color. `dmg = 4 x damageMult` is stored but NOT applied: nobody can be hit yet, and there are no enemies in practice mode to test it on, so the damage and cut rule items stay unchecked.
- Camera pan: 40% of the way toward the cursor, eased. Aim is the angle from the head to the cursor's world position, so it stays exact when the camera clamps at the map edge.
- Minimap: bottom-right, zone colors + walls + border + view box + your dragon only (enemies hidden on purpose). Hull tint is a multiply, so dark track parts stay dark.
- Crosshair is the OS cursor via CSS, not canvas drawing. Only a left press on the canvas fires, so Leave/Respawn/Menu never shoot.
Testing done (files not in repo): node tests of `sim.js` (no fire without the button, 2.5 volleys/s and 3.75 with Rapid x5, one bullet per barrel at the barrel tips along the aim, range 40 ticks, walls and border stop bullets, 3000 aimed shots at a 3x3 pillar with 0 leaks, Gun/Rapid pickups and caps, other orbs do not touch them, NaN/string inputs ignored, dead dragons do not fire, bullets stay bounded on the real map); `input.js` (cursor, button presses, right button, blur, reset, inactive screen, WASD unchanged); frames rendered with node-canvas and checked by eye (open ground with 5 barrels and bullets, the clamped top-left corner, a wall), aim checked numerically against the cursor in both; a `main.js` run with a stubbed DOM (start, 90 frames while firing, blur, leave, restart).
NOT tested: a real browser (GPU speed with glow and sprite tinting, the CSS cursor image and its hotspot, devicePixelRatio above 1). The orb SVG icons did not load in node-canvas (letters showed), same as before, so icons are unverified here. Feel of the pan, fire rate and barrel size is untested by a human.
Known limitations: bullets pass through dragons (no damage, no cut rule yet); a grazing shot could skip a body block once damage exists (needs a swept check, noted in GAME_DESIGN); holding fire does not stop when you die until the next respawn resets the trigger (harmless, dead dragons do not fire); barrel rotation steps at 20 Hz like the sim; with more barrels than blocks the extra ones are skipped.
Next: user playtests (aim feel, `PAN`, fire rate, minimap size, sprite look); then either the rest of Phase 5 (damage, cut rule, shield, ideally with a training dummy so it can be tested alone) or Phase 2 (deploy). Your call.
