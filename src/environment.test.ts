import { describe, expect, it } from "vitest";
import { StageWaveManager, waveAt } from "./stage-waves";
import { GameModel } from "./model";
import { defaultRun } from "./equipment";

function advance(m: GameModel, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds / 0.01); i++)
    m.update(0.01, { x: 0, y: 0 });
}
describe("stage events", () => {
  it("crosses every boundary once, including a large time jump, and resets", () => {
    const d = new StageWaveManager();
    expect(d.advance(0).map((e) => e.kind)).toEqual(["wave"]);
    const events = d.advance(180);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    expect(events.filter((e) => e.kind === "mini-spawn")).toHaveLength(1);
    expect(events.filter((e) => e.kind === "boss-spawn")).toHaveLength(1);
    expect(d.advance(180)).toEqual([]);
    expect([0, 30, 75, 120, 180].map(waveAt)).toEqual([0, 1, 2, 3, 3]);
    d.reset();
    expect(d.advance(0)).toHaveLength(1);
  });
  it("spawns and withdraws the mini-boss before the final boss", () => {
    const m = new GameModel(() => 0.9);
    m.practice = true;
    m.state.time = 89.99;
    advance(m, 1.55);
    expect(m.state.miniBoss).not.toBeNull();
    m.state.time = 119.99;
    advance(m, 0.02);
    expect(m.state.miniBoss).toBeNull();
    expect(m.state.boss).not.toBeNull();
    expect(m.state.warning).toBe("WARNING · CAPITAL SHIP");
    expect(m.state.pickups.every(p=>p.kind==="weapon")).toBe(true);
  });
  it("rewards mini-boss death once without ending the run", () => {
    const m = new GameModel();
    m.state.miniBoss = {
      x: 195,
      y: 150,
      radius: 32,
      health: 1,
      maxHealth: 18,
      shot: 10,
    };
    m.state.miniBoss.health = 0;
    advance(m, 0.01);
    expect(m.state.miniBoss).toBeNull();
    expect(m.state.pickups.filter((p) => p.kind)).toHaveLength(2);
    expect(m.state.gameOver).toBe(false);
    advance(m, 0.02);
    expect(m.state.pickups.filter((p) => p.kind)).toHaveLength(2);
  });
  it("changes boss phases without restoring health and clears old bullets", () => {
    const m = new GameModel();
    m.practice = true;
    m.config.stage = 1;
    m.state.boss = {
      x: 195,
      y: 140,
      radius: 48,
      health: 70,
      maxHealth: 90,
      phase: 1,
      shot: 10,
    };
    advance(m, 0.01);
    m.state.boss!.health = 55;
    m.state.enemyBullets.push({ x: 20, y: 20, radius: 4, vx: 0, vy: 1 });
    advance(m, 0.01);
    expect(m.state.boss!.phase).toBe(2);
    expect(m.state.enemyBullets).toHaveLength(0);
    expect(m.state.boss!.health).toBe(55);
    m.state.boss!.health = 25;
    advance(m, 0.01);
    expect(m.state.boss!.phase).toBe(3);
  });
  it("slows movement only inside an active storm and leaves warp range intact", () => {
    const a = new GameModel(),
      b = new GameModel();
    a.practice = b.practice = true;
    a.state.storm = { x: 100, width: 220, age: 1.3 };
    for (let i = 0; i < 10; i++) {
      a.update(0.01, { x: 1, y: 0 });
      b.update(0.01, { x: 1, y: 0 });
    }
    expect(a.state.ship.x).toBeLessThan(b.state.ship.x);
    const x = a.state.ship.x;
    a.action("dodgeLeft");
    expect(x - a.state.ship.x).toBeCloseTo(130);
  });
  it("reports the actual pickup conversion and emits only once", () => {
    const m = new GameModel();
    m.state.powers.weapon = 2;
    m.state.pickups.push({ x: 195, y: 610, value: 0, age: 0, kind: "weapon" });
    advance(m, 0.01);
    const event = m.drainEvents().find((e) => e.type === "pickup");
    expect(event?.type === "pickup" && event.data.effect).toBe("weapon");
    expect(m.state.powers.overdrive).toBe(25);
    advance(m, 0.01);
    expect(m.drainEvents().filter((e) => e.type === "pickup")).toHaveLength(0);
  });
});
