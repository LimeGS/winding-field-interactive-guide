// A deliberately small, real neural classifier for the synthetic teaching data.
export const INK_WIDTH = 216, INK_HEIGHT = 144;
export function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const bounded = (x, a, b) => Math.max(a, Math.min(b, x));
function distance(x, y, [ax, ay, bx, by]) {
  const t = bounded(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2),0,1);
  return Math.hypot(x-ax-t*(bx-ax), y-ay-t*(by-ay));
}
export function makeFragment(seed,scale=1) {
  const w=INK_WIDTH*scale,h=INK_HEIGHT*scale,n=w*h,rng=random(seed),lines=[];
  const shapes=[[[0,1,0,0],[0,0,1,0],[1,0,1,1]],[[0,1,.5,0],[.5,0,1,1]],[[0,1,.5,0],[.5,0,1,1],[.25,.6,.75,.6]],[[0,0,1,0],[.5,0,.5,1]],[[0,0,0,1],[0,.5,.8,.5],[0,1,1,1]],[[0,0,1,1],[1,0,0,1]]];
  // Five distinct marks, with a different order on the unseen fragment.
  const glyphs=[0,1,2,3,5];
  for(let col=0;col<glyphs.length;col++) {
    const x=23+col*35,y=48+(rng()-.5)*3;
    const glyph=shapes[glyphs[(col+seed%glyphs.length)%glyphs.length]];
    for(const line of glyph) lines.push([x+line[0]*22,y+line[1]*42,x+line[2]*22,y+line[3]*42]);
  }
  const valid=new Uint8Array(n),truth=new Float32Array(n),slices=Array.from({length:3},()=>new Float32Array(n));
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const i=y*w+x,ux=x/scale,uy=y/scale;
    valid[i]=ux>10+3*Math.sin(uy*.21+seed)&&ux<INK_WIDTH-11+4*Math.sin(uy*.16)&&uy>9+3*Math.sin(ux*.18)&&uy<INK_HEIGHT-9+3*Math.sin(ux*.13+seed);
    if(!valid[i])continue;
    let d=100; for(const line of lines)d=Math.min(d,distance(ux,uy,line));
    const ink=bounded((2.0-d)*1.7,0,1);truth[i]=ink;
    const fibre=.43+.065*Math.sin(ux*.61)+.045*Math.sin(uy*1.33)+.023*Math.sin((ux+uy)*.2);
    slices[0][i]=bounded(fibre+(rng()-.5)*.09+ink*.015,0,1);
    slices[1][i]=bounded(fibre+(rng()-.5)*.09+ink*(.11+.02*Math.sin(ux*2+uy)),0,1);
    slices[2][i]=bounded(fibre+(rng()-.5)*.09-ink*.055,0,1);
  }
  if(scale>1)return {w,h,valid,truth,slices};
  const features=new Float32Array(n*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
    const i=y*w+x;if(!valid[i])continue;
    let local=0,count=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
      const j=(y+dy)*w+x+dx;if(y+dy>=0&&y+dy<h&&x+dx>=0&&x+dx<w&&valid[j]){local+=slices[1][j]-slices[0][j];count++;}
    }
    features.set([(slices[0][i]-.43)*6,(slices[1][i]-slices[0][i])*9,(slices[2][i]-slices[0][i])*9,local/count*9],i*4);
  }
  return {w,h,valid,truth,slices,features};
}
export function paintMask(mask,fragment,from,to,radius,value) {
  const dx=to.x-from.x,dy=to.y-from.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)));
  for(let t=0;t<=steps;t++) {
    const cx=from.x+dx*t/steps,cy=from.y+dy*t/steps;
    for(let y=Math.max(0,Math.floor(cy-radius));y<=Math.min(fragment.h-1,Math.ceil(cy+radius));y++)for(let x=Math.max(0,Math.floor(cx-radius));x<=Math.min(fragment.w-1,Math.ceil(cx+radius));x++) {
      const i=y*fragment.w+x;
      if(fragment.valid[i]&&(x-cx)**2+(y-cy)**2<=radius**2)mask[i]=value;
    }
  }
}
export function collectLabels(mask) {
  const ink=[],background=[];
  mask.forEach((v,i)=>{if(v===1)ink.push(i);else if(v===0)background.push(i);});
  return {ink,background};
}
export function exampleMask(fragment) {
  const mask=new Int8Array(fragment.valid.length).fill(-1);
  // Only a small left-hand area is annotated; the rest stays unknown.
  for(let i=0;i<mask.length;i++)if(fragment.valid[i]&&i%fragment.w<79&&Math.floor(i/fragment.w)<66) {
    if(fragment.truth[i]>.95)mask[i]=1;
    else if(fragment.truth[i]===0)mask[i]=0;
  }
  return mask;
}
export class InkNetwork {
  constructor(seed=41) {
    const rng=random(seed);
    this.weights=Float64Array.from({length:49},()=> (rng()-.5)*.6);
    this.m=new Float64Array(49);this.v=new Float64Array(49);this.iteration=0;
  }
  forward(features,index) {
    const hidden=new Float64Array(8),w=this.weights;
    for(let j=0;j<8;j++){let a=w[j*5+4];for(let k=0;k<4;k++)a+=w[j*5+k]*features[index*4+k];hidden[j]=Math.tanh(a);}
    let a=w[48];for(let j=0;j<8;j++)a+=w[40+j]*hidden[j];
    return {hidden,probability:1/(1+Math.exp(-bounded(a,-30,30)))};
  }
  train(features,labels,rng,batches=4) {
    if(!labels.ink.length||!labels.background.length)throw new Error('Both ink and background labels are required.');
    let lastIndex=0;
    for(let batch=0;batch<batches;batch++) {
      const g=new Float64Array(49),w=this.weights;
      for(let sample=0;sample<128;sample++) {
        const target=sample%2,group=target?labels.ink:labels.background;
        const i=group[Math.floor(rng()*group.length)];lastIndex=i;
        const {hidden,probability}=this.forward(features,i),error=probability-target;
        g[48]+=error;
        for(let j=0;j<8;j++) {
          g[40+j]+=error*hidden[j];const d=error*w[40+j]*(1-hidden[j]*hidden[j]);
          for(let k=0;k<4;k++)g[j*5+k]+=d*features[i*4+k];g[j*5+4]+=d;
        }
      }
      this.iteration++;
      for(let k=0;k<49;k++) {
        const d=g[k]/128;this.m[k]=.9*this.m[k]+.1*d;this.v[k]=.999*this.v[k]+.001*d*d;
        w[k]-=.012*(this.m[k]/(1-.9**this.iteration))/(Math.sqrt(this.v[k]/(1-.999**this.iteration))+1e-8);
      }
    }
    return lastIndex;
  }
  loss(features,labels) {
    let loss=0;
    for(const [target,group] of [[1,labels.ink],[0,labels.background]]) {
      let total=0,count=0;
      for(let k=0;k<group.length;k+=Math.max(1,Math.floor(group.length/256))){const p=bounded(this.forward(features,group[k]).probability,1e-7,1-1e-7);total-=target?Math.log(p):Math.log(1-p);count++;}
      loss+=total/count;
    }
    return loss/2;
  }
  predict(fragment) {
    const out=new Float32Array(fragment.valid.length);
    for(let i=0;i<out.length;i++)if(fragment.valid[i])out[i]=this.forward(fragment.features,i).probability;
    return out;
  }
}
