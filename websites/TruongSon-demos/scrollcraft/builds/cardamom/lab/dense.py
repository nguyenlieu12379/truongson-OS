import subprocess, os, sys
from PIL import Image, ImageDraw
k=sys.argv[1]; step=float(sys.argv[2]); f=f'reels/{k}.mp4'
d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
os.makedirs(f'frames/{k}',exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',f,'-vf',f'fps=1/{step}','-q:v','2',f'frames/{k}/%03d.jpg'])
fs=sorted(os.listdir(f'frames/{k}')); W=160;H=284;C=12
s=Image.new('RGB',(C*W,((len(fs)+C-1)//C)*H),'white'); dr=ImageDraw.Draw(s)
for i,n in enumerate(fs):
    im=Image.open(f'frames/{k}/{n}'); im.thumbnail((W,H)); x=(i%C)*W;y=(i//C)*H; s.paste(im,(x,y)); dr.rectangle([x,y,x+40,y+14],fill='black'); dr.text((x+2,y+1),f'{(i)*step+step/2:.1f}' if False else f'{i*step:.1f}',fill='yellow')
s.save(f'dense-{k}.jpg',quality=80)
