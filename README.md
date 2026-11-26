# Dragoon

Browser multiplayer game, slither.io style. Each player is a dragon: a head followed by a chain of body segments. Steer with the mouse, pick any color, grab glowing pickups (gun, rapid, shield, missile), and survive on a map with walls.

Status: **Phase 1 built** (solo practice: menu, settings, slither-style dragon, growth, death + scatter). Multiplayer and combat come next. See `docs/CHECKLIST.md`.

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
Desktop with a mouse. Works now: move the mouse to steer, collect orbs to grow, touching a wall, the border or another dragon kills you and your body scatters. Planned: left click attacks, right click casts a skill, wheel/Q cycles skills, 1/2/3 picks a card. Details in `docs/GAME_DESIGN.md`.
