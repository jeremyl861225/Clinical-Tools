/* js/sentence-nav.js — 造句導覽（第 2a 段：句子列跨頁存活）
 *
 * 這一批交付的是「使用者認定的賣點」本身：句子即狀態的造句導覽，
 * 不是上一批（149dbd8）那種只換外觀的骨架。範圍刻意收得很窄——
 * 只做一條路徑：**首頁選詞 → 導覽到目標頁，句子列在目標頁還在**。
 * 查詢／子目標／退詞是下一批（2b／2c）的工作，這裡不做。
 *
 * ---------------------------------------------------------------
 * 跨頁存活怎麼做（對照 js/nav.js 的模式）
 * ---------------------------------------------------------------
 * repo 每一頁是獨立文件，不是原型那種單頁 app＋iframe，所以「句子」不能只活在
 * 記憶體裡——換一頁就是整份文件重新載入，JS 狀態全部歸零。跟 nav.js 處理
 * 「側邊導覽跨頁不掉」同一個精神：**狀態不是被搬過去的，是每頁自己重新畫出來
 * 的**——nav.js 每頁重新從 index.html 的 DOM／localStorage 快照算一次側欄清單，
 * 這裡則是每頁重新從網址（主要）或本頁自身在 facets.js 的標註（次要，見下）
 * 算一次句子長什麼樣子，不依賴任何「上一頁傳過來的物件」。
 *
 * 狀態放網址，具體做法：首頁把使用者選好的 s/c/a／已定案的目標工具，編碼成
 * 一段查詢字串 `?sent=群.主體.狀況.動作.工具key`（用 `.` 分隔、`-` 佔位、
 * 逐段 encodeURIComponent），接在目標工具原本的 href 之前——**用查詢字串
 * 而不是 hash**，因為 136 個標的裡有 33 個 href 本來就帶著自己的 hash
 * （`#mode=empiric`、`#cancer=lung`……那是該頁自己的深層連結語法，不能被
 * 我們的句子編碼蓋掉）。查詢字串與這些頁面既有的 hash 深層連結不衝突，
 * 兩者可以同時出現在同一個網址上（`?sent=...#cancer=lung`），各自被各自的
 * 程式讀取。目標頁載入時讀 `location.search` 的 `sent=`，句子列原樣重畫
 * 出使用者當時選的那幾個詞——**不是重新猜一次，是同一批字**。
 *
 * 目標頁若不是從造句列進來的（直接開網址、或使用者是先開了頁面才切換成
 * 造句設計），`location.search` 沒有 `sent=` 可讀，這裡退而求其次，用本頁
 * 自己在 facets.js 的標的紀錄（找法比照 nav.js 的 samePage()：用網址路徑
 * 比對 tools[].href）兜出一句「這一頁本來就對應的分類」——**兩種來源在畫面上
 * 用不同的文字誠實區分**（見 trailHTML() 的 srcNote），不會讓使用者誤以為
 * 這是他自己造的那句話。
 *
 * ---------------------------------------------------------------
 * 誠實標示（這一批做不到的事，不假裝做得到）
 * ---------------------------------------------------------------
 * 句子在分頁內部不會繼續變長——這一批沒有搬原型的 pages.js／page-abx.js
 * （那是原型自己重做的 NEWS2／闌尾炎／抗生素，repo 已有正式實作，重做一份
 * 就是製造第二個真相來源，見 briefs/PHASE2-SENTENCE-NAV.md 第三節）。
 * 目標頁的句子列因此是**唯讀**的完成式句子＋一句明講「這裡不會再長」的
 * 說明，不是一支被閹割卻假裝完整的造句列。頁內子目標（讓句子真的能收斂到
 * 293 個頁內深層連結）留給第 2b 段；收起正式版 .back-stack 避免兩套返回鍵
 * 並存留給第 2c 段——這裡完全不動 .back-stack。
 *
 * **首頁**這一段已補齊原型主畫面的四件事（實機比對原型後補做，見
 * workspace/work/restyle/style-04-sentence/index.html 檔頭的設計主張）：
 *   1. 空句子＝主選單：值班常用句六格 ＋ 三軌熱門詞 ＋ 一顆「怎麼用？」摺疊，
 *      不再把 136 個標的攤成一整片等高清單——那正是原型明文要避免的事。
 *   2. 「⌕ 說整句」：整條句子塌成一個輸入框，打字直接挑一整句話走。
 *   3. 畫面下緣固定列：⌕ 說整句 ／ ← 退一個詞（＝ Backspace）／ 清空句子。
 *   4. 句子列字面修正：範圍不再多一格空格、連接詞不再印出「，，」。
 *
 * ---------------------------------------------------------------
 * 只在 [data-ui="sentence"] 時才有 DOM
 * ---------------------------------------------------------------
 * 正式版模式下這支腳本完全不建立任何節點（boot() 開頭就檢查、不符合就直接
 * return），也不留下任何「先建好、用 CSS 藏起來」的痕跡——這樣
 * baseline.py --compare（正式版必須與 149dbd8 零差異）不必特別排除本檔案。
 * ui-mode.js 的切換器可以在**不重新整理**的情況下即時切換 data-ui，
 * 所以本檔額外掛一個 MutationObserver 盯著 <html data-ui>，切上去就補畫，
 * 切下來就整段拆掉還原——不是只有頁面「一開始就是造句模式」才畫得出來。
 *
 * 句子列本體的最外層一律帶 data-ui-chrome（值不重要，parity.py 的規則 A
 * 靠 querySelectorAll('[data-ui-chrome]') 整棵子樹排除，規則 B 則反過來
 * 拿它去掃有沒有遮到內容）。版面上一律用文件流（在 .app-header 之後插入
 * 一個新的區塊級元素），不用 fixed 疊層——內容自然被推開，不必再靠
 * padding 補償，規則 B 要求的「不可相交、不可造成橫向溢出」因此是版面
 * 結構本身保證的，不是靠算出正確的 padding 數字去凑。
 */
(function () {
  'use strict';

  var ATTR = 'data-ui';
  var VAL = 'sentence';
  function sentenceOn() {
    return document.documentElement.getAttribute(ATTR) === VAL;
  }

  var F = window.FACETS;
  if (!F || !F.tools) return; // data/facets.js 沒載到（理論上不會發生，防禦寫法，不拋錯）

  var TOOLS = F.tools;
  var byKey = {};
  TOOLS.forEach(function (t) { byKey[t.k] = t; });

  // 五個範圍（g）：值固定，標題／英文直接從 tools[] 自己的 secTitle/secEn 還原，
  // 不另外抄一份——資料來源只有一處（facets.js），避免兩份標題文字日後對不上。
  var SECT_ORDER = ['abdomen', 'critical', 'scores', 'cancer', 'hubs'];
  var SECT_TITLE = {};
  TOOLS.forEach(function (t) {
    if (!SECT_TITLE[t.sec]) SECT_TITLE[t.sec] = { title: t.secTitle, en: t.secEn };
  });

  var FKEY = { g: '範圍', s: '主體', c: '狀況', a: '動作' };
  var FPH = { s: F.lex.phS, c: F.lex.phC, a: F.lex.phA };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /* ---------------- 展開式比對（自 js/sentence.js 的比對核心搬過來） ----------------
   * 只搬狀態機與比對邏輯本身，不搬任何 DOM 互動（字輪、飛詞動畫、分岔算分……
   * 那些是原型單頁 app 的呈現細節，這裡是 108 個獨立文件，不適用也用不到）。
   * 選中的詞 → {自己} ∪ {別名} ∪ {下位詞遞迴}；命中條件是這個展開集合跟
   * 項目的標註陣列（t.s／t.c／t.a）有交集，不是字串完全相等——邏輯與
   * js/sentence.js 逐行一致，這樣兩邊（若日後 2b／2c 真的搬整支狀態機
   * 過來取代這支精簡版）對同一句話的判斷不會突然不一樣。 */
  var facetIdx = {}, expandCache = {};
  function splitWords(al) { return String(al || '').trim().split(/\s+/).filter(Boolean); }
  function buildFacetIndex(f) {
    var idx = {};
    (F[f] || []).forEach(function (o) {
      idx[o.w] = o;
      splitWords(o.al).forEach(function (a) {
        if (!idx[a]) idx[a] = o;
        var la = a.toLowerCase();
        if (!idx[la]) idx[la] = o;
      });
    });
    return idx;
  }
  function facetEntry(f, w) {
    if (!w) return null;
    if (!facetIdx[f]) facetIdx[f] = buildFacetIndex(f);
    var idx = facetIdx[f];
    return idx[w] || idx[String(w).toLowerCase()] || null;
  }
  function expand(f, w) {
    if (!w) return [];
    if (!expandCache[f]) expandCache[f] = {};
    if (expandCache[f][w]) return expandCache[f][w];
    var seen = {}, out = [];
    (function visit(word) {
      if (!word || seen[word]) return;
      seen[word] = true;
      out.push(word);
      var entry = facetEntry(f, word);
      if (!entry) return;
      if (entry.w && !seen[entry.w]) { seen[entry.w] = true; out.push(entry.w); }
      splitWords(entry.al).forEach(function (a) { if (!seen[a]) { seen[a] = true; out.push(a); } });
      (entry.sub || []).forEach(visit);
    })(w);
    expandCache[f][w] = out;
    return out;
  }
  function hit(f, w, tags) {
    if (!w) return true;
    if (!tags || !tags.length) return false;
    var exp = expand(f, w);
    for (var i = 0; i < exp.length; i++) if (tags.indexOf(exp[i]) >= 0) return true;
    return false;
  }
  function matchOne(t, s) {
    if (!t || !t.s) return false;
    if (s.g && t.sec !== s.g) return false;
    if (s.s && !hit('s', s.s, t.s)) return false;
    if (s.c && !hit('c', s.c, t.c)) return false;
    if (s.a && !hit('a', s.a, t.a)) return false;
    return true;
  }
  function matches(s) { return TOOLS.filter(function (t) { return matchOne(t, s); }); }

  // 某面向的候選詞（含 g，五個固定值）→ [{w, label, en, n}]，n＝選了它之後句子指向幾件事
  function candidates(f, s) {
    if (f === 'g') {
      var probeG = { s: s.s, c: s.c, a: s.a };
      return SECT_ORDER.map(function (id) {
        probeG.g = id;
        return { w: id, label: SECT_TITLE[id].title, en: SECT_TITLE[id].en,
                 n: TOOLS.filter(function (t) { return matchOne(t, probeG); }).length };
      });
    }
    var probe = { g: s.g, s: s.s, c: s.c, a: s.a };
    return (F[f] || []).map(function (o) {
      probe[f] = o.w;
      return { w: o.w, label: o.w, en: '', n: TOOLS.filter(function (t) { return matchOne(t, probe); }).length };
    });
  }

  // 不可回傳空集合：三格字面 AND 起來是空集合時，依「動作→狀況→主體」順序
  // 少看一格，找到第一個非空狀態就停（跟 js/sentence.js 的 relax() 同一套邏輯）。
  var RELAX_ORDER = ['a', 'c', 's'];
  function relax(s) {
    var probe = { g: s.g, s: s.s, c: s.c, a: s.a };
    var dropped = [];
    for (var i = 0; i < RELAX_ORDER.length; i++) {
      var f = RELAX_ORDER[i];
      if (!probe[f]) continue;
      var stillActive = ['s', 'c', 'a'].some(function (k) { return k !== f && probe[k]; });
      if (!stillActive) break;
      dropped.push({ f: f, w: probe[f] });
      probe = { g: probe.g, s: probe.s, c: probe.c, a: probe.a };
      probe[f] = '';
      var list = matches(probe);
      if (list.length) return { dropped: dropped, list: list, probe: probe };
    }
    return null;
  }

  /* ---------------- 網址編碼：?sent=群.主體.狀況.動作.工具key ---------------- */
  var QKEY = 'sent';
  function encodeSt(s) {
    var seg = [s.g || '-', s.s || '-', s.c || '-', s.a || '-', s.t || '-'];
    while (seg.length > 1 && seg[seg.length - 1] === '-') seg.pop();
    return seg.map(encodeURIComponent).join('.');
  }
  function decodeSt(v) {
    var seg = String(v || '').split('.').map(function (x) {
      try { return decodeURIComponent(x); } catch (e) { return x; }
    });
    function dash(x) { return (!x || x === '-') ? '' : x; }
    var o = { g: dash(seg[0]), s: dash(seg[1]), c: dash(seg[2]), a: dash(seg[3]), t: dash(seg[4]) };
    if (o.t && !byKey[o.t]) o.t = ''; // 帶進來的 key 若對不到任何工具（資料檔改版），別當真
    return o;
  }
  function withSentQuery(href, s) {
    var q = QKEY + '=' + encodeSt(s);
    var hi = href.indexOf('#');
    var path = hi === -1 ? href : href.slice(0, hi);
    var hash = hi === -1 ? '' : href.slice(hi);
    var sep = path.indexOf('?') === -1 ? '?' : '&';
    return path + sep + q + hash;
  }
  function readSentQuery() {
    var m = /[?&]sent=([^&]*)/.exec(location.search);
    return m ? decodeSt(m[1]) : null;
  }

  // 本頁自己對應哪個標的：網址路徑比對 tools[].href（做法照抄 js/nav.js 的
  // samePage()／markCurrent()——用「目錄/檔名」比對，一頁對到多個標的
  // （抗生素三種模式、30 個癌別深層連結）時再用 hash 決定是哪一個）。
  var here = location.pathname.replace(/\/$/, '/index.html');
  function hrefTail(href) {
    return href.split('#')[0].replace(/^.*?([^/]+\/)?([^/]+\.html)$/, '$1$2');
  }
  function samePage(href) {
    var tail = hrefTail(href);
    return here.slice(-tail.length) === tail;
  }
  function currentPageTool() {
    var mine = TOOLS.filter(function (t) { return samePage(t.href); });
    if (!mine.length) return null;
    var hash = location.hash;
    if (hash) {
      var exact = mine.filter(function (t) { return t.href.indexOf('#') !== -1 && t.href.slice(t.href.indexOf('#')) === hash; });
      if (exact.length) return exact[0];
    }
    var plain = mine.filter(function (t) { return t.href.indexOf('#') === -1; });
    return plain[0] || mine[0];
  }

  /* ================================================================
   * 首頁：句子造句列（唯一允許整頁換掉的頁面）
   * ================================================================ */
  var homeSt = { g: '', s: '', c: '', a: '' };
  var openFacet = null; // 目前展開哪個面向的候選詞面板
  var homeSeeded = false;

  /* 首頁也吃 ?sent=——句子的跨頁存活是雙向的：內頁「退一個詞」會把剩下的句子
     帶回首頁（見 targetDropTailHref()），首頁必須認得那串字，不然退回來會變成
     一張空白的主選單，等於句子被吞掉。工具那一段（t）在首頁沒有意義，丟掉。 */
  function seedHomeFromUrl() {
    if (homeSeeded) return;
    homeSeeded = true;
    var st = readSentQuery();
    if (!st) return;
    homeSt = { g: st.g || '', s: st.s || '', c: st.c || '', a: st.a || '' };
  }
  /* 反過來也要成立：句子改了，網址跟著改（replaceState，不塞歷史紀錄），
     這樣「分享網址＝分享這句話」對首頁一樣成立。關掉造句設計時把這個參數
     清掉，正式版的網址不留痕跡。 */
  function syncHomeUrl(clear) {
    if (!history || !history.replaceState) return;
    var base = location.pathname;
    var q = location.search.replace(/[?&]sent=[^&]*/, '').replace(/^&/, '?');
    if (q === '?') q = '';
    var has = homeSt.g || homeSt.s || homeSt.c || homeSt.a;
    if (!clear && has) {
      q += (q ? '&' : '?') + QKEY + '=' + encodeSt(homeSt);
    }
    try { history.replaceState(null, '', base + q + location.hash); } catch (e) { /* file:// 等情境不支援，忽略 */ }
  }

  function isHome() { return !!document.getElementById('hub'); }

  function completeSentenceFor(t) {
    // 導覽到某個工具時，把使用者還沒填的格子用該工具自己的第一個標註補滿，
    // 這樣目標頁收到的一律是「完整的一句話」——跟 js/sentence.js 的 open()
    // 同一個規則（優先保留使用者自己選的字，缺的才補）。
    return {
      g: homeSt.g || t.sec,
      s: homeSt.s && hit('s', homeSt.s, t.s) ? homeSt.s : (t.s[0] || ''),
      c: homeSt.c && hit('c', homeSt.c, t.c) ? homeSt.c : (t.c[0] || ''),
      a: homeSt.a && hit('a', homeSt.a, t.a) ? homeSt.a : (t.a[0] || ''),
      t: t.k
    };
  }

  /* ---------------- 句子列本體 ----------------
   * 字面逐字對齊原型（style-04-sentence/js/sentence.js renderSentence()）：
   *
   * 1. **範圍（g）沒有空格**。原型的句子只有三格 ▢（主體／狀況／動作）；範圍是
   *    點「值班常用句」或群組標頭時才長出來的第四塊詞塊，沒選的時候整塊不存在。
   *    先前這裡多畫了一格「▢ 哪一區（可略過）」，等於憑空給使用者一個他不必填、
   *    也不知道要填什麼的空格，還把句子真正的開頭（「我遇到」）往右推掉一整格。
   * 2. **連接詞一律直接取 F.lex，前後不再自己補標點**。F.lex.p2 本身就是
   *    「，我要」（前導逗號是詞表的一部分），前面再補一個「，」會印出
   *    「，，我要」——實機截圖抓到的重複逗號就是這樣來的。範圍詞塊後面那個
   *    逗號改用 F.lex.scopePost（同一份詞表裡本來就有的欄位），不寫死字面。
   * 3. 面向記號走底線樣式（.f-s 實線／.f-c 虛線／.f-a 雙線／.f-g 點線，見 CSS），
   *    不靠顏色區分，色弱與黑白列印下仍分得出這一格是哪個面向。 */
  function chipHTML(f, label) {
    return '<span class="sent-chip f-' + f + '" data-fk="' + f + '">' +
      '<button type="button" class="sc-w" data-act="open" data-f="' + f + '" ' +
      'aria-label="' + esc(FKEY[f] + '：' + label) + '。點一下換詞">' + esc(label) + '</button>' +
      '<button type="button" class="sc-x" data-act="drop" data-f="' + f + '" aria-label="退掉' + esc(FKEY[f] + '：' + label) + '">×</button>' +
      '</span>';
  }
  function slotHTML(f) {
    return '<button type="button" class="sent-slot f-' + f + '" data-act="open" data-f="' + f + '" ' +
      'aria-label="選' + esc(FKEY[f]) + '">' +
      '<span class="ss-box" aria-hidden="true">▢</span>' + esc(FPH[f]) + '</button>';
  }

  function renderRow() {
    var row = document.getElementById('sentRow');
    if (!row) return;
    var h = '';
    if (homeSt.g) h += chipHTML('g', SECT_TITLE[homeSt.g].title) + '<span class="sent-lx">' + esc(F.lex.scopePost) + '</span>';
    h += '<span class="sent-lx">' + esc(F.lex.p0) + '</span>';
    h += homeSt.s ? chipHTML('s', homeSt.s) : slotHTML('s');
    h += '<span class="sent-lx">' + esc(F.lex.p1) + '</span>';
    h += homeSt.c ? chipHTML('c', homeSt.c) : slotHTML('c');
    h += '<span class="sent-lx">' + esc(F.lex.p2) + '</span>';
    h += homeSt.a ? chipHTML('a', homeSt.a) : slotHTML('a');
    row.innerHTML = h;
  }

  function renderPanel() {
    var panel = document.getElementById('sentPanel');
    if (!panel) return;
    if (!openFacet) { panel.hidden = true; panel.innerHTML = ''; return; }
    var f = openFacet;
    var list = candidates(f, homeSt).filter(function (o) { return o.n > 0 || homeSt[f] === o.w; });
    list.sort(function (x, y) { return (y.n > 0) - (x.n > 0) || y.n - x.n; });
    var body = list.length
      ? list.map(function (o) {
          var cur = homeSt[f] === o.w;
          return '<button type="button" class="sent-tok' + (cur ? ' cur' : '') + '" data-act="pick" data-f="' + f + '" data-w="' + esc(o.w) + '">' +
            esc(o.label) + '<i>' + o.n + '</i></button>';
        }).join('')
      : '<div class="sent-tok-empty">沒有可選的詞（目前的句子已經篩掉全部候選）</div>';
    panel.hidden = false;
    panel.innerHTML = '<div class="sent-panel-head">選' + FKEY[f] + '<button type="button" class="sent-panel-close" data-act="closepanel">收起</button></div>' +
      '<div class="sent-panel-body">' + body + '</div>';
  }

  function groupList(list) {
    var bySec = {}, order = [];
    list.forEach(function (t) {
      if (!bySec[t.sec]) { bySec[t.sec] = { title: t.secTitle, en: t.secEn, groups: {}, order: [] }; order.push(t.sec); }
      var sec = bySec[t.sec];
      if (!sec.groups[t.grp]) { sec.groups[t.grp] = []; sec.order.push(t.grp); }
      sec.groups[t.grp].push(t);
    });
    return order.map(function (id) {
      var s = bySec[id];
      return { id: id, title: s.title, en: s.en, groups: s.order.map(function (g) { return { name: g, tools: s.groups[g] }; }) };
    });
  }

  /* 還沒填的那幾格裡，哪一格填下去最有效？（原型 js/sentence.js bestNarrow()）
     對每個空著的面向，取它所有候選詞裡「選了之後剩幾件事」的最小值，
     三格取最小的那個當建議——讓「再填一個詞」不是空話，而是給得出數字的下一步。 */
  function bestNarrow() {
    var best = null;
    ['s', 'c', 'a'].forEach(function (f) {
      if (homeSt[f]) return;
      var minN = Infinity;
      candidates(f, homeSt).forEach(function (o) { if (o.n > 0 && o.n < minN) minN = o.n; });
      if (minN < Infinity && (!best || minN < best.n)) best = { f: f, n: minN };
    });
    return best;
  }

  function renderPointer(list, lastRelax, relaxFailed) {
    var point = document.getElementById('sentPoint');
    if (!point) return;
    var any = homeSt.g || homeSt.s || homeSt.c || homeSt.a;
    var n = list.length;
    var relaxNote = '', hint;
    if (lastRelax) {
      var droppedW = lastRelax.dropped.map(function (d) { return d.w; }).join('、');
      relaxNote = '<div class="sent-relax">沒有同時符合的項目，已自動放寬「' + esc(droppedW) + '」——下面列的是放寬後的結果。</div>';
      hint = '已自動放寬「' + droppedW + '」，其餘條件不變';
    } else if (relaxFailed) {
      relaxNote = '<div class="sent-relax sent-relax-empty">已依序放寬狀況／動作／主體，仍然找不到同時符合的項目。</div>';
      hint = '找不到符合的項目 · 退掉一個詞試試';
    } else if (!any) {
      hint = '句子還是空的 · 空句子就是主選單';
    } else if (n <= 3) {
      hint = '已收斂到 ' + n + ' 件';
    } else {
      hint = '再填一個詞就會更窄';
      var bn = bestNarrow();
      if (bn && bn.n < n) hint += '，再選一個' + FKEY[bn.f] + '可從 ' + n + ' 縮到 ' + bn.n;
    }
    point.innerHTML = relaxNote +
      '<span class="sent-point-n">這句話目前指向 <b>' + n + '</b> 件事</span>' +
      '<span class="sent-point-hint">' + esc(hint) + '</span>' +
      (any ? '<button type="button" class="sent-clear" data-act="clear">清空句子</button>' : '');
  }

  /* ---------------- 值班常用句：六格入口 ----------------
   * 文案（中文名／英文名／描述）一律現場從 index.html 既有的六張 .hub-card
   * 讀出來（data-label／data-en／data-sub），不在這裡另抄一份——正式版改了文案，
   * 造句設計這邊跟著變，不會有兩份對不上的字。
   * 每格上緣那行「說『…』」是這一格按下去會把句子填成什麼樣子的預告，
   * 對照的就是下面 set 裡真正寫進 homeSt 的欄位（四格填範圍、兩格填動作），
   * 不是裝飾文字。 */
  var HUB_SAY = {
    'card-view-abdomen':     { say: '說「' + F.lex.scopePre + ' 腹部急症 …」',   set: { g: 'abdomen' } },
    'card-view-antibiotics': { say: '說「…' + F.lex.p2.replace(/^，/, '') + ' 查覆蓋菌譜」', set: { a: '查覆蓋菌譜' } },
    'card-view-critical':    { say: '說「' + F.lex.scopePre + ' 急重症處置 …」', set: { g: 'critical' } },
    'card-view-cancer':      { say: '說「' + F.lex.scopePre + ' 癌症治療 …」',   set: { g: 'cancer' } },
    'card-view-scores':      { say: '說「' + F.lex.scopePre + ' 計分工具 …」',   set: { g: 'scores' } },
    'card-view-drugdb':      { say: '說「…' + F.lex.p2.replace(/^，/, '') + ' 查劑量」',     set: { a: '查劑量' } }
  };
  function hubsHTML() {
    var cards = [].slice.call(document.querySelectorAll('#hub .hub-card'));
    var body = cards.map(function (a) {
      var m = HUB_SAY[a.id];
      if (!m) return '';
      var label = a.getAttribute('data-label') || '', en = a.getAttribute('data-en') || '',
          sub = a.getAttribute('data-sub') || '';
      return '<button type="button" class="sent-hub" data-act="hub" data-hub="' + esc(a.id) + '" ' +
        'aria-label="值班常用句：' + esc(label) + '，' + esc(m.say) + '">' +
        '<span class="shb-say">' + esc(m.say) + '</span>' +
        '<span class="shb-zh">' + esc(label) + '</span>' +
        '<span class="shb-en">' + esc(en) + '</span>' +
        '<span class="shb-sub">' + esc(sub) + '</span></button>';
    }).join('');
    if (!body) return '';
    return '<div class="sent-hubs-h">值班常用句 · 點一下就把句子說完一半</div>' +
      '<div class="sent-hubs">' + body + '</div>';
  }

  /* ---------------- 空句子＝主選單（不可攤開 136 個工具） ----------------
   * 這是原型檔頭白紙黑字寫的設計主張：「空句子＝主選單（值班常用句六格＋三軌
   * 熱門詞），不會像第一輪那樣把 99～155 個工具攤成一片等高的清單」。
   * 熱門詞的命中數是現場對 TOOLS 的標註陣列數出來的，不是寫死的數字——
   * facets.js 改標註，這裡的數字跟著改。 */
  var ES_LABEL = { s: '主體 · 病人／病灶是什麼', c: '狀況 · 遇到什麼情況', a: '動作 · 要做什麼' };
  function hotWords(f, k) {
    var counts = {};
    TOOLS.forEach(function (t) {
      (t[f] || []).forEach(function (w) { counts[w] = (counts[w] || 0) + 1; });
    });
    // 同名次不另外排序（穩定排序＝維持第一次在 TOOLS 裡出現的順序），
    // 跟原型 js/views.js hotWords() 逐行一致——換一套 tie-break 會讓同樣是 7 件的
    // 「小腸」被「圍手術期」擠掉，兩邊的熱門詞軌就對不上了。
    return Object.keys(counts)
      .sort(function (x, y) { return counts[y] - counts[x]; })
      .slice(0, k).map(function (w) { return { w: w, n: counts[w] }; });
  }
  function mainMenuHTML() {
    var h = '<details class="sent-howto"><summary>怎麼用？</summary>' +
      '<div class="sent-howto-body">句子還是空的——這就是主選單。先點一句「值班常用句」把句子說完一半，' +
      '或點一個熱門詞直接填一格；也可以逐格點 ▢ 自己選詞，選好的詞塊點一下可以原地換詞、' +
      '按 × 退掉。畫面下緣的「← 退一個詞」（等同鍵盤 Backspace）退掉句尾一個詞，' +
      '「清空句子」回到這裡。左邊的「⌕ 說整句」可以直接打字找一整句話，不必逐格點選。' +
      '</div></details>';
    ['s', 'c', 'a'].forEach(function (f) {
      var words = hotWords(f, 8);
      if (!words.length) return;
      h += '<div class="sent-es-slot"><div class="sent-es-h">' + esc(ES_LABEL[f]) + '</div>' +
        '<div class="sent-es-words">' + words.map(function (o) {
          return '<button type="button" class="sent-tok" data-act="pick" data-f="' + f + '" data-w="' + esc(o.w) + '">' +
            esc(o.w) + '<i>' + o.n + '</i></button>';
        }).join('') + '</div></div>';
    });
    return '<div class="sent-empty-state">' + h + '</div>';
  }

  function renderResults(list) {
    var results = document.getElementById('sentResults');
    if (!results) return;
    var any = homeSt.g || homeSt.s || homeSt.c || homeSt.a;
    if (!any) { results.innerHTML = mainMenuHTML(); return; }
    if (!list.length) {
      results.innerHTML = '<div class="sent-empty">找不到符合的項目——按上面「清空句子」可以回到全部 ' + TOOLS.length + ' 項，不會卡住到不了任何一頁。</div>';
      return;
    }
    var groups = groupList(list);
    results.innerHTML = groups.map(function (g) {
      return '<div class="sent-group">' +
        '<div class="sent-group-head"><span class="sgh-zh">' + esc(g.title) + '</span><span class="sgh-en">' + esc(g.en) + '</span></div>' +
        g.groups.map(function (grp) {
          return '<div class="sent-subgroup">' +
            (grp.name ? '<div class="sent-subgroup-name">' + esc(grp.name) + '</div>' : '') +
            grp.tools.map(function (t) {
              var st = completeSentenceFor(t);
              return '<a class="sent-hit" href="' + esc(withSentQuery(t.href, st)) + '">' +
                '<span class="sh-name">' + esc(t.name) + '</span>' +
                '<span class="sh-en">' + esc(t.en) + '</span>' +
                '</a>';
            }).join('') +
            '</div>';
        }).join('') +
        '</div>';
    }).join('');
  }

  /* ================================================================
   * 快速路徑：「⌕ 說整句」
   * ================================================================
   * 逐格點選之外的另一條路：整條句子塌成一個輸入框，打幾個字（含縮寫與
   * 子序列容錯）直接挑一整句話走。比對分級與排序照抄原型 js/say.js，
   * 但索引只吃 repo 自己的 data/facets.js（136 個標的與三個詞表的別名）——
   * 原型另外併進來的 drugnames.js／sub-*.js 不搬進 repo，那會變成第二份真相。
   */
  var sayIdx = null, sayOpen = false, saySel = 0, sayCur = [], sayLastQ = null;
  function alOf(f, w) {
    var e = facetEntry(f, w);
    return e ? (e.al || '') : '';
  }
  function buildSayIndex() {
    if (sayIdx) return sayIdx;
    sayIdx = TOOLS.map(function (t) {
      var hay = [t.name, t.en, t.desc, t.grp, t.grpEn, t.secTitle, t.secEn, t.kw || '', t.href,
                 t.s.join(' '), t.c.join(' '), t.a.join(' ')];
      t.s.forEach(function (w) { hay.push(alOf('s', w)); });
      t.c.forEach(function (w) { hay.push(alOf('c', w)); });
      t.a.forEach(function (w) { hay.push(alOf('a', w)); });
      return { t: t, hay: hay.join(' ').toLowerCase(), head: (t.name + ' ' + t.en).toLowerCase() };
    });
    return sayIdx;
  }
  function isSubseq(q, s) {
    var i = 0;
    for (var j = 0; j < s.length && i < q.length; j++) if (s[j] === q[i]) i++;
    return i === q.length;
  }
  var SAY_ALIAS = {
    'pna': '肺炎', 'afib': '心房顫動', 'uti': '泌尿道感染', 'gib': '腸胃道出血',
    'sbo': '腸阻塞', 'nom': '非手術治療', 'dka': 'DKA', 'aki': '急性腎損傷',
    'tbi': '創傷性腦損傷', 'pe': '肺栓塞', 'dvt': '深部靜脈栓塞', 'acs': '急性冠心症'
  };
  var R_PREFIX = 0, R_WORD = 1, R_SUB = 2, R_HAY = 3, R_FUZZY = 4;
  function saySearch(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    var q2 = SAY_ALIAS[q] ? SAY_ALIAS[q].toLowerCase() : null;
    var out = [];
    buildSayIndex().forEach(function (e) {
      var r = -1;
      if (e.head.indexOf(q) === 0) r = R_PREFIX;
      else if ((' ' + e.head).indexOf(' ' + q) >= 0) r = R_WORD;
      else if (e.head.indexOf(q) >= 0) r = R_SUB;
      else if (q2 && e.head.indexOf(q2) >= 0) r = R_SUB;
      if (r < 0) {
        if (e.hay.indexOf(q) >= 0) r = R_HAY;
        else if (q2 && e.hay.indexOf(q2) >= 0) r = R_HAY;
        else if (q.length >= 3 && e.head.length < 40 && isSubseq(q, e.head)) r = R_FUZZY;
      }
      if (r >= 0) out.push({ r: r, e: e });
    });
    out.sort(function (x, y) { return x.r - y.r || x.e.t.name.length - y.e.t.name.length; });
    return out.slice(0, 14);
  }
  // 一律接在 ROOT（本檔 <script src> 反推出來的站台根）之後——「說整句」在
  // 首頁與 107 個內頁共用同一支，內頁的相對路徑基準是 tools/ 或 pathways/，
  // 直接用 t.href（相對站台根）會指到不存在的 tools/tools/xxx.html。
  function sayItemHref(t) {
    return withSentQuery(ROOT + t.href, {
      g: t.sec, s: t.s[0] || '', c: t.c[0] || '', a: t.a[0] || '', t: t.k
    });
  }
  function renderSay(q) {
    var box = document.getElementById('sentAskList');
    if (!box) return;
    sayCur = saySearch(q);
    if (!String(q || '').trim()) {
      box.innerHTML = '<div class="sent-ask-hint">打幾個字：工具名（NEWS2、闌尾）、狀況（敗血症、腸阻塞）、' +
        '動作（開刀、劑量）、癌別（胃癌）都行。候選項是一整句話，Enter 直接抵達。</div>';
      saySel = 0; sayLastQ = q; return;
    }
    if (!sayCur.length) {
      box.innerHTML = '<div class="sent-ask-hint">找不到符合的句子。</div>';
      saySel = -1; sayLastQ = q; return;
    }
    // 最高分只有子序列容錯：沒有一項是精確命中，換成「你是不是要找」的口吻，
    // 並取消首項預選，避免 Enter 直接落到猜錯的工具（原型 say.js 同一條規則）。
    var fuzzyOnly = sayCur[0].r >= R_FUZZY;
    if (q !== sayLastQ) { saySel = fuzzyOnly ? -1 : 0; sayLastQ = q; }
    else if (saySel >= sayCur.length) saySel = sayCur.length - 1;
    var head = fuzzyOnly
      ? '<div class="sent-ask-hint sent-ask-fuzzy">沒有精確命中「' + esc(String(q).trim()) + '」，你是不是要找…（↑ ↓ 選一項才能 Enter 直達）</div>'
      : '';
    box.innerHTML = head + sayCur.map(function (item, i) {
      var t = item.e.t;
      return '<a class="sent-ask-item' + (i === saySel ? ' sel' : '') + '" data-i="' + i + '" href="' + esc(sayItemHref(t)) + '">' +
        '<span class="sai-say">' + esc(F.lex.p0) + ' <em>' + esc(t.s[0] || '') + '</em> ' + esc(F.lex.p1) +
        ' <em>' + esc(t.c[0] || '') + '</em>' + esc(F.lex.p2) + ' <em>' + esc(t.a[0] || '') + '</em> ' +
        '<span class="sai-arw">→</span> ' + esc(t.name) + '</span>' +
        '<span class="sai-meta">' + esc(t.en) + ' · ' + esc(t.secTitle + ' · ' + t.grp) + '</span></a>';
    }).join('');
  }
  function showSay(v) {
    var panel = document.getElementById('sentAsk');
    if (!panel) return;
    sayOpen = !!v;
    panel.hidden = !sayOpen;
    // 面板長在誰底下就由誰讓位：首頁是 #sentHome，內頁是 #sentTrail。
    var box = panel.parentNode;
    if (box && box.classList) box.classList.toggle('asking', sayOpen);
    [].slice.call(document.querySelectorAll('[data-act="say"]')).forEach(function (b) {
      b.setAttribute('aria-expanded', sayOpen ? 'true' : 'false');
      var lbl = b.querySelector('.lbl');
      if (lbl) lbl.textContent = sayOpen ? '回句子' : '說整句';
    });
    var inp = document.getElementById('sentAskIn');
    if (!inp) return;
    if (sayOpen) {
      openFacet = null;
      if (document.getElementById('sentPanel')) renderPanel();
      inp.value = '';
      sayLastQ = null;
      renderSay('');
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 20);
    } else {
      try { inp.blur(); } catch (e) {}
    }
  }

  /* ---------------- 退一個詞：句尾優先，動作 → 狀況 → 主體 → 範圍 ---------------- */
  var TAIL_ORDER = ['a', 'c', 's', 'g'];
  function dropTail() {
    for (var i = 0; i < TAIL_ORDER.length; i++) {
      if (homeSt[TAIL_ORDER[i]]) { homeSt[TAIL_ORDER[i]] = ''; return true; }
    }
    return false;
  }

  /* 畫面下緣固定列（原型 index.html #mobilebar）：首頁與 107 個內頁共用同一條。
     三格恆常存在——⌕ 是唯一的快速入口，不能因為句子是空的就跟著消失；
     退詞／清空句子在沒東西可退時用 disabled 呈現（文字仍在、觸控尺寸不變），
     不靠顏色本身傳達「按不動」。最外層帶 data-ui-chrome；被它蓋住的版面由
     CSS（body:has(#sentBar){padding-bottom}）補開，不由 JS 去改 body 的
     inline style——關掉造句設計時不會留下任何痕跡。 */
  function buildBar() {
    if (document.getElementById('sentBar')) return;
    var bar = document.createElement('div');
    bar.id = 'sentBar';
    bar.className = 'sent-mbar';
    bar.setAttribute('data-ui-chrome', 'sentence-bar');
    bar.innerHTML =
      '<button type="button" class="smb-btn" data-act="say" aria-expanded="false" ' +
      'aria-label="直接說整句：打字找一整句話，Enter 直達">' +
      '<span aria-hidden="true">⌕</span> <span class="lbl">說整句</span></button>' +
      '<button type="button" class="smb-btn" id="sentBarDrop" data-act="droptail" ' +
      'aria-label="退一個詞，等同鍵盤 Backspace"><span aria-hidden="true">←</span> 退一個詞</button>' +
      '<button type="button" class="smb-btn" id="sentBarClear" data-act="clear" ' +
      'aria-label="清空整句，回到主選單">清空句子</button>';
    document.body.appendChild(bar);
  }

  function renderBar() {
    var bar = document.getElementById('sentBar');
    if (!bar) return;
    var has = isHome()
      ? !!(homeSt.g || homeSt.s || homeSt.c || homeSt.a)
      : !!targetSt;   // 內頁一定有一句完成式句子，退詞／清空一律可用
    var d = document.getElementById('sentBarDrop'), c = document.getElementById('sentBarClear');
    if (d) d.disabled = !has;
    if (c) c.disabled = !has;
  }

  function renderHome() {
    var list = matches(homeSt);
    var lastRelax = null, relaxFailed = false;
    if (!list.length && (homeSt.s || homeSt.c || homeSt.a)) {
      var r = relax(homeSt);
      if (r) { lastRelax = r; list = r.list; } else relaxFailed = true;
    }
    renderRow();
    renderPanel();
    renderPointer(list, lastRelax, relaxFailed);
    var hubs = document.getElementById('sentHubs');
    if (hubs && !hubs.innerHTML) hubs.innerHTML = hubsHTML();
    renderResults(list);
    renderBar();
    syncHomeUrl(false);
  }

  function buildHomeShell() {
    if (document.getElementById('sentHome')) return document.getElementById('sentHome');
    seedHomeFromUrl();
    var box = document.createElement('div');
    box.id = 'sentHome';
    box.className = 'sent-home';
    box.setAttribute('data-ui-chrome', 'sentence-home');
    box.innerHTML =
      '<div class="sent-rail">' +
        '<button type="button" class="sent-say-btn" data-act="say" aria-expanded="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達">' +
        '<span class="mag" aria-hidden="true">⌕</span><span class="lbl">說整句</span></button>' +
        '<div class="sent-row" id="sentRow"></div>' +
      '</div>' +
      '<div class="sent-ask" id="sentAsk" hidden>' +
        '<input class="sent-ask-in" id="sentAskIn" type="text" autocomplete="off" spellcheck="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達" ' +
        'placeholder="查詢工具、癌別、狀況、動作…（例：NEWS2、闌尾、敗血症、胃癌）">' +
        '<div class="sent-ask-list" id="sentAskList"></div>' +
      '</div>' +
      '<div class="sent-panel" id="sentPanel" hidden></div>' +
      '<div class="sent-point" id="sentPoint"></div>' +
      '<div class="sent-hubs-zone" id="sentHubs"></div>' +
      '<div class="sent-results" id="sentResults"></div>' +
      '<div class="sent-foot-note">句子就是狀態：網址（?sent=…）記得你選了什麼，分享網址等於分享這句話。</div>';
    // 插在搜尋框（#gs-home）之前——正式版的搜尋、方磚、六大類分頁區塊本身
    // 用 CSS（[data-ui="sentence"] #gs-home,#gs-results,#home-body{display:none}）
    // 整段隱藏，不刪節點、不動 markup，關掉造句設計時原樣還在。
    var gsHome = document.getElementById('gs-home');
    if (gsHome && gsHome.parentNode) gsHome.parentNode.insertBefore(box, gsHome);
    else document.body.appendChild(box);
    buildBar();
    return box;
  }

  function teardownHome() {
    var box = document.getElementById('sentHome');
    if (!box) return;
    box.remove();
    var bar = document.getElementById('sentBar');
    if (bar) bar.remove();
    sayOpen = false;
    syncHomeUrl(true);   // 關掉造句設計：網址上的 ?sent= 一起清掉，正式版不留痕跡
  }

  /* 事件只認自己插進來的兩塊 chrome（首頁造句列／內頁軌跡）＋下緣固定列，
     不會攔到頁面原本的按鈕。 */
  function inChrome(el) {
    var home = document.getElementById('sentHome'),
        trail = document.getElementById('sentTrail'),
        bar = document.getElementById('sentBar');
    return !!((home && home.contains(el)) || (trail && trail.contains(el)) || (bar && bar.contains(el)));
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-act]');
    if (!el || !inChrome(el)) return;
    var act = el.getAttribute('data-act');
    var f = el.getAttribute('data-f');
    if (act === 'say') { e.preventDefault(); showSay(!sayOpen); return; }

    /* ---- 內頁（有 #sentTrail、沒有 #sentHome）：展開／清空／退詞 ---- */
    if (!isHome()) {
      if (act === 'tfold') {
        e.preventDefault();
        var full = document.getElementById('sentTrailFull');
        var btn = document.querySelector('#sentTrail .sent-fold');
        if (!full || !btn) return;
        var openNow = full.hidden;
        full.hidden = !openNow;
        btn.setAttribute('aria-expanded', openNow ? 'true' : 'false');
        var chev = btn.querySelector('.sf-chev');
        if (chev) chev.textContent = openNow ? '收合 ⌃' : '展開 ⌄';
        return;
      }
      if (act === 'tclear' || act === 'clear') { e.preventDefault(); location.href = ROOT + 'index.html'; return; }
      if (act === 'droptail') {
        e.preventDefault();
        var href = targetDropTailHref();
        if (href) location.href = href;
        return;
      }
      return;
    }

    /* ---- 首頁 ---- */
    if (act === 'open') { openFacet = (openFacet === f) ? null : f; if (sayOpen) showSay(false); renderHome(); return; }
    if (act === 'closepanel') { openFacet = null; renderPanel(); return; }
    if (act === 'drop') { homeSt[f] = ''; renderHome(); return; }
    if (act === 'droptail') { if (dropTail()) renderHome(); return; }
    if (act === 'hub') {
      var m = HUB_SAY[el.getAttribute('data-hub')];
      if (!m) return;
      Object.keys(m.set).forEach(function (k) { homeSt[k] = m.set[k]; });
      openFacet = null;
      if (sayOpen) showSay(false);
      renderHome();
      return;
    }
    if (act === 'pick') {
      var w = el.getAttribute('data-w');
      homeSt[f] = (homeSt[f] === w) ? '' : w;
      openFacet = null;
      renderHome();
      return;
    }
    if (act === 'clear') { homeSt = { g: '', s: '', c: '', a: '' }; openFacet = null; if (sayOpen) showSay(false); renderHome(); return; }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'sentAskIn') renderSay(e.target.value);
  });
  document.addEventListener('keydown', function (e) {
    var onHome = !!document.getElementById('sentHome'), onTrail = !!document.getElementById('sentTrail');
    if (!onHome && !onTrail) return;
    var typing = /^(input|textarea|select)$/i.test(e.target.tagName || '') || e.target.isContentEditable;
    if (!sayOpen) {
      // Backspace 退掉句尾一個詞（不在輸入框裡打字時才算）
      if (e.key === 'Backspace' && !typing) {
        if (onHome) {
          if (dropTail()) { e.preventDefault(); renderHome(); }
        } else {
          var h = targetDropTailHref();
          if (h) { e.preventDefault(); location.href = h; }
        }
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); showSay(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); saySel = Math.min(sayCur.length - 1, saySel + 1); renderSay(document.getElementById('sentAskIn').value); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); saySel = Math.max(0, saySel - 1); renderSay(document.getElementById('sentAskIn').value); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      var item = sayCur[saySel];   // saySel === -1（只有模糊命中、未確認選取）時不動作
      if (item) location.href = sayItemHref(item.e.t);
      return;
    }
  });

  /* ================================================================
   * 目標頁：唯讀句子軌跡（107 個工具／流程頁）
   * ================================================================ */
  var selfScript = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var ROOT = selfScript.src.replace(/js\/sentence-nav\.js.*$/, '');

  /* 目標頁的句子軌跡，版型照抄原型的**摺疊摘要**（style-04-sentence
   * js/sentence.js foldSummaryHTML()＋css/sentence.css .sent-fold）：
   *
   *   第一行  病人整體 · 病情惡化 · 算分數      ← 純文字、中點分隔，不包方框
   *   第二行  → NEWS2                展開 ⌄   ← 箭頭＋大字襯線工具名
   *   指向行  這句話目前指向 N 件事　句子已完成 · 退掉句尾的詞塊就回到上一層
   *
   * 先前這裡是「每個詞各包一個方框、橫著排成一大塊」＋三行灰字誠實標示，
   * 整條軌跡比它所在頁面的標題還重。原型在頁內是**輕的**：一行摘要、一行
   * 工具名，其餘收進「展開 ⌄」。誠實標示保留，但壓成一行極小字——
   * 該講的內容沒有變少，只是不再佔掉一屏的份量。 */
  function trailChipsHTML(st) {
    var t = st.t && byKey[st.t];
    var parts = [];
    if (st.g && SECT_TITLE[st.g]) parts.push('<span class="st-chip">' + esc(SECT_TITLE[st.g].title) + '</span>' +
      '<span class="st-lx">' + esc(F.lex.scopePost) + '</span>');
    parts.push('<span class="st-lx">' + esc(F.lex.p0) + '</span>');
    if (st.s) parts.push('<span class="st-chip">' + esc(st.s) + '</span>');
    parts.push('<span class="st-lx">' + esc(F.lex.p1) + '</span>');
    if (st.c) parts.push('<span class="st-chip">' + esc(st.c) + '</span>');
    // p2 本身已帶前導逗號（"，我要"）——這裡不可以再補一個，否則印出「，，我要」
    parts.push('<span class="st-lx">' + esc(F.lex.p2) + '</span>');
    if (st.a) parts.push('<span class="st-chip">' + esc(st.a) + '</span>');
    if (t) parts.push('<span class="st-chip st-chip-tool">→ ' + esc(t.name) + '</span>');
    return parts.join('');
  }

  function trailHTML(st, exact) {
    var t = st.t && byKey[st.t];
    var summary = [st.s, st.c, st.a].filter(Boolean).join(' · ');
    var toolName = t ? t.name : (st.a || st.c || st.s || '');
    var list = matches({ g: st.g, s: st.s, c: st.c, a: st.a });
    var hint = t ? '句子已完成 · 退掉句尾的詞塊就回到上一層' : '這一頁的句子是唯讀的';
    // 誠實標示壓成一行極小字：兩種來源仍然分得出來，只是不再各佔三行。
    var srcNote = exact ? '這是你在造句列選的句子' : '本頁在詞表裡的預設歸類，不是你造的句子';

    return '<div class="st-rail">' +
        '<button type="button" class="sent-say-btn" data-act="say" aria-expanded="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達">' +
        '<span class="mag" aria-hidden="true">⌕</span><span class="lbl">說整句</span></button>' +
        '<button type="button" class="sent-fold" data-act="tfold" aria-expanded="false" ' +
        'aria-controls="sentTrailFull" aria-label="句子摘要：' + esc(summary + (summary ? ' → ' : '') + toolName) + '。點一下展開完整句子">' +
          '<span class="sf-line1">' + esc(summary) + '</span>' +
          '<span class="sf-line2">' +
            '<span class="sf-arrow" aria-hidden="true">→</span>' +
            '<span class="sf-tool">' + esc(toolName) + '</span>' +
            '<span class="sf-chev" aria-hidden="true">展開 ⌄</span>' +
          '</span>' +
        '</button>' +
      '</div>' +
      '<div class="st-full" id="sentTrailFull" hidden>' +
        '<div class="st-line">' + trailChipsHTML(st) + '</div>' +
      '</div>' +
      '<div class="sent-point">' +
        '<span class="sent-point-n">這句話目前指向 <b>' + list.length + '</b> 件事</span>' +
        '<span class="sent-point-hint">' + esc(hint) + '</span>' +
        '<button type="button" class="sent-clear" data-act="tclear">清空句子</button>' +
      '</div>' +
      '<div class="st-honest">' + esc(srcNote) + ' · 句子在這一頁不會再變長</div>' +
      '<div class="sent-ask" id="sentAsk" hidden>' +
        '<input class="sent-ask-in" id="sentAskIn" type="text" autocomplete="off" spellcheck="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達" ' +
        'placeholder="查詢工具、癌別、狀況、動作…（例：NEWS2、闌尾、敗血症、胃癌）">' +
        '<div class="sent-ask-list" id="sentAskList"></div>' +
      '</div>';
  }

  var targetSt = null;

  function renderTarget() {
    var anchor = document.querySelector('.app-header');
    if (!anchor) return; // 理論上 107 頁都有（schema/check_pages.py 驗過），防禦寫法
    var incoming = readSentQuery();
    var st = incoming;
    if (!st) {
      var t = currentPageTool();
      if (!t) return; // 本頁不在 136 個標的清單內（例如尚未收錄的頁面），沒有句子可畫
      st = { g: t.sec, s: t.s[0] || '', c: t.c[0] || '', a: t.a[0] || '', t: t.k };
    }
    targetSt = st;
    var bar = document.getElementById('sentTrail');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sentTrail';
      bar.className = 'sent-trail';
      bar.setAttribute('data-ui-chrome', 'sentence-trail');
      anchor.insertAdjacentElement('afterend', bar);
    }
    bar.innerHTML = trailHTML(st, !!incoming);
    buildBar();
    renderBar();
  }

  function teardownTarget() {
    var trail = document.getElementById('sentTrail');
    if (trail) trail.remove();
    var bar = document.getElementById('sentBar');
    if (bar) bar.remove();     // 下緣固定列是首頁／內頁共用的，兩邊拆除都要收掉
    targetSt = null;
    sayOpen = false;
  }

  /* 目標頁的「退一個詞」：這一頁是一份獨立文件，退詞沒辦法原地讓句子變短——
     句子的下一站在首頁的造句列。所以退掉句尾一個詞之後，帶著剩下的句子回首頁
     （?sent=…），使用者看到的是「同一句話少一個詞」的候選清單，不是回到空白。
     退掉的順序：工具 → 動作 → 狀況 → 主體 → 範圍（句尾優先，跟首頁同一套）。 */
  function targetDropTailHref() {
    if (!targetSt) return null;
    var st = { g: targetSt.g, s: targetSt.s, c: targetSt.c, a: targetSt.a, t: targetSt.t };
    var order = ['t', 'a', 'c', 's', 'g'];
    var dropped = false;
    for (var i = 0; i < order.length; i++) {
      if (st[order[i]]) { st[order[i]] = ''; dropped = true; break; }
    }
    if (!dropped) return ROOT + 'index.html';
    if (!st.g && !st.s && !st.c && !st.a && !st.t) return ROOT + 'index.html';
    return withSentQuery(ROOT + 'index.html', st);
  }

  /* ---------------- 開關 ---------------- */
  function render() {
    if (isHome()) { buildHomeShell(); renderHome(); }
    else { renderTarget(); }
  }
  function teardown() {
    teardownHome();
    teardownTarget();
  }
  function sync() {
    if (sentenceOn()) render(); else teardown();
  }

  function boot() {
    sync();
    // ui-mode.js 的切換器改屬性不重載，這裡盯著 data-ui 變化即時補畫／拆掉。
    try {
      new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
    } catch (e) { /* 極舊瀏覽器沒有 MutationObserver：僅本次載入時的狀態有效，不拋錯 */ }
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
