# Apex Strikers — Neon Onslaught verification

Date:31 October2026. Baseline ffd1900fa6ba7f0bb906c31a9968f7da502ca9f1. Tests are simulated unless explicitly identified otherwise.

## Automated rules

133 tests across17 files passed with `npm test -- --testTimeout=20000`. Covers retained sensors/calibration/controller/pause/save behavior and new difficulty caps, Super refresh/expiration/double damage, interception without invulnerability, plasma boundaries, destructible wells/gravity cap, one-time Rage, reachable changing corridors, boss packets not starved by escorts, decoy ray routing including targets behind the player, sweep geometry, splitting/iron meteors, and ending clocks.

The old long simulated Endless loop is shortened to240 simulation seconds, executed in seconds. No20-minute real-time browser soak was run. Legacy core-gate tests were updated to2/3/3 phases and gating in every sector.

## Balance reference

Deterministic model, seed743, Level2 main weapon + escort rank2,65% target tracking, no pickups or EMP. This is not human performance or a physical-device test. Core HP900/1200/1500; exposed-core damage vulnerability1/1.2/1.8 keeps the armored-gate fight within the accepted60–120 second target.

| Sector | Pulse | Plasma | Laser |
|---|---:|---:|---:|
| 1 | 69.9s | 69.3s | 65.4s |
| 2 | 98.5s | 111.8s | 74.25s |
| 3 | 101.4s | 117.35s | 95.1s |

All nine references won. Hostile peak in these normal simulations:228; boss supports never exceeded8. See artifacts/neon-balance.json for complete counts.

## Browser visuals and outcomes

Playwright Chromium screenshots at320x568,390x844,430x932 and844x390. No horizontal document overflow; all three battle buttons remain at least44px in both dimensions. Inspected all three sector bosses, baked red Rage, Super escorts, shield states, and Victory/Game Over presentation. Final browser run reported no page or missing-resource errors. A separate synthetic stress fixture injected420 hostile rounds; that wall is not an authored normal boss pattern.

Recorded stress frame interval median 16.7ms; p95 33.4ms while recording video in desktop headless Chromium. This is not an iPhone frame-rate guarantee. Combat remains bounded at22 enemies,480 rounds per side,60 pickups and160 effect particles. Dense rounds use a single persistent Canvas layer.

Victory waits for three seconds of slow destruction and one second of VICTORY; defeat plays ship destruction before GAME OVER and Results. Reported terminal headings: VICTORY and GAME OVER. The supplied browser clip is a QA capture and includes the labelled synthetic stress scenario; it does not include physical gyro input.

## Review findings resolved

Standards: fixed boss packet starvation, decoy rays behind the muzzle, Canvas tint incompatibility and canonical documentation drift. Added regression coverage for scheduling and ray bounds. Dense methods remain a possible maintainability improvement, not a known correctness blocker.

Spec: supplied Kla’ed shield contours where the source pack lacks matching shield frames; connected artist destruction frames; updated Nautolan miniboss hull/engine/destruction; dynamic preflight phase counts; corrected laser decoy retaliation. Final spec recheck reported no unresolved blockers.

## Hardware and release limits

Actual iPhone/Android gyro permission, motion direction, comfort and difficulty, Bluetooth FANTECH mappings and device frame rate remain unverified in this run. They must not be reported as passed based on simulations. No IPA/APK packaging or paid systems are included. Existing app ID, save keys, public URL and QR are preserved.

## Evidence

- artifacts/neon-sector-1.png, neon-sector-2.png, neon-sector-3.png
- artifacts/neon-mobile-320x568.png, neon-mobile-390x844.png, neon-mobile-430x932.png, neon-mobile-844x390.png
- artifacts/neon-super.png, neon-stage3-rage.png, neon-victory-animation.png, neon-victory-results.png, neon-loss-animation.png, neon-game-over.png
- artifacts/neon-super-and-ending.webm
- artifacts/neon-browser-report.json and neon-balance.json

Selected artwork and modifications: ASSET-CREDITS.md and public/assets/neon/credits.json. Original source archives are not deployed.
