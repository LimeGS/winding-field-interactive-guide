import assert from 'node:assert/strict';
import {makeFragment} from '../dist/ink-model.js';
import {primerPixels} from '../dist/ink-primer.js';
const fragment=makeFragment(17);
const ct0=primerPixels(fragment,{depth:0}),ct8=primerPixels(fragment,{depth:8});
assert.equal(ct0.length,fragment.w*fragment.h*4);
assert.notDeepEqual(ct0,ct8,'scrubbing depth must change the synthetic CT slice');
const mask=primerPixels(fragment,{view:'mask'}),labels=primerPixels(fragment,{view:'labels'});
let trustedInk=0,trustedBackground=0,ignoredInk=0;
for(let i=0;i<fragment.valid.length;i++){
 if(!fragment.valid[i])continue;
 const trusted=mask[i*4]===181;
 if(trusted&&fragment.truth[i]>.4){trustedInk++;assert.equal(labels[i*4],255);}
 if(trusted&&fragment.truth[i]<=.4){trustedBackground++;assert.equal(labels[i*4],32);}
 if(!trusted&&fragment.truth[i]>.4){ignoredInk++;assert.equal(labels[i*4],57,'unlabelled ink must remain ignored');}
 assert.equal(labels[i*4+3],255);
}
assert(trustedInk>0&&trustedBackground>0&&ignoredInk>0);
const low=primerPixels(fragment,{view:'map',cutoff:.1}),high=primerPixels(fragment,{view:'map',cutoff:.8});
let removed=0;for(let i=0;i<fragment.valid.length;i++){assert(high[i*4]<=low[i*4]);if(high[i*4]<low[i*4])removed++;}
assert(removed>0,'the cutoff changes the display');
assert.deepEqual(ct8,primerPixels(fragment,{depth:8}),'display changes must leave the CT untouched');
console.log('Passed: depth changes, trusted ink and background, ignored unlabelled ink, display-only cutoff, and unchanged CT. No model inference is claimed by the schematic.');
