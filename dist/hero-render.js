// The cover's illustrative rolled sheet. Shared by the main page and the
// background worker that draws it, so the animation never blocks the page.
import { windingColor } from './winding-colors.js?v=20261123-perf';

const tau = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function grid(ctx,w,h,spacing=35) {
  ctx.strokeStyle = '#b5d1a409'; ctx.lineWidth = 1;
  for(let x=spacing/2;x<w;x+=spacing)for(let y=spacing/2;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.moveTo(x,y-2);ctx.lineTo(x,y+2);ctx.stroke();}
}

function scrollPoint(t,v) {
  const r=15+3.05*t;
  const ripple=1+.045*Math.sin(t*3+v*3)+.022*Math.sin(t*7-v*8);
  return [r*Math.cos(t)*ripple, v*167+Math.sin(t*1.9)*6*(v*v),r*Math.sin(t)*.86*ripple];
}
// The sheet's shape never changes, only the view: its points are computed once
// into flat arrays, and each frame only rotates and projects them.
const HERO_LINES=620,HERO_SAMPLES=17,HERO_RIM=600;
const heroLineT=new Float32Array(HERO_LINES),heroMid=new Float32Array(HERO_LINES*3),heroPts=new Float32Array(HERO_LINES*HERO_SAMPLES*3);
const heroRims=[new Float32Array((HERO_RIM+1)*3),new Float32Array((HERO_RIM+1)*3)];
for(let k=0;k<HERO_LINES;k++){
  const t=.1+k/(HERO_LINES-1)*14*Math.PI;heroLineT[k]=t;heroMid.set(scrollPoint(t,0),k*3);
  for(let j=0;j<HERO_SAMPLES;j++)heroPts.set(scrollPoint(t,-1+j/8),(k*HERO_SAMPLES+j)*3);
}
[-1,1].forEach((v,r)=>{for(let k=0;k<=HERO_RIM;k++)heroRims[r].set(scrollPoint(.1+k/HERO_RIM*14*Math.PI,v),k*3);});
const heroOut=new Float32Array(Math.max(HERO_SAMPLES,HERO_RIM+1)*3),heroOrder=new Uint16Array(HERO_LINES),heroDepth=new Float32Array(HERO_LINES);
// Project n points from src (starting at point `from`) into heroOut as x, y, depth.
function heroProjectMany(src,from,n,w,h,rotation){
  const cy=Math.cos(rotation),sy=Math.sin(rotation),cp=Math.cos(.68),sp=Math.sin(.68),cr=Math.cos(-.40),sr=Math.sin(-.40);
  const base=Math.min(w/440,h/425)*.91,cx=w*.51,cz=h*.48;
  for(let i=0;i<n;i++){
    const o=(from+i)*3,x=src[o],y=src[o+1],z=src[o+2];
    const xx=x*cy+z*sy,z1=-x*sy+z*cy,yy=y*cp-z1*sp,zz=y*sp+z1*cp;
    const s=base*850/(850+zz);
    heroOut[i*3]=cx+(xx*cr-yy*sr)*s;heroOut[i*3+1]=cz+(xx*sr+yy*cr)*s;heroOut[i*3+2]=zz;
  }
}
// Colours are rounded to small steps and reused; the eye cannot tell the difference.
const heroColours=new Map();
function heroLayerColour(kind,t,brightness,alpha){
  const pos=Math.round((t-.1)/(14*Math.PI)*240),bright=Math.round(brightness*40),key=kind*1e6+pos*1000+bright;
  let c=heroColours.get(key);
  if(c===undefined){c=windingColor(pos/40,alpha,bright/40);heroColours.set(key,c);}
  return c;
}
export function drawHeroScene(ctx,w,h,rotation,heroMode) {
  if(w<2||h<2)return;
  ctx.clearRect(0,0,w,h); grid(ctx,w,h,36);
  heroProjectMany(heroMid,0,HERO_LINES,w,h,rotation);
  for(let k=0;k<HERO_LINES;k++){heroOrder[k]=k;heroDepth[k]=heroOut[k*3+2];}
  heroOrder.sort((a,b)=>heroDepth[b]-heroDepth[a]);
  ctx.lineWidth=heroMode==='wireframe'?.65:.85;
  for(const k of heroOrder){
    const t=heroLineT[k],depth=heroDepth[k],light=Math.round(clamp(32-depth*.075,18,53));
    if(heroMode==='surface')ctx.strokeStyle=`hsla(${42+Math.sin(t*.4)*12},${38+Math.cos(t)*10}%,${light}%,.68)`;
    else if(heroMode==='wireframe')ctx.strokeStyle=`hsla(100,8%,${light+12}%,.48)`;
    // This is illustrative position along the roll, not a fitted W field.
    else ctx.strokeStyle=heroLayerColour(1,t,clamp(.84-depth*.0028,.42,1.1),.82);
    heroProjectMany(heroPts,k*HERO_SAMPLES,HERO_SAMPLES,w,h,rotation);
    ctx.beginPath();ctx.moveTo(heroOut[0],heroOut[1]);
    for(let j=1;j<HERO_SAMPLES;j++)ctx.lineTo(heroOut[j*3],heroOut[j*3+1]);
    ctx.stroke();
  }
  // Rims make the single spiralling sheet legible without claiming global W values.
  // Neighbouring segments that share a colour are stroked together.
  ctx.lineWidth=1.15;
  for(const rim of heroRims){
    heroProjectMany(rim,0,HERO_RIM+1,w,h,rotation);
    let current='';
    for(let k=0;k<HERO_RIM;k++){
      const px=heroOut[k*3],py=heroOut[k*3+1],pz=heroOut[k*3+2],t=.1+k/HERO_RIM*14*Math.PI;
      const lum=Math.round(clamp(53-pz*.08,30,75));
      const colour=heroMode==='wireframe'?`hsla(90,12%,${lum}%,.9)`:heroMode==='layers'?heroLayerColour(2,t,clamp(1.05-pz*.0014,.7,1.25),.95):`hsla(65,43%,${lum}%,.9)`;
      if(colour!==current){if(current)ctx.stroke();current=colour;ctx.strokeStyle=colour;ctx.beginPath();ctx.moveTo(px,py);}
      ctx.lineTo(heroOut[k*3+3],heroOut[k*3+4]);
    }
    if(current)ctx.stroke();
  }
  if(heroMode==='wireframe'){
    ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle='#cee0c1';ctx.setLineDash([3,5]);
    ctx.beginPath();ctx.ellipse(w*.5,h*.48,w*.29,h*.13,-.38,0,tau);ctx.stroke();ctx.restore();
  }
}
