# Gyro Space Combat — Mobile Onslaught

Mobile gyro arcade shooter built with Phaser, TypeScript and Vite. Tilt to fly, flick to warp and shake for a defensive EMP. Three open stages, Endless, Practice, 27 cosmetic builds and three free weapons. No permanent strength, purchases or accounts.

Public game: https://gyro-space-lab-th.mjadsakul.chatgpt.site/

## Run and build

```sh
npm ci
npm run dev
npm test
npm run build
```

Publish dist/ as static files. Phone sensors need HTTPS; HTTP LAN previews support manual/controller testing but cannot establish physical gyro compatibility. Existing Capacitor files are retained; this update does not build IPA/APK.

## Combat

Stages have a two-minute assault (warm-up0–30, pressure30–75, assault75–120). Existing commanders appear as mini-bosses at90 and retreat without rewards at120 if still alive. Capital ships have900/1200/1500 core HP, separately damageable turrets, three phases and no timeout. Their music plays continuously across phases. A stationary zone is locked before a giant beam; use motion or warp to escape.

Twelve seeded formations vary between runs and stages. Endless uses30-second waves and a capital ship every third wave; defeat it before continuing. Object caps are32 enemies,360 player shots,360 hostile shots,60 pickups and at most160 effects (the renderer currently uses a smaller48-effect budget).

EMP clears bullets only within180 units, briefly stuns escorts and does not damage bosses, remove rocks or cancel beams. Passive recharge takes45 seconds; a cell adds10%. It never refunds kill energy.

Six colored pickups apply instantly without choices or countdowns. Weapon Power adds up to two side-shot steps for the run and activates Red Overdrive for25 seconds. Another Weapon Power refreshes the timer to25 seconds, including at maximum power. Red main shots destroy ordinary hostile bullets on contact; missiles and drones do not gain this property. The red laser has a bounded interception budget. Giant boss lasers must still be dodged. Missiles last12 seconds and extend to24, shield absorbs one hit, Repair restores one of three hull segments. Other overflow becomes score. Magnet radius is150 units.

Boss and escort barrages preserve a104-unit lower escape corridor. Fans alternate with rings, with pauses between attacks and during giant-laser warnings. Boss HP and multi-phase endurance remain; the difficulty comes from repositioning and managing protection rather than unavoidable overlapping barrages.

First drone pickup gives two escorts; later pickups add left first, alternating to six. Drones persist until sacrificed. Protection order is invulnerability → shield → one drone for bullets → hull. A drone interception or hull hit grants1.5 seconds; drones do not block collisions or giant beams. All powers reset each run.

## Controls and safety

Phone: Enable sensors → Calibrate → test tilt → Launch. Touch drag, keyboard arrows/WASD and controllers are optional. Q/E or LB/RB warp, Space or the bottom gamepad button uses EMP, Start pauses. Controller Lab inspects/remaps actual browser inputs and does not claim standard raw controller gyro access.

App loss, stale sensor input, orientation change and controller disconnect pause and clear input. Orientation changes require calibration. Resume has no countdown and grants0.6 seconds of protection. Touch Smart Pause reacts only to releasing the movement finger. Practice does not save records. Onslaught scores use a separate key; existing appearance, input preferences and older records remain stored.

## Art and audio

No generated imagery. Artist-derived bosses, escort fleets, engine/destruction animation, semantic pickup badges, shield lattice, hull segments and Wenrexa frames have provenance in public/assets/onslaught/credits.json and ASSET-CREDITS.md.

Stage music: Terminal_Dash.mp3. Capital ship music: ORBITAL BOMBARDMENT Epic Sci-Fi Battle Music Space Fleet Invasion Soundtrack.mp3. Both are supplied by the user, copied under stable runtime names, crossfaded and looped.

The supplied WAV filenames contain the same unrelated NPC recording. Correct item recordings are still needed; the game uses correct English device speech plus distinct SFX and visible labels. Seven preview buttons and the source status are in Settings. See AUDIO-PROVENANCE.md.

```sh
python -m pip install -r scripts/requirements-assets.txt
python scripts/build-onslaught-assets.py
python scripts/prepare-onslaught-audio.py
```

These scripts read Desktop/Space_combat by default and ship runtime derivatives only, not source archives.

## Verification

See ONSLAUGHT-TESTING.md, artifacts/onslaught-balance.json and the onslaught screenshots/video. Browser fixtures and the simulated pilot require a Vite development build with ?qa=1; they are removed from production. They are not physical gyro/controller tests.

Reference checks:

```sh
node scripts/onslaught-balance.mjs
node scripts/onslaught-soak.mjs 1200
```

The latter is a real-wall-clock model soak, not a renderer FPS test. Browser rendering and real-device measurements are reported separately.
