"""Fit the approved imagegen foreground to Android masks; retain original art."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

project = Path(__file__).resolve().parents[1]
source = project / 'assets-source/app-icon'
resources = project / 'android/app/src/main/res'
original = Image.open(source / 'neon-fighter-original.png').convert('RGBA')
ship = original.crop(original.getbbox())
alpha = np.asarray(ship.getchannel('A'))
ys, xs = np.where(alpha > 8)
radius = np.hypot(xs - ship.width / 2, ys - ship.height / 2).max()
size = 1024
# Keep all visible artwork within the central66dp safe circle of a108dp layer.
scale = size * .295 / radius
fitted = ship.resize((round(ship.width * scale), round(ship.height * scale)), Image.Resampling.LANCZOS)
foreground = Image.new('RGBA', (size, size))
foreground.alpha_composite(fitted, ((size-fitted.width)//2, (size-fitted.height)//2))
y, x = np.mgrid[0:size, 0:size]
glow = np.exp(-(((x-size*.5)/(size*.53))**2 + ((y-size*.43)/(size*.53))**2)*2)
colors = np.stack([7+14*glow, 11+30*glow, 20+39*glow], axis=-1).astype('uint8')
background = Image.fromarray(colors).convert('RGBA')
foreground.save(source / 'foreground-1024.png')
background.save(source / 'background-1024.png')
composite = Image.alpha_composite(background, foreground)
# Adaptive launchers display the center72dp of the108dp layer.
inset = round(size / 6)
legacy = composite.crop((inset, inset, size-inset, size-inset))
legacy.resize((1024,1024),Image.Resampling.LANCZOS).save(source / 'icon-preview-1024.png')
for density, mult in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder = resources / f'mipmap-{density}'
    folder.mkdir(parents=True, exist_ok=True)
    pixels = round(48*mult)
    icon = legacy.resize((pixels,pixels),Image.Resampling.LANCZOS)
    icon.save(folder / 'ic_launcher.png')
    circle = Image.new('L',(pixels*4,pixels*4))
    ImageDraw.Draw(circle).ellipse((0,0,pixels*4-1,pixels*4-1),fill=255)
    rounded = icon.copy()
    rounded.putalpha(circle.resize((pixels,pixels),Image.Resampling.LANCZOS))
    rounded.save(folder / 'ic_launcher_round.png')
    for name, layer in [('foreground',foreground),('background',background)]:
        layer.resize((round(108*mult),round(108*mult)),Image.Resampling.LANCZOS).save(folder / f'ic_launcher_{name}.png')
for path in resources.glob('mipmap-anydpi-v26/ic_launcher*.xml'):
    path.write_text(path.read_text(encoding='utf-8').replace('@color/ic_launcher_background','@mipmap/ic_launcher_background'),encoding='utf-8')
styles = resources / 'values/styles.xml'
styles.write_text(styles.read_text(encoding='utf-8').replace('@drawable/apex_mark','@mipmap/ic_launcher_foreground'),encoding='utf-8')
for path in resources.glob('drawable*/splash.png'):
    with Image.open(path) as current:width,height=current.size
    splash = Image.new('RGBA',(width,height),'#090d12')
    stamp = ship.copy()
    stamp.thumbnail((round(width*.42),round(height*.42)),Image.Resampling.LANCZOS)
    splash.alpha_composite(stamp,((width-stamp.width)//2,(height-stamp.height)//2))
    splash.save(path)
print('Prepared neon fighter legacy/adaptive icons, safe masks and splash.')
