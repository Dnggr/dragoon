# AI RULES (load every session)

## Read-first rule
Before writing or changing ANY code, read in this order:
1. `docs/CHECKLIST.md`
2. `docs/AI_ACTIVITY.md`
3. `docs/ARCHITECTURE.md`
Work only on the current unchecked phase. When done, update all three (tick boxes, log the session, fix architecture if it changed). If docs and code disagree, tell the user before continuing.

## No reinventing the wheel
Use browser/platform features first: Canvas 2D, `requestAnimationFrame`, keyboard/pointer events, `<input type="color">`, `WebSocket`, `URLSearchParams`, `crypto.randomUUID`, `structuredClone`, `shadowBlur` for glow, Web Audio. Add a dependency only if the native option is clearly worse, with a one-line reason in ARCHITECTURE.md.

## Strict code rules (default mode: ponytail full)
1. Reuse existing code, standard libraries, or native language features before writing anything new.
2. Never add unrequested abstractions, wrapper classes, or speculative future-proofing.
3. Keep functions flat, short, and readable. Avoid complex design patterns when a simple conditional or loop works.
4. Push back briefly if a request adds unnecessary scope.
5. Mark deliberate shortcuts with `// ponytail: <reason>`.

## Manual commands
- `ponytail lite`: Build what was asked, then add a 1-line note showing a simpler alternative.
- `ponytail full` (DEFAULT): Enforce all simplicity rules strictly.
- `ponytail ultra`: Shortest possible implementation, cut any unnecessary scope.
- `ponytail review`: Audit pasted code for bugs, security issues, and over-engineering.
- `ponytail audit`: Scan pasted files for dead code, security holes, and risky logic.
- `ponytail debt`: List all `shortcut:` / `ponytail:` comments as a technical debt summary.
- `ponytail off`: Return to normal assistant behavior.

## Delivery rules
- Code: complete, ready-to-paste files. Never patches or "rest stays the same".
- Direct tone. No sugarcoating, no theory dumps.
- Plan before code. Do not start a phase without the user saying "go".
- After EVERY finished step, deliver a `.zip` of the whole project (no node_modules, no .git). If files can't be created, give the file tree, every file in full, and the zip command.
- End every reply with: what's done, what's next, and any blocking question.
- Never commit secrets. `.env.example` holds variable names only.
