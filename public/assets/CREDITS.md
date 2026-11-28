# Asset credits

## Icons: game-icons.net (CC BY 3.0)
Source: https://github.com/game-icons/icons , license: https://creativecommons.org/licenses/by/3.0/
Changes made: the black background square was removed and the icon color set to near-black (`#111`).
The emblem copy in `render.js` is recolored to light violet at load time.

| File | Icon | Author |
|---|---|---|
| `icons/gun.svg` | Pistol gun | John Colburn |
| `icons/rapid.svg` | Fast forward button | Delapouite |
| `icons/shield.svg` | Bordered shield | Lorc |
| `icons/missile.svg` | Rocket | Lorc |
| `icons/dragon.svg` | Dragon head (floor emblem) | Lorc |

## Sprites: Kenney (CC0)
Author: Kenney, https://kenney.nl . License: Creative Commons Zero (public domain), https://creativecommons.org/publicdomain/zero/1.0/ . Credit is not required, it is given anyway.
Source: kenney.nl is not reachable from the build sandbox, so the files were copied unchanged from the GitHub mirror https://github.com/shorepine/kenney (commit `3694c6879e487c108f55677be7dd2ca75b07cc3b`, its README says the whole library is CC0). The license was not re-checked on kenney.nl itself.
Changes made: none to the files. `render.js` tints the hull and bullet by multiplying a color at load time.

| File | Pack and original path in the mirror | Used for |
|---|---|---|
| `sprites/tankBody_sand.png` | Topdown Tanks Remastered, `Retina/tankBody_sand.png` | dragon head and body blocks (tinted) |
| `sprites/tankSand_barrel1.png` | Topdown Tanks Remastered, `Retina/tankSand_barrel1.png` | gun barrels |
| `sprites/bulletSand1.png` | Topdown Tanks Remastered, `Retina/bulletSand1.png` | bullets (tinted) |
| `sprites/crosshair_white_large.png` | Shooting Gallery, `HUD/crosshair_white_large.png` | mouse cursor |
| `sprites/tankSand_barrel2.png`, `sprites/tankSand_barrel3.png` | Topdown Tanks Remastered, `Retina/tankSand_barrel2.png`, `Retina/tankSand_barrel3.png` | gun barrels 2 and 3 (barrels cycle 1, 2, 3, 1, 2) |
| `sprites/bulletSand3.png` | Topdown Tanks Remastered, `Retina/bulletSand3.png` | missile |
| `sprites/fx/shotOrange.png` | Topdown Tanks Remastered, `Retina/shotOrange.png` | muzzle flash |
| `sprites/fx/regularExplosion04.png` | Explosion Pack, `Regular explosion/regularExplosion04.png` | missile and death explosion |
| `sprites/fx/burst.png` | Explosion Pack, `Particles/burst.png` | impact flash, level-up flash |
| `sprites/fx/greyCloud1.png`, `sprites/fx/orangeCloud1.png` | Explosion Pack, `Particles/greyCloud1.png`, `Particles/orangeCloud1.png` | smoke and fire puffs |

The mirror commit is the same for the new files. Other CC0 packs in the same mirror that may fit later (not used): Topdown Tanks Remastered (barricades, crates, tiles, `specialBarrel1-4`), the rest of Explosion Pack (pixel / sonic / ground explosions, frames 00-08), Smoke Particles, Particle Pack (muzzle flashes on black), Splat Pack, Topdown Shooter, Tank Pack, Robot Pack, Monster Builder Pack, Minimap Pack, Cursor Pack, UI Pack - Sci-fi, Game Icons (`icons/Game Icons`). To fetch single files without cloning everything: `git clone --filter=blob:none --no-checkout --depth 1 https://github.com/shorepine/kenney`, then `git checkout HEAD -- "<path>"`.

Everything else (floor, walls, shadows, embers, minimap, glow) is drawn in code.
