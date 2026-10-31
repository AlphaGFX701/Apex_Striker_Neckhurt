const { chromium }=require('C:/Users/acer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});const report={kind:'simulated-browser-input-not-physical-gyro',screens:[],errors:[]};
 async function launch(page,stage=0,fixture='super') {
  await page.goto('http://localhost:5175/?qa=1&fixture='+fixture);
  await page.locator('#boot-loading').waitFor({state:'hidden',timeout:45000});
  await page.locator('#title-play').count().then(async count=>{if(count) await page.locator('#title-play').click();else await page.getByRole('button',{name:'PLAY ↗'}).click();});
  await page.locator(`[data-stage="${stage}"]`).click();
  await page.locator('#input-source').selectOption('manual');await page.locator('#input-source').dispatchEvent('change');
  await page.locator('#launch').click();await page.waitForTimeout(600);
 }
 try {
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:844,height:390}]) {
   const context=await browser.newContext({viewport});const page=await context.newPage();
   page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
   await launch(page,2,'super');
   await page.screenshot({path:`artifacts/neon-mobile-${viewport.width}x${viewport.height}.png`});
   report.screens.push(await page.evaluate(()=>({size:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('#game canvas').getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('.combat-controls button')].map(e=>e.getBoundingClientRect().toJSON())})));
   await context.close();
  }
  for(const stage of [0,1,2]) {
   const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();
   p.on('pageerror',e=>report.errors.push(e.message));p.on('console',e=>{if(e.type()==='warning' && /frame|texture/i.test(e.text()))report.errors.push(e.text());});
   await launch(p,stage,'boss');await p.screenshot({path:`artifacts/neon-sector-${stage+1}.png`});await ctx.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:'artifacts/neon-video',size:{width:390,height:844}}});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await launch(page,2,'boss');await page.screenshot({path:'artifacts/neon-stage3-rage.png'});
  await page.evaluate(async()=>{const scene=window.__apexQA;scene.model.state.enemyBullets=Array.from({length:420},(_,i)=>({x:15+(i%28)*13,y:180+Math.floor(i/28)*22,radius:4,vx:0,vy:35,source:'escort'}));});
  report.frameTime=await page.evaluate(()=>new Promise(resolve=>{const times=[];let before=performance.now();function frame(now){times.push(now-before);before=now;if(times.length<120)requestAnimationFrame(frame);else {times.sort((a,b)=>a-b);resolve({median:times[60],p95:times[114]});}}requestAnimationFrame(frame);}));
  await page.evaluate(async()=>{const scene=window.__apexQA;scene.model.state.superMode.remaining=5;});
  await page.waitForTimeout(1000);await page.screenshot({path:'artifacts/neon-super.png'});
  await launch(page,2,'victory');
  await page.waitForTimeout(2600);await page.screenshot({path:'artifacts/neon-victory-animation.png'});
  await page.waitForFunction(()=>document.body.dataset.view==='results',{timeout:10000});
  report.victory=await page.locator('#results h1').innerText();
  await page.screenshot({path:'artifacts/neon-victory-results.png'});
  await launch(page,0,'loss');await page.waitForTimeout(1100);await page.screenshot({path:'artifacts/neon-loss-animation.png'});
  await page.waitForFunction(()=>document.body.dataset.view==='results',{timeout:10000});report.defeat=await page.locator('#results h1').innerText();
  await page.screenshot({path:'artifacts/neon-game-over.png'});
  const video=page.video();await context.close();await video.saveAs(path.resolve('artifacts/neon-super-and-ending.webm'));
 } finally {await fs.writeFile('artifacts/neon-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
