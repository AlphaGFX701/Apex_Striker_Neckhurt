import { ParallaxEnvironment } from "./parallax";
import { BOSS_ART, ONSLAUGHT_IMAGES } from "./onslaught-assets";
import { EVOLUTION_IMAGES } from "./evolution-assets";
import { PIXEL_FLEET_IMAGES, pixelShip, normalizeShipId } from "./pixel-fleet";
import Phaser from "phaser";
import { GameModel, WORLD, dronePosition, type GameSnapshot } from "./model";
import type { Axes } from "./sensor";
import type { Action } from "./motion";
const LIMIT_EFFECTS = 48;
export interface GameControl {
  onLoadProgress?: (progress: number) => void;
  onReady?: () => void;
  onLoadError?: () => void;
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
  private pixelShipId: 0 | 1 | 2 = 0;
  private muzzleRemaining = 0;
  setPixelShip(id: number) {
    this.pixelShipId = normalizeShipId(id);
  }
  setShipCanvas(canvas: HTMLCanvasElement, level: 1 | 2 | 3 = 1) {
    if (!this.textures) return;
    const key = `player-custom-${level}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.customShip = true;
  }
  private sprites: Phaser.GameObjects.Image[] = [];
  private spriteIndex = 0;
  private wasHit = false;
  private endAge = 0;
  private lastBossBurst = -10;
  preload() {
    this.load.on("loaderror", () => this.control.onLoadError?.());
    this.load.on("progress", (value: number) =>
      this.control.onLoadProgress?.(value),
    );
    for (const key of EVOLUTION_IMAGES)
      this.load.image(key, `/assets/evolution/${key}.png`);
    for (const image of PIXEL_FLEET_IMAGES)
      this.load.image(image.key, image.url);
    this.load.atlas(
      "environment",
      "/assets/environment/environment.png",
      "/assets/environment/environment.json",
    );
    for (let i = 0; i < 4; i++)
      this.load.image(
        `feony-scroll-${i}`,
        `/assets/environment/feony-scroll-${i}.webp`,
      );
    this.load.atlas("fleet", "/assets/atlas.png", "/assets/atlas.json");
    for (const key of ONSLAUGHT_IMAGES)
      this.load.image(key, `/assets/onslaught/${key}.png`);
    this.load.image("drone", "/assets/tactical/drone.png");
  }
  private imagePools = new Map<
    string,
    { images: Phaser.GameObjects.Image[]; used: number }
  >();
  private sprite(
    frame: string,
    x: number,
    y: number,
    width: number,
    rotation = 0,
    alpha = 1,
    scaleX = 1,
  ) {
    const standalone = this.textures.exists(frame);
    const environment = /^(void-|meteor-|laser-|power-item-|spark-)/.test(
      frame,
    );
    const texture = standalone ? frame : environment ? "environment" : "fleet";
    let pool = this.imagePools.get(texture);
    if (!pool) {
      pool = { images: [], used: 0 };
      this.imagePools.set(texture, pool);
    }
    let image = pool.images[pool.used++];
    if (!image) {
      image = this.add
        .image(x, y, texture, standalone ? undefined : frame)
        .setDepth(1);
      pool.images.push(image);
      this.sprites.push(image);
    }
    image
      .setTexture(texture, standalone ? "__BASE" : frame)
      .setPosition(x, y)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setVisible(true)
      .clearTint()
      .setDepth(/-hit$|^shield-|^spark-|^drone-burst-/.test(frame) ? 2 : 1);
    image.setScale((width / image.width) * scaleX, width / image.width);
    return image;
  }
  private environment!: ParallaxEnvironment;
  private lastMiniBurst = 0;
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
    for (const { key } of PIXEL_FLEET_IMAGES)
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get("environment").setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of ONSLAUGHT_IMAGES)
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of EVOLUTION_IMAGES)
      if (/^(evo-(pulse|plasma|red|missile|beam|spark)|wingman)/.test(key))
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.control.onReady?.();
    this.environment = new ParallaxEnvironment(this);
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
      false,
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
    this.endAge = 0;
    this.muzzleRemaining = 0;
    this.lastBossBurst = -10;
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
      if (this.model.fireCount !== beforeFire) {
        this.muzzleRemaining = 0.075;
        this.control.onFire?.(
          this.model.config.equipment.main === "laser"
            ? "laser"
            : this.model.weapon === "spread"
              ? "plasma"
              : "pulse",
        );
      }
      if (this.model.state.gameOver) {
        this.running = false;
        this.clearInput();
      }
      this.control.onHud(this.model.state);
    }
    this.draw(dt);
  }
  private draw(_dt: number) {
    const g = this.art,
      s = this.model.state,
      stage = this.model.config.stage,
      reduced = !!this.control.reducedEffects?.();
    if (s.gameOver) this.endAge += _dt;
    this.environment.update(s, reduced, stage);
    g.clear();
    for (const image of this.sprites) image.setVisible(false);
    for (const pool of this.imagePools.values()) pool.used = 0;
    for (const [index, star] of this.stars.entries()) {
      if (reduced && star.size < 1.2) continue;
      star.y = (index * 83 + s.time * 10) % WORLD.height;
      g.fillStyle(0xc2dcff, 0.2 + star.size / 4);
      g.fillCircle(star.x, star.y, star.size);
    }
    for (const b of s.bullets) {
      this.sprite(
        b.interceptor
          ? "evo-red"
          : b.missile
            ? "evo-missile"
            : b.type === "plasma"
              ? "evo-plasma"
              : "evo-pulse",
        b.x,
        b.y,
        b.missile ? 14 : 9,
        Math.atan2(b.vx ?? 0, b.speed),
        0.9,
      );
      g.fillStyle(
        b.interceptor
          ? 0xff3657
          : b.missile
            ? 0xffcb7c
            : b.type === "plasma"
              ? 0xc8aaff
              : 0x8cecff,
        0.3,
      );
      g.fillEllipse(b.x, b.y, 9, 22);
      g.fillStyle(b.interceptor ? 0xffc4cc : b.missile ? 0xffe6b3 : 0xeaffff);
      g.fillRoundedRect(b.x - 1.5, b.y - 8, 3, b.missile ? 17 : 12, 1);
    }
    for (const r of s.rocks) {
      this.sprite(
        `evo-meteor-${Math.floor(r.radius) % 4}`,
        r.x,
        r.y,
        r.radius * 3.1,
        r.phase,
      );
    }
    for (const e of s.enemies) {
      const key = `enemy-${e.faction ?? stage}-${e.kind ?? 0}`,
        width = e.kind === 2 ? 72 : 58;
      this.sprite(key, e.x, e.y, width);
      this.sprite(
        `${key}-engine-${Math.floor(s.time * 12) % 8}`,
        e.x,
        e.y,
        width,
      );
      if (e.flash)
        this.sprite(
          `${key}-hit`,
          e.x,
          e.y,
          width,
          0,
          Math.min(0.8, e.flash / 0.07),
        );
      if (e.stun) {
        g.lineStyle(1, 0x7afff0, 0.7);
        g.strokeCircle(e.x, e.y, e.radius + 5);
      }
      if (e.leader) {
        g.fillStyle(0xffc76a);
        g.fillTriangle(e.x - 5, e.y - 30, e.x + 5, e.y - 30, e.x, e.y - 36);
      }
    }
    if (s.miniBoss) {
      const m = s.miniBoss;
      this.sprite(`void-2-${stage}`, m.x, m.y, 112);
      this.sprite(
        `void-2-${stage}-engine-${Math.floor(s.time * 12) % 8}`,
        m.x,
        m.y,
        112,
      );
      if (m.flash) {
        g.lineStyle(3, 0xffe8c5, 0.8);
        g.strokeCircle(m.x, m.y, m.radius);
      }
    }
    if (s.boss) {
      const b = s.boss,
        art = BOSS_ART[stage];
      this.sprite(art.key, b.x, b.y, art.width);
      this.sprite(
        `${art.key}-engine-${Math.floor(s.time * 12) % 8}`,
        b.x,
        b.y,
        art.width,
      );
      if (b.flash && Math.floor(s.time * 15) % 4 === 0)
        this.sprite(
          `${art.key}-hit`,
          b.x,
          b.y,
          art.width,
          0,
          Math.min(0.45, (b.flash / 0.07) * 0.45),
        );
      for (const t of b.turrets ?? []) {
        if (t.health <= 0) {
          g.fillStyle(0x130e16, 0.85);
          g.fillCircle(b.x + t.x, b.y + t.y, 8);
          continue;
        }
        this.sprite(`turret-${stage}`, b.x + t.x, b.y + t.y, 20 + stage * 3);
        if (t.flash)
          this.sprite(
            `turret-${stage}-hit`,
            b.x + t.x,
            b.y + t.y,
            20 + stage * 3,
            0,
            0.9,
          );
        g.fillStyle(0x351b28);
        g.fillRect(b.x + t.x - 10, b.y + t.y - 23, 20, 2);
        g.fillStyle(0xffa779);
        g.fillRect(
          b.x + t.x - 10,
          b.y + t.y - 23,
          (20 * t.health) / t.maxHealth,
          2,
        );
      }
    }
    for (const b of s.enemyBullets) {
      g.fillStyle(0xff855a, 0.18);
      g.fillCircle(b.x, b.y, 8);
      g.fillStyle(0xffb56f);
      g.fillCircle(b.x, b.y, b.radius + 0.5);
      g.fillStyle(0xfff5d9);
      g.fillCircle(b.x, b.y, 1.8);
    }
    for (const p of s.pickups)
      if (p.kind) {
        this.sprite(
          `pickup-${p.kind}`,
          p.x,
          p.y,
          34,
          0,
          0.92 + Math.sin(s.time * 5 + p.x) * 0.08,
        );
      }
    let particles = 0,
      debrisCount = 0;
    for (const e of s.explosions) {
      if (reduced && e.spark) continue;
      if (particles++ > LIMIT_EFFECTS) break;
      const age = e.age + this.endAge;
      if (age < 0) continue;
      const progress = age / (e.spark ? 0.24 : 0.65);
      if (progress >= 1) continue;
      const frame = e.spark
        ? `evo-spark-${Math.min(3, Math.floor(progress * 4))}`
        : e.art?.startsWith("enemy-")
          ? `${e.art}-destroy-${Math.min(7, Math.floor(progress * 8))}`
          : e.art
            ? `${e.art}-destroy-${Math.min(11, Math.floor(progress * 12))}`
            : `explosion-${Math.min(7, Math.floor(progress * 8))}`;
      this.sprite(
        frame,
        e.x,
        e.y,
        (e.size ?? 65) * (e.spark ? 1 : 0.7 + progress * 0.5),
        0,
        1 - progress * 0.5,
      );
      if (!reduced && !e.spark)
        for (let j = 0; j < 4 && debrisCount < 80; j++, debrisCount++) {
          const a = j * 2.4 + e.x * 0.1;
          g.fillStyle(j % 2 ? 0xffb75f : 0xffead2, 1 - progress);
          g.fillCircle(
            e.x + Math.cos(a) * age * 110,
            e.y + Math.sin(a) * age * 110 + age * age * 60,
            2 * (1 - progress) + 0.5,
          );
        }
    }
    if (s.storm) {
      const h = s.storm;
      g.fillStyle(0xb18cff, h.age >= 1.2 ? 0.08 : 0.025);
      g.fillRect(h.x, 100, h.width, WORLD.height - 100);
      // Only actual hazard bounds; no forecast lanes or diagonal decorative lines.
      g.lineStyle(1, 0xbda1ff, 0.28);
      g.strokeRect(h.x, 100, h.width, WORLD.height - 100);
    }
    for (const beam of s.beams) {
      const firing = beam.age >= 1.2,
        alpha = 0.35 + Math.sin(beam.age * 24) * 0.15;
      if (!firing) {
        g.fillStyle(0xf16d65, 0.08);
        g.fillRect(beam.x - 22, 170, 44, WORLD.height - 170);
        g.lineStyle(2, 0xff9b69, alpha + 0.3);
        g.strokeCircle(beam.x, Math.min(630, beam.y ?? s.ship.y), 24);
        g.lineBetween(
          beam.x - 32,
          beam.y ?? s.ship.y,
          beam.x - 15,
          beam.y ?? s.ship.y,
        );
        g.lineBetween(
          beam.x + 15,
          beam.y ?? s.ship.y,
          beam.x + 32,
          beam.y ?? s.ship.y,
        );
      } else {
        g.fillStyle(0xff3429, 0.16);
        g.fillRect(beam.x - 34, 170, 68, WORLD.height - 170);
        g.fillStyle(0xff5b45, 0.65);
        g.fillRect(beam.x - 22, 170, 44, WORLD.height - 170);
        g.fillStyle(0xffd68c, 0.9);
        g.fillRect(beam.x - 12, 170, 24, WORLD.height - 170);
        g.fillStyle(0xffffe9);
        g.fillRect(beam.x - 4, 170, 8, WORLD.height - 170);
        this.sprite(`spark-${Math.floor(s.time * 20) % 6}`, beam.x, 181, 55);
      }
    }
    const ship = s.ship,
      warp = s.dodgeTime > 0,
      definition = pixelShip(this.pixelShipId),
      frame = definition.levels[s.evolution.level],
      unfolding = s.evolution.transformRemaining > 0,
      unfoldProgress = 1 - s.evolution.transformRemaining / 0.45,
      shipKey = unfolding
        ? frame.unfoldFrames[Math.min(3, Math.floor(unfoldProgress * 4))].key
        : Math.abs(s.velocity.x) > 60 && !reduced
          ? (s.velocity.x < 0 ? frame.bankFrames.left : frame.bankFrames.right).key
          : frame.key,
      shipWidth = definition.displayWidth,
      lean = reduced
        ? 0
        : (Phaser.Math.Clamp(s.velocity.x / 310, -1, 1) * Math.PI) / 15;
    if (this.running) this.muzzleRemaining = Math.max(0, this.muzzleRemaining - _dt);
    if (warp) {
      const alpha = s.dodgeTime / 0.6;
      this.sprite(
        shipKey,
        s.warpOrigin.x,
        s.warpOrigin.y,
        shipWidth,
        0,
        alpha * 0.3,
      );
      g.lineStyle(3, 0x92faff, alpha * 0.5);
      g.lineBetween(s.warpOrigin.x, s.warpOrigin.y, ship.x, ship.y);
      for (let i = 1; i <= 3; i++)
        this.sprite(
          shipKey,
          ship.x - i * s.dodgeDirection * 15,
          ship.y,
          shipWidth,
          0,
          (alpha * 0.15) / i,
        );
    }
    if (warp || s.invincible === 0 || Math.floor(s.time * 14) % 2 === 0) {
      this.sprite(
        frame.engineFrames[Math.floor(s.time * 16) % frame.engineFrames.length].key,
        ship.x,
        ship.y,
        shipWidth,
        lean,
        reduced ? 0.75 : 0.85 + Math.min(0.15, Math.abs(s.velocity.y) / 2000),
      ).setDepth(0.9);
      this.sprite(shipKey, ship.x, ship.y, shipWidth, lean);
      if (this.muzzleRemaining > 0 || s.laser > 0)
        this.sprite(
          frame.muzzleFrames[Math.min(2, Math.floor((1 - this.muzzleRemaining / 0.075) * 3))].key,
          ship.x,
          ship.y,
          shipWidth,
          lean,
          reduced ? 0.55 : 0.95,
        ).setDepth(2);
    }
    if (s.evolution.transformRemaining > 0) {
      const p = 1 - s.evolution.transformRemaining / 0.45;
      g.lineStyle(2, 0x86f4ff, (1 - p) * 0.8);
      g.strokeEllipse(ship.x, ship.y, 70 + p * 70, 95 + p * 55);
    }
    if (s.laser > 0) {
      const width = 7 + s.powers.weapon * 4,
        red = s.powers.overdrive > 0,
        beamColor = red ? 0xff3657 : 0x60d8ff;
      this.sprite(
        red ? "evo-red" : "evo-beam-core",
        ship.x,
        (ship.y - 25) / 2,
        width,
        0,
        0.75,
      ).setDisplaySize(width, ship.y - 25);
      g.lineStyle(width + 8, beamColor, 0.18);
      g.lineBetween(ship.x, ship.y - 25, ship.x, 0);
      g.lineStyle(width, beamColor, 0.55);
      g.lineBetween(ship.x, ship.y - 25, ship.x, 0);
      g.lineStyle(2 + s.powers.weapon, red ? 0xffe8ed : 0xebffff, 0.95);
      g.lineBetween(ship.x, ship.y - 25, ship.x, 0);
      for (let i = 1; i <= s.powers.weapon; i++)
        for (const side of [-1, 1]) {
          g.lineStyle(2, red ? 0xffa6b8 : 0xa3efff, 0.7);
          g.lineBetween(
            ship.x + side * i * 14,
            ship.y - 25,
            ship.x + side * i * 14,
            0,
          );
        }
    }
    for (const drone of s.drones) {
      const p = dronePosition(ship, drone);
      this.sprite(
        `wingman-${s.wingmen.level || 1}`,
        p.x,
        p.y,
        27 + s.wingmen.level * 3,
        lean * 0.3,
      );
      this.sprite(
        `wingman-thruster-${Math.floor(s.time * 16) % 4}`,
        p.x,
        p.y + 20,
        13,
      );
      g.fillStyle(0x81eaff, 0.8);
      g.fillEllipse(p.x, p.y + 13, 4, 9);
    }
    for (const hit of s.interceptions) {
      const t = Math.min(1, hit.age / 0.12),
        x = Phaser.Math.Linear(hit.fromX, hit.x, t),
        y = Phaser.Math.Linear(hit.fromY, hit.y, t);
      if (t < 1) {
        this.sprite("drone", x, y, 25);
        g.lineStyle(2, 0xc4b1ff, 0.65);
        g.lineBetween(hit.fromX, hit.fromY, x, y);
      } else
        this.sprite(
          `drone-burst-${Math.min(7, Math.floor(((hit.age - 0.12) / 0.53) * 8))}`,
          hit.x,
          hit.y,
          82,
        );
    }
    if (s.shield)
      this.sprite(`shield-${Math.floor(s.time * 12) % 8}`, ship.x, ship.y, 106);

    if (s.hitEffect > 0 && s.damageKind === "shield")
      this.sprite(
        `shield-${Math.floor(s.time * 20) % 8}`,
        ship.x,
        ship.y,
        110,
        0,
        s.hitEffect / 0.3,
      );
    g.lineStyle(1, 0xffffff, 0.95);
    g.strokeCircle(ship.x, ship.y, ship.radius);
    g.fillStyle(0x8dfbff);
    g.fillCircle(ship.x, ship.y, 2);
    if (s.empEffect > 0) {
      const p = 1 - s.empEffect / 0.75;
      g.lineStyle(7 * (1 - p) + 1, 0x83fff1, 1 - p);
      g.strokeCircle(s.empOrigin.x, s.empOrigin.y, Math.min(180, p * 270));
      g.lineStyle(2, 0xcafffa, (1 - p) * 0.6);
      g.strokeCircle(s.empOrigin.x, s.empOrigin.y, Math.min(180, p * 240));
    }
    const burst = s.explosions.find(
      (e) => e.art?.startsWith("void-2-") && e.age < 0.08,
    );
    if (burst && s.time - this.lastMiniBurst > 0.5) {
      this.lastMiniBurst = s.time;
      if (!reduced) {
        this.cameras.main.shake(180, 0.008);
        this.cameras.main.flash(80, 150, 200, 255);
      }
    }

    if (s.hitEffect > 0 && s.damageKind === "hull" && !this.wasHit && !reduced)
      this.cameras.main.shake(100, 0.004);
    if (
      s.explosions.some((e) => e.size === 210 && e.age < 0.06) &&
      s.time - this.lastBossBurst > 1
    ) {
      this.lastBossBurst = s.time;
      if (!reduced) {
        this.cameras.main.shake(250, 0.008);
        this.cameras.main.flash(80, 175, 220, 255);
      }
    }
    this.wasHit = s.hitEffect > 0;
  }
}
export function createGame(parent: HTMLElement, control: GameControl) {
  const scene = new SpaceScene(control);
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
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
