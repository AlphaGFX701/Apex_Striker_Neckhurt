# Gyro Space Combat — design system

## Product and visual direction

English, portrait tactical arcade shooter. The ship is the central object: show a large artist-authored metallic craft in the hangar and a crisp, smaller version in battle. Cyan belongs to player systems, amber to rewards/primary actions and red to hostile threats. Background planets and nebulae create depth but stay dim during combat. No generative imagery. No placeholder Shop, Guild or Social routes.

## Canonical token ownership

Runtime source: `src/style.css` `:root` custom properties. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #93A8BD; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB; standard radius 8px. Rajdhani is the display/data face; Barlow is the English body face, with sans-serif fallbacks. CSS owns styling; simulation does not own UI colors. Artist sprites retain their authored metal texture.

## Screens and interaction owners

`screens.ts` owns static semantic markup. `main.ts` owns navigation, modal lifetimes, input gating and reward presentation. Controller Lab owns observed input visuals. Native modal dialogs provide focus trapping; actions are buttons. Dynamic cards bind handlers when rendered. Shared button, panel, tab, comparison and status rules live in the single stylesheet.

Title leads to Battle, Hangar or Controller Lab. Main navigation is Hangar / Battle / Records and is hidden during combat. Appearance is a draft until Save; leaving a dirty draft requires discard confirmation. All three main weapons and stages are available. There is no purchase or permanent upgrade flow. Results show score and pickup count, with separate arcade records.

## Combat layout and input

The logical field is 390 by 693.333 units (9:16), fitted without stretching. A separate bottom dock owns dodge / EMP touch targets. Compact score/time/pause sit at the top; boss name, phase and HP appear only during boss fights. Hull/shield stay near the bottom edge. The central playfield stays clear. Small luminous hitbox uses the actual six-unit collision radius, independent of cosmetic art.

Only the active source controls flight. Touch movement tracks its pointer; unrelated releases cannot pause it. App loss, controller loss and phone recalibration pause flight and clear transient input. Pickups apply immediately without menus or countdowns. Resume validates the source and grants 0.6 seconds of protection. Diagnostic screens retain their return route.

## Responsive, access and motion

Primary touch targets are at least 44px; navigation and skill buttons remain accessible at 320px width. Menus scroll with visible themed scrollbars, while battle owns a fixed viewport and safe-area padding. Landscape centers the portrait field. Every interactive control has keyboard focus, pressed/selected and disabled states. Color is reinforced by labels, shapes or numbers. Reduced-motion CSS and a reduced-effects toggle remove nonessential animation. Backgrounds crop to cover; they are never stretched.

## Art provenance and quality

Ship sources: Skorpio construction kit and Original Human Ships, CC-BY-SA 3.0. Active background: Feony Background 7 (Bonus), space only. Older Rawdanitsu files remain historical assets. Three hulls, three wings and three engines produce 27 connected silhouettes. Player engines use cyan accents; bosses use red accents. Derived files and scripts are distributable with attribution. `scripts/check-tactical-assets.py` produces a contact sheet and alpha connectivity report; browser screenshots verify the final scale and visual integration.

## Environment and stage direction

Feony Background 7 is a static artist-authored space image, animated through runtime parallax. No Earth, city or forest scene is used. Layer speeds are 10/20/30 logical units per simulation second. Environment offsets stop with simulation time; theme changes blend over two seconds from blue through violet/amber to red. Decorative Lunar debris is dark, slow, and has no collision. Actual meteors are brighter and larger.

StageWaveManager owns one-shot boundaries at 15/35/60/90 seconds, warnings and hazards; GameModel owns damage and rewards; ParallaxEnvironment owns rendering. Void Fleet 1 provides regular enemies, Fleet 2 commanders/capital ships, with aligned artist animation sheets. Boss HP is one total with thresholds at two-thirds and one-third. EMP and phase changes clear hostile shots; warnings remain in the top band. Magnetic storms slow movement inside the field only, and do not shorten warp distance. Meteor lanes are telegraphed and avoid a safe lane.

AudioDirector owns Music/SFX/Voice levels, transition timing, bounded speech queue and stale announcement cancellation. Pickups carry their actual effect to the audio boundary: full hull or maximum weapon converts to EMP charging. Voice depends on installed English SpeechSynthesis voices; every cue has an independent synthesized SFX and visible label.

Canvas rendering is the compatibility baseline for this release: WebGL in the embedded browser produced black rectangles for transparent sprite frames. Images are pooled by texture. Background color variants are prepared offline and crossfaded, so Canvas does not depend on WebGL tint support. At most two background images normally draw, four during a two-second transition.
