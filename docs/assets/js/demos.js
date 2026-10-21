/* DataWorks Audio Perception Lab — interactive demos.
   Each demo looks for its own element id and does nothing if the page
   does not have it. No libraries; everything is computed in the browser.

     demo-alias   sampling and aliasing            (concept 1)
     demo-stft    STFT window-length trade-off     (concept 2)
     demo-mel     mel filterbank                   (concept 3)
     demo-snr     mixing noise at a target SNR     (concept 4)
     demo-quant   int8 affine quantization         (concept 7)
     demo-doa     two-mic TDOA and angle           (concept 10)
     demo-ism     mirror sources and occlusion     (concept 12) */

(function () {
  "use strict";

  /* ---------- shared helpers ---------- */
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
  }
  function palette() {
    return {
      ink: css("--ink"), soft: css("--ink-soft"), faint: css("--ink-faint"), rule: css("--rule"),
      bg: css("--bg"), blue: css("--d-blue"), red: css("--d-red"), amber: css("--d-amber"),
      green: css("--d-green"), accent: css("--accent"), font: css("--font-ui")
    };
  }
  // Size a canvas to its CSS width at device resolution; returns a context in CSS pixels.
  function fit(canvas, aspect) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 600;
    var h = Math.round(w * aspect);
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function $(root, sel) { return root.querySelector(sel); }
  function bindRange(root, name, fmt, onchange) {
    var input = $(root, '[name="' + name + '"]');
    var out = $(root, 'output[for="' + name + '"]');
    function update() { if (out) out.textContent = fmt(+input.value); onchange(); }
    input.addEventListener("input", update);
    return { get: function () { return +input.value; }, init: function () { if (out) out.textContent = fmt(+input.value); } };
  }
  function onResize(fn) {
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fn, 120); });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", fn);
    }
  }
  // Seeded RNG so demos look the same on every load.
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // In-place iterative radix-2 FFT. re and im have length 2^k.
  function fft(re, im) {
    var n = re.length, i, j, k, len, tr, ti;
    for (i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { tr = re[i]; re[i] = re[j]; re[j] = tr; tr = im[i]; im[i] = im[j]; im[j] = tr; }
    }
    for (len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var a = i + k, b = a + len / 2;
          tr = re[b] * cr - im[b] * ci;
          ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
  }
  function nextPow2(n) { var p = 1; while (p < n) p <<= 1; return p; }
  function convolve(x, h) {
    var n = nextPow2(x.length + h.length - 1);
    var ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n);
    ar.set(x); br.set(h);
    fft(ar, ai); fft(br, bi);
    for (var i = 0; i < n; i++) {
      var r = ar[i] * br[i] - ai[i] * bi[i];
      ai[i] = ar[i] * bi[i] + ai[i] * br[i];
      ar[i] = r;
    }
    // inverse via conjugation
    for (i = 0; i < n; i++) ai[i] = -ai[i];
    fft(ar, ai);
    var y = new Float32Array(x.length);
    for (i = 0; i < x.length; i++) y[i] = ar[i] / n;
    return y;
  }
  function power(x) { var s = 0; for (var i = 0; i < x.length; i++) s += x[i] * x[i]; return s / x.length; }
  function axisText(ctx, p, txt, x, y, align) {
    ctx.fillStyle = p.soft; ctx.font = "12px " + p.font; ctx.textAlign = align || "left"; ctx.fillText(txt, x, y);
  }

  /* ---------- 1. sampling and aliasing ---------- */
  (function () {
    var root = document.getElementById("demo-alias");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var f = bindRange(root, "f", function (v) { return v + " Hz"; }, draw);
    var fs = bindRange(root, "fs", function (v) { return v + " Hz"; }, draw);
    f.init(); fs.init();
    function draw() {
      var p = palette(), c = fit(canvas, 0.36), ctx = c.ctx, W = c.w, H = c.h;
      var F = f.get(), FS = fs.get(), T = 1, pad = 28;
      var alias = Math.abs(F - FS * Math.round(F / FS));
      var X = function (t) { return pad + (t / T) * (W - pad - 10); };
      var Y = function (v) { return H / 2 - v * (H / 2 - 18); };
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
      // true signal
      ctx.strokeStyle = p.blue; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var i = 0; i <= 1200; i++) { var t = i / 1200 * T; var y = Math.sin(2 * Math.PI * F * t); if (i) ctx.lineTo(X(t), Y(y)); else ctx.moveTo(X(t), Y(y)); }
      ctx.stroke();
      // what the samples look like they came from
      var sign = (F - FS * Math.round(F / FS)) >= 0 ? 1 : -1;
      ctx.strokeStyle = p.red; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.beginPath();
      for (i = 0; i <= 600; i++) { t = i / 600 * T; y = sign * Math.sin(2 * Math.PI * alias * t); if (i) ctx.lineTo(X(t), Y(y)); else ctx.moveTo(X(t), Y(y)); }
      ctx.stroke(); ctx.setLineDash([]);
      // samples
      ctx.fillStyle = p.ink;
      for (var n = 0; n <= FS * T; n++) {
        t = n / FS; y = Math.sin(2 * Math.PI * F * t);
        ctx.beginPath(); ctx.arc(X(t), Y(y), 3.5, 0, 2 * Math.PI); ctx.fill();
      }
      axisText(ctx, p, "0 s", pad, H - 4, "center");
      axisText(ctx, p, "1 s", W - 10, H - 4, "right");
      var ok = F < FS / 2;
      readout.textContent =
        "Nyquist frequency = fs / 2 = " + (FS / 2) + " Hz\n" +
        (ok ? "f < fs/2: the samples pin down the true " + F + " Hz sine (blue). The red curve sits on top of it."
            : "f >= fs/2: ALIASING. The samples (dots) fit a " + alias + " Hz sine (red, dashed) just as well,\n" +
              "and after sampling there is no way to tell which one was real.");
    }
    draw(); onResize(draw);
  })();

  /* ---------- 2. STFT window-length trade-off ---------- */
  (function () {
    var root = document.getElementById("demo-stft");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout"), sel = $(root, "select");
    var sr = 8000, N = sr; // one second
    var x = new Float64Array(N);
    for (var i = 0; i < N; i++) {
      var t = i / sr;
      if (t < 0.5) { // linear chirp 300 -> 3300 Hz
        var f0 = 300, k = 6000;
        x[i] += 0.6 * Math.sin(2 * Math.PI * (f0 * t + 0.5 * k * t * t));
      } else {       // two tones 40 Hz apart
        x[i] += 0.4 * Math.sin(2 * Math.PI * 1000 * t) + 0.4 * Math.sin(2 * Math.PI * 1040 * t);
      }
    }
    [0.25, 0.75, 0.8].forEach(function (tc) { // clicks
      var c0 = Math.round(tc * sr);
      for (var j = 0; j < 6; j++) x[c0 + j] += (j % 2 ? -1 : 1) * 1.5;
    });
    sel.addEventListener("change", draw);
    function draw() {
      var p = palette(), c = fit(canvas, 0.45), ctx = c.ctx, W = c.w, H = c.h;
      var nfft = +sel.value, hop = nfft / 4, bins = nfft / 2 + 1;
      var frames = Math.floor((N - nfft) / hop) + 1;
      var win = new Float64Array(nfft);
      for (i = 0; i < nfft; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / nfft);
      var S = [], mx = -Infinity;
      for (var fr = 0; fr < frames; fr++) {
        var re = new Float64Array(nfft), im = new Float64Array(nfft);
        for (i = 0; i < nfft; i++) re[i] = x[fr * hop + i] * win[i];
        fft(re, im);
        var col = new Float64Array(bins);
        for (i = 0; i < bins; i++) { col[i] = 10 * Math.log10(re[i] * re[i] + im[i] * im[i] + 1e-10); if (col[i] > mx) mx = col[i]; }
        S.push(col);
      }
      var left = 40, bottom = 22, pw = W - left - 8, ph = H - bottom - 8;
      var img = ctx.createImageData(Math.max(1, Math.round(pw)), Math.max(1, Math.round(ph)));
      var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      for (var yy = 0; yy < img.height; yy++) {
        var b = Math.floor((1 - yy / img.height) * (bins - 1));
        for (var xx = 0; xx < img.width; xx++) {
          var f2 = Math.min(frames - 1, Math.floor(xx / img.width * frames));
          var v = Math.max(0, Math.min(1, (S[f2][b] - (mx - 70)) / 70));
          // perceptual-ish ramp: background -> blue -> amber
          var r = dark ? 20 + 235 * Math.pow(v, 1.6) : 255 - 225 * v;
          var g = dark ? 24 + 190 * Math.pow(v, 1.4) : 255 - 170 * v - 50 * v * v;
          var bl = dark ? 30 + 120 * v : 255 - 110 * v - 100 * v * v;
          var o = (yy * img.width + xx) * 4;
          img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = bl; img.data[o + 3] = 255;
        }
      }
      ctx.clearRect(0, 0, W, H);
      var dpr = window.devicePixelRatio || 1;
      // putImageData ignores the transform, so draw through an offscreen canvas
      var off = document.createElement("canvas"); off.width = img.width; off.height = img.height;
      off.getContext("2d").putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, left, 8, pw, ph);
      axisText(ctx, p, "4 kHz", left - 4, 18, "right");
      axisText(ctx, p, "0", left - 4, 8 + ph, "right");
      axisText(ctx, p, "0 s", left, H - 6, "left");
      axisText(ctx, p, "time →", left + pw / 2, H - 6, "center");
      axisText(ctx, p, "1 s", left + pw, H - 6, "right");
      readout.textContent =
        "n_fft = " + nfft + " samples at 8 kHz -> window = " + (1000 * nfft / sr).toFixed(1) + " ms, hop = " + (1000 * hop / sr).toFixed(1) + " ms\n" +
        "frequency bin spacing = sr / n_fft = " + (sr / nfft).toFixed(1) + " Hz   (" + frames + " frames x " + bins + " bins)\n" +
        // a Hann window's main lobe is about 4 bins wide, so two tones need roughly 2+ bins between them
        (sr / nfft > 20 ? "The 1000 and 1040 Hz tones (right half) blur into one band: the window's main lobe (~4 bins = " + (4 * sr / nfft).toFixed(0) + " Hz) is wider than their 40 Hz gap."
          : sr / nfft > 10 ? "The two tones are just starting to pull apart (40 Hz is only " + (40 / (sr / nfft)).toFixed(1) + " bins), and the clicks are already smearing in time."
          : "The 1000 and 1040 Hz tones separate cleanly, but the clicks at 0.25, 0.75 and 0.80 s smear sideways in time.");
    }
    draw(); onResize(draw);
  })();

  /* ---------- 3. mel filterbank ---------- */
  (function () {
    var root = document.getElementById("demo-mel");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var nm = bindRange(root, "nmels", function (v) { return v + " filters"; }, draw);
    var sel = $(root, "select");
    sel.addEventListener("change", draw);
    nm.init();
    function hz2mel(f) { return 2595 * Math.log10(1 + f / 700); }
    function mel2hz(m) { return 700 * (Math.pow(10, m / 2595) - 1); }
    function draw() {
      var p = palette(), c = fit(canvas, 0.38), ctx = c.ctx, W = c.w, H = c.h;
      var sr = +sel.value, fmax = sr / 2, M = nm.get();
      var left = 10, bottom = 22, pw = W - 20, ph = H - bottom - 10;
      var X = function (f) { return left + f / fmax * pw; };
      var mmax = hz2mel(fmax), pts = [];
      for (var i = 0; i < M + 2; i++) pts.push(mel2hz(i * mmax / (M + 1)));
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = p.rule; ctx.beginPath(); ctx.moveTo(left, 10 + ph); ctx.lineTo(left + pw, 10 + ph); ctx.stroke();
      var cols = [p.blue, p.amber, p.green, p.red];
      for (i = 0; i < M; i++) {
        ctx.strokeStyle = cols[i % 4]; ctx.lineWidth = 1.3; ctx.beginPath();
        ctx.moveTo(X(pts[i]), 10 + ph); ctx.lineTo(X(pts[i + 1]), 10); ctx.lineTo(X(pts[i + 2]), 10 + ph); ctx.stroke();
      }
      for (var k = 0; k <= fmax; k += 2000) axisText(ctx, p, (k / 1000) + "k", X(k), H - 5, k === 0 ? "left" : "center");
      var first = pts[2] - pts[0], last = pts[M + 1] - pts[M - 1];
      readout.textContent =
        "Lowest filter spans " + first.toFixed(0) + " Hz; highest spans " + last.toFixed(0) + " Hz (" + (last / first).toFixed(0) + "x wider).\n" +
        "Filters below 1 kHz: " + pts.slice(1, M + 1).filter(function (f) { return f < 1000; }).length + " of " + M +
        ". Equal spacing on the mel scale, so dense where hearing is sharp.\n" +
        "With n_fft = 1024 the bin width is " + (sr / 1024).toFixed(1) + " Hz; if the lowest filters are narrower than ~2 bins they come out empty.";
    }
    draw(); onResize(draw);
  })();

  /* ---------- 4. mixing noise at a target SNR ---------- */
  (function () {
    var root = document.getElementById("demo-snr");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var sr = 16000, N = 2 * sr, r = rng(7);
    // a synthetic "siren + chirps" clean signal
    var clean = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var t = i / sr;
      var fm = 700 + 250 * Math.sin(2 * Math.PI * 1.5 * t);
      var env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t) > 0.3 ? 1 : 0.15;
      clean[i] = 0.3 * env * Math.sin(2 * Math.PI * fm * t + 3 * Math.sin(2 * Math.PI * 1.5 * t));
    }
    var white = new Float32Array(N), pink = new Float32Array(N);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (i = 0; i < N; i++) {
      var w = gauss(r); white[i] = w;
      // Paul Kellet's pink-noise filter
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      pink[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
    }
    var rirCache = {};
    function rir(rt60) {
      if (rirCache[rt60]) return rirCache[rt60];
      var L = Math.round(rt60 * sr), h = new Float32Array(L), rr = rng(11);
      h[0] = 1;
      for (var n = 1; n < L; n++) h[n] = gauss(rr) * 0.3 * Math.pow(10, -3 * n / L); // -60 dB at rt60
      return (rirCache[rt60] = h);
    }
    var snr = bindRange(root, "snr", function (v) { return v + " dB"; }, draw);
    var rt = bindRange(root, "rt60", function (v) { return v === 0 ? "off (dry)" : v.toFixed(1) + " s"; }, draw);
    var kind = $(root, "select");
    kind.addEventListener("change", draw);
    snr.init(); rt.init();
    var mix = null, reverbed = null, lastRt = -1;
    function build() {
      var R = rt.get();
      if (R !== lastRt) {
        if (R === 0) reverbed = clean;
        else {
          var y = convolve(clean, rir(R));
          var g = Math.sqrt(power(clean) / power(y)); // keep loudness comparable
          for (var k = 0; k < y.length; k++) y[k] *= g;
          reverbed = y;
        }
        lastRt = R;
      }
      var noise = kind.value === "pink" ? pink : white;
      var Ps = power(reverbed), Pn = power(noise);
      var scale = Math.sqrt(Ps / (Pn * Math.pow(10, snr.get() / 10)));
      mix = new Float32Array(N);
      var peak = 0;
      for (var k2 = 0; k2 < N; k2++) { mix[k2] = reverbed[k2] + scale * noise[k2]; peak = Math.max(peak, Math.abs(mix[k2])); }
      return { Ps: Ps, Pn: Pn * scale * scale, scale: scale, peak: peak };
    }
    function draw() {
      var info = build();
      var p = palette(), c = fit(canvas, 0.32), ctx = c.ctx, W = c.w, H = c.h;
      ctx.clearRect(0, 0, W, H);
      var norm = Math.max(info.peak, 1e-6);
      function wave(sig, color, alpha) {
        ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1; ctx.beginPath();
        var step = N / W;
        for (var x = 0; x < W; x++) {
          var lo = Infinity, hi = -Infinity;
          for (var j = Math.floor(x * step); j < Math.floor((x + 1) * step); j++) { lo = Math.min(lo, sig[j]); hi = Math.max(hi, sig[j]); }
          ctx.moveTo(x + 0.5, H / 2 - hi / norm * (H / 2 - 4)); ctx.lineTo(x + 0.5, H / 2 - lo / norm * (H / 2 - 4));
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      wave(mix, p.faint, 0.9);
      wave(reverbed, p.blue, 0.9);
      readout.textContent =
        "P_signal = " + info.Ps.toExponential(2) + "   P_noise (after scaling) = " + info.Pn.toExponential(2) + "\n" +
        "noise gain = sqrt(P_s / (P_n * 10^(SNR/10))) = " + info.scale.toFixed(4) + "\n" +
        "check: 10*log10(P_s/P_noise) = " + (10 * Math.log10(info.Ps / info.Pn)).toFixed(2) + " dB" +
        (info.peak > 1 ? "\nWARNING: mixture peaks at " + info.peak.toFixed(2) + " > 1.0, it would clip if saved as 16-bit audio. Normalise after mixing." : "");
    }
    var ac = null, src = null;
    function play(sig) {
      try {
        if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
        if (src) src.stop();
        var peak = 0; for (var k = 0; k < sig.length; k++) peak = Math.max(peak, Math.abs(sig[k]));
        var buf = ac.createBuffer(1, sig.length, sr), d = buf.getChannelData(0), g = 0.8 / Math.max(peak, 1e-6);
        for (k = 0; k < sig.length; k++) d[k] = sig[k] * g;
        src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start();
      } catch (e) { readout.textContent += "\n(Audio playback is not available in this browser.)"; }
    }
    $(root, '[data-play="clean"]').addEventListener("click", function () { play(clean); });
    $(root, '[data-play="mix"]').addEventListener("click", function () { play(mix); });
    draw(); onResize(draw);
  })();

  /* ---------- 7. int8 affine quantization ---------- */
  (function () {
    var root = document.getElementById("demo-quant");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var r = rng(3), base = [];
    for (var i = 0; i < 400; i++) base.push(gauss(r) * 0.05);
    var bits = bindRange(root, "bits", function (v) { return v + " bits"; }, draw);
    var outlier = $(root, '[name="outlier"]'), scheme = $(root, '[name="scheme"]');
    outlier.addEventListener("change", draw); scheme.addEventListener("change", draw);
    bits.init();
    function draw() {
      var w = base.slice();
      if (outlier.checked) w[17] = 1.2;
      var B = bits.get(), qmin, qmax, scale, zp;
      var lo = Math.min.apply(null, w), hi = Math.max.apply(null, w);
      if (scheme.value === "sym") {
        qmax = Math.pow(2, B - 1) - 1; qmin = -qmax;
        scale = Math.max(Math.abs(lo), Math.abs(hi)) / qmax; zp = 0;
      } else {
        qmin = 0; qmax = Math.pow(2, B) - 1;
        lo = Math.min(lo, 0); hi = Math.max(hi, 0);
        scale = (hi - lo) / (qmax - qmin); zp = Math.round(qmin - lo / scale);
      }
      var deq = w.map(function (x) {
        var q = Math.min(qmax, Math.max(qmin, Math.round(x / scale) + zp));
        return (q - zp) * scale;
      });
      var mse = 0, used = {};
      w.forEach(function (x, k) { mse += (x - deq[k]) * (x - deq[k]); used[deq[k].toFixed(9)] = 1; });
      mse /= w.length;
      var sig = 0; w.forEach(function (x) { sig += x * x; }); sig /= w.length;
      // draw: histogram of original weights, with dequantized levels as ticks
      var p = palette(), c = fit(canvas, 0.34), ctx = c.ctx, W = c.w, H = c.h;
      ctx.clearRect(0, 0, W, H);
      var vmin = -0.2, vmax = 0.2, bins = 80, hist = new Array(bins).fill(0);
      w.forEach(function (x) { var b = Math.floor((x - vmin) / (vmax - vmin) * bins); if (b >= 0 && b < bins) hist[b]++; });
      var hm = Math.max.apply(null, hist), X = function (v) { return 10 + (v - vmin) / (vmax - vmin) * (W - 20); };
      ctx.fillStyle = p.blue; ctx.globalAlpha = 0.5;
      hist.forEach(function (n, b) { var bh = n / hm * (H - 50); ctx.fillRect(X(vmin + b * (vmax - vmin) / bins), H - 26 - bh, (W - 20) / bins - 1, bh); });
      ctx.globalAlpha = 1; ctx.strokeStyle = p.red; ctx.lineWidth = 1.5;
      Object.keys(used).forEach(function (k) { var v = +k; if (v >= vmin && v <= vmax) { ctx.beginPath(); ctx.moveTo(X(v), H - 26); ctx.lineTo(X(v), H - 16); ctx.stroke(); } });
      axisText(ctx, p, "-0.2", 10, H - 3, "left"); axisText(ctx, p, "0", X(0), H - 3, "center"); axisText(ctx, p, "+0.2", W - 10, H - 3, "right");
      axisText(ctx, p, "red ticks = values the quantized weights can take in this window", W - 10, 14, "right");
      readout.textContent =
        "range [" + Math.min.apply(null, w).toFixed(3) + ", " + Math.max.apply(null, w).toFixed(3) + "]   q in [" + qmin + ", " + qmax + "]\n" +
        "scale = " + scale.toExponential(3) + "   zero_point = " + zp + "\n" +
        "distinct levels actually used: " + Object.keys(used).length + " of " + (qmax - qmin + 1) + "\n" +
        "quantization SNR = 10*log10(mean(w^2) / MSE) = " + (10 * Math.log10(sig / mse)).toFixed(1) + " dB";
    }
    draw(); onResize(draw);
  })();

  /* ---------- 10. two-mic TDOA ---------- */
  (function () {
    var root = document.getElementById("demo-doa");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var c0 = 343;
    var th = bindRange(root, "theta", function (v) { return v + "°"; }, draw);
    var dd = bindRange(root, "d", function (v) { return v + " cm"; }, draw);
    var fsSel = $(root, "select");
    fsSel.addEventListener("change", draw);
    th.init(); dd.init();
    function draw() {
      var p = palette(), c = fit(canvas, 0.5), ctx = c.ctx, W = c.w, H = c.h;
      var theta = th.get() * Math.PI / 180, d = dd.get() / 100, fs = +fsSel.value;
      var cx = W / 2, cy = H - 30, R = Math.min(W / 2 - 20, H - 50);
      ctx.clearRect(0, 0, W, H);
      // semicircle and the angles reachable with integer-sample lags
      ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
      var maxLag = Math.floor(d * fs / c0);
      ctx.strokeStyle = p.green; ctx.lineWidth = 3;
      for (var L = -maxLag; L <= maxLag; L++) {
        var a = Math.asin(Math.max(-1, Math.min(1, L * c0 / (fs * d))));
        ctx.beginPath();
        ctx.moveTo(cx + Math.sin(a) * (R - 16), cy - Math.cos(a) * (R - 16));
        ctx.lineTo(cx + Math.sin(a) * (R + 6), cy - Math.cos(a) * (R + 6));
        ctx.stroke();
      }
      // incoming plane wavefronts
      var ux = Math.sin(theta), uy = -Math.cos(theta);
      ctx.strokeStyle = p.amber; ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
      for (var k = 1; k <= 4; k++) {
        var px = cx + ux * R * k / 4.5, py = cy + uy * R * k / 4.5;
        ctx.beginPath(); ctx.moveTo(px - uy * R * 0.35, py + ux * R * 0.35); ctx.lineTo(px + uy * R * 0.35, py - ux * R * 0.35); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // source direction arrow
      ctx.strokeStyle = p.amber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + ux * R, cy + uy * R); ctx.lineTo(cx + ux * 30, cy + uy * 30); ctx.stroke();
      axisText(ctx, p, "source", cx + ux * R + (ux >= 0 ? 6 : -6), cy + uy * R, ux >= 0 ? "left" : "right");
      // mics (drawn spread for visibility)
      var vis = 30 + d * 400;
      ctx.fillStyle = p.blue;
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(cx + s * vis / 2, cy, 6, 0, 2 * Math.PI); ctx.fill(); });
      axisText(ctx, p, "mic 1", cx - vis / 2, cy + 22, "center"); axisText(ctx, p, "mic 2", cx + vis / 2, cy + 22, "center");
      axisText(ctx, p, "0° = broadside (straight up)", 8, 16);
      var tau = d * Math.sin(theta) / c0, lag = tau * fs;
      var est = Math.asin(Math.max(-1, Math.min(1, Math.round(lag) * c0 / (fs * d)))) * 180 / Math.PI;
      readout.textContent =
        "tau = d sin(theta) / c = " + (tau * 1e6).toFixed(1) + " µs = " + lag.toFixed(2) + " samples at " + fs / 1000 + " kHz\n" +
        "if you only use integer lags: lag " + Math.round(lag) + " -> estimate " + est.toFixed(1) + "°   (error " + Math.abs(est - th.get()).toFixed(1) + "°)\n" +
        "distinct integer lags available: " + (2 * maxLag + 1) + "  (green ticks: the only angles you can report)\n" +
        "spatial aliasing above f = c / (2d) = " + (c0 / (2 * d)).toFixed(0) + " Hz";
    }
    draw(); onResize(draw);
  })();

  /* ---------- 12. mirror sources and occlusion ---------- */
  (function () {
    var root = document.getElementById("demo-ism");
    if (!root) return;
    var canvas = $(root, "canvas"), readout = $(root, ".readout");
    var RW = 6, RH = 4;                       // room, metres
    var S = { x: 1.3, y: 2.8 }, M = { x: 4.6, y: 1.2 };
    var wallOn = $(root, '[name="partition"]');
    wallOn.addEventListener("change", draw);
    // partition at x = 3 from y = 0 to y = 2.6 (doorway above)
    var P = { x1: 3, y1: 0, x2: 3, y2: 2.6 };
    var geo = null, drag = null;
    function segHit(ax, ay, bx, by) {      // does segment a-b cross the partition?
      if (!wallOn.checked) return false;
      function o(px, py, qx, qy, rx, ry) { return (qx - px) * (ry - py) - (qy - py) * (rx - px); }
      var d1 = o(ax, ay, bx, by, P.x1, P.y1), d2 = o(ax, ay, bx, by, P.x2, P.y2);
      var d3 = o(P.x1, P.y1, P.x2, P.y2, ax, ay), d4 = o(P.x1, P.y1, P.x2, P.y2, bx, by);
      return (d1 * d2 < 0) && (d3 * d4 < 0);
    }
    function paths() {
      var out = [{ name: "direct", img: { x: S.x, y: S.y }, refl: null }];
      [["left wall", -S.x, S.y, "x", 0], ["right wall", 2 * RW - S.x, S.y, "x", RW],
       ["bottom wall", S.x, -S.y, "y", 0], ["top wall", S.x, 2 * RH - S.y, "y", RH]].forEach(function (w) {
        var I = { x: w[1], y: w[2] }, t, R;
        if (w[3] === "x") { t = (w[4] - M.x) / (I.x - M.x); R = { x: w[4], y: M.y + t * (I.y - M.y) }; }
        else { t = (w[4] - M.y) / (I.y - M.y); R = { x: M.x + t * (I.x - M.x), y: w[4] }; }
        out.push({ name: w[0], img: I, refl: R });
      });
      out.forEach(function (q) {
        q.len = Math.hypot(q.img.x - M.x, q.img.y - M.y);
        q.blocked = q.refl ? (segHit(S.x, S.y, q.refl.x, q.refl.y) || segHit(q.refl.x, q.refl.y, M.x, M.y))
                           : segHit(S.x, S.y, M.x, M.y);
        q.doa = Math.atan2(q.img.y - M.y, q.img.x - M.x) * 180 / Math.PI;
      });
      return out;
    }
    function draw() {
      var p = palette(), c = fit(canvas, 0.75), ctx = c.ctx, W = c.w, H = c.h;
      // view shows the room plus a margin where most first-order mirror sources land
      var vx0 = -2, vx1 = RW + 2, vy0 = -2, vy1 = RH + 2;
      var sc = Math.min(W / (vx1 - vx0), H / (vy1 - vy0));
      var ox = (W - sc * (vx1 - vx0)) / 2, oy = (H - sc * (vy1 - vy0)) / 2;
      var X = function (x) { return ox + (x - vx0) * sc; }, Y = function (y) { return H - (oy + (y - vy0) * sc); };
      geo = { X: X, Y: Y, sc: sc, ox: ox, oy: oy, vx0: vx0, vy0: vy0, H: H };
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = p.rule; ctx.setLineDash([3, 4]);
      [[-RW, 0], [RW, 0], [0, -RH], [0, RH]].forEach(function (o) { ctx.strokeRect(X(o[0]), Y(o[1] + RH), RW * sc, RH * sc); });
      ctx.setLineDash([]);
      ctx.strokeStyle = p.ink; ctx.lineWidth = 2; ctx.strokeRect(X(0), Y(RH), RW * sc, RH * sc);
      if (wallOn.checked) { ctx.strokeStyle = p.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X(P.x1), Y(P.y1)); ctx.lineTo(X(P.x2), Y(P.y2)); ctx.stroke(); }
      var ps = paths();
      ps.forEach(function (q) {
        ctx.lineWidth = q.refl ? 1.4 : 2.2;
        ctx.strokeStyle = q.blocked ? p.red : (q.refl ? p.amber : p.blue);
        ctx.setLineDash(q.blocked ? [4, 4] : []);
        ctx.beginPath();
        if (q.refl) {
          ctx.moveTo(X(S.x), Y(S.y)); ctx.lineTo(X(q.refl.x), Y(q.refl.y)); ctx.lineTo(X(M.x), Y(M.y)); ctx.stroke();
          ctx.globalAlpha = 0.35; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(q.refl.x), Y(q.refl.y)); ctx.lineTo(X(q.img.x), Y(q.img.y)); ctx.stroke(); ctx.globalAlpha = 1;
          ctx.fillStyle = p.amber; ctx.beginPath(); ctx.arc(X(q.img.x), Y(q.img.y), 5, 0, 2 * Math.PI); ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
        } else { ctx.moveTo(X(S.x), Y(S.y)); ctx.lineTo(X(M.x), Y(M.y)); ctx.stroke(); }
        ctx.setLineDash([]);
      });
      ctx.fillStyle = p.amber; ctx.beginPath(); ctx.arc(X(S.x), Y(S.y), 8, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = p.blue; ctx.beginPath(); ctx.arc(X(M.x), Y(M.y), 8, 0, 2 * Math.PI); ctx.fill();
      axisText(ctx, p, "S", X(S.x) + 11, Y(S.y) + 4); axisText(ctx, p, "M", X(M.x) + 11, Y(M.y) + 4);
      axisText(ctx, p, "faint dots: first-order mirror sources", 8, 16);
      var d0 = ps[0].len, lines = ["path          length   delay    level vs direct   arrives from"];
      ps.slice().sort(function (a, b) { return a.len - b.len; }).forEach(function (q) {
        lines.push((q.name + "             ").slice(0, 13) + " " + q.len.toFixed(2) + " m  " + (q.len / 343 * 1000).toFixed(2).padStart(5) + " ms  " +
          (20 * Math.log10(d0 / q.len)).toFixed(1).padStart(6) + " dB        " + q.doa.toFixed(0).padStart(4) + "°" + (q.blocked ? "  BLOCKED" : ""));
      });
      var direct = ps[0];
      var loudest = ps.filter(function (q) { return !q.blocked; }).sort(function (a, b) { return a.len - b.len; })[0];
      lines.push("");
      lines.push(direct.blocked
        ? "Direct path occluded. The first sound to arrive comes from the " + (loudest ? loudest.name + " at " + loudest.doa.toFixed(0) + "°" : "(none)") +
          ", so a naive DOA points at a wall, not the source."
        : "Line of sight is clear: the earliest arrival is the true direction (" + direct.doa.toFixed(0) + "°).");
      lines.push("(level ignores wall absorption; real reflections are quieter still)");
      readout.textContent = lines.join("\n");
    }
    function toRoom(e) {
      var rect = canvas.getBoundingClientRect(), g = geo;
      var x = (e.clientX - rect.left - g.ox) / g.sc + g.vx0, y = (g.H - (e.clientY - rect.top) - g.oy) / g.sc + g.vy0;
      return { x: Math.max(0.1, Math.min(RW - 0.1, x)), y: Math.max(0.1, Math.min(RH - 0.1, y)) };
    }
    canvas.addEventListener("pointerdown", function (e) {
      var q = toRoom(e);
      drag = Math.hypot(q.x - S.x, q.y - S.y) < Math.hypot(q.x - M.x, q.y - M.y) ? S : M;
      drag.x = q.x; drag.y = q.y; canvas.setPointerCapture(e.pointerId); draw();
    });
    canvas.addEventListener("pointermove", function (e) { if (drag) { var q = toRoom(e); drag.x = q.x; drag.y = q.y; draw(); } });
    canvas.addEventListener("pointerup", function () { drag = null; });
    draw(); onResize(draw);
  })();
})();
