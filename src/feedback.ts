/** Game audio is unlocked by a user gesture. Artist samples use a bounded pool. */
export type EffectKind =
  | "ui-click"
  | "ui-open"
  | "dodge"
  | "emp"
  | "hit"
  | "shield-hit"
  | "drone-intercept"
  | "end"
  | "pulse"
  | "plasma"
  | "laser"
  | "pickup"
  | "ready"
  | "warning"
  | "explosion";
const SAMPLE_URLS: Partial<Record<EffectKind, string>> = {
  pulse: "/assets/audio/pulse.wav",
  plasma: "/assets/audio/drone-fire.wav",
  hit: "/assets/audio/hull-impact.wav",
  "shield-hit": "/assets/audio/shield-impact.wav",
  "drone-intercept": "/assets/audio/hull-impact.wav",
  pickup: "/assets/audio/pickup.wav",
};
const FIRING = new Set<EffectKind>(["pulse", "plasma", "laser"]);
export class Feedback {
  protected context: AudioContext | null = null;
  protected recording: MediaStreamAudioDestinationNode | null = null;
  private buffers = new Map<EffectKind, AudioBuffer>();
  private loadingSamples = false;
  private explosionNoise: AudioBuffer | null = null;
  private voices = 0;
  private lastEffect = new Map<EffectKind, number>();
  enabled = true;
  sfxVolume = 0.75;
  haptics = false;
  ready() {
    this.play("ready");
  }
  unlock() {
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
      if (!this.loadingSamples && typeof fetch === "function") {
        this.loadingSamples = true;
        const ctx = this.context;
        for (const [kind, url] of Object.entries(SAMPLE_URLS))
          void fetch(url)
            .then((r) => {
              if (!r.ok) throw new Error("Sound unavailable");
              return r.arrayBuffer();
            })
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => this.buffers.set(kind as EffectKind, buffer))
            .catch(() => {
              /* Procedural sound remains available offline. */
            });
      }
    } catch {
      /* Sound remains optional on unsupported devices. */
    }
  }
  private connect(gain: GainNode) {
    gain.connect(this.context!.destination);
    if (this.recording) gain.connect(this.recording);
  }
  play(kind: EffectKind) {
    if (
      this.enabled &&
      this.context?.state === "running" &&
      this.sfxVolume > 0
    ) {
      const ctx = this.context;
      const now = ctx.currentTime;
      const firing = FIRING.has(kind);
      // Cap overlapping samples and avoid creating a sound for every rapid-fire pellet.
      const minimumGap = firing
        ? 0.06
        : kind === "explosion"
          ? 0.1
          : kind === "pickup"
            ? 0.07
            : 0.025;
      if (now - (this.lastEffect.get(kind) ?? -Infinity) < minimumGap) return;
      this.lastEffect.set(kind, now);
      if (this.voices < 24) {
        const buffer = this.buffers.get(kind);
        const gain = ctx.createGain();
        this.connect(gain);
        this.voices++;
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const level = firing ? 0.045 : kind === "pickup" ? 0.18 : 0.35;
          const length = Math.min(buffer.duration, firing ? 0.22 : 0.8);
          gain.gain.setValueAtTime(level * this.sfxVolume, now);
          gain.gain.setValueAtTime(
            level * this.sfxVolume,
            now + Math.max(0, length - 0.035),
          );
          gain.gain.linearRampToValueAtTime(0, now + length);
          source.playbackRate.value = kind === "drone-intercept" ? 0.65 : 1;
          source.connect(gain);
          source.start(now);
          source.stop(now + length);
          source.onended = () => {
            source.disconnect();
            gain.disconnect();
            this.voices--;
          };
        } else {
          const osc = ctx.createOscillator();
          const settings: Record<
            EffectKind,
            [number, number, number, OscillatorType]
          > = {
            "ui-click": [780, 520, 0.045, "sine"],
            "ui-open": [420, 800, 0.085, "sine"],
            dodge: [920, 180, 0.22, "sine"],
            emp: [140, 32, 0.62, "sawtooth"],
            hit: [100, 35, 0.21, "triangle"],
            "shield-hit": [1800, 380, 0.28, "sine"],
            "drone-intercept": [230, 40, 0.36, "sawtooth"],
            end: [520, 1040, 0.3, "sine"],
            pulse: [1100, 700, 0.045, "square"],
            plasma: [380, 160, 0.06, "triangle"],
            laser: [1500, 900, 0.06, "sine"],
            pickup: [850, 1400, 0.15, "sine"],
            ready: [660, 1320, 0.25, "sine"],
            warning: [740, 420, 0.5, "triangle"],
            explosion: [110, 28, 0.28, "triangle"],
          };
          const [start, end, length, type] = settings[kind];
          osc.type = type;
          osc.frequency.setValueAtTime(start, now);
          osc.frequency.exponentialRampToValueAtTime(end, now + length);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, (firing ? 0.014 : 0.085) * this.sfxVolume),
            now + 0.01,
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
          osc.connect(gain);
          if (kind === "explosion") {
            // Reuse one short noise buffer; simultaneous deaths cannot allocate
            // an unbounded set of buffers or restart a long explosion sample.
            if (!this.explosionNoise) {
              this.explosionNoise = ctx.createBuffer(
                1,
                Math.ceil(ctx.sampleRate * 0.28),
                ctx.sampleRate,
              );
              const noise = this.explosionNoise.getChannelData(0);
              for (let i = 0; i < noise.length; i++)
                noise[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource(),
              filter = ctx.createBiquadFilter();
            noise.buffer = this.explosionNoise;
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(1500, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + length);
            noise.connect(filter);
            filter.connect(gain);
            noise.start(now);
            noise.stop(now + length);
            noise.onended = () => {
              noise.disconnect();
              filter.disconnect();
            };
          }
          osc.start(now);
          osc.stop(now + length);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
            this.voices--;
          };
        }
      }
    }
    if (
      !FIRING.has(kind) &&
      kind !== "explosion" &&
      this.haptics &&
      typeof navigator.vibrate === "function"
    )
      navigator.vibrate(kind === "emp" ? [35, 35, 60] : 20);
  }
}
