import QRCode from 'qrcode';
import { createGame } from './game';
import { SensorController, type Telemetry } from './sensor';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">✧</span><span><strong>GYRO SPACE</strong><small>MOTION LAB / เกมทดสอบเซนเซอร์</small></span></div>
      <button id="help-button" class="icon-button" aria-label="วิธีเล่น">?</button>
    </header>
    <section class="play-shell" aria-label="พื้นที่เล่นเกม">
      <div class="hud">
        <div><span class="hud-label">SCORE</span><strong id="score">0000</strong></div>
        <div class="hud-center"><span id="mode-pill">ทดลอง</span><span id="status-dot" class="status-dot"></span></div>
        <div class="hud-right"><span class="hud-label">SHIELD</span><strong id="lives">♥ ♥ ♥</strong></div>
      </div>
      <div id="game" class="game"></div>
      <div id="center-card" class="center-card">
        <span class="eyebrow">FLIGHT SYSTEM 01</span>
        <div class="ship-emblem">✧</div>
        <h1>พร้อมบินหรือยัง?</h1>
        <p>เอียงมือถือเพื่อพายานหลบอุกกาบาต<br>ยานจะยิงให้อัตโนมัติ</p>
        <button id="start-button" class="primary">เริ่มบิน <span>↗</span></button>
        <span class="minor">ลากนิ้วบนจอ หรือใช้ปุ่มลูกศร ก็เล่นได้</span>
      </div>
      <div id="pause-banner" class="pause-banner hidden">หยุดชั่วคราว</div>
    </section>
    <section class="controls">
      <div class="sensor-line"><span class="sensor-led"></span><span id="sensor-message">กดเปิดเซนเซอร์เพื่อเริ่มทดสอบ</span></div>
      <div class="button-row">
        <button id="enable-button" class="secondary">◎ เปิดเซนเซอร์</button>
        <button id="calibrate-button" class="secondary" disabled>⊕ ตั้งศูนย์</button>
        <button id="pause-button" class="secondary compact" disabled>Ⅱ</button>
      </div>
      <details class="settings">
        <summary>ปรับการควบคุม <span class="chevron">⌄</span></summary>
        <div class="settings-body">
          <label class="slider-label" for="sensitivity">ความไว <strong id="sensitivity-value">1.0×</strong></label>
          <input id="sensitivity" type="range" min="0.5" max="2" step="0.1" value="1" />
          <label class="toggle-line"><span>โหมดทดสอบ ไม่เสียพลังชีวิต</span><input id="practice" type="checkbox" /></label>
          <p class="setting-tip">ถือมือถือในท่าที่ถนัดก่อนกดตั้งศูนย์ หากหมุนหน้าจอต้องตั้งศูนย์ใหม่</p>
        </div>
      </details>
      <details class="telemetry">
        <summary>ข้อมูลเซนเซอร์สด <span class="chevron">⌄</span></summary>
        <div class="data-grid">
          <div><span>สถานะ</span><strong id="sensor-state">ยังไม่เปิด</strong></div>
          <div><span>ความถี่</span><strong id="hz">ไม่พร้อมใช้งาน</strong></div>
          <div><span>มุม α</span><strong id="alpha">ไม่พร้อมใช้งาน</strong></div>
          <div><span>มุม β</span><strong id="beta">ไม่พร้อมใช้งาน</strong></div>
          <div><span>มุม γ</span><strong id="gamma">ไม่พร้อมใช้งาน</strong></div>
          <div><span>ความเร่ง X/Y/Z</span><strong id="acceleration">ไม่พร้อมใช้งาน</strong></div>
          <div class="wide"><span>อัตราหมุน α/β/γ</span><strong id="rotation">ไม่พร้อมใช้งาน</strong></div>
        </div>
      </details>
    </section>
    <footer><span>GYRO SPACE LAB</span><span>ข้อมูลเซนเซอร์อยู่บนอุปกรณ์ของคุณ</span></footer>
  </main>
  <dialog id="help-dialog" class="help-dialog">
    <button id="close-help" class="close-help" aria-label="ปิด">×</button>
    <span class="eyebrow">PILOT GUIDE</span><h2>วิธีเล่น</h2>
    <ol><li>เปิดหน้านี้บนมือถือผ่าน HTTPS</li><li>กด <b>เปิดเซนเซอร์</b> และอนุญาต Motion หากเบราว์เซอร์ถาม</li><li>ถือเครื่องในท่าที่ถนัด แล้วกด <b>ตั้งศูนย์</b></li><li>กดเริ่มบิน เอียงเครื่องเพื่อเคลื่อนยาน</li></ol>
    <p>ยิงอัตโนมัติ • อุกกาบาตสีชมพูให้คะแนนพิเศษ • ลากนิ้วหรือกดลูกศรแทนได้</p>
    <div class="qr-wrap"><canvas id="qr" aria-label="QR สำหรับเปิดเกมบนมือถือ"></canvas><small>สแกนเพื่อเปิดเกมบนมือถือ<br>ใช้บัญชีเดียวกันหากเว็บนี้เปิดแบบส่วนตัว</small></div>
  </dialog>`;

function el<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }
const sensor = new SensorController();
const centerCard = el('center-card');
const pauseBanner = el('pause-banner');
const startButton = el<HTMLButtonElement>('start-button');
const pauseButton = el<HTMLButtonElement>('pause-button');
let manualPaused = false;
let pagePaused = false;
let lastHud = '';

const { scene } = createGame(el('game'), {
  axes: () => sensor.getAxes(),
  onHud(score, lives, time, over) {
    const key = `${score}/${lives}/${Math.floor(time)}/${over}`;
    if (key === lastHud) return;
    lastHud = key;
    el('score').textContent = score.toString().padStart(4, '0');
    el('lives').textContent = lives > 0 ? '♥ '.repeat(lives).trim() : '—';
    if (over) {
      centerCard.classList.remove('hidden');
      centerCard.querySelector('h1')!.textContent = 'ยานเสียหาย!';
      centerCard.querySelector('p')!.innerHTML = `ทำคะแนนได้ <b>${score}</b> แต้ม<br>ลองบินอีกครั้งได้เลย`;
      startButton.innerHTML = 'เริ่มใหม่ <span>↗</span>';
      pauseButton.disabled = true;
    }
  },
});

const labels: Record<Telemetry['state'], string> = {
  idle: 'ยังไม่เปิด', waiting: 'กำลังรอ', active: 'พร้อมใช้งาน', denied: 'ถูกปฏิเสธ',
  unavailable: 'ไม่พร้อมใช้งาน', stale: 'สัญญาณหยุด', recalibrate: 'ต้องตั้งศูนย์',
};
function value(n: number | null, unit = '') { return n === null || !Number.isFinite(n) ? 'ไม่พร้อมใช้งาน' : `${n.toFixed(1)}${unit}`; }
function triple(a: number | null, b: number | null, c: number | null) {
  if (a === null && b === null && c === null) return 'ไม่พร้อมใช้งาน';
  return [a, b, c].map(n => n === null ? '—' : n.toFixed(1)).join(' / ');
}
sensor.subscribe(t => {
  el('sensor-message').textContent = t.message;
  el('sensor-state').textContent = labels[t.state];
  el('hz').textContent = value(t.hz, ' Hz');
  el('alpha').textContent = value(t.alpha, '°');
  el('beta').textContent = value(t.beta, '°');
  el('gamma').textContent = value(t.gamma, '°');
  el('acceleration').textContent = triple(t.acceleration.x, t.acceleration.y, t.acceleration.z);
  el('rotation').textContent = triple(t.rotation.alpha, t.rotation.beta, t.rotation.gamma);
  el<HTMLButtonElement>('calibrate-button').disabled = t.beta === null || t.gamma === null;
  el('status-dot').classList.toggle('ready', t.state === 'active');
  el('mode-pill').textContent = t.state === 'active' ? 'GYRO ON' : 'TOUCH / KEY';
});

el('enable-button').addEventListener('click', async () => { await sensor.enable(); });
el('calibrate-button').addEventListener('click', () => sensor.calibrate());
el<HTMLInputElement>('sensitivity').addEventListener('input', event => {
  const amount = Number((event.target as HTMLInputElement).value);
  sensor.setSensitivity(amount);
  el('sensitivity-value').textContent = `${amount.toFixed(1)}×`;
});
el<HTMLInputElement>('practice').addEventListener('change', event => { scene.setPractice((event.target as HTMLInputElement).checked); });
startButton.addEventListener('click', () => {
  scene.start(); manualPaused = false; pagePaused = false;
  centerCard.classList.add('hidden'); pauseBanner.classList.add('hidden');
  pauseButton.disabled = false; pauseButton.textContent = 'Ⅱ';
});
pauseButton.addEventListener('click', () => {
  manualPaused = !manualPaused;
  if (manualPaused) scene.pause(); else if (!pagePaused) scene.resume();
  pauseBanner.classList.toggle('hidden', !manualPaused);
  pauseButton.textContent = manualPaused ? '▶' : 'Ⅱ';
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scene.isRunning) { pagePaused = true; scene.pause(); pauseBanner.textContent = 'หยุดชั่วคราว • กลับมาที่เกมเพื่อเล่นต่อ'; pauseBanner.classList.remove('hidden'); }
  if (!document.hidden && pagePaused) { pagePaused = false; if (!manualPaused) { scene.resume(); pauseBanner.classList.add('hidden'); } pauseBanner.textContent = 'หยุดชั่วคราว'; }
});

const help = el<HTMLDialogElement>('help-dialog');
el('help-button').addEventListener('click', () => help.showModal());
el('close-help').addEventListener('click', () => help.close());
help.addEventListener('click', event => { if (event.target === help) help.close(); });
QRCode.toCanvas(el<HTMLCanvasElement>('qr'), location.href, { width: 124, margin: 1, color: { dark: '#dff8ff', light: '#101831' } }).catch(() => {});
window.setInterval(() => sensor.tick(), 400);
