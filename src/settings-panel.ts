import { PreferenceDraft } from './launcher';

type Preferences = {
  source: string; sensitivity: number; gesture: number;
  music: boolean; sfx: boolean; musicVolume: number; sfxVolume: number;
  haptics: boolean; reduced: boolean;
};
const fields: Record<keyof Preferences, string> = {
  source: 'settings-source', sensitivity: 'tilt-sensitivity', gesture: 'gesture-sensitivity',
  music: 'music', sfx: 'sound', musicVolume: 'music-volume', sfxVolume: 'sfx-volume',
  haptics: 'haptics', reduced: 'low-effects',
};
const node = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class SettingsPanel {
  private draft?: PreferenceDraft<Preferences>;
  constructor(private options: {
    source: () => string;
    confirm: (title: string, description: string, action: () => void) => void;
    onApply: (values: Preferences) => void;
  }) {
    for (const id of Object.values(fields)) {
      const input = node<HTMLInputElement>(id);
      input.addEventListener('input', () => this.changed());
      input.addEventListener('change', () => this.changed());
      if (input.type === 'range') {
        const output = document.createElement('output');
        output.className = 'range-readout'; output.htmlFor = id;
        output.id = `${id}-readout`; input.before(output);
      }
    }
    node<HTMLInputElement>('haptics').disabled = !('vibrate' in navigator);
    for (const tab of ['audio', 'controls', 'display']) {
      const button = node(`settings-tab-${tab}`);
      button.onclick = () => this.tab(tab);
      button.onkeydown = e => {
        const tabs = ['audio', 'controls', 'display'];
        let index = tabs.indexOf(tab);
        if (e.key === 'ArrowRight') index = (index + 1) % 3;
        else if (e.key === 'ArrowLeft') index = (index + 2) % 3;
        else if (e.key === 'Home') index = 0;
        else if (e.key === 'End') index = 2;
        else return;
        e.preventDefault(); this.tab(tabs[index]); node(`settings-tab-${tabs[index]}`).focus();
      };
    }
    node('settings-apply').onclick = () => {
      if (!this.draft?.dirty) return;
      this.options.onApply(this.draft.apply());
      this.changed(); node('settings-save-status').textContent = 'Saved';
    };
    const fullscreen = node<HTMLButtonElement>('fullscreen');
    fullscreen.hidden = !document.fullscreenEnabled;
    fullscreen.onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch { node('fullscreen-status').textContent = 'Fullscreen is not available in this browser.'; }
    };
    document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
    });
  }
  private read(): Preferences {
    return Object.fromEntries(Object.entries(fields).map(([key, id]) => {
      const input = node<HTMLInputElement>(id);
      return [key, input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value];
    })) as Preferences;
  }
  private write(values: Preferences) {
    for (const [key, id] of Object.entries(fields)) {
      const input = node<HTMLInputElement>(id), value = values[key as keyof Preferences];
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = String(value);
    }
  }
  private changed() {
    if (this.draft) this.draft.value = this.read();
    for (const id of Object.values(fields)) {
      const input = node<HTMLInputElement>(id), output = document.getElementById(`${id}-readout`);
      if (output) output.textContent = id.includes('volume') ? `${Math.round(Number(input.value) * 100)}%` : `${Number(input.value).toFixed(2)}×`;
    }
    node<HTMLButtonElement>('settings-apply').disabled = !this.draft?.dirty;
    node('settings-save-status').textContent = this.draft?.dirty ? 'Unsaved' : '';
  }
  open() {
    node<HTMLSelectElement>('settings-source').value = this.options.source();
    this.draft = new PreferenceDraft(this.read()); this.tab('audio'); this.changed();
  }
  leave(action: () => void) {
    if (!this.draft?.dirty) { action(); return; }
    this.options.confirm('Discard settings changes?', 'Your applied preferences will stay unchanged.', () => {
      this.write(this.draft!.discard()); this.changed(); action();
    });
  }
  private tab(selected: string) {
    for (const tab of ['audio', 'controls', 'display']) {
      const button = node(`settings-tab-${tab}`);
      button.setAttribute('aria-selected', String(tab === selected));
      button.tabIndex = tab === selected ? 0 : -1;
      node(`settings-${tab}`).hidden = tab !== selected;
    }
  }
}
