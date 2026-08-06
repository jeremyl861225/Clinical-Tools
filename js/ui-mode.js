/* js/ui-mode.js — 雙設計切換器（正式版 ⇄ 04 造句設計）
 *
 * 與 108 頁 <head> 內、<!-- ui-mode:start --> 區塊裡那段極短的 inline boot
 * script 分工，兩者不可合併：
 *   · inline boot（見各頁 <head>，不可用 defer）：只做「讀
 *     localStorage.getItem('ct-ui')，是 'sentence' 就在 <html> 上補
 *     data-ui="sentence"」，必須在 paint 之前執行完，否則會先畫出正式版
 *     樣式、data-ui 才姍姍來遲地補上，使用者會看到閃一下（FOUC）。
 *   · 本檔（defer 載入）：只負責畫出可見的切換器，並處理使用者點擊後的
 *     即時切換——直接改屬性＋寫 localStorage，不重新整理、不導頁，
 *     切換後留在同一頁。開頁當下的 data-ui 狀態已由 inline boot 定案，
 *     本檔不重做那件事，只讀取結果來決定切換鈕一開始要顯示哪個狀態。
 *
 * 切換器本身刻意不放任何文字節點——用兩個空 <span> 疊成一顆滑動鈕
 * （做法比照 css/nav.css 的三橫槓 .nav-toggle：純用空節點＋CSS 畫形狀），
 * 這樣每一頁的 document.body.innerText 不會因為多了這顆按鈕而改變，
 * baseline.py 的逐頁文字比對才能維持「加了切換器＝零文字差異」。
 * 尺寸鎖 46×46（≥44px 觸控目標下限），理由相同：不讓切換器自己變成
 * baseline.py 統計的「新增小觸控目標」。固定在畫面右上角，鏡射
 * css/nav.css 左上角的三橫槓 .nav-toggle（left:10px ↔ 這裡 right:10px），
 * 用 position:fixed 疊在畫面上、不佔文件流位置，不會動到 .app-header／
 * .back-stack 等既有地標的 bbox，也不是 main／.sheet／.view.active 的
 * 子節點（直接掛在 <body> 上，如同 nav.js 掛 nav/scrim/btn 的做法）。
 *
 * 樣式以 <style> 注入，不另開一支 css 檔、也不動 css/styles.css／
 * css/nav.css——兩者現有規則因此一條都不必碰。
 */
(function () {
  'use strict';

  var KEY = 'ct-ui';
  var ATTR = 'data-ui';
  var VAL = 'sentence';

  function current() {
    return document.documentElement.getAttribute(ATTR) === VAL;
  }

  function setMode(on) {
    if (on) {
      document.documentElement.setAttribute(ATTR, VAL);
    } else {
      document.documentElement.removeAttribute(ATTR);
    }
    try {
      if (on) { localStorage.setItem(KEY, VAL); }
      else { localStorage.removeItem(KEY); }
    } catch (e) {
      /* localStorage 被停用：僅本次瀏覽套用切換，不持久化，不拋錯 */
    }
  }

  var CSS = ''
    + '.ui-mode-toggle{position:fixed;top:9px;right:10px;z-index:70;'
    + 'width:46px;height:46px;padding:0;display:flex;align-items:center;justify-content:center;'
    + 'background:var(--panel);border:1px solid var(--line);border-radius:2px;cursor:pointer;'
    + 'transition:border-color .15s,background .15s;}'
    + '.ui-mode-toggle:hover{border-color:var(--accent);background:var(--hover-bg);}'
    + '.ui-mode-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}'
    + '.ui-mode-track{position:relative;width:26px;height:14px;border:1px solid var(--line);'
    + 'border-radius:7px;background:var(--soft-bg);transition:border-color .15s,background .15s;'
    + 'pointer-events:none;}'
    + '.ui-mode-knob{position:absolute;top:1px;left:1px;width:10px;height:10px;border-radius:50%;'
    + 'background:var(--muted);transition:transform .18s ease,background .15s;}'
    + '.ui-mode-toggle[aria-pressed="true"] .ui-mode-track{border-color:var(--accent);background:var(--accent-soft);}'
    + '.ui-mode-toggle[aria-pressed="true"] .ui-mode-knob{transform:translateX(12px);background:var(--accent);}'
    + '@media print{.ui-mode-toggle{display:none;}}';

  function injectStyle() {
    if (document.getElementById('ui-mode-style')) return;
    var s = document.createElement('style');
    s.id = 'ui-mode-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function build() {
    if (document.querySelector('.ui-mode-toggle')) return; // 冪等：不重複插入
    injectStyle();

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ui-mode-toggle';
    btn.setAttribute('aria-label', '切換設計語言：正式版／造句設計');

    var track = document.createElement('span');
    track.className = 'ui-mode-track';
    var knob = document.createElement('span');
    knob.className = 'ui-mode-knob';
    track.appendChild(knob);
    btn.appendChild(track);

    function sync() {
      btn.setAttribute('aria-pressed', current() ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      setMode(!current());
      sync();
    });
    sync();
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
