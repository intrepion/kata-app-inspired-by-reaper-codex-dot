import test from 'node:test';
import assert from 'node:assert/strict';
import {session, clip, splitClip, validateProject} from '../src/model.js';
import {AudioEngine} from '../src/audio.js';

function project(){const s=session();s.sources=[{id:'src',wav:'AAAA'}];s.clips=[clip('src',s.tracks[0].id,'Take',10)];return s;}
for (const at of [1,9]) test(`split at ${at}s preserves project validity with long fades`,()=>{
 const s=project();s.clips[0].fadeIn=4;s.clips[0].fadeOut=4;
 splitClip(s,s.clips[0].id,at);
 assert.doesNotThrow(()=>validateProject(s));
});
for (const kind of ['track','clip']) test(`project rejects HTML attribute delimiters in ${kind} identity`,()=>{
 const s=project(), unsafe='x" autofocus onfocus="alert(1)';
 if(kind==='track'){s.tracks[0].id=unsafe;s.clips[0].trackId=unsafe;}else s.clips[0].id=unsafe;
 assert.throws(()=>validateProject(s));
});
function fakeContext(){
 const gains=[],sources=[];
 const node=()=>({connect(n){return n;}});
 return {currentTime:20,destination:{},gains,sources,resume:async()=>{},
 createGain(){const events=[];const n={...node(),gain:{value:0,setValueAtTime:(...args)=>events.push(['set',...args]),linearRampToValueAtTime:(...args)=>events.push(['ramp',...args])},events};gains.push(n);return n;},
 createStereoPanner(){return {...node(),pan:{value:0}};},
 createBufferSource(){const n={...node(),starts:[],stops:0,start(...args){this.starts.push(args);},stop(){this.stops++;}};sources.push(n);return n;}};
}
test('resume within fade-out starts at its current envelope level',()=>{
 const s=project();s.clips[0].fadeOut=2;const ctx=fakeContext(),e=new AudioEngine();e.sources.set('src',{});
 e.schedule(ctx,s,9,ctx.destination);
 assert.deepEqual(ctx.sources[0].starts,[[20,9,1]]);
 assert.deepEqual(ctx.gains.at(-1).events,[['set',.5,20],['ramp',0,21]]);
});
test('overlapping clips each schedule and stop, resume keeps elapsed position',async()=>{
 const s=project();s.clips.push(clip('src',s.tracks[0].id,'Overlap',4,2));
 const ctx=fakeContext(),e=new AudioEngine();e.ctx=ctx;e.sources.set('src',{});
 await e.play(s,3);assert.equal(ctx.sources.length,2);ctx.currentTime=22;e.stop();
 assert.equal(e.anchor,5);assert.ok(ctx.sources.every(n=>n.stops===1));assert.equal(e.nodes.length,0);
 await e.play(s,e.anchor);assert.equal(ctx.sources.length,4);assert.deepEqual(ctx.sources[3].starts,[[22,3,1]]);
});
