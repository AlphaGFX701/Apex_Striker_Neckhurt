import Phaser from 'phaser';
import { GameModel, WORLD } from './model';
import type { Axes } from './sensor';

export interface GameControl {
  axes: () => Axes;
  onHud: (score: number, lives: number, time: number, over: boolean) => void;
}

export class SpaceScene extends Phaser.Scene {
  readonly model = new GameModel();
  private control: GameControl;
  private art!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; size: number; speed: number }[] = [];
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private dragTarget: { x: number; y: number } | null = null;
  private running = false;
  private wasOver = false;

  constructor(control: GameControl) { super('Space'); this.control = control; }

  create() {
    this.art = this.add.graphics();
    for (let i = 0; i < 85; i++) this.stars.push({ x: Math.random() * WORLD.width, y: Math.random() * WORLD.height, size: Math.random() * 1.7 + 0.4, speed: 18 + Math.random() * 45 });
    const keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyLeft = keys.LEFT; this.keyRight = keys.RIGHT; this.keyUp = keys.UP; this.keyDown = keys.DOWN;
    this.keyA = keys.A; this.keyD = keys.D; this.keyW = keys.W; this.keyS = keys.S;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.setDrag(pointer));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) this.setDrag(pointer); });
    this.input.on('pointerup', () => { this.dragTarget = null; });
    window.addEventListener('pointerup', () => { this.dragTarget = null; });
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.removeAllKeys());
  }

  start() { this.model.reset(); this.wasOver = false; this.running = true; this.control.onHud(0, 3, 0, false); }
  pause() { this.running = false; }
  resume() { if (!this.model.state.gameOver) this.running = true; }
  setPractice(on: boolean) { this.model.practice = on; }
  get isRunning() { return this.running; }

  private setDrag(pointer: Phaser.Input.Pointer) {
    if (!this.running) return;
    this.dragTarget = { x: pointer.worldX, y: pointer.worldY - 30 };
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    if (this.running) {
      const axes = this.control.axes();
      if (this.keyLeft.isDown || this.keyA.isDown) axes.x = -1;
      if (this.keyRight.isDown || this.keyD.isDown) axes.x = 1;
      if (this.keyUp.isDown || this.keyW.isDown) axes.y = -1;
      if (this.keyDown.isDown || this.keyS.isDown) axes.y = 1;
      this.model.update(dt, axes, this.dragTarget);
      if (this.model.state.gameOver && !this.wasOver) { this.wasOver = true; this.running = false; }
      this.control.onHud(this.model.state.score, this.model.state.lives, this.model.state.time, this.model.state.gameOver);
    }
    this.draw(dt);
  }

  private draw(dt: number) {
    const g = this.art;
    g.clear();
    g.fillGradientStyle(0x080d22, 0x080d22, 0x141b3b, 0x141b3b, 1);
    g.fillRect(0, 0, WORLD.width, WORLD.height);
    g.lineStyle(1, 0x27375d, 0.32);
    for (let x = 0; x <= WORLD.width; x += 39) g.lineBetween(x, 0, x, WORLD.height);
    for (let y = 0; y <= WORLD.height; y += 45) g.lineBetween(0, y, WORLD.width, y);
    for (const star of this.stars) {
      if (this.running) star.y = (star.y + star.speed * dt) % WORLD.height;
      g.fillStyle(0xc2dcff, 0.25 + star.size / 3);
      g.fillCircle(star.x, star.y, star.size);
    }
    for (const bullet of this.model.state.bullets) {
      g.fillStyle(0x56f6ea, 0.18); g.fillRoundedRect(bullet.x - 7, bullet.y - 14, 14, 25, 6);
      g.fillStyle(0x9affef, 1); g.fillRoundedRect(bullet.x - 2, bullet.y - 11, 4, 16, 2);
    }
    for (const rock of this.model.state.rocks) {
      const { x, y, radius: r } = rock;
      g.fillStyle(rock.target ? 0x392e64 : 0x273750, 1);
      g.fillCircle(x, y, r);
      g.lineStyle(3, rock.target ? 0xff74b0 : 0x95a7c2, 0.95);
      g.strokeCircle(x, y, r - 1);
      g.lineStyle(2, rock.target ? 0xffa0c9 : 0x637c9d, 0.7);
      g.strokeCircle(x - r * 0.2, y + r * 0.05, r * 0.34);
      g.fillStyle(rock.target ? 0xff74b0 : 0xb7c5d7, 0.65);
      g.fillCircle(x + r * 0.38, y - r * 0.33, 2.4);
    }
    const ship = this.model.state.ship;
    if (this.model.state.invincible === 0 || Math.floor(this.model.state.time * 12) % 2 === 0) {
      const flame = 13 + Math.sin(this.model.state.time * 28) * 5;
      g.fillStyle(0xffaa72, 0.45); g.fillTriangle(ship.x - 8, ship.y + 12, ship.x + 8, ship.y + 12, ship.x, ship.y + 23 + flame);
      g.fillStyle(0x48e8e0, 0.85); g.fillTriangle(ship.x - 5, ship.y + 12, ship.x + 5, ship.y + 12, ship.x, ship.y + 17 + flame);
      g.fillStyle(0x4dd2e2, 0.22); g.fillTriangle(ship.x, ship.y - 35, ship.x - 30, ship.y + 26, ship.x + 30, ship.y + 26);
      g.fillStyle(0xd7eaff, 1); g.fillTriangle(ship.x, ship.y - 26, ship.x - 19, ship.y + 17, ship.x + 19, ship.y + 17);
      g.fillStyle(0x41c8dd, 1); g.fillTriangle(ship.x, ship.y - 13, ship.x - 9, ship.y + 12, ship.x + 9, ship.y + 12);
      g.fillStyle(0x162b58, 1); g.fillEllipse(ship.x, ship.y - 5, 11, 16);
      g.fillStyle(0x85fff2, 0.9); g.fillCircle(ship.x, ship.y - 9, 3);
    }
  }
}

export function createGame(parent: HTMLElement, control: GameControl) {
  const scene = new SpaceScene(control);
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: WORLD.width, height: WORLD.height,
    backgroundColor: '#080d22',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WORLD.width, height: WORLD.height },
    render: { antialias: true, pixelArt: false },
    scene,
  });
  return { game, scene };
}
