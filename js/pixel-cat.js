/* 像素貓 —— 首頁標題橫桿上的互動小動物
 *
 * 地板＝.app-header 的 border-bottom：貓所在的 .cat-strip 是頁首的最後一個區塊，
 * 其 padding-box 底緣正好貼著那條橫桿，故貓腳底畫在畫布最下緣即站在橫桿上。
 *
 * 畫法：部件式（頭／耳／身／四肢／尾各自位移）而非逐幀點陣圖 —— 一隻貓要坐、走、
 * 跑、吃、理毛、打盹共六種狀態，逐幀要畫二十幾張圖且改比例就得全部重畫；
 * 部件式只要調參數，新增動作也只是多一組位移函式。
 *
 * 互動：點擊頁面上非按鈕的空白處會在該 x 座標投下飼料，貓跑過去吃掉；
 * 直接點貓則是摸摸牠（冒愛心）。prefers-reduced-motion 時只畫一隻坐著的貓，不啟動迴圈。
 */
(function () {
  'use strict';

  var canvas = document.getElementById('cat-canvas');
  var strip = document.getElementById('cat-strip');
  if (!canvas || !strip || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');

  /* ---- 尺寸 ----
     貓身高 15 個虛擬像素、寬 22；U 為一個虛擬像素的 CSS 大小。 */
  var CAT_W = 22, CAT_H = 15, U = 3;
  var MOUTH = 6.5;    // 嘴巴在貓身中心前方幾格（決定牠停在飼料多遠處）
  var EDGE = 8;       // 貓身中心可到的左右極限：略小於半身寬，讓牠能構到邊緣的飼料
  // 必須被 U 整除：否則 floorY 是小數，整隻貓落在半格上，像素邊緣會糊掉
  var STRIP_H = 51;                       // 與 css .cat-strip 的 height 一致
  var floorY = STRIP_H / U;               // 地板（畫布底緣）在虛擬座標的 y
  var vw = 0;                             // 畫布寬度（虛擬像素）

  /* ---- 配色：Claude 的橘色生物 ---- */
  var C = {
    ink:   '#7a3a22',   // 輪廓
    body:  '#d97757',   // 主體橘
    shade: '#c05f3f',   // 暗面／斑紋
    belly: '#f0c3ab',   // 腹部亮面
    inner: '#e8988a',   // 耳內／鼻／肉球
    eye:   '#2b1a12',
    food:  '#b8894a',
    foodHi:'#d9ae6e',
    heart: '#d9556b'
  };

  /* ---- 狀態機 ---- */
  var cat = {
    x: 0, dir: 1, state: 'sit', t: 0, phase: 0,
    blink: 0, nextBlink: 2 + Math.random() * 4,
    idle: 0,            // 閒置多久（決定要不要理毛／打盹）
    hearts: []
  };
  var food = null;      // {x, eaten}
  var raf = null, last = 0, running = false;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 畫布尺寸：依 DPR 放大，關閉平滑以保持硬邊像素 ---- */
  function resize() {
    var w = strip.clientWidth || 320;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    vw = w / U;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(STRIP_H * dpr);
    ctx.setTransform(dpr * U, 0, 0, dpr * U, 0, 0);   // 之後一律用虛擬像素座標作畫
    ctx.imageSmoothingEnabled = false;
    if (!cat.x) cat.x = vw - CAT_W / 2 - 4;           // 初始待在右側空白處
    cat.x = Math.max(EDGE, Math.min(vw - EDGE, cat.x));
    draw();
  }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  /* ---- 各狀態的部件位移 ----
     回傳：身體下沉、頭部位移、四條腿的抬起量、尾巴角度、眼睛開合 */
  function pose() {
    var s = cat.state, ph = cat.phase, o = {
      bodyDip: 0, headX: 0, headY: 0, legs: [0, 0, 0, 0],
      tail: 0, tailUp: 0, eyeOpen: 1, sit: false, curl: false
    };
    if (s === 'walk' || s === 'run') {
      var sp = (s === 'run') ? 2.1 : 1;
      for (var i = 0; i < 4; i++) {
        // 對角步態：前左後右同相，另一對反相
        var a = Math.sin(ph * sp + (i % 2 ? Math.PI : 0));
        o.legs[i] = Math.max(0, a) * (s === 'run' ? 2.4 : 1.6);
      }
      o.bodyDip = Math.abs(Math.sin(ph * sp)) * 0.6 - 0.3;
      o.tail = Math.sin(ph * sp * 0.8) * 1.6;
      o.tailUp = s === 'run' ? 1.6 : 0.6;
      o.headY = o.bodyDip * 0.5;
    } else if (s === 'sit') {
      o.sit = true;
      o.tail = Math.sin(ph * 0.7) * 1.5;               // 尾巴輕擺
      o.bodyDip = Math.sin(ph * 1.1) * 0.18;           // 呼吸起伏
    } else if (s === 'eat') {
      o.sit = true;
      o.headY = 4 + Math.abs(Math.sin(ph * 6)) * 0.9;  // 低頭啃食
      o.headX = 1.2;
      o.tail = Math.sin(ph * 2) * 1.2;
    } else if (s === 'groom') {
      o.sit = true;
      o.headY = 2.4 + Math.sin(ph * 5) * 0.7;          // 低頭舔前腳
      o.headX = 0.6;
      o.tail = Math.sin(ph * 0.9) * 1.2;
    } else if (s === 'sleep') {
      o.sit = true; o.curl = true;
      o.eyeOpen = 0;
      o.bodyDip = 1 + Math.sin(ph * 0.9) * 0.35;       // 緩慢呼吸
      o.headY = 3.2;
      o.tail = 0;
    }
    if (cat.blink > 0 && o.eyeOpen === 1) o.eyeOpen = 0;
    return o;
  }

  function drawCat() {
    var o = pose();
    var baseY = floorY - CAT_H;          // 貓的框頂
    ctx.save();
    ctx.translate(cat.x, 0);
    if (cat.dir < 0) ctx.scale(-1, 1);   // 面向左：整隻鏡射
    ctx.translate(-CAT_W / 2, baseY);

    var FL = floorY - baseY;                 // 地板在貓局部座標的 y（＝CAT_H）
    // 身體壓低、腿只留 3 格：腿一長就變成狗
    var bY = 7.4 + o.bodyDip + (o.curl ? 1.6 : 0);
    var bH = o.curl ? 4 : 4.5;
    var legTop = bY + bH - 0.5;

    /* 尾巴：三段，自臀部往左後方翹起（起點貼著身體，不留縫） */
    if (!o.curl) {
      var t = o.tail, up = o.tailUp;
      px(2.2 - t * 0.3, bY + 1 - up * 0.4, 2.2, 2.2, C.shade);   // 起點壓在臀部上，不留縫
      px(1.2 - t * 0.55, bY - 0.6 - up * 1.1, 2.2, 2.2, C.body);
      px(0.6 - t * 0.8, bY - 2.2 - up * 1.7, 2.2, 2.2, C.body);
    } else {
      px(2.2, FL - 2, 3.5, 2, C.shade);      // 打盹時尾巴收在身側
      px(5, FL - 1.6, 3.5, 1.6, C.body);
    }

    /* 四肢 */
    if (!o.sit) {
      var legX = [4.5, 7.5, 12, 14.8];
      for (var i = 0; i < 4; i++) {
        var ly = legTop - o.legs[i];
        px(legX[i], ly, 2, FL - ly, i < 2 ? C.shade : C.body);
        px(legX[i], FL - 1, 2, 1, C.ink);                 // 腳掌
      }
    } else {
      // 蹲坐：後腿收成與身體相連的臀塊，前腳垂直撐地
      px(3.6, bY + 1.6, 5.4, FL - bY - 1.6, C.shade);
      px(4.2, FL - 1, 4.4, 1, C.ink);
      px(12, legTop, 2, FL - legTop, C.body);
      px(12, FL - 1, 2, 1, C.ink);
      px(14.8, legTop, 2, FL - legTop, C.body);
      px(14.8, FL - 1, 2, 1, C.ink);
    }

    /* 身體 */
    px(3.4, bY, 12, bH, C.body);
    px(3.4, bY + bH - 1, 12, 1, C.shade);    // 腹部陰影
    px(5.5, bY + bH - 1.4, 7, 1.4, C.belly);
    // 背脊用暗橘、兩端內縮：整條 ink 橫貫身體會變成一根黑棍子
    px(4.4, bY - 0.5, 10, 0.9, C.shade);
    px(6.2, bY + 0.6, 1.1, 2, C.shade);      // 虎斑
    px(9, bY + 0.6, 1.1, 2.4, C.shade);

    /* 頭：寬 6 高 5，耳朵矮且靠攏 —— 耳朵一高一分開就變成狐狸 */
    var hX = 12.8 + o.headX, hY = 4.7 + o.headY + o.bodyDip * 0.6;   // 頭略高於背線
    px(hX + 0.6, hY - 1.9, 1.8, 2, C.body);              // 後耳
    px(hX + 1, hY - 1.3, 0.9, 1.3, C.inner);
    px(hX + 3.4, hY - 1.9, 1.8, 2, C.body);              // 前耳
    px(hX + 3.7, hY - 1.3, 0.9, 1.3, C.inner);
    px(hX, hY, 6, 5, C.body);
    // 頭部輪廓用暗橘不用 ink：小尺寸下 ink 會糊成一條黑槓，像戴了帽子
    px(hX + 0.6, hY - 0.4, 4.8, 0.8, C.shade);           // 頭頂
    px(hX + 5.5, hY + 0.8, 0.5, 2.6, C.shade);           // 臉部前緣
    px(hX + 2.6, hY + 3.1, 3.4, 1.5, C.belly);           // 口鼻（只佔臉的前下角）

    if (o.eyeOpen) {
      px(hX + 1.5, hY + 1.5, 1.1, 1.4, C.eye);
      px(hX + 3.7, hY + 1.5, 1.1, 1.4, C.eye);
      px(hX + 1.5, hY + 1.5, 0.5, 0.5, '#fff');          // 眼神光
      px(hX + 3.7, hY + 1.5, 0.5, 0.5, '#fff');
    } else {
      px(hX + 1.4, hY + 2.1, 1.4, 0.7, C.ink);
      px(hX + 3.6, hY + 2.1, 1.4, 0.7, C.ink);
    }
    px(hX + 4.4, hY + 3, 1, 0.9, C.inner);               // 鼻
    px(hX + 0.4, hY + 1.4, 0.6, 2, C.shade);             // 臉頰暗面

    /* 打盹時冒 z */
    if (cat.state === 'sleep') {
      var zt = (cat.t * 0.6) % 3;
      var za = zt < 2.2 ? 1 : 0;
      if (za) {
        px(hX + 7.5 + zt, hY - 1.5 - zt * 1.6, 2, 0.7, C.ink);
        px(hX + 8.2 + zt, hY - 0.9 - zt * 1.6, 0.8, 0.7, C.ink);
        px(hX + 7.5 + zt, hY - 0.3 - zt * 1.6, 2, 0.7, C.ink);
      }
    }
    ctx.restore();
  }

  function drawFood() {
    if (!food) return;
    var y = floorY - 3;
    px(food.x - 2, y, 4, 3, C.food);          // 小魚乾：身體
    px(food.x - 2, y, 4, 1, C.foodHi);
    px(food.x + 2, y - 0.5, 2, 4, C.food);    // 尾鰭
    px(food.x - 1, y + 1, 1, 1, C.ink);       // 眼
  }

  function drawHearts() {
    for (var i = 0; i < cat.hearts.length; i++) {
      var h = cat.hearts[i];
      ctx.globalAlpha = Math.max(0, 1 - h.t / h.life);
      px(h.x, h.y, 1, 1, C.heart);
      px(h.x + 2, h.y, 1, 1, C.heart);
      px(h.x - 0.5, h.y + 1, 4, 1, C.heart);
      px(h.x + 0.5, h.y + 2, 2, 1, C.heart);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, vw + 2, floorY + 2);
    drawFood();
    drawCat();
    drawHearts();
  }

  /* ---- 行為 ---- */
  function setState(s) {
    if (cat.state === s) return;
    cat.state = s; cat.t = 0;
    if (s !== 'sit') cat.idle = 0;
  }

  function wander() {
    // 隨機挑一個目標點散步；不設目標時就坐著
    cat.target = 4 + Math.random() * Math.max(4, vw - 8);
    setState('walk');
  }

  function update(dt) {
    cat.t += dt;
    cat.phase += dt * 7;

    // 眨眼
    cat.nextBlink -= dt;
    if (cat.nextBlink <= 0) { cat.blink = 0.12; cat.nextBlink = 2.5 + Math.random() * 5; }
    if (cat.blink > 0) cat.blink -= dt;

    // 愛心上浮
    for (var i = cat.hearts.length - 1; i >= 0; i--) {
      var h = cat.hearts[i];
      h.t += dt; h.y -= dt * 6;
      if (h.t > h.life) cat.hearts.splice(i, 1);
    }

    // 有飼料就跑過去。判斷用「嘴巴」而非身體中心：嘴在中心前方約 6.5 格，
    // 用中心距離判斷時，投在邊緣的飼料會落在貓的可移動範圍之外，貓會卡住吃不到。
    if (food && cat.state !== 'eat') {
      var d = food.x - cat.x;
      cat.dir = d > 0 ? 1 : -1;
      if (Math.abs(d) - MOUTH <= 0.8) {
        setState('eat');
      } else {
        setState('run');
        cat.x += cat.dir * dt * 26;
      }
      cat.target = null;
    } else if (cat.state === 'eat') {
      if (cat.t > 1.4) {
        food = null;
        cat.hearts.push({ x: cat.x + 4 * cat.dir, y: floorY - CAT_H - 1, t: 0, life: 1.1 });
        setState('sit');
      }
    } else if (cat.state === 'walk' && cat.target != null) {
      var dx = cat.target - cat.x;
      if (Math.abs(dx) < 1.5) { cat.target = null; setState('sit'); }
      else { cat.dir = dx > 0 ? 1 : -1; cat.x += cat.dir * dt * 9; }
    } else if (cat.state === 'sit') {
      cat.idle += dt;
      // 閒著沒事：偶爾散步或理毛，久了就打盹
      if (cat.idle > 26) setState('sleep');
      else if (cat.t > 3 + Math.random() * 4) {
        var r = Math.random();
        if (r < 0.45) wander();
        else if (r < 0.75) setState('groom');
        else cat.t = 0;
      }
    } else if (cat.state === 'groom' && cat.t > 2.6) {
      setState('sit');
    } else if (cat.state === 'sleep') {
      cat.idle += dt;
    }

    cat.x = Math.max(EDGE, Math.min(vw - EDGE, cat.x));
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min((ts - last) / 1000 || 0, 0.05);   // 分頁切回來時不要一次跳很多
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
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  /* ---- 互動 ---- */
  function dropFood(clientX) {
    var r = strip.getBoundingClientRect();
    var x = (clientX - r.left) / U;
    food = { x: Math.max(4, Math.min(vw - 4, x)) };   // 兩端各留 4 格，貓構得到
    if (cat.state === 'sleep') { cat.idle = 0; setState('sit'); }
  }

  function catScreenRect() {
    var r = strip.getBoundingClientRect();
    return {
      left: r.left + (cat.x - CAT_W / 2) * U, right: r.left + (cat.x + CAT_W / 2) * U,
      top: r.top, bottom: r.bottom
    };
  }

  document.addEventListener('click', function (e) {
    // 按鈕、連結、輸入框與搜尋結果照常運作，不投飼料
    if (e.target.closest('button, a, input, select, textarea, label, summary, .tool-card, .gs-item')) return;

    var cr = catScreenRect();
    if (e.clientX >= cr.left && e.clientX <= cr.right &&
        e.clientY >= cr.top - 8 && e.clientY <= cr.bottom + 8) {
      // 摸摸貓
      cat.hearts.push({ x: cat.x + 2, y: floorY - CAT_H - 2, t: 0, life: 1.2 });
      cat.idle = 0;
      if (cat.state === 'sleep' || cat.state === 'walk') setState('sit');
      return;
    }
    dropFood(e.clientX);
  });

  /* 分頁切走時停掉迴圈，回來再啟動 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('resize', resize);

  resize();
  if (reduced) draw(); else start();
})();
