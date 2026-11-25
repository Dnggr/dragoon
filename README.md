# Dragoon

Browser multiplayer game. Each player is a dragon: a head followed by a chain of square body segments, snake-style. Pick any color, grab glowing pickups (bullet, bullet, shield, missile), and survive on a map full of walls.

Status: **planning (Phase 0)**. No game code yet. See `docs/CHECKLIST.md`.

## Docs (read these first, humans and AIs)
| File | Purpose |
|---|---|
| `AI_RULES.md` | Rules and `ponytail` commands every AI session must follow |
| `docs/CHECKLIST.md` | Phases, bugs, dev suggestions |
| `docs/ARCHITECTURE.md` | Structure, state shape, network protocol, decisions |
| `docs/AI_ACTIVITY.md` | Append-only session log |
| `docs/sketch.png` | Original hand-drawn design sketch |

## Stack
Plain HTML + Canvas 2D + JavaScript (ES modules). No framework, no bundler. A tiny Node `ws` server arrives in Phase 3 (see ARCHITECTURE.md, pending decision).

## Run locally
Phase 1 onward (no install needed for the client):
```bash
npx serve public
# or
python3 -m http.server 8000 --directory public
```
Server (Phase 3 onward):
```bash
npm install
npm start
```

## Deploy to Vercel (static client)
1. Push this repo to GitHub.
2. Vercel dashboard -> Add New Project -> import the repo.
3. Framework Preset: **Other**. Build Command: empty. Output Directory: **public**.
4. Deploy. Every push to `main` redeploys.
5. If the multiplayer server is hosted outside Vercel, set its URL in `public/config.js` (not a secret, it is public).

## Controls
TBD in Phase 1 (planned: arrow keys / WASD to turn, Space to fire).
