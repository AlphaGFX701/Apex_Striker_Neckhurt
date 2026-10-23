import { describe, expect, it } from 'vitest';
import { GestureDetector, type Action } from './motion';

function stream(detector: GestureDetector, samples: { t: number; a?: number; r?: number | null }[]) {
  const actions: Action[] = [];
  for (const s of samples) {
    const action = detector.update({ time: s.t, acceleration: { x: s.a ?? 0, y: 0, z: 0 }, roll: s.r ?? 0 });
    if (action) actions.push(action);
  }
  return actions;
}
describe('motion gesture arbitration', () => {
  it('does not fire on slow tilting, isolated impact, or sustained acceleration', () => {
    const d = new GestureDetector();
    expect(stream(d, Array.from({ length: 100 }, (_, i) => ({ t: 1000 + i * 16, a: i === 20 ? 18 : 0.4, r: 40 })))).toEqual([]);
    d.reset();
    expect(stream(d, Array.from({ length: 100 }, (_, i) => ({ t: 1000 + i * 16, a: 15, r: 0 })))).toEqual([]);
  });
  it('requires accumulated fast rotation and emits only one dodge during its lockout', () => {
    for (const sign of [-1, 1]) {
      const d = new GestureDetector();
      const actions = stream(d, Array.from({ length: 35 }, (_, i) => ({ t: 1000 + i * 16, r: sign * 200 })));
      expect(actions).toEqual([sign < 0 ? 'dodgeLeft' : 'dodgeRight']);
    }
  });
  it('detects three alternating peaks without a simultaneous dodge', () => {
    const d = new GestureDetector();
    const samples = Array.from({ length: 40 }, (_, i) => ({ t: 1000 + i * 16, a: i === 1 || i === 17 ? 16 : i === 9 ? -16 : 0, r: i < 20 ? 200 : 0 }));
    expect(stream(d, samples)).toEqual(['emp']);
  });
  it('clears partial shakes and rotation after reset or a data gap', () => {
    const d = new GestureDetector();
    stream(d, [{ t: 1000, a: 16 }, { t: 1050 }, { t: 1120, a: -16 }]);
    d.reset(1200);
    expect(stream(d, [{ t: 1900, a: 16 }, { t: 1950 }, { t: 2200, r: 250 }])).toEqual([]);
  });
  it('works at different motion event rates', () => {
    for (const hz of [30, 60, 100]) {
      const d = new GestureDetector();
      expect(stream(d, Array.from({ length: Math.round(hz * 0.3) }, (_, i) => ({ t: 1000 + i * 1000 / hz, r: 200 })))).toEqual(['dodgeRight']);
    }
  });
});
