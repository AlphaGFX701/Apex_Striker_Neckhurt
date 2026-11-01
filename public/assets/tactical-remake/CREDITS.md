# Tactical Neon Remake assets

## Fonts

MGS1 Codec, MGS1 HUD and MGS1 Ammo Fonts © 2025 Andrew Gleeson.
Source: https://gleeson.itch.io/mgs1-fonts
License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/
All three TTFs are copied byte-for-byte, without modification, from MGS1_Fonts.zip.
The author's original LICENSE.txt, README.txt and GLYPHSET.txt accompany the fonts.
The explicit LICENSE.txt attribution requirement is followed even though README
describes attribution as optional. The font license applies to the supplied fonts;
this credit does not assert that unrelated game code uses that license.

## Artist-derived beam and projectile textures

Wenrexa, Assets Free Laser Bullets Pack 2020, CC0 1.0 Universal.
Source: https://wenrexa.itch.io/laser2020
Author's CC0 announcement: https://wenrexa.itch.io/laser2020/devlog/243646/full-free-cc0-license
License: https://creativecommons.org/publicdomain/zero/1.0/
Local source archive: Sprites - Lasers Bullets #1 [66]v2.5.zip
Curated source members: Laser Sprites/20.png (237×136, white core),
Laser Sprites/24.png (211×92, red energy), Laser Sprites/33.png (325×238, red edge).
Derived textures are rotated to point upward. Fully transparent RGB is cleared
and negligible alpha is removed. No original ZIP is redistributed.

Beam core, energy and halo are 44×32 repeat tiles, sampled from middle cross-sections,
not whole bullets stretched along the beam. Head is 44×32; tail is 44×48.
All three middle tiles have identical first/last rows. Place the head above a tiled
middle and the tail below it; rotate the assembled effect 180° for a downward shot.
Core, energy and halo share the same 44px centerline; layer halo, energy, then core.
Use additive blending for the luminous effects where supported.

## Deterministic warning graphics

tactical-danger-tile.png is a 44×64 repeating charge-zone hatch and edge guide.
tactical-danger-alert.png is a 64×64 triangle containing a geometric exclamation.
These are original code-drawn graphics, released under CC0 1.0. No generative AI
or third-party glyph is used. Exact dimensions and derivation steps for every PNG
are recorded in asset-manifest.json. The reproducible pipeline is
scripts/prepare-tactical-assets.py and requires Pillow.
