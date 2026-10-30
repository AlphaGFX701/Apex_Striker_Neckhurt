# Gyro Space Combat — visual system

Portrait mobile arcade shooter. Start screen is a cinematic planet and starfield with a prominent player vessel; the hangar is a distinct workshop with a large top-down modular ship. Flight prioritizes the field and a compact HUD; preflight, settings, pause, and results share the same industrial aerospace language. Thai is the primary language.

Palette: void #050914; metal #192536; text #EAF2FA; engine #60D8FF; accent #F0BC74; threat #F16D65. Chakra Petch headings and Prompt Thai body. Runtime values are owned by CSS custom properties in src/style.css. High contrast, visible focus, touch controls of 44px or greater and safe-area support are essential. Respect reduced-motion. Background and ship art are artist-authored with license details in ASSET-CREDITS.md.

The 3 hulls, 3 wing sets and 3 engines are cosmetic, and combat physics remains constant. The player chooses one of two weapons. Flight input is explicitly selected in preflight; settings and diagnostics never silently activate sensors.
