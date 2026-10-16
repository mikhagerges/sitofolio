"""Bounded local palette extraction. No images or documents leave the server."""
import sys,json,re,io
from PIL import Image,ImageOps
Image.MAX_IMAGE_PIXELS=24000000
path=sys.argv[1]
colors={};hexes=[];sampled=[]
def analyze(image):
    image=ImageOps.exif_transpose(image).convert('RGB')
    image.thumbnail((320,320))
    reduced=image.quantize(colors=12,method=Image.Quantize.MEDIANCUT).convert('RGB')
    for count,rgb in reduced.getcolors(320*320) or []:
        value='#%02x%02x%02x'%rgb
        colors[value]=colors.get(value,0)+count
try:
    with open(path,'rb') as stream:magic=stream.read(16)
    if magic.startswith(b'%PDF-'):
        import pypdfium2 as pdfium
        doc=pdfium.PdfDocument(path)
        if not 1<=len(doc)<=500:raise ValueError('Use a PDF with 1 to 500 pages.')
        sampled=sorted(set(round(i*(len(doc)-1)/min(7,len(doc)-1)) for i in range(min(8,len(doc))))) if len(doc)>1 else [0]
        for index in sampled:
            page=doc[index]
            text=page.get_textpage()
            hexes.extend(re.findall(r'(?<![\w])#[A-Fa-f0-9]{6}(?![\w])',text.get_text_range()))
            text.close()
            width,height=page.get_size()
            bitmap=page.render(scale=min(1,600/max(width,height)))
            analyze(bitmap.to_pil())
            bitmap.close();page.close()
        doc.close()
    else:
        with Image.open(path) as image:
            if image.format not in ['PNG','JPEG','WEBP','GIF']:raise ValueError('Use PNG, JPG, WebP, GIF or PDF.')
            if image.width*image.height>24000000:raise ValueError('Image pixel limit exceeded.')
            analyze(image)
    selected=[]
    def distance(a,b):return sum((int(a[i:i+2],16)-int(b[i:i+2],16))**2 for i in (1,3,5))**.5
    for color in [*dict.fromkeys(h.lower() for h in hexes),*sorted(colors,key=colors.get,reverse=True)]:
        if all(distance(color,c)>38 for c in selected):selected.append(color)
        if len(selected)==8:break
    if not selected:raise ValueError('No colors found in this file.')
    print(json.dumps({'colors':selected,'sampledPages':[i+1 for i in sampled],'local':True}))
except Exception:
    print(json.dumps({'error':'Could not read this file. Use an unencrypted PDF or a supported image up to 24 megapixels.'}))
    sys.exit(1)
