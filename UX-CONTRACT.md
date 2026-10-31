# Evolution Arcade — observable UI contract

## Screens and navigation

English is the sole interface locale. Device names are displayed exactly as the browser reports them. Title leads to Play, Hangar or Settings. Main navigation contains Hangar / Battle / Records, hidden in battle. Controller Lab is a secondary flight-system tool, not a required onboarding step. Back returns to the originating screen, including Settings opened from Pause.

Appearance edits are a draft until saved. Leaving a dirty draft requires confirmation. Main weapons and stages are free and immediately available. No shop, purchase, unlock or permanent upgrade flow is shown.

## Flight lifecycle

Phone motion is the default on a fresh mobile profile. Enable sensors, calibrate, test movement, then Launch. Permission denial, absent sensor data and insecure transport show actionable status and permit fallback input. Missing measurements say Unavailable, never zero.

App loss, stale sensor input, controller disconnect and orientation change pause flight and clear input. Orientation changes require calibration before Resume. Touch Smart Pause follows only the movement pointer. Releasing skill fingers does not pause gyro/controller play. Resume has no countdown and grants 0.6 seconds of protection.

Native inputs and sliders keep normal keyboard behavior. Only the active source controls flight. Menus do not send gameplay actions. During the end-of-round presentation, Pause cannot open over Results. Restart and Withdraw cannot be overwritten by a delayed transition.

## Evolution and feedback

Two / five collected orbs produce Level 2 / 3. Evolution adds parts to the selected modular ship with unchanged speed and hitbox. Main firepower is 100 / 160 / 230%; damage does not lower the level. Every Weapon Orb refreshes Red Overdrive to 25 seconds. Two wingmen upgrade instead of stacking or acting as armor. All run powers reset on a new flight.

Hull has three segments; shield, wingman level, evolution and Red Overdrive have separate indicators. Color supplements semantic shapes, text and numbers. Meteors are bright, outlined hazards; small dim debris is decorative. Reduced Effects preserves warning and damage information while limiting flashes and motion.

EMP clears ordinary threats across the arena, not commanders or hardpoints. Passive charge is 75 seconds, cells add 5%, and kills never refund energy. Warp shares one recharge state between left/right buttons. Cooldowns use bars/state labels rather than countdown freezes.

## Results, sound and records

Game Over / Victory / Practice Complete / Withdrawn have distinct headings and appropriate cues. Results include score, survival time, destroyed enemies, best multiplier and intercepted shots. Try Again is always available; Next Stage is offered only after a stage victory before the final sector.

Music and SFX have independent toggles and volume sliders in both Pause and Settings. Returning from Settings updates Pause controls. There are no spoken announcements, voice settings or device speech. Missing optional audio never blocks play.

A round settles once. Practice never writes records. Evolution scores use gyro-evolution-progress-v1, preserving older archives and appearance/input preferences. Failed local saves remain playable with an explicit session-only status.

## Layout and access

Battle fits a 9:16 field without scrolling and respects safe areas. Menus may scroll. Controls have at least 44x44px touch targets, visible focus and pressed/selected/disabled states. Numeric readouts use tabular digits. Landscape preserves the portrait field. Real device observations and simulated test input are labelled separately.
