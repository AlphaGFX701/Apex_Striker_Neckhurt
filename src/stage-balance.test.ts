import { expect, it } from "vitest";
import { GameModel } from "./model";
import { defaultRun } from "./equipment";
it.each([0, 1, 2])(
  "clears sector %i with every base weapon and EMP, without collecting pickups",
  (stage) => {
    for (const weapon of ["pulse", "plasma", "laser"] as const) {
      const m = new GameModel(() => 0.5),
        c = defaultRun();
      c.stage = stage;
      c.equipment.main = weapon;
      m.configure(c);
      m.practice = true;
      for (let i = 0; i < 9001 && !m.state.gameOver; i++) {
        m.state.pickups = [];
        if (m.state.boss && m.state.energy >= 100) m.action("emp");
        const target = m.state.boss ? { x: m.state.boss.x, y: 600 } : null;
        m.update(0.01, { x: 0, y: 0 }, target);
        m.drainEvents();
      }
      expect(
        m.state.boss?.health,
        `stage ${stage} / ${weapon} should defeat the boss`,
      ).toBeLessThanOrEqual(0);
      expect(m.state.time).toBeLessThan(90);
    }
  },
);
