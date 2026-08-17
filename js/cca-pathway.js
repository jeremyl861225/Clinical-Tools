/* ============================================================
   膽管癌／膽道癌治療互動決策流程 Biliary Tract Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全新製作。此癌別原本沒有流程模組（cancers.js 只有分期與淋巴結）。

   ⚠ 資料來源的界線：**台大醫院沒有膽管癌／膽道癌的診療指引。**
     workspace/guidelines 下 34 份院內指引 PDF 全文掃過，胰臟癌指引提到的「膽道」
     是膽道引流，不是膽道癌治療；台大癌症委員會的癌別指引集亦無膽道癌。
     台灣也查無國家級或全國性學會的膽道癌指引。
     → 因此本流程的臨床內容**全部屬院外實證**。

   主要來源（每一份都標明版本）：
   ① ESMO Biliary tract cancer CPG — Vogel A et al. Ann Oncol 2023;34:127-140（PMID 36372281）
   ② **現行最新**：ESMO CPG interim update — Vogel A, Ducreux M.
      ESMO Open 2025;10:104003（PMID 39864891，線上 2024-12-17）—— 第一線與 HER2 條文已改
   ③ **泛亞洲版（與台灣腫瘤醫學會共同協調，第一作者陳立宗，含台大專家）**：
      Pan-Asian adapted ESMO CPG，ESMO Open 2024;9:103647 —— S-1、carboplatin、irinotecan 等亞洲差異
   ④ EASL-ILCA 肝內膽管癌建議（iCCA 專屬條文）
   健保給付條文查詢日：2026-08-17（藥品給付規定第 9 節）。

   ⚠ 這個癌別的第一件事是**先確認解剖部位**：iCCA／pCCA／dCCA／膽囊癌四者的
     可切除性判定、手術範圍與追蹤都不一樣，ESMO 明文要求先分部位再談治療。

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
    'scope',   // dx | postop | adv | mol
    'site',    // icca | pcca | dcca | gbc
    'jaun',    // 有無黃疸（pcca/dcca）：yes | no
    'rsec',    // 可切除性：res | unres
    'inc',     // 膽囊癌是否為術後意外發現：inc | known
    'ptn',     // 術後：切緣與淋巴結：r0n0 | r0n1 | r1
    'line',    // 晚期線別：l1 | l2 | l3
    'fit',     // 體能與器官功能：good | renal | ps2
    'mol'      // 分子標記：idh1 | fgfr2 | her2 | braf | ntrk | msi | none
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/index.js 逐碼實跑核對）
     ⚠ futibatinib 與 zanidatamab 台大處方集查無、台灣也無藥證，故不列卡。
     ========================================================== */
  var CC_DRUGS = [
    { key: 'gemcitabine', cards: [['17', 'GEI1CB14', 'Gemmis 健仕注射液 200 mg/6 mL']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg/50 mL']] },
    { key: 'durvalumab', cards: [['17', 'IMF1CES0', 'Imfinzi 抑癌寧注射劑 500 mg/10 mL']] },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']],
      flag: '膽道癌有藥證、健保不給付' },
    { key: 'S-1', re: 'S-1|TS-1', cards: [['17', 'TS14CB44', 'TS-1 愛斯萬膠囊 20 mg', 'tegafur ＋ gimeracil ＋ oteracil']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']],
      flag: '膽道癌無藥證亦無健保' },
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']],
      flag: '膽道癌無藥證亦無健保' },
    { key: '5-FU', re: '5-FU|fluorouracil', cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']] },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'irinotecan', re: '(?<!liposomal )irinotecan', cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']] },
    { key: 'ivosidenib', cards: [['17', 'TIB4CI08', 'Tibsovo 拓舒沃膜衣錠 250 mg']],
      flag: '有藥證、健保未收載' },
    { key: 'pemigatinib', cards: [['17', 'PEM4CG31', 'Pemazyre 達伯坦錠 13.5 mg']],
      flag: '健保限肝內膽管癌' },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib sulfate']],
      flag: '健保限肝內膽管癌' },
    { key: 'entrectinib', cards: [['17', 'ROZ4CG01', 'Rozlytrek 羅思克膠囊 200 mg']],
      flag: '膽道癌有藥證、健保不給付' },
    { key: 'dabrafenib', cards: [['17', 'DAB4CEE5', 'Tafinlar 泰伏樂膠囊 75 mg']],
      flag: '膽道癌有藥證、健保不給付' },
    { key: 'trametinib', cards: [['17', 'MEK4CEQ8', 'Mekinist 麥欣霓膜衣錠 2 mg']],
      flag: '膽道癌有藥證、健保不給付' },
    { key: 'trastuzumab deruxtecan', re: 'trastuzumab deruxtecan|T-DXd',
      cards: [['17', 'ENH1CH06', 'Enhertu 優赫得凍晶注射劑', 'trastuzumab deruxtecan']],
      flag: '膽道癌有藥證、健保限乳癌' },
    { key: 'carboplatin', cards: [['17', 'KEM1CA32', 'Kemocarb 注射劑 150 mg/15 mL', 'carboplatin']] }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ccaPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="cc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="cc-node" id="' + id + '">' +
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

  var SITE_LABEL = { icca: '肝內膽管癌 iCCA', pcca: '肝門膽管癌 pCCA', dcca: '遠端膽管癌 dCCA', gbc: '膽囊癌 GBC' };

  /* ==========================================================
     2. 共用參考區塊
     ========================================================== */

  /* 2a. 四個部位的分界 */
  function siteReference() {
    return fold('<b>四個部位怎麼分</b>（ESMO 2023 診斷節）',
      '<table>' +
      '<tr><td colspan="2">ESMO 明文要求先分部位再談治療：「It is important to confirm the anatomical ' +
      'location of BTC (iCCA, pCCA, dCCA or GBC), as <b>every subtype has specific clinical and ' +
      'molecular features, requiring individualised work-up</b>」。' +
      '建議「BTC should be classified according to ICD11 criteria」［III, A］。</td></tr>' +
      '<tr><td><b>iCCA</b><br>肝內</td><td><b>第二級（節段）膽管以上的細小膽管。</b>' +
      '多長在正常肝實質，典型影像是 mass-forming、動脈期強化的腫瘤。</td></tr>' +
      '<tr><td><b>pCCA</b><br>肝門</td><td><b>左右肝管及其匯合處</b>（Klatskin tumour）。' +
      '另依 <b>Bismuth-Corlette</b> 分型描述解剖位置。</td></tr>' +
      '<tr><td><b>dCCA</b><br>遠端</td><td><b>膽囊管匯入處以下。</b></td></tr>' +
      '<tr><td><b>膽囊癌</b></td><td>自成一類；<b>常在膽囊切除後意外發現</b>。</td></tr>' +
      '<tr><td>❗</td><td>ESMO 提醒：pCCA 與 dCCA 合稱肝外膽管癌，' +
      '<b>但「this latter classification is discouraged due to insufficient anatomical specificity」</b> —— ' +
      '不要只寫「肝外膽管癌」就當分類完成。</td></tr>' +
      '<tr><td>影像分工</td><td><b>「MRI is the reference examination for local extension of pCCA and ' +
      'dCCA and for identification of hepatic metastases」［III, A］。</b>' +
      '胸腹骨盆 CT 用於分期。<br>' +
      '❗<b>有黃疸的病人，影像要在 ERCP／PTC <u>之前</u>做</b>［III, A］ —— ' +
      '「the inserted drains/stents can obscure diagnosis and assessment of the extent of disease」。</td></tr>' +
      '<tr><td>分期</td><td><b>UICC／AJCC 第 8 版，四個部位各有一套 T／N。</b>' +
      'pCCA／dCCA／膽囊癌的 N 分期為 <b>N1 ＝ 1–3 顆、N2 ＝ ≥ 4 顆</b>；iCCA 以 N0／N1 為主。' +
      '詳見本頁「分期 TNM」分頁。</td></tr>' +
      '</table>');
  }

  /* 2b. Bismuth-Corlette 分型（逐字） */
  function bismuthReference() {
    return fold('<b>Bismuth-Corlette 分型</b>（ESMO 2023 補充表 S4，逐字）',
      '<table>' +
      '<tr><td><b>Type I</b></td><td>Tumour involves the common hepatic duct.</td></tr>' +
      '<tr><td><b>Type II</b></td><td>Tumour involves the bifurcation of the common hepatic duct.</td></tr>' +
      '<tr><td><b>Type IIIa</b></td><td>Tumour involves the <b>right</b> hepatic duct.</td></tr>' +
      '<tr><td><b>Type IIIb</b></td><td>Tumour involves the <b>left</b> hepatic duct.</td></tr>' +
      '<tr><td><b>Type IV</b></td><td>Tumour involves <b>both</b> the right and left hepatic ducts.</td></tr>' +
      '<tr><td>❗</td><td>ESMO 明講這個分型<b>不能完全取代手術探查</b>：' +
      '「In a substantial proportion of patients with pCCA, diagnosis and assessment of resectability ' +
      'according to the Bismuth-Corlette classification <b>can only be determined through surgical ' +
      'exploration</b>」。<b>影像判不出來就是判不出來，要開下去看。</b></td></tr>' +
      '</table>');
  }

  /* 2c. 各部位的手術原則 */
  function surgeryReference() {
    return fold('<b>四個部位的手術原則</b>（ESMO 2023；亞洲版差異一併列出）',
      '<table>' +
      '<tr><td><b>iCCA</b></td><td><b>肝切除，並常規做肝十二指腸韌帶的淋巴結摘除</b> —— ' +
      '因為淋巴結轉移是重要預後因子（「this has led to the recommendation of routine ' +
      'lymphadenectomy at the level of the hepato-duodenal ligament during surgery」）。<br>' +
      'EASL-ILCA：<b>肝內分期用 MRI 優於 CT</b>（LoE 2，強建議，共識 89%）。<br>' +
      '❗<b>EASL-ILCA Rec 10 與 ESMO 方向相反</b>：EASL-ILCA 建議' +
      '「apparent resectable iCCA 應常規做 FDG-PET，以找出標準影像看不到的淋巴結轉移」' +
      '（LoE 2，強建議）；<b>ESMO 與亞洲版則不建議把 PET 用於原發診斷／原發影像。</b>' +
      '這一格兩份指引不一致，請提多專科團隊討論。</td></tr>' +
      '<tr><td><b>pCCA</b></td><td><b>「延伸右半肝切除」是最常見的技術路線</b> —— ' +
      '因為左肝管在分節前的解剖走行較長。<b>通常需要右門靜脈栓塞（可含 segment IV 分支）' +
      '以誘發未來肝殘餘（segments II、III）增生</b>［IV, A］。<br>' +
      '延伸左側切除技術上更複雜，但剩下的 segments VI、VII 通常足夠。<br>' +
      '❗<b>Segment I（caudate lobe）因為直接引流入膽管分叉處，必須一併切除。</b><br>' +
      '<b>淋巴結摘除是標配。</b><br>' +
      '亞洲版對門靜脈栓塞加了限制：<b>「only be carried out in high-volume centres」</b>' +
      '［IV, A；共識 100%］。</td></tr>' +
      '<tr><td><b>dCCA</b></td><td><b>和其他膽管癌不同 —— dCCA 要切胰頭</b>，' +
      '通常是<b>胰十二指腸切除（Whipple）加上延伸至肝門的膽管切除</b>，' +
      '含引流淋巴結摘除與胃、殘餘胰臟的重建。<br>' +
      '<b>預後可能與胰頭腺癌相當。</b><br>' +
      '❗<b>長期後遺症要先和病人講</b>：術後<b>吸收不良約 80%、腹瀉約 30%</b>' +
      '（殘餘胰臟功能不足），需要長期治療。</td></tr>' +
      '<tr><td><b>膽囊癌</b></td><td><b>「In case of incidentally diagnosed GBC ' +
      '(post-cholecystectomy), re-operation with radical intent should be offered to sufficiently ' +
      'fit patients with <u>stage ≥ T1b</u> disease, provided there is no metastatic spread」</b>［IV, A］。<br>' +
      '<b>再次手術的範圍：切除部分或全部的 segment IVb／V，並做肝十二指腸韌帶淋巴結摘除</b>［II, A］。<br>' +
      '<b>「Resection of the port sites may also be considered if the gallbladder was not removed ' +
      'with a bag or if the gallbladder was perforated」</b>［IV, C］' +
      '（亞洲版把這一條限於開腹手術）。</td></tr>' +
      '<tr><td>❗ 共通</td><td><b>有黃疸的病人，影像要在 ERCP／PTC 之前做</b>［III, A］。' +
      '術前膽道引流「almost universally practised unless bilirubin is low」。' +
      '肝切除要一併考慮未來肝殘餘，可能需要門靜脈栓塞或雙血管栓塞。</td></tr>' +
      '</table>');
  }

  /* 2d. 分子檢測 */
  function molReference() {
    return fold('<b>分子檢測：什麼時候驗、驗哪些、怎麼驗</b>（ESMO 2025 期中更新）',
      '<table>' +
      '<tr><td><b>時機</b></td><td><b>「Molecular profiling is recommended <u>when first-line ' +
      'systemic treatment is initiated</u> in patients with locally advanced, advanced or metastatic ' +
      'disease, particularly in those at high risk of progression or recurrence」［I, A］。</b><br>' +
      '<b>也就是在第一線開始的時候就送驗，不要等到失敗才驗</b> —— 標靶藥全部要「至少一線失敗後」' +
      '才用得上，報告等不到就接不上。</td></tr>' +
      '<tr><td><b>基因套組</b></td><td>ESMO 明列：<b>IDH1、FGFR2、BRAF、HER2、NTRK、RET、' +
      'BRCA1/2、PALB2</b>，也可以納入 <b>c-MET</b>。</td></tr>' +
      '<tr><td><b>方法</b></td><td>優先用 <b>focused NGS 一次驗多個基因</b>，不要單基因逐一驗。<br>' +
      '❗<b>FGFR2 與 NTRK 的融合「should preferably be interrogated at the RNA level」</b> —— ' +
      '<b>用 DNA panel 可能漏掉融合，這一點在送檢時要交代清楚。</b></td></tr>' +
      '<tr><td><b>盛行率<br>與部位</b></td><td><b>IDH1</b> R132：iCCA 約 8–18%。<br>' +
      '<b>FGFR2</b> 融合／重排：全體 &lt; 10%，<b>iCCA 5–15%</b>。<br>' +
      '<b>HER2</b> 擴增：5–10%，<b>但 dCCA／pCCA／膽囊癌可到 10–20%</b>。<br>' +
      '<b>BRAF V600E</b>：&lt; 5%。<b>NTRK</b> 融合：&lt; 0.1–1%（很罕見）。<br>' +
      '<b>白話：iCCA 找 IDH1 與 FGFR2；肝外與膽囊癌找 HER2。</b></td></tr>' +
      '<tr><td>❗ 台灣端</td><td><b>健保通則十二對檢測報告出自哪一種實驗室有硬性規定</b> —— ' +
      'pemigatinib（9.98）與 larotrectinib（9.95）的基因檢測都要符合，' +
      '<b>不符資格的報告會讓申請被退件。</b></td></tr>' +
      '</table>');
  }

  /* 2e. 標靶藥：指引怎麼說、台灣拿不拿得到 */
  function targetReference() {
    /* ⚠ 用 fold() 不是 foldRx()：藥卡掃描會讀所有 details.rx-table，
       而這張表列的是「整份分子標記選單」（含台灣拿不到的藥），不是這位病人的處方。 */
    return fold('<b>各分子標記的藥：指引建議 vs 台灣實際拿得到什麼</b>',
      '<table>' +
      '<tr><td><b>IDH1</b><br>R132 突變</td><td><b>指引：ivosidenib</b>［I, A；MCBS 2；ESCAT I-A］，' +
      '用於至少一線全身治療後進展者。ClarIDHy 的 PFS HR 0.37；OS 校正 70% crossover 後 HR 0.49。<br>' +
      '<b>台灣：ivosidenib（拓舒沃 Tibsovo）2024/10/23 已有藥證，適應症明列 IDH1 變異之膽管癌，' +
      '但健保藥品品項查無此成分 → 自費。</b></td></tr>' +
      '<tr><td><b>FGFR2</b><br>融合／重排</td><td><b>指引：futibatinib（MCBS 3）與 pemigatinib。</b><br>' +
      '<b>台灣：pemigatinib（Pemazyre 達伯坦）健保 9.98 有給付，112/5/1 起</b> —— ' +
      '❗<b>但健保條文寫「肝內膽管癌」，比藥證的「膽管癌」窄一格；肝外膽管癌與膽囊癌' +
      '即使驗到 FGFR2 融合也不在條文內。</b>必須「接受過全身性藥物治療」之後才能用，' +
      '<b>每日限處方 1 粒</b>，檢測須符合通則十二。<br>' +
      '❗<b>' + NR('futibatinib') + '（Lytgobi）在台灣連藥證都沒有</b>' +
      '（infigratinib、derazantinib、tinengotinib 亦同）—— <b>自費也買不到。</b></td></tr>' +
      '<tr><td><b>HER2</b><br>過度表現／擴增</td><td><b>指引（2025 期中更新新增兩條）：' +
      '<b>trastuzumab deruxtecan</b>［III, A；MCBS 3；ESCAT I-C］用於 HER2 過度表現／擴增且' +
      '先前治療後進展或不耐受者；<b>zanidatamab</b>［III, A；MCBS 3；ESCAT I-C］用於' +
      '先前治療過的 HER2 陽性疾病（HERIZON-BTC-01：ORR 41.3%、中位 PFS 5.5 個月）。<br>' +
      '<b>台灣：' + NR('trastuzumab deruxtecan') + ' 的藥證已含泛腫瘤 HER2 IHC3+，' +
      '但健保 9.115 只給付乳癌 → 膽道癌自費。</b><br>' +
      '❗<b>' + NR('zanidatamab') + '（Ziihera）在台灣連藥證都沒有。</b><br>' +
      '<b>' + NR('trastuzumab') + '（9.18）的健保只有乳癌與胃癌，膽道癌沒有。</b></td></tr>' +
      '<tr><td><b>BRAF V600E</b></td><td><b>指引：dabrafenib ＋ trametinib</b> —— ' +
      'ESMO 2023 給［I, A］，<b>但亞洲版下調為［III, A］</b>（依據只有 ROAR 這個第 2 期籃式試驗：' +
      'ORR 51%、中位 PFS 9 個月、中位 OS 14 個月）。<br>' +
      '<b>台灣：' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') + ' 的藥證第 4 項已是泛腫瘤 ' +
      'BRAF V600E（可涵蓋膽道癌），但健保 9.91 只給黑色素瘤與 BRAF V600E 非小細胞肺癌 → 自費。</b></td></tr>' +
      '<tr><td><b>NTRK</b><br>融合</td><td><b>指引：entrectinib、larotrectinib、repotrectinib。</b><br>' +
      '<b>台灣：只有 larotrectinib（9.95 第 3 項第 7 款）有給付</b>，條文列「肝內膽管癌」。<br>' +
      '❗<b>該條文自我矛盾</b>：標題寫「肝內膽管癌」，同一項的內文卻寫' +
      '「無法手術切除或晚期或復發之膽道癌（含肝內膽管）」。' +
      '<b>送審以「肝內膽管癌」較保險。</b><br>' +
      '❗門檻含「<b>沒有合適的替代治療選項（包含免疫檢查點抑制劑）</b>」—— ' +
      '<b>如果病人還能用 durvalumab，理論上不算「無替代選項」。</b><br>' +
      '❗<b>' + NR('entrectinib') + '（9.93）雖然藥證有 NTRK 泛腫瘤適應症，健保只給 ROS1 陽性' +
      '非小細胞肺癌 → 膽道癌自費。同一個 biomarker、同一個病人，選錯藥就從給付變自費。</b></td></tr>' +
      '<tr><td><b>MSI-H／dMMR</b></td><td>指引把 pembrolizumab 列為泛腫瘤選項。' +
      '<b>台灣：' + NR('pembrolizumab') + ' 用於膽道癌健保不給付</b>（見下方一線那一格）。</td></tr>' +
      '<tr><td>❗ 一個灰區</td><td>健保 9.69 第 3 項第(4)款：ICI「<b>無效後或給付時程期滿後則不再給付' +
      '該適應症相關之標靶藥物</b>」。<b>但 pemigatinib（9.98）與 larotrectinib（9.95）本身又要求' +
      '「接受過全身性藥物治療」才能用</b> —— 兩條規定的關係條文並未釐清。' +
      '<b>這是實務上必須先和審查單位確認的灰區，不要假設一定接得上。</b></td></tr>' +
      '</table>');
  }

  /* 2f. 健保條文 */
  function nhiReference() {
    return fold('<b>健保怎麼給</b>（藥品給付規定第 9 節；查詢日 2026-08-17）',
      '<table>' +
      '<tr><td><b>一線 GC</b><br>9.4 ＋ cisplatin</td><td>' +
      '❗<b>健保沒有任何一條寫「gemcitabine ＋ cisplatin 用於膽道癌」。</b>' +
      '能給付是兩件事拼起來的：<b>9.4 第 1 項把「膽道癌」列入 gemcitabine 的給付範圍</b>' +
      '（Gemmis 品項另在第 2 項第(5)款寫「無法手術切除或晚期或復發之膽道癌（含肝內膽管）」），' +
      '<b>而 cisplatin 查無給付規定條文、屬無限制品項</b>。<br>' +
      '<b>所以 GC 兩支各自成立，不需要事前審查。</b></td></tr>' +
      '<tr><td><b>一線三藥</b><br>9.69（TOPAZ-1）</td><td>' +
      '<b>durvalumab ＋ cisplatin ＋ gemcitabine 有給付</b>（9.4 第 2 項第(6)款與 9.69 第 2 項第(6)款）。' +
      '事審代碼 <b>P121</b>，<b>不需檢附 PD-L1 報告</b>。<br>' +
      '❗<b>條文明文「限 durvalumab」</b> —— ' + NR('pembrolizumab') + ' 那一欄寫的是' +
      '「本藥品尚未給付於此適應症」。<br>' +
      '❗<b>壺腹癌明文除外</b>（兩條文都寫「壺腹癌除外」）。' +
      '臨床上 periampullary 腫瘤常被含糊歸在膽道癌，<b>申報三藥併用時壺腹癌一律不給付。</b><br>' +
      '另排除「曾接受異體器官移植」與「具有或曾有活動性自體免疫或發炎性疾病」。<br>' +
      '<b>化療至多 8 個療程；ICI 總給付時程自初次處方日起算 2 年</b>（兩個不同的天花板）。</td></tr>' +
      '<tr><td><b>❗ 肝功能<br>門檻放寬</b></td><td>9.69 第 3 項第(2)款 II：' +
      '「GOT &lt; 60 U/L 及 GPT &lt; 60 U/L，且 T-bilirubin &lt; 1.5 mg/dL' +
      '（<b>晚期肝細胞癌以及膽道癌病人可免除此條件</b>）」。<br>' +
      '<b>這對膽道阻塞、支架術後肝指數高的病人是關鍵放寬 —— 很多人不知道而先放棄申請。</b><br>' +
      '❗<b>但腎功能沒有放寬</b>：仍要 Creatinine &lt; 1.5 且 eGFR &gt; 60，' +
      '另加 ECOG ≤ 1 與 NYHA Class I 或 II。<b>這反而是實務上更常被卡的一關。</b></td></tr>' +
      '<tr><td><b>❗ durvalumab<br>的 SD 陷阱</b></td><td>9.69 第 3 項第(8)款 IV：' +
      '「使用 atezolizumab、pembrolizumab、<b>durvalumab</b>、tremelimumab 後評估疾病呈穩定狀態者（SD），' +
      '可持續再用藥 12 週，並於 12 週後再次評估；<b>經連續二次評估皆為 SD 者，不得申請續用。</b>」<br>' +
      '（nivolumab、avelumab、ipilimumab、cemiplimab 的 SD 可以續用，<b>durvalumab 不行</b>。）</td></tr>' +
      '<tr><td><b>被忽略的<br>健保內一線</b><br>9.46（GS）</td><td>' +
      '<b>gemcitabine ＋ S-1（GS，JCOG1113 的方案）自 113/2/1 起有健保給付</b>，' +
      '作為<b>晚期或復發膽道癌的第一線治療，而且不需要事前審查</b>。<br>' +
      '<b>對 cisplatin 有禁忌的病人（腎功能不佳、聽力受損），這是健保內現成的替代一線，' +
      '臨床上常被漏掉。</b><br>' +
      '❗注意 9.10 第 2 項另有一句「與 fluoropyrimidine 類藥物（如 capecitabine、5-FU、UFUR，' +
      '<b>但不包含 TS-1</b>）併用」—— 別把兩條文混搭。</td></tr>' +
      '<tr><td><b>術後輔助</b></td><td>❗<b>完全落空。</b>' +
      NR('capecitabine') + ' 的 9.17 全文只有乳癌、轉移性大腸直腸癌、第三期結腸癌術後輔助、' +
      '晚期胃癌 —— <b>沒有任何一項提到膽道癌</b>；<b>而且 Xeloda 的藥證適應症也只有乳癌、' +
      '結腸直腸癌、胃癌</b>。<br>' +
      '<b>所以膽道癌的術後輔助 capecitabine 在台灣是「藥證外 ＋ 健保外」的雙重超適應症使用。</b><br>' +
      '<b>全台灣沒有任何一條健保條文提到膽道癌的術後輔助治療。</b>' +
      '這是指引與健保落差最大的一塊。</td></tr>' +
      '<tr><td><b>二線 FOLFOX</b></td><td>❗<b>卡在 oxaliplatin。</b>' +
      '5-FU 與 leucovorin 都查無給付規定條文（無限制品項），' +
      '<b>但 ' + NR('oxaliplatin') + ' 的 9.10 條文標題就括號寫明「需符合藥品許可證登載之適應症」，' +
      '內文只有結腸直腸癌、胃癌、轉移性胰臟癌 FOLFIRINOX；所查 10 張 oxaliplatin 許可證的' +
      '適應症也沒有一張提到膽。</b><br>' +
      '<b>所以 ABC-06 的二線 FOLFOX 在健保下沒有對應條文，缺口就在 oxaliplatin。</b><br>' +
      NR('irinotecan') + '（9.12.1 限轉移性大腸直腸癌一線）與 ' + NR('liposomal irinotecan') +
      '（9.12.2 限胰腺癌）用於膽道癌也都沒有給付。</td></tr>' +
      '<tr><td><b>❗ 膽囊癌</b></td><td><b>健保條文從頭到尾沒有出現「膽囊癌」三個字</b>，' +
      '一律用「膽道癌（biliary tract cancer）」（9.4、9.69、9.46）或' +
      '「膽管癌／肝內膽管癌」（9.98、9.95）。<br>' +
      '<b>實務推論：膽囊癌屬於「膽道癌」概念下（TOPAZ-1 的 BTC 本就含膽囊癌），' +
      '故 gemcitabine、durvalumab 三藥、GS 方案應可涵蓋；' +
      '但 pemigatinib 與 larotrectinib 因條文寫「肝內膽管癌」，膽囊癌被排除在外。</b><br>' +
      '❗<b>這是條文的解釋空間而不是明文規定，送審前值得先確認。</b></td></tr>' +
      '<tr><td>查核限制</td><td>食藥署查詢站於本次查核時無法連線，' +
      '藥證狀態改以食藥署開放資料平臺「未註銷藥品許可證資料集」（資料檔日期 2026/8/13，' +
      '22,362 張許可證）核對。<b>若之後有新藥證在此快照日之後核准，本頁結論會落後，須重查。</b></td></tr>' +
      '</table>');
  }

  /* 2g. 全身治療處方 */
  function rxReference(line) {
    var rows = '';
    if (line !== 'l2' && line !== 'l3') {
      rows += '<tr><td><b>第一線<br>（現行條文）</b></td><td>' +
        '<b>ESMO 2025 期中更新已把兩個組合並列：「Cisplatin–gemcitabine–durvalumab and ' +
        'cisplatin–gemcitabine–pembrolizumab are recommended as first-line therapy」［I, A］。</b><br>' +
        '<b>並明言「At present, there are no discernible clinical, biochemical or molecular biomarkers, ' +
        'nor any notable differences in efficacy or toxicity, favouring one immune checkpoint inhibitor ' +
        'over the other.」 —— 兩個之間沒有生物標記可以分。</b><br>' +
        'TOPAZ-1（durvalumab）OS HR 0.76（95% CI 0.64–0.91）；' +
        'KEYNOTE-966（pembrolizumab，n = 1069）中位 OS 12.7 vs 10.9 個月（HR 0.83，P = 0.0034）。<br>' +
        '❗<b>台灣健保只給 durvalumab</b>（9.69 明文「限 durvalumab」）—— ' +
        NR('pembrolizumab') + ' 有藥證但要自費。</td></tr>' +
        '<tr><td><b>不能用 cisplatin<br>的時候</b></td><td>' +
        '<b>ESMO：「Oxaliplatin may be substituted for cisplatin when renal function is of ' +
        'concern」［II, B］。</b><br>' +
        '<b>亞洲版擴充：「Oxaliplatin or carboplatin may be substituted for cisplatin when renal ' +
        'or auditory function is of concern, while gemcitabine plus S-1 can be an option」。</b><br>' +
        '❗<b>台灣實務上最好用的是 gemcitabine ＋ S-1（GS）</b> —— ' +
        '<b>健保 9.46 自 113/2/1 起給付、不需事前審查</b>；' +
        '而 ' + NR('oxaliplatin') + ' 用於膽道癌健保沒有條文。</td></tr>' +
        '<tr><td><b>體能 PS 2</b></td><td><b>ESMO：「Gemcitabine monotherapy may be used in patients ' +
        'with a PS of 2」［IV, B］。</b></td></tr>' +
        '<tr><td>療程長度</td><td><b>ESMO：「There is currently insufficient evidence to recommend ' +
        'continuous treatment beyond 6 months」。</b>健保的化療上限是 8 個療程。</td></tr>' +
        '<tr><td>膽紅素升高</td><td>已盡量支架引流的腔內病灶，<b>膽紅素中度上升仍可考慮 cis-gem</b>。' +
        '<b>健保也為膽道癌免除肝指數門檻。</b></td></tr>';
    }
    rows += '<tr><td><b>第二線</b></td><td><b>ESMO 2023：「FOLFOX is the SoC in the second-line ' +
      'setting after cisplatin–gemcitabine」［I, A］</b>（ABC-06，OS HR 0.69）。<br>' +
      '❗<b>但 ESMO 自己註明「ESMO-MCBS v1.1 score: 1」與「no specific licensed indication in BTC」</b> —— ' +
      '<b>MCBS 只有 1 分：對照組中位 OS 5.3 個月，增益 0.9 個月。獲益是真的，但很小。</b><br>' +
      '<b>亞洲版把等級下調為［II, B］並加入 irinotecan 為選項。</b><br>' +
      '❗<b>台灣健保：FOLFOX 卡在 ' + NR('oxaliplatin') + '（9.10 要求符合藥證，' +
      '而 oxaliplatin 藥證無膽道癌）。5-FU 與 leucovorin 本身是無限制品項。</b></td></tr>' +
      '<tr><td><b>分子標記<br>導向</b></td><td><b>驗到 IDH1、FGFR2、HER2、BRAF V600E、NTRK 或 MSI-H 的病人，' +
      '二線之後有各自的標靶藥</b> —— 見下方「各分子標記的藥」那張表，' +
      '<b>以及台灣拿不拿得到。</b></td></tr>';
    /* ⚠ 同上：這是跨線別的完整選單，不標 rx-table。 */
    return fold('<b>全身性治療的處方</b>（ESMO 2023 ＋ 2025 期中更新 ＋ 泛亞洲版）',
      '<table>' + rows + '</table>');
  }

  /* 2h. 追蹤 */
  function followupHTML(kind) {
    var head = '<div class="fu-h">接下來怎麼追蹤</div>';
    if (kind === 'curative') {
      return head + '<ul class="fu-list">' +
        '<li><b>ESMO 與亞洲版同一段字：「There is no universal follow-up schedule」</b> —— ' +
        '沒有公認的排程，但因為病人會出現治療相關併發症與復發，追蹤是必要的。</li>' +
        '<li>指引舉的做法［IV, B］：<b>前 2 年每 3–6 個月一次，之後每 6–12 個月一次，到 5 年</b>' +
        '（或依臨床需要）；<b>5 年之後可延長為每年一次</b>。</li>' +
        '<li>內容可包含<b>理學檢查、實驗室檢查、腫瘤標記，以及胸腹骨盆 CT</b>。</li>' +
        '<li>❗<b>dCCA 做過 Whipple 的病人要另外追胰臟功能</b>：' +
        '<b>吸收不良約 80%、腹瀉約 30%</b>，需要長期治療。</li>' +
        '<li>發現復發 → 回步驟 1 選「無法切除或轉移」。</li></ul>';
    }
    if (kind === 'adv') {
      return head + '<ul class="fu-list">' +
        '<li>治療中依影像與臨床評估；<b>健保的 ICI 給付要每 12 週評估一次</b>，' +
        '<b>總給付時程自初次處方日起算 2 年</b>。</li>' +
        '<li>❗<b>durvalumab 連續兩次評估都是 SD，健保就不得申請續用</b>' +
        '（9.69 3.(8)IV）—— 這一條和 nivolumab 不一樣。</li>' +
        '<li><b>分子檢測的報告要在第一線就送出去</b>：所有標靶藥都要「至少一線失敗後」才用得上，' +
        '報告等不到就接不上。</li>' +
        '<li>膽道阻塞要持續處理（支架通暢、膽道感染）—— 這常常是決定能不能繼續治療的因素。</li></ul>';
    }
    return head + '<ul class="fu-list">' +
      '<li>高風險族群的監測（EASL-ILCA）：<b>原發性膽道硬化性膽管炎（PSC）建議每年以非侵入性影像監測</b>' +
      '（LoE 4，弱建議，共識 97%），<b>其中 MRI／MRCP 對 iCCA 的診斷準確度最高</b>（共識 93%）。</li>' +
      '<li><b>肝硬化病人每 6 個月一次超音波，可有效在早期發現 iCCA</b>（共識 87%）。</li>' +
      '<li><b>肝吸蟲感染者的腹部超音波監測是該指引唯一 100% 同意的強建議。</b></li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function ccaPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">膽道癌的臨床內容<b>依院外實證</b>編成 —— ' +
      '主幹為 <b>ESMO 膽道癌臨床實務指引</b>（Ann Oncol 2023;34:127-140）' +
      '與<b>現行的 2025 期中更新</b>（ESMO Open 2025;10:104003），' +
      '並對照<b>與台灣腫瘤醫學會共同協調的泛亞洲版</b>（ESMO Open 2024;9:103647，' +
      '第一作者陳立宗，含台大專家）與 <b>EASL-ILCA</b> 的肝內膽管癌條文；' +
      '<b>台大醫院沒有膽道癌診療指引，台灣也沒有全國性指引。</b><br>' +
      '⚠<b>這個癌別的第一件事是先確認解剖部位</b>：肝內、肝門、遠端、膽囊四者的可切除性判定、' +
      '手術範圍、標靶藥盛行率與健保給付都不一樣。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是分型、手術原則、' +
      '分子檢測、處方與健保條文。</p>';
    h += '<div class="onc-path" id="ccaPath">';

    h += node0('cc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'dx', '剛診斷，要決定能不能開刀', '先分部位') +
      opt('scope', 'postop', '已經切除，要決定術後輔助治療', '') +
      opt('scope', 'adv', '無法切除或已轉移，要決定全身治療', '') +
      opt('scope', 'mol', '想知道驗到某個分子標記之後怎麼用藥', '台灣拿不拿得到'));

    /* ── A. 診斷與可切除性 ── */
    h += '<div id="cc_b_dx" class="hidden">';
    h += node('cc_n_site', '2', '解剖部位是哪一個？（ESMO 要求先分部位再談治療）',
      opt('site', 'icca', '肝內膽管癌 iCCA', '第二級（節段）膽管以上；找 IDH1 與 FGFR2') +
      opt('site', 'pcca', '肝門膽管癌 pCCA', '左右肝管及其匯合處；另用 Bismuth-Corlette 分型') +
      opt('site', 'dcca', '遠端膽管癌 dCCA', '膽囊管匯入處以下；手術是 Whipple') +
      opt('site', 'gbc', '膽囊癌 GBC', '常在膽囊切除後意外發現'),
      siteReference());
    h += recBox('cc_r_site', '建議處置 · 這個部位要先做什麼');
    h += node('cc_n_inc', '3', '這個膽囊癌是怎麼發現的？',
      opt('inc', 'inc', '膽囊切除後病理意外發現', '要判斷 T 分期決定要不要再開一次') +
      opt('inc', 'known', '術前就診斷出來', ''));
    h += node('cc_n_rsec', '3', '多專科評估後，切得下來嗎？',
      opt('rsec', 'res', '可以切除', '') +
      opt('rsec', 'unres', '無法切除，或已有轉移', ''));
    h += recBox('cc_r_rsec', '建議處置 · 手術範圍與術前準備');
    h += fuBox('cc_f_dx');
    h += '</div>';

    /* ── B. 術後輔助 ── */
    h += '<div id="cc_b_postop" class="hidden">';
    h += node('cc_n_ptn', '2', '手術的切緣與淋巴結結果是哪一種？',
      opt('ptn', 'r0n0', 'R0 切除、淋巴結陰性', '') +
      opt('ptn', 'r0n1', 'R0 切除、但淋巴結陽性', '') +
      opt('ptn', 'r1', 'R1 切除（顯微鏡下切緣陽性）', ''));
    h += recBox('cc_r_adj', '建議處置 · 術後輔助治療');
    h += fuBox('cc_f_adj');
    h += '</div>';

    /* ── C. 晚期全身治療 ── */
    h += '<div id="cc_b_adv" class="hidden">';
    h += node('cc_n_line', '2', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', '') +
      opt('line', 'l3', '第三線以後', '分子標記導向'));
    h += node('cc_n_fit', '3', '體能與器官功能如何？（決定 cisplatin 能不能用）',
      opt('fit', 'good', 'ECOG 0–1，腎功能與聽力都可以', '') +
      opt('fit', 'renal', '腎功能不佳或聽力受損', 'cisplatin 要換掉') +
      opt('fit', 'ps2', 'ECOG 2', ''));
    h += recBox('cc_r_adv', '建議處置 · 全身性治療');
    h += fuBox('cc_f_adv');
    h += '</div>';

    /* ── D. 分子標記 ── */
    h += '<div id="cc_b_mol" class="hidden">';
    h += node('cc_n_mol', '2', '驗到哪一個分子標記？',
      opt('mol', 'idh1', 'IDH1 R132 突變', 'iCCA 約 8–18%') +
      opt('mol', 'fgfr2', 'FGFR2 融合／重排', 'iCCA 約 5–15%') +
      opt('mol', 'her2', 'HER2 過度表現或擴增', '肝外與膽囊癌可到 10–20%') +
      opt('mol', 'braf', 'BRAF V600E 突變', '') +
      opt('mol', 'ntrk', 'NTRK 融合', '很罕見') +
      opt('mol', 'msi', 'MSI-H／dMMR', '') +
      opt('mol', 'none', '都沒有驗到，或還沒驗', ''));
    h += recBox('cc_r_mol', '建議處置 · 這個標記怎麼用藥、台灣拿不拿得到');
    h += fuBox('cc_f_mol');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="ccaReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="cc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="cc_drugs"></div>';
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
    var root = el('ccaPath');
    if (!root) return;
    root.querySelectorAll('.cc-node').forEach(function (n) {
      if (n.id !== 'cc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['cc_b_dx', 'cc_b_postop', 'cc_b_adv', 'cc_b_mol'].forEach(function (id) { show(id, false); });
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
      (extra || '') + (src ? '<div class="rec-note">' + src + '</div>' : '');
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
  function renderDx() {
    show('cc_b_dx', true);
    show('cc_n_site', true);
    if (!S.site) return;

    var L = [], title = SITE_LABEL[S.site];

    if (S.site === 'icca') {
      title += '<br>→ MRI 為主的分期、常規肝門淋巴結摘除，並在一線就送分子檢測';
      L.push(H('影像', 'ESMO 2023；EASL-ILCA'));
      L.push('<b>肝內分期用 MRI 優於 CT</b>（EASL-ILCA，LoE 2、強建議、共識 89%）；' +
        '胸腹骨盆 CT 用於整體分期。');
      L.push('❗<b>PET 這一格兩份指引方向相反</b>：<b>EASL-ILCA Rec 10 建議' +
        '「看起來可切除的 iCCA 應常規做 FDG-PET，以找出標準影像看不到的淋巴結轉移」</b>' +
        '（LoE 2、強建議）；<b>而 ESMO 與亞洲版不建議把 PET 用於原發診斷。</b>' +
        '這一格請提多專科團隊討論。');
      L.push(H('手術要一併做的事', 'ESMO 2023'));
      L.push('<b>常規做肝十二指腸韌帶的淋巴結摘除</b> —— 因為淋巴結轉移是重要預後因子。');
      L.push(H('❗ 分子檢測要現在就送', 'ESMO 2025 期中更新 ［I, A］'));
      L.push('<b>iCCA 是四個部位裡分子標記最多的：IDH1 R132 約 8–18%、FGFR2 融合約 5–15%。</b>');
      L.push('<b>而且台灣健保的兩個給付標靶（pemigatinib 9.98、larotrectinib 9.95）' +
        '條文都寫「肝內膽管癌」—— 這個部位是唯一拿得到的。</b>');
      L.push('<b>FGFR2 與 NTRK 的融合要在 RNA 層次驗</b>，用 DNA panel 可能漏掉。');
    } else if (S.site === 'pcca') {
      title += '<br>→ 影像要在引流之前做；手術多為延伸右半肝切除，Segment I 必切';
      L.push(H('❗ 順序不能顛倒', 'ESMO 2023 ［III, A］'));
      L.push('<b>「Radiological imaging should be carried out before ERCP or PTC in patients with ' +
        'jaundice」 —— 有黃疸的病人，影像要在膽道引流之前做。</b>');
      L.push('<b>理由：放進去的引流管或支架會遮蔽診斷與範圍評估</b>' +
        '（the inserted drains/stents can obscure diagnosis and assessment of the extent of disease）。');
      L.push('<b>術前膽道引流「almost universally practised unless bilirubin is low」。</b>');
      L.push(H('分型', 'ESMO 2023 補充表 S4'));
      L.push('<b>用 Bismuth-Corlette 分型描述解剖位置</b>（見下方收合的逐字定義）。');
      L.push('❗<b>但 ESMO 明講這個分型不能完全取代手術探查</b>：' +
        '「can only be determined through surgical exploration」。<b>影像判不出來就要開下去看。</b>');
      L.push(H('手術範圍', 'ESMO 2023'));
      L.push('<b>延伸右半肝切除是最常見的技術路線</b>（左肝管在分節前走行較長）；' +
        '<b>通常需要右門靜脈栓塞以誘發未來肝殘餘增生</b>［IV, A］。');
      L.push('❗<b>Segment I 因為直接引流入膽管分叉處，必須一併切除。</b>');
      L.push('<b>淋巴結摘除是標配。</b>');
      L.push('<b>亞洲版對門靜脈栓塞加了限制：只能在高量中心做</b>［IV, A；共識 100%］。');
    } else if (S.site === 'dcca') {
      title += '<br>→ 手術是 Whipple；術後吸收不良與腹瀉的比例要先講';
      L.push(H('❗ 順序不能顛倒', 'ESMO 2023 ［III, A］'));
      L.push('<b>有黃疸的病人，影像（MRI 為局部範圍的參考檢查）要在 ERCP／PTC 之前做。</b>');
      L.push(H('手術範圍', 'ESMO 2023'));
      L.push('<b>「In contrast to other forms of CCA, dCCA requires removal of the pancreatic head」</b> —— ' +
        '<b>和其他膽管癌不同，dCCA 要切胰頭</b>，通常是<b>胰十二指腸切除（Whipple）' +
        '加上延伸至肝門的膽管切除</b>，含引流淋巴結摘除與胃、殘餘胰臟的重建。');
      L.push('<b>預後可能與胰頭腺癌相當。</b>');
      L.push(H('❗ 術前就要講的長期後遺症', 'ESMO 2023'));
      L.push('<b>胰十二指腸切除後：吸收不良約 80%、腹瀉約 30%</b>（殘餘胰臟功能不足），' +
        '<b>需要長期治療。</b>');
      L.push(EV('這一條 ESMO 特別寫出來，因為它會影響病人對手術的知情同意，' +
        '也影響術後追蹤要看什麼。'));
    } else {
      title += '<br>→ 先確定是不是膽囊切除後意外發現，再看 T 分期';
      L.push(H('膽囊癌最常見的情境', 'ESMO 2023 ［IV, A］'));
      L.push('<b>常在膽囊切除後的病理意外發現。</b>' +
        '<b>「In case of incidentally diagnosed GBC (post-cholecystectomy), re-operation with radical ' +
        'intent should be offered to sufficiently fit patients with <u>stage ≥ T1b</u> disease, ' +
        'provided there is no metastatic spread」。</b>');
      L.push('<b>T1b 是門檻 —— T1a 不需要再開，T1b 以上而體能足夠、沒有轉移的，就要提再次手術。</b>');
      L.push(H('再次手術要做什麼', 'ESMO 2023 ［II, A］'));
      L.push('<b>切除部分或全部的 segment IVb／V，並做肝十二指腸韌帶的淋巴結摘除。</b>');
      L.push('<b>「Resection of the port sites may also be considered if the gallbladder was not ' +
        'removed with a bag or if the gallbladder was perforated」</b>［IV, C］ —— ' +
        '<b>膽囊沒有裝袋取出、或術中破掉的話，可以考慮切除 port site</b>' +
        '（亞洲版把這一條限於開腹手術）。');
      L.push(H('❗ 分子標記與台灣健保的落差', ''));
      L.push('<b>膽囊癌的 HER2 擴增比例較高（肝外與膽囊癌可到 10–20%）</b>，' +
        '但 <b>HER2 的藥（T-DXd、zanidatamab）在台灣健保都不給膽道癌</b>。');
      L.push('❗<b>而且健保的 pemigatinib（9.98）與 larotrectinib（9.95）條文寫「肝內膽管癌」，' +
        '膽囊癌被排除在外。</b>健保條文從頭到尾沒有出現「膽囊癌」三個字。');
      L.push('<b>但 gemcitabine（9.4）、durvalumab 三藥（9.69）與 GS（9.46）寫的是' +
        '「膽道癌」，膽囊癌應可涵蓋 —— 這是解釋空間，送審前值得先確認。</b>');
    }

    L.push(H('下一步', ''));
    L.push('<b>下面的步驟決定手術範圍與術前準備。</b>');

    fill('cc_r_site', 'rec-idle', title, L,
      'ESMO 膽道癌 CPG（Ann Oncol 2023;34:127-140）診斷與各部位手術節；' +
      (S.site === 'icca' ? 'EASL-ILCA 肝內膽管癌建議；' : '') +
      '泛亞洲版（ESMO Open 2024;9:103647）。<b>台大無膽道癌指引。</b>',
      more(siteReference(), S.site === 'pcca' ? bismuthReference() : '', surgeryReference(),
        molReference(), nhiReference()));

    if (S.site === 'gbc') {
      setNum('cc_n_inc', '3');
      show('cc_n_inc', true);
      if (!S.inc) return;
      setNum('cc_n_rsec', '4');
    } else {
      setNum('cc_n_rsec', '3');
    }
    show('cc_n_rsec', true);
    if (!S.rsec) return;
    renderRsec();
  }

  function renderRsec() {
    var L = [], cls, title;
    if (S.rsec === 'res') {
      cls = 'rec-elective';
      title = SITE_LABEL[S.site] + '　·　可以切除<br>→ 手術，之後看切緣與淋巴結決定輔助治療';
      L.push(H('手術範圍', 'ESMO 2023'));
      if (S.site === 'icca') {
        L.push('<b>肝切除 ＋ 常規肝十二指腸韌帶淋巴結摘除。</b>');
      } else if (S.site === 'pcca') {
        L.push('<b>多為延伸右半肝切除；Segment I 必須一併切除；淋巴結摘除是標配。</b>');
        L.push('<b>需要時做右門靜脈栓塞以誘發未來肝殘餘增生</b>［IV, A］ —— ' +
          '<b>亞洲版限只能在高量中心做。</b>');
      } else if (S.site === 'dcca') {
        L.push('<b>胰十二指腸切除（Whipple）＋ 延伸至肝門的膽管切除，含引流淋巴結摘除。</b>');
        L.push('<b>術後吸收不良約 80%、腹瀉約 30%，要先和病人講並安排長期治療。</b>');
      } else {
        L.push('<b>切除部分或全部的 segment IVb／V ＋ 肝十二指腸韌帶淋巴結摘除</b>［II, A］。');
        if (S.inc === 'inc') {
          L.push('<b>意外發現且 T1b 以上、體能足夠、無轉移者，應提再次手術</b>［IV, A］。');
          L.push('<b>膽囊沒有裝袋取出或術中破掉，可考慮切除 port site</b>［IV, C］。');
        }
      }
      L.push(H('術前要考慮的', 'ESMO 2023'));
      L.push('<b>肝切除要評估未來肝殘餘</b>，可能需要門靜脈栓塞或雙血管栓塞（肝靜脈＋門靜脈）。');
      L.push('<b>有黃疸的話，影像要在 ERCP／PTC 之前做，術前引流依膽紅素決定。</b>');
      L.push(H('下一步', ''));
      L.push('<b>切完之後回步驟 1 選第二項，依切緣與淋巴結決定輔助治療。</b>');
      fill('cc_r_rsec', cls, title, L,
        'ESMO 2023 各部位手術節；泛亞洲版。<b>台大無膽道癌指引。</b>',
        more(surgeryReference(), S.site === 'pcca' ? bismuthReference() : '', nhiReference()));
      fu('cc_f_dx', 'curative');
      return;
    }

    cls = 'rec-nonop';
    title = SITE_LABEL[S.site] + '　·　無法切除或已轉移<br>→ 走全身治療，並在第一線就送分子檢測';
    L.push(H('❗ 現在就要送分子檢測', 'ESMO 2025 期中更新 ［I, A］'));
    L.push('<b>「Molecular profiling is recommended <u>when first-line systemic treatment is ' +
      'initiated</u>」 —— 在第一線開始的時候就送驗，不要等到失敗才驗。</b>');
    L.push('<b>理由很實際：所有標靶藥都要「至少一線失敗後」才用得上，報告等不到就接不上。</b>');
    L.push('<b>套組要包含 IDH1、FGFR2、BRAF、HER2、NTRK、RET、BRCA1/2、PALB2</b>，' +
      '也可納入 c-MET；<b>FGFR2 與 NTRK 的融合要在 RNA 層次驗。</b>');
    if (S.site === 'icca') {
      L.push('<b>iCCA 特別值得驗：IDH1 約 8–18%、FGFR2 融合約 5–15%，' +
        '而且台灣健保的兩個給付標靶條文都只寫「肝內膽管癌」。</b>');
    } else if (S.site === 'gbc') {
      L.push('<b>膽囊癌與肝外膽管癌的 HER2 擴增可到 10–20%</b>，' +
        '但 <b>HER2 的藥在台灣健保都不給膽道癌</b>。');
    }
    L.push(H('局部治療在 iCCA 的角色', S.site === 'icca' ? 'ESMO 2023；EASL-ILCA' : ''));
    if (S.site === 'icca') {
      L.push('<b>「Local ablation should be considered for patients with iCCA ≤ 3 cm who have ' +
        'contraindications to surgery」</b>［III, A；<b>亞洲版下調為 III, B</b>］ —— ' +
        '系統性回顧的完全消融率 93%、中位存活 30.2 個月。');
      L.push('<b>EASL-ILCA 更保守：單顆 &lt; 2 cm 的 iCCA 熱消融「feasible and safe」，' +
        '對不可切除或不能手術者可能是好的替代</b>（LoE 4、弱建議、共識 79%）。');
      L.push('<b>體外放療／SBRT：局部控制率高（1 年約 83%）但整體存活率偏低</b> —— ' +
        '<b>局部控制好不等於活得久，這一點要分清。</b>');
      L.push('❗<b>肝移植在 iCCA 只能在研究計畫內做</b>（EASL-ILCA Rec 16、17，共識 93%／81%）。');
    } else if (S.site === 'pcca') {
      L.push('❗<b>肝移植在 pCCA 不是標準治療</b> —— ESMO 給的是<b>負向建議</b>：' +
        '「Liver transplantation is <u>not</u> considered a standard treatment for pCCA and ' +
        'participation in clinical trials should be encouraged」<b>［III, D］</b>。');
      L.push(EV('Mayo protocol（新輔助化放療後移植）是探索性的做法，' +
        'ESMO 明確表示不是標準治療，並鼓勵參加臨床試驗。亞洲版完全沿用這一條。'));
    }
    L.push(H('下一步', ''));
    L.push('<b>回步驟 1 選第三項決定全身治療，或選第四項看某個分子標記怎麼用藥。</b>');
    fill('cc_r_rsec', cls, title, L,
      'ESMO 2023 與 2025 期中更新；' + (S.site === 'icca' ? 'EASL-ILCA；' : '') +
      '泛亞洲版。<b>台大無膽道癌指引。</b>',
      more(molReference(), rxReference('l1'), targetReference(), nhiReference()));
    fu('cc_f_dx', 'adv');
  }

  /* ---------- B. 術後輔助 ---------- */
  function renderPostop() {
    show('cc_b_postop', true);
    show('cc_n_ptn', true);
    if (!S.ptn) return;

    var L = [], cls = 'rec-elective', title;
    title = (S.ptn === 'r1' ? 'R1 切除' : (S.ptn === 'r0n1' ? 'R0 切除、淋巴結陽性' : 'R0 切除、淋巴結陰性')) +
      '<br>→ 輔助化療應考慮；' + (S.ptn === 'r1' ? '之後可再考慮放療' : '放療只在選定的病人');

    L.push(H('輔助化療', 'ESMO 2023 ［II, A］'));
    L.push('<b>「Adjuvant ChT with capecitabine should be considered for patients with CCA or GBC ' +
      'following resection」［II, A］。</b>');
    L.push(EV('<b>等級只有 II，因為 BILCAP 的 ITT 分析沒有達標</b>，' +
      'per-protocol 才顯著：<b>中位存活 53 vs 36 個月</b>（adjusted HR 0.75，95% CI 0.58–0.97，' +
      'P = 0.028；敏感度分析 HR 0.71，95% CI 0.55–0.92，P = 0.010）。' +
      'ESMO 自己寫「Despite the acknowledged limitations of the BILCAP results」。'));
    L.push(H('❗ 亞洲版在這裡不一樣', '泛亞洲版（有台灣專家）'));
    L.push('<b>泛亞洲版把建議改寫為：「Adjuvant ChT with <u>S-1 ［I, A］</u> or capecitabine ' +
      '［II, A］ should be considered for patients with CCA or GBC following resection」' +
      '（共識 100%）。</b>');
    L.push('<b>理由是日本 JCOG1202／ASCOT 隨機第 3 期達到主要終點：' +
      '3 年整體存活 77.1% vs 67.6%（adjusted HR 0.69，95% CI 0.51–0.94）</b>，' +
      '而且亞洲部分地區的 capecitabine 未取得核准。');
    L.push('<b>白話：在亞洲，S-1 的證據等級比 capecitabine 高一級。</b>');
    L.push(EV('三個陰性（ITT 未達標）的隨機試驗要記得：<b>PRODIGE-12（GEMOX）、BCAT（gemcitabine）' +
      '以及 BILCAP 本身的 ITT</b>。輔助治療在這個癌別的證據沒有大腸癌那麼硬。'));

    L.push(H('放射治療', 'ESMO 2023 ［III, C］'));
    if (S.ptn === 'r1') {
      L.push('<b>「RT, after completion of adjuvant capecitabine, might be considered in selected ' +
        'patients (<u>R1 resection of GBC or d/pCCA</u>)」［III, C］ —— 這一格符合。</b>');
      L.push('<b>順序是：先做完輔助化療，之後才考慮放療。</b>');
      L.push('<b>亞洲版把適應症擴到淋巴結陽性，並改為「S-1 或 capecitabine 之後」。</b>');
    } else if (S.ptn === 'r0n1') {
      L.push('<b>ESMO 的條文限「R1 resection of GBC or d/pCCA」，這一格是 R0 —— 不在字面內。</b>');
      L.push('<b>但亞洲版把適應症擴到淋巴結陽性</b>：「Following adjuvant S-1 or capecitabine, ' +
        'subsequent RT or CRT may be considered in selected patients (R1 resection <b>and ' +
        'node-positive disease</b>)」。<b>這一格在亞洲版的字面內。</b>');
      L.push('<b>兩份指引在這一格不一致，請提多專科團隊討論。</b>');
    } else {
      L.push('<b>這一格（R0、淋巴結陰性）不在放療的建議範圍內</b> —— ' +
        'ESMO 限「R1 resection of GBC or d/pCCA」，亞洲版擴到淋巴結陽性，兩者都不含這一格。');
    }
    L.push(EV('<b>支持輔助放療的資料有限，多為回溯性研究</b>；ESMO 引的是 SWOG S0809 這個單臂第 2 期' +
      '（79 例肝外膽管癌或膽囊癌，pT2-4 或 N1 或切緣陽性）。'));

    L.push(H('❗ 台灣健保在這一格完全落空', '9.17；藥證查核'));
    L.push('<b>' + NR('capecitabine') + ' 的健保 9.17 全文只有乳癌、轉移性大腸直腸癌、' +
      '第三期結腸癌術後輔助、晚期胃癌 —— 沒有任何一項提到膽道癌。</b>');
    L.push('<b>而且 Xeloda 的藥證適應症也只有乳癌、結腸直腸癌、胃癌</b> —— ' +
      '<b>所以膽道癌的術後輔助 capecitabine 在台灣是「藥證外 ＋ 健保外」的雙重超適應症使用。</b>');
    L.push('❗<b>全台灣沒有任何一條健保條文提到膽道癌的術後輔助治療。</b>' +
      '這是指引與健保落差最大的一塊。');
    L.push('<b>S-1（9.46）的健保條文寫的是「晚期或復發之膽道癌<u>第一線</u>治療」，' +
      '不是術後輔助</b> —— 亞洲版建議的輔助 S-1 同樣沒有健保條文。');
    L.push('<b>要用就要先向病人說明自費，並依院內程序辦理超適應症使用。</b>');

    L.push(H('下一步', ''));
    L.push('<b>復發時回步驟 1 選第三項（全身治療）或第四項（分子標記）。</b>');

    fill('cc_r_adj', cls, title, L,
      'ESMO 2023 輔助治療節 ［II, A］與放療 ［III, C］；泛亞洲版 3i／3j（S-1 ［I, A］）；' +
      'BILCAP、ASCOT／JCOG1202；健保 9.17／9.46（查詢日 2026-08-17）。' +
      '<b>台大無膽道癌指引，本段屬院外實證。</b>',
      more(rxReference('adj'), nhiReference(), molReference()));
    fu('cc_f_adj', 'curative');
  }

  /* ---------- C. 晚期全身治療 ---------- */
  function renderAdv() {
    show('cc_b_adv', true);
    show('cc_n_line', true);
    if (!S.line) return;

    if (S.line === 'l1') {
      show('cc_n_fit', true);
      if (!S.fit) return;
      renderAdv1();
      return;
    }

    var L = [], title;
    if (S.line === 'l2') {
      title = '第二線<br>→ FOLFOX 是標準，但獲益很小；同時看分子標記';
      L.push(H('標準做法', 'ESMO 2023 ［I, A］'));
      L.push('<b>「FOLFOX is the SoC in the second-line setting after cisplatin–gemcitabine」</b> —— ' +
        'ABC-06 的整體存活 HR 0.69。');
      L.push('❗<b>但 ESMO 同一行就註明「ESMO-MCBS v1.1 score: 1」與' +
        '「no specific licensed indication in BTC」。</b>');
      L.push('<b>MCBS 只有 1 分的意思是：對照組中位存活 5.3 個月，增益只有 0.9 個月。' +
        '獲益是真的，但很小 —— 這件事要和病人講清楚。</b>');
      L.push('<b>泛亞洲版把等級下調為［II, B］，並把 irinotecan 加為選項。</b>');
      L.push(H('❗ 台灣健保', '9.10'));
      L.push('<b>FOLFOX 卡在 ' + NR('oxaliplatin') + '</b>：' +
        '<b>9.10 的條文標題就括號寫明「需符合藥品許可證登載之適應症」，' +
        '內文只有結腸直腸癌、胃癌、轉移性胰臟癌 FOLFIRINOX；' +
        '所查 10 張 oxaliplatin 許可證的適應症也沒有一張提到膽。</b>');
      L.push('<b>5-FU 與 leucovorin 本身是無限制品項，不是瓶頸。</b>');
      L.push('<b>' + NR('irinotecan') + '（9.12.1 限轉移性大腸直腸癌一線）用於膽道癌也沒有給付。</b>');
      L.push(H('❗ 這一格最該做的事', 'ESMO 2025 期中更新'));
      L.push('<b>把分子檢測報告拿出來看。</b>IDH1、FGFR2、HER2、BRAF V600E、NTRK、MSI-H ' +
        '各有自己的藥，而且都要「至少一線失敗後」才用得上 —— <b>現在正是時候。</b>');
      L.push('<b>回步驟 1 選第四項，可以看每一個標記在台灣拿不拿得到。</b>');
    } else {
      title = '第三線以後<br>→ 主要靠分子標記；沒有標記就以臨床試驗為優先';
      L.push(H('現實', 'ESMO 2023、2025 期中更新'));
      L.push('<b>膽道癌三線之後沒有標準的細胞毒性化療</b> —— ' +
        '<b>能走的路主要是分子標記導向的標靶藥，以及臨床試驗。</b>');
      L.push(H('有標記的話', 'ESMO 2025 期中更新'));
      L.push('<b>IDH1 → ivosidenib［I, A］；FGFR2 融合 → futibatinib／pemigatinib；' +
        'HER2 → trastuzumab deruxtecan／zanidatamab［III, A］；' +
        'BRAF V600E → dabrafenib ＋ trametinib；NTRK → larotrectinib／entrectinib／repotrectinib。</b>');
      L.push('<b>詳細的等級、數據，以及台灣拿不拿得到，見下方那張表；' +
        '也可以回步驟 1 選第四項逐一看。</b>');
      L.push(H('❗ 台灣的現實', '查詢日 2026-08-17'));
      L.push('<b>健保只有兩條路：pemigatinib（9.98，限肝內膽管癌）與 larotrectinib（9.95，限肝內膽管癌）。</b>');
      L.push('<b>' + NR('ivosidenib') + ' 有藥證但健保未收載；' + NR('futibatinib') + ' 與 ' +
        NR('zanidatamab') + ' 連藥證都沒有。</b>');
      L.push(H('沒有標記的話', ''));
      L.push('<b>以臨床試驗為優先。</b>');
    }

    fill('cc_r_adv', 'rec-nonop', title, L,
      'ESMO 2023 第二線節 ［I, A］與 2025 期中更新；泛亞洲版 4d；' +
      '健保 9.10／9.12／9.98／9.95（查詢日 2026-08-17）。<b>台大無膽道癌指引。</b>',
      more(rxReference(S.line), targetReference(), molReference(), nhiReference()));
    fu('cc_f_adv', 'adv');
  }

  function renderAdv1() {
    var L = [], title;
    if (S.fit === 'good') {
      title = '第一線　·　ECOG 0–1、腎功能與聽力都可以<br>→ cisplatin ＋ gemcitabine ＋ 免疫檢查點抑制劑';
      L.push(H('現行條文（2025 期中更新已改）', 'ESMO Open 2025;10:104003 ［I, A］'));
      L.push('<b>「Cisplatin–gemcitabine–<u>durvalumab</u> and cisplatin–gemcitabine–' +
        '<u>pembrolizumab</u> are recommended as first-line therapy」［I, A］ —— 兩個組合並列。</b>');
      L.push('<b>而且 ESMO 明言「目前沒有任何臨床、生化或分子的生物標記，也沒有明顯的療效或毒性差異，' +
        '足以偏好其中一個免疫檢查點抑制劑」。</b>');
      L.push(EV('TOPAZ-1（durvalumab）整體存活 HR 0.76（95% CI 0.64–0.91）；' +
        'KEYNOTE-966（pembrolizumab，n = 1069）中位存活 12.7 vs 10.9 個月' +
        '（HR 0.83，95% CI 0.72–0.95，P = 0.0034）。'));
      L.push(H('❗ 台灣健保只給一個', '9.69 第 2 項第(6)款'));
      L.push('<b>健保條文明文「限 durvalumab」</b>；' + NR('pembrolizumab') +
        ' 在 PD-L1 對照表「膽道癌（併用化療）P121」那一列寫的是<b>「本藥品尚未給付於此適應症」</b>。');
      L.push('<b>' + NR('pembrolizumab') + ' 有台灣藥證（Keytruda 適應症第 12 項明列膽管癌併用 gem/cis），' +
        '但要自費。</b>和病人解釋時要分清「不能用」與「要自費」。');
      L.push('<b>durvalumab 三藥：事審代碼 P121，不需檢附 PD-L1 報告。</b>');
      L.push('❗<b>壺腹癌明文除外</b> —— periampullary 腫瘤常被含糊歸在膽道癌，' +
        '<b>申報三藥併用時壺腹癌一律不給付。</b>');
      L.push('另排除<b>曾接受異體器官移植</b>與<b>具有或曾有活動性自體免疫或發炎性疾病</b>。');
      L.push(H('❗ 兩個容易被誤解的健保門檻', '9.69 第 3 項'));
      L.push('<b>膽道癌可免除肝功能門檻</b>（GOT／GPT &lt; 60、T-bilirubin &lt; 1.5）—— ' +
        '<b>這對膽道阻塞、支架術後肝指數高的病人是關鍵放寬，很多人不知道就先放棄申請了。</b>');
      L.push('❗<b>但腎功能沒有放寬</b>：仍要 Creatinine &lt; 1.5 且 eGFR &gt; 60，' +
        '另加 ECOG ≤ 1 與 NYHA Class I 或 II。<b>這反而是實務上更常被卡的一關。</b>');
      L.push(H('❗ durvalumab 的 SD 陷阱', '9.69 3.(8)IV'));
      L.push('<b>連續兩次評估都是疾病穩定（SD），健保就不得申請續用。</b>' +
        '（nivolumab、avelumab、ipilimumab、cemiplimab 的 SD 可以續用，<b>durvalumab 不行。</b>）');
      L.push('<b>兩個不同的天花板：化療至多 8 個療程；ICI 總給付時程自初次處方日起算 2 年。</b>');
      L.push(H('如果不用免疫', ''));
      L.push('<b>cisplatin ＋ gemcitabine（GC）本身仍是 PS 0–1 的標準</b>［I, A］' +
        '（ABC-02、BT22；中位存活 13.0 個月）。' +
        '<b>健保上 GC 是「拼出來」的：gemcitabine 9.4 列名膽道癌，cisplatin 屬無限制品項 —— ' +
        '兩支各自成立，不需事前審查。</b>');
    } else if (S.fit === 'renal') {
      title = '第一線　·　腎功能不佳或聽力受損<br>→ 把 cisplatin 換掉；台灣最實用的是 gemcitabine ＋ S-1';
      L.push(H('指引怎麼說', 'ESMO 2023 ［II, B］；泛亞洲版 4b'));
      L.push('<b>ESMO：「Oxaliplatin may be substituted for cisplatin when renal function is of ' +
        'concern」［II, B］。</b>');
      L.push('<b>泛亞洲版擴充為：「Oxaliplatin or <u>carboplatin</u> may be substituted for cisplatin ' +
        'when renal or <u>auditory</u> function is of concern, while <u>gemcitabine plus S-1</u> ' +
        'can be an option」。</b>');
      L.push('<b>也就是說：腎功能或聽力有問題時，有三條替代路 —— oxaliplatin、carboplatin，' +
        '或 gemcitabine ＋ S-1。</b>');
      L.push(H('❗ 在台灣，最實用的是 GS', '健保 9.46，113/2/1 起'));
      L.push('<b>gemcitabine ＋ S-1（GS，JCOG1113 的方案）健保有給付</b>，' +
        '條文寫「與 gemcitabine 合併使用作為<b>晚期或復發之膽道癌第一線治療</b>」，' +
        '<b>而且不需要事前審查。</b>');
      L.push('<b>這是健保內現成的替代一線，臨床上常被漏掉。</b>');
      L.push('❗<b>相對地，' + NR('oxaliplatin') + ' 用於膽道癌健保沒有條文</b>' +
        '（9.10 要求符合藥證，而 oxaliplatin 藥證無膽道癌）。');
      L.push(EV('另注意 9.10 第 2 項有一句「與 fluoropyrimidine 類藥物（如 capecitabine、5-FU、UFUR，' +
        '<b>但不包含 TS-1</b>）併用」—— <b>別把 oxaliplatin 那條和 S-1 這條混搭。</b>'));
      L.push(H('要不要加免疫？', 'ESMO 2025 期中更新；健保 9.69'));
      L.push('<b>TOPAZ-1 與 KEYNOTE-966 收的都是 cisplatin ＋ gemcitabine 的骨幹</b>，' +
        '<b>換掉 cisplatin 之後加免疫的證據，指引沒有回答。</b>');
      L.push('<b>健保 9.69 的膽道癌條文寫的是「durvalumab ＋ cisplatin ＋ gemcitabine」三藥</b> —— ' +
        '<b>換成 GS 或 GEMOX 之後再加 durvalumab，不在條文字面內。</b>' +
        '這一格請提多專科團隊討論。');
    } else {
      title = '第一線　·　ECOG 2<br>→ gemcitabine 單方';
      L.push(H('指引怎麼說', 'ESMO 2023 ［IV, B］'));
      L.push('<b>「Gemcitabine monotherapy may be used in patients with a PS of 2」［IV, B］。</b>');
      L.push(EV('<b>cisplatin ＋ gemcitabine 的證據是在 PS 0–1 的族群建立的</b>' +
        '（ABC-02、BT22，中位存活 13.0 個月）；PS 2 的病人 ESMO 只給單方，等級也只有 IV。'));
      L.push(H('免疫組合呢？', 'ESMO 2025；健保 9.69'));
      L.push('<b>TOPAZ-1 與 KEYNOTE-966 收的是 PS 0–1 的病人</b>，PS 2 沒有對應證據。');
      L.push('❗<b>而且健保 9.69 的門檻寫 ECOG ≤ 1 —— PS 2 的病人條文上就不符合。</b>');
      L.push(H('健保', '9.4'));
      L.push('<b>gemcitabine 單方走 9.4，膽道癌在給付範圍內</b>' +
        '（Gemmis 品項另寫「無法手術切除或晚期或復發之膽道癌（含肝內膽管）」），' +
        '<b>不需事前審查。</b>');
      L.push(H('也要一起處理的事', ''));
      L.push('<b>膽道阻塞的引流、營養與症狀控制</b>，' +
        '以及<b>依體能變化重新評估治療目標</b>。');
    }

    L.push(H('❗ 第一線就要送分子檢測', 'ESMO 2025 期中更新 ［I, A］'));
    L.push('<b>「Molecular profiling is recommended when first-line systemic treatment is initiated」' +
      ' —— 現在就送，不要等失敗才驗。</b>所有標靶藥都要「至少一線失敗後」才用得上。');

    L.push(H('療程長度', 'ESMO 2023'));
    L.push('<b>「There is currently insufficient evidence to recommend continuous treatment beyond ' +
      '6 months」；健保的化療上限是 8 個療程。</b>');

    fill('cc_r_adv', 'rec-nonop', title, L,
      'ESMO 2025 期中更新第一線條文 ［I, A］；ESMO 2023（替代藥、PS 2）；泛亞洲版 4b；' +
      '健保 9.4／9.46／9.69（查詢日 2026-08-17）。<b>台大無膽道癌指引，本段屬院外實證。</b>',
      more(rxReference('l1'), molReference(), nhiReference(), targetReference()));
    fu('cc_f_adv', 'adv');
  }

  /* ---------- D. 分子標記 ---------- */
  function renderMol() {
    show('cc_b_mol', true);
    show('cc_n_mol', true);
    if (!S.mol) return;

    var L = [], cls = 'rec-elective', title;
    if (S.mol === 'idh1') {
      title = 'IDH1 R132 突變<br>→ 指引建議 ivosidenib；台灣有藥證但健保不給付';
      L.push(H('指引', 'ESMO 2023 ［I, A；MCBS 2；ESCAT I-A］'));
      L.push('<b>「Ivosidenib is recommended for the treatment of patients with CCA and IDH1 ' +
        'mutations who have progressed after ≥ 1 prior line of systemic therapy」。</b>');
      L.push('<b>ClarIDHy：無惡化存活 HR 0.37（95% CI 0.25–0.54，P &lt; 0.0001）；' +
        '整體存活在校正 70% crossover 之後 HR 0.49（0.34–0.70，P &lt; 0.001）。</b>');
      L.push('<b>盛行率：iCCA 約 8–18%</b>（IDH2 突變 &lt; 5%，ESCAT III-A，沒有專屬適應症）。');
      L.push(H('❗ 台灣', '查詢日 2026-08-17'));
      L.push('<b>ivosidenib（拓舒沃 Tibsovo）2024/10/23 已取得台灣藥證，' +
        '適應症第 4 項明列 IDH1 變異、曾接受治療的局部晚期／轉移性膽管癌。</b>');
      L.push('❗<b>但健保藥品給付品項查無此成分（0 筆），連藥價都沒有 → 只能自費。</b>');
      L.push('<b>台大處方集有這個品項（Tibsovo 拓舒沃膜衣錠 250 mg）。</b>');
      L.push(EV('指引上標的「no EMA approval yet」已經過時 —— ' +
        '<b>ivosidenib 的歐盟上市許可是 2023-05-04。</b>引用舊版指引時要注意這一點。'));
    } else if (S.mol === 'fgfr2') {
      title = 'FGFR2 融合／重排<br>→ 台灣唯一有健保的膽道癌標靶，但限「肝內膽管癌」';
      L.push(H('指引', 'ESMO 2025 期中更新'));
      L.push('<b>futibatinib（MCBS 3）與 pemigatinib 都是建議選項</b>，' +
        '用於至少一線全身治療後進展者。');
      L.push('<b>盛行率：全體 &lt; 10%，iCCA 約 5–15%</b>（ESCAT I-B）。');
      L.push('❗<b>融合要在 RNA 層次驗</b>（ESMO：should preferably be interrogated at the RNA level）—— ' +
        '<b>用 DNA panel 可能漏掉，送檢時要交代清楚。</b>');
      L.push(H('❗ 台灣：這是唯一有健保的一條', '9.98，112/5/1 起'));
      L.push('<b>pemigatinib（Pemazyre 達伯坦）健保有給付</b>，健保碼 BC28063100／BC28064100／BC28065100。');
      L.push('❗<b>但健保條文寫「肝內膽管癌」，比藥證的「膽管癌」窄一格 —— ' +
        '肝外膽管癌與膽囊癌即使驗到 FGFR2 融合，也不在條文內。</b>');
      L.push('<b>條件：必須「接受過全身性藥物治療」之後才能用，不能一線；' +
        '每日限處方 1 粒；基因檢測須符合通則十二。</b>');
      L.push('❗<b>' + NR('futibatinib') + '（Lytgobi）在台灣連藥證都沒有</b>' +
        '（infigratinib、derazantinib、tinengotinib 亦同）—— <b>自費也買不到。</b>');
    } else if (S.mol === 'her2') {
      cls = 'rec-nonop';
      title = 'HER2 過度表現或擴增<br>→ 指引 2025 年新增兩個藥，但台灣兩個都拿不到健保';
      L.push(H('指引（2025 期中更新新增）', 'ESMO Open 2025 ［III, A］'));
      L.push('<b>「Trastuzumab deruxtecan should be considered in patients with HER2 overexpression ' +
        'and/or HER2 amplification who have progressed on or are intolerant to prior treatment」' +
        '［III, A；MCBS 3；ESCAT I-C］。</b>');
      L.push('<b>「Zanidatamab is recommended in patients with previously treated HER2-positive ' +
        'disease」［III, A；MCBS 3；ESCAT I-C］。</b>' +
        'HERIZON-BTC-01：<b>客觀反應率 41.3%、中位無惡化存活 5.5 個月。</b>');
      L.push('<b>盛行率：HER2 擴增 5–10%，但 dCCA／pCCA／膽囊癌可到 10–20%</b>' +
        '（HER2 突變 3–5%，ESCAT II-B）。<b>肝外與膽囊癌值得驗。</b>');
      L.push(H('❗ 台灣：兩個都沒有健保', '查詢日 2026-08-17'));
      L.push('<b>' + NR('trastuzumab deruxtecan') + '（Enhertu）的台灣藥證已含泛腫瘤 HER2 IHC3+ 實體腫瘤，' +
        '可涵蓋膽道癌；但健保 9.115 只給付轉移性乳癌 → 膽道癌自費。</b>');
      L.push('❗<b>' + NR('zanidatamab') + '（Ziihera）在台灣連藥證都沒有</b> —— ' +
        '自費也買不到，只能走專案進口或臨床試驗。');
      L.push('<b>' + NR('trastuzumab') + '（9.18）的健保只有早期與轉移性乳癌、轉移性胃癌，沒有膽道癌。</b>');
      L.push(EV('指引上標的「zanidatamab 尚未取得 EMA 核准」也已過時 —— ' +
        '<b>其歐盟上市許可是 2025-06-27。</b>但台灣仍無藥證，兩件事不要混淆。'));
    } else if (S.mol === 'braf') {
      cls = 'rec-nonop';
      title = 'BRAF V600E 突變<br>→ dabrafenib ＋ trametinib；等級兩份指引不同，台灣要自費';
      L.push(H('指引', 'ESMO 2023 ［I, A］／泛亞洲版 ［III, A］'));
      L.push('<b>「Dabrafenib–trametinib is recommended for the treatment of patients with ' +
        'BRAF V600E mutations who have progressed after ≥ 1 prior line of systemic therapy」。</b>');
      L.push('❗<b>ESMO 2023 給［I, A］，但泛亞洲版下調為［III, A］</b> —— ' +
        '<b>因為依據只有 ROAR 這個第 2 期籃式試驗</b>（ORR 51%、中位無惡化存活 9 個月、' +
        '中位整體存活 14 個月）。<b>引用時要說清楚是哪一份指引的等級。</b>');
      L.push('<b>盛行率：BRAF 突變 &lt; 5%，其中約一半是 V600E</b>（ESCAT I-B）。');
      L.push(H('❗ 台灣', '9.91'));
      L.push('<b>' + NR('dabrafenib') + '（Tafinlar）＋ ' + NR('trametinib') + '（Mekinist）的藥證第 4 項' +
        '已是泛腫瘤 BRAF V600E 適應症，可涵蓋膽道癌。</b>');
      L.push('❗<b>但健保 9.91 只給付黑色素瘤（轉移／術後輔助）與 BRAF V600E 轉移性非小細胞肺癌二線 —— ' +
        '膽道癌不給付，要自費。</b>');
    } else if (S.mol === 'ntrk') {
      title = 'NTRK 融合<br>→ 台灣只有 larotrectinib 有健保，而且條文限「肝內膽管癌」';
      L.push(H('指引', 'ESMO 2023／2025 期中更新'));
      L.push('<b>entrectinib、larotrectinib、repotrectinib 都是建議選項</b>' +
        '（ESCAT I-C），用於先前治療後進展或不耐受者。');
      L.push('<b>盛行率很低：&lt; 0.1–1%。</b>');
      L.push('❗<b>融合要在 RNA 層次驗</b> —— 用 DNA panel 可能漏掉。');
      L.push(H('❗ 台灣：兩支藥待遇完全相反', '9.95 vs 9.93'));
      L.push('<b>larotrectinib（9.95 第 3 項第 7 款）有給付，條文列「肝內膽管癌」。</b>');
      L.push('❗<b>該條文自我矛盾</b>：標題寫「肝內膽管癌」，同一項的內文卻寫' +
        '「無法手術切除或晚期或復發之膽道癌（含肝內膽管）」。<b>送審以「肝內膽管癌」較保險。</b>');
      L.push('<b>其門檻含「沒有合適的替代治療選項（包含免疫檢查點抑制劑）」</b> —— ' +
        '❗<b>如果病人還能用 durvalumab，理論上就不算「無替代選項」。</b>');
      L.push('❗<b>' + NR('entrectinib') + '（9.93）雖然藥證有 NTRK 泛腫瘤適應症，' +
        '健保卻只給 ROS1 陽性非小細胞肺癌 → 膽道癌自費。</b>');
      L.push('<b>同一個 biomarker、同一個病人，選錯藥就從給付變自費。</b>');
    } else if (S.mol === 'msi') {
      cls = 'rec-nonop';
      title = 'MSI-H／dMMR<br>→ 指引列 pembrolizumab 為泛腫瘤選項；台灣膽道癌不給付';
      L.push(H('指引', 'ESMO 2023'));
      L.push('<b>MSI-H／dMMR 的實體腫瘤，pembrolizumab 是泛腫瘤的選項。</b>');
      L.push(EV('膽道癌的 MSI-H 比例很低。ESMO 對 MSI-H 用 pembrolizumab 的前提' +
        '（是否需先經過標準治療）與其他指引敘述不完全一致，' +
        '<b>引用時要確認是哪一份、哪一版。</b>'));
      L.push(H('❗ 台灣', '9.69'));
      L.push('<b>' + NR('pembrolizumab') + ' 用於膽道癌健保不給付</b> —— ' +
        'PD-L1 對照表「膽道癌（併用化療）P121」那一列明寫「本藥品尚未給付於此適應症」。');
      L.push('<b>膽道癌第一線的 ICI 健保只給 durvalumab。</b>');
      L.push('<b>' + NR('pembrolizumab') + ' 有台灣藥證，要用是自費。</b>');
    } else {
      cls = 'rec-idle';
      title = '沒有驗到可用的標記，或還沒驗<br>→ 先確認驗了哪些、怎麼驗的';
      L.push(H('先確認套組夠不夠', 'ESMO 2025 期中更新 ［I, A］'));
      L.push('<b>套組要包含 IDH1、FGFR2、BRAF、HER2、NTRK、RET、BRCA1/2、PALB2</b>，' +
        '也可以納入 c-MET。<b>少驗一個就少一條路。</b>');
      L.push('❗<b>最常見的漏洞是融合</b>：<b>FGFR2 與 NTRK 的融合要在 RNA 層次驗</b>，' +
        '<b>只做 DNA panel 可能驗不出來。</b>報告若只有 DNA，值得補做 RNA。');
      L.push(H('時機', 'ESMO 2025 期中更新'));
      L.push('<b>應該在第一線開始的時候就送驗</b> —— ' +
        '所有標靶藥都要「至少一線失敗後」才用得上，報告等不到就接不上。');
      L.push(H('台灣端的實驗室資格', '健保通則十二'));
      L.push('<b>pemigatinib（9.98）與 larotrectinib（9.95）的基因檢測都要符合通則十二</b>' +
        '（支付標準內的項目、衛福部許可的伴隨式診斷 IVD，或核定的 LDT 認證實驗室）—— ' +
        '<b>不符資格的報告會讓申請被退件。</b>');
      L.push(H('真的都沒有的話', ''));
      L.push('<b>依線別走化療（第一線 GC ± durvalumab、第二線 FOLFOX），並以臨床試驗為優先。</b>');
    }

    fill('cc_r_mol', cls, title, L,
      'ESMO 膽道癌 CPG（Ann Oncol 2023;34:127-140）與 2025 期中更新（ESMO Open 2025;10:104003）；' +
      '泛亞洲版（ESMO Open 2024;9:103647）；健保 9.98／9.95／9.91／9.93／9.115／9.69、通則十二' +
      '（查詢日 2026-08-17）。<b>台大無膽道癌指引，本段屬院外實證。</b>',
      more(targetReference(), molReference(), nhiReference()));
    if (S.mol !== 'none') fu('cc_f_mol', 'adv');
  }

  /* ==========================================================
     6. 最下方：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('這個癌別的答案很明確：要驗，而且要早驗', 'ESMO 2025 期中更新 ［I, A］'));
    L.push('<b>「Molecular profiling is recommended when first-line systemic treatment is initiated ' +
      'in patients with locally advanced, advanced or metastatic disease」</b> —— ' +
      '<b>在第一線開始的時候就送，不是等失敗才驗。</b>');
    L.push('<b>理由很實際：所有標靶藥的條文都是「至少一線失敗後」才用得上。' +
      '報告要三、四週，等到二線才送就接不上。</b>');
    L.push(H('要驗哪些', 'ESMO 2025 期中更新'));
    L.push('<b>IDH1、FGFR2、BRAF、HER2、NTRK、RET、BRCA1/2、PALB2</b>；也可以納入 <b>c-MET</b>。');
    L.push('<b>方法：優先用 focused NGS 一次驗多個基因，不要單基因逐一驗。</b>');
    L.push('❗<b>FGFR2 與 NTRK 的融合「should preferably be interrogated at the RNA level」</b> —— ' +
      '<b>這是最容易漏的一點。只做 DNA panel 可能驗不出融合。</b>');
    L.push(H('哪個部位驗到什麼的機會比較高', 'ESMO 2023 ESCAT 表'));
    L.push('<b>iCCA：IDH1 約 8–18%、FGFR2 融合約 5–15%</b> —— 這兩個是 iCCA 的主場。');
    L.push('<b>dCCA／pCCA／膽囊癌：HER2 擴增可到 10–20%</b>（全體 5–10%）。');
    L.push('<b>BRAF 突變 &lt; 5%（約半數為 V600E）；NTRK 融合 &lt; 0.1–1%。</b>');
    L.push(H('❗ 在台灣，驗到之後拿不拿得到藥是另一回事', '查詢日 2026-08-17'));
    L.push('<b>健保只有兩條路，而且都限「肝內膽管癌」</b>：' +
      '<b>pemigatinib（9.98，FGFR2）與 larotrectinib（9.95，NTRK）</b>。');
    L.push('<b>有藥證但健保不給付</b>：' + NR('ivosidenib') + '（IDH1）、' +
      NR('trastuzumab deruxtecan') + '（HER2）、' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') +
      '（BRAF）、' + NR('entrectinib') + '（NTRK）、' + NR('pembrolizumab') + '（MSI-H 與一線）。');
    L.push('❗<b>連藥證都沒有</b>：' + NR('futibatinib') + '（FGFR2）、' + NR('zanidatamab') + '（HER2）—— ' +
      '<b>自費也買不到，只能走專案進口或臨床試驗。這和「自費買得到」是完全不同的兩件事。</b>');
    L.push('<b>檢測報告要符合健保通則十二的實驗室資格，否則申請會被退件。</b>');
    L.push(H('一個必須先問清楚的灰區', '9.69 3.(4)'));
    L.push('<b>健保條文寫 ICI「無效後或給付時程期滿後則不再給付該適應症相關之標靶藥物」，' +
      '但 pemigatinib 與 larotrectinib 本身又要求「接受過全身性藥物治療」才能用</b> —— ' +
      '<b>兩條規定的關係條文並未釐清。</b>');
    L.push('<b>用過 durvalumab 之後還能不能接 pemigatinib，實務上要先和審查單位確認，' +
      '不要假設一定接得上。</b>');
    L.push(H('遺傳性的部分', ''));
    L.push('<b>套組裡的 BRCA1/2 與 PALB2 同時有兩層意義</b>：腫瘤層面可能指向含鉑治療的反應，' +
      '<b>胚系層面則牽涉家屬</b>。<b>驗到致病性變異時要照會遺傳諮詢。</b>');
    L.push(EV('❗<b>ESMO 膽道癌指引沒有給胚系檢測的獨立建議條文</b>，' +
      '只把 BRCA1/2 與 PALB2 列在腫瘤套組裡。這一段屬臨床常規推論，不是指引明文。'));

    return '<div class="bc-gene-h">要不要驗基因？膽道癌的答案是「要，而且要在第一線就送」' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     7. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'cc-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('cc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }

  function renderDrugCards() {
    var box = el('cc_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('ccaPath');
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
    CC_DRUGS.forEach(function (d) {
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
      '禁忌、健保給付規定、剝半磨粉）。<b>徽章標明該藥用於膽道癌時在台灣的藥證與健保狀態。</b></div>' +
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
    if (S.scope === 'dx') renderDx();
    else if (S.scope === 'postop') renderPostop();
    else if (S.scope === 'adv') renderAdv();
    else if (S.scope === 'mol') renderMol();
    renderDrugCards();
  }

  /* ==========================================================
     9. 互動
     ========================================================== */
  var SEL_GROUPS = ['cc_n1', 'cc_n_site', 'cc_n_inc', 'cc_n_rsec', 'cc_n_ptn',
    'cc_n_line', 'cc_n_fit', 'cc_n_mol'];

  var DOWNSTREAM = {
    scope: ['site', 'jaun', 'rsec', 'inc', 'ptn', 'line', 'fit', 'mol'],
    site: ['inc', 'rsec'],
    inc: ['rsec'],
    line: ['fit']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function ccaPick(key, val, btn) {
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
      ['cc_n1', 'scope'], ['cc_n_site', 'site'], ['cc_n_inc', 'inc'], ['cc_n_rsec', 'rsec'],
      ['cc_n_ptn', 'ptn'], ['cc_n_line', 'line'], ['cc_n_fit', 'fit'], ['cc_n_mol', 'mol']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /ccaPick\('([a-z]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function ccaReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }

  function initCcaPathway() { ccaReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。 */
  global.ccaPathwayHTML = ccaPathwayHTML;
  global.initCcaPathway = initCcaPathway;
  global.ccaPick = ccaPick;
  global.ccaReset = ccaReset;
})(window);
