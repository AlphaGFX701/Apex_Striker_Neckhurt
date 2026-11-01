import type { LaserCue } from "./laser-presentation";
import { Feedback } from "./feedback";
import { MusicPlayback } from "./music-playback";
import type { PickupKind } from "./model";
export const MUSIC_TRACKS = {
  menu: "/assets/environment/menu.mp3",
  "in-the-wreckage": "/assets/audio/terminal-dash.mp3",
  battle: "/assets/audio/orbital-bombardment.mp3",
} as const;
const LABELS: Record<PickupKind | "score" | "super", string> = {
  weapon: "POWER",
  missile: "MISSILES",
  drone: "WINGMEN",
  shield: "SHIELD",
  repair: "REPAIR",
  energy: "EMP",
  score: "BONUS",
  super: "SUPER",
};
/** Music and non-verbal effects only. No device speech or recorded announcements. */
export class AudioDirector extends Feedback {
  musicVolume = 0.35;
  musicEnabled = true;
  private mediaSources = new Map<
    HTMLAudioElement,
    MediaElementAudioSourceNode
  >();
  private playback = new MusicPlayback<keyof typeof MUSIC_TRACKS>((track) => {
    const audio = new Audio(MUSIC_TRACKS[track]);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    this.connectMedia(audio);
    audio.load?.();
    return audio;
  });
  private suspended = false;
  private laserBuffers = new Map<string, AudioBuffer>();
  private laserLoading = false;
  private laserVoices = new Map<number, { source: AudioScheduledSourceNode; gain: GainNode; level: number }>();
  laserCue(cue: LaserCue) {
    this.stopLaser(cue.id);
    if(cue.kind === "stop" || this.suspended || !this.enabled || !this.context || this.context.state !== "running" || this.sfxVolume <= 0) return;
    const ctx=this.context, gain=ctx.createGain(), duration=cue.kind === "charge" ? 1.2 : cue.sweep ? 1.4 : .6;
    let level=cue.kind === "charge" ? .2 : .24;
    gain.gain.value=level*this.sfxVolume;
    gain.connect(ctx.destination); if(this.recording)gain.connect(this.recording);
    const buffer=this.laserBuffers.get(cue.kind);
    let source: AudioScheduledSourceNode;
    if(buffer) {const sample=ctx.createBufferSource();sample.buffer=buffer;source=sample;}
    else {
      const osc=ctx.createOscillator();osc.type=cue.kind === "charge" ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(cue.kind === "charge" ? 180 : 110,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(cue.kind === "charge" ? 1100 : 38,ctx.currentTime+duration);
      level *= .15;
      gain.gain.setValueAtTime(level*this.sfxVolume,ctx.currentTime);
      source=osc;
    }
    source.connect(gain);source.start();source.stop(ctx.currentTime+duration);
    this.laserVoices.set(cue.id,{source,gain,level});
    source.onended=()=>{source.disconnect();gain.disconnect();if(this.laserVoices.get(cue.id)?.source===source)this.laserVoices.delete(cue.id);};
  }
  private stopLaser(id:number) {
    const voice=this.laserVoices.get(id); if(!voice)return;
    try {voice.source.stop();} catch {} voice.source.disconnect();voice.gain.disconnect();this.laserVoices.delete(id);
  }
  private stopLasers() {for(const id of this.laserVoices.keys())this.stopLaser(id);}

  onAnnouncement?: (text: string) => void;
  private connectMedia(audio: HTMLAudioElement) {
    if (!this.context || this.mediaSources.has(audio)) return;
    const source = this.context.createMediaElementSource(audio);
    source.connect(this.context.destination);
    if (this.recording) source.connect(this.recording);
    this.mediaSources.set(audio, source);
  }
  capture() {
    this.unlock();
    if (!this.context) return null;
    const alreadyCapturing = !!this.recording;
    this.recording ??= this.context.createMediaStreamDestination();
    if (!alreadyCapturing) {
      for (const source of this.mediaSources.values())
        source.connect(this.recording);
    }
    for (const audio of this.playback.elements()) this.connectMedia(audio as HTMLAudioElement);
    return this.recording.stream;
  }
  music(track: keyof typeof MUSIC_TRACKS) {
    this.playback.request(track);
    if (track === "in-the-wreckage") this.playback.prepare("battle");
  }
  musicStatus() { return this.playback.status(); }
  unlock() {
    super.unlock();
    if(this.context && !this.laserLoading) {
      this.laserLoading=true; const ctx=this.context;
      for(const kind of ["charge","fire"]) void fetch(`/assets/tactical-remake/audio/laser-${kind}.wav`)
        .then(r=>{if(!r.ok)throw Error("Audio unavailable");return r.arrayBuffer();})
        .then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>this.laserBuffers.set(kind,buffer)).catch(()=>{});
    }
    for (const audio of this.playback.elements()) this.connectMedia(audio as HTMLAudioElement);
    this.playback.unlock();
  }
  update(now = performance.now()) {
    if(!this.enabled || this.suspended) this.stopLasers();
    for(const voice of this.laserVoices.values()) voice.gain.gain.value=voice.level*this.sfxVolume;

    this.playback.update(this.musicEnabled, this.musicVolume, now);
  }
  pickup(kind: PickupKind | "score" | "super") {
    this.play("pickup");
    this.onAnnouncement?.(LABELS[kind]);
  }
  shieldHit() {
    this.play("shield-hit");
  }
  droneIntercept() {
    this.play("drone-intercept");
  }
  hullHit() {
    this.play("hit");
  }
  explosion() {
    this.play("explosion");
  }
  ready() {} // Readiness is visual; only activation produces an EMP cue.
  warning() {
    this.play("warning");
  }
  clearAnnouncements() {
    this.onAnnouncement?.("");
  }
  pauseAudio() {
    this.suspended = true;
    this.stopLasers();
    this.clearAnnouncements();
    this.playback.pause();
  }
  resumeAudio() {
    this.suspended = false;
    this.playback.resume();
    this.unlock();
  }
  victory() {
    this.play("end");
  }
  defeat() {
    this.play("hit");
  }
}
