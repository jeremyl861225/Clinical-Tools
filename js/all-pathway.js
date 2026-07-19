/* ============================================================
   急性淋巴性白血病（成人）治療互動決策流程
   Acute Lymphoblastic Leukemia (adult) Treatment Pathway
   ------------------------------------------------------------
   ※ 本模組不是台大診療指引。
   台大血癌診療指引版次 15 之化療章節僅涵蓋 AML；ALL 在該指引中只出現於
   AML-1 的分流出口，以及放射治療章節（Leukemia Radiation Therapy Guidelines
   v1.0, 2025/09）的顱部照射與全身照射適應症。
   因此本流程之「中樞神經預防之放射治療」段落確實引自台大放療章節並如此標示；
   其餘化療與標靶內容則依公開且可於 PubMed 查證之關鍵臨床試驗整編，
   每一項處置在建議區塊中都標出其試驗名稱，對應文獻見頁尾之 PubMed 連結。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var alSt = {
    phase: null,     // new | rr
    lineage: null,   // b | t
    ph: null,        // pos | neg
    fit: null,       // aya | adult | frail
    mrd: null,       // neg | pos
    rlineage: null,  // b | t（復發／難治）
    rph: null        // pos | neg（復發／難治之 B-ALL）
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="alPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function conn(id) { return '<div class="flow-connector" id="' + id + '">↓</div>'; }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rec(id, label) {
    return '<div class="flow-rec rec-idle" id="' + id + '"><div class="rec-label">' + label +
      '</div><div class="rec-title">請完成上方步驟</div></div>';
  }
  function hideStep(h, id) { return h.replace('id="' + id + '"', 'id="' + id + '" class="hidden"'); }

  /* ---------- 版面 HTML ---------- */
  function allPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><span class="tx-role" style="background:#a33a2f;">來源提醒</span> ' +
      '<b>本流程不是台大診療指引。</b>台大血癌診療指引版次 15 之化療章節僅涵蓋 AML，ALL 在該指引中只有 AML-1 的分流出口與放射治療章節的照射適應症。' +
      '下列化療與標靶處置依<b>公開且可於 PubMed 查證之關鍵臨床試驗</b>整編，每一項都標出其試驗名稱；' +
      '<b>唯獨「中樞神經預防之放射治療」段落引自台大放療章節</b>並如此標示。院內另有規定時以院內規定為準。</p>';
    h += '<div class="onc-path" id="alPath">';

    // Step 1 — 疾病狀態
    h += step('al_s1', '1', '疾病狀態',
      opt('phase', 'new', '初診 Newly diagnosed', '尚未接受過誘導治療') +
      opt('phase', 'rr', '復發或難治 R/R', '誘導失敗、或緩解後復發'),
      '<div class="note"><b>初診必做之分型檢查</b>：骨髓型態＋<b>免疫表型（flow cytometry）</b>判定 B／T 系列；<b>細胞遺傳學與 FISH</b>；<b>BCR::ABL1</b>（決定是否加 TKI，最關鍵的單一項目）；<i>KMT2A</i> 重組、<i>TP53</i>、低二倍體（hypodiploid）、iAMP21；有條件者做 <b>Ph-like（BCR::ABL1-like）</b>基因表現／融合基因篩檢；<b>腰椎穿刺＋腦脊髓液細胞學</b>判定 CNS1／CNS2／CNS3；HLA 分型（為可能的異體移植預作準備）。</div>');

    /* ===================== 初診 ===================== */
    h += '<div id="al_new" class="hidden">';

    h += conn('al_c2');
    h += step('al_s2', '2', '免疫表型（系列判定）',
      opt('lineage', 'b', 'B 細胞系 B-ALL', '約占成人 ALL 四分之三') +
      opt('lineage', 't', 'T 細胞系 T-ALL（含 ETP）', '常見縱膈腫塊、高白血球數'));

    h += connH('al_c3');
    h += step('al_s3', '3', '<b>BCR::ABL1</b>（費城染色體）狀態',
      opt('ph', 'pos', 'Ph 陽性 BCR::ABL1(+)', '約占成人 B-ALL 四分之一，且隨年齡上升 → 治療骨架加 TKI') +
      opt('ph', 'neg', 'Ph 陰性 BCR::ABL1(−)', '含 Ph-like：無 BCR::ABL1，但基因表現近似 Ph+，預後較差'));
    h = hideStep(h, 'al_s3');

    h += connH('al_c4');
    h += step('al_s4', '4', '年齡與治療強度耐受度',
      opt('fit', 'aya', '青少年與年輕成人 AYA（約 <40 歲）', '可耐受兒童型強化處方（pediatric-inspired）') +
      opt('fit', 'adult', '成人 · 可耐受強化化療', '一般成人劑量強度') +
      opt('fit', 'frail', '年長或不適合強化化療', '共病多、體能差，或病人拒絕強化治療'));
    h = hideStep(h, 'al_s4');

    h += connH('al_c5');
    h += step('al_s5', '5', '誘導後之微量殘存病灶（MRD）',
      opt('mrd', 'neg', 'MRD 陰性', '達到分子層次緩解') +
      opt('mrd', 'pos', 'MRD 陽性', '型態上緩解但 MRD 仍可測得 → 預後顯著較差'),
      '<div class="note"><b>MRD 是成人 ALL 最強的預後因子，其權重高於初診時的臨床風險分組</b>。以流式細胞術（靈敏度 10<sup>-4</sup>）、<i>IG/TR</i> 重排定量或次世代定序測定；Ph+ 者另以 <b>BCR::ABL1 定量</b>追蹤。判讀時點與閾值請依所在實驗室之標準作業。</div>');
    h = hideStep(h, 'al_s5');

    h += rec('al_new_rec', '建議處置 · 初診 ALL');
    h += '<div class="flow-fu hidden" id="al_new_fu"></div>';
    h += '</div>'; // al_new

    /* ===================== 復發／難治 ===================== */
    h += '<div id="al_rr" class="hidden">';
    h += conn('al_c10');
    h += step('al_s10', '2', '免疫表型（系列判定）',
      opt('rlineage', 'b', 'B 細胞系 B-ALL', '免疫治療與 CAR-T 選項最多') +
      opt('rlineage', 't', 'T 細胞系 T-ALL', '選項明顯較少'));

    h += connH('al_c11');
    h += step('al_s11', '3', '<b>BCR::ABL1</b> 狀態',
      opt('rph', 'pos', 'Ph 陽性', '需一併考慮換代 TKI 與 <i>ABL1</i> 激酶區突變檢測') +
      opt('rph', 'neg', 'Ph 陰性', ''));
    h = hideStep(h, 'al_s11');

    h += rec('al_rr_rec', '建議處置 · 復發／難治 ALL');
    h += '<div class="flow-fu hidden" id="al_rr_fu"></div>';
    h += '</div>'; // al_rr

    h += '<div class="flow-reset"><button class="btn-reset" onclick="alReset()">重置</button></div>';
    h += '</div>'; // alPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function alSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function alShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function alClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ulRec(id, cls, title, lines, note) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'flow-rec ' + cls;
    var label = el.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置 Recommendation';
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }

  /* ---------- 追蹤區塊 ---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h = '';
    if (type === 'induction') {
      h = '<div class="fu-label">誘導期間之評估 Follow-up</div><ul class="fu-list">' +
        '<li><b>骨髓與 MRD</b>：誘導結束時評估型態緩解與 <b>MRD</b>；MRD 之時點與閾值依所在實驗室標準。Ph+ 者同時追蹤 <b>BCR::ABL1</b> 定量。</li>' +
        '<li><b>中樞神經</b>：依療程規定給予鞘內化療；每次腰椎穿刺同時送腦脊髓液細胞學。</li>' +
        '<li><b>支持治療</b>：腫瘤溶解症候群預防（水化、allopurinol 或 rasburicase）；含 asparaginase 之處方須監測凝血功能、三酸甘油酯、胰臟炎與過敏反應。</li>' +
        '<li>誘導失敗 → 依「復發／難治」流程處理。</li>' +
        '</ul>';
    } else if (type === 'maintenance') {
      h = '<div class="fu-label">鞏固、維持與長期追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>維持治療</b>：成人 ALL 之維持治療一般持續至診斷後約 <b>2–3 年</b>；骨架為每日 <span class="drug">mercaptopurine</span> ＋ 每週 <span class="drug">methotrexate</span>，多數處方另加週期性 <span class="drug">vincristine</span> ＋ 類固醇。Ph 陽性者<b>全程併用 TKI</b>。</li>' +
        '<li><b>MRD 監測</b>：依處方規定之時點連續追蹤；<b>由陰轉陽即視為分子復發</b>，應提前處置而非等待型態上復發。</li>' +
        '<li><b>異體移植後</b>：追蹤嵌合體（chimerism）、MRD 與移植物抗宿主病；Ph 陽性者多數處方於移植後續用 TKI。</li>' +
        '<li><b>長期毒性</b>：類固醇相關骨壞死與代謝異常、蒽環類心毒性、接受過顱部照射者之神經認知與內分泌功能、生育功能保存諮詢。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>持續評估血球數、輸血需求、感染與出血風險；監測治療毒性與體能狀態。</li>' +
        '<li><b>CAR-T 之特有毒性</b>：細胞激素釋放症候群（CRS）與免疫效應細胞相關神經毒性（ICANS），須於具處理能力之單位執行並依規定分級處置。</li>' +
        '<li>疾病進展 → 換用未曾使用過之機轉、臨床試驗，或安寧緩和照護。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  function result(recId, fuId, cls, title, lines, note, fuType) {
    ulRec(recId, cls, title, lines, note);
    renderFollowup(fuId, fuType);
  }
  function idleRec(recId, fuId, title) {
    ulRec(recId, 'rec-idle', title, [], '');
    renderFollowup(fuId, null);
  }

  /* ---------- 共用內容 ---------- */

  /* 中樞神經預防——ALL 唯一確實引自台大指引的部分（放射治療章節） */
  function cnsProphylaxis() {
    return '<span class="rx-h">中樞神經預防 CNS prophylaxis</span>' +
      '<b>所有 ALL 病人都需要中樞神經預防</b>——ALL 未經預防時中樞神經復發率高，且一旦復發即極難挽救。' +
      '以<b>鞘內化療</b>（<span class="drug">methotrexate</span>、<span class="drug">cytarabine</span>，或加類固醇之三合一）貫穿誘導、鞏固與維持，' +
      '多數處方另以<b>全身性高劑量 <span class="drug">methotrexate</span></b>（及 T-ALL 之高劑量 <span class="drug">cytarabine</span>）加強中樞穿透。' +
      '<br><span class="tx-role" style="background:var(--accent);">台大放療章節</span> <b>顱部照射</b>之適應症為「高風險急性淋巴性白血病之 CNS 預防」與「復發／難治之 CNS 白血病」，' +
      '<b>兒童 ALL 之預防性顱部照射可省略</b>；劑量為<b>總劑量 12–24 Gy、每分次 1.5–2 Gy</b>，' +
      '與最後一劑 methotrexate 或 cytarabine <b>至少間隔 48–72 小時</b>；靶區（CTV）＝顱內容物，含篩板、中顱窩、眼球後三分之二，加 C1～C2 脊髓。' +
      '<b>明顯 CNS 白血病</b>之顱部總劑量為 <b>18–30 Gy</b>。（台大 Leukemia Radiation Therapy Guidelines v1.0, 2025/09）';
  }

  function hsctLine() {
    return '<span class="rx-h">異體造血幹細胞移植 allo-HSCT</span>' +
      '第一次完全緩解期是否移植，取決於<b>誘導後 MRD</b>與風險分組：<b>MRD 持續陽性</b>、' +
      '<b>誘導後未達緩解</b>、以及具高風險遺傳學者（<i>KMT2A</i> 重組、低二倍體、<i>TP53</i> 異常、複雜核型），' +
      '應在達到緩解後盡早轉介移植評估。初診時即應完成 <b>HLA 分型</b>。';
  }

  var trialNote =
    '本區塊之處置依公開臨床試驗整編，括號內為其試驗名稱，對應文獻與 PubMed 連結見頁尾「主要文獻」。' +
    '藥物之使用請依食藥署核准適應症與健保署給付規定；blinatumomab、inotuzumab、CAR-T 與新一代 TKI 之給付條件各異，用藥前請先確認。';

  /* ---------- 主渲染 ---------- */
  function alRender() {
    var s = alSt;

    alShow('al_new', s.phase === 'new');
    alShow('al_rr', s.phase === 'rr');

    // 初診：B 系列才問 Ph
    var isB = (s.phase === 'new' && s.lineage === 'b');
    alShow('al_c3', isB); alShow('al_s3', isB);
    // 系列已定且（T 系列 或 B 系列已答 Ph）才問體能
    var lineageDone = (s.phase === 'new' && (s.lineage === 't' || (s.lineage === 'b' && !!s.ph)));
    alShow('al_c4', lineageDone); alShow('al_s4', lineageDone);
    var showMrd = lineageDone && !!s.fit;
    alShow('al_c5', showMrd); alShow('al_s5', showMrd);

    // 復發／難治：B 系列才問 Ph
    var rIsB = (s.phase === 'rr' && s.rlineage === 'b');
    alShow('al_c11', rIsB); alShow('al_s11', rIsB);

    renderNew();
    renderRR();
  }

  function renderNew() {
    var s = alSt;
    if (s.phase !== 'new') return;
    var R = 'al_new_rec', F = 'al_new_fu';

    if (!s.lineage) { idleRec(R, F, '請選擇步驟 2（免疫表型）'); return; }
    if (s.lineage === 'b' && !s.ph) { idleRec(R, F, '請選擇步驟 3（BCR::ABL1 狀態）'); return; }
    if (!s.fit) { idleRec(R, F, '請選擇步驟 4（年齡與治療強度耐受度）'); return; }

    var lines = [];
    var title;

    /* ---- Ph 陽性 B-ALL ---- */
    if (s.lineage === 'b' && s.ph === 'pos') {
      title = 'Ph 陽性 B-ALL：TKI 為骨架的治療';
      lines.push('<span class="rx-h">核心原則</span><b>治療骨架一律含 TKI，且全程不中斷</b>——加入 TKI 是 Ph 陽性 ALL 預後改變最大的單一措施。');
      if (s.fit === 'frail') {
        lines.push('<span class="rx-h">誘導 · 年長或不適合強化化療</span>' +
          '<b>TKI ＋ 類固醇</b>（可不含細胞毒性化療）即可達到高比例緩解，是此族群的標準作法；' +
          '之後視耐受度加入減量化療。<span class="drug">imatinib</span>／<span class="drug">dasatinib</span>／<span class="drug">ponatinib</span> 擇一。');
        lines.push('<b>化療減量之無化療策略</b>：<span class="drug">dasatinib</span> ＋ <span class="drug">blinatumomab</span> 之誘導鞏固（<b>D-ALBA</b>）在年長與不適合強化化療者尤具價值，可在低毒性下取得高比例分子反應。');
      } else {
        lines.push('<span class="rx-h">誘導</span><b>TKI ＋ 多藥化療骨架</b>（hyper-CVAD 或兒童型強化處方）。' +
          'TKI 選擇：<span class="drug">imatinib</span>（<b>加入化療之原始證據</b>）｜<span class="drug">dasatinib</span>｜' +
          '<span class="drug">ponatinib</span>（<b>PhALLCON</b>：相較 imatinib 顯著提高 MRD 陰性率，第三代且涵蓋 T315I）。');
        lines.push('<b>化療減量之無化療策略</b>：<span class="drug">dasatinib</span> ＋ <span class="drug">blinatumomab</span>（<b>D-ALBA</b>）以極低毒性取得高比例分子反應，' +
          '為近年 Ph 陽性 ALL 最重要的方向改變。');
      }
      lines.push('<span class="rx-h">鞏固與維持</span>持續 TKI ＋ 鞏固化療；' +
        '維持期<b>全程併用 TKI</b>，一般持續至診斷後約 2–3 年。' + (s.mrd === 'pos' ? '' : ''));
      lines.push(cnsProphylaxis());
      lines.push(hsctLine() + '<br><b>Ph 陽性者另須注意</b>：TKI 反應不佳或復發時，應檢測 <i>ABL1</i> <b>激酶區突變</b>以指引換藥；' +
        '<b>T315I</b> 突變者僅 <span class="drug">ponatinib</span> 有效。');
    }

    /* ---- Ph 陰性 B-ALL ---- */
    else if (s.lineage === 'b' && s.ph === 'neg') {
      title = 'Ph 陰性 B-ALL：多藥化療為骨架';
      if (s.fit === 'aya') {
        lines.push('<span class="rx-h">誘導 · AYA（約 <40 歲）</span><b>兒童型強化處方（pediatric-inspired）</b>' +
          '（<b>CALGB 10403</b>）——同年齡層採用兒童處方之成效優於傳統成人處方，' +
          '特徵為高累積劑量之 <span class="drug">asparaginase</span>、<span class="drug">vincristine</span> 與類固醇，' +
          '相對減少烷化劑與蒽環類。<b>此族群應優先採用</b>。');
      } else if (s.fit === 'adult') {
        lines.push('<span class="rx-h">誘導 · 成人可耐受強化化療</span>' +
          '<span class="rx">hyper-CVAD</span>（<span class="drug">cyclophosphamide</span>＋<span class="drug">vincristine</span>＋' +
          '<span class="drug">doxorubicin</span>＋<span class="drug">dexamethasone</span>，與高劑量 <span class="drug">methotrexate</span>／' +
          '<span class="drug">cytarabine</span> 交替）或同等強度之多藥處方。');
      } else {
        lines.push('<span class="rx-h">誘導 · 年長或不適合強化化療</span>' +
          '減量之多藥化療；<b>以 <span class="drug">blinatumomab</span> 為基礎的低毒性策略</b>在此族群尤為重要，' +
          '可在避免強化化療毒性下取得緩解。體能極差者以支持治療與症狀控制為主。');
      }
      lines.push('<span class="rx-h">CD20 陽性者</span>加入 <span class="drug">rituximab</span>（<b>GRAALL-2005/R</b>）可改善結果。');
      lines.push('<span class="rx-h">鞏固之免疫治療</span>' +
        '<b>MRD 陰性者於鞏固階段加入 <span class="drug">blinatumomab</span></b>（<b>E1910</b>）可延長整體存活——' +
        '這是「MRD 陰性也仍能從免疫治療獲益」的關鍵證據，不要因為 MRD 已陰性就略過。');
      lines.push('<span class="rx-h">維持</span>每日 <span class="drug">mercaptopurine</span> ＋ 每週 <span class="drug">methotrexate</span>，' +
        '多數處方另加週期性 <span class="drug">vincristine</span> ＋ 類固醇，持續至診斷後約 2–3 年。');
      lines.push(cnsProphylaxis());
      lines.push(hsctLine() + '<br><b>Ph-like（BCR::ABL1-like）</b>：無 BCR::ABL1 但基因表現近似 Ph 陽性，' +
        '預後較差、MRD 清除較慢；帶 <i>ABL</i> 類融合基因者可考慮加用 TKI，帶 <i>CRLF2</i>／JAK-STAT 路徑異常者以臨床試驗為優先。');
    }

    /* ---- T-ALL ---- */
    else {
      title = 'T-ALL：以 asparaginase 為核心的強化化療';
      if (s.fit === 'aya') {
        lines.push('<span class="rx-h">誘導 · AYA</span><b>兒童型強化處方（pediatric-inspired）</b>（<b>CALGB 10403</b>），' +
          '核心為高累積劑量之 <span class="drug">asparaginase</span>；T-ALL 從此類處方獲益尤其明顯。');
      } else if (s.fit === 'adult') {
        lines.push('<span class="rx-h">誘導 · 成人可耐受強化化療</span>' +
          '<span class="rx">hyper-CVAD</span> 或同等強度之多藥處方，並盡可能納入 <span class="drug">asparaginase</span>。');
      } else {
        lines.push('<span class="rx-h">誘導 · 年長或不適合強化化療</span>減量多藥化療；' +
          '<b>T-ALL 缺少 B-ALL 那類的免疫治療與 CAR-T 選項</b>，此族群治療餘裕明顯較小，臨床試驗應及早考慮。');
      }
      lines.push('<span class="rx-h">縱膈腫塊與腫瘤溶解</span>T-ALL 常見<b>巨大縱膈腫塊</b>（注意上腔靜脈症候群與氣道壓迫）與<b>高白血球數</b>，' +
        '腫瘤溶解症候群風險高——需積極水化並使用 <span class="drug">rasburicase</span> 或 <span class="drug">allopurinol</span> 預防。');
      lines.push('<span class="rx-h">ETP-ALL（早期 T 前驅細胞型）</span>對傳統化療反應較差、MRD 清除較慢，' +
        '<b>應視為高風險並及早評估異體移植</b>。');
      lines.push(cnsProphylaxis());
      lines.push(hsctLine());
    }

    /* ---- MRD 尚未選擇 ---- */
    if (!s.mrd) {
      result(R, F, 'rec-elective', title, lines,
        trialNote + ' 誘導結束後請於步驟 5 填入 MRD 結果，以決定鞏固策略與是否移植。', 'induction');
      return;
    }

    /* ---- MRD 已知 ---- */
    if (s.mrd === 'neg') {
      lines.push('<span class="rx-h">誘導後 MRD 陰性 → 依原計畫鞏固與維持</span>' +
        '預後相對良好，多數 Ph 陰性且無高風險遺傳學者<b>可不必於第一次緩解期接受異體移植</b>，' +
        '改以完成鞏固與維持並持續 MRD 監測。' +
        (s.lineage === 'b' && s.ph === 'neg'
          ? '<b>但仍建議於鞏固階段加入 <span class="drug">blinatumomab</span></b>（<b>E1910</b>）——該試驗正是在 MRD 陰性族群顯示存活獲益。'
          : ''));
      result(R, F, 'rec-elective', title + '（MRD 陰性）', lines,
        trialNote + ' <b>MRD 陰性不等於治癒</b>：仍須完成全部療程並持續監測，由陰轉陽即視為分子復發。', 'maintenance');
      return;
    }

    lines.push('<span class="rx-h">誘導後 MRD 陽性 → 先清除 MRD，再移植</span>' +
      (s.lineage === 'b'
        ? '<b>B-ALL：以 <span class="drug">blinatumomab</span> 清除 MRD</b>（<b>BLAST</b>）——MRD 陽性者接受 blinatumomab 後可高比例轉為 MRD 陰性，' +
          '且轉陰者預後明顯改善。轉陰後<b>盡早銜接異體移植</b>。'
        : '<b>T-ALL：無對應之 MRD 清除用免疫治療</b>，應以更換化療處方或臨床試驗爭取更深緩解，並<b>盡早轉介異體移植</b>。') +
      (s.ph === 'pos' ? '<br><b>Ph 陽性且 BCR::ABL1 未如期下降</b>：檢測 <i>ABL1</i> 激酶區突變並據以換代 TKI；T315I 者用 <span class="drug">ponatinib</span>。' : ''));
    lines.push('<b>MRD 陽性是異體移植最明確的適應症之一</b>——不要等到型態上復發才轉介。');
    result(R, F, 'rec-nonop', title + '（MRD 陽性）', lines,
      trialNote + ' MRD 陽性者之處置目標是<b>先轉為 MRD 陰性再移植</b>，帶著 MRD 進入移植的結果明顯較差。', 'maintenance');
  }

  function renderRR() {
    var s = alSt;
    if (s.phase !== 'rr') return;
    var R = 'al_rr_rec', F = 'al_rr_fu';

    if (!s.rlineage) { idleRec(R, F, '請選擇步驟 2（免疫表型）'); return; }
    if (s.rlineage === 'b' && !s.rph) { idleRec(R, F, '請選擇步驟 3（BCR::ABL1 狀態）'); return; }

    var lines = [];
    if (s.rlineage === 'b') {
      lines.push('<span class="rx-h">免疫治療（優先於傳統化療）</span>' +
        '<b><span class="drug">Blinatumomab</span></b>（CD19×CD3 雙特異抗體，<b>TOWER</b>：優於標準化療）｜' +
        '<b><span class="drug">Inotuzumab ozogamicin</span></b>（抗 CD22 抗體藥物複合體，<b>INO-VATE</b>：緩解率顯著較高；' +
        '須注意<b>肝竇阻塞症候群／VOD</b>，尤其後續要移植者）。');
      lines.push('<span class="rx-h">CAR-T 細胞治療</span>' +
        '<b><span class="drug">Brexucabtagene autoleucel</span></b>（成人，<b>ZUMA-3</b>）｜' +
        '<b><span class="drug">Tisagenlecleucel</span></b>（兒童與年輕成人，<b>ELIANA</b>）。' +
        '須於具 CRS／ICANS 處理能力之單位執行。');
      if (s.rph === 'pos') {
        lines.push('<span class="rx-h">Ph 陽性者額外選項</span>' +
          '<b>先做 <i>ABL1</i> 激酶區突變檢測</b>再決定換代 TKI；' +
          '<b><span class="drug">ponatinib</span></b> 涵蓋 <b>T315I</b>（<b>PACE</b>；劑量最適化見 <b>OPTIC</b>）。' +
          'TKI 可與 blinatumomab 併用。');
      }
      lines.push('<span class="rx-h">化療與移植</span>再誘導化療（可用未曾使用過之機轉）；' +
        '<b>達到第二次緩解後應盡快銜接異體造血幹細胞移植</b>，' +
        '單靠挽救治療而不移植者長期存活有限。');
    } else {
      lines.push('<span class="rx-h">T-ALL 之挽救選項明顯較少</span>' +
        '<b><span class="drug">Nelarabine</span></b> 是 T 系列專屬的核苷類藥物，為復發／難治 T-ALL 的主要選項' +
        '（須注意<b>神經毒性</b>，含周邊神經病變與中樞神經症狀，且可能不可逆）。');
      lines.push('<span class="rx-h">其他</span>再誘導化療（含 <span class="drug">asparaginase</span> 之處方）；' +
        '<b>臨床試驗應及早考慮</b>——T-ALL 沒有 B-ALL 那樣成熟的 CD19／CD22 免疫治療與 CAR-T 選項。');
      lines.push('<span class="rx-h">移植</span><b>達到第二次緩解後盡快銜接異體造血幹細胞移植</b>，' +
        '這是 T-ALL 復發後最主要的治癒機會。');
    }
    lines.push('<span class="rx-h">中樞神經</span>復發時<b>務必重新評估中樞神經侵犯</b>（腰椎穿刺＋腦脊髓液細胞學）；' +
      '確認 CNS 侵犯者依台大放療章節之「CNS 復發治療選項」處理（單獨化療｜TBI ± CSI｜CSI｜TBI + 顱部加強）。');
    lines.push('<span class="rx-h">安寧緩和</span>多線失敗、體能極差或病人選擇不再接受積極治療者，應及早整合安寧緩和照護。');

    result(R, F, 'rec-urgent',
      s.rlineage === 'b'
        ? '復發／難治 B-ALL：免疫治療與 CAR-T 為主，銜接移植'
        : '復發／難治 T-ALL：nelarabine、臨床試驗，銜接移植',
      lines, trialNote, 'palliative');
  }

  /* ---------- 事件 ---------- */
  function alPick(key, val, btn) {
    alSel(btn);
    var s = alSt;
    if (key === 'phase') {
      s.phase = val;
      s.lineage = s.ph = s.fit = s.mrd = s.rlineage = s.rph = null;
      alClearSel(['al_s2', 'al_s3', 'al_s4', 'al_s5', 'al_s10', 'al_s11']);
    } else if (key === 'lineage') {
      s.lineage = val; s.ph = s.fit = s.mrd = null;
      alClearSel(['al_s3', 'al_s4', 'al_s5']);
    } else if (key === 'ph') {
      s.ph = val; s.fit = s.mrd = null;
      alClearSel(['al_s4', 'al_s5']);
    } else if (key === 'fit') {
      s.fit = val; s.mrd = null;
      alClearSel(['al_s5']);
    } else if (key === 'mrd') {
      s.mrd = val;
    } else if (key === 'rlineage') {
      s.rlineage = val; s.rph = null;
      alClearSel(['al_s11']);
    } else if (key === 'rph') {
      s.rph = val;
    }
    alRender();
  }

  function alReset() {
    for (var k in alSt) { if (alSt.hasOwnProperty(k)) alSt[k] = null; }
    var root = document.getElementById('alPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['al_new_fu', 'al_rr_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    alRender();
  }

  function initAllPathway() { alReset(); }

  // 匯出
  global.allPathwayHTML = allPathwayHTML;
  global.initAllPathway = initAllPathway;
  global.alPick = alPick;
  global.alReset = alReset;
})(window);
