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
 * **首頁第二輪**：使用者要求「一定要有 04 prototype 的各個元素與編排」。
 * 逐項並排清點（430×932，原型 vs repo）之後，補的是下面五件——每一件都先在
 * 原型量過長什麼樣子才動手，沒有一件是憑空發明的：
 *
 *   5. 候選清單的兩層標頭（原型 js/views.js renderRefs()）：
 *      · 分區標頭 .sec-h ＝ 英文小字 ＋ 中文大字 ＋「N 件」，**可點**（收斂範圍 g）。
 *      · 群組標頭 .grp-h ＝ 中文 ＋ 英文 ＋「命中 / 全部 項」，**可點**——原型
 *        這一顆掛的正是 data-act="swap"（平行換題：只把「狀況」換成這個群組最
 *        具代表性的那個詞，句子其他部分不動）。
 *      repo 併入前兩層都只有純文字、沒有數量、不能點。
 *   6. 候選項一列六層資訊（原型 js/views.js rowHTML()）：型別記號 ◆ ＋ 型別
 *      標籤「流程」＋ 中文名 ＋ 英文名 ＋ desc（2 行截斷）＋ 右側「＋」展開。
 *      repo 併入前只有中文名與英文名兩層。原型第七層那顆「本款重製／嵌入正式版」
 *      徽章**刻意不搬**：那是原型標示自己哪三頁真的重做過，repo 的 136 個標的
 *      全部是真頁面，沒有對應的區別可標，搬過來只會是一句假話。
 *   7. 平行換題（原型 index.html 檔頭第三條互動）：長按已選定的詞塊 → 字輪，
 *      原地循環替換這一格的詞，不必重新展開清單；桌機按住後 ← →、鍵盤 Tab
 *      聚焦後 ↑ ↓ 是同一件事。換完之後「下游依賴它的詞塊」照原型
 *      js/sentence.js set()：句子指不到任何東西時，由句尾往前（動作→狀況→
 *      主體→範圍）把**不是這次換的那幾格**清掉，直到句子重新指得到東西。
 *   8. 候選詞面板補兩件原型有的（原型 .tokrail）：打字過濾框，以及指向被點
 *      詞塊的箭頭——「清單重開在原位」要看得見重開在哪一格上。
 *   9. 「說整句」索引除噪：面向同義詞（al）裡凡是該詞自己的**下位詞**（sub）
 *      一律不進索引——見 alOf() 的長註解，那才是「打闌尾跑出肺癌」的原因，
 *      不是模糊比對放太寬。另補原型 js/say.js 有而這裡沒有的兩件：↑ ↓ 時把
 *      選取項捲進可視範圍、「/」直接叫出輸入框。
 *
 * 清點時確認**已經**對齊、不必動的（避免有人日後「補」出重複的東西）：
 * 範圍（g）詞塊未選時不顯示成空格 ▢、選了才長出「腹部急症 ×，我遇到…」
 * （renderRow() 本來就是這樣）；指向行的收斂提示「再選一個主體可從 18 縮到 1」
 * （renderPointer() 的 bestNarrow()）；收斂之後值班常用句六格仍然在
 * （renderResults() 只換 #sentResults，不碰 #sentHubs）；自動放寬的黃字說明。
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

  /* 字輪（見下面「平行換題」那一段）轉動時，畫面要即時預覽「換成這個詞會剩幾件事」，
     可是這時候使用者還沒放手、句子還沒定案，不可以先寫進 homeSt——寫進去等於每轉
     一格就真的改一次句子（網址也會跟著跳）。預覽期間的暫時句子放這裡，凡是「讀
     句子來畫東西」的地方一律走 curSt()，放手或取消時歸 null。 */
  var previewSt = null;
  function curSt() { return previewSt || homeSt; }

  function completeSentenceFor(t) {
    // 導覽到某個工具時，把使用者還沒填的格子用該工具自己的第一個標註補滿，
    // 這樣目標頁收到的一律是「完整的一句話」——跟 js/sentence.js 的 open()
    // 同一個規則（優先保留使用者自己選的字，缺的才補）。
    var q = curSt();
    return {
      g: q.g || t.sec,
      s: q.s && hit('s', q.s, t.s) ? q.s : (t.s[0] || ''),
      c: q.c && hit('c', q.c, t.c) ? q.c : (t.c[0] || ''),
      a: q.a && hit('a', q.a, t.a) ? q.a : (t.a[0] || ''),
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

  /* 候選詞面板 ＝ 原型的詞軌 .tokrail。原型有而這裡併入前沒有的兩件：
     · 打字過濾框（原型 #trfilter）——主體有 57 個候選詞，沒有過濾就只能一路捲。
       過濾字面同時比對詞本身與它的同義詞（原型 trackHTML() 就是這樣比的），
       所以打 "abdomen" 也找得到「腹部」。
     · 指向被點詞塊的箭頭（原型 .tokrail::before 的 --caret）——「清單重開在原位」
       要看得見是重開在**哪一格**上。面板本身維持整條寬（句子會折行，詞塊的位置
       每次都不一樣，把面板縮到詞塊底下反而會跳來跳去）。 */
  var panelFilter = '';
  function panelTokensHTML(f) {
    var list = candidates(f, homeSt).filter(function (o) { return o.n > 0 || homeSt[f] === o.w; });
    list.sort(function (x, y) { return (y.n > 0) - (x.n > 0) || y.n - x.n; });
    var q = panelFilter.trim().toLowerCase();
    if (q) list = list.filter(function (o) {
      var e = f === 'g' ? null : facetEntry(f, o.w);
      return (o.label + ' ' + o.w + ' ' + (o.en || '') + ' ' + (e ? (e.al || '') : '')).toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) {
      return '<div class="sent-tok-empty">' +
        (q ? '沒有符合「' + esc(panelFilter.trim()) + '」的詞' : '沒有可選的詞（目前的句子已經篩掉全部候選）') +
        '</div>';
    }
    return list.map(function (o) {
      var cur = homeSt[f] === o.w;
      var e = f === 'g' ? null : facetEntry(f, o.w);
      return '<button type="button" class="sent-tok' + (cur ? ' cur' : '') + '" role="option" ' +
        'aria-selected="' + (cur ? 'true' : 'false') + '" data-act="pick" data-f="' + f + '" ' +
        'data-w="' + esc(o.w) + '" title="' + esc(e ? (e.al || '') : (o.en || '')) + '">' +
        esc(o.label) + '<i>' + o.n + '</i></button>';
    }).join('');
  }

  function renderPanel() {
    var panel = document.getElementById('sentPanel');
    if (!panel) return;
    if (!openFacet) { panel.hidden = true; panel.innerHTML = ''; return; }
    var f = openFacet;
    panel.hidden = false;
    panel.innerHTML =
      '<div class="sent-panel-head">' +
        '<span class="sent-panel-title">選' + FKEY[f] + '</span>' +
        '<input class="sent-panel-filter" id="sentPanelFilter" type="text" autocomplete="off" spellcheck="false" ' +
          'aria-label="打字過濾' + esc(FKEY[f]) + '的候選詞" ' +
          'placeholder="打字過濾' + esc(f === 'g' ? '範圍' : (FPH[f] || '')) + '…" value="' + esc(panelFilter) + '">' +
        '<button type="button" class="sent-panel-close" data-act="closepanel">收起</button>' +
      '</div>' +
      '<div class="sent-panel-body" id="sentPanelBody" role="listbox" aria-label="' + esc(FKEY[f]) + '候選詞">' +
        panelTokensHTML(f) + '</div>';
    var anchor = document.querySelector('#sentRow .f-' + f);
    if (anchor) {
      var ar = anchor.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      var x = ar.left + ar.width / 2 - pr.left;
      panel.style.setProperty('--sent-caret', Math.max(16, Math.min(Math.max(16, pr.width - 16), x)) + 'px');
    }
  }

  function groupList(list) {
    var bySec = {}, order = [];
    list.forEach(function (t) {
      if (!bySec[t.sec]) { bySec[t.sec] = { title: t.secTitle, en: t.secEn, n: 0, groups: {}, order: [] }; order.push(t.sec); }
      var sec = bySec[t.sec];
      sec.n++;
      if (!sec.groups[t.grp]) { sec.groups[t.grp] = []; sec.order.push(t.grp); }
      sec.groups[t.grp].push(t);
    });
    return order.map(function (id) {
      var s = bySec[id];
      return { id: id, title: s.title, en: s.en, n: s.n, groups: s.order.map(function (g) {
        return { name: g, en: s.groups[g][0].grpEn || '', tools: s.groups[g] };
      }) };
    });
  }

  /* 群組標頭按下去要把句子收斂到什麼？——這個群組底下出現最多次的那個「狀況」
     （原型 js/views.js grpTop()）。掃 F.c 的順序決定同票時取誰，跟原型一致。
     GRP_N 是「這個群組總共幾個標的」，用來印出「命中 / 全部 項」。 */
  var GRP_C = {}, GRP_N = {};
  TOOLS.forEach(function (t) {
    GRP_N[t.grp] = (GRP_N[t.grp] || 0) + 1;
    var m = GRP_C[t.grp] = GRP_C[t.grp] || {};
    (t.c || []).forEach(function (c) { m[c] = (m[c] || 0) + 1; });
  });
  function grpTop(g) {
    var m = GRP_C[g] || {}, best = '', n = 0;
    (F.c || []).forEach(function (o) { if ((m[o.w] || 0) > n) { n = m[o.w]; best = o.w; } });
    return best;
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
      '或點一個熱門詞直接填一格；也可以逐格點 ▢ 自己選詞。選好的詞塊點一下會把清單重開在原位，' +
      '長按則不用重開清單就能原地換詞（桌機：按住後 ← →，或聚焦後按 ↑ ↓），按 × 退掉這一格。' +
      '畫面下緣的「← 退一個詞」（等同鍵盤 Backspace）退掉句尾一個詞，「清空句子」回到這裡。' +
      '左邊的「⌕ 說整句」（或直接按 /）可以打字找一整句話，不必逐格點選。' +
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

  /* ---------------- 候選項一列長什麼樣（原型 js/views.js rowHTML()） ----------------
   * 原型一列有六層資訊，repo 併入前只有其中兩層（中文名、英文名）：
   *   ┌ ◆ 流程  急性闌尾炎  Appendicitis          ← .sh-top（型別記號＋型別標籤＋中英名）
   *   └ 依複雜度、族群與膿瘍年齡分流，決定…      ← .sh-desc（-webkit-line-clamp:2）
   *   右側 46px：「＋」展開這一列的完整說明        ← .sent-hit-more
   * 型別用**形狀 ＋ 文字標籤兩者並呈**（原型 KIND_META 的做法，色弱與黑白列印
   * 下仍分得出來），形狀與字面逐字照抄。repo 的 136 筆每一筆都有 kind
   * （實際數過：tool 69／pathway 31／cancer 30／mega 3／mode 3）。
   * 截斷策略也是抄的不是發明的：原型 css/proof.css .row-desc 用
   * -webkit-line-clamp:2，.row.open 解除，沒有「候選少才顯示簡介」這種條件——
   * 18 筆清單因此是 18 列 × 最多兩行，不是一整片牆。
   * 原型第七層那顆「本款重製／嵌入正式版」徽章刻意不搬：那是原型標示自己哪三頁
   * 真的重做過，repo 的 136 個標的全部是真頁面，沒有對應的區別可標。
   * 分類尾巴（secTitle／grp）也不搬進這一列——它們就是這一列的上兩層標頭，
   * 同一組字在同一屏印兩次只會把清單變長。「說整句」的候選項才需要那條尾巴
   * （見 .sai-meta），因為那份清單是平的、沒有分組標頭。 */
  var KIND_META = {
    tool:    { shape: '●', label: '計分', cls: 'k-tool' },
    pathway: { shape: '◆', label: '流程', cls: 'k-pathway' },
    mega:    { shape: '◎', label: '總站', cls: 'k-mega' },
    mode:    { shape: '◐', label: '模式', cls: 'k-mode' },
    cancer:  { shape: '▪', label: '癌別', cls: 'k-cancer' }
  };
  function hitHTML(t) {
    var m = KIND_META[t.kind] || KIND_META.tool;
    var desc = t.desc || '';
    return '<div class="sent-hit-row">' +
      '<a class="sent-hit" href="' + esc(withSentQuery(t.href, completeSentenceFor(t))) + '">' +
        '<span class="sh-top">' +
          '<span class="sh-kind ' + m.cls + '" aria-hidden="true">' + m.shape + '</span>' +
          '<span class="sh-kind-l ' + m.cls + '">' + m.label + '</span>' +
          '<span class="sh-name">' + esc(t.name) + '</span>' +
          '<span class="sh-en">' + esc(t.en) + '</span>' +
        '</span>' +
        (desc ? '<span class="sh-desc">' + esc(desc) + '</span>' : '') +
      '</a>' +
      (desc ? '<button type="button" class="sent-hit-more" data-act="more" aria-expanded="false" ' +
              'aria-label="展開或收合「' + esc(t.name) + '」的完整說明">＋</button>' : '') +
      '</div>';
  }

  function renderResults(list) {
    var results = document.getElementById('sentResults');
    if (!results) return;
    var cs = curSt();
    var any = cs.g || cs.s || cs.c || cs.a;
    if (!any) { results.innerHTML = mainMenuHTML(); return; }
    if (!list.length) {
      results.innerHTML = '<div class="sent-empty">找不到符合的項目——按上面「清空句子」可以回到全部 ' + TOOLS.length + ' 項，不會卡住到不了任何一頁。</div>';
      return;
    }
    var groups = groupList(list);
    results.innerHTML = groups.map(function (g) {
      /* 分區標頭可點（原型 .sec-h data-act="hub"）：把句子的**範圍**收斂到這一區。
         英文小字在上、中文大字在下、右側「N 件」——排列順序照原型。 */
      return '<div class="sent-group">' +
        '<button type="button" class="sent-group-head" data-act="sec" data-g="' + esc(g.id) + '" ' +
          'aria-label="從 ' + esc(g.title) + ' 這一區重新說一次（目前 ' + g.n + ' 件）：只留範圍，其餘詞塊清空">' +
          '<span class="sgh-en">' + esc(g.en) + '</span>' +
          '<span class="sgh-zh">' + esc(g.title) + '</span>' +
          '<span class="sgh-n">' + g.n + ' 件</span>' +
        '</button>' +
        g.groups.map(function (grp) {
          /* 群組標頭可點（原型 .grp-h data-act="swap"）＝**平行換題**：只把「狀況」
             換成這個群組最具代表性的那個詞，句子其他部分不動。數量印成
             「命中 / 全部 項」，全中時只印總數（原型 renderRefs() 同一條規則）。 */
          var total = GRP_N[grp.name] || grp.tools.length;
          var nTxt = grp.tools.length === total ? (total + ' 項') : (grp.tools.length + ' / ' + total + ' 項');
          var top = grpTop(grp.name);
          return '<div class="sent-subgroup">' +
            (grp.name
              ? '<button type="button" class="sent-subgroup-name" data-act="swap" data-f="c" data-w="' + esc(top) + '" ' +
                'aria-label="平行換題：把句子的狀況換成 ' + esc(top) + '，其餘詞塊不動">' +
                '<span class="ssg-zh">' + esc(grp.name) + '</span>' +
                '<span class="ssg-en">' + esc(grp.en) + '</span>' +
                '<span class="ssg-n">' + esc(nTxt) + '</span>' +
                '</button>'
              : '') +
            grp.tools.map(hitHTML).join('') +
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

  /* 面向同義詞餵進索引之前，先把該詞自己的**下位詞**（entry.sub）濾掉。
   *
   * 為什麼要濾（實測出來的根因，不是猜的）：data/facets.js 的狀況詞「癌症」，
   * al 欄位裡列著 30 個癌別的名字（胃癌 食道癌 … 闌尾癌 …），sub 欄位列的是
   * 同一批字。那份清單存在的理由是**面向層**的：打「胃癌」時要找得到上位詞
   * 「癌症」、選了「癌症」時要能連同下位詞一起命中（expand()／hit() 已經在做
   * 這件事）。但索引是**逐工具**建的：30 個癌別工具每一個都標了 c:["癌症",…]，
   * 於是每一顆癌別的 hay 裡都被塞進另外 29 顆癌別的名字。使用者實測到的
   * 「打『闌尾』第三筆跑出肺癌」就是這樣來的——「闌尾」是「闌尾癌」的子字串，
   * 而「闌尾癌」出現在肺癌的 hay 裡。**這不是模糊比對（R_FUZZY）放太寬**：
   * R_FUZZY 要求查詢 ≥3 字，「闌尾」只有 2 字，走的是 R_HAY 精確子字串那一級。
   * 原型 js/say.js 的 al() 沒有這道濾網，因此原型有一模一樣的症狀（實測：原型
   * 打「闌尾」同樣在第三筆給出肺癌，14 筆結果與 repo 逐筆相同）。
   *
   * 濾掉的準則是資料自己講的，不是我挑的字：只丟 al ∩ sub。三個詞表 1276 個
   * al 詞元裡符合的有 27 個（癌症 25 個、衰竭←器官衰竭、缺氧←低血氧），
   * 其餘 1249 個同義詞原樣留著。被丟掉的字沒有因此搜不到——它們本來就是各自
   * 獨立的詞條，工具若真的標了它，那個字就在 t.c.join(' ') 裡。 */
  var alSayCache = {};
  function alOf(f, w) {
    var e = facetEntry(f, w);
    if (!e) return '';
    var ck = f + ' ' + (e.w || w);
    if (alSayCache[ck] != null) return alSayCache[ck];
    var subs = {};
    (e.sub || []).forEach(function (x) { subs[x] = true; });
    alSayCache[ck] = splitWords(e.al).filter(function (tok) { return !subs[tok]; }).join(' ');
    return alSayCache[ck];
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
  /* ↑ ↓ 換選取項時把它捲進可視範圍（原型 js/say.js scrollSel()）——候選項最多
     14 筆、清單本身 max-height:60vh 會自己捲，沒有這一段的話按到第 5 筆之後
     選取框就跑到看不見的地方去了。 */
  function scrollSaySel() {
    var el = document.querySelector('.sent-ask-item.sel');
    if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { el.scrollIntoView(false); } }
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

  /* ================================================================
   * 平行換題：長按已選定的詞塊 → 字輪，原地循環替換這一格的詞
   * ================================================================
   * 原型 index.html 檔頭列的互動，這裡逐條對上（實作抄自原型 js/sentence.js
   * startWheel()／paint()／endWheel() 與它的 pointerdown／keydown 兩個監聽）：
   *   · 點已選定的詞塊 → 清單重開在原位，可直接原地換詞。（併入前就有，實測
   *     確認：面板開在句子列正下方、目前的詞標成 .cur、點另一個詞真的換掉。
   *     這一輪只補上指向該詞塊的箭頭與打字過濾框，見 renderPanel()。）
   *   · 長按已選定的詞塊（桌機：按住後方向鍵 ← →；鍵盤：Tab 聚焦後 ↑ ↓）→
   *     不用重新展開清單，直接原地循環替換這一格的詞。（這一段是新的。）
   *
   * 「下游依賴它的詞塊」怎麼處理——照原型 js/sentence.js set()：換完之後如果
   * 句子指不到任何東西，就由句尾往前（動作 → 狀況 → 主體 → 範圍）把**不是這次
   * 換的那幾格**清掉，一格一格清到句子重新指得到東西為止。實測記錄：repo 這邊
   * 這條規則多半不會觸發，因為候選詞（candidates／siblings）本來就已經濾掉
   * 「選了會變成 0 件」的詞；它是給 ?sent= 網址帶進來的怪句子與日後資料改版
   * 用的安全網，不是每次換詞都會動到別格。 */
  var LONG_PRESS_MS = 420;
  var wh = null;

  function siblings(f) {
    return candidates(f, homeSt).filter(function (o) { return o.n > 0; });
  }

  function applyWord(f, w) {
    homeSt[f] = w;
    ['a', 'c', 's', 'g'].forEach(function (k) {
      if (k === f) return;
      if (matches(homeSt).length) return;
      if (homeSt[k]) homeSt[k] = '';
    });
  }

  /* 字輪的一行提示（原型 #whhint）：平時講「長按可原地換詞」，轉動中換成
     「上下滑（或 ← →）…放開定案」。句子還是空的時候不出現。 */
  function renderWhHint(text) {
    var el = document.getElementById('sentWhHint');
    if (!el) return;
    if (text) { el.hidden = false; el.textContent = text; return; }
    var any = homeSt.g || homeSt.s || homeSt.c || homeSt.a;
    el.hidden = !any;
    if (any) el.textContent = '長按詞塊可原地換詞（桌機：按住後 ← →，或聚焦後按 ↑ ↓）· Backspace 退掉句尾一個詞';
  }

  function startWheel(btn, f) {
    var sib = siblings(f);
    if (sib.length < 2) return false;
    var chip = btn.closest('.sent-chip');
    if (!chip) return false;
    var idx = 0;
    for (var i = 0; i < sib.length; i++) if (sib[i].w === homeSt[f]) idx = i;
    chip.classList.add('wheeling');
    btn.innerHTML = '<span class="wh-vp"><span class="wh-stack">' +
      sib.map(function (o, i2) {
        return '<span class="wh-it' + (i2 === idx ? ' cur' : '') + '">' + esc(o.label) + '</span>';
      }).join('') + '</span></span>';
    var stack = btn.querySelector('.wh-stack');
    var itH = (btn.querySelector('.wh-it').getBoundingClientRect().height) || 20;
    wh = { btn: btn, f: f, sib: sib, idx: idx, base: idx, stack: stack, itH: itH, chip: chip, moved: false };
    renderWhHint('字輪：上下滑（或 ← →）在同面向的兄弟詞之間跳，放開定案；Esc 取消。');
    paintWheel();
    return true;
  }

  function paintWheel() {
    if (!wh) return;
    wh.stack.style.transform = 'translateY(' + (-(wh.idx - 1) * wh.itH) + 'px)';
    [].slice.call(wh.stack.querySelectorAll('.wh-it')).forEach(function (el, i) {
      el.classList.toggle('cur', i === wh.idx);
    });
    // 轉到哪一格，畫面就預覽那一格的結果（原型 paint() → renderStage()）。
    previewSt = { g: homeSt.g, s: homeSt.s, c: homeSt.c, a: homeSt.a };
    previewSt[wh.f] = wh.sib[wh.idx].w;
    var list = matches(previewSt);
    var b = document.querySelector('#sentPoint .sent-point-n b');
    if (b) b.textContent = list.length;
    /* 件數是即時的，指向行後半那句「再選一個狀況可從 16 縮到 1」卻是轉動前算的，
       兩句擺在一起會互相打臉（螢幕同時說 3 件與 16 件）。轉動中換成一句誠實的
       狀態字，放開後 renderHome() 會把真正的提示算回來。 */
    var hintEl = document.querySelector('#sentPoint .sent-point-hint');
    if (hintEl) hintEl.textContent = '字輪預覽中 · 放開定案';
    renderResults(list);
  }

  function endWheel(commit) {
    if (!wh) return;
    var f = wh.f, w = wh.sib[wh.idx].w, moved = wh.moved;
    wh.chip.classList.remove('wheeling');
    wh = null;
    previewSt = null;
    if (commit && moved) applyWord(f, w);
    renderHome();
  }

  document.addEventListener('pointerdown', function (e) {
    if (!sentenceOn() || !isHome()) return;
    var btn = e.target.closest && e.target.closest('#sentRow .sent-chip .sc-w');
    if (!btn) return;
    var f = btn.getAttribute('data-f');
    if (!f) return;
    var y0 = e.clientY, pid = e.pointerId;
    btn._wheeled = false;
    var timer = setTimeout(function () {
      try { btn.setPointerCapture(pid); } catch (err) { /* 舊瀏覽器沒有指標捕捉，改由 document 上的監聽收尾 */ }
      if (!startWheel(btn, f)) cleanup();
    }, LONG_PRESS_MS);
    function mv(ev) {
      if (!wh) {
        // 還沒進字輪就先滑動了 → 使用者是要捲頁面，不是要長按
        if (Math.abs(ev.clientY - y0) > 12) { clearTimeout(timer); cleanup(); }
        return;
      }
      if (ev.cancelable) ev.preventDefault();
      var n = wh.base - Math.round((ev.clientY - y0) / Math.max(18, wh.itH));
      n = Math.max(0, Math.min(wh.sib.length - 1, n));
      if (n !== wh.idx) { wh.idx = n; wh.moved = true; paintWheel(); }
    }
    function up() {
      clearTimeout(timer);
      if (wh) { btn._wheeled = true; endWheel(true); }
      cleanup();
    }
    function cleanup() {
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    }
    document.addEventListener('pointermove', mv, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  });

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
    renderWhHint('');
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
      '<div class="sent-wh-hint" id="sentWhHint" hidden></div>' +
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
    if (act === 'open') {
      // 剛剛才用字輪換完詞的那一下放手，不可以順便把清單也展開（原型的 _wheeled 旗標）
      if (el._wheeled) { el._wheeled = false; return; }
      openFacet = (openFacet === f) ? null : f;
      panelFilter = '';
      if (sayOpen) showSay(false);
      renderHome();
      return;
    }
    if (act === 'closepanel') { openFacet = null; panelFilter = ''; renderPanel(); return; }
    if (act === 'more') {
      e.preventDefault();
      var row = el.closest('.sent-hit-row');
      if (!row) return;
      var on = row.classList.toggle('open');
      el.textContent = on ? '－' : '＋';
      el.setAttribute('aria-expanded', on ? 'true' : 'false');
      return;
    }
    if (act === 'sec') {
      /* 分區標頭＝「從這一區重新說一次」：只留範圍，其餘詞塊清掉，然後回到頁首。
         這是原型 js/views.js .sec-h（data-act="hub"）落到 js/sentence.js 的
         `set({g: …, s:'', c:'', a:'', t:''})` ＋ `window.scrollTo(0,0)`，逐字同一件事。
         按下去有可能讓件數**變多**（例：我遇到腹部的感染 6 件 → 腹部急症 18 件），
         那是這一顆本來的語意（跳進這個範圍重來），不是收斂失效——所以 aria-label
         把「其餘詞塊會清空」講出來，不讓使用者按下去才發現詞不見了。 */
      e.preventDefault();
      var gid = el.getAttribute('data-g');
      homeSt = { g: gid, s: '', c: '', a: '' };
      openFacet = null; panelFilter = '';
      if (sayOpen) showSay(false);
      renderHome();
      try { window.scrollTo(0, 0); } catch (err) {}
      return;
    }
    if (act === 'swap') {
      // 平行換題：只換一個詞塊，句子其他部分不動（原型 js/sentence.js 的 swap 分支）
      e.preventDefault();
      var sw = el.getAttribute('data-w');
      if (!sw) return;
      applyWord(f, sw);
      openFacet = null;
      renderHome();
      return;
    }
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
      if (homeSt[f] === w) homeSt[f] = ''; else applyWord(f, w);
      openFacet = null; panelFilter = '';
      renderHome();
      return;
    }
    if (act === 'clear') { homeSt = { g: '', s: '', c: '', a: '' }; openFacet = null; panelFilter = ''; if (sayOpen) showSay(false); renderHome(); return; }
  });

  document.addEventListener('input', function (e) {
    if (!e.target) return;
    if (e.target.id === 'sentAskIn') { renderSay(e.target.value); return; }
    /* 候選詞面板的過濾框：只重畫詞的部分，不重畫整個面板——重畫整個面板會把
       <input> 換成新節點，使用者打到一半的焦點與游標位置就沒了。 */
    if (e.target.id === 'sentPanelFilter' && openFacet) {
      panelFilter = e.target.value;
      var body = document.getElementById('sentPanelBody');
      if (body) body.innerHTML = panelTokensHTML(openFacet);
      return;
    }
  });
  document.addEventListener('keydown', function (e) {
    var onHome = !!document.getElementById('sentHome'), onTrail = !!document.getElementById('sentTrail');
    if (!onHome && !onTrail) return;
    var typing = /^(input|textarea|select)$/i.test(e.target.tagName || '') || e.target.isContentEditable;

    /* 字輪轉動中：← ↑ 上一個、→ ↓ 下一個、Enter／空白定案、Esc 取消
       （鍵位照原型 js/sentence.js 的 keydown，四個方向鍵都吃）。 */
    if (wh) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); wh.idx = Math.max(0, wh.idx - 1); wh.moved = true; paintWheel(); return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); wh.idx = Math.min(wh.sib.length - 1, wh.idx + 1); wh.moved = true; paintWheel(); return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endWheel(true); return; }
      if (e.key === 'Escape') { e.preventDefault(); endWheel(false); return; }
    }
    /* 鍵盤路徑：Tab 聚焦到詞塊之後按 ↑ ↓ 直接原地換掉這一格，不必先長按也不必
       展開清單（原型同一段）。換完把焦點放回同一格，可以連按。 */
    if (onHome && !typing && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      var cw = e.target.closest && e.target.closest('#sentRow .sent-chip .sc-w');
      if (cw) {
        var kf = cw.getAttribute('data-f');
        var sib = siblings(kf);
        if (sib.length > 1) {
          var ci = 0;
          for (var si = 0; si < sib.length; si++) if (sib[si].w === homeSt[kf]) ci = si;
          ci = e.key === 'ArrowUp' ? Math.max(0, ci - 1) : Math.min(sib.length - 1, ci + 1);
          e.preventDefault();
          applyWord(kf, sib[ci].w);
          renderHome();
          var again = document.querySelector('#sentRow .sent-chip.f-' + kf + ' .sc-w');
          if (again) { try { again.focus(); } catch (err) {} }
          return;
        }
      }
    }

    if (!sayOpen) {
      // 「/」直接叫出說整句的輸入框（原型 js/say.js 同一條，同樣的打字防護）
      if (e.key === '/' && !typing) { e.preventDefault(); showSay(true); return; }
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
    if (e.key === 'ArrowDown') { e.preventDefault(); saySel = Math.min(sayCur.length - 1, saySel + 1); renderSay(document.getElementById('sentAskIn').value); scrollSaySel(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); saySel = Math.max(0, saySel - 1); renderSay(document.getElementById('sentAskIn').value); scrollSaySel(); return; }
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
