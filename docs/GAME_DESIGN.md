# GAME DESIGN (gameplay rules, balance, perks, skills)

Status tags: CONFIRMED (user agreed), PROPOSED (my default, waiting for user).
All numbers live as constants at the top of `public/shared/sim.js` so they can be tuned in one place.

## Core loop
- Guest enters name + color, joins a room, plays. Last dragon alive wins. CONFIRMED (rooms/win: PROPOSED)
- Move on a grid with the keyboard (arrows/WASD turn). Aim with the mouse. CONFIRMED movement grid; keyboard-move + mouse-aim PROPOSED
- Head touches a wall or any dragon body = instant death (snake.io rule). CONFIRMED
- Dragon grows by collecting pickups. CONFIRMED
- On death every segment scatters as a pickup of random type, tinted with the dragon's color. CONFIRMED
- Every part has HP. When a segment reaches 0 HP the dragon is cut there: segments behind it scatter as pickups, the front part lives. CONFIRMED (QA yes)
- Head HP 0 = death. CONFIRMED
- Goal: LONG battles, nothing overpowered. CONFIRMED

## Controls (PROPOSED, desktop only; touch is parked)
| Input | Action |
|---|---|
| Arrows / WASD | Turn the dragon (grid, no 180-degree reversal) |
| Mouse move | Aim (crosshair); camera follows your head |
| Left click (hold) | Basic attack |
| Right click | Cast the selected skill |
| Mouse wheel or Q | Cycle selected skill |
| 1 / 2 / 3 | Choose a card when offered |

Browser-native: `mousemove`, `mousedown`/`mouseup`, `contextmenu` (preventDefault), `wheel`, `keydown`.

## Balance targets (PROPOSED, tune in play)
- Time to kill, 1v1, base kit, real accuracy: about 40 s.
- Fully stacked build: about 15 s.
- Nothing stacks forever: every stat pickup has a cap.

| Constant | Value |
|---|---|
| Sim tick | 20 per second |
| Dragon speed | 1 cell every 3 ticks (about 6.7 cells/s) |
| Head HP | 150 |
| Segment HP | 50 |
| Basic bullet damage | 4 |
| Base fire rate | 2.5 shots/s |
| Bullet speed | 12 cells/s (under 1 cell per tick, so a cell lookup per tick never tunnels) |

## Pickups (4 types from the sketch, retuned)
Random type on scatter. Each stacks up to a cap and lasts until death.
| # | Pickup | Effect | Cap |
|---|---|---|---|
| 1 | Gun | +1 barrel. Basic attack fires one bullet per barrel in a small fan. | 5 barrels |
| 2 | Rapid | +10% fire rate | +50% |
| 3 | Shield | +40 shield HP. Auto-deploys, absorbs damage before body HP. No regen by default. | 120 |
| 4 | Missile | +1 missile per cast of the Missile skill | 3 |

Why change the guns: with free aiming, "bullet 1" and "bullet 2" as two separate bullet types is redundant. Gun (width) vs Rapid (speed) gives a real choice instead.

Every pickup also makes the dragon grow by 1 segment (growth cap TBD in play).

## Right-click skills (cooldown based, no ammo, keeps fights long)
Every dragon starts with Missile. More skills come from cards. Wheel/Q cycles the equipped ones (max 2 equipped, PROPOSED).
| Skill | Effect | Cooldown | First build |
|---|---|---|---|
| Homing Missile (starter) | Slow-turning homing missile, 10 damage each. Missile pickups add more per cast. | 6 s | yes |
| Fire Breath | 2 s cone, range 4 cells, 12 damage/s, applies Burn | 9 s | yes |
| Wing Boost | 1.5 s double speed | 10 s | yes |
| Frost Roar | Radius 5 cells, slows enemy dragons 40% for 3 s | 12 s | later |

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
- Pyro: Burning Rounds + Fire Breath (Burn from bullets, then breath finishes) + Cooldown Scales
- Gunner: Gun x5 + Rapid + Heavy Rounds + Homing Rounds
- Missile battery: Missile pickups + Salvo + Cooldown Scales
- Tank: Shield + Shield Regen + Thick Scales + Vampiric Fangs (wins by lasting, matches the long-battle goal)

## Missile and shield rules (from user)
- Shield has its own HP, deploys automatically, absorbs damage first. CONFIRMED
- Missile is homing with modest damage. CONFIRMED
- Basic attack bullets per click = number of Gun pickups. CONFIRMED
