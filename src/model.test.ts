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
    expect(model.state.bullets).toHaveLength(1);
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
});
