# DataWorks Audio Perception Lab

A UCSD DataWorks research lab on audio for perception. Our project teaches an audio model the sounds that pretrained models such as CLAP miss, using a camera instead of a person, with a microphone array and a 3-D room map checking which object really made each sound.

**Lab lead:** Rami Abukhater.

> **AI-generated content.** The course site's pages, the folder READMEs, and the smoke test were written with Claude, an AI model, and may contain inaccuracies or mistakes. If something looks wrong, please point it out to Rami so it can be fixed.

This repository holds the research code for the lab's project and a static website that teaches the concepts every member needs:

- **Setup**: Python 3.11, the lab's libraries, GPU notebooks, data, and a smoke test (`scripts/smoke_test.py`) that must pass before anything else.
- **Six core concept pages for everyone**: digital audio; the Fourier transform and STFT; log-mel spectrograms; noise, SNR, reverberation, and augmentation; CNNs on spectrograms; evaluation and experimental rigor.
- **Five project concept pages**: embeddings and self-supervised learning, and cross-modal pseudo-labelling (the pseudo-labelling loop); microphone arrays and GCC-PHAT, RGB-D point clouds and room geometry, and room acoustics with mirror sources and the spatial gate (the spatial gate).
- **Project ideas**: the full blueprint, opening with the closest prior work (Listen Learner, VAX, ProtoSound, and others) and what is still open, then the system, the baselines it must beat, a suggested path, the key result, extensions, and how the work splits.
- **UCSD faculty to contact**: eight professors whose work overlaps the project, each with their lab, email, and three papers to read first.
- **Resources and glossary**: datasets, libraries, papers, courses, and terms.

Each concept page opens with a short list of key papers, then has the intuition, the math, diagrams, copyable code with tensor shapes, click-to-reveal questions, and common mistakes. Six pages include interactive demos (aliasing, the STFT window trade-off, mel filterbanks, SNR mixing with audio playback, two-mic delay geometry, and a draggable mirror-source room with occlusion).

## The project

**Hearing what pretrained models can't: spatially verified pseudo-labels from a camera.** In a fixed indoor space, a camera with an open-vocabulary detector names the objects and actions around each sound, and a spatial gate (microphone-array direction of arrival checked against a 3-D room map, with line-of-sight and echo checks) decides which visible object made it before the label is trusted. An audio model trained only on the room's own recordings learns from the verified labels, and is compared against CLAP zero-shot, an open-vocabulary sound event detector, camera labels without the gate, and a one-human-label-per-class baseline, on the sounds pretrained models get wrong.

| Part | Folders |
| --- | --- |
| Pseudo-labelling loop | `core/sync/`, `models/vision/`, `models/audio/`, `pipeline/bootstrap/`, `training/` |
| Spatial gate | `dsp/doa/`, `spatial/mapping/`, `core/physics_fusion/`, `eval/ssl/` |
| Baselines | `eval/baselines/` |

Details, including the closest prior work and how the work splits: [`docs/project-ideas.html`](docs/project-ideas.html). Each folder also has a short README.

## Viewing the site

**Locally.** Open `docs/index.html` in a browser. Every link is relative, so the site works straight from the file system. Fonts, KaTeX (math), and Prism (code highlighting) load from CDNs, so you need to be online for those. If your browser blocks scripts on `file://` pages, serve the folder instead:

```bash
python3 -m http.server 8000 --directory docs
```

and open <http://localhost:8000>.

**On GitHub Pages.** The site is plain HTML in `docs/`, so no build step or Actions workflow is needed.

1. Push this repository to GitHub.
2. Go to the repository's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to `/docs`, then click **Save**.
5. After a minute or so the page shows the site's address, usually `https://<user-or-org>.github.io/dataworks-audio-perception-lab/`.

`docs/.nojekyll` tells GitHub Pages to serve the files as they are, without Jekyll processing.

## Getting started

```bash
uv venv --python 3.11 && source .venv/bin/activate
uv pip install -r requirements.txt
python scripts/smoke_test.py
```

Conda works too; see the [setup page](docs/setup.html). `requirements.txt` is grouped by part of the project, so you can skip a heavy dependency (Open3D, Ultralytics) until your part needs it.

## Repository layout

```
README.md               this file
LICENSE                 MIT for code, CC BY 4.0 for written content
requirements.txt        Python dependencies, grouped by part of the project
scripts/
  smoke_test.py         environment check: SNR mixing, WAV I/O, log-mel, CNN, GCC-PHAT
notebooks/              exploration notebooks (name-part-topic.ipynb)

core/sync/              Loop  synchronised mic-array + RGB-D capture, calibration
models/vision/          Loop  open-vocabulary detector + tracking, 3-D object positions
models/audio/           Loop  log-mel front end, in-room audio encoder and student
pipeline/bootstrap/     Loop  clustering and co-occurrence label proposals
training/               Loop  iterative self-training on gated labels
dsp/doa/                Gate  GCC-PHAT / SRP-PHAT direction of arrival
spatial/mapping/        Gate  RGB-D point cloud, walls, doorways, ray casting
core/physics_fusion/    Gate  the spatial gate: direction, line of sight, echoes
eval/ssl/               Gate  gate on/off precision and coverage, angular error
eval/baselines/         Eval  CLAP, open-vocabulary SED, no-gate, one-human-label baselines

docs/                   the website (GitHub Pages serves this folder)
  index.html            home
  setup.html            environment setup
  concepts/             01-digital-audio.html … 11-room-acoustics-occlusion.html
  project-ideas.html    the project blueprint
  faculty.html          UCSD professors to contact, with labs, emails, and papers
  resources.html        datasets, libraries, papers, glossary
  assets/css/style.css  all styles; light and dark themes follow the system setting
  assets/js/site.js     sidebar, prev/next links, footer, copy buttons, math
  assets/js/demos.js    the interactive demos (each looks for its own element id)
  assets/img/           favicon
```

### Editing the site

- Pages are plain HTML. Edit them directly.
- The page order, sidebar, prev/next links, step numbers, and part tags (Loop, Gate) all come from the `PAGES` list at the top of `docs/assets/js/site.js`. To add or reorder a page, edit that list and give the new page's `<body>` a matching `data-page` id and the right `data-root` (`""` at the top level, `"../"` inside `concepts/`). Copy an existing page as a template.
- The lab lead's name in the footer is the `LEADS` constant in `site.js`, and also appears on the home page.
- Math uses KaTeX with `\( … \)` for inline and `\[ … \]` for display math.
- Diagrams are inline SVG that use the CSS colour tokens (`--d-blue`, `--d-red`, …), so they follow light and dark mode.
- Demos live in `demos.js`. Each is wrapped in its own function that returns early if its element (for example `id="demo-snr"`) is not on the page.

## What was checked

- Every Python snippet on the concept pages was run before publishing (PyTorch 2.2, torchaudio 2.2, scikit-learn 1.3, pyroomacoustics 0.10, NumPy 1.26), except those that need Open3D, Ultralytics, or real hardware, which follow those libraries' documented APIs. The quoted numbers (18,474 parameters, GCC-PHAT's 3.375-sample estimate, the 3-D DOA recovery, and the SRP-PHAT / MUSIC anechoic-versus-reverberant table) come from those runs.
- `scripts/smoke_test.py` passes.
- All internal links and anchors resolve; all external links were fetched, and every cited paper's arXiv or DOI record was checked against its title.
- All pages were viewed in a browser at desktop and phone widths, in dark mode, with no horizontal scrolling, and every demo renders and responds.

## Data, privacy, and licensing

- **Never commit data, recordings, or weights.** `.gitignore` excludes common audio, video, point-cloud, and checkpoint formats. UrbanSound8K is CC BY-NC 3.0, and the lab's own recordings contain people. Get consent from everyone in a recorded space and check with the faculty advisor whether IRB review applies.
- **Our content.** Code in this repository is under the **MIT License**. Written content on the site (explanations, diagrams, questions) is under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. See [`LICENSE`](LICENSE).
- **Third-party software and weights** keep their own licenses. Note in particular that Ultralytics YOLOv8 is **AGPL-3.0**: fine for research use, but code that bundles it must follow that license.

## Credits

Built for UCSD DataWorks by Rami Abukhater. Papers, datasets, and tools the site builds on are credited where they are used and on the [Resources](docs/resources.html) page.
