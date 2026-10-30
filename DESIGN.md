# Gyro Space Combat — design system

## Product and visual direction

English, portrait tactical arcade shooter. The ship is the central object: show a large artist-authored metallic craft in the hangar and a crisp, smaller version in battle. Cyan belongs to player systems, amber to rewards/primary actions and red to hostile threats. Background planets and nebulae create depth but stay dim during combat. No generative imagery. No placeholder Shop, Guild or Social routes.

## Canonical token ownership

Runtime source: `src/style.css` `:root` custom properties. Void #050914; panel #101B2B; metal #192536; line #2B3E53; text #EAF2FA; muted #93A8BD; cyan #60D8FF; amber #F0BC74; red #F16D65; green #99E5BB; standard radius 8px. Chakra Petch is the display/data face; Inter is the English body face, with sans-serif fallbacks. CSS owns styling; simulation does not own UI colors. Artist sprites retain their authored metal texture.

## Screens and interaction owners

`screens.ts` owns static semantic markup. `main.ts` owns navigation, modal lifetimes, input gating and reward presentation. Controller Lab owns observed input visuals. Native modal dialogs provide focus trapping; actions are buttons. Dynamic cards bind handlers when rendered. Shared button, panel, tab, comparison and status rules live in the single stylesheet.

Title leads to Battle, Hangar or Controller Lab. Main navigation is Hangar / Battle / Records and is hidden during combat. Appearance is a draft until Save; leaving a dirty draft requires discard confirmation. Equipment purchases are explicit, price-labelled actions. Locked and unaffordable actions show their state. Results itemize banked credits and distinguish practice.

## Combat layout and input

The logical field is 390 by 693.333 units (9:16), fitted without stretching. A separate bottom dock owns dodge / EMP touch targets. Compact score/time/pause sit at the top; boss name, phase and HP appear only during boss fights. Hull/shield stay near the bottom edge. The central playfield stays clear. Small luminous hitbox uses the actual six-unit collision radius, independent of cosmetic art.

Only the active source controls flight. Touch movement tracks its pointer; unrelated releases cannot pause it. App loss, controller loss and phone recalibration pause flight and clear transient input. Perk menus stop simulation and gesture detection. Resume countdown is cancellable and revalidates the selected input source. Diagnostic screens retain their return route.

## Responsive, access and motion

Primary touch targets are at least 44px; navigation and skill buttons remain accessible at 320px width. Menus scroll with visible themed scrollbars, while battle owns a fixed viewport and safe-area padding. Landscape centers the portrait field. Every interactive control has keyboard focus, pressed/selected and disabled states. Color is reinforced by labels, shapes or numbers. Reduced-motion CSS and a reduced-effects toggle remove nonessential animation. Backgrounds crop to cover; they are never stretched.

## Art provenance and quality

Ship sources: Skorpio construction kit and Original Human Ships, CC-BY-SA 3.0. Background: Rawdanitsu, CC0. Three hulls, three wings and three engines produce 27 connected silhouettes. Player engines use cyan accents; bosses use red accents. Derived files and scripts are distributable with attribution. `scripts/check-tactical-assets.py` produces a contact sheet and alpha connectivity report; browser screenshots verify the final scale and visual integration.
