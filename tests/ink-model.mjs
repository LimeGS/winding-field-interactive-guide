import assert from 'node:assert/strict';
import {makeFragment,exampleMask,collectLabels,InkNetwork,random,paintMask} from '../dist/ink-model.js';
const train=makeFragment(17),test=makeFragment(83),mask=exampleMask(train),labels=collectLabels(mask),rng=random(12),model=new InkNetwork();
assert(labels.ink.length>20&&labels.background.length>20);
assert(mask.some(x=>x===-1));
const initial=model.loss(train.features,labels);
for(let i=0;i<120;i++)model.train(train.features,labels,rng);
const final=model.loss(train.features,labels),savedWeights=Array.from(model.weights),prediction=model.predict(test);
assert.deepEqual(Array.from(model.weights),savedWeights,"Inference must not update weights.");
let ink=0,bg=0,ni=0,nb=0;
for(let i=0;i<prediction.length;i++)if(test.valid[i]){if(test.truth[i]>.95){ink+=prediction[i];ni++;}else if(test.truth[i]===0){bg+=prediction[i];nb++;}}
assert(final<initial*.45,`${initial} -> ${final}`);
assert(ink/ni>bg/nb+.45,`New-fragment separation: ${ink/ni} vs ${bg/nb}`);
assert(model.weights.every(Number.isFinite));
const reversed=new InkNetwork(),reverseRandom=random(12);
for(let i=0;i<120;i++)reversed.train(train.features,{ink:labels.background,background:labels.ink},reverseRandom);
assert(reversed.forward(test.features,test.truth.findIndex(x=>x>.95)).probability<.2,'Predictions must follow the supplied labels, even when labels are wrong.');
assert.throws(()=>model.train(train.features,{ink:[],background:labels.background},rng));
const drawn=new Int8Array(mask.length).fill(-1);
paintMask(drawn,train,{x:30,y:50},{x:80,y:50},3,1);
assert.equal(drawn[50*train.w+55],1);
paintMask(drawn,train,{x:55,y:50},{x:55,y:50},2,-1);
assert.equal(drawn[50*train.w+55],-1);
assert.equal(drawn[0],-1);
console.log({initialLoss:initial,finalLoss:final,newFragmentInk:ink/ni,newFragmentBackground:bg/nb});
console.log('Passed: learning from sparse annotations, prediction on a separate fragment, class validation, continuous brush, erasing, and fragment boundaries.');

const high=makeFragment(17,3);assert.equal(high.w,train.w*3);assert.equal(high.h,train.h*3);for(let y=0;y<train.h;y+=7)for(let x=0;x<train.w;x+=7)assert.equal(high.truth[y*3*high.w+x*3],train.truth[y*train.w+x]);
console.log('Passed: high-resolution reference stays aligned with model coordinates.');
