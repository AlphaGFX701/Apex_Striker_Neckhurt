import { createServer, transformWithEsbuild } from 'vite';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const baseline='76943cdcf6e49b8012ce819d50106a2707c8fcba';
const oldModel=execFileSync('git',['show',`${baseline}:src/model.ts`],{encoding:'utf8'}).replaceAll('from "./','from "/src/');
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[]},plugins:[{
  name:'read-only-baseline',resolveId(id){if(id==='/baseline-model.ts')return '\0baseline-model';},
  async load(id){if(id==='\0baseline-model')return (await transformWithEsbuild(oldModel,'baseline-model.ts',{loader:'ts'})).code;}
}]});
try {
 const before=await server.ssrLoadModule('/baseline-model.ts'),after=await server.ssrLoadModule('/src/model.ts');
 const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
 const {getStageBalance}=await server.ssrLoadModule('/src/neon.ts');
 const rows=[];
 function setup(Model,stage,weapon,level){const m=new Model();const c=defaultRun();c.stage=stage;c.seed=743;c.equipment.main=weapon;m.configure(c);m.reset();m.practice=true;m.state.evolution={orbs:level===2?2:0,level,transformRemaining:0};m.state.powers.weapon=level-1;return m;}
 for(const stage of [1,2]) for(const weapon of ['pulse','plasma','laser']) for(const level of [1,2]) {
  const result={stage:stage+1,weapon,level};
  for(const [label,Model] of [['before',before.GameModel],['after',after.GameModel]]) {
   const m=setup(Model,stage,weapon,level),balance=label==='after'?getStageBalance(stage,0,'stage'):null;
   const target={x:195,y:250,radius:16,health:balance?.enemyHP??[0,9,12][stage],shot:999,kind:0,phase:0,age:0,originX:195,archetype:'fighter',balance:balance??undefined,balanceGroup:'standard'};
   m.state.enemies=[target];
   for(let i=0;i<500&&m.state.stats.enemiesDestroyed===0;i++) {
    target.y=250;m.state.enemies=[target];m.state.rocks=[];m.state.pickups=[];
    m.update(.01,{x:0,y:0});m.drainEvents();
   }
   result[label+'TTK']=+m.state.time.toFixed(2);
   const run=setup(Model,stage,weapon,level);let peak=0;
   for(let i=0;i<3000;i++) {
    run.state.pickups=[];
    const target=run.state.enemies.filter(e=>e.y>35).sort((a,b)=>b.y-a.y)[0];
    const offset=run.state.time%2>1.3?(target?.x<195?90:-90):0;
    run.update(.01,{x:0,y:0},target?{x:target.x+offset,y:610}:null);
    peak=Math.max(peak,run.state.enemies.length);run.drainEvents();
   }
   result[label+'Kills']=run.state.stats.enemiesDestroyed;result[label+'Remaining']=run.state.enemies.length;result[label+'Peak']=peak;
  }
  rows.push(result);
 }
 await writeFile('artifacts/stage-balance-comparison.json',JSON.stringify({kind:'deterministic-simulation-not-human-gyro',baseline,seed:743,tracking:0.65,fixedLoadout:true,pickupsDisabled:true,rows},null,2));console.table(rows);
} finally {await server.close();}
