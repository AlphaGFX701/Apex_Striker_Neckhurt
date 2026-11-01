import { describe, expect, it } from "vitest";
import { GameModel, type Enemy } from "./model";
import { defaultRun, type DamageType } from "./equipment";
import { getStageBalance, getBossPressure } from "./neon";

function run(stage = 0) {
  const m = new GameModel(), c = defaultRun(); c.stage = stage; c.seed = 743;
  m.configure(c); m.reset(); m.practice = true; return m;
}
function boss(stage: number, endless = false) {
  const m = run(stage); m.state.time = 119.99; m.update(.02, {x:0,y:0});
  if (endless) m.config.mode = "endless";
  return m;
}
describe("clean boss encounters", () => {
  it('keeps support tuning stage-scoped',()=>{
    for(const stage of [0,1,2]) {
      expect(getBossPressure(stage,'stage').supportCap).toBe([6,8,10][stage]);
      expect(getBossPressure(stage,'endless').supportCap).toBe([4,6,8][stage]);
    }
  });
  it("shatters loose pickups on entry once, retaining collected powers and later drops", () => {
    const m=run();m.state.time=119.99;m.state.evolution={orbs:2,level:2,transformRemaining:0};
    m.state.powers.overdrive=20;m.state.shield=true;
    m.state.pickups=[{x:40,y:350,kind:"weapon",age:0,value:0},{x:80,y:350,kind:"drone",age:0,value:0}];
    const energy=m.state.energy,score=m.state.score;
    m.update(.02,{x:0,y:0});
    expect(m.state.pickups).toEqual([]);expect(m.state.pickupCount).toBe(0);
    expect(m.state.evolution.level).toBe(2);expect(m.state.shield).toBe(true);
    expect(m.state.energy-energy).toBeLessThan(.1);expect(m.state.score).toBe(score);
    expect(m.drainEvents().filter(e=>e.type==="boss-entered")).toHaveLength(1);
    expect(m.state.explosions.length).toBeGreaterThanOrEqual(2);
    m.state.pickups.push({x:45,y:350,kind:"repair",age:0,value:0});
    m.state.boss!.phase=2;m.update(.02,{x:0,y:0});
    expect(m.state.pickups).toHaveLength(1);
    expect(m.drainEvents().filter(e=>e.type==="boss-entered")).toHaveLength(0);
  });
  it.each([0,1,2])("never creates removed hazards or boss copies in sector %i", stage=>{
    const m=boss(stage);
    for(const phase of [1,2,3]) {
      m.state.boss!.phase=phase;
      for(let i=0;i<800;i++){m.state.bullets=[];m.update(.05,{x:0,y:0});m.drainEvents();}
      expect(m.state.hazards.every(h=>h.kind==="grid")).toBe(true);
      expect((m.state.boss as unknown as {decoys?:unknown[]}).decoys??[]).toEqual([]);
      expect(m.state.boss!.turrets).toHaveLength([2,4,6][stage]);
    }
  });
  it.each([0,1,2])("increases actual boss packets while retaining Endless baseline in sector %i", stage=>{
    for(const serial of [0,1,2]) {
      const counts=[false,true].map(endless=>{
        const m=boss(stage,endless),b=m.state.boss!;
        b.shot=0;b.attackSerial=serial;m.state.enemyBullets=[];
        m.update(.001,{x:0,y:0});
        return m.state.enemyBullets.filter(b=>b.source==="boss").length;
      });
      expect(counts[0]).toBeGreaterThanOrEqual(counts[1]*1.15);
      expect(counts[0]).toBeLessThanOrEqual(counts[1]*1.4);
    }
  });
  it.each([0,1,2])('actually admits more staggered side supports in sector %i',stage=>{
    const totals=[false,true].map(endless=>{
      const m=boss(stage,endless),seen=new WeakSet<Enemy>();let spawned=0;
      for(let i=0;i<1000;i++) {
        m.state.bullets=[];m.update(.05,{x:0,y:0});m.drainEvents();
        expect(m.state.enemies.length).toBeLessThanOrEqual(getBossPressure(stage,m.config.mode).supportCap);
        for(const e of m.state.enemies)if(!seen.has(e)){seen.add(e);spawned++;expect(Math.abs(e.x-195)).toBeGreaterThan(90);}
      }
      return spawned;
    });
    expect(totals[0]).toBeGreaterThan(totals[1]);
  });
});

function enemyDamage(stage:number,type:DamageType,shield=false,endless=false,group:Enemy["balanceGroup"]="standard",supered=false) {
  const m=run(stage);if(endless)m.config.mode="endless";
  const e:Enemy={x:195,y:250,radius:16,health:100,shieldHP:shield?100:0,shot:99,phase:0,age:0,
    kind:shield?2:0,balanceGroup:group,balance:getStageBalance(stage,0,"stage")??undefined};
  m.state.enemies=[e];if(supered)m.state.superMode.remaining=5;
  if(type==="laser") {m.config.equipment.main="laser";for(let i=0;i<11;i++)m.update(.01,{x:0,y:0});}
  else {m.state.bullets=[{x:e.x,y:e.y,radius:4,speed:0,damage:supered?2:1,type}];m.update(.001,{x:0,y:0});}
  return 100-(shield?e.shieldHP!:e.health);
}
describe("sector three friendly impact",()=>{
  it.each(["pulse","plasma","laser","missile"] as const)("adds twenty percent once to %s against hulls, armor and boss supports",type=>{
    for(const shield of [false,true])for(const group of ["standard","elite","boss-support"] as const) {
      const stage2=enemyDamage(1,type,shield,false,group);
      expect(enemyDamage(2,type,shield,false,group)).toBeCloseTo(stage2*1.2);
      expect(enemyDamage(2,type,shield,false,group,true)).toBeCloseTo(stage2*2.4);
      expect(enemyDamage(2,type,shield,true,group)).toBeCloseTo(stage2);
    }
  });
  it('boosts actual escort impacts without multiplying the evolved/Super output twice',()=>{
    const dealt=(endless:boolean,escorts:boolean)=>{
      const m=run(2);if(endless)m.config.mode='endless';
      m.state.evolution={orbs:2,level:2,transformRemaining:0};m.state.superMode.remaining=5;
      if(escorts){m.state.wingmen.level=2;m.state.drones=[{id:1,side:-1,rank:0},{id:2,side:1,rank:0}];}
      const e:Enemy={x:195,y:400,radius:30,health:1000,shot:99,phase:0,age:0};m.state.enemies=[e];
      for(let i=0;i<28;i++)m.update(.05,{x:0,y:0});
      return 1000-e.health;
    };
    const legacy=dealt(true,true)-dealt(true,false),boosted=dealt(false,true)-dealt(false,false);
    expect(legacy).toBeGreaterThan(0);expect(boosted).toBeCloseTo(legacy*1.2);
  });
  it.each(['pulse','plasma','laser','missile'] as const)('does not boost %s against minibosses or boss hardpoints/cores',type=>{
    const damage=(endless:boolean,target:'mini'|'turret'|'core')=>{
      const m=target==='mini'?run(2):boss(2),s=m.state;if(endless)m.config.mode='endless';
      let body:{health:number,x:number,y:number};
      if(target==='mini'){s.miniBoss={x:195,y:250,radius:38,health:100,maxHealth:100,shot:99};body=s.miniBoss;}
      else {
        const b=s.boss!;b.shot=99;
        if(target==='core'){b.state='exposed';for(const t of b.turrets!)t.health=0;body=b;}
        else {const t=type==='laser'?[...b.turrets!].sort((a,b)=>b.y-a.y)[0]:b.turrets![0];body={get health(){return t.health;},x:b.x+t.x,y:b.y+t.y};}
      }
      const initial=body.health;s.ship.x=body.x;
      if(type==='laser'){m.config.equipment.main='laser';for(let i=0;i<11;i++)m.update(.01,{x:0,y:0});}
      else{s.bullets=[{x:body.x,y:body.y,radius:4,speed:0,damage:2,type}];m.update(.001,{x:0,y:0});}
      return initial-body.health;
    };
    for(const target of ['mini','turret','core'] as const){expect(damage(false,target)).toBeGreaterThan(0);expect(damage(false,target)).toBeCloseTo(damage(true,target));}
  });
});
