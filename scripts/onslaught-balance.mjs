import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {GameModel}=await server.ssrLoadModule('/src/model.ts');
const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
const runs=[];
for(const stage of [0,1,2])for(const weapon of ['pulse','plasma','laser'])for(const loadout of ['base','mid']){
  const c=defaultRun();c.stage=stage;c.seed=743;c.equipment.main=weapon;
  const m=new GameModel();m.configure(c);m.practice=true;m.reset();m.state.invincible=10000;
  for(let i=0;i<18000&&!m.state.gameOver;i++){
    m.state.pickups=[];
    if(loadout==='mid'){
      m.state.powers.weapon=1;m.state.powers.missile=12;
      if(!m.state.drones.length)m.state.drones=[{id:1,side:-1,rank:0},{id:2,side:1,rank:0}];
    }
    // A reference rig spends 65% of each two-second interval tracking the core.
    const b=m.state.boss;
    const target=b?{x:b.x+(loadout==='mid'&&m.state.time%2>1.3?125:0),y:610}:null;
    m.update(.05,{x:0,y:0},target);m.drainEvents();
  }
  runs.push({stage:stage+1,weapon,loadout,result:m.state.result,flightSeconds:+m.state.time.toFixed(2),bossSeconds:+(m.state.time-m.state.bossStarted).toFixed(2),hp:m.state.boss?.maxHealth,seed:m.state.seed});
}
const report={kind:'deterministic-DPS-reference-not-human-playtest',midTrackingDutyCycle:.65,runs};
await writeFile('artifacts/onslaught-balance.json',JSON.stringify(report,null,2));console.table(runs);await server.close();
