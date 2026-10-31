import { scene, captureGameAudio } from "../src/main";
const bar = document.createElement("aside");
bar.style.cssText =
  "position:fixed;bottom:4px;left:4px;z-index:99999;background:#071222ed;padding:6px;max-width:350px;font:11px monospace";
bar.innerHTML =
  "<b>SIMULATED VISUAL FIXTURES</b><div>" +
  ["Warm-up", "Elite", "Mini-boss", "Final boss"]
    .map((v, i) => `<button data-fixture="${i}">${v}</button>`)
    .join("") +
  '</div><button id="fixture-hide">Hide QA controls</button><button id="fixture-record">Record 12s battle</button><a id="fixture-video" hidden>Download battle clip</a><pre id="fixture-report"></pre>';
document.body.append(bar);
function prepare(at: number) {
  (document.querySelector('[data-go="stages"]') as HTMLButtonElement).click();
  const p = document.getElementById("practice-mode") as HTMLInputElement;
  p.checked = true;
  p.dispatchEvent(new Event("change"));
  (document.querySelector('[data-stage="0"]') as HTMLButtonElement).click();
  const c = document.getElementById("input-source") as HTMLSelectElement;
  c.value = "manual";
  c.dispatchEvent(new Event("change"));
  (document.getElementById("launch") as HTMLButtonElement).click();
  scene.model.reset();
  scene.model.practice = true;
  for (let t = 0; t < at; t += 0.01) scene.model.update(0.01, { x: 0, y: 0 });
  scene.model.drainEvents();
  for (const [time, segment] of [
    [0, 0],
    [15, 1],
    [17, 1],
    [35, 2],
    [37, 2],
    [60, 3],
    [62, 3],
  ])
    if (time <= at)
      (scene as any).environment.update(
        { ...scene.model.state, time, segment },
        false,
      );
}
bar.querySelectorAll<HTMLButtonElement>("[data-fixture]").forEach(
  (b) =>
    (b.onclick = () => {
      scene.pause();
      document
        .querySelectorAll<HTMLDialogElement>("dialog[open]")
        .forEach((d) => d.close());
      if (scene.hasStarted) {
        scene.model.withdraw();
        (
          document.getElementById("result-upgrade") as HTMLButtonElement
        ).click();
      }
      prepare([6, 21, 36.6, 64][Number(b.dataset.fixture)]);
      scene.model.state.invincible = 0;
      scene.model.state.hitEffect = 0;
      scene.pause();
      (scene as any).control.onHud(scene.model.state);
    }),
);
document.getElementById("fixture-hide")!.onclick = () => (bar.hidden = true);
document.getElementById("fixture-record")!.onclick = () => {
  const canvas = document.querySelector("#game canvas") as HTMLCanvasElement;
  const stream = canvas.captureStream(30),
    audio = captureGameAudio();
  if (audio) for (const track of audio.getAudioTracks()) stream.addTrack(track);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" }),
    chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const a = document.getElementById("fixture-video") as HTMLAnchorElement;
    a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    a.download = "environment-battle.webm";
    a.hidden = false;
  };
  scene.resume();
  recorder.start();
  setTimeout(() => recorder.stop(), 12000);
};
setInterval(() => {
  document.getElementById("fixture-report")!.textContent = JSON.stringify(
    {
      time: scene.model.state.time,
      mini: scene.model.state.miniBoss?.health,
      boss: scene.model.state.boss?.health,
    },
    null,
    2,
  );
}, 500);
