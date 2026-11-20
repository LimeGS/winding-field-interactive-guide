export function initCompactLabs() {
  const field=document.getElementById('field'),ink=document.getElementById('ink-experiment');
  [field,ink].forEach(s=>s.classList.add('compact-section'));
  let fitTimer;window.addEventListener('resize',()=>{const link=document.querySelector('.chapter-bar a.active');const section=link&&document.querySelector(link.getAttribute('href'));if(section!==field&&section!==ink)return;clearTimeout(fitTimer);fitTimer=setTimeout(()=>section.scrollIntoView({block:'start',behavior:'instant'}),80);});
  const heading=field.querySelector('.section-heading'),copy=heading.querySelector('div');
  const original=document.createElement('div');original.innerHTML=copy.innerHTML;
  copy.innerHTML='<p>A winding field gives every point a number W: roughly, which turn of the scroll it sits on. Along a layer, W stays nearly constant. Cross to the next turn and it rises by about one. W counts from an arbitrary zero, so only differences matter; that is why real values such as W = −60 can be negative.</p><p>If you know phase unwrapping from InSAR or MRI, this will feel familiar: a continuous coordinate is rebuilt from local differences. winding-field works like least-squares unwrapping: it fits all the differences at once, so a bad one is spread out rather than carried downstream. Here the differences come from surface orientation and layer spacing.</p><p>For PHerc. Paris 4, a coarse field on a 307.2 µm grid gives the whole scan one shared zero and scale. Finer local fields on a 19.2 µm grid refine it, using the coarse field to help neighbouring pieces agree.</p>';
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
  const root=document.getElementById('ink-lab');
  const p0=root.querySelector('[data-panel="0"]'),grid=p0.querySelector('.ink-lab-grid'),left=grid.children[0],right=grid.children[1];
  const brushTools=left.querySelectorAll('.ink-tools');
  const maskControls=document.createElement('div');maskControls.className='ink-console';maskControls.innerHTML='<div class="console-label">INTERACT · LABEL THE EVIDENCE</div>';
  maskControls.append(brushTools[0],left.querySelector('.ink-label-control'),left.querySelector('.ink-mask-counts'),brushTools[1],p0.querySelector('.ink-lab-actions'));
  const paint=left.querySelector('canvas');
  function fitPaint(){const available=left.clientHeight-(left.querySelector('h4').getBoundingClientRect().height+4);if(available>0){const width=Math.min(left.clientWidth,available*1.5);paint.style.width=width+'px';paint.style.height=width/1.5+'px';}}
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
  // Keep the full-size next chapter cards outside the screen-sized experiments.
  [field,ink].forEach(section=>{
    const next=section.querySelector('.chapter-next'),wrapper=document.createElement('div');
    wrapper.className = section === ink ? 'chapter-transition' : 'chapter-transition section';
    if (section === field) wrapper.append(fieldDetails);
    wrapper.append(next);
    section.after(wrapper);
  });

}
