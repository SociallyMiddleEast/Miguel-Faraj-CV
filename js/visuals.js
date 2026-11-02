/* ==========================================================================
   Project visuals — SVG "screens" for each card and the Raw → Real slider.
   Each <div class="viz" data-viz="name"> is filled with the matching drawing.
   ========================================================================== */
(function () {
  'use strict';
  var W = 480, H = 300;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function svg(body, defs, w, h) {
    w = w || W; h = h || H;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>' + (defs || '') + '</defs>' + body + '</svg>';
  }
  function grid(w, h, step, col) {
    var s = '';
    for (var x = 0; x <= w; x += step) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '"/>';
    for (var y = 0; y <= h; y += step) s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '"/>';
    return '<g stroke="' + (col || 'rgba(120,160,220,.07)') + '" stroke-width="1">' + s + '</g>';
  }
  function path(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
  function series(n, x0, x1, yMid, amp, s) {
    seed = s; var pts = [], v = 0;
    for (var i = 0; i < n; i++) { v += (rnd() - .5) * amp; v *= .85; pts.push([x0 + (x1 - x0) * i / (n - 1), yMid + v + Math.sin(i / 3) * amp * .3]); }
    return pts;
  }
  function txt(x, y, s, size, fill, extra) { return '<text x="' + x + '" y="' + y + '" font-family="Manrope,Arial,sans-serif" font-size="' + size + '" fill="' + fill + '" ' + (extra || '') + '>' + s + '</text>'; }
  function mono(x, y, s, size, fill) { return '<text x="' + x + '" y="' + y + '" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="' + size + '" fill="' + fill + '">' + s + '</text>'; }
  var BG = '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e1a2b"/><stop offset="1" stop-color="#060a12"/></linearGradient>';

  var V = {};

  /* SCADA overview screen */
  V.hmi = function () {
    var d = BG + '<linearGradient id="tk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3ff"/><stop offset="1" stop-color="#1b5fae"/></linearGradient><linearGradient id="tk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52e39a"/><stop offset="1" stop-color="#147a4a"/></linearGradient><linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4656"/><stop offset=".5" stop-color="#8795a8"/><stop offset="1" stop-color="#3a4656"/></linearGradient>';
    var b = '<rect width="480" height="300" fill="url(#bg)"/>' + grid(480, 300, 24);
    b += '<rect x="0" y="0" width="480" height="26" fill="#0a1220"/><rect x="0" y="26" width="480" height="1" fill="#1f3350"/>';
    b += txt(12, 17, 'PLANT OVERVIEW · AREA 2', 9, '#cfe0ff', 'font-weight="700" letter-spacing="1"') + '<circle cx="404" cy="13" r="3.5" fill="#3fd18a"/>' + txt(412, 16.5, 'RUNNING', 8, '#3fd18a', 'font-weight="700"');
    function tank(x, lvl, grad, name, val) {
      var h = 130, y = 70, fh = h * lvl;
      return '<rect x="' + x + '" y="' + y + '" width="64" height="' + h + '" rx="8" fill="#0b1422" stroke="url(#steel)" stroke-width="3"/>' +
        '<rect x="' + (x + 4) + '" y="' + (y + h - fh + 2) + '" width="56" height="' + (fh - 6) + '" rx="5" fill="url(#' + grad + ')" opacity=".9"><animate attributeName="y" values="' + (y + h - fh + 2) + ';' + (y + h - fh - 6) + ';' + (y + h - fh + 2) + '" dur="5s" repeatCount="indefinite"/><animate attributeName="height" values="' + (fh - 6) + ';' + (fh + 2) + ';' + (fh - 6) + '" dur="5s" repeatCount="indefinite"/></rect>' +
        '<g stroke="rgba(255,255,255,.25)">' + [0.25, .5, .75].map(function (t) { return '<line x1="' + (x + 50) + '" x2="' + (x + 60) + '" y1="' + (y + h * t) + '" y2="' + (y + h * t) + '"/>'; }).join('') + '</g>' +
        txt(x, y - 10, name, 8.5, '#9fb6d6', 'font-weight="700"') +
        '<rect x="' + x + '" y="' + (y + h + 10) + '" width="64" height="18" rx="3" fill="#0a1220" stroke="#1f3350"/>' + mono(x + 8, y + h + 22.5, val, 9, '#e6f0ff');
    }
    b += tank(40, .62, 'tk', 'TK-101 RAW', '62.4 %') + tank(330, .38, 'tk2', 'TK-102 PROD', '38.1 %');
    b += '<path d="M104 180 H180 M220 180 H330" stroke="#2c4a70" stroke-width="7" fill="none"/>';
    b += '<path d="M104 180 H180 M220 180 H330" stroke="#5fb4ff" stroke-width="2" fill="none" stroke-dasharray="6 8"><animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1s" repeatCount="indefinite"/></path>';
    b += '<circle cx="200" cy="180" r="20" fill="#0b1422" stroke="url(#steel)" stroke-width="3"/><g transform="translate(200 180)"><path d="M-8 -10 L12 0 L-8 10Z" fill="#3fd18a"/><animateTransform attributeName="transform" type="rotate" from="0 200 180" to="0 200 180" dur="1s"/></g>';
    b += txt(182, 215, 'P-201', 8.5, '#9fb6d6', 'font-weight="700"') + mono(178, 228, '1480 rpm', 8.5, '#3fd18a');
    b += '<path d="M260 172 l8 8 -8 8 M276 172 l-8 8 8 8" stroke="#e8edf5" stroke-width="2" fill="#2c4a70"/>' + txt(256, 160, 'XV-12', 8, '#9fb6d6');
    b += '<rect x="150" y="60" width="140" height="62" rx="4" fill="#0a1220" stroke="#1f3350"/>' + txt(160, 76, 'FLOW FT-201', 8, '#9fb6d6', 'font-weight="700"');
    b += mono(160, 100, '42.7', 20, '#ffffff') + txt(212, 100, 'm³/h', 9, '#9fb6d6');
    b += '<path d="' + path(series(18, 160, 280, 112, 10, 3)) + '" stroke="#5fb4ff" stroke-width="1.5" fill="none"/>';
    b += '<rect x="0" y="270" width="480" height="30" fill="#2a0c0c"/><rect x="0" y="270" width="4" height="30" fill="#f0443a"/>' + txt(14, 289, '⚠  ALARM HISTORY · 0 ACTIVE · LAST: LSL-102 CLEARED 08:42', 8.5, '#ffb4ae', 'font-weight="700"');
    return svg(b, d);
  };

  /* Production dashboard */
  V.dash = function () {
    var d = '<linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14141a"/><stop offset="1" stop-color="#09090c"/></linearGradient><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0443a" stop-opacity=".45"/><stop offset="1" stop-color="#f0443a" stop-opacity="0"/></linearGradient>';
    var b = '<rect width="480" height="300" fill="url(#bg2)"/>';
    b += '<rect x="0" y="0" width="70" height="300" fill="#0d0d11"/>' + [40, 70, 100, 130, 160].map(function (y, i) { return '<rect x="18" y="' + y + '" width="34" height="18" rx="4" fill="' + (i === 1 ? '#f0443a' : '#1b1b22') + '"/>'; }).join('');
    b += txt(84, 30, 'Production · Line 3', 12, '#ffffff', 'font-weight="800"') + txt(84, 44, 'Current shift · live', 8, '#8b8b92');
    var k = [['OUTPUT', '1,284', '+6.2%', '#3fd18a'], ['AVAILABILITY', '94.1%', '+1.4%', '#3fd18a'], ['STOPS', '3', '-2', '#f0443a']];
    k.forEach(function (t, i) {
      var x = 84 + i * 130;
      b += '<rect x="' + x + '" y="56" width="120" height="58" rx="6" fill="#16161c" stroke="#24242c"/>' + txt(x + 10, 72, t[0], 7.5, '#8b8b92', 'font-weight="700" letter-spacing="1"') + txt(x + 10, 96, t[1], 18, '#fff', 'font-weight="800"') + txt(x + 10, 107, t[2], 7.5, t[3], 'font-weight="700"');
    });
    b += '<rect x="84" y="124" width="250" height="160" rx="6" fill="#16161c" stroke="#24242c"/>' + txt(96, 141, 'Throughput (units/h)', 8.5, '#cfcfd6', 'font-weight="700"');
    b += '<g stroke="#24242c">' + [170, 200, 230, 260].map(function (y) { return '<line x1="96" x2="322" y1="' + y + '" y2="' + y + '"/>'; }).join('') + '</g>';
    var p = series(22, 96, 322, 215, 34, 11);
    b += '<path d="' + path(p) + ' L322 272 L96 272Z" fill="url(#ar)"/><path d="' + path(p) + '" stroke="#f0443a" stroke-width="2" fill="none"/>';
    var p2 = series(22, 96, 322, 238, 16, 5);
    b += '<path d="' + path(p2) + '" stroke="#5f6070" stroke-width="1.3" fill="none" stroke-dasharray="4 4"/>';
    b += '<circle cx="' + p[21][0] + '" cy="' + p[21][1] + '" r="4" fill="#f0443a"><animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite"/></circle>';
    b += '<rect x="344" y="124" width="126" height="160" rx="6" fill="#16161c" stroke="#24242c"/>' + txt(356, 141, 'Downtime causes', 8.5, '#cfcfd6', 'font-weight="700"');
    var r = 34, c = 2 * Math.PI * r, segs = [[.46, '#f0443a'], [.28, '#f2a541'], [.16, '#5fb4ff'], [.1, '#3a3a44']], off = 0;
    segs.forEach(function (s) { b += '<circle cx="407" cy="200" r="' + r + '" fill="none" stroke="' + s[1] + '" stroke-width="12" stroke-dasharray="' + (s[0] * c) + ' ' + c + '" stroke-dashoffset="' + (-off * c) + '" transform="rotate(-90 407 200)"/>'; off += s[0]; });
    b += txt(407, 204, '42m', 12, '#fff', 'font-weight="800" text-anchor="middle"');
    b += txt(356, 258, '■ Changeover  ■ Jam', 7, '#8b8b92') + txt(356, 270, '■ Material  ■ Other', 7, '#8b8b92');
    return svg(b, d);
  };

  /* IIoT network */
  V.net = function () {
    var d = '<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f0443a" stop-opacity=".55"/><stop offset="1" stop-color="#f0443a" stop-opacity="0"/></radialGradient>' + BG;
    var b = '<rect width="480" height="300" fill="url(#bg)"/>' + grid(480, 300, 20, 'rgba(120,160,220,.06)');
    var plcs = [[60, 60], [60, 130], [60, 200], [60, 260]], gw = [240, 150], tops = [[400, 60], [410, 150], [400, 240]];
    var lines = '';
    plcs.forEach(function (p, i) {
      lines += '<path id="l' + i + '" d="M' + (p[0] + 34) + ' ' + p[1] + ' C 160 ' + p[1] + ', 170 150, ' + (gw[0] - 26) + ' 150" stroke="#244a7a" stroke-width="1.5" fill="none"/>';
      lines += '<circle r="3" fill="#7dd3fc"><animateMotion dur="' + (2 + i * .4) + 's" repeatCount="indefinite"><mpath href="#l' + i + '"/></animateMotion></circle>';
    });
    tops.forEach(function (p, i) {
      lines += '<path id="t' + i + '" d="M' + (gw[0] + 26) + ' 150 C 320 150, 330 ' + p[1] + ', ' + (p[0] - 30) + ' ' + p[1] + '" stroke="#5c1a18" stroke-width="1.5" fill="none"/>';
      lines += '<circle r="3" fill="#f0443a"><animateMotion dur="' + (1.6 + i * .5) + 's" repeatCount="indefinite"><mpath href="#t' + i + '"/></animateMotion></circle>';
    });
    b += lines;
    plcs.forEach(function (p, i) {
      b += '<rect x="' + (p[0] - 34) + '" y="' + (p[1] - 18) + '" width="68" height="36" rx="3" fill="#0d1726" stroke="#2c4a70"/>';
      for (var k = 0; k < 5; k++) b += '<rect x="' + (p[0] - 28 + k * 11) + '" y="' + (p[1] - 12) + '" width="8" height="18" fill="#1a2a40"/><circle cx="' + (p[0] - 24 + k * 11) + '" cy="' + (p[1] - 8) + '" r="1.3" fill="' + (k % 2 ? '#3fd18a' : '#f2a541') + '"/>';
      b += txt(p[0] - 30, p[1] + 14, 'PLC-0' + (i + 1), 6.5, '#9fb6d6', 'font-weight="700"');
    });
    b += '<circle cx="240" cy="150" r="60" fill="url(#glow)"/><circle cx="240" cy="150" r="26" fill="#f0443a"/><circle cx="240" cy="150" r="34" fill="none" stroke="#f0443a" stroke-opacity=".4"><animate attributeName="r" values="28;44" dur="1.8s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".6;0" dur="1.8s" repeatCount="indefinite"/></circle>';
    b += txt(240, 148, 'OPC UA', 7.5, '#fff', 'font-weight="800" text-anchor="middle"') + txt(240, 158, 'GATEWAY', 6, '#ffe1de', 'text-anchor="middle" font-weight="700"');
    var tl = ['SCADA', 'HISTORIAN', 'CLOUD'];
    tops.forEach(function (p, i) {
      b += '<rect x="' + (p[0] - 30) + '" y="' + (p[1] - 20) + '" width="64" height="40" rx="6" fill="#1a0e0f" stroke="#5c1a18"/>' + txt(p[0] + 2, p[1] + 3, tl[i], 7.5, '#ffd6d2', 'font-weight="800" text-anchor="middle"');
    });
    b += mono(14, 292, 'tags/s 1,240 · latency 18 ms · quality GOOD', 8, '#7dd3fc');
    return svg(b, d);
  };

  /* Historian trends */
  V.hist = function () {
    var b = '<rect width="480" height="300" fill="#07090d"/>';
    b += '<rect x="0" y="0" width="480" height="24" fill="#0e121a"/>' + txt(12, 16, 'HISTORIAN · TREND VIEW · LAST 30 DAYS', 8.5, '#cfe0ff', 'font-weight="700" letter-spacing="1"');
    b += '<rect x="12" y="34" width="456" height="170" fill="#0b0f16" stroke="#1c2433"/>';
    b += '<g stroke="#1c2433">' + [68, 102, 136, 170].map(function (y) { return '<line x1="12" x2="468" y1="' + y + '" y2="' + y + '"/>'; }).join('') + [88, 164, 240, 316, 392].map(function (x) { return '<line y1="34" y2="204" x1="' + x + '" x2="' + x + '"/>'; }).join('') + '</g>';
    [['#f0443a', 90, 30, 2], ['#5fb4ff', 120, 22, 9], ['#3fd18a', 160, 16, 13], ['#f2a541', 140, 26, 21]].forEach(function (s) {
      b += '<path d="' + path(series(48, 12, 468, s[1], s[2], s[3])) + '" stroke="' + s[0] + '" stroke-width="1.6" fill="none"/>';
    });
    b += '<line x1="330" x2="330" y1="34" y2="204" stroke="#fff" stroke-dasharray="3 3"><animate attributeName="x1" values="60;440;60" dur="9s" repeatCount="indefinite"/><animate attributeName="x2" values="60;440;60" dur="9s" repeatCount="indefinite"/></line>';
    var rows = [['TT-101', 'Temperature', '72.4 °C', '#f0443a'], ['FT-201', 'Flow', '42.7 m³/h', '#5fb4ff'], ['PT-305', 'Pressure', '3.8 bar', '#3fd18a'], ['JT-410', 'Power', '118 kW', '#f2a541']];
    rows.forEach(function (r, i) {
      var y = 222 + i * 19;
      b += '<rect x="12" y="' + (y - 12) + '" width="456" height="17" fill="' + (i % 2 ? '#0b0f16' : '#0e131c') + '"/><rect x="18" y="' + (y - 7) + '" width="8" height="8" fill="' + r[3] + '"/>' + mono(34, y, r[0], 8.5, '#e6f0ff') + txt(110, y, r[1], 8.5, '#8ea3c0') + mono(400, y, r[2], 8.5, '#ffffff');
    });
    return svg(b);
  };

  /* Code / API */
  V.api = function () {
    var b = '<rect width="480" height="300" fill="#0b0b10"/><rect width="480" height="24" fill="#131319"/>';
    b += '<circle cx="14" cy="12" r="4" fill="#f0443a"/><circle cx="28" cy="12" r="4" fill="#f2a541"/><circle cx="42" cy="12" r="4" fill="#3fd18a"/>' + txt(64, 15.5, 'line_status.py — integrations', 8, '#8b8b92');
    b += '<rect x="0" y="24" width="120" height="276" fill="#0f0f15"/>';
    ['▾ integrations', '   scada.py', '   erp_sync.py', '   line_status.py', '   historian.py', '▾ api', '   routes.py', '   auth.py'].forEach(function (f, i) { b += txt(10, 44 + i * 16, f, 8, i === 3 ? '#ffffff' : '#7b7b86', i === 3 ? 'font-weight="700"' : ''); });
    b += '<rect x="0" y="' + (32 + 3 * 16) + '" width="120" height="16" fill="#f0443a" opacity=".15"/>';
    var K = '#ff7b72', S = '#a5d6ff', F = '#d2a8ff', C = '#6e7681', N = '#79c0ff', T = '#e6edf3';
    var L = [
      [[K, '@app'], [T, '.get('], [S, '"/lines/{id}/status"'], [T, ')']],
      [[K, 'def '], [F, 'line_status'], [T, '(id: '], [N, 'int'], [T, '):']],
      [[C, '    # read live tags from the SCADA gateway']],
      [[T, '    tags = gateway.'], [F, 'read'], [T, '(['], [S, '"State"'], [T, ', '], [S, '"Speed"'], [T, '])']],
      [[T, '    stops = historian.'], [F, 'count'], [T, '('], [S, '"Stop"'], [T, ', shift='], [K, 'True'], [T, ')']],
      [[K, '    return '], [T, '{']],
      [[S, '        "state"'], [T, ': tags.State,']],
      [[S, '        "speed"'], [T, ': '], [F, 'round'], [T, '(tags.Speed, '], [N, '1'], [T, '),']],
      [[S, '        "stops"'], [T, ': stops,']],
      [[T, '    }']],
      [],
      [[C, '# 200 OK  {"state":"RUNNING","speed":420.0,"stops":3}']]
    ];
    L.forEach(function (ln, i) {
      var y = 46 + i * 18, x = 160;
      b += mono(132, y, String(i + 1).padStart(2, ' '), 8.5, '#3b3b45');
      var s = '';
      ln.forEach(function (tk) { s += '<tspan fill="' + tk[0] + '">' + tk[1].replace(/</g, '&lt;') + '</tspan>'; });
      b += '<text x="' + x + '" y="' + y + '" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="9" xml:space="preserve">' + s + '</text>';
    });
    b += '<rect x="160" y="' + (46 + 9 * 18 + 4) + '" width="6" height="11" fill="#f0443a"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>';
    b += '<rect x="120" y="276" width="360" height="24" fill="#f0443a"/>' + txt(132, 291, '● main   Python 3.12   ✓ 24 tests passed', 8, '#fff', 'font-weight="700"');
    return svg(b);
  };

  /* R&D isometric line */
  V.radar = function () {
    var d = '<linearGradient id="bg6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140c10"/><stop offset="1" stop-color="#060506"/></linearGradient><linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0443a" stop-opacity="0"/><stop offset=".5" stop-color="#f0443a" stop-opacity=".5"/><stop offset="1" stop-color="#f0443a" stop-opacity="0"/></linearGradient>';
    var b = '<rect width="480" height="300" fill="url(#bg6)"/>';
    function iso(x, y, w, h, z, top, l, r) {
      return '<path d="M' + x + ' ' + y + ' l' + w + ' ' + (-w / 2) + ' l' + h + ' ' + (h / 2) + ' l' + (-w) + ' ' + (w / 2) + 'Z" fill="' + top + '" transform="translate(0 ' + (-z) + ')"/>' +
        '<path d="M' + x + ' ' + (y - z) + ' l' + h + ' ' + (h / 2) + ' v' + z + ' l' + (-h) + ' ' + (-h / 2) + 'Z" fill="' + l + '"/>' +
        '<path d="M' + (x + h) + ' ' + (y - z + h / 2) + ' l' + w + ' ' + (-w / 2) + ' v' + z + ' l' + (-w) + ' ' + (w / 2) + 'Z" fill="' + r + '"/>';
    }
    for (var gx = 0; gx < 14; gx++) b += '<path d="M' + (20 + gx * 34) + ' 300 L' + (240 + gx * 34 - 200) + ' 120" stroke="rgba(240,68,58,.08)"/>';
    b += iso(70, 220, 240, 40, 14, '#2a2a33', '#1a1a20', '#131318');
    b += iso(110, 200, 46, 36, 50, '#3a3a46', '#24242c', '#1b1b22') + iso(200, 156, 46, 36, 70, '#f0443a', '#9e1d1a', '#6e1310') + iso(290, 112, 46, 36, 40, '#3a3a46', '#24242c', '#1b1b22');
    b += '<g stroke="#e8e8ee" stroke-width="5" stroke-linecap="round" fill="none"><path d="M360 230 L380 170 L430 150"><animate attributeName="d" values="M360 230 L380 170 L430 150;M360 230 L372 168 L414 136;M360 230 L380 170 L430 150" dur="3s" repeatCount="indefinite"/></path></g><circle cx="360" cy="232" r="9" fill="#2a2a33" stroke="#f0443a" stroke-width="2"/>';
    b += '<rect x="0" y="0" width="80" height="300" fill="url(#beam)"><animate attributeName="x" values="-80;480" dur="3.2s" repeatCount="indefinite"/></rect>';
    b += '<rect x="14" y="14" width="150" height="54" rx="4" fill="rgba(0,0,0,.6)" stroke="#2a2a33"/>' + txt(24, 31, 'POC · VISION INSPECTION', 7.5, '#ffd6d2', 'font-weight="800" letter-spacing=".8"') + txt(24, 50, 'IN TEST', 15, '#fff', 'font-weight="800"') + txt(24, 61, 'Proof of concept · R&amp;D lab', 6.5, '#8b8b92');
    return svg(b, d);
  };

  /* Raw → Real: final dashboard */
  V.real = function () {
    var d = '<linearGradient id="bgR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101824"/><stop offset="1" stop-color="#07090e"/></linearGradient><linearGradient id="arR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4ff" stop-opacity=".4"/><stop offset="1" stop-color="#5fb4ff" stop-opacity="0"/></linearGradient>';
    var b = '<rect width="480" height="285" fill="url(#bgR)"/>' + grid(480, 285, 30, 'rgba(120,160,220,.05)');
    b += txt(20, 34, 'LINE 3 · OPERATIONS', 10, '#ffffff', 'font-weight="800" letter-spacing="1.2"') + '<rect x="380" y="20" width="80" height="20" rx="10" fill="rgba(63,209,138,.15)" stroke="#3fd18a"/>' + txt(420, 34, '● RUNNING', 8, '#3fd18a', 'font-weight="800" text-anchor="middle"');
    var k = [['OUTPUT', '500', 'units'], ['SPEED', '420', 'u/h'], ['STOPS', '3', 'today'], ['QUALITY', '99.2', '%']];
    k.forEach(function (t, i) {
      var x = 20 + i * 112;
      b += '<rect x="' + x + '" y="52" width="102" height="62" rx="6" fill="rgba(255,255,255,.03)" stroke="#1f2c40"/>' + txt(x + 10, 68, t[0], 7, '#8ea3c0', 'font-weight="800" letter-spacing="1"') + txt(x + 10, 96, t[1], 22, i === 2 ? '#f0443a' : '#fff', 'font-weight="800"') + txt(x + 10, 107, t[2], 7, '#8ea3c0');
    });
    b += '<rect x="20" y="124" width="300" height="144" rx="6" fill="rgba(255,255,255,.03)" stroke="#1f2c40"/>' + txt(32, 142, 'Speed vs target', 8.5, '#cfe0ff', 'font-weight="700"');
    var p = series(26, 32, 308, 205, 30, 17);
    b += '<path d="' + path(p) + ' L308 258 L32 258Z" fill="url(#arR)"/><path d="' + path(p) + '" stroke="#5fb4ff" stroke-width="2" fill="none"/><line x1="32" x2="308" y1="188" y2="188" stroke="#f0443a" stroke-dasharray="5 4"/>' + txt(270, 184, 'target', 7, '#f0443a');
    b += '<rect x="330" y="124" width="130" height="144" rx="6" fill="rgba(255,255,255,.03)" stroke="#1f2c40"/>' + txt(342, 142, 'Machine states', 8.5, '#cfe0ff', 'font-weight="700"');
    [['Filler', '#3fd18a', 'RUN'], ['Capper', '#3fd18a', 'RUN'], ['Labeler', '#f2a541', 'IDLE'], ['Packer', '#3fd18a', 'RUN'], ['Palletizer', '#f0443a', 'STOP']].forEach(function (m, i) {
      var y = 162 + i * 21;
      b += '<circle cx="347" cy="' + (y - 3) + '" r="4" fill="' + m[1] + '"/>' + txt(358, y, m[0], 8.5, '#e6f0ff') + txt(448, y, m[2], 7.5, m[1], 'font-weight="800" text-anchor="end"');
    });
    return svg(b, d, 480, 285);
  };

  /* Raw → Real: raw PLC data */
  V.rawdata = function () {
    seed = 99;
    var b = '<rect width="480" height="285" fill="#030403"/>';
    b += mono(20, 30, '$ opcua-client --read ns=3;s=PLC_LINE3/*', 9, '#3fd18a');
    var hex = '0123456789ABCDEF';
    for (var r = 0; r < 13; r++) {
      var y = 52 + r * 17;
      var addr = 'DB12.DBW' + (r * 2);
      var v = '0x'; for (var j = 0; j < 4; j++) v += hex[Math.floor(rnd() * 16)];
      var q = rnd() > .85 ? 'BAD ' : 'GOOD';
      b += mono(20, y, ('[' + addr + ']').padEnd(14, ' ').replace(/ /g, ' '), 9, '#5d7a62') + mono(130, y, v, 9, rnd() > .7 ? '#f0443a' : '#9fd8a8') + mono(190, y, String(Math.floor(rnd() * 65535)).padStart(5, '0'), 9, '#4a5e4d') + mono(240, y, q, 9, q === 'BAD ' ? '#f0443a' : '#3e6b47') + mono(286, y, '1' + Math.floor(rnd() * 9) + ':4' + Math.floor(rnd() * 9) + ':0' + Math.floor(rnd() * 9) + '.' + Math.floor(rnd() * 999), 9, '#33453a');
    }
    b += mono(20, 276, '… 1,227 more tags   _', 9, '#3fd18a');
    b += '<g stroke="#1b2a1e">' + [370, 400, 430, 460].map(function (x) { return '<line x1="' + x + '" x2="' + x + '" y1="44" y2="250"/>'; }).join('') + '</g>';
    for (var t = 0; t < 12; t++) b += '<rect x="' + (364 + (t % 4) * 30) + '" y="' + (52 + Math.floor(t / 4) * 70) + '" width="12" height="40" fill="none" stroke="#2f4a35"/>';
    return svg(b, '', 480, 285);
  };

  window.renderVisuals = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.viz[data-viz]'), function (el) {
      var fn = V[el.getAttribute('data-viz')];
      if (fn && !el.firstChild) el.innerHTML = fn();
    });
  };
  window.renderVisuals();
})();
