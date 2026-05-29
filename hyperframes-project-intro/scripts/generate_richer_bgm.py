import math
import random
import struct
import wave

SAMPLE_RATE = 48_000
DURATION = 15.0
TOTAL = int(SAMPLE_RATE * DURATION)
random.seed(20260511)


def midi_to_hz(note):
    return 440.0 * (2 ** ((note - 69) / 12))


def env_adsr(t, start, dur, attack=0.04, decay=0.15, sustain=0.7, release=0.18):
    x = t - start
    if x < 0 or x > dur:
        return 0.0
    if x < attack:
        return x / max(attack, 1e-6)
    if x < attack + decay:
        k = (x - attack) / max(decay, 1e-6)
        return 1.0 + (sustain - 1.0) * k
    if x > dur - release:
        return sustain * max(0.0, (dur - x) / max(release, 1e-6))
    return sustain


def soft_clip(x):
    return math.tanh(x * 1.35) / 1.35


def sine(freq, t, phase=0.0):
    return math.sin(2 * math.pi * freq * t + phase)


def tri(freq, t):
    p = (freq * t) % 1.0
    return 4.0 * abs(p - 0.5) - 1.0


def add_tone(buf_l, buf_r, start, dur, freq, amp, pan=0.0, wave_shape="sine", attack=0.04, release=0.18):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    left_gain = math.sqrt((1 - pan) * 0.5)
    right_gain = math.sqrt((1 + pan) * 0.5)
    phase = random.random() * math.tau
    for i in range(first, last):
        t = i / SAMPLE_RATE
        e = env_adsr(t, start, dur, attack=attack, decay=0.18, sustain=0.66, release=release)
        if wave_shape == "tri":
            s = tri(freq, t + phase / math.tau)
        else:
            s = sine(freq, t, phase)
        s += 0.35 * sine(freq * 2.0, t, phase * 0.7)
        s += 0.18 * sine(freq * 3.0, t, phase * 0.3)
        s *= amp * e
        buf_l[i] += s * left_gain
        buf_r[i] += s * right_gain


def add_noise_hit(buf_l, buf_r, start, dur, amp, pan=0.0, tone=0.0):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    left_gain = math.sqrt((1 - pan) * 0.5)
    right_gain = math.sqrt((1 + pan) * 0.5)
    prev = 0.0
    for i in range(first, last):
        t = (i - first) / SAMPLE_RATE
        decay = math.exp(-t * 28.0)
        n = random.uniform(-1.0, 1.0)
        prev = 0.82 * prev + 0.18 * n
        body = sine(86 + tone, t) * math.exp(-t * 22.0)
        s = (0.75 * prev + 0.55 * body) * decay * amp
        buf_l[i] += s * left_gain
        buf_r[i] += s * right_gain


def add_riser(buf_l, buf_r, start, dur, amp):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(TOTAL, int((start + dur) * SAMPLE_RATE))
    phase = 0.0
    for i in range(first, last):
        x = (i - first) / max(1, last - first)
        freq = 320 + 1320 * (x ** 1.7)
        phase += math.tau * freq / SAMPLE_RATE
        e = math.sin(math.pi * x) ** 0.7
        shimmer = sine(freq * 2.01, i / SAMPLE_RATE) * 0.25
        s = (math.sin(phase) + shimmer) * amp * e
        pan = math.sin(x * math.tau) * 0.28
        buf_l[i] += s * math.sqrt((1 - pan) * 0.5)
        buf_r[i] += s * math.sqrt((1 + pan) * 0.5)


left = [0.0] * TOTAL
right = [0.0] * TOTAL

# 96 BPM. Four short musical sections aligned to the video scenes.
beat = 60.0 / 96.0
chords = [
    (0.0, [40, 47, 52, 55]),   # E minor
    (3.75, [36, 43, 48, 52]),  # C major
    (7.5, [43, 50, 55, 59]),   # G major
    (11.25, [38, 45, 50, 54]), # D sus / resolve
]

for start, notes in chords:
    for idx, note in enumerate(notes):
        add_tone(left, right, start, 3.9, midi_to_hz(note), 0.035, pan=-0.38 + idx * 0.25, wave_shape="tri", attack=0.7, release=0.9)
        add_tone(left, right, start + 0.12, 3.65, midi_to_hz(note + 12), 0.016, pan=0.34 - idx * 0.18, attack=0.9, release=0.9)

arp_notes = [52, 55, 59, 62, 64, 62, 59, 55, 48, 52, 55, 59, 62, 67, 64, 62]
for n in range(int(DURATION / (beat / 2))):
    start = 0.72 + n * (beat / 2)
    if start > 14.35:
        break
    note = arp_notes[n % len(arp_notes)]
    if start > 7.5:
        note += 2
    amp = 0.018 if start < 3.6 else 0.026
    pan = -0.42 if n % 2 == 0 else 0.42
    add_tone(left, right, start, 0.36, midi_to_hz(note), amp, pan=pan, attack=0.012, release=0.12)

for n in range(24):
    start = n * beat
    if start < 14.4:
        add_noise_hit(left, right, start, 0.18, 0.055, pan=-0.05, tone=-10)
    hat_time = start + beat / 2
    if 3.3 < hat_time < 14.2:
        add_noise_hit(left, right, hat_time, 0.055, 0.018, pan=0.28, tone=480)

for t0 in [3.25, 7.15, 11.0, 13.75]:
    add_riser(left, right, t0, 0.7 if t0 < 13 else 1.0, 0.014)

# Gentle master fade and widening.
peak = 0.0
for i in range(TOTAL):
    t = i / SAMPLE_RATE
    fade_in = min(1.0, t / 0.8)
    fade_out = min(1.0, max(0.0, (DURATION - t) / 1.15))
    master = fade_in * fade_out
    side = (left[i] - right[i]) * 0.16
    mid = (left[i] + right[i]) * 0.5
    left[i] = soft_clip((mid + side) * master * 1.55)
    right[i] = soft_clip((mid - side) * master * 1.55)
    peak = max(peak, abs(left[i]), abs(right[i]))

scale = 0.86 / max(peak, 1e-6)
with wave.open("audio/yaotu-richer-tech-bgm.wav", "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    for l, r in zip(left, right):
        wav.writeframes(struct.pack("<hh", int(l * scale * 32767), int(r * scale * 32767)))
