import {RomanticMotion,MOTIONS,measurePoses} from './romance-motion.mjs?v=romance-15';
import {chooseFinale,ROMANTIC_SCENES} from './romance-data.mjs?v=romance-15';

export class RomanticFinale {
 constructor({onReplay,onClose,getAssets}){
  this.onReplay=onReplay;this.onClose=onClose;this.cache=new Map();this.loading=new Map();this.request=0;this.motionCache=new Map();this.backgrounds=new Map();
  this.dialog=document.getElementById('romantic-finale');
  this.art=document.getElementById('finale-art');this.backdrop=document.getElementById('finale-backdrop');
  this.title=document.getElementById('finale-title');this.phrase=document.getElementById('finale-phrase');
  this.status=document.getElementById('finale-status');
  this.motionCanvas=document.getElementById('finale-motion');this.motionButton=document.getElementById('finale-motion-toggle');
  this.motion=new RomanticMotion(this.motionCanvas,getAssets,paused=>{
   this.motionButton.textContent=paused?'Animer la scène':'Mettre l’animation en pause';
   this.motionButton.setAttribute('aria-pressed',String(!paused));
  });
  this.motionButton.addEventListener('click',()=>this.motion.toggle());
  document.getElementById('finale-replay').addEventListener('click',()=>{this.close(false);this.onReplay();});
  document.getElementById('finale-result').addEventListener('click',()=>this.close());
  this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
  document.getElementById('finale-retry').addEventListener('click',()=>this.show(this.score,this.choice));

 }
 loadScene(scene){
  if(this.cache.has(scene.id))return Promise.resolve(this.cache.get(scene.id));
  let source=this.loading.get(scene.image);
  if(!source){
   source=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('scene unavailable'));img.src=scene.image;});
   this.loading.set(scene.image,source);
   source.catch(()=>this.loading.delete(scene.image));
  }
  return source.then(img=>{
   const [x,y,w,h]=scene.rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   canvas.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);
   const url=canvas.toDataURL('image/webp',.94);this.cache.set(scene.id,url);return url;
  });
 }
 loadBackground(scene){
  const file=scene.id==='vanille'?'assets/romance-vanille-background.webp':'assets/romance-backgrounds.webp';
  if(this.backgrounds.has(file))return this.backgrounds.get(file);
  const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('background unavailable'));img.src=file;});
  this.backgrounds.set(file,promise);promise.catch(()=>this.backgrounds.delete(file));return promise;
 }
 loadMotion(scene){
  if(this.motionCache.has(scene.id))return this.motionCache.get(scene.id);
  const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{try{resolve(measurePoses(img));}catch(e){reject(e);}};img.onerror=()=>reject(new Error('animation unavailable'));img.src=MOTIONS[scene.id].file;});
  this.motionCache.set(scene.id,promise);promise.catch(()=>this.motionCache.delete(scene.id));return promise;
 }
 warm(){for(const scene of ROMANTIC_SCENES)this.loadScene(scene).catch(()=>{});}
 async show(score,choice=chooseFinale()){
  this.score=score;this.choice=choice;const request=++this.request;this.motion.stop();this.motionCanvas.hidden=true;this.motionButton.hidden=true;this.art.hidden=false;
  this.dialog.classList.remove('revealed');this.art.removeAttribute('src');this.backdrop.removeAttribute('src');
  this.title.textContent=choice.scene.title;this.phrase.textContent=choice.phrase;
  document.getElementById('finale-score').textContent=`Ta récolte · ${score} points`;
  this.status.textContent='Ton animation se prépare…';this.status.hidden=false;
  document.getElementById('finale-retry').hidden=true;this.art.alt=choice.scene.alt;
  if(!this.dialog.open)this.dialog.showModal();
  document.body.classList.add('watching-finale');
  try{
   const [url,poses,background]=await Promise.all([this.loadScene(choice.scene),this.loadMotion(choice.scene),this.loadBackground(choice.scene)]);
   if(request!==this.request||!this.dialog.open)return;
   this.art.src=url;this.backdrop.src=url;this.art.hidden=true;this.motionCanvas.hidden=false;this.motionButton.hidden=false;this.motionCanvas.setAttribute('aria-label',choice.scene.alt);this.motion.start(choice.scene,poses,background);
   this.status.hidden=true;
   requestAnimationFrame(()=>{if(request===this.request&&this.dialog.open)this.dialog.classList.add('revealed');});
  }catch{
   if(request!==this.request||!this.dialog.open)return;
   this.status.textContent='L’animation n’a pas pu se charger. Tu peux réessayer ou revenir à ta récolte.';
   document.getElementById('finale-retry').hidden=false;
  }
 }
 close(returnToResult=true){
  ++this.request;this.motion.stop();this.dialog.close();document.body.classList.remove('watching-finale');
  if(returnToResult)this.onClose();
 }
}
