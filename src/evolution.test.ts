import { describe, it, expect } from "vitest";
import { GameModel } from "./model";
function pickup(
  m: GameModel,
  kind: "weapon" | "drone" | "shield" | "energy" = "weapon",
) {
  m.state.pickups.push({ ...m.state.ship, kind, age: 0, value: 0 });
  m.update(0.01, { x: 0, y: 0 });
}
describe("Evolution Arcade round rules", () => {
  it("evolves at two and five orbs, refreshes red fire and resets between runs", () => {
    const m = new GameModel();
    pickup(m);
    expect(m.state.evolution).toMatchObject({ orbs: 1, level: 1 });
    pickup(m);
    expect(m.state.evolution).toMatchObject({ orbs: 2, level: 2 });
    expect(m.state.invincible).toBeGreaterThan(0.59);
    pickup(m);
    pickup(m);
    expect(m.state.evolution.level).toBe(2);
    pickup(m);
    expect(m.state.evolution.level).toBe(3);
    m.update(0.05, { x: 0, y: 0 });
    pickup(m);
    expect(m.state.powers.overdrive).toBe(25);
    m.state.invincible=0;m.state.shield=false;
    m.state.enemyBullets=[{...m.state.ship,vx:0,vy:0}];
    m.update(.01,{x:0,y:0});
    expect(m.state.lives).toBe(2);expect(m.state.evolution.level).toBe(3);
    m.reset();
    expect(m.state.evolution).toMatchObject({ orbs: 0, level: 1 });
  });
  it("keeps exactly two escorts and upgrades the pair instead of sacrificing them", () => {
    const m = new GameModel();
    pickup(m, "drone");
    expect(m.state.drones.map((d) => d.side)).toEqual([-1, 1]);
    expect(m.state.wingmen.level).toBe(1);
    pickup(m, "drone");
    pickup(m, "drone");
    pickup(m, "drone");
    expect(m.state.drones).toHaveLength(2);
    expect(m.state.wingmen.level).toBe(3);
    m.state.enemyBullets.push({ ...m.state.ship, vx: 0, vy: 0 });
    m.update(0.01, { x: 0, y: 0 });
    expect(m.state.lives).toBe(2);
    expect(m.state.drones).toHaveLength(2);
  });
  it("EMP clears the whole arena once, preserving commanders and their hardpoints", () => {
    const m = new GameModel();
    m.state.time = 119.99;
    m.update(0.02, { x: 0, y: 0 });
    const hp = m.state.boss!.health,
      turret = m.state.boss!.turrets![0].health;
    m.state.enemies = [
      { x: 30, y: 30, radius: 16, health: 2, shot: 3, phase: 0 },
      { x: 350, y: 400, radius: 16, health: 3, shot: 3, phase: 0 },
    ];
    m.state.rocks = [
      { x: 30, y: 30, radius: 20, speed: 0, spin: 0, phase: 0, target: true },
    ];
    m.state.enemyBullets = [{ x: 20, y: 10, radius: 4, vx: 0, vy: 0 }];
    m.state.beams = [{ x: 195, age: 1.3 }];
    m.state.energy = 100;
    expect(m.action("emp").accepted).toBe(true);
    expect(m.state.enemies).toHaveLength(0);
    expect(m.state.rocks).toHaveLength(0);
    expect(m.state.enemyBullets).toHaveLength(0);
    expect(m.state.beams).toHaveLength(0);
    expect(m.state.stats.enemiesDestroyed).toBe(2);
    expect(m.state.boss!.health).toBe(hp);
    expect(m.state.boss!.turrets![0].health).toBe(turret);
    expect(m.action("emp").accepted).toBe(false);
    expect(m.state.stats.enemiesDestroyed).toBe(2);
  });
  it("shoots in the warm-up and keeps boss reinforcements to two", () => {
    const m = new GameModel(() => 0.4);
    m.practice = true;
    let warmShots = 0;
    for (let i = 0; i < 1100; i++) {
      m.state.bullets = [];
      m.update(0.01, { x: 0, y: 0 });
      warmShots = Math.max(warmShots, m.state.enemyBullets.length);
    }
    expect(warmShots).toBeGreaterThan(0);
    m.state.time = 119.99;
    m.update(0.02, { x: 0, y: 0 });
    let fired = 0;
    for (let i = 0; i < 150; i++) {
      m.state.bullets = [];
      m.update(0.01, { x: 0, y: 0 });
      fired = Math.max(fired, m.state.enemyBullets.length);
    }
    expect(fired).toBeGreaterThan(0);
    m.state.enemyBullets = [];
    m.state.boss!.turrets!.forEach((t) => (t.health = 0));
    m.state.boss!.shot = 0.01;
    m.update(0.02, { x: 0, y: 0 });
    expect(m.state.enemyBullets.length).toBeGreaterThan(0);
    for (let i = 0; i < 4000; i++) {
      m.state.bullets = [];
      m.update(0.01, { x: 0, y: 0 });
      expect(m.state.enemies.length).toBeLessThanOrEqual(2);
      if (m.state.enemies.length === 2)
        expect(m.state.enemies[0].originX! < 195).not.toBe(
          m.state.enemies[1].originX! < 195,
        );
    }
  });
  it("multiplies consecutive kills, keeps the chain behind a shield and resets on hull loss", () => {
    const m = new GameModel();
    m.state.enemies = Array.from({ length: 6 }, (_, i) => ({
      x: 35 + i * 45,
      y: 120,
      radius: 16,
      health: 2,
      shot: 4,
      phase: 0,
    }));
    m.state.energy = 100;
    m.action("emp");
    expect(m.state.score).toBe(320);
    expect(m.state.stats.bestMultiplier).toBe(2);
    pickup(m, "shield");
    m.state.enemyBullets = [{ ...m.state.ship, vx: 0, vy: 0 }];
    m.update(0.01, { x: 0, y: 0 });
    expect(m.state.combo).toBe(6);
    expect(m.state.lives).toBe(3);
    m.state.invincible = 0;
    m.state.enemyBullets = [{ ...m.state.ship, vx: 0, vy: 0 }];
    m.update(0.01, { x: 0, y: 0 });
    expect(m.state.combo).toBe(0);
    expect(m.state.lives).toBe(2);
    expect(m.state.stats.bestMultiplier).toBe(2);
  });
  it("supplies early evolution orbs and charges EMP slowly without kill refunds", () => {
    const m = new GameModel(() => 0.4);
    m.practice = true;
    for (let i = 0; i < 660; i++) {
      m.state.bullets = [];
      m.state.enemies = [];
      m.state.rocks = [];
      m.update(0.05, { x: 0, y: 0 });
    }
    expect(m.state.evolution.orbs).toBeGreaterThanOrEqual(2);
    expect(m.state.energy).toBeCloseTo(44, 1);
    pickup(m, "energy");
    expect(m.state.energy).toBeCloseTo(49, 1);
  });
  it("retires all formation types sideways instead of turning them into ramming enemies", () => {
    const m = new GameModel();
    m.practice = true;
    const bomber = {
      x: 110,
      y: 200,
      originX: 110,
      age: 5.49,
      radius: 16,
      health: 999,
      shot: 100,
      phase: 0,
      motion: "bombers" as const,
    };
    const zigzag = {
      ...bomber,
      x: 280,
      originX: 280,
      motion: "zigzag" as const,
    };
    m.state.enemies = [bomber, zigzag];
    m.update(0.05, { x: 0, y: 0 });
    expect(bomber.y).toBeLessThan(200);
    for (let i = 0; i < 50; i++) {
      m.state.bullets = [];
      m.update(0.05, { x: 0, y: 0 });
    }
    expect(m.state.enemies).not.toContain(bomber);
    expect(m.state.enemies).not.toContain(zigzag);
  });
  it("lets EMP interrupt a heavy attack without immediately relocking the player", () => {
    const m = new GameModel();
    m.practice = true;
    m.state.time = 119.99;
    m.update(0.02, { x: 0, y: 0 });
    m.state.boss!.health = 100;
    m.state.boss!.phase = 3;
    for (let i = 0; i < 320; i++) {
      m.state.beams = [{ x: 30, age: 0 }];
      m.state.bullets = [];
      m.update(0.01, { x: 0, y: 0 });
    }
    m.state.energy = 100;
    m.action("emp");
    for (let i = 0; i < 100; i++) {
      m.update(0.01, { x: 0, y: 0 });
      expect(m.state.beams).toHaveLength(0);
    }
  });
});
