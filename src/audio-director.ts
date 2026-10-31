import { Feedback } from "./feedback";
import type { PickupKind } from "./model";
export const MUSIC_TRACKS = {
  menu: "/assets/environment/menu.mp3",
  "in-the-wreckage": "/assets/audio/terminal-dash.mp3",
  battle: "/assets/audio/orbital-bombardment.mp3",
} as const;
const LABELS: Record<PickupKind | "score", string> = {
  weapon: "POWER ORB",
  missile: "MISSILES ONLINE",
  drone: "WINGMEN ENHANCED",
  shield: "SHIELD ONLINE",
  repair: "HULL REPAIRED",
  energy: "EMP CELL",
  score: "BONUS SCORE",
};
/** Music and non-verbal effects only. No device speech or recorded announcements. */
export class AudioDirector extends Feedback {
  musicVolume = 0.35;
  musicEnabled = true;
  private tracks = new Map<string, HTMLAudioElement>();
  private mediaSources = new Map<
    HTMLAudioElement,
    MediaElementAudioSourceNode
  >();
  private fadeFrom = new Map<string, number>();
  private active = "";
  private fadeStart = 0;
  private suspended = false;
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
    const blend = Math.max(0, Math.min(1, (now - this.fadeStart) / 400));
    for (const [key, audio] of this.tracks) {
      const target =
        key === this.active && this.musicEnabled
          ? Math.max(0, Math.min(1, this.musicVolume))
          : 0;
      audio.volume = Math.max(
        0,
        Math.min(
          1,
          (this.fadeFrom.get(key) || 0) * (1 - blend) + target * blend,
        ),
      );
      if (key !== this.active && blend === 1 && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }
  pickup(kind: PickupKind | "score") {
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
    this.clearAnnouncements();
    for (const a of this.tracks.values()) a.pause();
  }
  resumeAudio() {
    this.suspended = false;
    this.unlock();
  }
  victory() {
    this.play("end");
  }
  defeat() {
    this.play("hit");
  }
}
