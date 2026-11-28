from PIL import Image, ImageDraw; import glob, os, sys
fs=sorted(glob.glob(sys.argv[1])); W=200;H=266;C=10; out=sys.argv[2]
for part in range(0,len(fs),40):
  sub=fs[part:part+40]; R=(len(sub)+C-1)//C
  s=Image.new('RGB',(C*W,R*H),'white'); d=ImageDraw.Draw(s)
  for i,f in enumerate(sub):
    try: im=Image.open(f).convert('RGB')
    except Exception: continue
    w=im.size[0]; im.thumbnail((W,H)); x=(i%C)*W; y=(i//C)*H; s.paste(im,(x,y))
    d.rectangle([x,y,x+60,y+16],fill='black'); d.text((x+3,y+2),os.path.basename(f)[:2]+' '+str(w),fill='yellow')
  s.save(f'{out}-{part//40}.jpg',quality=80)
