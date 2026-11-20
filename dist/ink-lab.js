import {INK_WIDTH as W,INK_HEIGHT as H,makeFragment,paintMask,collectLabels,exampleMask,InkNetwork,random} from './ink-model.js?v=20261120-publish';
const minFont=(c,px)=>{const r=c.canvas.getBoundingClientRect().width,m=c.getTransform(),k=Math.hypot(m.a,m.b)*(r/c.canvas.width);return k>0&&px*k<12?Math.ceil(12/k):px;};

export function initInkLab() {
  const root=document.getElementById('ink-lab');if(!root)return;
  root.innerHTML=`
    <div class="ink-lab-top"><span>EXPERIMENT 04 / THE INK LAB</span><span>PAINT → LEARN → PREDICT</span></div>
    <div class="ink-lab-heading"><h3>Teach a model what to look for.</h3><p>Make a few careful labels. Follow the learning loop. Send the trained network to a fragment it has never seen.</p></div>
    <nav class="ink-lab-steps" aria-label="Ink experiment stages"><button data-stage="0" aria-current="step"><span>01</span> Make a mask</button><button data-stage="1" disabled><span>02</span> Train the model</button><button data-stage="2" disabled><span>03</span> Test a fragment</button></nav>
    <div class="ink-lab-body">
      <div data-panel="0">
        <p><strong>Paint coral over known ink strokes, then mint over clean papyrus.</strong> Unpainted pixels stay unknown and never become background labels. This high-contrast reference plays the role of aligned, visible evidence.</p>
        <div class="ink-lab-grid">
          <div class="ink-lab-panel"><h4>FRAGMENT A / YOUR TRAINING LABELS</h4><canvas id="ink-paint" class="ink-canvas ink-paint" width="1296" height="864" tabindex="0" role="img" aria-label="Synthetic papyrus reference. Paint ink and background labels with a pointer, or move the cursor with arrow keys and press Space to paint." aria-describedby="ink-paint-help"></canvas>
          <div class="ink-tools" role="group" aria-label="Training mask brush"><button class="ink-tool" data-tool="1" aria-pressed="true">Ink</button><button class="ink-tool" data-tool="0" aria-pressed="false">Background</button><button class="ink-tool" data-tool="-1" aria-pressed="false">Erase</button></div>
          <label class="ink-label-control">Brush size <input id="ink-brush" type="range" min="2" max="12" value="4"><output id="ink-brush-value">4</output></label>
          <div class="ink-mask-counts"><span id="ink-positive">0 ink pixels</span><span id="ink-negative">0 background pixels</span><span>Unpainted = ignored</span></div>
          <p id="ink-paint-help" class="ink-caption">Mouse or touch to paint. Keyboard: arrow keys move the ring; Space paints. Label at least 20 pixels of each class.</p>
          <div class="ink-tools"><button class="ink-secondary" id="ink-example">Add example labels</button><button class="ink-secondary" id="ink-clear">Clear mask</button></div></div>
          <div class="ink-lab-panel"><h4>THE SAME AREA / SYNTHETIC CT STACK</h4><canvas id="ink-volume" class="ink-canvas" width="1296" height="864" role="img" aria-label="Three synthetic CT slices sampled around the same papyrus surface"></canvas><label class="ink-label-control">CT slice <input id="ink-depth" type="range" min="0" max="2" value="1"><output id="ink-depth-value">2 of 3</output></label><p class="ink-caption">Your labels give the answers at known locations. The network receives local measurements from these slices, not the bright reference strokes or the shape of a letter.</p></div>
        </div>
        <div class="ink-lab-actions"><button class="button button-primary" id="ink-start" disabled>Train with my mask <span aria-hidden="true">→</span></button></div>
      </div>
      <div data-panel="1" hidden>
        <h3>Learn by comparing a prediction with known labels.</h3><ol class="ink-learning-loop" aria-label="Learning cycle"><li data-learning-phase="0" aria-current="step">1 · Sample <span>→</span></li><li data-learning-phase="1">2 · Predict <span>→</span></li><li data-learning-phase="2">3 · Compare <span>→</span></li><li data-learning-phase="3">4 · Adjust weights <span>↶</span></li></ol><p class="ink-phase" id="ink-phase">Choose a labelled location, then follow its CT measurements through the network.</p>
        <div class="ink-lab-actions"><button class="button button-primary" id="ink-play">Pause learning</button><button class="ink-secondary" id="ink-step">One step</button><label class="ink-label-control">Speed <select id="ink-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><button class="button button-primary" id="ink-test" disabled>Try a new fragment <span aria-hidden="true">→</span></button></div>
        <div class="ink-train-grid">
          <div class="ink-lab-panel"><h4>INPUT / FRAGMENT A · CT PATCH</h4><canvas id="ink-training-input" class="ink-canvas" width="864" height="864" role="img" aria-label="CT stack with the currently sampled training location and magnified local slices"></canvas></div>
          <div class="ink-lab-panel ink-network-panel"><h4>MODEL / FORWARD + FEEDBACK</h4><canvas id="ink-network" class="ink-network" width="864" height="864" role="img" aria-label="A neural network with four local measurements, eight hidden units and one ink probability"></canvas></div>
          <div class="ink-lab-panel"><h4>COMPARE / TRAINING FRAGMENT A</h4><p class="ink-match-note">Orange box: same point · Coral: ink · Mint: background · Dark: unknown</p><canvas id="ink-training-output" class="ink-canvas" width="864" height="864" role="img" aria-label="Your known labels and the current prediction on fragment A, at the same scale, with the same sampled point highlighted"></canvas></div>
        </div>
        <div class="ink-training-metrics"><div><span>TRAINING ROUNDS</span><strong id="ink-epoch">0 / 120</strong></div><div><span>LABEL LOSS</span><strong id="ink-loss">—</strong></div><div><span>SAMPLED LABEL</span><strong id="ink-label">—</strong></div><div><span>INK PROBABILITY · SELECTED POINT</span><strong id="ink-probability" title="Probability at one sampled point, not model accuracy">—</strong></div></div>
        <canvas id="ink-loss-chart" class="ink-loss-chart" width="864" height="100" role="img" aria-label="Training loss over successive updates; lower loss means better agreement with your labels"></canvas>
        <div class="ink-training-progress" role="progressbar" aria-label="Training progress" aria-valuemin="0" aria-valuemax="120" aria-valuenow="0"><i></i></div>

        <p class="ink-caption">Four local CT features feed eight hidden units and one output. Only your painted pixels update the weights. Lower training loss means agreement with those labels; it does not prove that the labels or a new prediction are correct.</p>
      </div>
      <div data-panel="2" hidden>
        <h3>Fragment B: new data, no training labels.</h3><p>The scan visits fragment B patch by patch. No labels from B are supplied to the model, and its weights stay fixed.</p>
        <div class="ink-lab-actions"><button class="button button-primary" id="ink-scan-play">Pause scan</button><button class="ink-secondary" id="ink-replay">Scan again</button><label class="ink-label-control">Show <select id="ink-result-view"><option value="learned">Learned prediction</option><option value="initial">Before training</option><option value="reference" disabled>Known synthetic reference</option></select></label></div>
        <div class="ink-lab-grid"><div class="ink-lab-panel"><h4>FRAGMENT B / UNSEEN CT</h4><canvas id="ink-test-input" class="ink-canvas" width="1296" height="864" role="img" aria-label="Previously unseen synthetic CT fragment with a moving inference window"></canvas></div><div class="ink-lab-panel"><h4 id="ink-map-heading">OUTPUT / INK PROBABILITY</h4><canvas id="ink-test-output" class="ink-canvas" width="1296" height="864" role="img" aria-label="Predicted ink map appearing as the model scans the new fragment"></canvas></div></div>

        <p class="ink-result-note" id="ink-result-note">Brighter pixels mean stronger predicted ink signal. This detector does not recognize characters or translate text.</p>
        <div class="ink-lab-actions"><button class="ink-secondary" id="ink-edit">Change my mask and retrain</button></div>
      </div>
      <p class="ink-status" id="ink-status" role="status">Start with a few ink strokes and a clean background area. Your labels will drive the experiment.</p>
    </div>
    <p class="ink-teaching-note">Synthetic papyrus and CT · a tiny neural network trains in this browser. Real ink models use much larger networks, datasets and validation. These invented marks are not an ancient reading. <a href="https://scrollprize.org/tutorial5" target="_blank" rel="noopener noreferrer">Follow the real workflow →</a></p>`;
  const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
  const train=makeFragment(17),test=makeFragment(83),mask=new Int8Array(W*H).fill(-1),rng=random(12);
  const highTrain=makeFragment(17,3),highTest=makeFragment(83,3);
  const initialModel=new InkNetwork();let model=new InkNetwork(),labels=collectLabels(mask),stage=0,tool=1,brush=4,depth=1,cursor={x:31,y:32},showCursor=false,drawing=false,lastPoint;
  let epoch=0,phase=0,activePhase=0,losses=[],sample=0,running=false,trained=false,scanRows=0,scanRunning=false,scanComplete=false,lastTick=0,scanTick=0,timer=0;
  let trainingPrediction=initialModel.predict(train),prediction=null,initialPrediction=null;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const scratch=document.createElement('canvas');scratch.width=W;scratch.height=H;const sx=scratch.getContext('2d');
  const ctCache=new Map();
  function image(fragment,kind,{prediction:pred,rows=H,labels:paint}={}) {
    const key=(fragment===train?'a':'b')+depth;if(kind==='ct'&&ctCache.has(key))return ctCache.get(key);
    const low=fragment;const high=kind==='reference'||kind==='ct';if(high)fragment=fragment===train?highTrain:highTest;const iw=fragment.w,ih=fragment.h; scratch.width=iw;scratch.height=ih;
    const img=sx.createImageData(iw,ih);
    for(let i=0;i<iw*ih;i++) {const pi=high?Math.floor(Math.floor(i/iw)/3)*W+Math.floor((i%iw)/3):i;
      let color=[11,16,13];
      if(fragment.valid[i]) {
        let v=fragment.slices[depth][i];
        if(kind==='reference') {v=.24+fragment.slices[0][i]*.35+fragment.truth[i]*.48;color=[v*254,v*237,v*204];}
        else if(kind==='labels'){color=paint[pi]===1?[255,145,121]:paint[pi]===0?[141,228,194]:[26,34,28];}
        else if(kind==='prediction') {const p=Math.floor(i/W)<rows?pred[i]:0;color=[p*239+11,p*239+13,p*230+11];}
        else {const g=v*255;color=[g,g*1.01,g*.97];}
        if(paint&&kind==='reference'&&paint[pi]!==-1){const c=paint[pi]===1?[255,145,121]:[141,228,194];color=color.map((v,k)=>v*.25+c[k]*.75);}
      }
      img.data.set([...color,255],i*4);
    }
    sx.putImageData(img,0,0);if(kind==='ct'){const cached=document.createElement('canvas');cached.width=iw;cached.height=ih;cached.getContext('2d').drawImage(scratch,0,0);ctCache.set(key,cached);return cached;}return scratch;
  }
  function clear(canvas){const c=canvas.getContext('2d');c.fillStyle='#0b100d';c.fillRect(0,0,canvas.width,canvas.height);return c;}
  function draw(canvas,fragment,kind,options={}) {const c=clear(canvas);c.drawImage(image(fragment,kind,options),0,0,canvas.width,canvas.height);return c;}
  function drawPaint(){const c=draw($('#ink-paint'),train,'reference',{labels:mask});if(showCursor){c.strokeStyle='#f4f0df';c.lineWidth=3;c.beginPath();c.arc(cursor.x*6,cursor.y*6,brush*6,0,Math.PI*2);c.stroke();}}
  function volume(canvas,fragment,point=null) {
    const c=clear(canvas),scale=canvas.width/432;c.save();c.scale(scale,scale);
    for(let z=0;z<3;z++) {const old=depth;depth=z;c.globalAlpha=z===old?1:.65;c.drawImage(image(fragment,'ct'),22+(2-z)*15,10+(2-z)*17,350,234);depth=old;c.strokeStyle=z===depth?'#d3f87a':'#4b5947';c.strokeRect(22+(2-z)*15,10+(2-z)*17,350,234);}
    c.globalAlpha=1;
    if(point){const x=point%W,y=Math.floor(point/W);c.strokeStyle='#f3916c';c.lineWidth=2;c.strokeRect(22+(2-depth)*15+x/W*350-10,10+(2-depth)*17+y/H*234-10,20,20);
      if(canvas.height/canvas.width>.8)for(let z=0;z<3;z++){const old=depth;depth=z;c.drawImage(image(fragment,'ct'),Math.max(0,x-5)*3,Math.max(0,y-5)*3,33,33,25+z*134,300,110,110);depth=old;c.fillStyle='#b5bfb3';c.font=minFont(c,14)+'px monospace';c.fillText(`SLICE ${z+1}`,25+z*134,285);}}
    c.restore();
  }
  function counts(){labels=collectLabels(mask);$('#ink-positive').textContent=`${labels.ink.length} ink pixels`;$('#ink-negative').textContent=`${labels.background.length} background pixels`;$('#ink-start').disabled=labels.ink.length<20||labels.background.length<20;$$('[data-stage]')[1].disabled=$('#ink-start').disabled;}
  function status(text){$('#ink-status').textContent=text;}
  function setStage(value){stage=value;$$('[data-panel]').forEach((el,i)=>el.hidden=i!==stage);$$('[data-stage]').forEach((el,i)=>{if(i===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});running=false;scanRunning=false;if(stage===1)status(trained?'Training finished. Test the learned weights on fragment B, or return to change your mask.':'Learning paused. Resume the animation or advance one step at a time.');$('#ink-play').textContent=running?'Pause learning':trained?'Learning complete':'Resume learning';$('#ink-scan-play').textContent=scanRunning?'Pause scan':scanComplete?'Scan complete':'Resume scan';(root.closest('.compact-section')||root).scrollIntoView({block:'start',behavior:'instant'});$$('[data-stage]')[stage].focus({preventScroll:true});}
  function invalidate(){trained=false;epoch=0;running=false;scanRunning=false;scanComplete=false;$$('[data-stage]')[2].disabled=true;$('#ink-test').disabled=true;}
  function paint(from,to){invalidate();paintMask(mask,train,from,to,brush,tool);drawPaint();counts();}
  const paintCanvas=$('#ink-paint');
  function position(e){const r=paintCanvas.getBoundingClientRect();return {x:Math.max(0,Math.min(W-1,(e.clientX-r.left)/r.width*W)),y:Math.max(0,Math.min(H-1,(e.clientY-r.top)/r.height*H))};}
  paintCanvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();paintCanvas.focus({preventScroll:true});paintCanvas.setPointerCapture(e.pointerId);drawing=true;showCursor=true;lastPoint=cursor=position(e);paint(cursor,cursor);});
  paintCanvas.addEventListener('pointermove',e=>{cursor=position(e);showCursor=true;if(drawing){paint(lastPoint,cursor);lastPoint=cursor;}else drawPaint();});
  function endPaint(){drawing=false;status($('#ink-start').disabled?'Add at least 20 ink pixels and 20 background pixels to start. Unpainted pixels remain ignored.':'Your mask is ready. Train the model, or keep refining your labels.');}
  paintCanvas.addEventListener('pointerup',endPaint);paintCanvas.addEventListener('pointercancel',endPaint);paintCanvas.addEventListener('lostpointercapture',()=>drawing=false);paintCanvas.addEventListener('pointerleave',()=>{if(!drawing){showCursor=false;drawPaint();}});
  paintCanvas.addEventListener('keydown',e=>{const moves={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};if(moves[e.key]){e.preventDefault();cursor={x:Math.max(0,Math.min(W-1,cursor.x+moves[e.key][0])),y:Math.max(0,Math.min(H-1,cursor.y+moves[e.key][1]))};showCursor=true;drawPaint();}if(e.code==='Space'){e.preventDefault();paint(cursor,cursor);endPaint();}});
  $$('[data-tool]').forEach(button=>button.addEventListener('click',()=>{tool=Number(button.dataset.tool);$$('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
  $('#ink-brush').addEventListener('input',e=>{brush=Number(e.target.value);$('#ink-brush-value').textContent=brush;drawPaint();});
  $('#ink-depth').addEventListener('input',e=>{depth=Number(e.target.value);$('#ink-depth-value').textContent=`${depth+1} of 3`;volume($('#ink-volume'),train);});
  $('#ink-example').addEventListener('click',()=>{invalidate();const example=exampleMask(train);example.forEach((v,i)=>{if(mask[i]===-1)mask[i]=v;});counts();drawPaint();status('Example labels added only in the upper-left area. Paint, erase or correct them before training.');});
  $('#ink-clear').addEventListener('click',()=>{invalidate();mask.fill(-1);counts();drawPaint();status('Mask cleared. Both ink and background need labels again.');});
  function network(time=0) {
    const canvas=$('#ink-network'),c=clear(canvas);c.save();c.scale(2,2);const points=[Array.from({length:4},(_,j)=>({x:48,y:85+j*84})),Array.from({length:8},(_,j)=>({x:218,y:35+j*51})),[{x:381,y:211}]],values=model.forward(train.features,sample);
    for(let layer=0;layer<2;layer++) for(let i=0;i<points[layer].length;i++)for(let j=0;j<points[layer+1].length;j++) {
      const a=points[layer][i],b=points[layer+1][j],weight=layer?model.weights[40+i]:model.weights[j*5+i];
      c.strokeStyle=weight>=0?`rgba(211,248,122,${.15+Math.min(.65,Math.abs(weight)*.2)})`:`rgba(140,207,197,${.15+Math.min(.65,Math.abs(weight)*.2)})`;c.lineWidth=.7+Math.min(2,Math.abs(weight)*.5);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
      if(running&&!motion.matches){let t=(time/900)%1;if(activePhase===3)t=1-t;c.fillStyle=activePhase===3?'#ff9179':'#d3f87a';c.beginPath();c.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,2.4,0,Math.PI*2);c.fill();}
    }
    points.forEach((column,layer)=>column.forEach((p,j)=>{c.fillStyle='#111a12';c.strokeStyle=layer===2?'#d3f87a':'#b5bfb3';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,layer===2?20:12,0,Math.PI*2);c.fill();c.stroke();if(layer===1){c.fillStyle=`rgba(211,248,122,${Math.abs(values.hidden[j])*.8})`;c.beginPath();c.arc(p.x,p.y,8,0,Math.PI*2);c.fill();}}));
    c.fillStyle='#eeeae0';c.font=minFont(c,11)+'px monospace';c.textAlign='center';c.fillText('ink?',381,215);c.textAlign='left';c.restore();
  }
  function comparison(){
    const c=clear($('#ink-training-output'));c.save();c.scale(2,2);
    c.fillStyle='#b5bfb3';c.font=minFont(c,15)+'px monospace';c.fillText('YOUR LABELS · KNOWN ANSWER',18,24);
    c.drawImage(image(train,'labels',{labels:mask}),87,34,258,172);
    c.fillStyle='#b5bfb3';c.fillText('CURRENT PREDICTION · FRAGMENT A',18,230);
    c.drawImage(image(train,'prediction',{prediction:trainingPrediction}),87,240,258,172);
    c.strokeStyle='#f3916c';c.lineWidth=2;
    const x=87+(sample%W)/W*258,y=Math.floor(sample/W)/H*172;
    c.strokeRect(x-7,34+y-7,14,14);c.strokeRect(x-7,240+y-7,14,14);
    c.restore();
  }
  function showLearningPhase(){
    $$('.ink-learning-loop li').forEach((e,i)=>{if(i===activePhase)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');});
    $('.ink-train-grid').dataset.phase=activePhase;
    const tabs=$('[data-panel="1"] .ink-mobile-views');
    if(tabs){const view=activePhase===0?0:activePhase===2?2:1;$('.ink-train-grid').dataset.selected=view;[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
  }
  function chart(){const c=clear($('#ink-loss-chart'));c.strokeStyle='#d3f87a';c.lineWidth=2;c.beginPath();const max=Math.max(.8,...losses);losses.forEach((v,i)=>{const x=12+i/12*840,y=90-v/max*78;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.stroke();}
  function metrics(){const loss=model.loss(train.features,labels);$('#ink-epoch').textContent=`${epoch} / 120`;$('#ink-loss').textContent=loss.toFixed(3);$('#ink-probability').textContent=`${Math.round(model.forward(train.features,sample).probability*100)}%`;$('#ink-label').textContent=mask[sample]===1?'Ink':'Background';$('.ink-training-progress').setAttribute('aria-valuenow',epoch);$('.ink-training-progress i').style.width=`${epoch/120*100}%`;}
  const descriptions=[
    '1 / SAMPLE — Select a painted location and extract its local measurements from the CT stack. Unknown pixels are skipped.',
    '2 / PREDICT — Values flow through weighted connections. The output is an ink probability for this location.',
    '3 / COMPARE — Compare the probability with your label. The mismatch produces a training loss.',
    '4 / UPDATE — Return the label error to the network and adjust its weights. Repeat with ink and background examples.'
  ];
  function advance(){
    if(trained)return;
    if(phase===0){const group=(epoch/10)%2?labels.background:labels.ink;sample=group[Math.floor(rng()*group.length)];}
    activePhase=phase;showLearningPhase();$('#ink-phase').textContent=descriptions[phase];
    if(phase===3){for(let j=0;j<10;j++)model.train(train.features,labels,rng);epoch+=10;losses.push(model.loss(train.features,labels));trainingPrediction=model.predict(train);chart();}
    comparison();volume($('#ink-training-input'),train,sample);metrics();network();phase=(phase+1)%4;
    if(epoch>=120){trained=true;running=false;$('#ink-play').textContent='Learning complete';$('#ink-play').disabled=true;$('#ink-step').disabled=true;$('#ink-test').disabled=false;$$('[data-stage]')[2].disabled=false;status('Training finished. The weights now reflect your mask. Test them on fragment B, which contributed no labels.');}
  }
  function schedule(delay=50){if(!timer)timer=setTimeout(()=>frame(performance.now()),delay);}
  function frame(time){timer=0;const bounds=root.getBoundingClientRect();if(document.hidden||bounds.bottom<0||bounds.top>innerHeight){lastTick=time;scanTick=time;if(running||scanRunning)schedule(500);return;}
    if(running&&stage===1){if(time-lastTick>=450/Number($('#ink-speed').value)){lastTick=time;advance();}if(!motion.matches)network(time);}
    if(scanRunning&&stage===2){if(!scanTick)scanTick=time;scanRows=Math.min(H,scanRows+(time-scanTick)*H/10000);scanTick=time;drawTest();if(scanRows>=H){scanRunning=false;scanComplete=true;drawTest();$('#ink-scan-play').disabled=true;$('#ink-scan-play').textContent='Scan complete';$('#ink-result-view option[value="reference"]').disabled=false;status('New-fragment scan complete. Compare before training, the learned prediction and the known synthetic reference. Check misses as well as false positives.');window.dispatchEvent(new CustomEvent('lab-progress',{detail:'ink'}));}}
    if(running||scanRunning)schedule();
  }
  function start(){counts();if($('#ink-start').disabled)return;model=new InkNetwork();epoch=0;phase=0;activePhase=0;showLearningPhase();trained=false;losses=[model.loss(train.features,labels)];sample=labels.ink[0];trainingPrediction=model.predict(train);$('#ink-play').disabled=false;$('#ink-step').disabled=false;$('#ink-test').disabled=true;$$('[data-stage]')[2].disabled=true;setStage(1);running=!motion.matches;$('#ink-play').textContent=running?'Pause learning':'Start learning';$('#ink-phase').textContent=descriptions[0];metrics();chart();comparison();volume($('#ink-training-input'),train,sample);network();status(motion.matches?'Reduced motion: use One step, or start learning when ready.':'Watch 12 learning cycles over about 22 seconds. Pause or advance one step at any time.');lastTick=performance.now();schedule();}
  $('#ink-start').addEventListener('click',start);
  $('#ink-play').addEventListener('click',()=>{if(trained)return;running=!running;lastTick=performance.now();$('#ink-play').textContent=running?'Pause learning':'Resume learning';schedule();});
  $('#ink-step').addEventListener('click',()=>{running=false;$('#ink-play').textContent='Resume learning';advance();});
  function drawTest(){const kind=$('#ink-result-view').value;draw($('#ink-test-input'),test,'ct');const c=$('#ink-test-input').getContext('2d');if(!scanComplete){c.strokeStyle='#f3916c';c.lineWidth=2;c.strokeRect(0,Math.min(H-10,scanRows)*6,1296,60);}
    draw($('#ink-test-output'),test,kind==='reference'?'reference':'prediction',{prediction:kind==='initial'?initialPrediction:prediction,rows:scanRows});
  }
  function beginTest(){if(!trained)return;prediction=model.predict(test);initialPrediction=initialModel.predict(test);scanRows=0;scanComplete=false;$('#ink-map-heading').textContent='OUTPUT / INK PROBABILITY';$('#ink-result-note').textContent='Brighter pixels mean stronger predicted ink signal. This detector does not recognize characters or translate text.';setStage(2);$('#ink-result-view').value='learned';$('#ink-result-view option[value="reference"]').disabled=true;$('#ink-scan-play').disabled=false;scanRunning=!motion.matches;$('#ink-scan-play').textContent=scanRunning?'Pause scan':'Start scan';scanTick=performance.now();drawTest();status(motion.matches?'Ready to scan. Start the scan when you choose; particle animations are disabled.':'Scanning unseen CT for about 10 seconds. No new learning occurs here.');schedule();}
  $('#ink-test').addEventListener('click',beginTest);$('#ink-replay').addEventListener('click',beginTest);
  $('#ink-scan-play').addEventListener('click',()=>{scanRunning=!scanRunning;scanTick=performance.now();$('#ink-scan-play').textContent=scanRunning?'Pause scan':'Resume scan';schedule();});
  $('#ink-result-view').addEventListener('change',()=>{const kind=$('#ink-result-view').value;$('#ink-map-heading').textContent=kind==='reference'?'CHECK / KNOWN SYNTHETIC REFERENCE':kind==='initial'?'OUTPUT / BEFORE TRAINING':'OUTPUT / INK PROBABILITY';$('#ink-result-note').textContent=kind==='reference'?'This known reference is revealed only for comparison. It was never an input to training or inference on fragment B.':'Brighter pixels mean stronger predicted ink signal. This detector does not recognize characters or translate text.';drawTest();});
  function edit(){setStage(0);drawPaint();status('Refine your ink and background labels, then train a fresh model.');}
  $('#ink-edit').addEventListener('click',edit);
  $$('[data-stage]').forEach(button=>button.addEventListener('click',()=>{const next=Number(button.dataset.stage);if(next===0)edit();else if(next===1){if(!epoch)start();else{setStage(1);network();}}else if(trained)beginTest();}));
  document.addEventListener('visibilitychange',()=>{lastTick=scanTick=performance.now();if(!document.hidden)schedule();});
  motion.addEventListener('change',()=>{if(motion.matches){running=false;scanRunning=false;$('#ink-play').textContent=trained?'Learning complete':'Resume learning';$('#ink-scan-play').textContent=scanComplete?'Scan complete':'Resume scan';network();}});
  drawPaint();volume($('#ink-volume'),train);counts();
}
