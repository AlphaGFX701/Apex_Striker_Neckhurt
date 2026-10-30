import Phaser from "phaser";
import { GameModel, WORLD, type GameSnapshot } from "./model";
import type { Axes } from "./sensor";
import type { Action } from "./motion";
export interface GameControl {
  reducedEffects?: () => boolean;
  manual?: () => boolean;
  onRelease?: () => void;
  onFire?: (weapon: "pulse" | "plasma" | "laser") => void;
  tick?: () => void;
  axes: (dt: number) => Axes;
  actions: () => Action[];
  onHud: (state: GameSnapshot) => void;
  onAction: (action: Action, accepted: boolean, reason: string) => void;
}
export class SpaceScene extends Phaser.Scene {
  readonly model = new GameModel();
  shipStyle = 0;
  private customShip = false;
  setShipCanvas(canvas: HTMLCanvasElement) {
    if (!this.textures) return;
    if (this.textures.exists("player-custom"))
      this.textures.remove("player-custom");
    this.textures.addCanvas("player-custom", canvas);
    this.customShip = true;
  }
  private sprites: Phaser.GameObjects.Image[] = [];
  private spriteIndex = 0;
  preload() {
    this.load.atlas("fleet", "/assets/atlas.png", "/assets/atlas.json");
    this.load.image("combat-space", "/assets/space-combat-background.webp");
    for (let i = 0; i < 3; i++)
      this.load.image(`boss-${i}`, `/assets/tactical/boss-${i}.png`);
    this.load.image("drone", "/assets/tactical/drone.png");
    for (let i = 0; i < 3; i++)
      this.load.image(`sector-${i}`, `/assets/tactical/sector-${i}.webp`);
  }
  private sprite(
    frame: string,
    x: number,
    y: number,
    width: number,
    rotation = 0,
    alpha = 1,
    scaleX = 1,
  ) {
    let image = this.sprites[this.spriteIndex++];
    if (!image) {
      image = this.add
        .image(
          x,
          y,
          frame.startsWith("boss-") || frame === "drone" ? frame : "fleet",
          frame.startsWith("boss-") || frame === "drone" ? undefined : frame,
        )
        .setDepth(1);
      this.sprites.push(image);
    }
    image
      .setTexture(
        frame.startsWith("boss-") || frame === "drone" ? frame : "fleet",
        frame.startsWith("boss-") || frame === "drone" ? undefined : frame,
      )
      .setPosition(x, y)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setVisible(true);
    image.setScale((width / image.width) * scaleX, width / image.width);
  }
  private background!: Phaser.GameObjects.Image;
  private art!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; size: number; speed: number }[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private movementPointer: number | null = null;
  private dragTarget: { x: number; y: number } | null = null;
  private running = false;
  private started = false;
  constructor(private control: GameControl) {
    super("Space");
  }
  create() {
    const background = (this.background = this.add
      .image(195, WORLD.height / 2, "sector-0")
      .setDepth(-1)
      .setTint(0x626b80));
    background.setScale(
      Math.max(390 / background.width, WORLD.height / background.height),
    );
    this.art = this.add.graphics().setDepth(3);
    for (let i = 0; i < 85; i++)
      this.stars.push({
        x: Math.random() * 390,
        y: Math.random() * 720,
        size: Math.random() * 1.6 + 0.4,
        speed: 18 + Math.random() * 45,
      });
    this.keys = this.input.keyboard!.addKeys(
      "LEFT,RIGHT,UP,DOWN,W,A,S,D,Q,E,SPACE",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.setDrag(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown && this.movementPointer === p.id) this.setDrag(p);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (this.movementPointer !== p.id) return;
      const active = this.dragTarget !== null;
      this.clearDrag();
      if (
        active &&
        p.wasTouch &&
        this.running &&
        this.control.manual?.() !== false
      )
        this.control.onRelease?.();
    };
    this.game.canvas.addEventListener("pointercancel", this.clearDrag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.game.canvas.removeEventListener("pointercancel", this.clearDrag),
    );
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.input.keyboard?.removeAllKeys(),
    );
  }
  private clearDrag = () => {
    this.dragTarget = null;
    this.movementPointer = null;
  };
  start() {
    this.model.reset();
    this.clearInput();
    this.started = true;
    this.running = true;
    this.control.onHud(this.model.state);
  }
  clearInput() {
    this.clearDrag();
    this.model.clearInput();
    this.input?.keyboard?.resetKeys();
  }
  pause() {
    this.running = false;
    this.clearInput();
  }
  resume() {
    this.clearInput();
    if (this.started && !this.model.state.gameOver) this.running = true;
  }
  setPractice(on: boolean) {
    this.model.practice = on;
  }
  get isRunning() {
    return this.running;
  }
  get hasStarted() {
    return this.started && !this.model.state.gameOver;
  }
  action(action: Action) {
    const result = this.running
      ? this.model.action(action)
      : { accepted: false, reason: "Start or resume a mission first." };
    this.control.onAction(action, result.accepted, result.reason);
    this.control.onHud(this.model.state);
  }
  private setDrag(p: Phaser.Input.Pointer) {
    if (
      this.running &&
      this.control.manual?.() !== false &&
      (this.movementPointer === null || this.movementPointer === p.id)
    ) {
      this.movementPointer = p.id;
      this.dragTarget = { x: p.worldX, y: p.worldY - 45 };
    }
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.control.tick?.();
    if (this.running) {
      const axes = this.control.axes(dt),
        k = this.keys;
      if (this.control.manual?.() !== false && (k.LEFT.isDown || k.A.isDown))
        axes.x = -1;
      if (this.control.manual?.() !== false && (k.RIGHT.isDown || k.D.isDown))
        axes.x = 1;
      if (this.control.manual?.() !== false && (k.UP.isDown || k.W.isDown))
        axes.y = -1;
      if (this.control.manual?.() !== false && (k.DOWN.isDown || k.S.isDown))
        axes.y = 1;
      const actions = this.control.actions();
      if (
        this.control.manual?.() !== false &&
        Phaser.Input.Keyboard.JustDown(k.Q)
      )
        actions.push("dodgeLeft");
      if (
        this.control.manual?.() !== false &&
        Phaser.Input.Keyboard.JustDown(k.E)
      )
        actions.push("dodgeRight");
      if (
        this.control.manual?.() !== false &&
        Phaser.Input.Keyboard.JustDown(k.SPACE)
      )
        actions.push("emp");
      for (const action of actions) this.action(action);
      const beforeFire = this.model.fireCount;
      this.model.update(
        dt,
        axes,
        this.control.manual?.() === false ? null : this.dragTarget,
      );
      if (this.model.fireCount !== beforeFire)
        this.control.onFire?.(
          this.model.config.equipment.main === "laser"
            ? "laser"
            : this.model.weapon === "spread"
              ? "plasma"
              : "pulse",
        );
      if (this.model.state.gameOver) {
        this.running = false;
        this.clearInput();
      }
      this.control.onHud(this.model.state);
    }
    this.draw(dt);
  }
  private draw(dt: number) {
    const g = this.art,
      s = this.model.state;
    this.background.setTexture(`sector-${this.model.config.stage}`);
    g.clear();
    this.spriteIndex = 0;

    for (const star of this.stars) {
      if (this.control.reducedEffects?.() && star.size < 1.2) continue;
      if (this.running) star.y = (star.y + star.speed * dt) % 720;
      g.fillStyle(0xc2dcff, 0.25 + star.size / 3);
      g.fillCircle(star.x, star.y, star.size);
    }
    for (const b of s.bullets) {
      g.fillStyle(
        b.missile ? 0xffcb7c : b.type === "plasma" ? 0xb5a2ff : 0x60d8ff,
        0.2,
      );
      g.fillEllipse(b.x, b.y, 12, b.missile ? 30 : 22);
      g.fillStyle(
        b.missile ? 0xffdd99 : b.type === "plasma" ? 0xe0baff : 0xe0faff,
      );
      g.fillRoundedRect(
        b.x - 2,
        b.y - 9,
        b.missile ? 5 : 3,
        b.missile ? 18 : 14,
        2,
      );
    }
    for (const r of s.rocks)
      this.sprite("rock", r.x, r.y, r.radius * 2.2, r.phase);
    for (const e of s.enemies)
      this.sprite(
        `enemy-${e.kind ?? Math.floor(e.phase) % 3}`,
        e.x,
        e.y,
        e.kind === 2 ? 80 : 65,
      );
    if (s.boss) {
      const b = s.boss;
      this.sprite(`boss-${this.model.config.stage}`, b.x, b.y, 155);
      g.fillStyle(0x303b48);
      g.fillRect(75, 87, 240, 5);
      g.fillStyle(0xef6655);
      g.fillRect(75, 87, 240 * Math.max(0, b.health / b.maxHealth), 5);
    }
    for (const b of s.enemyBullets) {
      g.fillStyle(0xff7b76, 0.18);
      g.fillCircle(b.x, b.y, 10);
      g.fillStyle(0xffc089);
      g.fillCircle(b.x, b.y, 5);
      g.fillStyle(0xfff1d2);
      g.fillCircle(b.x, b.y, 2);
    }
    for (const p of s.pickups) {
      if (!p.value) continue;
      g.lineStyle(1, 0xf0bc74);
      g.strokeCircle(p.x, p.y, 6);
      g.fillStyle(0xf0bc74);
      g.fillCircle(p.x, p.y, 2);
    }
    for (const e of s.explosions) {
      const progress = e.age / 0.5;
      this.sprite(
        `explosion-${Math.min(7, Math.floor(progress * 8))}`,
        e.x,
        e.y,
        35 + progress * 45,
        0,
        1 - progress,
      );
    }
    for (const beam of s.beams) {
      const firing = beam.age >= 1.2;
      g.lineStyle(
        firing ? 24 : 2,
        0xf16d65,
        firing ? 0.7 : 0.25 + Math.sin(beam.age * 24) * 0.2,
      );
      g.lineBetween(beam.x, 170, beam.x, WORLD.height);
      if (firing) {
        g.lineStyle(6, 0xfff4d0);
        g.lineBetween(beam.x, 170, beam.x, WORLD.height);
      }
    }
    const ship = s.ship,
      roll = s.dodgeTime > 0;
    if (roll) {
      for (let i = 1; i <= 4; i++) {
        g.lineStyle(2, 0x86f7ef, 0.35 / i);
        g.strokeEllipse(ship.x - i * s.dodgeDirection * 12, ship.y, 36, 55);
      }
      g.lineStyle(2, 0x9cfff4, 0.8);
      g.strokeEllipse(ship.x, ship.y, 48, 57);
    }
    if (roll || s.invincible === 0 || Math.floor(s.time * 12) % 2 === 0) {
      const squash = roll
        ? 0.25 + Math.abs(Math.cos(s.dodgeTime * 10)) * 0.75
        : 1;
      this.sprite(
        "thruster",
        ship.x - 10,
        ship.y + 49,
        25,
        0,
        0.8 + Math.sin(s.time * 35) * 0.15,
        0.4,
      );
      this.sprite(
        "thruster",
        ship.x + 10,
        ship.y + 49,
        25,
        0,
        0.8 + Math.cos(s.time * 35) * 0.15,
        0.4,
      );
      if (this.customShip) {
        let image = this.sprites[this.spriteIndex++];
        if (!image) {
          image = this.add.image(ship.x, ship.y, "player-custom").setDepth(1);
          this.sprites.push(image);
        }
        image
          .setTexture("player-custom")
          .setPosition(ship.x, ship.y)
          .setRotation(0)
          .setAlpha(1)
          .setVisible(true);
        image.setScale((110 / image.width) * squash, 110 / image.width);
      } else
        this.sprite(
          `player-${this.shipStyle}`,
          ship.x,
          ship.y,
          65,
          0,
          1,
          squash,
        );
    }
    if (s.laser > 0) {
      const l = this.model.config.levels.laser || 1;
      g.lineStyle(6 + (l - 1) * 4, 0x60d8ff, 0.35);
      g.lineBetween(ship.x, ship.y - 25, ship.x, 0);
      g.lineStyle(2 + l, 0xeaffff, 0.9);
      g.lineBetween(ship.x, ship.y - 25, ship.x, 0);
    }
    if (this.model.config.equipment.wingman) {
      const l = this.model.config.levels.drone || 1;
      this.sprite("drone", ship.x - 44, ship.y + 8, 24);
      if (l > 1) this.sprite("drone", ship.x + 44, ship.y + 8, 24);
    }
    g.lineStyle(1, 0xffffff, 0.95);
    g.strokeCircle(ship.x, ship.y, ship.radius);
    g.fillStyle(0x60d8ff);
    g.fillCircle(ship.x, ship.y, 2);
    if (s.shield) {
      g.lineStyle(1, 0x60d8ff, 0.65);
      g.strokeEllipse(ship.x, ship.y, 64, 80);
    }
    if (s.invincible > 0) this.sprite("shield", ship.x, ship.y, 68, 0, 0.4);
    if (s.hitEffect > 0)
      this.sprite(
        `explosion-${Math.min(7, Math.floor(((0.3 - s.hitEffect) / 0.3) * 8))}`,
        ship.x,
        ship.y,
        90,
      );

    if (s.empEffect > 0) {
      const progress = 1 - s.empEffect / 0.75;
      g.lineStyle(7 * (1 - progress) + 1, 0x83fff1, 1 - progress);
      g.strokeCircle(s.empOrigin.x, s.empOrigin.y, progress * 900);
      g.lineStyle(2, 0xcafffa, (1 - progress) * 0.6);
      g.strokeCircle(s.empOrigin.x, s.empOrigin.y, progress * 800);
    }
    for (let i = this.spriteIndex; i < this.sprites.length; i++)
      this.sprites[i].setVisible(false);
    if (s.hitEffect > 0) {
      g.lineStyle(5, 0xff6d93, s.hitEffect * 2);
      g.strokeRoundedRect(3, 3, 384, 714, 12);
    }
  }
}
export function createGame(parent: HTMLElement, control: GameControl) {
  const scene = new SpaceScene(control);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: "#080d22",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WORLD.width,
      height: WORLD.height,
    },
    render: { antialias: true, pixelArt: false },
    scene,
  });
  return { game, scene };
}
