export type EnvironmentTheme = "blue" | "violet" | "amber" | "red";
export interface WaveDefinition {
  start: number;
  end: number;
  name: string;
  theme: EnvironmentTheme;
}
export interface StageDefinition {
  waves: readonly WaveDefinition[];
  bossAt: number;
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
  bossAt: 120,
  waves: [
    { start: 0, end: 30, name: "WARM-UP", theme: "blue" },
    { start: 30, end: 75, name: "PRESSURE", theme: "violet" },
    { start: 75, end: 120, name: "ASSAULT", theme: "amber" },
    { start: 120, end: Infinity, name: "CAPITAL SHIP", theme: "red" },
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
    { id: "meteor-1", at: 18, kind: "meteors" },
    { id: "storm-1", at: 44, kind: "storm" },
    { id: "meteor-2", at: 66, kind: "meteors" },
    { id: "mini-warning", at: 88.5, kind: "mini-warning" },
    { id: "mini-spawn", at: 90, kind: "mini-spawn" },
    { id: "meteor-3", at: 108, kind: "meteors" },
    { id: "boss-warning", at: 118.5, kind: "boss-warning" },
    { id: "boss-spawn", at: 120, kind: "boss-spawn" },
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
  return time >= 120 ? 3 : time >= 75 ? 2 : time >= 30 ? 1 : 0;
}
export const FORMATIONS = [
  "line",
  "vee",
  "semicircle",
  "zigzag",
  "wall",
  "pincer",
  "bombers",
  "turrets",
  "spiral",
  "lanes",
  "crossfire",
  "escort",
] as const;
export type Formation = (typeof FORMATIONS)[number];
export interface SpawnSpec {
  x: number;
  y: number;
  kind: number;
  phase: number;
  motion: Formation;
  leader: boolean;
}
export function formationSpecs(
  name: Formation,
  stage: number,
  center: number,
): SpawnSpec[] {
  const count = name === "wall" || name === "escort" ? 7 : 5 + stage;
  return Array.from({ length: count }, (_, i) => {
    const n = i - (count - 1) / 2,
      left = i % 2 === 0;
    let x = 35 + (i * 320) / Math.max(1, count - 1),
      y = -35 - Math.abs(n) * 18;
    if (name === "vee") y = -35 - Math.abs(n) * 42;
    if (name === "zigzag" || name === "spiral") {
      x = center + Math.sin(i * 1.5) * 95;
      y = -40 - i * 48;
    }
    if (name === "pincer" || name === "crossfire") {
      x = left ? 32 : 358;
      y = -40 - Math.floor(i / 2) * 65;
    }
    if (name === "semicircle") {
      x = 195 + Math.cos((i * Math.PI) / Math.max(1, count - 1)) * 150;
      y = -45 - Math.sin((i * Math.PI) / Math.max(1, count - 1)) * 100;
    }
    if (name === "wall" || name === "escort") {
      x = 70 + (i % 3) * 125;
      y = -35 - Math.floor(i / 3) * 90;
    }
    if (name === "bombers" || name === "lanes") y = -35 - i * 60;
    if (name === "turrets") {
      x = left ? 55 : 335;
      y = -35 - Math.floor(i / 2) * 100;
    }
    return {
      x: Math.max(26, Math.min(364, x)),
      y,
      kind:
        (name === "wall" && i < 3) ||
        (name === "escort" && i === 0) ||
        name === "turrets"
          ? 2
          : i % 2,
      phase: i * 0.9,
      motion: name,
      leader: name === "vee" && i === Math.floor(count / 2),
    };
  });
}
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
