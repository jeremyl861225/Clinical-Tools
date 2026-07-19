/* 全站側邊導覽列 —— 每一頁都能直接跳到任一工具，不必先回主選單。
 *
 * 用法：在 <head> 加上
 *   <link rel="stylesheet" href="<相對路徑>/css/nav.css">
 *   <script src="<相對路徑>/js/nav.js" defer></script>
 * 其餘全由本檔注入，頁面本身不需要任何標記。
 *
 * 清單來源＝首頁（index.html）的方磚與工具卡，本檔不另存一份名單：
 * 日後新增工具或流程圖，只要照舊在 index.html 加一張卡片，側欄就會跟著出現，
 * 分類與排序也一律以首頁為準（與 js/search.js 讀首頁 DOM 建索引的作法一致）。
 * 首頁本身直接讀自己的 DOM；其他頁面抓 index.html 來解析（已列入 SW 預快取，離線可用）。
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

  /* 首頁方磚直接連向單一頁面者（抗微生物、癌症治療），其底下的頁面在首頁沒有卡片，
     故於此列出。方磚若不在表內，就以方磚本身當成該類唯一的項目，
     因此日後新增一類方磚仍會自動出現，只有「該類要再細分成多頁」時才需回來加一筆。 */
  var HUB_PAGES = {
    'tools/antibiotics.html': [
      ['tools/antibiotics.html', '抗生素指引', 'Antibiotic Guide'],
      ['tools/spectrum-database.html', '菌譜資料庫', 'Spectrum Database']
    ]
  };

  var KEY = 'ct-nav-open';
  var DESKTOP = '(min-width:1024px)';
  var root = document.documentElement;

  function desktop() { return window.matchMedia(DESKTOP).matches; }

  // 記住的是「使用者在這種寬度下的選擇」；沒選過就用預設（電腦展開、手機收合）
  function stored() {
    try { return localStorage.getItem(KEY + (desktop() ? '-d' : '-m')); }
    catch (e) { return null; }
  }
  function remember(open) {
    try { localStorage.setItem(KEY + (desktop() ? '-d' : '-m'), open ? '1' : '0'); }
    catch (e) { /* 無痕模式等寫不進去，忽略即可 */ }
  }

  function setOpen(open, persist) {
    root.classList.toggle('nav-open', open);
    var btn = document.getElementById('nav-toggle');
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '收合導覽列' : '開啟導覽列');
    }
    if (persist) remember(open);
  }

  // 目前頁面：以「目錄/檔名」比對（首頁可能是 / 或 /index.html）
  var here = location.pathname.replace(/\/$/, '/index.html');
  function isCurrent(href) {
    var tail = href.replace(/^.*?([^/]+\/)?([^/]+\.html)$/, '$1$2');
    return here.slice(-tail.length) === tail;
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
  //         <div class="tool-name">中文名 <span class="deci-tag">…</span><span class="tool-en">…</span></div>
  // 中文名取 .tool-name 的純文字節點（略過內含的 .tool-en 與 .deci-tag）。
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
      href: m[1],
      zh: zh.trim() || txt(nameEl),
      en: en,
      pathway: card.classList.contains('deci-card')
    };
  }

  // 分類與排序一律照首頁的四張方磚：連 #sec-xxx 者取該區塊內所有工具卡，
  // 連 .html 者取 HUB_PAGES 的細目（無細目就是方磚本身那一頁）。
  function readGroups(doc) {
    var groups = [];
    var hub = doc.querySelectorAll('#hub .hub-card');
    Array.prototype.forEach.call(hub, function (tile) {
      var href = tile.getAttribute('href') || '';
      var title = tile.getAttribute('data-label') || txt(tile);
      var en = tile.getAttribute('data-en') || '';
      var items = [];

      if (href.charAt(0) === '#') {
        var sec = doc.getElementById('sec-' + href.slice(1));
        if (sec) Array.prototype.forEach.call(sec.querySelectorAll('.tool-card'), function (c) {
          var it = cardItem(c);
          if (it) items.push(it);
        });
      } else if (/\.html$/.test(href)) {
        var listed = HUB_PAGES[href];
        if (listed) listed.forEach(function (r) {
          items.push({ href: r[0], zh: r[1], en: r[2], pathway: false });
        });
        else items.push({ href: href, zh: title, en: en, pathway: false });
      }

      if (items.length) groups.push({ title: title, en: en, items: items });
    });
    return groups;
  }

  /* ---- 注入 ---- */

  function fill(nav, groups) {
    groups.forEach(function (g) {
      var box = el('div', 'nav-group');
      box.appendChild(el('div', 'nav-group-head',
        '<span>' + g.title + '</span>' +
        '<span class="nav-group-en">' + g.en + '</span>' +
        '<span class="nav-group-n">' + g.items.length + '</span>'));
      g.items.forEach(function (it) {
        var a = el('a', 'nav-item' + (it.pathway ? ' is-pathway' : ''),
          '<span class="nav-zh"></span><span class="nav-en"></span>');
        // 名稱來自首頁 DOM，一律以 textContent 寫入，不走 innerHTML
        a.querySelector('.nav-zh').textContent = it.zh;
        a.querySelector('.nav-en').textContent = it.en;
        a.href = ROOT + it.href;
        if (isCurrent(it.href)) a.classList.add('is-current');
        box.appendChild(a);
      });
      nav.appendChild(box);
    });

    // 捲到目前頁面那一項（工具多、計分工具在最下面），置於導覽列正中。
    // 自行算 scrollTop 而非 scrollIntoView：後者會連整頁一起捲。
    var cur = nav.querySelector('.nav-item.is-current');
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
        ['pointerdown', 'wheel', 'touchstart'].forEach(function (t) {
          nav.removeEventListener(t, stop);
        });
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
    if (isCurrent('index.html')) head.classList.add('is-current');
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
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktop()) setOpen(false, false);
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

    // 首頁：自己的 DOM 就是清單來源，同步填入。
    // 其他頁：抓首頁來解析；SW 有預快取，離線亦可取得。抓不到就只留標題連回首頁。
    if (document.getElementById('hub')) {
      fill(nav, readGroups(document));
    } else {
      fetch(ROOT + 'index.html', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          fill(nav, readGroups(doc));
        })
        .catch(function (e) { console.warn('導覽列清單載入失敗:', e); });
    }
  }

  root.classList.add('has-nav');
  var s = stored();
  root.classList.toggle('nav-open', s === null ? desktop() : s === '1');

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
