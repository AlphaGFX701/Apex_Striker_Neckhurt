# Pixel Combat — accepted implementation contract

31 October 2026. Local Evolution checkpoint: `5f9b3ddb2f419b0b1ba29f222fc5c5ed732daa62`.

Install official JADX1.5.6 CLI/GUI, Ghidra12.2 and isolated portable Temurin25 under the user's Tools. Research output stays outside this website in Desktop/ThunderStrike-Research. Preserve APK SHA2564abc0f8065882389d380d6d211840a0b3f76e1497c6605444880e0f388367caa. Export Java/resources and focused native pseudocode, errors, provenance and static/runtime distinctions. Observe MuMu if playable; record login/runtime blockers honestly. No monetization research or original Thunder Strike code/art redistribution.

Replace modular builder UI with three free equal-stat pixel ships: Falcon=Nairan Fighter, Raven=Nairan Scout, Atlas=Nairan Bomber. Three distinct connected evolution forms each, keeping original hull. Two/five orbs,100/160/230% firepower,25s red interception, pair of permanent wingmen unchanged. Preserve old build save; map hull0/1/2 to ship, preserve weapon/sensitivity/mapping, separate new records. All menus English, mobile gyro primary,44px controls. Keep three stages/Endless/Practice; new authored waves and armor-gated boss only in stage1.

Artist assets: Void Fleet1/2 and SpaceShooter pack. Pixel silhouettes, engines, muzzle flashes, banks, gun mounts and0.45s unfolding. Existing readable meteors/shields remain. Preview and battle share rules and ship appearance. Pulse1/2/3 lanes,Plasma3/5/7,Laser side beams; effects never multiply damage.

Stage1:0–30 line/V;30–75 arcs/zigzag/aimed pairs;75–120 armor/mobile turrets/mini at90;capital at120, clear escaped mini first. Eight motifs:line,vee,left arc,right arc,zigzag pair,bomber pass,turret pair,armored escort. No consecutive repeats. Ten ordinary ships including max2armored; boss escorts max2 total. Fire then retreat sideways.

Stage1 boss:650 core HP,three phases. Pair of turrets15/20/25 HP each in phases1/2/3. States armored/exposed/transition/defeated. Core invulnerable while turrets live; destroying both exposes core until phase threshold. Clamp overflow at2/3 and1/3HP, clear shots/beams,1.5s transition then new turret pair; never refill core HP. Visible BREAK THE TURRETS / CORE EXPOSED. Destroyed turrets stop firing. Fans/aimed/rings/beam,90-unit escape sector;1.2s big attack warning suspends normal fire. Missiles/wingmen prioritize live mounts then exposed core.65%-tracking Level2/wingmen2 reference target45–75s. EMP clears field, not boss/turrets.

Keep music Terminal_Dash / ORBITAL BOMBARDMENT; no spoken announcements. Model owns rules and one-time events. Add shared ShipDefinition/WeaponPresentation/WaveScript and explicit boss state. Keep gyro calibration/pause/stale signal/disconnect behavior, no countdown. Only three skill buttons outside field.

Acceptance: old relevant tests plus gates/thresholds/target selection/once-only rewards;9forms andallweapons;320x568,390x844,430x932,landscape;fullstage1with3weapons;stage2/3regression;physicalgyro/controller separate. Screens/video,credits,researchcomparison,testreport then publish existing public site. NoIPA/APKpackaging.

## User adjustments after review

Skip the 20-minute Endless browser test. Move wingmen away from the flagship, positioning an edge-constrained wingman forward, with one engine effect per wingman. Stage-one boss uses denser fans, aimed shots and rings without increasing 650 HP; preserve the 90-unit safe lane and pause ordinary attacks during the warned beam. Reduce weapon Orb drop weight to 1/16, supplies to 24/60/96/132/168 seconds, and red interception to about one third of main shots; laser can intercept two shots every third pulse. Red duration remains 25 seconds. Test these updated behaviors and review the changes before publishing.
