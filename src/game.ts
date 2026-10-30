import Phaser from 'phaser';
import { GameModel, WORLD, type GameSnapshot } from './model';
import type { Axes } from './sensor';
import type { Action } from './motion';
export interface GameControl {
  manual?: () => boolean;
  tick?: () => void;
  axes: (dt: number) => Axes; actions: () => Action[];
  onHud: (state: GameSnapshot) => void;
  onAction: (action: Action, accepted: boolean, reason: string) => void;
}
export class SpaceScene extends Phaser.Scene {
  readonly model = new GameModel();
  shipStyle = 0;
  private sprites: Phaser.GameObjects.Image[] = [];
  private spriteIndex = 0;
  preload() { this.load.atlas('fleet', '/assets/atlas.png', '/assets/atlas.json'); }
  private sprite(frame: string, x: number, y: number, width: number, rotation = 0, alpha = 1, scaleX = 1) {
    let image = this.sprites[this.spriteIndex++];
    if (!image) { image = this.add.image(x, y, 'fleet', frame).setDepth(1); this.sprites.push(image); }
    image.setTexture('fleet', frame).setPosition(x,y).setRotation(rotation).setAlpha(alpha).setVisible(true);
    image.setScale(width / image.width * scaleX, width / image.width);
  }
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
  clearInput() { this.dragTarget = null; this.model.clearInput(); this.input?.keyboard?.resetKeys(); }
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
    this.control.tick?.();
    if (this.running) {
      const axes = this.control.axes(dt), k = this.keys;
      if (this.control.manual?.() !== false && (k.LEFT.isDown || k.A.isDown)) axes.x = -1;
      if (this.control.manual?.() !== false && (k.RIGHT.isDown || k.D.isDown)) axes.x = 1;
      if (this.control.manual?.() !== false && (k.UP.isDown || k.W.isDown)) axes.y = -1;
      if (this.control.manual?.() !== false && (k.DOWN.isDown || k.S.isDown)) axes.y = 1;
      const actions = this.control.actions();
      if (this.control.manual?.() !== false && Phaser.Input.Keyboard.JustDown(k.Q)) actions.push('dodgeLeft');
      if (this.control.manual?.() !== false && Phaser.Input.Keyboard.JustDown(k.E)) actions.push('dodgeRight');
      if (this.control.manual?.() !== false && Phaser.Input.Keyboard.JustDown(k.SPACE)) actions.push('emp');
      for (const action of actions) this.action(action);
      this.model.update(dt, axes, this.control.manual?.() === false ? null : this.dragTarget);
      if (this.model.state.gameOver) { this.running = false; this.clearInput(); }
      this.control.onHud(this.model.state);
    }
    this.draw(dt);
  }
  private draw(dt: number) {
    const g = this.art, s = this.model.state; g.clear(); this.spriteIndex = 0;
    g.fillGradientStyle(0x080d22, 0x080d22, 0x172343, 0x172343, 1); g.fillRect(0, 0, 390, 720);
    g.fillStyle(0x2a4676, 0.09); g.fillEllipse(50, 220, 300, 500); g.fillStyle(0x73356b, 0.06); g.fillEllipse(370, 470, 300, 500);
    g.fillStyle(0x182a39, .5); g.fillCircle(330, 180, 83);
    g.lineStyle(2, 0x56cfff, .12); g.strokeCircle(330, 180, 87);
    for (const star of this.stars) {
      if (this.running) star.y = (star.y + star.speed * dt) % 720;
      g.fillStyle(0xc2dcff, 0.25 + star.size / 3); g.fillCircle(star.x, star.y, star.size);
    }
    for (const b of s.bullets) this.sprite('bullet', b.x, b.y, 9);
    for (const r of s.rocks) this.sprite('rock', r.x, r.y, r.radius * 2.2, r.phase);
    for (const e of s.enemies) this.sprite(`enemy-${Math.floor(e.phase) % 3}`, e.x, e.y, 65);
    if (s.boss) {
      const b = s.boss; this.sprite('boss', b.x, b.y, 185);
      g.fillStyle(0x303b48); g.fillRect(75, 87, 240, 5);
      g.fillStyle(0xef6655); g.fillRect(75, 87, 240 * Math.max(0,b.health/b.maxHealth), 5);
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
      const squash = roll ? .25 + Math.abs(Math.cos(s.dodgeTime * 10)) * .75 : 1;
      this.sprite('thruster', ship.x - 7, ship.y + 30, 12, 0, .8 + Math.sin(s.time*35)*.15);
      this.sprite('thruster', ship.x + 7, ship.y + 30, 12, 0, .8 + Math.cos(s.time*35)*.15);
      this.sprite(`player-${this.shipStyle}`, ship.x, ship.y, 65, 0, 1, squash);
    }
    if (s.invincible > 0) this.sprite('shield', ship.x, ship.y, 68, 0, .4);
    if (s.hitEffect > 0) this.sprite(`explosion-${Math.min(7, Math.floor((.3-s.hitEffect)/.3*8))}`,ship.x,ship.y,90);
    for (let i=this.spriteIndex; i<this.sprites.length; i++) this.sprites[i].setVisible(false);

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


