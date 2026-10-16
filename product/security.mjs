import crypto from 'node:crypto';
import {promisify} from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import {config} from './config.mjs';
const scrypt=promisify(crypto.scrypt);
export const id=()=>crypto.randomUUID();
export const token=()=>crypto.randomBytes(32).toString('hex');
export const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
export const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fail(status,message){throw Object.assign(Error(message),{status})}
export async function passwordHash(password){if(typeof password!=='string'||password.length<12||password.length>256)fail(400,'Use a password with 12–256 characters.');const salt=token();return salt+':'+(await scrypt(password,salt,64)).toString('hex')}
export async function passwordCheck(value,stored){if(typeof value!=='string'||value.length>256)return false;const [salt,hex]=(stored||('0'.repeat(64)+':'+'0'.repeat(128))).split(':');const actual=await scrypt(value,salt,64);return crypto.timingSafeEqual(actual,Buffer.from(hex,'hex'))}
export function cookie(req,name){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
export function safePath(name){if(typeof name!=='string'||name.length>240||name.includes('\\')||name.includes('\0')||name.startsWith('/')||name.includes(':')||name.split('/').some(x=>x==='..'||x==='.'||!x))fail(400,'Unsafe file path.');return name}
export function safeMedia(url){return typeof url==='string'&&(/^\/media\/[a-f0-9-]{36}(?:\?thumb=1)?$/.test(url)||(/^\/examples\/[a-z0-9-]+\.(?:jpg|png|gif|webp|mp4)$/.test(url))||(/^assets\/[\w /.-]+$/.test(url)&&!url.split('/').some(p=>p==='..'||p==='.'||!p)))?url:''}
export function csrf(req){if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==config.origin)fail(403,'This request must come from your SitoFolio workspace.')}
let localKey;
function key(){if(process.env.TOKEN_ENCRYPTION_KEY)return Buffer.from(process.env.TOKEN_ENCRYPTION_KEY,'hex');if(!localKey){const f=path.join(config.data,'.encryption-key');if(!fs.existsSync(f))fs.writeFileSync(f,crypto.randomBytes(32),{mode:0o600});localKey=fs.readFileSync(f)}return localKey}
export function seal(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);return Buffer.concat([iv,cipher.update(value),cipher.final(),cipher.getAuthTag()]).toString('base64')}
export function unseal(value){const b=Buffer.from(value,'base64'),dec=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));dec.setAuthTag(b.subarray(-16));return Buffer.concat([dec.update(b.subarray(12,-16)),dec.final()]).toString()}
