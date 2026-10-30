# Gyro Space Combat

เว็บเกมภาษาไทย Phaser + TypeScript + Vite สำหรับ Mini Project: Accel & Gyroscope

เล่น: https://gyro-space-lab-th.mjadsakul.chatgpt.site/

## รันและตรวจ

```bash
npm ci
npm run dev
npm test
npm run build
```

เซนเซอร์มือถือใช้ลิงก์ HTTPS จริง การเปิด IP ใน Wi-Fi ผ่าน HTTP ใช้ทดสอบเซนเซอร์ไม่ได้ คอมใช้ลากเมาส์/ลูกศร/WASD, Q/E หลบ, Space ใช้ EMP ได้ ผลบิลด์อยู่ใน dist/

## วิธีเล่น

1. ถือมือถือแนวตั้งสองมือ กดเปิดเซนเซอร์และอนุญาต Motion
2. ถือในท่าถนัด กดตั้งศูนย์ แล้วลองห้องฝึกท่าทางก่อน
3. เอียงช้า ๆ เพื่อบังคับยาน หมุนข้อมือซ้าย/ขวาเร็วเพื่อกลิ้งหลบ
4. เขย่าสั้น ๆ ไปกลับหลายจังหวะเพื่อปล่อย EMP เมื่อพลังเต็ม
5. เล่นด่าน 90 วินาที บอสปรากฏวินาที 60 กำจัดก่อนหมดเวลา

ชีวิต 3 หน่วย ยิงอัตโนมัติ กลิ้งอมตะ 0.6 วินาที คูลดาวน์ร่วมซ้าย/ขวา 3 วินาที EMP เติม 5% ต่อวินาทีและเพิ่มเมื่อกำจัดศัตรู ล้างกระสุนศัตรู โจมตีบอส 18 หน่วย โหมดฝึกไม่เสียชีวิตและเติม EMP ด้วยปุ่มได้ เลือกโหมดฝึกก่อนเริ่มรอบ

เมื่อสลับแอปหรือหน้าต่างเสียโฟกัส เกมพักและรอกดเล่นต่อ เปลี่ยนแนวจอแล้วต้องตั้งศูนย์ใหม่ เปิดวิธีเล่นระหว่างเกมจะพักเกมอัตโนมัติ

## หลักการเซนเซอร์

- src/sensor.ts: ขอสิทธิ์ Orientation และ Motion จากการกดปุ่มเดียว อ่านข้อมูลแยกสถานะ ตัด null/NaN และตรวจข้อมูลขาด
- TiltFilter ใช้มุม beta/gamma เทียบศูนย์ แปลงตามแนวจอ มี dead zone 3 องศา ช่วงเอียงเริ่มต้น 28 องศา ตัวกรองใช้ elapsed time (tau 65 ms)
- src/motion.ts: ตรวจท่าแยกจากการเคลื่อนที่ ใช้ rotationRate แกน roll ตามแนวจอสำหรับหลบ (เริ่มต้น 140 °/s และสะสมอย่างน้อย 12°)
- เขย่าใช้ความเร่งเชิงเส้น magnitude เริ่มต้น 11 m/s² ต้องมี 3 peak ที่แรงสลับทิศภายใน 700 ms เว้นอย่างน้อย 80 ms และต้องลดต่ำกว่าเกณฑ์ปล่อยระหว่าง peak
- เมื่อเริ่มพบ peak เขย่า จะระงับหลบขณะรอดูรูปแบบ หลังท่าติดมี lockout 850–900 ms หลังตั้งศูนย์/เริ่ม/พักมีเวลารอ 650 ms
- ใช้ event.acceleration ก่อน หากไม่มีใช้ accelerationIncludingGravity ลบแรงโน้มถ่วงประมาณจาก low-pass tau 500 ms รอปรับตัว 700 ms และแสดงคำว่าประมาณค่า ค่าประมาณอาจผิดเมื่อเครื่องเคลื่อนเร็ว จึงปรับความไวและทดสอบเครื่องจริงได้
- src/model.ts: กติกาเกม คูลดาวน์ พลังงาน การชน และผลจบ อยู่แยกจาก Phaser กรองอินพุตเคลื่อนที่ tau 55 ms
- ค่าขาดแสดงว่าไม่พร้อมใช้งาน ไม่อ้างค่าศูนย์เป็นค่าที่วัดได้ มีปุ่มสำรองให้ใช้

นี่คือการใช้เซนเซอร์ต่างชนิดแยกหน้าที่ ไม่อ้างว่าเป็นระบบ sensor fusion สำหรับประมาณ orientation เอง

## ผลตรวจและการทดสอบอุปกรณ์จริง

ดู TESTING.md สำหรับขอบเขตผลจำลองและรายการทดลองจริง ห้องทดสอบในเว็บมีกราฟข้อมูลสด ตารางให้ผู้ทดลองบันทึกถูก/ไม่ติด/ผิดท่า และดาวน์โหลด JSON ผลทดลองบนเครื่องได้ ผลไม่ส่งไปเซิร์ฟเวอร์ ตารางเริ่มว่างและไม่สร้างผลผ่านอัตโนมัติ

งานนี้ไม่มีบัญชีหรือหลังบ้าน ข้อมูลเซนเซอร์อยู่ในเบราว์เซอร์ เสียงสร้างด้วย Web Audio ส่วนการสั่นเป็นทางเลือกบนเครื่องที่รองรับ Vibration API; iPhone Safari ใช้ภาพและเสียง

## งานต่อยอด iOS

โครง Capacitor ใน ios/ ยังคงอยู่ แต่รุ่นส่งงานนี้เผยแพร่เป็นเว็บ ยังไม่ได้สร้างหรือทดสอบ IPA/ไจโรจอย FANTECH

หากต้องการบิลด์ในภายหลัง ใช้ macOS และ Xcode 26+:

```bash
bash scripts/build-unsigned-ipa.sh
```

สคริปต์จะบิลด์เว็บและ sync iOS ก่อนสร้าง build/ios/Gyro-Space-Lab-unsigned.ipa สำหรับนำไปเซ็นด้วย Sideloadly

## Artist fleet + controller update
Choose Falcon, Raven or Atlas and Precision or Spread in the hangar. All hulls use the same collision radius, speed and three lives. Spread fires 3 half-damage projectiles every .27s at -12/0/+12 degrees; Precision fires 1 damage every .18s. Choices and sensitivity are saved locally when storage is available.

Pair FANTECH in OS Bluetooth settings, select gamepad input, then press a physical button so the browser exposes it. Open Settings > FANTECH to inspect real axes/buttons and rebind skills. Defaults: left stick/Dpad movement, LB/RB dodge, bottom button EMP, Start pause. Disconnect pauses play. For tilt-as-stick: select axes, release sticks, run a five-second trial, explicitly confirm that movement came only from tilting, then center. No raw gamepad gyroscope is claimed. iPhone/FANTECH physical compatibility remains unverified.

Art credits and original/adapted downloads: ASSET-CREDITS.md and public/assets/CREDITS.md. Rebuild atlas with scripts/build-assets.py (Pillow). Run npm install, npm test, npm run dev, npm run build. Public URL and QR remain unchanged.
