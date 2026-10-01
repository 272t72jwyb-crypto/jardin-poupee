import assert from 'node:assert/strict';
import {GardenGame,VALUES,FREQUENCIES,chooseKind} from './dist/engine.mjs';
for(const [w,h] of [[1200,700],[390,730]]){
 const g=new GardenGame(()=>.5);g.resize(w,h);g.start();g.spawnIn=100;
 const item=(kind,x,y,vy=300)=>({kind,x,y,vy,vx:0,g:0,age:0,spin:0});
 for(let k=0;k<VALUES.length;k++){g.items=[item(k,w*.5,g.catchY-4)];g.update(.025);assert.equal(g.score,VALUES.slice(0,k+1).reduce((a,b)=>a+b));assert.equal(g.items.length,0);assert.equal(g.lives,3);}
 g.items=[item(0,w*.05,g.catchY-4)];g.update(.025);assert.equal(g.items.length,1,'outside basket must not score');
 const score=g.score;g.pause();const t=g.time;g.update(.04,1);assert.equal(g.time,t);assert.equal(g.player,.5);g.resume();
 for(let i=0;i<3;i++){g.items=[item(0,w*.05,h-13)];g.update(.025);assert.equal(g.lives,2-i);assert.equal(g.state,'hurt');g.update(2);}
 assert.equal(g.state,'over');assert.equal(g.score,score);g.update(.05);assert.equal(g.lives,0);g.start();assert.equal(g.lives,3);assert.equal(g.score,0);
 g.spawnIn=100;for(let i=0;i<100;i++)g.update(.05,-1);assert.equal(g.player,.065);for(let i=0;i<100;i++)g.update(.05,1);assert.equal(g.player,.935);
 g.items=[];g.spawn();const thrown=g.items[0];const duration=Math.max(1.55,3.7-g.time*.017);assert.ok(Math.abs(thrown.y+thrown.vy*duration+.5*thrown.g*duration**2-g.catchY)<.001,'throw reaches catch line');
}
console.log('PASS: desktop/mobile scoring, missed objects, life loss, game over, pause, restart, boundaries and trajectories.');

const counts=Array(VALUES.length).fill(0);for(let i=0;i<10000;i++)counts[chooseKind((i+.5)/10000)]++;assert.deepEqual(counts,[3230,2375,1710,1235,665,285,500]);assert.equal(VALUES[chooseKind(.65)],3);assert.ok(Math.abs(FREQUENCIES.reduce((a,b)=>a+b)-100)<1e-9);assert.equal(VALUES[chooseKind(.9499)],12);assert.equal(VALUES[chooseKind(.95)],50);assert.equal(VALUES[chooseKind(.9999)],50);console.log("PASS: seven collectible values, gag ball +50, exactly 5% probability, and preserved relative rarity.");
