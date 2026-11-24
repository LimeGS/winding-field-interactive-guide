// The official release image: GPU (CUDA) by default; the same tag with -cpu runs without a GPU.
export const CLI_VERSION = '1.6.7';
export const CLI_IMAGE = `ghcr.io/limegs/winding-field-cli:${CLI_VERSION}`;
const CLI_BASE = `https://github.com/LimeGS/winding-field-cli/blob/v${CLI_VERSION}`;
const CT_VOLUMES = 's3://vesuvius-challenge-open-data/PHercParis4/volumes';
const CT_SCAN = '20260411134726-2.400um-0.2m-78keV-masked.zarr/2';
// One line per terminal: run the image as you, in this folder, with the GPU.
export const WF_FUNCTION = `wf() { docker run --rm --init --gpus all --user "$(id -u):$(id -g)" \\\n  -v "$PWD:/outputs" ${CLI_IMAGE} "$@"; }`;

export function cliCommand({tab='field',action='flatten'}={}) {
  const define = `# Once per terminal: the official winding-field-cli image\n${WF_FUNCTION}\n\n`;
  if(tab==='demo')return `${define}wf doctor\nwf demo --output runs/demo\n\n# Open runs/demo/index.html after the demo finishes.`;
  const mesh = `${define}mkdir -p runs exports\n\nwf prepared mesh --config paris4-remote.json \\\n  --output runs/paris4-W-60`;
  if (action === 'mesh') return mesh;
  return `${mesh}\n\nVOLUMES='${CT_VOLUMES}'\nCT="$VOLUMES/${CT_SCAN}"\n\nwf export-sheets --mesh-bundle runs/paris4-W-60 \\\n  --flattening-solver lscm --scope sheet \\\n  --flattening-config paris4-flattening.json \\\n  --source "$CT" --voxel-um 9.6 --level 0 \\\n  --ct-workers 4 --raster-workers 4 \\\n  --export-tifxyz --output exports/paris4-W-60`;
}

/** A command builder. It executes no commands. */
export function initCliLab() {
  const mount = document.getElementById('cli-lab');
  if (!mount || mount.dataset.cliInitialized) return;
  mount.dataset.cliInitialized = 'true';
  mount.classList.add('command-workbench');
  const state = { tab: 'field', action: 'flatten' };

  mount.innerHTML = `

    <div class="cli-tabs" role="tablist" aria-label="CLI learning workflows">
      <button class="cli-tab" id="cli-tab-field" role="tab" aria-controls="cli-panel" aria-selected="true" data-cli-tab="field">Published field</button>
      <button class="cli-tab" id="cli-tab-demo" role="tab" aria-controls="cli-panel" aria-selected="false" tabindex="-1" data-cli-tab="demo">Synthetic demo</button>
    </div>
    <div class="cli-grid" id="cli-panel" role="tabpanel" aria-labelledby="cli-tab-field">
      <div>
        <h3 class="cli-heading" id="cli-heading"></h3>
        <p class="cli-description" id="cli-description"></p>
        <div class="cli-fields" id="cli-fields"></div>
        <div class="cli-configs" id="cli-configs"><p>Save both files in your working directory, then run the commands.</p><div><a href="./examples/paris4-remote.json" download="paris4-remote.json">Mesh config ↓</a><a href="./examples/paris4-flattening.json" download="paris4-flattening.json">Flattening config ↓</a><a href="https://huggingface.co/datasets/LimeGS/winding-field-PHerc.Paris.4-307.2um" target="_blank" rel="noopener noreferrer">View field ↗</a></div></div>
        <div class="cli-facts" id="cli-facts"></div>
      </div>
      <div>
        <div class="cli-console terminal">
          <div class="cli-bar"><span class="cli-dot"></span><span class="cli-dot"></span><span class="cli-dot"></span><span>~/paris4</span><span class="cli-label">Command builder</span></div>
          <pre class="cli-command" tabindex="0" aria-label="Generated CLI commands"><code id="cli-command"></code></pre>
          <div class="cli-actions">
            <a class="cli-btn cli-btn-primary" id="cli-instructions" href="${CLI_BASE}/README.md" target="_blank" rel="noopener noreferrer">See full instructions on GitHub <span aria-hidden="true">&nbsp;↗</span></a>
          </div>
        </div>
      </div>
    </div>`;

  const $ = (selector) => mount.querySelector(selector);
  const selectMarkup = (key, label, items, wide = false, help = '') => `<label class="cli-field ${wide ? 'cli-field-wide' : ''}">${label}<select data-cli-setting="${key}" aria-label="${label}" ${help ? `aria-describedby="cli-${key}-help"` : ''}>${items.map(([value, title]) => `<option value="${value}" ${state[key] === value ? 'selected' : ''}>${title}</option>`).join('')}</select>${help ? `<small id="cli-${key}-help">${help}</small>` : ''}</label>`;

  function updateCommand() {
    $('#cli-command').textContent = cliCommand(state);
  }

  function render() {
    mount.querySelectorAll('[data-cli-tab]').forEach(button => {
      const selected = button.dataset.cliTab === state.tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $('#cli-panel').setAttribute('aria-labelledby', `cli-tab-${state.tab}`);
    const facts = [];
    let fields = '';
    if (state.tab === 'demo') {
      $('#cli-heading').textContent = 'Your first experiment. No ancient data required.';
      $('#cli-description').textContent = 'Start with the repository’s own synthetic CT demo. It creates curved layers, runs the workflow and gives you a local gallery to inspect.';
      facts.push('doctor checks the installed environment.', 'demo uses generated curved layers, not an ancient manuscript.', 'The gallery links 3D meshes, flat charts and their correspondence.');
    } else {
      $('#cli-heading').textContent = 'An existing field. A surface to unfold.';
      $('#cli-description').textContent = 'PHerc. Paris 4 (Scroll 1). Geometry and ink use one CT resolution throughout: 9.6 µm. Stream the published field, extract the W = −60 candidate surface, then flatten the mesh and sample the CT.';
      fields += selectMarkup('action', 'Action', [['flatten', 'Extract mesh & flatten'], ['mesh', 'Extract mesh only']], true);
      facts.push('The field streams from Hugging Face; no field fitting or model inference.', 'One scale: 9.6 µm. The scan is a multiscale pyramid (2.4, 4.8, 9.6 µm…); the path ending in /2 is its 9.6 µm level, and --level 0 means use it as given. ink-sdk uses the same level.', 'The field’s 307.2 µm grid (32 × 9.6 µm) is a solver setting, not a second CT scale. It is coarse: mesh coordinates are in µm, but their detail is limited by that grid. LSCM flattens each connected surface component (--scope sheet; Linux).', 'Measured with the CPU image on 4 cores: the mesh took under 2 minutes and the export 245 tiles in about 75 minutes, with 8 GB of tiles and CT cache. The CLI keeps 8 GiB of disk free, so leave about 20 GB. If the export stops, rerun it with --resume: it renders the tiles again and sets the old ones aside in a render-interrupted folder you can delete.');
    }
    $('#cli-fields').innerHTML = fields;
    $('#cli-fields').hidden = !fields;
    $('#cli-configs').hidden = state.tab === 'demo';
    $('#cli-instructions').href = `${CLI_BASE}/${state.tab === 'demo' ? 'README.md' : 'docs/FLATTENING.md'}`;
    $('#cli-facts').hidden = !facts.length;
    $('#cli-facts').replaceChildren(...facts.map(fact => {
      const element = document.createElement('div');
      element.className = 'cli-fact';
      element.textContent = fact;
      return element;
    }));
    updateCommand();
  }

  mount.addEventListener('click', event => {
    const tab = event.target.closest('[data-cli-tab]');
    if (!tab) return;
    state.tab = tab.dataset.cliTab;
    render();
  });
  $('.cli-tabs').addEventListener('keydown', event => {
    const tabs = [...mount.querySelectorAll('[data-cli-tab]')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    state.tab = tabs[next].dataset.cliTab;
    render();
    tabs[next].focus();
  });
  $('#cli-fields').addEventListener('input', event => {
    const key = event.target.dataset.cliSetting;
    if (!key || !(key in state)) return;
    state[key] = event.target.value;
    updateCommand();
  });

  $('#cli-instructions').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('lab-progress',{detail:'cli'})));
  render();
}
