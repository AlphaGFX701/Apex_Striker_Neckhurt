import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeAxis, screenAxes, SensorController, TiltFilter } from './sensor';

describe('tilt control', () => {
  it('maps screen rotation into the same control directions', () => {
    expect(screenAxes(8, 13, 0)).toEqual({ x: 13, y: 8 });
    expect(screenAxes(8, 13, 90)).toEqual({ x: 8, y: -13 });
    expect(screenAxes(8, 13, -90)).toEqual({ x: -8, y: 13 });
  });

  it('calibrates the current pose and ignores tiny movement', () => {
    const filter = new TiltFilter();
    filter.calibrate({ x: 18, y: 28 });
    expect(filter.update({ x: 20, y: 26 })).toEqual({ x: 0, y: 0 });
    const moved = filter.update({ x: 40, y: 6 });
    expect(moved.x).toBeGreaterThan(0);
    expect(moved.y).toBeLessThan(0);
  });

  it('increases response with sensitivity and smooths spikes', () => {
    expect(normalizeAxis(12, 2)).toBeGreaterThan(normalizeAxis(12, 0.5));
    const filter = new TiltFilter();
    filter.calibrate({ x: 0, y: 0 });
    const first = filter.update({ x: 90, y: 0 });
    expect(first.x).toBeGreaterThan(0);
    expect(first.x).toBeLessThan(1);
    expect(filter.update({ x: 90, y: 0 }).x).toBeGreaterThan(first.x);
    filter.clear();
    expect(filter.update({ x: 90, y: 0 })).toEqual({ x: 0, y: 0 });
  });
  it('uses elapsed time for equivalent filtering at different frame rates', () => {
    const results = [30, 60, 120].map(hz => {
      const f = new TiltFilter(); f.calibrate({ x: 0, y: 0 });
      let out = { x: 0, y: 0 };
      for (let i = 0; i < hz; i++) out = f.update({ x: 15, y: -15 }, 1 / hz);
      return out.x;
    });
    expect(Math.max(...results) - Math.min(...results)).toBeLessThan(0.00001);
  });
});

describe('sensor setup', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function fakeBrowser(permission: 'granted' | 'denied' = 'granted') {
    const fakeWindow = new EventTarget() as EventTarget & { isSecureContext: boolean; screen: { orientation: EventTarget & { angle: number } }; orientation: number; DeviceOrientationEvent: typeof DeviceOrientationEvent };
    fakeWindow.isSecureContext = true;
    fakeWindow.screen = { orientation: Object.assign(new EventTarget(), { angle: 0 }) };
    fakeWindow.orientation = 0;
    fakeWindow.DeviceOrientationEvent = class { static requestPermission = vi.fn(async () => permission); } as unknown as typeof DeviceOrientationEvent;
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('DeviceOrientationEvent', fakeWindow.DeviceOrientationEvent);
    return fakeWindow;
  }

  it('reports denied permission', async () => {
    fakeBrowser('denied');
    const sensor = new SensorController();
    expect(await sensor.enable()).toBe(false);
    expect(sensor.telemetry.state).toBe('denied');
  });

  it('reports no sensor data after the wait window', async () => {
    fakeBrowser();
    const sensor = new SensorController();
    await sensor.enable();
    sensor.tick(performance.now() + 3100);
    expect(sensor.telemetry.state).toBe('unavailable');
  });

  it('requests permission, calibrates, and detects missing data', async () => {
    const browser = fakeBrowser();
    const sensor = new SensorController();
    expect(await sensor.enable()).toBe(true);
    expect(sensor.calibrate()).toBe(false);
    browser.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 10, gamma: 12 }));
    expect(sensor.telemetry.state).toBe('recalibrate');
    expect(sensor.calibrate()).toBe(true);
    browser.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 10, gamma: 25 }));
    expect(sensor.getAxes().x).toBeGreaterThan(0);
    sensor.tick(performance.now() + 2000);
    expect(sensor.telemetry.state).toBe('stale');
  });

  it('requires a new center after screen rotation', async () => {
    const browser = fakeBrowser();
    const sensor = new SensorController();
    await sensor.enable();
    browser.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 10, gamma: 12 }));
    sensor.calibrate();
    browser.screen.orientation.angle = 90;
    browser.screen.orientation.dispatchEvent(new Event('change'));
    expect(sensor.telemetry.state).toBe('recalibrate');
    expect(sensor.telemetry.calibrated).toBe(false);
  });

  it('requests both permissions during activation and preserves tilt if motion is denied', async () => {
    const browser = fakeBrowser();
    const motionPermission = vi.fn(async () => 'denied');
    Object.assign(browser, { DeviceMotionEvent: { requestPermission: motionPermission } });
    const s = new SensorController(); const enabled = s.enable();
    expect(motionPermission).toHaveBeenCalledOnce();
    expect(await enabled).toBe(true); expect(s.telemetry.motionState).toBe('denied');
    browser.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 10, gamma: 12 }));
    expect(s.calibrate()).toBe(true);
  });

  it('reports missing individual motion fields and marks gravity subtraction as estimated', async () => {
    const browser = fakeBrowser(); Object.assign(browser, { DeviceMotionEvent: class {} });
    const s = new SensorController(); await s.enable();
    browser.dispatchEvent(Object.assign(new Event('devicemotion'), { acceleration: { x: 1, y: 2, z: 3 }, rotationRate: { alpha: null, beta: null, gamma: null } }));
    expect(s.telemetry.strength).toBeCloseTo(Math.sqrt(14)); expect(s.telemetry.roll).toBeNull(); expect(s.telemetry.estimated).toBe(false);
    browser.dispatchEvent(Object.assign(new Event('devicemotion'), { acceleration: null, accelerationIncludingGravity: { x: 0, y: 0, z: 9.81 } }));
    expect(s.telemetry.estimated).toBe(true); expect(s.telemetry.strength).toBeNull();
    expect(s.telemetry.rotation.alpha).toBeNull();
  });

  it('rejects insecure origins and clears stale motion data', async () => {
    const browser = fakeBrowser(); browser.isSecureContext = false;
    const s = new SensorController(); expect(await s.enable()).toBe(false);
    expect(s.telemetry.message).toContain('HTTPS');
    browser.isSecureContext = true; Object.assign(browser, { DeviceMotionEvent: class {} }); await s.enable();
    browser.dispatchEvent(Object.assign(new Event('devicemotion'), { acceleration: { x: 0, y: 0, z: 0 }, rotationRate: { alpha: 0, beta: 0, gamma: 0 } }));
    s.tick(performance.now() + 3100);
    expect(s.telemetry.motionState).toBe('stale'); expect(s.telemetry.strength).toBeNull(); expect(s.consumeActions()).toEqual([]);
  });

  it('clears queued gestures on pause/restart and ignores motion while disarmed', async () => {
    let now = 1000; vi.spyOn(performance, 'now').mockImplementation(() => now);
    const browser = fakeBrowser(); Object.assign(browser, { DeviceMotionEvent: class {} });
    const s = new SensorController(); await s.enable();
    browser.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 10, gamma: 12 }));
    s.calibrate(); s.setGestureActive(true);
    const move = () => browser.dispatchEvent(Object.assign(new Event('devicemotion'), { acceleration: { x: 0, y: 0, z: 0 }, rotationRate: { alpha: 0, beta: 0, gamma: 200 } }));
    for (now = 1700; now < 1800; now += 16) move();
    expect(s.telemetry.lastGesture).toBe('dodgeRight');
    s.setGestureActive(false); expect(s.consumeActions()).toEqual([]);
    for (now = 2600; now < 2800; now += 16) move();
    expect(s.consumeActions()).toEqual([]);
    s.setGestureActive(true); s.resetTransient(); expect(s.consumeActions()).toEqual([]);
  });

  it('times out unusable motion events and can retry setup', async () => {
    let now = 1000; vi.spyOn(performance, 'now').mockImplementation(() => now);
    const browser = fakeBrowser(); Object.assign(browser, { DeviceMotionEvent: class {} });
    const s = new SensorController(); await s.enable();
    now = 4500;
    browser.dispatchEvent(Object.assign(new Event('devicemotion'), { acceleration: null, rotationRate: null }));
    s.tick(now); expect(s.telemetry.motionState).toBe('unavailable');
    expect(await s.enable()).toBe(true); expect(s.telemetry.motionState).toBe('waiting');
  });
});
