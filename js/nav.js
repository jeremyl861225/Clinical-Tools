/* 全站側邊導覽列 —— 每一頁都能直接跳到任一工具，不必先回主選單。
 *
 * 用法：在 <head> 加上
 *   <link rel="stylesheet" href="<相對路徑>/css/nav.css">
 *   <script src="<相對路徑>/js/nav.js" defer></script>
 * 其餘全由本檔注入，頁面本身不需要任何標記。
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

  var GROUPS = [
    {
      title: '腹部急症', en: 'Abdominal Emergencies', pathway: true,
      items: [
        ['pathways/appendicitis.html',      '急性闌尾炎手術決策',       'Appendicitis'],
        ['pathways/cholecystitis.html',     '急性膽囊炎手術決策',       'Acute Cholecystitis'],
        ['pathways/diverticulitis.html',    '急性大腸憩室炎處置決策',   'Colonic Diverticulitis'],
        ['pathways/pancreatitis.html',      '急性胰臟炎處置決策',       'Acute Pancreatitis'],
        ['pathways/hernia.html',            '複雜性腹股溝疝氣手術決策', 'Complicated Groin Hernia'],
        ['pathways/bowel-obstruction.html', '腸阻塞處置決策',           'Bowel Obstruction'],
        ['pathways/gi-ischemia.html',       '腸胃道缺血處置決策',       'GI Ischemia'],
        ['pathways/gi-perforation.html',    '腸胃道穿孔處置決策',       'GI Perforation'],
        ['pathways/abdominal-trauma.html',  '腹部創傷處置決策',         'Abdominal Trauma'],
        ['tools/emergency-surgery.html',    '緊急手術分級',             'Emergency Surgery Priority']
      ]
    },
    {
      title: '抗微生物', en: 'Antimicrobials',
      items: [
        ['tools/antibiotics.html',        '抗生素指引',     'Antibiotic Guide'],
        ['tools/spectrum-database.html',  '菌譜資料庫',     'Spectrum Database']
      ]
    },
    {
      title: '癌症治療', en: 'Cancer',
      items: [
        ['tools/cancer.html', '癌症分期與治療', 'Staging & Treatment']
      ]
    },
    {
      title: '計分工具', en: 'Scoring Tools',
      items: [
        ['tools/cci.html',         'CCI 共病指數',           'Charlson Comorbidity Index'],
        ['tools/sofa.html',        'SOFA',                   'Sequential Organ Failure'],
        ['tools/apache.html',      'APACHE II',              'Acute Physiology & Chronic Health'],
        ['tools/vasopressor.html', '升壓／強心藥物換算',     'Vasoactive-Inotropic Score'],
        ['tools/child-pugh.html',  'Child-Pugh',             'Child-Pugh Score'],
        ['tools/meld.html',        'MELD 3.0',               'Model for End-Stage Liver Disease'],
        ['tools/p-possum.html',    'P-POSSUM',               'Portsmouth POSSUM'],
        ['tools/sort.html',        'SORT',                   'Surgical Outcome Risk Tool'],
        ['tools/alvarado.html',    'Alvarado',               'Alvarado Score'],
        ['tools/air.html',         'AIR Score',              'Appendicitis Inflammatory Response'],
        ['tools/parc.html',        'pARC（兒童）',           'Pediatric Appendicitis Risk Calculator'],
        ['tools/pulp.html',        'PULP Score',             'Peptic Ulcer Perforation'],
        ['tools/marshall.html',    'Modified Marshall',      'Organ Failure in Pancreatitis'],
        ['tools/ctsi.html',        'CT Severity Index',      'Balthazar CTSI'],
        ['tools/mpi.html',         'MPI',                    'Mannheim Peritonitis Index'],
        ['tools/wses.html',        'WSES Sepsis Score',      'WSES Sepsis Severity'],
        ['tools/wassmer.html',     'Wassmer Score',          'Clinical Severity Score for SBO'],
        ['tools/angers.html',      'Angers CT Score',        'Angers CT Score'],
        ['tools/millet.html',      'Millet Score',           'CT Findings for Strangulation'],
        ['tools/radial.html',      'RADIAL Score',           'RADIAL Score for AMI'],
        ['tools/ami.html',         'AMI Diagnostic Score',   'Scoring System for AMI Diagnosis']
      ]
    }
  ];

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

    GROUPS.forEach(function (g) {
      var box = el('div', 'nav-group');
      box.appendChild(el('div', 'nav-group-head',
        '<span>' + g.title + '</span>' +
        '<span class="nav-group-en">' + g.en + '</span>' +
        '<span class="nav-group-n">' + g.items.length + '</span>'));
      g.items.forEach(function (it) {
        var a = el('a', 'nav-item' + (g.pathway && it[0].indexOf('pathways/') === 0 ? ' is-pathway' : ''),
          '<span class="nav-zh">' + it[1] + '</span>' +
          '<span class="nav-en">' + it[2] + '</span>');
        a.href = ROOT + it[0];
        if (isCurrent(it[0])) a.classList.add('is-current');
        box.appendChild(a);
      });
      nav.appendChild(box);
    });

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

    // 捲到目前頁面那一項（工具多、計分工具在最下面），置於導覽列正中。
    // 自行算 scrollTop 而非 scrollIntoView：後者會連整頁一起捲。
    // 版面還沒算完時（尤其是圖多的頁）算出來的位置會偏掉，故一路重算到 load 為止。
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

    // 第一次繪製完成後才開放開合動畫（見 css/nav.css 的 .nav-ready）
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('nav-ready'); });
    });
  }

  root.classList.add('has-nav');
  var s = stored();
  root.classList.toggle('nav-open', s === null ? desktop() : s === '1');

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
