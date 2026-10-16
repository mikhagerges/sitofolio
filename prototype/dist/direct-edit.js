/* Contextual editing stays beside the draft. Published snapshots stay read-only. */
let directSelection=null,directMode=true,directLastField='',directLastTime=0;
const directEnabled=()=>view==='editor'||(view==='preview'&&!publishedPreview&&directMode);
const directField=(label,id,value,type='text')=>field(label,id,value,type).replaceAll('data-field=','data-direct-field=');
const directSelect=(label,id,value,options)=>selectField(label,id,String(value),options).replaceAll('data-field=','data-direct-field=');
const directLines=value=>esc(value).replaceAll('\n','<br>');
const reachBeforeDirect=storyReach,workBeforeDirect=storyWork,contactBeforeDirect=storyContact;
storyReach=function(s,edit){let html=reachBeforeDirect(s,edit);if(state.personalBrand.reachTitle!==undefined)html=html.replace('Good work<br><i>travels.</i>',directLines(state.personalBrand.reachTitle));return html};
storyWork=function(s,edit){let html=workBeforeDirect(s,edit);if(state.personalBrand.workTitle!==undefined)html=html.replace('A few things<br>I’ve put my <i>heart into.</i>',directLines(state.personalBrand.workTitle));return html};
storyContact=function(s,edit){let html=contactBeforeDirect(s,edit);if(state.personalBrand.contactTitle!==undefined)html=html.replace('Have a feeling<br>we’d <i>click?</i>',directLines(state.personalBrand.contactTitle));if(state.personalBrand.contactIntro!==undefined)html=html.replace('Good things start with a conversation.',esc(state.personalBrand.contactIntro));return html};
function directMedia(target,url,alt=''){
  const assets=[{name:'Mikha — streetwear',url:'assets/mikha-streetwear.png'},{name:'Cinematic background',url:'assets/cinematic-background.png'},...state.assets.filter(a=>a.url),...state.projects.map(p=>({name:p.title,url:p.cover}))];
  return `<div class="direct-image-preview"><img src="${esc(url)}" alt="${esc(alt)}"></div><label class="upload-zone">${icon('upload')}<span>Replace image</span><input type="file" accept="image/png,image/jpeg,image/webp" data-direct-upload="${esc(target)}"><small>PNG, JPG or WebP · up to 3 MB</small></label><details class="direct-library"><summary>Choose from your library</summary><div class="direct-assets">${assets.map(a=>`<button data-direct-media="${esc(target)}" data-media-url="${esc(a.url)}" data-media-name="${esc(a.name)}" aria-label="Use ${esc(a.name)}"><img src="${esc(a.url)}" alt=""><span>${esc(a.name)}</span></button>`).join('')}</div></details>`;
}
function directPanel(){
  if(!directSelection)return '';
  const p=state.profile,b=state.personalBrand,c=state.cinematic||{},key=directSelection.key;
  let title='Edit content',body='';
  if(key==='name'){title='Name';body=directField('Name','profile.name',p.name)}
  else if(key==='clientlogos'){title='Clients & logos';body=clientRibbonFields()}
  else if(key==='portrait'){title='Portrait';body=directMedia('portrait',c.enabled?c.subject:p.photo||b.portrait,p.photoAlt)+directField('Image description','profile.photoAlt',p.photoAlt||'')}
  else if(key==='background'){title='Background & depth';body=directMedia('background',c.background,'Cinematic background')+directSelect('Depth','cinema.depth',c.depth,['0','0.5','1','1.5'])+directSelect('Motion','brand.motion',b.motion,['Full','Subtle','Off'])}
  else if(key==='opening'){title='Opening line';body=directField('Opening line',c.enabled?'cinema.kicker':'brand.eyebrow',c.enabled?c.kicker:b.eyebrow,'textarea')}
  else if(key==='intro'){title='Introduction';body=directField('Short introduction',c.enabled?'cinema.line':'profile.bio',c.enabled?c.line:p.bio,'textarea')}
  else if(key==='about'){title='About';body=directField('About statement','brand.statement',b.statement,'textarea')+directField('Biography','profile.bio',p.bio,'textarea')+directField('Personal note','brand.note',b.note,'textarea')}
  else if(key==='bio'){title='Biography';body=directField('Biography','profile.bio',p.bio,'textarea')}
  else if(key==='note'){title='Personal note';body=directField('Personal note','brand.note',b.note,'textarea')}
  else if(key==='skills'){title='Specialties';body=directField('Skills · one per line','direct.skills',p.skills.join('\n'),'textarea')}
  else if(key==='location'){title='Location';body=directField('Location','profile.location',p.location)}
  else if(key==='headline'){title='Headline';body=directField('Headline','headline',state.headline,'textarea')}
  else if(['countries','clients','projects','years','reach'].includes(key)){
    title=key==='countries'?'Countries':'Achievements';
    const values={clients:['Clients worked with',b.clients],projects:['Projects completed',b.projects],years:['Years of experience',b.years]};
    if(key==='reach'){const s=state.sections.find(s=>s.type==='Global reach');body=directField('Heading','brand.reachTitle',b.reachTitle??'Good work\ntravels.','textarea')+(s?directField('Introduction','sectionprop.'+s.id+'.description',s.content.description||'Different places. Shared ambition.','textarea'):'')}
    else if(values[key])body=directField(values[key][0],'brand.'+key,values[key][1],'number');
    else body=directField('Countries · one per line','brand.countries',b.countries.join('\n'),'textarea')+Object.entries(values).map(([k,[label,value]])=>directField(label,'brand.'+k,value,'number')).join('');
    body+=`<label class="check-row"><input type="checkbox" data-direct-demo ${b.demo?'checked':''}>Illustrative demo figures</label>`;
  }
  else if(key==='contact'){title='Contact';body=directField('Heading','brand.contactTitle',b.contactTitle??'Have a feeling\nwe’d click?','textarea')+directField('Introduction','brand.contactIntro',b.contactIntro??'Good things start with a conversation.','textarea')+directField('Email','profile.email',p.email,'email')+p.socials.map((s,i)=>directField('Link label','social.'+i+'.label',s.label)+directField('Link URL','social.'+i+'.url',s.url,'url')).join('')}
  else if(key==='work'){title='Project grid';body=directField('Heading','brand.workTitle',b.workTitle??'A few things\nI’ve put my heart into.','textarea')+'<p class="help-tip">A compact overview. Open a project to read its complete story.</p>'+directSelect('Projects per row','brand.workColumns',b.workColumns||'2',['2','3'])+state.projects.filter(p=>p.status!=='Archived').map(p=>`<button class="direct-project-row" data-direct-project="${esc(p.id)}"><img src="${esc(p.cover)}" alt=""><span>${esc(p.title)}</span><span>↗</span></button>`).join('')}
  else if(key==='project'){
    const project=state.projects.find(p=>p.id===directSelection.id);if(!project)return '';
    title='Project';body=directField('Project title','directproject.'+project.id+'.title',project.title)+directMedia('cover:'+project.id,project.cover,project.title)+directField('Discipline','directproject.'+project.id+'.type',project.type)+directField('Year','directproject.'+project.id+'.year',project.year)+`<button class="btn primary full" data-direct-open="${esc(project.id)}">Open complete project ↗</button>`;
  }
  else if(key==='block'){
    const project=state.projects.find(p=>p.id===directSelection.id),block=project?.blocks.find(b=>b.id===directSelection.block);if(!block)return '';
    title=block.type;body=directField('Text','directblock.'+project.id+'.'+block.id+'.text',block.text||'','textarea');
    if(/Image|Gallery|Before|Mockup/.test(block.type))body+=directMedia('block:'+project.id+':'+block.id,block.image||project.cover,block.alt||project.title);
  }
  else if(key==='section'){
    const s=sectionFor(directSelection.id);if(!s)return '';title=s.type;
    body=directField('Title','sectionprop.'+s.id+'.title',s.content.title||'','textarea')+directField('Description','sectionprop.'+s.id+'.description',s.content.description||'','textarea');
  }
  return `<aside class="right-panel direct-panel" aria-label="Selected element properties"><div class="prop-head"><div><span class="eyebrow">EDITING IN PLACE</span><h3>${esc(title)}</h3></div><button class="iconbtn" data-direct-close aria-label="Close properties">${icon('close')}</button></div><div class="direct-panel-body">${body}<p class="direct-saved">${icon('check')} Saved locally as you type</p><div class="row">${ib('undo','undo','Undo change',history.length?'':'disabled')}${ib('redo','redo','Redo change',future.length?'':'disabled')}</div></div></aside>`;
}
function directAnnotate(){
  const root=document.querySelector(view==='editor'?'.canvas-wrap .portfolio':'.preview-canvas .portfolio');if(!root||!directEnabled())return;
  root.classList.add('direct-canvas');
  const mark=(selector,key,extra={})=>root.querySelectorAll(selector).forEach(el=>{el.dataset.directKey=key;Object.entries(extra).forEach(([k,v])=>el.dataset[k]=v);el.title='Edit '+key;el.setAttribute('tabindex','0');if(el.hasAttribute('contenteditable'))el.removeAttribute('contenteditable')});
  mark('.cinema-copy h1,.story-title h1,.story-monogram,.pf-name,.story-footer>span:first-child,.pf-footer>span:first-child','name');
  mark('.cinema-subject,.portrait-scene,.about-portrait,.hero-media','portrait');mark('.cinema-hero','background');
  mark('.cinema-overline,.hello-line','opening');mark('.cinema-copy>p,.hero-signature p','intro');
  mark('.pf-hero h1','headline');
  mark('.client-ribbon','clientlogos');
  mark('.reveal-statement','about');mark('.story-bio>p:first-child','bio');mark('.story-bio>p:nth-child(2)','note');mark('.story-specialties','skills');
  mark('.country-list,.reach-stat,.story-globe','countries');mark('.reach-copy h2,.reach-copy>p','reach');mark('.globe-orbit-label>span:first-child,.hero-location','location');
  ['clients','projects','years'].forEach((key,i)=>mark('.story-numbers>div:nth-child('+(i+1)+')',key));
  mark('.story-contact>h2,.story-contact>p,.contact-orbit,.contact-bottom>a,.contact-bottom>div','contact');mark('.story-work>h2,.story-work>.chapter-head','work');
  root.querySelectorAll('.story-project,.project-card').forEach(el=>{el.dataset.directKey='project';el.dataset.directId=el.dataset.action?.split(':').slice(1).join(':');el.title='Edit project';});
  root.querySelectorAll('.pf-section').forEach(el=>{const s=state.sections.find(s=>el.classList.contains('pf-'+sectionKey(s)));if(!s)return;el.dataset.directKey='section';el.dataset.directId=s.id;});
  root.querySelectorAll('[data-section-edit]').forEach(el=>{el.removeAttribute('contenteditable');el.dataset.directKey='section';el.dataset.directId=el.dataset.sectionEdit.split(':')[0]});
  if(activePreviewProject){const project=state.projects.find(p=>p.id===activePreviewProject);if(project){mark('.case-heading,.project-cover','project',{directId:project.id});root.querySelectorAll('.case-block').forEach((el,i)=>{const block=project.blocks.filter(b=>b.visible)[i];if(block){el.dataset.directKey='block';el.dataset.directId=project.id;el.dataset.directBlock=block.id;el.tabIndex=0}})}}
  root.querySelectorAll('[data-direct-key]').forEach(el=>el.classList.toggle('direct-selected',!!directSelection&&el.dataset.directKey===directSelection.key&&(el.dataset.directId||'')===(directSelection.id||'')&&(el.dataset.directBlock||'')===(directSelection.block||'')));
}
function mountDirectPanel(focus=false){
  document.querySelector('.direct-panel')?.remove();
  const enabled=directEnabled()&&directSelection;
  document.querySelector('.preview-shell')?.classList.toggle('has-direct-panel',!!enabled&&view==='preview');
  if(enabled){
    if(view==='editor'){const panel=document.querySelector('.editor-shell>.right-panel');if(panel)panel.outerHTML=directPanel();else document.querySelector('.editor-shell')?.insertAdjacentHTML('beforeend',directPanel());if(innerWidth<=850){studioPanel='properties';document.body.dataset.studioPanel='properties';}}
    else document.querySelector('.preview-shell')?.insertAdjacentHTML('beforeend',directPanel());
    if(focus){const field=document.querySelector('.direct-panel input:not([type=file]),.direct-panel textarea,.direct-panel select');field?.focus({preventScroll:true});if(innerWidth<=850&&view==='preview')document.querySelector('.direct-panel')?.scrollIntoView({block:'start',behavior:'instant'});}
  }
  directAnnotate();
}
function chooseDirect(key,id='',block=''){
  directSelection={key,id,block};directLastField='';mountDirectPanel(true);
}
const renderBeforeDirect=render;
render=function(){renderBeforeDirect();if(view==='preview'&&!publishedPreview){document.querySelector('.topbar .grow')?.insertAdjacentHTML('beforebegin',`<div class="direct-mode" aria-label="Preview behavior"><button data-direct-mode="edit" aria-pressed="${directMode}">Click to edit</button><button data-direct-mode="interact" aria-pressed="${!directMode}">Interact</button></div>`)}mountDirectPanel();};
function refreshDirectCanvas(){
  const canvas=document.querySelector(view==='editor'?'.canvas-wrap .portfolio':'.preview-canvas .portfolio');
  if(canvas)canvas.outerHTML=activePreviewProject&&view==='preview'?casePreview():portfolio(view==='editor');
  directAnnotate();initStoryMotion();initCinema();document.title=view==='preview'?state.profile.name+' | Portfolio':'Sitofolio — Portfolio studio';
  document.querySelectorAll('[data-action="undo"]').forEach(b=>b.disabled=!history.length);
}
function changeDirectField(id,value){
  const group=directLastField===id&&Date.now()-directLastTime<1200,before=history.length;
  if(id.startsWith('clientitem.')||id.startsWith('clientsettings.'))updateClientRibbon(id,value);
  else if(id==='direct.skills')mutate(()=>state.profile.skills=value.split('\n').map(s=>s.trim()).filter(Boolean),false);
  else if(id.startsWith('directproject.')){const [,pid,key]=id.split('.');mutate(()=>state.projects.find(p=>p.id===pid)[key]=value,false)}
  else if(id.startsWith('directblock.')){const [,pid,bid,key]=id.split('.');mutate(()=>state.projects.find(p=>p.id===pid).blocks.find(b=>b.id===bid)[key]=value,false)}
  else updateField(id,value,false);
  if(group&&history.length>before&&history.length>1)history.pop();directLastField=id;directLastTime=Date.now();refreshDirectCanvas();
}
function applyDirectMedia(target,url,name){
  mutate(()=>{if(target==='background')state.cinematic.background=url;
    else if(target==='portrait'){if(state.cinematic?.enabled)state.cinematic.subject=url;state.profile.photo=url;state.profile.photoAlt=name;state.personalBrand.portrait=url;state.personalBrand.portraitAlt=name}
    else {const [kind,pid,bid]=target.split(':'),p=state.projects.find(p=>p.id===pid);if(kind==='cover')p.cover=url;else p.blocks.find(b=>b.id===bid).image=url;}
  },false);refreshDirectCanvas();mountDirectPanel();
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-client-control],[data-pro-control]'))return;
  const mode=e.target.closest('[data-direct-mode]');if(mode){e.preventDefault();e.stopImmediatePropagation();directMode=mode.dataset.directMode==='edit';directSelection=null;render();return}
  if(e.target.closest('[data-direct-close]')){e.preventDefault();e.stopImmediatePropagation();directSelection=null;if(view==='editor'){studioPanel='canvas';render()}else{mountDirectPanel();document.querySelector('.preview-shell')?.classList.remove('has-direct-panel')}return}
  const media=e.target.closest('[data-direct-media]');if(media){e.preventDefault();e.stopImmediatePropagation();applyDirectMedia(media.dataset.directMedia,media.dataset.mediaUrl,media.dataset.mediaName);return}
  const project=e.target.closest('[data-direct-project]');if(project){chooseDirect('project',project.dataset.directProject);return}
  const open=e.target.closest('[data-direct-open]');if(open){directSelection=null;activePreviewProject=open.dataset.directOpen;go('preview');return}
  if(!directEnabled())return;
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(['cinema-settings','brand-settings','profile-details','choose-media:brand','choose-media:cinema-subject','choose-media:profile','choose-media:cinema-background'].includes(action)){
    e.preventDefault();e.stopImmediatePropagation();chooseDirect(action.includes('choose-media')?(action.endsWith('background')?'background':'portrait'):action==='brand-settings'?(e.target.closest('.story-reach')?'countries':'about'):action==='profile-details'?'contact':'background');return;
  }
  const target=e.target.closest('.direct-canvas [data-direct-key]');
  if(target&&!e.target.closest('.direct-panel')){
    // Keep navigation and explicit editing controls usable inside a selected section.
    if(action&&target.dataset.directKey==='background'&&e.target.closest('button'))return;
    e.preventDefault();e.stopImmediatePropagation();chooseDirect(target.dataset.directKey,target.dataset.directId||'',target.dataset.directBlock||'');
  }else if(action&&/^(select:|page:|global$|go:)/.test(action))directSelection=null;
},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.directKey&&directEnabled()){e.preventDefault();e.stopImmediatePropagation();chooseDirect(e.target.dataset.directKey,e.target.dataset.directId||'',e.target.dataset.directBlock||'')}} ,true);
document.addEventListener('input',e=>{if(e.target.dataset.directField&&e.target.tagName!=='SELECT')changeDirectField(e.target.dataset.directField,e.target.value);else if(e.target.dataset.field)directAnnotate()});
document.addEventListener('change',async e=>{
  if(e.target.dataset.directField&&e.target.tagName==='SELECT')changeDirectField(e.target.dataset.directField,e.target.value);
  if(e.target.hasAttribute('data-direct-demo')){mutate(()=>state.personalBrand.demo=e.target.checked,false);refreshDirectCanvas()}
  const target=e.target.dataset.directUpload;if(!target)return;const file=e.target.files[0];if(!file)return;
  try{if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>3*1024*1024)throw new Error('Choose a PNG, JPG or WebP smaller than 3 MB.');
    // Preserve alpha in portrait cutouts; the legacy JPEG upload helper flattens it.
    const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Image could not be read.'));reader.readAsDataURL(file)});
    await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error('This image could not be read.'));img.src=url});
    applyDirectMedia(target,url,file.name);
  }catch(err){toast(err.message)}
});
render();
