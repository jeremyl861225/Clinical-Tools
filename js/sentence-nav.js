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
 * 目標頁的句子列當時是**唯讀**的完成式句子＋一句明講「這裡不會再長」的
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
 *  10. 「說整句」查得到**藥名**（本輪新增，見下面「藥名索引」那一大段）：
 *      原本打 `tazocin` 是 0 筆——136 個標的裡沒有一個是藥。索引在執行期
 *      從 repo 既有的兩個資料檔建出來（data/drugs/index.js 1111 筆、
 *      data/antibiotics/drugs.js 155 筆），**不新增任何靜態藥名清單檔**：
 *      原型那份 drugnames.js（126 筆手抄）刻意沒搬，理由與第 9 條同源——
 *      同一件事有兩個真相來源，日後一定會漂移。兩個資料檔合計 677 KB，
 *      所以是**打字才抓**，首頁載入不多付一個位元組。藥名與 136 個標的
 *      分成三組各自帶標頭與筆數（工具與流程／抗生素／藥物資料庫），
 *      讓人一眼看得出這是兩種不同的東西。三格造句（主體／狀況／動作）
 *      完全不碰——1266 個藥名塞進候選詞面板只會變成一片藥名牆。
 *
 *  12. **查詢深入各分頁**（本輪新增）：使用者原話——「請將查詢深入各分頁
 *      （例如若查詢『腹腔內的感染查抗生素』，可以導引到『抗生素指引』的
 *      『依部位』的『腹腔內感染』）」。句子收斂完只停在頁面、停不進頁內那一格，
 *      是先前一直記著沒做的「頁內子目標」。這一輪補上，分兩條路：
 *        · 「說整句」直接查得到頁內項目（1353 筆），候選項標出完整路徑
 *          「抗生素指引 › 依部位 › 腹腔內感染 IAI」——見 buildSubIndex()。
 *        · 候選清單每一列多一顆「10 個感染部位 ⌄」，攤開就是那一頁的下一層
 *          ——見 SUBTARGET_OF／subsInlineHTML() 的長註解，裡面寫了為什麼
 *          **不做**「句子自動幫你挑一格」（實測是假精準，量過的數字在那裡）。
 *      四個資料來源全部是 repo 既有的真檔案，執行期建索引，
 *      **不新增任何靜態子目標清單檔**（原型 data/sub-*.js 那 323 筆刻意沒搬，
 *      理由與第 10 條同源）。
 *
 *  11. 六格從「值班常用句」改成**分類入口**（本輪新增，取代第 1 條的一半）：
 *      使用者原話——「取消『值班常用句 · 點一下就把句子說完一半』，並設計成
 *      並非把句子說完一半，而是如原主畫面方磚一樣，點選後顯示所有條目列表」。
 *      所以第 1 條裡「值班常用句六格」那一半已經被取代掉了：標頭那行、每格
 *      上緣的「說『…』」預告、以及點下去寫 homeSt 的行為，三件一起拿掉。
 *      現在點一格＝句子一個字都不動，底下換成那一類的完整清單（沿用候選清單
 *      同一套版型）。細節見下面 TILE／tileViewHTML() 的長註解，包含：
 *      哪一格對到哪一批標的、藥物資料庫那格為什麼只能直接連過去、
 *      以及「範圍」格的入口怎麼補回來（tilescope 那顆）。
 *      第 1 條的另外兩件（三軌熱門詞、「怎麼用？」摺疊）維持不變。
 *
 *  13. **句子直接指到分級系統那一格**（本輪新增，第 12 條沒做完的那一半）：
 *      使用者原話——「請將分類與分級系統中的每個頁面（包含 AAST EGS 的每個
 *      項目的表格）都可以在句子中找到（例如我遇到闌尾炎，我要術中分級）」。
 *      第 12 條當時**刻意不做**「句子自動幫你挑一格」，理由是量過會假精準；
 *      這一輪不是把那個判斷推翻，是把它的前提解掉——問題出在「facets.js 的
 *      詞表是為了選頁面標的，不是為了選頁內那一格」，所以這一輪就**把頁內
 *      那一格的標註補上**（data/facets.js 新增 FACETS.classif，33 套分級系統
 *      ＋ AAST EGS 的 16 個疾病各自標 s／c，只有面向詞、沒有臨床文字）。
 *      有標註的來源才做句子過濾，沒標註的（抗生素 209 筆、處方集 1111 筆）
 *      一筆都不濾，行為與這一輪之前逐字相同——那一段實測數字仍然成立。
 *      連帶三件：
 *        · 動作面向新增「查分級系統」（別名收「術中分級」「分級標準」「用哪一套」
 *          等口語；排在 a 陣列最後面，不搶既有詞的別名）。
 *        · AAST EGS 的 16 個疾病沒有深層連結（那一頁只認 #sys= 與 #tab=），
 *          改走 `?aast=<k>#sys=aast`，由 applyAastParam() 在該頁切下拉選單——
 *          **一個字都沒有動 tools/classifications.html**。
 *        · 句子把頁內篩窄時自動攤開那一層，並且只抓 classifications.html
 *          一個來源（178 KB）而不是四個來源合計 911 KB，見 ensureSubIndex()
 *          的 only 參數與 autoloadSubsFor()。
 *
 *  15. **13 個分頁式頁面的頁內分頁**（本輪新增，第 12 條刻意留白的最後一塊）：
 *      第 12 條當時明講「分頁名稱只存在各自的 HTML 裡，要嘛多 13 次 fetch，
 *      要嘛硬寫一份對照表」，所以沒做。使用者裁決要補，走的是前者：
 *      fetch ＋ DOMParser 現場解析，與 classif 那一筆同一個模式（見 parseTabs()）。
 *      68 個分頁全部由那 13 頁自己的 HTML＋JS 讀出來——**沒有任何寫死的分頁名稱
 *      或 hash 對照表**（TAB_PAGES 那串只寫「要去抓誰」的 facets key，網址向
 *      facets.js 要）。hash 形式逐頁不同（7 頁裸名 `#dx`、6 頁 `#tab=spon`），
 *      一律以那一頁自己的 JS 判定，再用「窗格元素存不存在」驗一次；
 *      驗不過就是 0 筆，不會產生「點了跳到頁首」的假連結。
 *      974 KB 排在**第二波**（見 startWave2()）：第一波四個來源落地之後才開始，
 *      一頁一頁串著抓、到一筆併一筆，首頁打字前仍然一個位元組都不多抓。
 *
 *  16. **內頁的句子軌跡改成可編輯**（本輪新增）：使用者原話「改成點選這邊則
 *      可以編輯句子（可以只改一個輸入匡）」。上面第 41 行那句「目標頁的句子列
 *      因此是唯讀的」以及畫面上「句子在這一頁不會再變長」都已經不成立，兩處
 *      一起改掉。實作**一行都沒有複製首頁那一套**：展開區放的就是同名的
 *      #sentRow／#sentPanel，畫它們的是同一支 renderRow()／renderPanel()，
 *      狀態是同一個 homeSt，點擊與鍵盤走同一批 data-act 分支。內頁與首頁只差
 *      兩件事，各自寫在自己的函式上：改完往哪裡走（trailGo()：句子指到哪裡就
 *      去哪裡，四種情況一條規則）、以及「只改一格＝真的只改那一格」
 *      （act==='pick' 的內頁分支：不套用 applyWord() 那條由句尾往前清的規則）。
 *
 *  14. **選完詞之後把句子列還原到可視範圍內**（本輪新增）：第 12 條之前為了
 *      「鍵盤把候選詞面板擠掉」加的那段自動捲動（clampPanelBody() 的
 *      `a < 160` 分支）只捲上去、沒有捲回來，於是每選一格句子列就往上跑一截。
 *      見 clampPanelBody()／closePanel() 附近的 scrollAnchor 那一段。
 *
 *  17. **「說整句」查得到覆蓋菌種**（本輪新增）：使用者原話——「請讓我在
 *      『說整句』的查詢欄可以查詢『esbl』／『原蟲』或某類菌種即可查詢到所有有
 *      該菌種感受性的 badge 的抗生素（效果如同點選藥物敏感性的徽章）」。
 *      這一輪之前打 `esbl`／`原蟲` 都是 0 筆——第 10 條建的藥名索引只收藥自己的
 *      身分（學名／中文品名／商品名／藥理次分類），一個菌名都沒有。
 *      新增的是**第六組**候選（依覆蓋菌種），索引在執行期從已經載入的
 *      window.DRUGS 的 cov 欄位現場算，四組標籤表向 window.COV_LABELS*
 *      （data/antibiotics/regimens.js，本來就是 SUB_FILES 的第三個來源）要，
 *      **不新增任何靜態菌名清單檔**，首頁打字前一樣一個位元組都不多抓。
 *      三件關鍵決定寫在下面「17. 覆蓋菌種索引」那一整段：只收強效／涵蓋／變異
 *      三級（`no` 收進來會讓打 MRSA 跑出一堆對 MRSA 無效的藥）、
 *      為什麼不是把菌名塞進藥的 hay（會跟藥名命中混成一堆且抹掉分級）、
 *      以及徽章為什麼直接沿用藥卡那一套 `.cov-tag` class。
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
    /* `#site=N` 是本檔自己產生的深層形式（見 deepLanding()），facets.js 裡沒有
       這個 href，落到下面的比對會變成「這一頁對到藥物查詢」——軌跡的
       trailHint()／trailGo() 會因此判成「不是本頁」。它就是「依部位」那一個模式
       指到某一格，這裡折回去。`#bac=`／`#drug=` 刻意不動：這一輪沒有升級那兩個
       落點（量過沒有鑑別力，見 deepLanding()），順手改它們等於在這一輪之外
       搬動既有行為。 */
    if (/^#site=\d+$/.test(hash || '')) {
      for (var si = 0; si < mine.length; si++) if (mine[si].k === 'abx-mode-empiric') return mine[si];
    }
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
  var panelList = [];        // 目前過濾後、實際畫在面板上的候選詞（Enter／↑↓ 都吃這一份）
  var panelSel = 0;          // 鍵盤游標落在第幾個候選詞
  var panelWantsFocus = false;

  /* 過濾要吃**別名**，不是只比對畫出來的那幾個字：使用者打「肚子」要命中「腹部」、
     打 "abdomen" 也要命中。別名字串來自 data/facets.js 的 al 欄位（那個檔正在被
     另一個人擴充，這裡只讀不寫，他加的字會自動生效，不必改這裡）。 */
  function panelHay(f, o) {
    var e = f === 'g' ? null : facetEntry(f, o.w);
    return (o.label + ' ' + o.w + ' ' + (o.en || '') + ' ' + (e ? (e.al || '') : '')).toLowerCase();
  }
  function panelTokensHTML(f) {
    var all = candidates(f, homeSt);
    var list = all.filter(function (o) { return o.n > 0 || homeSt[f] === o.w; });
    list.sort(function (x, y) { return (y.n > 0) - (x.n > 0) || y.n - x.n; });
    var q = panelFilter.trim().toLowerCase();
    if (q) list = list.filter(function (o) { return panelHay(f, o).indexOf(q) >= 0; });
    panelList = list;
    if (panelSel >= list.length) panelSel = list.length - 1;
    if (panelSel < 0) panelSel = 0;
    if (!list.length) {
      /* 一個都沒有的時候，「找不到」有兩種完全不同的原因，講錯會讓人以為詞表沒收：
         (a) 真的沒有這個詞；
         (b) 詞有，但接在目前這句話後面會變成 0 件，所以本來就沒被列出來。
         (b) 要把對到的詞唸出來，並講清楚該怎麼辦（退一個詞），不能含混說找不到。
         實測案例：句子是「腹部 + 胰臟炎」時打「膽」——膽道確實存在，只是配不上。 */
      if (!q) return '<div class="sent-tok-empty">沒有可選的詞（目前的句子已經篩掉全部候選）</div>';
      var ruled = all.filter(function (o) {
        return o.n === 0 && homeSt[f] !== o.w && panelHay(f, o).indexOf(q) >= 0;
      });
      if (ruled.length) {
        var names = ruled.slice(0, 3).map(function (o) { return o.label; }).join('、');
        return '<div class="sent-tok-empty">「' + esc(panelFilter.trim()) + '」對到了 ' +
          esc(names) + (ruled.length > 3 ? ' 等 ' + ruled.length + ' 個詞' : '') +
          '，但接在目前這句話後面會變成 0 件——先退掉一個詞再選。</div>';
      }
      return '<div class="sent-tok-empty">找不到符合「' + esc(panelFilter.trim()) +
        '」的詞——換個講法，或按 Esc 收起。</div>';
    }
    return list.map(function (o, i) {
      var cur = homeSt[f] === o.w;
      var e = f === 'g' ? null : facetEntry(f, o.w);
      return '<button type="button" class="sent-tok' + (cur ? ' cur' : '') + (i === panelSel ? ' sel' : '') +
        '" role="option" aria-selected="' + (i === panelSel ? 'true' : 'false') + '" ' +
        'data-act="pick" data-f="' + f + '" data-w="' + esc(o.w) + '" ' +
        'title="' + esc(e ? (e.al || '') : (o.en || '')) + '">' +
        esc(o.label) + '<i>' + o.n + '</i></button>';
    }).join('');
  }

  /* 面板收起時，焦點要還給原來的那一格（空格插槽或已選詞塊），不可以掉回 <body>
     ——掉回 body 的話鍵盤使用者按 Esc 之後就得重新 Tab 一輪才回得到句子。 */
  function focusFacetControl(f) {
    var el = document.querySelector('#sentRow .sent-chip.f-' + f + ' .sc-w') ||
             document.querySelector('#sentRow .sent-slot.f-' + f);
    if (el) { try { el.focus(); } catch (e) {} }
  }

  /* 鍵盤彈出來會把面板往上擠。visualViewport.height 在鍵盤彈出時會縮小，
     這裡用它把候選詞區的高度改成「面板頭部下緣到可視區底部」的剩餘空間——
     清單自己變矮、自己捲，而不是整段被推到鍵盤底下看不到。沒有鍵盤時算出來的
     剩餘空間很大，會被 46vh（＝ CSS 原本的值）壓回去，畫面跟併入前一樣。
     只寫 inline max-height 這一個屬性，面板一拆掉就跟著消失。 */
  var vvBound = false;
  var MIN_BODY = 96;
  function clampPanelBody(allowScroll) {
    var panel = document.getElementById('sentPanel');
    var body = document.getElementById('sentPanelBody');
    if (!panel || panel.hidden || !body) return;
    var vv = window.visualViewport;
    if (!vv) return;
    function avail() { return vv.height - (body.getBoundingClientRect().top - (vv.offsetTop || 0)) - 12; }
    var a = avail();
    /* 小螢幕實測（390×844，把可視高縮到 450 模擬鍵盤佔掉下半）：面板本身落在
       y≈337，剩下的空間裝不下清單的最小高度，底部會掉到可視區外面。
       這種時候先把面板捲到可視區頂端再算一次——句子列會被捲出去，但使用者這一刻
       正在挑詞，看得見「在挑哪一格」的是面板標題（「選主體」）與過濾框，不是句子。
       只有在真的擠不下（<160px）時才捲，而且只在「剛打開」與「鍵盤高度變了」兩個
       時機捲，使用者自己捲動時不搶（scroll 事件傳 false）。 */
    if (allowScroll && a < 160) {
      try { window.scrollBy(0, panel.getBoundingClientRect().top - 8); } catch (e) {}
      panelScrolled = true;   // ← 捲上去了就記一筆，面板收起時要還原（見 trackPanelScroll()）
      a = avail();
    }
    var cap = window.innerHeight * 0.46;   // CSS 原本的 max-height:46vh
    body.style.maxHeight = Math.max(MIN_BODY, Math.min(Math.round(a), Math.round(cap))) + 'px';
  }
  function onVVResize() { clampPanelBody(true); }
  function onVVScroll() { clampPanelBody(false); }
  function bindVV() {
    if (vvBound || !window.visualViewport) return;
    window.visualViewport.addEventListener('resize', onVVResize);
    window.visualViewport.addEventListener('scroll', onVVScroll);
    vvBound = true;
  }
  function unbindVV() {
    if (!vvBound || !window.visualViewport) return;
    window.visualViewport.removeEventListener('resize', onVVResize);
    window.visualViewport.removeEventListener('scroll', onVVScroll);
    vvBound = false;
  }

  /* ---------------- 面板收起之後把句子列還原回去（第 8 輪） ----------------
   * 上面那段 `a < 160 就先把面板捲到可視區頂端` 解掉的是真問題（390×844 模擬
   * 鍵盤時不捲的話候選詞只看得見 3 個），但它**只捲上去、沒有捲回來**：
   * 使用者選完詞、鍵盤收起，捲動位置還留在原地，句子列被推到畫面外，
   * 每選一格就再累積一次。使用者原話：「請將句子本身放在頁面上方（目前頁面會
   * 自動往下跑，每次都要手動往上拉到句子的地方）」。
   *
   * 兩種做法之中選了「記住開面板前的位置、收起時還原」，理由：
   *   · 還原的是**句子列在視窗裡的相對位置**（不是絕對 scrollY）——鍵盤彈出、
   *     候選清單長短不同都會改變版面高度，記絕對 scrollY 會還原到別的地方。
   *     所以記的是開面板當下 `#sentRow` 的 getBoundingClientRect().top，
   *     收起時把它調回同一個值，使用者看到的就是「跟我按下去之前一模一樣」。
   *   · 另一種做法「收起後一律把句子列捲到可視區頂端」會在使用者本來就在
   *     畫面頂端（scrollY=0，句子列 top=196、下面還看得到 app-header）時
   *     反而把畫面往下推一截——那是新的位移，不是還原。
   * 沒有改成 position:sticky：句子列是 clamp(18px,4.4vw,28px) 的大字襯線，
   * 選滿三格會變兩到三行；實測 390×844 選滿三格時 #sentRow 高 96px＝
   * 視窗高度的 11.4%，永久釘住等於每一屏都先扣掉一成多，不划算。
   *
   * 只有「我們自己捲過」（panelScrolled）才還原——沒有鍵盤的桌機／平板尺寸
   * 全程不捲，也就不會多做一次沒必要的捲動。 */
  var panelAnchorTop = null;   // 開面板當下句子列在視窗裡的位置
  var panelScrolled = false;   // 這一輪有沒有被 clampPanelBody() 捲過
  var panelLastFacet = null;   // 上一次 render 時面板是開在哪一格（偵測開／關的轉折）

  /* 參數 top 一定要用**傳的**，不可以在函式裡讀 panelAnchorTop：這一支是排在
     下一幀跑的，而 trackPanelScroll() 排完就同步把 panelAnchorTop 歸零了，
     讀變數會拿到 null 然後整支靜悄悄不做事（實測就是這個坑：還原完全沒發生，
     句子列停在 top=-45）。 */
  function restoreSentenceRow(top) {
    var el = document.getElementById('sentRow');
    if (!el || top == null) return;
    var y0 = window.pageYOffset || document.documentElement.scrollTop || 0;
    var y = Math.max(0, Math.round(y0 + (el.getBoundingClientRect().top - top)));
    try { window.scrollTo(0, y); } catch (e) { return; }
    /* 還原之後再確認一次：這段期間版面可能整個變矮（候選清單收掉、結果變少），
       瀏覽器會把 scrollTo 夾到文件底部，句子列還是可能落在視窗外。
       那種時候才退而求其次，把句子列直接捲到可視區頂端。 */
    var t = el.getBoundingClientRect().top;
    if (t < 0 || t > window.innerHeight - 24) {
      try { el.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e2) {}
    }
  }

  function trackPanelScroll() {
    var f = openFacet;
    if (!panelLastFacet && f) {
      // null → 某一格＝剛打開。中途從主體換到狀況（f 換值但沒關過）不重記，
      // 這樣一路換下去最後收起時還原的仍是「最初按下去之前」那個位置。
      var el = document.getElementById('sentRow');
      panelAnchorTop = el ? el.getBoundingClientRect().top : null;
      panelScrolled = false;
    } else if (panelLastFacet && !f) {
      if (panelScrolled) {
        /* 排到下一幀再還原：這一支是在 renderHome() 中段被呼叫的
           （renderPanel 之後還有 renderPointer／renderResults 會改變版面高度），
           當場捲會被隨後的版面變動夾掉。 */
        var top0 = panelAnchorTop;
        var run = function () { restoreSentenceRow(top0); };
        if (window.requestAnimationFrame) requestAnimationFrame(run); else setTimeout(run, 0);
      }
      panelAnchorTop = null; panelScrolled = false;
    }
    panelLastFacet = f;
  }

  function renderPanel() {
    var panel = document.getElementById('sentPanel');
    if (!panel) return;
    trackPanelScroll();
    if (!openFacet) { panel.hidden = true; panel.innerHTML = ''; unbindVV(); return; }
    var f = openFacet;
    /* 這一支每次 renderHome() 都會整段重畫 innerHTML，輸入框會被換成新節點。
       正在打字時（例如按了某一格的 ×）不可以把焦點與游標位置弄掉，先記下來。 */
    var act0 = document.activeElement;
    var hadFocus = !!(act0 && act0.id === 'sentPanelFilter');
    var caret = hadFocus ? act0.selectionStart : null;
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
    /* 打開面板＝直接可以打字。使用者實測回報「三個輸入框只能選取」，量到的原因是
       面板開了、輸入框也畫出來了，但 document.activeElement 還停在 <body>——
       手機上等於要先看到那個小框、再點一次才打得了字。**原型也是這個行為**
       （實測原型的 #trfilter 焦點同樣是 BODY），所以這一處是刻意做得比原型好。
       focus() 必須留在使用者那一下點擊的同步呼叫鏈裡（click → renderHome →
       renderPanel → focus），不可以包 setTimeout：iOS Safari 只在使用者手勢的
       同步過程中才肯把軟體鍵盤叫出來，延後就變成「焦點有了、鍵盤沒出來」。 */
    var inp = document.getElementById('sentPanelFilter');
    if (inp && (panelWantsFocus || hadFocus)) {
      try {
        inp.focus({ preventScroll: true });
        if (caret != null) inp.setSelectionRange(caret, caret);
        else inp.setSelectionRange(inp.value.length, inp.value.length);
      } catch (e) { try { inp.focus(); } catch (e2) {} }
    }
    panelWantsFocus = false;
    bindVV();
    clampPanelBody(true);   // 剛打開：擠不下就把面板捲上來
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
    /* 六大分類攤開時，句子的狀態沒有改變——這一行如果照原本印「句子還是空的 ·
       空句子就是主選單」，畫面上就會出現「主選單」三個字配著一整份分類清單，
       自相矛盾。改印一句把兩件事都講清楚的話：現在在瀏覽誰、句子沒被動過。 */
    if (openTile) {
      var TL = tileLabel(openTile);
      point.innerHTML =
        '<span class="sent-point-n">正在瀏覽「' + esc(TL.zh) + '」的全部 <b>' + tileList(openTile).length + '</b> 件</span>' +
        '<span class="sent-point-hint">句子沒有被改動 · 按下面「← 回六大分類」或 Esc 回去</span>';
      /* 這裡**不再**放第二顆「回六大分類」：清單本體最上面那條工具列已經有一顆
         （.sent-tile-bar 的 .sent-tile-back），兩顆同名按鈕上下相隔不到 60px，
         實測 390×844 截圖看起來像壞掉。指向行維持純敘述，動作只留一個地方。 */
      return;
    }
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

  /* ---------------- 六大分類：六格入口 ----------------
   * 文案（中文名／英文名／描述）一律現場從 index.html 既有的六張 .hub-card
   * 讀出來（data-label／data-en／data-sub），不在這裡另抄一份——正式版改了文案，
   * 造句設計這邊跟著變，不會有兩份對不上的字。
   *
   * ---------------------------------------------------------------
   * 這六格做什麼（改過一次，這是第二版）
   * ---------------------------------------------------------------
   * 第一版：這六格叫「值班常用句」，按下去會**把句子說完一半**（四格填範圍、
   * 兩格填動作），每格上緣還印一行「說『在 腹部急症 …』」預告它會填什麼。
   * 使用者要求取消：不要幫他把句子說一半，要**跟正式版首頁的方磚一樣，
   * 點下去就列出這一類的全部條目**。
   *
   * 所以現在：點一格 → 句子一個字都不動 → 底下換成那一類的完整清單
   * （沿用候選清單的版型：分區標頭 → 群組標頭 → 候選項含簡介）。
   * 標頭那行也跟著改掉——行為不再是「說完一半」，就不該再那樣寫。
   *
   * ---------------------------------------------------------------
   * 每一格底下到底是哪一批標的（先數再決定，不硬湊）
   * ---------------------------------------------------------------
   * 正式版那六張方磚本身就不是同一種東西：三張開的是**頁內分類清單**
   * （href="#abdomen"／"#critical"／"#scores"，見 index.html 檔尾的
   * showSection()），另外三張是**直接連到別的頁面**
   * （tools/antibiotics.html／cancer.html／drug-database.html）。
   * 這裡照 facets.js 實際數得出來的東西分成三種：
   *
   *   by:'sec'  腹部急症 18 件／急重症處置 22 件／計分工具 59 件／癌症治療 30 件
   *             ——這四格在 facets.js 就是四個範圍（sec），直接列該範圍全部標的。
   *             癌症治療在正式版是直接連過去的，但 facets 有 30 個癌別標的，
   *             列得出來就列，比丟去一個總站好用。
   *   by:'grp'  抗微生物 6 件——它不是一個範圍，是 sec="hubs" 底下的一個群組
   *             （藥物查詢／依部位／依病原菌／菌譜資料庫／手術預防／創傷用藥）。
   *             用 grp 比對，數字與 facets 自己標的 cnt:"6 項" 對得上。
   *   by:'go'   藥物資料庫——facets.js 裡它**只有它自己一筆**（k="hub-drugdb"，
   *             kind="mega"，grp="直接指向頁面的入口"）。1111 張藥卡不在
   *             facets 裡，也不該被攤進這個清單（那正是「一整片藥名牆」）。
   *             列不出「全部條目」就不假裝列得出來：這一格維持正式版的行為，
   *             **直接連過去**，並在格子上把「直接前往」四個字寫出來，
   *             其餘五格則印出件數——使用者按下去之前就知道會發生哪一種事。 */
  var TILE = {
    'card-view-abdomen':     { by: 'sec', v: 'abdomen' },
    'card-view-antibiotics': { by: 'grp', v: '抗微生物' },
    'card-view-critical':    { by: 'sec', v: 'critical' },
    'card-view-cancer':      { by: 'sec', v: 'cancer' },
    'card-view-scores':      { by: 'sec', v: 'scores' },
    'card-view-drugdb':      { by: 'go',  v: 'hub-drugdb' }
  };
  var openTile = null;        // 目前攤開哪一格（null＝六格還收著）

  function tileList(id) {
    var m = TILE[id];
    if (!m || m.by === 'go') return [];
    return TOOLS.filter(function (t) { return m.by === 'sec' ? t.sec === m.v : t.grp === m.v; });
  }
  function tileLabel(id) {
    var a = document.getElementById(id);
    return {
      zh: (a && a.getAttribute('data-label')) || '',
      en: (a && a.getAttribute('data-en')) || '',
      sub: (a && a.getAttribute('data-sub')) || ''
    };
  }

  function hubsHTML() {
    var cards = [].slice.call(document.querySelectorAll('#hub .hub-card'));
    var body = cards.map(function (a) {
      var m = TILE[a.id];
      if (!m) return '';
      var L = tileLabel(a.id);
      if (m.by === 'go') {
        // 直接連過去的那一格：真的做成 <a>，長按可以複製網址、中鍵可以開新分頁，
        // 跟正式版那張方磚一樣是一條連結，不是一顆假裝成連結的按鈕。
        var t = byKey[m.v];
        var href = t ? withSentQuery(t.href, completeSentenceFor(t)) : 'tools/drug-database.html';
        return '<a class="sent-hub sent-hub-go" href="' + esc(href) + '" ' +
          'aria-label="' + esc(L.zh) + '：直接前往這一頁">' +
          '<span class="shb-zh">' + esc(L.zh) + '</span>' +
          '<span class="shb-en">' + esc(L.en) + '</span>' +
          '<span class="shb-sub">' + esc(L.sub) + '</span>' +
          '<span class="shb-n">直接前往 →</span></a>';
      }
      var n = tileList(a.id).length;
      return '<button type="button" class="sent-hub" data-act="tile" data-tile="' + esc(a.id) + '" ' +
        'aria-expanded="false" ' +
        'aria-label="' + esc(L.zh) + '：列出這一類的全部 ' + n + ' 件（不會改動句子）">' +
        '<span class="shb-zh">' + esc(L.zh) + '</span>' +
        '<span class="shb-en">' + esc(L.en) + '</span>' +
        '<span class="shb-sub">' + esc(L.sub) + '</span>' +
        '<span class="shb-n">' + n + ' 件 ⌄</span></button>';
    }).join('');
    if (!body) return '';
    return '<div class="sent-hubs-h">六大分類 · 點一下列出這一類的全部條目</div>' +
      '<div class="sent-hubs">' + body + '</div>';
  }

  /* 攤開後的那一區：一條工具列（返回／把這一區當範圍開始造句）＋ 該類的完整清單。
   *
   * 版面照正式版：正式版按 #abdomen 是**把六張方磚整個收起來**、換成那一類的
   * 區塊，並在區塊裡給一顆「返回主選單」（index.html 的 goHome()）。這裡逐項對上，
   * 所以退路有四條，主要那條就是工具列最左邊那顆「← 回六大分類」：
   *   1. 「← 回六大分類」（主要，永遠在清單最上面，不必捲回去找）
   *   2. Esc
   *   3. 畫面下緣的「← 退一個詞」——句子是空的時候，退的就是這一步瀏覽
   *   4. 畫面下緣的「清空句子」
   *
   * 工具列第二顆「以『腹部急症』為範圍開始造句」是**補回**被拿掉的能力：
   * 舊版那六格會寫 homeSt.g，那是句子的「範圍」格唯一的入口（renderRow() 沒有
   * 為 g 畫空格 ▢，g 的候選詞面板只有在已經有 g 詞塊時才點得開）。行為改成
   * 「不動句子」之後，空句子狀態下就再也選不到範圍了。所以把它做成一顆**寫明
   * 用途的按鈕**，而不是讓點方磚偷偷改句子——同一個能力還在，只是不再是副作用。
   * 只有 by:'sec' 那四格有這顆；抗微生物那格對到的是群組不是範圍，沒有這顆。
   *
   * 清單裡的分區標頭與群組標頭在這裡是**不可點的**（groupsHTML 傳 false）：
   * 這一區是「瀏覽」，不是造句，兩顆標頭原本的動作（收斂範圍／平行換題）都會
   * 改動句子，跟這一格的承諾（點下去不動句子）互相矛盾。 */
  function tileViewHTML(id) {
    var L = tileLabel(id);
    var list = tileList(id);
    var m = TILE[id];
    var scope = (m && m.by === 'sec')
      ? '<button type="button" class="sent-tile-scope" data-act="tilescope" data-g="' + esc(m.v) + '" ' +
        'aria-label="以「' + esc(L.zh) + '」為範圍開始造句：把句子的範圍格填成 ' + esc(L.zh) + '">' +
        '以「' + esc(L.zh) + '」為範圍開始造句</button>'
      : '';
    return '<div class="sent-tile-view">' +
      '<div class="sent-tile-bar">' +
        '<button type="button" class="sent-tile-back" data-act="tileback" ' +
        'aria-label="回到六大分類">← 回六大分類</button>' + scope +
      '</div>' +
      '<div class="sent-tile-head">' +
        '<span class="stv-en">' + esc(L.en) + '</span>' +
        '<span class="stv-zh">' + esc(L.zh) + '</span>' +
        '<span class="stv-n">' + list.length + ' 件</span>' +
      '</div>' +
      (L.sub ? '<div class="sent-tile-sub">' + esc(L.sub) + '</div>' : '') +
      /* secHead:false ＋ soloGrp——上面 .sent-tile-head 已經印過「英文眉標／中文
         大字／件數」，清單裡的分區標頭印的是同一組字（實測 390×844 攤開急重症
         處置：同一屏連印兩遍「EMERGENCY & CRITICAL CARE／急重症處置／22 件」）。
         抗微生物那一格更誇張：大標題「抗微生物」、分區標頭「入口」、群組標頭
         又是「抗微生物」，三層裡有兩層是廢話。soloGrp 傳目前這一格的中文名，
         只有在「整份清單就這一個群組、而且群組名正好等於大標題」時才把群組標頭
         也吃掉；名字對不上就照印，不會誤刪別格的群組標頭。 */
      groupsHTML(list, { interactive: false, secHead: false, soloGrp: L.zh }) +
      '</div>';
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
      '<div class="sent-howto-body">句子還是空的——這就是主選單。上面六大分類點一格，會列出那一類的全部條目' +
      '（不會改動句子）；要造句就點一個熱門詞直接填一格，也可以逐格點 ▢ 自己選詞。選好的詞塊點一下會把清單重開在原位，' +
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
  /* ---------------- 頁內子目標：句子的最後一步 ----------------
   * 句子收斂完之後只停在「抗生素指引」這個**頁面**，可是使用者要的是頁內的
   * 那一格（依部位 › 腹腔內感染）。這裡把那一步補上。
   *
   * 為什麼是「使用者自己按一下展開」，不是「句子自動挑好」——這件事試過而且
   * 量過，不是偷懶：本來想用句子已經選好的詞去比對子目標的名字（主體「腹膜」
   * → 找到 SITES 裡的「腹腔內感染」）。實測那條路產生的是**假精準**：
   *   · 「感染與敗血」的別名 infection 出現在 10 個部位裡的 6 個，
   *     等於沒有鑑別力；
   *   · 短別名會撞進不相干的字裡——「手術排程」的別名 OR 命中了
   *     Pneumonia / Respirat**or**y。
   * facets.js 的詞表是**為了選頁面**標的，不是為了選頁內那一格；硬把它當成
   * 頁內索引用，就會出現「句子自動幫你挑了一格，而且挑錯」。所以這裡只做
   * 兩件誠實的事：(1) 明講這一頁裡面還有更細的一層、有幾個；(2) 把那一層
   * 原原本本列出來讓使用者自己點。要一步到位的人走「說整句」打名字（那條路
   * 是**字面命中**，不是猜的）。
   *
   * 對照表只認 facets 標的的 k，右邊是子目標索引裡的 grp＋w 兩個欄位——
   * 那兩個欄位是 buildSubIndex() 從真實資料檔算出來的，這裡沒有另存一份清單。
   * hub-drugdb（處方集 1111 張藥卡）刻意**不列入**：1111 筆攤不進一列底下，
   * 那一頁本來就有自己的查詢框，硬展開只會變成一片藥名牆。 */
  /* src＝這一組頁內項目**是哪一個 SUB_FILES 來源給的**。只有 subsInlineHTML()
     的「載入中／取不到」判斷會讀它，不參與 act==='subs' 的 only 決策（那一顆
     維持原本抓第一波四個來源的行為，一個字都沒動）。
     為什麼要補這一欄：先前那裡是拿 `subIdx.length` 當「載入完了沒」的訊號，
     而 subIdx 是四個來源**共用**的一份陣列——只載了其中一個（分級系統的自動
     載入，或本輪新增的 abxsite 自動載入）時 subIdx 已經有東西，另外三顆按鈕
     一攤開就會誤報「頁內項目取不到（離線且未快取）」，其實只是還沒抓。
     實測今天就走得到：句子收斂 → 自動抓 classifications.html（49 筆）→
     攤開「藥物查詢」→ 那一行紅字閃一下才被補上的資料蓋掉。 */
  var SUBTARGET_OF = {
    'abx-mode-empiric':  { grp: 'abx', w: 0, label: '感染部位',   src: 'abxsite' },
    'abx-mode-bacteria': { grp: 'abx', w: 1, label: '病原菌',     src: 'abxsite' },
    'hub-antibiotics':   { grp: 'abx', w: 2, label: '抗生素藥卡', src: 'abxdrug' },
    'classifications':   { grp: 'classif', label: '分級系統',     src: 'classif' }
  };

  /* ---------------- 13 個分頁式頁面（第 9 輪新增） ----------------
   * 上一輪把這一批**刻意留白**，當時的理由原話是「分頁名稱只存在各自的 HTML
   * 裡，要嘛多 13 次 fetch，要嘛硬寫一份對照表（＝第二個真相來源）」。
   * 使用者裁決要補，做法是前者：fetch ＋ DOMParser 現場解析，與 classif
   * 那一筆同一個模式（見 SUB_FILES 的 kind:'html'），**沒有另立第二套**。
   *
   * 這裡唯一寫死的是「哪 13 個標的是分頁式頁面」這串 facets key，而且刻意
   * 只寫 key、不寫網址、不寫任何分頁名稱：
   *   · 網址向 facets.js 要（byKey[k].href）；
   *   · 分頁 id／中英名稱／hash 形式全部由 parseTabs() 從那一頁自己的
   *     HTML ＋ JS 現場讀出來。
   * 也就是說這串 key 只回答「要去抓誰」，不回答「抓到的東西長什麼樣」——
   * 那 13 頁改分頁時這裡一個字都不必動，改的是它們自己，我們照著讀；
   * 讀不出來就是 0 筆（看得見的壞），不會出現「連結還在但跳錯地方」。
   *
   * 為什麼不能自動推出這 13 個是誰：facets.js 沒有「這一頁有分頁」這個欄位，
   * 唯一能確定的辦法是把 136 個標的全抓回來看一遍，那顯然不划算。 */
  var TAB_PAGES = ['pe', 'acs', 'rsi', 'stroke', 'hf', 'periop-anticoag',
                   'dose-conversion', 'cs-path', 'ich-path', 'seizure-path',
                   'swan', 'vte-risk', 'nutrition-risk'];
  var tabsOf = {};            // facets 的 k → parseTabs() 解析出來的分頁陣列
  /* 這 13 頁的頁內清單也掛進候選清單那顆「N 個分頁 ⌄」。與抗生素／分級系統
     那三顆不同的是它多帶一個 file：按下去只抓**那一頁自己**（22–169 KB），
     不是把第一波四個來源 911 KB 全抓回來——見 act==='subs' 的處理。 */
  TAB_PAGES.forEach(function (k) {
    if (!byKey[k]) return;
    SUBTARGET_OF[k] = { grp: 'tab', w: null, pk: k, label: '分頁', file: 'tab:' + k };
  });
  var SUB_INLINE_CAP = 12;
  /* 句子已經挑過的清單放寬到 20：12 是「整頁 1111 張藥卡攤不進一列底下」的
     上限，對**被句子挑出來的**結果不適用——那正是使用者要的那幾筆，截掉就
     等於白挑。實測最大的一組是「我遇到感染，我要查分級系統」的 15 筆
     （c 的上位詞「感染」sub 含闌尾炎／膽囊炎／膽管炎／憩室炎／腹膜炎／腹內膿瘍／
     皮膚軟組織感染／侵襲性念珠菌感染），20 收得下。 */
  var SUB_PICKED_CAP = 20;
  var openSubs = {};          // 哪幾個標的的頁內清單被使用者手動開／關過（key＝facets 的 t.k）

  /* ---------------- 句子指到頁內哪一格（第 8 輪新增） ----------------
   * 上面那一段長註解說的是**當時**的實情：facets.js 的詞表是為了選頁面而標的，
   * 拿它去猜頁內那一格會出現假精準。這一輪使用者指名要「分類與分級系統的每一個
   * 分級系統都能用造句找到（我遇到闌尾炎，我要術中分級）」，所以那個問題必須
   * 正面解掉——解法不是把比對放寬，是**把標註補到位**：
   *
   *   data/facets.js 新增 FACETS.classif ——33 套分級系統 ＋ AAST EGS 的 16 個
   *   疾病，每一筆逐條標上部位（s）與狀況（c）。那份標註**只有面向詞、沒有
   *   任何臨床文字**；名稱／英文名／出處／分頁／深層連結仍然是這裡從
   *   tools/classifications.html 現場讀出來的，所以沒有製造第二個真相來源。
   *
   * 因此本檔的頁內過濾規則只有一條，而且是「有標註才過濾」：
   *   · 帶標註的來源（目前只有分級系統）→ 句子的 s／c 逐格比對標註，命中才留。
   *   · 沒標註的來源（抗生素的 10 個部位／44 隻菌／155 張藥卡、處方集 1111 張）
   *     → **一筆都不濾**，行為與這一輪之前逐字相同。上面那段實測（infection
   *     命中 10 個部位裡的 6 個、OR 撞進 Respiratory）講的正是這些來源，
   *     它們的頁內項目至今沒有面向標註，硬濾就會重演假精準。
   * 動作面向（a）不參與頁內過濾：a 已經在**頁面層**濾過一次（「查分級系統」
   * 只標在分類與分級系統這一個標的上），頁內再濾一次沒有增加鑑別力。 */
  var CLASSIF_TAG = F.classif || {};
  function subTagged(e) { return !!(e.fs || e.fc); }
  function subMatch(e, st) {
    if (!subTagged(e)) return true;
    if (st.s && !hit('s', st.s, e.fs || [])) return false;
    if (st.c && !hit('c', st.c, e.fc || [])) return false;
    return true;
  }
  function stNarrows(st) { return !!(st && (st.s || st.c)); }

  /* ---------------- 落點升級：句子的部位直接落到「依部位」的那一格（第 11 輪） ----
   * 上面兩段長註解的結論是「句子自動幫你挑一格＝假精準，所以不做」。使用者實機
   * 回報的正是被那個決定擋下來的一件事：句子已經說了「肺與氣道」，落點卻只到
   * 抗生素指引的 STEP 1，還得自己再點一次「肺炎 / 呼吸道」才會到 STEP 2。
   *
   * 重看當時量到的那兩條證據，會發現**兩條都不是在講部位這一格**：
   *   · 「感染與敗血」的別名 infection 命中 10 個部位裡的 6 個——那是**狀況**
   *     性質的詞被拿去當部位用，鑑別力當然是零；
   *   · 「手術排程」的別名 OR 撞進 Pneumonia / Respirat**or**y——那是**動作**
   *     面向的詞，而且敗在子字串比對沒有詞界、長度也不設限。
   * 該被擋的是「沒有鑑別力的詞」與「沒有詞界的比對」，不是「用部位挑部位」。
   * 所以這一輪的規則是**有條件的**，而且門檻是先量再定，不是先定再說：
   *
   *   比對：句子的部位詞展開集（expand('s', w)＝自己＋別名＋下位詞）逐一比對
   *         SITES 那一筆的「中文名 ＋ 英文名 ＋ id」。
   *         · 拉丁字母的詞：長度 ≥3 而且**要有詞界**
   *           （`(^|非字母數字) tok (非字母數字|$)`）。OR／PE／SB／CBD 這類
   *           兩三字母縮寫因此不是被特判掉的，是被這一條規則本身擋掉的。
   *         · 中文的詞：子字串命中即可，**不設長度下限**。實測 62 個部位詞裡，
   *           從「≥2 字」放寬到「≥1 字」只多出三筆：心臟→感染性心內膜炎（對）、
   *           病原菌→菌血症、血液與骨髓→菌血症。後兩個詞根本走不到「依部位」
   *           這個標的（它的 s 標註裡沒有這兩個詞），實際生效的只有心臟那一筆。
   *   門檻：**命中數恰好 1** 才升級。0 個或 ≥2 個一律維持 facets.js 給的落點
   *         （停在分頁，由使用者自己在 STEP 1 選）。「感染與敗血」命中 6 個，
   *         正好被這一條擋下——上一輪放棄整件事的那個理由，在這裡被保住了。
   *
   * 實測（62 個部位詞 × 10 個 SITES）：真的走得到「依部位」的部位詞有 11 個，
   * 其中 6 個唯一命中（腹部→腹腔內感染 IAI、軟組織→皮膚軟組織 SSTI、
   * 心臟→感染性心內膜炎、肺與氣道→肺炎 / 呼吸道、泌尿系統→泌尿道感染 UTI、
   * 神經系統→中樞神經系統感染），1 個命中 6 個（感染與敗血，不升級），
   * 4 個一個都沒命中（膽道／腹膜／腎臟／腦，不升級）。沒有一筆是「唯一但錯」。
   *
   * 這一招**只用在這一個索引**。另外四個頁內索引都量過，理由見 deepLanding()。 */
  var ABX_SITE_PATH = '抗生素指引 › 依部位';
  // 藥卡那一層的麵包屑：藥名命中（buildSubIndex）與覆蓋菌種命中（covSearch）
  // 落在同一頁的同一個模式，麵包屑前段共用同一份字，免得兩邊日後各寫各的。
  var ABX_LOOKUP_PATH = '抗生素指引 › 藥物查詢';
  var LAT_MIN = 3;                       // 拉丁字母的詞至少要這麼長才參與比對
  var CJK_CH = /[一-鿿]/;        // 中日韓統一表意文字（部位詞的中文都落在這一段）
  function siteHay(s) {
    return ((s.name || '') + ' ' + (s.en || '') + ' ' + (s.id || '')).toLowerCase();
  }
  function tokInHay(tok, hay) {
    if (!tok) return false;
    if (CJK_CH.test(tok)) return hay.indexOf(tok.toLowerCase()) >= 0;
    // 別名裡有連字號與斜線的複合詞（small-bowel、mechanical-ventilation…），
    // 拆成子詞後**每一個**都要以詞界命中才算，避免半個詞蒙到。
    var parts = tok.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^\s+|\s+$/g, '').split(/\s+/);
    if (!parts[0]) return false;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length < LAT_MIN) return false;
      var p = parts[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp('(^|[^a-z0-9])' + p + '($|[^a-z0-9])').test(hay)) return false;
    }
    return true;
  }
  var soleSiteCache = {};
  /* 部位詞 → 唯一對得上的 SITES 索引；0 個或 ≥2 個都回 -1。 */
  function soleSiteIdx(w) {
    if (!w) return -1;
    var arr = window.SITES;
    // regimens.js 還沒到（首頁本來不載它）：這一次先不升級，等 autoloadSubsFor()
    // 把它抓回來重畫一次再說。**刻意在寫進快取之前就回**，否則會把「還沒載到」
    // 這個暫時狀態記成永久答案。
    if (!arr || !arr.length) return -1;
    if (soleSiteCache[w] != null) return soleSiteCache[w];
    var exp = expand('s', w), found = -1, n = 0;
    for (var i = 0; i < arr.length && n < 2; i++) {
      var hay = siteHay(arr[i]);
      for (var j = 0; j < exp.length; j++) {
        if (!tokInHay(exp[j], hay)) continue;
        n++; found = i; break;
      }
    }
    soleSiteCache[w] = (n === 1) ? found : -1;
    return soleSiteCache[w];
  }

  /* 這一句話真正該落在哪裡；回 null＝維持 facets.js 給的原落點。
   * 只認 abx-mode-empiric 一個標的。另外四個頁內索引都量過，都不做：
   *   · #bac=（44 隻菌）：走得到「依病原菌」的詞只有 3 個，其中兩個各命中 41 隻，
   *     唯一命中 0 個——沒有任何鑑別力。
   *   · #drug=（155 張抗生素藥卡）：走得到「藥物查詢」的詞 105 個，只有 5 個
   *     唯一命中，而那 5 個裡「膽道→Amphotericin B」「抗黴菌藥→Nystatin」
   *     「ESBL→Piperacillin/Tazobactam」都是錯的——正是上一輪講的假精準。
   *   · #code=（1111 張處方集藥卡）：走得到的詞只有 4 個——一般藥物命中 154、
   *     懷孕用藥與藥物禁忌各 0、處方集 1（Everolimus，純屬字面巧合）。
   *   · #sys=（49 套分級系統）：**有鑑別力**（703 個「部位×狀況」組合裡有 106 個
   *     恰好收斂到 1 套），但它不需要這一招——那一組頁內項目在 data/facets.js
   *     有逐筆面向標註，subsAuto() 早就把那一格**自動攤開**印在候選項底下，
   *     使用者按一下就到。省下的點擊數因此是：分級系統 0 次、依部位 1 次
   *     （依部位的 10 個部位沒有標註，那顆按鈕永遠是收著的，才會要按兩次）。 */
  function deepLanding(t, st) {
    if (!t || t.k !== 'abx-mode-empiric' || !st || !st.s) return null;
    var i = soleSiteIdx(st.s);
    if (i < 0) return null;
    var s = window.SITES[i];
    return {
      href: 'tools/antibiotics.html#site=' + i,
      name: t.name + ' › ' + s.name,      // 候選項上就寫明它會落到哪一格
      en: s.en || t.en
    };
  }
  /* 人已經站在 #site=N 上時，軌跡那一行要寫到那一格為止——不論他是被升級後的
     落點帶過來的，還是從候選項底下那份頁內清單點過來的（那份清單本來就產生
     `#site=N`，先前落地後軌跡一樣只寫「依部位」）。 */
  function landedSite() {
    var m = /^#site=(\d+)$/.exec(location.hash || '');
    if (!m) return null;
    return (window.SITES || [])[+m[1]] || null;
  }
  /* 看得見的那一行**只寫到「依部位 › 那一格」**，不含最前面的「抗生素指引」。
     不是漏掉，是量出來的：`.sf-tool` 是 white-space:nowrap ＋ text-overflow:ellipsis
     （css/ui-sentence.css，本輪不動那一支），實測 430×932 它的可用寬度 253px——
       「抗生素指引 › 依部位 › 肺炎 / 呼吸道」 296px → 截斷
       「依部位 › 肺炎 / 呼吸道」              253px → 剛好完整
     而 ellipsis 砍的是**字尾**，正好是整條麵包屑裡最該被看到的那一格。
     最前面那一層並沒有消失：它就印在這條軌跡正上方、那一頁自己的 h1
     （tools/antibiotics.html 的「抗生素指引」），同一屏寫兩次只會把那一行擠掉。
     完整三層仍然進 .sent-fold 的 aria-label（螢幕閱讀器聽得到全路徑）。
     390×844 下十個部位裡有兩個名字更長的（皮膚軟組織 SSTI 差 1px、
     中樞神經系統感染 差 8px）仍會被 ellipsis 砍掉尾巴，那是 .sf-tool 本來就有的
     行為（長工具名一樣如此），不在這一輪另外處理。
     「依部位」三個字向 facets.js 要，不在這裡再抄一次。 */
  function landedSitePath() {
    var s = landedSite();
    if (!s) return '';
    var t = byKey['abx-mode-empiric'];
    return (t ? t.name : '依部位') + ' › ' + s.name;
  }
  function landedSiteFullPath() {
    var s = landedSite();
    return s ? (ABX_SITE_PATH + ' › ' + s.name) : '';
  }

  /* st 傳 null＝不看句子，列出這一頁的全部項目（也就是這一輪之前的行為）。
     句子沒收斂時**不列 AAST 的 16 個子疾病**：那 16 筆的母項（AAST EGS 統一分級）
     本來就在清單裡，一起列出來等於同一張表印 17 次。句子一收斂才把子疾病放進來
     ——那時候使用者要的正是「闌尾炎那一張表」，不是那個下拉選單本身。 */
  // 這一頁**可以被指到**的全部項目（含 AAST 的 16 個子疾病）＝分母。
  function subsAll(k) {
    var m = SUBTARGET_OF[k];
    if (!m) return [];
    return subIdx.filter(function (e) {
      // pk（頁面 key）只有分頁那一組會用到：13 頁共用 grp='tab'，
      // 沒有這一格的話按「肺栓塞」那顆會攤出 13 頁全部的分頁。
      return e.grp === m.grp && (m.w == null || e.w === m.w) && (!m.pk || e.pk === m.pk);
    });
  }
  function subsFor(k, st) {
    var all = subsAll(k);
    if (!all.length) return all;
    if (!stNarrows(st)) return all.filter(function (e) { return !e.child; });
    var out = all.filter(function (e) { return subMatch(e, st); });
    // 子疾病命中時就不必再列母項（同一句話會同時命中兩者，畫面上是同一張表兩次）
    var parents = {};
    out.forEach(function (e) { if (e.parent) parents[e.parent] = true; });
    return out.filter(function (e) { return !(e.key && parents[e.key]); });
  }

  /* 句子真的把這一頁收窄了（命中數 < 全部）就**自動攤開**，不必再按一下：
     使用者說的「我遇到闌尾炎，我要術中分級」要一眼看到那張表，不是看到一顆
     「49 個分級系統 ⌄」。使用者自己按過那顆按鈕之後（openSubs 有值）一律以
     他按的為準——自動展開不可以把人家手動收起來的東西再打開。 */
  function subsAuto(k, st) {
    if (!subIdx.length || !stNarrows(st)) return false;
    var hitl = subsFor(k, st);
    return hitl.length > 0 && hitl.length < subsAll(k).length;
  }
  function subsOpen(k, st) {
    return (openSubs[k] == null) ? subsAuto(k, st) : !!openSubs[k];
  }

  /* ---------------- 「人已經在那一頁」時的分頁連結 ----------------
   * 那 13 頁**沒有 hashchange 監聽器**：它們只在解析期讀一次 location.hash
   * （見 parseTabs() 的第 (2) 段）。所以人已經站在 tools/pe.html、又從候選
   * 清單點了 tools/pe.html#risk 時，瀏覽器只換 hash、不重載文件，那一頁不會
   * 切分頁——**點了完全沒反應**，正是這一輪要避免的假功能（實測：在 pe.html
   * 上把 hash 換成 #risk，可見窗格仍然是 p-dx）。
   * 這裡只在「解析後指到同一份文件」這個情況補一次重載，跨頁點擊是真的導覽，
   * 一個字都不動。其他來源不在處理範圍：#drug=／#code=／#sys=／#site=／#bac=
   * 那幾頁本來就各自掛了 hashchange 監聽器（見 reapplyDeepLink() 的註解）。 */
  function tabHashAttr(e) { return (e && e.grp === 'tab') ? ' data-tabhash="1"' : ''; }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var a = (e.target && e.target.closest) ? e.target.closest('a[data-tabhash]') : null;
    if (!a) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.pathname !== location.pathname || u.search !== location.search) return;  // 真的換頁，交給瀏覽器
    if (u.hash === location.hash) return;                                          // 已經在這一個分頁上
    e.preventDefault();
    location.hash = u.hash;
    try { location.reload(); } catch (err2) { /* 重載被擋就維持換 hash 的行為，不拋錯 */ }
  });

  function subsInlineHTML(t) {
    var m = SUBTARGET_OF[t.k];
    if (!m) return '';
    /* 「還沒抓回來」與「抓不到」是兩件事，訊息不能共用一句。分頁那 13 頁各自
       是獨立的來源，所以判斷要看**這一頁自己**的載入狀態，不是看整個 subIdx
       有沒有東西——否則第一波載完（subIdx 有 1353 筆）而 tools/pe.html 還沒抓，
       畫面會誤報「取不到（離線且未快取）」。 */
    var srcId = m.file || m.src;
    if (srcId && subFileState[srcId] !== 2) {
      return '<div class="sent-subs"><div class="sent-subs-note is-loading">頁內項目載入中…</div></div>';
    }
    if (!subIdx.length) {
      return '<div class="sent-subs"><div class="sent-subs-note is-loading">頁內項目載入中…</div></div>';
    }
    var st = curSt();
    var all = subsFor(t.k, null);
    var nAll = subsAll(t.k).length;
    if (!all.length) {
      return '<div class="sent-subs"><div class="sent-subs-note is-fail">頁內項目取不到（離線且未快取）。</div></div>';
    }
    var list = subsFor(t.k, st);
    var byQuery = stNarrows(st) && list.length && list.length < nAll;
    /* 句子收斂了、頁內卻一個都對不上——多半是 relax() 已經放寬過某一格，
       清單裡的東西其實是放寬後的結果。這時候退回列全部，並把理由講出來，
       不留下一片空白讓人以為索引壞了。 */
    if (!list.length) list = all;
    var shown = list.slice(0, byQuery ? SUB_PICKED_CAP : SUB_INLINE_CAP);
    var head = byQuery
      ? '<div class="sent-subs-note is-picked">依句子挑出 ' + list.length + ' / ' + nAll +
        ' 個' + esc(m.label) + '——點下去直接落在那一格。</div>'
      : '';
    return '<div class="sent-subs">' + head +
      shown.map(function (e) {
        return '<a class="sent-sub' + (e.child ? ' is-child' : '') + '"' + tabHashAttr(e) +
          ' href="' + esc(ROOT + e.href) + '">' +
          (e.crumb ? '<span class="ssb-crumb">' + esc(e.crumb) + '</span>' : '') +
          '<span class="ssb-name">' + esc(e.name) + '</span>' +
          (e.en ? '<span class="ssb-en">' + esc(e.en) + '</span>' : '') +
          (e.meta ? '<span class="ssb-meta">' + esc(e.meta) + '</span>' : '') +
          '</a>';
      }).join('') +
      (list.length > shown.length
        ? '<div class="sent-subs-note">這一頁裡還有 ' + (list.length - shown.length) +
          ' 個' + esc(m.label) + '——用上面「⌕ 說整句」打名字可以一步到位。</div>'
        : '') +
      '</div>';
  }

  function hitHTML(t) {
    var m = KIND_META[t.kind] || KIND_META.tool;
    var desc = t.desc || '';
    var sub = SUBTARGET_OF[t.k];
    var cs0 = curSt();
    /* 落點升級（見 deepLanding()）。六大分類攤開時**不升級**：那份清單對使用者的
       承諾是「句子一個字都不動、列出這一類的全部條目」，在瀏覽狀態下偷偷把連結
       換成句子挑的那一格，跟那句承諾互相矛盾。 */
    var deep = openTile ? null : deepLanding(t, cs0);
    var hitHref = deep ? deep.href : t.href;
    var hitName = deep ? deep.name : t.name;
    var hitEn = deep ? deep.en : t.en;
    var on = sub ? subsOpen(t.k, cs0) : false;
    /* 「頁內還有一層」那顆：索引還沒載時不印數量（印不出來，也不該為了印一個
       數字就先抓 911 KB——首頁零成本那條線比這顆按鈕重要）；載過之後才補上
       「10 個感染部位」。按下去才觸發載入。
       句子已經把頁內項目篩窄時，數字印的是**篩完的**那一個（並在括號裡註明
       總數），否則按鈕上寫 49、攤開只有 1 個，看起來像壞掉。 */
    var n = subIdx.length ? subsFor(t.k, cs0).length : 0;
    var nAll = subIdx.length ? subsAll(t.k).length : 0;
    var picked = !!(n && stNarrows(cs0) && n < nAll);
    var nTxt = !n ? ('頁內' + esc(sub ? sub.label : ''))
      : (picked ? (n + ' / ' + nAll + ' 個' + esc(sub.label)) : (n + ' 個' + esc(sub.label)));
    var subBtn = sub
      ? '<button type="button" class="sent-hit-subs' + (on ? ' open' : '') +
        (picked ? ' picked' : '') + '" data-act="subs" ' +
        'data-k="' + esc(t.k) + '" aria-expanded="' + (on ? 'true' : 'false') + '" ' +
        'aria-label="' + (on ? '收合' : '展開') + '「' + esc(t.name) + '」的頁內' + esc(sub.label) + '">' +
        nTxt +
        '<span class="shs-chev" aria-hidden="true">' + (on ? ' ⌃' : ' ⌄') + '</span></button>'
      : '';
    return '<div class="sent-hit-row' + (on ? ' subs-open' : '') + '">' +
      '<a class="sent-hit" href="' + esc(withSentQuery(hitHref, completeSentenceFor(t))) + '">' +
        '<span class="sh-top">' +
          '<span class="sh-kind ' + m.cls + '" aria-hidden="true">' + m.shape + '</span>' +
          '<span class="sh-kind-l ' + m.cls + '">' + m.label + '</span>' +
          '<span class="sh-name">' + esc(hitName) + '</span>' +
          '<span class="sh-en">' + esc(hitEn) + '</span>' +
        '</span>' +
        (desc ? '<span class="sh-desc">' + esc(desc) + '</span>' : '') +
      '</a>' +
      (desc ? '<button type="button" class="sent-hit-more" data-act="more" aria-expanded="false" ' +
              'aria-label="展開或收合「' + esc(t.name) + '」的完整說明">＋</button>' : '') +
      subBtn +
      (on ? subsInlineHTML(t) : '') +
      '</div>';
  }

  /* 兩層標頭＋候選項的清單本體。opt 有三個開關，預設值＝造句候選清單原本的行為：
     · interactive（預設 true）：兩顆標頭是**按鈕**還是**純文字**。
       造句的候選清單要按鈕（分區標頭＝收斂範圍、群組標頭＝平行換題）；
       六大分類攤開後的瀏覽清單承諾「不動句子」，所以降成 <div>，
       不進 Tab 順序、沒有 hover、按了也不會有事。
     · secHead（預設 true）：要不要印分區標頭那一層。攤開的分類清單本身已經有
       一個大標題（.sent-tile-head：英文眉標 ＋ 中文大字 ＋ 件數），分區標頭
       印的是同一組字，同一屏出現兩次只是把清單變長（實測 390×844 攤開
       急重症處置：「EMERGENCY & CRITICAL CARE／急重症處置／22 件」連印兩遍）。
     · soloGrp：整份清單只有這一個群組、而且群組名就等於外面那個大標題時，
       連群組標頭也不印（抗微生物那一格：大標題「抗微生物」，底下唯一的群組
       也叫「抗微生物」）。傳的是要被吃掉的那個名字，不是布林值——名字對不上
       就照印，不會誤刪別的群組標頭。 */
  function groupsHTML(list, opt) {
    opt = opt || {};
    var interactive = opt.interactive !== false;
    var wantSec = opt.secHead !== false;
    var groups = groupList(list);
    var soloName = (opt.soloGrp && groups.length === 1 && groups[0].groups.length === 1 &&
                    groups[0].groups[0].name === opt.soloGrp) ? opt.soloGrp : null;
    return groups.map(function (g) {
      /* 分區標頭可點（原型 .sec-h data-act="hub"）：把句子的**範圍**收斂到這一區。
         英文小字在上、中文大字在下、右側「N 件」——排列順序照原型。 */
      var secHead = interactive
        ? '<button type="button" class="sent-group-head" data-act="sec" data-g="' + esc(g.id) + '" ' +
          'aria-label="從 ' + esc(g.title) + ' 這一區重新說一次（目前 ' + g.n + ' 件）：只留範圍，其餘詞塊清空">'
        : '<div class="sent-group-head is-static">';
      var secTail = interactive ? '</button>' : '</div>';
      return '<div class="sent-group">' +
        (wantSec
          ? (secHead +
              '<span class="sgh-en">' + esc(g.en) + '</span>' +
              '<span class="sgh-zh">' + esc(g.title) + '</span>' +
              '<span class="sgh-n">' + g.n + ' 件</span>' +
             secTail)
          : '') +
        g.groups.map(function (grp) {
          /* 群組標頭可點（原型 .grp-h data-act="swap"）＝**平行換題**：只把「狀況」
             換成這個群組最具代表性的那個詞，句子其他部分不動。數量印成
             「命中 / 全部 項」，全中時只印總數（原型 renderRefs() 同一條規則）。 */
          var total = GRP_N[grp.name] || grp.tools.length;
          var nTxt = grp.tools.length === total ? (total + ' 項') : (grp.tools.length + ' / ' + total + ' 項');
          var top = grpTop(grp.name);
          var grpHead = '';
          if (grp.name && grp.name !== soloName) {
            grpHead = (interactive
              ? '<button type="button" class="sent-subgroup-name" data-act="swap" data-f="c" data-w="' + esc(top) + '" ' +
                'aria-label="平行換題：把句子的狀況換成 ' + esc(top) + '，其餘詞塊不動">'
              : '<div class="sent-subgroup-name is-static">') +
              '<span class="ssg-zh">' + esc(grp.name) + '</span>' +
              '<span class="ssg-en">' + esc(grp.en) + '</span>' +
              '<span class="ssg-n">' + esc(nTxt) + '</span>' +
              (interactive ? '</button>' : '</div>');
          }
          return '<div class="sent-subgroup">' + grpHead + grp.tools.map(hitHTML).join('') + '</div>';
        }).join('') +
        '</div>';
    }).join('');
  }

  function renderResults(list) {
    var results = document.getElementById('sentResults');
    if (!results) return;
    // 六大分類攤開時，這一格印的是那一類的完整清單，不是句子的結果——句子沒被改動，
    // 所以下面那兩個以句子為準的分支（空句子＝主選單／找不到）都不該搶先。
    if (openTile) { results.innerHTML = tileViewHTML(openTile); return; }
    var cs = curSt();
    var any = cs.g || cs.s || cs.c || cs.a;
    if (!any) { results.innerHTML = mainMenuHTML(); return; }
    if (!list.length) {
      results.innerHTML = '<div class="sent-empty">找不到符合的項目——按上面「清空句子」可以回到全部 ' + TOOLS.length + ' 項，不會卡住到不了任何一頁。</div>';
      return;
    }
    results.innerHTML = groupsHTML(list, { interactive: true });
    // 畫完才去抓頁內資料：抓回來會再 renderHome() 一次，把「49 個分級系統 ⌄」
    // 換成「1 / 33 個分級系統」＋直接攤開的那一格。
    autoloadSubsFor(list, cs);
  }

  /* ================================================================
   * 快速路徑：「⌕ 說整句」
   * ================================================================
   * 逐格點選之外的另一條路：整條句子塌成一個輸入框，打幾個字（含縮寫與
   * 子序列容錯）直接挑一整句話走。比對分級與排序照抄原型 js/say.js，
   * 但索引只吃 repo 自己的 data/facets.js（136 個標的與三個詞表的別名）——
   * 原型另外併進來的 drugnames.js／sub-*.js 不搬進 repo，那會變成第二份真相。
   */
  var sayIdx = null, sayOpen = false, saySel = 0, sayCur = [], sayLastQ = null, sayQ = '';

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
  function sayToolSearch(q) {
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
      if (r >= 0) out.push({ r: r, kind: 'tool', e: e });
    });
    out.sort(function (x, y) { return x.r - y.r || x.e.t.name.length - y.e.t.name.length; });
    return out;
  }

  /* ================================================================
   * 藥名索引（延後載入；不建立第二份藥名清單）
   * ================================================================
   * 使用者打 `tazocin` 原本 0 筆——136 個標的裡沒有一個是「藥」。原型
   * （style-04-sentence/data/drugnames.js）當初是自己抄了 126 筆藥名進去，
   * repo 刻意沒搬：repo 本來就有兩份**真的**藥物資料，再抄一份就是第二個
   * 真相來源，日後兩邊會各自漂移。所以這裡的索引一律在**執行期**從既有資料
   * 檔建出來，本專案不新增任何靜態藥名清單檔。
   *
   * 兩個資料來源（都是既有檔案，本次一個位元組都沒改）：
   *   · data/drugs/index.js        → window.DRUGDB_INDEX（陣列，台大處方集全庫輕量索引）
   *                                  深層連結 tools/drug-database.html#code=<code>
   *   · data/antibiotics/drugs.js  → window.DRUGS（物件，key 是藥名鍵）
   *                                  深層連結 tools/antibiotics.html#drug=<key>
   *
   * ---------------------------------------------------------------
   * 為什麼一定要延後載入
   * ---------------------------------------------------------------
   * 兩個檔合計約 677 KB，是首頁現有全部資源的好幾倍。首頁不該為了「使用者
   * *可能* 會打藥名」先付這個代價，所以改成：**在「說整句」輸入框真的打到
   * DRUG_MIN_Q 個字才動態插 <script>**，載完建索引留在記憶體，之後同一份
   * 文件內不再重載。載入中畫面下緣有一行明確狀態（不是靜默等待）。
   * 兩個檔本來就在 sw.js 的 PRECACHE_URLS 裡（第 74 行與第 80 行），
   * 所以第二次以後（含離線）是從快取拿，不會再走網路。
   *
   * 已經在頁面上的就不重載：tools/antibiotics.html 本來就有 window.DRUGS、
   * tools/drug-database.html 本來就有 window.DRUGDB_INDEX，那兩頁只補抓另一個檔。
   *
   * ---------------------------------------------------------------
   * 兩邊都有的藥怎麼辦（先量再決定，不憑印象）
   * ---------------------------------------------------------------
   * 實際數過：處方集 1111 筆裡歸在「XVI. Antiinfective Agents」的**只有 1 筆**
   * ——台大處方集的抗感染藥本來就幾乎不在這份索引裡，抗生素那 155 筆是另一套
   * 資料。用正規化學名逐筆比對，兩邊同名的只有 **3 筆**（Acyclovir 眼藥膏、
   * Levofloxacin 眼藥水、Potassium Iodide 口服液）——而且三筆全是**眼用等
   * 局部劑型**，抗生素卡講的是全身性用藥，兩者不能互相取代。
   * 所以規則是：**兩邊都列、各自標明來源，抗生素排在前面**（同分時 abx 先於 db，
   * 見 subSearch() 的 sort）。不做「抗生素吃掉處方集那一筆」的去重——那會把
   * 眼藥膏的藥卡藏起來，而它是使用者真正要找的東西時就找不到了。
   *
   * ---------------------------------------------------------------
   * 比對字串收哪些欄位（避免重演「窄詞條搶走通用字」）
   * ---------------------------------------------------------------
   * 先前 alOf() 那個坑的本質是**交叉污染**：A 的比對字串裡混進了 B 的身分字，
   * 於是打「闌尾」會跑出肺癌。這裡從一開始就把欄位收窄，只收「這一筆自己的
   * 身分」：
   *   head（第一級比對）＝ 學名 ＋ 中文品名 ＋ 商品名
   *   hay （第四級比對）＝ head ＋ 八碼代碼 ＋ 藥理次分類（cls）＋ 管制級別（tags）
   * **刻意不收**的欄位與理由：
   *   · 抗生素的 spectrum／usualDose／contra 等長文字——裡面會提到**別的藥**
   *     （「與 vancomycin 併用時…」），收進來就是同一個坑再挖一次。
   *   · 處方集的 tops（「X. Endocrine and Metabolic Agents」這種羅馬數字章節名）
   *     ——通用英文字（Agents／Drugs）會讓一堆不相干的藥被撈進來。cls 才是
   *     真正有辨識度的次分類（Antiepileptic、Z-drug…），所以只收 cls。
   *   · 處方集的 strengths（「100 mg/cap」）——打「100」會炸開。
   * 另一半的風險是**反過來收太窄**：打 `insulin` 應該出一批而不是一筆。這裡
   * head 是純子字串比對、沒有做任何「一個學名只留一筆」的合併，處方集本來
   * 就是一商品名一張卡，所以 12 張含 insulin 的卡會全部各自命中（實測 12 筆）。
   *
   * 藥名不做子序列容錯（R_FUZZY）：1266 筆下子序列會把毫不相干的藥撈成一片，
   * 而藥名的打錯多半是拼字錯不是漏字。工具那 136 筆維持原本的容錯不變。 */
  /* ---------------------------------------------------------------
   * 四個來源：三個 JS 資料檔 ＋ 一份頁面自己的 HTML
   * ---------------------------------------------------------------
   * `kind:'html'` 那一筆是唯一的特例，理由寫在這裡免得日後有人以為是隨手寫的：
   * tools/classifications.html 的 33 個分級系統**沒有對應的資料檔**，它們是
   * 直接寫在那一頁的 HTML 裡（`<div class="sys-head" id="sys-hinchey">` …）。
   * 那一頁自己的 clGoto() 也正是用 `document.getElementById('sys-'+id)` 去找，
   * 所以「那一頁的 DOM」就是這批東西唯一的真相來源。與其在這裡抄一份 33 筆的
   * 對照表（＝第二個真相來源，改一邊忘一邊），不如把那一頁抓回來用 DOMParser
   * 讀它自己的節點——選擇器跟 clGoto() 指的是同一個 id 前綴，那一頁改版時
   * 兩邊會一起壞、不會出現「連結還在但跳錯地方」這種沉默的錯。
   * DOMParser 不執行 <script>、不載子資源，只是把字串解析成一棵離線的 DOM。 */
  var SUB_FILES = [
    { id: 'db',      url: 'data/drugs/index.js',
      have: function () { return !!(window.DRUGDB_INDEX && window.DRUGDB_INDEX.length); } },
    { id: 'abxdrug', url: 'data/antibiotics/drugs.js',
      have: function () { return !!(window.DRUGS && Object.keys(window.DRUGS).length); } },
    { id: 'abxsite', url: 'data/antibiotics/regimens.js',
      have: function () { return !!(window.SITES && window.SITES.length); } },
    { id: 'classif', url: 'tools/classifications.html', kind: 'html',
      have: function () { return !!(classifSys && classifSys.length); } }
  ];
  /* 第五個來源（13 筆，各自一個檔）：分頁式頁面的頁內分頁。
     宣告方式與上面四個一樣是 SUB_FILES 的一員，只多一個 wave:2 標記——
     排在第二波，理由與排程見 startWave2()。網址取自 facets.js，
     這裡不重抄一份路徑。 */
  TAB_PAGES.forEach(function (k) {
    var t = byKey[k];
    if (!t || !t.href) return;
    SUB_FILES.push({
      id: 'tab:' + k, url: t.href, kind: 'tabs', pk: k, wave: 2,
      have: function () { return !!tabsOf[k]; }
    });
  });
  var DRUG_MIN_Q = 2;
  var subState = 0;           // 0 未載入 ／ 1 載入中（可能已有部分結果）／ 2 全部塵埃落定
  var subIdx = [];
  var subDone = {};           // 每個來源各自的結果：true 拿到了／false 取不到
  var subStat = { abx: 0, db: 0, classif: 0, tab: 0, ms: 0 };
  var classifSys = null;      // tools/classifications.html 解析出來的 33 筆
  var classifAast = null;     // 同一份 HTML 裡 AAST EGS 的 16 個疾病

  /* 注入的 <script> 是造句設計唯一會留在 DOM 上的殘留物（實測：關掉 data-ui
     之後 body.innerText 逐字相同、零殘留可見節點，只多這幾個 <head> 裡的
     <script>）。刻意**不在 teardown 時移除**：資料已經在 window.DRUGDB_INDEX／
     window.DRUGS／window.SITES 上，拿掉標籤不會把它們從記憶體釋放，那只是把帳
     做漂亮而已；反過來若真的拿掉，下次切回造句設計又得重抓一次。改成標上
     data-ui-chrome，讓 parity.py 的規則 A（querySelectorAll('[data-ui-chrome]')
     整棵子樹排除）跟其他造句 chrome 一視同仁地把它排掉。 */
  function loadSubFile(f, done) {
    if (f.kind === 'html') {
      if (!window.fetch || !window.DOMParser) { done(f.id); return; }
      fetch(ROOT + f.url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (txt) {
        classifSys = parseClassif(txt);
        classifAast = parseAast(txt);
        done(classifSys.length ? null : f.id);
      })['catch'](function () { done(f.id); });
      return;
    }
    if (f.kind === 'tabs') {
      if (!window.fetch || !window.DOMParser) { done(f.id); return; }
      fetch(ROOT + f.url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (txt) {
        var got = parseTabs(txt);
        tabsOf[f.pk] = got;
        done(got.tabs.length ? null : f.id);
      })['catch'](function () { tabsOf[f.pk] = { name: '', tabs: [] }; done(f.id); });
      return;
    }
    var s = document.createElement('script');
    s.src = ROOT + f.url;
    s.async = true;
    s.setAttribute('data-ui-chrome', 'sentence-subdata');
    s.onload = function () { done(null); };
    s.onerror = function () { done(f.id); };
    (document.head || document.documentElement).appendChild(s);
  }

  /* 從 tools/classifications.html 的 HTML 讀出 33 個分級系統。
     取三段：id（＝深層連結 #sys=<id> 的值）、中文名 .sys-name、英文名 .sys-en、
     出處 .sys-src；分頁名稱從它所在的 <div id="tab-xxx"> 反查 #cl_tabs 裡
     那顆按鈕的文字（「膽道」「圍手術期」…），拿來當麵包屑的中間那一層。 */
  function parseClassif(html) {
    var out = [];
    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var tabName = {};
      [].slice.call(doc.querySelectorAll('#cl_tabs .tab-btn[data-tab]')).forEach(function (b) {
        tabName[b.getAttribute('data-tab')] = (b.textContent || '').trim();
      });
      [].slice.call(doc.querySelectorAll('.sys-head[id^="sys-"]')).forEach(function (h) {
        var id = h.id.replace(/^sys-/, '');
        if (!id) return;
        function pick(sel) {
          var e = h.querySelector(sel);
          return e ? (e.textContent || '').trim() : '';
        }
        var pane = h.closest ? h.closest('[id^="tab-"]') : null;
        var tab = pane ? pane.id.replace(/^tab-/, '') : '';
        out.push({ id: id, name: pick('.sys-name'), en: pick('.sys-en'),
                   src: pick('.sys-src'), tab: tabName[tab] || '' });
      });
    } catch (e) { return []; }
    return out;
  }

  /* AAST EGS 那一格是**一個下拉選單裡的 16 個疾病**，不是 16 個 sys-head，
     所以 DOMParser 讀不到——它們在那一頁的 <script> 裡，是一個名為 AAST 的
     陣列（`{k:'A',zh:'急性闌尾炎',en:'Acute Appendicitis',img:…,val:…,g:[…]}`）。
     DOMParser **不執行** <script>，這裡因此改用正規式從同一份 HTML 原文抓
     k／zh／en 三個欄位。抓的是那一頁自己寫的字，不是另抄一份清單；
     欄位順序 k→zh→en 與該頁的 aeFill()（`d.k+'. '+d.zh+'（'+d.en+'）'`）
     取用的是同三個欄位，那一頁改欄位名時這裡會一起變成 0 筆（＝看得見的壞），
     不會出現「連結還在但指到別的疾病」這種沉默的錯。 */
  function parseAast(html) {
    var out = [], re = /\{k:'([A-Z])',zh:'([^']*)',en:'([^']*)'/g, m;
    try {
      while ((m = re.exec(html))) out.push({ k: m[1], zh: m[2], en: m[3] });
    } catch (e) { return []; }
    return out;
  }

  /* ---------------------------------------------------------------
   * 一個分頁式頁面的分頁清單怎麼讀出來（回傳 [{id, label, en, hash}]）
   * ---------------------------------------------------------------
   * 讀不出來、或驗不過，就回 []——寧可那一頁在索引裡是 0 筆（看得見的壞），
   * 也不要產生一條「點了跳到頁首」的假連結，那比不做還糟。
   *
   * (1) 分頁 id 與名稱
   *     12 頁寫在 markup 裡，兩種屬性名各半：
   *       <button class="rsi-tab" data-p="dx">診斷 Diagnosis</button>
   *       <button class="tab-btn" data-tab="spon">自發性 Spontaneous ICH</button>
   *     兩者一起收，DOMParser 讀得到。
   *     tools/heart-failure.html 是唯一的例外：它的 <nav id="tabbar"> 在原始
   *     HTML 裡是**空的**，14 顆按鈕由該頁自己的 JS 從
   *     `var TABS = [['definition','壹 定義・病因','Definition'], …]` 生出來，
   *     而 **DOMParser 不執行 <script>**（parseAast() 已經踩過同一個坑並在
   *     註解裡寫明）。所以那一頁改用正規式從同一份原文抓那個陣列——抓的是
   *     它自己寫的字，不是另抄一份清單；它改欄位這裡會一起變成 0 筆。
   *     那個陣列本來就把中文名與英文名分成兩欄，所以 en 直接有。
   *
   * (2) hash 形式：**一律以那一頁自己的 JS 為準，不從 markup 猜**
   *     實測這 13 頁至少有兩套，而且 markup 相同的頁面未必同一套：
   *       · `location.hash.match(/#tab=(\w+)/)`（4 頁）
   *         `/#tab=(spon|sah)/.exec(location.hash)`（2 頁）  → 要寫 `#tab=<id>`
   *       · `(location.hash||'').replace('#','')` ＋ `getElementById('p-'+h)`（6 頁）
   *         `location.hash.slice(1)`（1 頁）                → 要寫裸名 `#<id>`
   *     判斷依據就是「這一頁有沒有把 #tab= 拿去跟 location.hash 一起用」，
   *     兩種寫法都在同一行，所以用同一行內的共現去認。
   *
   * (3) 驗證：每個分頁 id 都要在這一頁的 DOM 裡找得到對應的窗格元素
   *     窗格的 id 前綴也是**讀出來的**，不是寫死 'p-'／'tab-'（實測三種都有：
   *     p-／tab-／t-，而且 pathways/ich.html 連 'tab-'+k 這種串接都沒有，
   *     它寫的是 getElementById('tab-spon') 字面值，靠掃原文抓前綴會漏掉它）。
   *     做法純靠 DOM：找出 id 以「第一個分頁 id」結尾的元素、取它們的前綴當
   *     候選，再要求同一個前綴對**每一個**分頁都找得到元素。這樣前綴是被
   *     驗證出來的，不是被猜出來的。
   *
   * (4) 麵包屑前段那個頁名，也向這一份 HTML 要
   *     直接用 facets.js 的 tools[].name 會印出「腦出血與 SAH Spontaneous ICH &
   *     Aneurysmal SAH Pathway › 動脈瘤性 Aneurysmal SAH」這種一行塞不下的東西。
   *     repo 本來就有「頁面簡稱」這個欄位：<body data-back-label="自發性腦出血決策">
   *     ——js/backlink.js 生返回鍵時用的就是它（見 schema/check_pages.py 的規則）。
   *     所以有 data-back-label 就用它，沒有的（頁名本來就短的那幾頁）才退回
   *     facets 的 name。兩者都是既有的真實欄位，這裡沒有新編任何名字。 */
  function parseTabs(html) {
    var out = [], pageName = '';
    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var bd = doc.body;
      if (bd && bd.getAttribute) pageName = (bd.getAttribute('data-back-label') || '').trim();

      [].slice.call(doc.querySelectorAll('button[data-p],button[data-tab]')).forEach(function (b) {
        var id = b.getAttribute('data-p') || b.getAttribute('data-tab');
        var label = (b.textContent || '').replace(/\s+/g, ' ').trim();
        if (id && label) out.push({ id: id, label: label, en: '' });
      });
      if (!out.length) {
        var blk = /\bTABS\s*=\s*\[([\s\S]*?)\]\s*;/.exec(html);
        if (blk) {
          var re = /\[\s*'([\w-]+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\]/g, m;
          while ((m = re.exec(blk[1]))) out.push({ id: m[1], label: m[2], en: m[3] });
        }
      }
      if (!out.length) return { name: pageName, tabs: [] };

      // 這一頁根本不讀 hash：連不進去
      if (!/location\.hash/.test(html)) return { name: pageName, tabs: [] };
      var qForm = /location\.hash[^\n]*#tab=|#tab=[^\n]*location\.hash/.test(html);

      var first = out[0].id, cand = [];
      [].slice.call(doc.querySelectorAll('[id]')).forEach(function (el) {
        var id = el.id || '';
        if (id.length > first.length && id.slice(-first.length) === first) {
          var p = id.slice(0, id.length - first.length);
          if (cand.indexOf(p) < 0) cand.push(p);
        }
      });
      var pfx = null;
      cand.forEach(function (p) {
        if (pfx !== null) return;
        var ok = true;
        out.forEach(function (o) { if (!doc.getElementById(p + o.id)) ok = false; });
        if (ok) pfx = p;
      });
      if (pfx === null) return { name: pageName, tabs: [] };

      out.forEach(function (o) { o.hash = qForm ? ('#tab=' + o.id) : ('#' + o.id); });
    } catch (e) { return { name: '', tabs: [] }; }
    return { name: pageName, tabs: out };
  }

  /* 分頁名稱在 markup 裡是**一個字串**（「診斷 Diagnosis」），classif 那一批
     則本來就是 .sys-name／.sys-en 兩個節點。為了讓兩批在候選清單上長得一樣
     （中文大字 ＋ 英文小字，見 sayItemHTML() 的 .sai-dname／.sai-dzh），
     這裡把「中文 ＋ 空白 ＋ 純西文尾巴」拆成兩段。拆不開的整串當中文名——
     「急刀／反轉」（沒有英文）、「Caprini（外科）」「NRS-2002 篩檢」
     「IMPROVE 出血」（西文在前、中文在後）都屬於這一類，硬拆只會拆錯。
     比對字串（head）仍然是兩段合起來，與 classif 的 head 同一條規則。 */
  function splitTabLabel(s, en) {
    s = String(s || '').trim();
    if (en) return { name: s, en: String(en).trim() };
    var m = /^(.*[^\x00-\x7F])\s+([A-Za-z][A-Za-z0-9 .+\-\/]*)$/.exec(s);
    return m ? { name: m[1].trim(), en: m[2].trim() } : { name: s, en: '' };
  }

  /* 每個候選項長什麼樣：grp 決定它落在哪一組（也就是哪一頁），path 是麵包屑的
     前段（不含自己），w 是同組同分時的先後（依部位 → 依病原菌 → 藥物查詢，
     跟 tools/antibiotics.html 自己那三個模式的排序一致）。 */
  function subPush(out, o) { out.push(o); }

  function buildSubIndex() {
    var t0 = (window.performance && performance.now) ? performance.now() : 0;
    var out = [];

    /* ── 抗生素 · 依部位（10 筆）：#site=<index> ──
       深層連結收的是**陣列索引**不是 id（js/antibiotics.js 的 applyHash 是
       `/^site=(\d+)$/` 再 `SITES[i]`），所以這裡必須用 forEach 的 i，
       不能改用 s.id——用錯了會連到別的部位，而且不會報錯。 */
    (window.SITES || []).forEach(function (s, i) {
      if (!s || !s.name) return;
      var head = (s.name + ' ' + (s.en || '')).toLowerCase();
      var nType = (s.types || []).length;
      subPush(out, {
        grp: 'abx', w: 0, path: ABX_SITE_PATH,       // 同一份麵包屑也給軌跡用，見 landedSitePath()
        name: s.name, en: s.en || '',
        meta: nType ? (nType + ' 種型態') : '',
        href: 'tools/antibiotics.html#site=' + i,
        head: head, hay: (head + ' ' + (s.id || '')).toLowerCase()
      });
    });

    /* ── 抗生素 · 依病原菌（44 筆）：#bac=<en> ──
       applyHash 是拿 `b.en === m[1]` 逐一比對，所以連結值必須是 en 原字串
       （含逗號與空格，encodeURIComponent 之後仍解得回來）。 */
    (window.BACTERIA || []).forEach(function (g) {
      (g.items || []).forEach(function (b) {
        if (!b || !b.en) return;
        var head = ((b.name || '') + ' ' + b.en).toLowerCase();
        subPush(out, {
          grp: 'abx', w: 1, path: '抗生素指引 › 依病原菌 › ' + (g.group || ''),
          name: b.name || b.en, en: b.name ? b.en : '',
          meta: (b.regimens || []).length ? ((b.regimens || []).length + ' 組建議') : '',
          href: 'tools/antibiotics.html#bac=' + encodeURIComponent(b.en),
          head: head, hay: (head + ' ' + (b.kw || '')).toLowerCase()
        });
      });
    });

    /* ── 抗生素 · 藥物查詢（155 筆）：#drug=<key> ── */
    var A = window.DRUGS || {};
    Object.keys(A).forEach(function (k) {
      var d = A[k];
      if (!d || !d.name) return;
      // 商品名兩處都要收：brands[]（常用商品名）與 ntuhProducts[]（台大院內品項，
      // 含中文品名）。`tazocin` 命中的正是 brands[0]／ntuhProducts[0].en。
      var brands = [];
      (d.brands || []).forEach(function (b) { if (b) brands.push(b); });
      (d.ntuhProducts || []).forEach(function (p) {
        if (p && p.en && brands.indexOf(p.en) < 0) brands.push(p.en);
        if (p && p.zh && brands.indexOf(p.zh) < 0) brands.push(p.zh);
      });
      var head = (d.name + ' ' + (d.zh || '') + ' ' + brands.join(' ')).toLowerCase();
      subPush(out, {
        grp: 'abx', w: 2, path: ABX_LOOKUP_PATH,
        name: d.name, en: d.zh || '',
        meta: [brands.join('／'), d.cls || ''].filter(Boolean).join(' · '),
        href: 'tools/antibiotics.html#drug=' + encodeURIComponent(k),
        head: head, hay: (head + ' ' + (d.cls || '') + ' ' + k).toLowerCase()
      });
    });

    /* ── 藥物資料庫（2,390 筆，含抗生素卡與非台大處方）：#code=<code> ── */
    (window.DRUGDB_INDEX || []).forEach(function (d) {
      if (!d || !d.name) return;
      var head = (d.name + ' ' + (d.brand || '') + ' ' + (d.zh || '')).toLowerCase();
      subPush(out, {
        grp: 'db', w: 0, path: '藥物資料庫',
        name: d.name, en: d.zh || '',
        meta: [d.brand || '', (d.cls && d.cls.length) ? d.cls.join('／') : ''].filter(Boolean).join(' · '),
        href: 'tools/drug-database.html#code=' + encodeURIComponent(d.code),
        head: head,
        hay: (head + ' ' + (d.codes || [d.code]).join(' ') + ' ' +
              (d.cls || []).join(' ') + ' ' + (d.tags || []).join(' ') + ' ' +
              (d.atc || []).join(' ')).toLowerCase()
      });
    });

    /* ── 分類與分級系統（33 筆）：#sys=<id> ──
       fs／fc 是 data/facets.js 的 FACETS.classif 給的面向標註（只有面向詞，
       沒有臨床文字）；沒對到標註的系統照樣列出來，只是不會被句子挑中——
       這比為了湊滿而亂標好。 */
    (classifSys || []).forEach(function (s) {
      var head = (s.name + ' ' + (s.en || '')).toLowerCase();
      var tag = CLASSIF_TAG[s.id] || null;
      subPush(out, {
        grp: 'classif', w: 0, key: s.id,
        path: '分類與分級系統' + (s.tab ? ' › ' + s.tab : ''),
        name: s.name, en: s.en || '', meta: s.src || '',
        href: 'tools/classifications.html#sys=' + encodeURIComponent(s.id),
        head: head, hay: (head + ' ' + (s.src || '') + ' ' + s.id).toLowerCase(),
        fs: tag && tag.s, fc: tag && tag.c
      });
    });

    /* ── AAST EGS 的 16 個疾病（各一張表）：?aast=<k>#sys=aast ──
       那一頁**沒有**為 16 個疾病提供深層連結（clApplyHash 只認 #sys= 與 #tab=），
       所以走查詢字串：`?aast=A` 由本檔在該頁載入後把下拉選單切過去
       （見 applyAastParam()），hash 仍是 #sys=aast 讓那一頁自己的 clGoto()
       負責切分頁與捲動——兩邊各做各的，沒有動到 tools/classifications.html。
       母項（AAST EGS 統一分級）就是 classifSys 裡 id='aast' 的那一筆，
       這 16 筆用 parent 指回去，句子命中子疾病時母項會被讓開。 */
    var aastHead = null;
    (classifSys || []).forEach(function (s) { if (s.id === 'aast') aastHead = s; });
    (classifAast || []).forEach(function (d) {
      var head = (d.zh + ' ' + d.en).toLowerCase();
      var tag = CLASSIF_TAG['aast/' + d.k] || null;
      subPush(out, {
        grp: 'classif', w: 1, key: 'aast/' + d.k, child: true, parent: 'aast',
        path: '分類與分級系統' + (aastHead && aastHead.tab ? ' › ' + aastHead.tab : '') +
              ' › ' + (aastHead ? aastHead.name : 'AAST EGS'),
        crumb: (aastHead ? aastHead.name : 'AAST EGS') + ' ' + d.k,
        name: d.zh, en: d.en, meta: '',
        href: 'tools/classifications.html?aast=' + encodeURIComponent(d.k) + '#sys=aast',
        head: head, hay: (head + ' aast ' + d.k).toLowerCase(),
        fs: tag && tag.s, fc: tag && tag.c
      });
    });

    /* ── 13 個分頁式頁面的頁內分頁（第 9 輪新增）──
       hash 由 parseTabs() 依那一頁自己的 JS 判定（`#tab=<id>` 或裸名 `#<id>`，
       逐頁不同，不是同一套），這裡只負責把它接到 facets.js 給的 href 後面。
       path 用 facets 的頁名（「肺栓塞」），與抗生素那三層同一套麵包屑寫法，
       候選項因此印成「肺栓塞 › 危險分層 Risk」而不是只有分頁名。
       head 只收分頁自己的中英名（打「危險分層」要命中的是那一個分頁）；
       頁名與頁面英文名收在 hay（第四級），這樣打「肺栓塞」時工具那一筆仍然
       排在前面，五個分頁跟在後面當延伸，不會反過來把工具淹掉。 */
    TAB_PAGES.forEach(function (k) {
      var t = byKey[k], got = tabsOf[k];
      if (!t || !got || !got.tabs || !got.tabs.length) return;
      var list = got.tabs, pname = got.name || t.name;
      list.forEach(function (o, i) {
        var lab = splitTabLabel(o.label, o.en);
        var head = (lab.name + ' ' + lab.en).toLowerCase();
        subPush(out, {
          grp: 'tab', w: i, pk: k, key: k + '/' + o.id,
          path: pname,
          name: lab.name, en: lab.en,
          meta: '第 ' + (i + 1) + ' / ' + list.length + ' 個分頁',
          href: t.href + o.hash,
          head: head,
          // 頁名兩種都收（頁面簡稱與 facets 的全名），打哪一個都找得到這幾個分頁
          hay: (head + ' ' + pname + ' ' + t.name + ' ' + (t.en || '') + ' ' + o.id).toLowerCase()
        });
      });
    });

    var n = { abx: 0, db: 0, classif: 0, tab: 0 };
    out.forEach(function (x) { n[x.grp]++; });
    subIdx = out;
    buildCovIndex();       // 覆蓋菌種索引：同一批 window.DRUGS 再掃一次，不多抓任何檔
    subStat = { abx: n.abx, db: n.db, classif: n.classif, tab: n.tab,
                ms: ((window.performance && performance.now) ? performance.now() : 0) - t0 };
  }

  /* ================================================================
   * 17. 覆蓋菌種索引：打菌名／菌類 → 列出所有涵蓋牠的抗生素
   * ================================================================
   * 使用者原話：「請讓我在『說整句』的查詢欄可以查詢『esbl』／『原蟲』或某類
   * 菌種即可查詢到所有有該菌種感受性的 badge 的抗生素（效果如同點選藥物敏感性
   * 的徽章）」。在這一輪之前打 `esbl` 是 0 筆、打 `原蟲` 也是 0 筆——藥卡那 155 筆
   * 的比對字串（buildSubIndex() 的 head／hay）只收藥自己的身分（學名／中文品名／
   * 商品名／藥理次分類／key），**一個菌名都沒有**。
   *
   * ---------------------------------------------------------------
   * 為什麼不是「把菌名塞進藥的 hay」（原本的第一直覺，量過之後改掉）
   * ---------------------------------------------------------------
   * 塞進 hay 最省事，但那樣命中的藥會落在既有的「抗生素指引」那一組，跟
   * **藥名命中**的結果混在同一份清單裡，而且一律是 R_HAY 同一級——使用者看不出
   * 「這一筆是因為藥名有這幾個字」還是「這一筆是因為牠涵蓋這隻菌」，更看不出
   * 涵蓋到什麼程度。點徽章列出來的清單本身是有分級的（藥卡上四級燈號），
   * 抹掉分級就不是「效果如同點選徽章」。所以改成**獨立的一組**：
   * 獨立索引、獨立標頭（依覆蓋菌種）、每一列掛一顆與藥卡上同一套語彙的
   * `.cov-tag` 燈號徽章（強效／涵蓋／變異）。藥名命中那一組行為一個字都沒動。
   *
   * ---------------------------------------------------------------
   * 只收三級，`no` 一律不進索引
   * ---------------------------------------------------------------
   * covTier() 的四級（js/antibiotics.js 第 7 行）：2＝強效、1＝涵蓋、'p'＝部分／
   * 變異、0 或缺＝不涵蓋。**只收前三級**——把「不涵蓋」也收進來的話，打 MRSA
   * 會跑出一堆對 MRSA 無效的藥，那比找不到更危險。
   * 這條線與 tools/antibiotics.html 點徽章之後那一段篩選逐字相同
   * （js/antibiotics.js renderLookup()：`v===2||v===1||v==='p'`），所以「說整句」
   * 列出來的清單與點徽章列出來的清單**成員一致**（實測逐筆比對過，數量與成員
   * 全等）。'p'（變異）刻意**收**而不是丟：丟掉就與徽章那條路對不上，而且它在
   * 畫面上是琥珀虛線框的獨立一級，不會被誤讀成「有效」。
   *
   * ---------------------------------------------------------------
   * 標籤從哪裡來（不新增任何靜態菌名清單）
   * ---------------------------------------------------------------
   * 四組標籤表是 data/antibiotics/regimens.js 匯出的 window.COV_LABELS／
   * COV_LABELS_FUNGAL／COV_LABELS_VIRAL／COV_LABELS_PARA，那個檔本來就是
   * SUB_FILES 的第三個來源（id:'abxsite'，56 KB），打字時本來就會抓。
   * 這裡唯一「抄」的是 covSet → 哪一張表 的三行對照（與 js/antibiotics.js 的
   * COV_SETS 同一份語意）——那是**繫結**不是資料：菌名一個字都沒有寫在這裡，
   * 全部向 window.COV_LABELS* 要，表改了這裡跟著變。萬一 regimens.js 取不到
   * （離線未快取），標籤退回 cov 的 key 本身（`esbl`／`ameba`），仍然查得到、
   * 只是徽章上印的是英數鍵——不假裝有中文名。
   *
   * 分級的中文字（強效／涵蓋／變異）取自 js/antibiotics.js 第 7 行自己寫的字，
   * class 名（sy-hi／yes／partial）則直接沿用 css/ui-sentence.css §Q4 那套
   * `.cov-tag` 燈號（4px 立柱填 100%／66%／33% ＋ 2px 實線／1px 實線／1px 虛線），
   * 所以候選清單上的徽章與藥卡上的徽章**是同一顆東西**，不是另外畫一組。 */
  var COV_TIER = {
    '2': { c: 'sy-hi',   zh: '強效', o: 0 },
    '1': { c: 'yes',     zh: '涵蓋', o: 1 },
    'p': { c: 'partial', zh: '變異', o: 2 }
  };
  function covTierOf(v) {
    if (v === 2) return COV_TIER['2'];
    if (v === 1) return COV_TIER['1'];
    if (v === 'p') return COV_TIER['p'];
    return null;                       // 0／undefined／其他 → 不涵蓋，不進索引
  }
  function covTables() {
    return { 'default': window.COV_LABELS, fungal: window.COV_LABELS_FUNGAL,
             viral: window.COV_LABELS_VIRAL, para: window.COV_LABELS_PARA };
  }
  var covOrgs = [];                                    // [{set,key,label,hay,drugs[]}]
  var covStat = { orgs: 0, pairs: 0, nolabel: 0 };
  function buildCovIndex() {
    var A = window.DRUGS || {}, tbl = covTables();
    var bucket = {}, order = [], pairs = 0, nolabel = 0;
    Object.keys(A).forEach(function (k) {
      var d = A[k];
      if (!d || !d.cov || !d.name) return;
      var set = d.covSet || 'default';
      Object.keys(d.cov).forEach(function (key) {
        var tier = covTierOf(d.cov[key]);
        if (!tier) return;
        var id = set + '|' + key;
        if (!bucket[id]) {
          var lab = (tbl[set] && tbl[set][key]) || '';
          if (!lab) nolabel++;
          bucket[id] = { set: set, key: key, label: lab || key,
                         hay: ((lab || '') + ' ' + key).toLowerCase(), drugs: [] };
          order.push(id);
        }
        bucket[id].drugs.push({ k: k, d: d, tier: tier });
        pairs++;
      });
    });
    // 同一隻菌底下先照分級（強效→涵蓋→變異）再照學名排，與藥卡上燈號由亮到暗一致
    order.forEach(function (id) {
      bucket[id].drugs.sort(function (x, y) {
        return x.tier.o - y.tier.o ||
          (x.d.name < y.d.name ? -1 : x.d.name > y.d.name ? 1 : 0);
      });
    });
    covOrgs = order.map(function (id) { return bucket[id]; });
    covStat = { orgs: covOrgs.length, pairs: pairs, nolabel: nolabel };
  }

  /* 菌名比對只做三級（前綴／整詞／子字串），**不做子序列容錯**——理由與藥名
     那一段同源：28 隻菌的名字都很短，子序列會把 `hbv`／`hiv`／`hsv` 這種三個
     字母的東西互相撈出來。查詢對到不只一隻菌是正常的（打「原蟲」同時對到
     「原蟲 ameba」與「瘧原蟲 malaria」），兩隻都算命中、按名次先後展開；
     同一顆藥被兩隻菌各撈一次時只留名次較前的那一筆，另一隻的名字併進
     meta 那一行的「同時涵蓋：…」——列兩次會讓「共幾種藥」這個數字失真。 */
  function covSearch(q) {
    var res = { list: [], note: '' };
    if (!covOrgs.length || !q) return res;
    var orgs = [];
    covOrgs.forEach(function (o) {
      var r = -1;
      if (o.hay.indexOf(q) === 0) r = R_PREFIX;
      else if ((' ' + o.hay).indexOf(' ' + q) >= 0) r = R_WORD;
      else if (o.hay.indexOf(q) >= 0) r = R_SUB;
      if (r >= 0) orgs.push({ r: r, o: o });
    });
    if (!orgs.length) return res;
    orgs.sort(function (x, y) { return x.r - y.r; });
    var seen = {}, out = [];
    orgs.forEach(function (g) {
      g.o.drugs.forEach(function (x) {
        if (seen[x.k]) {
          if (seen[x.k].more.indexOf(g.o.label) < 0) seen[x.k].more.push(g.o.label);
          return;
        }
        var e = {
          grp: 'cov', w: x.tier.o, key: x.k,
          path: ABX_LOOKUP_PATH + ' › 涵蓋 ' + g.o.label,
          name: x.d.name, en: x.d.zh || '',
          meta: x.d.cls || '',
          href: 'tools/antibiotics.html#drug=' + encodeURIComponent(x.k),
          tier: x.tier, org: g.o.label, more: [],
          head: '', hay: ''
        };
        seen[x.k] = e;
        out.push({ r: g.r, kind: 'sub', d: e });
      });
    });
    out.sort(function (x, y) {
      return x.r - y.r || x.d.w - y.d.w ||
        (x.d.name < y.d.name ? -1 : x.d.name > y.d.name ? 1 : 0);
    });
    res.list = out;
    /* 副標把「命中了哪幾顆徽章、各幾種藥」唸出來——這一組跟藥名命中不一樣，
       使用者得看得到「為什麼是這幾顆藥」。但徽章名最多只唸 NOTE_CAP 顆：
       單一個拉丁字母（打了 `esbl` 之後刪成 `e`）會對到 12 顆徽章、61 種藥，
       全部唸出來會變成一整段字牆（實測 `a` 對到 20 顆／77 種）。
       超過就講「等 N 顆徽章」——截斷了照樣講清楚，不靜悄悄少講。 */
    var NOTE_CAP = 4;
    var names = orgs.slice(0, NOTE_CAP).map(function (g) {
      return g.o.label + '（' + g.o.drugs.length + ' 種）';
    }).join('、');
    res.note = '命中徽章：' + names +
      (orgs.length > NOTE_CAP ? ' 等 ' + orgs.length + ' 顆徽章' : '') +
      ' · 只列強效／涵蓋／變異三級，藥卡上暗掉（不涵蓋）的不列';
    return res;
  }

  /* 四個來源**各自到齊各自生效**，不等最慢的那一個：合計約 911 KB
     （處方集 314 ＋ 抗生素藥卡 363 ＋ regimens 56 ＋ classifications 178），
     等全部到齊才顯示的話，最小的 regimens（56 KB，10 個部位 ＋ 44 隻菌）
     會被最大的那份拖著一起等。所以每一個 done() 都重建一次索引再重畫一次
     （建索引實測 5 ms 上下，重建四次的成本遠低於讓人乾等）。 */
  /* only（可選）＝只載這幾個來源。第 8 輪加這個參數的理由：
     造句收斂到分類與分級系統時要**自動**把頁內那一格攤開給使用者看，而
     原本的 ensureSubIndex() 一次抓四個來源合計約 911 KB。分級系統只需要
     tools/classifications.html 一個（178 KB），為了顯示一行「闌尾炎那張表」
     去抓另外 733 KB 的藥名資料是白付的。「說整句」那條路仍然不帶 only，
     行為與這一輪之前逐字相同（打字才抓、抓全部）。 */
  var subFileState = {};      // 每個來源各自的載入狀態：undefined 未要求／1 進行中／2 已塵埃落定
  function subFileById(id) {
    for (var i = 0; i < SUB_FILES.length; i++) if (SUB_FILES[i].id === id) return SUB_FILES[i];
    return null;
  }
  function refreshSubState() {
    var inflight = false, asked = false;
    SUB_FILES.forEach(function (f) {
      if (subFileState[f.id]) asked = true;
      if (subFileState[f.id] === 1) inflight = true;
    });
    subState = inflight ? 1 : (asked ? 2 : 0);
  }
  function ensureSubIndex(onReady, only) {
    var todo = SUB_FILES.filter(function (f) {
      // 第二波的 13 個檔平常由 startWave2() 自己排隊，不跟第一波擠；
      // 但點名要某一頁（候選清單那顆「5 個分頁 ⌄」）時可以直接插隊。
      if (f.wave === 2 && !(only && only.indexOf(f.id) >= 0)) return false;
      if (only && only.indexOf(f.id) < 0) return false;
      return !subFileState[f.id];
    });
    if (!only) wave2Want = true;
    if (!todo.length) { if (onReady) onReady(); startWave2(); return; }
    todo.forEach(function (f) { subFileState[f.id] = 1; });
    refreshSubState();
    todo.forEach(function (f) {
      function done(err) {
        subFileState[f.id] = 2;
        subDone[f.id] = !err;
        refreshSubState();
        buildSubIndex();
        if (onReady) onReady();
        startWave2();
      }
      if (f.have()) { done(null); return; }   // 這一頁本來就載過了（抗生素頁／藥物資料庫頁）
      loadSubFile(f, done);
    });
  }

  /* ---------------------------------------------------------------
   * 第二波：13 個分頁式頁面（約 974 KB）背景一頁一頁抓
   * ---------------------------------------------------------------
   * 為什麼要分兩波，不是把 13 個檔加進上面那一批一起發：
   *   第一波四個來源合計約 911 KB（處方集 314 ＋ 抗生素藥卡 363 ＋ regimens 56
   *   ＋ classifications 178），這 13 頁另外約 974 KB。擠在同一波，等於使用者
   *   為了查一個藥名先付 1.8 MB，而且最小的 regimens（56 KB）會被 13 個 HTML
   *   一起排在後面拖著。所以：第一波四個各自到齊各自生效（原行為不變），
   *   四個都塵埃落定之後才開始第二波；第二波**串著抓、一頁一頁來**（不是 13 個
   *   一起發），每抓完一頁就併進索引重畫一次，搜尋結果逐步變完整。
   *
   * 「首頁打字之前一個位元組都不抓」那條線兩波都守：第二波只由**不帶 only 的**
   * ensureSubIndex()（＝使用者真的在「說整句」打了 DRUG_MIN_Q 個字）叫醒，
   * autoloadSubsFor() 那條帶 only 的路（句子收斂到分級系統）不會把它拖下水。
   *
   * 這 13 頁本來就在 sw.js 的 PRECACHE_URLS 裡（逐一核對過，13 個全在），
   * 所以第二次造訪與離線時走的是 service worker 快取，不是每次都上網路。 */
  var wave2Want = false, wave2Busy = false;
  function wave2Files() { return SUB_FILES.filter(function (f) { return f.wave === 2; }); }
  function wave1Settled() {
    var ok = true;
    SUB_FILES.forEach(function (f) {
      if (f.wave !== 2 && subFileState[f.id] !== 2) ok = false;
    });
    return ok;
  }
  /* 第二波每併進一頁就重畫一次。看的是使用者現在在看哪一塊：「說整句」開著
     就重畫候選清單（那正是他打字要的東西），否則才重畫首頁（可能有人把某一頁的
     「5 個分頁 ⌄」攤開著）。內頁沒有這兩塊，什麼都不畫。 */
  function wave2Paint() {
    if (sayOpen) { renderSay(sayQ); return; }
    if (isHome() && sentenceOn()) renderHome();
  }
  function startWave2() {
    if (wave2Busy || !wave2Want || !wave1Settled()) return;
    var todo = wave2Files().filter(function (f) { return !subFileState[f.id]; });
    if (!todo.length) return;
    wave2Busy = true;
    (function next(i) {
      if (i >= todo.length) { wave2Busy = false; refreshSubState(); wave2Paint(); return; }
      var f = todo[i];
      // 排隊期間使用者可能已經自己點開了這一頁（ensureSubIndex 的插隊路徑），
      // 那就跳過，不要重抓一次。
      if (subFileState[f.id]) { next(i + 1); return; }
      subFileState[f.id] = 1;
      refreshSubState();
      function done(err) {
        subFileState[f.id] = 2;
        subDone[f.id] = !err;
        refreshSubState();
        buildSubIndex();
        wave2Paint();
        next(i + 1);
      }
      if (f.have()) { done(null); return; }
      loadSubFile(f, done);
    })(0);
  }

  /* 造句收斂到某個「頁內還有一層」的標的時，把那一層的資料先抓回來。
     只認 classif 一個來源，理由寫在 subMatch() 上面那段：抗生素與處方集的
     頁內項目沒有面向標註，句子過濾對它們不成立，抓回來也只是多一顆按鈕上的
     數字，不值 733 KB。 */
  var SENT_AUTOLOAD = { classif: 'classif' };   // SUBTARGET_OF[].grp → SUB_FILES[].id
  /* 第二個自動載入的來源（第 11 輪）：落點升級（deepLanding()）要讀 window.SITES
     才知道句子的部位對到哪一格，而首頁本來不載 data/antibiotics/regimens.js。
     所以句子裡**真的有部位**、而且候選清單裡真的有「依部位」時，才去抓那一個檔
     ——56 KB，四個來源裡最小的一個，而且它本來就在 sw.js 的 PRECACHE_URLS 裡
     （逐一核對過），第二次造訪與離線走的是 service worker 快取。
     抓回來會再 renderHome() 一次，連結才從 #mode=empiric 換成 #site=N；在那之前
     點下去仍然是原本的落點（慢一步，不會壞）。
     其餘兩個抗生素來源（藥卡 363 KB）與處方集（314 KB）一個位元組都不抓：
     它們的頁內索引量過沒有鑑別力，見 deepLanding() 上面那段。
     鍵是**標的 key** 不是 grp：abx 這個 grp 底下三個標的共用，但只有「依部位」
     需要 regimens.js，用 grp 當鍵會把另外兩顆也拖下水。 */
  var SENT_AUTOLOAD_K = { 'abx-mode-empiric': 'abxsite' };
  function autoloadSubsFor(list, st) {
    if (!stNarrows(st)) return;
    var want = {};
    list.forEach(function (t) {
      var m = SUBTARGET_OF[t.k];
      if (m && SENT_AUTOLOAD[m.grp] && !subFileState[SENT_AUTOLOAD[m.grp]]) want[SENT_AUTOLOAD[m.grp]] = true;
      var kf = st.s ? SENT_AUTOLOAD_K[t.k] : '';
      if (kf && !subFileState[kf]) want[kf] = true;
    });
    var ids = Object.keys(want);
    if (!ids.length) return;
    ensureSubIndex(function () { if (isHome() && sentenceOn()) renderHome(); }, ids);
  }

  function subSearch(q) {
    var out = [];
    for (var i = 0; i < subIdx.length; i++) {
      var e = subIdx[i], r = -1;
      if (e.head.indexOf(q) === 0) r = R_PREFIX;
      else if ((' ' + e.head).indexOf(' ' + q) >= 0) r = R_WORD;
      else if (e.head.indexOf(q) >= 0) r = R_SUB;
      else if (e.hay.indexOf(q) >= 0) r = R_HAY;
      if (r >= 0) out.push({ r: r, kind: 'sub', d: e });
    }
    out.sort(function (x, y) {
      return x.r - y.r || x.d.w - y.d.w ||
        x.d.name.length - y.d.name.length ||
        (x.d.name < y.d.name ? -1 : x.d.name > y.d.name ? 1 : 0);
    });
    return out;
  }

  /* 四組的標頭與各自的上限。工具維持原本的 14；三個頁內組各 12——超過的用
     「還有 N 筆」誠實講出來，不靜悄悄截斷（截斷了卻不講，使用者會以為詞庫沒收）。
     組別＝**落在哪一頁**，所以一頁一組：抗生素指引底下的三種子目標
     （依部位／依病原菌／藥物查詢）不再各自分組，改由每一列自己的麵包屑
     （抗生素指引 › 依部位 › 腹腔內感染 IAI）標出層級——分成六組會讓
     只命中一兩筆的查詢變成一堆只有一列的標頭。 */
  var SAY_GROUP = {
    tool:    { zh: '工具與流程', en: 'Tools & Pathways', note: '', cap: 14 },
    abx:     { zh: '抗生素指引', en: 'Antibiotic Guide',
               /* 這三個數字是頁內子目標的實際筆數；改資料時要同步，
                  回歸測試 U 會比對（scripts/regress_ext_cards.py）。 */
               note: '頁內三層：依部位 11 · 依病原菌 54 · 藥物查詢 162', cap: 12 },
    db:      { zh: '藥物資料庫', en: 'Formulary',
               note: '台大處方集（一商品名一卡）＋非台大處方（一成分一卡）', cap: 12 },
    classif: { zh: '分類與分級系統', en: 'Grading & Classification',
               note: '頁內 33 套分級系統 ＋ AAST EGS 的 16 個疾病 · 直接落在該格', cap: 12 },
    /* 分頁這一組是唯一橫跨多頁的：13 個分頁式頁面共用一個標頭，每一列自己的
       麵包屑（肺栓塞 › 危險分層 Risk）標出它落在哪一頁——理由與抗生素那三層
       不再各自分組相同（分成 13 組會變成一堆只有一列的標頭）。 */
    tab:     { zh: '頁內分頁', en: 'Page Tabs',
               note: '13 個分頁式頁面 · 直接落在那一個分頁', cap: 12 },
    /* 覆蓋菌種這一組的 cap 是 30 而不是 12：它的存在理由就是「列出**所有**
       涵蓋這隻菌的藥」，截掉一半等於沒做。28 隻菌裡最長的一份是 HIV 26 種
       （實測，其次 Pseudomonas 19、HBV 16），30 剛好裝得下任何單一徽章的
       完整清單；查詢同時對到多隻菌而超過 30 時，既有那行「這一組還有 N 筆
       沒列出來」照樣會出現，不會靜悄悄截斷。 */
    cov:     { zh: '依覆蓋菌種', en: 'By Organism Coverage',
               note: '', cap: 30 }
  };
  /* 覆蓋菌種排在抗生素指引**前面**（同分時），這是量過才調的：打 `esbl` 兩組
     都是前綴命中（R_PREFIX），依病原菌那一筆的 head 也是 `esbl…` 開頭，
     排在後面的話使用者要的那 11 種藥會被兩列菌名壓在下面。使用者這一輪要的
     就是「打菌名 → 列出涵蓋牠的藥」，同分時讓它先講。
     排在**工具與流程之後**則不動：打 `candida` 時 Candida Score 是不折不扣的
     工具名前綴命中，把它壓到 13 種抗黴菌藥底下才是錯的。 */
  var SAY_GROUP_ORDER = ['tool', 'cov', 'abx', 'db', 'classif', 'tab'];

  /* 四組怎麼排？——**照各組最好的那一筆的比對等級排，同級才用固定順序
     （工具 → 抗生素 → 藥物資料庫 → 分類分級）**。這樣兩種需求同時成立：
       · 打 `NEWS2`：工具是前綴命中（R_PREFIX），排最前面。
       · 打 `vanco`：工具那邊頂多是 hay 命中（R_HAY），抗生素是前綴命中，
         抗生素就排到工具前面——不會為了「工具永遠優先」把使用者真正要的
         那一筆壓到清單底下。
     打 `tazocin` 則根本沒有工具命中，只會出現藥的組別；
     打 `Hinchey` 以前只到得了 tools/classifications.html 的頁首，
     現在分類分級那一組會直接給 `#sys=hinchey`。 */
  function saySearch(q) {
    q = String(q || '').trim().toLowerCase();
    var res = { groups: [], flat: [] };
    if (!q) return res;
    var hits = { tool: sayToolSearch(q), abx: [], cov: [], db: [], classif: [], tab: [] };
    if (subIdx.length) {
      subSearch(q).forEach(function (it) { hits[it.d.grp].push(it); });
    }
    /* 覆蓋菌種那一組不是從 subIdx 撈的（它索引的是「菌」不是「頁內項目」），
       所以另外查一次再併進來。covOrgs 是空的（regimens.js／drugs.js 還沒到齊）
       時回 0 筆，這一組整個不會出現，其餘四組行為不變。 */
    var cv = covSearch(q);
    hits.cov = cv.list;
    /* 子序列容錯（R_FUZZY）是**最後手段**：只要整份結果裡有任何一筆是字面命中，
       模糊命中就全部丟掉。原本這條規則只表現在文案上（fuzzyOnly 時改口說
       「你是不是要找…」），命中清單本身照列，所以會出現「第一筆是對的、
       後面跟著一串莫名其妙」的畫面。實測案例：打 `IAI` 命中
       「抗生素指引 › 依部位 › 腹腔內感染 IAI」（R_SUB，字面命中），
       底下卻跟著 24 筆工具——那 24 筆全是把 I·A·I 三個字母當子序列湊出來的
       （MPI、急性闌尾炎…）。加上這一條之後，那 24 筆整組消失；
       真的一筆字面命中都沒有時，模糊命中照樣會出現，文案也照樣改口。
       藥名／部位／菌名／分級系統本來就不做模糊比對，所以這條只影響工具那一組。 */
    var exact = false;
    SAY_GROUP_ORDER.forEach(function (id) {
      hits[id].forEach(function (it) { if (it.r < R_FUZZY) exact = true; });
    });
    if (exact) {
      SAY_GROUP_ORDER.forEach(function (id) {
        hits[id] = hits[id].filter(function (it) { return it.r < R_FUZZY; });
      });
    }
    var live = [];
    SAY_GROUP_ORDER.forEach(function (id, ord) {
      if (hits[id].length) live.push({ id: id, hits: hits[id], best: hits[id][0].r, ord: ord });
    });
    live.sort(function (x, y) { return x.best - y.best || x.ord - y.ord; });
    live.forEach(function (g) {
      g.n = g.hits.length;
      // 覆蓋菌種那一組的副標是**算出來的**（命中了哪幾顆徽章、各幾種藥），
      // 不是 SAY_GROUP 上那句固定的話——見 renderSay() 的 g.note || m.note。
      if (g.id === 'cov') g.note = cv.note;
      g.shown = g.hits.slice(0, SAY_GROUP[g.id].cap);
      g.shown.forEach(function (it) { res.flat.push(it); });
      res.groups.push(g);
    });
    return res;
  }

  // 一律接在 ROOT（本檔 <script src> 反推出來的站台根）之後——「說整句」在
  // 首頁與 107 個內頁共用同一支，內頁的相對路徑基準是 tools/ 或 pathways/，
  // 直接用 t.href（相對站台根）會指到不存在的 tools/tools/xxx.html。
  function sayItemHref(t) {
    return withSentQuery(ROOT + t.href, {
      g: t.sec, s: t.s[0] || '', c: t.c[0] || '', a: t.a[0] || '', t: t.k
    });
  }
  /* 頁內子目標的候選項落地在哪裡：**不帶 ?sent=**。句子是使用者一格一格造出來的
     東西，打藥名／部位／菌名命中的不是——硬塞一句由工具預設值拼出來的話進網址，
     目標頁的軌跡就會印出「這是你在造句列選的句子」，那是一句假話。不帶參數時
     目標頁走 currentPageTool() 的退路，印的是「本頁在詞表裡的預設歸類，不是你
     造的句子」，這才是實情。工具候選項維持原本帶 ?sent= 的行為不變。 */
  function sayHref(item) {
    return item.kind === 'sub' ? (ROOT + item.d.href) : sayItemHref(item.e.t);
  }

  function sayItemHTML(item, i, sel) {
    var cls = 'sent-ask-item' + (sel ? ' sel' : '');
    if (item.kind === 'sub') {
      var d = item.d;
      /* 路徑那一行是這一批東西存在的理由：候選項如果只印「腹腔內感染 IAI」，
         使用者不知道它會把自己帶到哪一頁的哪一格。印成
         「抗生素指引 › 依部位 › 腹腔內感染 IAI」才看得出層級。 */
      /* 覆蓋菌種那一組多兩件東西，其餘完全沿用藥名候選項的版型：
         · 分級徽章：class 直接用藥卡那一套 `.cov-tag.sy-hi/.yes/.partial`
           （css/ui-sentence.css §Q4 已經定義好燈號立柱與線型），所以清單上的
           徽章與藥卡上的徽章長得一模一樣，不是另外畫一顆。
         · 同一顆藥被查詢對到的第二隻以上的菌，併進 meta 那一行講明白。 */
      var meta = [d.meta].filter(Boolean).join(' · ');
      if (d.more && d.more.length) meta = [meta, '同時涵蓋：' + d.more.join('、')].filter(Boolean).join(' · ');
      var tier = d.tier
        ? '<span class="cov-tag ' + d.tier.c + ' sai-tier">' + esc(d.tier.zh) + '</span>' : '';
      return '<a class="' + cls + ' sai-drug' + (d.tier ? ' sai-covhit' : '') + '" data-i="' + i + '"' + tabHashAttr(d) +
        ' href="' + esc(sayHref(item)) + '">' +
        '<span class="sai-path">' + esc(d.path) + ' <span class="sai-sep">›</span> </span>' +
        '<span class="sai-dname">' + tier + '<em>' + esc(d.name) + '</em>' +
          (d.en ? '<span class="sai-dzh">' + esc(d.en) + '</span>' : '') + '</span>' +
        (meta ? '<span class="sai-meta">' + esc(meta) + '</span>' : '') + '</a>';
    }
    var t = item.e.t;
    return '<a class="' + cls + '" data-i="' + i + '" href="' + esc(sayHref(item)) + '">' +
      '<span class="sai-say">' + esc(F.lex.p0) + ' <em>' + esc(t.s[0] || '') + '</em> ' + esc(F.lex.p1) +
      ' <em>' + esc(t.c[0] || '') + '</em>' + esc(F.lex.p2) + ' <em>' + esc(t.a[0] || '') + '</em> ' +
      '<span class="sai-arw">→</span> ' + esc(t.name) + '</span>' +
      '<span class="sai-meta">' + esc(t.en) + ' · ' + esc(t.secTitle + ' · ' + t.grp) + '</span></a>';
  }

  /* 清單最後一行固定講一句「頁內索引現在是什麼狀態」——四種狀態各有各的說法。
     沒有這一行的話，打了藥名／部位卻沒東西時，使用者分不出是「索引還沒載」
     還是「真的沒有這個東西」。載完之後那行也留著，順便把筆數講清楚。
     載入中還會把**已經到齊的那幾筆**算出來（四個來源各自生效），
     不會在還有東西可用的時候只說「載入中」。 */
  function subNoteHTML() {
    if (subState === 0) {
      return '<div class="sent-ask-note">藥名、感染部位、病原菌、分級系統打滿 ' + DRUG_MIN_Q +
        ' 個字才開始查——頁內索引第一次用到才抓，不拖慢開頁。</div>';
    }
    var got = subStat.abx + subStat.db + subStat.classif + subStat.tab;
    /* 第二波那 13 個檔如果逐一列進 missing／notAsked，這一行會變成一整片檔名牆，
       所以它們只用「已抓 N / 13」這個數字交代，取不到的另外用一句話帶過。 */
    var w2n = 0, w2got = 0, w2bad = 0;
    SUB_FILES.forEach(function (f) {
      if (f.wave !== 2) return;
      w2n++;
      if (subFileState[f.id] === 2) { w2got++; if (subDone[f.id] === false) w2bad++; }
    });
    var w2txt = '；13 個分頁式頁面 ' + w2got + ' / ' + w2n;
    if (subState === 1) {
      return '<div class="sent-ask-note is-loading">頁內索引載入中…' +
        (got ? '（已可查 ' + got + ' 筆' + (wave2Busy ? w2txt + ' 背景載入中' : '') + '）' : '') + '</div>';
    }
    if (!got) {
      return '<div class="sent-ask-note is-fail">頁內索引取不到（離線且未快取）——工具與流程仍然查得到。</div>';
    }
    var missing = [], notAsked = [];
    SUB_FILES.forEach(function (f) {
      if (f.wave === 2) return;
      if (subDone[f.id] === false) missing.push(f.url);
      else if (!subFileState[f.id]) notAsked.push(f.url);
    });
    /* 覆蓋菌種不是第五種「頁內項目」——它索引的是同一批 155 張藥卡上的**燈號**，
       所以不加進上面那個總和，另外用一句話交代（幾隻菌、幾條藥菌對應）。
       標籤表沒到齊時（regimens.js 取不到）也講明白：查得到，但徽章上印的是
       cov 的英數鍵而不是中文菌名。 */
    var covTxt = covOrgs.length
      ? '；覆蓋菌種 ' + covStat.orgs + ' 隻／' + covStat.pairs + ' 條藥菌對應' +
        (covStat.nolabel ? '（其中 ' + covStat.nolabel + ' 隻沒有標籤表，以英數鍵顯示）' : '')
      : '';
    return '<div class="sent-ask-note" title="建索引 ' + subStat.ms.toFixed(1) + ' ms">' +
      '頁內索引：抗生素指引 ' + subStat.abx + ' ＋ 處方集 ' + subStat.db +
      ' ＋ 分級系統 ' + subStat.classif + ' ＋ 頁內分頁 ' + subStat.tab +
      '（' + w2got + ' / ' + w2n + ' 頁' + (w2bad ? '，' + w2bad + ' 頁取不到' : '') + '）' +
      ' ＝ ' + got + ' 筆' + covTxt +
      (missing.length ? '（' + missing.join('、') + ' 取不到，這次只建了拿得到的那些）' : '') +
      // 造句那條路只會抓 classifications.html 一個來源（見 autoloadSubsFor()），
      // 這時另外三份還沒抓；不講的話畫面會顯得像「抗生素那 209 筆消失了」。
      (notAsked.length ? '（' + notAsked.join('、') + ' 這次還沒用到，打字查詢時才抓）' : '') +
      '</div>';
  }

  function renderSay(q) {
    var box = document.getElementById('sentAskList');
    if (!box) return;
    sayQ = q;
    var res = saySearch(q);
    sayCur = res.flat;
    if (!String(q || '').trim()) {
      box.innerHTML = '<div class="sent-ask-hint">打幾個字：工具名（NEWS2、闌尾）、狀況（敗血症、腸阻塞）、' +
        '動作（開刀、劑量）、癌別（胃癌）、藥名（tazocin、萬古黴素）、' +
        '感染部位（腹腔內感染）、病原菌（E. coli）、分級系統（Hinchey、Forrest）都行。' +
        '打菌種／菌類（ESBL、MRSA、原蟲、Candida）會另外列出所有涵蓋牠的抗生素，' +
        '每一筆掛著與藥卡上同一顆的分級徽章。' +
        '候選項是一整句話，或是某一頁「裡面」的那一格，Enter 直接抵達。</div>' +
        subNoteHTML();
      saySel = 0; sayLastQ = q; return;
    }
    if (!sayCur.length) {
      box.innerHTML = '<div class="sent-ask-hint">找不到符合的句子或藥名。</div>' + subNoteHTML();
      saySel = -1; sayLastQ = q; return;
    }
    // 最高分只有子序列容錯：沒有一項是精確命中，換成「你是不是要找」的口吻，
    // 並取消首項預選，避免 Enter 直接落到猜錯的工具（原型 say.js 同一條規則）。
    var fuzzyOnly = sayCur[0].r >= R_FUZZY;
    if (q !== sayLastQ) { saySel = fuzzyOnly ? -1 : 0; sayLastQ = q; }
    else if (saySel >= sayCur.length) saySel = sayCur.length - 1;
    var h = fuzzyOnly
      ? '<div class="sent-ask-hint sent-ask-fuzzy">沒有精確命中「' + esc(String(q).trim()) + '」，你是不是要找…（↑ ↓ 選一項才能 Enter 直達）</div>'
      : '';
    var i = 0;
    res.groups.forEach(function (g) {
      var m = SAY_GROUP[g.id];
      h += '<div class="sent-ask-gh">' +
             '<span class="sag-zh">' + esc(m.zh) + '</span>' +
             '<span class="sag-en">' + esc(m.en) + '</span>' +
             '<span class="sag-n">' + g.n + ' 筆</span>' +
           '</div>' +
           ((g.note || m.note) ? '<div class="sent-ask-gnote">' + esc(g.note || m.note) + '</div>' : '');
      g.shown.forEach(function (item) { h += sayItemHTML(item, i, i === saySel); i++; });
      if (g.n > g.shown.length) {
        h += '<div class="sent-ask-more">這一組還有 ' + (g.n - g.shown.length) +
          ' 筆沒列出來——多打幾個字會更準。</div>';
      }
    });
    box.innerHTML = h + subNoteHTML();
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
    // 六大分類攤開時也算「有東西可退」——這時「← 退一個詞」退的是這一步瀏覽，
    // 「清空句子」則連瀏覽帶句子一起回到最初的畫面（見 click 的兩個分支）。
    var has = isHome()
      ? !!(homeSt.g || homeSt.s || homeSt.c || homeSt.a || openTile)
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
    // 攤開某一格時，六格整個收起來（正式版 showSection() 也是把 #hub 收掉，
    // 不是把清單接在方磚底下——59 件的計分工具接在方磚後面會捲不完）。
    var hubs = document.getElementById('sentHubs');
    if (hubs) hubs.innerHTML = openTile ? '' : hubsHTML();
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
        'placeholder="查詢工具、癌別、狀況、動作、藥名、菌種…（例：NEWS2、闌尾、胃癌、tazocin、ESBL）">' +
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
    unbindVV();
    box.remove();
    var bar = document.getElementById('sentBar');
    if (bar) bar.remove();
    sayOpen = false;
    openTile = null;     // 攤開的分類是畫面狀態，不是句子；整塊拆掉時一起歸零
    openSubs = {};       // 頁內子目標的展開狀態同理
    // 面板的捲動還原狀態也歸零——整塊 DOM 都拆了，再去還原一個不存在的句子列
    // 只會在關掉造句設計的那一刻無端捲一次頁面。
    panelLastFacet = null; panelAnchorTop = null; panelScrolled = false;
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
        trailOpen = !!full.hidden;
        full.hidden = !trailOpen;
        btn.setAttribute('aria-expanded', trailOpen ? 'true' : 'false');
        var chev = btn.querySelector('.sf-chev');
        if (chev) chev.textContent = trailOpen ? '收合 ⌃' : '改句子 ⌄';
        if (!trailOpen && openFacet) { openFacet = null; panelFilter = ''; renderPanel(); }
        return;
      }
      if (act === 'tclear' || act === 'clear') { e.preventDefault(); location.href = ROOT + 'index.html'; return; }
      if (act === 'droptail') {
        e.preventDefault();
        var href = targetDropTailHref();
        if (href) location.href = href;
        return;
      }
      /* open／pick／drop／closepanel **故意不在這裡處理**：內頁的詞塊列與候選詞
         面板跟首頁是同一套 DOM、同一批函式，直接讓事件落到下面共用的分支去，
         不複製第二份。內頁與首頁行為不同的那兩處寫在那些分支自己裡面。 */
      if (act !== 'open' && act !== 'pick' && act !== 'drop' && act !== 'closepanel') return;
    }

    /* ---- 首頁與內頁共用 ---- */
    if (act === 'open') {
      // 剛剛才用字輪換完詞的那一下放手，不可以順便把清單也展開（原型的 _wheeled 旗標）
      if (el._wheeled) { el._wheeled = false; return; }
      var wasOpen = (openFacet === f);
      openFacet = wasOpen ? null : f;
      panelFilter = ''; panelSel = 0;
      openTile = null;   // 開始挑詞＝離開「瀏覽某一類」那個模式，清單換回句子的結果
      panelWantsFocus = !wasOpen;   // 這一下是「打開」→ 焦點直接送進過濾框
      if (sayOpen) showSay(false);
      repaint();
      if (wasOpen) focusFacetControl(f);
      return;
    }
    if (act === 'closepanel') {
      var cf = openFacet;
      openFacet = null; panelFilter = ''; panelSel = 0;
      renderPanel();
      if (cf) focusFacetControl(cf);
      return;
    }
    if (act === 'subs') {
      /* 頁內子目標的展開／收合。索引要用到才載——首頁「打字前不多抓一個位元組」
         那條線在這裡一樣成立：這一下點擊就是使用者主動要求的那一下。 */
      e.preventDefault();
      var sk = el.getAttribute('data-k');
      if (!sk) return;
      // 目前是開是關要看**有效狀態**（可能是句子自動攤開的），不是只看 openSubs：
      // 直接用 !openSubs[sk] 會讓「自動攤開後按一下」變成再攤開一次（按了沒反應）。
      openSubs[sk] = !subsOpen(sk, curSt());
      if (openSubs[sk]) {
        /* 分頁那 13 頁各自是一個獨立來源，所以點名只抓**那一頁**（22–169 KB）。
           不點名（抗生素／分級系統那三顆）維持原本抓第一波四個來源的行為。 */
        var sm = SUBTARGET_OF[sk];
        ensureSubIndex(function () { renderHome(); }, (sm && sm.file) ? [sm.file] : null);
      }
      renderHome();
      return;
    }
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
    if (act === 'drop') {
      homeSt[f] = '';
      // 內頁退一格＝句子變寬，落點通常不只一件，交給同一條規則決定去哪裡
      if (!isHome()) { trailGo(); return; }
      openTile = null; renderHome(); return;
    }
    if (act === 'droptail') {
      // 句子還有詞就先退詞；一個詞都沒有、卻正攤著某一格分類時，退的就是那一步瀏覽。
      if (dropTail()) { renderHome(); return; }
      if (openTile) { openTile = null; renderHome(); }
      return;
    }
    /* ---- 六大分類的三顆 ---- */
    if (act === 'tile') {
      e.preventDefault();
      var tid = el.getAttribute('data-tile');
      openTile = (openTile === tid) ? null : tid;   // 再點同一格＝收起來
      openFacet = null; panelFilter = '';
      if (sayOpen) showSay(false);
      renderHome();
      try { window.scrollTo(0, 0); } catch (err) {}
      return;
    }
    if (act === 'tileback') {
      e.preventDefault();
      var backTo = openTile;
      openTile = null;
      renderHome();
      // 焦點還給剛才那一格，鍵盤使用者不必重新 Tab 一輪
      var again = backTo && document.querySelector('#sentHubs [data-tile="' + backTo + '"]');
      if (again) { try { again.focus(); } catch (err) {} }
      return;
    }
    if (act === 'tilescope') {
      /* 「以『腹部急症』為範圍開始造句」——這是舊版點方磚時偷偷做的那件事，
         現在變成一顆寫明用途的按鈕。做完就收起分類清單、回到造句畫面，
         否則使用者會看不出剛才那一下到底改了什麼。 */
      e.preventDefault();
      var gid2 = el.getAttribute('data-g');
      if (!gid2) return;
      homeSt = { g: gid2, s: '', c: '', a: '' };
      openTile = null; openFacet = null; panelFilter = '';
      if (sayOpen) showSay(false);
      renderHome();
      try { window.scrollTo(0, 0); } catch (err) {}
      return;
    }
    if (act === 'pick') {
      var w = el.getAttribute('data-w');
      /* ---- 內頁：「只改一格」就是**真的只改那一格** ----
       * 首頁的 applyWord() 會在句子指不到東西時，由句尾往前把別格清掉。那條規則
       * 在首頁成本是看得見的（整條句子列與件數就在眼前，而且清掉是為了讓候選
       * 清單不變成空的）；搬到內頁就不一樣了——使用者原話是「可以只改一個輸入
       * 匡」，他改主體卻發現動作被順手清掉，是最意外的一種結果。
       * 所以內頁**不套用清除**：指不到東西時一格都不動，整句原樣帶回首頁，由
       * 首頁既有的 relax() 自動放寬並把放寬了哪一格印成黃字（見 trailGo()）。
       * 淨結果是「沒有任何一個詞被靜悄悄地丟掉」，而不是「改一格連帶少一格」。 */
      if (!isHome()) {
        homeSt[f] = (homeSt[f] === w) ? '' : w;
        openFacet = null; panelFilter = ''; panelSel = 0;
        trailGo();
        return;
      }
      if (homeSt[f] === w) homeSt[f] = ''; else applyWord(f, w);
      openFacet = null; panelFilter = ''; openTile = null;
      renderHome();
      return;
    }
    if (act === 'clear') { homeSt = { g: '', s: '', c: '', a: '' }; openFacet = null; panelFilter = ''; openTile = null; openSubs = {}; if (sayOpen) showSay(false); renderHome(); return; }
  });

  document.addEventListener('input', function (e) {
    if (!e.target) return;
    if (e.target.id === 'sentAskIn') {
      var v = e.target.value;
      renderSay(v);
      /* 藥名索引就是在這一行被叫醒的——**打字之前一個位元組都不抓**。
         門檻 DRUG_MIN_Q 個字：一個字（尤其中文單字）命中面太寬，為它抓 677 KB
         不划算；兩個字起才有意義。ensureSubIndex() 本身是冪等的，
         之後每一次打字都會呼叫，但只有第一次真的做事。 */
      if (String(v).trim().length >= DRUG_MIN_Q) {
        ensureSubIndex(function () { if (sayOpen) renderSay(sayQ); });
      }
      return;
    }
    /* 候選詞面板的過濾框：只重畫詞的部分，不重畫整個面板——重畫整個面板會把
       <input> 換成新節點，使用者打到一半的焦點與游標位置就沒了。 */
    if (e.target.id === 'sentPanelFilter' && openFacet) {
      panelFilter = e.target.value;
      panelSel = 0;              // 每打一個字，鍵盤游標回到第一個命中（Enter 就是選它）
      var body = document.getElementById('sentPanelBody');
      if (body) body.innerHTML = panelTokensHTML(openFacet);
      clampPanelBody(false);  // 打字中不搶捲動位置
      return;
    }
  });
  document.addEventListener('keydown', function (e) {
    var onHome = !!document.getElementById('sentHome'), onTrail = !!document.getElementById('sentTrail');
    if (!onHome && !onTrail) return;
    var typing = /^(input|textarea|select)$/i.test(e.target.tagName || '') || e.target.isContentEditable;

    /* 候選詞面板的過濾框拿著焦點時：↑ ↓ 在命中的詞之間走、Enter 選定、
       Esc 收面板並把焦點還給原來那一格。這一段要放在所有 typing 判斷之前，
       否則下面的 Backspace／「/」／字輪那幾條會先把按鍵吃掉。 */
    if (e.target && e.target.id === 'sentPanelFilter' && openFacet) {
      var pf = openFacet;
      if (e.key === 'Escape') {
        e.preventDefault();
        openFacet = null; panelFilter = ''; panelSel = 0;
        renderPanel(); focusFacetControl(pf);   // 首頁／內頁同一支面板，這一段不必分岔
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!panelList.length) return;
        e.preventDefault();
        panelSel = e.key === 'ArrowDown'
          ? Math.min(panelList.length - 1, panelSel + 1)
          : Math.max(0, panelSel - 1);
        var pb = document.getElementById('sentPanelBody');
        if (pb) pb.innerHTML = panelTokensHTML(pf);
        var selEl = document.querySelector('#sentPanelBody .sent-tok.sel');
        if (selEl && selEl.scrollIntoView) {
          try { selEl.scrollIntoView({ block: 'nearest' }); } catch (err) { selEl.scrollIntoView(false); }
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        var chosen = panelList[panelSel] || panelList[0];
        if (!chosen) return;   // 一個都沒命中：Enter 不動作，畫面上那句「找不到…」就是回饋
        // 內頁：與滑鼠那條路同一套語意（只改這一格、不清別格，改完由 trailGo() 決定去哪）
        if (!isHome()) {
          homeSt[pf] = (homeSt[pf] === chosen.w) ? '' : chosen.w;
          openFacet = null; panelFilter = ''; panelSel = 0;
          trailGo();
          return;
        }
        if (homeSt[pf] === chosen.w) homeSt[pf] = ''; else applyWord(pf, chosen.w);
        openFacet = null; panelFilter = ''; panelSel = 0;
        renderHome();
        focusFacetControl(pf);   // 選完焦點回到那一格，可以接著按 ↑ ↓ 微調
        return;
      }
      return;   // 其餘按鍵（含 Backspace）留給輸入框自己處理
    }

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
      // Esc 收起攤開的那一類分類（＝「← 回六大分類」的鍵盤路徑）。
      // 面板開著的時候 Esc 屬於面板，那一段在上面就已經 return 了，不會走到這裡。
      if (e.key === 'Escape' && !typing && onHome && openTile && !openFacet) {
        e.preventDefault();
        var was = openTile;
        openTile = null;
        renderHome();
        var back = document.querySelector('#sentHubs [data-tile="' + was + '"]');
        if (back) { try { back.focus(); } catch (err) {} }
        return;
      }
      // 「/」直接叫出說整句的輸入框（原型 js/say.js 同一條，同樣的打字防護）
      if (e.key === '/' && !typing) { e.preventDefault(); showSay(true); return; }
      // Backspace 退掉句尾一個詞（不在輸入框裡打字時才算）
      if (e.key === 'Backspace' && !typing) {
        if (onHome) {
          if (dropTail()) { e.preventDefault(); renderHome(); }
          else if (openTile) { e.preventDefault(); openTile = null; renderHome(); }
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
      if (item) location.href = sayHref(item);
      return;
    }
  });

  /* ================================================================
   * 目標頁：可編輯的句子軌跡（107 個工具／流程頁）
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
   * 該講的內容沒有變少，只是不再佔掉一屏的份量。
   *
   * ---------------------------------------------------------------
   * 展開之後那一列是**可編輯的**（第 10 輪；先前是唯讀）
   * ---------------------------------------------------------------
   * 使用者原話：「改成點選這邊則可以編輯句子（可以只改一個輸入匡）」。
   * 先前展開只是把完成式句子的詞塊攤出來看，底下還寫著「句子在這一頁不會再
   * 變長」——那句話現在不成立了，一起改掉（見下面的 srcNote）。
   *
   * 實作上**一行都沒有複製首頁那一套**：展開區裡放的就是首頁同名的
   * `#sentRow` 與 `#sentPanel` 兩個容器，畫它們的是同一支 renderRow()／
   * renderPanel()／panelTokensHTML()，狀態是同一個 homeSt，點擊與鍵盤走的
   * 是同一批 data-act 分支（open／pick／drop／closepanel）。內頁與首頁的差別
   * 只有兩處，各自寫在它自己的函式上：改完往哪裡走（trailGo()）、
   * 以及「只改一格就真的只改一格」（見 act==='pick' 的內頁分支）。 */
  function trailHTML(st, exact) {
    var t = st.t && byKey[st.t];
    var summary = [st.s, st.c, st.a].filter(Boolean).join(' · ');
    // 落點升級到 #site=N 之後這一行不能還只寫「依部位」——寫到那一格為止
    var toolName = landedSitePath() || (t ? t.name : (st.a || st.c || st.s || ''));
    var list = matches({ g: st.g, s: st.s, c: st.c, a: st.a });
    var hint = trailHint(list.length);
    /* 誠實標示壓成一行極小字：兩種來源仍然分得出來，只是不再各佔三行。
       後半句原本是「句子在這一頁不會再變長」——句子在這一頁變成可編輯之後
       那句話就是假的了，換成現在真正成立的說法。 */
    var srcNote = exact ? '這是你在造句列選的句子' : '本頁在詞表裡的預設歸類，不是你造的句子';

    return '<div class="st-rail">' +
        '<button type="button" class="sent-say-btn" data-act="say" aria-expanded="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達">' +
        '<span class="mag" aria-hidden="true">⌕</span><span class="lbl">說整句</span></button>' +
        '<button type="button" class="sent-fold" data-act="tfold" aria-expanded="false" ' +
        // 看得見的那一行被寬度砍成兩層，可讀的名字（aria-label）給完整三層
        'aria-controls="sentTrailFull" aria-label="句子摘要：' +
        esc(summary + (summary ? ' → ' : '') + (landedSiteFullPath() || toolName)) +
        '。點一下展開，展開後可以逐格改詞">' +
          '<span class="sf-line1">' + esc(summary) + '</span>' +
          '<span class="sf-line2">' +
            '<span class="sf-arrow" aria-hidden="true">→</span>' +
            '<span class="sf-tool">' + esc(toolName) + '</span>' +
            '<span class="sf-chev" aria-hidden="true">' + (trailOpen ? '收合 ⌃' : '改句子 ⌄') + '</span>' +
          '</span>' +
        '</button>' +
      '</div>' +
      '<div class="st-full" id="sentTrailFull"' + (trailOpen ? '' : ' hidden') + '>' +
        '<div class="sent-row" id="sentRow"></div>' +
        '<div class="sent-panel" id="sentPanel" hidden></div>' +
        '<div class="st-edit-note">點任何一格只改那一格，其餘幾格一個字都不動。</div>' +
      '</div>' +
      '<div class="sent-point">' +
        '<span class="sent-point-n">這句話目前指向 <b>' + list.length + '</b> 件事</span>' +
        '<span class="sent-point-hint">' + esc(hint) + '</span>' +
        '<button type="button" class="sent-clear" data-act="tclear">清空句子</button>' +
      '</div>' +
      '<div class="st-honest">' + esc(srcNote) + ' · 展開後可以改任何一格，改完就帶你到新的落點</div>' +
      '<div class="sent-ask" id="sentAsk" hidden>' +
        '<input class="sent-ask-in" id="sentAskIn" type="text" autocomplete="off" spellcheck="false" ' +
        'aria-label="直接說整句：打字找一整句話，Enter 直達" ' +
        'placeholder="查詢工具、癌別、狀況、動作、藥名、菌種…（例：NEWS2、闌尾、胃癌、tazocin、ESBL）">' +
        '<div class="sent-ask-list" id="sentAskList"></div>' +
      '</div>';
  }

  var targetSt = null;
  var trailOpen = false;      // 展開／收合狀態（重畫時要留住，否則改一格就自己收起來）
  var trailExact = false;     // 這句話是 ?sent= 帶進來的，還是本頁的預設歸類
  var trailSeeded = false;

  /* 指向行後半那句話。內頁改詞是**會換頁**的動作，所以在按下去之前就要講清楚
     會被帶到哪裡——四種情況各有各的說法，與 trailGo() 的四個分支一一對應。 */
  function trailHint(n) {
    if (n === 1) {
      var only = matches({ g: homeSt.g, s: homeSt.s, c: homeSt.c, a: homeSt.a })[0];
      var cur = currentPageTool();
      if (only && cur && cur.k === only.k) return '這句話只指向本頁 · 改一格就換一個落點';
      return '這句話指向「' + (only ? only.name : '') + '」· 改完會直接過去';
    }
    if (!n) return '這句話目前指不到東西 · 改完會回首頁，由首頁自動放寬並說明放寬了哪一格';
    return '指向 ' + n + ' 件事 · 改完會回首頁，在候選清單裡繼續收斂';
  }

  /* 內頁的軌跡重畫。刻意**不整段換 innerHTML**：那會把「說整句」面板連同使用者
     打到一半的字一起換掉。只改真的會變的四處（摘要兩行、詞塊列、候選詞面板、
     指向行），其餘節點原地不動。 */
  function renderTrail() {
    var bar = document.getElementById('sentTrail');
    if (!bar) return;
    var st = { g: homeSt.g, s: homeSt.s, c: homeSt.c, a: homeSt.a, t: targetSt ? targetSt.t : '' };
    var t = st.t && byKey[st.t];
    var l1 = bar.querySelector('.sf-line1');
    if (l1) l1.textContent = [st.s, st.c, st.a].filter(Boolean).join(' · ');
    var tn = bar.querySelector('.sf-tool');
    if (tn) tn.textContent = landedSitePath() || (t ? t.name : (st.a || st.c || st.s || ''));
    renderRow();
    renderPanel();
    var n = matches({ g: st.g, s: st.s, c: st.c, a: st.a }).length;
    var nb = bar.querySelector('.sent-point-n b');
    if (nb) nb.textContent = n;
    var hi = bar.querySelector('.sent-point-hint');
    if (hi) hi.textContent = trailHint(n);
    renderBar();
  }

  /* 首頁與內頁共用同一批 data-act 分支，重畫的入口因此也要共用一個。 */
  function repaint() { if (isHome()) renderHome(); else renderTrail(); }

  /* ---------------- 改完一格之後去哪裡 ----------------
   * 規則只有一條：**句子指到哪裡，就把人帶到哪裡**。四種情況都由它決定，
   * 所以不會出現「有時候跳、有時候不跳」：
   *   · 剛好 1 件、而且就是現在這一頁 → 原地更新，不重載。這不是例外，
   *     是同一條規則的結果（目的地就是本頁），重載只會白閃一下並且把使用者
   *     捲回頁首；網址的 ?sent= 照樣跟著改，分享網址仍然等於分享這句話。
   *   · 剛好 1 件、是別的頁 → 直接過去，句子用 ?sent= 帶著走。
   *   · 0 件或 2 件以上   → 回首頁帶著這句話。理由是**候選清單只長在首頁**：
   *     指向 6 件事的時候該給的是那 6 件的清單，內頁沒有那塊版面，硬在軌跡裡
   *     塞一份就是把首頁複製第二份。0 件那條同時解決了「只改一格」的副作用
   *     （見下面 act==='pick' 的內頁分支）——首頁既有的 relax() 會自動放寬，
   *     而且 renderPointer() 會把「放寬了哪一格」印成黃字，不是靜悄悄地丟。 */
  function trailGo() {
    var st = { g: homeSt.g, s: homeSt.s, c: homeSt.c, a: homeSt.a };
    var list = matches(st);
    if (list.length === 1) {
      /* 這裡刻意**不呼叫 completeSentenceFor()**（首頁點候選項時會呼叫它，把使用者
         沒填的格子用該工具的第一個標註補滿）。內頁不能補：使用者剛按掉主體那顆 ×、
         句子仍然只指向本頁，補格會讓那個詞當場長回來——按了 × 東西還在，是最糟的
         一種回饋。內頁的規矩是「你的句子就是你留下的那幾個字」，空格就讓它空著，
         而且空格本身仍然是一顆可以點的 ▢，要補是使用者自己補。 */
      var only = list[0], cur = currentPageTool();
      var next = { g: st.g, s: st.s, c: st.c, a: st.a, t: only.k };
      /* 這裡**沒有**為落點升級補「改一格就換頁內那一格」的分支，理由是先量再決定：
         人要走到這一條（留在本頁）必須句子恰好只指向本頁那一個標的。實測 2 744 280
         個「範圍×主體×狀況×動作」組合裡，只指向 abx-mode-empiric 的有 16 個，
         而那 16 個的主體**全部**是「腎臟」——它對不到任何一個 SITES（見
         deepLanding() 上面那張表），永遠不會升級。也就是說補了也永遠跑不到，
         那就是死程式碼。實際會發生的是另一條：改一格之後句子指向 2 件事
         （「依部位」與「藥物查詢」都收同一批部位詞），照原規則帶著句子回首頁。 */
      if (cur && cur.k === only.k) { targetSt = next; syncTrailUrl(); renderTrail(); return; }
      location.href = withSentQuery(ROOT + only.href, next);
      return;
    }
    location.href = withSentQuery(ROOT + 'index.html', { g: st.g, s: st.s, c: st.c, a: st.a, t: '' });
  }

  /* 留在本頁時網址也要跟上（replaceState，不塞歷史紀錄）——首頁的
     syncHomeUrl() 是同一件事，這裡是內頁版。 */
  function syncTrailUrl() {
    if (!history || !history.replaceState || !targetSt) return;
    var q = location.search.replace(/[?&]sent=[^&]*/, '').replace(/^&/, '?');
    if (q === '?') q = '';
    q += (q ? '&' : '?') + QKEY + '=' + encodeSt(targetSt);
    try { history.replaceState(null, '', location.pathname + q + location.hash); } catch (e) { /* file:// 等情境不支援 */ }
  }

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
    trailExact = !!incoming;
    /* 內頁的句子也放在 homeSt——不是圖方便，是為了讓 renderRow()／renderPanel()／
       candidates()／panelTokensHTML() 這一整批**原封不動**地共用。只在第一次
       畫的時候灌進去；之後使用者改的就是它本身。 */
    if (!trailSeeded) {
      trailSeeded = true;
      homeSt = { g: st.g || '', s: st.s || '', c: st.c || '', a: st.a || '' };
    }
    var bar = document.getElementById('sentTrail');
    var fresh = !bar;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sentTrail';
      bar.className = 'sent-trail';
      bar.setAttribute('data-ui-chrome', 'sentence-trail');
      anchor.insertAdjacentElement('afterend', bar);
    }
    bar.innerHTML = trailHTML(st, trailExact);
    renderRow();
    renderPanel();
    buildBar();
    renderBar();
    if (fresh) { applyAastParam(); reapplyDeepLink(); }
  }

  /* ---------------- ?aast=<k>：落在 AAST EGS 的那一張表 ----------------
   * tools/classifications.html 的 33 套分級系統都有 `#sys=<id>` 可以直接連過去，
   * **AAST EGS 是唯一的例外**：它一顆 sys-head 底下是一個含 16 個疾病的下拉選單
   * （`<select id="ae_dz">`，由該頁自己的 aeFill() 填），那 16 張表沒有任何
   * 深層連結語法——clApplyHash() 只認 `#sys=` 與 `#tab=`。
   *
   * 所以這裡補的是**那一頁沒有、而使用者指名要**的那一段：用查詢字串
   * `?aast=A`（A–P 就是該頁 AAST 陣列自己的 k 欄位），hash 維持 `#sys=aast`
   * 讓那一頁自己的 clGoto() 照常切分頁＋捲動。兩者不互相干擾——查詢字串不進
   * location.hash，clApplyHash() 的正規式看不到它。
   *
   * 做法上刻意只碰 `<select>` 的 selectedIndex 再補送一次 change：
   *   · 不改 tools/classifications.html 一個字（該頁的 aeRender() 本來就掛在
   *     change 上，切完值它自己會把四欄準則與驗證狀態重畫）；
   *   · 只在造句設計開著時才動作（sentenceOn()），而且要網址真的帶了參數——
   *     正式版永遠不會產生這個參數，所以正式版的行為零變動。
   * 本檔是 defer，該頁的 aeFill()／aeRender() 是 body 內的同步 <script>，
   * 解析期就跑完了，所以這裡讀得到已經填好的 16 個 option。 */
  function applyAastParam() {
    if (!sentenceOn()) return;
    var m = /[?&]aast=([A-Za-z])(?:[&#]|$)/.exec(location.search);
    if (!m) return;
    var sel = document.getElementById('ae_dz');
    if (!sel || !sel.options || !sel.options.length) return;
    var pre = m[1].toUpperCase() + '.';
    for (var i = 0; i < sel.options.length; i++) {
      if ((sel.options[i].textContent || '').indexOf(pre) !== 0) continue;
      if (sel.selectedIndex === i) return;
      sel.selectedIndex = i;
      var ev;
      try { ev = new Event('change', { bubbles: true }); }
      catch (e) {
        try { ev = document.createEvent('Event'); ev.initEvent('change', true, false); }
        catch (e2) { return; }
      }
      try { sel.dispatchEvent(ev); } catch (e3) { /* 送不出去就維持預設那一張表，不拋錯 */ }
      return;
    }
  }

  /* 造句設計把一整塊軌跡插在 .app-header 之後（文件流，不是疊層），內容因此被
     往下推。問題出在**時序**：藥物資料庫頁的 js/drug-database.js 是在解析期
     就跑 `renderList(); applyHash();`，applyHash() 當場 scrollIntoView 捲到那張
     藥卡；本檔的軌跡是 DOMContentLoaded 之後才插進去的，於是捲好的位置整個
     往下位移了一段（實測 430×932 開 tools/drug-database.html#code=NOR4DE18：
     正式版藥卡 top=442、畫面正中央在卡內；造句設計 top=627、正中央掉到下一張
     卡上）。這是**我們造成的位移，就由我們還原**——插完軌跡之後補送一次
     hashchange，讓那一頁用它自己的 applyHash() 依新版面重捲一次。

     刻意只認 `#drug=`、`#code=`、`#sys=` 這三種 hash：它們正是本檔的頁內索引
     會產生、而且**目標頁會 scrollIntoView** 的三種深層連結，分別對應
     js/antibiotics.js、js/drug-database.js、tools/classifications.html 內嵌的
     三支 applyHash()／clApplyHash()，三支都是冪等的（切模式＋展開藥卡再捲／
     切分頁再捲）而且三支都掛了 hashchange 監聽器。實測 430×932：
       · #code=NOR4DE18 補送前藥卡 top=627（畫面正中央掉到下一張卡），補送後 -346；
       · #sys=hinchey   補送前 top=221（block:'start' 卻不在頂端），補送後 3。
     `#site=`／`#bac=` **不在名單內**：那兩支 applyHash 走的是
     `window.scrollTo({top:0})` 而不是 scrollIntoView，本檔插入軌跡造成的位移
     對它們沒有影響（實測兩者 scrollY 都是 0、目標內容都在第一屏），
     補送只是白做一次。其餘既有的 hash（#mode=、#cancer=…）同樣不碰——
     那些頁面的 hashchange 監聽器本檔沒有逐一驗過，不該順手替它們決定要不要重跑。
     延後 260ms 是為了讓頁面自己那一次 smooth 捲動先跑完，兩次捲動不打架。 */
  function reapplyDeepLink() {
    if (!/^#(drug|code|sys)=/.test(location.hash || '')) return;
    setTimeout(function () {
      var ev;
      try {
        ev = new HashChangeEvent('hashchange', { oldURL: location.href, newURL: location.href });
      } catch (e) {
        try {
          ev = document.createEvent('Event');
          ev.initEvent('hashchange', false, false);
        } catch (e2) { return; }
      }
      try { window.dispatchEvent(ev); } catch (e3) { /* 舊瀏覽器不支援：維持原本的位移，不拋錯 */ }
    }, 260);
  }

  function teardownTarget() {
    var trail = document.getElementById('sentTrail');
    if (trail) trail.remove();
    var bar = document.getElementById('sentBar');
    if (bar) bar.remove();     // 下緣固定列是首頁／內頁共用的，兩邊拆除都要收掉
    unbindVV();                // 可編輯的軌跡會綁 visualViewport（候選詞面板），拆掉要解綁
    targetSt = null;
    sayOpen = false;
    trailOpen = false; trailSeeded = false; trailExact = false;
    openFacet = null; panelFilter = ''; panelSel = 0;
    panelLastFacet = null; panelAnchorTop = null; panelScrolled = false;
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
