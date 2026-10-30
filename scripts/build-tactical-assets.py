"""Artist-sourced ship assembly and hand-authored vector interface symbols. No generative imagery."""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
import itertools, zipfile
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets'; MOD=OUT/'modules'; T=OUT/'tactical'; T.mkdir(exist_ok=True)
def blue(im,red=False):
 im=im.convert('RGBA');p=im.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=p[x,y]
   if not a:continue
   if max(r,g,b)-min(r,g,b)>18 and (g>r or b>r):
    v=max(r,g,b);p[x,y]=(int(v*.95),int(v*.28),int(v*.2),a) if red else (int(v*.28),int(v*.8),v,a)
 return ImageEnhance.Brightness(im).enhance(1.35)
def place(out,im,x,y):out.alpha_composite(im,(round(x-im.width/2),round(y-im.height/2)))
for i,name in enumerate(['Fighter','Cruiser','Battlecruiser']):
 im=blue(Image.open(OUT/f'originals/human/Human-{name}.png'));im=im.crop(im.getbbox());ratio=min(230/im.width,390/im.height);im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(640,640));place(canvas,im,320,300);canvas.save(MOD/f'hull-{i}.png')
for i in range(3):
 im=blue(Image.open(MOD/f'raw/wings-{i}.png'));ratio=min(150/im.width,230/im.height);im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS);im=im.rotate([45,65,25][i],expand=True,resample=Image.Resampling.BICUBIC)
 canvas=Image.new('RGBA',(640,640));bridge=blue(Image.open(OUT/'originals/human/Human-Fighter.png').crop((49,54,78,72))).resize((260,32),Image.Resampling.LANCZOS);place(canvas,bridge,320,335);place(canvas,im,212,335);place(canvas,ImageOps.mirror(im),428,335);canvas.save(MOD/f'wings-{i}.png')
 im=blue(Image.open(MOD/f'raw/engine-{i}.png'));ratio=min(130/im.width,135/im.height);im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(640,640));place(canvas,im,320,500);canvas.save(MOD/f'engine-{i}.png')
for h,w,e in itertools.product(range(3),repeat=3):
 out=Image.new('RGBA',(640,640))
 for cat,idx in [('engine',e),('wings',w),('hull',h)]:out.alpha_composite(Image.open(MOD/f'{cat}-{idx}.png'))
 out.save(MOD/'previews'/f'ship-{h}-{w}-{e}.png')
for i,name in enumerate(['Battlecruiser','Battleship','HeavyCruiser']):
 im=blue(Image.open(OUT/f'originals/human/Human-{name}.png'),True);im=im.crop(im.getbbox());im.thumbnail((420,480),Image.Resampling.LANCZOS);im=im.rotate(180);im.save(T/f'boss-{i}.png')
im=blue(Image.open(OUT/'originals/human/Human-Fighter.png'));im=im.crop(im.getbbox());im.save(T/'drone.png')
shapes={
 'pulse':'<path d="M24 49V19m16 30V19M18 25l6-10 6 10m4 0 6-10 6 10"/>',
 'plasma':'<path d="M32 51V14M18 47L11 23m35 24 7-24M24 22l8-10 8 10"/>',
 'laser':'<path d="M25 52V13m14 39V13M18 32h28M20 45h24"/>',
 'missile':'<path d="M25 48V24l7-13 7 13v24l-7-5-7 5zm7-5v12M20 39l5-10m14 0 5 10"/>',
 'shield':'<path d="M32 10l19 8v14c0 13-19 23-19 23S13 45 13 32V18z"/><path d="M23 32l6 6 13-15"/>',
 'drone':'<path d="M32 12v39M13 23l12 8v13l-12-6zm38 0-12 8v13l12-6zM26 18h12"/>',
 'damage':'<path d="M35 8L17 35h14l-3 21 19-28H33z"/>',
 'rapid':'<path d="M14 20l12 12-12 12m17-24 12 12-12 12m16-24 8 12-8 12"/>',
 'magnet':'<path d="M16 12v23a16 16 0 0032 0V12H37v23a5 5 0 01-10 0V12zM16 23h11m10 0h11"/>',
 'charger':'<circle cx="32" cy="32" r="22"/><path d="M35 16L24 34h10l-3 14 11-20H32z"/>',
 'evasive':'<path d="M12 32h39M22 20L10 32l12 12m20-24 12 12-12 12"/>',
 'repair':'<path d="M25 12h14v13h13v14H39v13H25V39H12V25h13z"/>',
 'energy':'<circle cx="32" cy="32" r="22"/><path d="M35 16L24 34h10l-3 14 11-20H32z"/>',
 'credits':'<circle cx="32" cy="32" r="21"/><path d="M40 23H27v18h13M20 28h18m-18 8h18"/>'}
bg=Image.open(OUT/'originals/Rawdanitsu-Background-1.png').convert('RGB')
for i in range(3):
 w,h=bg.size;cw=round(h*9/16);left=round((w-cw)*[0,.55,1][i]);im=bg.crop((left,0,left+cw,h));im.thumbnail((720,1280),Image.Resampling.LANCZOS);im=ImageEnhance.Brightness(im).enhance(.42);im.save(T/f'sector-{i}.webp',quality=85)
for name,shape in shapes.items():(T/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#8bdfff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{shape}</g></svg>')
with zipfile.ZipFile(OUT/'tactical-art-CC-BY-SA-3.0.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in list(MOD.rglob('*.png'))+list(T.glob('*.png'))+list(T.glob('*.webp')):z.write(p,str(p.relative_to(OUT)))
 z.write(Path(__file__),'build-tactical-assets.py');z.write(ROOT/'ASSET-CREDITS.md','CREDITS.md')
print('Built 27 artist-derived ships, 3 boss sprites, drone and 14 hand-authored vector icons.')
