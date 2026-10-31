# Mobile Onslaught — verification report

Date: 31 October 2026. Source baseline: `14e2a18f089ef8844cd0260cee26b102eefd0665`.

## Automated checks

- `npm test`: **95 tests across13 files passed**. Includes sensor calibration/filtering, controller mapping/held buttons/disconnect, stage boundaries, three boss phases/turrets, local EMP, protection ordering, drones2→6, pickup overflow, persistence and independent Onslaught records.
- Red Overdrive checks:25-second start/refresh/expiry/reset, maximum-power re-pickup, ordinary blue shots unable to intercept, swept collision at30fps,360 crossing projectile pairs consumed once, bounded laser interception and giant beams unaffected.
- Boss fairness checks: all three sectors and phases preserve the104-unit lower corridor; future crossing trajectories are rejected; escort counts stay bounded. This is a per-phase fixed corridor, not a claim of a dynamically moving safe zone.
- `npm run build`: passed TypeScript and production Vite build. Expected warning: the Phaser bundle exceeds500kB; resulting JS is about385kB gzip. Development QA controls are not included in production.
- Premium UI strict audit: zero findings. Two-axis source review (Standards and Spec) completed with no unresolved blocking findings after corrections.

## Visual and interaction checks

Browser viewport matrix:320×568,390×844,430×932 and844×390. Portrait field fits without document scrolling; one boss HP bar; Pause is44×44 and bottom actions meet the touch-target minimum. Controller Lab was separately inspected at320px width.

Actual browser screenshots are in `artifacts/onslaught-*.png`. `onslaught-colored-pickups-390.png` is a controlled six-pickup palette fixture, not a claim of six simultaneous natural drops. `onslaught-red-overdrive-390.png` shows rendered red main fire. All27 cosmetic builds passed alpha connectivity checks; the contact sheet and report are retained.

Pause → Settings → voice preview → Controller Lab → back → Resume was exercised during a full run. The game clock stayed at0:25 while paused and resumed without a countdown. Warp activation changed both skill buttons to the same recharge state. This was desktop browser input, not a physical controller.

## Runs and endurance

`artifacts/onslaught-realtime-browser-final.json` records full browser runs using the development simulated pilot and Practice. No timeline fast-forward is used in these runs. These establish completion/rendering and integration, not human survival difficulty or real gyro accuracy. Controlled screenshots may use explicit development fixtures and are reported separately.

| Sector | Main weapon | Flight time | Intercepted rounds | Pickups |
| --- | --- | ---: | ---: | ---: |
| Asteroid Belt | Plasma |206.5s |905 |59 |
| Orbital Convoy | Laser |190.1s |535 |23 |
| Citadel Assault | Laser |222.0s |1500 |54 |

All three reached Results after defeating the capital ship. One manually activated Warp was checked in sector2. Desktop browser p95 requestAnimationFrame samples varied around7.1–14.1ms during observations; these are rolling windows, not guaranteed mobile performance. The final report image is `onslaught-results-final-390.png`; earlier pre-overdrive evidence is explicitly named separately.

`artifacts/onslaught-balance.json` contains18 deterministic DPS reference runs (three stages × three weapons × base/mid setup). All can defeat the boss without EMP damage. Base boss durations are approximately93–111s /99–161s /155–204s by sector and weapon. The mid reference uses65% target tracking, one weapon-power step, two drones and sustained missiles, without manually granting Red Overdrive. These are balance references, not measured human performance.

`artifacts/onslaught-soak.json` records the real-wall-clock20-minute Endless **simulation/model** soak, with source hash, checkpoints, object maxima and Node heap samples. It does not measure the Phaser renderer, mobile FPS, GPU memory or a20-minute human play session. Browser frame samples in the browser run report are desktop observations only.

Completed soak:1200.012 wall seconds /1199.983 simulation seconds,71,999 updates, wave16. Maxima:32 enemies,95 friendly shots,289 hostile shots,6 pickups and41 effects. Sampled Node heap ranged17.46–26.58MB, final sampled22.31MB; it fluctuated rather than increasing monotonically. Worst measured model update18.34ms is a maximum observation, not a renderer frame-time claim. A competing development HMR port produced a warning; the independent model continued to completion with the same source hash and no simulation exception.

## Audio and provenance

Both user-requested music recordings are shipped under stable runtime filenames. Boss music crossfades, loops and does not restart between phases. Tests cover transition timing, pause/resume and announcement prioritization. The short browser recording contains canvas rendering plus Web Audio music/SFX; device SpeechSynthesis output is outside that recording path.

The supplied seven WAV filenames contain identical unrelated NPC dialogue. They cannot truthfully supply the requested seven item announcements. Correct English device speech and distinct effects remain active, with seven preview buttons and an explicit Settings status. See `AUDIO-PROVENANCE.md`. This is an input-content limitation, not a claim that custom recordings were integrated.

## Device checks still outstanding

No iPhone14, Android phone or FANTECH WGP15 V2S physical sensor/controller pass is claimed. Device permissions, actual tilt/gesture thresholds, Bluetooth mappings, audio behavior and sustained mobile performance require those devices. Desktop simulated input must not be presented as a substitute.

Manual human survival/balance tuning and a20-minute rendered mobile playtest remain distinct from the completed automated/model checks. The public version is for the user's playtest and feedback.
