export type SensorState = 'idle' | 'waiting' | 'active' | 'denied' | 'unavailable' | 'stale' | 'recalibrate';

export interface Telemetry {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  acceleration: { x: number | null; y: number | null; z: number | null };
  rotation: { alpha: number | null; beta: number | null; gamma: number | null };
  hz: number | null;
  state: SensorState;
  message: string;
  calibrated: boolean;
}

export interface Axes { x: number; y: number }

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const deltaAngle = (current: number, center: number) => ((current - center + 540) % 360) - 180;

export function screenAxes(beta: number, gamma: number, angle: number): Axes {
  const rotation = ((angle % 360) + 360) % 360;
  if (rotation === 90) return { x: beta, y: -gamma };
  if (rotation === 180) return { x: -gamma, y: -beta };
  if (rotation === 270) return { x: -beta, y: gamma };
  return { x: gamma, y: beta };
}

export function normalizeAxis(degrees: number, sensitivity: number, deadZone = 3): number {
  const magnitude = Math.abs(degrees);
  if (magnitude <= deadZone) return 0;
  const range = clamp(28 / sensitivity, 9, 65);
  return Math.sign(degrees) * clamp((magnitude - deadZone) / (range - deadZone), 0, 1);
}

export class TiltFilter {
  private center: Axes | null = null;
  private smoothed: Axes = { x: 0, y: 0 };
  private sensitivity = 1;

  setSensitivity(value: number) { this.sensitivity = clamp(value, 0.5, 2); }
  calibrate(raw: Axes) { this.center = { ...raw }; this.smoothed = { x: 0, y: 0 }; }
  clear() { this.center = null; this.smoothed = { x: 0, y: 0 }; }
  get calibrated() { return this.center !== null; }

  update(raw: Axes): Axes {
    if (!this.center) return { x: 0, y: 0 };
    const target = {
      x: normalizeAxis(deltaAngle(raw.x, this.center.x), this.sensitivity),
      y: normalizeAxis(deltaAngle(raw.y, this.center.y), this.sensitivity),
    };
    this.smoothed.x += (target.x - this.smoothed.x) * 0.22;
    this.smoothed.y += (target.y - this.smoothed.y) * 0.22;
    return { ...this.smoothed };
  }
}

type PermissionDeviceEvent = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export class SensorController {
  private filter = new TiltFilter();
  private latest: Axes | null = null;
  private lastEventAt = 0;
  private startedAt = 0;
  private lastIntervalAt = 0;
  private screenAngle = this.getScreenAngle();
  private active = false;
  private listeners = new Set<(telemetry: Telemetry) => void>();
  readonly telemetry: Telemetry = {
    alpha: null, beta: null, gamma: null,
    acceleration: { x: null, y: null, z: null },
    rotation: { alpha: null, beta: null, gamma: null },
    hz: null, state: 'idle', message: 'กดเปิดเซนเซอร์เพื่อเริ่มทดสอบ', calibrated: false,
  };

  constructor() {
    window.addEventListener('orientationchange', this.onScreenChange);
    window.screen.orientation?.addEventListener?.('change', this.onScreenChange);
  }

  subscribe(listener: (telemetry: Telemetry) => void) {
    this.listeners.add(listener);
    listener(this.telemetry);
    return () => this.listeners.delete(listener);
  }

  private publish() { this.telemetry.calibrated = this.filter.calibrated; this.listeners.forEach(listener => listener(this.telemetry)); }
  private setState(state: SensorState, message: string) { this.telemetry.state = state; this.telemetry.message = message; this.publish(); }
  private getScreenAngle() { return window.screen.orientation?.angle ?? (window.orientation || 0); }

  async enable() {
    if (!window.isSecureContext) {
      this.setState('unavailable', 'เซนเซอร์ต้องเปิดเว็บผ่าน HTTPS');
      return false;
    }
    if (!('DeviceOrientationEvent' in window)) {
      this.setState('unavailable', 'เบราว์เซอร์หรืออุปกรณ์นี้ไม่มีข้อมูลการเอียง');
      return false;
    }
    if (this.active) return true;
    try {
      const eventType = DeviceOrientationEvent as PermissionDeviceEvent;
      if (typeof eventType.requestPermission === 'function') {
        const permission = await eventType.requestPermission();
        if (permission !== 'granted') {
          this.setState('denied', 'ไม่ได้รับสิทธิ์ Motion กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์แล้วลองอีกครั้ง');
          return false;
        }
      }
      this.active = true;
      this.startedAt = performance.now();
      window.addEventListener('deviceorientation', this.onOrientation);
      window.addEventListener('devicemotion', this.onMotion);
      this.setState('waiting', 'รอข้อมูลเซนเซอร์… ลองขยับมือถือเล็กน้อย');
      return true;
    } catch {
      this.setState('denied', 'เปิดเซนเซอร์ไม่สำเร็จ กรุณาตรวจสิทธิ์ Motion ในเบราว์เซอร์');
      return false;
    }
  }

  calibrate() {
    if (!this.latest) {
      this.setState('waiting', 'ยังไม่มีค่าการเอียง กรุณาขยับมือถือแล้วลองตั้งศูนย์อีกครั้ง');
      return false;
    }
    this.filter.calibrate(this.latest);
    this.setState('active', 'ตั้งศูนย์แล้ว • เอียงมือถือเพื่อบังคับยาน');
    return true;
  }

  setSensitivity(value: number) { this.filter.setSensitivity(value); }

  getAxes(): Axes {
    if (this.telemetry.state !== 'active' || !this.latest) return { x: 0, y: 0 };
    return this.filter.update(this.latest);
  }

  tick(now = performance.now()) {
    if (!this.active) return;
    if (this.lastEventAt === 0 && now - this.startedAt > 3000) {
      this.setState('unavailable', 'ไม่ได้รับข้อมูลเซนเซอร์ ตรวจว่าเปิดผ่าน HTTPS และอนุญาต Motion แล้ว');
      this.active = false;
      window.removeEventListener('deviceorientation', this.onOrientation);
      window.removeEventListener('devicemotion', this.onMotion);
    } else if (this.lastEventAt > 0 && now - this.lastEventAt > 1500 && this.telemetry.state === 'active') {
      this.setState('stale', 'สัญญาณเซนเซอร์หยุดชั่วคราว ลองขยับมือถือ');
    }
  }

  private onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    const now = performance.now();
    if (this.lastIntervalAt) {
      const interval = now - this.lastIntervalAt;
      if (interval > 0) this.telemetry.hz = this.telemetry.hz === null ? 1000 / interval : this.telemetry.hz * 0.8 + (1000 / interval) * 0.2;
    }
    this.lastIntervalAt = now;
    this.lastEventAt = now;
    this.telemetry.alpha = event.alpha;
    this.telemetry.beta = event.beta;
    this.telemetry.gamma = event.gamma;
    this.latest = screenAxes(event.beta, event.gamma, this.screenAngle);
    if (this.telemetry.state === 'waiting' || this.telemetry.state === 'stale' || this.telemetry.state === 'unavailable') {
      this.setState(this.filter.calibrated ? 'active' : 'recalibrate', this.filter.calibrated ? 'เซนเซอร์พร้อมใช้งาน' : 'ได้รับข้อมูลแล้ว • ถือมือถือท่าถนัดแล้วกดตั้งศูนย์');
    } else this.publish();
  };

  private onMotion = (event: DeviceMotionEvent) => {
    const a = event.accelerationIncludingGravity ?? event.acceleration;
    this.telemetry.acceleration = { x: a?.x ?? null, y: a?.y ?? null, z: a?.z ?? null };
    this.telemetry.rotation = {
      alpha: event.rotationRate?.alpha ?? null,
      beta: event.rotationRate?.beta ?? null,
      gamma: event.rotationRate?.gamma ?? null,
    };
    this.publish();
  };

  private onScreenChange = () => {
    const next = this.getScreenAngle();
    if (next === this.screenAngle) return;
    this.screenAngle = next;
    this.filter.clear();
    this.latest = null;
    if (this.active) this.setState('recalibrate', 'หน้าจอหมุนแล้ว • ถือเครื่องท่าถนัดและกดตั้งศูนย์ใหม่');
  };
}
