"""Render original, deterministic nonverbal laser cues for Tactical Neon.

Uses analytical oscillators and seeded noise, never generative audio or copied
game sounds. The supplied Sci-Fi Weapon Sounds archive was inspected but is not
used: its README states that the samples were generated with ElevenLabs.

Run with Python3 + NumPy. Outputs only runtime WAVs and recipe/provenance data.
"""
from pathlib import Path
import hashlib
import json
import math
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/tactical-remake/audio'
RATE = 22050
PEAK = .80


def envelope(time, duration, attack, release):
    """Cosine fades have zero slope at the ends, preventing clicky tails."""
    head = .5 - .5 * np.cos(np.pi * np.clip(time / attack, 0, 1))
    tail = .5 - .5 * np.cos(np.pi * np.clip((duration - time) / release, 0, 1))
    return head * tail


def colored_noise(length, seed):
    rng = np.random.default_rng(seed)
    raw = rng.uniform(-1, 1, length)
    smooth = np.convolve(raw, np.ones(5) / 5, mode='same')
    slow = np.convolve(smooth, np.ones(65) / 65, mode='same')
    return smooth - slow


def charge():
    duration = 1.2
    t = np.arange(round(RATE * duration), dtype=np.float64) / RATE
    # Continuous110→1320Hz rise, with readable beating rather than speech or a
    # familiar three-note alarm. Harmonics brighten towards the firing moment.
    phase = 2 * np.pi * (110 * t + (1210 / (2 * duration)) * t * t)
    growth = t / duration
    pulse = .62 + .38 * np.sin(2 * np.pi * (1.8 * t + 2.6 * t * t)) ** 2
    harmonics = (.25 * np.sin(phase) + .095 * np.sin(2 * phase + .2)
                 + .045 * growth * np.sin(3 * phase))
    hum = .085 * np.sin(2 * np.pi * 55 * t) * (.3 + .7 * growth)
    air = .075 * colored_noise(len(t), 49201) * growth
    data = (harmonics * pulse * (.42 + .58 * growth) + hum + air)
    return data * envelope(t, duration, .018, .085), {
        'durationSeconds': duration,
        'role': 'A rising electrical charge warning before the hostile beam.',
        'recipe': '110→1320Hz analytic chirp with second/third harmonics,55Hz hum, accelerating amplitude pulse and seeded filtered noise;18ms attack,85ms cosine release.',
        'seed': 49201,
    }


def firing():
    duration = 1.4
    t = np.arange(round(RATE * duration), dtype=np.float64) / RATE
    # Heavier, lower and wider than the warning: a short kick followed by a
    # sustained electrical beam. No sharp square wave or ultrasonic content.
    kick_phase = 2 * np.pi * (45 * t + 11 * (1 - np.exp(-11 * t)))
    kick = .28 * np.sin(kick_phase) * np.exp(-13 * t)
    bass = .12 * np.sin(2 * np.pi * 64 * t)
    mid = .19 * np.sin(2 * np.pi * 275 * t + 1.5 * np.sin(2 * np.pi * 73 * t))
    edge = .075 * np.sin(2 * np.pi * 815 * t + .75 * np.sin(2 * np.pi * 113 * t))
    texture = .29 * colored_noise(len(t), 49202)
    tremolo = .82 + .18 * np.sin(2 * np.pi * 18 * t) ** 2
    data = kick + (bass + mid + edge + texture) * tremolo
    return data * envelope(t, duration, .008, .32), {
        'durationSeconds': duration,
        'role': 'A low-impact onset and sustained electric beam, distinct from the rising warning.',
        'recipe': 'Exponentially falling kick,64Hz bass,275Hz/73Hz FM body,815Hz/113Hz FM edge, seeded filtered noise and18Hz amplitude texture;8ms attack,320ms cosine release.',
        'seed': 49202,
    }


def write(name, signal, metadata):
    magnitude = float(np.max(np.abs(signal)))
    if not math.isfinite(magnitude) or magnitude <= 0:
        raise ValueError('Audio signal must be finite and non-silent')
    signal = signal * PEAK / magnitude
    signal[0] = signal[-1] = 0
    pcm = np.rint(signal * 32767).astype('<i2')
    path = OUT / name
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    decoded = pcm.astype(np.float64) / 32767
    peak = float(np.max(np.abs(decoded)))
    assert peak <= .85
    assert pcm[0] == pcm[-1] == 0
    assert len(pcm) == round(metadata['durationSeconds'] * RATE)
    metadata.update({
        'file': name,
        'sampleRate': RATE,
        'channels': 1,
        'sampleFormat': 'PCM16 little-endian',
        'sampleCount': len(pcm),
        'durationSeconds': len(pcm) / RATE,
        'peak': peak,
        'rms': float(np.sqrt(np.mean(decoded * decoded))),
        'bytes': path.stat().st_size,
        'firstSample': int(pcm[0]),
        'lastSample': int(pcm[-1]),
        'last20msPeak': float(np.max(np.abs(decoded[-round(RATE * .02):]))),
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    })
    return metadata


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    entries = [write(name, *renderer()) for name, renderer in [
        ('laser-charge.wav', charge), ('laser-fire.wav', firing),
    ]]
    manifest = {
        'generation': 'Original deterministic DSP: analytical oscillators and seeded filtered noise.',
        'generativeAudioUsed': False,
        'recordedSamplesUsed': False,
        'copiedGameAudioUsed': False,
        'files': entries,
        'verification': 'Numerical PCM decode, duration/peak/endpoint assertions. Not a human listening test.',
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    (OUT / 'CREDITS.txt').write_text(
        'Tactical Neon laser cues — original deterministic synthesis for Gyro Space Combat.\n'
        'laser-charge.wav and laser-fire.wav were rendered with analytical oscillators, mathematical envelopes and seeded filtered noise.\n'
        'No generative audio service, voice recording, pre-existing sound sample or copied Metal Gear/game sound is used.\n'
        'Recipe/source: scripts/prepare-tactical-audio.py; per-file duration, peak, RMS, seed and SHA256 are in manifest.json.\n'
        'These two original rendered sounds and their synthesis recipe are dedicated to CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/\n'
        '\nInspected but NOT used: supplied free-scifi-weapons-sounds-audio.zip. Its README permits game use/public project repositories, but states that the samples were generated with ElevenLabs Sound Effects and then edited by hand. The current task requests no AI-derived audio, so none of those sample bytes are included in these cues.\n'
        '\nFormat:22050Hz mono PCM16 WAV. Each file is peak-normalized to0.80 with cosine attack/release and zero-valued endpoints.\n',
        encoding='utf-8',
    )
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
