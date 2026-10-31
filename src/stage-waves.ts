export type EnvironmentTheme = "blue" | "violet" | "amber" | "red";
export interface WaveDefinition {
  start: number;
  end: number;
  name: string;
  theme: EnvironmentTheme;
}
export interface StageDefinition {
  waves: readonly WaveDefinition[];
  duration: number;
}
export type StageEventKind =
  | "wave"
  | "mini-warning"
  | "mini-spawn"
  | "boss-warning"
  | "boss-spawn"
  | "storm"
  | "meteors";
export interface StageEvent {
  id: string;
  at: number;
  kind: StageEventKind;
  wave?: number;
}
export const STAGE_DEFINITION: StageDefinition = {
  duration: 90,
  waves: [
    { start: 0, end: 15, name: "WARM-UP", theme: "blue" },
    { start: 15, end: 35, name: "ELITE AMBUSH", theme: "violet" },
    { start: 35, end: 60, name: "MINI-BOSS RUSH", theme: "amber" },
    { start: 60, end: 90, name: "FINAL BOSS", theme: "red" },
  ],
};
const timeline: StageEvent[] = (
  [
    ...STAGE_DEFINITION.waves.map((w, wave) => ({
      id: `wave-${wave}`,
      at: w.start,
      kind: "wave" as const,
      wave,
    })),
    { id: "meteor-1", at: 8, kind: "meteors" },
    { id: "storm-1", at: 20, kind: "storm" },
    { id: "mini-warning", at: 35, kind: "mini-warning" },
    { id: "mini-spawn", at: 36.5, kind: "mini-spawn" },
    { id: "meteor-2", at: 47, kind: "meteors" },
    { id: "boss-warning", at: 58.5, kind: "boss-warning" },
    { id: "boss-spawn", at: 60, kind: "boss-spawn" },
  ] as StageEvent[]
).sort((a, b) => a.at - b.at);
export class StageWaveManager {
  private cursor = 0;
  reset() {
    this.cursor = 0;
  }
  advance(time: number): StageEvent[] {
    const events: StageEvent[] = [];
    while (this.cursor < timeline.length && timeline[this.cursor].at <= time)
      events.push(timeline[this.cursor++]);
    return events;
  }
}
export function waveAt(time: number) {
  return time >= 60 ? 3 : time >= 35 ? 2 : time >= 15 ? 1 : 0;
}
