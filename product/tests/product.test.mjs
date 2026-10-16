import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sitofolio-test-'));
process.env.DATA_DIR=dir;process.env.APP_ORIGIN='http://127.0.0.1:4189';process.env.AI_JOB_CALL_LIMIT='2';delete process.env.OPENAI_API_KEY;
const {server}=await import('../server.mjs');const {tick,reserveAI}=await import('../imports.mjs');const {db,get}=await import('../db.mjs');const {safePath,seal,unseal}=await import('../security.mjs');const {validateReview}=await import('../portfolio.mjs');
await new Promise(r=>server.listen(4189,'127.0.0.1',r));
const origin=process.env.APP_ORIGIN;
async function request(route,method='GET',data,cookie=''){const r=await fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});const text=await r.text();return {status:r.status,data:()=>JSON.parse(text),text,cookie:r.headers.get('set-cookie')?.split(';')[0]}}
let alice,bob,jobId,assetId;
test('real accounts, isolated empty workspaces and password hashing',async()=>{alice=await request('/api/register','POST',{name:'Designer Alice',email:'alice@example.test',password:'correct horse battery 2026'});bob=await request('/api/register','POST',{name:'Designer Bob',email:'bob@example.test',password:'another correct battery 2026'});assert.equal(alice.status,201);assert.equal(bob.status,201);const w=await request('/api/workspace','GET',null,alice.cookie);assert.equal(w.data().data.projects.length,0);assert.equal(w.data().data.profile.name,'Designer Alice');assert.ok(!get('SELECT password FROM users WHERE email=?','alice@example.test').password.includes('correct'));assert.equal((await request('/api/login','POST',{email:'alice@example.test',password:'wrong'})).status,401)});
test('cross-origin mutations and stale writes rejected',async()=>{const r=await fetch(origin+'/api/workspace',{method:'PUT',headers:{Cookie:alice.cookie,Origin:'https://evil.test'},body:'{}'});assert.equal(r.status,403);const w=(await request('/api/workspace','GET',null,alice.cookie)).data();w.data.profile.title='Brand designer';assert.equal((await request('/api/workspace','PUT',w,alice.cookie)).status,200);assert.equal((await request('/api/workspace','PUT',w,alice.cookie)).status,409)});
test('ZIP extraction keeps every visual and requires explicit review',async()=>{execFileSync(process.env.PYTHON_PATH||'python',[path.resolve('tests/fixtures.py'),dir]);const job=await request('/api/imports','POST',{},alice.cookie);jobId=job.data().id;let r=await fetch(origin+'/api/imports/'+jobId+'/files?name=portfolio.zip',{method:'POST',headers:{Origin:origin,Cookie:alice.cookie},body:fs.readFileSync(path.join(dir,'portfolio.zip'))});assert.equal(r.status,201);assert.equal((await request('/api/imports/'+jobId+'/start','POST',{ai:false},alice.cookie)).status,202);await tick();const j=(await request('/api/imports/'+jobId,'GET',null,alice.cookie)).data();assert.equal(j.status,'review');assert.equal(j.result.projects.length,2);assert.equal(j.result.assets.length,3);assetId=j.result.assets[0].id;assert.equal((await request('/api/workspace','GET',null,alice.cookie)).data().data.projects.length,0);assert.equal((await request('/api/imports/'+jobId+'/commit','POST',{revision:j.revision},alice.cookie)).status,409);assert.equal((await request('/api/imports/'+jobId,'GET',null,bob.cookie)).status,404);assert.equal((await fetch(origin+'/media/'+assetId,{headers:{Cookie:bob.cookie}})).status,404)});
test('review validation prevents foreign assets and duplicates',()=>{const p={title:'Work',category:'Other',client:'',year:'',role:'',description:'',visuals:['a']};assert.throws(()=>validateReview({projects:[p,{...p}]},new Set(['a'])));assert.throws(()=>validateReview({projects:[p]},new Set(['b'])))});
test('commit is transactional, idempotent and creates private drafts',async()=>{const j=(await request('/api/imports/'+jobId,'GET',null,alice.cookie)).data();const result=await request('/api/imports/'+jobId+'/commit','POST',{revision:j.revision,reviewed:true},alice.cookie);assert.equal(result.status,200);const duplicate=await request('/api/imports/'+jobId+'/commit','POST',{revision:j.revision,reviewed:true},alice.cookie);assert.equal(duplicate.data().alreadyCreated,true);const w=(await request('/api/workspace','GET',null,alice.cookie)).data();assert.equal(w.data.projects.length,2);assert.ok(w.data.projects.every(p=>p.status==='Draft'&&p.visibility==='Private'))});
test('publish excludes drafts, exposes only published media and preserves snapshot',async()=>{const w=(await request('/api/workspace','GET',null,alice.cookie)).data();w.data.projects[0].status='Published';w.data.projects[0].visibility='Public';w.data.projects[0].title='<script>alert(1)</script>';const saved=await request('/api/workspace','PUT',w,alice.cookie);const pub=await request('/api/publish','POST',{slug:'alice-work',revision:saved.data().revision},alice.cookie);assert.equal(pub.status,200);const page=await request('/s/alice-work');assert.ok(!page.text.includes('<script>alert(1)</script>'));assert.ok(page.text.includes('&lt;script&gt;'));assert.ok(!page.text.includes('Studio</h3>'));assert.equal((await fetch(origin+'/media/'+assetId)).status,200);const changed=(await request('/api/workspace','GET',null,alice.cookie)).data();changed.data.projects[0].title='Changed draft';await request('/api/workspace','PUT',changed,alice.cookie);assert.ok(!(await request('/s/alice-work')).text.includes('Changed draft'));assert.equal((await request('/api/publish','POST',{slug:'alice-work',revision:0},bob.cookie)).status,409)});
test('PDF extraction keeps all pages without clipping',async()=>{const j=(await request('/api/imports','POST',{},alice.cookie)).data();await fetch(origin+'/api/imports/'+j.id+'/files?name=portfolio.pdf',{method:'POST',headers:{Origin:origin,Cookie:alice.cookie},body:fs.readFileSync(path.join(dir,'portfolio.pdf'))});await request('/api/imports/'+j.id+'/start','POST',{ai:false},alice.cookie);await tick();const done=(await request('/api/imports/'+j.id,'GET',null,alice.cookie)).data();assert.equal(done.status,'review');assert.equal(done.result.assets.length,3);assert.deepEqual(done.result.assets.map(a=>a.page),[1,2,3])});
test('archive traversal is rejected by parser',async()=>{const j=(await request('/api/imports','POST',{},alice.cookie)).data();await fetch(origin+'/api/imports/'+j.id+'/files?name=unsafe.zip',{method:'POST',headers:{Origin:origin,Cookie:alice.cookie},body:fs.readFileSync(path.join(dir,'unsafe.zip'))});await request('/api/imports/'+j.id+'/start','POST',{ai:false},alice.cookie);await tick();const done=(await request('/api/imports/'+j.id,'GET',null,alice.cookie)).data();assert.equal(done.status,'failed');assert.match(done.error,/Unsafe path/);assert.ok(!fs.existsSync(path.join(dir,'outside.png')))});
test('AI spending is reserved before requests, caps retries and secrets are encrypted',()=>{reserveAI('a','budget-test','light');reserveAI('a','budget-test','light');assert.throws(()=>reserveAI('a','budget-test','light'),/budget/);assert.equal(get('SELECT count(*) n FROM usage WHERE job_id=?','budget-test').n,2);const ciphertext=seal('refresh-token-private');assert.ok(!ciphertext.includes('refresh-token-private'));assert.equal(unseal(ciphertext),'refresh-token-private');assert.throws(()=>safePath('../escape.pdf'));assert.throws(()=>safePath('C:\\escape.pdf'))});
test('unconfigured providers fail honestly without simulated upgrades',async()=>{assert.equal((await request('/api/config')).data().ai,false);const r=await request('/api/billing/checkout','POST',{plan:'solo'},alice.cookie);assert.equal(r.status,503);assert.equal((await request('/api/me','GET',null,alice.cookie)).data().plan,'free')});
test('private library and hidden block media never become public',async()=>{const w=(await request('/api/workspace','GET',null,alice.cookie)).data();const hidden=w.data.projects[1].cover;w.data.assets=[{url:hidden,name:'Private library image'}];w.data.projects[0].blocks.push({id:crypto.randomUUID(),type:'Big Image',image:hidden,visible:false});const saved=await request('/api/workspace','PUT',w,alice.cookie);await request('/api/publish','POST',{slug:'alice-work',revision:saved.data().revision},alice.cookie);assert.equal((await fetch(origin+hidden)).status,404)});
test('password protection verifies a secret and blocks direct media access',async()=>{db.prepare("UPDATE users SET plan='pro' WHERE email=?").run('alice@example.test');let w=(await request('/api/workspace','GET',null,alice.cookie)).data();const p=w.data.projects[1];assert.equal((await request('/api/projects/'+p.id+'/password','POST',{password:'Private project password 2026'},alice.cookie)).status,200);w=(await request('/api/workspace','GET',null,alice.cookie)).data();w.data.projects[1].status='Published';const saved=await request('/api/workspace','PUT',w,alice.cookie);await request('/api/publish','POST',{slug:'alice-work',revision:saved.data().revision},alice.cookie);const url='/s/alice-work/project/'+p.id;assert.match((await request(url)).text,/A private story/);assert.equal((await fetch(origin+p.cover)).status,404);const wrong=await fetch(origin+url+'/unlock',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:'password=wrong',redirect:'manual'});assert.equal(wrong.status,403);const good=await fetch(origin+url+'/unlock',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:'Private project password 2026'}),redirect:'manual'});assert.equal(good.status,303);const grant=good.headers.get('set-cookie').split(';')[0];assert.equal((await fetch(origin+p.cover,{headers:{Cookie:grant}})).status,200);assert.ok(!(await request(url,'GET',null,grant)).text.includes('A private story.'))});
test('CV uploads are private attachments until referenced by a published snapshot',async()=>{const r=await fetch(origin+'/api/cv',{method:'POST',headers:{Origin:origin,Cookie:alice.cookie},body:fs.readFileSync(path.join(dir,'portfolio.pdf'))});assert.equal(r.status,201);const cv=await r.json();assert.equal((await fetch(origin+cv.url)).status,404);const own=await fetch(origin+cv.url,{headers:{Cookie:alice.cookie}});assert.equal(own.status,200);assert.match(own.headers.get('content-disposition'),/attachment/)});
test('resumable uploads recover offsets, reject cross-tenant writes and verify checksums',async()=>{
  const {createHash}=await import('node:crypto');const bytes=fs.readFileSync(path.join(dir,'portfolio.pdf'));
  const job=(await request('/api/imports','POST',{},bob.cookie)).data();
  const metadata={name:'resume.pdf',bytes:bytes.length,digest:createHash('sha256').update(bytes).digest('hex')};
  const start=(await request('/api/imports/'+job.id+'/uploads','POST',metadata,bob.cookie)).data();
  const midpoint=Math.floor(bytes.length/2);
  const send=(offset,data,cookie)=>fetch(origin+'/api/uploads/'+start.id+'?offset='+offset,{method:'PATCH',headers:{Origin:origin,Cookie:cookie},body:data});
  assert.equal((await send(0,bytes.subarray(0,midpoint),bob.cookie)).status,200);
  assert.equal((await send(0,bytes.subarray(0,midpoint),bob.cookie)).status,409);
  assert.equal((await send(midpoint,bytes.subarray(midpoint),alice.cookie)).status,404);
  const resumed=(await request('/api/imports/'+job.id+'/uploads','POST',metadata,bob.cookie)).data();assert.equal(resumed.offset,midpoint);assert.equal(resumed.id,start.id);
  assert.equal((await request('/api/imports/'+job.id+'/start','POST',{ai:false},bob.cookie)).status,409);
  assert.equal((await send(midpoint,bytes.subarray(midpoint),bob.cookie)).status,200);
  assert.equal((await request('/api/uploads/'+start.id+'/complete','POST',{},bob.cookie)).status,200);
  assert.equal((await request('/api/imports/'+job.id+'/uploads','POST',metadata,bob.cookie)).data().complete,true);
  await request('/api/imports/'+job.id+'/start','POST',{ai:false},bob.cookie);await tick();assert.equal((await request('/api/imports/'+job.id,'GET',null,bob.cookie)).data().result.assets.length,3);
});
test('preview shares the published renderer and dedicated pages preserve their content',async()=>{
  assert.equal((await request('/preview')).status,401);
  const w=(await request('/api/workspace','GET',null,alice.cookie)).data();
  w.data.pageMode.About='Dedicated page';w.data.profile.bio='A specific story for the about page.';w.data.sections.find(s=>s.type==='About').content={title:'Behind the work',items:[]};
  w.data.personalBrand.enabled=true;w.data.personalBrand.statement='A cinematic point of view';w.data.cinematic={enabled:true,kicker:'Independent perspective',line:'A scene with depth',depth:1};
  const saved=await request('/api/workspace','PUT',w,alice.cookie);assert.equal(saved.status,200);
  await request('/api/publish','POST',{slug:'alice-work',revision:saved.data().revision},alice.cookie);
  const live=(await request('/s/alice-work')).text,preview=(await request('/preview','GET',null,alice.cookie)).text;
  for(const text of ['cinema-hero','Independent perspective','A scene with depth','/presentation.css','/public.js']){assert.ok(live.includes(text),text);assert.ok(preview.includes(text),text)}
  assert.ok(!live.includes('id="about"'));assert.ok((await request('/s/alice-work/about')).text.includes('A cinematic point of view'));
  assert.equal((await request('/preview/work','GET',null,alice.cookie)).status,200);
  assert.match((await request('/editor','GET',null,alice.cookie)).text,/editor-presentation.js/);
});
test('plan controls, publishing metadata and configuration keep secrets server-side',async()=>{
  const {aiAllowance}=await import('../config.mjs');assert.ok(aiAllowance('free')<aiAllowance('solo'));assert.ok(aiAllowance('solo')<aiAllowance('pro'));
  const w=(await request('/api/workspace','GET',null,bob.cookie)).data();w.data.publish.ogImage='/media/'+assetId;
  assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,403);
  w.data.publish.ogImage='assets/maison-olive.png';assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,402);
  w.data.publish.ogImage='';w.data.publish.branding=false;w.data.publish.favicon='assets/maison-olive.png';assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,200);
  assert.equal((await request('/api/workspace','GET',null,bob.cookie)).data().data.publish.branding,true);
  for(const route of ['/.env','/.env.example','/data/sitofolio.sqlite','/config.mjs','/prototype/../.env'])assert.equal((await request(route)).status,404);
  const publicConfig=(await request('/api/config')).text;assert.ok(!/SECRET|API_KEY|TOKEN_ENCRYPTION|PASSWORD/.test(publicConfig));
});
test('portfolio validation rejects executable and traversing media URLs',async()=>{
  const w=(await request('/api/workspace','GET',null,bob.cookie)).data();w.data.profile.photo='javascript:alert(1)';assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,400);
  w.data.profile.photo='assets/../../.env';assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,400);
  w.data.profile.photo='';w.data.accent='red; background:url(https://bad.test)';assert.equal((await request('/api/workspace','PUT',w,bob.cookie)).status,400);
});
test('background Drive copies checkpoint completed files and retry without re-exporting them',async()=>{
  const {driveTick}=await import('../drive-import.mjs');
  const {run}=await import('../db.mjs');const j=(await request('/api/imports','POST',{},bob.cookie)).data();const bytes=fs.readFileSync(path.join(dir,'portfolio.pdf'));
  run('INSERT INTO drive_sources(job_id,selection) VALUES(?,?)',j.id,JSON.stringify(['folder-one']));run("UPDATE jobs SET status='drive_queued' WHERE id=?",j.id);
  let exports=0,temporaryFailure=true;
  const services={list:async()=>({files:[{id:'native-one'},{id:'file-two'}]}),export:async()=>{exports++;return new Response(bytes)},request:async(user,file,options)=>{if(options.alt==='media'){if(temporaryFailure)throw Object.assign(Error('Temporary Drive failure'),{status:502});return new Response(bytes)}return new Response(JSON.stringify({id:file,name:file==='folder-one'?'Selected folder':file==='native-one'?'Native presentation':'Second.pdf',mimeType:file==='folder-one'?'application/vnd.google-apps.folder':file==='native-one'?'application/vnd.google-apps.presentation':'application/pdf',capabilities:{canDownload:true},size:file==='file-two'?bytes.length:undefined}))}};
  await driveTick(services);let job=(await request('/api/imports/'+j.id,'GET',null,bob.cookie)).data();assert.equal(job.status,'failed');assert.equal(job.files.length,1);assert.equal(exports,1);
  assert.equal((await request('/api/imports/'+j.id+'/retry','POST',{},bob.cookie)).status,202);temporaryFailure=false;await driveTick(services);job=(await request('/api/imports/'+j.id,'GET',null,bob.cookie)).data();assert.equal(job.status,'uploading');assert.equal(job.files.length,2);assert.equal(exports,1);assert.equal(job.files[0].name,'Selected folder/Native presentation.pdf');
});
test('review cover choice changes the cover without reordering or dropping the story',async()=>{
  const {reviewProjects}=await import('../portfolio.mjs');const project=reviewProjects({projects:[{title:'Complete story',category:'Branding',client:'',year:'',role:'',description:'',visuals:['first','second','third'],cover:'third'}]})[0];assert.equal(project.cover,'/media/third');assert.deepEqual(project.blocks.filter(b=>b.type==='Big Image').map(b=>b.image),['/media/first','/media/second','/media/third']);
});
test('twenty populated templates expose navigable sample stories without changing an account',async()=>{
  const {templates,templateWorkspace}=await import('../templates.mjs');
  assert.equal(templates.length,20);
  const before=(await request('/api/workspace','GET',null,bob.cookie)).data();
  for(const t of templates){const page=await request('/templates/'+t.id);assert.equal(page.status,200);assert.ok(page.text.includes('Mikha Gerges'));assert.ok(page.text.includes('real work'));assert.ok(page.text.includes('235'));assert.ok(page.text.includes('Premiere Pro'));assert.ok(!page.text.includes('Maison Olive'));const example=templateWorkspace(t.id);assert.equal(example.projects.length,14);assert.equal(example.profile.phone,'+20 1557204528');const haza=example.projects.find(p=>p.templateSample==='haza');const story=await request('/templates/'+t.id+'/project/'+haza.id);assert.equal(story.status,200);assert.ok(story.text.includes('Moodboard &amp; creative direction'));assert.ok(story.text.includes('haza-page-027.jpg'));assert.ok(!story.text.includes('<form'));assert.deepEqual(haza.blocks.filter(b=>b.type==='Big Image').map(b=>b.sourcePage),Array.from({length:27},(_,i)=>i+1));}
  assert.deepEqual((await request('/api/workspace','GET',null,bob.cookie)).data(),before);
  assert.equal((await request('/templates/unknown')).status,404);assert.equal((await request('/templates/aire/project/00000000-0000-4000-8000-000000000009')).status,404);
});
test('template application preserves content, keeps samples private and does not duplicate them',async()=>{
  const {applyTemplate}=await import('../templates.mjs'),{freshWorkspace}=await import('../portfolio.mjs');
  const w=freshWorkspace('Original owner');w.profile.bio='My own biography';w.projects=[{id:crypto.randomUUID(),title:'My real project',status:'Draft',visibility:'Private',blocks:[]}];
  const applied=applyTemplate(w,'folio',{samples:true,maxProjects:5});assert.equal(w.projects.length,1);assert.equal(applied.profile.name,w.profile.name);assert.equal(applied.profile.bio,w.profile.bio);assert.deepEqual(applied.projects[0],w.projects[0]);assert.equal(applied.projects.length,4);assert.ok(applied.projects.slice(1).every(p=>p.status==='Draft'&&p.visibility==='Private'&&p.templateSample&&p.blocks.filter(b=>b.type==='Big Image').length>=1));assert.equal(applyTemplate(applied,'aire',{samples:true,maxProjects:5}).projects.length,4);assert.throws(()=>applyTemplate(w,'aire',{samples:true,maxProjects:3}),/project space/);
  const layoutOnly=applyTemplate(w,'studio');assert.deepEqual(layoutOnly.projects,w.projects);assert.deepEqual(layoutOnly.profile,w.profile);
});
test('template endpoint enforces authentication and revision checks',async()=>{
  assert.equal((await request('/api/templates/apply','POST',{template:'folio',samples:true,revision:0})).status,401);
  const account=await request('/api/register','POST',{name:'Template reviewer',email:'templates@example.test',password:'isolated template fixture 2026'});assert.equal(account.status,201);
  const result=await request('/api/templates/apply','POST',{template:'folio',samples:true,revision:0},account.cookie);assert.equal(result.status,200);assert.equal(result.data().added,3);
  assert.equal((await request('/api/templates/apply','POST',{template:'aire',samples:true,revision:0},account.cookie)).status,409);
  const ws=(await request('/api/workspace','GET',null,account.cookie)).data();assert.equal(ws.data.profile.name,'Template reviewer');assert.equal(ws.data.projects.length,3);assert.ok(ws.data.projects.every(p=>p.visibility==='Private'));
  assert.equal((await request('/api/templates/apply','POST',{template:'aire',samples:true,revision:ws.revision},account.cookie)).data().added,0);
});

test('trying a direction with owner content is private and leaves the stored workspace untouched',async()=>{
  const before=(await request('/api/workspace','GET',null,bob.cookie)).data();
  const preview=await request('/preview?template=cutpaper','GET',null,bob.cookie);assert.equal(preview.status,200);assert.ok(preview.text.includes('direction-cutpaper'));assert.ok(preview.text.includes('Designer Bob'));assert.ok(preview.text.includes('noindex,nofollow'));
  assert.ok(preview.text.includes('/preview/work?template=cutpaper'));const trialWork=await request('/preview/work?template=pencil','GET',null,bob.cookie);assert.equal(trialWork.status,200);assert.ok(trialWork.text.includes('data-template="pencil"'));assert.ok(trialWork.text.includes('/preview?template=pencil'));
  assert.deepEqual((await request('/api/workspace','GET',null,bob.cookie)).data(),before);assert.equal((await request('/preview?template=cutpaper')).status,401);
  const {templateWorkspace}=await import('../templates.mjs'),{renderPresentation}=await import('../presentation.mjs');const w=templateWorkspace('pencil');w.profile.name='<script>alert(1)</script>';w.headline='<img src=x onerror=alert(1)>';w.heroImage='https://untrusted.test/secret.png';const html=renderPresentation(w,'/preview',{mode:'preview'});assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html.includes('https://untrusted.test/secret.png'));
  const portrait=templateWorkspace('noir');portrait.profile.photo='';portrait.heroImage=portrait.projects[0].cover;const {directionHero}=await import('../direction-hero.mjs');const header=directionHero(portrait,'/preview');assert.ok(header.includes('Add your portrait'));assert.ok(!header.includes(portrait.projects[0].cover));
});
test('palette extraction is local, authenticated, bounded and cleans temporary inputs',async()=>{
 const image=fs.readFileSync(path.join(dir,'image0.png')),pdf=fs.readFileSync(path.join(dir,'portfolio.pdf'));
 const extract=(bytes,cookie=alice.cookie,originHeader=origin)=>fetch(origin+'/api/palettes/extract',{method:'POST',headers:{Origin:originHeader,Cookie:cookie,'Content-Type':'application/octet-stream'},body:bytes});
 assert.equal((await extract(image,'')).status,401);assert.equal((await extract(image,alice.cookie,'https://foreign.test')).status,403);
 const before=(await request('/api/workspace','GET',null,alice.cookie)).data(),usage=get('SELECT count(*) n FROM usage').n;
 const color=await extract(image);assert.equal(color.status,200);const palette=await color.json();assert.ok(palette.colors.includes('#e87526'));assert.equal(palette.local,true);
 const document=await extract(pdf);assert.equal(document.status,200);assert.deepEqual((await document.json()).sampledPages,[1,2,3]);
 assert.equal((await extract(Buffer.from('<svg onload="alert(1)"/>'))).status,415);
 const tooLarge=Buffer.alloc(8*1024*1024+1);tooLarge.set([255,216,255]);assert.equal((await extract(tooLarge)).status,413);
 assert.equal((await extract(Buffer.from('%PDF-corrupt'))).status,422);
 assert.deepEqual((await request('/api/workspace','GET',null,alice.cookie)).data(),before);assert.equal(get('SELECT count(*) n FROM usage').n,usage);
 assert.deepEqual(fs.readdirSync(path.join(dir,'palette-temp')),[]);
 await extract(image);assert.equal((await extract(image)).status,429);
 const editable=(await request('/api/workspace','GET',null,alice.cookie)).data();editable.data.colorPalette={background:'#173d32',text:'#ffffff',accent:'#efe4d2',surface:'#854f2c'};editable.data.accent=editable.data.colorPalette.accent;assert.equal((await request('/api/workspace','PUT',editable,alice.cookie)).status,200);assert.equal((await request('/api/workspace','PUT',editable,alice.cookie)).status,409);const saved=(await request('/api/workspace','GET',null,alice.cookie)).data();assert.deepEqual(saved.data.colorPalette,editable.data.colorPalette);assert.ok((await request('/preview','GET',null,alice.cookie)).text.includes('--portfolio-bg:#173d32'));const {applyTemplate}=await import('../templates.mjs');assert.deepEqual(applyTemplate(saved.data,'noir').colorPalette,editable.data.colorPalette);
});
test('real example collection preserves every supplied source and safely streams complete motion files',async()=>{
 const collection=JSON.parse(fs.readFileSync(new URL('../example-work.public.json',import.meta.url)));
 assert.equal(collection.files,210);assert.equal(new Set(collection.inventory.map(f=>f.id)).size,210);const displayed=collection.projects.flatMap(p=>p.sourceFiles);assert.equal(displayed.length,210);assert.deepEqual(new Set(displayed),new Set(collection.inventory.map(f=>f.id)));
 for(const p of collection.projects){for(const b of p.blocks.filter(b=>b.type==='Big Image'||b.type==='Hosted Video'))assert.ok(fs.existsSync(path.resolve('web',(b.image||b.url).slice(1))),b.image||b.url);}
 const video=collection.projects.flatMap(p=>p.blocks).find(b=>b.type==='Hosted Video').url;
 const chunk=await fetch(origin+video,{headers:{Range:'bytes=0-1023'}});assert.equal(chunk.status,206);assert.equal(chunk.headers.get('content-type'),'video/mp4');assert.equal((await chunk.arrayBuffer()).byteLength,1024);assert.match(chunk.headers.get('content-range'),/^bytes 0-1023\/\d+$/);
 assert.equal((await fetch(origin+video,{headers:{Range:'bytes=99999999999-'}})).status,416);
 assert.equal((await request('/examples/portrait-prompt.txt')).status,404);
 assert.equal((await request('/templates/noir?colors=101312-f6f1e8-a6ccff-202629')).status,200);
 assert.equal((await request('/templates/noir?colors=red;alert(1)')).status,400);
 const {validatePresentation}=await import('../portfolio.mjs'),w=(await request('/api/workspace','GET',null,bob.cookie)).data().data;w.colorPalette={background:'url(https://evil.test)',text:'#ffffff',accent:'#ffffff',surface:'#ffffff'};assert.throws(()=>validatePresentation(w),/palette/);
});
test('a new account resumes setup and completes with its own empty private portfolio',async()=>{
 const {updateSetup,completeSetup}=await import('../web/onboarding.js');
 const account=await request('/api/register','POST',{name:'Setup owner',email:'setup-owner@example.test',password:'isolated setup fixture 2026'});assert.equal(account.status,201);
 let w=(await request('/api/workspace','GET',null,account.cookie)).data();assert.equal(w.data.onboarding.needsSetup,true);assert.equal(w.data.onboarding.setupStep,1);assert.deepEqual(w.data.projects,[]);assert.equal(w.data.profile.photo,'');
 for(const [step,fields] of [[1,{role:'UI/UX Designer',goal:'Get hired'}],[2,{personality:['Minimal','Clean Professional']}],[3,{name:'Setup owner',title:'Product designer',bio:'',location:''}],[4,{}]]){w.data=updateSetup(w.data,step,fields);const saved=await request('/api/workspace','PUT',w,account.cookie);assert.equal(saved.status,200);w=(await request('/api/workspace','GET',null,account.cookie)).data();}
 assert.equal(w.data.onboarding.setupStep,5);assert.deepEqual(w.data.onboarding.personality,['Minimal','Clean Professional']);assert.equal(w.data.profile.title,'Product designer');
 const before=structuredClone(w);assert.equal((await request('/templates/mosaic')).status,200);assert.deepEqual((await request('/api/workspace','GET',null,account.cookie)).data(),before);
 assert.equal((await request('/api/templates/apply','POST',{template:'mosaic',samples:false,revision:w.revision},account.cookie)).status,200);w=(await request('/api/workspace','GET',null,account.cookie)).data();w.data=completeSetup(w.data);assert.equal((await request('/api/workspace','PUT',w,account.cookie)).status,200);assert.equal((await request('/api/workspace','PUT',w,account.cookie)).status,409);
 const completed=(await request('/api/workspace','GET',null,account.cookie)).data();assert.equal(completed.data.onboarding.complete,true);assert.equal(completed.data.onboarding.needsSetup,false);assert.equal(completed.data.profile.name,'Setup owner');assert.deepEqual(completed.data.projects,[]);assert.equal(completed.data.profile.photo,'');assert.equal(completed.data.publish.status,'Draft');
 const preview=await request('/preview','GET',null,account.cookie);assert.equal(preview.status,200);assert.ok(preview.text.includes('Setup owner'));assert.ok(!preview.text.includes('mikha-streetwear.png'));assert.ok(!preview.text.includes('haza-page-011.jpg'));assert.equal((await request('/onboarding.js')).status,200);
});
test.after(async()=>{await new Promise(r=>server.close(r));db.close()});
