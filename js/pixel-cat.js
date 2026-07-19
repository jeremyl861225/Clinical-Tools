/* 像素貓 —— 首頁標題橫桿上的互動小動物
 *
 * 舞台：整頁的 fixed 疊層畫布。飼料要能掉在圖卡與查詢欄上，所以畫布不能只蓋住頁首。
 * 座標一律用「文件座標的虛擬像素」（＝文件 CSS px ÷ U），畫之前把捲動位移交給
 * setTransform 處理，如此捲動時飼料會跟著它停靠的平台一起移動。
 *
 * 地板：貓只能在 .app-header 的 border-bottom（那條橫桿）上走動。飼料若掉在別的
 * 平台上，貓構不到 —— 牠會跑到橫桿最靠近的一端哭，而那些飼料就一直堆在原處。
 *
 * 畫法：部件式（頭／耳／身／四肢／尾各自位移）而非逐幀點陣圖 —— 八種狀態逐幀要畫
 * 三十幾張圖且改比例就得全部重畫；部件式只要調參數。
 */
(function () {
  'use strict';

  var canvas = document.getElementById('cat-canvas');
  var strip = document.getElementById('cat-strip');
  var header = document.querySelector('.home-header');
  if (!canvas || !strip || !header || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');

  /* ---- 尺寸（單位：虛擬像素，1 虛擬像素 = U 個 CSS px） ---- */
  var U = 3;
  var CAT_W = 22, CAT_H = 15;
  var MOUTH = 6.5;    // 嘴巴在貓身中心前方幾格：決定牠停在飼料多遠處
  var EDGE = 8;       // 貓身中心可到的左右極限，略小於半身寬，讓牠構得到橫桿盡頭的飼料
  var PEE_EVERY = 60; // 尿尿間隔（秒）

  /* ---- 配色：Claude 的橘色生物 ---- */
  var C = {
    ink:   '#7a3a22',
    body:  '#d97757',
    shade: '#c05f3f',
    belly: '#f0c3ab',
    inner: '#e8988a',
    eye:   '#2b1a12',
    food:  '#b8894a',
    foodHi:'#d9ae6e',
    heart: '#d9556b',
    tear:  '#6fa8c9',
    pee:   '#d9bf62'
  };

  var cat = {
    x: 0, dir: 1, state: 'sit', t: 0, phase: 0,
    blink: 0, nextBlink: 2 + Math.random() * 4,
    idle: 0, peeTimer: PEE_EVERY, hearts: [], tears: []
  };

  var falling = [];   // 空中的飼料
  var treats = [];    // 落在橫桿上、貓吃得到的
  var litter = [];    // 落在別處、貓構不到的（不會消失，重新整理才清空）
  var puddles = [];   // 尿漬
  var floorV = 0, ruleL = 0, ruleR = 0;
  var platforms = [];
  var raf = null, last = 0, running = false;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 平台：飼料可以停住的水平面（皆為文件座標的虛擬像素） ---- */
  function refreshPlatforms() {
    var sx = window.scrollX, sy = window.scrollY;
    var hr = header.getBoundingClientRect();
    floorV = (hr.bottom + sy) / U;                 // 橫桿上緣＝貓的地板
    ruleL = (hr.left + sx) / U;
    ruleR = (hr.right + sx) / U;

    platforms = [{ x0: ruleL, x1: ruleR, y: floorV, rule: true }];

    var sel = document.querySelectorAll('.gs-field, .hub-card, .tool-card, .tool-footer');
    for (var i = 0; i < sel.length; i++) {
      var el = sel[i];
      if (!el.offsetParent) continue;              // 隱藏中（收合的分類、查詢時的首頁本體）
      var r = el.getBoundingClientRect();
      platforms.push({ x0: (r.left + sx) / U, x1: (r.right + sx) / U, y: (r.top + sy) / U });
    }
    cat.x = Math.max(ruleL + EDGE, Math.min(ruleR - EDGE, cat.x || ruleR - EDGE - 4));
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.imageSmoothingEnabled = false;
    refreshPlatforms();
    draw();
  }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  /* ---- 各狀態的部件位移 ---- */
  function pose() {
    var s = cat.state, ph = cat.phase, o = {
      bodyDip: 0, headX: 0, headY: 0, legs: [0, 0, 0, 0],
      tail: 0, tailUp: 0, eyeOpen: 1, sit: false, curl: false, sad: false
    };
    if (s === 'walk' || s === 'run') {
      var sp = (s === 'run') ? 2.1 : 1;
      for (var i = 0; i < 4; i++) {
        var a = Math.sin(ph * sp + (i % 2 ? Math.PI : 0));   // 對角步態
        o.legs[i] = Math.max(0, a) * (s === 'run' ? 2.4 : 1.6);
      }
      o.bodyDip = Math.abs(Math.sin(ph * sp)) * 0.6 - 0.3;
      o.tail = Math.sin(ph * sp * 0.8) * 1.6;
      o.tailUp = s === 'run' ? 1.6 : 0.6;
      o.headY = o.bodyDip * 0.5;
    } else if (s === 'sit') {
      o.sit = true;
      o.tail = Math.sin(ph * 0.7) * 1.5;
      o.bodyDip = Math.sin(ph * 1.1) * 0.18;
    } else if (s === 'eat') {
      o.sit = true;
      o.headY = 4 + Math.abs(Math.sin(ph * 6)) * 0.9;
      o.headX = 1.2;
      o.tail = Math.sin(ph * 2) * 1.2;
    } else if (s === 'groom') {
      o.sit = true;
      o.headY = 2.4 + Math.sin(ph * 5) * 0.7;
      o.headX = 0.6;
      o.tail = Math.sin(ph * 0.9) * 1.2;
    } else if (s === 'sleep') {
      o.sit = true; o.curl = true; o.eyeOpen = 0;
      o.bodyDip = 1 + Math.sin(ph * 0.9) * 0.35;
      o.headY = 3.2;
    } else if (s === 'cry') {
      o.sit = true; o.sad = true; o.eyeOpen = 0;
      o.headY = 1.2 + Math.sin(ph * 2.2) * 0.5;        // 抽噎
      o.tail = Math.sin(ph * 0.5) * 0.6;
      o.bodyDip = Math.abs(Math.sin(ph * 2.2)) * 0.4;
    } else if (s === 'pee') {
      // 貓是蹲的，不是抬腿：後半身壓低、尾巴翹高
      o.sit = true;
      o.bodyDip = 1.6;
      o.tailUp = 3.2;
      o.tail = Math.sin(ph * 0.6) * 0.4;
      o.headY = -0.4;
    }
    if (cat.blink > 0 && o.eyeOpen === 1) o.eyeOpen = 0;
    return o;
  }

  function drawCat() {
    var o = pose();
    var baseY = floorV - CAT_H;
    ctx.save();
    ctx.translate(cat.x, 0);
    if (cat.dir < 0) ctx.scale(-1, 1);
    ctx.translate(-CAT_W / 2, baseY);

    var FL = CAT_H;
    var bY = 7.4 + o.bodyDip + (o.curl ? 1.6 : 0);
    var bH = o.curl ? 4 : 4.5;
    var legTop = bY + bH - 0.5;

    /* 尾巴 */
    if (!o.curl) {
      var t = o.tail, up = o.tailUp;
      px(2.2 - t * 0.3, bY + 1 - up * 0.4, 2.2, 2.2, C.shade);
      px(1.2 - t * 0.55, bY - 0.6 - up * 1.1, 2.2, 2.2, C.body);
      px(0.6 - t * 0.8, bY - 2.2 - up * 1.7, 2.2, 2.2, C.body);
    } else {
      px(2.2, FL - 2, 3.5, 2, C.shade);
      px(5, FL - 1.6, 3.5, 1.6, C.body);
    }

    /* 四肢 */
    if (!o.sit) {
      var legX = [4.5, 7.5, 12, 14.8];
      for (var i = 0; i < 4; i++) {
        var ly = legTop - o.legs[i];
        px(legX[i], ly, 2, FL - ly, i < 2 ? C.shade : C.body);
        px(legX[i], FL - 1, 2, 1, C.ink);
      }
    } else {
      px(3.6, bY + 1.6, 5.4, FL - bY - 1.6, C.shade);
      px(4.2, FL - 1, 4.4, 1, C.ink);
      px(12, legTop, 2, FL - legTop, C.body);
      px(12, FL - 1, 2, 1, C.ink);
      px(14.8, legTop, 2, FL - legTop, C.body);
      px(14.8, FL - 1, 2, 1, C.ink);
    }

    /* 身體 */
    px(3.4, bY, 12, bH, C.body);
    px(3.4, bY + bH - 1, 12, 1, C.shade);
    px(5.5, bY + bH - 1.4, 7, 1.4, C.belly);
    px(4.4, bY - 0.5, 10, 0.9, C.shade);
    px(6.2, bY + 0.6, 1.1, 2, C.shade);
    px(9, bY + 0.6, 1.1, 2.4, C.shade);

    /* 頭 */
    var hX = 12.8 + o.headX, hY = 4.7 + o.headY + o.bodyDip * 0.6;
    px(hX + 0.6, hY - 1.9, 1.8, 2, C.body);
    px(hX + 1, hY - 1.3, 0.9, 1.3, C.inner);
    px(hX + 3.4, hY - 1.9, 1.8, 2, C.body);
    px(hX + 3.7, hY - 1.3, 0.9, 1.3, C.inner);
    px(hX, hY, 6, 5, C.body);
    px(hX + 0.6, hY - 0.4, 4.8, 0.8, C.shade);
    px(hX + 5.5, hY + 0.8, 0.5, 2.6, C.shade);

    /* 口鼻：上窄下寬兩段疊出圓角，再加鼻頭與嘴角
       —— 單一方塊在這個尺寸下會變成一塊突出的白磚 */
    px(hX + 3.1, hY + 2.9, 2.3, 0.8, C.belly);
    px(hX + 2.7, hY + 3.7, 3.0, 0.9, C.belly);
    px(hX + 4.5, hY + 2.8, 1.0, 0.8, C.inner);           // 鼻頭
    px(hX + 4.0, hY + 3.7, 0.5, 0.5, C.ink);             // 嘴角
    px(hX + 5.2, hY + 3.7, 0.5, 0.5, C.ink);
    px(hX + 6.1, hY + 2.6, 1.5, 0.35, C.belly);          // 鬍鬚
    px(hX + 6.1, hY + 3.6, 1.5, 0.35, C.belly);

    if (o.sad) {
      px(hX + 1.3, hY + 1.4, 1.5, 0.7, C.ink);           // ㄦ 字眼（哭）
      px(hX + 1.5, hY + 2.1, 1.1, 0.6, C.ink);
      px(hX + 3.5, hY + 1.4, 1.5, 0.7, C.ink);
      px(hX + 3.7, hY + 2.1, 1.1, 0.6, C.ink);
    } else if (o.eyeOpen) {
      px(hX + 1.5, hY + 1.5, 1.1, 1.4, C.eye);
      px(hX + 3.7, hY + 1.5, 1.1, 1.4, C.eye);
      px(hX + 1.5, hY + 1.5, 0.5, 0.5, '#fff');
      px(hX + 3.7, hY + 1.5, 0.5, 0.5, '#fff');
    } else {
      px(hX + 1.4, hY + 2.1, 1.4, 0.7, C.ink);
      px(hX + 3.6, hY + 2.1, 1.4, 0.7, C.ink);
    }
    px(hX + 0.4, hY + 1.4, 0.6, 2, C.shade);

    /* 尿柱：自後半身底部往下，落到地板 */
    if (cat.state === 'pee' && cat.t > 0.55) {
      var sy2 = bY + bH - 0.5;
      px(5.6, sy2, 1, FL - sy2, C.pee);
      px(5.4, FL - 1.4, 1.4, 1.4, C.pee);
    }

    /* 打盹時冒 z */
    if (cat.state === 'sleep') {
      var zt = (cat.t * 0.6) % 3;
      if (zt < 2.2) {
        px(hX + 7.5 + zt, hY - 1.5 - zt * 1.6, 2, 0.7, C.ink);
        px(hX + 8.2 + zt, hY - 0.9 - zt * 1.6, 0.8, 0.7, C.ink);
        px(hX + 7.5 + zt, hY - 0.3 - zt * 1.6, 2, 0.7, C.ink);
      }
    }
    ctx.restore();
  }

  function drawTreat(f) {
    px(f.x - 2, f.y - 3, 4, 3, C.food);        // 小魚乾
    px(f.x - 2, f.y - 3, 4, 1, C.foodHi);
    px(f.x + 2, f.y - 3.5, 2, 4, C.food);      // 尾鰭
    px(f.x - 1, f.y - 2, 1, 1, C.ink);         // 眼
  }

  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    // 文件座標 → 裝置像素：捲動位移交給 transform，飼料才會黏在它停靠的平台上
    ctx.setTransform(U * dpr, 0, 0, U * dpr, -window.scrollX * dpr, -window.scrollY * dpr);
    ctx.clearRect(window.scrollX / U, window.scrollY / U,
                  window.innerWidth / U + 2, window.innerHeight / U + 2);

    for (var i = 0; i < puddles.length; i++) {
      var p = puddles[i];
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life) * 0.85;
      px(p.x - p.w / 2, floorV - 1.4, p.w, 1.4, C.pee);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < litter.length; i++) drawTreat(litter[i]);
    for (i = 0; i < treats.length; i++) drawTreat(treats[i]);
    for (i = 0; i < falling.length; i++) drawTreat(falling[i]);

    drawCat();

    for (i = 0; i < cat.tears.length; i++) {
      var d = cat.tears[i];
      ctx.globalAlpha = Math.max(0, 1 - d.t / d.life);
      px(d.x, d.y, 1, 1.4, C.tear);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < cat.hearts.length; i++) {
      var h = cat.hearts[i];
      ctx.globalAlpha = Math.max(0, 1 - h.t / h.life);
      px(h.x, h.y, 1, 1, C.heart);
      px(h.x + 2, h.y, 1, 1, C.heart);
      px(h.x - 0.5, h.y + 1, 4, 1, C.heart);
      px(h.x + 0.5, h.y + 2, 2, 1, C.heart);
      ctx.globalAlpha = 1;
    }
  }

  /* ---- 行為 ---- */
  function setState(s) {
    if (cat.state === s) return;
    cat.state = s; cat.t = 0;
    if (s !== 'sit') cat.idle = 0;
  }

  function wander() {
    cat.target = ruleL + EDGE + Math.random() * Math.max(4, (ruleR - ruleL) - EDGE * 2);
    setState('walk');
  }

  function nearestTreat() {
    var best = null, bd = 1e9;
    for (var i = 0; i < treats.length; i++) {
      var d = Math.abs(treats[i].x - cat.x);
      if (d < bd) { bd = d; best = treats[i]; }
    }
    return best;
  }

  /* 飼料落地：判斷這一幀有沒有「跨過」某個平台的檯面。
     必須比對 f.prev→f.y 這一整段，只看當前 y 會漏接 —— 重力加速後每幀位移可達數格，
     飼料會直接穿過圖卡掉到頁尾去。 */
  function land(f) {
    var hit = null;
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (f.x < p.x0 || f.x > p.x1) continue;
      if (p.y < f.prev - 0.5) continue;              // 起點已在檯面下方
      if (p.y > f.y) continue;                       // 這一幀還沒掉到
      if (!hit || p.y < hit.y) hit = p;
    }
    if (!hit) return false;

    // 同一處已有飼料就往上疊，堆成一小落
    var pile = hit.rule ? treats : litter;
    var stack = 0;
    for (i = 0; i < pile.length; i++) {
      if (Math.abs(pile[i].x - f.x) < 4 && Math.abs(pile[i].base - hit.y) < 0.6) stack++;
    }
    f.y = hit.y - stack * 3;
    f.base = hit.y;
    f.vy = 0;
    pile.push(f);
    if (!hit.rule) grieve(f);                        // 構不到 → 跑去橫桿盡頭哭
    else if (cat.state === 'sleep') { cat.idle = 0; setState('sit'); }
    return true;
  }

  function grieve(f) {
    // 跑到離那份飼料較近的一端：想吃卻只能停在橫桿邊緣
    cat.cryTarget = (f.x < (ruleL + ruleR) / 2) ? ruleL + EDGE : ruleR - EDGE;
    cat.idle = 0;
    if (cat.state !== 'eat') setState('run');
  }

  function update(dt) {
    cat.t += dt;
    cat.phase += dt * 7;

    cat.nextBlink -= dt;
    if (cat.nextBlink <= 0) { cat.blink = 0.12; cat.nextBlink = 2.5 + Math.random() * 5; }
    if (cat.blink > 0) cat.blink -= dt;

    var i;
    for (i = cat.hearts.length - 1; i >= 0; i--) {
      var h = cat.hearts[i]; h.t += dt; h.y -= dt * 6;
      if (h.t > h.life) cat.hearts.splice(i, 1);
    }
    for (i = cat.tears.length - 1; i >= 0; i--) {
      var d = cat.tears[i]; d.t += dt; d.y += dt * 14;
      if (d.t > d.life || d.y > floorV) cat.tears.splice(i, 1);
    }
    for (i = puddles.length - 1; i >= 0; i--) {
      var p = puddles[i]; p.t += dt;
      if (p.w < p.max) p.w += dt * 3;
      if (p.t > p.life) puddles.splice(i, 1);
    }

    // 飼料落下
    for (i = falling.length - 1; i >= 0; i--) {
      var f = falling[i];
      f.prev = f.y;
      f.vy += dt * 90;
      f.y += f.vy * dt;
      if (land(f) || f.y > (document.documentElement.scrollHeight / U) + 20) falling.splice(i, 1);
    }

    // 尿尿計時：只在平靜狀態下進行，不打斷追食或哭泣
    cat.peeTimer -= dt;
    if (cat.peeTimer <= 0 && (cat.state === 'sit' || cat.state === 'walk')) {
      cat.peeTimer = PEE_EVERY;
      setState('pee');
    }

    if (cat.state === 'pee') {
      if (cat.t > 2.6) {
        puddles.push({ x: cat.x - 5.5 * cat.dir, w: 1.4, max: 5, t: 0, life: 11 });
        setState('sit');
      }
    } else if (cat.state === 'eat') {
      if (cat.t > 1.4) {
        if (cat.eating) {
          var k = treats.indexOf(cat.eating);
          if (k > -1) treats.splice(k, 1);
          cat.eating = null;
        }
        cat.hearts.push({ x: cat.x + 4 * cat.dir, y: floorV - CAT_H - 1, t: 0, life: 1.1 });
        setState('sit');
      }
    } else if (treats.length) {
      // 吃得到的優先於哭
      cat.cryTarget = null;
      var target = nearestTreat();
      var dx = target.x - cat.x;
      cat.dir = dx > 0 ? 1 : -1;
      if (Math.abs(dx) - MOUTH <= 0.8) { cat.eating = target; setState('eat'); }
      else { setState('run'); cat.x += cat.dir * dt * 40; }
      cat.target = null;
    } else if (cat.cryTarget != null) {
      var cd = cat.cryTarget - cat.x;
      if (Math.abs(cd) < 1.2) {
        cat.x = cat.cryTarget;
        setState('cry');
        // 眼淚自臉部滴落
        if (Math.random() < dt * 6) {
          cat.tears.push({ x: cat.x + 5 * cat.dir, y: floorV - CAT_H + 7, t: 0, life: 1.2 });
        }
        if (cat.t > 5.5) { cat.cryTarget = null; setState('sit'); }
      } else {
        cat.dir = cd > 0 ? 1 : -1;
        setState('run');
        cat.x += cat.dir * dt * 40;
      }
    } else if (cat.state === 'walk' && cat.target != null) {
      var wd = cat.target - cat.x;
      if (Math.abs(wd) < 1.5) { cat.target = null; setState('sit'); }
      else { cat.dir = wd > 0 ? 1 : -1; cat.x += cat.dir * dt * 11; }
    } else if (cat.state === 'sit') {
      cat.idle += dt;
      if (cat.idle > 26) setState('sleep');
      else if (cat.t > 3 + Math.random() * 4) {
        var r = Math.random();
        if (r < 0.45) wander();
        else if (r < 0.75) setState('groom');
        else cat.t = 0;
      }
    } else if (cat.state === 'groom' && cat.t > 2.6) {
      setState('sit');
    } else if (cat.state === 'run' || cat.state === 'cry') {
      setState('sit');                               // 目標沒了就收工
    } else if (cat.state === 'sleep') {
      cat.idle += dt;
    }

    cat.x = Math.max(ruleL + EDGE, Math.min(ruleR - EDGE, cat.x));
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min((ts - last) / 1000 || 0, 0.05);
    last = ts;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduced) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  /* ---- 互動 ---- */
  function catHit(cx, cy) {
    var l = (cat.x - CAT_W / 2) * U - window.scrollX, r = (cat.x + CAT_W / 2) * U - window.scrollX;
    var b = floorV * U - window.scrollY, t = b - CAT_H * U;
    return cx >= l && cx <= r && cy >= t - 6 && cy <= b + 6;
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('button, a, input, select, textarea, label, summary, .tool-card, .gs-item')) return;

    if (catHit(e.clientX, e.clientY)) {
      cat.hearts.push({ x: cat.x + 2, y: floorV - CAT_H - 2, t: 0, life: 1.2 });
      cat.idle = 0;
      if (cat.state === 'sleep' || cat.state === 'cry') { cat.cryTarget = null; setState('sit'); }
      return;
    }
    refreshPlatforms();
    var fy = (e.clientY + window.scrollY) / U;
    falling.push({ x: (e.clientX + window.scrollX) / U, y: fy, prev: fy, vy: 0, base: 0 });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('resize', resize);
  // 版面會變（展開分類、查詢、捲動），平台位置得跟著更新
  window.addEventListener('scroll', refreshPlatforms, { passive: true });
  window.addEventListener('hashchange', function () { setTimeout(refreshPlatforms, 60); });

  resize();
  setInterval(refreshPlatforms, 500);
  if (reduced) draw(); else start();
})();
