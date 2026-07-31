/* 心電圖示意波形產生器 —— 供 tools/acls.html 的「心電圖判讀」各分頁使用。
 *
 * 波形不是圖檔，是把「毫秒 → 毫伏」的函數每 4 ms 取樣一次畫成一條 <path>，格線用 <pattern> 鋪。
 * 座標約定：1 mm = 4 繪圖單位；紙速 25 mm/s → 1 ms = 0.1 單位；增益 10 mm/mV → 1 mV = 40 單位。
 * 顏色一律吃 --ekg-paper / --ekg-minor / --ekg-major / --ekg-trace 四個變數，亮／暗主題自動正確。
 *
 * 線寬用 vector-effect="non-scaling-stroke"：同一頁裡 5 秒長條與 1.7 秒短條的 viewBox 寬度差三倍，
 * 若用一般 stroke-width，短條的線會粗上三倍（手機單欄時最明顯）。
 *
 * 用法：<div class="ekg-strip" data-ekg="nsr" [data-dur=ms] [data-h=mm] [data-base=mm]></div>
 *       載入後呼叫 window.ekgDrawAll()。
 */
(function () {
  'use strict';

  var MSX = 0.1, MV = 40, STEP = 4;

  /* ---------- 波形元件 ---------- */
  function tri(t, t0, d, a) {                    // 尖三角：正常窄 QRS 的 Q/R/S
    var h = d / 2, x = Math.abs(t - (t0 + h));
    return x >= h ? 0 : a * (1 - x / h);
  }
  function rnd(t, t0, d, a) {                    // 圓鈍隆起：寬 QRS、心室源心搏、J 波
    var x = (t - (t0 + d / 2)) / (d / 2);
    if (x <= -1 || x >= 1) return 0;
    var v = Math.cos(x * Math.PI / 2);
    return a * v * v;
  }
  function gau(t, t0, d, a) {                    // 高斯：P、T、U
    var s = d / 5, z = (t - (t0 + d / 2)) / s;
    return (z < -3 || z > 3) ? 0 : a * Math.exp(-0.5 * z * z);
  }
  function bifid(t, t0, d, a) {                  // 雙峰 P（左心房肥大 P mitrale）
    return gau(t, t0, d * 0.60, a) + gau(t, t0 + d * 0.40, d * 0.60, a * 0.92);
  }
  function plat(t, t0, t1, a, e) {               // 平滑邊平台：ST 偏移
    e = e || 20;
    if (t < t0 - e || t > t1 + e) return 0;
    var v = 1;
    if (t < t0 + e) v = (t - t0 + e) / (2 * e);
    else if (t > t1 - e) v = (t1 + e - t) / (2 * e);
    return a * Math.max(0, Math.min(1, v));
  }
  function segment(t, t0, t1, a0, a1) {          // 斜行 ST：由 J 點的 a0 線性走到 T 起點的 a1
    var e = 16;
    if (t < t0 - e || t > t1 + e) return 0;
    var u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    var v = a0 + (a1 - a0) * u;
    if (t < t0 + e) v *= (t - t0 + e) / (2 * e);
    else if (t > t1 - e) v *= (t1 + e - t) / (2 * e);
    return v;
  }

  /* QRS＝數個成分依序相接。成分寫成 [寬度, 振幅] 為尖銳三角；加第三個值 'r' 為圓鈍隆起。
     推進距離必須跟著形狀走（尖 0.8×、圓鈍 0.92×）：寬 QRS 若照尖波的重疊比例排，
     後一段會抵消前一段的下降支，畫出來又變回一根根細尖峰、看起來反而像窄 QRS。 */
  /* 第 4 個值可覆寫推進比例：想做出「一個寬 R 上面帶切跡」時，兩個隆起要重疊到
     四成左右（0.42）才會是一座有凹口的山，照預設 0.92 排就會變成兩根分開的峰。 */
  function adv(c) { return c[0] * (c[3] !== undefined ? c[3] : (c[2] === 'r' ? 0.92 : 0.8)); }
  function qrs(t, j, k) {
    var y = 0, x = j;
    for (var i = 0; i < k.length; i++) {
      y += (k[i][2] === 'r' ? rnd : tri)(t, x, k[i][0], k[i][1]);
      x += adv(k[i]);
    }
    return y;
  }
  function qw(k) {
    var w = 0;
    for (var i = 0; i < k.length; i++) w += (i === k.length - 1) ? k[i][0] : adv(k[i]);
    return w;
  }

  var QN  = [[22, -0.07], [46, 1.15], [34, -0.22]];              // 標準窄 QRS ≈ 88 ms
  var QVW = [[80, 1.15, 'r', 0.42], [72, 1.02, 'r'], [70, -0.46, 'r']]; // 心室源寬 QRS ≈ 170 ms（寬 R 帶切跡＋寬 S）
  var QPV = [[72, 1.08, 'r', 0.42], [64, 0.95, 'r'], [64, -0.42, 'r']]; // 心室早期收縮 ≈ 153 ms
  var QLB = [[90, 1.02, 'r', 0.5], [95, 1.20, 'r']];              // LBBB 型（V6、右心室起搏）≈ 140 ms，寬 R 帶切跡

  /* 一個完整心搏。t0＝P 波起點（無 P 時即 QRS 起點，並給 pr:0）。 */
  function beat(t, t0, o) {
    o = o || {};
    var y = 0;
    var pA = (o.p === undefined) ? 0.15 : o.p;
    var pD = o.pd || 100;
    var pr = (o.pr === undefined) ? 160 : o.pr;
    if (pA) y += (o.pshape === 'bifid' ? bifid : gau)(t, t0, pD, pA);
    var k = o.qrs || QN, j = t0 + pr, w = qw(k);
    y += qrs(t, j, k);
    if (o.prDep) y += plat(t, t0 + pD, j, o.prDep, 12);      // PR 段壓低（急性心包炎）
    var stD = (o.stD === undefined) ? 90 : o.stD;
    var tD = o.td || 160, tOn = j + w + stD;
    if (o.st) {
      if (o.st2 === undefined) y += plat(t, j + w, tOn + tD * 0.45, o.st, 18);
      else y += segment(t, j + w, tOn, o.st, o.st2);
    }
    if (o.jw) y += rnd(t, j + w - 10, o.jwd || 58, o.jw);     // J 波（Osborn、早期再極化切跡）
    if (o.sag) y += rnd(t, j + w + 8, o.sagd || 130, o.sag);  // 杓狀壓低（毛地黃效應）
    var tA = (o.t === undefined) ? 0.30 : o.t;
    if (tA) y += gau(t, tOn, tD, tA);
    if (o.u) y += gau(t, tOn + tD + 40, 150, o.u);
    return y;
  }

  function series(t, ts, fn) {
    var y = 0;
    for (var i = 0; i < ts.length; i++) {
      var t0 = ts[i];
      if (t < t0 - 300 || t > t0 + 1700) continue;
      y += fn(t, t0, i);
    }
    return y;
  }
  function every(p, n, s) { var a = [], i; for (i = 0; i < n; i++) a.push((s || 0) + i * p); return a; }
  function rhythm(period, n, start, o) {
    var ts = every(period, n, start);
    return function (t) { return series(t, ts, function (tt, t0) { return beat(tt, t0, o); }); };
  }
  function prng(seed) {                                    // 固定種子：每次載入畫出來都一樣
    var s = seed;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  /* ============================================================
     各型態
     ============================================================ */
  var SPEC = {};

  /* ---- 竇性 ---- */
  SPEC.nsr    = { f: rhythm(800, 8, 60) };
  SPEC.stach  = { f: rhythm(430, 12, 40, { pr: 135, pd: 90, stD: 45, td: 165, t: 0.26 }) };
  SPEC.sbrady = { f: rhythm(1400, 5, 80, { pr: 165 }) };
  SPEC.spause = { f: function (t) {                          // 竇性停頓：中間漏掉兩拍
      return series(t, [60, 860, 1660, 4060, 4860], function (tt, t0) { return beat(tt, t0); });
    } };

  /* ---- 心房／上心室 ---- */
  SPEC.pac = { f: function (t) {                             // 心房早期收縮＋非完全代償間歇
      var y = series(t, [60, 860, 2160, 2960], function (tt, t0) { return beat(tt, t0); });
      y += beat(t, 1480, { p: 0.19, pd: 80, pr: 150 });       // 提早、形態不同的 P
      y += beat(t, 3760, { p: 0.19, pd: 80, pr: 150 });
      return y;
    } };
  SPEC.af = { f: function (t) {
      var fib = 0.055 * Math.sin(t * 2 * Math.PI / 152) + 0.04 * Math.sin(t * 2 * Math.PI / 108 + 1.2)
              + 0.03 * Math.sin(t * 2 * Math.PI / 230 + 2.6);
      var ts = [120, 700, 1180, 1980, 2380, 3180, 3560, 4380, 4760];
      return fib + series(t, ts, function (tt, t0) { return beat(tt, t0, { p: 0, pr: 0, stD: 80, td: 150, t: 0.25 }); });
    } };
  SPEC.afl = { f: function (t) {
      var u = (t % 200) / 200;
      var saw = (u < 0.78) ? (-0.06 - 0.28 * (u / 0.78)) : (-0.34 + 0.28 * ((u - 0.78) / 0.22));
      return saw + series(t, every(400, 13, 110), function (tt, t0) {
        return beat(tt, t0, { p: 0, pr: 0, stD: 70, td: 120, t: 0.12 });
      });
    } };
  SPEC.psvt = { f: function (t) {
      return series(t, every(340, 16, 60), function (tt, t0) {
        return beat(tt, t0, { p: 0, pr: 0, stD: 45, td: 110, t: 0.20 }) + tri(tt, t0 + 78, 34, -0.14);
      });
    } };
  SPEC.junc = { f: function (t) {                            // 接合部逸搏節律：逆行 P 在 II 倒置
      return series(t, every(1250, 5, 120), function (tt, t0) {
        return beat(tt, t0, { p: 0, pr: 0, stD: 95, td: 165 }) - gau(tt, t0 + 118, 90, 0.13);
      });
    } };

  /* ---- 心室 ---- */
  SPEC.pvc = { f: function (t) {                             // 竇性＋單一 PVC＋完全代償間歇
      var y = series(t, [60, 860, 2460, 3260, 4060], function (tt, t0) { return beat(tt, t0); });
      y += beat(t, 1560, { p: 0, pr: 0, qrs: QPV, stD: 60, td: 190, t: -0.34 });
      return y;
    } };
  SPEC.vt = { h: 32, base: 19, f: function (t) {
      var y = series(t, every(380, 14, 40), function (tt, t0) {
        return beat(tt, t0, { p: 0, pr: 0, qrs: QVW, stD: 40, td: 170, t: -0.30 });
      });
      return y + series(t, every(700, 8, 180), function (tt, t0) { return gau(tt, t0, 100, 0.10); });
    } };
  SPEC.aivr = { h: 32, base: 19, f: rhythm(720, 8, 60, { p: 0, pr: 0, qrs: QVW, stD: 45, td: 200, t: -0.30 }) };

  /* 心室顫動：不能用幾個正弦波疊出來（那會太規律、像正弦波節律）。
     改以固定種子的亂數產生「間距 52–140 ms、振幅與極性都亂」的圓鈍隆起串，才是真正的雜亂。 */
  (function () {
    var r = prng(20260731), humps = [], t = 0;
    while (t < 5400) {
      var iv = 46 + r() * 74;
      humps.push([t, iv * (0.85 + r() * 0.5), (r() * 2 - 1) * (0.40 + r() * 0.72)]);
      t += iv;
      if (r() > 0.55) humps.push([t - iv * 0.45, 34 + r() * 26, (r() * 2 - 1) * 0.30]);  // 疊上更快的細碎成分
    }
    SPEC.vf = { h: 34, base: 17, f: function (tt) {
        var y = 0;
        for (var i = 0; i < humps.length; i++) {
          var h = humps[i];
          if (tt < h[0] - h[1] || tt > h[0] + h[1] * 2) continue;
          y += rnd(tt, h[0], h[1], h[2]);
        }
        return y;
      } };
  })();

  /* 尖端扭轉：複合波要「連在一起」（間距 220 ms、寬 120 ms），
     振幅與極性由一條正弦包絡帶著繞基線翻面，才看得出扭轉的緞帶。 */
  SPEC.tdp = { h: 36, base: 18, f: function (t) {
      var LQ = { pr: 170, stD: 210, td: 210, t: 0.26, u: 0.09 };
      var y = beat(t, 40, LQ)
            + beat(t, 700, { p: 0, pr: 0, qrs: QPV, stD: 60, td: 180, t: -0.30 })
            + beat(t, 1560, LQ)
            + beat(t, 2120, { p: 0, pr: 0, qrs: QPV, stD: 50, td: 140, t: -0.18 });
      var start = 2340;
      if (t >= start) {
        var w = 2 * Math.PI / 228;                       // 約 260 bpm 的連續振盪
        var env = 1.18 * Math.sin(Math.PI * (t - start) / 1160);   // 每 1160 ms 換一次極性＝扭轉一圈
        var osc = 0.78 * Math.sin(w * (t - start)) + 0.22 * Math.sin(2 * w * (t - start) + 0.7);
        var fade = Math.min(1, (t - start) / 90);        // 起跑處平順接上
        y += env * osc * fade;
      }
      return y;
    } };

  SPEC.asystole = { f: function (t) {                        // 幾乎平線，只剩極微的基線飄移
      return 0.022 * Math.sin(t / 430) + 0.012 * Math.sin(t / 137 + 1.1);
    } };

  /* ---- 房室阻滯 ---- */
  SPEC.avb1  = { f: rhythm(900, 7, 40, { pr: 300 }) };
  SPEC.avb2a = { f: function (t) {                           // Wenckebach 4:3
      var y = 0, i, t0;
      for (i = 0; i < 7; i++) {
        t0 = 60 + i * 800;
        y += gau(t, t0, 100, 0.15);
        if (i % 4 !== 3) y += beat(t, t0, { p: 0, pr: 160 + 80 * (i % 4) });
      }
      return y;
    } };
  SPEC.avb2b = { f: function (t) {                           // Mobitz II 4:3，PR 固定
      var y = 0, i, t0;
      for (i = 0; i < 7; i++) {
        t0 = 60 + i * 800;
        y += gau(t, t0, 100, 0.15);
        if (i % 4 !== 3) y += beat(t, t0, { p: 0, pr: 200 });
      }
      return y;
    } };
  SPEC.avb3 = { f: function (t) {                            // 心房 80／心室 38，互不相干
      var EQ = [[42, -0.16, 'r'], [68, 1.05, 'r'], [78, -0.42, 'r']];
      return series(t, every(750, 8, 40), function (tt, t0) { return gau(tt, t0, 100, 0.16); })
           + series(t, every(1580, 4, 260), function (tt, t0) {
               return beat(tt, t0, { p: 0, pr: 0, qrs: EQ, stD: 90, td: 200, t: -0.28 });
             });
    } };

  /* ---- 束支與分支阻滯 ---- */
  SPEC['rbbb-v1'] = { f: rhythm(800, 4, 60, { p: 0.12, qrs: [[26, 0.36], [46, -0.30, 'r'], [68, 0.85, 'r']], stD: 55, td: 150, t: -0.24 }) };
  SPEC['rbbb-v6'] = { f: rhythm(800, 4, 60, { p: 0.12, qrs: [[18, -0.10], [42, 1.00], [90, -0.44, 'r']], stD: 55, td: 150, t: 0.22 }) };
  SPEC['lbbb-v1'] = { h: 32, base: 13, f: rhythm(800, 4, 60, { p: 0.12, qrs: [[26, 0.10], [122, -1.15, 'r']], stD: 55, td: 170, st: 0.25, t: 0.38 }) };
  SPEC['lbbb-v6'] = { f: rhythm(800, 4, 60, { p: 0.12, qrs: QLB, stD: 55, td: 170, st: -0.14, t: -0.34 }) };
  SPEC['lafb-i']   = { f: rhythm(800, 4, 60, { p: 0.12, qrs: [[20, -0.12], [46, 0.85], [26, -0.05]], stD: 80, td: 150, t: 0.22 }) };
  SPEC['lafb-iii'] = { f: rhythm(800, 4, 60, { p: 0.10, qrs: [[24, 0.18], [50, -0.85]], stD: 80, td: 150, t: 0.10 }) };
  SPEC['lpfb-i']   = { f: rhythm(800, 4, 60, { p: 0.12, qrs: [[24, 0.16], [50, -0.60]], stD: 80, td: 150, t: 0.12 }) };
  SPEC['lpfb-iii'] = { f: rhythm(800, 4, 60, { p: 0.12, qrs: [[20, -0.14], [46, 0.90], [26, -0.06]], stD: 80, td: 150, t: 0.20 }) };

  /* ---- 腔室肥大 ---- */
  SPEC['rae-ii'] = { f: rhythm(850, 4, 60, { p: 0.30, pd: 95, pr: 160 }) };
  SPEC['rae-v1'] = { f: rhythm(850, 4, 60, { p: 0.22, pd: 90, pr: 160, qrs: [[24, 0.28], [46, -0.70]], stD: 70, td: 150, t: 0.14 }) };
  SPEC['lae-ii'] = { f: rhythm(850, 4, 60, { p: 0.16, pd: 150, pshape: 'bifid', pr: 210 }) };
  SPEC['lae-v1'] = { f: function (t) {                       // V1 終末負向成分深且寬（Morris index）
      return series(t, every(850, 4, 60), function (tt, t0) {
        return beat(tt, t0, { p: 0.12, pd: 70, pr: 210, qrs: [[24, 0.26], [46, -0.66]], stD: 70, td: 150, t: 0.14 })
             - gau(tt, t0 + 62, 110, 0.16);
      });
    } };
  SPEC['rvh-v1'] = { h: 36, base: 20, f: rhythm(800, 4, 60, { p: 0.22, pd: 90, qrs: [[30, 1.00], [46, -0.34]], stD: 55, td: 150, st: -0.14, t: -0.32 }) };
  SPEC['rvh-v6'] = { h: 36, base: 20, f: rhythm(800, 4, 60, { p: 0.16, qrs: [[20, -0.08], [40, 0.42], [58, -0.78]], stD: 75, td: 150, t: 0.14 }) };
  SPEC['lvh-v1'] = { h: 44, base: 15, f: rhythm(800, 4, 60, { p: 0.14, qrs: [[24, 0.20], [58, -1.75]], stD: 70, td: 170, st: 0.16, t: 0.40 }) };
  SPEC['lvh-v5'] = { h: 44, base: 30, f: rhythm(800, 4, 60, { p: 0.16, pd: 130, pshape: 'bifid', qrs: [[20, -0.16], [56, 2.15], [34, -0.20]], stD: 60, st: -0.22, st2: -0.30, td: 170, t: -0.45 }) };

  /* ---- 節律器 ---- */
  var SPK = 0.62;                                            // 起搏訊號高度（mV，示意用）
  SPEC.aai = {                                               // 心房起搏：訊號在 P 之前，QRS 是自己的（窄）
    spikes: function () { return every(1000, 5, 60).map(function (x) { return { t: x, a: SPK }; }); },
    f: rhythm(1000, 5, 60, { p: 0.16, pd: 100, pr: 170 })
  };
  SPEC.vvi = {                                               // 心室起搏：訊號在寬 QRS 之前，與 P 無關
    spikes: function () { return every(880, 6, 120).map(function (x) { return { t: x, a: SPK }; }); },
    f: function (t) {
      return series(t, every(880, 6, 120), function (tt, t0) {
               return beat(tt, t0, { p: 0, pr: 6, qrs: QLB, stD: 55, td: 180, st: -0.16, t: -0.40 });
             })
           + series(t, every(1030, 6, 300), function (tt, t0) { return gau(tt, t0, 100, 0.11); });
    }
  };
  SPEC.ddd = {                                               // 雙腔：兩個訊號，心房訊號→P，心室訊號→寬 QRS
    spikes: function () {
      var a = [];
      every(900, 6, 60).forEach(function (x) { a.push({ t: x, a: SPK }, { t: x + 170, a: SPK }); });
      return a;
    },
    f: rhythm(900, 6, 60, { p: 0.16, pd: 100, pr: 176, qrs: QLB, stD: 55, td: 180, st: -0.16, t: -0.40 })
  };
  SPEC.pacefail = {                                          // 未奪獲：第 3、5 個訊號後面沒有 QRS
    spikes: function () { return every(880, 6, 120).map(function (x) { return { t: x, a: SPK }; }); },
    f: function (t) {
      var y = 0;
      every(880, 6, 120).forEach(function (x, i) {
        if (i === 2 || i === 4) return;
        y += beat(t, x, { p: 0, pr: 6, qrs: QLB, stD: 55, td: 180, st: -0.16, t: -0.40 });
      });
      return y;
    }
  };

  /* ---- 缺血／梗塞 ---- */
  SPEC['stemi-hyper'] = { h: 32, base: 20, f: rhythm(800, 3, 60, { td: 250, t: 0.80, stD: 60, st: 0.08 }) };
  SPEC['stemi-elev']  = { h: 32, base: 20, f: rhythm(800, 3, 60, { qrs: [[26, -0.18], [44, 0.85], [30, -0.10]], stD: 70, st: 0.42, td: 210, t: 0.45 }) };
  SPEC['stemi-evol']  = { h: 32, base: 20, f: rhythm(800, 3, 60, { qrs: [[40, -0.55], [44, 0.45], [28, -0.08]], stD: 110, td: 190, t: -0.40 }) };
  SPEC['stemi-recip'] = { h: 32, base: 20, f: rhythm(800, 3, 60, { qrs: [[20, -0.06], [44, 0.75], [30, -0.15]], stD: 90, st: -0.22, td: 170, t: -0.26 }) };
  /* Wellens A：T 波先正後負（雙相）——用「正向 T ＋ 其後一個負向丘」合成 */
  SPEC.wellensa = { h: 32, base: 18, f: rhythm(800, 3, 60, { qrs: [[20, -0.05], [46, 1.05], [30, -0.14]], stD: 95, td: 130, t: 0.22, u: -0.36 }) };
  SPEC.wellensb = { h: 32, base: 18, f: rhythm(800, 3, 60, { qrs: [[20, -0.05], [46, 1.05], [30, -0.14]], stD: 95, td: 220, t: -0.62 }) };
  SPEC.dewinter = { h: 32, base: 18, f: rhythm(800, 3, 60, { qrs: [[20, -0.06], [46, 0.90], [30, -0.16]], stD: 90, st: -0.22, st2: -0.04, td: 200, t: 0.78 }) };

  /* ---- 全身因素 ---- */
  SPEC['rvs-i']   = { f: rhythm(545, 4, 40, { p: 0.10, pr: 140, qrs: [[28, 0.35], [48, -0.55]], stD: 60, td: 130, t: 0.10 }) };
  SPEC['rvs-iii'] = { f: rhythm(545, 4, 40, { p: 0.12, pr: 140, qrs: [[34, -0.38], [44, 0.52], [26, -0.10]], stD: 55, td: 130, t: -0.28 }) };
  SPEC['rvs-v1']  = { f: rhythm(545, 4, 40, { p: 0.22, pd: 80, pr: 140, qrs: [[26, 0.30], [46, -0.68]], stD: 55, td: 130, t: -0.32 }) };
  SPEC.ich = { h: 34, base: 14, f: rhythm(1000, 6, 60, { pr: 180, stD: 190, td: 300, t: -0.80, u: 0.16 }) };
  SPEC.hyperk1 = { f: rhythm(850, 3, 60, { p: 0.06, pr: 215, stD: 80, td: 105, t: 0.85 }) };
  SPEC.hyperk2 = { f: rhythm(850, 3, 60, { p: 0, pr: 0, qrs: [[120, 0.80, 'r'], [104, -0.30, 'r']], stD: 25, td: 200, t: 0.70 }) };
  SPEC.hyperk3 = { h: 32, base: 16, f: function (t) {
      return 0.80 * Math.sin(t * 2 * Math.PI / 640) + 0.10 * Math.sin(t * 2 * Math.PI / 320 + 0.6);
    } };
  SPEC.hypok  = { f: rhythm(850, 3, 60, { stD: 100, td: 150, t: 0.07, u: 0.30, st: -0.07 }) };
  SPEC.hypoca = { f: rhythm(850, 3, 60, { stD: 265, td: 150, t: 0.30 }) };
  SPEC.hyperca = { f: rhythm(850, 3, 60, { stD: 15, td: 140, t: 0.32 }) };
  SPEC['qt-normal'] = { f: rhythm(800, 3, 60, { stD: 90, td: 160, t: 0.32 }) };
  SPEC['qt-long']   = { f: rhythm(800, 3, 60, { stD: 190, td: 250, t: 0.30, u: 0.12 }) };

  /* ---- 其他重要型態 ---- */
  /* delta 波：圓鈍隆起的「峰」剛好落在 R 波起點（推進 0.5），兩者相加才是一段緩慢爬升的
     斜坡再接上主波；照預設推進排會變成 delta 與 R 兩個分開的小峰。 */
  SPEC.wpw = { f: rhythm(800, 4, 60, { pr: 92, qrs: [[100, 0.42, 'r', 0.5], [46, 1.05], [34, -0.18]], stD: 55, td: 170, t: -0.26 }) };
  SPEC.brugada = { h: 32, base: 15, f: rhythm(850, 4, 60, { p: 0.12, qrs: [[26, 0.30], [40, -0.22, 'r'], [56, 0.55, 'r']], stD: 60, st: 0.42, td: 190, t: -0.40 }) };
  SPEC.pericarditis = { f: rhythm(720, 5, 40, { pr: 155, prDep: -0.08, stD: 70, st: 0.16, td: 170, t: 0.34 }) };
  SPEC.earlyrepol = { f: rhythm(950, 4, 60, { stD: 70, st: 0.16, jw: 0.20, jwd: 46, td: 190, t: 0.52 }) };
  SPEC.osborn = { f: rhythm(1500, 4, 80, { pr: 220, stD: 120, jw: 0.42, jwd: 66, td: 210, t: 0.26 }) };
  SPEC.digoxin = { f: rhythm(900, 4, 60, { pr: 190, stD: 60, sag: -0.20, td: 120, t: 0.09, u: 0.10 }) };
  SPEC.alternans = { f: function (t) {                       // 電交替＋低電壓＋竇性心搏過速
      return series(t, every(520, 10, 60), function (tt, t0, i) {
        var s = (i % 2) ? 0.62 : 1.0;
        return beat(tt, t0, { p: 0.06 * s, pr: 140, qrs: [[20, -0.03 * s], [44, 0.42 * s], [30, -0.08 * s]], stD: 60, td: 130, t: 0.10 * s });
      });
    } };

  /* ============================================================
     繪製
     ============================================================ */
  var uid = 0;
  function draw(el) {
    var spec = SPEC[el.getAttribute('data-ekg')];
    if (!spec) return;
    var dur = +(el.getAttribute('data-dur') || spec.dur || 5000);
    var hmm = +(el.getAttribute('data-h') || spec.h || 30);
    var bmm = +(el.getAttribute('data-base') || spec.base || 20);
    var W = dur * MSX, H = hmm * 4, B = bmm * 4;

    var d = '', n = 0, t, y;
    for (t = 0; t <= dur; t += STEP) {
      y = B - spec.f(t) * MV;
      if (y < 1.2) y = 1.2; else if (y > H - 1.2) y = H - 1.2;
      d += (n++ ? 'L' : 'M') + (t * MSX).toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }

    var spikes = '';
    if (spec.spikes) {
      spec.spikes().forEach(function (s) {
        if (s.t > dur) return;
        var x = (s.t * MSX).toFixed(1);
        spikes += '<line class="eg-spike" x1="' + x + '" y1="' + (B + 5).toFixed(1) +
                  '" x2="' + x + '" y2="' + (B - s.a * MV).toFixed(1) + '"/>';
      });
    }

    var gid = 'ekgrid' + (uid++);
    el.innerHTML =
      '<svg class="ekg-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="心電圖示意波形">' +
      '<defs><pattern id="' + gid + '" width="20" height="20" patternUnits="userSpaceOnUse">' +
      '<path class="eg-minor" d="M0 4H20M0 8H20M0 12H20M0 16H20M4 0V20M8 0V20M12 0V20M16 0V20"/>' +
      '<path class="eg-major" d="M0 0H20M0 0V20"/></pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + gid + ')"/>' +
      spikes + '<path class="eg-trace" d="' + d + '"/></svg>';
  }

  window.ekgDrawAll = function () {
    Array.prototype.forEach.call(document.querySelectorAll('.ekg-strip'), draw);
  };
})();
