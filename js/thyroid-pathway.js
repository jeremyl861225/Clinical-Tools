/* ============================================================
   甲狀腺癌治療互動決策流程 Thyroid Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-09-13 打掉重做。舊版 839 行是舊世代寫法（無收合、無下游歸零表、無藥卡、
   無基因段），而且**分化型還停在 ATA 2015**。

   ⚠ 台大醫院沒有甲狀腺癌診療指引（本輪三重確認）：
     ① 癌症防治中心 15 個 MDT 團隊名單沒有甲狀腺／內分泌；
     ② workspace/guidelines/ 33 份院內 PDF 沒有甲狀腺；
     ③ **頭頸癌診療指引全文「甲狀腺」0 次、「thyroid」0 次** —— 沒有藏在頭頸癌裡。
   台灣也沒有全國學會版：國健署《癌症診療品質保證措施準則》是要求「各醫院自行建立
   臨床診療指引」，所以是各院各一份。**本頁因此不掛台大名義。**
   ❗搜尋引擎會把 tmuh.org.tw 的《甲狀腺癌診療指引》標成「台大醫院」——那是**北醫體系**
   （臺北癌症中心），而且其 115 年版（2026）內文仍自述「按 2015 ATA 及 2019 NCCN」。

   來源（依組織型態分屬三份不同指引）：
     · DTC：**ATA 2025**（Ringel MD, Sosa JA et al. Thyroid 2025;35(8):841-985，PMID 40844370）
       ⚠ 正式標題**不含 thyroid nodules**（結節已拆成姊妹指引）；
       ⚠ DOI 是 **10.1177/10507256251363120**（Thyroid 已改由 SAGE 發行，不是 10.1089）；
       ⚠ 有勘誤 **PMID 41182278**（Table 8 列名改為「Follicular Carcinoma and IEFVPTC」）。
       84 條建議、modified GRADE、病理用 WHO 第 5 版、分期用 AJCC 第 8 版、文獻截止 2024-07-01。
     · MTC：ATA 2015（Wells SA Jr et al. Thyroid 2015;25:567-610，PMID 25810047）——**仍是現行版**
       （PubMed 三種檢索式與 ATA 官網指引頁皆確認 2015 之後無新版）。
     · ATC：ATA 2021（Bible KC et al. Thyroid 2021;31:337-386，PMID 33728999）
       ⚠ 有勘誤：GPS 4 刪除 MOST，只留 **POLST**；PMC 版全文仍是未更正的舊文字。
     · 分期：AJCC 第 8 版（Tuttle RM et al. Thyroid 2017;27:751-756，PMID 28463585）

   ❗本輪對抗式查核推翻了三個常見說法，本頁一律用更正後的寫法：
     ① **不是「葉切切點 1 cm 放寬到 2 cm」** —— ATA 2015 Rec 35B 早就允許 >1 cm 到 <4 cm
        的低風險 DTC 做葉切（Strong）。真正改變的是「**應直接做葉切**」的強建議門檻由
        <1 cm 上移到 ≤2 cm；葉切可用的上限**兩版都是 4 cm**。「>1 cm 一律全切」是 2006／2009 的立場。
     ② **預防性中央區廓清不是翻轉** —— ATA 2015 Rec 36(C) 已是 Strong／Moderate 的
        「不做預防性中央區廓清是適當的」，2025 Rec 19(A) 只是改成反面句型，**強度與證據等級未變**。
        唯一實質差異：2025 的 19(B) 把 2015 列的 cN1b 拿掉，並把 should 降為 may。
     ③ **ATA 2021 ATC 有 Gy／fraction 數字** —— 但全部在「術語定義節與文獻回顧」，
        **沒有任何一條編號 Recommendation 帶 Gy**（Rec 14／15／17 只寫 standard fractionation IMRT）。
        另 checkpoint 的試驗證據是 spartalizumab，但 **Figure 2 流程圖點名 pembrolizumab 當代表藥**。

   ⚠ 舊版的一個真正錯誤已修正：舊版把髓質癌的 calcitonin doubling time 做成
     「<6 月／6–24 月／>24 月」三段式**決策**步驟。實際上 ATA 2015 那三段是引用
     Barbet 2005 的**存活率資料**，不是處置門檻；指引真正的決策門檻只有一個：
     **doubling time > 2 年**（Rec 53）。

   健保與藥證查詢日：**2026-09-13**。四個卡點：
     · **rhTSH（Thyrogen）有藥證但健保藥品支付價已歸零**；健保走的是**診療項目 26074C**
       「碘-131 癌症追蹤檢查-施打 Thyrogen」19,475 點，**且限「復發或轉移」或「不適合停 T4」**——
       而**藥證適應症反而限「沒有轉移性甲狀腺癌跡象的病人」**，兩者涵蓋的族群正好相反。
     · **cabozantinib 的健保與藥證都只寫分化型**，髓質癌與未分化癌都沒有；
       髓質癌專用的 Cometriq 膠囊**台灣沒有藥證**。
     · **selpercatinib／pralsetinib 有藥證但健保 0 筆**（連健保藥品代號都沒有）。
     · ❗**驗得到、用不到**：BRAF 檢測 30107B 明文含甲狀腺癌、NGS 附表也有甲狀腺癌的
       BRAF V600E／RET fusion 與髓質癌 RET mutation 兩列，**但 9.91 dabrafenib＋trametinib
       沒有甲狀腺適應症**。

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
    'histo',   // dtc | mtc | atc
    'dstage',  // DTC 現在要決定什麼：init | postop | fu | rair
    'dsize',   // DTC 初次：t1a | le2 | t2 | big
    'dhisto',  // DTC 術後：ptc | ftc
    'drisk',   // DTC 術後風險：low | lowint | inthigh | high
    'dtx',     // DTC 追蹤：hemi | ttnorai | ttrai
    'dresp',   // DTC 治療反應：exc | ind | bioinc | strinc
    'dmol',    // RAIR 分子：braf | ret | ntrk | none | pending
    'mstage',  // MTC：preop | postop | adv
    'mctn',    // MTC 術前 calcitonin：lt20 | c20 | c200 | gt500
    'mpost',   // MTC 術後 calcitonin：und | lt150 | gt150
    'madv',    // MTC 進展性：stable | prog
    'astage',  // ATC：iva | ivb_res | ivb_unres | ivc
    'abraf'    // ATC BRAF：pos | neg | pending
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-09-13 對 data/drugs/ 逐碼實跑核對）
     ⚠ 徽章寫的是「這個藥用於甲狀腺癌時在台灣的藥證與健保狀態」，
       不是該藥整體的給付狀態。
     ⚠ 只出現在「用不到／沒有入口」敘述裡的藥一律用 NR() 包住，不列卡。
     ========================================================== */
  var TH_DRUGS = [
    { key: 'lenvatinib', cards: [['17', 'LEN4CEP5', 'Lenvima 樂衛瑪膠囊 4 mg', 'lenvatinib']],
      flag: '健保 9.63.1 分化型、放射碘難治' },
    { key: 'sorafenib', cards: [['17', 'NEX4CE10', 'Nexavar 蕾莎瓦膜衣錠 200 mg', 'sorafenib']],
      flag: '健保 9.34.3 分化型、放射碘難治' },
    { key: 'cabozantinib', cards: [['17', 'CAB4CES5', 'Cabometyx 癌必定膜衣錠 20 mg', 'cabozantinib']],
      flag: '❗健保 9.74.2 只寫分化型；每日限 1 粒' },
    { key: 'vandetanib', cards: [['17', 'CAP4CEY9', 'Caprelsa 佳瑞莎膜衣錠 100 mg', 'vandetanib']],
      flag: '健保 9.86 唯一給付髓質癌者' },
    { key: 'selpercatinib', cards: [['17', 'RET4CG28', 'Retsevmo 銳癌寧膠囊 40 mg', 'selpercatinib']],
      flag: '❗有藥證、健保 0 筆（全自費）' },
    { key: 'pralsetinib', cards: [['17', 'GAV4CEV5', 'Gavreto 普吉華膠囊 100 mg', 'pralsetinib']],
      flag: '❗有藥證、健保 0 筆；台灣適應症無 RET 突變髓質癌' },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib']],
      flag: '健保 9.95.3(5) 明列甲狀腺癌' },
    { key: 'dabrafenib', cards: [['17', 'DAB4CEE5', 'Tafinlar 泰伏樂膠囊 75 mg', 'dabrafenib']],
      flag: '❗健保 9.91 無甲狀腺適應症' },
    { key: 'trametinib', cards: [['17', 'MEK4CEQ8', 'Mekinist 麥欣霓膜衣錠 2 mg', 'trametinib']],
      flag: '❗健保 9.91 無甲狀腺適應症' },
    { key: 'levothyroxine',
      cards: [['12', 'ELT4LC06', 'Eltroxin 昂特欣錠 100 mcg', 'levothyroxine sodium'],
              ['12', 'LEV1LC15', 'Levothyroxine 注射（台大處方集無正式中文品名）', 'levothyroxine sodium']],
      flag: '❗藥證只寫「甲狀腺機能減退症」，抑制療法屬仿單外' },
    { key: 'thyrotropin', re: 'thyrotropin|rhTSH|Thyrogen',
      cards: [['12', 'THY1LC12', 'Thyrogen 適諾進凍晶注射劑 1.1 mg', 'thyrotropin alfa']],
      flag: '❗藥品支付價已歸零；走診療項目 26074C 且限復發／轉移' },
    { key: 'paclitaxel', cards: [['17', 'PHY1CC03', 'Paclitaxel 輝克癒蘇注射劑', 'paclitaxel']] },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑', 'docetaxel']] },
    { key: 'carboplatin', cards: [['17', 'KEM1CA32', 'Kemocarb 爾定康靜脈注射液 150 mg', 'carboplatin']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg', 'cisplatin']] },
    { key: 'doxorubicin', cards: [['17', 'ADR1CD04', 'Adriamycin 艾黴素注射劑', 'doxorubicin']] },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg', 'pembrolizumab']],
      flag: '❗健保 9.69 無甲狀腺癌適應症' }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="thPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="ty-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts, extra) {
    return '<div class="ty-node" id="' + id + '">' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div>' + (extra || '') + '</div></div>';
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
  function more() {
    var parts = [].slice.call(arguments).filter(Boolean);
    if (!parts.length) return '';
    return '<ul class="rec-detail rec-more"><li>' + parts.join('</li><li>') + '</li></ul>';
  }

  /* ==========================================================
     2. 共用參考區塊（同一件事只寫一次，其他地方指過來）
     ========================================================== */

  /* 2a. ATA 2025 的分級制度 —— 讀每一條建議之前要先懂 */
  function gradeReference() {
    return fold('<b>ATA 2025 的建議強度怎麼讀</b>（modified GRADE；84 條建議）',
      '<table>' +
      '<tr><td><b>Strong</b></td><td>「applicable to <b>all or nearly all</b> persons or situations」 —— ' +
      '效益明顯大於風險，且至少有 moderate certainty。<b>全文 32 條。</b></td></tr>' +
      '<tr><td><b>Conditional</b></td><td>「applicable to <b>most</b> people or situations, though ' +
      'other courses of action <b>might be appropriate in certain circumstances</b>」。<b>全文 50 條。</b></td></tr>' +
      '<tr><td>❗<b>Good Practice<br>Statement（GPS）</b></td>' +
      '<td>證據太少而**不給 GRADE 分級**，但地位「like a strong recommendation」 —— ' +
      '逐字：<b>「not following a GPS would be considered <u>outside of usual clinical practice</u>」</b>。' +
      '<b>而且每一條 GPS 都要求委員會<u>全體一致同意</u>。</b><b>全文 59 條。</b><br>' +
      '→ <b>看到 GPS 不要當成「弱建議」，它比 Conditional 更硬。</b></td></tr>' +
      '<tr><td>證據等級</td><td>high／moderate／low／very low；證據不足者標 <b>insufficient</b> 並列為 ' +
      '<b>No recommendation</b>。表註：<b>「Strong recommendations are only indicated when certainty ' +
      'is low or very low in <u>limited circumstances</u>」</b>。</td></tr>' +
      '<tr><td>版本注意</td><td>文獻檢索截止 <b>2024-07-01</b>（唯一例外是納入 2025 年 WHO 分類）；' +
      '病理用 <b>WHO 第 5 版</b>；分期用 <b>AJCC 第 8 版</b>（全文 0 次提及第 9 版）。<br>' +
      '❗<b>有勘誤（PMID 41182278）</b>：Table 8 的列名改為「Follicular Carcinoma <b>and IEFVPTC</b>」。</td></tr>' +
      '</table>');
  }

  /* 2b. ⭐ ATA 2025 Figure 2 四級復發風險分層 —— 本頁最重要的一張表 */
  function riskReference() {
    var head = '<tr><td><b>層級</b></td><td><b>PTC 與其亞型</b></td>' +
      '<td><b>FTC／IEFVPTC 與 OTC</b>（兩欄內容相同）</td></tr>';
    return fold('<b>⭐ ATA 2025 四級復發風險分層的完整判定準則</b>（Figure 2 逐格）',
      '<table>' +
      '<tr><td colspan="3">❗<b>這張表在指引裡只存在於 Figure 2 的點陣圖中</b>，PDF 文字層只有圖說，' +
      '正文各風險因子小節只回顧證據、不指派級別。<b>本頁的內容經三重核對</b>：' +
      '① 原生嵌入圖（1267×966）逐格判讀；② 四個級別名稱與百分比在正文 Definitions 段有獨立文字出處；' +
      '③ 兩篇開放取用評論文（PMC12602013 Table 1、PMC13341181 Table 1）以文字表格重製，逐項一致。</td></tr>' +
      '<tr><td colspan="3">❗<b>指引自己的命名不一致</b>：Definitions 段寫 <b>intermediate-high</b>，' +
      'RAI 段寫 <b>high-intermediate</b>，兩篇評論文也各用一種。<b>指的是同一層。</b></td></tr>' +
      head +
      '<tr><td><b>HIGH<br>&gt; 30%</b></td>' +
      '<td colspan="2"><b>T3a ＋ microscopic ETE、T3b 或 T4；或<u>任何 T</u> 只要有下列任一：</b><br>' +
      '<b>PTC 欄</b>：Poorly differentiated or high grade／<b>Gross incomplete resection (R2)</b>／' +
      'cN1 ≥ 3 cm／Extranodal extension (ENE)／Distant metastasis (M1)<br>' +
      '<b>FTC／OTC 欄</b>：Poorly differentiated or high grade／<b>Widely invasive</b>／' +
      '<b>Encapsulated angioinvasive：extensive vascular invasion ≥ 4 vessels</b>／' +
      'cN1 ≥ 3 cm／Extranodal extension (ENE)／Distant metastasis (M1)<br>' +
      '❗<b>差別</b>：R2 只列在 PTC 欄；widely invasive 與 ≥ 4 條血管侵犯只列在 FTC／OTC 欄。</td></tr>' +
      '<tr><td><b>INTERMEDIATE-HIGH<br>≥ 16–30%</b></td>' +
      '<td><b>T1、T2 或 T3a 只要有下列任一：</b><br>' +
      '· Bilateral multifocality &gt; 1 cm<br>' +
      '· Clinically evident lateral LN mets (cN1b) &lt; 3 cm<br>' +
      '· <b>2 項以上的 low-intermediate 風險因子</b><br>' +
      '· Aggressive histology<br>· Vascular invasion</td>' +
      '<td><b>T1、T2 或 T3a 只要有下列任一：</b><br>' +
      '· Clinically evident lateral LN mets (cN1b) &lt; 3 cm<br>' +
      '· <b>2 項以上的 low-intermediate 風險因子</b><br>' +
      '❗<b>沒有</b> bilateral multifocality、aggressive histology、vascular invasion 這三列。</td></tr>' +
      '<tr><td><b>LOW-INTERMEDIATE<br>10–15%</b></td>' +
      '<td><b>T3a；或 T1／T2 只要有下列任一：</b><br>' +
      '· <b>Unilateral</b> multifocality<br>· Microscopic ETE<br>' +
      '· cN1a 或 pN1a &gt; 2 mm，或 &gt; 5 顆淋巴結<br>' +
      '· 切緣陰性，或僅 microscopic ＋ <b>posterior</b> margin (R1)</td>' +
      '<td><b>T3a；或 T1／T2 只要有下列任一：</b><br>' +
      '· Microscopic ETE<br>· <b>Limited vascular invasion &lt; 4 vessels</b><br>' +
      '· cN1a 或 pN1a &gt; 2 mm，或 &gt; 5 顆淋巴結<br>' +
      '· 切緣陰性，或僅 microscopic ＋ <b>posterior</b> margin (R1)<br>' +
      '❗<b>沒有</b> unilateral multifocality 這一列。</td></tr>' +
      '<tr><td><b>LOW<br>&lt; 10%</b></td>' +
      '<td><b>T1 與 T2（≤ 4 cm）：</b><br>· <b>Unifocal</b><br>' +
      '· pN0a，或 cN0 且 pN1a（≤ 5 顆且全部 ≤ 2 mm）<br>' +
      '· 切緣陰性，或僅 microscopic ＋ <b>anterior</b> margin (R1)</td>' +
      '<td><b>T1 與 T2（≤ 4 cm）：</b><br>' +
      '· <b>Minimally invasive：只有 capsular invasion</b><br>' +
      '· pN0a，或 cN0 且 pN1a（≤ 5 顆且全部 ≤ 2 mm）<br>' +
      '· 切緣陰性，或僅 microscopic ＋ <b>anterior</b> margin (R1)</td></tr>' +
      '<tr><td colspan="3">❗<b>兩個最容易看漏的細節</b><br>' +
      '① <b>切緣的前後位置會改變級別</b>：同樣是 microscopic 陽性切緣（R1），' +
      '<b>anterior 落在 LOW、posterior 落在 LOW-INTERMEDIATE</b>。<br>' +
      '② <b>血管侵犯的條數是硬門檻</b>：FTC／OTC 的 <b>&lt; 4 條 → LOW-INTERMEDIATE、' +
      '≥ 4 條 → HIGH</b>，中間沒有其他級別。</td></tr>' +
      '<tr><td colspan="3"><b>圖例逐字</b>：PTC＝Papillary Thyroid Carcinoma；' +
      'FTC／IEFVPTC＝Follicular Thyroid Carcinoma／Invasive Encapsulated Follicular Variant of ' +
      'Papillary Thyroid Carcinoma；OTC＝Oncocytic Thyroid Carcinoma；Φ＝WHO 2022 definition。<br>' +
      '圖註 * 逐字：<b>「No clear cutoffs for LNs between low-intermediate and high-intermediate ' +
      'risk groups. In general, smaller size and fewer lymph node metastases are associated with ' +
      'lower risk of recurrence.」</b>—— <b>淋巴結那一條的切點指引自己承認沒有定清楚。</b><br>' +
      '圖註 ** 逐字：<b>「LN mets are uncommon in OTC and FTC/IEFVPTC」</b>。</td></tr>' +
      '<tr><td colspan="3"><b>這套分層怎麼用</b>（RECOMMENDATION 28）<br>' +
      'A：<b>「The 2025 ATA Risk Stratification System… is recommended to determine the risk of ' +
      'structural disease persistence/recurrence」（Strong, Moderate certainty）</b> —— ' +
      '它要和 <b>AJCC 分期、術後影像、Tg 與 TgAb</b> 合併判讀，不是單獨使用。<br>' +
      'B：<b>術後組織的分子檢測「not recommended routinely」（Conditional, Low certainty）</b>；' +
      '但若已經有資料，可以拿來進一步修正風險估計。<br>' +
      '❗<b>2009 與 2015 版是三層，2025 才改成四層</b> —— 舊病歷上的「中度風險」和這裡的兩個中間層不能直接對應。</td></tr>' +
      '</table>');
  }

  /* 2c. RAI 適應症與劑量（ATA 2025 Rec 32 + Table 10 + Rec 34） */
  function raiReference() {
    return fold('<b>放射碘（RAI）的適應症、劑量與準備方式</b>（ATA 2025 Rec 32／34、Table 10）',
      '<table>' +
      '<tr><td colspan="2"><b>RECOMMENDATION 32 —— 誰要給</b></td></tr>' +
      '<tr><td><b>Low</b></td><td><b>「Remnant ablation is <u>not recommended routinely</u> after total ' +
      'thyroidectomy for patients with ATA low-risk DTC.」（Strong recommendation, <u>High</u> certainty evidence）</b><br>' +
      '❗<b>這是全文少數 High certainty 的條文之一，語氣比一般的「可考慮不給」強得多。</b></td></tr>' +
      '<tr><td><b>Low-intermediate<br>與 Intermediate-high</b></td>' +
      '<td><b>「RAI adjuvant therapy <u>may be considered</u>…」（Conditional recommendation, Low certainty evidence）</b></td></tr>' +
      '<tr><td><b>High</b></td><td><b>「RAI adjuvant therapy <u>is recommended routinely</u>…」' +
      '（Strong recommendation, Moderate certainty evidence）</b></td></tr>' +
      '<tr><td><b>遠端轉移</b></td><td><b>「…RAI therapy is recommended routinely after total ' +
      'thyroidectomy.」（Strong recommendation, Moderate certainty evidence）</b></td></tr>' +
      '<tr><td colspan="2"><b>Table 10 —— 給多少（逐字）</b></td></tr>' +
      '<tr><td>Low</td><td>典型建議 <b>No</b>；活度 <b>1.1–1.85 GBq（30–50 mCi）</b>；目標：無，或 remnant ablation</td></tr>' +
      '<tr><td>Intermediate-low<br>與 intermediate-high</td><td>典型建議 <b>Consider</b>；' +
      '活度 <b>1.1–3.7 GBq（30–100 mCi）</b>；目標：remnant ablation ± adjuvant therapy</td></tr>' +
      '<tr><td>High</td><td>典型建議 <b>Yes</b>；活度 <b>3.7–5.55 GBq（100–150 mCi）</b>；' +
      '目標：remnant ablation 與 adjuvant therapy</td></tr>' +
      '<tr><td>遠端轉移</td><td>典型建議 <b>Yes</b>；活度 <b>3.7–7.4 GBq（100–200 mCi）</b>，' +
      '或考慮 dosimetry；目標：治療已知病灶與 remnant ablation</td></tr>' +
      '<tr><td colspan="2">表註：<b>「the final recommendation for administered activity should be based ' +
      'on <u>multidisciplinary</u> management recommendations」</b>。</td></tr>' +
      '<tr><td colspan="2"><b>RECOMMENDATION 34 —— 怎麼準備（本版最大的轉向之一）</b></td></tr>' +
      '<tr><td>❗<b>A</b></td><td><b>「In patients with DTC in whom RAI remnant ablation or adjuvant ' +
      'therapy is planned, <u>preparation with rhTSH stimulation is preferred over thyroid hormone ' +
      'withdrawal</u>.」（Strong recommendation, <u>High</u> certainty evidence）</b><br>' +
      '相較 ATA 2015 Rec 54(A) 只稱 rhTSH 為「an <b>acceptable alternative</b> to thyroid hormone ' +
      'withdrawal」。❗<b>但 2015 那一條本來就已經是 Strong recommendation</b>（Moderate quality，' +
      '且限低／中風險、無廣泛淋巴結侵犯者）。<b>真正改變的是用字（acceptable alternative → preferred）、' +
      '證據等級（Moderate → High）、以及不再限定風險層級 —— 不是「從非 Strong 升級為 Strong」。</b></td></tr>' +
      '<tr><td><b>B</b></td><td>任何風險層，若有顯著共病使停藥不可行，<b>應考慮 rhTSH</b>（Good Practice Statement）</td></tr>' +
      '<tr><td><b>C</b></td><td><b>「If thyroid hormone withdrawal is planned… LT4 should be withdrawn ' +
      'for <u>3–4 weeks</u>. If LT4 is withdrawn for ≥ 4 weeks, substitution of LT4 with liothyronine ' +
      '(LT3) in the initial weeks should be considered. In such circumstances LT3 should be withdrawn ' +
      'for <u>at least 2 weeks</u>…」（Good Practice Statement）</b><br>' +
      '❗<b>台灣買不到單方 liothyronine（T3）</b>——食藥署許可證 0 筆，這個 LT3 橋接做法在台灣做不到。</td></tr>' +
      '<tr><td><b>D</b></td><td><b>「A goal of <u>TSH &gt; 30 mIU/L</u> should be employed in preparation ' +
      'for RAI therapy or diagnostic testing.」（Good Practice Statement）</b><br>' +
      '❗<b>這是全文唯一用 mIU/L 給數字的地方</b>——它是「準備 RAI 的 TSH 目標」，' +
      '<b>不是 TSH 抑制治療的目標</b>，兩者常被搞混。</td></tr>' +
      '<tr><td>❗<b>E</b></td><td><b>「In patients with <u>known distant metastases</u>, either LT4 ' +
      'withdrawal or rhTSH can be used for preparation.」（Conditional recommendation, Low certainty evidence）</b><br>' +
      '<b>已知遠端轉移者刻意退回「兩者皆可」，不適用 A 的 preferred。</b></td></tr>' +
      '<tr><td colspan="2">❗<b>台灣的現實：rhTSH 的藥證與健保涵蓋的族群正好相反</b><br>' +
      '<b>藥證</b>（Thyrogen 適諾進，衛署罕菌疫輸字第000003號，有效至 2028/05/06）：' +
      '適應症含「甲狀腺殘留組織的放射碘去除之輔助療劑」，<b>但限「<u>且沒有轉移性甲狀腺癌的跡象</u>的病人」</b>。<br>' +
      '<b>健保</b>：藥品端的支付價自 94/04/01 起為 <b>0.00</b>（等同不給付）；' +
      '實際走的是<b>診療項目 26074C「碘-131 癌症追蹤檢查-施打 Thyrogen」19,475 點</b>，' +
      '適應症逐字「(1) 甲狀腺癌<b>復發或轉移</b>之患者　(2) 不適合停用 T4 之甲狀腺癌患者」，' +
      '<b>且須個案申請事前審查</b>。<br>' +
      '→ <b>ATA 2025 主打的用途（非轉移性病人做 RAI 前的準備）落在藥證涵蓋、健保不涵蓋的夾縫裡。' +
      '實務上是「自費用 rhTSH」對上「停藥升 TSH（健保）」的選擇。</b></td></tr>' +
      '</table>');
  }

  /* 2d. 治療反應四分類與 TSH 目標（Table 9 + Rec 45/46） */
  function responseReference() {
    return fold('<b>治療反應四分類與 TSH 目標</b>（ATA 2025 Table 9、Rec 45／46）',
      '<table>' +
      '<tr><td colspan="5">❗<b>切點依「做了什麼治療」分欄 —— 同一個 Tg 數值在不同欄是不同的反應級別。</b>' +
      '這是 2025 版的重要改動，而且<b>新增了 hemithyroidectomy 欄</b>。</td></tr>' +
      '<tr><td><b>反應</b></td><td><b>全切 ± 廓清<br>＋ RAI</b></td><td><b>全切 ± 廓清<br>未做 RAI</b></td>' +
      '<td><b>葉切<br>（hemithyroidectomy）</b></td><td><b>TSH 目標</b></td></tr>' +
      '<tr><td><b>Excellent</b></td>' +
      '<td>未刺激 Tg <b>&lt; 0.2</b>，或刺激後 Tg <b>&lt; 1</b>，且影像陰性</td>' +
      '<td>未刺激 Tg <b>&lt; 2.5</b></td>' +
      '<td>對側葉正常或為低風險結節，或對側葉結節切片為良性，<b>且</b>影像無異常淋巴結</td>' +
      '<td>TSH <b>維持在正常參考範圍內</b></td></tr>' +
      '<tr><td><b>Indeterminate</b></td>' +
      '<td>影像有非特異性發現，或未刺激 Tg <b>0.2–1</b>，或刺激後 Tg <b>1–10</b>，或 TgAb 穩定／下降</td>' +
      '<td>影像有非特異性發現，或未刺激 Tg <b>2.5–5</b>，或 TgAb 穩定／下降</td>' +
      '<td>不適用</td><td>TSH <b>維持在正常參考範圍內</b></td></tr>' +
      '<tr><td><b>Biochemically<br>incomplete</b></td>' +
      '<td>未刺激 Tg <b>&gt; 1</b>，或刺激後 Tg <b>&gt; 10</b>，或 TgAb 上升，且影像陰性</td>' +
      '<td>未刺激 Tg <b>&gt; 5</b>，或 TgAb 上升，且影像陰性</td>' +
      '<td>不適用</td><td>TSH <b>低於正常參考範圍</b></td></tr>' +
      '<tr><td><b>Structurally<br>incomplete</b></td>' +
      '<td colspan="3">有結構性疾病的證據（影像可疑，或切片證實的局部或遠端轉移）—— 三欄相同</td>' +
      '<td>TSH <b>低於正常參考範圍</b></td></tr>' +
      '<tr><td colspan="5">❗<b>TSH 目標為什麼沒有數字</b>：RECOMMENDATION 45、46 與 Table 9、Table 11 ' +
      '<b>都沒有任何 mIU/L 數值</b>，全部改用文字。Table 9 表註逐字說明理由：' +
      '<b>「Data on optimal TSH target range are <u>inconclusive and/or conflicting</u>. If there is ' +
      'progression of residual disease or development of new recurrence, targeting a TSH below normal ' +
      'reference range may be reasonable. However, comorbidities such as <u>atrial fibrillation and ' +
      'osteoporosis</u> should be factored into the decision making process.」</b><br>' +
      '<b>RECOMMENDATION 46(A)</b>：<b>「Long-term TSH suppression is <u>not suggested</u> for patients ' +
      'with low- or intermediate-risk disease who have no evidence of biochemical or structural ' +
      'recurrence.」（Conditional recommendation, Low certainty evidence）</b><br>' +
      '<b>若臨床上需要數值</b>，要標明出處不是 ATA 2025：<b>ATA 2015 Rec 59</b>（高風險 &lt; 0.1、' +
      '中風險 0.1–0.5、低風險 0.5–2 mU/L）或 <b>ESMO 2019</b>。' +
      '<b>不要把這些數字掛在 ATA 2025 名下。</b></td></tr>' +
      '<tr><td colspan="5"><b>Tg 與 TgAb 的測量規則（RECOMMENDATION 47）</b><br>' +
      'A：<b>Tg 要用對 <u>BCR457 標準品</u>校正的方法；每一次驗 Tg 都要同時定量 TgAb</b>（GPS）。<br>' +
      'C：初期追蹤的 Tg <b>每 6–12 個月</b>驗一次；intermediate-high 與 high 可以更密（GPS）。<br>' +
      'D：❗<b>葉切之後不常規驗 Tg</b>（Conditional, Very low certainty）。<br>' +
      'E：❗<b>TgAb 陽性者，現行 Tg 免疫測定法會受干擾、Tg LC-MS/MS 敏感度又低 → ' +
      '「Imaging is the <u>primary</u> modality for monitoring in this population.」</b></td></tr>' +
      '<tr><td colspan="5"><b>超音波（RECOMMENDATION 31）</b>：完成初始治療後 <b>6–12 個月</b>做頸部超音波；' +
      '之後的時機與頻率依風險與治療反應決定（GPS）。' +
      '❗<b>可疑淋巴結或病灶最短徑 &lt; 8–10 mm 可以只追蹤不做 FNA</b>，除非長大或威脅重要構造' +
      '（Conditional, Low）；<b>≥ 8–10 mm 則應做 FNA 並驗針洗液 Tg</b>（GPS）。</td></tr>' +
      '</table>');
  }

  /* 2e. 健保與藥證（甲狀腺癌專屬） */
  function nhiReference() {
    return fold('<b>❗健保與藥證在甲狀腺癌的缺口</b>（查詢日 2026-09-13）',
      '<table>' +
      '<tr><td colspan="2"><b>有健保給付的五個藥</b></td></tr>' +
      '<tr><td><b>lenvatinib</b><br>9.63.1</td><td><b>分化型、放射碘難治</b>。須事前審查，每次療程 3 個月。<br>' +
      '藥證適應症逐字：<b>「適用於<u>放射性碘治療無效</u>之<u>進行性</u>，且為<u>局部晚期或轉移性</u>之' +
      '分化型甲狀腺癌之<u>成人</u>病人」</b>——比一般講法多了「進行性／局部晚期或轉移性／成人」三個限制。</td></tr>' +
      '<tr><td><b>sorafenib</b><br>9.34.3</td><td><b>分化型、放射碘難治</b>。須事前審查，每次療程 3 個月。</td></tr>' +
      '<tr><td>❗<b>cabozantinib</b><br>9.74.2</td>' +
      '<td><b>只寫分化型</b>：「適用於 12 歲以上<b>曾接受 VEGFR 標靶治療後惡化</b>、放射碘治療無效或' +
      '不適用放射碘治療的局部晚期或轉移性<b>分化型</b>甲狀腺癌病人。」<br>' +
      '<b>114/8/1（＝2025-08-01）才新增</b>。須事前審查，每次療程 3 個月、每 3 個月評估，' +
      '<b>每日限用 1 粒</b>（20／40／60 mg 同價）。<br>' +
      '❗<b>條文不含髓質癌與未分化癌</b>；髓質癌專用的 Cometriq 膠囊<b>台灣沒有藥證</b>。</td></tr>' +
      '<tr><td><b>vandetanib</b><br>9.86</td>' +
      '<td><b>髓質癌唯一的健保入口</b>：限「無法進行手術切除的局部侵犯或轉移性甲狀腺髓質癌，' +
      '並且為<b>症狀性及疾病侵襲性</b>的患者」。須事前審查，每次療程 <b>6 個月</b>。<br>' +
      '❗<b>劑量陷阱</b>：條文寫「每日最大劑量 300 毫克」，但 <b>300 mg 的藥證已於 2023/12/26 自請註銷、' +
      '健保支付價 113/04/01 歸零</b> → 實務上只能用 <b>3 顆 100 mg</b> 湊。</td></tr>' +
      '<tr><td><b>larotrectinib</b><br>9.95.3(5)</td>' +
      '<td>條文<b>明列「甲狀腺癌」</b>，須 NTRK 基因融合，且要求' +
      '<b>「沒有合適的替代治療選項（<u>包含免疫檢查點抑制劑</u>）」</b>。須事前審查，每次療程 <b>12 週</b>。<br>' +
      '❗<b>entrectinib（9.93）在台灣健保只給 ROS-1 陽性非小細胞肺癌</b>，' +
      '雖然它的藥證有泛實體腫瘤 NTRK。<b>NTRK 融合的甲狀腺癌要走健保只能用 larotrectinib。</b></td></tr>' +
      '<tr><td colspan="2"><b>有藥證但健保 0 筆（自費買得到）</b></td></tr>' +
      '<tr><td>❗<b>selpercatinib</b></td><td>Retsevmo 銳癌寧（衛部藥輸字第028331／028332號）。' +
      '<b>健保三處查詢全 0 筆 —— 沒有健保藥品代號、沒有支付價、沒有給付規定。全額自費。</b><br>' +
      '台大處方集有這張卡（RET4CG28）。</td></tr>' +
      '<tr><td>❗<b>pralsetinib</b></td><td>Gavreto 普吉華（衛部藥輸字第028393號），台大處方集列「專案」。' +
      '<b>健保同樣 0 筆</b>；審議歷程為 115/4/7 完成審議（同意給付）→ <b>115/7/28 結案（其他原因）</b>。<br>' +
      '❗<b>台灣的適應症沒有「RET 突變髓質癌」</b>（只有 RET 融合甲狀腺癌與非小細胞肺癌），' +
      '<b>與美國仿單不同</b>——而髓質癌最常見的正是 RET <u>突變</u>而非融合。</td></tr>' +
      '<tr><td>❗<b>rhTSH</b></td><td>見上方 RAI 橫列：<b>藥品支付價歸零，走診療項目 26074C，' +
      '且限復發／轉移或不適合停 T4。</b></td></tr>' +
      '<tr><td colspan="2"><b>❗最大的缺口：驗得到、用不到</b></td></tr>' +
      '<tr><td><b>檢測<u>有</u>給付</b></td>' +
      '<td><b>BRAF 檢測 30107B</b> 的適應症明文含「甲狀腺癌（<b>不包含髓質癌</b>）…無分化甲狀腺癌' +
      '經多專科團隊評估無法接受根除手術者」。<br>' +
      '<b>NGS 附表 2.2.1</b> 也列了兩行：甲狀腺癌（BRAF V600E／BRAF nonV600E／RET fusion）與' +
      '甲狀腺髓質癌（RET mutation）。<b>NGS 30302B／30303B 為 2 萬／3 萬點，每人各癌別終生一次。</b></td></tr>' +
      '<tr><td><b>藥<u>沒有</u>給付</b></td>' +
      '<td>❗<b>' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') + '（9.91）沒有任何甲狀腺適應症</b>' +
      '（現行條文只有黑色素瘤與 BRAF V600E 轉移性非小細胞肺癌）。<br>' +
      '❗<b>' + NR('selpercatinib') + '、' + NR('pralsetinib') + ' 健保 0 筆。</b><br>' +
      '→ <b>未分化癌驗出 BRAF V600E、髓質癌驗出 RET 突變，在台灣都是「檢測健保付、藥要自費」。</b></td></tr>' +
      '<tr><td colspan="2"><b>其他要知道的</b></td></tr>' +
      '<tr><td>順序陷阱</td><td><b>lenvatinib 與 sorafenib 的條文只寫「不得合併使用」，' +
      '<u>沒有</u>先後互斥或「用過 A 不得申請 B」。</b>' +
      '❗<b>肝細胞癌那邊的「擇一給付、不得互換」規則不適用於甲狀腺癌</b>，不要照搬。<br>' +
      '同樣地，9.74 的「第一線使用後再復發不得再次申請」<b>只在腎細胞癌項下</b>，甲狀腺癌段落沒有這條。</td></tr>' +
      '<tr><td>放射碘與追蹤檢驗</td><td><b>I-131 治療 26038B，478 點／mCi</b>（無事前審查）。' +
      '<b>Tg 09111C 90 點、anti-Tg 12068C 200 點、calcitonin 09115B 240 點、CEA 12021C 400 點</b>，均現行。</td></tr>' +
      '<tr><td>❗<b>levothyroxine</b></td><td><b>7 張藥證的適應症一律只有「甲狀腺機能減退症。」</b>' +
      '→ <b>分化型甲狀腺癌的 TSH 抑制治療，在藥證文字上屬於仿單外使用。</b>' +
      '另：<b>單方 liothyronine（T3）與注射用 levothyroxine 台灣都沒有藥證。</b></td></tr>' +
      '</table>');
  }

  /* 2f. Bethesda 細胞學（術前，非 ATA 2025 範圍） */
  function bethesdaReference() {
    return fold('<b>Bethesda 甲狀腺細胞學報告系統 第 3 版</b>（2023，成人惡性風險）',
      '<table>' +
      '<tr><td colspan="3">❗<b>ATA 2025 已把「甲狀腺結節」整個拆成另一份姊妹指引</b>，' +
      '本頁不涵蓋結節的評估流程。這一格只放細胞學分類與惡性風險，供術前對照。<br>' +
      '❗數字來源標註：原文（Ali SZ et al. Thyroid 2023;33:1039-1044，PMID 37427847）' +
      '取不到全文（出版社 403、付費牆），本表數字取自<b>兩個彼此獨立、且都註明經 Springer 授權' +
      '轉載自原文</b>的開放來源，六類完全一致，屬<b>二手交叉核對</b>而非一手逐字。</td></tr>' +
      '<tr><td><b>類別</b></td><td><b>成人惡性風險</b></td><td><b>一般處置</b></td></tr>' +
      '<tr><td>I 無法診斷 Nondiagnostic</td><td>13%</td><td>重做 FNA（超音波導引）</td></tr>' +
      '<tr><td>II 良性 Benign</td><td>4%</td><td>臨床與超音波追蹤</td></tr>' +
      '<tr><td>III AUS</td><td>22%</td><td>重做 FNA、分子檢測或葉切</td></tr>' +
      '<tr><td>IV 濾泡性腫瘤 FN</td><td>30%</td><td>分子檢測或葉切</td></tr>' +
      '<tr><td>V 疑似惡性</td><td>74%</td><td>葉切或全甲狀腺切除</td></tr>' +
      '<tr><td>VI 惡性</td><td>97%</td><td>依本頁流程</td></tr>' +
      '<tr><td colspan="3">❗<b>兒童另有一套數字</b>（14／6／28／50／81／98%），' +
      '<b>兩套極易混用</b>——已知有期刊把兒童版的範圍當成通用範圍在引。</td></tr>' +
      '</table>');
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function thyroidPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><b>甲狀腺癌依組織型態分成三條完全不同的路</b>，' +
      '而且分屬三份不同的指引 —— 選錯型態，整條路都是錯的。<br>' +
      '⚠<b>台大醫院沒有甲狀腺癌診療指引</b>（癌症防治中心 15 個多專科團隊名單沒有甲狀腺／內分泌；' +
      '頭頸癌診療指引全文「甲狀腺」0 次），<b>台灣也沒有全國學會版</b>' +
      '（國健署的規範是要求各醫院自行建立），<b>所以本頁不掛台大名義</b>。<br>' +
      '❗<b>搜尋引擎會把 tmuh.org.tw 的《甲狀腺癌診療指引》標成「台大醫院」——那是北醫體系</b>' +
      '（臺北癌症中心），而且其 115 年版（2026）內文仍自述依據「2015 ATA 及 2019 NCCN」，落後一個世代。<br>' +
      '本頁用的是：<b>分化型 → ATA 2025</b>（Thyroid 2025;35:841-985，84 條建議）；' +
      '<b>髓質癌 → ATA 2015</b>（仍是現行版，已查證 2015 後無新版）；' +
      '<b>未分化癌 → ATA 2021</b>。分期為 AJCC 第 8 版。<br>' +
      '❗<b>台灣最要緊的三件事</b>：<b>rhTSH 的藥證與健保涵蓋的族群正好相反</b>；' +
      '<b>cabozantinib 的健保與藥證都只寫分化型</b>，髓質癌與未分化癌都沒有；' +
      '<b>未分化癌的 BRAF 檢測健保有給付，但對應的藥沒有</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是分級制度、' +
      '四級復發風險分層、放射碘、治療反應與 TSH、健保條文與細胞學。</p>';
    h += '<div class="onc-path" id="thPath">';

    h += node0('ty_n1', '1', '病理是哪一種組織型態？',
      opt('histo', 'dtc', '分化型 DTC', '乳突 PTC ／ 濾泡 FTC ／ oncocytic OTC → ATA 2025') +
      opt('histo', 'mtc', '髓質癌 MTC', 'Medullary → ATA 2015；來自 C 細胞，不吃碘') +
      opt('histo', 'atc', '未分化癌 ATC', 'Anaplastic → ATA 2021；<b>這是急症</b>，先看氣道'),
      gradeReference() + bethesdaReference());

    /* ── 分化型 DTC ── */
    h += '<div id="ty_b_dtc" class="hidden">';
    h += node('ty_n_dstage', '2', '現在要決定的是哪一段？',
      opt('dstage', 'init', '初次治療 —— 還沒開刀', '要決定積極監測、葉切還是全甲狀腺切除') +
      opt('dstage', 'postop', '已經手術 —— 要決定放射碘與 TSH 目標', '要先做復發風險分層') +
      opt('dstage', 'fu', '追蹤中 —— 要判讀治療反應', 'Tg 的切點依做過什麼治療而不同') +
      opt('dstage', 'rair', '放射碘難治（RAI-refractory）', '要決定全身性治療'));
    h += node('ty_n_dsize', '3', '腫瘤大小與腺外侵犯、淋巴結、遠端轉移的臨床評估？',
      opt('dsize', 't1a', 'cT1a：≤ 1 cm、cN0M0', '可以討論積極監測或消融') +
      opt('dsize', 'le2', 'cT1：≤ 2 cm、無明顯腺外侵犯、cN0M0', '') +
      opt('dsize', 't2', 'cT2：&gt; 2 且 ≤ 4 cm、單側、低風險、cN0M0', '') +
      opt('dsize', 'big', '&gt; 4 cm（cT3a），或明顯腺外侵犯（cT3b／T4），或 cN1，或 cM1', ''));
    h += recBox('ty_r_dinit', '建議處置 · 初次手術要開到哪裡');
    h += node('ty_n_dhisto', '3', '病理屬於哪一組？（兩組的風險準則不同）',
      opt('dhisto', 'ptc', '乳突癌 PTC 與其亞型', '') +
      opt('dhisto', 'ftc', '濾泡癌 FTC ／ IEFVPTC ／ oncocytic OTC', '這兩欄的準則相同'),
      riskReference());
    h += node('ty_n_drisk', '4', '依 ATA 2025 四級分層，這位病人落在哪一級？',
      opt('drisk', 'low', 'LOW &lt; 10%', 'T1／T2 ≤ 4 cm；unifocal（PTC）或僅 capsular invasion（FTC／OTC）；pN0a 或 pN1a ≤ 5 顆且全 ≤ 2 mm；切緣陰性或僅 microscopic ＋ anterior margin') +
      opt('drisk', 'lowint', 'LOW-INTERMEDIATE 10–15%', 'T3a；或 T1／T2 有：unilateral multifocality（PTC）／limited vascular invasion &lt; 4 條（FTC／OTC）／microscopic ETE／cN1a 或 pN1a &gt; 2 mm 或 &gt; 5 顆／posterior margin R1') +
      opt('drisk', 'inthigh', 'INTERMEDIATE-HIGH ≥ 16–30%', 'T1／T2／T3a 有：bilateral multifocality &gt; 1 cm（PTC）／cN1b &lt; 3 cm／2 項以上 low-intermediate 因子／aggressive histology（PTC）／vascular invasion（PTC）') +
      opt('drisk', 'high', 'HIGH &gt; 30%', 'T3a ＋ microscopic ETE、T3b 或 T4；或任何 T 有：poorly differentiated／high grade、R2（PTC）、widely invasive 或 ≥ 4 條血管侵犯（FTC／OTC）、cN1 ≥ 3 cm、ENE、M1'));
    h += recBox('ty_r_dpostop', '建議處置 · 放射碘要不要給、TSH 目標');
    h += fuBox('ty_f_dpostop');
    h += node('ty_n_dtx', '3', '這位病人做過的是哪一種治療？（Tg 切點依此而不同）',
      opt('dtx', 'hemi', '葉切除 hemithyroidectomy', '2025 版新增的一欄') +
      opt('dtx', 'ttnorai', '全甲狀腺切除 ± 廓清，<b>沒有</b>做放射碘', '') +
      opt('dtx', 'ttrai', '全甲狀腺切除 ± 廓清，<b>有</b>做放射碘', ''),
      responseReference());
    h += node('ty_n_dresp', '4', '依上一欄的切點，治療反應屬於哪一類？',
      opt('dresp', 'exc', 'Excellent 極佳', '') +
      opt('dresp', 'ind', 'Indeterminate 不確定', '') +
      opt('dresp', 'bioinc', 'Biochemically incomplete 生化未完全', '影像陰性但 Tg 或 TgAb 不理想') +
      opt('dresp', 'strinc', 'Structurally incomplete 結構未完全', '影像可疑或切片證實有病灶'));
    h += recBox('ty_r_dfu', '建議處置 · 這個反應該怎麼接');
    h += fuBox('ty_f_dfu');
    h += node('ty_n_dmol', '3', '分子檢測的結果？（ATA 2025 要求<b>開始全身治療前</b>先驗）',
      opt('dmol', 'braf', 'BRAF V600E 突變', '') +
      opt('dmol', 'ret', 'RET 融合 fusion', '') +
      opt('dmol', 'ntrk', 'NTRK 1／3 融合 fusion', '') +
      opt('dmol', 'none', '沒有可標靶的變異', '') +
      opt('dmol', 'pending', '還沒驗', '先別開藥'));
    h += recBox('ty_r_drair', '建議處置 · 放射碘難治的全身性治療');
    h += fuBox('ty_f_drair');
    h += '</div>';

    /* ── 髓質癌 MTC ── */
    h += '<div id="ty_b_mtc" class="hidden">';
    h += node('ty_n_mstage', '2', '現在要決定的是哪一段？',
      opt('mstage', 'preop', '術前 —— 要決定廓清範圍', '❗開刀前一定要先排除 pheochromocytoma') +
      opt('mstage', 'postop', '術後 —— 要判讀 calcitonin', '') +
      opt('mstage', 'adv', '進展性或轉移性 —— 要決定全身治療', ''));
    h += node('ty_n_mctn', '3', '術前的基礎 calcitonin 是多少？（正常參考值 &lt; 10 pg/mL）',
      opt('mctn', 'lt20', '&lt; 20 pg/mL', '淋巴結轉移風險幾乎為零') +
      opt('mctn', 'c20', '20–200 pg/mL', '') +
      opt('mctn', 'c200', '&gt; 200 且 ≤ 500 pg/mL', '') +
      opt('mctn', 'gt500', '&gt; 500 pg/mL', '要做完整的遠端轉移影像'));
    h += recBox('ty_r_mpreop', '建議處置 · 手術範圍與術前必做');
    h += node('ty_n_mpost', '3', '術後 3 個月的 calcitonin？',
      opt('mpost', 'und', '測不到或落在正常範圍', '') +
      opt('mpost', 'lt150', '升高但 &lt; 150 pg/mL', '') +
      opt('mpost', 'gt150', '&gt; 150 pg/mL', '要做全套影像'));
    h += recBox('ty_r_mpostop', '建議處置 · 術後要追什麼、要不要找病灶');
    h += fuBox('ty_f_mpostop');
    h += node('ty_n_madv', '3', '這位病人的疾病狀態是哪一種？',
      opt('madv', 'stable', '低量轉移且穩定，或只有腫瘤指標上升', '影像上沒有進展') +
      opt('madv', 'prog', '影像證實進展，或有症狀', ''));
    h += recBox('ty_r_madv', '建議處置 · 要不要開始全身治療');
    h += fuBox('ty_f_madv');
    h += '</div>';

    /* ── 未分化癌 ATC ── */
    h += '<div id="ty_b_atc" class="hidden">';
    h += recBox('ty_r_aurg', '❗先做的事 · 氣道、診斷與治療目標');
    h += node('ty_n_astage', '2', '分期與可切除性？（未分化癌一律是第 IV 期）',
      opt('astage', 'iva', 'IVA：T1–T3a、N0、M0', '仍侷限在甲狀腺內；1 年存活 72.7%') +
      opt('astage', 'ivb_res', 'IVB 且評估可以達到 R0／R1 切除', '1 年存活 24.8%') +
      opt('astage', 'ivb_unres', 'IVB 但無法切除', '') +
      opt('astage', 'ivc', 'IVC：任何 T、任何 N、M1', '1 年存活 8.2%'));
    h += node('ty_n_abraf', '3', 'BRAF V600E 的結果？（ATA 2025 要求 expeditiously 驗）',
      opt('abraf', 'pos', 'BRAF V600E 陽性', '未分化癌有 50–70% 是陽性') +
      opt('abraf', 'neg', 'BRAF V600E 陰性', '要再看其他可標靶變異') +
      opt('abraf', 'pending', '還沒有結果', ''));
    h += recBox('ty_r_atc', '建議處置 · 未分化癌');
    h += fuBox('ty_f_atc');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="thReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="ty_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="ty_drugs"></div>';
    return h;
  }

  /* ==========================================================
     4. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function collapseAll() {
    var root = el('thPath');
    if (!root) return;
    root.querySelectorAll('.ty-node').forEach(function (n) {
      if (n.id !== 'ty_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['ty_b_dtc', 'ty_b_mtc', 'ty_b_atc'].forEach(function (id) { show(id, false); });
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
  function fu(id, html) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = '<div class="fu-h">接下來怎麼追蹤</div><ul class="fu-list">' + html + '</ul>';
  }

  /* ==========================================================
     5. 分化型 DTC
     ========================================================== */
  var PCND = '❗<b>預防性中央區廓清（prophylactic central neck dissection）</b>：' +
    '<b>RECOMMENDATION 19(A)「should <u>not</u> be performed for most small, noninvasive, clinically ' +
    'node-negative PTC (cT1-T2, cN0) and for most FTCs.」（Strong, Moderate certainty）</b>；' +
    '<b>19(B)：cN0 但原發灶為 T3 或 T4 者「<u>may</u> be considered」（Conditional, Low certainty）</b>，' +
    '要和手術當下逐步浮現的風險權衡。<b>不能簡化成「一律不做」。</b>';

  var PCND_HIST = EV('❗常被說成「2025 大翻轉」，其實不是：<b>ATA 2015 Rec 36(C) 已經是 ' +
    'Strong／Moderate 的「thyroidectomy <u>without</u> prophylactic central neck dissection is ' +
    'appropriate」</b>，2025 只是改成反面句型，<b>強度與證據等級都沒變</b>。' +
    '唯一的實質差異是 2025 的 19(B) 把 2015 列在「可考慮」裡的 <b>cN1b 拿掉</b>，' +
    '並把動詞由 should be considered 降為 may be considered。');

  function renderDtcInit() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.dsize === 't1a') {
      cls = 'rec-nonop';
      title = 'cT1a（≤ 1 cm）、cN0M0<br>→ 可以和病人討論積極監測，不是非開不可';
      L.push(H('主建議', 'ATA 2025 Rec 11'));
      L.push('A：<b>「Active surveillance <u>may be offered</u> as an appropriate management option ' +
        'for some patients with cT1aN0M0 PTCs. <u>Shared clinical decision-making</u> between the ' +
        'patient and clinical team regarding risks and benefits of this approach is essential.」' +
        '（Conditional recommendation, Low certainty evidence）</b>');
      L.push('B：<b>超音波導引的經皮消融（percutaneous ablation）</b>對選定的 cT1aN0M0 乳突癌，' +
        '<b>可作為積極監測或手術之外的另一個選項</b>（Conditional, Low certainty）。');
      L.push(H('選了監測之後要做什麼', 'Rec 12、13'));
      L.push('<b>用頸部超音波追蹤疾病進展</b>（Good Practice Statement）。' +
        '正文給的節奏是<b>「每 6 個月做 1–2 年，之後每年一次」</b>；' +
        '❗<b>指引明言「The length of necessary follow-up remains unknown」</b>，' +
        '而且<b>先前所有積極監測研究都沒有用頸部 CT 做例行追蹤</b>。');
      L.push('❗<b>不要例行驗 Tg 或 TgAb</b> —— <b>「routine measurement of serum Tg and/or TgAb ' +
        'levels is <u>not recommended</u>」（Good Practice Statement）</b>。');
      L.push(H('❗什麼時候要改成開刀', 'Rec 14，Good Practice Statement'));
      L.push('逐字八項，任一成立就有手術適應症：' + SUB([
        '<b>新出現、且經切片證實的淋巴結轉移</b>',
        '<b>原發腫瘤長大 ≥ 3 mm</b>',
        '<b>出現遠端轉移</b>',
        '<b>出現腺外侵犯（extrathyroidal extension）的證據</b>',
        '<b>往後方生長（posterior growth）</b>',
        '<b>病人焦慮（patient anxiety）</b>',
        '<b>無法配合追蹤</b>',
        '<b>病人表達希望手術</b>']) +
        '❗<b>後三項是病人端的理由，不是腫瘤變化 —— 指引把它們和影像變化並列，不要漏掉。</b>');
      L.push('❗<b>一開始就不適合積極監測的情況</b>：' +
        '<b>已侵犯喉返神經、氣管或食道者</b>；' +
        '<b>緊鄰但尚未侵犯這些構造者，應先與外科討論再決定。</b>');
      L.push(EV('❗<b>常被引錯的數字</b>：坊間常寫的「5 年增大 4.9%」<u>不是</u> Ito 2014 那篇的世代數字' +
        '（該篇全世代只報 10 年：增大 8.0%、新發淋巴結 3.8%、進展為臨床疾病 6.8%；' +
        '4.9% 其實是該篇 Table 3 裡「中年組 10 年進展為臨床疾病」那一格）。' +
        '建議改引 <b>Ito 2023 World J Surg（PMID 36182976，n = 2705）</b>，摘要就有完整三個時點：' +
        '<b>腫瘤增大 5 年 3.0%、10 年 5.5%、15 年 6.2%；新發淋巴結轉移 0.9%／1.1%／1.1%</b>。' +
        '三個世代（2010 的 n=340、2014、2023）數字互不相同，引用時要指明是哪一篇。'));
    } else if (S.dsize === 'le2') {
      title = 'cT1（≤ 2 cm）、無明顯腺外侵犯、cN0M0<br>→ 甲狀腺葉切除（Strong）';
      L.push(H('主建議', 'ATA 2025 Rec 15(A)'));
      L.push('<b>「When resection is performed for patients with thyroid cancer ≤ 2 cm without gross ' +
        'extra-thyroidal extension (cT1) and without metastases (cN0M0), the initial surgical ' +
        'procedure <u>should be a thyroid lobectomy</u> unless there are bilateral cancers or other ' +
        'indications to remove the contralateral lobe.」（Strong recommendation, Moderate certainty ' +
        'evidence）</b>');
      L.push('<b>例外只有兩種：雙側都有癌，或有其他必須切掉對側葉的理由。</b>');
      L.push(PCND);
      L.push(PCND_HIST);
      L.push(EV('❗<b>「葉切的切點從 1 cm 放寬到 2 cm」這個說法不精確。</b>' +
        '<b>ATA 2015 Rec 35(B) 早就允許 &gt; 1 cm 到 &lt; 4 cm 的低風險 cN0 做葉切</b>，而且同為 Strong。' +
        '真正改變的是<b>「應直接做葉切」這個強建議的門檻由 &lt; 1 cm 上移到 ≤ 2 cm</b>；' +
        '<b>葉切可被接受的上限兩版都是 4 cm，沒有放寬。</b>' +
        '「&gt; 1 cm 一律全甲狀腺切除」是 <b>2006 與 2009 兩版</b>的立場。'));
    } else if (S.dsize === 't2') {
      title = 'cT2（&gt; 2 且 ≤ 4 cm）、單側、低風險、cN0M0<br>→ 葉切可能是較好的起手式，但要先把話說清楚';
      L.push(H('主建議', 'ATA 2025 Rec 15(B)'));
      L.push('<b>「For patients with low risk, unilateral thyroid cancer &gt; 2 and ≤ 4 cm (cT2N0M0), ' +
        'thyroid lobectomy <u>may be the preferred</u> initial surgical treatment due to significantly ' +
        'lower risk and side effects.」（Conditional recommendation, Low-moderate certainty evidence）</b>');
      L.push('❗<b>但同一條也寫出了選全切的理由</b>：<b>「the patient and treatment team <u>may adopt ' +
        'total thyroidectomy</u> to enable RAI administration and/or enhance follow-up based on disease ' +
        'features, suspicious contralateral nodularity, and/or patient preferences.」</b>' +
        '<b>也就是「想留放射碘這條路、或想讓追蹤更好判讀」本身就是選全切的正當理由。</b>');
      L.push('❗<b>選葉切時，術前一定要先講的一句話</b>（條文明文要求）：' +
        '<b>「counsel the patient about the possibility of <u>conversion to total thyroidectomy</u> or ' +
        'need for subsequent <u>completion thyroidectomy</u> if higher-risk factors emerge ' +
        'intraoperatively or postoperatively.」</b>' +
        '<b>—— 術中或術後冒出高風險因子時，可能要當場改成全切或之後補做完成性切除。</b>');
      L.push(PCND);
      L.push(EV('<b>選葉切會連帶影響之後兩件事</b>：① 治療反應的判讀要改用 Table 9 的' +
        '<b>葉切欄</b>（Excellent 的定義完全不同，不看 Tg 數值而看對側葉與淋巴結）；' +
        '② <b>葉切之後不常規驗 Tg</b>（Rec 47D，Conditional／Very low），' +
        '也<b>不做監測性全身碘掃描</b>（Rec 49A，Good Practice Statement）。'));
    } else {
      cls = 'rec-urgent';
      title = '&gt; 4 cm（cT3a），或明顯腺外侵犯（cT3b／T4），或 cN1，或 cM1<br>→ 全甲狀腺切除 ＋ 廓清（Strong）';
      L.push(H('主建議', 'ATA 2025 Rec 15(C)'));
      L.push('<b>「For patients with thyroid cancer &gt; 4 cm (cT3a), cancer of any size with gross ' +
        'extra-thyroidal extension (cT3b or cT4), or clinically apparent metastatic disease to lymph ' +
        'nodes (cN1) or distant sites (cM1), the initial surgical procedure <u>should include a total ' +
        'thyroidectomy</u> with gross removal of all primary tumor and node dissection unless there are ' +
        'contraindications to this procedure.」（Strong recommendation, Moderate certainty evidence）</b>');
      L.push('<b>四個觸發條件任一成立即可</b>：' + SUB([
        '<b>腫瘤 &gt; 4 cm（cT3a）</b>',
        '<b>任何大小但有明顯腺外侵犯（cT3b 或 cT4）</b>',
        '<b>臨床上明顯的淋巴結轉移（cN1）</b>',
        '<b>遠端轉移（cM1）</b>']));
      L.push('❗<b>注意條文寫的是 total thyroidectomy <u>with node dissection</u></b> —— ' +
        '<b>這一格的廓清是治療性的，不是上面在講的預防性廓清。</b>');
      L.push(PCND);
      L.push('<b>接下來</b>：術後病理出來後回<b>步驟 2 選「已經手術」</b>，' +
        '做 ATA 2025 四級復發風險分層，才能決定放射碘與 TSH 目標。');
    }
    fill('ty_r_dinit', cls, title, L,
      'ATA 2025 分化型甲狀腺癌指引（Ringel MD, Sosa JA et al. Thyroid 2025;35(8):841-985，' +
      'PMID 40844370，DOI 10.1177/10507256251363120）Recommendation 11–15、19。' +
      '⚠ 台大醫院無甲狀腺癌診療指引，本頁全部為院外實證。',
      gradeReference() + riskReference());
  }

  function renderDtcPostop() {
    var L = [], cls = 'rec-elective', title = '', fuHtml = '';
    var isPtc = S.dhisto === 'ptc';
    var grp = isPtc ? '乳突癌 PTC 與其亞型' : '濾泡癌 FTC ／ IEFVPTC ／ oncocytic OTC';

    if (S.drisk === 'low') {
      cls = 'rec-nonop';
      title = grp + ' · <b>LOW（&lt; 10%）</b><br>→ 不常規給放射碘；TSH 維持在正常範圍';
      L.push(H('放射碘：不給', 'Rec 32(A)'));
      L.push('<b>「Remnant ablation is <u>not recommended routinely</u> after total thyroidectomy for ' +
        'patients with ATA low-risk DTC.」（Strong recommendation, <u>High</u> certainty evidence）</b>');
      L.push('❗<b>這是全文少數拿到 High certainty 的條文之一</b> —— ' +
        '語氣比一般的「可以考慮不給」強得多，<b>預設就是不給</b>。');
      L.push(EV('<b>證據基礎是兩個隨機試驗</b>：<b>ESTIMABL2</b>（PMID 35263518）與 ' +
        '<b>IoN</b>（PMID 40543520），兩者的非劣性界值都是 <b>5 個百分點</b>。' +
        '❗<b>但 IoN 的結論比它的收案範圍窄</b>：它收了 pT3／pT3a 與 N1a，' +
        '結論卻只說 <b>pT1、pT2、N0／Nx 且無不良特徵</b>者可以省略放射碘 —— ' +
        '因為 <b>pT3／pT3a 的復發率 9%、N1a 13%，而 pT1／pT2 只有 3%、N0／Nx 2%</b>。' +
        '<b>不要把「低風險可以不給」直接套到 pT3 或 N1a。</b>' +
        'ESTIMABL2 另有五年追蹤（PMID 39586309）：93.2% vs 94.8%，差 −1.6%。'));
      L.push(H('TSH 目標', 'Table 9、Rec 46(A)'));
      L.push('<b>TSH 維持在正常參考範圍內。</b>' +
        '<b>「Long-term TSH suppression is <u>not suggested</u> for patients with low- or ' +
        'intermediate-risk disease who have no evidence of biochemical or structural recurrence.」' +
        '（Conditional, Low certainty）</b>');
      L.push('❗<b>ATA 2025 沒有給任何 mIU/L 數值</b>，理由寫在 Table 9 表註：' +
        '<b>「Data on optimal TSH target range are inconclusive and/or conflicting」</b>，' +
        '而且要把<b>心房顫動與骨質疏鬆</b>納入考量。' +
        '需要數字時要標明出處是 <b>ATA 2015 Rec 59</b> 或 ESMO，<b>不可掛在 ATA 2025 名下</b>。');
      fuHtml = '<li><b>完成初始治療後 6–12 個月</b>做頸部超音波（Rec 31C，Good Practice Statement）。</li>' +
        '<li><b>初期追蹤的 Tg 每 6–12 個月驗一次</b>；每次驗 Tg 都要<b>同時定量 TgAb</b>（Rec 47）。</li>' +
        '<li>❗<b>可以停下來的出口（Rec 48）</b>：低風險且<b>持續極佳反應 5–8 年</b>後，' +
        '<b>可以停掉例行超音波</b>，改成只用生化指標每 1–2 年追蹤（Conditional, Low certainty）。</li>' +
        '<li>❗<b>持續極佳反應 10–15 年</b>者<b>不需要再繼續例行的生化監測</b>，' +
        '並<b>視為已達成 complete remission（完全緩解）</b>（Good Practice Statement）。<br>' +
        '⚠<b>指引用的詞是 complete remission，而且明文說「This does <u>not always</u> mean that cancer ' +
        'has been cured or will not return.」—— 不要在病人面前講成「治癒」。</b><br>' +
        '⚠<b>這個出口只給做過全甲狀腺切除的人；葉切族群沒有這個出口。</b></li>' +
        '<li>❗<b>不做監測性全身碘掃描</b>：葉切或全切未做放射碘者「should <u>not</u>」做（Rec 49A）；' +
        '低與 low-intermediate 且極佳反應者也不需常規做（Rec 49B）。</li>';
    } else if (S.drisk === 'high') {
      cls = 'rec-urgent';
      title = grp + ' · <b>HIGH（&gt; 30%）</b><br>→ 常規給放射碘輔助治療；TSH 低於正常範圍';
      L.push(H('放射碘：要給', 'Rec 32(C)、Table 10'));
      L.push('<b>「RAI adjuvant therapy <u>is recommended routinely</u> after total thyroidectomy for ' +
        'patients with ATA high-risk DTC.」（Strong recommendation, Moderate certainty evidence）</b>');
      L.push('<b>活度（Table 10）：3.7–5.55 GBq（100–150 mCi）</b>；' +
        '目標是 <b>remnant ablation 與 adjuvant therapy</b>。' +
        '<b>若已有遠端轉移則改為 3.7–7.4 GBq（100–200 mCi），或考慮做 dosimetry。</b>');
      L.push('❗<b>表註明文：最終活度要依<u>多專科團隊</u>的建議決定</b>，不是照表抓。');
      L.push(H('準備方式', 'Rec 34'));
      L.push('<b>「preparation with rhTSH stimulation is <u>preferred over</u> thyroid hormone ' +
        'withdrawal」（Strong recommendation, <u>High</u> certainty evidence）</b>。' +
        '<b>目標 TSH &gt; 30 mIU/L。</b>');
      L.push('❗<b>已知遠端轉移者是例外</b>（Rec 34E）：<b>停藥或 rhTSH 兩者皆可</b>' +
        '（Conditional, Low certainty），不適用上面的 preferred。');
      L.push('❗<b>台灣的現實</b>：<b>rhTSH（Thyrogen）的健保藥品支付價已歸零</b>，' +
        '實際走的是<b>診療項目 26074C</b>，而該項目<b>限「復發或轉移」或「不適合停用 T4」</b>；' +
        '<b>而藥證適應症反而限「沒有轉移性甲狀腺癌跡象的病人」</b> —— ' +
        '<b>兩者涵蓋的族群正好相反，這一格實務上是「自費 rhTSH」對「停藥升 TSH（健保）」的選擇。</b>' +
        '停藥做法見下方可展開的橫列（LT4 停 3–4 週；❗<b>台灣買不到單方 T3，LT3 橋接做不到</b>）。');
      L.push(H('TSH 目標', 'Table 9'));
      L.push('<b>結構或生化未完全緩解者：TSH 低於正常參考範圍。</b>' +
        '❗<b>但數值一樣沒有給</b>，且要把<b>心房顫動與骨質疏鬆</b>納入決策。');
      fuHtml = '<li><b>完成初始治療後 6–12 個月</b>做頸部超音波；' +
        '<b>intermediate-high 與 high 的 Tg 可以驗得比每 6–12 個月更密</b>（Rec 47C）。</li>' +
        '<li>❗<b>高風險沒有 Rec 48 的「停止監測」出口</b> —— 那些出口只寫給低風險。</li>' +
        '<li><b>臨床懷疑復發時可做診斷性全身碘掃描</b>，用 ¹²³I 或低劑量 ¹³¹I（Rec 49C，Conditional／Low）。</li>' +
        '<li>可疑淋巴結<b>最短徑 &lt; 8–10 mm 可以只追蹤</b>；<b>≥ 8–10 mm 應做 FNA 並驗針洗液 Tg</b>。</li>';
    } else {
      var lbl = S.drisk === 'lowint' ? 'LOW-INTERMEDIATE（10–15%）' : 'INTERMEDIATE-HIGH（≥ 16–30%）';
      title = grp + ' · <b>' + lbl + '</b><br>→ 放射碘「可以考慮」，這一格要真的做決定';
      L.push(H('放射碘：可考慮，不是預設要給', 'Rec 32(B)'));
      L.push('<b>「RAI adjuvant therapy <u>may be considered</u> after total thyroidectomy in patients ' +
        'with ATA low-intermediate and intermediate-high risk of recurrent DTC.」' +
        '（Conditional recommendation, Low certainty evidence）</b>');
      L.push('❗<b>兩個中間層共用同一條建議、同一個活度區間</b> —— ' +
        '<b>指引沒有在這兩層之間再做區分。</b>' +
        '<b>活度（Table 10）：1.1–3.7 GBq（30–100 mCi）</b>，' +
        '目標是 <b>remnant ablation ± adjuvant therapy</b>。');
      L.push('<b>因為是 Conditional／Low certainty，這一格真的要和病人討論</b>：' +
        '<b>條文的定義是「applicable to most people or situations, though other courses of action ' +
        'might be appropriate in certain circumstances」。</b>');
      if (S.drisk === 'lowint') {
        L.push(EV('這一層的組成（Figure 2）：<b>T3a；或 T1／T2 帶有 unilateral multifocality（僅 PTC）、' +
          'limited vascular invasion &lt; 4 條（僅 FTC／OTC）、microscopic ETE、' +
          'cN1a 或 pN1a &gt; 2 mm 或 &gt; 5 顆、或 posterior margin R1</b>。' +
          '❗<b>同樣是 microscopic 陽性切緣，anterior 會落在 LOW、posterior 才落在這一層。</b>'));
      } else {
        L.push(EV('這一層的組成（Figure 2）：<b>T1／T2／T3a 帶有 cN1b &lt; 3 cm，' +
          '或「2 項以上的 low-intermediate 風險因子」</b>；' +
          '<b>PTC 另外多三項：bilateral multifocality &gt; 1 cm、aggressive histology、vascular invasion。</b>' +
          '❗<b>「2 項以上 low-intermediate 因子就升一級」這條很容易漏掉。</b>'));
      }
      L.push(H('準備方式', 'Rec 34(A)'));
      L.push('<b>若決定要給，rhTSH 優先於停藥（Strong, High certainty），目標 TSH &gt; 30 mIU/L。</b>' +
        '❗<b>台灣的 rhTSH 走診療項目 26074C 且限復發／轉移，這一格多半要自費</b>，詳見下方橫列。');
      L.push(H('TSH 目標', 'Table 9、Rec 46(A)'));
      L.push('<b>沒有生化或結構復發證據的中風險病人，不建議長期 TSH 抑制</b>' +
        '（Conditional, Low certainty）；<b>Table 9 的極佳與不確定反應都是「維持在正常參考範圍內」。</b>');
      fuHtml = '<li><b>完成初始治療後 6–12 個月</b>做頸部超音波（Rec 31C）。</li>' +
        '<li><b>Tg 每 6–12 個月</b>；<b>intermediate-high 可以更密</b>（Rec 47C）。' +
        '每次都要同時定量 TgAb。</li>' +
        '<li>❗<b>low-intermediate 且達到極佳反應者，適用 Rec 48 的降階監測</b>' +
        '（5–8 年後可停超音波）；<b>intermediate-high 不在 Rec 48 的適用範圍內</b>。</li>' +
        '<li><b>後續的時機與頻率由「風險 ＋ 治療反應」共同決定</b> —— ' +
        'Rec 51 稱為 <b>ongoing risk stratification（動態風險評估）</b>，是 Good Practice Statement。</li>';
    }
    fill('ty_r_dpostop', cls, title, L,
      'ATA 2025 Recommendation 28、32、34、45、46 與 Table 9、Table 10；' +
      '四級風險分層為 Figure 2（本頁經三重核對，見上方可展開的橫列）。' +
      '健保與藥證查詢日 2026-09-13。',
      riskReference() + raiReference() + responseReference() + nhiReference());
    if (fuHtml) fu('ty_f_dpostop', fuHtml);
  }

  function renderDtcFu() {
    var L = [], cls = 'rec-elective', title = '', fuHtml = '';
    var col = S.dtx === 'hemi' ? '葉切除' : (S.dtx === 'ttrai' ? '全切 ＋ 放射碘' : '全切、未做放射碘');

    if (S.dresp === 'exc') {
      cls = 'rec-nonop';
      title = col + ' · <b>Excellent（極佳反應）</b><br>→ 開始降階，而且有機會停下來';
      L.push(H('這一欄的 Excellent 是怎麼定義的', 'Table 9'));
      if (S.dtx === 'hemi') {
        L.push('<b>葉切欄不看 Tg 數值</b>：<b>「對側葉正常或為低風險結節，或對側葉結節切片為良性，' +
          '<u>且</u>影像無異常淋巴結」</b>。' +
          '❗<b>這是 2025 版新增的一欄</b>，舊的三欄式表格沒有葉切這一格。');
        L.push('❗<b>葉切之後不常規驗 Tg</b>（Rec 47D，Conditional／Very low certainty）；' +
          '<b>也不做監測性全身碘掃描</b>（Rec 49A，Good Practice Statement）。' +
          '<b>殘餘葉裡的結節依「甲狀腺結節」那份姊妹指引處理。</b>');
      } else if (S.dtx === 'ttrai') {
        L.push('<b>未刺激 Tg &lt; 0.2 ng/mL，或刺激後 Tg &lt; 1 ng/mL，且影像陰性。</b>');
      } else {
        L.push('<b>未刺激 Tg &lt; 2.5 ng/mL。</b>' +
          '❗<b>注意這個切點比做過放射碘那一欄寬了一個數量級</b>（2.5 對 0.2）—— ' +
          '<b>同一個 Tg 數值在兩欄是不同的反應級別，這是 2025 版最容易看錯的地方。</b>');
      }
      L.push('<b>TSH 目標：維持在正常參考範圍內。</b>');
      L.push(H('❗可以停下來的出口', 'Rec 48'));
      if (S.dtx === 'hemi') {
        L.push('<b>葉切族群沒有「complete remission」這個出口。</b>' +
          'Rec 48 第 5、6 項只給監測節奏：<b>初次超音波陰性者，之後每 1–3 年做一次，做 5–8 年</b>' +
          '（Good Practice Statement）；<b>術後 Tg 若沒有明顯升高，不建議再例行驗 Tg</b>。');
        L.push(EV('指引對葉切族群的長期資料明言不足，正文以 <b>「providing a call for more research」</b> 作結。'));
      } else {
        var what = S.dtx === 'ttrai' ? '全甲狀腺切除 ＋ 放射碘' : '單做全甲狀腺切除（無放射碘）';
        L.push('<b>' + what + '且<u>持續</u>極佳反應 <u>5–8 年</u></b>後：' +
          '<b>可以停掉例行超音波</b>，改成只用生化指標<b>每 1–2 年</b>追蹤' +
          '（Conditional recommendation, Low certainty evidence）。');
        L.push('❗<b>' + what + '且<u>持續</u>極佳反應 <u>10–15 年</u></b>者：' +
          '<b>「do not require continued routine biochemical monitoring for thyroid cancer and ' +
          '<u>should be considered to have achieved a complete remission</u>」（Good Practice Statement）</b>。');
        L.push('⚠<b>用詞要小心</b>：指引用的是 <b>complete remission（完全緩解）</b>，' +
          '而且在定義段明文寫 <b>「This does <u>not always</u> mean that cancer has been cured or ' +
          'will not return.」</b> —— <b>不要向病人講成「治癒」。</b>' +
          '定義段另註明：<b>這個詞在先前各版 ATA 指引都沒有出現過，且缺乏明確的甲狀腺癌定義資料。</b>');
        L.push('❗<b>這個出口只寫給「low-risk」</b> —— 中高與高風險層沒有對應條文。');
      }
      L.push('❗<b>Table 11 的降階門檻（低風險、極佳反應）</b>：' + SUB([
        '<b>葉切：術後驗一次 Tg；TSH 正常；超音波每 1–3 年、做 5–8 年</b>',
        '<b>全切未做放射碘：未刺激 Tg &lt; 2.5 ng/mL 且 TgAb 測不到；TSH 正常；' +
          '超音波每 1–3 年做 5–8 年，之後停止，除非 Tg 上升或 TgAb 新出現</b>',
        '<b>全切 ＋ 放射碘：未刺激 Tg &lt; 0.2 ng/mL 且 TgAb 測不到；其餘同上</b>']));
      fuHtml = '<li><b>停止監測的條件是「Tg 沒有上升、TgAb 沒有新出現」</b> —— ' +
        '這兩件事任一發生就要回頭。</li>' +
        '<li><b>Rec 51 動態風險評估</b>（Good Practice Statement）：' +
        '<b>「初始復發風險」要和「當下的治療反應」合起來看</b>，用來決定影像的時機與種類。</li>';
    } else if (S.dresp === 'ind') {
      title = col + ' · <b>Indeterminate（不確定）</b><br>→ 不升階治療，但也還不能降階';
      L.push(H('這一欄的定義', 'Table 9'));
      if (S.dtx === 'hemi') {
        L.push('❗<b>葉切欄沒有 Indeterminate 這一格（表上標 N/A）。</b>' +
          '<b>請回步驟 3 確認治療方式，或依對側葉與影像所見直接歸到極佳或結構未完全。</b>');
      } else if (S.dtx === 'ttrai') {
        L.push('<b>影像有非特異性發現，或未刺激 Tg 0.2–1，或刺激後 Tg 1–10，或 TgAb 穩定／下降。</b>');
      } else {
        L.push('<b>影像有非特異性發現，或未刺激 Tg 2.5–5，或 TgAb 穩定／下降。</b>');
      }
      L.push('<b>TSH 目標：維持在正常參考範圍內</b>（與極佳反應相同）。' +
        'Table 9 表註 b 逐字：<b>「Data on optimal TSH target range are inconclusive.」</b>');
      L.push('❗<b>「TgAb 穩定或下降」被歸在這一格，而「TgAb 上升」會直接掉到生化未完全</b> —— ' +
        '<b>TgAb 的<u>趨勢</u>比它的絕對值重要。</b>');
      L.push('<b>處置的重點是「繼續觀察、不要因為一個模糊的數字就升階」</b>：' +
        '<b>Rec 51 的動態風險評估就是為這一格設計的</b> —— ' +
        '隨時間重新評估，多數 Indeterminate 會往極佳移動。');
      fuHtml = '<li><b>Tg 每 6–12 個月，每次同時定量 TgAb</b>（Rec 47C）。</li>' +
        '<li><b>頸部超音波的時機與頻率依風險與反應決定</b>（Rec 31C）。</li>' +
        '<li>❗<b>非特異性影像發現：最短徑 &lt; 8–10 mm 可以只追蹤不做 FNA</b>，' +
        '除非長大或威脅重要構造（Rec 31D）；<b>≥ 8–10 mm 則做 FNA 並驗針洗液 Tg</b>（Rec 31E）。</li>';
    } else if (S.dresp === 'bioinc') {
      title = col + ' · <b>Biochemically incomplete（生化未完全）</b><br>→ 影像是陰性的，重點是找病灶與 TSH 降下來';
      L.push(H('這一欄的定義', 'Table 9'));
      if (S.dtx === 'hemi') {
        L.push('❗<b>葉切欄沒有這一格（表上標 N/A）。</b>殘留的一葉本來就會製造 Tg，' +
          '<b>所以葉切之後不常規驗 Tg</b>（Rec 47D）。');
      } else if (S.dtx === 'ttrai') {
        L.push('<b>未刺激 Tg &gt; 1，或刺激後 Tg &gt; 10，或 TgAb 上升，<u>且影像陰性</u>。</b>');
      } else {
        L.push('<b>未刺激 Tg &gt; 5，或 TgAb 上升，<u>且影像陰性</u>。</b>');
      }
      L.push('❗<b>「影像陰性」是這一格的定義的一部分</b> —— ' +
        '<b>一旦影像找到病灶就不是這一格，要改判為結構未完全。</b>');
      L.push(H('TSH 目標', 'Table 9 表註 c'));
      L.push('<b>TSH 低於正常參考範圍。</b>逐字理由：<b>「If there is progression of residual disease ' +
        'or development of new recurrence, targeting a TSH below normal reference range may be ' +
        'reasonable. However, comorbidities such as <u>atrial fibrillation and osteoporosis</u> ' +
        'should be factored into the decision making process.」</b>');
      L.push('❗<b>ATA 2025 沒有給這一格任何 mIU/L 數值。</b>' +
        '需要數字時要標明出處是 <b>ATA 2015 Rec 59</b>（高風險 &lt; 0.1、中風險 0.1–0.5、低風險 0.5–2 mU/L）' +
        '或 ESMO 2019，<b>不可掛在 ATA 2025 名下</b>。');
      L.push('❗<b>TgAb 陽性者要改用影像當主力</b>（Rec 47E）：' +
        '<b>「Current Tg immunometric assays (IMA) and radioimmunoassays (RIA) are often affected by ' +
        'TgAb, and Tg LC-MS/MS has low sensitivity… <u>Imaging is the primary modality for monitoring ' +
        'in this population.</u>」</b>');
      fuHtml = '<li><b>Tg 要用對 BCR457 標準品校正的方法</b>，而且<b>每一次驗 Tg 都要同時定量 TgAb</b>' +
        '（Rec 47A，Good Practice Statement）。<b>換實驗室或換方法時數值不可直接比較。</b></li>' +
        '<li><b>臨床懷疑復發時可做診斷性全身碘掃描</b>，用 ¹²³I 或低劑量 ¹³¹I' +
        '（Rec 49C，限 intermediate-high／high）。</li>' +
        '<li><b>這一格不是「沒事」，但也不等於要治療</b> —— ' +
        '要用 Rec 51 的動態風險評估隨時間重估。</li>';
    } else {
      cls = 'rec-urgent';
      title = col + ' · <b>Structurally incomplete（結構未完全）</b><br>→ 有實體病灶，要決定局部處置還是全身治療';
      L.push(H('這一欄的定義', 'Table 9'));
      L.push('<b>有結構性疾病的證據：影像可疑，或切片證實的局部或遠端轉移。' +
        '這一格三欄的定義相同，不因治療方式而異。</b>');
      L.push('<b>TSH 目標：低於正常參考範圍</b>（同樣沒有數值，且要考量心房顫動與骨質疏鬆）。');
      L.push(H('接下來要分兩條路', ''));
      L.push('<b>① 病灶還吃碘（RAI-avid）→ 再給放射碘</b>；' +
        '若已知遠端轉移，準備方式<b>停藥或 rhTSH 皆可</b>（Rec 34E，Conditional／Low），' +
        '<b>不適用一般情況下的 rhTSH preferred</b>。' +
        '活度為 <b>3.7–7.4 GBq（100–200 mCi），或考慮做 dosimetry</b>（Table 10）。');
      L.push('<b>② 病灶不吃碘或在放射碘下仍進展 → 就是放射碘難治（RAI-refractory）</b>，' +
        '<b>請回步驟 2 選「放射碘難治」</b>，那一格會先要求做分子檢測再選藥。');
      L.push('❗<b>可疑淋巴結的處理門檻</b>（Rec 31D／31E）：' +
        '<b>最短徑 &lt; 8–10 mm 可以只追蹤</b>，除非長大或威脅重要構造；' +
        '<b>≥ 8–10 mm 應做 FNA 並驗針洗液 Tg</b>。' +
        '<b>不是看到就切。</b>');
      fuHtml = '<li><b>這一格要由多專科團隊決定順序</b>：局部處置（手術、消融、放療）與全身治療的先後，' +
        '指引沒有給固定順序。</li>' +
        '<li><b>開始全身治療之前，ATA 2025 要求先做組織的分子檢測</b>（Rec 61，Strong／Moderate）—— ' +
        '見步驟 2 的「放射碘難治」那一條。</li>';
    }
    fill('ty_r_dfu', cls, title, L,
      'ATA 2025 Table 9（治療反應四分類，依治療方式分欄）、Table 11（低風險極佳反應的降階）、' +
      'Recommendation 31、47、48、49、51。⚠ 台大醫院無甲狀腺癌診療指引，本頁全部為院外實證。',
      responseReference() + raiReference());
    if (fuHtml) fu('ty_f_dfu', fuHtml);
  }

  function renderDtcRair() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗開藥之前先做這一件事', 'Rec 61，Strong／Moderate'));
    L.push('<b>「Tissue-based biomarker testing to identify actionable oncogenic driver alterations ' +
      'in RAIR DTC <u>should be performed prior to initiating systemic therapy</u> for progressive ' +
      'disease.」（Strong recommendation, Moderate certainty evidence）</b>');
    L.push('❗<b>要和另一條分清楚</b>：<b>術後組織的分子檢測仍是「不常規」</b>' +
      '（Rec 28B，Conditional／Low）；<b>只有「放射碘難治、要開始全身治療前」這一格才是 Strong「應執行」。</b>');
    L.push('<b>要找的變異（正文逐字）</b>：<b>NTRK 1 與 3 融合、RET 融合、BRAF V600E 突變</b>；' +
      '另外 <b>N/H RAS 突變與 ALK 融合</b>也可能對標靶治療有反應。');

    if (S.dmol === 'pending') {
      cls = 'rec-nonop';
      title = '放射碘難治 · <b>分子檢測還沒有結果</b><br>→ 先等結果，除非疾病進展快到不能等';
      L.push(H('為什麼要等', ''));
      L.push('<b>因為 Rec 61 是 Strong 建議，而且不同變異對應的藥完全不同</b> —— ' +
        '先開 multikinase inhibitor 會讓之後的標靶選擇變複雜。');
      L.push('<b>台灣的檢測管道</b>：<b>NGS 30302B／30303B（2 萬／3 萬點）健保有給付，' +
        '附表明列甲狀腺癌的 BRAF V600E／BRAF nonV600E／RET fusion 三項</b>，' +
        '<b>每人每個癌別終生一次</b>。<b>BRAF 單項檢測 30107B</b> 的適應症也含甲狀腺癌' +
        '（但<b>不含髓質癌</b>）。');
      L.push('❗<b>但要先知道結果出來之後可能的落差</b>：' +
        '<b>驗到 BRAF V600E，健保 9.91 的 ' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') +
        ' 沒有甲狀腺適應症；驗到 RET 融合，' + NR('selpercatinib') + ' 與 ' + NR('pralsetinib') +
        ' 健保 0 筆。</b><b>只有 NTRK 融合走得到健保（larotrectinib 9.95）。</b>' +
        '<b>檢測前就該把這件事和病人講清楚。</b>');
      L.push('<b>若疾病進展快到不能等</b>：可先依 Rec 62 起始 <b>lenvatinib</b>' +
        '（健保 9.63.1 給付，分化型、放射碘難治），之後再依結果調整。');
    } else if (S.dmol === 'none') {
      title = '放射碘難治 · <b>沒有可標靶的變異</b><br>→ lenvatinib 為第一線首選（Strong／High）';
      L.push(H('主建議', 'Rec 62'));
      L.push('<b>「MKI therapy with either lenvatinib or sorafenib is recommended. In most cases, ' +
        '<u>lenvatinib is the preferred first-line MKI</u>.」（Strong recommendation, <u>High</u> ' +
        'certainty evidence）</b>');
      L.push('<b>第一線：<span class="rx">lenvatinib</span></b>（健保 9.63.1，' +
        '分化型、放射碘難治，須事前審查、每次療程 3 個月）。');
      L.push('<b>替代：<span class="rx">sorafenib</span></b>（健保 9.34.3，同樣條件）。');
      L.push('❗<b>健保對這兩個藥只寫「不得合併使用」，<u>沒有</u>先後互斥</b> —— ' +
        '<b>肝細胞癌那邊的「擇一給付、不得互換、失敗後不得申請後線」規則不適用於甲狀腺癌，不要照搬。</b>');
      L.push(H('二線', ''));
      L.push('<b><span class="rx">cabozantinib</span></b>（健保 9.74.2，<b>114/8/1 起</b>）：' +
        '條文逐字「適用於 12 歲以上<b>曾接受 VEGFR 標靶治療後惡化</b>、放射碘治療無效或不適用放射碘治療的' +
        '局部晚期或轉移性<b>分化型</b>甲狀腺癌病人」。' +
        '<b>須事前審查，每次療程 3 個月、每 3 個月評估，每日限用 1 粒。</b>');
      L.push(EV('<b>試驗數字</b>：<b>SELECT</b>（lenvatinib，PMID 25671254）與 <b>DECISION</b>' +
        '（sorafenib，PMID 24768112）是這兩個藥的依據。' +
        '❗<b>SELECT 用的是 99% CI 不是 95%</b>。' +
        '<b>COSMIC-311</b>（cabozantinib 二線，PMID 34237250）' +
        '❗<b>其主要終點 ORR 在期中分析<u>未達</u>預設的 α = 0.01</b>，' +
        '且 ORR 用 99% CI、PFS 用 96% CI。延長追蹤（PMID 36259380）的中位 PFS 為 11.0 對 1.9 個月。'));
      L.push('<b>沒有可標靶變異，不代表不用驗</b> —— Rec 61 的檢測本身就是為了排除這件事。');
    } else if (S.dmol === 'ntrk') {
      title = '放射碘難治 · <b>NTRK 1／3 融合</b><br>→ 這是唯一走得到台灣健保的標靶路';
      L.push(H('主建議', ''));
      L.push('<b><span class="rx">larotrectinib</span></b> —— ' +
        '<b>健保 9.95.3(5) 的條文明列「甲狀腺癌」</b>，須 NTRK 基因融合，' +
        '<b>須事前審查，每次療程 12 週</b>。');
      L.push('❗<b>但條文有一個容易卡住的前提</b>：要求' +
        '<b>「沒有合適的替代治療選項（<u>包含免疫檢查點抑制劑</u>）」</b> —— ' +
        '<b>審查時可能被質疑為何不先用 lenvatinib。申請前要先想好理由。</b>');
      L.push('❗<b>' + NR('entrectinib') + ' 在台灣健保只給 ROS-1 陽性非小細胞肺癌</b>' +
        '（9.93），雖然它的藥證有泛實體腫瘤的 NTRK 適應症。' +
        '<b>NTRK 融合的甲狀腺癌要走健保，只能用 larotrectinib。</b>');
      L.push(EV('依據是 <b>Waguespack SG et al. Eur J Endocrinol 2022;186:631-643（PMID 35333737）</b>，' +
        'TRK 融合甲狀腺癌的 larotrectinib 系列。'));
    } else if (S.dmol === 'ret') {
      title = '放射碘難治 · <b>RET 融合</b><br>→ 藥在台灣拿得到，但健保 0 筆';
      L.push(H('主建議', ''));
      L.push('<b><span class="rx">selpercatinib</span></b>（Retsevmo 銳癌寧，衛部藥輸字第028331／028332號）' +
        '或 <b><span class="rx">pralsetinib</span></b>（Gavreto 普吉華，衛部藥輸字第028393號）。');
      L.push('❗<b>兩個都是「有藥證、健保 0 筆」</b> —— ' +
        '<b>健保三處查詢全 0 筆：沒有健保藥品代號、沒有支付價、沒有給付規定條文。全額自費。</b>' +
        'pralsetinib 的審議歷程是 115/4/7 完成審議（同意給付）→ <b>115/7/28 結案（其他原因）</b>。');
      L.push('<b>台大處方集兩張卡都有</b>（selpercatinib 為常規品項、pralsetinib 標「專案」），' +
        '<b>所以是「院內調得到、要自費」而不是「拿不到」。</b>');
      L.push('❗<b>檢測與藥的落差就在這裡</b>：<b>NGS 附表明列甲狀腺癌的 RET fusion 一項、健保給付檢測</b>，' +
        '<b>但驗出來之後對應的藥沒有健保。</b><b>驗之前要先把這件事講清楚。</b>');
      L.push(EV('依據是 <b>LIBRETTO-001</b>（selpercatinib，Wirth LJ, NEJM 2020;383:825-835，PMID 32846061）' +
        '與 <b>ARROW</b>（pralsetinib，PMID 34118198）。' +
        '❗<b>搜尋 LIBRETTO-531 時第一個跳出來的 PMID 38201566 其實是 LIBRETTO-001 的探索性分析</b>，' +
        'LIBRETTO-531 的正確 PMID 是 <b>37870969</b>（Hadoux J, NEJM 2023;389:1851-1861），' +
        '而且那是<b>髓質癌</b>的第一線試驗，不是分化型。'));
    } else {
      title = '放射碘難治 · <b>BRAF V600E 突變</b><br>→ 指引承認可用，但台灣健保沒有這條路';
      L.push(H('指引怎麼寫', 'Rec 61 narrative'));
      L.push('<b>BRAF V600E 是 ATA 2025 明列的三個可標靶變異之一</b>' +
        '（另兩個是 NTRK 1／3 融合與 RET 融合），' +
        '<b>Rec 61 要求在開始全身治療前就驗出來</b>。');
      L.push('❗<b>台灣的落差</b>：<b>健保 9.91 的 ' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') +
        ' 條文只有黑色素瘤與 BRAF V600E 轉移性非小細胞肺癌，<u>沒有任何甲狀腺適應症</u></b>。' +
        '<b>分化型甲狀腺癌要用 BRAF／MEK 抑制劑，在台灣是自費或走個案事前審查。</b>');
      L.push('<b>所以實務上這一格常常仍是走 <span class="rx">lenvatinib</span></b>' +
        '（健保 9.63.1，Rec 62 的 first-line preferred MKI），' +
        '<b>二線 <span class="rx">cabozantinib</span></b>（健保 9.74.2）。' +
        '<b>BRAF 標靶留作自費選項或臨床試驗。</b>');
      L.push('❗<b>注意分化型與未分化癌在這一格的差別</b>：' +
        '<b>未分化癌（ATC）的 BRAF V600E 有 ATA 2021 的 Strong 建議（Rec 20）支持用 BRAF／MEK 抑制劑</b>，' +
        '<b>但分化型沒有對應的強建議</b> —— ATA 2025 只是把它列為可標靶的變異之一。');
      L.push('<b>檢測本身健保有給付</b>：<b>BRAF 檢測 30107B 的適應症明文含甲狀腺癌（不含髓質癌）</b>，' +
        '<b>NGS 附表也列了甲狀腺癌的 BRAF V600E 與 BRAF nonV600E 兩項。</b>');
    }
    fill('ty_r_drair', cls, title, L,
      'ATA 2025 Recommendation 61、62；健保藥品給付規定 9.63／9.34／9.74／9.95／9.91 與' +
      '《醫療服務給付項目及支付標準》30107B、30302B／30303B，查詢日 2026-09-13。' +
      '⚠ 台大醫院無甲狀腺癌診療指引，本頁全部為院外實證。',
      nhiReference() + gradeReference());
    fu('ty_f_drair', '<li><b>每次事前審查的週期就是實際的追蹤節奏</b>：' +
      '<b>lenvatinib 與 sorafenib 每 3 個月、cabozantinib 每 3 個月並須評估無惡化、' +
      'larotrectinib 每 12 週。</b></li>' +
      '<li><b>TSH 目標維持在低於正常參考範圍</b>（結構未完全緩解，Table 9）。</li>' +
      '<li>❗<b>每人每個癌別的 NGS 健保給付終生只有一次</b> —— ' +
      '要驗就一次驗完整的套組，不要分次。</li>');
  }

  /* ==========================================================
     6. 髓質癌 MTC
     ========================================================== */
  var PHEO = '❗<b>開刀之前一定要先排除 pheochromocytoma</b>（ATA 2015 Rec 38、39）。<br>' +
    '正文逐字：<b>「An undiagnosed PHEO in a patient undergoing a thyroidectomy <u>may result in ' +
    'substantial morbidity and even death</u>. Thus, in patients with hereditary MTC, it is critical ' +
    'to exclude the presence of a PHEO prior to thyroidectomy…」</b><br>' +
    '<b>Rec 38（Grade C）</b>：MEN2A 或 MEN2B 且病理確診髓質癌者，' +
    '<b>「<u>regardless of age and presenting symptoms</u> must have a PHEO excluded prior to any ' +
    'interventional procedure」</b>；計畫懷孕或已懷孕的女性也要排除，' +
    '若查到<b>盡可能在第三孕期之前切除</b>。<br>' +
    '<b>Rec 39（Grade B）</b>：<b>「<u>If they coexist, a PHEO should be removed prior to surgery for ' +
    'either MTC or HPTH.</u>」—— 兩者並存時，嗜鉻細胞瘤要先開。</b><br>' +
    '❗<b>還不知道是偶發還是遺傳性時</b>：正文明文' +
    '<b>「a PHEO should be excluded prior to thyroidectomy <u>if determination of the RET status takes ' +
    'an inordinate amount of time</u>」—— 不要為了等基因報告而延後排除嗜鉻細胞瘤。</b><br>' +
    '<b>篩檢方式</b>：血漿游離 metanephrines／normetanephrines，或 24 小時尿液 metanephrines／' +
    'normetanephrines；生化陽性再做 CT 或 MRI。<br>' +
    '<b>副甲狀腺亢進（HPTH）的順序不同</b>：<b>和甲狀腺切除<u>同一次手術</u>處理</b>' +
    '（Figure 1 逐字 "Present, Rx at time of TTX"），<b>但仍排在嗜鉻細胞瘤之後</b>。' +
    'Rec 43：<b>只切除肉眼腫大的副甲狀腺</b>；四顆都腫大時可做次全切除或全切除加異位自體移植。';

  var RETTEST = '<b>所有髓質癌都要驗 germline RET</b>（Rec 21，Grade B）：' +
    '<b>「Patients presenting with a thyroid nodule and a cytological or histological diagnosis of MTC ' +
    'should have a physical examination, determination of serum levels of Ctn and CEA, and ' +
    '<u>genetic testing for a RET germline mutation</u>.」</b><br>' +
    '<b>Rec 6（Grade B）</b>：<b>看起來是偶發性的髓質癌也要驗</b>。<br>' +
    '<b>Rec 7（Grade B）</b>：要提供遺傳諮詢與檢測的四種對象 —— ' +
    '<b>已證實遺傳性髓質癌病人的一等親；有 MEN2B 典型表現型的嬰幼兒的父母；' +
    '皮膚苔癬樣澱粉沉著症（CLA）病人；有 Hirschsprung 病且帶 exon 10 突變的嬰幼兒，' +
    '以及帶 exon 10 突變、有 Hirschsprung 相關症狀的 MEN2A 成人。</b><br>' +
    '❗<b>MEN2B 的嬰兒要盡早驗</b>：正文逐字<b>「macroscopic MTC and nodal metastases may occur ' +
    'during the <u>first year of life</u>… genetic testing should be done <u>soon after birth</u> in ' +
    'at-risk infants」</b>。';

  function renderMtcPreop() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗這三件事要排在手術之前', ''));
    L.push(PHEO);
    L.push(RETTEST);
    L.push(H('手術範圍', 'ATA 2015 Rec 24、25、26'));
    L.push('<b>Rec 24（Grade B）</b>：超音波無頸部淋巴結轉移、無遠端轉移者 —— ' +
      '<b>「should have a <u>total thyroidectomy and dissection of the lymph nodes in the central ' +
      'compartment (level VI)</u>」</b>。<b>中央區廓清是標配，不是選配。</b>');
    L.push('<b>Rec 26（Grade C）</b>：疾病侷限於頸部與頸部淋巴結者 —— ' +
      '<b>全甲狀腺切除 ＋ 中央區（level VI）廓清 ＋ 受侵犯的側頸區（levels II–V）廓清</b>。');
    L.push('❗<b>Rec 25 是全份指引唯一一條「委員會沒有達成共識」的建議</b>（Grade I）：' +
      '<b>「dissection of lymph nodes in the lateral compartments (levels II–V) <u>may be considered ' +
      'based on serum Ctn levels</u>. <u>The Task Force did not achieve consensus on this ' +
      'recommendation.</u>」</b> —— <b>這一格本來就沒有標準答案，寫病歷時要說明是依哪一派做的。</b>');

    if (S.mctn === 'lt20') {
      cls = 'rec-nonop';
      title = '術前 calcitonin <b>&lt; 20 pg/mL</b><br>→ 淋巴結轉移風險幾乎為零，不需要預防性側頸廓清';
      L.push(H('這個數字代表什麼', '正文 p.581–582'));
      L.push('<b>「there was <u>virtually no risk of lymph node metastases</u> when the preoperative ' +
        'serum Ctn level was less than 20 pg/mL（normal reference range &lt; 10 pg/mL）」</b>');
      L.push('<b>做法：全甲狀腺切除 ＋ 中央區（level VI）廓清</b>（Rec 24）。' +
        '<b>側頸不需要預防性廓清。</b>');
    } else if (S.mctn === 'c20') {
      title = '術前 calcitonin <b>20–200 pg/mL</b><br>→ 有一派主張同側中央區與同側側頸都要廓清';
      L.push(H('這個數字代表什麼', '正文 p.581–582'));
      L.push('<b>calcitonin 分別超過 20、50、200、500 pg/mL，對應的轉移範圍依序是：' +
        '<u>同側中央區與同側側頸 → 對側中央區 → 對側側頸 → 上縱膈</u>。</b>');
      L.push('❗<b>指引明講這裡有「two schools of thought」</b>，其中一派主張：' +
        '<b>「elective dissection of US-normal <u>ipsilateral central and ipsilateral lateral</u> neck ' +
        'compartments is indicated in patients with basal serum Ctn levels above 20 pg/mL」</b>。' +
        '<b>這是其中一派的立場，不是指引的統一建議</b>（對照 Rec 25 未達共識）。');
      L.push('<b>另一派的做法是只做影像上看得到的（治療性廓清）。</b>' +
        '<b>兩派都要在病歷寫清楚依據。</b>');
    } else if (S.mctn === 'c200') {
      cls = 'rec-urgent';
      title = '術前 calcitonin <b>&gt; 200 且 ≤ 500 pg/mL</b><br>→ 對側頸部廓清要納入考慮（這條有明文）';
      L.push(H('❗這一格有明文寫進建議條文', 'Rec 26'));
      L.push('<b>「When preoperative imaging is positive in the ipsilateral lateral neck compartment ' +
        'but negative in the contralateral neck compartment, <u>contralateral neck dissection should be ' +
        'considered if the basal serum calcitonin level is greater than 200 pg/mL</u>.」</b>');
      L.push('<b>也就是說：影像只看到同側、但 calcitonin &gt; 200，對側也要考慮開。</b>' +
        '<b>這是少數把 pg/mL 數字寫進正式建議條文的地方。</b>');
      L.push('<b>正文另有一派主張</b>：<b>「elective dissection of an US-normal <u>contralateral ' +
        'lateral</u> neck compartment is indicated when the basal serum Ctn level is greater than ' +
        '200 pg/mL」</b>。');
    } else {
      cls = 'rec-urgent';
      title = '術前 calcitonin <b>&gt; 500 pg/mL</b><br>→ 開刀前要先做完整的遠端轉移影像';
      L.push(H('❗這一格的重點是「先找遠端轉移」', 'Rec 22，Grade C'));
      L.push('<b>所有 serum calcitonin &gt; 500 pg/mL 者都要做</b>：' + SUB([
        '<b>頸部與胸部的對比增強 CT</b>',
        '<b>三時相肝臟 CT 或肝臟 MRI</b>',
        '<b>軸心骨的 MRI 與骨骼掃描（bone scintigraphy）</b>']));
      L.push('<b>理由（正文 p.580）</b>：<b>「no distant metastases were detected when the baseline ' +
        'serum Ctn level was <u>less than 500 pg/mL</u>」</b> —— ' +
        '<b>500 以下幾乎不會有遠端轉移，500 以上才需要全套影像。</b>');
      L.push('❗<b>Rec 23（Grade E，反對）</b>：<b>不建議用 FDG-PET/CT 或 F-DOPA-PET/CT 偵測遠端轉移。</b>' +
        '<b>Grade E 是明確的反對建議，不是「證據不足」。</b>');
      L.push('<b>calcitonin &gt; 500 也對應到上縱膈的轉移範圍</b>（正文的四段對照）。');
    }
    L.push(H('術後立刻要處理的兩件事', ''));
    L.push('<b>Rec 31（Grade B）：術後 4–6 週測 TSH。' +
      '❗<u>髓質癌不需要壓抑 TSH</u>，只要維持 euthyroid</b> —— ' +
      '<b>這和分化型完全不同，不要把分化型的 TSH 抑制邏輯套過來。</b>');
    L.push('❗<b>Rec 51（Grade E，反對）：術後不做放射碘</b>，' +
      '除非轉移病灶裡混有乳突癌或濾泡癌的成分。<b>髓質癌來自 C 細胞，不吃碘。</b>');
    L.push('<b>再手術的條件（Rec 29，Grade C）</b>：初次廓清不足者，' +
      '<b>若術前 basal calcitonin &lt; 1000 pg/mL 且初次手術取出的轉移淋巴結 ≤ 5 顆</b>，' +
      '可考慮再次做 compartment-oriented 廓清。');
    fill('ty_r_mpreop', cls, title, L,
      'ATA 2015 髓質癌指引（Wells SA Jr et al. Thyroid 2015;25:567-610，PMID 25810047）' +
      'Recommendation 21–26、29、31、38、39、43、51 與正文 p.580–582、p.587。' +
      '<b>已查證 2015 之後 ATA 無新版髓質癌指引</b>（PubMed 三種檢索式與 ATA 官網指引頁）。' +
      '⚠ 台大醫院無甲狀腺癌診療指引。',
      nhiReference());
  }

  function renderMtcPostop() {
    var L = [], cls = 'rec-elective', title = '', fuHtml = '';
    L.push(H('術後第一次抽血的時間', 'Rec 46，Grade C'));
    L.push('<b>「Serum levels of Ctn and CEA should be measured <u>3 months postoperatively</u>…」</b>');

    if (S.mpost === 'und') {
      cls = 'rec-nonop';
      title = '術後 calcitonin <b>測不到或在正常範圍</b><br>→ 追蹤節奏降下來';
      L.push('<b>Rec 46 後半逐字</b>：<b>「…and if <u>undetectable or within the normal range</u>, they ' +
        'should be measured <u>every 6 months for 1 year, and then yearly thereafter</u>.」</b>');
      L.push('<b>Figure 3 的對應分支</b>：<b>「If physical exam and US remain normal, evaluate every ' +
        '6 months for 1 year, then annually」</b>。');
      L.push('<b>要同時追的是理學檢查與頸部超音波</b>，不是只看數字。');
      fuHtml = '<li><b>calcitonin 與 CEA：前 1 年每 6 個月，之後每年一次。</b></li>' +
        '<li><b>TSH 維持 euthyroid 即可，不壓抑</b>（Rec 31）。</li>' +
        '<li>❗<b>之後任何一次 calcitonin 進展性上升超過 150 pg/mL，就要啟動影像檢查</b>（正文 p.583）。</li>';
    } else if (S.mpost === 'lt150') {
      title = '術後 calcitonin <b>升高但 &lt; 150 pg/mL</b><br>→ 先做理學檢查與頸部超音波，不必全套影像';
      L.push(H('主建議', 'Rec 47，Grade C'));
      L.push('<b>「Patients with elevated postoperative serum Ctn levels <u>less than 150 pg/mL</u> ' +
        'should have a <u>physical examination and US of the neck</u>. If these studies are negative ' +
        'the patients should be followed with physical examinations, measurement of serum levels of ' +
        'Ctn and CEA, and <u>US every 6 months</u>.」</b>');
      L.push('❗<b>這一格不要跳去做全身影像</b> —— ' +
        '<b>指引把全套影像留給 &gt; 150 pg/mL 那一格。</b>');
      L.push('<b>同時開始算 doubling time</b>（見下方追蹤）。');
      fuHtml = '<li><b>理學檢查與頸部超音波每 6 個月</b>（Rec 47）。</li>' +
        '<li>❗<b>calcitonin 與 CEA 的頻率，建議條文與流程圖不一致</b>：' +
        '<b>Rec 49（Grade B）寫「at least <u>every 6 months</u>」，但 Figure 3 兩處都寫' +
        '「every <u>3 to 6 months</u>」。</b><b>指引自己沒有調和，取較密的比較安全。</b></li>' +
        '<li><b>calcitonin 一旦進展性上升超過 150 pg/mL 就要啟動影像</b>（正文 p.583）。</li>';
    } else {
      cls = 'rec-urgent';
      title = '術後 calcitonin <b>&gt; 150 pg/mL</b><br>→ 要做全套影像找病灶';
      L.push(H('主建議', 'Rec 48，Grade C'));
      L.push('<b>「If the postoperative serum Ctn level <u>exceeds 150 pg/mL</u> patients should be ' +
        'evaluated by imaging procedures, including…」</b>' + SUB([
        '<b>頸部超音波</b>', '<b>胸部 CT</b>',
        '<b>對比增強肝臟 MRI，或三時相對比增強肝臟 CT</b>',
        '<b>骨骼掃描（bone scintigraphy）</b>',
        '<b>骨盆與軸心骨的 MRI</b>']));
      L.push('<b>Figure 3 在這一格之後的走法</b>：' +
        '<b>影像陽性 → 考慮手術或體外放射治療；全身性進展者用全身治療（優先 TKI）或臨床試驗。</b>' +
        '<b>影像陰性 → 理學檢查與重複影像每 6–12 個月，calcitonin 與 CEA 每 3–6 個月。</b>');
      L.push('❗<b>再次頸部大手術之前可以考慮先做肝臟探查</b>（Rec 54，Grade C）：' +
        '正文的數字是<b>41 人中有 8 人（19.5%）由腹腔鏡發現 &lt; 5 mm 的白色肝結節，' +
        '而 CT 只抓到其中 1 人</b>。<b>目的是避免做了大手術才發現已有隱匿肝轉移。</b>');
      fuHtml = '<li><b>calcitonin 與 CEA 每 3–6 個月（Figure 3）或至少每 6 個月（Rec 49）</b>，' +
        '用來算 doubling time。</li>' +
        '<li><b>影像陰性者，理學檢查與影像每 6–12 個月。</b></li>' +
        '<li>❗<b>找到病灶不等於要立刻給全身治療</b> —— 見步驟 2 的「進展性或轉移性」那一格。</li>';
    }
    L.push(H('❗兩個指標都要算 doubling time', 'Rec 49，Grade B'));
    L.push('<b>「In patients with detectable serum levels of Ctn and CEA following thyroidectomy, ' +
      'the levels of the markers should be measured at least every 6 months to determine their ' +
      '<u>doubling times</u>.」</b>');
    L.push('<b>calcitonin 與 CEA 的 doubling time 在 80% 的病人一致</b>；不一致時' +
      '<b>只要其中一個 ≤ 25 個月就可能有進展</b>。正文逐字：' +
      '<b>「The clinician should determine the doubling times of <u>both</u> markers.」</b>');
    L.push('<b>怎麼算</b>（正文 p.591）：<b>「Reliable estimates are obtained using <u>at least four ' +
      'data points over a minimum of 2 years</u>; however, doubling times less than 6 months can be ' +
      'reliably estimated within the first 12 months postoperatively.」</b>' +
      '<b>ATA 官網有線上計算器。</b>');
    fill('ty_r_mpostop', cls, title, L,
      'ATA 2015 髓質癌指引 Recommendation 46、47、48、49、54 與 Figure 3（本頁已 render 圖檔判讀）、' +
      '正文 p.583、p.590–591。⚠ 台大醫院無甲狀腺癌診療指引。',
      nhiReference());
    if (fuHtml) fu('ty_f_mpostop', fuHtml);
  }

  function renderMtcAdv() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.madv === 'stable') {
      cls = 'rec-nonop';
      title = '低量轉移且穩定，或只有腫瘤指標上升<br>→ ❗<b>不要給全身治療</b>';
      L.push(H('❗這一格有明文禁止', 'Rec 53，Grade C'));
      L.push('<b>「<u>Systemic therapy should not be administered to patients who have increasing ' +
        'serum Ctn and CEA levels but no documented metastatic disease.</u> Nor should systemic ' +
        'therapy be administered to patients with <u>stable low-volume metastatic disease</u>, as ' +
        'determined by imaging studies and serum Ctn and CEA <u>doubling times greater than 2 years</u>.」</b>');
      L.push('<b>兩種情況都不給</b>：' + SUB([
        '<b>指標在升，但影像找不到轉移病灶</b>',
        '<b>有低量轉移但穩定，而且 calcitonin 與 CEA 的 doubling time 都 &gt; 2 年</b>']));
      L.push('<b>正文講得更白</b>：<b>「Even though the presence of a somatic RET codon M918T mutation ' +
        'in a patient\'s tumor or rapid doubling times of serum Ctn and CEA levels are useful ' +
        'prognostic indicators, <u>it is best to do nothing in asymptomatic patients with no ' +
        'detectable metastases</u>.」</b>');
      L.push('❗<b>舊版流程的一個錯誤要改正</b>：常見的「&lt; 6 個月／6–24 個月／&gt; 24 個月」三段式' +
        '<b>不是處置門檻</b>，那是正文引用 <b>Barbet 2005</b> 的<b>存活率資料</b>：' +
        '<b>doubling time &lt; 6 個月者 5 年與 10 年存活 25% 與 8%；6–24 個月者為 92% 與 37%；' +
        '&gt; 24 個月者在研究結束時全數存活。</b>' +
        '<b>指引真正用來做決策的門檻只有一個：doubling time &gt; 2 年。</b>');
      L.push(EV('同段另有一條容易被忽略的：<b>Rec 54（Grade C）</b> —— ' +
        '再次頸部大手術之前可考慮腹腔鏡或開腹的肝臟探查與切片，以排除隱匿轉移。'));
    } else {
      cls = 'rec-urgent';
      title = '影像證實進展或有症狀<br>→ 可以開始全身治療；但台灣的選項被卡得很窄';
      L.push(H('指引時代的兩個藥', ''));
      L.push('<b><span class="rx">vandetanib</span></b>（ZETA，Wells SA, JCO 2012，PMID 22025146）' +
        '與 <b><span class="rx">cabozantinib</span></b>（EXAM，Elisei R, JCO 2013，PMID 24002501）。');
      L.push(EV('❗<b>ZETA 常被引錯的數字</b>：' +
        '<b>vandetanib 組的「30.5 個月」是 Weibull 模型的<u>預測值</u>，不是觀察到的中位無惡化存活</b>' +
        '（該組當時未達中位）；<b>安慰劑組的 19.3 個月才是實測值</b>。' +
        'ORR 45% 對 13%（OR 5.48）來自全文 Table 2，不在摘要裡。'));
      L.push(H('指引之後才有的 RET 抑制劑', ''));
      L.push('<b><span class="rx">selpercatinib</span></b> —— ' +
        '<b>LIBRETTO-531</b>（Hadoux J, NEJM 2023;389:1851-1861，<b>PMID 37870969</b>）是' +
        '<b>RET 突變髓質癌的第一線</b>隨機試驗，對照組是醫師選擇的 vandetanib 或 cabozantinib。' +
        '<b>這是 ATA 2015 之後才出現的證據，指引本身沒有涵蓋。</b>');
      L.push('<b><span class="rx">pralsetinib</span></b>（ARROW，PMID 34118198）。');
      L.push(H('❗台灣的三個卡點', '查詢日 2026-09-13'));
      L.push('<b>① 健保唯一給付髓質癌的是 <span class="rx">vandetanib</span>（9.86）</b>：' +
        '限「無法進行手術切除的局部侵犯或轉移性甲狀腺髓質癌，<b>並且為症狀性及疾病侵襲性</b>的患者」，' +
        '<b>須事前審查，每次療程 6 個月</b>。' +
        '❗<b>劑量陷阱：條文寫「每日最大 300 毫克」，但 300 mg 的藥證已於 2023/12/26 自請註銷、' +
        '健保支付價 113/04/01 歸零 → 實務上只能用 3 顆 100 mg 湊。</b>');
      L.push('<b>② ' + NR('cabozantinib') + ' 在台灣進不了髓質癌</b>：' +
        '<b>健保 9.74.2 與藥證適應症都只寫「分化型」</b>，' +
        '<b>而髓質癌專用的 Cometriq 膠囊台灣沒有藥證（0 筆）。</b>' +
        '<b>這是台灣與國際做法差最多的一格。</b>');
      L.push('<b>③ RET 抑制劑有藥證但健保 0 筆</b>：' +
        '<b><span class="rx">selpercatinib</span>（Retsevmo 銳癌寧）與 ' +
        '<span class="rx">pralsetinib</span>（Gavreto 普吉華）都要全額自費。</b>' +
        '❗<b>而且 pralsetinib 的台灣適應症只有「RET <u>融合</u>甲狀腺癌」與非小細胞肺癌，' +
        '<u>沒有</u>「RET <u>突變</u>髓質癌」</b> —— ' +
        '<b>而髓質癌最常見的正是 RET 突變而非融合，所以它在台灣連仿單內使用都不成立。</b>' +
        '<b>selpercatinib 的台灣適應症含甲狀腺癌，是這條路比較站得住的一個。</b>');
      L.push('❗<b>檢測與藥的落差</b>：<b>NGS 附表 2.2.1 明列「甲狀腺髓質癌（RET mutation）」一行、' +
        '健保給付檢測</b>，<b>但驗出來之後對應的藥沒有健保。</b>' +
        '（另注意 <b>BRAF 單項檢測 30107B 的適應症明文<u>排除</u>髓質癌</b>。）' +
        '<b>驗之前要先把這件事講清楚。</b>');
    }
    fill('ty_r_madv', cls, title, L,
      'ATA 2015 髓質癌指引 Recommendation 49、53、54 與正文 p.590–592；' +
      'ZETA（PMID 22025146）、EXAM（PMID 24002501）、LIBRETTO-531（PMID 37870969）、ARROW（PMID 34118198）；' +
      '健保藥品給付規定 9.86、9.74 與食藥署許可證資料，查詢日 2026-09-13。' +
      '⚠ 台大醫院無甲狀腺癌診療指引。',
      nhiReference());
    fu('ty_f_madv', '<li><b>calcitonin 與 CEA 至少每 6 個月（Rec 49），Figure 3 寫每 3–6 個月</b>，' +
      '<b>兩個指標都要算 doubling time。</b></li>' +
      '<li><b>vandetanib 的健保事前審查每次 6 個月</b>，這就是實際的追蹤節奏。</li>' +
      '<li>❗<b>TSH 只要維持 euthyroid，不做抑制</b>（Rec 31）。</li>');
  }

  /* ==========================================================
     7. 未分化癌 ATC
     ========================================================== */
  function renderAtcUrgent() {
    fill('ty_r_aurg', 'rec-urgent',
      '未分化癌 · <b>先做這四件事</b><br>→ 氣道、診斷、分子檢測、治療目標討論',
      [H('① 氣道 —— 但不是先做氣切', 'Good Practice Statement 7'),
      '<b>「In patients <u>without impending airway compromise</u>, we advise <u>against preemptive ' +
        'tracheostomy placement</u>.」</b>',
      '正文逐字：<b>「there is generally <u>no need</u> for creation of a surgical airway, ' +
        '<u>even in patients with unresectable ATC</u>」</b> —— ' +
        '<b>氣切管與分泌物會造成相當大的不適。</b>',
      '❗<b>但立場不是一刀切</b>：<b>急性阻塞時「there should be a <u>low threshold</u> for ' +
        'tracheostomy」</b>；而且<b>「tracheostomy should be part of the standard consent form in most ' +
        'patients undergoing any significant resection for ATC」</b> —— ' +
        '<b>不預防性做，但同意書要先簽。</b>',
      '❗<b>真要做的時候的三個細節</b>：' + SUB([
        '<b>「Tracheostomy is best performed under anesthesia with preoperative intubation, if possible.」</b>',
        '<b>「An attempt to perform the tracheostomy either in the ward or in the emergency room ' +
          'under local anesthesia <u>should be avoided</u>.」</b>',
        '<b>常需要先做 isthmusectomy 或氣管前腫瘤減積才進得去；</b>' +
          '<b>必要時經環甲膜的較高位置切開（cricothyroidotomy）可能是繞過阻塞的最佳選擇。</b>']),
      EV('<b>指引自己引的數字</b>：一個系列中 <b>19% 以 stridor 表現、另有 23% 在放療期間出現顯著氣道症狀、' +
        '最終 36% 死於氣道阻塞</b>；另一系列 <b>40% 需要氣切</b>。' +
        '❗<b>但氣切本身與較短存活相關</b>（可能反映疾病較侵襲，也可能是延後了放療）；' +
        '<b>氣切可能讓後續放療與標靶治療延後 2 週以上。</b>'),
      '<b>每位病人初診時都要評估聲帶</b>（Recommendation 7，strong／low），之後依症狀變化再評。' +
        '<b>評估方式：內視鏡 ＋ 對比 CT 或 MRI；CT 因為掃描時間短可能更合適；' +
        '而且要把內視鏡延伸到氣管做纖維內視鏡評估。</b>',
      H('② 診斷 —— 但不要為了切片延後治療', 'GPS 1、Recommendation 2'),
      '<b>Recommendation 2（strong／low）</b>：<b>「Every effort should be made to establish a ' +
        'diagnosis <u>via biopsy</u> before proceeding with surgical resection, as surgical resection ' +
        'may be inappropriate.」</b>',
      '❗<b>GPS 1</b>：<b>「In the event that biopsy of a <u>suspected metastatic</u> disease site is ' +
        'clinically indicated, <u>primary management of ATC should not be delayed</u> until biopsy is ' +
        'obtained.」</b> —— <b>原發灶要確診，但不要等轉移灶的切片。</b>',
      '<b>GPS 2</b>：<b>「All critical appointments and assessments that are required before primary ' +
        'treatment of ATC should be prioritized and completed <u>as rapidly as possible</u>.」</b>',
      H('③ BRAF V600E —— 要快，但指引沒有給天數', 'Recommendation 4、5'),
      '<b>Rec 4（strong／<u>moderate</u>，全文僅兩條拿到 moderate 的其中一條）</b>：' +
        '<b>「Once ATC diagnosis is considered, assessment of BRAF V600E mutation should be ' +
        '<u>expeditiously</u> performed by IHC and confirmed/expeditiously assessed by molecular testing.」</b>',
      '❗<b>指引全文沒有任何「N 天內」的 turnaround 目標</b> —— 用的是 expeditiously、' +
        'early-on、urgently 這些副詞。<b>全文唯一的檢測時效數字是講 NGS：' +
        '「targeted next-generation sequencing panels… usually offer results in <u>1–2 weeks</u>」，' +
        '而全外顯子與全轉錄體分析「usually become available in <u>several weeks</u>」，' +
        '對這個快速進展的癌太慢。</b>' +
        '<b>若院內要訂「幾天內」，那是自訂標準，不可掛 ATA 名義。</b>',
      '<b>做法</b>：<b>「BRAF IHC provides a rapid result and if positive NGS testing may not be ' +
        'necessary. If BRAF IHC is negative, NGS should be performed as it is more sensitive.」</b>' +
        '組織不足時可考慮 <b>cfDNA 液態切片</b>。',
      '<b>BRAF V600E 在未分化癌的盛行率 50–70%</b>；' +
        '<b>病理標本中若同時存在乳突癌成分，超過 90% 帶 BRAF V600E。</b>',
      H('④ 治療目標討論 —— 要「盡快」開始', 'Good Practice Statement 5'),
      '<b>「A "goals-of-care" discussion should be initiated with the patient <u>as soon as possible</u>. ' +
        '…a candid session should be conducted in which there is <u>full disclosure</u> of the ' +
        'potential risks and benefits of various treatment options, <u>updated frequently</u>… ' +
        'Treatment options discussed <u>should include all end-of-life options, such as hospice and ' +
        'palliative care</u>. <u>Patient preferences should guide clinical management.</u>」</b>',
      '<b>Recommendation 9（strong／low）</b>：<b>治療團隊「should include palliative care expertise ' +
        'at <u>every stage</u> of patient management」</b> —— <b>不是末期才會診。</b>',
      '❗<b>GPS 14</b>：<b>「As prognosis is dire in metastatic and progressive ATC, ' +
        '<u>best supportive care (hospice) should also be discussed as an option</u>.」</b>' +
        'Table 1 第 8 點：<b>「Keep hospice/end-of-life care discussions in the <u>foreground</u>」</b>、' +
        '<b>「hospice should <u>always</u> be presented among care options」</b>。',
      '<b>GPS 4（已被勘誤修改）</b>：鼓勵病人訂立<b>預立醫療決定並指定代理人</b>，' +
        '含 <b>POLST</b> 文件。❗<b>原刊寫的是「POLST or MOST」，勘誤已把 MOST 全數刪除</b>' +
        '（PMC 版全文仍是未更正的舊文字）。' +
        '<b>要暫停 DNR 的情況也必須事先與病人討論。</b>',
      '<b>GPS 3</b>：對決策能力有疑慮時，應會診<b>身心科與／或臨床倫理</b>。',
      H('要先知道的預後數字', '指引自己引用'),
      '<b>歷史中位存活約 5 個月（5–6 個月），1 年整體存活約 20%。</b>',
      '❗<b>依分期的 1 年存活差距極大：IVA 72.7%、IVB 24.8%、IVC 8.2%</b>' +
        '（Akaishi et al., n = 100）—— <b>這組數字是門診說明時最實用的。</b>',
      '<b>多模式治療與緩和意向的對比：中位存活 21 個月對 3.9 個月（HR 0.32，p = 0.0006）</b>；' +
        '<b>IVB 次群為 22.4 個月對 4 個月（OR 0.12，CI 0.03–0.44，p = 0.0001），1 年存活 68% 對 0%。</b>',
      '❗<b>但同一研究的 IVC 次群「overall survival did not differ by therapy」</b> —— ' +
        '<b>效益集中在沒有遠端轉移的人身上。這一點在和 IVC 病人討論時必須誠實講。</b>'],
      'ATA 2021 未分化甲狀腺癌指引（Bible KC et al. Thyroid 2021;31:337-386，PMID 33728999）' +
      'Recommendation 2、4、5、7、9 與 Good Practice Statement 1、2、3、4、5、7、14、Table 1、Table 5。' +
      '⚠ 已查證 2021 之後無新版。⚠ 該指引有勘誤：GPS 4 刪除 MOST 只留 POLST。' +
      '⚠ 台大醫院無甲狀腺癌診療指引。',
      gradeReference());
  }

  function renderAtc() {
    var L = [], cls = 'rec-urgent', title = '';
    var st = S.astage, br = S.abraf;
    var stName = st === 'iva' ? 'IVA' : (st === 'ivb_res' ? 'IVB（可切除）' :
      (st === 'ivb_unres' ? 'IVB（無法切除）' : 'IVC'));
    var brName = br === 'pos' ? 'BRAF V600E 陽性' : (br === 'neg' ? 'BRAF V600E 陰性' : 'BRAF 結果未出');
    title = stName + ' · ' + brName + '<br>';

    if (st === 'iva' || st === 'ivb_res') {
      title += '→ 以手術為主，目標是 R0／R1，然後盡快接輔助治療';
      L.push(H('手術', 'Recommendation 12，strong／low'));
      L.push('<b>「For patients with confined (stage IVA/IVB) ATC in whom <u>R0/R1 resection is ' +
        'anticipated</u>, we <u>strongly recommend</u> surgical resection.」</b>');
      L.push('<b>Figure 1 的手術方框只有三條</b>：<b>「Goal: R0/R1 resection」、「Avoid debulking」、' +
        '「Avoid laryngectomy」</b>。');
      L.push('❗<b>Recommendation 13（strong／low）：根除性大範圍切除<u>一般不建議</u></b> —— ' +
        '<b>「Radical resection (including laryngectomy, tracheal resections, esophageal resections, ' +
        'and/or major vascular or mediastinal resections) is <u>generally not recommended</u> given the ' +
        'poor prognosis of ATC and should be considered <u>only very selectively</u>…」</b>');
      L.push('<b>Table 5 的可切除性判準（唯一的正式判準表）</b>：核心問題是' +
        '<b>「Is R0/R1 resection expected?」</b>，條件是' +
        '<b>「R0/R1 resection anticipated <u>without extensive visceral/vascular resection</u> ' +
        '(laryngectomy, arterial/tracheal resection, permanent tracheostomy <u>not anticipated</u>)」</b>。');
      L.push('❗<b>排除手術的條件</b>（Table 5）：' + SUB([
        '<b>病人的狀況、治療目標或決策能力不適合手術</b>',
        '<b>大量的未分化癌轉移（high-volume ATC metastases）</b> —— ' +
          '表註：<b>「coexistent metastatic DTC or <u>oligometastatic/low-volume</u> metastatic ATC ' +
          'should <u>not necessarily</u> preclude surgery」</b>',
        '<b>為了達到 R0／R1 需要做喉、氣管、雙側神經、食道或血管的大範圍切除，風險不可接受</b>',
        '❗<b>預期的術後恢復時間會擋到後續必須接上的治療（例如化放療）</b>']));
      L.push('<b>Table 1 第 5 點逐字</b>：<b>「surgical procedures <u>should not generate a wound or ' +
        'result in complications that would prevent chemotherapy and radiation onset</u> due to the ' +
        'risk of wound breakdown」</b> —— <b>開刀的成敗不只看切乾不乾淨，還看會不會擋到接下來的治療。</b>');
      L.push(H('❗術後的時間軸', 'GPS 8、GPS 10 與正文'));
      L.push('<b>GPS 8：「Radiation therapy should begin <u>no later than 6 weeks</u> after surgery.」</b>');
      L.push('<b>GPS 10：「Cytotoxic chemotherapy can be initiated <u>within 1 week</u> of surgery, ' +
        'providing sufficient healing, in anticipation of subsequent chemoradiation.」</b>');
      L.push('<b>正文更緊</b>：<b>放療計畫應在術後腫脹消退後盡快開始（約 2–3 週）</b>，' +
        '<b>「adjuvant therapy should preferentially be started <u>within 2–3 weeks</u> of the ' +
        'surgical date」</b>；治療計畫完成前可先用對穿野開始照，<b>而計畫完成應「less than 5 business days」</b>。');
      L.push(EV('實際世界的數字（指引引用）：<b>手術到化療的中位時間 19 天、手術到放療 27 天。</b>'));
      L.push(H('輔助治療', 'Recommendation 14、17、18'));
      L.push('<b>Rec 14（strong／low）</b>：R0 或 R1 切除後，體能狀態良好、無轉移、希望積極治療者，' +
        '應提供 <b>standard fractionation IMRT 併同步全身治療</b>。');
      L.push('<b>Rec 18（strong／low）</b>：<b>「The use of cytotoxic chemotherapy involving a <u>taxane ' +
        '(paclitaxel or docetaxel)</u>, administered with or without <u>anthracyclines (doxorubicin)</u> ' +
        'or <u>platin (cisplatin or carboplatin)</u>, is recommended in patients treated with ' +
        'definitive-intention radiation.」</b>');
      L.push('<b>Table 6 的四個處方（唯一給劑量的表）</b>：' + SUB([
        '<b><span class="rx">paclitaxel 50 mg/m² ＋ carboplatin AUC 2</span> 靜脈，每週</b>',
        '<b><span class="rx">docetaxel 20 mg/m² ＋ doxorubicin 20 mg/m²</span> 靜脈，每週</b>',
        '<b><span class="rx">paclitaxel 30–60 mg/m²</span> 靜脈，每週</b>',
        '<b><span class="rx">docetaxel 20 mg/m²</span> 靜脈，每週</b>']));
      L.push('<b>Rec 17（strong／low）：放療要用 IMRT。</b>' +
        '<b>照野包含甲狀腺或手術床、雙側 level II–V 頸部淋巴結、level VI 中央區、以及上縱膈淋巴結到氣管分叉。</b>');
      L.push('❗<b>關於 Gy 的正確講法</b>：<b>ATA 2021 的「術語定義節」有給示例</b> —— ' +
        '定性治療的標準處方例如 <b>66 Gy 分 33 次、每次 2 Gy、每週 5 天，共 6 週半</b>；' +
        '範圍從 <b>50 Gy／20 次</b>到 <b>70 Gy／35 次</b>；緩和性例如 <b>20 Gy／5 次</b>或 <b>30 Gy／10 次</b>。' +
        '<b>但<u>沒有任何一條編號 Recommendation 帶 Gy 數字</u></b>（Rec 14／15／17 只寫 ' +
        'standard fractionation IMRT）。<b>引用時要講清楚這是定義節的示例而非建議條文。</b>');
      if (br === 'pos') {
        L.push(H('BRAF V600E 陽性在這一格的位置', 'Recommendation 21'));
        L.push('❗<b>可切除的 IVA／IVB，BRAF 陽性<u>不會</u>改成先用標靶</b> —— ' +
          '手術仍是主線。<b>Rec 21 講的是「<u>unresectable</u> stage IVB」才有 neoadjuvant 的選項。</b>');
        L.push('<b>但 BRAF 結果仍要驗</b>：術後若殘存或後續進展，它決定下一步用什麼。');
      }
      L.push(EV('<b>手術的存活數字（指引引用）</b>：有手術者中位存活 <b>8 個月</b>、無手術者 <b>3 個月</b>；' +
        '<b>手術後加上輔助治療由 6.6 個月增為 9.6 個月</b>。' +
        '❗<b>指引自己加了兩個警告</b>：① 這可能反映<b>病人選擇</b>（該族群 48.1% 是 IVA）；' +
        '② <b>一篇系統性回顧在有限資料下「no differences in disease-free or overall survival rates ' +
        'were found comparing patients who had R0 versus R1 versus R2 resections」。</b>'));
    } else if (st === 'ivb_unres') {
      title += '→ 化放療是現行標準；BRAF 陽性另有新輔助的選項';
      if (br === 'pos') {
        L.push(H('這一格有兩條路，指引把先後講得很清楚', 'Recommendation 21'));
        L.push('<b>「In BRAF V600E-mutated <u>unresectable stage IVB</u> ATC <u>in which radiation ' +
          'therapy is feasible</u>, chemoradiotherapy <u>or neoadjuvant dabrafenib/trametinib</u> ' +
          'represents alternatives to initial therapy.」（<u>conditional</u>／low）</b>');
        L.push('❗<b>正文明講現行標準仍是化放療</b>：' +
          '<b>「In BRAF V600E-mutated ATC patients with unresectable stage IVB disease, however, ' +
          'consideration of <u>upfront chemoradiation is the current standard</u>. Alternatively, ' +
          'when upfront chemoradiation may be contraindicated or not desired by the patient, systemic ' +
          'therapy with BRAF-directed therapy can be considered.」</b>');
        L.push('<b>Recommendation 20（strong／low）的適用範圍是 IVC，以及<u>拒絕放療</u>的無法切除 IVB</b>：' +
          '<b>「In BRAF V600E-mutated IVC and in unresectable IVB ATC patients <u>who decline radiation ' +
          'therapy</u>, initiation of BRAF/MEK inhibitors (dabrafenib plus trametinib) is recommended ' +
          'over other systemic therapies if available.」</b>');
        L.push('<b>走新輔助這條路的目標是「打到可以開」</b>：Figure 1 的走法是' +
          '<b>標靶 → 「Excellent tumor response?」→ 是 → 「Surgery (if feasible)」→ 定性放療</b>；' +
          '<b>否 → 緩和性化療與／或放療，或最佳支持療護／安寧。</b>');
        L.push(EV('<b>新輔助 BRAF 標靶後手術的數字（指引引用）：n = 20 的系列 1 年存活 94%。</b>' +
          '<b>dabrafenib ＋ trametinib 整體：1 年存活 80%（歷史對照 20–40%）、' +
          '中位存活 86 週、中位無惡化存活 60 週、反應率 61%。</b>'));
        L.push('❗<b>台灣的落差</b>：<b>健保 9.91 的 ' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') +
          ' 條文只有黑色素瘤與 BRAF V600E 轉移性非小細胞肺癌，<u>沒有甲狀腺適應症</u></b>。' +
          '<b>藥證方面可走泛腫瘤（tumor-agnostic）那一項，但健保要自費或走個案事前審查。</b>' +
          '❗<b>而 BRAF 檢測 30107B 的適應症卻明文包含「無分化甲狀腺癌經多專科團隊評估無法接受根除手術者」' +
          '—— 檢測健保付、藥不付，這一格是台灣最典型的缺口。</b>');
      } else {
        L.push(H('主建議', 'Recommendation 15，strong／low'));
        L.push('<b>「We recommend that patients who have undergone <u>R2 resection or have ' +
          'unresectable but nonmetastatic disease</u> with good performance status and who wish an ' +
          'aggressive approach be offered <u>standard fractionation IMRT with systemic therapy</u>…」</b>');
        L.push('<b>化療處方同 Table 6</b>：<b><span class="rx">paclitaxel ＋ carboplatin</span></b>、' +
          '<b><span class="rx">docetaxel ＋ doxorubicin</span></b>，或單用 taxane，皆為每週給。');
        if (br === 'neg') {
          L.push(H('BRAF 陰性接下來要看什麼', 'Figure 1'));
          L.push('<b>Figure 1 的走法：BRAF 陰性 → 「Other tumor genetics? e.g. ALK, NTRK, RET fusions」</b>' +
            ' → 有 → <b>對應標靶</b>：' + SUB([
            '<b>ALK：crizotinib、ceritinib、alectinib</b>',
            '<b>RET：<span class="rx">pralsetinib</span>、<span class="rx">selpercatinib</span></b>',
            '<b>NTRK：<span class="rx">larotrectinib</span>、entrectinib</b>']));
          L.push('❗<b>台灣只有 NTRK 那一條走得到健保</b>（larotrectinib 9.95.3(5) 明列甲狀腺癌）；' +
            '<b>RET 的兩個藥健保 0 筆。</b>');
        } else {
          L.push('❗<b>BRAF 結果還沒出來，不要因此延後治療</b> —— ' +
            'GPS 2 要求所有治療前必要的評估都要「as rapidly as possible」完成。' +
            '<b>化放療可以照常開始，結果出來後再決定要不要加標靶。</b>');
        }
      }
      L.push(H('放療的劑量怎麼講', ''));
      L.push('<b>編號 Recommendation 只寫 standard fractionation IMRT，沒有 Gy。</b>' +
        '定義節的示例為 <b>66 Gy／33 次（每次 2 Gy、每週 5 天、6 週半）</b>，' +
        '範圍 <b>50 Gy／20 次</b>到 <b>70 Gy／35 次</b>。');
      L.push(EV('劑量與存活的關聯（指引引用的回溯資料）：<b>「longer survival was associated with doses ' +
        'of radiotherapy &gt; 59.4 Gy—but not with lower doses」；&lt; 45 Gy 相較於不放療沒有存活效益；' +
        '&gt; 59.4 Gy 者 2 年存活 38%、中位 16 個月。</b>' +
        '<b>超分次與傳統分次的比較為 13.6 對 10.3 個月，<u>未達統計顯著</u>。</b>'));
      L.push('❗<b>毒性要先講</b>（指引引用）：<b>住院率 60%、暫時需要灌食管者 60%、' +
        '多模式治療期間死亡率 3%</b>；<b>淋巴水腫、頸部活動受限、慢性口乾常見而且不可逆</b>。' +
        '<b>「Quality-of-life data are completely lacking.」</b>');
    } else {
      title += '→ 先問要不要積極治療；安寧一定要放進選項裡';
      L.push(H('Figure 2 的第一個分岔不是藥，是意願', ''));
      L.push('<b>IVC 的流程圖第一個問題是「Aggressive Care Desired?」</b> —— ' +
        '<b>答「否」直接走 Best Supportive Care／Hospice。</b>' +
        '<b>GPS 14：「As prognosis is dire in metastatic and progressive ATC, best supportive care ' +
        '(hospice) should also be discussed as an option.」</b>');
      L.push('❗<b>要誠實講的一個數字</b>：多模式治療的存活效益<b>在 IVC 次群消失了</b> —— ' +
        '<b>「Among patients with stage IVC cancer, overall survival <u>did not differ by therapy</u>… ' +
        'suggesting also that improved outcomes are concentrated in patients <u>without distant ' +
        'metastases</u>.」</b><b>IVC 的 1 年存活是 8.2%。</b>');
      if (br === 'pos') {
        L.push(H('選擇積極治療且 BRAF 陽性', 'Recommendation 20，strong／low'));
        L.push('<b>「In BRAF V600E-mutated <u>IVC</u> and in unresectable IVB ATC patients who decline ' +
          'radiation therapy, initiation of <u>BRAF/MEK inhibitors (dabrafenib plus trametinib)</u> is ' +
          'recommended <u>over other systemic therapies</u> if available.」</b>');
        L.push('❗<b>這條是 strong 但證據只有 low</b>，指引特地附了 Values Statement 解釋：' +
          '<b>「placed a high value on available and emerging data indicating the potential for ' +
          '<u>profound benefit</u> from using this approach in a setting where <u>little hope had ' +
          'previously existed</u>, supporting the strong recommendation in the presence of ' +
          'low-quality evidence.」</b>');
        L.push('<b>數字</b>：<b>1 年存活 80%（歷史對照 20–40%）、中位存活 86 週、' +
          '中位無惡化存活 60 週、反應率 61%。</b>');
        L.push('❗<b>台灣：健保 9.91 沒有甲狀腺適應症，要自費或走個案事前審查</b>；' +
          '而 <b>BRAF 檢測 30107B 反而明文含「無分化甲狀腺癌…無法接受根除手術者」</b>。');
        L.push('<b>有良好反應之後</b>：Figure 2 的終點是 <b>「Consider consolidative therapy as ' +
          'feasible」</b>，圖註定義為<b>「focal therapy intended to control residual macrometastatic ' +
          'disease among those electing aggressive therapy」</b>。');
      } else if (br === 'neg') {
        L.push(H('選擇積極治療但 BRAF 陰性', 'Figure 2、Recommendation 24'));
        L.push('<b>Figure 2 的下一個分岔是「High PD-L1 expression and/or ≥ 10 mutations/Mb TMB」</b>。');
        L.push('<b>Recommendation 24（<u>conditional</u>／low）</b>：' +
          '<b>「In IVC ATC patients with <u>high PD-L1 expression</u>, checkpoint (PD-L1, PD1) ' +
          'inhibitors can be considered <u>first-line</u> therapy in the absence of other targetable ' +
          'alterations or as later line therapy, <u>preferably in the context of a clinical trial</u>.」</b>');
        L.push('❗<b>條文只寫藥物類別，沒有指名任何藥</b>；' +
          '<b>但 Figure 2 的方框逐字寫「Checkpoint inhibitor e.g. <u>pembrolizumab</u>, etc.」</b> —— ' +
          '<b>pembrolizumab 是官方流程圖裡唯一被點名的 checkpoint 藥。</b>');
        L.push(EV('❗<b>但指引的試驗證據其實來自 spartalizumab 而不是 pembrolizumab</b>：' +
          '<b>反應率 19%、中位存活 5.9 個月、1 年存活 40%、中位無惡化存活 1.7 個月</b>；' +
          '<b>PD-L1 &lt; 1% 者中位存活只有 1.6 個月且<u>無人有反應</u>；' +
          'PD-L1 1–49% 與 ≥ 50% 者中位存活未達，反應率 18% 與 35%。</b>' +
          '❗<b>而且「spartalizumab is <u>not FDA approved and is not commercially available</u>」。</b>' +
          '另注意 <b>多數未分化癌「do not meet the formal criterion for high TMB (&gt; 10 mutations/Mb)」</b>，' +
          '<b>只有約 11–28% 的未分化癌表現 PD-L1。</b>'));
        L.push('❗<b>台灣：' + NR('pembrolizumab') + ' 的健保 9.69 沒有甲狀腺癌適應症</b>，要自費。');
        L.push('<b>沒有高 PD-L1 時，Figure 2 轉向「Other tumor genetics?」</b>：' +
          '<b>ALK（crizotinib、ceritinib、alectinib）、RET（<span class="rx">pralsetinib</span>、' +
          '<span class="rx">selpercatinib</span>）、NTRK（<span class="rx">larotrectinib</span>、entrectinib）。</b>' +
          '❗<b>台灣只有 NTRK 走得到健保。</b>');
      } else {
        L.push(H('BRAF 結果還沒出來', ''));
        L.push('❗<b>不要等 —— 但也不要因此放棄驗。</b>' +
          '<b>Rec 4 要求 expeditiously 用 IHC 驗；IHC 陽性可以不必再做 NGS，IHC 陰性才做 NGS。</b>' +
          '<b>NGS panel 約 1–2 週，全外顯子分析要數週、對這個癌太慢。</b>');
        L.push('<b>同時進行的事</b>：治療目標討論（GPS 5）、安寧照護會診（Rec 9）、' +
          '症狀控制。<b>Figure 2 的第一個分岔本來就是「要不要積極治療」，不是藥。</b>');
        L.push('<b>兩張流程圖共同的頂部虛線框逐字</b>：' +
          '<b>「Clinical Trials are strongly recommended if available」</b>、' +
          '<b>「Best Supportive Care/Hospice option can be elected <u>at any point</u>」</b>。');
      }
    }
    L.push(H('不管走哪一條，這兩句都成立', ''));
    L.push('<b>「Clinical Trials are strongly recommended if available」</b>（兩張流程圖的頂部框）。');
    L.push('<b>GPS 13</b>：<b>「Therapeutic decision-making in the setting of progressive disease after ' +
      'initial therapy… is very complex and <u>not easily defined by an algorithmic approach</u>. ' +
      'In this setting, care guided by an <u>expert in ATC therapeutics</u> is best pursued.」</b>' +
      '—— <b>指引自己說這一段不適合用流程圖決定。</b>');
    fill('ty_r_atc', cls, title, L,
      'ATA 2021 未分化甲狀腺癌指引 Recommendation 12–15、17、18、20、21、24 與 ' +
      'Good Practice Statement 8、10、13、14、Table 1、Table 5、Table 6、Figure 1、Figure 2。' +
      '健保與藥證查詢日 2026-09-13。⚠ 台大醫院無甲狀腺癌診療指引，本頁全部為院外實證。',
      nhiReference() + gradeReference());
    fu('ty_f_atc', '<li>❗<b>術後放療最遲不得晚於 6 週</b>（GPS 8）；' +
      '<b>化療可在術後 1 週內開始</b>（GPS 10）；<b>輔助治療最好在術後 2–3 週內開始</b>（正文）。</li>' +
      '<li><b>治療目標討論要「updated frequently」</b>（GPS 5），不是簽一次就結束。</li>' +
      '<li><b>安寧照護在每一個階段都要在團隊裡</b>（Rec 9），' +
      '<b>而且安寧選項在任何時間點都可以選</b>（流程圖頂部框）。</li>' +
      '<li><b>骨轉移的緩和放療</b>：典型為 <b>1–2 週內 5–10 次、每次 300–400 cGy、' +
      '總量 2000–3000 cGy</b>；<b>單次 800 cGy 也是合適的替代分次</b>。</li>');
  }

  /* ==========================================================
     8. 最下方一：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('三種組織型態的答案完全不同，不能混用', ''));
    L.push('<b>分化型 DTC</b>：<b>術後組織的分子檢測「not recommended routinely」</b>' +
      '（ATA 2025 Rec 28B，Conditional／Low certainty）——若已經有資料，可以拿來修正復發風險估計。' +
      '<b>但「放射碘難治、要開始全身治療前」是 Strong「應執行」</b>（Rec 61，Moderate certainty）。' +
      '<b>同一個癌別、兩個不同時機、兩種相反的答案，這是最容易搞混的一格。</b>');
    L.push('<b>髓質癌 MTC</b>：<b>所有病人都要驗 germline RET</b>（Rec 21，Grade B），' +
      '<b>包含看起來是偶發性的</b>（Rec 6）。<b>這不是為了選藥，是為了找出遺傳症候群。</b>' +
      '❗<b>Rec 8（Grade C）：不常規檢驗腫瘤的體細胞 HRAS／KRAS／NRAS 或 RET M918T。</b>');
    L.push('<b>未分化癌 ATC</b>：<b>診斷一成立就要 expeditiously 驗 BRAF V600E</b>' +
      '（Rec 4，strong／moderate），<b>並在診斷時做分子檢測以指引標靶治療</b>（Rec 5，strong／moderate）。' +
      '<b>做法是先 IHC 求快，陰性再做 NGS。</b>');
    L.push(H('髓質癌的 RET 要驗哪些位置', 'ATA 2015 Rec 3、4、5'));
    L.push('<b>MEN2A 表現型</b>：先驗 <b>exon 10（codons 609、611、618、620）、' +
      'exon 11（codons 630、634），以及 exons 8、13、14、15、16</b>。');
    L.push('<b>MEN2B 表現型</b>：<b>先驗 M918T（exon 16）；陰性再驗 A883F（exon 15）；' +
      '仍陰性才做全定序。</b>');
    L.push('<b>全 coding region 定序</b>保留給「找不到突變」或「表現型與基因型不符」的情況。');
    L.push('❗<b>MEN2B 的高危嬰兒要「soon after birth」就驗</b> —— ' +
      '<b>因為巨觀髓質癌與淋巴結轉移可能在出生第一年內就發生。</b>');
    L.push('<b>臨床符合 MEN2 但全定序陰性的罕見家族</b>：親屬要以傳統方法週期篩檢' +
      '髓質癌、嗜鉻細胞瘤與副甲狀腺亢進，<b>初評後每 1–3 年</b>（Rec 9）。');
    L.push(H('驗到之後會改變什麼', ''));
    L.push('<b>驗到 germline RET → 立刻改變三件事</b>：' + SUB([
      '❗<b>手術之前必須先排除 pheochromocytoma</b>（Rec 38，「regardless of age and presenting ' +
        'symptoms」）—— <b>這是會出人命的一步</b>',
      '<b>要開始篩檢副甲狀腺亢進</b>（ATA-H 於 11 歲、ATA-MOD 於 16 歲起，與嗜鉻細胞瘤同時）',
      '<b>要做家屬檢測與遺傳諮詢</b>（Rec 7 列了四種對象）']));
    L.push('<b>育齡帶因者（尤其 MEN2B）應考慮著床前或產前檢測的遺傳諮詢</b>' +
      '（Rec 12，<b>Grade A</b> —— 這是髓質癌指引裡少數的 Grade A）。');
    L.push(H('❗台灣：檢測有給付，但對應的藥常常沒有', '查詢日 2026-09-13'));
    L.push('<b>健保有給付的檢測</b>：<b>NGS 30302B／30303B（2 萬／3 萬點，每人各癌別終生一次）</b>，' +
      '附表 2.2.1 明列兩行 —— <b>甲狀腺癌（BRAF V600E／BRAF nonV600E／RET fusion）</b>與' +
      '<b>甲狀腺髓質癌（RET mutation）</b>。' +
      '<b>BRAF 單項檢測 30107B</b> 的適應症也含甲狀腺癌，' +
      '❗<b>但明文「不包含髓質癌」</b>。');
    L.push('❗<b>藥的那一端</b>：<b>' + NR('dabrafenib') + ' ＋ ' + NR('trametinib') +
      '（9.91）沒有甲狀腺適應症</b>；<b>' + NR('selpercatinib') + ' 與 ' + NR('pralsetinib') +
      ' 健保 0 筆</b>。<b>只有 NTRK 融合走得到健保（larotrectinib 9.95.3(5) 明列甲狀腺癌）。</b>');
    L.push('<b>所以驗之前要先和病人講清楚</b>：<b>「驗得出來，不代表用得到」</b>。' +
      '<b>而且每人每個癌別的 NGS 健保給付終生只有一次，要驗就一次驗完整套組。</b>');
    return '<div class="bc-gene-h">要不要驗基因？三種組織型態的答案完全不同' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     9. 最下方二：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'ty-drug-' + code.replace(/ /g, '_'); }
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
    var g = el('ty_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }
  function renderDrugCards() {
    var box = el('ty_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('thPath');
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
    TH_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' +
        (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
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
      '禁忌、健保給付規定、剝半磨粉）。<b>徽章標明該藥「用於甲狀腺癌時」在台灣的健保與藥證狀態 —— ' +
      '不是該藥整體的給付狀態。</b>' +
      '<b>放射碘（I-131）不是處方集品項，走診療項目 26038B（478 點／mCi）。</b></div>' +
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
     10. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.histo === 'dtc') {
      show('ty_b_dtc', true);
      show('ty_n_dstage', true);
      if (S.dstage === 'init') {
        show('ty_n_dsize', true);
        if (S.dsize) renderDtcInit();
      } else if (S.dstage === 'postop') {
        show('ty_n_dhisto', true);
        if (S.dhisto) {
          show('ty_n_drisk', true);
          if (S.drisk) renderDtcPostop();
        }
      } else if (S.dstage === 'fu') {
        show('ty_n_dtx', true);
        if (S.dtx) {
          show('ty_n_dresp', true);
          if (S.dresp) renderDtcFu();
        }
      } else if (S.dstage === 'rair') {
        show('ty_n_dmol', true);
        if (S.dmol) renderDtcRair();
      }
    } else if (S.histo === 'mtc') {
      show('ty_b_mtc', true);
      show('ty_n_mstage', true);
      if (S.mstage === 'preop') {
        show('ty_n_mctn', true);
        if (S.mctn) renderMtcPreop();
      } else if (S.mstage === 'postop') {
        show('ty_n_mpost', true);
        if (S.mpost) renderMtcPostop();
      } else if (S.mstage === 'adv') {
        show('ty_n_madv', true);
        if (S.madv) renderMtcAdv();
      }
    } else if (S.histo === 'atc') {
      show('ty_b_atc', true);
      renderAtcUrgent();
      show('ty_n_astage', true);
      if (S.astage) {
        show('ty_n_abraf', true);
        if (S.abraf) renderAtc();
      }
    }
    renderDrugCards();
  }

  /* ==========================================================
     11. 互動
     ========================================================== */
  var SEL_GROUPS = ['ty_n1', 'ty_n_dstage', 'ty_n_dsize', 'ty_n_dhisto', 'ty_n_drisk',
    'ty_n_dtx', 'ty_n_dresp', 'ty_n_dmol', 'ty_n_mstage', 'ty_n_mctn', 'ty_n_mpost',
    'ty_n_madv', 'ty_n_astage', 'ty_n_abraf'];

  var DOWNSTREAM = {
    histo:  ['dstage', 'dsize', 'dhisto', 'drisk', 'dtx', 'dresp', 'dmol',
             'mstage', 'mctn', 'mpost', 'madv', 'astage', 'abraf'],
    dstage: ['dsize', 'dhisto', 'drisk', 'dtx', 'dresp', 'dmol'],
    dhisto: ['drisk'],
    dtx:    ['dresp'],
    mstage: ['mctn', 'mpost', 'madv'],
    astage: ['abraf']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function thPick(key, val, btn) {
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
      ['ty_n1', 'histo'], ['ty_n_dstage', 'dstage'], ['ty_n_dsize', 'dsize'],
      ['ty_n_dhisto', 'dhisto'], ['ty_n_drisk', 'drisk'], ['ty_n_dtx', 'dtx'],
      ['ty_n_dresp', 'dresp'], ['ty_n_dmol', 'dmol'], ['ty_n_mstage', 'mstage'],
      ['ty_n_mctn', 'mctn'], ['ty_n_mpost', 'mpost'], ['ty_n_madv', 'madv'],
      ['ty_n_astage', 'astage'], ['ty_n_abraf', 'abraf']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /thPick\('([a-z0-9_]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function thReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }

  function initThyroidPathway() { thReset(); }

  /* ⚠ 匯出名稱必須符合 js/cancer-staging.js 的命名規則（延遲載入靠它分派）：
     <k>PathwayHTML 與 init<K>Pathway。schema/check_cancer_wiring.py 會驗。 */
  global.thyroidPathwayHTML = thyroidPathwayHTML;
  global.initThyroidPathway = initThyroidPathway;
  global.thPick = thPick;
  global.thReset = thReset;
})(window);
