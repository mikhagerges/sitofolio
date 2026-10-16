import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sequencePose,signatureWorks} from '../web/signature-motion.js';

test('each artwork gets its own centered, readable stop',()=>{
  for(const [progress,index] of [[0,0],[.5,1],[1,2]]){
    const pose=sequencePose(progress),front=pose.cards[index];
    assert.equal(pose.active,index);assert.equal(front.x,0);assert.equal(front.o,1);
    assert.ok(front.s>=.85);assert.ok(Math.abs(front.r)<=7);
  }
});

test('scroll poses remain finite and visible over the entire journey',()=>{
  for(let step=0;step<=200;step++){
    const pose=sequencePose(step/200);
    assert.ok(Number.isInteger(pose.active)&&pose.active>=0&&pose.active<signatureWorks.length);
    for(const card of pose.cards){
      assert.ok(Object.values(card).every(Number.isFinite));
      assert.ok(card.s>0&&card.s<=1);assert.ok(card.o>=0&&card.o<=1);
    }
  }
});

test('the handover has no position jump, and overscroll is bounded',()=>{
  const before=sequencePose(.5-.00001),after=sequencePose(.5+.00001);
  before.cards.forEach((card,index)=>Object.keys(card).forEach(key=>assert.ok(Math.abs(card[key]-after.cards[index][key])<.001)));
  assert.deepEqual(sequencePose(-2),sequencePose(0));assert.deepEqual(sequencePose(4),sequencePose(1));
  assert.deepEqual(sequencePose(NaN),sequencePose(0));
});

test('the exhibition uses distinct supplied local artwork and working catalog targets',()=>{
  assert.equal(new Set(signatureWorks.map(work=>work.image)).size,3);
  for(const work of signatureWorks){assert.ok(work.name&&work.alt);assert.match(work.template,/^(noir|solstice|signal)$/);assert.ok(fs.existsSync(new URL('../web'+work.image,import.meta.url)));}
});
