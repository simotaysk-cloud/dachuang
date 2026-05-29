import math
import random
import struct
import wave

SAMPLE_RATE = 48_000
DURATION = 15.0
TOTAL = int(SAMPLE_RATE * DURATION)
random.seed(314159)


def midi_to_hz(note):
    return 440.0 * (2 ** ((note - 69) / 12))


def sine(freq, t, phase=0.0):
    return math.sin(2 * math.pi * freq * t + phase)


def env_pluck(t, start, dur, attack=0.012, decay=1.15):
    x = t - start
    if x < 0 or x > dur:
        return 0.0
    a = min(1.0, x / attack)
    r = math.exp(-x * decay)
    out = a * r
    if x > dur - 0.12:
        out *= max(0.0, (dur - x) / 0.12)
    return out


def env_pad(t, start, dur):
    x = t - start
    if x < 0 or x > dur:
        return 0.0
    fade_in = min(1.0, x / 0.9)
    fade_out = min(1.0, (dur - x) / 0.9)
    return min(fade_in, fade_out) * 0.78


def soft_clip(x):
    return math.tanh(x * 1.18) / 1.18


def add_pluck(left, right, start, note, dur=1.55, amp=0.08, pan=0.0):
    freq = midi_to_hz(note)
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    phase = random.random() * math.tau
    lg = math.sqrt((1 - pan) * 0.5)
    rg = math.sqrt((1 + pan) * 0.5)
    for i in range(first, last):
        t = i / SAMPLE_RATE
        e = env_pluck(t, start, dur)
        body = sine(freq, t, phase)
        body += 0.42 * sine(freq * 2.004, t, phase * 0.6)
        body += 0.18 * sine(freq * 3.01, t, phase * 0.2)
        bell = 0.15 * sine(freq * 5.02, t, phase * 1.3)
        s = (body + bell) * amp * e
        left[i] += s * lg
        right[i] += s * rg


def add_pad(left, right, start, notes, dur=3.9, amp=0.034):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    freqs = [midi_to_hz(n) for n in notes]
    phases = [random.random() * math.tau for _ in freqs]
    for i in range(first, last):
        t = i / SAMPLE_RATE
        e = env_pad(t, start, dur)
        s = 0.0
        for idx, freq in enumerate(freqs):
            drift = 1.0 + 0.0025 * sine(0.13 + idx * 0.03, t)
            s += sine(freq * drift, t, phases[idx]) * (1 / len(freqs))
            s += 0.25 * sine(freq * 2.0 * drift, t, phases[idx] * 0.5) * (1 / len(freqs))
        side = 0.22 * sine(0.19, t)
        left[i] += s * amp * e * (0.8 + side)
        right[i] += s * amp * e * (0.8 - side)


def add_soft_tick(left, right, start, amp=0.018, pan=0.0):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + 0.12) * SAMPLE_RATE))
    lg = math.sqrt((1 - pan) * 0.5)
    rg = math.sqrt((1 + pan) * 0.5)
    prev = 0.0
    for i in range(first, last):
        x = (i - first) / SAMPLE_RATE
        prev = 0.68 * prev + 0.32 * random.uniform(-1.0, 1.0)
        e = math.exp(-x * 34.0)
        s = (prev * 0.65 + sine(920, x) * 0.22) * amp * e
        left[i] += s * lg
        right[i] += s * rg


def add_transition(left, right, start, dur=0.9, amp=0.016):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    phase = 0.0
    for i in range(first, last):
        x = (i - first) / max(1, last - first)
        freq = 480 + 720 * x
        phase += math.tau * freq / SAMPLE_RATE
        e = math.sin(math.pi * x) ** 0.8
        s = (math.sin(phase) + 0.3 * sine(freq * 1.5, i / SAMPLE_RATE)) * amp * e
        left[i] += s * (0.7 - 0.18 * x)
        right[i] += s * (0.7 + 0.18 * x)


left = [0.0] * TOTAL
right = [0.0] * TOTAL

# Warm, math-explainer style harmonic motion. Original composition.
sections = [
    (0.0, [53, 57, 60, 64]),    # Fmaj7
    (3.75, [48, 52, 55, 59]),   # Cmaj7
    (7.5, [50, 53, 57, 62]),    # Dm add9
    (11.25, [55, 59, 62, 65]),  # G7sus color
]

for start, chord in sections:
    add_pad(left, right, start, chord, dur=4.0, amp=0.038)

motif = [72, 76, 79, 83, 81, 79, 76, 72, 69, 72, 76, 79, 84, 83, 79, 76]
beat = 60.0 / 92.0
for i in range(24):
    t = 0.55 + i * beat * 0.5
    note = motif[i % len(motif)]
    if 7.5 <= t < 11.25:
        note -= 2
    if t >= 11.25:
        note += 2
    pan = -0.32 if i % 2 == 0 else 0.32
    add_pluck(left, right, t, note, dur=1.15, amp=0.052, pan=pan)

# Sparse lower piano punctuation.
for t, n in [(0.25, 41), (2.2, 48), (3.75, 36), (5.9, 43), (7.5, 38), (9.75, 45), (11.25, 43), (13.15, 50)]:
    add_pluck(left, right, t, n, dur=2.0, amp=0.06, pan=-0.08)

# Subtle ticks give motion without sounding like corporate drums.
for i in range(20):
    t = 2.1 + i * beat
    if t < 14.2:
        add_soft_tick(left, right, t, amp=0.012, pan=0.22 if i % 2 else -0.22)

for t in [3.25, 7.1, 10.95, 13.8]:
    add_transition(left, right, t, dur=0.82 if t < 13 else 0.95)

peak = 0.0
for i in range(TOTAL):
    t = i / SAMPLE_RATE
    fade_in = min(1.0, t / 0.55)
    fade_out = min(1.0, max(0.0, (DURATION - t) / 1.0))
    master = fade_in * fade_out
    left[i] = soft_clip(left[i] * master * 1.35)
    right[i] = soft_clip(right[i] * master * 1.35)
    peak = max(peak, abs(left[i]), abs(right[i]))

scale = 0.9 / max(peak, 1e-6)
with wave.open("audio/yaotu-math-explainer-bgm.wav", "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    for l, r in zip(left, right):
        wav.writeframes(struct.pack("<hh", int(l * scale * 32767), int(r * scale * 32767)))
