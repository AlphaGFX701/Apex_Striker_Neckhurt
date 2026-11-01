import { describe, expect, it } from 'vitest';
import { getStageBalance, standardImpact } from './neon';
import { GameModel } from './model';
import { defaultRun } from './equipment';
import { formationSpecs } from './stage-waves';

function run(stage:number) {
  const m=new GameModel(),config=defaultRun();config.stage=stage;config.seed=743;
  m.configure(config);m.reset();m.practice=true;return m;
}

describe('smoother sector two and three balance', () => {
  it('keeps revised HP and blends only new-spawn values', () => {
    for (const [stage, original, middle, late] of [[1,9,6.3,6.75],[2,10.2,7.14,7.65]]) {
      expect(getStageBalance(stage,0,'stage')!.enemyHP).toBeCloseTo(original*.65);
      expect(getStageBalance(stage,30,'stage')!.enemyHP).toBeCloseTo(original*.65);
      expect(getStageBalance(stage,32.5,'stage')!.enemyHP).toBeCloseTo((original*.65+middle)/2);
      expect(getStageBalance(stage,35,'stage')!.enemyHP).toBeCloseTo(middle);
      expect(getStageBalance(stage,80,'stage')!.enemyHP).toBeCloseTo(late);
    }
  });
  it('does not affect stage one, Endless or boss support', () => {
    expect(getStageBalance(0,10,'stage')).toBeNull();
    expect(getStageBalance(2,10,'endless')).toBeNull();
    expect(getStageBalance(2,10,'stage',true)).toBeNull();
    expect(getStageBalance(2,120,'stage')).toBeNull();
  });
  it('gates armor and homing until45 seconds, then limits armor to one before75', () => {
    for(const stage of [1,2]) {
      expect(getStageBalance(stage,29,'stage')!.archetypes).toEqual(['fighter']);
      expect(getStageBalance(stage,44.99,'stage')!.armorCap).toBe(0);
      expect(getStageBalance(stage,45,'stage')!.armorCap).toBe(1);
      expect(getStageBalance(stage,75,'stage')!.armorCap).toBe(2);
    }
  });
  it('stops spawning for the mini-boss handoff without stopping game time', () => {
    for(const time of [88.5,90,91.99]) expect(getStageBalance(1,time,'stage')!.spawnEnabled).toBe(false);
    expect(getStageBalance(1,92,'stage')!.spawnEnabled).toBe(true);
  });
  it('keeps weapon impact separate from evolution and applies it only to standard hulls', () => {
    expect(standardImpact('standard',true,'pulse')).toBe(1.1);
    expect(standardImpact('standard',true,'plasma')).toBe(1.2);
    expect(standardImpact('standard',true,'laser')).toBe(1.05);
    for(const group of ['elite','boss-support',undefined] as const) expect(standardImpact(group,true,'pulse')).toBe(1);
    expect(standardImpact('standard',false,'pulse')).toBe(1);
    expect(standardImpact('standard',true,'missile')).toBe(1);
  });
  it.each([1,2])('spawns sector %i intro ships at reduced HP, without elite archetypes',stage=>{
    const m=run(stage);
    for(let i=0;i<500 && !m.state.enemies.length;i++){m.state.bullets=[];m.update(.01,{x:0,y:0});}
    expect(m.state.enemies.length).toBeGreaterThan(0);
    expect(m.state.enemies.length).toBeLessThanOrEqual(stage===1?5:6);
    for(const enemy of m.state.enemies) {
      expect(enemy.health).toBeCloseTo(stage===1?5.85:6.63);
      expect(enemy.archetype).toBe('fighter');expect(enemy.shieldHP).toBe(0);
    }
  });
  it('waits half a visible second before the first intro attack',()=>{
    const m=run(1);let tested=false;
    for(let i=0;i<650;i++) {
      m.state.bullets=[];m.state.enemyBullets=[];m.update(.01,{x:0,y:0});
      for(const enemy of m.state.enemies) {
        if((enemy.visibleTime??0)>0 && (enemy.visibleTime??0)<.49) expect(enemy.hasFired).toBe(false);
        if(enemy.hasFired) {expect(enemy.visibleTime).toBeGreaterThanOrEqual(.5);tested=true;}
      }
    }
    expect(tested).toBe(true);
  });
  it('centers the configured five/six-ship Line and V instead of truncating a wing',()=>{
    for(const count of [5,6]) for(const formation of ['line','vee'] as const) {
      const ships=formationSpecs(formation,2,195,count);
      expect(ships).toHaveLength(count);
      expect(ships[0].x).toBe(35);expect(ships[count-1].x).toBe(355);
      for(let i=0;i<count;i++) {
        expect(ships[i].x+ships[count-1-i].x).toBeCloseTo(390);
        expect(ships[i].y).toBeCloseTo(ships[count-1-i].y);
      }
    }
  });
  it('does not heal an existing ship at phase boundaries or spawn during the miniboss handoff',()=>{
    const m=run(1);m.state.time=29.99;
    const enemy={x:23,y:200,radius:16,health:2,shot:99,phase:0,age:0,balance:getStageBalance(1,0,'stage')!,balanceGroup:'standard' as const};
    m.state.enemies=[enemy];m.update(.02,{x:0,y:0});expect(enemy.health).toBe(2);
    m.state.time=88.49;m.state.enemies=[];
    for(let i=0;i<350;i++){m.state.bullets=[];m.update(.01,{x:0,y:0});expect(m.state.enemies).toHaveLength(0);}
    expect(m.state.time).toBeGreaterThan(91.9);expect(m.state.miniBoss).not.toBeNull();
  });
  it.each(['pulse','plasma','laser'] as const)('applies %s impact to standard hulls through the real collision path only',type=>{
    for(const group of ['standard','elite','boss-support'] as const) {
      const m=run(1);const enemy={x:195,y:250,radius:16,health:20,shot:99,phase:0,age:0,balance:getStageBalance(1,0,'stage')!,balanceGroup:group};
      m.state.enemies=[enemy];
      if(type==='laser') {
        m.config.equipment.main='laser';for(let i=0;i<11;i++)m.update(.01,{x:0,y:0});
        expect(20-enemy.health).toBeCloseTo(.97*(group==='standard'?1.05:1));
      } else {
        m.state.bullets=[{x:195,y:250,radius:4,speed:0,damage:1,type}];m.update(.001,{x:0,y:0});
        expect(20-enemy.health).toBeCloseTo(group==='standard'?(type==='pulse'?1.1:1.2):1);
      }
    }
  });
});
