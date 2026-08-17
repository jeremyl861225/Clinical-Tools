/* ============================================================
   肝細胞癌治療互動決策流程 Hepatocellular Carcinoma Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全部重寫（第二版）。舊版（339 行，2026-07-18）已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 肝細胞癌診療指引
   （文件編號 50710-2-000008，版次 20；2026/06/16 第 87 次癌症醫療委員會修訂通過，共 8 頁）
   健保給付條文查詢日：2026-08-17（健保署藥品給付規定第 9 節）。

   ⚠ 流程結構依指引第 3 頁的決策圖**逐格 render PNG 判讀**，不是照文字順序：
     ① 第一個分岔是 **PVT／肝外轉移**，不是腫瘤數目 —— 和標準 BCLC 的走法不同。
     ② 「1–3／≥ 4 顆」只掛在 PVT(-) ＋ Child A,B。
     ③ 「Within／Beyond UCSF」只掛在 PVT(-) ＋ Child C —— 台大用的是
        **UCSF criteria 而不是 Milan criteria**。
     ④ 「≥ 4 顆」那一格**沒有 LT、沒有 PTA、沒有 EBRT**（最容易抄錯的地方）。
   ⚠ 第 4 頁 Figure 1 的箭頭有兩種語意，只讀文字抽不出來：
     **實線＝based on clinical trial data；灰虛線＝based on expert opinion**。
     從 sorafenib 出來的是實線（2L 試驗都是 post-sorafenib 做的）；
     從免疫組合與 lenvatinib 出來的都是虛線。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  /* ==========================================================
     0. 狀態
     ========================================================== */
  var S = {};
  var KEYS = [
    'scope',  // screen | dx | tx | sys | fu
    'risk',   // 監測族群：carrier | cirrhosis
    'dxc',    // 診斷條件：clin | path | none
    'ext',    // PVT／肝外轉移：neg | pos
    'cp',     // Child-Pugh：ab | c
    'num',    // 腫瘤數目（僅 neg + ab）：n13 | n4
    'ucsf',   // UCSF（僅 neg + c）：within | beyond
    'line',   // 全身治療線別：l1 | l2
    'prior',  // 第一線用過什麼（僅 l2）：io | sora | lenva
    'afp'     // AFP ≥ 400（僅 l2）：hi | lo
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/index.js 逐碼實跑核對）
     ⚠ 'AV 1CE89' 內含半形空白，任何環節都不可 trim。
     ========================================================== */
  var HC_DRUGS = [
    { key: 'sorafenib', cards: [['17', 'NEX4CE10', 'Nexavar 蕾莎瓦膜衣錠 200 mg']] },
    { key: 'lenvatinib', cards: [['17', 'LEN4CEP5', 'Lenvima 樂衛瑪膠囊 10 mg']] },
    { key: 'atezolizumab',
      cards: [['17', 'TEC1CEL9', 'Tecentriq 癌自禦注射劑 1200 mg/20 mL'],
              ['17', 'ATE1CEN5', 'Atezolizumab 注射劑 1200 mg/20 mL（專案）', 'atezolizumab']] },
    { key: 'bevacizumab',
      cards: [['17', 'AV 1CE89', 'Avastin 癌思停注射劑 100 mg/4 mL'],
              ['17', 'ALY1CH63', 'Alymsys 艾麥思注射劑 100 mg（生物相似藥）', 'bevacizumab']] },
    { key: 'durvalumab', cards: [['17', 'IMF1CES0', 'Imfinzi 抑癌寧注射劑 500 mg/10 mL']] },
    { key: 'tremelimumab', cards: [['17', 'IMJ1CH52', 'Imjudo 抑佳妥注射劑 300 mg/15 mL']] },
    { key: 'ipilimumab', cards: [['17', 'YER1CEI0', 'Yervoy 益伏注射劑 50 mg/10 mL']] },
    { key: 'nivolumab',
      cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑 20 mg/2 mL'],
              ['17', 'OPD1CEK8', 'Nivolumab 注射劑 100 mg/10 mL（專案）', 'nivolumab']] },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']] },
    { key: 'regorafenib', cards: [['17', 'STI4CEE2', 'Stivarga 癌瑞格膜衣錠 40 mg']] },
    { key: 'cabozantinib', cards: [['17', 'CAB4CES5', 'Cabometyx 癌必定膜衣錠 20 mg']] },
    { key: 'ramucirumab', cards: [['17', 'CYR1CEL4', 'Cyramza 欣銳擇注射劑 100 mg/10 mL']] },
    { key: 'doxorubicin',
      cards: [['17', 'DOX1CD29', 'Doxor 利癌凍晶注射劑 10 mg（FOR TAE 開方專用）', 'doxorubicin'],
              ['17', 'AD 1CD04', 'Adriamycin 艾黴素注射液 10 mg/5 mL', 'doxorubicin']],
      flag: 'TACE 用' }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="hccPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="hc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="hc-node" id="' + id + '">' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div></div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }

  function H(title, src) {
    return '<span class="rx-h">' + title + '</span>' + (src ? '　<span class="rx-sub">' + src + '</span>' : '');
  }
  function EV(t) { return '@ev ' + t; }
  function SUB(items) { return '<ul class="rec-sub"><li>' + items.join('</li><li>') + '</li></ul>'; }
  /* 否定句裡的藥名要包起來 —— 藥卡掃描是純字串比對。 */
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }

  function fold(summary, inner) {
    return '<details class="kps-details"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function foldRx(summary, inner) {
    return '<details class="kps-details rx-table"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function more() {
    var parts = [].slice.call(arguments).filter(Boolean);
    if (!parts.length) return '';
    return '<ul class="rec-detail rec-more"><li>' + parts.join('</li><li>') + '</li></ul>';
  }

  /* ==========================================================
     2. 共用參考區塊 —— 每一段只在這裡定義一次
     ========================================================== */

  /* 2a. 縮寫對照（指引第 3 頁自己附的那張表，逐字） */
  function abbrReference() {
    return fold('<b>縮寫對照</b>（指引第 3 頁所附）',
      '<table>' +
      '<tr><td><b>PVT</b></td><td>portal vein thrombosis　門脈血栓</td></tr>' +
      '<tr><td><b>PTA</b></td><td>percutaneous tumor ablation　經皮腫瘤消融</td></tr>' +
      '<tr><td><b>TACE</b></td><td>trans-catheter arterial chemoembolization　經導管肝動脈化學栓塞</td></tr>' +
      '<tr><td><b>LT</b></td><td>liver transplantation　肝臟移植</td></tr>' +
      '<tr><td><b>EBRT</b></td><td>external-beam radiotherapy　體外放射治療</td></tr>' +
      '<tr><td><b>SBRT</b></td><td>stereotactic body radiotherapy　立體定位放射治療</td></tr>' +
      '<tr><td><b>HAIC</b></td><td>hepatic arterial infusion chemotherapy　肝動脈灌注化學治療</td></tr>' +
      '<tr><td><b>SIRT</b></td><td>selective internal radiation therapy　選擇性體內放射治療</td></tr>' +
      '</table>');
  }

  /* 2b. 這張流程圖的六條註腳（逐字＋白話） */
  function notesReference() {
    return fold('<b>流程圖的六條註腳</b>（指引第 3 頁，逐字）',
      '<table>' +
      '<tr><td><b>1</b></td><td>「Depending on individual patient\'s tumor burden and functional reserve.」' +
      '<br>同一格裡列的那幾個選項<b>不是並列等價</b>，要看腫瘤負荷與肝功能儲備。</td></tr>' +
      '<tr><td><b>2</b></td><td>「Atezolizumab/bevacizumab, durvalumab/tremelimumab, ' +
      '<b>ipilimumab/nivolumab</b>, sorafenib or lenvatinib is recommended as <b>first-line</b> therapy. ' +
      'Regorafenib, cabozantinib, nivolumab, pembrolizumab, nivolumab with ipilimumab, or ' +
      '<b>ramucirumab (reserved for patients whose alpha-fetoprotein level ≥ 400 ng/mL)</b> is ' +
      'recommended as <b>second-line</b> therapy.」<br>' +
      '<b>版次 20 新增 ipilimumab ＋ nivolumab 到第一線</b>（原文紅字）。</td></tr>' +
      '<tr><td><b>3</b></td><td>「<b>HAIC should be reserved for liver-predominant disease.</b>」' +
      '<br>肝動脈灌注化療只用在<b>疾病以肝臟為主</b>的病人。</td></tr>' +
      '<tr><td><b>4</b></td><td>「In BCLC stage A/B：<b>EBRT may be considered when PTA inaccessible.</b> ' +
      'The choices of EBRT between SBRT and hypofractionated RT should be adjusted according to ' +
      'normal tissue safety. In BCLC stage C: EBRT may be considered as part of combined modality, ' +
      'for symptomatic palliation or when oligometastasis.」<br>' +
      '早期的放療是<b>消融搆不到時的替代</b>；晚期的放療是<b>合併治療的一部分、緩解症狀、' +
      '或寡轉移</b> —— 兩個定位完全不同。</td></tr>' +
      '<tr><td><b>5</b></td><td>「May consider systemic therapy when locoregional therapy unsuitable ' +
      'and presented with <b>diffuse, infiltrative, or extensive bilobar liver involvement</b>.」<br>' +
      '沒有血管侵犯也沒有肝外轉移的病人<b>要走全身治療，得符合這兩個條件</b>：' +
      '局部治療不適合，而且是瀰漫性、浸潤性或廣泛雙葉侵犯。</td></tr>' +
      '<tr><td><b>6</b></td><td>（版次 20 新增，原文紅字）「<b>TACE in combination with durvalumab plus ' +
      'bevacizumab or pembrolizumab plus lenvatinib or atezolizumab plus bevacizumab may be considered ' +
      'due to potential progression-free survival benefits.</b>」<br>' +
      '這是把 TACE 加上免疫組合的新做法；<b>指引的用字是「potential progression-free survival ' +
      'benefits」—— 講的是無惡化存活，不是整體存活。</b></td></tr>' +
      '</table>');
  }

  /* 2c. 診斷條件（指引第一段，逐字） */
  function dxReference() {
    return fold('<b>台大的 HCC 診斷條件</b>（版次 20 第 1 頁，逐字）',
      '<table>' +
      '<tr><td colspan="2"><b>符合下列條件（任一）即可診斷。</b></td></tr>' +
      '<tr><td><b>臨床診斷</b></td><td>「有<b>慢性肝炎或肝硬化或先前罹患過肝癌</b>的病人，' +
      '<b>tumor &gt; 1 cm</b>，及<b>一種</b>相符合的影像學檢查（CT／MRI／CEUS）。」<br>' +
      '❗<b>三個要件要同時成立</b>：背景肝病、腫瘤大於 1 cm、一種相符影像。' +
      '<b>只要一種影像就夠，不需要兩種。</b></td></tr>' +
      '<tr><td><b>病理診斷</b></td><td>「病理學或細胞學證實（手術或切片）。」</td></tr>' +
      '<tr><td><b>❗ 例外</b></td><td>「若腫瘤經開刀切除後，<b>正式病理報告顯示非肝細胞癌，則排除在外</b>。' +
      '如有特殊情形，可提至<b>肝癌團隊會議</b>討論。」</td></tr>' +
      '<tr><td><b>分期檢查</b></td><td>「CT／MRI／CEUS（任一）為主要之影像診斷分期依據，' +
      '<b>同時參考 Child-Pugh Score 及 Performance Status 以確認 BCLC 分期</b>。」<br>' +
      '也就是說 —— <b>影像決定腫瘤範圍，Child-Pugh 與體能決定分期落在哪一格。</b></td></tr>' +
      '</table>');
  }

  /* 2d. 全身治療的線別選單（Figure 1，含箭頭語意） */
  function sysReference() {
    /* ⚠ 這裡用 fold() 不是 foldRx()：藥卡掃描會讀所有 details.rx-table，
       而這張表列的是「整份選單」（含這位病人用不到的藥），不是他的處方。
       標成 rx-table 會讓 AFP < 400 的病人也長出一張 Cyramza 的卡。 */
    return fold('<b>晚期 HCC 的全身治療選單</b>（指引第 4 頁 Figure 1，逐字）',
      '<table>' +
      '<tr><td><b>第一線</b></td><td><b>Anti-PD1／PD-L1 combinations</b>（優先）' +
      '<br>「include but <b>not limited to</b> atezolizumab + bevacizumab, durvalumab + tremelimumab, ' +
      '<b>ipilimumab + nivolumab</b>, or other multikinase inhibitors plus PD1/PDL1 combination ' +
      'as deemed appropriate by the treating physician.」' +
      '<br>或 <b>sorafenib</b>／<b>lenvatinib</b>　或　<b>臨床試驗</b></td></tr>' +
      '<tr><td>❗ 順位</td><td>Figure 1 對 sorafenib 與 lenvatinib 標的註 2 是' +
      '<b>「If anti-PD1/PDL1 combinations not feasible or appropriate (i.e., contraindicated)」</b> —— ' +
      '<b>它們是免疫組合不能用時的替代，不是並列的首選。</b></td></tr>' +
      '<tr><td><b>第二線</b></td><td><b>Regorafenib</b>｜<b>Ramucirumab</b>（上方有 ' +
      '<b>AFP ≥ 400 ng/mL</b> 的閘門）｜<b>Cabozantinib</b>｜<b>Anti-PD1 or Anti-PD-L1</b>｜' +
      '<b>Nivolumab + Ipilimumab</b>　或　<b>臨床試驗</b></td></tr>' +
      '<tr><td><b>❗ 箭頭的<br>兩種語意</b></td><td>Figure 1 的圖例把箭頭分成兩種：' +
      '<b>實線黑箭頭 ＝ based on clinical trial data</b>；' +
      '<b>灰色虛線箭頭 ＝ based on expert opinion</b>。<br>' +
      '<b>從 sorafenib 出來的全部是實線</b>（RESORCE、REACH-2、CELESTIAL、KEYNOTE-394 ' +
      '都是在 sorafenib 之後做的）；<b>從免疫組合與從 lenvatinib 出來的全部是灰虛線</b>。<br>' +
      '<b>白話：第一線用了免疫組合或 lenvatinib 之後要接什麼，目前是專家意見，不是試驗證據。</b>' +
      '這一點在和病人討論二線時要講清楚。</td></tr>' +
      '<tr><td>副作用</td><td>指引第 5 頁：「相關免疫治療副作用及照護原則建議，請詳見參考' +
      '台大醫院<b>『癌症免疫治療藥物照護原則』</b>相關文件。」</td></tr>' +
      '</table>');
  }

  /* 2e. 局部與肝動脈治療的定位 */
  function locoReference() {
    return fold('<b>各種局部與肝動脈治療的定位</b>',
      '<table>' +
      '<tr><td><b>Resection</b><br>手術切除</td><td>出現在<b>三個</b>格子：PVT(-) Child A,B 的 1–3 顆與 ≥ 4 顆，' +
      '以及 <b>PVT(+)／肝外轉移 ＋ Child A,B 的 multi-modality therapy</b>（標註 1，看腫瘤負荷與肝功能儲備）。' +
      '<br>❗<b>台大指引沒有把「有血管侵犯就不能開刀」寫成禁忌</b> —— 它把切除留在晚期那一格的選項裡。</td></tr>' +
      '<tr><td><b>LT</b><br>肝臟移植</td><td>只出現在<b>兩個</b>格子：PVT(-) Child A,B 的 <b>1–3 顆</b>，' +
      '以及 PVT(-) <b>Child C 且符合 UCSF criteria</b>。<br>' +
      '❗<b>「≥ 4 顆」那一格沒有 LT。</b>' +
      '❗<b>台大用的是 UCSF criteria，不是 Milan criteria。</b></td></tr>' +
      '<tr><td><b>PTA</b><br>經皮消融</td><td>只出現在 PVT(-) Child A,B 的 <b>1–3 顆</b>。' +
      '<b>「≥ 4 顆」那一格沒有 PTA。</b></td></tr>' +
      '<tr><td><b>TACE</b></td><td>出現在 1–3 顆、≥ 4 顆，以及晚期的 multi-modality。' +
      '<b>版次 20 在前兩格加上「± Immunotherapy-based combination therapy」（註 6）。</b></td></tr>' +
      '<tr><td><b>EBRT／SBRT</b></td><td><b>BCLC A/B：消融搆不到（PTA inaccessible）時的替代</b>；' +
      'SBRT 與 hypofractionated RT 之間的選擇看正常組織安全性。<br>' +
      '<b>BCLC C：合併治療的一部分、症狀緩解，或寡轉移。</b><br>' +
      '❗<b>「≥ 4 顆」那一格沒有 EBRT</b>；但 Child C 且超出 UCSF 那一格<b>有</b> EBRT。</td></tr>' +
      '<tr><td><b>HAIC</b><br>肝動脈灌注</td><td><b>只用於 liver-predominant disease</b>（註 3）。' +
      '出現在 1–3 顆、≥ 4 顆與晚期 multi-modality。</td></tr>' +
      '<tr><td><b>SIRT</b></td><td>出現在 1–3 顆、≥ 4 顆與晚期 multi-modality。' +
      '<b>指引沒有為 SIRT 標任何註腳</b>，也就是沒有額外的限制條件。</td></tr>' +
      '<tr><td><b>Systemic</b></td><td>在 PVT(-) 的兩格都標<b>註 5</b>：要走全身治療，' +
      '得<b>局部治療不適合</b>且為<b>瀰漫性、浸潤性或廣泛雙葉侵犯</b>。<br>' +
      '在 PVT(+)／肝外轉移 ＋ Child A,B 那一格則標<b>註 1、2</b>，是 multi-modality 的第一項。</td></tr>' +
      '</table>');
  }

  /* 2f. 肝炎的處理 —— 台大指引特別點出來的一條 */
  function hepatitisReference() {
    return fold('<b>別忘了治 B 肝與 C 肝</b>（版次 20 第 2 頁）',
      '<table>' +
      '<tr><td colspan="2"><b>指引原文：「除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。」</b></td></tr>' +
      '<tr><td>為什麼<br>要寫進來</td><td>台灣的 HCC 以 B 型肝炎為主。' +
      '<b>抗病毒治療同時影響三件事</b>：肝功能儲備（決定病人走得到哪一格）、' +
      '新病灶的發生率、以及<b>免疫治療或化療期間的 B 肝再活化風險</b>。</td></tr>' +
      '<tr><td>❗ 缺口</td><td><b>台大 HCC 指引版次 20 只有上面那一句，沒有列出抗病毒藥的選擇、' +
      '起始時機、或治療期間的監測方式。</b>本頁不代為補指引沒有的內容；' +
      '請照會肝膽腸胃科，並依健保 B 肝／C 肝用藥條文辦理。</td></tr>' +
      '</table>');
  }

  /* 2g-1. 健保：第一線的選擇會決定有沒有健保二線 —— 這是本癌別最重要的一條 */
  function nhiOrderReference() {
    return fold('<b>❗ 第一線選哪一個，決定了有沒有健保二線</b>（第 9 節，查詢日 2026-08-17）',
      '<table>' +
      '<tr><td colspan="2"><b>健保的四個 HCC 一線藥「僅得擇一給付，不得互換」</b> —— ' +
      '同一句話寫在 9.34 第 2 項第(4)款、9.63 第 2 項第(3)款、9.69 第 2 項第(1)款 III 三處。<br>' +
      '四個是：<b>sorafenib</b>（9.34）、<b>lenvatinib</b>（9.63）、' +
      '<b>atezolizumab ＋ bevacizumab</b>（9.69）、<b>durvalumab ＋ tremelimumab</b>（9.69）。</td></tr>' +
      '<tr><td><b>選 sorafenib</b></td><td><b>✔ 二線標靶拿得到。</b>' +
      '9.34 沒有封鎖後線的條文；<b>regorafenib（9.51）與 ramucirumab（9.92）的條文都逐字要求' +
      '「曾接受 sorafenib 治療失敗後」</b>。</td></tr>' +
      '<tr><td><b>選 lenvatinib</b></td><td><b>✘ 二線標靶拿不到。</b>' +
      '<b>9.63 第 2 項第(3)款明文：lenvatinib 治療失敗後不得申請 regorafenib 或 ramucirumab。</b></td></tr>' +
      '<tr><td><b>選免疫組合<br>（atezo＋bev<br>或 STRIDE）</b></td><td><b>✘ 二線標靶也拿不到。</b>' +
      '<b>9.69 第 2 項第(1)款 IV（114/2/1）：治療失敗後不得申請 regorafenib 或 ramucirumab。</b></td></tr>' +
      '<tr><td><b>❗ 這代表什麼</b></td><td><b>台大指引把免疫組合列為第一順位（Figure 1 註 2），' +
      '但健保上只要用了免疫組合或 lenvatinib，健保的二線標靶就沒有了</b> —— ' +
      '二線只剩自費或臨床試驗。<b>指引的順位與健保的順位在這一格互相拉扯，' +
      '這件事必須在第一線就和病人講清楚。</b><br>' +
      '本頁不替你決定要走哪一邊 —— 這是價值判斷（先用最有效的一線，' +
      '還是保留健保二線的路），請與病人共同決定並提肝癌多專科團隊討論。</td></tr>' +
      '<tr><td><b>二線也是擇一</b></td><td><b>regorafenib、ramucirumab、nivolumab 三者' +
      '「僅能擇一使用，不得互換」</b>（9.51 3.(4)／9.92 3.／9.69 1.(8)III）。' +
      '9.69 那一句多了「<b>且治療失敗時</b>不可互換」，適用整個 ICI 類。</td></tr>' +
      '<tr><td><b>還有一條容易漏</b></td><td><b>9.69 第 3 項第(4)款：ICI「無效後或給付時程期滿後' +
      '則不再給付該適應症相關之標靶藥物」。</b>一線免疫組合的併用本身是明文除外，' +
      '<b>但這句的後半段沒有除外 —— 2 年期滿或無效之後，該適應症的標靶藥也不再給付。</b></td></tr>' +
      '</table>');
  }

  /* 2g-2. 健保條文全文（藥品給付規定第 9 節） */
  function nhiReference() {
    return fold('<b>健保藥品給付規定</b>（第 9 節；查詢日 2026-08-17）',
      '<table>' +
      '<tr><td colspan="2"><b>四個一線藥的適應症條件完全對稱</b>：' +
      '<b>Child-Pugh A</b>，加上<b>肝外轉移／大血管侵犯／TACE 失敗</b>三者之一。' +
      '<b>「TACE 失敗」條文有量化定義：需提供 12 個月內 ≥ 3 次局部治療的紀錄</b> —— ' +
      '只做過 1–2 次不算失敗。</td></tr>' +
      '<tr><td><b>9.34</b><br>sorafenib</td><td>一線。<b>每日至多處方 4 粒</b>。' +
      '需事前審查；初次療程 3 個月，之後每 3 個月評估，送審檢附影像，無惡化方可續用。<br>' +
      '<b>沒有封鎖後線的條文 —— 這是它和 lenvatinib 最大的差別。</b></td></tr>' +
      '<tr><td><b>9.63</b><br>lenvatinib</td><td>一線，適應症條件與 sorafenib 逐字相同。<br>' +
      '❗<b>第 2 項第(3)款：治療失敗後不得申請 regorafenib 或 ramucirumab。</b><br>' +
      '<b>HCC 段落沒有每日粒數上限條文</b>（與 sorafenib／regorafenib 的「每日至多 4 粒」不同）—— ' +
      '不要自行補上。</td></tr>' +
      '<tr><td><b>9.69</b><br>atezolizumab<br>＋ bevacizumab</td><td>' +
      '一線（IMbrave150），<b>112/8/1 起、114/2/1 修訂</b>，事審代碼 <b>P072</b>；' +
      '<b>HCC 不需檢附 PD-L1 報告</b>。<br>' +
      '每次申請 <b>12 週</b>；<b>給付時程自初次處方用藥日起算 2 年</b>。<br>' +
      '<b>atezolizumab 單用於 HCC 未給付。</b></td></tr>' +
      '<tr><td><b>9.69</b><br>durvalumab<br>＋ tremelimumab</td><td>' +
      '一線（STRIDE），<b>114/2/1 起</b>納入，事審代碼 P072、不需 PD-L1。' +
      '條件與 atezo＋bev 完全對稱。<br>' +
      '<b>durvalumab 單用於 HCC 未給付；tremelimumab 只有這一個適應症。</b></td></tr>' +
      '<tr><td><b>❗ 一線免疫組合<br>的三項排除</b></td><td>9.69 第 2 項第(1)款 II：' +
      '<b>①曾接受器官移植 ②正在接受免疫抑制藥物治療 ' +
      '③有上消化道出血之疑慮且未接受完全治療（須有半年內之內視鏡評估報告）。</b><br>' +
      '<b>第三項等於要求治療前先做胃鏡把食道胃變異血管處理掉</b> —— ' +
      '這一條健保有明文，不是院外慣例。</td></tr>' +
      '<tr><td><b>9.51</b><br>regorafenib</td><td>二線。' +
      '<b>條文逐字寫「曾接受 sorafenib 治療失敗後」</b> —— ' +
      'lenvatinib 失敗、免疫組合失敗都不符合。<br>' +
      '<b>每日至多處方 4 粒</b>；初次療程 12 週，之後每 8 週評估。</td></tr>' +
      '<tr><td><b>9.92</b><br>ramucirumab</td><td>二線，' +
      '<b>這是 ramucirumab 在健保唯一的適應症（胃癌未給付）</b>。' +
      '三個門檻：<b>sorafenib 失敗後 ＋ AFP ≥ 400 ng/mL ＋ Child-Pugh A</b>。<br>' +
      '初次療程 12 週，之後每 8 週評估。</td></tr>' +
      '<tr><td><b>9.69</b><br>nivolumab<br>（二線單用）</td><td>' +
      '❗<b>對新病人實質已關閉</b>：1.(8)V 限「<b>109 年 4 月 1 日前經審核同意用藥、' +
      '後續評估符合續用申請條件者</b>」。<br>' +
      '其條件另含 Child-Pugh A、<b>12 個月內 ≥ 3 次 TACE 失敗</b>、至少一線標靶失敗、' +
      '未曾肝移植；初次申請須另檢附 T.A.C.E. 治療紀錄。</td></tr>' +
      '<tr><td><b>完全沒給付</b></td><td>' + NR('pembrolizumab') + '（HCC 一線併用與二線單用都沒有；' +
      'KEYNOTE-394、LEAP-002、LEAP-012 都無條文）、' + NR('cabozantinib') + '（9.74 只有腎細胞癌與甲狀腺癌）、' +
      NR('ipilimumab') + '（HCC 無條文，nivolumab ＋ ipilimumab 一線與二線皆未給付）、' +
      '<b>術後輔助 atezolizumab ＋ bevacizumab（IMbrave050）</b>、' +
      '<b>TACE 併 ICI／TKI 的組合（EMERALD-1、LEAP-012）</b>、' +
      '<b>SIRT（釔-90）</b>。<br>' +
      '❗<b>Child-Pugh B 的病人，健保沒有任何全身性治療條文。</b></td></tr>' +
      '<tr><td><b>療效評估</b></td><td>❗<b>HCC 用 mRECIST，不是 iRECIST</b>' +
      '（9.69 3.(8)、3.(9)II：「以 i-RECIST 標準（<b>HCC 患者以 mRECIST 標準</b>）評定」）。<br>' +
      '<b>影像評估的給付範圍不包括 PET</b>（9.69 3.(7)IV、3.(9)II）。</td></tr>' +
      '<tr><td><b>SD 能不能<br>續用</b></td><td>❗同樣是疾病穩定（SD），命運不同：' +
      '<b>atezolizumab、pembrolizumab、durvalumab、tremelimumab 連續二次評估皆為 SD 者，' +
      '不得申請續用</b>（3.(8)IV）；<b>nivolumab、avelumab、ipilimumab、cemiplimab 的 SD 可以繼續用藥</b>' +
      '（3.(8)I）。<b>一線 atezo＋bev 與 STRIDE 都被前面那一條綁住。</b></td></tr>' +
      '<tr><td><b>其他門檻</b></td><td>9.69 3.(2)II 的肝指數門檻（GOT／GPT < 60、' +
      'T-bilirubin < 1.5）<b>晚期 HCC 與膽道癌免除</b>；<b>但腎功能沒有免除</b>' +
      '（Creatinine < 1.5 且 eGFR > 60），另加 <b>ECOG ≤ 1</b> 與 <b>NYHA Class I 或 II</b>。</td></tr>' +
      '<tr><td><b>行政陷阱</b></td><td>9.69 4.(1)：醫事機構須於 <b>28 天內</b>於 VPN 登錄結案，' +
      '<b>逾期系統自動結案，且不予支付該個案自前次事前審查核定日後申報之藥費。</b></td></tr>' +
      '</table>');
  }

  /* 2g-3. 局部治療的健保：走特材與診療項目，不在藥品給付規定內 */
  function nhiLocoReference() {
    return fold('<b>局部治療的健保怎麼算</b>（走特材與診療項目，不是藥品給付規定）',
      '<table>' +
      '<tr><td colspan="2"><b>TACE、RFA、放療的費用不在「藥品給付規定」裡</b> —— ' +
      '它們走「醫療服務給付項目及支付標準」與「醫療特殊材料」。以下是特材條文查到的內容。</td></tr>' +
      '<tr><td><b>RFA／微波消融</b><br>特材 E210-2／3／4</td><td>' +
      '<b>依腫瘤大小分三級</b>：<b>&lt; 2 cm</b>（RF 單針，支付價 18,800）、' +
      '<b>2–&lt; 4 cm</b>（30,080）、<b>≥ 4 cm 且單一腫瘤</b>（45,120，<b>須事前審查</b>）。<br>' +
      '<b>前兩級要求腫瘤數目 ≤ 3 顆。</b>' +
      '<b>微波探針與 RF 針共用同一分類碼與同一支付價</b>；同次治療只能申報一種針具。<br>' +
      '<b>條文把「肝臟機能狀態」交給專科醫師個案認定，沒有寫 Child-Pugh 或 BCLC 門檻。</b></td></tr>' +
      '<tr><td><b>載藥微球<br>DEB-TACE</b><br>特材 I203-33</td><td>' +
      '<b>114/8/1 起給付</b>（HepaSphere、Terumo LifePearl，支付價 49,590 元／瓶）。<br>' +
      '❗<b>這是唯一把 BCLC 分期與 ALBI grade 寫進條文的 HCC 健保規定</b>：' +
      '<b>限 BCLC stage B、ALBI grade ≥ 2，且「最大腫瘤直徑(cm) ＋ 腫瘤總顆數 ≥ 11」。</b><br>' +
      '<b>這是「up-to-11」的反向條件 —— 腫瘤負荷要夠大才給付。</b><br>' +
      '<b>終身最多 3 次、每次 1 瓶</b>，與可吸收性栓塞微粒球擇一，' +
      '<b>術者需通過台灣介入放射線學會的載藥微球栓塞術認證</b>。' +
      '事前審查欄位為「否」，但需檢附 CT／MRI／血管攝影報告。</td></tr>' +
      '<tr><td><b>一般 TACE<br>的栓塞材</b></td><td>' +
      '<b>可吸收性栓塞微粒球（I203-22，2,691 元／瓶，114/12/1 生效）</b>明文對應診療項目' +
      '<b>33144B「血管阻塞術-Lipiodol」</b>的 HCC TACE，每次限 1 瓶，與 DEB 微球擇一。<br>' +
      '❗<b>同樣叫「微粒球」，Embosphere（I203-14）的備註逐字「排除肝癌」</b> —— ' +
      '一個限肝癌、一個排除肝癌，開單時要看清分類碼。</td></tr>' +
      '<tr><td><b>SIRT（釔-90）</b></td><td>❗<b>特材資料庫查無釔-90 品項（TheraSphere／SIR-Spheres）' +
      '→ 健保未給付，屬自費。</b><br>' +
      '<b>台大指引把 SIRT 列在三個格子的選項裡，但這是自費項目</b> —— ' +
      '和病人討論時要先講費用。</td></tr>' +
      '<tr><td><b>❗ 查不到的部分</b></td><td>' +
      '<b>TACE／RFA／SBRT 的診療項目條文本次取不到。</b>' +
      'info.nhi.gov.tw 只有藥品給付規定（INAE3000）與特材（INAE2000）兩個可查的 API，' +
      '「醫療服務給付項目及支付標準」沒有可查的 API。<br>' +
      '<b>因此 33075B（血管栓塞術）、33144B（血管阻塞術-Lipiodol）、' +
      '以及 SBRT 用於 HCC 的健保條文，本頁沒有逐字依據，不代為補寫。</b>' +
      '需要時請查健保署支付標準原文。</td></tr>' +
      '</table>');
  }

  /* 2g. 追蹤 */
  function followupHTML(kind) {
    var head = '<div class="fu-h">接下來怎麼追蹤</div>';
    if (kind === 'screen') {
      return head + '<ul class="fu-list">' +
        '<li><b>B 型肝炎表面抗原或 C 型肝炎抗體陽性者：每 6–12 個月</b>一次 AFP ＋ ' +
        '超音波或 CT／MRI。</li>' +
        '<li><b>已確診肝硬化的病人：每 3–6 個月</b>一次 AFP ＋ 超音波或 CT／MRI；' +
        '<b>而一年兩次作 PIVKA-II 檢查</b>。</li>' +
        '<li>❗<b>兩個族群的間隔不一樣，PIVKA-II 只寫在肝硬化那一組。</b></li>' +
        '<li><b>同時要治療慢性 B 型或 C 型肝炎。</b></li></ul>';
    }
    if (kind === 'post') {
      return head + '<ul class="fu-list">' +
        '<li><b>完成所有治療後 3 個月內</b>應接受一次 AFP 及影像學檢查（超音波或 CT／MRI）。</li>' +
        '<li><b>1 年內應接受 ≥ 3 次</b> AFP 及影像學檢查。</li>' +
        '<li><b>一年兩次作 PIVKA-II 檢查。</b></li>' +
        '<li>「所有治療」的定義（註一）包含<b>手術切除、局部消融治療、肝臟移植、TACE、' +
        '放射治療和其他治療（如肝動脈化療、化學治療、標靶治療、免疫治療等）</b>。</li>' +
        '<li><b>除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。</b></li>' +
        '<li>發現復發 → 回步驟 1 重選，依 PVT／肝外轉移與 Child-Pugh 走一次。</li></ul>';
    }
    return head + '<ul class="fu-list">' +
      '<li><b>完成所有治療後 3 個月內</b>一次 AFP ＋ 影像；<b>1 年內 ≥ 3 次</b>；' +
      '<b>一年兩次 PIVKA-II</b>。</li>' +
      '<li><b>仍應治療慢性 B 型或 C 型肝炎。</b></li>' +
      '<li>如有其他特殊狀況，<b>須經肝癌多專科團隊討論後取得治療共識</b>（指引第 5 頁）。</li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function hccPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院肝細胞癌診療指引</b>（文件編號 50710-2-000008，版次 20，' +
      '2026/06/16 第 87 次癌症醫療委員會修訂通過）編成的互動決策流程。' +
      '<b>第 3 頁的決策圖與第 4 頁的 Figure 1 都已 render 成圖片逐格核對</b>，' +
      '不是照文字順序重排。<br>' +
      '⚠<b>這張圖的第一個分岔是「有沒有門脈血栓或肝外轉移」，不是腫瘤數目</b> —— ' +
      '和一般熟悉的 BCLC 走法不同，請照著點。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是註腳原文、治療定位、' +
      '全身治療選單與健保條文。</p>';
    h += '<div class="onc-path" id="hccPath">';

    h += node0('hc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'screen', '還沒有肝癌，是高危險群要安排監測', 'B／C 肝帶原或肝硬化') +
      opt('scope', 'dx', '影像發現肝臟病灶，要先確認是不是肝細胞癌', '台大的診斷條件') +
      opt('scope', 'tx', '已確診肝細胞癌，要決定治療', '照第 3 頁的決策圖走') +
      opt('scope', 'sys', '要決定全身性治療用什麼', '第 4 頁 Figure 1') +
      opt('scope', 'fu', '治療已完成，要安排追蹤', ''));

    /* ── A. 高危險群監測 ── */
    h += '<div id="hc_b_screen" class="hidden">';
    h += node('hc_n_risk', '2', '這位病人屬於哪一種高危險群？（版次 20 第 2 頁）',
      opt('risk', 'carrier', 'B 型肝炎表面抗原或 C 型肝炎抗體陽性，但還沒有肝硬化', '') +
      opt('risk', 'cirrhosis', '已確診肝硬化', '間隔更密，而且要加 PIVKA-II'));
    h += recBox('hc_r_risk', '建議處置 · 監測排程');
    h += fuBox('hc_f_screen');
    h += '</div>';

    /* ── B. 診斷 ── */
    h += '<div id="hc_b_dx" class="hidden">';
    h += node('hc_n_dxc', '2', '目前符合哪一項診斷條件？（版次 20 第 1 頁）',
      opt('dxc', 'clin', '臨床診斷成立', '有慢性肝炎／肝硬化／曾患肝癌 ＋ 腫瘤 > 1 cm ＋ 一種相符影像') +
      opt('dxc', 'path', '病理或細胞學已證實', '手術或切片') +
      opt('dxc', 'none', '兩項都還不成立', '例如病灶 ≤ 1 cm，或沒有背景肝病'),
      dxReference());
    h += recBox('hc_r_dxc', '建議處置 · 診斷與分期檢查');
    h += fuBox('hc_f_dx');
    h += '</div>';

    /* ── C. 治療（第 3 頁決策圖）── */
    h += '<div id="hc_b_tx" class="hidden">';
    h += node('hc_n_ext', '2', '有沒有門脈血栓（PVT）或肝外轉移？（這是決策圖的第一個分岔）',
      opt('ext', 'neg', 'PVT(−)，也沒有肝外轉移', '') +
      opt('ext', 'pos', 'PVT(+)，或有肝外轉移', ''),
      abbrReference());
    h += node('hc_n_cp', '3', 'Child-Pugh 分級是哪一級？',
      opt('cp', 'ab', 'Child-Pugh A 或 B', '') +
      opt('cp', 'c', 'Child-Pugh C', ''));
    h += node('hc_n_num', '4', '肝內腫瘤幾顆？',
      opt('num', 'n13', '1–3 顆', '選項最多的一格：切除／移植／消融都在這裡') +
      opt('num', 'n4', '≥ 4 顆', '沒有移植、沒有消融、沒有放療'));
    h += node('hc_n_ucsf', '4', '符合 UCSF criteria 嗎？（台大用 UCSF，不是 Milan）',
      opt('ucsf', 'within', '符合 UCSF criteria', '') +
      opt('ucsf', 'beyond', '超出 UCSF criteria', ''));
    h += recBox('hc_r_tx', '建議處置 · 這一格可以做什麼');
    h += fuBox('hc_f_tx');
    h += '</div>';

    /* ── D. 全身治療（第 4 頁 Figure 1）── */
    h += '<div id="hc_b_sys" class="hidden">';
    h += node('hc_n_line', '2', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', ''));
    h += node('hc_n_prior', '3', '第一線用的是什麼？（這一步決定二線的證據強度）',
      opt('prior', 'sora', 'Sorafenib', '二線的隨機試驗都是在 sorafenib 之後做的') +
      opt('prior', 'io', 'Anti-PD1／PD-L1 免疫組合', '之後接什麼屬專家意見') +
      opt('prior', 'lenva', 'Lenvatinib', '之後接什麼屬專家意見'));
    h += node('hc_n_afp', '4', 'AFP 是多少？（決定 ramucirumab 用不用得上）',
      opt('afp', 'hi', 'AFP ≥ 400 ng/mL', '') +
      opt('afp', 'lo', 'AFP < 400 ng/mL', ''));
    h += recBox('hc_r_sys', '建議處置 · 全身性治療');
    h += fuBox('hc_f_sys');
    h += '</div>';

    /* ── E. 追蹤 ── */
    h += '<div id="hc_b_fu" class="hidden">';
    h += recBox('hc_r_fu', '建議處置 · 治療後追蹤');
    h += fuBox('hc_f_fu');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="hccReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="hc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="hc_drugs"></div>';
    return h;
  }

  /* ==========================================================
     4. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }

  function collapseAll() {
    var root = el('hccPath');
    if (!root) return;
    root.querySelectorAll('.hc-node').forEach(function (n) {
      if (n.id !== 'hc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['hc_b_screen', 'hc_b_dx', 'hc_b_tx', 'hc_b_sys', 'hc_b_fu'].forEach(function (id) { show(id, false); });
  }

  function liOf(t) {
    if (t.indexOf('@ev ') === 0) return '<li class="ev">' + t.slice(4) + '</li>';
    if (t.indexOf('<span class="rx-h">') === 0) return '<li class="hd">' + t + '</li>';
    return '<li>' + t + '</li>';
  }

  function fill(id, cls, title, lines, src, extra) {
    var e = el(id);
    if (!e) return;
    var label = e.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置';
    e.className = 'flow-rec ' + cls;
    e.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') +
      (src ? '<div class="rec-note">' + src + '</div>' : '');
  }

  function fu(id, kind) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = followupHTML(kind);
  }

  /* ==========================================================
     5. 各分支
     ========================================================== */

  /* ---------- A. 高危險群監測 ---------- */
  function renderScreen() {
    show('hc_b_screen', true);
    show('hc_n_risk', true);
    if (!S.risk) return;

    var L = [], title;
    if (S.risk === 'carrier') {
      title = 'B 型肝炎表面抗原或 C 型肝炎抗體陽性，尚無肝硬化<br>→ 每 6–12 個月一次 AFP ＋ 影像';
      L.push(H('排程', '版次 20 第 2 頁'));
      L.push('<b>每 6–12 個月作一次 AFP 和超音波，或 CT／MRI。</b>');
      L.push(EV('這一組<b>沒有寫 PIVKA-II</b> —— PIVKA-II 只寫在已確診肝硬化那一組。'));
    } else {
      title = '已確診肝硬化<br>→ 每 3–6 個月一次 AFP ＋ 影像，另加一年兩次 PIVKA-II';
      L.push(H('排程', '版次 20 第 2 頁'));
      L.push('<b>每 3–6 個月作一次 AFP 和超音波，或 CT／MRI。</b>');
      L.push('<b>而一年兩次作 PIVKA-II 檢查。</b>');
      L.push(EV('間隔比帶原者密一倍，而且多一個腫瘤標記 —— ' +
        '<b>「已確診肝硬化」這件事本身就把追蹤強度往上調一級。</b>'));
    }
    L.push(H('同時要做的事', '版次 20 第 2 頁'));
    L.push('<b>治療慢性 B 型或 C 型肝炎。</b>' +
      '指引把這件事和 HCC 的處理並列，不是附帶。');
    L.push(H('影像上看到病灶的話', '版次 20 第 1 頁'));
    L.push('<b>回步驟 1 選第二項，先確認診斷條件是否成立</b> —— ' +
      '台大的臨床診斷要三個要件同時成立：背景肝病、<b>腫瘤 &gt; 1 cm</b>、一種相符影像。');

    fill('hc_r_risk', 'rec-elective', title, L,
      '台大肝細胞癌診療指引版次 20，第 2 頁「三、肝細胞癌高危險群追蹤」。',
      more(dxReference(), hepatitisReference()));
    fu('hc_f_screen', 'screen');
  }

  /* ---------- B. 診斷 ---------- */
  function renderDx() {
    show('hc_b_dx', true);
    show('hc_n_dxc', true);
    if (!S.dxc) return;

    var L = [], cls = 'rec-elective', title;

    if (S.dxc === 'clin') {
      title = '臨床診斷成立<br>→ 不需切片也可以開始治療，接著做分期';
      L.push(H('診斷已經成立', '版次 20 第 1 頁'));
      L.push('<b>「有慢性肝炎或肝硬化或先前罹患過肝癌的病人，tumor &gt; 1 cm，' +
        '及一種相符合的影像學檢查（CT／MRI／CEUS）」 —— 三個要件都符合就成立。</b>');
      L.push(EV('<b>只要一種相符影像就夠，不需要兩種</b>，也不需要切片。' +
        '這一點常被誤以為要兩種影像互相印證。'));
      L.push(H('接下來做分期', '版次 20 第 1 頁'));
      L.push('<b>CT／MRI／CEUS（任一）為主要之影像診斷分期依據</b>，' +
        '<b>同時參考 Child-Pugh Score 及 Performance Status 以確認 BCLC 分期。</b>');
      L.push('<b>影像決定腫瘤範圍與有沒有血管侵犯／肝外轉移；Child-Pugh 與體能決定落在哪一格。</b>');
      L.push(H('一個之後要記得的例外', '版次 20 第 1 頁'));
      L.push('<b>如果之後開刀切除，正式病理報告顯示不是肝細胞癌，就要排除在外</b>；' +
        '有特殊情形可提<b>肝癌團隊會議</b>討論。');
      L.push(H('下一步', ''));
      L.push('<b>回步驟 1 選第三項，照第 3 頁的決策圖走 —— 第一個要問的是有沒有 PVT 或肝外轉移。</b>');

    } else if (S.dxc === 'path') {
      title = '病理或細胞學已證實<br>→ 診斷成立，接著做分期';
      L.push(H('診斷已經成立', '版次 20 第 1 頁'));
      L.push('<b>「病理學或細胞學證實（手術或切片）」 —— 這一條不需要背景肝病，也不看腫瘤大小。</b>');
      L.push(H('接下來做分期', '版次 20 第 1 頁'));
      L.push('<b>CT／MRI／CEUS（任一）為主要之影像分期依據，同時參考 Child-Pugh Score ' +
        '及 Performance Status 以確認 BCLC 分期。</b>');
      L.push(H('下一步', ''));
      L.push('<b>回步驟 1 選第三項，照第 3 頁的決策圖走。</b>');

    } else {
      cls = 'rec-idle';
      title = '兩項診斷條件都還不成立<br>→ 還不能當 HCC 治療，先把診斷補起來';
      L.push(H('目前的狀態', '版次 20 第 1 頁'));
      L.push('<b>台大的臨床診斷要求「腫瘤 &gt; 1 cm」＋ 背景肝病 ＋ 一種相符影像 —— ' +
        '這三個要件缺一個就不成立。</b>');
      L.push(H('常見的兩種情況', ''));
      L.push('<b>① 病灶 ≤ 1 cm</b>：不符合臨床診斷的大小門檻。<b>回到高危險群的監測排程</b>' +
        '（肝硬化每 3–6 個月、帶原者每 6–12 個月），追它會不會長大。');
      L.push('<b>② 沒有慢性肝炎、肝硬化，也沒有得過肝癌</b>：臨床診斷這條路走不通，' +
        '<b>要靠病理或細胞學</b>。');
      L.push(H('要不要切片？', '版次 20 第 1 頁'));
      L.push('<b>指引把病理診斷列為與臨床診斷並列的一條路</b>（手術或切片皆可）。' +
        '<b>但版次 20 沒有寫切片的適應症、途徑或風險</b> —— ' +
        '這一格請提<b>肝癌多專科團隊</b>討論（指引第 5 頁）。');
      L.push(H('❗ 不要略過的一件事', '版次 20 第 2 頁'));
      L.push('<b>不論診斷成不成立，慢性 B 型或 C 型肝炎都要治療。</b>');
    }

    fill('hc_r_dxc', cls, title, L,
      '台大肝細胞癌診療指引版次 20，第 1 頁「一、肝細胞癌診斷」與「二、肝癌分期檢查」。',
      more(dxReference(), hepatitisReference()));
    if (S.dxc !== 'none') fu('hc_f_dx', null);
  }

  /* ---------- C. 治療（第 3 頁決策圖）---------- */
  function renderTx() {
    show('hc_b_tx', true);
    show('hc_n_ext', true);
    if (!S.ext) return;
    show('hc_n_cp', true);
    if (!S.cp) return;

    /* PVT(+)／肝外轉移 —— 不再往下問腫瘤數目 */
    if (S.ext === 'pos') {
      if (S.cp === 'ab') {
        fill('hc_r_tx', 'rec-nonop',
          'PVT(+) 或肝外轉移　·　Child-Pugh A／B<br>→ Multi-modality therapy，六個選項並列', [
          H('指引列的六個選項', '版次 20 第 3 頁'),
          '<b>① Systemic therapy</b>（標註 1、2 —— 看腫瘤負荷與肝功能儲備；處方見下方選單）',
          '<b>② TACE</b>（標註 1）',
          '<b>③ Resection</b>（標註 1）',
          '<b>④ HAIC</b>（標註 1、3 —— <b>只用於 liver-predominant disease</b>）',
          '<b>⑤ EBRT</b>（標註 1、4 —— 在 BCLC C 是<b>合併治療的一部分、症狀緩解，或寡轉移</b>）',
          '<b>⑥ SIRT</b>',
          EV('<b>指引把這一格寫成「Multi-modality therapy」而不是「systemic therapy only」</b> —— ' +
            '有血管侵犯或肝外轉移<b>並不等於只能吃藥</b>。' +
            '<b>連 Resection 都還在選項裡</b>（標註 1，看腫瘤負荷與肝功能儲備）。'),
          H('這一格最實際的一個判斷', '註 3'),
          '<b>疾病是不是以肝臟為主（liver-predominant）？</b>' +
          '<b>是 → HAIC 進得了選項；不是 → HAIC 出局。</b>',
          H('下一步', ''),
          '<b>要決定用什麼藥，回步驟 1 選第四項（全身性治療）</b> —— ' +
            '那裡會依線別與第一線用過什麼，列出完整選單與證據強度。'
        ], '台大肝細胞癌診療指引版次 20 第 3 頁決策圖（PVT(+) or Extrahepatic metastasis → Child A,B）、' +
          '註 1／2／3／4。',
          more(notesReference(), locoReference(), nhiLocoReference(), sysReference(), nhiOrderReference(), abbrReference(), hepatitisReference()));
        fu('hc_f_tx', 'post');
      } else {
        fill('hc_r_tx', 'rec-urgent',
          'PVT(+) 或肝外轉移　·　Child-Pugh C<br>→ EBRT 或支持性照護', [
          H('指引列的兩個選項', '版次 20 第 3 頁'),
          '<b>① EBRT</b>（標註 1、4）',
          '<b>② Best supportive care</b>',
          EV('<b>這一格沒有全身性治療、沒有 TACE、沒有手術。</b>' +
            'Child-Pugh C 合併血管侵犯或肝外轉移，肝功能儲備已經撐不住這些治療。'),
          H('EBRT 在這一格的定位', '註 4'),
          '<b>「In BCLC stage C: EBRT may be considered as part of combined modality, ' +
            'for symptomatic palliation or when oligometastasis.」</b>',
          '<b>白話：這裡的放療主要是為了緩解症狀</b>（例如疼痛、骨轉移），' +
            '<b>不是為了控制腫瘤本身。</b>',
          H('別漏掉的兩件事', ''),
          '<b>① 慢性 B 型或 C 型肝炎仍應治療</b>（第 2 頁）。',
          '<b>② 如有特殊狀況，須經肝癌多專科團隊討論後取得治療共識</b>（第 5 頁）。'
        ], '台大肝細胞癌診療指引版次 20 第 3 頁決策圖（PVT(+) or Extrahepatic metastasis → Child C）、註 4。',
          more(notesReference(), locoReference(), nhiLocoReference(), abbrReference(), hepatitisReference()));
        fu('hc_f_tx', null);
      }
      return;
    }

    /* PVT(-) */
    if (S.cp === 'ab') {
      setNum('hc_n_num', '4');
      show('hc_n_num', true);
      if (!S.num) return;
      renderTxNum();
      return;
    }

    setNum('hc_n_ucsf', '4');
    show('hc_n_ucsf', true);
    if (!S.ucsf) return;
    renderTxUcsf();
  }

  function renderTxNum() {
    var L = [], title;
    if (S.num === 'n13') {
      title = 'PVT(−)　·　Child-Pugh A／B　·　1–3 顆<br>→ 選項最多的一格：切除、移植、消融都在這裡';
      L.push(H('指引列的八個選項', '版次 20 第 3 頁'));
      L.push('<b>① Resection</b>　<b>② LT（肝臟移植）</b>　<b>③ PTA（經皮腫瘤消融）</b>');
      L.push('<b>④ TACE ± Immunotherapy-based combination therapy</b>（註 6，版次 20 新增）');
      L.push('<b>⑤ EBRT</b>（註 4）　<b>⑥ SIRT</b>　<b>⑦ HAIC</b>（註 1、3）　' +
        '<b>⑧ Systemic therapy</b>（註 5）');
      L.push(EV('<b>這是整張圖選項最多的一格</b>，而且註 1 明講「Depending on individual ' +
        'patient\'s tumor burden and functional reserve」 —— ' +
        '<b>這八個不是並列等價，要看腫瘤負荷與肝功能儲備排順序。</b>'));
      L.push(H('三個容易踩到的條件', '註 3、4、5'));
      L.push('<b>EBRT：在 BCLC A/B 是「消融搆不到（PTA inaccessible）時」的替代</b>；' +
        'SBRT 與 hypofractionated RT 之間依正常組織安全性選。');
      L.push('<b>HAIC：只用於 liver-predominant disease。</b>');
      L.push('<b>Systemic therapy：要「局部治療不適合」<u>而且</u>是「瀰漫性、浸潤性或廣泛雙葉侵犯」' +
        '才考慮。</b>沒有血管侵犯也沒有肝外轉移的病人，全身治療不是預設選項。');
      L.push(H('版次 20 在這一格新增的東西', '註 6'));
      L.push('<b>「TACE in combination with durvalumab plus bevacizumab or pembrolizumab plus ' +
        'lenvatinib or atezolizumab plus bevacizumab may be considered due to potential ' +
        'progression-free survival benefits.」</b>');
      L.push(EV('<b>指引的用字是 potential progression-free survival benefits —— ' +
        '講的是無惡化存活，不是整體存活。</b>要和病人討論時這個差別很重要。'));
      L.push(H('TACE 要用哪一個化療藥？', '版次 20 未指定'));
      L.push(EV('<b>指引全文沒有寫 TACE 的藥物、劑量或栓塞材料</b>，只寫「TACE」。' +
        '台大處方集有一個<b>標明「FOR TAE 開方專用」的 doxorubicin 品項</b>' +
        '（Doxor 利癌凍晶注射劑 10 mg），實務上依介入放射科的作業慣例開立。' +
        '<b>本頁不代為訂劑量。</b>'));
      L.push(H('要考慮移植的話', ''));
      L.push('<b>這一格有 LT。</b>台大在 Child C 那一支用的是 <b>UCSF criteria</b>；' +
        '<b>但版次 20 沒有寫 Child A/B 病人做 LT 的選案標準</b> —— ' +
        '這一格請提<b>肝癌多專科團隊</b>討論（第 5 頁）。');

    } else {
      title = 'PVT(−)　·　Child-Pugh A／B　·　≥ 4 顆<br>→ 五個選項；<b>沒有移植、沒有消融、沒有放療</b>';
      L.push(H('指引列的五個選項', '版次 20 第 3 頁'));
      L.push('<b>① Resection</b>');
      L.push('<b>② TACE ± Immunotherapy-based combination therapy</b>（註 6，版次 20 新增）');
      L.push('<b>③ SIRT</b>　<b>④ HAIC</b>（註 1、3）　<b>⑤ Systemic therapy</b>（註 5）');
      L.push(H('❗ 和「1–3 顆」差在哪 —— 這是最容易抄錯的地方', '版次 20 第 3 頁'));
      L.push('<b>「≥ 4 顆」這一格<u>沒有</u> LT、<u>沒有</u> PTA、<u>沒有</u> EBRT。</b>' +
        '這三項只出現在「1–3 顆」那一格。');
      L.push(EV('把兩格的選項混在一起講是常見的錯誤。' +
        '<b>本頁的清單是把第 3 頁的圖 render 成圖片後逐格對出來的</b>，' +
        '不是照文字順序推的 —— 那張圖的文字抽出來是亂序的。'));
      L.push(H('那切除還在裡面？', '註 1'));
      L.push('<b>是。Resection 仍列在第一項</b>，但掛註 1「看腫瘤負荷與肝功能儲備」。' +
        '<b>≥ 4 顆不等於不能開刀，但要多專科評估。</b>');
      L.push(H('兩個限制條件', '註 3、5'));
      L.push('<b>HAIC：只用於 liver-predominant disease。</b>');
      L.push('<b>Systemic therapy：要局部治療不適合，<u>而且</u>是瀰漫性、浸潤性或廣泛雙葉侵犯。</b>');
      L.push(H('版次 20 新增', '註 6'));
      L.push('<b>TACE 可以合併 durvalumab ＋ bevacizumab、pembrolizumab ＋ lenvatinib、' +
        '或 atezolizumab ＋ bevacizumab</b>，理由是<b>潛在的無惡化存活獲益</b>。');
    }

    L.push(H('下一步', ''));
    L.push('<b>如果決定走全身性治療，回步驟 1 選第四項</b> —— 那裡依線別列出完整選單。');

    fill('hc_r_tx', 'rec-elective', title, L,
      '台大肝細胞癌診療指引版次 20 第 3 頁決策圖（PVT(-) → Child A,B → ' +
      (S.num === 'n13' ? '1-3' : '≥4') + '）、註 1／3／4／5／6。' +
      '<b>該頁決策圖已 render 成圖片逐格核對。</b>',
      more(notesReference(), locoReference(), nhiLocoReference(), sysReference(), nhiOrderReference(), abbrReference(), hepatitisReference()));
    fu('hc_f_tx', 'post');
  }

  function renderTxUcsf() {
    var L = [], cls, title;
    if (S.ucsf === 'within') {
      cls = 'rec-elective';
      title = 'PVT(−)　·　Child-Pugh C　·　符合 UCSF criteria<br>→ 肝臟移植（LT）';
      L.push(H('指引在這一格只列一個選項', '版次 20 第 3 頁'));
      L.push('<b>Liver transplantation（LT）。</b>');
      L.push(EV('<b>Child-Pugh C 的病人肝功能已經無法承受切除、消融或 TACE</b> —— ' +
        '移植同時解決腫瘤與肝功能衰竭兩個問題，所以這一格只有它。'));
      L.push(H('❗ 台大用的是 UCSF criteria，不是 Milan criteria', '版次 20 第 3 頁'));
      L.push('<b>決策圖上寫的是 Within UCSF／Beyond UCSF。</b>' +
        '這和多數國際指引以 Milan criteria 為主的寫法不同。');
      L.push('<b>UCSF（也就是 UCSF downstaging／expanded criteria）比 Milan 寬</b>，' +
        '因此在 Milan 之外、UCSF 之內的病人，在台大仍走得到移植這一格。');
      L.push(EV('❗<b>版次 20 全文沒有列出 UCSF criteria 的具體數字</b>（腫瘤大小與顆數的門檻）。' +
        '本頁不代為填指引沒有寫的數字 —— <b>請依院內移植團隊採用的版本判定</b>，' +
        '並提肝癌多專科團隊討論。'));
      L.push(H('等待期間要做的事', ''));
      L.push('<b>版次 20 沒有寫 bridging therapy（等待移植期間的橋接治療）或 downstaging 的做法。</b>' +
        '這一格請與移植團隊與肝癌多專科團隊共同決定。');
      L.push(H('別漏掉', '版次 20 第 2 頁'));
      L.push('<b>慢性 B 型或 C 型肝炎仍應治療</b> —— 移植前後都適用。');

    } else {
      cls = 'rec-urgent';
      title = 'PVT(−)　·　Child-Pugh C　·　超出 UCSF criteria<br>→ EBRT 或支持性照護';
      L.push(H('指引列的兩個選項', '版次 20 第 3 頁'));
      L.push('<b>① EBRT</b>（標註 1、4）');
      L.push('<b>② Best supportive care</b>');
      L.push(EV('<b>Child-Pugh C 又超出移植標準，是整張圖裡選擇最少的兩格之一</b>。' +
        '和 PVT(+)／Child C 那一格的選項相同。'));
      L.push(H('EBRT 在這裡的定位', '註 4'));
      L.push('<b>這位病人沒有血管侵犯也沒有肝外轉移，屬於 BCLC A／B 的解剖範圍 —— ' +
        '註 4 對 BCLC A/B 寫的是「EBRT may be considered when PTA inaccessible」。</b>');
      L.push('<b>SBRT 與 hypofractionated RT 之間的選擇，依正常組織安全性調整</b> —— ' +
        'Child-Pugh C 的肝臟本來就沒有多少餘裕，這一句在這一格特別重要。');
      L.push(H('要不要再評估移植？', ''));
      L.push('<b>指引在這一格沒有寫 downstaging 後再評估移植。</b>' +
        '若臨床上考慮 downstaging，屬指引未涵蓋的範圍，' +
        '<b>請提肝癌多專科團隊討論</b>（第 5 頁）。');
      L.push(H('別漏掉', '版次 20 第 2 頁'));
      L.push('<b>慢性 B 型或 C 型肝炎仍應治療。</b>' +
        'Child-Pugh C 的病人，抗病毒治療有時能讓肝功能回穩到重新進入其他選項。');
    }

    fill('hc_r_tx', cls, title, L,
      '台大肝細胞癌診療指引版次 20 第 3 頁決策圖（PVT(-) → Child C → ' +
      (S.ucsf === 'within' ? 'Within UCSF → LT' : 'Beyond UCSF') + '）、註 1／4。' +
      '<b>該頁決策圖已 render 成圖片逐格核對。</b>',
      more(notesReference(), locoReference(), nhiLocoReference(), abbrReference(), hepatitisReference()));
    fu('hc_f_tx', S.ucsf === 'within' ? 'post' : null);
  }

  /* ---------- D. 全身治療（第 4 頁 Figure 1）---------- */
  function renderSys() {
    show('hc_b_sys', true);
    show('hc_n_line', true);
    if (!S.line) return;

    if (S.line === 'l1') {
      fill('hc_r_sys', 'rec-nonop',
        '第一線<br>→ 先看免疫組合能不能用；不能用才換 sorafenib 或 lenvatinib', [
        H('第一順位：Anti-PD1／PD-L1 combinations', '版次 20 第 3 頁註 2、第 4 頁 Figure 1'),
        '<b>指引列名的組合</b>：<b>atezolizumab ＋ bevacizumab</b>、' +
          '<b>durvalumab ＋ tremelimumab</b>、<b>ipilimumab ＋ nivolumab</b>（版次 20 新增）。',
        '<b>Figure 1 註 1 寫的是「include but <u>not limited to</u>」</b>，並補上' +
          '「or other multikinase inhibitors plus PD1/PDL1 combination as deemed appropriate by ' +
          'the treating physician」 —— <b>清單是開放的，由主治醫師判斷。</b>',
        H('❗ sorafenib 與 lenvatinib 的順位', 'Figure 1 註 2'),
        '<b>Figure 1 對這兩個藥標的註 2 是「If anti-PD1/PDL1 combinations not feasible or ' +
          'appropriate (i.e., contraindicated)」 —— 它們是<u>免疫組合不能用時的替代</u>，' +
          '不是並列的首選。</b>',
        EV('把它們寫成「第一線四選一」是誤讀。<b>指引的階層是：先問免疫組合能不能用。</b>' +
          '不能用的常見理由包括自體免疫疾病、器官移植後、需要高劑量類固醇，' +
          '以及 bevacizumab 的出血與食道胃靜脈瘤風險。'),
        H('開始前要處理的事', ''),
        '<b>用 bevacizumab 之前要評估食道胃靜脈瘤</b>（出血風險）—— ' +
          '<b>版次 20 沒有寫這一條，屬院外的常規做法</b>，本頁只提醒不代為訂標準。',
        '<b>慢性 B 型或 C 型肝炎仍應治療</b>（第 2 頁）—— ' +
          '免疫治療與化療期間的 B 肝再活化是實際風險。',
        '<b>免疫治療的副作用與照護原則，見台大醫院「癌症免疫治療藥物照護原則」相關文件</b>（第 5 頁）。',
        H('❗ 台灣健保在這一格和指引拉扯', '第 9 節，查詢日 2026-08-17'),
        '<b>健保的四個一線藥「僅得擇一給付，不得互換」</b>：sorafenib（9.34）、lenvatinib（9.63）、' +
          'atezolizumab ＋ bevacizumab（9.69）、durvalumab ＋ tremelimumab（9.69）。' +
          '<b>硬門檻是 Child-Pugh A，加上肝外轉移／大血管侵犯／TACE 失敗三者之一。</b>',
        '❗<b>選了 lenvatinib 或免疫組合，健保的二線標靶就沒有了。</b>' +
          '<b>9.63 第 2 項第(3)款</b>（lenvatinib）與<b>9.69 第 2 項第(1)款 IV</b>（免疫組合）都明文寫' +
          '「治療失敗後不得申請 ' + NR('regorafenib') + ' 或 ' + NR('ramucirumab') + '」；' +
          '<b>只有 sorafenib 那一條沒有這句</b>，而 ' + NR('regorafenib') + '（9.51）與 ' +
          NR('ramucirumab') + '（9.92）的條文又逐字要求「曾接受 sorafenib 治療失敗後」。',
        '<b>所以第一線的選擇同時決定了兩件事：這一線的療效，以及二線還有沒有健保。</b>' +
          '本頁不替你決定 —— <b>這是價值判斷，請與病人共同決定並提肝癌多專科團隊討論。</b>',
        '<b>免疫組合的三項健保排除條件</b>（9.69 2.(1)II）：<b>①曾接受器官移植 ' +
          '②正在接受免疫抑制藥物治療 ③有上消化道出血之疑慮且未接受完全治療（須有半年內之內視鏡評估報告）。</b>' +
          '<b>第三項等於治療前要先做胃鏡 —— 這是健保明文，不只是慣例。</b>',
        '<b>' + NR('pembrolizumab') + '、' + NR('cabozantinib') + '、' + NR('ipilimumab') +
          ' 用於 HCC 健保都沒有給付；Child-Pugh B 的病人健保沒有任何全身性治療條文。</b>',
        EV('療程與評估：<b>sorafenib／lenvatinib 初次 3 個月、之後每 3 個月</b>；' +
          '<b>免疫組合每次申請 12 週、給付時程自初次處方日起算 2 年</b>。' +
          '<b>HCC 的療效評估用 mRECIST 不是 iRECIST</b>，而且<b>影像給付不含 PET</b>。'),
        H('也可以選臨床試驗', 'Figure 1'),
        '<b>Figure 1 把「Clinical Trial」和第一線的藥物並列。</b>',
        H('下一步', ''),
        '<b>進展之後回到步驟 2 選第二線</b> —— 那裡會問「第一線用的是什麼」，' +
          '<b>因為那決定二線的證據強度。</b>'
      ], '台大肝細胞癌診療指引版次 20 第 3 頁註 2、第 4 頁 Figure 1（1L Therapy 與註 1、2）。' +
        '<b>Figure 1 已 render 成圖片，箭頭語意逐條核對。</b>',
        more(nhiOrderReference(), sysReference(), notesReference(), nhiReference(), hepatitisReference()));
      fu('hc_f_sys', null);
      return;
    }

    show('hc_n_prior', true);
    if (!S.prior) return;
    show('hc_n_afp', true);
    if (!S.afp) return;
    renderSys2();
  }

  function renderSys2() {
    var L = [], cls = 'rec-nonop';
    var priorTxt = S.prior === 'sora' ? 'Sorafenib' : (S.prior === 'lenva' ? 'Lenvatinib' : '免疫組合');
    var trial = (S.prior === 'sora');

    var title = '第二線　·　第一線用過 ' + priorTxt +
      '<br>→ ' + (trial ? '這一格的二線選項有隨機試驗支持' : '這一格的二線選項屬<b>專家意見</b>，不是試驗證據');

    L.push(H('指引列的二線選項', '版次 20 第 3 頁註 2、第 4 頁 Figure 1'));
    if (S.afp === 'hi') {
      L.push('<b>Ramucirumab</b> —— <b>Figure 1 在它上面畫了一個閘門：AFP ≥ 400 ng/mL。' +
        '這位病人符合。</b>');
      L.push('<b>Regorafenib</b>　<b>Cabozantinib</b>　<b>Anti-PD1 or Anti-PD-L1</b>　' +
        '<b>Nivolumab ＋ Ipilimumab</b>　或　<b>臨床試驗</b>');
    } else {
      L.push('<b>Regorafenib</b>　<b>Cabozantinib</b>　<b>Anti-PD1 or Anti-PD-L1</b>　' +
        '<b>Nivolumab ＋ Ipilimumab</b>　或　<b>臨床試驗</b>');
      L.push('❗<b>' + NR('Ramucirumab') + ' 這一格用不上</b> —— ' +
        '指引註 2 寫「reserved for patients whose alpha-fetoprotein level ≥ 400 ng/mL」，' +
        '<b>Figure 1 也把 AFP ≥ 400 畫成它前面的閘門。這位病人 AFP < 400。</b>');
    }
    L.push('指引註 2 另列 <b>nivolumab</b> 與 <b>pembrolizumab</b> 為二線單方。');

    L.push(H('❗ 這一格的證據強度', '第 4 頁 Figure 1 的圖例'));
    L.push('<b>Figure 1 的箭頭分兩種：實線黑箭頭 ＝ based on clinical trial data；' +
      '灰色虛線箭頭 ＝ based on expert opinion。</b>');
    if (trial) {
      L.push('<b>從 sorafenib 出來的箭頭全部是實線</b> —— ' +
        '因為 regorafenib、' + NR('ramucirumab') + '、cabozantinib 與免疫單方的二線隨機試驗' +
        '<b>都是在 sorafenib 之後做的</b>。<b>這一格是整張圖證據最紮實的一格。</b>');
      L.push(EV('唯一的例外是 <b>nivolumab ＋ ipilimumab</b>，' +
        'Figure 1 從 sorafenib 到它畫的是<b>實線</b>，' +
        '但它同時也被列在第一線 —— 二線與一線都出現，是版次 20 的安排。'));
    } else {
      L.push('❗<b>從' + (S.prior === 'io' ? '免疫組合' : ' lenvatinib ') +
        '出來的箭頭全部是灰色虛線 —— 也就是「based on expert opinion」。</b>');
      L.push('<b>白話：第一線用了' + (S.prior === 'io' ? '免疫組合' : ' lenvatinib ') +
        '之後要接什麼，目前<u>沒有</u>隨機試驗告訴我們答案。</b>' +
        '上面那幾個選項是專家共識推出來的。');
      L.push(EV('原因很直接：<b>二線的隨機試驗（RESORCE、REACH-2、CELESTIAL、KEYNOTE-394）' +
        '收的都是 sorafenib 失敗的病人</b>，' +
        (S.prior === 'io'
          ? '免疫組合成為第一線是 IMbrave150／HIMALAYA 之後的事，那時二線試驗早就做完了。'
          : 'lenvatinib 的 REFLECT 是一線試驗，之後的二線沒有專門的隨機證據。') +
        '<b>這件事在和病人討論二線時要講清楚，不要說成「標準二線治療」。</b>'));
      if (S.prior === 'io') {
        L.push('❗<b>已經用過免疫治療的病人，再用另一個免疫單方（anti-PD1／PD-L1）' +
          '是否還有效，Figure 1 沒有回答</b> —— 它把這個選項留在二線清單裡，但箭頭是虛線。' +
          '<b>請提肝癌多專科團隊討論。</b>');
      }
    }

    L.push(H('❗ 台灣健保在這一格給不給', '第 9 節，查詢日 2026-08-17'));
    if (S.prior === 'sora') {
      L.push('<b>✔ 第一線用的是 sorafenib，健保的二線標靶拿得到。</b>' +
        '<b>regorafenib（9.51）' + (S.afp === 'hi' ? '與 ramucirumab（9.92）' : '與 ' + NR('ramucirumab') + '（9.92）') +
        '的條文都逐字要求「曾接受 sorafenib 治療失敗後」—— 這一格' +
        (S.afp === 'hi' ? '兩者都符合' : '符合，但 AFP 那一關見下一條') + '。</b>');
      if (S.afp === 'hi') {
        L.push('<b>ramucirumab（9.92）的三個門檻：sorafenib 失敗後 ＋ AFP ≥ 400 ng/mL ＋ Child-Pugh A。' +
          '這位病人的 AFP 符合。</b>這也是 ramucirumab 在健保唯一的適應症（胃癌未給付）。');
      } else {
        L.push('❗<b>但 ' + NR('ramucirumab') + ' 這一格不符合：9.92 第 1 項要求 AFP ≥ 400 ng/mL。</b>' +
          '<b>健保的二線標靶只剩 regorafenib（9.51）。</b>');
      }
      L.push('<b>regorafenib：每日至多處方 4 粒；初次療程 12 週，之後每 8 週評估。</b>');
    } else {
      L.push('❗<b>✘ 第一線用的是' + (S.prior === 'io' ? '免疫組合' : ' lenvatinib ') +
        '，健保的二線標靶申請不到。</b>' +
        (S.prior === 'io'
          ? '<b>9.69 第 2 項第(1)款 IV（114/2/1）明文：免疫組合治療失敗後不得申請 ' +
            NR('regorafenib') + ' 或 ' + NR('ramucirumab') + '。</b>'
          : '<b>9.63 第 2 項第(3)款明文：lenvatinib 治療失敗後不得申請 ' +
            NR('regorafenib') + ' 或 ' + NR('ramucirumab') + '。</b>'));
      L.push('<b>而且 ' + NR('regorafenib') + '（9.51）與 ' + NR('ramucirumab') +
        '（9.92）的條文本身也只寫「曾接受 sorafenib 治療失敗後」—— 兩邊都堵住。</b>');
      L.push('<b>結果：這一格的二線在台灣是自費或臨床試驗。</b>' +
        '<b>這正是第一線選藥時就要一起考慮的事。</b>');
    }
    L.push('❗<b>二線的 ' + NR('nivolumab') + ' 單用對新病人實質已關閉</b>：' +
      '9.69 1.(8)V 限「109 年 4 月 1 日前經審核同意用藥、後續評估符合續用申請條件者」。');
    L.push('<b>' + NR('cabozantinib') + '（9.74 只有腎細胞癌與甲狀腺癌）與 ' + NR('pembrolizumab') +
      '（KEYNOTE-394 無條文）用於 HCC 都沒有健保給付</b> —— ' +
      '指引把它們列在二線選單裡，但在台灣要自費。');
    L.push('<b>' + (S.prior === 'sora' ? 'regorafenib' : NR('regorafenib')) + '、' +
      (S.prior === 'sora' && S.afp === 'hi' ? 'ramucirumab' : NR('ramucirumab')) + '、' +
      NR('nivolumab') + ' 三者「僅能擇一使用，不得互換」</b>' +
      '（9.51 3.(4)／9.92 3.／9.69 1.(8)III）。');
    L.push(H('也可以選臨床試驗', 'Figure 1'));
    L.push('<b>Figure 1 在二線同樣把「Clinical Trial」和藥物並列</b> —— ' +
      '在證據是專家意見、健保又不給付的這幾格，<b>臨床試驗的份量更重</b>。');

    L.push(H('別漏掉的兩件事', ''));
    L.push('<b>慢性 B 型或 C 型肝炎仍應治療</b>（第 2 頁）。');
    L.push('<b>免疫治療副作用與照護原則見台大醫院「癌症免疫治療藥物照護原則」</b>（第 5 頁）。');

    L.push(H('如有特殊狀況', '版次 20 第 5 頁'));
    L.push('<b>「須經肝癌多專科團隊討論後，取得治療共識。」</b>');

    fill('hc_r_sys', cls, title, L,
      '台大肝細胞癌診療指引版次 20 第 3 頁註 2、第 4 頁 Figure 1（2L Therapy、AFP ≥ 400 閘門、' +
      '以及圖例的實線／虛線語意）。<b>Figure 1 已 render 成圖片逐條核對。</b>',
      more(nhiOrderReference(), sysReference(), notesReference(), nhiReference(), hepatitisReference()));
    fu('hc_f_sys', null);
  }

  /* ---------- E. 追蹤 ---------- */
  function renderFu() {
    show('hc_b_fu', true);
    fill('hc_r_fu', 'rec-elective',
      '治療已完成<br>→ 3 個月內一次、1 年內至少三次，另加一年兩次 PIVKA-II', [
      H('排程', '版次 20 第 2 頁「四、肝細胞癌治療後追蹤」'),
      '<b>完成所有治療後 3 個月內</b>，應接受一次 AFP 及影像學檢查（超音波或 CT／MRI）。',
      '<b>1 年內應接受 ≥ 3 次</b> AFP 及影像學檢查。',
      '<b>一年兩次作 PIVKA-II 檢查。</b>',
      H('「所有治療」指的是什麼', '版次 20 第 2 頁註一'),
      '<b>包含手術切除、局部消融治療、肝臟移植、TACE、放射治療，' +
        '以及其他治療（如肝動脈化療、化學治療、標靶治療、免疫治療等）。</b>',
      EV('註一把範圍寫得很寬 —— <b>不只是開完刀才算「完成治療」</b>，' +
        '做完 TACE、消融或放療同樣要按這個排程追。'),
      H('❗ 最容易被略過的一條', '版次 20 第 2 頁'),
      '<b>「除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。」</b>' +
        '指引把它和追蹤並列在同一節。',
      H('發現復發怎麼辦', ''),
      '<b>回步驟 1 選第三項，重新照第 3 頁的決策圖走一次</b> —— ' +
        '先問有沒有 PVT 或肝外轉移，再看 Child-Pugh。' +
        '<b>復發時肝功能常常已經和第一次治療時不同，這一步不能沿用舊的分級。</b>',
      H('如有特殊狀況', '版次 20 第 5 頁'),
      '<b>「須經肝癌多專科團隊討論後，取得治療共識。」</b>'
    ], '台大肝細胞癌診療指引版次 20 第 2 頁「四、肝細胞癌治療後追蹤」與註一；第 5 頁。',
      more(hepatitisReference(), dxReference()));
    fu('hc_f_fu', 'post');
  }

  /* ==========================================================
     6. 最下方：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('先講結論', '台大肝細胞癌診療指引版次 20'));
    L.push('<b>台大 HCC 指引版次 20 全文 8 頁，沒有任何基因或分子檢測的建議</b> —— ' +
      '沒有 NGS、沒有伴隨式診斷、沒有遺傳諮詢。' +
      '<b>這不是漏寫，是 HCC 目前的現實：治療分派靠影像、Child-Pugh 與體能，不靠分子分型。</b>');
    L.push(H('那有哪一個檢驗會改變用藥？', '版次 20 第 3 頁註 2'));
    L.push('<b>只有一個，而且它不是基因：AFP。</b>' +
      '<b>AFP ≥ 400 ng/mL 是 ramucirumab 的門檻</b>（註 2：reserved for patients whose ' +
      'alpha-fetoprotein level ≥ 400 ng/mL）。');
    L.push('<b>所以二線之前一定要有一筆 AFP。</b>這一點比任何基因檢測都實際。');
    L.push(H('PIVKA-II 是什麼、什麼時候要驗', '版次 20 第 2 頁'));
    L.push('<b>指引在兩個地方要求 PIVKA-II，都是「一年兩次」</b>：' +
      '<b>①已確診肝硬化的高危險群監測；②治療後追蹤。</b>');
    L.push(EV('<b>注意：B／C 肝帶原但還沒有肝硬化的那一組，指引沒有寫 PIVKA-II。</b>' +
      '這是兩組追蹤強度的差別之一。'));
    L.push(H('肝炎的病毒學檢查', '版次 20 第 2 頁'));
    L.push('<b>「除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。」</b>' +
      '要治療就要有病毒學資料 —— <b>HBsAg、anti-HCV 是決定追蹤間隔的依據</b>' +
      '（帶原者 6–12 個月 vs 肝硬化 3–6 個月），本身也是治療的適應症依據。');
    L.push('❗<b>指引沒有寫抗病毒藥的品項、起始時機或監測方式</b>，' +
      '本頁不代為補；請照會肝膽腸胃科並依健保 B 肝／C 肝條文辦理。');
    L.push(H('遺傳性肝癌呢？', '台大指引未列，屬院外實證'));
    L.push('<b>HCC 絕大多數是後天的（B 肝、C 肝、酒精、代謝性脂肪肝），' +
      '不是遺傳症候群。</b>台大指引沒有列任何遺傳性評估。');
    L.push('<b>少數例外是有明確家族性肝病背景的病人</b>（例如遺傳性血鐵沉積症、' +
      'α1-antitrypsin 缺乏、酪胺酸代謝異常等）—— ' +
      '<b>這些的處理屬肝膽專科與遺傳諮詢的範圍，不在本指引內。</b>');
    L.push(EV('把這一段放在流程最下方，是因為<b>它與病人走哪一條治療路線無關</b>。' +
      '但它會改變兩件很實際的事：<b>二線要不要驗 AFP</b>，以及<b>抗病毒治療有沒有開下去</b>。'));

    return '<div class="bc-gene-h">要不要驗基因？HCC 的答案和其他癌別不一樣' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     7. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'hc-drug-' + code.replace(/ /g, '_'); }

  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }

  function renderGeneBlock(hasRec) {
    var g = el('hc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }

  function renderDrugCards() {
    var box = el('hc_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到，那張藥卡會無聲消失。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('hccPath');
    if (root) {
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        r.querySelectorAll('details.rx-table').forEach(function (d) { txt += textOf(d) + '\n'; });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }

    renderGeneBlock(!!txt.trim());

    var picked = [];
    HC_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' + (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });

    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;

    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var nCards = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡<span class="bc-drugbox-n">' +
      picked.length + ' 種藥 · ' + nCards + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">點藥名展開台大醫院藥劑部處方集的完整藥卡（劑量、腎肝功能調整、' +
      '禁忌、健保給付規定、剝半磨粉）。<b>離線也看得到；只有藥品外觀照是台大原站外連，需要連線。</b></div>' +
      picked.map(function (d) {
        return d.cards.map(function (c) { return drugCardHTML(c, d.label || d.key, d.flag); }).join('');
      }).join('');

    if (window.DrugCard && window.requestIdleCallback) {
      var pids = {};
      picked.forEach(function (d) { d.cards.forEach(function (c) { pids[c[0]] = 1; }); });
      window.requestIdleCallback(function () {
        Object.keys(pids).forEach(function (pid) { window.DrugCard.loadPid(pid).catch(function () {}); });
      });
    }
  }

  /* ==========================================================
     8. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope === 'screen') renderScreen();
    else if (S.scope === 'dx') renderDx();
    else if (S.scope === 'tx') renderTx();
    else if (S.scope === 'sys') renderSys();
    else if (S.scope === 'fu') renderFu();
    renderDrugCards();
  }

  /* ==========================================================
     9. 互動
     ========================================================== */
  var SEL_GROUPS = ['hc_n1', 'hc_n_risk', 'hc_n_dxc', 'hc_n_ext', 'hc_n_cp',
    'hc_n_num', 'hc_n_ucsf', 'hc_n_line', 'hc_n_prior', 'hc_n_afp'];

  var DOWNSTREAM = {
    scope: ['risk', 'dxc', 'ext', 'cp', 'num', 'ucsf', 'line', 'prior', 'afp'],
    ext: ['cp', 'num', 'ucsf'],
    cp: ['num', 'ucsf'],
    line: ['prior', 'afp'],
    prior: ['afp']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function hccPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      clearSelectionMarks();
    }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }

  function reapplyMarks() {
    var pairs = [
      ['hc_n1', 'scope'], ['hc_n_risk', 'risk'], ['hc_n_dxc', 'dxc'], ['hc_n_ext', 'ext'],
      ['hc_n_cp', 'cp'], ['hc_n_num', 'num'], ['hc_n_ucsf', 'ucsf'],
      ['hc_n_line', 'line'], ['hc_n_prior', 'prior'], ['hc_n_afp', 'afp']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /hccPick\('([a-z]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function hccReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }

  function initHccPathway() { hccReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。
     舊版用的是 hcPick／hcReset，已一律改成 hccPick／hccReset。 */
  global.hccPathwayHTML = hccPathwayHTML;
  global.initHccPathway = initHccPathway;
  global.hccPick = hccPick;
  global.hccReset = hccReset;
})(window);
