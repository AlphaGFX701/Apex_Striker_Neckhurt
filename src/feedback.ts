/** Synthesized effects only; AudioContext is unlocked by a user button. */
export class Feedback {
  private context: AudioContext | null = null;
  enabled = true;
  haptics = false;
  unlock() {
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {
      /* Audio optional. */
    }
  }
  play(kind: "dodge" | "emp" | "hit" | "end" | "pulse" | "plasma" | "laser") {
    if (this.enabled && this.context?.state === "running") {
      const ctx = this.context,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      const firing = ["pulse", "plasma", "laser"].includes(kind);
      const length = firing ? 0.045 : kind === "emp" ? 0.5 : 0.16;
      osc.type =
        kind === "plasma"
          ? "triangle"
          : kind === "pulse"
            ? "square"
            : kind === "hit"
              ? "triangle"
              : "sine";
      osc.frequency.setValueAtTime(
        kind === "pulse"
          ? 1100
          : kind === "plasma"
            ? 380
            : kind === "laser"
              ? 1500
              : kind === "emp"
                ? 170
                : kind === "hit"
                  ? 95
                  : kind === "end"
                    ? 620
                    : 420,
        ctx.currentTime,
      );
      osc.frequency.exponentialRampToValueAtTime(
        kind === "emp" ? 40 : kind === "hit" ? 40 : 850,
        ctx.currentTime + length,
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        firing ? 0.014 : 0.1,
        ctx.currentTime + 0.01,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + length);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + length);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    if (
      !["pulse", "plasma", "laser"].includes(kind) &&
      this.haptics &&
      typeof navigator.vibrate === "function"
    )
      navigator.vibrate(kind === "emp" ? [35, 35, 60] : 20);
  }
}
