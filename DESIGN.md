# Apex Strikers — Neon Onslaught design system

## Product and visual direction

English portrait mobile gyro arcade shooter. Tilt through readable fleets, collect orbs and visibly evolve into a powerful fighter. The ship stays central: a large artist-authored pixel fighter in the hangar, the same crisp fighter in battle. Cyan identifies player systems, amber identifies rewards and primary emphasis, red identifies danger. Red Overdrive is an explicitly labelled exception. Backgrounds stay dim behind projectiles. No placeholder shops or social routes.

No new generative imagery. NULLSIGNAL is a provided AI-assisted UI kit; disclose that provenance rather than claiming every asset is AI-free.

## Canonical token ownership

`src/style.css` owns tokens. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #A1B3C5; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB. Radius 5px. Chakra Petch handles headings and body text, JetBrains Mono handles numeric readouts. Artist sprites retain authored texture and material.

## Screens and interaction owners

Static semantic markup belongs to screens.ts. Main owns navigation and modal lifetime; Controller Lab owns observed input. Shared buttons, panels, tabs and states live in one stylesheet. Space Game GUI supplies blank material frames and buttons; NULLSIGNAL supplies progress, status and corner details. Text remains HTML. Do not embed Ethnocentric software from a readme link; use the bundled OFL fonts.

Title leads to Play, Hangar or Settings. Main navigation is Hangar / Battle / Records and disappears during combat. The hangar selects one of three free equal-stat pixel ships: Falcon, Raven or Atlas. Ship and weapon choices save immediately. All stages and main weapons are available. Evolution is run-only. Pixel records use gyro-pixel-progress-v1 and ship selection uses gyro-pixel-loadout-v1. The earlier modular save and record archives remain untouched.

## Combat layout and input

The field is 390 by 693.333 logical units, fitted without stretching. Bottom Warp / EMP controls sit outside the field. Score, time and Pause stay at the top. One boss HP bar displays the active commander. Three hull segments, a separate shield badge and wingman level occupy the lower edge. Centered hitbox radius remains six units regardless of cosmetic equipment.

Only the active input source controls flight. App loss, stale motion, controller loss and orientation changes pause and clear transient input. Orientation changes require calibration. Touch Smart Pause follows only the movement pointer. Menus must receive native keyboard input without Phaser capturing range-slider arrows. Resume gives 0.6 seconds of protection without a countdown.

Pause and Settings share Music/SFX toggles; volume controls stay in Settings. Calibration is available in Pause for motion input. Game Over, Victory, Practice Complete and Withdrawn are distinct outcomes. A short visual outro cannot reopen Pause or overwrite Restart/Withdraw navigation.

## Evolution and combat rules

Two / five orbs produce Level 2 / 3 with added physical equipment at a common image anchor. Main firepower is 100 / 160 / 230%. The 0.45 second morph never pauses combat and grants 0.6 seconds of grace. Weapon Orbs refresh Red Overdrive to 25 seconds even after maximum evolution. The hangar firing range uses GameModel rules and the same composed ship art.

Wingmen are a permanent pair, one on each side, with three gun levels. They have no hitbox and never act as disposable armor. Shield precedes hull. Five / ten / twenty kills yield x2 / x3 / x5 kill score; only actual hull loss resets the chain. Rewards and stats settle once.

DifficultyProfile owns HP, cadence and caps: ordinary HP6/9/12, armor16/24/32, core900/1200/1500, caps14/18/22, supports4/6/8, cadence1/2/4 and phases2/3/3. All commanders gate their cores behind destructible turrets. Phase boundaries clamp overflow without healing and rearm only after the warning. Exposed-core vulnerability is1/1.2/1.8 to target60–120 seconds at Level2/escort2 with65% tracking. Final-sector Rage begins below20% and doubles packet density. Packets use reachable90-unit corridors, not a permanent safe edge; packet ownership prevents escorts from starving commander attacks. Ordinary formations attack then fly through the bottom edge. Kamikaze, shield wall, rear-gunner and side-crossfire have distinct roles.

At max wingman rank, another pickup refreshes Super to five seconds. All friendly weapons deal double damage once and intercept ordinary rounds. Super grants no invulnerability and cannot block giant beams. Red Overdrive remains independent. Three stage-colored orbs retain the same evolution effect and32/78/124/170/216 supplies.

A decided terminal result freezes gameplay immediately, then EndingSequence drives a three-second slow explosion plus one-second VICTORY or1.5-second player explosion plus GAME OVER. Results settle once after presentation. Practice and withdrawal retain their own result; Endless commanders continue to the next cycle.

EMP clears ordinary enemies, rocks, bullets and active beams, not commanders or hardpoints. Passive charge is 75 seconds; cells add 5%; kills never refund energy. Recovery covers both normal volleys and the orbital-lock clock and stationary tracking. Big-beam warnings last 1.2 seconds and suspend ordinary fire.

## Art, motion and accessibility

Three Nairan hulls from the artist-authored Void Fleet pack provide Falcon, Raven and Atlas. Each has three connected evolution forms, engine frames and gun mounts on a shared 192px canvas. The old 27 modular builds are retained only in legacy saves. Pixel ship sprites, projectiles, sparks and wingmen use NEAREST. Hangar portraits fit the actual alpha bounds; the game keeps the common anchor and fixed hitbox. UI textures remain smoothed. Selected derivatives carry their own recorded license. No source ZIP/PSD packs are redistributed.

Meteors use bright rock texture, amber cracks and baked dark/light silhouette contours. Decorative debris is smaller and at most 8% alpha. No thin circular markers or ordinary meteor forecast strips. Inspect color and grayscale against every stage theme; target edge contrast at least 3:1.

Lean derives from velocity, up to 12 degrees, without shifting the hitbox. Hit flash lasts 50 ms with per-target throttling. Sparks and explosion fragments are bounded. Hull loss has short shake and damage feedback; one remaining hull segment adds a slow red vignette. Boss death shake is capped at 250 ms. Reduced Effects removes strong shake/flashes and reduces particles while keeping status and danger readable.

Touch targets are at least 44px. Battle does not scroll; menus do. Respect safe areas, landscape portrait-field fitting, keyboard focus, selected/pressed/disabled states and reduced motion. Meaning is reinforced through shapes and labels rather than color alone.

## Environment, audio and compatibility

Feony space backdrop is supplemented by selected animated Void Environment stars, alien recolored planets and asteroid destruction. Stage1 has fragmenting/iron rocks; Stage3 defense beams retain their original odd18-second slots. Plasma fields and interactive black holes are removed; their old slots remain empty. Major hazards do not overlap sweep beams. Parallax speeds are 10 / 20 / 30 units per simulation second. Themes crossfade over two seconds. Pause freezes simulation offsets. Canvas is the compatibility baseline; color variants and meteor contours are prepared offline rather than relying on WebGL tint.

AudioDirector owns music and nonverbal SFX only. There is no speech or announcer queue. Terminal_Dash plays in stages; ORBITAL BOMBARDMENT plays for bosses, crossfading in 400 ms and continuing across phases. Missing audio never blocks play. The real loader shows progress and a retry path for asset failure.

## Change authority

NEON-PLAN.md supersedes earlier balance and boss rules. PIXEL-COMBAT-PLAN.md is the historical source for three fixed pixel ships, run-only progression, first-sector choreography and the armor-gated commander. EVOLUTION-PLAN.md remains authoritative for retained gyro, EMP, wingman, feedback and lifecycle behavior. The theme and DOM controls keep the existing canonical CSS token ownership.

## Sector2/3 pacing revision

STAGE-BALANCE-PLAN.md supersedes pre-boss standard-enemy HP/cadence/caps in the earlier Neon baseline. GAME_BALANCE_CONFIG in neon.ts owns intro/mid/late5-second ramps: HP5.85/6.3/6.75 and7.8/8.4/9. Standard-only Pulse/Plasma/Laser impact1.1/1.2/1.05 is separate from Evolution and Super. No new-spawn configuration changes existing entity HP. Elite/homing permissions begin45s; first fire waits0.5 visible simulation seconds; wave generation pauses88.5–92 for miniboss arrival. Stage1, commanders, minibosses, boss supports and Endless retain baseline behavior. Existing score/drop formulas and saves remain intact. See STAGE-BALANCE-TESTING.md for pinned before/after results.

## Wenrexa mobile launcher (historical menu authority)
Start → Flight Deck → Play → Missions → Preflight → Launch. Start is semantic HTML available before Phaser; the game bundle imports asynchronously. No full-screen asset loader. Flight textures continue loading while menus work; Launch alone is gated by both scene and ship-art readiness. Errors retain Retry without starting a round.

Menu materials are selected PNGs from Wenrexa Minimalism #01 (CC0). `src/launcher.css` owns scoped menu tokens: void #0A0A12, cyan #00F3FF, warning #FF2A5F. It composes with baseline `src/style.css`; combat, Pause and Results retain baseline materials and tokens. Chakra Petch / JetBrains Mono remain local OFL fonts. No sample logos or generated images. The selected ship above a holographic pad is the Flight Deck focal point.

Start has one CTA and no navigation. Main Menu has Play, Hangar and Records, plus Settings / Return to Start. Return confirmation pauses menu music, does not close the browser or clear saves. Settings has Audio / Controls / Display tabs. Preferences remain a draft until Apply; leaving via Back, Escape, controller Back or navigation confirms discard. Sensor permission, calibration and fullscreen are immediate actions. Controller Lab retains real input behavior. No accounts, credits, permanent upgrades or speech. Existing storage keys remain unchanged. Menu motion honors Reduced Effects and system reduced motion.

## Tactical Neon full remake (historical typography; retained materials)
`src/tactical-theme.css` owns canonical global surface/type/motion tokens and replaces the menu-only Wenrexa rules; `launcher.css` imports it. Base style.css retains layout/compatibility. All routes including HUD/Pause/Results use MGS Codec, HUD and Ammo (unchanged Andrew Gleeson TTFs, CC-BY-SA4). Font optical adjustment1.5x follows user feedback to avoid oversize/overflow; secondary copy14, controls14–16, headings28, Start title48 with narrow-screen fitting. Navigation labels stack below icons. Results use a clean two-column stat layout without the old decorative border-image. Palette #090D12/#18232B/#E4ECE8/#59E7E0/#FFC56B/#FF5266. No new generated imagery. Wenrexa CC0 selected textures, code-drawn SVG icons and alert mark.

One MenuSpace canvas in bootstrap draws authored nebula/planet layers, bounded stars/dust at30fps, with capped device scale. It hides in battle and freezes nonessential motion on reduced effects/visibility loss. Menus use semantic controls; tactile states140ms hover,80ms press and280ms one-shot release. Screen/dialog transitions180ms. Saved/Draft, observed controller state and real loader progress remain truthful.

Battle LaserVisuals uses a fixed pool of repeating44px warning/beam tiles with capsule origin marker and local42px exclamation. Geometry comes from beamGeometry used by collision; warning1.2s, normal lifespan1.8s, sweep2.6s remain unchanged. LaserTimeline supplies charge/fire/stop IDs to AudioDirector. Pause/mute cancel active sources without replay. New laser WAVs are deterministic synthesis, not the supplied AI-derived sample pack. Purple decorative Super/escort lines removed; functional hazards use cyan/amber/red.

## Boss encounter revision (current combat/audio authority)
BOSS-REVISION-PLAN.md supersedes earlier plasma/gravity/decoy rules. Only defense-grid HazardState remains. Boss decoys and their projectile/laser retaliation no longer exist; real shields and destructible hardpoints remain. Capital entry owns a single cleanup policy and boss-entered event: loose drops disappear with bounded bursts, with no collection/reward, while collected powers remain. Phase transitions do not purge later drops.

GAME_BALANCE_CONFIG owns stage-only1.25 packet density, support caps6/8/10 and three-ship staggered side waves at the original wave clock. Fan endpoints/speeds and90-unit corridor remain. Endless uses legacy packet density,4/6/8 caps and two-ship waves. All friendly impacts on ordinary Stage3 enemies/shields pass once through damageEnemy with factor1.2; minibosses, hardpoints/cores and Endless are excluded. Existing Evolution/Super values are unchanged.

MusicPlayback deepens the playback module behind AudioDirector's music/pause/resume interface. Desired and confirmed audible tracks differ during loading/failure. Browser media is an adapter; fake media provides deterministic delayed/rejected playback. Per-track bounded starts/retries, cancellation generations and400ms confirmed handoff keep lifecycle locality and regression-test leverage. Resume restores the confirmed fallback while a desired track fails. Resetting retries never mutates a pending attempt's count. QA result fixtures cannot write local records.

## Portrait Mobile (current UI, balance and native authority)
PORTRAIT-MOBILE-PLAN.md supersedes earlier typography, menu flow and sector2/3 preboss tuning. One Home screen with ship/logo/Play; secondary Ship/Settings. Records lives in Settings. The lightweight HTML shell queues early Play once during runtime import. No separate Start and no full-screen loader. Launch alone waits for actual flight assets.

Canonical src/tactical-theme.css owns typography: MGS HUD only logo/headings at125% optical size, Chakra Petch14px UI,12px secondary, JetBrains18px score. Logo32px (28 narrow), heading22px. Controls retain44px minimum targets. Ship/Weapon save on choice; no draft action bar. Missions show sector/image/name/threat marks. Preflight shows control/status/Center/Launch. Pause has Resume/Center/toggles/Quit and Settings gear. Results show Score/Time/Kills; extra stats collapse under Details. Settings retains Apply/Discard for preferences.

Sector2 uses intervals2.46/2.15/1.92 and caps14/18/20, HP unchanged. Sector3 intervals3.50/2.88/2.50 and caps11/14/18, HP6.63/7.14/7.65, armor27.2 and matching shield. Existing5s ramps, impact multipliers, formations and all drop/supply rules remain. Bosses/supports/minibosses, Stage1 and Endless retain baseline rules.

AppSession is the lifecycle module: one interface owns active state, pause, input clearing, audio suspension and Back. Browser visibility/focus and Capacitor App are the two adapters. Initial hidden/native state is seeded; stale initial queries cannot overwrite newer events. Home/menu audio respects active state. Returning does not auto-resume flight; readiness and explicit Resume remain. Android Back pauses battle, navigates menus, confirms home exit. Android bundles dist without a remote server URL, locks portrait and retains application ID and save keys; browser storage is a separate origin. Native APK output stays outside public/dist.

Final user steering restores the fuller Flight Deck home: sector label, Personal best, active airframe, Play plus Hangar/Records and short flight hints. One entry page remains. Pause uses a full-width solid cyan56px Resume with a brief explanation and separate secondary Center/Quit. Menu composition changes do not restore oversized MGS UI copy. Resume ignores stale/closed-modal actions and waits for active app/control readiness; successful return is immediate with0.6s protection.


## UI restoration (current visual/navigation authority)
UI-RESTORATION-PLAN.md supersedes Portrait menu simplification. Restore Start→Home→Missions→Preflight with Return to Start and noncombat bottom navigation. Hangar uses the existing PixelShipStore draft/Save/Discard transaction, rotate/reset and open firing preview. Mission/preflight dropdowns and Hangar weapon buttons share selectWeapon. Preserve complete controls and concise one-sentence descriptions instead of deleting capability.

Chakra16px body/buttons,14px secondary, JetBrains20px score; MGS HUD only logo/headings36/24 (32/22 narrow),125% optical sizing. tactical-theme.css owns tokens/layout; base style.css supplies retained compatibility/art surfaces. Full results data and Pause volume/Restart controls are restored; Resume stays a56px primary action with readiness/lifecycle guards and0.6s protection. EntryIntent owns queued Start consumption; initial Start must not reset a pre-import tap. Repeated entry is guarded and Return resets intent.

Stage2/3 balance and all drop/music/AppSession fixes remain. APK work is suspended until explicit user review approval; no new native build/install/release during web restoration.


## Clean field and native app icon (test.2)
Remove the interior10% reading-bed rectangle: no hard-edged dark panel may cover the central field. Full-field atmospheric color and nonrectangular mist remain; simulation-time parallax and hazard/laser overlays are unchanged. parallax-contrast.test.ts exercises the actual renderer's draw commands across all stages/themes/reduced settings/reset.

Native app icon/splash is the user-requested imagegen neon fighter, graphite/cyan/amber, with provenance in assets-source/app-icon. Gameplay artist sprites remain unchanged. prepare-android-icons.py packages separate108dp foreground/background with artwork inside the66dp safe circle and central72dp legacy crop; do not revert to the old A mark. Version1.0.0-test.2 / code2 resumes the Android delivery authorized by the user; same application ID/save keys/debug signer.
