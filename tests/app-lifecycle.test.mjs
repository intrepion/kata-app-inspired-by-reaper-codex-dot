import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import {AudioEngine} from '../src/audio.js';

// Minimal DOM and recorder doubles: no browser, microphone, or permission request.
function app(Recorder){
 const elements=new Map();
 const element=selector=>{if(!elements.has(selector))elements.set(selector,{value:'',textContent:'',style:{setProperty(){}},classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},showModal(){},close(){},click(){}});return elements.get(selector);};
 let stoppedTracks=0;
 const stream={getTracks:()=>[{stop(){stoppedTracks++;}}]};
 const context={...model,AudioEngine,makeDemo(){},console,Blob,setTimeout,clearTimeout,performance:{now:()=>0},navigator:{mediaDevices:{getUserMedia:async()=>stream}},MediaRecorder:Recorder,window:{MediaRecorder:Recorder,addEventListener(){}},document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame(){}};
 let source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'');
 source=source.replace('demo();requestAnimationFrame(frame);','');
 source+='\nrender=()=>{};globalThis.testApp={record,importAudio,engine,arm:()=>{armed=state.tracks[0].id;},get:()=>({state,recording,recordPending,busy,cursor})};';
 vm.runInNewContext(source,context);
 return {...context.testApp,element,get stoppedTracks(){return stoppedTracks;}};
}
test('recorder start failure releases stream and leaves app editable',async()=>{
 class Recorder{constructor(){this.state='inactive';}start(){throw new Error('Simulated unsupported recorder');}}
 const a=app(Recorder);a.arm();await a.record();
 assert.ok(a.stoppedTracks>=1);assert.equal(a.get().recording,null);assert.equal(a.get().recordPending,false);assert.equal(a.get().busy,false);
});
test('audio import during playback never inserts past the session limit',async()=>{
 const a=app(class{});a.engine.anchor=290;a.engine.playing=true;a.engine.started=0;a.engine.ctx={currentTime:0};
 a.engine.decode=async()=>({duration:20,numberOfChannels:1});
 await a.importAudio({name:'test.wav',size:44,arrayBuffer:async()=>new ArrayBuffer(44)});
 assert.ok(a.get().state.clips.every(c=>c.start+c.duration<=model.LIMITS.duration));
});
test('record stop releases stream before async decode and crops stored source',async()=>{
 let recorder;
 class Recorder{constructor(){recorder=this;this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';}}
 const a=app(Recorder);a.arm();await a.record();
 a.element('#stop').onclick();assert.ok(a.stoppedTracks>=1);
 let decode;
 a.engine.decode=()=>new Promise(resolve=>{decode=resolve;});
 a.engine.ctx={createBuffer(channels,length,sampleRate){return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,copyToChannel(){}};}};
 const finish=recorder.onstop();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(a.get().busy,true);assert.equal(a.get().recording,null);
 decode({duration:121,length:1210,sampleRate:10,numberOfChannels:1,getChannelData:()=>new Float32Array(1210)});
 await finish;
 assert.equal(a.get().busy,false);assert.equal(a.get().state.clips.length,1);
 assert.equal([...a.engine.sources.values()][0].duration,120);
 assert.equal(a.get().state.clips[0].duration,120);
});
test('confirmed new session releases sources and resets state',()=>{
 const a=app(class{});a.engine.sources.set('old',{duration:120,numberOfChannels:2});
 a.element('#new').onclick();a.element('#confirm-replace').onclick();
 assert.equal(a.engine.sources.size,0);assert.equal(a.get().state.clips.length,0);assert.equal(a.get().state.tracks.length,1);
});
