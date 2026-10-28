"""Smoke test for the DataWorks Audio Perception Lab environment.

Run from the repository root:  python scripts/smoke_test.py
It synthesises a test clip, writes and reads a WAV file, computes the lab's
log-mel front end, runs a tiny CNN forward pass, checks GCC-PHAT on a known
delay, and saves a spectrogram to smoke_test.png. Optional packages are
reported but not required.
"""
import importlib
import sys

import numpy as np


def check_optional(names):
    for name in names:
        try:
            mod = importlib.import_module(name)
            print(f"  ok       {name} {getattr(mod, '__version__', '')}")
        except Exception as exc:  # missing or broken optional dependency
            print(f"  missing  {name} ({type(exc).__name__})")


def main():
    print(f"Python {sys.version.split()[0]}")
    import scipy.io.wavfile as wavfile
    import torch
    import torchaudio
    import torchaudio.transforms as T
    print(f"  ok       numpy {np.__version__}, torch {torch.__version__}, torchaudio {torchaudio.__version__}")
    print("Optional packages:")
    check_optional(["soundfile", "librosa", "sklearn", "pyroomacoustics", "open3d", "ultralytics"])

    # 1. synthesise 2 s at 16 kHz: a chirp plus coloured noise at 10 dB SNR
    sr = 16_000
    t = np.arange(2 * sr) / sr
    clean = 0.5 * np.sin(2 * np.pi * (300 * t + 900 * t ** 2))
    rng = np.random.default_rng(0)
    noise = np.cumsum(rng.standard_normal(len(t)))          # random walk: low-frequency-heavy noise
    noise -= np.convolve(noise, np.ones(64) / 64, mode="same")   # remove the slow drift
    scale = np.sqrt(np.mean(clean ** 2) / (np.mean(noise ** 2) * 10 ** (10 / 10)))
    mix = (clean + scale * noise).astype(np.float32)
    snr = 10 * np.log10(np.mean(clean ** 2) / np.mean((scale * noise) ** 2))
    print(f"[1] mixed at {snr:.2f} dB SNR (target 10.00)")

    # 2. WAV round trip as 16-bit integers
    wavfile.write("smoke_test.wav", sr, (mix / np.max(np.abs(mix)) * 32767).astype(np.int16))
    sr_read, data = wavfile.read("smoke_test.wav")
    assert sr_read == sr and data.dtype == np.int16
    print(f"[2] wrote and read smoke_test.wav: {data.shape[0]} samples at {sr_read} Hz")

    # 3. the lab's log-mel front end
    mel = T.MelSpectrogram(sample_rate=sr, n_fft=1024, hop_length=320, n_mels=64, f_min=20, f_max=8000, power=2.0)
    logmel = T.AmplitudeToDB(stype="power", top_db=80)(mel(torch.from_numpy(mix)[None]))
    assert logmel.shape == (1, 64, 101), logmel.shape
    print(f"[3] log-mel shape {tuple(logmel.shape)}")

    # 4. tiny CNN forward pass
    net = torch.nn.Sequential(
        torch.nn.Conv2d(1, 16, 3, stride=2, padding=1), torch.nn.ReLU(),
        torch.nn.Conv2d(16, 16, 3, stride=2, padding=1, groups=16), torch.nn.Conv2d(16, 32, 1), torch.nn.ReLU(),
        torch.nn.AdaptiveAvgPool2d(1), torch.nn.Flatten(), torch.nn.Linear(32, 10),
    )
    logits = net(logmel[None])
    assert logits.shape == (1, 10)
    print(f"[4] CNN forward pass ok, {sum(p.numel() for p in net.parameters())} parameters")

    # 5. GCC-PHAT recovers a known 5-sample delay
    ref = rng.standard_normal(sr)
    sig = np.concatenate([np.zeros(5), ref[:-5]])
    n = len(sig) + len(ref)
    R = np.fft.rfft(sig, n) * np.conj(np.fft.rfft(ref, n))
    cc = np.fft.irfft(R / (np.abs(R) + 1e-15), n)
    cc = np.concatenate((cc[-20:], cc[:21]))
    lag = int(np.argmax(np.abs(cc))) - 20
    assert lag == 5, lag
    print(f"[5] GCC-PHAT found a delay of {lag} samples (expected 5)")

    # 6. save a spectrogram figure
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.figure(figsize=(8, 3))
    plt.imshow(logmel[0].numpy(), origin="lower", aspect="auto", extent=[0, 2, 0, 64])
    plt.xlabel("time (s)"); plt.ylabel("mel band"); plt.title("Smoke test: chirp in noise"); plt.colorbar(label="dB")
    plt.tight_layout(); plt.savefig("smoke_test.png", dpi=120)
    print("[6] saved smoke_test.png")
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
