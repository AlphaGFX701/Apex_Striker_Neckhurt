import { Feedback } from "./feedback";
import type { PickupKind } from "./model";
export const PICKUP_PHRASES: Record<PickupKind, string> = {
  weapon: "Weapon enhanced",
  missile: "Missiles online",
  drone: "Drone deployed",
  shield: "Shield online",
  repair: "Hull repaired",
  energy: "EMP charging",
};
export type VoiceKey = PickupKind | "ready";
export interface VoiceClip {
  key: VoiceKey;
  text: string;
  recordedUrl: string | null;
}
/** The supplied WAVs were verified as unrelated NPC dialogue. Do not mislabel cuts. */
export const VOICE_CLIPS: readonly VoiceClip[] = [
  ...Object.entries(PICKUP_PHRASES).map(([key, text]) => ({
    key: key as PickupKind,
    text,
    recordedUrl: null,
  })),
  { key: "ready", text: "EMP ready", recordedUrl: null },
];
export const MUSIC_TRACKS = {
  menu: "/assets/environment/menu.mp3",
  "in-the-wreckage": "/assets/audio/terminal-dash.mp3",
  battle: "/assets/audio/orbital-bombardment.mp3",
} as const;
export const VOICE_SOURCE_STATUS =
  "Device voice · supplied WAV content does not match announcements";

/** Two pending messages at most; duplicates and expired mission voices are discarded. */
export class AnnouncementQueue {
  pending: string[] = [];
  enqueue(text: string, priority = false) {
    if (this.pending.includes(text)) return;
    if (priority) this.pending.unshift(text);
    else this.pending.push(text);
    this.pending = this.pending.slice(0, 2);
  }
  clear() {
    this.pending = [];
  }
}
export class AudioDirector extends Feedback {
  musicVolume = 0.35;
  voiceVolume = 0.8;
  private queue = new AnnouncementQueue();
  private tracks = new Map<string, HTMLAudioElement>();
  private mediaSources = new Map<
    HTMLAudioElement,
    MediaElementAudioSourceNode
  >();
  private fadeFrom = new Map<string, number>();
  private active = "";
  private fadeStart = 0;
  private duck = false;
  private duckLevel = 1;
  private updateAt = 0;
  private voiceTimer = 0;
  private releaseTimer = 0;
  private speaking = false;
  private generation = 0;
  private suspended = false;
  private voiceSource: AudioBufferSourceNode | null = null;
  private voiceGain: GainNode | null = null;
  private voiceBuffers = new Map<string, AudioBuffer>();
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
      this.voiceGain?.connect(this.recording);
    }
    for (const audio of this.tracks.values()) this.connectMedia(audio);
    return this.recording.stream;
  }
  private prepareTrack(track: keyof typeof MUSIC_TRACKS) {
    let audio = this.tracks.get(track);
    if (!audio) {
      audio = new Audio(MUSIC_TRACKS[track]);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      this.tracks.set(track, audio);
      this.connectMedia(audio);
      audio.load?.();
    }
    return audio;
  }
  music(track: keyof typeof MUSIC_TRACKS) {
    // Called every HUD tick; this guard also preserves music position across boss phases.
    if (this.active === track) return;
    const audio = this.prepareTrack(track);
    // Fetch the long boss recording during the approach, without playing it.
    // The same preloaded element is reused when the capital ship arrives.
    if (track === "in-the-wreckage") this.prepareTrack("battle");
    this.fadeFrom.clear();
    for (const [key, item] of this.tracks) this.fadeFrom.set(key, item.volume);
    this.active = track;
    this.fadeStart = performance.now();
    if (!this.suspended)
      void audio.play().catch(() => {
        /* Retry on the next gesture. */
      });
  }
  unlock() {
    super.unlock();
    for (const [key, audio] of this.tracks) {
      this.connectMedia(audio);
      if (!this.suspended && key === this.active && audio.paused)
        void audio.play().catch(() => {});
    }
  }
  update(now = performance.now()) {
    const dt = Math.max(0, Math.min(0.1, (now - this.updateAt) / 1000));
    this.updateAt = now;
    this.duckLevel +=
      ((this.duck ? 0.5 : 1) - this.duckLevel) * (1 - Math.exp(-dt * 12));
    const blend = Math.max(0, Math.min(1, (now - this.fadeStart) / 400));
    for (const [key, audio] of this.tracks) {
      const target =
        key === this.active ? Math.max(0, Math.min(1, this.musicVolume)) : 0;
      const start = this.fadeFrom.get(key) || 0;
      audio.volume = Math.max(
        0,
        Math.min(1, (start + (target - start) * blend) * this.duckLevel),
      );
      if (key !== this.active && blend === 1 && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    if ((!this.voiceEnabled || this.voiceVolume <= 0) && this.speaking)
      this.clearAnnouncements();
    if (this.voiceGain)
      this.voiceGain.gain.value = Math.max(0, Math.min(1, this.voiceVolume));
  }
  pickup(kind: PickupKind | "score") {
    this.play("pickup");
    if (kind === "score") {
      this.onAnnouncement?.("Bonus score");
      return;
    }
    this.say(PICKUP_PHRASES[kind]);
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
  ready() {
    this.play("ready");
    this.say("EMP ready", true);
  }
  warning() {
    this.play("warning");
  }
  previewVoice(key: VoiceKey) {
    this.unlock();
    this.clearAnnouncements();
    const clip = VOICE_CLIPS.find((item) => item.key === key);
    if (clip) this.say(clip.text, true);
  }
  private say(text: string, priority = false) {
    this.onAnnouncement?.(text);
    if (!this.voiceEnabled || this.voiceVolume <= 0 || this.suspended) return;
    this.queue.enqueue(text, priority);
    if (priority && this.voiceTimer) {
      clearTimeout(this.voiceTimer);
      this.voiceTimer = 0;
    }
    if (!this.voiceTimer && !this.speaking)
      this.voiceTimer = window.setTimeout(
        () => {
          this.voiceTimer = 0;
          this.speak();
        },
        priority ? 0 : 350,
      );
  }
  private speak() {
    const text = this.queue.pending.shift();
    if (
      !text ||
      !this.voiceEnabled ||
      this.voiceVolume <= 0 ||
      this.suspended
    ) {
      this.duck = false;
      return;
    }
    const token = this.generation;
    this.duck = true;
    this.speaking = true;
    let finished = false;
    const done = () => {
      if (finished || token !== this.generation) return;
      finished = true;
      clearTimeout(this.releaseTimer);
      this.voiceSource = null;
      this.voiceGain?.disconnect();
      this.voiceGain = null;
      this.speaking = false;
      this.speak();
    };
    const clip = VOICE_CLIPS.find((item) => item.text === text);
    if (clip?.recordedUrl && this.context?.state === "running") {
      void this.playRecorded(clip.recordedUrl, token, done).catch(() => {
        if (token === this.generation) this.speakDevice(text, done);
      });
    } else this.speakDevice(text, done);
  }
  private async playRecorded(url: string, token: number, done: () => void) {
    const ctx = this.context!;
    let buffer = this.voiceBuffers.get(url);
    if (!buffer) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Voice clip unavailable");
      buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      this.voiceBuffers.set(url, buffer);
    }
    if (token !== this.generation) return;
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = this.voiceVolume;
    source.connect(gain);
    gain.connect(ctx.destination);
    if (this.recording) gain.connect(this.recording);
    this.voiceSource = source;
    this.voiceGain = gain;
    source.onended = () => {
      source.disconnect();
      done();
    };
    source.start();
    this.releaseTimer = window.setTimeout(done, (buffer.duration + 1) * 1000);
  }
  private speakDevice(text: string, done: () => void) {
    if (!("speechSynthesis" in window)) {
      done();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.06;
      utterance.pitch = 0.75;
      utterance.volume = this.voiceVolume;
      utterance.voice =
        speechSynthesis
          .getVoices()
          .find(
            (v) =>
              v.lang.startsWith("en") && /David|Daniel|Alex|Male/i.test(v.name),
          ) ||
        speechSynthesis.getVoices().find((v) => v.lang.startsWith("en")) ||
        null;
      utterance.onend = done;
      utterance.onerror = done;
      this.releaseTimer = window.setTimeout(done, 3500);
      speechSynthesis.speak(utterance);
    } catch {
      done();
    }
  }
  clearAnnouncements() {
    this.generation++;
    clearTimeout(this.voiceTimer);
    clearTimeout(this.releaseTimer);
    this.voiceTimer = 0;
    this.queue.clear();
    this.speaking = false;
    this.duck = false;
    this.voiceSource?.stop();
    this.voiceSource?.disconnect();
    this.voiceSource = null;
    this.voiceGain?.disconnect();
    this.voiceGain = null;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  pauseAudio() {
    this.suspended = true;
    this.clearAnnouncements();
    for (const audio of this.tracks.values()) audio.pause();
  }
  resumeAudio() {
    this.suspended = false;
    this.unlock();
  }
  victory() {
    this.play("end");
  }
}
