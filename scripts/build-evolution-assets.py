"""Prepare selected artist artwork for Evolution Arcade; no source archives ship.

Uses Pillow and the user's local asset archives. Frames are sliced from authored
pixels, meteor contours are baked for Canvas compatibility, and GUI text stays
in semantic HTML rather than in the button image.
"""
from pathlib import Path
from zipfile import ZipFile
import io, json, math, shutil
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / 'Desktop/Space_combat'
OUT = ROOT / 'public/assets/evolution'
ARTIFACTS = ROOT / 'artifacts'
OUT.mkdir(parents=True, exist_ok=True)
ARTIFACTS.mkdir(exist_ok=True)
N = Image.Resampling.NEAREST
L = Image.Resampling.LANCZOS
frames = {}

def pic(z, member):
    return Image.open(io.BytesIO(z.read(member))).convert('RGBA')

def save(key, im, **metadata):
    im.save(OUT / (key + '.png'), optimize=True)
    frames[key] = {'path': '/assets/evolution/' + key + '.png',
                   'width': im.width, 'height': im.height,
                   'anchor': [0.5, 0.5], **metadata}

def cell(sheet, box, size=None):
    im = sheet.crop(box)
    box = im.getbbox()
    if box: im = im.crop(box)
    if size: im = im.resize(size, N)
    return im

def recolor_cyan(im, target):
    out = im.copy()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = out.getpixel((x, y))
            if a and b > r * 1.2 and g > r * 1.2:
                brightness = max(r, g, b) / 255
                out.putpixel((x, y), (*[round(v * brightness) for v in target], a))
    return out

def friendly_palette(im):
    """Preserve authored pixel silhouettes while reserving warm hues for foes.

    Neutral pixels become cool silver/steel. Colored pixels and engine flames
    share the player's cyan/white system palette, retaining luminance detail.
    """
    out=im.copy()
    for y in range(out.height):
        for x in range(out.width):
            r,g,b,a=out.getpixel((x,y))
            if not a: continue
            luminance=(.2126*r+.7152*g+.0722*b)/255
            if max(r,g,b)-min(r,g,b)<35:
                out.putpixel((x,y),(round(r*.82),round(g*.94),b,a))
            else:
                value=.75*luminance**.75+.25*max(r,g,b)/255
                low=(12,36,54);high=(155,244,255)
                out.putpixel((x,y),(*[round(lo+(hi-lo)*value) for lo,hi in zip(low,high)],a))
    return out

with ZipFile(SOURCE / 'SpaceShooterAssetPack.zip') as z:
    projectiles = pic(z, 'SpaceShooterAssets/SpaceShooterAssetPack_Projectiles.png')
    ships = pic(z, 'SpaceShooterAssets/SpaceShooterAssetPack_Ships.png')
    misc = pic(z, 'SpaceShooterAssets/SpaceShooterAssetPack_Miscellaneous.png')
    # Up-pointing plasma darts and multi-pixel missile. The original projectiles
    # are 8px cells; names here describe their runtime use, not source labels.
    pulse = cell(projectiles, (8, 16, 16, 24)).resize((12, 24), N)
    plasma = cell(projectiles, (8, 8, 16, 16)).resize((16, 28), N)
    save('evo-pulse', recolor_cyan(pulse, (110, 230, 255)), displayWidth=10, forward='up')
    save('evo-plasma', plasma, displayWidth=13, forward='up')
    red = pulse.copy()
    for y in range(red.height):
        for x in range(red.width):
            r,g,b,a = red.getpixel((x,y))
            if a:
                brightness = max(r,g,b)/255
                red.putpixel((x,y),(round(255*brightness),round(70*brightness),round(100*brightness),a))
    save('evo-red', red, displayWidth=11, forward='up')
    save('evo-missile', cell(projectiles, (32, 16, 40, 24)).resize((16, 28), N), displayWidth=12, forward='up')
    # The cyan authored horizontal beam is rotated to the vertical game axis.
    beam = cell(projectiles, (0, 64, 24, 72)).rotate(90, expand=True)
    save('evo-beam-core', beam, displayWidth=8, forward='up', scalableAxis='y')
    save('evo-beam-cap', beam.crop((0,0,beam.width,min(8,beam.height))), displayWidth=10, forward='up')
    # Three different fighter silhouettes from the authored8x8 ship table.
    for level, box in enumerate([(64,24,72,32),(48,32,56,40),(40,32,48,40)], 1):
        fighter=cell(ships,box)
        scale = 4
        save(f'wingman-{level}', friendly_palette(fighter).resize((fighter.width*scale,fighter.height*scale),N),
             displayWidth=[25,30,35][level-1], forward='up', palette='friendly cyan/silver; authored silhouette and alpha retained')
    for frame in range(4):
        # Authored orange booster from the top-right of Miscellaneous sheet.
        flame=cell(misc,(40+frame*8,0,48+frame*8,8))
        if not flame.getbbox(): flame=cell(misc,(40,0,48,8))
        save(f'wingman-thruster-{frame}',friendly_palette(flame).resize((max(4,flame.width*3),max(9,flame.height*3)),N),displayWidth=7,palette='friendly cyan/white engine emission')
    # Authored expanding impact marks along the fourth projectile row.
    for frame, box in enumerate([(32,24,40,32),(24,24,32,32),(16,32,24,40),(0,32,8,40)]):
        spark=cell(projectiles,box)
        save(f'evo-spark-{frame}',spark.resize((spark.width*4,spark.height*4),N),displayWidth=20)

with ZipFile(SOURCE / 'Lunar Lander Assets 24-11-20.zip') as z:
    strip=pic(z,next(n for n in z.namelist() if n.endswith('/Asteroids.png')))
    for index in range(4):
        rock=strip.crop((index*64,0,(index+1)*64,64))
        box=rock.getbbox()
        if box: rock=rock.crop(box)
        rock.thumbnail((58,58),N)
        base=Image.new('RGBA',(76,76))
        base.alpha_composite(rock,((76-rock.width)//2,(76-rock.height)//2))
        alpha=base.getchannel('A')
        solid=alpha.point(lambda p:255 if p>20 else 0)
        outer=solid.filter(ImageFilter.MaxFilter(9))
        inner=solid.filter(ImageFilter.MaxFilter(5))
        gray=ImageOps.grayscale(base).point(lambda p:round(100+155*(p/255)**0.7))
        shaded=ImageOps.colorize(gray,'#5e6674','#fff0c0').convert('RGBA')
        shaded.putalpha(alpha)
        composed=Image.new('RGBA',base.size)
        shadow=Image.new('RGBA',base.size,'#01040b');shadow.putalpha(outer);composed.alpha_composite(shadow)
        outline=Image.new('RGBA',base.size,'#fff1c9');outline.putalpha(inner);composed.alpha_composite(outline)
        composed.alpha_composite(shaded)
        # Small warm cracks stay clipped inside the opaque meteor silhouette.
        cracks=Image.new('RGBA',base.size)
        d=ImageDraw.Draw(cracks)
        x=27+index*4
        d.line([(x,23),(x+5,31),(x+1,39),(x+7,48)],fill='#ffd777',width=2)
        d.line([(x+4,31),(x+13,29)],fill='#fff4d3',width=1)
        cracks.putalpha(Image.composite(cracks.getchannel('A'),Image.new('L',base.size),solid))
        composed.alpha_composite(cracks)
        save(f'evo-meteor-{index}',composed,displayWidth=58,outline='black2px + warm-white2px silhouette contour',collision='model radius; art includes decorative contour')

with ZipFile(SOURCE / 'Space_Game_GUI_PNG.zip') as z:
    for key, member, maxsize in [
        ('ui-window','PNG/You_Win/Window.png',(640,736)),
        ('ui-pause','PNG/Pause/Window.png',(640,736)),
        ('ui-settings','PNG/Setting/Window.png',(640,954)),
        ('ui-panel','PNG/Accept/Window.png',(640,532)),
        ('ui-pause-button','PNG/Buttons/BTNs/Pause_BTN.png',(96,96)),
        ('ui-settings-button','PNG/Buttons/BTNs/Settings_BTN.png',(96,96)),
        ('ui-replay-button','PNG/Buttons/BTNs/Replay_BTN.png',(96,96)),
    ]:
        im=pic(z,member);im.thumbnail(maxsize,L);save(key,im)
    button=pic(z,'PNG/Main_Menu/Start_BTN.png')
    # Keep the author's bevel/edge texture but remove the pre-rendered START
    # glyphs. HTML supplies the accessible action name at runtime.
    material=pic(z,'PNG/You_Win/Window.png').crop((100,200,450,286))
    button.alpha_composite(material,(30,18))
    save('ui-button',button)
    active=button.copy()
    pixels=active.load()
    for y in range(active.height):
        for x in range(active.width):
            r,g,b,a=pixels[x,y]
            pixels[x,y]=(min(255,round(r*1.1)),min(255,round(g*1.16)),min(255,round(b*1.2)),a)
    save('ui-button-active',active)

with ZipFile(SOURCE/'NULLSIGNAL-UI-FREE-v1.1.zip') as z:
    prefix='NULLSIGNAL-UI-FREE/'
    for key,member in [('ui-progress','png/bars/progress-bar@2x.png'),('ui-corner','png/hud/corner-bracket@2x.png'),('ui-live','png/status/status-live@2x.png'),('ui-standby','png/status/status-standby@2x.png')]:
        save(key,pic(z,prefix+member))
    fonts=OUT/'fonts';fonts.mkdir(exist_ok=True)
    for name in ['ChakraPetch-Regular.ttf','ChakraPetch-Bold.ttf','ChakraPetch-SemiBold.ttf','OFL-ChakraPetch.txt','OFL-JetBrainsMono.txt']:
        (fonts/name).write_bytes(z.read(prefix+'fonts/'+name))
    (fonts/'JetBrainsMono.ttf').write_bytes(z.read(prefix+'fonts/JetBrainsMono[wght].ttf'))

# Universal bolt-on equipment is built in the same normalized square coordinate
# system as the base modules. Source files are640px; normalized output is512px.
modules=ROOT/'public/assets/modules'
hull=Image.open(modules/'hull-0.png').convert('RGBA')
wings=Image.open(modules/'wings-2.png').convert('RGBA')
engine=Image.open(modules/'engine-0.png').convert('RGBA')
pod=cell(hull,(286,114,350,320)).resize((34,118),N)
enginepod=engine.crop(engine.getbbox()).resize((19,42),N)
fin=cell(wings,(150,223,242,446)).resize((67,131),N)

def support(im,left,right,y):
    """A structural spar connects the authored pods to every hull center."""
    draw=ImageDraw.Draw(im)
    draw.rounded_rectangle((left,y,right,y+13),radius=3,fill='#07101a')
    draw.rectangle((left+2,y+3,right-2,y+10),fill='#3a5362')
    draw.line((left+5,y+4,right-5,y+4),fill='#91b4be',width=2)
    draw.line((left+8,y+10,right-8,y+10),fill='#163748',width=1)
    for x in range(left+10,right-4,16):
        draw.rectangle((x,y+6,x+3,y+8),fill='#7bb4ca')

upgrade2=Image.new('RGBA',(512,512))
support(upgrade2,158,354,253)
smallfin=fin.resize((45,87),N)
upgrade2.alpha_composite(smallfin,(133,173))
upgrade2.alpha_composite(ImageOps.mirror(smallfin),(334,173))
for center in [170,342]:
    upgrade2.alpha_composite(pod,(center-17,192))
    upgrade2.alpha_composite(enginepod,(center-9,300))
    d=ImageDraw.Draw(upgrade2)
    d.rectangle((center-2,186,center+2,199),fill='#122431')
    d.rectangle((center-1,185,center+1,192),fill='#a0edff')
save('ship-upgrade-2',upgrade2,displayWidth=95,normalizedOrigin=[256,256],sourceModuleCanvas=640,layer='over base hull',notes='one universal equipment overlay; draw atsame square size asbase')

upgrade3=upgrade2.copy()
support(upgrade3,88,424,277)
upgrade3.alpha_composite(fin,(58,173))
upgrade3.alpha_composite(ImageOps.mirror(fin),(387,173))
for center in [113,399]:
    upgrade3.alpha_composite(pod,(center-17,213))
    upgrade3.alpha_composite(enginepod,(center-9,321))
    d=ImageDraw.Draw(upgrade3)
    for dx in [-5,5]:
        d.rectangle((center+dx-2,197,center+dx+2,218),fill='#122431')
        d.rectangle((center+dx-1,196,center+dx+1,207),fill='#a0edff')
save('ship-upgrade-3',upgrade3,displayWidth=95,normalizedOrigin=[256,256],sourceModuleCanvas=640,layer='over base hull',notes='includes level2 equipment plus heavy outer fins/twin-gun pods')
(OUT/'LICENSE-SHIP-UPGRADES.txt').write_text('Ship upgrade overlays2/3 are adaptations of Skorpio — Space Ship & Mech Construction Kit2. Source: https://opengameart.org/content/space-ship-mech-construction-kit-2\nDerived overlays are distributed under Creative Commons Attribution-ShareAlike3.0: https://creativecommons.org/licenses/by-sa/3.0/\nChanges: cropped/scaled/mirrored authored module pixels, paired side guns/engines/wings and connecting structural spars, prepared by scripts/build-evolution-assets.py. Original module derivatives and credits are retained in /assets/modules and /assets/modular-art-CC-BY-SA-3.0.zip.\n',encoding='utf-8')

# Inspect every source silhouette at all three levels rather than only the
# default build. Major components are measured after rendering at160px.
def components(im):
    alpha=im.resize((160,160),N).getchannel('A')
    pixels={(x,y) for y in range(160) for x in range(160) if alpha.getpixel((x,y))>60}
    areas=[]
    while pixels:
        queue=[pixels.pop()];area=0
        while queue:
            x,y=queue.pop();area+=1
            for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if p in pixels:pixels.remove(p);queue.append(p)
        if area>15:areas.append(area)
    return sorted(areas,reverse=True)

shipreport=[]
shipcontact=Image.new('RGB',(1080,1350),'#07111e');labels=ImageDraw.Draw(shipcontact)
for h in range(3):
    for w in range(3):
        for e in range(3):
            base=Image.new('RGBA',(512,512))
            for stem in [f'engine-{e}',f'wings-{w}',f'hull-{h}']:
                base.alpha_composite(Image.open(modules/(stem+'.png')).convert('RGBA').resize((512,512),L))
            for level in range(1,4):
                composed=base.copy()
                if level>1:composed.alpha_composite(upgrade2 if level==2 else upgrade3)
                areas=components(composed)
                shipreport.append({'build':f'{h}-{w}-{e}','level':level,'majorAlphaComponents':areas,'connected':len(areas)==1})
                i=len(shipreport)-1;x=(i%9)*120;y=(i//9)*150
                small=composed.resize((112,112),L)
                shipcontact.paste(small,(x+4,y+4),small)
                labels.text((x+8,y+123),f'{h}-{w}-{e} / L{level}',fill='#b9e9ff')
shipcontact.save(ARTIFACTS/'evolution-assets-81-builds.png')
(ARTIFACTS/'evolution-assets-81-builds.json').write_text(json.dumps(shipreport,indent=2),encoding='utf-8')
assert len(shipreport)==81
assert all(r['connected'] for r in shipreport),[r for r in shipreport if not r['connected']]

credits={
 'sources':[
  {'name':'Space Game GUI','archive':'Space_Game_GUI_PNG.zip','author':'CraftPix','license':'CraftPix game-use license; no source-asset redistribution','url':'https://craftpix.net/file-licenses/','use':'selected blank windows, buttons and button derivatives'},
  {'name':'Space Shooter Asset Pack','author':'Gustavo Vituri','url':'https://gvituri.itch.io/space-shooter','license':'Personal/commercial game use and modification allowed; do not redistribute pack','use':'selected projectile, beam, fighter and booster frames; fighter/booster hues remapped to cyan/silver for friendly identification while retaining authored silhouettes and alpha','ai':'Author states no generative AI used'},
  {'name':'Lunar Lander Assets','archive':'Lunar Lander Assets 24-11-20.zip','use':'asteroid artwork with baked light texture/dual silhouette contours; original project provenance retained'},
  {'name':'Space Ship & Mech Construction Kit2','author':'Skorpio','url':'https://opengameart.org/content/space-ship-mech-construction-kit-2','license':'CC-BY-SA3.0','use':'existing normalized module art cropped into side gun/engine/wing equipment; structural spars are deterministic original pixel geometry'},
  {'name':'NULLSIGNAL UI FREE v1.1','author':'Nkyo-P','url':'https://nkyo-p.itch.io/nullsignal-dark-tech-sci-fi-ui-hud-kit','license':'Finished-game use and modifications allowed; no standalone asset redistribution/resale/AI-training','ai':'Author discloses AI-assisted vector code and human arrangement; no claim of AI-free provenance','use':'progress/status/bracket components only; no generated background'},
  {'name':'Chakra Petch','author':'Cadson Demak','license':'SIL OFL1.1','use':'self-hosted font; license included'},
  {'name':'JetBrains Mono','author':'JetBrains','license':'SIL OFL1.1','use':'self-hosted numeric font; license included'}
 ],'notes':['Only selected runtime derivatives are published, never the source ZIP/PSD packs.','Ethnocentric is referenced by the GUI README but no font software is included or embedded.']}
(OUT/'credits.json').write_text(json.dumps(credits,indent=2),encoding='utf-8')
(OUT/'manifest.json').write_text(json.dumps({'frames':frames,'sampling':'nearest for pixel-art projectiles/fighters; linear for GUI'},indent=2),encoding='utf-8')
keys=[k for k in frames if not k.startswith('ui-')]
typescript='/** Selected artist-derived Evolution Arcade textures. See runtime credits.json. */\nexport const EVOLUTION_IMAGES = '+json.dumps(keys,indent=2)+' as const;\n'
(ROOT/'src/evolution-assets.ts').write_text(typescript,encoding='utf-8')

# Contact sheet: all runtime playfield sprites at legible integer scale.
sheet=Image.new('RGB',(900,math.ceil(len(keys)/7)*145),'#07111e');d=ImageDraw.Draw(sheet)
for i,key in enumerate(keys):
    im=Image.open(OUT/(key+'.png')).convert('RGBA');im.thumbnail((104,110),N)
    x=(i%7)*128;y=(i//7)*145
    sheet.paste(im,(x+(118-im.width)//2,y+8),im);d.text((x+3,y+120),key,fill='#cce9f8')
sheet.save(ARTIFACTS/'evolution-assets-contact.png')
report={'pngCount':len(frames),'totalPngBytes':sum(p.stat().st_size for p in OUT.glob('*.png')),'frameKeys':list(frames),'meteorContour':'opaque black outside and warm-white inside, following sprite alpha, no circle', 'fontsEmbedded':['Chakra Petch','JetBrains Mono'],'originalArchivesPublished':False}
report['wingmanPalette']='All three friendly fighter tiers use cool cyan/silver; four engine frames use cyan/white. Original silhouettes, dimensions and alpha retained.'
report['shipBuildCheck']={'combinations':len(shipreport),'allMajorSilhouettesConnected':all(r['connected'] for r in shipreport),'sourceCanvas':640,'normalizedOverlayCanvas':512,'contactSheet':'evolution-assets-81-builds.png'}
# Asset-level contrast proof uses the actual runtime background opacity. It is
# explicitly separate from browser screenshots with fog/particles/HUD present.
def luminance(rgb):
    values=[c/255 for c in rgb[:3]]
    linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]
    return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
contrast=[]
preview=Image.new('RGB',(1560,600),'#080d22')
for theme in range(4):
    bg=Image.open(ROOT/f'public/assets/environment/feony-scroll-{theme}.webp').convert('RGBA')
    bg=ImageOps.fit(bg,(390,300),method=L)
    bg.putalpha(bg.getchannel('A').point(lambda p:round(p*.37)))
    under=Image.new('RGBA',bg.size,'#080d22');under.alpha_composite(bg)
    maximum=max(luminance(pixel) for pixel in under.convert('RGB').getdata())
    ratio=(luminance((255,241,201))+.05)/(maximum+.05)
    contrast.append({'theme':theme,'backgroundMaxLuminance':maximum,'warmWhiteContourContrastRatio':ratio})
    for index in range(4):
        rock=Image.open(OUT/f'evo-meteor-{index}.png').resize((65,65),N)
        under.alpha_composite(rock,(15+index*94,115))
    preview.paste(under.convert('RGB'),(theme*390,0))
    preview.paste(ImageOps.grayscale(under).convert('RGB'),(theme*390,300))
preview.save(ARTIFACTS/'evolution-assets-meteor-contrast.png')
report['meteorAssetContrastAgainstRuntimeOpacity']=contrast
report['contrastFixtureNote']='Offline asset composite at actual0.37 background opacity; not a browser render or human perception test. White/black dual contour remains at every reduced-effects setting.'
assert min(r['warmWhiteContourContrastRatio'] for r in contrast)>=3
(ARTIFACTS/'evolution-assets-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
