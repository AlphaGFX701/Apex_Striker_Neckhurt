export interface MovingCircle {
  x: number;
  y: number;
  radius: number;
  prevX?: number;
  prevY?: number;
}
export function sweptContact(a: MovingCircle, b: MovingCircle) {
  const x = (a.prevX ?? a.x) - (b.prevX ?? b.x),
    y = (a.prevY ?? a.y) - (b.prevY ?? b.y),
    dx = a.x - b.x - x,
    dy = a.y - b.y - y,
    length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, -(x * dx + y * dy) / length)) : 0;
  return (x + dx * t) ** 2 + (y + dy * t) ** 2 <= (a.radius + b.radius) ** 2;
}
export class ProjectileGrid<T extends MovingCircle> {
  private cells = new Map<string, T[]>();
  constructor(items: T[]) {
    for (const item of items)
      for (const key of this.keys(item)) {
        const cell = this.cells.get(key);
        if (cell) cell.push(item);
        else this.cells.set(key, [item]);
      }
  }
  private keys(p: MovingCircle) {
    const keys: string[] = [];
    for (
      let x = Math.floor((Math.min(p.x, p.prevX ?? p.x) - p.radius) / 32);
      x <= Math.floor((Math.max(p.x, p.prevX ?? p.x) + p.radius) / 32);
      x++
    )
      for (
        let y = Math.floor((Math.min(p.y, p.prevY ?? p.y) - p.radius) / 32);
        y <= Math.floor((Math.max(p.y, p.prevY ?? p.y) + p.radius) / 32);
        y++
      )
        keys.push(x + "," + y);
    return keys;
  }
  nearby(p: MovingCircle) {
    const found = new Set<T>();
    for (const key of this.keys(p))
      for (const item of this.cells.get(key) ?? []) found.add(item);
    return found;
  }
}
/** Preserve a104-unit escape corridor in the lower playfield across ALL hostile volleys. */
export function threatensPassage(
  b: { x: number; y: number; vx: number; vy: number; radius: number },
  center: number,
) {
  let enter = 0,
    exit = 8;
  for (const [position, speed, min, max] of [
    [b.x, b.vx, center - 52 - b.radius - 6, center + 52 + b.radius + 6],
    [b.y, b.vy, 430 - b.radius, 675 + b.radius],
  ]) {
    if (Math.abs(speed) < 0.0001) {
      if (position < min || position > max) return false;
      continue;
    }
    const a = (min - position) / speed,
      c = (max - position) / speed;
    enter = Math.max(enter, Math.min(a, c));
    exit = Math.min(exit, Math.max(a, c));
    if (enter > exit) return false;
  }
  return exit >= 0 && enter <= 8;
}
