import Phaser from "phaser";
import { WORLD, type GameSnapshot } from "./model";
export const PARALLAX_SPEEDS = [10, 20, 30] as const;
const COLORS = [0x7089bf, 0x9766a3, 0xb39b6b, 0xb75c6c];
/** All offsets derive from simulation time. Pausing/resetting cannot leave a tween running. */
export class ParallaxEnvironment {
  private backgrounds: Phaser.GameObjects.Image[];
  private debris: Phaser.GameObjects.Image[];
  private lastTime = 0;
  private lastSegment = 0;
  private previousTheme = 0;
  private changedAt = 0;
  private fromColor = COLORS[0];
  private currentColor = COLORS[0];
  private mist: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.backgrounds = [0, 1, 2, 3].map(() =>
      scene.add.image(195, 0, "feony-scroll-0").setDepth(-5),
    );
    this.debris = Array.from({ length: 10 }, (_, i) =>
      scene.add
        .image((i * 97 + 20) % 390, 0, "environment", `debris-${i % 6}`)
        .setDepth(-3)
        .setAlpha(0.18)
        .setDisplaySize(26 + (i % 3) * 12, 26 + (i % 3) * 12),
    );
    this.mist = scene.add.graphics().setDepth(-2);
  }
  update(s: GameSnapshot, reduced: boolean) {
    const time = s.time,
      period = WORLD.height + 80;
    if (time < this.lastTime || time === 0) {
      this.lastSegment = 0;
      this.previousTheme = 0;
      this.currentColor = this.fromColor = COLORS[0];
      this.changedAt = 0;
    }
    if (s.segment !== this.lastSegment) {
      this.previousTheme = this.lastSegment;
      this.fromColor = this.currentColor;
      this.changedAt = time;
      this.lastSegment = s.segment;
    }
    this.lastTime = time;
    const blend = Math.min(1, Math.max(0, (time - this.changedAt) / 2));
    const a = Phaser.Display.Color.IntegerToColor(this.fromColor),
      b = Phaser.Display.Color.IntegerToColor(COLORS[s.segment]);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 1, blend);
    const tint = (this.currentColor = Phaser.Display.Color.GetColor(
      c.r,
      c.g,
      c.b,
    ));
    this.backgrounds.forEach((image, i) => {
      const height = period + 100;
      image.setTexture(
        `feony-scroll-${i < 2 ? this.previousTheme : s.segment}`,
      );
      image.setScale(Math.max(390 / image.width, height / image.height));
      image.setPosition(
        195,
        ((time * PARALLAX_SPEEDS[0]) % period) +
          (i % 2) * period -
          period +
          height / 2,
      );
      image
        .setAlpha(0.37 * (i < 2 ? 1 - blend : blend))
        .setVisible(i < 2 ? blend < 1 : blend > 0);
    });
    this.debris.forEach((image, i) =>
      image
        .setVisible(!reduced || i < 3)
        .setY(
          ((i * 83 + time * PARALLAX_SPEEDS[1]) % (WORLD.height + 100)) - 50,
        )
        .setRotation(i + time * 0.03),
    );
    this.mist.clear();
    this.mist.fillStyle(tint, 0.04);
    this.mist.fillRect(0, 0, WORLD.width, WORLD.height);
    if (!reduced)
      for (let i = 0; i < 4; i++) {
        this.mist.fillStyle(tint, 0.018);
        this.mist.fillEllipse(
          70 + (i % 2) * 250,
          ((i * 220 + time * PARALLAX_SPEEDS[2]) % 900) - 100,
          340,
          170,
        );
      }
  }
}
