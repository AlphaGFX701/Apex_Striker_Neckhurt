/** Asset readiness is independent of the menu that the pilot is browsing. */
export class FlightAssetGate {
  progress = 0;
  artReady = false;
  sceneReady = false;
  error = '';
  get ready() { return this.artReady && this.sceneReady && !this.error; }
  get fraction() { return Math.min(1, Math.max(0, this.progress)) * .9 + (this.artReady ? .1 : 0); }
}

/** A form transaction: editing does not change live flight preferences. */
export class PreferenceDraft<T extends Record<string, string | number | boolean>> {
  private original: T;
  value: T;
  constructor(current: T) { this.original = { ...current }; this.value = { ...current }; }
  get dirty() { return Object.keys(this.original).some(k => this.value[k] !== this.original[k]); }
  apply() { this.original = { ...this.value }; return { ...this.value }; }
  discard() { this.value = { ...this.original }; return { ...this.value }; }
}
