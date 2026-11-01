# Apex Strikers — Tactical Neon verification

Baseline: `8f55145af09991084c0a17718824aa41d467a1a7` (Wenrexa launcher). Tested on the local Windows desktop/browser on 2026-11-01. This report covers the Tactical Neon implementation and the final compact-font correction.

## Delivered behavior

- Shared tactical materials and MGS Codec/HUD/Ammo typography across Start, Flight Deck, Hangar, Missions, Preflight, Records, Settings, Controller Lab, combat HUD, Pause and Results.
- Final font optical adjustment is 150%, reduced from the first 200% implementation after the user's overflow feedback. Secondary text is 14px, ordinary controls 14–16px, navigation icons stack above labels, and Results no longer inherit the old decorative stat frame. Touch targets remain at least 44px.
- A shared menu star/planet canvas, ship engines and bounded interface motion; Reduced Effects/system reduced motion suppress nonessential motion. Battle effects use simulation time and keep the fixed ship hitbox.
- Laser warning tiles and local exclamation marks use the same geometry as collision. Repeating artist-derived beam segments, head/tail caps and bounded visual pools replace stretched projectile images. Charge/fire/stop cues are keyed per beam. Pause and mute cancel active sound without replaying it on resume.
- Purple decorative Super/escort lines have been removed; selected escort textures use cyan highlights. Functional hazard boundaries remain visible. Existing combat balance, save keys, sensor permissions and mappings are retained.

## Checks

| Check | Result |
|---|---|
| `npm test -- --testTimeout=20000` | 153 tests passed in 21 files |
| `npm run build` | Passed TypeScript and Vite production build |
| Laser presentation tests | 1.2-second warning boundary; once-only events; EMP/removal/reset; repeated paused reads; straight/sweep geometry |
| Laser audio test | Charge replaced by fire; stop/pause/mute cleanup; no resume replay; synthesis fallback |
| Final responsive menu matrix | 35 cases: 7 routes × 5 viewport sizes, no page overflow, undersized visible buttons or clipped control labels |
| Final Results matrix | 5 viewport sizes, same checks passed |
| Browser presentation | Start/menu/Hangar/Settings, HUD/Pause/Results and warning/straight/sweeping beams inspected; screenshots and clips linked below |
| Spec/Standards reviews | Separate reviews completed; reported title-drag, Results portrait, fallback typography and Controller badge issues corrected |

Responsive sizes: 320×568, 390×844, 430×932, 844×390 and 1280×800. The seven menu routes are Flight Deck, Hangar, Missions, Preflight, Records, Settings and Controller Lab. Scrollable menus are allowed to scroll vertically; controls must fit their own width. Machine-readable evidence: [menu matrix](artifacts/tactical-responsive.json), [Results matrix](artifacts/tactical-results-responsive.json).

The production build retains the existing large Phaser chunk warning and the existing mixed static/dynamic pixel-fleet import warning. These do not fail the build.

## Balance regression and timing

`node scripts/neon-balance.mjs` was compared with the pinned baseline using the same inputs. All nine result rows matched exactly, including boss duration, HP and object counts. This is a simulation, not human play or a hardware gyro test.

| Stage | Pulse | Plasma | Laser |
|---|---:|---:|---:|
| 1 | 69.9s | 69.3s | 65.4s |
| 2 | 98.5s | 111.8s | 74.25s |
| 3 | 101.4s | 117.35s | 95.1s |

Menu frame samples were warmed, asset-ready, on the same machine at 390×844 with one game tab running at a time. The baseline checkout only received the same visible frame instrumentation; gameplay/assets were unchanged. Earlier loading/contention samples were discarded.

| Desktop browser rAF interval | Baseline | Remake |
|---|---:|---:|
| Median | 6.9ms | 6.9ms |
| p95 | 7.2ms | 7.1ms |
| Frames sampled | 1,800 | 1,800 |

This is an observed desktop menu frame interval, not a GPU benchmark, a statistically significant speed improvement, or a mobile 60 FPS guarantee. Evidence: [frame samples](artifacts/tactical-frame-times.json).

## Visual evidence

- [Before: menu](artifacts/tactical-before-menu-390.png)
- [Start](artifacts/tactical-start-390.png), [Flight Deck](artifacts/tactical-home-390.png), [320px Flight Deck](artifacts/tactical-home-320.png)
- [Hangar](artifacts/tactical-hangar-390.png), [Missions](artifacts/tactical-stages-390.png), [Preflight](artifacts/tactical-preflight-390.png)
- [Records](artifacts/tactical-records-390.png), [Settings](artifacts/tactical-settings-390.png), [Controller Lab](artifacts/tactical-controller-390.png)
- [HUD](artifacts/tactical-hud-390.png), [Pause](artifacts/tactical-pause-390.png), [Results](artifacts/tactical-results-390.png)
- [Menu clip](artifacts/tactical-menu-preview.webm): silent screen capture; capture frame rate is separate from the rAF measurements above.
- [Laser clip with audio](artifacts/tactical-laser-audio.webm): 12-second **developer presentation fixture**, not a natural boss balance run. It keeps the target alive and schedules straight/sweep beams to verify rendering and sound. Recording captures the Phaser canvas and game audio, excluding the DOM HUD. [Warning frame](artifacts/tactical-laser-warning.png), [fired frame](artifacts/tactical-laser-fired.png).

## Asset provenance and limits

Only selected runtime files are included. Original ZIP/PSD packs and Thunder Strike resources/code are not shipped. MGS1 font binaries are unchanged and ship Andrew Gleeson's CC BY-SA 4.0 license/credit. Laser2020 derivatives use Wenrexa's CC0 material. Escort recolors retain the source artist's game-use terms. See `public/ASSET-CREDITS.txt` and `public/assets/tactical-remake/` for manifests and recipes.

The provided Sci-Fi Weapons pack disclosed AI-generated samples in its README, so it was not sampled. The two new nonverbal laser WAVs are deterministic original oscillator/noise synthesis with reproducible scripts. No speech announcements or new generative imagery were added.

Actual iPhone/Android gyro, physical gamepad input, speaker output and mobile GPU performance remain unverified in this desktop pass. Existing sensor/controller tests and simulated UI checks do not establish hardware success. The 20-minute Endless soak was intentionally omitted at the user's request. The development QA fixture and controls are excluded from production.
