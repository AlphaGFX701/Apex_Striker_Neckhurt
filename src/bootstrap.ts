import './style.css';
import './launcher.css';

// Keep the first screen independent of Phaser's bundle and flight texture loader.
let runtimeReady = false;
let startRequested = false;
const status = document.querySelector<HTMLElement>('#start-status')!;
const button = document.querySelector<HTMLButtonElement>('#start-button')!;
button.onclick = () => {
  startRequested = true;
  if (runtimeReady) window.dispatchEvent(new Event('apex:start'));
  else status.textContent = 'Opening the flight deck…';
};
void import('./main').then(() => {
  runtimeReady = true;
  if (startRequested) window.dispatchEvent(new Event('apex:start'));
}).catch(() => {
  status.textContent = 'Flight deck could not load. Check your connection and retry.';
  const retry = document.querySelector<HTMLButtonElement>('#runtime-retry')!;
  retry.hidden = false;
  retry.onclick = () => location.reload();
});
