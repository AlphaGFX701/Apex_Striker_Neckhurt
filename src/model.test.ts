import { describe, expect, it } from 'vitest';
import { clampShip, GameModel, WORLD } from './model';

describe('space game', () => {
  it('keeps the ship inside the field', () => {
    expect(clampShip(-100, -100)).toEqual({ x: WORLD.margin, y: 100 });
    expect(clampShip(999, 999)).toEqual({ x: WORLD.width - WORLD.margin, y: WORLD.height - 35 });
  });

  it('fires automatically, scores a hit, and can restart', () => {
    const model = new GameModel(() => 0.5);
    for (let i = 0; i < 4; i++) model.update(0.05, { x: 0, y: 0 });
    expect(model.state.bullets).toHaveLength(2);
    const bullet = model.state.bullets[0];
    model.state.rocks.push({ x: bullet.x, y: bullet.y - 2, radius: 16, speed: 0, spin: 0, phase: 0, target: true });
    model.update(0.01, { x: 0, y: 0 });
    expect(model.state.score).toBe(25);
    model.reset();
    expect(model.state.score).toBe(0);
    expect(model.state.lives).toBe(3);
  });

  it('ends after three collisions, while practice preserves lives', () => {
    const model = new GameModel(() => 0.5);
    for (let i = 0; i < 3; i++) {
      model.state.invincible = 0;
      model.state.rocks.push({ x: model.state.ship.x, y: model.state.ship.y, radius: 20, speed: 0, spin: 0, phase: 0, target: false });
      model.update(0.01, { x: 0, y: 0 });
    }
    expect(model.state.gameOver).toBe(true);
    model.reset();
    model.practice = true;
    model.state.rocks.push({ x: model.state.ship.x, y: model.state.ship.y, radius: 20, speed: 0, spin: 0, phase: 0, target: false });
    model.update(0.01, { x: 0, y: 0 });
    expect(model.state.lives).toBe(3);
  });

  it('shares cooldown across left/right and prevents duplicate skill activation', () => {
    const m = new GameModel();
    expect(m.action('dodgeLeft').accepted).toBe(true);
    expect(m.state.ship.x).toBe(65);
    expect(m.state.dodgeCooldown).toBe(2.5);
    expect(m.action('dodgeRight').accepted).toBe(false);
    expect(m.state.invincible).toBe(0.6);
    for (let i = 0; i < 61; i++) m.update(0.05, { x: -1, y: 1 });
    expect(m.action('dodgeRight').accepted).toBe(true);
    expect(m.state.dodges).toBe(2);
    expect(m.state.ship.x).toBeGreaterThanOrEqual(WORLD.margin);
    expect(m.state.ship.y).toBeLessThanOrEqual(WORLD.height - 35);
  });

  it('requires full energy, clears enemy bullets, damages boss, and spends energy once', () => {
    const m = new GameModel();
    expect(m.action('emp').accepted).toBe(false);
    m.state.energy = 100;
    m.state.enemyBullets.push({ x: 10, y: 20, radius: 5, vx: 0, vy: 100 });
    m.state.boss = { x: 195, y: 140, radius: 48, health: 70, maxHealth: 70, shot: 1 };
    expect(m.action('emp').accepted).toBe(true);
    expect(m.state.enemyBullets).toEqual([]);
    expect(m.state.boss.health).toBe(52);
    expect(m.state.energy).toBe(0);
    expect(m.action('emp').accepted).toBe(false);
    expect(m.state.emps).toBe(1);
  });

  it('spawns a boss at 60s, alternates patterns, and ends at 90s in practice', () => {
    const m = new GameModel(() => 0.3); m.practice = true;
    for (let i = 0; i < 1201; i++) m.update(0.05, { x: -1, y: 1 });
    expect(m.state.boss).not.toBeNull();
    expect(m.state.lives).toBe(3);
    for (let i = 0; i < 610; i++) m.update(0.05, { x: -1, y: 1 });
    expect(m.state.gameOver).toBe(true);
    expect(m.state.result).toBe('practice');
    expect(m.state.time).toBeLessThanOrEqual(90);
    m.reset(); expect(m.state.boss).toBeNull(); expect(m.state.dodges).toBe(0); expect(m.state.energy).toBe(0);
  });

  it('can win by defeating the boss and rejects actions after the round', () => {
    const m = new GameModel();
    m.state.boss = { x: 195, y: 140, radius: 48, health: 10, maxHealth: 70, shot: 1 };
    m.state.energy = 100; m.action('emp');
    expect(m.state.result).toBe('won'); expect(m.state.gameOver).toBe(true);
    expect(m.action('dodgeLeft').accepted).toBe(false);
  });

  it('stops promptly and moves similarly at 30/60/120 fps', () => {
    const positions = [30, 60, 120].map(hz => {
      const m = new GameModel();
      for (let i = 0; i < hz / 4; i++) m.update(1 / hz, { x: 0.5, y: 0 });
      const before = m.state.ship.x;
      for (let i = 0; i < hz / 2; i++) m.update(1 / hz, { x: 0, y: 0 });
      expect(m.state.ship.x - before).toBeLessThan(10);
      m.clearInput(); const at = m.state.ship.x; m.update(1 / hz, { x: 0, y: 0 }); expect(m.state.ship.x).toBe(at);
      return m.state.ship.x;
    });
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(5);
  });
});

it('spread fires rapid volleys at twelve degrees', () => {
  const model = new GameModel(() => 0); model.weapon = 'spread';
  for(let i=0;i<6;i++) model.update(.05,{x:0,y:0});
  expect(model.state.bullets).toHaveLength(6);
  expect(model.state.bullets.map(b=>b.damage)).toEqual(Array(6).fill(.28));
  expect(model.state.bullets[0].vx).toBeCloseTo(-Math.sin(Math.PI/15)*530);
  expect(model.state.bullets[2].vx).toBeCloseTo(Math.sin(Math.PI/15)*530);
});
it('straight shot cadence and weapon choice survive restart', () => {
  const model = new GameModel(); for(let i=0;i<4;i++) model.update(.05,{x:0,y:0});
  expect(model.state.bullets).toHaveLength(2); expect(model.state.bullets[0].damage).toBe(.56);
  model.weapon='spread'; model.reset(); expect(model.weapon).toBe('spread'); expect(model.state.bullets).toHaveLength(0);
});
