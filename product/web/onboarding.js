// Shared setup rules: the UI and its tests use the same small, deterministic model.
export const setupRoles=['Graphic Designer','Brand Designer','UI/UX Designer','Motion Designer','Video Editor','Photographer','Other'];
export const setupGoals=['Get hired','Get freelance clients','Build my personal brand','Showcase my work','Apply to agencies / studios'];
export const setupPersonalities=[
 {value:'Minimal',label:'Minimal',template:'aire',description:'Space to breathe.'},
 {value:'Bold',label:'Bold',template:'signal',description:'Confident and expressive.'},
 {value:'Editorial',label:'Editorial',template:'folio',description:'A considered visual story.'},
 {value:'Cinematic',label:'Cinematic',template:'afterhours',description:'Atmosphere and depth.'},
 {value:'Clean Professional',label:'Clean',template:'studio',description:'Clear and structured.'},
 {value:'Experimental',label:'Experimental',template:'cutpaper',description:'Playful and unexpected.'}
];
const selectedPersonalities=w=>Array.isArray(w.onboarding?.personality)?w.onboarding.personality:[];
export function setupError(w,step){
 const o=w.onboarding||{};
 if(step===1){if(!setupRoles.includes(o.role))return 'Choose what you do.';if(!setupGoals.includes(o.goal))return 'Choose your main goal.';}
 if(step===2){const p=selectedPersonalities(w);if(!Array.isArray(p)||p.length<1||p.length>2||new Set(p).size!==p.length||p.some(x=>!setupPersonalities.some(v=>v.value===x)))return 'Choose one or two visual personalities.';}
 if(step===3){if(!w.profile?.name?.trim())return 'Add your name.';if(w.profile.name.trim().length>100)return 'Keep your name under 100 characters.';if(!w.profile?.title?.trim())return 'Add your professional title.';if(w.profile.title.trim().length>160)return 'Keep your title under 160 characters.';}
 return '';
}
export function setupStep(w,requested){const raw=Number(requested)||Number(w.onboarding?.setupStep)||1,n=Math.max(1,Math.min(5,Number.isFinite(raw)?Math.trunc(raw):1));for(let step=1;step<Math.min(n,4);step++)if(setupError(w,step))return step;return n;}
export function updateSetup(w,step,fields={},advance=true){
 const next=structuredClone(w),o=next.onboarding||={};
 if(step===1){o.role=fields.role||'';o.goal=fields.goal||'';}
 if(step===2)o.personality=Array.isArray(fields.personality)?[...fields.personality]:[];
 if(step===3){for(const k of ['name','title','bio','location'])if(typeof fields[k]==='string')next.profile[k]=fields[k].trim();if(!next.headline||next.headline==='Your work. Your point of view.')next.headline=next.profile.name+'\n'+next.profile.title;}
 if(advance){const message=setupError(next,step);if(message)throw Error(message);}
 Object.assign(o,{needsSetup:true,complete:false,setupVersion:1,setupStep:advance?Math.min(5,step+1):step});
 return next;
}
export function completeSetup(w){for(let step=1;step<=3;step++){const message=setupError(w,step);if(message)throw Error(message);}if(!w.onboarding?.templateChosen)throw Error('Choose a template before opening your portfolio.');const next=structuredClone(w);Object.assign(next.onboarding,{needsSetup:false,complete:true,setupStep:5,setupVersion:1});return next;}
export function recommendedTemplateIds(w,catalog){
 const o=w.onboarding||{},scores=new Map(catalog.map((t,i)=>[t.id,{score:0,index:i}]));
 const add=(predicate,points)=>{for(const t of catalog)if(predicate(t))scores.get(t.id).score+=points;};
 const families={Minimal:'Minimal',Bold:'Bold',Editorial:'Editorial',Cinematic:'Cinematic','Clean Professional':'Clean Professional',Clean:'Clean Professional',Gallery:'Gallery',Collage:'Bold',Sketch:'Editorial'};
 for(const p of selectedPersonalities(w)){if(p==='Experimental')add(t=>['cutpaper','pencil','gridline'].includes(t.id),12);else add(t=>t.family===families[p],9);}
 if(/Motion|Video/.test(o.role))add(t=>t.family==='Cinematic',8);
 if(o.role==='Photographer')add(t=>t.family==='Gallery'||t.category==='Photography',8);
 if(o.role==='UI/UX Designer')add(t=>t.family==='Clean Professional'||t.category==='Digital',7);
 if(o.role==='Brand Designer')add(t=>['Branding','Collage','Studio'].includes(t.category),6);
 if(/hired|agencies/.test(o.goal))add(t=>t.family==='Clean Professional',3);
 if(o.goal==='Build my personal brand')add(t=>t.category==='Personal brand',4);
 for(const type of new Set((w.projects||[]).map(p=>p.type)))if(['Motion','Video','Photography','UI/UX','Branding'].includes(type))add(t=>type==='Photography'?t.family==='Gallery':type==='UI/UX'?t.family==='Clean Professional':type==='Branding'?t.category==='Branding':t.family==='Cinematic',2);
 const ranked=[...catalog].sort((a,b)=>scores.get(b.id).score-scores.get(a.id).score||scores.get(a.id).index-scores.get(b.id).index),picked=[];
 for(const t of ranked)if(!picked.some(p=>p.family===t.family)){picked.push(t);if(picked.length===3)break;}
 for(const t of ranked)if(picked.length<3&&!picked.includes(t))picked.push(t);
 return picked.map(t=>t.id);
}

const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const setupLabels=['Your work','Your style','Your profile','Add work','Your template'];
export function setupMarkup(w,step,catalog,visual){
 const e=escape,o=w.onboarding||{},p=w.profile,progress=setupLabels.map((label,i)=>'<li '+(i+1===step?'aria-current="step"':'')+'><span>'+(i+1<step?'✓':i+1)+'</span>'+label+'</li>').join('');
 const titles=['What do you create?','What feels like you?','Put your name on it.','Bring your first project.','Your starting point.'];
 const descriptions=['A couple of choices to find your starting point.','Pick one or two. You can change direction later.','Only your name and professional title are needed.','Optional. Add work now, or start with your profile.','Three looks picked for you. Preview before you choose.'];
 const field=(label,name,value,max,required=false)=>'<label>'+label+'<input name="'+name+'" value="'+e(value)+'" maxlength="'+max+'" '+(required?'required':'')+' '+(name==='name'?'autocomplete="name"':'')+'></label>';
 let content='';
 if(step===1)content='<fieldset class="setup-role-options"><legend>What do you do?</legend><div>'+setupRoles.map(role=>'<label><input type="radio" name="role" value="'+e(role)+'" '+(o.role===role?'checked':'')+' required><span>'+e(role)+'</span></label>').join('')+'</div></fieldset><label class="setup-goal">Your main goal<select name="goal" required><option value="">Choose a goal</option>'+setupGoals.map(goal=>'<option '+(o.goal===goal?'selected':'')+'>'+e(goal)+'</option>').join('')+'</select></label>';
 if(step===2)content='<div class="setup-personalities">'+setupPersonalities.map(option=>'<label class="personality-card">'+visual(catalog.find(t=>t.id===option.template))+'<span class="personality-caption"><span><strong>'+e(option.label)+'</strong><small>'+e(option.description)+'</small></span><input name="personality" type="checkbox" aria-label="'+e(option.label)+'" value="'+e(option.value)+'" '+(selectedPersonalities(w).includes(option.value)?'checked':'')+'></span></label>').join('')+'</div><p class="setup-selection-count" role="status" data-setup-count>'+selectedPersonalities(w).length+' of 2 selected · choose at least 1</p>';
 if(step===3)content='<div class="setup-profile-layout"><div class="setup-profile-fields">'+field('Your name','name',p.name,100,true)+field('Professional title','title',p.title,160,true)+'<details class="setup-optional"><summary>Add a little more · optional</summary>'+field('Location','location',p.location,200)+'<label>A short introduction<textarea name="bio" maxlength="3000">'+e(p.bio)+'</textarea></label></details><p class="small">You can add a photo, links and contact details in the editor.</p></div><aside class="setup-profile-preview" aria-label="Your profile preview"><span>YOUR PORTFOLIO</span><strong data-setup-name>'+e(p.name||'Your name')+'</strong><p data-setup-title>'+e(p.title||'Your professional title')+'</p><div aria-hidden="true"><i></i><i></i><i></i></div></aside></div>';
 if(step===4)content='<div class="setup-add-work"><span class="setup-file-mark" aria-hidden="true">↥</span><h2>'+(w.projects.length?'Your work is here.':'Your work, already made.')+'</h2><p>'+(w.projects.length?w.projects.length+' project'+(w.projects.length===1?'':'s')+' in your library. You can add more whenever you like.':'Bring a PDF, a folder, or images. Review the projects before adding them to your portfolio.')+'</p><a class="button" href="#imports">Import my work ↗</a></div>';
 if(step===5)content='<div class="setup-recommendations">'+recommendedTemplateIds(w,catalog).map(id=>{const t=catalog.find(t=>t.id===id);return '<article class="template-card"><a class="template-cover" href="#template/'+t.id+'" aria-label="Preview '+e(t.name)+'">'+visual(t)+'</a><div class="template-caption"><div><span class="eyebrow">'+e(t.family)+'</span><h2>'+e(t.name)+'</h2></div><a class="setup-preview-link" href="#template/'+t.id+'">Preview ↗</a></div><p>'+e(t.description)+'</p><button type="button" class="primary" data-action="setup-template:'+t.id+'">Use '+e(t.name)+' →</button></article>'}).join('')+'</div><p class="setup-examples-note">Previews show Mikha Gerges’s example work. Your portfolio keeps your own name and projects.</p><a class="button" href="#styles" data-action="setup-all-templates">View all 20 templates ↗</a>';
 return '<main class="setup-shell" data-setup-screen="'+step+'"><nav aria-label="Portfolio setup"><ol class="setup-progress">'+progress+'</ol></nav><header class="setup-heading"><span class="eyebrow">STEP '+step+' OF 5</span><h1>'+titles[step-1]+'</h1><p>'+descriptions[step-1]+'</p></header><form id="setup-form" data-step="'+step+'">'+content+'<p id="setup-error" class="setup-error" role="alert" tabindex="-1"></p><div class="setup-footer">'+(step>1?'<button type="button" data-action="setup-back:'+(step-1)+'">← Back</button>':'<a href="#overview" data-action="setup-later">Finish later</a>')+'<span class="small" data-setup-save>Progress saves when you continue.</span>'+(step<5?'<button class="primary" type="submit">'+(step===4?(w.projects.length?'Choose my look →':'Skip for now →'):'Continue →')+'</button>':'')+'</div></form></main>';
}
