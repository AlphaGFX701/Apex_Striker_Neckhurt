# Wenrexa Mobile Launcher — verification

Date: 2026-11-01 (Asia/Bangkok). Baseline: d03fdda, public v13.

## Delivered
- Start is static semantic HTML; bootstrap JS is approximately 2.5 kB minified and dynamically imports the Phaser application. No full-screen Preparing the fleet loader.
- Selected Wenrexa CC0 button, angled button, panel strip/title, back arrow and slider PNGs are local. No sample logo, source ZIP/PSD, generated image, account or economy.
- Start / Flight Deck / Hangar / Missions / Preflight / Records / Audio-Controls-Display settings share scoped cyan materials. Combat HUD, Pause, Results and balance remain baseline.
- Real asset progress and error/retry live next to Launch. Scene + ship art are both required; ready assets never auto-launch a round.
- General preferences are drafts; Apply persists using existing audio/control keys. Display/haptics adds apex-launcher-display without changing prior keys. Discard confirms on Back/Escape/navigation/controller Back. Permission/calibration/fullscreen remain immediate commands.

## Checks
- `npm test -- --testTimeout=20000`: 148 passing tests in 19 files, including asset-readiness and preference draft/Apply/discard tests.
- `npm run build`: passed. Existing large Phaser chunk and mixed static/dynamic pixel-fleet import warnings remain.
- `git diff --check`: passed.
- Browser: Start → menu → Missions → Preflight → Launch → Pause. Applied Music=false was visible in retained Pause, and remained false after reload.
- Browser: dirty form → Back → Cancel preserves draft; Back → Confirm discards it and returns to Hangar. Keyboard Left/Right selects Settings tabs.
- Return to Start Cancel/Confirm verified. Repeated Start double-click initially fell through to Play; a capture guard fixed it, and retest stayed on Flight Deck. Launch also rejects requests outside ready Preflight.
- Applied Reduced Effects: computed menu-arrive, flagship float and dust animation names all `none`.
- Slow-load fixture delays one flight texture 12 seconds: menu and stage selection worked, Launch disabled with real 87% progress. After completion Launch enabled, still on Preflight.
- Error fixture returns 404 for one flight texture: menu remained usable, error/Retry visible, Launch disabled even after other files completed. Retry reloaded to actionable Start.
- Normal local browser error log was empty. Expected missing-texture error belongs only to the error fixture.

## Responsive results
All six routes Home/Hangar/Missions/Preflight/Records/Settings checked at all five sizes below: **30 combinations, zero horizontal overflow, zero visible buttons below 44×44**. Menus may scroll vertically.

| Viewport | Result |
| --- | --- |
| 320×568 | Pass; title/best-score overlap corrected, secondary menu actions remain visible |
| 390×844 | Pass |
| 430×932 | Pass |
| 844×390 | Pass |
| 1280×800 | Pass |

Machine-readable geometry: artifacts/launcher-responsive.json. Before/after screenshots: artifacts/launcher-before-*.png and launcher-start/menu/hangar/settings-390.png, plus menu at other widths and load-error/slow evidence.

## Reviews and limits
Spec and Standards reviews ran separately. Resolved: controller settings focus/adjustment and modal-first Back; mobile Results typography scope; Reduced Effects menu transitions. Both reviewers rechecked with no unresolved blockers.

Browser interactions used mouse/keyboard through the browser tool; controller adapter and gyro tests remain automated simulations. Controller menu changes were code-reviewed; no physical FANTECH, iPhone motion, Android motion, haptics or Safari fullscreen compatibility claim is made. No 20-minute Endless test. Existing speech-free sound and stage/boss tracks are unchanged; new short UI tones respect SFX.

Reproduce loader checks after build: `node scripts/launcher-load-fixture.mjs error 5178` or `node scripts/launcher-load-fixture.mjs slow 5179`. These local-only servers never ship QA hooks into the game.
