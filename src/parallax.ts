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
  private planet: Phaser.GameObjects.Image;
  private distantStars: Phaser.GameObjects.Image;
  private mist: Phaser.GameObjects.Graphics;
  private celestial: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.backgrounds = [0, 1, 2, 3].map(() =>
      scene.add.image(195, 0, "feony-scroll-0").setDepth(-5),
    );
    this.celestial = scene.add.graphics().setDepth(-4);
    this.planet=scene.add.image(300,80,"planet-0-0").setDepth(-4).setAlpha(0.48);
    this.distantStars=scene.add.image(195,340,"void-stars-0").setDepth(-4.5).setDisplaySize(700,700).setAlpha(0.14);
    this.debris = Array.from({ length: 10 }, (_, i) =>
      scene.add
        .image((i * 97 + 20) % 390, 0, "environment", `debris-${i % 6}`)
        .setDepth(-3)
        .setAlpha(0.08)
        .setDisplaySize(14 + (i % 3) * 6, 14 + (i % 3) * 6),
    );
    this.mist = scene.add.graphics().setDepth(-2);
  }
  update(s: GameSnapshot, reduced: boolean, stage = 0) {
    const theme = [
      [0, 0, 1, 1],
      [1, 1, 2, 2],
      [2, 2, 3, 3],
    ][stage][s.segment];
    const time = s.time,
      period = WORLD.height + 80;
    if (time < this.lastTime || time === 0) {
      this.lastSegment = 0;
      this.previousTheme = 0;
      this.currentColor = this.fromColor = COLORS[0];
      this.changedAt = 0;
    }
    if (theme !== this.lastSegment) {
      this.previousTheme = this.lastSegment;
      this.fromColor = this.currentColor;
      this.changedAt = time;
      this.lastSegment = theme;
    }
    this.lastTime = time;
    // Distant landmarks are purely decorative; dangerous rocks use a separate,
    // high-contrast sprite and collision model.
    const planet = this.celestial;
    planet.clear();
    const planetY = ((130 + time * 3) % (WORLD.height + 380)) - 120;
    const planetX = [308, 75, 320][stage];
    const radius = [88, 112, 76][stage];
    const palette = [0x3c6481, 0x705271, 0x8c573c][stage];
    this.planet.setTexture(`planet-${stage}-${Math.floor(time*3)%8}`).setPosition(planetX,planetY).setDisplaySize(radius*2,radius*2);
    this.distantStars.setTexture(`void-stars-${Math.floor(time*2)%8}`).setY(340+(time*3)%80).setAlpha(reduced?.12:.13+Math.sin(time*.7)*.025);
    planet.fillStyle(palette, 0.04);
    planet.fillCircle(planetX, planetY, radius);
    planet.lineStyle(2, 0xb9d6e7, 0.18);
    planet.strokeCircle(planetX, planetY, radius);
    planet.fillStyle(0x080e1c, 0.28);
    planet.fillCircle(planetX + radius * 0.28, planetY + radius * 0.14, radius * 0.82);
    if (stage === 1) {
      planet.lineStyle(8, 0xa69aa5, 0.13);
      planet.strokeEllipse(planetX, planetY, radius * 3.1, radius * 0.68);
      planet.lineStyle(2, 0xd1b9a1, 0.2);
      planet.strokeEllipse(planetX, planetY, radius * 2.8, radius * 0.52);
    }
    const blend = Math.min(1, Math.max(0, (time - this.changedAt) / 2));
    const a = Phaser.Display.Color.IntegerToColor(this.fromColor),
      b = Phaser.Display.Color.IntegerToColor(COLORS[theme]);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 1, blend);
    const tint = (this.currentColor = Phaser.Display.Color.GetColor(
      c.r,
      c.g,
      c.b,
    ));
    this.backgrounds.forEach((image, i) => {
      const height = period + 100;
      image.setTexture(`feony-scroll-${i < 2 ? this.previousTheme : theme}`);
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
