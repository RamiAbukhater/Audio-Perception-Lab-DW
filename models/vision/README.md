# `models/vision/`: Visual object detection wrapper

**Module 1.** Wraps a frozen object detector (for example YOLOv8) to extract bounding boxes and semantic class labels (`microwave`, `keyboard`, `doorbell`) from the visual stream.

Read first:
- [08-cross-modal-pseudo-labels.html](../../docs/concepts/08-cross-modal-pseudo-labels.html#yolo)

Ultralytics YOLOv8 is licensed AGPL-3.0. COCO's classes do not include `doorbell`; see the concept page for options.

See [Project ideas](../../docs/project-ideas.html) for the full module outline.
