export function compactField() {
  const field=document.getElementById('field');
  // Extra background for the field toy, shown in its "Under the hood" panel.
  const original=document.createElement('div');original.innerHTML='<p>Imagine contour lines on a map. Within a local patch, the coordinate changes as you cross papyrus layers, and stays nearly constant as you follow a surface. Neighbouring layers can be turns of the same rolled strip.</p><p>That is the central idea of a <strong>winding field</strong>: a scalar value at each supported point in a local volume. The goal is a useful geometric coordinate, not a page number.</p>';
  const f=document.getElementById('field-lab'),chart=document.createElement('div'),controls=document.createElement('div');chart.className='field-visual';controls.className='field-console';
  chart.append(f.querySelector('.field-canvas-wrap'),f.querySelector('.field-legend'));
  const mission=field.querySelector('.experiment-mission');mission.innerHTML='<strong>Try this:</strong> Move B along a layer, then across layers. Watch how W changes.';controls.innerHTML='<div class="console-label">INTERACT · EXPLORE THE FIELD</div>';controls.append(f.querySelector('.field-toolbar'),mission,f.querySelector('.field-range-grid'),f.querySelector('.field-metric-grid'));f.prepend(chart,controls);
  const fieldDetails = f.querySelector('.field-deep-dive');
  fieldDetails.classList.replace('field-deep-dive', 'deep-dive');
  const fieldSummary = fieldDetails.querySelector('summary');
  const disclosureIcon = document.createElement('span');
  disclosureIcon.setAttribute('aria-hidden', 'true');
  disclosureIcon.textContent = '+';
  fieldSummary.append(disclosureIcon);
  const fieldDetailBody = document.createElement('div');
  fieldDetailBody.className = 'deep-dive-body';
  fieldDetailBody.append(original, ...[...fieldDetails.children].slice(1));
  fieldDetails.append(fieldDetailBody);
  f.after(fieldDetails);
}

export function compactInk() {
  const root=document.getElementById('ink-lab');
  const p0=root.querySelector('[data-panel="0"]'),grid=p0.querySelector('.ink-lab-grid'),left=grid.children[0],right=grid.children[1];
  const brushTools=left.querySelectorAll('.ink-tools');
  const maskControls=document.createElement('div');maskControls.className='ink-console';maskControls.innerHTML='<div class="console-label">INTERACT · LABEL THE EVIDENCE</div>';
  maskControls.append(brushTools[0],left.querySelector('.ink-label-control'),left.querySelector('.ink-mask-counts'),brushTools[1],p0.querySelector('.ink-lab-actions'));
  const paint=left.querySelector('canvas');
  // The canvas is collapsed while measuring, so its own size cannot feed back into the result.
  function fitPaint(){if(left.hidden)return;const before=[paint.style.width,paint.style.height];paint.style.width='0px';paint.style.height='0px';const available=left.clientHeight-(left.querySelector('h4').getBoundingClientRect().height+4);if(available<=0){[paint.style.width,paint.style.height]=before;}else{const width=Math.min(left.clientWidth,available*1.5);paint.style.width=width+'px';paint.style.height=width/1.5+'px';}}
  new ResizeObserver(fitPaint).observe(left);
  brushTools[1].classList.add('mask-secondary-tools');brushTools[0].append(maskControls.querySelector('#ink-clear'));
  const switcher=document.createElement('div');switcher.className='ink-tools ink-view-switch';switcher.innerHTML='<button class="ink-tool" aria-pressed="true">Reference / paint</button><button class="ink-tool" aria-pressed="false">CT stack</button>';
  const visual=document.createElement('div');visual.className='ink-mask-visual';visual.append(left,right);grid.replaceChildren(visual,maskControls);visual.prepend(switcher);right.hidden=true;
  switcher.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{left.hidden=i===1;right.hidden=i===0;fitPaint();switcher.querySelectorAll('button').forEach((a,j)=>a.setAttribute('aria-pressed',String(i===j)));});
  const help=p0.querySelector('#ink-paint-help');help.textContent='Paint strokes as Ink; mark clean papyrus as Background. Unpainted pixels are ignored. Arrow keys + Space also paint.';maskControls.prepend(help);
  p0.querySelector(':scope > p').hidden=true;
  const p1=root.querySelector('[data-panel="1"]'),trainSide=document.createElement('div');trainSide.className='ink-console';trainSide.append(p1.querySelector('.ink-lab-actions'),p1.querySelector('.ink-training-metrics'),p1.querySelector('.ink-loss-chart'),p1.querySelector('.ink-training-progress'));
  p1.append(trainSide);p1.querySelector('.ink-caption').hidden=true;
  const p2=root.querySelector('[data-panel="2"]'),testSide=document.createElement('div');testSide.className='ink-console';testSide.append(p2.querySelector('.ink-lab-actions'),p2.querySelector('.ink-result-note'),p2.querySelector('.ink-lab-actions'));p2.append(testSide);
  // On narrow screens, one visual at a time keeps the controls in the same viewport.
  for(const [panel,selector,names] of [[p1,'.ink-train-grid',['CT input','Network','Compare']],[p2,'.ink-lab-grid',['CT input','Ink map']]]) {
    const visuals=panel.querySelector(selector),tabs=document.createElement('div');tabs.className='ink-mobile-views';
    [...visuals.children].forEach((el,i)=>{el.dataset.compactView=i;const b=document.createElement('button');b.className='ink-tool';b.textContent=names[i];b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>{visuals.dataset.selected=i;tabs.querySelectorAll('button').forEach((a,j)=>a.setAttribute('aria-pressed',String(i===j)));};tabs.append(b);});visuals.dataset.selected='0';visuals.before(tabs);
  }

}
