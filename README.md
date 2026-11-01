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

Publish dist/ as static files. Phone sensors require HTTPS. Existing Capacitor app ID remains unchanged; this delivery does not package IPA/APK.

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
