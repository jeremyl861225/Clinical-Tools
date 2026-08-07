/* 跨頁返回鍵 —— 由 A 頁進到 B 頁時，B 頁自動長出「← 返回<A 頁名稱>」，
 * 位置固定在「← 返回主選單」之上。頁面本身不需要任何接線。
 *
 * 用法：在 <head> 加上（放在 nav.js 之後即可，順序不拘）
 *   <script src="<相對路徑>/js/backlink.js" defer></script>
 * 頁面若希望被別頁引用時顯示簡稱（h1 太長時），在 <body> 加
 *   <body data-back-label="腸阻塞決策">
 * 未指定就取 .app-header h1 的文字。
 *
 * 取代舊作法：原本每個被連入的頁面各自硬寫一顆隱藏按鈕，
 *   <button class="back-btn hidden" id="xx_back_yy" onclick="location.href='...'">← 返回OO</button>
 * 再於頁尾寫一段 if(location.search.indexOf('from=yy')>=0) 把它顯示出來。
 * 全站曾有 34 份這種片段，各自定義 id 與 ?from= 代號，新增一條連結就要改三個地方，
 * 且只要有人忘了寫，該頁就成了回不去來源頁的死路——清查時共 8 條動線如此，
 * 連 classifications.html 自備的對照表都只涵蓋 9 個來源中的 6 個。
 *
 * 來源的判定用 document.referrer，不是攔截點擊：站內有不少「前往」是頁面自己的
 * JS 直接寫 location.href（例如圍手術期抗栓帶著表單狀態跳到 CHA₂DS₂-VASc），
 * 攔點擊抓不到這種，會讓返回鍵指向更早以前的某一頁——比沒有還糟。referrer 則
 * 不管用什麼方式離開都準確。
 *
 * 名稱查表放 localStorage：referrer 只給得到網址，給不到「那一頁叫什麼」。
 * 每頁載入時把自己的簡稱寫進表裡，要顯示時再查——使用者必然剛從來源頁過來，
 * 該頁的簡稱一定已經在表內。
 *
 * 動線以堆疊記錄，故 A→B→C 在 C 顯示「返回 B」、按下後回到 B 顯示「返回 A」。
 * 堆疊放 sessionStorage（關掉分頁即失效）；回到主選單、或直接輸入網址開啟某頁，
 * 都視為新的起點而清空——不會冒出上一輪逛到一半的返回鍵。
 */
(function () {
  'use strict';

  var STACK = 'ct-back-stack';       // sessionStorage：本次逛的動線
  var NAMES = 'ct-page-labels';      // localStorage：頁面 → 簡稱
  var FLAG = 'ct-back-going';        // sessionStorage：按下返回鍵的一次性記號
  var SRC = 'ct-back-src';           // sessionStorage：離開前最後一次點擊是內文還是導覽
  var MAX = 8;                       // 逛得再深也不必記到底，超過就丟最舊的

  /* 導覽介面（不是內文動線）——由這些地方跳到別頁不算「從某頁連過來」，
     目的地不該長出返回鍵。側邊導覽與搜尋是「跳到任一工具」的捷徑，
     跟流程圖裡「這一步要用這個分數」的連結性質完全不同。 */
  /* .abx-modes 也算導覽介面：抗生素指引那六個分頁（依部位／依病原菌／藥物查詢／
     菌譜資料庫／手術預防／創傷用藥）是同一層的並列分頁，只是實作上分散在四個
     檔案裡，所以互跳時原本會被當成「從某頁連過來」而長出「← 返回抗生素指引」。
     那顆按鈕是多餘的——分頁列本身就在畫面上，按哪一格都回得去。
     使用者實機回報，且指名正式版也要一起修，故改在這裡而不是只用 CSS 藏起來。 */
  var CHROME = '#side-nav, #nav-toggle, #nav-scrim, #gs-results, .gs-box, .back-btn, .abx-modes';

  // 以自身 script 位置反推站台根目錄（與 nav.js 同一套作法），
  // 故 tools/ 與 pathways/ 深一層也能組出正確連結
  var me = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var ROOT = me.src.replace(/js\/backlink\.js.*$/, '');
  // 站台根目錄的路徑。GitHub Pages 部署在子路徑（/Clinical-Tools/），
  // 本機開發伺服器則在網域根目錄（/），頁面識別必須相對於這裡算，不能只看檔名。
  var ROOT_PATH = new URL(ROOT, location.href).pathname;

  /* 站內頁面識別＝相對站台根目錄的「目錄/檔名」，例如 index.html、tools/sofa.html。
     曾經只取路徑末端的「目錄/檔名」，在子路徑部署時首頁會被算成
     「Clinical-Tools/index.html」而不是「index.html」——於是首頁既沒被當成首頁
     （不清空動線），又被當成一個普通來源頁，害每個從首頁點進去的工具都長出
     一顆「← 返回臨床工具箱」。本機在網域根目錄跑，剛好看不出來。 */
  function pageId(url) {
    var p;
    try { p = new URL(url, location.href).pathname; }
    catch (e) { return ''; }
    if (p.indexOf(ROOT_PATH) === 0) p = p.slice(ROOT_PATH.length);
    if (p === '' || p.charAt(p.length - 1) === '/') p += 'index.html';
    return p.replace(/^\//, '');
  }
  var HERE = pageId(location.pathname) || 'index.html';
  var IS_HOME = HERE === 'index.html';

  // localStorage 專用：Cookie／站台資料被封鎖時，光是讀取 window.localStorage
  // 這個屬性就會拋 SecurityError（比呼叫 getItem/setItem 更早發生）。
  // 若寫成共用函式 jget(store, k, dflt) 讓呼叫端傳 localStorage 進來，
  // store 這個識別字是在呼叫端（call site）求值，不在函式內部的 try/catch
  // 範圍內，一樣包不到——同 js/nav.js 第 83–84 行的 lsGet／lsSet。
  // 因此存取與 JSON 包裝都各自獨立成 ls* 函式，讓 localStorage 一律只在
  // try 區塊內被提及。
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等寫不進去 */ } }
  function jgetLS(k, dflt) {
    try { return JSON.parse(lsGet(k)) || dflt; } catch (e) { return dflt; }
  }
  function jsetLS(k, v) { lsSet(k, JSON.stringify(v)); }

  // sessionStorage 專用：同一顆地雷，window.sessionStorage 屬性存取一樣會拋
  // SecurityError（「封鎖所有 Cookie 與網站資料」這種瀏覽器設定下兩者都封）。
  // 比照上面 ls* 的做法，每一處直接碰 sessionStorage 的地方都改走這幾支，
  // 不再把 sessionStorage 當參數傳給共用函式。
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* 無痕模式等寫不進去 */ } }
  function ssRemove(k) { try { sessionStorage.removeItem(k); } catch (e) { /* 同上 */ } }
  function jgetSS(k, dflt) {
    try { return JSON.parse(ssGet(k)) || dflt; } catch (e) { return dflt; }
  }
  function jsetSS(k, v) { ssSet(k, JSON.stringify(v)); }

  /* ---- 本頁在返回鍵上該叫什麼，並登記到查表 ---- */
  function myLabel() {
    var d = document.body.getAttribute('data-back-label');
    if (d && d.trim()) return d.trim();
    var h = document.querySelector('.app-header h1') || document.querySelector('h1');
    return h ? h.textContent.trim() : '';
  }
  function registerLabel() {
    var lab = myLabel();
    if (!lab) return;
    var names = jgetLS(NAMES, {});
    if (names[HERE] === lab) return;
    names[HERE] = lab;
    jsetLS(NAMES, names);
  }

  /* ---- 記下離開本頁前，最後一次點的是內文還是導覽介面 ----
     referrer 只說得出「從哪一頁來」，說不出「怎麼來的」。側邊導覽與搜尋跳過來的，
     使用者要的是「回主選單」而不是「回上一個工具」（PESI 頁一度出現
     「← 返回營養風險評估」就是這樣來的：兩者只是先後用側欄點開，毫無關聯）。
     以「離開前最後一次點擊」判定：導覽介面內的點擊記 0，其餘記 1。
     用最後一次而非第一次，是因為使用者可能先在內文點了東西才改用側欄。 */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || t.nodeType !== 1) return;
    var chrome = !!(t.closest && t.closest(CHROME));
    ssSet(SRC, chrome ? '0' : '1');
  }, true);

  /* ---- 依 referrer 更新動線 ---- */
  function originFromReferrer(viaContent) {
    // 不是從內文連結點過來的（側欄／搜尋／直接輸入網址／外部連結），不算動線
    if (!viaContent) return null;

    var ref = document.referrer;
    if (!ref || ref.indexOf(location.origin) !== 0) return null;   // 外部連結或無 referrer
    var id = pageId(ref);
    if (!id || id === HERE || id === 'index.html') return null;    // 同頁重整、由主選單進入
    var names = jgetLS(NAMES, {});
    return {
      id: id,
      // 流程圖帶 ?restore=1 回去，才會回到離開前的選項與捲動位置（見 js/common.js）
      href: id + (/^pathways\//.test(id) ? '?restore=1' : ''),
      label: names[id] || id.replace(/^.*\//, '').replace(/\.html$/, '')
    };
  }

  function updateStack() {
    // 兩個一次性記號都在這裡讀掉，免得殘留下來影響下一次導覽
    var going = ssGet(FLAG);
    var viaContent = ssGet(SRC) === '1';
    ssRemove(FLAG);
    ssRemove(SRC);

    if (IS_HOME) { ssRemove(STACK); return []; }

    var stack = jgetSS(STACK, []);

    if (going) {
      // 剛按下返回鍵回到這一頁：把本頁（及其之後）從動線上退掉，不要再把來路壓回去
      while (stack.length && stack[stack.length - 1].id === HERE) stack.pop();
      jsetSS(STACK, stack);
      return stack;
    }

    var origin = originFromReferrer(viaContent);
    if (!origin) {
      // 由側欄／搜尋跳過來、直接輸入網址、從外部連結進來＝新的起點
      stack = [];
    } else if (!stack.length || stack[stack.length - 1].id !== origin.id) {
      stack.push(origin);
      if (stack.length > MAX) stack.shift();
    }
    jsetSS(STACK, stack);
    return stack;
  }

  /* ---- 呈現 ---- */

  // 頁面只寫了一顆「返回主選單」時，就地補上 .back-stack 外框，
  // 讓兩顆鍵維持「來源頁在上、主選單在下」的直向堆疊
  function stackBox(home) {
    var box = home.parentNode.classList.contains('back-stack') ? home.parentNode : null;
    if (box) return box;
    box = document.createElement('div');
    box.className = 'back-stack';
    home.parentNode.insertBefore(box, home);
    box.appendChild(home);
    return box;
  }

  function backBtns() {
    return document.querySelectorAll('.app-header .back-btn, .back-stack .back-btn');
  }
  function homeBtn() {
    var all = backBtns();
    for (var i = all.length - 1; i >= 0; i--) {
      if (/index\.html/.test(all[i].getAttribute('onclick') || '')) return all[i];
    }
    return null;
  }

  function render(stack) {
    if (IS_HOME || !stack.length) return;

    var origin = stack[stack.length - 1];
    var home = homeBtn();
    if (!home) return;                       // 沒有主選單鍵的頁面不處理

    /* 少數頁面的返回鍵不只是導覽，還要順手把算好的分數帶回來源頁（如 CHA₂DS₂-VASc
       回圍手術期抗栓）。那種鍵必須自己寫，並以 data-back-to 標明去向，
       本檔認出後就不再插一顆看起來一樣的。 */
    var own = backBtns();
    for (var i = 0; i < own.length; i++) {
      // data-back-to 寫的是相對站台根目錄的代號，要對著 ROOT 解析
      var bt = own[i].getAttribute('data-back-to');
      if (bt && pageId(ROOT + bt) === origin.id) return;
      // onclick 是一整段 JS（location.href='../x.html'），把網址挑出來、對著本頁解析
      var m = (own[i].getAttribute('onclick') || '').match(/[\w./-]+\.html/);
      if (m && pageId(m[0]) === origin.id) return;
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-btn back-origin';
    btn.textContent = '← 返回' + origin.label;
    btn.addEventListener('click', function () {
      ssSet(FLAG, '1');
      location.href = ROOT + origin.href;
    });
    stackBox(home).insertBefore(btn, home);

    // 按「返回主選單」＝這一輪動線結束
    home.addEventListener('click', function () {
      ssRemove(STACK);
    });
  }

  function start() {
    registerLabel();
    render(updateStack());
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
