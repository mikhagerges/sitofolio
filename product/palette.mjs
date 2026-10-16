import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {config,root} from './config.mjs';
import {id,fail} from './security.mjs';
const execute=promisify(execFile);let processing=0;
export async function extractPalette(data){
  const pdf=data.subarray(0,5).toString()==='%PDF-',image=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||data[0]===255&&data[1]===216||data.subarray(0,3).toString()==='GIF'||data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP';
  if(!pdf&&!image)fail(415,'Upload a PNG, JPG, WebP, GIF or PDF color reference.');
  if(data.length>(pdf?20:8)*1024*1024)fail(413,pdf?'PDF limit: 20 MB.':'Image limit: 8 MB.');
  if(processing>=2)fail(503,'Color extraction is busy. Please try again shortly.');
  processing++;const dir=path.join(config.data,'palette-temp'),file=path.join(dir,id()+(pdf?'.pdf':'.image'));
  try{await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,data,{flag:'wx'});let output;try{const args=[path.join(root,'palette.py'),file],runner=process.env.PARSER_RUNNER;output=await execute(runner||config.python,runner?[config.python,...args]:args,{timeout:25000,maxBuffer:20000,windowsHide:true,env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,TEMP:process.env.TEMP,TMP:process.env.TMP,PYTHONUTF8:'1'}})}catch{fail(422,'Could not extract colors. Try a smaller image or an unencrypted PDF.');}const result=JSON.parse(output.stdout);if(!Array.isArray(result.colors)||!result.colors.every(c=>/^#[a-f0-9]{6}$/i.test(c)))fail(422,'No usable colors found.');return result;}finally{await fs.unlink(file).catch(()=>{});processing--;}
}
