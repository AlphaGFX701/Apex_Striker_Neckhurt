# Apex Strikers — Neon Onslaught

A mobile portrait gyro arcade shooter built with Phaser, TypeScript and Vite. Tilt to fly, flick to warp and shake for EMP. Three progressively harder sectors, Endless and Practice. Three free ships with three in-run forms; legacy saves and input preferences are preserved. No accounts, purchases or permanent strength.

[Play Apex Strikers](https://gyro-space-lab-th.mjadsakul.chatgpt.site/)

## Run and build

```sh
npm ci
npm run dev
npm test -- --testTimeout=20000
npm run build
```

Publish dist/ as static files. Phone sensors require HTTPS. Existing Capacitor app ID remains unchanged; Android test APKs bundle the game offline; iOS packaging is not included.

## Combat

Two/five power orbs evolve the selected ship. Red Overdrive lasts25 seconds. Two permanent escorts level up together. Collect another escort at maximum rank for five-second Super: all friendly weapons deal double damage and intercept ordinary rounds; giant lasers still hurt. All powers reset on a new run.

Sectors use Kla'ed/Nairan/Nautolan fleets and2/3/3 boss phases. Destroy hardpoints to expose each core. Final-sector Rage adds warned dash, sweeping beam and dense packets. DifficultyProfile in src/neon.ts owns stage balance and caps. Defense grids require movement. Plasma fields, black holes and boss decoys have been removed. Stage boss packets are25% denser, with6/8/10 support caps; Stage3 enemy hull/shield impacts gain20% without boosting boss or miniboss damage. EMP clears ordinary threats and hazards, not commanders or their turrets.

Battle uses Phone Motion, controller, touch or keyboard. Enable sensors and calibrate in Preflight; recalibrate after rotation. Q/E warp, Space EMP, arrows/WASD move. Pause contains Calibration, Music and SFX. Controller Lab shows observed device input. Actual phone/controller behavior requires hardware testing.

## Verification and art

See STAGE-BALANCE-TESTING.md for the latest sector2/3 pacing parameters and before/after results. NEON-PLAN.md, NEON-TESTING.md and ASSET-CREDITS.md document the retained Neon systems and artwork. Simulation and browser screenshots are distinct from physical-device results. The long real-time Endless soak is intentionally omitted at the user's request.

Rebuild selected neon art with scripts/build-neon-assets.py using Python3 + Pillow and the user-provided archives in Desktop/Space_combat. Only selected runtime derivatives ship. Source ZIP/PSD archives are not included. No new generative imagery is used; older NULLSIGNAL UI provenance remains disclosed in the credits.

## Wenrexa launcher
The first screen now renders before Phaser and flight textures. Press Start to open the flight deck. Browse missions, ships, records and tabbed settings during loading; only Launch waits for actual asset readiness. Preferences require Apply Changes and leaving a dirty form confirms discard. See LAUNCHER-TESTING.md for responsive/load checks and selected Wenrexa credits.

## Tactical Neon Remake
Full tactical menu/HUD theme with local MGS1 fonts, shared animated menu space and authored beam textures. Font optical scale was reduced to150% after mobile feedback, with compact14–16px controls and fitted secondary labels. Laser warning/fire audio is nonverbal original DSP. Combat values and save keys remain unchanged. See TACTICAL-REMAKE-TESTING.md for verification, measurements and clips.

## Boss encounter revision
Boss entry shatters loose drops once, without removing collected powers or later supplies. Music keeps the confirmed audible track until the requested recording starts, with bounded recovery across failures, pause and mute. See BOSS-REVISION-TESTING.md for seeded pressure measurements, desktop browser playback evidence and limits.

## Portrait Android test build
Use JDK21 (Android Studio jbr), Android SDK36 and Node22+. The Android directory preserves com.mjadsakul.gyrospacelab and supports API24+. No remote server URL is configured.

```powershell
npm ci
npm run build
npx cap sync android
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew.bat assembleDebug
```

The debug-signed APK is android/app/build/outputs/apk/debug/app-debug.apk. Copy it outside public/dist as Apex-Strikers-1.0.0-test.1.apk. Never publish signing keystores. Browser saves do not automatically migrate into WebView. See PORTRAIT-MOBILE-PLAN.md and PORTRAIT-MOBILE-TESTING.md for current UI/balance and test limitations. No20-minute Endless soak is required.


## Current UI review build
The original Start/main-menu tools are restored with16px readable mobile UI. See UI-RESTORATION-PLAN.md and UI-RESTORATION-TESTING.md. Android packaging is currently on hold until the user reviews the web; the earlier test APK does not include this restoration.
