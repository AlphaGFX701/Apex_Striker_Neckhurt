# Portrait Mobile & Android Test APK — approved scope

Supersedes earlier menu/balance plans only where stated. Baseline bc04469e3a05ddeb6e94a126175b4ed6336e86e8. Preserve save keys, controls and current combat rules.

## UI
- One home screen: selected ship, Apex logo, Play; secondary Ship/Settings, Records inside Settings. No separate Start or full-screen loader. Early Play queues once while runtime imports.
- MGS HUD only logo/headings at125% optical size. Chakra14px UI, secondary12px, JetBrains18px score. Logo32px, headings22px. Canonical typography in tactical-theme.css;44px touch targets.
- Concise sector cards; one shared weapon selector in Hangar. Ship/weapon choices save immediately, no Save/Discard. Preflight shows control, actual sensor status, Center and Launch.
- Compact HUD and external Warp/EMP controls, no repeated READY. Pause: Resume, Center, Music/SFX and Quit; full tools in Settings. Results: Score/Time/Kills, Retry/Next, other stats in Details.
- Portrait320×568,360×800,390×844,430×932 and landscape fallback. Preserve Settings Apply/Discard and Controller Lab.

## Preboss balance (zero-based config sectors1/2)
- Sector2 intervals2.46/2.15/1.92, caps14/18/20, unchanged HP5.85/6.3/6.75.
- Sector3 intervals3.50/2.88/2.50, caps11/14/18, HP6.63/7.14/7.65, armor27.2 and shield proportional to it.
- Existing5s ramps and wave sizes/patterns unchanged. No live-entity healing. Preserve Stage3 friendly damage1.2 exactly once.
- Do not alter any drop chance/weights/guarantees, Supply Orb32/78/124/170/216, Stage1, bosses/minibosses/supports or Endless.

## Android
- Capacitor8.5.3, App plugin8, appID com.mjadsakul.gyrospacelab; version1.0.0-test.1, debug direct-install APK, Android7/API24+.
- JBR21 only per-build environment; SDK36, AGP8.13, Gradle8.14.3. Portrait game category, own Apex icon; all web assets/music/fonts bundled, no server.url.
- AppSession interface consolidates browser/native lifecycle, pause/input/audio and Back; explicit Resume with sensor readiness. Home Back confirms native exit, menu Back navigates, flight Back pauses.
- Keep APK outside public/dist/source. Browser localStorage does not automatically transfer to native WebView.

## Acceptance/delivery
- Regression tests plus seeded before/after3weapons×Level1/2: arrivals, occupancy, kills, lifetime/HP; hash unchanged drop method. Boundaries30/75/90/120, retained systems covered.
- Browser flow/screens, Settings/focus/touch, load/errors, native lifecycle/Back, offline cold start and emulator motion distinct from physical Gyro.
- Full tests, build, Spec/Standards reviews. No20-minute Endless. Publish same GitHub/public URL and prerelease APK Apex-Strikers-1.0.0-test.1.apk with SHA256.

## User steering during implementation
- Restore the fuller previous Flight Deck composition (Personal best, Hangar/Records and brief flight hints), while retaining one entry page and small readable fonts.
- Add brief explanations rather than empty surfaces. Resume becomes a full-width primary action; secondary audio/Center/Quit remain separate. Preserve readiness checks and instant0.6s protected resume.
