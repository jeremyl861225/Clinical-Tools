/* ============================================================
   大腸直腸癌化學治療處方 Colorectal Chemotherapy Regimens
   資料來源：國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引
   版次 21（2026/06/16 癌症醫療委員會修訂通過）
     · COL-10       輔助化療常用處方 Adjuvant chemotherapy
     · COL-11(1)(2) 晚期／轉移性疾病常用處方 Advanced or metastatic disease
     · COL-11(3)    HIPEC 處方 Regimens of HIPEC
   併參 台大醫院 大腸直腸癌治療藥物處方 版次 12（2026/06/16 癌委會檢視通過）。

   ※ 本檔為結腸癌與直腸癌「共用」之處方集：COL-10 之輔助處方於指引中即載明
     適用於結腸癌及直腸癌，COL-11 之轉移性處方亦由兩者共用（COL-8）。
     故獨立成模組，由 colon-pathway.js 與 rectal-pathway.js 共同呼叫，
     避免兩份流程各自維護一份而分岔。
   ※ 劑量與打法僅供參考，實際須由醫師依病人病情評估調整（指引原註）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }
  function d(n) { return '<span class="drug">' + n + '</span>'; }
  function r(n) { return '<span class="rx">' + n + '</span>'; }

  /* 指引於 COL-10 與 COL-11 兩處皆載之共同註記 */
  var DOSE_CAVEAT =
    '<div class="rx-def"><b>指引原註</b>：「以上處方劑量及打法僅供建議參考用，實際仍需視病人病情而定，' +
    '劑量及速率需由醫師評估後調整」。<b>溶液配製</b>：' + d('oxaliplatin') + ' 以 <b>D5W</b> 配製；' +
    '標靶藥物以 <b>0.9% NaCl</b> 配製（VEGF：' + d('bevacizumab') + '、' + d('ramucirumab') + '；' +
    'EGFR：' + d('cetuximab') + '、' + d('panitumumab') + '）。</div>';

  /* ================= COL-10 · 輔助化療 ================= */
  function adjuvantRegimens() {
    return '<details class="rx-more kps-details">' +
      '<summary>輔助化療處方與劑量 Adjuvant regimens（COL-10；適用於結腸癌及直腸癌）▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px;">' +
        '<div class="rx-panel-h">輔助化療常用處方<span class="rx-panel-src">COL-10</span></div>' +
        rxLine('（一）Oxaliplatin-based', '', [
          r('FOLFOX4') + '（Q2W × 12 循環）：' + d('oxaliplatin') + ' 85 mg/m² ＋ ' + d('LV') +
            ' 200 mg/m²／2 小時 D1；' + d('5-FU') + ' 400 mg/m² IV bolus D1 續 600 mg/m² 輸注 22 小時 D1；' +
            'D2 同 ' + d('LV') + ' 200 mg/m²／2 小時 ＋ ' + d('5-FU') + ' 400 bolus 續 600／22 小時。',
          r('FOLFOX6') + '（Q2W × 12 循環）：' + d('oxaliplatin') + ' 100 mg/m²（500 mL D5W）／2 小時 D1；' +
            d('LV') + ' 400 mg/m²／2 小時 D1；' + d('5-FU') + ' 400 mg/m² bolus 續 2400 mg/m²／46 小時。',
          r('mFOLFOX6') + '（Q2W × 12 循環）：' + d('oxaliplatin') + ' 85 mg/m² IV D1；' + d('LV') +
            ' 400 mg/m²／2 小時 D1；' + d('5-FU') + ' 400 mg/m² bolus D1 續 2400 mg/m²／46 小時。',
          r('mFOLFOX7') + '（Q2W × 12 循環）：' + d('oxaliplatin') + ' 85–100 mg/m²／2 小時 D1；' +
            d('LV') + ' 400 mg/m²／2 小時 D1；' + d('5-FU') + ' 2800–3000 mg/m²／44–46 小時。',
          r('Oxaliplatin-HDFL24') + '（Q3W × 6–8 循環）：' + d('oxaliplatin') +
            ' 60–65 mg/m²／2–4 小時 D1、D8；' + d('5-FU') + ' 2000–2600 mg/m² ＋ ' + d('LV') +
            ' 300 mg/m²／24 小時 D1、D8。',
          r('Oxaliplatin-HDFL48') + '（Q2W × 12 循環）：' + d('oxaliplatin') +
            ' 80–85 mg/m²／2–4 小時 D1；' + d('5-FU') + ' 2000–3000 mg/m² ＋ ' + d('LV') +
            ' 300 mg/m²／24–48 小時 D1。',
          r('XELOX') + '（Q3W × 8 循環）：' + d('oxaliplatin') + ' 85–130 mg/m² IV D1 ＋ ' +
            d('capecitabine') + ' 800–1250 mg/m² 每日兩次 D1–14。',
          r('XELOX2') + '（Q2W × 12 循環）：' + d('oxaliplatin') + ' 85 mg/m² IV D1 ＋ 連續 ' +
            d('capecitabine') + ' 800–1200 mg/m² 每日兩次 口服 週一至週五。'
        ]) +
        rxLine('（二）Fluorouracil-based', '', [
          r('LV5FU2') + '（Q2W）：' + d('LV') + ' 200 mg/m² 輸注 D1、D2；' + d('5-FU') +
            ' 400 mg/m² bolus D1、D2 續 600 mg/m²／22 小時 D1、D2。',
          r('Modified LV5FU') + '（Q2W）：' + d('LV') + ' 400 mg/m² 輸注 D1；' + d('5-FU') +
            ' 400 mg/m² IV D1 續 2400 mg/m²／46–48 小時。',
          r('LDFL') + '（每週 × 6 個月）：' + d('5-FU') + ' 450–550 mg/m² IV ＋ ' + d('LV') +
            ' 45–55 mg/m² IV D1。',
          r('HDFL') + '（每週 × 6 個月）：' + d('5-FU') + ' 2600 mg/m² IV ＋ ' + d('LV') +
            ' 300 mg/m² IV D1。'
        ]) +
        rxLine('（三）口服 Oral-UFT based', '', [
          d('Capecitabine') + '（Xeloda）800–1250 mg/m² 每日兩次 D1–14，每 3 週一次 × 24 週。',
          d('Uracil-Tegafur') + '（UFUR）300–350 mg/m²／日 × 4 週，可併 ' + d('leucovorin') +
            ' 30 mg 口服 tid × 4 週，休 1 週，Q5W × 5 循環；' +
            '<b>依健保規定必要時最長可用至 2 年</b>（COL-15 ref.9）。'
        ]) +
        rxLine('（四）臨床試驗 Clinical trial regimens', '', [
          '<b>台大醫院認為任何癌症之最佳處置為參與 IRB 核准之臨床試驗，並特別鼓勵參與。</b>'
        ]) +
        '<div class="rx-warn"><b>⚠ 除非參與臨床試驗，' + d('bevacizumab') + '／' + d('irinotecan') +
        '／' + d('panitumumab') + '／' + d('cetuximab') + ' 不建議用於輔助化療</b>' +
        '（COL-10 註 2；COL-3 註 c 同旨）。</div>' +
        DOSE_CAVEAT +
      '</div></details>';
  }

  /* ================= COL-11(1)(2) · 晚期／轉移性 ================= */
  function metastaticRegimens() {
    return '<details class="rx-more kps-details">' +
      '<summary>晚期／轉移性疾病處方與劑量 Advanced or metastatic regimens（COL-11(1)(2)）▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px;">' +
        '<div class="rx-panel-h">晚期／轉移性疾病常用處方<span class="rx-panel-src">COL-11(1)(2)</span></div>' +
        rxLine('（一）Oxaliplatin-based', '', [
          r('mFOLFOX6') + ' ±標靶（Q2W）：' + d('oxaliplatin') + ' 85 mg/m² IV D1；' + d('LV') +
            ' 400 mg/m²／2 小時（於 5-FU 前）D1；' + d('5-FU') + ' 400 mg/m² bolus D1 續 2400 mg/m²／46 小時。' +
            '<br>±' + d('bevacizumab') + ' 5 mg/kg IV D1　±' + d('cetuximab') +
            ' <b>首次輸注 400 mg</b>、其後每週 250 mg/m²　±' + d('panitumumab') + ' 6 mg/kg IV D1。',
          r('XELOX') + ' ±' + d('bevacizumab') + '（Q3W）：' + d('oxaliplatin') + ' 130 mg/m² IV D1 ＋ ' +
            d('capecitabine') + ' 850–1000 mg/m² 每日兩次 D1–14；±' + d('bevacizumab') + ' 7.5 mg/kg IV D1。',
          r('FOLFOX4') + '（Q2W）：' + d('oxaliplatin') + ' 85 mg/m² ＋ ' + d('LV') + ' 200 mg/m²／2 小時 D1；' +
            d('5-FU') + ' 400 mg/m² bolus D1、D2 續 600 mg/m²／22 小時 D1、D2；' + d('LV') +
            ' 200 mg/m²／2 小時 D2。',
          r('Oxaliplatin-HDFL24/48') + '（Q3W／Q4W）：' + d('oxaliplatin') +
            ' 60–85 mg/m²／2–4 小時 D1、D8（D15）；' + d('5-FU') + ' 2000–3000 mg/m² ＋ ' + d('LV') +
            ' 300 mg/m²／24–48 小時 D1、D8（D15）。'
        ]) +
        rxLine('（二）Irinotecan-based', '', [
          r('FOLFIRI') + ' ±標靶（Q2W）：' + d('irinotecan') + ' 150–180 mg/m² IV D1；' + d('LV') +
            ' 400 mg/m²／2 小時（於 5-FU 前）D1；' + d('5-FU') + ' 400 mg/m² IV D1 續 2400 mg/m²／46 小時。' +
            '<br>±' + d('bevacizumab') + ' 5 mg/kg D1　±' + d('ziv-aflibercept') + ' 4 mg/kg D1　±' +
            d('cetuximab') + ' 首次 400 mg、其後每週 250 mg/m²　±' + d('panitumumab') +
            ' 6 mg/kg D1 Q2W　±' + d('ramucirumab') + ' 8 mg/kg D1 Q2W。',
          r('FOLFOXIRI') + '（Q2W）：' + d('irinotecan') + ' 165 mg/m² D1、' + d('oxaliplatin') +
            ' 85 mg/m² D1、' + d('LV') + ' 400 mg/m² D1；' + d('5-FU') + ' 3200 mg/m²／48 小時。',
          r('Irinotecan-HDFL24/48') + '（Q3W／Q4W）：' + d('irinotecan') +
            ' 75 mg/m²／2–4 小時 D1、D8（D15）；' + d('5-FU') + ' 2000–3000 mg/m² ＋ ' + d('LV') +
            ' 300 mg/m²／24–48 小時 D1、D8（D15）。',
          d('Irinotecan') + ' 單方 ±抗 EGFR：100–125 mg/m²／2–4 小時 D1、D8 Q3W，' +
            '或 180 mg/m²／30–90 分鐘 D1 Q3W；±' + d('cetuximab') + ' 首次 400 mg、其後每週 250 mg/m²；±' +
            d('panitumumab') + ' 6 mg/kg Q2W。'
        ]) +
        rxLine('（三）Fluorouracil-based', '', [
          r('LV5FU2') + '（Q2W）：' + d('LV') + ' 200 mg/m² 輸注 D1、D2；' + d('5-FU') +
            ' 400 mg/m² bolus D1、D2 續 600 mg/m²／22 小時 D1、D2。',
          r('Modified LV5FU') + '（Q2W）：' + d('LV') + ' 400 mg/m² 輸注 D1；' + d('5-FU') +
            ' 400 mg/m² IV D1 續 2400 mg/m²／46–48 小時。',
          r('HDFL') + '（每週）：' + d('5-FU') + ' 2600 mg/m² IV ＋ ' + d('LV') + ' 300 mg/m² IV D1。'
        ]) +
        rxLine('（四）口服 Oral-UFT based', '', [
          d('Capecitabine') + '（Xeloda）±' + d('bevacizumab') + '（Q3W）：800–1250 mg/m² 每日兩次 D1–14；±' +
            d('bevacizumab') + ' 7.5 mg/kg IV D1。',
          r('XELIRI') + ' ±' + d('bevacizumab') + '（Q3W）：' + d('capecitabine') +
            ' 1000 mg/m² 每日兩次 D1–14 ＋ ' + d('irinotecan') + ' 100–125 mg/m² D1、D8；±' +
            d('bevacizumab') + ' 7.5 mg/kg IV D1。'
        ]) +
        rxLine('（五）Regorafenib', '', [
          d('Regorafenib') + ' 120–160 mg 口服 每日一次 D1–21，每 28 天一循環；' +
            '<b>前 4 週應每週密切監測不良反應</b>。'
        ]) +
        rxLine('（六）Trifluridine + tipiracil（TAS-102）', '', [
          d('Trifluridine/tipiracil') + ' <b>35 mg/m²（以 trifluridine 計）每日兩次</b>，' +
            'D1–5 及 D8–12，每 28 天一循環；<b>單次 trifluridine 上限 80 mg</b>。'
        ]) +
        rxLine('（七）免疫檢查點抑制劑 Checkpoint inhibitors', '<b>僅限 dMMR／MSI-H</b>', [
          d('Pembrolizumab') + ' 200 mg D1 輸注 Q3W。',
          d('Nivolumab') + ' 3 mg/kg D1 輸注 Q2W。',
          d('Nivolumab') + ' 3 mg/kg ＋ 低劑量 ' + d('ipilimumab') + ' 1 mg/kg Q3W（共 4 劑），' +
            '其後 ' + d('nivolumab') + ' 3 mg/kg Q2W。'
        ]) +
        rxLine('（八）BRAF 抑制劑', '<b>僅限 BRAF V600E 陽性</b>', [
          d('Encorafenib') + ' 300 mg 口服 每日一次 ＋ ' + d('cetuximab') +
            ' 首次 400 mg/m²、其後每週 250 mg/m²。'
        ]) +
        '<div class="rx-warn"><b>⚠ 抗 EGFR（' + d('cetuximab') + '／' + d('panitumumab') +
        '）僅適用於 <u>KRAS／NRAS 野生型</u></b>；已知 KRAS／NRAS 突變者不可使用（COL-8）。' +
        '<b>免疫治療之副作用與照護原則另見台大醫院「癌症免疫治療藥物照護原則」</b>（COL-11 註 3）。</div>' +
        DOSE_CAVEAT +
      '</div></details>';
  }

  /* ================= COL-11(3) · HIPEC ================= */
  function hipecRegimens() {
    return '<details class="rx-more kps-details">' +
      '<summary>HIPEC 處方 Regimens of HIPEC（COL-11(3)）▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px;">' +
        '<div class="rx-panel-h">腹腔高溫化學治療處方<span class="rx-panel-src">COL-11(3)</span></div>' +
        rxLine('藥物 · 劑量 · 灌注時間', 'Medication / Dose / Duration of HIPEC', [
          d('Oxaliplatin') + '　200–460 mg/m²　—　<b>30–60 分鐘</b>',
          d('5-FU') + '　650 mg/m²　—　<b>60–120 分鐘</b>',
          d('Mitomycin C') + '　15 mg/m²　—　<b>60 分鐘</b>',
          d('Cisplatin') + '　25 mg/m²　—　<b>60 分鐘</b>',
          d('Irinotecan') + '　100 mg/m²　—　<b>90 分鐘</b>'
        ]) +
        '<div class="rx-warn"><b>⚠ 註 a</b>：<b>積極之減積手術（cytoreductive debulking）及／或腹腔內化療，' +
        '於臨床試驗以外之情境並不建議</b>。<br><b>註 b</b>：<b>HIPEC 併理想減積手術屬選擇性術式</b>，' +
        '須依個別病人狀況與術者經驗決定。</div>' +
      '</div></details>';
  }

  global.crcAdjuvantRegimens = adjuvantRegimens;
  global.crcMetastaticRegimens = metastaticRegimens;
  global.crcHipecRegimens = hipecRegimens;

})(window);
