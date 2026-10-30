from pathlib import Path
import urllib.request,zipfile,io,json
from PIL import Image,ImageOps
from psd_tools import PSDImage
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets'; ORIG=OUT/'originals'; MOD=OUT/'modules'
ORIG.mkdir(exist_ok=True); MOD.mkdir(exist_ok=True); (MOD/'raw').mkdir(exist_ok=True); (MOD/'previews').mkdir(exist_ok=True)
def source(name,url):
 p=ORIG/name
 if not p.exists():p.write_bytes(urllib.request.urlopen(url).read())
 return p
zip_path=source('SpaceshipConstructionKit2.zip','https://opengameart.org/sites/default/files/SpaceshipConstructionKit2.zip')
z=zipfile.ZipFile(zip_path);psd=PSDImage.open(io.BytesIO(z.read('SpaceshipConstructionKit2.psd')))
selected={'hull':['Layer 72','Layer 48','Layer 30'],'wings':['Layer 239','Layer 238','Layer 230'],'engine':['Layer 186','Layer 194','Layer 217']}
meta={'canvas':{'width':320,'height':320},'origin':{'x':.5,'y':.5},'nose':'up','collision':'unchanged game-model radius','source':'Skorpio / Space Ship & Mech Construction Kit 2 / CC-BY-SA 3.0','modules':{}}
def place(canvas,image,x,y):canvas.alpha_composite(image,(round(x-image.width/2),round(y-image.height/2)))
for category,names in selected.items():
 for i,name in enumerate(names):
  layer=next(l for l in psd if l.name==name)
  im=layer.topil().convert('RGBA');im=im.crop(im.getbbox())
  # Preserve opaque artist textures; align only with translation and uniform scaling.
  from colorsys import rgb_to_hsv,hsv_to_rgb
  px=im.load()
  for y in range(im.height):
   for x in range(im.width):
    r,g,b,a=px[x,y]
    if not a:continue
    h,s,v=rgb_to_hsv(r/255,g/255,b/255)
    if s>.18:r,g,b=[round(c*255) for c in hsv_to_rgb(.55,min(.9,s*1.2),v)]
    px[x,y]=(r,g,b,a)
  im.save(MOD/'raw'/f'{category}-{i}.png')
  canvas=Image.new('RGBA',(320,320))
  if category=='hull':
   im.thumbnail((140,180),Image.Resampling.LANCZOS)
   ratio=min(140/im.width,180/im.height)
   im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS)
   place(canvas,im,160,215-im.height/2)
  elif category=='wings':
   ratio=min(64/im.width,140/im.height)
   im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS)
   bridge=Image.open(OUT/'originals/human/Human-Fighter.png').convert('RGBA').crop((56,58,72,74)).resize((20,20),Image.Resampling.LANCZOS)
   for mount_x in range(100,221,20): place(canvas,bridge,mount_x,174)
   place(canvas,im,105-im.width/2,165)
   place(canvas,ImageOps.mirror(im),215+im.width/2,165)
  else:
   ratio=min(84/im.width,76/im.height)
   im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS)
   place(canvas,im,160,216)
  path=MOD/f'{category}-{i}.png';canvas.save(path,optimize=True)
  meta['modules'][f'{category}-{i}']={'sourceLayer':name,'sourceBox':list(layer.bbox),'file':path.name}
for h in range(3):
 for w in range(3):
  for e in range(3):
   out=Image.new('RGBA',(320,320))
   for cat,idx in [('wings',w),('engine',e),('hull',h)]:out.alpha_composite(Image.open(MOD/f'{cat}-{idx}.png'))
   out.save(MOD/'previews'/f'ship-{h}-{w}-{e}.png',optimize=True)
(MOD/'modules.json').write_text(json.dumps(meta,indent=2))
bg=source('Rawdanitsu-Background-1.png','https://opengameart.org/sites/default/files/Background-1.png')
image=Image.open(bg).convert('RGB');image.thumbnail((1600,1200),Image.Resampling.LANCZOS);image.save(OUT/'space-background.webp',quality=88,method=6)
# Darkened derivative protects the battlefield from high contrast nebula detail.
from PIL import ImageEnhance
ImageEnhance.Brightness(image).enhance(.38).save(OUT/'space-combat-background.webp',quality=84,method=6)
with zipfile.ZipFile(OUT/'modular-art-CC-BY-SA-3.0.zip','w',zipfile.ZIP_DEFLATED) as bundle:
 for p in MOD.rglob('*'):
  if p.is_file():bundle.write(p,str(p.relative_to(MOD)))
 bundle.write(Path(__file__),'build-modular-assets.py')
 if (ROOT/'ASSET-CREDITS.md').exists():bundle.write(ROOT/'ASSET-CREDITS.md','CREDITS.md')
print('9 modular layers + 27 compositions + 2 artist backgrounds generated')



