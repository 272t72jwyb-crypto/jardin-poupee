import {BirdFlock} from './birds.mjs?v=gag-7';

// Real drawn poses. Timing holds the kiss/tasting moment without a camera zoom.
export const MOTIONS={
 baiser:{file:'assets/romance-baiser.webp',durations:[900,140,140,140,220,1200,180,700],height:.88,x:.48,y:.99,cat:[.90,.90]},
 mains:{file:'assets/romance-mains.webp',durations:[135,135,135,135,135,135,135,135],height:.83,x:.50,y:.97,cat:[.86,.88]},
 blottis:{file:'assets/romance-blottis.webp',durations:[650,200,200,200,800,250,900,900],height:.86,x:.47,y:.99,cat:[.88,.94]},
 danse:{file:'assets/romance-danse.webp',durations:[300,120,120,120,120,120,160,500],height:.90,x:.50,y:.98,cat:[.87,.92]},
 pont:{file:'assets/romance-pont.webp',durations:[800,180,180,180,900,900,200,700],height:.76,x:.47,y:.91,cat:[.81,.607],night:true},
 vanille:{file:'assets/romance-vanille.webp',durations:[800,180,650,160,700,180,850,650],height:.83,x:.43,y:.96,cat:[.76,.90]}
};

export function poseAt(time,durations){
 const total=durations.reduce((sum,n)=>sum+n,0);let at=((time*1000)%total+total)%total;
 for(let i=0;i<durations.length;i++){if(at<durations[i])return i;at-=durations[i];}
 return 0;
}

// Read only the alpha channel to find the drawings in their eight grid cells.
// Keep one common scale across poses; place their feet on the same ground.
export function measurePoses(img){
 const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
 const g=c.getContext('2d');g.drawImage(img,0,0);const data=g.getImageData(0,0,c.width,c.height).data;
 const frames=[];
 for(let n=0;n<8;n++){
  const x0=Math.round(n%4*c.width/4),x1=Math.round((n%4+1)*c.width/4),y0=Math.round(Math.floor(n/4)*c.height/2),y1=Math.round((Math.floor(n/4)+1)*c.height/2);
  let left=x1,right=x0,top=y1,bottom=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<=left||bottom<=top)throw new Error('Missing animation pose');
  frames.push({x:left,y:top,w:right-left+1,h:bottom-top+1});
 }
 return {img,frames,maxHeight:Math.max(...frames.map(f=>f.h)),maxWidth:Math.max(...frames.map(f=>f.w))};
}

const flightRects=[
 [[45,13,423,334,251,292],[457,114,853,378,667,283]],
 [[38,334,438,697,258,650],[451,477,864,757,674,642]],
 [[43,694,438,1050,247,1018],[460,865,858,1132,672,1010]],
 [[48,1048,452,1402,246,1374],[451,1198,864,1477,668,1363]],
 [[121,1414,451,1724,253,1665],[487,1525,864,1758,668,1658]]
];
const feet=[[.73,.90],[.73,.94],[.70,.96],[.70,.96]];

export class RomanticMotion {
 constructor(canvas,getAssets,onPauseChange=()=>{}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getAssets=getAssets;this.onPauseChange=onPauseChange;
  this.canvas.width=1200;this.canvas.height=800;this.running=false;this.paused=false;this.raf=0;this.time=0;
  this.tick=this.tick.bind(this);
  this.visibility=()=>{this.last=0;};document.addEventListener('visibilitychange',this.visibility);
 }
 start(scene,poses,background){
  this.stop();this.scene=scene;this.poses=poses;this.spec=MOTIONS[scene.id];this.time=0;this.last=0;
  this.background=background;this.canvas.width=1200;this.canvas.height=Math.round(1200*scene.rect[3]/scene.rect[2]);
  this.flock=new BirdFlock();this.flock.birds.forEach((b,i)=>b.wait=.5+i*1.4);
  this.petals=Array.from({length:24},()=>({x:Math.random(),y:Math.random(),phase:Math.random()*6,speed:.025+Math.random()*.02}));
  this.running=true;this.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.onPauseChange(this.paused);this.render(0);this.raf=requestAnimationFrame(this.tick);
 }
 tick(ms){
  if(!this.running)return;
  const elapsed=this.last?ms-this.last:0;
  if(!this.last)this.last=ms;
  if(document.hidden||this.paused)this.last=ms;
  else if(elapsed>=1000/30){const dt=Math.min(.10,elapsed/1000);this.last=ms;this.time+=dt;this.render(dt);}
  this.raf=requestAnimationFrame(this.tick);
 }
 toggle(){this.paused=!this.paused;this.last=0;this.onPauseChange(this.paused);return this.paused;}
 stop(){this.running=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;}
 render(dt){
  const {images,sprites}=this.getAssets(),g=this.ctx,w=this.canvas.width,h=this.canvas.height,t=this.time,spec=this.spec;
  g.clearRect(0,0,w,h);
  const sourceWidth=this.scene.id==='vanille'?1536:1024,sourceHeight=this.scene.id==='vanille'?1024:1536;
  const [sx,sy,sw,sh]=this.scene.rect,bg=this.background;
  g.drawImage(bg,sx/sourceWidth*bg.width,sy/sourceHeight*bg.height,sw/sourceWidth*bg.width,sh/sourceHeight*bg.height,0,0,w,h);
  if(!spec.night)this.drawCat(g,sprites,t,w,h);
  // These cinema paintings have their own branches: birds fly through them,
  // and never land at the gameplay background's unrelated perch coordinates.
  this.flock.update(dt,null);
  for(const bird of this.flock.birds)if(bird.state!=='away')this.drawBird(g,images,sprites,bird,t,w,h);
  const index=poseAt(t,spec.durations),f=this.poses.frames[index];
  const scale=Math.min(h*spec.height/this.poses.maxHeight,w*.72/this.poses.maxWidth);
  const walk=this.scene.id==='mains'?Math.sin(t*.4)*w*.012:0;
  g.drawImage(this.poses.img,f.x,f.y,f.w,f.h,w*spec.x+walk-f.w*scale/2,h*spec.y-f.h*scale,f.w*scale,f.h*scale);
  if(spec.night){
   // Reuse the painted foreground rails, so the couple stands behind them.
   // The open spaces remain transparent to the figures, unlike a solid band.
   g.save();g.beginPath();
   g.moveTo(.06*w,.559*h);g.bezierCurveTo(.30*w,.511*h,.58*w,.493*h,.92*w,.600*h);
   g.lineTo(.92*w,.637*h);g.bezierCurveTo(.58*w,.530*h,.30*w,.548*h,.06*w,.596*h);g.closePath();
   g.moveTo(.06*w,.676*h);g.bezierCurveTo(.30*w,.625*h,.58*w,.613*h,.92*w,.716*h);
   g.lineTo(.92*w,.747*h);g.bezierCurveTo(.58*w,.644*h,.30*w,.656*h,.06*w,.707*h);g.closePath();
   g.clip();g.drawImage(bg,sx/sourceWidth*bg.width,sy/sourceHeight*bg.height,sw/sourceWidth*bg.width,sh/sourceHeight*bg.height,0,0,w,h);g.restore();
   this.drawCat(g,sprites,t,w,h);
  }
  for(const p of this.petals){
   const x=((p.x+t*p.speed*.28+Math.sin(t*.5+p.phase)*.015)%1.1)*w-.05*w,y=((p.y+t*p.speed)%1.1)*h-.05*h;
   g.save();g.translate(x,y);g.rotate(t*.6+p.phase);g.fillStyle=spec.night?'#e9aed0':'#f9bfd3';g.beginPath();g.ellipse(0,0,5,2.4,0,0,Math.PI*2);g.fill();g.restore();
  }
 }
 drawCat(g,sprites,t,w,h){
  const s=sprites[6],scale=Math.min(w*.15/s.w,h*.19/s.h);
  const [x,y]=this.spec.cat;
  // Keep the paws planted at a scene-specific foreground contact point.
  g.save();g.translate(x*w,y*h);if(this.spec.night)g.rotate(.1);g.scale(-1,1+Math.sin(t*2)*.008);
  g.drawImage(s.img,s.x,s.y,s.w,s.h,-s.w*.55*scale,-s.h*.96*scale,s.w*scale,s.h*scale);g.restore();
 }
 drawBird(g,images,sprites,b,t,w,h){
  const size=Math.min(w,h)*(b.kind===4?.045:.060);g.save();g.translate(b.x*w,b.y*h);if(b.flip)g.scale(-1,1);
  if(b.state==='perched'){
   const s=sprites[b.kind+8],foot=feet[b.kind],scale=Math.min(size*1.65/s.w,size/s.h);
   g.drawImage(s.img,s.x,s.y,s.w,s.h,-s.w*foot[0]*scale,-s.h*foot[1]*scale,s.w*scale,s.h*scale);
  }else{
   const r=flightRects[b.kind][Math.floor(t*(b.kind===4?28:9)+b.kind)%2],scale=size/230;
   g.rotate(b.bank*(b.flip?-1:1));g.drawImage(images.flight,r[0],r[1],r[2]-r[0],r[3]-r[1],(r[0]-r[4])*scale,(r[1]-r[5])*scale,(r[2]-r[0])*scale,(r[3]-r[1])*scale);
  }
  g.restore();
 }
}
