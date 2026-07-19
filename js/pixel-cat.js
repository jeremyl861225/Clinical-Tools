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
     U=2、貓 32×22：畫面尺寸與 U=3／22×15 幾乎相同，但格數加倍。臉上的鼻子、嘴角
     只有一格，格子太粗時會糊成一團深色方塊，必須有這個解析度才畫得出五官。 */
  var U = 2;
  var CAT_W = 32, CAT_H = 22;
  var S = 1.5;        // pose() 的位移量沿用舊格距，乘上此值換算到新格距
  var MOUTH = 9;      // 嘴巴在貓身中心前方幾格：決定牠停在飼料多遠處
  var EDGE = 12;      // 貓身中心可到的左右極限，略小於半身寬，讓牠構得到橫桿盡頭的飼料
  var PEE_EVERY = 60;    // 尿尿間隔（秒）
  var PEE_STREAM = 2.2;  // 放水到第幾秒為止，之後轉為蓋貓砂
  var PEE_TOTAL = 5.2;

  /* ---- 配色：偏黃的橘貓（虎斑＋乳白腹部） ---- */
  var C = {
    ink:   '#8a4a1c',
    body:  '#eb9b3e',
    shade: '#cf7524',
    belly: '#f8e6c8',
    inner: '#d98a6a',
    eye:   '#3b2110',
    nose:  '#b5613a',   // 鼻頭：比輪廓淺一階，否則整片口鼻糊成一塊深色方塊
    food:  '#b8894a',
    foodHi:'#d9ae6e',
    heart: '#d9556b',
    tear:  '#6fa8c9',
    pee:   '#e8cf6a',
    dust:  '#c2ad8e'
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

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.imageSmoothingEnabled = false;
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

  /* ---- 各狀態的部件位移 ---- */
  function pose() {
    var s = cat.state, ph = cat.phase, o = {
      bodyDip: 0, headX: 0, headY: 0, legs: [0, 0, 0, 0],
      tail: 0, tailUp: 0, eyeOpen: 1, sit: false, curl: false,
      sad: false, lift: 0, kick: 0
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
    }
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

    var FL = CAT_H;                            // 地板（局部座標），所有腳都止於此
    var bY = 10.6 + o.bodyDip * S + (o.curl ? 2.6 : 0);
    var bH = o.curl ? 6 : 7;
    var legTop = bY + bH - 1;
    var legX = [6.2, 10.8, 17.2, 21], legW = 3;

    /* 尾巴：三段，中段深色＝虎斑尾的環 */
    if (!o.curl) {
      var t = o.tail * S, up = o.tailUp * S;
      px(3 - t * 0.3, bY + 1.4 - up * 0.4, 3.2, 3.2, C.body);
      px(1.6 - t * 0.55, bY - 1 - up * 1.1, 3.2, 3.2, C.shade);
      px(0.6 - t * 0.8, bY - 3.4 - up * 1.7, 3.2, 3.2, C.body);
    } else {
      px(3, FL - 3, 5, 3, C.shade);
      px(7, FL - 2.4, 5, 2.4, C.body);
    }

    /* 四肢 */
    if (o.lift || o.kick) {
      // 尿尿：前腳站定；後腳先抬高放水，再往後撥土（蓋貓砂）
      px(legX[2], legTop, legW, FL - legTop, C.body);
      px(legX[2], FL - 1.6, legW, 1.6, C.belly);
      px(legX[3], legTop, legW, FL - legTop, C.body);
      px(legX[3], FL - 1.6, legW, 1.6, C.belly);
      px(legX[1], legTop, legW, FL - legTop, C.shade);
      px(legX[1], FL - 1.6, legW, 1.6, C.belly);
      if (o.lift) {
        // 抬起的那條後腿：向後上方伸直，腳掌離地
        px(legX[0] - 2.6, legTop - 4.4, legW, 4.2, C.shade);
        px(legX[0] - 3.6, legTop - 5, 2.4, 1.6, C.belly);
      } else {
        var back = Math.max(0, o.kick) * 4.5;          // 往後掃
        var upk = Math.max(0, o.kick) * 1.8;
        px(legX[0] - back, legTop - upk, legW, FL - legTop + upk - 0.6, C.shade);
        px(legX[0] - back - 0.6, FL - 1.6 - upk, 2.6, 1.6, C.belly);
      }
    } else if (!o.sit) {
      for (var i = 0; i < 4; i++) {
        var ly = legTop - o.legs[i] * S;
        px(legX[i], ly, legW, FL - ly, i < 2 ? C.shade : C.body);
        px(legX[i], FL - 1.6, legW, 1.6, C.belly);     // 乳白腳掌
      }
    } else {
      blob(5, bY + 2.4, 8.6, FL - bY - 2.4, C.shade);  // 蹲坐的臀塊，與身體相連
      px(5.8, FL - 1.6, 7, 1.6, C.belly);
      px(legX[2], legTop, legW, FL - legTop, C.body);
      px(legX[2], FL - 1.6, legW, 1.6, C.belly);
      px(legX[3], legTop, legW, FL - legTop, C.body);
      px(legX[3], FL - 1.6, legW, 1.6, C.belly);
    }

    /* 身體：斑紋一律畫在輪廓「之內」，不再往上外掛一條線 */
    blob(4.6, bY, 18, bH, C.body);
    px(6.4, bY + bH - 2.4, 13, 2.4, C.belly);          // 腹部乳白
    px(6.4, bY, 15, 1.4, C.shade);                     // 背脊：身體最上面那一列
    px(8.6, bY + 1.4, 1.6, 3, C.shade);                // 虎斑
    px(12.4, bY + 1.4, 1.6, 3.6, C.shade);
    px(16.2, bY + 1.4, 1.5, 2.8, C.shade);

    /* 頭：大圓臉、耳朵靠攏；五官依範本 —— 大眼帶眼神光、小三角鼻、w 形嘴、額頭虎斑 */
    var hX = 17.2 + o.headX * S, hY = 5.4 + o.headY * S + o.bodyDip * S;
    px(hX + 1.2, hY - 2.8, 3.2, 3.4, C.shade);         // 遠耳（暗一階，拉出前後）
    px(hX + 7, hY - 3.2, 3.6, 3.8, C.body);            // 近耳
    px(hX + 7.7, hY - 2.3, 2, 2.4, C.inner);
    blob(hX, hY, 12, 10, C.body);
    px(hX + 2.8, hY + 0.5, 1.3, 2.4, C.shade);         // 額頭虎斑
    px(hX + 5.4, hY + 0.3, 1.3, 2.8, C.shade);
    px(hX + 8, hY + 0.6, 1.3, 2.2, C.shade);
    px(hX + 0.4, hY + 4.6, 1.4, 3.4, C.shade);         // 臉頰暗面

    // 口鼻：乳白圓塊上放一個小三角鼻與 w 形嘴（鼻子用中間色，全用 ink 會糊成一塊）
    blob(hX + 3.8, hY + 7, 5.4, 2.8, C.belly);
    px(hX + 5.9, hY + 6.9, 2, 0.9, C.nose);            // 三角鼻：上寬下窄兩列
    px(hX + 6.4, hY + 7.8, 1, 0.7, C.nose);
    // w 形嘴：兩點必須隔開三格以上，否則各自進位後會併成一條深色橫槓
    px(hX + 5.2, hY + 9, 0.9, 0.8, C.ink);
    px(hX + 8, hY + 9, 0.9, 0.8, C.ink);
    px(hX + 11.4, hY + 7.4, 2, 0.4, C.belly);          // 鬍鬚
    px(hX + 11.4, hY + 9, 2, 0.4, C.belly);

    if (o.sad) {
      px(hX + 2.4, hY + 3.8, 2.8, 1, C.ink);           // ㄦ 字眼（哭）
      px(hX + 2.9, hY + 4.8, 1.8, 0.9, C.ink);
      px(hX + 6.8, hY + 3.8, 2.8, 1, C.ink);
      px(hX + 7.3, hY + 4.8, 1.8, 0.9, C.ink);
    } else if (o.eyeOpen) {
      blob(hX + 2.4, hY + 3.4, 2.8, 3.6, C.eye);       // 大眼
      blob(hX + 6.8, hY + 3.4, 2.8, 3.6, C.eye);
      // 眼神光只點一格且四周留黑：太大會從眼睛上緣溢出去，看起來像白眉毛
      px(hX + 3.2, hY + 4.4, 1, 1, '#fff');
      px(hX + 7.6, hY + 4.4, 1, 1, '#fff');
    } else {
      px(hX + 2.4, hY + 5, 2.8, 1, C.ink);
      px(hX + 6.8, hY + 5, 2.8, 1, C.ink);
    }

    /* 尿柱：自後半身底部往下，落到地板 */
    if (cat.state === 'pee' && cat.t > 0.5 && cat.t < PEE_STREAM) {
      var sy2 = bY + bH - 1;
      px(6, sy2, 1.4, FL - sy2, C.pee);
    }

    /* 打盹時冒 z */
    if (cat.state === 'sleep') {
      var zt = (cat.t * 0.6) % 3;
      if (zt < 2.2) {
        px(hX + 12.5 + zt * 1.5, hY - 2 - zt * 2.4, 3, 1, C.ink);
        px(hX + 13.5 + zt * 1.5, hY - 1 - zt * 2.4, 1.2, 1, C.ink);
        px(hX + 12.5 + zt * 1.5, hY - 0 - zt * 2.4, 3, 1, C.ink);
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
    // 文件座標 → 裝置像素：捲動位移交給 transform，飼料才會黏在它停靠的平台上
    ctx.setTransform(U * dpr, 0, 0, U * dpr, -window.scrollX * dpr, -window.scrollY * dpr);
    ctx.clearRect(window.scrollX / U, window.scrollY / U,
                  window.innerWidth / U + 2, window.innerHeight / U + 2);

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
      px(d.x, d.y, 1.5, 2, C.tear);
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

    var i;
    for (i = cat.hearts.length - 1; i >= 0; i--) {
      var h = cat.hearts[i]; h.t += dt; h.y -= dt * 9;
      if (h.t > h.life) cat.hearts.splice(i, 1);
    }
    for (i = cat.tears.length - 1; i >= 0; i--) {
      var d = cat.tears[i]; d.t += dt; d.y += dt * 21;
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
        if (Math.random() < dt * 6) {                 // 眼淚自眼睛滴落
          cat.tears.push({ x: cat.x + 5 * cat.dir, y: floorV - CAT_H + 9, t: 0, life: 1.2 });
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
      if (cat.state === 'sleep' || cat.state === 'cry') { cat.cryTarget = null; setState('sit'); }
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
  // 版面會變（展開分類、查詢、捲動），平台位置得跟著更新
  window.addEventListener('scroll', refreshPlatforms, { passive: true });
  window.addEventListener('hashchange', function () { setTimeout(refreshPlatforms, 60); });
  // 首頁路由展開／收合分類後會派這個事件：版面整個換掉，地板要重新量
  window.addEventListener('cat:relayout', function () { setTimeout(resize, 0); });

  resize();
  setInterval(refreshPlatforms, 500);
  if (reduced) draw(); else start();
})();
