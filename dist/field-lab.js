import { windingColor } from './winding-colors.js?v=20261123-ink';

/**
 * Synthetic local-coordinate lesson. This is an analytic teaching model, not
 * the Python winding solver, a CT reconstruction, or a measured ancient scroll.
 * Geometry: y = f(x) + layer.  Coherent W = y - f(x).
 */
export function initFieldLab() {
  const root = document.getElementById('field-lab');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const source = 'https://github.com/LimeGS/winding-field/blob/6dad095dd3b909687a13cdc8f5b7b3db8f3ffddc';
  root.innerHTML = `
    <style>
      #field-lab{container:field-lab / inline-size;min-width:0;font-size:1rem}
      #field-lab .field-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem}
      #field-lab .field-mode-group{display:flex;gap:.375rem;flex-wrap:wrap;max-width:100%;padding:.25rem}
      #field-lab .field-mode-group button{min-height:3rem;min-width:0;padding:.625rem 1rem;border:1px solid #35423b;border-radius:.5rem;background:#172019;color:#b5c2b9;cursor:pointer;font:inherit;font-size:1rem;line-height:1.4}
      #field-lab .field-mode-group button[aria-pressed="true"]{background:#d4efb4;border-color:#d4efb4;color:#18231a}
      #field-lab button:focus-visible,#field-lab input:focus-visible,#field-lab summary:focus-visible{outline:2px solid #d4efb4;outline-offset:4px}
      #field-lab .field-canvas-wrap{position:relative;overflow:hidden;border:1px solid #303a34;border-radius:.625rem;background:#101713}
      #field-lab .field-chart-heading,#field-lab .field-chart-axes{display:flex;justify-content:space-between;gap:.5rem 1.5rem;flex-wrap:wrap;padding:.875rem 1.25rem;font-size:.875rem;line-height:1.6;color:#a6baaa}
      #field-lab .field-chart-heading{border-bottom:1px solid #27362b;text-transform:uppercase;letter-spacing:.04em}
      #field-lab .field-chart-heading [data-field-chart-mode]{color:#c9dfaf}
      #field-lab .field-chart-axes{border-top:1px solid #27362b}
      #field-lab canvas{display:block;width:100%;cursor:crosshair}
      #field-lab .field-legend{display:flex;align-items:center;gap:.75rem 1rem;flex-wrap:wrap;font-size:.875rem;line-height:1.6;color:#a7b5ab;margin-top:.875rem;margin-bottom:1.5rem}
      #field-lab .field-legend span{display:inline-flex;align-items:center;gap:.5rem}
      #field-lab .field-dot{width:.5rem;height:.5rem;flex-shrink:0;border-radius:50%;display:inline-block;background:#d4efb4}
      #field-lab .field-reference{background:#f1ece1}
      #field-lab .field-neighbor{background:#93caca}
      #field-lab .field-legend .field-legend-hint{margin-left:auto;color:#a0b0a4}
      #field-lab .field-range-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.75rem;margin-bottom:1.5rem}
      #field-lab .field-range-grid .range-control{min-width:0;margin:0}
      #field-lab .field-range-grid label{display:flex;justify-content:space-between;gap:.75rem;font-size:1rem;line-height:1.5;color:#c5d1c8;margin-bottom:.5rem}
      #field-lab .field-range-grid output{color:#d4efb4;font-variant-numeric:tabular-nums;white-space:nowrap}
      #field-lab .field-range-grid input{width:100%;accent-color:#d4efb4;cursor:pointer;min-height:3rem;margin:0}
      #field-lab .field-metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:0 0 1.25rem}
      #field-lab .field-metric-grid .lab-stat{min-width:0;padding:1.25rem 1rem;border:1px solid #303a34;border-radius:.5rem;background:#131c16}
      #field-lab .field-metric-grid .stat-label{display:block;font-size:.875rem;line-height:1.5;color:#a7b8ab;letter-spacing:.035em;overflow-wrap:anywhere}
      #field-lab .field-metric-grid .stat-value{display:block;font-size:2rem;line-height:1.3;margin:.5rem 0 .375rem;color:#e7efdf;font-variant-numeric:tabular-nums}
      #field-lab .field-metric-grid small{display:block;font-size:.875rem;line-height:1.6;color:#9bafa0;overflow-wrap:anywhere}
      #field-lab .field-feedback{min-height:4rem;padding:1rem 1.125rem;background:#1b281e;border-left:2px solid #bad899;border-radius:0 .375rem .375rem 0;font-size:1rem;line-height:1.7;color:#c3d2c5;margin:0 0 1rem}
      #field-lab .field-feedback strong{color:#e3eecd}
      #field-lab .field-deep-dive{border-top:1px solid #303a34;padding-top:1rem;font-size:1rem;line-height:1.8;color:#b6c5bb}
      #field-lab .field-deep-dive summary{cursor:pointer;color:#d0dfc8;font-size:1rem;line-height:1.6;min-height:3rem;padding:.75rem 0}
      #field-lab .field-deep-dive p{margin:1rem 0}
      #field-lab .field-equation{display:block;white-space:normal;overflow-wrap:anywhere;padding:1rem;background:#101713;border-radius:.375rem;font-size:.9375rem;line-height:1.9;color:#d1e7ba}
      #field-lab .field-deep-dive a{display:inline-flex;align-items:center;min-height:3rem;padding:.5rem 0;color:#d4efb4;text-underline-offset:.2rem}
      @container field-lab (max-width:38rem){#field-lab .field-range-grid{grid-template-columns:1fr;gap:1rem}#field-lab .field-metric-grid{grid-template-columns:1fr;gap:.75rem}#field-lab .field-metric-grid .lab-stat{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.25rem 1rem;padding:1rem}#field-lab .field-metric-grid .stat-label{grid-column:1;grid-row:1}#field-lab .field-metric-grid small{grid-column:1;grid-row:2}#field-lab .field-metric-grid .stat-value{grid-column:2;grid-row:1/3;align-self:center;margin:0}#field-lab .field-legend .field-legend-hint{width:100%;margin-left:0}}
      @container field-lab (max-width:28rem){#field-lab .field-mode-group{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#field-lab .field-mode-group button:first-child{grid-column:1/-1}#field-lab .field-range-grid label{flex-wrap:wrap}}
    </style>
    <div class="field-toolbar">
      <div class="segment-control field-mode-group" role="group" aria-label="Candidate winding field">
        <button class="button button-small" type="button" data-field-mode="coherent" aria-pressed="true">Coherent</button>
        <button class="button button-small" type="button" data-field-mode="drift" aria-pressed="false">Drift</button>
        <button class="button button-small" type="button" data-field-mode="collapsed" aria-pressed="false">Collapsed</button>
      </div>
    </div>
    <div class="field-canvas-wrap">
      <div class="field-chart-heading mono"><span>Synthetic local chart</span><span data-field-chart-mode>Coherent</span></div>
      <canvas aria-label="Synthetic wavy layers. Probe A is a fixed reference. Probe B moves along the selected layer. Probe C sits on the adjacent layer. Use the two sliders below to explore." role="img"></canvas>
      <div class="field-chart-axes mono"><span>x → along the layer</span><span>known synthetic layers ↓</span></div>
    </div>
    <div class="field-legend">
      <span><i class="field-dot field-reference" aria-hidden="true"></i>A · reference</span>
      <span><i class="field-dot" aria-hidden="true"></i>B · your probe</span>
      <span><i class="field-dot field-neighbor" aria-hidden="true"></i>C · next layer</span>
      <span class="field-legend-hint">Tap the chart, or use the controls ↓</span>
    </div>
    <div class="lab-controls field-range-grid">
      <div class="range-control">
        <label for="field-probe-x">Move along the layer <output id="field-probe-x-value" for="field-probe-x">70%</output></label>
        <input id="field-probe-x" type="range" min="25" max="92" step="1" value="70">
      </div>
      <div class="range-control">
        <label for="field-probe-layer">Move across layers <output id="field-probe-layer-value" for="field-probe-layer">Layer 3</output></label>
        <input id="field-probe-layer" type="range" min="1" max="5" step="1" value="3">
      </div>
    </div>
    <div class="lab-stats field-metric-grid">
      <div class="lab-stat"><span class="stat-label">W AT YOUR PROBE</span><span class="stat-value mono" data-metric="w">3.00</span><small>Candidate value at B</small></div>
      <div class="lab-stat"><span class="stat-label">ALONG-LAYER DRIFT</span><span class="stat-value mono" data-metric="drift">0.00</span><small>|W(B) − W(A)| · ideal 0</small></div>
      <div class="lab-stat"><span class="stat-label">LAYER SEPARATION</span><span class="stat-value mono" data-metric="separation">1.00</span><small>W(C) − W(B) · ideal +1</small></div>
    </div>
    <p class="experiment-note field-feedback" aria-live="polite"></p>
    <details class="deep-dive field-deep-dive">
      <summary>Under the hood: how this toy works</summary>
      <p>Here, the toy geometry is y = f(x) + layer, and the coherent field is W = y − f(x). Increasing the layer index raises W; moving the other way lowers it. The controls select known synthetic layers, while the analytic field is continuous between them. Drift adds a smooth x-dependent error. Collapse replaces every value with zero. A full scroll can require cuts and linked local coordinate charts; these local contours do not establish which physical turn a layer belongs to. The production objective is in the solver chapter’s math notebook.</p>
      <p><a href="${source}/src/field_solver.py" target="_blank" rel="noopener noreferrer">Inspect the real solver →</a> · <a href="${source}/benchmarks/winding/README.md" target="_blank" rel="noopener noreferrer">Read the evaluation contract →</a></p>
    </details>`;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const xControl = root.querySelector('#field-probe-x');
  const layerControl = root.querySelector('#field-probe-layer');
  const feedback = root.querySelector('.field-feedback');
  const state = { mode: 'coherent', x: 0.70, layer: 3, width: 720, height: 380, rem: 16 };
  const monoFont = size => `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const anchorX = 0.14;
  const wave = x => 0.34 * Math.sin(x * Math.PI * 2 - 0.5) + 0.12 * Math.sin(x * Math.PI * 4 + 0.6);
  const error = x => 0.70 * Math.sin(x * Math.PI * 2.5 + 0.4);
  const value = (x, layer) => state.mode === 'collapsed' ? 0 : layer + (state.mode === 'drift' ? error(x) : 0);
  const progress = () => window.dispatchEvent(new CustomEvent('lab-progress', { detail: 'field' }));
  const color = windingColor;
  const geometry = () => {
    const compact = state.width < 36 * state.rem;
    const left = Math.min((compact ? 1.25 : 2.25) * state.rem, state.width * .15);
    const right = state.width - Math.min((compact ? 2 : 3) * state.rem, state.width * .2);
    const top = Math.min(2 * state.rem,state.height*.12), bottom = state.height - Math.min(2.5 * state.rem,state.height*.15);
    return { left, right, top, bottom, px: x => left + x * (right - left), py: (x, layer) => top + (layer + 0.60 + wave(x)) * (bottom - top) / 7.2 };
  };
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function label(text, x, y, fill, placement = 'above') {
    const rem = state.rem;
    ctx.font = monoFont(.875 * rem);
    const width = ctx.measureText(text).width + rem;
    const height = 1.75 * rem;
    const lx = Math.max(.25 * rem, Math.min(state.width - width - .25 * rem, x - width / 2));
    const ly = placement === 'below' ? y + rem : y - rem - height;
    roundedRect(lx, ly, width, height, .25 * rem);
    ctx.fillStyle = '#121b15'; ctx.fill();
    ctx.strokeStyle = '#465144'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = fill; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, lx + .5 * rem, ly + height / 2);
    ctx.textBaseline = 'alphabetic';
  }
  function probe(x, y, text, fill, placement = 'above') {
    ctx.beginPath(); ctx.arc(x, y, .625 * state.rem, 0, Math.PI * 2);
    ctx.fillStyle = '#101713'; ctx.fill();
    ctx.strokeStyle = fill; ctx.lineWidth = .0875 * state.rem; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, .25 * state.rem, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    label(text, x, y, fill, placement);
  }
  function render() {
    if (!ctx) return;
    const { width: w, height: h, rem } = state;
    const scale = rem / 16;
    const { left, right, top, bottom, px, py } = geometry();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101713'; ctx.fillRect(0, 0, w, h);
    const halo = ctx.createRadialGradient(w * .55, h * .48, 8, w * .55, h * .48, w * .60);
    halo.addColorStop(0, '#1c2a1f'); halo.addColorStop(1, '#101713');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(170,195,167,.075)';
    for (let i = 0; i <= 8; i++) {
      const gx = left + i * (right - left) / 8;
      ctx.beginPath(); ctx.moveTo(gx, top - .5 * rem); ctx.lineTo(gx, bottom + .375 * rem); ctx.stroke();
    }
    for (let j = 0; j <= 7; j++) {
      const gy = top + j * (bottom - top) / 7.2;
      ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(right, gy); ctx.stroke();
    }
    // Background ribbons expose the candidate values while retaining known geometry.
    for (let layer = 0; layer < 7; layer++) {
      for (let i = 0; i < 88; i++) {
        const a = i / 88, b = (i + 1) / 88;
        ctx.beginPath(); ctx.moveTo(px(a), py(a, layer) - 5 * scale);
        ctx.lineTo(px(b), py(b, layer) - 5 * scale); ctx.lineTo(px(b), py(b, layer) + 5 * scale);
        ctx.lineTo(px(a), py(a, layer) + 5 * scale); ctx.closePath();
        ctx.fillStyle = color(value((a + b) / 2, layer), layer === state.layer ? .18 : .075); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px(a), py(a, layer)); ctx.lineTo(px(b), py(b, layer));
        ctx.strokeStyle = color(value((a + b) / 2, layer), layer === state.layer ? 1 : .7);
        ctx.lineWidth = (layer === state.layer ? 2.5 : 1.3) * scale; ctx.stroke();
      }
      ctx.font = monoFont(.875 * rem);
      ctx.fillStyle = layer === state.layer ? '#cfdfbb' : '#9bad9e'; ctx.textAlign = 'left';
      ctx.fillText(String(layer), right + .5 * rem, py(1, layer) + .3 * rem);
    }
    const ay = py(anchorX, state.layer), by = py(state.x, state.layer), cy = py(state.x, state.layer + 1);
    // Dash joining B to C is a synthetic separation check, never a traced fibre.
    ctx.beginPath(); ctx.setLineDash([3 * scale, 4 * scale]); ctx.moveTo(px(state.x), by + 11 * scale); ctx.lineTo(px(state.x), cy - 11 * scale);
    ctx.strokeStyle = '#93caca'; ctx.lineWidth = 1.2 * scale; ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(px(state.x) - 3 * scale, cy - 16 * scale); ctx.lineTo(px(state.x), cy - 11 * scale); ctx.lineTo(px(state.x) + 3 * scale, cy - 16 * scale);
    ctx.strokeStyle = '#93caca'; ctx.stroke();
    // Put A below its point and B above, keeping labels apart at the left slider limit.
    probe(px(anchorX), ay, 'A', '#eee9de', 'below');
    probe(px(state.x), by, `B  ${value(state.x, state.layer).toFixed(2)}`, '#d4efb4');
    // Keep the adjacent label beside C so it cannot overlap B on compact screens.
    ctx.beginPath(); ctx.arc(px(state.x), cy, .3 * rem, 0, Math.PI * 2); ctx.fillStyle = '#93caca'; ctx.fill();
    ctx.font = monoFont(.875 * rem); ctx.textAlign = state.x > .79 ? 'right' : 'left';
    ctx.fillText('C', px(state.x) + (state.x > .79 ? -.875 : .875) * rem, cy + .3 * rem);
  }
  function update(showFeedback = false) {
    const wa = value(anchorX, state.layer), wb = value(state.x, state.layer), wc = value(state.x, state.layer + 1);
    const drift = Math.abs(wb - wa), separation = wc - wb;
    root.querySelector('[data-metric="w"]').textContent = wb.toFixed(2);
    root.querySelector('[data-metric="drift"]').textContent = drift.toFixed(2);
    root.querySelector('[data-metric="separation"]').textContent = separation.toFixed(2);
    root.querySelector('[data-metric="drift"]').style.color = drift > .1 ? '#e0bd93' : '#d4efb4';
    root.querySelector('[data-metric="separation"]').style.color = Math.abs(separation - 1) > .1 ? '#e0bd93' : '#d4efb4';
    root.querySelector('#field-probe-x-value').textContent = `${Math.round(state.x * 100)}%`;
    root.querySelector('#field-probe-layer-value').textContent = `Layer ${state.layer}`;
    root.querySelector('[data-field-chart-mode]').textContent = state.mode;
    root.querySelector('[data-field-chart-mode]').style.color = state.mode === 'collapsed' ? '#e0bd93' : '#c9dfaf';
    xControl.value = String(Math.round(state.x * 100)); layerControl.value = String(state.layer);
    if (showFeedback) {
      const copy = {
        coherent: '',
        drift: '<strong>The layer did not change. The estimate drifted.</strong> A and B lie on the same synthetic layer, but their values can disagree. This candidate preserves adjacent-layer separation. Try different positions: one pair can miss a defect.',
        collapsed: '<strong>A perfect consistency score can hide a failed field.</strong> Every point now says W = 0. Along-layer drift is zero, but adjacent layers have also merged in coordinate space. This is why separation and coverage must be checked too.'
      };
      feedback.innerHTML = copy[state.mode];
      feedback.hidden = !copy[state.mode];
    }
    render();
  }
  root.querySelectorAll('[data-field-mode]').forEach(button => {
    button.addEventListener('click', () => {
      if (state.mode === button.dataset.fieldMode) return;
      state.mode = button.dataset.fieldMode;
      root.querySelectorAll('[data-field-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      update(true); progress();
    });
  });
  xControl.addEventListener('input', () => { state.x = Number(xControl.value) / 100; update(); progress(); });
  layerControl.addEventListener('input', () => { state.layer = Number(layerControl.value); update(); progress(); });
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const localX = (event.clientX - rect.left) * state.width / rect.width;
    const localY = (event.clientY - rect.top) * state.height / rect.height;
    const { left, right, top, bottom } = geometry();
    if (localX < left || localX > right || localY < top - 10 || localY > bottom + 10) return;
    state.x = Math.round(Math.min(.92, Math.max(.25, (localX - left) / (right - left))) * 100) / 100;
    state.layer = Math.min(5, Math.max(1, Math.round((localY - top) * 7.2 / (bottom - top) - .60 - wave(state.x))));
    update(); progress();
  });
  function resize() {
    const width = canvas.getBoundingClientRect().width;
    if (!Number.isFinite(width) || width <= 0) return;
    const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    state.width = width; state.rem = rem;
    // Fill the space left by the chart's own heading and axis rows, measured
    // rather than guessed, so the axis label is never pushed out of the frame.
    const wrap = canvas.parentElement, wrapStyle = window.getComputedStyle(wrap);
    const chrome = [...wrap.children].filter(el => el !== canvas && window.getComputedStyle(el).position !== 'absolute')
      .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
    const inner = wrap.clientHeight - parseFloat(wrapStyle.paddingTop || 0) - parseFloat(wrapStyle.paddingBottom || 0);
    state.height = Math.max(32, Math.floor(inner - chrome));
    const deviceRatio = window.devicePixelRatio || 1;
    const dpr = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(state.height * dpr));
    canvas.style.height = `${state.height}px`;
    // Correct for margins and gaps the measurement above cannot see.
    const overflow = wrap.scrollHeight - wrap.clientHeight;
    if (overflow > 0 && state.height - overflow >= 32) {
      state.height -= overflow;
      canvas.height = Math.max(1, Math.round(state.height * dpr));
      canvas.style.height = `${state.height}px`;
    }
    if (ctx) ctx.setTransform(canvas.width / width, 0, 0, canvas.height / state.height, 0, 0);
    render();
  }
  let densityQuery;
  function watchDensity() {
    if (densityQuery) {
      if (densityQuery.removeEventListener) densityQuery.removeEventListener('change', densityChanged);
      else if (densityQuery.removeListener) densityQuery.removeListener(densityChanged);
    }
    if (!window.matchMedia) return;
    densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    if (densityQuery.addEventListener) densityQuery.addEventListener('change', densityChanged);
    else if (densityQuery.addListener) densityQuery.addListener(densityChanged);
  }
  function densityChanged() {
    watchDensity();
    resize();
  }
  update(true);
  resize();
  watchDensity();
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    // The heading and axis rows can change height (fonts, layout moves).
    [...canvas.parentElement.children].filter(el => el !== canvas).forEach(el => observer.observe(el));
  }
  if (document.fonts) document.fonts.ready.then(resize);
  window.addEventListener('resize', resize, { passive: true });
}
