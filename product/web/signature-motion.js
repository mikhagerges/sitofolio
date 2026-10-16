// A single body of work changes composition; a printed collection follows scroll.
// No scroll interception, animation dependency, canvas or duplicate page snapshots.
export const signatureWorks = [
  {name:'HAZA',kind:'Brand identity / Concept',image:'/examples/haza-page-011.jpg',template:'noir',alt:'HAZA wing identity on a falcon photograph'},
  {name:'Hills Coffee',kind:'Visual identity / Campaign',image:'/examples/hills-page-024.jpg',template:'solstice',alt:'Hills Coffee visual system and campaign layouts'},
  {name:'Cozy Cafe',kind:'Brand identity',image:'/examples/cozy-cover.jpg',template:'signal',alt:'Cozy Cafe brand presentation'}
];

export function liveCompositionMarkup() {
  return `<div class="sf-live-portfolio" data-live-portfolio aria-hidden="true">
    <div class="sf-live-ink" data-live-ink></div>
    <div class="sf-live-nav"><span>MG®</span><span>WORK &nbsp; ABOUT ↗</span></div>
    <div class="sf-live-photo" data-live-part><img src="/examples/mikha-streetwear.png" alt="" fetchpriority="high" width="1024" height="1536"></div>
    <div class="sf-live-role" data-live-part>CREATIVE DIRECTOR<br>& VISUAL STORYTELLER</div>
    <div class="sf-live-name" data-live-part><span>Mikha</span><span>Gerges<span class="sf-live-name-dot">.</span></span></div>
    <div class="sf-live-art sf-live-art-one" data-live-part><img src="/examples/haza-page-011.jpg" alt="" width="1600" height="900"><span>01 / HAZA ↗</span></div>
    <div class="sf-live-art sf-live-art-two" data-live-part><img src="/examples/hills-page-024.jpg" alt="" width="1600" height="900"><span>02 / HILLS COFFEE ↗</span></div>
    <div class="sf-live-note" data-live-part>INDEPENDENT MIND.<br>A POINT OF VIEW.</div>
    <span class="sf-live-footer">SELECTED WORK — 2026 <i>↘</i></span>
  </div><div class="sf-composition-index" aria-hidden="true"><span>01</span><i></i><span>03</span></div><span class="sf-composition-label" data-composition-label aria-hidden="true">PORTRAIT / DARK</span>`;
}

export function workSequenceMarkup() {
  return `<section class="sf-showcase" data-work-sequence aria-labelledby="sf-sequence-title"><div class="sf-showcase-pin">
    <div class="sf-showcase-heading"><span class="sf-kicker">THE WORK COMES FIRST</span><h2 id="sf-sequence-title">Let the work<br><span>take the lead.</span></h2><p>Different stories.<br>Your unmistakable point of view.</p><span class="sf-showcase-credit">Artwork by Mikha Gerges<br>From the example collection</span></div>
    <div class="sf-showcase-stage" data-sequence-stage>${signatureWorks.map((work,index)=>`<a class="sf-showcase-card" id="sf-print-${index}" data-sequence-card="${index}" href="/templates/${work.template}/work?collection=1" aria-label="Explore ${work.name} example work"><div class="sf-print-image"><img src="${work.image}" alt="${work.alt}" width="1600" height="900" loading="lazy"></div><span class="sf-print-label"><span>MG — SELECTED WORK</span><span>${String(index+1).padStart(2,'0')} / ${work.name}</span></span></a>`).join('')}</div>
    <div class="sf-showcase-caption"><span class="sf-counter-window" aria-hidden="true"><span data-sequence-digits><span>01</span><span>02</span><span>03</span></span></span><div><h3 data-sequence-title>HAZA</h3><p data-sequence-kind>Brand identity / Concept</p></div><a data-sequence-link href="/templates/noir/work?collection=1" aria-label="Explore HAZA example work">Explore the work <span aria-hidden="true">↗</span></a></div>
    <div class="sf-sequence-controls" role="group" aria-label="Choose an artwork">${signatureWorks.map((work,index)=>`<button type="button" data-sequence-go="${index}" aria-label="Show ${work.name}" aria-pressed="${index===0}"><span>${String(index+1).padStart(2,'0')}</span><i aria-hidden="true"></i><span>${work.name}</span></button>`).join('')}</div>
    <div class="sf-sequence-baseline"><span>SCROLL TO TURN THE PAGE <span aria-hidden="true">↓</span></span><span>SAME CREATOR. A DIFFERENT CHAPTER.</span></div><div class="sf-sequence-track" aria-hidden="true"><span data-sequence-progress></span></div><span class="sf-sr-only" data-sequence-status role="status">HAZA, artwork 1 of 3</span>
  </div></section>`;
}

const clamp = value => Math.max(0,Math.min(1,value));
const mix = (a,b,t) => a+(b-a)*t;
const stops = [
  [{x:0,y:-.02,r:-7,s:.88,o:1},{x:.27,y:.12,r:12,s:.75,o:1},{x:-.27,y:.16,r:-13,s:.7,o:1}],
  [{x:-.84,y:-.18,r:-18,s:.62,o:.5},{x:0,y:-.02,r:0,s:1,o:1},{x:.33,y:.15,r:11,s:.76,o:1}],
  [{x:-1.15,y:-.3,r:-23,s:.52,o:.15},{x:-.84,y:-.18,r:-17,s:.62,o:.5},{x:0,y:-.02,r:3,s:1,o:1}]
];

// Normalized coordinates make the same composition work at every viewport size.
export function sequencePose(progress) {
  const p=clamp(Number.isFinite(progress)?progress:0),segment=p<.5?0:1;
  const raw=(p-segment*.5)*2,t=raw*raw*(3-2*raw);
  return {progress:p,active:Math.min(2,Math.floor(p*2+.5)),cards:stops[segment].map((pose,index)=>Object.fromEntries(Object.keys(pose).map(key=>[key,mix(pose[key],stops[segment+1][index][key],t)])))};
}

export function mountSignatureMotion(root,{motionAllowed}) {
  const stage=root.querySelector('.sf-signature-stage'),sequence=root.querySelector('[data-work-sequence]');
  if(!stage||!sequence)return {setLook(){},setEnabled(){},destroy(){}};
  const animations=new Set(),listeners=[];
  let destroyed=false,introFrame=0,scrollFrame=0,current=0,target=0,active=-1,inkGeneration=0;
  const listen=(element,name,handler,options)=>{element.addEventListener(name,handler,options);listeners.push(()=>element.removeEventListener(name,handler,options));};
  const animate=(element,frames,options)=>{
    if(!motionAllowed()||destroyed||!element?.animate)return null;
    const animation=element.animate(frames,options);animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));return animation;
  };
  const cancelAnimations=()=>{animations.forEach(animation=>animation.cancel());animations.clear();};
  const letters=[...root.querySelectorAll('.sf-pulse-letter')];
  const wave=()=>letters.forEach((letter,index)=>{
    letter.getAnimations().forEach(animation=>animation.cancel());
    animate(letter,[{transform:'translateY(0) rotateX(0deg)',fontVariationSettings:'"wght" 600, "wdth" 100'},{transform:'translateY(-16%) rotateX(-22deg)',fontVariationSettings:'"wght" 800, "wdth" 90',offset:.42},{transform:'translateY(0) rotateX(0deg)',fontVariationSettings:'"wght" 600, "wdth" 100'}],{duration:850,delay:index*55,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
  const parts=[...stage.querySelectorAll('[data-live-part]')];
  const replay=()=>{
    if(!motionAllowed())return;
    cancelAnimations();
    parts.forEach((part,index)=>{
      const side=index%2?1:-1;
      animate(part,[{transform:`translate3d(${side*(35+index*8)}px,${index%2?40:-35}px,0) rotate(${side*13}deg) rotateY(${side*36}deg) scale(.72)`,clipPath:'inset(0 0 24% 0)',opacity:.3},{transform:'translate3d(0,0,0) rotate(0) rotateY(0) scale(1)',clipPath:'inset(0)',opacity:1}],{duration:1150,delay:index*65,easing:'cubic-bezier(.16,1,.3,1)'});
    });
    wave();
  };
  const lookLabels={noir:'PORTRAIT / DARK',solstice:'IMAGE / WARM',signal:'TYPE / BOLD'};
  const setLook=look=>{
    if(!Object.hasOwn(lookLabels,look)||stage.dataset.look===look)return;
    const generation=++inkGeneration,plane=stage.querySelector('[data-live-ink]');
    const oldColor=getComputedStyle(stage.querySelector('[data-live-portfolio]')).backgroundColor;
    cancelAnimations();
    stage.dataset.look=look;
    root.querySelector('[data-composition-label]').textContent=lookLabels[look];
    const index=['noir','solstice','signal'].indexOf(look);
    stage.style.setProperty('--look-index',index);
    if(motionAllowed()) {
      const portfolio=stage.querySelector('[data-live-portfolio]'),newColor=getComputedStyle(portfolio).getPropertyValue('--live-bg').trim();
      portfolio.style.backgroundColor=oldColor;plane.style.backgroundColor=newColor;
      const ink=animate(plane,[{clipPath:'polygon(0 0,0 0,0 100%,0 100%)'},{clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'}],{duration:900,easing:'cubic-bezier(.65,0,.2,1)',fill:'forwards'});
      ink?.finished.then(()=>{if(!destroyed&&generation===inkGeneration){portfolio.style.removeProperty('background-color');ink.cancel();}},()=>{if(!destroyed&&generation===inkGeneration)portfolio.style.removeProperty('background-color');});
      wave();
    }
  };
  const replayButton=root.querySelector('[data-sf-replay]');
  listen(replayButton,'click',replay);
  listen(root.querySelector('.sf-pulse-word'),'pointerenter',wave);

  const pin=sequence.querySelector('.sf-showcase-pin'),surface=sequence.querySelector('[data-sequence-stage]');
  const cards=[...sequence.querySelectorAll('[data-sequence-card]')];
  let width=surface.clientWidth,height=surface.clientHeight;
  function paint(progress) {
    const pose=sequencePose(progress);
    cards.forEach((card,index)=>{
      const p=pose.cards[index];
      card.style.transform=`translate(-50%,-50%) translate3d(${(p.x*width).toFixed(2)}px,${(p.y*height).toFixed(2)}px,0) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
      card.style.opacity=p.o.toFixed(3);card.style.zIndex=index===pose.active?'4':String(3-index);
    });
    sequence.querySelector('[data-sequence-progress]').style.transform=`scaleX(${pose.progress})`;
    if(active!==pose.active){
      active=pose.active;const work=signatureWorks[active];
      cards.forEach((card,index)=>{card.tabIndex=index===active?0:-1;});
      sequence.querySelector('[data-sequence-digits]').style.transform=`translateY(-${active}em)`;
      sequence.querySelector('[data-sequence-title]').textContent=work.name;
      sequence.querySelector('[data-sequence-kind]').textContent=work.kind;
      const link=sequence.querySelector('[data-sequence-link]');link.href=`/templates/${work.template}/work?collection=1`;link.setAttribute('aria-label','Explore '+work.name+' example work');
      sequence.querySelectorAll('[data-sequence-go]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.sequenceGo)===active)));
      sequence.querySelector('[data-sequence-status]').textContent=work.name+', artwork '+(active+1)+' of 3';
    }
  }
  function measure() {
    width=surface.clientWidth;height=surface.clientHeight;
    updateScroll(true);
  }
  function tick() {
    scrollFrame=0;if(destroyed||!motionAllowed()||document.hidden)return;
    const rect=sequence.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;
    current=Math.abs(target-current)<.0007?target:current+(target-current)*.18;
    paint(current);
    if(current!==target)scrollFrame=requestAnimationFrame(tick);
  }
  function updateScroll(immediate=false) {
    if(destroyed||!motionAllowed())return;
    const rect=sequence.getBoundingClientRect(),top=parseFloat(getComputedStyle(pin).top)||0;
    const distance=sequence.offsetHeight-pin.offsetHeight;
    target=clamp(distance>0?(top-rect.top)/distance:0);
    if(immediate){current=target;paint(current);}
    else if(!scrollFrame&&rect.top<innerHeight&&rect.bottom>0)scrollFrame=requestAnimationFrame(tick);
  }
  listen(window,'scroll',()=>updateScroll(),{passive:true});
  listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(scrollFrame);scrollFrame=0;}else updateScroll(true);});
  sequence.querySelectorAll('[data-sequence-go]').forEach(button=>listen(button,'click',()=>{
    if(!motionAllowed())return;
    const top=parseFloat(getComputedStyle(pin).top)||0;
    const start=scrollY+sequence.getBoundingClientRect().top-top;
    const distance=sequence.offsetHeight-pin.offsetHeight;
    window.scrollTo({top:start+distance*(Number(button.dataset.sequenceGo)/2),behavior:'smooth'});
  }));
  const resize=new ResizeObserver(measure);resize.observe(pin);resize.observe(surface);
  function setEnabled() {
    sequence.dataset.sequenceMotion=motionAllowed()?'on':'off';
    replayButton.disabled=!motionAllowed();
    if(!motionAllowed()){
      inkGeneration++;
      cancelAnimations();cancelAnimationFrame(introFrame);cancelAnimationFrame(scrollFrame);introFrame=scrollFrame=0;
      stage.querySelector('[data-live-portfolio]').style.removeProperty('background-color');
      cards.forEach(card=>{card.style.removeProperty('transform');card.style.removeProperty('opacity');card.style.removeProperty('z-index');card.removeAttribute('tabindex');});
    }else {active=-1;measure();}
  }
  setEnabled();
  // Wait for the first layout frame, without withholding any content while media loads.
  introFrame=requestAnimationFrame(()=>{introFrame=requestAnimationFrame(()=>{introFrame=0;if(!destroyed)replay();});});
  return {setLook,setEnabled,destroy(){destroyed=true;cancelAnimationFrame(introFrame);cancelAnimationFrame(scrollFrame);cancelAnimations();resize.disconnect();listeners.forEach(dispose=>dispose());}};
}
