# Gyro Space Combat — design system

## Product and visual direction

English portrait mobile gyro arcade shooter. Tilt through readable fleets, collect orbs and visibly evolve into a powerful fighter. The ship stays central: a large metallic craft in the hangar, crisp smaller craft in battle. Cyan identifies player systems, amber identifies rewards and primary emphasis, red identifies danger. Red Overdrive is an explicitly labelled exception. Backgrounds stay dim behind projectiles. No placeholder shops or social routes.

No new generative imagery. NULLSIGNAL is a provided AI-assisted UI kit; disclose that provenance rather than claiming every asset is AI-free.

## Canonical token ownership

`src/style.css` owns tokens. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #A1B3C5; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB. Radius 5px. Chakra Petch handles headings and body text, JetBrains Mono handles numeric readouts. Artist sprites retain authored texture and material.

## Screens and interaction owners

Static semantic markup belongs to screens.ts. Main owns navigation and modal lifetime; Controller Lab owns observed input. Shared buttons, panels, tabs and states live in one stylesheet. Space Game GUI supplies blank material frames and buttons; NULLSIGNAL supplies progress, status and corner details. Text remains HTML. Do not embed Ethnocentric software from a readme link; use the bundled OFL fonts.

Title leads to Play, Hangar or Settings. Main navigation is Hangar / Battle / Records and disappears during combat. Appearance remains a draft until Save. All stages and main weapons are available. Evolution is run-only. Its records use gyro-evolution-progress-v1; older archives remain untouched.

## Combat layout and input

The field is 390 by 693.333 logical units, fitted without stretching. Bottom Warp / EMP controls sit outside the field. Score, time and Pause stay at the top. One boss HP bar displays the active commander. Three hull segments, a separate shield badge and wingman level occupy the lower edge. Centered hitbox radius remains six units regardless of cosmetic equipment.

Only the active input source controls flight. App loss, stale motion, controller loss and orientation changes pause and clear transient input. Orientation changes require calibration. Touch Smart Pause follows only the movement pointer. Menus must receive native keyboard input without Phaser capturing range-slider arrows. Resume gives 0.6 seconds of protection without a countdown.

Pause and Settings share Music/SFX toggles and volumes; returning from Settings resynchronizes Pause controls. Calibration is available in Pause for motion input. Game Over, Victory, Practice Complete and Withdrawn are distinct outcomes. A short visual outro cannot reopen Pause or overwrite Restart/Withdraw navigation.

## Evolution and combat rules

Two / five orbs produce Level 2 / 3 with added physical equipment at a common image anchor. Main firepower is 100 / 160 / 230%. The 0.45 second morph never pauses combat and grants 0.6 seconds of grace. Weapon Orbs refresh Red Overdrive to 25 seconds even after maximum evolution. The hangar firing range uses GameModel rules and the same composed ship art.

Wingmen are a permanent pair, one on each side, with three gun levels. They have no hitbox and never act as disposable armor. Shield precedes hull. Five / ten / twenty kills yield x2 / x3 / x5 kill score; only actual hull loss resets the chain. Rewards and stats settle once.

Enemy caps are 10 / 12 / 14 including up to two armored ships. Boss escorts occupy two separate side slots and refill only a vacant slot. Fighters shoot in warm-up and retreat through an exclusive movement branch. Bosses have 650 / 800 / 1000 core HP, separate hardpoints and three phases. Authored volleys reserve 90-unit escape sectors; raw projectile admission must not silence the boss. Core fallback remains visible after turret destruction.

EMP clears ordinary enemies, rocks, bullets and active beams, not commanders or hardpoints. Passive charge is 75 seconds; cells add 5%; kills never refund energy. Recovery covers both normal volleys and the orbital-lock clock and stationary tracking. Big-beam warnings last 1.2 seconds and suspend ordinary fire.

## Art, motion and accessibility

The saved 27 modular builds remain the base. Added Skorpio equipment overlays produce 81 level/build combinations. Common origin and alpha bounds preserve connected silhouettes. New low-resolution projectiles, sparks and wingmen use NEAREST; high-resolution player ships and UI stay smoothed. Selected derivatives carry their own recorded license. No source ZIP/PSD packs are redistributed.

Meteors use bright rock texture, amber cracks and baked dark/light silhouette contours. Decorative debris is smaller and at most 8% alpha. No thin circular markers or ordinary meteor forecast strips. Inspect color and grayscale against every stage theme; target edge contrast at least 3:1.

Lean derives from velocity, up to 12 degrees, without shifting the hitbox. Hit flash lasts 50 ms with per-target throttling. Sparks and explosion fragments are bounded. Hull loss has short shake and damage feedback; one remaining hull segment adds a slow red vignette. Boss death shake is capped at 250 ms. Reduced Effects removes strong shake/flashes and reduces particles while keeping status and danger readable.

Touch targets are at least 44px. Battle does not scroll; menus do. Respect safe areas, landscape portrait-field fitting, keyboard focus, selected/pressed/disabled states and reduced motion. Meaning is reinforced through shapes and labels rather than color alone.

## Environment, audio and compatibility

Feony Background 7 remains the space-only backdrop. Parallax speeds are 10 / 20 / 30 units per simulation second. Themes crossfade over two seconds. Pause freezes simulation offsets. Canvas is the compatibility baseline; color variants and meteor contours are prepared offline rather than relying on WebGL tint.

AudioDirector owns music and nonverbal SFX only. There is no speech or announcer queue. Terminal_Dash plays in stages; ORBITAL BOMBARDMENT plays for bosses, crossfading in 400 ms and continuing across phases. Missing audio never blocks play. The real loader shows progress and a retry path for asset failure.
