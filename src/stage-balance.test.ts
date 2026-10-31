import { expect, it } from "vitest";
import { GameModel } from "./model";
import { defaultRun } from "./equipment";
it.each([0, 1, 2])(
  "base weapons can beat endurance boss in sector %i without EMP damage or pickups",
  (stage) => {
    for (const weapon of ["pulse", "plasma", "laser"] as const) {
      const m = new GameModel(),
        c = defaultRun();
      c.stage = stage;
      c.seed = 574;
      c.equipment.main = weapon;
      m.configure(c);
      m.practice = true;
      m.reset();
      for (let i = 0; i < 14000 && !m.state.gameOver; i++) {
        m.state.pickups = [];
        const target = m.state.boss ? { x: m.state.boss.x, y: 610 } : null;
        m.update(0.05, { x: 0, y: 0 }, target);
        m.drainEvents();
      }
      expect(m.state.result, `sector ${stage}/${weapon}`).toBe("practice");
      expect(m.state.boss?.health).toBeLessThanOrEqual(0);
      expect(m.state.time).toBeGreaterThan(180);
      expect(m.state.time).toBeLessThan(700);
    }
  },
);
