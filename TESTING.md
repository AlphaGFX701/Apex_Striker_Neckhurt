# Verification — Tactical Fleet / English Edition

Date: 31 October 2026 (Asia/Bangkok). Source update from the previous public v5 game.

## Automated checks

- `npm test`: 57 tests across six files passed. This includes all 39 previous cases plus weapon scaling, non-stacking weakness bonuses, analog trigger pressure, controller selection, drift centering, local-save migration, invalid/blocked storage, reward settlement across reload, shield regeneration, missile retargeting, directional laser collision, perk pause/reset and Endless transitions.
- `npm run build`: TypeScript check and Vite production build passed. Phaser produces a large bundle warning (~1.33 MB minified / ~377 KB gzip); this is a packaging warning, not a build failure.
- Twenty simulated minutes of Endless: 24,500 steps of up to 50 ms, with full equipment, power choices and automatic boss targeting. The run remains active beyond 1,200 simulated seconds. Player bullets stay <=240, hostile bullets <=220, enemies <=18; pickups and explosion history are capped. This is accelerated deterministic simulation, not a claim of twenty minutes of wall-clock browser or phone testing, and not a measured mobile heap profile.
- `scripts/check-tactical-assets.py`: all 27 ship compositions have one connected major alpha silhouette at the checking scale. Contact sheet and per-build component areas are in artifacts/.
- Premium UI static audit in strict mode: zero findings after dynamic cards were given explicit action ownership. `git diff --check` reports no whitespace errors. English scan of runtime source and visible screens finds no Thai UI strings.

## Browser tests

Performed in the available desktop browser, with real DOM/canvas rendering and mouse/keyboard controls. Viewport resizing is not physical-device testing.

- Practice completed through boss defeat: Asteroid Belt 79.8 seconds; Orbital Convoy 75.5 seconds; Citadel Assault 81.3 seconds. The last two runs used Laser, Missiles, Shield and Drones. Citadel used one EMP. Practice left credits at zero and did not create records.
- Perk selections at 20/40 seconds pause flight and resume through a countdown. Cancelled resume was checked: reopening Pause during the countdown kept the clock fixed at 70 seconds.
- Pause -> Settings -> Controller Lab -> Back -> Back returns to the paused mission and resumes correctly.
- Appearance selection/save, dirty-draft cancel/discard and selected ship persistence were exercised. Four practice equipment slots were equipped and their visible slot state matched Preflight. Upgrade preview is separate from ownership.
- 320x568, 390x844, 844x390 and 1280x900 were inspected. Title, Hangar, Stage Select, Controller Lab, Records and Settings showed no horizontal overflow. Battle was checked in portrait and landscape; field ratio remains 9:16 and page height equals the viewport. Landscape's portrait field is intentionally smaller.
- Empty records, locked stages, no-controller messaging, unavailable phone telemetry, reduced effects and English text were checked. Fresh final-load browser error logs were empty; earlier development-only missing background messages were resolved before final verification.
- Representative actual screenshots: artifacts/title-390.jpg, hangar-390.jpg, battle-390.jpg, power-choice-390.jpg, controller-390.jpg, results-390.jpg and results-citadel.jpg. Full-page menu screenshots include scrollable content.

## Simulated controller UI test

`qa/controller.html` is a development-only fixture, excluded from the production build entry. It explicitly says SIMULATED INPUT — NOT A PHYSICAL DEVICE. It imports the production adapter and Controller Lab.

Observed in the browser: left stick displacement, EMP button highlight/check, 50% LT trigger indicator, remapping Dodge Left from button 4 to 0, disconnect clearing observed checks, and a five-second stationary tilt test reporting No tilt signal detected with confirmation still false. Unit tests cover multi-device selection, held-button suppression and replacement. No simulated result is presented as a physical FANTECH test.

## Physical-device tests still required

No iPhone 14, Android handset or physical FANTECH EOS PRO I WGP15 V2S was connected during this implementation. Bluetooth mode compatibility, actual stick/button mappings, mapped tilt, iOS permission prompts, real gyro gestures and sustained mobile performance remain unverified.

For each physical device: open the HTTPS public URL, enable sensors from a tap, set center, perform ten left/right dodge and shake trials in Settings, and export the user-labelled trial report. In Controller Lab, verify buttons/sticks/triggers, disconnect/reconnect, remap and the mapped tilt trial. Raw gamepad gyroscope access is not claimed.

## Review and delivery

Two read-only review passes identified and corrected countdown cancellation, nested return routing, movement-pointer ownership, laser direction/range, practice loadout display and post-boss Endless wave advancement. Stage-specific formations, Citadel escorts and separate cropped sector backgrounds were added before final checks. Legacy control saves retain unrelated fields when preferences are updated.

Publication uses the existing public Site and its static hosting manifest. No accounts, server storage, paid currency or analytics were added. QR destination is unchanged.
