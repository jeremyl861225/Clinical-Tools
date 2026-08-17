/* ============================================================
   闌尾腫瘤治療互動決策流程 Appendiceal Tumor Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全新製作。此癌別原本沒有流程模組（cancers.js 只有分期與淋巴結）。

   ⚠ 資料來源的界線 —— 這一點務必照實標示：
     **台大癌症醫療委員會沒有闌尾癌診療指引。**大腸直腸癌診療指引（版次 21，25 頁）
     全文無闌尾章節。院內唯一有整章內容的是
     《CRC 大腸直腸癌診療與藥物治療完整臨床實務手冊》ver.1（2026.01，傅彥崴 藥師，
     主要依 NCCN Colon Cancer v5.2025）**第十章「特定類別：闌尾腫瘤」（p64–66）**。
     ❗該 PDF **完全沒有台大標記**（無 NTUH／癌症防治中心／版次／核准日期），
     metadata 為 Word 列印、無作者，首頁寫「本資訊僅供參考…」——
     **不可寫成台大診療指引**，本頁一律稱「藥師實務手冊 ver.1 第十章」。
     → 因此本流程的臨床內容**全部屬院外實證**。

   主要來源（每一份都標明版本，並註明已被取代者）：
   ① **現行最新・美國全國共識**：Consensus Guideline for the Management of Patients with
      Appendiceal Tumors, **Part 1（無腹膜侵犯）** Ann Surg Oncol 2025;33(6):5142-5175
      （PMID 40560498）與 **Part 2（有腹膜侵犯）** Ann Surg Oncol 2025;33(6):5176-5203
      （PMID 40560501）。通訊作者 Turaga KK。**已取代 2018／2020 Chicago Consensus**
      （PMID 32285275／32282073 為同一份共識的雙重刊登，勿當兩篇引用）。
      方法：modified Delphi 兩輪，第一輪 138 人、第二輪 133 人（96%），
      **所有 pathway blocks 皆達 > 90% 共識**。本頁逐 block 標出兩輪同意度。
   ② **ASCRS 2025**：Gaertner WB et al. Dis Colon Rectum 2025;68(7):815-834（PMID 40262165），
      17 條 GRADE 建議。**已取代 2019 版**（PMID 31725580；兩版標題幾乎相同，
      僅逗號差異，引用必須用年份／卷期／PMID 區分）。
   ③ **PSOGI／EURACAN 2021（歐洲）**：Govaerts K et al. Eur J Surg Oncol，
      70 條共識建議，各附 LoE／SoR／專家投票百分比；Fig 2 為完整治療演算法
      （**已 render PNG 逐格核對**：HAMN 與 GCC 兩欄是淡化顯示的，代表
      「should probably be approached like mucinous adenocarcinoma」；
      虛線箭頭代表「未投票、但可從其他投票邏輯推出」的建議）。
   ④ **PSOGI 2016 分類共識**：Carr NJ et al. Am J Surg Pathol 2016;40(1):14-26（PMID 26492181）。
   ⑤ **ENETS 2023 闌尾 NET**：Kaltsas G et al. J Neuroendocrinol 2023;35(10):e13332
      （PMID 37682701，取代 2016 版）。⚠ PubMed 摘要不含任何大小門檻數字，
      **本頁的 NET 大小門檻一律標 ASCRS 2025 的條文，不假借 ENETS 之名**。
   ⑥ AJCC 第 8 版闌尾癌分期（M1a／M1b／M1c）。
   健保給付條文查詢日：**2026-08-17**（藥品給付規定 115.4.23 版；
   醫療服務給付項目及支付標準採健保署開放資料，資料更新日 2026-08-12，6,010 筆現行項目）。

   ❗這個癌別在台灣最重要的一件事：**HIPEC 與非婦科的 CRS／腹膜剝除完全沒有健保給付項目**，
     6,010 個現行診療項目逐筆檢索查無，只能自費。整份《藥品給付規定》逐字檢索
     「闌尾」只有 2 筆命中，全部在 larotrectinib 9.95.3(12)。

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
    'scope',   // path | perit | net | sys
    'histo',   // lamn | hamn | adeno | gca
    'mucin',   // clean | perf | marg | localacell | resid | wide
    'extent',  // conf | perit | m1c
    'pstage',  // s1 | s2 | s2h | s3
    'pgrade',  // acell | lg | hg | src | nonmuc
    'cc',      // complete | incomplete
    'nsize',   // lt1 | mid | gt2
    'nfeat',   // none | yes
    'sysq'     // timing | mol | nhi
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/ 逐碼實跑核對）
     ⚠ 徽章寫的是「這個藥用於闌尾癌時的健保狀態」，不是該藥整體的給付狀態。
     ⚠ cetuximab／panitumumab／sunitinib 在本頁只出現在「用不到／沒有入口」的
       敘述裡，一律用 NR() 包住，**不列卡**。
     ========================================================== */
  var AP_DRUGS = [
    /* ── fluoropyrimidine 骨架 ──────────────────── */
    { key: '5-FU', re: '5-FU|fluorouracil',
      cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']],
      flag: '許可證寫「消化器官癌」，是唯一文義可能涵蓋闌尾的' },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']],
      flag: '條文只寫結腸直腸癌，闌尾未列名' },

    /* ── 細胞毒性合併用藥 ────────────────────────── */
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']],
      flag: '條文只寫結腸直腸癌，闌尾未列名' },
    { key: 'irinotecan', re: '(?<!liposomal )irinotecan',
      cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']],
      flag: '條文限轉移性大腸直腸癌第一線' },

    /* ── 標靶與免疫 ─────────────────────────────── */
    { key: 'bevacizumab', cards: [['17', 'AV 1CE89', 'Avastin 癌思停注射劑 100 mg/4 mL']],
      flag: '條文只寫大腸或直腸癌，闌尾未列名' },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib sulfate']],
      flag: '❗健保唯一寫出「闌尾癌」的條文（9.95）' },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']],
      flag: 'MSI-H 條文只寫大腸直腸癌，闌尾無入口' },

    /* ── HIPEC 灌注用藥 ─────────────────────────── */
    { key: 'mitomycin', cards: [['17', 'MIN1CD06', 'Mitonco 密多邁杏凍晶注射劑 10 mg', 'mitomycin']],
      flag: '❗台灣藥證的「灌注使用」只寫膀胱，腹腔灌注屬藥證外' },

    /* ── 闌尾 NET 用藥 ──────────────────────────── */
    { key: 'octreotide',
      cards: [['12', 'SAN1LD27', 'Sandostatin LAR 善得定長效緩釋注射劑 20 mg', 'octreotide acetate'],
              ['12', 'SAN1LD15', 'Sandostatin 善得定注射液 0.1 mg/mL', 'octreotide acetate']],
      flag: '長效型 5.4.4.3「晚期間腸 NET」文義可涵蓋闌尾' },
    { key: 'lanreotide',
      cards: [['12', 'SO 1LD27', 'Somatuline Autogel 舒得寧長效型注射凝膠劑', 'lanreotide acetate']],
      flag: '5.4.6.3「胃、腸、胰 GEP-NET」文義可涵蓋闌尾' },
    { key: 'everolimus', cards: [['17', 'AFI4CEC1', 'Afinitor 癌伏妥錠 5 mg', 'everolimus']],
      flag: '9.36.1.3「胃腸道來源非功能性 NET」文義可涵蓋' }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="apPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="ap-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="ap-node" id="' + id + '">' +
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

  var HISTO_LABEL = {
    lamn: 'LAMN 低度闌尾黏液性腫瘤',
    hamn: 'HAMN 高度闌尾黏液性腫瘤',
    adeno: '闌尾腺癌（黏液性或非黏液性）',
    gca: '杯狀細胞腺癌 goblet cell adenocarcinoma'
  };
  var PGRADE_LABEL = {
    acell: '腹腔內只有無細胞黏液（M1a）',
    lg: '低分級 PMP（grade 1）',
    hg: '高分級 PMP（grade 2）',
    src: '高分級 PMP 併 signet ring cells（grade 3）',
    nonmuc: '非黏液性腹膜病灶'
  };

  /* ==========================================================
     2. 共用參考區塊（同一件事只寫一次，其他地方指過來）
     ========================================================== */

  /* 2a. PSOGI 2016 分類 ＋ AJCC 8th 的 M 分法 */
  function psogiClassReference() {
    return fold('<b>病理分類怎麼讀</b>（PSOGI 2016 共識 ＋ AJCC 8th）',
      '<table>' +
      '<tr><td colspan="2"><b>PSOGI 2016 共識（PMID 26492181，modified Delphi）把名稱統一掉了，' +
      'PSOGI／EURACAN 2021 的第 1 條建議就是「採用這套命名」</b>（LoE High、強正向、共識 98.2%）。</td></tr>' +
      '<tr><td><b>LAMN</b></td><td>低度闌尾黏液性腫瘤。<b>「cystadenoma」一詞不再建議使用。</b>' +
      '推進式生長（pushing pattern）、<b>不具浸潤性侵襲</b>。</td></tr>' +
      '<tr><td><b>HAMN</b></td><td><b>PSOGI 2016 新增的類別</b>：無浸潤性侵襲，但細胞學上高度異型。' +
      '❗<b>資料極少</b>，PSOGI 明講「we would rather suggest that HAMN should be graded, treated, ' +
      'and followed as an appendiceal (mucinous) adenocarcinoma」。</td></tr>' +
      '<tr><td><b>黏液性腺癌</b></td><td><b>「mucinous adenocarcinoma」一詞只保留給有 ' +
      'infiltrative invasion 者</b> —— 這是 PSOGI 2016 最關鍵的一句。' +
      '再分 G1／G2／G3，另列「含 signet ring cell 成分」。</td></tr>' +
      '<tr><td><b>腹膜病灶</b></td><td>分三類：<b>low grade</b>、<b>high grade</b>、' +
      '<b>high grade with signet ring cells</b>；<b>acellular mucin 要單獨分類</b>。' +
      'low-grade／high-grade mucinous carcinoma peritonei 分別等同舊稱 <b>DPAM／PMCA</b>。</td></tr>' +
      '<tr><td><b>杯狀細胞腺癌</b></td><td>兼具上皮與神經內分泌特徵，' +
      '<b>但臨床行為更接近腺癌，應按腺癌管理</b>（藥師實務手冊 ver.1 第十章 10.3 亦同此說）。</td></tr>' +
      '<tr><td colspan="2"><b>AJCC 第 8 版的 M 分法（本頁的腹膜路徑就是照這個分）</b></td></tr>' +
      '<tr><td><b>M1a</b></td><td><b>腹腔內只有無細胞黏液</b>（acellular mucin）→ Stage IVA</td></tr>' +
      '<tr><td><b>M1b</b></td><td><b>腹腔內轉移，黏液沉積含腫瘤細胞</b> → G1 為 IVA、G2／G3／GX 為 IVB</td></tr>' +
      '<tr><td><b>M1c</b></td><td><b>腹膜以外的遠處轉移</b>（肝、肺）→ Stage IVC</td></tr>' +
      '<tr><td>❗</td><td><b>M1a 被列為 Stage IVA 這件事有反面實證</b>：單一機構 164 例，' +
      'M1a 64 例 vs M1b G1 100 例，中位追蹤 7.6 年 —— <b>M1a 無人復發、僅 1 人死亡；' +
      'M1b 有 66% 復發（5 年 RFS 40.5%，HR 8.0）、31% 死亡</b>。' +
      '作者結論是把腹腔內 acellular mucin 當成轉移等價物<b>並不恰當，有 over-staging 之虞</b>' +
      '（Erstad DJ et al. Langenbecks Arch Surg 2023;408(1):110，PMID 36853519）。</td></tr>' +
      '<tr><td>❗</td><td><b>LAMN 侷限於固有肌層內時，AJCC 8th 視為原位（Tis LAMN）</b>。' +
      '依據是 Umetsu SE et al. Hum Pathol 2017;69:81-89（PMID 28970138）：' +
      '<b>局限於 muscularis propria 的 LAMN 合計 64 例 0 復發；一旦上皮越過 muscularis propria，' +
      '64%（57/89）在診斷時或追蹤中出現腹膜疾病。</b></td></tr>' +
      '</table>');
  }

  /* 2b. 初始評估（共通） */
  function workupReference() {
    return fold('<b>初始評估要做哪些</b>（2025 全國共識 Part 1 Block 1 ＋ ASCRS 2025）',
      '<table>' +
      '<tr><td><b>大腸鏡</b></td><td><b>確診或懷疑闌尾腫瘤的病人都要做大腸鏡</b>' +
      '（ASCRS 2025 第 1 條，強建議／低品質證據）。<b>同時性大腸病灶佔 13–42%</b>；' +
      '荷蘭 1,482 例闌尾上皮性腫瘤中 193 例（13%）有大腸腺瘤或腺癌，' +
      '<b>其中 82% 的大腸腺癌長在右側</b>。<b>要在正式切除之前先做。</b></td></tr>' +
      '<tr><td><b>腫瘤標記</b></td><td><b>CEA、CA 19-9、CA-125</b>（ASCRS 2025 第 9 條，條件建議；' +
      '2025 共識另加 <b>CRP</b>）。<br>' +
      '藥師實務手冊 ver.1 第十章：<b>術前 CA 19-9 升高預示 PFS 較差、CEA 升高預示 OS 較差</b>。<br>' +
      '❗<b>PSOGI 2021 把這件事講到更狠</b>：752 例闌尾 PMP，<b>三個標記全部正常者能做到完整減積的' +
      '機率是 97%，三個全部升高者掉到 50%</b>；<b>>70% 的闌尾 PMP 病人至少一個標記升高，' +
      '其中約 60% 病理是低分級的</b>。因此 PSOGI 把 CEA（R2）、CA 19-9（R3）、' +
      'CA-125 列為術前必做。</td></tr>' +
      '<tr><td><b>影像</b></td><td>胸腹骨盆橫斷面影像（CT 或 MRI 皆可，ASCRS 2025 第 10 條，強建議）。<br>' +
      '<b>2025 共識列的影像徵象</b>：闌尾遠端局部擴張、<b>大小超過 2 cm</b>、' +
      '曲線狀鈣化、管壁不規則、<b>闌尾周圍脂肪無 stranding</b>；' +
      '<b>鈣化的特異度高但敏感度低</b>。<br>' +
      '❗<b>門檻兩份不一樣</b>：藥師實務手冊 ver.1 第十章寫的是' +
      '<b>「闌尾直徑 > 15 mm 且伴隨壁厚不均」</b>，2025 共識寫的是 <b>2 cm</b>。' +
      '這一格請以較寬鬆的 15 mm 提高警覺，但影像報告的量測要寫清楚。</td></tr>' +
      '<tr><td><b>病理複閱</b></td><td><b>三種情況一定要專家病理複閱</b>：' +
      '從外院轉來、<b>原發與腹膜病灶的分級明顯不一致</b>、<b>報告出現 signet ring cells</b>。' +
      '全部病人都要上多專科團隊討論。</td></tr>' +
      '<tr><td><b>支持性需求</b></td><td>2025 共識明列要一併評估：病友團體、社工、' +
      '財務支持、心理社會支持，以及<b>生育諮詢</b>（後者對要做 CRS 的年輕女性特別重要）。</td></tr>' +
      '<tr><td>❗<b>闌尾炎保守治療後<br>要不要補做闌尾切除</b></td>' +
      '<td><b>ASCRS 2025 第 3 條（條件建議／低品質）：複雜性闌尾炎保守治療後，' +
      '成人 > 40 歲、或影像看起來像惡性者，通常建議做 interval appendectomy。</b><br>' +
      '<b>數字：整體腫瘤率 9%；30 歲以上 11%、50 歲以上 16%、80 歲以上 43%；' +
      '30 歲以下 0 例。</b>有闌尾腫瘤者明顯較年長（56.6 歲 vs 45.1 歲，p &lt; 0.01）。<br>' +
      '8 篇系統性回顧的合併盛行率 <b>11%（95% CI 7–15）</b>，其中黏液性腫瘤 43%、' +
      '腺癌 29%、NET 21%、杯狀細胞腺癌 13%。<br>' +
      '藥師實務手冊 ver.1 第十章的說法一致：<b>「抗生素治療後影像顯示病灶未消退，' +
      '應高度懷疑惡性腫瘤」</b>，並列高風險族群為 <b>年齡 > 50 歲、IBD 或大腸癌家族史、' +
      '不明原因貧血、非手術治療無效</b>。</td></tr>' +
      '<tr><td>不建議常規做</td><td><b>腹膜細胞學不建議常規做</b>（ASCRS 2025 第 11 條）。<br>' +
      '<b>卵巢黏液性腫瘤而闌尾外觀正常時，不支持常規順便切闌尾</b>（ASCRS 2025 第 2 條的討論）；' +
      '但<b>手術中遇到外觀明顯異常的闌尾，應該切除</b>（第 2 條本文，強建議）。</td></tr>' +
      '<tr><td>❗術中冷凍切片</td><td><b>「the intraoperative frozen section of appendiceal neoplasms ' +
      'often provides inaccurate results, especially with mucinous neoplasms」</b> —— ' +
      '<b>要等完整標本的正式報告，才能判斷要不要做右半結腸切除。</b>' +
      '有無細胞的黏液（cellular vs acellular）<b>也只能在術後才確定</b>。</td></tr>' +
      '</table>');
  }

  /* 2c. PCI、CC score 與 CRS 的禁忌 */
  function pciReference() {
    return fold('<b>PCI、完全減積（CC）與 CRS 的禁忌</b>（ASCRS 2025 第 14 條 ＋ PSOGI 2021）',
      '<table>' +
      '<tr><td><b>PCI</b><br>腹膜癌指數</td><td><b>把腹腔分成 13 區，每區依病灶大小給 0–3 分，' +
      '總分 0–39。</b>另有 Peritoneal Surface Disease Severity Score 可用。' +
      '<b>術中量化腫瘤負荷用的就是這個。</b></td></tr>' +
      '<tr><td><b>CC score</b></td><td><b>完全減積（CC-0／CC-1）在所有大型世代研究中都是' +
      '獨立的預後預測因子</b>，不論開腹或腹腔鏡（ASCRS 2025）。' +
      '<b>這是整個腹膜路徑最重要的單一變數。</b></td></tr>' +
      '<tr><td><b>減積範圍</b></td><td>典型 CRS 含<b>所有受累腹膜表面的剝除</b>' +
      '（可能包含橫膈、骨盆、腸表面）<b>加完整大網膜切除</b>。' +
      '❗<b>大網膜外觀正常也建議切除</b> —— 顯微病灶風險高而併發症低。</td></tr>' +
      '<tr><td><b>復發與再手術</b></td><td><b>即使做到大體上完全減積，腹膜復發率仍有 7–37%。</b>' +
      '再次減積可個案考慮，取決於組織型、無病間隔、復發負荷與體能狀態。</td></tr>' +
      '<tr><td colspan="2"><b>PSOGI 2021 Table 6（R45 專家投票）—— CRS／HIPEC 的禁忌</b>' +
      '（括號內為投票百分比）</td></tr>' +
      '<tr><td><b>絕對禁忌</b></td><td>' +
      '<b>小腸漿膜廣泛受累（58.9%，LoE High）</b>、<b>腸繫膜受累造成收縮 retraction（64.3%，LoE High）</b>' +
      '<br>—— 只有這兩項在投票中被過半數列為絕對禁忌。</td></tr>' +
      '<tr><td><b>相對禁忌</b></td><td><b>年齡 > 75 歲（85.7%）</b>、' +
      '<b>侵襲性組織型（高分級 PMP 併 signet ring、含 signet ring 的黏液性腺癌、杯狀細胞癌）' +
      '且 PCI > 20（87.5%）</b>、<b>肝門受累（87.5%）</b>、' +
      '<b>侵犯胰臟前緣（lesser sac，82.1%）</b>、<b>輸尿管阻塞（64.3%）</b>、' +
      '<b>需要全胃切除（80.4%）</b>。</td></tr>' +
      '<tr><td>不算禁忌</td><td><b>三個腫瘤標記全部升高：78.6% 認為不算禁忌</b>' +
      '（雖然它是強力的預後因子）。<b>需要部分胃切除：75% 認為不算禁忌。</b></td></tr>' +
      '<tr><td><b>剩多少小腸</b></td><td>R46：<b>78.6% 的專家要求剩餘小腸 > 1.5 m</b>' +
      '（> 1 m 3.6%、> 2 m 14.3%）；<b>69.6% 認為要不要一併做大腸切除會影響這個判斷</b>。</td></tr>' +
      '<tr><td><b>兩階段手術</b></td><td>R57：高風險、可手術性處於邊緣的病人，' +
      '<b>可以考慮「兩階段」或「延遲」的 CRS／HIPEC，而不是一次做完</b>（弱正向）。</td></tr>' +
      '<tr><td>橫膈剝除</td><td>R53：需要做橫膈剝除（stripping）時，' +
      '<b>可考慮預防性放置胸管以減少呼吸道併發症</b>（弱正向）。</td></tr>' +
      '</table>');
  }

  /* 2d. 卵巢處理 */
  function ovaryReference() {
    return fold('<b>女性病人的卵巢要不要一起切</b>（ASCRS 2025 第 14 條 ＋ PSOGI 2021 R48–R51）',
      '<table>' +
      '<tr><td colspan="2"><b>這一格的數字很有說服力，值得術前先跟病人講清楚。</b></td></tr>' +
      '<tr><td><b>盛行率</b></td><td>258 例接受 CRS／HIPEC 的女性（大腸直腸與闌尾來源）：' +
      '<b>141 例（55%）有卵巢受累</b>。<br>' +
      '<b>單側巨觀轉移的 40 例中，對側巨觀正常卵巢有 18 例（45%）顯微受累。</b><br>' +
      '<b>雙側卵巢巨觀都正常的 141 例中，24 例（17%）仍有顯微受累。</b><br>' +
      'PSOGI 引 Basingstoke 的數字：闌尾腫瘤組卵巢轉移率 <b>58.1%</b>，' +
      '<b>雙側外觀正常時 18.2% 為隱匿性受累</b>。</td></tr>' +
      '<tr><td><b>為什麼重要</b></td><td><b>轉移性卵巢腫瘤長得快，而且對全身化療抗性強。</b>' +
      'PSOGI 另引 Institut Gustave Roussy：<b>曾治療卵巢轉移的女性有 30% 出現腹膜後淋巴結復發</b>' +
      '（無卵巢受累者 2%）。</td></tr>' +
      '<tr><td><b>停經後</b></td><td>ASCRS：<b>應強烈考慮雙側 salpingo-oophorectomy</b>，' +
      '不論卵巢外觀，並術前充分說明。<br>PSOGI R49 同方向。</td></tr>' +
      '<tr><td><b>停經前</b></td><td>PSOGI R48：<b>應提供生育專科諮詢並考慮卵子冷凍保存</b>。<br>' +
      'R51：<b>生育年齡、低分級且病灶有限、無其他不良預後因子、有生育意願者，' +
      '可保留子宮與卵巢</b>。<br>→ <b>這一格不是一律切，要看分級與生育意願。</b></td></tr>' +
      '<tr><td>❗Krukenberg</td><td>PSOGI R42：<b>婦科手術中發現是闌尾 PMP 破裂造成的 Krukenberg 瘤，' +
      '應做卵巢切除加闌尾切除，而不要做子宮切除</b>（強建議）。<br>' +
      'R41：<b>沒有闌尾切除病史、骨盆腫塊疑似卵巢癌的女性，術前一定要驗 CEA</b>。' +
      '<b>CA-125／CEA 比值 > 25 有助於區分卵巢原發與胃腸道原發</b>（有人主張把切點提高到 100，' +
      '特異度約 85%）。</td></tr>' +
      '<tr><td>❗術中發現</td><td>R43：<b>因非腫瘤原因（膽囊切除、疝氣修補）手術時意外發現 PMP，' +
      '應中止原定手術</b>並轉介。<br>' +
      'PSOGI 另引 Gonzalez-Moreno／Sugarbaker：<b>這個階段在沒有 HIPEC 的情況下最好避免做' +
      '右半結腸切除</b> —— 會增加腫瘤植入腹膜後空間與吻合處腫瘤細胞捕捉的風險，' +
      '<b>破壞組織層面可能妨礙日後的根治性治療並惡化存活</b>。<br>' +
      '<b>疝氣袋內發現黏液，要送病理並安排腹部影像。</b></td></tr>' +
      '</table>');
  }

  /* 2e. 腹腔化療（HIPEC／EPIC／PIPAC）與 PRODIGE-7 的推論界線 */
  function hipecReference() {
    return fold('<b>腹腔化療的證據到哪裡</b>（ASCRS 2025 第 15 條 ＋ 2025 全國共識）',
      '<table>' +
      '<tr><td colspan="2"><b>ASCRS 2025 第 15 條全文的立場（強建議／中等品質證據）：' +
      '「完整減積之後加腹腔化療，比只做減積可能降低腹膜復發，但對整體存活的影響尚未確立，' +
      '且伴隨較高的費用與毒性。」</b>—— 建議強度是強的，但 OS 效益寫的是「未確立」。</td></tr>' +
      '<tr><td>❗<b>PRODIGE-7 不能直接<br>套到闌尾癌</b></td>' +
      '<td><b>ASCRS 2025 在同一條裡明文寫出兩件事：</b><br>' +
      '① <b>PRODIGE-7 收的是「metastatic colorectal (not appendiceal) cancer」</b> —— ' +
      '括號是指引原文自己加的。<br>' +
      '② <b>「No such multicenter randomized clinical trial for appendiceal adenocarcinoma ' +
      'currently exists.」</b><br>' +
      '→ <b>把 PRODIGE-7 的陰性結果當成「闌尾 PMP 不必做 HIPEC」的依據，是超出該試驗範圍的推論。</b><br>' +
      'PRODIGE-7 本身（Quénet F et al. Lancet Oncol 2021;22(2):256-266，PMID 33476595）：' +
      '265 例隨機（CRS+HIPEC 133／CRS alone 132），收案限 <b>PCI ≤ 25、WHO PS 0-1、18-70 歲</b>，' +
      'HIPEC 用 <b>oxaliplatin</b>（closed 360 mg/m² 或 open 460 mg/m²）。' +
      '中位追蹤 63.8 個月，<b>中位 OS 41.7 vs 41.2 個月，HR 1.00，p = 0.99</b>；' +
      '<b>60 天 ≥ 3 級不良事件 26% vs 15%，p = 0.035</b>。</td></tr>' +
      '<tr><td><b>闌尾來源的實際數字</b></td><td>PSOGI 附屬 16 中心回溯登錄 <b>2,298 例闌尾來源 PMP</b>' +
      '（Chua TC et al. J Clin Oncol 2012;30:2449-56，PMID 22614976）：' +
      '<b>治療相關死亡 2%、主要手術併發症 24%</b>；' +
      '<b>中位存活 196 個月（16.3 年）、中位無惡化存活 98 個月（8.2 年）、' +
      '10 年存活 63%、15 年存活 59%</b>。<br>' +
      '❗<b>藥師實務手冊 ver.1 第十章 10.5 寫「5 年存活率可達 59%」 —— ' +
      '原文的 59% 是 15 年存活率，不是 5 年。</b>這個誤植會大幅低估減積手術的成效，' +
      '請以原文數字向病人說明。<br>' +
      '同一篇的多變項不良因子：<b>術前曾接受化療（p &lt; 0.001）、PMCA 病理型（p &lt; 0.001）、' +
      '主要術後併發症、高 PCI、debulking（CCR 2/3）、未使用 HIPEC（PFS，p = 0.030）</b>。' +
      '<b>HIPEC 對 PFS 有效（HR 0.65，p = 0.03），但多變項中 OS 無差異</b>（ASCRS 引同一篇）。</td></tr>' +
      '<tr><td><b>灌注藥物</b></td><td><b>mitomycin 與 oxaliplatin 是最常用的兩個</b>，' +
      '無病存活、整體存活與毒性相似；<b>oxaliplatin 的主要併發症與費用較高</b>（ASCRS）。' +
      '一個隨機試驗顯示血液毒性型態不同：<b>mitomycin 較多白血球低下、oxaliplatin 較多血小板低下，' +
      '3／4 級不良事件無差異</b>（2025 共識）。<br>' +
      'PSOGI R58：<b>依現有藥理與生活品質資料，HIPEC 可以用 oxaliplatin 取代 mitomycin</b>' +
      '（弱正向）。<br>2025 共識：<b>irinotecan 的結果趨向較差；cisplatin 的資料互相矛盾。</b><br>' +
      '<b>開放式與封閉式技術都安全，併發症與腫瘤結果無明確差異；' +
      'HIPEC 的最佳時間與溫度沒有共識。</b></td></tr>' +
      '<tr><td><b>EPIC</b></td><td>早期術後腹腔化療。<b>用 5-FU 為主。</b>' +
      '挪威 93 例回溯比較 EPIC 與 HIPEC：<b>10 年 OS 與 DFS 無差異；' +
      '3 年 OS／RFS 為 50%／21%（HIPEC+EPIC）vs 46%／6%（HIPEC alone），p = 0.72／0.89；' +
      '但 HIPEC+EPIC 的 3／4 級併發症明顯較多（43% vs 20%，p = 0.01）</b>。<br>' +
      'PSOGI R59 對完整 CRS+HIPEC 後加 EPIC 給弱正向（共識僅 60.7%，是比較低的一條）。' +
      '<b>ICARUS 等試驗仍在進行。</b></td></tr>' +
      '<tr><td><b>PIPAC</b></td><td>加壓腹腔霧化化療。<b>ASCRS 2025 第 17 條（條件建議／低品質）：' +
      '需要特殊設備與專門技術，短期腫瘤結果可接受，但缺乏長期資料。</b><br>' +
      '❗<b>2025 全國共識更保守：「this consortium recommends PIPAC only in the setting of ' +
      'a clinical trial」</b> —— <b>只在臨床試驗中做。</b>' +
      '常用藥為 oxaliplatin，其次 cisplatin 與 doxorubicin。</td></tr>' +
      '</table>');
  }

  /* 2f. 全身化療處方與時機 */
  function rxReference() {
    /* ⚠ 用 fold() 不是 foldRx()：藥卡掃描會讀所有 details.rx-table，
       而這張表列的是「所有可能的處方選項與時機」，不是這位病人的處方。
       這位病人真正要開的藥寫在建議卡的一般條列裡，由那裡驅動藥卡。 */
    return fold('<b>全身化療的處方骨架與時機</b>（2025 全國共識 Part 1 系統性治療節）',
      '<table>' +
      '<tr><td><b>骨架</b></td><td><b>靜脈 5-FU 為主，較少用口服 capecitabine</b> —— ' +
      '就是大腸直腸癌那一套。<b>雙藥（加 oxaliplatin 或 irinotecan）或三藥（兩者都加）；' +
      '無法耐受者可用單藥。</b><br>' +
      '❗<b>目前只有小型回溯研究，沒有證據顯示哪一種處方比較好，' +
      '但三藥的毒性明顯較高，必須謹慎選擇病人。</b></td></tr>' +
      '<tr><td><b>療程長度</b></td><td><b>不論術前、圍手術期或術後，配合根治性手術的處方' +
      '一般設計為 3–6 個月，目標 6 個月。</b>無法根治手術者，' +
      '<b>細胞毒性化療可以成為長期管理策略的一部分</b>。<br>' +
      '<b>用來探查疾病生物行為或嘗試轉換成可切除時，一般每 3 個月重新評估一次。</b></td></tr>' +
      '<tr><td><b>局限性病灶</b></td><td>❗<b>「available studies indicate no benefit from the use of ' +
      '5-FU based chemotherapy in this population, so it is not recommended」</b> —— ' +
      '<b>WHO grade 1 的原發（低度黏液性病灶或分化良好腺癌）、以及 HAMN，' +
      '局限時不建議給 5-FU 為基礎的化療。</b></td></tr>' +
      '<tr><td>❗<b>可切除又沒有腹膜病灶時<br>不建議做術前化療</b></td>' +
      '<td><b>「至今沒有研究全面評估現代術前治療在可切除、無腹膜侵犯的闌尾腫瘤中的角色；' +
      '目前專家共識不贊成在該情境使用術前治療，因為會延遲根治性切除。」</b><br>' +
      '→ <b>這一格是先開刀，再考慮輔助化療。</b></td></tr>' +
      '<tr><td><b>低分級腹膜病灶</b></td><td><b>原發與腹膜病灶都是低分級時，通常不需細胞毒性治療。' +
      '可切除就做根治性切除；不可切除可考慮緩和性減積。</b><br>' +
      '<b>「no evidence currently supports their use for improved disease control or survival」</b> —— ' +
      '細胞毒性治療只能放在臨床試驗或以症狀控制為目標的照護路徑裡。<br>' +
      '❗<b>但腹膜病灶低分級而原發有高風險特徵時，要照高分級原發的方式考慮輔助化療。</b></td></tr>' +
      '<tr><td><b>高分級腹膜病灶</b></td><td><b>腹膜病理決定管理，原發的分級不影響</b> —— ' +
      '即使兩者嚴重不一致（例如 LAMN 配高分級腹膜病灶），也以腹膜病理為準。<br>' +
      '<b>共識建議：在嘗試減積之前先給化療；無法減積時則作為根治性治療。</b><br>' +
      '<b>預計可完全減積 → 化療用來評估疾病生物行為與反應；' +
      '預計不完全減積（高 PCI 或解剖因素）→ 化療定位為 conversion therapy。</b><br>' +
      '<b>減積不完全、或術前療程沒給完，要考慮術後補化療。</b><br>' +
      '❗<b>圍手術期分段給的方案，研究顯示病人比較難完成</b>；' +
      '手術必須提前時可以考慮。</td></tr>' +
      '<tr><td><b>反應率的實際範圍</b></td><td><b>影像上疾病穩定或改善 20–75%</b>，' +
      '部分原本無法切除者轉為可減積。<br>' +
      '<b>一個前瞻試驗：34 例術前化療者 50% 影像穩定或反應（並經術中所見確認），' +
      '其中 53%（9/17）病理分級低於先前標本。</b><br>' +
      '❗<b>但這不一定轉換成全體的 OS／RFS／PFS 效益</b> —— ' +
      '多篇觀察性研究顯示術前化療在一個或全部終點上沒有效益。<br>' +
      '<b>US HIPEC collaborative：高分級闌尾腫瘤合併腹膜侵犯的 ' +
      '5 年無病存活 23.2%、整體存活 43.8%。</b></td></tr>' +
      '<tr><td><b>抗 VEGF</b></td><td><b>bevacizumab</b> 在部分觀察性研究與較好的結果相關。' +
      '<b>「Anti-VEGF therapy may be considered in most settings in which systemic therapy is ' +
      'considered」</b>，尤其是<b>沒有切除或切除不完全</b>的情境。<br>' +
      '❗<b>應避免使用的情況：即將發生腸阻塞或穿孔的風險、出血、動脈血栓。</b>' +
      '（闌尾腫瘤病人常有腹膜大量病灶與腸阻塞風險，這一條特別要注意。）</td></tr>' +
      '<tr><td>❗<b>抗 EGFR 的角色有爭議</b></td><td><b>「Anti-EGFR agents have a more controversial ' +
      'role, as they have unclear survival benefit in appendix cancer and studies have raised ' +
      'concern for worse survival in patients with RAS mutations.」</b><br>' +
      '→ <b>' + NR('cetuximab') + ' 與 ' + NR('panitumumab') + ' 在闌尾癌的存活效益不明確，' +
      '在 RAS 突變者甚至有變差的顧慮；而闌尾癌 KRAS 突變率 &gt; 70%。</b></td></tr>' +
      '</table>');
  }

  /* 2g. 健保：整個癌別的給付缺口 */
  function nhiReference() {
    return fold('<b>❗健保在闌尾癌的缺口</b>（查詢日 2026-08-17，逐筆檢索）',
      '<table>' +
      '<tr><td colspan="2"><b>先講最重要的兩件事。</b></td></tr>' +
      '<tr><td>❗<b>HIPEC 與非婦科的<br>CRS／腹膜剝除<br>完全沒有健保</b></td>' +
      '<td><b>《全民健康保險醫療服務給付項目及支付標準》6,010 個現行項目逐筆檢索' +
      '（「溫熱／熱化學／HIPEC／hyperthermic intraperitoneal／減積／cytoreduct／腹膜剝除／' +
      '腹膜切除／peritonectomy／非婦癌 omentectomy」），查無任何以 HIPEC 或 CRS 為名的給付項目。' +
      '「減積」二字只出現在 80418B 婦癌減積手術一項。</b><br>' +
      '最接近的兩碼都不是 HIPEC，也沒有任何條文說可以併報成 HIPEC：' +
      '<b>37033B 肋膜或腹膜腔內化學藥物注射（1,339 點，藥費另計）</b>是常溫的；' +
      '<b>37001B 加熱治療（2,158 點）</b>是獨立項目。<br>' +
      '<b>CRS 的臟器切除部分本來就有給付</b>（74002B 闌尾切除 9,528 點、' +
      '74004B 腹腔鏡闌尾切除 11,433 點、73012B 根治性半結腸切除加吻合（升結腸）34,141 點）；' +
      '<b>真正沒有代碼的是腹膜剝除、非婦癌的大網膜切除，以及熱灌注本身。</b><br>' +
      '<b>實務上以衛生局核定的自費項目收費（逐字）</b>：' +
      '<b>馬偕紀念醫院「HIPEC 腹腔內溫熱化學治療 100,000 元／次」</b>' +
      '（為手術之費用，含基本手術耗材費，<b>不含麻醉費、腹腔化療管路、特殊藥品醫材、住院及回診</b>；' +
      '台北市衛生局核定 106/09/26、新北市 107/11/01）；' +
      '<b>花蓮慈濟「基本腹膜剝離術併溫熱療法 45,000／複雜 65,000」</b>（花蓮縣衛生局核備）。<br>' +
      '→ <b>這一格一定要在術前講清楚費用，這是決定要不要轉診到有做 CRS 的中心的現實因素。</b></td></tr>' +
      '<tr><td>❗<b>整份藥品給付規定<br>只有一條寫「闌尾癌」</b></td>' +
      '<td><b>115.4.23 版《藥品給付規定》410 頁、23,773 行逐字檢索「闌尾」只有 2 筆命中，' +
      '全部在 9.95 larotrectinib 第 3(12) 項</b>：<b>「闌尾癌：先前曾接受過至少一次全身性治療失敗，' +
      '又有疾病惡化，無法手術切除或轉移的闌尾癌。」</b>（限 NTRK 基因融合陽性，' +
      '需事前審查、每次療程 12 週為限、初次須附 NTRK 融合檢測報告並符合通則十二。）<br>' +
      '❗<b>「杯狀」與「假黏液」兩詞在全份給付規定中 0 筆命中。</b></td></tr>' +
      '<tr><td>❗<b>不能理所當然認為<br>「大腸直腸癌」含闌尾</b></td>' +
      '<td><b>9.95 同一條把「(2) 大腸直腸癌」與「(12) 闌尾癌」列成兩個並列、互不包含的癌別</b>；' +
      '<b>26072B／26073B 正子造影的適應症也只列「大腸癌、直腸癌」，闌尾癌未列名。</b><br>' +
      '→ <b>健保條文的寫法是把闌尾癌當獨立部位在列舉。</b><br>' +
      '<b>而 9.10（oxaliplatin）、9.12.1（irinotecan）、9.17（capecitabine）、9.27（cetuximab）、' +
      '9.37（bevacizumab）、9.53（panitumumab）一律只寫「結腸直腸癌」「大腸或直腸癌」' +
      '「直腸結腸癌」「第三期結腸癌」，沒有任何一條寫到闌尾。</b><br>' +
      '❗<b>查不到就不推測</b>：健保署網站、全國法規資料庫與公開搜尋都查不到任何函釋、公告或' +
      '審查注意事項明文說「闌尾癌得比照大腸直腸癌之給付規定申報」。' +
      '<b>健保沒有給出書面答案。</b></td></tr>' +
      '<tr><td><b>那實務上怎麼走</b></td><td>只有兩條路：<br>' +
      '① <b>病名以結腸癌歸類申報。</b>技術基礎是 ICD-10-CM 的 ' +
      '<b>C18.1 = Malignant neoplasm of appendix，隸屬 C18 = Malignant neoplasm of colon 類目</b>' +
      '（與 C18.0 盲腸、C18.2 升結腸同類）。<b>這是編碼事實，不代表審查會接受。</b><br>' +
      '❗<b>腹膜假黏液瘤（PMP）沒有專屬 ICD-10-CM 碼</b>，通常編為 ' +
      'C78.6 或以闌尾原發 C18.1 加形態學碼表達。<br>' +
      '② <b>走《藥物給付項目及支付標準》第 12 條第 1 項第 4 款的特殊病例個案事前審查</b>：' +
      '「不符藥品許可證所載適應症及本標準藥品給付規定者。<b>惟特殊病例得以個案向保險人申請' +
      '事前審查，並經核准後給付。</b>」<b>第 63 條第 2 項要 7 份文件</b>（申請書、病人同意書、' +
      '治療計畫書、IRB 非人體試驗聲明、近一年門住診病歷影本、傳統治療無效評估報告、' +
      '近五年佐證文獻）；<b>第 64 條：保險人應於收件起三週內完成核定。</b></td></tr>' +
      '<tr><td><b>許可證適應症的落差<br>（通則七的門檻）</b></td>' +
      '<td>沒有給付規定條文的藥（5-FU、leucovorin、mitomycin）只受' +
      '<b>通則七</b>約束：「本保險處方用藥，需符合主管機關核准藥品許可證登載之適應症…」<br>' +
      '<b>5-FU 是唯一寬到可能涵蓋闌尾的</b>：好復注射液「<b>消化器癌（如胃癌、直腸癌、結腸癌）</b>」；' +
      '福特喜膠囊「<b>不能開刀之胃腸道、乳部惡性腫瘤的姑息療法</b>」。' +
      '<b>闌尾在解剖與 ICD 分類上屬胃腸道，落在許可證文字內的空間最大。</b><br>' +
      '❗<b>leucovorin 更窄</b>：多數品項許可證只寫「葉酸拮抗劑之解毒劑」，' +
      '<b>只有衛部藥製字第058035號好立補凍晶注射劑 50 毫克寫「與 5-FU 併用治療大腸直腸癌」</b> —— ' +
      '<b>用哪個品項會直接影響能不能過審。</b><br>' +
      'capecitabine／oxaliplatin／irinotecan／bevacizumab／' + NR('cetuximab') + '／' +
      NR('panitumumab') + ' 的許可證一律只寫結腸／直腸／大腸直腸癌。</td></tr>' +
      '<tr><td>❗<b>順序陷阱一<br>三藥合併不給付</b></td>' +
      '<td><b>9.10.1(1) 逐字：「治療轉移性結腸直腸癌，惟若再加用 irinotecan（如 Campto）則不予給付。」</b><br>' +
      '→ <b>FOLFOXIRI／FOLFIRINOX 在大腸直腸癌（含要比照的闌尾癌）不給付。' +
      '而高分級闌尾腺癌指引常用的正是三藥方案 —— 這在健保是死路。</b><br>' +
      '（同一條第 3 項卻明文給付 FOLFIRINOX 於轉移性胰臟癌。）</td></tr>' +
      '<tr><td>❗<b>順序陷阱二<br>對減積手術病人特別致命</b></td>' +
      '<td><b>115/2/1 新增，' + NR('cetuximab') + ' 9.27.1(1)Ⅳ 與 ' + NR('panitumumab') +
      ' 9.53.1(4) 同時寫：「經手術完全切除（R0 切除）且查無轉移病灶者不得申請給付。」</b><br>' +
      '→ <b>闌尾癌做完完整 CRS（CC-0）且影像查無殘留病灶的病人，正好被這條擋在抗 EGFR 之外。</b><br>' +
      '（不過 2025 共識本來就對抗 EGFR 在闌尾癌持保留態度，見上方處方表。）</td></tr>' +
      '<tr><td>❗<b>順序陷阱三<br>抗 EGFR 一輩子一次</b></td>' +
      '<td>' + NR('cetuximab') + ' 9.27.1(1)Ⅱ／' + NR('panitumumab') + ' 9.53.1(2)：' +
      '<b>「二者僅能擇一使用」</b>；兩藥各自都寫<b>「不得與 bevacizumab 併用」</b>；' +
      'bevacizumab 9.37.1(1)Ⅲ 同步寫<b>「不得與 cetuximab、panitumumab 併用」</b>。<br>' +
      '9.27.1(2)Ⅳ：<b>「使用本品併用 encorafenib 作為第二線治療，' +
      '不得再申請抗 EGFR 藥品作為後續治療。」</b></td></tr>' +
      '<tr><td>❗<b>順序陷阱四<br>bevacizumab 第二線<br>的雙重前提</b></td>' +
      '<td><b>9.37.1(2) 要同時滿足「先前接受過以 fluoropyrimidine 為基礎的化學療法併用 ' +
      'cetuximab 或 panitumumab 無效」且「未曾接受過 bevacizumab 治療」、RAS 未突變。</b><br>' +
      '→ <b>第一線用過 bevacizumab 的人就走不到這條。</b>' +
      '另限品牌（除 Zirabev 以外）、<b>限劑量 5 mg/kg 每兩週一次、總療程 24 週為上限</b>，' +
      '並須附 30104B 認證實驗室的 All-RAS 檢測報告。</td></tr>' +
      '<tr><td><b>免疫治療</b></td><td>❗<b>9.69.1(11) 的 MSI-H／dMMR 條文明文限' +
      '「大腸直腸癌（CRC）」，沒有泛癌別（tumour-agnostic）條文。</b><br>' +
      '→ <b>闌尾腺癌或杯狀細胞腺癌若為 MSI-H／dMMR，健保條文沒有直接可套的入口。' +
      '而闌尾癌的 MSI-H／dMMR 盛行率本來就只有約 6%。</b></td></tr>' +
      '<tr><td><b>NTRK 融合</b></td><td><b>只有 larotrectinib 9.95 列闌尾癌。' +
      'entrectinib 9.93 在台灣只給 ROS-1 陽性非小細胞肺癌，沒有 NTRK 泛癌別條文。</b></td></tr>' +
      '<tr><td>❗<b>HIPEC 的 mitomycin<br>是藥證外使用</b></td>' +
      '<td><b>台灣現行唯一 mitomycin 藥證（衛部藥輸字第028315號 密多邁杏凍晶注射劑，' +
      '有效日期 2027/05/26）的適應症逐字為「胃癌、膀胱癌（灌注使用）、肺癌、肉瘤、白血病等' +
      '症狀之緩解」 —— 「灌注使用」只涵蓋膀胱，沒有腹腔內灌注、也沒有大腸直腸癌／闌尾癌。</b><br>' +
      '→ <b>HIPEC 用 mitomycin 屬 off-label：藥費原則不給付，只能走第 12 條第 1 項第 4 款的' +
      '特殊病例個案事前審查。</b>（其餘 mitomycin 品項均已註銷。）</td></tr>' +
      '</table>');
  }

  /* 2h. 闌尾 NET 的健保 */
  function nhiNetReference() {
    return fold('<b>❗闌尾 NET 的健保入口</b>（查詢日 2026-08-17）',
      '<table>' +
      '<tr><td colspan="2"><b>四個 NET 用藥沒有一條寫「闌尾」，差別在文義涵蓋得到還是涵蓋不到。</b></td></tr>' +
      '<tr><td><b>octreotide 長效型</b><br>5.4.4</td>' +
      '<td><b>第 3 項逐字：「治療患有晚期間腸（midgut）或已排除原位非間腸處而原位不明之' +
      '分化良好（well-differentiated）的神經內分泌瘤患者。」</b><br>' +
      '→ <b>闌尾在胚胎學上屬中腸（midgut）衍生，這一格文義涵蓋得到。</b><br>' +
      '<b>劑量：第 3 項每次 30 mg、間隔四週</b>（第 1、2 項為 20 mg）；超量須於病歷詳細紀錄備查。<br>' +
      '<b>需事前審查，每次申請以一年為限。</b><br>' +
      '第 2 項「患有功能性症狀之胃、腸、胰內分泌腫瘤」則<b>要有類癌症候群症狀才適用</b>。<br>' +
      '短效型 5.4.3.4 同樣要求「患有功能性症狀」。<br>' +
      '❗通則四之(二)11：<b>octreotide 攜回需個案事前報准。</b></td></tr>' +
      '<tr><td><b>lanreotide</b><br>5.4.6</td>' +
      '<td><b>第 3 項：「治療無法切除、分化程度為良好或中度、局部進展或轉移性之' +
      '胃、腸、胰臟神經內分泌腫瘤（GEP-NETs）」</b> → <b>闌尾屬腸道，文義涵蓋空間大。</b><br>' +
      '<b>每月限 120 mg 長效注射劑一針，間隔 4 週；需事前審查，每次一年為限。</b><br>' +
      '❗<b>非功能性患者「須附 6 個月內 somatostatin-receptor 陽性報告」，' +
      '但支付標準核醫項目（26001B–26078A）查無 Ga-68 DOTATATE PET 或 In-111 octreoscan 的' +
      '專屬給付代碼</b> —— <b>條文要求的檢查本身沒有對應給付項目，取得報告可能要自費。</b><br>' +
      '第 2 項「類癌瘤患者」須<b>具有功能性症狀且無法外科手術</b>，孕婦、小兒不得使用。</td></tr>' +
      '<tr><td><b>everolimus</b><br>9.36.1</td>' +
      '<td><b>第 3 項：「使用於無法切除、局部晚期或轉移之胃腸道或肺部來源之' +
      '非功能性神經內分泌腫瘤成人病患」</b> → <b>闌尾屬胃腸道，文義涵蓋得到。</b><br>' +
      '三個必須同時符合的條件：<b>① 腫瘤分化程度為良好；② 為進展性腫瘤，即過去 12 個月影像' +
      '檢查為持續惡化（RECIST 定義）；③ 不可合併使用化學藥物或其他標靶藥物。</b><br>' +
      '<b>限每日最大劑量 10 mg；需事前審查，每次療程 3 個月為限</b>，初次附病理與影像報告，' +
      '之後每 3 個月申請一次並附影像與前次療效評估。<br>' +
      '❗<b>互斥：第 2 項（胰臟 NET）明文「本品與 sunitinib 不得轉換使用」</b>' +
      '（僅嚴重不良反應或耐受不良例外）。</td></tr>' +
      '<tr><td>❗<b>' + NR('sunitinib') + '</b><br>9.31.3</td>' +
      '<td><b>條文與許可證都嚴格限「胰臟」神經內分泌腫瘤，沒有任何腸道／胃腸道來源的文字。</b><br>' +
      '→ <b>闌尾 NET 用 ' + NR('sunitinib') + ' 在健保條文上完全沒有入口 —— ' +
      '這是四個 NET 用藥中唯一連文義都套不進去的。</b></td></tr>' +
      '<tr><td>❗<b>PRRT</b></td><td><b>177Lu-DOTATATE 在《藥品給付規定》與《支付標準》均查無。' +
      '闌尾／中腸 NET 的 PRRT 完全沒有健保。</b></td></tr>' +
      '</table>');
  }

  /* 2i. 追蹤 */
  function followupHTML(kind) {
    var head = '<div class="fu-h">接下來怎麼追蹤</div>';
    if (kind === 'amn') {
      return head + '<ul class="fu-list">' +
        '<li><b>2025 全國共識 Part 1 Block 11（同意度 91%／95%）</b>：' +
        '<b>每 6–12 個月一次，做 5–10 年</b>；<b>分級較高或有任何程度的腹膜侵犯，就要更密集</b>。</li>' +
        '<li>內容：<b>病史與理學檢查 ＋ 橫斷面影像（CT 或 MRI 皆可，選一種一直用同一種）＋ ' +
        '腫瘤標記（CEA，加上初次評估或治療期間曾升高的其他標記）</b>。</li>' +
        '<li>時間分布：<b>復發最常發生在術後約前三年，到六年左右趨於平緩</b>。' +
        'US HIPEC collaborative 的回溯資料顯示<b>每 6–12 個月的影像追蹤不劣於更密集的排程</b>。</li>' +
        '<li>❗<b>橫斷面影像對早期腹膜病灶不敏感</b>。' +
        '有高風險病理特徵時<b>可以個案考慮 second-look laparoscopy，但多數 AMN 病人不需要</b>。</li>' +
        '<li><b>LAMN 沒有穿孔或溢出、局部切除完成後，追蹤可能不必要</b>' +
        '（ASCRS 2025 第 12 條）—— 114 例、11 家醫院、10 年的資料裡 34% 做了追蹤，' +
        '<b>平均追蹤 4.7 年無人復發</b>。</li>' +
        '<li><b>AMN 沒有明確的 ctDNA 追蹤適應症。</b></li>' +
        '<li>追蹤中發現復發或進展 → <b>依定義那就是腹膜病灶</b>，回步驟 1 選「已知有腹膜病灶」' +
        '（Block 10，同意度 96%／99%）。</li></ul>';
    }
    if (kind === 'adeno') {
      return head + '<ul class="fu-list">' +
        '<li><b>2025 全國共識 Part 1 Block 7（同意度 90%／95%）</b>：' +
        '<b>每 3–6 個月一次做 2–4 年，之後每年一次到 5–10 年。</b>' +
        '<b>比 AMN 密集</b>，因為切除後第一年的復發率較高，與較高分級的大腸直腸癌相當。</li>' +
        '<li>內容同 AMN：<b>病史與理學檢查 ＋ 影像 ＋ 腫瘤標記</b>。</li>' +
        '<li>❗ASCRS 2025 第 10 條把族群分開講：' +
        '<b>高分級、因局部晚期或穿孔而做右半結腸切除、切緣不確定、或有淋巴或腹膜病灶者 → ' +
        '前 3 年每 6 個月一次 CT 或 MRI，之後每年一次做 5–10 年。</b></li>' +
        '<li><b>ctDNA 可以考慮定期驗，特別是高分級或有 signet ring cells 者</b>；' +
        '闌尾癌的證據比轉移性大腸直腸癌少。<b>ASCRS 提醒闌尾腫瘤的 ctDNA 敏感度' +
        '比其他轉移性胃腸道腫瘤低。</b></li>' +
        '<li>擔心腹膜復發時<b>可以考慮 second-look laparoscopy</b>。</li></ul>';
    }
    if (kind === 'perit') {
      return head + '<ul class="fu-list">' +
        '<li><b>2025 全國共識 Part 2 Block 9（同意度 88%／98%）—— 依分級分兩套排程</b>：</li>' +
        '<li><b>grade 1（低分級）腹膜病灶：每 6 個月做 2 年 → 每年做 2 年 → 每 2 年做 5–10 年。</b></li>' +
        '<li><b>其他全部（grade 2／3、非黏液性）：每 3 個月做 2 年 → 每 6 個月做 2 年 → ' +
        '每年做 5–10 年。</b></li>' +
        '<li>內容：<b>胸腹骨盆橫斷面影像（MRI 或 CT）＋ 腫瘤標記（CEA 與病程中曾升高者）＋ ' +
        '更新的病史與理學檢查</b>。</li>' +
        '<li><b>grade 2／3 與非黏液性可考慮每 3 個月驗 ctDNA、持續 1 年</b>；' +
        '<b>grade 1 的 ctDNA 證據還不足。</b></li>' +
        '<li>ASCRS 2025 第 10 條對已做 CRS+HIPEC 的無細胞或低分級腹膜病灶：' +
        '<b>術後 3–6 個月做一次腹部骨盆 CT 或 MRI 當基線，之後前 3 年每 6–12 個月一次' +
        '（併驗腫瘤標記），此後每年一次。</b></li>' +
        '<li>PSOGI 2021 R70 的實務調查：<b>90.9% 的專家會驗腫瘤標記，' +
        '其中 54.5% 是每 6 個月一次</b>（每 3 個月 15.2%、每 4 個月 12.1%、每 12 個月 12.1%）。</li>' +
        '<li>❗<b>即使做到大體上完全減積，腹膜復發率仍有 7–37%</b>；' +
        '<b>約 25% 的病人在術後 1–3 年內復發</b>，細胞量與分級越高越多。' +
        '<b>無病存活在術後六年左右趨於平緩</b>：Govaerts 的資料裡' +
        '<b>低分級有 60%、高分級有 20% 仍無病</b>。<b>再次減積可個案考慮。</b></li></ul>';
    }
    return head + '<ul class="fu-list">' +
      '<li><b>ASCRS 2025 第 8 條（條件建議／低品質）：闌尾 NET 根治性切除後的追蹤' +
      '應「選擇性」進行</b>，依腫瘤大小與組織特徵決定，' +
      '內容可含理學檢查、連續生化檢查與胸腹骨盆 CT 或 MRI。</li>' +
      '<li>❗<b>生化標記（CgA、24 小時尿 5-HIAA）只在初始值原本就升高的病人比較有意義</b>；' +
      '一篇涵蓋所有胃腸道 NET 的統合分析中 <b>CgA 對疾病進展或復發的敏感度 46–100%、' +
      '特異度 68–90%</b> —— 範圍很寬，<b>必須與影像對照判讀</b>。</li>' +
      '<li><b>目前資料不足以支持把 NET 專屬影像用於常規追蹤</b>；' +
      '<b>Ga-DOTA 影像的位置是「臨床或生化上懷疑復發／進展，但常規影像陰性時的再分期」</b>。</li>' +
      '<li>NANETS 的提醒：<b>除了小型、分化良好的闌尾 NET 之外，' +
      '中腸 NET 切除後仍有相當復發風險，需追蹤至少 7 年</b>' +
      '（Boudreaux JP et al. Pancreas 2010;39:753-66，PMID 20664473）。</li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function appendixPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">闌尾腫瘤的臨床內容<b>全部依院外實證</b>編成 —— ' +
      '主幹為<b>現行最新的美國全國共識</b>（Ann Surg Oncol 2025；' +
      '<b>Part 1 無腹膜侵犯</b>、<b>Part 2 有腹膜侵犯</b>，' +
      'modified Delphi 兩輪、第二輪 133 人參與、所有 pathway block 共識 &gt; 90%，' +
      '<b>已取代 2018／2020 Chicago 共識</b>），' +
      '並對照 <b>ASCRS 2025</b>（Dis Colon Rectum 2025;68:815-834，17 條 GRADE 建議，' +
      '<b>已取代 2019 版</b>）與<b>歐洲的 PSOGI／EURACAN 2021</b>（70 條共識，附專家投票百分比）；' +
      '分類用 <b>PSOGI 2016 共識</b>，NET 部分另對照 <b>ENETS 2023</b>。<br>' +
      '❗<b>台大癌症醫療委員會沒有闌尾癌診療指引</b>（大腸直腸癌診療指引版次 21 全文無闌尾章節）。' +
      '院內唯一有整章內容的是<b>《CRC 大腸直腸癌診療與藥物治療完整臨床實務手冊》ver.1</b>' +
      '（2026.01，傅彥崴 藥師，主要依 NCCN Colon Cancer v5.2025）第十章，' +
      '<b>該 PDF 完全沒有台大標記，不是台大癌委會文件</b>；本頁引用它時一律標明，' +
      '並在兩處指出它的數字需要修正。<br>' +
      '❗<b>台灣最重要的一件事：HIPEC 與非婦科的 CRS／腹膜剝除完全沒有健保給付項目，只能自費。</b>' +
      '整份《藥品給付規定》逐字檢索「闌尾」只有一條命中。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是分類、初始評估、' +
      'PCI 與減積禁忌、腹腔化療證據、處方與健保條文。</p>';
    h += '<div class="onc-path" id="apPath">';

    h += node0('ap_n1', '1', '這位病人目前在哪一個狀況？',
      opt('scope', 'path', '拿到闌尾切除的病理報告，要決定還要不要再開刀', '最常見的入口') +
      opt('scope', 'perit', '已知有腹膜病灶（PMP／腹膜轉移），要決定能不能減積', '') +
      opt('scope', 'net', '病理是神經內分泌腫瘤 aNET，要決定要不要補右半結腸切除', '看大小與不良特徵') +
      opt('scope', 'sys', '想知道全身治療的時機、分子檢測與健保怎麼卡', ''));

    /* ── A. 闌尾切除後的病理（局限性病灶） ── */
    h += '<div id="ap_b_path" class="hidden">';
    h += node('ap_n_histo', '2', '病理報告寫的是哪一種？（PSOGI 2016 命名）',
      opt('histo', 'lamn', 'LAMN 低度闌尾黏液性腫瘤', '無浸潤性侵襲') +
      opt('histo', 'hamn', 'HAMN 高度闌尾黏液性腫瘤', '無浸潤性侵襲、但細胞學高度異型') +
      opt('histo', 'adeno', '闌尾腺癌（黏液性或非黏液性）', '有 infiltrative invasion') +
      opt('histo', 'gca', '杯狀細胞腺癌 goblet cell adenocarcinoma', '按腺癌管理'),
      psogiClassReference() + workupReference());
    h += recBox('ap_r_histo', '建議處置 · 病理報告先確認這幾件事');

    h += node('ap_n_mucin', '3', '切緣、穿孔與闌尾外黏液的狀況是哪一種？',
      opt('mucin', 'clean', '切緣陰性、無穿孔、無闌尾外黏液或腫瘤細胞', '') +
      opt('mucin', 'perf', '切緣陰性，但有顯微穿孔，或黏液／腫瘤細胞只在闌尾表面', '') +
      opt('mucin', 'marg', '切緣陽性：切緣有存活的腫瘤上皮細胞', '不是只有無細胞黏液') +
      opt('mucin', 'localacell', '闌尾外只有侷限的無細胞黏液，而且已經完全切乾淨', '') +
      opt('mucin', 'resid', '右下腹的無細胞黏液，但初次手術留有殘留', '含外院轉來、先前減積不完全') +
      opt('mucin', 'wide', '無細胞黏液已超出闌尾周圍，或是有細胞的黏液', '要走腹膜路徑'));
    h += recBox('ap_r_mucin', '建議處置 · 還要不要再開刀');
    h += fuBox('ap_f_amn');

    h += node('ap_n_extent', '3', '腫瘤的範圍到哪裡？',
      opt('extent', 'conf', '侷限在闌尾，沒有腹膜病灶', '') +
      opt('extent', 'perit', '已經有腹膜病灶', '這一格三份指引不同調') +
      opt('extent', 'm1c', '已有腹膜以外的轉移（M1c，肝、肺）', ''));
    h += recBox('ap_r_surg', '建議處置 · 手術範圍');

    h += node('ap_n_pstage', '4', '右半結腸切除後的病理分期是哪一種？',
      opt('pstage', 's3', 'Stage III：至少一顆區域淋巴結陽性', '') +
      opt('pstage', 's2h', 'Stage II，但有高風險特徵', '高風險的內容見建議卡') +
      opt('pstage', 's2', 'Stage II，沒有高風險特徵', '') +
      opt('pstage', 's1', 'Stage I', ''));
    h += recBox('ap_r_adj', '建議處置 · 術後輔助全身治療');
    h += fuBox('ap_f_adeno');
    h += '</div>';

    /* ── B. 腹膜病灶 ── */
    h += '<div id="ap_b_perit" class="hidden">';
    h += node('ap_n_pgrade', '2', '腹膜病灶的分級是哪一種？（PSOGI 2016；以腹膜病理為準，不是原發）',
      opt('pgrade', 'acell', '腹腔內只有無細胞黏液（M1a）', '') +
      opt('pgrade', 'lg', '低分級 PMP（grade 1）', '舊稱 DPAM') +
      opt('pgrade', 'hg', '高分級 PMP（grade 2）', '舊稱 PMCA') +
      opt('pgrade', 'src', '高分級 PMP 併 signet ring cells（grade 3）', '') +
      opt('pgrade', 'nonmuc', '非黏液性腹膜病灶', '中位存活只有 18.9–24 個月'),
      psogiClassReference() + pciReference());
    h += node('ap_n_cc', '3', '影像與（必要時）腹腔鏡評估後，預計做得到完全減積（CC-0／CC-1）嗎？',
      opt('cc', 'complete', '預計可以完全減積', '') +
      opt('cc', 'incomplete', '預計無法完全減積', '高 PCI 或解剖因素'));
    h += recBox('ap_r_perit', '建議處置 · 減積、腹腔化療與全身治療的順序');
    h += fuBox('ap_f_perit');
    h += '</div>';

    /* ── C. 闌尾 NET ── */
    h += '<div id="ap_b_net" class="hidden">';
    h += node('ap_n_nsize', '2', '腫瘤最大徑是多少？',
      opt('nsize', 'lt1', '< 1 cm', '最常見') +
      opt('nsize', 'mid', '1–2 cm', '這一格最有爭議') +
      opt('nsize', 'gt2', '> 2 cm', ''));
    h += node('ap_n_nfeat', '3', '有沒有不良特徵？（內容見建議卡，任一項即算有）',
      opt('nfeat', 'none', '一項都沒有', '') +
      opt('nfeat', 'yes', '有一項以上', ''));
    h += recBox('ap_r_net', '建議處置 · 要不要補做右半結腸切除');
    h += fuBox('ap_f_net');
    h += '</div>';

    /* ── D. 全身治療、分子與健保 ── */
    h += '<div id="ap_b_sys" class="hidden">';
    h += node('ap_n_sysq', '2', '要問的是哪一件事？',
      opt('sysq', 'timing', '化療要在術前還是術後給、給多久', '') +
      opt('sysq', 'mol', '分子檢測要驗什麼、驗到能怎麼用', '') +
      opt('sysq', 'nhi', '健保給不給付、怎麼申報', '闌尾癌只有一條'));
    h += recBox('ap_r_sys', '建議處置 · 這一題的答案');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="apReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="ap_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="ap_drugs"></div>';
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
    var root = el('apPath');
    if (!root) return;
    root.querySelectorAll('.ap-node').forEach(function (n) {
      if (n.id !== 'ap_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['ap_b_path', 'ap_b_perit', 'ap_b_net', 'ap_b_sys'].forEach(function (id) { show(id, false); });
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
     5. 分支 A：闌尾切除後的病理
     ========================================================== */
  function renderPath() {
    show('ap_b_path', true);
    show('ap_n_histo', true);
    if (!S.histo) return;

    renderHistoRec();

    if (S.histo === 'lamn' || S.histo === 'hamn') {
      setNum('ap_n_mucin', '3');
      show('ap_n_mucin', true);
      if (S.mucin) renderMucinRec();
    } else {
      setNum('ap_n_extent', '3');
      show('ap_n_extent', true);
      if (!S.extent) return;
      renderSurgRec();
      if (S.extent === 'conf') {
        setNum('ap_n_pstage', '4');
        show('ap_n_pstage', true);
        if (S.pstage) renderAdjRec();
      }
    }
  }

  /* 5a. 步驟 2 的建議：病理報告要確認什麼 */
  function renderHistoRec() {
    var L = [];
    L.push(H('這一格最容易誤判的地方', '2025 全國共識 Part 1 病理節'));
    L.push('<b>分界在「有沒有 invasive component」</b>：低分級那一端要分開 ' +
      '<b>LAMN 與分化良好的黏液性腺癌</b>，高分級那一端要分開 <b>HAMN 與腺癌</b>。');
    if (S.histo === 'hamn') {
      L.push('❗<b>HAMN 的侵襲成分特別容易被漏掉</b> —— 共識原文' +
        '「<b>it is common for an invasive component of HAMN to be missed</b>」，' +
        '要求「should be particularly closely examined」。' +
        '<b>請確認整個標本都做過完整組織學評估，而且是由熟悉這個疾病的病理醫師看的。</b>');
      L.push('❗<b>HAMN 的資料極少</b>。PSOGI 2021 的立場是' +
        '「<b>HAMN should be graded, treated, and followed as an appendiceal (mucinous) ' +
        'adenocarcinoma</b>」，Fig 2 的演算法裡 HAMN 那一欄是<b>淡化顯示</b>的，' +
        '代表「應該比照黏液性腺癌處理」而非獨立路徑。<b>這一格務必上多專科團隊討論。</b>');
    }
    if (S.histo === 'lamn') {
      L.push('<b>「分化良好的黏液性腺癌」這個診斷要特別謹慎下</b> —— ' +
        '共識明文說它「must also be cautiously designated, as it affects the recommended ' +
        'extent of surgical resection」。<b>它和 LAMN 的差別會直接改變要不要做右半結腸切除。</b>');
    }
    if (S.histo === 'adeno') {
      L.push('<b>要在報告上確認的是黏液性還是非黏液性，以及分化度</b> —— ' +
        '<b>非黏液型的淋巴結陽性率明顯較高</b>，兩者的手術範圍與預後都不一樣。');
      L.push('<b>另外要確認有沒有 signet ring cell 成分</b>：' +
        '<b>signet ring cells 是已經在闌尾癌本身驗證過的高風險特徵</b>，' +
        '而且報告一出現 signet ring cells 就是專家病理複閱的適應症。');
    }
    if (S.histo === 'gca') {
      L.push('<b>杯狀細胞腺癌兼具上皮與神經內分泌特徵，但臨床行為更接近腺癌，' +
        '所以走腺癌路徑</b>（藥師實務手冊 ver.1 第十章 10.3 亦同此說）。' +
        'ASCRS 2025 第 13 條明文把 GCA 與「混合神經內分泌與上皮腺癌特徵」的腫瘤' +
        '一併納入右半結腸切除的建議。');
      L.push('❗<b>歐洲把 GCA 另外分了型</b>：PSOGI 2021 用 <b>Tang 分類</b>，' +
        '對「<b>Tang A、pT1／pT2 且 &lt; 20 mm、切緣乾淨、mesoappendix 侵犯 &lt; 3 mm、' +
        '無血管或神經侵犯、Ki-67 &lt; 2%</b>」的 GCA 給的是<b>弱負向（不建議做右半結腸切除，' +
        '共識 65.5%）</b>；<b>只要偏離其中任何一項，就是強正向「一律要做」（R19，共識 78.2%）</b>。');
      L.push('<b>所以請確認病理報告有沒有寫 Tang 分類、Ki-67 與 mesoappendix 侵犯深度。' +
        '沒有這三項，就只能照 ASCRS／2025 共識一律做右半結腸切除。</b>');
    }
    L.push(H('要不要請專家再看一次', '2025 全國共識 Part 1'));
    L.push('<b>三種情況一定要專家病理複閱</b>：<b>從外院轉來</b>、' +
      '<b>原發與腹膜病灶的分級明顯不一致</b>、<b>報告出現 signet ring cells</b>。');
    L.push('<b>ASCRS 2025 第 9 條講得更直接：想在 LAMN 與 HAMN 之間做鑑別，' +
      '分子檢測與腫瘤標記都試過很多次，「最重要的診斷成分是有一位熟悉這個疾病過程的' +
      '病理醫師來看報告」。</b>');
    L.push(H('闌尾外黏液的細胞性一定要判對', ''));
    L.push('<b>「Correct identification of the cellularity of extra-appendiceal mucin is critical ' +
      'to determine whether disease should be treated according to the peritoneal management ' +
      'pathway.」</b>—— <b>有細胞還是無細胞，決定走下一步的局部路徑還是整個腹膜路徑。</b>');
    L.push('❗<b>術中冷凍切片不可靠，尤其黏液性病灶</b>。<b>有無細胞只能在術後才確定</b>，' +
      '所以<b>要等完整標本的正式報告，才判斷要不要做右半結腸切除。</b>');
    L.push(EV('這也是為什麼共識把「局限性病灶」的定義寫成「依定義不該有明顯的巨觀腹膜病灶，' +
      '但當初被外科判為局限的標本裡，仍可能出現表面黏液或穿孔」——' +
      '局限與腹膜兩條路徑的分界是病理報告畫的，不是手術當下畫的。'));

    fill('ap_r_histo', 'rec-elective',
      HISTO_LABEL[S.histo] + '<br>→ 先把病理報告的這幾欄確認齊，再決定下一步',
      L,
      '2025 全國共識 Part 1（Ann Surg Oncol 2025;33:5142-5175，PMID 40560498）病理節；' +
      'ASCRS 2025 第 9、12、13 條（Dis Colon Rectum 2025;68:815-834，PMID 40262165）；' +
      'PSOGI 2016 分類（PMID 26492181）；PSOGI／EURACAN 2021 Fig 2 與 R18／R19。');
  }

  /* 5b. 步驟 3（LAMN／HAMN）：還要不要再開刀 */
  function renderMucinRec() {
    var L = [], cls = 'rec-elective', title = '', extra = '';
    var isHamn = S.histo === 'hamn';

    if (S.mucin === 'clean') {
      cls = 'rec-nonop';
      title = HISTO_LABEL[S.histo] + '、切緣陰性、無穿孔、無闌尾外黏液<br>' +
        '→ 闌尾切除就完成了，追蹤可以選擇性做';
      L.push(H('這一格的結論', '2025 共識 Part 1 Block 3（同意度 93%／96%）'));
      L.push('<b>切緣陰性、沒有穿孔、也沒有闌尾外黏液或腫瘤細胞 → 追蹤可以選擇性進行。' +
        '「In many cases surveillance will not be necessary」。</b>');
      L.push('<b>ASCRS 2025 第 12 條（強建議／中等品質證據）：' +
        '「切緣陰性、無穿孔、無腹膜侵犯的 LAMN，只做闌尾切除就安全。」</b>' +
        '手術範圍是<b>闌尾切除連同完整的 mesoappendix</b>。');
      if (isHamn) {
        L.push('<b>HAMN 也適用</b>：共識明文「HAMNs without perforation or peritoneal involvement ' +
          'and a negative microscopic margin, when found incidentally in an appendectomy specimen, ' +
          'can generally be treated with appendectomy alone」。');
        L.push('❗<b>但前提是要排除合併的侵襲性腺癌</b> —— 需要專家病理醫師對' +
          '<b>整個手術標本</b>做完整組織學評估。<b>HAMN 的資料很少，' +
          '要很低的門檻就提多專科團隊討論。</b>');
        L.push('❗<b>歐洲比這個積極</b>：PSOGI R33 對「非穿孔 HAMN、pT &lt; 4、R0、無殘留病灶」' +
          '給的是<b>「可以考慮補做右半結腸切除」（弱正向，共識 67.3%）</b>，' +
          'R34 甚至對「右半結腸切除加 CRS+HIPEC」給弱正向（共識 56.4%）。' +
          '<b>兩邊差在 HAMN 到底該當 LAMN 還是當腺癌看。</b>');
      }
      L.push(EV('ASCRS 引的實務資料：<b>11 家醫院、10 年、114 例，34% 的病人做了追蹤' +
        '（門診、CT、MRI、大腸鏡或腫瘤標記），平均追蹤 4.7 年，無人復發。</b>'));
      L.push(EV('病理端的支撐：<b>局限於 muscularis propria 的 LAMN，本系列 21 例加文獻 43 例' +
        '合計 64 例全部 0 復發</b>（Umetsu SE, Hum Pathol 2017，PMID 28970138）；' +
        'Misdraji 的 107 例系列中<b>局限於闌尾的 LAMN 無一復發（中位追蹤 6 年）</b>' +
        '（PMID 12883241）。'));
      L.push('❗<b>但復發風險不是零</b>：共識明講<b>「the risk of recurrence is never zero, ' +
        'as it is possible for an AMN to perforate and then re-seal」</b> —— ' +
        '<b>可能穿孔之後又自行封閉，理論上腹膜復發的風險會上升。</b>' +
        '所以是「選擇性追蹤」而不是「一定不用追蹤」。');
      extra = workupReference();

    } else if (S.mucin === 'perf') {
      title = HISTO_LABEL[S.histo] + '、切緣陰性但有顯微穿孔或表面黏液<br>→ 要追蹤，不需要再開刀';
      L.push(H('這一格的結論', '2025 共識 Part 1 Block 4（同意度 94%／98%）'));
      L.push('<b>切緣陰性、但有顯微穿孔，或有顯微的闌尾外黏液／腫瘤細胞侷限在闌尾表面 → ' +
        '要追蹤（見下方追蹤排程）。</b>');
      L.push('<b>共識特別加了一句定義：「Microscopic extra-appendiceal mucin and neoplastic cells ' +
        'confined to the surface of the appendiceal specimen alone still constitute a negative ' +
        'margin.」</b>—— <b>只在標本表面的顯微黏液與腫瘤細胞，本身仍算切緣陰性，' +
        '不要因此判成切緣陽性去多切一段。</b>');
      L.push('❗<b>這一格歐美不同調，而且方向明確相反。</b>');
      L.push('<b>PSOGI／EURACAN 2021 對穿孔的 LAMN（pT4a-b、pNx、cM0、R0、無殘留病灶）：</b>' +
        SUB(['<b>R29 —— 臟層腹膜有<u>無細胞</u>黏液 → 「adjuvant CRS and HIPEC could be considered」' +
          '（LoE Moderate、弱正向、共識 71.4%）</b>',
        '<b>R30 —— 臟層腹膜有<u>有細胞</u>黏液 → 同樣「could be considered」' +
          '（LoE Moderate、弱正向、共識 78.6%）</b>',
        '至於右半結腸切除，PSOGI 兩條都給<b>負向</b>（R24 弱負向 60.0%、R25 弱負向 58.2%）—— ' +
          '<b>歐洲想加的是 CRS／HIPEC，不是右半結腸切除。</b>']));
      L.push('<b>而 2025 全國共識這一格只要追蹤。差別在於：' +
        '「顯微穿孔＋黏液只在闌尾表面」到底算不算已經有腹膜病灶。</b>');
      L.push('<b>實務上的分界建議：先確認腹膜有沒有真的病灶。</b>' +
        '<b>如果只是標本表面而腹腔內看不到黏液，照 2025 共識追蹤；' +
        '如果腹腔內看得到黏液（不論有無細胞），那就不是這一格，要走腹膜路徑。</b>');
      L.push(EV('穿孔確實會提高復發率：Honore 的 25 例中<b>12 例（48%）復發，' +
        '穿孔者復發率 65% vs 非穿孔 17%（p = 0.068，未達統計顯著）</b>；' +
        'Foster 的 22 例 LAMN 中 <b>5 例（23%）在追蹤第一年復發，而其中 81.2% 的闌尾在切除前已穿孔</b>。' +
        '這是 PSOGI 傾向積極的理由。'));
      L.push(EV('Yantiss 的 65 例（僅局限性闌尾周圍黏液、無瀰漫腹膜侵犯）給了更細的分層：' +
        '<b>無細胞組 2/50（4%）出現瀰漫腹膜疾病（而且這 2 例的闌尾沒有全部送檢）；' +
        '有細胞組 5/15（33%）出現黏液性腹水，其中 1 例死於疾病（p = 0.03）</b>' +
        '（PMID 18852679）。<b>「闌尾要全部送檢」這件事在這一格特別重要。</b>'));
      extra = psogiClassReference();

    } else if (S.mucin === 'marg') {
      title = HISTO_LABEL[S.histo] + '、切緣有存活的腫瘤上皮細胞<br>→ 再切到切緣陰性，但要用最保守的切法';
      L.push(H('要切，但不要切大', '2025 共識 Part 1 Block 5（同意度 92%／98%）'));
      L.push('<b>切緣有存活的腫瘤上皮細胞（不是只有無細胞黏液），或對此有疑慮時 → ' +
        '再次切除到切緣陰性。</b>');
      L.push('❗<b>共識明確改變了做法</b>：<b>「Historically, ileocecectomy or cecectomy have been ' +
        'performed, but the consensus recommendation is to perform the most conservative resection ' +
        'possible, such as cuff resection. Anastomosis should be avoided if possible.」</b><br>' +
        '<b>→ 做得越保守越好，例如 cuff resection；儘可能避免做吻合。</b>');
      L.push('<b>之後要規則追蹤。</b>');
      L.push('<b>手術併發症風險高的病人可以考慮只觀察</b> —— ' +
        '共識原文「there may be less benefit from oncologic resection」。');
      L.push('❗<b>如果切緣只有無細胞黏液（不是存活的上皮細胞），那不是這一格</b>：' +
        '<b>ASCRS 2025 第 12 條說非穿孔 LAMN 的顯微切緣陽性「並不預測復發，' +
        '因此不需要進一步治療」。</b>');
      L.push(EV('直接的實證：16 例（15 LAMN、1 adenoma）近端切緣受累 —— ' +
        '<b>9 例管腔內有腫瘤上皮、7 例闌尾壁內為無細胞黏液；6 例再行盲腸切除者皆無殘存腫瘤；' +
        '平均追蹤 4.7 年，無人復發或發生 PMP</b>' +
        '（Arnason T, Yantiss RK, Misdraji J. Arch Pathol Lab Med 2015;139:518-21，PMID 24971927）。' +
        '<b>這篇的結論是支持保守追蹤 —— 也就是「切乾淨就好，不必切大」的依據。</b>'));
      if (isHamn) {
        L.push('❗<b>HAMN 切緣陽性時要更小心排除侵襲性腺癌</b>：' +
          '一旦有 invasive component，就不是這一格，要改走腺癌路徑做右半結腸切除。');
      }

    } else if (S.mucin === 'localacell') {
      cls = 'rec-nonop';
      title = '闌尾外只有侷限的無細胞黏液，而且已完全切除<br>→ 不需要再手術，規則追蹤即可';
      L.push(H('這一格的結論', '2025 共識 Part 1 Block 7（同意度 96%／98%）'));
      L.push('<b>闌尾外病灶只有直接目視下侷限的無細胞黏液，而且所有病灶都完全切除' +
        '（等同於一次完整／足夠的減積）→ 不需要進一步的手術處置。' +
        '復發率低到 4%。</b>');
      L.push('❗<b>「侷限」的定義要寫出來</b>：<b>共識定為「disease limited to the meso-appendiceal ' +
        'fold and peri-appendiceal recesses」</b> —— 侷限在闌尾繫膜摺與闌尾周圍的凹窩。' +
        '<b>最終仍取決於術中的外科判斷，但這就是共識給的具體範圍。</b>');
      L.push('<b>要規則追蹤</b>（見下方排程）。');
      L.push('<b>ASCRS 2025 的說法一致</b>：這一格「appendectomy with cytoreduction of the ' +
        'periappendiceal peritoneum」的<b>腹膜復發率在 0–5% 之間，而且做減積與做 HIPEC 的結果相當</b>' +
        '（意思是加 HIPEC 沒有多出好處）。');
      L.push('❗<b>但只要是「有細胞」的黏液，就完全是另一回事</b>：' +
        '<b>LAMN 合併有細胞黏液沉積的後續腹膜侵犯風險是 33–78%</b>，' +
        '要密切追蹤並考慮減積加 HIPEC。<b>這也是為什麼上一步一定要把細胞性判對。</b>');
      extra = pciReference();

    } else if (S.mucin === 'resid') {
      title = '右下腹的無細胞黏液，但初次手術留有殘留<br>→ 開始評估減積手術 ± 腹腔化療';
      L.push(H('這一格的結論', '2025 共識 Part 1 Block 8（同意度 95%／98%）'));
      L.push('<b>闌尾外病灶只有右下腹的無細胞黏液，但初次探查時留有殘留病灶' +
        '（不論當時有沒有嘗試切除）→ 應該開始評估減積手術 ± 腹腔化療。</b>');
      L.push('<b>典型情境就是：從外院轉來，或先前的減積不完全。</b>');
      L.push('❗<b>共識自己標明這一格的證據很弱</b>：' +
        '「given the limited data on recurrence in this subpopulation, ' +
        '<b>this is primarily an expert consensus-based recommendation</b>」。');
      L.push('<b>接下來請回步驟 1 選「已知有腹膜病灶」，' +
        '在腹膜路徑用 PSOGI 2016 分級與完全減積的預測走完評估。</b>');
      L.push('❗<b>注意：這個階段在沒有 HIPEC 的情況下最好避免做右半結腸切除</b>' +
        '（PSOGI 引 Gonzalez-Moreno／Sugarbaker）—— ' +
        '<b>會增加腫瘤植入腹膜後空間與吻合處腫瘤細胞捕捉的風險，' +
        '破壞組織層面可能妨礙日後的根治性治療並惡化存活。</b>');
      extra = pciReference() + ovaryReference();

    } else if (S.mucin === 'wide') {
      cls = 'rec-urgent';
      title = '無細胞黏液超出闌尾周圍，或有細胞的黏液<br>→ 這已經是腹膜病灶，要走腹膜路徑';
      L.push(H('這一格要換路徑', '2025 共識 Part 1 Block 9（同意度 96%／96%）'));
      L.push('<b>手術探查發現闌尾外的無細胞黏液擴散超出闌尾周圍區域，或是有細胞的黏液 → ' +
        '轉到腹膜疾病路徑</b>，因為「a more comprehensive approach focused on regionally ' +
        'advanced disease must be pursued」。');
      L.push('<b>理由是復發率</b>：<b>局限性有細胞黏液（任何分級）的復發估計在 33–75% 之間，' +
        '和瀰漫性疾病相當</b> —— 所以要用同樣積極的做法。');
      L.push('<b>請回步驟 1 選「已知有腹膜病灶」。</b>' +
        '在那條路徑裡要先定腹膜病灶的 PSOGI 2016 分級（以腹膜病理為準，不是原發），' +
        '再判斷預計做不做得到完全減積。');
      L.push('❗<b>先確認一件事：診斷要完整。</b>' +
        '2025 共識 Block 6（同意度 97%／99%）—— ' +
        '<b>「index 探查發現巨觀腹膜擴散或闌尾外黏液時，必須先確立明確診斷：' +
        '技術上可行就做腹膜病灶切片加闌尾切除，讓病理能清楚確認診斷與疾病分級以指引治療。」</b>');
      extra = psogiClassReference() + pciReference();
    }

    fill('ap_r_mucin', cls, title, L,
      '2025 全國共識 Part 1（Ann Surg Oncol 2025;33:5142-5175，PMID 40560498）Block 3–9；' +
      'ASCRS 2025 第 12 條（PMID 40262165）；' +
      'PSOGI／EURACAN 2021 R23–R36（Govaerts K et al. Eur J Surg Oncol）。' +
      '<b>台大癌委會無闌尾癌指引，本段全部為院外實證。</b>',
      extra);

    if (S.mucin !== 'wide' && S.mucin !== 'resid') fu('ap_f_amn', 'amn');
  }

  /* 5c. 步驟 3（腺癌／GCA）：手術範圍 */
  function renderSurgRec() {
    var L = [], cls = 'rec-elective', title = '', extra = '';
    var isGca = S.histo === 'gca';

    if (S.extent === 'conf') {
      title = HISTO_LABEL[S.histo] + '、侷限在闌尾<br>→ 右半結腸切除加區域淋巴結廓清';
      L.push(H('主建議', '2025 共識 Part 1 Block 2（同意度 94%／97%）；ASCRS 2025 第 13 條'));
      L.push('<b>ASCRS 2025 第 13 條（強建議／低品質證據）：' +
        '「非轉移性的闌尾腺癌應接受右半結腸切除。」</b>' +
        '2025 共識同方向：<b>「Right hemicolectomy with oncologic lymphadenectomy should be pursued ' +
        'for most cases of appendiceal adenocarcinoma in suitable surgical candidates.」</b>');
      L.push('<b>理由是淋巴結轉移率：闌尾腺癌的區域淋巴結轉移率 20–67%，' +
        '非黏液型（腸型）更容易陽性。</b>');
      L.push('<b>正式的淋巴結區域切除有三個作用</b>：' + SUB([
        '<b>分期更完整</b>', '<b>可能有治療效益</b>',
        '<b>可以進一步指引要不要做輔助全身化療</b>']));
      L.push(H('要摘幾顆淋巴結', '2025 共識 Block 2'));
      L.push('<b>目前沿用結腸癌的 12 顆標準。觀察性資料顯示至少 10 顆就看得到存活差異。</b>');
      L.push('<b>藥師實務手冊 ver.1 第十章 10.4 的說法一致</b>：' +
        '「有 lymphovascular invasion 或切緣陽性，應考慮行右半結腸切除術，' +
        '<b>並清除至少 12 顆淋巴結</b>以確保分期精準」。');
      L.push(EV('2025 共識也承認觀察到的效益可能部分來自 stage migration 與研究方法限制，' +
        '但仍指出「<b>右半結腸切除在多數期別大於 1 的黏液性腺癌、以及任何非黏液性腺癌，' +
        '都與存活效益相關</b>」。'));
      if (isGca) {
        L.push(H('❗杯狀細胞腺癌這一格的分歧', ''));
        L.push('<b>ASCRS 2025 第 13 條明文把 GCA 納入右半結腸切除的建議</b>，' +
          '連「混合神經內分泌與上皮腺癌特徵」的腫瘤也一併納入；' +
          '<b>2025 全國共識 Part 1 的腺癌路徑也涵蓋 GCA</b>（只排除 NET）。');
        L.push('<b>PSOGI／EURACAN 2021 用 Tang 分類另開條件</b>：' + SUB([
          '<b>R18 —— Tang A、pT1／pT2 且 &lt; 20 mm、切緣乾淨、mesoappendix 侵犯 &lt; 3 mm、' +
            '無血管或神經侵犯、Ki-67 &lt; 2% → 「should not be considered」' +
            '（LoE Low、弱負向、共識 65.5%）</b>',
          '<b>R19 —— 偏離其中任何一項 → 「should always be performed」' +
            '（LoE Moderate、強正向、共識 78.2%）</b>',
          'R47.7 —— 以原發組織型看，<b>GCC 的右半結腸切除是強正向（共識 82.1%）</b>']));
        L.push('<b>實務判斷：病理報告要有 Tang 分類、Ki-67 與 mesoappendix 侵犯深度這三項，' +
          '才有辦法走 PSOGI 的保守路。沒有這三項就照 ASCRS／2025 共識做右半結腸切除。</b>');
        L.push('<b>另外 PSOGI 對非穿孔、無腹膜擴散的 GCA 不建議加做 CRS+HIPEC</b>' +
          '（R20，弱負向，共識 74.5%）；<b>但穿孔的 GCA 即使沒有腹膜擴散，' +
          '也可以考慮加 CRS+HIPEC</b>（R21，弱正向，共識 76.4%）。');
      } else {
        L.push(H('❗唯一的例外', '2025 共識 Block 2'));
        L.push('<b>「分化良好的黏液性腺癌、完全侷限於闌尾、切緣陰性、也沒有更遠病灶的顧慮」' +
          '可以不做右半結腸切除</b> —— 共識的理由是<b>「分化良好與部分中度分化的黏液性病灶，' +
          '淋巴結陽性率已被證明很低，右半結腸切除的存活效益跟著下降」</b>。');
        L.push('❗<b>但這個例外歐洲不同意，而且是強建議層級的不同意。</b>' + SUB([
          '<b>PSOGI R37 —— 非穿孔的黏液性腺癌、pT &lt; 4、pNx、cM0、R0、無殘留病灶 → ' +
            '「an adjuvant right sided hemicolectomy <u>should always be performed</u>」' +
            '（LoE Moderate、<b>強正向</b>、共識 83.6%）</b>',
          '<b>PSOGI R47.3 —— 以原發組織型看，mucinous adenocarcinoma <u>G1</u> 的右半結腸切除' +
            '也是強正向（共識 73.2%）</b>；G2 85.7%、G3 96.4%、含 signet ring 96.4%',
          '<b>PSOGI R38 —— 同樣情境要不要再加 CRS+HIPEC：弱正向（共識 58.2%，' +
            '是 PSOGI 這一段共識度最低的幾條之一）</b>']));
        L.push('<b>要走這個例外，請確認病理報告明確寫的是「well-differentiated（G1）mucinous ' +
          'adenocarcinoma」、切緣陰性、沒有穿孔、影像沒有腹膜病灶，並上多專科團隊討論。' +
          '任何一項不確定就做右半結腸切除。</b>');
        L.push('❗<b>穿孔的黏液性腺癌，PSOGI 是強正向要求在右半結腸切除之外加 CRS+HIPEC</b>' +
          '（R39，共識 61.8%）—— <b>穿孔這一項會把處置整個往上推一級。</b>');
      }
      L.push(H('女性病人要一併考慮的事', ''));
      L.push('<b>即使卵巢外觀正常，顯微轉移率仍有 17%</b>；' +
        '<b>停經後應強烈考慮雙側 salpingo-oophorectomy，停經前要先做生育諮詢。' +
        '詳見下方可展開的橫列。</b>');
      L.push(H('不要在這一格做術前化療', '2025 共識 Part 1 系統性治療節'));
      L.push('❗<b>「可切除、沒有腹膜侵犯」的闌尾腫瘤不建議做術前治療</b> —— ' +
        '共識原文：<b>目前沒有研究全面評估現代術前治療在這個情境的角色，' +
        '而專家共識不贊成，因為<u>會延遲根治性切除</u>。</b>' +
        '<b>這一格是先開刀，再依病理決定要不要輔助化療。</b>');
      extra = ovaryReference() + rxReference();

    } else if (S.extent === 'perit') {
      title = HISTO_LABEL[S.histo] + '、已有腹膜病灶<br>→ 不要為了摘除臨床正常的淋巴結而常規做右半結腸切除';
      L.push(H('❗這一格三份指引不同調，必須攤開來看', ''));
      L.push('<b>ASCRS 2025 第 13 條後半（強建議／低品質）：' +
        '「然而在腹膜擴散的情況下，右半結腸切除通常不帶來存活效益。」' +
        '本文寫得更明確：「In the setting of peritoneal metastases, <u>routine right hemicolectomy ' +
        'to remove clinically normal lymph nodes is not recommended</u>.」</b>');
      L.push('<b>但 2025 全國共識 Part 2 Block 2／Block 3 寫的是：' +
        '「Cytoreduction should include right hemicolectomy when the primary is adenocarcinoma.」</b>' +
        '—— <b>原發是腺癌時，減積手術應包含右半結腸切除。</b>');
      L.push('<b>PSOGI R40 也是強正向</b>：「黏液性腺癌、任何 pT、pNx、<b>pM1b</b>、R0 → ' +
        '<b>在 CRS 與 HIPEC 期間執行右半結腸切除，should always be performed</b>」' +
        '（LoE Moderate、強正向、共識 76.4%）。');
      L.push('<b>然而 PSOGI 自己的 R47 換成用「腹膜病灶的分級」來鎖定，答案就翻了：</b>' + SUB([
        '<b>無細胞黏液 → 強負向（共識 66.1%）</b>',
        '<b>低分級 PMP → 弱負向（共識 60.7%）</b>',
        '<b>高分級 PMP → 弱正向（共識 58.9%）</b>',
        '<b>高分級 PMP 併 signet ring cells → 強正向（共識 71.4%）</b>']));
      L.push('❗<b>差別在「鎖定什麼」：看原發的組織型（做）還是看腹膜病灶的分級（低分級不做）。' +
        '這一格請提多專科團隊討論，不要照單一指引決定。</b>');
      L.push(H('支持「不做」的實證', ''));
      L.push('<b>González-Moreno 與 Sugarbaker 的 501 例</b>（全部已有腹膜播種、' +
        '皆接受 CRS 加圍手術期腹腔化療，中位追蹤 4 年）：' + SUB([
        '<b>整體區域淋巴結陽性率只有 5.0%</b>',
        '<b>依病理型差異極大：腸型 66.7% vs 黏液型 <u>4.2%</u>（p &lt; 0.001）</b>',
        '<b>淋巴結轉移對預後無影響（p = 0.155）</b>',
        '<b>手術方式（單純闌尾切除 vs 右半結腸切除）單變項有影響（p &lt; 0.001），' +
          '多變項則無（p = 0.258）</b>',
        '作者建議：除切片證實闌尾或遠端 ileocolic 淋巴結轉移、或切緣不足，' +
          '否則應避免右半結腸切除（Br J Surg 2004;91:304-11，PMID 14991630）']));
      L.push(EV('另一支同題回溯（Foster JM, Am Surg 2012;78:171-7，PMID 22369825）：' +
        '120 例（闌尾切除 48／右半結腸切除 72）—— <b>右半結腸切除組 7% 淋巴結陽性、' +
        '闌尾切除組淋巴結失敗 0%；復發率 21% vs 28%（p = 0.12）、疾病致死 8% vs 22%（p = 0.27）。' +
        '邏吉斯回歸顯示手術方式對復發與死亡皆無影響，只有 optimal resection score 與體能狀態有影響。</b>'));
      L.push(EV('❗<b>但非黏液型的結論相反</b>：SEER 2004-2019 的 1,754 例分析中，' +
        '<b>非黏液型闌尾腺癌做右半結腸切除加淋巴結切除的癌症特異存活優於局部切除；' +
        '黏液型則沒有差別</b>（Aloysius M, Surgery 2023;174:759-765，PMID 37453862）。' +
        '<b>所以「不做」這件事主要適用於黏液型。</b>'));
      L.push(H('一個不在爭議範圍內的情況', 'ASCRS 2025'));
      L.push('<b>「為了達成完全減積本來就必須切右半結腸」的情況，那是減積的一部分，不在這個爭議裡</b> —— ' +
        'ASCRS 原文「a right hemicolectomy is sometimes necessary to achieve a complete ' +
        'cytoreduction of peritoneal disease originating from the appendix」。');
      L.push('<b>接下來請回步驟 1 選「已知有腹膜病灶」，走腹膜路徑決定減積、腹腔化療與全身治療的順序。</b>');
      extra = pciReference() + ovaryReference();

    } else if (S.extent === 'm1c') {
      cls = 'rec-nonop';
      title = HISTO_LABEL[S.histo] + '、已有腹膜以外的轉移（M1c）<br>→ 多數不是根治性手術的候選人';
      L.push(H('這一格的結論', '2025 共識 Part 1 Block 6（同意度 96%／99%）'));
      L.push('<b>「雖然在寡轉移的情況下不是切除的絕對禁忌，但診斷時就有腹膜以外擴散的闌尾腺癌' +
        '是不良預後指標，這樣的病人不太可能是根治性手術切除的候選人。」</b>');
      L.push('<b>共同決策下可以考慮：全身性化療、臨床試驗，或單純最佳支持療法。</b>');
      L.push('<b>建議多專科腫瘤照護，並考慮照會緩和醫療。</b>');
      L.push('<b>手術可以用在症狀控制。</b>');
      L.push('<b>依治療反應，病人可以再被重新評估要不要做 debulking 或更完整的減積手術。</b>');
      L.push(H('轉移路徑和大腸癌不一樣', '藥師實務手冊 ver.1 第十章 10.5'));
      L.push('<b>闌尾腫瘤「肝肺轉移較少、腹膜擴散較多」</b> —— ' +
        '這是它和結腸癌最大的行為差異，也是為什麼 M1c 反而是少數。');
      L.push('<b>手冊寫「M1c（腹腔外如肝、肺轉移）治療參照大腸癌指引」。</b>' +
        '2025 共識的處方骨架也是同一套：<b>靜脈 5-FU 加 leucovorin（或口服 capecitabine）為骨架，' +
        '加 oxaliplatin 或 irinotecan 成雙藥</b>；<b>沒有切除或切除不完全者可考慮加 bevacizumab</b>。' +
        '<b>但共識同時強調「有越來越多證據顯示闌尾癌的生物學與大腸直腸癌不同」，外推要保留。</b>');
      L.push('❗<b>加 bevacizumab 之前要先排除：即將發生腸阻塞或穿孔的風險、出血、動脈血栓</b> —— ' +
        '闌尾腫瘤合併大量腹膜病灶時腸阻塞風險本來就高，這一條特別要注意。');
      L.push('❗<b>健保在這一格特別卡</b>：條文一律只寫結腸直腸癌，闌尾未列名；' +
        '<b>三藥合併（FOLFOXIRI）在大腸直腸癌條文明文不予給付。詳見下方健保橫列。</b>');
      extra = rxReference() + nhiReference();
    }

    fill('ap_r_surg', cls, title, L,
      '2025 全國共識 Part 1 Block 2／6 與 Part 2 Block 2／3（PMID 40560498／40560501）；' +
      'ASCRS 2025 第 13 條（PMID 40262165）；PSOGI／EURACAN 2021 R18–R21、R37–R40、R47。' +
      '<b>台大癌委會無闌尾癌指引，本段全部為院外實證。</b>',
      extra);
  }

  /* 5d. 步驟 4：術後輔助全身治療 */
  function renderAdjRec() {
    var L = [], cls = 'rec-elective', title = '';

    if (S.pstage === 's3') {
      title = 'Stage III（至少一顆區域淋巴結陽性）<br>→ 建議術後輔助全身化療';
      L.push(H('主建議', '2025 共識 Part 1 Block 3（同意度 91%／98%）'));
      L.push('<b>Stage III 的闌尾腺癌（擴散到至少一顆區域淋巴結）應考慮術後輔助全身化療。</b>');
      L.push('<b>ASCRS 2025 第 16 條（強建議／低品質）：' +
        '「全身化療可能改善轉移性與淋巴結陽性疾病、HAMN、以及合併腹膜轉移的腺癌病人的存活。」</b>');
      L.push(H('要開什麼', '2025 共識系統性治療節'));
      L.push('<b>骨架是靜脈 5-FU 加 leucovorin（或口服 capecitabine）</b>，' +
        '<b>再加 oxaliplatin 或 irinotecan 組成雙藥</b>；' +
        '無法耐受雙藥者可用單藥。<b>就是大腸直腸癌那一套。</b>');
      L.push('<b>療程：一般 3–6 個月，目標 6 個月，依病人耐受度調整。</b>');
      L.push('❗<b>三藥（oxaliplatin 與 irinotecan 都加）毒性明顯較高，必須謹慎選擇病人；' +
        '而且在台灣健保條文明文不予給付（9.10.1(1)）。</b>');
      L.push(H('❗手冊第十章引的數字需要修正', ''));
      L.push('<b>藥師實務手冊 ver.1 第十章 10.4.1 寫「619 名 Stage II–III 闌尾癌病患…' +
        'Stage III 化療組 5 年 OS 77.1%、未化療 42.8%（p = 0.003）」。' +
        '這個數字本身是對的，但族群不是全部闌尾腺癌 —— 原文 619 例<u>全部是闌尾杯狀細胞腺癌／' +
        '杯狀細胞類癌</u></b>（Zakka K et al. Surg Oncol 2021;36:120-129，PMID 33360118，' +
        '標題就是 goblet cell carcinoid／goblet cell adenocarcinoma）。');
      L.push('<b>所以這個數字可以支持「杯狀細胞腺癌 Stage III 要做輔助化療」，' +
        '但把它當成整個闌尾腺癌 Stage III 的依據是過度推廣。' +
        '結論方向沒錯（2025 共識同樣建議 Stage III 做輔助化療），但引用時要標清楚族群。</b>');
      L.push(EV('原文完整數字（NCDB 2006-2015，病理分期 II–III 期闌尾 GCA 共 619 例）：' +
        '<b>II 期 512 例（82.7%）、III 期 107 例（17.3%）；輔助化療使用率 II 期 9.4%、III 期 47.7%。' +
        'II 期無益：多變項 HR 0.29（95% CI 0.04–2.12，p = 0.221），5 年 OS 96.9% vs 89.1%（p = 0.236）。' +
        'III 期有益：多變項 HR 0.25（95% CI 0.07–0.88，p = 0.031），5 年 OS 77.1% vs 42.8%（p = 0.003）。</b>' +
        '<b>結論是只有病理 III 期的 GCA 輔助化療與 OS 改善相關，II 期無。</b>'));
      L.push(EV('闌尾腺癌整體的資料：<b>有限的觀察性證據顯示輔助化療在淋巴結陽性、高分級、' +
        '和／或非黏液性疾病有效益；但也有研究顯示效益極小甚至有害。' +
        '共識指出不清楚這個差異有多少來自選擇偏差 —— 最可能接受輔助治療的，' +
        '本來就是體能夠好的那群人。</b>'));

    } else if (S.pstage === 's2h') {
      title = 'Stage II 但有高風險特徵<br>→ 可以考慮術後輔助全身化療';
      L.push(H('主建議', '2025 共識 Part 1 Block 3（同意度 91%／98%）'));
      L.push('<b>Stage II 而有任何高風險特徵的闌尾腺癌，術後應考慮輔助全身化療。</b>' +
        '處方與療程同 Stage III：<b>靜脈 5-FU 加 leucovorin（或口服 capecitabine）為骨架，' +
        '再加 oxaliplatin 或 irinotecan 組成雙藥，目標 6 個月</b>。');
      L.push(H('❗「高風險特徵」的內容 —— 而且兩組證據強度不同', '2025 共識系統性治療節'));
      L.push('<b>已在闌尾癌本身驗證過的高風險特徵</b>：' + SUB([
        '<b>淋巴結侵犯</b>', '<b>signet ring cells</b>',
        '<b>分化較差，或非黏液性組織型</b>']));
      L.push('<b>從大腸癌文獻外推、<u>尚未在闌尾癌世代驗證</u>的高風險特徵</b>：' + SUB([
        '<b>T4 腫瘤</b>', '<b>侵犯鄰近構造</b>',
        '<b>淋巴結取樣不足（inadequate lymph node yield）</b>', '<b>腫瘤穿孔</b>']));
      L.push('<b>共識自己把這兩組分開列，原文寫「High risk features have largely been extrapolated ' +
        'from colorectal cancer literature <u>without validation in appendiceal cohorts</u>」。' +
        '和病人討論時值得把這個差別講出來。</b>');
      L.push(H('為什麼要考慮', ''));
      L.push('<b>共識給的理由部分是機轉上的：生物行為差的腫瘤預期有較高的遠端擴散機率。</b>');
      L.push(EV('❗<b>反面的資料也要知道</b>：Zakka 的 512 例病理 II 期闌尾 GCA 中，' +
        '<b>輔助化療沒有效益（5 年 OS 96.9% vs 89.1%，p = 0.236；多變項 HR 0.29，p = 0.221）</b>。' +
        '另一篇 103 例的研究則顯示<b>「非低分級且非分化良好」的腫瘤在完整減積後接受輔助化療，' +
        '中位 OS 9.03 年 vs 未接受者 2.88 年（p = 0.02），而低分級癌接受化療對 OS 無益</b>' +
        '（ASCRS 2025 第 16 條引用）。<b>兩者一致指向：受益的是「高風險／高分級」那一群。</b>'));

    } else {
      cls = 'rec-nonop';
      title = (S.pstage === 's1' ? 'Stage I' : 'Stage II，沒有高風險特徵') +
        '<br>→ 只要追蹤，不做輔助全身化療';
      L.push(H('主建議', '2025 共識 Part 1 Block 4（同意度 96%／98%）'));
      L.push('<b>Stage I 與沒有高風險特徵的 Stage II 闌尾腺癌，切除後只要追蹤。' +
        '原文：完整切除後的低風險病灶「there is insufficient evidence to suggest that systemic ' +
        'chemotherapy is beneficial」。</b>');
      L.push('<b>ASCRS 2025 第 16 條後半也明文：' +
        '「Routine use of systemic chemotherapy for LAMNs or well-differentiated mucinous ' +
        'adenocarcinoma with peritoneal spread is not recommended.」</b>');
      L.push('❗<b>請先確認高風險特徵真的都沒有</b>（任一項就要改走上一格）：' + SUB([
        '<b>已在闌尾癌驗證的</b>：淋巴結侵犯、signet ring cells、分化較差或非黏液性組織',
        '<b>從大腸癌外推的</b>：T4、侵犯鄰近構造、<b>淋巴結取樣不足</b>、腫瘤穿孔']));
      L.push('❗<b>「淋巴結取樣不足」這一項要特別留意</b>：' +
        '<b>如果這次右半結腸切除摘到的淋巴結少於 12 顆，' +
        '那本身就是一項高風險特徵，不能當成「沒有高風險的 Stage II」。</b>');
      /* ⚠ 這是「不建議給」的敘述，藥名要用 NR() 包住，否則藥卡掃描會把它當成處方。 */
      L.push('<b>局限性、grade 1 的病灶（低度黏液性病灶或分化良好腺癌，以及 HAMN）' +
        '不建議給 ' + NR('5-FU') + ' 為基礎的化療</b> —— 共識原文「available studies indicate ' +
        'no benefit… so it is not recommended」。');
      L.push(EV('這一格的存活基準值可以拿來跟病人說明：' +
        '<b>非轉移性闌尾上皮性腫瘤最近的研究報告 5 年整體存活為' +
        '分化良好與中度分化的黏液性疾病 63–75%、非黏液性 60–70%</b>' +
        '（2025 共識 Part 1 背景節）。'));
    }

    fill('ap_r_adj', cls, title, L,
      '2025 全國共識 Part 1（PMID 40560498）Block 3／4 與系統性治療節；' +
      'ASCRS 2025 第 16 條（PMID 40262165）；Zakka K et al. Surg Oncol 2021（PMID 33360118）。' +
      '<b>台大癌委會無闌尾癌指引；藥師實務手冊 ver.1 第十章非台大癌委會文件。</b>',
      rxReference() + nhiReference());

    fu('ap_f_adeno', 'adeno');
  }

  /* ==========================================================
     6. 分支 B：腹膜病灶
     ========================================================== */
  function renderPerit() {
    show('ap_b_perit', true);
    show('ap_n_pgrade', true);
    if (!S.pgrade) return;
    show('ap_n_cc', true);
    if (!S.cc) return;

    var L = [], cls = 'rec-elective', title = '';
    var lowGrade = S.pgrade === 'acell' || S.pgrade === 'lg';
    var highGrade = S.pgrade === 'hg' || S.pgrade === 'src';
    var complete = S.cc === 'complete';

    L.push(H('先確認一件事：分級要看腹膜病理，不是原發', '2025 共識 Part 2 系統性治療節'));
    L.push('❗<b>「For appendiceal tumors with high-grade peritoneal disease histology, ' +
      'the grade of the primary does not affect management」</b> —— ' +
      '<b>即使原發與腹膜病灶嚴重不一致（例如 LAMN 配高分級腹膜病灶），也以腹膜病理為準。</b>');
    L.push('<b>反過來也成立</b>：<b>腹膜病灶是低分級、但原發有高風險特徵時，' +
      '輔助化療要照高分級原發的方式考慮。</b>');

    if (lowGrade && complete) {
      cls = 'rec-elective';
      title = PGRADE_LABEL[S.pgrade] + '、預計可完全減積<br>→ 做根治性減積加腹腔化療；原發是腺癌時併右半結腸切除';
      L.push(H('主建議', '2025 共識 Part 2 Block 3（同意度 96%／98%）'));
      L.push('<b>grade 1 疾病、預計可完全減積 → 應執行根治性減積手術與腹腔化療，' +
        '原發為腺癌時包含右半結腸切除。</b>' +
        '（❗右半結腸切除這一項與 ASCRS 2025 第 13 條不同調，見下方。）');
      L.push('<b>ASCRS 2025 第 14 條（強建議／中等品質）：' +
        '「CRS 適用於有腹膜侵犯的部分闌尾腫瘤病人。」' +
        '第 15 條（強建議／中等品質）：完整切除所有巨觀腹膜病灶後可給腹腔化療，' +
        '最常見的做法是與 CRS 同時進行的 HIPEC。</b>');
      L.push(H('❗這一格不要給全身化療', ''));
      L.push('<b>2025 共識：「Systemic chemotherapy has generally not been shown to improve ' +
        'outcomes in grade I disease.」只有原發有高風險或高分級特徵時才給。</b>');
      L.push('<b>PSOGI 講得更絕對</b>：' + SUB([
        '<b>R60 —— 低分級 PMP、術前分期判定可完全 CRS+HIPEC 者，' +
          '「there is no role for neoadjuvant chemotherapy and this <u>should never be considered</u>」' +
          '（<b>強負向</b>）</b>',
        '<b>R63 —— 低分級 PMP、已完成完全減積（CCR 0–1）與 HIPEC 者，' +
          '「there is no role for adjuvant chemotherapy and this <u>should never be considered</u>」' +
          '（<b>強負向</b>）</b>']));
      L.push('<b>ASCRS 2025 第 16 條同方向：LAMN 與分化良好的黏液性腺癌併腹膜擴散，' +
        '不建議常規使用全身化療。原文說 LAMN「generally shows minimal to no response to ' +
        'systemic chemotherapy」。</b>');
      L.push(H('可以拿來跟病人說明的存活數字', ''));
      L.push('<b>PSOGI 附屬 16 個專科中心、2,298 例闌尾來源 PMP 接受 CRS：' +
        '中位存活 196 個月（16.3 年）、中位無惡化存活 98 個月（8.2 年）、' +
        '10 年存活 63%、15 年存活 59%；治療相關死亡 2%、主要手術併發症 24%</b>' +
        '（Chua TC et al. J Clin Oncol 2012，PMID 22614976）。');
      L.push('❗<b>藥師實務手冊 ver.1 第十章 10.5 寫「CC-0 或 CC-1 …5 年存活率可達 59%」 —— ' +
        '原文的 59% 是<u>15 年</u>存活率，不是 5 年。</b>' +
        '<b>這個誤植會大幅低估減積手術的成效，術前說明請用原文數字。</b>');
      if (S.pgrade === 'acell') {
        L.push(H('無細胞黏液這一格有一個爭議', ''));
        L.push('❗<b>PSOGI R47.8：以腹膜病灶分級看，無細胞黏液的右半結腸切除是<u>強負向</u>' +
          '（共識 66.1%）。</b>而 2025 共識 Block 3 說原發是腺癌就要做。' +
          '<b>這一格的分歧最大，請提多專科團隊。</b>');
        L.push('<b>另外 AJCC 把腹腔內無細胞黏液（M1a）列為 Stage IVA 這件事有反面實證</b>：' +
          '<b>164 例中 M1a 64 例無人復發、僅 1 人死亡；M1b G1 100 例有 66% 復發、31% 死亡</b>' +
          '（PMID 36853519）。<b>M1a 的預後明顯好得多，分期上有 over-staging 之虞。</b>');
        L.push('<b>2025 共識 Block 2 對「右下腹侷限的無細胞黏液、而原發是腺癌」直接說沒有共識</b>：' +
          '「There is not adequate data nor consensus at this time to unilaterally recommend ' +
          'local resection only, more invasive CRS ± IPCT, or SCT… ' +
          '<b>however, it may be reasonable to consider observation if fully resected in the ' +
          'absence of high-risk tumor features.</b>」');
      }

    } else if (lowGrade && !complete) {
      title = PGRADE_LABEL[S.pgrade] + '、預計無法完全減積<br>→ 仍可考慮緩和性或暫時性的減積加腹腔化療';
      L.push(H('主建議', '2025 共識 Part 2 Block 2（同意度 83%／94%）'));
      L.push('<b>「In block 2, palliative or temporizing cytoreduction and IPCT should be considered ' +
        '<u>even if incomplete cytoreduction is predicted</u>.」</b>' +
        '—— <b>即使預計無法完全減積，緩和性或暫時性的減積加腹腔化療仍值得考慮。</b>');
      L.push('❗<b>這是 2025 共識 Part 2 裡第一輪同意度最低的一個 block（83%）</b>，' +
        '共識自己寫「A plan of care must be nuanced, based on the risk of peritoneal disease ' +
        'suggested by pathologic features and the patient’s surgical fitness and risk profile」。' +
        '<b>要個別化，不能照表操課。</b>');
      L.push('<b>減積時原發是腺癌就包含右半結腸切除</b>（同 Block 3；' +
        '❗與 ASCRS 2025 第 13 條不同調）。');
      L.push(H('PSOGI 對這一格給了三條可用的建議', ''));
      L.push('<b>R54 —— 不適合大手術、和／或病灶無法切除的闌尾 PMP 病人，' +
        '在專門中心做 maximal tumour debulking（MTD）可以考慮</b>（弱正向）。');
      L.push('<b>R56 —— 可手術、病灶可切除，但有高分級或 signet ring cell 等不良預後因子者，' +
        '「與其不計代價追求完整 CRS 與 HIPEC」，MTD 加 HIPEC 的併發症較低，可以考慮。</b>');
      L.push('<b>R55 —— 被排除在 CRS／HIPEC 之外而需要緩和手術時，手術範圍應' +
        '「as limited as possible to ameliorate symptoms」。</b>');
      L.push('<b>R57 —— 高風險、可手術性處於邊緣者，可以考慮「兩階段」或「延遲」的 CRS／HIPEC，' +
        '而不是一次做完</b>（弱正向）。');
      L.push('<b>ASCRS 2025 也提到：即使做到大體上完全減積，腹膜復發率仍有 7–37%；' +
        '再次減積可個案考慮，取決於組織型、無病間隔、復發負荷與體能狀態。</b>');
      L.push(H('全身化療在這一格', ''));
      L.push('<b>grade 1 疾病的全身化療一般沒有顯示能改善結果</b>；' +
        '<b>只有原發有高風險特徵（淋巴結侵犯、高分級或 signet ring cell 組織）時才給</b>。');
      L.push('<b>ASCRS 2025 第 16 條：無法切除的 LAMN 或不適合 CRS／HIPEC 的復發病灶可以用全身化療，' +
        '但「minimal benefit has been found in this subgroup」。</b>');

    } else if (highGrade && complete) {
      title = PGRADE_LABEL[S.pgrade] + '、預計可完全減積<br>→ 減積加腹腔化療與全身化療兩者都要做，而共識偏好先給化療';
      L.push(H('主建議', '2025 共識 Part 2 Block 4（同意度 88%／95%）'));
      L.push('<b>grade 2／3 的腹膜黏液性病灶，或任何 PMP 而原發是 grade 3 者：' +
        '若預計可完全減積，則 <u>CRS ± 腹腔化療與全身化療兩者都要進行</u>。' +
        '共識偏好「先給全身化療以評估疾病反應，再做計畫性的完整減積」，' +
        '但原文註明「although this is not universal」。</b>');
      L.push('<b>先給的理由寫得很清楚</b>：<b>「When complete cytoreduction is predicted, ' +
        'systemic chemotherapy is useful for assessing disease biology and response.」</b>' +
        '—— <b>用化療反應當生物行為的試紙。</b>');
      L.push(H('療程與銜接', '2025 共識 Part 2 Block 6（同意度 96%／98%）'));
      L.push('<b>化療後重新評估：仍可（或轉為可）完全減積 → 執行 CRS ± 腹腔化療。</b>');
      L.push('<b>總療程長度由熟悉此疾病的腫瘤內科醫師決定，多數情況建議 6 個月；' +
        '術前沒給完的，術後要補完。</b>');
      L.push('<b>PSOGI 同方向但語氣較弱</b>：<b>R61 —— 高分級 PMP（含併 signet ring cells）' +
        '術前化療「could be considered」（弱正向）；R64 —— 完整減積後的輔助化療' +
        '「could be considered」（弱正向）。</b>');
      L.push(H('這一格的實際數字', ''));
      L.push(EV('<b>一個前瞻試驗：34 例接受術前化療者中 50% 影像上疾病穩定或反應（並經術中所見確認），' +
        '其中 53%（9/17）的病理分級低於先前化療前的標本。</b>' +
        '整體看，術前化療組<b>PCI 較低（p = 0.0003）、需要的臟器切除較少（2.7 vs 4.4）、' +
        '達成完全減積的比例較高</b>；' +
        '<b>但圍手術期併發症（p = 0.16）與整體存活（37.2 vs 50.5 個月，p = 0.56）兩組無顯著差異。' +
        '只有在「達成病理完全或接近完全反應」的次群，存活明顯較好（p = 0.033）。</b>'));
      L.push(EV('<b>US HIPEC collaborative：高分級闌尾腫瘤合併腹膜侵犯的 5 年無病存活 23.2%、' +
        '整體存活 43.8%。</b>2025 共識 Part 2 背景節的分級存活：' +
        '<b>中度到分化差的疾病中位 OS 42–66 個月；' +
        '杯狀細胞腺癌併腹膜侵犯者 grade 1／2 為 98 個月、grade 3 為 33 個月。</b>'));
      if (S.pgrade === 'src') {
        L.push('❗<b>signet ring cells 是 PSOGI Table 6 的相對禁忌之一</b>：' +
          '<b>「侵襲性組織型（高分級 PMP 併 signet ring、含 signet ring 的黏液性腺癌、杯狀細胞癌）' +
          '且 PCI &gt; 20」有 87.5% 的專家列為相對禁忌。</b>' +
          '<b>請先算 PCI 再決定。</b>');
        L.push('<b>右半結腸切除在這一格是 PSOGI 唯一給強正向的腹膜分級</b>' +
          '（R47.11，高分級 PMP 併 signet ring cells，共識 71.4%）—— ' +
          '<b>三份指引在這一格意見反而一致。</b>');
      }

    } else if (highGrade && !complete) {
      cls = 'rec-urgent';
      title = PGRADE_LABEL[S.pgrade] + '、預計無法完全減積<br>→ 先給全身化療當 conversion therapy，評估反應之後再談手術';
      L.push(H('主建議', '2025 共識 Part 2 Block 5（同意度 93%／97%）'));
      L.push('<b>grade 2／3 的腹膜黏液性病灶而預計無法完全減積時 → ' +
        '化療要在前面做，並在進一步手術規劃之前評估反應。</b>');
      L.push('<b>共識明文把化療在這一格定位成 conversion therapy</b>：' +
        '<b>「when incomplete cytoreduction is predicted (high PCI or other anatomic factors), ' +
        'it is recommended as conversion therapy」。</b>');
      L.push(H('化療後的兩個出口', '2025 共識 Part 2 Block 6 與 Block 7'));
      L.push('<b>① 轉成預計可完全減積（或本來就可以）→ 執行 CRS ± 腹腔化療</b>' +
        '（Block 6，同意度 96%／98%）。<b>總療程多數建議 6 個月，術前沒給完術後補完。</b>');
      L.push('❗<b>② 化療後仍持續預計無法完全減積，或疾病明顯進展 → ' +
        '不應把 CRS ± 腹腔化療當成根治性治療提供給病人</b>（Block 7，同意度 93%／95%）。');
      L.push('<b>理由是數字</b>：<b>「Survival at three years after incomplete cytoreduction for ' +
        'high-grade malignancy is as low as 9%, and it is the consensus opinion that this is ' +
        'unlikely to justify the surgical risks for most patients.」</b>' +
        '—— <b>高分級不完全減積後的 3 年存活低到 9%。</b>');
      L.push('<b>這時候改走</b>：' + SUB([
        '<b>後線全身化療</b>', '<b>新藥或臨床試驗</b>', '<b>最佳支持療法</b>',
        '<b>治療過程中仍要定期回評，看有沒有轉成可減積</b>']));
      L.push('<b>但 debulking 不是完全沒有角色</b>：共識的系統性回顧顯示' +
        '<b>「在適合的手術病人，不論是作為終點治療或作為進一步手術／腹腔化療的橋接，' +
        'debulking 可能有存活或症狀控制的效益」</b>。' +
        '❗<b>要個別化衡量風險效益，而且必須明確告知病人這不是根治性治療。</b>');
      L.push('<b>PSOGI 對應的建議</b>：<b>R67 —— 高分級 PMP（含 signet ring）判定無法手術／無法切除、' +
        '但體能足以接受藥物治療者，緩和性全身治療可以考慮</b>（弱正向）。');

    } else { /* nonmuc */
      cls = 'rec-urgent';
      title = '非黏液性腹膜病灶<br>→ 先給全身化療；不建議直接開刀';
      L.push(H('主建議', '2025 共識 Part 2 Block 5 與 Block 8'));
      L.push('<b>Block 5（同意度 93%／97%）：非黏液性腹膜病灶 → ' +
        '化療要在前面做，並在進一步手術規劃之前評估反應。</b>');
      L.push('❗<b>Block 8（同意度 82%／91%）：「Upfront CRS ± IPCT is not preferred in non-mucinous ' +
        'peritoneal disease.」—— 非黏液性腹膜病灶不建議直接上減積手術。</b>' +
        '（這是 Part 2 第一輪同意度最低的一個 block。）');
      L.push('<b>但如果已經直接開了刀 → 「they should receive a full course of SCT postoperatively」，' +
        '術後要給完整一個療程的全身化療。</b>');
      L.push(H('為什麼態度不一樣', '2025 共識 Part 2 背景節'));
      L.push('<b>存活差很多</b>：<b>任何黏液性腫瘤合併腹膜侵犯的中位 OS 為 51–160 個月；' +
        '中度到分化差的疾病 42–66 個月；<u>非黏液性疾病只有 18.9–24 個月</u>。</b>');
      L.push('<b>化療後的處理同高分級</b>：轉成可完全減積 → 做 CRS ± 腹腔化療（Block 6）；' +
        '<b>仍不可完全減積或明顯進展 → 不應把 CRS ± 腹腔化療當根治治療</b>（Block 7，3 年存活低到 9%），' +
        '改走後線化療／臨床試驗／最佳支持療法。');
      L.push('<b>ASCRS 2025 第 13 條在非黏液型這一格反而支持較積極的原發手術</b>：' +
        'SEER 1,754 例顯示<b>非黏液型闌尾腺癌做右半結腸切除加淋巴結切除的癌症特異存活' +
        '優於局部切除，黏液型則否</b>（PMID 37453862）。' +
        '<b>但那是針對原發的淋巴結處理，不是針對腹膜病灶的減積時機。</b>');
    }

    /* 依這一格實際會開的藥列出處方 —— 藥卡由這一段的一般條列驅動，
       所以要用真的處方藥名（不加 NR），沒有要開的就不要寫。 */
    L.push(H('這一格實際要開什麼', ''));
    if (S.pgrade !== 'nonmuc') {
      L.push('<b>腹腔化療（HIPEC）的灌注藥：mitomycin 或 oxaliplatin</b> —— ' +
        '兩者的無病存活、整體存活與毒性相似，<b>oxaliplatin 的主要併發症與費用較高</b>；' +
        '血液毒性型態不同（<b>mitomycin 較多白血球低下、oxaliplatin 較多血小板低下</b>，' +
        '3／4 級不良事件無差異）。<b>劑量方案見下方可展開的橫列。</b>');
      L.push('❗<b>台灣唯一現行 mitomycin 藥證的「灌注使用」只寫膀胱，腹腔內灌注屬藥證外</b>：' +
        '藥費原則不給付，只能走支付標準第 12 條第 1 項第 4 款的特殊病例個案事前審查。');
    }
    if (lowGrade) {
      L.push('❗<b>這一格<u>不</u>給全身化療</b>：grade 1 疾病的全身化療沒有顯示能改善結果，' +
        'PSOGI R60（術前）與 R63（輔助）都是<b>強負向</b>。' +
        '<b>只有在原發有高風險特徵（淋巴結侵犯、高分級或 signet ring cell 組織）時，' +
        '才照高分級原發的方式考慮輔助化療。</b>');
    } else {
      L.push('<b>全身化療的骨架：靜脈 5-FU 加 leucovorin（或口服 capecitabine），' +
        '再加 oxaliplatin 或 irinotecan 組成雙藥；無法耐受者可用單藥。' +
        '總療程多數建議 6 個月。</b>');
      L.push('❗<b>三藥（oxaliplatin 與 irinotecan 都加）毒性明顯較高，必須謹慎選擇病人；' +
        '而且在台灣健保條文明文不予給付（9.10.1(1)）。</b>');
      L.push('<b>沒有切除或切除不完全者可以考慮加 bevacizumab</b>；' +
        '❗<b>但要先排除即將發生腸阻塞或穿孔的風險、出血、動脈血栓</b> —— ' +
        '這一格的病人腸阻塞風險本來就高。');
    }
    L.push(H('女性病人一定要一併決定的事', ''));
    L.push('<b>接受 CRS／HIPEC 的女性中 55% 有卵巢受累，雙側外觀正常者仍有 17% 顯微受累；' +
      '單側巨觀轉移時，對側外觀正常卵巢有 45% 顯微受累。</b>' +
      '<b>停經後應強烈考慮雙側 salpingo-oophorectomy；停經前要先做生育諮詢與卵子保存的討論。</b>' +
      '詳見下方可展開的橫列。');
    L.push(H('❗台灣的現實：這一整段沒有健保', ''));
    L.push('<b>HIPEC 與非婦科的 CRS／腹膜剝除在 6,010 個現行診療項目中查無，只能自費</b>' +
      '（衛生局核定的例子：馬偕 10 萬元／次、花蓮慈濟 45,000／65,000 元）。' +
      '<b>HIPEC 灌注用的 ' + NR('mitomycin') + ' 在台灣的藥證「灌注使用」只寫膀胱，屬藥證外使用。</b>' +
      '<b>術前一定要把費用講清楚，這是決定要不要轉診的現實因素。詳見下方健保橫列。</b>');

    fill('ap_r_perit', cls, title, L,
      '2025 全國共識 Part 2（Ann Surg Oncol 2025;33:5176-5203，PMID 40560501）Block 1–9；' +
      'ASCRS 2025 第 13–16 條（PMID 40262165）；PSOGI／EURACAN 2021 R44–R67；' +
      'Chua TC et al. J Clin Oncol 2012（PMID 22614976）。' +
      '<b>台大癌委會無闌尾癌指引，本段全部為院外實證。</b>',
      pciReference() + hipecReference() + ovaryReference() + rxReference() + nhiReference());

    fu('ap_f_perit', 'perit');
  }

  /* ==========================================================
     7. 分支 C：闌尾 NET
     ========================================================== */
  function netFeatReference() {
    return fold('<b>❗闌尾 NET 的「不良特徵」清單</b>（ASCRS 2025 第 7 條逐項）',
      '<table>' +
      '<tr><td colspan="2"><b>任一項成立就算「有不良特徵」。</b>' +
      'ASCRS 2025 第 7 條為強建議／低品質證據。</td></tr>' +
      '<tr><td><b>位置</b></td><td><b>腫瘤長在<u>闌尾基部</u></b>（多數闌尾 NET 長在闌尾尖端）—— ' +
      'ASCRS 明文：<b>基部腫瘤或切除後切緣陽性者，通常應接受右半結腸切除加區域淋巴結廓清。</b></td></tr>' +
      '<tr><td><b>切緣</b></td><td><b>切緣陽性</b></td></tr>' +
      '<tr><td><b>侵犯深度</b></td><td><b>mesoappendix 侵犯 &gt; 3 mm</b></td></tr>' +
      '<tr><td><b>血管淋巴管侵犯</b></td><td><b>lymphovascular invasion。' +
      '即使腫瘤 &lt; 2 cm，LVI 也是獨立的轉移危險因子。</b></td></tr>' +
      '<tr><td><b>分級</b></td><td><b>G2（Ki-67 3–20%）；Ki-67 &gt; 3%；' +
      '每高倍視野 &gt; 2 個 mitosis</b></td></tr>' +
      '<tr><td><b>組織型</b></td><td><b>GCC（杯狀細胞）組織型</b>' +
      '—— 這一項本身就會把病人推到腺癌路徑。</td></tr>' +
      '<tr><td>❗<b>PSOGI 用的門檻更嚴</b></td>' +
      '<td>PSOGI／EURACAN 2021 R16／R17 把「不必做右半結腸切除」限縮到<b>同時符合五項</b>：' +
      '<b>腫瘤 &lt; 10 mm、切緣乾淨、mesoappendix 侵犯 &lt; 3 mm、無血管或神經侵犯、' +
      'Ki-67 &lt; 2%</b>，且無 PMP。<br>' +
      '<b>R16：全部符合 → 「there is no role for a right-sided hemicolectomy and this ' +
      '<u>should never be considered</u>」（LoE Moderate、強負向、共識 89.1%）。</b><br>' +
      '<b>R17：偏離其中任一項 → 「a right-sided hemicolectomy could be considered」' +
      '（LoE Moderate、弱正向、共識 87.3%）。</b><br>' +
      '→ <b>PSOGI 的 Ki-67 門檻是 2%，ASCRS 是 3%；PSOGI 的大小門檻是 10 mm，' +
      'ASCRS 的免手術門檻是 1 cm 但 1–2 cm 允許個案判斷。</b></td></tr>' +
      '<tr><td>❗<b>還有第三個門檻</b></td><td>ASCRS 引一個 435 例的大型系列：' +
      '<b>腫瘤大小切點 &gt; 1.5 cm 獨立與淋巴結轉移相關。</b>' +
      '<b>所以文獻裡同時存在 1 cm、1.5 cm、2 cm 三個門檻，' +
      '這也是 1–2 cm 這一格至今有爭議的原因。</b></td></tr>' +
      '</table>');
  }

  function renderNet() {
    show('ap_b_net', true);
    show('ap_n_nsize', true);
    if (!S.nsize) return;

    var needFeat = S.nsize !== 'gt2';
    if (needFeat) {
      show('ap_n_nfeat', true);
      if (!S.nfeat) return;
    }

    var L = [], cls = 'rec-elective', title = '';
    var hasFeat = S.nfeat === 'yes';

    L.push(H('術前評估先做齊', 'ASCRS 2025 第 4–6 條'));
    L.push('<b>第 4 條（強建議／低品質）：病史與理學檢查（含 review of systems）、' +
      '<u>大腸鏡</u>、胸腹骨盆 CT 或 MRI。</b>' +
      '<b>大腸鏡的理由是同時性非 NET 病灶最多可達 22%。</b>' +
      '<b>MRI 在分期、手術規劃與結果上優於 CT</b>（CT 與超音波相較於術中所見與最終病理的' +
      '準確率分別只有 40% 與 25.5%）。');
    L.push('<b>第 5 條（條件建議／中等品質）：NET 專屬影像（Ga-DOTA PET/CT）' +
      '<u>只在三種情況才考慮</u> —— 病灶 &gt; 2 cm、有 carcinoid syndrome 症狀、' +
      '或其他影像對轉移的判讀不確定。</b>' +
      '<b>不是每個闌尾 NET 都要做，要平衡檢查費用。</b>');
    L.push('<b>第 6 條（強建議／中等品質）：治療前<u>不常規做</u>生化檢查。</b>' +
      '<b>闌尾 NET 一般不具生化活性，除非有大量肝轉移或直接的體循環引流。' +
      'CgA 與 24 小時尿 5-HIAA 對早期轉移的敏感度與特異度都差，' +
      '初診時不應常規檢驗；有影像證實轉移時可做基線值供日後監測。</b>');
    L.push(EV('闌尾 NET 很少有同時性病灶或遠端轉移（與小腸 NET 相比）；' +
      '<b>carcinoid syndrome 的症狀（flushing、diarrhea）雖然罕見，' +
      '但一出現就可能代表有轉移或同時性病灶，會改變治療策略。</b>'));

    L.push(H('❗這一格的原則', 'ASCRS 2025 第 7 條（強建議／低品質）'));
    L.push('<b>「Extent of surgical resection of appendiceal NETs is determined by tumor size ' +
      'and histologic features.」—— 手術範圍由腫瘤大小與組織特徵共同決定，不是只看大小。</b>');

    if (S.nsize === 'gt2') {
      cls = 'rec-elective';
      title = '闌尾 NET &gt; 2 cm<br>→ 右半結腸切除加區域淋巴結廓清';
      L.push('<b>&gt; 2 cm 的闌尾 NET 需要右半結腸切除，因為<u>淋巴結轉移率可達 40%</u>。</b>');
      L.push('<b>這一格三份指引一致，沒有爭議。</b>' +
        'PSOGI R17 對「偏離 &lt; 10 mm 等五項條件」者也給弱正向的右半結腸切除建議。');
      L.push('<b>術前也要做 Ga-DOTA PET/CT</b>（第 5 條把「病灶 &gt; 2 cm」列為適應症之一）。');
      L.push(EV('原始實證是 Moertel CG et al. N Engl J Med 1987;317:1699-701（PMID 3696178）：' +
        '150 例未經篩選的闌尾 carcinoid，<b>轉移發生率 —— &lt; 2.0 cm 者 0/127；' +
        '≥ 2.0 但 &lt; 3.0 cm 者 3/14；≥ 3.0 cm 者 4/9</b>。' +
        '該文結論：<b>&lt; 2.0 cm 局限者單純闌尾切除即足；右半結腸切除只在年輕、≥ 2.0 cm 且' +
        '手術風險低者才合理；血管侵犯與 mesoappendix 侵犯偏向更根除性手術。</b>' +
        '❗<b>這篇是 1987 年的，但它就是 2 cm 門檻的來源。</b>'));

    } else if (hasFeat) {
      cls = 'rec-elective';
      title = '闌尾 NET ' + (S.nsize === 'lt1' ? '&lt; 1 cm' : '1–2 cm') +
        '，有不良特徵<br>→ 建議右半結腸切除加區域淋巴結廓清';
      L.push('<b>有任一項不良特徵時建議做右半結腸切除加區域淋巴結廓清。' +
        '不良特徵的完整清單見下方可展開的橫列 —— 請逐項對照病理報告。</b>');
      L.push('<b>其中兩項 ASCRS 講得最直接</b>：' +
        '<b>「patients with tumors present at the base of the appendix or those who have undergone ' +
        'resection with a positive margin should <u>typically undergo right hemicolectomy with ' +
        'regional lymphadenectomy</u>」</b> —— <b>基部腫瘤與切緣陽性這兩項，' +
        '不論大小都建議做右半結腸切除。</b>');
      L.push('<b>其餘不良特徵（mesoappendix 侵犯 &gt; 3 mm、LVI、G2／Ki-67 &gt; 3%、' +
        '&gt; 2 mitoses/HPF、GCC 組織型）則是「個案判斷」</b>：' +
        'ASCRS 原文「<b>Decision-making for right hemicolectomy in small- and intermediate-sized ' +
        'appendiceal NETs should be made on an individual basis, with consideration given to ' +
        'histologic features and patient comorbidities and preferences, in a multidisciplinary ' +
        'setting.</b>」—— <b>要把共病與病人意願一起放進來，並在多專科場合決定。</b>');
      L.push('❗<b>如果組織型是 GCC（杯狀細胞），請改走腺癌路徑</b> —— ' +
        'ASCRS 2025 第 13 條把 GCA 與「混合神經內分泌與上皮腺癌特徵」的腫瘤' +
        '一併納入右半結腸切除的建議，2025 全國共識也把 GCA 放在腺癌路徑。');
      if (S.nsize === 'lt1') {
        L.push(EV('❗<b>&lt; 1 cm 而有不良特徵是很少見的組合</b>，' +
          '<b>請先確認病理報告的量測與 Ki-67 是否可靠，並考慮專家病理複閱</b>。' +
          '若只有 Ki-67 落在 2–3% 之間，注意 PSOGI 用 2%、ASCRS 用 3%，這一格兩套指引會給不同答案。'));
      }

    } else if (S.nsize === 'lt1') {
      cls = 'rec-nonop';
      title = '闌尾 NET &lt; 1 cm，無不良特徵<br>→ 闌尾切除加完整切除 mesoappendix 就夠了';
      L.push('<b>ASCRS 2025 第 7 條：「Lesions &lt; 1 cm in diameter and without unfavorable ' +
        'features are adequately treated with an appendectomy and removal of the entire ' +
        'mesoappendix. <u>Long-term disease-free survival in these patients is 100%.</u>」</b>');
      L.push('<b>注意手術範圍寫的是「闌尾切除<u>加完整切除 mesoappendix</u>」，不是單純闌尾切除。</b>');
      L.push('<b>PSOGI R16 更絕對</b>：<b>腫瘤 &lt; 10 mm、切緣乾淨、mesoappendix 侵犯 &lt; 3 mm、' +
        '無血管或神經侵犯、Ki-67 &lt; 2%、無 PMP → 「there is no role for a right-sided ' +
        'hemicolectomy and this <u>should never be considered</u>」' +
        '（LoE Moderate、強負向、共識 89.1%）。</b>');
      L.push('❗<b>唯一要再確認的是 Ki-67 的門檻</b>：' +
        '<b>PSOGI 要求 &lt; 2%，ASCRS 的不良特徵清單寫的是 &gt; 3%。' +
        '落在 2–3% 之間時兩套指引會給不同答案，這一格請提多專科團隊。</b>');
      L.push('<b>追蹤也可以相對寬鬆</b>：ASCRS 第 8 條是「選擇性」追蹤，依大小與組織特徵決定。');

    } else {
      cls = 'rec-elective';
      title = '闌尾 NET 1–2 cm，無不良特徵<br>→ 可以只做闌尾切除，但這一格有爭議，要個案決定';
      L.push('❗<b>ASCRS 2025 明文承認這一格有爭議</b>：' +
        '<b>「controversy remains in the surgical management of appendiceal NETs measuring ' +
        '1 to 2 cm in size」。</b>');
      L.push('<b>沒有不良特徵時，可以只做闌尾切除加完整切除 mesoappendix</b>；' +
        '<b>但決定要不要補做右半結腸切除必須「個案判斷，把組織特徵、病人共病與意願一起考慮，' +
        '並在多專科場合決定」。</b>');
      L.push('<b>支持只做闌尾切除的實證（NCDB，916 例 1–2 cm 闌尾 carcinoid）</b>：' + SUB([
        '原發切除 42%（385 例）vs 右半結腸切除加區域淋巴結切除 58%（531 例）',
        '<b>切緣陽性率 5.5% vs 4.5%（p = 0.60）</b>',
        '<b>1 年／5 年存活：原發切除 98.1%／88.7% vs 右半結腸切除 96.7%／87.4%（p = 0.52）</b>',
        '<b>中／高分級或 anaplastic 者：93.3%／72.0% vs 92.3%／71.9%（p = 0.78）</b>',
        '<b>Cox 校正後右半結腸切除無存活益處（HR 1.14，p = 0.72）</b>',
        '作者主張 &lt; 2 cm 者原發切除已足（Nussbaum DP, J Am Coll Surg 2015;220:894-903，' +
          'PMID 25840530）']));
      L.push('❗<b>反方向的門檻</b>：ASCRS 引一個 435 例系列，' +
        '<b>大小切點 &gt; 1.5 cm 獨立與淋巴結轉移相關</b>。' +
        '<b>所以 1–2 cm 之中，1.5–2 cm 這一段風險比 1–1.5 cm 高。' +
        '如果腫瘤是 1.8 cm 而不是 1.1 cm，這件事值得放進討論。</b>');
      L.push('❗<b>兒少族群的資料方向相反，而且結局全好</b>：' +
        '<b>德國 MET 前瞻登錄 1997–2022 共 662 例（中位年齡 13.3 歲，中位追蹤 2.2 年）—— ' +
        '無一例遠端轉移；淋巴血管侵犯與淋巴結轉移確實與腫瘤 ≥ 1.5 cm 相關，' +
        '依 ENETS 屬高風險者佔 27.0%，其中只有 55.9% 接受補行右半結腸切除；' +
        '<u>但不論只做闌尾切除或補做右半結腸切除，皆無遠端轉移、無復發、無疾病死亡，' +
        '整體與無事件存活均 100%</u></b>（Kuhlen M, Eur J Surg Oncol 2024;50:108051，' +
        'PMID 38430702）。<b>兒少病人不要照成人門檻積極。</b>');
      L.push('<b>PSOGI 在這一格傾向積極</b>：R17 —— 只要偏離「&lt; 10 mm 等五項」中的任一項' +
        '（1–2 cm 已經偏離大小那一項），<b>右半結腸切除「could be considered」' +
        '（弱正向、共識 87.3%）</b>。<b>歐洲的門檻是 10 mm，不是 2 cm。</b>');
    }

    L.push(H('❗台灣的用藥入口在哪裡', '查詢日 2026-08-17'));
    L.push('<b>這一格（局限性闌尾 NET，切除後）不需要任何藥物治療。' +
      '藥物只在無法切除或已轉移時才進場，而那不是本分支要決定的事 —— ' +
      '請改看「神經內分泌腫瘤 NET」分頁。</b>');
    /* ⚠ 以下藥名一律用 NR() 包住：這一段講的是「台灣有沒有入口」，
       而本分支的病人是局限性、切除後，完全不需要藥。不可讓它驅動藥卡。 */
    L.push('<b>先知道有哪些入口就好</b>：轉移或無法切除時，健保條文文義套得進去的有三個 —— ' +
      '<b>' + NR('octreotide') + ' 長效型（5.4.4.3「晚期間腸 midgut NET」—— 闌尾為中腸衍生）、' +
      NR('lanreotide') + '（5.4.6.3「胃、腸、胰 GEP-NET」）、' +
      NR('everolimus') + '（9.36.1.3「胃腸道來源之非功能性 NET」）。</b>' +
      '<b>條文全文見下方可展開的橫列。</b>');
    L.push('❗<b>' + NR('sunitinib') + ' 的條文與許可證都只寫「胰臟」神經內分泌腫瘤，' +
      '闌尾 NET 完全沒有入口</b> —— 這是四個 NET 用藥中唯一連文義都套不進去的。');
    L.push('❗<b>PRRT（177Lu-DOTATATE）在《藥品給付規定》與《支付標準》均查無，完全沒有健保。</b>');
    L.push('❗<b>一個自相矛盾的地方</b>：<b>' + NR('lanreotide') + ' 條文要求非功能性患者' +
      '「須附 6 個月內 somatostatin-receptor 陽性報告」，' +
      '但支付標準核醫項目查無 Ga-68 DOTATATE PET 或 In-111 octreoscan 的給付代碼</b> —— ' +
      '<b>條文要求的檢查本身沒有對應給付項目。詳見下方健保橫列。</b>');

    fill('ap_r_net', cls, title, L,
      'ASCRS 2025 第 4–8 條（Dis Colon Rectum 2025;68:815-834，PMID 40262165）；' +
      'PSOGI／EURACAN 2021 R16／R17；ENETS 2023 guidance（J Neuroendocrinol 2023;35:e13332，' +
      'PMID 37682701 —— ⚠ 該文摘要不含任何大小門檻數字，本頁的門檻一律標 ASCRS 2025 的條文）；' +
      'Moertel CG, N Engl J Med 1987（PMID 3696178）；Nussbaum DP, J Am Coll Surg 2015（PMID 25840530）；' +
      'Kuhlen M, Eur J Surg Oncol 2024（PMID 38430702）。' +
      '<b>台大癌委會無闌尾癌指引，本段全部為院外實證。</b>',
      netFeatReference() + nhiNetReference());

    fu('ap_f_net', 'net');
  }

  /* ==========================================================
     8. 分支 D：全身治療、分子與健保
     ========================================================== */
  function renderSys() {
    show('ap_b_sys', true);
    show('ap_n_sysq', true);
    if (!S.sysq) return;

    var L = [], cls = 'rec-elective', title = '', extra = '';

    if (S.sysq === 'timing') {
      title = '化療的時機與療程<br>→ 由「有沒有腹膜病灶」與「腹膜病灶的分級」決定';
      L.push(H('先分三種情境', '2025 共識 Part 1／Part 2 系統性治療節'));
      L.push('<b>① 可切除、沒有腹膜病灶 → 先開刀，再依病理決定要不要輔助化療。' +
        '<u>不建議做術前化療</u></b>，共識的理由是「會延遲根治性切除」，' +
        '而且「至今沒有研究全面評估現代術前治療在這個情境的角色」。');
      L.push('<b>② 低分級腹膜病灶 → 通常不需細胞毒性治療。可切除就做根治性切除，' +
        '不可切除可考慮緩和性減積。</b><b>「no evidence currently supports their use for improved ' +
        'disease control or survival」</b>；細胞毒性治療只能放在臨床試驗或以症狀控制為目標的' +
        '照護路徑裡。<b>但原發若有高風險特徵，仍要照高分級原發考慮輔助化療。</b>');
      L.push('<b>③ 高分級腹膜病灶 → 在嘗試減積之前先給化療；無法減積時化療就是根治性治療。</b>' +
        '<b>預計可完全減積 → 化療用來評估疾病生物行為與反應；' +
        '預計不完全減積（高 PCI 或解剖因素）→ 化療定位為 conversion therapy。</b>');
      L.push(H('療程長度與重新評估', ''));
      L.push('<b>配合根治性手術的處方一般設計為 3–6 個月，目標 6 個月</b>；' +
        '<b>總療程由熟悉此疾病的腫瘤內科醫師決定，多數建議 6 個月，術前沒給完術後補完。</b>');
      L.push('<b>用來探查疾病生物行為或嘗試轉換成可切除時，一般每 3 個月重新評估一次。</b>');
      L.push('❗<b>圍手術期分段給的方案研究顯示病人比較難完成</b>（相較於全部術前給完），' +
        '<b>但手術必須提前時值得考慮。</b>');
      L.push('<b>減積不完全、或術前療程沒給完 → 要考慮術後補化療。</b>');
      L.push(H('要開什麼', ''));
      L.push('<b>靜脈 5-FU 加 leucovorin 為骨架，較少用口服 capecitabine。' +
        '雙藥加 oxaliplatin 或 irinotecan；三藥兩者都加；無法耐受者可用單藥。</b>');
      L.push('❗<b>只有小型回溯研究，沒有證據顯示哪一種比較好，' +
        '但三藥毒性明顯較高，必須謹慎選擇病人</b>；' +
        '<b>而且三藥合併在台灣健保條文明文不予給付（9.10.1(1)）。</b>');
      L.push('<b>抗 VEGF（bevacizumab）在多數會考慮全身治療的情境都可以考慮</b>，' +
        '尤其是<b>沒有切除或切除不完全</b>者。' +
        '❗<b>應避免的情況：即將發生腸阻塞或穿孔的風險、出血、動脈血栓</b> —— ' +
        '闌尾腫瘤病人常有腹膜大量病灶與腸阻塞風險，這一條特別要注意。');
      L.push('❗<b>抗 EGFR 在闌尾癌的角色有爭議</b>：' +
        '<b>存活效益不明確，而且有研究對 RAS 突變者的存活提出變差的顧慮 —— ' +
        '而闌尾癌 KRAS 突變率 &gt; 70%。</b>');
      extra = rxReference() + nhiReference();

    } else if (S.sysq === 'mol') {
      title = '分子檢測<br>→ 轉移性疾病都要送 NGS；但闌尾癌的突變譜和大腸癌不一樣';
      L.push(H('誰要驗', '2025 共識 Part 1 分子節'));
      L.push('<b>「As with most solid tumors, <u>all patients with metastatic disease should receive ' +
        'next generation sequencing</u> for molecular profiling with an accepted next generation ' +
        'sequencing panel to identify potential molecular targets.」</b>');
      L.push('<b>優先送組織</b>：<b>「When possible, tissue should be sent for tumor molecular ' +
        'profiling; circulating (blood) profiling may not be as sensitive.」</b>' +
        '—— <b>血液的檢測敏感度可能不如組織。</b>');
      L.push('<b>2025 共識 Part 2 Block 1：非低分級的疾病，' +
        '應在基線考慮驗 ctDNA 以供日後追蹤使用。</b>' +
        '❗<b>但 ASCRS 提醒闌尾腫瘤的 ctDNA 敏感度比其他轉移性胃腸道腫瘤低。</b>');
      L.push(H('❗闌尾癌的突變譜和大腸癌明顯不同', ''));
      L.push('<b>四個最常見的突變：KRAS（&gt; 70%）、GNAS（50–70%）、TP53（最高 40%）、' +
        'APC（最高 20%）。</b>');
      L.push('<b>差別在哪：大腸直腸癌的 APC 與 TP53 突變率是 70–80%，闌尾癌明顯偏低。' +
        'GNAS 則是闌尾癌特有的高頻突變。</b>' +
        '<b>MSI-H 與 MMR 缺失在闌尾癌相對少見，只有約 6%。</b>');
      L.push(H('❗基因型會影響化療反應', ''));
      L.push('<b>「Patients with GNAS-mutation predominant disease are much less likely to have a ' +
        'disease response to chemotherapy, while as many as 50% of patients with RAS-mutation ' +
        'predominant disease may respond.」</b>' +
        '—— <b>GNAS 為主的疾病對化療反應差；RAS 為主的可能有多達 50% 反應。</b>');
      L.push('<b>另有證據支持在 RAS 原生型的病灶優先用含 irinotecan 的處方。</b>');
      L.push(H('驗到之後能怎麼用', ''));
      L.push('<b>共識明說標靶與分子治療在闌尾腫瘤的角色「not well-defined」，' +
        '大多還是從大腸直腸癌與其他胃腸道癌外推，闌尾癌本身沒有做過標靶的隨機試驗。</b>');
      L.push('<b>NCCN 把闌尾癌與大腸直腸癌的建議並列，可用的方向</b>：' + SUB([
        '<b>BRAF V600E → 抗 EGFR 加抗 BRAF 併用</b>',
        '<b>MMR 缺失／MSI-H → 抗 PD-1，或抗 PD-1 加抗 CTLA-4 併用</b>（❗盛行率只有 6%）',
        '<b>NTRK 融合 → larotrectinib</b>（❗這是台灣健保唯一寫出「闌尾癌」的條文）']));
      L.push('<b>一個值得注意的新方向</b>：<b>一個 16 人的試驗在無法切除、以低分級黏液性闌尾腺癌' +
        '為主的病人使用抗 PD-1（atezolizumab）加抗 VEGF（bevacizumab）—— ' +
        '100% 達到疾病控制，PFS 18 個月，相較於 5-FU 為基礎處方的 3 個月。</b>' +
        '❗<b>但這只有 16 人，而且台灣沒有這個適應症的健保。</b>');
      L.push(H('胚系檢測', ''));
      L.push('<b>闌尾腫瘤病人的胚系變異偵測率接近 10–12%（含遺傳性癌症症候群相關者）</b>，' +
        '<b>但共識明說「these variants may be incidental to disease biology and the relevance to ' +
        'therapeutic management is unknown」</b>。' +
        '<b>可以考慮驗，要把個人的家族癌症史一起納入判斷。</b>');
      extra = nhiReference();

    } else {
      cls = 'rec-urgent';
      title = '健保<br>→ 整份藥品給付規定只有一條寫「闌尾癌」；HIPEC 完全沒有給付';
      L.push(H('❗最重要的兩件事', '查詢日 2026-08-17'));
      L.push('<b>① HIPEC 與非婦科的 CRS／腹膜剝除完全沒有健保給付項目。</b>' +
        '<b>6,010 個現行診療項目逐筆檢索查無；「減積」二字只出現在 80418B 婦癌減積手術一項。' +
        '只能以衛生局核定的自費項目收費</b>（馬偕 10 萬元／次、花蓮慈濟 45,000／65,000 元）。');
      L.push('<b>② 整份 115.4.23 版《藥品給付規定》410 頁逐字檢索「闌尾」只有 2 筆命中，' +
        '全部在 9.95 ' + NR('larotrectinib') + ' 第 3(12) 項</b>' +
        '（限 NTRK 融合陽性、至少一線全身治療失敗後；<b>驗到 NTRK 融合時的用藥請看' +
        '「分子檢測」那一格</b>）。<b>「杯狀」與「假黏液」兩詞 0 筆命中。</b>');
      L.push(H('不能理所當然認為「大腸直腸癌」含闌尾', ''));
      L.push('<b>9.95 同一條把「(2) 大腸直腸癌」與「(12) 闌尾癌」列成兩個並列、互不包含的癌別；' +
        '26072B／26073B 正子造影的適應症也只列「大腸癌、直腸癌」。' +
        '健保條文的寫法是把闌尾癌當獨立部位在列舉。</b>');
      L.push('❗<b>查不到就不推測</b>：健保署網站、全國法規資料庫與公開搜尋都查不到任何函釋或' +
        '公告明文說「闌尾癌得比照大腸直腸癌之給付規定申報」。<b>健保沒有給出書面答案。</b>');
      L.push('<b>實務上只有兩條路</b>：<b>①病名以結腸癌歸類申報</b>' +
        '（技術基礎是 ICD-10-CM 的 C18.1 闌尾隸屬 C18 結腸類目，但這不代表審查會接受）；' +
        '<b>②走支付標準第 12 條第 1 項第 4 款的特殊病例個案事前審查</b>（要 7 份文件，三週內核定）。');
      L.push(H('順序陷阱（會改變用藥先後的）', ''));
      /* ⚠ 這一整格是健保條文的討論，依版面規則「不掃健保條文那一段」，
         藥名一律用 NR() 包住，否則它幾乎會把整本藥典的卡都叫出來。
         真正要開什麼請看「化療的時機與療程」那一格。 */
      L.push('<b>三藥合併不給付</b>：9.10.1(1)「治療轉移性結腸直腸癌，惟若再加用 ' +
        NR('irinotecan') + ' 則不予給付」—— ' +
        '<b>FOLFOXIRI／FOLFIRINOX 在大腸直腸癌（含要比照的闌尾癌）是死路。</b>');
      L.push('<b>完整減積之後反而被卡</b>：115/2/1 新增 —— <b>' + NR('cetuximab') + ' 與 ' +
        NR('panitumumab') + ' 同時規定「經手術完全切除（R0 切除）且查無轉移病灶者不得申請給付」。' +
        '闌尾癌做完 CC-0 減積且影像查無殘留的病人正好被擋。</b>');
      L.push('<b>抗 EGFR 一輩子只有一次</b>：兩藥僅能擇一、都不得與 ' + NR('bevacizumab') + ' 併用、' +
        '併用 encorafenib 之後不得再申請任何抗 EGFR。');
      L.push('<b>' + NR('bevacizumab') + ' 第二線要求「未曾接受過 ' + NR('bevacizumab') + ' 治療」</b> —— ' +
        '第一線用過就走不到第二線那一條。');
      L.push(H('缺口清單', ''));
      L.push('<b>MSI-H／dMMR 免疫治療</b>：9.69.1(11) 只寫「大腸直腸癌（CRC）」，' +
        '<b>沒有泛癌別條文，闌尾癌沒有入口。</b>');
      L.push('<b>HIPEC 灌注用的 ' + NR('mitomycin') + '</b>：台灣唯一現行藥證的' +
        '「灌注使用」只寫膀胱，<b>腹腔灌注屬藥證外</b>。');
      L.push('<b>NET 用藥</b>：' + NR('octreotide') + ' 長效型、' + NR('lanreotide') + '、' +
        NR('everolimus') + ' 的條文文義涵蓋得到闌尾；' +
        '<b>' + NR('sunitinib') + ' 只寫胰臟，完全沒有入口；PRRT 完全沒有健保。</b>');
      L.push('<b>正子造影 26072B／26073B</b>：適應症只列「大腸癌、直腸癌」，闌尾癌未列名。');
      L.push('<b>somatostatin receptor 影像</b>：' + NR('lanreotide') + ' 條文要求非功能性者附' +
        '「6 個月內 somatostatin-receptor 陽性報告」，<b>但該檢查本身沒有對應給付代碼。</b>');
      extra = nhiReference() + nhiNetReference();
    }

    fill('ap_r_sys', cls, title, L,
      '2025 全國共識 Part 1 系統性治療與分子節、Part 2 Block 1（PMID 40560498／40560501）；' +
      'ASCRS 2025 第 9、10、16 條（PMID 40262165）；' +
      '《全民健康保險藥品給付規定》115.4.23 版與《醫療服務給付項目及支付標準》' +
      '（健保署開放資料，資料更新日 2026-08-12）；食藥署藥品許可證開放資料集。查詢日 2026-08-17。',
      extra);
  }

  /* ==========================================================
     9. 最下方一：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('轉移性疾病一律要送 NGS', '2025 全國共識 Part 1 分子節'));
    L.push('<b>「all patients with metastatic disease should receive next generation sequencing ' +
      'for molecular profiling with an accepted next generation sequencing panel」。' +
      '優先送組織，血液檢測的敏感度可能不如組織。</b>');
    L.push('<b>非低分級的疾病，基線就應考慮驗 ctDNA 供日後追蹤使用</b>（Part 2 Block 1）；' +
      '❗<b>但闌尾腫瘤的 ctDNA 敏感度比其他轉移性胃腸道腫瘤低。</b>');
    L.push(H('❗闌尾癌的突變譜和大腸癌不一樣，這會改變預期', ''));
    L.push('<b>KRAS &gt; 70%、GNAS 50–70%、TP53 最高 40%、APC 最高 20%</b>；' +
      '<b>大腸直腸癌的 APC 與 TP53 是 70–80%，闌尾癌明顯偏低，GNAS 則是闌尾癌特有的高頻突變。</b>');
    L.push('<b>MSI-H 與 MMR 缺失只有約 6%</b> —— <b>不要預期免疫治療的機會像大腸癌那麼多。</b>');
    L.push('<b>基因型會影響化療反應</b>：<b>GNAS 為主的疾病對化療反應差；' +
      'RAS 為主的可能有多達 50% 反應</b>；另有證據支持<b>RAS 原生型優先用含 irinotecan 的處方</b>。');
    L.push(H('驗到之後在台灣能不能拿到藥', '查詢日 2026-08-17'));
    L.push('<b>NTRK 融合 → larotrectinib。這是整份健保《藥品給付規定》唯一寫出「闌尾癌」' +
      '三個字的條文（9.95.3(12)）</b>：「先前曾接受過至少一次全身性治療失敗，又有疾病惡化，' +
      '無法手術切除或轉移的闌尾癌。」<b>需事前審查、每次療程 12 週為限、' +
      '初次須附 NTRK 融合檢測報告並符合通則十二。</b>');
    L.push('❗<b>MSI-H／dMMR 驗到了也沒有健保入口</b>：9.69.1(11) 的條文明文限' +
      '「大腸直腸癌（CRC）」，沒有泛癌別（tumour-agnostic）條文。');
    L.push('❗<b>BRAF V600E 的抗 EGFR 加抗 BRAF 併用，闌尾癌不在條文內</b>，' +
      '而且共識本身對抗 EGFR 在闌尾癌持保留態度（RAS 突變者存活可能更差，' +
      '而闌尾癌 KRAS 突變率 &gt; 70%）。');
    L.push(H('胚系檢測', ''));
    L.push('<b>偵測率接近 10–12%（含遺傳性癌症症候群相關變異）</b>，' +
      '<b>但共識明說這些變異可能與疾病生物學無關，對治療管理的意義不明。</b>' +
      '<b>可以考慮驗，並把個人與家族癌症史一起納入判斷；驗到致病性變異時照會遺傳諮詢。</b>');
    L.push(EV('❗<b>2025 全國共識沒有給胚系檢測獨立的強度標記</b>，' +
      'Part 1 Block 1 的原文是「germline testing may be considered in conjunction with family ' +
      'cancer history <b>for research purposes and assessment of hereditary cancer risk</b>」——' +
      '也就是說它的定位偏向研究與風險評估，不是治療決策。'));

    return '<div class="bc-gene-h">要不要驗基因？闌尾癌的答案是「轉移性一律要驗，但要先知道拿不拿得到藥」' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     10. 最下方二：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'ap-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('ap_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }

  function renderDrugCards() {
    var box = el('ap_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('apPath');
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
    AP_DRUGS.forEach(function (d) {
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
      '禁忌、健保給付規定、剝半磨粉）。<b>徽章標明該藥「用於闌尾癌時」在台灣的健保與藥證狀態 —— ' +
      '不是該藥整體的給付狀態。</b></div>' +
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
     11. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope === 'path') renderPath();
    else if (S.scope === 'perit') renderPerit();
    else if (S.scope === 'net') renderNet();
    else if (S.scope === 'sys') renderSys();
    renderDrugCards();
  }


  /* ==========================================================
     9. 互動
     ========================================================== */
  var SEL_GROUPS = ['ap_n1', 'ap_n_histo', 'ap_n_mucin', 'ap_n_extent', 'ap_n_pstage',
    'ap_n_pgrade', 'ap_n_cc', 'ap_n_nsize', 'ap_n_nfeat', 'ap_n_sysq'];

  var DOWNSTREAM = {
    scope: ['histo', 'mucin', 'extent', 'pstage', 'pgrade', 'cc', 'nsize', 'nfeat', 'sysq'],
    histo: ['mucin', 'extent', 'pstage'],
    extent: ['pstage'],
    pgrade: ['cc'],
    nsize: ['nfeat']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function apPick(key, val, btn) {
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
      ['ap_n1', 'scope'], ['ap_n_histo', 'histo'], ['ap_n_mucin', 'mucin'],
      ['ap_n_extent', 'extent'], ['ap_n_pstage', 'pstage'], ['ap_n_pgrade', 'pgrade'],
      ['ap_n_cc', 'cc'], ['ap_n_nsize', 'nsize'], ['ap_n_nfeat', 'nfeat'], ['ap_n_sysq', 'sysq']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /apPick\('([a-z]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function apReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }

  function initAppendixPathway() { apReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。 */
  global.appendixPathwayHTML = appendixPathwayHTML;
  global.initAppendixPathway = initAppendixPathway;
  global.apPick = apPick;
  global.apReset = apReset;
})(window);
