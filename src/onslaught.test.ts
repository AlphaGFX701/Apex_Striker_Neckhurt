import { describe, it, expect } from "vitest";
import { GameModel, findBossHit, type PickupKind } from "./model";
import { defaultRun } from "./equipment";
import {
  StageWaveManager,
  seededRandom,
  FORMATIONS,
  formationSpecs,
} from "./stage-waves";
const tick = (m: GameModel, seconds = 0.01) => {
  for (let i = 0; i < Math.ceil(seconds / 0.01); i++)
    m.update(0.01, { x: 0, y: 0 });
};
function collect(m: GameModel, kind: PickupKind) {
  m.state.pickups.push({
    x: m.state.ship.x,
    y: m.state.ship.y,
    age: 0,
    value: 0,
    kind,
  });
  tick(m);
}
function shot(m: GameModel) {
  m.state.enemyBullets.push({
    x: m.state.ship.x,
    y: m.state.ship.y,
    radius: 4,
    vx: 0,
    vy: 0,
  });
  tick(m);
}
describe("mobile onslaught contract", () => {
  it("EMP clears only nearby bullets, stuns escorts and never refunds or damages bosses", () => {
    const m = new GameModel();
    m.state.energy = 100;
    m.state.enemyBullets = [
      { x: 195, y: 600, radius: 4, vx: 0, vy: 0 },
      { x: 20, y: 20, radius: 4, vx: 0, vy: 0 },
    ];
    m.state.enemies = [
      { x: 195, y: 580, radius: 16, health: 5, shot: 1, phase: 0 },
    ];
    m.state.boss = {
      x: 195,
      y: 140,
      radius: 50,
      health: 900,
      maxHealth: 900,
      shot: 2,
    };
    m.state.beams = [{ x: 195, age: 1.3 }];
    expect(m.action("emp").accepted).toBe(true);
    expect(m.state.enemyBullets).toHaveLength(0);
    expect(m.state.enemies).toHaveLength(0);
    expect(m.state.boss.health).toBe(900);
    expect(m.state.energy).toBe(0);
    expect(m.state.stats.enemiesDestroyed).toBeGreaterThan(0);
    expect(m.state.beams).toHaveLength(0);
  });
  it("upgrades the escort pair; shields precede hull damage and a1.5s grace", () => {
    const m = new GameModel();
    collect(m, "drone");
    expect(m.state.drones.map((d) => d.side)).toEqual([-1, 1]);
    collect(m, "drone");
    expect(m.state.drones.map((d) => d.side)).toEqual([-1, 1]);
    for (let i = 0; i < 5; i++) collect(m, "drone");
    expect(m.state.drones).toHaveLength(2);
    collect(m, "shield");
    shot(m);
    expect(m.state.shield).toBe(false);
    expect(m.state.drones).toHaveLength(2);
    m.state.invincible = 0;
    shot(m);
    expect(m.state.drones).toHaveLength(2);
    expect(m.state.lives).toBe(2);
    expect(m.state.invincible).toBe(1.5);
    expect(m.state.interceptions).toHaveLength(0);
    shot(m);
    expect(m.state.drones).toHaveLength(2);
  });
  it("drones do not block collisions or large lasers; hull damage grants 1.5s", () => {
    const m = new GameModel();
    collect(m, "drone");
    m.state.beams = [{ x: m.state.ship.x, age: 1.3 }];
    tick(m);
    expect(m.state.lives).toBe(2);
    expect(m.state.drones).toHaveLength(2);
    expect(m.state.invincible).toBe(1.5);
    m.state.invincible = 0;
    m.state.rocks.push({
      x: m.state.ship.x,
      y: m.state.ship.y,
      radius: 15,
      speed: 0,
      spin: 0,
      phase: 0,
      target: false,
    });
    tick(m);
    expect(m.state.lives).toBe(1);
    expect(m.state.drones).toHaveLength(2);
  });
  it("overflow is score, not a free EMP recharge; all powers reset", () => {
    const m = new GameModel();
    m.state.powers.weapon = 2;
    collect(m, "weapon");
    collect(m, "repair");
    expect(m.state.energy).toBeLessThan(1);
    expect(m.state.score).toBeGreaterThan(0);
    expect(
      m
        .drainEvents()
        .filter((e) => e.type === "pickup")
        .every(
          (e) =>
            e.type === "pickup" &&
            (e.data.kind === "weapon"
              ? e.data.effect === "weapon"
              : e.data.effect === "score"),
        ),
    ).toBe(true);
    collect(m, "drone");
    tick(m, 25);
    expect(m.state.drones).toHaveLength(2);
    m.reset();
    expect(m.state.drones).toHaveLength(0);
    expect(m.state.time).toBe(0);
  });
  it("starts a capital ship at120, keeps running past180 and uses one total HP pool", () => {
    const m = new GameModel();
    m.practice = true;
    m.state.time = 119.99;
    tick(m, 0.02);
    expect(m.state.boss).not.toBeNull();
    const hp = m.state.boss!.maxHealth;
    expect(hp).toBeGreaterThanOrEqual(650);
    m.state.time = 181;
    tick(m);
    expect(m.state.gameOver).toBe(false);
    expect(m.state.time).toBeGreaterThan(181);
    expect(m.state.boss!.maxHealth).toBe(hp);
  });
  it("has repeatable varied formation geometry and one-shot timeline events", () => {
    expect(FORMATIONS).toHaveLength(12);
    for (const f of FORMATIONS)
      expect(
        formationSpecs(f, 2, 195).every((e) => e.x >= 26 && e.x <= 364),
      ).toBe(true);
    const a = seededRandom(42),
      b = seededRandom(42);
    expect(Array.from({ length: 20 }, a)).toEqual(
      Array.from({ length: 20 }, b),
    );
    const d = new StageWaveManager();
    const all = d.advance(300);
    expect(all.filter((e) => e.kind === "boss-spawn").map((e) => e.at)).toEqual(
      [120],
    );
    expect(d.advance(301)).toEqual([]);
  });
  it("legacy power-up flags never pause play or create a choice dialog", () => {
    const m = new GameModel();
    const c = defaultRun();
    c.powerups = true;
    m.configure(c);
    m.practice = true;
    tick(m, 41);
    expect(m.state.time).toBeGreaterThan(40);
    expect(m.state.powerChoices).toEqual([]);
  });
  it("laser and projectiles share outer turret geometry instead of damaging the core", () => {
    const m = new GameModel(),
      c = defaultRun();
    c.stage = 2;
    c.equipment.main = "laser";
    m.configure(c);
    m.practice = true;
    m.state.time = 119.99;
    tick(m, 0.02);
    const b = m.state.boss!,
      t = b.turrets![2];
    expect(findBossHit(b, b.x + t.x + 20, b.y + t.y, 4)).toBe(t);
    expect(findBossHit(b, b.x + t.x, 610, 6, true)).toBe(t);
    m.state.ship.x = b.x + t.x;
    const before = t.health;
    tick(m, 0.12);
    expect(t.health).toBeLessThan(before);
    expect(b.health).toBe(b.maxHealth);
  });
  it("stationary phase-three targets lock once, allow an EMP cancel and leave a warp exit", () => {
    const m = new GameModel();
    m.practice = true;
    m.state.time = 119.99;
    tick(m, 0.02);
    // Enter phase three through the authored hardpoint gates rather than
    // assigning core HP, which no longer owns stage-one phase transitions.
    for (let phase = 1; phase <= 2; phase++) {
      const b = m.state.boss!;
      for (const t of [...b.turrets!]) {
        m.state.bullets = [
          { x: b.x + t.x, y: b.y + t.y, radius: 2, speed: 0, damage: 1000 },
        ];
        tick(m, 0.01);
      }
      m.state.bullets = [{ x: b.x, y: b.y, radius: 2, speed: 0, damage: 1000 }];
      tick(m, 0.01);
      tick(m, 1.55);
    }
    expect(m.state.boss!.phase).toBe(3);
    tick(m, 2.5);
    expect(m.state.beams).toHaveLength(1);
    const x = m.state.beams[0].x;
    m.state.energy = 100;
    m.action("emp");
    expect(m.state.beams).toHaveLength(0);
    tick(m, 0.3);
    expect(m.action("dodgeLeft").accepted).toBe(true);
    expect(Math.abs(m.state.ship.x - x)).toBeGreaterThan(28);
  });
  it("destroyed original turret slots reduce volleys and core fallback is weaker", () => {
    const counts = (dead: number) => {
      const m = new GameModel();
      m.practice = true;
      m.state.time = 119.99;
      tick(m, 0.02);
      const b = m.state.boss!;
      b.age = 0;
      b.shot = 0.01;
      b.turrets!.forEach((t, i) => {
        if (i < dead) t.health = 0;
      });
      let emitted = 0;
      for (let i = 0; i < 600; i++) {
        m.state.enemyBullets = [];
        m.state.enemies = [];
        tick(m);
        emitted += m.state.enemyBullets.length;
      }
      return emitted;
    };
    expect(counts(1)).toBeLessThan(counts(0));
    expect(counts(2)).toBeLessThan(counts(0));
  });
});
