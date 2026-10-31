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
/** A small bounded voice queue; stale announcements never survive a pause. */
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
  capture() {
    this.unlock();
    if (!this.context) return null;
    this.recording ??= this.context.createMediaStreamDestination();
    for (const audio of this.tracks.values())
      if (!this.mediaSources.has(audio)) {
        const source = this.context.createMediaElementSource(audio);
        source.connect(this.context.destination);
        source.connect(this.recording);
        this.mediaSources.set(audio, source);
      }
    return this.recording.stream;
  }
  private active = "";
  private fadeStart = 0;
  private duck = false;
  private voiceTimer = 0;
  private releaseTimer = 0;
  private speaking = false;
  private generation = 0;
  onAnnouncement?: (text: string) => void;
  music(track: "menu" | "in-the-wreckage" | "battle") {
    if (this.active === track) return;
    let audio = this.tracks.get(track);
    if (!audio) {
      audio = new Audio(`/assets/environment/${track}.mp3`);
      audio.loop = true;
      audio.preload = "metadata";
      this.tracks.set(track, audio);
      if (this.recording && this.context) {
        const source = this.context.createMediaElementSource(audio);
        source.connect(this.context.destination);
        source.connect(this.recording);
        this.mediaSources.set(audio, source);
      }
    }
    this.active = track;
    this.fadeStart = performance.now();
    audio.volume = 0;
    void audio.play().catch(() => {
      /* Retry on the next user gesture. */
    });
  }
  unlock() {
    super.unlock();
    for (const [key, audio] of this.tracks)
      if (key === this.active && audio.paused)
        void audio.play().catch(() => {});
  }
  update() {
    const blend = Math.min(1, (performance.now() - this.fadeStart) / 400);
    for (const [key, audio] of this.tracks) {
      const target =
        key === this.active ? this.musicVolume * (this.duck ? 0.5 : 1) : 0;
      audio.volume += (target - audio.volume) * (blend >= 1 ? 0.2 : 0.08);
      if (key !== this.active && audio.volume < 0.002) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }
  pickup(kind: PickupKind) {
    this.play("pickup");
    if (
      this.enabled &&
      this.context?.state === "running" &&
      this.sfxVolume > 0
    ) {
      const ctx = this.context,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      const index = (
        [
          "weapon",
          "missile",
          "drone",
          "shield",
          "repair",
          "energy",
        ] as PickupKind[]
      ).indexOf(kind);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(580 + index * 115, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1000 + index * 180,
        ctx.currentTime + 0.16,
      );
      gain.gain.setValueAtTime(0.035 * this.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (this.recording) gain.connect(this.recording);
      osc.start();
      osc.stop(ctx.currentTime + 0.21);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    this.say(PICKUP_PHRASES[kind]);
  }
  ready() {
    this.play("ready");
    this.say("EMP ready", true);
  }
  warning() {
    this.play("warning");
  }
  private say(text: string, priority = false) {
    this.onAnnouncement?.(text);
    if (!this.voiceEnabled || this.voiceVolume <= 0) return;
    this.queue.enqueue(text, priority);
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
    if (!text) {
      this.duck = false;
      return;
    }
    if (!("speechSynthesis" in window)) {
      this.queue.clear();
      return;
    }
    const token = this.generation;
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
      this.duck = true;
      this.speaking = true;
      let finished = false;
      const done = () => {
        if (finished || token !== this.generation) return;
        finished = true;
        clearTimeout(this.releaseTimer);
        this.speaking = false;
        this.speak();
      };
      utterance.onend = done;
      utterance.onerror = done;
      this.releaseTimer = window.setTimeout(done, 3500);
      speechSynthesis.speak(utterance);
    } catch {
      this.duck = false;
      this.speaking = false;
      this.queue.clear();
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
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  pauseAudio() {
    this.clearAnnouncements();
    for (const audio of this.tracks.values()) audio.pause();
  }
  resumeAudio() {
    this.unlock();
  }
  victory() {
    this.play("end");
    window.setTimeout(() => this.play("ready"), 120);
  }
}
