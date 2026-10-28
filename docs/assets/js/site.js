/* DataWorks Audio Perception Lab — shared page behaviour.
   No framework, no fetch: everything works from file:// as well as GitHub Pages.

   Each page's <body> carries:
     data-page  the page id from PAGES below
     data-root  relative path back to docs/ ("" for top-level pages, "../" for concepts/)

   To add, remove or reorder pages, edit PAGES. The sidebar, the prev/next
   links and the step numbers all come from this one list. */

(function () {
  "use strict";

  var PAGES = [
    { id: "home", href: "index.html", title: "Home", group: "Start", icon: "&#8962;" },
    { id: "setup", href: "setup.html", title: "Environment setup", group: "Start", step: true },
    { id: "c1", href: "concepts/01-digital-audio.html", title: "Digital audio: sampling, bit depth, decibels", short: "Digital audio basics", group: "Core concepts (everyone)", step: true },
    { id: "c2", href: "concepts/02-fourier-stft.html", title: "The Fourier transform and the STFT", short: "Fourier and the STFT", group: "Core concepts (everyone)", step: true },
    { id: "c3", href: "concepts/03-mel-spectrograms.html", title: "Mel spectrograms and log-mel features", short: "Log-mel spectrograms", group: "Core concepts (everyone)", step: true },
    { id: "c4", href: "concepts/04-noise-reverb-augmentation.html", title: "Noise, SNR, reverberation, and augmentation", short: "Noise, SNR, and reverb", group: "Core concepts (everyone)", step: true },
    { id: "c5", href: "concepts/05-audio-cnns.html", title: "Training CNNs on spectrograms", short: "CNNs for audio", group: "Core concepts (everyone)", step: true },
    { id: "c6", href: "concepts/06-evaluation.html", title: "Evaluation and experimental rigor", short: "Evaluation and rigor", group: "Core concepts (everyone)", step: true },
    { id: "c7", href: "concepts/07-embeddings-ssl.html", title: "Embeddings, clustering, and self-supervised learning", short: "Embeddings and SSL", group: "Module concepts", step: true, track: "m1" },
    { id: "c8", href: "concepts/08-cross-modal-pseudo-labels.html", title: "Object detection, sync, and cross-modal pseudo-labels", short: "Cross-modal pseudo-labels", group: "Module concepts", step: true, track: "m1" },
    { id: "c9", href: "concepts/09-mic-arrays-gcc-phat.html", title: "Microphone arrays, TDOA, and GCC-PHAT", short: "Mic arrays and GCC-PHAT", group: "Module concepts", step: true, track: "m2" },
    { id: "c10", href: "concepts/10-3d-geometry.html", title: "RGB-D, point clouds, and room geometry", short: "3D geometry and point clouds", group: "Module concepts", step: true, track: "m2" },
    { id: "c11", href: "concepts/11-room-acoustics-occlusion.html", title: "Room acoustics, mirror sources, and occlusion", short: "Room acoustics and occlusion", group: "Module concepts", step: true, track: "m2" },
    { id: "ideas", href: "project-ideas.html", title: "Project ideas", group: "Projects", icon: "&#9670;" },
    { id: "faculty", href: "faculty.html", title: "UCSD faculty to contact", short: "Faculty to contact", group: "People", icon: "&#9993;" },
    { id: "resources", href: "resources.html", title: "Resources and glossary", short: "Resources and glossary", group: "Reference", icon: "&#9733;" }
  ];

  var TRACKS = { m1: "M1", m2: "M2" };
  var LEADS = "Rami Abukhater";

  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var current = body.getAttribute("data-page");
  var idx = PAGES.findIndex(function (p) { return p.id === current; });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- header extras (menu button, quick links) ---------- */
  var header = document.getElementById("site-header");
  if (header) {
    var spacer = document.createElement("span");
    spacer.className = "spacer";
    header.appendChild(spacer);

    var links = document.createElement("nav");
    links.className = "header-links";
    links.setAttribute("aria-label", "Quick links");
    links.innerHTML =
      '<a href="' + root + 'setup.html">Setup</a>' +
      '<a href="' + root + 'concepts/01-digital-audio.html">Concepts</a>' +
      '<a href="' + root + 'project-ideas.html">Project ideas</a>' +
      '<a href="' + root + 'resources.html">Glossary</a>';
    header.appendChild(links);

    var toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", "sidebar");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Contents";
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.appendChild(toggle);
  }

  /* ---------- sidebar: the learning path ---------- */
  var sidebar = document.getElementById("sidebar");
  if (sidebar) {
    var html = "";
    var group = null;
    var n = -1; // Setup is step 0, so concept pages keep their own numbers 1 to 11
    PAGES.forEach(function (p, i) {
      if (p.group !== group) {
        if (group !== null) html += "</ol>";
        group = p.group;
        html += '<div class="path-label">' + esc(group) + "</div>";
        html += '<ol class="path' + (/concepts/i.test(p.group) ? " steps" : "") + '">';
      }
      var num = p.step ? String(++n) : (p.icon || "&#8226;");
      var cls = i < idx && p.step ? ' class="done"' : "";
      var cur = i === idx ? ' aria-current="page"' : "";
      html += '<li><a href="' + root + p.href + '"' + cls + cur + ">" +
        '<span class="num" aria-hidden="true">' + num + "</span>" +
        '<span class="label">' + esc(p.short || p.title) +
        (p.track ? ' <span class="track-tag ' + p.track + '">' + TRACKS[p.track] + "</span>" : "") +
        "</span></a></li>";
    });
    html += "</ol>";
    html += '<p class="meta">Everyone works through setup (0) and the core concepts (1 to 6). Then read the module pages for your project: M1 vision-grounded self-supervision, M2 audio-visual localization.</p>';
    sidebar.innerHTML = html;

    // close the drawer on phone after choosing a page, or on Escape
    sidebar.addEventListener("click", function (e) {
      if (e.target.closest("a")) body.classList.remove("nav-open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") body.classList.remove("nav-open");
    });
    document.addEventListener("click", function (e) {
      if (body.classList.contains("nav-open") && !e.target.closest(".sidebar") && !e.target.closest(".nav-toggle")) {
        body.classList.remove("nav-open");
      }
    });
  }

  /* ---------- prev / next ---------- */
  var pager = document.getElementById("pager");
  if (pager && idx !== -1) {
    var prev = PAGES[idx - 1];
    var next = PAGES[idx + 1];
    var ph = "";
    if (prev) {
      ph += '<a class="prev" href="' + root + prev.href + '" rel="prev"><span class="dir">&larr; Previous</span><span class="ttl">' + esc(prev.title) + "</span></a>";
    }
    if (next) {
      ph += '<a class="next" href="' + root + next.href + '" rel="next"><span class="dir">Next &rarr;</span><span class="ttl">' + esc(next.title) + "</span></a>";
    }
    pager.innerHTML = ph;
    pager.setAttribute("aria-label", "Previous and next page");
  }

  /* ---------- footer ---------- */
  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      "<p><strong>DataWorks Audio Perception Lab</strong>, UCSD DataWorks. Lab lead: " + LEADS + ".</p>" +
      "<p>Explanations, diagrams, and demos on this site are our own. Datasets, libraries, and papers are linked and credited where they are used; see the Resources page.</p>" +
      "<p>Site text CC BY 4.0, site code MIT. See the repository README for details.</p>" +
      '<p class="ai-line">Pages on this site were written with Claude, an AI model, and may contain mistakes. Please point anything that looks wrong out to Rami so it can be fixed.</p>';
  }

  /* ---------- copy buttons on code blocks ---------- */
  function copyWithTextarea(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    // Clipboard API first; fall back to execCommand, which also works from file://
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        if (!copyWithTextarea(text)) throw new Error("copy failed");
      });
    }
    return copyWithTextarea(text) ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }
  function selectContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  document.querySelectorAll("pre > code").forEach(function (code) {
    var pre = code.parentElement;
    if (pre.parentElement.classList.contains("code-wrap")) return;
    var wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", function () {
      copyText(code.textContent).then(function () {
        btn.textContent = "Copied";
        btn.classList.add("copied");
      }, function () {
        // could not copy: select the code so Ctrl+C / Cmd+C works
        selectContents(code);
        btn.textContent = "Selected, press Ctrl+C";
      });
      setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1800);
    });
    wrap.appendChild(btn);
  });

  /* ---------- idea filters (Project ideas) ----------
     Cards carry data-theme. The filter bar is hidden in the HTML and only
     shown here, so with JavaScript off every card stays visible. */
  var filters = document.getElementById("idea-filters");
  if (filters) {
    var cards = document.querySelectorAll(".idea[data-theme]");
    var buttons = filters.querySelectorAll("button[data-filter]");
    var count = filters.querySelector(".filters-count");
    var applyFilter = function (theme) {
      var shown = 0;
      cards.forEach(function (c) {
        var show = theme === "all" || c.getAttribute("data-theme") === theme;
        c.hidden = !show;
        if (show) shown++;
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter") === theme ? "true" : "false");
      });
      if (count) count.textContent = shown + " of " + cards.length + " ideas";
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter")); });
    });
    filters.hidden = false;
    applyFilter("all");
    // a link to a card (for example #idea-7) always reveals it
    var revealTarget = function () {
      var t = location.hash && document.getElementById(location.hash.slice(1));
      if (t && t.classList.contains("idea") && t.hidden) applyFilter("all");
    };
    window.addEventListener("hashchange", revealTarget);
    revealTarget();
  }

  /* ---------- math ---------- */
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.querySelector(".content") || document.body, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        throwOnError: false
      });
    }
  }
  if (document.readyState === "complete") renderMath();
  else window.addEventListener("load", renderMath);
})();
