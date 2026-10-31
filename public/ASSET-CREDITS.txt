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
