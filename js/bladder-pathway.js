/* ============================================================
   膀胱癌治療互動決策流程 Bladder Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 膀胱癌診療指引
   版次 16（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000019
   指引本文標題 Clinical Guidelines of Bladder Cancer, NTUH-V1.2026
   流程圖見指引第 2 頁；放療細節（RT settings、膀胱保留 protocol、術後輔助放療）見第 3–8 頁。
   ※ 流程結構依第 2 頁決策圖判讀（非文字順序）。四個容易讀錯之處：
     ① <b>Staging 之後一次展開七格</b>（cTa LG／cTa HG／cT1 LG／cT1 HG／cT2T3T4a／cTis／cT4b），
        不是先分「非肌肉侵犯 vs 肌肉侵犯」再細分——cTis 與 cT4b 各自獨立成格。
     ② <b>cTa LG 的單劑 MMC 有 24 小時的時限</b>（single dose MMC within 24hr），
        且其後是「觀察<u>或</u>開始膀胱內化療」，不是一律接膀胱內治療。
     ③ 肌肉侵犯性（cT2T3T4a）之 <b>Definitive treatment 底下是兩條平行路</b>：
        根除性膀胱切除（術前可加新輔助）與三合一膀胱保留（trimodality）。
        <b>Trimodality 明訂條件：無水腎且無攝護腺侵犯</b>。
     ④ 誘導化療後之 <b>Treatment failure 以虛線折回 Radical cystectomy</b>——
        是回頭路而非往下走，讀成單向樹狀會漏掉這條。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var blSt = {
    stage: null,   // ta_lg | ta_hg | t1_lg | t1_hg | tis | mibc | t4b
    strat: null,   // rc | tmt                      （肌肉侵犯性之策略）
    post: null,    // pr_none | pr_neo_gcd | pr_neo_evp （根除性膀胱切除後）
    resp: null,    // r_fail | r_none              （誘導化療後之反應）
    bcg: null      // b_cr | b_fail               （cTis 對 BCG 之反應）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="blPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }
  function d(name) { return '<span class="drug">' + name + '</span>'; }

  /* ---------- 檢查與縮寫 ---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>初始評估與分期檢查 Workup ▸</summary>' +
      '<div class="dx-h">臨床表現與初始檢查</div>' +
      '<ul class="dx-list">' +
      '<li><b>血尿或刺激性排尿症狀</b>　Hematuria or irritable voiding</li>' +
      '<li><b>IVP（optional）、尿液細胞學 Cytology、膀胱鏡 Cystoscopy</b></li>' +
      '<li>病史：<b>吸菸、中草藥使用、末期腎病／腎移植、出生地、職業</b>；理學檢查' +
      '——與上泌尿道腫瘤同一組危險因子。</li>' +
      '<li>任一項檢查異常 → <b>經尿道膀胱腫瘤切除術 TURBT</b> → <b>Staging</b>。</li>' +
      '</ul>' +
      '<div class="dx-h">分期用主要檢查 Essential</div>' +
      '<ul class="dx-list">' +
      '<li><b>胸部影像 Chest imaging</b></li>' +
      '<li><b>腹部／骨盆腔 CT 或 MRI</b></li>' +
      '</ul>' +
      '<div class="dx-h">分期用次要檢查 Optional</div>' +
      '<ul class="dx-list">' +
      '<li>骨骼掃描 Bone scan</li>' +
      '<li><b>FDG-PET/CT</b>——限<b>經篩選之 ≥ cT2 病人</b>（in selected patient ≥ cT2）</li>' +
      '</ul>' +
      '<div class="note"><b>TURBT 檢體若無肌肉層即重做 TURBT</b>（repeat TURBT if no muscle in specimen）' +
      '——這是分期成立的前提，指引把它畫在 Staging 旁邊而非某一格底下。</div>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations（指引第 3 頁「註」）▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>LG／HG</b> — low grade／high grade 低／高惡性度</li>' +
      '<li><b>TURBT</b> — transurethral resection of bladder tumor 經尿道膀胱腫瘤切除術</li>' +
      '<li><b>BCG</b> — Bacillus Calmette-Guérin 卡介苗</li>' +
      '<li><b>C/T</b> — chemotherapy 化學治療　｜　<b>IVT</b> — intravesical therapy 膀胱內灌注治療</li>' +
      '<li><b>CCRT</b> — concurrent chemoradiotherapy 同步化放療</li>' +
      '<li><b>RC</b> — radical cystectomy 根除性膀胱切除　｜　<b>ADC</b> — antibody-drug conjugate 抗體藥物複合體</li>' +
      '<li><b>MMC</b> — mitomycin C　｜　<b>EV</b> — enfortumab vedotin-ejfv</li>' +
      '</ul></details>';
  }

  /* ---------- 放療細節（指引第 3–8 頁）---------- */
  function rtHtml() {
    return '<details class="kps-details"><summary>膀胱保留放療之技術細節（指引第 3–8 頁）▸</summary>' +
      rxLine('適應症 Indications', '第 4 頁', [
        '<b>肌肉侵犯性（≥T2）膀胱癌</b>，<b>意在保留膀胱</b>，或<b>醫療上無法手術者</b>。',
        '<b>降期之全身性治療可先於 CCRT</b>，依分期與治療醫師（腫瘤科／泌尿科）之判斷決定。'
      ]) +
      rxLine('劑量分次 Schema', '第 4 頁', [
        '<b>傳統分次</b>：全膀胱 ±骨盆腔淋巴結 <b>39.6–50.4 Gy</b>；' +
        '<b>加強照射至全膀胱或部分膀胱 60–66 Gy</b>；<b>40–45 Gy 時分段（split course）為選項</b>。',
        '<b>低分次 Hypofractionation</b>：全膀胱 ±膀胱外腫瘤 <b>52.5–55 Gy／4 週</b>。',
        '照射方式：<b>3DCRT、IMRT 或 VMAT；≥6 MV 光子</b>；每日一次、每週 5 次。',
        '影像導引：<b>Cone-beam CT、KV x-ray、EPID</b>。'
      ]) +
      rxLine('術後輔助放療 Adjuvant RT', '第 6–7 頁', [
        '<b>適應症：根除性膀胱切除後之 pT3／pT4、pN0–2</b> 尿路上皮膀胱癌可考慮。',
        '照野：<b>依病理判定之顯微殘存高風險區</b>，可含膀胱切除床與骨盆腔淋巴結。',
        '劑量：<b>45–50.4 Gy 傳統分次</b>；<b>切緣侵犯或淋巴結莢膜外侵犯處可加量至 54–60 Gy</b>。'
      ]) +
      rxLine('正常組織劑量限制', '第 7 頁', [
        '<b>直腸 V55 Gy &lt; 50%</b>',
        '<b>小腸 V45 &lt; 300 cc</b>',
        '<b>股骨頭最大劑量 ≤ 55 Gy</b>',
        'PTV = CTV + <b>0.5–1.5 cm</b>。質子治療為<b>選項</b>，細節依放腫部技術規範。'
      ]) +
      '</details>';
  }

  /* ---------- 追蹤 ---------- */
  function fuNmibcHtml() {
    return '<div class="fu-label">非肌肉侵犯性之追蹤 Surveillance（指引第 2 頁）</div>' +
      '<ul class="fu-list">' +
      '<li><b>膀胱鏡 Cystoscopy：Q3mo × 4 → Q6mo × 4 → Q1yr × 2</b>。</li>' +
      '<li><b>上泌尿道影像：腎臟超音波／IVP／CTU／MRU，每年一次</b>' +
      '——膀胱尿路上皮癌會在上泌尿道再長，追蹤不能只看膀胱。</li>' +
      '<li><b>尿液檢查與細胞學 Q3–6 個月</b>。</li>' +
      '<li><b>無復發 → 觀察</b>；<b>復發 → 折回 TURBT 重新分期</b>（指引以虛線畫回 TURBT）。</li>' +
      '<li><b>復發或遠處轉移 → 若為遠處轉移則給全身性治療</b>，並列 <b>Clinical trial</b>。</li>' +
      '</ul>';
  }
  function fuMibcHtml() {
    return '<div class="fu-label">膀胱保留完成 CCRT 後之追蹤（指引第 2 頁）</div>' +
      '<ul class="fu-list">' +
      '<li><b>膀胱鏡 Q3–6 個月 + CT 或 MRI</b>。</li>' +
      '<li><b>無復發 → 觀察</b>。</li>' +
      '<li><b>復發時依型態分三路</b>：' +
      '<b>非肌肉侵犯性復發 → TURBT + 膀胱內灌注治療</b>；' +
      '<b>肌肉侵犯性復發 → 根除性膀胱切除</b>；' +
      '<b>轉移 → 全身性治療／臨床試驗／必要時最佳支持療法</b>' +
      '（並註明<b>順鉑不適用者考慮免疫治療</b>）。</li>' +
      '<li>根除性膀胱切除者之追蹤與非肌肉侵犯性共用同一組結果格：' +
      '<b>無復發 → 觀察</b>；<b>復發或遠處轉移 → 遠處轉移者給全身性治療</b>，並列臨床試驗。</li>' +
      '</ul>';
  }

  /* ---------- 建議處置 ---------- */
  function recPrimary(s) {
    switch (s.stage) {
      case 'ta_lg':
        return { cls: 'rec-elective', title: 'cTa 低惡性度 cTa LG', detail:
          rxLine('原發治療', '', [
            '<b>單劑 <span class="drug">MMC</span>（mitomycin C）於 <u>24 小時內</u>灌注</b>' +
            '——<b>時限是指引原文</b>（single dose MMC within 24hr），非概略建議。',
            '<b>其後：觀察 <u>或</u> 開始膀胱內化療</b>（then observation or initiate intravesical C/T）。'
          ]),
          note: '指引第 2 頁。<b>這一格是唯一只需單劑灌注即可轉入追蹤的分期</b>；復發者以虛線折回 TURBT 重新分期。' };
      case 'ta_hg':
        return { cls: 'rec-elective', title: 'cTa 高惡性度 cTa HG', detail:
          rxLine('原發治療', '', [
            '<b>檢體無肌肉層即重做 TURBT</b>（repeat TURBT if no muscle in specimen）。',
            '<b>膀胱內化療，或膀胱內 BCG</b>（intravesical C/T, or intravesical BCG）。'
          ]),
          note: '指引第 2 頁。<b>此格之重做 TURBT 條件是「無肌肉層」</b>；cT1 兩格則一律寫 consider repeat TURBT（不附條件）。' };
      case 't1_lg':
        return { cls: 'rec-elective', title: 'cT1 低惡性度 cT1 LG', detail:
          rxLine('原發治療', '', [
            '<b>考慮重做 TURBT</b>（consider repeat TURBT）。',
            '<b>膀胱內 BCG 或膀胱內化療</b>。'
          ]),
          note: '指引第 2 頁。' };
      case 't1_hg':
        return { cls: 'rec-elective', title: 'cT1 高惡性度 cT1 HG', detail:
          rxLine('原發治療', '', [
            '<b>考慮重做 TURBT</b>。',
            '<b>膀胱內 BCG 或膀胱內化療</b>。',
            '<b>' + d('Pembrolizumab') + '／' + d('Nadofaragene firadenovec-vncg') + '／臨床試驗</b>' +
            '——<b>限 BCG 無反應者</b>（BCG-unresponsive）。',
            '<b>必要時可考慮根除性膀胱切除</b>（maybe consider RC）。'
          ]),
          note: '指引第 2 頁。<b>cT1 HG 是唯一在非肌肉侵犯性各格中同時列出全身性免疫治療、基因治療與根除性膀胱切除的一格</b>——反映其進展風險最高。' };
      case 'tis':
        return { cls: 'rec-elective', title: '原位癌 cTis', detail:
          rxLine('原發治療', '', [
            '<b>膀胱內 BCG——指引以中文明註「<u>應列為優先選項</u>」</b>。',
            '<b>或 膀胱內化療</b>（Or intravesical C/T）。'
          ]),
          note: '指引第 2 頁。<b>「應列為優先選項」是指引原文的中文加註</b>，是全圖少數直接指定優先順序之處，不可與其他並列選項等同視之。' };
      case 'mibc':
        if (s.strat === 'rc') {
          return { cls: 'rec-elective', title: '肌肉侵犯性 cT2／T3／T4a · 根除性膀胱切除', detail:
            rxLine('術前全身性治療 · 兩個並列選項', 'Definitive treatment 之手術路徑', [
              '<b>考慮新輔助全身性化療 + <span class="drug">durvalumab</span></b>' +
              '（consider neoadjuvant systemic chemotherapy + durvalumab）。',
              '<b>或 圍手術期 <span class="rx">Enfortumab vedotin-ejfv + pembrolizumab</span>' +
              '——<u>限順鉑不適用者</u></b>（if cisplatin ineligible）。'
            ]) +
            rxLine('手術', '', [ '<b>根除性膀胱切除 Radical cystectomy</b>' ]) +
            '<div class="rx-def"><b>術前給什麼，術後就接什麼</b>——術後處置請於下方第 3 步選擇術前實際給過的方案。</div>',
            note: '指引第 2 頁。<b>兩個新輔助選項的分水嶺是順鉑適用性</b>：可用順鉑者走化療+durvalumab，不可用者走 EV+pembrolizumab。' };
        }
        if (s.strat === 'tmt') {
          return { cls: 'rec-nonop', title: '肌肉侵犯性 cT2／T3／T4a · 三合一膀胱保留 Trimodality', detail:
            '<div class="rx-warn"><b>指引明訂之條件：無水腎（no hydronephrosis）且無攝護腺侵犯（no prostate invasion）</b>' +
            '——不符者此路不通。</div>' +
            rxLine('步驟一 · 誘導', '', [
              '<b>全身性化療 × 3 個週期</b>，其後 <b>TURBT（第 2 次膀胱鏡）＋ CT 或 MRI</b> 評估。'
            ]) +
            rxLine('步驟二 · 依評估結果分流', '', [
              '<b>無復發（No recurrence）→ CCRT</b>（放療期間做<b>第 3 次膀胱鏡</b>）→ <b>完成 CCRT</b> → 追蹤。',
              '<b>治療失敗（Treatment failure）→ 折回<u>根除性膀胱切除</u></b>——' +
              '指引以<b>虛線箭頭往回畫</b>，是回頭路，不是往下的新方塊。'
            ]) + rtHtml(),
            note: '指引第 2 頁＋第 3–8 頁放療章節。<b>膀胱保留不是「放療取代手術」而是三段式流程</b>：TURBT → 誘導化療 → CCRT，中間有兩次膀胱鏡當關卡。' };
        }
        return null;
      case 't4b':
        return { cls: 'rec-nonop', title: 'cT4b、任何 N 或 M', detail:
          rxLine('指引所列', '', [
            '<b>全身性治療</b>——指引列出<b>化療、免疫治療、抗體藥物複合體（ADCs）</b>' +
            '（chemotherapy, immunotherapy, immunotherapy and ADCs）。',
            '<b>和／或 緩解性放療 Palliative RT</b>。',
            '<b>臨床試驗 Clinical trial</b>。',
            '<b>必要時最佳支持療法 Best supportive care if needed</b>。'
          ]),
          note: '指引第 2 頁。<b>cT4b 與轉移性在指引上是同一格</b>——一旦侵犯骨盆壁／腹壁，即不再走局部根治路線。' };
    }
    return null;
  }

  /* 後續處置：根除性膀胱切除之術後、誘導化療後之反應、或 cTis 對 BCG 之反應 */
  function recNext(s) {
    /* 根除性膀胱切除之術後處置——左側紅／黑字註解方塊 */
    if (s.stage === 'mibc' && s.strat === 'rc') {
      if (s.post === 'pr_none') {
        return { cls: 'rec-elective', title: '術前未給任何全身性治療', detail:
          rxLine('依病理風險決定', '指引原文：Based on pathologic risk', [
            '<b>pT3–4a 或淋巴結陽性</b>者：<b>考慮輔助化療，或 ' + d('Nivolumab') + '</b>' +
            '（consider adjuvant C/T or Nivolumab if no neoadjuvant treatment given）。'
          ]),
          note: '指引第 2 頁左側註解方塊。<b>「if no neoadjuvant treatment given」是這一格成立的前提</b>——已給過新輔助者走另外兩格。' };
      }
      if (s.post === 'pr_neo_gcd') {
        return { cls: 'rec-elective', title: '術前已給 gemcitabine + cisplatin + durvalumab', detail:
          rxLine('術後', '', [
            '<b>術後應繼續使用 <span class="drug">durvalumab</span></b>' +
            '（then durvalumab should be used postoperatively）。'
          ]) +
          rxLine('若術前只給了化療（未含 durvalumab）', '', [
            '<b>考慮輔助 ' + d('Nivolumab') + ' 或放療</b>（consider adjuvant Nivolumab or RT if neoadjuvant C/T given）。',
            '<b>順鉑不適用者考慮免疫治療</b>（consider immunotherapy if cisplatin ineligible）。'
          ]),
          note: '指引第 2 頁左側註解方塊。<b>指引用字為 should（應），不是 consider</b>——圍手術期免疫治療的前後段是同一療程，不可只給前半。' };
      }
      if (s.post === 'pr_neo_evp') {
        return { cls: 'rec-elective', title: '術前已給 enfortumab vedotin + pembrolizumab', detail:
          rxLine('術後', '', [
            '<b>術後應繼續使用 <span class="rx">Enfortumab vedotin-ejfv + pembrolizumab</span></b>' +
            '（then Enfortumab vedotin + Pembrolizumab should be used postoperatively）。'
          ]),
          note: '指引第 2 頁左側註解方塊（紅字，本次改版標示）。<b>同樣是 should</b>——圍手術期方案前後對應。' };
      }
      return null;
    }

    /* 誘導化療後之反應（膀胱保留） */
    if (s.stage === 'mibc' && s.strat === 'tmt') {
      if (s.resp === 'r_none') {
        return { cls: 'rec-nonop', title: '誘導化療後：無復發 No recurrence', detail:
          rxLine('續行', '', [
            '<b>CCRT</b>——<b>放療期間安排第 3 次膀胱鏡</b>（3rd cystoscopy during R/T）。',
            '<b>完成 CCRT</b> → 進入追蹤（膀胱鏡 Q3–6 個月 + CT 或 MRI）。'
          ]),
          note: '指引第 2 頁。' };
      }
      if (s.resp === 'r_fail') {
        return { cls: 'rec-elective', title: '誘導化療後：治療失敗 Treatment failure', detail:
          rxLine('處置', '', [
            '<b>折回根除性膀胱切除 Radical cystectomy</b>——指引以<b>虛線箭頭向上回折</b>。'
          ]) +
          '<div class="rx-def"><b>此後之術後處置同「根除性膀胱切除」路徑</b>：依病理風險（pT3-4a 或淋巴結陽性）考慮輔助治療。</div>',
          note: '指引第 2 頁。<b>膀胱保留失敗有明確的救援手術出口</b>，這是三合一療法能被接受的前提。' };
      }
      return null;
    }

    /* cTis 對 BCG 之反應 */
    if (s.stage === 'tis') {
      if (s.bcg === 'b_cr') {
        return { cls: 'rec-elective', title: '完全反應 Complete response', detail:
          rxLine('維持與追蹤', '', [
            '<b>膀胱鏡 + 膀胱內灌注治療（IVT）：Q3mo × 4 → Q6mo × 4</b>。',
            '<b>其後膀胱鏡間隔逐步拉長至每年一次</b>（cystoscopy at increasing intervals to yearly）。'
          ]),
          note: '指引第 2 頁。<b>完全反應後仍持續灌注治療</b>——這一格的膀胱鏡是與 IVT 綁在一起的，不是單純追蹤。' };
      }
      if (s.bcg === 'b_fail') {
        return { cls: 'rec-elective', title: 'BCG 無反應或無法耐受 BCG unresponsive or intolerant', detail:
          rxLine('指引所列三個選項', '', [
            '<b>根除性膀胱切除 Radical cystectomy</b>',
            '<b>或 ' + d('Pembrolizumab') + '／' + d('Nadofaragene firadenovec-vncg') + '</b>' +
            '——<b>限經篩選之病人</b>（in select patients）。',
            '<b>或 膀胱內化療</b>（紅字，本次改版標示）。'
          ]),
          note: '指引第 2 頁。<b>「無反應」與「無法耐受」在指引裡合成同一格</b>，出口相同。' };
      }
      return null;
    }
    return null;
  }

  /* ---------- 版面 ---------- */
  function bladderPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院膀胱癌診療指引 版次 16（2026/06/16，文件編號 50710-2-000019）</b>' +
      '之互動決策流程（指引本文 NTUH-V1.2026，第 2 頁決策圖；放療細節見第 3–8 頁）。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="blPath">';

    h += dxHtml();

    h += step('bl_s1', '1', 'TURBT 後之臨床分期與分級？',
      opt('stage', 'ta_lg', 'cTa LG', '低惡性度非侵襲性乳突癌') +
      opt('stage', 'ta_hg', 'cTa HG', '高惡性度') +
      opt('stage', 't1_lg', 'cT1 LG', '侵犯上皮下結締組織') +
      opt('stage', 't1_hg', 'cT1 HG', '進展風險最高之非肌肉侵犯性') +
      opt('stage', 'tis', 'cTis', '原位癌') +
      opt('stage', 'mibc', 'cT2 / T3 / T4a', '肌肉侵犯性 → Definitive treatment') +
      opt('stage', 't4b', 'cT4b、任何 N 或 M', '不可根治'),
      '<div class="note">指引在 <b>Staging</b> 之後<b>一次展開七格</b>，cTis 與 cT4b 各自獨立——' +
      '不是先分「非肌肉侵犯 vs 肌肉侵犯」再細分。<b>檢體無肌肉層者須先重做 TURBT</b>，否則分期不成立。</div>');

    h += connH('bl_c1');
    h += step('bl_s2', '2', '肌肉侵犯性之治療策略？',
      opt('strat', 'rc', '根除性膀胱切除 Radical cystectomy', '術前可加新輔助治療') +
      opt('strat', 'tmt', '三合一膀胱保留 Trimodality', '限無水腎且無攝護腺侵犯'),
      '<div class="note">兩者是 <b>Definitive treatment</b> 底下的<b>平行選項</b>；' +
      'trimodality 之條件為指引明訂，不符者只剩手術一條路。</div>');

    h += step('bl_s2t', '2', 'cTis 對膀胱內治療之反應？',
      opt('bcg', 'b_cr', '完全反應 Complete response') +
      opt('bcg', 'b_fail', 'BCG 無反應或無法耐受'),
      '<div class="note">尚未評估反應者<b>可略過本步</b>。</div>');

    h += '<div class="flow-rec rec-idle" id="bl_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';

    h += connH('bl_c2');
    h += step('bl_s3', '3', '根除性膀胱切除：術前實際給過什麼？',
      opt('post', 'pr_none', '未給任何全身性治療', '依病理風險決定輔助治療') +
      opt('post', 'pr_neo_gcd', 'Gem/Cis + durvalumab') +
      opt('post', 'pr_neo_evp', 'EV + pembrolizumab', '順鉑不適用者'),
      '<div class="note"><b>術前給什麼決定術後接什麼</b>——指引把這三種情境寫成左側三段註解，而非流程圖上的方塊。</div>');

    h += step('bl_s3t', '3', '誘導化療 × 3 後之評估結果？',
      opt('resp', 'r_none', '無復發 No recurrence', '→ 續行 CCRT') +
      opt('resp', 'r_fail', '治療失敗 Treatment failure', '→ 折回根除性膀胱切除'),
      '<div class="note">評估工具為 <b>TURBT（第 2 次膀胱鏡）＋ CT 或 MRI</b>。</div>');

    h += '<div class="flow-rec rec-idle hidden" id="bl_rec2"><div class="rec-label">後續處置 Next step</div>' +
      '<div class="rec-title">請選擇上方選項</div></div>';
    h += '<div class="flow-fu hidden" id="bl_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="blReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function blRender() {
    var s = blSt;
    var mibc = s.stage === 'mibc';
    var tis = s.stage === 'tis';

    show('bl_c1', mibc || tis);
    show('bl_s2', mibc);
    show('bl_s2t', tis);

    var rec = document.getElementById('bl_rec');
    var rec2 = document.getElementById('bl_rec2');
    var fu = document.getElementById('bl_fu');
    if (!rec) return;

    var done = !!s.stage && (!mibc || !!s.strat);
    var r = done ? recPrimary(s) : null;
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      show('bl_c2', false); show('bl_s3', false); show('bl_s3t', false); show('bl_rec2', false);
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    var showRc = mibc && s.strat === 'rc';
    var showTmt = mibc && s.strat === 'tmt';
    show('bl_c2', showRc || showTmt || tis);
    show('bl_s3', showRc);
    show('bl_s3t', showTmt);

    var a = recNext(s);
    if (rec2) {
      if (a) {
        rec2.className = 'flow-rec ' + a.cls;
        rec2.innerHTML = '<div class="rec-label">後續處置 Next step</div>' +
          '<div class="rec-title">' + a.title + '</div>' +
          '<div class="rec-detail">' + a.detail + '</div>' +
          (a.note ? '<div class="rec-note">' + a.note + '</div>' : '');
      } else {
        rec2.className = 'flow-rec rec-idle hidden';
        rec2.innerHTML = '<div class="rec-label">後續處置 Next step</div>' +
          '<div class="rec-title">請選擇上方選項</div>';
      }
    }

    if (fu) {
      fu.innerHTML = mibc ? fuMibcHtml() : fuNmibcHtml();
      fu.classList.remove('hidden');
    }
  }

  function blClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function blPick(key, val, btn) {
    var s = blSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'stage') {
      s.stage = val; s.strat = s.post = s.resp = s.bcg = null;
      blClearSel(['bl_s2', 'bl_s2t', 'bl_s3', 'bl_s3t']);
    } else if (key === 'strat') {
      s.strat = val; s.post = s.resp = null;
      blClearSel(['bl_s3', 'bl_s3t']);
    } else if (key === 'post') {
      s.post = val;
    } else if (key === 'resp') {
      s.resp = val;
    } else if (key === 'bcg') {
      s.bcg = val;
    }
    blRender();
  }

  function blReset() {
    for (var k in blSt) { if (blSt.hasOwnProperty(k)) blSt[k] = null; }
    var root = document.getElementById('blPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('bl_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    var rec2 = document.getElementById('bl_rec2');
    if (rec2) { rec2.classList.add('hidden'); }
    blRender();
  }

  function initBladderPathway() { blReset(); }

  global.bladderPathwayHTML = bladderPathwayHTML;
  global.initBladderPathway = initBladderPathway;
  global.blPick = blPick;
  global.blReset = blReset;
})(window);
