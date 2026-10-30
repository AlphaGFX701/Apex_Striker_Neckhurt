# Gyro Space Combat — Tactical Fleet

English browser space shooter built with Phaser, TypeScript and Vite. Play three 90-second stages, customize 27 cosmetic ship builds, equip four combat systems, choose temporary upgrades and unlock Endless. All game data stays in your browser.

Public game: https://gyro-space-lab-th.mjadsakul.chatgpt.site/

## Run and build

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite serves the local preview; `dist/` is the static deployment. Phone sensors require HTTPS (localhost is an exception only on the device running the server). Opening a computer's LAN address over HTTP does not enable phone sensors.

## Controls

- Phone: enable sensors, hold comfortably, set center. Tilt to move, flick sideways to dodge, shake in repeated short alternating movements to deploy a charged EMP.
- Touch: drag below the ship. Releasing the movement finger pauses flight. Other fingers may use the skill buttons without cancelling movement.
- Keyboard: arrows / WASD, Q / E dodge, Space EMP.
- Controller: pair in OS Bluetooth settings and press a button. Defaults: left stick / D-pad move, LB / RB dodge, bottom button EMP, Start pause. Remap in Controller Lab.

Controller Lab shows both stick positions, button numbers, trigger pressure, action lamps, selected device, observed checks and a mini flight test. Its raw inputs and exported observations describe browser data, not physical-device compatibility certification. Standard Gamepad API does not provide raw gyroscope data. Mapped tilt is enabled only after an observed trial and explicit user confirmation.

## Combat and progression

Asteroid Belt, Orbital Convoy and Citadel Assault each introduce a different boss, weakness and environment. Bosses appear at 60 seconds; defeat them before 90 seconds. Main weapons: Pulse, Plasma Spread and piercing Laser. Secondary: retargeting missiles. Armor: regenerating shield. Wingman: support drones. Equipment has three visible upgrade levels; cosmetic hull parts do not affect speed or collision.

Stage upgrades appear at 20 and 40 seconds. Endless has 30-second waves and a boss every third wave; boss fights stop wave advancement. Perk selection pauses simulation and resumes after a two-second countdown. Dodge grants 0.6 seconds invulnerability and starts with a shared three-second cooldown. EMP charges at 5%/second and on kills.

Progression is local: regular enemies drop 2 credits, armored enemies 6; bosses award 30; clear bonuses are 50 plus 100 for a first clear. New systems cost 90; upgrades cost 60 then 120. Rewards settle once per completed/withdrawn run. Refreshing an unfinished run forfeits its unbanked salvage. Clearing stage one opens stage two and Endless; stage two opens stage three.

Practice opens all stages and lets you equip otherwise locked systems without buying them. The Practice equipment level selector chooses its level independently of purchases. Practice does not grant credits, unlocks or score records.

## Code boundaries

- `model.ts`: deterministic combat, waves, projectiles, pickup attraction, hitboxes, powers and results.
- `equipment.ts` / `progress.ts`: shared weapon definitions, loadouts, weakness rules and local progression.
- `game.ts`: Phaser rendering and input boundary. `screens.ts` holds screen markup; `main.ts` connects screen state and systems.
- `sensor.ts` / `motion.ts`: permission-aware phone telemetry and time-based movement/gesture filters, independent of combat.
- `controller-lab.ts` / `gamepad.ts`: visual diagnostics and polling adapter, including multiple devices and analog buttons.

Legacy v4 control preferences and v5 cosmetic ships are preserved. The v6 progress save keeps old weapons available. Invalid or blocked storage falls back to a playable session.

## Art and verification

Read ASSET-CREDITS.md for artist provenance and derivative downloads. No generative image model is used. Rebuild the tactical art with Python + Pillow:

```sh
python scripts/build-tactical-assets.py
python scripts/check-tactical-assets.py
```

The earlier PSD extraction script additionally requires psd-tools. TESTING.md records automated, browser and physical-device verification separately. FANTECH / iPhone hardware compatibility remains unverified until tested on the actual devices.

The retained Capacitor iOS project is optional future work; this delivery is a static web game, not a newly tested IPA.
