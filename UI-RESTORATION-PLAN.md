# UI restoration — approved scope

Reference bc04469e3a05ddeb6e94a126175b4ed6336e86e8 before Portrait simplification. Restore Start→Home→Play→Missions→Preflight→Launch and Return to Start, original materials/ship animation, Home actions and noncombat bottom navigation.

Restore Hangar rotation/reset, draft Save/Discard and open L1/2/3 firing preview; mission weapon selector, boss/weakness/threat/status; preflight summary/weapon/control/sensor/Center/Controller Lab; boss HP/phase, orb/evolution/escort and temporary power numbers; Pause full-width Resume, calibration/toggles/volumes/Settings/Restart/Quit; full results stats and Retry/Next/Ship. Settings/Records/Help/Controller Lab remain functional. Short labels and one-sentence descriptions; detailed instructions remain in Help/Advanced.

Chakra Petch16px body/buttons,14px secondary, JetBrains20px score. MGS only logo/headings at36/24px (32/22 narrow). Targets44px minimum. Menus scroll; 9:16 battle does not. Canonical typography/layout remains in tactical-theme.css, navigation in main.ts; no blind file revert.

Preserve current combat/balance/drop/save/audio/lifecycle fixes and all Android source. APK work is on hold: no Gradle build, Capacitor sync, installation, upload or prerelease until the user reviews the restored web and explicitly resumes APK work. The previous APK is not this restored-UI version.

Verify full routes, drafts/rotation, synced weapons, Start/Launch repeated input/loading errors, Pause/Resume/Restart/cancel, outcomes, sensors/lifecycle/audio;320×568,360×800,390×844,430×932,844×390. Full tests, web build, Spec/Standards, screenshot evidence, push GitHub and publish the existing public URL. No20-minute Endless.
