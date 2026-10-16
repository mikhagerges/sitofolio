// Isolated local QA database and hostname; no provider credentials or owner sessions.
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
process.env.DATA_DIR=path.join(root,'data','onboarding-review');
process.env.APP_ORIGIN='http://localhost:4190';process.env.PORT='4190';process.env.HOST='127.0.0.1';process.env.NODE_ENV='development';
for(const key of ['OPENAI_API_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','MAIL_API_KEY','STRIPE_SECRET_KEY'])delete process.env[key];
const {server}=await import('../server.mjs');
const {startLocalImportWorker}=await import('../worker-runtime.mjs');
let worker={stop(){}};server.once('close',()=>worker.stop());
server.listen(4190,'127.0.0.1',()=>{worker=startLocalImportWorker();console.log('Isolated onboarding review: http://localhost:4190')});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{worker.stop();server.close(()=>process.exit(0))});
