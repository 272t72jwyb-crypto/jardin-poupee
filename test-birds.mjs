import assert from 'node:assert/strict';
import {BirdFlock,PERCHES,perchEnvironment} from './dist/birds.mjs';
let seed=61;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
let totalLandings=0;
for(const env of Object.keys(PERCHES)){
 const flock=new BirdFlock(random);let landed=0;flock.onLand=()=>landed++;
 for(let frame=0;frame<7200;frame++){
  const before=flock.birds.map(b=>({x:b.x,y:b.y,state:b.state}));flock.update(1/60,env);
  const occupied=[];
  for(const [i,b] of flock.birds.entries()){
   if(b.state==='perched'){
    assert.deepEqual({x:b.x,y:b.y},PERCHES[env][b.perch],'feet must stay on a mapped branch');
    occupied.push(b.perch);assert.notEqual(b.kind,4,'hummingbird keeps its flight pose');
   }
   if(b.state!=='away'&&before[i].state!=='away')assert.ok(Math.hypot(b.x-before[i].x,b.y-before[i].y)<.05,'no visible teleport');
  }
  assert.ok(occupied.length<=2);assert.equal(new Set(occupied).size,occupied.length,'birds do not occupy the same perch');
 }
 assert.ok(landed>3,env+' must include repeat arrivals');totalLandings+=landed;
 const position=flock.birds.map(b=>({x:b.x,y:b.y}));flock.update(0,null);
 assert.ok(flock.birds.every(b=>b.state!=='perched'&&b.state!=='landing'),'take flight during background change, including while paused');
 assert.deepEqual(flock.birds.map(b=>({x:b.x,y:b.y})),position);
 for(let i=0;i<600;i++)flock.update(1/60,null);
 assert.ok(flock.birds.every(b=>b.state!=='perched'&&b.perch===null));
}
assert.equal(perchEnvironment(true,0),'mobile-day');assert.equal(perchEnvironment(false,1),'desktop-night');assert.equal(perchEnvironment(true,.5),null);
console.log(`PASS: four painted branch maps, ${totalLandings} landings, continuous flights, occupancy, mobile/day/night transitions and paused resize.`);
