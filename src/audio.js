import{audible,endTime,encodeWav,envelope}from './model.js';
export class AudioEngine{
 constructor(){this.ctx=null;this.sources=new Map();this.playing=false;this.nodes=[];this.anchor=0;this.started=0;this.playToken=0;}
 context(){if(!this.ctx)this.ctx=new AudioContext();return this.ctx;}
 async ready(){const ctx=this.context();await ctx.resume();return ctx;}
 position(){return this.playing?this.anchor+this.ctx.currentTime-this.started:this.anchor;}
 stop(){this.playToken++;this.anchor=this.position();for(const n of this.nodes)try{n.stop();}catch{}this.nodes=[];this.playing=false;}
 schedule(ctx,s,from,destination){
 const master=ctx.createGain();master.gain.value=s.master;master.connect(destination);
 for(const t of s.tracks){if(!audible(s,t))continue;const gain=ctx.createGain(),pan=ctx.createStereoPanner();gain.gain.value=t.gain;pan.pan.value=t.pan;gain.connect(pan).connect(master);
  for(const c of s.clips.filter(x=>x.trackId===t.id)){const buf=this.sources.get(c.sourceId);if(!buf||c.start+c.duration<=from)continue;const n=ctx.createBufferSource(),env=ctx.createGain();n.buffer=buf;const skip=Math.max(0,from-c.start),when=ctx.currentTime+Math.max(0,c.start-from),duration=c.duration-skip;env.gain.setValueAtTime(c.gain*Math.max(0,envelope(c,skip)),when);if(c.fadeIn>skip)env.gain.linearRampToValueAtTime(c.gain,when+c.fadeIn-skip);const fadeAt=c.duration-c.fadeOut;if(fadeAt>skip)env.gain.setValueAtTime(c.gain,when+fadeAt-skip);env.gain.linearRampToValueAtTime(c.fadeOut>0?0:c.gain,when+duration);n.connect(env).connect(gain);n.start(when,c.offset+skip,duration);this.nodes.push(n);}
 }
 }
 async play(s,from){this.stop();const token=this.playToken;await this.ready();if(token!==this.playToken)return;this.anchor=from;this.started=this.ctx.currentTime;this.schedule(this.ctx,s,from,this.ctx.destination);this.playing=true;}
 async render(s){const ctx=new OfflineAudioContext(2,Math.ceil(endTime(s)*44100),44100);const previous=this.nodes;this.nodes=[];this.schedule(ctx,s,0,ctx.destination);this.nodes=previous;const result=await ctx.startRendering();let peak=0;for(let c=0;c<2;c++)for(const x of result.getChannelData(c))peak=Math.max(peak,Math.abs(x));return{bytes:encodeWav([result.getChannelData(0),result.getChannelData(1)],44100),peak};}
 async decode(data){return this.context().decodeAudioData(data);}
}
export function makeDemo(engine){
 const ctx=engine.context(),sr=22050,len=20;
 const make=(kind)=>{const b=ctx.createBuffer(1,sr*len,sr),d=b.getChannelData(0);let seed=12345;const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2147483648-1;};for(let i=0;i<d.length;i++){const t=i/sr,beat=t%0.625;let v=0;
 if(kind==='rhythm'){v=Math.sin(2*Math.PI*(53*beat+12*(1-Math.exp(-beat*30))))*Math.exp(-beat*16)*0.46;const sh=(t+0.3125)%0.625;v+=noise()*Math.exp(-sh*70)*0.13;if(Math.floor(t/0.625)%2)v+=noise()*Math.exp(-beat*30)*0.2;}
 if(kind==='bass'){const freqs=[65.406,65.406,87.307,77.782],f=freqs[Math.floor(t/5)%4];v=(Math.sin(2*Math.PI*f*t)+0.23*Math.sin(4*Math.PI*f*t))*Math.min(1,beat*40)*Math.exp(-beat*3)*0.3;}
 if(kind==='keys'){const notes=[261.63,329.63,392,493.88,349.23,440,523.25,392],n=Math.floor(t/1.25)%8,p=t%1.25;v=(Math.sin(2*Math.PI*notes[n]*t)+0.35*Math.sin(4*Math.PI*notes[n]*t))*Math.min(1,p*80)*Math.exp(-p*3)*0.21;}
 if(kind==='air'){const env=Math.sin(Math.PI*(t%5)/5)**2;v=(Math.sin(2*Math.PI*130.813*t)+Math.sin(2*Math.PI*196.0*t))*env*0.065;}
 d[i]=v*Math.min(1,t*20,(len-t)*10);
 }return b;};
 for(const kind of['rhythm','bass','keys','air'])engine.sources.set('demo-'+kind,make(kind));
}
