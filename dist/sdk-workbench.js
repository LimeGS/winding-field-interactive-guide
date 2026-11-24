// The official CPU image, pinned to the build these commands were run with end to end.
export const SDK_REVISION = 'PENDING_SDK_REVISION';
export const SDK_IMAGE = `ghcr.io/limegs/ink-sdk:sha-${SDK_REVISION.slice(0, 7)}-cpu`;
// One line per terminal: ink-sdk, VILLA and the renderer, run as you in this folder.
export const INK_FUNCTION = `ink() { docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/work" \\\n  -v ink-sdk-models:/models ${SDK_IMAGE} "$@"; }`;
export function sdkCommand(tab='mesh',action='plan') {
  if(tab==='setup')return [
    '# Once per terminal: the official ink-sdk image',
    INK_FUNCTION,
    '',
    '# Reader V3’s weights, kept in the ink-sdk-models volume',
    'ink fetch --profile ink_9um@reader-v3',
    'ink doctor'
  ].join('\n');
  if(tab==='mesh')return [
    '# 1. Find the first exported surface tile',
    'TILE="$(dirname "$(find exports/paris4-W-60/level-0000/render \\',
    "  -type f -path '*/tifxyz/meta.json' -print -quit)\")\"",
    '',
    '# 2. Copy only the CT around it (about 0.2 GB)',
    'ink ct-copy --tifxyz "$TILE" --out data/ct.zarr',
    '',
    '# 3. Render its depth stack and run the ink model',
    'ink infer --profile ink_9um@reader-v3 \\',
    '  --tifxyz "$TILE" --ct data/ct.zarr \\',
    '  --out runs/paris4-ink'
  ].join('\n');
  const command=['ink battery \\','  --surface-volume runs/paris4-ink/render \\','  --voxel-um 9.6 \\','  --centres 0 \\','  --steps 1 \\','  --out runs/ink-comparison'].join('\n');
  return action==='plan'?command+' \\\n  --dry-run':'# Every model’s weights (about 7 GB), once\nink fetch\n\n'+command;
}
export function initSdkWorkbench() {
 const root=document.getElementById('ink-sdk-guide');if(!root)return;
 let tab='mesh';const tabs=[...root.querySelectorAll('[data-sdk-tab]')],action=root.querySelector('#sdk-action');
 function render(){
  tabs.forEach(b=>{const selected=b.dataset.sdkTab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  root.querySelector('#sdk-panel').setAttribute('aria-labelledby','sdk-tab-'+tab);
  root.querySelector('#sdk-heading').textContent=tab==='mesh'?'From the exported mesh to an ink map.':tab==='setup'?'Install ink-sdk and check your models.':'Compare ink models on your scroll.';
  root.querySelector('#sdk-description').textContent=tab==='mesh'?'Run in the same folder and terminal as the geometry commands, after Install & check. Step 1 finds the first exported tile, step 2 copies the CT around it, and step 3 renders its depth stack and runs Reader V3 in both depth directions.':tab==='setup'?'Run these in the same folder as the geometry commands. The image already holds ink-sdk, VILLA’s inference code and the renderer; fetch downloads Reader V3’s weights and doctor checks everything.':'Run “From this mesh” first, then compare every compatible profile on its saved 9.6 µm depth stack. Use separately prepared inputs for other resolutions.';
  root.querySelector('#sdk-fields').hidden=tab!=='compare';
  root.querySelector('#sdk-command').textContent=sdkCommand(tab,action.value);
  const facts=tab==='mesh'?['ink-sdk renders from local CT, but the whole 9.6 µm level is about 1.3 TB. ct-copy copies only the chunks near this tile, keeping the original indices so the tile’s coordinates still match; it reads the scan’s address from the tile itself.','Tested end to end with these images on a 4-core machine without a GPU: copying the CT took 23 s and rendering plus inference 1 minute for one 1024 × 1024 tile.','Reader V3 is a good first choice here. Newer ink-sdk releases add Argus V3, fine-tuned on native scans. Check each model card for its training scrolls before calling a map of this scroll an out-of-sample test.']:tab==='setup'?['Needs Docker on Linux x86-64, or Docker Desktop. The image is about 1.4 GB to download; it is pinned to the build these commands were tested with.','The weights live in a Docker volume, so later terminals reuse them. doctor reports CUDA as missing on machines without an NVIDIA GPU: expected, everything here runs on CPU.']:action.value==='plan'?['Plan comparison lists planned runs and skipped profiles without inference. On this depth stack: 9 compatible models, 10 skipped for scale.','The saved stack has 17 slices at 9.6 µm. Centre 0 keeps the window within it; incompatible profiles are reported and skipped.']:['Review runs/ink-comparison/index.html and the run receipts.','Compare the signal with CT and reserved labels; the gallery does not choose the best model for you.'];
  
  root.querySelector('#sdk-facts').replaceChildren(...facts.map(text=>{const e=document.createElement('div');e.className='cli-fact';e.textContent=text;return e;}));
 }
 tabs.forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.sdkTab;render();}));
 root.querySelector('.cli-tabs').addEventListener('keydown',event=>{const current=tabs.indexOf(document.activeElement);if(current<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tab=tabs[next].dataset.sdkTab;render();tabs[next].focus();});
 action.addEventListener('change',render);render();
}
