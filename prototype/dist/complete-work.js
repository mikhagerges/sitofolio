/* Complete, chapter-based presentations. Original files remain untouched. */
function installCompleteWork(){
  const isPreviousNiceSample=b=>/^mikha-nice-image-\d+$/.test(b.id)&&/^assets\/work\/nice-[1-5]\.webp$/.test(b.image||'')&&!b.text&&b.visible!==false;
  if(state.portfolioPro?.completeEdition>=1){
    if(state.portfolioPro.completeEdition<2){
      for(const [id,source] of Object.entries(completeWorkData)){
        const p=state.projects.find(p=>p.id===id);if(!p)continue;
        const originals=source.chapters.flatMap(c=>c.items);
        for(const b of p.blocks){const original=originals.find(item=>item.src===b.sourceAsset);if(original?.poster)b.poster=original.poster;}
        const seen=new Set();p.blocks=p.blocks.filter(b=>{if(!b.sourceAsset||b.image!==b.sourceAsset||b.text)return true;if(seen.has(b.sourceAsset))return false;seen.add(b.sourceAsset);return true});
      }
      state.portfolioPro.completeEdition=2;save();
    }
    if(state.portfolioPro.completeEdition<3){
      const nice=state.projects.find(p=>p.id==='mikha-nice');
      if(nice?.presentation){nice.blocks=nice.blocks.filter(b=>!(b.chapter==='mikha-nice-saved-content'&&isPreviousNiceSample(b)));nice.presentation.chapters=nice.presentation.chapters.filter(c=>nice.blocks.some(b=>b.chapter===c.id));}
      state.portfolioPro.completeEdition=3;save();
    }
    return;
  }
  try{localStorage.setItem('sitofolio-before-complete-work',JSON.stringify(state))}catch{}
  for(const [id,source] of Object.entries(completeWorkData)){
    const p=state.projects.find(p=>p.id===id);if(!p)continue;
    const seed=mikhaProjects.find(p=>p.id===id);
    const custom=(p.blocks||[]).filter(b=>{if(isPreviousNiceSample(b))return false;const old=seed?.blocks.find(s=>s.id===b.id);return !old||b.text!==old.text||b.image!==old.image||b.visible!==old.visible});
    const chapters=source.chapters.map(c=>({id:c.id,title:c.title,description:c.description,layout:c.layout}));
    const blocks=source.chapters.flatMap(c=>c.items.map(item=>({
      ...structuredClone(item),chapter:c.id,visible:true,
      type:item.kind==='image'?'Big Image':item.kind==='text'?'Project Intro':'Video Embed',
      image:item.kind==='image'?item.src:undefined,url:['video','embed'].includes(item.kind)?item.src:undefined,
      text:item.text||'',sourceAsset:item.src
    })));
    if(custom.length){const chapter=id+'-saved-content';chapters.push({id:chapter,title:'Additional project content',description:'',layout:'grid'});blocks.push(...custom.map(b=>({...b,chapter})))}
    p.presentation={edition:1,chapters,pdf:source.pdf||'',sourceNote:source.sourceNote||'',sourcePages:source.sourcePages||0,sourceModules:source.sourceModules||0};
    p.blocks=blocks;p.images=blocks.filter(b=>b.image).map(b=>b.image);
    if(id==='mikha-nice'&&['assets/work/nice-1.webp','assets/work/nice-4.webp'].includes(p.cover))p.cover=blocks.find(b=>b.module===20)?.image||p.cover;
    if(p.credit===seed?.credit)p.credit=p.credit.replace('selected calendar artwork','complete exported calendar sequences');
    if(p.outcome===seed?.outcome)p.outcome='The supplied project presentation and complete exported campaign sequences are organized below.';
  }
  state.portfolioPro.completeEdition=3;save();
}
installCompleteWork();

function completeImage(b){
  const image=esc(b.image),alt=esc(b.alt||'Project artwork');
  const poster=b.image===b.sourceAsset?b.poster:'';
  const still=poster&&(matchMedia('(prefers-reduced-motion: reduce)').matches||state.personalBrand.motion==='Off');
  return `<a class="complete-art-link" href="${image}" target="_blank" rel="noopener noreferrer" aria-label="Open full image: ${alt}"><img src="${esc(still?poster:b.image)}" ${poster?`data-complete-motion="${image}" data-complete-poster="${esc(poster)}"`:''} alt="${alt}" width="${b.width||1200}" height="${b.height||1200}" loading="lazy" decoding="async"></a>${b.text?`<figcaption>${esc(b.text)}</figcaption>`:''}`;
}
function completeMedia(b,p){
  if(b.kind==='video')return `<video controls playsinline preload="metadata" aria-label="${esc(b.alt)}" ${b.poster?`poster="${esc(b.poster)}"`:''}><source src="${esc(b.url)}" type="video/mp4">Your browser does not support this video.</video>`;
  if(b.kind==='embed'){
    let safe='';try{const u=new URL(b.url);if(u.protocol==='https:'&&u.hostname==='www-ccv.adobe.io'&&/^\/v1\/player\/ccv\/[\w-]+\/embed$/.test(u.pathname))safe=u.href}catch{}
    return safe?`<iframe src="${esc(safe)}" title="${esc(b.alt)}" loading="lazy" allow="fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p class="complete-film-note">Original campaign film · streamed from Behance. <a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Watch on Behance ↗</a></p>`:renderBlock(b,p);
  }
  if(b.image)return completeImage(b);
  return `<div class="complete-copy">${(b.text||'').split('\n').filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('')}</div>`;
}
const completeOldCase=casePreview;
casePreview=function(){
  const p=state.projects.find(p=>p.id===activePreviewProject)||getProject();
  if(!p.presentation)return completeOldCase();
  const chapters=p.presentation.chapters.filter(c=>p.blocks.some(b=>b.chapter===c.id&&b.visible));
  const related=proProjects().filter(q=>q.id!==p.id).sort((a,b)=>Number(b.category===p.category)-Number(a.category===p.category)).slice(0,2);
  const count=p.blocks.filter(b=>b.visible&&(b.image||b.url)).length;
  return `<article class="portfolio case-preview pro-case complete-case ${device}" data-motion="${state.personalBrand.motion}">
    <nav class="pf-nav"><button class="pf-name" data-action="pro-home">${esc(state.profile.name)}</button><button class="pro-link" data-action="preview-home">All work ←</button>${proButton('Start a project','pro-brief:'+p.category)}</nav>
    <header class="case-heading"><span class="micro-label">${esc(p.category)} · ${esc(p.year)} ${p.tag?'· '+esc(p.tag):''}</span><h1>${esc(p.title)}</h1><p>${esc(p.notes)}</p><div class="pro-case-meta"><div><small>CLIENT / BRAND</small><span>${esc(p.client)}</span></div><div><small>DISCIPLINE</small><span>${esc(p.role)}</span></div><div><small>IN THIS PRESENTATION</small><span>${chapters.length} chapters · ${count} visuals & films</span></div></div></header>
    <div class="project-cover pro-case-cover complete-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)}"></div>
    <nav class="complete-index" aria-label="Project chapters"><span class="micro-label">EXPLORE THE PROJECT</span><div>${chapters.map((c,i)=>`<button data-pro-control="case-chapter" data-chapter-id="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(c.title)}</button>`).join('')}</div></nav>
    <div class="complete-body">${chapters.map((c,i)=>{
      const blocks=p.blocks.filter(b=>b.chapter===c.id&&b.visible);
      return `<section class="complete-chapter" id="${c.id}" data-chapter-section="${c.id}"><header class="complete-chapter-heading" data-complete-chapter="${c.id}" data-complete-project="${p.id}"><span class="micro-label">${String(i+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}</span><h2>${esc(c.title)}</h2>${c.description?`<p>${esc(c.description)}</p>`:''}</header><div class="complete-gallery complete-${c.layout}">${blocks.map((b,j)=>`<figure class="complete-item ${b.fullWidth||!b.image?'complete-wide':''} ${b.kind==='embed'?'complete-film':''} ${b.kind==='video'?'complete-video':''}" data-pro-block="${b.id}" data-pro-project-id="${p.id}">${completeMedia(b,p)}${b.image?`<div class="complete-frame-label"><span>${b.page?'PAGE '+String(b.page).padStart(2,'0'):b.reference?'MOODBOARD REFERENCE':String(j+1).padStart(2,'0')+' / '+String(blocks.length).padStart(2,'0')}</span><span>FULL FRAME ↗</span></div>`:''}</figure>`).join('')}</div></section>`
    }).join('')}</div>
    <section class="complete-credits"><span class="micro-label">CREDITS & SOURCE</span><p>${esc(p.credit)}</p>${p.presentation.sourceNote?`<p class="complete-source-note">${esc(p.presentation.sourceNote)}</p>`:''}<div>${p.presentation.pdf?`<a class="pro-link" href="${esc(p.presentation.pdf)}" target="_blank" rel="noopener noreferrer">Open original presentation · ${p.presentation.sourcePages} pages ↗</a>`:''}${p.source?`<a class="pro-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Original project & credits on Behance ↗</a>`:''}</div></section>
    <section class="pro-case-cta"><span class="micro-label">YOUR NEXT CHAPTER</span><h2>Have something<br><i>in mind?</i></h2>${proButton('Start a project together','pro-brief:'+p.category)}</section><section class="pro-section"><div class="pro-heading"><h2>Keep <i>exploring.</i></h2></div><div class="story-projects">${proCards(related)}</div></section><footer class="pf-footer"><span>© ${new Date().getFullYear()} ${esc(state.profile.name)}</span><a href="${mikhaWorkSources.behance}" target="_blank" rel="noopener noreferrer">Behance ↗</a></footer></article>`;
};
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-pro-control="case-chapter"]');if(!button)return;
  const target=document.getElementById(button.dataset.chapterId);if(!target)return;
  target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||state.personalBrand.motion==='Off'?'instant':'smooth',block:'start'});
  document.querySelectorAll('.complete-index button').forEach(el=>el.setAttribute('aria-current',String(el===button)));
});
const completeAnnotate=directAnnotate;
directAnnotate=function(){completeAnnotate();if(!directEnabled())return;
  document.querySelectorAll('[data-complete-chapter]').forEach(el=>{el.dataset.directKey='chapter';el.dataset.directId=el.dataset.completeProject;el.dataset.directBlock=el.dataset.completeChapter;el.tabIndex=0;el.title='Edit chapter'});
};
const completePanel=directPanel;
directPanel=function(){
  if(directSelection?.key!=='chapter')return completePanel();
  const p=state.projects.find(p=>p.id===directSelection.id),c=p?.presentation?.chapters.find(c=>c.id===directSelection.block);if(!c)return '';
  return `<aside class="right-panel direct-panel" aria-label="Selected element properties"><div class="prop-head"><div><span class="eyebrow">EDITING IN PLACE</span><h3>Project chapter</h3></div><button class="iconbtn" data-direct-close aria-label="Close properties">${icon('close')}</button></div><div class="direct-panel-body">${directField('Chapter title',`completechapter.${p.id}.${c.id}.title`,c.title)}${directField('Introduction',`completechapter.${p.id}.${c.id}.description`,c.description,'textarea')}${directSelect('Presentation layout',`completechapter.${p.id}.${c.id}.layout`,c.layout,['deck','grid','campaign','moodboard'])}<p class="help-tip">Deck: full-width pages. Grid: two columns. Campaign: three columns. Moodboard: a reference board. Every image keeps its complete frame.</p><p class="direct-saved">Saved locally as you type</p><div class="row">${ib('undo','undo','Undo change',history.length?'':'disabled')}${ib('redo','redo','Redo change',future.length?'':'disabled')}</div></div></aside>`;
};
const completeChange=changeDirectField;
changeDirectField=function(id,value){if(!id.startsWith('completechapter.'))return completeChange(id,value);const [,pid,cid,key]=id.split('.');mutate(()=>state.projects.find(p=>p.id===pid).presentation.chapters.find(c=>c.id===cid)[key]=value,false);refreshDirectCanvas()};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{const still=matchMedia('(prefers-reduced-motion: reduce)').matches||state.personalBrand.motion==='Off';document.querySelectorAll('[data-complete-motion]').forEach(img=>img.src=still?img.dataset.completePoster:img.dataset.completeMotion)});
render();
