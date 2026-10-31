# Evolution Arcade — accepted implementation contract

User-approved plan, 31 October 2026. Baseline:5622be4270fedddb6f2ed9d6c59a5451b948701b (public v9).

## Player and progression

- English mobile-first gyro shooter with three stages, Endless, Practice, 27 cosmetic builds, calibration and controller/manual fallback.
- Run-only EvolutionState: two / five Weapon Orbs reach Level 2 / 3, with 100 / 160 / 230% main firepower. No downgrade on damage. A 0.45s morph gives 0.6s protection without pausing or counting down.
- Supply orbs at 12 / 28 / 48 / 72 / 96 seconds while fewer than five have been collected. Any Weapon Orb refreshes Red Overdrive to 25s. Red main fire intercepts ordinary hostile shots, not giant beams.
- Pulse 1 / 2 / 3 lanes, Plasma 3 / 5 / 7 rounds, Laser gains side beams and width. Preview and battle use the same simulation. Evolved visuals preserve the modular build and add authored equipment layers. No permanent strength or economy.
- Two permanent wingmen, one per side. Repeated pickups upgrade the pair through three levels, then score. Combined DPS approximately 3 / 5 / 8 (middle tuned to4.5). No hitbox or sacrifice; assist forward aiming.

## Threats and EMP

- Enemy caps 10 / 12 / 14, including at most two armored. Boss escorts total two and occupy opposite side slots. Ordinary HP 2 / 2.5 / 3; armored HP 6 / 8 / 10. Warm-up enemies fire visibly, then leave sideways without ramming.
- Core HP 650 / 800 / 1000; turret HP 15 / 20 / 25; mini HP 60 / 75 / 90. Bosses shoot within1.5s and retain fallback fire without turrets. Phase volleys reserve90-unit lower escape sectors. Giant-beam warning1.2s suspends ordinary fire.
- Boss target45–75s with Level2 and wingmen2 at65% tracking. This is a deterministic reference, not human performance; record the actual measurements.
- EMP passive75s, cells5%; clear ordinary enemies, hostile shots, rocks and active beams. No commander or hardpoint damage. Reuse normal one-time kill/reward paths, with no kill-energy refund. Recovery1.2s includes normal fire and orbital locks.

## Visuals and interface

- Bright meteors have baked black/light silhouette contours and pale texture with amber cracks. No thin circles or forecast lines. Decorative debris is smaller and at most8% alpha. Check every theme, color and grayscale, targeting edge contrast>=3:1.
-50ms hit flash with per-target throttle; impact sparks and bounded fragments. Ship lean<=12degrees follows velocity without moving the hitbox. Red low-hull vignette, distinct shield/hull feedback, boss-death shake<=250ms. Reduced Effects keeps information while reducing motion/flash.
- Space Game GUI supplies blank frames/buttons; NULLSIGNAL free supplies progress/status/corners. Bundle its OFL Chakra Petch / JetBrains Mono fonts. SpaceShooterAssetPack supplies authored pixel projectiles/effects. Do not publish source ZIP/PSD packs; disclose NULLSIGNAL's AI-assisted provenance.
- Real loading progress and retry. Separate Game Over, Victory, Practice Complete and Withdrawn. Correct cues and actual score/time/destruction/multiplier/interception stats. Try Again and conditional Next Stage are thumb-accessible.
- Combo thresholds5/10/20 kills yield x2/x3/x5, resetting only on actual hull loss. Apply to enemy/commander kill score.
- Remove spoken announcements, speech and preview controls. Retain nonverbal SFX and EMP activation cue. Stage music Terminal_Dash; boss music ORBITAL BOMBARDMENT, continuous across phases. Independent Music/SFX toggles and volumes in Pause/Settings, with Calibration in Pause.

## Data and acceptance

- RunStats, EvolutionState and WingmanState are model-owned; rewards/events occur once. Reset all powers between runs. New score key preserves old saves; Practice writes no records.
- A short outcome presentation must not allow Pause over Results or override Restart/Withdraw. Resuming has no countdown.
- Current tests plus new rules, both outcomes/navigation,27x3 builds,320x568/390x844/430x932/landscape, three full rounds and20 minutes of rendered browser Endless with real wall time. Label simulated input; physical gyro/controller tests remain separate.
- Publish the existing public site after checks. No IPA/APK packaging in this release.
