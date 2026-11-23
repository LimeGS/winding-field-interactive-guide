// Pinned to the revisions these commands were run with, end to end, on a CPU-only Linux machine.
const SDK_REVISION = '81749a9c090764c3254ffd89890f15ab64866a66';
const VILLA_REVISION = '3ea17f54a9b3d5fd1aaf73e1d2c8386dbaa9f30e';
const VILLA_PYTHON = 'villa/ink-detection/.venv/bin/python';
export function sdkCommand(tab='mesh',action='plan') {
  if(tab==='setup')return [
    '# ink-sdk and every model’s weights',
    'git clone https://github.com/LimeGS/ink-sdk.git',
    `git -C ink-sdk checkout ${SDK_REVISION}`,
    'python3 -m venv ink-sdk/.venv',
    'source ink-sdk/.venv/bin/activate',
    "python -m pip install -e './ink-sdk[all]' uv",
    'ink-sdk fetch',
    '',
    '# VILLA runs the 9 µm models in its own environment',
    'git clone --filter=blob:none --no-checkout \\',
    '  https://github.com/ScrollPrize/villa.git',
    'git -C villa sparse-checkout set vesuvius ink-detection',
    `git -C villa checkout ${VILLA_REVISION}`,
    '(cd villa/ink-detection && uv sync --python 3.12)',
    '',
    '# The renderer, vc_render_tifxyz, from the VC3D AppImage',
    'RELEASE=https://github.com/ScrollPrize/villa/releases/download',
    'VC3D=VC3D-fc25b4d-2026-07-31-linux-x86_64.AppImage',
    'curl -fLO "$RELEASE/vc3d-archive-stable-363877681/$VC3D"',
    'chmod +x "$VC3D" && "./$VC3D" --appimage-extract > /dev/null',
    '',
    'ink-sdk doctor --renderer squashfs-root/AppRun --villa villa'
  ].join('\n');
  if(tab==='mesh')return [
    '# 1. Find the exported surface tile',
    'TILE="$(dirname "$(find exports/paris4-W-60/level-0000/render \\',
    "  -type f -path '*/tifxyz/meta.json' -print -quit)\")\"",
    '',
    '# 2. Copy only the CT chunks around it (about 0.2 GB)',
    'python sparse-ct.py "$TILE" data/paris4-9.6um.zarr',
    '',
    '# 3. Render its depth stack and run the ink model',
    'ink-sdk infer \\',
    '  --profile ink_9um@reader-v3 \\',
    '  --tifxyz "$TILE" \\',
    '  --ct data/paris4-9.6um.zarr --voxel-um 9.6 \\',
    '  --renderer squashfs-root/AppRun --villa villa \\',
    `  --python ${VILLA_PYTHON} \\`,
    '  --out runs/paris4-ink'
  ].join('\n');
  const command=['ink-sdk battery \\','  --surface-volume runs/paris4-ink/render \\','  --voxel-um 9.6 \\','  --centres 0 \\','  --steps 1 \\','  --villa villa \\',`  --python ${VILLA_PYTHON} \\`,'  --out runs/ink-comparison'].join('\n');
  return action==='plan'?command+' \\\n  --dry-run':command;
}
export function initSdkWorkbench() {
 const root=document.getElementById('ink-sdk-guide');if(!root)return;
 let tab='mesh';const tabs=[...root.querySelectorAll('[data-sdk-tab]')],action=root.querySelector('#sdk-action');
 function render(){
  tabs.forEach(b=>{const selected=b.dataset.sdkTab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  root.querySelector('#sdk-panel').setAttribute('aria-labelledby','sdk-tab-'+tab);
  root.querySelector('#sdk-heading').textContent=tab==='mesh'?'From the exported mesh to an ink map.':tab==='setup'?'Install ink-sdk and check your models.':'Compare ink models on your scroll.';
  root.querySelector('#sdk-description').textContent=tab==='mesh'?'Run from the same working directory as the geometry commands, after Install & check. Step 1 finds the first exported tile, step 2 copies the CT around it, and step 3 renders its depth stack and runs Reader V3 in both depth directions.':tab==='setup'?'Run these once, in the same working directory as the geometry commands. They install ink-sdk and the model weights, VILLA’s inference environment and the renderer, then check that ink-sdk finds them all.':'Run “From this mesh” first, then compare every compatible profile on its saved 9.6 µm depth stack. Use separately prepared inputs for other resolutions.';
  root.querySelector('#sdk-fields').hidden=tab!=='compare';
  root.querySelector('#sdk-command').textContent=sdkCommand(tab,action.value);
  const facts=tab==='mesh'?['ink-sdk renders from local CT, but the whole 9.6 µm level is about 1.3 TB. Step 2 copies only the chunks around this tile, keeping the original indices so the tile’s coordinates still match. Save the script above in your working directory.','--python points at VILLA’s own environment: VILLA needs zarr 2 and ink-sdk needs zarr 3, so they cannot share one.','Tested end to end on a 4-core machine without a GPU: copying the CT, rendering and inference for one 1024 × 1024 tile took under 3 minutes.','Reader V3 is a good first choice here. Newer ink-sdk releases add Argus V3, fine-tuned on native scans. Check each model card for its training scrolls before calling a map of this scroll an out-of-sample test.']:tab==='setup'?['Pinned to the revisions these commands were tested with. fetch downloads every model’s weights, about 7 GB; doctor checks them, VILLA and the renderer.','Needs git, curl, python3-venv and Python 3.11 or newer. uv builds VILLA’s environment from its lock file. doctor reports villa-import as missing: expected, since the model runs in VILLA’s environment through --python.']:action.value==='plan'?['Plan comparison lists planned runs and skipped profiles without inference. On this depth stack: 9 compatible models, 10 skipped for scale.','The saved stack has 17 slices at 9.6 µm. Centre 0 keeps the window within it; incompatible profiles are reported and skipped.']:['Review runs/ink-comparison/index.html and the run receipts.','Compare the signal with CT and reserved labels; the gallery does not choose the best model for you.'];
  root.querySelector('#sdk-files').hidden=tab!=='mesh';
  root.querySelector('#sdk-facts').replaceChildren(...facts.map(text=>{const e=document.createElement('div');e.className='cli-fact';e.textContent=text;return e;}));
 }
 tabs.forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.sdkTab;render();}));
 root.querySelector('.cli-tabs').addEventListener('keydown',event=>{const current=tabs.indexOf(document.activeElement);if(current<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tab=tabs[next].dataset.sdkTab;render();tabs[next].focus();});
 action.addEventListener('change',render);render();
}
