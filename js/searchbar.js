/* 查詢欄共用行為 —— 全站每一顆 .gs-field 都由本檔接線，各頁不必自行處理。
 *
 * 一、清除鍵：.gs-field 內的 .gs-clear 一律清空同框的 .gs-input，並補送一次 input
 *     事件，讓各頁原本掛在 oninput 的篩選函式照常重跑；沒有字時整顆藏起來。
 *
 * 二、回到最上面：捲離頁首之後，右下角出現上箭頭，點了直接回到整頁最上緣
 *     （查詢欄都在頁首附近，回到頂端即等於回到查詢欄）。
 *     只在 <body data-backtotop> 的頁面注入。
 */
(function () {
  'use strict';

  var SHOW_AFTER = 240;    // 捲過這麼多像素後才出現箭頭

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

  /* ---- 二、回到最上面 ---- */
  function mountToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', '回到最上面');
    btn.title = '回到最上面';
    btn.setAttribute('aria-hidden', 'true');
    // 箭頭筆畫與三橫槓同為 1.5px，寬度同為 17px
    btn.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M8.5 14V3.6M3.6 8.5 8.5 3.6l4.9 4.9"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    // 直接在事件裡量（只讀一個捲動位置，成本可忽略）。
    // 不走 requestAnimationFrame：分頁不在前景時 rAF 會被凍住，回到前景又沒捲動的話，
    // 箭頭就會卡在上一次的狀態。
    function update() {
      btn.setAttribute('aria-hidden', window.scrollY > SHOW_AFTER ? 'false' : 'true');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // 篩選後內容變短，瀏覽器會把捲動位置往上夾（如藥物資料庫只剩一筆），順手重算
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
