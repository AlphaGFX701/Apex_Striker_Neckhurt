import { createServer } from "vite";
import { writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const { GameModel, bossAimPoints } =
    await server.ssrLoadModule("/src/model.ts");
  const { defaultRun } = await server.ssrLoadModule("/src/equipment.ts");
  const runs = [];
  for (const weapon of ["pulse", "plasma", "laser"])
    for (const loadout of ["base", "level2-wing2"]) {
      const c = defaultRun();
      c.stage = 0;
      c.seed = 743;
      c.equipment.main = weapon;
      const m = new GameModel();
      m.configure(c);
      m.practice = true;
      m.reset();
      m.state.time = 119.99;
      m.update(0.02, { x: 0, y: 0 });
      m.state.invincible = 10000;
      if (loadout === "level2-wing2") {
        m.state.evolution = { orbs: 2, level: 2, transformRemaining: 0 };
        m.state.powers.weapon = 1;
        m.state.wingmen.level = 2;
        m.state.drones = [
          { id: 1, side: -1, rank: 0 },
          { id: 2, side: 1, rank: 0 },
        ];
      }
      let transitions = 0,
        previous = m.state.boss?.state;
      for (let i = 0; i < 18000 && !m.state.gameOver; i++) {
        m.state.pickups = [];
        const aim =
          m.state.boss &&
          bossAimPoints(m.state.boss).sort(
            (a, b) =>
              Math.abs(a.x - m.state.ship.x) - Math.abs(b.x - m.state.ship.x),
          )[0];
        // 65% target tracking in every 2-second interval; no pickups or EMP.
        const offset =
          loadout === "level2-wing2" && m.state.time % 2 > 1.3
            ? aim?.x < 195
              ? 125
              : -125
            : 0;
        m.update(
          0.05,
          { x: 0, y: 0 },
          aim ? { x: aim.x + offset, y: 610 } : null,
        );
        if (m.state.boss?.state === "transition" && previous !== "transition")
          transitions++;
        previous = m.state.boss?.state;
        m.drainEvents();
      }
      runs.push({
        weapon,
        loadout,
        bossSeconds: +(m.state.time - m.state.bossStarted).toFixed(2),
        result: m.state.outcome,
        coreHP: m.state.boss?.maxHealth,
        transitions,
        finalState: m.state.boss?.state,
      });
    }
  await writeFile(
    "artifacts/pixel-combat-balance.json",
    JSON.stringify(
      {
        kind: "deterministic-reference-not-human-playtest",
        trackingDutyCycle: 0.65,
        seed: 743,
        runs,
      },
      null,
      2,
    ),
  );
  console.table(runs);
} finally {
  await server.close();
}
