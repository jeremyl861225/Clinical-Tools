# data/ — 站台資料檔與它們從哪裡來

> 這裡的檔案都是「掛在 `window` 上的 JS」或 JSON，頁面直接載入。**不要手改由管線產生的檔**，
> 改管線重跑（管線都在 `../workspace/`，見各列）。手寫檔改完先 `node --check`，再跑 `python3 schema/check_pages.py`。

| 檔案 | 內容 | 誰產生它 | 誰讀它 | 離線 |
|---|---|---|---|---|
| `facets.js` | 造句導覽的詞表（s／c／a）、`tools` 登錄簿（150 標的）、`classif`、`lex` | 手寫；新頁用 `schema/new_page.py` 補條目 | 每一頁的 `js/sentence-nav.js` | precache |
| `antibiotics/drugs.js` | `window.DRUGS`，162 支抗微生物藥卡（台大藥劑部欄位） | 手寫 ＋ `workspace/scripts/*.py` 就地 patch（讀 `workspace/ntuh-dump/` 的台大 HTML 快取）；欄位規範 `schema/antibiotics-drug.schema.md`，`validate_drugs.py` 驗 | `tools/antibiotics.html`、首頁查詢、造句導覽 | precache |
| `antibiotics/regimens.js` | `SITES`（依部位）、`BACTERIA`（依病原菌）、`COV_LABELS*`、`ROLE_TXT` | 手寫 | 同上 | precache |
| `antibiotics/antibiogram.js` | `window.ABG` 等，台大 2026H1 感受性報表 175 菌列 | 由 `ntuh-antibiogram-2026H1.json` **手工**轉成 JS（沒有腳本） | `tools/antibiotics.html`、`tools/spectrum-database.html` | precache |
| `ntuh-antibiogram-2025H1.json`、`ntuh-antibiogram-2026H1.json` | 從台大檢醫部 PDF 抽出的原始表 | `workspace/` 的抽取腳本 | **沒有頁面讀**（來源存檔） | 否 |
| `ntuh-drug-database.json` | 早期 57 支藥的台大資料 | 早期抓取 | **沒有頁面讀**（來源存檔，已被 `drugs/` 取代） | 否 |
| `beta-lactamase-and-cr-gnb-spectrum.json` | 菌譜資料庫的來源表 | 手工整理 | **沒有頁面讀**（`spectrum-database.html` 內嵌了自己的表） | 否 |
| `cancer/cancers.js` | `window.CANCERS`（30 癌別）＋ `CANCER_FAMILIES` | 依 `ntuh-cancer-pathway` skill 手寫；`schema/cancer.schema.md`、`validate_cancers.py`、`check_cancer_wiring.py` | `tools/cancer.html`、首頁查詢、側欄癌別清單 | precache |
| `drugs/index.js` | `window.DRUGDB_INDEX`，2,623 筆藥卡索引（台大 1,450／非台大 1,011／抗生素 162） | **只由** `workspace/work/public-drug-db/scripts/merge_index.py` 定稿（三來源合併＋讓位：abx ＞ ntuh ＞ ext；被讓位者記在 `out/index-dropped.json`）。`build_cards.py` 與 `build_ext_cards.py` 也會寫它，但跑完任何一支都必須再跑 `merge_index.py` | `tools/drug-database.html`、首頁查詢、造句導覽（打兩個字才懶載） | precache |
| `drugs/<數字>.js` | 台大處方集藥卡，數字＝台大 PharmacologyId（4 止痛、5 精神、6 神經、7 麻醉、8 骨關節、9 心血管、10 營養電解質、11 血液、12 內分泌、13 抗過敏、14 呼吸、15 腸胃、16 免疫疫苗、17 抗腫瘤、19 泌尿、20 解毒、21 診斷、22 耳鼻喉、23 皮膚、24 牙科、25 眼科、26 其他、438 放射性藥、457 酵素…） | `workspace/work/drugcards/build_cards.py --pid N`（讀 `work/ntuh-scraper/ntuh-drug-db.json`；抓取要在台大院內網域） | `js/drug-database.js` 展開藥卡時才載（`DrugCard.loadPid`）；癌症流程模組的「本路徑用到的藥」也用它 | precache（展開才載，`check_pages` 抓不到漏列，故 `check_pages` 另驗「`data/drugs/*.js` 全在 precache」） |
| `drugs/x-<羅馬數字>.js` | 非台大處方的藥卡，依台大藥理大類（I…XXIII）分片 | `workspace/work/public-drug-db/scripts/build_ext_cards.py --top "<大類>"`；台大有的成分不准建（`check_ntuh_precedence.py`） | 同上 | precache |
| `drugs/abx.js` | 由抗生素頁衍生的 162 張藥卡 | `workspace/work/public-drug-db/scripts/build_abx_cards.py`，輸入是**瀏覽器 dump** 的 `window.DRUGS/ABG…`（`raw/ntuh_abx_dump.json`），不是直接讀 `drugs.js` —— 改了 `antibiotics/drugs.js` 就要重做 dump、重跑本檔與 `merge_index.py`，否則藥物資料庫停在舊版 | 同上 | precache |
| `drugs/extras.js` | 手寫覆寫層（以八碼為鍵） | 手寫 | `js/drug-database.js` | precache |
| `drugs/images.js` | 藥品外觀照片網址（外連台大，圖不進 repo） | `workspace/work/ntuh-drug-images/probe_codes.py`（新分類匯入後要跑） | 同上 | precache |
| `drugs/crush-ext.js` | 剝半磨粉（openFDA 仿單） | `workspace/work/public-drug-db/scripts/build_crush_external.py` | 同上 | precache |
| `ddi/index.json` | 1,111 藥／113,561 配對的索引（4.9 MB，shard=400） | `workspace/work/ddi/`：`harvest_ddinter.py` → `map_cards.py`（**讀本 repo `data/drugs/*.js` 的學名**做對映）→ `crawl_details.py`（可續跑）→ `harvest_food_dis.py` → `build_site_data.py`，再整個 `site/data/ddi` 複製進來（步驟在 `work/ddi/RESUME.md`）。`data/drugs` 任何新卡都要重跑，否則新卡在交互作用查不到、藥卡沒有飲食交互作用欄 | `js/ddi.js` | precache |
| `ddi/t/<n>.js`（29 片）、`ddi/r/<n>.js`（11 片） | 配對明細、文獻 | 同上 | 展開配對／按「文獻」才載 | **刻意不進 precache**（12 MB；離線時該組未快取會載不到） |
| `ddi/food-cards.js` | 飲食交互作用（以學名為鍵，0.9 MB） | 同上 | `tools/drug-database.html` | precache |

## 三條不變量

1. `drugs/index.js` 只由 `merge_index.py` 定稿；重建任何 `<pid>.js` 或 `x-*.js` 之後一定再跑它，不然先前讓位給抗生素卡的條目會回到索引。
2. `antibiotics/drugs.js` 改了 → 重做 dump → `build_abx_cards.py` → `merge_index.py` → DDI 四步；`abx.js`／`index.js`／`ddi/`／`food-cards.js` 都已在 precache，不必加行，但要 bump `CACHE_VERSION`。
3. `data/ddi/` 任何檔案換版都要 bump `CACHE_VERSION`（`ddi.js` 對 `index.json` 用 force-cache 疊在 SW 上，忘了 bump 會一直看到舊索引）。

## 換感受性報表期別時要動的地方

`ntuh-antibiogram-<期>.json`（新來源）→ `antibiotics/antibiogram.js`（手工轉）→ `antibiotics/drugs.js` 的 `cov` 四級與 `abg` 欄 →
`tools/spectrum-database.html` 內嵌的 `NTUH_S` 表 → `drugs/abx.js` 重跑 → 各頁「2026H1」字樣（grep 舊期別確認為 0）。
