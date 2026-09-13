/* ============================================================
   子宮肉瘤治療互動決策流程 Uterine Sarcoma Treatment Pathway
   ------------------------------------------------------------
   2026-09-13 打掉重做（舊版 286 行，是全站最小的舊世代模組）。

   院內來源：台大婦癌診療指引 版次 10（2026/06/16 癌委會修訂通過）
     · 入口在 **UN-1（p19）**，不在 UTSARC 頁；UTSARC-1 ～ UTSARC-5 於 p37–41；
       分期表 ST-3（平滑肌肉瘤與子宮內膜間質肉瘤）與 ST-4（苗勒氏腺肉瘤）於 p44–45。
     · 九張流程圖已 render 成 220 dpi PNG 逐張看圖判讀。

   ❗❗ 這一份的文字層有兩個會讓人抄錯的坑（兩者都會反轉臨床語意）：
     ① **文字層完全沒有「±」這個字元**（用 rawdict 逐字檢查 p37，非 ASCII 只有中文與 bullet）。
        所以文字層讀到的是 `TH with en bloc resection  BSO`，
        **PNG 上實際是 `TH with en bloc resection ± BSO`**。
        「±」是「可做可不做」，掉了就變成「一定要做」。**逐字引用一律以 PNG 為準。**
        同樣消失的還有箭頭 `→`。
     ② **p38（UTSARC-2）留著未清乾淨的紅色修訂痕跡**：文字層讀到
        `Observe, if menopausal or prior BSO`，但 **PNG 上 menopausal 與 or 兩個字都有紅色刪除線**，
        定稿後的讀法是 **`Observe, if prior BSO`**。同頁另有整行紅色新增字 `± systemic endocrine therapy`。

   ❗ 結構性缺頁（與卵巢癌章節同樣的問題）：
     **UTSARC-A 整頁不存在**。UN-1、UTSARC-1、UTSARC-3 三處指向它，文件裡沒有這一頁。
     後果：**分子檢測原則與系統性治療處方整段消失** ——
     全 68 頁檢索 doxorubicin／gemcitabine／trabectedin／pazopanib／olaparib／lenvatinib／
     pembrolizumab **全部 0 次**；UTSARC 五頁裡藥物層級的字只有 `Systemic therapy`（9 次）與
     `systemic endocrine therapy`（1 次）。**沒有任何一頁列出處方或劑量。**

   ❗ 三個「查無」要標明，不可用記憶補：
     · **morcellation 警語：這份指引完全沒有。** 全 68 頁 `morcell` 只命中 p34 一次，
       而且是 ENDO-A 給**癌症（carcinoma）**用的病理報告欄位定義
       （`Specimen integrity (intact, opened, morcellated, other)`），肉瘤不在該段適用範圍。
       UTSARC 五頁一次都沒出現。指引把「腫瘤已被碎解」當成**事後補救的狀態**
       （fragmented → 考慮再探查／再切除），**不是事前的警告**。
       → 病安警語必須另引 **FDA 安全通告**，不可掛這份指引名下。
     · **淋巴結：UTSARC-1～5 全程未提。** p37–41 檢索 lymph／node **命中 0 次** ——
       **不是「不建議」，是「完全沒寫」。** → 須引 ESGO/EURACAN/GCIG 2024。
     · **保留卵巢的門檻：查無明文。** 全文 `ovarian preservation` 0 次；
       指引只用「±」表達可選，沒有年齡、分期、ER 狀態的門檻。

   院外來源：ESGO/EURACAN/GCIG 2024 子宮肉瘤指引、FDA power morcellator 安全通告（2014／2020）。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   ============================================================ */
(function (global) {
  'use strict';

  var S = {};
  var KEYS = ['entry', 'pres', 'resid', 'histo', 'stg2', 'stg3'];
  KEYS.forEach(function (k) { S[k] = null; });

  var US_DRUGS = [
    { key: 'letrozole', cards: [['17', 'FEM4CB22', 'Femara 復乳納膜衣錠 2.5 mg', 'letrozole']],
      flag: '❗指引只寫 systemic endocrine therapy，未指名任何藥' },
    { key: 'anastrozole', cards: [['17', 'ARI4CB22', 'Arimidex 安美達錠 1 mg', 'anastrozole']],
      flag: '❗同上，屬院外實證' },
    { key: 'megestrol', cards: [['17', 'MEE5LF15', 'Megace 麥格斯口服懸液劑', 'megestrol acetate']],
      flag: '❗同上，屬院外實證' },
    { key: 'doxorubicin', cards: [['17', 'ADR1CD04', 'Adriamycin 艾黴素注射劑', 'doxorubicin']],
      flag: '❗台大婦癌指引 0 次提及，屬院外實證' },
    { key: 'gemcitabine', cards: [['17', 'GEI1CB14', 'Gemzar 健仕注射液', 'gemcitabine']],
      flag: '❗台大婦癌指引 0 次提及，屬院外實證' },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑', 'docetaxel']],
      flag: '❗台大婦癌指引 0 次提及，屬院外實證' },
    { key: 'trabectedin', cards: [['17', 'YON1CC36', 'Yondelis 友待凍晶注射劑', 'trabectedin']],
      flag: '❗台大婦癌指引 0 次提及，屬院外實證' },
    { key: 'pazopanib', cards: [['17', 'VOT4CED7', 'Votrient 福退癌膜衣錠', 'pazopanib']],
      flag: '❗台大婦癌指引 0 次提及，屬院外實證' },
    { key: 'eribulin', cards: [['17', 'HAL1CEI4', 'Halaven 賀樂維注射液', 'eribulin']],
      flag: '❗效益主要在 liposarcoma，不是平滑肌肉瘤' },
    { key: 'ifosfamide', cards: [['17', 'HOL1CA13', 'Holoxan 好克癌注射劑', 'ifosfamide']] },
    { key: 'larotrectinib', cards: [['17', 'VIT4CG46', 'Vitrakvi 維泰凱膠囊 100 mg', 'larotrectinib']],
      flag: 'NTRK 融合的子宮肉瘤罕見但存在' }
  ];

  function opt(k, v, t, s) {
    return '<button class="flow-opt" onclick="usPick(\'' + k + '\',\'' + v + '\',this)">' +
      t + (s ? '<span class="fo-sub">' + s + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="us-node hidden" id="' + id + '"><div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head"><span class="flow-num">' + num +
      '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts, extra) {
    return '<div class="us-node" id="' + id + '"><div class="flow-step">' +
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

  var SRC = '台大婦癌診療指引 版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過）';

  /* ---------- 參考區塊 ---------- */
  function textLayerReference() {
    return fold('<b>❗這份指引的文字層有兩個會反轉語意的坑</b>（引用前必讀）',
      '<table>' +
      '<tr><td>❗<b>「±」整個不見了</b></td>' +
      '<td>用 rawdict 逐字檢查 p37，<b>非 ASCII 字元只有中文與 bullet，沒有 U+00B1</b>。' +
      '所以從 PDF 複製出來會變成：' + SUB([
        '文字層 <b>TH with en bloc resection　BSO</b> → PNG 實為 <b>TH with en bloc resection <u>±</u> BSO</b>',
        '文字層 <b>Systemic therapy palliative EBRT</b> → PNG 實為 <b>Systemic therapy <u>±</u> palliative EBRT</b>',
        '文字層 <b>EBRT　brachytherapy</b> → PNG 實為 <b>EBRT <u>±</u> brachytherapy</b>',
        '文字層 <b>(SCH) BSO</b> → PNG 實為 <b>(SCH) <u>±</u> BSO</b>']) +
      '<b>「±」是「可做可不做」，掉了就變成「一定要做」—— 這是臨床語意的反轉。</b>' +
      '<b>箭頭 → 同樣不在文字層。本頁的逐字引用一律以 PNG 為準。</b></td></tr>' +
      '<tr><td>❗<b>p38 留著未清的<br>紅色修訂痕跡</b></td>' +
      '<td>文字層讀到 <b>「Observe, if menopausal or prior BSO」</b>，' +
      '但 <b>PNG 上 menopausal 與 or 兩個字都有紅色刪除線</b>（已放大裁切確認）。<br>' +
      '<b>定稿後的讀法是「Observe, if <u>prior BSO</u>」</b> —— ' +
      '<b>也就是說「停經」不再是可以觀察的理由，只有「先前已做過 BSO」才是。</b><br>' +
      '同頁另有整行紅色新增字 <b>± systemic endocrine therapy</b>。' +
      '這兩處出現在 UTSARC-2 四個方塊中的三個。</td></tr>' +
      '</table>');
  }

  function gapReference() {
    return fold('<b>❗這份指引在子宮肉瘤的三個「查無」</b>（不可用記憶補）',
      '<table>' +
      '<tr><td>❗<b>UTSARC-A<br>整頁不存在</b></td>' +
      '<td><b>UN-1（p19）、UTSARC-1、UTSARC-3 三處指向 UTSARC-A，但文件裡沒有這一頁</b>' +
      '（UTSARC 系列只有 1～5，p37–41）。<br>' +
      '<b>後果：分子檢測原則與系統性治療處方整段消失。</b><br>' +
      '全 68 頁檢索 <b>doxorubicin／gemcitabine／trabectedin／pazopanib／olaparib／lenvatinib／' +
      'pembrolizumab 全部 0 次</b>；UTSARC 五頁裡藥物層級的字只有 <b>Systemic therapy（9 次）</b>與' +
      '<b>systemic endocrine therapy（1 次）</b>。<b>沒有任何一頁列出處方或劑量。</b><br>' +
      '❗UN-1 那句「Recommend molecular evaluation of tumor and evaluation for inherited cancer ' +
      'risk (ENDO-A and UTSARC-A)」<b>對肉瘤病人等於斷鏈</b>。</td></tr>' +
      '<tr><td>❗<b>沒有 morcellation<br>警語</b></td>' +
      '<td><b>全 68 頁 morcell 只命中 p34 一次</b>，而且是 <b>ENDO-A 給「癌症（carcinoma）」用的' +
      '病理報告欄位定義</b>（「Specimen integrity (intact, opened, morcellated, other)」）—— ' +
      '<b>肉瘤不在該段適用範圍</b>。<b>UTSARC 五頁一次都沒出現</b>；' +
      '中文「碎」0 次、power morcellation 0 次、contained 0 次。<br>' +
      '<b>這份指引把「腫瘤已被碎解」當成<u>事後怎麼補救</u>的狀態</b>' +
      '（Tumor initially fragmented → Consider re-exploration/reresection），' +
      '<b>而不是一條事前的「不要做 morcellation」警告。</b><br>' +
      '→ <b>病安警語必須另引 FDA，不可宣稱出自這份指引。</b>見下方 FDA 那一格。</td></tr>' +
      '<tr><td>❗<b>淋巴結完全沒寫</b></td>' +
      '<td><b>p37–41 檢索 lymph／node 命中 0 次</b> —— <b>不是「不建議」，是「完全沒寫」</b>，' +
      '<b>連一句說明或警語都沒有</b>。<br>' +
      '❗<b>常見的誤讀</b>：UTSARC-1 那句「Additional surgical resection for intraoperative ' +
      'discovery of <u>extrauterine disease</u> is individualized」的受詞是<b>子宮外病灶</b>，' +
      '<b>不是淋巴結</b>。<b>不要把它讀成「術中發現異常淋巴結才個別考量」。</b><br>' +
      '→ 淋巴結的處置須引院外指引，見下方 ESGO 那一格。</td></tr>' +
      '<tr><td><b>保留卵巢的門檻</b></td>' +
      '<td><b>查無明文</b>。全 68 頁 ovarian preservation <b>0 次</b>' +
      '（preservation 只命中 p27 子宮內膜癌的 fertility-sparing 段落）。' +
      '<b>指引只用「±」表達 BSO 可選，沒有寫任何年齡、分期、ER 狀態的保留門檻。</b></td></tr>' +
      '</table>');
  }

  function esgoNodeReference() {
    return fold('<b>淋巴結怎麼處理</b>（院外實證：ESGO／EURACAN／GCIG 2024）',
      '<table>' +
      '<tr><td colspan="2">❗<b>台大指引在這一題上是空白的</b>（UTSARC-1～5 檢索 lymph／node 0 次），' +
      '以下全部是院外實證。</td></tr>' +
      '<tr><td><b>不做常規廓清</b></td>' +
      '<td><b>「Routine systematic lymphadenectomy <u>should not be performed</u>」（III, D）</b></td></tr>' +
      '<tr><td>❗<b>但可疑的要切</b></td>' +
      '<td><b>「<u>Suspicious nodes</u> or peritoneal lesions <u>should be removed as well</u>」（IV, B）</b><br>' +
      '❗<b>ESGO 的觸發條件是「術中明顯腫大<u>或術前影像可疑</u>」</b> —— ' +
      '<b>只寫「術中發現才考慮」會漏掉術前影像已看到腫大淋巴結的病人。</b></td></tr>' +
      '<tr><td><b>分期表這一側</b></td>' +
      '<td>ST-3 與 ST-4 的 N 分類逐字相同：<b>NX／N0／N0(i+)（孤立腫瘤細胞 ≤ 0.2 mm）／N1（即 IIIC）</b>。<br>' +
      '❗<b>肉瘤側<u>沒有</u> sn 後綴那一句，也沒有 N1mi／N1a／N2 這些細分</b> —— ' +
      '<b>子宮內膜癌的 ST-2 有完整的 sentinel node 超分期規則，肉瘤沒有。</b></td></tr>' +
      '</table>');
  }

  function fdaReference() {
    return fold('<b>❗碎解取出（morcellation）的病安警訊</b>（院外：FDA，非台大指引）',
      '<table>' +
      '<tr><td colspan="2">❗<b>台大婦癌指引完全沒有這條警語</b>（見上方「三個查無」），' +
      '以下全部出自 FDA 官方文件。</td></tr>' +
      '<tr><td><b>發過幾次</b></td><td>FDA 就電動碎解器（power morcellator）發過<b>四次</b>安全警訊：' +
      '<b>2014/04、2014/11、2020/02、2020/12</b>。</td></tr>' +
      '<tr><td><b>隱藏肉瘤的機率</b></td>' +
      '<td><b>因肌瘤接受手術的婦女中，隱藏未診斷子宮肉瘤約 1/225 至 1/580</b>' +
      '（平滑肌肉瘤約 <b>1/495 至 1/1,100</b>）—— 這是 <b>2017 年重新評估後</b>的數字。<br>' +
      '<b>2014 年版當時給的是 1/350</b>，兩個數字常被混用。</td></tr>' +
      '<tr><td>❗<b>用字有變過</b></td>' +
      '<td><b>「significantly worsening long-term survival」這個措辭只出現在 2014-11-24 版</b>；' +
      '<b>2020 年之後 FDA 改成較保留的「may spread cancer and <u>may</u> decrease their long-term ' +
      'survival」</b>，並自承支持證據「have limitations」（多為回溯性研究、部分未達統計顯著）。<br>' +
      '<b>引用時要講清楚是哪一版的措辭。</b></td></tr>' +
      '<tr><td>❗<b>FDA 沒有全面禁用</b></td>' +
      '<td><b>現行立場不是禁止，而是「只在適當選擇的病人、且併用組織收納袋（containment system）' +
      '時才可做」</b>；<b>停經後或年逾 50 歲、或可經陰道／小切口整塊取出者列為禁忌</b>。' +
      '<b>2026-07-02 還核准了整合式碎解／收納系統。</b><br>' +
      '<b>臨床頁不可寫成「FDA 禁止使用」。</b></td></tr>' +
      '<tr><td><b>指引這一側能用的</b></td>' +
      '<td>台大 UTSARC-1 有兩處與此相關但<b>不是警告句</b>：' +
      '<b>「TH with <u>en bloc</u> resection ± BSO」</b>（en bloc 全文只出現在 p37 這兩處），' +
      '與意外發現那一支的 <b>「Tumor initially fragmented or Residual cervix → ' +
      'Consider re-exploration/reresection」</b>。</td></tr>' +
      '</table>');
  }

  function stagingReference() {
    return fold('<b>ST-3 與 ST-4：用錯一張，整個 T 分類就錯</b>（p44–45）',
      '<table>' +
      '<tr><td colspan="2"><b>兩張表的 N、M、G 三段逐字完全相同，差別<u>只在 T 分類</u>。</b></td></tr>' +
      '<tr><td><b>ST-3</b><br>平滑肌肉瘤與<br>子宮內膜間質肉瘤</td>' +
      '<td><b>T 用「腫瘤大小」</b>：<br>' +
      '<b>T1　I　Tumor limited to the uterus</b><br>' +
      '<b>T1a　IA　Tumor 5 cm or less in greatest dimension</b><br>' +
      '<b>T1b　IB　Tumor more than 5 cm</b><br>' +
      '（表上未再細分低惡性度與高惡性度 ESS，兩者共用這張表）</td></tr>' +
      '<tr><td><b>ST-4</b><br>苗勒氏腺肉瘤</td>' +
      '<td><b>T 用「肌層侵犯深度」，而且多一個 IC</b>：<br>' +
      '<b>T1　I　Tumor limited to the uterus</b><br>' +
      '<b>T1a　IA　Tumor limited to the endometrium/endocervix</b><br>' +
      '<b>T1b　IB*　Tumor invades less than or equal to half myometrial invasion</b><br>' +
      '<b>T1c　IC*　Tumor invades more than half myometrial invasion</b></td></tr>' +
      '<tr><td>T2 之後</td><td>兩表逐字相同：<b>T2 II（超出子宮但仍在骨盆內）／T2a IIA（侵犯附件）／' +
      'T2b IIB（侵犯其他骨盆組織）／T3 III（浸潤腹部組織）／T3a IIIA（一處）／T3b IIIB（多於一處）／' +
      'T4 IVA（侵犯膀胱或直腸）</b>。</td></tr>' +
      '<tr><td>ST-4 的註腳<br>（全文唯一有定義的註腳）</td>' +
      '<td>逐字：<b>「There is a discrepancy between the 2009 FIGO and 2017 AJCC staging documents ' +
      'in the tumor definitions for FIGO stages IB and IC. The NCCN Panel has chosen to use ' +
      '<u>2009 FIGO language</u>…」</b>（Corrigendum to "FIGO staging for uterine sarcomas", ' +
      'Int J Gynaecol Obstet 2009;104:179）</td></tr>' +
      '<tr><td>❗<b>兩張表都沒收的</b></td>' +
      '<td><b>未分化子宮肉瘤（UUS）與 PEComa 兩張表都沒有收</b> —— ' +
      '<b>指引把它們送進 UTSARC-3 用分期決定治療，卻沒告訴你用哪張表分期。</b></td></tr>' +
      '</table>');
  }

  /* ---------- 版面 ---------- */
  function utsarcPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">子宮肉瘤的入口在<b>台大婦癌診療指引 版次 10 的 UN-1（p19）</b>，' +
      '不在 UTSARC 頁；主流程是 <b>UTSARC-1 ～ UTSARC-5（p37–41）</b>，' +
      '分期表 <b>ST-3 與 ST-4（p44–45）</b>。九張圖已 render 成 PNG 逐張看圖判讀。<br>' +
      '❗<b>這份 PDF 的文字層有兩個會反轉語意的坑</b>：' +
      '<b>「±」這個字元整個不在文字層</b>（複製出來會把「可做可不做」變成「一定要做」），' +
      '<b>而且 p38 留著未清乾淨的紅色刪除線</b>（「Observe, if <s>menopausal or</s> prior BSO」）。' +
      '本頁的逐字引用一律以 PNG 為準。<br>' +
      '❗<b>三個「查無」</b>：<b>UTSARC-A 整頁不存在</b>（處方與分子檢測原則整段消失，' +
      '全文件 doxorubicin／gemcitabine／trabectedin／pazopanib 各 0 次）；' +
      '<b>沒有任何 morcellation 警語</b>；<b>UTSARC-1～5 完全沒提淋巴結</b>' +
      '（是「沒寫」不是「不建議」）。這三處改用院外實證並標明出處。<br>' +
      '❗<b>癌肉瘤（carcinosarcoma）不走這一頁</b> —— 見步驟 1 最後一項。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b></p>';
    h += '<div class="onc-path" id="usPath">';

    h += node0('us_n1', '1', '現在的情境是哪一種？',
      opt('entry', 'primary', '原發治療 —— 要開刀', 'UTSARC-1（p37）') +
      opt('entry', 'incidental', '因其他原因開刀，術後病理才知道是肉瘤', 'UTSARC-1 的另一支') +
      opt('entry', 'adj', '已手術，要決定輔助治療', 'UTSARC-2／UTSARC-3') +
      opt('entry', 'carcinosarc', '病理是癌肉瘤 carcinosarcoma', '❗不走這一頁'),
      textLayerReference() + gapReference());

    h += node('us_n_pres', '2', '術前評估的病灶範圍？',
      opt('pres', 'confined', '看起來侷限於子宮', '') +
      opt('pres', 'extra', '已知或疑似有子宮外病灶，且決定開刀', ''));
    h += recBox('us_r_primary', '建議處置 · 手術要開到哪裡');

    h += node('us_n_resid', '2', '術後病理與影像看到什麼？（UTSARC-1 意外發現那一支）',
      opt('resid', 'frag', '腫瘤在術中已被碎解，或還留著子宮頸', '') +
      opt('resid', 'tube', '還留著輸卵管或卵巢', '') +
      opt('resid', 'none', '以上都沒有 —— 子宮已整塊切除、附件也處理過', ''));
    h += recBox('us_r_incid', '建議處置 · 要不要再進手術室');

    h += node('us_n_histo', '2', '組織型態是哪一組？（❗分流在<u>治療之後</u>才做）',
      opt('histo', 'lgess', '低惡性度 ESS，或腺肉瘤<b>不</b>伴隨 sarcomatous overgrowth', '→ UTSARC-2') +
      opt('histo', 'adenoso', '腺肉瘤<b>伴隨</b> sarcomatous overgrowth（SO）', '→ UTSARC-2 的另一列') +
      opt('histo', 'high', '高惡性度 ESS ／ UUS ／ 平滑肌肉瘤 LMS ／ 其他肉瘤（含 PEComa）', '→ UTSARC-3；四者共用同一組建議'),
      stagingReference());
    h += node('us_n_stg2', '3', '分期？（UTSARC-2 只分兩段）',
      opt('stg2', 'i', 'Stage I', '') +
      opt('stg2', 'adv', 'Stage II、III、IVA、IVB', ''));
    h += node('us_n_stg3', '3', '分期？（UTSARC-3 分四段）',
      opt('stg3', 'i', 'Stage I', '') +
      opt('stg3', 'ii_iii', 'Stage II、III', '') +
      opt('stg3', 'iva', 'Stage IVA', '') +
      opt('stg3', 'ivb', 'Stage IVB', ''));
    h += recBox('us_r_adj', '建議處置 · 輔助治療');
    h += fuBox('us_f_adj');

    h += recBox('us_r_cs', '建議處置 · 癌肉瘤走哪一條');

    h += '<div class="flow-reset"><button class="back-btn" onclick="usReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="us_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="us_drugs"></div>';
    return h;
  }

  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function collapseAll() {
    var root = el('usPath');
    if (!root) return;
    root.querySelectorAll('.us-node').forEach(function (n) { if (n.id !== 'us_n1') n.classList.add('hidden'); });
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

  /* ---------- 各分支 ---------- */
  function renderPrimary() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('先確認入口', 'UN-1，p19'));
    L.push('<b>UN-1 把子宮腫瘤先切成兩支：Malignant epithelial (carcinoma) 與 ' +
      'Malignant mesenchymal (sarcoma)。</b>肉瘤這一支列的是：' + SUB([
      '<b>Low-grade endometrial stromal sarcoma (ESS) or adenosarcoma</b>',
      '<b>High-grade ESS</b>', '<b>Undifferentiated uterine sarcoma (UUS)</b>',
      '<b>Leiomyosarcoma (LMS)</b>',
      '<b>Other sarcomas（例如 perivascular epithelioid cell tumor, PEComa）</b>']) +
      '→ <b>Primary Treatment (UTSARC-1)</b>');
    if (S.pres === 'confined') {
      title = '看起來侷限於子宮<br>→ 全子宮切除加整塊切除，<b>BSO 是「可做可不做」</b>';
      L.push(H('主建議逐字', 'UTSARC-1，p37（以 PNG 為準）'));
      L.push('<b>「TH with en bloc resection <u>±</u> BSO」</b>');
      L.push('❗<b>這裡的「±」在 PDF 文字層是不存在的</b> —— ' +
        '<b>直接複製文字會讀成「TH with en bloc resection BSO」，變成「一定要切附件」。</b>' +
        '<b>全文沒有出現 TH/BSO 這種強制寫法</b>（TH/BSO 只出現在子宮內膜癌那一側）。');
      L.push('<b>「en bloc」這個字全文只出現在 p37 這兩處</b> —— ' +
        '<b>它是這份指引最接近「不要把腫瘤弄碎」的用字，但它不是一條警告句。</b>' +
        '真正的病安警訊要引 FDA，見下方橫列。');
      L.push('<b>術中若發現子宮外病灶</b>：<b>「Additional surgical resection for intraoperative ' +
        'discovery of <u>extrauterine disease</u> is individualized」</b>。');
      L.push('❗<b>這一句的受詞是「子宮外病灶」，不是淋巴結</b> —— ' +
        '<b>常見的誤讀是把它當成「術中發現異常淋巴結才個別考量」。' +
        '這份指引在 UTSARC-1～5 完全沒有提到淋巴結。</b>淋巴結的處置見下方 ESGO 橫列。');
      L.push('❗<b>什麼時候可以保留卵巢，指引沒有寫</b> —— ' +
        '<b>全 68 頁 ovarian preservation 0 次</b>，只用「±」表達可選，' +
        '<b>沒有任何年齡、分期、ER 狀態的門檻</b>。');
    } else {
      cls = 'rec-urgent';
      title = '已知或疑似子宮外病灶，且決定開刀<br>→ 子宮切除加轉移灶切除';
      L.push(H('主建議逐字', 'UTSARC-1，p37（以 PNG 為準）'));
      L.push('<b>「TH with en bloc resection <u>±</u> BSO」<u>and</u> ' +
        '「Resection of metastatic focus」</b>');
      L.push('<b>這一支的差別是多了「轉移灶切除」，而 BSO 仍然是「±」。</b>');
      L.push('❗<b>淋巴結在這一格一樣沒有寫</b>。' +
        '<b>ESGO 2024 的立場是：不做常規系統性廓清（III, D），但術中明顯腫大<u>或術前影像可疑</u>者' +
        '應一併切除（IV, B）。</b>見下方橫列。');
    }
    L.push(H('接下來', ''));
    L.push('❗<b>組織型態的分流是在<u>原發治療之後</u>才做</b> —— ' +
      '<b>UTSARC-1 右側用一個大括號把四條治療線一起匯入，然後才分成 UTSARC-2 與 UTSARC-3。</b>' +
      '<b>看圖才看得出來這個順序。</b>');
    L.push('<b>請回步驟 1 選「已手術，要決定輔助治療」</b>。');
    fill('us_r_primary', cls, title, L,
      SRC + ' UN-1（p19）、UTSARC-1（p37，已 render PNG 逐格核對）。' +
      '❗<b>逐字引用以 PNG 為準：文字層沒有「±」與箭頭。</b>' +
      '淋巴結與 morcellation 兩題指引皆未寫，改用院外實證（ESGO 2024、FDA）。',
      textLayerReference() + esgoNodeReference() + fdaReference() + gapReference());
  }

  function renderIncidental() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('這一支的起點', 'UTSARC-1，p37'));
    L.push('<b>「Diagnosed after TH or supracervical hysterectomy (SCH) <u>±</u> BSO」</b>' +
      '（❗「±」同樣不在文字層）');
    L.push(H('不論哪一種，先做這三件事', 'ADDITIONAL EVALUATION 逐字'));
    L.push('<b>「Expert pathologic review and consider molecular testing」</b>' +
      '❗<b>但分子檢測的原則寫在 UTSARC-A，而那一頁不存在。</b>');
    L.push('<b>「Imaging」</b>');
    L.push('<b>「Consider ER/PR testing for LMS, ESS, and adenosarcoma」</b> —— ' +
      '<b>這一項會直接影響下面要不要補切附件。</b>');

    if (S.resid === 'frag') {
      cls = 'rec-urgent';
      title = '腫瘤已被碎解，或還留著子宮頸<br>→ 考慮再探查／再切除';
      L.push(H('主建議逐字', 'UTSARC-1'));
      L.push('<b>「Tumor initially fragmented <u>or</u> Residual cervix」→ ' +
        '「Consider re-exploration/reresection」</b>');
      L.push('❗<b>注意指引把「腫瘤已被碎解」放在這裡 —— 當成<u>事後怎麼補救</u>的狀態，' +
        '而不是事前的警告。</b>' +
        '<b>這份指引完全沒有 morcellation 的警語</b>（全 68 頁只命中一次，' +
        '而且是給癌症用的病理欄位定義）。<b>病安警訊要引 FDA，見下方橫列。</b>');
      L.push('<b>「Consider」是指引的用字</b> —— <b>不是一定要再開，要個案判斷。</b>');
    } else if (S.resid === 'tube') {
      title = '還留著輸卵管或卵巢<br>→ 只有三種情形才考慮補切';
      L.push(H('❗主建議逐字：條件寫得很具體', 'UTSARC-1'));
      L.push('<b>「Residual tube/ovary」→「Consider completion salpingo-oophorectomy in ' +
        '<u>low-grade ESS, adenosarcoma, or ER-positive tumor</u>」</b>');
      L.push('<b>也就是說補切附件只在這三種情形下考慮</b>：' + SUB([
        '<b>低惡性度 ESS</b>', '<b>腺肉瘤</b>', '<b>ER 陽性腫瘤</b>']));
      L.push('❗<b>反過來說：平滑肌肉瘤、高惡性度 ESS、UUS 若 ER 陰性，' +
        '指引沒有要你回頭去切附件。</b>' +
        '<b>這也是為什麼上一格要「Consider ER/PR testing for LMS, ESS, and adenosarcoma」。</b>');
    } else {
      cls = 'rec-nonop';
      title = '沒有碎解、沒有殘餘子宮頸、附件也處理過<br>→ 不需要再進手術室，直接接輔助治療決策';
      L.push(H('主建議', 'UTSARC-1'));
      L.push('<b>UTSARC-1 的意外發現那一支只列了兩個再手術的理由</b>' +
        '（腫瘤已碎解或殘餘子宮頸 → 再探查；殘餘輸卵管卵巢且為低惡性度 ESS／腺肉瘤／ER 陽性 → 補切附件）。' +
        '<b>兩者都不成立時，圖上就直接接回右側的組織型態分流。</b>');
      L.push('<b>但前面那三件事仍然要做</b>：<b>專家病理複閱與考慮分子檢測、影像、' +
        '以及 LMS／ESS／腺肉瘤考慮驗 ER/PR。</b>');
    }
    L.push('<b>接下來</b>：兩條路都匯回右側的組織型態分流 —— ' +
      '<b>請回步驟 1 選「已手術，要決定輔助治療」。</b>');
    fill('us_r_incid', cls, title, L,
      SRC + ' UTSARC-1（p37）意外發現分支（已 render PNG 目視確認為兩條斜箭頭，非三條）。' +
      '❗<b>morcellation 的病安警語這份指引沒有，改引 FDA。</b>',
      fdaReference() + textLayerReference() + gapReference());
  }

  function renderAdj() {
    var L = [], cls = 'rec-elective', title = '';
    var hg = S.histo === 'high';
    var st = hg ? S.stg3 : S.stg2;
    var gname = S.histo === 'lgess' ? '低惡性度 ESS 或腺肉瘤（不伴 SO）' :
      (S.histo === 'adenoso' ? '腺肉瘤伴 sarcomatous overgrowth' :
        '高惡性度 ESS ／ UUS ／ 平滑肌肉瘤 ／ 其他肉瘤');

    L.push(H('❗先確認分流的邏輯', 'UTSARC-1 右側大括號'));
    L.push('<b>這份指引的分流<u>不是</u>「LMS 一條、ESS 一條」，而是「低惡性度一條、高惡性度一條」</b>：' +
      SUB(['<b>UTSARC-2</b>：低惡性度 ESS、腺肉瘤',
        '<b>UTSARC-3</b>：高惡性度 ESS、UUS、<b>平滑肌肉瘤 LMS</b>、其他肉瘤（含 PEComa）']) +
      '❗<b>UTSARC-3 沒有把 LMS 與高惡性度 ESS／UUS 分開給不同建議 —— 四者共用同一組建議。</b>');

    if (!hg) {
      var so = S.histo === 'adenoso';
      if (st === 'i') {
        cls = 'rec-nonop';
        title = gname + ' · <b>Stage I</b><br>→ ' + (so ? 'BSO' : 'BSO 為佳') + '，或在特定條件下觀察';
        L.push(H('主建議逐字', 'UTSARC-2，p38（以 PNG 為準）'));
        L.push(so ? '<b>「BSO」<u>or</u>「Observe, if <s>menopausal</s> <s>or</s> prior BSO」</b>'
          : '<b>「BSO (preferred)」<u>or</u>「Observe, if <s>menopausal</s> <s>or</s> prior BSO」</b>');
        L.push('❗<b>這一格最重要的一件事</b>：<b>PNG 上 menopausal 與 or 兩個字都有<u>紅色刪除線</u></b>' +
          '（已放大裁切確認），<b>定稿後的讀法是「Observe, if <u>prior BSO</u>」</b>。<br>' +
          '<b>也就是說「停經」不再是可以觀察的理由，只有「先前已經做過 BSO」才是。</b>' +
          '<b>直接複製文字層會讀成舊版，把停經婦女誤放進觀察組。</b>');
        if (!so) L.push('<b>不伴 SO 的腺肉瘤與低惡性度 ESS 這一格，BSO 標的是「preferred」；' +
          '伴 SO 的那一列就只寫「BSO」。</b>');
      } else {
        title = gname + ' · <b>Stage II、III、IVA、IVB</b><br>→ BSO 加全身治療；放療是 category 2B';
        L.push(H('主建議逐字', 'UTSARC-2，p38（以 PNG 為準）'));
        if (so) {
          L.push('<b>「BSO」／「Consider systemic therapy <u>(recommended for residual measurable ' +
            'disease)</u>」／「± EBRT (palliative for stage IVB)」</b>');
          L.push('❗<b>伴 SO 這一列的全身治療寫的是「Consider」，但括號裡加了條件</b>：' +
            '<b>有殘餘可測量病灶時是「recommended」。</b>' +
            '<b>不伴 SO 的那一列則是紅色新增的「± systemic endocrine therapy」，兩者不同。</b>');
        } else {
          L.push('<b>「BSO」／<u>「± systemic endocrine therapy」（紅色新增字）</u>／' +
            '「± EBRT (palliative for stage IVB)」</b>');
          L.push('❗<b>荷爾蒙治療這一行是這份指引裡<u>唯一</u>提到內分泌治療的地方，' +
            '而且它只有五個字：systemic endocrine therapy。</b>' +
            '<b>沒有指名任何藥、沒有劑量、沒有機轉。</b>' +
            '全 68 頁 <b>aromatase 0 次、GnRH 0 次、tamoxifen 0 次</b>；' +
            NR('letrozole') + ' 與 ' + NR('megestrol') +
            ' 的命中全部在<b>卵巢癌或子宮內膜癌</b>章節，不是肉瘤。<br>' +
            '→ <b>要寫 ' + NR('aromatase inhibitor') + ' 或 ' + NR('GnRH agonist') +
            '，不可掛在這份指引名下。</b>');
          L.push('<b>院外實證上實際會用的是</b>（標明出處，不是這份指引）：' + SUB([
            '<b><span class="rx">letrozole</span> 或 <span class="rx">anastrozole</span></b>' +
              '（aromatase inhibitor，用於 ER／PR 陽性的低惡性度 ESS）',
            '<b><span class="rx">megestrol</span> 等 progestin</b>']) +
            '❗<b>但這一類的證據幾乎全部是回溯性系列，沒有隨機試驗</b> —— ' +
            '<b>證據等級很低，要和病人講清楚。</b>');
          L.push('❗<b>而且要先驗 ER／PR</b>（UTSARC-1：「Consider ER/PR testing for LMS, ESS, ' +
            'and adenosarcoma」）—— <b>ER 陰性就沒有用這一類藥的理由。</b>');
        }
        L.push('❗<b>放療的等級</b>：<b>「(category 2B for EBRT for stage II, III, IVA)」</b> —— ' +
          '<b>IVB 那一格的 EBRT 是緩和性的，II／III／IVA 的 EBRT 則標了 category 2B。</b>');
        L.push('❗<b>「±」在文字層不存在</b>：' +
          '<b>「Systemic therapy palliative EBRT」實際上是「Systemic therapy <u>±</u> palliative EBRT」。</b>');
      }
      L.push('<b>四條路線最後都 → Surveillance（UTSARC-4）。</b>');
    } else {
      if (st === 'i') {
        cls = 'rec-nonop';
        title = gname + ' · <b>Stage I</b><br>→ ❗只寫「Observe」，完全不給輔助治療';
        L.push(H('主建議逐字', 'UTSARC-3，p39'));
        L.push('<b>「Observe」</b>');
        L.push('❗<b>這一格就只有這兩個字</b> —— <b>高惡性度 ESS、UUS、平滑肌肉瘤、其他肉瘤的 ' +
          'Stage I 在這份指引裡完全不給輔助化療或放療。</b>');
        L.push(EV('<b>院外實證的方向一致但證據薄弱</b>：平滑肌肉瘤的輔助化療至今沒有證實存活效益，' +
          '<b>GOG-0277（LMS 輔助 gemcitabine ＋ docetaxel）因收案不足提前結束</b>。' +
          '<b>所以「Stage I 觀察」不是保守，是目前的證據所支持的做法。</b>'));
      } else if (st === 'ii_iii') {
        title = gname + ' · <b>Stage II、III</b><br>→ 三個選項並列，切乾淨的可以只觀察';
        L.push(H('主建議逐字', 'UTSARC-3，p39'));
        L.push('<b>「Consider observation <u>if completely resected with negative margins</u>」<br>' +
          '<u>or</u>「Consider systemic therapy」<br><u>and/or</u>「Consider EBRT」</b>');
        L.push('❗<b>三個都寫「Consider」，而且觀察那一項有明確條件：完整切除且切緣陰性。</b>' +
          '<b>這一格指引沒有給偏好順序。</b>');
        L.push('❗<b>這一格的 EBRT <u>沒有</u>標 category</b>（對照 UTSARC-2 的 II／III／IVA 標了 2B）。');
        L.push('❗<b>「systemic therapy」要用什麼藥，指引沒有寫</b> —— ' +
          '<b>處方原則在 UTSARC-A，而那一頁不存在。</b>見下方缺頁清單。');
      } else if (st === 'iva') {
        cls = 'rec-urgent';
        title = gname + ' · <b>Stage IVA</b><br>→ 全身治療與／或放療';
        L.push(H('主建議逐字', 'UTSARC-3，p39'));
        L.push('<b>「Systemic therapy」<u>and/or</u>「EBRT」</b>');
        L.push('❗<b>和 Stage II／III 的差別是這一格<u>沒有</u>「Consider」，也沒有觀察的選項。</b>');
        L.push('❗<b>處方一樣沒有寫。</b>');
      } else {
        cls = 'rec-urgent';
        title = gname + ' · <b>Stage IVB</b><br>→ 全身治療，放療為緩和性';
        L.push(H('主建議逐字', 'UTSARC-3，p39（以 PNG 為準）'));
        L.push('<b>「Systemic therapy <u>±</u> palliative EBRT」</b>');
        L.push('❗<b>文字層讀到的是「Systemic therapy palliative EBRT」</b> —— ' +
          '<b>「±」不見了，會被讀成「一定要加緩和放療」。</b>');
        L.push('❗<b>處方一樣沒有寫。</b>');
      }
      L.push('<b>四條路線最後都 → Surveillance（UTSARC-4）。</b>');
      if (st !== 'i') {
      L.push(H('❗「Systemic therapy」到底是什麼，這份指引沒有回答', ''));
      L.push('<b>全 68 頁檢索：' + NR('doxorubicin') + '、' + NR('gemcitabine') + '、' +
        NR('trabectedin') + '、' + NR('pazopanib') + '、' + NR('olaparib') + '、' +
        NR('lenvatinib') + '、' + NR('pembrolizumab') + ' <u>全部 0 次</u></b>；' +
        '<b>chemotherapy 一字在子宮頸癌、子宮內膜癌、卵巢癌章節都有，唯獨子宮肉瘤頁一次都沒有。</b>' +
        '<b>UTSARC-1 與 UTSARC-3 兩度指向 UTSARC-A，而那一頁不存在。</b>');
      L.push('❗<b>所以下面的處方全部是院外實證，<u>不是</u>這份指引寫的</b>：' + SUB([
        '<b>第一線：<span class="rx">doxorubicin</span> 單藥</b>',
        '<b>或 <span class="rx">gemcitabine</span> ＋ <span class="rx">docetaxel</span></b>' +
          '（❗<b>GeDDiS 未顯示這個組合優於 doxorubicin 單藥</b>）',
        '<b>子宮平滑肌肉瘤另有 <span class="rx">doxorubicin</span> ＋ ' +
          '<span class="rx">trabectedin</span> 的第三期資料</b>（LMS-04，Pautier，Lancet Oncol 2022）',
        '<b>後線：<span class="rx">trabectedin</span></b>（Demetri，JCO 2016，限 LMS 與 liposarcoma）' +
          '或 <b><span class="rx">pazopanib</span></b>（PALETTE）']));
      L.push('❗<b><span class="rx">eribulin</span> 的效益主要在 liposarcoma，不是平滑肌肉瘤</b> —— ' +
        '<b>這一點常被弄混。</b>');
      L.push(EV('<b>ANNOUNCE 是陰性的</b>（olaratumab 未能重現第二期的結果），' +
        '所以不要再把 olaratumab 放進第一線。' +
        '<b>平滑肌肉瘤的<u>輔助</u>化療至今沒有證實存活效益</b>，' +
        'GOG-0277（LMS 輔助 gemcitabine ＋ docetaxel）因收案不足提前結束 —— ' +
        '<b>這也是為什麼 UTSARC-3 的 Stage I 只寫 Observe。</b>'));
      }
    }
    fill('us_r_adj', cls, title, L,
      SRC + ' ' + (hg ? 'UTSARC-3（p39）' : 'UTSARC-2（p38）') +
      '，已 render PNG 逐格核對。❗<b>逐字引用以 PNG 為準：文字層沒有「±」，' +
      '且 p38 留著未清的紅色刪除線。</b>' +
      '❗<b>系統性治療的處方原則在 UTSARC-A，而該頁不存在；本頁的處方全部為標明出處的院外實證。</b>',
      textLayerReference() + gapReference() + stagingReference() + esgoNodeReference());
    fu('us_f_adj', '<li><b>四條路線都導向 Surveillance（UTSARC-4，p40）。</b></li>' +
      '<li>❗<b>UUS 與 PEComa 兩張分期表都沒有收</b> —— ' +
      '<b>指引把它們送進 UTSARC-3 用分期決定治療，卻沒告訴你用哪張表分期。</b></li>' +
      '<li><b>ER／PR 若為陽性，會影響復發時的荷爾蒙治療選擇</b>' +
      '（UTSARC-1 的「Consider ER/PR testing for LMS, ESS, and adenosarcoma」）。</li>');
  }

  function renderCarcinosarc() {
    fill('us_r_cs', 'rec-nonop',
      '癌肉瘤 carcinosarcoma<br>→ ❗不走子宮肉瘤這一頁，走子宮內膜癌的 ENDO-14',
      [H('指引把它歸在哪一邊', 'UN-1，p19'),
      '<b>UN-1 把 Carcinosarcoma 放在 <u>Malignant epithelial (carcinoma)</u> → ' +
        '<u>High-risk endometrial carcinoma histology</u> 底下</b>，' +
        '與 Serous carcinoma、Clear cell carcinoma、Undifferentiated/dedifferentiated carcinoma 並列：' +
        SUB(['<b>Serous carcinoma → Primary Treatment (ENDO-11)</b>',
          '<b>Clear cell carcinoma → Primary Treatment (ENDO-12)</b>',
          '<b>Undifferentiated/dedifferentiated carcinoma → Primary Treatment (ENDO-13)</b>',
          '<b>Carcinosarcoma → Primary Treatment (<u>ENDO-14</u>)</b>']),
      '<b>p33 的頁首逐字是「Endometrial Carcinoma: Carcinosarcoma」</b>，' +
        '<b>而且該頁註明「All staging in guideline is based on updated FIGO staging. (ST-1)」。</b>',
      H('❗所以分期也要換一張表', ''),
      '<b>癌肉瘤用 <u>ST-1</u> 的子宮內膜癌分期，<u>不用</u> ST-3 或 ST-4 的肉瘤分期。</b>' +
        '<b>p42（ST-1）的標題就直接寫「Staging–Uterine Carcinomas <u>and Carcinosarcoma</u>」。</b>',
      '<b>病理端也同調</b>：p34（ENDO-A）逐字' +
        '<b>「Pathologic Assessment for Carcinoma (including carcinoma, <u>carcinosarcoma</u>, ' +
        'and neuroendocrine carcinoma)」</b>。',
      H('指引沒有說為什麼', ''),
      '❗<b>整份文件沒有任何一句解釋癌肉瘤的分子或臨床行為為什麼屬於 carcinoma。</b>' +
        '<b>只能說「指引把它歸在 carcinoma 類」，理由屬於未查證。</b>',
      '<b>請改看本站「子宮內膜癌」分頁。</b>',
      H('一個實務上的連帶影響', ''),
      '❗<b>癌肉瘤的手術寫法也和肉瘤不同</b>：<b>ENDO-14 寫的是「TH/BSO and surgical staging」' +
        '（強制切附件並做手術分期）</b>，<b>而子宮肉瘤的 UTSARC-1 寫的是「TH with en bloc resection ' +
        '<u>±</u> BSO」（附件可做可不做、也沒有手術分期）。</b>' +
        '<b>走錯一頁，手術範圍就不一樣。</b>'],
      SRC + ' UN-1（p19）、ENDO-14（p33）、ENDO-A（p34）、ST-1（p42）—— ' +
      '三處來源互相佐證，已 render PNG 確認。',
      stagingReference());
  }

  /* ---------- 基因段 ---------- */
  function geneBlock() {
    var L = [];
    L.push(H('❗指引要你驗，但把方法寫在一頁不存在的紙上', 'UN-1，p19'));
    L.push('<b>UN-1 逐字：「Recommend molecular evaluation of tumor and evaluation for inherited ' +
      'cancer risk (<u>ENDO-A and UTSARC-A</u>)」</b>');
    L.push('❗<b>UTSARC-A 這一頁在這份文件裡不存在</b>（UN-1、UTSARC-1、UTSARC-3 三處指向它，' +
      '但 UTSARC 系列只有 1～5）。<b>對肉瘤病人而言，這一句等於斷鏈 —— ' +
      '指引叫你做分子檢測，卻沒有告訴你做什麼。</b>');
    L.push(H('指引<u>有</u>寫的只有這一句', 'UTSARC-1'));
    L.push('<b>「Consider ER/PR testing for LMS, ESS, and adenosarcoma」</b>');
    L.push('❗<b>驗 ER／PR 會改變兩件事</b>：' + SUB([
      '<b>要不要補切殘餘的輸卵管卵巢</b> —— 條文限「低惡性度 ESS、腺肉瘤、<b>或 ER 陽性腫瘤</b>」',
      '<b>晚期低惡性度 ESS 要不要加「± systemic endocrine therapy」</b>']) +
      '<b>所以這是這一頁唯一「驗了會改變門診動作」的檢測。</b>');
    L.push(H('院外實證：分子分型在子宮肉瘤是有意義的', ''));
    L.push(EV('<b>子宮內膜間質肉瘤有明確的融合基因分型</b>：' +
      '<b>低惡性度常見 JAZF1-SUZ12</b>；<b>高惡性度常見 YWHAE-NUTM2 與 BCOR 相關變異</b>。' +
      '<b>這會影響病理分類（進而決定走 UTSARC-2 還是 UTSARC-3），但指引本身沒有寫。</b>'));
    L.push(EV('<b>NTRK 融合的子宮肉瘤罕見但存在</b>，驗到可用 ' +
      '<b><span class="rx">larotrectinib</span></b>（健保 9.95 為泛癌別 NTRK 條文，' +
      '須事前審查、每次療程 12 週）。<b>這同樣不在這份指引裡。</b>'));
    L.push(H('❗還有一類要先排除', ''));
    L.push('<b>STUMP（smooth muscle tumor of uncertain malignant potential，惡性潛能未定的平滑肌腫瘤）' +
      '不是平滑肌肉瘤</b> —— <b>這份指引的 UN-1 肉瘤清單裡沒有 STUMP</b>，' +
      '<b>病理報告寫 STUMP 時不應直接套用 UTSARC-3 的處置。</b>');
    return '<div class="bc-gene-h">要不要驗基因？這一頁的答案是「指引叫你驗，但沒告訴你驗什麼」' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ---------- 藥卡 ---------- */
  var drugSig = '';
  function cardId(c) { return 'us-drug-' + c.replace(/ /g, '_'); }
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
    var box = el('us_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('usPath');
    if (root) {
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }
    var g = el('us_gene');
    if (g) { g.classList.toggle('hidden', !txt.trim()); if (txt.trim() && !g.innerHTML) g.innerHTML = geneBlock(); }
    var picked = [];
    US_DRUGS.forEach(function (d) {
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
      '<div class="bc-drugbox-note">❗<b>這裡列出的藥全部不在台大婦癌指引裡</b> —— ' +
      '全 68 頁檢索 doxorubicin／gemcitabine／trabectedin／pazopanib 等<b>各 0 次</b>，' +
      '處方原則寫在<b>不存在的 UTSARC-A 頁</b>。' +
      '<b>徽章已逐一標明這一點；本頁的處方為標明出處的院外實證。</b></div>' +
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

  /* ---------- render 與互動 ---------- */
  function render() {
    collapseAll();
    if (S.entry === 'primary') {
      show('us_n_pres', true);
      if (S.pres) renderPrimary();
    } else if (S.entry === 'incidental') {
      show('us_n_resid', true);
      if (S.resid) renderIncidental();
    } else if (S.entry === 'adj') {
      show('us_n_histo', true);
      if (S.histo) {
        if (S.histo === 'high') { show('us_n_stg3', true); if (S.stg3) renderAdj(); }
        else { show('us_n_stg2', true); if (S.stg2) renderAdj(); }
      }
    } else if (S.entry === 'carcinosarc') {
      renderCarcinosarc();
    }
    renderDrugCards();
  }
  var SEL_GROUPS = ['us_n1', 'us_n_pres', 'us_n_resid', 'us_n_histo', 'us_n_stg2', 'us_n_stg3'];
  var DOWNSTREAM = {
    entry: ['pres', 'resid', 'histo', 'stg2', 'stg3'],
    histo: ['stg2', 'stg3']
  };
  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function usPick(key, val, btn) {
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
    [['us_n1', 'entry'], ['us_n_pres', 'pres'], ['us_n_resid', 'resid'],
     ['us_n_histo', 'histo'], ['us_n_stg2', 'stg2'], ['us_n_stg3', 'stg3']].forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /usPick\('([a-z0-9_]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }
  function usReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }
  function initUtsarcPathway() { usReset(); }

  global.utsarcPathwayHTML = utsarcPathwayHTML;
  global.initUtsarcPathway = initUtsarcPathway;
  global.usPick = usPick;
  global.usReset = usReset;
})(window);
