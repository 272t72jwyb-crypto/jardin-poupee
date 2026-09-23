import assert from 'node:assert/strict';
import {GardenGame} from './dist/engine.mjs';
import {GardenAudio,LOSS_MELODY,LOSS_DURATION} from './dist/audio.mjs';
for(const [w,h] of [[1200,700],[390,730]]){
 const g=new GardenGame(()=>.1),events=[];g.resize(w,h);g.onEvent=e=>events.push(e);g.start();g.spawnIn=10;
 const item=y=>({kind:0,x:0,y,vx:5,vy:100,g:0,age:0,spin:0});
 g.items=[item(h),item(h),item(h*.3)];g.update(.02);
 assert.equal(g.lives,2);assert.equal(g.state,'hurt');assert.equal(g.cry,2);assert.equal(g.items.length,2);
 const snapshot=JSON.stringify({time:g.time,player:g.player,score:g.score,items:g.items,spawnIn:g.spawnIn});
 g.update(.7,1,.9);assert.equal(g.cry,1.3);
 assert.equal(JSON.stringify({time:g.time,player:g.player,score:g.score,items:g.items,spawnIn:g.spawnIn}),snapshot);
 g.pause();g.update(10);assert.equal(g.cry,1.3);g.resume();assert.equal(g.state,'hurt');
 g.update(1.299);assert.equal(g.state,'hurt');g.update(.001);assert.equal(g.state,'playing');
 assert.equal(g.time,JSON.parse(snapshot).time);assert.equal(events.filter(e=>e==='recover').length,1);
 g.update(.02);assert.equal(g.lives,1);assert.equal(g.state,'hurt');g.update(2);
 g.items=[item(h)];g.update(.02);assert.equal(g.lives,0);assert.equal(g.state,'hurt');assert.ok(!events.includes('over'));
 g.update(1.99);assert.equal(g.state,'hurt');g.update(.01);assert.equal(g.state,'over');assert.equal(events.filter(e=>e==='over').length,1);
 g.start();assert.equal(g.cry,0);assert.equal(g.pausedFrom,null);
}
const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const oscillators=[];
const ctx={currentTime:100,state:'suspended',destination:{},resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},createGain(){return {gain:param(),connect(){},disconnect(){}};},createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(t){this.startAt=t;},stop(t){this.stopAt=t;}};oscillators.push(o);return o;}};
const music=new GardenAudio(()=>ctx);music.loss();assert.equal(ctx.state,'running');assert.ok(oscillators.length>20);
assert.ok(oscillators.every(o=>o.startAt>=100&&o.stopAt<=102+1e-9&&o.stopAt>o.startAt));
music.pause();assert.equal(ctx.state,'suspended');music.resume();assert.equal(ctx.state,'running');
music.setEnabled(false);assert.equal(music.voices.size,0);const count=oscillators.length;music.loss();assert.equal(oscillators.length,count);
music.setEnabled(true);music.loss(1.5);assert.ok(oscillators.slice(count).every(o=>o.stopAt<=100.5+1e-9));
assert.equal(LOSS_DURATION,2);assert.ok(LOSS_MELODY.every(n=>n.at+n.duration<=2+1e-9));
console.log('PASS: 2-second freeze, unchanged objects/input/clock, sequential misses, pause/resume, final-life delay, and original audio scheduling/mute.');
