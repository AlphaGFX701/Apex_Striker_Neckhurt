import { describe, it, expect } from "vitest";
import { ProgressStore } from "./progress";
import { weaponVolley, damageMultiplier } from "./equipment";
import { defaultRun } from "./equipment";
import { GameModel } from "./model";
describe("tactical loadout", () => {
  it("increases visible projectiles without multiplying total damage", () => {
    for (const type of ["pulse", "plasma"] as const)
      for (let level = 1; level <= 3; level++) {
        const shots = weaponVolley(type, level);
        expect(shots.length).toBe(type === "pulse" ? level : level * 2 + 1);
        expect(shots.reduce((s, b) => s + b.damage, 0)).toBeCloseTo(
          (type === "pulse" ? 1 : 1.5) * (1 + (level - 1) * 0.2),
        );
      }
  });
  it("never stacks damage bonuses", () => {
    expect(damageMultiplier("plasma", true, false, "plasma")).toBe(1.25);
    expect(damageMultiplier("pulse", true)).toBe(1);
  });
  it("settles a round exactly once and never awards practice", () => {
    const p = new ProgressStore(undefined);
    const r = {
      practice: false,
      mode: "stage",
      stage: 0,
      won: true,
      credits: 30,
      score: 500,
      time: 80,
    };
    expect(p.settle("a", r).total).toBe(180);
    expect(p.settle("a", r).total).toBe(0);
    expect(p.settle("b", { ...r, practice: true }).total).toBe(0);
    expect(p.state.credits).toBe(180);
    expect(p.state.cleared).toEqual([0]);
  });
  it("rejects insufficient credits and caps equipment at three", () => {
    const p = new ProgressStore(undefined);
    expect(p.upgrade("laser")).toBe(false);
    p.state.credits = 1000;
    expect(p.upgrade("laser")).toBe(true);
    p.upgrade("laser");
    p.upgrade("laser");
    expect(p.upgrade("laser")).toBe(false);
    expect(p.state.credits).toBe(730);
  });
});
describe("tactical simulation", () => {
  it("ignores legacy choice settings and keeps the arcade running", () => {
    const m = new GameModel(() => 0.2),
      c = defaultRun();
    c.powerups = true;
    m.configure(c);
    m.practice = true;
    for (let i = 0; i < 410 && !m.state.powerChoices.length; i++)
      m.update(0.05, { x: 0, y: 0 });
    expect(m.state.powerChoices).toHaveLength(0);
    const t = m.state.time;
    m.update(0.05, { x: 1, y: 1 });
    expect(m.state.time).toBeGreaterThan(t);
    expect(m.action("emp").accepted).toBe(false);
    expect(m.choosePower("invalid")).toBe(false);
    expect(m.choosePower("repair")).toBe(false);
    m.reset();
    expect(m.state.perks).toEqual({});
    expect(m.state.powerChoices).toEqual([]);
  });
  it("shield pickup absorbs one collision without regenerating", () => {
    const m = new GameModel(),
      c = defaultRun();
    c.equipment.armor = "shield";
    c.levels.shield = 3;
    m.configure(c);
    m.reset();
    m.state.shield = true;
    m.state.rocks.push({
      x: 195,
      y: 610,
      radius: 25,
      speed: 0,
      spin: 0,
      phase: 0,
      target: false,
    });
    m.update(0.01, { x: 0, y: 0 });
    expect(m.state.lives).toBe(3);
    expect(m.state.shield).toBe(false);
    m.practice = true;
    for (let i = 0; i < 210; i++) m.update(0.05, { x: -1, y: 1 });
    expect(m.state.shield).toBe(false);
  });
  it("does not damage a boss behind an upward laser", () => {
    const m = new GameModel(),
      c = defaultRun();
    c.equipment.main = "laser";
    c.levels.laser = 1;
    m.configure(c);
    m.state.ship.y = 100;
    m.state.boss = {
      x: 195,
      y: 180,
      radius: 48,
      health: 70,
      maxHealth: 70,
      shot: 10,
    };
    m.update(0.05, { x: 0, y: 0 });
    m.update(0.05, { x: 0, y: 0 });
    expect(m.state.boss.health).toBe(70);
  });
  it("missiles retarget a surviving enemy after the original target dies", () => {
    const m = new GameModel(),
      c = defaultRun();
    c.equipment.secondary = "missile";
    c.levels.missile = 1;
    m.configure(c);
    m.practice = true;
    m.state.powers.missile = 12;
    for (let i = 0; i < 41; i++) m.update(0.05, { x: 0, y: 0 });
    const missile = m.state.bullets.find((b) => b.missile)!;
    expect(missile).toBeTruthy();
    m.state.enemies = [
      { x: 340, y: 300, radius: 16, health: 10, shot: 10, phase: 0, kind: 0 },
    ];
    const before = missile.vx || 0;
    m.update(0.05, { x: 0, y: 0 });
    expect(missile.vx).toBeGreaterThan(before);
    m.state.enemies[0].health = 0;
    m.state.enemies.push({
      x: 20,
      y: 300,
      radius: 16,
      health: 10,
      shot: 10,
      phase: 0,
    });
    m.update(0.05, { x: 0, y: 0 });
    expect(missile.vx).toBeLessThan(before + 20);
  });
  it("runs every stage to a terminal result with legacy flags safely ignored", () => {
    for (let stage = 0; stage < 3; stage++) {
      const m = new GameModel(() => 0.4),
        c = defaultRun();
      c.stage = stage;
      c.powerups = true;
      c.equipment.main = "plasma";
      c.equipment.secondary = "missile";
      c.levels.plasma = 3;
      c.levels.missile = 3;
      m.configure(c);
      m.practice = true;
      for (let i = 0; i < 14000 && !m.state.gameOver; i++) {
        if (m.state.powerChoices.length) m.choosePower(m.state.powerChoices[0]);
        const target = m.state.boss ? { x: m.state.boss.x, y: 600 } : null;
        if (m.state.energy >= 100) m.action("emp");
        m.update(0.05, { x: 0, y: 0 }, target);
      }
      expect(m.state.gameOver).toBe(true);
      expect(m.state.result).toBe("practice");
      expect(m.state.time).toBeGreaterThan(180);
    }
  });
  it("simulates twenty minutes of Endless with bounded objects and valid choices", () => {
    const m = new GameModel(() => 0.37),
      c = defaultRun();
    c.mode = "endless";
    c.powerups = true;
    c.equipment = {
      main: "plasma",
      secondary: "missile",
      armor: "shield",
      wingman: "drone",
    };
    c.levels = {
      pulse: 3,
      plasma: 3,
      laser: 3,
      missile: 3,
      shield: 3,
      drone: 3,
    };
    m.configure(c);
    m.practice = true;
    let max = 0;
    for (let i = 0; i < 24500; i++) {
      if (m.state.powerChoices.length) {
        expect(new Set(m.state.powerChoices).size).toBe(3);
        m.choosePower(m.state.powerChoices[0]);
      }
      if (m.state.energy >= 100) m.action("emp");
      m.update(
        0.05,
        { x: Math.sin(i * 0.03), y: 0 },
        m.state.boss ? { x: m.state.boss.x, y: 600 } : null,
      );
      const s = m.state;
      max = Math.max(
        max,
        s.bullets.length +
          s.enemyBullets.length +
          s.enemies.length +
          s.pickups.length +
          s.explosions.length,
      );
      expect(s.bullets.length).toBeLessThanOrEqual(360);
      expect(s.enemyBullets.length).toBeLessThanOrEqual(360);
      expect(s.enemies.length).toBeLessThanOrEqual(32);
    }
    expect(m.state.time).toBeGreaterThan(1200);
    expect(m.state.gameOver).toBe(false);
    expect(m.state.wave).toBeGreaterThan(3);
    expect(max).toBeLessThan(850);
  });
});
describe("save recovery", () => {
  it("keepsOnslaught scores separate and leavesolderarcade records untouched",()=>{
    const old=JSON.stringify({version:6,records:[{mode:"stage",stage:0,score:900,time:80,date:"2026-10-18"}]});
    const data=new Map([["gyro-arcade-progress-v1",old]]),storage={getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>{data.set(k,v)}};
    const p=new ProgressStore(storage,true,"gyro-onslaught-progress-v1");expect(p.state.records).toHaveLength(0);
    p.settle("new-rules",{practice:false,mode:"stage",stage:0,won:true,credits:999,score:100,time:210});
    expect(p.state.records).toHaveLength(1);expect(p.state.credits).toBe(0);expect(p.state.cleared).toContain(0);expect(data.get("gyro-arcade-progress-v1")).toBe(old);
  });
  it("does not award a completed round again after reloading the browser save", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    const result = {
      practice: false,
      mode: "stage",
      stage: 0,
      won: true,
      credits: 10,
      score: 500,
      time: 75,
    };
    const first = new ProgressStore(storage);
    first.settle("persistent-round", result);
    const reload = new ProgressStore(storage);
    expect(reload.settle("persistent-round", result).total).toBe(0);
    expect(reload.state.credits).toBe(160);
  });
  it("migrates old spread choice and survives blocked writes", () => {
    const storage = {
      getItem: (key: string) =>
        key === "gyro-loadout-v5"
          ? JSON.stringify({ build: { weapon: "spread" } })
          : null,
      setItem: () => {
        throw Error("blocked");
      },
    };
    const p = new ProgressStore(storage);
    expect(p.state.equipment.main).toBe("plasma");
    expect(p.save()).toBe(false);
    p.state.credits = 100;
    expect(p.upgrade("laser")).toBe(true);
    expect(p.state.levels.laser).toBe(1);
  });
  it("recovers from invalid fields and preserves unlocked defaults", () => {
    const p = new ProgressStore({
      getItem: () =>
        JSON.stringify({
          version: 6,
          credits: -100,
          levels: { pulse: 0, laser: 99 },
          equipment: { main: "unknown" },
          cleared: [-1, 0, 99],
        }),
      setItem: () => {},
    });
    expect(p.state.credits).toBe(0);
    expect(p.state.levels.pulse).toBe(1);
    expect(p.state.levels.laser).toBe(0);
    expect(p.state.equipment.main).toBe("pulse");
    expect(p.state.cleared).toEqual([0]);
  });
});
it("advances the post-boss Endless wave and rotates its stage", () => {
  const m = new GameModel(),
    c = defaultRun();
  c.mode = "endless";
  m.configure(c);
  m.state.wave = 3;
  m.state.time = 90;
  m.state.boss = {
    x: 195,
    y: 140,
    radius: 48,
    health: 10,
    maxHealth: 70,
    shot: 1,
  };
  m.state.boss.health = 0;
  m.update(0.01, { x: 0, y: 0 });
  expect(m.state.boss).toBeNull();
  expect(m.state.wave).toBe(4);
  expect(m.config.stage).toBe(1);
  expect(m.state.gameOver).toBe(false);
});
it("does not apply a hostile beam above its visible start", () => {
  const m = new GameModel();
  m.state.ship = { x: 40, y: 100, radius: 6 };
  m.state.beams = [{ x: 40, age: 1.25 }];
  m.update(0.01, { x: 0, y: 0 });
  expect(m.state.lives).toBe(3);
});
