/* A photographic hero built from independent background and transparent subject layers. */
const cinematicDefaults={version:2,enabled:true,background:'assets/cinematic-background.png',subject:'assets/mikha-streetwear.png',kicker:'A different perspective. An unmistakable presence.',line:'Ideas with presence. Details that stay with you.',depth:1};
function applyMikhaScene(target){
  target.cinematic={...cinematicDefaults};target.profile.name='Mikha Gergis';target.profile.photo=cinematicDefaults.subject;target.profile.photoAlt='Mikha Gergis in a charcoal T-shirt and black bomber jacket';
  if(target.profile.location==='Copenhagen, Denmark')target.profile.location='';
  if(target.profile.email==='hello@alexmorgan.design')target.profile.email='';
  if(target.profile.bio.includes('Copenhagen')||/[\u0600-\u06ff]/.test(target.profile.bio))target.profile.bio='I believe every memorable piece of work starts with a clear point of view. The details give it soul.';
  if(target.personalBrand){target.personalBrand.enabled=true;target.personalBrand.portrait=cinematicDefaults.subject;target.personalBrand.portraitAlt=target.profile.photoAlt;target.personalBrand.motion='Full'}
  if(['alexmorgan','mikha-gergis'].includes(target.publish.slug)){target.publish.slug='mikha-gergis';target.publish.seoTitle='Mikha Gergis — Portfolio';target.publish.description='A different perspective. An unmistakable presence.'}
}
// One-time migration: keep later profile/scene edits and preserve the prior workspace.
if(!localStorage.getItem('sitofolio-mikha-scene-v2')){
  try{localStorage.setItem('sitofolio-before-mikha-streetwear',JSON.stringify(state));applyMikhaScene(state);save();localStorage.setItem('sitofolio-mikha-scene-v2','1')}catch{applyMikhaScene(state)}
}
// New browser sessions open the requested personal portfolio, too.
applyMikhaScene(initial);
initial.cinematic.enabled=false;
const editorialStoryHero=storyHero;
storyHero=function(s,edit){if(!state.cinematic?.enabled)return editorialStoryHero(s,edit);const p=state.profile,c=state.cinematic;return `<section class="story-hero cinema-hero" ${storyAttr(s,edit,'home')} data-depth="${c.depth}"><div class="cinema-background" aria-hidden="true" style="background-image:url('${esc(c.background)}')"></div><div class="cinema-back-light" aria-hidden="true"></div><div class="cinema-shade" aria-hidden="true"></div><div class="cinema-subject"><img src="${esc(c.subject)}" alt="${esc(p.photoAlt||p.name)}" fetchpriority="high" draggable="false"></div><div class="cinema-foreground" aria-hidden="true"></div><div class="cinema-grain" aria-hidden="true"></div><div class="cinema-copy" lang="en" dir="ltr"><span class="cinema-overline">${esc(c.kicker)}</span><h1><span>${esc(p.name.split(' ')[0])}</span><i>${esc(p.name.split(' ').slice(1).join(' '))}</i></h1><div class="cinema-rule"></div><p>${esc(c.line)}</p><button data-action="journey:work" class="cinema-work-link">Explore my work <span aria-hidden="true">↗</span></button></div><div class="cinema-edition"><span>PERSONAL PORTFOLIO</span><span>VOL. 01 / ${new Date().getFullYear()}</span></div><div class="cinema-bottom"><button data-action="journey:about" class="cinema-scroll"><span class="cinema-scroll-line" aria-hidden="true"></span><span lang="en" dir="ltr">There is a story behind the image</span><span aria-hidden="true">↓</span></button><span class="cinema-bottom-note">A DIFFERENT PERSPECTIVE.</span>${edit?btn('Edit cinematic scene','cinema-settings','cinema-edit','image'):''}</div></section>`};
function cinematicSettings(){const c=state.cinematic;modal('Your cinematic scene',`<p class="muted" dir="ltr">Your portrait and the environment are separate layers with matching light. Use a transparent PNG when replacing the portrait to keep the depth.</p><div class="form-grid" style="margin-top:25px">${field('Name','profile.name',state.profile.name)}${field('Opening line','cinema.kicker',c.kicker)}<div class="span2">${field('Short introduction','cinema.line',c.line,'textarea')}</div><label class="field"><span>Depth</span><select data-field="cinema.depth">${[['0','Still'],['0.5','Gentle'],['1','Balanced'],['1.5','Expressive']].map(([value,label])=>`<option value="${value}" ${String(c.depth)===value?'selected':''}>${label}</option>`).join('')}</select></label>${selectField('Motion','brand.motion',state.personalBrand.motion,['Full','Subtle','Off'])}</div><div class="row">${btn('Change portrait','choose-media:cinema-subject','','image')}${btn('Change background','choose-media:cinema-background','','image')}</div><p class="help-tip" style="margin-top:20px">Choose the depth that feels right to you. Motion automatically stops when your device requests reduced motion.</p>`,btn('Done','close-dialog','primary'))}
const preCinemaUpdate=updateField;
updateField=function(id,value,rerender=true){if(id.startsWith('cinema.')){const key=id.slice(7);mutate(()=>state.cinematic[key]=key==='depth'?Number(value):value,rerender&&!$('#dialog').open);return}preCinemaUpdate(id,value,rerender)};
const preCinemaMedia=setMedia;
setMedia=function(url,name){if(mediaTarget==='cinema-subject'||mediaTarget==='cinema-background'||(mediaTarget==='brand'&&state.cinematic?.enabled)){mutate(()=>{if(mediaTarget==='cinema-background')state.cinematic.background=url;else{state.cinematic.subject=url;state.profile.photo=url;state.profile.photoAlt=name;state.personalBrand.portrait=url;state.personalBrand.portraitAlt=name}});closeModal();return}preCinemaMedia(url,name)};
const preCinemaAction=handleExtraAction;
handleExtraAction=function(action,value){if(action==='cinema-settings'){cinematicSettings();return}preCinemaAction(action,value)};
const preCinemaPortfolio=portfolio;
portfolio=function(edit=false,mini=false){let html=preCinemaPortfolio(edit,mini);if(!state.cinematic?.enabled||!state.personalBrand.enabled||page!=='Home')return html;html=html.replace('portfolio brand-experience','portfolio brand-experience cinematic-experience').replace(/<button data-action="journey:home" class="story-monogram">[\s\S]*?<\/button>/,'<button data-action="journey:home" class="story-monogram" lang="en" dir="ltr">'+esc(state.profile.name)+'</button>').replace('The person','About').replace('The work','Work').replace('Let’s talk <span>↗</span>','Contact <span>↗</span>').replace('A PORTFOLIO WITH A POINT OF VIEW','INDEPENDENT PERSPECTIVE').replace('<a href="mailto:"></a>','').replace('Illustrative figures & locations · fictional portfolio','Illustrative counts and locations — not Mikha’s actual achievements').replace('03 — SELECTED COLLABORATIONS','03 — SAMPLE PROJECTS · DEMONSTRATION WORK');return html};
const preCinemaRight=editorRight;
editorRight=function(){let html=preCinemaRight();if(state.cinematic?.enabled&&activeSection()?.type==='Hero'){html=html.replace('<span class="eyebrow">PERSONAL BRAND EXPERIENCE</span>','<span class="eyebrow">CINEMATIC PERSONAL BRAND</span>'+btn('Edit cinematic scene','cinema-settings','primary full','image')).replace('A story, in motion.','A scene with depth.').replace('Portrait, personal story, global reach, and work. One continuous experience.','A full-width environment, a separate portrait, and typography with room to breathe.');}return html};
let stopCinema=()=>{};
const preCinemaRender=render;
render=function(){stopCinema();preCinemaRender();document.title=view==='preview'?state.profile.name+' | Portfolio':'Sitofolio — Portfolio studio';requestAnimationFrame(initCinema)};
function initCinema(){stopCinema();const cleanups=[];document.querySelectorAll('.cinema-hero').forEach(hero=>{
  const root=hero.closest('.brand-experience'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,full=!reduced&&root.dataset.motion==='Full',strength=full?Number(hero.dataset.depth):0;
  const container=hero.closest('.canvas-wrap')||hero.closest('.preview-shell.with-publish .preview-canvas')||window;
  let raf=0,alive=true,x=0,y=0,targetX=0,targetY=0,scroll=0,targetScroll=0;
  function draw(){if(!alive)return;const ease=.075;x+=(targetX-x)*ease;y+=(targetY-y)*ease;scroll+=(targetScroll-scroll)*.11;
    hero.style.setProperty('--scene-x',x+'px');hero.style.setProperty('--scene-y',y+'px');hero.style.setProperty('--scene-scroll',scroll+'px');
    const pending=Math.abs(targetX-x)+Math.abs(targetY-y)+Math.abs(targetScroll-scroll)>.05;raf=pending?requestAnimationFrame(draw):0;
  }
  function request(){if(!raf)raf=requestAnimationFrame(draw)}
  function onScroll(){const r=hero.getBoundingClientRect(),top=container===window?50:container.getBoundingClientRect().top;targetScroll=Math.max(0,Math.min(r.height,top-r.top))*.16*strength;request()}
  function onPointer(e){if(e.pointerType==='touch'||!strength)return;const r=hero.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*30*strength;targetY=((e.clientY-r.top)/r.height-.5)*18*strength;request()}
  function reset(){targetX=targetY=0;request()}
  hero.addEventListener('pointermove',onPointer);hero.addEventListener('pointerleave',reset);container.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);onScroll();
  cleanups.push(()=>{alive=false;cancelAnimationFrame(raf);hero.removeEventListener('pointermove',onPointer);hero.removeEventListener('pointerleave',reset);container.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)});
});stopCinema=()=>cleanups.forEach(fn=>fn())}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',initCinema);
document.addEventListener('input',e=>{if(e.target.dataset.field)requestAnimationFrame(initCinema)});
render();
