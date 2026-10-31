"""Selected artist-derived Apex Strikers art. No source archives or AI imagery ship."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from PIL import Image, ImageOps, ImageDraw, ImageFilter, ImageChops
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path.home()/'Desktop/Space_combat'
OUT=ROOT/'public/assets/neon'; OUT.mkdir(parents=True,exist_ok=True)
N=Image.Resampling.NEAREST
keys=[]
def save(key,im):
    im.save(OUT/(key+'.png'),optimize=True);keys.append(key)
def read(z,n): return Image.open(BytesIO(z.read(n))).convert('RGBA')
def cool(im):
    alpha=im.getchannel('A')
    result=ImageOps.colorize(ImageOps.grayscale(im),'#081522','#a5f4ff').convert('RGBA');result.putalpha(alpha);return result
def cells(im,count):
    size=im.height; total=im.width//size
    return [im.crop((min(total-1,i*total//count)*size,0,(min(total-1,i*total//count)+1)*size,size)) for i in range(count)]
with ZipFile(SOURCE/'SpaceShooterAssetPack.zip') as z:
    sheet=read(z,'SpaceShooterAssets/SpaceShooterAssetPack_Ships.png')
    for level in range(1,4):
        hull=cool(sheet.crop([(64,24,72,32),(48,32,56,40),(40,32,48,40)][level-1])).resize((16,16),N)
        canvas=Image.new('RGBA',(32,32));canvas.alpha_composite(hull,(8,8))
        d=ImageDraw.Draw(canvas)
        for side in [-1,1]:
            x=16+side*(6+level)
            d.rectangle((x-1,10,x+1,21),fill='#254d65');d.rectangle((x,8,x,17),fill='#a5f4ff')
        save('escort-'+str(level),canvas.resize((96,96),N))
        superart=canvas.copy();d=ImageDraw.Draw(superart)
        d.line([(1,24),(4,11),(10,7)],fill='#dd96ff',width=2)
        d.line([(30,24),(27,11),(21,7)],fill='#dd96ff',width=2)
        save('escort-super-'+str(level),superart.resize((96,96),N))
with ZipFile(SOURCE/'Mini Pixel Pack 3.zip') as z:
    for direction,suffix in [('idle',''),('left','_left'),('right','_right')]:
        im=read(z,f'Mini Pixel Pack 3/Player ship/Boosters{suffix} (16 x 16).png')
        for i,frame in enumerate(cells(im,2)):
            save(f'escort-engine-{direction}-{i}',cool(frame).resize((48,48),N))
for stage,pack,prefix in [(0,1,"Kla'ed"),(1,2,'Nairan'),(2,3,'Nautolan')]:
    with ZipFile(SOURCE/f'Foozle_2DS001{pack+1}_Void_FleetPack_{pack}.zip') as z:
        capital='Dreadnought' if stage==2 else 'Battlecruiser'
        for category,output in [('Weapons','weapon'),('Shields','shield'),('Destruction','destroy')]:
            files=[n for n in z.namelist() if '/PNGs/' in n and category+'/' in n and capital in n and n.endswith('.png')]
            if not files: continue
            for i,frame in enumerate(cells(read(z,files[0]),12 if output=='destroy' else 8)):
                frame=frame.rotate(180)
                if stage<2:
                    base=read(z,next(n for n in z.namelist() if '/PNGs/' in n and capital+' - Base.png' in n)).rotate(180)
                    bounds=base.getbbox();ox,oy=[(48,20),(58,10)][stage]
                    canvas=Image.new('RGBA',(240,264));canvas.alpha_composite(frame.resize((frame.width*2,frame.height*2),N),(ox-bounds[0]*2,oy-bounds[1]*2))
                    frame=canvas.crop((16,0,224,240))
                else:
                    scaled=frame.resize((240,240),N);frame=Image.new('RGBA',(240,264));frame.alpha_composite(scaled,(0,12))
                save(f'capital-{stage}-{output}-{i}',frame)
        for kind,name in enumerate(['Scout','Fighter','Frigate']):
            for category,output in [('Weapons','weapon'),('Shields','shield')]:
                files=[n for n in z.namelist() if '/PNGs/' in n and category+'/' in n and name+' - ' in n and n.endswith('.png')]
                if not files: continue
                for i,im in enumerate(cells(read(z,files[0]),8)):
                    save(f'enemy-{stage}-{kind}-{output}-{i}',im.rotate(180))
        if stage==2:
            for category,output in [('Designs - Base','base'),('Engine Effects','engine'),('Destruction','destroy')]:
                n=next(n for n in z.namelist() if '/PNGs/' in n and category+'/' in n and 'Ship - Battlecruiser' in n and n.endswith('.png'))
                for i,frame in enumerate(cells(read(z,n),1 if output=='base' else 8)):
                    save(f'nautolan-mini-{output}-{i}',frame.rotate(180))
            for kind,name in enumerate(['Scout','Fighter','Frigate']):
                for category,output in [('Designs - Base','base'),('Engine Effects','engine'),('Destruction','destroy')]:
                    files=[n for n in z.namelist() if '/PNGs/' in n and category+'/' in n and f'Ship - {name}' in n and n.endswith('.png')]
                    if not files: continue
                    im=read(z,files[0])
                    for i,frame in enumerate(cells(im,1 if output=='base' else 8)):
                        frame=frame.rotate(180)
                        # Replace selected runtime images while retaining established manifest keys.
                        dest=ROOT/'public/assets/onslaught'/f'enemy-2-{kind}{"" if output=="base" else "-"+output+"-"+str(i)}.png'
                        frame.save(dest)
                        if output=='base':
                            mask=Image.new('RGBA',frame.size,'white');mask.putalpha(frame.getchannel('A'));mask.save(dest.with_stem(dest.stem+'-hit'))
            for category,output in [('Designs - Base','base'),('Engine Effects','engine'),('Destruction','destroy')]:
                n=next(n for n in z.namelist() if '/PNGs/' in n and category+'/' in n and 'Ship - Dreadnought' in n and n.endswith('.png'))
                for i,frame in enumerate(cells(read(z,n),1 if output=='base' else 12 if output=='destroy' else 8)):
                    # Preserve the same untrimmed origin across hull, engines and destruction.
                    frame=frame.rotate(180).resize((240,240),N)
                    padded=Image.new('RGBA',(240,264));padded.alpha_composite(frame,(0,12));frame=padded
                    if output=='base':
                        frame.save(ROOT/'public/assets/onslaught/boss-2.png')
                        white=Image.new('RGBA',frame.size,'white');white.putalpha(frame.getchannel('A'));white.save(ROOT/'public/assets/onslaught/boss-2-hit.png')
                        frame.save(ROOT/'public/assets/onslaught/boss-2-preview.png')
                    elif output=='engine': frame.save(ROOT/f'public/assets/onslaught/boss-2-engine-{i}.png')
                    else: save(f'capital-destroy-{i}',frame)
with ZipFile(SOURCE/'Foozle_2DS0015_Void_EnvironmentPack.zip') as z:
    for term,key,count in [('Layer 02 - Stars','void-stars',8),('X -Black hole','gravity',8),('X - Big Star.png','void-sun',4),('Asteroid 01 - Explode','rock-burst',8)]:
        files=[n for n in z.namelist() if '/PNGs/' in n and term in n and n.endswith('.png')]
        if not files: continue
        for i,frame in enumerate(cells(read(z,files[0]),count)):save(f'{key}-{i}',frame)
    planet=read(z,next(n for n in z.namelist() if n.endswith('Earth-Like planet.png')))
    for stage,color in enumerate(['#d7a86c','#9176b8','#758e9c']):
        for i,frame in enumerate(cells(planet,8)):
            alpha=frame.getchannel('A');frame=ImageOps.colorize(ImageOps.grayscale(frame),'#0a1020',color).convert('RGBA');frame.putalpha(alpha);save(f'planet-{stage}-{i}',frame)
# Fill missing Kla'ed shields with contours derived from the actual hull alpha.
for kind in range(3):
    key=f'enemy-0-{kind}-shield'
    if key+'-0' not in keys:
        base=Image.open(ROOT/f'public/assets/onslaught/enemy-0-{kind}.png').convert('RGBA')
        for i in range(8):
            alpha=base.getchannel('A');edge=ImageChops.subtract(alpha.filter(ImageFilter.MaxFilter(7)),alpha)
            effect=Image.new('RGBA',base.size,(255,170,95,0));effect.putalpha(edge.point(lambda v:int(v*(.45+.3*__import__('math').sin(i*.78)))));save(f'{key}-{i}',effect)
if 'capital-0-shield-0' not in keys:
    base=Image.open(ROOT/'public/assets/onslaught/boss-0.png').convert('RGBA')
    for i in range(8):
        alpha=base.getchannel('A');edge=ImageChops.subtract(alpha.filter(ImageFilter.MaxFilter(13)),alpha)
        effect=Image.new('RGBA',base.size,(255,170,95,0));effect.putalpha(edge.point(lambda v:int(v*(.6+.2*__import__('math').sin(i*.78)))));save(f'capital-0-shield-{i}',effect)
# Canvas cannot tint sprites: bake the Rage palette into the textures.
for key in ['boss-2']+[f'boss-2-engine-{i}' for i in range(8)]:
    im=Image.open(ROOT/f'public/assets/onslaught/{key}.png').convert('RGBA');a=im.getchannel('A')
    red=ImageOps.colorize(ImageOps.grayscale(im),'#190715','#ff5b68').convert('RGBA');red.putalpha(a);save(key+'-rage',red)
for i in range(8):
    im=Image.open(OUT/f'capital-2-shield-{i}.png').convert('RGBA');a=im.getchannel('A')
    red=ImageOps.colorize(ImageOps.grayscale(im),'#190715','#ff5466').convert('RGBA');red.putalpha(a);save(f'capital-2-shield-{i}-rage',red)
for stage,color in enumerate(['#ffb34c','#61dfff','#74ffad']):
    canvas=Image.new('RGBA',(64,64));d=ImageDraw.Draw(canvas)
    d.ellipse((5,5,59,59),fill='#0b1727',outline=color,width=3)
    d.polygon([(32,12),(47,24),(44,43),(32,52),(20,43),(17,24)],fill=color)
    d.polygon([(32,19),(39,29),(32,43),(25,29)],fill='#f0ffff')
    save(f'orb-{stage}',canvas)
    for i in range(8):
        d.point((int(32+26*__import__('math').cos(i*0.78)),int(32+26*__import__('math').sin(i*0.78))),fill='white')
shot=Image.new('RGBA',(24,24));draw=ImageDraw.Draw(shot)
draw.ellipse((1,1,23,23),fill=(255,122,65,35));draw.ellipse((6,6,18,18),fill='#ffb56f');draw.ellipse((10,10,14,14),fill='#fff5d9');save('hostile-round',shot)
(ROOT/'src/neon-assets.ts').write_text('export const NEON_IMAGES = '+json.dumps(keys)+' as const;\n',encoding='utf-8')
(OUT/'credits.json').write_text(json.dumps({'artists':['Baldur / Foozle: Void Fleet 1/2/3 and Environment, CC0','GrafxKid: Mini Pixel Pack 3, CC0','Gustavo Vituri: SpaceShooterAssetPack, existing project attribution'], 'modifications':'Selected frames, cool palettes, alien planet palettes, escort modules, neon orb symbols. No generative images.','sourceArchivesPublished':False},indent=2),encoding='utf-8')
print('Prepared',len(keys),'selected textures')
