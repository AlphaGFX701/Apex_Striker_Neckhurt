# Portrait Mobile & Android Test APK — verification

Baseline: bc04469e3a05ddeb6e94a126175b4ed6336e86e8. Version1.0.0-test.1, applicationID com.mjadsakul.gyrospacelab. User steering during implementation restores the fuller Flight Deck and adds short explanations/full-width Resume; no separate Start page is restored.

## Automated checks
- Full Vitest suite:25files /187tests passed. Final focused lifecycle/loading/balance suite:4files /10tests passed. TypeScript and Vite production build passed.
- New regressions: initial hidden/native activity, delayed native query race, deduplicated browser/native interruption, explicit return policy, Stage2/3 interval/cap/HP exclusions, actual armor hull/shield spawn.
- Existing tests retain boss/miniboss/support/Endless, stage boundaries30/75/90/120, shield/damage/evolution, sensor/pad/music/save/result behavior.
- Spec review found a dead Pause Settings handler, unseeded initial activity, and hidden preflight Center. All fixed and focused rereview found no remaining blockers. Standards rereview found no remaining blockers.

## Deterministic combat comparison
scripts/portrait-balance.mjs compares the pinned baseline and current model using6seeds ×3weapons ×Level1/2 ×2sectors,120simulationseconds each. Tracking follows an enemy65% of samples. Practice prevents death; collected items are removed in the harness to hold loadout constant. This is simulated input, not human/phone evidence. Lifetime-to-kill includes approach time and is not a stationary weapon DPS test.

| Sector | Version | Arrivals | Kills in30s | Kills in120s | Mean on screen | Mean lifetime to kill |
|---|---|---:|---:|---:|---:|---:|
|2|Before|180.33|30.61|109.97|7.87|4.18s|
|2|After|232.78|37.86|125.50|10.52|4.28s|
|3|Before|236.44|33.92|117.00|10.94|4.59s|
|3|After|185.42|32.39|117.50|7.92|4.25s|

Sector2 arrivals increase29.1% in combat; Sector3 decrease21.6%. The earlier no-fire planning probe gave31.3%; actual combat changes occupancy/cap pressure. Raw per-seed rows are artifacts/portrait-balance.json. Stage2 HP unchanged; Stage3 standardHP6.63/7.14/7.65, armor27.2/shield9.52. Bosses/supports/minibosses and Endless remain excluded; Stage3 impact1.2 remains once.

Complete destruction/drop method before/after SHA256 (normalized line endings):56d9dad237c1b3c79259c9a1e2be776fb94b93c652ee19ee2e71ed6bd03631bb. Identical chance, item weights and guarantee; Supply32/78/124/170/216 unchanged. More kills can naturally produce more drops; no compensating drop nerf was applied.

## Browser UI checks
- Home, auto-saved ship/weapon, Missions, Preflight/Launch, battle/Pause/Resume, Pause Settings/return, withdrawal/results and Retry checked via browser controls. Selection survives reload; home label now reflects saved ship before artwork finishes.
- Unsaved Settings Back displays discard confirmation. Full settings and Controller Lab retained. Reduced Effects remains supported.
-320×568,360×800,390×844,430×932 and844×390 home geometry: no horizontal overflow, no visible button below44×44. Screenshots cover compact missions, settings, battle, results and redesigned Resume. Menus may scroll; combat does not.
- Resume is a full-width56px primary action with brief explanation. It checks app/control readiness, clears input and resumes instantly with0.6s protection. No countdown. Stale/closed/result-state calls are ignored.
- Browser manual sample was a short Sector2 touch/keyboard run; seeded model comparisons cover120s. This is not a claim that a human completed every boss on a phone.

## Android build and evidence
JBR21 per-process; SDK36, AGP8.13.0, Gradle8.14.3; minSdk24 / target36. Debug signing verified with apksigner. Game category and portrait manifest set; Apex icons generated from the project's own mark. APK is outside public/dist, contains local music/images/fonts and no remote server URL. APK embedded main bundle and index byte-match production dist.

APK: Apex-Strikers-1.0.0-test.1.apk
SHA256: f57590f605a10e8250e5bf75bcd245642eb516718f9c43386afb854c98e3a984

Pixel_7 Android Emulator (API37 x86_64) installation and launch succeeded. WebView received emulator tilt, Center succeeded and motion flight launched. Stopping sensor updates produced the expected paused/stale-motion state. These are emulator sensor values, not a physical gyro result. Final offline/lifecycle checks are recorded below after the final install.

## Limits
No20-minute Endless test. No physical Android/iPhone gyro or real controller result claimed. Android7 compatibility is declared by minSdk24, not tested on an Android7 handset. Emulator/software graphics timing does not establish phone60FPS. Vite reports the existing large Phaser bundle warning; native Gradle reports template flatDir warnings. Browser saves do not automatically transfer to the app origin.

Final native cold-start/offline interaction verification was interrupted by the user's physical Escape stop. Network settings were restored. Final APK installation succeeded and embedded assets byte-match dist, but final offline/Back/foreground UI checks are incomplete. Source publication and GitHub prerelease are not yet performed.
