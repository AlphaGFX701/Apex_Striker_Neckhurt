import { MenuSpace, installTacticalInteractions } from './menu-space';
import {EntryIntent} from './launcher';
import './style.css';
import './launcher.css';

new MenuSpace();
installTacticalInteractions();

// Keep the first screen independent of Phaser's bundle and flight texture loader.
const entry=new EntryIntent();
const status = document.querySelector<HTMLElement>('#start-status')!;
const button = document.querySelector<HTMLButtonElement>('#start-button')!;
button.onclick = () => {
  if (entry.request()) window.dispatchEvent(new Event('apex:start'));
  else status.textContent = 'Opening…';
};
window.addEventListener('apex:reset-entry',()=>{entry.reset();status.textContent='Enter the flight deck';});
void import('./main').then(() => {
  if (entry.ready()) window.dispatchEvent(new Event('apex:start'));
}).catch(() => {
  status.textContent = 'Could not start. Retry.';
  const retry = document.querySelector<HTMLButtonElement>('#runtime-retry')!;
  retry.hidden = false;
  retry.onclick = () => location.reload();
});
