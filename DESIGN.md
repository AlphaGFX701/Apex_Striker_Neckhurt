# Apex Strikers — Neon Onslaught design system

## Product and visual direction

English portrait mobile gyro arcade shooter. Tilt through readable fleets, collect orbs and visibly evolve into a powerful fighter. The ship stays central: a large artist-authored pixel fighter in the hangar, the same crisp fighter in battle. Cyan identifies player systems, amber identifies rewards and primary emphasis, red identifies danger. Red Overdrive is an explicitly labelled exception. Backgrounds stay dim behind projectiles. No placeholder shops or social routes.

No new generative imagery. NULLSIGNAL is a provided AI-assisted UI kit; disclose that provenance rather than claiming every asset is AI-free.

## Canonical token ownership

`src/style.css` owns tokens. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #A1B3C5; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB. Radius 5px. Chakra Petch handles headings and body text, JetBrains Mono handles numeric readouts. Artist sprites retain authored texture and material.

## Screens and interaction owners

Static semantic markup belongs to screens.ts. Main owns navigation and modal lifetime; Controller Lab owns observed input. Shared buttons, panels, tabs and states live in one stylesheet. Space Game GUI supplies blank material frames and buttons; NULLSIGNAL supplies progress, status and corner details. Text remains HTML. Do not embed Ethnocentric software from a readme link; use the bundled OFL fonts.

Title leads to Play, Hangar or Settings. Main navigation is Hangar / Battle / Records and disappears during combat. The hangar selects one of three free equal-stat pixel ships: Falcon, Raven or Atlas. Ship choice remains a draft until Save ship; Discard selection restores the saved ship. All stages and main weapons are available. Evolution is run-only. Pixel records use gyro-pixel-progress-v1 and ship selection uses gyro-pixel-loadout-v1. The earlier modular save and record archives remain untouched.

## Combat layout and input

The field is 390 by 693.333 logical units, fitted without stretching. Bottom Warp / EMP controls sit outside the field. Score, time and Pause stay at the top. One boss HP bar displays the active commander. Three hull segments, a separate shield badge and wingman level occupy the lower edge. Centered hitbox radius remains six units regardless of cosmetic equipment.

Only the active input source controls flight. App loss, stale motion, controller loss and orientation changes pause and clear transient input. Orientation changes require calibration. Touch Smart Pause follows only the movement pointer. Menus must receive native keyboard input without Phaser capturing range-slider arrows. Resume gives 0.6 seconds of protection without a countdown.

Pause and Settings share Music/SFX toggles and volumes; returning from Settings resynchronizes Pause controls. Calibration is available in Pause for motion input. Game Over, Victory, Practice Complete and Withdrawn are distinct outcomes. A short visual outro cannot reopen Pause or overwrite Restart/Withdraw navigation.

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

Feony space backdrop is supplemented by selected animated Void Environment stars, alien recolored planets, black holes and asteroid destruction. Stage1 has fragmenting/iron rocks; Stage2 plasma jams fire; Stage3 defense beams. Major hazards do not overlap sweep beams. Black holes have destructible cores, bounded gravity and a detonation warning. Parallax speeds are 10 / 20 / 30 units per simulation second. Themes crossfade over two seconds. Pause freezes simulation offsets. Canvas is the compatibility baseline; color variants and meteor contours are prepared offline rather than relying on WebGL tint.

AudioDirector owns music and nonverbal SFX only. There is no speech or announcer queue. Terminal_Dash plays in stages; ORBITAL BOMBARDMENT plays for bosses, crossfading in 400 ms and continuing across phases. Missing audio never blocks play. The real loader shows progress and a retry path for asset failure.

## Change authority

NEON-PLAN.md supersedes earlier balance and boss rules. PIXEL-COMBAT-PLAN.md is the historical source for three fixed pixel ships, run-only progression, first-sector choreography and the armor-gated commander. EVOLUTION-PLAN.md remains authoritative for retained gyro, EMP, wingman, feedback and lifecycle behavior. The theme and DOM controls keep the existing canonical CSS token ownership.

## Sector2/3 pacing revision

STAGE-BALANCE-PLAN.md supersedes pre-boss standard-enemy HP/cadence/caps in the earlier Neon baseline. GAME_BALANCE_CONFIG in neon.ts owns intro/mid/late5-second ramps: HP5.85/6.3/6.75 and7.8/8.4/9. Standard-only Pulse/Plasma/Laser impact1.1/1.2/1.05 is separate from Evolution and Super. No new-spawn configuration changes existing entity HP. Elite/homing permissions begin45s; first fire waits0.5 visible simulation seconds; wave generation pauses88.5–92 for miniboss arrival. Stage1, commanders, minibosses, boss supports and Endless retain baseline behavior. Existing score/drop formulas and saves remain intact. See STAGE-BALANCE-TESTING.md for pinned before/after results.

## Wenrexa mobile launcher (current menu authority)
Start → Flight Deck → Play → Missions → Preflight → Launch. Start is semantic HTML available before Phaser; the game bundle imports asynchronously. No full-screen asset loader. Flight textures continue loading while menus work; Launch alone is gated by both scene and ship-art readiness. Errors retain Retry without starting a round.

Menu materials are selected PNGs from Wenrexa Minimalism #01 (CC0). `src/launcher.css` owns scoped menu tokens: void #0A0A12, cyan #00F3FF, warning #FF2A5F. It composes with baseline `src/style.css`; combat, Pause and Results retain baseline materials and tokens. Chakra Petch / JetBrains Mono remain local OFL fonts. No sample logos or generated images. The selected ship above a holographic pad is the Flight Deck focal point.

Start has one CTA and no navigation. Main Menu has Play, Hangar and Records, plus Settings / Return to Start. Return confirmation pauses menu music, does not close the browser or clear saves. Settings has Audio / Controls / Display tabs. Preferences remain a draft until Apply; leaving via Back, Escape, controller Back or navigation confirms discard. Sensor permission, calibration and fullscreen are immediate actions. Controller Lab retains real input behavior. No accounts, credits, permanent upgrades or speech. Existing storage keys remain unchanged. Menu motion honors Reduced Effects and system reduced motion.
