export function sdkCommand(tab='mesh',action='plan') {
  if(tab==='setup')return "git clone https://github.com/LimeGS/ink-sdk.git\ncd ink-sdk\npython3 -m pip install -e '.[all]'\nink-sdk models\nink-sdk fetch\nink-sdk doctor";
  if(tab==='mesh')return `# 1. Find the exported surface tile\nTILE="$(dirname "$(find exports/paris4-W-60/level-0000/render \\\n  -type f -path '*/tifxyz/meta.json' -print -quit)")"\n\n# 2. Render its depth stack and run the ink model\nink-sdk infer \\\n  --profile ink_9um@reader-v3 \\\n  --tifxyz "$TILE" \\\n  --ct /data/paris4-9.6um.zarr --voxel-um 9.6 \\\n  --renderer /path/to/AppRun --villa /path/to/villa \\\n  --out runs/paris4-ink`;
  const command='ink-sdk battery \\\n  --surface-volume runs/paris4-ink/render \\\n  --voxel-um 9.6 \\\n  --centres 0 \\\n  --steps 1 \\\n  --villa /path/to/villa \\\n  --out runs/ink-comparison';
  return action==='plan'?command+' \\\n  --dry-run':command;
}
export function initSdkWorkbench() {
 const root=document.getElementById('ink-sdk-guide');if(!root)return;
 let tab='mesh';const tabs=[...root.querySelectorAll('[data-sdk-tab]')],action=root.querySelector('#sdk-action');
 function render(){
  tabs.forEach(b=>{const selected=b.dataset.sdkTab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  root.querySelector('#sdk-panel').setAttribute('aria-labelledby','sdk-tab-'+tab);
  root.querySelector('#sdk-heading').textContent=tab==='mesh'?'From the exported mesh to an ink map.':tab==='setup'?'Install ink-sdk and check your models.':'Compare ink models on your scroll.';
  root.querySelector('#sdk-description').textContent=tab==='mesh'?'Run from the same working directory as the geometry example. Step 1 finds the first exported TIFXYZ tile. Step 2 renders its depth stack and runs the Reader V3 ink model in both depth directions.':tab==='setup'?'Use Python 3.11 or newer. Install the SDK, list the profiles, fetch model weights and check the environment. Prepare VILLA for the profiles that require it.':'Run “From this mesh” first, then compare every compatible profile on its saved 9.6 µm depth stack. Use separately prepared inputs for other resolutions.';
  root.querySelector('#sdk-fields').hidden=tab!=='compare';
  root.querySelector('#sdk-command').textContent=sdkCommand(tab,action.value);
  const facts=tab==='mesh'?['ink-sdk does not stream remote CT, so download the same 9.6 µm level used for the geometry (the path ending in /2) as a local uint8 OME-Zarr whose first array is that data. Replace /data/paris4-9.6um.zarr with its path.','Install the renderer (vc_render_tifxyz, usually an AppImage whose launcher is AppRun) and VILLA, fetch the model weights, and replace their paths. The output includes an ink map and the rendered depth stack for further model comparisons.','Reader V3 is a good first choice here. Newer ink-sdk releases add Argus V3, fine-tuned on native scans. Check each model card for its training scrolls before calling a map of this scroll an out-of-sample test.']:tab==='setup'?['fetch downloads the selected model weights; inference does not download them automatically.','doctor checks the installed environment and available checkpoints.']:action.value==='plan'?['Plan comparison lists planned runs and skipped profiles without inference.','The saved stack has 17 slices at 9.6 µm. Centre 0 keeps the window within it; incompatible profiles are reported and skipped.']:['Review runs/ink-comparison/index.html and the run receipts.','Compare the signal with CT and reserved labels; the gallery does not choose the best model for you.'];
  root.querySelector('#sdk-facts').replaceChildren(...facts.map(text=>{const e=document.createElement('div');e.className='cli-fact';e.textContent=text;return e;}));
 }
 tabs.forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.sdkTab;render();}));
 root.querySelector('.cli-tabs').addEventListener('keydown',event=>{const current=tabs.indexOf(document.activeElement);if(current<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tab=tabs[next].dataset.sdkTab;render();tabs[next].focus();});
 action.addEventListener('change',render);render();
}
