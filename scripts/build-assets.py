"""Build reproducible Skorpio-derived art and hand-authored procedural effects. No generative AI."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import colorsys, math, random, json, zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets'
SRC=OUT/'originals/human'
R=Image.Resampling.LANCZOS
frames={}
def ship(filename,size,enemy=False):
    im=Image.open(SRC/filename).convert('RGBA'); im=im.crop(im.getbbox())
    px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if not a: continue
            h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
            if s>.18:
                h=.015 if enemy else .55
                s=min(.9,s*1.2)
                r,g,b=[round(c*255) for c in colorsys.hsv_to_rgb(h,s,v)]
            px[x,y]=(r,g,b,a)
    if enemy: im=im.rotate(180)
    im.thumbnail((size-12,size-12),R)
    canvas=Image.new('RGBA',(size,size)); canvas.alpha_composite(im,((size-im.width)//2,(size-im.height)//2))
    return canvas
for i,f in enumerate(['Human-Fighter.png','Human-Corvette.png','Human-Destroyer.png']):
    im=ship(f,160); frames[f'player-{i}']=im; im.save(OUT/f'player-{i}.png')
for i,f in enumerate(['Human-Frigate.png','Human-Cruiser.png','Human-Battlecruiser.png']): frames[f'enemy-{i}']=ship(f,160,True)
frames['boss']=ship('Human-Battleship.png',320,True)
def effect(name,size,fn):
    im=Image.new('RGBA',(size,size)); fn(ImageDraw.Draw(im),size); frames[name]=im
for idx in range(4):
    size=64; im=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(im); length=36+idx*5
    d.polygon([(18,5),(46,5),(39,26),(32,length),(25,26)],fill=(30,110,255,70))
    d.polygon([(24,5),(40,5),(36,24),(32,length-7),(28,24)],fill=(50,190,255,190))
    d.polygon([(28,5),(36,5),(32,length-18)],fill=(220,250,255,255)); frames[f'thruster-{idx}']=im
frames['thruster']=frames['thruster-0']
for name,color in [('bullet',(86,207,255)),('enemy-bullet',(255,135,76))]:
    im=Image.new('RGBA',(32,64)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((7,2,25,60),radius=9,fill=(*color,35)); d.rounded_rectangle((12,6,20,49),radius=4,fill=(*color,255)); d.rounded_rectangle((15,8,17,37),radius=1,fill=(255,255,240,255)); frames[name]=im
rng=random.Random(42)
im=Image.new('RGBA',(128,128)); d=ImageDraw.Draw(im)
pts=[(64+math.cos(i*math.tau/13)*(49+rng.random()*10),64+math.sin(i*math.tau/13)*(49+rng.random()*10)) for i in range(13)]
d.polygon(pts,fill=(83,79,75),outline=(154,149,137),width=2)
for i in range(40):
    x,y=rng.randrange(25,104),rng.randrange(25,104); r=rng.randrange(2,10)
    d.ellipse((x-r,y-r,x+r,y+r),fill=(49,48,48),outline=(102,97,88),width=2)
frames['rock']=im
for i in range(8):
    im=Image.new('RGBA',(128,128)); d=ImageDraw.Draw(im); t=i/7; radius=8+48*t
    d.ellipse((64-radius,64-radius,64+radius,64+radius),outline=(255,151,61,int(220*(1-t))),width=5)
    for j in range(10):
        a=j*math.tau/10; x=64+math.cos(a)*radius; y=64+math.sin(a)*radius; r=max(1,11*(1-t))
        d.ellipse((x-r,y-r,x+r,y+r),fill=(255,180,73,int(255*(1-t))))
    r=max(0,23*(1-t));d.ellipse((64-r,64-r,64+r,64+r),fill=(255,246,196,int(255*(1-t))));frames[f'explosion-{i}']=im
frames['explosion']=frames['explosion-2']
for name in ['shield','emp']:
    im=Image.new('RGBA',(256,256)); d=ImageDraw.Draw(im)
    d.ellipse((5,5,250,250),outline=(86,207,255,150),width=3)
    d.ellipse((11,11,244,244),outline=(190,241,255,220),width=2)
    if name=='shield':
        for a in range(0,360,45): d.arc((2,2,253,253),a,a+25,fill=(223,250,255,255),width=5)
    frames[name]=im
atlas=Image.new('RGBA',(1024,1024)); entries={}; x=y=row=2
for name,im in frames.items():
    w,h=im.size
    if x+w+2>1024: x=2;y+=row+4;row=0
    if y+h>1024: raise RuntimeError('atlas overflow')
    atlas.alpha_composite(im,(x,y)); entries[name]={'frame':{'x':x,'y':y,'w':w,'h':h},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'sourceSize':{'w':w,'h':h},'pivot':{'x':.5,'y':.5}}
    x+=w+4;row=max(row,h)
atlas.save(OUT/'atlas.png',optimize=True)
(OUT/'atlas.json').write_text(json.dumps({'frames':entries,'meta':{'image':'atlas.png','format':'RGBA8888','size':{'w':1024,'h':1024},'scale':'1','app':'Gyro Space deterministic asset pipeline'}},indent=2))
with zipfile.ZipFile(OUT/'adapted-art-CC-BY-SA-3.0.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in ['atlas.png','atlas.json','player-0.png','player-1.png','player-2.png']:z.write(OUT/f,f)
    z.write(Path(__file__),'build-assets.py')
    if (ROOT/'ASSET-CREDITS.md').exists(): z.write(ROOT/'ASSET-CREDITS.md','CREDITS.md')
print('Built',len(frames),'frames;',y+row,'pixels tall')

