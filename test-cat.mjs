import assert from 'node:assert/strict';
import {CAT_BRANCHES,catPose} from './dist/cat.mjs';
import {GardenGame} from './dist/engine.mjs';

function onSegment(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy);
 return t>=-1e-8&&t<=1+1e-8&&Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<1e-8;
}
for(const mobile of [false,true])for(const night of [0,1]){
 const paths=CAT_BRANCHES[`${mobile?'mobile':'desktop'}-${night?'night':'day'}`];
 for(let t=0;t<68;t+=.031){
  const pose=catPose(t,mobile,night);
  assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.y));
  if(!pose.jump)assert.ok(paths.some(path=>path.slice(1).some((b,i)=>onSegment(pose,path[i],b))),`paws on wood at ${t}`);
 }
 for(const t of [8,10,18,20,22,30,34]){
  const before=catPose(t-1e-6,mobile,night),after=catPose(t+1e-6,mobile,night);
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-5,`continuous jump/walk at ${t}`);
 }
 assert.deepEqual(catPose(0,mobile,night,true),catPose(19,mobile,night,true),'reduced motion stays on its branch');
 for(const n of [.20,.40,.60,.80])assert.equal(catPose(4,mobile,n),null,'no floating cat between different trees');
}
const game=new GardenGame();
game.resize(960,860,true);
assert.equal(game.mobile,true,'portrait tablet despite a temporarily wide canvas');
game.resize(1260,860,false);
assert.equal(game.mobile,false,'landscape tablet');
game.resize(960,1220,true);
assert.equal(game.mobile,true,'return to portrait');
console.log('PASS: four cat branch maps, walking paw contacts, continuous jumps/loop, crossfade, reduced motion and explicit tablet orientation.');
