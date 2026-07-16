/* 臨床計分工具箱 — Service Worker
 * 策略：network-first（有網路時每次都抓最新版並更新快取；離線或逾時才回退快取）。
 * CACHE_VERSION 僅在需要強制清除舊快取時修改。
 */
const CACHE_VERSION = 'clinical-tools-v71';

// 以相對路徑列出，方便部署於子路徑（如 GitHub Pages /clinical-scores/）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/antibiotics.css',
  './css/cancer-staging.css',
  './js/common.js',
  './js/pull-to-refresh.js',
  './js/search.js',
  './js/antibiotics.js',
  './js/cancer-staging.js',
  './js/gastric-pathway.js',
  './js/breast-pathway.js',
  './js/colon-pathway.js',
  './data/antibiotics/antibiogram.js',
  './data/antibiotics/regimens.js',
  './data/antibiotics/drugs.js',
  './data/cancer/cancers.js',
  './pathways/appendicitis.html',
  './pathways/cholecystitis.html',
  './pathways/hernia.html',
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
  './tools/meld.html',
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

// 網路逾時（毫秒）：超過即先回退快取，網路請求仍在背景完成並更新快取，下次開啟即為最新版
const NETWORK_TIMEOUT_MS = 4000;

// 擷取：network-first，有網路時抓最新並更新快取；離線或逾時回退快取
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只處理 GET 且同源請求
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);

    // 發出網路請求；成功即更新快取
    const networkFetch = fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      });

    // 慢網路保護：逾時先用快取，networkFetch 仍在背景更新快取
    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS);
    });

    const raced = await Promise.race([
      networkFetch.catch(() => null),
      timeout
    ]);
    if (raced) return raced;

    const cached = await cache.match(req) || await caches.match(req);
    if (cached) return cached;

    // 無快取：等網路請求完成（可能只是慢）；徹底失敗時導航頁回退首頁
    try {
      return await networkFetch;
    } catch (e) {
      if (req.mode === 'navigate') {
        const home = await caches.match('./index.html');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
