# Evolution Arcade — current audio behavior

All spoken announcements, device speech, preview controls and announcement queues were removed in this release. No supplied NPC dialogue is played or cut into item names. Music and nonverbal SFX remain; EMP activation has a nonverbal cue, readiness is visual. Independent Music/SFX toggles and volume controls are available in Pause and Settings. Historical provenance below explains the supplied source files; prior fallback descriptions do not describe the current runtime.

---

# Audio provenance — Mobile Onslaught

## Music

- `public/assets/audio/terminal-dash.mp3` is an unchanged runtime copy of the user-provided `Terminal_Dash.mp3`.
- `public/assets/audio/orbital-bombardment.mp3` is an unchanged runtime copy of the user-provided `ORBITAL BOMBARDMENT Epic Sci-Fi Battle Music Space Fleet Invasion Soundtrack.mp3`.
- The project does not claim authorship of either recording. No music source archive is included in the public build.
- Stage-to-boss transition crossfades in 400 ms. Repeated boss-state updates and phase changes do not seek or restart the boss recording. Music loops until the encounter ends. Music/SFX/Voice have independent controls; announcements duck music approximately 6 dB.

## Weapon and impact sounds

Source: user-provided `free-scifi-weapons-sounds-audio.zip`, [Free Sci-Fi Weapon Sounds](https://moneywithjjcom.itch.io/free-scifi-weapons-sounds).

The included README permits royalty-free commercial/non-commercial game use, unlimited projects, and inclusion in a public source repository as part of the game. It prohibits distributing these sounds as a standalone audio library. It also states that the sounds were generated with ElevenLabs Sound Effects and subsequently screened, level-matched, and edited by hand. This audio provenance is distinct from the game's artist-authored, non-generative visual assets.

Runtime mappings:

| Runtime file | Original member | Use |
|---|---|---|
| pulse.wav | blaster-rifle-shot-1.wav | Pulse rapid fire |
| drone-fire.wav | drone-weapon-fire.wav | Plasma fire |
| hull-impact.wav | impact-hull-metal-1.wav | Hull damage / pitched drone sacrifice |
| shield-impact.wav | ricochet-1.wav | Shield absorption |
| pickup.wav | rifle-power-cell-insert.wav | Item collection |

EMP, warp, warning and ready cues are short procedural Web Audio sounds. Enemy explosions combine a low bass sweep with filtered noise, limited to one start per 100 ms; the noise buffer is reused. Samples have a 24-voice simultaneous limit and rapid-fire rate limiting. Sound sources/gains disconnect on completion. Optional recording captures music and in-game SFX, but operating-system SpeechSynthesis output is not captured by Web Audio.

## Supplied voice files: content mismatch

All seven supplied WAV filenames have identical bytes, SHA-256 `6c234f728641de498c339ee3a4a49b8609fb4b71d5c9876b828954ac0db04452` (the complete authoritative hash is in `public/assets/audio/voice-manifest.json`). The recording is 42.56 seconds, mono, 24 kHz PCM16.

Local `faster-whisper` tiny.en CPU transcription identified unrelated fantasy NPC dialogue beginning “Hold, traveler! Not another step! The northern pass is sealed by order of the High Council” and ending “You need to run. Now!” It did not identify the requested game announcements. This is a machine transcription check, not a human listening test.

No false `Weapon enhanced` / shield / EMP cuts have been created from that dialogue. The game uses accurately worded English device SpeechSynthesis as a fallback, distinct SFX, and visible labels. The Settings sound preview provides all seven phrase buttons. Recorded announcements can replace the fallback once matching recordings are available; `VOICE_CLIPS[].recordedUrl` is the explicit mapping boundary, with Web Audio playback support already implemented.

Requested phrases: Weapon enhanced; Missiles online; Drone deployed; Shield online; Hull repaired; EMP charging; EMP ready.

## Rebuild and verification

Run `scripts/prepare-onslaught-audio.py` with Python 3.11+; it uses only the standard library. It copies only selected runtime music and SFX, writes an auditable voice-status manifest, and never ships source ZIPs or unrelated dialogue. Run `npm test -- src/audio-director.test.ts` for crossfade, no-restart, pause/resume, queue priority, voice mute, score-conversion, preview and file-presence checks.
