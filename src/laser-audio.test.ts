import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector } from './audio-director';
afterEach(()=>vi.unstubAllGlobals());

it('stops charge on firing, stops beam audio on pause, and does not replay on resume', () => {
  const voices: {stop:ReturnType<typeof vi.fn>}[]=[];
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  vi.stubGlobal('fetch',()=>Promise.reject(new Error('Offline')));
  vi.stubGlobal('AudioContext',class {
    state='running';currentTime=0;destination={};resume(){return Promise.resolve();}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    createOscillator(){const voice={stop:vi.fn(),start:vi.fn(),connect(){},disconnect(){},frequency:param(),type:'',onended:null};voices.push(voice);return voice;}
  });
  const audio=new AudioDirector();audio.unlock();
  audio.laserCue({id:1,kind:'charge',sweep:false});expect(voices).toHaveLength(1);
  audio.laserCue({id:1,kind:'fire',sweep:false});expect(voices[0].stop).toHaveBeenLastCalledWith();
  expect(voices).toHaveLength(2);
  audio.pauseAudio();expect(voices[1].stop).toHaveBeenLastCalledWith();
  audio.resumeAudio();audio.update();expect(voices).toHaveLength(2);
  audio.enabled=false;audio.laserCue({id:2,kind:'charge',sweep:true});expect(voices).toHaveLength(2);
});
