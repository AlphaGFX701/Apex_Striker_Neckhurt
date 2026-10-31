import type { SpaceScene } from "./game";
/** Development-only capture controls. This module is never imported into a production build. */
export function installQaCapture(
  scene: SpaceScene,
  audio: () => MediaStream | null,
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
  const stats = document.createElement("span");
  stats.style.cssText =
    "font:9px monospace;color:#9cdeff;background:#071322;padding:5px";
  host.append(capture, stats);
  document.body.append(host);
  const frames: number[] = [];
  const samples: Record<string, number>[] = [];
  let runStart = 0,
    lastTime = 0;
  let trackedState=scene.model.state;
  let previous = performance.now();
  const measure = (now: number) => {
    frames.push(now - previous);
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
    }
    lastTime = s.time;
    const heapBytes = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory?.usedJSHeapSize;
    if (scene.isRunning && samples.length < 3600)
      samples.push({
        wallSeconds: (performance.now() - runStart) / 1000,
        time: s.time,
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
    stats.textContent = `QA SIM · ${Math.floor(s.time)}s · ${s.enemies.length}E/${s.enemyBullets.length}B`;
    host.dataset.metrics = JSON.stringify({
      time: s.time,
      frameP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      frames: frames.length,
      enemies: s.enemies.length,
      enemyBullets: s.enemyBullets.length,
    });
  }, 1000);
  capture.onclick = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game canvas");
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    for (const track of audio()?.getAudioTracks() ?? [])
      stream.addTrack(track.clone());
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const u = URL.createObjectURL(new Blob(chunks, { type: "video/webm" })),
        a = document.createElement("a");
      a.href = u;
      a.download = "onslaught-boss-canvas.webm";
      a.click();
      stream.getTracks().forEach((t) => t.stop());
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      capture.disabled = false;
      capture.textContent = "QA Record 12s";
    };
    recorder.start();
    capture.disabled = true;
    capture.textContent = "Recording…";
    setTimeout(() => recorder.stop(), 12000);
  };
}
