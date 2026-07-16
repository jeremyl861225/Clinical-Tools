/* 下拉更新（pull-to-refresh）
 * 僅在 PWA 獨立視窗（standalone）模式啟用：一般瀏覽器已有原生下拉更新。
 * 頁面捲到最頂時往下拉超過門檻，放開即重新載入；搭配 network-first SW 可即時取得最新版。
 */
(function () {
  'use strict';

  var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true;
  if (!isStandalone || !('ontouchstart' in window)) return;

  var THRESHOLD = 70;   // 觸發更新所需的下拉距離（px）
  var MAX_PULL = 110;   // 指示器最大下移距離（px）

  // 建立指示器（圓形箭頭，拉超過門檻轉向，放開後旋轉表示載入中）
  var style = document.createElement('style');
  style.textContent =
    '#ptr-wrap{position:fixed;top:-48px;left:50%;margin-left:-20px;z-index:9999;' +
    'width:40px;height:40px;border-radius:50%;background:#fff;' +
    'box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;' +
    'transition:none;pointer-events:none;}' +
    '#ptr-arrow{font-size:20px;line-height:1;color:#1a73e8;transition:transform .2s;}' +
    '#ptr-wrap.ptr-release #ptr-arrow{transform:rotate(180deg);}' +
    '#ptr-wrap.ptr-loading #ptr-arrow{animation:ptr-spin .8s linear infinite;}' +
    '@keyframes ptr-spin{to{transform:rotate(360deg);}}';
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.id = 'ptr-wrap';
  wrap.innerHTML = '<span id="ptr-arrow">&#8595;</span>';
  document.body.appendChild(wrap);

  var startY = null;
  var dist = 0;
  var loading = false;

  function pageAtTop() {
    var se = document.scrollingElement || document.documentElement;
    return se.scrollTop <= 0;
  }

  // 觸點位於可往上捲的內層容器時不觸發（如表格、清單）
  function innerScrolled(node) {
    while (node && node !== document.body) {
      if (node.scrollTop > 0) return true;
      node = node.parentNode;
    }
    return false;
  }

  function setPull(px) {
    wrap.style.transition = 'none';
    wrap.style.transform = 'translateY(' + px + 'px)';
    wrap.classList.toggle('ptr-release', px - 48 >= THRESHOLD - 48 && px >= THRESHOLD);
  }

  function reset() {
    startY = null;
    dist = 0;
    wrap.style.transition = 'transform .25s';
    wrap.style.transform = 'translateY(0)';
    wrap.classList.remove('ptr-release');
  }

  document.addEventListener('touchstart', function (e) {
    if (loading || !pageAtTop() || e.touches.length !== 1 || innerScrolled(e.target)) {
      startY = null;
      return;
    }
    startY = e.touches[0].clientY;
    dist = 0;
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (loading || startY === null) return;
    var dy = e.touches[0].clientY - startY;
    if (dy <= 0 || !pageAtTop()) {
      if (dist > 0) reset();
      return;
    }
    e.preventDefault();                       // 阻止 iOS 橡皮筋效果搶走手勢
    dist = Math.min(MAX_PULL, dy * 0.5);      // 阻尼：拉 2px 移 1px
    setPull(dist + 48);                       // +48 讓指示器從畫面外滑入
  }, { passive: false });

  document.addEventListener('touchend', function () {
    if (loading || startY === null) return;
    if (dist >= THRESHOLD) {
      loading = true;
      wrap.classList.remove('ptr-release');
      wrap.classList.add('ptr-loading');
      wrap.style.transition = 'transform .2s';
      wrap.style.transform = 'translateY(' + (THRESHOLD + 48) + 'px)';
      setTimeout(function () { location.reload(); }, 300);
    } else {
      reset();
    }
  }, { passive: true });
})();
