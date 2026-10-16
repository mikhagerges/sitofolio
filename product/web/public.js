(() => {
  if(parent!==window)document.querySelector('.template-banner')?.remove();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>!reduced.matches&&document.body.dataset.motion!=='Off';
  const observers=[];
  if(motion()&&'IntersectionObserver' in window){
    const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target)}}),{threshold:.06});
    document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('will-reveal');reveal.observe(el)});observers.push(reveal);
    const counts=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)return;counts.unobserve(target);const total=Number(target.dataset.count),start=performance.now();function frame(now){const p=Math.min(1,(now-start)/1000);target.textContent=Math.round(total*(1-(1-p)**3));if(p<1&&motion())requestAnimationFrame(frame);else target.textContent=total}requestAnimationFrame(frame)}),{threshold:.5});
    document.querySelectorAll('[data-count]').forEach(el=>counts.observe(el));observers.push(counts);
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){observers.forEach(o=>o.disconnect());document.querySelectorAll('.will-reveal').forEach(e=>e.classList.add('revealed'))}});
  document.addEventListener('click',event=>{
    const pause=event.target.closest('[data-pause-ribbon]');if(pause){const on=pause.getAttribute('aria-pressed')!=='true';pause.setAttribute('aria-pressed',on);pause.textContent=on?'Resume scroll ▶':'Pause scroll Ⅱ';pause.closest('.client-ribbon').classList.toggle('paused',on)}
    const slide=event.target.closest('[data-slide]');if(slide){const grid=slide.closest('section').querySelector('.work-grid');grid.scrollBy({left:Number(slide.dataset.slide)*grid.clientWidth*.85,behavior:motion()?'smooth':'instant'})}
    const link=event.target.closest('[data-contact-link]');if(link&&document.body.dataset.contactEndpoint)fetch(document.body.dataset.contactEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'contact'}),keepalive:true}).catch(()=>{});
  });
  document.addEventListener('input',event=>{if(event.target.matches('[data-compare]'))event.target.closest('.before-after').style.setProperty('--split',event.target.value+'%')});
  document.querySelectorAll('.cinema-hero').forEach(hero=>{
    let frame=0,x=0,y=0,tx=0,ty=0;const depth=Number(hero.dataset.depth)||0;
    function paint(){x+=(tx-x)*.08;y+=(ty-y)*.08;hero.style.setProperty('--scene-x',x+'px');hero.style.setProperty('--scene-y',y+'px');frame=Math.abs(x-tx)+Math.abs(y-ty)>.05?requestAnimationFrame(paint):0}
    hero.addEventListener('pointermove',event=>{if(!motion()||document.body.dataset.motion!=='Full'||event.pointerType==='touch')return;const r=hero.getBoundingClientRect();tx=((event.clientX-r.left)/r.width-.5)*24*depth;ty=((event.clientY-r.top)/r.height-.5)*16*depth;if(!frame)frame=requestAnimationFrame(paint)});
    hero.addEventListener('pointerleave',()=>{tx=ty=0;if(!frame)frame=requestAnimationFrame(paint)});
    let scrollFrame=0;
    function scrollScene(){scrollFrame=0;const amount=motion()&&document.body.dataset.motion==='Full'?Math.max(0,Math.min(hero.offsetHeight,-hero.getBoundingClientRect().top))*.12*depth:0;hero.style.setProperty('--scene-scroll',amount+'px')}
    window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(scrollScene)},{passive:true});
    reduced.addEventListener('change',()=>{if(reduced.matches){tx=ty=0;if(!frame)frame=requestAnimationFrame(paint)}});
  });
  if(document.body.dataset.mode==='preview'&&parent!==window){
    document.querySelector('.preview-return')?.remove();
    let edit=false;
    let scrollFrame=0;
    window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;parent.postMessage({type:'sf-preview-scroll',y:scrollY},location.origin)})},{passive:true});
    window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='sf-preview-mode'){edit=Boolean(event.data.edit);document.body.classList.toggle('click-to-edit',edit)}});
    document.addEventListener('click',event=>{if(!edit)return;const item=event.target.closest('[data-edit-key]');if(!item)return;event.preventDefault();event.stopImmediatePropagation();parent.postMessage({type:'sf-edit',key:item.dataset.editKey,id:item.dataset.editId,block:item.dataset.editBlock},location.origin)},true);
    parent.postMessage({type:'sf-preview-ready'},location.origin);
  }
})();

// First motion pass: Noir, Solstice and Signal. Native scrolling and editable
// elements stay intact; the case-study controls use the actual visible chapters.
(() => {
  const body=document.body, reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const collection=new URLSearchParams(location.search).get('collection')==='1';
  if(collection&&parent===window){
    const back=document.querySelector('.template-banner a');
    if(back){back.href='/#templates';back.textContent='← Back to collection';}
    document.querySelectorAll('a[href]').forEach(link=>{
      const url=new URL(link.href,location.href);
      if(url.origin===location.origin&&url.pathname.startsWith('/templates/')){url.searchParams.set('collection','1');link.href=url.href;}
    });
  }
  const featured=['noir','solstice','signal'].includes(body.dataset.template);
  const chapters=[...document.querySelectorAll('.case-block')];
  if(!featured&&!chapters.length)return;
  body.classList.add('portfolio-refined');
  const originalMotion=body.dataset.motion||'Subtle';
  let paused=localStorage.getItem('sitofolio-portfolio-motion')==='off', revealObserver;
  const motion=()=>!paused&&!reduced.matches&&originalMotion!=='Off';
  const updateMotion=()=>{
    body.dataset.motion=motion()?originalMotion:'Off';
    document.querySelectorAll('[data-portfolio-motion]').forEach(button=>{
      button.setAttribute('aria-pressed',String(!motion()));
      button.textContent=motion()?'Motion on Ⅱ':'Motion off ▶';
    });
    if(!motion()){
      revealObserver?.disconnect();
      document.querySelectorAll('.pf-enter').forEach(element=>element.classList.add('pf-visible'));
      document.querySelectorAll('.will-reveal').forEach(element=>element.classList.add('revealed'));
      body.style.setProperty('--pf-hero-shift','0px');
    }
  };
  if(featured){
    body.classList.add('pf-featured');
    if(motion()&&'IntersectionObserver' in window){
      revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('pf-visible');revealObserver.unobserve(entry.target);}
      }),{threshold:.06});
      document.querySelectorAll('.work-grid .project').forEach((project,index)=>{
        project.style.setProperty('--pf-delay',(index%3)*65+'ms');
        project.classList.add('pf-enter');revealObserver.observe(project);
      });
    }
    const footer=document.querySelector('.direction-footer')||document.querySelector('.hero>div:first-child');
    if(footer){const button=document.createElement('button');button.type='button';button.className='pf-motion-button';button.dataset.portfolioMotion='';button.setAttribute('aria-label','Pause portfolio motion');footer.append(button);button.addEventListener('click',()=>{paused=!paused;localStorage.setItem('sitofolio-portfolio-motion',paused?'off':'on');updateMotion();});}
    let frame=0;
    const hero=document.querySelector('.direction-hero');
    if(hero){
      const update=()=>{frame=0;const rect=hero.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight)body.style.setProperty('--pf-hero-shift',(motion()&&originalMotion==='Full'?Math.min(45,Math.max(0,-rect.top)*.07):0)+'px');};
      addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
    }
  }
  const nav=document.querySelector('.site-nav');
  nav?.querySelectorAll('a[href]').forEach(link=>{const url=new URL(link.href,location.href);if(url.pathname===location.pathname&&!url.hash)link.setAttribute('aria-current','page');});
  if(chapters.length&&parent===window){
    body.classList.add('pf-case');
    const progress=document.createElement('div');progress.className='pf-reading-progress';progress.setAttribute('aria-hidden','true');body.append(progress);
    const toolbar=document.createElement('nav');toolbar.className='pf-story-toolbar';toolbar.setAttribute('aria-label','Project story navigation');
    const label=document.createElement('label');label.className='pf-chapter-label';label.textContent='THE STORY';
    const select=document.createElement('select');select.setAttribute('aria-label','Go to a project chapter');
    chapters.forEach((chapter,index)=>{const option=document.createElement('option');option.value=chapter.id;option.textContent=String(index+1).padStart(2,'0')+' / '+(chapter.querySelector('h2')?.textContent.trim()||'Visual '+String(index+1).padStart(2,'0'));select.append(option);});
    const count=document.createElement('span');count.className='pf-chapter-count';count.textContent='01 / '+String(chapters.length).padStart(2,'0');count.setAttribute('aria-hidden','true');
    label.append(select);toolbar.append(label,count);
    [['Previous chapter','←',-1],['Next chapter','→',1]].forEach(([name,text,direction])=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-label',name);button.addEventListener('click',()=>{const index=Math.max(0,Math.min(chapters.length-1,select.selectedIndex+direction));select.selectedIndex=index;goToChapter();});toolbar.append(button);});
    body.append(toolbar);
    function goToChapter(){document.getElementById(select.value)?.scrollIntoView({behavior:motion()?'smooth':'instant',block:'start'});}
    select.addEventListener('change',goToChapter);
    let frame=0;
    const update=()=>{
      frame=0;const total=document.documentElement.scrollHeight-innerHeight;
      progress.style.setProperty('--pf-progress',String(total>0?Math.max(0,Math.min(1,scrollY/total)):0));
      let current=0;chapters.forEach((chapter,index)=>{if(chapter.getBoundingClientRect().top<Math.min(96,innerHeight*.15))current=index;});
      if(document.activeElement!==select)select.selectedIndex=current;
      count.textContent=String(current+1).padStart(2,'0')+' / '+String(chapters.length).padStart(2,'0');
      const buttons=toolbar.querySelectorAll('button');buttons[0].disabled=current===0;buttons[1].disabled=current===chapters.length-1;
    };
    addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
    addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});update();
  }
  reduced.addEventListener('change',updateMotion);updateMotion();
})();
