# Art credits and reuse

Ships: Skorpio, **Space Ship & Mech Construction Kit 2 / Original Human Ships** (2013).
Source: https://opengameart.org/content/space-ship-mech-construction-kit-2
Original download: https://opengameart.org/sites/default/files/OriginalHumanShips.zip
License chosen: Creative Commons Attribution-ShareAlike 3.0 Unported.
License: https://creativecommons.org/licenses/by-sa/3.0/

Changes for Gyro Space Combat: transparent cropping, scale normalization, blue/red accent recoloring, enemy orientation, and packing into a sprite atlas. Player and enemy nose points upward/downward respectively. Original files are retained in `public/assets/originals/OriginalHumanShips.zip` and `public/assets/originals/human/`.

The adapted ship artwork remains available under CC-BY-SA 3.0. Download `/assets/adapted-art-CC-BY-SA-3.0.zip` for the atlas, metadata, hangar previews, and reproducible adaptation script. The original attribution and this license must accompany reuse of the ship art. Game source has its own license; this artwork license does not relicense unrelated source code.

Thrusters, projectiles, asteroid, explosion frames, shield, and EMP are deterministic, manually authored procedural graphics in `scripts/build-assets.py`, provided under CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/. No image generation model was used for any asset in this delivery.

Build: run `scripts/build-assets.py` with Python 3 and Pillow installed. Atlas format: Phaser JSON hash, 1024 × 1024, untrimmed centered frames. Player/enemy frames 160 × 160, boss 320 × 320, asteroid/explosion 128 × 128, thruster 64 × 64, projectile 32 × 64, shield/EMP 256 × 256. Collision radii belong to the game model, not the image bounds.

## Modular ship builder (cinematic UI update)

The fixed-slot ship-builder layers are derived directly from transparent artist-authored PSD layers in **SpaceshipConstructionKit2.psd**. Original ZIP retained at `/assets/originals/SpaceshipConstructionKit2.zip`.

Original: https://opengameart.org/sites/default/files/SpaceshipConstructionKit2.zip
Artist/source page: Skorpio, https://opengameart.org/content/space-ship-mech-construction-kit-2
License: CC-BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/

Changes: select individual hull/wing/engine layers, crop transparency, mirror left wings into pairs, recolor existing accents blue, resize uniformly and position into common 320×320 slot layers. 27 layered example compositions are included. Hull layers: Layer 72, Layer 48, Layer 30. Wing layers: Layer 239, Layer 238, Layer 230. Engine layers: Layer 186, Layer 194, Layer 217.

Download adaptations and reproducible script: `/assets/modular-art-CC-BY-SA-3.0.zip`. Run `scripts/build-modular-assets.py` with Python 3, Pillow and psd-tools. All derived modular ship images remain CC-BY-SA 3.0. Credit Skorpio and identify modifications when redistributing adaptations.

## Cinematic space background

**Space Backgrounds / Background-1.png** by Rawdanitsu (2014), CC0 1.0.
Artist/source page: https://opengameart.org/content/space-backgrounds-3
Original: https://opengameart.org/sites/default/files/Background-1.png
License: https://creativecommons.org/publicdomain/zero/1.0/

Original retained at `/assets/originals/Rawdanitsu-Background-1.png`. Derivatives `/assets/space-background.webp` and `/assets/space-combat-background.webp` convert to WebP and darken the combat version for legibility. Source art predates generative image tools; no AI image generation used.

Shared wing-mount bridge: tiled crop (56,58,72,74) from Skorpio Human-Fighter.png, same CC-BY-SA 3.0 source credited above. Engine placement overlaps hull rear to prevent disconnected modules. Module layers share 320×320 transparent canvas; hull is frontmost.


## Tactical Fleet / English edition (v6)

The current tactical assembly uses Skorpio Original Human Ships hulls (Human-Fighter, Human-Cruiser, Human-Battlecruiser), with PSD-derived wing and engine pieces from the construction kit. Changes: uniform resizing, swept mirrored wings, a mounting brace cropped from the artist's Human-Fighter hull, normalized 640x640 transparent canvases, brighter cyan lighting, three engine layouts, and red recoloring for bosses. The hull/wing/engine selection remains cosmetic. These ship, boss, drone and module derivatives remain CC-BY-SA 3.0.

Three portrait combat environments crop different regions of Rawdanitsu Background-1, darken them and encode WebP without stretching; these remain CC0. Equipment and upgrade symbols in assets/tactical/*.svg are hand-authored geometric vector drawings, CC0. Combat trails, warning beams and hitbox indicators are code-drawn effects. No generative image model was used.

Current derivative download: /assets/tactical-art-CC-BY-SA-3.0.zip. Rebuild with scripts/build-tactical-assets.py (Python + Pillow); check all 27 compositions with scripts/check-tactical-assets.py. Original artist files remain in assets/originals/. Earlier adaptation ZIPs describe the earlier art versions, not the tactical update.

## Arcade update
Pickup icons in public/assets/arcade were drawn as original vector artwork for this project (CC0). Rajdhani and Barlow fonts are distributed under the SIL Open Font License; license texts are included in public/assets/fonts/.

## Dynamic environment update

- Feony Labs, Animated Pixel-Art Backgrounds Free, Background 7 (Bonus): https://feony-labs.itch.io/animated-pixel-art-backgrounds-free . Used as an in-game space backdrop, encoded WebP and animated at runtime. The author's page grants free personal/commercial project use and modification, prohibits resale; its metadata also labels CC BY-ND 4.0. This project credits the artist and does not distribute the original pack or offer the background as a standalone asset download.
- Baldur / Foozle, Void Fleet Pack 1 and 2, CC0. Base, engine and destruction frames resized/aligned in environment atlas. Original license is retained locally in the supplied ZIPs.
- Matt Walkden, Lunar Lander assets: https://mattwalkden.itch.io/ . CC0; asteroid/debris tiles used in the atlas.
- Wenrexa, Laser2020: https://wenrexa.itch.io/laser2020 . CC0; transparent energy flare used for projectiles.
- GrafxKid, Mini Pixel Pack 3, CC0. Power pickup/spark sprite frames.
- Goose Ninja, Space Music Pack: https://gooseninja.itch.io/space-music-pack . Tracks menu, in-the-wreckage, battle. Author permits free/commercial project use and modification; prohibits redistributing/reselling the asset pack. Only compressed game soundtrack files ship; original WAV/ZIP pack is not published.
- Pickup/ready/warning/victory synthesis: original Web Audio effects. Spoken phrases use the user's installed English device voices through SpeechSynthesis; no recorded celebrity or cloned voice is used.

Rebuild runtime assets with scripts/build-environment-assets.py using Pillow and imageio-ffmpeg. The script reads local archives from Desktop/Space_combat; it does not copy restricted source ZIPs into public/.

## Mobile Onslaught / Endurance bosses (current)

- Baldur, commissioned and distributed by Foozle: Kla'ed and Nairan hulls, wings, escort fleets, engine and destruction strips from Void Fleet1/2. Pack READMEs specify CC0. Current capital ships are connected kitbashes with purpose-drawn spars, sockets and separate destructible turret geometry. Hit masks preserve each source silhouette. Runtime images and manifest are in assets/onslaught; rebuild with scripts/build-onslaught-assets.py.
- Wenrexa, UI Sci-Fi Minimalism #01: https://wenrexa.itch.io/nesia01 . Official page specifies CC0 and permits commercial/free project use. Extracted button/header/item frames are game UI derivatives; no original ZIP ships.
- GrafxKid Mini Pixel Pack3: CC0 as stated in pack LICENSE.txt. Sparkle frames are adapted for impacts.
- Semantic weapon/missile/drone/shield/repair/EMP badges, hull energy segments, shield lattice, drone interception burst and matching turret additions are manually coded pixel/vector geometry, CC0. No generative imagery.
- Oxanium (display) and Barlow (body): SIL Open Font License. Source font and license files are self-hosted under assets/fonts. Rajdhani is historical and no longer the display face.
- User-supplied Terminal_Dash.mp3 and ORBITAL BOMBARDMENT Epic Sci-Fi Battle Music Space Fleet Invasion Soundtrack.mp3 are the active assault/boss tracks. Original ownership is retained; this project does not claim these tracks are CC0. Goose Ninja's menu track remains active in menus; older battle tracks are historical runtime files.
- Provided sci-fi SFX pack is permitted for inclusion in projects, with no standalone resale/pack redistribution; its README discloses ElevenLabs-generated audio. Only individual runtime samples are included. Original procedural warp, EMP and explosion synthesis is code-authored.
- Supplied renamed announcement WAVs are identical unrelated NPC dialogue. They are not shipped as falsely labelled item voices. Correct English device speech remains the fallback pending matching recordings. See AUDIO-PROVENANCE.md.

Detailed asset provenance: /assets/onslaught/credits.json and /assets/audio/music-manifest.json. Earlier sections describe historical releases; current combat environments use Feony space-only variants, not the former planet background.
# Evolution Arcade runtime artwork

Selected GUI derivatives: CraftPix Space Game GUI, from the user-supplied `Space_Game_GUI_PNG.zip`, under the [CraftPix file license](https://craftpix.net/file-licenses/). Only game-integrated runtime derivatives are included, never the source ZIP/PSD pack. Blank button material is derived from the author's window texture, with labels supplied by accessible HTML.

Projectile, beam, fighter and booster frames: **Gustavo Vituri**, [Space Shooter Asset Pack](https://gvituri.itch.io/space-shooter). Personal/commercial game use and modification permitted; standalone pack redistribution prohibited. Author states no generative AI was used. The game includes selected frames, not an asset-library download. Friendly fighter tiers and engine frames are recolored cyan/silver/white, preserving authored silhouettes and alpha, to distinguish them from warm-colored hostile units.

Meteor derivatives retain the project's Lunar Lander artist provenance. Runtime contours are baked around the original alpha silhouette in black and warm white; pale rock shading and amber cracks improve visibility. These are deterministic image edits, not generated imagery.

Progress/status/bracket elements: **Nkyo-P — NULLSIGNAL**, user-supplied FREE v1.1, [official pack](https://nkyo-p.itch.io/nullsignal-dark-tech-sci-fi-ui-hud-kit). Finished-game use/editing allowed, no standalone redistribution/resale/AI-training. The author discloses AI-assisted vector code and human arrangement; no claim of AI-free provenance is made. No generated background from this pack is used.

Chakra Petch by Cadson Demak and JetBrains Mono by JetBrains are bundled under SIL OFL1.1. License texts are in `/assets/evolution/fonts/`. Ethnocentric is only referenced in the GUI archive README and is not embedded.

Runtime manifest/provenance: `/assets/evolution/manifest.json` and `/assets/evolution/credits.json`. Rebuild: `scripts/build-evolution-assets.py`.

Evolution side-wing/gun/engine overlays: additional adaptations of **Skorpio — Space Ship & Mech Construction Kit2**, [source](https://opengameart.org/content/space-ship-mech-construction-kit-2), **CC-BY-SA3.0**. `ship-upgrade-2.png` and `ship-upgrade-3.png` retain that license; see `/assets/evolution/LICENSE-SHIP-UPGRADES.txt`. The original module derivatives and modification script remain available with the game source.

