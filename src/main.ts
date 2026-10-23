import QRCode from 'qrcode';
import { createGame } from './game';
import { SensorController, type Telemetry } from './sensor';
import { Feedback } from './feedback';
import type { Action } from './motion';
import type { GameSnapshot } from './model';
import './style.css';

const PUBLIC_URL = 'https://gyro-space-lab-th.mjadsakul.chatgpt.site/';
const names: Record<Action, string> = { dodgeLeft: 'หลบซ้าย', dodgeRight: 'หลบขวา', emp: 'เขย่า EMP' };
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<main class="shell">
  <header class="topbar">
    <div class="brand"><span class="brand-mark">✧</span><span><strong>GYRO SPACE</strong><small>COMBAT / เอียงบิน · กลิ้งหลบ · เขย่า EMP</small></span></div>
    <button id="help-button" class="icon-button" aria-label="วิธีเล่นและ QR">?</button>
  </header>
  <section class="flight" aria-label="เกมยานอวกาศ">
    <div class="play-shell">
      <div class="hud">
        <div><span class="hud-label">SCORE</span><strong id="score">0000</strong></div>
        <div class="hud-center"><span id="timer">90s</span><span id="status-dot" class="status-dot"></span></div>
        <div class="hud-right"><span class="hud-label">SHIELD</span><strong id="lives">♥ ♥ ♥</strong></div>
      </div>
      <div id="stage" class="stage-chip">ภารกิจ 90 วินาที</div>
      <div id="game" class="game" aria-label="สนามเกม ใช้ลูกศรหรือ WASD เคลื่อนที่ Q E หลบ Space ปล่อย EMP"></div>
      <div id="flight-tip" class="flight-tip">เอียงบิน · หมุนเร็วเพื่อหลบ · เขย่าเมื่อ EMP เต็ม</div>
      <div id="center-card" class="center-card">
        <span class="eyebrow">MOTION COMBAT / 90 SECONDS</span><div class="ship-emblem">✧</div>
        <h1>พร้อมออกรบ?</h1>
        <p>เอียงเพื่อบิน หมุนเร็วเพื่อกลิ้งหลบ<br>เขย่าเมื่อพลังเต็มเพื่อปล่อย EMP</p>
        <div id="round-summary" class="round-summary hidden"></div>
        <button id="start-button" class="primary">เริ่มภารกิจ <span>↗</span></button>
        <span class="minor">เปิดเซนเซอร์ + ตั้งศูนย์ก่อนเล่น<br>ลากนิ้ว / ลูกศร และปุ่มสกิล ก็เล่นได้</span>
      </div>
      <div id="pause-banner" class="pause-banner hidden"><span id="pause-message">พักเกมแล้ว</span><button id="resume-button" class="secondary">▶ เล่นต่อ</button></div>
    </div>
    <div class="skill-bar" aria-label="สกิลสำรอง">
      <button id="dodge-left" class="skill"><span>↶ หลบซ้าย</span><small class="dodge-status">พร้อม / Q</small></button>
      <button id="emp-button" class="skill emp"><span>◎ EMP <b id="energy">0%</b></span><span class="energy-track"><i id="energy-fill"></i></span></button>
      <button id="dodge-right" class="skill"><span>หลบขวา ↷</span><small class="dodge-status">พร้อม / E</small></button>
    </div>
    <p id="action-message" class="action-message" role="status" aria-live="polite">ใช้ปุ่มสกิล หรือเปิดเซนเซอร์เพื่อเล่นด้วยท่าทาง</p>
  </section>
  <section class="controls" aria-label="ตั้งค่าการควบคุมและห้องทดสอบ">
    <div class="section-heading"><span class="eyebrow">FLIGHT CONSOLE</span><span id="mode-pill">TOUCH / KEY</span></div>
    <div class="sensor-line"><span class="sensor-led"></span><span id="sensor-message"></span></div>
    <div class="button-row">
      <button id="enable-button" class="secondary">◎ เปิดเซนเซอร์</button>
      <button id="calibrate-button" class="secondary" disabled>⊕ ตั้งศูนย์</button>
      <button id="pause-button" class="secondary compact" disabled aria-label="พักเกม">Ⅱ</button>
    </div>
    <button id="lab-button" class="lab-button" aria-pressed="false">⌁ ห้องฝึกท่าทาง / ไม่เริ่มด่าน</button>
    <details class="settings">
      <summary>ปรับการควบคุม <span class="chevron">⌄</span></summary>
      <div class="settings-body">
        <label class="slider-label" for="sensitivity">ความไวเอียง <strong id="sensitivity-value">1.0×</strong></label>
        <input id="sensitivity" type="range" min="0.5" max="2" step="0.1" value="1">
        <label class="slider-label" for="gesture-sensitivity">ความไวท่าทาง <strong id="gesture-value">1.0×</strong></label>
        <input id="gesture-sensitivity" type="range" min="0.6" max="1.5" step="0.1" value="1">
        <label class="toggle-line"><span>โหมดฝึก ไม่เสียชีวิต</span><input id="practice" type="checkbox"></label>
        <button id="fill-energy" class="secondary hidden">เติม EMP สำหรับโหมดฝึก</button>
        <label class="toggle-line"><span>เสียงเอฟเฟกต์</span><input id="sound" type="checkbox" checked></label>
        <label class="toggle-line"><span id="haptic-label">สั่น (เฉพาะเครื่องที่รองรับ)</span><input id="haptics" type="checkbox"></label>
        <p class="setting-tip">ปรับโหมดฝึกก่อนเริ่มรอบ • เมื่อหมุนจอให้ตั้งศูนย์ใหม่<br>ยิ่งเพิ่มความไวท่าทาง ยิ่งตรวจติดง่ายและอาจเรียกผิดได้</p>
      </div>
    </details>
    <details id="telemetry-panel" class="telemetry">
      <summary>ห้องทดสอบเซนเซอร์ <span class="chevron">⌄</span></summary>
      <div class="lab-content">
        <p id="motion-message" class="setting-tip"></p>
        <div class="data-grid">
          <div><span>การเอียง / Motion</span><strong id="sensor-state"></strong></div>
          <div><span>ความถี่ เอียง / Motion</span><strong id="hz"></strong></div>
          <div><span>มุม β / γ (°)</span><strong id="angles"></strong></div>
          <div><span>ความเร่งเชิงเส้น X/Y/Z (m/s²)</span><strong id="acceleration"></strong></div>
          <div class="wide"><span>อัตราหมุน α/β/γ (°/s)</span><strong id="rotation"></strong></div>
        </div>
        <div class="chart-label"><span>ความเร่งรวม (m/s²)</span><b id="strength-value">—</b></div>
        <canvas id="accel-chart" width="640" height="140" role="img" aria-label="กราฟความเร่งเชิงเส้นย้อนหลัง 12 วินาที"></canvas>
        <div class="chart-label"><span>อัตราหมุนแกนหลบ (°/s)</span><b id="roll-value">—</b></div>
        <canvas id="roll-chart" width="640" height="140" role="img" aria-label="กราฟอัตราหมุนย้อนหลัง 12 วินาที"></canvas>
        <p class="gesture-result">ท่าล่าสุด: <strong id="last-gesture">ยังไม่ตรวจพบ</strong></p>
        <p class="setting-tip">ห้องฝึกใช้เซนเซอร์จริง: ตั้งศูนย์ก่อน แล้วฝึกหมุนเร็วหรือเขย่าโดยไม่มีศัตรู กราฟขาดช่วงหมายถึงไม่มีข้อมูล</p>
        <details class="test-record">
          <summary>บันทึกการลองจริง 10 ครั้งต่อท่า</summary>
          <p class="setting-tip">เลือกท่า → เริ่มนับ → ทำท่าหนึ่งครั้ง → บันทึกผลตามสิ่งที่เกิดขึ้น จำนวนครั้งไม่ใช่ผลจำลอง</p>
          <label class="slider-label" for="test-action">ท่าที่กำลังทดสอบ</label>
          <select id="test-action"><option value="dodgeLeft">หลบซ้าย</option><option value="dodgeRight">หลบขวา</option><option value="emp">เขย่า EMP</option></select>
          <button id="begin-attempt" class="secondary">เริ่มนับครั้งนี้ (5 วินาที)</button>
          <p id="attempt-message" class="setting-tip" role="status">เปิดห้องฝึกและตั้งศูนย์ก่อนบันทึก</p>
          <div class="record-buttons"><button id="record-correct">ถูก</button><button id="record-miss">ไม่ติด</button><button id="record-wrong">ผิดท่า</button></div>
          <table><caption>ผลบนเครื่องนี้ (ยังต้องทดลองเอง)</caption><thead><tr><th>ท่า</th><th>ครั้ง</th><th>ถูก</th><th>ไม่ติด</th><th>ผิดท่า</th></tr></thead><tbody id="test-rows"></tbody></table>
          <button id="download-record" class="secondary">ดาวน์โหลดผลทดสอบ JSON</button>
          <button id="reset-record" class="text-button">ล้างผลบันทึก</button>
        </details>
      </div>
    </details>
  </section>
  <footer><span>GYRO SPACE COMBAT</span><span>ข้อมูลเซนเซอร์ประมวลผลบนเครื่อง</span></footer>
</main>
<dialog id="help-dialog" class="help-dialog">
  <button id="close-help" class="close-help" aria-label="ปิดวิธีเล่น">×</button>
  <span class="eyebrow">PILOT GUIDE</span><h2>เอียงบิน กลิ้งหลบ เขย่า EMP</h2>
  <ol><li>เปิดบนมือถือผ่าน HTTPS กด <b>เปิดเซนเซอร์</b> และอนุญาต Motion</li><li>ถือเครื่องแนวตั้งสองมือในท่าถนัด แล้วกด <b>ตั้งศูนย์</b></li><li>ลองใน <b>ห้องฝึกท่าทาง</b> ก่อนเริ่มภารกิจ</li><li>เอียงช้าเพื่อบิน หมุนข้อมือเร็วซ้าย/ขวาเพื่อหลบ</li><li>เขย่าสั้น ๆ ไปกลับหลายจังหวะเมื่อ EMP เต็ม</li></ol>
  <p>ยิงอัตโนมัติ • หลบอมตะ 0.6 วินาที ฟื้น 3 วินาที • EMP เติมตามเวลาและเมื่อยิงศัตรู • บอสเข้าที่วินาที 60 กำจัดก่อนหมดเวลา</p>
  <p>คอม: ลูกศร/WASD เคลื่อนที่, Q/E หลบ, Space ใช้ EMP<br>มือถือ: ลากนิ้วและใช้ปุ่มสกิลสำรองได้<br>iPhone ใช้ภาพและเสียง การสั่นเปิดได้เฉพาะเครื่องที่รองรับ</p>
  <p>เซนเซอร์ทำงานแยกหน้าที่: มุมเอียงบังคับยาน ความเร็วหมุนใช้หลบ ความเร่งเชิงเส้นใช้ตรวจเขย่า หากเป็นค่าประมาณจะแจ้งในห้องทดสอบ</p>
  <div class="qr-wrap"><canvas id="qr" aria-label="QR เปิดเกมบนมือถือ"></canvas><small>สแกนเปิดเว็บเกม<br>public • ไม่ต้องเข้าสู่ระบบ</small></div>
</dialog>`;

function el<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }
const sensor = new SensorController(), feedback = new Feedback();
const centerCard = el('center-card'), pauseBanner = el('pause-banner');
let lab = false, lastHud = '', roundEnded = false, lastLives = 3, beforeHelp = false;
let lastSensorState: Telemetry['state'] = 'idle';
const { scene } = createGame(el('game'), {
  axes: dt => sensor.getAxes(dt), actions: () => sensor.consumeActions(),
  onAction(action, accepted, reason) {
    el('action-message').textContent = `${accepted ? '✓' : '·'} ${reason}`;
    if (accepted) feedback.play(action === 'emp' ? 'emp' : 'dodge');
  },
  onHud: updateHud,
});
function updateHud(s: GameSnapshot) {
  sensor.setGestureActive((scene.isRunning || lab) && !document.hidden);
  const key = `${s.score}/${s.lives}/${Math.ceil(s.time)}/${Math.floor(s.energy)}/${s.dodgeCooldown.toFixed(1)}/${s.gameOver}`;
  if (s.lives < lastLives) feedback.play('hit'); lastLives = s.lives;
  if (key === lastHud) return; lastHud = key;
  el('score').textContent = s.score.toString().padStart(4, '0');
  el('lives').textContent = s.lives ? '♥ '.repeat(s.lives).trim() : '—';
  el('timer').textContent = `${Math.max(0, Math.ceil(90 - s.time))}s`;
  el('energy').textContent = `${Math.floor(s.energy)}%`; el('energy-fill').style.width = `${s.energy}%`;
  el('emp-button').classList.toggle('charged', s.energy >= 100);
  const playable = scene.isRunning;
  el<HTMLButtonElement>('emp-button').disabled = !playable || s.energy < 100;
  for (const id of ['dodge-left', 'dodge-right']) el<HTMLButtonElement>(id).disabled = !playable || s.dodgeCooldown > 0;
  document.querySelectorAll('.dodge-status').forEach(e => { e.textContent = s.dodgeCooldown > 0 ? `${s.dodgeCooldown.toFixed(1)}s` : 'พร้อม'; });
  el('stage').textContent = s.time >= 60 ? 'BOSS / กำจัดก่อนหมดเวลา' : s.time >= 15 ? 'WAVE 02 / หลบกระสุน · สะสม EMP' : 'WAVE 01 / เอียงช้า ๆ เพื่อบิน';
  el('flight-tip').textContent = s.time < 8 ? 'เอียงช้า ๆ / ลากนิ้วเพื่อเคลื่อนที่' : s.time < 15 ? 'หมุนข้อมือเร็ว → กลิ้งหลบ' : s.energy >= 100 ? 'EMP พร้อม! เขย่าสั้น ๆ ไปกลับหลายจังหวะ' : 'หลบกระสุนสีส้ม • ยิงอัตโนมัติ';
  if (s.gameOver && !roundEnded) {
    roundEnded = true; sensor.resetTransient(); feedback.play('end');
    centerCard.classList.remove('hidden'); centerCard.classList.add('result-card'); pauseBanner.classList.add('hidden');
    const titles = { won: 'ภารกิจสำเร็จ!', lost: 'ยานเสียหาย!', timeout: 'หมดเวลาภารกิจ', practice: 'จบการฝึกแล้ว' };
    centerCard.querySelector('h1')!.textContent = titles[s.result!];
    centerCard.querySelector('p')!.textContent = s.result === 'won' ? 'กำจัดบอสได้แล้ว นักบิน!' : 'ปรับความไวหรือเปิดโหมดฝึก แล้วลองอีกครั้ง';
    el('round-summary').classList.remove('hidden');
    el('round-summary').innerHTML = `<div><small>คะแนน</small><b>${s.score}</b></div><div><small>เวลา</small><b>${s.time.toFixed(1)}s</b></div><div><small>กลิ้งหลบ</small><b>${s.dodges}</b></div><div><small>EMP</small><b>${s.emps}</b></div>`;
    el('start-button').innerHTML = 'เริ่มใหม่ <span>↗</span>'; el<HTMLButtonElement>('pause-button').disabled = true;
    el<HTMLInputElement>('practice').disabled = false;
  }
}
function refreshHud() { lastHud = ''; updateHud(scene.model.state); }
function pause(message = 'พักเกมแล้ว') {
  scene.pause(); sensor.setGestureActive(false); sensor.resetTransient();
  el('pause-message').textContent = message; pauseBanner.classList.remove('hidden'); refreshHud();
}
function resume() {
  if (lab) leaveLab();
  if (!scene.hasStarted || document.hidden) return;
  sensor.resetTransient(); scene.resume(); sensor.setGestureActive(true);
  pauseBanner.classList.add('hidden'); el('pause-button').textContent = 'Ⅱ'; refreshHud();
}
function leaveLab() {
  lab = false; sensor.setGestureActive(false); sensor.resetTransient();
  el('resume-button').classList.remove('hidden'); centerCard.classList.toggle('hidden', scene.hasStarted);
  el('lab-button').setAttribute('aria-pressed', 'false'); el('lab-button').textContent = '⌁ ห้องฝึกท่าทาง / ไม่เริ่มด่าน';
}
el('start-button').addEventListener('click', () => {
  feedback.unlock(); leaveLab(); sensor.resetTransient(); roundEnded = false; lastLives = 3; lastHud = '';
  scene.start(); sensor.setGestureActive(true); centerCard.classList.add('hidden'); pauseBanner.classList.add('hidden');
  el<HTMLButtonElement>('pause-button').disabled = false; el('pause-button').textContent = 'Ⅱ'; el<HTMLInputElement>('practice').disabled = true;
  el('action-message').textContent = 'เริ่มภารกิจแล้ว • หลบกระสุนและไปให้ถึงบอส';
});
el('pause-button').addEventListener('click', () => { if (scene.isRunning) pause(); else resume(); });
el('resume-button').addEventListener('click', resume);
el('enable-button').addEventListener('click', async () => {
  const b = el<HTMLButtonElement>('enable-button'); b.disabled = true;
  try { await sensor.enable(); } finally { b.disabled = false; }
});
el('calibrate-button').addEventListener('click', () => { scene.clearInput(); sensor.calibrate(); });
for (const [id, action] of [['dodge-left', 'dodgeLeft'], ['dodge-right', 'dodgeRight'], ['emp-button', 'emp']] as const) {
  el(id).addEventListener('click', () => { feedback.unlock(); scene.action(action); });
}
el('lab-button').addEventListener('click', () => {
  if (lab) {
    leaveLab(); pauseBanner.classList.toggle('hidden', !scene.hasStarted);
    el('action-message').textContent = 'ออกจากห้องฝึกแล้ว • กดเริ่มภารกิจหรือเล่นต่อ';
  } else {
    if (scene.isRunning) scene.pause(); lab = true; sensor.resetTransient(); sensor.setGestureActive(true);
    centerCard.classList.add('hidden'); el('resume-button').classList.add('hidden');
    el('lab-button').setAttribute('aria-pressed', 'true'); el('lab-button').textContent = '✓ อยู่ในห้องฝึก / กดเพื่อออก';
    el<HTMLDetailsElement>('telemetry-panel').open = true;
    el('pause-message').textContent = 'ห้องฝึกท่าทาง • ทดลองแล้วดูผลด้านล่าง'; pauseBanner.classList.remove('hidden');
    el('action-message').textContent = 'ห้องฝึก: ท่าที่ตรวจพบจะไม่ใช้สกิลในเกม';
  }
  refreshHud();
});
for (const [id, label, setter] of [
  ['sensitivity', 'sensitivity-value', (v: number) => sensor.setSensitivity(v)],
  ['gesture-sensitivity', 'gesture-value', (v: number) => sensor.setGestureSensitivity(v)],
] as const) el<HTMLInputElement>(id).addEventListener('input', e => { const v = Number((e.target as HTMLInputElement).value); setter(v); scene.clearInput(); el(label).textContent = `${v.toFixed(1)}×`; });
el<HTMLInputElement>('practice').addEventListener('change', e => {
  const on = (e.target as HTMLInputElement).checked; scene.setPractice(on); el('fill-energy').classList.toggle('hidden', !on);
});
el('fill-energy').addEventListener('click', () => { scene.model.fillEnergy(); refreshHud(); });
el<HTMLInputElement>('sound').addEventListener('change', e => { feedback.enabled = (e.target as HTMLInputElement).checked; if (feedback.enabled) feedback.unlock(); });
if (!('vibrate' in navigator)) { el<HTMLInputElement>('haptics').disabled = true; el('haptic-label').textContent = 'เครื่องนี้ไม่มี Vibration API'; }
el<HTMLInputElement>('haptics').addEventListener('change', e => { feedback.haptics = (e.target as HTMLInputElement).checked; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (scene.isRunning) pause('พักเมื่อสลับแอป • กดเล่นต่อเมื่อพร้อม');
    sensor.setGestureActive(false); sensor.resetTransient(); endAttempt();
  } else { sensor.resetTransient(); sensor.setGestureActive(lab); }
});
window.addEventListener('blur', () => { if (scene.isRunning) pause('พักเมื่อหน้าต่างไม่พร้อม • กดเล่นต่อ'); });
const labels: Record<Telemetry['state'], string> = { idle: 'ยังไม่เปิด', waiting: 'รอข้อมูล', active: 'พร้อม', denied: 'ปฏิเสธสิทธิ์', unavailable: 'ไม่พร้อมใช้งาน', stale: 'ข้อมูลหยุด', recalibrate: 'ต้องตั้งศูนย์' };
sensor.subscribe(t => {
  if (t.state !== lastSensorState && ['recalibrate', 'stale', 'denied', 'unavailable'].includes(t.state)) {
    scene.clearInput(); if (scene.isRunning && lastSensorState === 'active') pause(t.message);
  }
  lastSensorState = t.state;
});
function value(n: number | null, unit = '') { return n === null || !Number.isFinite(n) ? 'ไม่พร้อมใช้งาน' : `${n.toFixed(1)}${unit}`; }
function triple(v: { x: number | null; y: number | null; z: number | null }) { return [v.x, v.y, v.z].map(n => value(n)).join(' / '); }
const traces: { strength: number | null; roll: number | null }[] = [];
function graph(id: string, points: (number | null)[], bound: number, color: string, signed: boolean) {
  const canvas = el<HTMLCanvasElement>(id), ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 640, 140); ctx.strokeStyle = '#30425d'; ctx.lineWidth = 1;
  for (let y = 10; y <= 130; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); let pen = false;
  points.forEach((v, i) => {
    if (v === null) { pen = false; return; }
    const x = i / 119 * 640, normalized = Math.max(signed ? -1 : 0, Math.min(1, v / bound));
    const y = signed ? 70 - normalized * 58 : 130 - normalized * 116;
    if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
  }); ctx.stroke();
  ctx.fillStyle = '#8da7c9'; ctx.font = '18px sans-serif'; ctx.fillText(`${signed ? '±' : '0–'}${bound}`, 8, 23);
}
window.setInterval(() => {
  sensor.tick(); const t = sensor.telemetry;
  el('sensor-message').textContent = t.message; el('motion-message').textContent = t.motionMessage;
  el('sensor-state').textContent = `${labels[t.state]} / ${labels[t.motionState]}`;
  el('hz').textContent = `${value(t.hz)} / ${value(t.motionHz)} Hz`;
  el('angles').textContent = `${value(t.beta)} / ${value(t.gamma)}`; el('acceleration').textContent = triple(t.acceleration);
  el('rotation').textContent = [t.rotation.alpha, t.rotation.beta, t.rotation.gamma].map(v => value(v)).join(' / ');
  el('strength-value').textContent = value(t.strength); el('roll-value').textContent = value(t.roll);
  el('last-gesture').textContent = t.lastGesture ? `${names[t.lastGesture]} (${Math.max(0, (performance.now() - t.gestureTime) / 1000).toFixed(1)}s ก่อน)` : 'ยังไม่ตรวจพบ';
  el<HTMLButtonElement>('calibrate-button').disabled = t.beta === null || t.gamma === null || ['stale', 'denied', 'unavailable'].includes(t.state);
  el('status-dot').classList.toggle('ready', t.state === 'active'); el('mode-pill').textContent = lab ? 'GESTURE LAB' : t.state === 'active' ? 'MOTION ON' : 'TOUCH / KEY';
  traces.push({ strength: t.motionState === 'active' ? t.strength : null, roll: t.motionState === 'active' ? t.roll : null });
  if (traces.length > 120) traces.shift();
  if (el<HTMLDetailsElement>('telemetry-panel').open) { graph('accel-chart', traces.map(p => p.strength), 25, '#76f3eb', false); graph('roll-chart', traces.map(p => p.roll), 300, '#ffa4b7', true); }
  if (lab) sensor.consumeActions();
}, 100);

// Explicitly user-labelled physical-device trials; nothing here manufactures test results.
interface Trial { expected: Action; detected: Action[]; result: 'correct' | 'miss' | 'wrong'; date: string }
let trials: Trial[] = [], attempt: { expected: Action; detected: Action[]; ends: number } | null = null;
let attemptFinished = false;
function endAttempt() { if (attempt) { attemptFinished = true; el('attempt-message').textContent = `ตรวจพบ: ${attempt.detected.map(a => names[a]).join(', ') || 'ไม่มี'} • เลือกผลเพื่อบันทึก`; updateRecordButtons(); } }
sensor.onGesture(action => {
  if (lab) el('action-message').textContent = `ห้องฝึกตรวจพบ: ${names[action]}`;
  if (attempt && !attemptFinished && performance.now() <= attempt.ends) attempt.detected.push(action);
});
el('begin-attempt').addEventListener('click', () => {
  if (!lab || !sensor.telemetry.calibrated || sensor.telemetry.motionState !== 'active') { el('attempt-message').textContent = 'เปิดห้องฝึก เปิดเซนเซอร์ และตั้งศูนย์ให้พร้อมก่อน'; return; }
  attempt = { expected: el<HTMLSelectElement>('test-action').value as Action, detected: [], ends: performance.now() + 5000 };
  attemptFinished = false; sensor.resetTransient();
  el('attempt-message').textContent = 'รอ 0.7 วินาที แล้วทำท่าหนึ่งครั้ง • กำลังนับ 5 วินาที'; updateRecordButtons();
});
window.setInterval(() => { if (attempt && !attemptFinished && performance.now() >= attempt.ends) { endAttempt(); updateRecordButtons(); } }, 100);
function updateRecordButtons() { for (const id of ['record-correct', 'record-miss', 'record-wrong']) el<HTMLButtonElement>(id).disabled = !attempt || !attemptFinished; }
function renderTrials() {
  el('test-rows').innerHTML = (Object.keys(names) as Action[]).map(action => {
    const rows = trials.filter(t => t.expected === action);
    return `<tr><th>${names[action]}</th><td>${rows.length}/10</td>${(['correct', 'miss', 'wrong'] as const).map(r => `<td>${rows.filter(t => t.result === r).length}</td>`).join('')}</tr>`;
  }).join(''); updateRecordButtons();
}
for (const [id, result] of [['record-correct', 'correct'], ['record-miss', 'miss'], ['record-wrong', 'wrong']] as const) el(id).addEventListener('click', () => {
  if (!attempt || !attemptFinished) return;
  trials.push({ expected: attempt.expected, detected: [...attempt.detected], result, date: new Date().toISOString() });
  attempt = null; attemptFinished = false; el('attempt-message').textContent = 'บันทึกแล้ว • เริ่มนับครั้งถัดไป'; renderTrials();
});
el('reset-record').addEventListener('click', () => { trials = []; attempt = null; attemptFinished = false; renderTrials(); });
el('download-record').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ type: 'user-labelled-physical-device-trials', userAgent: navigator.userAgent, tiltSensitivity: el<HTMLInputElement>('sensitivity').value, gestureSensitivity: el<HTMLInputElement>('gesture-sensitivity').value, trials }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'gyro-space-device-tests.json'; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
renderTrials(); refreshHud();
const help = el<HTMLDialogElement>('help-dialog');
el('help-button').addEventListener('click', () => { beforeHelp = scene.isRunning; if (beforeHelp) pause('พักระหว่างเปิดวิธีเล่น'); sensor.setGestureActive(false); help.showModal(); });
el('close-help').addEventListener('click', () => help.close());
help.addEventListener('click', e => { if (e.target === help) help.close(); });
help.addEventListener('close', () => { sensor.resetTransient(); if (beforeHelp) resume(); else sensor.setGestureActive(lab); beforeHelp = false; });
QRCode.toCanvas(el<HTMLCanvasElement>('qr'), PUBLIC_URL, { width: 124, margin: 1, color: { dark: '#dff8ff', light: '#101831' } }).catch(() => {});
