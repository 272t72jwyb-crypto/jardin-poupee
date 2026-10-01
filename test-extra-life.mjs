import assert from 'node:assert/strict';
import {GardenGame} from './dist/engine.mjs';

for(const [w,h] of [[1200,700],[390,730]]){
 const game=new GardenGame(()=>.5),events=[];
 game.resize(w,h);game.start();
 game.onEvent=(event,value)=>{if(event==='extra-life')events.push({value,lives:game.lives,score:game.score});};
 const catchObject=kind=>{
  game.spawnIn=100;
  game.items=[{kind,x:game.player*w,y:game.catchY-1,vy:200,vx:0,g:0,age:0,spin:0}];
  game.update(.02);
 };
 const miss=()=>{
  game.spawnIn=100;
  game.items=[{kind:0,x:0,y:h,vy:200,vx:0,g:0,age:0,spin:0}];
  game.update(.02);game.update(2);
 };

 miss();game.score=98;catchObject(0);
 assert.equal(game.lives,2,'no reward before 100');
 catchObject(0);
 assert.deepEqual(events,[{value:1,lives:3,score:100}],'exact 100 restores one heart before notification');

 miss();catchObject(0);
 assert.equal(game.lives,2,'100-point milestone cannot award twice');
 game.score=195;catchObject(6);
 assert.equal(game.score,245);
 assert.equal(game.lives,3,'50-point object crossing 200 restores one heart');
 assert.equal(events.length,2);

 game.score=299;catchObject(0);
 assert.equal(game.lives,3,'never exceed three hearts');
 assert.equal(events.length,2,'no misleading reward notification when full');
 miss();catchObject(0);
 assert.equal(game.lives,2,'full-heart milestone cannot be saved for later');

 miss();game.score=395;catchObject(5);
 assert.equal(game.score,407);
 assert.equal(game.lives,2,'one missing heart restored, not all missing hearts');
 game.score=499;catchObject(0);
 assert.equal(game.lives,3,'later hundreds still award hearts');

 miss();game.score=599;game.pause();catchObject(0);
 assert.equal(game.score,599);assert.equal(game.lives,2,'pause prevents collection and reward');
 game.resume();catchObject(0);assert.equal(game.lives,3);

 game.start();miss();game.score=99;catchObject(0);
 assert.equal(game.lives,3,'new game can earn the first milestone again');
 assert.equal(events.at(-1).score,100);
}
console.log('PASS: exact and skipped hundreds, +50 objects, three-heart cap, no banking/repeated reward, successive milestones, pause and restart on desktop/mobile.');
