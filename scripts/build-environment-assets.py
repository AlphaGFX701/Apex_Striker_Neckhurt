"""Build only the runtime art/audio from user-supplied archives; never publish source ZIPs."""
from pathlib import Path
import io, json, zipfile, subprocess, tempfile
from PIL import Image, ImageOps
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / 'Desktop/Space_combat'
OUT = ROOT / 'public/assets/environment'
OUT.mkdir(parents=True, exist_ok=True)
frames = {}
atlas = Image.new('RGBA', (2048, 2048))
slot = 0

def archive(name): return zipfile.ZipFile(SOURCE / name)
def picture(z, name): return Image.open(io.BytesIO(z.read(name))).convert('RGBA')
def add(name, im):
    global slot
    scale = 124 / max(im.size)
    im = im.resize((round(im.width*scale),round(im.height*scale)), Image.Resampling.NEAREST)
    cell = Image.new('RGBA',(128,128)); cell.alpha_composite(im,((128-im.width)//2,(128-im.height)//2))
    x,y=(slot%16)*128,(slot//16)*128
    atlas.alpha_composite(cell,(x,y)); slot+=1
    frames[name]={'frame':{'x':x,'y':y,'w':128,'h':128},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':128,'h':128},'sourceSize':{'w':128,'h':128}}

z=archive('Animated Pixel-Art Backgrounds Free.zip')
im=picture(z,next(n for n in z.namelist() if n.endswith('Background 7 (Bonus).png')))
im.thumbnail((1920,1080),Image.Resampling.LANCZOS)
im.convert('RGB').save(OUT/'feony-space.webp',quality=90)
# Runtime scrolling copy with feathered edges; the menu image stays fully opaque.
alpha = Image.new('L', im.size, 255)
for y in range(im.height):
    value = round(255 * min(1, y/120, (im.height-1-y)/120))
    alpha.paste(value,(0,y,im.width,y+1))
im.putalpha(alpha)
im.save(OUT/'feony-scroll.webp',quality=90)
for index,color in enumerate(['#79B6FF','#CC8AFF','#E2AE67','#E36A6A']):
    tinted = ImageOps.colorize(ImageOps.grayscale(im), '#020512', color).convert('RGBA')
    variant = Image.blend(im,tinted,.7)
    variant.putalpha(alpha)
    variant.thumbnail((1536,768),Image.Resampling.LANCZOS)
    variant.save(OUT/f'feony-scroll-{index}.webp',quality=90)


for pack,prefix,ships in [(1,"Kla'ed",['Scout','Fighter','Frigate']), (2,'Nairan',['Battlecruiser','Dreadnought','Torpedo Ship','Bomber'])]:
    z=archive(f'Foozle_2DS001{1+pack}_Void_FleetPack_{pack}.zip')
    for index,ship in enumerate(ships):
        n=next(n for n in z.namelist() if f'/PNGs/{prefix} - {ship} - Base.png' in n)
        base=picture(z,n).rotate(180)
        add(f'void-{pack}-{index}',base)
        if pack==2 and index<3:
            art=base.crop(base.getbbox()); factor=280/max(art.size)
            art=art.resize((round(art.width*factor),round(art.height*factor)),Image.Resampling.NEAREST)
            preview=Image.new('RGBA',(320,320));preview.alpha_composite(art,((320-art.width)//2,(320-art.height)//2))
            preview.save(OUT/f'boss-preview-{index}.webp',lossless=True)

        for effect,part in [('engine','Engine'),('destroy','Destruction')]:
            n=next(n for n in z.namelist() if '/PNGs/' in n and f'{prefix} - {ship}' in n and part in n)
            strip=picture(z,n); size=strip.height; count=strip.width//size
            for f in range(12):
                add(f'void-{pack}-{index}-{effect}-{f}',strip.crop((min(f,count-1)*size,0,(min(f,count-1)+1)*size,size)).rotate(180))
            frames[f'__count-{pack}-{index}-{effect}']=min(count,12)

z=archive('Lunar Lander Assets 24-11-20.zip')
for filename,key in [('debris.png','debris'),('Asteroids.png','meteor')]:
    strip=picture(z,next(n for n in z.namelist() if n.endswith('/'+filename)))
    for f in range(strip.width//64): add(f'{key}-{f}',strip.crop((f*64,0,(f+1)*64,64)))
z=archive('Sprites - Lasers Bullets #1 [66]v2.5.zip')
for index in [1,9,20]: add(f'laser-{index}',picture(z,f'Laser Sprites/{index:02}.png'))
z=archive('Mini Pixel Pack 3.zip')
for tail,key in [('Power_item (16 x 16).png','power-item'),('Sparkle (16 x 16).png','spark')]:
    strip=picture(z,next(n for n in z.namelist() if n.endswith(tail)))
    for f in range(strip.width//16): add(f'{key}-{f}',strip.crop((f*16,0,(f+1)*16,16)))
counts={k:v for k,v in frames.items() if k.startswith('__count')}
frames={k:v for k,v in frames.items() if not k.startswith('__count')}
atlas.save(OUT/'environment.png',optimize=True)
(OUT/'environment.json').write_text(json.dumps({'frames':frames,'meta':{'image':'environment.png','size':{'w':2048,'h':2048}}}))
(OUT/'animations.json').write_text(json.dumps(counts))
z=archive('Space Music Pack.zip')
for track in ['menu','battle','in-the-wreckage']:
    with tempfile.TemporaryDirectory() as tmp:
        wav=Path(tmp)/'input.wav'; wav.write_bytes(z.read('Space Music Pack/'+track+'.wav'))
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-i',str(wav),'-ac','2','-ar','44100','-b:a','128k',str(OUT/(track+'.mp3'))],check=True)
print(f'Built {slot} frames and 3 compressed music tracks in {OUT}')
