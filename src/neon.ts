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
export type EnemyBalanceGroup = 'standard' | 'elite' | 'boss-support';
export interface WaveBalance {
  enemyHP: number; armorHP: number; cadence: number; spawnInterval: number;
  enemyCap: number; waveSize: number; projectileScale: number; movementScale: number;
  armorCap: number; archetypes: readonly EnemyArchetype[]; formations: readonly string[];
  firstVisibleDelay: number; standardScore: number; eliteScore: number; spawnEnabled: boolean;
}
type PhaseTuning = Pick<WaveBalance, 'enemyHP'|'cadence'|'spawnInterval'|'enemyCap'|'waveSize'|'projectileScale'|'movementScale'>;
export interface GameBalanceConfig {
  bossPressure: { packetDensity:number; supportCaps:readonly [number,number,number]; waveSize:number };
  sectorThreeImpact:number;
  prebossArmorHP:Readonly<Record<number,number>>;
  stages: Readonly<Record<number, readonly [PhaseTuning,PhaseTuning,PhaseTuning]>>;
  impact: Readonly<Record<'pulse'|'plasma'|'laser'|'missile',number>>;
  transitionSeconds: number; firstVisibleDelay: number;
  movement: { fighter:number; gunner:number; bomber:number; retreat:number; crossfireX:number; crossfireY:number; kamikaze:number };
  standardScore: number; eliteScore: number;
}
export const GAME_BALANCE_CONFIG: GameBalanceConfig = {
  bossPressure:{packetDensity:1.25,supportCaps:[6,8,10],waveSize:3},sectorThreeImpact:1.2,prebossArmorHP:{1:24,2:27.2},
  stages: {
    1: [
      {enemyHP:5.85,cadence:1.2,spawnInterval:2.46,enemyCap:14,waveSize:5,projectileScale:0.9,movementScale:1},
      {enemyHP:6.3,cadence:1.6,spawnInterval:2.15,enemyCap:18,waveSize:6,projectileScale:1,movementScale:1.05},
      {enemyHP:6.75,cadence:2,spawnInterval:1.92,enemyCap:20,waveSize:6,projectileScale:1,movementScale:1.1},
    ],
    2: [
      {enemyHP:6.63,cadence:1.6,spawnInterval:3.5,enemyCap:11,waveSize:6,projectileScale:0.9,movementScale:1},
      {enemyHP:7.14,cadence:2.8,spawnInterval:2.88,enemyCap:14,waveSize:7,projectileScale:1,movementScale:1.1},
      {enemyHP:7.65,cadence:4,spawnInterval:2.5,enemyCap:18,waveSize:7,projectileScale:1,movementScale:1.15},
    ],
  },
  impact:{pulse:1.1,plasma:1.2,laser:1.05,missile:1}, transitionSeconds:5,firstVisibleDelay:0.5,
  movement:{fighter:60,gunner:82,bomber:135,retreat:150,crossfireX:60,crossfireY:15,kamikaze:270},standardScore:40,eliteScore:90,
};
/** Null explicitly preserves legacy rules outside pre-boss sectors 2/3. */
export function getStageBalance(stage:number,time:number,mode:string,bossSupport=false):WaveBalance|null {
  const phases=GAME_BALANCE_CONFIG.stages[stage];
  if(!phases || mode!=='stage' || bossSupport || time>=120) return null;
  const index=time<30?0:time<75?1:2;
  const previous=phases[Math.max(0,index-1)],current=phases[index];
  const blend=index===0?1:Math.min(1,(time-(index===1?30:75))/GAME_BALANCE_CONFIG.transitionSeconds);
  const mix=(key:'enemyHP'|'cadence'|'spawnInterval'|'projectileScale'|'movementScale'|'enemyCap'|'waveSize')=>previous[key]+(current[key]-previous[key])*blend;
  const archetypes: EnemyArchetype[]=time<30?['fighter']:time<45?['fighter','crossfire','kamikaze']:['fighter','crossfire','kamikaze','rear-gunner','shield-wall'];
  return {...current,enemyHP:mix('enemyHP'),cadence:mix('cadence'),spawnInterval:mix('spawnInterval'),projectileScale:mix('projectileScale'),movementScale:mix('movementScale'),
    enemyCap:Math.floor(mix('enemyCap')),waveSize:Math.floor(mix('waveSize')),
    armorHP:GAME_BALANCE_CONFIG.prebossArmorHP[stage]??DIFFICULTY[stage].armorHP,armorCap:time<45?0:time<75?1:2,archetypes,
    formations:time<30?['line','vee']:time<45?['line','vee','semicircle','zigzag','crossfire']:time<75?['semicircle','zigzag','crossfire','escort','turrets']:['semicircle','zigzag','crossfire','escort','turrets','wall','bombers'],
    firstVisibleDelay:GAME_BALANCE_CONFIG.firstVisibleDelay,standardScore:GAME_BALANCE_CONFIG.standardScore,eliteScore:GAME_BALANCE_CONFIG.eliteScore,
    spawnEnabled:!(time>=88.5 && time<92)};
}
export function standardImpact(group:EnemyBalanceGroup|undefined,balanced:boolean,type:'pulse'|'plasma'|'laser'|'missile') {
  return balanced && group==='standard'?GAME_BALANCE_CONFIG.impact[type]:1;
}
export function getBossPressure(stage:number,mode:string) {
  return mode==='endless' ? {packetDensity:1,supportCap:DIFFICULTY[stage].supportCap,waveSize:2}
    : {packetDensity:GAME_BALANCE_CONFIG.bossPressure.packetDensity,supportCap:GAME_BALANCE_CONFIG.bossPressure.supportCaps[stage],waveSize:GAME_BALANCE_CONFIG.bossPressure.waveSize};
}
export const sectorEnemyImpact=(stage:number,mode:string)=>stage===2 && mode!=='endless' ? GAME_BALANCE_CONFIG.sectorThreeImpact : 1;
export type BossPattern = 'fan' | 'spiral' | 'aimed' | 'ring' | 'dash' | 'overload' | 'barrage';
export interface HazardState {
  kind: 'grid'; x: number; y: number;
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
