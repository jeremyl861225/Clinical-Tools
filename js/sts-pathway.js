/* ============================================================
   軟組織肉瘤治療互動決策流程 Soft Tissue Sarcoma Treatment Pathway
   ------------------------------------------------------------
   2026-09-13 打掉重做（舊版 597 行為舊世代寫法：無收合、無下游歸零表、無藥卡、無基因段）。

   院內來源：**台大肉瘤臨床診療指引**
     文件編號 **50710-2-000049**，**版次 08**，2026/06/16 第 87 次癌症醫療委員會修訂通過，共 12 頁。
     標題頁自稱 **Sarcoma Clinical Guidelines in Oncology, NTUH – V.1 2026**，
     由 NTUH 肉瘤多科診療團隊制訂（陳偉武／李佳真／李明璟 醫師）。
     改版史：105、106、109、110、111、112、114、115 年共八次。
     **12 張圖已全部 render 成 200 dpi PNG 逐張看圖判讀，箭頭走向以看圖為準。**

   這份指引涵蓋**三個實體**，本頁的分頁對應如下：
     · **軟組織肉瘤 STS**（p2–p6）—— 本頁主線
     · **骨肉瘤 Bone sarcoma**（p6–p8）—— 只有通則沒有流程圖；本頁做成指路，
       且 AJCC 分期分頁未納入骨肉瘤（見該頁 staging_note）
     · **腹膜後肉瘤 RPS**（p9–p12）—— 本頁獨立一支

   ❗只讀文字層會漏掉的三處（已看圖確認）：
     ① **p4 可切除流程的 Grade 2/3 那一條有<u>兩條並列的進入路線</u>**
        （直接手術 ／ 術前 RT 或 C/T ± RT 後手術），**兩條在圖上用大括號匯進同一個 R0／R1 分岔**。
     ② **p4 的 Grade 2/3 進入條件是<u>三選一</u>**：Grade 2/3、<u>或</u>腫瘤 ≥ 5 cm、
        <u>或</u>術前已確認無法達到乾淨切緣。
        ❗**但上面那一支的標籤只有「Grade 1ᵃ」，沒有附任何大小或切緣的排除條件** ——
        所以 **Grade 1 且 ≥ 5 cm 的腫瘤同時符合上下兩支，指引沒有寫優先序**。
        註 a 要求「治療前強烈建議多專科團隊討論」，這正是要在會議上決定的事。
     ③ **p11 的「Adjuvant Tx」右側有一條線折回「Follow-up」** ——
        它<u>不是</u>兩個並列的終點，而是「直接追蹤」或「做完輔助治療再追蹤」。

   ⚠ 本指引自己列的參考文獻（p12）：
     NCCN Soft Tissue Sarcoma **V2. 2026**／NCCN Bone Cancer **V2. 2026**／
     ESMO–EURACAN–GENTURIS（Gronchi A et al. Ann Oncol 2021;32(11):1348-1365）／
     AJCC 8th／**Ann Surg 2023;278(1):127-134（STREXIT）**／**Lancet Oncol 2020;21(10):1366-1377（STRASS）**。

   ❗GIST 不走本頁（本站另有「胃腸道基質瘤（GIST）」條目）。
     本指引 p9 把 GIST 明文列在**腹膜後肉瘤的 Exclusion** 清單裡；
     同一頁的註腳只說被排除的 **"sarcoma subtypes"** 仍應在多專科團隊會議中討論，
     **註腳沒有點名 GIST**。原文用的詞是 **classification（分類）**，照抄即可不要延伸。

   ❗**台大這份指引從頭到尾沒有寫分級用哪一套系統、也沒有寫怎麼算分**，
     但 p4 的整個分岔就掛在 grade 上（見頁面的分級參考區塊）。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   ============================================================ */
(function (global) {
  'use strict';

  var S = {};
  var KEYS = ['scope', 'resect', 'grade', 'route', 'margin', 'ures', 'sub', 'line', 'rstate'];
  KEYS.forEach(function (k) { S[k] = null; });

  /* 學名 → 台大藥卡（2026-09-13 逐碼實跑核對）
     ⚠ 徽章寫的是「這個藥用於軟組織肉瘤時」在台灣的狀態。
     ⚠ olaratumab 台大處方集查無（第三期 ANNOUNCE 陰性後已退場），故無卡。 */
  var ST_DRUGS = [
    { key: 'doxorubicin',
      cards: [['17', 'ADR1CD04', 'Adriblastina 艾黴素注射劑 10 mg', 'doxorubicin'],
              ['17', 'AD 1CD04', 'Adriamycin 艾黴素注射液 10 mg/5 mL', 'doxorubicin']],
      flag: '指引第一線骨幹；❗藥證用舊譯「軟纖維性肉瘤」' },
    { key: 'liposomal doxorubicin', re: 'liposomal doxorubicin|Lipo-Dox|微脂體 doxorubicin',
      cards: [['17', 'LIP1CD12', 'Lipo-Dox 力得微脂體注射劑 20 mg/10 mL', 'liposomal doxorubicin']],
      flag: '指引指定給血管肉瘤；❗藥證與健保只有卡波西氏肉瘤' },
    { key: 'ifosfamide', cards: [['17', 'HOL1CA13', 'Holoxan 好克癌注射劑', 'ifosfamide']],
      flag: '一線與後線皆列；❗必須併用 mesna' },
    { key: 'mesna', cards: [['17', 'URO1CF01', 'Uromitexan 優路保注射液 400 mg/4 mL', 'mesna']],
      flag: 'ifosfamide 的必要解毒劑（出血性膀胱炎）' },
    { key: 'gemcitabine', cards: [['17', 'GEI1CB14', 'Gemzar 健仕注射液', 'gemcitabine']],
      flag: '❗台灣藥證沒有肉瘤' },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑', 'docetaxel']],
      flag: '❗台灣藥證沒有肉瘤' },
    { key: 'paclitaxel', cards: [['17', 'PHY1CC03', 'Paclitaxel 輝克癒蘇注射劑', 'paclitaxel']],
      flag: '❗藥證只有卡波西氏肉瘤第二線' },
    { key: 'dacarbazine', cards: [['17', 'DAC1CA08', 'Dacarbazine 達卡巴仁注射劑 200 mg', 'dacarbazine']],
      flag: '❗台灣藥證只有惡性黑色素瘤（仿單外）' },
    { key: 'pazopanib', cards: [['17', 'VOT4CED7', 'Votrient 福退癌膜衣錠', 'pazopanib']],
      flag: '健保 9.41；❗排除 8 個亞型含脂肪肉瘤' },
    { key: 'eribulin', cards: [['17', 'HAL1CEI4', 'Halaven 賀樂維注射液', 'eribulin']],
      flag: '健保 9.48：❗只有脂肪肉瘤，每次 3 個療程' },
    { key: 'trabectedin', cards: [['17', 'YON1CC36', 'Yondelis 友待凍晶注射劑', 'trabectedin']],
      flag: '❗有藥證、完全沒有健保' },
    { key: 'imatinib', cards: [['17', 'GLI4CE95', 'Glivec 基利克膜衣錠 100 mg', 'imatinib']],
      flag: '指引指定：DFSP 且確認 PDGFB translocation（健保 9.22）' },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg', 'pembrolizumab']],
      flag: '❗UPS 為仿單外：台灣藥證與健保皆無肉瘤' },
    { key: 'nivolumab', cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑', 'nivolumab']],
      flag: '❗血管肉瘤為仿單外（與 ipilimumab 併用）' },
    { key: 'ipilimumab', cards: [['17', 'YER1CEI0', 'Yervoy 益伏注射劑 50 mg/10 mL', 'ipilimumab']],
      flag: '❗血管肉瘤為仿單外（與 nivolumab 併用）' },
    { key: 'atezolizumab', cards: [['17', 'TEC1CEL9', 'Tecentriq 癌自禦注射劑 1200 mg', 'atezolizumab']],
      flag: '台灣藥證含 ASPS；❗健保不給付' },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib']],
      flag: 'NTRK 融合泛實體瘤（健保 9.95）' },
    { key: 'entrectinib', cards: [['17', 'ROZ4CG01', 'Rozlytrek 羅思克膠囊 200 mg', 'entrectinib']],
      flag: 'NTRK 融合泛實體瘤；❗健保肉瘤 6 條裡沒有它' },
    { key: 'crizotinib', cards: [['17', 'XAL4CEI7', 'Xalkori 截剋瘤膠囊 250 mg', 'crizotinib']],
      flag: '台灣藥證第 4 項含 ALK 陽性 IMT' }
  ];

  /* ---------- 版面小工具 ---------- */
  function opt(k, v, t, s) {
    return '<button class="flow-opt" onclick="stPick(\'' + k + '\',\'' + v + '\',this)">' +
      t + (s ? '<span class="fo-sub">' + s + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="st-node hidden" id="' + id + '"><div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head"><span class="flow-num">' + num +
      '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts, extra) {
    return '<div class="st-node" id="' + id + '"><div class="flow-step">' +
      '<div class="flow-step-head"><span class="flow-num">' + num + '</span>' +
      '<span class="flow-q">' + q + '</span></div><div class="flow-opts">' + opts + '</div>' +
      (extra || '') + '</div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }
  function H(t, s) { return '<span class="rx-h">' + t + '</span>' + (s ? '　<span class="rx-sub">' + s + '</span>' : ''); }
  function EV(t) { return '@ev ' + t; }
  function SUB(a) { return '<ul class="rec-sub"><li>' + a.join('</li><li>') + '</li></ul>'; }
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }
  function fold(s, i) { return '<details class="kps-details"><summary>' + s + ' ▸</summary>' + i + '</details>'; }

  var SRC = '台大肉瘤臨床診療指引（文件編號 50710-2-000049，版次 08，2026/06/16 第 87 次癌症醫療' +
    '委員會修訂通過；標題頁自稱 Sarcoma Clinical Guidelines in Oncology, NTUH – V.1 2026）';

  /* ==========================================================
     共用參考區塊（全部出自台大指引本身，逐字）
     ========================================================== */

  /* 治療前的影像與切片（p3） */
  function workupReference() {
    return fold('<b>治療前的影像與切片</b>（台大指引 p3，逐字）',
      '<table>' +
      '<tr><td colspan="2"><b>Pre-treatment multi-disciplinary team discussion</b> —— ' +
      '<b>治療前的多專科團隊討論列在第一項，在所有影像與切片之前。</b></td></tr>' +
      '<tr><td><b>影像 Adequate imaging</b></td>' +
      '<td><b>CT<sup>a</sup> ± MRI</b>／<b>Plain x-ray film（原發部位與胸部）</b>／' +
      '<b>± Angiogram</b>／<b>± Bone scan<sup>b</sup></b>／<b>± PET<sup>c</sup></b></td></tr>' +
      '<tr><td>❗<b>特殊情況</b><br>Special cases</td>' +
      '<td>· <b>Myxoid liposarcoma → <u>Spine imaging</u></b>（黏液樣脂肪肉瘤會轉移到脊椎，' +
      '一般的胸部影像抓不到）<br>' +
      '· <b>CNS imaging → ASPS、angiosarcoma、cardiac sarcoma</b>（這三種要照腦部）<br>' +
      '· <b>Spine tumor → PET 與 bone scan 用於 exclusion</b></td></tr>' +
      '<tr><td>註 a</td><td><b>有 lymphoid involvement 的個案建議安排「contrast」chest CT</b>；' +
      '<b>若為 visceral tumor，建議安排 chest CT 與 abdomen／pelvis CT</b>。' +
      '（❗這一條是 <b>v.1 2026 的改版重點之一</b>。）</td></tr>' +
      '<tr><td>註 b</td><td><b>軟組織肉瘤在 <u>deep tumor</u> 懷疑有 bone invasion 時做 bone scan；' +
      '<u>superficial tumor</u> 則為 optional。</b>（同為 2026 改版重點。）</td></tr>' +
      '<tr><td>❗註 c<br>哪些亞型要做 PET</td>' +
      '<td>逐字：<b>「PET is considered for these subtypes: <u>Ewing sarcoma (PNET)、' +
      'Rhabdomyosarcoma、Angiosarcoma、Epithelioid sarcoma、Clear cell sarcoma、Synovial sarcoma</u>. ' +
      'Especially for high-grade malignancies」</b><br>' +
      '<b>六個亞型，不是每個肉瘤都要做 PET。</b><br>' +
      '改版另補：<b>PET/CT 可以考慮作為 sarcoma staging 的選擇（optional），' +
      '可幫助判斷 lymph node 與／或 bone involvement，<u>且應註明影像範圍是否要包含四肢</u>。</b></td></tr>' +
      '<tr><td>❗<b>切片 Planned Biopsy</b></td>' +
      '<td>· <b>Biopsy after imaging</b> —— <b>先影像再切片，順序不可反。</b><br>' +
      '· <b>Placed along planned future resection</b> —— ' +
      '<b>切片路徑要沿著將來要切除的路線走</b>（骨肉瘤那一節寫得更白：' +
      '「如何進入，必須與後續最終手術的 surgical plane 一致，<u>以免 tumor seeding</u>」）。<br>' +
      '· <b>外院已診斷的肉瘤病人，建議由本院肉瘤多專科團隊的病理科醫師再做一次 pathology review</b>' +
      '（逐字：「For patients with sarcoma initially diagnosed in another hospital, a request for ' +
      'pathology review by the Sarcoma MDT\'s pathologists is recommended」）。</td></tr>' +
      '</table>');
  }

  /* v.1 2026 的改版重點（p2） */
  function updatesReference() {
    return fold('<b>v.1 2026 相對 v.1 2025 改了什麼</b>（台大指引 p2，逐字）',
      '<table>' +
      '<tr><td colspan="2"><b>1. 針對影像檢查建議</b></td></tr>' +
      '<tr><td>contrast CT</td><td><b>「依據最新 NCCN guideline 的建議，若有 lymphoid involvement ' +
      '的個案建議可以安排『contrast』chest CT」</b></td></tr>' +
      '<tr><td>Bone scan 的時機</td><td><b>「Soft tissue sarcoma 在 deep tumor 懷疑有 bone invasion ' +
      '時（superficial tumor 則為 optional）」</b></td></tr>' +
      '<tr><td>Spine tumor</td><td><b>「bone scan & PET 建議在 rule out 時用」</b></td></tr>' +
      '<tr><td>Visceral tumor</td><td><b>「chest CT & abd/pelvis CT」</b></td></tr>' +
      '<tr><td>PET/CT</td><td><b>「PET/CT 可以考慮作為 sarcoma staging 的選擇（optional），' +
      '可幫助判斷 lymph node and/or bone involvement，<u>且應註明影像範圍是否要包含四肢</u>」</b></td></tr>' +
      '<tr><td>胸部影像追蹤</td><td><b>「chest CT or CXR：建議<u>至少</u>在半年至一年」</b></td></tr>' +
      '<tr><td colspan="2"><b>2. Preoperative treatment</b></td></tr>' +
      '<tr><td>❗<b>術前放療到手術<br>的間隔</b></td>' +
      '<td><b>「依據 NCCN guideline 建議，<u>preoperative RT 完到手術之間至少間隔 3–6 週</u>，' +
      '較能有效減少 wound complication」</b><br>' +
      '<b>這是 p4 流程圖的註 b（以紅字標示），也是這一版最具操作性的改動。</b></td></tr>' +
      '</table>');
  }

  /* 全身治療選單（p6） */
  function systemicReference() {
    /* ⚠ 用 fold() 不是 foldRx()：這是「整份選單」，不是這位病人的處方。 */
    return fold('<b>姑息性全身治療的完整選單</b>（台大指引 p6，逐字六條）',
      '<table>' +
      '<tr><td><b>第一線</b></td>' +
      '<td>逐字：<b>「<u>Anthracycline-based treatment</u> should be considered as first-line ' +
      'treatment. <u>Liposomal doxorubicin</u> could be considered as an alternative for ' +
      '<u>angiosarcoma</u>. <u>Imatinib</u> could be given as first-line for advanced ' +
      '<u>dermatofibrosarcoma protuberans</u> with confirmed <u>PDGFB translocation</u>.」</b></td></tr>' +
      '<tr><td><b>其他第一線</b></td>' +
      '<td>逐字：<b>「Other first-line systemic treatment include <u>ifosfamide-based regimen, ' +
      'gemcitabine-based regimens, paclitaxel-based, and dacarbazine</u>.」</b></td></tr>' +
      '<tr><td><b>第二線以後</b></td>' +
      '<td>逐字：<b>「Second or later line treatments include: <u>pazopanib, eribulin, trabectedin, ' +
      'ifosfamide, dacarbazine</u>.」</b><br>' +
      '❗<b>注意 ifosfamide 與 dacarbazine 在第一線與第二線都出現</b> —— ' +
      '<b>指引沒有把它們鎖在某一線。</b></td></tr>' +
      '<tr><td>❗<b>免疫治療只給<br>三個亞型</b></td>' +
      '<td>逐字：<b>「Immune checkpoint inhibitors could be considered in <u>some specific subtypes</u> ' +
      'of soft tissue sarcoma including: <u>alveolar soft part sarcoma, angiosarcoma, and ' +
      'undifferentiated pleomorphic sarcoma</u>」</b><br>' +
      '<b>指引只列這三個亞型，不是泛用。</b></td></tr>' +
      '<tr><td><b>基因變異</b></td>' +
      '<td>逐字：<b>「For sarcoma with specific gene alterations, such as <u>NTRK and ALK</u>, ' +
      'targeted agents should be considered.」</b><br>' +
      '❗<b>指引只點名 NTRK 與 ALK 兩個，而且沒有指定藥名。</b></td></tr>' +
      '<tr><td><b>臨床試驗</b></td>' +
      '<td>逐字：<b>「Enrollment into clinical trials is <u>encouraged</u> for locally inoperable or ' +
      'metastatic soft tissue sarcoma patients」</b></td></tr>' +
      '<tr><td>❗<b>指引沒有寫的</b></td>' +
      '<td><b>整份指引沒有任何一個化療劑量、沒有療程數、沒有線別之間的互斥規則。</b>' +
      '<b>劑量請以藥卡與院內處方為準。</b></td></tr>' +
      '</table>');
  }

  /* 追蹤（p3、p5） */
  function followupReference() {
    return fold('<b>追蹤排程</b>（台大指引 p3、p5，逐字）',
      '<table>' +
      '<tr><td><b>胸部影像</b></td>' +
      '<td>逐字：<b>「Chest imaging <u>every 3–6 months for 2–3 yrs</u>, then <u>every 6–12 months ' +
      'for 2 yrs</u>, then <u>annually</u>」</b><br>' +
      '註 d：<b>「影像包含 chest CT 或 CXR，至少每半年到一年」</b></td></tr>' +
      '<tr><td><b>原發部位</b></td>' +
      '<td>逐字：<b>「Post-op baseline and periodic imaging of primary site ' +
      '（MRI／CT／Ultrasonography／X-ray）」</b></td></tr>' +
      '<tr><td>❗<b>高惡性度要更密</b></td>' +
      '<td>逐字：<b>「<u>High grade STS</u>: imaging <u>every 3–4 months in the first 2 years</u>.」</b><br>' +
      '<b>這一條只寫在 p5，p3 那一頁沒有，容易漏掉。</b></td></tr>' +
      '<tr><td>腹膜後肉瘤</td>' +
      '<td>另有規定（p11 註 3）：<b>「The modality of image follow-up is based on the <u>histology and ' +
      'physician\'s choice</u>. <u>Long-term follow-up should be considered due to the risk of late ' +
      'recurrence</u>.」</b> —— <b>腹膜後肉瘤沒有固定排程，但要追得久。</b></td></tr>' +
      '</table>');
  }

  /* 腹膜後肉瘤的定義（p9） */
  function rpsDefReference() {
    return fold('<b>什麼算腹膜後肉瘤（RPS）、什麼不算</b>（台大指引 p9，逐字）',
      '<table>' +
      '<tr><td><b>定義</b></td><td>逐字：<b>「Primary retroperitoneal sarcoma (RPS) is ' +
      '<u>non-visceral</u> origin」</b></td></tr>' +
      '<tr><td><b>Inclusion<br>最常見的亞型</b></td>' +
      '<td><b>well-differentiated liposarcoma、dedifferentiated liposarcoma、leiomyosarcoma、' +
      'solitary fibrous tumor、malignant peripheral nerve sheath tumor、' +
      'unclassified／undifferentiated pleomorphic sarcoma</b></td></tr>' +
      '<tr><td><b>Inclusion<br>較少見</b></td>' +
      '<td><b>synovial sarcoma、myxofibrosarcoma</b>；' +
      '另含 <b>sarcoma of major veins and psoas muscle</b>、<b>ureteric leiomyosarcoma</b></td></tr>' +
      '<tr><td>❗<b>Exclusion</b></td>' +
      '<td><b>Benign tumors、<u>GIST</u>、<u>desmoid tumor</u>、visceral sarcomas、' +
      'adrenal cortical carcinoma、paraganglioma、malignant pheochromocytoma</b></td></tr>' +
      '<tr><td>❗<b>註腳講的<br>是「分類」</b></td>' +
      '<td>該頁註腳逐字：<b>「Sarcoma subtypes that are excluded from retroperitoneal sarcoma (RPS) ' +
      '<u>classification</u> should still be discussed in a multidisciplinary team (MDT) setting ' +
      'to ensure the best possible outcomes for these patients.」</b><br>' +
      '❗<b>原文寫的是被排除於 RPS 的<u>分類（classification）</u>之外</b> —— ' +
      '<b>就照這個詞讀，不要替它加上原文沒有的意思。</b><br>' +
      '❗<b>而且註腳的主語是「sarcoma subtypes」，<u>並沒有點名 GIST</u></b>；' +
      '<b>GIST 請看本站「胃腸道基質瘤（GIST）」條目。</b></td></tr>' +
      '</table>');
  }

  /* 骨肉瘤（p7–p8） */
  function boneReference() {
    return fold('<b>骨肉瘤那一節寫了什麼</b>（台大指引 p7–p8，只有通則沒有流程圖）',
      '<table>' +
      '<tr><td><b>多專科團隊<br>的組成</b></td>' +
      '<td>逐字要求「不管是 primary or metastatic bone cancer 都應該採用團隊治療，並且定期開會」。<br>' +
      '<b>Core group：Musculoskeletal oncologist、Bone pathologist、Medical／pediatric oncologist、' +
      'Radiation oncologist、Musculoskeletal radiologist</b><br>' +
      '<b>Specialist critical in certain cases：Thoracic surgeon、Plastic surgeon、' +
      'Interventional radiologist、Physiatrist、Vascular／general surgeon、Neurosurgeon</b></td></tr>' +
      '<tr><td>❗<b>年齡是第一個分岔</b></td>' +
      '<td><b>骨病灶 → 異常 X 光 →</b><br>' +
      '· <b>&lt; 40 歲：轉介給 orthopedic oncologist；若判斷可能為惡性，' +
      '<u>biopsy 應該在同一治療機構施行</u></b><br>' +
      '· <b>&gt; 40 歲：<u>必須考慮 metastasis 之可能</u></b> —— ' +
      '要做病史與理學檢查，加上 <b>bone scan（或 PET）、chest／abdomen／pelvis CT</b>，' +
      '並抽 <b>CEA、AFP、PSA、CA19-9、CA125、LDH</b> 去找原發部位。<br>' +
      '  <b>找不出原發部位 → 仍轉 orthopedic oncologist 在同一機構切片；' +
      '找出骨骼以外的原發部位 → 改依該癌別的指引治療。</b></td></tr>' +
      '<tr><td>❗<b>切片的三條規矩</b></td>' +
      '<td>· <b>「對於 primary bone cancer 而言，<u>做任何最終治療前都必須先切片</u>」</b><br>' +
      '· <b>「切片<u>最好在將來要做同一治療的中心</u>實施」</b><br>' +
      '· <b>「切片可使用 core needle or surgical biopsy，<u>如何進入，必須與後續最終手術的 ' +
      'surgical plane 一致，以免 tumor seeding</u>」</b><br>' +
      '· <b>「surgeon、musculoskeletal radiologist 與 bone pathologist 之間的通訊聯絡是很重要的」</b></td></tr>' +
      '<tr><td><b>手術</b></td>' +
      '<td>· <b>「廣泛性切除（wide excision）應該達成組織學上的 negative surgical margin」</b><br>' +
      '· <b>「local tumor control 可以使用<u>肢端保留手術</u>或者<u>截肢</u>，視個案而定，' +
      '<u>目前傾向於前者</u>」</b><br>' +
      '· <b>「建議在手術前要經過多科團隊會議討論」</b><br>' +
      '· ❗<b>「<u>手術後輔助性化學治療以及放射線治療並非慣例</u>，建議經過多科團隊會議討論後再進行」</b></td></tr>' +
      '<tr><td>抽血</td><td><b>「CBC、LDH、ALP 的抽血數值對於診斷預後及治療都有影響，' +
      '在術前及術後追蹤上都有角色」</b></td></tr>' +
      '<tr><td>❗<b>生育力保存</b></td>' +
      '<td><b>「<u>使用化療前，fertility tissue（如卵巢等組織）必須先保留</u>。治療必須是多科團隊進行」</b><br>' +
      '<b>這一條在軟組織肉瘤那一節沒有寫，只在骨肉瘤這裡出現。</b></td></tr>' +
      '<tr><td>❗<b>終身追蹤</b></td>' +
      '<td><b>「對於 long-term survivors，<u>目前建議終身追蹤</u>，以避免 surgery、radiation and ' +
      'chemotherapy 的長期副作用」</b></td></tr>' +
      '<tr><td>❗<b>本頁的範圍</b></td>' +
      '<td><b>這一節只有通則，沒有分期別的流程圖，也沒有處方。</b>' +
      '<b>而且本站「分期 TNM」分頁未納入骨肉瘤</b>（AJCC 軟組織肉瘤的四章不含骨骼）。<br>' +
      '<b>指引自己列的參考是 NCCN Bone Cancer V2. 2026。</b></td></tr>' +
      '</table>');
  }

  /* ==========================================================
     院外實證與台灣現況（以下區塊<b>不是</b>台大指引的內容，逐一標明出處）
     查證日 2026-09-13。
     ========================================================== */

  /* ESMO 2021 —— 本指引 p12 自己列的參考文獻之一 */
  function extReference() {
    return fold('<b>院外實證 · ESMO 2021 逐字</b>（本指引 p12 自己列的參考文獻，<b>但以下是 ESMO 的話不是台大的</b>）',
      '<table>' +
      '<tr><td><b>是哪一份</b></td>' +
      '<td>Gronchi A et al. <b>Soft tissue and visceral sarcomas: ESMO–EURACAN–GENTURIS Clinical ' +
      'Practice Guidelines. Ann Oncol 2021;32(11):1348-1365（PMID 34303806）</b>。<br>' +
      '<b>查證日 2026-09-13：這仍是現行版，沒有更新版，也沒有 living guideline 版本。</b><br>' +
      '❗<b>GIST 是另外一份（PMID 34560242），不適用本頁。</b><br>' +
      'ESMO 的等級寫法是 [證據等級, 建議強度]；<b>沒有標等級的就是 ESMO 認定的常規做法，' +
      '不要自己替它補一個等級。</b></td></tr>' +
      '<tr><td><b>切片</b></td>' +
      '<td><b>粗針 14–16 G</b>；<b>切片路徑要能被之後的根治手術一併切掉</b>' +
      '——❗<b>原文在這裡加了括號 <u>「(except for RPSs)」</u></b>，' +
      '<b>也就是腹膜後肉瘤做不到這件事</b>。<b>&lt; 3 cm 的表淺腫瘤</b>可以直接做切除式切片。<br>' +
      '❗逐字：<b>「A biopsy may underestimate the tumour malignancy grade」</b><br>' +
      '<b>以上都沒有標等級。</b></td></tr>' +
      '<tr><td><b>手術</b></td>' +
      '<td>逐字：<b>「en bloc excision with R0 margins <u>[II, A]</u>」</b>。<br>' +
      '❗<b>ESMO 沒有「計畫性的邊際切除」這種通則</b> —— <b>原文只在 ' +
      '<u>atypical lipomatous tumour</u> 允許沿假包膜的 marginal excision <u>[IV, B]</u></b>。<br>' +
      '<b>非計畫切除（unplanned resection）之後<u>必須考慮再切除 [IV, A]</u>；R2 則是 mandatory。</b><br>' +
      '❗逐字：<b>「adjuvant ChT should <u>never</u> be intended to compensate for ' +
      'inadequate surgery」</b></td></tr>' +
      '<tr><td><b>放療</b></td>' +
      '<td>高惡性度 <b>[II, B]</b>；❗<b>真正做到腔室切除（compartmental resection）者<u>不建議</u>放療 ' +
      '[IV, E]</b>。劑量：<b>術前 50 Gy、術後 up to 66 Gy</b>。<br>' +
      '❗逐字：<b>「Local control and OS are not influenced by the timing of RT. However, ' +
      'preoperative RT is able to <u>offset the negative prognostic impact of R1 margins</u> ' +
      'much more than post-operative RT.」</b><br>' +
      '<b>先做後做不影響結果，但對 R1 的補救力道，術前明顯大於術後。</b></td></tr>' +
      '<tr><td>❗<b>兩份指引<br>數字不一樣</b></td>' +
      '<td><b>ESMO：最後一次化療或放療之後<u>隔 4–8 週</u>再手術。</b><br>' +
      '<b>台大 p4 註 b：preoperative RT 完到手術<u>至少間隔 3–6 週</u>，較能減少 wound complication。</b><br>' +
      '❗<b>台大的數字比較短。本頁流程以台大為準，但排刀時要知道 ESMO 不是這樣寫的。</b></td></tr>' +
      '<tr><td><b>輔助與<br>術前化療</b></td>' +
      '<td>逐字（<b>原文的縮寫已展開</b>）：<b>「Formally, adjuvant and neoadjuvant ' +
      '<u>anthracycline plus ifosfamide</u> ChT is <u>not a standard treatment</u>」</b>。<br>' +
      '要用的時候，原文舉的門檻是 <b>Sarculator 預測 10 年存活 &lt; 60%</b>；' +
      '<b>術前優於術後，<u>≥ 3 個療程即可（與 5 個療程非劣）[II, B]</u></b>。<br>' +
      '❗<b>ASPS 與亮細胞肉瘤（clear cell sarcoma）<u>不應</u>接受輔助或術前化療。</b></td></tr>' +
      '<tr><td>❗<b>腹膜後的<br>切片路徑</b></td>' +
      '<td><b>經腹膜後路徑優於經腹腔路徑；<u>開放式切片與腹腔鏡切片 must be avoided</u>。</b><br>' +
      '<b>台大指引沒有寫腹膜後的切片路徑。</b></td></tr>' +
      '</table>');
  }

  /* 分級 —— 台大指引全文沒有寫分級方法，但整個 p4 分岔掛在 grade 上 */
  function gradingReference() {
    return fold('❗<b>整條路掛在 grade 上，但指引沒有寫怎麼分級</b>（本區塊為院外資料）',
      '<table>' +
      '<tr><td>❗<b>台大這份<br>沒有寫</b></td>' +
      '<td><b>全文 12 頁 0 次出現 FNCLCC，也沒有寫用哪一套分級、怎麼算分。</b>' +
      '<b>但 p4 的第一個分岔就是 Grade 1 對 Grade 2/3。</b></td></tr>' +
      '<tr><td><b>FNCLCC<br>是什麼</b></td>' +
      '<td>原始論文 <b>Trojani M et al. Int J Cancer 1984;33(1):37-42（PMID 6693192）</b>：' +
      '155 人，七項候選因子最後留下<b>三項：tumor differentiation、mitosis count、tumor necrosis</b>。<br>' +
      '❗<b>1984 原文的摘要只列因子名稱，<u>沒有任何評分切點</u></b>。</td></tr>' +
      '<tr><td><b>三項的<br>切點</b></td>' +
      '<td><b>differentiation 1／2／3</b>；' +
      '<b>mitosis per 10 HPF：0–9 → 1、10–19 → 2、≥ 20 → 3</b>；' +
      '<b>necrosis：無 → 0、&lt; 50% → 1、≥ 50% → 2</b>。' +
      '<b>總分 G1 = 2–3、G2 = 4–5、G3 = 6–8</b>；表註 <b>1 HPF = 0.1734 mm²</b>。<br>' +
      '❗<b>這張切點表是第三方轉載</b>（Europe PMC PMC13423576／PMID 42535253 的 Table 1，' +
      '該表自註 "Modified from Trojani et al."）；<b>標準引用來源 Coindre 2006 ' +
      '（PMID 17090186）全文取不到，不要把切點寫成 Trojani 1984 原文。</b></td></tr>' +
      '<tr><td>❗<b>門診最該<br>知道的兩句</b></td>' +
      '<td>Coindre 2006 摘要逐字：<b>「grading should <u>not</u> be used on … ' +
      'dedifferentiated liposarcoma」</b>、<b>「Current grading is <u>not suitable for ' +
      'core needle biopsies</u>」</b>。<br>' +
      '❗<b>而術前要不要做術前治療，幾乎都是靠粗針切片的 grade 在決定。</b>' +
      '<b>STRASS 全文自己也承認「a large proportion of patients was not evaluable for grade ' +
      'or differentiation」。</b><br>' +
      '<b>也就是說：這一步的分級本身有不確定性，這是註 a 要多專科討論的實質理由之一。</b></td></tr>' +
      '<tr><td><b>再現性</b></td>' +
      '<td>Coindre JM et al. Cancer 1986;58(2):306-9（PMID 3719523）：15 位病理醫師，' +
      '<b>necrosis 81%／differentiation 74%／mitosis 73%，整體 grade 一致度 75%（kappa 68%）</b>。<br>' +
      'FNCLCC 對 NCI 系統：JCO 1997;15(1):350-62（PMID 8996162），410 人，' +
      '<b>34.6% 分級不一致</b>，FNCLCC 略優。</td></tr>' +
      '<tr><td><b>AJCC 第 8 版<br>的兩個坑</b></td>' +
      '<td>可查證來源 Jpn J Clin Oncol 2019;49(2):103-107（PMID 30423153）：<br>' +
      '❗<b>「AnyT N1 M0 在四肢與軀幹算 Stage IV，在腹膜後仍是 Stage IIIB」</b> —— ' +
      '<b>兩個部位不可共用一張表。</b><br>' +
      '❗<b>腫瘤深度（superficial／deep）已被完全刪除。</b><br>' +
      '大小分四段：<b>≤ 5、&gt; 5–10、&gt; 10–15、&gt; 15 cm</b>。</td></tr>' +
      '</table>');
  }

  /* 腹膜後肉瘤的術前放療實證 */
  function rpsEvidenceReference() {
    return fold('<b>院外實證 · 腹膜後肉瘤要不要做術前放療（STRASS／STREXIT）</b>（<b>非台大內容</b>）',
      '<table>' +
      '<tr><td>❗<b>STRASS<br>主要終點是陰性的</b></td>' +
      '<td><b>Bonvalot S et al. Lancet Oncol 2020;21(10):1366-1377（PMID 32941794）</b>' +
      '——這是台大 p12 自己列的參考文獻之一。<br>' +
      '主要終點 <b>abdominal recurrence-free survival：4.5 年 vs 5.0 年，' +
      '<u>HR 1.01（95% CI 0.71–1.44），p = 0.95</u></b>。<br>' +
      '❗作者結論逐字：<b>「Preoperative radiotherapy <u>should not be considered as standard of ' +
      'care</u> treatment for retroperitoneal sarcoma.」</b><br>' +
      '放療劑量 <b>50.4 Gy／28 fx</b>；<b>Grade 3-4 淋巴球低下 77% vs 1%</b>，1 例治療相關死亡。</td></tr>' +
      '<tr><td>❗<b>最常被抄錯的<br>那個 HR</b></td>' +
      '<td><b>脂肪肉瘤次群（n = 198）同一段裡有三個數字，不是同一個定義</b>：' +
      '<b>原始 ARFS 定義 HR 0.83（0.54–1.29，不顯著）</b>／SA1 分析 HR 0.64／' +
      '<b>SA2 分析 HR 0.62（0.38–1.02）← 最常被引用的就是這一個</b>。<br>' +
      '❗原文自述：<b>「These post-hoc analyzes were <u>unplanned</u>.」</b><br>' +
      '❗作者自己寫的效力限制：<b>「the trial was powered to identify a 20% difference ' +
      '(entire cohort)」</b>、<b>「these subgroup analyses were not preplanned」</b>。</td></tr>' +
      '<tr><td>❗<b>STREXIT<br>不是隨機試驗</b></td>' +
      '<td><b>Callegaro D et al. Ann Surg 2023;278(1):127-134（PMID 35833413）</b>' +
      '——也是台大 p12 列的參考文獻。<b>設計是非隨機的傾向分數配對</b>：' +
      'STRASS 的 10 個中心在同期<u>未入組</u>的連續病人，831 → 727 → 1:1 配對後 202 人。<br>' +
      '逐字：<b>「<u>In the pooled cohort analysis</u>, RT … better ARFS in patients with liposarcoma ' +
      '[N = 321, HR 0.61; 95% CI 0.42-0.89]. In particular, patients with <u>well-differentiated ' +
      'liposarcoma and G1-2 dedifferentiated liposarcoma</u> (n = 266) … (HR 0.63; 95% CI 0.40-0.97) ' +
      '<u>while patients with G3 DDLPS and leiomyosarcoma had not</u>.」</b><br>' +
      '❗<b>0.61 與 0.63 都是 STRASS 加 STREXIT 的<u>合併世代</u>，不是隨機化結果</b> —— ' +
      '<b>頁面上不可以寫成「隨機試驗證實」。</b><br>' +
      '❗<b>而且原文的範圍是 WDLPS 與 G1-2 DDLPS 這兩種，比「其他 G1-2 肉瘤」窄。</b><br>' +
      '❗<b>兩個試驗的 ARFS 定義不同，兩邊的數字不能直接比。</b><br>' +
      '<b>合併世代也沒有看到存活或遠端轉移的差別。</b></td></tr>' +
      '<tr><td><b>術前化療</b></td>' +
      '<td><b>STRASS2（NCT04031677）仍在收案</b>：第三期，n = 250，主要終點 disease free survival，' +
      '<b>主要完成日 2027-04-21</b>，收案限高風險平滑肌肉瘤或脂肪肉瘤。<b>目前沒有結果。</b><br>' +
      '旁證：<b>Surgery 2026;194:110187（PMID 41936769）</b>以 NCDB 2,215 人做 target trial ' +
      'emulation，<b>術前化療未改善存活（HR 0.73–0.75，信賴區間均跨 1）</b>。</td></tr>' +
      '</table>');
  }

  /* 全身治療的關鍵試驗 */
  function trialReference() {
    return fold('<b>院外實證 · 這些藥的關鍵試驗，與最常被抄錯的地方</b>（<b>非台大內容</b>）',
      '<table>' +
      '<tr><td><b>為什麼<br>第一線還是<br>doxorubicin</b></td>' +
      '<td><b>GeDDiS｜Seddon B et al. Lancet Oncol 2017;18(10):1397-1410（PMID 28882536）</b>：' +
      'gemcitabine 加 docetaxel 對 doxorubicin，<b>24 週無惡化比例 46.3% 對 46.4%</b>，' +
      'PFS <b>HR 1.28（0.99–1.65），p = 0.06</b>。結論是 <b>doxorubicin 仍應是第一線</b>。</td></tr>' +
      '<tr><td><b>pazopanib</b></td>' +
      '<td><b>PALETTE｜van der Graaf WT et al. Lancet 2012;379(9829):1879-86（PMID 22595799）</b>：' +
      '<b>PFS 4.6 對 1.6 個月，HR 0.31，p &lt; 0.0001</b>；' +
      '❗<b>但總存活 12.5 對 10.7 個月，HR 0.86，p = 0.25 —— 不顯著。</b><br>' +
      '❗<b>收案就排除脂肪肉瘤（限 non-adipocytic）</b>，健保 9.41 的排除名單與此呼應。<br>' +
      '❗<b>但「脂肪肉瘤無效」是說得太滿</b>：EORTC 62043 的脂肪系層 <b>5/19（26%）</b>' +
      '達 12 週無惡化、該層提早關閉；而 <b>Samuels 2017 Cancer 單臂 n = 41 的 12 週無惡化率 ' +
      '68.3%，p = .0002</b>。<b>正確的說法是「證據互相衝突」，不是「沒有證據」。</b></td></tr>' +
      '<tr><td><b>eribulin</b></td>' +
      '<td>主試驗 <b>Schöffski P et al. Lancet 2016;387(10028):1629-37（PMID 26874885）</b>：' +
      '<b>OS 13.5 對 11.5 個月，HR 0.77，p = 0.0169</b>；<b>收案要求至少兩線前治療（含 anthracycline）</b>。<br>' +
      '❗<b>這個試驗<u>只收脂肪肉瘤與平滑肌肉瘤</u>兩種</b>，不是全體軟組織肉瘤。<br>' +
      '次群 <b>Demetri GD et al. JCO 2017;35(30):3433-3439（PMID 28854066）</b>：' +
      '<b>脂肪肉瘤 OS 15.6 對 8.4 個月，HR 0.51（0.35–0.75），p &lt; .001</b>；' +
      'PFS 2.9 對 1.7 個月，HR 0.52。<b>該文明講脂肪肉瘤是「預設分層隨機」的次群</b>' +
      '（與上面 STRASS 的 post-hoc 性質完全不同）。<br>' +
      '❗<b>平滑肌肉瘤那一格的 HR 取不到原文，本頁不寫數字</b>；' +
      '<b>措辭只能是「未顯示效益」，不是「無效」。</b></td></tr>' +
      '<tr><td>❗<b>trabectedin</b></td>' +
      '<td><b>Demetri GD et al. JCO 2016;34(8):786-93（PMID 26371143）</b>，n = 518。' +
      '❗<b>主要終點是總存活，而且是<u>陰性</u>：12.4 對 12.9 個月（trabectedin 較短），' +
      'HR 0.87，p = .37。</b><br>' +
      '陽性的是次要終點 PFS：<b>4.2 對 1.5 個月，HR 0.55，p &lt; .001</b>；' +
      '<b>作者用的字是 superior <u>disease control</u>。</b><br>' +
      '❗<b>所以不可以對病人說「延長存活」。</b></td></tr>' +
      '<tr><td>❗<b>olaratumab<br>已經退場</b></td>' +
      '<td>第二期 <b>Lancet 2016;388(10043):488-97（PMID 27291997）</b>曾看到 ' +
      '<b>OS 26.5 對 14.7 個月</b>（❗<b>該試驗的顯著水準設在 0.2</b>）；' +
      '第三期 <b>ANNOUNCE｜JAMA 2020;323(13):1266-1276（PMID 32259228）</b>，n = 509，' +
      '<b>兩個主要終點全部陰性</b>（全體 HR 1.05，p = .69；平滑肌肉瘤 HR 0.95，p = .76）。<br>' +
      '<b>台灣藥證 衛部菌疫輸字第 001075 號已於 2019/09/04 自請註銷</b>；' +
      '<b>台大這份指引與 ESMO 2021 都 0 次提到它。</b><b>台大處方集也查無此藥。</b></td></tr>' +
      '<tr><td><b>DFSP 的<br>imatinib</b></td>' +
      '<td><b>Rutkowski P et al. JCO 2010;28(10):1772-9（PMID 20194851）</b>：' +
      '❗<b>是 EORTC 與 SWOG 兩個第二期合併，<u>總共只有 24 人，兩個試驗都提前關閉</u></b>。' +
      '❗<b>該摘要內部矛盾（寫成 4%），實際反應率約 46%（11/24），不要抄 4%。</b><br>' +
      '長期資料 <b>Eur J Surg Oncol 2017;43(6):1134-1141（PMID 28365129）</b>：31 人，' +
      '<b>5 年無惡化 58%、存活 64%</b>；❗<b>典型 DFSP 的 5 年無惡化 93%，' +
      '纖維肉瘤變異型只有 33%</b>。</td></tr>' +
      '<tr><td><b>免疫治療<br>的三個亞型</b></td>' +
      '<td><b>ASPS｜atezolizumab</b>：NEJM 2023;389(10):911-921（PMID 37672694），' +
      '單臂第二期 <b>n = 52，反應率 37%（19/52），中位反應持續 24.7 個月，中位無惡化存活 20.8 個月</b>。<br>' +
      '<b>UPS｜SARC028</b>：Lancet Oncol 2017;18(11):1493-1501（PMID 28988646），' +
      '❗<b>主要終點未達標</b>；分型反應率 <b>UPS 4/10（40%）、脂肪肉瘤 2/10、滑膜肉瘤 1/10、' +
      '<u>平滑肌肉瘤 0/10</u></b>。❗<b>每一格只有 10 個人。</b><br>' +
      '<b>血管肉瘤｜SWOG S1609 DART 第 51 組</b>：J Immunother Cancer 2021;9(8)（PMID 34380663），' +
      '<b>ipilimumab 1 mg/kg q6w 加 nivolumab 240 mg q2w</b>，' +
      '❗<b>只有 16 人可評估，反應率 25%（4/16）</b>；<b>頭皮或顏面皮膚原發 3/5</b>。<br>' +
      '❗<b>UPS 的擴充世代最終論文查無</b>；PD-L1 免疫組化的回溯研究不能當療效依據。</td></tr>' +
      '<tr><td><b>NTRK 與 ALK</b></td>' +
      '<td><b>larotrectinib</b>：NEJM 2018;378(8):731-739（PMID 29466156），55 人跨 17 種腫瘤，' +
      '<b>反應率 75%（獨立判讀）</b>。<b>entrectinib</b>：Lancet Oncol 2020;21(2):271-282' +
      '（PMID 31838007），54 人，<b>反應率 57%</b>。' +
      '❗<b>兩篇都沒有拆出肉瘤專屬的反應率。</b><br>' +
      '<b>ALK 於發炎性肌纖維母細胞瘤的 crizotinib</b>：NEJM 2010;363(18):1727-33（PMID 20979472）' +
      '❗<b>被標為 Case Reports，<u>只有 2 名病人</u></b> —— <b>只能當機轉證據，不能當反應率。</b>' +
      '（但台灣藥證確實有這一條，見健保與藥證區塊。）</td></tr>' +
      '</table>');
  }

  /* 台灣：藥證與健保（本頁最實務的一塊） */
  function nhiReference() {
    return fold('<b>台灣現況 · 藥證與健保</b>（食藥署西藥許可證資料集＋健保支付標準第 9 章，查詢日 2026-09-13）',
      '<table>' +
      '<tr><td>❗<b>一句話<br>結論</b></td>' +
      '<td><b>健保支付標準第 9 章 141 條裡，<u>只有 6 條提到「肉瘤」</u></b>，其餘 134 條全文 0 次。<br>' +
      '❗<b>而且 eribulin 與 pazopanib 這兩條是互補、不重疊的</b>：' +
      '<b>脂肪肉瘤只能走 eribulin，平滑肌肉瘤只能走 pazopanib。</b>' +
      '<b>這是門診選藥時最直接的一刀。</b></td></tr>' +
      '<tr><td><b>健保的<br>6 條</b></td>' +
      '<td><b>9.5.1 paclitaxel</b>：卡波西氏肉瘤（愛滋相關），<b>不是軟組織肉瘤</b><br>' +
      '<b>9.14 liposomal doxorubicin</b>：❗<b>只有愛滋相關卡波西氏肉瘤</b> —— ' +
      '<b>沒有血管肉瘤、沒有軟組織肉瘤</b><br>' +
      '<b>9.22 imatinib</b>：隆突性皮膚纖維肉瘤（❗<b>是 9.22 不是 9.31</b>）<br>' +
      '<b>9.41 pazopanib</b>：晚期軟組織肉瘤 —— ❗<b>條文明文排除 8 個亞型，' +
      '其中包括脂肪惡性肉瘤</b><br>' +
      '<b>9.48 eribulin</b>：❗<b>只有脂肪肉瘤</b>；<b>每次申請以 3 個療程為限</b><br>' +
      '<b>9.95 larotrectinib</b>：NTRK 融合的實體腫瘤（含肉瘤）</td></tr>' +
      '<tr><td>❗<b>指引寫了<br>健保卻不給</b></td>' +
      '<td><b>liposomal doxorubicin</b>：台大 p6 明文寫它是<b>血管肉瘤的替代</b>，' +
      '但<b>健保 9.14 與台灣藥證（衛署藥製字第 041037 號）都只有愛滋相關卡波西氏肉瘤與卵巢癌</b> —— ' +
      '<b>用在血管肉瘤是仿單外且自費。</b><br>' +
      '<b>trabectedin</b>：<b>完全沒有健保</b>（藥證 衛部藥輸字第 027370 號，有效至 2028/01/09）。<br>' +
      '<b>dacarbazine</b>：❗<b>台灣藥證只有惡性黑色素瘤，連肉瘤兩個字都沒有</b> —— ' +
      '<b>指引把它列在第一線與後線，但那是仿單外。</b><br>' +
      '<b>gemcitabine、docetaxel</b>：<b>台灣藥證都沒有肉瘤</b>；' +
      '<b>paclitaxel 只有愛滋相關卡波西氏肉瘤第二線</b>。<br>' +
      '<b>免疫檢查點抑制劑</b>：<b>健保 0 條提到肉瘤</b>。</td></tr>' +
      '<tr><td><b>台灣藥證<br>寫得出「肉瘤」<br>的藥</b></td>' +
      '<td><b>ifosfamide</b>（衛署藥輸字第 018479 號）：逐字<b>「軟組織肉瘤（平滑肌肉瘤、橫紋肌肉瘤、' +
      '軟骨肉瘤）」</b><br>' +
      '<b>pazopanib</b>（衛署藥輸字第 025433 號）：<b>「適用於治療先前曾接受化療的晚期軟組織肉瘤」</b>' +
      '——❗<b>藥證比健保寬，健保才有那 8 個排除亞型。</b><br>' +
      '<b>eribulin</b>（衛部藥輸字第 026140 號）：<b>「無法手術切除或轉移性<u>脂肪肉瘤</u>，' +
      '先前應至少接受一次含 anthracycline 之全身化療」</b><br>' +
      '<b>trabectedin</b>（衛部藥輸字第 027370 號）：<b>「無法切除或轉移性脂肪肉瘤或平滑肌肉瘤，' +
      '且曾接受一種含 anthracycline 療程」</b><br>' +
      '<b>imatinib</b>（衛署藥輸字第 024027 號）：<b>「無法手術切除、復發性或轉移性且有 PDGFR ' +
      '基因重組之隆突性皮膚纖維肉瘤」</b><br>' +
      '<b>atezolizumab</b>（衛部菌疫輸字第 001050 號）：<b>「肺泡狀軟組織肉瘤：… 2 歲以上無法切除或' +
      '轉移性肺泡狀軟組織肉瘤」</b>——<b>這是台灣唯一有肉瘤適應症的免疫藥。</b><br>' +
      '<b>crizotinib</b>（衛署藥輸字第 025938 號）第 4 項：<b>「無法切除、復發性或頑固性發炎性肌纖維' +
      '母細胞瘤（IMT）且 ALK 陽性的 1 歲以上病人」</b>——<b>直接對應指引的 ALK 那一條。</b><br>' +
      '<b>larotrectinib／entrectinib</b>：<b>NTRK 融合的泛實體腫瘤</b>（三個並列條件，' +
      '含「沒有合適的替代治療選項」）。</td></tr>' +
      '<tr><td>❗<b>第一線骨幹<br>的藥證用詞</b></td>' +
      '<td><b>doxorubicin</b>（衛署藥輸字第 022712 號等）的適應症逐字是' +
      '<b>「急慢性白血球過多症、硬瘤、淋巴瘤、<u>軟纖維性肉瘤</u>、交感神經母細胞瘤、乳癌、肺癌」</b>。<br>' +
      '❗<b>用的是「軟纖維性肉瘤」這個舊譯，<u>不是「軟組織肉瘤」</u></b> —— ' +
      '<b>整份指引的第一線骨幹，在台灣的仿單上並沒有現代的病名。</b>' +
      '<b>送審或藥事審查被質疑時，知道這件事比較好解釋。</b></td></tr>' +
      '<tr><td><b>放療</b></td>' +
      '<td><b>質子治療 2026-01-01 起納入健保</b>，代碼 <b>36026B</b> 明文含' +
      '<b>「惡性軟組織肉瘤（除骨肉瘤外）」</b>——❗<b>但限 19 歲以下</b>，成人自費。<br>' +
      '<b>重粒子（碳離子）查無支付條文。</b></td></tr>' +
      '<tr><td>❗<b>查證時<br>踩到的坑</b></td>' +
      '<td><b>9.41 pazopanib 的官方 PDF 誤附了 Bortezomib 的附表九之三</b>（檔案本身錯置）。<br>' +
      '<b>隆突性皮膚纖維肉瘤在不同條文用了兩個不同的中文譯名</b>，只用一個詞搜會漏。<br>' +
      '❗<b>Votrient 400 mg 的藥證已於 2021/06/08 撤銷，台灣只剩 200 mg</b>。<br>' +
      '<b>desmoid 的 nirogacestat：台灣無藥證、無健保。</b></td></tr>' +
      '</table>');
  }

  /* ==========================================================
     版面
     ========================================================== */
  function stsPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">院內來源：<b>台大肉瘤臨床診療指引</b>（文件編號 50710-2-000049，' +
      '<b>版次 08</b>，2026/06/16 第 87 次癌症醫療委員會修訂通過，共 12 頁；' +
      '標題頁自稱 <b>Sarcoma Clinical Guidelines in Oncology, NTUH – V.1 2026</b>）。' +
      '<b>12 張圖已全部 render 成 PNG 逐張看圖判讀，箭頭走向以看圖為準。</b><br>' +
      '這份指引涵蓋<b>三個實體</b>：<b>軟組織肉瘤（p2–p6）</b>、<b>骨肉瘤（p6–p8，只有通則沒有流程圖）</b>、' +
      '<b>腹膜後肉瘤 RPS（p9–p12）</b>。<br>' +
      '❗<b>只讀文字層會漏掉的三處</b>：' +
      '<b>①</b> 可切除流程的 Grade 2/3 那一條<b>有兩條並列的進入路線</b>，在圖上用大括號匯進同一個 R0／R1 分岔；' +
      '<b>②</b> Grade 2/3 的進入條件是<b>三選一</b>（Grade 2/3、<u>或</u> ≥ 5 cm、<u>或</u>術前確認無法達乾淨切緣），' +
      '而<b>上面那一支的標籤只有「Grade 1<sup>a</sup>」、沒有附任何大小或切緣條件</b> —— ' +
      '<b>所以 Grade 1 且 ≥ 5 cm 的腫瘤同時符合上下兩支，指引沒有寫優先序</b>；' +
      '<b>③</b> 腹膜後肉瘤術後的「Adjuvant Tx」<b>有一條線折回 Follow-up</b>，不是兩個並列的終點。<br>' +
      '❗<b>GIST 不走本頁</b> —— 指引 p9 把它明文列在腹膜後肉瘤的 Exclusion；' +
      '同頁註腳只說被排除的 <b>sarcoma subtypes</b> 仍應在多專科團隊會議中討論，' +
      '<b>原文用的詞是 classification（分類），註腳並沒有點名 GIST</b>。' +
      '請看本站「胃腸道基質瘤（GIST）」條目。<br>' +
      '❗<b>這份指引沒有寫分級用哪一套系統、也沒有寫怎麼算分</b>，' +
      '但可切除那一頁的整個分岔都掛在 grade 上 —— <b>分級的實務限制見步驟 3 的參考區塊。</b><br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b></p>';
    h += '<div class="onc-path" id="stPath">';

    h += node0('st_n1', '1', '現在要決定的是哪一段？',
      opt('scope', 'local', '侷限性軟組織肉瘤（Stage I–III）', '台大指引 p3–p4') +
      opt('scope', 'meta', '轉移性（Stage IV）或無法手術 —— 要決定全身治療', '台大指引 p5–p6') +
      opt('scope', 'rps', '腹膜後肉瘤 RPS', '台大指引 p9–p12，獨立一套') +
      opt('scope', 'bone', '骨肉瘤 Bone sarcoma', '同一份指引 p7–p8，但只有通則'),
      workupReference() + updatesReference());

    /* ── 侷限性 ── */
    h += node('st_n_resect', '2', '影像與多專科討論後，判斷可不可以切除？',
      opt('resect', 'yes', '可切除 Resectable', '') +
      opt('resect', 'no', '不可切除 Unresectable', ''));
    h += node('st_n_grade', '3', '❗下面那一條是三選一，任一成立就走下面那一條',
      opt('grade', 'g1', '<b>Grade 1</b>，而且沒有 ≥ 5 cm、也沒有術前確認的切緣問題',
        '圖上這一支只寫「Grade 1<sup>a</sup>」；後面兩個條件是本頁為了讓兩支互斥才加的，指引沒有寫') +
      opt('grade', 'g23', '<b>Grade 2／3</b>，<u>或</u>腫瘤 <b>≥ 5 cm</b>，<u>或</u>術前已確認無法達到乾淨切緣',
        '❗三個條件任一成立即可'),
      gradingReference());
    h += recBox('st_r_grade', '建議處置 · 這一格要先決定什麼');
    h += node('st_n_route', '4', '❗這兩條路在指引上是並列的，要選一條',
      opt('route', 'upfront', '直接手術 Surgery', '') +
      opt('route', 'neoadj', '術前 RT，或 C/T ± RT，之後再手術', '❗術前 RT 完到手術要間隔 3–6 週'));
    h += recBox('st_r_route', '建議處置 · 先開刀還是先做術前治療');
    h += node('st_n_margin', '4', '手術後的病理切緣？',
      opt('margin', 'r0', '<b>R0</b> resection（切緣陰性）', '') +
      opt('margin', 'r1', '<b>R1</b> resection（顯微鏡下切緣陽性）', ''));
    h += recBox('st_r_margin', '建議處置 · 術後要不要加治療');
    h += fuBox('st_f_local');
    h += node('st_n_ures', '3', '做完術前治療後再評估，結果是？',
      opt('ures', 'now_res', '轉為可切除 Resectable', '→ 回到可切除的流程') +
      opt('ures', 'amput', '要考慮截肢 Amputation？', '指引把它單獨列為一個出口') +
      opt('ures', 'still', '仍然不可切除 Unresectable', '→ 五個並列選項'));
    h += recBox('st_r_ures', '建議處置 · 不可切除的下一步');
    h += fuBox('st_f_ures');

    /* ── 轉移性 ── */
    h += node('st_n_sub', '2', '組織型態有沒有落在指引特別點名的那幾種？',
      opt('sub', 'generic', '沒有特別的亞型', '走一般的第一線與後線') +
      opt('sub', 'angio', '<b>血管肉瘤 Angiosarcoma</b>', '指引指定可用 liposomal doxorubicin 替代') +
      opt('sub', 'dfsp', '<b>DFSP</b> 且已確認 <b>PDGFB translocation</b>', '指引指定 imatinib 可作第一線') +
      opt('sub', 'asps', '<b>肺泡狀軟組織肉瘤 ASPS</b>',
        '指引列為可考慮免疫治療的三個亞型之一；❗台灣<b>有</b>藥證') +
      opt('sub', 'ups', '<b>未分化多形性肉瘤 UPS</b>',
        '指引列為可考慮免疫治療的三個亞型之一；台灣無藥證') +
      opt('sub', 'fusion', '已驗到 <b>NTRK</b> 或 <b>ALK</b> 變異', '指引指定應考慮標靶'),
      systemicReference());
    h += node('st_n_line', '3', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線或更後線', ''));
    h += recBox('st_r_meta', '建議處置 · 全身治療');
    h += fuBox('st_f_meta');

    /* ── 腹膜後肉瘤 ── */
    h += node('st_n_rstate', '2', '多專科團隊評估後，可切除性屬於哪一種？',
      opt('rstate', 'res', '可切除 Resectable', '') +
      opt('rstate', 'border', '邊緣可切除 Borderline resectable', '') +
      opt('rstate', 'unres', '不可切除 Unresectable', ''),
      rpsDefReference());
    h += recBox('st_r_rps', '建議處置 · 腹膜後肉瘤');
    h += fuBox('st_f_rps');

    /* ── 骨肉瘤 ── */
    h += recBox('st_r_bone', '建議處置 · 骨肉瘤在這份指引裡的位置');

    h += '<div class="flow-reset"><button class="back-btn" onclick="stReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="st_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="st_drugs"></div>';
    return h;
  }

  /* ---------- 顯示控制 ---------- */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }
  function collapseAll() {
    var root = el('stPath');
    if (!root) return;
    root.querySelectorAll('.st-node').forEach(function (n) { if (n.id !== 'st_n1') n.classList.add('hidden'); });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
  }
  function liOf(t) {
    if (t.indexOf('@ev ') === 0) return '<li class="ev">' + t.slice(4) + '</li>';
    if (t.indexOf('<span class="rx-h">') === 0) return '<li class="hd">' + t + '</li>';
    return '<li>' + t + '</li>';
  }
  function fill(id, cls, title, lines, src, extra) {
    var e = el(id);
    if (!e) return;
    var lb = e.querySelector('.rec-label');
    var lt = lb ? lb.textContent : '建議處置';
    e.className = 'flow-rec ' + cls;
    e.innerHTML = '<div class="rec-label">' + lt + '</div><div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') + (src ? '<div class="rec-note">' + src + '</div>' : '');
  }
  function fu(id, html) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = '<div class="fu-h">接下來怎麼追蹤</div><ul class="fu-list">' + html + '</ul>';
  }

  var FU_LOCAL = '<li><b>胸部影像：每 3–6 個月做 2–3 年，之後每 6–12 個月做 2 年，之後每年一次</b>' +
    '（影像可用 chest CT 或 CXR，至少每半年到一年）。</li>' +
    '<li><b>原發部位：術後先照一次 baseline，之後定期追蹤</b>（MRI／CT／超音波／X 光）。</li>' +
    '<li>❗<b>高惡性度軟組織肉瘤：前 2 年每 3–4 個月就要照一次</b> —— ' +
    '<b>這一條只寫在 p5，p3 那一頁沒有，很容易漏掉。</b></li>';

  /* ==========================================================
     侷限性軟組織肉瘤（p4）
     ========================================================== */
  var MDT_A = '❗<b>註 a（兩條分支共用）</b>：<b>「MDT discussion <u>before management</u> strongly ' +
    'recommended」</b> —— <b>是「治療前」就要討論，不是開完刀才討論。</b>' +
    'p3 也把 <b>Pre-treatment multi-disciplinary team discussion 列在所有影像與切片之前的第一項。</b>';

  function renderGrade() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.grade === 'g1') {
      cls = 'rec-nonop';
      title = 'Grade 1（本頁另加「&lt; 5 cm、無切緣疑慮」）<br>→ 直接手術，<b>不做術前治療</b>';
      L.push(H('主建議', '台大指引 p4'));
      L.push('<b>Grade 1<sup>a</sup> → Surgery</b>（圖上這一條沒有術前治療的分支）。');
      L.push('❗<b>這一條和下面那一條最大的差別是「沒有術前治療的選項」</b> —— ' +
        '<b>術前 RT 或 C/T 只掛在 Grade 2/3 那一條。</b>');
      L.push('❗<b>圖上這一支的標籤<u>只有「Grade 1<sup>a</sup>」這幾個字</b> —— ' +
        '<b>沒有寫「&lt; 5 cm」，也沒有寫切緣條件。</b>' +
        '<b>本頁把這兩個條件加在這一支，只是為了讓上下兩支互斥可選，' +
        '它們是本頁加的，不是指引寫的。</b>');
      L.push('❗<b>所以一個 Grade 1 但 ≥ 5 cm 的腫瘤，會<u>同時符合上下兩支的標籤</u>，' +
        '而指引沒有寫哪一支優先。</b>' +
        '<b>落在這個重疊區的病人，請走註 a 的多專科團隊會議決定 —— ' +
        '指引把這個選擇留給了會議，沒有留下判準。</b>');
      L.push(MDT_A);
      L.push('<b>開完刀後依切緣決定下一步</b>，見步驟 4。');
    } else {
      title = 'Grade 2／3，或 ≥ 5 cm，或術前確認無法達乾淨切緣<br>→ 有<b>兩條並列的路</b>可以走';
      L.push(H('❗先確認你是因為哪一個條件走到這裡', '台大指引 p4'));
      L.push('<b>圖上這一格的文字是三個條件並列</b>：' + SUB([
        '<b>Grade 2／3</b>',
        '<b>或 large tumor size（≥ 5 cm）</b>',
        '<b>或 clean margin unattainable confirmed preoperatively</b>']) +
        '❗<b>任一成立就走這一條。</b>');
      L.push('❗<b>上面那一支的標籤只有「Grade 1<sup>a</sup>」，沒有附任何大小或切緣的排除條件</b> —— ' +
        '<b>所以 Grade 1 且 ≥ 5 cm 的腫瘤<u>同時符合上下兩支</u>，指引沒有寫優先序。</b>' +
        '<b>要不要單憑「≥ 5 cm」這一個條件，就把一個 Grade 1 的腫瘤送去做術前治療，' +
        '指引沒有給答案 —— 這正是註 a 的多專科團隊會議要決定的事。</b>');
      L.push(H('兩條路在指引上是並列的', ''));
      L.push('<b>① 直接手術（Surgery）</b>　<b>② 術前 Neoadjuvant RT 或 C/T ± RT → 手術<sup>b</sup></b>');
      L.push('❗<b>圖上這兩條是用大括號匯進<u>同一個</u> R0／R1 分岔的</b> —— ' +
        '<b>也就是說不論走哪一條，術後的處置邏輯相同。' +
        '只讀文字層會把它做成兩條互不相通的路。</b>');
      L.push('<b>指引沒有給「什麼時候該選哪一條」的判準</b> —— ' +
        '<b>這正是註 a 要求「治療前就要多專科討論」的地方。</b>');
      L.push(MDT_A);
    }
    fill('st_r_grade', cls, title, L,
      SRC + ' p4「Treatment of resectable disease」（已 render PNG 逐格核對箭頭與大括號）。',
      gradingReference() + workupReference() + updatesReference() + extReference());
  }

  function renderRoute() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.route === 'upfront') {
      title = 'Grade 2／3 等 · <b>直接手術</b><br>→ 依術後病理切緣決定輔助治療';
      L.push(H('主建議', '台大指引 p4'));
      L.push('<b>直接進手術，術後再依 R0／R1 與多專科風險評估決定要不要加輔助治療。</b>');
      L.push('❗<b>選這一條不代表放棄術前治療的好處</b> —— ' +
        '<b>指引把兩條並列、沒有排序，所以這是一個真正的選擇題，' +
        '應該在治療前的多專科會議上決定。</b>');
      L.push('<b>術後的分岔見步驟 5。</b>');
    } else {
      title = 'Grade 2／3 等 · <b>術前治療後再手術</b><br>→ ❗放療完到開刀要間隔 3–6 週';
      L.push(H('主建議', '台大指引 p4'));
      L.push('<b>Neoadjuvant <span class="rx">RT</span>，或 <span class="rx">C/T</span> ± ' +
        '<span class="rx">RT</span> → Surgery<sup>b</sup></b>');
      L.push('❗<b>註 b 是這一版最具操作性的改動（原文以紅字標示）</b>：' +
        '<b>「建議 preoperative RT 完到手術之間<u>至少間隔 3–6 週</u>，較能有效減少 ' +
        'wound complication」</b>。' +
        '<b>間隔太短傷口併發症會增加，這是排刀時要留的時間。</b>');
      L.push('<b>術前治療的處方指引沒有寫</b> —— ' +
        '全身治療的藥物選單見轉移性那一頁（步驟 1 選「轉移性」），' +
        '<b>但要注意那份選單是寫給「姑息性」情境的。</b>');
      L.push('<b>術後的分岔見步驟 5</b>，和直接手術那一條匯在一起。');
    }
    fill('st_r_route', cls, title, L,
      SRC + ' p4 與 p2「Updates of Version 1, 2026」。',
      updatesReference() + extReference() + nhiReference());
  }

  function renderMargin() {
    var L = [], cls = 'rec-elective', title = '';
    var g1 = S.grade === 'g1';
    var gname = g1 ? 'Grade 1' : 'Grade 2／3 等';
    if (S.margin === 'r0') {
      cls = g1 ? 'rec-nonop' : 'rec-elective';
      title = gname + ' · <b>R0 resection</b><br>' +
        (g1 ? '→ 多專科風險評估<b>或</b>直接追蹤' : '→ 多專科風險評估以決定輔助 R/T ± C/T');
      L.push(H('主建議逐字', '台大指引 p4'));
      if (g1) {
        L.push('<b>「R0 resection → <u>MDT risk assessment</u> <u>or</u> <u>Follow up</u>」</b>');
        L.push('❗<b>注意這一格<u>沒有</u>指向輔助治療</b> —— ' +
          '<b>兩個出口是「多專科風險評估」與「直接追蹤」，' +
          '不是「評估要不要做輔助放化療」。這和 Grade 2/3 那一格不同。</b>');
        L.push('<b>也就是說：Grade 1、小、切乾淨，指引允許直接進追蹤。</b>');
      } else {
        L.push('<b>「R0 resection → <u>MDT risk assessment for adjuvant R/T +/- C/T</u>」</b>');
        L.push('❗<b>這一格的多專科評估是<u>有方向</u>的</b> —— ' +
          '<b>是「評估要不要做輔助放療 ± 化療」，不是「要不要追蹤」。' +
          '和 Grade 1 R0 那一格的文字不一樣。</b>');
        L.push('<b>指引沒有列出這個風險評估要看哪些因子</b>，也沒有給處方。');
      }
    } else {
      cls = 'rec-urgent';
      title = gname + ' · <b>R1 resection</b><br>→ 先做影像評估，再決定';
      L.push(H('主建議逐字', '台大指引 p4'));
      L.push('<b>兩條都先經過同一步：「R1 resection → <u>Image work-up</u> →」</b>');
      if (g1) {
        L.push('<b>「Re-resection <u>or</u> <u>Consider</u> R/T」</b>');
        L.push('❗<b>Grade 1 的 R1 只有兩個選項，而且放療是「<u>Consider</u>」</b> —— ' +
          '<b>語氣比 Grade 2/3 那一格弱，而且<u>沒有化療</u>。</b>');
      } else {
        L.push('<b>「Re-resection <u>or</u> Adjuvant R/T <u>or</u> MDT risk assessment for ' +
          'adjuvant R/T +/- C/T」</b>');
        L.push('❗<b>Grade 2/3 的 R1 有三個並列選項，而且放療寫的是「Adjuvant R/T」不是' +
          '「Consider R/T」</b> —— <b>語氣比 Grade 1 那一格強，而且多了化療的可能。</b>');
      }
      L.push('<b>「Image work-up」是兩條共用的必經步驟</b> —— ' +
        '<b>不要跳過影像直接安排再切除。</b>');
    }
    fill('st_r_margin', cls, title, L,
      SRC + ' p4（已 render PNG 逐格核對；⚠ Grade 1 與 Grade 2/3 兩格的用字不同，' +
      '本頁已分開呈現）。',
      followupReference() + extReference() + systemicReference());
    fu('st_f_local', FU_LOCAL);
  }

  function renderUres() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('先做的事', '台大指引 p4「Treatment of unresectable disease」'));
    L.push('<b>不可切除的侷限性軟組織肉瘤，先做「<span class="rx">Neoadjuvant C/T ± R/T</span>' +
      '　<u>或</u>　<span class="rx">R/T</span>」</b>（圖上兩者並列）。');
    L.push('<b>做完之後重新評估，圖上有<u>三個</u>出口</b>：' +
      '<b>轉為可切除 ／ Amputation？ ／ 仍不可切除</b>。' +
      '❗<b>「Amputation?」是指引自己的寫法，帶問號，單獨成為一個中間出口。</b>');

    if (S.ures === 'now_res') {
      cls = 'rec-elective';
      title = '術前治療後<b>轉為可切除</b><br>→ 回到可切除的流程';
      L.push(H('主建議逐字', ''));
      L.push('<b>「Resectable → <u>See resectable Localized STS</u>」</b>');
      L.push('<b>請回步驟 2 選「可切除」</b>，再依 Grade 與切緣走完。');
      L.push('❗<b>但要注意一件事</b>：<b>已經做過術前放療的人，之後那一條「術前 RT → 手術」的路' +
        '就不再適用</b>；<b>而且註 b 的「放療完到手術間隔 3–6 週」在這一格同樣要遵守。</b>');
      L.push('<b>也要記得：不可切除那一格若已給過化療，之後「C/T if not previously given」' +
        '這個選項就用掉了。</b>');
    } else if (S.ures === 'amput') {
      cls = 'rec-urgent';
      title = '術前治療後仍需考慮<b>截肢</b><br>→ 指引把它單獨列為一個出口，但沒有給判準';
      L.push(H('指引怎麼寫', ''));
      L.push('<b>圖上就是一個方框寫「<u>Amputation?</u>」，帶問號，從術前治療那一格分出來，' +
        '和「轉為可切除」「仍不可切除」並列。</b>');
      L.push('❗<b>指引<u>沒有</u>給任何判準</b> —— 沒有寫什麼情況該截肢、也沒有寫怎麼權衡。' +
        '<b>這一格完全交給多專科團隊與病人討論。</b>');
      L.push('<b>可以拿來對照的是骨肉瘤那一節的立場</b>（同一份指引 p8）：' +
        '<b>「local tumor control 可以使用<u>肢端保留手術</u>或者<u>截肢</u>，視個案而定，' +
        '<u>目前傾向於前者</u>」</b>。' +
        '<b>軟組織肉瘤這一節沒有寫這句，但方向可以參考。</b>');
      L.push('<b>決定之前務必先走完另外兩個出口的評估</b> —— ' +
        '圖上「Amputation?」和「轉為可切除」是從同一個點分出來的。');
    } else {
      cls = 'rec-nonop';
      title = '術前治療後<b>仍然不可切除</b><br>→ 五個並列選項，指引沒有排序';
      L.push(H('主建議逐字：五項並列', ''));
      L.push('<b>「<span class="rx">R/T</span> <u>if not previously irradiated</u>」</b> —— ' +
        '❗<b>條件句：先前沒照過才適用。</b>');
      L.push('<b>「<span class="rx">C/T</span> <u>if not previously given</u>」</b> —— ' +
        '❗<b>同樣是條件句。所以前面術前治療用掉了哪一個，這一格就少一個選項。</b>');
      L.push('<b>「Palliative surgery」</b>（姑息性手術）');
      L.push('<b>「Other local therapy<sup>a</sup>」</b> —— ' +
        '註 a 逐字（原文紅字，為本版新增）：<b>「other local therapy includes: ' +
        '<u>radiofrequency ablation, cryoablation</u>…」</b>');
      L.push('<b>「Best supportive care」</b>');
      L.push('❗<b>指引把這五項<u>並列</u>，沒有給優先順序</b> —— ' +
        '<b>包括最佳支持療護在內，五個都是平等的選項。</b>');
      L.push('<b>全身治療的藥物選單見步驟 1 選「轉移性」那一頁。</b>');
    }
    fill('st_r_ures', cls, title, L,
      SRC + ' p4「Treatment of unresectable disease」（已 render PNG 核對三個出口）。',
      systemicReference() + followupReference() + extReference() + nhiReference());
    fu('st_f_ures', FU_LOCAL);
  }

  /* ==========================================================
     腹膜後肉瘤（p9–p12）
     ========================================================== */
  function renderRps() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗先確認它算不算腹膜後肉瘤', '台大指引 p9'));
    L.push('<b>定義逐字：「Primary retroperitoneal sarcoma (RPS) is <u>non-visceral</u> origin」。</b>' +
      '<b>Exclusion 清單含 <u>GIST</u>、<u>desmoid tumor</u>、visceral sarcomas、' +
      'adrenal cortical carcinoma、paraganglioma、malignant pheochromocytoma 與良性腫瘤。</b>' +
      '<b>但註腳要求被排除的亞型仍應在多專科團隊會議中討論。</b>詳見下方橫列。');
    L.push(H('診斷與影像', '台大指引 p10'));
    L.push('<b>「<u>CNB（Core needle biopsy）</u>」</b> —— <b>指引指定用粗針切片。</b>');
    L.push('<b>「CT scans with contrast <u>from chest to pelvic</u>」</b>');
    L.push('❗<b>「Brain image：optimal（<u>strongly recommended</u> in the leiomyosarcoma or other ' +
      'sarcoma subtype with <u>major vessel involvement</u>）」</b> —— ' +
      '<b>平滑肌肉瘤或侵犯大血管的亞型要強烈建議照腦部。</b>');
    L.push('<b>「FDG PET scan or bone scan could be considered to complete staging」</b>');

    if (S.rstate === 'res') {
      title = '腹膜後肉瘤 · <b>可切除</b><br>→ 手術前後各開一次多專科會議';
      L.push(H('手術前', 'p10 註 1、註 2'));
      L.push('<b>流程是「Resectable → <u>MDT discussion for surgical planning</u> → Surgery」。</b>');
      L.push('❗<b>註 1 把與會科別逐一列出</b>：<b>sarcoma surgeons（含 general surgeons、urologists、' +
        'cardiovascular surgeons、orthopedic surgeons）、oncologists、radiologists、' +
        'radiation oncologists、pathologists</b>。' +
        '<b>腹膜後肉瘤常需要切到泌尿道與大血管，所以泌尿科與心血管外科被寫進核心名單。</b>');
      L.push('<b>註 2 的手術目標</b>：<b>「<u>En bloc resection</u> should be achieved if possible」</b>。');
      L.push(H('❗術前放療：不常規做，但有一個例外', 'p10 註 2 逐字'));
      L.push('<b>「The evidence of neoadjuvant radiotherapy and chemotherapy is <u>limited</u>. ' +
        'Neoadjuvant radiotherapy is <u>not routinely recommended</u> but <u>could be considered in ' +
        'well-differentiated liposarcoma or other G1-2 sarcomas</u> according to the ' +
        '<u>subgroup analysis of STRASS trial</u> and off-trial <u>STREXIT</u>」</b>');
      L.push('❗<b>這一條的依據是「次群分析」與「非試驗族群的觀察性研究」，不是主要終點</b> —— ' +
        '<b>指引自己把出處寫出來就是要讀者知道證據的層級。</b>' +
        '<b>STRASS 的主要終點是陰性的（HR 1.01，p = 0.95），作者結論明寫術前放療' +
        '「should not be considered as standard of care」。</b>');
      L.push('❗<b>而且指引寫的「or other G1-2 sarcomas」比出處更寬</b>：' +
        '<b>STREXIT 那句話的原文範圍只有<u>分化良好脂肪肉瘤</u>與 <u>G1-2 去分化脂肪肉瘤</u>兩種</b>，' +
        '<b>同一句還明寫 <u>G3 去分化脂肪肉瘤與平滑肌肉瘤沒有</u>這個好處</b>。' +
        '<b>把它套用到其他 G1-2 亞型，是指引自己的延伸，不是原文。</b>' +
        '詳見下方院外實證橫列。');
      L.push(H('手術後', 'p11 註 2、註 3'));
      L.push('<b>流程是「Surgery → <u>MDT discussion for post-operative management</u> → ' +
        'Adjuvant Tx 或 Follow-up」。</b>');
      L.push('❗<b>看圖才知道的一條</b>：<b>圖上「Adjuvant Tx」的右側有一條線<u>折回「Follow-up」</u></b> —— ' +
        '<b>它不是兩個並列的終點，而是「直接追蹤」或「做完輔助治療再追蹤」。</b>');
      L.push('<b>註 2 逐字</b>：<b>「Post-operative treatment (radiotherapy/chemotherapy) should be ' +
        'based on <u>surgical findings and pathology report</u>. The evidence for adjuvant ' +
        'radiotherapy and chemotherapy is <u>limited but could be discussed on an individual basis</u>.」</b>');
      L.push('<b>註 3 的追蹤</b>：<b>「The modality of image follow-up is based on the <u>histology and ' +
        'physician\'s choice</u>. <u>Long-term follow-up should be considered due to the risk of ' +
        'late recurrence</u>.」</b>' +
        '❗<b>腹膜後肉瘤沒有固定的追蹤排程，但指引明講要追得久。</b>');
    } else if (S.rstate === 'border') {
      cls = 'rec-nonop';
      title = '腹膜後肉瘤 · <b>邊緣可切除</b><br>→ 這一格的唯一動作就是開會判定';
      L.push(H('主建議逐字', '台大指引 p11'));
      L.push('<b>「Borderline Resectable → <u>MDT discussion<sup>1</sup> for Resectability</u> →」</b>' +
        '<b>「Resectable → Refer to resectable tx」</b>／' +
        '<b>「Unresectable → Refer to unresectable tx」</b>');
      L.push('❗<b>這一頁沒有任何治療內容</b> —— <b>它唯一的內容就是「開會決定它到底算可切除還是不可切除」，' +
        '然後轉到對應的那一頁。</b>');
      L.push('❗<b>指引<u>沒有</u>定義什麼叫 borderline resectable</b>，' +
        '<b>也沒有給任何影像或解剖的判準。</b>' +
        '<b>這一格完全靠多專科團隊判斷，而註 1 指定了與會科別（見下方）。</b>');
      L.push('<b>判定為可切除 → 請回步驟 2 選「可切除」；判定為不可切除 → 選「不可切除」。</b>');
    } else {
      cls = 'rec-urgent';
      title = '腹膜後肉瘤 · <b>不可切除</b><br>→ 先評估姑息手術的適應症';
      L.push(H('主建議逐字', '台大指引 p12'));
      L.push('<b>「Unresectable → <u>MDT discussion<sup>1</sup> for evaluating the indication of ' +
        'palliative surgery</u> →」</b>' +
        '<b>「Palliative surgery」</b>／<b>「Systemic treatment / Radiotherapy」</b>');
      L.push('❗<b>注意這一格的多專科會議有明確任務</b>：<b>「評估姑息手術的<u>適應症</u>」</b>，' +
        '<b>不是泛泛地討論怎麼治療。</b>');
      L.push('<b>兩個出口並列</b>：<b>姑息手術</b>，或<b>全身治療／放射治療</b>。');
      L.push('<b>全身治療的藥物選單與軟組織肉瘤共用</b>（台大指引 p6）—— ' +
        '見下方可展開的橫列，或回步驟 1 選「轉移性」。');
      L.push('❗<b>指引沒有為腹膜後肉瘤另外列處方</b>，' +
        '也<b>沒有寫姑息手術的適應症內容</b>（只寫了「要開會評估」）。');
    }
    fill('st_r_rps', cls, title, L,
      SRC + ' p9（定義）、p10（診斷影像與可切除）、p11（術後與邊緣可切除）、p12（不可切除）。' +
      '⚠ 該指引自列的證據出處：STRASS（Lancet Oncol 2020;21(10):1366-1377）與 ' +
      'STREXIT（Ann Surg 2023;278(1):127-134）。',
      rpsDefReference() + rpsEvidenceReference() + gradingReference() + systemicReference() + followupReference() + nhiReference());
    fu('st_f_rps', '<li>❗<b>腹膜後肉瘤的追蹤沒有固定排程</b>（p11 註 3）：' +
      '<b>影像方式依組織型態與醫師選擇</b>，<b>但「應考慮長期追蹤，因為有晚期復發的風險」</b>。</li>' +
      '<li><b>軟組織肉瘤那一套的排程可以參考</b>：胸部影像每 3–6 個月做 2–3 年，' +
      '之後每 6–12 個月做 2 年，之後每年一次。</li>' +
      '<li><b>腹膜後肉瘤常需要切到腎臟、大血管與腸道</b>，' +
      '<b>術後的功能性追蹤（腎功能等）不在指引裡，但實務上要一起看。</b></li>');
  }

  /* ==========================================================
     骨肉瘤（p7–p8）—— 指路
     ========================================================== */
  function renderBone() {
    fill('st_r_bone', 'rec-nonop',
      '骨肉瘤 Bone sarcoma<br>→ 同一份指引有這一節，但<b>只有通則、沒有流程圖也沒有處方</b>',
      [H('這一節在指引裡的位置與範圍', '台大指引 p6–p8'),
      '<b>它和軟組織肉瘤、腹膜後肉瘤同屬「肉瘤臨床診療指引」這一份文件</b>，' +
        '<b>但只寫了多專科團隊組成、一般性治療流程與一般性治療原則三段</b>，' +
        '<b>沒有依分期的決策圖，也沒有任何藥名或劑量。</b>',
      '❗<b>而且本站的「分期 TNM」分頁未納入骨肉瘤</b> —— ' +
        '<b>AJCC 軟組織肉瘤的四個章節（頭頸、軀幹四肢、腹腔胸腔內臟、腹膜後）都不含骨骼。</b>',
      '<b>指引自己列的參考是 NCCN Bone Cancer V2. 2026。</b>',
      H('❗但有幾條通則是可以直接用的', ''),
      '<b>年齡是第一個分岔</b>：<b>&lt; 40 歲轉 orthopedic oncologist、可能為惡性時切片要在同一機構做；' +
        '&gt; 40 歲則<u>必須先考慮轉移的可能</u></b>，要做 bone scan（或 PET）、胸腹骨盆 CT，' +
        '並抽 <b>CEA、AFP、PSA、CA19-9、CA125、LDH</b> 找原發部位。',
      '❗<b>切片的路徑</b>：<b>「如何進入，必須與後續最終手術的 <u>surgical plane 一致</u>，' +
        '<u>以免 tumor seeding</u>」</b> —— <b>這是整份指引講切片路徑講得最白的一句，' +
        '軟組織肉瘤那一節只寫「Placed along planned future resection」。</b>',
      '❗<b>術後輔助治療不是慣例</b>：<b>「手術後輔助性化學治療以及放射線治療<u>並非慣例</u>，' +
        '建議經過多科團隊會議討論後再進行」</b>。',
      '❗<b>化療前要先保留生育組織</b>：<b>「使用化療前，fertility tissue（如卵巢等組織）<u>必須先保留</u>」</b>' +
        ' —— <b>這一條只出現在骨肉瘤這一節，軟組織肉瘤那一節沒有寫，但臨床上同樣適用於年輕病人。</b>',
      '❗<b>終身追蹤</b>：<b>「對於 long-term survivors，<u>目前建議終身追蹤</u>，' +
        '以避免 surgery、radiation and chemotherapy 的長期副作用」</b>。',
      '<b>完整內容見下方可展開的橫列。</b>'],
      SRC + ' p6–p8。⚠ 該節只有通則，指引自列的參考為 NCCN Bone Cancer V2. 2026。',
      boneReference() + workupReference());
  }

  /* ==========================================================
     轉移性／姑息性全身治療（p6）
     ========================================================== */
  function renderMeta() {
    var L = [], cls = 'rec-elective', title = '';
    var sub = S.sub;

    if (sub === 'dfsp') {
      title = 'DFSP 且已確認 PDGFB translocation<br>→ 指引指定 <b>imatinib</b> 可作第一線';
      L.push(H('主建議逐字', '台大指引 p6'));
      L.push('<b>「<span class="rx">Imatinib</span> could be given as <u>first-line</u> for advanced ' +
        'dermatofibrosarcoma protuberans with <u>confirmed PDGFB translocation</u>.」</b>');
      L.push('❗<b>條件是「已確認 PDGFB translocation」</b> —— ' +
        '<b>這是整份指引<u>唯一</u>一個明文要求「先確認融合基因再給藥」的情境。</b>' +
        '<b>沒有確認就不適用這一條，要回到一般的第一線。</b>');
      L.push('<b>適用範圍是「advanced」DFSP</b> —— ' +
        '<b>可切除的 DFSP 仍以手術為主，走侷限性那一頁。</b>');
      L.push('<b>若 imatinib 無效或不能耐受，回到一般的第一線與後線選單</b>（見下方橫列）。');
    } else if (sub === 'asps') {
      title = '肺泡狀軟組織肉瘤 ASPS<br>→ 指引列為可考慮免疫治療；<b>台灣有 atezolizumab 的正式適應症</b>';
      L.push(H('主建議逐字', '台大指引 p6'));
      L.push('<b>「Immune checkpoint inhibitors could be considered in <u>some specific subtypes</u> ' +
        'of soft tissue sarcoma including: <u>alveolar soft part sarcoma, angiosarcoma, and ' +
        'undifferentiated pleomorphic sarcoma</u>」</b>');
      L.push('❗<b>指引只列這三個亞型，用的是「could be considered」，' +
        '而且<u>沒有指定藥名、沒有寫第幾線</u>。</b>' +
        '<b>下面的藥名、適應症與數字都是本頁依台灣藥證與院外實證補的，不是指引的內容。</b>');
      L.push(H('台灣藥證怎麼寫 —— 這是全頁唯一有肉瘤適應症的免疫藥', '食藥署西藥許可證資料集，查詢日 2026-09-13'));
      L.push('<b><span class="rx">atezolizumab</span></b>（癌自禦注射劑，' +
        '<b>衛部菌疫輸字第 001050 號</b>，有效至 2027/07/17）<b>適應症第 5 項逐字</b>：' +
        '<b>「肺泡狀軟組織肉瘤：單獨使用，適用於治療 <u>2 歲以上</u>無法切除或轉移性肺泡狀軟組織肉瘤 ' +
        '(alveolar soft part sarcoma) 病人。」</b>');
      L.push('<b>另有皮下劑型</b>（癌自禦皮下注射劑，衛部菌疫輸字第 001258 號，有效至 2029/05/29），' +
        '<b>適應症文字相同</b>。');
      L.push('❗<b>但健保沒有。</b><b>支付標準第 9 章只有 6 條提到肉瘤，免疫檢查點抑制劑一條都沒有</b> —— ' +
        '<b>有藥證不等於有給付，這一格要自費。</b>');
      L.push(H('院外實證', ''));
      L.push('<b>NEJM 2023;389(10):911-921（PMID 37672694）單臂第二期，n = 52</b>：' +
        '<b>反應率 37%（19/52）、中位反應持續 24.7 個月、中位無惡化存活 20.8 個月。</b>');
      L.push(EV('美國仿單用的是另一個世代（49 人），與這篇的 52 人不是同一組數字，不要混用。' +
        '核准日期與是否為加速核准本輪查不到可靠來源，本頁不寫。'));
      L.push(H('這一型和一般軟組織肉瘤不一樣的地方', 'ESMO 2021（PMID 34303806）'));
      L.push('❗<b>ESMO 明文寫 ASPS <u>不應</u>接受輔助或術前化療</b>' +
        '（原文與亮細胞肉瘤並列）—— <b>這一型不要照一般肉瘤的化療邏輯走。</b>');
      L.push('<b>指引本身並沒有把 ASPS 排除在一般的第一線之外</b>；' +
        '<b>轉移性的化療選單見「沒有特別的亞型」那一格。</b>');
    } else if (sub === 'ups') {
      title = '未分化多形性肉瘤 UPS<br>→ 指引列為可考慮免疫治療；<b>但台灣沒有任何免疫藥有肉瘤適應症</b>';
      L.push(H('主建議逐字', '台大指引 p6'));
      L.push('<b>「Immune checkpoint inhibitors could be considered in <u>some specific subtypes</u> ' +
        'of soft tissue sarcoma including: <u>alveolar soft part sarcoma, angiosarcoma, and ' +
        'undifferentiated pleomorphic sarcoma</u>」</b>');
      L.push('❗<b>指引只列這三個亞型，用的是「could be considered」，' +
        '而且<u>沒有指定藥名、沒有寫第幾線</u>。</b>' +
        '<b>下面的藥名與數字是本頁依院外實證補的。</b>');
      L.push(H('實證上用的是哪一個藥', 'SARC028｜Lancet Oncol 2017;18(11):1493-1501（PMID 28988646）'));
      L.push('<b>UPS 這一格的實證來自 SARC028，用的藥是 <span class="rx">pembrolizumab</span>' +
        '（200 mg 靜脈注射，每 3 週一次）。</b>');
      L.push('❗<b>該試驗的主要終點未達標</b>；分型的反應率是' + SUB([
        '<b>未分化多形性肉瘤 UPS：4/10（40%）</b>',
        '脂肪肉瘤 2/10、滑膜肉瘤 1/10',
        '❗<b>平滑肌肉瘤 0/10</b>']) +
        '❗<b>每一格只有 10 個人，這是把 UPS 挑出來講的全部根據。</b>');
      L.push('❗<b>台灣的狀況：pembrolizumab 的藥證沒有任何肉瘤適應症，健保也沒有</b> —— ' +
        '<b>用在 UPS 是仿單外使用，要自費，並且事前要說明清楚。</b>' +
        NR('<b>（對比之下 ASPS 的 atezolizumab 是有藥證的，見該格；' +
        '那是另一個亞型的適應症，不是這一格的。）</b>'));
      L.push('<b>anthracycline 為基礎的第一線在指引上仍然成立</b> —— ' +
        '<b>免疫治療是「這個亞型多了一個選項」，不是取代第一線。</b>' +
        '<b>完整化療選單見「沒有特別的亞型」那一格。</b>');
    } else if (sub === 'fusion') {
      title = '已驗到 NTRK 或 ALK 變異<br>→ 指引指定<b>應考慮標靶</b>，但沒有指定藥名';
      L.push(H('主建議逐字', '台大指引 p6'));
      L.push('<b>「For sarcoma with specific gene alterations, such as <u>NTRK and ALK</u>, ' +
        'targeted agents <u>should be considered</u>.」</b>');
      L.push('❗<b>指引只點名這兩個基因，而且<u>沒有指定藥名</u>。</b>' +
        '<b>藥名是本頁依院外實證補的，健保狀態見下方橫列。</b>');
      L.push('<b>NTRK 融合 → <span class="rx">larotrectinib</span> 或 ' +
        '<span class="rx">entrectinib</span></b>（兩者都是泛癌別的 NTRK 標靶）。');
      L.push('<b>ALK 變異 → <span class="rx">crizotinib</span></b>' +
        '（肉瘤裡最常見於 inflammatory myofibroblastic tumor）。');
      L.push('<b>這一格不影響第一線的 anthracycline 骨幹</b> —— ' +
        '<b>指引把它寫成「應考慮」，順序仍由多專科團隊決定。</b>');
    } else if (sub === 'angio') {
      if (S.line === 'l1') {
        title = '血管肉瘤 · <b>第一線</b><br>→ anthracycline 為基礎；<b>可用 liposomal doxorubicin 替代</b>';
        L.push(H('主建議逐字', '台大指引 p6'));
        L.push('<b>「Anthracycline-based treatment should be considered as first-line treatment. ' +
          '<u>Liposomal doxorubicin</u> could be considered as an <u>alternative for angiosarcoma</u>.」</b>');
        L.push('<b>也就是說這一格有兩個第一線選項</b>：' + SUB([
          '<b>一般的 anthracycline（<span class="rx">doxorubicin</span>）為基礎</b>',
          '<b>或 <span class="rx">liposomal doxorubicin</span>（指引指定給血管肉瘤的替代）</b>']));
        L.push('❗<b>指引沒有說哪一個比較好，也沒有給選擇的判準。</b>');
        L.push('<b>其他第一線選項同樣適用</b>：<b><span class="rx">ifosfamide</span> 為基礎、' +
          '<span class="rx">gemcitabine</span> 為基礎、<span class="rx">paclitaxel</span> 為基礎、' +
          '<span class="rx">dacarbazine</span></b>。');
        L.push('❗<b>血管肉瘤同時也在「可考慮免疫檢查點抑制劑」的三個亞型之列</b> —— ' +
          '<b>不必等到後線才想起這件事。</b><b>藥名與實證見第二線那一格。</b>');
      L.push('❗<b>台灣的 liposomal doxorubicin 藥證只有愛滋相關卡波西氏肉瘤與卵巢癌</b>，' +
        '<b>健保 9.14 也一樣</b> —— <b>指引指定的這個「血管肉瘤替代」在台灣是仿單外且自費。</b>' +
        '<b>細節見下方「台灣現況」。</b>');
      } else {
        title = '血管肉瘤 · <b>第二線或更後線</b><br>→ 五個並列選項，外加免疫治療';
        L.push(H('主建議逐字', '台大指引 p6'));
        L.push('<b>「Second or later line treatments include: <span class="rx">pazopanib</span>, ' +
          '<span class="rx">eribulin</span>, <span class="rx">trabectedin</span>, ' +
          '<span class="rx">ifosfamide</span>, <span class="rx">dacarbazine</span>.」</b>');
        L.push('❗<b>ifosfamide 與 dacarbazine 在第一線與第二線都出現</b> —— ' +
          '<b>指引沒有把它們鎖在某一線；第一線沒用過的，後線仍可用。</b>');
        L.push('❗<b>血管肉瘤在這一格多一個選項：免疫檢查點抑制劑</b>' +
          '（指引列的三個亞型之一，<b>但指引沒有指定藥名</b>）。');
        L.push('<b>實證上用的處方是 <span class="rx">ipilimumab</span> 1 mg/kg 每 6 週一次 ' +
          '加 <span class="rx">nivolumab</span> 240 mg 每 2 週一次</b>' +
          '（SWOG S1609 DART 第 51 組，PMID 34380663）—— ' +
          '❗<b>只有 16 人可評估，反應率 25%（4/16）；頭皮或顏面皮膚原發那一群 3/5。</b>' +
          '<b>這是本頁依院外實證補的，不是指引寫的。</b>');
        L.push('❗<b>台灣沒有任何免疫藥的藥證或健保寫到血管肉瘤</b> —— <b>仿單外且自費。</b>');
        L.push('<b>若第一線用的是一般 doxorubicin，<span class="rx">liposomal doxorubicin</span> ' +
          '在血管肉瘤仍是指引指定的選項。</b>');
      }
    } else {
      if (S.line === 'l1') {
        title = '一般軟組織肉瘤 · <b>第一線</b><br>→ anthracycline 為基礎';
        L.push(H('主建議逐字', '台大指引 p6'));
        L.push('<b>「<u>Anthracycline-based treatment</u> should be considered as first-line treatment.」</b>' +
          ' —— <b>骨幹是 <span class="rx">doxorubicin</span>。</b>');
        L.push('<b>其他第一線選項（指引並列，沒有排序）</b>：' + SUB([
          '<b><span class="rx">ifosfamide</span> 為基礎的處方</b>（❗必須併用 <span class="rx">mesna</span>）',
          '<b><span class="rx">gemcitabine</span> 為基礎的處方</b>',
          '<b><span class="rx">paclitaxel</span> 為基礎的處方</b>',
          '<b><span class="rx">dacarbazine</span></b>']));
        L.push('❗<b>指引沒有給任何劑量、療程數或選擇判準</b> —— ' +
          '<b>整份指引只列藥名。劑量請以藥卡與院內處方為準。</b>');
        L.push('<b>先確認有沒有落在特別點名的亞型</b>（血管肉瘤、DFSP、ASPS／UPS、NTRK／ALK）—— ' +
          '<b>那幾種在第一線就有不同的做法，見步驟 2。</b>');
      } else {
        title = '一般軟組織肉瘤 · <b>第二線或更後線</b><br>→ 五個並列選項';
        L.push(H('主建議逐字', '台大指引 p6'));
        L.push('<b>「Second or later line treatments include: <span class="rx">pazopanib</span>, ' +
          '<span class="rx">eribulin</span>, <span class="rx">trabectedin</span>, ' +
          '<span class="rx">ifosfamide</span>, <span class="rx">dacarbazine</span>.」</b>');
        L.push('❗<b>ifosfamide 與 dacarbazine 在第一線與第二線都出現</b> —— ' +
          '<b>指引沒有把它們鎖在某一線。第一線沒用過的，後線仍可用。</b>');
        L.push('❗<b>指引把這五個並列，沒有排序，也沒有寫哪個亞型適合哪一個。</b>');
        L.push('<b>這一格要回頭確認亞型</b> —— <b>ASPS、血管肉瘤、UPS 這三種在指引裡多一個' +
          '免疫檢查點抑制劑的選項；驗到 NTRK 或 ALK 則應考慮標靶。</b>');
      }
    }
    L.push(H('不論走哪一格，這一條都成立', '台大指引 p6'));
    L.push('<b>「Enrollment into <u>clinical trials is encouraged</u> for locally inoperable or ' +
      'metastatic soft tissue sarcoma patients」</b>');
    fill('st_r_meta', cls, title, L,
      SRC + ' p6「Palliative systemic treatment recommendations」（逐字六條）。' +
      '❗<b>該頁只列藥名，沒有劑量、療程數與線別互斥規則。</b>',
      systemicReference() + trialReference() + nhiReference() + followupReference());
    fu('st_f_meta', '<li><b>胸部影像：每 3–6 個月做 2–3 年，之後每 6–12 個月做 2 年，之後每年一次</b>' +
      '（指引 p3／p5）。</li>' +
      '<li>❗<b>高惡性度軟組織肉瘤：前 2 年每 3–4 個月照一次。</b></li>' +
      '<li><b>指引沒有為轉移性另立追蹤排程</b> —— 上面那一套是寫給侷限性（Stage I–III）的，' +
      '<b>轉移性的追蹤節奏由治療週期決定。</b></li>');
  }

  /* ==========================================================
     最下方一：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('先講病理本身 —— 這個癌別最先要確認的不是基因，是「診斷對不對」', ''));
    L.push('❗<b>台大指引 p3 的第一項就是：外院已診斷的肉瘤病人，' +
      '<u>建議由本院肉瘤多專科團隊的病理科醫師再做一次 pathology review</u></b>' +
      '（逐字「a request for pathology review by the Sarcoma MDT\'s pathologists is recommended」）。' +
      '<b>軟組織肉瘤有上百種亞型，重新判讀會改變整條治療路線。</b>');
    L.push('<b>切片本身也有規矩</b>：<b>先影像再切片</b>；' +
      '<b>切片路徑要沿著將來要切除的路線走</b>（骨肉瘤那一節寫得更白：' +
      '「必須與後續最終手術的 surgical plane 一致，<u>以免 tumor seeding</u>」）。');
    L.push(H('指引點名要驗的只有兩個', '台大指引 p6'));
    L.push('逐字：<b>「For sarcoma with specific gene alterations, such as <u>NTRK and ALK</u>, ' +
      'targeted agents should be considered.」</b>');
    L.push('❗<b>指引只點名 NTRK 與 ALK 兩個，而且<u>沒有指定藥名</u></b> —— ' +
      '<b>藥是本頁依院外實證補的，已在建議卡裡標明。</b>');
    L.push(H('另外三個亞型是「病理決定用藥」而不是「基因決定用藥」', ''));
    L.push('<b>DFSP</b>：指引要求<b>確認 <u>PDGFB translocation</u></b> 才用 imatinib 當第一線 —— ' +
      '<b>這是唯一一個指引明文要求「先確認融合基因再給藥」的情境。</b>');
    L.push('<b>血管肉瘤</b>：指引指定可用 liposomal doxorubicin 替代 —— <b>靠病理不靠基因。</b>');
    L.push('<b>ASPS 與未分化多形性肉瘤（UPS）</b>：指引把它們與血管肉瘤並列為' +
      '<b>可考慮免疫檢查點抑制劑的三個亞型</b> —— <b>同樣靠病理型態，不是靠 PD-L1 或 TMB。</b>');
    L.push(H('❗分級系統本身會影響分期，而且有一份「不適用」清單', ''));
    L.push('<b>軟組織肉瘤用 <u>FNCLCC</u> 分級（分化、有絲分裂數、壞死三項加總）</b>，' +
      '<b>而分期時 GX 與 G1 同組、G2 與 G3 同組</b>。');
    L.push('❗<b>AJCC 與 WHO <u>不建議</u>對下列使用 FNCLCC 分級</b>：' +
      '<b>惡性周邊神經鞘瘤（MPNST）、胚胎型與腺泡型橫紋肌肉瘤、血管肉瘤、骨外黏液樣軟骨肉瘤、' +
      '腺泡狀軟組織肉瘤（ASPS）、透明細胞肉瘤、上皮樣肉瘤</b>。' +
      '<b>這些亞型拿到的「Grade」要小心解讀</b> —— 詳見本頁「分期 TNM」分頁。');
    L.push(H('生育力', '台大指引 p8（寫在骨肉瘤那一節）'));
    L.push('❗<b>「使用化療前，fertility tissue（如卵巢等組織）<u>必須先保留</u>」</b> —— ' +
      '<b>這一條只寫在骨肉瘤那一節，軟組織肉瘤那一節沒有寫，' +
      '但年輕病人要用 anthracycline 或 ifosfamide 時同樣適用。</b>');
    return '<div class="bc-gene-h">要不要驗基因？肉瘤最先要確認的是「病理判讀對不對」' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     最下方二：藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(c) { return 'st-drug-' + c.replace(/ /g, '_'); }
  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }
  function renderDrugCards() {
    var box = el('st_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，會把相鄰藥名黏成一個字。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('stPath');
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
    var g = el('st_gene');
    if (g) { g.classList.toggle('hidden', !txt.trim()); if (txt.trim() && !g.innerHTML) g.innerHTML = geneBlock(); }

    var picked = [];
    ST_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' +
        (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });
    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;
    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var n = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML = '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡' +
      '<span class="bc-drugbox-n">' + picked.length + ' 種藥 · ' + n + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">點藥名展開台大醫院藥劑部處方集的完整藥卡。' +
      '❗<b>台大肉瘤指引本身沒有任何一個化療劑量、沒有療程數、也沒有線別之間的互斥規則</b> —— ' +
      '它只列藥名。<b>劑量請以藥卡與院內處方為準。</b>' +
      '<b>徽章標明該藥在這個癌別的定位或台灣的給付狀態。</b></div>' +
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
     總 render 與互動
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope === 'local') {
      show('st_n_resect', true);
      if (S.resect === 'yes') {
        show('st_n_grade', true);
        if (S.grade) {
          renderGrade();
          if (S.grade === 'g23') {
            show('st_n_route', true);
            if (S.route) {
              renderRoute();
              setNum('st_n_margin', '5');
              show('st_n_margin', true);
              if (S.margin) renderMargin();
            }
          } else {
            setNum('st_n_margin', '4');
            show('st_n_margin', true);
            if (S.margin) renderMargin();
          }
        }
      } else if (S.resect === 'no') {
        show('st_n_ures', true);
        if (S.ures) renderUres();
      }
    } else if (S.scope === 'meta') {
      show('st_n_sub', true);
      if (S.sub) {
        /* 亞型本身就決定做法的（DFSP／ASPS／UPS／融合基因）不必再問線別；
           指引對這幾種都沒有寫線別。 */
        if (S.sub === 'generic' || S.sub === 'angio') {
          show('st_n_line', true);
          if (S.line) renderMeta();
        } else {
          renderMeta();
        }
      }
    } else if (S.scope === 'rps') {
      show('st_n_rstate', true);
      if (S.rstate) renderRps();
    } else if (S.scope === 'bone') {
      renderBone();
    }
    renderDrugCards();
  }

  var SEL_GROUPS = ['st_n1', 'st_n_resect', 'st_n_grade', 'st_n_route', 'st_n_margin',
    'st_n_ures', 'st_n_sub', 'st_n_line', 'st_n_rstate'];
  var DOWNSTREAM = {
    scope:  ['resect', 'grade', 'route', 'margin', 'ures', 'sub', 'line', 'rstate'],
    resect: ['grade', 'route', 'margin', 'ures'],
    grade:  ['route', 'margin'],
    route:  ['margin'],
    sub:    ['line']
  };
  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function stPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) { down.forEach(function (k) { S[k] = null; }); clearSelectionMarks(); }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }
  function reapplyMarks() {
    [['st_n1', 'scope'], ['st_n_resect', 'resect'], ['st_n_grade', 'grade'],
     ['st_n_route', 'route'], ['st_n_margin', 'margin'], ['st_n_ures', 'ures'],
     ['st_n_sub', 'sub'], ['st_n_line', 'line'], ['st_n_rstate', 'rstate']].forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /stPick\('([a-z0-9_]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }
  function stReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }
  function initStsPathway() { stReset(); }

  /* ⚠ 匯出名稱必須符合 js/cancer-staging.js 的命名規則（延遲載入靠它分派）。 */
  global.stsPathwayHTML = stsPathwayHTML;
  global.initStsPathway = initStsPathway;
  global.stPick = stPick;
  global.stReset = stReset;
})(window);
