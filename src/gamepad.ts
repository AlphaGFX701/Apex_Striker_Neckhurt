import type { Action } from './motion';
import type { Axes } from './sensor';

export type PadCommand = Action | 'pause';
export interface PadLike {
  id: string; index: number; connected: boolean; mapping: string;
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value: number }[];
}
export interface PadSettings {
  deadzone: number; sensitivity: number; invertX: boolean; invertY: boolean;
  axisX: number; axisY: number; buttons: Record<PadCommand, number>;
}
export interface PadFrame {
  connected: boolean; id: string; mapping: string; axes: Axes; rawAxes: (number | null)[];
  buttons: boolean[]; actions: Action[]; pause: boolean; disconnected: boolean;
  tiltReady: boolean; tiltMessage: string;
}
const bounded = (n: number, fallback: number, min: number, max: number) => Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
export function radialDeadzone(x: number, y: number, deadzone = 0.15, sensitivity = 1): Axes {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
  const length = Math.hypot(x, y), zone = bounded(deadzone, 0.15, 0, 0.9);
  if (length <= zone) return { x: 0, y: 0 };
  const magnitude = Math.min(1, (Math.min(length, 1) - zone) / (1 - zone) * bounded(sensitivity, 1, 0.25, 3));
  return { x: x / length * magnitude, y: y / length * magnitude };
}

/** Reads only public Gamepad axes/buttons. It never labels these as raw gyro data. */
export class GamepadAdapter {
  settings: PadSettings = { deadzone: 0.15, sensitivity: 1, invertX: false, invertY: false,
    axisX: 0, axisY: 1, buttons: { dodgeLeft: 4, dodgeRight: 5, emp: 0, pause: 9 } };
  mode: 'stick' | 'tilt' = 'stick';
  tiltReady = false;
  tiltMessage = 'ยังไม่ทดสอบการเอียงที่จอยแปลงเป็นอนาล็อก';
  private identity = '';
  private previous: boolean[] = [];
  private raw: (number | null)[] = [];
  private center: Axes = { x: 0, y: 0 };
  private trial: { start: number; base: Axes; maxX: number; maxY: number; pair: string } | null = null;
  private candidate = false;
  private pair = '0/1';
  private readyIdentity = '';
  private suppressEdges = false;
  constructor(private readPads: () => readonly (PadLike | null)[] = () => {
    try { return typeof navigator !== 'undefined' && navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; }
    catch { return []; }
  }) {}
  rebind(command: PadCommand, index: number) {
    if (Number.isInteger(index) && index >= 0 && index < 64) this.settings.buttons[command] = index;
  }
  reset() { this.previous = []; this.trial = null; this.suppressEdges = true; }
  private selected(): Axes | null {
    const { axisX, axisY } = this.settings;
    if (axisX === axisY) return null;
    const x = this.raw[axisX], y = this.raw[axisY];
    return x == null || y == null ? null : { x, y };
  }
  calibrate(): boolean {
    const selected = this.selected();
    if (!selected || !this.identity) return false;
    this.center = { ...selected }; this.previous = []; this.suppressEdges = true; return true;
  }
  beginTiltTrial(now = performance.now()): boolean {
    const selected = this.selected();
    this.tiltReady = false; this.candidate = false;
    if (!selected || !this.identity) { this.tiltMessage = 'เชื่อมต่อจอยและเลือกแกนที่มีข้อมูลก่อน'; return false; }
    this.trial = { start: now, base: selected, maxX: 0, maxY: 0, pair: `${this.settings.axisX}/${this.settings.axisY}` };
    this.tiltMessage = 'ปล่อยอนาล็อก แล้วเอียงจอยซ้าย–ขวาและหน้า–หลังอย่างน้อย 3 วินาที'; return true;
  }
  finishTiltTrial(now = performance.now()): boolean {
    const t = this.trial; this.trial = null;
    this.candidate = !!t && now - t.start >= 3000 && t.maxX >= 0.12 && t.maxY >= 0.12 && !!this.identity;
    this.tiltMessage = this.candidate ? 'พบการเปลี่ยนของแกน • ยืนยันว่าขยับจากการเอียงโดยไม่ได้แตะอนาล็อก' : 'ไม่พบสัญญาณเอียงจากจอย • ลองเลือกแกนอื่น หรือใช้อนาล็อก/เซนเซอร์มือถือ';
    return this.candidate;
  }
  confirmTiltTrial(): boolean {
    if (!this.candidate || !this.identity) return false;
    this.tiltReady = true; this.readyIdentity = this.identity; this.candidate = false;
    this.tiltMessage = 'ยืนยันโดยผู้ใช้: การเอียงที่จอยแปลงเป็นอนาล็อก • ตั้งศูนย์ก่อนเล่น';
    return true;
  }
  poll(now = performance.now()): PadFrame {
    let pads: readonly (PadLike | null)[] = [];
    try { pads = this.readPads(); } catch { /* Device unavailable: report disconnected. */ }
    const pad = pads.find(p => p?.connected) ?? null;
    const identity = pad ? `${pad.index}:${pad.id}` : '';
    const disconnected = !!this.identity && identity !== this.identity;
    const changed = identity !== this.identity;
    const pair = `${this.settings.axisX}/${this.settings.axisY}`;
    if (changed || pair !== this.pair) {
      this.tiltReady = false; this.candidate = false; this.trial = null; this.center = { x: 0, y: 0 };
      if (this.readyIdentity) this.tiltMessage = 'จอยหรือคู่แกนเปลี่ยน • ทดสอบการเอียงใหม่';
    }
    this.pair = pair; this.identity = identity;
    this.raw = pad ? pad.axes.map(v => Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : null) : [];
    const buttons = pad ? pad.buttons.map(b => b.pressed || b.value >= 0.5) : [];
    const actions: Action[] = []; let pause = false;
    if (!changed && !this.suppressEdges) for (const command of ['dodgeLeft', 'dodgeRight', 'emp', 'pause'] as PadCommand[]) {
      const index = this.settings.buttons[command];
      if (buttons[index] && !this.previous[index]) { if (command === 'pause') pause = true; else actions.push(command); }
    }
    this.previous = buttons; this.suppressEdges = false;
    const selected = this.selected();
    if (this.trial && selected) {
      this.trial.maxX = Math.max(this.trial.maxX, Math.abs(selected.x - this.trial.base.x));
      this.trial.maxY = Math.max(this.trial.maxY, Math.abs(selected.y - this.trial.base.y));
    }
    let axes: Axes = { x: 0, y: 0 };
    if (pad && selected && (this.mode === 'stick' || this.tiltReady)) {
      axes = radialDeadzone(selected.x - (this.mode === 'tilt' ? this.center.x : 0), selected.y - (this.mode === 'tilt' ? this.center.y : 0), this.settings.deadzone, this.settings.sensitivity);
      if (this.mode === 'stick') {
        const dx = Number(!!buttons[15]) - Number(!!buttons[14]), dy = Number(!!buttons[13]) - Number(!!buttons[12]);
        if (dx || dy) axes = radialDeadzone(dx, dy, 0, 1);
      }
      if (this.settings.invertX) axes.x *= -1;
      if (this.settings.invertY) axes.y *= -1;
    }
    return { connected: !!pad, id: pad?.id ?? '', mapping: pad?.mapping ?? '', axes, rawAxes: [...this.raw], buttons,
      actions, pause, disconnected, tiltReady: this.tiltReady, tiltMessage: this.tiltMessage };
  }
}
