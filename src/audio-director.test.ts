import { afterEach, expect, it, vi } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { AudioDirector, MUSIC_TRACKS } from "./audio-director";
import { Feedback } from "./feedback";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function setup() {
  vi.useFakeTimers();
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  const spoken: any[] = [];
  const speech = {
    speak: vi.fn((u) => spoken.push(u)),
    cancel: vi.fn(),
    getVoices: () => [],
  };
  vi.stubGlobal("window", {
    setTimeout,
    clearTimeout,
    speechSynthesis: speech,
  });
  vi.stubGlobal("speechSynthesis", speech);
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    },
  );
  const tracks: any[] = [];
  vi.stubGlobal(
    "Audio",
    class {
      volume = 0;
      paused = true;
      currentTime = 0;
      loop = false;
      preload = "";
      plays = 0;
      loads = 0;
      constructor(public src: string) {
        tracks.push(this);
      }
      play() {
        this.paused = false;
        this.plays++;
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
      load() {
        this.loads++;
      }
    },
  );
  const audio = new AudioDirector();
  const advance = (ms: number) => {
    for (let i = 0; i < ms; i += 20) {
      const d = Math.min(20, ms - i);
      now += d;
      vi.advanceTimersByTime(d);
      audio.update(now);
    }
  };
  return { audio, tracks, spoken, speech, advance };
}
it("crossfades the requested stage/boss music in 400ms and never restarts at phase updates", () => {
  const { audio, tracks, advance } = setup();
  audio.music("in-the-wreckage");
  advance(400);
  expect(tracks[0].src).toBe(MUSIC_TRACKS["in-the-wreckage"]);
  expect(tracks[0].volume).toBeCloseTo(audio.musicVolume);
  expect(tracks[1].src).toBe(MUSIC_TRACKS.battle);
  expect(tracks[1].preload).toBe("auto");
  expect(tracks[1].loads).toBe(1);
  expect(tracks[1].paused).toBe(true);
  expect(tracks[1].plays).toBe(0);
  for (let i = 0; i < 100; i++) audio.music("in-the-wreckage");
  expect(tracks[1].loads).toBe(1);
  tracks[0].currentTime = 17;
  audio.music("battle");
  advance(200);
  expect(tracks[0].volume).toBeCloseTo(audio.musicVolume / 2);
  expect(tracks[1].volume).toBeCloseTo(audio.musicVolume / 2);
  advance(200);
  expect(tracks[0].paused).toBe(true);
  expect(tracks[1].src).toContain("orbital-bombardment.mp3");
  expect(tracks[1].loop).toBe(true);
  tracks[1].currentTime = 37;
  for (let i = 0; i < 100; i++) audio.music("battle");
  expect(tracks[1].plays).toBe(1);
  expect(tracks[1].currentTime).toBe(37);
});
it("never speaks pickups or EMP and keeps music mute independent of effects", () => {
  const { audio, spoken, tracks, advance } = setup();
  const play = vi.spyOn(audio, "play");
  audio.pickup("weapon");
  audio.pickup("shield");
  audio.ready();
  audio.play("emp");
  advance(1000);
  expect(spoken).toHaveLength(0);
  expect(play.mock.calls.map((c) => c[0])).toEqual(["pickup", "pickup", "emp"]);
  audio.music("battle");
  advance(400);
  tracks[0].currentTime = 25;
  audio.pauseAudio();
  expect(tracks[0].paused).toBe(true);
  audio.resumeAudio();
  expect(tracks[0].currentTime).toBe(25);
  audio.musicEnabled = false;
  advance(400);
  expect(tracks[0].volume).toBe(0);
  audio.enabled = false;
  audio.musicEnabled = true;
  advance(400);
  expect(tracks[0].volume).toBeGreaterThan(0);
});
it("ships both requested music recordings", () => {
  for (const filename of ["terminal-dash.mp3", "orbital-bombardment.mp3"])
    expect(
      statSync(new URL(`../public/assets/audio/${filename}`, import.meta.url))
        .size,
    ).toBeGreaterThan(1000000);
});
it("bounds explosion polyphony, reuses noise and enforces the 100ms explosion interval", () => {
  const oscillators: any[] = [];
  let noiseBuffers = 0;
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({
    connect() {},
    disconnect() {},
    start() {},
    stop() {},
    onended: null as (() => void) | null,
  });
  const context = {
    currentTime: 0,
    state: "running",
    sampleRate: 48000,
    destination: {},
    resume: () => Promise.resolve(),
    createGain: () => ({ ...node(), gain: param() }),
    createOscillator: () => {
      const osc = { ...node(), frequency: param(), type: "" };
      oscillators.push(osc);
      return osc;
    },
    createBuffer: (_channels: number, length: number) => {
      noiseBuffers++;
      return { getChannelData: () => new Float32Array(length) };
    },
    createBufferSource: () => ({ ...node(), buffer: null }),
    createBiquadFilter: () => ({ ...node(), frequency: param(), type: "" }),
  };
  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return context;
      }
    },
  );
  vi.stubGlobal("fetch", () => Promise.reject(new Error("Offline test")));
  const sound = new Feedback();
  sound.unlock();
  sound.play("explosion");
  context.currentTime = 0.05;
  sound.play("explosion");
  expect(oscillators).toHaveLength(1);
  for (let i = 1; i < 35; i++) {
    context.currentTime = i * 0.101;
    sound.play("explosion");
  }
  expect(oscillators).toHaveLength(24);
  expect(noiseBuffers).toBe(1);
  oscillators[0].onended();
  context.currentTime += 0.11;
  sound.play("explosion");
  expect(oscillators).toHaveLength(25);
  expect(noiseBuffers).toBe(1);
});
