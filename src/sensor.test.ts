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
});

describe('sensor setup', () => {
  afterEach(() => vi.unstubAllGlobals());

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
});
