# Gyro Space Combat — design system

## Product and visual direction

English portrait mobile gyro arcade shooter. North Star: tilt through dense fleets, read danger instantly and survive a cinematic capital ship encounter. The signature is a large multi-hardpoint boss above an uncluttered segmented-hull HUD; avoid dashboard panels in combat. The ship is the central object: show a large artist-authored metallic craft in the hangar and a crisp, smaller version in battle. Cyan belongs to player systems, amber to rewards/primary actions and red to hostile threats. Background planets and nebulae create depth but stay dim during combat. No generative imagery. No placeholder Shop, Guild or Social routes.

## Canonical token ownership

Runtime source: `src/style.css` `:root` custom properties. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #A1B3C5; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB; standard radius 5px. Oxanium is the display/data face; Barlow is the English body face, with sans-serif fallbacks. CSS owns styling; simulation does not own UI colors. Artist sprites retain their authored metal texture.

## Screens and interaction owners

`screens.ts` owns static semantic markup. `main.ts` owns navigation, modal lifetimes, input gating and reward presentation. Controller Lab owns observed input visuals. Native modal dialogs provide focus trapping; actions are buttons. Dynamic cards bind handlers when rendered. Shared button, panel, tab, comparison and status rules live in the single stylesheet.

Title leads to Play (Missions), Hangar or Settings. Controller Lab is a secondary Settings/Preflight tool. Main navigation is Hangar / Battle / Records and is hidden during combat. Appearance is a draft until Save; leaving a dirty draft requires discard confirmation. All three main weapons and stages are available. There is no purchase or permanent upgrade flow. Results show score and pickup count, with separate Onslaught records under gyro-onslaught-progress-v1. Earlier arcade and v6 records remain untouched.

## Combat layout and input

The logical field is 390 by 693.333 units (9:16), fitted without stretching. A separate bottom dock owns dodge / EMP touch targets. Compact score/time/pause sit at the top; boss name, phase and HP appear only during boss fights. Hull has three artist-style energy segments near the bottom left. Shield has its own badge and animated lattice around the ship; escort count is separate. No heart glyphs. Both Warp captions and recharge strips share model state. The central playfield stays clear. Small luminous hitbox uses the actual six-unit collision radius, independent of cosmetic art.

Only the active source controls flight. Touch movement tracks its pointer; unrelated releases cannot pause it. App loss, controller loss and phone recalibration pause flight and clear transient input. Pickups apply immediately without menus or countdowns. Resume validates the source and grants 0.6 seconds of protection. Diagnostic screens retain their return route.

Red is also a deliberate temporary player exception: Weapon Power activates red main fire for25 seconds, refreshing rather than stacking on another pickup. The HUD names RED and shows remaining seconds, so color alone is not the indicator. Red shots intercept ordinary hostile projectiles; giant laser targeting zones remain lethal. Pickups retain full authored color and semantic silhouettes without a foreground dark disc obscuring them.

Boss barrages and escort shots share a104-unit lower escape corridor, fixed within each phase. Fans and rings alternate, with recovery time; escort reinforcements are bounded. Giant-beam warning/firing suspends ordinary boss/escort fire. This preserves readable movement decisions without reducing the capital ship encounter to a short health check.

## Responsive, access and motion

Primary touch targets are at least 44px; navigation and skill buttons remain accessible at 320px width. Menus scroll with visible themed scrollbars, while battle owns a fixed viewport and safe-area padding. Landscape centers the portrait field. Every interactive control has keyboard focus, pressed/selected and disabled states. Color is reinforced by labels, shapes or numbers. Reduced-motion CSS and a reduced-effects toggle remove nonessential animation. Backgrounds crop to cover; they are never stretched.

## Art provenance and quality

Ship sources: Skorpio construction kit and Original Human Ships, CC-BY-SA 3.0. Active background: Feony Background 7 (Bonus), space only. Older Rawdanitsu files remain historical assets. Three hulls, three wings and three engines produce 27 connected silhouettes. Player engines use cyan accents; bosses use red accents. Derived Skorpio files remain CC-BY-SA3.0 with attribution. Void, Wenrexa UI and original semantic pickup/segment/turret additions have their recorded CC0 provenance; user music keeps its original ownership. `scripts/check-tactical-assets.py` produces a contact sheet and alpha connectivity report; browser screenshots verify the final scale and visual integration.

## Environment and stage direction

Feony Background 7 is a static artist-authored space image, animated through runtime parallax. No Earth, city or forest scene is used. Layer speeds are 10/20/30 logical units per simulation second. Environment offsets stop with simulation time; theme changes blend over two seconds from blue through violet/amber to red. Decorative Lunar debris is dark, slow, and has no collision. Actual meteors are brighter and larger.

StageWaveManager owns one-shot boundaries at 30/75/90/120 seconds, warnings and hazards; GameModel owns damage and rewards; ParallaxEnvironment owns rendering. Void fleets provide stage-specific escorts and three kitbashed capital ships with separately rendered, damageable turrets. Old bosses serve as mini-bosses at90. Final bosses enter at120 and have no timeout; the HUD shows elapsed boss time. Seeded formations draw from twelve patterns with no immediate repeat. Boss HP is one total with thresholds at two-thirds and one-third. Phase changes clear hostile shots; EMP only clears bullets within180 units, stuns nearby escorts0.8 seconds and never damages commanders or cancels giant lasers. Passive EMP recharge is45 seconds. Bosses lock a stationary zone after1.8 seconds, warn1.2 seconds then fire0.6 seconds; only one giant beam may be active. Magnetic storms slow movement inside the field only, and do not shorten warp distance. Meteor formations retain a safe lane; forecast strips and decorative guidance lines are removed. Real meteors have a bright rim and hot fragments; only lethal laser zones retain targeting telegraphs.

AudioDirector owns Music/SFX/Voice levels, transition timing, bounded speech queue and stale announcement cancellation. Pickups carry their actual effect to the audio boundary: full hull, duplicate shield and maximum escorts resolve to bonus score, never extra EMP. Maximum Weapon Power still refreshes Red Overdrive and grants overflow score; its announcement remains Weapon enhanced. The first drone pickup gives left/right escorts, subsequent pickups alternate left first to six. Shield is consumed before a drone; one drone intercepts a lethal bullet and explodes, granting1.5 seconds of invulnerability. Drones cannot absorb collisions or giant lasers. Hull damage also grants1.5 seconds. Assault music is the user-provided Terminal_Dash; final-boss music is ORBITAL BOMBARDMENT. Crossfade400ms, loop through phases, preserve position across Pause/Resume. Supplied renamed WAVs were verified as identical unrelated NPC dialogue, so no false cuts are used; correct English device speech and distinct samples/procedural SFX remain fallback. Settings offers seven announcement previews and clearly reports this source limitation.

Canvas rendering is the compatibility baseline for this release: WebGL in the embedded browser produced black rectangles for transparent sprite frames. Images are pooled by texture. Background color variants are prepared offline and crossfaded, so Canvas does not depend on WebGL tint support. At most two background images normally draw, four during a two-second transition.
