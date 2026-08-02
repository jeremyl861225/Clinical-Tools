/* 全站查詢 —— 首頁搜尋欄
 * 索引來源：首頁工具卡（直接讀 DOM，新增卡片自動納入）＋ 藥物 DRUGS ＋ 病原菌 BACTERIA
 * ＋ 感染部位 SITES ＋ 癌症 CANCERS。
 * 資料檔（drugs.js 約 316K）於首次聚焦搜尋欄時才載入，首頁初始載入維持輕量；
 * 這些檔案皆已列入 SW 預快取，離線時亦可即時取得。
 *
 * 另建「頁面內文」索引：許多分型／評分（Niemeier、Csendes、Björck…）只出現在工具或
 * 流程頁的內文，卡片名稱與說明查不到。故於背景抓取各頁 HTML 取出純文字（含流程頁
 * <script> 內的建議字串），比對後以命中片段呈現。頁面皆在 SW 預快取內，離線同樣可查。
 */
(function () {
  'use strict';

  var TYPES = {
    tool:     { label: '評分工具', order: 1 },
    pathway:  { label: '決策流程', order: 0 },
    guide:    { label: '指引',     order: 2 },
    site:     { label: '感染部位', order: 3 },
    bacteria: { label: '病原菌',   order: 4 },
    drug:     { label: '藥物',     order: 5 },
    cancer:   { label: '癌症',     order: 6 },
    text:     { label: '頁面內文', order: 9 }
  };

  // [檔案, 該檔宣告的全域]：這些檔於頂層用 const 宣告，重複載入會整支報錯，
  // 故已由別處載入者（如 js/nav.js 為了癌別清單載過 cancers.js）一律跳過。
  var DATA_FILES = [
    ['./data/antibiotics/regimens.js', 'SITES'],
    ['./data/antibiotics/drugs.js',    'DRUGS'],
    ['./data/cancer/cancers.js',       'CANCERS'],
    ['./data/drugs/index.js',          'DRUGDB_INDEX']   // 藥物資料庫輕量索引
  ];

  var MAX_HITS = 50;      // 單次最多顯示筆數（超過時提示縮小範圍）
  var MAX_TEXT_HITS = 12; // 內文命中最多列出的頁數
  var MIN_TEXT_Q = 2;     // 單一字元不做內文搜尋（雜訊過多）
  var idx = null;         // 索引；null = 尚未建立
  var loading = null;     // 載入中的 Promise，避免重複載入
  var ftPages = null;     // 內文索引；null = 尚未建立
  var ftLoading = null;
  var ftFailed = false;   // 各頁均抓不到（file:// 開啟等），內文查詢無法運作
  var input, results, groupsWrap;

  /* ---- 資料載入 ---- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('載入失敗: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadData() {
    if (loading) return loading;
    // 依序載入：cancers.js 於頂層宣告 const，重複載入會出錯，故各檔僅載一次
    loading = DATA_FILES.reduce(function (p, f) {
      return p.then(function () {
        return window[f[1]] ? null : loadScript(f[0]);
      });
    }, Promise.resolve());
    return loading;
  }

  /* ---- 索引建立 ---- */
  function txt(node) { return node ? node.textContent.trim() : ''; }

  // 工具／流程卡：直接讀首頁 DOM，日後新增卡片無須改動此檔
  function indexCards() {
    var out = [];
    document.querySelectorAll('.tool-card').forEach(function (card) {
      var onclick = card.getAttribute('onclick') || '';
      var m = onclick.match(/'([^']+\.html)'/);
      if (!m) return;
      var nameEl = card.querySelector('.tool-name');
      var enEl = card.querySelector('.tool-en');
      // .tool-name 內含 .tool-en，取出純中文名
      var name = '';
      if (nameEl) {
        nameEl.childNodes.forEach(function (n) {
          if (n.nodeType === 3) name += n.textContent;
        });
      }
      name = name.trim();
      // 決策流程以 .deci-card 判定；卡片上的「Pathway」標籤已移除，不可再靠標籤文字
      var type = card.classList.contains('deci-card') ? 'pathway' : 'tool';
      var desc = txt(card.querySelector('.tool-desc'));
      out.push({
        type: type,
        label: name,
        en: txt(enEl),
        sub: desc.length > 90 ? desc.slice(0, 90) + '…' : desc,
        // 卡片說明全文（常列出代表性藥名／涵蓋範圍）＋卡片自己的 data-search-kw；
        // 後者是縮寫與同義詞的唯一來源（RSI、ACS、AECOPD…），名稱與說明裡都沒有
        kw: desc + ' ' + (card.getAttribute('data-search-kw') || ''),
        url: m[1]
      });
    });
    return out;
  }

  /* 首頁入口方磚：連向頁面者（抗微生物、癌症治療、藥物資料庫）與站內分類
     （腹部急症、急重症處置、計分工具）都要收——大類名稱本身也要查得到。
     站內分類的 href 是 #abdomen 這種錨點，改寫成 index.html#abdomen：
     結果列點下去就回首頁並展開該分類（與導覽列同一套目的地）。 */
  function indexHubs() {
    var out = [];
    document.querySelectorAll('.hub-card[href]').forEach(function (card) {
      var href = card.getAttribute('href') || '';
      var url = href.charAt(0) === '#' ? 'index.html' + href : href;
      if (url.indexOf('.html') === -1) return;
      // 方磚上的中文被拆成上下兩半（腹部／急症），故完整名稱與英文取自 data-*
      var sub = card.getAttribute('data-sub') || '';
      out.push({
        type: 'guide',
        label: card.getAttribute('data-label') || '',
        en: card.getAttribute('data-en') || '',
        sub: sub,
        kw: sub + ' ' + (card.getAttribute('data-search-kw') || ''),
        url: url
      });
    });
    return out;
  }

  function indexDrugs() {
    var out = [];
    if (!window.DRUGS) return out;
    Object.keys(DRUGS).forEach(function (k) {
      var d = DRUGS[k];
      var brands = (d.brands || []).slice();
      if (d.ntuhProducts) d.ntuhProducts.forEach(function (p) {
        if (p.en) brands.push(p.en);
        if (p.zh) brands.push(p.zh);
      });
      out.push({
        type: 'drug',
        label: d.name,
        en: d.zh || '',
        sub: (brands.length ? brands.join('／') + ' · ' : '') + (d.cls || ''),
        kw: brands.join(' ') + ' ' + (d.cls || '') + ' ' + k,
        url: 'tools/antibiotics.html#drug=' + encodeURIComponent(k)
      });
    });
    return out;
  }

  // 藥物資料庫（台大處方集，一商品名一卡）：連向 drug-database.html 並直接展開該卡
  var DB_FORM = /\b(Tablets?|Capsules?|Injection|Solution|Soln|Syrup|Suspension|Powder|Granules?|Sachet|Patch|Pen|Inhal\w*|Spray|Cream|Gel|Suppository|Effervescent|Lyo\w*|F\.?C\.?|Film-coated|Oral|SR|CR|MR|XR|ER|Sterile|for)\b/i;
  function dbShortBrand(b) {
    var out = [];
    String(b || '').trim().split(/\s+/).some(function (w) {
      if (out.length && (DB_FORM.test(w) || /[\d,]/.test(w))) return true;
      out.push(w);
      return out.length >= 4;
    });
    return out.join(' ').replace(/[,，]$/, '');
  }
  function indexDrugDb() {
    var out = [];
    if (!window.DRUGDB_INDEX) return out;
    DRUGDB_INDEX.forEach(function (d) {
      var strengths = (d.strengths || []).join('／');
      var cls = (d.cls || []).join(' · ');
      out.push({
        type: 'drug',
        label: dbShortBrand(d.brand) || d.name,                    // 商品名（去劑型／含量）
        en: d.name,                                                // 學名
        sub: [d.zh, strengths, cls].filter(Boolean).join(' · '),
        kw: [d.name, d.brand, d.zh, cls, strengths,
             (d.codes || []).join(' ')].join(' '),
        url: 'tools/drug-database.html#code=' + encodeURIComponent(d.code)
      });
    });
    return out;
  }

  function indexBacteria() {
    var out = [];
    if (!window.BACTERIA) return out;
    BACTERIA.forEach(function (g) {
      g.items.forEach(function (b) {
        out.push({
          type: 'bacteria',
          label: b.name,
          en: b.en,
          sub: g.group,
          kw: (b.kw || '') + ' ' + g.group,
          url: 'tools/antibiotics.html#bac=' + encodeURIComponent(b.en)
        });
      });
    });
    return out;
  }

  function indexSites() {
    var out = [];
    if (!window.SITES) return out;
    SITES.forEach(function (s, i) {
      out.push({
        type: 'site',
        label: s.name,
        en: s.en || '',
        sub: '經驗性用藥 · ' + s.types.length + ' 型態',
        kw: s.types.map(function (t) { return t.name + ' ' + (t.en || ''); }).join(' '),
        url: 'tools/antibiotics.html#site=' + i
      });
    });
    return out;
  }

  function indexCancers() {
    var out = [];
    if (!window.CANCERS) return out;
    // 治療區塊（含療程與藥名 FOLFOX／FLOT／Avastin…）去標籤後納入關鍵字，
    // 讓查化療處方或藥名也能找到對應癌別
    function txKw(o) {
      return (o.tx || []).map(function (t) {
        return (t.label || '') + ' ' + String(t.html || '').replace(/<[^>]*>/g, ' ');
      }).join(' ');
    }
    CANCERS.forEach(function (c) {
      out.push({
        type: 'cancer',
        label: c.zh,
        en: c.en,
        sub: c.group + ' · ' + (c.edition || ''),
        kw: c.id + ' ' + (c.abbr || '') + ' ' + txKw(c),
        url: 'tools/cancer.html#cancer=' + encodeURIComponent(c.id)
      });
      // 具子分型者（大腸直腸癌之結腸／直腸）：各部位另建一筆，直接深連結到該部位。
      // 查「直腸癌」須能直接開到直腸，而非只落在合併後的條目名稱上。
      (c.subtypes || []).forEach(function (s) {
        out.push({
          type: 'cancer',
          label: s.search_label || s.label,
          en: s.search_en || c.en,
          sub: c.group + ' · ' + (s.edition || c.edition || ''),
          kw: c.id + ' ' + s.key + ' ' + txKw(s),
          url: 'tools/cancer.html#cancer=' + encodeURIComponent(s.key)   // 由 ID_ALIAS 導向
        });
      });
    });
    return out;
  }

  // 只從別頁連出、首頁沒有卡片的頁面（抗生素指引的三個分頁、食道急症流程內的
  // Pittsburgh 分數）：無法由 DOM 取得，於此明列。
  // 列為 guide 型別後亦會被 pageList() 納入頁面內文索引。
  var SUB_PAGES = [
    { label: '抗生素菌譜資料庫', en: 'Spectrum Database', url: 'tools/spectrum-database.html',
      sub: 'β-內醯胺酶分類、抗細菌／抗黴菌菌譜、CR-GNB 新藥抗菌譜',
      kw: '菌譜 感受性 antibiogram Ambler β-lactamase ESBL AmpC KPC NDM OXA MBL 碳青黴烯 CR-GNB cefiderocol' },
    { label: '手術預防性抗微生物', en: 'Surgical Prophylaxis', url: 'tools/surgical-prophylaxis.html',
      sub: '台大手術預防性抗微生物製劑使用規範表一：依術式的建議處方、時機與期限',
      kw: '手術預防 預防性抗生素 術前給藥 SSI 傷口感染 cefazolin cefuroxime 追加給藥 redosing 劃刀前 關節置換 開顱 剖腹產 CABG 體外循環 CPB 移植' },
    { label: '創傷後抗生素', en: 'Trauma Antibiotics', url: 'tools/trauma-abx.html',
      sub: '穿刺性腹部創傷、開放性骨折、胸管、腦傷、咬傷、燒燙傷與破傷風預防',
      kw: '創傷 外傷 開放性骨折 Gustilo 胸管 tube thoracostomy 穿刺傷 咬傷 燒燙傷 顏面骨折 顱底骨折 破傷風 tetanus TIG EAST 預防性抗生素' },
    { label: 'Pittsburgh 食道穿孔嚴重度', en: 'Pittsburgh Esophageal Perforation Severity Score', url: 'tools/pss.html',
      sub: '食道穿孔嚴重度分數（PSS）：分數愈高愈不宜單純修補，與食道急症流程往返',
      kw: 'PSS Pittsburgh 食道 穿孔 esophageal perforation 嚴重度 severity Abbas 2009 Schweigert 2016 Boerhaave 縱膈炎 支架 修補 食道切除' }
  ];
  function indexSubPages() {
    return SUB_PAGES.map(function (p) {
      return { type: 'guide', label: p.label, en: p.en, sub: p.sub, kw: p.kw, url: p.url };
    });
  }

  function buildIndex() {
    idx = [].concat(indexHubs(), indexCards(), indexSubPages(), indexSites(),
                    indexBacteria(), indexDrugs(), indexDrugDb(), indexCancers());
  }

  /* ---- 比對與排序 ---- */
  /* 英文縮寫夾在別的字中間也會命中：查 rsi 時，Dispersible、diversion、cardioversion、
     irreversible、parsimonious 全部算命中，而且落在「名稱內含」這種高分級距，
     真正的 RSI 反而被擠下去。故英數字查詢的「內含」再分兩級：前後皆非英數者
     （＝獨立的一個字）為整字命中，夾在字中間者降一級。中文沒有詞界，一律以整字計。 */
  var LATIN = /^[a-z0-9][a-z0-9\s.\-]*$/;
  var ALNUM = /[a-z0-9]/;
  function wholeWord(hay, q) {
    if (!LATIN.test(q)) return true;
    for (var i = hay.indexOf(q); i > -1; i = hay.indexOf(q, i + 1)) {
      if (!ALNUM.test(hay.charAt(i - 1) || ' ') && !ALNUM.test(hay.charAt(i + q.length) || ' ')) return true;
    }
    return false;
  }

  function scoreOf(item, q) {
    var label = item.label.toLowerCase();
    var en = (item.en || '').toLowerCase();
    var kw = (item.kw || '').toLowerCase();
    var sub = (item.sub || '').toLowerCase();
    if (label === q || en === q) return 100;
    if (label.indexOf(q) === 0) return 85;
    if (en.indexOf(q) === 0) return 80;
    if (label.indexOf(q) > -1) return wholeWord(label, q) ? 65 : 40;
    if (en.indexOf(q) > -1) return wholeWord(en, q) ? 55 : 30;
    if (kw.indexOf(q) > -1) return wholeWord(kw, q) ? 45 : 25;
    if (sub.indexOf(q) > -1) return 20;
    return 0;
  }

  function search(q) {
    var hits = [], urls = {};
    idx.forEach(function (item) {
      var s = scoreOf(item, q);
      if (s > 0) { hits.push({ item: item, score: s }); urls[item.url.split('#')[0]] = 1; }
    });
    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var ta = TYPES[a.item.type].order, tb = TYPES[b.item.type].order;
      if (ta !== tb) return ta - tb;
      return a.item.label.localeCompare(b.item.label);
    });
    return {
      total: hits.length,
      urls: urls,                     // 供內文搜尋排除已命中的頁面，避免同一頁重複列出
      // 分數帶著走：畫面上的分組順序由各組最佳命中決定（見 render）
      items: hits.slice(0, MAX_HITS).map(function (h) {
        return { type: h.item.type, label: h.item.label, en: h.item.en,
                 sub: h.item.sub, url: h.item.url, score: h.score };
      })
    };
  }

  /* ---- 頁面內文（全文）索引 ---- */
  // 索引對象＝首頁卡片與入口方磚指向的實際頁面；新增頁面自動納入，無須維護清單。
  // 首頁自己除外：所有卡片說明都寫在上頭，幾乎每個詞都會命中，而那些卡片本來
  // 就已由 indexCards() 逐張列出，再多一筆「頁面內文：腹部急症」只是重複。
  function pageList() {
    var seen = {}, out = [];
    idx.forEach(function (it) {
      if (it.type !== 'tool' && it.type !== 'pathway' && it.type !== 'guide') return;
      var u = it.url.split('#')[0];
      if (u.indexOf('.html') === -1 || u === 'index.html' || seen[u]) return;
      seen[u] = 1;
      out.push({ url: u, label: it.label, en: it.en, type: it.type });
    });
    return out;
  }

  // 流程頁的建議文字寫在 <script> 的字串常值裡（title/detail/note），一併取出；
  // 去掉標籤與 class 名稱，避免以原始碼比對造成的雜訊命中
  function parsePage(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var lit = [];
    doc.querySelectorAll('script').forEach(function (s) {
      var m = s.textContent.match(/'[^'\n]{2,}'|"[^"\n]{2,}"|`[^`]{2,}`/g);
      if (m) lit.push(m.join(' '));
    });
    doc.querySelectorAll('script, style, svg, noscript').forEach(function (n) { n.remove(); });
    return {
      text: (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim(),
      code: lit.join(' ').replace(/<[^>]*>/g, ' ').replace(/[`'"]/g, ' ')
              .replace(/\s+/g, ' ').trim()
    };
  }

  function loadFullText() {
    if (ftLoading) return ftLoading;
    ftLoading = Promise.all(pageList().map(function (p) {
      return fetch(p.url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (html) {
        var parsed = parsePage(html);
        p.text = parsed.text;
        p.code = parsed.code;
        return p;
      }).catch(function () { return null; });   // 單頁抓不到不影響其餘結果
    })).then(function (pages) {
      ftPages = pages.filter(Boolean);
      // 全數失敗＝根本抓不到頁面（如以 file:// 直接開啟，fetch 受 CORS 阻擋）。
      // 此時內文查詢一律無結果，須明說，否則與「查無此詞」無法分辨。
      ftFailed = pages.length > 0 && ftPages.length === 0;
    });
    return ftLoading;
  }

  // 命中處前後各留一小段作為片段；回傳已跳脫並標示 <mark> 的 HTML
  function snippet(text, q) {
    var i = text.toLowerCase().indexOf(q);
    if (i === -1) return null;
    var start = Math.max(0, i - 34), end = Math.min(text.length, i + q.length + 60);
    return (start > 0 ? '…' : '') + esc(text.slice(start, i)) +
           '<mark class="gs-hl">' + esc(text.slice(i, i + q.length)) + '</mark>' +
           esc(text.slice(i + q.length, end)) + (end < text.length ? '…' : '');
  }

  function searchFullText(q, skipUrls) {
    var out = [];
    (ftPages || []).forEach(function (p) {
      if (skipUrls[p.url]) return;
      var body = p.text || '', code = p.code || '';
      var src = body, sn = snippet(body, q);
      if (!sn) { src = code; sn = snippet(code, q); }
      if (!sn) return;
      out.push({
        type: 'text', label: p.label, en: p.en, url: p.url, snippet: sn,
        // 內文命中可用 Scroll-to-Text 直接捲到該處；瀏覽器不支援時僅開啟頁面
        hash: '#:~:text=' + encodeURIComponent(src.substr(src.toLowerCase().indexOf(q), q.length)),
        hits: src.toLowerCase().split(q).length - 1
      });
    });
    out.sort(function (a, b) {
      if (b.hits !== a.hits) return b.hits - a.hits;
      return a.label.localeCompare(b.label);
    });
    return out.slice(0, MAX_TEXT_HITS);
  }

  /* ---- 畫面 ---- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // 命中處以 <mark> 標示（僅標第一個命中，避免打斷中文詞）
  function hl(s, q) {
    var i = String(s).toLowerCase().indexOf(q);
    if (i === -1) return esc(s);
    return esc(s.slice(0, i)) + '<mark class="gs-hl">' + esc(s.slice(i, i + q.length)) +
           '</mark>' + esc(s.slice(i + q.length));
  }

  // textHits：內文命中陣列；null = 內文索引仍在背景建立中
  function render(q, res, textHits) {
    var hits = res.items;
    var pending = (textHits === null && q.length >= MIN_TEXT_Q);
    if (!hits.length && !(textHits && textHits.length)) {
      results.innerHTML = '<div class="gs-empty">找不到符合「' + esc(q) + '」的工具、藥物、菌名或癌症。' +
        (pending ? '<br><span class="gs-pending">正在搜尋各頁內文…</span>' : '') +
        (ftFailed ? '<br><span class="gs-pending">頁面內文無法讀取（請由網址或主畫面 App 開啟，勿直接開啟本機檔案）</span>' : '') +
        '</div>';
      return;
    }
    var byType = {}, best = {};
    hits.forEach(function (h) {
      (byType[h.type] = byType[h.type] || []).push(h);
      if (!(h.type in best) || h.score > best[h.type]) best[h.type] = h.score;
    });
    // 分組先比各組最佳命中，同分才照型別的既定順序：查 rsi 時「評分工具」裡有整字命中的
    // 快速誘導插管，就不該排在只沾到 diversion／irreversible 的「決策流程」後面
    var order = Object.keys(byType).sort(function (a, b) {
      if (best[b] !== best[a]) return best[b] - best[a];
      return TYPES[a].order - TYPES[b].order;
    });
    var html = '<div class="gs-count">' + res.total + ' 筆結果' +
      (res.total > hits.length ? '（顯示前 ' + hits.length + ' 筆，請輸入更完整的關鍵字）' : '') +
      (textHits && textHits.length ? ' · 另有 ' + textHits.length + ' 頁內文提及' : '') +
      (pending ? ' · 內文搜尋中…' : '') + '</div>';
    order.forEach(function (t) {
      html += '<div class="gs-group-head">' + TYPES[t].label + '<span class="gs-group-n">' +
              byType[t].length + '</span></div>';
      byType[t].forEach(function (h) {
        html += '<a class="gs-item gs-' + t + '" href="' + esc(h.url) + '">' +
                '<span class="gs-name">' + hl(h.label, q) +
                (h.en ? '<span class="gs-en">' + hl(h.en, q) + '</span>' : '') + '</span>' +
                (h.sub ? '<span class="gs-sub">' + esc(h.sub) + '</span>' : '') + '</a>';
      });
    });
    if (textHits && textHits.length) {
      html += '<div class="gs-group-head">' + TYPES.text.label +
              '<span class="gs-group-n">' + textHits.length + '</span></div>';
      textHits.forEach(function (h) {
        html += '<a class="gs-item gs-text" href="' + esc(h.url + h.hash) + '">' +
                '<span class="gs-name">' + esc(h.label) +
                (h.en ? '<span class="gs-en">' + esc(h.en) + '</span>' : '') +
                (h.hits > 1 ? '<span class="gs-nhit">' + h.hits + ' 處</span>' : '') + '</span>' +
                '<span class="gs-snip">' + h.snippet + '</span></a>';
      });
    }
    results.innerHTML = html;
  }

  function setActive(on) {
    results.classList.toggle('hidden', !on);
    groupsWrap.forEach(function (n) { n.classList.toggle('hidden', on); });
  }

  // 一般索引先出結果，內文索引（需抓取各頁）就緒後再補上該分組
  function show(q) {
    var res = search(q);
    var ready = !!ftPages && q.length >= MIN_TEXT_Q;
    render(q, res, ready ? searchFullText(q, res.urls) : null);
    if (ftPages || q.length < MIN_TEXT_Q) return;
    loadFullText().then(function () {
      var cur = input.value.trim().toLowerCase();   // 抓取期間使用者可能已改字或清空
      if (cur === q) show(q);
    });
  }

  function onInput() {
    var q = input.value.trim().toLowerCase();
    if (!q) { setActive(false); results.innerHTML = ''; return; }
    setActive(true);
    if (!idx) {
      results.innerHTML = '<div class="gs-empty">載入資料中…</div>';
      loadData().then(function () {
        buildIndex();
        var cur = input.value.trim().toLowerCase();
        if (cur) show(cur); else setActive(false);
      }).catch(function (e) {
        results.innerHTML = '<div class="gs-empty">資料載入失敗，請確認網路或重新整理。</div>';
        console.warn(e);
      });
      return;
    }
    show(q);
  }

  /* 結果列指向首頁自己的分類（index.html#critical…）時，瀏覽器只換 hash、不重新
     載入；而查詢進行中 #home-body 整塊是隱藏的，路由把分類展開了也看不到。
     故這類連結先把查詢收乾淨再交給路由；hash 沒變（重複點同一項）時，
     瀏覽器不發 hashchange，補送一次讓路由重新跑。其餘連結整頁換掉，無須收拾。 */
  function isHomeAnchor(href) {
    var parts = href.split('#');
    return parts.length > 1 && (parts[0] === '' || /(^|\/)index\.html$/.test(parts[0]));
  }
  function clearQuery() {
    if (!input || !input.value) return;
    input.value = '';
    setActive(false);
    results.innerHTML = '';
    // 補送一次 input 事件收掉清除鍵（見 js/searchbar.js）
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function goResult(href) {
    if (!isHomeAnchor(href)) { location.href = href; return; }
    var same = location.hash === '#' + href.split('#')[1];
    clearQuery();
    location.href = href;
    if (same) window.dispatchEvent(new Event('hashchange'));
  }

  /* 側欄的「腹部急症／急重症處置／計分工具」指向首頁自己的錨點（index.html#abdomen…），
     點下去只換 hash、不重新載入；而查詢進行中 #home-body 整塊是隱藏的，路由把分類展開了
     也仍蓋在查詢結果底下，看起來像沒反應。故凡是走向本頁錨點的連結，先把查詢收乾淨再讓它跳。
     另三個大類（抗微生物／癌症治療／藥物資料庫）是各自的 .html，整頁換掉，本來就不受影響。 */
  function wireHomeAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || !input.value) return;
      if (a.closest('#gs-results')) return;              // 結果列自己走 goResult
      if (a.host !== location.host || a.pathname !== location.pathname || !a.hash) return;
      clearQuery();
    }, true);
    // 上一頁／下一頁造成的 hash 變動同樣要收（點連結那次已先清空，這裡不會重複作用）
    window.addEventListener('hashchange', clearQuery);
    window.addEventListener('popstate', clearQuery);
  }

  document.addEventListener('DOMContentLoaded', function () {
    input = document.getElementById('gs-input');
    results = document.getElementById('gs-results');
    if (!input || !results) return;
    // 查詢時整塊隱藏首頁本體（入口方磚＋各分類），清空查詢後由路由還原原本的分類顯示狀態
    var body = document.getElementById('home-body');
    groupsWrap = body ? [body] : Array.prototype.slice.call(
      document.querySelectorAll('.tool-group, .home-divider'));

    // 聚焦即開始載入資料並抓取各頁內文，使用者打完字時通常已就緒
    input.addEventListener('focus', function () {
      loadData().then(function () {
        if (!idx) buildIndex();
        loadFullText();
      }).catch(function () {});
    }, { once: true });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; onInput(); input.blur(); }
      if (e.key === 'Enter') {
        var first = results.querySelector('.gs-item');
        if (first) goResult(first.getAttribute('href'));
      }
    });
    results.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a.gs-item') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!isHomeAnchor(href)) return;
      e.preventDefault();
      goResult(href);
    });
    wireHomeAnchors();
    // 清除鍵（.gs-clear）由 js/searchbar.js 統一處理：清空後會補送 input 事件，
    // 上面的 input 監聽照樣收得到，本檔不必再自行接線。
  });
})();
