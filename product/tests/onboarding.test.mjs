import test from 'node:test';
import assert from 'node:assert/strict';
import {setupError,setupStep,updateSetup,completeSetup,recommendedTemplateIds,setupMarkup} from '../web/onboarding.js';
import {templates,personalityVisual} from '../web/templates.js';
const empty=()=>({profile:{name:'Test designer',title:'',bio:'',location:'',photo:''},onboarding:{setupStep:1},headline:'Your work. Your point of view.',projects:[]});
const ready=()=>{let w=updateSetup(empty(),1,{role:'Motion Designer',goal:'Showcase my work'});w=updateSetup(w,2,{personality:['Cinematic','Minimal']});return updateSetup(w,3,{name:'Designer Alex',title:'Motion designer',bio:'',location:''});};
test('setup requires explicit role, goal, one or two unique personalities, name and title',()=>{
 const w=empty();assert.match(setupError(w,1),/what you do/);w.onboarding.role='Photographer';assert.match(setupError(w,1),/goal/);w.onboarding.goal='Showcase my work';assert.equal(setupError(w,1),'');
 for(const personality of [[],['Minimal','Bold','Editorial'],['Minimal','Minimal'],['unknown'],null]){w.onboarding.personality=personality;assert.match(setupError(w,2),/one or two/)}
 w.onboarding.personality=['Minimal','Bold'];assert.equal(setupError(w,2),'');assert.match(setupError(w,3),/professional title/);w.profile.title='Designer';w.profile.name=' ';assert.match(setupError(w,3),/name/);w.profile.name='a'.repeat(101);assert.match(setupError(w,3),/100/);
});
test('setup cannot jump past missing required choices and resumes only valid bounded steps',()=>{
 assert.equal(setupStep(empty(),5),1);let w=updateSetup(empty(),1,{role:'Photographer',goal:'Get hired'});assert.equal(setupStep(w,5),2);w=updateSetup(w,2,{personality:['Clean Professional']});assert.equal(setupStep(w,5),3);w=ready();assert.equal(setupStep(w,5),5);assert.equal(setupStep(w,-1),1);assert.equal(setupStep(w,2.5),2);assert.equal(setupStep(w,Infinity),1);assert.equal(setupStep(w,100),5);assert.equal(setupStep(w,undefined),4);
});
test('setup saves cloned progress, permits optional fields and preserves existing work and headlines',()=>{
 const original=empty();original.projects=[{id:'owner-project',blocks:[{image:'/media/owned-image',text:'Original story'}]}];original.headline='My own headline';const before=structuredClone(original);
 const next=updateSetup(original,1,{role:'Brand Designer',goal:'Get freelance clients'});assert.deepEqual(original,before);assert.equal(next.onboarding.setupStep,2);assert.deepEqual(next.projects,original.projects);assert.equal(next.headline,'My own headline');
 const partial=updateSetup(next,3,{name:'Alex',title:'',bio:'',location:''},false);assert.equal(partial.onboarding.setupStep,3);assert.equal(partial.profile.title,'');assert.throws(()=>updateSetup(partial,3,{name:'Alex',title:''}),/professional title/);assert.equal(ready().profile.photo,'');assert.equal(ready().profile.bio,'');
});
test('recommendations are exactly three unique styles and react to profession and personality',()=>{
 const w=ready();const ids=recommendedTemplateIds(w,templates);assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);assert.equal(new Set(ids.map(id=>templates.find(t=>t.id===id).family)).size,3);assert.equal(templates.find(t=>t.id===ids[0]).family,'Cinematic');
 const photographer=empty();photographer.onboarding={role:'Photographer',goal:'Showcase my work',personality:[]};assert.equal(templates.find(t=>t.id===recommendedTemplateIds(photographer,templates)[0]).family,'Gallery');
 photographer.onboarding={role:'Other',goal:'Showcase my work',personality:['Experimental']};assert.ok(['cutpaper','pencil','gridline'].includes(recommendedTemplateIds(photographer,templates)[0]));assert.deepEqual(recommendedTemplateIds(w,templates),ids);
});
test('completing setup needs a chosen template and never injects another person or demo projects',()=>{
 const w=ready();assert.throws(()=>completeSetup(w),/Choose a template/);w.onboarding.templateChosen=true;const next=completeSetup(w);assert.equal(next.onboarding.complete,true);assert.equal(next.onboarding.needsSetup,false);assert.equal(w.onboarding.complete,false);assert.equal(next.profile.name,'Designer Alex');assert.equal(next.profile.photo,'');assert.deepEqual(next.projects,[]);
});
test('setup screens escape profile content, show visual choices and keep project import optional',()=>{
 const w=ready();w.profile.name='<script>alert(1)</script>';const profile=setupMarkup(w,3,templates,personalityVisual);assert.ok(!profile.includes('<script>'));assert.ok(profile.includes('&lt;script&gt;'));assert.ok(profile.includes('name="title"'));assert.ok(!profile.includes('name="bio" required'));
 const choices=setupMarkup(w,2,templates,personalityVisual);assert.equal((choices.match(/type="checkbox"/g)||[]).length,6);assert.ok(choices.includes('mood-art'));assert.ok(choices.includes('aria-label="Clean"'));
 const optional=setupMarkup(w,4,templates,personalityVisual);assert.ok(optional.includes('Skip for now'));assert.ok(optional.includes('href="#imports"'));const recommendations=setupMarkup(w,5,templates,personalityVisual);assert.equal((recommendations.match(/data-action="setup-template:/g)||[]).length,3);assert.ok(recommendations.includes('View all 20 templates'));assert.ok(recommendations.includes('Your portfolio keeps your own name and projects.'));
});
