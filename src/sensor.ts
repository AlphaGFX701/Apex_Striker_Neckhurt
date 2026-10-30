import { Capacitor } from "@capacitor/core";
import { GestureDetector, magnitude, type Action, type Vector } from "./motion";

export type SensorState =
  | "idle"
  | "waiting"
  | "active"
  | "denied"
  | "unavailable"
  | "stale"
  | "recalibrate";
export interface Telemetry {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  acceleration: Vector;
  rotation: { alpha: number | null; beta: number | null; gamma: number | null };
  hz: number | null;
  motionHz: number | null;
  state: SensorState;
  message: string;
  calibrated: boolean;
  motionState:
    | "idle"
    | "waiting"
    | "active"
    | "denied"
    | "unavailable"
    | "stale";
  estimated: boolean;
  strength: number | null;
  roll: number | null;
  lastGesture: Action | null;
  gestureTime: number;
  motionMessage: string;
}
export interface Axes {
  x: number;
  y: number;
}
const emptyVector = (): Vector => ({ x: null, y: null, z: null });
const finite = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const vector = (
  v?: { x: number | null; y: number | null; z: number | null } | null,
): Vector => ({ x: finite(v?.x), y: finite(v?.y), z: finite(v?.z) });
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const deltaAngle = (current: number, center: number) =>
  ((current - center + 540) % 360) - 180;
export function screenAxes(beta: number, gamma: number, angle: number): Axes {
  const rotation = ((angle % 360) + 360) % 360;
  if (rotation === 90) return { x: beta, y: -gamma };
  if (rotation === 180) return { x: -gamma, y: -beta };
  if (rotation === 270) return { x: -beta, y: gamma };
  return { x: gamma, y: beta };
}
export function normalizeAxis(
  degrees: number,
  sensitivity: number,
  deadZone = 3,
): number {
  if (Math.abs(degrees) <= deadZone) return 0;
  const range = clamp(28 / sensitivity, 9, 65);
  return (
    Math.sign(degrees) *
    clamp((Math.abs(degrees) - deadZone) / (range - deadZone), 0, 1)
  );
}
export class TiltFilter {
  private center: Axes | null = null;
  private smoothed: Axes = { x: 0, y: 0 };
  private sensitivity = 1;
  setSensitivity(v: number) {
    this.sensitivity = clamp(v, 0.5, 2);
  }
  calibrate(raw: Axes) {
    this.center = { ...raw };
    this.resetOutput();
  }
  resetOutput() {
    this.smoothed = { x: 0, y: 0 };
  }
  clear() {
    this.center = null;
    this.resetOutput();
  }
  get calibrated() {
    return this.center !== null;
  }
  update(raw: Axes, dt = 1 / 60): Axes {
    if (!this.center) return { x: 0, y: 0 };
    const blend = 1 - Math.exp(-Math.min(Math.max(dt, 0), 0.1) / 0.065);
    this.smoothed.x +=
      (normalizeAxis(deltaAngle(raw.x, this.center.x), this.sensitivity) -
        this.smoothed.x) *
      blend;
    this.smoothed.y +=
      (normalizeAxis(deltaAngle(raw.y, this.center.y), this.sensitivity) -
        this.smoothed.y) *
      blend;
    return { ...this.smoothed };
  }
}
type PermissionEvent = {
  requestPermission?: () => Promise<"granted" | "denied">;
};
export class SensorController {
  private filter = new TiltFilter();
  private detector = new GestureDetector();
  private latest: Axes | null = null;
  private orientationAt = 0;
  private motionAt = 0;
  private motionValidAt = 0;
  private startedAt = 0;
  private screenAngle = this.getScreenAngle();
  private active = false;
  private gestureActive = false;
  private pending: Action[] = [];
  private gravity: { x: number; y: number; z: number } | null = null;
  private gravityAt = 0;
  private estimateReadyAt = 0;
  private listeners = new Set<(t: Telemetry) => void>();
  private gestureListeners = new Set<(action: Action) => void>();
  readonly telemetry: Telemetry = {
    alpha: null,
    beta: null,
    gamma: null,
    acceleration: emptyVector(),
    rotation: { alpha: null, beta: null, gamma: null },
    hz: null,
    motionHz: null,
    state: "idle",
    message: "Enable sensors, hold your phone comfortably, then set center.",
    calibrated: false,
    motionState: "idle",
    estimated: false,
    strength: null,
    roll: null,
    lastGesture: null,
    gestureTime: 0,
    motionMessage: "Motion is off.",
  };
  constructor() {
    window.addEventListener("orientationchange", this.onScreenChange);
    window.screen.orientation?.addEventListener?.(
      "change",
      this.onScreenChange,
    );
  }
  subscribe(listener: (t: Telemetry) => void) {
    this.listeners.add(listener);
    listener(this.telemetry);
    return () => this.listeners.delete(listener);
  }
  onGesture(listener: (action: Action) => void) {
    this.gestureListeners.add(listener);
    return () => this.gestureListeners.delete(listener);
  }
  private publish() {
    this.telemetry.calibrated = this.filter.calibrated;
    this.listeners.forEach((l) => l(this.telemetry));
  }
  private setState(state: SensorState, message: string) {
    this.telemetry.state = state;
    this.telemetry.message = message;
    this.publish();
  }
  private getScreenAngle() {
    return window.screen.orientation?.angle ?? (window.orientation || 0);
  }
  async enable() {
    if (!window.isSecureContext && !Capacitor.isNativePlatform()) {
      this.setState(
        "unavailable",
        "Sensors require HTTPS. Touch and keyboard controls remain available.",
      );
      return false;
    }
    if (
      this.active &&
      !["unavailable", "stale", "denied"].includes(this.telemetry.state) &&
      !["unavailable", "stale", "denied"].includes(this.telemetry.motionState)
    )
      return true;
    window.removeEventListener("deviceorientation", this.onOrientation);
    window.removeEventListener("devicemotion", this.onMotion);
    const request = (type: PermissionEvent | undefined) => {
      try {
        return type?.requestPermission
          ? type.requestPermission()
          : Promise.resolve(type ? "granted" : "unavailable");
      } catch {
        return Promise.resolve("denied");
      }
    };
    // Both permission requests originate synchronously in the button activation on iOS.
    const orientationRequest = request(
      window.DeviceOrientationEvent as PermissionEvent | undefined,
    );
    const motionRequest = request(
      window.DeviceMotionEvent as PermissionEvent | undefined,
    );
    const [orientation, motion] = await Promise.allSettled([
      orientationRequest,
      motionRequest,
    ]);
    const tilt =
      orientation.status === "fulfilled" ? orientation.value : "denied";
    const movement = motion.status === "fulfilled" ? motion.value : "denied";
    this.startedAt = performance.now();
    this.orientationAt = 0;
    this.motionAt = 0;
    this.motionValidAt = 0;
    this.latest = null;
    this.filter.clear();
    this.telemetry.hz = null;
    this.telemetry.motionHz = null;
    this.telemetry.alpha = null;
    this.telemetry.beta = null;
    this.telemetry.gamma = null;
    this.resetTransient();
    this.telemetry.motionState =
      movement === "granted"
        ? "waiting"
        : movement === "denied"
          ? "denied"
          : "unavailable";
    this.telemetry.motionMessage =
      movement === "granted"
        ? "Waiting for motion data..."
        : "Motion unavailable. Use the dodge and EMP buttons, or check this site's Motion permission.";
    if (tilt === "granted")
      window.addEventListener("deviceorientation", this.onOrientation);
    if (movement === "granted")
      window.addEventListener("devicemotion", this.onMotion);
    this.active = tilt === "granted" || movement === "granted";
    if (tilt === "granted")
      this.setState(
        "waiting",
        "Waiting for tilt data. Move your phone slightly.",
      );
    else
      this.setState(
        tilt === "denied" ? "denied" : "unavailable",
        "Tilt permission or data unavailable. Check Motion permissions, reload, or select touch controls.",
      );
    return this.active;
  }
  calibrate() {
    if (
      !this.latest ||
      !this.orientationAt ||
      performance.now() - this.orientationAt > 1500
    ) {
      this.setState(
        "waiting",
        "No recent tilt data. Move your phone and try setting center again.",
      );
      return false;
    }
    this.filter.calibrate(this.latest);
    this.resetTransient();
    this.setState(
      "active",
      "Center set. Tilt to fly, flick to dodge, shake to deploy EMP.",
    );
    return true;
  }
  setSensitivity(v: number) {
    this.filter.setSensitivity(v);
  }
  setGestureSensitivity(v: number) {
    this.detector.sensitivity = clamp(v, 0.6, 1.5);
    this.resetTransient();
  }
  setGestureActive(active: boolean) {
    if (active !== this.gestureActive) {
      this.gestureActive = active;
      this.resetTransient();
    }
  }
  resetTransient() {
    this.filter.resetOutput();
    this.detector.reset(performance.now());
    this.pending = [];
    this.gravity = null;
    this.gravityAt = 0;
    this.estimateReadyAt = performance.now() + 700;
  }
  consumeActions(): Action[] {
    const actions = this.pending;
    this.pending = [];
    return actions;
  }
  getAxes(dt = 1 / 60): Axes {
    if (this.telemetry.state !== "active" || !this.latest)
      return { x: 0, y: 0 };
    return this.filter.update(this.latest, dt);
  }
  tick(now = performance.now()) {
    if (!this.active) return;
    if (
      !this.orientationAt &&
      now - this.startedAt > 3000 &&
      this.telemetry.state === "waiting"
    ) {
      this.setState(
        "unavailable",
        "No tilt data received. Check HTTPS and Motion permission, then enable sensors again.",
      );
    } else if (
      this.orientationAt &&
      now - this.orientationAt > 1500 &&
      this.telemetry.state === "active"
    ) {
      this.telemetry.alpha = null;
      this.telemetry.beta = null;
      this.telemetry.gamma = null;
      this.telemetry.hz = null;
      this.resetTransient();
      this.setState(
        "stale",
        "Tilt signal stopped. Flight paused; move the phone and try again.",
      );
    }
    if (
      (!this.motionValidAt && now - this.startedAt > 3000) ||
      (this.motionValidAt && now - this.motionValidAt > 1500)
    ) {
      if (
        this.telemetry.motionState === "active" ||
        this.telemetry.motionState === "waiting"
      ) {
        this.telemetry.motionState = this.motionValidAt
          ? "stale"
          : "unavailable";
        this.telemetry.motionMessage =
          "No recent motion data. Use the dodge and EMP buttons.";
        this.telemetry.acceleration = emptyVector();
        this.telemetry.strength = null;
        this.telemetry.roll = null;
        this.telemetry.rotation = { alpha: null, beta: null, gamma: null };
        this.telemetry.motionHz = null;
        this.resetTransient();
        this.publish();
      }
    }
    if (
      this.telemetry.state === "unavailable" &&
      this.telemetry.motionState !== "active"
    ) {
      this.active = false;
      window.removeEventListener("deviceorientation", this.onOrientation);
      window.removeEventListener("devicemotion", this.onMotion);
    }
  }
  private smoothHz(previous: number | null, gap: number) {
    return previous === null || gap > 1000
      ? 1000 / gap
      : previous * 0.8 + 200 / gap;
  }
  private onOrientation = (event: DeviceOrientationEvent) => {
    const beta = finite(event.beta),
      gamma = finite(event.gamma);
    if (beta === null || gamma === null) return;
    const now = performance.now();
    if (this.orientationAt && now > this.orientationAt)
      this.telemetry.hz = this.smoothHz(
        this.telemetry.hz,
        now - this.orientationAt,
      );
    this.orientationAt = now;
    Object.assign(this.telemetry, { alpha: finite(event.alpha), beta, gamma });
    this.latest = screenAxes(beta, gamma, this.screenAngle);
    if (["waiting", "stale", "unavailable"].includes(this.telemetry.state))
      this.setState(
        this.filter.calibrated ? "active" : "recalibrate",
        this.filter.calibrated
          ? "Sensors ready."
          : "Tilt data received. Hold comfortably and set center.",
      );
    else this.publish();
  };
  private onMotion = (event: DeviceMotionEvent) => {
    const now = performance.now(),
      gap = this.motionAt ? now - this.motionAt : 16;
    if (gap > 220) this.resetTransient();
    if (this.motionAt && gap > 0)
      this.telemetry.motionHz = this.smoothHz(this.telemetry.motionHz, gap);
    this.motionAt = now;
    const direct = vector(event.acceleration);
    let acceleration = direct;
    this.telemetry.estimated = false;
    if (magnitude(direct) === null) {
      const total = vector(event.accelerationIncludingGravity);
      if (magnitude(total) !== null) {
        this.telemetry.estimated = true;
        if (!this.gravity) {
          this.gravity = { x: total.x!, y: total.y!, z: total.z! };
          this.gravityAt = now;
        }
        const blend = 1 - Math.exp(-Math.max(0, now - this.gravityAt) / 500);
        this.gravityAt = now;
        for (const axis of ["x", "y", "z"] as const)
          this.gravity[axis] += (total[axis]! - this.gravity[axis]) * blend;
        acceleration =
          now < this.estimateReadyAt
            ? emptyVector()
            : {
                x: total.x! - this.gravity.x,
                y: total.y! - this.gravity.y,
                z: total.z! - this.gravity.z,
              };
      }
    }
    const rotation = {
      alpha: finite(event.rotationRate?.alpha),
      beta: finite(event.rotationRate?.beta),
      gamma: finite(event.rotationRate?.gamma),
    };
    const roll =
      rotation.beta !== null && rotation.gamma !== null
        ? screenAxes(rotation.beta, rotation.gamma, this.screenAngle).x
        : this.screenAngle === 0
          ? rotation.gamma
          : null;
    const hasData =
      magnitude(acceleration) !== null ||
      Object.values(rotation).some((v) => v !== null);
    if (hasData) this.motionValidAt = now;
    Object.assign(this.telemetry, {
      acceleration,
      rotation,
      roll,
      strength: magnitude(acceleration),
      motionState: hasData ? "active" : "waiting",
      motionMessage: hasData
        ? this.telemetry.estimated
          ? "Estimated acceleration: gravity removed using a filter."
          : "Device-reported linear acceleration. Motion active."
        : "Waiting for valid acceleration or rotation data...",
    });
    if (hasData && roll === null)
      this.telemetry.motionMessage +=
        " No rotation axis available; use dodge buttons.";
    if (hasData && magnitude(acceleration) === null)
      this.telemetry.motionMessage +=
        " No acceleration for shake detection; use the EMP button.";
    if (
      this.gestureActive &&
      this.filter.calibrated &&
      this.telemetry.state === "active"
    ) {
      const action = this.detector.update({ time: now, acceleration, roll });
      if (action) {
        this.pending.push(action);
        this.pending = this.pending.slice(-4);
        this.telemetry.lastGesture = action;
        this.telemetry.gestureTime = now;
        this.gestureListeners.forEach((l) => l(action));
      }
    }
    this.publish();
  };
  private onScreenChange = () => {
    const next = this.getScreenAngle();
    if (next === this.screenAngle) return;
    this.screenAngle = next;
    this.filter.clear();
    this.latest = null;
    this.resetTransient();
    if (this.active)
      this.setState(
        "recalibrate",
        "Screen rotated. Hold comfortably and set center again.",
      );
  };
}
