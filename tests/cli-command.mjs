import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {cliCommand,CLI_IMAGE,CLI_VERSION} from '../dist/cli-lab.js';
import {runWithFakeDocker,splitRun} from './fake-docker.mjs';
// Run the page's commands with a recording docker; never execute the research CLI or download CT.
function commandsFor(options) {
 const {calls,cwd}=runWithFakeDocker(cliCommand(options));
 return calls.map(call=>{
  const {options:o,args}=splitRun(call,CLI_IMAGE);
  // As the reader, in the folder they run from, with nothing else mounted.
  assert.deepEqual(o,['--rm','--init','--gpus','all','--user',`${process.getuid()}:${process.getgid()}`,'-v',`${cwd}:/outputs`]);
  return args;
 });
}
assert.match(CLI_VERSION,/^\d+\.\d+\.\d+$/,'pin the image to a stable release');
assert.equal(CLI_VERSION.split('.')[0],'2','commands follow the 2.x flags');
assert.equal(CLI_IMAGE,`ghcr.io/limegs/winding-field-cli:${CLI_VERSION}`,'the default (GPU) image');
const [mesh,flatten]=commandsFor();
const value=(args,flag)=>args[args.indexOf(flag)+1];
assert.deepEqual(mesh,['prepared','mesh','--config','paris4-remote.json','--output','runs/paris4-W-60']);
assert.equal(flatten[0],'export-sheets');
assert.equal(value(flatten,'--mesh-bundle'),value(mesh,'--output'));
assert.equal(value(flatten,'--flattening-solver'),'lscm');
assert.equal(value(flatten,'--scope'),'sheet');
assert.equal(value(flatten,'--flattening-config'),'paris4-flattening.json');
assert.match(value(flatten,'--source'),/PHercParis4\/volumes\/20260411134726-2\.400um/);
assert.match(value(flatten,'--source'),/\.zarr\/2$/);
assert.equal(value(flatten,'--voxel-um'),'9.6');
assert.equal(value(flatten,'--level'),'0');
// 2.0 always writes TIFXYZ and rejects the removed 1.x flags.
for(const flag of ['--export-tifxyz','--no-export-tifxyz'])assert(!flatten.includes(flag),flag);
assert.equal(value(flatten,'--ct-workers'),'4');assert.equal(value(flatten,'--raster-workers'),'4');
assert(!flatten.includes('--levels'),'mesh bundle already binds the raw levels');
assert.deepEqual(commandsFor({action:'mesh'}),[mesh]);
const config=JSON.parse(readFileSync(new URL('../dist/examples/paris4-remote.json',import.meta.url)));
const output=JSON.parse(readFileSync(new URL('../dist/examples/paris4-flattening.json',import.meta.url)));
assert.equal(config.field.kind,'zarr-v2');
assert.equal(config.field.support_policy,'stored');
assert.match(config.field.url,/\/resolve\/6753c9812ec8c455401da69b4e758769e565e39f\/field.json$/);
assert.deepEqual(config.geometry.shape_zyx,[593,256,256]);
assert.equal(config.geometry.voxel_um*config.geometry.spacing_xyz[0],307.2);
assert.equal(config.levels.length,1);
assert(Math.abs(config.levels[0]/config.geometry.sheet_step+60)<1e-12);
assert.equal(output.output_frame.id,config.geometry.frame);
assert.equal(output.output_frame.voxel_um,9.6);
assert.equal(output.pitch_um,Number(value(flatten,'--voxel-um')));
assert.equal(config.geometry.voxel_um,Number(value(flatten,'--voxel-um')));
const demo=commandsFor({tab:'demo'});
assert.equal(demo[0][0],'doctor');assert.deepEqual(demo[1],['demo','--output','runs/demo']);
console.log('Passed: extraction/flatten command arguments and shell quoting, immutable field config, W calibration, field/CT/output units, mesh-only action and synthetic demo.');
