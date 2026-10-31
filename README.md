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

Sectors use Kla'ed/Nairan/Nautolan fleets and2/3/3 boss phases. Destroy hardpoints to expose each core. Final-sector Rage adds warned dash, sweeping beam and dense packets. DifficultyProfile in src/neon.ts owns stage balance and caps. Black-hole cores can be destroyed; plasma fields interfere with fire; defense grids require movement. EMP clears ordinary threats and hazards, not commanders or their turrets.

Battle uses Phone Motion, controller, touch or keyboard. Enable sensors and calibrate in Preflight; recalibrate after rotation. Q/E warp, Space EMP, arrows/WASD move. Pause contains Calibration, Music and SFX. Controller Lab shows observed device input. Actual phone/controller behavior requires hardware testing.

## Verification and art

See NEON-PLAN.md, NEON-TESTING.md and ASSET-CREDITS.md. Simulation and browser screenshots are distinct from physical-device results. The long real-time Endless soak is intentionally omitted at the user's request.

Rebuild selected neon art with scripts/build-neon-assets.py using Python3 + Pillow and the user-provided archives in Desktop/Space_combat. Only selected runtime derivatives ship. Source ZIP/PSD archives are not included. No new generative imagery is used; older NULLSIGNAL UI provenance remains disclosed in the credits.
