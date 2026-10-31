# Pixel Combat — verification

31 October 2026. Updated to include the user's later requests for separated wingmen, denser boss fire, fewer Weapon Orbs and fewer red interceptors. The user explicitly waived the 20-minute Endless browser run.

- `npm test -- --maxWorkers=2 --testTimeout=30000`: 120 tests across 16 files passed. Earlier default-concurrency runs timed out while Ghidra and the emulator were consuming CPU; the final bounded-concurrency run passed.
- `npm run build`: passed (Vite reports a large Phaser bundle and a mixed static/dynamic import warning). TypeScript is included in the build.
- Premium UI strict audit: zero findings. Two independent reviews were run; a dead texture-allocation path was removed and the review's edge-aim concern was fixed. The new edge tests verify that both outside wingmen actually damage a moving boss turret.
- Nine ship-form alpha checks passed, including connected silhouettes and common anchors. The hangar and a controlled boss fixture were inspected in the browser. `artifacts/pixel-boss-fixture.png` is prepared state, not a naturally played round.
- At 320x568,390x844,430x932 and844x390 the battle page showed no horizontal overflow; Pause was 44x44 and each bottom action at least 44x44. This is browser sizing, not physical-device testing.
- Deterministic boss rig at Level2, wingmen2 and65% tracking: Pulse63.0s, Plasma62.15s, Laser54.0s (`artifacts/pixel-combat-balance.json`). These are simulations, not subjective difficulty findings. Boss pressure sampling and safe-lane assertions are in `artifacts/pixel-boss-pressure.json` and tests.
- The original APK ran to its login screen in MuMu. Actual Thunder Strike combat and full human playthroughs of each new weapon remain unobserved. iPhone/Android gyro and physical controller validation are also pending.
- Research files are outside the game at `C:/Users/acer/Desktop/ThunderStrike-Research`; `reports/COMPARISON.md` distinguishes static observations, runtime evidence and design choices.
