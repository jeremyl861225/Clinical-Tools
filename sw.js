/* 臨床計分工具箱 — Service Worker
 * 版本更新時請修改 CACHE_VERSION，使用者下次開啟即自動更新快取。
 */
const CACHE_VERSION = 'clinical-tools-v55';

// 以相對路徑列出，方便部署於子路徑（如 GitHub Pages /clinical-scores/）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/antibiotics.css',
  './css/cancer-staging.css',
  './js/common.js',
  './js/antibiotics.js',
  './js/cancer-staging.js',
  './js/gastric-pathway.js',
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

// 擷取：cache-first，離線時導航頁回退至首頁
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只處理 GET 且同源請求
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // 執行期間動態快取新取得的同源資源
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // 離線且未快取：導航請求回退首頁，其餘失敗
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return Response.error();
        });
    })
  );
});
