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
  it.each([1, 2, 3])(
    "keeps phase %i threatening after both mounts are destroyed",
    (phase) => {
      const m = commander(),
        b = m.state.boss!;
      b.state = "exposed";
      b.phase = phase;
      b.shot = 0.01;
      b.health = phase === 1 ? 650 : phase === 2 ? 430 : 215;
      b.turrets!.forEach((t) => (t.health = 0));
      let emitted = 0;
      for (let i = 0; i < 600; i++) {
        m.state.enemyBullets = [];
        m.state.bullets = [];
        m.state.enemies = [];
        m.update(0.01, { x: Math.floor(i / 100) % 2 ? -1 : 1, y: 0 });
        emitted += m.state.enemyBullets.length;
      }
      expect(emitted).toBeGreaterThanOrEqual(24);
    },
  );
  it("suspends normal salvos for the entire large-beam warning and firing interval", () => {
    const m = commander();
    m.state.boss!.shot = 0;
    m.state.beams = [{ x: 100, age: 0 }];
    for (let i = 0; i < 35; i++) {
      m.state.bullets = [];
      m.update(0.05, { x: 0, y: 0 });
      expect(m.state.enemyBullets).toHaveLength(0);
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
    const mounts = bossAimPoints(m.state.boss!);
    for (const bullet of guided) {
      const nearest = [...mounts].sort(
        (a, b) => Math.abs(a.x - bullet.x) - Math.abs(b.x - bullet.x),
      )[0];
      expect(Math.sign(bullet.vx!)).toBe(Math.sign(nearest.x - bullet.x));
    }
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
  it("spaces guaranteed supplies but still offers five evolution orbs during stage one", () => {
    const m = new GameModel();
    m.practice = true;
    for (const time of [32, 78, 124, 170, 216]) {
      m.state.time = time - 0.01;
      m.state.pickups = [];
      m.state.bullets = [];
      m.state.enemies = [];
      m.update(0.02, { x: 0, y: 0 });
      expect(m.state.pickups.filter((p) => p.kind === "weapon")).toHaveLength(
        1,
      );
      for (const p of m.state.pickups)
        Object.assign(p, { x: m.state.ship.x, y: m.state.ship.y });
      m.update(0.01, { x: 0, y: 0 });
    }
    expect(m.state.evolution.level).toBe(3);
    expect(m.state.evolution.orbs).toBe(5);
  });
  it.each([-1, 1] as const)(
    "lets the outer wingman hit a live mount from screen edge %i",
    (side) => {
      const m = commander(),
        b = m.state.boss!;
      m.state.ship.x = side === -1 ? 23 : 367;
      // Isolate the clamped outer wingman's shots while the boss drifts away;
      // the inner wingman must not hide a missed firing angle in this fixture.
      b.age = side === -1 ? 0 : Math.PI / 0.42;
      m.state.wingmen.level = 2;
      m.state.drones = [{ id: 1, side, rank: 0 }];
      for (let i = 0; i < 400; i++) {
        m.state.bullets = m.state.bullets.filter(
          (shot) => shot.damage === 0.5625,
        );
        m.state.pickups = [];
        m.state.enemies = [];
        m.update(0.01, { x: 0, y: 0 });
      }
      const mount = b.turrets![side === -1 ? 0 : 1];
      expect(mount.health).toBeLessThan(mount.maxHealth);
      expect(b.health).toBe(650);
    },
  );
  it("uses a one-in-sixteen weapon weight in guaranteed enemy loot", () => {
    let orbs = 0;
    for (let i = 0; i < 16; i++) {
      const m = new GameModel(() => (i + 0.5) / 16);
      m.state.enemies = [
        { x: 100, y: 100, radius: 22, kind: 2, health: 6, shot: 10, phase: 0 },
      ];
      m.state.energy = 100;
      m.action("emp");
      orbs += m.state.pickups.filter((p) => p.kind === "weapon").length;
    }
    expect(orbs).toBe(1);
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
