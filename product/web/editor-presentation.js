/* One renderer powers editing, preview, private review and public snapshots. */
let presentationTimer,presentationScroll=0,presentationLocation='',presentationBusy=false;
let previewReturnView='editor',previousPresentationView='editor',paletteModule;
const paletteReady=import('/palette-ui.js').then(module=>paletteModule=module);
function openPalette(){const right=document.querySelector('.editor-shell>.right-panel');if(!right)return;directSelection=null;right.outerHTML=productDirectPanel('Your colors','<div data-editor-palette></div>');paletteReady.then(()=>paletteModule.mountPalette(document.querySelector('[data-editor-palette]'),{getWorkspace:()=>state,save:async palette=>{const previous=structuredClone(state);mutate(()=>Object.assign(state,{colorPalette:palette,accent:palette.accent,palette:'ivory'}),false);await cloudSave();if(cloudConflict||cloudFailed){state=previous;throw Error('Colors were not saved. Reload your workspace and try again.')}},onApply:()=>refreshPresentation()}));}
const presentationFrame=()=>document.querySelector('[data-presentation-frame]');
function frameMarkup(){const target=activePreviewProject?'/project/'+activePreviewProject:page==='Home'?'':'/'+page.toLowerCase();return `<iframe class="portfolio-frame ${device}" data-presentation-frame title="Live portfolio preview" src="/preview${target}"></iframe>`}
portfolio=()=>frameMarkup();casePreview=()=>frameMarkup();
const priorDirectPanel=directPanel;
function productDirectPanel(title,body){return `<aside class="right-panel direct-panel" aria-label="Selected element properties"><div class="prop-head"><h3>${esc(title)}</h3><button class="iconbtn" data-direct-close aria-label="Close properties">${icon('close')}</button></div><div class="direct-panel-body">${body}<p class="direct-saved">Changes save to your workspace</p></div></aside>`}
directPanel=()=>directSelection?.key==='heroimage'?productDirectPanel('Featured image',directMedia('heroimage',state.heroImage||'','Featured creative work')):directSelection?.key==='opening'&&!state.personalBrand.enabled?productDirectPanel('What you do',directField('Professional title','profile.title',state.profile.title)):priorDirectPanel().replace('Saved locally as you type','Changes save to your workspace');
const originalApplyMedia=applyDirectMedia;applyDirectMedia=(target,url,name)=>{if(target!=='heroimage')return originalApplyMedia(target,url,name);mutate(()=>{state.heroImage=url;state.heroImageAlt=name},false);refreshDirectCanvas();mountDirectPanel()};
function sendPresentationMode(){presentationFrame()?.contentWindow.postMessage({type:'sf-preview-mode',edit:directEnabled()},location.origin)}
async function refreshPresentation(){clearTimeout(presentationTimer);await cloudSave();if(cloudConflict||cloudFailed)return;const frame=presentationFrame();if(frame){presentationBusy=true;frame.contentWindow.location.reload()}}
refreshDirectCanvas=()=>{clearTimeout(presentationTimer);presentationTimer=setTimeout(refreshPresentation,750)};
window.addEventListener('sf-save',()=>{clearTimeout(presentationTimer);presentationTimer=setTimeout(refreshPresentation,850)});
window.addEventListener('message',event=>{
  const frame=presentationFrame();if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  if(event.data?.type==='sf-preview-ready'){sendPresentationMode();if(presentationBusy){frame.contentWindow.scrollTo(0,presentationScroll);presentationBusy=false}return}
  if(event.data?.type==='sf-preview-scroll'){presentationScroll=event.data.y;return}
  if(event.data?.type!=='sf-edit'||!directEnabled())return;
  let {key,id,block}=event.data;if(!['name','portrait','heroimage','background','opening','intro','headline','bio','about','note','location','skills','countries','clients','projects','years','reach','work','contact','clientlogos','project','block','section'].includes(key))return;
  if(['project','block'].includes(key)&&!state.projects.some(p=>p.id===id))return;
  if(key==='section'){selected=id;directSelection=null;propTab='Content';const panel=document.querySelector('.editor-shell>.right-panel');if(panel){panel.outerHTML=editorRight();return}}
  if(!state.personalBrand.enabled&&['about','work','contact'].includes(key)){const type={about:'About',work:'Selected Work',contact:'Contact'}[key];const s=state.sections.find(s=>s.type===type);if(s){selected=s.id;propTab='Content';directSelection=null;const panel=document.querySelector('.editor-shell>.right-panel');if(panel){panel.outerHTML=editorRight();return}key='section';id=s.id}}
  chooseDirect(key,id,block);
});
document.addEventListener('click',event=>{if(event.target.closest('[data-direct-mode]'))requestAnimationFrame(sendPresentationMode)});
const beforeProductUpdate=updateField;
updateField=function(id,value,rerender=true){if(id.startsWith('cinema.')){mutate(()=>{state.cinematic||={};state.cinematic[id.slice(7)]=id==='cinema.depth'?Number(value):value},false);refreshDirectCanvas();return}beforeProductUpdate(id,value,rerender)};
// Existing editing tools can safely request initialization in the iframe-backed view.
if(typeof initCinema==='undefined')window.initCinema=()=>{};
const initialSelection=new URLSearchParams(location.search).get('select');
state.cinematic||={enabled:false,depth:1,kicker:state.profile.title,line:state.profile.bio};
const beforePresentationRender=render;
const guidedEditor=new URLSearchParams(location.search).get('guided')==='1';let moreControls=false;
render=function(){beforePresentationRender();document.body.classList.toggle('guided-editor',guidedEditor&&view==='editor');document.body.classList.toggle('show-more-controls',moreControls);if(guidedEditor&&view==='editor'){document.querySelector('.editor-shell')?.insertAdjacentHTML('beforebegin',`<nav class="easy-editor-tools" aria-label="Make it yours"><span>Make it yours</span><button data-easy-edit="name">Name</button><button data-easy-edit="${['monument','noir','aura'].includes(state.templateId)?'opening':'headline'}">${['monument','noir','aura'].includes(state.templateId)?'What I do':'Headline'}</button><button data-easy-edit="${['monument','solstice','noir','velocity','ember','ledger','atelier','aura','mosaic'].includes(state.templateId)?'portrait':'heroimage'}">Image</button><a href="/#projects">My work ↗</a><a href="/#styles">Change template</a><button data-easy-more aria-pressed="${moreControls}">More controls</button></nav>`)}document.querySelectorAll('.saved').forEach(el=>el.textContent=cloudConflict||cloudFailed?'Not saved — check message':cloudSaving||cloudTimer?'Saving…':'Saved to workspace');const address=document.querySelector('.preview-address');if(address)address.textContent='Private preview · same presentation as your published portfolio';const badge=document.querySelector('.left-panel .badge');if(badge)badge.textContent=(window.SF_BOOT.plan||'free').toUpperCase()};
document.addEventListener('click',event=>{const edit=event.target.closest('[data-easy-edit]');if(edit){if(edit.textContent==='Image'&&['drift','sprout','cutpaper','pencil'].includes(state.templateId)){const project=state.projects.find(p=>!['Archived','Hidden'].includes(p.status));if(project)chooseDirect('project',project.id);else location.href='/#imports';return}chooseDirect(edit.dataset.easyEdit);return}if(event.target.closest('[data-easy-more]')){moreControls=!moreControls;render()}});
function routeProductScreen(){const requested=location.hash.slice(1);if(!['editor','preview','project','projects',''].includes(requested))location.replace('/#'+({'publish':'publish','overview':'overview','analytics':'analytics','onboarding':'profile'}[requested]||'overview'))}
window.addEventListener('hashchange',routeProductScreen);routeProductScreen();
render();
const beforePaletteRender=render;
render=function(){if(view==='preview'&&previousPresentationView!=='preview')previewReturnView=previousPresentationView==='project'?'project':'editor';beforePaletteRender();previousPresentationView=view;if(view==='preview'){document.querySelector('[data-action="go:editor"]')?.setAttribute('data-back-edit','');document.querySelector('#app')?.insertAdjacentHTML('beforeend','<button class="preview-exit" data-back-edit>← Back to edit</button>');}if(view==='editor'){const tools=document.querySelector('.easy-editor-tools')||document.querySelector('.topbar');tools?.insertAdjacentHTML('beforeend','<button data-open-palette>Colors</button>');}};
document.addEventListener('click',async event=>{if(event.target.closest('[data-open-palette]')){openPalette();return}if(event.target.closest('[data-back-edit]')){event.preventDefault();event.stopImmediatePropagation();await cloudSave();if(cloudConflict||cloudFailed)return;go(previewReturnView);}},true);
const beforeExitPresentation=render;render=function(){beforeExitPresentation();const studioLink=document.querySelector('body>a[href="/#overview"]');if(studioLink)studioLink.hidden=view==='preview';};
render();
if(initialSelection==='clientlogos')chooseDirect('clientlogos');
else if(guidedEditor&&view==='editor')chooseDirect('name');
