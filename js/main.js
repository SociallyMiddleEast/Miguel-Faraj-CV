/* ==========================================================================
   Page interactions: project filters/search/pages, raw→real slider,
   journey accordion, copy buttons, active nav, clock, contact canvas.
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Projects: filter, search, pages ---------- */
  var cards = $$('#cards .card'), tabs = $$('.tab'), q = $('#q');
  var pagesBox = $('#pages'), info = $('#pageInfo'), empty = $('#empty');
  var PER = 3, page = 0, filter = 'all', showAll = false;

  function matches(c) {
    var okF = filter === 'all' || c.getAttribute('data-c').split(' ').indexOf(filter) > -1;
    var term = (q && q.value || '').trim().toLowerCase();
    var okQ = !term || c.textContent.toLowerCase().indexOf(term) > -1;
    return okF && okQ;
  }
  function render(animate) {
    var list = cards.filter(matches);
    var per = showAll ? list.length || 1 : PER;
    var pages = Math.max(1, Math.ceil(list.length / per));
    if (page >= pages) page = pages - 1;
    cards.forEach(function (c) { c.hidden = true; c.classList.remove('reveal-in'); });
    list.slice(page * per, page * per + per).forEach(function (c, i) {
      c.hidden = false;
      if (animate) { void c.offsetWidth; c.style.animationDelay = (i * 70) + 'ms'; c.classList.add('reveal-in'); }
    });
    empty.hidden = list.length > 0;
    info.textContent = 'See all (' + list.length + ')';
    pagesBox.innerHTML = '';
    for (var p = 0; p < pages; p++) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = p + 1; if (p === page) b.className = 'on';
      (function (p) { b.addEventListener('click', function () { page = p; render(true); }); })(p);
      pagesBox.appendChild(b);
    }
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.toggle('on', x === t); });
      filter = t.getAttribute('data-f'); page = 0; render(true);
    });
  });
  if (q) q.addEventListener('input', function () { page = 0; render(true); });
  $('#prev').addEventListener('click', function () { if (page > 0) { page--; render(true); } });
  $('#next').addEventListener('click', function () { var n = Math.ceil(cards.filter(matches).length / PER); if (page < n - 1) { page++; render(true); } });
  var seeAll = $('#seeAll');
  if (seeAll) seeAll.addEventListener('click', function (e) { e.preventDefault(); showAll = !showAll; page = 0; seeAll.firstChild.textContent = showAll ? 'Show less ' : 'See all '; render(true); });
  render(false);

  /* ---------- Raw → Real compare slider ---------- */
  var cmp = $('#compare'), range = $('#cmpRange');
  if (cmp && range) {
    var set = function (v) { cmp.style.setProperty('--x', v + '%'); };
    range.addEventListener('input', function () { set(range.value); });
    // gentle auto-sweep until the visitor touches it
    var touched = false;
    range.addEventListener('pointerdown', function () { touched = true; });
    range.addEventListener('keydown', function () { touched = true; });
    if (!reduce) {
      var t0 = null;
      var io = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting || touched) return;
        (function sweep(t) {
          if (touched) return;
          if (!t0) t0 = t;
          var v = 50 + Math.sin((t - t0) / 1100) * 28;
          range.value = v; set(v);
          if (t - t0 < 6600) requestAnimationFrame(sweep); else { range.value = 50; set(50); }
        })(performance.now());
        io.disconnect();
      }, { threshold: .6 });
      io.observe(cmp);
    }
  }

  /* ---------- Journey accordion ---------- */
  $$('.job').forEach(function (j) {
    j.addEventListener('click', function () {
      if (!j.querySelector('p')) return;
      j.classList.toggle('open');
    });
  });

  /* ---------- Copy buttons ---------- */
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy'));
      var txt = el.textContent.trim();
      var ok = function () { b.classList.add('ok'); b.textContent = '✓'; setTimeout(function () { b.classList.remove('ok'); b.textContent = '⧉'; }, 1500); };
      var sel = function () { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(txt).then(ok, sel); } catch (e) { sel(); }
    });
  });

  /* ---------- Active nav link ---------- */
  var links = $$('.nav ul a');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); });
  function onScroll() {
    var cur = -1, vh = window.innerHeight;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Beirut clock on the contact card ---------- */
  var clock = $('#clock');
  function tick() {
    try {
      var s = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Beirut' }).format(new Date());
      clock.textContent = 'BEIRUT ' + s;
    } catch (e) { clock.textContent = 'BEIRUT'; }
  }
  if (clock) { tick(); setInterval(tick, 30000); }

  /* ---------- Contact card: drifting signal particles ---------- */
  var c = $('#ctCanvas');
  if (c && !reduce) {
    var x = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, pts = [];
    var size = function () {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = []; for (var i = 0; i < 46; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, v: .15 + Math.random() * .5, red: Math.random() < .25 });
    };
    size(); window.addEventListener('resize', size);
    var vis = false;
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(c);
    (function loop() {
      if (vis) {
        x.clearRect(0, 0, W, H);
        pts.forEach(function (p) {
          p.x += p.v; if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; }
          x.fillStyle = p.red ? 'rgba(240,68,58,.8)' : 'rgba(255,255,255,.18)';
          x.fillRect(p.x, p.y, p.red ? 10 : 4, 1.5);
        });
      }
      requestAnimationFrame(loop);
    })();
  }
})();
