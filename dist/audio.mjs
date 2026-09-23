// Original two-second miniature: warm plucked piano, a few celesta overtones,
// and an E-minor colour. No recording or transcription of an existing work.
export const LOSS_DURATION=2;
export const LOSS_MELODY=[
 {at:0,freq:659.255,duration:.43},
 {at:.29,freq:493.883,duration:.42},
 {at:.58,freq:587.330,duration:.48},
 {at:.94,freq:440,duration:.43},
 {at:1.25,freq:391.995,duration:.44},
 {at:1.58,freq:329.628,duration:.42}
];
export class GardenAudio {
 constructor(createContext=()=>new(globalThis.AudioContext||globalThis.webkitAudioContext)()){this.createContext=createContext;this.context=null;this.enabled=true;this.voices=new Set();}
 unlock(){if(!this.enabled)return;try{this.context??=this.createContext();if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
 setEnabled(enabled){this.enabled=enabled;if(enabled)this.unlock();else this.stop();}
 stop(){for(const osc of this.voices){try{osc.stop();}catch{}}this.voices.clear();}
 pause(){if(this.context?.state==='running')this.context.suspend().catch(()=>{});}
 resume(){this.unlock();}
 tone(freq,at,duration,volume,partials=[1]){
  if(!this.enabled||!this.context)return;
  const c=this.context,start=c.currentTime+at;
  partials.forEach((strength,i)=>{const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq*(i+1),start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*strength,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(c.destination);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration);});
 }
 catch(value=1){if(!this.enabled)return;this.unlock();[523.25,659.25,783.99].slice(0,value>=8?3:1).forEach((f,i)=>this.tone(f,i*.075,.32,.038,[1,.12]));}
 loss(elapsed=0){
  if(!this.enabled)return;this.unlock();this.stop();
  const play=(note,volume,partials)=>{const end=Math.min(LOSS_DURATION,note.at+note.duration);if(end<=elapsed)return;const at=Math.max(0,note.at-elapsed),duration=end-elapsed-at;if(duration>.015)this.tone(note.freq,at,duration,volume,partials);};
  for(const note of LOSS_MELODY){play(note,.065,[1,.23,.08,.025]);play({...note,freq:note.freq*2,duration:Math.min(.30,note.duration)},.011,[1]);}
  [{at:0,freq:164.814,duration:.75},{at:.66,freq:246.942,duration:.65},{at:1.3,freq:164.814,duration:.70}].forEach(n=>play(n,.033,[1,.16]));
 }
}
