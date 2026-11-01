import { expect, it } from 'vitest';
import { LaserTimeline } from './laser-presentation';
import { GameModel } from './model';
import { beamDistance, beamGeometry } from './neon';

it('announces charge, fire at 1.2s, and cancellation once each', () => {
  const timeline = new LaserTimeline();
  const beam = { x: 160, age: 0 };
  expect(timeline.sync([beam]).map(e => e.kind)).toEqual(['charge']);
  beam.age = 1.199;
  expect(timeline.sync([beam])).toEqual([]);
  beam.age = 1.2;
  expect(timeline.sync([beam]).map(e => e.kind)).toEqual(['fire']);
  expect(timeline.sync([beam])).toEqual([]);
  expect(timeline.sync([]).map(e => e.kind)).toEqual(['stop']);
  expect(timeline.sync([])).toEqual([]);
});

it('cancels the model laser once on EMP and does not replay after reset', () => {
  const model = new GameModel();
  model.state.beams = [{x:150, age:0}];
  expect(model.drainLaserEvents().map(e=>e.kind)).toEqual(['charge']);
  const id = model.state.beams[0].id;
  model.state.energy = 100;
  model.action('emp');
  expect(model.drainLaserEvents().map(e=>e.kind)).toEqual(['stop']);
  expect(model.drainLaserEvents()).toEqual([]);
  model.reset();
  model.state.beams = [{x:150,age:0}];
  expect(model.drainLaserEvents()[0].id).not.toBe(id);
});

it('does not replay a paused cue and fires once even if a frame crosses the threshold', () => {
  const timeline = new LaserTimeline(), beam = { x:150,age:0,sweep:true };
  timeline.sync([beam]);
  for(let i=0;i<10;i++) expect(timeline.sync([beam])).toEqual([]);
  beam.age=1.23;
  expect(timeline.sync([beam]).map(e=>e.kind)).toEqual(['fire']);
  expect(timeline.sync([beam])).toEqual([]);
  expect(timeline.sync([])[0].sweep).toBe(true);
});

it('uses the same central geometry for warning, beam and contact distance', () => {
  const beam = {x:140, age:1.2};
  expect(beamGeometry(beam)).toEqual({x1:140,y1:170,x2:140,y2:740});
  expect(beamDistance({x:140,y:500},beam)).toBe(0);
  expect(beamDistance({x:162,y:500},beam)).toBe(22);
  const sweep={x:195,y:205,age:1.9,sweep:true};
  expect(beamDistance({x:195,y:500},sweep)).toBeLessThan(.001);
});
