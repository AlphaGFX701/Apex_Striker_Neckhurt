import {
  defaultEquipment,
  defaultLevels,
  EQUIPMENT,
  type EquipmentId,
  type EquipmentLoadout,
} from "./equipment";
export interface PlayerProgress {
  version: 6;
  credits: number;
  levels: Record<EquipmentId, number>;
  equipment: EquipmentLoadout;
  cleared: number[];
  settled: string[];
  records: {
    mode: string;
    stage: number;
    score: number;
    time: number;
    date: string;
  }[];
}
const fresh = (): PlayerProgress => ({
  version: 6,
  credits: 0,
  levels: defaultLevels(),
  equipment: defaultEquipment(),
  cleared: [],
  settled: [],
  records: [],
});
export class ProgressStore {
  state: PlayerProgress = fresh();
  persistent = true;
  constructor(
    private storage: Pick<Storage, "getItem" | "setItem"> | undefined = (() => {
      try {
        return localStorage;
      } catch {
        return undefined;
      }
    })(),
  ) {
    try {
      const raw = JSON.parse(storage?.getItem("gyro-progress-v6") || "null");
      if (raw?.version === 6) {
        this.state.credits =
          Number.isSafeInteger(raw.credits) && raw.credits >= 0
            ? raw.credits
            : 0;
        for (const item of EQUIPMENT) {
          const n = raw.levels?.[item.id];
          if (Number.isInteger(n) && n >= 0 && n <= 3)
            this.state.levels[item.id] = n;
        }
        this.state.levels.pulse = Math.max(1, this.state.levels.pulse);
        this.state.levels.plasma = Math.max(1, this.state.levels.plasma);
        for (const slot of ["main", "secondary", "armor", "wingman"] as const) {
          const id = raw.equipment?.[slot];
          if (
            EQUIPMENT.some((e) => e.id === id && e.slot === slot) &&
            this.state.levels[id as EquipmentId] > 0
          )
            this.state.equipment[slot] = id;
        }
        this.state.cleared = Array.isArray(raw.cleared)
          ? raw.cleared.filter(
              (x: unknown) =>
                Number.isInteger(x) && Number(x) >= 0 && Number(x) < 3,
            )
          : [];
        this.state.settled = Array.isArray(raw.settled)
          ? raw.settled
              .filter((x: unknown) => typeof x === "string")
              .slice(-100)
          : [];
        this.state.records = Array.isArray(raw.records)
          ? raw.records
              .filter(
                (r: any) =>
                  r &&
                  typeof r === "object" &&
                  Number.isFinite(r.score) &&
                  Number.isFinite(r.time) &&
                  typeof r.date === "string",
              )
              .slice(0, 20)
          : [];
      } else {
        const v5 = JSON.parse(storage?.getItem("gyro-loadout-v5") || "null");
        const v4 = JSON.parse(storage?.getItem("gyro-loadout-v4") || "null");
        if ((v5?.build?.weapon || v4?.weapon) === "spread")
          this.state.equipment.main = "plasma";
      }
    } catch {
      /* Invalid data uses a playable default without deleting old saves. */
    }
  }
  save() {
    try {
      if (!this.storage) throw Error();
      this.storage.setItem("gyro-progress-v6", JSON.stringify(this.state));
      this.persistent = true;
    } catch {
      this.persistent = false;
    }
    return this.persistent;
  }
  cost(id: EquipmentId) {
    return [90, 60, 120, 0][this.state.levels[id]];
  }
  upgrade(id: EquipmentId) {
    const level = this.state.levels[id],
      cost = this.cost(id);
    if (level >= 3 || this.state.credits < cost) return false;
    this.state.credits -= cost;
    this.state.levels[id]++;
    this.save();
    return true;
  }
  equip(id: EquipmentId) {
    const item = EQUIPMENT.find((e) => e.id === id);
    if (!item || !this.state.levels[id]) return false;
    this.state.equipment[item.slot] = id;
    this.save();
    return true;
  }
  settle(
    id: string,
    result: {
      practice: boolean;
      mode: string;
      stage: number;
      won: boolean;
      credits: number;
      score: number;
      time: number;
    },
  ) {
    if (result.practice || this.state.settled.includes(id))
      return { collected: 0, clear: 0, first: 0, total: 0 };
    const collected = Math.max(0, Math.floor(result.credits)),
      clear = result.won && result.mode === "stage" ? 50 : 0,
      first = clear && !this.state.cleared.includes(result.stage) ? 100 : 0;
    this.state.credits += collected + clear + first;
    if (clear && !this.state.cleared.includes(result.stage))
      this.state.cleared.push(result.stage);
    this.state.settled.push(id);
    this.state.settled = this.state.settled.slice(-100);
    this.state.records.push({
      mode: result.mode,
      stage: result.stage,
      score: result.score,
      time: result.time,
      date: new Date().toISOString(),
    });
    this.state.records.sort((a, b) => b.score - a.score);
    this.state.records = this.state.records.slice(0, 20);
    this.save();
    return { collected, clear, first, total: collected + clear + first };
  }
}
