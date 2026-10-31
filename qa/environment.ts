import { scene } from "../src/main";
const panel = document.createElement("aside");
panel.style.cssText =
  "position:fixed;right:6px;top:6px;z-index:99999;background:#061323ee;color:#e7f5ff;padding:8px;font:12px monospace;max-width:270px";
panel.innerHTML =
  '<b>QA · SIMULATED PILOT</b><p>Real wall time; physical sensors not tested.</p><button id="qa-soak">Start 20-minute Endless soak</button><button id="qa-stage1">Stage 1</button><button id="qa-stage2">Stage 2</button><button id="qa-stage3">Stage 3</button><pre id="qa-report">Not started</pre><button id="qa-fixture">Sprite fixture</button><button id="qa-graphics">Toggle graphics</button><button id="qa-download">Download report</button><button id="qa-record">Record 12s canvas + game audio</button><a id="qa-video" hidden>Download clip</a>';
document.body.append(panel);
let start = 0,
  completed = false,
  longest = 0,
  last = performance.now(),
  frames = 0;
const samples: unknown[] = [];
function launch(stage: number | null) {
  if (scene.hasStarted) {
    scene.model.withdraw();
    scene.pause();
  }
  document
    .querySelectorAll<HTMLDialogElement>("dialog[open]")
    .forEach((d) => d.close());
  (document.querySelector('[data-go="stages"]') as HTMLButtonElement).click();
  const practice = document.getElementById("practice-mode") as HTMLInputElement;
  practice.checked = true;
  practice.dispatchEvent(new Event("change"));
  (stage === null
    ? document.getElementById("endless-start")
    : document.querySelector(`[data-stage="${stage}"]`)
  )?.dispatchEvent(new MouseEvent("click"));
  const control = document.getElementById("input-source") as HTMLSelectElement;
  control.value = "manual";
  control.dispatchEvent(new Event("change"));
  (document.getElementById("launch") as HTMLButtonElement).click();
}
document.getElementById("qa-soak")!.onclick = () => {
  launch(null);
  start = performance.now();
  completed = false;
  samples.length = 0;
  longest = 0;
};
for (let i = 1; i <= 3; i++)
  document.getElementById(`qa-stage${i}`)!.onclick = () => launch(i - 1);
function frame(now: number) {
  longest = Math.max(longest, now - last);
  last = now;
  frames++;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(() => {
  const s = scene.model.state;
  const report = {
    wallSeconds: start ? Math.round((performance.now() - start) / 1000) : 0,
    simulationSeconds: +s.time.toFixed(1),
    fps: frames,
    worstFrameMs: Math.round(longest),
    objects:
      s.bullets.length +
      s.enemyBullets.length +
      s.enemies.length +
      s.rocks.length +
      s.pickups.length +
      s.explosions.length,
    wave: s.wave,
    result: s.result,
    segment: s.segment,
    miniHP: s.miniBoss?.health,
    bossHP: s.boss?.health,
    textures: [
      ...new Set(
        scene.children.list
          .filter((o: any) => o.texture)
          .map((o: any) => o.texture.key + ":" + o.frame?.name),
      ),
    ].slice(0, 25),
    heapMB: (performance as any).memory
      ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
      : null,
  };
  frames = 0;
  document.getElementById("qa-report")!.textContent = JSON.stringify(
    report,
    null,
    2,
  );
  if (start && !completed) {
    samples.push(report);
    if (report.wallSeconds >= 1200) {
      completed = true;
      scene.pause();
      document.getElementById("qa-report")!.textContent +=
        "\n20-MINUTE SOAK COMPLETE";
    }
  }
}, 1000);
document.getElementById("qa-download")!.onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(samples, null, 2)], { type: "application/json" }),
  );
  a.download = "environment-soak.json";
  a.click();
};
document.getElementById("qa-record")!.onclick = async () => {
  const canvas = document.querySelector("#game canvas") as HTMLCanvasElement;
  const stream = canvas.captureStream(30);
  const audio = (await import("../src/main")).captureGameAudio();
  if (audio) for (const track of audio.getAudioTracks()) stream.addTrack(track);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" }),
    chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const a = document.getElementById("qa-video") as HTMLAnchorElement;
    a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    a.download = "environment-gameplay.webm";
    a.hidden = false;
  };
  recorder.start();
  setTimeout(() => recorder.stop(), 12000);
};

document.getElementById("qa-graphics")!.onclick = () => {
  const art = (scene as any).art;
  art.setVisible(!art.visible);
};

document.getElementById("qa-fixture")!.onclick = () => {
  launch(0);
  scene.model.state.enemies = [0, 1, 2].map((kind) => ({
    x: 80 + kind * 110,
    y: 210,
    radius: 16,
    health: 100,
    shot: 100,
    phase: 0,
    kind,
  }));
};
