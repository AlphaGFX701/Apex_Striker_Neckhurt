import { describe, expect, it, vi } from 'vitest';
import { BUILD_KEY, LEGACY_KEY, ShipBuildStore, drawShipBuild, migrateLoadout, type ShipPartImages } from './ship-build';
function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
describe('modular ship builds', () => {
  it('migrates legacy ship and weapon without losing controller preferences', () => {
    const old = { ship: 2, weapon: 'spread', source: 'pad', sensitivity: '1.3', pad: { axisX: 2 } };
    const result = migrateLoadout(old);
    expect(result).toMatchObject({ version: 5, build: { hull: 2, wing: 2, engine: 2, color: 0, weapon: 'spread' }, pad: old.pad, sensitivity: '1.3', source: 'pad' });
  });
  it('keeps draft edits out of saved build until explicitly saved, and discards correctly', () => {
    const storage = memory({ [LEGACY_KEY]: JSON.stringify({ ship: 1 }) });
    const store = new ShipBuildStore(storage); store.select('hull', 2); store.selectColor(2); store.selectWeapon('spread');
    expect(store.saved.hull).toBe(1); expect(store.dirty).toBe(true);
    store.discard(); expect(store.draft).toEqual(store.saved); expect(store.dirty).toBe(false);
    store.select('engine', 2); expect(store.save()).toBe(true);
    expect(new ShipBuildStore(storage).saved.engine).toBe(2);
  });
  it('normalizes broken values, preserves latest unrelated v5 settings, and returns defensive copies', () => {
    const storage = memory({ [BUILD_KEY]: JSON.stringify({ version: 5, build: { hull: 999, wing: 1, engine: -2, color: 4, weapon: 'unknown' }, source: 'pad' }) });
    const store = new ShipBuildStore(storage);
    expect(store.saved).toEqual({ hull: 0, wing: 1, engine: 0, color: 0, weapon: 'straight' });
    const copy = store.saved; copy.hull = 2; expect(store.saved.hull).toBe(0);
    storage.setItem(BUILD_KEY, JSON.stringify({ source: 'sensor' })); store.save();
    expect(JSON.parse(storage.getItem(BUILD_KEY)!).source).toBe('sensor');
  });
  it('still applies the selected build when persistent storage is blocked', () => {
    const store = new ShipBuildStore({ getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } });
    store.select('wing', 2); expect(store.save()).toBe(false); expect(store.saved.wing).toBe(2); expect(store.dirty).toBe(false);
  });
  it('draws identical aligned engine-wing-hull layers for preview and gameplay composition', () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), drawImage: vi.fn() };
    const images = { 'hull-2': { tag: 'hull' }, 'wing-1': { tag: 'wing' }, 'engine-0': { tag: 'engine' } } as unknown as ShipPartImages;
    drawShipBuild(ctx as unknown as CanvasRenderingContext2D, { hull: 2, wing: 1, engine: 0, color: 0, weapon: 'straight' }, images, 100, 120, 80);
    expect(ctx.drawImage.mock.calls).toEqual([
      [images['engine-0'], 60, 80, 80, 80], [images['wing-1'], 60, 80, 80, 80], [images['hull-2'], 60, 80, 80, 80],
    ]);
    expect(ctx.restore).toHaveBeenCalledOnce();
  });
});
