# 臨床工具箱 — 程式架構與維護手冊

> 給下一個要改這個 repo 的人（或下一個 Claude session）。2026-09-04 架構審查後寫成；
> 這裡只寫「不看程式碼就不知道」的事。逐頁的臨床內容規範在各 skill
> （`clinical-tools-builder`、`ntuh-cancer-pathway`、`ntuh-antibiotic-card`）。

## 1. 不變的原則

- **靜態、離線優先的 PWA**：沒有建置步驟、沒有框架、沒有 CDN。每一頁是一份自足的 HTML，
  部署就是 push 到 `main`（GitHub Pages）。所有頁面與資料都列在 `sw.js` 的 `PRECACHE_URLS`，
  `cache.addAll` **全有全無**——少一個檔，整站離線功能歸零。
- **網址不可變**：PWA 書籤、`js/backlink.js` 的返回堆疊、造句導覽的 `?sent=` 連結都以路徑與 `k` 為鍵。
  不搬檔、不改檔名、不改 `k`；要換名字改顯示文字。
- **繁體中文為主、英文並列**；台大院內資料（藥卡、感受性報表、診療指引、健保）優先於外部資料庫。
- **`sw.js` 與 `index.html` 是多個 session 同時在改的熱檔**：改前重讀、只動自己那幾行、
  只 `git add` 自己碰過的檔，永遠不要 `git add -A`。

## 2. 目錄地圖

| 路徑 | 角色 |
|---|---|
| `index.html` | 首頁：六張方磚＋三個分類區（腹部急症／急重症處置／計分工具）的 108 張卡片、首頁路由、計分區篩選。側欄與全站查詢都從這裡的 DOM 建清單。 |
| `tools/`、`pathways/` | 119 個頁面。**資料夾不代表型別**（`pathways/` 裡有多分頁的用藥指引）；型別由 `data/facets.js` 的 `kind` 決定，見 §4。 |
| `js/` 共用層 | `nav.js` 側欄、`backlink.js` 返回來源頁、`search.js` 全站查詢（只有首頁載）、`searchbar.js` 查詢欄行為、`ui-mode.js` 主題切換、`sentence-nav.js` 造句導覽（每頁載）、`common.js` 流程圖 helper（pathways 載）、`pull-to-refresh.js`。頁面不要自己重做這些事。 |
| `js/*-pathway.js` | 30 支癌症治療流程模組（給 `tools/cancer.html`），另 `crc-regimens.js`／`crc-supplement.js` 供結直腸共用、`pnet-pathway.js` 由 `net` 內嵌。 |
| `js/antibiotics.js`、`drug-database.js`、`ddi.js`、`cancer-staging.js`、`ekg-waveforms.js`、`orca.js`、`pixel-cat.js` | 各自那一頁的程式。 |
| `css/` | `styles.css` 正式版（貓咪主題）基底 → `ui-sentence.css` 造句設計（預設主題，全部規則在 `[data-ui="sentence"]` 之下）→ 頁面自己的 `<style>`。級聯順序見 §5。其餘四支是單頁專用。 |
| `data/` | 純資料檔（掛在 `window` 上的 JS 或 JSON），見 `data/README.md`。`facets.js` 是造句導覽的詞表＋登錄簿。 |
| `schema/` | 驗證器、頁面模板、鷹架。收尾只要跑 `python3 schema/check_pages.py`。 |
| `assets/`、`icons/`、`manifest.webmanifest` | 圖版（方磚、器官）、PWA 圖示與設定。 |
| `../workspace/` | 素材與資料管線（不影響網站運作，可整包刪除）。抓取／蒸餾腳本在 `workspace/scripts/`、試做在 `workspace/work/`。 |

## 3. 一個頁面登錄在哪裡（五處＋派生表）

| # | 位置 | 誰讀它 | 守門的檢查 |
|---|---|---|---|
| 1 | `index.html` 的 `.tool-card#card-view-<k>`（含所在 section／分組、分組標頭的「N 項」） | `nav.js`、`search.js`、首頁路由（回首頁時展開該區並亮該卡） | `check_registry.py`：件數、onclick 契約、id 存在 |
| 2 | `data/facets.js` `"tools"` 陣列一筆（`k/name/en/desc/kind/href/sec/secTitle/secEn/grp/grpEn/s/c/a[/kw]`） | `sentence-nav.js` | `check_kinds.py`（kind）、`check_registry.py`（與 1 逐欄對帳、詞表） |
| 3 | `sw.js` `PRECACHE_URLS` 一行（頁面引用的新 css/js/data 也各一行） | Service worker | `check_pages.py` |
| 4 | 頁面自己的返回鍵 `../index.html#card-view-<k>` | 首頁路由 | `check_registry.py`（錨點必須存在） |
| 5 | **沒有首頁卡片的子頁**：`js/nav.js` `HUB_PAGES`（側欄）＋ `js/search.js` `SUB_PAGES`（查詢）＋ `schema/check_registry.py` `SUBHUB`（返回鍵該指哪張卡、掛哪個方磚） | 側欄、查詢 | `check_registry.py` |

派生表（新增**大類**或改**分組名**時才會碰到，都被 `check_registry.py` 對帳）：
`index.html` 路由的 `SECTIONS`、`sentence-nav.js` 的 `SECT_ORDER`／`TILE`／`TAB_PAGES`（有分頁列的頁）、
`ui-sentence.css` 以 `#view-<k>` 掛鉤的規則。

**卡片契約**（側欄與查詢靠這條 regex 讀，不符就靜默消失）：
`onclick="location.href='tools/xxx.html'"`（單引號、`.html` 結尾、不帶 `#`／`?`）、
`id="card-view-<k>"`、`.tool-name` 內中文放文字節點、英文放 `<span class="tool-en">`。

## 4. 三種頁面家族與型別判準

| `kind` | 徽章 | 判準 | 模板 |
|---|---|---|---|
| `tool` | 計分 | 輸入數值／勾選 → 分數或分級。**等於**首頁「計分工具」區（`sec=scores`），雙向成立。 | `schema/templates/tool.html` |
| `pathway` | 流程 | 一條互動決策路徑走到底才給結論，**不得有分頁列**；載 `js/common.js`（`flowShow/flowSelect/flowClearSel/flowRec`）。 | `schema/templates/pathway.html` |
| `guide` | 指引 | 整理型／多分頁參考頁；**只要有分頁列（`data-p=`／`data-tab=`／`class="tabbar"`）就是這一類**，無論檔案放哪。 | `schema/templates/guide.html` |
| `cancer`／`mega`／`mode` | 癌別／總站／模式 | `cancer.html` 的單一癌別；自帶查詢的入口頁；同一頁的進入模式。 | — |

有分頁列的頁面要同時：(a) 分頁按鈕是靜態 `<button data-p="id">`；(b) 頁面讀 `location.hash`；
(c) 把 `k` 加進 `sentence-nav.js` 的 `TAB_PAGES`（否則「說整句」查不到分頁；檢查器會擋）。

## 5. 共用層的規則

- **CSS 級聯**：`styles.css` → `ui-sentence.css` → 頁內 `<style>`。`ui-sentence.css` 靠 `[data-ui="sentence"]`
  多出的一階特異度壓過 `styles.css` 的同名規則，但**壓不過**頁內 `<style>`；所以頁面專屬 class 的造句設計版本
  要寫在該頁自己的 `<style>` 內、前綴 `[data-ui="sentence"]`。頁面不要用 inline `style=` 指定顏色（`ui-sentence.css`
  有 22 條 `[style*=…] !important` 在攔它）。深色結果面板底色寫死 `#132126`，不可用 `var(--ink)`。
- **兩個主題軸**：`data-ui`（sentence 預設／classic 貓咪，切換鈕在頁尾「找貓咪」）× `prefers-color-scheme`。
  `<head>` 內那段 inline boot 必須在 paint 前跑，不可 defer。
- **每頁的 `<head>` 與尾段**以 `schema/templates/_head.html`／`_tail.html` 為準（`check_registry.py` 驗順序）。
- **返回鍵不要自己寫**：`.back-stack` 內只放一顆「← 返回主選單」，`backlink.js` 依 `document.referrer` 自動插「← 返回來源頁」；
  h1 超過 14 字要給 `<body data-back-label>`。
- **子頁側欄更新會慢一輪**：子頁的 `nav.js` 抓的是 SW 快取版 `index.html`，新卡片要等背景更新後的下一次載入；驗收先在首頁看。

## 6. 子系統

- **癌症**（`tools/cancer.html`）：一個癌別要對齊五處——`data/cancer/cancers.js` 條目（`pathway:'<k>'`）、
  `js/<k>-pathway.js`（尾端匯出 `global.<k>PathwayHTML` 與 `global.init<K>Pathway`，**分派靠這條命名規則**，
  `cancer-staging.js` 的 `pathwayFn()` 不再逐支列舉）、`sw.js` precache（模組＋`assets/organs/<id>.png`）、
  `cancer-staging.js` 的 `ONC_TILE_IMG`、`facets.js` 的 `cancer-<id>`。模組**不由 `cancer.html` 靜態載入**：
  第一次點到該癌別的治療分頁時 `loadPathway()` 才注入，跨模組相依（結直腸要先有 crc-regimens／crc-supplement、
  NET 內嵌 pNET）寫在 `PATHWAY_DEPS`。全部由 `schema/check_cancer_wiring.py` 對帳（含「用到別支模組的匯出就必須列在
  PATHWAY_DEPS」）；模組內寫死的台大藥卡八碼由 `schema/check_drugcards.py` 對 `data/drugs/<pid>.js` 逐筆查證。
- **抗微生物家族**：`tools/antibiotics.html` 是子入口（依部位／依病原菌／藥物查詢三個模式＋分頁列連到
  菌譜資料庫、手術預防、創傷用藥、注射轉口服、輸注與相容性五頁）。這五頁沒有首頁卡片，登錄方式見 §3 第 5 列。
- **藥物資料庫／交互作用**：`tools/drug-database.html`（`data/drugs/`，一商品名一張卡）與 `tools/ddi.html`
  （`data/ddi/`，DDInter）。資料由 `workspace/` 的管線產生，**不要手改資料檔**，改管線重跑。

## 7. 離線與快取

- 策略是 stale-while-revalidate（先回快取、背景重抓）；**不要改回 network-first**（實測手機明顯變慢）。
- `CACHE_VERSION` 只在需要強制清舊快取時 bump（刪檔、改檔名、整批換新）；新增頁面只加 precache 行。
  慣例上目前每次改動都 bump，這一行也是 session 之間最常衝突的一行——改前重讀。
- 同一個 github.io origin 上還有其他 PWA：`activate` 只能刪 `clinical-tools-` 前綴的快取。
- 本機驗證前先清 SW 與 `caches`，再對改過的檔 `fetch(f, {cache:'reload'})` 灌回，否則測到的是舊檔。

## 8. 新增內容的流程

```bash
python3 schema/new_page.py --kind tool --k my-score --file tools/my-score.html \
  --name "中文名" --en "English Name" --desc "一句話說明（含指引來源）" \
  --sec scores --grp "重症 / 多器官功能" --s 病人整體 --a 算分數        # 先加 --dry-run 看片段
# → 產生頁面骨架、插首頁卡片並更新「N 項」、補 facets 條目、加 precache 並 bump 版號、跑檢查
#   接著填內容 → 瀏覽器實測（清 SW 三步）→ python3 schema/check_pages.py 回 0 問題
git add tools/my-score.html index.html data/facets.js sw.js && git commit && git push
```

沒有首頁卡片的子頁：不用鷹架，手動建頁後把它登錄進 `HUB_PAGES`／`SUB_PAGES`／`SUBHUB` 三處。
新癌別：照 `ntuh-cancer-pathway` skill，收尾跑 `check_pages.py`（含癌症接線與藥卡檢查）。

## 9. 檢查器一覽（`python3 schema/check_pages.py` 一次全跑）

| 腳本 | 管什麼 |
|---|---|
| `check_pages.py` | 每頁在 precache、九個必載檔＋inline boot、返回鍵在 `.back-stack`、頁首三件組、`data-back-label` |
| `check_kinds.py` | `facets.js` 的 `kind` 判準（scores ⇔ tool；有分頁列不可是 pathway） |
| `check_registry.py` | §3 的五處登錄與派生表逐欄對帳、`<head>` 順序、title 後綴、分頁數宣稱、詞表 |
| `check_cancer_wiring.py` | §6 癌症六處對帳 |
| `validate_cancers.py`／`validate_drugs.py` | `cancers.js`／抗生素 `drugs.js` 的欄位型別 |
| `check_drugcards.py` | 流程模組寫死的藥卡八碼 ↔ `data/drugs/<pid>.js` |
| `render_compare.py`（用 `cdp.py` 驅動本機 Chrome） | 重構前後的渲染比對：首頁五格清單、內頁造句軌跡、32 個癌別標的三分頁的 HTML。`snapshot <dir>` 兩次確認零差異，再改程式、再拍、`compare` |

## 10. 已知的架構債（2026-09-04 審查，需要決定才動）

- （2026-09-05 已修）分組計數改「範圍|群組」複合鍵；if-chain 改 `pathwayFn()` 命名規則；模組改延遲載入。
- 44 頁的內嵌 CSS 有 8 個元件家族逐字重複（`.kbox`、`.dg-*`…），但搬到共用檔要顧級聯位置，需渲染基準比對。
- `ui-sentence.css` 58% 是單頁專屬段落卻全站每頁載入（實測 CPU 成本小，是維護性問題）。
- 22 頁分頁列有四套寫法、24 支同形 Tab 函式；9 個 guide 頁的 eyebrow 仍寫 Clinical Decision Pathway。
- `.git/hooks/pre-commit` 整檔 `git add index.html`，會把別的 session 未提交的首頁修改掃進你的 commit。
