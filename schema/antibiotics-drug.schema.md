# antibiotics.html — `DRUGS` 藥卡欄位 Schema

本文件記錄 `data/antibiotics/drugs.js`（`window.DRUGS`）中每一筆藥物條目的欄位定義，
以 `js/antibiotics.js` 內 `renderDrugCard(k)` 實際讀取的欄位為準（2026-07 盤點）。
每個 key（如 `piptazo`）對應一個藥物物件，欄位如下：

## 基本識別

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `name` | string | 必要 | 英文學名，藥卡標題主要顯示名。 |
| `zh` | string | 選填 | 中文名。缺省時標題不顯示中文名 span。 |
| `en` | string | 選填 | 部分條目用於次要英文名／補充顯示（`renderRegimen`／`renderDrugCard` 的 fallback 顯示名來源之一）。 |
| `cls` | string | 必要 | 藥物分類（如 `Extended-spectrum penicillin/BLI`）。 |
| `brands` | string[] | 選填（無 `ntuhProducts` 時建議提供） | 台灣／國際商品名清單（舊 schema 遺留欄位，作為 `ntuhProducts` 缺省時的 fallback）。 |
| `ntuhProducts` | `{en, zh}[]` | 選填 | 台大醫院藥劑部商品名清單，每筆含英文商品名 `en`、中文品名 `zh`（可皆有或僅一），為 `brands` 的升級版來源，藥卡「商品名／單隻劑量」欄優先使用。 |
| `vialDose` | string | 選填 | 單隻／單瓶含量描述（隨 `ntuhProducts` 合併顯示於「商品名／單隻劑量」欄）。 |

## 劑量

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `usualDose` | string | 二擇一 | 常用劑量（新 schema 欄名）。與 `dose` 二擇一，`renderDrugCard` 以 `d.usualDose||d.dose` 取值，欄位標題亦隨之顯示「常用劑量」或「劑量（成人）」。 |
| `dose` | string | 二擇一 | 舊 schema 的成人劑量欄位；新條目請改用 `usualDose`。 |
| `peds` | string | 選填 | 兒科劑量。 |
| `maxDose` | string | 選填 | 每日／每劑最大劑量。 |

## 器官功能調整

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `renal` | `{k, v}[]` 或 string | 選填 | 腎功能調整。陣列時渲染為表格（`k`=CrCl 分層或條件、`v`=建議劑量）；字串時以純文字顯示（向後相容舊條目）。 |
| `hepatic` | string | 選填 | 肝功能調整。 |
| `dialysis` | string | 選填 | 透析（HD／PD）劑量。 |
| `cvvh` | string | 選填 | CVVH／CRRT 劑量。 |

## 注射給藥指引（僅注射劑填寫；口服藥不設此欄）

`injection` 為物件，缺省則藥卡不顯示此欄位：

| 子欄位 | 型別 | 說明 |
|---|---|---|
| `route` | string | 給藥途徑（如「間歇輸注 IF」）。 |
| `reconstitute` | string | 溶解液。 |
| `diluent` | string | 稀釋液。 |
| `volume` | string | 每劑體積。 |
| `conc` | string | 給藥濃度。 |
| `time` | string | 輸注時間。 |
| `notes` | string | 注意事項（配伍禁忌等）。 |

以上子欄位皆為選填字串，`renderDrugCard` 逐一以 `row(t,v)` 判斷有值才輸出對應 `<tr>`。

## 其他臨床資訊

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `preg` | string | 選填 | 懷孕藥品分級（如 `'B'`、`'C'`），顯示為 `Category {preg}`。 |
| `bioav` | string | 必要（現存條目皆有） | 口服生體可用率 Bioavailability。 |
| `dist` | string | 必要（現存條目皆有） | 分布／組織穿透 Distribution。 |
| `metab` | string | 必要（現存條目皆有） | 代謝途徑。 |
| `adverse` | string | 必要（現存條目皆有） | 常見併發症／副作用。 |
| `contra` | string | 必要（現存條目皆有） | 禁忌與警示（以警示樣式 `dc-warn` 顯示）。 |
| `spectrum` | string | 選填 | 抗菌譜與備註之自由文字；與 `abg` 搭配或取代顯示於「抗菌譜與備註」欄（`d.spectrum||d.abg` 判斷是否顯示此欄框架，欄內容為 `d.spectrum` 文字 + `abgSpectrum(d)` 產生的在地感受性徽章）。 |

## 台大在地感受性徽章（antibiogram）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `abg` | `{sec, col}[]` | 選填。指向 `window.ABG` 的區段（`sec`，如 `gram_negative`）與該區段內的藥物欄位鍵（`col`，如 `TZP`）。`abgSpectrum(d)` 依此列出該藥於對應區段「所有」菌種的 %S 徽章。 |
| `abgProxy` | string | 選填。當本藥無直接資料、借用同類藥物的感受性資料代表時，於徽章說明文字標註「以 {abgProxy} 為同類代表」。 |

## 抗菌／抗黴覆蓋旗標

| 欄位 | 型別 | 說明 |
|---|---|---|
| `cov` | object | 選填。鍵為覆蓋類別（抗菌：`mrsa`／`pseudo`／`anaerobe`／`atypical`／`esbl`／`enterococcus`；抗黴：`candida`／`glabkrusei`／`aspergillus`／`mucor`／`fusarium`／`histo`／`blasto`／`cocci`，視 `covSet` 而定）。**四級值**：`2`=強效／台大在地%S≥90（亮＋粗框 sy-hi）、`1`=涵蓋／80–89（亮 yes）、`'p'`=部分／變異／60–79（琥珀 partial）、`0` 或缺該鍵=不涵蓋／<60（暗掉＋刪除線 no）。分級以台大在地 %S 優先，缺在地資料者依文獻 spectrum。用於藥卡標題徽章列（`covStrip`）。空物件 `{}` 會顯示整列暗掉（代表不涵蓋任何紅旗類別，如第一代 cephalosporin）。 |
| `covSet` | `'fungal'` 或缺省 | 選填。等於 `'fungal'` 時，`covStrip` 改用 `window.COV_LABELS_FUNGAL`（8 類）標籤組；否則使用 `window.COV_LABELS`（抗菌 6 類）。 |
| `catLabel` | string | 選填。設定後 `covStrip` 只顯示這一個類別標籤（如 `'抗結核'`／`'抗病毒'`），不顯示六／八旗標——用於六旗標無意義的藥（anti-TB／antiviral）。與 `cov` 互斥（`catLabel` 優先）。 |

## 資料來源與相依全域變數

`renderDrugCard`／`covStrip`／`abgSpectrum` 依賴以下由 `data/antibiotics/*.js` 掛載於
`window` 的全域資料（純 `<script src>`，無 ES module／fetch，供 `file://` 離線開啟）：

- `window.DRUGS` — 本文件描述的藥物物件集合（`data/antibiotics/drugs.js`）。
- `window.COV_LABELS`、`window.COV_LABELS_FUNGAL`、`window.SITES`、`window.BACTERIA`、`window.ROLE_TXT`
  （`data/antibiotics/regimens.js`）。
- `window.ABG`、`window.ABG_ORG_LABEL`、`window.ABG_AB_LABEL`、`window.BAC_ABG`
  （`data/antibiotics/antibiogram.js`，台大 2025 上半年抗生素感受性資料）。

## 驗證

`schema/validate_drugs.py` 會讀取 `data/antibiotics/drugs.js`，解析每一筆 `DRUGS` 條目，
檢查本文件列出之必要欄位是否存在、`renal`／`injection`／`ntuhProducts`／`abg`／`cov` 等欄位
的型別是否符合上述定義，並印出每一筆發現的問題（無問題則印出 0 錯誤摘要）。
