import { screens } from "./screens";
import {
  ShipBuildStore,
  loadShipParts,
  composeShip,
  type ShipPartImages,
  type ShipSlot,
} from "./ship-build";
import { GamepadAdapter, type PadFrame, type PadCommand } from "./gamepad";
import { ControllerLab } from "./controller-lab";
import { SensorController } from "./sensor";
import { Feedback } from "./feedback";
import { createGame } from "./game";
import { GameModel, type GameSnapshot } from "./model";
import { ProgressStore } from "./progress";
import {
  EQUIPMENT,
  STAGES,
  defaultRun,
  defaultEquipment,
  equipmentStat,
  type EquipmentId,
  type RunConfig,
} from "./equipment";
import type { Action } from "./motion";
import QRCode from "qrcode";
import "./style.css";
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = screens;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const dialog = (id: string) => el<HTMLDialogElement>(id);
const icon = (id: string) => `<img src="/assets/tactical/${id}.svg" alt="">`;
const progress = new ProgressStore(undefined, true),
  build = new ShipBuildStore(),
  sensor = new SensorController(),
  pad = new GamepadAdapter(),
  feedback = new Feedback();
let source = matchMedia("(pointer: coarse)").matches ? "sensor" : "manual",
  view = "home",
  settingsReturn = "home",
  selectedStage = 0,
  mode: "stage" | "endless" = "stage",
  parts: ShipPartImages | undefined,
  rotation = 0,
  selectedItem: EquipmentId = progress.state.equipment.main,
  slot = "main";
const returnRoutes: string[] = [];
const legacyWeapon = new ProgressStore().state.equipment.main;
let arcadeWeapon: "pulse" | "plasma" | "laser" = legacyWeapon === "laser" || legacyWeapon === "plasma" ? legacyWeapon : "pulse";
try { const saved = localStorage.getItem("gyro-arcade-weapon"); if (saved === "pulse" || saved === "plasma" || saved === "laser") arcadeWeapon = saved; } catch {}
let lastEnergy = 0, lastPickupCount = 0;
let runId = "",
  settled = false,
  lastLives = 3,
  padFrame: PadFrame | undefined,
  padMenu: boolean[] = [],
  labActive = false,
  countdownUntil = 0,
  renderedPower = false,
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
const { scene } = createGame(el("game"), {
  reducedEffects: () =>
    el<HTMLInputElement>("low-effects").checked ||
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
    source === "sensor"
      ? sensor.getAxes(dt)
      : source === "pad" || source === "tilt"
        ? padFrame?.axes || { x: 0, y: 0 }
        : { x: 0, y: 0 },
  actions: () =>
    source === "sensor"
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
function clearInput() {
  scene.clearInput();
  pad.reset();
  sensor.resetTransient();
}
el<HTMLInputElement>("voice").onchange = () => { feedback.voiceEnabled = el<HTMLInputElement>("voice").checked; };
el("test-sound").onclick = () => { feedback.unlock(); feedback.ready(); };
function balance() {
  el("balance").textContent = "";
  el("save-status").textContent = progress.persistent
    ? "Progress saves locally in this browser."
    : "Local storage is unavailable. Progress lasts for this session.";
}
function setView(next: string) {
  if (next !== "controller") controller.cancelRemap();
  view = next;
  document.body.dataset.view = next;
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
  balance();
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
      "Discard appearance changes?",
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
          const back = returnRoutes.pop() || "home";
          settingsReturn = returnRoutes.at(-1) || "home";
          setView(back);
          if (back === "battle") dialog("pause-dialog").showModal();
        }
        return;
      }
      navigate(b.dataset.go!);
    }),
);
el("title-hangar").onclick = () => navigate("hangar");
function paint(id: string, draft = false) {
  if (!parts) return;
  const c = el<HTMLCanvasElement>(id),
    ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(
    composeShip(draft ? build.draft : build.saved, parts, c.width),
    0,
    0,
  );
}
function paintAll() {
  for (const id of ["title-ship", "preflight-ship", "result-ship"]) paint(id);
  paint("ship-preview", true);
  el("title-ship-name").textContent = ["FALCON", "RAVEN", "ATLAS"][
    build.saved.hull
  ];
  el("ship-name").textContent = ["FALCON", "RAVEN", "ATLAS"][build.draft.hull];
}
loadShipParts()
  .then((images) => {
    parts = images;
    paintAll();
    previewDirty = true;
  })
  .catch((e) => toast(e.message));
function renderHangar() {
  const labels: Record<ShipSlot, string> = {
    hull: "Hull",
    wing: "Wings",
    engine: "Engine",
  };
  const choices: Record<ShipSlot, string[]> = {
    hull: ["Falcon", "Raven", "Atlas"],
    wing: ["Swept", "Delta", "Heavy"],
    engine: ["Ion", "Fusion", "Vector"],
  };
  const partHost = el("part-options");
  partHost.replaceChildren();
  for (const part of ["hull", "wing", "engine"] as ShipSlot[]) {
    const field = document.createElement("fieldset"),
      legend = document.createElement("legend"),
      row = document.createElement("div");
    legend.textContent = labels[part];
    row.className = "part-options";
    for (let i = 0; i < 3; i++) {
      const button = document.createElement("button"),
        image = document.createElement("img"),
        caption = document.createElement("span");
      button.dataset.part = part;
      button.dataset.index = String(i);
      button.setAttribute("aria-pressed", String(build.draft[part] === i));
      image.src = `/assets/modules/${part === "wing" ? "wings" : part}-${i}.png`;
      image.alt = "";
      caption.textContent = choices[part][i];
      button.append(image, caption);
      button.onclick = () => {
        build.select(part, i);
        renderHangar();
        paintAll();
        previewDirty = true;
        el("part-options")
          .querySelector<HTMLButtonElement>(
            `[data-part="${part}"][data-index="${i}"]`,
          )
          ?.focus();
      };
      row.append(button);
    }
    field.append(legend, row);
    partHost.append(field);
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-color]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(Number(b.dataset.color) === build.draft.color),
      ),
    );
  renderEquipment();
}
document.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(
  (b) =>
    (b.onclick = () => {
      build.selectColor(Number(b.dataset.color));
      paintAll();
      renderHangar();
      previewDirty = true;
    }),
);
el("save-build").onclick = () => {
  const ok = build.save();
  paintAll();
  toast(ok ? "Appearance saved." : "Appearance applied for this session.");
};
el("reset-build").onclick = () => {
  for (const s of ["hull", "wing", "engine"] as ShipSlot[]) build.select(s, 0);
  build.selectColor(0);
  renderHangar();
  paintAll();
  previewDirty = true;
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
  el("hangar-status").textContent = "All weapons are available. Collect temporary power-ups during flight.";
  el("equipment-slots").innerHTML = "";
  el("equipment-catalog").innerHTML = EQUIPMENT.filter(e => e.slot === "main").map(e => `<button class="catalog-item ${arcadeWeapon === e.id ? "selected" : ""}" data-weapon="${e.id}" aria-pressed="${arcadeWeapon === e.id}">${icon(e.id)}<span><strong>${e.name}</strong><small>${e.description}</small></span><b>${arcadeWeapon === e.id ? "EQUIPPED" : "SELECT"}</b></button>`).join("");
  el("equipment-catalog").querySelectorAll<HTMLButtonElement>("[data-weapon]").forEach(b => b.onclick = () => {
    arcadeWeapon = b.dataset.weapon as typeof arcadeWeapon; selectedItem = arcadeWeapon;
    try { localStorage.setItem("gyro-arcade-weapon", arcadeWeapon); } catch { toast("Weapon saved for this session."); }
    previewDirty = true; renderEquipment();
  });
}

function openEquipment(id: EquipmentId) {
  selectedItem = id;
  const item = EQUIPMENT.find((e) => e.id === id)!,
    level = progress.state.levels[id];
  el("practice-level-label").hidden = !practice();
  el<HTMLSelectElement>("practice-level").value = String(practiceLevels[id]);
  el("unequip-item").hidden = item.slot === "main";
  el("equipment-name").textContent = item.name;
  el("equipment-description").textContent = item.description;
  el("equipment-comparison").innerHTML =
    `<div><small>CURRENT · ${level ? "LEVEL " + level : "LOCKED"}</small><strong>${level ? equipmentStat(id, level) : "Not owned"}</strong></div><div><small>${level === 3 ? "MAXIMUM LEVEL" : "NEXT · LEVEL " + (level + 1)}</small><strong>${equipmentStat(id, Math.min(3, level + 1))}</strong><span class="positive">${level < 3 ? (level === 0 ? "New combat system" : "+20% base firepower / improved system") : "Fully upgraded"}</span></div>`;
  el<HTMLButtonElement>("equip-item").disabled = level === 0 && !practice();
  el<HTMLButtonElement>("upgrade-item").disabled =
    practice() || level >= 3 || progress.state.credits < progress.cost(id);
  el("upgrade-item").textContent = practice()
    ? "All levels available"
    : level >= 3
      ? "Maximum level"
      : `${level ? "Upgrade" : "Unlock"} · ◈ ${progress.cost(id)}`;
  el("equipment-status").textContent = practice()
    ? "Practice can equip any system without purchasing."
    : "";
  el<HTMLSelectElement>("preview-level").value = String(
    practice() ? practiceLevels[id] : Math.max(1, level),
  );
  previewDirty = true;
  if (!dialog("equipment-dialog").open) dialog("equipment-dialog").showModal();
}
let practiceEquipment = defaultEquipment();
let practiceLevels = {
  pulse: 3,
  plasma: 3,
  laser: 3,
  missile: 3,
  shield: 3,
  drone: 3,
};
el("equip-item").onclick = () => {
  const item = EQUIPMENT.find((e) => e.id === selectedItem)!;
  if (practice()) {
    practiceEquipment[item.slot] = item.id;
    practiceLevels[item.id] = Number(
      el<HTMLSelectElement>("practice-level").value,
    );
    toast("Equipped for practice only.");
  } else {
    progress.equip(selectedItem);
    toast("System equipped.");
  }
  renderEquipment();
  previewDirty = true;
  dialog("equipment-dialog").close();
};
el("upgrade-item").onclick = () => {
  if (progress.upgrade(selectedItem)) {
    balance();
    renderEquipment();
    openEquipment(selectedItem);
    toast("Upgrade installed.");
  } else toast("Upgrade unavailable.");
};
el("try-upgrade").onclick = () => {
  el<HTMLSelectElement>("preview-level").value = String(
    Math.min(3, progress.state.levels[selectedItem] + 1),
  );
  previewDirty = true;
  dialog("equipment-dialog").close();
  el("firing-preview").scrollIntoView({ block: "center", behavior: "smooth" });
};
el("practice-level").onchange = () => {
  el<HTMLSelectElement>("preview-level").value =
    el<HTMLSelectElement>("practice-level").value;
  previewDirty = true;
};
el("unequip-item").onclick = () => {
  const item = EQUIPMENT.find((e) => e.id === selectedItem)!;
  if (item.slot === "main") return;
  if (practice()) practiceEquipment[item.slot] = null;
  else {
    progress.state.equipment[item.slot] = null;
    progress.save();
  }
  renderEquipment();
  previewDirty = true;
  dialog("equipment-dialog").close();
};
el("close-equipment").onclick = () => dialog("equipment-dialog").close();
el("preview-level").onchange = () => {
  previewDirty = true;
};
function renderStages() {
  el("stage-cards").innerHTML =
    STAGES.map((s, i) => {
      const locked = false;
      return `<article class="stage-card stage-${i}"><span class="eyebrow">SECTOR 0${i + 1} · ${progress.state.cleared.includes(i) ? "CLEARED" : locked ? "LOCKED" : "AVAILABLE"}</span><img src="/assets/tactical/boss-${i}.png" alt="${s.boss}"><h2>${s.name}</h2><p>${s.description}</p><div class="stage-meta"><span>BOSS <b>${s.boss}</b></span><span>WEAKNESS <b>${s.weakness.toUpperCase()} ×1.25</b></span></div><button class="${locked ? "secondary" : "primary"}" data-stage="${i}" ${locked ? "disabled" : ""}>${locked ? "Clear the previous stage" : "Prepare mission →"}</button></article>`;
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
el("practice-mode").onchange = () => renderStages();
function config(): RunConfig {
  const c = defaultRun();
  c.mode = mode;
  c.stage = selectedStage;
  c.powerups = false;
  c.equipment = { main: arcadeWeapon, secondary: null, armor: null, wingman: null };
  c.levels = { pulse: 1, plasma: 1, laser: 1, missile: 1, shield: 1, drone: 1 };
  return c;
}
function renderPreflight() {
  paint("preflight-ship");
  const c = config();
  el("mission-name").textContent =
    mode === "endless" ? "Endless Frontier" : STAGES[selectedStage].name;
  el("mission-detail").textContent =
    `${practice() ? "PRACTICE · " : ""}${mode === "stage" ? "90 seconds · " : ""}3 lives · Auto-fire`;
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
el<HTMLSelectElement>("mission-weapon").onchange = () => { arcadeWeapon = el<HTMLSelectElement>("mission-weapon").value as typeof arcadeWeapon; selectedItem = arcadeWeapon; try { localStorage.setItem("gyro-arcade-weapon", arcadeWeapon); } catch {} renderPreflight(); };
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
  el("enable-sensors").hidden = source !== "sensor";
  el("center-sensors").hidden = source !== "sensor";
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
for (const id of ["center-sensors", "settings-center", "power-center"])
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
  const message = ready();
  if (message) {
    el("preflight-status").textContent = message;
    return;
  }
  if (!parts) {
    toast("Ship artwork is still loading. Try again shortly.");
    return;
  }
  feedback.unlock();
  scene.model.configure(config());
  scene.setPractice(practice());
  scene.setShipCanvas(composeShip(build.saved, parts, 512));
  runId = crypto.randomUUID();
  settled = false;
  lastLives = 3;
  lastEnergy = 0; lastPickupCount = 0;
  renderedPower = false;
  clearInput();
  setView("battle");
  scene.start();
  sensor.setGestureActive(source === "sensor");
  el("practice-energy").hidden = !practice();
};
function pause(reason = "Take a breath. The frontier can wait.") {
  if (view !== "battle") return;
  countdownUntil = 0;
  scene.pause();
  clearInput();
  sensor.setGestureActive(false);
  el("pause-reason").textContent = reason;
  if (!dialog("pause-dialog").open && !dialog("power-dialog").open)
    dialog("pause-dialog").showModal();
}
function resume() {
  feedback.unlock();
  const reason = ready();
  if (reason) {
    el("pause-reason").textContent = reason;
    return;
  }
  dialog("pause-dialog").close();
  clearInput();
  countdownUntil = 0;
  scene.model.state.invincible = Math.max(scene.model.state.invincible, 0.6);
  scene.resume();
  sensor.setGestureActive(source === "sensor");
  el("battle-hint").textContent = "";
}
el("pause").onclick = () => pause();
el("resume").onclick = resume;
dialog("pause-dialog").addEventListener("cancel", (e) => e.preventDefault());
dialog("power-dialog").addEventListener("cancel", (e) => e.preventDefault());
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
    !countdownUntil &&
    !dialog("power-dialog").open
  )
    dialog("pause-dialog").showModal();
});
for (const [id, action] of [
  ["dodge-left", "dodgeLeft"],
  ["dodge-right", "dodgeRight"],
  ["emp", "emp"],
] as const)
  el(id).onclick = () => scene.action(action);
el("practice-energy").onclick = () => scene.model.fillEnergy();
const perkNames: Record<string, [string, string]> = {
  damage: ["Damage Boost", "+10% main weapon damage"],
  rapid: ["Rapid Fire", "+10% main weapon fire rate"],
  magnet: ["Magnet Field", "+40 pickup attraction range"],
  charger: ["EMP Charger", "+1% EMP energy per second"],
  evasive: ["Evasive Drive", "Dodge cooldown reduced by 0.3s"],
  repair: ["Repair", "Restore one life; at full hull, gain 30% EMP"],
  energy: ["EMP Supply", "Fully charge your EMP"],
  credits: ["Salvage Cache", "Collect 20 additional credits"],
};
function showPowers(s: GameSnapshot) {
  renderedPower = true;
  scene.pause();
  clearInput();
  sensor.setGestureActive(false);
  el("power-cards").innerHTML = s.powerChoices
    .map(
      (id) =>
        `<button class="power-card" data-power="${id}">${icon(id)}<small>FIELD UPGRADE${s.perks[id] ? ` · STACK ${s.perks[id] + 1}/2` : ""}</small><h3>${perkNames[id][0]}</h3><p>${perkNames[id][1]}</p><span>Install upgrade →</span></button>`,
    )
    .join("");
  el("power-cards")
    .querySelectorAll<HTMLButtonElement>("[data-power]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          scene.model.choosePower(b.dataset.power!);
          dialog("power-dialog").close();
          renderedPower = false;
          resume();
        }),
    );
  dialog("power-dialog").showModal();
}
function updateHud(s: GameSnapshot) {
  el("score").textContent = String(s.score).padStart(6, "0");
  el("time").textContent =
    scene.model.config.mode === "endless"
      ? `${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, "0")}`
      : String(Math.ceil(90 - s.time));
  el("wave").textContent =
    scene.model.config.mode === "endless" ? `WAVE ${s.wave}` : "TIME LEFT";
  el("combo").textContent = s.combo > 1 ? `${s.combo} CHAIN` : "";
  el("lives").textContent = "♥ ".repeat(Math.max(0, s.lives)) + "♡ ".repeat(Math.max(0, 3 - s.lives));
  el("shield-status").textContent = s.shield
    ? "SHIELD ONLINE" : "";
  el("run-credits").textContent = s.powers.weapon ? `POWER ${s.powers.weapon + 1}` : "";
  if (s.pickupCount > lastPickupCount) feedback.play("pickup");
  lastPickupCount = s.pickupCount;
  if (s.energy >= 100 && lastEnergy < 100) feedback.ready();
  lastEnergy = s.energy;
  el("emp-state").textContent =
    s.energy >= 100 ? "READY" : `${Math.floor(s.energy)}%`;
  el("emp").classList.toggle("charged", s.energy >= 100);
  el("dodge-state").textContent =
    s.dodgeCooldown > 0 ? "RECHARGING" : "READY";
  el("boss-hud").hidden = !s.boss;
  if (s.boss) {
    el("boss-name").textContent = STAGES[scene.model.config.stage].boss;
    el("boss-phase").textContent = `PHASE ${s.boss.phase || 1}`;
    el<HTMLProgressElement>("boss-health").value = Math.max(
      0,
      s.boss.health / s.boss.maxHealth,
    );
  }
  if (s.lives < lastLives) feedback.play("hit");
  lastLives = s.lives;
  if (s.powerChoices.length && !renderedPower && view === "battle")
    showPowers(s);
  if (s.gameOver && !settled) completeRound();
}
function completeRound() {
  if (settled) return;
  settled = true;
  scene.pause();
  clearInput();
  sensor.setGestureActive(false);
  dialog("pause-dialog").close();
  dialog("power-dialog").close();
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
    ["Flight time", s.time.toFixed(1) + "s"],
    ["Dodges", s.dodges],
    ["EMP uses", s.emps],
  ]
    .map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`)
    .join("");
  el("reward-breakdown").textContent = `Power-ups collected: ${s.pickupCount}`;
  el("result-perks").innerHTML = Object.entries(s.perks)
    .map(([p, n]) => `<span>${perkNames[p][0]} ×${n}</span>`)
    .join("");
  el("next-stage").hidden =
    c.mode !== "stage" ||
    c.stage >= 2 ||
    s.result !== "won";
  paint("result-ship");
  setView("results");
  feedback.play("end");
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
for (const id of ["tilt-sensitivity", "gesture-sensitivity"])
  el<HTMLInputElement>(id).oninput = () => {
    sensor.setSensitivity(
      Number(el<HTMLInputElement>("tilt-sensitivity").value),
    );
    sensor.setGestureSensitivity(
      Number(el<HTMLInputElement>("gesture-sensitivity").value),
    );
    clearInput();
    savePreferences();
  };
el<HTMLInputElement>("sound").onchange = () => {
  feedback.enabled = el<HTMLInputElement>("sound").checked;
  feedback.unlock();
};
el<HTMLInputElement>("haptics").disabled = !("vibrate" in navigator);
el<HTMLInputElement>("haptics").onchange = () => {
  feedback.haptics = el<HTMLInputElement>("haptics").checked;
};
el<HTMLInputElement>("low-effects").onchange = () =>
  document.body.classList.toggle(
    "reduced-effects",
    el<HTMLInputElement>("low-effects").checked,
  );
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
  a.download = "gyro-space-device-trials.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
function stopForVisibility() {
  if (scene.isRunning)
    pause("App switched or window lost focus. Resume when ready.");
  sensor.setGestureActive(false);
  clearInput();
  if (countdownUntil) {
    countdownUntil = 0;
    pause("Resume interrupted.");
  }
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
      const host =
        document.querySelector<HTMLDialogElement>("dialog[open]") || el(view);
      const buttons = Array.from(
        host.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
      ).filter((x) => x.offsetWidth > 0 && x.offsetHeight > 0);
      const index = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (edge(12) || edge(14))
        buttons[(index <= 0 ? buttons.length : index) - 1]?.focus();
      if (edge(13) || edge(15)) buttons[(index + 1) % buttons.length]?.focus();
      if (edge(0) && document.activeElement instanceof HTMLButtonElement)
        document.activeElement.click();
      if (edge(1) && !dialog("power-dialog").open) {
        if (dialog("equipment-dialog").open) dialog("equipment-dialog").close();
        else if (view === "controller" || view === "settings") {
          {
            const back = returnRoutes.pop() || "home";
            settingsReturn = returnRoutes.at(-1) || "home";
            setView(back);
            if (back === "battle") dialog("pause-dialog").showModal();
          }
        }
      }
    }
    padMenu = [...b];
  }
}, 100);
let previewDirty = true,
  preview = new GameModel(),
  previewArt: HTMLCanvasElement | undefined,
  lastFrame = performance.now();
function animate(now: number) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (countdownUntil && view === "battle") {
    const remaining = countdownUntil - now;
    el("battle-hint").textContent =
      `GET READY · ${Math.max(1, Math.ceil(remaining / 1000))}`;
    if (remaining <= 0) {
      countdownUntil = 0;
      const reason = ready();
      if (reason || document.querySelector("dialog[open]")) {
        pause(reason || "Mission paused.");
        requestAnimationFrame(animate);
        return;
      }
      clearInput();
      scene.resume();
      sensor.setGestureActive(source === "sensor");
      el("battle-hint").textContent = "";
    }
  }
  if (view === "hangar" && parts) {
    if (previewDirty) {
      previewDirty = false;
      const c = defaultRun();
      c.equipment = { main: arcadeWeapon, secondary: null, armor: null, wingman: null };
      const item = EQUIPMENT.find((e) => e.id === arcadeWeapon)!;
      c.equipment.main = item.id;
      c.levels = {
        ...(practice() ? practiceLevels : progress.state.levels),
        [selectedItem]: Number(el<HTMLSelectElement>("preview-level").value),
      };
      preview = new GameModel();
      preview.configure(c);
      preview.practice = true;
      previewArt = composeShip(build.draft, parts, 256);
      el("firing-stat").textContent =
        `${item.name} · base weapon · collect power-ups in battle`;
    }
    preview.update(dt, { x: 0, y: 0 });
    preview.state.rocks = [];
    preview.state.enemies = [];
    if (preview.state.time > 5) preview.reset();
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
      ctx.fillRect(b.x * sx - 2, (b.y - offset) * 0.65, 4, 14);
    }
    if (preview.state.laser > 0) {
      ctx.fillStyle = "#a3f4ff";
      ctx.fillRect(
        preview.state.ship.x * sx - 3 - (preview.config.levels.laser || 1) * 2,
        0,
        6 + (preview.config.levels.laser || 1) * 4,
        180,
      );
    }
    if (previewArt)
      ctx.drawImage(previewArt, preview.state.ship.x * sx - 43, 154, 86, 86);
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
setView("home");
