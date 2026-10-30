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
