"""Build the playable Nairan-derived pixel fleet from the user's artist packs.

Only selected runtime derivatives ship. All image operations are deterministic
Pillow edits of authored pixels; no image generation model or APK artwork is used.
Coordinates are authored on a 64px work canvas, then enlarged exactly 3x.
"""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageDraw, ImageOps
import io
import json
import math

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Desktop/Space_combat"
OUT = ROOT / "public/assets/pixel-fleet"
ART = ROOT / "artifacts"
OUT.mkdir(parents=True, exist_ok=True)
ART.mkdir(exist_ok=True)
NEAREST = Image.Resampling.NEAREST
PREFIX = "Foozle_2DS0013_Void_EnemyFleet_2/Nairan/"
SIZE = 64
SCALE = 3
definitions = []
frames = {}


def source_image(z, category, name):
    return Image.open(io.BytesIO(z.read(PREFIX + category + "/PNGs/Nairan - " + name + ".png"))).convert("RGBA")


def friendly(im):
    """Keep the artist's light/shadow ramps, reserving red/orange for enemies."""
    out = im.copy()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = out.getpixel((x, y))
            if not a:
                continue
            value = max(r, g, b)
            chroma = value - min(r, g, b)
            if chroma < 21:
                # Charcoal outlines and silver armor stay neutral/cool.
                rgb = (int(r * .83), int(g * .94), min(255, int(b * 1.04)))
            elif g > r * 1.12 and g > b * 1.03:
                # The original green hull ramp becomes blue steel.
                v = value / 255
                rgb = (round(25 + 75 * v), round(52 + 126 * v), round(72 + 147 * v))
            elif b > r * 1.15 or (g > r * 1.15 and b > r * 1.15):
                # Glass and luminous pixels preserve a bright cyan ramp.
                v = value / 255
                rgb = (round(30 + 165 * v), round(100 + 149 * v), round(150 + 105 * v))
            elif r > g * 1.2:
                # Red identification lights become ice-white emitters.
                v = value / 255
                rgb = (round(80 + 117 * v), round(140 + 108 * v), round(165 + 90 * v))
            else:
                # Purple machinery becomes cold gray, still separately shaded.
                v = (.2126 * r + .7152 * g + .0722 * b) / 255
                rgb = (round(26 + 132 * v), round(32 + 149 * v), round(46 + 163 * v))
            out.putpixel((x, y), (*rgb, a))
    return out


def blank():
    return Image.new("RGBA", (SIZE, SIZE))


def paired(im, part, left, right=None):
    im.alpha_composite(part, left)
    mirrored = ImageOps.mirror(part)
    right = right or (SIZE - left[0] - part.width, left[1])
    im.alpha_composite(mirrored, right)


def brace(im, points, width=3):
    # Short load-bearing spars join authored modules, not long disconnected rays.
    draw = ImageDraw.Draw(im)
    draw.line(points, fill=(10, 19, 28, 255), width=width + 2)
    draw.line(points, fill=(62, 99, 120, 255), width=width)
    draw.line([(x, y - 1) for x, y in points], fill=(133, 184, 202, 255), width=1)


def barrel(im, x, y):
    # Selected 3x9 gun barrel crop from the artist's Frigate armor machinery.
    im.alpha_composite(gun, (x - 1, y))
    draw = ImageDraw.Draw(im)
    draw.line([(x, y), (x, y + 4)], fill=(156, 240, 255, 255))


def bounds(im):
    b = im.getbbox()
    return {"x": b[0], "y": b[1], "width": b[2] - b[0], "height": b[3] - b[1]}


def write(key, im):
    im = im.resize((SIZE * SCALE, SIZE * SCALE), NEAREST)
    im.save(OUT / (key + ".png"), optimize=True)
    item = {"key": key, "url": "/assets/pixel-fleet/" + key + ".png"}
    frames[key] = {**item, "canvasSize": SIZE * SCALE, "alphaBounds": bounds(im)}
    return item


def connected_areas(im):
    alpha = im.getchannel("A")
    remaining = {(x, y) for y in range(im.height) for x in range(im.width) if alpha.getpixel((x, y)) > 128}
    result = []
    while remaining:
        queue = [remaining.pop()]
        area = 0
        while queue:
            x, y = queue.pop()
            area += 1
            for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)]:
                q = (x + dx, y + dy)
                if q in remaining:
                    remaining.remove(q)
                    queue.append(q)
        result.append(area)
    return sorted(result, reverse=True)


def clean_airframe(im):
    """Discard tiny clipped edge flecks left by the bounded module crops."""
    remaining = {(x, y) for y in range(64) for x in range(64) if im.getpixel((x, y))[3] > 128}
    while remaining:
        group = [remaining.pop()]
        queue = group.copy()
        while queue:
            x, y = queue.pop()
            for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)]:
                q = (x + dx, y + dy)
                if q in remaining:
                    remaining.remove(q)
                    queue.append(q)
                    group.append(q)
        if len(group) <= 4:
            for p in group:
                im.putpixel(p, (0, 0, 0, 0))
    return im


with ZipFile(SOURCE / "Foozle_2DS0013_Void_FleetPack_2.zip") as z, ZipFile(SOURCE / "SpaceShooterAssetPack.zip") as projectiles:
    bases = {name: friendly(source_image(z, "Designs - Base", name + " - Base")) for name in ["Fighter", "Scout", "Bomber", "Frigate", "Torpedo Ship", "Battlecruiser"]}
    # Literal bounded crops are from the source64x64 PNG, not preview thumbnails.
    gun = bases["Frigate"].crop((18, 10, 21, 19))
    small_pod = bases["Frigate"].crop((12, 23, 21, 43))
    heavy_pod = bases["Battlecruiser"].crop((18, 17, 26, 46))
    heavy_wing = bases["Frigate"].crop((11, 20, 26, 48)).resize((11, 24), NEAREST)
    swept_wing = bases["Torpedo Ship"].crop((5, 19, 27, 39))
    short_wing = bases["Fighter"].crop((17, 28, 28, 42))
    bolt_sheet = Image.open(io.BytesIO(projectiles.read("SpaceShooterAssets/SpaceShooterAssetPack_Projectiles.png"))).convert("RGBA")
    bolt = friendly(bolt_sheet.crop((8, 16, 16, 24)))

    for ship_id, (slug, name, source_name, role) in enumerate([
        ("falcon", "Falcon", "Fighter", "Strike fighter"),
        ("raven", "Raven", "Scout", "Recon interceptor"),
        ("atlas", "Atlas", "Bomber", "Heavy gunship"),
    ]):
        base = bases[source_name]
        levels = {}
        previous = base.copy()
        engine_strip = friendly(source_image(z, "Engine Effects", source_name + " - Engine"))
        for level in range(1, 4):
            extra = blank()
            if level >= 2:
                if slug == "falcon":
                    brace(extra, [(15, 34), (25, 35), (39, 35), (49, 34)])
                    paired(extra, small_pod, (11, 25))
                elif slug == "raven":
                    brace(extra, [(15, 36), (26, 34), (38, 34), (49, 36)])
                    paired(extra, short_wing, (12, 25))
                    paired(extra, small_pod.crop((2, 5, 7, 19)), (17, 30))
                else:
                    brace(extra, [(12, 36), (25, 36), (39, 36), (52, 36)])
                    paired(extra, heavy_wing, (8, 22))
                    paired(extra, small_pod, (9, 29))
                for gx in [29, 35]:
                    barrel(extra, gx, 20 if slug != "raven" else 22)
            if level == 3:
                if slug == "raven":
                    brace(extra, [(5, 37), (25, 33), (39, 33), (59, 37)])
                    paired(extra, swept_wing, (2, 20))
                    paired(extra, small_pod.crop((2, 2, 7, 19)), (7, 28))
                elif slug == "falcon":
                    brace(extra, [(6, 37), (25, 35), (39, 35), (58, 37)])
                    paired(extra, swept_wing, (2, 24))
                    paired(extra, small_pod, (5, 28))
                else:
                    brace(extra, [(5, 38), (24, 35), (40, 35), (59, 38)])
                    paired(extra, swept_wing, (2, 25))
                    paired(extra, heavy_pod, (3, 22))
                for gx in [27, 32, 37]:
                    barrel(extra, gx, 17 if slug != "raven" else 19)

            body = extra.copy()
            body.alpha_composite(base)
            # Gun barrels sit in front; all mounts overlap the source hull.
            gun_xy = [(32, 20 if slug != "raven" else 23)] if level == 1 else [(29, 20), (35, 20)] if level == 2 else [(27, 17), (32, 17), (37, 17)]
            if slug == "raven" and level > 1:
                gun_xy = [(x, y + 2) for x, y in gun_xy]
            for x, y in gun_xy:
                barrel(body, x, y)
            body = clean_airframe(body)
            key = f"pixel-{slug}-{level}"
            item = write(key, body)
            level_definition = {"level": level, **item, "canvasSize": 192, "anchor": {"x": 96, "y": 96}, "alphaBounds": frames[key]["alphaBounds"], "gunMounts": [{"x": x * SCALE, "y": y * SCALE} for x, y in gun_xy]}

            engine_frames = []
            for f in range(8):
                engine = engine_strip.crop((f * 64, 0, (f + 1) * 64, 64))
                if level >= 2:
                    plume = engine.crop((24, 43, 40, 60)).resize((7, 15), NEAREST)
                    paired(engine, plume, (13 if slug != "atlas" else 8, 43))
                if level == 3:
                    plume = engine.crop((24, 43, 40, 60)).resize((5, 13), NEAREST)
                    paired(engine, plume, (4, 44))
                engine_frames.append(write(f"{key}-engine-{f}", engine))
            level_definition["engineFrames"] = engine_frames

            muzzle_frames = []
            for f in range(3):
                muzzle = blank()
                flash = bolt.resize((3 + (f == 1) * 2, 5 + (f == 1) * 2), NEAREST)
                if f == 2:
                    flash.putalpha(flash.getchannel("A").point(lambda a: round(a * .55)))
                for gx, gy in gun_xy:
                    muzzle.alpha_composite(flash, (gx - flash.width // 2, gy - flash.height + 1))
                muzzle_frames.append(write(f"{key}-muzzle-{f}", muzzle))
            level_definition["muzzleFrames"] = muzzle_frames

            bank_frames = {}
            for direction in [-1, 1]:
                bank = blank()
                # Centered pixel perspective squeeze, no change in logical hitbox.
                squeezed = body.resize((58, 64), NEAREST)
                bank.alpha_composite(squeezed, (3, 0))
                dark = bank.copy()
                for y in range(64):
                    for x in range(64):
                        r, g, b, a = dark.getpixel((x, y))
                        if a and ((direction < 0 and x > 32) or (direction > 0 and x < 32)):
                            dark.putpixel((x, y), (round(r * .72), round(g * .78), round(b * .84), a))
                bank_frames["left" if direction < 0 else "right"] = write(f"{key}-bank-{'left' if direction < 0 else 'right'}", dark)
            level_definition["bankFrames"] = bank_frames

            unfold_frames = []
            if level > 1:
                for f in range(4):
                    progress = (f + 1) / 4
                    unfolded = blank()
                    # Equipment slides from the hull to its fixed sockets.
                    left = extra.crop((0, 0, 32, 64))
                    right = extra.crop((32, 0, 64, 64))
                    shift = round((1 - progress) * 7)
                    unfolded.alpha_composite(left, (shift, 0))
                    unfolded.alpha_composite(right, (32 - shift, 0))
                    unfolded.alpha_composite(base)
                    for x, y in gun_xy:
                        barrel(unfolded, x, y)
                    if f == 3:
                        unfolded = body.copy()
                    unfolded = clean_airframe(unfolded)
                    unfold_frames.append(write(f"{key}-unfold-{f}", unfolded))
            level_definition["unfoldFrames"] = unfold_frames
            levels[str(level)] = level_definition
            previous = body
        definitions.append({"id": ship_id, "name": name, "slug": slug, "role": role, "sourceHull": "Nairan " + source_name, "displayWidth": 132, "levels": levels})

manifest = {"canvasSize": 192, "anchor": {"x": 96, "y": 96}, "sampling": "nearest", "frames": frames, "ships": definitions}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
credits = {
    "sources": [
        {"title": "Void Fleet Pack 2", "artist": "Baldur", "distributor": "Foozle", "archive": "Foozle_2DS0013_Void_FleetPack_2.zip", "license": "CC0 1.0", "licenseURL": "https://creativecommons.org/publicdomain/zero/1.0/", "changes": "Fighter, Scout and Bomber body pixels; bounded Frigate/Torpedo/Battlecruiser machinery crops; mirrored modules, short original attachment spars, cyan/silver recoloring, banks, unfolding and8engine frames. Integer nearest scaling preserves authored pixel edges."},
        {"title": "Space Shooter Asset Pack", "artist": "Gustavo Vituri", "url": "https://gvituri.itch.io/space-shooter", "archive": "SpaceShooterAssetPack.zip", "license": "Personal/commercial game use and modifications allowed; no standalone pack redistribution", "changes": "Selected authored projectile cell adapted into three short muzzle-flash frames."},
    ],
    "originalArchivesPublished": False,
    "apkArtworkUsed": False,
    "generativeImagesUsed": False,
}
(OUT / "credits.json").write_text(json.dumps(credits, indent=2), encoding="utf-8")
(OUT / "LICENSE.txt").write_text("Nairan-derived ship and engine artwork: Baldur / Foozle, Void Fleet Pack2, CC0 1.0. https://creativecommons.org/publicdomain/zero/1.0/\nMuzzle flashes: selected adapted pixels from Space Shooter Asset Pack by Gustavo Vituri, https://gvituri.itch.io/space-shooter . Game integration and modification permitted; do not redistribute the source pack.\nNo Thunder Strike asset or generative image is included. See credits.json and scripts/build-pixel-fleet-assets.py.\n", encoding="utf-8")

ts = '''/** Artist-authored pixel fleet. Model stats deliberately do not belong here. */
export type ShipId = 0 | 1 | 2;
export type ShipLevel = 1 | 2 | 3;
export interface FleetImage { readonly key: string; readonly url: string; }
export interface ShipLevelDefinition extends FleetImage {
  readonly level: ShipLevel;
  readonly canvasSize: number;
  readonly anchor: { readonly x: number; readonly y: number };
  readonly alphaBounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly gunMounts: readonly { readonly x: number; readonly y: number }[];
  readonly engineFrames: readonly FleetImage[];
  readonly muzzleFrames: readonly FleetImage[];
  readonly bankFrames: { readonly left: FleetImage; readonly right: FleetImage };
  readonly unfoldFrames: readonly FleetImage[];
}
export interface ShipDefinition {
  readonly id: ShipId;
  readonly name: string;
  readonly slug: string;
  readonly role: string;
  readonly sourceHull: string;
  readonly displayWidth: number;
  readonly levels: Readonly<Record<ShipLevel, ShipLevelDefinition>>;
}
export const SHIPS: readonly ShipDefinition[] = ''' + json.dumps(definitions, indent=2) + ''';
export function normalizeShipId(value: unknown): ShipId {
  return value === 1 || value === 2 ? value : 0;
}
export function pixelShip(id: unknown): ShipDefinition {
  return SHIPS[normalizeShipId(id)];
}
export const PIXEL_FLEET_IMAGES: readonly FleetImage[] = SHIPS.flatMap(ship =>
  ([1, 2, 3] as const).flatMap(level => {
    const f = ship.levels[level];
    return [f, ...f.engineFrames, ...f.muzzleFrames, f.bankFrames.left,
      f.bankFrames.right, ...f.unfoldFrames];
  }),
);
'''
(ROOT / "src/pixel-fleet.ts").write_text(ts, encoding="utf-8")

contact = Image.new("RGB", (1080, 1080), "#06111c")
draw = ImageDraw.Draw(contact)
checks = []
for ship in definitions:
    for level in range(1, 4):
        definition = ship["levels"][str(level)]
        im = Image.open(OUT / (definition["key"] + ".png")).convert("RGBA")
        x, y = (level - 1) * 360, ship["id"] * 360
        # Contact shows every source pixel doubled from the runtime192canvas.
        sample = im.resize((320, 320), NEAREST)
        contact.paste(sample, (x + 20, y + 3), sample)
        draw.text((x + 22, y + 320), ship["name"].upper() + " / LEVEL " + str(level), fill="#cceef5")
        native = im.resize((64, 64), NEAREST)
        components = connected_areas(native)
        significant = [n for n in components if n > 4]
        b = im.getbbox()
        check = {"ship": ship["name"], "level": level, "alphaBounds": definition["alphaBounds"], "componentAreasAt64px": components, "connectedMajorSilhouette": len(significant) == 1, "clipped": b[0] <= 0 or b[1] <= 0 or b[2] >= 192 or b[3] >= 192, "sameAnchor": definition["anchor"] == {"x": 96, "y": 96}}
        checks.append(check)
contact.save(ART / "pixel-fleet-contact.png")
report = {"forms": 9, "runtimeImages": len(frames), "pngBytes": sum(p.stat().st_size for p in OUT.glob("*.png")), "sampling": "nearest,3xinteger", "checks": checks, "allMajorSilhouettesConnected": all(c["connectedMajorSilhouette"] for c in checks), "noClipping": not any(c["clipped"] for c in checks)}
(ART / "pixel-fleet-checks.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
assert report["allMajorSilhouettesConnected"], "Disconnected authored module: inspect contact sheet"
assert report["noClipping"], "Airframe touches canvas edge"
