import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {sdkCommand,SDK_IMAGE,SDK_VERSION,INK_FUNCTION} from '../dist/sdk-workbench.js';
import {runWithFakeDocker,splitRun} from './fake-docker.mjs';

assert.match(SDK_VERSION,/^\d+\.\d+\.\d+$/,'pin the image to a stable release');
assert.equal(SDK_IMAGE,`ghcr.io/limegs/ink-sdk:${SDK_VERSION}`,'the default (GPU) image');

// Each tab after Install & check runs in the same terminal, so ink() is already defined.
function inkCalls(command,prepare){
  const {calls,cwd}=runWithFakeDocker(INK_FUNCTION+'\n'+command,prepare);
  return calls.map(call=>{
    const {options,args}=splitRun(call,SDK_IMAGE);
    // As the reader, in the folder they run from, with the weights in a named volume.
    assert.deepEqual(options,['--rm','--gpus','all','--user',`${process.getuid()}:${process.getgid()}`,'-v',`${cwd}:/work`,'-v','ink-sdk-models:/models']);
    return args;
  });
}
const value=(args,flag)=>args[args.indexOf(flag)+1];

const setup=sdkCommand('setup');
assert(setup.startsWith('# Once per terminal')&&setup.includes(INK_FUNCTION));
assert.deepEqual(inkCalls(setup.replace(INK_FUNCTION,'')),[['fetch','--profile','ink_9um@reader-v3'],['doctor']]);

const [plan]=inkCalls(sdkCommand('compare','plan'));
const run=inkCalls(sdkCommand('compare','run'));
assert.deepEqual(run[0],['fetch'],'running every profile needs every profile’s weights');
assert.equal(plan[0],'battery');assert(plan.includes('--dry-run'));assert(!run[1].includes('--dry-run'));
for(const x of [plan,run[1]]){assert.equal(value(x,'--voxel-um'),'9.6');assert.equal(value(x,'--surface-volume'),'runs/paris4-ink/render');assert(!x.includes('--profile'));assert.equal(value(x,'--centres'),'0');}
assert.deepEqual(plan.filter(x=>x!=='--dry-run'),run[1]);
console.log('Passed: pinned image, ink() runs as the reader in this folder, setup, comparison flags and plan/run toggle. No model inference or download executed.');

// The handoff must resolve a real exported tile, including paths with spaces.
const tile='exports/paris4-W-60/level-0000/render/tile with space/tifxyz';
const [copy,infer]=inkCalls(sdkCommand('mesh'),cwd=>{mkdirSync(join(cwd,tile),{recursive:true});writeFileSync(join(cwd,tile,'meta.json'),'{}');});
assert.deepEqual(copy,['ct-copy','--tifxyz',tile,'--out','data/ct.zarr']);
assert.equal(infer[0],'infer');assert.equal(value(infer,'--tifxyz'),tile);
assert.equal(value(infer,'--ct'),'data/ct.zarr');
assert.equal(value(infer,'--profile'),'ink_9um@reader-v3');
assert.equal(value(infer,'--out'),'runs/paris4-ink');
// The image supplies the renderer, VILLA and its interpreter; the page must not.
for(const flag of ['--renderer','--villa','--python'])assert(!infer.includes(flag),flag);
console.log('Passed: mesh-to-ink handoff copies only the tile’s CT and infers on the actual exported tile, with space-safe quoting.');
