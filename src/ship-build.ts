export type PartIndex = 0 | 1 | 2;
export type ShipSlot = "hull" | "wing" | "engine";
export type Weapon = "straight" | "spread";
export interface ShipBuild {
  hull: PartIndex;
  wing: PartIndex;
  engine: PartIndex;
  color: PartIndex;
  weapon: Weapon;
}
export const BUILD_KEY = "gyro-loadout-v5";
export const LEGACY_KEY = "gyro-loadout-v4";
export const PIXEL_BUILD_KEY = "gyro-pixel-loadout-v1";
export const DEFAULT_BUILD: Readonly<ShipBuild> = Object.freeze({
  hull: 0,
  wing: 0,
  engine: 0,
  color: 0,
  weapon: "straight",
});
export const SHIP_ACCENTS = ["#56CFFF", "#E6EDF3", "#FFC76A"] as const;
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export interface BuildLoadout {
  [key: string]: unknown;
  version: 5;
  build: ShipBuild;
}
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const part = (value: unknown, fallback: PartIndex = 0): PartIndex =>
  value === 0 || value === 1 || value === 2 ? value : fallback;
export function normalizeBuild(value: unknown): ShipBuild {
  const b = object(value);
  return {
    hull: part(b.hull),
    wing: part(b.wing),
    engine: part(b.engine),
    color: part(b.color),
    weapon: b.weapon === "spread" ? "spread" : "straight",
  };
}
/** Keeps unrelated preferences and migrates the old complete-ship selection into three fixed slots. */
export function migrateLoadout(value: unknown): BuildLoadout {
  const old = object(value),
    index = part(old.ship);
  const build =
    old.version === 5 && old.build
      ? normalizeBuild(old.build)
      : {
          hull: index,
          wing: index,
          engine: index,
          color: 0 as PartIndex,
          weapon:
            old.weapon === "spread"
              ? ("spread" as const)
              : ("straight" as const),
        };
  return { ...old, version: 5, build, weapon: build.weapon };
}
const readJSON = (store: StorageLike | undefined, key: string): unknown => {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const browserStorage = (): StorageLike | undefined => {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
};
export class ShipBuildStore {
  private persisted: ShipBuild;
  private editing: ShipBuild;
  private envelope: BuildLoadout;
  private storage: StorageLike | undefined;
  constructor(storage: StorageLike | undefined = browserStorage()) {
    this.storage = storage;
    const current = readJSON(storage, BUILD_KEY);
    this.envelope = migrateLoadout(
      current && object(current).version === 5
        ? current
        : readJSON(storage, LEGACY_KEY),
    );
    this.persisted = { ...this.envelope.build };
    this.editing = { ...this.persisted };
  }
  get saved(): ShipBuild {
    return { ...this.persisted };
  }
  get draft(): ShipBuild {
    return { ...this.editing };
  }
  get dirty(): boolean {
    return JSON.stringify(this.persisted) !== JSON.stringify(this.editing);
  }
  select(slot: ShipSlot, index: number) {
    if (index === 0 || index === 1 || index === 2) this.editing[slot] = index;
  }
  selectColor(index: number) {
    if (index === 0 || index === 1 || index === 2) this.editing.color = index;
  }
  selectWeapon(weapon: Weapon) {
    if (weapon === "straight" || weapon === "spread")
      this.editing.weapon = weapon;
  }
  discard() {
    this.editing = { ...this.persisted };
  }
  /** Applies in memory even when storage is blocked. False means it could not persist across reloads. */
  save(): boolean {
    this.persisted = { ...this.editing };
    this.envelope = {
      ...this.envelope,
      ...object(readJSON(this.storage, BUILD_KEY)),
      version: 5,
      build: this.saved,
      weapon: this.persisted.weapon,
    };
    try {
      if (!this.storage) return false;
      this.storage.setItem(BUILD_KEY, JSON.stringify(this.envelope));
      return true;
    } catch {
      return false;
    }
  }
}

/** The new fleet is stored separately; selecting a ship never rewrites the old modular save. */
export class PixelShipStore {
  private base: ShipBuild;
  private persisted: PartIndex;
  private editing: PartIndex;
  constructor(private storage: StorageLike | undefined = browserStorage()) {
    this.base = new ShipBuildStore(storage).saved;
    const saved = object(readJSON(storage, PIXEL_BUILD_KEY));
    this.persisted =
      saved.version === 1 &&
      (saved.ship === 0 || saved.ship === 1 || saved.ship === 2)
        ? saved.ship
        : this.base.hull;
    this.editing = this.persisted;
  }
  get saved(): ShipBuild {
    return { ...this.base, hull: this.persisted };
  }
  get draft(): ShipBuild {
    return { ...this.base, hull: this.editing };
  }
  get dirty() {
    return this.editing !== this.persisted;
  }
  select(slot: ShipSlot, index: number) {
    if (slot === "hull" && (index === 0 || index === 1 || index === 2))
      this.editing = index;
  }
  discard() {
    this.editing = this.persisted;
  }
  save(): boolean {
    this.persisted = this.editing;
    try {
      if (!this.storage) return false;
      this.storage.setItem(
        PIXEL_BUILD_KEY,
        JSON.stringify({ version: 1, ship: this.persisted }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

export type ShipPartImages = Record<
  `${ShipSlot}-${PartIndex}`,
  CanvasImageSource
> &
  Partial<
    Record<
      `upgrade-${2 | 3}` | `pixel-${PartIndex}-${1 | 2 | 3}`,
      CanvasImageSource
    >
  >;
export async function loadShipParts(): Promise<ShipPartImages> {
  const { SHIPS } = await import("./pixel-fleet");
  const entries = await Promise.all(
    SHIPS.flatMap((ship) =>
      ([1, 2, 3] as const).map(async (level) => {
        const img = new Image();
        img.src = ship.levels[level].url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () =>
            reject(
              new Error(
                `Could not load ${ship.name} Level ${level}. Check your connection and retry.`,
              ),
            );
          if (img.complete && img.naturalWidth) resolve();
        });
        return [`pixel-${ship.id}-${level}`, img] as const;
      }),
    ),
  );
  return Object.fromEntries(entries) as ShipPartImages;
}

/** Part PNGs share a square transparent canvas and a common origin; x/y mark the ship center. */
export function drawShipBuild(
  ctx: CanvasRenderingContext2D,
  build: ShipBuild,
  images: ShipPartImages,
  x: number,
  y: number,
  size: number,
  level: 1 | 2 | 3 = 1,
) {
  ctx.save();
  try {
    const left = x - size / 2,
      top = y - size / 2;
    const pixel = images[`pixel-${build.hull}-${level}`];
    if (pixel) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pixel, left, top, size, size);
      return;
    }
    ctx.drawImage(images[`engine-${build.engine}`], left, top, size, size);
    // Engines are the accent layer. Tint it before opaque metal layers are drawn.
    if (build.color !== 0) {
      const layer = document.createElement("canvas");
      layer.width = layer.height = Math.max(1, Math.ceil(size));
      const tint = layer.getContext("2d");
      if (tint) {
        tint.drawImage(
          images[`engine-${build.engine}`],
          0,
          0,
          layer.width,
          layer.height,
        );
        const pixels = tint.getImageData(0, 0, layer.width, layer.height),
          data = pixels.data;
        const hex = SHIP_ACCENTS[build.color].slice(1),
          red = parseInt(hex.slice(0, 2), 16),
          green = parseInt(hex.slice(2, 4), 16),
          blue = parseInt(hex.slice(4, 6), 16);
        for (let i = 0; i < data.length; i += 4) {
          // Recolor cyan illumination only; neutral metal and warm highlights stay intact.
          if (
            data[i + 2] > data[i] * 1.15 &&
            data[i + 1] > data[i] * 1.1 &&
            data[i + 2] > 80
          ) {
            const brightness =
              Math.max(data[i], data[i + 1], data[i + 2]) / 255;
            data[i] = red * brightness;
            data[i + 1] = green * brightness;
            data[i + 2] = blue * brightness;
          }
        }
        tint.putImageData(pixels, 0, 0);
        ctx.drawImage(layer, left, top, size, size);
      }
    }
    ctx.drawImage(images[`wing-${build.wing}`], left, top, size, size);
    ctx.drawImage(images[`hull-${build.hull}`], left, top, size, size);
    if (level > 1 && images[`upgrade-${level as 2 | 3}`])
      ctx.drawImage(
        images[`upgrade-${level as 2 | 3}`]!,
        left,
        top,
        size,
        size,
      );
  } finally {
    ctx.restore();
  }
}
export function composeShip(
  build: ShipBuild,
  images: ShipPartImages,
  size = 256,
  level: 1 | 2 | 3 = 1,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.max(1, Math.round(size));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  drawShipBuild(
    ctx,
    build,
    images,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width,
    level,
  );
  return canvas;
}
