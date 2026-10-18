import type { Axes } from './sensor';

export const WORLD = { width: 390, height: 720, margin: 23 };
export interface Body { x: number; y: number; radius: number }
export interface Rock extends Body { speed: number; spin: number; phase: number; target: boolean }
export interface Bullet extends Body { speed: number }
export interface GameSnapshot {
  ship: Body;
  rocks: Rock[];
  bullets: Bullet[];
  score: number;
  lives: number;
  time: number;
  gameOver: boolean;
  invincible: number;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const collides = (a: Body, b: Body) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.radius + b.radius) ** 2;

export function clampShip(x: number, y: number): { x: number; y: number } {
  return { x: clamp(x, WORLD.margin, WORLD.width - WORLD.margin), y: clamp(y, 100, WORLD.height - 35) };
}

export class GameModel {
  state: GameSnapshot;
  practice = false;
  private spawnClock = 0;
  private shotClock = 0;
  private random: () => number;

  constructor(random = Math.random) {
    this.random = random;
    this.state = this.initialState();
  }

  private initialState(): GameSnapshot {
    return { ship: { x: WORLD.width / 2, y: WORLD.height - 100, radius: 16 }, rocks: [], bullets: [], score: 0, lives: 3, time: 0, gameOver: false, invincible: 0 };
  }

  reset() { this.state = this.initialState(); this.spawnClock = 0; this.shotClock = 0; }

  update(dt: number, axes: Axes, target: { x: number; y: number } | null = null) {
    const s = this.state;
    if (s.gameOver) return;
    const step = Math.min(dt, 0.05);
    s.time += step;
    s.invincible = Math.max(0, s.invincible - step);
    const next = target
      ? { x: s.ship.x + (target.x - s.ship.x) * Math.min(1, step * 12), y: s.ship.y + (target.y - s.ship.y) * Math.min(1, step * 12) }
      : { x: s.ship.x + axes.x * step * 310, y: s.ship.y + axes.y * step * 310 };
    Object.assign(s.ship, clampShip(next.x, next.y));

    this.shotClock += step;
    if (this.shotClock >= 0.18) {
      this.shotClock -= 0.18;
      s.bullets.push({ x: s.ship.x, y: s.ship.y - 25, radius: 4, speed: 530 });
    }
    this.spawnClock += step;
    const spawnEvery = Math.max(0.38, 0.9 - s.time * 0.004);
    if (this.spawnClock >= spawnEvery) {
      this.spawnClock -= spawnEvery;
      const radius = 14 + this.random() * 17;
      s.rocks.push({ x: 30 + this.random() * 330, y: -40, radius, speed: 115 + this.random() * 100 + Math.min(90, s.time * 1.4), spin: (this.random() - 0.5) * 1.8, phase: this.random() * 6.28, target: this.random() > 0.68 });
    }
    for (const bullet of s.bullets) bullet.y -= bullet.speed * step;
    for (const rock of s.rocks) { rock.y += rock.speed * step; rock.phase += rock.spin * step; }

    const hitBullets = new Set<Bullet>();
    const hitRocks = new Set<Rock>();
    for (const bullet of s.bullets) {
      for (const rock of s.rocks) {
        if (!hitRocks.has(rock) && collides(bullet, rock)) {
          hitBullets.add(bullet); hitRocks.add(rock);
          s.score += rock.target ? 25 : 10;
          break;
        }
      }
    }
    for (const rock of s.rocks) {
      if (!hitRocks.has(rock) && s.invincible === 0 && collides(s.ship, rock)) {
        hitRocks.add(rock);
        if (!this.practice) {
          s.lives -= 1;
          s.invincible = 1.2;
          if (s.lives <= 0) s.gameOver = true;
        }
      }
    }
    s.bullets = s.bullets.filter(bullet => bullet.y > -10 && !hitBullets.has(bullet));
    s.rocks = s.rocks.filter(rock => rock.y < WORLD.height + 45 && !hitRocks.has(rock));
  }
}
