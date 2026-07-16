# cancer-staging.html — `CANCERS` 條目欄位 Schema

本文件記錄 `data/cancer/cancers.js`（`window.CANCERS`）中每一筆癌症條目的欄位定義，
以 `js/cancer-staging.js` 內 `renderStage`／`renderMatrix`／`tnmTable`／`renderNode`／
`renderTx`／`renderRefs`／`showDetail` 實際讀取的欄位為準（2026-07 盤點）。
`CANCERS` 為陣列，每一筆元素為一個癌症物件，欄位如下：

## 基本識別

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `id` | string | 必要 | 唯一識別碼，`showDetail(id)`／`switchTab(id,tab)`／`CANCERS.find` 查找鍵，亦用於 `onclick` inline 呼叫參數。 |
| `zh` | string | 必要 | 中文名稱，顯示於選癌卡片與詳情頁標題。 |
| `en` | string | 必要 | 英文名稱，顯示於卡片與標題旁的 `<span class="oct-en">`。 |
| `group` | string | 必要 | 分類群組（如 `消化系 GI`），`renderPicker` 依此分組；顯示順序由 `js/cancer-staging.js` 內 `GROUP_ORDER` 常數決定，未列在 `GROUP_ORDER` 的群組會附加在後。 |
| `edition` | string | 必要 | 分期版本徽章文字（如 `AJCC 8th（2017）`），顯示於 `.onc-edition`。 |
| `staging_note` | string | 選填 | 分期補充說明，存在時顯示於「分期 TNM」頁籤最上方 `<p class="onc-note">`。 |

## 分期 TNM（`renderStage` / `tnmTable`）

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `t` | `[code, desc][]` | 必要 | T 分期（原發腫瘤）列表，`tnmTable` 逐列渲染為 `<tr><td>code</td><td>desc</td></tr>`；空陣列時該表不輸出。 |
| `n` | `[code, desc][]` | 必要 | N 分期（區域淋巴結）列表，格式同上。 |
| `m` | `[code, desc][]` | 必要 | M 分期（遠處轉移）列表，格式同上。 |

分期組合三選一以上（`renderStage` 邏輯：`matrices` → `matrix` 擇一渲染；**`stages` 為獨立區塊，可與矩陣並存**）：

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `matrices` | object[] | 三選一 | **多張** T×N 矩陣變體。用於同一癌別因判別軸（年齡／組織型態／部位／有絲分裂速率）而有數張官方分期表者（甲狀腺、GIST、膽管癌、NET）。渲染為選擇器＋當前變體之矩陣。優先於 `matrix`。 |
| `matrix_axis` | string | 有 `matrices` 時必要 | 選擇器標題，須指名真正的判別軸（如「解剖部位 Anatomic site」「年齡 Age at diagnosis」）。 |
| `matrix` | object | 三選一 | 單一 T×N 分期矩陣（見下）。 |
| `stages` | `[stage, criteria, note?][]` | 三選一 | 分期組合簡表。**不與矩陣互斥**：GIST（AJCC TNM ＋ AFIP 風險分級）、HCC（AJCC ＋ BCLC）兩者並存，各自回答不同問題。分期欄僅在代碼可於 `STAGE_RANK` 解析時著色並附圖例（BCLC／風險分級／WHO grade 不著色）。 |
| `staging_system` | string | 選填 | 非 TNM 系統之名稱與版本（如「FIGO 2021（子宮頸癌）」「BCLC 2022 update」）。顯示於 `stages` 表上方。 |
| `stages_title` | string | 選填 | `stages` 區塊之標題，預設「分期組合 Stage Grouping」。與矩陣並存時用來區分（如「風險分級 Risk stratification」）。 |

`matrix` 物件子欄位（`renderMatrix(mx)` 讀取；`matrices[]` 之每個變體同此結構，另加 `key`／`label`／`note`）：

| 子欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `key` | string | `matrices` 內必要 | 變體識別碼，同一癌別內不得重複。 |
| `label` | string | `matrices` 內必要 | 選擇器按鈕文字。**會經 `escapeHtml`**，故 `<55` 請寫原始 `<`，勿寫 `&lt;`（否則雙重轉義）。 |
| `note` | string | 選填 | 該變體之說明（何以自成一表），顯示於矩陣上方；不經轉義，可含 HTML。 |
| `ncols` | `[code, sublabel][]` | 必要 | 欄標題（N 分期），`sublabel` 為選填的第二行小字（如淋巴結顆數範圍），空字串則不顯示 `<span>`。 |
| `trows` | `string[]` | 必要 | 列標題（T 分期代碼），與 `cells` 逐列對應。 |
| `cells` | `string[][]` | 必要 | 矩陣內容，`cells[i][j]` 對應 `trows[i]` × `ncols[j]` 的分期代碼字串；依 `STAGE_RANK` 對照著色（`shadeClass`）。**必須為矩形**：列數 = `trows` 長度、每列欄數 = `ncols` 長度。 |
| `mrows` | `[Mcode, stage, desc?][]` | 選填 | **M 列**：接在 T 列之後、橫跨所有 N 欄（M1 分期與 T／N 無關），使 stage IV 出現在表格上而非僅存於註腳。依 `STAGE_RANK` 著色。 |
| `m1` | string | 選填 | M1 附註列，顯示於矩陣下方 `.sm-m1`（可含 HTML）。**僅放 `mrows` 未涵蓋之資訊**（如 Tis N0 M0 → 0 期、N1mi 分組規則）。 |

> 表格選擇與查證規範（含來源歸屬、交叉比對要求）見
> `.claude/skills/ntuh-cancer-pathway/references/staging-tables.md`。

## 淋巴結分群（`renderNode`）

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `node_note` | string | 選填 | 淋巴結分群說明，存在時顯示於「淋巴結分群」頁籤最上方 `<p class="onc-note">`。 |
| `nodes` | `[code, name_zh, group?][]` | 選填 | 淋巴結站別列表；`code`＝站別代碼、`name_zh`＝中文（可含英文對照）名稱、`group`（陣列第 3 項，選填）＝分群標籤（如 `D1`／`N3`），存在時顯示為 `<span class="node-group">`。無此欄位或空陣列時該頁籤僅顯示 `node_note`（若有）。 |

## 治療建議（`renderTx`）

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `tx` | `{role, cls, label, html}[]` | 選填 | 治療策略卡片列表，依陣列順序渲染；無此欄位或空陣列時「治療建議」頁籤為空白。 |

`tx` 陣列元素子欄位：

| 子欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `role` | string | 必要 | 角色徽章文字（如 `手術`、`術後輔助`、`轉移`），顯示於 `.tx-role`。 |
| `cls` | string | 必要 | CSS class，決定左側色條與徽章底色；目前用值：`neo`（術前輔助）、`surg`（手術）、`adj`（術後輔助）、`sys`（全身性／轉移治療）。 |
| `label` | string | 必要 | 卡片標題（如「早期（I–II，可切除）」），顯示於 `.tx-label`。 |
| `html` | string | 必要 | 卡片內文，可含 HTML（`<b>`、`<span class="rx">`、`<span class="drug">`、`<ul><li>` 等），原樣插入 `.tx-body`，不經 `escapeHtml`。 |

## 主要文獻（`renderRefs`）

| 欄位 | 型別 | 必要 | 說明 |
|---|---|---|---|
| `refs` | `[label, url][]` | 選填 | 參考文獻列表；無此欄位或空陣列時不顯示文獻區塊。`label`＝顯示文字（會經 `escapeHtml`）、`url`＝連結網址（不逸出，需為合法 URL 字串）。 |

`url` 慣例上以 `data/cancer/cancers.js` 檔案內建的兩個 helper 產生：

- `PM(pmid)` → `'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/'`（PubMed 文章直連）。
- `PS(query)` → `'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(query)`（PubMed 搜尋查詢）。

`PM`／`PS` 定義於 `data/cancer/cancers.js` 檔案開頭（`window.CANCERS` 陣列字面量在解析當下即呼叫兩者組出
`refs` 的 URL 字串），並非渲染期依賴的全域函式；`js/cancer-staging.js` 不需要、也未定義這兩者。

## 資料來源與相依全域變數

`renderPicker`／`showDetail`／`switchTab`／`renderStage` 等函式依賴以下由
`data/cancer/cancers.js` 掛載於 `window` 的全域資料（純 `<script src>`，無 ES module／fetch，
供 `file://` 離線開啟）：

- `window.CANCERS` — 本文件描述的癌症物件陣列（`data/cancer/cancers.js`）。

以下常數／函式定義於 `js/cancer-staging.js`（非資料，渲染邏輯的一部分）：

- `GROUP_ORDER` — 選癌清單分組顯示順序。
- `STAGE_RANK` / `shadeClass` — 分期矩陣依分期深淺著色的對照表與函式。

## 驗證

`schema/validate_cancers.py` 會讀取 `data/cancer/cancers.js`，解析每一筆 `CANCERS` 條目
（含 `PM(...)`／`PS(...)` helper 呼叫，會先在解析器內還原為對應字串），檢查本文件列出之
必要欄位是否存在、`matrix`／`stages`／`nodes`／`tx`／`refs` 等欄位的型別是否符合上述定義，
並印出每一筆發現的問題（無問題則印出 0 錯誤摘要）。
