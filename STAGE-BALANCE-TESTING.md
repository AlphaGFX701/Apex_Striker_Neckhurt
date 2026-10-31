# Apex Strikers — Stage2/3 pacing verification

31 October2026. Baseline76943cdcf6e49b8012ce819d50106a2707c8fcba.

## Delivered parameters

| Stage | Standard HP intro/mid/late | Cadence | Spawn interval | Enemy cap |
|---|---|---|---|---|
|2|5.85 /6.3 /6.75|1.2 /1.6 /2|3.2 /2.8 /2.5s|12 /16 /18|
|3|7.8 /8.4 /9|1.6 /2.8 /4|2.8 /2.3 /2s|14 /18 /22|

Five-second interpolation affects newly spawned stats only. Intro Line/V sizes5/6 are centered, with no armor/kamikaze/homing. Projectile speed90%, first fire after0.5 visible simulation seconds. Armor and rear-gunners start45s; armor cap1 until75s then2. New wave generation pauses88.5–92; combat and timer continue. Standard-only impact: Pulse+10%,Plasma+20%,Laser+5%; missiles, elites and boss support retain prior damage. Scores and drop formulas remain unchanged.

## Deterministic before/after comparison

Pinned baseline source is loaded read-only through Vite; no checkout replacement. Seed743, fixed Level1/2, pickups disabled, no EMP. Isolated target at y250, player y610, so times include projectile travel; separate30-second wave run uses65% tracking. These are simulations, not human or physical-device measurements.

|Stage|Weapon|Level|Kill time before→after|30s kills before→after|Remaining before→after|
|---|---|---:|---|---|---|
|2|pulse|1|1.53→1.17s|5→20|16→8|
|2|pulse|2|1.24→0.95s|21→35|11→7|
|2|plasma|1|3.4→2.11s|10→31|15→9|
|2|plasma|2|3.51→2.22s|29→36|12→8|
|2|laser|1|1.01→0.61s|27→39|12→6|
|2|laser|2|0.61→0.41s|60→41|6→4|
|3|pulse|1|1.89→1.39s|6→14|22→12|
|3|pulse|2|1.39→1.1s|13→27|18→9|
|3|plasma|1|4.38→2.65s|3→18|19→9|
|3|plasma|2|4.48→2.76s|15→38|22→10|
|3|laser|1|1.31→0.81s|27→29|22→12|
|3|laser|2|0.81→0.51s|75→55|22→5|

All12 isolated target comparisons are faster. Intro peak enemies fall from up to18/22 to12/14. Some high-level Laser kill totals are lower because the new pacing generates fewer enemies; reduced kill totals in these cases do not indicate increased HP. Wave runs share the initial seed, but changed kill timing affects subsequent loot/random consumption, so they do not guarantee identical later formations.

## Checks

-146 tests across18 files passed. Existing endurance tests retained unchanged in stage-balance.test.ts;13 new pacing tests in pacing-balance.test.ts.
-Checks cover HP/interpolation, stage/mode/boss scoping,45/75 permissions,88.5/92 handoff, symmetry, actual visible first-shot delay, unchanged live HP, and actual Pulse/Plasma/Laser collision damage on standard vs elite/support targets.
-All9 boss reference rows (HP, duration, outcome and peak counts) exactly match the pinned baseline artifact. Core HP remains900/1200/1500; standard-damage bonuses do not apply to commanders/mini-bosses. Stage1 and Endless paths have explicit null guards.
-Playwright browser simulation exercised sectors2/3 through the miniboss, screenshots at12/46/91s. Viewports390x844,320x568 and844x390. No page/resource errors or horizontal overflow. Pause freezes time, Resume advances, miniboss appears.
-No20-minute Endless soak. Actual iPhone/Android gyro, FANTECH controller and human difficulty assessment are not claimed as tested.

## Review

Two-axis review found no remaining blockers. Fixed configured formations being truncated asymmetrically; centralised crossfire and kamikaze movement; comparison now suppresses pickups to preserve fixed loadouts. Existing test filename collision was corrected and prior endurance cases restored before final validation.

## Modified code sections

`src/neon.ts`: GameBalanceConfig/GAME_BALANCE_CONFIG, getStageBalance, standardImpact. Stage indices1/2 refer to displayed sectors2/3.

`src/model.ts`: snapshots balance parameters/group on spawn; scoped wave selection/intervals and visibility grace; the same standardImpact factor applies to projectile damage and Laser damage after existing Evolution/Super scaling.

`src/stage-waves.ts`: optional countOverride preserves the existing callers and generates full-width symmetric Line/V formations for the smaller configured counts.

Reproduce with npm test -- --testTimeout=20000, node scripts/stage-balance-report.mjs and node scripts/stage-balance-playtest.cjs (preview port5176). Evidence: artifacts/stage-balance-comparison.json, stage-balance-browser.json, pacing-sector*.png. Public Site audience and URL preserved.
