/* 全站查詢 —— 首頁搜尋欄
 * 索引來源：首頁工具卡（直接讀 DOM，新增卡片自動納入）＋ 藥物 DRUGS ＋ 病原菌 BACTERIA
 * ＋ 感染部位 SITES ＋ 癌症 CANCERS。
 * 資料檔（drugs.js 約 316K）於首次聚焦搜尋欄時才載入，首頁初始載入維持輕量；
 * 這些檔案皆已列入 SW 預快取，離線時亦可即時取得。
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
    cancer:   { label: '癌症',     order: 6 }
  };

  var DATA_FILES = [
    './data/antibiotics/regimens.js',   // SITES, BACTERIA
    './data/antibiotics/drugs.js',      // DRUGS
    './data/cancer/cancers.js'          // CANCERS
  ];

  var MAX_HITS = 50;      // 單次最多顯示筆數（超過時提示縮小範圍）
  var idx = null;         // 索引；null = 尚未建立
  var loading = null;     // 載入中的 Promise，避免重複載入
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
    loading = DATA_FILES.reduce(function (p, src) {
      return p.then(function () { return loadScript(src); });
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
      var tagEl = card.querySelector('.deci-tag');
      // .tool-name 內含 .tool-en 與 .deci-tag，取出純中文名
      var name = '';
      if (nameEl) {
        nameEl.childNodes.forEach(function (n) {
          if (n.nodeType === 3) name += n.textContent;
        });
      }
      name = name.trim();
      var tag = txt(tagEl);
      var type = 'tool';
      if (card.classList.contains('deci-card')) {
        type = (tag === 'Pathway') ? 'pathway' : 'guide';
      }
      var desc = txt(card.querySelector('.tool-desc'));
      out.push({
        type: type,
        label: name,
        en: txt(enEl),
        sub: desc.length > 90 ? desc.slice(0, 90) + '…' : desc,
        kw: desc,                       // 全文納入關鍵字：卡片說明常列出代表性藥名／涵蓋範圍
        url: m[1]
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
    CANCERS.forEach(function (c) {
      // 治療區塊（含療程與藥名 FOLFOX／FLOT／Avastin…）去標籤後納入關鍵字，
      // 讓查化療處方或藥名也能找到對應癌別
      var tx = (c.tx || []).map(function (t) {
        return (t.label || '') + ' ' + String(t.html || '').replace(/<[^>]*>/g, ' ');
      }).join(' ');
      out.push({
        type: 'cancer',
        label: c.zh,
        en: c.en,
        sub: c.group + ' · ' + (c.edition || ''),
        kw: c.id + ' ' + tx,
        url: 'tools/cancer.html#cancer=' + encodeURIComponent(c.id)
      });
    });
    return out;
  }

  function buildIndex() {
    idx = [].concat(indexCards(), indexSites(), indexBacteria(), indexDrugs(), indexCancers());
  }

  /* ---- 比對與排序 ---- */
  function scoreOf(item, q) {
    var label = item.label.toLowerCase();
    var en = (item.en || '').toLowerCase();
    var kw = (item.kw || '').toLowerCase();
    var sub = (item.sub || '').toLowerCase();
    if (label === q || en === q) return 100;
    if (label.indexOf(q) === 0) return 85;
    if (en.indexOf(q) === 0) return 80;
    if (label.indexOf(q) > -1) return 65;
    if (en.indexOf(q) > -1) return 55;
    if (kw.indexOf(q) > -1) return 35;
    if (sub.indexOf(q) > -1) return 20;
    return 0;
  }

  function search(q) {
    var hits = [];
    idx.forEach(function (item) {
      var s = scoreOf(item, q);
      if (s > 0) hits.push({ item: item, score: s });
    });
    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var ta = TYPES[a.item.type].order, tb = TYPES[b.item.type].order;
      if (ta !== tb) return ta - tb;
      return a.item.label.localeCompare(b.item.label);
    });
    return { total: hits.length, items: hits.slice(0, MAX_HITS).map(function (h) { return h.item; }) };
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

  function render(q, res) {
    var hits = res.items;
    if (!hits.length) {
      results.innerHTML = '<div class="gs-empty">找不到符合「' + esc(q) + '」的工具、藥物、菌名或癌症。</div>';
      return;
    }
    var byType = {};
    hits.forEach(function (h) { (byType[h.type] = byType[h.type] || []).push(h); });
    var order = Object.keys(byType).sort(function (a, b) { return TYPES[a].order - TYPES[b].order; });
    var html = '<div class="gs-count">' + res.total + ' 筆結果' +
      (res.total > hits.length ? '（顯示前 ' + hits.length + ' 筆，請輸入更完整的關鍵字）' : '') + '</div>';
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
    results.innerHTML = html;
  }

  function setActive(on) {
    results.classList.toggle('hidden', !on);
    groupsWrap.forEach(function (n) { n.classList.toggle('hidden', on); });
  }

  function onInput() {
    var q = input.value.trim().toLowerCase();
    if (!q) { setActive(false); results.innerHTML = ''; return; }
    setActive(true);
    if (!idx) {
      results.innerHTML = '<div class="gs-empty">載入資料中…</div>';
      loadData().then(function () {
        buildIndex();
        // 載入期間使用者可能已改字或清空
        var cur = input.value.trim().toLowerCase();
        if (cur) render(cur, search(cur)); else setActive(false);
      }).catch(function (e) {
        results.innerHTML = '<div class="gs-empty">資料載入失敗，請確認網路或重新整理。</div>';
        console.warn(e);
      });
      return;
    }
    render(q, search(q));
  }

  document.addEventListener('DOMContentLoaded', function () {
    input = document.getElementById('gs-input');
    results = document.getElementById('gs-results');
    if (!input || !results) return;
    groupsWrap = Array.prototype.slice.call(
      document.querySelectorAll('.tool-group, .home-divider'));

    // 聚焦即開始載入資料，使用者打完字時通常已就緒
    input.addEventListener('focus', function () { loadData(); }, { once: true });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; onInput(); input.blur(); }
      if (e.key === 'Enter') {
        var first = results.querySelector('.gs-item');
        if (first) location.href = first.getAttribute('href');
      }
    });
    document.getElementById('gs-clear').addEventListener('click', function () {
      input.value = ''; onInput(); input.focus();
    });
  });
})();
