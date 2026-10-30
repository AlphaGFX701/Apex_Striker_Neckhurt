// Dev-only fixture: not imported by the production entry point or copied into dist.
import "../src/style.css";
import { ControllerLab, controllerMarkup } from "../src/controller-lab";
import { GamepadAdapter, type PadLike } from "../src/gamepad";
const root = document.getElementById("fixture-root")!;
root.innerHTML = controllerMarkup.replace(
  "LIVE CONTROLLER",
  "SIMULATED CONTROLLER",
);
let connected = false;
const fake: PadLike = {
  id: "SIMULATED QA CONTROLLER",
  index: 0,
  connected: true,
  mapping: "standard",
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
};
const adapter = new GamepadAdapter(() => (connected ? [fake] : [])),
  lab = new ControllerLab(root, adapter, () => {});
const on = (id: string, fn: () => void) =>
  (document.getElementById(id)!.onclick = fn);
on("connect", () => (connected = true));
on("disconnect", () => (connected = false));
on("replace", () => {
  fake.id = "SIMULATED REPLACEMENT";
  fake.index++;
});
on("left", () => {
  (fake.axes as number[])[0] = -1;
});
on("right", () => {
  (fake.axes as number[])[0] = 1;
});
on("trigger", () => {
  fake.buttons[6].value = 0.5;
  fake.buttons[6].pressed = false;
});
on("button", () => {
  fake.buttons[0].pressed = !fake.buttons[0].pressed;
  fake.buttons[0].value = Number(fake.buttons[0].pressed);
});
on("neutral", () => {
  (fake.axes as number[]).fill(0);
  fake.buttons.forEach((b) => {
    b.pressed = false;
    b.value = 0;
  });
});
setInterval(() => lab.update(adapter.poll()), 50);
