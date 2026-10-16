import io,sys,pathlib,zipfile
from PIL import Image,ImageDraw
out=pathlib.Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
images=[]
for index,color in enumerate(['#e87526','#402768','#82a582']):
    im=Image.new('RGB',(700,500),color);ImageDraw.Draw(im).text((40,40),'Project '+str(index+1),fill='white');images.append(im)
    im.save(out/('image'+str(index)+'.png'))
with zipfile.ZipFile(out/'portfolio.zip','w') as z:
    z.write(out/'image0.png','Coffee/01.png');z.write(out/'image1.png','Coffee/02.png');z.write(out/'image2.png','Studio/01.png')
with zipfile.ZipFile(out/'unsafe.zip','w') as z:z.write(out/'image0.png','../outside.png')
images[0].save(out/'portfolio.pdf',save_all=True,append_images=images[1:])
