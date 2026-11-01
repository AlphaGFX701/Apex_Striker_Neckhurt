import type { SpaceScene } from "./game";
/** Development-only capture controls. This module is never imported into a production build. */
export function installQaCapture(
  scene: SpaceScene,
  audio: () => MediaStream | null,
  music?: () => { desired:string|null; audible:string|null; playing:boolean; currentTime:number },
) {
  const host = document.createElement("div");
  host.className = "qa-capture-tools";
  const style = document.createElement("style");
  style.textContent =
    ".qa-capture-tools{display:none!important}body[data-view=battle] .qa-capture-tools{display:flex!important}";
  document.head.append(style);
  Object.assign(host.style, {
    position: "fixed",
    right: "5px",
    top: "3px",
    zIndex: "40",
    display: "flex",
    gap: "4px",
    opacity: ".85",
  });
  const capture = document.createElement("button");
  capture.textContent = "QA Record 12s";
  capture.style.cssText =
    "font-size:9px;min-height:24px;height:24px;padding:3px 7px";
  const soak = document.createElement("button");
  soak.textContent = "QA Soak 20m";
  soak.style.cssText = capture.style.cssText;
  const stats = document.createElement("span");
  stats.style.cssText =
    "font:9px monospace;color:#9cdeff;background:#071322;padding:5px";
  for(const sweep of [false,true]) {
    const demo=document.createElement("button");demo.textContent=sweep?"QA Sweep":"QA Laser";demo.style.cssText=capture.style.cssText;
    demo.onclick=()=>{
      const s=scene.model.state;
      if(!scene.isRunning)return;
      s.enemyBullets=[];s.hazards=[];s.storm=null;
      if(s.boss){s.boss.shot=10;s.boss.restUntil=s.time+10;}
      s.beams=[{x:sweep?195:s.ship.x,y:sweep?205:s.ship.y,age:0,sweep}];
    };
    host.append(demo);
  }
  host.append(capture, soak, stats);
  const entry=document.createElement("button");entry.textContent="QA Boss entry";entry.style.cssText=capture.style.cssText;
  entry.onclick=()=>{
    scene.start();const m=scene.model;m.practice=true;
    m.state.evolution={orbs:2,level:2,transformRemaining:0};m.state.powers.weapon=1;
    m.state.wingmen.level=2;m.state.drones=[{id:1,side:-1,rank:0},{id:2,side:1,rank:0}];
    m.state.pickups=(["weapon","drone","repair","shield","missile","energy"] as const).map((kind,i)=>({kind,x:55+i*55,y:340,age:0,value:0}));
    m.state.time=119.99;m.update(.02,{x:0,y:0});
  };
  host.append(entry);
  for(const outcome of ["Victory","Defeat"] as const) {
    const end=document.createElement("button");end.textContent=`QA ${outcome}`;end.style.cssText=capture.style.cssText;
    end.onclick=()=>{
      const m=scene.model;
      if(outcome==="Victory" && m.state.boss){m.practice=false;m.state.boss.health=0;}
      if(outcome==="Defeat") {m.practice=false;m.state.lives=1;m.state.invincible=0;m.state.shield=false;m.state.enemyBullets=[{...m.state.ship,vx:0,vy:0}];}
    };
    host.append(end);
  }
  document.body.append(host);
  const meter=document.createElement("div");meter.className="qa-frame-metrics";
  meter.style.cssText="position:fixed;bottom:2px;right:2px;z-index:60;background:#071019;color:white;padding:5px;font:10px monospace";
  const resetFrames=document.createElement("button");resetFrames.textContent="QA Reset frame sample";
  const frameNumbers=document.createElement("span");
  if(new URLSearchParams(location.search).has("perf")){meter.append(resetFrames,frameNumbers);document.body.append(meter);}
  const frames: number[] = [];
  const samples: Record<string, number>[] = [];
  let runStart = 0,
    lastTime = 0;
  resetFrames.onclick=()=>{frames.length=0;frameNumbers.textContent=" Sampling…";};
  let trackedState=scene.model.state;
  let previous = performance.now();
  let renderedSeconds = 0;
  const measure = (now: number) => {
    const interval = now - previous;
    frames.push(interval);
    // Exclude occluded/background 1fps intervals from the endurance duration.
    if (scene.isRunning && interval > 0 && interval < 100)
      renderedSeconds += interval / 1000;
    previous = now;
    if (frames.length > 1800) frames.shift();
    requestAnimationFrame(measure);
  };
  requestAnimationFrame(measure);
  window.setInterval(() => {
    const s = scene.model.state,
      sorted = [...frames].sort((a, b) => a - b);
    if (s!==trackedState || s.time < lastTime || !runStart) {
      runStart = performance.now();
      samples.length = 0;
      trackedState=s;
      renderedSeconds = 0;
    }
    lastTime = s.time;
    const heapBytes = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory?.usedJSHeapSize;
    if (scene.isRunning && samples.length < 3600)
      samples.push({
        wallSeconds: (performance.now() - runStart) / 1000,
        time: s.time,
        renderedSeconds,
        wave: s.wave,
        enemies: s.enemies.length,
        playerBullets: s.bullets.length,
        enemyBullets: s.enemyBullets.length,
        pickups: s.pickups.length,
        effects: s.explosions.length,
        renderObjects:scene.children.list.length,
        textures:scene.textures.getTextureKeys().length,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        heapMB: heapBytes === undefined ? -1 : heapBytes / 1048576,
      });
    host.dataset.samples = JSON.stringify(samples);
    frameNumbers.textContent=` MS ${Number(sorted[Math.floor(sorted.length*.5)]??0).toFixed(1)}/${Number(sorted[Math.floor(sorted.length*.95)]??0).toFixed(1)} · ${sorted.length} frames`;

    stats.textContent = `QA SIM · ${Math.floor(s.time)}s · ${s.enemies.length}E/${s.enemyBullets.length}B`;
    host.dataset.metrics = JSON.stringify({
      time: s.time,
      frameP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      frames: frames.length,
      enemies: s.enemies.length,
      enemyBullets: s.enemyBullets.length,
      hazards:s.hazards.map(h=>h.kind),bossPhase:s.boss?.phase??null,pickups:s.pickups.length,
      music:music?.(),
    });
    const musicState=music?.();
    if(musicState)stats.textContent+=` · BGM ${musicState.audible??"none"} ${musicState.playing?"PLAY":"WAIT"} ${musicState.currentTime.toFixed(1)}s`;
  }, 1000);
  const record = (endurance: boolean, demo = false) => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game canvas");
    if (!canvas) return;
    let demoTimer: ReturnType<typeof setInterval> | undefined;
    if(demo) {
      const s=scene.model.state;
      // Presentation fixture only, not a sampled natural boss pattern.
      if(s.boss) {
        s.boss.health=s.boss.maxHealth=10000;
        for(const turret of s.boss.turrets??[]) turret.health=turret.maxHealth=10000;
        s.boss.restUntil=s.time+14;s.boss.shot=14;
      }
      s.enemyBullets=[];s.hazards=[];s.storm=null;s.beams=[{x:195,y:s.ship.y,age:0}];
      const began=s.time;let phase=0;
      demoTimer=setInterval(()=>{
        if(!scene.isRunning){clearInterval(demoTimer);return;}
        if(s.time-began>=4 && phase===0){s.beams=[{x:195,y:205,age:0,sweep:true}];phase=1;}
        if(s.time-began>=9 && phase===1){s.beams=[{x:s.ship.x,y:s.ship.y,age:0}];phase=2;}
      },40);
    }
    const stream = canvas.captureStream(30);
    for (const track of audio()?.getAudioTracks() ?? [])
      stream.addTrack(track.clone());
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
      videoBitsPerSecond: endurance ? 450000 : 1200000,
      audioBitsPerSecond: 96000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      clearInterval(demoTimer);
      const u = URL.createObjectURL(new Blob(chunks, { type: "video/webm" })),
        a = document.createElement("a");
      a.href = u;
      a.download = endurance ? "pixel-endless-20m.webm" : "pixel-combat-canvas.webm";
      a.click();
      stream.getTracks().forEach((t) => t.stop());
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      capture.disabled = false;
      capture.textContent = "QA Record 12s";
      soak.disabled = false;
      soak.textContent = "QA Soak 20m";
      host.dataset.recording = "stopped";
    };
    recorder.start(5000);
    capture.disabled = true;
    soak.disabled = true;
    capture.textContent = "Recording…";
    host.dataset.recording = endurance ? "endurance" : "clip";
    if (endurance) {
      const began = performance.now();
      const startedAt = scene.model.state.time;
      const renderedAt = renderedSeconds;
      const monitor = window.setInterval(() => {
        const complete = scene.model.state.time - startedAt >= 1200 &&
          renderedSeconds - renderedAt >= 1200;
        if (complete || !scene.isRunning || performance.now() - began > 2400000) {
          clearInterval(monitor);
          host.dataset.enduranceResult = complete ? "complete" : "interrupted";
          recorder.stop();
        }
      }, 1000);
      soak.textContent = "Soak recording…";
    } else setTimeout(() => recorder.stop(), 12000);
  };
  const laserClip=document.createElement("button");laserClip.textContent="QA Laser clip 12s";laserClip.style.cssText=capture.style.cssText;
  laserClip.onclick=()=>record(false,true);host.append(laserClip);
  capture.onclick = () => record(false);
  soak.onclick = () => record(true);
}
