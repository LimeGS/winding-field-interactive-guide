import {makeFragment} from './ink-model.js?v=20261123-perf';

const lessons = [
  ['01 / THE INPUT','Keep the depth. Follow the surface.',
   'Sample CT along the surface normals to make a stack around the reconstructed surface: a surface volume. A small 3D patch preserves clues above and below the surface that one flattened slice would discard.',
   'Scrub the depth. The geometry provides an address; it does not label ink.'],
  ['02 / THE SUPERVISION','Unlabelled is an unanswered question.',
   'An ink label tells the model what to predict. A separate supervision mask tells the loss where that label is trusted. Inside it, both ink and clean background teach the detector. Outside it, pixels are ignored.',
   'Reveal the mask. The teaching region is deliberately smaller than the fragment. A held-out region stays outside training.'],
  ['03 / THE NETWORK','Learn a rule. Reuse it elsewhere.',
   'One shared 9 µm model family takes 17 slices, combines local depth features in a 3D stem, then feeds a 2D U-Net. The encoder gathers context; decoder connections bring fine spatial detail back into the ink map.',
   'Switch operations. Training adds a loss and a weight update. Inference applies the saved weights to new CT.'],
  ['04 / THE OUTPUT','A score is an invitation to investigate.',
   'At inference, overlapping patches produce scores that are blended into a map. Inspect repeatable strokes, background false positives and reserved evidence. A threshold can make the same output look dramatically different.',
   'Move the display cutoff. This schematic includes a false-positive blob: a confident-looking mark can still be wrong.']
];

// All imagery here is an explicit synthetic schematic, separate from the trainable lab.
export function primerPixels(fragment,{depth=8,view='ct',cutoff=.3}={}) {
  const rgba=new Uint8ClampedArray(fragment.w*fragment.h*4);
  for(let i=0;i<fragment.valid.length;i++) {
    let color=[11,16,13];
    if(fragment.valid[i]) {
      const x=i%fragment.w*216/fragment.w,y=Math.floor(i/fragment.w)*144/fragment.h;
      const trusted=x>24&&x<103&&y>35&&y<105;
      const z=Math.max(0,Math.min(2,depth/8)),a=Math.floor(z),b=Math.min(2,a+1);
      const ct=fragment.slices[a][i]*(1-z+a)+fragment.slices[b][i]*(z-a);
      const truth=fragment.truth[i];
      const score=Math.max(0,Math.min(1,.08+truth*.76+.05*Math.sin(x*.7+y*.3)+.58*Math.exp(-((x-163)**2+(y-111)**2)/55)));
      color=[ct*225,ct*230,ct*224];
      if(view==='labels')color=trusted?(truth>.4?[255,145,121]:[32,48,39]):[57,65,57];
      if(view==='mask')color=trusted?[181,229,125]:[32,39,33];
      if(view==='map')color=score>=cutoff?[score*240,score*245,score*228]:[11,16,13];
    }
    rgba.set([...color,255],i*4);
  }
  return rgba;
}

export function initInkPrimer() {
  const root=document.getElementById('ink-primer');if(!root)return;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  const fragment=makeFragment(17,3),scratch=document.createElement('canvas');
  scratch.width=fragment.w;scratch.height=fragment.h;
  const sx=scratch.getContext('2d'),tabs=[...root.querySelectorAll('[data-primer-step]')];
  let step=0,depth=8,mask=false,training=true,cutoff=.3,oldWidth=0;
  const $=s=>root.querySelector(s);
  function text(value,x,y,size=13,color='#bac6b6') {const r=canvas.getBoundingClientRect().width,m=ctx.getTransform(),k=Math.hypot(m.a,m.b)*(r/canvas.width);if(k>0&&size*k<12)size=12/k;ctx.fillStyle=color;ctx.font=`${size}px system-ui,sans-serif`;ctx.fillText(value,x,y);}
  function box(x,y,w,h,label,color='#d3f87a') {ctx.fillStyle='#172218';ctx.strokeStyle=color;ctx.lineWidth=1;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);text(label,x+10,y+h/2+5,13,color);}
  function arrow(x1,y1,x2,y2,color='#d3f87a') {ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2-7*Math.cos(a-.5),y2-7*Math.sin(a-.5));ctx.lineTo(x2,y2);ctx.lineTo(x2-7*Math.cos(a+.5),y2-7*Math.sin(a+.5));ctx.stroke();}
  function image(view,x,y,w,h,d=depth) {sx.putImageData(new ImageData(primerPixels(fragment,{view,depth:d,cutoff}),fragment.w,fragment.h),0,0);ctx.drawImage(scratch,x,y,w,h);}
  function draw() {
    const narrow=canvas.clientWidth<500,w=narrow?360:600,h=step===2&&narrow?365:330;
    const ratio=Math.min(devicePixelRatio||1,3),scale=canvas.clientWidth/w*ratio;
    canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);canvas.style.aspectRatio=`${w}/${h}`;
    ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#0b100d';ctx.fillRect(0,0,w,h);
    const x=20,gap=narrow?24:40,pw=(w-40-gap)/2,ph=pw*2/3,right=x+pw+gap,top=narrow?92:76;
    if(step===0) {
      text('SURFACE VOLUME',x,32,13,'#d3f87a');text('SELECTED SLICE',right,32,13,'#d3f87a');
      for(let k=4;k>=0;k--){ctx.strokeStyle='#526446';ctx.strokeRect(x+k*3,top-k*5,pw,ph);}
      image('ct',x,top,pw,ph);ctx.strokeStyle='#d3f87a';ctx.strokeRect(x,top,pw,ph);
      image('ct',right,top,pw,ph);text(`Slice ${depth+1} / 17`,right,top+ph+28,13,'#e9ecde');
      text('x, y: along the surface',x,h-47,12);text('z: through the surface',x,h-25,12);
    } else if(step===1) {
      text('INK LABELS',x,32,13,'#ff9179');text('SUPERVISION MASK',right,32,13,'#d3f87a');
      image('labels',x,top,pw,ph);image(mask?'mask':'ct',right,top,pw,ph);
      text('Coral: known ink',x,top+ph+30,12,'#ff9179');text(mask?'Lime: trusted pixels':'Reveal which pixels count',right,top+ph+30,12,mask?'#d3f87a':'#bac6b6');
      text('The rest of the fragment contributes no training loss.',x,h-25,narrow?11:13);
    } else if(step===2) {
      if(narrow) {
        [['17-slice CT patch','#bac6b6'],['Local 3D stem','#93caca'],['2D U-Net: context + detail','#d3f87a'],['2D ink scores','#e9ecde']].forEach(([label,color],i)=>{box(28,18+i*65,w-56,44,label,color);if(i<3)arrow(w/2,64+i*65,w/2,79+i*65);});
        text(training?'Labels → loss → weight update':'New CT → saved weights → scores',28,314,13,training?'#ff9179':'#93caca');
        text(training?'Repeat with ink and background examples.':'Weights remain fixed during inference.',28,342,12);
      } else {
        box(15,88,108,100,'17 CT slices','#bac6b6');arrow(125,138,151,138);
        box(155,88,103,100,'3D stem','#93caca');arrow(261,138,285,138);
        box(290,59,151,160,'2D U-Net');
        for(let k=0;k<3;k++){ctx.strokeStyle='#7b9456';ctx.strokeRect(304+k*17,77+k*12,20,22);ctx.strokeRect(404-k*17,77+k*12,20,22);ctx.beginPath();ctx.moveTo(324+k*17,88+k*12);ctx.lineTo(404-k*17,88+k*12);ctx.stroke();}
        text('context + detail',308,194,12);arrow(445,138,468,138);box(472,88,111,100,'Ink scores','#e9ecde');
        if(training){box(392,257,188,38,'Compare with labels','#ff9179');arrow(528,190,528,252,'#ff9179');arrow(389,276,208,276,'#ff9179');arrow(208,276,208,192,'#ff9179');text('loss → gradients → update weights',31,318,13,'#ff9179');}
        else{text('New CT patches pass through the saved detector.',30,275,15,'#93caca');text('No loss calculation or optimizer step is needed.',30,305,13);}
      }
    } else {
      text('OVERLAPPING CT PATCHES',x,32,narrow?11:13,'#93caca');text('BLENDED INK SCORES',right,32,narrow?11:13,'#d3f87a');
      image('ct',x,top,pw,ph);image('map',right,top,pw,ph);
      ctx.strokeStyle='#93caca';ctx.setLineDash([4,4]);for(let k=0;k<3;k++)ctx.strokeRect(x+pw*.12+k*pw*.19,top+ph*.24,pw*.35,ph*.5);ctx.setLineDash([]);
      text(`Display cutoff: ${cutoff.toFixed(2)}`,right,top+ph+28,12,'#e9ecde');
      text('Compare strokes, depth windows and background.',x,h-25,narrow?11:13);
    }
  }
  function render() {
    const [kicker,title,description,detail]=lessons[step];
    $('#primer-kicker').textContent=kicker;$('#primer-title').textContent=title;$('#primer-description').textContent=description;$('#primer-detail').textContent=detail;
    tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===step));b.tabIndex=i===step?0:-1;});
    $('#primer-panel').setAttribute('aria-labelledby',`primer-tab-${step}`);
    root.querySelectorAll('[data-primer-controls]').forEach(e=>e.hidden=Number(e.dataset.primerControls)!==step);
    canvas.setAttribute('aria-label',`${title} ${detail} Synthetic schematic.`);draw();
  }
  tabs.forEach((b,i)=>b.addEventListener('click',()=>{step=i;render();}));
  $('.primer-tabs').addEventListener('keydown',e=>{const i=tabs.indexOf(document.activeElement);if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();step=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:-1)+4)%4;render();tabs[step].focus();});
  $('#primer-depth').addEventListener('input',e=>{depth=Number(e.target.value);$('#primer-depth-value').textContent=`${depth+1} / 17`;draw();});
  $('#primer-mask').addEventListener('click',e=>{mask=!mask;e.currentTarget.setAttribute('aria-pressed',String(mask));e.currentTarget.textContent=mask?'Hide the supervision mask':'Reveal the supervision mask';draw();});
  root.querySelectorAll('[data-primer-operation]').forEach(b=>b.addEventListener('click',()=>{training=b.dataset.primerOperation==='train';root.querySelectorAll('[data-primer-operation]').forEach(e=>e.setAttribute('aria-pressed',String((e.dataset.primerOperation==='train')===training)));$('#primer-operation-note').textContent=training?'Training compares scores with trusted labels, then updates the weights.':'Inference uses the saved weights. New fragments do not update them.';draw();}));
  $('#primer-cutoff').addEventListener('input',e=>{cutoff=Number(e.target.value)/100;$('#primer-cutoff-value').textContent=cutoff.toFixed(2);draw();});
  new ResizeObserver(()=>{if(canvas.clientWidth!==oldWidth){oldWidth=canvas.clientWidth;draw();}}).observe(canvas.parentElement);
  render();
}
