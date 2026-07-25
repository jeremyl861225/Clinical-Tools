/* 查詢欄共用行為 —— 全站每一顆 .gs-field 都由本檔接線，各頁不必自行處理。
 *
 * 一、清除鍵：.gs-field 內的 .gs-clear 一律清空同框的 .gs-input，並補送一次 input
 *     事件，讓各頁原本掛在 oninput 的篩選函式照常重跑；沒有字時整顆藏起來。
 *
 * 二、回到查詢欄：頁面捲過查詢欄之後，右下角出現上箭頭，點了把查詢欄捲回畫面上緣。
 *     只在 <body data-backtotop> 的頁面注入，且只在「畫面上方確實有一顆看得見的
 *     查詢欄」時才顯示 —— 抗生素指引切到「依部位」這種沒有查詢欄的分頁時自動收起。
 */
(function () {
  'use strict';

  var TOP_GAP = 12;        // 捲回查詢欄時，欄位上緣與視窗頂端留的間距
  var SHOW_AFTER = 120;    // 查詢欄底緣被推出畫面這麼多像素後才出現箭頭

  /* ---- 一、清除鍵 ---- */
  function inputOf(field) { return field.querySelector('.gs-input'); }

  function syncClear(field) {
    var btn = field.querySelector('.gs-clear');
    var inp = inputOf(field);
    if (btn && inp) btn.hidden = !inp.value;
  }

  function wireFields() {
    document.querySelectorAll('.gs-field').forEach(function (field) {
      if (field.dataset.sbWired) return;
      field.dataset.sbWired = '1';
      var inp = inputOf(field);
      var btn = field.querySelector('.gs-clear');
      if (!inp) return;
      syncClear(field);
      inp.addEventListener('input', function () { syncClear(field); });
      if (!btn) return;
      btn.addEventListener('click', function () {
        inp.value = '';
        // 各頁的篩選掛在 oninput／addEventListener('input')，補送事件即可一律生效
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        syncClear(field);
        inp.focus();
      });
    });
  }

  /* ---- 二、回到查詢欄 ---- */
  // 目前畫面上「看得見」的查詢欄；隱藏分頁（display:none）的不算
  function visibleFields() {
    return Array.prototype.filter.call(
      document.querySelectorAll('.gs-field'),
      function (f) { return f.offsetParent !== null || f.getClientRects().length > 0; }
    );
  }

  // 已被捲到畫面上方的那一顆（取最靠下的一顆，即使用者剛離開的那一顆）
  function fieldAbove() {
    var hit = null;
    visibleFields().forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.bottom < -SHOW_AFTER) hit = f;
    });
    return hit;
  }

  function mountToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', '回到查詢欄');
    btn.title = '回到查詢欄';
    btn.setAttribute('aria-hidden', 'true');
    // 箭頭筆畫與三橫槓同為 1.5px，寬度同為 17px
    btn.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M8.5 14V3.6M3.6 8.5 8.5 3.6l4.9 4.9"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var f = fieldAbove() || visibleFields()[0];
      var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      var opt = { behavior: reduce ? 'auto' : 'smooth' };
      if (f) {
        var pad = parseFloat(getComputedStyle(document.body).paddingTop) || 0;  // 側欄的 56px 頂條
        opt.top = Math.max(0, window.scrollY + f.getBoundingClientRect().top - pad - TOP_GAP);
      } else {
        opt.top = 0;
      }
      window.scrollTo(opt);
    });

    // 直接在事件裡量（只有寥寥幾個 .gs-field，成本可忽略）。
    // 不走 requestAnimationFrame：分頁不在前景時 rAF 會被凍住，回到前景又沒捲動的話，
    // 箭頭就會卡在上一次的狀態。
    function update() {
      btn.setAttribute('aria-hidden', fieldAbove() ? 'false' : 'true');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // 分頁切換、篩選後版面長度會變（如抗生素指引切模式），沒有捲動也要重算
    document.addEventListener('click', function () { setTimeout(update, 0); }, true);
    document.addEventListener('visibilitychange', update);
    update();
  }

  function init() {
    wireFields();
    if (document.body.hasAttribute('data-backtotop')) mountToTop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
