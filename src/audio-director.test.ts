import { afterEach, expect, it, vi } from "vitest";
import { AudioDirector } from "./audio-director";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("deduplicates speech, ducks music, prioritizes ready and clears on pause", () => {
  vi.useFakeTimers();
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
      constructor(public src: string) {
        tracks.push(this);
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
    },
  );
  const audio = new AudioDirector();
  audio.music("battle");
  for (let i = 0; i < 30; i++) audio.update();
  const normal = tracks[0].volume;
  audio.pickup("shield");
  audio.pickup("shield");
  audio.ready();
  vi.advanceTimersByTime(350);
  expect(spoken.map((s) => s.text)).toEqual(["EMP ready"]);
  for (let i = 0; i < 30; i++) audio.update();
  expect(tracks[0].volume).toBeLessThan(normal);
  spoken[0].onend();
  expect(spoken[1].text).toBe("Shield online");
  audio.pauseAudio();
  expect(speech.cancel).toHaveBeenCalled();
  expect(tracks[0].paused).toBe(true);
  vi.advanceTimersByTime(5000);
  expect(spoken).toHaveLength(2);
});
it("keeps voice independent from the SFX switch and honors voice mute", () => {
  vi.useFakeTimers();
  const speak = vi.fn();
  const speech = { speak, cancel: vi.fn(), getVoices: () => [] };
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
  const audio = new AudioDirector();
  audio.enabled = false;
  audio.ready();
  vi.advanceTimersByTime(350);
  expect(speak).toHaveBeenCalledTimes(1);
  audio.clearAnnouncements();
  audio.voiceEnabled = false;
  audio.ready();
  vi.advanceTimersByTime(500);
  expect(speak).toHaveBeenCalledTimes(1);
});
