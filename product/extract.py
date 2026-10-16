"""Bounded, offline extraction. Run in a networkless, memory-limited container in production."""
import io, json, sys, zipfile, pathlib, hashlib, warnings
from PIL import Image, ImageOps
import pypdfium2 as pdfium
Image.MAX_IMAGE_PIXELS = 40_000_000
warnings.simplefilter('error', Image.DecompressionBombWarning)
MAX_FILES, MAX_PAGES, MAX_BYTES, MAX_ASSETS = 120, 120, 400*1024*1024, 240
IMAGE_EXT={'.png','.jpg','.jpeg','.webp','.gif'}
def safe_name(name):
    if len(name)>240 or '\\' in name or '\x00' in name or ':' in name or name.startswith('/') or any(x in ('','..','.') for x in name.split('/')):
        raise ValueError('Unsafe path in uploaded files.')
    return name
def extract(manifest, out):
    output=[]; notes=[]; seen=set(); total=0; pages=0; count=0
    out.mkdir(parents=True,exist_ok=True)
    def emit(image,name,text='',page=None):
        if len(output)>=MAX_ASSETS: raise ValueError('Maximum 240 extracted visuals per import.')
        image=ImageOps.exif_transpose(image).convert('RGBA' if image.mode in ('RGBA','LA','P') else 'RGB')
        image.thumbnail((2200,3200))
        buf=io.BytesIO();image.save(buf,'WEBP',quality=89)
        digest=hashlib.sha256(buf.getvalue()).hexdigest()
        # Every source page stays reviewable, including visually identical pages.
        digest=digest+'-'+str(len(output)); file=digest+'.webp';(out/file).write_bytes(buf.getvalue())
        thumb=image.convert('RGB');thumb.thumbnail((768,768));thumb.save(out/(digest+'-ai.jpg'),'JPEG',quality=72)
        output.append({'key':digest,'file':file,'thumb':digest+'-ai.jpg','name':name,'text':text[:6000],'page':page,'width':image.width,'height':image.height,'group':str(pathlib.PurePosixPath(name).parent) if '/' in name else pathlib.PurePosixPath(name).stem})
    def process(data,name):
        nonlocal pages,count
        count+=1
        if count>MAX_FILES: raise ValueError('Maximum 120 files per import.')
        ext=pathlib.PurePosixPath(name).suffix.lower()
        if ext in IMAGE_EXT:
            with Image.open(io.BytesIO(data)) as im:
                if im.format not in ('JPEG','PNG','WEBP','GIF'):raise ValueError('Unsupported image encoding.')
                emit(im,name)
                if getattr(im,'n_frames',1)>1:notes.append(name+': first frame used for import. Keep the original animation separately.')
        elif ext=='.pdf':
            if not data.startswith(b'%PDF-'):raise ValueError('Invalid PDF signature.')
            pdf=pdfium.PdfDocument(data)
            try:
                pages+=len(pdf)
                if pages>MAX_PAGES:raise ValueError('Maximum 120 PDF pages per import.')
                for n in range(len(pdf)):
                    page=pdf[n]
                    try:
                        width,height=page.get_size()
                        if width<=0 or height<=0:raise ValueError('Invalid PDF page.')
                        textpage=page.get_textpage()
                        try:text=textpage.get_text_range()[:6000]
                        finally:textpage.close()
                        bitmap=page.render(scale=min(2,2200/max(width,height)))
                        try:emit(bitmap.to_pil(),name,text,n+1)
                        finally:bitmap.close()
                    finally:page.close()
            finally:pdf.close()
        elif ext in ('.txt','.md'):
            notes.append(name+': '+data[:12000].decode('utf-8',errors='replace'))
        else:notes.append(name+': unsupported working file; export PDF, PNG, JPEG, WebP or GIF.')
    for entry in manifest:
        name=safe_name(entry['name']);data=pathlib.Path(entry['path']).read_bytes()
        if name.lower().endswith('.zip'):
            if not zipfile.is_zipfile(io.BytesIO(data)):raise ValueError('Invalid ZIP file.')
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                infos=archive.infolist()
                if len(infos)>MAX_FILES+100:raise ValueError('Too many ZIP entries.')
                for item in infos:
                    if item.is_dir():continue
                    member=safe_name(item.filename)
                    if ((item.external_attr>>16)&0o170000)==0o120000:raise ValueError('ZIP symbolic links are not allowed.')
                    if item.flag_bits&1:raise ValueError('Encrypted ZIP files are not supported.')
                    if member.lower().endswith('.zip'):raise ValueError('Nested archives are not allowed.')
                    total+=item.file_size
                    if total>MAX_BYTES or item.file_size>50*1024*1024 or item.file_size/max(1,item.compress_size)>100:raise ValueError('Archive expansion limit exceeded.')
                    process(archive.read(item),member)
        else:
            total+=len(data)
            if total>MAX_BYTES:raise ValueError('Import size exceeded.')
            process(data,name)
        print(json.dumps({'progress':min(70,10+round(len(output)/MAX_ASSETS*60))}),flush=True)
    if not output:raise ValueError('No supported visuals found. Export your working files as PDF or images.')
    result={'assets':output,'notes':notes[:120]}
    (out/'extracted.json').write_text(json.dumps(result),encoding='utf-8')
    return result
if __name__=='__main__':
    try:extract(json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')),pathlib.Path(sys.argv[2]))
    except Exception as error:
        print(json.dumps({'error':str(error)[:500]}),flush=True);sys.exit(1)
