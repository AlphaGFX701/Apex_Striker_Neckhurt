import { GameModel } from "../src/model";
import { defaultRun } from "../src/equipment";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
const m = new GameModel();
const config = defaultRun();
config.mode = "endless";
m.configure(config);
m.practice = true;
const started = performance.now(),
  samples: unknown[] = [];
let previous = started,
  accumulated = 0,
  ticks = 0,
  nextSample = 0,
  maxObjects = 0,
  maxStepMs = 0;
const timer = setInterval(() => {
  const now = performance.now();
  accumulated += (now - previous) / 1000;
  previous = now;
  while (accumulated >= 1 / 60) {
    const before = performance.now();
    if (m.state.energy >= 100) m.action("emp");
    const t = m.state.boss ||
      m.state.miniBoss ||
      m.state.pickups.find((p) => p.kind) || { x: 195, y: 600 };
    m.update(1 / 60, {
      x: Math.max(-1, Math.min(1, (t.x - m.state.ship.x) / 30)),
      y: 0,
    });
    m.drainEvents();
    maxStepMs = Math.max(maxStepMs, performance.now() - before);
    ticks++;
    accumulated -= 1 / 60;
    const s = m.state;
    if (
      s.bullets.length > 360 ||
      s.enemyBullets.length > 280 ||
      s.enemies.length > 24
    )
      throw new Error("Object cap exceeded");
    maxObjects = Math.max(
      maxObjects,
      s.bullets.length +
        s.enemyBullets.length +
        s.enemies.length +
        s.rocks.length +
        s.pickups.length +
        s.explosions.length,
    );
  }
  const seconds = (now - started) / 1000;
  if (seconds >= nextSample || seconds >= 1200) {
    const sample = {
      wallSeconds: +seconds.toFixed(2),
      simulationSeconds: +m.state.time.toFixed(2),
      wave: m.state.wave,
      heapMB: +(process.memoryUsage().heapUsed / 1048576).toFixed(2),
      maxObjects,
      maxStepMs: +maxStepMs.toFixed(3),
      ticks,
    };
    samples.push(sample);
    console.log(JSON.stringify(sample));
    nextSample += 60;
    writeFileSync(
      "artifacts/realtime-model-soak.json",
      JSON.stringify(
        {
          kind: "Real wall-clock 20-minute model soak; rendering and physical controls excluded",
          complete: seconds >= 1200,
          samples,
        },
        null,
        2,
      ),
    );
  }
  if (seconds >= 1200) {
    clearInterval(timer);
    console.log("REALTIME MODEL SOAK COMPLETE");
  }
}, 16);
