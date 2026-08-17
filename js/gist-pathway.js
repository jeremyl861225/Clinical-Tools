/* ============================================================
   胃腸道基質瘤治療互動決策流程 GIST Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全新製作。此癌別原本只有靜態的 tx 條列，沒有流程模組。

   ⚠ 資料來源的界線（這一點和其他癌別不同，務必看清楚）：
     **台大醫院沒有 GIST 的診療指引。**
     台大「肉瘤診療指引」（文件編號 50710-2-000049，版次 08，2026/06/16 第 87 次
     癌症醫療委員會修訂通過）第 9 頁把 GIST 明確列為 exclusion —— GIST 不在腹膜後
     肉瘤的分類內，全文也沒有任何 GIST 的治療章節；該指引唯一提到 imatinib 的地方
     是 dermatofibrosarcoma protuberans（第 6 頁），與 GIST 無關。
     台大胃癌診療指引（版次 17）全文亦無 GIST。
     → 因此本流程的臨床內容**全部屬院外實證**，逐段標明出處與版本。
     → 台大指引唯一可引用的一句是肉瘤指引第 9 頁的註腳：被排除的肉瘤次型
       「仍應在多專科團隊（MDT）討論」。

   臨床內容來源：ESMO–EURACAN–GENTURIS GIST 臨床實務指引；AJCC 第 8 版 GIST 分期；
   AFIP／Miettinen 復發風險分級（CAP GIST protocol 收錄）；modified-NIH（Joensuu）分級。
   台灣端：健保署藥品給付規定第 9 節，查詢日 2026-08-17；台大醫院藥劑部處方集品項。

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
    'scope',   // dx | postop | adv | prog
    'site',    // 初診的部位與大小：gsmall | gsuspect | gbig | nong
    'resect',  // 可切除性：direct | morbid | unres
    'nres',    // 術前 imatinib 的反應：resect | stable | prog
    'psite',   // 術後病理的原發部位：gastric | duo | si | rectum
    'risk',    // AFIP 格子：<sizeKey>_<mitKey>
    'rupt',    // 腫瘤破裂：no | yes
    'mut',     // 突變型：ex11 | ex9 | pdgfra | d842v | sdh | wt
    'line',    // 轉移性的線別：l1 | l2 | l3 | l4
    'pmode'    // 進展型態：focal | general | intol | offtx
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/index.js 逐碼實跑核對）
     GIST 的五個 TKI 台大處方集全部都有，這一點和很多癌別不一樣。
     ========================================================== */
  var GI_DRUGS = [
    { key: 'imatinib', cards: [['17', 'GLI4CE95', 'Glivec 基利克膜衣錠 100 mg', 'imatinib mesylate']],
      flag: '台大只有 100 mg，400 mg/天 ＝ 4 顆' },
    { key: 'sunitinib', cards: [['17', 'SUT4CEA4', 'Sutent 紓癌特膠囊 12.5 mg', 'sunitinib malate']] },
    { key: 'regorafenib', cards: [['17', 'STI4CEE2', 'Stivarga 癌瑞格膜衣錠 40 mg']] },
    { key: 'ripretinib', cards: [['17', 'QIN4CG23', 'Qinlock 期樂錠 50 mg']] },
    { key: 'avapritinib',
      cards: [['17', 'AYV4CG12', 'Ayvakit 泰時維膜衣錠 100 mg／300 mg'],
              ['17', 'BLU4CER1', 'BLU-285 錠 100 mg（專案）', 'avapritinib']] },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib sulfate']] },
    { key: 'entrectinib', cards: [['17', 'ROZ4CG01', 'Rozlytrek 羅思克膠囊 200 mg']] }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="gistPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="gi-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="gi-node" id="' + id + '">' +
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
  /* 否定句裡的藥名要包起來 —— 藥卡掃描是純字串比對，不包的話
     「PDGFRA D842V 不可以用 imatinib」會長出一張基利克的卡。 */
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
     2. AFIP／Miettinen 復發風險決策格
     ------------------------------------------------------------
     GIST 的風險不是 TNM 算出來的，是「大小 × 有絲分裂速率 × 部位」三個軸。
     做法：部位先在上一步選定，格子只留大小（列）× 有絲分裂（欄），
     整張表跟著部位重畫 —— 和乳癌「依亞型換表」同一個做法。
     ⚠ cell id 必須帶部位，否則四張表的 DOM id 會撞在一起。
     ========================================================== */
  var GCLS = { none: 'g-none', ii: 'g-ii', low: 'g-low', high: 'g-high' };

  var SIZE_ROWS = [
    ['s2',  '≤ 2 cm',      '',  '≤2cm<br>'],
    ['s5',  '> 2–5 cm',    '',  '>2–5<br>'],
    ['s10', '> 5–10 cm',   '',  '>5–10<br>'],
    ['s10p', '> 10 cm',    '',  '>10cm<br>']
  ];
  var MIT_COLS = [
    ['mlow',  '≤ 5 ／5 mm²', '低有絲分裂', ''],
    ['mhigh', '> 5 ／5 mm²', '高有絲分裂', '']
  ];

  /* AFIP 長期追蹤的「疾病進展率」（＝轉移或腫瘤相關死亡），
     依部位分四張。na ＝ AFIP 原表病例數不足，未給數字。
     資料來自 cancers.js 的 gist 條目（來源：CAP GIST Protocol 收錄之 AFIP Table 1）。 */
  var AFIP = {
    gastric: {
      s2_mlow: ['none', '0%'], s5_mlow: ['ii', '1.9%'], s10_mlow: ['ii', '3.6%'], s10p_mlow: ['low', '10%'],
      s2_mhigh: ['none', '＊'], s5_mhigh: ['low', '16%'], s10_mhigh: ['high', '55%'], s10p_mhigh: ['high', '86%']
    },
    duo: {
      s2_mlow: ['none', '0%'], s5_mlow: ['ii', '8.3%'], s10_mlow: ['high', 'na'], s10p_mlow: ['high', '34%'],
      s2_mhigh: ['high', 'na'], s5_mhigh: ['high', '50%'], s10_mhigh: ['high', 'na'], s10p_mhigh: ['high', '86%']
    },
    si: {
      s2_mlow: ['none', '0%'], s5_mlow: ['ii', '4.3%'], s10_mlow: ['low', '24%'], s10p_mlow: ['high', '52%'],
      s2_mhigh: ['high', '＊'], s5_mhigh: ['high', '73%'], s10_mhigh: ['high', '85%'], s10p_mhigh: ['high', '90%']
    },
    rectum: {
      s2_mlow: ['none', '0%'], s5_mlow: ['ii', '8.5%'], s10_mlow: ['high', 'na'], s10p_mlow: ['high', '57%'],
      s2_mhigh: ['high', '54%'], s5_mhigh: ['high', '52%'], s10_mhigh: ['high', 'na'], s10p_mhigh: ['high', '71%']
    }
  };

  var SITE_LABEL = {
    gastric: '胃／網膜',
    duo: '十二指腸',
    si: '空腸與迴腸',
    rectum: '直腸',
    other: '食道／大腸／腸繫膜／腹膜（比照空腸迴腸）'
  };
  /* AFIP 原表只有四個部位。食道、大腸、腸繫膜、腹膜沒有自己的表，
     CAP／AJCC 的做法是比照空腸迴腸 —— 所以查表時把 other 映到 si。 */
  function tableOf(psite) { return psite === 'other' ? 'si' : psite; }

  var RISK_WORD = { none: '無風險', ii: '極低～低風險', low: '中風險', high: '高風險' };

  function riskOf(psite, key) {
    var t = AFIP[tableOf(psite)];
    return t && t[key] ? t[key] : null;
  }

  var RISK_LEGEND = [
    ['none', '無（AFIP 追蹤沒有進展的病例）'],
    ['ii', '極低～低（約 2–9%）'],
    ['low', '中（約 10–24%）'],
    ['high', '高（≥ 30%，或 AFIP 病例數不足而依 modified-NIH 判為高風險）']
  ];

  function riskGridHTML(psite) {
    var h = '<div class="tn-wrap"><div class="tn-grid tn-c2">';
    h += '<div class="tn-corner"></div>';
    MIT_COLS.forEach(function (c) {
      h += '<div class="tn-ch">' + c[1] + (c[2] ? '<span class="tn-sub2">' + c[2] + '</span>' : '') + '</div>';
    });
    SIZE_ROWS.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + (r[2] ? '<span class="tn-sub2">' + r[2] + '</span>' : '') + '</div>';
      MIT_COLS.forEach(function (c) {
        var key = r[0] + '_' + c[0];
        var v = riskOf(psite, key);
        var pct = v[1] === 'na' ? '資料不足' : v[1];
        h += '<button class="tn-cell ' + GCLS[v[0]] + '" id="gi_riskc_' + psite + '_' + key + '" ' +
          'onclick="gistPick(\'risk\',\'' + key + '\',this)">' + r[3] +
          '<span class="tn-sub2">' + pct + '</span></button>';
      });
    });
    h += '</div><div class="tn-legend">';
    RISK_LEGEND.forEach(function (l) {
      h += '<span class="tn-lg"><span class="tn-sw ' + GCLS[l[0]] + '"></span>' + l[1] + '</span>';
    });
    h += '</div>';
    h += '<div class="note"><b>這裡的顏色代表「要不要給輔助 imatinib」，不是嚴重度。</b>' +
      '格內的百分比是 AFIP 長期追蹤的<b>疾病進展率</b>（轉移或腫瘤相關死亡），' +
      '資料來自 imatinib 問世之前的病例，所以它代表的是<b>不吃藥的自然病程</b>。' +
      '「資料不足」的格子是 AFIP 原表該組病例數太少沒給數字，本頁依 modified-NIH（Joensuu）' +
      '判為高風險（非胃部位、&gt; 5 cm 即為高風險）。「＊」為病例數少的組別。' +
      '<b>換部位時整張表會跟著換 —— 同樣大小同樣分裂速率，胃比小腸好很多。</b></div>';
    return h + '</div>';
  }

  /* ==========================================================
     2b. 共用參考區塊 —— 每一段只在這裡定義一次
     ========================================================== */

  /* 健保四條件的判定（和指引的風險分級是兩套東西，這一點最容易搞混） */
  var NHI_ADJ_A = '腫瘤大於 10 公分';
  var NHI_ADJ_B = '有絲分裂指數 &gt; 10／50 HPF';
  var NHI_ADJ_C = '腫瘤大於 5 公分且有絲分裂指數 &gt; 5／50 HPF';
  var NHI_ADJ_D = '腫瘤破裂';

  /* 依目前選到的大小／分裂速率／破裂，判斷健保四條件有沒有中。
     ⚠ 健保條文用的是「/50 HPF」，AFIP 與現行病理報告用的是「/5 mm²」，
     兩者在新式廣角物鏡下不是同一件事 —— 這個換算差異本身就要寫給使用者看。 */
  function nhiAdjHit(sizeKey, mitKey, rupt) {
    var hits = [];
    if (sizeKey === 's10p') hits.push('A（' + NHI_ADJ_A + '）');
    if (mitKey === 'mhigh' && (sizeKey === 's10' || sizeKey === 's10p')) {
      hits.push('C（' + NHI_ADJ_C + '）');
    }
    if (rupt === 'yes') hits.push('D（' + NHI_ADJ_D + '）');
    return hits;
  }

  function nhiAdjReference() {
    return fold('<b>健保給付輔助 imatinib 的四個條件</b>（9.22 第 3 項第 2 款逐字）',
      '<table>' +
      '<tr><td colspan="2"><b>「作為成人胃腸道基質瘤完全切除後之術後輔助治療，' +
      '符合下列一項條件可使用 3 年，須事前審查核准後使用。」</b></td></tr>' +
      '<tr><td>A</td><td>' + NHI_ADJ_A + '</td></tr>' +
      '<tr><td>B</td><td>' + NHI_ADJ_B + '</td></tr>' +
      '<tr><td>C</td><td>' + NHI_ADJ_C + '</td></tr>' +
      '<tr><td>D</td><td>' + NHI_ADJ_D + '</td></tr>' +
      '<tr><td>❗</td><td><b>這四個條件不等於任何一套風險分級。</b>' +
      '最典型會漏掉的病人是<b>小腸 3 cm、有絲分裂 8／50 HPF</b> —— ' +
      'modified-NIH 判為高風險、指引建議吃 3 年，但四個條件一條都不符合' +
      '（不到 10 cm、分裂沒有超過 10、不到 5 cm、沒有破裂）→ <b>健保不給付。</b></td></tr>' +
      '<tr><td>❗</td><td><b>條文用的是「／50 HPF」，病理報告現在寫的是「／5 mm²」。</b>' +
      '舊式顯微鏡 50 HPF 約等於 5 mm²，但新式廣角物鏡的 50 HPF 可以到 10 mm² 以上 —— ' +
      '同一顆腫瘤換一台顯微鏡數，數字會差一倍。<b>送審前要確認病理報告的分母。</b></td></tr>' +
      '<tr><td>❗</td><td><b>療程明文 3 年，沒有延長條款。</b>' +
      '條文也完全沒有規範中斷後可否重啟、3 年中斷後可否補足、復發後可否重新起算。</td></tr>' +
      '</table>');
  }

  function nhiReference() {
    return fold('<b>健保條文全文</b>（第 9 節；查詢日 2026-08-17）',
      '<table>' +
      '<tr><td><b>9.22</b><br>imatinib</td><td>' +
      '<b>3. 惡性胃腸道基質瘤（GIST）：</b><br>' +
      '（1）治療成年人<b>無法手術切除或轉移</b>的惡性胃腸道基質瘤。<br>' +
      '（2）作為成人胃腸道基質瘤<b>完全切除後之術後輔助治療</b>，符合下列一項條件<b>可使用 3 年</b>，' +
      '<b>須事前審查核准後使用</b>：A. 腫瘤大於 10 公分。B. 有絲分裂指數 &gt; 10/50 HPF。' +
      'C. 腫瘤大於 5 公分且有絲分裂指數 &gt; 5/50 HPF。D. 腫瘤破裂。<br>' +
      '<b>條文全文沒有出現任何劑量</b> —— 沒有 400 mg、沒有 800 mg、沒有每日粒數上限，' +
      '也沒有 KIT exon 9 可以增量的授權。<b>增量屬條文空白，不是明文許可，也不是明文禁止。</b><br>' +
      '第（1）款<b>沒有</b>寫事前審查、沒有療程期限、沒有影像追蹤或再申請間隔。</td></tr>' +
      '<tr><td><b>9.31</b><br>sunitinib</td><td>' +
      '<b>1. 腸胃道間質腫瘤：</b>（1）限用於<b>以 imatinib 治療期間出現疾病惡化，或對該藥出現不能忍受</b>者。<br>' +
      '（2）<b>若使用本藥品出現疾病惡化或無法忍受其副作用，不得替換使用 imatinib 治療。</b><br>' +
      '（3）需經事前審查核准後使用，送審時須檢送病歷及對 imatinib 耐受性不良或無效之證明。<br>' +
      '<b>GIST 這一段沒有寫劑量、沒有寫療程長度、沒有寫評估頻率</b> —— ' +
      '「每三個月評估一次」「嚴重耐受性不佳可以換其他 TKI」都只寫在第 2 項的腎細胞癌段，' +
      '<b>套到 GIST 是抄錯</b>。</td></tr>' +
      '<tr><td><b>9.51</b><br>regorafenib</td><td>' +
      '<b>2. 胃腸道間質瘤（GIST）：</b>（1）<b>先前曾接受 imatinib 與 sunitinib 治療</b>的' +
      '局部晚期、無法切除或轉移性 GIST 患者。<br>' +
      '（2）需經事前審查核准後使用，<b>每次申請之療程以 3 個月為限</b>，送審時需檢送影像資料，' +
      '每 3 個月評估一次。<br>' +
      '<b>寫的是「與」不是「或」 —— 兩線都必須用過。</b><br>' +
      '<b>「每日至多處方 4 粒」只寫在第 3 項的肝細胞癌段，GIST 段沒有粒數上限；' +
      '「與 ramucirumab、nivolumab 擇一」也是肝細胞癌段的規定，與 GIST 無關。</b><br>' +
      '第 4 點「本藥品不得與 trifluridine／tipiracil 併用」列在藥品層級，GIST 同樣適用。</td></tr>' +
      '<tr><td><b>9.123</b><br>ripretinib<br>（114/9/1 起）</td><td>' +
      '1. 適用於治療<b>已接受 3 種或以上激酶抑制劑（包括 imatinib）</b>治療的晚期 GIST 成人病人。<br>' +
      '2. 需經事前審查核准後使用，每次申請之療程以 3 個月為限，送審時需檢送影像資料，每 3 個月評估一次。' +
      '<b>治療期間出現疾病惡化，則不可繼續使用。</b><br>' +
      '3. <b>本藥品不得合併其他藥品，每日至多處方 3 粒</b>（Qinlock 只有 50 mg 一種規格 → 每日上限 150 mg，' +
      '正好是仿單劑量）。<br>' +
      '<b>這一條是 114/9/1（2025-09-01）才新增的</b>，經 114/6/19 第 76 次共同擬訂會議以' +
      '<b>簽訂藥品給付協議</b>方式納入、公告為「暫予支付」。' +
      '<b>2025 年 9 月以前寫的資料說「ripretinib 健保不給付」在當時是對的，現在已經過時。</b></td></tr>' +
      '<tr><td><b>9.97</b><br>avapritinib</td><td>' +
      '1. 治療具有 <b>PDGFRA D842V 突變</b>之無法切除或轉移性 GIST 的成年病人。<br>' +
      '2. 需經事前審查核准後使用，<b>初次申請時需檢附 PDGFRA D842V 突變檢測報告</b>，' +
      '且需符合藥品給付規定通則十二。<br>' +
      '3. 每次申請事前審查之療程以 6 個月為限，再次申請必須提出客觀證據（如影像學）證實無惡化。<br>' +
      '4. 每日至多處方 100 mg 2 粒或 300 mg 1 粒。<br>' +
      '<b>這是唯一沒有要求「先用過 imatinib」的 GIST 標靶條文</b> —— D842V 可以直接申請。</td></tr>' +
      '<tr><td><b>9.95</b><br>larotrectinib</td><td>' +
      '泛腫瘤條文第 3 項第（9）款：<b>胃腸道基質瘤 —— 先前曾接受過至少一次全身性治療失敗，' +
      '又有疾病惡化，無法手術切除或轉移的惡性 GIST。</b><br>' +
      '前提是具 NTRK 基因融合、無已知的後天抗藥性突變、且沒有合適的替代治療選項。<br>' +
      '需事前審查，每次療程 12 週，初次申請檢附 NTRK 融合檢測報告（須符合通則十二）。<br>' +
      '❗<b>同樣是 NTRK 抑制劑，' + NR('entrectinib') + '（9.93）的健保條文只給付 ROS1 陽性的非小細胞肺癌，' +
      '完全沒有 NTRK 實體瘤這一段</b> —— 雖然食藥署藥證上有 NTRK 適應症。' +
      '<b>NTRK 融合的 GIST 要走健保，只有 larotrectinib 一條路。</b></td></tr>' +
      '<tr><td><b>通則十二</b></td><td>需檢附生物標記檢測結果報告者，報告須符合下列任一條件：' +
      '（一）符合健保醫療服務給付項目及支付標準規定；（二）使用經衛福部許可之伴隨式診斷 IVD 檢測；' +
      '（三）由衛福部核定之 LDT 施行計畫表列醫療機構之認證實驗室執行，且技術項目符合核定之分析標的。<br>' +
      '<b>白話：突變報告不是隨便哪一家驗的都算，實驗室資格不符會被退件。</b></td></tr>' +
      '</table>');
  }

  /* 健保的線別是「累積式」的，跳線後面就申請不到 —— 這一段每一條路都會用到 */
  function nhiOrderReference() {
    return fold('<b>健保的線別是累積式的，順序錯了後面就申請不到</b>',
      '<table>' +
      '<tr><td>1</td><td><b>imatinib</b>（9.22）—— 無法切除或轉移即可，沒有前置條件。</td></tr>' +
      '<tr><td>2</td><td><b>sunitinib</b>（9.31）—— 必須是「imatinib <b>治療期間</b>惡化」或' +
      '「對 imatinib 不能忍受」。<b>沒用過 imatinib，或停藥之後才惡化，條文字面不符。</b></td></tr>' +
      '<tr><td>3</td><td><b>regorafenib</b>（9.51）—— imatinib <b>與</b> sunitinib 兩者都用過。' +
      '<b>因為不耐受而跳過 sunitinib 直接申請，不符字面。</b></td></tr>' +
      '<tr><td>4</td><td><b>ripretinib</b>（9.123）—— 已接受 3 種以上激酶抑制劑（含 imatinib）。</td></tr>' +
      '<tr><td>❗</td><td><b>單向不可逆：9.31 第 1 項第（2）款明文寫「若使用本藥品出現疾病惡化或' +
      '無法忍受其副作用，不得替換使用 imatinib 治療」。</b>' +
      '也就是說 —— <b>一旦轉去 sunitinib，健保就不再給付回頭用 imatinib。</b>' +
      '國際指引允許末線 imatinib rechallenge，台灣健保這一條把它封死了。</td></tr>' +
      '<tr><td>❗</td><td><b>例外只有一個：avapritinib（9.97）。</b>' +
      'D842V 突變不需要先用過 imatinib，可以直接申請 —— 但一定要有突變報告。</td></tr>' +
      '</table>');
  }

  /* ---- 有絲分裂怎麼數（這一條直接決定風險分級與健保條件） ---- */
  function mitosisReference() {
    return fold('<b>有絲分裂速率的計數單位</b>：為什麼病理報告寫 /5 mm² 而健保條文寫 /50 HPF',
      '<table>' +
      '<tr><td>現行標準</td><td><b>「The mitotic count … should be expressed as the number of mitoses ' +
      'on a total area of 5 mm², which should replace, and is equivalent to, the 50 high-power field area, ' +
      'in order to avoid variability.」</b>（ESMO 2022，Diagnosis 節）<br>' +
      '也就是說 —— <b>5 mm² 是用來取代 50 HPF 的，因為 HPF 的面積會隨顯微鏡而變。</b></td></tr>' +
      '<tr><td>差多少</td><td>舊式顯微鏡的 50 HPF 約 5 mm²；<b>新式廣角物鏡的 50 HPF 可以到 10 mm² 以上</b> —— ' +
      '同一顆腫瘤換一台顯微鏡數，數字可以差一倍。</td></tr>' +
      '<tr><td>是連續變數</td><td>ESMO 特別寫「mitotic count is a continuous variable and should therefore ' +
      'be expressed as such」，<b>門檻要謹慎解讀</b> —— 4 和 6 的臨床意義沒有分級表看起來那麼斷裂。</td></tr>' +
      '<tr><td>Ki-67</td><td><b>「Ki-67 analysis does not replace the mitotic count and is not part of ' +
      'established prognostic systems in this disease.」</b>不能拿 Ki-67 代替。</td></tr>' +
      '<tr><td>檢體固定</td><td>用 <b>4% 緩衝福馬林</b>；<b>不要用 Bouin 固定液</b> —— 會讓分子檢測做不成。</td></tr>' +
      '<tr><td>❗ 送審</td><td>健保 9.22 的條件 B、C 用的是 <b>/50 HPF</b>。' +
      '報告若只寫 /5 mm²，送審前要確認換算與分母。</td></tr>' +
      '</table>');
  }

  /* ---- 腫瘤破裂的定義 ---- */
  function ruptureReference() {
    return fold('<b>什麼叫「腫瘤破裂」？</b>算與不算的逐項清單（這一條會直接改變輔助治療的決定）',
      '<table>' +
      '<tr><td><b>算破裂</b></td><td>腫瘤內容物溢出或在腹腔內碎裂（tumour spillage or fracture）、' +
      '<b>分塊切除（piecemeal resection）</b>、<b>腹腔鏡或開腹的切開式切片（incisional biopsy）</b>、' +
      '腸胃道穿孔通到腹腔、<b>血性腹水</b>、顯微鏡下經腹膜侵犯到鄰近構造。</td></tr>' +
      '<tr><td><b>不算破裂</b></td><td><b>粗針切片（core needle biopsy）造成的微小完整性缺損</b>、' +
      '腫瘤穿透腹膜（peritoneal tumour penetration）、<b>醫源性的表淺包膜撕裂</b>、' +
      '<b>顯微鏡下切緣陽性（R1）</b>。這幾種的預後和完整取出的腫瘤相當。</td></tr>' +
      '<tr><td>❗</td><td><b>粗針切片不算破裂，但腹腔鏡切開式切片算。</b>' +
      '這兩件事在手術室裡只差一個動作，預後意義完全不同。</td></tr>' +
      '<tr><td>要登錄</td><td><b>不論發生在術前還是術中，都要記錄下來</b> —— ' +
      '它是獨立的不良預後因子，也是健保條件 D。</td></tr>' +
      '<tr><td>來源</td><td>ESMO 2022 局部疾病節的破裂定義段；原始研究為 Oslo criteria' +
      '（Hølmebakk T et al. Br J Surg 2016;103:684-691，PMID 26988241：小腸 GIST 72 例，' +
      'major defect 5 年復發率 64%、無缺損 31%）。</td></tr>' +
      '</table>');
  }

  /* ---- 風險分級工具之間的關係 ---- */
  function riskToolsReference() {
    return fold('<b>風險分級有好幾套，各自在回答不同的問題</b>',
      '<table>' +
      '<tr><td><b>AJCC TNM</b></td><td>ESMO 明講「rarely used, given the natural history of GISTs」—— ' +
      '本頁的「分期 TNM」分頁仍列出，因為病理報告要寫，<b>但它不是決定要不要吃藥的依據</b>。</td></tr>' +
      '<tr><td><b>AFIP<br>（Miettinen）</b></td><td><b>本頁格子用的就是這一套。</b>' +
      '大小 × 有絲分裂 × 部位三個因子，直接給出「疾病進展率」的百分比。' +
      '原始資料：Miettinen M, Lasota J. Semin Diagn Pathol 2006;23:70-83（PMID 17193820）；' +
      'AJCC 第 8 版與 CAP protocol 均收錄。</td></tr>' +
      '<tr><td><b>modified NIH<br>（Joensuu）</b></td><td>把<b>腫瘤破裂</b>與<b>部位</b>納入原始 NIH 分級。' +
      'Joensuu H. Hum Pathol 2008;39:1411-1419（PMID 18774375）。<br>' +
      '本頁只在<b>兩個地方</b>用到它：①AFIP 表病例數不足的格子；②腫瘤破裂那一步。<br>' +
      '❗<b>ESMO 2022 全文沒有出現「NIH」或「modified NIH」字樣</b> —— ' +
      '不可以說成「ESMO 建議用 modified NIH」。</td></tr>' +
      '<tr><td><b>nomogram ／<br>contour maps</b></td><td>ESMO 列出的另外兩種工具，把大小與分裂數當成' +
      '<b>連續變數</b>處理，並納入破裂。適合落在門檻邊緣的病人。本頁未實作。</td></tr>' +
      '<tr><td>❗ 共同限制</td><td>ESMO 明講「<b>available risk classifications essentially refer to ' +
      'KIT-mutated GISTs</b>」 —— SDH 缺陷型、NF1 型、D842V 型的自然病程不同，' +
      '<b>這些表格套在他們身上本來就不準</b>。</td></tr>' +
      '</table>');
  }

  /* ---- 突變檢測 ---- */
  function mutationReference() {
    return fold('<b>突變檢測的演算法與各基因型的意義</b>',
      '<table>' +
      '<tr><td>要不要驗</td><td><b>「Its inclusion in the diagnostic work-up of all GISTs should be ' +
      'considered standard practice [II, A]」</b> —— 所有 GIST 都應該驗，' +
      '<b>唯一可以不驗的是「&lt; 2 cm 的非直腸 GIST」</b>（因為幾乎不會走到藥物治療）。</td></tr>' +
      '<tr><td>順序</td><td>先驗 <b>KIT 與 PDGFRA</b>（Sanger 定序或 NGS）→ 都沒有突變時做 ' +
      '<b>SDHB 免疫組織化學</b>找 SDH 缺陷型 → <b>四陰性</b>（KIT／PDGFRA／BRAF／SDH 都陰）時' +
      '<b>要排除沒被認出來的 NF1</b>。BRAF、NTRK 也在這條路上。</td></tr>' +
      '<tr><td>KIT exon 11</td><td>最常見。對 imatinib 反應最好，輔助治療的獲益也最大。' +
      '<b>牽涉到 codon 557-558 的缺失，復發風險較高</b>（ESMO 引為預後不良因子）。</td></tr>' +
      '<tr><td>KIT exon 9</td><td>轉移期<b>標準第一線是 imatinib 800 mg／天</b>' +
      '［III, B；ESCAT I-A］。輔助情境有些專家也用 800 mg［II, B］，' +
      '但 ESMO 自己註明「<b>currently not supported by any prospective evidence</b>」' +
      '而且「regulatory constraints may limit this practice」。<b>台灣健保沒有增量條文。</b></td></tr>' +
      '<tr><td>PDGFRA<br>（非 D842V）</td><td><b>對 imatinib 敏感，用 imatinib 就好。</b><br>' +
      '❗<b>抗藥的只有 D842V 與 codon 842 附近的少數變異</b>（RD841-842KI、DI842-843IM）—— ' +
      '<b>不是「PDGFRA 突變」都無效，也不是「exon 18 突變」都無效。</b>' +
      'D842Y、D846Y、N848K、Y849K、HDSN845-848P 以及 exon 12 的突變<b>對 imatinib 都是敏感的</b>' +
      '（Corless CL et al. J Clin Oncol 2005;23:5357-5364，PMID 15928335）。<br>' +
      '❗<b>病理報告只寫「PDGFRA exon 18 mutation」而沒有寫出確切的胺基酸變化時，' +
      '不可以直接當成抗藥而停掉 imatinib —— 要回頭把確切變異問清楚。</b></td></tr>' +
      '<tr><td>PDGFRA D842V</td><td><b>對 imatinib 原發性抗藥。</b>' +
      '最大宗的臨床資料（Cassier PA et al. Clin Cancer Res 2012;18:4458-4464，PMID 22718859；' +
      '31 位可評估的 D842V）：<b>客觀反應率 0%、68% 以疾病惡化為最佳反應、中位無惡化存活只有 2.8 個月</b>' +
      '（其他 PDGFRA 突變是 28.5 個月）。原作者用的字是 little efficacy，不是 no efficacy。用 ' +
      '<b>avapritinib 300 mg／天</b>［III, A；MCBS 3；ESCAT I-B］，反應率 &gt; 90%。<br>' +
      '<b>輔助情境完全不給任何藥</b>［IV, D］。預後本身反而是好的。<br>' +
      '❗毒性要盯：<b>認知功能障礙、顱內出血、癲癇。</b></td></tr>' +
      '<tr><td>SDH 缺陷型</td><td>對 imatinib 不敏感；<b>sunitinib 與 regorafenib 可能有部分活性</b>' +
      '［III, B］。<b>不給輔助治療</b>［IV, D］。含 Carney triad（多發性胃 GIST ＋ 副神經節瘤 ＋ ' +
      '肺軟骨瘤，青少年發病、女性居多）與 Carney-Stratakis（胚系 SDH 次單元突變，' +
      '胃 GIST ＋ 副神經節瘤，<b>有淋巴結轉移的可能</b>）。</td></tr>' +
      '<tr><td>NF1 相關</td><td>常為<b>多發性、以小腸為主</b>。' +
      '<b>對 imatinib、sunitinib、regorafenib 三者在轉移期均不敏感</b>；<b>不給輔助治療</b>［IV, D］。</td></tr>' +
      '<tr><td>BRAF</td><td>可考慮 BRAF 抑制劑（含 BRAF＋MEK 併用），' +
      'ESMO 標為<b>仿單外使用、以生物合理性為依據</b>［V, B；ESCAT III-A］。不給輔助治療。</td></tr>' +
      '<tr><td>NTRK 融合</td><td>對 <b>larotrectinib</b> 與 <b>' + NR('entrectinib') + '</b> 敏感' +
      '［III, A；MCBS 3；ESCAT I-C］。不給輔助治療。<br>' +
      '<b>台灣健保只有 larotrectinib（9.95）寫進 GIST</b>；' + NR('entrectinib') + '（9.93）只給付 ROS1 肺癌。</td></tr>' +
      '<tr><td>小兒型</td><td>女性居多、<b>沒有 KIT／PDGFRA 突變</b>、多為 SDH 相關、' +
      '多發性胃部病灶、<b>可能有淋巴結轉移</b>。ESMO 沒有給小兒型專屬演算法，' +
      '只寫「exceedingly rare，需要國際合作」；實務上依 SDH 缺陷型處理。</td></tr>' +
      '<tr><td>實驗室</td><td>ESMO 建議把突變檢測集中在<b>參加外部品管計畫</b>的實驗室。' +
      '台灣端：健保<b>通則十二</b>對報告出自哪一種實驗室有硬性規定，' +
      '<b>不符資格的報告會讓 avapritinib 或 larotrectinib 送審被退</b>。</td></tr>' +
      '</table>');
  }

  /* ---- 手術原則 ---- */
  function surgeryReference() {
    return fold('<b>手術原則</b>（ESMO 2022，局部／區域疾病節）',
      '<table>' +
      '<tr><td>標準術式</td><td><b>「The standard treatment of localised GISTs is a complete surgical ' +
      'excision of the lesion, with no dissection of clinically negative lymph nodes [III, A]」</b><br>' +
      '完整切除，<b>臨床上陰性的淋巴結不要清</b>。目標是 <b>R0</b>' +
      '（切緣在腸胃道原發處無腫瘤細胞）。</td></tr>' +
      '<tr><td>腹腔鏡／機器人</td><td>可以做，但<b>所有腫瘤外科原則都要遵守</b>［III, A］；' +
      '<b>大腫瘤明確不建議</b>（clearly discouraged）—— 因為破裂風險，而破裂等於極高復發風險。<br>' +
      '❗<b>ESMO 沒有給「大腫瘤」的公分數門檻。</b>' +
      '<b>亞洲共識 2025 的立場比較寬（選定病例可以考慮），並提出目前唯一看得到的數字：' +
      '超過 8 cm 要特別謹慎地做術前評估與手術規劃。</b></td></tr>' +
      '<tr><td>內視鏡切除</td><td>上或下消化道的小腫瘤，' +
      '<b>在有內視鏡手術經驗的肉瘤中心</b>可以考慮。</td></tr>' +
      '<tr><td>R1 切緣</td><td><b>「If R1 excision was already carried out, a re-excision is not ' +
      'recommended on a routine basis.」</b><br>' +
      '而且<b>「the microscopic margin status should not be used to dictate adjuvant medical therapy ' +
      'decisions」 —— 切緣陽性不是給輔助治療的理由</b>（風險分級才是）。<br>' +
      '位置不好的低風險 GIST，<b>可以和病人討論後接受可能的 R1</b>［IV, B］。</td></tr>' +
      '<tr><td>轉移期的手術</td><td><b>手術不是轉移性 GIST 的第一線做法。</b>' +
      '對 imatinib 有反應的病人切除殘存病灶預後好，但「never been demonstrated prospectively ' +
      'whether this is due to surgery or to patient selection」→ <b>個案化、與病人共同決定</b>［III, C］。</td></tr>' +
      '<tr><td>照護場域</td><td>ESMO：應在<b>肉瘤與 GIST 的參考中心</b>或參考網絡內處理。<br>' +
      '<b>台大肉瘤診療指引（版次 08）第 9 頁註腳：GIST 雖被排除在腹膜後肉瘤分類之外，' +
      '仍應在多專科團隊（MDT）討論。</b>這是本頁唯一引用得到的台大條文。</td></tr>' +
      '</table>');
  }

  /* ---- 療效判讀 ---- */
  function responseReference() {
    return fold('<b>療效怎麼判讀？</b>用 RECIST 直接看大小會判錯',
      '<table>' +
      '<tr><td>核心觀念</td><td><b>「both tumour size and tumour density on CT scan … should be ' +
      'considered as criteria for tumour response」</b> —— <b>密度和大小一樣重要。</b></td></tr>' +
      '<tr><td>會判反的三件事</td><td>①<b>腫瘤變大但密度變低，可能是有反應</b>；' +
      '②<b>「新病灶」可能只是原本看不見的低密度病灶變得看得到</b>；' +
      '③<b>腫瘤大小沒變，密度局部變高，可能是進展。</b></td></tr>' +
      '<tr><td>典型進展形態</td><td><b>「nodule within the mass」</b> —— ' +
      '一顆正在反應的病灶裡面冒出一塊高密度結節。</td></tr>' +
      '<tr><td>PET</td><td>對早期反應評估非常敏感，' +
      '<b>但有一小部分 GIST 不吃 FDG。</b></td></tr>' +
      '<tr><td>穩定也算有效</td><td><b>「The absence of tumour progression after 6 months of treatment ' +
      'is also considered as tumour response.」</b></td></tr>' +
      '<tr><td>❗ 換藥之前</td><td>ESMO 要求先排除三件事：<b>①影像上的假性進展 ②病人沒有按時吃藥 ' +
      '③和併用藥物的交互作用。</b>早期進展要由有經驗的團隊確認。</td></tr>' +
      '</table>');
  }

  /* ---- 亞洲共識 2025：和 ESMO 不一樣的地方 ---- */
  function asianReference() {
    return fold('<b>亞洲共識 2025 和 ESMO 2022 不一樣的地方</b>（有台大作者列名，值得對照）',
      '<table>' +
      '<tr><td colspan="2"><b>Updated Asian consensus guidelines for the diagnosis and management of ' +
      'gastrointestinal stromal tumor (2025)</b>，Gastric Cancer，2026 年 7 月 15 日線上發表，PMID 42455249，' +
      'Open Access。<b>台灣列名作者：台大醫院內科部王秀伯、台北榮總顏厥全、林口長庚葉春輝、高醫陳立宗、' +
      '國衛院李健逢。</b><br>' +
      '⚠<b>它不是完整指引，是聚焦式更新</b>：4 個領域、11 個 CQ、25 條 statement，19 位委員匿名投票。' +
      '<b>它明說沒有做 GRADE 之類的證據分級，只有投票率</b>，而且' +
      '<b>「制定時未考慮各國的藥證與保險給付狀態」</b> —— 所以台灣健保仍要另外查。</td></tr>' +
      '<tr><td><b>輔助治療<br>可以吃到 6 年</b></td><td>ESMO 只說「更長療程的隨機試驗還在做」。' +
      '亞洲共識新增 statement 4-1-2「Adjuvant imatinib therapy for <b>6 years</b> can be recommended」，' +
      '依據是 <b>IMADGIST</b>（Blay JY et al. Ann Oncol 2024;35:1157-1168，PMID 39241959）：' +
      '高風險病人做滿 3 年後<b>再延 3 年，無病存活顯著改善</b>，整體存活資料未成熟。<br>' +
      '❗<b>但這一條的共識率只有 66.7%（12/18），有 5 位委員明確反對</b> —— ' +
      '是全文唯二有超過四分之一反對的條文。<b>強度和「3 年」那一條差很多，不應該並列。</b><br>' +
      '❗<b>台灣健保 9.22 明文 3 年，沒有延長條款。</b>要吃到 6 年得自費。</td></tr>' +
      '<tr><td><b>破裂者<br>要吃更久</b></td><td>亞洲共識 4-1-3（共識 88.9%）：' +
      '<b>「Extended or lifelong adjuvant imatinib therapy is recommended for ruptured GIST」。</b><br>' +
      'ESMO 只寫「應該考慮給 imatinib［IV, A］，但最佳療程長度未定義」。<br>' +
      '<b>健保這一格給付 3 年（條件 D），再往下要自費。</b></td></tr>' +
      '<tr><td><b>什麼時候開始<br>吃輔助治療</b></td><td>亞洲共識有給時限：' +
      '<b>「initiating adjuvant therapy within approximately 12 weeks」</b>（術後約 12 週內），' +
      '依據是延遲超過 4 個月可能損害存活（PMID 34319443）。<b>ESMO 完全沒有提這件事。</b></td></tr>' +
      '<tr><td><b>用哪一套<br>風險分級選人</b></td><td>亞洲共識<b>明確指定 modified NIH</b>' +
      '（理由是日本的研究顯示它偵測高復發風險最敏感，PMID 24853473；' +
      '韓國的研究顯示破裂即使做滿 3 年輔助仍有預後意義，PMID 35678337）。<br>' +
      '<b>ESMO 刻意不選邊</b>，並警告門檻要謹慎解讀。<br>' +
      '<b>本頁的格子用 AFIP（有百分比、看得到部位差異），破裂與 AFIP 無資料的格子用 modified NIH。</b>' +
      '亞洲共識在病理報告的建議則是「AFIP 或 modified NIH 擇一」。</td></tr>' +
      '<tr><td><b>KIT exon 9<br>要不要用 800 mg</b><br>❗方向相反</td><td>' +
      '<b>ESMO：第一線起手就 800 mg，寫成 standard</b>［III, B；ESCAT I-A］。<br>' +
      '<b>亞洲共識：主要放在「標準劑量進展之後」才加量</b>，而且原文寫' +
      '<b>「higher doses may be less favorable than switching to sunitinib」</b>、' +
      '<b>「dose escalation should be applied cautiously, especially in Asian patients」</b>。<br>' +
      '<b>輔助情境亞洲共識更是引反證</b>：一篇回溯研究顯示 exon 9 在輔助情境用 800 mg ' +
      '<b>沒有存活效益</b>（Vincenzi B et al. Clin Cancer Res 2022，PMID 34615721）。<br>' +
      '兩邊引用的是同一份 MetaGIST（PMID 20124181），詮釋不同。<br>' +
      '<b>加上台灣健保根本沒有劑量條文 —— 這一格請提多專科團隊討論，本頁不替你決定。</b></td></tr>' +
      '<tr><td><b>可以從低劑量<br>開始</b></td><td>亞洲共識 3-4-1（共識 100%）：' +
      '<b>「Starting at a lower dose may be considered for patients who have comorbidities or who are ' +
      'unlikely or deemed unable to tolerate the standard dose」。</b><br>' +
      '❗但同一段也警告<b>「沒有適當理由就減量，可能降低療效，不建議」</b>。<br>' +
      'ESMO 沒有這一條，只講維持劑量強度、靠處理副作用與減量／中斷來撐。</td></tr>' +
      '<tr><td><b>經皮切片</b><br>❗方向相反</td><td>' +
      '<b>ESMO：可以做</b>（EUS 導引或超音波／CT 導引經皮），並說「正確執行的話腹膜種植或出血的風險可忽略」。<br>' +
      '<b>亞洲共識 2-1-3（共識 100%）：原發局部腫瘤一般<u>不建議</u>經皮切片</b>，' +
      '只有轉移或復發病灶、或 EUS 導引做不到時才可接受。<br>' +
      '<b>這一格兩份權威指引講反話，做之前請提多專科團隊討論。</b></td></tr>' +
      '<tr><td><b>大腫瘤的<br>腹腔鏡</b></td><td><b>ESMO：大腫瘤明確不建議</b>（clearly discouraged），沒給公分數。<br>' +
      '<b>亞洲共識：選定的病例可以考慮</b>，並提出<b>超過 8 cm 要特別謹慎地做術前評估與手術規劃</b>。' +
      '這是目前唯一看得到的數字門檻。</td></tr>' +
      '<tr><td><b>內視鏡全層切除<br>（EFTR）</b></td><td><b>ESMO：技術上做得到完整切除又不弄破就可以接受。</b><br>' +
      '<b>亞洲共識：弱不建議</b> —— 擔心腫瘤溢出，長期復發與存活的影響也還不確定。</td></tr>' +
      '<tr><td><b>SDH 缺陷型的<br>淋巴結</b></td><td>這一格<b>亞洲共識補上了 ESMO 的缺口</b>：' +
      '<b>「An exception is SDH-deficient GIST, which has a higher incidence of nodal involvement; ' +
      'even in such cases, <u>selective removal of clinically enlarged lymph nodes is considered ' +
      'sufficient</u>」</b> —— <b>只摘臨床上腫大的，不做系統性廓清。</b></td></tr>' +
      '<tr><td><b>BRAF V600E</b></td><td><b>ESMO：仿單外使用，以生物合理性為依據</b>［V, B；ESCAT III-A］。<br>' +
      '<b>亞洲共識 3-2-3（共識 100%）：dabrafenib ＋ trametinib 是正式建議。</b>' +
      '差別在 ROAR 試驗的最終報告（Subbiah V et al. Nat Med 2023;29:1103-1112，PMID 37059834）' +
      '在 ESMO 成文之後才發表。</td></tr>' +
      '<tr><td><b>第四線之後</b></td><td>亞洲共識的第四線列<b>ripretinib 或 pimitespib</b>；' +
      '並明白排序<b>「ripretinib is favored due to its greater magnitude of benefit and tolerability」</b>。<br>' +
      '❗<b>' + NR('pimitespib') + ' 目前只有日本有</b>（亞洲共識原文：currently only available in Japan），' +
      '<b>台灣沒有藥證也沒有健保</b>，本頁不列為選項。' +
      '它的共識率也是全文藥物條文中最低的（75.0%）。</td></tr>' +
      '<tr><td><b>不敏感型別的<br>藥物清單</b></td><td>亞洲共識把 <b>ripretinib 也列進「不敏感」那一句</b>：' +
      'PDGFRA exon 18（尤其 D842V）、NF1 相關、SDH 缺陷型、BRAF 突變的 GIST，' +
      '<b>對 imatinib、sunitinib、regorafenib 與 ripretinib 一般都不敏感。</b>' +
      'ESMO 那一句沒有包含 ripretinib。</td></tr>' +
      '<tr><td><b>ESMO 有、<br>亞洲共識沒有</b></td><td><b>緩和性放射治療、sunitinib 的給藥排程、' +
      '療效判讀（密度、nodule within the mass、PET）、分期影像、R1 切緣的處理、' +
      '直腸小結節一律切、小兒型 GIST 的段落</b> —— 這幾項亞洲共識全文都沒有寫，' +
      '<b>本頁這些段落依 ESMO 2022。</b></td></tr>' +
      '</table>');
  }

  /* ---- 追蹤 ---- */
  function followupHTML(kind) {
    var head = '<div class="fu-h">接下來怎麼追蹤</div>';
    if (kind === 'surv') {
      return head + '<ul class="fu-list">' +
        '<li><b>ESMO 明講「an evidence-based, optimal follow-up policy is lacking」</b> —— ' +
        '小 GIST 的主動監測沒有實證的排程。</li>' +
        '<li>指引提出的合理做法：<b>先在 3 個月左右做第一次短期評估；沒有長大，就把間隔拉長。</b></li>' +
        '<li><b>長大或開始有症狀時就切除。</b></li>' +
        '<li>回步驟 1 重選，可以切換到手術或藥物那幾條路。</li></ul>';
    }
    if (kind === 'meta') {
      return head + '<ul class="fu-list">' +
        '<li><b>轉移性的 imatinib 要一直吃下去，直到臨床上有意義的進展或無法耐受</b>［I, A］ —— ' +
        '<b>中斷之後腫瘤通常很快就長回來，即使病灶已經開過刀切掉也一樣。</b></li>' +
        '<li>BFR14 隨機中斷試驗（Blay JY et al. J Clin Oncol 2007;25:1107-1113，PMID 17369574）：' +
        '滿一年後隨機中斷，<b>中斷組 32 人中 26 人惡化，持續組 26 人中只有 8 人</b>（P &lt; .0001）。' +
        '好消息是<b>惡化的 26 人中有 24 人重新給藥後再度有反應</b>。</li>' +
        '<li>要和病人講清楚<b>按時服藥的重要性、和其他藥與食物的交互作用、副作用怎麼處理</b>。</li>' +
        '<li><b>血中濃度不是常規</b>；只有三種情形有用：有重大交互作用風險或做過腸道切除、' +
        '出現意料外的毒性、敏感基因型卻反應不如預期。</li>' +
        '<li>影像追蹤用<b>三相顯影腹部與骨盆 CT</b>；判讀要看密度（見上方收合的療效判讀）。</li></ul>';
    }
    if (kind === 'adjhigh') {
      return head + '<ul class="fu-list">' +
        '<li><b>高風險病人的復發，多半發生在輔助治療結束後的 1–3 年內。</b></li>' +
        '<li>ESMO 舉的排程範例（明白標示為「as an example, at some institutions」，' +
        '<b>不是正式建議條文</b>）：<b>輔助治療期間每 3–6 個月做腹部 CT 或 MRI，做 3 年</b>；' +
        '<b>停藥後每 3 個月一次做 2 年</b>；<b>之後每 6 個月一次到停藥後滿 5 年</b>；' +
        '<b>再每年一次追加 5 年。</b></li>' +
        '<li>吃藥期間臨床上要追得更密，因為要處理副作用。</li>' +
        '<li><b>復發最常在肝臟和腹膜。</b></li>' +
        '<li><b>亞洲共識 2025 的排程不一樣，錨點是「手術日」不是「停藥日」</b>：高風險與中風險合併一組，' +
        '<b>術後 3 年內每 3–4 個月做腹部與骨盆 CT，到第 5 年每 6 個月一次，之後每年一次</b>；' +
        '<b>超音波每年可以取代一次 CT。</b>PET 在術後監測的角色未確立。</li>' +
        '<li><b>亞洲共識另外提醒：停掉 imatinib 之後 1–2 年，復發率會上升。</b></li>' +
        '<li>發現復發 → 回步驟 1 選「治療中進展、不耐受，或停藥後復發」。</li></ul>';
    }
    if (kind === 'adjlow') {
      return head + '<ul class="fu-list">' +
        '<li><b>ESMO：低風險腫瘤常規追蹤的效益不明</b>；若要追，' +
        '舉例是<b>每 6–12 個月做腹部 CT 或 MRI，做 5 年</b>。</li>' +
        '<li><b>極低風險的大概不需要常規追蹤，但風險不是零。</b></li>' +
        '<li><b>低風險病人要把輻射曝露算進去</b> —— 可以改用腹部 MRI。</li>' +
        '<li>低風險病人的復發可能來得比較晚。</li>' +
        '<li>❗<b>亞洲共識 2025 對低風險族群比 ESMO 積極</b>：低與極低風險合併一組，' +
        '<b>術後每 6 個月做一次 CT，做滿 5 年</b>（ESMO 說極低風險大概不必常規追蹤）。' +
        '<b>而且亞洲共識「要不要常規追蹤」這一條本身共識率只有 73.7%，是全文最低的</b> —— ' +
        '19 位委員有 5 位反對。這一格本來就沒有標準答案。</li></ul>';
    }
    return head + '<ul class="fu-list">' +
      '<li>影像追蹤用<b>三相顯影腹部與骨盆 CT</b>；直腸 GIST 用<b>骨盆 MRI</b> 看得比較清楚。</li>' +
      '<li><b>復發最常在肝臟和腹膜</b>，所以追蹤的重點放在這兩處。</li>' +
      '<li>發現復發 → 回步驟 1 選「治療中進展、不耐受，或停藥後復發」。</li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function gistPathwayHTML() {
    var h = '';
    /* 這一段和上方的 edition 欄曾經各講一次「台大沒有 GIST 指引」，重複度太高。
       依 pathway-ux-rules 1-4「同一件事只寫一次」：這件事只在這裡點一句，
       完整的依據（肉瘤指引版次 08 第 9 頁 exclusion 與 MDT 註腳）收在
       surgeryReference() 的「照護場域」那一列，各建議卡的來源欄也不再重複。 */
    h += '<p class="onc-note">GIST 的臨床內容<b>依院外實證</b>編成 —— ' +
      '主幹為 ESMO–EURACAN–GENTURIS 2022（Ann Oncol 2022;33:20-33），' +
      '並對照 2025 亞洲共識（有台大作者列名）；<b>台大沒有 GIST 診療指引</b>，' +
      '每一張建議卡的來源欄都標明出處與版本。<br>' +
      '步驟照臨床決策實際發生的先後排：<b>發現腫瘤 → 追蹤還是切除 → 直接開刀還是先給藥 → ' +
      '術後風險分級決定輔助治療 → 轉移與進展的線別</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是風險分級、劑量、健保條文與參考資料。</p>';
    h += '<div class="onc-path" id="giPath">';

    h += node0('gi_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'dx', '影像或內視鏡發現腫瘤，還沒治療', '先決定追蹤還是切除') +
      opt('scope', 'postop', '已經完整切除，要決定要不要吃輔助 imatinib', '風險分級是這一段的核心') +
      opt('scope', 'adv', '一開始就是轉移性，或局部切不下來', '走全身性 TKI') +
      opt('scope', 'prog', '治療中進展、不耐受，或停藥後復發', '換不換藥、換哪一個'));

    /* ── A. 初診 ── */
    h += '<div id="gi_b_dx" class="hidden">';
    h += node('gi_n_site', '2', '這個病灶屬於哪一種？（ESMO 的四個入口，決定要不要切片、能不能只追蹤）',
      opt('site', 'gd2', '食道胃或十二指腸的黏膜下結節，< 2 cm', '先做內視鏡超音波；主動監測只在這一格才是選項') +
      opt('site', 'rect', '直腸的結節', '不論大小 —— 直腸是例外，不可以只觀察') +
      opt('site', 'ge2', '腫瘤 ≥ 2 cm', '切片或切除') +
      opt('site', 'mass', '腹腔內的腫塊，內視鏡搆不到', '可移動的腫塊、或需要多器官切除的大腫瘤'));
    h += recBox('gi_r_site', '建議處置 · 追蹤還是切除、切片怎麼做');
    h += fuBox('gi_f_site');
    h += node('gi_n_resect', '3', '這個腫瘤切得下來嗎？要付出什麼代價？',
      opt('resect', 'direct', '可以完整切除，而且不必犧牲器官功能', '直接手術') +
      opt('resect', 'morbid', '切得下來，但要犧牲器官或造成重大功能損失', '如全胃切除、腹會陰切除、胰十二指腸切除') +
      opt('resect', 'unres', '局部無法切除', ''));
    h += recBox('gi_r_resect', '建議處置 · 直接開刀還是先給藥');
    h += fuBox('gi_f_dx');
    h += node('gi_n_nres', '4', '術前 imatinib 治療後，重新評估的結果是哪一種？',
      opt('nres', 'resect', '縮小到可以切除了', '') +
      opt('nres', 'stable', '穩定或有反應，但仍然切不下來', '') +
      opt('nres', 'prog', '治療中進展', ''));
    h += recBox('gi_r_nres', '建議處置 · 術前治療後怎麼走');
    h += fuBox('gi_f_nres');
    h += '</div>';

    /* ── B. 術後：風險分級與輔助治療 ── */
    h += '<div id="gi_b_postop" class="hidden">';
    h += node('gi_n_psite', '2', '原發部位在哪裡？（AFIP 風險分級依部位分四張表）',
      opt('psite', 'gastric', '胃或網膜', '同樣大小同樣分裂速率，胃的預後最好') +
      opt('psite', 'duo', '十二指腸', '') +
      opt('psite', 'si', '空腸或迴腸', '') +
      opt('psite', 'rectum', '直腸', '') +
      opt('psite', 'other', '食道、大腸、腸繫膜或腹膜', 'AFIP 表未列，比照空腸迴腸'));
    h += node('gi_n_risk', '3', '腫瘤多大？有絲分裂速率多少？（點格子）', '',
      '<div id="gi_risk_hold"></div>');
    h += recBox('gi_r_risk', '建議處置 · 這一格的復發風險');
    h += node('gi_n_rupt', '4', '腫瘤有沒有破裂？（術前自發破裂或術中破裂）',
      opt('rupt', 'no', '沒有破裂，包膜完整', '') +
      opt('rupt', 'yes', '有破裂', '不論大小與分裂速率，單獨即為高風險'));
    h += node('gi_n_mut', '5', '基因突變檢測的結果是哪一種？',
      opt('mut', 'ex11', 'KIT exon 11 突變', '最常見，對 imatinib 反應最好') +
      opt('mut', 'ex9', 'KIT exon 9 突變', '對標準劑量反應較差') +
      opt('mut', 'pdgfra', 'PDGFRA 突變，但不是 D842V', '') +
      opt('mut', 'd842v', 'PDGFRA D842V 突變', '對 imatinib 原發性抗藥') +
      opt('mut', 'sdh', 'SDH 缺陷型', '含 Carney triad／Carney-Stratakis') +
      opt('mut', 'wt', 'KIT 與 PDGFRA 都沒有突變（wild-type）', '要再往下分 SDH／NF1／BRAF／NTRK') +
      opt('mut', 'unk', '還沒驗', ''));
    /* ⚠ .rec-label 會被 text-transform:uppercase —— 標籤裡不要放小寫藥名（imatinib → IMATINIB） */
    h += recBox('gi_r_adj', '建議處置 · 要不要吃輔助治療、吃多久');
    h += fuBox('gi_f_adj');
    h += '</div>';

    /* ── C. 轉移性／不可切除 ── */
    h += '<div id="gi_b_adv" class="hidden">';
    h += node('gi_n_mut2', '2', '基因突變檢測的結果是哪一種？（這一步決定第一線用什麼）',
      opt('mut', 'ex11', 'KIT exon 11 突變', '') +
      opt('mut', 'ex9', 'KIT exon 9 突變', '') +
      opt('mut', 'pdgfra', 'PDGFRA 突變，但不是 D842V', '') +
      opt('mut', 'd842v', 'PDGFRA D842V 突變', '') +
      opt('mut', 'sdh', 'SDH 缺陷型', '') +
      opt('mut', 'wt', 'KIT 與 PDGFRA 都沒有突變（wild-type）', '含 NF1、BRAF、NTRK') +
      opt('mut', 'unk', '還沒驗', '先驗，這一步會改變第一線用什麼'));
    h += node('gi_n_line', '3', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', 'imatinib 失敗或不耐受之後') +
      opt('line', 'l3', '第三線', '') +
      opt('line', 'l4', '第四線以後', ''));
    h += recBox('gi_r_adv', '建議處置 · 全身性治療');
    h += fuBox('gi_f_adv');
    h += '</div>';

    /* ── D. 進展／不耐受／停藥後復發 ── */
    h += '<div id="gi_b_prog" class="hidden">';
    h += node('gi_n_pmode', '2', '目前的狀況是哪一種？',
      opt('pmode', 'focal', '大部分病灶都控制住，只有一兩處在長', '局部進展') +
      opt('pmode', 'general', '多處同時進展', '全面進展') +
      opt('pmode', 'intol', '不是進展，是副作用受不了', '') +
      opt('pmode', 'offtx', '輔助治療吃完停藥之後才復發', ''));
    h += recBox('gi_r_prog', '建議處置 · 進展或不耐受時怎麼辦');
    h += fuBox('gi_f_prog');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="gistReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="gi_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="gi_drugs"></div>';
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
    var root = el('giPath');
    if (!root) return;
    root.querySelectorAll('.gi-node').forEach(function (n) {
      if (n.id !== 'gi_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['gi_b_dx', 'gi_b_postop', 'gi_b_adv', 'gi_b_prog'].forEach(function (id) { show(id, false); });
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

  /* ---------- A. 初診：追蹤還是切除 ---------- */
  function renderDx() {
    show('gi_b_dx', true);
    show('gi_n_site', true);
    if (!S.site) return;

    var L = [], cls = 'rec-elective', title;

    if (S.site === 'gd2') {
      title = '食道胃或十二指腸的黏膜下結節，&lt; 2 cm<br>→ 先做內視鏡超音波，再看切片做不做得到';
      L.push(H('第一步', 'ESMO 2022 診斷節 ［IV, C］'));
      L.push('<b>內視鏡超音波（EUS）是標準做法。</b>');
      L.push(EV('這個尺寸的黏膜下結節<b>內視鏡切片常常取不到東西</b>，' +
        'ESMO 直說「laparoscopic/open excision may be the only way to make a histological diagnosis」。'));
      L.push(H('切片拿得到、而且確診是 GIST', 'ESMO 2022 ［IV, C］'));
      L.push('<b>就要切除 —— 除非預期會有重大併發症</b>（ESMO 舉的例子是<b>食道胃接合部</b>與' +
        '<b>十二指腸第二段內側</b>）。');
      L.push('<b>技術上做得到完整切除又不會弄破腫瘤時，內視鏡切除是可接受的替代做法</b>，' +
        '目的是把併發症壓低。');
      L.push('<b>病人也可以選擇主動監測</b> —— 依<b>腫瘤位置、年齡、預期壽命、共病</b>決定。' +
        '<b>長大或出現症狀時再切除。</b>');
      L.push(H('切片做不到，或檢體不夠診斷', 'ESMO 2022 ［IV, C］'));
      L.push('<b>一般建議主動監測。</b>病人也可以選擇手術或內視鏡切除，同樣看年齡、預期壽命與共病。');
      L.push(H('❗ 一個會查到相反答案的版本陷阱', 'ESMO 2018 vs 2022'));
      L.push(EV('<b>「小的胃 GIST 可以只追蹤」是 ESMO 2018 版的講法</b>' +
        '（Ann Oncol 2018;29 Suppl 4:iv68-iv78）。<b>2022 版已經把預設翻過來 —— ' +
        '確診是 GIST 就切除，除非預期會有重大併發症；主動監測退成替代方案與醫病共決的選項。</b>' +
        '查到的資料如果寫「ESMO 建議追蹤」，先確認是哪一版。' +
        '<b>本頁依現行的 2022 版。</b>'));
      L.push(H('要不要驗突變？', 'ESMO 2022 ［II, A］'));
      L.push('<b>所有 GIST 原則上都要驗，但「&lt; 2 cm 的非直腸 GIST」是明文的例外</b> —— ' +
        '因為幾乎不會走到藥物治療。');
      L.push(H('決定要切的話', ''));
      L.push('<b>下面的步驟 3 判斷切得下來、要付出什麼代價。</b>');
      fill('gi_r_site', 'rec-idle', title, L,
        'ESMO–EURACAN–GENTURIS GIST CPG，Ann Oncol 2022;33:20-33（PMID 34560242），診斷節。',
        more(mitosisReference(), mutationReference(), surgeryReference(), asianReference()));
      fu('gi_f_site', 'surv');

    } else if (S.site === 'rect') {
      cls = 'rec-urgent';
      title = '直腸的結節<br>→ 不論大小，都要做直腸超音波＋骨盆 MRI，然後切片或切除';
      L.push(H('直腸是明文的例外', 'ESMO 2022 診斷節'));
      L.push('<b>「the standard approach to rectal nodules is represented by biopsy or excision after ' +
        'endorectal ultrasound assessment and pelvic MRI, <u>regardless of the tumour size and mitotic rate</u>」</b>');
      L.push('<b>直腸 &lt; 2 cm 不可以只觀察</b> —— 這和胃或十二指腸的同尺寸病灶完全相反。');
      L.push(H('為什麼直腸不一樣', 'ESMO 2022 診斷節'));
      L.push('<b>① 這個部位進展成臨床上有意義 GIST 的風險，比大多數胃 GIST 高。</b>');
      L.push('<b>② 預後明顯較差。</b>');
      L.push('<b>③ 手術在局部造成的後果嚴重得多</b>（保不保得住肛門）。');
      L.push(EV('看一下本頁的 AFIP 格子就知道差多少：<b>直腸 GIST ≤ 2 cm 但高有絲分裂速率，' +
        '進展率 54%；胃的同一格是「無」。</b>'));
      L.push(H('影像', 'ESMO 2022 分期節'));
      L.push('<b>直腸 GIST 用 MRI，術前分期的資訊比 CT 好。</b>');
      L.push(H('下一步', ''));
      L.push('<b>下面的步驟 3 判斷切得下來、要付出什麼代價 —— 直腸最常落在「切得下來但代價很大」那一格。</b>');
      fill('gi_r_site', cls, title, L,
        'ESMO 2022 診斷節（rectal nodules）與分期節（MRI）。',
        more(mitosisReference(), mutationReference(), surgeryReference(), asianReference()));

    } else if (S.site === 'ge2') {
      title = '腫瘤 ≥ 2 cm<br>→ 標準做法是切片或切除，不觀察';
      L.push(H('為什麼不觀察', 'ESMO 2022 ［IV, C］'));
      L.push('<b>「The standard approach to tumours ≥ 2 cm in size is biopsy/excision because they are ' +
        'associated with a higher risk of progression if confirmed as GIST」</b>');
      L.push(H('切片怎麼取', 'ESMO 2022 診斷節'));
      L.push('<b>走 EUS 導引，或超音波／CT 導引的經皮途徑。</b>');
      L.push(EV('<b>ESMO 這一版沒有禁止經皮切片</b> —— 原文寫「The risk of peritoneal contamination ' +
        'or bleeding is negligible if the procedure is properly carried out」。' +
        '唯一的限縮是<b>高風險病灶（囊性腫塊、腹腔內可移動的腫塊）只能在專門中心評估與切片</b>。'));
      L.push('❗<b>粗針切片不算腫瘤破裂，但腹腔鏡或開腹的「切開式切片」算</b> —— 見下方收合的破裂定義。');
      L.push('❗<b>經皮切片這一格，兩份權威指引講反話。</b>' +
        '<b>亞洲共識 2025（共識 100%）對「原發、局部」的腫瘤一般<u>不建議</u>經皮切片</b>，' +
        '只有轉移或復發病灶、或 EUS 導引做不到時才可接受。' +
        '<b>做之前請提多專科團隊討論。</b>');
      L.push(H('先切片的好處', 'ESMO 2022 診斷節'));
      L.push('<b>可以讓外科依病理決定策略、可以考慮術前治療，也可以避免替不該開刀的病灌開刀</b>' +
        '（淋巴瘤、腸繫膜纖維瘤病、生殖細胞瘤）。');
      L.push('<b>手術併發症有限時，直接做腹腔鏡或開腹切除也是可以個案考量的選項。</b>');
      L.push(H('下一步', ''));
      L.push('<b>下面的步驟 3 判斷切得下來、要付出什麼代價。</b>');
      fill('gi_r_site', cls, title, L,
        'ESMO 2022 診斷節（tumours ≥ 2 cm、biopsy 途徑）。',
        more(ruptureReference(), mitosisReference(), mutationReference(), surgeryReference(), asianReference()));

    } else {
      title = '腹腔內的腫塊，內視鏡搆不到<br>→ 依「會不會做到多器官切除」分兩條路';
      L.push(H('兩條路', 'ESMO 2022 診斷節'));
      L.push('<b>① 腹腔內的結節或可移動的腫塊，內視鏡評估不到 → 腹腔鏡或開腹切除是標準做法。</b>');
      L.push('<b>② 腫塊很大、手術很可能變成多器官切除（multivisceral resection）→ ' +
        '標準做法是先做多針粗針切片（multiple core needle biopsies）。</b>');
      L.push(EV('第 ② 條就是「先切片再決定」的情境 —— <b>因為多器官切除的代價太高，' +
        '不能在不知道是什麼東西的情況下開下去</b>，而且知道是 GIST 之後可以先給 imatinib 縮小。'));
      L.push(H('已經看得到明顯轉移的話', 'ESMO 2022 診斷節'));
      L.push('<b>切轉移病灶就夠了（哪一個好取就取哪一個），不必為了診斷去動原發病灶。</b>');
      L.push(H('高風險病灶的限制', 'ESMO 2022 診斷節'));
      L.push('<b>囊性腫塊、腹腔內可移動的腫塊，只能在專門中心評估與切片。</b>');
      L.push(H('下一步', ''));
      L.push('<b>下面的步驟 3 判斷切得下來、要付出什麼代價。</b>');
      fill('gi_r_site', cls, title, L,
        'ESMO 2022 診斷節（abdominal nodule／large mass／metastatic presentation）。',
        more(ruptureReference(), mutationReference(), surgeryReference(), asianReference()));
    }

    show('gi_n_resect', true);
    if (!S.resect) return;
    renderResect();
  }

  function renderResect() {
    var L = [], cls, title;

    if (S.resect === 'direct') {
      cls = 'rec-elective';
      title = '可以完整切除，不必犧牲器官功能<br>→ 直接手術，目標 R0，不清淋巴結';
      L.push(H('標準術式', 'ESMO 2022 ［III, A］'));
      L.push('<b>完整切除病灶，臨床上陰性的淋巴結不做廓清。目標是 R0。</b>');
      L.push(EV('GIST 幾乎不轉移到淋巴結 —— 例外是 <b>SDH 缺陷型與小兒型</b>' +
        '（Carney-Stratakis 有淋巴結轉移的可能）。ESMO 對這兩型是否要清淋巴結<b>沒有另訂條文</b>。'));
      L.push(H('最重要的一件事：不要弄破', 'ESMO 2022'));
      L.push('<b>腫瘤破裂會讓腹腔內出現微轉移，復發風險極高。</b>' +
        '<b>大腫瘤明確不建議走腹腔鏡</b>，就是因為破裂風險（ESMO 沒有給公分數門檻）。');
      L.push('<b>粗針切片造成的缺損不算破裂；腹腔鏡或開腹的切開式切片算。</b>');
      L.push(H('如果最後是 R1', 'ESMO 2022 ［IV, B］'));
      L.push('<b>已經做成 R1 的，不建議常規再切一次。</b>');
      L.push('<b>而且切緣狀態不應該拿來決定要不要給輔助治療 —— 決定輔助治療的是風險分級。</b>');
      L.push(H('術後要拿到的病理資訊', ''));
      L.push('<b>腫瘤大小、有絲分裂數（每 5 mm²）、部位、有沒有破裂，還有突變型</b> —— ' +
        '這四樣就是下一步風險分級要用的。');
      L.push(H('下一步', ''));
      L.push('<b>切完之後回步驟 1 選第二項「已經完整切除…」，做風險分級與輔助治療決策。</b>');
      fill('gi_r_resect', cls, title, L,
        'ESMO 2022 局部／區域疾病節（surgery ［III, A］、R1 ［IV, B］）。' +
        '台大肉瘤診療指引版次 08 第 9 頁：GIST 雖排除於腹膜後肉瘤分類，仍應在多專科團隊討論。',
        more(surgeryReference(), ruptureReference(), mitosisReference(), mutationReference(), asianReference()));
      fu('gi_f_dx', null);
      return;
    }

    /* morbid 與 unres 都走術前 imatinib */
    cls = 'rec-nonop';
    if (S.resect === 'morbid') {
      title = '切得下來，但要犧牲器官或造成重大功能損失<br>→ 先給 imatinib 縮小，這是標準做法';
      L.push(H('這一格的原文', 'ESMO 2022 ［III, A］'));
      L.push('<b>「If R0 surgery is not feasible, or it could be achieved through less mutilating, ' +
        'function-sparing surgery in the case of volumetric reduction (<u>this includes total gastrectomy ' +
        'and all other major procedures</u>), pre-treatment with imatinib is standard, ' +
        'as long as the mutation profile of the tumour is sensitive」</b>');
      L.push('<b>ESMO 把「全胃切除」直接寫進這一格。</b>直腸的腹會陰切除、' +
        '十二指腸的胰十二指腸切除，同一個道理。');
      L.push('<b>外科覺得「先縮小再開比較安全」（降低出血與破裂風險）時，也適用。</b>');
    } else {
      title = '局部無法切除<br>→ 先給 imatinib，這是標準做法';
      L.push(H('這一格的原文', 'ESMO 2022 ［III, A］'));
      L.push('<b>R0 手術做不到時，只要突變型對藥物敏感，術前 imatinib 就是標準做法。</b>');
      L.push(EV('<b>有出血或廔管不一定不能給術前治療</b> —— ' +
        'ESMO 明寫「the presence of bleeding or fistulas does not necessarily prevent neoadjuvant therapy」。'));
    }

    L.push(H('開始之前一定要做的事', 'ESMO 2022 neoadjuvant 段'));
    L.push('<b>要切片並做突變檢測</b> —— 目的有三：確認組織診斷、<b>排除對 imatinib 不敏感或抗藥的基因型</b>、' +
      '以及<b>決定 KIT exon 9 要不要用 800 mg</b>。');
    L.push('❗<b>PDGFRA D842V 對 imatinib 是原發性抗藥</b>（客觀反應率 0%、中位無惡化存活約 2.8 個月，' +
      'PMID 22718859）；這一型的術前治療要用 ' +
      '<b>avapritinib</b>［III, A；MCBS 3；ESCAT I-B］。');
    L.push('❗<b>SDH 缺陷型與 NF1 相關的 GIST 對 imatinib 不敏感</b>，術前給藥沒有意義。');
    L.push(H('劑量', 'ESMO 2022'));
    L.push('<b>imatinib 400 mg／天；KIT exon 9 用 800 mg／天。</b>');
    L.push(H('什麼時候開刀', 'ESMO 2022 neoadjuvant 段'));
    L.push('<b>一般在治療 6–12 個月時手術</b> —— 因為<b>過了 12 個月很少再繼續縮小，' +
      '而繼發性抗藥可能開始出現。</b>');
    L.push('<b>要早期評估反應，免得對沒有反應的病人白白延誤手術。</b>' +
      '功能性影像（PET）幾週內就看得出來，<b>在還沒有突變報告的時候特別有用。</b>');
    L.push('<b>手術前 imatinib 可以安全地停幾天、甚至只停一天；病人恢復後盡快接回去吃。</b>');
    L.push(H('療程總長度：這一點最容易算錯', 'ESMO 2022 Figure 1 註 b'));
    L.push('<b>「36 months overall, considering adjuvant and neoadjuvant imatinib when preoperative ' +
      'imatinib is given.」 —— 術前吃的要算進去，總共 36 個月，不是開完刀再重新算 3 年。</b>');
    L.push(H('一個要先知道的缺點', 'ESMO 2022 neoadjuvant 段'));
    L.push(EV('<b>切片上的有絲分裂數不可靠</b>，所以先給藥的病人<b>術後的風險分級會變得難判斷</b> —— ' +
      'ESMO 自己承認「making decisions regarding post-operative therapy challenging」。'));
    L.push(H('台灣健保的缺口', '9.22'));
    L.push('<b>健保 9.22 第 3 項只有兩款：「無法手術切除或轉移」與「完全切除後之術後輔助治療」，' +
      '沒有術前治療這一款。</b>' +
      '為了保胃保肛而先給藥的情境，<b>只能套第（1）款的「無法手術切除」，條文沒有直接授權。</b>');
    L.push(H('下一步', ''));
    L.push('<b>下面的步驟 4 選重新評估的結果。</b>');

    fill('gi_r_resect', cls, title, L,
      'ESMO 2022 局部／區域疾病節 neoadjuvant 段 ［III, A］、Figure 1 註 b；健保 9.22（查詢日 2026-08-17）。',
      more(mutationReference(), responseReference(), surgeryReference(), nhiReference(), asianReference()));

    show('gi_n_nres', true);
    if (!S.nres) return;
    renderNres();
  }

  function renderNres() {
    var L = [], cls, title;

    if (S.nres === 'resect') {
      cls = 'rec-elective';
      title = '縮小到可以切除了<br>→ 開刀，術前吃的月數要算進 36 個月裡面';
      L.push(H('手術', 'ESMO 2022 ［III, A］'));
      L.push('<b>依原則做完整切除、目標 R0、不清臨床上陰性的淋巴結。</b>');
      L.push('<b>手術前 imatinib 停幾天甚至一天即可；術後恢復就盡快接回去吃。</b>');
      L.push(H('總療程怎麼算', 'ESMO 2022 Figure 1 註 b'));
      L.push('<b>術前 ＋ 術後合計 36 個月。</b>術前已經吃了 8 個月的話，術後再吃 28 個月。');
      L.push(H('術後的風險分級會不好判', 'ESMO 2022'));
      L.push(EV('<b>吃過藥的檢體，有絲分裂數已經被治療改變過</b>，' +
        'AFIP 那張表本來是給沒吃過藥的人用的。這種情況要靠多專科團隊判斷。'));
      L.push(H('下一步', ''));
      L.push('<b>切完之後可以回步驟 1 選第二項做風險分級</b> —— ' +
        '但要記得上面這一條：吃過術前藥的人，格子上的數字要打折扣看。');
      fill('gi_r_nres', cls, title, L,
        'ESMO 2022 neoadjuvant 段與 Figure 1 註 b。',
        more(surgeryReference(), riskToolsReference(), nhiReference()));
      fu('gi_f_dx', 'adjhigh');
      return;
    }

    if (S.nres === 'stable') {
      cls = 'rec-nonop';
      title = '有反應或穩定，但仍然切不下來<br>→ 當成局部晚期的長期藥物治療，不要停藥';
      L.push(H('處置', 'ESMO 2022 轉移／晚期節 ［I, A］'));
      L.push('<b>imatinib 是局部晚期、無法手術與轉移病人的標準治療，要一直吃下去</b>，' +
        '直到臨床上有意義的進展或無法耐受。');
      L.push('<b>不要因為「已經穩定了」就停藥 —— 中斷之後腫瘤通常很快就長回來。</b>');
      L.push('<b>持續由外科一起追蹤</b> —— 病灶有機會變成可切除時要抓得到。');
      L.push(H('健保', '9.22'));
      L.push('<b>這一格套 9.22 第 3 項第（1）款「無法手術切除或轉移」，條文沒有療程期限、' +
        '沒有寫要事前審查。</b>');
      L.push(H('下一步', ''));
      L.push('<b>之後進展的話，回步驟 1 選第四項。</b>');
      fill('gi_r_nres', cls, title, L,
        'ESMO 2022 轉移／晚期疾病節 ［I, A］；健保 9.22（查詢日 2026-08-17）。',
        more(responseReference(), nhiReference(), nhiOrderReference()));
      fu('gi_f_nres', 'meta');
      return;
    }

    cls = 'rec-urgent';
    title = '術前治療期間進展<br>→ 先確認是不是真的進展，再決定換不換藥';
    L.push(H('換藥之前一定要排除三件事', 'ESMO 2022 療效評估節'));
    L.push('<b>① 影像上的假性進展</b> —— GIST 可能<b>先變大、密度變低</b>才縮小，' +
      '「新病灶」也可能只是原本看不見的低密度病灶浮現。<b>早期進展要由有經驗的團隊確認。</b>');
    L.push('<b>② 病人有沒有按時吃藥。</b>');
    L.push('<b>③ 和併用藥物的交互作用。</b>');
    L.push(H('確定是真的進展的話', 'ESMO 2022 ［III, B］／［IV, C］'));
    L.push('<b>用 400 mg 的病人可以加量到 800 mg／天</b>［III, B］，' +
      '<b>KIT exon 9 突變者特別有用</b>（如果一開始沒選高劑量）。');
    L.push('<b>只有一兩處在長、其他都還在反應（focal progression）→ ' +
      '可以把那一兩處切掉或做局部治療，同時把 imatinib 維持原劑量繼續吃</b>［IV, C］。');
    L.push('<b>全面進展 → 走第二線 sunitinib。</b>');
    L.push(H('這一格最重要的一句話', 'ESMO 2022 neoadjuvant 段'));
    L.push('<b>術前治療期間進展，代表這個腫瘤對 imatinib 沒有反應 —— ' +
      '要重新檢查突變報告</b>：是不是 D842V、SDH 缺陷型或 NF1 相關？' +
      '<b>這三型對 imatinib 本來就不會有反應。</b>');
    L.push(H('健保', '9.31'));
    L.push('<b>要轉 sunitinib，健保要求「以 imatinib 治療期間出現疾病惡化」—— 這一格符合。</b>' +
      '需事前審查，送審要檢送病歷及對 imatinib 無效的證明。');
    L.push('❗<b>一旦轉去 sunitinib，健保就不再給付回頭用 imatinib</b>（9.31 第 1 項第 2 款明文）。');
    L.push(H('下一步', ''));
    L.push('<b>回步驟 1 選第三項或第四項，決定後線用藥。</b>');
    fill('gi_r_nres', cls, title, L,
      'ESMO 2022 療效評估節、轉移／晚期疾病節 ［III, B］／［IV, C］；健保 9.31（查詢日 2026-08-17）。',
      more(responseReference(), mutationReference(), nhiReference(), nhiOrderReference()));
    fu('gi_f_nres', 'meta');
  }

  /* ---------- B. 術後：風險分級與輔助治療 ---------- */
  var SIZE_WORD = { s2: '≤ 2 cm', s5: '&gt; 2–5 cm', s10: '&gt; 5–10 cm', s10p: '&gt; 10 cm' };
  var MIT_WORD = { mlow: '≤ 5／5 mm²', mhigh: '&gt; 5／5 mm²' };

  function renderPostop() {
    show('gi_b_postop', true);
    show('gi_n_psite', true);
    if (!S.psite) return;

    show('gi_n_risk', true);
    var hold = el('gi_risk_hold');
    if (hold) {
      hold.innerHTML = '<div class="tn-cap">原發部位：' + SITE_LABEL[S.psite] + '</div>' +
        riskGridHTML(S.psite);
      if (S.risk) {
        var b = el('gi_riskc_' + S.psite + '_' + S.risk);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.risk) return;

    var parts = S.risk.split('_');
    var sizeKey = parts[0], mitKey = parts[1];
    var v = riskOf(S.psite, S.risk);
    var isNa = v[1] === 'na';

    var L = [];
    L.push(H('這一格的 AFIP 數字', 'Miettinen & Lasota, Semin Diagn Pathol 2006（PMID 17193820）'));
    if (isNa) {
      L.push('<b>AFIP 原表在這一格的病例數不足，沒有給百分比。</b>');
      L.push('<b>本頁依 modified-NIH（Joensuu H. Hum Pathol 2008;39:1411-1419，PMID 18774375）判為高風險</b> —— ' +
        '該分級把「<b>非胃部位、5.1–10 cm 且 ≤ 5／50 HPF</b>」與「<b>非胃部位、2.1–5 cm 且 &gt; 5／50 HPF</b>」' +
        '都納入高風險。');
      L.push(EV('❗<b>ESMO 2022 全文沒有出現「NIH」或「modified NIH」</b> —— ' +
        '這一格的判定是本頁引用 Joensuu 原始文獻補上的，不是 ESMO 的建議。'));
    } else {
      L.push('<b>' + SITE_LABEL[S.psite] + '　·　' + SIZE_WORD[sizeKey] + '　·　' + MIT_WORD[mitKey] +
        '　→　' + RISK_WORD[v[0]] + '，疾病進展率 ' + v[1] + '</b>');
      L.push('<b>「疾病進展」指的是轉移或腫瘤相關死亡</b>，資料來自 imatinib 問世前的長期追蹤 —— ' +
        '<b>也就是不吃藥的自然病程。</b>');
    }
    if (S.psite === 'other') {
      L.push('❗<b>AFIP 原表沒有食道、大腸、腸繫膜與腹膜的資料</b>，' +
        '本頁依 CAP／AJCC 的做法<b>比照空腸迴腸</b>。');
    }
    L.push(H('看這張表要注意的三件事', 'ESMO 2022 分期與風險評估節'));
    L.push('<b>① 大小與有絲分裂數都是連續變數</b> —— ESMO 明講「thresholds need to be interpreted wisely」，' +
      '<b>4.9 cm 和 5.1 cm 的臨床意義沒有格線看起來那麼斷裂。</b>');
    L.push('<b>② 這些分級表基本上是為 KIT 突變的 GIST 建立的</b>（ESMO 原文：' +
      '「available risk classifications essentially refer to KIT-mutated GISTs」）—— ' +
      '<b>SDH 缺陷型、NF1 型、D842V 型套上去本來就不準。</b>');
    L.push('<b>③ 有絲分裂的分母要看清楚</b>：病理報告寫 /5 mm²，健保條文寫 /50 HPF，' +
      '<b>新式廣角物鏡下兩者不等值。</b>');
    L.push(H('下一步', ''));
    L.push('<b>下面的步驟 4 問腫瘤有沒有破裂 —— 破裂會直接把風險拉到最高，不看這張表。</b>');

    fill('gi_r_risk', 'rec-idle',
      SITE_LABEL[S.psite] + '　·　' + SIZE_WORD[sizeKey] + '　·　' + MIT_WORD[mitKey] +
      '<br>→ ' + (isNa ? 'AFIP 無資料，依 modified-NIH 判為高風險' : RISK_WORD[v[0]] + '（進展率 ' + v[1] + '）'),
      L, 'AFIP／Miettinen 分級（PMID 17193820，AJCC 第 8 版與 CAP protocol 收錄）；' +
      'modified-NIH（PMID 18774375）；ESMO 2022 風險評估節。',
      more(riskToolsReference(), mitosisReference(), asianReference()));

    show('gi_n_rupt', true);
    if (!S.rupt) return;
    show('gi_n_mut', true);
    if (!S.mut) return;
    renderAdj(sizeKey, mitKey, v, isNa);
  }

  /* 綜合風險：破裂一律高風險（modified-NIH） */
  function finalRisk(v, isNa) {
    if (S.rupt === 'yes') return 'high';
    if (isNa) return 'high';
    return v[0];
  }

  function renderAdj(sizeKey, mitKey, v, isNa) {
    var risk = finalRisk(v, isNa);
    var hits = nhiAdjHit(sizeKey, mitKey, S.rupt);
    var L = [], cls, title;

    /* ── 先處理「不論風險多高都不給藥」的基因型 ── */
    if (S.mut === 'd842v' || S.mut === 'sdh') {
      var who = S.mut === 'd842v' ? 'PDGFRA D842V' : 'SDH 缺陷型';
      cls = 'rec-nonop';
      title = who + '<br>→ <b>不給任何輔助治療</b>，不論風險分級是幾級';
      L.push(H('ESMO 的原文', 'ESMO 2022 輔助治療段 ［IV, D］'));
      L.push(EV('先把這個建議的強度講清楚：<b>［IV, D］的 IV 是「回溯性世代或病例對照研究」，' +
        'D 是「有中等程度的證據顯示無效或有害，一般不建議」</b> —— ' +
        '<b>不是 E（絕對不可用），也不是隨機試驗證實的。</b>' +
        '兩個含這一型病人的隨機輔助試驗都無法支持或推翻它：' +
        'ACOSOG Z9001 只有 27 位 PDGFRA D842V，作者自己寫「病例太少，無法判定此族群的效益」；' +
        'SSGXVIII 的 43 位 PDGFRA 突變則沒有把 D842V 單獨分析。' +
        '<b>不給的真正理由是「預期沒有標靶效益，而且沒有可替代的輔助藥」，' +
        '不是「已經被試驗證實無效或有害」。</b>'));
      if (S.mut === 'd842v') {
        L.push('<b>「There is a consensus that PDGFRA D842V-mutated GISTs should not be treated with ' +
          'any adjuvant therapy, given the lack of sensitivity to ' + NR('imatinib') + ' of this genotype both in vitro ' +
          'and in vivo」</b>');
        L.push('<b>而且目前對 PDGFRA 突變有效的藥，在輔助情境完全沒有療效證據。</b>');
        L.push('<b>D842V 的預後本身反而是好的</b>（ESMO：generally associated with a good prognosis）。');
        L.push(EV('PERSIST-5 那個試驗裡<b>唯一一位在治療期間就復發並死亡的病人，就是 PDGFRA D842V</b>' +
          '（Raut CP et al. JAMA Oncol 2018;4:e184060，PMID 30383140）—— 吃了藥也沒有用。'));
      } else {
        L.push('<b>「There is a consensus to avoid ' + NR('imatinib') + ' or any adjuvant treatment in NF1-related and ' +
          'SDH expression-negative GISTs」</b> —— 因為這些型在轉移期對 ' + NR('imatinib') + '、' +
          NR('sunitinib') + '、' + NR('regorafenib') + ' 都不敏感。');
        L.push('<b>SDH 缺陷型要想到症候群</b>：Carney triad（多發性胃 GIST ＋ 副神經節瘤 ＋ 肺軟骨瘤）與 ' +
          'Carney-Stratakis（胚系 SDH 次單元突變，胃 GIST ＋ 副神經節瘤）。' +
          '<b>後者是遺傳性的，家屬要一起看。</b>');
        L.push('❗<b>SDH 缺陷型與小兒型有淋巴結轉移的可能</b>，和一般 GIST 不一樣。' +
          '<b>ESMO 對這一型的淋巴結沒有另訂條文，但亞洲共識 2025 補上了：' +
          '「selective removal of clinically enlarged lymph nodes is considered sufficient」 —— ' +
          '只摘臨床上腫大的，不做系統性廓清。</b>');
      }
      L.push(H('那風險分級還有用嗎', ''));
      L.push('<b>有 —— 用來決定追蹤要追多密。</b>這一格算出來是「' + RISK_WORD[risk] + '」，' +
        '但<b>那張表是為 KIT 突變的 GIST 建立的，套在這一型上不準。</b>');
      L.push(H('健保', '9.22'));
      L.push('<b>健保 9.22 沒有寫「D842V 不得使用 ' + NR('imatinib') + '」—— 條文上沒有擋，' +
        '但藥理上無效。</b>不給不是因為健保，是因為沒有效。');
      L.push(H('下一步', ''));
      L.push('<b>復發時回步驟 1 選第四項</b> —— ' +
        (S.mut === 'd842v'
          ? '<b>D842V 轉移期用 avapritinib 300 mg／天，健保 9.97 有給付而且不必先用過 ' + NR('imatinib') + '。</b>'
          : '<b>SDH 缺陷型的轉移期 sunitinib 與 regorafenib 可能有部分活性</b>［III, B］。'));
      fill('gi_r_adj', cls, title, L,
        'ESMO 2022 輔助治療段 ［IV, D］、Recommendations 第 6／7 點；健保 9.22（查詢日 2026-08-17）。',
        more(mutationReference(), riskToolsReference(), nhiReference()));
      fu('gi_f_adj', risk === 'high' ? 'adjhigh' : 'adjlow');
      return;
    }

    if (S.mut === 'wt') {
      cls = 'rec-nonop';
      title = 'KIT 與 PDGFRA 都沒有突變<br>→ 先分清楚是哪一種 wild-type，多數不給輔助治療';
      L.push(H('先把型別確定下來', 'ESMO 2022 診斷節 ［II, A］'));
      L.push('<b>KIT／PDGFRA 都沒有突變時，下一步做 SDHB 免疫組織化學</b>找 SDH 缺陷型。');
      L.push('<b>四陰性（KIT／PDGFRA／BRAF／SDH 都陰）時，要排除沒被認出來的 NF1。</b>');
      L.push('<b>也要驗 BRAF 與 NTRK</b> —— 這兩者在轉移期有各自的藥。');
      L.push(H('這些型別的輔助治療立場', 'ESMO 2022 輔助治療段 ［IV, D］'));
      L.push('<b>SDH 缺陷型、NF1 相關 → 不給任何輔助治療。</b>');
      L.push('<b>BRAF 突變、NTRK 重排 → 同樣不給輔助治療</b>（ESMO：「as well as in BRAF-mutated or ' +
        'NTRK-rearranged cases」）。');
      L.push(EV('理由都一樣 —— <b>這些型在轉移期對 ' + NR('imatinib') + '、' + NR('sunitinib') + '、' +
        NR('regorafenib') + ' 都不敏感</b>，輔助情境自然沒有理由給。'));
      L.push(H('風險分級怎麼看', 'ESMO 2022 風險評估節'));
      L.push('這一格算出來是「' + RISK_WORD[risk] + '」，' +
        '<b>但 ESMO 明講風險分級表基本上是為 KIT 突變的 GIST 建立的</b> —— ' +
        '<b>wild-type 套上去不準，主要拿來決定追蹤密度。</b>');
      L.push(H('下一步', ''));
      L.push('<b>把型別驗清楚之後，如果最後確認是 SDH 缺陷型，回步驟 5 改選該項。</b>');
      fill('gi_r_adj', cls, title, L,
        'ESMO 2022 診斷節 ［II, A］、輔助治療段 ［IV, D］、風險評估節。',
        more(mutationReference(), riskToolsReference(), nhiReference()));
      fu('gi_f_adj', risk === 'high' ? 'adjhigh' : 'adjlow');
      return;
    }

    if (S.mut === 'unk') {
      cls = 'rec-idle';
      title = '突變還沒驗<br>→ 先把突變驗出來，這一步會改變要不要給藥';
      L.push(H('為什麼一定要先驗', 'ESMO 2022 ［II, A］'));
      L.push('<b>突變檢測應列為所有 GIST 診斷工作的標準做法</b>（唯一例外是 &lt; 2 cm 的非直腸 GIST）。');
      L.push('<b>它決定三件事：要不要給輔助治療、給多少劑量、以及復發時第一線用什麼。</b>');
      L.push('<b>PDGFRA D842V、SDH 缺陷型、NF1 相關這三型完全不給輔助治療</b> —— ' +
        '沒有驗就給，等於白吃三年的藥和三年的副作用。');
      L.push(H('這一格目前的風險分級', ''));
      L.push('<b>' + RISK_WORD[risk] + '</b>' + (S.rupt === 'yes' ? '（因為腫瘤破裂）' : '') + '。' +
        (risk === 'high' ? '<b>風險確實高，但仍然要先確認基因型才知道給不給得下去。</b>'
          : '<b>風險不高，輔助治療本來就不一定要給。</b>'));
      L.push(H('要驗哪些', 'ESMO 2022 Table 1'));
      L.push('<b>KIT 與 PDGFRA 用 Sanger 定序或 NGS；SDH 用免疫組織化學；BRAF 與 NTRK 一併納入。</b>');
      L.push('<b>台灣端：健保通則十二對報告出自哪一種實驗室有硬性規定</b> —— ' +
        '不符資格的報告會讓後續申請被退件。');
      L.push(H('下一步', ''));
      L.push('<b>拿到報告後回步驟 5 重選。</b>');
      fill('gi_r_adj', cls, title, L,
        'ESMO 2022 診斷節 ［II, A］與 Table 1；健保通則十二。',
        more(mutationReference(), nhiReference()));
      return;
    }

    /* ── 對 imatinib 敏感的基因型：ex11 / ex9 / pdgfra 非 D842V ── */
    var give = (risk === 'high');
    var shared = (risk === 'low');
    var ex9 = (S.mut === 'ex9');

    if (S.rupt === 'yes') {
      cls = 'rec-urgent';
      title = '腫瘤破裂<br>→ 單獨即為極高復發風險，應考慮輔助 imatinib';
      L.push(H('ESMO 的原文', 'ESMO 2022 ［IV, A］'));
      L.push('<b>「In case of tumour rupture, micrometastatic disease can be assumed to exist. ' +
        'This puts the patient at a very high risk of relapse. Therefore these patients should be ' +
        'considered for imatinib therapy [IV, A]」</b>');
      L.push('<b>破裂等於假設腹腔內已經有微轉移</b> —— 所以不看大小也不看有絲分裂數。' +
        '這一格 AFIP 的分級（' + (isNa ? '無資料' : RISK_WORD[v[0]]) + '）已經不是決定因素。');
      L.push(H('療程要吃多久？指引沒有定', 'ESMO 2022 ［IV, A］'));
      L.push('<b>「the optimal duration of post-operative imatinib in this patient population is not ' +
        'defined given the uncertainty around whether these cases should be considered as already ' +
        'metastatic」</b>');
      L.push(EV('也就是說 —— <b>破裂的病人到底該當「術後輔助 3 年」還是「已經是轉移性、要一直吃」，' +
        'ESMO 自己沒有答案。</b>'));
      L.push(H('亞洲共識在這一格講得比較死', '亞洲共識 2025 statement 4-1-3（共識 88.9%）'));
      L.push('<b>「Extended or lifelong adjuvant imatinib therapy is recommended for ruptured GIST」 —— ' +
        '破裂者建議延長或終生服用。</b>');
      L.push('<b>依據之一是韓國的研究：破裂即使做滿 3 年輔助治療，仍然是有意義的不良預後因子</b>' +
        '（PMID 35678337）。');
      L.push('<b>台灣健保這一格明確：條件 D「腫瘤破裂」符合，給付 3 年 —— 第 4 年開始要自費。</b>');
      L.push(H('先確認這真的算破裂', 'ESMO 2022 破裂定義'));
      L.push('<b>粗針切片造成的微小缺損、腫瘤穿透腹膜、醫源性的表淺包膜撕裂、顯微鏡下切緣陽性（R1），' +
        '這四種都<u>不算</u>破裂。</b>詳細清單見下方收合。');
    } else if (give) {
      cls = 'rec-elective';
      title = RISK_WORD[risk] + '<br>→ 輔助 imatinib ' + (ex9 ? '（exon 9 的劑量要另外決定）' : '400 mg／天') + '，共 3 年';
      L.push(H('ESMO 的原文', 'ESMO 2022 ［I, A；ESMO-MCBS v1.1 score: A］'));
      L.push('<b>「Adjuvant therapy with imatinib 400 mg/day for 3 years is the standard treatment ' +
        'for patients with a significant risk of relapse」</b>');
      L.push('<b>這一格' + (isNa ? '依 modified-NIH 判為高風險' : ('的 AFIP 進展率是 ' + v[1])) +
        '，屬於「significant risk of relapse」。</b>');
      L.push(H('三年這個數字是怎麼來的', 'SSGXVIII/AIO'));
      L.push('<b>SSGXVIII/AIO 隨機比較 3 年與 1 年</b>（Joensuu H et al. JAMA 2012;307:1265-1272，' +
        'PMID 22453568）：<b>5 年無復發存活 65.6% vs 47.9%（HR 0.46）、5 年存活 92.0% vs 81.7%（HR 0.45）。</b>');
      L.push(EV('十年追蹤更新（Joensuu H et al. JAMA Oncol 2020;6:1241-1246，PMID 32469385）：' +
        '<b>10 年無復發存活 52.5% vs 41.8%、10 年存活 79.0% vs 65.3%</b> —— 差距一直維持著。'));
      L.push(H('什麼時候開始吃？', '亞洲共識 2025（台大有作者列名）'));
      L.push('<b>術後約 12 週內開始</b> —— 亞洲共識明寫這個時限，依據是<b>延遲超過 4 個月可能損害存活</b>。' +
        '<b>ESMO 完全沒有提這件事。</b>');
      L.push(H('那 3 年之後呢？現在有新的選項了', '亞洲共識 2025 statement 4-1-2'));
      L.push('<b>亞洲共識新增「輔助 imatinib 可以吃到 6 年」</b>，依據是 <b>IMADGIST</b>' +
        '（Blay JY et al. Ann Oncol 2024;35:1157-1168，PMID 39241959）：' +
        '<b>高風險病人做滿 3 年後再延 3 年，無病存活顯著改善</b>（整體存活資料未成熟）。' +
        '<b>這份試驗在 ESMO 2022 成文之後才發表。</b>');
      L.push('❗<b>但這一條的共識率只有 66.7%（12/18），19 位委員裡有 5 位明確反對</b> —— ' +
        '<b>強度和「3 年」那一條差很多，不要當成同一級的建議。</b>');
      L.push('❗<b>台灣健保 9.22 明文 3 年、沒有延長條款。第 4 年開始要自費。</b>');
      L.push(EV('<b>PERSIST-5 不是支持更長療程的證據</b> —— 它是<b>單臂</b>第 2 期的五年療程' +
        '（Raut CP et al. JAMA Oncol 2018;4:e184060，PMID 30383140），' +
        '91 人中只有 51% 撐完五年、49% 提早停藥；<b>7 位復發者有 6 位是停藥之後才復發</b>。' +
        '真正的隨機證據是 IMADGIST。'));
    } else if (shared) {
      cls = 'rec-idle';
      title = '中風險（進展率 ' + v[1] + '）<br>→ 沒有標準答案，要和病人一起決定';
      L.push(H('ESMO 的原文', 'ESMO 2022 輔助治療段'));
      L.push('<b>「An individualised shared decision-making process is needed when the risk is ' +
        'intermediate (i.e. in the 30%-50% range) and the risk assessment might be refined also through ' +
        'genotyping the specific KIT mutation. One should note that available efficacy data refer to ' +
        'high-risk patients.」</b>');
      L.push('<b>關鍵是最後那一句 —— 現有的療效資料是從高風險病人來的。</b>');
      L.push('<b>這一格 AFIP 的進展率是 ' + v[1] + '，落在 ESMO 那個 30–50% 區間<u>之下</u>。</b>');
      L.push(EV('❗ESMO 沒有說那個「30–50%」是<b>幾年</b>的復發風險，也沒有說是用<b>哪一套工具</b>算的。' +
        '本頁把 AFIP 的進展率拿來對照，是為了給一個可操作的參考點，' +
        '<b>不是指引本身的對應規則</b>。落在門檻邊緣的病人，可以改用把大小與分裂數當連續變數的 ' +
        'nomogram 或 prognostic contour maps。'));
      L.push(H('基因型可以幫忙細分', 'ESMO 2022 輔助治療段'));
      L.push('<b>「The benefit associated with adjuvant imatinib may vary according to the type of ' +
        'KIT/PDGFRA mutation, being greater in patients with KIT exon 11 deletion mutations.」</b>');
      L.push('<b>KIT exon 11 的缺失型獲益最大</b>；其中<b>牽涉 codon 557-558 的缺失復發風險特別高</b>，' +
        '是往「給」那一邊偏的理由。');
      L.push(H('要和病人講什麼', ''));
      L.push('<b>吃三年的藥有實際負擔</b> —— SSGXVIII 的 3 年組有 <b>25.8% 因為非復發的理由停藥</b>' +
        '（1 年組是 12.6%）。<b>這個數字要講給病人聽。</b>');
    } else {
      cls = 'rec-nonop';
      title = RISK_WORD[risk] + (isNa ? '' : '（進展率 ' + v[1] + '）') + '<br>→ 不需要輔助治療，定期追蹤就好';
      L.push(H('為什麼不給', 'ESMO 2022 輔助治療段'));
      L.push('<b>輔助 ' + NR('imatinib') + ' 的標準適應症是「significant risk of relapse」，這一格不符合。</b>');
      L.push('<b>AFIP 在這一格的進展率是 ' + v[1] + '</b>' +
        (v[1] === '0%' ? '（追蹤期間沒有進展的病例）' : '') + '。');
      L.push(EV('<b>ESMO 現有的療效資料全部來自高風險病人</b>，低風險族群沒有證據支持給藥，' +
        '而三年的藥有實際的副作用與停藥率。'));
      L.push(H('切緣是 R1 的話呢', 'ESMO 2022 ［IV, B］'));
      L.push('<b>切緣狀態不應該拿來決定要不要給輔助治療</b>（「the microscopic margin status should ' +
        'not be used to dictate adjuvant medical therapy decisions」），<b>而且不建議常規再切一次。</b>');
    }

    /* 共同的劑量與健保段落（只在真的可能給藥的情境列出） */
    if (S.rupt === 'yes' || give || shared) {
      L.push(H('劑量', 'ESMO 2022'));
      if (ex9) {
        L.push('<b>標準是 imatinib 400 mg／天。</b>');
        L.push('<b>KIT exon 9 有些專家在輔助情境也用 800 mg／天</b>［II, B；ESCAT I-A］，' +
          '理由是轉移期高劑量對這個基因型有效。');
        L.push('❗<b>但 ESMO 自己註明「currently not supported by any prospective evidence」' +
          '而且「regulatory constraints may limit this practice」。</b>');
        L.push('❗<b>亞洲共識 2025 在這一格引的是反證</b>：一篇回溯研究顯示 KIT exon 9 ' +
          '<b>在輔助情境用 800 mg 相對於 400 mg 沒有存活效益</b>' +
          '（Vincenzi B et al. Clin Cancer Res 2022，PMID 34615721），' +
          '而且提醒<b>加量在亞洲病人身上要格外謹慎</b>。');
        L.push('❗<b>台灣健保 9.22 全文沒有任何劑量條文</b> —— 沒有 400 mg、沒有 800 mg、' +
          '沒有粒數上限，也沒有 exon 9 可以增量的授權。<b>增量屬條文空白，' +
          '不是明文許可也不是明文禁止，會不會被核刪只能看審查。</b>');
        L.push('<b>兩份權威指引在這一格意見相左、健保又沒有依據 —— 請提多專科團隊討論，本頁不代為決定。</b>');
      } else {
        L.push('<b>imatinib 400 mg／天，共 3 年。</b>' +
          '台大的品項是 Glivec 基利克膜衣錠 <b>100 mg</b>，所以 400 mg／天 ＝ <b>4 顆</b>。');
      }
      L.push(H('台灣健保給不給？', '9.22 第 3 項第 2 款'));
      if (hits.length) {
        L.push('<b>✔ 這一格符合健保條件 ' + hits.join('、') + '</b> —— 事前審查核准後<b>給付 3 年</b>。');
      } else {
        L.push('<b>✘ 這一格<u>不符合</u>健保的四個條件</b>（&gt; 10 cm／有絲分裂 &gt; 10 per 50 HPF／' +
          '&gt; 5 cm 且有絲分裂 &gt; 5 per 50 HPF／腫瘤破裂）。');
      }
      L.push('❗<b>條件 B「有絲分裂指數 &gt; 10／50 HPF」本頁的格子判不出來</b> —— ' +
        '格子只分「≤ 5」與「&gt; 5」，<b>要回去看病理報告上的實際數字。</b>' +
        '報告若寫 /5 mm²，送審前要確認換算。');
      if (!hits.length) {
        L.push(EV('這就是<b>指引與健保最常打架的地方</b>。典型的例子是<b>小腸 GIST 3 cm、' +
          '有絲分裂 8／50 HPF</b> —— modified-NIH 判高風險、指引建議吃 3 年，' +
          '但健保四個條件一條都不符合。<b>要吃就得自費。</b>'));
      }
      L.push('<b>健保療程明文 3 年，沒有延長條款</b>，也沒有規範中斷後可否重啟或補足。');
    }

    L.push(H('下一步', ''));
    L.push('<b>復發時回步驟 1 選第四項「治療中進展、不耐受，或停藥後復發」。</b>');

    fill('gi_r_adj', cls, title, L,
      'ESMO 2022 局部／區域疾病節輔助治療段（3 年 ［I, A］；exon 9 800 mg ［II, B］；破裂 ［IV, A］）；' +
      'SSGXVIII PMID 22453568／32469385；PERSIST-5 PMID 30383140；健保 9.22（查詢日 2026-08-17）。',
      more(nhiAdjReference(), riskToolsReference(), mitosisReference(), ruptureReference(),
        mutationReference(), nhiReference(), asianReference()));
    fu('gi_f_adj', risk === 'high' ? 'adjhigh' : 'adjlow');
  }

  /* ---------- C. 轉移性／局部晚期不可切除 ---------- */
  var MUT_WORD = {
    ex11: 'KIT exon 11', ex9: 'KIT exon 9', pdgfra: 'PDGFRA（非 D842V）',
    d842v: 'PDGFRA D842V', sdh: 'SDH 缺陷型', wt: 'wild-type', unk: '突變未知'
  };
  var LINE_WORD = { l1: '第一線', l2: '第二線', l3: '第三線', l4: '第四線以後' };

  function lineRxTable(mut) {
    var rows = '';
    var imaDose = (mut === 'ex9') ? '800 mg／天（exon 9）' : '400 mg／天';
    if (mut === 'd842v') {
      rows += '<tr><td>第一線</td><td><b>avapritinib 300 mg／天</b>［III, A；MCBS 3；ESCAT I-B］。' +
        '反應率 &gt; 90%，一年反應持續率 &gt; 70%。<b>健保 9.97 給付，不必先用過 ' + NR('imatinib') + '。</b>' +
        '<br>❗<b>不良反應要盯：認知功能障礙、顱內出血、癲癇</b> —— 要早期辨認，否則治療會被迫中斷。</td></tr>' +
        '<tr><td>之後</td><td><b>ESMO 沒有替 D842V 列出後線的標準順序。</b>' +
        'VOYAGER（Kang YK et al. J Clin Oncol 2021;39:3128-3139，PMID 34343033）比較 avapritinib 與 ' +
        NR('regorafenib') + ' 用於三線以上的<b>一般</b> GIST，' +
        '<b>主要終點沒有達成</b>（中位 PFS 4.2 vs 5.6 個月，HR 1.25，P = .055）。' +
        '請提多專科團隊討論並考慮臨床試驗。</td></tr>';
    } else if (mut === 'sdh' || mut === 'wt') {
      rows += '<tr><td>立場</td><td><b>SDH 缺陷型與 NF1 相關的 GIST 對 ' + NR('imatinib') + ' 不敏感。</b>' +
        'ESMO：SDH 缺陷型<b>對 sunitinib 與 regorafenib 可能有部分活性</b>［III, B］。' +
        '<b>temozolomide 等藥物仍在研究中。</b></td></tr>' +
        '<tr><td>BRAF</td><td>可考慮 <b>BRAF 抑制劑（含 BRAF ＋ MEK 併用）</b>，' +
        'ESMO 標為<b>仿單外使用、以生物合理性為依據</b>［V, B；ESCAT III-A］。</td></tr>' +
        '<tr><td>NTRK</td><td><b>larotrectinib</b>［III, A］與 <b>' + NR('entrectinib') + '</b>［III, A］。' +
        '<b>台灣健保只有 larotrectinib（9.95 第 3 項第 9 款）寫進 GIST</b>；' +
        '需 NTRK 融合、至少一次全身治療失敗又惡化。</td></tr>' +
        '<tr><td>❗</td><td><b>臨床試驗在這一組特別要優先考慮。</b></td></tr>';
    } else {
      rows += '<tr><td>第一線</td><td><b>imatinib ' + imaDose + '</b>［I, A；ESCAT I-A］' +
        (mut === 'ex9' ? '（exon 9 的 800 mg 為［III, B］）' : '') + '。' +
        '<b>要一直吃下去</b>，直到臨床上有意義的進展或無法耐受［I, A］。<br>' +
        '<b>台大品項 Glivec 100 mg／顆</b> → 400 mg ＝ 4 顆、800 mg ＝ 8 顆。' +
        '<b>健保 9.22 有給付但全文沒有劑量條文。</b></td></tr>' +
        '<tr><td>第二線</td><td><b>sunitinib</b>［I, A；MCBS 3］。' +
        '<b>50 mg／天、用 4 週停 2 週</b>（試驗證實的用法）；' +
        '<b>37.5 mg／天連續給也是選項</b>［III, C］，但沒有做過正式的隨機比較。<br>' +
        '<b>健保 9.31 限 imatinib 治療期間惡化或不能忍受；需事前審查。</b></td></tr>' +
        '<tr><td>第三線</td><td><b>regorafenib 160 mg／天，每 4 週用前 3 週</b>［I, A；MCBS 3］。<br>' +
        'GRID（Demetri GD et al. Lancet 2013;381:295-302，PMID 23177515）：' +
        '中位 PFS <b>4.8 vs 0.9 個月</b>，HR 0.27。<br>' +
        '<b>健保 9.51 要求 imatinib「與」sunitinib 兩者都用過；每次療程 3 個月。</b></td></tr>' +
        '<tr><td>第四線</td><td><b>ripretinib 150 mg／天</b>［I, A；MCBS 3］。<br>' +
        'INVICTUS（Blay JY et al. Lancet Oncol 2020;21:923-934，PMID 32511981）：' +
        '中位 PFS <b>6.3 vs 1.0 個月</b>，HR 0.15。<br>' +
        '<b>健保 9.123（114/9/1 起）限已接受 3 種以上激酶抑制劑（含 imatinib）；' +
        '不得合併其他藥品，每日至多 3 粒；惡化即不可續用。</b></td></tr>' +
        '<tr><td>四線之後</td><td><b>重新挑戰用過的 imatinib，或在進展後繼續用原本的 TKI</b>，' +
        '都是 ESMO 列出的選項［II, B］。<br>' +
        '❗<b>但台灣健保 9.31 明文禁止在 sunitinib 之後回頭申請 imatinib</b> —— 這條路在台灣被封死。<br>' +
        '<b>不要在臨床試驗以外把多個 TKI 合併使用</b>（ESMO：毒性可能相當可觀）。<br>' +
        '<b>放射治療可作為選定病人的緩和手段</b>［V, B］。<b>鼓勵參加臨床試驗。</b></td></tr>' +
        '<tr><td>❗ 二線的<br>一個常見誤解</td><td>INTRIGUE（Bauer S et al. J Clin Oncol 2022;40:3918-3928，' +
        'PMID 35947817）拿 ripretinib 和 sunitinib 比二線，<b>沒有勝出</b>' +
        '（KIT exon 11 族群中位 PFS 8.3 vs 7.0 個月，HR 0.88，P = .36）。' +
        '<b>所以二線仍然是 sunitinib，ripretinib 留在四線。</b></td></tr>';
    }
    return foldRx('<b>各線別的處方、劑量與健保條件</b>（依目前選到的基因型）', '<table>' + rows + '</table>');
  }

  function renderAdv() {
    show('gi_b_adv', true);
    show('gi_n_mut2', true);
    if (!S.mut) return;

    if (S.mut === 'unk') {
      fill('gi_r_adv', 'rec-idle', '突變還沒驗<br>→ 先驗，這一步直接決定第一線要用哪一個藥', [
        H('為什麼不能先開藥再說', 'ESMO 2022 ［II, A］'),
        '<b>PDGFRA D842V 對 imatinib 是原發性抗藥</b>（客觀反應率 0%、中位無惡化存活約 2.8 個月）—— ' +
          '開下去大約就是三個月的空轉。',
        '<b>KIT exon 9 的標準第一線是 800 mg，不是 400 mg</b>［III, B］。',
        '<b>SDH 缺陷型與 NF1 相關對 imatinib 不敏感。</b>',
        H('要驗哪些、怎麼驗', 'ESMO 2022 Table 1'),
        '<b>KIT 與 PDGFRA 用 Sanger 定序或 NGS；都陰性再做 SDHB 免疫組織化學；' +
          '四陰性要排除 NF1；BRAF 與 NTRK 一併納入。</b>',
        H('台灣端的實際卡點', '健保通則十二'),
        '<b>D842V 要申請 avapritinib（9.97）一定要附突變報告；NTRK 要申請 larotrectinib（9.95）' +
          '一定要附融合報告 —— 而且報告必須出自符合通則十二的實驗室。</b>',
        '<b>沒有合格報告，藥就卡住。</b>',
        H('等報告的時候', ''),
        '<b>健保 9.22 第 3 項第（1）款只要求「無法手術切除或轉移」，沒有要求突變報告</b> —— ' +
          '所以臨床上常見的做法是先起 imatinib 400 mg，報告出來再調整。' +
          '<b>但 D842V 的病人這樣做等於白吃。</b>'
      ], 'ESMO 2022 診斷節 ［II, A］與 Table 1；健保 9.22／9.97／9.95、通則十二（查詢日 2026-08-17）。',
        more(mutationReference(), nhiReference()));
      return;
    }

    show('gi_n_line', true);
    if (!S.line) return;

    var L = [], cls = 'rec-nonop', title;
    var m = S.mut, ln = S.line;

    /* 特殊基因型：線別的意義不同 */
    if (m === 'd842v') {
      cls = 'rec-elective';
      title = 'PDGFRA D842V　·　' + LINE_WORD[ln] + '<br>→ avapritinib 300 mg／天，第一線就用它';
      L.push(H('第一線就是 avapritinib', 'ESMO 2022 ［III, A；MCBS 3；ESCAT I-B］'));
      L.push('<b>「Patients with a PDGFRA exon 18 D842V mutation are generally insensitive to ' + NR('imatinib') + '. ' +
        'They have now shown sensitivity to avapritinib」</b> —— <b>反應率超過 90%，' +
        '一年反應持續率超過 70%。</b>');
      L.push('<b>標準劑量 300 mg／天。</b>');
      L.push(EV('NAVIGATOR（Heinrich MC et al. Lancet Oncol 2020;21:935-946，PMID 32615108）是' +
        '<b>第 1 期</b>劑量爬升／擴充試驗（不是第 3 期）：D842V 族群 56 人，' +
        '<b>客觀反應率 88%</b>（完全反應 9%、部分反應 79%）；最大耐受劑量 400 mg，建議劑量 300 mg。'));
      L.push(H('要盯的不良反應', 'ESMO 2022'));
      L.push('<b>認知功能障礙、顱內出血、癲癇</b> —— ESMO 特別點名，' +
        '<b>要早期辨認，否則會被迫中斷治療。</b>');
      L.push(H('健保', '9.97'));
      L.push('<b>這是唯一沒有要求「先用過 ' + NR('imatinib') + '」的 GIST 標靶條文</b> —— D842V 可以直接申請。');
      L.push('<b>初次申請一定要檢附 PDGFRA D842V 檢測報告，而且要符合通則十二。</b>' +
        '每次療程 6 個月（比其他 GIST 標靶的 3 個月長），續用要用影像證實沒有惡化。');
      L.push('<b>每日至多處方 100 mg 2 粒或 300 mg 1 粒。</b>');
      L.push('<b>台大處方集有 Ayvakit 泰時維膜衣錠（100 mg／300 mg），另有專案品項 BLU-285。</b>');
      L.push(EV('台灣端的兩個細節：<b>①食藥署藥證有 100／200／300 mg 三張，但健保只收載 100 mg 與 300 mg —— ' +
        '200 mg 那一張是「有藥證、健保沒收」。</b>' +
        '<b>②台灣仿單的適應症比美國窄，寫的是「具 PDGFRA D842V 突變」，' +
        '不是美國的「PDGFRA exon 18 mutation, including D842V」</b>；' +
        '全身性肥大細胞增生症在台灣也沒有藥證。'));
      if (ln !== 'l1') {
        L.push(H('avapritinib 之後呢', 'ESMO 2022'));
        L.push('<b>ESMO 沒有替 D842V 列出後線的標準順序。</b>');
        L.push(EV('VOYAGER 拿 avapritinib 和 regorafenib 比三線以上的<b>一般</b> GIST，' +
          '<b>主要終點沒有達成</b>（中位 PFS 4.2 vs 5.6 個月，HR 1.25，P = .055）—— ' +
          '所以不能反過來推論「regorafenib 對 D842V 有效」。<b>請提多專科團隊討論並考慮臨床試驗。</b>'));
      }
    } else if (m === 'sdh' || m === 'wt') {
      title = MUT_WORD[m] + '　·　' + LINE_WORD[ln] +
        '<br>→ 標準的第一線路線不適用，先確認型別再選藥';
      L.push(H('為什麼不走標準路線', 'ESMO 2022 ［IV, D］／［III, B］'));
      L.push('<b>SDH 缺陷型與 NF1 相關的 GIST，對 ' + NR('imatinib') + ' 不敏感。</b>');
      L.push('<b>SDH 缺陷型對 sunitinib 與 regorafenib 可能有部分活性</b>［III, B］；' +
        '<b>temozolomide 等藥物仍在研究中，初步結果被 ESMO 形容為 interesting。</b>');
      if (m === 'wt') {
        L.push('<b>先把型別分清楚</b>：SDHB 免疫組織化學 → 四陰性時排除 NF1 → 驗 BRAF 與 NTRK。');
        L.push('<b>BRAF V600E 突變</b>：<b>dabrafenib ＋ trametinib</b>。' +
          '<b>ESMO 標為仿單外使用、以生物合理性為依據</b>［V, B；ESCAT III-A］，' +
          '<b>但亞洲共識 2025 已經把它列為正式建議（共識 100%）</b> —— ' +
          '差別在 ROAR 試驗最終報告（Subbiah V et al. Nat Med 2023;29:1103-1112，PMID 37059834）' +
          '在 ESMO 成文之後才發表。');
        L.push('<b>NTRK 融合</b>：larotrectinib 或 ' + NR('entrectinib') + '［III, A］。');
      }
      L.push(H('台灣健保怎麼走', '9.22／9.31／9.51／9.95'));
      L.push('<b>健保條文沒有依基因型設限</b> —— 9.22 第 3 項第（1）款只要求「無法手術切除或轉移」，' +
        '所以 ' + NR('imatinib') + ' 條文上申請得到，<b>但藥理上這一型沒有效。</b>');
      L.push('<b>要走到 sunitinib（9.31），條文要求「以 ' + NR('imatinib') + ' 治療期間出現疾病惡化或不能忍受」</b> —— ' +
        'ESMO 說這一型本來就不敏感，臨床上會變成「先吃一輪無效的藥才拿得到下一個」。' +
        '<b>這是條文與生物學不合的一格，送審時要把病歷寫清楚。</b>');
      L.push('<b>NTRK 融合：健保只有 larotrectinib（9.95 第 3 項第 9 款）寫進 GIST</b>，' +
        '要求至少一次全身性治療失敗又有疾病惡化；' + NR('entrectinib') + '（9.93）只給付 ROS1 肺癌。');
      L.push(H('這一組最該做的事', 'ESMO 2022'));
      L.push('<b>提多專科團隊討論，並優先考慮臨床試驗。</b>');
      if (m === 'sdh') {
        L.push('<b>SDH 缺陷型要想到症候群</b>：Carney triad 與 Carney-Stratakis' +
          '（後者是胚系突變，<b>家屬要一起評估</b>）。');
      }
    } else {
      /* KIT ex11 / ex9 / PDGFRA 非 D842V */
      var ex9 = (m === 'ex9');
      if (ln === 'l1') {
        cls = 'rec-elective';
        title = MUT_WORD[m] + '　·　第一線<br>→ imatinib ' + (ex9 ? '800 mg／天' : '400 mg／天') + '，持續不停藥';
        L.push(H('標準治療', 'ESMO 2022 ［I, A；ESCAT I-A］'));
        L.push('<b>imatinib 是局部晚期、無法手術與轉移性 GIST 的標準治療</b>，' +
          '<b>包含先前用過輔助 imatinib 而在服藥期間沒有復發的病人。</b>');
        if (ex9) {
          L.push('<b>KIT exon 9 的標準第一線是 800 mg／天</b>［III, B；ESCAT I-A］ —— ' +
            '這個族群用高劑量的反應率與無惡化存活明顯較好。');
          L.push(EV('證據來自 MetaGIST 統合分析（J Clin Oncol 2010;28:1247-1253，PMID 20124181）：' +
            '合併 EORTC 62005 與 S0033 共 1,640 人，<b>突變狀態是唯一的預測因子 —— ' +
            '只有 KIT exon 9 突變者用高劑量可顯著延長無惡化存活並提高反應率。</b>' +
            '整體而言高劑量的無惡化存活優勢很小，整體存活兩組相同。'));
          L.push('<b>台大 Glivec 是 100 mg／顆 → 800 mg ＝ 8 顆／天。</b>');
        } else {
          L.push('<b>標準劑量 400 mg／天</b>［I, A；ESCAT I-A］。' +
            '<b>台大 Glivec 是 100 mg／顆 → 4 顆／天。</b>');
        }
        L.push(H('最重要的一句話：不要停藥', 'ESMO 2022 ［I, A］'));
        L.push('<b>「treatment with imatinib should be continued indefinitely, until clinically relevant ' +
          'disease progression or intolerance, because treatment interruption is generally followed by ' +
          'relatively rapid tumour progression, <u>even when lesions have been previously excised ' +
          'surgically</u>」</b>');
        L.push('<b>病灶已經開刀切掉了也一樣要繼續吃。</b>');
        L.push(H('要和病人交代的三件事', 'ESMO 2022'));
        L.push('<b>① 按時服藥的重要性 ② 和其他藥物與食物的交互作用 ③ 副作用怎麼處理。</b>');
        L.push(H('手術在這裡的角色', 'ESMO 2022 ［III, C］'));
        L.push('<b>手術不是轉移性 GIST 的第一線做法。</b>' +
          '對 imatinib 有反應的病人切除殘存病灶預後好，<b>但無法證明是手術的功勞還是病人選擇的結果</b> —— ' +
          '要個案化並與病人共同決定。<b>病灶全部切掉之後，imatinib 仍然要繼續吃。</b>');
        L.push(H('健保', '9.22'));
        L.push('<b>9.22 第 3 項第（1）款「治療成年人無法手術切除或轉移的惡性胃腸道基質瘤」 —— ' +
          '這一款沒有寫事前審查、沒有療程期限、沒有影像追蹤或再申請間隔。</b>');
        if (ex9) {
          L.push('❗<b>健保 9.22 全文沒有任何劑量條文，也沒有 exon 9 可以增量到 800 mg 的授權。</b>' +
            '這是<b>條文空白</b>，不是明文許可也不是明文禁止 —— 會不會被核刪只能看審查醫師。');
        }
      } else if (ln === 'l2') {
        title = MUT_WORD[m] + '　·　第二線<br>→ sunitinib';
        L.push(H('標準治療', 'ESMO 2022 ［I, A；MCBS 3］'));
        L.push('<b>imatinib 確認進展、或罕見的無法耐受時，標準第二線是 sunitinib。</b>');
        L.push('<b>50 mg／天、用 4 週停 2 週</b> —— 這是試驗證實有效的用法' +
          '（Demetri GD et al. Lancet 2006;368:1329-1338，PMID 17046465：' +
          '中位進展時間 <b>27.3 vs 6.4 週</b>，HR 0.33）。');
        L.push('<b>37.5 mg／天連續給也是選項</b>［III, C］ —— 有效且耐受良好，' +
          '<b>但從來沒有做過正式的隨機比較。</b>');
        L.push(H('換到第二線之前，先做兩件事', 'ESMO 2022'));
        L.push('<b>① 先試著處理副作用</b> —— 找有經驗的人會診、減量、必要時測血中濃度，' +
          '<b>ESMO 用「rare intolerance」形容真正需要因為不耐受而換藥的情況。</b>');
        L.push('<b>② 確認是真的進展</b> —— 排除影像上的假性進展、病人沒按時吃藥、藥物交互作用。');
        L.push(H('一個常見的誤解', 'INTRIGUE'));
        L.push(EV('INTRIGUE（Bauer S et al. J Clin Oncol 2022;40:3918-3928，PMID 35947817）' +
          '拿 ripretinib 和 sunitinib 比二線，<b>沒有勝出</b>' +
          '（KIT exon 11 族群中位 PFS 8.3 vs 7.0 個月，HR 0.88，P = .36；' +
          '全體 8.0 vs 8.3 個月）。<b>所以二線仍然是 sunitinib。</b>'));
        L.push(H('健保', '9.31'));
        L.push('<b>限「以 imatinib 治療期間出現疾病惡化」或「對 imatinib 不能忍受」。</b>' +
          '<b>沒用過 imatinib、或停藥之後才惡化，條文字面不符。</b>');
        L.push('<b>需事前審查，送審要檢送病歷及對 imatinib 耐受性不良或無效的證明。</b>');
        L.push('❗<b>9.31 第 1 項第（2）款明文：用了 sunitinib 之後惡化或無法忍受，' +
          '不得替換使用 imatinib 治療。</b>國際指引允許末線重新挑戰 imatinib，' +
          '<b>台灣健保把這條路封死了 —— 換線之前要知道這件事。</b>');
      } else if (ln === 'l3') {
        title = MUT_WORD[m] + '　·　第三線<br>→ regorafenib 160 mg／天，每 4 週用前 3 週';
        L.push(H('標準治療', 'ESMO 2022 ［I, A；MCBS 3］'));
        L.push('<b>sunitinib 確認進展之後，標準第三線是 regorafenib，' +
          '160 mg／天、每 4 週的前 3 週用藥。</b>');
        L.push('<b>GRID（Demetri GD et al. Lancet 2013;381:295-302，PMID 23177515）</b>：' +
          '199 人 2:1 隨機，<b>中位無惡化存活 4.8 vs 0.9 個月，HR 0.27</b>。');
        L.push(EV('要注意的毒性：<b>高血壓 23%、手足皮膚反應 20%</b>（≥ 第 3 級藥物相關事件）。'));
        L.push(H('健保', '9.51'));
        L.push('<b>條文寫「先前曾接受 imatinib <u>與</u> sunitinib 治療」 —— 是「與」不是「或」，' +
          '兩線都必須用過。</b>');
        L.push('❗<b>因為不耐受而跳過 sunitinib 直接申請 regorafenib，不符條文字面。</b>');
        L.push('<b>需事前審查，每次申請療程 3 個月，送審檢送影像，每 3 個月評估一次。</b>');
        L.push('<b>「每日至多處方 4 粒」是寫在肝細胞癌那一段，GIST 段沒有粒數上限</b>；' +
          '<b>但全藥品層級的「不得與 trifluridine／tipiracil 併用」對 GIST 同樣適用。</b>');
      } else {
        title = MUT_WORD[m] + '　·　第四線以後<br>→ ripretinib 150 mg／天；之後是重新挑戰與跨越進展續用';
        L.push(H('第四線', 'ESMO 2022 ［I, A；MCBS 3］'));
        L.push('<b>ripretinib 150 mg／天。</b>');
        L.push('<b>INVICTUS（Blay JY et al. Lancet Oncol 2020;21:923-934，PMID 32511981）</b>：' +
          '129 人 2:1 隨機，收的是對 imatinib、sunitinib、regorafenib 都惡化或不耐受的病人，' +
          '<b>中位無惡化存活 6.3 vs 1.0 個月，HR 0.15</b>。');
        L.push(H('健保', '9.123（114/9/1 起）'));
        L.push('<b>限「已接受 3 種或以上激酶抑制劑（包括 imatinib）」的晚期 GIST 成人。</b>');
        L.push('<b>不得合併其他藥品，每日至多處方 3 粒（＝ 150 mg／天）。</b>');
        L.push('<b>每次療程 3 個月，送審檢送影像，每 3 個月評估；治療期間出現疾病惡化就不可繼續使用。</b>');
        L.push('❗<b>惡化後加量到 150 mg 一天兩次的做法，健保不給付。</b>');
        L.push(H('四線之後還有什麼', 'ESMO 2022 ［II, B］／［V, B］'));
        L.push('<b>「a rechallenge with imatinib (to which the patient has already been exposed) and ' +
          'continuation of the ongoing therapy beyond progression are options [II, B]」</b>');
        L.push('❗<b>但台灣健保 9.31 明文禁止在 sunitinib 之後回頭申請 imatinib</b> —— ' +
          '<b>重新挑戰這條路在台灣走不通（除非自費）。</b>');
        L.push('<b>不要在臨床試驗以外把多個 TKI 合併使用</b> —— ESMO：毒性可能相當可觀。');
        L.push('<b>放射治療可作為選定病人的緩和手段</b>［V, B］。');
        L.push('<b>應該考慮讓病人參加新藥或新組合的臨床試驗。</b>');
      }
    }

    L.push(H('療效怎麼判讀', 'ESMO 2022 療效評估節'));
    L.push('<b>不能只看大小 —— 腫瘤變大但密度變低可能是有反應；' +
      '大小沒變而密度局部變高（nodule within the mass）可能是進展。</b>' +
      '<b>治療 6 個月沒有進展也算有反應。</b>');

    fill('gi_r_adv', cls, title, L,
      'ESMO 2022 轉移／晚期疾病節與 Recommendations；健保 9.22／9.31／9.51／9.123／9.97／9.95' +
      '（查詢日 2026-08-17）。',
      more(lineRxTable(m), responseReference(), mutationReference(), nhiOrderReference(), nhiReference(), asianReference()));
    fu('gi_f_adv', 'meta');
  }

  /* ---------- D. 進展／不耐受／停藥後復發 ---------- */
  function renderProg() {
    show('gi_b_prog', true);
    show('gi_n_pmode', true);
    if (!S.pmode) return;

    var L = [], cls, title;

    if (S.pmode === 'focal') {
      cls = 'rec-elective';
      title = '局部進展：大部分病灶還在反應，只有一兩處在長<br>→ 處理那一兩處，imatinib 維持原劑量繼續吃';
      L.push(H('ESMO 的原文', 'ESMO 2022 ［IV, C］'));
      L.push('<b>「surgery of focal progression, such as the \'nodule within a mass\', up to one or few ' +
        'nodules/masses when the rest of the disease is still responding, has been associated with a PFS ' +
        'in the same range as for any further-line treatment. Therefore this may be an option for the ' +
        'individual patient with limited progression, <u>while continuing imatinib at the same dose</u>」</b>');
      L.push('<b>重點是最後半句 —— 局部處理完，imatinib 用原劑量繼續吃，不換線也不加量。</b>');
      L.push('<b>不想開刀的話，非手術的局部治療也可以</b>（射頻燒灼、冷凍消融、放射治療）。');
      L.push(EV('要區分清楚：<b>「切正在進展的病灶」在文獻上沒有好處，' +
        '但「只有一兩處在長、其他都在反應」是不一樣的情境</b> —— ' +
        'ESMO 對後者的評價是「無惡化存活和換下一線差不多」。'));
      L.push(H('先確認是真的局部進展', 'ESMO 2022 療效評估節'));
      L.push('<b>典型的進展形態就是 nodule within the mass</b> —— ' +
        '一顆正在反應的病灶裡面冒出一塊高密度結節。<b>要排除影像上的假性進展。</b>');
      L.push(H('健保', '9.22'));
      L.push('<b>繼續用 imatinib 走 9.22 第 3 項第（1）款，沒有療程期限。</b>' +
        '<b>局部治療與手術本身不受這幾條藥品條文限制。</b>');
      L.push(H('❗ 這一格最重要的判斷', ''));
      L.push('<b>不要因為「有一處在長」就換到 ' + NR('sunitinib') + '</b> —— ' +
        '一旦換過去，<b>健保就不再給付回頭用 imatinib</b>（9.31 明文）。' +
        '<b>能靠局部治療撐住的，就把 imatinib 這一線留著。</b>');
      fill('gi_r_prog', cls, title, L,
        'ESMO 2022 轉移／晚期疾病節 ［IV, C］、Recommendations 第 6 點、療效評估節；' +
        '健保 9.22／9.31（查詢日 2026-08-17）。',
        more(responseReference(), nhiOrderReference(), nhiReference()));
      fu('gi_f_prog', 'meta');
      return;
    }

    if (S.pmode === 'general') {
      cls = 'rec-urgent';
      title = '多處同時進展<br>→ 先排除三件事，再決定加量還是換線';
      L.push(H('換藥之前一定要排除三件事', 'ESMO 2022 療效評估節'));
      L.push('<b>① 影像上的假性進展</b> —— GIST 可能先變大、密度變低才縮小；' +
        '<b>「新病灶」也可能只是原本看不見的低密度病灶浮現。</b>' +
        '<b>早期進展要由有經驗的團隊確認。</b>');
      L.push('<b>② 病人有沒有按時吃藥</b>（noncompliance）。');
      L.push('<b>③ 和併用藥物的交互作用。</b>');
      L.push(EV('ESMO 把這三件事寫成換線前的必要步驟。<b>血中濃度不是常規檢查</b>，' +
        '但在「敏感基因型卻反應不如預期」「做過腸道切除」「有重大交互作用風險」' +
        '這三種情形下有用。'));
      L.push(H('確認是真的進展之後', 'ESMO 2022 ［III, B］'));
      L.push('<b>用 400 mg 的病人，可以先加量到 800 mg／天</b>［III, B］ —— ' +
        '<b>KIT exon 9 突變者特別有用</b>（如果一開始沒有選高劑量），' +
        '藥物動力學隨時間波動的病人也可能受益。');
      L.push('<b>對藥物不敏感的基因型（D842V、SDH 缺陷型、NF1）不適用加量。</b>');
      L.push('<b>加量之後仍然進展 → 換第二線 sunitinib。</b>');
      L.push(H('健保的兩個卡點', '9.22／9.31'));
      L.push('❗<b>健保 9.22 全文沒有劑量條文，加量到 800 mg 沒有給付依據</b> —— 屬條文空白。');
      L.push('❗<b>轉 sunitinib 之後就不能再回頭用 imatinib</b>（9.31 第 1 項第 2 款明文）。' +
        '<b>換線是單向的，換之前要想清楚。</b>');
      L.push('<b>轉 sunitinib 要事前審查，送審要檢送病歷及對 imatinib 無效的證明。</b>');
      L.push(H('下一步', ''));
      L.push('<b>回步驟 1 選第三項「一開始就是轉移性，或局部切不下來」，' +
        '在那裡選基因型與線別，會列出完整的處方與健保條件。</b>');
      fill('gi_r_prog', cls, title, L,
        'ESMO 2022 療效評估節、轉移／晚期疾病節 ［III, B］、Recommendations 第 7 點；' +
        '健保 9.22／9.31（查詢日 2026-08-17）。',
        more(responseReference(), mutationReference(), nhiOrderReference(), nhiReference()));
      fu('gi_f_prog', 'meta');
      return;
    }

    if (S.pmode === 'intol') {
      cls = 'rec-nonop';
      title = '不是進展，是副作用受不了<br>→ 先想辦法留住這一線，真的不行才換';
      L.push(H('ESMO 的用字很重要', 'ESMO 2022 ［I, A］'));
      L.push('<b>「In the case of confirmed progression or <u>rare intolerance</u> on imatinib ' +
        '(after attempts to manage side-effects through expert advice, exploiting dose reductions and ' +
        'possibly plasma level assessment), standard second-line treatment is sunitinib」</b>');
      L.push('<b>「rare」這個字是關鍵 —— ESMO 認為真正必須因為不耐受而換藥的情況很少見。</b>');
      L.push(H('換藥之前要先試的三件事', 'ESMO 2022'));
      L.push('<b>① 找有經驗的人會診處理副作用。</b>');
      L.push('<b>② 減量。</b>');
      L.push('<b>③ 必要時測血中濃度</b> —— 「出現意料外的毒性」正是 ESMO 列出的三個測濃度時機之一。');
      L.push(H('為什麼要這麼努力留住 imatinib', '健保 9.31'));
      L.push('❗<b>健保 9.31 第 1 項第（2）款明文：用了 sunitinib 之後惡化或無法忍受，' +
        '不得替換使用 imatinib 治療。</b>');
      L.push('<b>換去 sunitinib 是單向的 —— 回不來。</b>' +
        '國際指引允許末線重新挑戰 imatinib，<b>台灣健保這條路是封死的。</b>');
      L.push(H('真的要換的話', 'ESMO 2022 ［I, A］／健保 9.31'));
      L.push('<b>第二線是 sunitinib，50 mg／天用 4 週停 2 週，或 37.5 mg／天連續給</b>［III, C］。');
      L.push('<b>健保條文接受「對 imatinib 出現不能忍受」這個理由</b>，' +
        '<b>但送審要檢送病歷及耐受性不良的證明</b> —— 減量與處理副作用的過程要寫進病歷。');
      L.push(H('❗ 一個順序陷阱', '健保 9.51'));
      L.push('<b>因為不耐受而「跳過」sunitinib 直接申請 ' + NR('regorafenib') + ' 是不行的</b> —— ' +
        '9.51 要求 imatinib「與」sunitinib 兩者都用過。');
      fill('gi_r_prog', cls, title, L,
        'ESMO 2022 轉移／晚期疾病節 ［I, A］／［III, C］；健保 9.31／9.51（查詢日 2026-08-17）。',
        more(nhiOrderReference(), responseReference(), nhiReference()));
      fu('gi_f_prog', 'meta');
      return;
    }

    cls = 'rec-elective';
    title = '輔助治療吃完停藥之後才復發<br>→ 可以重新用 imatinib，這一格不算 imatinib 失敗';
    L.push(H('ESMO 的原文', 'ESMO 2022 ［I, A］'));
    L.push('<b>「Imatinib is the standard treatment for locally advanced, inoperable and metastatic ' +
      'patients, <u>including patients previously treated with adjuvant imatinib who did not relapse ' +
      'while receiving it</u>」</b>');
    L.push('<b>關鍵是「服藥期間沒有復發」 —— 停藥之後才復發，代表腫瘤對 imatinib 並沒有抗藥，' +
      '只是藥停了。重新給就好。</b>');
    L.push(H('這件事本來就是預期中的', 'SSGXVIII／PERSIST-5／BFR14'));
    L.push('<b>SSGXVIII 十年追蹤</b>（Joensuu H et al. JAMA Oncol 2020;6:1241-1246，PMID 32469385）：' +
      '<b>3 年組 10 年無復發存活 52.5%</b> —— 也就是說一半的高風險病人終究會復發。');
    L.push(EV('PERSIST-5（Raut CP et al. JAMA Oncol 2018;4:e184060，PMID 30383140）的 7 位復發者中，' +
      '<b>6 位是停藥之後才復發的</b>。BFR14 隨機中斷試驗（Blay JY et al. J Clin Oncol 2007;25:1107-1113，' +
      'PMID 17369574）：中斷組 32 人有 26 人惡化，' +
      '<b>但這 26 人中有 24 人重新給藥後再度有反應</b>。'));
    L.push(H('處置', 'ESMO 2022 ［I, A］'));
    L.push('<b>重新開始 imatinib，劑量依基因型：一般 400 mg／天，KIT exon 9 用 800 mg／天。</b>');
    L.push('<b>這一次要一直吃下去</b>，直到臨床上有意義的進展或無法耐受 —— ' +
      '<b>不再有「吃三年就停」這回事。</b>');
    L.push('<b>先確認復發病灶的範圍</b>：三相顯影腹部與骨盆 CT；' +
      '<b>復發最常在肝臟與腹膜。</b>');
    L.push('<b>如果當初沒有驗過突變，現在一定要驗</b> —— 會決定劑量與後線。');
    L.push(H('健保', '9.22'));
    L.push('<b>復發後套 9.22 第 3 項第（1）款「無法手術切除或轉移」，沒有療程期限，' +
      '條文也沒有寫要事前審查。</b>');
    L.push(EV('❗<b>健保條文完全沒有規範「輔助治療 3 年吃完、停藥後復發，可不可以重新起算」</b> —— ' +
      '這是條文空白。實務上是改走第（1）款的轉移性適應症，不是續用輔助那一款。'));
    L.push(H('下一步', ''));
    L.push('<b>回步驟 1 選第三項，在那裡選基因型與線別，會列出完整的處方與健保條件。</b>');
    fill('gi_r_prog', cls, title, L,
      'ESMO 2022 轉移／晚期疾病節 ［I, A］；SSGXVIII PMID 32469385、PERSIST-5 PMID 30383140、' +
      'BFR14 PMID 17369574；健保 9.22（查詢日 2026-08-17）。',
      more(mutationReference(), responseReference(), nhiOrderReference(), nhiReference()));
    fu('gi_f_prog', 'meta');
  }

  /* ==========================================================
     6. 最下方：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('先分清楚兩件事', ''));
    L.push('<b>GIST 的「驗基因」有兩層，常常被混在一起：</b>');
    L.push(SUB([
      '<b>腫瘤的體細胞突變檢測</b>（KIT／PDGFRA／BRAF／NTRK、SDHB 免疫染色）—— ' +
        '<b>決定用什麼藥、給不給輔助治療</b>。這一層幾乎每個病人都要做。',
      '<b>胚系（遺傳性）檢測</b> —— <b>決定家屬要不要來看門診</b>。這一層只有少數人需要。'
    ]));

    L.push(H('第一層：腫瘤突變檢測', 'ESMO 2022 ［II, A］'));
    L.push('<b>「Its inclusion in the diagnostic work-up of all GISTs should be considered standard ' +
      'practice」 —— 所有 GIST 都應該驗。</b>');
    L.push('<b>唯一的明文例外是「&lt; 2 cm 的非直腸 GIST」</b>，因為幾乎不會走到藥物治療。');
    L.push('<b>順序：KIT 與 PDGFRA →（都陰性）SDHB 免疫組織化學 →（四陰性）排除 NF1</b>；' +
      'BRAF 與 NTRK 一併納入。');
    L.push('<b>ESMO 建議把檢測集中在參加外部品管計畫的實驗室</b>；' +
      '<b>沒有典型分子變異的 GIST，病理診斷更應該送中心覆核。</b>');
    L.push('<b>台灣端：健保通則十二規定報告要出自符合資格的實驗室</b>' +
      '（支付標準內的項目、衛福部許可的伴隨式診斷 IVD，或核定的 LDT 認證實驗室）—— ' +
      '<b>不符資格的報告會讓 avapritinib（9.97）與 larotrectinib（9.95）送審被退。</b>');
    L.push(EV('也建議<b>留新鮮冷凍檢體</b>供日後分子檢測，並事先取得保存的同意（ESMO 診斷節）。'));

    L.push(H('第二層：什麼時候要想到遺傳性？', '台大與 ESMO 均未列建議條文，屬院外實證'));
    L.push('<b>① SDH 缺陷型（SDHB 免疫染色陰性）</b> —— 這是最主要的線索。' +
      '其中 <b>Carney-Stratakis 是胚系 SDH 次單元（A／B／C／D）突變</b>，' +
      '表現為<b>多發性胃 GIST ＋ 副神經節瘤</b>，青少年後期到 30 多歲發病，' +
      '<b>沒有性別差異，而且有淋巴結轉移的可能</b>。');
    L.push('<b>② Carney triad</b>（SDHC 基因高度甲基化）—— <b>多發性胃 GIST ＋ 副神經節瘤 ＋ 肺軟骨瘤</b>，' +
      '<b>青少年發病、女性居多</b>。這一種是表觀遺傳的，不是典型的胚系突變。');
    L.push('<b>③ NF1</b> —— 常為<b>多發性、以小腸為主</b>的 GIST。' +
      '<b>四陰性（KIT／PDGFRA／BRAF／SDH 都陰）時要回頭排除沒被診斷出來的 NF1。</b>');
    L.push('<b>④ 小兒或年輕病人</b> —— 小兒型 GIST <b>女性居多、沒有 KIT／PDGFRA 突變、' +
      '多為 SDH 相關、多發性胃部病灶、可能有淋巴結轉移。</b>');
    L.push('<b>⑤ 多發性 GIST、或有家族史</b>（罕見的胚系 KIT 突變家族）。');
    L.push(EV('❗<b>ESMO 2022 是和 GENTURIS（遺傳性腫瘤網絡）共同掛名的指引，' +
      '但全文並沒有給胚系檢測或遺傳諮詢轉介的建議條文</b> —— ' +
      '這是指引本身的缺口，不是本頁沒找到。以上五點是依指引描述的疾病特徵整理出來的臨床提示。'));

    L.push(H('驗到了會改變什麼？', ''));
    L.push('<b>① 用藥直接改變</b>：SDH 缺陷型與 NF1 相關<b>不給輔助治療</b>［IV, D］，' +
      '轉移期對 ' + NR('imatinib') + ' 不敏感（SDH 缺陷型對 sunitinib 與 regorafenib 可能有部分活性［III, B］）。');
    L.push('<b>② 風險分級的解讀改變</b>：ESMO 明講風險分級表<b>基本上是為 KIT 突變的 GIST 建立的</b> —— ' +
      '這幾型套上去不準，主要拿來決定追蹤密度。');
    L.push('<b>③ 要找別的腫瘤</b>：Carney-Stratakis 與 Carney triad 都要<b>找副神經節瘤</b>' +
      '（含血壓與兒茶酚胺的評估），Carney triad 還要看肺部。');
    L.push('<b>④ 家屬要一起評估</b>：Carney-Stratakis 是胚系突變 —— <b>照會遺傳諮詢，安排家屬檢測。</b>');
    L.push('<b>⑤ 手術範圍要重想</b>：<b>SDH 缺陷型與小兒型有淋巴結轉移的可能</b>，' +
      '而 GIST 的標準手術是「不清臨床上陰性的淋巴結」。' +
      '<b>ESMO 對這兩型是否要清淋巴結沒有另訂條文</b> —— 這一點請提多專科團隊討論。');
    L.push(EV('把這一段放在流程最下方，是因為<b>它與病人走哪一條治療路線無關 —— 每一條都適用</b>。' +
      '但它會改變兩件很實際的事：<b>這個病人要不要吃三年的藥</b>，以及<b>家屬要不要來看門診</b>。'));

    return '<div class="bc-gene-h">要不要驗基因？兩層意思不一樣' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     7. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'gi-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('gi_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }

  function renderDrugCards() {
    var box = el('gi_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— '</b></td><td>' 這種標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到，那張藥卡會無聲消失。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('giPath');
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
    GI_DRUGS.forEach(function (d) {
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
    if (S.scope) {
      if (S.scope === 'dx') renderDx();
      else if (S.scope === 'postop') renderPostop();
      else if (S.scope === 'adv') renderAdv();
      else if (S.scope === 'prog') renderProg();
    }
    renderDrugCards();
  }

  /* ==========================================================
     9. 互動
     ========================================================== */
  var SEL_GROUPS = ['gi_n1', 'gi_n_site', 'gi_n_resect', 'gi_n_nres', 'gi_n_psite',
    'gi_n_risk', 'gi_n_rupt', 'gi_n_mut', 'gi_n_mut2', 'gi_n_line', 'gi_n_pmode'];

  var DOWNSTREAM = {
    scope: ['site', 'resect', 'nres', 'psite', 'risk', 'rupt', 'mut', 'line', 'pmode'],
    site: ['resect', 'nres'],
    resect: ['nres'],
    psite: ['risk', 'rupt', 'mut'],
    risk: ['rupt', 'mut'],
    rupt: ['mut'],
    mut: ['line'],
    line: []
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function gistPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      clearSelectionMarks();
    }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var sel = btn.classList.contains('tn-cell') ? '.tn-cell' : '.flow-opt';
      var g = btn.parentNode;
      if (g) g.querySelectorAll(sel).forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }

  function reapplyMarks() {
    var pairs = [
      ['gi_n1', 'scope'], ['gi_n_site', 'site'], ['gi_n_resect', 'resect'], ['gi_n_nres', 'nres'],
      ['gi_n_psite', 'psite'], ['gi_n_rupt', 'rupt'], ['gi_n_mut', 'mut'], ['gi_n_mut2', 'mut'],
      ['gi_n_line', 'line'], ['gi_n_pmode', 'pmode']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /gistPick\('([a-z]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
    if (S.psite && S.risk) {
      var c = el('gi_riskc_' + S.psite + '_' + S.risk);
      if (c) c.classList.add('selected');
    }
  }

  function gistReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    var hold = el('gi_risk_hold'); if (hold) hold.innerHTML = '';
    render();
  }

  function initGistPathway() { gistReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。 */
  global.gistPathwayHTML = gistPathwayHTML;
  global.initGistPathway = initGistPathway;
  global.gistPick = gistPick;
  global.gistReset = gistReset;
})(window);
