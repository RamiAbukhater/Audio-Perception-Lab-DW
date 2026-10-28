# <div align="center">DataWorks Audio Perception Lab</div>
### <div align="center">UC San Diego DataWorks Research Group</div>
#### <div align="center">Teaching audio models what pretrained models can't hear, with a camera and room physics</div>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white">
  <img alt="PyTorch" src="https://img.shields.io/badge/PyTorch-torchaudio-EE4C2C?style=flat-square&logo=pytorch&logoColor=white">
  <img alt="Microphone array" src="https://img.shields.io/badge/Mic%20array-GCC--PHAT-7B1FA2?style=flat-square">
  <img alt="RGB-D" src="https://img.shields.io/badge/RGB--D-Open3D-0D47A1?style=flat-square">
  <img alt="YOLO-World" src="https://img.shields.io/badge/YOLO--World-open%20vocabulary-111F68?style=flat-square">
  <img alt="CLAP" src="https://img.shields.io/badge/CLAP-baseline-F57C00?style=flat-square">
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-course%20site-222222?style=flat-square&logo=github&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT%20%2B%20CC%20BY%204.0-2E7D32?style=flat-square">
</p>

<p align="center"><strong><a href="https://ramiabukhater.github.io/Audio-Perception-Lab-DW/">Course site: ramiabukhater.github.io/Audio-Perception-Lab-DW</a></strong></p>

Repository for the UC San Diego DataWorks Audio Perception Lab. It holds the project code and the course site, which walks members through setup, every concept the project relies on, the research plan, and the faculty worth talking to.

In meetings we cover the ideas at a high level. Setup and the concept pages are done on your own, so the site is written to be followed without help.

> **AI-generated content.** The course site's pages, the folder READMEs, and the smoke test were written with Claude, an AI model, and may contain inaccuracies or mistakes. If something looks wrong, please point it out to Rami so it can be fixed.

## Abstract

Pretrained audio models such as [CLAP](https://arxiv.org/abs/2211.06687) already recognise common sounds like "microwave" or "typing". They cannot tell *which* microwave beeped, they have no word for many sounds specific to one room, and they degrade on far-field audio from a microphone across the room. Teaching them those sounds normally takes a person: labelling recordings, or answering "what was that sound?" for every new class, as in [Listen Learner](https://doi.org/10.1145/3313831.3376875) (Wu et al., 2020).

This lab replaces that person with a camera. A fixed camera with an open-vocabulary object detector names the objects and actions around each sound. A **spatial gate** then checks each name before it is trusted: a microphone array measures where the sound came from, and a 3-D map of the room from a depth camera says whether that direction leads to the named object, to an echo of it off a wall, or to something the camera cannot see. Only verified labels train an audio model built from the room's own recordings, which is compared against CLAP, an open-vocabulary sound detector, camera labels without the gate, and a one-human-label-per-class baseline on exactly the sounds pretrained models miss.

- **Organization**: UC San Diego DataWorks
- **Lab lead**: Rami Abukhater
- **Closest prior work**: [Listen Learner](https://doi.org/10.1145/3313831.3376875) (CHI 2020) · [VAX](https://doi.org/10.1145/3610907) (IMWUT 2023) · [Reflection-Aware Sound Source Localization](https://arxiv.org/abs/1711.07791) (2017); the full comparison is on the [Project ideas](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/project-ideas.html) page

## Project Goals

- Find, in a real room, the sounds that CLAP and other pretrained audio models get wrong, confuse between instances, or cannot name.
- Label those sounds with no human sound labels, using a fixed camera and an open-vocabulary detector with object tracking.
- Build a spatial gate (direction of arrival, line of sight, and echo attribution against a 3-D room map) and measure how much it raises pseudo-label precision across self-training generations.
- Beat CLAP zero-shot and camera labels without the gate on the target sounds, and come close to a system that asks a person once per class.
- Give every member a self-contained path from setup to research, with each concept explained in plain language.

## Repository Structure

```text
Audio-Perception-Lab-DW/
├── README.md
├── LICENSE                          # MIT for code, CC BY 4.0 for written content
├── requirements.txt                 # Python dependencies, grouped by part of the project
├── docs/                            # the course site, served by GitHub Pages
│   ├── index.html                   # home
│   ├── setup.html                   # environment setup and smoke test
│   ├── concepts/                    # eleven concept pages, 01 to 11
│   ├── project-ideas.html           # the research plan, prior work, baselines
│   ├── faculty.html                 # UCSD professors to contact
│   ├── resources.html               # datasets, libraries, papers, glossary
│   └── assets/                      # css, js (site and interactive demos), favicon
├── core/
│   ├── sync/                        # loop: synchronised mic-array + RGB-D capture
│   └── physics_fusion/              # gate: direction, line-of-sight, and echo checks
├── models/
│   ├── vision/                      # loop: open-vocabulary detector + tracking
│   └── audio/                       # loop: log-mel front end, in-room encoder, student
├── pipeline/bootstrap/              # loop: clustering and co-occurrence label proposals
├── training/                        # loop: iterative self-training on gated labels
├── dsp/doa/                         # gate: GCC-PHAT / SRP-PHAT direction of arrival
├── spatial/mapping/                 # gate: point cloud, walls, doorways, ray casting
├── eval/
│   ├── ssl/                         # gate on/off precision and coverage, angular error
│   └── baselines/                   # CLAP, open-vocabulary SED, no-gate, one-human-label
├── notebooks/                       # exploration notebooks (name-part-topic.ipynb)
└── scripts/
    └── smoke_test.py                # environment check: SNR, WAV I/O, log-mel, CNN, GCC-PHAT
```

Each project folder has a short README saying what goes there and which concept pages to read first.

## Quick Start

**Members.** Open the [course site](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/) and start with [Environment setup](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/setup.html). In short:

```bash
git clone https://github.com/RamiAbukhater/Audio-Perception-Lab-DW.git
cd Audio-Perception-Lab-DW
uv venv --python 3.11 && source .venv/bin/activate
uv pip install -r requirements.txt
python scripts/smoke_test.py
```

The smoke test should end with `All checks passed`. Conda works too; see the setup page. You can skip the heavy packages (Open3D, Ultralytics) until your part of the project needs them.

**Viewing the site locally.** Open `docs/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000 --directory docs
```

## Recommended Reading Order

1. [Home](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/) and [Environment setup](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/setup.html)
2. Core concepts 1 to 6: [digital audio](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/concepts/01-digital-audio.html), the Fourier transform and STFT, log-mel spectrograms, noise and reverberation, CNNs on spectrograms, evaluation
3. Pseudo-labelling loop, concepts 7 and 8: [embeddings and self-supervised learning](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/concepts/07-embeddings-ssl.html), object detection and cross-modal pseudo-labels
4. Spatial gate, concepts 9 to 11: [microphone arrays and GCC-PHAT](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/concepts/09-mic-arrays-gcc-phat.html), RGB-D and room geometry, room acoustics and the gate
5. [Project ideas](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/project-ideas.html): the plan, the closest prior work, the baselines, and how the work splits
6. [UCSD faculty to contact](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/faculty.html), once you know which part you want

## Development Workflow

The site is plain HTML, CSS, and a little JavaScript, with no build step. Commit to `main` and GitHub Pages republishes `docs/` within a minute or two (Settings → Pages → Deploy from a branch → `main`, folder `/docs`; `docs/.nojekyll` is already there).

- **Pages:** edit the files in `docs/` directly. The page order, sidebar, prev/next links, step numbers, and part tags (Loop, Gate) come from the `PAGES` list in `docs/assets/js/site.js`, and the footer is defined there too. Math uses KaTeX (`\( … \)` and `\[ … \]`); code blocks are `<pre><code class="language-python">`.
- **Demos:** the interactive demos live in `docs/assets/js/demos.js`. Each one looks for its own element id (for example `id="demo-snr"`) and does nothing on pages without it.
- **Cache version:** pages load `style.css`, `site.js`, and `demos.js` with a `?v=` query. After changing any of those files, bump the version on every page so browsers fetch the new copy:

  ```bash
  sed -i '' 's/?v=20261029"/?v=YYYYMMDD"/g' docs/*.html docs/concepts/*.html
  ```

- **Code on the concept pages:** every Python snippet was run before publishing, except those needing Open3D, Ultralytics, or real hardware, which follow those libraries' documented APIs. If you change a snippet, run it.
- **Shared code:** the log-mel front end, SNR mixer, and GCC-PHAT should live in one place in the project folders and be imported, not copied between notebooks.
- **Never commit** data, recordings, or model weights. `.gitignore` excludes common audio, video, point-cloud, and checkpoint formats. UrbanSound8K is CC BY-NC 3.0, and the project's recordings contain people: get consent from everyone in a recorded space and check with the faculty advisor whether IRB review applies.

## Acknowledgments

The project builds on Listen Learner (Wu, Harrison, Bigham, and Laput, 2020), VAX (Patidar, Goel, and Agarwal, 2023), and reflection-aware sound source localization (An, Son, Manocha, and Yoon, 2017), among the other papers credited on the [Project ideas](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/project-ideas.html) and [Resources](https://ramiabukhater.github.io/Audio-Perception-Lab-DW/resources.html) pages. Explanations, diagrams, and demos on the site are our own. Third-party software and weights keep their own licenses; note that Ultralytics YOLO models, including YOLO-World, are **AGPL-3.0**.

Our code is MIT-licensed and our written content is CC BY 4.0; see [`LICENSE`](LICENSE).

```bibtex
@inproceedings{wu2020listenlearner,
  title     = {Automated Class Discovery and One-Shot Interactions for Acoustic Activity Recognition},
  author    = {Jason Wu and Chris Harrison and Jeffrey P. Bigham and Gierad Laput},
  booktitle = {Proceedings of the 2020 CHI Conference on Human Factors in Computing Systems},
  year      = {2020},
  doi       = {10.1145/3313831.3376875}
}

@article{patidar2023vax,
  title   = {VAX: Using Existing Video and Audio-based Activity Recognition Models to Bootstrap Privacy-Sensitive Sensors},
  author  = {Prasoon Patidar and Mayank Goel and Yuvraj Agarwal},
  journal = {Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies},
  volume  = {7},
  number  = {3},
  articleno = {117},
  pages   = {1--24},
  year    = {2023},
  doi     = {10.1145/3610907}
}
```

## Contacts

* Rami Abukhater: [@RamiAbukhater](https://github.com/RamiAbukhater)
