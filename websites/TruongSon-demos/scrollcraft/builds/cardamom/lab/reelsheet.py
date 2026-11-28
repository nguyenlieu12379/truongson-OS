import subprocess, glob, os, json
from PIL import Image, ImageDraw
os.makedirs('frames', exist_ok=True)
rows=[]
for f in sorted(glob.glob('reels/*.mp4')):
    k=os.path.basename(f)[:-4]
    d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip() or 0)
    wh=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip()
    ims=[]
    for i in range(8):
        t=d*(i+0.5)/8; o=f'frames/{k}-{t:.1f}.jpg'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.2f}','-i',f,'-frames:v','1','-q:v','3',o])
        if os.path.exists(o): ims.append((t,Image.open(o).convert('RGB')))
    rows.append((k,wh,d,ims))
W=150;H=266
s=Image.new('RGB',(8*W+180,len(rows)*H),'white'); dr=ImageDraw.Draw(s)
for r,(k,wh,d,ims) in enumerate(rows):
    dr.text((4,r*H+10),f'{k}\n{wh}\n{d:.0f}s',fill='black')
    for i,(t,im) in enumerate(ims):
        im.thumbnail((W,H)); s.paste(im,(180+i*W,r*H)); dr.text((180+i*W+3,r*H+3),f'{t:.1f}',fill='yellow')
s.save('reels-sheet.jpg',quality=80); print(len(rows))
