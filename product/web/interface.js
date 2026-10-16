import {liveCompositionMarkup,workSequenceMarkup,mountSignatureMotion} from './signature-motion.js';
// SitoFolio's interface direction. Original compositions, using the existing catalog.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const icons = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  styles: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  projects: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3h8v2M3 10h18"/>',
  imports: '<path d="M12 16V3m-5 5 5-5 5 5M4 14v6h16v-6"/>',
  editor: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/>',
  publish: '<path d="M14 3h7v7m0-7L10 14M9 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5"/>'
};
const icon = key => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[key] || icons.overview)+'</svg>';

export function studioTop(me) {
  return `<a class="sf-skip" href="#sf-main">Skip to content</a><header class="top sf-header"><a class="wordmark" href="#" aria-label="SitoFolio home"><img class="logo-light" src="/prototype/assets/Artboard%204.svg" alt="SitoFolio"><img class="logo-dark" src="/brand-logo-dark.svg" alt="SitoFolio"></a>${!me?'<nav class="sf-public-nav" aria-label="Main navigation"><a href="#features">How it works</a><a href="#templates">The collection <span>20</span></a><a href="#pricing">Plans</a></nav>':'<span class="sf-studio-label">YOUR CREATIVE SPACE</span>'}<div class="sf-header-actions"><button type="button" class="theme-toggle sf-icon-button" data-action="theme" aria-label="Toggle light and dark interface"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 0 0 14Z" fill="currentColor"/></svg></button>${me?`<span class="sf-account"><span class="sf-avatar" aria-hidden="true">${escapeHtml(me.name?.trim().slice(0,1).toUpperCase()||'S')}</span><span>${escapeHtml(me.name)}<small>${escapeHtml(me.plan)} plan</small></span></span><button class="sf-signout" data-action="logout">Sign out</button>`:'<a class="sf-signin" href="#login">Sign in</a><a class="button sf-start" href="#register"><span>Start creating</span>'+arrow+'</a>'}</div></header>`;
}

export function studioSidebar(active, count, limit) {
  const core=[['overview','My portfolio'],['styles','Templates'],['projects','My work'],['imports','Add work'],['editor','Edit portfolio'],['publish','Share & publish']];
  const more=[['profile','Profile & personality'],['presence','Personal brand'],['analytics','Analytics'],['inquiries','Inquiries'],['settings','Account & settings']];
  return `<aside class="side sf-sidebar"><span class="sf-nav-label">YOUR STUDIO</span><nav aria-label="Studio navigation">${core.map(([key,label])=>`<a href="${key==='editor'?'/editor?guided=1#editor':'#'+key}" ${active===key?'class="active" aria-current="page"':''}>${icon(key)}<span>${label}</span>${key==='imports'?'<span class="sf-nav-plus">+</span>':''}</a>`).join('')}${more.map(([key,label])=>`<a class="sf-mobile-more ${active===key?'active':''}" href="#${key}" ${active===key?'aria-current="page"':''}>${label}</a>`).join('')}</nav><details ${more.some(([key])=>key===active)?'open':''}><summary>More controls <span>+</span></summary>${more.map(([key,label])=>`<a href="#${key}" ${active===key?'class="active" aria-current="page"':''}>${label}</a>`).join('')}</details><div class="bottom"><span class="sf-nav-label">SPACE FOR YOUR IDEAS</span><p><strong>${count}</strong> / ${limit} projects</p><a href="#imports">Bring something new ${arrow}</a></div></aside>`;
}

export function landingMarkup(catalog, visual, pricing) {
  const presetIds=['noir','solstice','signal'];
  return `<main id="sf-main" class="sf-landing" tabindex="-1">
    <section class="sf-hero" aria-labelledby="sf-hero-title">
      <div class="sf-hero-meta"><span><i class="sf-status-dot" aria-hidden="true"></i> A HOME FOR YOUR CREATIVE WORK</span><span>BUILT AROUND YOU. <span aria-hidden="true">↘</span></span></div>
      <div class="sf-hero-grid"><div class="sf-hero-copy"><h1 id="sf-hero-title"><span>Your work.</span><span>With a <span class="sf-pulse-word"><span class="sf-sr-only">pulse</span><span class="sf-pulse-glyphs" aria-hidden="true"><span class="sf-pulse-letter">p</span><span class="sf-pulse-letter">u</span><span class="sf-pulse-letter">l</span><span class="sf-pulse-letter">s</span><span class="sf-pulse-letter">e</span></span><svg viewBox="0 0 330 24" fill="none" aria-hidden="true"><path d="M3 17C72 1 183 2 325 9M30 22C101 10 242 10 307 17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span><span class="sf-period">.</span></span></h1><p>You made the work.<br>Now give it a world of its own.</p><div class="sf-hero-actions"><a class="button primary sf-primary-link" href="#register">Create your portfolio <span>${arrow}</span></a><a class="sf-text-link" href="#templates">Find your look <span aria-hidden="true">↗</span></a></div><span class="sf-hero-note">Start free. Make it unmistakably yours.</span></div>
      <div class="sf-hero-playground"><div class="sf-playground-label"><span>ONE BODY OF WORK. THREE PERSONALITIES.</span><div class="sf-playground-controls"><button type="button" class="sf-replay" data-sf-replay aria-label="Replay the composition animation">↻ Replay</button><button type="button" class="sf-motion-toggle" data-sf-motion aria-pressed="false">Motion <span data-sf-motion-label>on</span><span class="sf-motion-indicator" aria-hidden="true"></span></button></div></div><div class="sf-stage sf-signature-stage" data-sf-depth data-look="noir"><div class="sf-stage-grid" aria-hidden="true"></div>${liveCompositionMarkup()}</div><div class="sf-mood-picker" role="group" aria-label="Try a portfolio mood"><span>RECOMPOSE YOUR WORLD</span><div>${presetIds.map((id,index)=>`<button type="button" data-sf-mood="${id}" aria-pressed="${!index}" aria-controls="sf-mood-status"><i class="sf-swatch sf-swatch-${id}" aria-hidden="true"></i>${catalog.find(t=>t.id===id).name}</button>`).join('')}</div><span id="sf-mood-status" class="sf-sr-only" role="status">Noir composition — the same creator and work</span></div></div></div>
      <div class="sf-hero-baseline"><span>FOR DESIGNERS, IMAGE MAKERS & INDEPENDENT MINDS.</span><a href="#features">TAKE A LOOK AROUND <span aria-hidden="true">↓</span></a></div>
    </section>
    ${workSequenceMarkup()}
    <section id="features" class="sf-process sf-section" aria-labelledby="sf-process-title"><div class="sf-section-heading" data-sf-reveal><span class="sf-kicker">01 / FROM FILES TO FIRST IMPRESSIONS</span><h2 id="sf-process-title">Less setting up.<br>More <span class="sf-soft-text">showing up.</span></h2><p>Your ideas are already out there.<br>Bring them together, in your own way.</p></div><div class="sf-process-grid"><div class="sf-process-steps" role="group" aria-label="Explore the creation process">${[['Bring what you’ve made.','A PDF, a folder, a collection of images. Start with the work you already have.'],['Find your own rhythm.','Choose a visual direction. Refine the colors, the details, and the story.'],['Put your name on it.','Preview your pages, choose what’s public, and share when you’re ready.']].map(([title,description],index)=>`<button type="button" class="sf-process-step" data-sf-step="${index}" aria-pressed="${index===0}" aria-controls="sf-process-preview"><span class="sf-step-number">0${index+1}</span><span><strong>${title}</strong><span>${description}</span></span><i aria-hidden="true">${index===0?'−':'+'}</i></button>`).join('')}</div><div id="sf-process-preview" class="sf-process-preview" aria-live="polite"><div data-sf-process-panel="0"><div class="sf-file-group" aria-hidden="true"><span class="sf-file sf-file-back">JPG<span>THE DETAILS</span></span><span class="sf-file sf-file-front">PDF<span>SELECTED WORK</span></span><span class="sf-file sf-file-side">ZIP<span>THE WHOLE STORY</span></span></div><div class="sf-process-caption"><span class="sf-small-tag">01 — BRING YOUR WORK</span><h3>Already made.<br>Ready for a new home.</h3><p>Review and organize your files before they become editable project drafts.</p></div></div><div data-sf-process-panel="1" hidden><div class="sf-process-mini">${visual(catalog.find(t=>t.id==='mosaic'))}<span aria-hidden="true">✳</span></div><div class="sf-process-caption"><span class="sf-small-tag">02 — MAKE IT YOURS</span><h3>A direction.<br>Then your signature.</h3><p>Twenty starting points. Your colors, your words, your point of view.</p></div></div><div data-sf-process-panel="2" hidden><div class="sf-share-illustration" aria-hidden="true"><span>YOUR NEXT CHAPTER</span><b>Hello,<br>world<span>↗</span></b><i>YOUR WORK. YOUR CALL.</i></div><div class="sf-process-caption"><span class="sf-small-tag">03 — SHARE WHEN YOU’RE READY</span><h3>Your story.<br>On your terms.</h3><p>Drafts stay private. Review your portfolio before deciding what to publish.</p></div></div></div></div></section>
    <section id="templates" class="sf-collection sf-section" aria-labelledby="sf-collection-title"><div class="sf-section-heading" data-sf-reveal><span class="sf-kicker">02 / THE COLLECTION</span><h2 id="sf-collection-title">Same you.<br><span class="sf-soft-text">Different possibilities.</span></h2><p>A starting point with a point of view.<br>Explore a look before making it yours.</p></div><div class="sf-collection-toolbar"><div class="sf-collection-filters" role="group" aria-label="Filter the template collection">${['All','Minimal','Bold','Editorial','Cinematic','Gallery'].map((family,index)=>`<button type="button" data-sf-family="${family}" aria-pressed="${index===0}">${family}</button>`).join('')}</div><span data-sf-collection-count role="status"></span></div><div class="sf-public-templates" data-sf-collection></div><div class="sf-collection-bottom"><p>Different personalities. The same creative freedom.</p><button type="button" class="button" data-sf-all-templates aria-expanded="false">Explore all 20 templates <span aria-hidden="true">↗</span></button></div></section>
    <section id="pricing" class="sf-pricing sf-section" aria-labelledby="sf-pricing-title"><div class="sf-section-heading" data-sf-reveal><span class="sf-kicker">03 / SPACE TO GROW</span><h2 id="sf-pricing-title">Start with an idea.<br><span class="sf-soft-text">Grow at your pace.</span></h2><p>A free place to begin.<br>More room when your work needs it.</p></div>${pricing}</section>
    <section class="sf-finale"><span class="sf-kicker">YOU’VE ALREADY MADE SOMETHING GOOD.</span><h2>Give it a<br>place to <span>live.</span></h2><a href="#register" class="sf-finale-link" aria-label="Start creating your portfolio">${arrow}</a><div><p>Made by you.<br>Presented with SitoFolio.</p><a class="sf-text-link" href="#register">Let’s make it yours ↗</a></div></section>
  </main><footer class="sf-footer"><a class="wordmark" href="#" aria-label="SitoFolio home"><img class="logo-light" src="/prototype/assets/Artboard%204.svg" alt="SitoFolio"><img class="logo-dark" src="/brand-logo-dark.svg" alt="SitoFolio"></a><span>A little space. A lot of you.</span><a href="#help">Help & service status ↗</a><span>© ${new Date().getFullYear()} SitoFolio</span></footer>`;
}

export function startInterface(app, catalog, visual) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let cleanup = () => {};
  let signatureMotion = null;
  let motionOff = localStorage.getItem('sitofolio-interface-motion') === 'off';
  let family = 'All', expanded = false;
  const motionAllowed = () => !reduced.matches && !motionOff;
  const syncMotion = () => {
    document.body.dataset.sfMotion = motionAllowed() ? 'on' : 'off';
    app.querySelectorAll('[data-sf-motion]').forEach(button=>{
      button.setAttribute('aria-pressed', String(motionOff || reduced.matches));
      button.setAttribute('aria-label', reduced.matches ? 'Motion off — follows your system preference' : 'Pause interface motion');
      button.querySelector('[data-sf-motion-label]').textContent = motionAllowed() ? 'on' : 'off';
    });
    if(!motionAllowed()) {
      app.querySelectorAll('[data-sf-reveal]').forEach(element=>element.classList.add('sf-revealed'));
      app.querySelectorAll('[data-sf-depth]').forEach(element=>{element.style.setProperty('--pointer-x','0');element.style.setProperty('--pointer-y','0');});
    }
    signatureMotion?.setEnabled();
  };
  const renderCollection = () => {
    const target = app.querySelector('[data-sf-collection]');
    if(!target) return;
    const curated = ['noir','cutpaper','mosaic','signal','solstice','aire'];
    const matches = catalog.filter(template=>family==='All'||template.family===family);
    app.querySelectorAll('[data-sf-family]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sfFamily===family)));
    const shown = family==='All'&&!expanded ? curated.map(id=>catalog.find(t=>t.id===id)) : matches;
    target.innerHTML = shown.map((template,index)=>`<article class="sf-collection-card"><a class="sf-collection-cover" href="/templates/${template.id}?collection=1" aria-label="Explore ${escapeHtml(template.name)} template">${visual(template)}<span class="sf-cover-open">Explore ${arrow}</span></a><div class="sf-card-meta"><span>${String(index+1).padStart(2,'0')} / ${escapeHtml(template.family)}</span><span aria-hidden="true">↗</span></div><h3><a href="/templates/${template.id}?collection=1">${escapeHtml(template.name)}</a></h3><p>${escapeHtml(template.description)}</p></article>`).join('');
    app.querySelector('[data-sf-collection-count]').textContent = shown.length+' of '+matches.length+' looks';
    const button = app.querySelector('[data-sf-all-templates]');
    button.hidden = family!=='All';
    button.setAttribute('aria-expanded',String(expanded));
    button.innerHTML = (expanded?'Show selected looks':'Explore all '+catalog.length+' templates')+' <span aria-hidden="true">'+(expanded?'−':'↗')+'</span>';
  };
  const mount = () => {
    cleanup();
    signatureMotion=null;
    const landing = app.querySelector('.sf-landing');
    const main = app.querySelector('main');
    if(main&&!main.id) {main.id='sf-main';main.tabIndex=-1;}
    const shell = app.querySelector('.layout');
    document.body.classList.add('sf-interface');
    document.body.dataset.sfScreen = landing?'home':app.querySelector('.setup-shell')?'setup':app.querySelector('.auth')?'auth':shell?'studio':'other';
    if(landing) renderCollection();
    syncMotion();
    const disposers = [];
    if(landing){signatureMotion=mountSignatureMotion(app,{motionAllowed});disposers.push(()=>signatureMotion?.destroy());}
    if('IntersectionObserver' in window && motionAllowed()) {
      const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('sf-revealed');observer.unobserve(entry.target);}
      }), {threshold:0.08});
      app.querySelectorAll('[data-sf-reveal]').forEach(element=>{element.classList.add('sf-will-reveal');observer.observe(element);});
      disposers.push(()=>observer.disconnect());
    }
    const stage = app.querySelector('[data-sf-depth]');
    if(stage && fine.matches) {
      let frame = 0, x=0, y=0;
      const move = event => {
        if(!motionAllowed())return;
        const rect=stage.getBoundingClientRect();
        x=(event.clientX-rect.left)/rect.width-.5;y=(event.clientY-rect.top)/rect.height-.5;
        if(!frame)frame=requestAnimationFrame(()=>{frame=0;stage.style.setProperty('--pointer-x',x.toFixed(3));stage.style.setProperty('--pointer-y',y.toFixed(3));});
      };
      const leave = () => {cancelAnimationFrame(frame);frame=0;stage.style.setProperty('--pointer-x','0');stage.style.setProperty('--pointer-y','0');};
      stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);
      disposers.push(()=>{stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);cancelAnimationFrame(frame);});
    }
    const targetId=location.hash.slice(1);
    if(landing&&['features','templates','pricing'].includes(targetId))requestAnimationFrame(()=>document.getElementById(targetId)?.scrollIntoView({behavior:'instant'}));
    cleanup=()=>disposers.forEach(dispose=>dispose());
  };
  app.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(button?.hasAttribute('data-sf-motion')) {motionOff=!motionOff;localStorage.setItem('sitofolio-interface-motion',motionOff?'off':'on');syncMotion();}
    if(button?.dataset.sfMood) {
      app.querySelectorAll('[data-sf-mood]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      signatureMotion?.setLook(button.dataset.sfMood);
      app.querySelector('#sf-mood-status').textContent=catalog.find(t=>t.id===button.dataset.sfMood).name+' composition — the same creator and work';
    }
    if(button?.hasAttribute('data-sf-step')) {
      app.querySelectorAll('[data-sf-step]').forEach(item=>{const active=item===button;item.setAttribute('aria-pressed',String(active));item.querySelector('i').textContent=active?'−':'+';});
      app.querySelectorAll('[data-sf-process-panel]').forEach(panel=>panel.hidden=panel.dataset.sfProcessPanel!==button.dataset.sfStep);
    }
    if(button?.dataset.sfFamily) {
      family=button.dataset.sfFamily;
      app.querySelectorAll('[data-sf-family]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      renderCollection();
    }
    if(button?.hasAttribute('data-sf-all-templates')) {expanded=!expanded;renderCollection();}
    const link=event.target.closest('a[href^="#"]');
    if(link) {
      const id=link.getAttribute('href').slice(1);
      const target=id&&document.getElementById(id);
      if(target) {event.preventDefault();target.scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});if(id==='sf-main')target.focus({preventScroll:true});}
    }
  });
  reduced.addEventListener('change',syncMotion);
  new MutationObserver(mount).observe(app,{childList:true});
  mount();
}
