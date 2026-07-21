/* 像素貓 —— 首頁標題橫桿上的互動小動物
 *
 * 舞台：整頁的 fixed 疊層畫布。飼料要能掉在圖卡與查詢欄上，所以畫布不能只蓋住頁首。
 * 座標一律用「文件座標的虛擬像素」（＝文件 CSS px ÷ U），畫之前把捲動位移交給
 * setTransform 處理，如此捲動時飼料會跟著它停靠的平台一起移動。
 *
 * 地板：貓只能在 .app-header 的 border-bottom（那條橫桿）上走動。飼料若掉在別的
 * 平台上，貓構不到 —— 牠會走到那份飼料正下方的橫桿處哭，而飼料就一直堆在原處。
 *
 * 對齊：地板取橫桿的「上緣」並取整數，貓身原點 baseY 因而也是整數；畫貓之前把
 * cat.x 也取整。三者皆為整數，局部座標才不會落在半格上 —— 否則腳會有幾個像素
 * 掉到橫桿底下，各部件之間也會裂出縫。px() 另以「兩邊界各自取整」作畫，相鄰矩形
 * 必定共用同一條邊，斑紋與背脊不會和身體分離。
 */
(function () {
  'use strict';

  var canvas = document.getElementById('cat-canvas');
  var strip = document.getElementById('cat-strip');
  var header = document.querySelector('.home-header');
  if (!canvas || !strip || !header || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');

  /* ---- 尺寸（單位：虛擬像素，1 虛擬像素 = U 個 CSS px） ----
     U=2、貓 32×23：物理（飼料、平台、地板）都用這個格距。
     貓本體另在 drawCat 內以「細格」（0.5 虛擬像素 = 1 CSS px）作畫：圓臉、大眼、
     腮紅這些細節在粗格上會糊成方塊，解析度加倍才畫得出來。 */
  var U = 2;
  var CAT_W = 32, CAT_H = 23;
  var S = 1.5;        // pose() 的位移量沿用舊格距，乘上此值換算到虛擬像素
  var MOUTH = 8;      // 嘴巴在貓身中心前方幾格：決定牠停在飼料多遠處
  var EDGE = 12;      // 貓身中心可到的左右極限，略小於半身寬，讓牠構得到橫桿盡頭的飼料
  var PEE_EVERY = 60;    // 尿尿間隔（秒）
  var PEE_STREAM = 2.2;  // 放水到第幾秒為止，之後轉為蓋貓砂
  var PEE_TOTAL = 5.2;
  var STRETCH_T = 2.2;   // 伸懶腰一次幾秒

  /* ---- 配色：偏黃的橘貓（虎斑＋乳白腹部＋粉紅鼻與腮紅） ---- */
  var C = {
    ink:   '#7c4218',
    body:  '#f5a24a',
    shade: '#d67c28',
    belly: '#fdefd6',
    inner: '#f2a89e',
    eye:   '#31200f',
    nose:  '#e08578',   // 粉紅鼻頭：比棕色可愛，也不會和輪廓糊在一起
    blush: '#f0968a',   // 腮紅
    food:  '#b8894a',
    foodHi:'#d9ae6e',
    heart: '#d9556b',
    tear:  '#5b9fd6',
    tearHi:'#cfe8fa',
    pee:   '#e8cf6a',
    dust:  '#c2ad8e'
  };

  var cat = {
    x: 0, dir: 1, state: 'sit', t: 0, phase: 0,
    blink: 0, nextBlink: 2 + Math.random() * 4,
    happy: 0,                                  // 被摸之後瞇眼笑的剩餘秒數
    twitch: 0, nextTwitch: 4 + Math.random() * 6,   // 耳朵抽動
    idle: 0, peeTimer: PEE_EVERY, hearts: [], tears: []
  };

  var falling = [];   // 空中的飼料
  var treats = [];    // 落在橫桿上、貓吃得到的
  var litter = [];    // 落在別處、貓構不到的（不會消失，重新整理才清空）
  var puddles = [];   // 尿漬
  var dust = [];      // 蓋貓砂踢起的塵土
  var floorV = 0, ruleL = 0, ruleR = 0, groundY = 0;
  var platforms = [];
  var raf = null, last = 0, running = false, visible = true;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 平台：飼料可以停住的水平面（皆為文件座標的虛擬像素） ---- */
  function refreshPlatforms() {
    // 展開分類時主頁首被收起（body.sec-open），此時沒有橫桿也就沒有地板。
    // 必須直接跳出：否則 rect 全為 0，floorV 歸零、cat.x 被夾成 0，返回主選單時貓會卡在最左邊。
    if (!header.offsetParent) { visible = false; return; }
    visible = true;

    var sx = window.scrollX, sy = window.scrollY;
    var hr = header.getBoundingClientRect();
    // 取橫桿「上緣」而非 rect.bottom：bottom 含 2px 邊框，貓會站進線裡。取整數見檔頭說明。
    var bw = parseFloat(getComputedStyle(header).borderBottomWidth) || 0;
    floorV = Math.round((hr.bottom - bw + sy) / U);
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
    // 內容底緣當作地面：點在頁尾以下的空白處時，飼料才有東西可以停，
    // 否則它會一路掉出頁面外被回收，看起來像沒反應
    var sheet = document.querySelector('.sheet');
    if (sheet) {
      var sr = sheet.getBoundingClientRect();
      groundY = (sr.bottom + sy) / U;
      platforms.push({ x0: (sr.left + sx) / U, x1: (sr.right + sx) / U, y: groundY });
    }
    cat.x = Math.max(ruleL + EDGE, Math.min(ruleR - EDGE, cat.x || ruleR - EDGE - 4));
  }

  /* 畫布尺寸一律以「畫布自己量到的 CSS box」為準，不可用 innerWidth/innerHeight。
     手機（尤其 iOS）上兩者經常對不起來：
       · 網址列收合／展開時，fixed 元素的 100% 高度跟著版面視窗，innerHeight 卻是視覺視窗
       · 雙指縮放時 innerWidth/Height 變成放大後的可視範圍，fixed 畫布仍是整個版面視窗
     一旦 bitmap 尺寸與 CSS box 不一致，瀏覽器就會把 bitmap 拉伸填滿（實測 1.27 倍），
     貓與飼料會整個偏離橫桿 —— 這正是手機上「貓跑版」的成因。 */
  function syncCanvasSize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var r = canvas.getBoundingClientRect();
    var w = Math.round((r.width || window.innerWidth) * dpr);
    var h = Math.round((r.height || window.innerHeight) * dpr);
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w; canvas.height = h;        // 指定尺寸會清空畫布，故僅在真的改變時才做
    ctx.imageSmoothingEnabled = false;
    return true;
  }

  function resize() {
    syncCanvasSize();
    refreshPlatforms();
    draw();
  }

  /* 兩個邊界各自取整（而非「取整起點＋原始寬高」）：相鄰矩形因此必定共用同一條邊，
     不會因為起點進位、終點沒進位而裂出一格縫。 */
  function px(x, y, w, h, color) {
    var x0 = Math.round(x), y0 = Math.round(y);
    var x1 = Math.round(x + w), y1 = Math.round(y + h);
    if (x1 <= x0) x1 = x0 + 1;
    if (y1 <= y0) y1 = y0 + 1;
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  /* 圓角塊：上下各內縮一格，避免每個部件都是直角方磚 */
  function blob(x, y, w, h, color) {
    px(x, y + 1, w, h - 2, color);
    px(x + 1, y, w - 2, 1, color);
    px(x + 1, y + h - 1, w - 2, 1, color);
  }

  /* 大圓角塊：四角各去兩階。臉和身體要用這個才夠圓，blob 只夠小部件用 */
  function round4(x, y, w, h, color) {
    px(x + 3, y, w - 6, 1, color);
    px(x + 1, y + 1, w - 2, 1, color);
    px(x, y + 2, w, h - 4, color);
    px(x + 1, y + h - 2, w - 2, 1, color);
    px(x + 3, y + h - 1, w - 6, 1, color);
  }

  /* ---- 各狀態的部件位移 ---- */
  function pose() {
    var s = cat.state, ph = cat.phase, o = {
      bodyDip: 0, headX: 0, headY: 0, legs: [0, 0, 0, 0],
      tail: 0, tailUp: 0, eyeOpen: 1, sit: false, curl: false,
      sad: false, lift: 0, kick: 0, stretch: 0, happy: false, ear: 0
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
      // 兩段：先抬後腿放水，再用後腳往後撥土蓋起來
      if (cat.t < PEE_STREAM) {
        o.lift = 1;
        o.tailUp = 2.6;
        o.bodyDip = 0.4;
      } else {
        o.kick = Math.sin((cat.t - PEE_STREAM) * 10);
        o.tailUp = 1.2;
        o.bodyDip = 0.8;
        o.headY = 0.5;
      }
    } else if (s === 'stretch') {
      // 伸懶腰（play bow）：前腳往前趴平、屁股翹高，瞇著眼一臉舒服
      var k = Math.min(1, cat.t * 2.5);
      if (cat.t > STRETCH_T - 0.5) k = Math.max(0, (STRETCH_T - cat.t) * 2);
      o.stretch = k;
      o.tailUp = 2.2 * k;
      o.tail = Math.sin(ph * 1.5) * 0.8;
      o.headY = 2.6 * k;
      o.headX = 0.8 * k;
      o.eyeOpen = 0;
      o.happy = true;
    }
    if (cat.happy > 0) o.happy = true;
    if (cat.twitch > 0) o.ear = 1;
    if (cat.blink > 0 && o.eyeOpen === 1) o.eyeOpen = 0;
    return o;
  }

  function drawCat() {
    var o = pose();
    var baseY = floorV - CAT_H;
    ctx.save();
    ctx.translate(Math.round(cat.x), 0);       // 取整：否則整隻貓落在半格上，邊緣會糊
    if (cat.dir < 0) ctx.scale(-1, 1);
    ctx.translate(-Math.round(CAT_W / 2), baseY);
    // 細格：0.5 虛擬像素 = 1 CSS px。cat.x、baseY 皆為整數，細格座標因此也對齊
    // 整數 CSS px，不會落在半格上（對齊原則同檔頭說明）
    ctx.scale(0.5, 0.5);

    var FL = CAT_H * 2;                        // 地板（細格），所有腳都止於此
    var F = S * 2;                             // pose() 的位移（舊格距）→ 細格
    var k = o.stretch;

    var bY = 22 + o.bodyDip * F + (o.curl ? 6 : 0);
    var bH = o.curl ? 13 : 15;
    var legTop = bY + bH - 2;
    var legX = [10, 18, 28, 35], legW = 6;   // 前腳收在身體輪廓（x≤42）之內，不往前突

    /* 尾巴：一條相連的粗帶——沿曲線以小步距堆疊方塊，步距(≤3.3)必小於塊高(4)，
       搖尾或翹尾時每一塊仍與上一塊重疊，不會像圓珠鍊那樣裂開；中段深色＝虎斑環 */
    if (!o.curl) {
      var t = o.tail * F, up = o.tailUp * F;
      for (var ti = 7; ti >= 0; ti--) {
        var ts = ti / 7;
        px(5 - ts * 4 - t * ts, bY + 4 - ts * (12 + up * 1.4), 4, 4,
           (ti === 3 || ti === 4) ? C.shade : C.body);
      }
    } else {
      px(6, FL - 6, 10, 6, C.shade);           // 睡覺時尾巴繞到身前
      px(14, FL - 5, 10, 5, C.body);
    }

    /* 四肢 */
    if (k > 0) {
      // 伸懶腰：後腿站直把屁股撐高，前腿往前趴平貼地
      px(legX[0], legTop - 6 * k, legW, FL - legTop + 6 * k, C.shade);
      px(legX[0], FL - 3, legW, 3, C.belly);
      px(legX[1], legTop - 6 * k, legW, FL - legTop + 6 * k, C.shade);
      px(legX[1], FL - 3, legW, 3, C.belly);
      px(legX[3], FL - 4, 8 + 6 * k, 4, C.body);
      px(legX[3] + 6 + 6 * k, FL - 3, 4, 3, C.belly);
    } else if (o.lift || o.kick) {
      // 尿尿：前腳站定；後腳先抬高放水，再往後撥土（蓋貓砂）
      px(legX[2], legTop, legW, FL - legTop, C.body);
      px(legX[2], FL - 3, legW, 3, C.belly);
      px(legX[3], legTop, legW, FL - legTop, C.body);
      px(legX[3], FL - 3, legW, 3, C.belly);
      px(legX[1], legTop, legW, FL - legTop, C.shade);
      px(legX[1], FL - 3, legW, 3, C.belly);
      if (o.lift) {
        // 抬起的那條後腿：向後上方伸直，腳掌離地
        px(legX[0] - 5, legTop - 9, legW, 8, C.shade);
        px(legX[0] - 7, legTop - 10, 5, 3, C.belly);
      } else {
        var back = Math.max(0, o.kick) * 9;            // 往後掃
        var upk = Math.max(0, o.kick) * 3.6;
        px(legX[0] - back, legTop - upk, legW, FL - legTop + upk - 1, C.shade);
        px(legX[0] - back - 1, FL - 3 - upk, 5, 3, C.belly);
      }
    } else if (!o.sit) {
      for (var i = 0; i < 4; i++) {
        var ly = legTop - o.legs[i] * F;
        px(legX[i], ly, legW, FL - ly, i < 2 ? C.shade : C.body);
        px(legX[i], FL - 3, legW, 3, C.belly);         // 乳白腳掌
      }
    } else {
      round4(10, bY + 5, 17, FL - bY - 5, C.shade);    // 蹲坐的臀塊，與身體相連
      px(12, FL - 3, 13, 3, C.belly);
      px(legX[2], legTop, legW, FL - legTop, C.body);
      px(legX[2], FL - 3, legW, 3, C.belly);
      px(legX[3], legTop, legW, FL - legTop, C.body);
      px(legX[3], FL - 3, legW, 3, C.belly);
    }

    /* 身體：圓滾滾；斑紋一律畫在輪廓「之內」 */
    if (k > 0) {
      round4(6, bY - 7 * k, 22, bH, C.body);           // 後半抬高
      round4(20, bY + 3 * k, 22, bH - 2 * k, C.body);  // 前胸下沉
      px(9, bY - 7 * k, 16, 3, C.shade);               // 背脊
      px(24, bY + bH - 4 + k, 14, 4, C.belly);         // 胸口貼地的乳白
    } else {
      round4(6, bY, 36, bH, C.body);
      blob(10, bY + bH - 5, 26, 5, C.belly);           // 腹部乳白
      px(9, bY, 30, 3, C.shade);                       // 背脊：身體最上面幾列
      px(14, bY + 3, 3, 6, C.shade);                   // 虎斑
      px(22, bY + 3, 3, 7, C.shade);
      px(30, bY + 3, 3, 5, C.shade);
    }

    /* 頭：兩頭身大圓臉（30×24，佔了半隻貓）——A 的橘虎斑配色與星星眼、
       B 的粉紅鼻＋ω 嘴、乳白下臉、腮紅；無鬍鬚；耳朵偶爾抽動 */
    var hX = 31 + o.headX * F, hY = 6 + (o.headY + o.bodyDip) * F;

    px(hX + 3, hY - 5, 4, 3, C.shade);                 // 遠耳（暗一階，拉出前後）
    px(hX + 2, hY - 2, 7, 3, C.shade);
    var eT = hY - 6 + o.ear;                           // 近耳，o.ear=1 時往下抽一格
    px(hX + 23, eT, 4, 3, C.body);
    // 底排畫到 hY+1：頭頂那列因圓角內縮到 x+27，耳朵外側兩欄必須自己搭到下一列，
    // 否則耳朵右角與頭之間會裂出一格
    px(hX + 22, eT + 3, 7, 4, C.body);
    px(hX + 24, eT + 2, 4, 3, C.inner);                // 粉紅內耳

    round4(hX, hY, 30, 24, C.body);
    blob(hX + 3, hY + 15, 24, 8, C.belly);             // 乳白下臉
    px(hX + 9, hY + 1, 2, 5, C.shade);                 // 額頭虎斑
    px(hX + 14, hY + 1, 2, 6, C.shade);
    px(hX + 19, hY + 1, 2, 5, C.shade);

    var eL = hX + 4, eR = hX + 18, eY = hY + 7;        // 兩顆大眼（8×10）的左上角
    if (o.sad) {
      px(eL, eY + 2, 8, 2, C.ink);                     // ㄦ 字眼（哭）
      px(eL + 1, eY + 4, 6, 2, C.ink);
      px(eR, eY + 2, 8, 2, C.ink);
      px(eR + 1, eY + 4, 6, 2, C.ink);
    } else if (o.happy) {
      px(eL, eY + 5, 3, 2, C.ink);                     // ^ ^ 瞇眼笑（被摸／伸懶腰）
      px(eL + 3, eY + 4, 2, 2, C.ink);
      px(eL + 5, eY + 5, 3, 2, C.ink);
      px(eR, eY + 5, 3, 2, C.ink);
      px(eR + 3, eY + 4, 2, 2, C.ink);
      px(eR + 5, eY + 5, 3, 2, C.ink);
    } else if (o.eyeOpen) {
      blob(eL, eY, 8, 10, C.eye);                      // 水汪汪大圓眼
      blob(eR, eY, 8, 10, C.eye);
      px(eL + 1, eY + 1, 3, 3, '#fff');                // 主眼神光
      px(eR + 1, eY + 1, 3, 3, '#fff');
      px(eL + 5, eY + 6, 2, 2, '#fff');                // 第二點光：星星眼
      px(eR + 5, eY + 6, 2, 2, '#fff');
    } else {
      px(eL, eY + 6, 8, 2, C.ink);                     // 閉眼
      px(eR, eY + 6, 8, 2, C.ink);
    }

    if (!o.sad) {
      px(hX + 1, hY + 19, 4, 2, C.blush);              // 腮紅
      px(hX + 25, hY + 19, 4, 2, C.blush);
    }

    // B 的口鼻：粉紅小鼻，正下方兩點＝ω 嘴
    px(hX + 14, hY + 17, 3, 2, C.nose);
    px(hX + 11, hY + 20, 2, 2, C.ink);
    px(hX + 17, hY + 20, 2, 2, C.ink);

    /* 理毛：一隻前掌舉到臉頰邊上下搓 */
    if (cat.state === 'groom') {
      var pw = hY + 17 + Math.sin(cat.phase * 5) * 2;
      px(hX + 1, pw, 5, 6, C.body);
      px(hX + 1, pw, 5, 2, C.belly);
    }

    /* 尿柱：自後半身底部往下，落到地板 */
    if (cat.state === 'pee' && cat.t > 0.5 && cat.t < PEE_STREAM) {
      var sy2 = bY + bH - 2;
      px(12, sy2, 3, FL - sy2, C.pee);
    }

    /* 打盹時冒 z */
    if (cat.state === 'sleep') {
      var zt = (cat.t * 0.6) % 3;
      if (zt < 2.2) {
        px(hX + 31 + zt * 3, hY - 4 - zt * 5, 6, 2, C.ink);
        px(hX + 33 + zt * 3, hY - 2 - zt * 5, 2.5, 2, C.ink);
        px(hX + 31 + zt * 3, hY - 0 - zt * 5, 6, 2, C.ink);
      }
    }
    ctx.restore();
  }

  function drawTreat(f) {
    var x = Math.round(f.x), y = Math.round(f.y);
    px(x - 3, y - 4.5, 6, 4.5, C.food);    // 小魚乾
    px(x - 3, y - 4.5, 6, 1.5, C.foodHi);
    px(x + 3, y - 5, 3, 6, C.food);        // 尾鰭
    px(x - 1.5, y - 3, 1.5, 1.5, C.ink);   // 眼
  }

  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    // 清「整張 bitmap」而不是推算出來的視窗範圍：雙指縮放時 innerWidth/Height 只剩
    // 放大後的可視區，用它清畫面會清不乾淨，上一幀的貓留在原地（螢幕上會出現兩隻貓）
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 文件座標 → 裝置像素：捲動位移交給 transform，飼料才會黏在它停靠的平台上
    ctx.setTransform(U * dpr, 0, 0, U * dpr, -window.scrollX * dpr, -window.scrollY * dpr);

    var i;
    for (i = 0; i < puddles.length; i++) {
      var p = puddles[i];
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life) * 0.85;
      px(p.x - p.w / 2, floorV - 1.5, p.w, 1.5, C.pee);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < litter.length; i++) drawTreat(litter[i]);
    for (i = 0; i < treats.length; i++) drawTreat(treats[i]);
    for (i = 0; i < falling.length; i++) drawTreat(falling[i]);

    for (i = 0; i < dust.length; i++) {
      var g = dust[i];
      ctx.globalAlpha = Math.max(0, 1 - g.t / g.life);
      px(g.x, g.y, 1.5, 1.5, C.dust);
      ctx.globalAlpha = 1;
    }

    drawCat();

    for (i = 0; i < cat.tears.length; i++) {
      var d = cat.tears[i];
      ctx.globalAlpha = Math.max(0, 1 - d.t / d.life);
      px(d.x, d.y, 2, 3, C.tear);              // 淚滴本體
      px(d.x, d.y, 1, 1, C.tearHi);            // 高光，小圖上才看得出是水珠
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < cat.hearts.length; i++) {
      var h = cat.hearts[i];
      ctx.globalAlpha = Math.max(0, 1 - h.t / h.life);
      px(h.x, h.y, 1.5, 1.5, C.heart);
      px(h.x + 3, h.y, 1.5, 1.5, C.heart);
      px(h.x - 0.8, h.y + 1.5, 6, 1.5, C.heart);
      px(h.x + 0.8, h.y + 3, 3, 1.5, C.heart);
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
    f.y = hit.y - stack * 4.5;
    f.base = hit.y;
    f.vy = 0;
    pile.push(f);
    if (!hit.rule) grieve(f);                        // 構不到 → 走到飼料正下方的橫桿處哭
    else if (cat.state === 'sleep') { cat.idle = 0; setState('sit'); }
    return true;
  }

  function grieve(f) {
    // 停在那份飼料的正下方（而非跑到橫桿盡頭）：看得到吃不到才是重點
    cat.cryTarget = Math.max(ruleL + EDGE, Math.min(ruleR - EDGE, f.x));
    cat.idle = 0;
    if (cat.state !== 'eat') setState('run');
  }

  function update(dt) {
    cat.t += dt;
    cat.phase += dt * 7;

    cat.nextBlink -= dt;
    if (cat.nextBlink <= 0) { cat.blink = 0.12; cat.nextBlink = 2.5 + Math.random() * 5; }
    if (cat.blink > 0) cat.blink -= dt;

    if (cat.happy > 0) cat.happy -= dt;
    cat.nextTwitch -= dt;
    if (cat.nextTwitch <= 0) { cat.twitch = 0.18; cat.nextTwitch = 3 + Math.random() * 7; }
    if (cat.twitch > 0) cat.twitch -= dt;

    var i;
    for (i = cat.hearts.length - 1; i >= 0; i--) {
      var h = cat.hearts[i]; h.t += dt; h.y -= dt * 9;
      if (h.t > h.life) cat.hearts.splice(i, 1);
    }
    // 眼淚走拋物線：先往外噴再被重力拉下來，只往下掉看不出是「噴」出來的
    for (i = cat.tears.length - 1; i >= 0; i--) {
      var d = cat.tears[i];
      d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += dt * 55;
      if (d.t > d.life || d.y > floorV) cat.tears.splice(i, 1);
    }
    for (i = puddles.length - 1; i >= 0; i--) {
      var p = puddles[i]; p.t += dt;
      if (p.w < p.max) p.w += dt * 4.5;
      if (p.t > p.life) puddles.splice(i, 1);
    }
    for (i = dust.length - 1; i >= 0; i--) {
      var g = dust[i];
      g.t += dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vy += dt * 39;
      if (g.t > g.life || g.y > floorV) dust.splice(i, 1);
    }

    // 飼料落下
    for (i = falling.length - 1; i >= 0; i--) {
      var f = falling[i];
      f.prev = f.y;
      f.vy += dt * 135;
      f.y += f.vy * dt;
      if (land(f) || f.y > (document.documentElement.scrollHeight / U) + 20) falling.splice(i, 1);
    }

    // 尿尿計時：只在平靜狀態下進行，不打斷追食或哭泣
    cat.peeTimer -= dt;
    if (cat.peeTimer <= 0 && (cat.state === 'sit' || cat.state === 'walk')) {
      cat.peeTimer = PEE_EVERY;
      setState('pee');
      cat.peed = false;
    }

    if (cat.state === 'pee') {
      if (!cat.peed && cat.t >= PEE_STREAM) {         // 放完水才留下尿漬
        cat.peed = true;
        puddles.push({ x: cat.x - 9 * cat.dir, w: 2, max: 7.5, t: 0, life: 11 });
      }
      // 蓋貓砂：後腳每撥一次揚起一點塵土
      if (cat.t > PEE_STREAM && Math.random() < dt * 14) {
        dust.push({
          x: cat.x - (10 + Math.random() * 6) * cat.dir, y: floorV - 2,
          vx: -(5 + Math.random() * 9) * cat.dir, vy: -(6 + Math.random() * 10),
          t: 0, life: 0.6
        });
      }
      if (cat.t > PEE_TOTAL) setState('sit');
    } else if (cat.state === 'eat') {
      if (cat.t > 1.4) {
        if (cat.eating) {
          var k = treats.indexOf(cat.eating);
          if (k > -1) treats.splice(k, 1);
          cat.eating = null;
        }
        cat.hearts.push({ x: cat.x + 6 * cat.dir, y: floorV - CAT_H - 1.5, t: 0, life: 1.1 });
        setState('sit');
      }
    } else if (treats.length) {
      // 吃得到的優先於哭
      cat.cryTarget = null;
      var target = nearestTreat();
      var dx = target.x - cat.x;
      cat.dir = dx > 0 ? 1 : -1;
      if (Math.abs(dx) - MOUTH <= 0.8) { cat.eating = target; setState('eat'); }
      else { setState('run'); cat.x += cat.dir * dt * 60; }
      cat.target = null;
    } else if (cat.cryTarget != null) {
      var cd = cat.cryTarget - cat.x;
      if (Math.abs(cd) < 1.2) {
        cat.x = cat.cryTarget;
        setState('cry');
        // 兩眼各噴一道：眼睛在貓身中心前方 3.5 與 10.5 格（見 drawCat 的頭部座標）
        if (Math.random() < dt * 11) {
          for (var e = 0; e < 2; e++) {
            var ex = cat.x + (e ? 10.5 : 3.5) * cat.dir;
            cat.tears.push({
              x: ex, y: floorV - CAT_H + 11,
              vx: cat.dir * (9 + Math.random() * 9) * (e ? 1 : 0.55),
              vy: -(9 + Math.random() * 7),
              t: 0, life: 1.4
            });
          }
        }
        if (cat.t > 5.5) { cat.cryTarget = null; setState('sit'); }
      } else {
        cat.dir = cd > 0 ? 1 : -1;
        setState('run');
        cat.x += cat.dir * dt * 60;
      }
    } else if (cat.state === 'walk' && cat.target != null) {
      var wd = cat.target - cat.x;
      if (Math.abs(wd) < 1.5) { cat.target = null; setState('sit'); }
      else { cat.dir = wd > 0 ? 1 : -1; cat.x += cat.dir * dt * 16; }
    } else if (cat.state === 'sit') {
      cat.idle += dt;
      if (cat.idle > 26) setState('sleep');
      else if (cat.t > 3 + Math.random() * 4) {
        var r = Math.random();
        if (r < 0.4) wander();
        else if (r < 0.68) setState('groom');
        else if (r < 0.82) setState('stretch');
        else cat.t = 0;
      }
    } else if (cat.state === 'groom' && cat.t > 2.6) {
      setState('sit');
    } else if (cat.state === 'stretch') {
      if (cat.t > STRETCH_T) setState('sit');
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
    if (visible) { update(dt); draw(); }   // 分類展開時整隻收起來，不必空轉
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
      cat.hearts.push({ x: cat.x + 3, y: floorV - CAT_H - 3, t: 0, life: 1.2 });
      cat.idle = 0;
      cat.happy = 1.3;                                 // 被摸：瞇眼笑一下
      if (cat.state === 'sleep') { setState('stretch'); }        // 睡醒先伸個懶腰
      else if (cat.state === 'cry') { cat.cryTarget = null; setState('sit'); }
      return;
    }
    refreshPlatforms();
    // 點在頁尾以下的空白處時，把起點提到地面之上：否則它下方沒有任何平台，
    // 會一路掉出頁面被回收，看起來像沒反應
    var fy = (e.clientY + window.scrollY) / U;
    if (groundY && fy > groundY - 1) fy = groundY - 1;
    falling.push({ x: (e.clientX + window.scrollX) / U, y: fy, prev: fy, vy: 0, base: 0 });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('resize', resize);
  // 手機網址列收合／雙指縮放時不一定會派 resize，但畫布的 CSS box 會變 —— 直接盯著它，
  // bitmap 才不會與 CSS box 脫鉤（脫鉤就會被拉伸，貓整個偏離橫桿）
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
    window.visualViewport.addEventListener('scroll', refreshPlatforms);
  }
  // 版面會變（展開分類、查詢、捲動），平台位置得跟著更新
  window.addEventListener('scroll', refreshPlatforms, { passive: true });
  window.addEventListener('hashchange', function () { setTimeout(refreshPlatforms, 60); });
  // 首頁路由展開／收合分類後會派這個事件：版面整個換掉，地板要重新量
  window.addEventListener('cat:relayout', function () { setTimeout(resize, 0); });

  resize();
  // ResizeObserver 只在「元素的框」變動時才觸發，若 bitmap 因其他原因與 CSS box 脫鉤
  // 就永遠不會自我修正，故這裡定期比對一次（順便更新平台位置）
  setInterval(function () {
    if (syncCanvasSize()) draw();
    refreshPlatforms();
  }, 500);
  if (reduced) draw(); else start();
})();
