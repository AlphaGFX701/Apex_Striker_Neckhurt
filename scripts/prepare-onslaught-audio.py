"""Prepare user-provided runtime audio; never ship source archives.

Run with Python 3.11+ (standard library only). Optional --source changes the
asset source directory. Cut boundaries are deliberately explicit and auditable.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import wave
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=Path.home() / 'Desktop/Space_combat')
args = parser.parse_args()
SOURCE = args.source
OUT = ROOT / 'public/assets/audio'
OUT.mkdir(parents=True, exist_ok=True)

MUSIC = {
    'terminal-dash.mp3': 'Terminal_Dash.mp3',
    'orbital-bombardment.mp3': 'ORBITAL BOMBARDMENT Epic Sci-Fi Battle Music Space Fleet Invasion Soundtrack.mp3',
}
for dest, source in MUSIC.items():
    shutil.copyfile(SOURCE / source, OUT / dest)

SFX = {
    'pulse.wav': 'blaster-rifle-shot-1.wav',
    'drone-fire.wav': 'drone-weapon-fire.wav',
    'hull-impact.wav': 'impact-hull-metal-1.wav',
    'shield-impact.wav': 'ricochet-1.wav',
    'pickup.wav': 'rifle-power-cell-insert.wav',
}
with zipfile.ZipFile(SOURCE / 'free-scifi-weapons-sounds-audio.zip') as z:
    for dest, source in SFX.items():
        member = next(n for n in z.namelist() if n.endswith('/' + source) or n == source)
        (OUT / dest).write_bytes(z.read(member))

voice_source = SOURCE / 'Weapon enhanced.wav'
with wave.open(str(voice_source)) as wav:
    duration = wav.getnframes() / wav.getframerate()
voice_manifest = {
    'status': 'source-content-mismatch',
    'source': voice_source.name,
    'sha256': hashlib.sha256(voice_source.read_bytes()).hexdigest(),
    'durationSeconds': duration,
    'verification': 'Local faster-whisper tiny.en CPU transcription; not a human listening test.',
    'detectedContent': 'Hold, traveler! Not another step! The northern pass is sealed by order of the High Council ... You need to run. Now!',
    'reason': 'All seven user-supplied WAV names contain identical fantasy NPC dialogue, not the seven requested game announcements. No misleading phrase cuts were produced.',
    'fallback': 'English device SpeechSynthesis plus distinct SFX and visible text.',
    'phrases': [
        {'key': key, 'text': text, 'recordedUrl': None}
        for key, text in [
            ('weapon', 'Weapon enhanced'), ('missile', 'Missiles online'),
            ('drone', 'Drone deployed'), ('shield', 'Shield online'),
            ('repair', 'Hull repaired'), ('energy', 'EMP charging'),
            ('ready', 'EMP ready')
        ]
    ],
}
(OUT / 'voice-manifest.json').write_text(json.dumps(voice_manifest, indent=2), encoding='utf-8')
print(json.dumps({'music': list(MUSIC), 'sfx': list(SFX), 'voiceStatus': voice_manifest['status']}))
