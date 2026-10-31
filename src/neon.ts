/** One source of truth for stage pressure. Cadence changes density, not projectile speed. */
export interface DifficultyProfile {
  enemyHP: number; armorHP: number; bossHP: number; enemyCap: number; exposedDamage: number;
  supportCap: number; cadence: number; phases: number;
}
export const DIFFICULTY: readonly DifficultyProfile[] = [
  { exposedDamage: 1, enemyHP: 6, armorHP: 16, bossHP: 900, enemyCap: 14, supportCap: 4, cadence: 1, phases: 2 },
  { exposedDamage: 1.2, enemyHP: 9, armorHP: 24, bossHP: 1200, enemyCap: 18, supportCap: 6, cadence: 2, phases: 3 },
  { exposedDamage: 1.8, enemyHP: 12, armorHP: 32, bossHP: 1500, enemyCap: 22, supportCap: 8, cadence: 4, phases: 3 },
];
export type EnemyArchetype = 'fighter' | 'kamikaze' | 'shield-wall' | 'rear-gunner' | 'crossfire';
export type BossPattern = 'fan' | 'spiral' | 'aimed' | 'ring' | 'dash' | 'overload' | 'barrage';
export interface HazardState {
  kind: 'black-hole' | 'plasma' | 'grid'; x: number; y: number;
  age: number; radius: number; hp: number;
}
export interface SuperModeState { remaining: number }
export interface EndingSequence { kind: 'victory' | 'defeat' | 'practice' | 'withdrawn'; elapsed: number; duration: number }
export const superMultiplier = (s: SuperModeState) => s.remaining > 0 ? 2 : 1;
export const ORB_SUPPLY_TIMES = [32, 78, 124, 170, 216] as const;
export const endingDuration = (kind: EndingSequence['kind']) => kind === 'victory' ? 4 : kind === 'defeat' ? 2.3 : 0;
export function beamGeometry(beam: { x:number; y?:number; age:number; sweep?:boolean }) {
  if(!beam.sweep) return { x1:beam.x,y1:170,x2:beam.x,y2:740 };
  const angle=-Math.PI/2+Math.PI*Math.max(0,Math.min(1,(beam.age-1.2)/1.4));
  return {x1:beam.x,y1:beam.y??205,x2:beam.x+Math.sin(angle)*800,y2:(beam.y??205)+Math.cos(angle)*800};
}
export function beamDistance(point:{x:number;y:number},beam:Parameters<typeof beamGeometry>[0]) {
  const g=beamGeometry(beam),dx=g.x2-g.x1,dy=g.y2-g.y1;
  const t=Math.max(0,Math.min(1,((point.x-g.x1)*dx+(point.y-g.y1)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(point.x-g.x1-t*dx,point.y-g.y1-t*dy);
}
/** Centre shifts only after the previous volley clears the lower arena. */
export function nextEscapeLane(current: number, player: number, serial: number) {
  const desired = Math.max(65, Math.min(325, player + (serial % 2 ? 65 : -65)));
  return Math.max(65, Math.min(325, current + Math.max(-75, Math.min(75, desired - current))));
}
