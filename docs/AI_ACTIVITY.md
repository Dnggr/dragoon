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
