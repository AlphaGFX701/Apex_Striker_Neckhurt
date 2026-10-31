# Gyro Space Combat — Dynamic Environment Edition

English mobile-first gyro arcade shooter, built with Phaser, TypeScript and Vite. Three stages (up to 90 seconds), Endless, Practice, 27 cosmetic ship builds, three free main weapons, instant pickups, warp and EMP. No permanent equipment upgrades or purchases. Public game: https://gyro-space-lab-th.mjadsakul.chatgpt.site/

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

`dist/` is the static publication. Phone motion needs HTTPS; a computer LAN address over HTTP does not enable phone sensors.

## Controls

Phone: Enable Sensors, hold comfortably and Calibrate. Tilt to move, flick left/right to warp, shake repeatedly to use a charged EMP. Touch drag and arrows/WASD are alternatives. Q/E or controller LB/RB warp, Space or the controller bottom button deploys EMP. Start pauses. Controller Lab supports device selection, remapping and visual input diagnostics; it does not claim standard Gamepad API provides raw controller gyroscope values.

App loss, unavailable phone input, orientation change or controller disconnection pauses the run and clears input. Resume has no countdown and grants short protection. Practice preserves lives and does not change records.

## Stage rhythm

0–15 seconds: V/line formations. 15–35: armored zig-zag enemies, gapped rings and a magnetic storm. 35–60: warned mini-boss encounter; if alive at 60 it escapes without rewards. At 60 the final boss appears; its single HP pool has three phases at two-thirds and one-third. Clear before 90 seconds. Endless retains 30-second waves and a boss every three waves; defeat the boss to continue.

Six pickup types apply instantly: Weapon Power (two steps per run), Missiles/Drone (12 seconds, extend to 24), Shield (one hit), Repair and EMP Cell. Magnet attraction starts at 150 logical units. Full hull/max weapon converts the pickup to EMP energy; the announcement reports the actual effect. Every run resets powers. Older progression data is retained; arcade score records use a separate save.

## Runtime boundaries

- StageWaveManager: stage data and one-shot timeline events.
- GameModel: collision, damage, hazards, mini/final bosses and PickupCollected events.
- ParallaxEnvironment: three simulated-time layers at 10/20/30 units per second, feathered looping images and two-second theme crossfades.
- AudioDirector: three music tracks, Music/SFX/Voice levels, bounded announcement queue, music ducking and pause cancellation.
- Phaser scene: Canvas rendering with per-texture image pools. Canvas avoids transparent-atlas artifacts observed in the embedded WebGL browser.

Phone sensor/gesture modules and GamepadAdapter remain independent from combat. Installed English device voices supply speech, with synthesized cues and visible labels as fallback. Browser voice/autoplay behavior still requires physical-device validation.

## Artist assets

No generative imagery. Feony Background 7 (space), Baldur/Foozle Void Fleet 1/2, Matt Walkden Lunar Lander, Wenrexa Laser2020, GrafxKid Mini Pixel Pack 3, Goose Ninja Space Music Pack, and the existing Skorpio player assembly. See ASSET-CREDITS.md for sources/terms. Restricted source ZIPs/WAV packs are not published.

```sh
python -m pip install -r scripts/requirements-assets.txt
python scripts/build-environment-assets.py
```

The pipeline reads the user-supplied archives in Desktop/Space_combat and writes runtime images/MP3s. Existing player assembly rebuild scripts remain available.

## Verification

See ENVIRONMENT-TESTING.md and artifacts/environment-responsive.json. QA pages under qa/ are development-only and do not ship in the static build. Their simulated pilot/state fixtures are not physical sensor/controller tests. The retained Capacitor project is future app work; no IPA/APK was built in this update.
