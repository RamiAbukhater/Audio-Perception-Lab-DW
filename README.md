# DataWorks Audio Perception Lab

A UCSD DataWorks research lab on audio processing for perception: edge deployment under tight hardware budgets, self-supervised audio learning bootstrapped from vision, and audio-visual sound source localization (AV-SSL) grounded in room physics.

**Lab lead:** Rami Abukhater.

This repository holds the research code for the lab's three modules and a static website that teaches the concepts every member needs:

- **Setup**: Python 3.11, the lab's libraries, GPU notebooks, data, and a smoke test (`scripts/smoke_test.py`) that must pass before anything else.
- **Six core concept pages for everyone**: digital audio; the Fourier transform and STFT; log-mel spectrograms; noise, SNR, reverberation, and augmentation; CNNs on spectrograms; evaluation and experimental rigor.
- **Six module concept pages**: quantization, pruning, and edge benchmarking (Module 1); embeddings and self-supervised learning, and cross-modal pseudo-labelling (Module 2); microphone arrays and GCC-PHAT, RGB-D point clouds and room geometry, and room acoustics with mirror sources and occlusion (Module 3).
- **Project ideas**: the full blueprint for the three modules, mapped to this repository's folders, with prerequisites, a suggested path, the key result, and extensions for each.
- **Resources and glossary**: datasets, libraries, papers, courses, and terms.

Each concept page has the intuition, the math, diagrams, copyable code with tensor shapes, click-to-reveal questions, and common mistakes. Seven pages include interactive demos (aliasing, the STFT window trade-off, mel filterbanks, SNR mixing with audio playback, int8 quantization, two-mic delay geometry, and a draggable mirror-source room with occlusion).

## The three modules

| Module | Question | Folders |
| --- | --- | --- |
| 1. Lightweight edge audio classification and robustness testing | How much accuracy do int8 quantization and pruning cost, and does the cost grow in noise? | `data/`, `models/edge_audio/`, `optim/`, `eval/` |
| 2. Self-supervised audio learning via vision grounding | Can a frozen object detector's view of a room supply good enough pseudo-labels to train an indoor audio classifier, generation after generation? | `core/sync/`, `models/vision/`, `pipeline/bootstrap/`, `training/` |
| 3. AV-SSL with spatial physics | Does explicit room geometry fix localization errors and false visual matches caused by occlusion and reflections? | `dsp/doa/`, `spatial/mapping/`, `core/physics_fusion/`, `eval/ssl/` |

Details: [`docs/project-ideas.html`](docs/project-ideas.html). Each folder also has a short README.

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

Conda works too; see the [setup page](docs/setup.html). `requirements.txt` is grouped by module, so you can skip a heavy dependency (Open3D, Ultralytics) until your module needs it.

## Repository layout

```
README.md               this file
LICENSE                 MIT for code, CC BY 4.0 for written content
requirements.txt        Python dependencies, grouped by module
scripts/
  smoke_test.py         environment check: SNR mixing, WAV I/O, log-mel, CNN, GCC-PHAT
notebooks/              exploration notebooks (name-module-topic.ipynb)

data/                   M1  dataset processing and augmentation
models/edge_audio/      M1  log-mel front end and compact classifiers
optim/                  M1  int8 PTQ and pruning
eval/                   M1  latency, memory, accuracy-vs-SNR
core/sync/              M2  time-aligned audio + RGB capture
models/vision/          M2  frozen object detector wrapper
pipeline/bootstrap/     M2  embedding clusters, gating, pseudo-labels
training/               M2  iterative student fine-tuning
dsp/doa/                M3  GCC-PHAT direction of arrival
spatial/mapping/        M3  RGB-D point clouds and room layout
core/physics_fusion/    M3  line of sight, occlusion, reflections
eval/ssl/               M3  localization benchmarks

docs/                   the website (GitHub Pages serves this folder)
  index.html            home
  setup.html            environment setup
  concepts/             01-digital-audio.html … 12-room-acoustics-occlusion.html
  project-ideas.html    the three-module blueprint
  resources.html        datasets, libraries, papers, glossary
  assets/css/style.css  all styles; light and dark themes follow the system setting
  assets/js/site.js     sidebar, prev/next links, footer, copy buttons, math
  assets/js/demos.js    the interactive demos (each looks for its own element id)
  assets/img/           favicon
```

### Editing the site

- Pages are plain HTML. Edit them directly.
- The page order, sidebar, prev/next links, step numbers, and module tags (M1, M2, M3) all come from the `PAGES` list at the top of `docs/assets/js/site.js`. To add or reorder a page, edit that list and give the new page's `<body>` a matching `data-page` id and the right `data-root` (`""` at the top level, `"../"` inside `concepts/`). Copy an existing page as a template.
- The lab lead's name in the footer is the `LEADS` constant in `site.js`, and also appears on the home page.
- Math uses KaTeX with `\( … \)` for inline and `\[ … \]` for display math.
- Diagrams are inline SVG that use the CSS colour tokens (`--d-blue`, `--d-red`, …), so they follow light and dark mode.
- Demos live in `demos.js`. Each is wrapped in its own function that returns early if its element (for example `id="demo-snr"`) is not on the page.

## What was checked

- Every Python snippet on the concept pages was run before publishing (PyTorch 2.2, torchaudio 2.2, ONNX Runtime 1.23, scikit-learn 1.3, pyroomacoustics 0.10, NumPy 1.26), except those that need Open3D, Ultralytics, or real hardware, which follow those libraries' documented APIs. The quoted numbers (18,474 parameters, the 76 KB → 40 KB ONNX int8 file, GCC-PHAT's 3.375-sample estimate, the 3-D DOA recovery, and the SRP-PHAT / MUSIC anechoic-versus-reverberant table) come from those runs.
- `scripts/smoke_test.py` passes.
- All internal links and anchors resolve; all external links were fetched, and every cited paper's arXiv or DOI record was checked against its title.
- All pages were viewed in a browser at desktop and phone widths, in dark mode, with no horizontal scrolling, and every demo renders and responds.

## Data, privacy, and licensing

- **Never commit data, recordings, or weights.** `.gitignore` excludes common audio, video, point-cloud, and checkpoint formats. UrbanSound8K is CC BY-NC 3.0, and Module 2 and Module 3 recordings contain people. Get consent from everyone in a recorded space and check with the faculty advisor whether IRB review applies.
- **Our content.** Code in this repository is under the **MIT License**. Written content on the site (explanations, diagrams, questions) is under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. See [`LICENSE`](LICENSE).
- **Third-party software and weights** keep their own licenses. Note in particular that Ultralytics YOLOv8 is **AGPL-3.0**: fine for research use, but code that bundles it must follow that license.

## Credits

Built for UCSD DataWorks by Rami Abukhater. Papers, datasets, and tools the site builds on are credited where they are used and on the [Resources](docs/resources.html) page.
