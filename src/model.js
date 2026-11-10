export const COLORS=['#99c9ab','#c8aa79','#8faed6','#c29ac8','#d58e83','#94bfca'];
export const LIMITS={tracks:12,clips:120,duration:300,sourceSeconds:120,sourceBytes:30*1024*1024,projectBytes:80*1024*1024};
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const uid=()=>Math.random().toString(36).slice(2,11);
export function track(name,index=0){return{id:uid(),name,color:COLORS[index%COLORS.length],gain:0.8,pan:0,mute:false,solo:false};}
export function session(){return{format:'trackstead',version:1,name:'Untitled session',bpm:96,master:0.8,tracks:[track('Audio 01')],clips:[]};}
export function clip(sourceId,trackId,name,duration,start=0){return{id:uid(),sourceId,trackId,name,start,offset:0,duration,gain:1,fadeIn:Math.min(0.01,duration/2),fadeOut:Math.min(0.02,duration/2)};}
export function endTime(s){return Math.max(1,...s.clips.map(c=>c.start+c.duration));}
export function audible(s,t){return !t.mute&&(!s.tracks.some(x=>x.solo)||t.solo);}
export function snapTime(n,bpm,enabled=true){return Math.max(0,enabled?Math.round(n/(60/bpm))*(60/bpm):Math.round(n*1000)/1000);}
export function splitClip(s,id,time){const c=s.clips.find(x=>x.id===id);if(!c||time<=c.start+0.01||time>=c.start+c.duration-0.01)return false;const d=time-c.start;const next={...c,id:uid(),start:time,offset:c.offset+d,duration:c.duration-d,fadeIn:0};c.duration=d;c.fadeOut=0;c.fadeIn=Math.min(c.fadeIn,d/2);next.fadeOut=Math.min(next.fadeOut,next.duration/2);s.clips.splice(s.clips.indexOf(c)+1,0,next);return next;}
export function trimClip(c,left,right,sourceDuration){const oldEnd=c.start+c.duration;left=clamp(left,Math.max(-c.offset,-c.start),c.duration-0.01);c.start=Math.max(0,c.start+left);c.offset+=left;c.duration=clamp(oldEnd-c.start-right,0.01,sourceDuration-c.offset);c.fadeIn=Math.min(c.fadeIn,c.duration/2);c.fadeOut=Math.min(c.fadeOut,c.duration/2);return c;}
export function validateProject(raw){
 if(!raw||raw.format!=='trackstead'||raw.version!==1)throw Error('Not a Trackstead v1 project.');
 if(!Array.isArray(raw.tracks)||!raw.tracks.length||raw.tracks.length>LIMITS.tracks||!Array.isArray(raw.clips)||raw.clips.length>LIMITS.clips||!Array.isArray(raw.sources)||raw.sources.length>LIMITS.clips)throw Error('Invalid project size.');
 const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 const str=(v,max=100)=>typeof v==='string'&&v.length>0&&v.length<=max;
 const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
 if(!str(raw.name)||!finite(raw.bpm,40,240)||!finite(raw.master,0,1))throw Error('Invalid session settings.');
 const tracks=new Set(),sources=new Set(),clips=new Set();
 for(const t of raw.tracks){if(!id(t.id)||tracks.has(t.id)||!str(t.name)||!/^#[a-f0-9]{6}$/i.test(t.color)||!finite(t.gain,0,1.5)||!finite(t.pan,-1,1)||typeof t.mute!=='boolean'||typeof t.solo!=='boolean')throw Error('Invalid track.');tracks.add(t.id);}
 for(const src of raw.sources){if(!id(src.id)||sources.has(src.id)||typeof src.wav!=='string'||src.wav.length>45*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(src.wav))throw Error('Invalid audio source.');sources.add(src.id);}
 for(const c of raw.clips){if(!id(c.id)||clips.has(c.id)||!str(c.name)||!tracks.has(c.trackId)||!sources.has(c.sourceId)||!finite(c.start,0,LIMITS.duration)||!finite(c.offset,0,LIMITS.sourceSeconds)||!finite(c.duration,0.01,LIMITS.sourceSeconds)||c.start+c.duration>LIMITS.duration||!finite(c.gain,0,2)||!finite(c.fadeIn,0,c.duration/2)||!finite(c.fadeOut,0,c.duration/2))throw Error('Invalid clip.');clips.add(c.id);}
 return structuredClone(raw);
}
export function encodeWav(channels,sampleRate){const frames=channels[0].length,count=channels.length;const bytes=new ArrayBuffer(44+frames*count*2),v=new DataView(bytes);const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};str(0,'RIFF');v.setUint32(4,36+frames*count*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,count,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*count*2,true);v.setUint16(32,count*2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,frames*count*2,true);let o=44;for(let i=0;i<frames;i++)for(let ch=0;ch<count;ch++){const n=clamp(channels[ch][i],-1,1);v.setInt16(o,Math.round(n*(n<0?32768:32767)),true);o+=2;}return bytes;}
export function envelope(c,t){return Math.min(1,c.fadeIn>0?t/c.fadeIn:1,c.fadeOut>0?(c.duration-t)/c.fadeOut:1);}
