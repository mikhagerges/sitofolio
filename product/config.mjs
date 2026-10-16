import path from 'node:path';
import fs from 'node:fs';
export const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
export const config = {
  port: Number(process.env.PORT || 4180), host: process.env.HOST || '127.0.0.1',
  origin: process.env.APP_ORIGIN || 'http://127.0.0.1:4180',
  data: path.resolve(process.env.DATA_DIR || path.join(root,'data')),
  python: process.env.PYTHON_PATH || 'python', production: process.env.NODE_ENV === 'production',
  ai: Boolean(process.env.OPENAI_API_KEY), google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  mail: Boolean(process.env.MAIL_API_KEY && process.env.MAIL_FROM),
  billing: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SOLO_PRICE_ID && process.env.STRIPE_PRO_PRICE_ID),
  maxUpload: 50*1024*1024, maxJobBytes: 150*1024*1024, maxFiles: 120, maxPages: 120, maxAssets: 240,
  aiJobCalls: Number(process.env.AI_JOB_CALL_LIMIT || 12), aiMonthlyCalls: Number(process.env.AI_MONTHLY_CALL_LIMIT || 200), aiDailyCalls: Number(process.env.AI_GLOBAL_DAILY_CALLS || 100)
};
for(const [key,max] of [['port',65535],['aiJobCalls',50],['aiMonthlyCalls',10000],['aiDailyCalls',100000]])if(!Number.isSafeInteger(config[key])||config[key]<1||config[key]>max)throw Error(`Invalid ${key} environment setting. Use an integer from 1 to ${max}.`);
if(config.production && (!config.origin.startsWith('https://') || !/^[a-f0-9]{64}$/i.test(process.env.TOKEN_ENCRYPTION_KEY||'') || process.env.PARSER_SANDBOXED !== 'true')) throw Error('Production requires HTTPS, a 32-byte encryption key and an isolated parser. See SETUP.md.');
fs.mkdirSync(config.data,{recursive:true});
export const plans={free:{projects:5,storage:500*1024*1024,aiCalls:10,monthly:0,annual:0},solo:{projects:100,storage:5*1024**3,aiCalls:40,monthly:249,annual:2490},pro:{projects:500,storage:20*1024**3,aiCalls:100,monthly:449,annual:4490}};

export function aiAllowance(plan='free'){return Math.min(config.aiMonthlyCalls,(plans[plan]||plans.free).aiCalls)}
export function billingPrice(plan,cycle='monthly'){return process.env['STRIPE_'+plan.toUpperCase()+(cycle==='annual'?'_ANNUAL':'')+'_PRICE_ID']}
export const acuminUrl=/^https:\/\/use\.typekit\.net\/[a-z0-9]+\.css$/i.test(process.env.ACUMIN_STYLESHEET_URL||'')?process.env.ACUMIN_STYLESHEET_URL:'';
