import { describe, expect, it } from "vitest";
import { GamepadAdapter, radialDeadzone, type PadLike } from "./gamepad";

function fixture() {
  const pad: PadLike = {
    id: "test FANTECH",
    index: 0,
    connected: true,
    mapping: "standard",
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  };
  let present = true;
  const adapter = new GamepadAdapter(() => (present ? [pad] : []));
  const press = (i: number, pressed = true) =>
    Object.assign(pad.buttons[i], { pressed, value: pressed ? 1 : 0 });
  const axes = (x: number, y: number) => {
    (pad.axes as number[])[0] = x;
    (pad.axes as number[])[1] = y;
  };
  return {
    pad,
    adapter,
    press,
    axes,
    disconnect: () => {
      present = false;
    },
    reconnect: () => {
      present = true;
    },
  };
}
describe("GamepadAdapter", () => {
  it("preserves analog trigger pressure independently of digital activation", () => {
    const f = fixture();
    f.pad.buttons[6].value = 0.35;
    const frame = f.adapter.poll();
    expect(frame.buttonValues[6]).toBe(0.35);
    expect(frame.buttons[6]).toBe(false);
  });
  it("selects the requested controller and clears observations on replacement", () => {
    const base = fixture().pad;
    const other = { ...base, id: "second", index: 2, axes: [0.9, 0] };
    let list = [base, other];
    const a = new GamepadAdapter(() => list);
    a.selectedIndex = 2;
    expect(a.poll().id).toBe("second");
    expect(a.poll().axes.x).toBeGreaterThan(0.5);
    list = [base];
    const gone = a.poll();
    expect(gone.disconnected).toBe(true);
    expect(gone.connected).toBe(false);
    expect(gone.buttonValues).toEqual([]);
  });
  it("centers a drifting stick before applying the dead zone", () => {
    const f = fixture();
    f.axes(0.3, 0.2);
    f.adapter.poll();
    expect(f.adapter.calibrate()).toBe(true);
    expect(f.adapter.poll().axes).toEqual({ x: 0, y: 0 });
    f.axes(0.8, 0.2);
    expect(f.adapter.poll().axes.x).toBeGreaterThan(0.3);
  });
  it("removes stick drift, rescales continuously and bounds diagonals", () => {
    expect(radialDeadzone(0.1, 0.05)).toEqual({ x: 0, y: 0 });
    expect(radialDeadzone(0.575, 0).x).toBeCloseTo(0.5);
    expect(Math.hypot(...Object.values(radialDeadzone(1, 1)))).toBeCloseTo(1);
    expect(radialDeadzone(NaN, 1)).toEqual({ x: 0, y: 0 });
  });
  it("reads standard buttons on their rising edge and does not trigger held reconnects", () => {
    const f = fixture();
    f.adapter.poll();
    f.press(4);
    expect(f.adapter.poll().actions).toEqual(["dodgeLeft"]);
    expect(f.adapter.poll().actions).toEqual([]);
    f.disconnect();
    const lost = f.adapter.poll();
    expect(lost.disconnected).toBe(true);
    expect(lost.axes).toEqual({ x: 0, y: 0 });
    expect(f.adapter.poll().disconnected).toBe(false);
    f.reconnect();
    expect(f.adapter.poll().actions).toEqual([]);
    f.press(4, false);
    f.adapter.poll();
    f.press(4);
    expect(f.adapter.poll().actions).toEqual(["dodgeLeft"]);
  });
  it("supports remapping, pause edge, inversion and D-pad diagonals", () => {
    const f = fixture();
    f.adapter.rebind("emp", 2);
    f.adapter.poll();
    f.press(2);
    f.press(9);
    expect(f.adapter.poll()).toMatchObject({ actions: ["emp"], pause: true });
    expect(f.adapter.poll().pause).toBe(false);
    f.press(15);
    f.press(12);
    f.adapter.settings.invertX = true;
    expect(f.adapter.poll().axes.x).toBeCloseTo(-Math.SQRT1_2);
    expect(f.adapter.poll().axes.y).toBeCloseTo(-Math.SQRT1_2);
  });
  it("requires multi-axis observed movement and explicit human confirmation for mapped tilt", () => {
    const f = fixture();
    f.adapter.poll(0);
    f.adapter.mode = "tilt";
    f.adapter.beginTiltTrial(0);
    f.axes(0.5, 0);
    f.adapter.poll(1000);
    expect(f.adapter.finishTiltTrial(4000)).toBe(false);
    expect(f.adapter.confirmTiltTrial()).toBe(false);
    f.axes(0, 0);
    f.adapter.poll(5000);
    f.adapter.beginTiltTrial(5000);
    f.axes(0.5, -0.4);
    f.adapter.poll(6000);
    expect(f.adapter.finishTiltTrial(9000)).toBe(true);
    expect(f.adapter.poll().axes).toEqual({ x: 0, y: 0 });
    expect(f.adapter.confirmTiltTrial()).toBe(true);
    f.adapter.calibrate();
    expect(f.adapter.poll().axes).toEqual({ x: 0, y: 0 });
    f.axes(0.9, -0.4);
    expect(f.adapter.poll().axes.x).toBeGreaterThan(0);
    f.disconnect();
    expect(f.adapter.poll().tiltReady).toBe(false);
  });
  it("does not treat missing axes as sensor zero and invalidates changed axis pair", () => {
    const f = fixture();
    f.adapter.poll();
    f.adapter.settings.axisX = 7;
    expect(f.adapter.beginTiltTrial()).toBe(false);
    expect(f.adapter.poll().axes).toEqual({ x: 0, y: 0 });
  });
  it("clears held action transitions across pause/reset", () => {
    const f = fixture();
    f.adapter.poll();
    f.press(0);
    f.adapter.poll();
    f.adapter.reset();
    expect(f.adapter.poll().actions).toEqual([]);
    f.press(0, false);
    f.adapter.poll();
    f.press(0);
    expect(f.adapter.poll().actions).toEqual(["emp"]);
  });
});
