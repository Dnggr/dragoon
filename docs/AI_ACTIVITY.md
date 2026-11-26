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
