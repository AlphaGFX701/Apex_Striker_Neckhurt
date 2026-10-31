# Stage 2/3 smoother arcade pacing

Baseline:76943cdcf6e49b8012ce819d50106a2707c8fcba. Approved user plan in current chat.

- Standard HP stage2:5.85/6.3/6.75, stage3:7.8/8.4/9 for intro0–30/mid30–75/late75–120. Blend numeric parameters across five seconds at phase entry. Snapshot new-spawn stats; never heal existing entities.
- Standard hull impact bonus: Pulse1.1,Plasma1.2,Laser1.05. Shared projectile/beam routing, applied once after Evolution/Super. Do not affect elites, commanders, mini-bosses or boss supports. Stage1 and Endless retain prior behavior.
- Cadence2:1.2/1.6/2;3:1.6/2.8/4. Spawn intervals2:3.2/2.8/2.5;3:2.8/2.3/2. Enemy caps2:12/16/18;3:14/18/22. Intro wave sizes5/6. Intro projectile speed90% existing; blend back to normal in mid. Delay first shot for0.5 actually visible seconds.
- Intro Line/V only, no armor/kamikaze/homing. Mid Arc/Zigzag/Crossfire; armor/rear homing start45seconds; maxone armor before75, then two. Normal formations continue through bottom. No wave spawns88.5–92 at miniboss handoff; clocks and shooting remain active.
- Central GameBalanceConfig owns HP, movement/projectile scales, spawn intervals/caps/counts, cadence, score and permissions. Scope explicit through standard/elite/boss-support groups. No drop or score formula changes.
- Compare pinned baseline/current with same seed743, all3weapons Levels1/2: isolated kill time,30second kills and remaining/peak enemies. Validate unchanged bosses, boundary/pause/reset/calibration/controllers, browser mobile intro through miniboss, then build and publish original public URL. No20minute Endless soak; physicalgyro results remain separate.
