"""Prepare the Tactical Neon Remake's artist-derived effects and unchanged fonts.

Requires Pillow. Archives are read locally and never copied to the web output.
Run with --contact-sheet PATH for a dark/light-background visual review.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import zipfile

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/assets/tactical-remake"
LASER_ARCHIVE = "Sprites - Lasers Bullets #1 [66]v2.5.zip"
FONT_ARCHIVE = "MGS1_Fonts.zip"
WIDTH = 44


def clean(image: Image.Image) -> Image.Image:
    """Remove invisible RGB and negligible alpha without black-matte conversion."""
    result = image.convert("RGBA")
    result.putdata([(r, g, b, a) if a > 2 else (0, 0, 0, 0)
                    for r, g, b, a in result.get_flattened_data()])
    return result


def middle(source: Image.Image, x: int, y0: int, y1: int,
           height: int = 32) -> Image.Image:
    # One source cross-section, turned vertical. Repetition is exact at every row;
    # the projectile's tapered nose and tail are deliberately excluded.
    row = source.crop((x, y0, x + 1, y1)).transpose(Image.Transpose.ROTATE_90)
    row = row.resize((WIDTH, 1), Image.Resampling.LANCZOS)
    result = row.resize((WIDTH, height), Image.Resampling.NEAREST)
    result.paste((0, 0, 0, 0), (0, 0, 1, height))
    result.paste((0, 0, 0, 0), (WIDTH - 1, 0, WIDTH, height))
    return clean(result)


def caps(source: Image.Image) -> tuple[Image.Image, Image.Image]:
    # Both crops meet the same x=150 cross-section used for the white middle.
    head = source.crop((150, 9, 226, 127)).transpose(Image.Transpose.ROTATE_90)
    tail = source.crop((12, 9, 151, 127)).transpose(Image.Transpose.ROTATE_90)
    result = (clean(head.resize((WIDTH, 32), Image.Resampling.LANCZOS)),
              clean(tail.resize((WIDTH, 48), Image.Resampling.LANCZOS)))
    for image in result:
        image.paste((0, 0, 0, 0), (0, 0, 1, image.height))
        image.paste((0, 0, 0, 0), (WIDTH - 1, 0, WIDTH, image.height))
    return result


def danger_tile() -> Image.Image:
    # 32px hatch period in a 64px tile; the lane continues smoothly when repeated.
    result = Image.new("RGBA", (WIDTH, 64))
    pixels = result.load()
    for y in range(64):
        for x in range(1, WIDTH - 1):
            edge = min(x, WIDTH - 1 - x)
            stripe = (x + y) % 32 < 8
            pixels[x, y] = ((255, 50, 57, 205) if edge <= 1 else
                            (255, 55, 64, 90) if stripe else
                            (133, 12, 31, 31))
    return clean(result)


def danger_alert() -> Image.Image:
    # A deterministic supersampled triangle and geometric exclamation mark.
    scale = 4
    result = Image.new("RGBA", (64 * scale, 64 * scale))
    draw = ImageDraw.Draw(result)
    def points(values):
        return [(x * scale, y * scale) for x, y in values]
    triangle = points([(32, 3), (61, 56), (3, 56)])
    draw.polygon(triangle, fill=(46, 4, 13, 236))
    draw.line(triangle + [triangle[0]], fill=(255, 83, 89, 255),
              width=3 * scale, joint="curve")
    draw.polygon(points([(28, 19), (36, 19), (35, 37), (29, 37)]),
                 fill=(255, 238, 230, 255))
    draw.rectangle((29 * scale, 42 * scale, 35 * scale, 48 * scale),
                   fill=(255, 238, 230, 255))
    return clean(result.resize((64, 64), Image.Resampling.LANCZOS))


def contact_sheet(images: dict[str, Image.Image], destination: Path) -> None:
    tile_w, tile_h = 280, 250
    sheet = Image.new("RGB", (tile_w * 4, tile_h * math.ceil(len(images) / 4)), "#0a101a")
    draw = ImageDraw.Draw(sheet)
    for index, (key, image) in enumerate(images.items()):
        x, y = index % 4 * tile_w, index // 4 * tile_h
        draw.text((x + 10, y + 8), key, fill="#edf6ff")
        draw.text((x + 10, y + 26), f"{image.width} x {image.height}", fill="#91a9c0")
        preview = image.copy()
        if key in {"tactical-beam-core", "tactical-beam-energy", "tactical-beam-halo", "tactical-danger-tile"}:
            preview = Image.new("RGBA", (image.width, 160))
            for offset in range(0, 160, image.height):
                preview.alpha_composite(image, (0, offset))
        preview.thumbnail((110, 175), Image.Resampling.LANCZOS)
        for bx, color in [(x + 10, "#080c14"), (x + 145, "#cdd4dc")]:
            draw.rectangle((bx, y + 52, bx + 120, y + 234), fill=color)
            sheet.paste(preview, (bx + (120 - preview.width) // 2, y + 56), preview)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path,
                        default=Path.home() / "Desktop/Space_combat")
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    fonts = OUT / "fonts"
    fonts.mkdir(exist_ok=True)
    manifest: dict = {"images": {}, "fonts": {}}
    with zipfile.ZipFile(args.source_dir / FONT_ARCHIVE) as archive:
        for name in ["MGS1 Codec.ttf", "MGS1 HUD.ttf", "MGS1 Ammo.ttf", "LICENSE.txt", "README.txt", "GLYPHSET.txt"]:
            data = archive.read(name)
            (fonts / name).write_bytes(data)
            manifest["fonts"][name] = {"archive": FONT_ARCHIVE, "member": name,
                                       "sha256": hashlib.sha256(data).hexdigest(), "modified": False}
    sources = {}
    with zipfile.ZipFile(args.source_dir / LASER_ARCHIVE) as archive:
        for number in ["20", "24", "33"]:
            sources[number] = clean(Image.open(io.BytesIO(archive.read(f"Laser Sprites/{number}.png"))))

    head, tail = caps(sources["20"])
    halo = middle(sources["33"], 165, 19, 211)
    halo = halo.filter(ImageFilter.GaussianBlur(1.0))
    # Keep the blurred halo's x-border transparent and repeat seam exact.
    halo.paste((0, 0, 0, 0), (0, 0, 1, 32))
    halo.paste((0, 0, 0, 0), (43, 0, 44, 32))
    images = {
        "tactical-beam-core": middle(sources["20"], 150, 9, 127),
        "tactical-beam-energy": middle(sources["24"], 120, 2, 90),
        "tactical-beam-head": head,
        "tactical-beam-tail": tail,
        "tactical-beam-halo": clean(halo),
        "tactical-danger-tile": danger_tile(),
        "tactical-danger-alert": danger_alert(),
    }
    for number, name in [("20", "white"), ("24", "red"), ("33", "edge")]:
        bullet = sources[number]
        bullet = bullet.crop(bullet.getchannel("A").getbbox()).transpose(Image.Transpose.ROTATE_90)
        bullet.thumbnail((64, 144), Image.Resampling.LANCZOS)
        images[f"tactical-bullet-{name}"] = clean(bullet)
    derivations = {
        "tactical-beam-core": "20.png: x=150 cross-section, y=9..126, rotated; repeated identical rows",
        "tactical-beam-energy": "24.png: x=120 cross-section, y=2..89, rotated; repeated identical rows",
        "tactical-beam-head": "20.png: crop (150,9,226,127), rotated CCW, resized cap only",
        "tactical-beam-tail": "20.png: crop (12,9,151,127), rotated CCW, resized cap only",
        "tactical-beam-halo": "33.png: x=165 cross-section y=19..210, repeated rows, 1px Gaussian blur",
        "tactical-danger-tile": "Original deterministic geometric red lane with diagonal hatch",
        "tactical-danger-alert": "Original deterministic geometric triangle and exclamation; no font or AI",
    }
    for key, image in images.items():
        image = clean(image)
        image.save(OUT / f"{key}.png", optimize=True)
        manifest["images"][key] = {
            "width": image.width, "height": image.height,
            "derivation": derivations.get(key, "Corresponding 20/24/33 source cropped to alpha, rotated CCW, proportionally reduced"),
            "alpha": "RGBA; alpha <=2 and invisible RGB cleared",
        }
        assert all(a or (r, g, b) == (0, 0, 0) for r, g, b, a in image.get_flattened_data())
    for key in ["tactical-beam-core", "tactical-beam-energy", "tactical-beam-halo"]:
        assert images[key].crop((0, 0, 44, 1)).tobytes() == images[key].crop((0, 31, 44, 32)).tobytes(), key
    (OUT / "asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (OUT / "CREDITS.md").write_text(CREDITS, encoding="utf-8")
    if args.contact_sheet:
        contact_sheet(images, args.contact_sheet)
    print(f"Prepared {len(images)} RGBA textures, 3 unchanged TTFs, font notices and asset credits.")


CREDITS = """# Tactical Neon Remake assets

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
"""


if __name__ == "__main__":
    main()
