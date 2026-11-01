import {createServer} from 'vite';
import {mkdtemp,symlink,writeFile,mkdir,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const baseline='bc04469e3a05ddeb6e94a126175b4ed6336e86e8';
const root=resolve('.'),before=await mkdtemp(join(tmpdir(),'apex-portrait-baseline-'));
const archive=join(before,'source.tar');
execFileSync('git',['archive',baseline,'src','package.json','tsconfig.json','--output',archive],{cwd:root});
execFileSync('tar',['-xf',archive,'-C',before]);
await symlink(join(root,'node_modules'),join(before,'node_modules'),'junction');
const seeds=[42,143,523,743,1009,2039],rows=[];
for(const [version,dir] of [['before',before],['after',root]]) {
  const server=await createServer({root:dir,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
  try {
    const {GameModel}=await server.ssrLoadModule('/src/model.ts');
    const {defaultRun}=await server.ssrLoadModule('/src/equipment.ts');
    for(const stage of [1,2])for(const weapon of ['pulse','plasma','laser'])for(const level of [1,2])for(const seed of seeds) {
      const m=new GameModel(),c=defaultRun();Object.assign(c,{stage,seed});c.equipment.main=weapon;
      m.configure(c);m.reset();m.practice=true;
      const seen=new Map(),life=[],hp=[];let arrivals=0,peak=0,occupancy=0,kills30=0;
      for(let frame=0;frame<2400;frame++) {
        m.state.evolution={orbs:level===1?0:2,level,transformRemaining:0};m.state.powers.weapon=level-1;
        m.state.pickups=[];
        const target=m.state.enemies.filter(e=>e.y>0).sort((a,b)=>b.y-a.y)[0];
        const track=frame%40<26;
        m.update(.05,{x:0,y:0},target&&track?{x:target.x,y:610}:{x:195,y:610});
        for(const e of m.state.enemies)if(!seen.has(e)){seen.set(e,m.state.time);arrivals++;hp.push(e.balance?.enemyHP??e.health);}
        for(const [e,t]of seen)if(e.health===-Infinity){life.push(m.state.time-t);seen.delete(e);}
        peak=Math.max(peak,m.state.enemies.length);occupancy+=m.state.enemies.length;
        if(frame===599)kills30=m.state.stats.enemiesDestroyed;
        m.drainEvents();
      }
      rows.push({version,stage:stage+1,weapon,level,seed,arrivals,kills30,kills:m.state.stats.enemiesDestroyed,peak,meanOnScreen:+(occupancy/2400).toFixed(2),meanLifetimeToKill:life.length?+(life.reduce((a,b)=>a+b,0)/life.length).toFixed(2):null,firstHP:hp[0]});
    }
  }finally{await server.close();}
}
const hashes={};
for(const [version,dir]of [['before',before],['after',root]]) {
  const source=await readFile(join(dir,'src/model.ts'),'utf8');
  // The complete destruction/drop method includes chance, weights and guarantees.
  const kill=source.slice(source.indexOf('  private kill('),source.indexOf('  private damage(')).replaceAll('\r\n','\n');
  hashes[version]=createHash('sha256').update(kill).digest('hex');
}
const summaries=[];
for(const stage of [2,3])for(const version of ['before','after']) {
  const group=rows.filter(r=>r.stage===stage&&r.version===version);
  const avg=key=>+(group.reduce((sum,r)=>sum+(r[key]??0),0)/group.length).toFixed(2);
  summaries.push({stage,version,arrivals:avg('arrivals'),kills30:avg('kills30'),kills:avg('kills'),meanOnScreen:avg('meanOnScreen'),meanLifetimeToKill:avg('meanLifetimeToKill')});
}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/portrait-balance.json',JSON.stringify({baseline,kind:'deterministic simulation; not human or physical gyro evidence',seconds:120,tracking:0.65,seeds,dropMethodSHA256:hashes,summaries,rows},null,2));
console.table(summaries);console.log('Drop method unchanged:',hashes.before===hashes.after);
