# Apex Strikers — clean boss encounter verification

Baseline: `dba210d81b94e74ba4fdb8573f8f9c1d2f3f6e04` (public v15). Desktop browser and model checks performed on 2026-11-01. Approved behavior: [BOSS-REVISION-PLAN.md](BOSS-REVISION-PLAN.md).

## Findings fixed

- Reproduced music silence with the actual AudioDirector and rejected media playback: Terminal_Dash became paused/volume0 while the unstarted boss media had volume0.35. The old same-track guard never retried. Four initial regression cases failed before the playback change.
- Separate Spec/Standards reviews found two additional recovery paths: the confirmed fallback did not resume while boss playback kept failing; repeated unlock during a pending start reset its retry counter. Added failing regressions for both, then fixed with per-track pending/backoff state. Final focused reviews reported no remaining blockers.
- Increasing support caps alone left the observed spawn totals unchanged. Stage waves now stagger a third side support at the same wave clock; Endless retains two. Measured actual admissions below confirm the intended change.
- Removed the plasma/gravity rules together with their rendering, projectile absorption and weapon jam. Removed boss decoys together with retaliation/collision. Real shields, hardpoints and the original Defense Grid slots remain.
- Boss entry atomically purges loose drops with bounded existing explosion effects and one event. It does not collect/reward drops, remove collected powers or purge subsequent supplies during phase changes.

## Automated checks

`npm test -- --testTimeout=20000`: **179 passed, 22 files**. The first full pass exposed one legacy assertion still expecting four Stage1 supports; it was updated to the approved six/three-per-side rule, then the full suite passed.

`npm run build`: TypeScript and Vite production build passed. Existing Phaser chunk-size and mixed static/dynamic pixel-fleet import warnings remain. The Node test environment also emits its existing localstorage-file warning.

Coverage includes failed/delayed/late playback; bounded retry; media readiness; Pause/mute fallback restoration; repeated unlock; interrupted playback; once-only pickup purge; retained/new powers; removed hazards/decoys; actual additional supports; packet emission; hull/armor/shield impacts for all weapons; real escort output; Evolution/Super nonduplication; unchanged miniboss/core/hardpoint damage; reset, existing sensor/controller, save and laser-warning tests. Development outcome fixtures are excluded from progress writes.

## Seeded before/after pressure

Run `node scripts/boss-revision-check.mjs <baseline-checkout>` with the pinned baseline and seed743. These are **model fixtures, not human play**. Packet totals aggregate48 combinations across the three sectors, valid phases, armor/core state and spiral/aimed/ring patterns after the escape-passage filter. All48 maximum projectile speeds match baseline.

| Stage | Boss rounds before → after | Increase | Supports spawned in60s | Peak living supports | Peak hostile rounds in60s |
|---|---:|---:|---:|---:|---:|
| 1 | 168 →209 | 24.4% | 12 →18 | 2 →5 | 36 →43 |
| 2 | 747 →934 | 25.0% | 20 →30 | 4 →6 | 98 →115 |
| 3 | 1,929 →2,421 | 25.5% | 34 →51 | 6 →9 | 244 →304 |

Stage support caps are6/8/10; Endless remains4/6/8. The90-unit corridor, fan endpoints, beam warning1.2s and object limits remain. Stage3 friendly enemy/shield impact is1.2 times the previous value, applied once; minibosses, core/hardpoints and Endless are excluded. [Raw measurements](artifacts/boss-pressure.json).

## Browser evidence

The browser used the production rendering/audio paths with **development shortcuts to capital entry and a simulated pilot in Practice**. These are not full human stage playthroughs or physical-device gyro tests. The shortcuts start with Level2 and escort2; subsequent dropped orbs are normal gameplay. All three commanders were defeated through their normal patterns after the entry shortcut: approximately56.3s /81.4s /83.0s of combat. These timings are observations from this fixture, not a fixed balance guarantee.

- Stage1: phase2 observed with battle music confirmed playing at36.58s. [Combat/audio clip](artifacts/boss-revision-stage1.webm).
- Stage2: phase2 observed at42.42s of continuing boss music, without phantom copies. Pause→Resume tested. A12-second recording with **SFX muted** contains actual BGM: mean−24.2dB, peak−11.9dB. [Music-only clip](artifacts/boss-revision-stage2-music.webm), [screenshot](artifacts/boss-revision-stage2-390.png).
- Stage3: phase3 observed at68.29s of continuing battle music; subsequent Rage and defeat of the boss recorded. [Rage/music clip](artifacts/boss-revision-stage3-rage.webm), [screenshot](artifacts/boss-revision-stage3-390.png).
- Loose-drop entry shatter inspected in [entry clip](artifacts/boss-revision-entry.webm). New drops remained available afterward.
- Forced ending fixtures exercised Victory and Game Over independently, including Reduced Effects; these outcomes are not claimed as human wins/losses. [Victory clip](artifacts/boss-revision-victory.webm), [Victory screen](artifacts/boss-revision-victory-390.png), [Game Over screen](artifacts/boss-revision-defeat-390.png).
- Retry returned to Preflight and launched correctly. Next Stage after a Stage1 victory opened Orbital Convoy Preflight. No captured browser warnings/errors at the final local check.
- Combat/Pause layout checked at320×568,390×844,430×932,844×390 and1280×800: no horizontal overflow or visible product buttons below44px. Development QA controls are excluded. [Measurements](artifacts/boss-responsive.json), [Pause screenshot](artifacts/boss-revision-pause-390.png). The compact fonts were not changed.

Clips capture the Phaser canvas and game audio, excluding DOM HUD/menus. Full-page screenshots include the developer QA rail; production does not load that rail. Clips are12-second wall-clock recordings; browser simulation time can be throttled when occluded. Sampled desktop QA p95 frame intervals included14.1–27.7ms during concurrent tooling; these are not controlled mobile performance benchmarks or a60FPS guarantee.

## Architecture and delivery

MusicPlayback concentrates desired/confirmed playback, retry and cancellation behind AudioDirector's existing interface; browser/fake media are adapters. Encounter entry keeps cleanup policy and its one-time event together inside GameModel. This provides locality and test leverage without a generic new boss framework. The self-contained before/after architecture report was written and opened in the OS temporary directory as `architecture-review-apex-20261101-141006.html`.

No new generated imagery, voice announcements, font changes, save-key changes or sensor/mapping migrations. The20-minute Endless soak was intentionally omitted. Physical iPhone/Android gyro, physical controllers and the exact original desktop playback trigger remain unverified; normal desktop playback and simulated failure recovery are separate evidence.

Publication uses the existing GitHub repository and public URL after checks. Any remaining hardware-specific audio issue should be investigated with its actual browser/device trace rather than treating these desktop fixtures as hardware proof.
