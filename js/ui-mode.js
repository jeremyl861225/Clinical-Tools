/* js/ui-mode.js — 雙設計切換器（04 造句設計 ⇄ 貓咪主題／原正式版）
 *
 * 【2026-08 改版】造句設計成為正式主題，原正式版降為彩蛋主題。
 *   · 預設：沒存過設定就是造句設計（inline boot 改判 !== 'classic'）。
 *     按下切換才寫入 'classic'，切回來寫 'sentence'——兩個值都寫，不用「刪掉鍵」
 *     代表其中一邊，否則清掉 localStorage 的人會回到造句設計，這是對的，
 *     但反過來「存 classic 的人」若只靠刪鍵就會被誤判成沒設定過。
 *   · 切換鈕從右上角那顆 46×46 的滑動開關，改成頁尾一行不起眼的小字。
 *     使用者原話：「將右上角的主題切換鈕取消，改放一個不起眼的小按鈕
 *     （註明『找貓咪』來切換主題）」。貓＝原正式版首頁的像素貓彩蛋
 *     （js/pixel-cat.js），造句設計沒有牠，所以「找貓咪」就是切過去的意思；
 *     人已經在貓咪主題時改顯示「回句子」，否則同一顆字面上會變成單向的。
 *   · 位置改成文件流的最末端（append 到 body 之後自然落在頁尾之下），
 *     不再 position:fixed：固定在右上角就不可能「不起眼」，而且畫面下緣有
 *     造句設計的固定列、右下角有回到最上面的箭頭，四個角都已經有東西了。
 *
 * 與 108 頁 <head> 內、<!-- ui-mode:start --> 區塊裡那段極短的 inline boot
 * script 分工，兩者不可合併：
 *   · inline boot（見各頁 <head>，不可用 defer）：只做「讀
 *     localStorage.getItem('ct-ui')，**不是** 'classic' 就在 <html> 上補
 *     data-ui="sentence"」，必須在 paint 之前執行完，否則會先畫出貓咪主題
 *     樣式、data-ui 才姍姍來遲地補上，使用者會看到閃一下（FOUC）。
 *   · 本檔（defer 載入）：只負責畫出可見的切換器，並處理使用者點擊後的
 *     即時切換——直接改屬性＋寫 localStorage，不重新整理、不導頁，
 *     切換後留在同一頁。開頁當下的 data-ui 狀態已由 inline boot 定案，
 *     本檔不重做那件事，只讀取結果來決定切換鈕一開始要顯示哪個狀態。
 *
 * 切換器改版前刻意不放文字節點（用兩個空 <span> 疊成滑動鈕），為的是讓
 * baseline.py 的逐頁文字比對維持「加了切換器＝零文字差異」。這一版依使用者
 * 要求改成有字的「找貓咪」，那項零差異的性質也就跟著結束——每頁多這三個字
 * 是明示的設計決定，不是回歸。仍然保留的兩件事：
 *   · min-height 45px（≥44px 觸控目標下限，多留 1px 避開次像素捨入的假陽性，
 *     理由與 css/ui-sentence.css 的 M-0 段相同），不讓它變成「新增小觸控目標」。
 *   · 直接掛在 <body> 上（如同 nav.js 掛 nav/scrim/btn 的做法），不是
 *     main／.sheet／.view.active 的子節點，故不影響既有地標的內部結構；
 *     但它現在**在文件流內**（頁尾之下），會把文件高度加長一小段。
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
      /* 兩邊都明寫（見檔頭）：'classic' 是唯一會讓 inline boot 停用造句設計的值 */
      localStorage.setItem(KEY, on ? VAL : 'classic');
    } catch (e) {
      /* localStorage 被停用：僅本次瀏覽套用切換，不持久化，不拋錯 */
    }
  }

  /* 頁尾的一行小字。刻意不給邊框與底色，只留 45px 的可點高度（觸控目標下限）
     與置中的 10px 等寬字；造句設計的下緣固定列在 ≤680px 會蓋住畫面最底部，
     故最後再留一段 margin，捲到底時字不會卡在固定列後面。 */
  var CSS = ''
    + '.ui-mode-toggle{display:block;margin:26px auto calc(28px + env(safe-area-inset-bottom,0px));'
    + 'min-height:45px;padding:0 14px;background:none;border:0;cursor:pointer;'
    + 'font-family:var(--mono,ui-monospace,monospace);font-size:10px;letter-spacing:.14em;'
    + 'color:var(--muted-soft,#8a8a8a);opacity:.55;transition:opacity .15s,color .15s;}'
    + '.ui-mode-toggle:hover{opacity:1;color:var(--accent,inherit);}'
    + '.ui-mode-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px;opacity:1;}'
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

    function sync() {
      var on = current();
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      /* 字面永遠說「按下去會到哪」，不是「現在在哪」——單向的「找貓咪」按了
         之後若還是同一行字，使用者會以為沒切成功。 */
      btn.textContent = on ? '找貓咪' : '回句子';
      btn.setAttribute('aria-label', on ? '切換到貓咪主題' : '切換回造句設計');
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
