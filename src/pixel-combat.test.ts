import { describe, expect, it } from "vitest";
import { GameModel, bossAimPoints } from "./model";
import { defaultRun } from "./equipment";
import { StageWaveManager } from "./stage-waves";

function commander(stage = 0, mode: "stage" | "endless" = "stage") {
  const m = new GameModel();
  const c = defaultRun();
  c.stage = stage;
  c.mode = mode;
  c.seed = 73;
  m.configure(c);
  m.reset();
  m.practice = true;
  m.state.time = 119.99;
  m.update(0.02, { x: 0, y: 0 });
  return m;
}
function shootAt(m: GameModel, x: number, y: number, damage = 1000) {
  m.state.bullets = [{ x, y, radius: 2, speed: 0, damage, type: "pulse" }];
  m.update(0.001, { x: 0, y: 0 });
}
function breakPair(m: GameModel) {
  for (const t of [...m.state.boss!.turrets!])
    shootAt(m, m.state.boss!.x + t.x, m.state.boss!.y + t.y);
}
describe("stage-one pixel combat", () => {
  it("protects the core until both visible turrets are destroyed", () => {
    const m = commander();
    const b = m.state.boss!;
    expect(b.state).toBe("armored");
    expect(b.turrets).toHaveLength(2);
    expect(b.turrets!.map((t) => t.health)).toEqual([15, 15]);
    shootAt(m, b.x, b.y);
    expect(b.health).toBe(650);
    const left = b.turrets![0];
    shootAt(m, b.x + left.x, b.y + left.y);
    expect(b.state).toBe("armored");
    expect(b.turrets![1].health).toBe(15);
    shootAt(m, b.x, b.y);
    expect(b.health).toBe(650);
    const right = b.turrets![1];
    shootAt(m, b.x + right.x, b.y + right.y);
    expect(b.state).toBe("exposed");
    expect(bossAimPoints(b)).toEqual([{ x: b.x, y: b.y, radius: b.radius }]);
  });
  it("clamps phase overflow, clears hazards, rearms only after the transition and never heals", () => {
    const m = commander();
    const b = m.state.boss!;
    breakPair(m);
    m.state.enemyBullets = [{ x: 10, y: 20, radius: 4, vx: 0, vy: 1 }];
    m.state.beams = [{ x: 20, age: 0 }];
    shootAt(m, b.x, b.y);
    expect(b.health).toBeCloseTo((650 * 2) / 3);
    expect(b.phase).toBe(2);
    expect(b.state).toBe("transition");
    expect(bossAimPoints(b)).toEqual([]);
    expect(m.state.enemyBullets).toHaveLength(0);
    expect(m.state.beams).toHaveLength(0);
    shootAt(m, b.x, b.y);
    expect(b.health).toBeCloseTo((650 * 2) / 3);
    for (let i = 0; i < 31; i++) m.update(0.05, { x: 0, y: 0 });
    expect(b.state).toBe("armored");
    expect(b.turrets!.map((t) => t.maxHealth)).toEqual([20, 20]);
    expect(b.turrets!.every((t) => t.health > 0 && t.health <= 20)).toBe(true);
    expect(b.health).toBeCloseTo((650 * 2) / 3);
    breakPair(m);
    shootAt(m, b.x, b.y);
    expect(b.health).toBeCloseTo(650 / 3);
    expect(b.phase).toBe(3);
  });
  it("prioritizes live hardpoints and settles the final core only once", () => {
    const m = commander();
    const b = m.state.boss!;
    expect(bossAimPoints(b)).toHaveLength(2);
    for (let phase = 1; phase <= 3; phase++) {
      breakPair(m);
      shootAt(m, b.x, b.y);
      if (phase < 3)
        for (let i = 0; i < 31; i++) m.update(0.05, { x: 0, y: 0 });
    }
    expect(b.state).toBe("defeated");
    expect(m.state.outcome).toBe("won");
    const score = m.state.score;
    m.update(0.05, { x: 0, y: 0 });
    expect(m.state.score).toBe(score);
    expect(
      m.drainEvents().filter((e) => e.type === "boss-destroyed"),
    ).toHaveLength(1);
  });
  it("keeps the existing open-core rules in other sectors and Endless", () => {
    for (const m of [commander(1), commander(2), commander(0, "endless")]) {
      const b = m.state.boss!;
      expect(b.state).toBeUndefined();
      const hp = b.health;
      shootAt(m, b.x, b.y, 5);
      expect(b.health).toBeLessThan(hp);
    }
  });
  it("aims both wingmen at the live mounts ahead instead of the nearer central escort", () => {
    const m = commander();
    m.state.ship.x = 195;
    m.state.wingmen.level = 2;
    m.state.drones = [
      { id: 1, side: -1, rank: 0 },
      { id: 2, side: 1, rank: 0 },
    ];
    m.state.enemies = [
      { x: 195, y: 440, radius: 16, health: 999, shot: 100, phase: 0, age: 2 },
    ];
    m.state.bullets = [];
    for (let i = 0; i < 5; i++) m.update(0.05, { x: 0, y: 0 });
    const guided = m.state.bullets.filter((b) => b.damage === 0.5625);
    expect(guided).toHaveLength(2);
    expect(guided[0].vx).toBeLessThan(0);
    expect(guided[1].vx).toBeGreaterThan(0);
    m.state.bullets = [
      {
        x: 145,
        y: 400,
        radius: 5,
        speed: 280,
        vx: 0,
        damage: 1.5,
        type: "missile",
        missile: true,
        age: 0,
      },
    ];
    m.update(0.05, { x: 0, y: 0 });
    expect(m.state.bullets.find((b) => b.missile)!.speed).toBeGreaterThan(280);
  });
  it("selects phase-appropriate authored motifs without adjacent repeats and resets", () => {
    const director = new StageWaveManager();
    const seen = new Set<string>();
    let previous = "";
    for (const time of [
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
      95, 100, 105, 110, 115,
    ]) {
      const wave = director.nextSquad(time, () => 0.15);
      expect(wave.id).not.toBe(previous);
      if (time < 30) expect(["line", "vee"]).toContain(wave.id);
      expect(wave.ships.length).toBeLessThanOrEqual(7);
      previous = wave.id;
      seen.add(wave.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
    director.reset();
    expect(director.nextSquad(0, () => 0.15).id).toBe("line");
  });
});
