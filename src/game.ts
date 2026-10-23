import Phaser from 'phaser';
import { GameModel, WORLD, type GameSnapshot } from './model';
import type { Axes } from './sensor';
import type { Action } from './motion';
export interface GameControl {
  axes: (dt: number) => Axes; actions: () => Action[];
  onHud: (state: GameSnapshot) => void;
  onAction: (action: Action, accepted: boolean, reason: string) => void;
}
export class SpaceScene extends Phaser.Scene {
  readonly model = new GameModel();
  private art!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; size: number; speed: number }[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private dragTarget: { x: number; y: number } | null = null;
  private running = false;
  private started = false;
  constructor(private control: GameControl) { super('Space'); }
  create() {
    this.art = this.add.graphics();
    for (let i = 0; i < 85; i++) this.stars.push({ x: Math.random() * 390, y: Math.random() * 720, size: Math.random() * 1.6 + 0.4, speed: 18 + Math.random() * 45 });
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,Q,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.setDrag(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) this.setDrag(p); });
    this.input.on('pointerup', this.clearDrag);
    window.addEventListener('pointerup', this.clearDrag); window.addEventListener('pointercancel', this.clearDrag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { window.removeEventListener('pointerup', this.clearDrag); window.removeEventListener('pointercancel', this.clearDrag); this.input.keyboard?.removeAllKeys(); });
  }
  private clearDrag = () => { this.dragTarget = null; };
  start() { this.model.reset(); this.clearInput(); this.started = true; this.running = true; this.control.onHud(this.model.state); }
  clearInput() { this.dragTarget = null; this.model.clearInput(); this.input.keyboard?.resetKeys(); }
  pause() { this.running = false; this.clearInput(); }
  resume() { this.clearInput(); if (this.started && !this.model.state.gameOver) this.running = true; }
  setPractice(on: boolean) { this.model.practice = on; }
  get isRunning() { return this.running; }
  get hasStarted() { return this.started && !this.model.state.gameOver; }
  action(action: Action) {
    const result = this.running ? this.model.action(action) : { accepted: false, reason: 'เริ่มเกมหรือเล่นต่อก่อนใช้สกิล' };
    this.control.onAction(action, result.accepted, result.reason); this.control.onHud(this.model.state);
  }
  private setDrag(p: Phaser.Input.Pointer) { if (this.running) this.dragTarget = { x: p.worldX, y: p.worldY - 30 }; }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    if (this.running) {
      const axes = this.control.axes(dt), k = this.keys;
      if (k.LEFT.isDown || k.A.isDown) axes.x = -1;
      if (k.RIGHT.isDown || k.D.isDown) axes.x = 1;
      if (k.UP.isDown || k.W.isDown) axes.y = -1;
      if (k.DOWN.isDown || k.S.isDown) axes.y = 1;
      const actions = this.control.actions();
      if (Phaser.Input.Keyboard.JustDown(k.Q)) actions.push('dodgeLeft');
      if (Phaser.Input.Keyboard.JustDown(k.E)) actions.push('dodgeRight');
      if (Phaser.Input.Keyboard.JustDown(k.SPACE)) actions.push('emp');
      for (const action of actions) this.action(action);
      this.model.update(dt, axes, this.dragTarget);
      if (this.model.state.gameOver) { this.running = false; this.clearInput(); }
      this.control.onHud(this.model.state);
    }
    this.draw(dt);
  }
  private draw(dt: number) {
    const g = this.art, s = this.model.state; g.clear();
    g.fillGradientStyle(0x080d22, 0x080d22, 0x172343, 0x172343, 1); g.fillRect(0, 0, 390, 720);
    g.fillStyle(0x2a4676, 0.09); g.fillEllipse(50, 220, 300, 500); g.fillStyle(0x73356b, 0.06); g.fillEllipse(370, 470, 300, 500);
    g.lineStyle(1, 0x365175, 0.13);
    for (let x = 0; x <= 390; x += 39) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720; y += 45) g.lineBetween(0, y, 390, y);
    for (const star of this.stars) {
      if (this.running) star.y = (star.y + star.speed * dt) % 720;
      g.fillStyle(0xc2dcff, 0.25 + star.size / 3); g.fillCircle(star.x, star.y, star.size);
    }
    for (const b of s.bullets) {
      g.fillStyle(0x56f6ea, 0.15); g.fillRoundedRect(b.x - 7, b.y - 14, 14, 25, 6);
      g.fillStyle(0x9affef, 1); g.fillRoundedRect(b.x - 2, b.y - 11, 4, 16, 2);
    }
    for (const r of s.rocks) {
      g.fillStyle(r.target ? 0x392e64 : 0x273750); g.fillCircle(r.x, r.y, r.radius);
      g.lineStyle(2, r.target ? 0xff74b0 : 0x95a7c2, 0.9); g.strokeCircle(r.x, r.y, r.radius - 1);
      g.lineStyle(2, 0x637c9d, 0.7); g.strokeCircle(r.x - r.radius * 0.2, r.y, r.radius * 0.34);
    }
    for (const e of s.enemies) {
      g.fillStyle(0xff657f, 0.16); g.fillCircle(e.x, e.y, 26);
      g.fillStyle(0xf07891); g.fillTriangle(e.x, e.y + 20, e.x - 20, e.y - 12, e.x + 20, e.y - 12);
      g.fillStyle(0x5e284f); g.fillTriangle(e.x, e.y + 8, e.x - 8, e.y - 10, e.x + 8, e.y - 10);
      g.fillStyle(0xffd99b); g.fillCircle(e.x, e.y + 5, 4);
    }
    if (s.boss) {
      const b = s.boss;
      g.fillStyle(0xff5777, 0.12); g.fillEllipse(b.x, b.y, 155, 95);
      g.fillStyle(0x7d385f); g.fillTriangle(b.x - 70, b.y - 20, b.x, b.y + 37, b.x + 70, b.y - 20);
      g.fillStyle(0xd75d89); g.fillRoundedRect(b.x - 35, b.y - 30, 70, 60, 15);
      g.lineStyle(2, 0xffb3ba); g.strokeRoundedRect(b.x - 35, b.y - 30, 70, 60, 15);
      g.fillStyle(0xffe0a0); g.fillCircle(b.x, b.y + 5, 14);
      g.fillStyle(0x391e42); g.fillCircle(b.x, b.y + 5, 8);
      g.fillStyle(0x472a45); g.fillRoundedRect(75, 87, 240, 5, 2);
      g.fillStyle(0xff7c9e); g.fillRoundedRect(75, 87, 240 * Math.max(0, b.health / b.maxHealth), 5, 2);
    }
    for (const b of s.enemyBullets) {
      g.fillStyle(0xff7b76, 0.18); g.fillCircle(b.x, b.y, 10);
      g.fillStyle(0xffc089); g.fillCircle(b.x, b.y, 5); g.fillStyle(0xfff1d2); g.fillCircle(b.x, b.y, 2);
    }
    const ship = s.ship, roll = s.dodgeTime > 0;
    if (roll) {
      for (let i = 1; i <= 4; i++) { g.lineStyle(2, 0x86f7ef, 0.35 / i); g.strokeEllipse(ship.x - i * s.dodgeDirection * 12, ship.y, 36, 55); }
      g.lineStyle(2, 0x9cfff4, 0.8); g.strokeEllipse(ship.x, ship.y, 48, 57);
    }
    if (roll || s.invincible === 0 || Math.floor(s.time * 12) % 2 === 0) {
      const wing = roll ? 4 + Math.abs(Math.cos(s.dodgeTime / 0.6 * Math.PI * 2)) * 15 : 19;
      const flame = 13 + Math.sin(s.time * 28) * 5;
      g.fillStyle(0xffaa72, 0.45); g.fillTriangle(ship.x - 7, ship.y + 12, ship.x + 7, ship.y + 12, ship.x, ship.y + 23 + flame);
      g.fillStyle(0x48e8e0, 0.85); g.fillTriangle(ship.x - 4, ship.y + 12, ship.x + 4, ship.y + 12, ship.x, ship.y + 17 + flame);
      g.fillStyle(0x4dd2e2, 0.18); g.fillTriangle(ship.x, ship.y - 35, ship.x - wing - 10, ship.y + 26, ship.x + wing + 10, ship.y + 26);
      g.fillStyle(0xd7eaff); g.fillTriangle(ship.x, ship.y - 26, ship.x - wing, ship.y + 17, ship.x + wing, ship.y + 17);
      g.fillStyle(0x41c8dd); g.fillTriangle(ship.x, ship.y - 13, ship.x - wing / 2, ship.y + 12, ship.x + wing / 2, ship.y + 12);
      g.fillStyle(0x162b58); g.fillEllipse(ship.x, ship.y - 5, 9, 16); g.fillStyle(0x85fff2); g.fillCircle(ship.x, ship.y - 9, 3);
    }
    if (s.empEffect > 0) {
      const progress = 1 - s.empEffect / 0.75;
      g.lineStyle(7 * (1 - progress) + 1, 0x83fff1, 1 - progress); g.strokeCircle(s.empOrigin.x, s.empOrigin.y, progress * 900);
      g.lineStyle(2, 0xcafffa, (1 - progress) * 0.6); g.strokeCircle(s.empOrigin.x, s.empOrigin.y, progress * 800);
    }
    if (s.hitEffect > 0) { g.lineStyle(5, 0xff6d93, s.hitEffect * 2); g.strokeRoundedRect(3, 3, 384, 714, 12); }
  }
}
export function createGame(parent: HTMLElement, control: GameControl) {
  const scene = new SpaceScene(control);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: WORLD.width, height: WORLD.height, backgroundColor: '#080d22',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WORLD.width, height: WORLD.height },
    render: { antialias: true, pixelArt: false }, scene });
  return { game, scene };
}
