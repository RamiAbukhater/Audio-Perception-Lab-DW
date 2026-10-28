# `pipeline/bootstrap/`: clustering and co-occurrence proposals

**Pseudo-labelling loop.** Embeds and clusters audio windows, and proposes a pseudo-label when a cluster co-occurs with a named object far more often than chance. Every proposal is passed to the spatial gate in `core/physics_fusion/` before it can be used.

Read first:
- [07-embeddings-ssl.html](../../docs/concepts/07-embeddings-ssl.html)
- [08-cross-modal-pseudo-labels.html](../../docs/concepts/08-cross-modal-pseudo-labels.html#gate)

See [Project ideas](../../docs/project-ideas.html) for the full plan.
