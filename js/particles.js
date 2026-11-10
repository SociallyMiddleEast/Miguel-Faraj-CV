/* ==========================================================================
   Particle entrance — the site opens on a glowing 3D point cloud of Miguel
   with "DEVELOPER" behind it. "Reveal" scatters the dots and opens the
   portfolio (starting the live build); "Back to dots" in the hero returns here.
   WebGL, no libraries. If WebGL or image access isn't available, the
   entrance is skipped and the portfolio opens straight away.
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  var gate = document.getElementById('gate');
  var img = document.getElementById('gateImg');
  var canvas = document.getElementById('gateCanvas');
  var revealBtn = document.getElementById('gateReveal');
  var backBtn = document.getElementById('backToDots');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.ParticleGate = { alive: true };

  function startSite() { if (window.Build && window.Build.start) window.Build.start(); }
  function skipGate() {
    if (gate) gate.remove();
    html.classList.remove('gate-open');
    if (backBtn) backBtn.remove();
    startSite();
  }
  if (!gate || !img || !canvas) { skipGate(); return; }
  var gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { skipGate(); return; }

  /* ---------- Build the point cloud from the photo ---------- */
  var SAMPLE_W = window.innerWidth < 700 ? 170 : 270;
  var count = 0, ready = false;
  var imgAspect = 1;

  function buildCloud() {
    var w = SAMPLE_W, h = Math.round(SAMPLE_W * img.naturalHeight / img.naturalWidth);
    imgAspect = img.naturalHeight / img.naturalWidth;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.drawImage(img, 0, 0, w, h);
    var d;
    try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return false; } // e.g. opened from file://
    var lum = new Float32Array(w * h), al = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      al[i] = d[i * 4 + 3] / 255;
      lum[i] = (d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114) / 255;
    }
    // row extents of the silhouette (for a rounded body depth)
    var L = new Int16Array(h), R = new Int16Array(h);
    for (var yy = 0; yy < h; yy++) {
      L[yy] = -1; R[yy] = -1;
      for (var xx = 0; xx < w; xx++) if (al[yy * w + xx] > .5) { if (L[yy] < 0) L[yy] = xx; R[yy] = xx; }
    }
    var pos = [], col = [], rnd = [];
    var per = w < 200 ? 3 : 4; // particles per pixel
    for (var y = 1; y < h - 1; y++) {
      if (L[y] < 0) continue;
      var cx = (L[y] + R[y]) / 2, hw = Math.max((R[y] - L[y]) / 2, 1);
      for (var x2 = 1; x2 < w - 1; x2++) {
        var k = y * w + x2;
        var a = al[k];
        if (a < .35) continue;
        // edge strength (Sobel on luminance + alpha) → bright outlines like the reference
        var gx = (lum[k + 1] - lum[k - 1]) * 2 + (lum[k - w + 1] - lum[k - w - 1]) + (lum[k + w + 1] - lum[k + w - 1]);
        var gy = (lum[k + w] - lum[k - w]) * 2 + (lum[k + w - 1] - lum[k - w - 1]) + (lum[k + w + 1] - lum[k - w + 1]);
        var ga = Math.abs(al[k + 1] - al[k - 1]) + Math.abs(al[k + w] - al[k - w]);
        var edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 1.6 + ga * 1.2);
        var b = lum[k];
        var inten = .06 + b * .42 + edge * 1.25;
        var fade = Math.pow(Math.min(1, (h - y) / (h * .38)), 1.4); // the photo fades out at the bottom
        for (var p = 0; p < per; p++) {
          if (Math.random() > .22 + inten * .7) continue;
          var jx = x2 + Math.random() - .5, jy = y + Math.random() - .5;
          var u = (jx - cx) / hw;
          var dome = Math.sqrt(Math.max(0, 1 - u * u));
          var z = dome * hw * .85 + b * 6 + (Math.random() - .5) * 3;
          pos.push(jx / w - .5, jy / h - .5, z / w);
          // colour ramp: deep red → orange → hot yellow
          var t = Math.min(1, inten);
          var r = .42 + .58 * Math.min(1, t * 1.8);
          var g = .03 + .48 * Math.pow(t, 2.2);
          var bl = .01 + .28 * Math.pow(t, 3.6);
          col.push(r, g, bl, Math.min(1, (.22 + inten * .95) * fade * a));
          var ang = Math.random() * Math.PI * 2, rad = Math.pow(Math.random(), .5);
          rnd.push(Math.cos(ang) * rad, Math.sin(ang) * rad, Math.random(), Math.random());
        }
      }
    }
    count = pos.length / 3;
    upload('aPos', new Float32Array(pos), 3);
    upload('aCol', new Float32Array(col), 4);
    upload('aRnd', new Float32Array(rnd), 4);
    return true;
  }

  /* ---------- Shaders ---------- */
  var VS = [
    'attribute vec3 aPos; attribute vec4 aCol; attribute vec4 aRnd;',
    'uniform vec2 uRes; uniform vec4 uBox; uniform vec2 uOrigin; uniform vec2 uMouse;',
    'uniform float uT; uniform float uMode; uniform float uTime; uniform float uRotY; uniform float uRotX; uniform float uPR;',
    'varying vec4 vCol;',
    'void main(){',
    '  vec3 p = vec3(aPos.x * uBox.z, aPos.y * uBox.w, aPos.z * uBox.z);',
    '  float cy = cos(uRotY), sy = sin(uRotY);',
    '  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);',
    '  float cx = cos(uRotX), sx = sin(uRotX);',
    '  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);',
    '  float persp = 1400.0 / (1400.0 - p.z);',
    '  vec2 tgt = p.xy * persp + uBox.xy;',
    '  tgt += aRnd.xy * 0.9 * sin(uTime * 1.7 + aRnd.w * 40.0);',
    '  float dist = length(tgt - uOrigin) / max(uBox.z, uBox.w);',
    '  float delay = dist * 0.9 + aRnd.z * 0.35;',
    '  float k = clamp((uT - delay) / 1.15, 0.0, 1.0);',
    '  vec2 pos; float alpha; float heat;',
    '  if (uMode > 0.5) {',
    '    float e = 1.0 - pow(1.0 - k, 3.0);',
    '    vec2 start = uOrigin + aRnd.xy * 120.0 * (0.4 + aRnd.z);',
    '    vec2 swirl = vec2(-(tgt.y - uOrigin.y), tgt.x - uOrigin.x) * 0.35 * sin(e * 3.14159);',
    '    pos = mix(start, tgt, e) + swirl * (1.0 - e);',
    '    alpha = smoothstep(0.0, 0.15, k);',
    '    heat = (1.0 - e) * 1.6;',
    '  } else {',
    '    float e = k * k;',
    '    pos = tgt + vec2(aRnd.x * 160.0, aRnd.y * 160.0 - 140.0 * aRnd.z) * e;',
    '    alpha = 1.0 - smoothstep(0.2, 1.0, k);',
    '    heat = e;',
    '  }',
    '  vec2 dm = pos - uMouse; float md = length(dm);',
    '  pos += (dm / max(md, 0.001)) * pow(max(0.0, 46.0 - md) / 46.0, 2.0) * 18.0;',
    '  vec2 clip = (pos / uRes) * 2.0 - 1.0;',
    '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
    '  gl_PointSize = (1.3 + aCol.a * 1.2) * uPR * persp;',
    '  vCol = vec4(aCol.rgb * (1.0 + heat), aCol.a * alpha);',
    '}'
  ].join('\n');
  var FS = [
    'precision mediump float; varying vec4 vCol;',
    'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vCol.a;',
    '  gl_FragColor = vec4(vCol.rgb * a, a); }'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
  } catch (e) { skipGate(); return; }
  function upload(name, data, size) {
    var loc = gl.getAttribLocation(prog, name);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  var U = {};
  ['uRes', 'uBox', 'uOrigin', 'uMouse', 'uT', 'uMode', 'uTime', 'uRotY', 'uRotX', 'uPR'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  /* ---------- State ---------- */
  var mode = 0;                 // 1 = dots forming / shown, 0 = dots scattering away
  var tStart = -10, origin = [0, 0];
  var mouse = [-9999, -9999], mouseN = [0, 0], rotY = 0, rotX = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, open = true;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function box() {
    var ir = img.getBoundingClientRect();
    return [ir.left + ir.width / 2, ir.top + ir.height / 2, ir.width, ir.height];
  }
  function now() { return performance.now() / 1000; }

  function setMode(m) {
    mode = m;
    tStart = now() - (reduce ? 10 : 0);
    var b = box();
    origin = [b[0], b[1] + b[3] * .1];
    loopStart();
  }

  /* ---------- Render loop (only while the entrance is showing) ---------- */
  var running = false;
  function loopStart() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function frame() {
    var t = now() - tStart;
    var targetY = mouseN[0] * .55 + (reduce ? 0 : Math.sin(now() * .5) * .22);
    var targetX = mouseN[1] * .08;
    rotY += (targetY - rotY) * .06;
    rotX += (targetX - rotX) * .06;
    var b = box();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform4f(U.uBox, b[0], b[1], b[2], b[3]);
    gl.uniform2f(U.uOrigin, origin[0], origin[1]);
    gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uMode, mode);
    gl.uniform1f(U.uTime, reduce ? 0 : now());
    gl.uniform1f(U.uRotY, rotY);
    gl.uniform1f(U.uRotX, rotX);
    gl.uniform1f(U.uPR, dpr);
    gl.drawArrays(gl.POINTS, 0, count);
    if (!open && mode === 0 && t > 2.4) { running = false; gl.clear(gl.COLOR_BUFFER_BIT); return; }
    requestAnimationFrame(frame);
  }

  /* ---------- Reveal / back ---------- */
  var first = true;
  function reveal() {
    if (!open) return;
    open = false;
    revealBtn.classList.remove('show');
    setMode(0);                                   // dots scatter
    gate.classList.add('leaving');
    setTimeout(function () {
      gate.classList.add('hidden');
      html.classList.remove('gate-open');
      window.scrollTo(0, 0);
      if (first) { first = false; startSite(); }  // the live build plays the first time
    }, reduce ? 0 : 1100);
  }
  function back() {
    if (open) return;
    open = true;
    gate.classList.remove('hidden');
    html.classList.add('gate-open');
    void gate.offsetWidth;
    gate.classList.remove('leaving');
    setTimeout(function () {
      setMode(1);
      setTimeout(function () { revealBtn.classList.add('show'); }, reduce ? 0 : 1600);
    }, reduce ? 0 : 350);
  }
  revealBtn.addEventListener('click', reveal);
  if (backBtn) backBtn.addEventListener('click', back);
  document.addEventListener('keydown', function (e) { if (open && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { e.preventDefault(); reveal(); } });

  gate.addEventListener('pointermove', function (e) {
    mouse = [e.clientX, e.clientY];
    mouseN = [(e.clientX / window.innerWidth - .5) * 2, (e.clientY / window.innerHeight - .5) * 2];
  });
  gate.addEventListener('pointerleave', function () { mouse = [-9999, -9999]; mouseN = [0, 0]; });
  window.addEventListener('resize', resize);

  /* ---------- Start ---------- */
  function init() {
    resize();
    if (!buildCloud()) { skipGate(); return; }   // e.g. opened from file://
    gate.classList.add('ready');
    setTimeout(function () {
      setMode(1);
      setTimeout(function () { revealBtn.classList.add('show'); revealBtn.focus({ preventScroll: true }); }, reduce ? 0 : 1800);
    }, reduce ? 0 : 250);
  }
  if (img.complete && img.naturalWidth) init(); else { img.addEventListener('load', init); img.addEventListener('error', skipGate); }

  window.ParticleGate = { alive: true, reveal: reveal, back: back };
})();
