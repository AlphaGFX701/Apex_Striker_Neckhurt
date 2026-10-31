import { createServer } from 'vite';
import { performance } from 'node:perf_hooks';
import { writeFile,readFile } from 'node:fs/promises';
import {createHash} from 'node:crypto';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
const {GameModel}=await server.ssrLoadModule('/src/model.ts');
const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
const m=new GameModel(),c=defaultRun();c.mode='endless';c.seed=73142;c.equipment.main='plasma';m.configure(c);m.practice=true;m.reset();
const start=performance.now(), duration=Number(process.argv[2]||1200), report={kind:'real-wall-clock-model-soak',rendererTest:false,durationTarget:duration,samples:[],max:{enemies:0,playerBullets:0,enemyBullets:0,pickups:0,effects:0},steps:0,worstStepMs:0};
let nextReport=30;
report.status='running';report.startedAt=new Date().toISOString();report.modelSha256=createHash('sha256').update(await readFile('src/model.ts')).digest('hex');
async function checkpoint(status='running'){report.status=status;report.wallSeconds=(performance.now()-start)/1000;report.simulationSeconds=m.state.time;report.wave=m.state.wave;await writeFile('artifacts/onslaught-soak.json',JSON.stringify(report,null,2))}
await checkpoint();
process.on('uncaughtException',async error=>{report.error=String(error.stack||error);await checkpoint('failed');process.exit(1)});
process.on('SIGINT',async()=>{await checkpoint('interrupted');process.exit(1)});
while(performance.now()-start<duration*1000){
  const elapsed=(performance.now()-start)/1000;
  while(m.state.time+1/60<=elapsed){
    const t0=performance.now(),s=m.state;
    const target=s.boss?{x:s.boss.x,y:600}:s.pickups.find(p=>p.kind)?{x:s.pickups.find(p=>p.kind).x,y:600}:{x:195+Math.sin(s.time*.6)*130,y:600};
    if(s.energy>=100)m.action('emp');
    m.update(1/60,{x:0,y:0},target);m.drainEvents();
    report.steps++;report.worstStepMs=Math.max(report.worstStepMs,performance.now()-t0);
    for(const [key,count] of Object.entries({enemies:s.enemies.length,playerBullets:s.bullets.length,enemyBullets:s.enemyBullets.length,pickups:s.pickups.length,effects:s.explosions.length}))report.max[key]=Math.max(report.max[key],count);
  }
  if(elapsed>=nextReport){const sample={wallSeconds:elapsed,simulationSeconds:m.state.time,wave:m.state.wave,heapMB:process.memoryUsage().heapUsed/1048576};report.samples.push(sample);console.log(JSON.stringify(sample));nextReport+=30;await checkpoint()}
  await new Promise(resolve=>setTimeout(resolve,8));
}
report.wallSeconds=(performance.now()-start)/1000;report.simulationSeconds=m.state.time;report.wave=m.state.wave;
await checkpoint('complete');await server.close();console.log('SOAK COMPLETE '+JSON.stringify({wallSeconds:report.wallSeconds,sim:report.simulationSeconds,wave:report.wave,max:report.max}));
