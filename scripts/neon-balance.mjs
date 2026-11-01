import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const {GameModel,bossAimPoints}=await server.ssrLoadModule('/src/model.ts');
  const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
  const rows=[];
  for(const stage of [0,1,2]) for(const weapon of ['pulse','plasma','laser']) {
    const c=defaultRun();c.stage=stage;c.seed=743;c.equipment.main=weapon;
    const m=new GameModel();m.configure(c);m.reset();m.practice=true;m.state.time=119.99;m.update(.02,{x:0,y:0});
    m.state.evolution={orbs:2,level:2,transformRemaining:0};m.state.powers.weapon=1;m.state.wingmen.level=2;
    m.state.drones=[{id:1,side:-1,rank:0},{id:2,side:1,rank:0}];
    let peakE=0,peakB=0;
    for(let i=0;i<6000&&!m.state.gameOver;i++) {
      m.state.pickups=[];
      const aim=bossAimPoints(m.state.boss).sort((a,b)=>Math.abs(a.x-m.state.ship.x)-Math.abs(b.x-m.state.ship.x))[0];
      const offset=m.state.time%2>1.3?(aim?.x<195?125:-125):0;
      m.update(.05,{x:0,y:0},aim?{x:aim.x+offset,y:610}:null);m.drainEvents();
      peakE=Math.max(peakE,m.state.enemies.length);peakB=Math.max(peakB,m.state.enemyBullets.length);
    }
    rows.push({stage:stage+1,weapon,seconds:+(m.state.time-m.state.bossStarted).toFixed(2),won:m.state.outcome==='won',hp:m.state.boss.maxHealth,peakEnemies:peakE,peakBullets:peakB});
  }
  console.table(rows);
  await writeFile('artifacts/neon-balance.json',JSON.stringify({kind:'simulation-not-human-or-device-test',tracking:0.65,rows},null,2));
} finally {await server.close();}
