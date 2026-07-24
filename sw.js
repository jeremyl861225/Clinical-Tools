/* 臨床工具箱 — Service Worker
 * 策略：stale-while-revalidate —— 一律先回快取（開啟即顯示，與離線同速），
 * 同時在背景抓最新版寫回快取，下次開啟即為新版。
 * 下拉更新（PTR）會送 REFRESH 訊息，強制重抓全部檔案後重新載入，可立即取得最新版。
 *
 * 註：曾採 network-first，但每個資源都要等網路（且以 no-cache 逐一向伺服器驗證），
 *     手機網路下每頁數十次往返，開啟明顯變慢，故改為本策略。
 * CACHE_VERSION 僅在需要強制清除舊快取時修改。
 */
const CACHE_VERSION = 'clinical-tools-v190';

// 以相對路徑列出，方便部署於子路徑（如 GitHub Pages /clinical-scores/）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/nav.css',
  './css/antibiotics.css',
  './css/cancer-staging.css',
  './css/drug-database.css',
  './js/common.js',
  './js/nav.js',
  './js/pull-to-refresh.js',
  './js/search.js',
  './js/pixel-cat.js',
  './js/antibiotics.js',
  './js/drug-database.js',
  './js/cancer-staging.js',
  './js/gastric-pathway.js',
  './js/esoph-pathway.js',
  './js/breast-pathway.js',
  './js/crc-regimens.js',
  './js/crc-supplement.js',
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
  './js/thyroid-pathway.js',
  './data/antibiotics/antibiogram.js',
  './data/antibiotics/regimens.js',
  './data/antibiotics/drugs.js',
  './data/cancer/cancers.js',
  /* 藥物資料庫：index.js 是開頁即載的輕量索引，其餘 <pid>.js 是各藥理分類的
     完整藥卡，原本只在使用者展開某張卡時才注入 <script>。離線時網路取不到，
     故整批預先快取（合計約 3.4MB，是本清單最大的一塊）。
     日後新增藥理分類，data/drugs 多一個檔就要在這裡多一行。 */
  './data/drugs/index.js',
  './data/drugs/4.js',
  './data/drugs/6.js',
  './data/drugs/7.js',
  './data/drugs/9.js',
  './data/drugs/11.js',
  './data/drugs/12.js',
  './data/drugs/14.js',
  './data/drugs/15.js',
  './data/drugs/17.js',
  './data/drugs/20.js',
  './data/drugs/166.js',
  './data/drugs/196.js',
  './pathways/appendicitis.html',
  './pathways/cholecystitis.html',
  './pathways/hernia.html',
  './pathways/bowel-obstruction.html',
  './pathways/volvulus.html',
  './pathways/intussusception.html',
  './pathways/gi-ischemia.html',
  './pathways/gi-perforation.html',
  './pathways/diverticulitis.html',
  './pathways/pancreatitis.html',
  './pathways/nsti.html',
  './pathways/abdominal-trauma.html',
  './pathways/gi-bleeding.html',
  './pathways/iah-acs.html',
  './pathways/esophageal-emergency.html',
  './pathways/sepsis.html',
  './pathways/ards.html',
  './tools/emergency-surgery.html',
  './tools/air.html',
  './tools/antibiotics.html',
  './tools/spectrum-database.html',
  './tools/surgical-prophylaxis.html',
  './tools/trauma-abx.html',
  './tools/drug-database.html',
  // 急重症處置
  './tools/acls.html',
  './tools/rsi.html',
  './tools/acs.html',
  './tools/heart-failure.html',
  './tools/stroke.html',
  './tools/pe.html',
  './tools/alvarado.html',
  './tools/ami.html',
  './tools/angers.html',
  './tools/apache.html',
  './tools/cancer.html',
  './tools/cci.html',
  './tools/cci-clavien.html',
  './tools/cha2ds2-vasc.html',
  './tools/candida-score.html',
  './tools/child-pugh.html',
  './tools/classifications.html',
  './tools/aas.html',
  './tools/iah.html',
  './tools/meld.html',
  './tools/marshall.html',
  './tools/millet.html',
  './tools/gbs.html',
  './tools/rockall.html',
  './tools/aims65.html',
  './tools/oakland.html',
  './tools/lrinec.html',
  './tools/fgsi.html',
  './tools/mpi.html',
  './tools/p-possum.html',
  './tools/parc.html',
  './tools/pss.html',
  './tools/grace.html',
  './tools/syntax.html',
  './tools/wells-pe.html',
  './tools/geneva.html',
  './tools/perc.html',
  './tools/periop-anticoag.html',
  './tools/vte-risk.html',
  './tools/pulp.html',
  './tools/radial.html',
  './tools/sofa.html',
  './tools/news2.html',
  './tools/ards.html',
  './tools/rox.html',
  './tools/sort.html',
  './tools/nela.html',
  './tools/nutrition-risk.html',
  './tools/vasopressor.html',
  './tools/wassmer.html',
  './tools/wses.html',
  // 首頁方磚圖：第一屏內容，離線時不能缺
  './assets/hub/emergency.jpg',
  './assets/hub/antibiotics.jpg',
  './assets/hub/cancer.jpg',
  './assets/hub/sofa.png',
  './assets/hub/critical.jpg',
  './assets/hub/drugdb.jpg',
  // 癌別方磚：原先靠實際瀏覽時逐張快取，沒點過的癌別離線就開天窗，故一併預先快取
  './assets/organs/esoph.png',
  './assets/organs/gastric.png',
  './assets/organs/colorectal.png',
  './assets/organs/anal.png',
  './assets/organs/appendix.png',
  './assets/organs/hcc.png',
  './assets/organs/cca.png',
  './assets/organs/panc.png',
  './assets/organs/gist.png',
  './assets/organs/net.png',
  './assets/organs/lung.png',
  './assets/organs/breast.png',
  './assets/organs/gyn.png',
  './assets/organs/uro.png',
  './assets/organs/thyroid.png',
  './assets/organs/hnc.png',
  './assets/organs/npc.png',
  './assets/organs/sts.png',
  './assets/organs/heme.png',
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

/* 下拉更新：向伺服器逐檔查證後通知頁面重新載入，用於立即取得最新版。
   用 no-cache 而非 reload：兩者都必定問過伺服器，但 no-cache 帶 ETag，
   未更動的檔案回 304、幾乎不耗流量；reload 則整包重抓。
   清單已含藥物資料庫等大檔（合計約 9MB），reload 會讓每次下拉都重載一次全站。 */
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'REFRESH') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(PRECACHE_URLS.map((u) =>
      fetch(u, { cache: 'no-cache' })
        .then((res) => (res && res.status === 200) ? cache.put(u, res) : null)
        .catch(() => null)          // 個別檔案失敗不影響其餘
    ));
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: 'REFRESHED' }));
  })());
});
