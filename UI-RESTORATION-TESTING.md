# Apex Strikers — restored UI verification

Reference: bc04469e3a05ddeb6e94a126175b4ed6336e86e8, before Portrait simplification. The retained Portrait combat/lifecycle changes remain; this restoration changes only UI/entry policy. Android packaging is on hold pending user review.

## Checks
- Full suite:26files /189tests passed. New queued-entry tests were first observed failing, then passed after EntryIntent implementation. Focused draft/launcher/lifecycle tests:5files /12tests passed. TypeScript and production Vite build passed.
- Restored Start→Home→Missions→Preflight→Launch; Return to Start Cancel/Confirm and re-entry checked. EntryIntent queues an early tap once; the initial Start does not reset it. Duplicate entry and repeated Launch are guarded; actual flight asset errors retain Retry. Slow/error gate regressions are automated; no claim that a browser network-failure session was recorded.
- Hangar Save, Discard, rotation/reset, L1/2/3 firing preview checked. Draft changes do not immediately save. Indirect Hangar→Settings→Battle exit shows Discard confirmation; cancellation and Back preserve the draft.
- Hangar weapon choice appears in Missions; Missions choice appears in Preflight; Preflight selector uses the same setter. Existing run loadout remains frozen.
- Pause→Settings→Back, Resume, Restart Cancel/Confirm, Quit and withdrawn results checked through browser UI. Pause music volume keyboard adjustment35→40% appeared in Settings and remained40% on returning to Pause.
- Restored full results and Ship action tested. Ship opens the Ship tab and returns to Results. Simulated Victory exposes Next; Next opens Sector3 preflight. Simulated defeat shows GAME OVER, while the practice boss run shows PRACTICE COMPLETE. These QA fixtures do not write progression and are not human boss completions.
- Short normal Sector2 run with keyboard/touch source was exercised and withdrawn at18.9seconds (6kills). Physical gyro/controller behavior was not retested.

## Responsive evidence
Missions and Home measured at320×568,360×800,390×844,430×932,844×390: no horizontal overflow or visible production button/select/range under44px. Preflight, battle, Pause, Settings and Results additionally checked at320px. Landscape combat and Pause use the portrait9:16 field and scrollable dialog; only development QA buttons are smaller than44px. Menus scroll; battle does not. Screenshot evidence is artifacts/restored-*.png, geometry is artifacts/restored-ui-metrics.json.

Chakra16px body/buttons,14px secondary; Mono20px score. MGS only logo/headings36/24,32/22 narrow. Functional HUD text is at least14px; QA-only controls intentionally retain9px. Home ship canvas reserves space for its caption; rotation controls no longer overlap the Hangar caption.

## Scope and review
Spec review found undersized residual HUD text and an indirect draft-exit bypass; fixed and focused rereview passed. Standards review found repeated short-screen style rules; removed and rereview passed. Browser flow testing found Results Ship opened Weapon; corrected to Ship and verified. AppSession, sensor readiness, music recovery and score settlement remain intact.

Combat source hashes retained from the pre-restoration working state: neon.ts c866f70fa2123fcbd0f4316235ab5fe65912ae36722a4fd4cb10ce4a758f57d2; model.ts b50b98703d96dbf3b8d673b710146d03a061cfa3a1678028036107af08b68059. No drop/Supply/boss tuning edits in restoration.

## Limits and delivery
No APK build, Capacitor sync, installation, upload or prerelease was performed in this restoration. Earlier APK files are retained and do not represent this UI. No20-minute Endless soak. No physical iPhone/Android gyro or real-controller pass claimed. Existing Phaser bundle-size warning remains. Developer QA outcome captures are explicitly simulated; UI screenshots do not establish physical-device performance.

Final Controller Lab320px check: no overflow or undersized production controls; actual no-controller status remained truthful. Controller Lab→Settings→Home→Start returned correctly. Browser console errors: none observed.
