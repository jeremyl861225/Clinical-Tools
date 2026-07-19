/* 臨床工具箱 — Service Worker
 * 策略：stale-while-revalidate —— 一律先回快取（開啟即顯示，與離線同速），
 * 同時在背景抓最新版寫回快取，下次開啟即為新版。
 * 下拉更新（PTR）會送 REFRESH 訊息，強制重抓全部檔案後重新載入，可立即取得最新版。
 *
 * 註：曾採 network-first，但每個資源都要等網路（且以 no-cache 逐一向伺服器驗證），
 *     手機網路下每頁數十次往返，開啟明顯變慢，故改為本策略。
 * CACHE_VERSION 僅在需要強制清除舊快取時修改。
 */
const CACHE_VERSION = 'clinical-tools-v151';

// 以相對路徑列出，方便部署於子路徑（如 GitHub Pages /clinical-scores/）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/nav.css',
  './css/antibiotics.css',
  './css/cancer-staging.css',
  './js/common.js',
  './js/nav.js',
  './js/pull-to-refresh.js',
  './js/search.js',
  './js/pixel-cat.js',
  './js/antibiotics.js',
  './js/cancer-staging.js',
  './js/gastric-pathway.js',
  './js/breast-pathway.js',
  './js/crc-regimens.js',
  './js/colon-pathway.js',
  './js/rectal-pathway.js',
  './js/panc-pathway.js',
  './js/hcc-pathway.js',
  './js/sts-pathway.js',
  './js/pnet-pathway.js',
  './js/net-pathway.js',
  './js/cervix-pathway.js',
  './js/endo-pathway.js',
  './js/utsarc-pathway.js',
  './js/ovarian-pathway.js',
  './js/utuc-pathway.js',
  './js/rcc-pathway.js',
  './js/bladder-pathway.js',
  './js/prostate-pathway.js',
  './js/npc-pathway.js',
  './js/hnc-pathway.js',
  './js/aml-pathway.js',
  './js/all-pathway.js',
  './js/cml-pathway.js',
  './js/mds-pathway.js',
  './js/mpn-pathway.js',
  './js/lym-pathway.js',
  './js/lung-pathway.js',
  './data/antibiotics/antibiogram.js',
  './data/antibiotics/regimens.js',
  './data/antibiotics/drugs.js',
  './data/cancer/cancers.js',
  './pathways/appendicitis.html',
  './pathways/cholecystitis.html',
  './pathways/hernia.html',
  './pathways/bowel-obstruction.html',
  './pathways/gi-ischemia.html',
  './pathways/gi-perforation.html',
  './pathways/diverticulitis.html',
  './pathways/pancreatitis.html',
  './pathways/abdominal-trauma.html',
  './tools/emergency-surgery.html',
  './tools/air.html',
  './tools/antibiotics.html',
  './tools/spectrum-database.html',
  './tools/alvarado.html',
  './tools/ami.html',
  './tools/angers.html',
  './tools/apache.html',
  './tools/cancer.html',
  './tools/cci.html',
  './tools/child-pugh.html',
  './tools/cholangitis.html',
  './tools/meld.html',
  './tools/marshall.html',
  './tools/ctsi.html',
  './tools/millet.html',
  './tools/mpi.html',
  './tools/p-possum.html',
  './tools/parc.html',
  './tools/pulp.html',
  './tools/radial.html',
  './tools/sofa.html',
  './tools/sort.html',
  './tools/vasopressor.html',
  './tools/wassmer.html',
  './tools/wses.html',
  // 首頁四大類方磚圖：第一屏內容，離線時不能缺（癌別方磚在點進去之後才需要，
  // 由 fetch 的 stale-while-revalidate 於實際瀏覽時逐張快取，故不列於此）
  './assets/hub/emergency.jpg',
  './assets/hub/antibiotics.jpg',
  './assets/hub/cancer.jpg',
  './assets/hub/sofa.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

// 安裝：預先快取所有檔案，讓 App 可完全離線運行
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 啟用：清除舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 擷取：stale-while-revalidate —— 有快取就立即回應，背景另抓新版更新快取
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只處理 GET 且同源請求
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);

    // 背景更新：no-cache 強制向伺服器驗證（帶 ETag，未更動時回 304 幾乎不耗流量），
    // 否則會沿用瀏覽器 HTTP 快取，而 GitHub Pages 送 max-age=600。
    // 此請求不阻擋畫面，抓到新版寫回快取，下次開啟即為最新。
    const update = fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(update);   // 維持 SW 存活至背景更新完成
      return cached;
    }

    // 未快取過：只能等網路；失敗時導航請求回退首頁
    const res = await update;
    if (res) return res;
    if (req.mode === 'navigate') {
      const home = await cache.match('./index.html');
      if (home) return home;
    }
    return Response.error();
  })());
});

// 下拉更新：重抓全部檔案（略過所有快取）後通知頁面重新載入，用於立即取得最新版
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'REFRESH') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(PRECACHE_URLS.map((u) =>
      fetch(u, { cache: 'reload' })
        .then((res) => (res && res.status === 200) ? cache.put(u, res) : null)
        .catch(() => null)          // 個別檔案失敗不影響其餘
    ));
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: 'REFRESHED' }));
  })());
});
