import fs from 'node:fs';
import {templates} from './web/templates.js';
import {freshWorkspace} from './portfolio.mjs';
import {id,fail} from './security.mjs';
export {templates};
const collection=JSON.parse(fs.readFileSync(new URL('./example-work.public.json',import.meta.url),'utf8'));
export function templateDefinition(key){const t=templates.find(t=>t.id===key);if(!t)fail(404,'Template not found.');return t}
function exampleProjects(stable=false,all=false){return structuredClone(all?collection.projects:collection.projects.filter(p=>['haza','hills','cozy'].includes(p.templateSample))).map(p=>({...p,id:stable?p.id:id(),blocks:p.blocks.map(b=>({...b,id:stable?b.id:id()}))}))}
export function templateWorkspace(key){
 const t=templateDefinition(key),w=freshWorkspace('Mikha Gerges');
 w.profile={...w.profile,title:'Creative director & visual storyteller',bio:'I turn ideas into visual worlds with character. For five years, I’ve shaped brands, campaigns and moving stories across the Middle East — mixing sharp strategy, hands-on craft and a restless curiosity for what comes next.',email:'hello@mikha.com',phone:'+20 1557204528',location:'Egypt · working across the Middle East',skills:['Creative direction','Brand identity','Campaign design','Motion & storytelling'],tools:['Photoshop','Illustrator','After Effects','Premiere Pro','AI'],photo:'/examples/mikha-streetwear.png',photoAlt:'Mikha Gerges — creative director in streetwear',socials:[{label:'Behance',url:'https://www.behance.net/mikhagerges'}],availability:true};
 w.profile.bio='I build brands with character and campaigns with energy. Five years of creative direction, design and moving stories across the Middle East.';
 w.projects=exampleProjects(true,true).map((p,i)=>({...p,featured:i<6}));applyLayout(w,t);w.headline=t.headline;w.heroImage=['monument','solstice','noir','velocity','ember','ledger','atelier','aura','mosaic','afterhours'].includes(t.id)?w.profile.photo:w.projects[0]?.cover;
 Object.assign(w.personalBrand,{countries:['Kuwait','Egypt','United Arab Emirates','Qatar','Jordan','Saudi Arabia'],clients:235,projects:w.projects.length,years:5,demo:false,reachTitle:'Made here.\nConnected everywhere.',clientRibbon:{items:['HAZA','Hills Coffee','Cozy Cafe','1718 Coffee'].map(name=>({name})),speed:'Slow',direction:'Left'}});
 w.personalBrand.projectLabel='Work collections';w.sections.find(s=>s.type==='Selected Work').content={title:'Selected work',description:'Brand worlds, campaigns and moving stories.',items:[]};
 w.sections.find(s=>s.type==='About').variant='Credentials';w.sections.find(s=>s.type==='About').content={title:'Strategy in my head.\nStories in my hands.',description:'',items:[]};w.sections.splice(2,0,{id:'clients',type:'Clients',visible:true},{id:'reach',type:'Global reach',visible:true});
 w.sections.find(s=>s.type==='Contact').content={title:'Let’s make\nsomething matter.',description:'A brand with character. A campaign with energy. A story worth telling. Let’s talk.',items:[]};
 w.publish.seoTitle='Mikha Gerges — '+t.name;w.publish.description=w.profile.bio;w.publish.language='en';return w;
}
function applyLayout(w,t){w.style=t.family;w.heroVariant=t.hero;w.workVariant=t.work;if(!w.colorPalette){w.accent=t.accent;w.palette=t.dark||t.id==='afterhours'?'ink':'ivory'}w.spacing=t.spacing;w.typography='Acumin only';w.treatment=t.treatment||(t.id==='studio'?'Rounded':'Sharp');w.personalBrand={...w.personalBrand,enabled:false};w.cinematic={...w.cinematic,enabled:false};for(const s of w.sections){delete s.variant;if(s.type==='Hero')s.variant=t.hero;if(s.type==='Selected Work'){s.variant=t.work;s.options={...s.options,columns:t.id==='exhibit'?3:2}}}w.sections.sort((a,b)=>(a.type==='Hero'?-1:a.type==='Footer'?1:0)-(b.type==='Hero'?-1:b.type==='Footer'?1:0));w.templateId=t.id;w.onboarding={...w.onboarding,templateChosen:true}}
export function applyTemplate(existing,key,{samples=false,maxProjects=5}={}){
 const t=templateDefinition(key),w=structuredClone(existing);applyLayout(w,t);
 if(samples){const example=templateWorkspace(key),add=exampleProjects().filter(p=>!w.projects.some(q=>q.templateSample===p.templateSample));if(w.projects.length+add.length>maxProjects)fail(402,'Not enough project space for the example collection. Apply the layout without examples instead.');const empty=w.projects.length===0;w.projects.push(...add);if(empty&&!w.profile.photo)w.profile.photo=example.profile.photo;for(const k of ['title','bio','location'])if(!w.profile[k])w.profile[k]=example.profile[k];if(!w.profile.skills?.length)w.profile.skills=example.profile.skills;if(!w.profile.tools?.length)w.profile.tools=example.profile.tools;if(empty){w.headline=t.headline;w.heroImage=example.heroImage;w.sections=example.sections;w.pageMode=example.pageMode}for(const p of add)if(!w.assets.some(a=>a.url===p.cover))w.assets.push({name:p.title+' · Mikha example',url:p.cover});}
 return w;
}
