# Dynamic environment verification — 31 October 2026

## Completed checks

- 71 Vitest cases passed across 10 files. Includes the retained sensor/controller suite, stage boundary/reset checks, mini-boss reward/escape, three boss phases, storm movement, pickup conversion, bounded speech queue, priority, ducking, cancellation and independent voice/SFX switches.
- Nine complete fixed-step combat runs: every base main weapon against every stage, no pickup collection, EMP allowed. Every boss defeated before 90 seconds. These are simulated inputs, not nine physical-device playthroughs.
- TypeScript and Vite build passed. Vite reports the existing Phaser bundle size advisory (~1.35 MB minified / 382 KB gzip); it is not a build failure.
- Sixteen browser-rendered state checks: four stage segments at 320x568, 390x844, 844x390, 1280x900. No horizontal/vertical document overflow during battle. Field ratio stays 9:16. One initial landscape fixture ran before ship art was ready; it was explicitly retaken after loading, and the valid result replaces it in the JSON evidence.
- Visual state fixtures advance the real model deterministically and pause it for screenshots; they are labelled simulated. The final screenshots use Canvas. Embedded WebGL showed black rectangles behind transparent atlas frames; Canvas removed them. No claim of WebGL parity is made.
- 11.97-second canvas battle recording has a real Opus audio track. Audio inspection: mean -25.9 dB, peak -10.6 dB. MP4 copy is included. It records in-game BGM/SFX, not operating-system SpeechSynthesis output. The boss segment was entered from a controlled simulation state, then ran in real time.
- Current art pipeline builds 196 atlas frames, four tinted/feathered space variants, boss previews and three compressed music tracks. Stage/hangar/title contain no Earth/forest/city background.

## Real-time soak

Completed: 1200.01 wall-clock seconds / 1200 simulation seconds, 72,000 ticks, wave 34. Maximum combined objects 219; sampled heap peak 12.42 MB, final 6.12 MB. No object-cap assertion failed. Worst observed model step 67.176 ms includes OS scheduling and is not a GPU frame-time metric. See artifacts/realtime-model-soak.json. This is a genuine wall-clock model soak, not accelerated simulation; rendering and physical inputs are excluded. A separate browser soak attempt was affected by background-tab throttling/window focus and is not counted as a successful sustained 20-minute rendering benchmark.

## Evidence

- artifacts/environment-overview.jpg: four screenshot states, labelled simulated.
- artifacts/environment-*-390.jpg and corresponding 320/844/1280 files.
- artifacts/environment-responsive.json: viewport, document and playfield measurements.
- artifacts/environment-battle.mp4 / .webm and environment-video-inspection.txt.
- artifacts/realtime-model-soak.json: wall time, simulation time, waves, heap and object counts.
- premium-audit.json: static UI audit; not a substitute for browser/physical testing.

## Physical-device verification still required

No iPhone, Android or FANTECH EOS PRO I WGP15 V2S hardware was available to the agent. Real tilt/gesture accuracy, sensor permission flows on the user's device, installed speech voice quality, mobile frame rate and controller tilt mapping remain unverified. Controller tilt is analog-mapped input only when observed and confirmed, not raw gyro data from Gamepad API.
