import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {config,root} from './config.mjs';
import {get} from './db.mjs';

export function importWorkerHealth(){
 const lease=get('SELECT count,until FROM limits WHERE key=?','import-worker');
 if(!lease)return {ready:false,state:'offline'};
 let alive=false;try{process.kill(Number(lease.count),0);alive=true}catch(error){alive=error.code!=='ESRCH'}
 if(!alive)return {ready:false,state:'offline'};
 if(lease.until<=Date.now())return {ready:false,state:'unresponsive'};
 return {ready:true,state:'ready'};
}

// Local development has one entry point. Production keeps its separately managed worker.
export function startLocalImportWorker(){
 if(config.production||process.env.IMPORT_WORKER_AUTOSTART==='false')return {stop(){}};
 let child=null,stopped=false,retryAt=0,failures=0;
 function ensure(){
  if(stopped||child||Date.now()<retryAt)return;
  const health=importWorkerHealth();
  // Never launch over a live but unresponsive worker: that could replay paid work.
  if(health.ready||health.state==='unresponsive')return;
  const output=fs.openSync(path.join(config.data,'worker.log'),'a'),errors=fs.openSync(path.join(config.data,'worker-error.log'),'a');
  try{
   child=spawn(process.execPath,[path.join(root,'worker.mjs')],{cwd:root,windowsHide:true,env:{...process.env,DATA_DIR:config.data},stdio:['ignore',output,errors]});
   const started=Date.now(),owned=child;
   const release=()=>{if(child!==owned)return;child=null;failures=Date.now()-started>30000?0:failures+1;retryAt=Date.now()+Math.min(30000,1000*2**Math.min(failures,5));};
   child.once('error',release);child.once('exit',release);child.unref();
  }finally{fs.closeSync(output);fs.closeSync(errors)}
 }
 ensure();const timer=setInterval(ensure,2000);timer.unref();
 return {stop(){stopped=true;clearInterval(timer);child?.kill();}};
}
