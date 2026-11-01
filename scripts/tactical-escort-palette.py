"""Recolor existing game-only Super escort derivatives; preserve alpha and anchors."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
out = root / 'public/assets/tactical-remake'
for rank in [1, 2, 3]:
    image = Image.open(root / f'public/assets/neon/escort-super-{rank}.png').convert('RGBA')
    pixels = []
    for r, g, b, a in image.get_flattened_data():
        if a and r > g * 1.15 and b > g * 1.15 and max(r, g, b) > 60:
            value = max(r, g, b) / 255
            r, g, b = (round(channel * value) for channel in (89, 231, 224))
        pixels.append((r, g, b, a))
    image.putdata(pixels)
    image.save(out / f'tactical-escort-super-{rank}.png')
(out / 'ESCORT-CREDITS.txt').write_text(
    'Palette derivatives of this game\'s escort-super-1/2/3 images.\n'
    'Hull source: Gustavo Vituri, SpaceShooterAssetPack; existing project attribution and license retained.\n'
    'https://gvituri.itch.io/space-shooter\n'
    'Only for integration in this game, not a standalone sprite redistribution.\n'
    'Purple Super highlights changed to cyan; alpha, dimensions and anchors unchanged.\n'
    'No generative imagery. Reproduce with scripts/tactical-escort-palette.py.\n', encoding='utf-8')
