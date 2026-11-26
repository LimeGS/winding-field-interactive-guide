// Run a page's commands with a fake `docker` that records each call; nothing is pulled or run.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export function runWithFakeDocker(script, prepare = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'guide-commands-'));
  const bin = join(root, 'bin'), cwd = join(root, 'work dir');
  mkdirSync(bin); mkdirSync(cwd);
  writeFileSync(join(bin, 'docker'), '#!/bin/sh\nfor a in "$@"; do printf "%s\\n" "$a"; done\nprintf "END\\n"\n');
  chmodSync(join(bin, 'docker'), 0o755);
  prepare(cwd);
  try {
    const result = spawnSync('/bin/sh', ['-c', script], {cwd, encoding: 'utf8', env: {...process.env, PATH: `${bin}:${process.env.PATH}`}});
    assert.equal(result.status, 0, result.stderr);
    const calls = result.stdout.trim().split('END').map(s => s.trim().split('\n')).filter(s => s[0]);
    return {calls, cwd};
  } finally { rmSync(root, {recursive: true, force: true}); }
}

// Split one recorded `docker run` into its options, image and the command given to the image.
export function splitRun(call, image) {
  assert.equal(call[0], 'run');
  const at = call.indexOf(image);
  assert(at > 0, `image ${image} not in ${call.join(' ')}`);
  return {options: call.slice(1, at), args: call.slice(at + 1)};
}
