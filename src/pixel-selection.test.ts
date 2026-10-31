import { describe, expect, it } from "vitest";
import { BUILD_KEY, PIXEL_BUILD_KEY, PixelShipStore } from "./ship-build";

function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("pixel fleet selection", () => {
  it("maps the old hull while preserving the complete modular save and input preferences", () => {
    const original = JSON.stringify({version:5,build:{hull:2,wing:1,engine:0,color:2,weapon:"spread"},source:"pad",sensitivity:1.4,pad:{axisX:3}});
    const storage = memory({[BUILD_KEY]:original});
    const store = new PixelShipStore(storage);
    expect(store.saved.hull).toBe(2);
    expect(store.saved.weapon).toBe("spread");
    store.select("hull",1);
    expect(store.saved.hull).toBe(2);
    expect(store.dirty).toBe(true);
    expect(store.save()).toBe(true);
    expect(storage.getItem(BUILD_KEY)).toBe(original);
    expect(JSON.parse(storage.getItem(PIXEL_BUILD_KEY)!)).toEqual({version:1,ship:1});
    expect(new PixelShipStore(storage).saved.hull).toBe(1);
  });
  it("uses a valid pixel selection before legacy data and rejects malformed selections", () => {
    const storage=memory({[BUILD_KEY]:JSON.stringify({version:5,build:{hull:2}}),[PIXEL_BUILD_KEY]:JSON.stringify({version:1,ship:0})});
    const store=new PixelShipStore(storage);
    expect(store.saved.hull).toBe(0);
    store.select("hull",99);
    expect(store.dirty).toBe(false);
    store.select("hull",1);store.discard();
    expect(store.draft.hull).toBe(0);
    storage.setItem(PIXEL_BUILD_KEY,JSON.stringify({version:1,ship:99}));
    expect(new PixelShipStore(storage).saved.hull).toBe(2);
  });
  it("applies the chosen ship in memory when persistent storage is unavailable",()=>{
    const store=new PixelShipStore({getItem(){throw Error("blocked");},setItem(){throw Error("quota");}});
    store.select("hull",2);
    expect(store.save()).toBe(false);
    expect(store.saved.hull).toBe(2);
    expect(store.dirty).toBe(false);
  });
});
