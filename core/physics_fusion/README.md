# `core/physics_fusion/`: the spatial gate

**Spatial gate.** Decides whether a pseudo-label is believable: does the sound's direction point at the proposed object (and that instance), is the line of sight clear, and if the strongest arrival is a wall, is it an echo of that object (mirror sources)? Returns keep or reject with a reason; rejected out-of-view windows feed the out-of-view test.

Read first:
- [11-room-acoustics-occlusion.html](../../docs/concepts/11-room-acoustics-occlusion.html#fusion)

See [Project ideas](../../docs/project-ideas.html) for the full plan.
