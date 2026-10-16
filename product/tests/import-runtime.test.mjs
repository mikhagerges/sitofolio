import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {normalizePortfolioAddress,portfolioAddressError} from '../web/publishing.js';

test('portfolio addresses normalize common names and explain invalid input',()=>{
 assert.equal(normalizePortfolioAddress(' Mikha.gerges '),'mikha-gerges');
 assert.equal(normalizePortfolioAddress('MY__Creative  Studio'),'my-creative-studio');
 assert.equal(portfolioAddressError('Mikha.gerges'),'');
 for(const value of ['ab','a'.repeat(31),'-mikha','mikha!','ميخا'])assert.ok(portfolioAddressError(value));
 assert.match(portfolioAddressError('admin'),/reserved/);
 assert.match(portfolioAddressError('https://example.com'),/without a full URL/);
});

test('local server supervises extraction, recovers a stopped worker and preserves explicit review',{timeout:60000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sitofolio-runtime-'));
 const origin='http://127.0.0.1:4192';
 const env={...process.env,DATA_DIR:dir,PORT:'4192',HOST:'127.0.0.1',APP_ORIGIN:origin,NODE_ENV:'development',IMPORT_WORKER_AUTOSTART:'true'};
 for(const key of ['OPENAI_API_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','MAIL_API_KEY','STRIPE_SECRET_KEY'])delete env[key];
 execFileSync(env.PYTHON_PATH||'python',[path.resolve('tests/fixtures.py'),dir]);
 const child=spawn(process.execPath,[path.resolve('server.mjs')],{env,cwd:path.resolve('.'),windowsHide:true,stdio:'ignore'});
 let db,cookie='';
 async function request(route,method='GET',data){const r=await fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],data:await r.json()};}
 async function until(fn){const end=Date.now()+20000;while(Date.now()<end){try{const value=await fn();if(value)return value}catch{}await new Promise(r=>setTimeout(r,200));}throw Error('Timed out waiting for local processing');}
 try{
  await until(async()=>{const r=await fetch(origin+'/health');return r.ok});
  assert.equal((await request('/api/imports/health')).status,401);
  const account=await request('/api/register','POST',{name:'Runtime Test',email:'runtime@example.test',password:'Local runtime test only 2026'});assert.equal(account.status,201);cookie=account.cookie;
  await until(async()=>(await request('/api/imports/health')).data.ready);
  db=new DatabaseSync(path.join(dir,'sitofolio.sqlite'),{readOnly:true});
  const initialPID=Number(db.prepare('SELECT count FROM limits WHERE key=?').get('import-worker').count);
  process.kill(initialPID);
  const replacement=await until(async()=>{const r=await request('/api/imports/health');const pid=Number(db.prepare('SELECT count FROM limits WHERE key=?').get('import-worker')?.count);return r.data.ready&&pid!==initialPID&&pid});
  assert.notEqual(replacement,initialPID);
  const job=(await request('/api/imports','POST',{})).data;
  const upload=await fetch(origin+'/api/imports/'+job.id+'/files?name=portfolio.pdf',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:fs.readFileSync(path.join(dir,'portfolio.pdf'))});assert.equal(upload.status,201);
  assert.equal((await request('/api/imports/'+job.id+'/start','POST',{ai:false})).status,202);
  const done=await until(async()=>{const r=await request('/api/imports/'+job.id);if(r.data.status==='failed')throw Error(r.data.error);return r.data.status==='review'&&r.data});
  assert.equal(done.progress,100);assert.equal(done.result.assets.length,3);assert.deepEqual(done.result.assets.map(a=>a.page),[1,2,3]);
  let workspace=(await request('/api/workspace')).data;
  assert.equal(workspace.data.projects.length,0);
  assert.equal((await request('/api/publish','POST',{slug:'admin',revision:workspace.revision})).status,400);
  workspace.data.publish.slug=normalizePortfolioAddress('Mikha.gerges');workspace.data.profile.title='Graphic designer';
  workspace=(await request('/api/workspace','PUT',workspace)).data;
  const published=await request('/api/publish','POST',{slug:'Mikha.gerges',revision:workspace.revision});
  assert.equal(published.status,200,JSON.stringify(published.data));assert.ok(published.data.url.endsWith('/s/mikha-gerges'));
  const saved=(await request('/api/workspace')).data;assert.equal(saved.data.publish.slug,'mikha-gerges');assert.equal(saved.data.projects.length,0);
  assert.equal((await fetch(origin+'/s/mikha-gerges')).status,200);
 }finally{
  // Only terminate the worker registered by this isolated test database.
  if(db){const lease=db.prepare('SELECT count FROM limits WHERE key=?').get('import-worker');if(lease)try{process.kill(Number(lease.count))}catch{}db.close()}
  child.kill();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve)});
 }
});
