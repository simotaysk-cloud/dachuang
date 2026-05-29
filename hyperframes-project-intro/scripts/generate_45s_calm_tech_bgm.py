import math
import random
import struct
import wave

SAMPLE_RATE = 48_000
DURATION = 45.0
TOTAL = int(SAMPLE_RATE * DURATION)
random.seed(20260512)


def midi_to_hz(note):
    return 440.0 * (2 ** ((note - 69) / 12))


def sine(freq, t, phase=0.0):
    return math.sin(2 * math.pi * freq * t + phase)


def tri(freq, t):
    p = (freq * t) % 1.0
    return 4.0 * abs(p - 0.5) - 1.0


def env(t, start, dur, attack=0.6, release=0.8):
    x = t - start
    if x < 0 or x > dur:
        return 0.0
    if x < attack:
        return x / max(attack, 1e-6)
    if x > dur - release:
        return max(0.0, (dur - x) / max(release, 1e-6))
    return 1.0


def soft_clip(x):
    return math.tanh(x * 1.25) / 1.25


def add_tone(left, right, start, dur, note, amp, pan=0.0, shape="sine", attack=0.08, release=0.35):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    freq = midi_to_hz(note)
    phase = random.random() * math.tau
    lg = math.sqrt((1 - pan) * 0.5)
    rg = math.sqrt((1 + pan) * 0.5)
    for i in range(first, last):
        t = i / SAMPLE_RATE
        e = env(t, start, dur, attack, release)
        if shape == "tri":
            s = tri(freq, t + phase / math.tau)
        else:
            s = sine(freq, t, phase)
        s += 0.23 * sine(freq * 2.0, t, phase * 0.7)
        s += 0.12 * sine(freq * 3.0, t, phase * 0.3)
        s *= amp * e
        left[i] += s * lg
        right[i] += s * rg


def add_noise_hit(left, right, start, dur, amp, pan=0.0, tone=0.0):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    lg = math.sqrt((1 - pan) * 0.5)
    rg = math.sqrt((1 + pan) * 0.5)
    prev = 0.0
    for i in range(first, last):
        t = (i - first) / SAMPLE_RATE
        decay = math.exp(-t * 22.0)
        n = random.uniform(-1.0, 1.0)
        prev = 0.86 * prev + 0.14 * n
        body = sine(78 + tone, t) * math.exp(-t * 18.0)
        s = (0.62 * prev + 0.48 * body) * decay * amp
        left[i] += s * lg
        right[i] += s * rg


def add_riser(left, right, start, dur, amp):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    phase = 0.0
    for i in range(first, last):
        x = (i - first) / max(1, last - first)
        freq = 240 + 1180 * (x ** 1.55)
        phase += math.tau * freq / SAMPLE_RATE
        e = math.sin(math.pi * x) ** 0.72
        shimmer = sine(freq * 1.995, i / SAMPLE_RATE) * 0.22
        s = (math.sin(phase) + shimmer) * amp * e
        pan = math.sin(x * math.tau) * 0.24
        left[i] += s * math.sqrt((1 - pan) * 0.5)
        right[i] += s * math.sqrt((1 + pan) * 0.5)


left = [0.0] * TOTAL
right = [0.0] * TOTAL
beat = 60.0 / 88.0

sections = [
    (0.0, [40, 47, 52, 55]),
    (5.3, [36, 43, 48, 52]),
    (10.9, [43, 50, 55, 59]),
    (16.8, [38, 45, 50, 54]),
    (22.7, [40, 47, 52, 57]),
    (28.7, [35, 42, 47, 50]),
    (34.5, [43, 50, 55, 62]),
    (40.4, [40, 47, 52, 55]),
]

for start, notes in sections:
    dur = 5.7 if start < 40 else 4.6
    for idx, note in enumerate(notes):
        add_tone(left, right, start, dur, note, 0.026, pan=-0.36 + idx * 0.24, shape="tri", attack=0.9, release=1.2)
        add_tone(left, right, start + 0.16, dur - 0.18, note + 12, 0.011, pan=0.32 - idx * 0.17, attack=1.0, release=1.1)

arp = [52, 55, 59, 62, 64, 62, 59, 55, 50, 52, 55, 59, 62, 67, 64, 62]
for n in range(int(DURATION / (beat / 2))):
    start = 0.8 + n * (beat / 2)
    if start > 44.15:
        break
    note = arp[n % len(arp)]
    if 22 < start < 34:
        note += 2
    if start > 34:
        note += 5
    amp = 0.014 if start < 10.5 else 0.019
    pan = -0.38 if n % 2 == 0 else 0.38
    add_tone(left, right, start, 0.32, note, amp, pan=pan, attack=0.012, release=0.11)

for n in range(int(DURATION / beat) + 1):
    start = n * beat
    if start < 44.3:
        add_noise_hit(left, right, start, 0.18, 0.038, pan=-0.04, tone=-6)
    hat = start + beat / 2
    if 5.0 < hat < 44.2:
        add_noise_hit(left, right, hat, 0.05, 0.012, pan=0.26, tone=440)

for t0 in [5.0, 10.55, 16.45, 22.35, 28.3, 34.15, 40.08, 43.15]:
    add_riser(left, right, t0, 0.78 if t0 < 40 else 1.05, 0.011)

peak = 0.0
for i in range(TOTAL):
    t = i / SAMPLE_RATE
    fade_in = min(1.0, t / 1.2)
    fade_out = min(1.0, max(0.0, (DURATION - t) / 1.5))
    master = fade_in * fade_out
    side = (left[i] - right[i]) * 0.18
    mid = (left[i] + right[i]) * 0.5
    left[i] = soft_clip((mid + side) * master * 1.72)
    right[i] = soft_clip((mid - side) * master * 1.72)
    peak = max(peak, abs(left[i]), abs(right[i]))

scale = 0.86 / max(peak, 1e-6)
with wave.open("audio/yaotu-intro-45s-calm-tech.wav", "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    for l, r in zip(left, right):
        wav.writeframes(struct.pack("<hh", int(l * scale * 32767), int(r * scale * 32767)))
