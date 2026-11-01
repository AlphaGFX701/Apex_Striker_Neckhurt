import { GamepadAdapter, type PadFrame, type PadCommand } from "./gamepad";
export const controllerMarkup = `<div class="lab-heading"><span class="eyebrow">INPUT DIAGNOSTICS</span><div><span class="live-badge">LIVE CONTROLLER</span></div><p>Pair your controller, then press a button.</p><label>Controller<select id="controller-select"><option value="">Auto detect</option></select></label><p id="controller-status" role="status"></p></div>
<div class="lab-grid"><div class="panel controller-panel"><div class="gamepad-shape"><div class="shoulders"><span data-pad="4">LB · 4</span><span data-pad="5">RB · 5</span></div><div class="pad-face"><div class="dpad"><span data-pad="12">↑</span><span data-pad="14">←</span><span data-pad="15">→</span><span data-pad="13">↓</span></div><div class="pad-center"><span data-pad="8">8</span><span data-pad="9">START · 9</span></div><div class="face-buttons"><span data-pad="3">Y · 3</span><span data-pad="2">X · 2</span><span data-pad="1">B · 1</span><span data-pad="0">A · 0</span></div></div><div class="sticks"><div class="stick" id="stick-left"><i></i><small>LEFT STICK</small></div><div class="stick" id="stick-right"><i></i><small>RIGHT STICK</small></div></div><div class="trigger-row"><label>LT · 6<progress id="trigger-left" max="1" value="0"></progress></label><label>RT · 7<progress id="trigger-right" max="1" value="0"></progress></label></div></div><p class="muted">Standard labels are guides. Button numbers show what your browser actually receives.</p></div>
<div class="panel"><span class="eyebrow">FLIGHT TEST</span><div class="test-field"><img id="test-ship" src="/assets/modules/previews/ship-0-0-0.png" alt="Controller test ship"></div><div id="command-lights" class="command-lights"></div><ul id="controller-checks" class="check-list"></ul><button id="reset-pad-test" class="secondary">Reset observed checks</button><button id="export-pad-test" class="secondary">Export observations</button></div>
<div class="panel"><h2>Configure</h2><div class="range-row"><label>Dead zone <output id="dead-value">0.15</output><input id="dead-zone" type="range" min="0" max=".5" step=".01"></label><label>Sensitivity <input id="pad-gain" type="range" min=".25" max="3" step=".05"></label></div><div class="range-row"><label><input id="invert-x" type="checkbox"> Invert X</label><label><input id="invert-y" type="checkbox"> Invert Y</label></div><div id="remap-buttons" class="button-grid"></div><button id="cancel-remap" class="text-button" hidden>Cancel remap</button><p id="remap-status" role="status">Select an action, then press the desired controller button.</p><button id="controller-center" class="secondary">Set center</button></div>
<div class="panel"><h2>Test mapped tilt</h2><p>Some controllers convert tilting into analog axes. This is not a standard raw gyroscope reading.</p><div class="range-row"><label>X axis<input id="axis-x" type="number" min="0" max="15"></label><label>Y axis<input id="axis-y" type="number" min="0" max="15"></label></div><button id="test-tilt" class="primary">Run 5-second tilt test</button><label class="check-label"><input id="confirm-tilt" type="checkbox"> I released the sticks and only tilted the controller.</label><p id="tilt-status" role="status"></p><details><summary>Advanced · raw browser inputs</summary><p>FANTECH compatibility depends on its connection mode and your browser.</p><pre id="raw-pad"></pre></details></div></div>`;
const labels: Record<PadCommand, string> = {
  dodgeLeft: "Dodge left",
  dodgeRight: "Dodge right",
  emp: "EMP",
  pause: "Pause",
};
export class ControllerLab {
  private observed = new Set<string>();
  private pending: PadCommand | null = null;
  private prev: boolean[] = [];
  private devices = "";
  private identity = "";
  private frame: PadFrame | null = null;
  private tiltTimer: number | undefined;
  constructor(
    private root: HTMLElement,
    private pad: GamepadAdapter,
    private save: () => void,
  ) {
    const by = <T extends HTMLElement>(id: string) =>
      root.querySelector<T>("#" + id)!;
    for (const [id, key] of [
      ["dead-zone", "deadzone"],
      ["pad-gain", "sensitivity"],
      ["axis-x", "axisX"],
      ["axis-y", "axisY"],
    ] as const) {
      const input = by<HTMLInputElement>(id);
      input.value = String(pad.settings[key]);
      input.oninput = () => {
        pad.settings[key] = Number(input.value);
        pad.reset();
        save();
      };
    }
    for (const [id, key] of [
      ["invert-x", "invertX"],
      ["invert-y", "invertY"],
    ] as const) {
      const input = by<HTMLInputElement>(id);
      input.checked = pad.settings[key];
      input.onchange = () => {
        pad.settings[key] = input.checked;
        pad.reset();
        save();
      };
    }
    by("remap-buttons").innerHTML = Object.entries(labels)
      .map(
        ([id, label]) =>
          `<button class="secondary" data-remap="${id}">${label}: <b>${pad.settings.buttons[id as PadCommand]}</b></button>`,
      )
      .join("");
    root.querySelectorAll<HTMLButtonElement>("[data-remap]").forEach(
      (b) =>
        (b.onclick = () => {
          this.pending = b.dataset.remap as PadCommand;
          by("cancel-remap").hidden = false;
          by("remap-status").textContent =
            `Press a controller button for ${labels[this.pending]}.`;
        }),
    );
    by("cancel-remap").onclick = () => this.cancelRemap();
    by("controller-center").onclick = () => {
      by("remap-status").textContent = pad.calibrate()
        ? "Center set."
        : "No valid connected axes available.";
    };
    by<HTMLSelectElement>("controller-select").onchange = (e) => {
      const value = (e.target as HTMLSelectElement).value;
      pad.selectedIndex = value === "" ? null : Number(value);
      pad.reset();
      this.observed.clear();
    };
    by("test-tilt").onclick = () => {
      if (!pad.beginTiltTrial()) return;
      by<HTMLInputElement>("confirm-tilt").checked = false;
      by<HTMLButtonElement>("test-tilt").disabled = true;
      this.tiltTimer = window.setTimeout(() => {
        pad.finishTiltTrial();
        by<HTMLButtonElement>("test-tilt").disabled = false;
      }, 5000);
    };
    by<HTMLInputElement>("confirm-tilt").onchange = (e) => {
      if (!(e.target as HTMLInputElement).checked) return;
      if (!pad.confirmTiltTrial())
        (e.target as HTMLInputElement).checked = false;
    };
    by("reset-pad-test").onclick = () => this.observed.clear();
    by("export-pad-test").onclick = () => {
      const data = {
        type: "observed-browser-controller-input",
        physicalCompatibilityVerified: false,
        date: new Date().toISOString(),
        controller: this.frame?.id || null,
        checks: [...this.observed],
        settings: pad.settings,
        rawAxes: this.frame?.rawAxes,
        buttonValues: this.frame?.buttonValues,
      };
      const u = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = u;
      a.download = "controller-observations.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
  }
  cancelRemap() {
    this.pending = null;
    this.root.querySelector<HTMLElement>("#cancel-remap")!.hidden = true;
    this.root.querySelector<HTMLElement>("#remap-status")!.textContent =
      "Select an action, then press the desired controller button.";
  }
  get remapping() {
    return this.pending !== null;
  }
  update(f: PadFrame) {
    this.frame = f;
    const q = <T extends HTMLElement>(id: string) =>
      this.root.querySelector<T>("#" + id)!;
    const devices = this.pad.available(),
      signature = JSON.stringify(devices);
    if (signature !== this.devices) {
      this.devices = signature;
      const select = q<HTMLSelectElement>("controller-select");
      select.replaceChildren(
        new Option("Auto detect", ""),
        ...devices.map(
          (d) => new Option(`${d.index}: ${d.id}`, String(d.index)),
        ),
      );
      select.value =
        this.pad.selectedIndex === null ? "" : String(this.pad.selectedIndex);
    }
    const identity = f.connected ? `${f.index}:${f.id}` : "";
    if (identity !== this.identity) {
      this.identity = identity;
      this.observed.clear();
      this.cancelRemap();
      this.prev = [];
      if (this.tiltTimer) {
        clearTimeout(this.tiltTimer);
        q<HTMLButtonElement>("test-tilt").disabled = false;
      }
    }
    q("controller-status").textContent = f.connected
      ? `Connected · ${f.id} · ${f.mapping || "custom mapping"}`
      : "No controller detected. Pair it, then press a button.";
    this.root
      .querySelectorAll<HTMLElement>("[data-pad]")
      .forEach((e) =>
        e.classList.toggle("pressed", !!f.buttons[Number(e.dataset.pad)]),
      );
    for (const [id, a, b] of [
      ["stick-left", 0, 1],
      ["stick-right", 2, 3],
    ] as const) {
      const stick = q(id).querySelector<HTMLElement>("i")!;
      stick.style.transform = `translate(${(f.rawAxes[a] || 0) * 25}px,${(f.rawAxes[b] || 0) * 25}px)`;
    }
    q<HTMLProgressElement>("trigger-left").value = f.buttonValues[6] || 0;
    q<HTMLProgressElement>("trigger-right").value = f.buttonValues[7] || 0;
    q("test-ship").style.transform =
      `translate(${f.axes.x * 90}px,${f.axes.y * 55}px)`;
    if (f.connected) {
      if (f.axes.x < -0.4) this.observed.add("Move left");
      if (f.axes.x > 0.4) this.observed.add("Move right");
      if (f.axes.y < -0.4) this.observed.add("Move up");
      if (f.axes.y > 0.4) this.observed.add("Move down");
      for (const command of Object.keys(labels) as PadCommand[]) {
        const index = this.pad.settings.buttons[command];
        if (f.buttons[index] && !this.prev[index])
          this.observed.add(labels[command]);
      }
      if (this.pending) {
        const index = f.buttons.findIndex((p, i) => p && !this.prev[i]);
        if (index >= 0) {
          const command = this.pending;
          this.pad.rebind(command, index);
          this.cancelRemap();
          this.pad.reset();
          this.save();
          this.root.querySelector(`[data-remap="${command}"] b`)!.textContent =
            String(index);
          q("remap-status").textContent =
            `${labels[command]} mapped to button ${index}.`;
        }
      }
    }
    q("command-lights").innerHTML = Object.entries(labels)
      .map(
        ([id, label]) =>
          `<span class="${f.buttons[this.pad.settings.buttons[id as PadCommand]] ? "active" : ""}">${label}</span>`,
      )
      .join("");
    q("controller-checks").innerHTML = [
      "Move left",
      "Move right",
      "Move up",
      "Move down",
      ...Object.values(labels),
    ]
      .map(
        (l) =>
          `<li class="${this.observed.has(l) ? "done" : ""}">${this.observed.has(l) ? "✓" : "○"} ${l}</li>`,
      )
      .join("");
    q("tilt-status").textContent = this.pad.tiltMessage;
    q("dead-value").textContent = this.pad.settings.deadzone.toFixed(2);
    q("raw-pad").textContent = f.connected
      ? `Axes: ${f.rawAxes.map((n, i) => `${i}: ${n === null ? "unavailable" : n.toFixed(3)}`).join(" | ")}\nButtons: ${f.buttonValues.map((n, i) => `${i}: ${n.toFixed(2)}`).join(" | ")}`
      : "Unavailable";
    this.prev = [...f.buttons];
  }
}
