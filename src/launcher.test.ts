import { describe, it, expect } from 'vitest';
import { FlightAssetGate, PreferenceDraft } from './launcher';

describe('launcher readiness', () => {
  it('does not permit launch until both artwork and scene are ready, or after a failure', () => {
    const gate = new FlightAssetGate();
    gate.progress = .6;
    expect(gate.ready).toBe(false);
    gate.artReady = true;
    expect(gate.ready).toBe(false);
    gate.sceneReady = true;
    expect(gate.ready).toBe(true);
    gate.error = 'Missing texture';
    expect(gate.ready).toBe(false);
  });
});

describe('preferences form', () => {
  it('keeps live values unchanged until Apply, and discards subsequent changes', () => {
    const live = { music: true, volume: .35, source: 'sensor' };
    const form = new PreferenceDraft(live);
    form.value.volume = .7;
    expect(live.volume).toBe(.35);
    expect(form.dirty).toBe(true);
    expect(form.apply().volume).toBe(.7);
    expect(form.dirty).toBe(false);
    form.value.source = 'manual';
    expect(form.discard().source).toBe('sensor');
    expect(form.value.volume).toBe(.7);
  });
});
