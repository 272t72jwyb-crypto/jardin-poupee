// Contact points on the painted wood, in each background's source coordinates.
// The mobile atlas contains two 443×1774 panels. These are foot positions,
// not sprite centres. Day/night geometry is different, so never interpolate
// between perches: take flight while the background crossfades.
const points = (width, height, coords) => coords.map(([x,y])=>({x:x/width,y:y/height}));
export const PERCHES = {
 'desktop-day': points(1536,1024,[[250,176],[300,265],[1380,195],[1370,294]]),
 'desktop-night': points(1536,1024,[[260,183],[339,169],[1270,189],[1360,110]]),
 'mobile-day': points(443,1774,[[119,232],[216,278],[105,506],[207,565]]),
 'mobile-night': points(443,1774,[[325,234],[222,275],[320,551],[218,585]])
};
export const perchEnvironment = (mobile, night) => night < .20 ? `${mobile?'mobile':'desktop'}-day` : night > .80 ? `${mobile?'mobile':'desktop'}-night` : null;
const lerp=(a,b,t)=>a+(b-a)*t;
export function bezier(path,t){const u=1-t;return {x:u*u*u*path[0].x+3*u*u*t*path[1].x+3*u*t*t*path[2].x+t*t*t*path[3].x,y:u*u*u*path[0].y+3*u*u*t*path[1].y+3*u*t*t*path[2].y+t*t*t*path[3].y};}

export class BirdFlock {
 constructor(random=Math.random){this.random=random;this.time=0;this.environment=undefined;this.onLand=()=>{};this.birds=Array.from({length:5},(_,kind)=>({kind,state:'away',x:kind%2?1.08:-.08,y:.28,age:0,wait:1+kind*2.8+random()*3,flip:false,perch:null,visits:0,flightNumber:0,bank:0}));}
 freePerch(b){const points=PERCHES[this.environment];if(!points||b.kind===4)return null;const occupied=new Set(this.birds.filter(o=>o!==b&&o.perch!==null).map(o=>o.perch));if(occupied.size>=2)return null;const free=points.map((_,i)=>i).filter(i=>!occupied.has(i)&&i!==b.lastPerch);return free.length?free[Math.floor(this.random()*free.length)]:null;}
 fly(b,target,state='flying',duration){const from={x:b.x,y:b.y},distance=Math.hypot(target.x-from.x,target.y-from.y);b.perch=null;b.state=state;b.age=0;b.flightNumber++;b.duration=duration??Math.max(1.6,Math.min(5,distance*5.5));const lift=.08+this.random()*.10;const dx=target.x-from.x;b.path=[from,{x:lerp(from.x,target.x,.30),y:Math.max(.065,from.y-lift)},{x:lerp(from.x,target.x,.75),y:Math.max(.07,target.y-lift*.7)},target];b.flip=dx<0;b.bank=0;}
 chooseFlight(b){const perch=this.freePerch(b);if(perch!==null&&this.random()<.62){this.fly(b,PERCHES[this.environment][perch],'landing');b.perch=perch;return;}if(b.visits>1&&this.random()<.40){this.fly(b,{x:b.flip?-.10:1.10,y:.15+this.random()*.28},'leaving');return;}b.visits++;this.fly(b,{x:.12+this.random()*.76,y:.20+this.random()*.34});}
 update(dt,environment){
  this.time+=dt;
  if(environment!==this.environment){this.environment=environment;for(const b of this.birds){if(b.state==='perched'||b.state==='landing'){// Start a new flight at the current position: no teleport after rotation or sunset.
    this.fly(b,{x:.2+this.random()*.6,y:.24+this.random()*.25});
  }}}
  if(dt<=0)return;
  for(const b of this.birds){
   b.age+=dt;
   if(b.state==='away'){if(b.age>=b.wait){b.visits=0;this.chooseFlight(b);}continue;}
   if(b.state==='perched'){if(b.age>=b.wait)this.chooseFlight(b);continue;}
   const p=Math.min(1,b.age/b.duration),ease=b.state==='landing'?1-(1-p)**2:p,oldX=b.x,oldY=b.y;
   const pos=bezier(b.path,ease);b.x=pos.x;b.y=pos.y;if(Math.abs(b.x-oldX)>.000001)b.flip=b.x<oldX;
   b.bank=Math.max(-.22,Math.min(.22,(b.y-oldY)/(Math.abs(b.x-oldX)+.006)));
   if(p<1)continue;
   if(b.state==='landing'&&b.perch!==null&&PERCHES[environment]){b.state='perched';b.age=0;b.wait=3+this.random()*5;b.lastPerch=b.perch;this.onLand(b.x,b.y);}
   else if(b.state==='leaving'){b.state='away';b.age=0;b.wait=5+this.random()*12;b.perch=null;}
   else this.chooseFlight(b);
  }
 }
}
