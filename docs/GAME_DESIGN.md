# GAME DESIGN (gameplay rules, balance, perks, skills)

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).
All numbers live as constants at the top of `public/shared/sim.js` so they can be tuned in one place.
Units: 1 unit is about one body-segment width.

## Core loop
- Guest enters name + color, joins a room, plays. Last dragon alive wins. CONFIRMED (rooms/win: PROPOSED)
- Only the CAMERA and the SNAKE MOVEMENT are copied from slither.io. The look is not: dragons are SQUARE blocks like the sketch, not circles. CONFIRMED
- The dragon always moves forward; WASD (or arrows) sets the direction it turns toward: W up, A left, S down, D right, diagonals by holding two keys, no key = keep heading. The mouse is NOT used for steering. CONFIRMED
- Longer dragons turn slower. PROPOSED
- Death: head touches a wall, the map border, or ANY OTHER dragon's body (including heads). No self-collision. CONFIRMED
- Collecting an orb (gun, rapid, shield, missile) adds one body block. CONFIRMED
- Collecting small shards (see Shards) levels the dragon up. CONFIRMED
- On death every segment scatters as an orb of random type, plus shards, all tinted with the dragon's color. CONFIRMED
- Every part has HP. When a segment reaches 0 HP the dragon is cut there: segments behind it scatter as pickups, the front part lives. CONFIRMED
- Head HP 0 = death. CONFIRMED
- Goal: LONG battles, nothing overpowered. CONFIRMED

## Controls (desktop only, touch is parked)
| Input | Action |
|---|---|
| W A S D (or arrows) | Steer: the head turns toward that direction (Phase 1, built) |
| Mouse move | Aim only, crosshair (Phase 5) |
| Left click (hold) | Basic attack, fires toward the cursor (Phase 5) |
| Right click | Cast the selected skill (Phase 6) |
| Mouse wheel or Q | Cycle selected skill (Phase 6) |
| 1 / 2 / 3 | Choose a card when offered (Phase 7) |

Browser-native: `mousemove`, `mousedown`/`mouseup`, `contextmenu` (preventDefault), `wheel`, `keydown`.
Camera follows your head and zooms out as the dragon grows (slither-style).

## Movement and collision numbers (built in Phase 1, PROPOSED, tune in play)
| Constant | Value |
|---|---|
| Sim tick | 20 per second |
| Speed | 6 units/s, always forward |
| Turn rate | 4.5 rad/s minus 0.04 per segment, floor 1.5 rad/s |
| Block spacing | 0.8 units |
| Drawn square side: head / body block / orb / shard | 0.95 / 0.7 / 0.7 / 0.3 (all times dragon size for the dragon) |
| Collision circles: head / body block | radius 0.5 / 0.4 (between the inscribed and circumscribed circle of the square) |
| Kill distance (head to another dragon's block) | 0.82 x sum of radii = 0.74 at size 1 (a bit under touching, forgiving) |
| Pickup collect range | 0.8 x dragon size |
| Start length | 5 segments |
| Map | 200 x 150 units (6.25x the old 80 x 60), rectangle (sketch), border kills. Data in `public/shared/map.js` |
| Walls | rectangles `{x, y, w, h}`, kill on touch (built), block bullets (Phase 5, when bullets exist). 50 walls, 8.7% of the area, at least 5 units between walls so a size x2 dragon fits |
| Spawn | random spot, at least 6 from other dragons, clear of walls, and 15 units of open ground straight ahead (about 2.5 s) |

Body = chain: each block follows the one in front and is never farther than the spacing (spacing grows with size). Blocks are drawn as squares turned toward the block in front; collisions use the circles above.

## Combat balance targets (PROPOSED, Phases 5 to 7)
- Time to kill, 1v1, base kit, real accuracy: about 40 s.
- Fully stacked build: about 15 s.
- Nothing stacks forever: every stat pickup has a cap.

| Constant | Value |
|---|---|
| Head HP | 150 |
| Segment HP | 50 |
| Basic bullet damage | 4 |
| Base fire rate | 2.5 shots/s |
| Bullet speed | 12 units/s = 0.6 units per tick. Bullet radius 0.15 + segment radius 0.5 = 0.65 > 0.6, so a per-tick distance check cannot tunnel. If speed goes up, add a swept check. |

## Shards (XP, built in Phase 1, PROPOSED numbers)
Small glowing diamonds with no name. Eating shards levels the dragon up.
- Spawn on the map (practice keeps 120) and drop when a dragon dies: about 2 per block plus half of the shards it ate (max 120).
- Eating a shard does NOT add a block. It adds to the dragon's shard count.
- Every 10 shards = 1 level. Each level: +10% max HP on every block (and heals by the gained amount), +8% damage (applies once attacks exist in Phase 5).
- Body size grows gradually: +1% per shard, so x2 at 100 shards. Bigger size also means longer block spacing, a bigger hitbox and a wider camera view.
- Cap: effects stop at 100 shards (level 10, x2 size). Shards beyond that are still collected.
- Orbs (below) are separate: they add a body block and later give weapons/shield/missiles.

## Orbs (4 types from the sketch, retuned)
Square glowing cards with a letter. Random type on scatter and on the map. Each stacks up to a cap and lasts until death. In Phase 1 an orb only adds a body block.
| # | Pickup | Effect | Cap |
|---|---|---|---|
| 1 | Gun | +1 barrel. Basic attack fires one bullet per barrel in a small fan. | 5 barrels |
| 2 | Rapid | +10% fire rate | +50% |
| 3 | Shield | +40 shield HP. Auto-deploys, absorbs damage before body HP. No regen by default. | 120 |
| 4 | Missile | +1 missile per cast of the Missile skill | 3 |

Why change the guns: with free aiming, "bullet 1" and "bullet 2" as two separate bullet types is redundant. Gun (width) vs Rapid (speed) gives a real choice.
Length cap per dragon: TBD in play (every orb adds a block, so scatter can make long dragons fast).

## Right-click skills (cooldown based, no ammo, keeps fights long)
Every dragon starts with Missile. More skills come from cards. Wheel/Q cycles the equipped ones (max 2 equipped, PROPOSED).
| Skill | Effect | Cooldown | First build |
|---|---|---|---|
| Homing Missile (starter) | Slow-turning homing missile, 10 damage each. Missile pickups add more per cast. | 6 s | yes |
| Fire Breath | 2 s cone, range 4 units, 12 damage/s, applies Burn | 9 s | yes |
| Wing Boost | 1.5 s double speed (this is the only boost, no free boost key) | 10 s | yes |
| Frost Roar | Radius 5 units, slows enemy dragons 40% for 3 s | 12 s | later |

## Status effects (only two, to keep combos readable)
- Burn: 3 damage/s for 3 s, refreshes, does not stack.
- Slow: -40% speed for 3 s.

## Perks and cards (build system, PROPOSED, Phase 7)
- Every N pickups collected (6, 14, 24, 36) the player is offered 3 random cards, press 1/2/3 to take one. Play is not paused.
- Cards are perks (passive) or skills (new right-click). Lost on death.
- Perks (max 3 stacks unless noted):
  - Burning Rounds: bullets apply Burn
  - Heavy Rounds: +50% bullet damage, -20% fire rate
  - Homing Rounds: bullets curve slightly toward the nearest enemy
  - Thick Scales: +25% segment HP
  - Vampiric Fangs: heal 1 head HP per bullet hit
  - Shield Regen: shield recovers 5 HP/s after 4 s without damage
  - Salvo: Missile skill fires +1 extra missile
  - Cooldown Scales: -20% skill cooldowns
  - Big Hunger: pickups count double toward the next card

### Example builds (the combos)
- Pyro: Burning Rounds + Fire Breath + Cooldown Scales
- Gunner: Gun x5 + Rapid + Heavy Rounds + Homing Rounds
- Missile battery: Missile pickups + Salvo + Cooldown Scales
- Tank: Shield + Shield Regen + Thick Scales + Vampiric Fangs (wins by lasting)

## Missile and shield rules (from user)
- Shield has its own HP, deploys automatically, absorbs damage first. CONFIRMED
- Missile is homing with modest damage. CONFIRMED
- Basic attack bullets per click = number of Gun pickups. CONFIRMED
