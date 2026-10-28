# `models/vision/`: visual naming

**Pseudo-labelling loop.** Wraps a frozen open-vocabulary object detector (for example YOLO-World) with tracking, so each detection has a name from a text vocabulary, a persistent object id (`microwave #1`, `microwave #2`), and a 3-D position from depth.

Read first:
- [08-cross-modal-pseudo-labels.html](../../docs/concepts/08-cross-modal-pseudo-labels.html#yolo)

Ultralytics YOLO models (including YOLO-World) are licensed AGPL-3.0.

See [Project ideas](../../docs/project-ideas.html) for the full plan.
