import { describe, expect, it } from "vitest";
import { GameModel, type PickupKind } from "./model";

describe("arcade pickups", () => {
  function collect(m: GameModel, kind: PickupKind) {
    m.state.pickups.push({
      x: m.state.ship.x,
      y: m.state.ship.y,
      value: 0,
      age: 0,
      kind,
    });
    m.update(0.01, { x: 0, y: 0 });
  }
  it("applies pickups immediately and resets temporary powers", () => {
    const m = new GameModel();
    collect(m, "weapon");
    collect(m, "weapon");
    collect(m, "weapon");
    expect(m.state.powers.weapon).toBe(2);
    expect(m.state.energy).toBeLessThan(1);
    expect(m.state.score).toBeGreaterThan(0);
    collect(m, "missile");
    collect(m, "missile");
    collect(m, "missile");
    expect(m.state.powers.missile).toBeLessThanOrEqual(24);
    expect(m.state.powers.missile).toBeGreaterThan(23);
    collect(m, "drone");
    collect(m, "shield");
    expect(m.state.powers.drone).toBeGreaterThan(0);
    expect(m.state.shield).toBe(true);
    m.state.lives = 1;
    collect(m, "repair");
    expect(m.state.lives).toBe(2);
    m.reset();
    expect(m.state.powers).toEqual({
      weapon: 0,
      missile: 0,
      drone: 0,
      overdrive: 0,
    });
    expect(m.state.shield).toBe(false);
  });
  it("pulls a pickup from within 150 units without pausing the clock", () => {
    const m = new GameModel();
    m.state.pickups.push({
      x: m.state.ship.x + 100,
      y: m.state.ship.y,
      value: 0,
      age: 0,
      kind: "energy",
    });
    m.update(0.05, { x: 0, y: 0 });
    expect(m.state.pickups[0].x).toBeLessThan(m.state.ship.x + 100);
    expect(m.state.time).toBeGreaterThan(0);
  });
});
