# Apex Strikers Android test.2 verification

Date: 2026-11-01. Baseline: 16a929737be6d45a3de9a37b0f7557895789997a.

## Change

Removed only the interior 10% black rectangle at (35,160,320,WORLD.height-160) from ParallaxEnvironment. The full-field atmospheric color, planets, stars and scrolling layers remain. No combat balance, restored menu, font, controls, save key or application ID changed.

Android app icon and splash now use the approved imagegen neon fighter. Original art, separate adaptive layers, full prompt and provenance are in assets-source/app-icon. The preparation script fits visible artwork inside the Android safe circle and emits legacy, round and five-density adaptive resources. This is an explicitly requested AI-generated native icon; gameplay artist assets are unchanged.

## Automated and package results

- Regression reproduced the exact interior rectangle before the fix, then passed after removal. It executes the real renderer through a scene drawing port for all three stage indices, all four atmosphere segments, transition/reset times, and both Reduced Effects modes. It verifies geometry; it is not a pixel screenshot comparison.
- Vitest: 27 files, 190 tests passed. TypeScript check and Vite production build passed.
- Android: Capacitor sync followed by Gradle :app:assembleDebug passed with Android Studio JBR 21. SDK 36, minSdk 24, AGP 8.13, Gradle 8.14.3.
- APK assets: all 953 dist files byte-match assets/public in the final APK, including the restored UI, music, fonts and artist textures.
- Version: 1.0.0-test.2 / versionCode 2, application ID com.mjadsakul.gyrospacelab.
- apksigner verified the APK. Signer certificate SHA-256: 3f2f53e4497be4c040b416ef090838708f9183f1dd9000577e00d18f980bc91e, identical to test.1.
- APK: 38,611,438 bytes. SHA-256: 278a1b4ebab55e49accdf220b7b6ef6ea287543643e6e3a9177e0d04c8701b35.
- Read-only Spec and Standards reviews found no blocking issues. README dependency/provenance wording was corrected following review.

## Observed browser / emulator results

- Chrome, portrait 390x844: Start, Main Menu, Missions, Preflight, simulated Stage 1 boss battlefield, Pause/Resume and exit to results were exercised. Boss battlefield screenshot shows continuous space imagery without the interior rectangle; projectiles remain visible. This was a QA fixture, not a physical gyro run.
- Pixel_7 API 37 x86_64 emulator: installed test.1, selected Atlas, then installed test.2 using adb install -r without clearing data. Atlas remained selected after update and after cold restart. Version 2 was confirmed by Android package metadata.
- Emulator Wi-Fi and mobile data were disabled for a cold launch. Start, restored Main Menu, Missions, Preflight and a normal Stage 1 battle loaded from bundled files. Touch selection was accepted; dragging and releasing triggered the expected Touch released Smart Pause. Resume progressed the run without a countdown. Game Over and Retry/preflight worked offline.
- Android Back during a second run displayed Pause; Resume returned to active gameplay. Evidence is in artifacts/apk2-offline-android-back.png and artifacts/apk2-offline-battlefield.png.
- New fighter splash was observed on cold launch. Density/round/square output and adaptive layer geometry were inspected. Native launcher mask check is recorded with the app drawer evidence.
- Android reported the game as the last audio playback owner; no application playback/crash errors appeared in the bounded console check. Browser boss music diagnostic advanced in PLAY state. This verifies playback paths, not a listening-quality comparison or exhaustive device audio test.

## Limits

The Chrome debugging connection detached during further stage navigation. All three stages/themes and Reduced Effects are covered by the renderer regression; this session does not claim fresh screenshots of every stage boss/normal combination or a full human playthrough of each stage. The emulator uses software graphics and is not a reliable 60 FPS measurement. Physical iPhone/Android gyro and controller tests remain pending user testing. No 20-minute Endless test was run, as requested. Existing Vite large-chunk warnings remain unchanged.

APK is a debug-signed personal test build, not a Play Store release. An existing installation signed by a different key cannot update in place; the provided test.1 and test.2 signatures match. Browser saves do not automatically migrate into Android storage.
