import {expect,it} from 'vitest';
import {GameModel} from './model';
import {defaultRun} from './equipment';
import {getStageBalance,DIFFICULTY,getBossPressure,ORB_SUPPLY_TIMES} from './neon';

it('increases sector2 arrivals while preserving its HP and formation size',()=>{
  for(const [i,time]of [0,35,80].entries()){
    const b=getStageBalance(1,time,'stage')!;
    expect(b.spawnInterval).toBeCloseTo([2.46,2.15,1.92][i]);
    expect(b.enemyCap).toBe([14,18,20][i]);expect(b.enemyHP).toBeCloseTo([5.85,6.3,6.75][i]);
    expect(b.waveSize).toBe([5,6,6][i]);
  }
});
it('reduces sector3 preboss arrivals and armor without leaking into commanders or Endless',()=>{
  for(const [i,time]of [0,35,80].entries()){
    const b=getStageBalance(2,time,'stage')!;
    expect(b.spawnInterval).toBeCloseTo([3.5,2.88,2.5][i]);expect(b.enemyCap).toBe([11,14,18][i]);
    expect(b.enemyHP).toBeCloseTo([6.63,7.14,7.65][i]);expect(b.armorHP).toBeCloseTo(27.2);
  }
  expect(DIFFICULTY[2].armorHP).toBe(32);expect(getBossPressure(2,'stage').supportCap).toBe(10);
  expect(getStageBalance(2,119,'endless')).toBeNull();expect(getStageBalance(2,120,'stage')).toBeNull();
  expect(ORB_SUPPLY_TIMES).toEqual([32,78,124,170,216]);
});
it('uses balanced armor HP for both the actual hull and shield on spawn',()=>{
  const m=new GameModel(),c=defaultRun();c.stage=2;c.seed=743;m.configure(c);m.reset();m.practice=true;m.state.time=45;
  let found=false;
  for(let i=0;i<600&&!found;i++){
    m.state.bullets=[];m.update(.05,{x:0,y:0});m.drainEvents();
    const armor=m.state.enemies.find(e=>e.kind===2);
    if(armor){expect(armor.health).toBeCloseTo(27.2);expect(armor.shieldHP).toBeCloseTo(9.52);found=true;}
  }
  expect(found).toBe(true);
});
