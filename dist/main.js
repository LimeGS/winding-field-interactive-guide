import { initInkPrimer } from './ink-primer.js?v=20261122-intros';
import { initSdkWorkbench } from './sdk-workbench.js?v=20261122-intros';
import { initCompactLabs } from './compact-labs.js?v=20261122-intros';
import { initInkLab } from './ink-lab.js?v=20261122-intros';
import { initFieldLab } from './field-lab.js?v=20261122-intros';
import { initCliLab } from './cli-lab.js?v=20261122-intros';
import { initCluesLab } from './clues-lab.js?v=20261122-intros';
import { initColdOpen } from './cold-open.js?v=20261122-intros';
import { initPager } from './pager.js?v=20261122-intros';
import { windingColor, windingGradient } from './winding-colors.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const tau = Math.PI * 2;
initPager();


// Draw in CSS pixels; root-font units keep diagram text in step with the page.
// Resize/DPR events schedule one redraw, never a permanent animation loop.
function responsiveCanvas(canvas, draw) {
  const ctx = canvas.getContext('2d');
  const sizing = {w:1,h:1,rem:16};
  let destroyed=false, resizeFrame=0, densityQuery=null, watchedDensity=0;
  function removeDensityListener() {
    if(!densityQuery)return;
    if(densityQuery.removeEventListener)densityQuery.removeEventListener('change',densityChanged);
    else densityQuery.removeListener(densityChanged);
  }
  function watchDensity() {
    const density=window.devicePixelRatio || 1;
    if(density===watchedDensity&&densityQuery)return;
    removeDensityListener();watchedDensity=density;
    densityQuery=window.matchMedia(`(resolution: ${density}dppx)`);
    if(densityQuery.addEventListener)densityQuery.addEventListener('change',densityChanged);
    else densityQuery.addListener(densityChanged);
  }
  function scheduleResize() {
    if(destroyed||resizeFrame)return;
    resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize();});
  }
  function densityChanged() {watchDensity();scheduleResize();}
  function resize() {
    if(destroyed||!ctx)return;
    watchDensity();
    const rect = canvas.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    sizing.w = rect.width; sizing.h = rect.height;
    sizing.rem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
    canvas.width = Math.max(1,Math.round(rect.width*dpr)); canvas.height = Math.max(1,Math.round(rect.height*dpr));
    ctx.setTransform(canvas.width/rect.width,0,0,canvas.height/rect.height,0,0);
    draw(ctx,sizing.w,sizing.h,sizing.rem);
  }
  const observer = typeof ResizeObserver==='undefined'?null:new ResizeObserver(scheduleResize);
  if(observer)observer.observe(canvas);
  window.addEventListener('resize',scheduleResize,{passive:true});
  resize();
  return {
    draw:()=>{if(!destroyed&&ctx)draw(ctx,sizing.w,sizing.h,sizing.rem);}, sizing, resize,
    destroy:()=>{
      destroyed=true;if(observer)observer.disconnect();
      window.removeEventListener('resize',scheduleResize);removeDensityListener();
      if(resizeFrame)cancelAnimationFrame(resizeFrame);
    }
  };
}
function canvasTextLines(ctx,text,maxWidth) {
  const lines=[];let line='';
  for(const word of text.split(/\s+/)){
    const next=line?`${line} ${word}`:word;
    if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}
    else line=next;
  }
  if(line)lines.push(line);
  return lines;
}
function grid(ctx,w,h,spacing=35) {
  ctx.strokeStyle = '#b5d1a409'; ctx.lineWidth = 1;
  for(let x=spacing/2;x<w;x+=spacing)for(let y=spacing/2;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.moveTo(x,y-2);ctx.lineTo(x,y+2);ctx.stroke();}
}

// An illustrative rolled sheet. Its style switches are not CT measurements.
let heroMode = 'layers', rotation = -.36;
const heroCanvas = $('#hero-canvas');
function heroProject(x,y,z,w,h) {
  const cy=Math.cos(rotation),sy=Math.sin(rotation);
  let xx=x*cy+z*sy,zz=-x*sy+z*cy;
  const pitch=.68, cp=Math.cos(pitch),sp=Math.sin(pitch);
  let yy=y*cp-zz*sp; zz=y*sp+zz*cp;
  const roll=-.40,cr=Math.cos(roll),sr=Math.sin(roll);
  const rx=xx*cr-yy*sr, ry=xx*sr+yy*cr;
  const s=Math.min(w/440,h/425)*.91*850/(850+zz);
  return [w*.51+rx*s,h*.48+ry*s,zz];
}
function scrollPoint(t,v) {
  const r=15+3.05*t;
  const ripple=1+.045*Math.sin(t*3+v*3)+.022*Math.sin(t*7-v*8);
  return [r*Math.cos(t)*ripple, v*167+Math.sin(t*1.9)*6*(v*v),r*Math.sin(t)*.86*ripple];
}
function drawHero(ctx,w,h) {
  if(w<2||h<2)return;
  ctx.clearRect(0,0,w,h); grid(ctx,w,h,36);
  const lines=[];
  for(let k=0;k<620;k++){
    const t=.1+k/619*14*Math.PI;
    const mid=scrollPoint(t,0),pm=heroProject(...mid,w,h);
    lines.push({t,depth:pm[2]});
  }
  lines.sort((a,b)=>b.depth-a.depth);
  for(const {t,depth} of lines){
    const light=clamp(32-depth*.075,18,53);
    if(heroMode==='surface')ctx.strokeStyle=`hsla(${42+Math.sin(t*.4)*12},${38+Math.cos(t)*10}%,${light}%,.68)`;
    if(heroMode==='wireframe')ctx.strokeStyle=`hsla(100,8%,${light+12}%,.48)`;
    // This is illustrative position along the roll, not a fitted W field.
    if(heroMode==='layers')ctx.strokeStyle=windingColor((t-.1)/(14*Math.PI)*6,.82,clamp(.84-depth*.0028,.42,1.1));
    ctx.lineWidth=heroMode==='wireframe'?.65:.85;
    ctx.beginPath();
    for(let j=0;j<=16;j++){
      const v=-1+j/8;
      const p=heroProject(...scrollPoint(t,v),w,h);
      if(!j)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
    }
    ctx.stroke();
  }
  // Rims make the single spiralling sheet legible without claiming global W values.
  for(const v of [-1,1]){
    for(let k=0;k<600;k++){
      const t=.1+k/600*14*Math.PI;
      const p=heroProject(...scrollPoint(t,v),w,h),q=heroProject(...scrollPoint(t+14*Math.PI/600,v),w,h);
      const lum=clamp(53-p[2]*.08,30,75);
      ctx.strokeStyle=heroMode==='wireframe'?`hsla(90,12%,${lum}%,.9)`:heroMode==='layers'?windingColor((t-.1)/(14*Math.PI)*6,.95,clamp(1.05-p[2]*.0014,.7,1.25)):`hsla(65,43%,${lum}%,.9)`;
      ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
    }
  }
  if(heroMode==='wireframe'){
    ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle='#cee0c1';ctx.setLineDash([3,5]);
    ctx.beginPath();ctx.ellipse(w*.5,h*.48,w*.29,h*.13,-.38,0,tau);ctx.stroke();ctx.restore();
  }
}
const hero = responsiveCanvas(heroCanvas,drawHero);
$$('[data-hero-mode]').forEach(b=>b.addEventListener('click',()=>{
  heroMode=b.dataset.heroMode;
  $$('[data-hero-mode]').forEach(el=>{const active=el===b;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  hero.draw();
}));
const heroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let dragStart=null, spinPaused=false, heroVisible=false, heroFrame=0, lastHeroFrame=0;
function updateHeroMotion() {
  cancelAnimationFrame(heroFrame);heroFrame=0;lastHeroFrame=0;
  heroCanvas.setAttribute('aria-label',`Illustrative scroll. Drag or use arrow keys to rotate. ${heroMotion.matches?'Automatic rotation disabled by reduced-motion preference.':spinPaused?'Automatic rotation paused. Press Space to resume.':'Press Space to pause automatic rotation.'}`);
  if(!heroVisible||document.hidden||heroMotion.matches||spinPaused||dragStart)return;
  heroFrame=requestAnimationFrame(animateHero);
}
function animateHero(now) {
  if(!lastHeroFrame)lastHeroFrame=now;
  if(now-lastHeroFrame>=1000/30){
    // Rotate about model Y (the strip's long axis), with a 24-second full turn.
    rotation=(rotation+(now-lastHeroFrame)*tau/24000)%tau;hero.draw();
    lastHeroFrame=now;
  }
  heroFrame=requestAnimationFrame(animateHero);
}
heroCanvas.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();spinPaused=!spinPaused;updateHeroMotion();}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotation+=(e.key==='ArrowLeft'?-1:1)*Math.PI/5;hero.draw();}
});
heroCanvas.addEventListener('pointerdown',e=>{dragStart={x:e.clientX,y:e.clientY,rotation};if(e.pointerType==='mouse')heroCanvas.setPointerCapture(e.pointerId);updateHeroMotion();});
heroCanvas.addEventListener('pointermove',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;if(Math.abs(dx)>Math.abs(dy)){rotation=dragStart.rotation+dx*.008;hero.draw();}});
function endHeroDrag(){dragStart=null;updateHeroMotion();}
window.addEventListener('pointerup',endHeroDrag);
window.addEventListener('pointercancel',endHeroDrag);
heroMotion.addEventListener('change',updateHeroMotion);
document.addEventListener('visibilitychange',updateHeroMotion);
new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;updateHeroMotion();}).observe(heroCanvas);

function pipelineSVG(mode){
  let shapes='';
  if(mode==='scan'){
    for(let i=0;i<5;i++){const x=45+i*10,y=102-i*15;shapes+=`<path d="M${x} ${y}l74 15 35-28-74-15z" stroke="#a6c08b" fill="#192a1955" opacity="${.35+i*.14}"/>`;}
  }else if(mode==='field'){
    for(let i=0;i<7;i++)shapes+=`<path d="M25 ${32+i*15} C75 ${2+i*15},125 ${65+i*15},205 ${27+i*15}" stroke="${windingColor(i)}" stroke-width="1.7"/>`;
    shapes+='<circle cx="122" cy="79" r="4" fill="#d3f87a"/><path d="M122 79v-31" stroke="#d3f87a" stroke-dasharray="3 3"/>';
  }else if(mode==='flatten'){
    shapes+='<path d="M20 60 Q60 10 90 60 L90 125 Q55 75 20 125Z" fill="#23351b" stroke="#9ac36e"/><path d="M120 55l85-18v78l-85 18z" fill="#26371d" stroke="#d3f87a"/><path d="M98 85h15m-5-4 5 4-5 4" stroke="#d3f87a"/>';
    for(let i=1;i<5;i++)shapes+=`<path d="M${120+i*17} ${55-i*3.6}v78" stroke="#647b48"/>`;
  }else if(mode==='ink'){
    for(let i=0;i<12;i++)shapes+=`<path d="M30 ${30+i*9}Q100 ${10+i*9} 195 ${27+i*9}" stroke="#677c5155"/>`;
    for(let i=0;i<5;i++)shapes+=`<rect x="${52+i*27}" y="${67+(i%2)*12}" width="8" height="${14+i*2}" fill="#d3f87a" opacity="${.5+i*.1}"/>`;
    shapes+='<circle cx="117" cy="77" r="44" stroke="#d3f87a"/><path d="M150 108l26 28" stroke="#d3f87a" stroke-width="3"/>';
  }else{
    shapes+='<path d="M40 27h144v112H40z" fill="#1a2818" stroke="#536847"/>';
    for(let i=0;i<5;i++)shapes+=`<path d="M58 ${47+i*16}h${102-i%2*28}" stroke="#8b9d7e" stroke-width="2" stroke-dasharray="11 4 5 3"/>`;
    shapes+='<circle cx="178" cy="119" r="22" fill="#202f18" stroke="#d3f87a"/><path d="m166 119 8 8 17-19" stroke="#d3f87a" stroke-width="2"/>';
  }
  return `<svg viewBox="0 0 230 165" fill="none" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
}
$$('[data-pipe-graphic]').forEach(el=>{el.innerHTML=pipelineSVG(el.dataset.pipeGraphic);});

initCluesLab();
initColdOpen();
initFieldLab();
initCliLab();
// The "five knobs" notebook link sits in the command builder's form column.
{const knobs=document.querySelector('#p-code-2 .page-body > details.deep-dive'),configs=document.querySelector('#cli-lab .cli-configs');if(knobs&&configs)configs.after(knobs);}
initSdkWorkbench();
initInkLab();
initCompactLabs();
initInkPrimer();

// Real numerical computation on a tiny synthetic graph. The full Python core is not loaded.
const NX=12,NY=6,N=NX*NY;
$$('.legend-spectrum').forEach(swatch=>{swatch.style.background=windingGradient;});
let solverState,solverGeneration=0,solverRunning=false;
// Labels report the actual iterate. In this toy sheet_step = 1, so W = phi.
function formatSolverValue(value){
  if(!Number.isFinite(value))return '—';
  const label=value.toFixed(2);
  return label==='-0.00'?'0.00':label;
}
$('#solver-values-table').insertAdjacentHTML('beforeend',`<thead><tr><th scope="col">Row / sample</th>${Array.from({length:NX},(_,col)=>`<th scope="col">${col+1}</th>`).join('')}</tr></thead><tbody>${Array.from({length:NY},(_,row)=>`<tr><th scope="row">${row+1}</th>${Array.from({length:NX},(_,col)=>`<td data-solver-node="${row*NX+col}">0.00</td>`).join('')}</tr>`).join('')}</tbody>`);
const solverValueCells=$$('[data-solver-node]');
// Keep horizontal navigation explicit for keyboard users, including framed previews.
$$('.solver-chart-scroll, .solver-values-scroll').forEach(scroller=>{
  scroller.addEventListener('keydown',event=>{
    if(event.target!==scroller||event.altKey||event.ctrlKey||event.metaKey||scroller.scrollWidth<=scroller.clientWidth)return;
    const step=(parseFloat(getComputedStyle(document.documentElement).fontSize)||16)*4;
    if(event.key==='ArrowRight')scroller.scrollLeft+=step;
    else if(event.key==='ArrowLeft')scroller.scrollLeft-=step;
    else if(event.key==='Home')scroller.scrollLeft=0;
    else if(event.key==='End')scroller.scrollLeft=scroller.scrollWidth;
    else return;
    event.preventDefault();
  });
});
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function makeSystem(){
  const weight=Number($('#solver-weight').value),noise=Number($('#solver-noise').value),bad=$('#solver-bad').checked;
  const edges=[],diagonal=new Float64Array(N),rhs=new Float64Array(N);
  const add=(a,b,w,d,type)=>{edges.push({a,b,w,d,type});diagonal[a]+=w;diagonal[b]+=w;rhs[a]-=w*d;rhs[b]+=w*d;};
  for(let row=0;row<NY;row++)for(let col=0;col<NX;col++){
    const a=row*NX+col;
    if(col<NX-1){add(a,a+1,1,noise*(.65*Math.sin(col*.63+row*.4)+.35*Math.cos(col*1.7+row)), 'gradient');if(weight>0)add(a,a+1,weight,0,'fibre');}
    if(row<NY-1)add(a,a+NX,1,1+noise*.25*Math.sin(col*.8+row*.9),'gradient');
  }
  if(bad)add(1*NX+5,4*NX+7,8,1,'bad');
  // Dirichlet gauge: node zero is fixed to zero; free nodes retain incident edge diagonals.
  diagonal[0]=1;rhs[0]=0;
  function apply(v){const out=new Float64Array(N);for(const {a,b,w} of edges){const d=w*(v[a]-v[b]);out[a]+=d;out[b]-=d;}out[0]=v[0];return out;}
  const phi=new Float64Array(N),r=rhs.slice(),z=r.map((v,i)=>v/diagonal[i]),p=z.slice(),normB=Math.sqrt(dot(rhs,rhs));
  solverState={edges,diagonal,rhs,apply,phi,r,z,p,normB,rz:dot(r,z),iteration:0,residual:1,done:false,bad};
  $('#solver-weight-value').value=weight.toFixed(1);$('#solver-noise-value').value=noise.toFixed(2);
}
function solverMetrics(){
  let total=0,count=0;
  for(let row=0;row<NY;row++)for(let col=0;col<NX-1;col++){const a=row*NX+col,d=solverState.phi[a+1]-solverState.phi[a];total+=d*d;count++;}
  return {drift:Math.sqrt(total/count)};
}
function renderSolverStats(){
  const {iteration,residual}=solverState;
  $('#solver-iteration').textContent=String(iteration);
  $('#solver-residual').textContent=residual.toExponential(2);
  $('#solver-drift').textContent=solverMetrics().drift.toFixed(3);
  solverValueCells.forEach((cell,i)=>{
    cell.textContent=formatSolverValue(solverState.phi[i]);
    cell.classList.toggle('is-conflict',solverState.bad&&(i===1*NX+5||i===4*NX+7));
  });
}
function finishSolve(){
  solverState.done=true;solverRunning=false;
  $('#solver-run').innerHTML='Run again <span>↻</span>';$('#solver-step').disabled=true;
  $('#solver-status').textContent=solverState.bad?'Converged with the wrong relationship. A small residual says the equations are solved, not that the geometry is correct. Compare the distorted field with a clean run.':'Converged. The equations are solved to the chosen tolerance. Compare along-row drift, then inject a wrong relationship and run again.';
  window.dispatchEvent(new CustomEvent('lab-progress',{detail:'solver'}));
}
function pcgStep(){
  const s=solverState;if(s.done)return;
  const ap=s.apply(s.p),denom=dot(s.p,ap);
  if(!Number.isFinite(denom)||denom<=0){s.done=true;solverRunning=false;$('#solver-status').textContent='Numerical breakdown in the toy solve. Reset to start again.';$('#solver-run').innerHTML='Reset and run <span>↻</span>';return;}
  const alpha=s.rz/denom;
  for(let i=1;i<N;i++){s.phi[i]+=alpha*s.p[i];s.r[i]-=alpha*ap[i];}
  s.iteration++;
  s.residual=Math.sqrt(dot(s.r,s.r))/s.normB;
  if(s.residual<1e-7){
    const actual=s.apply(s.phi),trueR=s.rhs.map((b,i)=>b-actual[i]);trueR[0]=0;
    s.residual=Math.sqrt(dot(trueR,trueR))/s.normB;
    if(Number.isFinite(s.residual)&&s.residual<1e-7){finishSolve();return;}
    // Restart from the true residual if recurrence round-off was optimistic.
    s.r=trueR;s.z=s.r.map((v,i)=>v/s.diagonal[i]);s.p=s.z.slice();s.rz=dot(s.r,s.z);
    if(Number.isFinite(s.residual)&&s.iteration<150)return;
  }
  if(!Number.isFinite(s.residual)||s.iteration>=150){
    s.done=true;solverRunning=false;$('#solver-step').disabled=true;
    $('#solver-run').innerHTML='Reset and run <span>↻</span>';
    $('#solver-status').textContent=Number.isFinite(s.residual)?'Iteration limit reached; not converged. Reset or adjust the constraints to try again.':'Numerical breakdown; not converged. Reset to try again.';
    return;
  }
  s.z=s.r.map((v,i)=>v/s.diagonal[i]);const next=dot(s.r,s.z),beta=next/s.rz;
  for(let i=1;i<N;i++)s.p[i]=s.z[i]+beta*s.p[i];s.p[0]=0;s.rz=next;
}
function nodePosition(row,col,w,h,rem=16){
  const padding=rem*2.25,top=rem*4,bottom=rem*1.75;
  const x=padding+col/(NX-1)*(w-padding*2);
  const wave=Math.sin(col/(NX-1)*tau)*rem*.875+Math.sin(col*.8+row*.05)*rem*.4375;
  return [x,top+row/(NY-1)*(h-top-bottom)+wave];
}
const fieldColor=windingColor;
function drawSolver(ctx,w,h,rem=16){
  if(w<2||h<2)return;
  ctx.clearRect(0,0,w,h);grid(ctx,w,h,rem*1.75);if(!solverState)return;
  const fontSize=rem,labelHeight=rem*1.5,nodeRadius=rem*.29;
  ctx.font=`500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textBaseline='middle';ctx.textAlign='center';
  const badNodes=new Set(solverState.edges.filter(edge=>edge.type==='bad').flatMap(edge=>[edge.a,edge.b]));
  for(const {a,b,type} of solverState.edges){
    if(type==='fibre')continue;
    const pa=nodePosition(Math.floor(a/NX),a%NX,w,h,rem),pb=nodePosition(Math.floor(b/NX),b%NX,w,h,rem);
    ctx.beginPath();ctx.moveTo(...pa);ctx.lineTo(...pb);
    ctx.strokeStyle=type==='bad'?'#ff9374':fieldColor((solverState.phi[a]+solverState.phi[b])/2,type==='gradient'&&b===a+1?.7:.2);
    ctx.lineWidth=(type==='bad'?2:1)*rem/16;
    if(type==='bad')ctx.setLineDash([rem*.3125,rem*.25]);ctx.stroke();ctx.setLineDash([]);
  }
  for(let i=0;i<N;i++){
    const p=nodePosition(Math.floor(i/NX),i%NX,w,h,rem),v=solverState.phi[i],bad=badNodes.has(i);
    ctx.beginPath();ctx.arc(...p,nodeRadius,0,tau);ctx.fillStyle=fieldColor(v);ctx.fill();
    if(i===0||bad){ctx.beginPath();ctx.arc(...p,nodeRadius+rem*.24,0,tau);ctx.strokeStyle=bad?'#ff9374':'#ede9db';ctx.lineWidth=rem*.1;ctx.stroke();}
    const label=formatSolverValue(v),labelWidth=ctx.measureText(label).width+rem*.625;
    const labelX=p[0]-labelWidth/2,labelY=p[1]-nodeRadius-rem*.45-labelHeight;
    ctx.beginPath();ctx.roundRect(labelX,labelY,labelWidth,labelHeight,rem*.3);
    ctx.fillStyle=bad?'#321c16':'#0a150e';ctx.fill();
    ctx.strokeStyle=bad?'#ff9374':i===0?'#ede9db':fieldColor(v,.65);ctx.lineWidth=rem*.0625;ctx.stroke();
    ctx.fillStyle=bad?'#ffc4ad':'#e9f0e2';ctx.fillText(label,p[0],labelY+labelHeight/2+rem*.03);
  }
}
makeSystem();const solverCanvas=responsiveCanvas($('#solver-canvas'),drawSolver);renderSolverStats();
function resetSolver(){solverGeneration++;solverRunning=false;makeSystem();renderSolverStats();solverCanvas.draw();$('#solver-step').disabled=false;$('#solver-run').innerHTML='Run the solver <span>▶</span>';$('#solver-status').textContent='Ready. The field starts at zero. Run or step through the fit.';}
function runSolver(){
  if(solverRunning){solverRunning=false;solverGeneration++;$('#solver-run').innerHTML='Continue <span>▶</span>';$('#solver-status').textContent='Paused. The current field and numerical state are preserved.';return;}
  if(solverState.done)resetSolver();
  solverRunning=true;const generation=++solverGeneration;$('#solver-run').innerHTML='Pause <span>Ⅱ</span>';$('#solver-status').textContent='Solving the actual toy system in this browser…';
  function tick(){if(generation!==solverGeneration||!solverRunning)return;const steps=reducedMotion?8:1;for(let i=0;i<steps&&!solverState.done;i++)pcgStep();renderSolverStats();solverCanvas.draw();if(solverRunning)setTimeout(tick,reducedMotion?0:65);}
  tick();
}
$('#solver-run').addEventListener('click',runSolver);
$('#solver-step').addEventListener('click',()=>{if(solverRunning){solverGeneration++;solverRunning=false;$('#solver-run').innerHTML='Continue <span>▶</span>';}pcgStep();renderSolverStats();solverCanvas.draw();if(!solverState.done)$('#solver-status').textContent=`Iteration ${solverState.iteration}. The field is being updated to reconcile the weighted constraints.`;});
$('#solver-reset').addEventListener('click',resetSolver);
['solver-weight','solver-noise','solver-bad'].forEach(id=>document.getElementById(id).addEventListener('input',resetSolver));

// A material-coordinate-preserving morph for teaching. This is not a flattening algorithm.
let unwrapFraction=0,unwrapMask=false,unwrapAnimation=0;
function surfaceProject(u,v,w,h){
  const a=(u-.5)*Math.PI*1.5,curveX=Math.sin(a)*145,curveZ=(1-Math.cos(a))*120;
  const x=lerp(curveX,(u-.5)*450,unwrapFraction),y=(v-.5)*235;
  const z=curveZ*(1-unwrapFraction)+Math.sin(v*Math.PI*2)*13*(1-unwrapFraction);
  const yaw=lerp(-.16,0,unwrapFraction),xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
  const pitch=lerp(.34,.03,unwrapFraction),yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);
  const scale=Math.min(w/550,h/330)*.94*850/(850+depth);
  const roll=lerp(-.12,0,unwrapFraction),xr=xx*Math.cos(roll)-yy*Math.sin(roll),yr=xx*Math.sin(roll)+yy*Math.cos(roll);
  return [w*.5+xr*scale,h*.50+yr*scale,depth];
}
function cellKind(u,v){
  const missing=((u-.73)/.12)**2+((v-.43)/.23)**2<1;
  const dark=((u-.27)/.08)**2+((v-.69)/.16)**2<1;
  return {missing,dark};
}
function drawUnwrap(ctx,w,h,rem=16){
  if(w<2||h<2)return;
  ctx.clearRect(0,0,w,h);grid(ctx,w,h,rem*2);
  const fontSize=rem*.875,inset=rem,lineHeight=fontSize*1.4;
  ctx.font=`${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const footerLines=canvasTextLines(ctx,'SYNTHETIC PATTERN / FIXED MATERIAL COORDINATES',Math.max(fontSize,w-inset*2));
  const footerTop=h-inset-footerLines.length*lineHeight;
  const cols=58,rows=28,cells=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const u=x/cols,v=y/rows,mid=surfaceProject(u+.5/cols,v+.5/rows,w,h);
    cells.push({u,v,depth:mid[2],x,y});
  }
  cells.sort((a,b)=>b.depth-a.depth);
  for(const {u,v,x,y} of cells){
    const p=[surfaceProject(u,v,w,h),surfaceProject(u+1/cols,v,w,h),surfaceProject(u+1/cols,v+1/rows,w,h),surfaceProject(u,v+1/rows,w,h)];
    const kind=cellKind(u+.5/cols,v+.5/rows);
    let fill;
    if(kind.missing)fill=unwrapMask?((x+y)%2?'#a55f4e':'#e69a7e'):'#111711';
    else if(kind.dark)fill='#151d12';
    else{
      const stripe=Math.floor(u*13)%3===0,light=35+Math.sin(y*5+x*7)*3+Math.sin(u*18)*3;
      fill=stripe?`hsl(79,51%,${light+20}%)`:`hsl(78,22%,${light}%)`;
    }
    ctx.fillStyle=fill;ctx.strokeStyle=fill;ctx.lineWidth=.6;ctx.beginPath();p.forEach((pt,i)=>i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]));ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.strokeStyle='#d7edbd3b';ctx.lineWidth=.7;
  for(let j=0;j<=8;j++){
    ctx.beginPath();for(let i=0;i<=60;i++){const p=surfaceProject(i/60,j/8,w,h);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();
  }
  for(let j=0;j<=12;j++){
    ctx.beginPath();for(let i=0;i<=30;i++){const p=surfaceProject(j/12,i/30,w,h);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();
  }
  const labelPaddingX=rem*.5,labelPaddingY=rem*.375,labelLineHeight=fontSize*1.25;
  function makeLabel(u,v,text,color){
    const point=surfaceProject(u,v,w,h),lines=canvasTextLines(ctx,text,Math.max(fontSize,w-inset*2-labelPaddingX*2));
    const width=Math.max(...lines.map(line=>ctx.measureText(line).width))+labelPaddingX*2,height=lines.length*labelLineHeight+labelPaddingY*2;
    return {point,lines,color,width,height,x:clamp(point[0]-width/2,inset,w-inset-width),y:clamp(point[1]-height/2,inset,footerTop-inset-height)};
  }
  const labels=[makeLabel(.27,.69,'VALID DARK SIGNAL','#d3f87a'),makeLabel(.73,.43,unwrapMask?'UNMAPPED':'DARK PIXELS',unwrapMask?'#f5b39a':'#d3f87a')];
  const [first,second]=labels,gap=rem*.5;
  if(first.x<second.x+second.width+gap&&first.x+first.width+gap>second.x&&first.y<second.y+second.height+gap&&first.y+first.height+gap>second.y){
    const above=first.y-second.height-gap,below=first.y+first.height+gap;
    if(above>=inset)second.y=above;
    else if(below+second.height<=footerTop-inset)second.y=below;
  }
  for(const label of labels){
    const [px,py]=label.point,joinX=clamp(px,label.x,label.x+label.width),joinY=clamp(py,label.y,label.y+label.height);
    if(Math.hypot(px-joinX,py-joinY)>1){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(joinX,joinY);ctx.strokeStyle=label.color;ctx.lineWidth=rem/16;ctx.stroke();}
    ctx.fillStyle='#0c100ff0';ctx.fillRect(label.x,label.y,label.width,label.height);
    ctx.strokeStyle='#53664b';ctx.lineWidth=rem/20;ctx.strokeRect(label.x,label.y,label.width,label.height);
    ctx.fillStyle=label.color;ctx.textAlign='left';ctx.textBaseline='middle';
    label.lines.forEach((line,i)=>ctx.fillText(line,label.x+labelPaddingX,label.y+labelPaddingY+labelLineHeight*(i+.5)));
  }
  ctx.fillStyle='#a9bba1';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  footerLines.forEach((line,i)=>ctx.fillText(line,inset,h-inset-(footerLines.length-1-i)*lineHeight));
}
const unwrapCanvas=responsiveCanvas($('#unwrap-canvas'),drawUnwrap);
function updateUnwrap(){
  $('#unwrap-value').value=`${Math.round(unwrapFraction*100)}%`;
  $('#unwrap-range').value=Math.round(unwrapFraction*100);
  unwrapCanvas.draw();
  $('#unwrap-status').textContent=unwrapMask?'In this synthetic example, the peach patch is unmapped. The other dark patch is a valid sample. Real products can encode additional validity states.':unwrapFraction>.8?'Now turn on the validity mask to distinguish mapped samples from missing data.':'Follow the stripes: the same material coordinates stay together as the illustration opens.';
  if(unwrapFraction>.8&&unwrapMask)window.dispatchEvent(new CustomEvent('lab-progress',{detail:'unwrap'}));
}
$('#unwrap-range').addEventListener('input',e=>{unwrapAnimation++;unwrapFraction=Number(e.target.value)/100;$('#unwrap-play').innerHTML=unwrapFraction>.95?'Roll it back <span>↺</span>':'Unwrap it <span>→</span>';updateUnwrap();});
$('#unwrap-mask').addEventListener('change',e=>{unwrapMask=e.target.checked;updateUnwrap();});
$('#unwrap-play').addEventListener('click',()=>{
  const target=unwrapFraction>.95?0:1,start=unwrapFraction,started=performance.now(),generation=++unwrapAnimation;
  $('#unwrap-play').innerHTML=target===1?'Roll it back <span>↺</span>':'Unwrap it <span>→</span>';
  if(reducedMotion){unwrapFraction=target;updateUnwrap();return;}
  function frame(now){if(generation!==unwrapAnimation)return;const t=clamp((now-started)/1400,0,1),e=t*t*(3-2*t);unwrapFraction=lerp(start,target,e);updateUnwrap();if(t<1)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
});
