"""Prepare Mobile Onslaught artwork from the user's CC0 packs.

No source archives are redistributed. Ships are assembled from authored Foozle
pixels, with small matching structural spars / gun housings drawn here. Semantic
pickup symbols and shield geometry are purpose-drawn, not generated imagery.
Run with Python 3 + Pillow from any directory.
"""
from pathlib import Path
import io
import json
import math
import zipfile
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Desktop/Space_combat"
OUT = ROOT / "public/assets/onslaught"
OUT.mkdir(parents=True, exist_ok=True)
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
N = Image.Resampling.NEAREST
archives = {}


def archive(name):
    if name not in archives:
        archives[name] = zipfile.ZipFile(SOURCE / name)
    return archives[name]


def image(z, name):
    return Image.open(io.BytesIO(z.read(name))).convert("RGBA")


def ship(pack, name, kind="Base", frame=0):
    prefix = "Kla'ed" if pack == 1 else "Nairan"
    z = archive(f"Foozle_2DS001{pack + 1}_Void_FleetPack_{pack}.zip")
    member = next(n for n in z.namelist() if "/PNGs/" in n and
                  f"{prefix} - {name} - {kind}" in n.replace("  ", " ") and n.endswith(".png"))
    im = image(z, member)
    if im.width > im.height:
        cell = im.height
        count = im.width // cell
        index = min(count - 1, frame)
        im = im.crop((index * cell, 0, (index + 1) * cell, cell))
    return im.rotate(180)


def save(name, im):
    im.save(OUT / f"{name}.png", optimize=True)


def hit_mask(im):
    mask = Image.new("RGBA", im.size, "white")
    mask.putalpha(im.getchannel("A"))
    return mask


def largest_component(im):
    """A deliberate crop can capture a few pixels from a neighboring hull part."""
    alpha=im.getchannel("A");seen=set();largest=[]
    for y in range(im.height):
        for x in range(im.width):
            if (x,y) in seen or not alpha.getpixel((x,y)):continue
            queue=[(x,y)];seen.add((x,y));component=[]
            while queue:
                point=queue.pop();component.append(point)
                for nx,ny in [(point[0]-1,point[1]),(point[0]+1,point[1]),(point[0],point[1]-1),(point[0],point[1]+1)]:
                    if 0<=nx<im.width and 0<=ny<im.height and (nx,ny) not in seen and alpha.getpixel((nx,ny)):
                        seen.add((nx,ny));queue.append((nx,ny))
            if len(component)>len(largest):largest=component
    cleaned=Image.new("RGBA",im.size)
    for point in largest:cleaned.putpixel(point,im.getpixel(point))
    return cleaned


PALETTES = [
    ("#241923", "#76352f", "#b34d3b", "#f5aa73", "#ffe1a1"),
    ("#181c26", "#344d48", "#796384", "#b4eca0", "#e4ffd5"),
    ("#261c26", "#733b37", "#b66d44", "#ffd071", "#fff3bd"),
]


def turret(stage):
    # Transparent origin is centered; the long forward barrel ends at y=35.
    dark, base, armor, glow, bright = PALETTES[stage]
    im = Image.new("RGBA", (28, 40))
    d = ImageDraw.Draw(im)
    d.polygon([(5, 3), (22, 3), (26, 9), (23, 25), (5, 25), (1, 9)], fill=dark)
    d.polygon([(6, 5), (21, 5), (24, 10), (21, 22), (6, 22), (3, 10)], fill=base)
    d.rectangle((6, 7, 21, 11), fill=armor)
    d.rectangle((7, 12, 20, 20), fill=dark)
    d.rectangle((9, 14, 18, 23), fill=armor)
    for x in (8, 16):
        d.rectangle((x, 18, x+3, 35), fill=dark)
        d.rectangle((x+1, 19, x+2, 34), fill=armor)
        d.rectangle((x, 31, x+3, 33), fill=glow)
    d.rectangle((10, 8, 17, 9), fill=bright)
    d.rectangle((4, 13, 5, 18), fill=glow)
    d.rectangle((22, 13, 23, 18), fill=glow)
    return im


def spar(d, box, stage):
    dark, base, armor, glow, _ = PALETTES[stage]
    x1, y1, x2, y2 = box
    d.rectangle(box, fill=dark)
    d.rectangle((x1+2, y1+2, x2-2, y2-2), fill=base)
    if x2-x1 > y2-y1:
        d.line((x1+4, y1+3, x2-4, y1+3), fill=armor, width=2)
        d.line((x1+4, y2-4, x2-4, y2-4), fill=glow, width=1)
        for x in range(x1+6, x2-3, 10):
            d.line((x, y1+5, x+4, y2-5), fill=dark, width=2)
    else:
        d.line((x1+3, y1+3, x1+3, y2-3), fill=armor, width=2)
        d.line((x2-4, y1+3, x2-4, y2-3), fill=glow, width=1)


BOSSES = [
    dict(pack=1, name="Battlecruiser", crop=(16, 0, 224, 240), origin=(48, 20),
         mounts=[(56,160),(184,160)]),
    dict(pack=2, name="Battlecruiser", crop=(16, 0, 224, 240), origin=(58, 10),
         mounts=[(45,144),(195,144),(72,192),(168,192)]),
    dict(pack=1, name="Dreadnought", crop=(0, 0, 240, 264), origin=(48, 10),
         mounts=[(24,144),(216,144),(24,190),(216,190),(96,222),(144,222)]),
]

boss_previews = []
for stage, definition in enumerate(BOSSES):
    canvas = Image.new("RGBA", (240, 264))
    d = ImageDraw.Draw(canvas)
    base = ship(definition["pack"], definition["name"])
    bounds = base.getbbox()
    hull = base.crop(bounds)
    hull = hull.resize((hull.width*2, hull.height*2), N)
    ox, oy = definition["origin"]
    if stage == 0:
        for box in [(30,92,88,114),(152,92,210,114),
                    (44,105,67,164),(173,105,196,164)]:
            spar(d, box, stage)
    elif stage == 1:
        # Preserve the artist's swept Nairan wing pixels; broad spars connect
        # every extension to the carrier body rather than floating accessories.
        frigate = ship(2, "Frigate")
        wing = largest_component(frigate.crop((11,13,25,55))).resize((28,84), N)
        canvas.alpha_composite(wing, (17,57))
        canvas.alpha_composite(ImageOps.mirror(wing), (195,57))
        for box in [(29,93,84,112),(156,93,211,112),
                    (34,105,55,148),(185,105,206,148),
                    (61,143,83,198),(157,143,179,198)]:
            spar(d, box, stage)
    else:
        cruiser = ship(1, "Battlecruiser")
        wing = largest_component(cruiser.crop((28,28,46,90))).resize((36,124), N)
        canvas.alpha_composite(wing, (4,35))
        canvas.alpha_composite(ImageOps.mirror(wing), (200,35))
        for box in [(17,89,87,111),(153,89,223,111),
                    (12,105,35,196),(205,105,228,196),
                    (85,180,106,225),(134,180,155,225)]:
            spar(d, box, stage)
    canvas.alpha_composite(hull, (ox,oy))
    # Mount sockets remain on the hull after a separately drawn turret dies.
    d = ImageDraw.Draw(canvas)
    dark, material, armor, accent, _ = PALETTES[stage]
    for x,y in definition["mounts"]:
        d.ellipse((x-12,y-9,x+12,y+9),fill=dark,outline=armor,width=2)
        d.rectangle((x-6,y-3,x+6,y+4),fill=material)
        d.line((x-8,y-6,x+8,y-6),fill=accent,width=1)
    cropped = canvas.crop(definition["crop"])
    save(f"boss-{stage}", cropped)
    save(f"boss-{stage}-hit", hit_mask(cropped))
    gun = turret(stage)
    save(f"turret-{stage}", gun)
    save(f"turret-{stage}-hit", hit_mask(gun))
    preview = canvas.copy()
    for x,y in definition["mounts"]:
        preview.alpha_composite(gun, (x-gun.width//2,y-gun.height//2))
    preview = preview.crop(definition["crop"])
    save(f"boss-{stage}-preview", preview)
    boss_previews.append(preview)
    for frame in range(8):
        engine = ship(definition["pack"], definition["name"], "Engine", frame)
        engine = engine.resize((engine.width*2,engine.height*2), N)
        effect = Image.new("RGBA",canvas.size)
        effect.alpha_composite(engine,(ox-bounds[0]*2,oy-bounds[1]*2))
        save(f"boss-{stage}-engine-{frame}",effect.crop(definition["crop"]))


# Stage-specific ordinary fleets; common frame anchor includes untrimmed hull.
for stage, pack, names in [(0,1,["Scout","Fighter","Frigate"]),
                            (1,2,["Scout","Fighter","Frigate"]),
                            (2,1,["Fighter","Frigate","Battlecruiser"])]:
    for kind,name in enumerate(names):
        base = ship(pack,name)
        # Keep transparent source margins identical across hull/effect frames.
        save(f"enemy-{stage}-{kind}",base)
        save(f"enemy-{stage}-{kind}-hit",hit_mask(base))
        for effect, sourcekind in [("engine","Engine"),("destroy","Destruction")]:
            for frame in range(8):
                save(f"enemy-{stage}-{kind}-{effect}-{frame}",ship(pack,name,sourcekind,frame))


COLORS = {"weapon":"#7bdfff","missile":"#ffbf6b","drone":"#c7a4ff",
          "shield":"#68e9ed","repair":"#a7f28a","energy":"#ffe57d"}


def badge(kind):
    im=Image.new("RGBA",(96,96));d=ImageDraw.Draw(im);c=COLORS[kind]
    d.polygon([(24,5),(71,5),(91,25),(91,71),(71,91),(24,91),(5,71),(5,25)],
              fill="#080f1feF",outline=c,width=4)
    d.line([(26,12),(68,12),(84,28)],fill="#e9f8ff",width=2)
    d.line([(12,63),(12,69),(27,84)],fill=c,width=3)
    if kind=="weapon":
        for x,y in [(28,39),(48,28),(68,39)]:
            d.polygon([(x,y-11),(x-6,y),(x-3,y),(x-3,65),(x+3,65),(x+3,y),(x+6,y)],fill=c)
        d.rectangle((29,70,67,74),fill="#f2fdff")
    elif kind=="missile":
        for x,y in [(36,43),(60,49)]:
            d.polygon([(x,y-22),(x-7,y-8),(x-7,y+17),(x-13,y+23),(x-5,y+21),
                       (x+5,y+21),(x+13,y+23),(x+7,y+17),(x+7,y-8)],fill=c)
            d.rectangle((x-3,y-9,x+3,y+10),fill="#fff5dd")
    elif kind=="drone":
        for x in (29,67):
            d.polygon([(x,30),(x-12,42),(x-9,59),(x,66),(x+9,59),(x+12,42)],fill=c)
            d.rectangle((x-3,39,x+3,51),fill="#101726")
            d.rectangle((x-5,65,x+5,72),fill="#e9f8ff")
        d.line((42,50,54,50),fill="#f4efff",width=3)
    elif kind=="shield":
        d.polygon([(48,22),(72,31),(69,54),(61,67),(48,77),(35,67),(27,54),(24,31)],
                  fill="#153643",outline=c,width=5)
        d.line((48,31,48,65),fill="#ebffff",width=4)
        d.line((33,40,63,40),fill="#ebffff",width=3)
    elif kind=="repair":
        d.rectangle((22,31,74,69),fill="#20382c",outline=c,width=4)
        d.rectangle((37,23,59,31),fill=c)
        d.rectangle((44,38,52,62),fill="#efffe8")
        d.rectangle((36,46,60,54),fill="#efffe8")
    else:
        d.rounded_rectangle((27,23,69,75),radius=5,fill="#343125",outline=c,width=4)
        d.rectangle((39,17,57,24),fill=c)
        d.polygon([(51,30),(36,51),(46,51),(42,69),(61,44),(50,44)],fill="#fff6ce")
    return im


for kind in COLORS:
    save(f"pickup-{kind}",badge(kind))


# Red Overdrive keeps Laser2020's original alpha / intensity distribution and
# white-hot center. Only the hue of the blue projectile changes. The exported
# projectile points UP, so the runtime needs no compensating quarter turn.
z=archive("Sprites - Lasers Bullets #1 [66]v2.5.zip")
source_shot=image(z,"Laser Sprites/11.png")
red_shot=source_shot.copy()
for y in range(source_shot.height):
    for x in range(source_shot.width):
        r,g,b,a=source_shot.getpixel((x,y))
        brightest=max(r,g,b);darkest=min(r,g,b);chroma=brightest-darkest
        red_shot.putpixel((x,y),(brightest,round(darkest+chroma*.10),round(darkest+chroma*.20),a))
save("red-shot",red_shot.rotate(90,expand=True))


# Visible shield with a thin hexagonal lattice; the empty center preserves ship
# readability. Shared frame size and rotation keep the anchor perfectly stable.
for frame in range(8):
    im=Image.new("RGBA",(128,152));d=ImageDraw.Draw(im)
    pulse=frame/8*math.tau
    outer=[(64,5),(110,29),(123,82),(99,132),(64,147),(29,132),(5,82),(18,29),(64,5)]
    d.line(outer,fill=(95,229,255,125+round(40*math.sin(pulse))),width=3,joint="curve")
    d.ellipse((13,14,115,141),outline=(84,213,255,80),width=2)
    for index in range(8):
        angle=index*math.tau/8+pulse*.15
        x=64+52*math.cos(angle);y=76+65*math.sin(angle)
        d.ellipse((x-2,y-2,x+2,y+2),fill=(213,255,255,230))
    for row in range(3):
        for col in range(5):
            x=23+col*20+(row%2)*10;y=36+row*36
            if abs(x-64)>37:continue
            points=[(x+10*math.cos(a*math.tau/6),y+12*math.sin(a*math.tau/6)) for a in range(7)]
            d.line(points,fill=(100,225,255,35),width=1)
    save(f"shield-{frame}",im)


# Artist sparkle strip is the core of the larger hit effect; short angular rays
# make the contact readable at 20px without obscuring bullets.
z=archive("Mini Pixel Pack 3.zip")
spark_strip=image(z,next(n for n in z.namelist() if n.endswith("Sparkle (16 x 16).png")))
for frame in range(6):
    im=Image.new("RGBA",(64,64));d=ImageDraw.Draw(im);p=frame/6
    for ray in range(8):
        a=ray*math.tau/8+.2;start=3+p*9;end=10+p*18
        d.line((32+math.cos(a)*start,32+math.sin(a)*start,
                32+math.cos(a)*end,32+math.sin(a)*end),
               fill=(255,199,91,round(255*(1-p))),width=max(1,3-frame//2))
    f=min(spark_strip.width//16-1,frame)
    core=spark_strip.crop((f*16,0,(f+1)*16,16)).resize((32,32),N)
    im.alpha_composite(core,(16,16));save(f"spark-{frame}",im)

for frame in range(8):
    im=Image.new("RGBA",(96,96));d=ImageDraw.Draw(im);p=frame/8
    radius=8+34*p
    d.ellipse((48-radius,48-radius,48+radius,48+radius),outline=(126,231,255,round(255*(1-p))),width=max(1,5-frame//2))
    for index in range(12):
        a=index*math.tau/12+.15;distance=10+30*p
        x=48+math.cos(a)*distance;y=48+math.sin(a)*distance
        color=(202,241,255,round(255*(1-p))) if index%2 else (255,196,112,round(255*(1-p)))
        d.rectangle((x-2,y-2,x+2,y+2),fill=color)
    d.ellipse((43,43,53,53),fill=(235,255,255,round(255*(1-p))))
    save(f"drone-burst-{frame}",im)


# Literal path matching handles the source archive's Cyrillic initial C safely.
z=archive("Assets Wenrexa UI Sci-Fi Minimalism #01.zip")
for filename,key in [("BtnDefault.png","ui-button"),("TopMenu2.png","ui-header"),
                     ("ItemDisable.png","ui-item"),("BtnBack.png","ui-back")]:
    member=next(n for n in z.namelist() if n.endswith("/"+filename))
    save(key,image(z,member))


# Segmented hull and independent shield token for DOM HUD use.
for active in [False,True]:
    im=Image.new("RGBA",(72,24));d=ImageDraw.Draw(im)
    d.polygon([(7,1),(71,1),(65,22),(1,22)],fill="#0e1826",outline="#486078",width=2)
    d.polygon([(10,5),(65,5),(61,18),(6,18)],fill="#8de7c7" if active else "#27394a")
    if active:d.line((13,7,61,7),fill="#e4fff6",width=2)
    save("hull-full" if active else "hull-empty",im)


# Contact sheet is deliberately outside public shipping files.
sheet=Image.new("RGB",(1000,680),"#080e19");d=ImageDraw.Draw(sheet)
for stage,im in enumerate(boss_previews):
    factor=min(280/im.width,295/im.height)
    preview=im.resize((round(im.width*factor),round(im.height*factor)),N)
    x=stage*330+(330-preview.width)//2;y=30
    sheet.paste(preview,(x,y),preview)
    d.text((stage*330+18,12),["KLA'ED SIEGEBREAKER","NAIRAN INTERDICTOR","CITADEL DREADNOUGHT"][stage],fill="#d8e8f8")
for index,kind in enumerate(COLORS):
    im=badge(kind);x=55+index*150;y=375;sheet.paste(im,(x,y),im)
    d.text((x,y+105),kind.upper(),fill=COLORS[kind])
for frame in range(8):
    im=Image.open(OUT/f"shield-{frame}.png");im.thumbnail((65,80),N)
    sheet.paste(im,(35+frame*120,550),im)
sheet.save(ARTIFACTS/"onslaught-assets.jpg",quality=94)

provenance={
    "bosses_and_escorts": {"artist":"Baldur; commissioned and distributed by Foozle", "source":["Foozle_2DS0012_Void_FleetPack_1.zip","Foozle_2DS0013_Void_FleetPack_2.zip"],"license":"CC0 (pack README)","modifications":"Rotated toward player; hull/wing assembly; drawn matching spars, sockets and separate turret housings. Original engine/destruction frames retained."},
    "ui": {"artist":"Wenrexa","source":"Assets Wenrexa UI Sci-Fi Minimalism #01.zip","license":"CC0","url":"https://wenrexa.itch.io/nesia01","files":["BtnDefault.png","TopMenu2.png","ItemDisable.png","BtnBack.png"]},
    "sparks": {"artist":"GrafxKid","source":"Mini Pixel Pack 3.zip","license":"CC0 (pack LICENSE.txt)","files":["Sparkle (16 x 16).png"],"modifications":"Core sparkle combined with short hand-coded rays."},
    "red_overdrive_projectile": {"artist":"Wenrexa","source":"Sprites - Lasers Bullets #1 [66]v2.5.zip","files":["Laser Sprites/11.png"],"modifications":"Red hue remap preserves alpha, brightest-channel intensity, saturation and white-hot center; rotated to point upward.","license":"Same Laser2020 terms and credits as the existing environment laser assets; no source ZIP redistributed."},
    "original_additions":{"files":"Semantic pickup badges, segmented hull, shield lattice, drone burst, matching turret geometry","method":"Purpose-drawn vector/pixel geometry in build script; no generative imagery","license":"CC0"},
}
(OUT/"credits.json").write_text(json.dumps(provenance,indent=2),encoding="utf-8")
for z in archives.values():z.close()
print(f"Prepared {len(list(OUT.glob('*.png')))} runtime images; preview artifacts/onslaught-assets.jpg")
