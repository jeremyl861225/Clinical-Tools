/* js/orca.js —— 04 造句主畫面的殺人鯨
 *
 * 只出現在「造句設計的首頁」（#sentHome 存在時）。內頁插的是 #sentTrail，
 * 天然分得開；關掉造句設計、或進了任何一個分頁，整塊拆掉。
 *
 * ---------------------------------------------------------------
 * 舞台：fixed 疊層，不是 absolute
 * ---------------------------------------------------------------
 * 像素貓（js/pixel-cat.js）用 absolute＋文件座標，是因為牠得**站在**標題橫桿
 * 那條線上——疊層與文件必須逐像素對齊，fixed 疊層在動量捲動時會慢半拍。
 * 這條鯨魚不依附任何元素，牠就是浮在畫面前方自由游動，所以 fixed 才對：
 *   · 不必量文件高度、不必補 scrollY，快速捲動不會走位；
 *   · 畫布不進文件流、不撐開 scrollHeight，**不可能跑版**（這是使用者明確要求）；
 *   · 活動範圍＝整個視口，四邊沒有隱形的牆——牠可以游到貼邊、半個身子出畫再回來，
 *     靠邊不是反彈，是「換一個目標點，然後轉身」。
 *
 * ---------------------------------------------------------------
 * 造形：一套 3D 幾何投影，不是兩張圖互切
 * ---------------------------------------------------------------
 * 身體用「體長座標 u」定義（u=0 吻端、u=1 尾柄末端），每一個橫斷面有
 * 上下半高 top/bot 與側向半寬 hw。整條鯨魚是 3D 的，再投影到畫面上：
 *
 *     螢幕 x = X·sinθ + Z·cosθ        （θ＝偏航角；X 沿體軸、Z 側向、Y 垂直）
 *     深度 d = X·cosθ − Z·sinθ        （d 大者近）
 *
 * θ=±90° 是完全側面，θ=0 是正臉（吻端朝著使用者），θ=180° 是正後方。
 * 因此**轉身是連續的一個角度掃過去**，不是左右鏡射：
 *     完全側 → 側臉 → 正臉 → 另一邊側臉 → 轉身完成（使用者指定的順序）
 * 掃到中段時 sinθ→0，畫面上的水平速度自然趨近零——牠是「朝著你游一段再轉開」，
 * 不是原地翻牌。轉身曲線刻意在中段放慢（見 turnEase），正臉那一格才看得清楚。
 *
 * 身體輪廓＝「解析輪廓線」∪「逐斷面的圓角矩形」，兩者同色、分兩次不透明填滿
 * （疊起來就是聯集，沒有接縫；為什麼不能塞進同一條 path 見 bodyOutline 上方）：
 *   · 側面時 cosθ→0，圓角矩形收成一格寬，輪廓由解析曲線決定 —— 邊緣平滑；
 *   · 正臉時 sinθ→0，解析輪廓收成一條線，身體由一疊圓角矩形撐出圓胖的橫斷面。
 * 一個公式從側面連續走到正臉，中間每一格都是真的投影，不是補間動畫。
 *
 * 尾鰭是水平的（鯨豚上下擺尾），所以純側面時它其實只會投影成一條線。真要那樣
 * 畫，側面看起來就沒有尾巴了——這裡給尾鰭一個隨 |cosθ| 消長的假二面角：側面時
 * 兩葉張成熟悉的新月形，正臉時攤平成一片橫的板子。這是唯一一處刻意的說謊。
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 剖面控制點（值＝最大半高的比例，最大處為 1） ---- */
  var PK   = [0, .03, .08, .16, .28, .40, .55, .70, .82, .92, 1];
  var PTOP = [.34, .64, .84, .97, 1, .96, .82, .60, .40, .26, .17];
  var PBOT = [.30, .62, .84, .97, 1, .96, .82, .58, .36, .22, .14];
  /* 腹白：下顎一路到肛門，近尾處往上翹一撇（虎鯨側面最好認的一筆） */
  var VK   = [0, .04, .10, .30, .52, .63, .70, .78, .86, 1];
  var VH   = [0, .30, .50, .46, .52, .74, .58, .26, .04, 0];
  /* 側向半寬：胸圍處近乎圓，尾柄側扁 */
  var WK   = [0, .04, .12, .28, .45, .62, .78, .90, 1];
  var WV   = [.26, .52, .70, .78, .72, .56, .36, .22, .13];

  /* 剖面內插：**單調三次**（Fritsch–Carlson），不是均勻參數的 Catmull-Rom。
     控制點的間距差到五倍（0.04 一格接著 0.20 一格），均勻 CR 公式算出來的切線在
     長短區間的交界會過衝 —— 腹白的上緣因此長出一排規律的小波浪，側身時看起來
     就像有人在牠白肚子上畫了一條線。單調式保證曲線不會衝出相鄰兩個控制點的
     值域，形狀一樣平滑，但不再有那排波浪。切線只在載入時算一次。 */
  function prep(ts, vs) {
    var n = ts.length, d = [], m = [], i;
    for (i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
    for (i = 0; i < n; i++) {
      if (i === 0) { m.push(d[0]); continue; }
      if (i === n - 1) { m.push(d[n - 2]); continue; }
      if (d[i - 1] * d[i] <= 0) { m.push(0); continue; }      // 極值點：切線壓平
      var t = (d[i - 1] + d[i]) / 2;
      var lim = 3 * Math.min(Math.abs(d[i - 1]), Math.abs(d[i]));
      if (Math.abs(t) > lim) t = (t > 0 ? 1 : -1) * lim;
      m.push(t);
    }
    return { t: ts, v: vs, m: m };
  }
  function at(c, x) {
    var ts = c.t, n = ts.length, i = 0;
    if (x <= ts[0]) return c.v[0];
    if (x >= ts[n - 1]) return c.v[n - 1];
    while (i < n - 2 && ts[i + 1] < x) i++;
    var h = ts[i + 1] - ts[i], s = (x - ts[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * c.v[i] + (s3 - 2 * s2 + s) * h * c.m[i] +
           (-2 * s3 + 3 * s2) * c.v[i + 1] + (s3 - s2) * h * c.m[i + 1];
  }
  var C_TOP = prep(PK, PTOP), C_BOT = prep(PK, PBOT),
      C_VENT = prep(VK, VH), C_WIDE = prep(WK, WV);

  /* ---- 尺寸：全部由體長 L 推導，換了螢幕寬度整條等比縮放 ---- */
  var D = {};
  function proportions(L) {
    D.L = L;
    D.H = L * .108;                 // 最大半高（虎鯨側面約為體長的 0.11）
    D.amp = L * .030;               // 擺尾振幅
    D.wave = .6;                    // 全身容納幾個波
    D.flukeLen = L * .10;
    D.flukeH = L * .115;
    D.dorU = .44; D.dorW = L * .16; D.dorH = L * .235; D.dorSweep = L * .095;
    D.pecU = .26; D.pecLen = L * .155; D.pecW = L * .082; D.pecAng = .62;
    D.eyeU = .105;
    D.span = L + D.flukeLen;
  }

  function topH(u) { return at(C_TOP, Math.min(1, u)) * D.H; }
  function botH(u) { return at(C_BOT, Math.min(1, u)) * D.H; }
  function halfW(u) { return at(C_WIDE, Math.min(1, u)) * D.H; }
  function ventH(u) {
    var v = at(C_VENT, Math.min(1, u)) * D.H;
    return Math.max(0, Math.min(v, (topH(u) + botH(u)) * .82));
  }

  /* ================================================================
   * 狀態
   * ================================================================ */
  var W = 0, Hv = 0, dpr = 1, floorY = 0, docH = 0;
  var canvas = null, ctx = null, raf = null, last = 0, alive = false;
  var P = null;

  var o = {
    x: 0, y: 0,                    // 身體中心（**文件座標**：捲動時牠跟著頁面走）
    th: Math.PI / 2,               // 偏航角：+π/2 面向右、−π/2 面向左
    face: 1,
    pitch: 0, pitchWant: 0,
    speed: 40, spdWant: 40,        // 加減速有慣性，速度不會瞬間切換
    phase: 0, thrust: 1, thrustWant: 1, gape: 0, gapeWant: 0,
    gliding: false, beatT: 2.5,    // 衝刺—滑行：虎鯨不會整天勻速擺尾
    turnCool: 0,                   // 轉身冷卻，避免一直翻來覆去
    roll: 1,                       // 翻滾特技用的上下鏡射（1 → −1 → 1）
    tx: 0, ty: 0, wait: 0,
    turn: null,                    // { from, to, t, dur }
    trick: null,                   // { kind, t, dur }
    mode: 'cruise'
  };
  var food = [], bubbles = [];

  /* ---- 色票：跟著 04 造句設計的骨白／墨綠走 ---- */
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    var v = function (n) { return cs.getPropertyValue(n).trim(); };
    var bg = v('--sentence-bg') || '#efece1';
    // 暗色底的亮度判斷：#0a…／#1… 開頭一律當暗底
    var dark = /^#[01]/.test(bg);
    return {
      skin:  dark ? '#26362f' : '#16241f',
      belly: dark ? (v('--sentence-fg') || '#ece6d8') : bg,   // 兩邊都是骨白
      ink:   '#0a1512',
      food:  v('--sentence-warn') || '#7d5a10',
      bub:   dark ? (v('--sentence-fg') || '#ece6d8') : '#16241f'
    };
  }

  /* ================================================================
   * 幾何 → 畫面
   * ================================================================ */
  /* 行進波：虎鯨是上下擺尾（背腹向），不是魚那種左右擺。振幅隨 u^1.6 增大——
     頭幾乎不動、力量全在尾柄與尾鰭；頭部保留 0.07 的底噪，完全不動反而僵硬。 */
  function spine(u) {
    return D.amp * (.07 + Math.pow(Math.min(1.35, u), 1.6)) * o.thrust *
           Math.sin(o.phase - u * D.wave * TAU);
  }
  /* 張嘴＝把**下顎整片**繞著嘴角轉開，身體本身一格都不動。
     先前的作法是「u<0.24 的下緣往下掉」，有兩個毛病：一是嘴巴閉不出縫，
     只是把頭腫大一塊；二是張嘴幅度由「吻端到魚的距離」即時算出，而吻端本身
     隨著擺尾一直在動，於是整條腹線每一幀都被改寫一次——那就是使用者看到的抖動。
     現在幅度另外做平滑（見 step()），而且只作用在下顎那一片上。
     MU＝嘴角所在的體長座標；下顎的上緣就是腹白的上緣（虎鯨黑白的交界正是嘴線）。 */
  var MU = .20;
  function jawAngle(S) { return o.gape * .5 * (S < 0 ? -1 : 1); }

  /* 身體＝「解析輪廓」∪「逐斷面圓角矩形」。
     兩者一定要**分兩次 fill**，不可以塞進同一條 path 一次填：解析輪廓的繞行
     方向（沿背緣往尾、再沿腹緣回頭）與 roundRect 的順時針相反，而且鯨魚朝左時
     sinθ<0 會把整條輪廓再鏡射一次、方向又翻回來。同一條 path 用 nonzero 填，
     繞向相反的重疊處會互相抵消 —— 畫面上是一條被梳成一格一格的斑馬鯨。
     兩次 fill 同色不透明，疊起來就是乾淨的聯集，沒有接縫也沒有繞向問題。 */
  function bodyOutline(g, S) {
    var N = 40, i, u;
    g.beginPath();
    for (i = 0; i <= N; i++) {                       // 背緣：吻 → 尾柄
      u = i / N;
      var x = -u * D.L * S, y = spine(u) - topH(u);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    for (i = N; i >= 0; i--) {                       // 腹緣：尾柄 → 嘴角
      u = i / N;
      if (u < MU) break;
      g.lineTo(-u * D.L * S, edgeBot(u));
    }
    for (i = 12; i >= 0; i--) {                      // 嘴角 → 吻：走嘴線（＝腹白上緣）
      u = MU * i / 12;
      g.lineTo(-u * D.L * S, edgeVent(u));
    }
    g.closePath();
  }
  /* 下顎：u∈[0,MU] 之間、嘴線與腹緣之間的那一片。整片繞嘴角旋轉，
     張開後上下顎之間就是**沒有填色的空隙**——從那裡看得到後面的頁面。 */
  function jawPath(g, S) {
    var N = 14, i, u;
    g.beginPath();
    for (i = 0; i <= N; i++) {
      u = MU * i / N;
      var x = -u * D.L * S, y = edgeVent(u);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    for (i = N; i >= 0; i--) {
      u = MU * i / N;
      g.lineTo(-u * D.L * S, edgeBot(u));
    }
    g.closePath();
  }
  /* 肋條的上下緣一律取「自己涵蓋的那一小段裡最保守的值」（上緣取最低、下緣取
     最高）。每條肋條的頂是平的，而真正的輪廓在那 5–7 px 內是斜的，直接用中點
     的值會讓平頂凸出平滑輪廓之外——側身時看起來就是白肚子上緣一排規律的扇貝，
     使用者說的「奇怪的線條」就是它。取保守值之後肋條永遠縮在輪廓之內，中間
     露出來的縫由解析輪廓本身補滿。 */
  function ribSpan(u, d, fn, mode) {
    var a = fn(Math.max(0, u - d)), b = fn(u), c = fn(Math.min(1, u + d));
    return mode > 0 ? Math.max(a, b, c) : Math.min(a, b, c);
  }
  function edgeTop(u) { return spine(u) - topH(u); }
  function edgeBot(u) { return spine(u) + botH(u); }
  function edgeVent(u) { return spine(u) + botH(u) - ventH(u); }

  function bodyRibs(g, S, C) {                       // 側向鼓起（正臉時的圓胖身體）
    var ac = Math.abs(C), M = 34, i, d = 1 / M;
    // 完全側面時解析輪廓已經是精確解，肋條一點也不必畫
    if (ac < .06) { g.beginPath(); return; }
    g.beginPath();
    for (i = 0; i <= M; i++) {
      var u = i / M;
      var hw = halfW(u) * ac + D.L * Math.abs(S) / M * .55 + .5;
      var y0 = ribSpan(u, d, edgeTop, 1);
      var y1 = ribSpan(u, d, u < MU ? edgeVent : edgeBot, -1);
      if (y1 - y0 < 1) continue;
      rrect(g, -u * D.L * S - hw, y0, hw * 2, y1 - y0,
            Math.min(hw, (y1 - y0) / 2) * ac);
    }
  }
  /* 腹白同理拆成兩次。它不必再 clip 回身體裡：ventH 已夾在 0.82×總高之內、
     橫向只取 0.58×半寬（正臉時白色才不會糊成一整片），兩端又收斂到 0，
     構造上就跑不出輪廓。 */
  function ventOutline(g, S) {
    var N = 30, i, u;
    g.beginPath();
    for (i = 0; i <= N; i++) {                       // 腹緣：嘴角 → 尾柄
      u = MU + (1 - MU) * i / N;
      var x = -u * D.L * S, y = edgeBot(u);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    for (i = N; i >= 0; i--) {                       // 腹白上緣折回
      u = MU + (1 - MU) * i / N;
      g.lineTo(-u * D.L * S, edgeVent(u));
    }
    g.closePath();
  }
  function ventRibs(g, S, C) {
    var ac = Math.abs(C), M = 30, i, d = 1 / M;
    if (ac < .06) { g.beginPath(); return; }
    g.beginPath();
    for (i = 0; i <= M; i++) {
      var u = i / M;
      if (u < MU || ventH(u) <= .5) continue;
      var hw = halfW(u) * .58 * ac + D.L * Math.abs(S) / M * .55 + .4;
      var y0 = ribSpan(u, d, edgeVent, 1), y1 = ribSpan(u, d, edgeBot, -1);
      if (y1 - y0 < 1) continue;
      rrect(g, -u * D.L * S - hw, y0, hw * 2, y1 - y0, Math.min(hw, (y1 - y0) / 2) * ac);
    }
  }
  function rrect(g, x, y, w, h, r) {
    if (h <= 0 || w <= 0) return;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* 背鰭：長在正中矢狀面上，所以水平方向隨 sinθ 收縮；正臉時仍留一點厚度，
     否則牠會整片消失，而虎鯨從正面看，背鰭正是最先認出來的那一筆。 */
  function dorsalPath(g, S) {
    var u = D.dorU, sy = spine(u), bx = -u * D.L * S, by = sy - topH(u) + 2;
    g.beginPath();
    g.moveTo(bx + D.dorW / 2 * S, by);
    g.quadraticCurveTo(bx + D.dorW * .16 * S, by - D.dorH * 1.02,
                       bx - D.dorSweep * S, by - D.dorH);
    g.quadraticCurveTo(bx - D.dorW * .26 * S, by - D.dorH * .30,
                       bx - D.dorW / 2 * S, by + 1);
    g.closePath();
    /* 鰭的「厚度」（隨 cosθ 長出來）必須沿著基部→鰭尖那條後掠的軸做成一片漸細
       的葉片。做成一根垂直的柱子會出事：鰭是往後掠的，柱子與三角形在頂端分岔，
       畫面上會冒出兩根天線。 */
  }
  /* 鰭的「厚度」隨 cosθ 長出來，另外一次 fill（繞向理由同 bodyRibs）。
     它必須沿著基部→鰭尖那條後掠的軸做成一片漸細的葉片：做成一根垂直的柱子，
     頂端會與三角形分岔，畫面上冒出兩根天線。 */
  function dorsalBlade(g, S, C) {
    var th = D.dorW * .20 * Math.abs(C);
    if (th <= .6) return false;
    var u = D.dorU, by = spine(u) - topH(u) + 2, bx = -u * D.L * S;
    var tx = bx - D.dorSweep * S, ty = by - D.dorH;
    g.beginPath();
    g.moveTo(bx - th, by);
    g.quadraticCurveTo(bx - th, by - D.dorH * .5, tx - th * .34, ty);
    g.lineTo(tx + th * .34, ty);
    g.quadraticCurveTo(bx + th, by - D.dorH * .5, bx + th, by);
    g.closePath();
    return true;
  }

  /* 胸鰭：基部在體側 Z=±hw，鰭尖再往外撇。side=+1／−1 是鯨魚的左右兩側，
     哪一邊近由深度決定（見檔頭投影式），近的畫在身體之後。 */
  function pecPath(g, S, C, side) {
    var u = D.pecU, sy = spine(u);
    var bz = halfW(u) * side, tz = (halfW(u) + D.pecLen * .5) * side;
    var bX = -u * D.L, tX = bX - D.pecLen * Math.cos(D.pecAng);
    var bx = bX * S + bz * C, by = sy + botH(u) * .45;
    var tx = tX * S + tz * C, ty = by + D.pecLen * Math.sin(D.pecAng);
    /* 槳狀：前緣（近吻側）微凸、後緣飽滿，鰭尖收成圓角。虎鯨的胸鰭是很寬的
       一片槳，畫窄了就變成壓在白肚子上的一道刮痕——那正是使用者看到的怪線條。 */
    var nx = (tx - bx) / D.pecLen, ny = (ty - by) / D.pecLen;   // 沿鰭的單位向量
    var px = -ny, py = nx;                                      // 垂直方向
    var w = D.pecW;
    g.beginPath();
    g.moveTo(bx + px * w * .35, by + py * w * .35);
    g.quadraticCurveTo(bx + nx * D.pecLen * .55 + px * w * .55,
                       by + ny * D.pecLen * .55 + py * w * .55,
                       tx + px * w * .12, ty + py * w * .12);
    g.quadraticCurveTo(tx - px * w * .3, ty - py * w * .3,
                       tx - px * w * .34, ty - py * w * .34);
    g.quadraticCurveTo(bx + nx * D.pecLen * .45 - px * w * .95,
                       by + ny * D.pecLen * .45 - py * w * .95,
                       bx - px * w * .75, by - py * w * .75);
    g.closePath();
  }

  /* 尾鰭：橫向的一片板子（w 從 −1 到 1）。純側面時給它一個假的二面角，
     兩葉張成新月；正臉時攤平成橫板。 */
  function flukePt(w, S, C) {
    var X = -D.L - D.flukeLen * (1 - .32 * Math.abs(w));
    var Z = w * D.flukeH;
    var lift = w * D.flukeH * .92 * (1 - Math.abs(C));
    return { x: X * S + Z * C, y: spine(1 + .28 * Math.abs(w)) + lift };
  }
  function flukePath(g, S, C) {
    var root = { x: -D.L * S, y: spine(1) };
    var up = flukePt(1, S, C), dn = flukePt(-1, S, C);
    var nk = flukePt(0, S, C);
    var m1 = flukePt(.55, S, C), m2 = flukePt(-.55, S, C);
    g.beginPath();
    g.moveTo(root.x, root.y);
    g.quadraticCurveTo(m1.x * .75 + root.x * .25, m1.y * .8 + root.y * .2, up.x, up.y);
    g.quadraticCurveTo((up.x + nk.x) / 2, (up.y + nk.y) / 2 - (up.y - nk.y) * .18,
                       nk.x, nk.y);
    g.quadraticCurveTo((dn.x + nk.x) / 2, (dn.y + nk.y) / 2 - (dn.y - nk.y) * .18,
                       dn.x, dn.y);
    g.quadraticCurveTo(m2.x * .75 + root.x * .25, m2.y * .8 + root.y * .2, root.x, root.y);
    g.closePath();
  }

  /* 臉：白眼斑（兩側各一）＋眼。眼斑貼在體側，正臉時看到的是掠角，
     會收得很窄——留 0.3 的下限，正臉那一格才還看得出是一張臉。 */
  function drawFace(g, S, C, P) {
    var u = D.eyeU, sy = spine(u), hw = halfW(u);
    var fx = .30 + .70 * Math.abs(S);
    var pw = D.H * .95 * fx, ph = D.H * .42;
    for (var i = 0; i < 2; i++) {
      var side = i ? 1 : -1;
      // 這一側是否朝著使用者：深度 d = −Z·sinθ（頭部 X≈0）
      var near = -side * S;
      if (near < -.12) continue;                       // 完全背對就不畫
      var cx = -u * D.L * S + (hw * .92 * side) * C;
      var cy = sy - topH(u) * .04;
      g.save();
      g.translate(cx, cy);
      g.rotate(-.16 * (S >= 0 ? 1 : -1));
      g.beginPath(); g.ellipse(0, 0, pw / 2, ph / 2, 0, 0, TAU);
      g.fillStyle = P.belly; g.fill();
      g.restore();
    }
    /* 眼珠拿掉了（使用者指定）。留下來的是白色眼斑——那是虎鯨的斑紋，
       不是五官，也是這一款雙色平塗唯一需要的一筆。 */
    /* 這裡曾經有一條半透明的嘴線。拿掉了：它畫在下顎，而下顎正是腹白的範圍，
       側身時就變成一道橫過白肚子的深色刮痕——既不是虎鯨身上有的東西，也違背
       這一款「雙色平塗、沒有描邊」的設定。嘴的位置本來就由深淺交界表達。 */
  }

  function drawWhale(g, sc) {
    var S = Math.sin(o.th), C = Math.cos(o.th);
    g.save();
    g.translate(o.x, o.y - (sc || 0));
    g.rotate(o.pitch * S);                 // 俯仰：面向左時方向相反，乘 S 自動處理
    g.scale(1, o.roll);                    // 翻滾特技
    g.translate(D.span / 2 * S, 0);        // 原點移到吻端

    var headNear = C >= 0;                 // 吻端朝著使用者？決定前後遮擋順序
    var farSide = S >= 0 ? 1 : -1;         // 遠側胸鰭

    function fins() {
      dorsalPath(g, S); g.fill();
      if (dorsalBlade(g, S, C)) g.fill();
      flukePath(g, S, C); g.fill();
    }
    function trunk() {
      bodyOutline(g, S); g.fill();
      bodyRibs(g, S, C); g.fill();
      g.fillStyle = P.belly;
      ventOutline(g, S); g.fill();
      ventRibs(g, S, C); g.fill();
      /* 下顎：整片繞嘴角轉開。閉著（gape=0）時它剛好貼回原位，
         合起來與「一片完整的身體」逐像素相同；張開時上下顎之間不填任何顏色，
         那道縫是真的透空的。 */
      var ja = jawAngle(S);
      g.save();
      if (ja) {
        var hx = -MU * D.L * S, hy = edgeVent(MU);
        g.translate(hx, hy); g.rotate(ja); g.translate(-hx, -hy);
      }
      jawPath(g, S); g.fill();
      g.restore();
      g.fillStyle = P.skin;
    }

    g.fillStyle = P.skin;
    pecPath(g, S, C, farSide); g.fill();      // 遠側胸鰭永遠在身體之後
    if (headNear) {
      fins(); trunk();
      pecPath(g, S, C, -farSide); g.fill();
      drawFace(g, S, C, P);
    } else {                                  // 背面：尾鰭與背鰭在前，臉不畫
      trunk();
      pecPath(g, S, C, -farSide); g.fill();
      fins();
    }
    g.restore();
  }

  /* 吻端在畫面上的位置（餵食判定用） */
  function snout() {
    var S = Math.sin(o.th), a = o.pitch * S, d = D.span / 2 * S;
    return { x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d };
  }

  /* ================================================================
   * 行為
   * ================================================================ */
  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  /* 巡游目標（＝吻端要去的點，文件座標）。兩件事：
     · 只在「現在看得到的那一帶」裡挑，捲到哪裡牠就在哪裡巡；
     · 新目標必須離現在的位置夠遠（至少 45% 的短邊），否則牠會一直在原地繞小圈，
       看起來像被關在畫面中央——使用者要的是整個畫面都巡得到。
     邊界只留約 1/3 身長與 2.5 倍體高的餘裕，那不是牆（飼料丟在角落照樣游過去、
     身子探出畫外一截，見 step() 結尾的夾限），只是不會自己挑一個必然半身出畫的點。 */
  function pickTarget() {
    var top = scrollTop();
    var mx = Math.min(D.span * .3, W * .3), my = Math.min(D.H * 2.5, Hv * .28);
    /* 目標優先挑在**現在頭朝的那一側**：牠因此會一路游過整個畫面寬度，
       只有真的沒空間了才挑後方、也才需要轉身。上下則不受限制——垂直移動
       靠俯仰就夠了，不必掉頭，所以整個畫面都巡得到而不會一直翻身。 */
    var room = o.face > 0 ? (W - mx - o.x) : (o.x - mx);
    if (room > W * .34 && Math.random() < .85) {
      o.tx = o.face > 0 ? o.x + room * (.45 + .55 * Math.random())
                        : o.x - room * (.45 + .55 * Math.random());
    } else {
      o.tx = o.face > 0 ? mx + Math.random() * Math.max(20, o.x - mx)
                        : o.x + Math.random() * Math.max(20, W - mx - o.x);
    }
    o.ty = top + my + Math.random() * Math.max(20, Hv - my * 2);
    o.wait = .4 + Math.random() * 2.2;
  }

  /* 轉身：從一側連續掃到另一側，中途經過正臉（θ=0）。整整 1.5 秒，
     五個階段（完全側→側臉→正臉→另一邊側臉→完全側）每一段都看得清楚。 */
  /* 轉身有冷卻時間：巡游時至少隔 TURN_COOL 秒才准再轉一次。少了這一條，
     每換一個目標點就轉一次身，畫面上就是一條一直在原地翻來覆去的鯨魚。
     追餌與游回畫面（urgent）不受冷卻限制——那兩件事本來就該立刻掉頭。 */
  var TURN_COOL = 4.5;
  function startTurn(face, urgent) {
    if (o.turn || o.face === face) return;
    if (!urgent && o.turnCool > 0) return;
    o.turn = { from: o.face, t: 0, dur: 1.5 };
    o.turnCool = TURN_COOL;
    o.face = face;
  }
  /* **補間走 sinθ，不走 θ** —— 這是轉身末段會卡幀的根因：畫面上看到的身長正比
     於 sinθ，愈接近完全側面 cosθ→0，同樣的角速度換算成視覺變化量愈小；再乘上
     一條末端導數也是 0 的緩動曲線，兩個零疊在一起，最後那 0.2 秒就整個停住。
     改成直接補間 S＝sinθ、再用 θ=asin(S) 反推（asin 的值域保證 cosθ≥0，也就是
     一路走正臉那半邊，不會抄後腦勺），視覺變化率就從頭到尾均勻。
     ease 只保留「正臉附近略慢」這一件事：導數在兩端 1.57、中段 0.44。 */
  function turnEase(t) { return t + .09 * Math.sin(TAU * t); }
  function turnAngle(tn, q) {
    var S = tn.from * (1 - 2 * turnEase(q));
    return Math.asin(Math.max(-1, Math.min(1, S)));
  }

  function startTrick() {
    var r = Math.random();
    var kind = r < .3 ? 'spin' : r < .58 ? 'roll' : r < .84 ? 'loop' : 'slap';
    o.trick = { kind: kind, t: 0, dur: kind === 'loop' ? 1.5 : kind === 'slap' ? 1.4 : 1.1 };
    o.turn = null;
    if (kind === 'slap') blow(4);
  }
  function blow(n) {
    var s = snout();
    for (var i = 0; i < n; i++)
      bubbles.push({ x: s.x + (Math.random() - .5) * D.H * 2,
                     y: s.y + (Math.random() - .5) * D.H,
                     r: 1 + Math.random() * 2.6, t: 0, life: 1 + Math.random() });
  }

  function step(dt) {
    /* 擺尾頻率跟著速度走（滑行時尾巴幾乎不動），這是牠看起來像在「用力」
       還是「順水漂」的差別。 */
    o.phase += dt * (2.0 + 6.4 * o.speed / 60) *
               (o.trick && o.trick.kind === 'slap' ? 2.4 : 1);

    var i, f;
    /* 飼料：自由落下、中途沒有任何平台擋著。沉降速度刻意壓在 52 px/s——
       追餌的泳速是它的兩倍以上，所以無論丟在哪裡，牠一定追得上；
       落到底就躺著等（不會沉出畫外消失）。 */
    for (i = food.length - 1; i >= 0; i--) {
      f = food[i]; f.t += dt;
      if (!f.rest) {
        f.vy = Math.min(52, f.vy + dt * 90);
        f.y += f.vy * dt;
        f.x += Math.sin(f.t * 2.4 + f.s) * 9 * dt;
        if (f.y >= floorY) { f.y = floorY; f.rest = true; }
      }
    }
    for (i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i]; b.t += dt; b.y -= dt * 30; b.x += Math.sin(b.t * 4) * 7 * dt;
      if (b.t > b.life) bubbles.splice(i, 1);
    }

    /* ---- 特技 ---- */
    if (o.trick) {
      var tr = o.trick; tr.t += dt;
      var k = Math.min(1, tr.t / tr.dur);
      if (tr.kind === 'spin') {                        // 原地轉一圈（側→正→背→側）
        o.th = o.face * Math.PI / 2 + TAU * k * o.face;
        o.thrust = o.thrustWant = 1.4;
      } else if (tr.kind === 'roll') {                 // 翻身：肚皮朝上再翻回來
        o.roll = Math.cos(TAU * k);
        if (Math.abs(o.roll) < .06) o.roll = o.roll < 0 ? -.06 : .06;
        o.thrust = o.thrustWant = 1.5;
      } else if (tr.kind === 'loop') {                 // 垂直繞一圈
        o.pitch = TAU * k;
        o.thrust = o.thrustWant = 1.6;
      } else {                                         // 拍尾
        o.thrust = o.thrustWant = 2.6;
        if (Math.random() < dt * 6) blow(1);
      }
      if (k >= 1) {
        o.trick = null; o.thrust = o.thrustWant = 1; o.roll = 1;
        o.th = o.face * Math.PI / 2; o.pitch = 0; o.pitchWant = 0;
        pickTarget();
      }
    } else {
      /* ---- 操舵：轉身當中也照樣算 ----
         轉身那 1.5 秒若把俯仰壓成 0（先前的作法），牠等於每轉一次身就被扶正一次，
         結果永遠在同一條水平帶上來回，巡不到畫面的上下兩端。這裡改成照常算俯仰、
         轉身時只把它打個六折（轉彎本來就會收斂動作），θ 則交給轉身自己掃。 */
      var top = scrollTop();
      var s0 = snout();

      /* 被使用者捲出畫面 → 什麼都先放下，游回看得到的地方 */
      var outUp = o.y < top - Hv * .10, outDn = o.y > top + Hv * 1.10;
      var target = null;
      if (outUp || outDn) {
        o.mode = 'return';
        o.tx = Math.max(D.span * .3, Math.min(W - D.span * .3, o.x));
        o.ty = outUp ? top + Hv * .30 : top + Hv * .70;
        o.wait = .2;
      } else {
        var bd = 1e9;
        for (i = 0; i < food.length; i++) {
          var d = Math.hypot(food[i].x - o.x, food[i].y - o.y);
          if (d < bd) { bd = d; target = food[i]; }
        }
        /* 追什麼都以**吻端**為準，不是身體中心：中心對準飼料的話，吻端會超前
           半個身長，魚永遠從牠身側掠過，繞一圈也吃不到。 */
        if (target) {
          o.mode = 'chase'; o.tx = target.x; o.ty = target.y;
          var md = Math.hypot(target.x - s0.x, target.y - s0.y);
          if (md < D.H * 1.1) {                          // 吞下
            food.splice(food.indexOf(target), 1);
            o.gape = 1; o.gapeWant = 0; blow(6);          // 合起來＝咬下去
          } else if (md < D.L * .55) {
            o.gapeWant = Math.min(1, (D.L * .55 - md) / (D.L * .38));
          } else o.gapeWant = 0;
        } else {
          if (o.mode !== 'cruise') { o.mode = 'cruise'; pickTarget(); }
          if (Math.hypot(o.tx - s0.x, o.ty - s0.y) < D.L * .28) {
            o.wait -= dt;
            if (o.wait <= 0) pickTarget();
          }
        }
      }

      var dx = o.tx - s0.x, dy = o.ty - s0.y;
      /* 冷卻不該把牠壓在畫面邊緣磨蹭：前方已經沒路了就算緊急，立刻轉。 */
      var noRoom = o.face > 0 ? (o.x > W - D.span * .45) : (o.x < D.span * .45);
      var urgent = o.mode !== 'cruise' || noRoom;
      if (!o.turn && Math.abs(dx) > D.L * (urgent ? .35 : .8)) {
        startTurn(dx > 0 ? 1 : -1, urgent);
      }
      /* 俯仰上限依情境放寬：
         · 追餌 87°——使用者要求「筆直游向飼料」，所以連分母的那個下限也拿掉，
           算的是真正的視線角；魚在正下方時牠就整條豎起來直直往下衝。
         · 游回畫面 80°——只能沿著頭的方向走，不准豎起來就只能繞遠路。
         · 平常巡游 66°，並保留 L*0.3 的分母下限，姿態才不會一直大起大落。 */
      var pmax = o.mode === 'chase' ? 1.52 : o.mode === 'return' ? 1.4 : 1.15;
      var den = o.mode === 'chase' ? Math.max(1, Math.abs(dx))
                                   : Math.max(D.L * .3, Math.abs(dx));
      o.pitchWant = Math.max(-pmax, Math.min(pmax, Math.atan2(dy, den))) *
                    (o.turn ? .6 : 1);

      if (o.turn) {                                      /* ---- 轉身 ---- */
        var tn = o.turn; tn.t += dt;
        var q = Math.min(1, tn.t / tn.dur);
        o.th = turnAngle(tn, q);
        if (q >= 1) { o.turn = null; o.th = o.face * Math.PI / 2; }
      } else {
        o.th = o.face * Math.PI / 2;
      }

      /* 衝刺—滑行：野生虎鯨巡游時是「擺幾下、然後收尾滑一段」，不是整天
         勻速踩踏板。滑行段擺尾振幅收到兩成、速度掉一半，看起來才是在省力。 */
      o.beatT -= dt;
      if (o.beatT <= 0) {
        o.gliding = !o.gliding;
        o.beatT = o.gliding ? 1.3 + Math.random() * 2.1 : 2.4 + Math.random() * 2.8;
      }
      if (o.mode === 'chase') { o.gliding = false; o.spdWant = 108; o.thrustWant = 1.35; }
      else if (o.mode === 'return') { o.gliding = false; o.spdWant = 132; o.thrustWant = 1.45; }
      else if (o.gliding) { o.spdWant = 24; o.thrustWant = .22; }
      else { o.spdWant = 54; o.thrustWant = 1; }
    }
    /* 張嘴幅度一律走速率上限的平滑，不直接吃「吻端到魚的距離」——那個距離
       本身隨擺尾一直在抖，直接用會讓嘴巴每一幀開合一次（使用者看到的抖動）。 */
    if (o.turnCool > 0) o.turnCool -= dt;
    if (!food.length || o.trick) o.gapeWant = 0;
    o.gape += Math.max(-dt * 2.6, Math.min(dt * 3.4, o.gapeWant - o.gape));
    if (o.gape < .004) o.gape = 0;

    if (!o.trick || o.trick.kind !== 'loop') {
      // 追餌時對正的速度快一倍：先把頭指向魚，之後就是一條直線
      var pr = dt * (o.mode === 'chase' ? 3.4 : 1.9);
      o.pitch += Math.max(-pr, Math.min(pr, o.pitchWant - o.pitch));
    }
    if (o.trick) o.spdWant = o.trick.kind === 'slap' ? 4 : 150;
    o.thrust += Math.max(-dt * 2.4, Math.min(dt * 3.2, o.thrustWant - o.thrust));
    var acc = o.trick ? 300 : 58;
    o.speed += Math.max(-dt * 90, Math.min(dt * acc, o.spdWant - o.speed));

    /* ---- 位移：嚴格沿著頭指的方向，沒有任何側向分量 ----
       體軸在 3D 是 (cosP·sinθ, sinP, cosP·cosθ)，前兩項就是畫面上的速度向量。
       牠因此不可能平移——要往別的方向走，只能先把頭轉過去。
       轉身掃到正臉時 sinθ→0，水平速度自然歸零：那一刻牠是朝著你游，不是停住。 */
    var S = Math.sin(o.th);
    o.x += Math.cos(o.pitch) * S * o.speed * dt;
    o.y += Math.sin(o.pitch) * o.speed * dt;

    /* ---- 邊界：沒有牆，只有「探出去一截就到頭」＋「靠邊提早換目標」 ----
       夾限放在「身體中心」上，且刻意留得比身長寬鬆：牠可以把頭探出畫面外去咬
       貼邊丟下的魚，但不會整隻飛到畫外變成一片空白。 */
    var bx = D.span * .35, by = D.H * 1.4;
    if (o.x < -bx || o.x > W + bx || o.y < -by || o.y > docH + by) {
      o.x = Math.max(-bx, Math.min(W + bx, o.x));
      o.y = Math.max(-by, Math.min(docH + by, o.y));
      if (!o.trick && o.mode === 'cruise') pickTarget();
    } else if (!o.trick && !o.turn && o.mode === 'cruise' &&
               (o.x < bx || o.x > W - bx)) {
      if (o.wait > .25) o.wait = .25;                   // 快到邊了：提早換目標
    }
  }

  /* ================================================================
   * 繪製
   * ================================================================ */
  /* 疊層是 fixed（不進文件流、不可能跑版），但鯨魚與飼料的座標是**文件座標**，
     畫的時候才扣掉捲動量。使用者滑動頁面，牠就跟著頁面一起移動；被推出畫面時
     由 step() 的 'return' 模式優先把牠帶回看得到的地方。 */
  function draw() {
    var sc = scrollTop();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hv);

    var i;
    for (i = 0; i < food.length; i++) {                // 小魚
      var f = food[i];
      ctx.save(); ctx.translate(f.x, f.y - sc);
      ctx.rotate(f.rest ? 1.4 : Math.sin(f.t * 3 + f.s) * .5);
      ctx.fillStyle = P.food;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(10, -3.4); ctx.lineTo(10, 3.4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      ctx.globalAlpha = Math.max(0, 1 - b.t / b.life) * .6;
      ctx.strokeStyle = P.bub; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y - sc, b.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawWhale(ctx, sc);
  }

  function loop(ts) {
    if (!alive) return;
    var dt = Math.min((ts - last) / 1000 || 0, .05);
    last = ts;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  /* ================================================================
   * 掛載／拆除
   * ================================================================ */
  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    W = window.innerWidth; Hv = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hv * dpr);
    proportions(Math.max(132, Math.min(232, W * .40)));
    P = palette();
    measure();
    if (!o.x) {
      var sc = scrollTop();
      o.x = W * .68; o.y = sc + Hv * .42; o.tx = W * .25; o.ty = sc + Hv * .55;
    }
    o.x = Math.max(0, Math.min(o.x, W));
  }
  /* 文件高度與飼料的「底」。底要讓開下緣固定列（.sent-mbar 的 z-index 是 40，
     比疊層高，沉在它底下的魚會被蓋住，看起來像憑空消失、鯨魚卻還在追）。
     兩者都會隨著造句列展開／收合而變，所以由 sync() 每 0.6 秒重量一次。 */
  function measure() {
    docH = Math.max(document.documentElement.scrollHeight, Hv);
    var bar = document.getElementById('sentBar');
    floorY = docH - ((bar && bar.offsetParent) ? bar.offsetHeight : 0) - 10;
  }

  function mount() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'orca-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    pickTarget();
    if (reduced) { step(.016); draw(); return; }
    alive = true; last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function unmount() {
    alive = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (canvas) { canvas.remove(); canvas = null; ctx = null; }
    food.length = 0; bubbles.length = 0;
  }

  /* 只在造句設計的首頁：#sentHome 由 js/sentence-nav.js 在首頁插入，
     內頁插的是 #sentTrail。切換設計、退出首頁都會即時反映。 */
  function onHome() {
    return document.documentElement.getAttribute('data-ui') === 'sentence' &&
           !!document.getElementById('sentHome');
  }
  function sync() { if (onHome()) { mount(); measure(); } else unmount(); }

  /* ---- 互動 ----
     疊層是 pointer-events:none，事件一律從 document 收：點到鯨魚做特技，
     點到任何可操作的東西（按鈕、連結、輸入框、造句列的詞塊…）什麼都不做，
     其餘空白處丟一條魚。座標用 clientX/clientY——疊層是 fixed，兩者同一套座標系。 */
  function hitWhale(cx, cy) {
    var S = Math.sin(o.th), a = o.pitch * S;
    var dx = cx - o.x, dy = cy + scrollTop() - o.y;
    var rx = dx * Math.cos(-a) - dy * Math.sin(-a);
    var ry = dx * Math.sin(-a) + dy * Math.cos(-a);
    var ax = D.span * .5 * Math.abs(S) + D.H * 1.4;
    var ay = D.H * 2.2;
    return (rx * rx) / (ax * ax) + (ry * ry) / (ay * ay) <= 1;
  }
  document.addEventListener('click', function (e) {
    if (!canvas || !alive) return;
    var t = e.target;
    if (t.closest && t.closest('button, a, input, select, textarea, label, summary, ' +
                               '[data-act], .sent-chip, .sent-slot, .sent-tok, .sent-hub')) return;
    if (hitWhale(e.clientX, e.clientY)) { startTrick(); return; }
    if (food.length > 14) food.shift();
    food.push({ x: e.clientX, y: e.clientY + scrollTop(),
                vy: 0, t: 0, s: Math.random() * 6, rest: false });
  });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { alive = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (canvas && !reduced && !alive) { alive = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme:dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { P = palette(); });
  }

  function boot() {
    sync();
    try {
      new MutationObserver(sync).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-ui'] });
    } catch (e) { /* 極舊瀏覽器：僅本次載入的狀態有效 */ }
    // #sentHome 由 sentence-nav.js 非同步插入／拆除，這裡輕量地跟著它
    setInterval(sync, 600);
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
