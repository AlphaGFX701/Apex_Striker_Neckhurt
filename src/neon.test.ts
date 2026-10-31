import { describe, it, expect } from 'vitest';
import { GameModel, LIMITS } from './model';
import { DIFFICULTY, nextEscapeLane, beamGeometry, beamDistance } from './neon';
import { defaultRun } from './equipment';
function model(stage=0) { const m=new GameModel(()=>0.42),c=defaultRun();c.stage=stage;c.seed=84;m.configure(c);m.reset();return m; }
function collect(m:GameModel,kind:'drone'|'weapon') {m.state.pickups.push({...m.state.ship,kind,age:0,value:0});m.update(0.001,{x:0,y:0});}
function boss(stage=0) {const m=model(stage);m.practice=true;m.state.time=119.99;m.update(0.02,{x:0,y:0});return m;}
describe('Apex Strikers Neon Onslaught',()=>{
  it('uses one increasing pressure profile and a matching global cap',()=>{
    expect(DIFFICULTY.map(p=>p.cadence)).toEqual([1,2,4]);
    expect(DIFFICULTY.map(p=>p.phases)).toEqual([2,3,3]);
    expect(LIMITS.enemies).toBe(Math.max(...DIFFICULTY.map(p=>p.enemyCap)));
    for(let stage=0;stage<3;stage++) expect(boss(stage).state.boss!.maxHealth).toBe(DIFFICULTY[stage].bossHP);
  });
  it('refreshes a full escort pickup to five seconds without stacking or changing red time',()=>{
    const m=model();for(let i=0;i<3;i++)collect(m,'drone');
    expect(m.state.drones).toHaveLength(2);expect(m.state.superMode.remaining).toBe(0);
    collect(m,'weapon');collect(m,'drone');
    expect(m.state.superMode.remaining).toBe(5);const red=m.state.powers.overdrive;
    for(let i=0;i<40;i++)m.update(0.05,{x:0,y:0});
    collect(m,'drone');expect(m.state.superMode.remaining).toBe(5);
    expect(m.state.powers.overdrive).toBeLessThan(red);
    for(let i=0;i<101;i++)m.update(0.05,{x:0,y:0});
    expect(m.state.superMode.remaining).toBe(0);expect(m.state.wingmen.level).toBe(3);
    m.reset();expect(m.state.superMode.remaining).toBe(0);expect(m.state.hazards).toEqual([]);
  });
  it('doubles shot damage once and adds interception without invulnerability',()=>{
    const plain=model(),supered=model();supered.state.superMode.remaining=5;
    for(let i=0;i<2;i++){plain.update(0.05,{x:0,y:0});supered.update(0.05,{x:0,y:0});}
    expect(supered.state.bullets[0].damage).toBeCloseTo(plain.state.bullets[0].damage!*2);
    expect(supered.state.bullets.every(b=>b.interceptor)).toBe(true);
    supered.state.invincible=0;supered.state.enemyBullets=[{...supered.state.ship,vx:0,vy:0}];supered.state.bullets=[];
    supered.update(0.001,{x:0,y:0});expect(supered.state.lives).toBe(2);
  });
  it('marks plasma interference only inside an active field',()=>{
    const m=model(1);m.state.hazards=[{kind:'plasma',x:m.state.ship.x,y:m.state.ship.y,radius:90,hp:1,age:2}];
    m.update(0.01,{x:0,y:0});expect(m.state.weaponJammed).toBe(true);
    m.state.ship.x=23;m.update(0.01,{x:0,y:0});expect(m.state.weaponJammed).toBe(false);
  });
  it('lets a black hole core absorb shots once, keeps gravity bounded, and clears it with EMP',()=>{
    const m=model(1);m.state.ship.x=240;m.state.hazards=[{kind:'black-hole',x:200,y:600,radius:80,hp:2,age:2}];
    const x=m.state.ship.x;m.update(0.05,{x:0,y:0});expect(x-m.state.ship.x).toBeLessThanOrEqual(310*0.35*0.05);
    m.state.bullets=[{x:200,y:600,radius:4,speed:0,damage:3}];m.update(0.001,{x:0,y:0});
    expect(m.state.hazards[0].hp).toBeLessThanOrEqual(0);expect(m.state.bullets).toHaveLength(0);
    m.state.energy=100;m.action('emp');expect(m.state.hazards).toEqual([]);
  });
  it('enters rage once below twenty percent only in the final sector',()=>{
    for(const stage of [0,1,2]) {const m=boss(stage),b=m.state.boss!;b.health=b.maxHealth*0.19;m.update(0.01,{x:0,y:0});
      expect(!!b.rage).toBe(stage===2);m.drainEvents();m.update(0.01,{x:0,y:0});
      expect(m.drainEvents().filter(e=>e.type==='warning' && e.text.includes('RAGE'))).toHaveLength(0);
    }
  });
  it('rotates reachable escape positions instead of reserving a permanent edge',()=>{
    let lane=195;const positions=[];
    for(let i=1;i<=8;i++) {const next=nextEscapeLane(lane,i%2?310:80,i);expect(Math.abs(next-lane)).toBeLessThanOrEqual(75);positions.push(next);lane=next;}
    expect(new Set(positions).size).toBeGreaterThan(1);
  });
  it('holds the terminal result while the defeat animation advances independently of gameplay',()=>{
    const m=model();m.state.lives=1;m.state.enemyBullets=[{...m.state.ship,vx:0,vy:0}];m.update(0.01,{x:0,y:0});
    expect(m.state.result).toBe('lost');expect(m.state.ending?.duration).toBe(2.3);
    const time=m.state.time;m.update(1,{x:1,y:1});expect(m.state.time).toBe(time);
    for(let i=0;i<100;i++)m.advanceEnding(0.05);
    expect(m.state.ending?.elapsed).toBe(2.3);expect(m.state.result).toBe('lost');
  });
  it('continues commander packets while escorts remain alive and firing',()=>{
    const m=boss(2);
    for(let i=0;i<1200;i++) {m.state.bullets=[];m.state.pickups=[];m.update(0.05,{x:0,y:0});m.drainEvents();}
    expect(m.state.boss!.attackSerial).toBeGreaterThan(5);
    expect(m.state.enemies.length).toBeLessThanOrEqual(8);
  });
  it('routes laser-only decoy contact to a rate-limited retaliation',()=>{
    const m=boss(1);m.config.equipment.main='laser';m.state.boss!.phase=2;
    m.state.ship.x=65;m.state.boss!.shot=100;m.state.enemies=[];m.state.enemyBullets=[];
    for(let i=0;i<3;i++)m.update(0.05,{x:0,y:0});
    expect(m.state.boss!.decoyCooldown).toBeGreaterThan(0);
    const cooldown=m.state.boss!.decoyCooldown!;
    m.update(0.05,{x:0,y:0});expect(m.state.boss!.decoyCooldown).toBeLessThan(cooldown);
  });
  it('does not retaliate against an upward laser behind a decoy',()=>{
    const m=boss(1);m.config.equipment.main='laser';m.state.boss!.phase=2;m.state.boss!.shot=100;
    m.state.ship.x=65;m.state.ship.y=100;m.state.enemies=[];m.state.enemyBullets=[];
    for(let i=0;i<3;i++)m.update(0.05,{x:0,y:0});
    expect(m.state.boss!.decoyCooldown??0).toBe(0);
  });
  it('shares the exact sweep geometry between visible beam and collision',()=>{
    const left=beamGeometry({x:195,y:205,age:1.2,sweep:true});
    const middle={x:195,y:205,age:1.9,sweep:true};
    const right=beamGeometry({x:195,y:205,age:2.6,sweep:true});
    expect(left.x2).toBeLessThan(0);expect(right.x2).toBeGreaterThan(390);
    expect(beamDistance({x:195,y:600},middle)).toBeLessThan(0.001);
    expect(beamDistance({x:23,y:600},middle)).toBeGreaterThan(100);
  });
  it('splits an ordinary asteroid once and does not let gunfire destroy iron',()=>{
    const m=model();m.state.rocks=[{x:90,y:230,radius:20,speed:0,spin:0,phase:0,target:true}];
    m.state.bullets=[{x:90,y:230,radius:4,speed:0,damage:50}];m.update(0.001,{x:0,y:0});
    expect(m.state.rocks).toHaveLength(2);expect(m.state.rocks.every(r=>r.fragment)).toBe(true);
    const rock=m.state.rocks[0];m.state.bullets=[{x:rock.x,y:rock.y,radius:2,speed:0}];m.update(0.001,{x:0,y:0});
    expect(m.state.rocks.length).toBeLessThan(2);
    m.state.rocks=[{x:90,y:230,radius:20,speed:0,spin:0,phase:0,target:true,iron:true}];
    m.state.bullets=[{x:90,y:230,radius:4,speed:0,damage:500}];m.update(0.001,{x:0,y:0});expect(m.state.rocks).toHaveLength(1);
  });
});
