import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const baseline=process.argv[2];
if(!baseline)throw Error('Pass the pinned baseline checkout path');
async function measure(root) {
  const server=await createServer({root,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
  try {
    const {GameModel}=await server.ssrLoadModule('/src/model.ts');
    const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
    const {DIFFICULTY}=await server.ssrLoadModule('/src/neon.ts');
    const make=stage=>{
      const c=defaultRun();c.stage=stage;c.seed=743;
      const m=new GameModel();m.configure(c);m.reset();m.practice=true;m.state.time=119.99;m.update(.02,{x:0,y:0});return m;
    };
    const packets=[],supports=[];
    for(const stage of [0,1,2]) {
      for(let phase=1;phase<=DIFFICULTY[stage].phases;phase++)for(const armored of [true,false])for(const serial of [0,1,2]) {
        const m=make(stage),b=m.state.boss;
        b.phase=phase;b.state=armored?'armored':'exposed';
        if(!armored)for(const t of b.turrets)t.health=0;
        b.shot=0;b.attackSerial=serial;m.state.enemyBullets=[];
        m.update(.001,{x:0,y:0});
        const shots=m.state.enemyBullets.filter(b=>b.source==='boss');
        packets.push({stage:stage+1,phase,armored,pattern:b.pattern,count:shots.length,maxSpeed:Math.max(0,...shots.map(b=>Math.hypot(b.vx,b.vy)))});
      }
      const m=make(stage),seen=new WeakSet();let total=0,peak=0,peakBullets=0;
      for(let i=0;i<1200;i++) {
        m.state.bullets=[];m.update(.05,{x:0,y:0});m.drainEvents();
        peak=Math.max(peak,m.state.enemies.length);peakBullets=Math.max(peakBullets,m.state.enemyBullets.length);
        for(const e of m.state.enemies)if(!seen.has(e)){seen.add(e);total++;}
      }
      supports.push({stage:stage+1,seconds:60,total,peak,peakBullets});
    }
    return {packets,supports};
  } finally {await server.close();}
}
const before=await measure(baseline),after=await measure(process.cwd());
const summary=[1,2,3].map(stage=>{
  const sum=data=>data.packets.filter(r=>r.stage===stage).reduce((n,r)=>n+r.count,0);
  return {stage,before:sum(before),after:sum(after),increase:+((sum(after)/sum(before)-1)*100).toFixed(1),supportsBefore:before.supports[stage-1],supportsAfter:after.supports[stage-1]};
});
console.table(summary.map(r=>({stage:r.stage,before:r.before,after:r.after,increase:r.increase,supports:`${r.supportsBefore.total} -> ${r.supportsAfter.total}`,peak:`${r.supportsBefore.peak} -> ${r.supportsAfter.peak}`})));
await writeFile('artifacts/boss-pressure.json',JSON.stringify({kind:'seeded-model-fixtures-not-human-play',seed:743,baseline:'dba210d81b94e74ba4fdb8573f8f9c1d2f3f6e04',before,after,summary},null,2));
