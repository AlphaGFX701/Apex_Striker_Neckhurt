from pathlib import Path
from PIL import Image, ImageDraw
from collections import deque
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
sheet=Image.new('RGB',(900,900),'#0a1420');draw=ImageDraw.Draw(sheet);report=[]
for k,p in enumerate(sorted((ROOT/'public/assets/modules/previews').glob('*.png'))):
 im=Image.open(p).convert('RGBA');a=im.resize((160,160)).getchannel('A');pixels={(x,y) for y in range(160) for x in range(160) if a.getpixel((x,y))>60};areas=[]
 while pixels:
  q=deque([pixels.pop()]);n=0
  while q:
   x,y=q.popleft();n+=1
   for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if point in pixels:pixels.remove(point);q.append(point)
  areas.append(n)
 major=sorted([n for n in areas if n>30],reverse=True);report.append({'ship':p.stem,'majorAlphaComponents':major})
 im.thumbnail((145,145));x=k%6*150;y=k//6*175;sheet.paste(im,(x,y),im);draw.text((x+12,y+145),p.stem[5:],fill='#a4c7dd')
sheet.save(OUT/'27-builds.png');(OUT/'asset-check.json').write_text(json.dumps(report,indent=2))
assert len(report)==27
assert all(len(r['majorAlphaComponents'])==1 for r in report),report
print('All 27 ship builds have one connected major alpha silhouette; contact sheet saved.')
