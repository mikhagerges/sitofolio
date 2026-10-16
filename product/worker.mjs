import {driveTick} from './drive-import.mjs';
import {tick} from './imports.mjs';
import {run,get,transaction} from './db.mjs';
// Single worker process per SQLite deployment. Interrupted jobs require explicit retry.
const lease='import-worker';
transaction(()=>{const current=get('SELECT * FROM limits WHERE key=?',lease);let alive=false;if(current){try{process.kill(Number(current.count),0);alive=true}catch(error){alive=error.code!=='ESRCH'}}if(alive&&current.until>Date.now())throw Error('An import worker is already running.');run('INSERT OR REPLACE INTO limits VALUES(?,?,?)',lease,process.pid,Date.now()+120000)});
const heartbeat=setInterval(()=>run('UPDATE limits SET until=? WHERE key=? AND count=?',Date.now()+120000,lease,process.pid),30000);
run("UPDATE jobs SET status='failed',error='Worker restarted. Retry to resume extracted files without publishing.',stage='Interrupted' WHERE status IN ('running','drive_running')");
let stopped=false;process.on('SIGTERM',()=>stopped=true);process.on('SIGINT',()=>stopped=true);
try{while(!stopped){try{if(!await driveTick()&&!await tick())await new Promise(r=>setTimeout(r,1500))}catch(error){console.error('Worker will retry:',error.message);await new Promise(r=>setTimeout(r,5000))}}}finally{clearInterval(heartbeat);run('DELETE FROM limits WHERE key=? AND count=?',lease,process.pid)}
