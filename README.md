# Dragoon

Browser multiplayer game. Slither.io camera and snake movement, but with square dragons and WASD steering. Each player is a dragon: a square head followed by a chain of square blocks. Pick any color, eat small shards to level up and grow, grab glowing orbs (gun, rapid, shield, missile), and survive on a map with walls.

Status: **Phase 1 built + big map pass + first half of Phase 5 + Combat pass (solid walls, missiles, shield, weapon ranges, effects, wider zoom)** (solo practice on a 200x150 map with walls and depth, minimap, mouse aim with camera pan, hold-to-fire bullets from barrels mounted on the dragon, shards that level you up, death + scatter). Bullets do not hurt dragons yet, and multiplayer is next. See `docs/CHECKLIST.md`.

No login: players are guests. Name, color and settings are saved in the browser (`localStorage`).

Screens: Main menu (Practice, Create Room, Join Room, Settings), Settings (name, color, glow), Game.

## Docs (read these first, humans and AIs)
| File | Purpose |
|---|---|
| `AI_RULES.md` | Rules and `ponytail` commands every AI session must follow |
| `docs/CHECKLIST.md` | Phases, bugs, dev suggestions |
| `docs/ARCHITECTURE.md` | Structure, state shape, network protocol, decisions |
| `docs/GAME_DESIGN.md` | Gameplay rules, balance numbers, pickups, skills, perks |
| `docs/AI_ACTIVITY.md` | Append-only session log |
| `docs/sketch.png` | Original hand-drawn design sketch |

## Stack
Plain HTML + Canvas 2D + JavaScript (ES modules). No framework, no bundler. A tiny Node `ws` server on a separate always-on host arrives in Phase 3 (see ARCHITECTURE.md).

## Run locally
ES modules need a web server (opening `index.html` by double click will not work). No install needed for the client:
```bash
npx serve public
# or
python3 -m http.server 8000 --directory public
```
Then open http://localhost:8000. Server (Phase 3 onward):
```bash
npm install
npm start
```

## Deploy to Vercel (static client)
1. Push this repo to GitHub.
2. Vercel dashboard -> Add New Project -> import the repo.
3. Framework Preset: **Other**. Build Command: empty. Output Directory: **public**.
4. Deploy. Every push to `main` redeploys.
5. The multiplayer server is hosted outside Vercel (Phase 3). Set its URL in `public/config.js` (not a secret, it is public).

## Controls
Keyboard + mouse. Works now: W A S D (or arrows) steer, the mouse aims (the camera drifts toward the cursor), hold left click to fire, hold right click for homing missiles. Eat shards to level up and get bigger, orbs add body blocks (Gun = +1 barrel up to 5, Rapid = faster fire, Missile = +1 missile per cast up to 3, Shield = shield HP), touching a wall, the border or another dragon kills you and your body scatters. The minimap is in the bottom-right corner. Planned: right click casts a skill, wheel/Q cycles skills, 1/2/3 picks a card. Details in `docs/GAME_DESIGN.md`.

## Credits
Orb icons and the floor emblem: game-icons.net by Lorc, Delapouite and John Colburn, CC BY 3.0. Dragon hull, barrel, bullet, missile, effect and crosshair sprites: Kenney (kenney.nl), CC0. Details in `public/assets/CREDITS.md`.
