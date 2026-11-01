# Apex Strikers — Wenrexa Mobile Launcher

Implement the user-approved Start → Main Menu → Play → Stage Select → Preflight → Launch flow. English, local-only preferences and scores, Gyro primary, no authentication. Use selected Wenrexa CC0 PNGs for noncombat menus only (void/cyan/crimson), with existing Chakra Petch and JetBrains Mono. Preserve balance, HUD, Pause, Results, save keys and actual Controller Lab behavior.

First screen must render without Phaser or flight assets. Load them asynchronously in background, expose real progress/error/Retry near Launch, gate only launch and reject duplicate starts. Main Menu shows selected ship and personal best. Restyle Missions, Hangar, Preflight, Records, Settings. Start has no navigation; Return to Start confirms and stops music without clearing data.

Audio/Controls/Display tabs: draft general preferences with Apply and discard confirmation on every exit. Permission/calibration/fullscreen are explicit immediate commands. Music/SFX values sync to retained Pause. Nonverbal click/open effects respect SFX switch. All buttons semantic, keyboard/controller friendly, 44px minimum. Scope assets/styles to menus. Respect reduced motion/safe areas.

Verify existing tests plus readiness/draft/navigation cases, slow/error load, repeat clicks, settings persistence/discard, control setup, pause/audio sync, 320x568/390x844/430x932/844x390/desktop. Report simulation separately from hardware; no Endless 20-minute run. Publish same URL and GitHub after checks.
