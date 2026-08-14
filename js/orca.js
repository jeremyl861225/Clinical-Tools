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
 * 牠有一個真正的深度座標 z，速度就是體軸方向乘上泳速：偏航因此是一個**連續的
 * 操舵量**，往哪裡去就把頭轉去哪裡。轉身不再是一段腳本動畫，而是操舵的自然結果，
 * 而且會自己走完「完全側 → 側臉 → 正臉 → 另一邊側臉」這一串。z 另外給一個弱透視
 * 縮放（近的大一點），深度才讀得出來；藥丸躺在 z=0 那一面，牠得游到玻璃前才吃得到。
 *
 * 身體是**一張切成四邊形的參數曲面**（u 沿體軸、ψ 繞體軸），逐片投影、逐片用
 * 有向面積剔除背面。身體是凸的，所以背面剔除本身就等於完整的消隱，不必排深度。
 * 腹白不是疊上去的一塊，而是 |ψ| ≤ ψv(u) 的那一圈面片——黑白交界自己會繞著
 * 身體轉，側面、斜四十五度、正臉是同一組公式算出來的，沒有任何一種角度需要特例。
 * 眼斑與鞍斑同樣是貼在曲面上的網格，所以會順著身體包過去，不會壓扁或飄起來。
 *
 * 姿態是三個**真旋轉**：滾轉（繞體軸）→ 俯仰（繞側向軸）→ 偏航（繞垂直軸），
 * 行列式都是 +1，背面剔除的符號規則因此在任何姿態下都成立。
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
  /* 額隆（u<0.09）照**圓帽**取值：h ∝ √(1−(1−u/u0)²)，也就是一個半徑約等於
     體半高的圓弧。先前是 .46 起跳的陡坡，吻端等於一面垂直的牆、後面接一段
     近乎直線的斜面——側面看就是一顆被削平的楔形頭。控制點必須密集鋪在 u<0.09
     這一段，因為額隆的曲率全在那裡；後半身平緩，反而不必。 */
  var PK   = [0, .009, .0225, .045, .0675, .09, .17, .28, .40, .55, .70, .82, .92, 1];
  var PTOP = [.02, .39, .59, .78, .87, .91, .98, 1, .96, .82, .60, .40, .26, .17];
  var PBOT = [.02, .36, .56, .76, .86, .90, .98, 1, .96, .82, .58, .36, .22, .14];
  /* 腹白：下顎一路到肛門，近尾處往上翹一撇（虎鯨側面最好認的一筆） */
  var VK   = [0, .04, .10, .30, .52, .63, .70, .78, .86, 1];
  var VH   = [0, .30, .50, .46, .52, .74, .58, .26, .04, 0];
  /* 側向半寬：胸圍處近乎圓，尾柄側扁 */
  var WK   = [0, .03, .10, .22, .35, .50, .66, .80, .90, 1];
  var WV   = [.40, .58, .72, .80, .78, .66, .48, .30, .20, .13];

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
    D.pecU = .26; D.pecLen = L * .190; D.pecW = L * .086;
    D.span = L + D.flukeLen;
    D.zMax = L * .80;               // 水族箱的深度（前後各這麼多）
    D.foc = L * 8.5;                // 透視焦距：近端放大約 1.14 倍、遠端 0.89 倍
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
  var W = 0, Hv = 0, dpr = 1, floorY = 0, docH = 0, barH = 0;
  var canvas = null, ctx = null, raf = null, last = 0, alive = false;
  var P = null;

  var o = {
    x: 0, y: 0, z: 0,              // 身體中心：x,y 是**文件座標**（捲動時牠跟著頁面走），
                                   // z 是深度（px，正的比較遠），弱透視縮放由它決定
    th: Math.PI / 2,               // 偏航角：+π/2 面向右、−π/2 面向左、0 面向使用者
    thWant: Math.PI / 2, thV: 0,   // 偏航是連續操舵量，不再是兩個值＋腳本轉身
    pitch: 0, pitchWant: 0, pitchV: 0,
    rollA: 0, rollV: 0,            // 滾轉：協調轉彎會自動傾身（繞體軸的真旋轉）
    speed: 40, spdWant: 40,        // 加減速有慣性，速度不會瞬間切換
    phase: 0, thrust: 1, thrustWant: 1, gape: 0, gapeWant: 0,
    gliding: false, beatT: 2.5,    // 衝刺—滑行：虎鯨不會整天勻速擺尾
    pmx: 0, pmy: 0, pmz: 0,        // 上一幀嘴的位置（命中判定用線段而非單點）
    tx: 0, ty: 0, tz: 0, wait: 0, hold: 0, turnCool: 0,
    trick: null,                   // { kind, t, dur }
    mode: 'cruise'
  };
  var food = [];

  /* ---- 色票：跟著 04 造句設計的骨白／墨綠走 ---- */
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    var v = function (n) { return cs.getPropertyValue(n).trim(); };
    var bg = v('--sentence-bg') || '#efece1';
    // 暗色底的亮度判斷：#0a…／#1… 開頭一律當暗底
    var dark = /^#[01]/.test(bg);
    return {
      /* 暗底不能用純黑（會與背景 #0a1512 糊在一起看不出輪廓），取比背景亮一階
         的墨綠黑；亮底則直接壓到接近純黑。 */
      skin:  dark ? '#182420' : '#0d1714',
      belly: dark ? (v('--sentence-fg') || '#ece6d8') : bg,   // 兩邊都是骨白
      ink:   '#0a1512',
      /* 藥丸的五組配色（主色／次色）。暗底用亮一階的色、亮底用暗一階的色，
         兩邊都不會與背景糊在一起。次色用在膠囊的另一半、錠劑的刻痕與軟膠囊
         的反光。 */
      pill: dark
        ? [['#d3a247', '#ece6d8'], ['#79b58e', '#ece6d8'], ['#c9706a', '#ece6d8'],
           ['#ece6d8', '#a99f8c'], ['#cdb894', '#7f7460'], ['#7fa5c4', '#ece6d8'],
           ['#b394c0', '#ece6d8']]
        : [['#a9761a', '#f3eee0'], ['#2b5f45', '#e3ecdf'], ['#8c3f3a', '#f0e2de'],
           ['#3d4744', '#cfc9b8'], ['#6b5a33', '#e2d8bd'], ['#31556f', '#dee6ec'],
           ['#5c3f6b', '#e8dfec']]
    };
  }

  /* ================================================================
   * 幾何 → 畫面：一張真正的 3D 網格
   * ================================================================
   * 先前是「解析側面輪廓 ∪ 逐斷面圓角矩形」的混合作法。兩套幾何各自只在
   * 一種角度是精確的，交界處就出毛病，而且兩個毛病都是它造成的：
   *   · 正臉時解析路徑退化成寬度不到一像素、末端還收成一點的細片
   *     ——畫面上就是從嘴巴往上戳的那根白尖刺；
   *   · 側身時下顎與腹白是**兩次 fill**，共用的那一條邊各自只覆蓋半格像素，
   *     疊起來是 0.75 不是 1，背景就從縫裡透出來——那條垂直的灰線。
   *
   * 現在只有一套幾何。體表當成參數曲面：
   *     u ∈ [0,1] 沿體軸（0 吻端、1 尾柄末端）
   *     ψ ∈ [0,2π) 繞體軸（0 腹中線、π 背中線、(0,π) 是鯨魚的右舷）
   * 每個斷面是橢圓（背側半軸 topH、腹側 botH、側向 halfW）。整片曲面切成
   * 四邊形，投影後**用有向面積的正負剔除背面**，留下的就是真正看得到的那一面
   *（身體是凸的，背面剔除本身就等於完整的消隱）。
   *
   * 腹白不再是「疊上去的一塊」，而是 |ψ| ≤ ψv(u) 的那一圈面片，黑白交界
   * 因此自己會繞著身體轉——側面、斜四十五度、正臉都是同一組公式算出來的，
   * 沒有任何一種角度需要特例。
   *
   * 姿態是三個**真旋轉**：滾轉（繞體軸）→ 俯仰（繞側向軸）→ 偏航（繞垂直軸）。
   * 行列式都是 +1，所以背面剔除的符號規則在任何姿態下都成立。先前的滾轉是
   * scale(1,-1) 的鏡射，那會把符號翻掉。
   */
  var TR = { cr: 1, sr: 0, cp: 1, sp: 0, S: 1, C: 0, ox: 0, oy: 0, k: 1 };
  function setPose(roll, pitch, th, ox, oy, k) {
    TR.cr = Math.cos(roll); TR.sr = Math.sin(roll);
    TR.cp = Math.cos(pitch); TR.sp = Math.sin(pitch);
    TR.S = Math.sin(th); TR.C = Math.cos(th);
    TR.ox = ox; TR.oy = oy; TR.k = k === undefined ? 1 : k;
  }
  /* 弱透視：牠游近一點就大一點。少了這一筆，深度方向的移動在畫面上完全
     看不出來（正投影下朝著你游＝原地不動），三維就白做了。 */
  function persp() { return D.foc / (D.foc + o.z); }
  /* 體座標 →（螢幕 x, 螢幕 y, 深度）。深度大者近。
     投影是仿射的，所以貝茲曲線的控制點可以直接投影後照用（仿射把貝茲映成
     同階的貝茲）——鰭因此不必切網格。 */
  var _q = [0, 0, 0], _q2 = [0, 0, 0];
  function proj(X, Y, Z, out) {
    var y1 = Y * TR.cr - Z * TR.sr, z1 = Y * TR.sr + Z * TR.cr;
    var x2 = X * TR.cp - y1 * TR.sp, y2 = X * TR.sp + y1 * TR.cp;
    out[0] = TR.ox + (x2 * TR.S + z1 * TR.C) * TR.k;
    out[1] = TR.oy + y2 * TR.k;
    out[2] = x2 * TR.C - z1 * TR.S;
    return out;
  }
  /* 體軸座標：X=0 是身體中心（也就是 o.x/o.y 那一點），+X 朝吻端。 */
  function bx(u) { return D.span * .5 - u * D.L; }

  /* 行進波：虎鯨是上下擺尾（背腹向），不是魚那種左右擺。振幅隨 u^1.6 增大——
     頭幾乎不動、力量全在尾柄與尾鰭；頭部保留 0.07 的底噪，完全不動反而僵硬。 */
  function spine(u) {
    return D.amp * (.07 + Math.pow(Math.min(1.35, u), 1.6)) * o.thrust *
           Math.sin(o.phase - u * D.wave * TAU);
  }
  function edgeVent(u) { return spine(u) + botH(u) - ventH(u); }
  /* 嘴角所在的體長座標。u<MU 的那一段腹白就是**下顎**——虎鯨黑白的交界正是嘴線。 */
  var MU = .20;

  /* 圓角矩形（只剩藥丸在用了） */
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

  /* 腹白的邊界落在哪一個 ψ：白帶從腹中線（ψ=0）往兩側包，包到 edgeVent 那個
     高度為止。白帶爬過體軸（ventH > botH）時邊界跑到背側那一半，cos 為負，
     acos 一體處理，不必分支。u=0 與 u=1 兩端 ventH=0，ψv=0，白帶自然收成一點。 */
  function ventPsi(u) {
    var b = botH(u), t = topH(u), y = b - ventH(u);
    var c = y >= 0 ? (b > 1e-6 ? y / b : 1) : (t > 1e-6 ? y / t : -1);
    return Math.acos(c < -1 ? -1 : c > 1 ? 1 : c);
  }

  /* ---- 一個斷面的所有節點 ----
     節點排法刻意讓「白帶邊界」剛好落在格點上（索引 KB 與 KB+1 都是 ψv），
     黑白交界因此是精確的，不會被格點量化成階梯。
     索引 0..KB      ：腹白那一圈（−ψv → +ψv）；u<MU 時這一段就是**下顎**，
                       整片繞嘴角轉開，上下顎之間留下的縫是真的透空。
     索引 KB+1..KN−1 ：暗色那一圈（+ψv → 2π−ψv），不跟著下顎轉。
     兩圈之間那一格（KB → KB+1）不畫，那正是嘴。 */
  var KB = 6, KD = 12, KN = KB + KD + 2;
  var NA = new Float64Array(KN * 2), NB = new Float64Array(KN * 2);
  var JX = 0, JY = 0, JC = 1, JS = 0;
  function station(u, arr, jaw) {
    if (u >= MU) jaw = 0;             // 只有嘴角前面那一段是下顎，後面的腹白不動
    var sp = spine(u), t = topH(u), b = botH(u), w = halfW(u), X0 = bx(u);
    var pv = ventPsi(u), k, ps, cs, sn, Y, Z, X, dx, dy;
    for (k = 0; k < KN; k++) {
      ps = k <= KB ? pv * (2 * k / KB - 1)
                   : pv + (TAU - 2 * pv) * (k - KB - 1) / KD;
      cs = Math.cos(ps); sn = Math.sin(ps);
      Y = sp + (cs >= 0 ? b : t) * cs;
      Z = w * sn;
      X = X0;
      if (jaw && k <= KB) {
        dx = X - JX; dy = Y - JY;
        X = JX + dx * JC - dy * JS; Y = JY + dx * JS + dy * JC;
      }
      proj(X, Y, Z, _q);
      arr[k * 2] = _q[0]; arr[k * 2 + 1] = _q[1];
    }
  }
  /* 把兩個斷面之間 [k0,k1) 的四邊形加進**目前這條 path**。
     有向面積 ≤ 0 就是背面（或退化），直接跳過。
     一條帶的所有面片一定要收進同一條 path 一次 fill：同一條 path 內部相鄰的
     子路徑不會產生抗鋸齒接縫（光柵器一次算完整條路徑的覆蓋率），拆成多次
     fill 才會——那就是先前那條垂直灰線的成因。 */
  function bandQuads(g, A, B, k0, k1) {
    var k, x0, y0, x1, y1, x2, y2, x3, y3, ar, any = false;
    for (k = k0; k < k1; k++) {
      x0 = A[k * 2];     y0 = A[k * 2 + 1];
      x1 = A[k * 2 + 2]; y1 = A[k * 2 + 3];
      x2 = B[k * 2 + 2]; y2 = B[k * 2 + 3];
      x3 = B[k * 2];     y3 = B[k * 2 + 1];
      ar = (x0 * y1 - x1 * y0) + (x1 * y2 - x2 * y1) +
           (x2 * y3 - x3 * y2) + (x3 * y0 - x0 * y3);
      if (ar <= .03) continue;
      g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3);
      g.closePath(); any = true;
    }
    return any;
  }

  /* ---- 貼在體表上的斑塊（眼斑、鞍斑）----
     一樣切成網格、一樣逐片背面剔除，所以斑塊會**沿著身體的曲面包過去**，
     轉到哪個角度都不會壓扁或飄在身體外面；跨過輪廓線的那一半自己就被剔掉了。
     (uc,pc) 是斑塊中心、(ru,rp) 是兩個半徑、sk 是往體後上方的傾斜量。 */
  var PAT = new Float64Array(4 * 16 * 2);
  function surfPt(u, ps, out) {
    var sp = spine(u), cs = Math.cos(ps);
    return proj(bx(u), sp + (cs >= 0 ? botH(u) : topH(u)) * cs,
                halfW(u) * Math.sin(ps), out);
  }
  function patchMesh(g, uc, ru, pc, rp, sk) {
    var NR = 3, NT = 16, i, j, j2, r, a, ca, sa, any = false, base;
    for (i = 0; i <= NR; i++) {
      r = i / NR;
      for (j = 0; j < NT; j++) {
        a = TAU * j / NT; ca = Math.cos(a); sa = Math.sin(a);
        surfPt(uc + ru * r * ca, pc + rp * r * sa + sk * r * ca, _q);
        base = (i * NT + j) * 2;
        PAT[base] = _q[0]; PAT[base + 1] = _q[1];
      }
    }
    for (i = 0; i < NR; i++) {
      for (j = 0; j < NT; j++) {
        j2 = (j + 1) % NT;
        var a0 = (i * NT + j) * 2, a1 = (i * NT + j2) * 2,
            b1 = ((i + 1) * NT + j2) * 2, b0 = ((i + 1) * NT + j) * 2;
        var x0 = PAT[a0], y0 = PAT[a0 + 1], x1 = PAT[a1], y1 = PAT[a1 + 1],
            x2 = PAT[b1], y2 = PAT[b1 + 1], x3 = PAT[b0], y3 = PAT[b0 + 1];
        var ar = (x0 * y1 - x1 * y0) + (x1 * y2 - x2 * y1) +
                 (x2 * y3 - x3 * y2) + (x3 * y0 - x0 * y3);
        if (ar <= .02) continue;
        g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3);
        g.closePath(); any = true;
      }
    }
    return any;
  }

  /* ---- 有厚度的板子：背鰭、胸鰭、尾鰭都走這一支 ----
     正反兩面各一圈輪廓，再加上把兩圈接起來的側帶，全部收進同一條 path。
     兩件事都不能省：
       · 三種子路徑**強制成同一個繞向**——繞向不一致時 nonzero 會讓重疊處
         互相抵消，畫面上是被挖空的鰭；
       · 一定要有側帶——板子快要與視線平行時（背鰭轉到正臉那一刻）正反兩圈
         在畫面上分得開，少了側帶，中間那條縫就裂成兩根天線。 */
  var PPX = new Float64Array(64), PPY = new Float64Array(64),
      QPX = new Float64Array(64), QPY = new Float64Array(64),
      BX = new Float64Array(64), BY = new Float64Array(64),
      BZ = new Float64Array(64), BT = new Float64Array(64);
  function poly4(g, x0, y0, x1, y1, x2, y2, x3, y3) {
    var ar = (x0 * y1 - x1 * y0) + (x1 * y2 - x2 * y1) +
             (x2 * y3 - x3 * y2) + (x3 * y0 - x0 * y3);
    if (ar > -.02 && ar < .02) return;
    g.moveTo(x0, y0);
    if (ar > 0) { g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); }
    else { g.lineTo(x3, y3); g.lineTo(x2, y2); g.lineTo(x1, y1); }
    g.closePath();
  }
  function loopPath(g, X, Y, n) {
    var i, j, ar = 0;
    for (i = 0; i < n; i++) { j = (i + 1) % n; ar += X[i] * Y[j] - X[j] * Y[i]; }
    if (ar >= 0) {
      g.moveTo(X[0], Y[0]);
      for (i = 1; i < n; i++) g.lineTo(X[i], Y[i]);
    } else {
      g.moveTo(X[n - 1], Y[n - 1]);
      for (i = n - 2; i >= 0; i--) g.lineTo(X[i], Y[i]);
    }
    g.closePath();
  }
  function plate(g, n, nx, ny, nz) {
    var i, j, t;
    for (i = 0; i < n; i++) {
      t = BT[i];
      proj(BX[i] - nx * t, BY[i] - ny * t, BZ[i] - nz * t, _q);
      PPX[i] = _q[0]; PPY[i] = _q[1];
      proj(BX[i] + nx * t, BY[i] + ny * t, BZ[i] + nz * t, _q);
      QPX[i] = _q[0]; QPY[i] = _q[1];
    }
    loopPath(g, PPX, PPY, n);
    loopPath(g, QPX, QPY, n);
    for (i = 0; i < n; i++) {
      j = (i + 1) % n;
      poly4(g, PPX[i], PPY[i], PPX[j], PPY[j], QPX[j], QPY[j], QPX[i], QPY[i]);
    }
  }
  function qbez(p0, p1, p2, t) {
    var m = 1 - t;
    return m * m * p0 + 2 * m * t * p1 + t * t * p2;
  }

  /* 背鰭：矢狀面上一片後掠的鐮刀。厚度從基部線性收到鰭尖的 0。 */
  var FN = 20;
  function dorsalFin(g) {
    var u = D.dorU, X0 = bx(u), Y0 = spine(u) - topH(u) + 2;
    var th = D.dorW * .20, i, t, n = FN >> 1;
    var aX = X0 + D.dorW * .50, aY = Y0;
    var cX = X0 + D.dorW * .14, cY = Y0 - D.dorH * .99;
    var tX = X0 - D.dorSweep,   tY = Y0 - D.dorH;
    var dX = X0 - D.dorW * .26, dY = Y0 - D.dorH * .30;
    var eX = X0 - D.dorW * .50, eY = Y0 + 1;
    for (i = 0; i < FN; i++) {
      if (i < n) { t = i / (n - 1); BX[i] = qbez(aX, cX, tX, t); BY[i] = qbez(aY, cY, tY, t); }
      else { t = (i - n + 1) / n; BX[i] = qbez(tX, dX, eX, t); BY[i] = qbez(tY, dY, eY, t); }
      BZ[i] = 0;
      BT[i] = th * Math.max(0, 1 - (Y0 - BY[i]) / D.dorH);
    }
    g.beginPath(); plate(g, FN, 0, 0, 1);
  }

  /* 胸鰭：真的長在體側 Z=±hw 上、往後下外方伸出去的一片槳。因為是 3D 的，
     正臉時兩片會朝左右張開（先前是硬用 cosθ 湊出來的），側面時收成斜槳。
     厚度沿板面的法線，所以完全側過去時它會收成一條細長條而不是一根髮絲。 */
  function pecAxis(side, out) {
    var u = D.pecU, w = halfW(u);
    out[0] = -D.pecLen * .68; out[1] = D.pecLen * .46;
    out[2] = (w * .02 + D.pecLen * .62) * side;
    return out;
  }
  var _ax = [0, 0, 0];
  function pecTip(side, out) {
    var u = D.pecU, w = halfW(u);
    pecAxis(side, _ax);
    return proj(bx(u) + _ax[0], spine(u) + botH(u) * .40 + _ax[1],
                w * .98 * side + _ax[2], out);
  }
  function pecFin(g, side) {
    var u = D.pecU, w = halfW(u), N = 12, i, a, tp, c;
    var bX = bx(u), bY = spine(u) + botH(u) * .40, bZ = w * .98 * side;
    pecAxis(side, _ax);
    // 板面法線＝弦向(1,0,0) × 鰭軸
    var nx = 0 * _ax[2] - 0 * _ax[1], ny = 0 * _ax[0] - 1 * _ax[2], nz = 1 * _ax[1] - 0 * _ax[0];
    var nm = Math.hypot(nx, ny, nz) || 1;
    nx /= nm; ny /= nm; nz /= nm;
    var th = D.pecW * .17;
    for (i = 0; i <= N; i++) {                       // 前緣：基部 → 鰭尖
      a = i / N;
      tp = Math.sqrt(Math.max(0, 1 - Math.pow(a, 5)));
      c = D.pecW * (.58 + .10 * a) * tp;
      BX[i] = bX + _ax[0] * a + c; BY[i] = bY + _ax[1] * a; BZ[i] = bZ + _ax[2] * a;
      BT[i] = th * tp;
    }
    for (i = 0; i <= N; i++) {                       // 後緣：鰭尖 → 基部
      a = (N - i) / N;
      tp = Math.sqrt(Math.max(0, 1 - Math.pow(a, 5)));
      c = D.pecW * (1.04 - .76 * a * a) * tp;
      BX[N + 1 + i] = bX + _ax[0] * a - c;
      BY[N + 1 + i] = bY + _ax[1] * a;
      BZ[N + 1 + i] = bZ + _ax[2] * a;
      BT[N + 1 + i] = th * tp;
    }
    g.beginPath(); plate(g, 2 * N + 2, nx, ny, nz);
  }

  /* 尾鰭：橫向的一片板子。純側面時它其實只投影成一條線，真要那樣畫就沒有
     尾巴了，所以給它一個隨「板面正對程度」消長的假二面角：邊緣朝我們時兩葉
     張成新月，板面朝我們時攤平成橫板。這是全身唯一一處刻意的說謊。 */
  function flukeEdge() {
    var y1 = -TR.sr, z1 = TR.cr;
    var x2 = -y1 * TR.sp, y2 = y1 * TR.cp;
    var sx = x2 * TR.S + z1 * TR.C, sy = y2;
    var m = Math.min(1, Math.hypot(sx, sy));
    /* 不用 1−m 而用 1−m^1.7：直線衰減在斜四十五度就只剩三成，尾鰭變成一道
       貼在尾柄後面的刮痕；這條曲線讓它在中間角度仍留得住新月的形狀。
       另外保留 0.12 的底：真的尾鰭本來就有一點上翹，不會完全是一片平板。 */
    return .12 + .88 * (1 - Math.pow(m, 1.7));
  }
  function flukeFin(g) {
    var lift = flukeEdge(), N = 8, i, w, aw, X0 = bx(1), n = 0;
    var th = D.flukeH * .085;
    for (i = 0; i <= 2 * N; i++, n++) {              // 後緣：右翼尖 → 中央凹口 → 左翼尖
      w = 1 - i / N; aw = Math.abs(w);
      BX[n] = X0 - D.flukeLen * (.26 + .74 * aw);
      BY[n] = spine(1 + .22 * aw) + w * D.flukeH * .86 * lift;
      BZ[n] = w * D.flukeH;
      BT[n] = th * (1 - .7 * aw);
    }
    for (i = 0; i <= 2 * N; i++, n++) {              // 前緣折回
      w = -1 + i / N; aw = Math.abs(w);
      BX[n] = X0 - D.flukeLen * .34 * aw;
      BY[n] = spine(1 + .14 * aw) + w * D.flukeH * .66 * lift;
      BZ[n] = w * D.flukeH * .88;
      BT[n] = th * (1 - .7 * aw);
    }
    g.beginPath(); plate(g, n, 0, 1, 0);
  }

  /* ================================================================
   * 一幀
   * ================================================================ */
  var NS = 28;                                  // 斷面帶數
  function bandU(t) { return Math.pow(t, 1.7); } // 樣點往吻端集中（額隆的曲率全在那裡）
  function bandOf(u) {
    return Math.max(0, Math.min(NS - 1, Math.round(Math.pow(u, 1 / 1.7) * NS)));
  }
  var iDor = 0, iPec = 0;
  function drawWhale(g, sc) {
    setPose(o.rollA, o.pitch, o.th, o.x, o.y - (sc || 0), persp());

    var ja = o.gape * .62;
    JX = bx(MU); JY = edgeVent(MU); JC = Math.cos(ja); JS = Math.sin(ja);
    iDor = bandOf(D.dorU); iPec = bandOf(D.pecU);

    var dHead = proj(bx(0), spine(0), 0, _q)[2];
    var dTail = proj(bx(1), spine(1), 0, _q)[2];
    var headNear = dHead >= dTail;
    // 哪一側胸鰭在遠端：直接比深度，不再靠 sinθ 的正負去猜
    var dR = pecTip(1, _q)[2], dL = pecTip(-1, _q2)[2];
    var farSide = dR <= dL ? 1 : -1;

    /* 帶與帶之間沿 u 各外擴 eu（螢幕上約 0.7 px）。兩條同色的帶若剛好相接，
       共用的那一欄像素兩次各覆蓋一半、疊起來只有 75%，背景就從縫裡透出來，
       整條身體會被梳成一排規律的直線。重疊掉就沒有這回事。 */
    var eu = .7 / Math.max(1, D.L * Math.abs(TR.cp * TR.S));
    var s, i, uA, uB, e;

    if (headNear) { g.beginPath(); flukeFin(g); g.fillStyle = P.skin; g.fill(); }
    for (s = 0; s < NS; s++) {
      i = headNear ? NS - 1 - s : s;
      uA = bandU(i / NS); uB = bandU((i + 1) / NS);
      e = Math.min(eu, (uB - uA) * .4);

      if (i === iPec) {                       // 遠側胸鰭在身體之後
        g.beginPath(); pecFin(g, farSide); g.fillStyle = P.skin; g.fill();
      }
      station(Math.max(0, uA - e), NA, ja);
      station(Math.min(1, uB + e), NB, ja);
      /* 暗色先鋪滿整圈（含腹白那一段），白色再蓋上去。這樣黑白交界只有
         白色那一次填的抗鋸齒，是正確的邊；分兩塊各填一次才會留下灰縫。 */
      g.beginPath();
      var q1 = bandQuads(g, NA, NB, 0, KB);
      var q2 = bandQuads(g, NA, NB, KB + 1, KB + 1 + KD);
      if (q1 || q2) { g.fillStyle = P.skin; g.fill(); }
      if (q1) {
        g.beginPath(); bandQuads(g, NA, NB, 0, KB);
        g.fillStyle = P.belly; g.fill();
      }

      if (i === iDor) { g.beginPath(); dorsalFin(g); g.fillStyle = P.skin; g.fill(); }
      if (i === iPec) {
        g.beginPath(); pecFin(g, -farSide); g.fillStyle = P.skin; g.fill();
      }
    }
    /* 斑塊畫在**所有斷面帶之後**，不能插在自己那一條帶旁邊：身體是凸的，
       背面剔除已經保證留下來的斑塊面片一定看得見，不會被身體擋住；但斷面帶
       是一條一條蓋過去的，插在中間的話後面那幾條帶會把斑塊切掉一半——側身時
       鞍斑就只剩背鰭後面一小塊，像背上被咬了一口。 */
    g.beginPath();
    if (patchMesh(g, .63, .115, Math.PI, 1.05, 0)) { g.fillStyle = P.belly; g.fill(); }
    g.beginPath();
    var e1 = patchMesh(g, .135, .076, 2.03, .26, .020);
    var e2 = patchMesh(g, .135, .076, -2.03, .26, -.020);
    if (e1 || e2) { g.fillStyle = P.belly; g.fill(); }
    if (!headNear) { g.beginPath(); flukeFin(g); g.fillStyle = P.skin; g.fill(); }
  }

  /* 把身上任一點（體長座標 u、偏離體軸 off）換算成**文件座標**。
     走的是與 drawWhale 完全相同的那一串旋轉，餵食判定才會與畫面一致。 */
  function bodyPoint(u, off) {
    setPose(o.rollA, o.pitch, o.th, o.x, o.y, persp());
    proj(bx(u), spine(u) + off, 0, _q2);
    return { x: _q2[0], y: _q2[1], z: o.z + _q2[2] };
  }
  function snout() { return bodyPoint(0, 0); }
  /* 嘴的位置：吻端與嘴角的中間、貼在嘴線上。飼料要碰到**這一點**才算吃到，
     不是碰到吻端前方一大圈就消失（那看起來就是隔空吸魚）。 */
  function mouth() { return bodyPoint(.09, botH(.09) * .55); }
  /* 中心到嘴沿著體軸的距離：操舵時把目標往後退這麼多，落點才會剛好是**嘴**，
     不是吻尖前方。 */
  function reach() { return D.span / 2 - D.L * .09; }

  var CHASE_SPD = 172;              // 追餌泳速

  /* ---- 攔截預測 ----
     追「飼料現在的位置」等於永遠追著它的殘影：魚一直在下沉，等牠游到，魚
     已經又低了一截，於是變成一路吊在魚後面斜著追。這裡解真正的攔截問題——
         |r + u·t| = s·t
     r 是嘴到魚的向量、u 是魚的速度、s 是自己的泳速，展開就是一條二次式；
     取最小的正根當交會時間，魚在那個時刻會在哪裡，就往哪裡游。
     魚落到底之後不再移動，所以預測點的 y 夾在 floorY 之內。 */
  function intercept(f) {
    var mp = mouth();
    var vy = f.rest ? 0 : f.vy;
    var vx = f.rest ? 0 : Math.sin(f.t * 2.4 + f.s) * 9;
    // 藥丸永遠在 z=0 那一面，所以深度差整段算進「還要游多遠」裡
    var rx = f.x - mp.x, ry = f.y - mp.y, rz = -mp.z;
    var sp = Math.max(120, (o.speed + CHASE_SPD) / 2);   // 用當下速度會把交會點估得太遠
    var a = vx * vx + vy * vy - sp * sp;
    var b = 2 * (rx * vx + ry * vy);
    var c = rx * rx + ry * ry + rz * rz;
    var t = 0, disc = b * b - 4 * a * c;
    if (a !== 0 && disc >= 0) {
      var q = Math.sqrt(disc);
      var t1 = (-b + q) / (2 * a), t2 = (-b - q) / (2 * a);
      var best = Math.min(t1 > 0 ? t1 : 1e9, t2 > 0 ? t2 : 1e9);
      if (best < 1e9) t = Math.min(best, 5);
    }
    return { x: f.x + vx * t, y: Math.min(floorY, f.y + vy * t) };
  }
  /* 點到線段的距離（命中判定用，避免高速掉幀時直接穿過飼料）。
     三維版把深度方向的權重壓到 0.22。理由是**深度在畫面上幾乎看不出來**：
     整個透視縮放只有 1.13 倍，深度的唯一線索是誰蓋住誰。實測 200 次追餌裡，
     脫靶的每一次都是「嘴在螢幕上已經壓在藥丸上（誤差 3 px），深度卻差 63 px」
     ——那一格畫面看起來就是咬到了卻沒反應，比放寬判定更難接受。 */
  function segDist(px, py, ax, ay, bx1, by1) {
    var dx = bx1 - ax, dy = by1 - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  var ZW = .22;
  function segDist3(px, py, pz, ax, ay, az, bx1, by1, bz1) {
    var dx = bx1 - ax, dy = by1 - ay, dz = (bz1 - az) * ZW;
    var ex = px - ax, ey = py - ay, ez = (pz - az) * ZW;
    var l2 = dx * dx + dy * dy + dz * dz;
    var t = l2 ? (ex * dx + ey * dy + ez * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(ex - dx * t, ey - dy * t, ez - dz * t);
  }

  /* ================================================================
   * 行為
   * ================================================================ */
  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  /* 巡游目標：文件座標 ＋ 一個深度。挑法有三件事：
     · 只在「現在看得到的那一帶」裡挑，捲到哪裡牠就在哪裡巡；
     · 水平方向優先挑在**現在頭朝的那一側**，牠因此會一路游過整個畫面寬度；
     · 深度只在現在的深度附近挑（±0.75 個水族箱）。一次跨越整個深度的話，牠會有
       很長一段時間幾乎正對鏡頭——畫面上幾乎不動、又看不出是什麼，那不好看。
     邊界只留約 1/4 身長與 2.5 倍體高的餘裕，那不是牆（飼料丟在角落照樣游過去、
     身子探出畫外一截，見 step() 結尾的夾限），只是不會自己挑一個必然半身出畫的點。 */
  function pickTarget() {
    var top = scrollTop(), face = Math.sin(o.th) >= 0 ? 1 : -1;
    var mx = Math.min(D.span * .28, W * .3), my = Math.min(D.H * 2.5, Hv * .28);
    var room = face > 0 ? (W - mx - o.x) : (o.x - mx);
    var band = Math.max(20, Hv - my * 2);
    if (room > W * .20) {                       // 前面還有空間：一路往前
      o.tx = o.x + face * room * (.45 + .55 * Math.random());
      o.ty = top + my + Math.random() * band;
    } else if (o.turnCool > 0) {
      /* 前面沒空間了，但還不到該掉頭的時候：改成沿著這一側走一段**垂直**的行程。
         垂直移動靠俯仰就夠、不必掉頭——「不要一直頻繁轉身」與「整個畫面都巡得到」
         這兩件事因此可以同時成立。少了這一條，牠一到邊就掉頭，實測每分鐘掉頭
         18.6 次（每 3.2 秒一次），畫面上就是一條一直在翻來覆去的鯨魚。 */
      o.tx = o.x + face * Math.max(12, room);
      o.ty = o.y - top < Hv * .5
             ? top + my + band * (.55 + .45 * Math.random())
             : top + my + band * .45 * Math.random();
      o.wait = .1;
    } else {                                    // 真的該掉頭了
      o.tx = face > 0 ? mx + Math.random() * Math.max(20, o.x - mx)
                      : o.x + Math.random() * Math.max(20, W - mx - o.x);
      o.ty = top + my + Math.random() * band;
      o.turnCool = 8;
    }
    /* 深度只有四成的機會換新的，而且步幅只有半個水族箱：每換一個目標就換一次
       深度的話，牠有很長一段時間幾乎正對鏡頭——畫面上幾乎不動、又看不出是什麼。
       實測那樣的偏航分布是平的（每個角度各佔八分之一），完全側面反而變少了。 */
    if (Math.random() < .32) {
      o.tz = Math.max(-D.zMax * .8, Math.min(D.zMax * .8,
               o.z + (Math.random() - .5) * D.zMax));
    }
    /* 到點之後的停頓要短：停頓期間牠不再修正方向，只是直直漂——停太久就變成
       「游一段、停一段、再轉一段」，動作的段落感就是這樣來的。 */
    o.wait = .15 + Math.random() * .9;
  }

  function startTrick() {
    var r = Math.random();
    var kind = r < .3 ? 'spin' : r < .58 ? 'roll' : r < .84 ? 'loop' : 'slap';
    o.trick = { kind: kind, t: 0, dur: kind === 'loop' ? 1.5 : kind === 'slap' ? 1.4 : 1.1,
                th0: o.th };
  }

  function step(dt) {
    /* 擺尾頻率跟著速度走（滑行時尾巴幾乎不動），這是牠看起來像在「用力」
       還是「順水漂」的差別。 */
    o.phase += dt * (2.0 + 6.4 * o.speed / 60) *
               (o.trick && o.trick.kind === 'slap' ? 2.4 : 1);

    var i, f;
    floorY = foodFloor();
    /* 飼料：自由落下、中途沒有任何平台擋著。沉降速度刻意壓在 52 px/s——
       追餌的泳速是它的三倍以上，所以無論丟在哪裡，牠一定追得上；
       落到底就躺著等（不會沉出畫外消失）。 */
    for (i = food.length - 1; i >= 0; i--) {
      f = food[i]; f.t += dt;
      if (f.rest && f.y < floorY - 2) f.rest = false;   // 使用者往下捲：底變低了，繼續沉
      if (!f.rest) {
        f.vy = Math.min(52, f.vy + dt * 90);
        f.y += f.vy * dt;
        f.x += Math.sin(f.t * 2.4 + f.s) * 9 * dt;
        if (f.y >= floorY) {
          f.y = floorY; f.rest = true;
          // 躺平：就近取 0 或 π，不要在地上繼續打轉
          f.settle = Math.round((f.spin + f.t * f.rot) / Math.PI) * Math.PI;
        }
      }
    }

    var rollWant = 0;
    /* ---- 特技 ---- */
    if (o.trick) {
      var tr = o.trick; tr.t += dt;
      var k = Math.min(1, tr.t / tr.dur);
      o.thV = 0; o.rollV = 0;
      if (tr.kind === 'spin') {                        // 原地水平轉一圈
        o.th = tr.th0 + TAU * k;
        o.thrust = o.thrustWant = 1.4;
      } else if (tr.kind === 'roll') {                 // 桶滾：繞體軸滾一整圈
        rollWant = o.rollA = TAU * k;
        o.thrust = o.thrustWant = 1.5;
      } else if (tr.kind === 'loop') {                 // 垂直繞一圈
        o.pitch = TAU * k;
        o.thrust = o.thrustWant = 1.6;
      } else {                                         // 拍尾
        o.thrust = o.thrustWant = 2.6;
      }
      if (k >= 1) {
        o.trick = null; o.thrust = o.thrustWant = 1;
        o.rollA = 0; o.pitch = 0; o.pitchWant = 0; o.pitchV = 0;
        o.thWant = o.th; o.thV = 0;
        pickTarget();
      }
    } else {
      var top = scrollTop();

      /* 被使用者捲出畫面 → 什麼都先放下，游回看得到的地方 */
      var pad = food.length ? Hv * .35 : Hv * .10;      // 正在追餌時容忍多一點
      var outUp = o.y < top - pad, outDn = o.y > top + Hv + pad;
      var target = null;
      if (outUp || outDn) {
        o.mode = 'return';
        o.tx = Math.max(D.span * .3, Math.min(W - D.span * .3, o.x));
        o.ty = outUp ? top + Hv * .30 : top + Hv * .70;
        o.tz = 0;
        o.wait = .2;
      } else {
        var bd = 1e9, mp0 = mouth();
        for (i = 0; i < food.length; i++) {
          var d = Math.hypot(food[i].x - o.x, food[i].y - o.y, o.z);
          if (d < bd) { bd = d; target = food[i]; }
        }
        if (target) {
          o.mode = 'chase';
          var pt = intercept(target);                  // 預測攔截點，不是追現在位置
          o.tx = pt.x; o.ty = pt.y; o.tz = 0;          // 藥丸落在 z=0 那一面，牠得游到玻璃前
          /* 命中判定走「上一幀的嘴 → 這一幀的嘴」這一段線段，不是單看當前點：
             追餌泳速 172 px/s，掉幀時一步可以走十幾 px，只比對端點會從藥丸身上
             穿過去卻判定沒吃到，畫面上就是「明明咬到了卻沒反應」。
             深度方向的權重見 segDist3。 */
          var md = segDist3(target.x, target.y, 0,
                            o.pmx, o.pmy, o.pmz, mp0.x, mp0.y, mp0.z);
          if (md < D.H * 1.0) {                        // 真的碰到嘴了才吞
            food.splice(food.indexOf(target), 1);
            o.gape = 1; o.gapeWant = 0;                // 合起來＝咬下去
          } else if (md < D.L * .55) {
            o.gapeWant = Math.min(1, (D.L * .55 - md) / (D.L * .38));
          } else o.gapeWant = 0;
        } else if (o.mode !== 'cruise') { o.mode = 'cruise'; o.hold = 0; pickTarget(); }
      }

      /* ---- 操舵：三維純追蹤（pure pursuit），誤差從**身體中心**量 ----
         不可以用吻端：吻端的位置本身就是姿態算出來的（吻端 = 中心 + 體軸×半身長），
         拿它去算誤差等於接成「姿態 → 吻端 → 誤差 → 姿態」一個沒有阻尼的閉迴路，
         愈靠近目標增益愈大，於是追到嘴邊那一刻抖得最兇。正解是把目標沿著現在的
         體軸往後退半個身長當成「中心要去的點」，中心的位置與姿態無關，迴路就斷了。 */
      var cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
      var fX = cp * Math.sin(o.th), fY = sp, fZ = cp * Math.cos(o.th);
      var ex = o.tx - o.x, ey = o.ty - o.y, ez = o.tz - o.z;
      var tDist = Math.hypot(ex, ey, ez);
      var chasing = o.mode === 'chase';
      /* 後退量：**只有追餌才要**，而且固定就是「中心到嘴」那一段。
         · 追餌要退：目標是「嘴要去的地方」。曾經試過隨距離收掉，那會把身體中心
           開到藥丸上、嘴還在半個身長之外，實測 25% 脫靶，每一次姿態都一樣。
         · 巡游不能退：巡游的目標只是一個航路點，退了之後，人一旦比那半個身長還
           近，瞄準點就落到身後，牠只好一直繞——實測巡游時偏航幾乎全程貼著角速度
           上限（每 0.5 秒轉 48°），畫面上就是一條不停打轉的鯨魚。 */
      var rch = chasing ? reach() : 0;
      var dx = ex - fX * rch, dy = ey - fY * rch, dz = ez - fZ * rch;
      var horiz = Math.hypot(dx, dz), aimD = Math.hypot(horiz, dy);

      /* 增益隨距離連續淡出，不用硬性死區：死區會讓修正突然斷掉再突然接上，
         動作看起來就一段一段的；而且追餌時最後那一小段不修正，藥丸還在沉，
         滑過去的 0.3 秒就掉了十幾 px——剛好夠讓牠咬空。 */
      var gain = Math.min(1, aimD / (D.span * (chasing ? .10 : .45)));

      /* 「到了沒」一律用**操舵誤差本身**判定，不要另外量吻端到目標的距離：
         純追蹤的瞄準點會隨著姿態移動，用別的量去判定，會出現「誤差已經收斂、
         判定卻永遠不成立」的情形——牠就繞著目標一直轉圈。實測那時偏航的分布
         是平的、每分鐘換邊 32 次，畫面上就是一條在原地打轉的鯨魚。
         另外加一個 14 秒的逾時，任何沒收斂的情況都會被打斷。 */
      if (!chasing && o.mode === 'cruise') {
        o.hold += dt;
        if (aimD < D.span * .40) {
          o.wait -= dt;
          if (o.wait <= 0) { o.hold = 0; pickTarget(); }
        }
        if (o.hold > 14) { o.hold = 0; pickTarget(); }
      }

      /* 偏航：目標的水平方位。角度會繞圈，所以每一幀由**現在的 th 加上最短
         角差**得到一個連續的 thWant，二階濾波器因此永遠不會在 ±π 的接縫上甩頭
         ——先前那套「±2π 等價角挑最近的」會在夾限處鎖死，整個問題在這裡消失了，
         因為偏航沒有夾限，任何方向都轉得到。 */
      var dth = Math.atan2(dx, dz) - o.th;
      dth -= TAU * Math.round(dth / TAU);
      o.thWant = o.th + dth * gain;

      /* 俯仰：目標的仰角。有了自由偏航，俯仰再也不必超過 ±75°。 */
      var pmax = chasing ? 1.55 : 1.00;
      var pT = Math.atan2(dy, Math.max(horiz, D.H * .6));
      pT = Math.max(-pmax, Math.min(pmax, pT));
      o.pitchWant += (pT - o.pitchWant) *
                     Math.min(1, dt / (chasing ? .06 : .14)) * gain;

      /* 協調轉彎：偏航角速度愈大、身體往轉彎內側傾得愈多。這一筆是立體感的
         主要來源——牠不再是平貼著螢幕滑，而是真的傾身繞彎。俯仰很陡時收掉，
         不然頭朝下又側傾會像失控。 */
      rollWant = Math.max(-.9, Math.min(.9, o.thV * .40)) * cp * cp;

      /* 衝刺—滑行：野生虎鯨巡游時是「擺幾下、然後收尾滑一段」，不是整天
         勻速踩踏板。滑行段擺尾振幅收到兩成、速度掉一半，看起來才是在省力。 */
      o.beatT -= dt;
      if (o.beatT <= 0) {
        o.gliding = !o.gliding;
        o.beatT = o.gliding ? 1.6 + Math.random() * 2.4 : 3.2 + Math.random() * 3.4;
      }
      /* 追到最後一段要**減速**。等速全力衝的話，轉彎半徑（泳速÷最大角速度）
         比撲擊距離還大，牠就繞著藥丸打轉、永遠差那麼一點——實測脫靶 18.5%。
         真的掠食者也是這樣：衝過去、到跟前收力氣、再咬。 */
      if (chasing) {
        o.gliding = false;
        o.spdWant = CHASE_SPD * (.40 + .60 * Math.min(1, tDist / (D.span * .95)));
        o.thrustWant = 1.6;
      }
      else if (o.mode === 'return') { o.gliding = false; o.spdWant = 132; o.thrustWant = 1.45; }
      else if (o.gliding) { o.spdWant = 34; o.thrustWant = .40; }
      else { o.spdWant = 54; o.thrustWant = 1; }
    }

    if (o.turnCool > 0) o.turnCool -= dt;
    if (!food.length || o.trick) o.gapeWant = 0;
    o.gape += Math.max(-dt * 2.6, Math.min(dt * 3.4, o.gapeWant - o.gape));
    if (o.gape < .004) o.gape = 0;

    /* ---- 三個姿態角一律走**臨界阻尼二階濾波** ----
       速率上限的動態是「等速轉到定位、然後突然停住」——加速度是兩個階躍，
       眼睛看到的就是一段一段的動作。臨界阻尼（ζ=1）則是加速度連續、無過衝。
       自然頻率 ω 就是跟隨速度（時間常數約 1/ω）。偏航另外壓一個角速度上限，
       那是「這隻動物轉得多快」的物理限制，不是為了平滑。 */
    if (!o.trick) {
      var wY = o.mode === 'chase' ? 4.3 : 2.1;
      o.thV += (wY * wY * (o.thWant - o.th) - 2 * wY * o.thV) * dt;
      var ymax = o.mode === 'chase' ? 3.9 : 1.7;
      if (o.thV > ymax) o.thV = ymax; else if (o.thV < -ymax) o.thV = -ymax;
      o.th += o.thV * dt;
      if (o.th > Math.PI) o.th -= TAU; else if (o.th < -Math.PI) o.th += TAU;
    }
    if (!(o.trick && o.trick.kind === 'loop')) {
      var wP = o.mode === 'chase' ? 6.5 : 3.2;
      o.pitchV += (wP * wP * (o.pitchWant - o.pitch) - 2 * wP * o.pitchV) * dt;
      o.pitch += o.pitchV * dt;
    } else o.pitchV = 0;
    if (!(o.trick && o.trick.kind === 'roll')) {
      var wR = 2.6;
      o.rollV += (wR * wR * (rollWant - o.rollA) - 2 * wR * o.rollV) * dt;
      o.rollA += o.rollV * dt;
    }

    if (o.trick) o.spdWant = o.trick.kind === 'slap' ? 4 : 150;
    /* 速度與擺尾幅度改成指數趨近（一階遲滯），不用硬性加速度上限——理由與
       姿態角相同：夾限會做出「等速加速到目標、然後突然不再變化」的折線。 */
    var tauS = o.trick ? .18 : o.mode === 'chase' ? .30 : .55;
    o.speed += (o.spdWant - o.speed) * (1 - Math.exp(-dt / tauS));
    o.thrust += (o.thrustWant - o.thrust) * (1 - Math.exp(-dt / .40));

    /* ---- 位移：嚴格沿著頭指的方向，沒有任何側向分量 ----
       體軸在 3D 是 (cosP·sinθ, sinP, cosP·cosθ)，位移就是它乘上泳速。
       牠因此不可能平移——要往別的方向走，只能先把頭轉過去。 */
    var CP = Math.cos(o.pitch);
    o.x += CP * Math.sin(o.th) * o.speed * dt;
    o.y += Math.sin(o.pitch) * o.speed * dt;
    o.z += CP * Math.cos(o.th) * o.speed * dt;

    var mNow = mouth();                 // 這一幀結束時的嘴，供下一幀做線段命中判定
    o.pmx = mNow.x; o.pmy = mNow.y; o.pmz = mNow.z;

    /* ---- 邊界：沒有牆，只有「探出去一截就到頭」＋「靠邊提早換目標」 ----
       夾限放在「身體中心」上，且刻意留得比身長寬鬆：牠可以把頭探出畫面外去咬
       貼邊丟下的藥丸，但不會整隻飛到畫外變成一片空白。 */
    var mgx = D.span * .35, mgy = D.H * 1.4;
    if (o.z < -D.zMax) { o.z = -D.zMax; if (!o.trick && o.mode === 'cruise') pickTarget(); }
    else if (o.z > D.zMax) { o.z = D.zMax; if (!o.trick && o.mode === 'cruise') pickTarget(); }
    if (o.x < -mgx || o.x > W + mgx || o.y < -mgy || o.y > docH + mgy) {
      o.x = Math.max(-mgx, Math.min(W + mgx, o.x));
      o.y = Math.max(-mgy, Math.min(docH + mgy, o.y));
      if (!o.trick && o.mode === 'cruise') pickTarget();
    } else if (!o.trick && o.mode === 'cruise' && (o.x < mgx || o.x > W - mgx)) {
      if (o.wait > .25) o.wait = .25;                   // 快到邊了：提早換目標
    }
  }

  /* ================================================================
   * 繪製
   * ================================================================ */
  /* 疊層是 fixed（不進文件流、不可能跑版），但鯨魚與飼料的座標是**文件座標**，
     畫的時候才扣掉捲動量。使用者滑動頁面，牠就跟著頁面一起移動；被推出畫面時
     由 step() 的 'return' 模式優先把牠帶回看得到的地方。 */
  /* ---- 飼料＝藥物 ----
     十款外形（硬膠囊、圓錠、長錠、橢圓錠、軟膠囊、十字刻痕錠、雙層錠、微粒膠囊、
     糖衣錠、膜衣長錠），七組配色，另外每一顆有自己的大小（0.82–1.18 倍）與翻滾
     角速度。沉到底之後轉正躺平（就近取 0 或 π，不會在地上繼續打轉）。
     刻意全部是圓的、橢圓的或圓角長條——沒有任何稜角形：稜角一多就不像藥，
     像寶石（使用者已經退過菱形錠一次）。 */
  function drawPill(g, f, sc) {
    var c = P.pill[f.tint % P.pill.length], a = c[0], b = c[1];
    var ang = f.rest ? f.settle : f.spin + f.t * f.rot;
    g.save();
    g.translate(f.x, f.y - sc);
    g.rotate(ang);
    g.scale(f.size || 1, f.size || 1);
    g.fillStyle = a;
    var i;
    switch (f.kind) {
      case 0:                                          // 硬膠囊：兩色對半
        g.beginPath(); rrect(g, -7.5, -3.6, 15, 7.2, 3.6); g.fill();
        g.save();
        g.beginPath(); g.rect(0, -4, 8, 8); g.clip();
        g.beginPath(); rrect(g, -7.5, -3.6, 15, 7.2, 3.6);
        g.fillStyle = b; g.fill();
        g.restore();
        break;
      case 1:                                          // 圓錠＋單刻痕
        g.beginPath(); g.arc(0, 0, 5.4, 0, TAU); g.fill();
        g.fillStyle = b;
        g.beginPath(); rrect(g, -.9, -4.4, 1.8, 8.8, .9); g.fill();
        break;
      case 2:                                          // 長錠（caplet）＋刻痕
        g.beginPath(); rrect(g, -7, -3.4, 14, 6.8, 3.4); g.fill();
        g.fillStyle = b;
        g.beginPath(); rrect(g, -.8, -2.6, 1.6, 5.2, .8); g.fill();
        break;
      case 3:                                          // 圓錠（素面）
        g.beginPath(); g.arc(0, 0, 5.8, 0, TAU); g.fill();
        break;
      case 4:                                          // 軟膠囊＋反光
        g.beginPath(); g.ellipse(0, 0, 7, 4.6, 0, 0, TAU); g.fill();
        g.globalAlpha = .55; g.fillStyle = b;
        g.beginPath(); g.ellipse(-2.2, -1.5, 2.4, 1.2, -.5, 0, TAU); g.fill();
        g.globalAlpha = 1;
        break;
      case 5:                                          // 圓錠＋十字刻痕（可四分割）
        g.beginPath(); g.arc(0, 0, 6.1, 0, TAU); g.fill();
        g.fillStyle = b;
        g.beginPath(); rrect(g, -.85, -5.0, 1.7, 10.0, .85);
        rrect(g, -5.0, -.85, 10.0, 1.7, .85); g.fill();
        break;
      case 6:                                          // 橢圓錠（素面）
        g.beginPath(); g.ellipse(0, 0, 6.6, 4.9, 0, 0, TAU); g.fill();
        break;
      case 7:                                          // 雙層錠：沿長軸兩色
        g.beginPath(); rrect(g, -7, -3.4, 14, 6.8, 3.4); g.fill();
        g.save();
        g.beginPath(); g.rect(-8, 0, 16, 5); g.clip();
        g.beginPath(); rrect(g, -7, -3.4, 14, 6.8, 3.4);
        g.fillStyle = b; g.fill();
        g.restore();
        break;
      case 8:                                          // 微粒膠囊：一端透出裡面的顆粒
        g.beginPath(); rrect(g, -7.5, -3.5, 15, 7, 3.5); g.fill();
        g.save();
        g.beginPath(); g.rect(-8, -4, 8, 8); g.clip();
        g.beginPath(); rrect(g, -7.5, -3.5, 15, 7, 3.5);
        g.fillStyle = b; g.fill();
        g.restore();
        g.fillStyle = a;
        g.beginPath();
        for (i = 0; i < 5; i++) {
          var px = -6.4 + i * 1.35, py = ((i * 7) % 3 - 1) * 1.5;
          g.moveTo(px + .7, py); g.arc(px, py, .72, 0, TAU);
        }
        g.fill();
        break;
      case 9:                                          // 糖衣錠：邊緣亮一圈
        g.beginPath(); g.arc(0, 0, 6.2, 0, TAU);
        g.fillStyle = b; g.fill();
        g.beginPath(); g.arc(0, 0, 5.0, 0, TAU);
        g.fillStyle = a; g.fill();
        break;
      default:                                         // 膜衣長錠：一端一道壓印線
        g.beginPath(); rrect(g, -7.6, -3.1, 15.2, 6.2, 3.1); g.fill();
        g.fillStyle = b;
        g.beginPath(); rrect(g, 2.0, -2.0, 1.5, 4.0, .75);
        rrect(g, 4.4, -2.0, 1.5, 4.0, .75); g.fill();
    }
    g.restore();
  }

  function draw() {
    var sc = scrollTop();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hv);

    /* 藥丸躺在 z=0 那一面。鯨魚游到那一面後方時，藥丸就該蓋在牠身上——
       這一筆是深度最直接的線索，少了它「牠在藥丸後面」根本讀不出來。 */
    var i;
    if (o.z > 0) drawWhale(ctx, sc);
    for (i = 0; i < food.length; i++) drawPill(ctx, food[i], sc);
    if (o.z <= 0) drawWhale(ctx, sc);
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
      o.x = W * .68; o.y = sc + Hv * .42; o.z = -D.zMax * .25;
      o.tx = W * .25; o.ty = sc + Hv * .55; o.tz = 0;
    }
    o.z = Math.max(-D.zMax, Math.min(D.zMax, o.z));
    o.x = Math.max(0, Math.min(o.x, W));
  }
  /* 文件高度與飼料的「底」。底要讓開下緣固定列（.sent-mbar 的 z-index 是 40，
     比疊層高，沉在它底下的魚會被蓋住，看起來像憑空消失、鯨魚卻還在追）。
     兩者都會隨著造句列展開／收合而變，所以由 sync() 每 0.6 秒重量一次。 */
  function measure() {
    docH = Math.max(document.documentElement.scrollHeight, Hv);
    var bar = document.getElementById('sentBar');
    barH = (bar && bar.offsetParent) ? bar.offsetHeight : 0;
  }
  /* 藥丸的「底」必須是**目前看得到的那一帶**的底，不是整份文件的底。
     用文件底會出事：頁面比視窗高好幾倍時，藥丸會一路沉到畫面外幾百 px，
     鯨魚追下去就離開可視範圍、被 return 模式拉回來、回來又看到藥丸再追下去——
     來回擺盪、永遠吃不到，畫面上就是「牠跑出頁面不見了」。 */
  function foodFloor() {
    return Math.min(docH, scrollTop() + Hv) - barH - 10;
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
    // 線段命中判定要有「上一幀的嘴」；不初始化的話第一幀那條線是從原點拉過來的
    var m0 = mouth(); o.pmx = m0.x; o.pmy = m0.y;
    if (reduced) { step(.016); draw(); return; }
    alive = true; last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function unmount() {
    alive = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (canvas) { canvas.remove(); canvas = null; ctx = null; }
    food.length = 0;
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
  /* 打不打得到：直接量「點到**畫面上那條體軸**的距離」。體軸的兩端用同一套
     投影算出來，所以不論牠正對、側身、翻滾還是抬頭，判定範圍都跟眼睛看到的
     形狀一致——不必再為每種角度湊一個橢圓。 */
  function hitWhale(cx, cy) {
    var a = bodyPoint(0, 0), b = bodyPoint(1, 0);
    return segDist(cx, cy + scrollTop(), a.x, a.y, b.x, b.y) < D.H * 1.9;
  }
  document.addEventListener('click', function (e) {
    if (!canvas || !alive) return;
    var t = e.target;
    if (t.closest && t.closest('button, a, input, select, textarea, label, summary, ' +
                               '[data-act], .sent-chip, .sent-slot, .sent-tok, .sent-hub')) return;
    if (hitWhale(e.clientX, e.clientY)) { startTrick(); return; }
    if (food.length > 14) food.shift();
    food.push({
      x: e.clientX, y: e.clientY + scrollTop(), vy: 0, t: 0,
      s: Math.random() * 6, rest: false,
      kind: Math.floor(Math.random() * 11),            // 十一款外形隨機
      tint: Math.floor(Math.random() * 7),              // 七組配色
      size: .82 + Math.random() * .36,                  // 每一顆大小也不一樣
      spin: Math.random() * TAU,
      rot: (Math.random() - .5) * 1.8,                 // 落下時自己翻滾
      settle: 0
    });
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
