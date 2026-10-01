import {GardenGame} from './engine.mjs?v=tablet-cat-11';
import {catPose} from './cat.mjs?v=tablet-cat-11';
import {BirdFlock,PERCHES,perchEnvironment} from './birds.mjs?v=gag-7';
import {GardenAudio} from './audio.mjs?v=gag-7';
const gardenAudio=new GardenAudio();
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),game=new GardenGame();
let W=1000,H=700,clock=0,last=0,artReady=false,muted=false,drag=null,toastUntil=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,keys=new Set(),held=new Set();
const images={},sprites=[];let starSprite,heartSprite,bearSprite,gagSprite;
let mobileMoon,mobileNightCache;
const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(src));img.src=src;});
function fit(){
 const rect=canvas.getBoundingClientRect();
 if(rect.width<=0||rect.height<=0)return;
 W=rect.width;H=rect.height;
 const dpr=Math.min(devicePixelRatio||1,2),width=Math.round(W*dpr),height=Math.round(H*dpr);
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 game.resize(W,H,matchMedia('(orientation: portrait)').matches);
}
let fitPending=false;
function scheduleFit(){if(fitPending)return;fitPending=true;requestAnimationFrame(()=>{fitPending=false;fit();});}
function syncViewport(){
 // Use the settled visible viewport, including Safari's expanding toolbars.
 // Pinch zoom must not resize the world or move the basket.
 const viewport=window.visualViewport;
 if(!viewport||Math.abs(viewport.scale-1)<.01){
  const height=viewport?.height||window.innerHeight;
  if(height>0)document.documentElement.style.setProperty('--garden-viewport-height',`${height}px`);
 }
 scheduleFit();
}
new ResizeObserver(scheduleFit).observe(canvas.parentElement);
window.addEventListener('resize',syncViewport);
window.addEventListener('orientationchange',syncViewport);
window.addEventListener('pageshow',syncViewport);
window.visualViewport?.addEventListener('resize',syncViewport);
matchMedia('(orientation: portrait)').addEventListener('change',syncViewport);
function makeGlyph(glyph){const c=document.createElement('canvas');c.width=c.height=128;const cctx=c.getContext('2d');cctx.font='100px Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif';cctx.textAlign='center';cctx.textBaseline='middle';cctx.fillText(glyph,64,69);return {img:c,x:0,y:0,w:128,h:128};}
function trimSprite(img){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const data=g.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>60){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}return {img,x:left,y:top,w:right-left+1,h:bottom-top+1};}
function parseAtlas(img){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cctx=c.getContext('2d');cctx.drawImage(img,0,0);const pixels=cctx.getImageData(0,0,c.width,c.height).data;for(let index=0;index<16;index++){const columns=[0,.254,.514,.754,1],rows=[0,.292,.583,.79,1],col=index%4,row=Math.floor(index/4),x0=Math.floor(columns[col]*img.width),y0=Math.floor(rows[row]*img.height),cw=Math.floor(columns[col+1]*img.width)-x0,ch=Math.floor(rows[row+1]*img.height)-y0;let x1=x0+cw,y1=y0+ch,x2=x0,y2=y0;for(let y=y0+2;y<y0+ch-2;y++){for(let x=x0+2;x<x0+cw-2;x++){if(pixels[(y*img.width+x)*4+3]>60){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}}}if(x2<=x1){x1=x0;y1=y0;x2=x0+cw;y2=y0+ch;}sprites.push({img,x:x1,y:y1,w:x2-x1+1,h:y2-y1+1});}}
function sprite(s,x,y,width,height,flip=false,angle=0){if(!s)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);if(flip)ctx.scale(-1,1);const scale=Math.min(width/s.w,height/s.h),dw=s.w*scale,dh=s.h*scale;ctx.drawImage(s.img,s.x,s.y,s.w,s.h,-dw/2,-dh/2,dw,dh);ctx.restore();}
function cutoutData(s){const c=document.createElement('canvas');c.width=s.w;c.height=s.h;c.getContext('2d').drawImage(s.img,s.x,s.y,s.w,s.h,0,0,s.w,s.h);return c.toDataURL();}
function hud(){ $('score').textContent=game.score; $('lives').textContent='♥ '.repeat(game.lives)+'♡ '.repeat(3-game.lives);$('lives').setAttribute('aria-label',`${game.lives} vie${game.lives>1?'s':''} restante${game.lives>1?'s':''}`);}
function overlay(mode){const o=$('overlay');o.hidden=false;$('prizes').hidden=mode!=='ready';if(mode==='pause'){$('eyebrow').textContent='LE JARDIN T’ATTEND';$('panel-title').textContent='Une petite pause';$('panel-text').textContent='Reprends ta récolte quand tu le souhaites.';$('play').textContent='Reprendre';}else if(mode==='over'){$('eyebrow').textContent='TA RÉCOLTE';$('panel-title').textContent=`${game.score} points`;$('panel-text').textContent='Les cerisiers ont encore des cadeaux pour toi. Une autre promenade ?';$('play').textContent='Rejouer';$('instructions').textContent='Trois nouvelles vies, et une nouvelle pluie de cadeaux.';} }
function clearInput(){keys.clear();held.clear();drag=null;$('left').classList.remove('held');$('right').classList.remove('held');}
game.onEvent=(event,value)=>{
 hud();
 if(event==='catch')gardenAudio.catch(value);
 if(event==='miss'){clearInput();gardenAudio.loss();$('toast').textContent='Oh non… −1 vie';toastUntil=Infinity;}
 if(event==='recover'){clearInput();toastUntil=0;}
 if(event==='over'){toastUntil=0;$('pause').disabled=true;clearInput();overlay('over');}
 if(event==='pause'){gardenAudio.pause();clearInput();overlay('pause');$('pause').textContent='▶';$('pause').setAttribute('aria-label','Reprendre');}
 if(event==='resume'||event==='start'){
  if(event==='start')gardenAudio.stop();gardenAudio.resume();$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Mettre en pause');$('pause').disabled=false;toastUntil=game.cry>0?Infinity:0;
 }
};
$('play').addEventListener('click',()=>{if(!artReady){loadArt();return;}clearInput();gardenAudio.unlock();if(game.state==='paused')game.resume();else game.start();});
$('pause').addEventListener('click',()=>game.state==='paused'?game.resume():game.pause());
$('sound').addEventListener('click',()=>{muted=!muted;gardenAudio.setEnabled(!muted);$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Activer les sons':'Couper les sons');if(!muted){if(game.cry>0){gardenAudio.loss(2-game.cry);if(game.state==='paused')gardenAudio.pause();}else if(game.state!=='paused')gardenAudio.catch();}});
document.addEventListener('keydown',e=>{if(e.target?.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'||e.key.toLowerCase()==='p'){game.state==='paused'?game.resume():game.pause();return;}if(e.key===' '&&game.state==='ready'&&artReady){gardenAudio.unlock();game.start();return;}keys.add(e.key.toLowerCase());});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
for(const [id,direction] of [['left',-1],['right',1]]){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();if(game.state!=='playing')return;b.setPointerCapture(e.pointerId);held.add(direction);drag=null;b.classList.add('held');});const release=()=>{held.delete(direction);b.classList.remove('held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);}
canvas.addEventListener('pointerdown',e=>{if(game.state!=='playing')return;canvas.setPointerCapture(e.pointerId);drag=(e.clientX-canvas.getBoundingClientRect().left)/W;});canvas.addEventListener('pointermove',e=>{if(drag!==null)drag=(e.clientX-canvas.getBoundingClientRect().left)/W;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.pause();clearInput();last=0;}});window.addEventListener('blur',()=>{game.pause();clearInput();});
const petals=Array.from({length:36},()=>({x:Math.random(),y:Math.random(),speed:.018+Math.random()*.025,sway:Math.random()*6,leaf:Math.random()<.16,size:3+Math.random()*4}));
const flock=new BirdFlock();
flock.onLand=(x,y)=>petalBurst(x*W,y*H);
let burst=[];
function petalBurst(x,y){if(reduced)return;for(let i=0;i<8;i++)burst.push({x,y,vx:(Math.random()-.5)*45,vy:10+Math.random()*25,life:4,size:2+Math.random()*3});}
function mobileNightBackground(){
 const m=images.mobile,half=m.width/2;
 // The mobile atlas is 887 × 1774. Re-render its painted moon uniformly,
 // over the stretched moon, without moving the scenery or branch anchors.
 const unit=m.height/1774,cx=747*unit,cy=727*unit,r=44*unit;
 if(!mobileMoon){
  mobileMoon=document.createElement('canvas');mobileMoon.width=mobileMoon.height=Math.round(r*2);
  const g=mobileMoon.getContext('2d'),size=mobileMoon.width;
  g.drawImage(m,cx-r,cy-r,r*2,r*2,0,0,size,size);
  const mask=g.createRadialGradient(size/2,size/2,size*34/88,size/2,size/2,size/2);
  mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');
  g.globalCompositeOperation='destination-in';g.fillStyle=mask;g.fillRect(0,0,size,size);
 }
 // Cache the opaque night layer at device resolution. Applying the day/night
 // opacity once avoids a visible patch during the transition and costs no
 // extra per-frame compositing or pixel reads on iPhone.
 const width=canvas.width,height=canvas.height;
 if(!mobileNightCache||mobileNightCache.width!==width||mobileNightCache.height!==height){
  mobileNightCache=document.createElement('canvas');mobileNightCache.width=width;mobileNightCache.height=height;
  const g=mobileNightCache.getContext('2d');
  g.drawImage(m,half,0,half,m.height,0,0,width,height);
  const diameter=r*2*Math.max(width/half,height/m.height);
  g.drawImage(mobileMoon,(cx-half)/half*width-diameter/2,cy/m.height*height-diameter/2,diameter,diameter);
 }
 return mobileNightCache;
}
function background(img){if(!img)return;if(game.mobile&&images.mobile){const m=images.mobile,half=m.width/2;if(img===images.night)ctx.drawImage(mobileNightBackground(),0,0,W,H);else ctx.drawImage(m,0,0,half,m.height,0,0,W,H);}else ctx.drawImage(img,0,0,img.width,img.height,0,0,W,H);}
let previousCat=null;
function drawCat(t,night,dt){
 const pose=catPose(t,game.mobile,night,reduced);
 if(!pose){previousCat=null;return;}
 const s=sprites[pose.jump?7:6];
 const scale=Math.min(W*(game.mobile?.14:.095)/s.w,H*.10/s.h);
 // Position the paws on the branch, rather than the centre of the picture.
 // Rotate around that contact point so walking never lifts the whole cat.
 const angle=pose.jump?0:Math.atan2(pose.dy*H,Math.abs(pose.dx)*W)*(pose.dx<0?-1:1);
 ctx.save();ctx.globalAlpha=pose.alpha;ctx.translate(pose.x*W,pose.y*H);ctx.rotate(angle);
 if(pose.flip)ctx.scale(-1,1);
 ctx.drawImage(s.img,s.x,s.y,s.w,s.h,-s.w*.55*scale,-s.h*.96*scale,s.w*scale,s.h*scale);
 ctx.restore();
 if(dt>0&&previousCat?.jump&&!pose.jump&&previousCat.environment===pose.environment)petalBurst(pose.x*W,pose.y*H);
 previousCat=pose;
}
// Flight poses have their feet aligned, so wing changes never move the body.
const flightRects=[
 [[45,13,423,334,251,292],[457,114,853,378,667,283]],
 [[38,334,438,697,258,650],[451,477,864,757,674,642]],
 [[43,694,438,1050,247,1018],[460,865,858,1132,672,1010]],
 [[48,1048,452,1402,246,1374],[451,1198,864,1477,668,1363]],
 [[121,1414,451,1724,253,1665],[487,1525,864,1758,668,1658]]
];
const perchedFeet=[[.73,.90],[.73,.94],[.70,.96],[.70,.96]];
function drawBird(b,t){
 const size=Math.min(W,H)*(b.kind===4?.041:.055),perched=b.state==='perched';
 ctx.save();ctx.translate(b.x*W,b.y*H);if(b.flip)ctx.scale(-1,1);
 if(perched){const s=sprites[b.kind+8],foot=perchedFeet[b.kind];const scale=Math.min(size*1.65/s.w,size/s.h);ctx.scale(1,1+(reduced?0:Math.sin(t*2+b.kind)*.005));ctx.drawImage(s.img,s.x,s.y,s.w,s.h,-s.w*foot[0]*scale,-s.h*foot[1]*scale,s.w*scale,s.h*scale);}
 else{const pose=Math.floor(t*(b.kind===4?28:9)+b.kind)%2,r=flightRects[b.kind][pose],scale=size/230;ctx.rotate(b.bank*(b.flip?-1:1));ctx.drawImage(images.flight,r[0],r[1],r[2]-r[0],r[3]-r[1],(r[0]-r[4])*scale,(r[1]-r[5])*scale,(r[2]-r[0])*scale,(r[3]-r[1])*scale);}
 ctx.restore();
}
function drawBirds(t,dt,night){
 const environment=perchEnvironment(game.mobile,night);
 if(reduced){if(environment)PERCHES[environment].slice(0,2).forEach((p,i)=>drawBird({...p,kind:i,state:'perched',flip:p.x>.5},t));return;}
 flock.update(dt,environment);
 for(const b of flock.birds)if(b.state!=='away')drawBird(b,t);
}
function drawPetals(t,dt){for(const p of petals){const x=((p.x+t*p.speed*.23+Math.sin(t*.5+p.sway)*.025)%1.15)*W-.05*W,y=((p.y+t*p.speed)%1.13)*H-H*.06;ctx.save();ctx.translate(x,y);ctx.rotate(t+p.sway);ctx.fillStyle=p.leaf?'#aec378':'#f8bbcd';ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.47,0,0,Math.PI*2);ctx.fill();ctx.restore();}burst=burst.filter(p=>p.life>0);for(const p of burst){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=4*dt;ctx.save();ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle='#ffc4d8';ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*.5,p.life,0,Math.PI*2);ctx.fill();ctx.restore();}}
function draw(dt){ctx.clearRect(0,0,W,H);const t=clock,cycle=game.state==='ready'?0:game.time/105;const night=(1-Math.cos(cycle*Math.PI*2))/2; background(images.day);if(images.night){ctx.globalAlpha=night;background(images.night);ctx.globalAlpha=1;}const phase=night<.18?'Lumière du matin':night<.55?'Sous le ciel rose':night<.85?'Le jardin s’endort':'Sous les étoiles';if($('phase').textContent!==phase)$('phase').textContent=phase;
 if(night>.4&&!reduced){ctx.save();ctx.globalAlpha=(night-.4)*.8;for(let i=0;i<13;i++){const x=(.08+((i*.163)% .86))*W+Math.sin(t*.6+i)*9,y=H*(.62+((i*.117)%.30))+Math.cos(t+i)*7;ctx.fillStyle=`rgba(255,239,159,${.3+.5*Math.sin(t*1.5+i)**2})`;ctx.shadowColor='#fff9ac';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,y,1.5,0,7);ctx.fill();}ctx.restore();}
 if(artReady){const manH=H*(game.mobile?.11:.15);const source=game.thrower;sprite(sprites[source.pose>0?5:4],source.x*W,source.y*H-manH*.30,manH*1.3,manH,source.x>.5);drawCat(reduced?0:t,night,dt);drawBirds(t,dt,night);
 for(const i of game.items){const size=Math.min(W,H)*(game.mobile?.073:.056);const s=[sprites[13],starSprite,bearSprite,sprites[14],heartSprite,sprites[15],gagSprite][i.kind];ctx.save();ctx.shadowColor=['#fbc5db','#ffe69c','#e6b780','#ff8196','#ff7a93','#fca8d5','#ff7466'][i.kind];ctx.shadowBlur=night>0.4?15:5;sprite(s,i.x,i.y,size,size,false,Math.sin(i.age*2+i.spin)*.17);ctx.restore();}
 const crying=game.cry>0,moving=game.state==='playing'&&Math.abs(game.player-game.previousPlayer)>.0001,dir=game.player<game.previousPlayer;
 const pose=crying?3:moving?(dir?2:1):0,ph=game.playerHeight,py=H-18-ph/2,cryTime=2-game.cry;
 const sob=crying&&!reduced?Math.sin(cryTime*23)*Math.sin(cryTime*7)*ph*.012:0;
 const bob=crying&&!reduced?Math.abs(Math.sin(cryTime*9))*ph*.010:moving&&!reduced?Math.sin(t*16)*1.3:0;
 const angle=crying&&!reduced?Math.sin(cryTime*11)*.018:moving&&!reduced?Math.sin(t*8)*.012:0;
 const basketOffsets=[.074,.155,-.17,.028];sprite(sprites[pose],game.player*W-ph*basketOffsets[pose]+sob,py+bob,ph*.96,ph,false,angle);
 if(crying&&!reduced){
  // Small tear particles follow the cheeks of the existing crying illustration.
  const eyeY=H-18-ph*.84+bob;
  for(const side of [-1,1])for(let j=0;j<2;j++){const p=(cryTime*1.8+j*.5+(side>0?.16:0))%1;
   ctx.save();ctx.globalAlpha=Math.sin(Math.PI*p)*.9;ctx.fillStyle='#aee5fa';ctx.strokeStyle='#609fc7';ctx.lineWidth=.6;
   ctx.beginPath();ctx.ellipse(game.player*W+sob+side*ph*(.063+p*.035),eyeY+p*ph*.19,ph*.013,ph*.020,side*.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
 }
 for(const e of game.effects){ctx.save();ctx.globalAlpha=Math.min(1,e.life*2);if(e.kind==='catch'){const progress=1-e.life;ctx.fillStyle='#fffbea';ctx.strokeStyle='#477052';ctx.lineWidth=3;ctx.font='700 27px Georgia';ctx.textAlign='center';const y=e.y-20-progress*55;ctx.strokeText('+'+e.value,e.x,y);ctx.fillText('+'+e.value,e.x,y);ctx.strokeStyle='#fff0c4';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(e.x,e.y,10+progress*32,0,7);ctx.stroke();}else{ctx.fillStyle='#f7ced7';ctx.beginPath();ctx.ellipse(e.x,e.y,18*(1-e.life),4,0,0,7);ctx.fill();}ctx.restore();}
 }if(!reduced)drawPetals(t,dt);if(game.cry>0)$('toast').textContent=game.lives>0?'Oh non… −1 vie · Reprise dans '+Math.ceil(game.cry)+' s':'Oh non… −1 vie';$('toast').style.opacity=clock<toastUntil?'1':'0';}
function frame(ms){
 const elapsed=last?Math.max(0,(ms-last)/1000):0,dt=Math.min(elapsed,.05);last=ms;
 const frozen=game.state==='paused'||game.state==='hurt';
 if(game.state!=='paused'){
  if(!frozen)clock+=dt;
  const direction=(keys.has('arrowright')||keys.has('d')||held.has(1)?1:0)-(keys.has('arrowleft')||keys.has('a')||keys.has('q')||held.has(-1)?1:0);
  if(direction)drag=null;game.update(game.state==='hurt'?elapsed:dt,direction,drag);
 }
 draw(frozen||game.state==='hurt'?0:dt);requestAnimationFrame(frame);
}
async function loadArt(){$('play').disabled=true;$('play').textContent='Le jardin se réveille…';try{const [day,night,atlas,mobile,star,heart,flight,bear,gag]=await Promise.all([load('assets/day.png'),load('assets/night.png'),load('assets/atlas.png'),load('assets/mobile.png'),load('assets/star.png'),load('assets/heart.png'),load('assets/birds-flight.png'),load('assets/nounours-guimauve.png'),load('assets/gag-ball.webp')]);images.day=day;images.night=night;images.mobile=mobile;images.flight=flight;parseAtlas(atlas);bearSprite=trimSprite(bear);gagSprite=trimSprite(gag);$('prize-bear').src=cutoutData(bearSprite);starSprite={img:star,x:0,y:0,w:star.width,h:star.height};heartSprite={img:heart,x:0,y:0,w:heart.width,h:heart.height};$('prize-device').src=cutoutData(sprites[15]);$('prize-device').hidden=false;$('device-fallback').hidden=true;artReady=true;$('play').disabled=false;$('play').textContent='Entrer dans le jardin';}catch(e){$('play').disabled=false;$('play').textContent='Réessayer';$('panel-text').textContent='Le décor n’a pas pu se charger. Vérifie ta connexion et réessaie.';console.error('Chargement du jardin :',e.message);}}
syncViewport();fit();hud();requestAnimationFrame(frame);loadArt();
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const result=()=>({state:game.state,score:game.score,lives:game.lives,elapsedSeconds:Math.floor(game.time)});
 const tools=[{name:'read_garden_game',title:'Lire la partie',description:'Lire le score, les vies et l’état de la partie en cours.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:result},{name:'control_garden_game',title:'Démarrer ou mettre en pause',description:'Démarrer une nouvelle partie, mettre en pause ou reprendre le jeu affiché.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','pause','resume']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||!['start','pause','resume'].includes(input.action)||Object.keys(input).some(k=>k!=='action'))throw new Error('Action invalide');if(!artReady)throw new Error('Le décor est encore en cours de chargement');if(input.action==='start'){if(game.state==='playing'||game.state==='paused'||game.state==='hurt')throw new Error('Une partie est déjà en cours');clearInput();game.start();}else if(input.action==='pause')game.pause();else game.resume();return result();}}];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
