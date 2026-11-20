import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {cliCommand} from '../dist/cli-lab.js';
// Capture shell arguments; never execute the research CLI or download CT.
function commandsFor(options) {
 const script='capture_cli() { printf "%s\\n" "$@"; printf "END\\n"; };\n'+cliCommand(options).replace(/^winding-field /gm,'capture_cli ');
 const cwd=mkdtempSync(join(tmpdir(),'paris4-command-'));
 let result;try {result=spawnSync('/bin/sh',['-c',script],{encoding:'utf8',cwd});} finally {rmSync(cwd,{recursive:true,force:true});}
 assert.equal(result.status,0,result.stderr);
 return result.stdout.trim().split('END').map(s=>s.trim().split('\n')).filter(s=>s[0]);
}
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
assert(flatten.includes('--export-tifxyz'));
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
