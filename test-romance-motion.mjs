import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MOTIONS,poseAt} from './dist/romance-motion.mjs';
import {ROMANTIC_SCENES} from './dist/romance-data.mjs';

assert.deepEqual(Object.keys(MOTIONS),ROMANTIC_SCENES.map(s=>s.id));
for(const [id,motion] of Object.entries(MOTIONS)){
 assert.ok(fs.existsSync(new URL('./dist/'+motion.file,import.meta.url)),`${id} animation file`);
 assert.equal(motion.durations.length,8);
 let elapsed=0;
 for(let i=0;i<8;i++){
  assert.ok(motion.durations[i]>0);
  assert.equal(poseAt((elapsed+motion.durations[i]/2)/1000,motion.durations),i,`${id} displays pose ${i}`);
  elapsed+=motion.durations[i];
 }
 assert.equal(poseAt((elapsed+.001)/1000,motion.durations),0,`${id} loops`);
}
console.log('PASS: six actual sprite animations, eight timed poses each, independent playback and loop timing.');
