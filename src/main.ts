import { FlightAssetGate } from "./launcher";
import { SettingsPanel } from "./settings-panel";
import { DIFFICULTY } from "./neon";
import { screens } from "./screens";
import {
  PixelShipStore,
  loadShipParts,
  composeShip,
  type ShipPartImages,
} from "./ship-build";
import { GamepadAdapter, type PadFrame, type PadCommand } from "./gamepad";
import { ControllerLab } from "./controller-lab";
import { SensorController } from "./sensor";
import { AudioDirector } from "./audio-director";
import { createGame } from "./game";
import { GameModel, comboMultiplier, bossAimPoints, type GameSnapshot } from "./model";
import { SHIPS, pixelShip } from "./pixel-fleet";
import { ProgressStore } from "./progress";
import {
  EQUIPMENT,
  STAGES,
  defaultRun,
  type EquipmentId,
  type RunConfig,
} from "./equipment";
import type { Action } from "./motion";
import QRCode from "qrcode";
import "./style.css";
const qaPilot =
  import.meta.env.DEV && new URLSearchParams(location.search).has("qa");
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = screens;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const dialog = (id: string) => el<HTMLDialogElement>(id);
const icon = (id: string) => `<img src="/assets/tactical/${id}.svg" alt="">`;
const progress = new ProgressStore(
    undefined,
    true,
    "gyro-pixel-progress-v1",
  ),
  build = new PixelShipStore(),
  sensor = new SensorController(),
  pad = new GamepadAdapter(),
  feedback = new AudioDirector();
let source = matchMedia("(pointer: coarse)").matches ? "sensor" : "manual",
  view = "start",
  settingsReturn = "home",
  selectedStage = 0,
  mode: "stage" | "endless" = "stage",
  parts: ShipPartImages | undefined,
  rotation = 0,
  selectedItem: EquipmentId = progress.state.equipment.main;
const returnRoutes: string[] = [];
const legacyWeapon = new ProgressStore().state.equipment.main;
let arcadeWeapon: "pulse" | "plasma" | "laser" =
  legacyWeapon === "laser" || legacyWeapon === "plasma"
    ? legacyWeapon
    : "pulse";
try {
  const saved = localStorage.getItem("gyro-arcade-weapon");
  if (saved === "pulse" || saved === "plasma" || saved === "laser")
    arcadeWeapon = saved;
} catch {}
let appliedReducedEffects = false;
let settingsPanel: SettingsPanel | undefined;
const assetGate = new FlightAssetGate();
let lastEnergy = 0,
  lastPickupCount = 0;
let runId = "",
  settled = false,
  lastLives = 3,
  padFrame: PadFrame | undefined,
  padMenu: boolean[] = [],
  labActive = false,
  toastTimer = 0;
const names: Record<Action, string> = {
  dodgeLeft: "Dodge left",
  dodgeRight: "Dodge right",
  emp: "Shake EMP",
};
function toast(message: string) {
  el("toast").textContent = message;
  el("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => el("toast").classList.remove("visible"),
    3500,
  );
}
function savePreferences() {
  try {
    let previous: Record<string, unknown> = {};
    try {
      const candidate = JSON.parse(
        localStorage.getItem("gyro-loadout-v4") || "{}",
      );
      if (
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate)
      )
        previous = candidate;
    } catch {
      /* Keep preference saving usable when legacy JSON is corrupt. */
    }
    localStorage.setItem(
      "gyro-loadout-v4",
      JSON.stringify({
        ...previous,
        source,
        pad: pad.settings,
        sensitivity: el<HTMLInputElement>("tilt-sensitivity").value,
        gesture: el<HTMLInputElement>("gesture-sensitivity").value,
      }),
    );
  } catch {
    toast("Settings are available for this session only.");
  }
}
try {
  const old = JSON.parse(localStorage.getItem("gyro-loadout-v4") || "null");
  if (old) {
    if (["sensor", "manual", "pad", "tilt"].includes(old.source))
      source = old.source;
    for (const key of ["deadzone", "sensitivity", "axisX", "axisY"] as const)
      if (Number.isFinite(old.pad?.[key])) pad.settings[key] = old.pad[key];
    for (const key of ["invertX", "invertY"] as const)
      pad.settings[key] = old.pad?.[key] === true;
    for (const key of [
      "dodgeLeft",
      "dodgeRight",
      "emp",
      "pause",
    ] as PadCommand[])
      pad.rebind(key, old.pad?.buttons?.[key]);
    for (const [id, v] of [
      ["tilt-sensitivity", old.sensitivity],
      ["gesture-sensitivity", old.gesture],
    ])
      if (Number.isFinite(Number(v)))
        el<HTMLInputElement>(id).value = String(v);
  }
} catch {}
el<HTMLSelectElement>("input-source").value = source;
pad.mode = source === "tilt" ? "tilt" : "stick";
sensor.setSensitivity(Number(el<HTMLInputElement>("tilt-sensitivity").value));
sensor.setGestureSensitivity(
  Number(el<HTMLInputElement>("gesture-sensitivity").value),
);
const controller = new ControllerLab(el("controller"), pad, savePreferences);
let sceneAssetsReady = false,
  loaderProgress = 0;
function refreshLoading() {
  assetGate.progress = loaderProgress;
  assetGate.sceneReady = sceneAssetsReady;
  assetGate.artReady = !!parts;
  el<HTMLProgressElement>("load-progress").value = assetGate.fraction;
  el("load-status").textContent = assetGate.error || `Loading flight assets · ${Math.round(assetGate.fraction * 100)}%`;
  el("flight-loading").hidden = assetGate.ready;
  el<HTMLButtonElement>("launch").disabled = !assetGate.ready;
  el("load-retry").hidden = !assetGate.error;
}
function loadingFailed(message: string) {
  assetGate.error = message;
  refreshLoading();
}
el("load-retry").onclick = () => location.reload();
function pilotAimPoint() {
  const s = scene.model.state;
  return (s.boss && bossAimPoints(s.boss)[0]) || s.miniBoss ||
    s.pickups.find(p => p.kind) || { x: 195, y: 160 };
}

const { scene } = createGame(el("game"), {
  onLoadProgress: (p) => {
    loaderProgress = p;
    refreshLoading();
  },
  onReady: () => {
    sceneAssetsReady = true;
    refreshLoading();
  },
  onLoadError: () =>
    loadingFailed(
      "Some flight assets could not load. Check your connection and retry.",
    ),
  reducedEffects: () =>
    appliedReducedEffects ||
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  manual: () => source === "manual",
  tick: () => {
    padFrame = pad.poll();
    if (
      padFrame.disconnected &&
      (source === "pad" || source === "tilt") &&
      scene.isRunning
    )
      pause("Controller disconnected. Reconnect before resuming.");
    if (padFrame.pause && scene.isRunning)
      pause("Paused from your controller.");
  },
  axes: (dt) =>
    qaPilot
      ? {
          x: Math.max(
            -1,
            Math.min(
              1,
              (pilotAimPoint().x -
                scene.model.state.ship.x) /
                25,
            ),
          ),
          y: Math.max(-1, Math.min(1, (600 - scene.model.state.ship.y) / 25)),
        }
      : source === "sensor"
        ? sensor.getAxes(dt)
        : source === "pad" || source === "tilt"
          ? padFrame?.axes || { x: 0, y: 0 }
          : { x: 0, y: 0 },
  actions: () =>
    qaPilot
      ? scene.model.state.energy >= 100
        ? ["emp"]
        : []
      : source === "sensor"
        ? sensor.consumeActions()
        : source === "pad" || source === "tilt"
          ? padFrame?.actions || []
          : [],
  onFire: (weapon) => feedback.play(weapon),
  onHud: updateHud,
  onAction: (action, accepted, reason) => {
    if (accepted) feedback.play(action === "emp" ? "emp" : "dodge");
    else toast(reason);
  },
  onRelease: () => pause("Touch released. Resume when you are ready."),
});
if (qaPilot) {
  (window as unknown as { __apexQA: typeof scene }).__apexQA = scene;
}
if (qaPilot)
  void import("./qa-tools").then(({ installQaCapture }) =>
    installQaCapture(scene, () => feedback.capture()),
  );
document.addEventListener("pointerdown", () => feedback.unlock(), {
  once: true,
});
document.addEventListener("keydown", () => feedback.unlock(), { once: true });
function clearInput() {
  scene.clearInput();
  pad.reset();
  sensor.resetTransient();
}
el("test-sound").onclick = () => {
  feedback.unlock();
  feedback.play("emp");
};
function balance() {
  el("balance").textContent = "";
  el("save-status").textContent = progress.persistent
    ? "Progress saves locally in this browser."
    : "Local storage is unavailable. Progress lasts for this session.";
}
function setView(next: string) {
  if (view !== next && next !== "battle" && next !== "start") feedback.play("ui-open");
  if (next !== "controller") controller.cancelRemap();
  view = next;
  el("start").hidden = next !== "start";
  if (next === "start") feedback.pauseAudio();
  else if (next !== "battle") {
    feedback.clearAnnouncements();
    feedback.resumeAudio();
    feedback.music("menu");
  }
  document.body.dataset.view = next;
  document.title = `${({ start: "Start", home: "Flight deck", stages: "Missions", hangar: "Hangar", battle: "In flight", preflight: "Preflight", settings: "Settings", controller: "Controller Lab", results: "Flight report", records: "Records" } as Record<string, string>)[next] || "Flight"} · Apex Strikers`;
  document.querySelectorAll<HTMLElement>(".screen").forEach((s) => {
    s.hidden = s.id !== next;
  });
  document
    .querySelectorAll<HTMLButtonElement>(".bottom-nav button")
    .forEach((b) =>
      b.setAttribute("aria-current", String(b.dataset.go === next)),
    );
  sensor.setGestureActive(
    (next === "battle" && scene.isRunning) ||
      (next === "settings" && labActive),
  );
  if (next !== "battle") window.scrollTo(0, 0);
  if (next === "hangar") {
    renderHangar();
    paintAll();
  }
  if (next === "stages") renderStages();
  if (next === "preflight") renderPreflight();
  if (next === "records") renderRecords();
  if (next === "settings") settingsPanel?.open();
  if (next === "home") el("menu-best").textContent = Math.max(0, ...progress.state.records.map(r => r.score)).toLocaleString("en-US");
  balance();
  requestAnimationFrame(() => {
    if (view !== next || next === "battle") return;
    const host = el(next);
    if (host && !host.contains(document.activeElement)) host.querySelector<HTMLElement>("button:not(:disabled),a[href]")?.focus({ preventScroll: true });
  });
}
function confirmAction(title: string, text: string, action: () => void) {
  el("confirm-title").textContent = title;
  el("confirm-description").textContent = text;
  dialog("confirm-dialog").showModal();
  el("confirm-cancel").focus();
  el("confirm-ok").onclick = () => {
    dialog("confirm-dialog").close();
    action();
  };
}
el("confirm-cancel").onclick = () => dialog("confirm-dialog").close();
function navigate(next: string) {
  if (view === "settings" && next !== "settings" && settingsPanel) {
    settingsPanel.leave(() => navigateResolved(next));
    return;
  }
  navigateResolved(next);
}
function navigateResolved(next: string) {
  if (next === view) return;
  if (next === "settings" || next === "controller") {
    settingsReturn = view;
    returnRoutes.push(view);
    if (scene.isRunning) pause("Flight systems are open.");
    dialog("pause-dialog").close();
    setView(next);
    return;
  }
  if (scene.hasStarted && next !== "battle" && next !== "results") {
    confirmAction(
      "Leave this mission?",
      "The current run ends and its score is recorded.",
      () => {
        scene.model.withdraw();
        completeRound();
        setView(next);
      },
    );
    return;
  }
  if (view === "hangar" && build.dirty && next !== "hangar") {
    confirmAction(
      "Discard ship selection?",
      "Your saved ship will stay unchanged.",
      () => {
        build.discard();
        paintAll();
        setView(next);
      },
    );
    return;
  }
  setView(next);
}
document.querySelectorAll<HTMLElement>("[data-go]").forEach(
  (b) =>
    (b.onclick = (e) => {
      e.preventDefault();
      if (
        b.classList.contains("back") &&
        (view === "settings" || view === "controller")
      ) {
        {
          goBack();
        }
        return;
      }
      navigate(b.dataset.go!);
    }),
);
function goBack() {
  const leave = () => {
    const back = returnRoutes.pop() || "home";
    settingsReturn = returnRoutes.at(-1) || "home";
    setView(back);
    if (back === "battle") pause();
  };
  if (view === "settings" && settingsPanel) settingsPanel.leave(leave);
  else leave();
}
el("return-start").onclick = () => confirmAction("Return to Start?", "Your ship and records will stay saved.", () => setView("start"));
let entryClickGuardUntil = 0;
window.addEventListener("apex:start", () => {
  feedback.unlock();
  if (view !== "start") return;
  // A second tap must not fall through onto Play after Start disappears.
  entryClickGuardUntil = performance.now() + 350;
  setView("home");
});
document.addEventListener("click", e => {
  if (view === "home" && (performance.now() < entryClickGuardUntil || e.detail > 1)) {
    e.preventDefault(); e.stopImmediatePropagation();
  }
}, true);
document.addEventListener("click", e => {
  const button = (e.target as HTMLElement).closest("button");
  if (button && !button.disabled && view !== "battle") feedback.play("ui-click");
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
    if (view === "settings" || view === "controller") goBack();
    else if (["stages", "records", "hangar", "preflight"].includes(view)) navigate("home");
  }
});
el("title-hangar").onclick = () => navigate("hangar");
function paintPixelCanvas(canvas: HTMLCanvasElement, shipId: number, level: 1 | 2 | 3) {
  if (!parts) return;
  const ship = pixelShip(shipId), frame = ship.levels[level],
    image = parts[`pixel-${ship.id}-${level}`], ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!image) return;
  const bounds = frame.alphaBounds,
    scale = Math.min(canvas.width * .72 / bounds.width, canvas.height * .72 / bounds.height),
    width = Math.round(bounds.width * scale), height = Math.round(bounds.height * scale);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height,
    Math.round((canvas.width - width) / 2), Math.round((canvas.height - height) / 2), width, height);
}
function paint(id: string, draft = false, level: 1 | 2 | 3 = 1) {
  paintPixelCanvas(el<HTMLCanvasElement>(id), (draft ? build.draft : build.saved).hull, level);
}
function paintAll() {
  for (const id of ["title-ship", "preflight-ship", "result-ship"]) paint(id);
  paint("ship-preview", true, previewLevel);
  el("title-ship-name").textContent = pixelShip(build.saved.hull).name.toUpperCase();
  el("ship-name").textContent = pixelShip(build.draft.hull).name.toUpperCase();
  el("ship-role").textContent = pixelShip(build.draft.hull).role;
  el("showcase-level").textContent = `LEVEL ${previewLevel} · ${previewLevel === 1 ? "STANDARD FRAME" : previewLevel === 2 ? "ASSAULT FRAME" : "HEAVY FRAME"}`;
  el("save-build").textContent = build.dirty ? "Save ship" : "Ship selected";
  el<HTMLButtonElement>("save-build").disabled = !build.dirty;
}
loadShipParts()
  .then((images) => {
    parts = images;
    refreshLoading();
    renderHangar();
    paintAll();
    previewDirty = true;
  })
  .catch((e) => {
    toast(e.message);
    loadingFailed(e.message);
  });
function renderHangar() {
  const host = el("part-options");
  host.replaceChildren();
  host.className = "fleet-options";
  for (const ship of SHIPS) {
    const button = document.createElement("button"),
      portrait = document.createElement("canvas"),
      name = document.createElement("strong"),
      status = document.createElement("span");
    button.className = "fleet-option";
    button.dataset.ship = String(ship.id);
    button.setAttribute("aria-pressed", String(build.draft.hull === ship.id));
    button.setAttribute("aria-label", `Select ${ship.name}`);
    portrait.width = portrait.height = 144;
    portrait.setAttribute("aria-hidden", "true");
    paintPixelCanvas(portrait, ship.id, 1);
    name.textContent = ship.name;
    status.textContent = build.draft.hull === ship.id ? "SELECTED" : "AVAILABLE";
    button.append(portrait, name, status);
    button.onclick = () => {
      build.select("hull", ship.id);
      renderHangar(); paintAll(); previewDirty = true;
      host.querySelector<HTMLButtonElement>(`[data-ship="${ship.id}"]`)?.focus();
    };
    host.append(button);
  }
  renderEquipment();
}
el("save-build").onclick = () => {
  const ok = build.save();
  renderHangar(); paintAll();
  toast(ok ? "Ship saved." : "Ship selected for this session.");
};
el("reset-build").onclick = () => {
  build.discard(); renderHangar(); paintAll(); previewDirty = true;
};
el("rotate-left").onclick = () => rotate(-30);
el("rotate-right").onclick = () => rotate(30);
el("rotate-reset").onclick = () => {
  rotation = 0;
  rotate(0);
};
function rotate(delta: number) {
  rotation += delta;
  el("ship-preview").style.transform = `rotate(${rotation}deg)`;
}
function hangarTab(equipment: boolean) {
  el("appearance-panel").hidden = equipment;
  el("equipment-panel").hidden = !equipment;
  el("appearance-tab").setAttribute("aria-selected", String(!equipment));
  el("appearance-tab").tabIndex = equipment ? -1 : 0;
  el("equipment-tab").tabIndex = equipment ? 0 : -1;
  el("equipment-tab").setAttribute("aria-selected", String(equipment));
}
el("appearance-tab").onclick = () => hangarTab(false);
el("equipment-tab").onclick = () => hangarTab(true);
for (const id of ["appearance-tab", "equipment-tab"])
  el(id).onkeydown = (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const next =
        e.key === "Home"
          ? false
          : e.key === "End"
            ? true
            : id === "appearance-tab";
      hangarTab(next);
      el(next ? "equipment-tab" : "appearance-tab").focus();
    }
  };
function practice() {
  return el<HTMLInputElement>("practice-mode").checked;
}
function renderEquipment() {
  el("hangar-status").textContent =
    "All ships and weapons are free. Power grows only during your flight.";
  el("equipment-slots").innerHTML = "";
  el("equipment-catalog").innerHTML = EQUIPMENT.filter((e) => e.slot === "main")
    .map(
      (e) =>
        `<button class="catalog-item ${arcadeWeapon === e.id ? "selected" : ""}" data-weapon="${e.id}" aria-pressed="${arcadeWeapon === e.id}">${icon(e.id)}<span><strong>${e.name}</strong><small>${e.description}</small></span><b>${arcadeWeapon === e.id ? "EQUIPPED" : "SELECT"}</b></button>`,
    )
    .join("");
  el("equipment-catalog")
    .querySelectorAll<HTMLButtonElement>("[data-weapon]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          arcadeWeapon = b.dataset.weapon as typeof arcadeWeapon;
          selectedItem = arcadeWeapon;
          try {
            localStorage.setItem("gyro-arcade-weapon", arcadeWeapon);
          } catch {
            toast("Weapon saved for this session.");
          }
          previewDirty = true;
          renderEquipment();
        }),
    );
}

function renderStages() {
  el<HTMLSelectElement>("stage-weapon").value = arcadeWeapon;
  el("stage-cards").innerHTML =
    STAGES.map((s, i) => {
      const locked = false;
      return `<article class="stage-card stage-${i}"><span class="eyebrow">SECTOR 0${i + 1} · ${progress.state.cleared.includes(i) ? "CLEARED" : locked ? "LOCKED" : "AVAILABLE"}</span><img src="/assets/onslaught/boss-${i}-preview.png" alt="${s.boss}"><h2>${s.name}</h2><p>${s.description}</p><div class="stage-meta"><span>BOSS <b>${s.boss}</b></span><span>WEAKNESS <b>${s.weakness.toUpperCase()} ×1.25</b></span><span>THREAT <b>${["VANGUARD", "ESCALATED", "ONSLAUGHT"][i]}</b></span></div><button class="${locked ? "secondary" : "primary"}" data-stage="${i}" ${locked ? "disabled" : ""}>${locked ? "Clear the previous stage" : "Prepare mission →"}</button></article>`;
    }).join("") +
    `<article class="stage-card endless-card"><span class="eyebrow">SURVIVAL OPERATIONS</span><h2>Endless frontier.</h2><p>No time limit. Escalating waves, rotating threats and a boss every three waves.</p><button class="primary" id="endless-start" >Prepare endless run →</button></article>`;
  el("stage-cards")
    .querySelectorAll<HTMLButtonElement>("[data-stage]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          selectedStage = Number(b.dataset.stage);
          mode = "stage";
          setView("preflight");
        }),
    );
  el("endless-start").onclick = () => {
    selectedStage = 0;
    mode = "endless";
    setView("preflight");
  };
}
el<HTMLSelectElement>("stage-weapon").onchange = () => {
  arcadeWeapon = el<HTMLSelectElement>("stage-weapon")
    .value as typeof arcadeWeapon;
  selectedItem = arcadeWeapon;
  try {
    localStorage.setItem("gyro-arcade-weapon", arcadeWeapon);
  } catch {}
};
el("practice-mode").onchange = () => renderStages();
function config(): RunConfig {
  const c = defaultRun();
  c.mode = mode;
  c.stage = selectedStage;
  c.powerups = false;
  c.equipment = {
    main: arcadeWeapon,
    secondary: null,
    armor: null,
    wingman: null,
  };
  c.levels = { pulse: 1, plasma: 1, laser: 1, missile: 1, shield: 1, drone: 1 };
  return c;
}
function renderPreflight() {
  paint("preflight-ship");
  const c = config();
  el("mission-name").textContent =
    mode === "endless" ? "Endless Frontier" : STAGES[selectedStage].name;
  el("mission-detail").textContent =
    `${practice() ? "PRACTICE · " : ""}${mode === "stage" ? `2 min assault · ${DIFFICULTY[selectedStage].phases}-phase boss · ` : ""}3 lives · Auto-fire`;
  el("mission-loadout").innerHTML = Object.values(c.equipment)
    .filter(Boolean)
    .map((id) => {
      const e = EQUIPMENT.find((e) => e.id === id)!;
      return `<span>${icon(e.id)}${e.name}</span>`;
    })
    .join("");
  el<HTMLSelectElement>("mission-weapon").value = arcadeWeapon;
  updateControlHelp();
}
el<HTMLSelectElement>("mission-weapon").onchange = () => {
  arcadeWeapon = el<HTMLSelectElement>("mission-weapon")
    .value as typeof arcadeWeapon;
  selectedItem = arcadeWeapon;
  try {
    localStorage.setItem("gyro-arcade-weapon", arcadeWeapon);
  } catch {}
  renderPreflight();
};
function updateControlHelp() {
  const copy: Record<string, string> = {
    sensor:
      "1. Enable sensors and allow Motion. 2. Hold comfortably and set center. 3. Tilt to move the ship preview.",
    manual:
      "Drag below the ship. Arrows / WASD to move. Q / E dodge. Space deploys EMP. Releasing a touch drag pauses flight.",
    pad: "Pair in Bluetooth settings, then press a button. Left stick / D-pad move, LB / RB dodge, bottom button EMP, Start pauses.",
    tilt: "Run and confirm a mapped tilt test in Controller Lab, then set center. Only analog signals reported by the browser are used.",
  };
  el("control-help").textContent = copy[source];
  el("enable-sensors").hidden = source !== "sensor" || sensor.telemetry.state === "active";
  el("center-sensors").hidden = source !== "sensor" || sensor.telemetry.calibrated;
}
el<HTMLSelectElement>("input-source").onchange = () => {
  source = el<HTMLSelectElement>("input-source").value;
  pad.mode = source === "tilt" ? "tilt" : "stick";
  clearInput();
  savePreferences();
  updateControlHelp();
};
for (const id of ["enable-sensors", "settings-enable"])
  el(id).onclick = async () => {
    await sensor.enable();
    toast(sensor.telemetry.message);
  };
for (const id of ["center-sensors", "settings-center"])
  el(id).onclick = () => {
    sensor.calibrate();
    clearInput();
    toast(sensor.telemetry.message);
  };
function ready() {
  if (
    source === "sensor" &&
    (!sensor.telemetry.calibrated || sensor.telemetry.state !== "active")
  )
    return "Enable phone sensors and set center, or select touch / keyboard.";
  if ((source === "pad" || source === "tilt") && !padFrame?.connected)
    return "Connect a controller and press a button, or choose another control source.";
  if (source === "tilt" && !pad.tiltReady)
    return "Complete the mapped tilt test in Controller Lab first.";
  return "";
}
el("launch").onclick = () => {
  if (view !== "preflight" || !assetGate.ready) return;
  const message = ready();
  if (message) {
    el("preflight-status").textContent = message;
    return;
  }
  if (!parts || !scene.sys.isActive()) {
    toast("Ship artwork is still loading. Try again shortly.");
    return;
  }
  feedback.resumeAudio();
  feedback.clearAnnouncements();
  scene.model.configure(config());
  scene.setPractice(practice());
  scene.setPixelShip(build.saved.hull);
  runId = crypto.randomUUID();
  settled = false;
  lastLives = 3;
  lastEnergy = 0;
  lastPickupCount = 0;
  clearInput();
  setView("battle");
  scene.start();
  if (qaPilot) {
    scene.model.practice = true;
    const fixture = new URLSearchParams(location.search).get("fixture");
    if (fixture) {
      const m = scene.model;
      m.state.evolution = { orbs: 5, level: 3, transformRemaining: 0 };
      m.state.powers.weapon = 2;
      m.state.powers.overdrive = 25;
      m.state.shield = true;
      m.state.wingmen.level = 3;
      m.state.drones = [
        { id: 1, side: -1, rank: 0 },
        { id: 2, side: 1, rank: 0 },
      ];
      if (fixture === "icons") {
        m.state.boss = null;
        m.state.miniBoss = null;
        m.state.enemies = [];
        m.state.enemyBullets = [];
        m.state.rocks = [];
        m.state.pickups = (
          ["weapon", "missile", "drone", "shield", "repair", "energy"] as const
        ).map((kind, i) => ({
          x: 85 + (i % 3) * 110,
          y: 290 + Math.floor(i / 3) * 105,
          kind,
          age: 0,
          value: 0,
        }));
        scene.pause();
        updateHud(m.state);
      }
      const seconds =
        fixture === "icons"
          ? 0
          : fixture === "warm"
            ? 16
            : fixture === "elite"
              ? 55
              : fixture === "mini"
                ? 94
                : 128;
      for (let i = 0; i < seconds * 20; i++) {
        m.update(0.05, { x: Math.sin(i * 0.018) * 0.3, y: 0 });
        m.drainEvents();
      }
      if (m.state.boss && fixture === "boss") {
        m.state.boss.health = m.state.boss.maxHealth * (m.config.stage===2?0.15:0.3);
        m.state.boss.phase=DIFFICULTY[m.config.stage].phases;
      }
      if(fixture==='super') m.state.superMode.remaining=5;
      m.state.shield = true;
      m.state.wingmen.level = 3;
      m.state.drones = [
        { id: 101, side: -1, rank: 0 },
        { id: 102, side: 1, rank: 0 },
      ];
      m.state.powers.drone = 3;
      if (fixture === "loss") {
        m.practice = false;
        m.state.energy = 0;
        m.state.shield = false;
        m.state.invincible = 0;
        m.state.lives = 1;
        m.state.enemyBullets = [{ ...m.state.ship, vx: 0, vy: 0 }];
      }
      if (fixture === "victory") {
        m.practice = false;
        if (m.state.boss) m.state.boss.health = 0;
      }
      if (fixture === "meteors") {
        m.state.boss = null;
        m.state.miniBoss = null;
        m.state.enemyBullets = [];
        m.state.beams = [];
        m.state.bullets = [];
        m.state.pickups = [];
        m.state.ship.x = 195;
        m.state.ship.y = 610;
        m.clearInput();
        m.state.enemies = [];
        m.state.rocks = Array.from({ length: 4 }, (_, i) => ({
          x: 65 + i * 85,
          y: 270 + (i % 2) * 100,
          radius: 20 + (i % 2) * 4,
          speed: 0,
          spin: 0,
          phase: i * 0.5,
          target: true,
        }));
        scene.pause();
        updateHud(m.state);
      }
    }
  }
  sensor.setGestureActive(source === "sensor");
  feedback.music("in-the-wreckage");
  el("practice-energy").hidden = !practice();
};
function pause(reason = "Take a breath. The frontier can wait.") {
  if (view !== "battle" || scene.model.state.gameOver) return;
  scene.pause();
  feedback.pauseAudio();
  clearInput();
  sensor.setGestureActive(false);
  el("pause-calibration-status").textContent = "";
  el<HTMLInputElement>("pause-music").checked = feedback.musicEnabled;
  el<HTMLInputElement>("pause-sfx").checked = feedback.enabled;
  el<HTMLInputElement>("pause-music-volume").value = String(
    feedback.musicVolume,
  );
  el<HTMLInputElement>("pause-sfx-volume").value = String(feedback.sfxVolume);
  el("pause-calibrate").hidden = source !== "sensor";
  el("pause-reason").textContent = reason;
  if (!dialog("pause-dialog").open) dialog("pause-dialog").showModal();
}
function resume() {
  feedback.unlock();
  const reason = ready();
  if (reason) {
    el("pause-calibration-status").textContent = "";
    el<HTMLInputElement>("pause-music").checked = feedback.musicEnabled;
    el<HTMLInputElement>("pause-sfx").checked = feedback.enabled;
    el<HTMLInputElement>("pause-music-volume").value = String(
      feedback.musicVolume,
    );
    el<HTMLInputElement>("pause-sfx-volume").value = String(feedback.sfxVolume);
    el("pause-calibrate").hidden = source !== "sensor";
    el("pause-reason").textContent = reason;
    return;
  }
  dialog("pause-dialog").close();
  clearInput();
  scene.model.state.invincible = Math.max(scene.model.state.invincible, 0.6);
  scene.resume();
  feedback.resumeAudio();
  sensor.setGestureActive(source === "sensor");
  el("battle-hint").textContent = "";
}
el("pause").onclick = () => pause();
el("resume").onclick = resume;
dialog("pause-dialog").addEventListener("cancel", (e) => e.preventDefault());

el("pause-calibrate").onclick = () => {
  clearInput();
  el("pause-calibration-status").textContent = sensor.calibrate()
    ? "Center set. Resume when ready."
    : sensor.telemetry.message;
};
for (const [id, setting] of [
  ["pause-music", "music"],
  ["pause-sfx", "sound"],
] as const)
  el<HTMLInputElement>(id).onchange = () => {
    el<HTMLInputElement>(setting).checked = el<HTMLInputElement>(id).checked;
    if (setting === "music")
      feedback.musicEnabled = el<HTMLInputElement>(id).checked;
    else feedback.enabled = el<HTMLInputElement>(id).checked;
    saveAudioPreferences();
  };
for (const [id, setting, key] of [
  ["pause-music-volume", "music-volume", "musicVolume"],
  ["pause-sfx-volume", "sfx-volume", "sfxVolume"],
] as const)
  el<HTMLInputElement>(id).oninput = () => {
    feedback[key] = Number(el<HTMLInputElement>(id).value);
    el<HTMLInputElement>(setting).value = String(feedback[key]);
    saveAudioPreferences();
  };
el("pause-settings").onclick = () => navigate("settings");
el("restart").onclick = () => {
  dialog("pause-dialog").close();
  confirmAction(
    "Restart this mission?",
    "The current run ends and its score is recorded.",
    () => {
      scene.model.withdraw();
      completeRound();
      setView("preflight");
    },
  );
};
el("withdraw").onclick = () => {
  dialog("pause-dialog").close();
  confirmAction(
    "Withdraw from this mission?",
    "The current run ends and its score is recorded.",
    () => {
      scene.model.withdraw();
      completeRound();
    },
  );
};
dialog("confirm-dialog").addEventListener("close", () => {
  if (
    view === "battle" &&
    scene.hasStarted &&
    !scene.isRunning &&
    !document.querySelector("dialog[open]")
  )
      pause();
});
for (const [id, action] of [
  ["dodge-left", "dodgeLeft"],
  ["dodge-right", "dodgeRight"],
  ["emp", "emp"],
] as const)
  el(id).onclick = () => scene.action(action);
el("practice-energy").onclick = () => scene.model.fillEnergy();
function updateHud(s: GameSnapshot) {
  el("score").textContent = String(s.score).padStart(6, "0");
  const clock = s.boss ? Math.max(0, s.time - s.bossStarted) : s.time;
  el("time").textContent =
    `${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, "0")}`;
  el("wave").textContent = s.boss
    ? "BOSS ENGAGED"
    : scene.model.config.mode === "endless"
      ? `WAVE ${s.wave}`
      : "ASSAULT";
  el("combo").textContent = s.combo
    ? `×${comboMultiplier(s.combo)} · ${s.combo} CHAIN`
    : "";
  if (el("lives").dataset.hp !== String(s.lives)) {
    el("lives").dataset.hp = String(s.lives);
    el("lives").innerHTML = Array.from(
      { length: 3 },
      (_, i) =>
        `<i class="hull-segment ${i < s.lives ? "full" : "empty"}" aria-hidden="true"></i>`,
    ).join("");
    el("lives").setAttribute("aria-label", `Hull ${s.lives} of 3`);
  }
  if (el("shield-status").dataset.online !== String(s.shield)) {
    el("shield-status").dataset.online = String(s.shield);
    el("shield-status").classList.toggle("online", s.shield);
    el("shield-status").innerHTML =
      `<img src="/assets/onslaught/pickup-shield.png" alt="">${s.shield ? "SHIELD ONLINE" : "NO SHIELD"}`;
  }
  el("drone-status").textContent = s.superMode.remaining>0 ? `SUPER · ${s.superMode.remaining.toFixed(1)}s` : s.weaponJammed ? "WEAPON JAM" : s.drones.length
    ? `WINGMEN · LV.${s.wingmen.level}`
    : "";
  el("battle").dataset.damage = s.hitEffect > 0 ? s.damageKind : "";
  el("battle").dataset.lowHull = String(s.lives === 1 && !s.gameOver);
  el("run-credits").textContent =
    `LV.${s.evolution.level} · ${Math.min(5, s.evolution.orbs)}/5 ORBS${s.powers.overdrive > 0 ? ` · RED ${Math.ceil(s.powers.overdrive)}s` : ""}`;
  el("run-credits").classList.toggle("overdrive", s.powers.overdrive > 0);
  for (const event of scene.model.drainEvents()) {
    if (event.type === "pickup") feedback.pickup(event.data.effect);
    else if (event.type === "warning") feedback.warning();
    else if (event.type === "shield-hit") feedback.shieldHit();
    else if (event.type === "drone-intercept") feedback.droneIntercept();
    else if (event.type === "hull-hit") feedback.hullHit();
    else if (
      event.type === "enemy-destroyed" ||
      event.type === "mini-destroyed"
    )
      feedback.explosion();
  }
  if (scene.isRunning) feedback.music(s.boss ? "battle" : "in-the-wreckage");
  if (el("stage-warning").textContent !== s.warning)
    el("stage-warning").textContent = s.warning;
  el("stage-warning").hidden = !s.warning;
  el("segment-label").textContent = [
    "WARM-UP",
    "PRESSURE",
    "MINI-BOSS RUSH",
    "FINAL BOSS",
  ][s.segment];
  lastPickupCount = s.pickupCount;
  if (s.energy >= 100 && lastEnergy < 100) feedback.ready();
  lastEnergy = s.energy;
  el("emp-state").textContent =
    s.energy >= 100 ? "READY" : `${Math.floor(s.energy)}%`;
  el("emp").classList.toggle("charged", s.energy >= 100);
  el("emp").style.setProperty("--charge", `${s.energy}%`);
  for (const id of ["dodge-left", "dodge-right"])
    el(id).style.setProperty(
      "--charge",
      `${(1 - s.dodgeCooldown / 2.5) * 100}%`,
    );
  el("dodge-state").textContent = s.dodgeCooldown > 0 ? "RECHARGING" : "READY";
  el("dodge-right").querySelector("small")!.textContent =
    s.dodgeCooldown > 0 ? "RECHARGING" : "READY";
  const targetBoss = s.boss || s.miniBoss;
  el("segment-label").hidden = !!targetBoss;
  el("boss-hud").hidden = !targetBoss;
  if (targetBoss) {
    el("boss-hud").dataset.phase = String(targetBoss.phase || 1);
    el("boss-hud").style.setProperty(
      "--boss-hp",
      `${Math.max(0, targetBoss.health / targetBoss.maxHealth) * 100}%`,
    );
    el("boss-name").textContent = s.boss
      ? STAGES[scene.model.config.stage].boss
      : ["Armored Carrier", "Reactor Frigate", "Command Escort"][
          scene.model.config.stage
        ];
    el("boss-phase").textContent =
      `${Math.max(0, Math.ceil(targetBoss.health))} / ${targetBoss.maxHealth} · PHASE ${targetBoss.phase || 1}${s.boss ? "/"+DIFFICULTY[scene.model.config.stage].phases : ""}`;
    const bossState = s.boss?.state;
    el("boss-objective").hidden = !bossState || bossState === "defeated";
    el("boss-objective").textContent = bossState === "armored" ? "BREAK THE TURRETS" :
      bossState === "exposed" ? `CORE EXPOSED · DAMAGE ×${DIFFICULTY[scene.model.config.stage].exposedDamage}` : bossState === "transition" ? "REARMING" : "";
    el("boss-hud").dataset.state = bossState || "";
    el<HTMLProgressElement>("boss-health").value = Math.max(
      0,
      targetBoss.health / targetBoss.maxHealth,
    );
  }
  lastLives = s.lives;
  const ending=document.getElementById('ending-banner');
  if(ending) {
    ending.hidden=!s.ending || s.ending.duration===0;
    ending.textContent=s.ending && s.ending.elapsed >= (s.ending.kind==='victory'?3:1.5) ? s.ending.kind==='victory'?'VICTORY':'GAME OVER' : '';
    ending.dataset.kind=s.ending?.kind??'';
  }
  if (s.gameOver && !settled && (!s.ending || s.ending.elapsed >= s.ending.duration)) completeRound();
}
function completeRound() {
  if (settled) return;
  settled = true;
  scene.pause();
  feedback.pauseAudio();
  clearInput();
  sensor.setGestureActive(false);
  dialog("pause-dialog").close();
  const s = scene.model.state,
    c = scene.model.config,
    _reward = progress.settle(runId, {
      practice: scene.model.practice,
      mode: c.mode,
      stage: c.stage,
      won: s.result === "won",
      credits: s.credits,
      score: s.score,
      time: s.time,
    });
  const outcome = s.result || "withdrawn";
  const resultHeading = {
    won: "VICTORY",
    lost: "GAME OVER",
    timeout: "GAME OVER",
    practice: "PRACTICE COMPLETE",
    withdrawn: "WITHDRAWN",
  }[outcome];
  el("results").querySelector("h1")!.textContent = resultHeading;
  el("results").dataset.outcome = outcome;
  el("result-title").textContent = {
    won: "Sector secured.",
    lost: "Signal lost.",
    timeout: "Time expired.",
    practice: "Practice complete.",
    withdrawn: "Fleet recalled.",
  }[s.result || "withdrawn"];
  el("result-mode").textContent =
    `${scene.model.practice ? "PRACTICE / " : ""}${c.mode === "endless" ? "ENDLESS FRONTIER" : STAGES[c.stage].name.toUpperCase()}`;
  el("result-description").textContent = scene.model.practice
    ? "Training only. No progression or records changed."
    : s.result === "won"
      ? "Route cleared. Return stronger for the next frontier."
      : "Every flight teaches you something. Refit and try again.";
  el("result-stats").innerHTML = [
    ["Score", s.score.toLocaleString("en-US")],
    ["Survival Time", s.time.toFixed(1) + "s"],
    ["Enemies Destroyed", s.stats.enemiesDestroyed],
    ["Best Multiplier", `×${s.stats.bestMultiplier}`],
    ["EMP uses", s.emps],
    ["Shots intercepted", s.intercepted],
    ["Power-ups", s.pickupCount],
  ]
    .map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`)
    .join("");
  el("reward-breakdown").textContent = `Power-ups collected: ${s.pickupCount}`;
  el("result-perks").textContent = `Flight seed ${s.seed}`;
  el("next-stage").hidden =
    c.mode !== "stage" || c.stage >= 2 || s.result !== "won";
  paint("result-ship", false, s.evolution.level);
  if (s.result === "won") feedback.victory();
  else if (s.result === "lost") feedback.defeat();
  const delay = 0;
  if (delay)
    window.setTimeout(() => {
      if (view === "battle" && settled) {
        dialog("pause-dialog").close();
        setView("results");
      }
    }, delay);
  else setView("results");
}
el("retry").onclick = () => setView("preflight");
el("next-stage").onclick = () => {
  selectedStage = Math.min(2, selectedStage + 1);
  setView("preflight");
};
el("result-upgrade").onclick = () => {
  setView("hangar");
  hangarTab(true);
};
function renderRecords() {
  el("record-list").replaceChildren();
  if (!progress.state.records.length) {
    el("record-list").innerHTML =
      '<div class="panel"><h2>Your story starts in flight.</h2><p>Finish a mission or an Endless run to record your first score.</p><button class="primary" id="record-battle">Choose a mission →</button></div>';
    el("record-battle").onclick = () => setView("stages");
    return;
  }
  progress.state.records.forEach((r, i) => {
    const e = document.createElement("article");
    e.className = "panel record-row";
    e.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b><div><strong>${r.mode === "endless" ? "Endless Frontier" : STAGES[r.stage]?.name || "Mission"}</strong><small></small></div><strong>${Number(r.score).toLocaleString("en-US")}</strong><span>${Number(r.time).toFixed(1)}s</span>`;
    e.querySelector("small")!.textContent = new Date(r.date).toLocaleDateString(
      "en-US",
    );
    el("record-list").append(e);
  });
}
el("gesture-lab-toggle").onclick = () => {
  labActive = !labActive;
  sensor.setGestureActive(labActive);
  el("gesture-lab-toggle").textContent = labActive
    ? "Stop gesture lab"
    : "Start gesture lab";
  el("gesture-lab-toggle").setAttribute("aria-pressed", String(labActive));
};
let trial: { expected: Action; detected: Action[]; finished: boolean } | null =
  null;
const trials: {
  expected: Action;
  detected: Action[];
  result: string;
  date: string;
}[] = [];
sensor.onGesture((action) => {
  if (labActive) el("gesture-event").textContent = `Detected: ${names[action]}`;
  if (trial && !trial.finished) trial.detected.push(action);
});
el("trial-start").onclick = () => {
  if (
    !labActive ||
    !sensor.telemetry.calibrated ||
    sensor.telemetry.motionState !== "active"
  ) {
    el("trial-status").textContent =
      "Enable sensors, set center and start the gesture lab first.";
    return;
  }
  el<HTMLButtonElement>("trial-start").disabled = true;
  trial = {
    expected: el<HTMLSelectElement>("trial-action").value as Action,
    detected: [],
    finished: false,
  };
  sensor.resetTransient();
  el("trial-status").textContent =
    "Wait 0.7 seconds, then perform one gesture. Recording for five seconds.";
  setTimeout(() => {
    if (!trial) return;
    trial.finished = true;
    el("trial-status").textContent =
      `Detected: ${trial.detected.map((a) => names[a]).join(", ") || "none"}. Label the result below.`;
    document
      .querySelectorAll<HTMLButtonElement>("[data-trial]")
      .forEach((b) => (b.disabled = false));
  }, 5000);
};
document.querySelectorAll<HTMLButtonElement>("[data-trial]").forEach(
  (b) =>
    (b.onclick = () => {
      if (!trial?.finished) return;
      trials.push({
        expected: trial.expected,
        detected: trial.detected,
        result: b.dataset.trial!,
        date: new Date().toISOString(),
      });
      trial = null;
      el<HTMLButtonElement>("trial-start").disabled = false;
      document
        .querySelectorAll<HTMLButtonElement>("[data-trial]")
        .forEach((b) => (b.disabled = true));
      el("trial-counts").textContent = Object.entries(names)
        .map(([id, label]) => {
          const rows = trials.filter((t) => t.expected === id);
          return `${label}: ${rows.length}/10 · ${rows.filter((t) => t.result === "correct").length} correct · ${rows.filter((t) => t.result === "miss").length} missed · ${rows.filter((t) => t.result === "wrong").length} wrong`;
        })
        .join(" | ");
    }),
);
el("trial-export").onclick = () => {
  const u = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            type: "user-labelled-physical-device-trials",
            userAgent: navigator.userAgent,
            trials,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = "apex-strikers-device-trials.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
function stopForVisibility() {
  if (scene.isRunning)
    pause("App switched or window lost focus. Resume when ready.");
  sensor.setGestureActive(false);
  clearInput();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopForVisibility();
});
window.addEventListener("blur", stopForVisibility);
sensor.subscribe((t) => {
  if (
    source === "sensor" &&
    scene.isRunning &&
    ["stale", "recalibrate", "denied", "unavailable"].includes(t.state)
  )
    pause(t.message);
});
el("help-open").onclick = () => dialog("help-dialog").showModal();
el("help-close").onclick = () => dialog("help-dialog").close();
QRCode.toCanvas(
  el<HTMLCanvasElement>("qr"),
  "https://gyro-space-lab-th.mjadsakul.chatgpt.site/",
  { width: 160, margin: 1, color: { dark: "#eaf2fa", light: "#101a2b" } },
).catch(() => {});
let traces: { a: number | null; r: number | null }[] = [];
const val = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v) ? "Unavailable" : v.toFixed(1);
window.setInterval(() => {
  sensor.tick();
  const wasRemapping = controller.remapping;
  if (padFrame && view === "controller") controller.update(padFrame);
  const t = sensor.telemetry;
  el("sensor-status").textContent =
    `${t.state.toUpperCase()} · ${t.message} ${t.motionMessage}`;
  if (view === "preflight") {
    updateControlHelp();
    el("preflight-status").textContent =
      source === "sensor"
        ? t.message
        : source === "manual"
          ? "Touch / keyboard ready."
          : padFrame?.connected
            ? "Controller connected."
            : "Press a controller button to connect.";
    const a = source === "sensor" ? sensor.getAxes(0.1) : padFrame?.axes;
    el("preflight-ship").style.transform = a
      ? `translate(${a.x * 18}px,${a.y * 18}px)`
      : "";
  }
  el("sensor-numbers").innerHTML =
    `<span>TILT / MOTION RATE<b>${val(t.hz)} / ${val(t.motionHz)} Hz</b></span><span>BETA / GAMMA<b>${val(t.beta)}° / ${val(t.gamma)}°</b></span><span>ACCEL X / Y / Z<b>${val(t.acceleration.x)} / ${val(t.acceleration.y)} / ${val(t.acceleration.z)}</b></span><span>ROTATION α / β / γ<b>${val(t.rotation.alpha)} / ${val(t.rotation.beta)} / ${val(t.rotation.gamma)}</b></span><span>ACCEL SOURCE<b>${t.motionState !== "active" ? "Unavailable" : t.estimated ? "Estimated gravity removal" : "Device linear acceleration"}</b></span>`;
  traces.push({
    a: t.motionState === "active" ? t.strength : null,
    r: t.motionState === "active" ? t.roll : null,
  });
  traces = traces.slice(-120);
  if (view === "settings") {
    const ctx = el<HTMLCanvasElement>("sensor-graph").getContext("2d")!;
    ctx.clearRect(0, 0, 720, 180);
    for (const [key, max, color] of [
      ["a", 25, "#60d8ff"],
      ["r", 300, "#f0bc74"],
    ] as const) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      let pen = false;
      traces.forEach((v, i) => {
        if (v[key] === null) {
          pen = false;
          return;
        }
        const x = (i / 119) * 720,
          y = 170 - Math.min(1, Math.abs(v[key]!) / max) * 150;
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      });
      ctx.stroke();
    }
    if (labActive) sensor.consumeActions();
  }
  if (padFrame) {
    const b = padFrame.buttons,
      edge = (i: number) => b[i] && !padMenu[i];
    if (
      !wasRemapping &&
      !controller.remapping &&
      (view !== "battle" || !!document.querySelector("dialog[open]"))
    ) {
      const modal = document.querySelector<HTMLDialogElement>("dialog[open]");
      const host = modal || el(view);
      const controls = Array.from(host.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary"))
        .filter(x => x.offsetWidth > 0 && x.offsetHeight > 0);
      const focused = document.activeElement as HTMLElement;
      const index = controls.indexOf(focused);
      const adjust = (direction: number) => {
        if (focused instanceof HTMLInputElement && focused.type === "range") {
          if (direction > 0) focused.stepUp(); else focused.stepDown();
          focused.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        if (focused instanceof HTMLSelectElement) {
          focused.selectedIndex = Math.max(0, Math.min(focused.options.length - 1, focused.selectedIndex + direction));
          focused.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        return false;
      };
      if (edge(12) || (edge(14) && !adjust(-1))) controls[(index <= 0 ? controls.length : index) - 1]?.focus();
      if (edge(13) || (edge(15) && !adjust(1))) controls[(index + 1) % controls.length]?.focus();
      if (edge(0)) {
        if (focused instanceof HTMLSelectElement) adjust(1);
        else focused?.click();
      }
      if (edge(1)) {
        if (modal?.id === "confirm-dialog") el("confirm-cancel").click();
        else if (modal?.id === "help-dialog") el("help-close").click();
        else if (modal?.id === "pause-dialog") el("resume").click();
        else if (view === "controller" || view === "settings") goBack();
        else if (["stages", "records", "hangar", "preflight"].includes(view)) navigate("home");
      }
    }
    padMenu = [...b];
  }
}, 100);
const previewTextures = new Map<string, HTMLImageElement>();
for (const key of ["evo-pulse", "evo-plasma", "evo-red", "evo-missile"]) {
  const im = new Image();
  im.src = `/assets/evolution/${key}.png`;
  previewTextures.set(key, im);
}
for (const ship of SHIPS) for (const level of [1, 2, 3] as const) {
  for (const frame of [...ship.levels[level].engineFrames, ...ship.levels[level].muzzleFrames]) {
    const im = new Image(); im.src = frame.url; previewTextures.set(frame.key, im);
  }
}
let previewLevel: 1 | 2 | 3 = 1;
let previewDirty = true,
  preview = new GameModel(),
  previewArt: HTMLCanvasElement | undefined,
  lastFrame = performance.now();
feedback.onAnnouncement = (text) => {
  el("pickup-announcement").textContent = text.toUpperCase();
  el("pickup-announcement").dataset.until = String(performance.now() + 1800);
};
for (const button of Array.from(
  el("preview-levels").querySelectorAll<HTMLButtonElement>("button"),
))
  button.onclick = () => {
    previewLevel = Number(button.dataset.previewLevel) as 1 | 2 | 3;
    previewDirty = true;
    paintAll();
    for (const b of Array.from(el("preview-levels").querySelectorAll("button")))
      b.setAttribute("aria-pressed", String(b === button));
  };
function saveAudioPreferences() {
  try {
    localStorage.setItem(
      "gyro-evolution-audio",
      JSON.stringify({
        music: feedback.musicEnabled,
        sfx: feedback.enabled,
        musicVolume: feedback.musicVolume,
        sfxVolume: feedback.sfxVolume,
      }),
    );
  } catch {}
}
try {
  const a = JSON.parse(localStorage.getItem("gyro-evolution-audio") || "{}");
  for (const k of ["musicVolume", "sfxVolume"] as const)
    if (Number.isFinite(a[k])) feedback[k] = Math.max(0, Math.min(1, a[k]));
  feedback.musicEnabled = a.music !== false;
  feedback.enabled = a.sfx !== false;
  el<HTMLInputElement>("music").checked = feedback.musicEnabled;
  el<HTMLInputElement>("sound").checked = feedback.enabled;
  el<HTMLInputElement>("music-volume").value = String(feedback.musicVolume);
  el<HTMLInputElement>("sfx-volume").value = String(feedback.sfxVolume);
} catch {}
function animate(now: number) {
  feedback.update();
  if (performance.now() > Number(el("pickup-announcement").dataset.until || 0))
    el("pickup-announcement").textContent = "";
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (view === "hangar" && parts) {
    if (previewDirty) {
      previewDirty = false;
      const c = defaultRun();
      c.equipment = {
        main: arcadeWeapon,
        secondary: null,
        armor: null,
        wingman: null,
      };
      const item = EQUIPMENT.find((e) => e.id === arcadeWeapon)!;
      c.equipment.main = item.id;
      c.levels = {
        pulse: 1,
        plasma: 1,
        laser: 1,
        missile: 1,
        shield: 1,
        drone: 1,
      };
      preview = new GameModel();
      preview.configure(c);
      preview.practice = true;
      preview.state.evolution = {
        orbs: previewLevel === 3 ? 5 : previewLevel === 2 ? 2 : 0,
        level: previewLevel,
        transformRemaining: 0,
      };
      preview.state.powers.weapon = previewLevel - 1;
      previewArt = composeShip(build.draft, parts, 256, previewLevel);
      el("firing-stat").textContent =
        `${item.name} · LEVEL ${previewLevel} · ${[100, 160, 230][previewLevel - 1]}% main firepower`;
    }
    preview.update(dt, { x: 0, y: 0 });
    preview.state.rocks = [];
    preview.state.enemies = [];
    if (preview.state.time > 5) previewDirty = true;
    const ctx = el<HTMLCanvasElement>("firing-preview").getContext("2d")!;
    ctx.clearRect(0, 0, 480, 240);
    ctx.fillStyle = "#080f1c";
    ctx.fillRect(0, 0, 480, 240);
    ctx.strokeStyle = "#182b40";
    for (let x = 0; x < 480; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 240);
      ctx.stroke();
    }
    const sx = 480 / 390,
      offset = preview.state.ship.y - 300;
    for (const b of preview.state.bullets) {
      ctx.fillStyle = b.missile
        ? "#f0bc74"
        : b.type === "plasma"
          ? "#c3a5ff"
          : "#8be7ff";
      const key = b.interceptor
        ? "evo-red"
        : b.missile
          ? "evo-missile"
          : b.type === "plasma"
            ? "evo-plasma"
            : "evo-pulse";
      const im = previewTextures.get(key);
      ctx.imageSmoothingEnabled = false;
      if (im?.complete && im.naturalWidth)
        ctx.drawImage(im, b.x * sx - 5, (b.y - offset) * 0.65, 10, 16);
      else ctx.fillRect(b.x * sx - 2, (b.y - offset) * 0.65, 4, 14);
    }
    if (preview.state.laser > 0) {
      ctx.fillStyle = "#a3f4ff";
      const w = 7 + (previewLevel - 1) * 4;
      ctx.fillRect(preview.state.ship.x * sx - w / 2, 0, w, 180);
      for (let i = 1; i < previewLevel; i++)
        for (const side of [-1, 1])
          ctx.fillRect(
            (preview.state.ship.x + side * i * 14) * sx - 1,
            0,
            2,
            180,
          );
    }
    const shipFrame = pixelShip(build.draft.hull).levels[previewLevel],
      engine = previewTextures.get(shipFrame.engineFrames[Math.floor(now / 90) % shipFrame.engineFrames.length].key),
      muzzle = previewTextures.get(shipFrame.muzzleFrames[Math.floor(now / 45) % shipFrame.muzzleFrames.length].key),
      shipLeft = Math.round(preview.state.ship.x * sx - 66);
    if (engine?.complete && engine.naturalWidth)
      ctx.drawImage(engine, shipLeft, 130, 132, 132);
    if (previewArt) ctx.drawImage(previewArt, shipLeft, 130, 132, 132);
    if (muzzle?.complete && muzzle.naturalWidth)
      ctx.drawImage(muzzle, shipLeft, 130, 132, 132);
    if (preview.config.equipment.wingman && previewArt) {
      ctx.drawImage(previewArt, preview.state.ship.x * sx - 72, 185, 30, 30);
      if (preview.config.levels.drone > 1)
        ctx.drawImage(previewArt, preview.state.ship.x * sx + 45, 185, 30, 30);
    }
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
renderHangar();
renderStages();
settingsPanel = new SettingsPanel({
  source: () => source,
  confirm: confirmAction,
  onApply: values => {
    source = values.source;
    el<HTMLSelectElement>("input-source").value = source;
    pad.mode = source === "tilt" ? "tilt" : "stick";
    sensor.setSensitivity(values.sensitivity);
    sensor.setGestureSensitivity(values.gesture);
    feedback.musicEnabled = values.music;
    feedback.enabled = values.sfx;
    feedback.musicVolume = values.musicVolume;
    feedback.sfxVolume = values.sfxVolume;
    feedback.haptics = values.haptics;
    appliedReducedEffects = values.reduced;
    document.body.classList.toggle("reduced-effects", values.reduced);
    clearInput(); updateControlHelp(); savePreferences(); saveAudioPreferences();
    try { localStorage.setItem("apex-launcher-display", JSON.stringify({ reduced: values.reduced, haptics: values.haptics })); }
    catch { toast("Settings are available for this session only."); }
  },
});
try {
  const saved = JSON.parse(localStorage.getItem("apex-launcher-display") || "{}");
  appliedReducedEffects = saved.reduced === true;
  feedback.haptics = saved.haptics === true && "vibrate" in navigator;
  el<HTMLInputElement>("low-effects").checked = appliedReducedEffects;
  el<HTMLInputElement>("haptics").checked = feedback.haptics;
  document.body.classList.toggle("reduced-effects", appliedReducedEffects);
} catch {}
refreshLoading();
setView("start");

export { scene };

export function captureGameAudio() {
  return feedback.capture();
}
