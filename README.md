# Gyro Space Combat — Evolution Arcade

A mobile gyro arcade shooter built with Phaser, TypeScript and Vite. Tilt to fly, flick to warp and shake to deploy EMP. Three open stages, Endless, Practice and 27 cosmetic ship builds. No accounts, purchases or permanent strength.

[Play the public game](https://gyro-space-lab-th.mjadsakul.chatgpt.site/)

## Run and build

```sh
npm ci
npm run dev
npm test
npm run build
```

Publish `dist/` as static files. Phone sensors require HTTPS. This release does not build IPA/APK; the existing Capacitor project remains available.

## Collect. Evolve. Survive.

Collect two / five Weapon Orbs to reach Level 2 / 3. Added gunpods, wings and engines preserve your modular ship. Main firepower is 100% / 160% / 230%. Pulse gains 1 / 2 / 3 firing lanes; Plasma gains 3 / 5 / 7 rounds; Laser gains side beams. Damage never removes evolution. Everything resets between runs.

Supply orbs appear at 12 / 28 / 48 / 72 / 96 seconds while fewer than five have been collected. Every Weapon Orb refreshes Red Overdrive to 25 seconds, including at maximum level. Red main fire intercepts ordinary hostile shots. Giant beams still require movement, Warp or EMP. Pickups apply immediately, without cards, slow motion or countdowns. Magnet radius is 150 logical units.

The first drone pickup summons two wingmen. Further pickups upgrade the pair through three levels, then become score. They persist until the round ends, assist targeting and never absorb damage. Combined nominal DPS is 3 / 4.5 / 8; the middle value was tuned to the boss-duration target.

## Threats and score

A stage has a two-minute approach followed by a three-phase boss without a timeout. Normal enemy caps are 10 / 12 / 14, including at most two armored ships. Boss escorts are limited to two, one on each side. Warm-up fighters shoot and retreat sideways instead of ramming. Boss core HP is 650 / 800 / 1000; each turret has 15 / 20 / 25 HP. Mini-boss HP is 60 / 75 / 90.

Volley builders preserve a 90-unit lower escape sector. Boss fallback attacks remain visible after turret destruction. Giant beams warn for 1.2 seconds and suspend ordinary fire. EMP charges passively in 75 seconds; cells add 5%. It clears ordinary enemies, rocks, hostile shots and active beams across the arena, without damaging commanders or hardpoints. Kills settle once and never refund EMP energy. Boss recovery after EMP lasts 1.2 seconds.

Five / ten / twenty consecutive kills grant x2 / x3 / x5 kill score. Only actual hull loss resets the chain. Practice never loses lives or writes records. Evolution records use `gyro-evolution-progress-v1`; older records, appearance, sensitivity and controller mappings remain stored.

## Interface and sound

Space Game GUI frames and buttons combine with NULLSIGNAL progress/status details. Chakra Petch and JetBrains Mono are bundled with their OFL licenses. Low-resolution projectiles and wingmen use nearest filtering; metallic ships and UI retain smoothing. Bright meteors have baked dark/light contours; decorative debris is small, dim and collision-free.

Game Over, Victory, Practice Complete and Withdrawn have distinct headings and feedback. Results show Score, Survival Time, Enemies Destroyed, Best Multiplier and Shots Intercepted. Pause provides Music/SFX toggles, volume sliders and motion Calibration. Reduced Effects limits motion, flashes and particles while preserving danger information.

There are no spoken announcements, recorded voices or SpeechSynthesis calls. Shooting, impacts, pickups, explosions and EMP activation use nonverbal SFX. Stage music is Terminal_Dash; boss music is ORBITAL BOMBARDMENT, with a 400 ms crossfade and no restart between phases.

## Verification and provenance

See `EVOLUTION-PLAN.md`, `EVOLUTION-TESTING.md`, `AUDIO-PROVENANCE.md` and `ASSET-CREDITS.md`. Files under `artifacts/evolution-*` contain the current evidence. Development-only `?qa=1` uses an explicitly simulated Practice pilot. Named fixtures are controlled scenes, not naturally played rounds. QA tools are excluded from production. Physical iPhone/Android/FANTECH tests are separate.

```sh
python -m pip install -r scripts/requirements-assets.txt
python scripts/build-evolution-assets.py
node scripts/evolution-balance.mjs
```

Asset preparation reads `Desktop/Space_combat`. Only selected runtime assets are published, not the source ZIP/PSD packs. Credits disclose NULLSIGNAL's AI-assisted provenance. This release creates no generative images.
