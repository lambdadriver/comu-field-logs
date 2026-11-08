# Radio icon for COMU Field Logs, drawn with PIL (no AI art).
# Copyright 2026 lambdadriver. GPL-3.0. See LICENSE.
# The launcher PNGs in android/res are the build inputs. Running this
# generator is not proven to reproduce those PNG files byte for byte.
from PIL import Image, ImageDraw
import os
BG=(11,58,110,255); W=(255,255,255,255); AMBER=(255,197,47,255); DARK=(11,58,110,255)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def radio(size, inset):
    """Draw the radio on a transparent canvas of `size`; art fits inside the centered box of size*inset."""
    S=size*4; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    box=S*inset; ox=(S-box)/2; u=box/100.0
    X=lambda v: ox+v*u
    d.rounded_rectangle([X(30),X(4),X(39),X(34)],radius=4*u,fill=W)
    d.rounded_rectangle([X(22),X(28),X(66),X(96)],radius=9*u,fill=W)
    d.rounded_rectangle([X(50),X(20),X(60),X(30)],radius=2*u,fill=W)
    d.rounded_rectangle([X(29),X(36),X(59),X(52)],radius=3*u,fill=AMBER)
    for i in range(4):
        y=X(60+i*7.5); d.rounded_rectangle([X(30),y,X(58),y+3.6*u],radius=1.8*u,fill=DARK)
    for r,wd in ((14,5),(25,5),(36,5)):
        cx,cy=X(35),X(12)
        d.arc([cx-r*u, cy-r*u, cx+r*u, cy+r*u],start=-60,end=20,fill=W,width=int(wd*u))
    return im.resize((size,size),Image.LANCZOS)
def legacy(size):
    S=size*4; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,S-1,S-1],radius=S*0.22,fill=BG)
    im=im.resize((size,size),Image.LANCZOS)
    im.alpha_composite(radio(size,0.80)); return im
def main():
    res=os.path.join(ROOT,'android','res')
    art=os.path.join(ROOT,'art')
    for name,dp in (('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)):
        os.makedirs(f'{res}/mipmap-{name}',exist_ok=True)
        legacy(int(48*dp)).save(f'{res}/mipmap-{name}/ic_launcher.png')
        radio(int(108*dp),0.58).save(f'{res}/mipmap-{name}/ic_launcher_fg.png')
    legacy(512).save(os.path.join(art,'icon_512.png'))
    legacy(192).save(os.path.join(art,'icon_192.png'))
if __name__=='__main__':
    main()
