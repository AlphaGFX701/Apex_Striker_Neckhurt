export type Action = 'dodgeLeft' | 'dodgeRight' | 'emp';
export interface Vector { x: number | null; y: number | null; z: number | null }
export interface MotionSample { time: number; acceleration: Vector; roll: number | null }
export const magnitude = (v: Vector): number | null => v.x === null || v.y === null || v.z === null ? null : Math.hypot(v.x, v.y, v.z);

/** Pure recognizer: milliseconds, m/s², degrees/second. */
export class GestureDetector {
  private previous = 0;
  private blockedUntil = 0;
  private shakeUntil = 0;
  private peaks: { time: number; direction: number }[] = [];
  private peakHigh = false;
  private rollAngle = 0;
  private rollStart = 0;
  private rollSign = 0;
  sensitivity = 1;
  reset(now = 0) {
    this.previous = 0; this.blockedUntil = now + 650; this.shakeUntil = 0;
    this.peaks = []; this.peakHigh = false; this.rollAngle = 0; this.rollStart = 0; this.rollSign = 0;
  }
  update(s: MotionSample): Action | null {
    const gap = this.previous ? s.time - this.previous : 16; this.previous = s.time;
    if (gap > 220 || gap <= 0) { this.reset(s.time); return null; }
    if (s.time < this.blockedUntil) return null;
    const strength = magnitude(s.acceleration), threshold = 11 / this.sensitivity;
    this.peaks = this.peaks.filter(p => s.time - p.time <= 700);
    if (strength !== null) {
      if (strength < threshold * 0.45) this.peakHigh = false;
      if (strength > threshold * 0.72) { this.shakeUntil = s.time + 220; this.rollAngle = 0; }
      if (strength >= threshold && !this.peakHigh) {
        this.peakHigh = true;
        const values = [s.acceleration.x!, s.acceleration.y!, s.acceleration.z!];
        const dominant = values.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a);
        const direction = Math.sign(dominant), last = this.peaks.at(-1);
        if (!last || (s.time - last.time >= 80 && direction !== last.direction)) this.peaks.push({ time: s.time, direction });
        if (this.peaks.length >= 3) { this.reset(s.time); this.blockedUntil = s.time + 900; return 'emp'; }
      }
    }
    if (s.time < this.shakeUntil || this.peaks.length > 0) return null;
    if (s.roll === null || Math.abs(s.roll) < 140 / this.sensitivity) { this.rollAngle = 0; this.rollSign = 0; return null; }
    const sign = Math.sign(s.roll);
    if (sign !== this.rollSign || s.time - this.rollStart > 220) { this.rollAngle = 0; this.rollStart = s.time; this.rollSign = sign; }
    this.rollAngle += Math.abs(s.roll) * Math.min(gap / 1000, 0.05);
    if (this.rollAngle < 12) return null;
    this.reset(s.time); this.blockedUntil = s.time + 850;
    return sign < 0 ? 'dodgeLeft' : 'dodgeRight';
  }
}
