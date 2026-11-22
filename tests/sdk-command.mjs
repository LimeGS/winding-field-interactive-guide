import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {sdkCommand} from '../dist/sdk-workbench.js';
function args(action){const r=spawnSync('/bin/sh',['-c','capture_sdk(){ printf "%s\\n" "$@"; };\n'+sdkCommand('compare',action).replace(/^ink-sdk /gm,'capture_sdk ')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim().split('\n');}
const plan=args('plan'),run=args('run');
assert.equal(plan[0],'battery');assert(plan.includes('--dry-run'));assert(!run.includes('--dry-run'));
for(const x of [plan,run]){assert.equal(x[x.indexOf('--voxel-um')+1],'9.6');assert.equal(x[x.indexOf('--surface-volume')+1],'runs/paris4-ink/render');assert(x.includes('--surface-volume'));assert(!x.includes('--profile'));assert.equal(x[x.indexOf('--centres')+1],'0');}
assert.deepEqual(plan.filter(x=>x!=='--dry-run'),run);
const setup=sdkCommand('setup');assert(setup.includes('ink-sdk fetch'));assert(setup.includes('ink-sdk doctor'));assert.equal(spawnSync('/bin/sh',['-n'],{input:setup,encoding:'utf8'}).status,0);
console.log('Passed: SDK comparison flags, default all profiles, plan/run toggle, and installation command syntax. No model inference or installation executed.');
// The linked handoff must resolve a real exported tile, including paths with spaces.
const {mkdtempSync,mkdirSync,writeFileSync,rmSync}=await import('node:fs');
const {tmpdir}=await import('node:os');const {join}=await import('node:path');
const fixture=mkdtempSync(join(tmpdir(),'paris4-handoff-'));
try {
 const tile='exports/paris4-W-60/level-0000/render/tile with space/tifxyz';
 mkdirSync(join(fixture,tile),{recursive:true});writeFileSync(join(fixture,tile,'meta.json'),'{}');
 const command=sdkCommand();
 assert.equal(command.split('\n').filter(s=>s.startsWith('ink-sdk ')).length,1);
 const result=spawnSync('/bin/sh',['-c','capture_sdk(){ printf "%s\\n" "$@"; };\n'+command.replace(/^ink-sdk /gm,'capture_sdk ')],{cwd:fixture,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);const x=result.stdout.trim().split('\n');
 assert.equal(x[0],'infer');assert.equal(x[x.indexOf('--tifxyz')+1],tile);
 assert.equal(x[x.indexOf('--voxel-um')+1],'9.6');
 assert.equal(x[x.indexOf('--profile')+1],'ink_9um@reader-v3');
 assert(x.includes('--renderer')&&x.includes('--villa')&&x.includes('--ct'));
 console.log('Passed: one-command mesh-to-ink handoff, actual exported tile lookup, space-safe quoting, and matching 9.6 µm scale.');
} finally {rmSync(fixture,{recursive:true,force:true});}
