# `models/audio/`: in-room audio encoder and front end

**Pseudo-labelling loop.** The lab's log-mel front end (`frontend.py`, imported everywhere so its parameters never drift) and the audio encoder, trained self-supervised on the room's own recordings and then as the student each pseudo-label generation. Pretrained audio models do not go here; they are baselines in `eval/baselines/`.

Read first:
- [03-mel-spectrograms.html](../../docs/concepts/03-mel-spectrograms.html#code)
- [07-embeddings-ssl.html](../../docs/concepts/07-embeddings-ssl.html)

See [Project ideas](../../docs/project-ideas.html) for the full plan.
