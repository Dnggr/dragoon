# GAME DESIGN (gameplay rules, balance, perks, skills)

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).
All numbers live as constants at the top of `public/shared/sim.js` so they can be tuned in one place.
Units: 1 unit is about one body-segment width.

## Core loop
- Guest enters name + color, joins a room, plays. Last dragon alive wins. CONFIRMED (rooms/win: PROPOSED)
- Slither.io-style movement: the dragon always moves forward and its head turns toward the mouse cursor. CONFIRMED
- Longer dragons turn slower. PROPOSED
- Death: head touches a wall, the map border, or ANY OTHER dragon's body (including heads). No self-collision. CONFIRMED
- Dragon grows by collecting pickups (1 segment each). CONFIRMED
- On death every segment scatters as a pickup of random type, tinted with the dragon's color. CONFIRMED
- Every part has HP. When a segment reaches 0 HP the dragon is cut there: segments behind it scatter as pickups, the front part lives. CONFIRMED
- Head HP 0 = death. CONFIRMED
- Goal: LONG battles, nothing overpowered. CONFIRMED

## Controls (desktop only, touch is parked)
| Input | Action |
|---|---|
| Mouse move | Steer AND aim (head turns toward the cursor; camera follows your head) |
| Left click (hold) | Basic attack, fires toward the cursor (Phase 5) |
| Right click | Cast the selected skill (Phase 6) |
| Mouse wheel or Q | Cycle selected skill (Phase 6) |
| 1 / 2 / 3 | Choose a card when offered (Phase 7) |

Browser-native: `mousemove`, `mousedown`/`mouseup`, `contextmenu` (preventDefault), `wheel`, `keydown`.
If the cursor is within 0.4 units of the head the heading is kept (dead zone, stops jitter).

## Movement and collision numbers (built in Phase 1, PROPOSED, tune in play)
| Constant | Value |
|---|---|
| Sim tick | 20 per second |
| Speed | 6 units/s, always forward |
| Turn rate | 4.5 rad/s minus 0.04 per segment, floor 1.5 rad/s |
| Segment spacing | 0.7 units (circles overlap, looks like a smooth body) |
| Head radius / segment radius | 0.6 / 0.5 |
| Kill distance (head to other body) | 0.9 (a bit under touching, forgiving) |
| Pickup radius / collect range | 0.3 / 0.9 |
| Start length | 5 segments |
| Map | 80 x 60 units, rectangle (sketch), border kills |
| Walls | rectangles `{x, y, w, h}`, kill on touch, block bullets (Phase 4) |

Body = chain: each segment follows the one in front and is never farther than the spacing.

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

## Pickups (4 types from the sketch, retuned)
Random type on scatter. Each stacks up to a cap and lasts until death. In Phase 1 every pickup only grows you.
| # | Pickup | Effect | Cap |
|---|---|---|---|
| 1 | Gun | +1 barrel. Basic attack fires one bullet per barrel in a small fan. | 5 barrels |
| 2 | Rapid | +10% fire rate | +50% |
| 3 | Shield | +40 shield HP. Auto-deploys, absorbs damage before body HP. No regen by default. | 120 |
| 4 | Missile | +1 missile per cast of the Missile skill | 3 |

Why change the guns: with free aiming, "bullet 1" and "bullet 2" as two separate bullet types is redundant. Gun (width) vs Rapid (speed) gives a real choice.
Growth cap per dragon: TBD in play (every pickup grows you, so scatter can make long dragons fast).

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
