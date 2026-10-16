/* Shared prototype rules: browser + Node verification, no services or side effects. */
(function(root){
  const families={
    Minimal:{hero:['Editorial','Split'],work:['Grid','Stacked'],about:['Statement','Credentials'],contact:['Invitation','Split'],density:'Spacious'},
    Editorial:{hero:['Editorial','Split','Visual'],work:['Grid','Alternating','Stacked'],about:['Statement','Portrait','Credentials'],contact:['Invitation','Split','Card'],density:'Balanced'},
    Bold:{hero:['Statement','Visual','Split'],work:['Alternating','Stacked','Grid'],about:['Statement','Portrait'],contact:['Invitation','Card'],density:'Compact'},
    Cinematic:{hero:['Visual','Statement','Split'],work:['Stacked','Horizontal'],about:['Portrait','Statement'],contact:['Invitation','Card'],density:'Spacious'},
    Gallery:{hero:['Visual','Split','Editorial'],work:['Masonry','Grid','Stacked'],about:['Portrait','Credentials'],contact:['Split','Invitation'],density:'Compact'},
    'Clean Professional':{hero:['Split','Editorial'],work:['Grid','Stacked'],about:['Credentials','Portrait'],contact:['Split','Card'],density:'Balanced'}
  };
  const sections={
    Hero:{key:'hero',variants:['Editorial','Split','Visual','Statement'],title:'Thoughtful design.\nLasting impressions.',description:'',items:[]},
    'Selected Work':{key:'work',variants:['Grid','Stacked','Masonry','Horizontal','Alternating'],title:'Selected work',description:'A few recent collaborations.',items:[]},
    About:{key:'about',variants:['Statement','Portrait','Credentials'],title:'A little perspective.',description:'',items:[]},
    'Services / Skills':{key:'services',variants:['List','Tiles','Index'],title:'Where I can help.',description:'From a first conversation to the final detail.',items:[{title:'Brand identity',detail:'Strategy, visual identity, and the guidelines that bring it together.'},{title:'Digital experiences',detail:'Thoughtful websites and interfaces, designed around people.'},{title:'Art direction',detail:'One clear point of view, across every touchpoint.'}]},
    Experience:{key:'experience',variants:['Timeline','Split'],title:'The path so far.',description:'Independent thinking. Shared experience.',items:[{title:'Independent designer',detail:'Brand & digital design',meta:'2022 — Present'},{title:'Senior designer · Studio North',detail:'Identity systems and digital experiences',meta:'2019 — 2022'}]},
    Testimonials:{key:'testimonials',variants:['Pull quote','Wall'],title:'In good company.',description:'',items:[{title:'“Alex has a rare ability to find the simple, powerful idea at the heart of a brand.”',detail:'Camille Laurent',meta:'Founder, Maison Olive · sample testimonial'}]},
    Clients:{key:'clients',variants:['Wordmarks','Index'],title:'Built together.',description:'A few of the people I’ve worked with.',items:[{title:'Maison Olive',detail:'Food & drink'},{title:'Forma Studio',detail:'Architecture'},{title:'Offscript',detail:'Culture & publishing'}]},
    Contact:{key:'contact',variants:['Invitation','Split','Card'],title:'Let’s make it matter.',description:'Have something in mind? I’d love to hear about it.',items:[]},
    Footer:{key:'footer',variants:['Minimal','Extended'],title:'Thanks for stopping by.',description:'',items:[]}
  };
  function allowed(type,family){const def=sections[type];return families[family]?.[def?.key]||def?.variants||['List']}
  function normalize(state){
    state.profile.skills??=['Brand strategy','Visual identity','Art direction'];state.profile.tools??=['Figma','Illustrator','InDesign'];state.profile.socials??=[];state.profile.photo??='';state.profile.cv??=null;
    state.profile.availability??=true;state.pageMode??={About:'Section on Home',Contact:'Section on Home'};state.assets??=[];
    for(const s of state.sections){const def=sections[s.type];if(!def)continue;s.variant??=(s.type==='Hero'?state.heroVariant:s.type==='Selected Work'?state.workVariant:null)||allowed(s.type,state.style)[0];s.content??={title:def.title,description:def.description,items:JSON.parse(JSON.stringify(def.items))};s.options??={columns:2,ratio:'Landscape',gap:'Balanced',hover:'Gentle zoom',cta:'View selected work',showCta:false,showAvailability:true,align:'Left',treatment:'Sharp'};s.content.items??=[]}
    return state;
  }
  function structure(type){return type==='UI/UX'?['Project Intro','Challenge','Research','Process','Solution / Outcome','Device / Mockup Showcase']:['Motion','Video'].includes(type)?['Project Intro','Concept','Image Grid / Gallery','Video Embed','Credits / Team']:type==='Photography'?['Project Intro','Image Grid / Gallery','Credits / Team']:['Project Intro','Challenge','Concept','Big Image','Solution / Outcome']}
  function plan(project,idFactory){const notes=project.notes.trim();const prompts={Challenge:'What problem did the project need to solve?',Research:'What did you learn from people, competitors, or context?',Process:'What did you explore, test, and refine?',Concept:'What is the central idea, and why does it fit?', 'Solution / Outcome':'Describe the final work. Add outcomes only if you have evidence.', 'Credits / Team':'Who contributed? Add names and roles with permission.'};return structure(project.type).map(type=>({id:idFactory(),type,visible:true,text:type==='Project Intro'?notes:prompts[type]||'',image:/Image|Mockup/.test(type)?project.cover:undefined,draft:true}))}
  function applyPlan(existing,plan,mode){if(mode==='append')return existing.concat(plan);if(mode==='replace')return plan;if(mode==='missing'){const types=new Set(existing.map(b=>b.type));return existing.concat(plan.filter(b=>!types.has(b.type)))}throw new Error('Unknown structure mode')}
  function safeUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}}
  function videoEmbed(value){try{const u=new URL(value);if(u.protocol!=='https:')return '';let id;if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];if(u.hostname==='youtu.be')id=u.pathname.slice(1);if(id&&/^[\w-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;const v=u.hostname==='vimeo.com'?u.pathname.match(/^\/(\d+)$/)?.[1]:null;return v?'https://player.vimeo.com/video/'+v:''}catch{return ''}}
  const api={families,sections,allowed,normalize,structure,plan,applyPlan,safeUrl,videoEmbed};if(typeof module!=='undefined')module.exports=api;else root.StudioModel=api;
})(typeof window!=='undefined'?window:globalThis);
