import sys,glob,os
from PIL import Image,ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/*.webp'));W=360
sh=Image.new('RGB',(W*len(fs),W*2+20),'white');d=ImageDraw.Draw(sh)
for i,f in enumerate(fs):
  im=Image.open(f);im.thumbnail((W-10,W-10))
  for j,bg in enumerate(['#ffffff','#000000']):
    t=Image.new('RGB',(W,W),bg);t.paste(im,((W-im.width)//2,(W-im.height)//2),im);sh.paste(t,(i*W,20+j*W))
  d.text((i*W+4,4),os.path.basename(f),fill='black')
sh.save(sys.argv[2])
