import { describe, it, expect } from "vitest";
import { GameModel } from "./model";
import { defaultRun } from "./equipment";
import { threatensPassage } from "./projectile-combat";
describe("readable boss escape corridors", () => {
  it("recognizes future hostile trajectories entering the lower escape lane", () => {
    expect(
      threatensPassage({ x: 195, y: 200, vx: 0, vy: 120, radius: 4 }, 195),
    ).toBe(true);
    expect(
      threatensPassage({ x: 20, y: 200, vx: 0, vy: 120, radius: 4 }, 195),
    ).toBe(false);
    expect(
      threatensPassage({ x: 195, y: 200, vx: 0, vy: -120, radius: 4 }, 195),
    ).toBe(false);
    expect(
      threatensPassage({ x: 20, y: 450, vx: 120, vy: 0, radius: 4 }, 195),
    ).toBe(true);
  });
  it.each([0, 1, 2])(
    "keeps a broad escape lane through all phases in sector%i",
    (stage) => {
      const c = defaultRun();
      c.stage = stage;
      c.seed = 523;
      const m = new GameModel();
      m.configure(c);
      m.reset();
      m.practice = true;
      m.state.time = 119.99;
      m.state.ship.x = 23;
      m.update(0.02, { x: 0, y: 0 });
      for (const ratio of [1, 0.6, 0.25]) {
        m.state.boss!.health = m.state.boss!.maxHealth * ratio;
        // These are attack-pattern fixtures. Stage-one phase is now explicit;
        // actual gate transitions are covered by pixel-combat.test.ts.
        if (m.state.boss!.state)
          m.state.boss!.phase = ratio === 1 ? 1 : ratio === 0.6 ? 2 : 3;
        for (let i = 0; i < 1200; i++) {
          m.update(0.01, { x: 0, y: 0 });
          m.drainEvents();
          const gap = m.state.boss!.safeLaneX!;
          for (const b of m.state.enemyBullets)
            if (b.y >= 430 && b.y <= 675)
              expect(Math.abs(b.x - gap)).toBeGreaterThan(45 + b.radius);
          expect(m.state.enemies.length).toBeLessThanOrEqual([6,8,10][stage]);
        }
      }
    },
  );
});
