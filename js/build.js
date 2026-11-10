/* ==========================================================================
   Live build — a swarm of cursor "agents" assembles the page as you scroll.
   Every element marked with data-b="pop|wipe|type|media" starts hidden; an
   agent flies to it, draws a blue wireframe, then types, wipes, pops or fills
   it in. Visitors with "reduce motion" get the finished page immediately.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-b]'));
  var total = els.length;

  var hud = $('#hud'), hudText = $('#hudText'), hudBar = $('#hudBar'), hudBtn = $('#hudBtn'), hudX = $('#hudX'), hudDots = $('#hudDots');
  var layer = $('#buildLayer'), agentsBox = $('#agents'), ruler = $('#ruler'), intro = $('#intro');

  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (reduce || isNaN(to)) { el.textContent = el.getAttribute('data-count'); return; }
    var t0 = null, dur = 1200;
    (function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  function counters(el) {
    if (el.hasAttribute('data-count')) countUp(el);
    Array.prototype.forEach.call(el.querySelectorAll('[data-count]'), countUp);
  }

  /* ---------- Reduced motion: show everything ---------- */
  if (reduce) {
    els.forEach(function (el) { el.classList.add('built'); });
    if (hud) hud.remove();
    window.Build = { replay: function () {}, start: function () {} };
    return;
  }

  html.classList.add('building');

  var isMobile = window.innerWidth < 700;
  var N = isMobile ? 6 : 14;
  var COLORS = ['#ff8fab', '#7dd3fc', '#86efac', '#c4b5fd', '#fdba74', '#fde68a', '#f9a8d4', '#67e8f9', '#a7f3d0', '#fca5a5', '#93c5fd', '#d8b4fe'];

  var state = {
    running: false, done: false, builtCount: 0, startTime: 0, queue: [], queued: new Set(), waitingSince: new Map(),
    mode: 'intro', gen: 0
  };

  /* ---------- Agents ---------- */
  var agents = [];
  function arrow(color) {
    return '<svg viewBox="0 0 16 18"><path d="M1.5 1.5 L14 8.2 L8.3 9.6 L5.6 15.6 Z" fill="' + color + '" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  }
  for (var i = 0; i < N; i++) {
    var d = document.createElement('div');
    d.className = 'agent';
    d.innerHTML = arrow(COLORS[i % COLORS.length]);
    agentsBox.appendChild(d);
    var a = {
      el: d, i: i, x: window.innerWidth / 2 + (Math.random() - .5) * 200, y: window.innerHeight / 2 + (Math.random() - .5) * 200,
      tx: 0, ty: 0, k: .14, rot: 0, busy: false, wanderAt: 0, phase: Math.random() * Math.PI * 2
    };
    a.tx = a.x; a.ty = a.y;
    agents.push(a);
  }
  if (hudDots) hudDots.innerHTML = COLORS.slice(0, 5).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');

  var finalCard = $('#finalCard');
  function tickAgents(t) {
    var W = window.innerWidth, H = window.innerHeight;
    agents.forEach(function (a) {
      if (state.mode === 'intro') {
        // two swirling flocks either side of the logo
        var g = a.i % 2 ? 1 : -1;
        var ang = t / 700 * g + a.phase;
        var cx = W / 2 + g * Math.min(150, W * .2), cy = H / 2 + g * -30;
        a.tx = cx + Math.cos(ang) * (34 + (a.i % 3) * 14);
        a.ty = cy + Math.sin(ang * 1.3) * (26 + (a.i % 4) * 9);
        a.k = .12;
      } else if (state.mode === 'orbit' && finalCard) {
        var r = finalCard.getBoundingClientRect();
        var ang2 = t / 2600 + a.i / N * Math.PI * 2;
        var rad = Math.min(r.width, r.height) * .42;
        a.tx = r.left + r.width * .62 + Math.cos(ang2) * rad;
        a.ty = r.top + r.height * .5 + Math.sin(ang2) * rad * .85;
        a.k = .07;
      } else if (!a.busy) {
        if (t > a.wanderAt) {
          a.wanderAt = t + 1200 + Math.random() * 2000;
          a.tx = W * (.15 + Math.random() * .7);
          a.ty = H * (.35 + Math.random() * .55);
        }
        a.k = .025;
      }
      var dx = a.tx - a.x, dy = a.ty - a.y;
      a.x += dx * a.k; a.y += dy * a.k;
      var sp = Math.abs(dx) + Math.abs(dy);
      if (sp > 2) {
        var target = Math.atan2(dy, dx) * 180 / Math.PI + 152;
        var diff = ((target - a.rot + 540) % 360) - 180;
        a.rot += diff * .2;
      }
      a.el.style.transform = 'translate(' + a.x.toFixed(1) + 'px,' + a.y.toFixed(1) + 'px) rotate(' + a.rot.toFixed(1) + 'deg)';
    });
    requestAnimationFrame(tickAgents);
  }
  requestAnimationFrame(tickAgents);

  /* ---------- Helpers ---------- */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function docRect(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height, vx: r.left, vy: r.top };
  }
  function label(el, r) {
    var tag = el.tagName.toLowerCase();
    var cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').filter(function (c) { return c && c !== 'built' && c.indexOf('b-') !== 0; })[0] : '';
    return tag + (cls ? '.' + cls : '') + ' · ' + Math.round(r.w) + '×' + Math.round(r.h);
  }
  function guide(r) {
    var h = document.createElement('div'); h.className = 'gl h'; h.style.top = r.y + 'px';
    var v = document.createElement('div'); v.className = 'gl v'; v.style.left = r.x + 'px'; v.style.height = document.documentElement.scrollHeight + 'px';
    layer.appendChild(h); layer.appendChild(v);
    setTimeout(function () { h.classList.add('out'); v.classList.add('out'); }, 500);
    setTimeout(function () { h.remove(); v.remove(); }, 1200);
  }
  function plus(x, y) {
    var p = document.createElement('div'); p.className = 'plus'; p.style.left = x + 'px'; p.style.top = y + 'px';
    layer.appendChild(p);
    setTimeout(function () { p.classList.add('out'); }, 1400);
    setTimeout(function () { p.remove(); }, 2800);
  }
  var rulerTimer;
  function rulerOn() {
    ruler.classList.add('on');
    clearTimeout(rulerTimer);
    rulerTimer = setTimeout(function () { ruler.classList.remove('on'); }, 900);
  }

  function updateHud() {
    if (!hud) return;
    if (state.done) {
      var secs = ((performance.now() - state.startTime) / 1000).toFixed(1);
      hudText.innerHTML = 'Rebuilt by <b>' + N + '</b> agents in <b>' + secs + 's</b>';
      hudBar.style.width = '100%';
      hudBtn.textContent = 'Replay';
      return;
    }
    hudText.innerHTML = '<b>' + N + '</b> agents · ' + state.builtCount + ' / ' + total + ' layers';
    hudBar.style.width = (state.builtCount / total * 100) + '%';
  }

  /* typing across nested text nodes */
  function typeIn(el, gen) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) { if (n.textContent.trim() || n.textContent.length) nodes.push({ node: n, full: n.textContent }); }
    var totalChars = nodes.reduce(function (s, o) { return s + o.full.length; }, 0);
    nodes.forEach(function (o) { o.node.textContent = ''; });
    el.classList.add('built');
    var caret = document.createElement('span'); caret.className = 'caret';
    var dur = Math.max(260, Math.min(totalChars * 18, 650));
    var t0 = performance.now();
    return new Promise(function (resolve) {
      (function step() {
        if (gen !== state.gen) { nodes.forEach(function (o) { o.node.textContent = o.full; }); caret.remove(); resolve(); return; }
        var p = Math.min((performance.now() - t0) / dur, 1);
        var shown = Math.round(totalChars * p), acc = 0, last = null;
        nodes.forEach(function (o) {
          var take = Math.max(0, Math.min(o.full.length, shown - acc));
          o.node.textContent = o.full.slice(0, take);
          if (take > 0) last = o.node;
          acc += o.full.length;
        });
        if (last && last.parentNode) last.parentNode.insertBefore(caret, last.nextSibling);
        if (p < 1) requestAnimationFrame(step);
        else { setTimeout(function () { caret.remove(); }, 250); resolve(); }
      })();
    });
  }

  function markBuilt(el, kind) {
    if (el.classList.contains('built') && kind !== 'type') return;
    el.classList.add('built');
    if (kind) el.classList.add('b-' + kind);
    counters(el);
  }
  function finishOne(el) {
    state.builtCount++;
    state.waitingSince.delete(el);
    updateHud();
    if (state.builtCount >= total && !state.done) complete();
  }

  /* ---------- Build one element ---------- */
  function buildEl(a, el, gen) {
    var kind = el.getAttribute('data-b') || 'pop';
    var r0 = el.getBoundingClientRect();
    if (r0.width === 0 && r0.height === 0) { markBuilt(el, null); finishOne(el); return Promise.resolve(); }

    a.busy = true;
    a.k = .16;
    a.tx = r0.left + 2; a.ty = r0.top + 2;
    var r;
    return wait(160 + Math.random() * 90).then(function () {
      if (gen !== state.gen) return;
      r = docRect(el);
      rulerOn();
      guide(r);
      var wf = document.createElement('div');
      wf.className = 'wf' + (kind === 'media' ? ' media-wf' : '');
      wf.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:0;height:0;transition:width .26s,height .26s,opacity .45s,background .35s';
      wf.innerHTML = '<i></i><i></i><i></i><i></i><b>' + label(el, r) + '</b>';
      layer.appendChild(wf);
      requestAnimationFrame(function () { wf.style.width = r.w + 'px'; wf.style.height = r.h + 'px'; });
      a.k = .2;
      a.tx = r.vx + r.w; a.ty = r.vy + r.h;
      var step;
      if (kind === 'media') {
        step = wait(220).then(function () { wf.classList.add('fill'); return wait(300); }).then(function () { if (gen === state.gen) markBuilt(el, 'media'); return wait(160); });
      } else if (kind === 'type') {
        step = wait(200).then(function () { a.tx = r.vx + 6; a.ty = r.vy + r.h * .6; return typeIn(el, gen); }).then(function () { counters(el); });
      } else if (kind === 'wipe') {
        step = wait(220).then(function () { a.tx = r.vx; a.ty = r.vy + r.h * .5; markBuilt(el, 'wipe'); setTimeout(function () { a.tx = r.vx + r.w; }, 30); return wait(460); });
      } else {
        step = wait(220).then(function () { markBuilt(el, 'pop'); return wait(220); });
      }
      return step.then(function () {
        wf.classList.add('out');
        setTimeout(function () { wf.remove(); }, 500);
        if (Math.random() < .45) plus(r.x + (Math.random() < .5 ? -14 : r.w + 14), r.y + (Math.random() < .5 ? 0 : r.h));
      });
    }).then(function () {
      a.busy = false;
      if (gen === state.gen) finishOne(el);
    });
  }

  /* ---------- Queue + workers ---------- */
  function enqueue(el) {
    if (state.queued.has(el) || el.classList.contains('built')) return;
    state.queued.add(el);
    state.queue.push(el);
    state.waitingSince.set(el, performance.now());
    state.queue.sort(function (x, y) { return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
  }
  function worker(a, gen) {
    if (gen !== state.gen) return;
    if (!state.running) { setTimeout(function () { worker(a, gen); }, 150); return; }
    var el = state.queue.shift();
    if (!el) { setTimeout(function () { worker(a, gen); }, 90 + a.i * 7); return; }
    if (el.classList.contains('built')) { worker(a, gen); return; }
    // don't start a child before its parent is visible
    var parent = el.parentElement && el.parentElement.closest('[data-b]');
    if (parent && !parent.classList.contains('built')) { state.queue.push(el); setTimeout(function () { worker(a, gen); }, 60); return; }
    buildEl(a, el, gen).then(function () { worker(a, gen); });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) enqueue(e.target); });
  }, { rootMargin: '0px 0px -6% 0px' });

  // Safety net: anything left waiting in view too long builds instantly
  setInterval(function () {
    if (!state.running) return;
    var now = performance.now();
    // elements that are hidden (other project pages, mobile-only hides) count as built
    els.forEach(function (el) {
      if (!el.classList.contains('built') && el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
        var idx = state.queue.indexOf(el);
        if (idx > -1) state.queue.splice(idx, 1);
        el.classList.add('built');
        finishOne(el);
      }
    });
    state.waitingSince.forEach(function (since, el) {
      if (now - since > 2500 && !el.classList.contains('built')) {
        var idx = state.queue.indexOf(el);
        if (idx > -1) state.queue.splice(idx, 1);
        markBuilt(el, el.getAttribute('data-b') === 'wipe' ? 'wipe' : 'pop');
        finishOne(el);
      }
    });
  }, 500);

  function complete() {
    state.done = true;
    state.mode = 'orbit';
    updateHud();
    if (isMobile) setTimeout(function () { agentsBox.classList.add('gone'); }, 2500);
  }

  function skipAll() {
    state.gen++;
    state.queue.length = 0;
    els.forEach(function (el) { if (!el.classList.contains('built')) { el.classList.add('built', 'b-pop'); counters(el); } });
    state.builtCount = total;
    layer.innerHTML = '';
    agents.forEach(function (a) { a.busy = false; });
    if (!state.done) complete();
  }

  /* ---------- Start / replay ---------- */
  function start() {
    var gen = ++state.gen;
    state.running = false; state.done = false; state.builtCount = 0;
    state.queue.length = 0; state.queued.clear(); state.waitingSince.clear();
    state.mode = 'intro';
    agentsBox.classList.remove('gone');
    if (hud) { hudText.textContent = 'Scanning page…'; hudBtn.textContent = 'Touring'; hudBar.style.width = '0'; }
    intro.classList.remove('out');
    intro.style.display = '';
    setTimeout(function () {
      if (gen !== state.gen) return;
      intro.classList.add('out');
      setTimeout(function () { intro.style.display = 'none'; }, 800);
      state.mode = 'build';
      state.running = true;
      state.startTime = performance.now();
      updateHud();
      els.forEach(function (el) { io.unobserve(el); io.observe(el); });
      agents.forEach(function (a) { worker(a, gen); });
    }, 1300);
  }

  function replay() {
    state.gen++;
    layer.innerHTML = '';
    els.forEach(function (el) {
      el.classList.remove('built', 'b-pop', 'b-wipe', 'b-media', 'b-type');
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(start, 50);
  }

  if (hudBtn) hudBtn.addEventListener('click', function () { if (state.done) replay(); else skipAll(); });
  if (hudBtn) hudBtn.title = 'Skip the build animation';
  if (hudX) hudX.addEventListener('click', function () { hud.classList.add('hide'); });
  var replayBtn = $('#replay');
  if (replayBtn) replayBtn.addEventListener('click', function () { if (hud) hud.classList.remove('hide'); replay(); });

  // Make sure the page starts at the top so the build reads from the hero down
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  // The particle entrance can hold the build until the visitor presses "Reveal"
  var started = false;
  function begin() { if (started) return; started = true; start(); }
  if (!window.HOLD_BUILD) begin();

  window.Build = { replay: replay, skip: skipAll, start: begin };
})();
