import { describe, it, expect } from "vitest";
import { GameModel } from "./model";
import { defaultRun } from "./equipment";
function tick(m: GameModel, t = 0.01) {
  for (let i = 0; i < Math.ceil(t / 0.01); i++) m.update(0.01, { x: 0, y: 0 });
}
function power(m: GameModel) {
  m.state.pickups.push({
    x: m.state.ship.x,
    y: m.state.ship.y,
    age: 0,
    value: 0,
    kind: "weapon",
  });
  tick(m);
}
describe("25-second Red Overdrive", () => {
  it("handles360crossing projectile pairs without duplicate interception",()=>{
    const m=new GameModel();m.state.powers.overdrive=25;
    m.state.bullets=Array.from({length:360},(_,i)=>({x:20+(i%24)*15,y:90+Math.floor(i/24)*35,radius:4,speed:530,interceptor:true}));
    m.state.enemyBullets=m.state.bullets.map(b=>({x:b.x,y:b.y-12,radius:4,vx:0,vy:140}));
    m.update(.05,{x:0,y:0});expect(m.state.intercepted).toBe(360);expect(m.state.enemyBullets).toHaveLength(0);expect(m.state.bullets).toHaveLength(0);
  });
  it("starts and refreshes25seconds even at max weapon, then resets on restart", () => {
    const m = new GameModel();
    m.practice = true;
    power(m);
    expect(m.state.powers.overdrive).toBe(25);
    tick(m, 4);
    expect(m.state.powers.overdrive).toBeCloseTo(21);
    m.state.powers.weapon = 2;
    power(m);
    expect(m.state.powers.overdrive).toBe(25);
    expect(
      m
        .drainEvents()
        .filter((e) => e.type === "pickup")
        .every((e) => e.type === "pickup" && e.data.effect === "weapon"),
    ).toBe(true);
    for (let i = 0; i < 2510; i++) {
      m.state.pickups = [];
      m.state.enemies = [];
      tick(m);
    }
    expect(m.state.powers.overdrive).toBe(0);
    m.reset();
    expect(m.state.powers.overdrive).toBe(0);
  });
  it("red main shots consume one hostile round and themselves, without energy or drops", () => {
    const m = new GameModel();
    m.state.powers.overdrive = 25;
    m.state.bullets = [
      { x: 100, y: 400, radius: 4, speed: 0, interceptor: true },
    ];
    m.state.enemyBullets = [
      { x: 100, y: 400, radius: 4, vx: 0, vy: 0 },
      { x: 102, y: 400, radius: 4, vx: 0, vy: 0 },
    ];
    tick(m);
    expect(m.state.enemyBullets).toHaveLength(1);
    expect(m.state.bullets).toHaveLength(0);
    expect(m.state.intercepted).toBe(1);
    expect(m.state.energy).toBeLessThan(1);
    expect(m.state.pickups).toHaveLength(0);
  });
  it("uses swept collision at30fps and ordinary blue shots cannot intercept", () => {
    const m = new GameModel();
    m.state.bullets = [
      { x: 100, y: 420, radius: 4, speed: 530, interceptor: true },
    ];
    m.state.enemyBullets = [{ x: 100, y: 402, radius: 4, vx: 0, vy: 140 }];
    m.update(1 / 30, { x: 0, y: 0 });
    expect(m.state.intercepted).toBe(1);
    m.state.bullets = [{ x: 100, y: 400, radius: 4, speed: 0 }];
    m.state.enemyBullets = [{ x: 100, y: 400, radius: 4, vx: 0, vy: 0 }];
    tick(m);
    expect(m.state.enemyBullets).toHaveLength(1);
  });
  it("supports a red laser with a bounded interception budget and never cancels boss beams", () => {
    const m = new GameModel(),
      c = defaultRun();
    c.equipment.main = "laser";
    m.configure(c);
    power(m);
    m.state.enemyBullets = Array.from({ length: 10 }, (_, i) => ({
      x: 195,
      y: 300 + i * 14,
      radius: 4,
      vx: 0,
      vy: 0,
    }));
    m.state.beams = [{ x: 50, age: 0 }];
    tick(m, 0.1);
    expect(m.state.intercepted).toBeGreaterThan(0);
    expect(m.state.intercepted).toBeLessThanOrEqual(4);
    expect(m.state.beams).toHaveLength(1);
  });
});
