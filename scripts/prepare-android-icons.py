"""Rasterize the existing code-drawn Apex mark for Android; no generated imagery."""
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]/'android/app/src/main/res'
def mark(size,opaque):
    im=Image.new('RGBA',(size*4,size*4),(9,13,18,255) if opaque else (0,0,0,0))
    draw=ImageDraw.Draw(im)
    points=[(54,27),(81,78),(54,66),(27,78),(54,27)]
    scale=size*4/108
    draw.line([(round(x*scale),round(y*scale)) for x,y in points],fill='#59e7e0',width=max(1,round(3.5*scale)),joint='curve')
    draw.line([(round(54*scale),round(27*scale)),(round(54*scale),round(66*scale))],fill='#59e7e0',width=max(1,round(3.5*scale)))
    return im.resize((size,size),Image.Resampling.LANCZOS)
for density,mult in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder=root/f'mipmap-{density}'
    for name in ['ic_launcher.png','ic_launcher_round.png']:
        mark(round(48*mult),True).save(folder/name)
    mark(round(108*mult),False).save(folder/'ic_launcher_foreground.png')
for p in root.glob('drawable*/splash.png'):
    with Image.open(p) as current: size=current.size
    Image.new('RGB',size,'#090d12').save(p)
print('Prepared Apex Android icons and dark launch backgrounds.')
