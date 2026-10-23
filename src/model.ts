import type { Axes } from './sensor';
import type { Action } from './motion';
export const WORLD = { width: 390, height: 720, margin: 23 };
export interface Body { x: number; y: number; radius: number }
export interface Rock extends Body { speed: number; spin: number; phase: number; target: boolean }
export interface Bullet extends Body { speed: number }
export interface Enemy extends Body { health: number; shot: number; phase: number }
export interface EnemyBullet extends Body { vx: number; vy: number }
export interface Boss extends Body { health: number; maxHealth: number; shot: number }
export interface GameSnapshot {
  ship: Body; rocks: Rock[]; bullets: Bullet[]; enemies: Enemy[]; enemyBullets: EnemyBullet[]; boss: Boss | null;
  score: number; lives: number; time: number; gameOver: boolean; invincible: number;
  result: 'won' | 'lost' | 'timeout' | 'practice' | null;
  energy: number; dodgeCooldown: number; dodgeTime: number; dodgeDirection: number; dodges: number; emps: number;
  empEffect: number; empOrigin: { x: number; y: number }; hitEffect: number;
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const collides = (a: Body, b: Body) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.radius + b.radius) ** 2;
export function clampShip(x: number, y: number) { return { x: clamp(x, WORLD.margin, WORLD.width - WORLD.margin), y: clamp(y, 100, WORLD.height - 35) }; }
export class GameModel {
  state: GameSnapshot;
  practice = false;
  private spawnClock = 0;
  private enemyClock = 0;
  private shotClock = 0;
  private velocity: Axes = { x: 0, y: 0 };
  private actionLock = 0;
  constructor(private random = Math.random) { this.state = this.initialState(); }
  private initialState(): GameSnapshot {
    return { ship: { x: 195, y: 620, radius: 12 }, rocks: [], bullets: [], enemies: [], enemyBullets: [], boss: null,
      score: 0, lives: 3, time: 0, gameOver: false, invincible: 0, result: null, energy: 0,
      dodgeCooldown: 0, dodgeTime: 0, dodgeDirection: 0, dodges: 0, emps: 0, empEffect: 0, empOrigin: { x: 195, y: 620 }, hitEffect: 0 };
  }
  reset() { this.state = this.initialState(); this.spawnClock = 0; this.enemyClock = 0; this.shotClock = 0; this.actionLock = 0; this.clearInput(); }
  clearInput() { this.velocity = { x: 0, y: 0 }; }
  fillEnergy() { if (this.practice && !this.state.gameOver) this.state.energy = 100; }
  action(action: Action): { accepted: boolean; reason: string } {
    const s = this.state;
    if (s.gameOver) return { accepted: false, reason: 'รอบจบแล้ว • กดเริ่มใหม่' };
    if (this.actionLock > 0) return { accepted: false, reason: 'รอท่าก่อนหน้าจบสักครู่' };
    if (action === 'emp') {
      if (s.energy < 100) return { accepted: false, reason: `EMP ยังไม่เต็ม (${Math.floor(s.energy)}%)` };
      s.energy = 0; s.emps++; s.enemyBullets = []; s.empEffect = 0.75; s.empOrigin = { ...s.ship };
      s.score += s.rocks.reduce((sum, rock) => sum + (rock.target ? 25 : 10), 0); s.rocks = [];
      s.score += s.enemies.length * 40; s.enemies = [];
      if (s.boss) s.boss.health = Math.max(0, s.boss.health - 18);
      this.actionLock = 0.25; this.clearInput(); this.checkBoss();
      return { accepted: true, reason: 'EMP! ล้างกระสุนและโจมตีศัตรูทั้งจอ' };
    }
    if (s.dodgeCooldown > 0) return { accepted: false, reason: `หลบกำลังฟื้น ${s.dodgeCooldown.toFixed(1)} วินาที` };
    s.dodgeCooldown = 3; s.dodgeTime = 0.6; s.invincible = Math.max(s.invincible, 0.6);
    s.dodgeDirection = action === 'dodgeLeft' ? -1 : 1; s.dodges++;
    this.actionLock = 0.2; this.clearInput();
    return { accepted: true, reason: action === 'dodgeLeft' ? 'กลิ้งหลบซ้าย • อมตะ 0.6 วินาที' : 'กลิ้งหลบขวา • อมตะ 0.6 วินาที' };
  }
  private finish(result: NonNullable<GameSnapshot['result']>) { this.state.result = this.practice ? 'practice' : result; this.state.gameOver = true; this.clearInput(); }
  private checkBoss() { if (this.state.boss && this.state.boss.health <= 0 && !this.state.gameOver) { this.state.score += 500; this.finish('won'); } }
  private damage() {
    const s = this.state; if (s.invincible > 0) return;
    s.hitEffect = 0.3; s.invincible = 1.2;
    if (!this.practice) { s.lives--; if (s.lives <= 0) this.finish('lost'); }
  }
  private fireFan(x: number, y: number, count: number, speed: number, offset = 0) {
    for (let i = 0; i < count; i++) {
      const angle = offset + (i - (count - 1) / 2) * 0.25;
      this.state.enemyBullets.push({ x, y, radius: 5, vx: Math.sin(angle) * speed, vy: Math.cos(angle) * speed });
    }
  }
  update(dt: number, axes: Axes, target: { x: number; y: number } | null = null) {
    const s = this.state; if (s.gameOver) return;
    const step = Math.max(0, Math.min(dt, 0.05)); if (!step) return;
    s.time = Math.min(90, s.time + step);
    s.energy = Math.min(100, s.energy + step * 5);
    s.invincible = Math.max(0, s.invincible - step); s.dodgeCooldown = Math.max(0, s.dodgeCooldown - step);
    s.dodgeTime = Math.max(0, s.dodgeTime - step); s.empEffect = Math.max(0, s.empEffect - step); s.hitEffect = Math.max(0, s.hitEffect - step);
    this.actionLock = Math.max(0, this.actionLock - step);
    const desired = target ? { x: clamp((target.x - s.ship.x) * 10, -310, 310), y: clamp((target.y - s.ship.y) * 10, -310, 310) }
      : { x: clamp(axes.x, -1, 1) * 310, y: clamp(axes.y, -1, 1) * 310 };
    const blend = 1 - Math.exp(-step / 0.055);
    this.velocity.x += (desired.x - this.velocity.x) * blend; this.velocity.y += (desired.y - this.velocity.y) * blend;
    const next = clampShip(s.ship.x + (this.velocity.x + (s.dodgeTime > 0 ? s.dodgeDirection * 220 * s.dodgeTime / 0.6 : 0)) * step, s.ship.y + this.velocity.y * step);
    if (next.x === WORLD.margin || next.x === WORLD.width - WORLD.margin) this.velocity.x = 0;
    if (next.y === 100 || next.y === WORLD.height - 35) this.velocity.y = 0;
    Object.assign(s.ship, next);
    this.shotClock += step;
    if (this.shotClock >= 0.18) { this.shotClock -= 0.18; s.bullets.push({ x: s.ship.x, y: s.ship.y - 25, radius: 4, speed: 530 }); }
    this.spawnClock += step; this.enemyClock += step;
    if (s.time < 60 && this.spawnClock >= (s.time < 15 ? 1.6 : 2.1)) {
      this.spawnClock = 0; const radius = 14 + this.random() * 14;
      s.rocks.push({ x: 30 + this.random() * 330, y: -40, radius, speed: 95 + this.random() * 70, spin: (this.random() - 0.5) * 1.8, phase: 0, target: this.random() > 0.68 });
    }
    if (s.time < 60 && this.enemyClock >= (s.time < 15 ? 3 : 2)) {
      this.enemyClock = 0; s.enemies.push({ x: 50 + this.random() * 290, y: -30, radius: 18, health: 2, shot: 1.5, phase: this.random() * 6 });
    }
    if (s.time >= 60 && !s.boss) { s.boss = { x: 195, y: 140, radius: 48, health: 70, maxHealth: 70, shot: 1.5 }; s.rocks = []; s.enemies = []; s.enemyBullets = []; }
    for (const bullet of s.bullets) bullet.y -= bullet.speed * step;
    for (const rock of s.rocks) { rock.y += rock.speed * step; rock.phase += rock.spin * step; }
    for (const enemy of s.enemies) {
      enemy.y += 55 * step; enemy.x = clamp(enemy.x + Math.sin(s.time * 1.5 + enemy.phase) * 22 * step, 25, 365); enemy.shot -= step;
      if (s.time >= 15 && enemy.shot <= 0 && enemy.y > 30 && enemy.y < 400) { enemy.shot = 2.1; this.fireFan(enemy.x, enemy.y + 15, s.time < 35 ? 1 : 3, 140); }
    }
    if (s.boss) {
      s.boss.x = 195 + Math.sin((s.time - 60) * 0.65) * 90; s.boss.shot -= step;
      if (s.boss.shot <= 0) {
        s.boss.shot = 1.1;
        const aimed = Math.floor((s.time - 60) / 5) % 2 === 1;
        const angle = aimed ? Math.atan2(s.ship.x - s.boss.x, Math.max(50, s.ship.y - s.boss.y)) : 0;
        this.fireFan(s.boss.x, s.boss.y + 35, aimed ? 3 : 5, aimed ? 170 : 145, angle);
      }
    }
    for (const b of s.enemyBullets) { b.x += b.vx * step; b.y += b.vy * step; }
    const spent = new Set<Bullet>(), rocks = new Set<Rock>();
    for (const bullet of s.bullets) {
      for (const rock of s.rocks) {
        if (!rocks.has(rock) && collides(bullet, rock)) { spent.add(bullet); rocks.add(rock); s.score += rock.target ? 25 : 10; s.energy = Math.min(100, s.energy + 2); break; }
      }
      if (spent.has(bullet)) continue;
      const enemy = s.enemies.find(e => e.health > 0 && collides(bullet, e));
      if (enemy) { spent.add(bullet); enemy.health--; if (!enemy.health) { s.score += 40; s.energy = Math.min(100, s.energy + 5); } }
      else if (s.boss && collides(bullet, s.boss)) { spent.add(bullet); s.boss.health--; s.score += 2; }
    }
    for (const rock of s.rocks) if (!rocks.has(rock) && collides(s.ship, rock)) { rocks.add(rock); this.damage(); }
    for (const enemy of s.enemies) if (enemy.health > 0 && collides(s.ship, enemy)) { enemy.health = 0; this.damage(); }
    s.enemyBullets = s.enemyBullets.filter(b => { if (collides(s.ship, b)) { this.damage(); return false; } return b.y < 750 && b.y > -40 && b.x > -30 && b.x < 420; });
    if (s.boss && collides(s.ship, s.boss)) this.damage();
    s.bullets = s.bullets.filter(b => b.y > -10 && !spent.has(b));
    s.rocks = s.rocks.filter(r => r.y < 765 && !rocks.has(r));
    s.enemies = s.enemies.filter(e => e.health > 0 && e.y < 765);
    this.checkBoss();
    if (s.time >= 90 && !s.gameOver) this.finish('timeout');
  }
}
