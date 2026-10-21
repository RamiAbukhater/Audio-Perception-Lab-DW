# `data/`: Data pipeline

**Module 1.** Scripts that process datasets (for example UrbanSound8K) and apply synthetic augmentations: pink and white noise injection, room impulse response (RIR) reverberation, and dynamic gain drops. Also builds the fixed, saved stress-test sets used by `eval/`.

Read first:
- [01-digital-audio.html](../docs/concepts/01-digital-audio.html)
- [04-noise-reverb-augmentation.html](../docs/concepts/04-noise-reverb-augmentation.html)
- [05-audio-cnns.html](../docs/concepts/05-audio-cnns.html)

Datasets themselves live outside the repository (for example `~/datasets/UrbanSound8K`); point scripts at them with an environment variable such as `US8K_ROOT`. Never commit audio.

See [Project ideas](../docs/project-ideas.html) for the full module outline.
