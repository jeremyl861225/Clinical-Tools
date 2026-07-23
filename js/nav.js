/* 全站側邊導覽列 —— 每一頁都能直接跳到任一工具，不必先回主選單。
 *
 * 用法：在 <head> 加上
 *   <link rel="stylesheet" href="<相對路徑>/css/nav.css">
 *   <script src="<相對路徑>/js/nav.js" defer></script>
 * 其餘全由本檔注入，頁面本身不需要任何標記。
 *
 * 清單來源＝首頁（index.html）的方磚與工具卡＋癌症資料庫的癌別，本檔不另存一份名單：
 * 日後新增工具、流程圖或癌別，清單自動跟著長出來（與 js/search.js 讀首頁 DOM 建索引一致）。
 *   · 首頁：直接讀自己的 DOM。
 *   · 其他頁：先用上次存在 localStorage 的清單「立刻」畫出來（否則要等 index.html
 *     抓回來才有東西，慢一點的裝置會看到一片空白的側欄），再於背景重抓、有變動才重畫。
 *   · 癌別：cancers.js 有 320KB，不為了導覽列在每頁載入；已載入該檔的頁面（癌症頁、
 *     用過搜尋的頁）順手把癌別清單存起來，其餘頁面即由該份存檔渲染。
 *
 * 相對路徑由自己的 script src 反推（tools/ 與 pathways/ 深一層，首頁不是），
 * 故各頁只要引用正確的 nav.js，連結一律正確。
 *
 * 預設狀態：電腦（≥1024px）展開、手機收合；使用者手動開合後記在 localStorage，
 * 之後每頁都照使用者的選擇（換到另一種螢幕寬度時重新套用預設）。
 */
(function () {
  'use strict';

  // 以 nav.js 自身位置反推站台根目錄，供各頁組出正確的相對連結
  var self = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var ROOT = self.src.replace(/js\/nav\.js.*$/, '');

  /* 首頁方磚直接連向單一頁面者（抗微生物、癌症治療），其底下的分頁在首頁沒有卡片，
     故於此列出；#mode= 與 #cancer= 深層連結由該頁自己的 applyHash 處理。
     方磚若不在表內，就以方磚本身當成該類唯一的項目，因此日後新增一類方磚仍會自動出現。 */
  var HUB_PAGES = {
    'tools/antibiotics.html': [
      { href: 'tools/antibiotics.html#mode=empiric',  zh: '依部位（經驗性）', en: 'Empiric by Site' },
      { href: 'tools/antibiotics.html#mode=bacteria', zh: '依病原菌',         en: 'By Pathogen' },
      { href: 'tools/antibiotics.html#mode=lookup',   zh: '藥物查詢',         en: 'Drug Lookup' },
      { href: 'tools/spectrum-database.html',         zh: '菌譜資料庫',       en: 'Spectrum Database' },
      { href: 'tools/surgical-prophylaxis.html',      zh: '手術預防',         en: 'Surgical Prophylaxis' },
      { href: 'tools/trauma-abx.html',                zh: '創傷用藥',         en: 'Trauma Antibiotics' }
    ],
    // 空陣列＝這一類只列底下的癌別；該頁本身由大類標題連過去，不再重複一項
    'tools/cancer.html': []
  };
  var CANCER_PAGE = 'tools/cancer.html';

  /* 只在導覽列出現、首頁不放方磚的頁面。清單本來全由首頁 DOM 推導，這裡是唯一的例外：
     藥物資料庫是查詢型工具（一次 500+ 品項），放上首頁會壓過臨床決策那幾類，
     但仍需要每一頁都能直接跳過去，故於此明列。日後若決定放上首頁，
     只要在 index.html 加方磚並把這段刪掉即可。 */
  var NAV_ONLY_GROUPS = [
    {
      title: '藥物資料庫', en: 'Drug Database', href: 'tools/drug-database.html',
      items: [{ href: 'tools/drug-database.html', zh: '藥物資料庫', en: 'NTUH Formulary' }]
    },
    // 急重症處置：自含頁面（無首頁方磚），固定列於側邊欄最底。
    // 原名「心臟急重症」，加入呼吸道處置（RSI）後改為涵蓋復甦全域的名稱。
    {
      title: '急重症處置', en: 'Emergency & Critical Care', href: '',
      items: [
        { href: 'tools/acls.html', zh: 'ACLS 高級心臟救命術', en: 'Resuscitation Algorithms' },
        { href: 'tools/rsi.html', zh: 'RSI 快速誘導插管', en: 'Rapid Sequence Intubation' },
        { href: 'tools/heart-failure.html', zh: '心臟衰竭治療指引', en: 'NTUH Heart Failure' }
      ]
    }
  ];

  var KEY = 'ct-nav-open';
  var SNAP = 'ct-nav-snapshot-v2';    // 清單快照；格式變更時改版號即可作廢舊檔
  var DESKTOP = '(min-width:1024px)';
  var root = document.documentElement;

  function desktop() { return window.matchMedia(DESKTOP).matches; }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等寫不進去 */ } }

  // 記住的是「使用者在這種寬度下的選擇」；沒選過就用預設（電腦展開、手機收合）
  function stored() { return lsGet(KEY + (desktop() ? '-d' : '-m')); }
  function remember(open) { lsSet(KEY + (desktop() ? '-d' : '-m'), open ? '1' : '0'); }

  function setOpen(open, persist) {
    root.classList.toggle('nav-open', open);
    var btn = document.getElementById('nav-toggle');
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '收合導覽列' : '開啟導覽列');
    }
    if (persist) remember(open);
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function txt(node) { return node ? node.textContent.trim() : ''; }

  /* ---- 由首頁 DOM 推導清單 ---- */

  // 工具卡：<div class="tool-card" onclick="location.href='tools/xxx.html'">
  //         <div class="tool-name">中文名 <span class="tool-en">…</span></div>
  // 中文名取 .tool-name 的純文字節點（略過內含的 .tool-en）。
  function cardItem(card) {
    var m = (card.getAttribute('onclick') || '').match(/'([^']+\.html)'/);
    if (!m) return null;
    var nameEl = card.querySelector('.tool-name');
    var zh = '';
    if (nameEl) Array.prototype.forEach.call(nameEl.childNodes, function (n) {
      if (n.nodeType === 3) zh += n.textContent;
    });
    // 英文副標只留中間點之前那段（「Appendicitis · Operative Decision」→「Appendicitis」）：
    // 後半在導覽列裡是贅詞，整句照抄會折成兩三行，一屏放不了幾項。
    var en = txt(card.querySelector('.tool-en')).split(/\s[·・]\s/)[0];
    return {
      href: m[1], zh: zh.trim() || txt(nameEl), en: en,
      pathway: card.classList.contains('deci-card')
    };
  }

  /* 計分工具一律以英文名呈現：分數名本來就是英文，首頁卡片上少數帶中文說明的
     （AAS 成人闌尾炎分數、Forrest 分類…）在導覽列裡只會讓一整欄看起來忽中忽英。
     作法是去掉中日文字與括號註記，剩下的縮寫即為顯示名；整個名稱都是中文時退回英文全名。 */
  function asciiName(zh, en) {
    var s = zh.replace(/[（(][^）)]*[）)]/g, ' ')                       // 括號註記
      .replace(/[\u2E80-\u9FFF\uF900-\uFAFF\uFF01-\uFF60]/g, ' ')   // 中日文字與全形標點
      .replace(/\s+/g, ' ').trim()
      .replace(/[·・、,]+$/, '').trim();
    return s || en;
  }

  // 分類與排序一律照首頁的四張方磚：連 #sec-xxx 者取該區塊內所有工具卡，
  // 連 .html 者取 HUB_PAGES 的細目（無細目就是方磚本身那一頁）。
  function readGroups(doc) {
    var groups = [];
    Array.prototype.forEach.call(doc.querySelectorAll('#hub .hub-card'), function (tile) {
      var href = tile.getAttribute('href') || '';
      var title = tile.getAttribute('data-label') || txt(tile);
      var en = tile.getAttribute('data-en') || '';
      var items = [];

      if (href.charAt(0) === '#') {
        var sec = doc.getElementById('sec-' + href.slice(1));
        var english = href === '#scores';        // 計分工具：見 asciiName
        if (sec) Array.prototype.forEach.call(sec.querySelectorAll('.tool-card'), function (c) {
          var it = cardItem(c);
          if (!it) return;
          if (english) it.zh = asciiName(it.zh, it.en);
          items.push(it);
        });
      } else if (/\.html$/.test(href)) {
        var listed = HUB_PAGES[href];
        if (listed) listed.forEach(function (r) { items.push({ href: r.href, zh: r.zh, en: r.en }); });
        else items.push({ href: href, zh: title, en: en });
        if (href === CANCER_PAGE) items = items.concat(cancerItems());
      }

      // 方磚連 #abdomen 這種站內錨點時，補上首頁路徑，子頁點了才回得去
      var dest = href.charAt(0) === '#' ? 'index.html' + href : href;
      // 直接連向頁面的方磚即使暫時沒有細目（癌別還沒載到）也要保留，
      // 否則整類會從導覽列消失；標題本身就是通往該頁的連結
      if (items.length || /\.html$/.test(href)) {
        groups.push({ title: title, en: en, href: dest, items: items });
      }
    });
    NAV_ONLY_GROUPS.forEach(function (g) { groups.push(g); });
    return groups;
  }

  /* ---- 癌別：cancers.js 太大不為導覽列而載，改用「載過的頁面順手存檔」 ---- */

  // window.CANCERS 於癌症頁與用過搜尋的頁面已存在；有就更新存檔，沒有就沿用存檔。
  function cancerItems() {
    var list = null;
    if (window.CANCERS && window.CANCERS.length) {
      list = window.CANCERS.map(function (c) { return { id: c.id, zh: c.zh, en: c.en, g: c.group || '' }; });
      lsSet(SNAP + '-cancers', JSON.stringify(list));
    } else {
      try { list = JSON.parse(lsGet(SNAP + '-cancers') || 'null'); } catch (e) { list = null; }
    }
    if (!list) return [];

    // 依癌症頁的分群集中並插入小標，30 個癌別才掃得動。
    // 資料檔內同一群的癌別未必相鄰（依撰寫順序排列），故先歸位再輸出。
    var order = [], bucket = {};
    list.forEach(function (c) {
      var g = c.g || '其他 Other';
      if (!bucket[g]) { bucket[g] = []; order.push(g); }
      bucket[g].push({ href: CANCER_PAGE + '#cancer=' + c.id, zh: c.zh, en: c.en });
    });
    var out = [];
    order.forEach(function (g) {
      out.push({ head: g });
      out = out.concat(bucket[g]);
    });
    return out;
  }

  /* ---- 目前頁面 ---- */

  // 以「目錄/檔名」比對（首頁可能是 / 或 /index.html）；同一頁有多個項目時再比 hash
  var here = location.pathname.replace(/\/$/, '/index.html');
  function samePage(href) {
    var path = href.split('#')[0];
    var tail = path.replace(/^.*?([^/]+\/)?([^/]+\.html)$/, '$1$2');
    return here.slice(-tail.length) === tail;
  }
  // 一頁對到多個項目時（分頁、癌別），網址列的 hash 決定是哪一個。
  // 沒有 hash 時：先找不帶 hash 的那一項，再看該頁有沒有預設分頁；
  // 都沒有就不標（例如癌症頁停在癌別清單，標任何一個癌別都是錯的）。
  var DEFAULT_HASH = { 'tools/antibiotics.html': '#mode=empiric' };
  function itemHash(a) {
    var h = a.getAttribute('data-href').split('#')[1];
    return h ? '#' + h : '';
  }
  function markCurrent(nav) {
    var hash = location.hash;
    var mine = Array.prototype.filter.call(nav.querySelectorAll('.nav-item'), function (a) {
      return samePage(a.getAttribute('data-href'));
    });
    if (!mine.length) return null;

    var want = hash || null;
    if (!want) {
      var plain = mine.filter(function (a) { return !itemHash(a); })[0];
      if (plain) { plain.classList.add('is-current'); return plain; }
      want = DEFAULT_HASH[mine[0].getAttribute('data-href').split('#')[0]] || null;
    }
    var cur = want && mine.filter(function (a) { return itemHash(a) === want; })[0];
    // 頁面自身用 hash 做內部分頁（如心衰竭頁的 #overview），該 hash 不對應任何導覽項時，
    // 退回本頁的無-hash 項，才不會整個側欄都沒有標記當前頁。
    if (!cur) cur = mine.filter(function (a) { return !itemHash(a); })[0];
    if (cur) cur.classList.add('is-current');
    return cur || null;
  }

  /* ---- 注入 ---- */

  function fill(nav, groups) {
    // 重畫：標題列留著，只換清單
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-group'), function (g) { g.remove(); });

    groups.forEach(function (g) {
      var box = el('div', 'nav-group');
      var n = g.items.filter(function (it) { return !it.head; }).length;
      var h = el(g.href ? 'a' : 'div', 'nav-group-head',
        '<span class="nav-group-zh"></span><span class="nav-group-en"></span><span class="nav-group-n"></span>');
      if (g.href) h.href = ROOT + g.href;
      box.appendChild(h);
      h.children[0].textContent = g.title;
      h.children[1].textContent = g.en;
      h.children[2].textContent = n || '';

      g.items.forEach(function (it) {
        if (it.head) {                       // 癌別分群小標
          var sh = el('div', 'nav-subhead');
          sh.textContent = it.head;
          box.appendChild(sh);
          return;
        }
        var a = el('a', 'nav-item' + (it.pathway ? ' is-pathway' : ''),
          '<span class="nav-zh"></span><span class="nav-en"></span>');
        // 名稱來自首頁 DOM／資料檔，一律以 textContent 寫入，不走 innerHTML
        a.querySelector('.nav-zh').textContent = it.zh;
        // 計分工具的名稱整個是中文時，asciiName 會退回英文全名（見上），此時 zh 與 en
        // 相同，照填就會同一行印兩次；相同即只留主名。
        a.querySelector('.nav-en').textContent = (it.en && it.en !== it.zh) ? it.en : '';
        a.href = ROOT + it.href;
        a.setAttribute('data-href', it.href);
        box.appendChild(a);
      });
      nav.appendChild(box);
    });

    center(nav, markCurrent(nav));
  }

  // 捲到目前頁面那一項（項目多，計分工具與癌別都在下面），置於導覽列正中。
  // 自行算 scrollTop 而非 scrollIntoView：後者會連整頁一起捲。
  function center(nav, cur) {
    function centerCurrent() {
      if (!cur || !nav.clientHeight) return;
      nav.scrollTop = cur.offsetTop + cur.offsetHeight / 2 - nav.clientHeight / 2;
    }
    centerCurrent();
    // 導覽列高度＝視窗高度；開頁初期視窗尺寸未必已定案（PWA 啟動、行動版工具列、旋轉），
    // 故高度一變就重算。使用者一動到導覽列就停手，之後不再干涉他的捲動位置。
    if (cur && window.ResizeObserver) {
      var ro = new ResizeObserver(centerCurrent);
      ro.observe(nav);
      var stop = function () {
        ro.disconnect();
        ['pointerdown', 'wheel', 'touchstart'].forEach(function (t) { nav.removeEventListener(t, stop); });
      };
      ['pointerdown', 'wheel', 'touchstart'].forEach(function (t) {
        nav.addEventListener(t, stop, { passive: true });
      });
      setTimeout(stop, 10000);
    }
  }

  function build() {
    var nav = el('nav', 'side-nav');
    nav.id = 'side-nav';
    nav.setAttribute('aria-label', '全站導覽');

    var head = el('a', 'nav-head',
      '<span class="nav-head-en">Clinical Toolbox</span>' +
      '<span class="nav-head-zh">臨床工具箱</span>');
    head.href = ROOT + 'index.html';
    if (samePage('index.html')) head.classList.add('is-current');
    nav.appendChild(head);

    var scrim = el('div', 'nav-scrim');
    scrim.id = 'nav-scrim';
    scrim.addEventListener('click', function () { setOpen(false, true); });

    var btn = el('button', 'nav-toggle', '<span></span><span></span><span></span>');
    btn.id = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-controls', 'side-nav');
    btn.addEventListener('click', function () {
      setOpen(!root.classList.contains('nav-open'), true);
    });

    document.body.appendChild(scrim);
    document.body.appendChild(nav);
    document.body.appendChild(btn);

    // 手機（抽屜蓋在內容上）按 Esc 或點連結後收起；電腦推開內容則維持展開
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open') && !desktop()) setOpen(false, false);
    });
    // 手機（抽屜蓋在內容上）點任一連結即收合，並記下收合狀態：
    // 只在畫面上收起而不記住的話，下一頁又會照著「使用者開過」重新展開。
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktop()) setOpen(false, true);
    });

    // 同頁的 #mode=／#cancer= 連結不會重新載入，換頁內分頁後自行更新標示
    window.addEventListener('hashchange', function () {
      var old = nav.querySelector('.nav-item.is-current');
      if (old) old.classList.remove('is-current');
      markCurrent(nav);
    });

    // 轉向／改變視窗寬度時，若使用者未在該寬度下手動選過，回到該寬度的預設
    window.matchMedia(DESKTOP).addEventListener('change', function () {
      var s = stored();
      setOpen(s === null ? desktop() : s === '1', false);
    });

    // 第一次繪製完成後才開放開合動畫（見 css/nav.css 的 .nav-ready）
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('nav-ready'); });
    });

    load(nav);
  }

  var srcDoc = null;              // 清單所依據的首頁文件，癌別補上來時據此重算

  function derive(doc) {
    srcDoc = doc;
    var groups = readGroups(doc);
    if (!groups.length) return null;
    lsSet(SNAP, JSON.stringify(groups));
    return groups;
  }

  // 從沒載過 cancers.js 的瀏覽器，側欄會缺癌別；等頁面閒下來再補抓一次，
  // 抓完存檔，之後每頁都直接由存檔渲染，不再動這個 320KB 的檔。
  function ensureCancers(nav) {
    if (window.CANCERS || lsGet(SNAP + '-cancers')) return;
    var kick = function () {
      var s = document.createElement('script');
      s.src = ROOT + 'data/cancer/cancers.js';
      s.onload = function () {
        var g = srcDoc ? derive(srcDoc) : null;
        if (g) fill(nav, g);
      };
      document.head.appendChild(s);
    };
    if (window.requestIdleCallback) window.requestIdleCallback(kick, { timeout: 4000 });
    else setTimeout(kick, 1500);
  }

  function load(nav) {
    // 首頁：自己的 DOM 就是清單來源
    if (document.getElementById('hub')) {
      var groups = derive(document);
      if (groups) fill(nav, groups);
      ensureCancers(nav);
      return;
    }

    // 其他頁：先用上次的快照立刻畫出來，避免等待期間側欄一片空白
    var cached = null;
    try { cached = JSON.parse(lsGet(SNAP) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.length) fill(nav, cached);

    // 再抓首頁核對；有變動（新增工具、新癌別）才重畫，抓不到就維持快照
    fetch(ROOT + 'index.html', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (html) {
        var fresh = derive(new DOMParser().parseFromString(html, 'text/html'));
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(cached)) fill(nav, fresh);
      })
      .catch(function (e) {
        if (!cached) console.warn('導覽列清單載入失敗:', e);
      })
      .then(function () { ensureCancers(nav); });
  }

  root.classList.add('has-nav');
  var s = stored();
  root.classList.toggle('nav-open', s === null ? desktop() : s === '1');

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
