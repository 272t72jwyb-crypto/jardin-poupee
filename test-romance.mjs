import assert from 'node:assert/strict';
import {GardenGame} from './dist/engine.mjs';
import {ROMANTIC_SCENES,ROMANTIC_PHRASES,chooseFinale,qualifiesForFinale} from './dist/romance-data.mjs';

assert.equal(ROMANTIC_SCENES.length,6);assert.equal(ROMANTIC_PHRASES.length,15);
for(const score of [0,99,100,101,150,299,600]){
 const game=new GardenGame();game.start();game.score=score;game.lives=1;game.spawnIn=100;
 const endings=[];game.onEvent=event=>{if(event==='over')endings.push(qualifiesForFinale(game));};
 assert.equal(qualifiesForFinale(game),false,'never interrupt a living player');
 game.items=[{kind:0,x:0,y:game.h,vy:20,vx:0,g:0,age:0,spin:0}];
 game.update(.02);assert.equal(game.state,'hurt');assert.equal(qualifiesForFinale(game),false,'finish the crying animation first');
 game.update(1.9);assert.equal(endings.length,0);game.update(.1);
 assert.deepEqual(endings,[score>100]);
 game.update(.05);assert.equal(endings.length,1,'one ending per completed game');
 game.start();assert.equal(qualifiesForFinale(game),false,'replay resets eligibility');
}
const pairs=new Set();
for(let scene=0;scene<6;scene++)for(let phrase=0;phrase<15;phrase++){
 let call=0;const choice=chooseFinale(()=>++call===1?(scene+.5)/6:(phrase+.5)/15);
 assert.equal(choice.scene,ROMANTIC_SCENES[scene]);assert.equal(choice.phrase,ROMANTIC_PHRASES[phrase]);
 assert.equal(call,2,'independent scene and phrase draws');pairs.add(choice.scene.id+'|'+choice.phrase);
}
assert.equal(pairs.size,90,'every scene/phrase combination is possible');
ROMANTIC_PHRASES.push('Phrase ajoutée pour le test');
assert.equal(chooseFinale(()=>.999).phrase,'Phrase ajoutée pour le test','new phrases require no logic change');
ROMANTIC_PHRASES.pop();
console.log('PASS: final score >100 only, zero lives, 2-second cry, no repeat, restart, all 90 independent combinations and extensible phrases.');
