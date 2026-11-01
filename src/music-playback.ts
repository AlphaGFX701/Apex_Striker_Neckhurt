/** Browser media adapter. Playback promises, not track requests, confirm a handoff. */
export interface MusicMedia {
  volume: number;
  paused: boolean;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener?(name: string, listener: () => void): void;
}

/** Owns desired/audible music, bounded recovery and cancellation across game screens. */
export class MusicPlayback<Track extends string> {
  private tracks = new Map<Track, MusicMedia>();
  private desired?: Track;
  private audible?: Track;
  private starts = new Map<Track, { pending?: object; attempts:number; retryAt:number }>();
  private generation = 0;
  private suspended = false;
  private enabled = true;
  private volume = 0.35;
  private fadeStart = -Infinity;
  private fadeFrom = new Map<Track, number>();

  constructor(private create: (track: Track) => MusicMedia, private now = () => performance.now()) {}

  prepare(track: Track) {
    let media = this.tracks.get(track);
    if (!media) {
      media = this.create(track);
      media.volume = 0;
      this.tracks.set(track, media);
      media.addEventListener?.("canplay", () => {
        if (track === this.desired) this.unlock();
      });
    }
    return media;
  }

  elements() { return this.tracks.values(); }
  status() {
    const media=this.audible ? this.tracks.get(this.audible) : undefined;
    return {desired:this.desired??null,audible:this.audible??null,pending:this.desired && this.starts.get(this.desired)?.pending ? this.desired : null,
      playing:!!media && !media.paused && media.volume>0 && !this.suspended && this.enabled,
      currentTime:media?.currentTime??0,suspended:this.suspended,enabled:this.enabled};
  }

  request(track: Track) {
    this.prepare(track);
    if (this.desired !== track) {
      this.cancelPending();
      this.desired = track;
      this.resetRetries();
    }
    this.ensurePlaying();
  }

  private cancelPending() {
    this.generation++;
    for(const [track,start] of this.starts) {
      if(start.pending && track!==this.audible)this.tracks.get(track)?.pause();
      start.pending=undefined;
    }
  }
  private resetRetries() {
    for(const start of this.starts.values())if(!start.pending){start.attempts=0;start.retryAt=0;}
  }

  private ensurePlaying() {
    if(this.suspended || !this.enabled)return;
    // Resume the confirmed fallback too, while the desired recording is unavailable.
    if(this.audible && this.audible!==this.desired)this.startTrack(this.audible);
    if(this.desired)this.startTrack(this.desired);
  }
  private startTrack(track:Track) {
    const media=this.prepare(track);
    if (track === this.audible && !media.paused) return;
    let start=this.starts.get(track);
    if(!start){start={attempts:0,retryAt:0};this.starts.set(track,start);}
    if(start.pending || start.attempts>=3 || this.now()<start.retryAt)return;
    const attempt = { generation:this.generation };
    start.pending = attempt;
    start.attempts++;
    let started: Promise<void>;
    try { started = media.play(); } catch (error) { started = Promise.reject(error); }
    void started.then(() => {
      if (start.pending !== attempt || attempt.generation !== this.generation) {
        // A delayed play() may start after Pause or navigation. Do not resurrect it.
        if (this.suspended || !this.enabled || (track !== this.desired && track !== this.audible)) media.pause();
        return;
      }
      start.pending = undefined;
      start.attempts = 0;
      if (this.desired === track && this.audible !== track) {
        this.fadeFrom = new Map([...this.tracks].map(([key, item]) => [key, item.volume]));
        this.audible = track;
        this.fadeStart = this.now();
      }
    }).catch(() => {
      if (start.pending !== attempt || attempt.generation !== this.generation) return;
      start.pending = undefined;
      start.retryAt = this.now() + [500, 1000, 2000][start.attempts - 1];
      if (track !== this.audible) { media.pause(); media.volume = 0; }
    });
  }

  update(enabled: boolean, volume: number, now = this.now()) {
    if (this.enabled !== enabled) {
      this.enabled = enabled;
      this.cancelPending();
      this.resetRetries();
    }
    this.volume = Math.max(0, Math.min(1, volume));
    const blend = Math.max(0, Math.min(1, (now - this.fadeStart) / 400));
    for (const [key, media] of this.tracks) {
      const target = key === this.audible && enabled ? this.volume : 0;
      media.volume = enabled ? Math.max(0, Math.min(1, (this.fadeFrom.get(key) ?? 0) * (1 - blend) + target * blend)) : 0;
      if (!enabled || (key !== this.audible && blend === 1 && !this.starts.get(key)?.pending)) {
        media.pause();
        if (enabled && key !== this.desired) media.currentTime = 0;
      }
    }
    this.ensurePlaying();
  }

  unlock() {
    this.resetRetries();
    this.ensurePlaying();
  }
  pause() {
    this.suspended = true;
    this.cancelPending();
    for (const media of this.tracks.values()) media.pause();
  }
  resume() { this.suspended = false; this.unlock(); }
}
