/* A client-owned roster. No brands or endorsements are invented. */
const clientRibbonData=()=>state.personalBrand.clientRibbon||{items:[],speed:'Relaxed',direction:'Left'};
function clientRibbon(edit){
  const data=clientRibbonData(),items=data.items.filter(item=>item.name.trim()||item.logo),draft=(edit||view==='preview')&&!publishedPreview;
  if(!items.length)return draft?`<div class="client-ribbon client-ribbon-empty" tabindex="0" role="button" aria-label="Add client names or logos"><span class="micro-label">YOUR CLIENTS, IN GOOD COMPANY</span><div><span>Client names.</span><i>Client logos.</i><span class="client-plus">+</span></div><p>Click here to add the clients you’ve worked with.</p></div>`:'';
  const itemMarkup=items.map(item=>`<span class="client-mark" role="listitem">${item.logo?`<span class="client-logo-frame ${item.backing==='Light'?'light':item.backing==='Dark'?'dark':''}"><img src="${esc(item.logo)}" alt="${esc(item.name||'Client logo')}" draggable="false"></span>`:`<span>${esc(item.name)}</span>`}<b aria-hidden="true">✳</b></span>`).join('');
  const seconds={Slow:48,Relaxed:32,Brisk:20}[data.speed]||32;
  return `<div class="client-ribbon" tabindex="0" aria-label="Selected clients" style="--client-duration:${seconds}s;--client-direction:${data.direction==='Right'?'reverse':'normal'}"><div class="client-ribbon-head"><span class="micro-label">SELECTED CLIENTS & COLLABORATORS</span><button class="client-motion-control" data-client-control="pause" aria-pressed="false" aria-label="Pause client scroll">Pause <span aria-hidden="true">Ⅱ</span></button></div><div class="client-window"><div class="client-track"><div class="client-group" role="list" aria-label="Client names and logos">${itemMarkup}</div><div class="client-group client-repeat" aria-hidden="true">${itemMarkup}</div></div></div></div>`;
}
const aboutBeforeClients=storyAbout;
storyAbout=function(s,edit){return aboutBeforeClients(s,edit).replace(/<div class="word-ribbon"[\s\S]*?<\/div><\/div>/,clientRibbon(edit));};
function clientRibbonFields(){
  const data=clientRibbonData();
  return `<p class="help-tip">Add a name, a logo, or both. A logo replaces its name in the scrolling strip.</p>${directSelect('Scroll speed','clientsettings.speed',data.speed,['Slow','Relaxed','Brisk'])}${directSelect('Direction','clientsettings.direction',data.direction,['Left','Right'])}<div class="client-edit-list">${data.items.map((item,i)=>`<section class="client-edit-item"><div class="row between"><span class="eyebrow">CLIENT ${String(i+1).padStart(2,'0')}</span><div class="row"><button class="iconbtn" data-client-control="up" data-client-id="${item.id}" aria-label="Move client ${i+1} earlier" ${i===0?'disabled':''}>${icon('up')}</button><button class="iconbtn" data-client-control="down" data-client-id="${item.id}" aria-label="Move client ${i+1} later" ${i===data.items.length-1?'disabled':''}>${icon('down')}</button><button class="iconbtn" data-client-control="remove" data-client-id="${item.id}" aria-label="Remove client ${i+1}">${icon('trash')}</button></div></div>${directField('Client name '+(i+1),'clientitem.'+item.id+'.name',item.name)}${item.logo?`<div class="client-logo-preview"><img src="${esc(item.logo)}" alt="${esc(item.name||'Client logo')}"></div>`:''}<label class="client-logo-upload"><span>${item.logo?'Replace logo':'Upload logo'}</span><input type="file" data-client-upload="${item.id}" accept="image/png,image/jpeg,image/webp,image/svg+xml"><small>PNG, SVG, JPG or WebP · up to 2 MB</small></label>${item.logo?directSelect('Logo backing','clientitem.'+item.id+'.backing',item.backing||'None',['None','Light','Dark']):''}${item.logo?`<button class="text-button" data-client-control="remove-logo" data-client-id="${item.id}">Use name instead</button>`:''}</section>`).join('')}</div><button class="btn primary full" data-client-control="add">${icon('plus')}Add client</button><p class="help-tip" style="margin-top:16px">The strip pauses on hover or keyboard focus. Reduced motion shows a swipeable row.</p>`;
}
function ensureClientRibbon(){state.personalBrand.clientRibbon||={items:[],speed:'Relaxed',direction:'Left'};return state.personalBrand.clientRibbon}
function updateClientRibbon(id,value){const [kind,key,fieldName]=id.split('.');mutate(()=>{const data=ensureClientRibbon();if(kind==='clientitem'){const item=data.items.find(item=>item.id===key);if(item&&['name','backing'].includes(fieldName))item[fieldName]=value;}else if(kind==='clientsettings'&&['speed','direction'].includes(key))data[key]=value;},false)}
document.addEventListener('click',e=>{
  const control=e.target.closest('[data-client-control]');if(!control)return;
  e.preventDefault();e.stopImmediatePropagation();const action=control.dataset.clientControl;
  if(action==='pause'){const ribbon=control.closest('.client-ribbon'),paused=ribbon.classList.toggle('client-paused');control.setAttribute('aria-pressed',String(paused));control.setAttribute('aria-label',paused?'Resume client scroll':'Pause client scroll');control.innerHTML=paused?'Play <span aria-hidden="true">▷</span>':'Pause <span aria-hidden="true">Ⅱ</span>';return}
  if(!directEnabled())return;
  const id=control.dataset.clientId;
  mutate(()=>{const data=ensureClientRibbon(),i=data.items.findIndex(item=>item.id===id);
    if(action==='add')data.items.push({id:crypto.randomUUID(),name:'',logo:''});
    if(i<0)return;
    if(action==='remove')data.items.splice(i,1);
    if(action==='remove-logo')data.items[i].logo='';
    if(action==='up'&&i>0)data.items.splice(i-1,0,data.items.splice(i,1)[0]);
    if(action==='down'&&i<data.items.length-1)data.items.splice(i+1,0,data.items.splice(i,1)[0]);
  },false);refreshDirectCanvas();mountDirectPanel();
  if(action==='add')document.querySelector('.client-edit-item:last-child input[type=text]')?.focus({preventScroll:false});
},true);
document.addEventListener('change',async e=>{
  const id=e.target.dataset.clientUpload,file=e.target.files?.[0];if(!id||!file||!directEnabled())return;
  try{
    if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)||file.size>2*1024*1024)throw new Error('Choose a PNG, SVG, JPG or WebP smaller than 2 MB.');
    const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Logo could not be read.'));reader.readAsDataURL(file)});
    await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error('This logo could not be read.'));img.src=url});
    if(!clientRibbonData().items.some(item=>item.id===id))return;
    mutate(()=>{const item=ensureClientRibbon().items.find(item=>item.id===id);item.logo=url;if(!item.name.trim())item.name=file.name.replace(/\.[^.]+$/,'')},false);refreshDirectCanvas();mountDirectPanel();
  }catch(err){toast(err.message)}
});
render();
