const {chromium}=require('C:/Users/acer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true});const report={kind:'simulated-browser-input-not-physical-gyro',errors:[],runs:[]};
 try {
  for(const [stage,viewport] of [[1,{width:390,height:844}],[2,{width:320,height:568}],[2,{width:844,height:390}]]) {
   const context=await browser.newContext({viewport}),page=await context.newPage();
   page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
   await page.goto('http://localhost:5176/?qa=1');await page.locator('#boot-loading').waitFor({state:'hidden',timeout:45000});
   await page.getByRole('button',{name:'PLAY ↗'}).click();await page.locator(`[data-stage="${stage}"]`).click();
   await page.locator('#input-source').selectOption('manual');await page.locator('#input-source').dispatchEvent('change');await page.locator('#launch').click();
   await page.waitForTimeout(1800);
   const observations=[];
   for(const at of [12,29,46,76,89,91,95]) {
    const state=await page.evaluate(at=>{
     const scene=window.__apexQA,m=scene.model;
     for(let i=0;i<2500&&m.state.time<at;i++) {
      const aim=m.state.enemies.filter(e=>e.y>35).sort((a,b)=>b.y-a.y)[0];
      m.update(.05,{x:0,y:0},aim?{x:aim.x,y:610}:null);m.drainEvents();
     }
     return {at:m.state.time,kills:m.state.stats.enemiesDestroyed,enemies:m.state.enemies.length,mini:!!m.state.miniBoss,boss:!!m.state.boss,hp:m.state.enemies.map(e=>e.health),archetypes:m.state.enemies.map(e=>e.archetype)};
    },at);
    observations.push(state);await page.waitForTimeout(120);
    if([12,46,91].includes(at))await page.screenshot({path:`artifacts/pacing-sector${stage+1}-${viewport.width}-${at}s.png`});
   }
   await page.getByRole('button',{name:'Pause mission'}).click();
   const paused=await page.evaluate(()=>window.__apexQA.model.state.time);await page.waitForTimeout(300);
   const pausedAfter=await page.evaluate(()=>window.__apexQA.model.state.time);
   await page.locator('#resume').click();await page.waitForTimeout(250);
   const resumed=await page.evaluate(()=>window.__apexQA.model.state.time);
   report.runs.push({stage:stage+1,viewport,observations,pauseFrozen:paused===pausedAfter,resumeAdvances:resumed>paused,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
   await context.close();
  }
 } finally {await fs.writeFile('artifacts/stage-balance-browser.json',JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({errors:report.errors,runs:report.runs.map(r=>({stage:r.stage,viewport:r.viewport,pauseFrozen:r.pauseFrozen,resumeAdvances:r.resumeAdvances,overflow:r.overflow,miniSeen:r.observations.some(s=>s.mini)}))},null,2));
 if(report.errors.length||report.runs.some(r=>!r.pauseFrozen||!r.resumeAdvances||r.overflow))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
