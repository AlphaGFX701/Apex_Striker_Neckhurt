import { createServer } from "vite";
import { writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const { GameModel } = await server.ssrLoadModule("/src/model.ts");
  const runs = [];
  for (const state of ["armored", "exposed"])
    for (const phase of [1, 2, 3]) {
      const m = new GameModel();
      m.practice = true;
      m.state.time = 119.99;
      m.update(0.02, { x: 0, y: 0 });
      const b = m.state.boss;
      b.state = state;
      b.phase = phase;
      b.shot = 0.01;
      b.health = phase === 1 ? 650 : phase === 2 ? 430 : 215;
      if (state === "exposed") b.turrets.forEach((t) => (t.health = 0));
      let emitted = 0;
      for (let i = 0; i < 600; i++) {
        m.state.enemyBullets = [];
        m.state.bullets = [];
        m.state.enemies = [];
        m.update(0.01, { x: Math.floor(i / 100) % 2 ? -1 : 1, y: 0 });
        emitted += m.state.enemyBullets.length;
      }
      runs.push({
        state,
        phase,
        intervalSeconds: 6,
        emitted,
        perSecond: +(emitted / 6).toFixed(2),
      });
    }
  const result = {
    kind: "controlled-boss-emission-fixture-not-human-playtest",
    method:
      "Clear previously observed hostile bullets each0.01s and count newly emitted shots; move pilot to avoid stationary beam. No player damage.",
    previousExposedSixSecondCounts: [4, 5, 5],
    runs,
    changes: {
      coreHP: 650,
      supplyOrbSeconds: [24, 60, 96, 132, 168],
      enemyWeaponLootWeight: "1/16; previously1/6",
      meteorWeaponDropChance: 0.05,
      redProjectileShare: "one in three main rounds",
      redLaser: "two interceptions per third0.1s pulse",
      overdriveSeconds: 25,
    },
  };
  await writeFile(
    "artifacts/pixel-boss-pressure.json",
    JSON.stringify(result, null, 2),
  );
  console.table(runs);
} finally {
  await server.close();
}
