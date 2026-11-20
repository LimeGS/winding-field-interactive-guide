const CLUES_CLI_SOURCE = 'https://github.com/LimeGS/winding-field-cli/blob/59e1a105a2fd4016d8a8e508a862d58b13c22f50/docs/LASAGNA.md';

/** A geometric teaching schematic, not CT data or an archaeological reconstruction. */
export function initCluesLab() {
  const root = document.getElementById('clues-lab');
  if (!root || root.dataset.cluesInitialized === 'true') return;
  root.dataset.cluesInitialized = 'true';
  root.dataset.clue = 'fibres';

  // Concentric arcs make the distinction exact: tangents run along a turn,
  // while radial normals and layer-to-layer spacing run perpendicular to it.
  const centre = { x: 320, y: 570 };
  const radii = [440, 365, 290];
  const point = (radius, angle) => ({
    x: centre.x + radius * Math.sin(angle),
    y: centre.y - radius * Math.cos(angle)
  });
  const xy = p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  const arc = (radius, from, to) => `M ${xy(point(radius, from))} A ${radius} ${radius} 0 0 1 ${xy(point(radius, to))}`;
  const turnPaths = radii.map(radius => `
    <g class="clues-turn">
      <path class="clues-turn-body" d="${arc(radius, -.7, .7)}" />
      <path class="clues-turn-edge" d="${arc(radius - 10, -.7, .7)}" />
      <path class="clues-turn-edge" d="${arc(radius + 10, -.7, .7)}" />
    </g>`).join('');
  const grainPaths = radii.map((radius, i) => [-4, 4].map(offset => `
    <path class="clues-grain" d="${arc(radius + offset, -.61 + i * .08, .57 - i * .06)}" />`).join('')).join('');
  const fibrePaths = [[440, -.58, -.28], [365, -.3, .28], [290, .08, .5]].map(([radius, from, to]) => `
    <path d="${arc(radius, from, to)}" />`).join('');
  const normalPaths = [-.43, 0, .43].map(angle => {
    const start = point(365, angle), end = point(425, angle);
    const tangent = { x: Math.cos(angle), y: Math.sin(angle) };
    const normal = { x: Math.sin(angle), y: -Math.cos(angle) };
    const offset = (t, n) => ({ x: start.x + tangent.x * t + normal.x * n, y: start.y + tangent.y * t + normal.y * n });
    return `<path class="clues-normal-arrow" d="M ${xy(start)} L ${xy(end)}" marker-end="url(#clues-normal-head)" />
      <path class="clues-right-angle" d="M ${xy(offset(13, 0))} L ${xy(offset(13, 13))} L ${xy(offset(0, 13))}" />`;
  }).join('');
  const spacingAngle = .59;
  const spacingCap = radius => {
    const p = point(radius, spacingAngle);
    const dx = Math.cos(spacingAngle) * 16, dy = Math.sin(spacingAngle) * 16;
    return `M ${xy({ x: p.x - dx, y: p.y - dy })} L ${xy({ x: p.x + dx, y: p.y + dy })}`;
  };
  const clues = {
    fibres: {
      caption: 'Fibres follow the material. A traced curve should stay within the same layer.',
      description: 'Three curved neighbouring turns. Highlighted fibre traces follow the circular arcs, tangent to the material.'
    },
    normals: {
      caption: 'Normals are perpendicular to the local surface. They indicate a direction across the layers.',
      description: 'Three curved neighbouring turns. Highlighted normal arrows are perpendicular to the middle turn, with right-angle markers.'
    },
    spacing: {
      caption: 'Measure spacing across neighbouring turns. More closely spaced layers suggest a higher winding density.',
      description: 'Three curved neighbouring turns. A highlighted double-ended dimension line measures the perpendicular separation between two turns.'
    }
  };

  root.innerHTML = `
    <div class="clues-intro">
      <p class="clues-kicker mono">From material to measurements</p>
      <h3>The scroll has a grain.</h3>
      <p class="clues-physical">Papyrus was made from plant strips pressed together in two crossing directions. Pieces were joined into one long strip and rolled. Their fibrous texture, a little like wood grain, gives us clues for following the material.</p>
    </div>
    <div class="clues-layout">
      <section class="clues-visual" aria-label="Explore the geometric clues">
        <div class="clues-toggles" role="group" aria-label="Highlight a geometric clue">
          <button type="button" data-clue-choice="fibres" aria-pressed="true" aria-controls="clues-diagram clues-caption">Fibres</button>
          <button type="button" data-clue-choice="normals" aria-pressed="false" aria-controls="clues-diagram clues-caption">Normals</button>
          <button type="button" data-clue-choice="spacing" aria-pressed="false" aria-controls="clues-diagram clues-caption">Spacing</button>
        </div>
        <div class="clues-diagram-wrap">
          <svg id="clues-diagram" class="clues-diagram" viewBox="0 75 640 320" role="img" aria-labelledby="clues-diagram-title clues-diagram-description">
            <title id="clues-diagram-title">Geometric clues in neighbouring scroll turns</title>
            <desc id="clues-diagram-description">${clues.fibres.description}</desc>
            <defs>
              <marker id="clues-normal-head" viewBox="0 0 10 10" markerWidth="11" markerHeight="11" refX="8" refY="5" markerUnits="userSpaceOnUse" orient="auto"><path d="M 1 1 L 9 5 L 1 9 Z" fill="#e2ad87" /></marker>
              <marker id="clues-spacing-head" viewBox="0 0 10 10" markerWidth="10" markerHeight="10" refX="8" refY="5" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 Z" fill="#93caca" /></marker>
            </defs>
            <g class="clues-turns">${turnPaths}${grainPaths}</g>
            <g class="clues-shape clues-fibres">${fibrePaths}</g>
            <g class="clues-shape clues-normals">${normalPaths}</g>
            <g class="clues-shape clues-spacing">
              <path class="clues-spacing-caps" d="${spacingCap(365)} ${spacingCap(440)}" />
              <path class="clues-spacing-measure" d="M ${xy(point(365, spacingAngle))} L ${xy(point(440, spacingAngle))}" marker-start="url(#clues-spacing-head)" marker-end="url(#clues-spacing-head)" />
            </g>
          </svg>
        </div>
        
        <p id="clues-caption" class="clues-caption" aria-live="polite" aria-atomic="true">${clues.fibres.caption}</p>
      </section>
      <div class="clues-tools">
        <article class="clues-tool clues-lasagna">
          <div class="clues-tool-heading"><span class="clues-tool-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19 19 5M8 5h11v11" /></svg></span><div><p class="clues-tool-name mono">Orientation + spacing</p><h4>Across the layers</h4></div></div>
          <p>Prediction models estimate surface orientation (normals) and winding density: how closely layers are spaced. These clues tell the solver how its coordinate should change across the layers. In this workflow they come from Lasagna.</p>
          <details class="clues-details">
            <summary>More about Lasagna <span aria-hidden="true">+</span></summary>
            <p>Lasagna is the Vesuvius Challenge’s open-source surface model, part of the VILLA repository: a 3D U-Net that runs tile by tile over the CT. The wider framework also grows surface meshes and traces fibres. From CT it predicts four volumes: two normal components (direction across the layers, without a sign), layer density, and a periodic surface-phase signal later used to place meshes on the papyrus.</p><p>Density is measured in layers per micrometre. In one sampled region of another scroll, PHerc. 0483A, it ranged from about 0.010 to 0.019, i.e. layers roughly 50–100 µm apart. Because the normals have no sign, the CLI orients them consistently before solving; its <a href="https://github.com/LimeGS/winding-field-cli/blob/59e1a105a2fd4016d8a8e508a862d58b13c22f50/docs/FORMATS.md" target="_blank" rel="noopener noreferrer">format documentation</a> flags that orientation and calibration step as not yet scientifically validated. <a href="https://github.com/LimeGS/winding-field-cli/blob/59e1a105a2fd4016d8a8e508a862d58b13c22f50/docs/LASAGNA.md" target="_blank" rel="noopener noreferrer">Lasagna in the CLI →</a> · <a href="https://github.com/ScrollPrize/villa/blob/b29f310957c7b29e7d332f9876e0e487819cfaa3/lasagna/docs/3d_unet_training.md" target="_blank" rel="noopener noreferrer">Lasagna 3D U-Net →</a></p>
          </details>
        </article>
        <article class="clues-tool clues-qual">
          <div class="clues-tool-heading"><span class="clues-tool-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 15C8 3 16 22 21 10M15 10h6v6" /></svg></span><div><p class="clues-tool-name mono">Fibre traces</p><h4>Along the layer</h4></div></div>
          <p>A model predicts fibre structures from CT, and a separate tracer links them into 3D curves. Points along a reliable curve should remain within the same layer. In this workflow the model is Qual V2, made by community member Qual; fibre sets traced by community members for PHerc. Paris 4, such as Bruniss’s and Qual’s, can be imported instead. The solver samples each curve at least once per cell of its field grid and asks those samples to share one W.</p>
          <details class="clues-details">
            <summary>From predictions to curves <span aria-hidden="true">+</span></summary>
            <p>Qual V2 predicts probability maps for background, two fibre families and intersections, plus local fibre directions. The default tracer uses the fibre-family probability maps to create splines: smooth 3D curves stored with coordinate metadata. These remain estimates to inspect.</p>
          </details>
        </article>
      </div>
    </div>
    <div class="clues-together">
      <div><p class="clues-tool-name mono">The solver · winding-field</p><h4>Bring the clues together</h4></div>
      <p>The solver fits a coordinate that stays nearly constant along a layer and changes across layers. Points with the same value form candidate surfaces to check against the CT.</p>
    </div>
    <div class="clues-sources" aria-label="Sources for the material and prediction workflow">
      <a href="https://scrollprize.org/faq" target="_blank" rel="noopener noreferrer">Papyrus &amp; fibres →</a>
      <a href="${CLUES_CLI_SOURCE}" target="_blank" rel="noopener noreferrer">Prediction workflow →</a>
    </div>`;

  root.querySelectorAll('[data-clue-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const choice = button.dataset.clueChoice;
      if (!clues[choice] || root.dataset.clue === choice) return;
      root.dataset.clue = choice;
      root.querySelectorAll('[data-clue-choice]').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      root.querySelector('#clues-caption').textContent = clues[choice].caption;
      root.querySelector('#clues-diagram-description').textContent = clues[choice].description;
    });
  });
}
