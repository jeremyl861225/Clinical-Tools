/* ============================================================
   結腸癌治療互動決策流程 Colon Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引
   版次 21（2026/06/16 癌症醫療委員會修訂通過），COL-1 ～ COL-18
   ※ 本模組僅涵蓋「結腸 Colon」；直腸（rectal）專屬之新輔助放化療、
     TME、環周切緣、proctoscopy 追蹤等內容不在此流程內。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var ccSt = {
    entry: null,    // polyp | resect | meta
    pfind: null,    // fav | unfav          （COL-1 病理特徵）
    pmorph: null,   // ped | ses            （COL-1 息肉形態）
    pres: null,     // nonobs | obs | t4b | unres （COL-2 可切除性／阻塞）
    tn: null,       // tis_n0 … t4_n2       （COL-3 術後病理 T×N）
    s2: null,       // s2_msi | s2_low | s2_high （COL-3(1) 第 II 期分層）
    msite: null,    // liverlung | periton | other （COL-4）
    mres: null,     // m_res | m_unres      （COL-4 肝／肺轉移可切除性）
    rentry: null,   // cea | metach         （COL-9 復發之呈現）
    rres: null,     // r_res | r_unres      （COL-9 異時性轉移之可切除性）
    rprior: null    // p_yes | p_no         （COL-9 12 個月內曾用 FOLFOX/CAPEOX？）
  };

  /* ---------- T×N → 輔助治療分組（COL-3(1)／COL-3(2)）----------
     g-none ：Tis; T1,N0,M0; T2,N0,M0                → 輔助治療 None
     g-ii   ：T3,N0,M0 / T4,N0,M0                    → 第 II 期，需依 MMR／高風險特徵再分層
     g-low  ：T1–3, N1                               → 低風險第 III 期
     g-high ：T4,N1–2；任何 T, N2                     → 高風險第 III 期
     同組＝同一建議處置＝同一顏色                                        */
  var TN_GROUP = {
    tis_n0: 'g-none', t1_n0: 'g-none', t2_n0: 'g-none',
    t3_n0: 'g-ii', t4_n0: 'g-ii',
    t1_n1: 'g-low', t2_n1: 'g-low', t3_n1: 'g-low',
    t4_n1: 'g-high',
    t1_n2: 'g-high', t2_n2: 'g-high', t3_n2: 'g-high', t4_n2: 'g-high'
  };
  var TN_ROWS = ['Tis', 'T1', 'T2', 'T3', 'T4'];
  var TN_COLS = ['N0', 'N1', 'N2'];

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ccPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- T×N 病理分期格（COL-3）---------- */
  function tnGridHtml() {
    var h = '<div class="tn-wrap"><div class="tn-cap">術後病理分期 pathologic stage（M0）· 點選格子</div>';
    h += '<div class="tn-grid" id="cc_tngrid">';
    h += '<div class="tn-corner">pT ＼ pN</div>';
    TN_COLS.forEach(function (n) { h += '<div class="tn-ch">' + n + '</div>'; });
    TN_ROWS.forEach(function (t) {
      h += '<div class="tn-rh">' + t + '</div>';
      TN_COLS.forEach(function (n) {
        var key = t.toLowerCase() + '_' + n.toLowerCase();
        var g = TN_GROUP[key];
        if (!g) { h += '<div class="tn-na" title="Tis 依定義為 N0">—</div>'; return; }
        h += '<button class="tn-cell ' + g + '" id="cc_tn_' + key + '" ' +
          'onclick="ccPick(\'tn\',\'' + key + '\',this)">' + t + n + '</button>';
      });
    });
    h += '</div>';
    h += '<div class="tn-legend">' +
      lg('g-none', '輔助治療 None（不需輔助化療）') +
      lg('g-ii', '第 II 期 → 依 MMR／高風險特徵再分層') +
      lg('g-low', '低風險第 III 期 Low risk stage III') +
      lg('g-high', '高風險第 III 期 High risk stage III') +
      '</div>';
    h += '<div class="hrf">' +
      '<div class="hrf-h">第 II 期高風險特徵（COL-3(1)）　<span class="hrf-sub">任一項即屬高風險</span></div>' +
      '<div class="hrf-items">' +
        ['Grade 3–4', '淋巴血管侵犯', '腸阻塞', '取樣淋巴結 &lt; 12 顆',
         '神經周圍侵犯', '局部穿孔', '切緣接近／無法確定／陽性']
          .map(function (x) { return '<span class="hrf-b">' + x + '</span>'; }).join('') +
      '</div></div>';
    h += '<div class="note"><b>無禁忌症者應於術後 6 週內開始輔助化療。</b>' +
      'Tis 依定義為 N0，故 Tis／N1、Tis／N2 不適用。<br>' +
      '<b>⚠ 本格適用於「未接受過新輔助治療」者。</b>COL-3(1)(2) 的分層全部標示為 <b>PATHOLOGIC STAGE</b>，' +
      '其高風險特徵與 IDEA 的 3 vs 6 個月結論都是在未經新輔助治療的族群推導出來的。' +
      '接受過新輔助化療者其檢體為 <b>ypT／ypN</b>，<b>輔助治療決策無 COL-3 之直接依據，須經多專科團隊個案討論</b>。</div>';
    h += '</div>';
    return h;
  }
  function lg(cls, txt) {
    return '<div class="tn-lg"><span class="tn-sw ' + cls + '"></span><span>' + txt + '</span></div>';
  }

  /* ---------- 版面 HTML ---------- */
  function colonPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院大腸直腸癌診療指引 版次 21（2026/06/16）</b>（NTUH，COL-1～COL-18）之互動決策流程，<b>僅取結腸（colon）適用者</b>；直腸癌之新輔助放化療與 TME 不在此流程，請於上方<b>部位</b>切換為「直腸 Rectum」。逐步點選以取得對應建議處置、藥物療程與追蹤方式。<b>含復發之處置（COL-9）。</b></p>';
    h += '<div class="onc-path" id="ccPath">';

    // Step 1 — 臨床表現
    h += step('cc_s1', '1', '臨床表現（初始情境）',
      opt('entry', 'polyp', '惡性息肉 Malignant polyp', '有柄或無柄息肉（腺瘤）內含侵襲癌（COL-1）') +
      opt('entry', 'resect', '結腸癌 · 非轉移', 'Colon cancer appropriate for resection（non-metastatic，COL-2）') +
      opt('entry', 'meta', '疑似或證實遠處轉移', 'Suspected or proven metastatic adenocarcinoma（any T, any N, M1，COL-4）') +
      opt('entry', 'recur', '復發 Recurrence', '治療後追蹤發現復發（血清 CEA 升高或已證實之異時性轉移，COL-9）'),
      '<div class="note"><b>小腸與闌尾腺癌也適用本頁的全身性化療</b>（COL-1 註 a 原文：' +
      '「Small bowel and appendiceal adenocarcinoma may be treated with systemic chemotherapy according to the NTUH Guidelines for Colon Cancer」）—— ' +
      '局部處置與分期不適用，但化療處方可依本指引辦理。</div>');

    /* ===================== A. 惡性息肉（COL-1）===================== */
    h += '<div id="cc_polyp" class="hidden">';
    h += conn('cc_c2p');
    h += step('cc_s2p', '2', '病理檢視結果（COL-1／COL-1-1）',
      opt('pfind', 'm_pos', '<b>切緣陽性</b>，或標本破碎／切緣無法評估',
        'Margin positive · fragmented specimen · margin cannot be assessed → 追加手術') +
      opt('pfind', 'fav', '<b>切緣陰性</b>，且四項條件<b>全部</b>良好',
        '侵犯深度 Haggitt ≤3 或 SM ≤1mm；G1–G2；Ly(−) 且 V(−)；budding G1') +
      opt('pfind', 'unfav', '<b>切緣陰性</b>，但四項中<b>任一</b>不良',
        'Haggitt 4 或 SM >1mm；G3／G4；Ly 或 V(+)；budding G2/3 → 個案討論'),
      '<div class="crit-box">' +
        '<div class="crit-pair">' +
          '<div class="crit crit-fav">' +
            '<div class="crit-h">FAVORABLE　<span class="crit-zh">組織學特徵良好</span></div>' +
            '<ul><li>Grade 1 或 2</li><li>無血管淋巴管侵犯</li><li>切緣陰性</li></ul>' +
          '</div>' +
          '<div class="crit crit-unfav">' +
            '<div class="crit-h">UNFAVORABLE　<span class="crit-zh">組織學特徵不良</span></div>' +
            '<ul><li>Grade 3 或 4</li><li>血管淋巴管侵犯</li><li>切緣陽性</li></ul>' +
          '</div>' +
        '</div>' +
        '<div class="crit crit-hr">' +
          '<div class="crit-h">HIGH RISK FEATURES（COL-1）　<span class="crit-zh">任一項即屬高風險</span></div>' +
          '<ol>' +
            '<li>Haggitt level 4</li>' +
            '<li>切緣陽性或 &lt; 1mm</li>' +
            '<li>分塊切除（piecemeal removal）</li>' +
            '<li>組織分級為 poorly differentiated 或 undifferentiated</li>' +
            '<li>黏膜下侵犯 &gt; 1mm</li>' +
            '<li>Tumor budding &gt; G2/G3</li>' +
            '<li>淋巴血管侵犯陽性</li>' +
            '<li>神經周圍侵犯</li>' +
          '</ol>' +
        '</div>' +
      '</div>');

    h += connH('cc_c3p');
    h += step('cc_s3p', '3', '息肉形態（COL-1 MANAGEMENT）',
      opt('pmorph', 'ped', '有柄息肉 Pedunculated polyp', '含侵襲癌 with invasive cancer') +
      opt('pmorph', 'ses', '無柄息肉 Sessile polyp', '含侵襲癌 with invasive cancer'));
    h = h.replace('id="cc_s3p"', 'id="cc_s3p" class="hidden"');

    h += rec('cc_polyp_rec', '建議處置 · 惡性息肉 Malignant polyp');
    h += '<div class="flow-fu hidden" id="cc_polyp_fu"></div>';
    h += '</div>'; // cc_polyp

    /* ===================== B. 非轉移可切除（COL-2 → COL-3）===================== */
    h += '<div id="cc_resect" class="hidden">';
    h += conn('cc_c2r');
    h += step('cc_s2r', '2', '檢查結果：可切除性與阻塞與否（COL-2 FINDINGS）',
      opt('pres', 'nonobs', '可切除、無阻塞', 'Resectable, non-obstructing') +
      opt('pres', 'obs', '可切除、有阻塞', 'Resectable, obstructing') +
      opt('pres', 't4b', '臨床 T4b', 'Clinical T4b（侵犯／黏連鄰近器官或構造）') +
      opt('pres', 'unres', '局部無法切除 或 無法耐受手術', 'Locally unresectable or medically inoperable'),
      '<div class="cbx"><div class="cbx-h">治療前應完成之檢查（COL-2）　<span class="cbx-sub">★ 為關鍵檢查</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb"><span class="cb-k">★</span>大腸鏡</span>' +
        '<span class="cb"><span class="cb-k">★</span>胸部／腹部／骨盆 CT（IV 或口服顯影）</span>' +
        '<span class="cb">切片</span>' +
        '<span class="cb">MMR／MSI</span>' +
        '<span class="cb">病理檢視</span>' +
        '<span class="cb">CBC／BCS</span>' +
        '<span class="cb">CEA</span>' +
        '<span class="cb">腹部／骨盆 MRI（視需要）</span>' +
        '<span class="cb">造口定位與衛教</span>' +
      '</div></div>' +
      '<div class="note"><b>PET-CT 非例行建議</b>。適當病人考慮生育風險討論。所有結腸癌病人皆應進行家族史諮詢。</div>');

    // ── 先給「初步建議處置」（手術），再進入 T×N 分期步驟（COL-3）
    h += rec('cc_resect_rec', '建議處置 · 非轉移性結腸癌（COL-2 PRIMARY TREATMENT）');
    h += '<div class="flow-fu hidden" id="cc_resect_fu"></div>';

    h += connH('cc_c3r');
    h += step('cc_s3r', '3', '術後病理分期 → 輔助治療（COL-3）', '', tnGridHtml());
    h = h.replace('id="cc_s3r"', 'id="cc_s3r" class="hidden"');

    // 第 II 期（T3,N0,M0）分層
    h += connH('cc_c4r3');
    h += step('cc_s4r3', '4', 'T3, N0, M0 → 依 MMR 狀態與高風險特徵分層（COL-3(1)）',
      opt('s2', 's2_msi', 'MSI-H 或 dMMR', '錯配修復缺失／微衛星高度不穩定') +
      opt('s2', 's2_low', 'MSS／pMMR 且<b>無</b>高風險特徵', 'MSS/pMMR and no high risk features') +
      opt('s2', 's2_high', 'MSS／pMMR 且<b>具</b>全身性復發高風險特徵', 'High risk for systemic recurrence'));
    h = h.replace('id="cc_s4r3"', 'id="cc_s4r3" class="hidden"');

    // 第 II 期（T4,N0,M0）分層
    h += connH('cc_c4r4');
    h += step('cc_s4r4', '4', 'T4, N0, M0 → 依 MMR 狀態分層（COL-3(1)）',
      opt('s2', 's2_msi', 'MSI-H 或 dMMR', 'T3–4, N0, M0（MSI-H or dMMR）→ 輔助治療 None') +
      opt('s2', 's2_high', 'MSS／pMMR', 'T4, N0, M0（MSS/pMMR）→ 輔助化療'),
      '<div class="note">COL-3(1) 之 <b>T4, N0, M0（MSS/pMMR）</b>與「T3, N0, M0 具全身性復發高風險」同列，' +
      '故 T4／MSS 不論有無其他高風險特徵，均進入輔助化療組。</div>');
    h = h.replace('id="cc_s4r4"', 'id="cc_s4r4" class="hidden"');

    // ── 點選 T×N 格子後才出現的輔助治療建議 + 追蹤與監測
    h += '<div class="flow-rec rec-idle hidden" id="cc_adj_rec"><div class="rec-label">建議處置 · 輔助治療 Adjuvant therapy（COL-3）</div><div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="cc_adj_fu"></div>';
    h += '</div>'; // cc_resect

    /* ===================== C. 轉移性（COL-4 → COL-5/6/7/8）===================== */
    h += '<div id="cc_meta" class="hidden">';
    h += conn('cc_c2m');
    h += step('cc_s2m', '2', '轉移型態（COL-4 FINDINGS）',
      opt('msite', 'liverlung', '同時性「僅」肝轉移 或「僅」肺轉移', 'Synchronous liver only or lung only metastases') +
      opt('msite', 'periton', '同時性腹腔／腹膜轉移', 'Synchronous abdominal / peritoneal metastases（COL-5）') +
      opt('msite', 'other', '其他部位、同時性不可切除轉移', 'Synchronous unresectable metastases of other sites（COL-8）'),
      '<div class="cbx"><div class="cbx-h">轉移性檢查（COL-4）　<span class="cbx-sub">★ 為關鍵檢查</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb"><span class="cb-k">★</span>大腸鏡</span>' +
        '<span class="cb"><span class="cb-k">★</span>胸部／腹部／骨盆 CT</span>' +
        '<span class="cb">CBC／BCS</span>' +
        '<span class="cb">CEA</span>' +
        '<span class="cb">RAS 與 BRAF ± HER-2 amplification（健保未給付）</span>' +
        '<span class="cb">MMR／MSI（若先前未做）</span>' +
        '<span class="cb">切片（視需要）</span>' +
      '</div></div>' +
      '<div class="note">腫瘤基因可單獨檢測或併入 NGS。潛在可手術治癒之 M1 選擇性病人考慮 <b>PET-CT</b>（顱底至大腿中段）；' +
      '潛在可切除肝轉移考慮<b>肝臟 MRI</b>；<b>多專科團隊評估，須含具肝膽及肺轉移切除經驗之外科醫師</b>。</div>');

    h += connH('cc_c3m');
    h += step('cc_s3m', '3', '肝／肺轉移之可切除性（COL-4 → COL-6／COL-7）',
      opt('mres', 'm_res', '可切除 Resectable', '轉移病灶可完整切除（COL-6）') +
      opt('mres', 'm_unres', '不可切除 Unresectable', '潛在可轉換（convertible）或不可轉換（unconvertible）（COL-7）'));
    h = h.replace('id="cc_s3m"', 'id="cc_s3m" class="hidden"');

    h += rec('cc_meta_rec', '建議處置 · 轉移性 Metastatic');
    h += '<div class="flow-fu hidden" id="cc_meta_fu"></div>';
    h += '</div>'; // cc_meta

    /* ===================== D. 復發（COL-9）===================== */
    h += '<div id="cc_recur" class="hidden">';
    h += conn('cc_c2rec');
    h += step('cc_s2rec', '2', '復發之呈現（COL-9 RECURRENCE / WORKUP）',
      opt('rentry', 'cea', '血清 CEA 連續升高', 'Serial CEA elevation（影像尚未證實病灶）') +
      opt('rentry', 'metach', '已證實之異時性轉移', 'Documented metachronous metastases by CT, MRI, and/or biopsy'),
      '<div class="cbx"><div class="cbx-h">復發檢查 Recurrence workup（COL-9）　<span class="cbx-sub">依個別病人臨床狀況</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb">理學檢查</span>' +
        '<span class="cb">大腸鏡</span>' +
        '<span class="cb">胸部／腹部／骨盆 CT</span>' +
        '<span class="cb">考慮 PET-CT</span>' +
        '<span class="cb">腫瘤 KRAS／NRAS／BRAF 狀態</span>' +
      '</div></div>' +
      '<div class="note"><b>潛在可切除者應經多專科團隊評估（含外科會診）</b>（COL-9 註 c）。</div>');

    h += connH('cc_c3rec');
    h += step('cc_s3rec', '3', '異時性轉移之可切除性（COL-9）',
      opt('rres', 'r_res', '可切除 Resectable', '轉移病灶可完整切除／局部治療') +
      opt('rres', 'r_unres', '不可切除 Unresectable', '潛在可轉換（convertible）或不可轉換（unconvertible）'));
    h = h.replace('id="cc_s3rec"', 'id="cc_s3rec" class="hidden"');

    h += connH('cc_c4rec');
    h += step('cc_s4rec', '4', '過去 12 個月內是否曾接受輔助 FOLFOX／CAPEOX？（COL-9）',
      opt('rprior', 'p_no', '否 No', '未於 12 個月內用過 oxaliplatin 為基礎之輔助化療') +
      opt('rprior', 'p_yes', '是 Yes', '12 個月內曾用 FOLFOX／CAPEOX'));
    h = h.replace('id="cc_s4rec"', 'id="cc_s4rec" class="hidden"');

    h += rec('cc_recur_rec', '建議處置 · 復發 Recurrence（COL-9）');
    h += '<div class="flow-fu hidden" id="cc_recur_fu"></div>';
    h += '</div>'; // cc_recur

    h += '<div class="flow-reset"><button class="btn-reset" onclick="ccReset()">重置</button></div>';
    h += '</div>'; // ccPath

    /* 院內流程之外的補充實證（實務手冊 ver.1，依 NCCN）；結腸與直腸共用，見 crc-supplement.js */
    h += (typeof crcSupplementHTML === 'function') ? crcSupplementHTML() : '';
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function ccSel(btn) {
    var sel = btn.classList.contains('tn-cell') ? '.tn-cell' : '.flow-opt';
    var g = btn.parentNode;
    g.querySelectorAll(sel).forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function ccShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function ccClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ulRec(id, cls, title, lines, note, extra) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'flow-rec ' + cls;
    var label = el.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置 Recommendation';
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (extra || '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }

  /* ---------- 追蹤區塊（COL-3／COL-6／COL-9）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'scope') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（COL-3(1)）</div><ul class="fu-list">' +
        '<li><b>1 年時大腸鏡</b>。</li>' +
        '<li>若有進階腺瘤（advanced adenoma：絨毛狀息肉、息肉 &gt;1cm、或高度分化不良）→ <b>1 年後再做</b>。</li>' +
        '<li>若無進階腺瘤 → <b>3 年後再做，之後每 5 年</b>。</li>' +
        '</ul>';
    } else if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（COL-3）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查：<b>每 3–6 個月，共 2 年</b>；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>CEA</b>：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。' +
        '（<b>COL-3(2) 於第 III 期另加註「適用於 T2 以上病灶」</b>；COL-3(1) 的第 II 期追蹤欄<b>沒有</b>這個限定，' +
        '本表兩期共用，請依實際期別判讀。）</li>' +
        '<li><b>胸部／腹部／骨盆 CT</b>：每 6–12 個月，共 5 年（復發高風險者；如腫瘤有神經或靜脈侵犯、或分化不良）。</li>' +
        '<li><b>大腸鏡</b>：1 年時；若有進階腺瘤 → 1 年後再做；若陰性 → 3 年後再做，之後每 5 年。' +
        '若因阻塞性病灶而術前未能完成大腸鏡 → <b>術後 3–6 個月做</b>。</li>' +
        '<li><b>PET-CT 非例行建議</b>。</li>' +
        '<li>復發 → 見復發與檢查（COL-9）。</li>' +
        '</ul>';
    } else if (type === 'resected_m1') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（COL-6，已切除之轉移病灶）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>CEA</b>：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>胸部／腹部／骨盆 CT</b>：每 3–6 個月，共 2 年；之後每 6–12 個月，總計 5 年。</li>' +
        '<li><b>大腸鏡</b>：1 年時（若因阻塞性病灶術前未做 → 3–6 個月）；有進階腺瘤 → 1 年後再做；' +
        '無 → 3 年後再做，之後每 5 年。</li>' +
        '<li>復發 → 見進展性／轉移性疾病之化學治療（COL-8）。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>治療期間定期評估反應與毒性；不可切除者<b>每 2 個月重新評估轉換為可切除之可能</b>（COL-7）。</li>' +
        '<li>疾病進展 → 依序接續次線／後線系統性治療或臨床試驗（COL-8）。</li>' +
        '<li>阻塞、出血、穿孔等症狀 → 考慮結腸切除、轉流造口、繞道或支架置放等緩解性局部處置。</li>' +
        '<li>體能不佳或多線治療後進展 → 最佳支持治療（best supportive care）／安寧療護。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  function result(recId, fuId, cls, title, lines, note, fuType, extra) {
    ulRec(recId, cls, title, lines, note, extra);
    renderFollowup(fuId, fuType);
  }
  function idleRec(recId, fuId, title) {
    ulRec(recId, 'rec-idle', title, [], '');
    renderFollowup(fuId, null);
  }

  /* ---------- pT1 內視鏡切除後之處置（COL-1-1）：迷你流程圖 ---------- */
  function pT1FlowHtml() {
    return '<details class="kps-details pt1-details"><summary>pT1 內視鏡切除後之處置準則（COL-1-1）▸</summary>' +
      '<div class="pt1-flow">' +
        '<div class="pt1-node pt1-root">pT1 carcinoma　<span class="pt1-sub">內視鏡切除 Endoscopic resection</span></div>' +
        '<div class="pt1-arrow">↓</div>' +
        '<div class="pt1-cols pt1-cols-main">' +

          // 左：切緣陰性
          '<div class="pt1-col">' +
            '<div class="pt1-node pt1-head">切緣陰性 Margin negative<span class="pt1-sub">ᵃ 腫瘤距切緣 &gt; 1mm 為切緣陰性</span></div>' +
            '<div class="pt1-arrow">↓</div>' +
            '<div class="pt1-cols pt1-cols-sub">' +
              '<div class="pt1-col">' +
                '<div class="pt1-node is-go"><b>全部符合 All of</b>' +
                  '<ul><li>侵犯深度 Haggitt<sup>b</sup> level ≤ 3 且 SM ≤ 1mm<sup>c</sup></li>' +
                  '<li>G1、G2<sup>d</sup></li><li>Ly(−)、V(−)<sup>e</sup></li><li>Budding G1<sup>f</sup></li></ul>' +
                '</div>' +
                '<div class="pt1-arrow">↓</div>' +
                '<div class="pt1-node pt1-term is-go">追蹤 Follow-up</div>' +
              '</div>' +
              '<div class="pt1-col">' +
                '<div class="pt1-node is-warn"><b>任一符合 Any of</b>' +
                  '<ul><li>侵犯深度 Haggitt level = 4 或 SM &gt; 1mm</li>' +
                  '<li>G3、G4</li><li>Ly 或 V (+)</li><li>Budding G2/3</li></ul>' +
                '</div>' +
                '<div class="pt1-arrow">↓</div>' +
                '<div class="pt1-node pt1-term is-warn">個案討論考慮追加手術<span class="pt1-sub">Consider additional surgery case by case</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 右：切緣陽性
          '<div class="pt1-col">' +
            '<div class="pt1-node pt1-head is-stop">切緣陽性 Margin positive</div>' +
            '<div class="pt1-arrow">↓</div>' +
            '<div class="pt1-node pt1-term is-stop">追加手術 Additional surgery</div>' +
          '</div>' +

        '</div>' +
        '<div class="pt1-foot">' +
          'a. 切緣陰性定義為腫瘤距切緣 &gt; 1mm。　b. <b>有柄（polypoid）</b>病灶以 <b>Haggitt 分類</b>評估黏膜下侵犯深度。　' +
          'c. <b>非有柄（non-polypoid）</b>病灶以黏膜下侵犯深度 &lt; 1mm 視為良好預後。　' +
          'd/e/f. 組織學特徵良好＝ d: 低惡性度（G1、G2）vs 高惡性度（G3、G4）；e: 無淋巴血管侵犯；f: 低度 tumor budding（G1）vs 高度（G2/G3）。<br>' +
          '<b>標本處置（COL-1-2）</b>：以不鏽鋼針固定於硬板、標示口側與肛側，並以垂直於切除面之方向、<b>每 2mm</b> 連續切片。' +
        '</div>' +
      '</div></details>';
  }

  /* ---------- 系統性治療（COL-8）---------- */
  var systemicNote = 'COL-8(1)、COL-8(2)：進展性／轉移性疾病之化學治療（Chemotherapy for Advanced or Metastatic Disease）。';

  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  function systemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">進展性／轉移性疾病之系統性治療<span class="rx-panel-src">COL-8</span></div>' +

      '<div class="rx-def"><b>療程定義</b>：<span class="rx">FOLFOX-like</span> 包含 <span class="drug">XELOX</span>、' +
      '<span class="drug">Oxaliplatin-HDFL</span> 或 <span class="drug">CapeOx</span>；' +
      '<span class="rx">FOLFIRI-like</span> 包含 <span class="drug">XELIRI</span> 或 <span class="drug">Irinotecan-HDFL</span>。</div>' +

      '<div class="rx-warn"><b>⚠ 已知 KRAS 突變（exon 2 或 non-exon 2）或 NRAS 突變者，不可使用 ' +
      '<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>。</b></div>' +

      rxLine('一線 First-line', '可耐受積極治療者', [
        '<span class="rx">FOLFOX-like</span> ± <span class="drug">bevacizumab</span>；或 <span class="rx">FOLFOX</span> ± <span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>（<b>KRAS/NRAS 野生型</b>）。',
        '<span class="rx">FOLFIRI-like</span> ± <span class="drug">bevacizumab</span>；或 <span class="rx">FOLFIRI-like</span> ± <span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>（<b>KRAS/NRAS 野生型</b>）。',
        '<span class="rx">FOLFIRINOX</span> ± <span class="drug">bevacizumab</span>（COL-8(2)）。',
        '<b>dMMR／MSI-H</b>：<span class="drug">pembrolizumab</span>（COL-8(2)，須自費）。'
      ]) +

      rxLine('二線 Second-line', '', [
        '<span class="rx">FOLFIRI</span> ±（<span class="drug">bevacizumab</span> 或 <span class="drug">ziv-aflibercept</span> 或 <span class="drug">ramucirumab</span>）。',
        '<span class="drug">irinotecan</span> ±（<span class="drug">bevacizumab</span> 或 <span class="drug">ramucirumab</span>）。',
        '<span class="rx">FOLFIRI</span> 或 <span class="drug">irinotecan</span> ±（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
        '<span class="rx">FOLFOX-like</span> ±（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
        '<b>BRAF V600E 突變</b>：<span class="drug">encorafenib</span> + <span class="drug">cetuximab</span>。'
      ]) +

      '<details class="rx-more"><summary>後線治療 Later lines（二次／三次進展後）▸</summary><div class="rx-stack">' +
        rxLine('二次進展後 After 2nd progression', '', [
          '<span class="drug">irinotecan</span> +（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
          '<span class="drug">regorafenib</span>。',
          '<span class="drug">trifluridine + tipiracil</span> ± <span class="drug">bevacizumab</span>。',
          '<b>dMMR／MSI-H</b>：<span class="drug">nivolumab</span> ± <span class="drug">ipilimumab</span> 或 <span class="drug">pembrolizumab</span>。',
          '先前未使用過者可用 <span class="rx">FOLFOX-like</span> 或 <span class="rx">FOLFIRI-like</span>。'
        ]) +
        rxLine('三次進展後 After 3rd progression', '', [
          '<span class="drug">regorafenib</span>。',
          '<span class="drug">trifluridine + tipiracil</span> ± <span class="drug">bevacizumab</span>（若先前未曾使用）。',
          '臨床試驗（clinical trial）。',
          '最佳支持治療（best supportive care）。'
        ]) +
      '</div></details>' +

      rxLine('無法耐受積極治療者', 'Not able to tolerate intensive therapy', [
        '治療選擇依<b>醫師判斷</b>，或<b>最佳支持治療</b>（best supportive care）。'
      ]) +

      '<details class="rx-more"><summary>用藥可近性與健保給付 Reimbursement —— <b>指引註記＋現行條文（查詢日 2026-08-16）</b> ▸</summary><div class="rx-note">' +
        '<div class="rx-def"><b>先看懂兩件不同的事</b>：「主管機關核准與否」決定<b>能不能用</b>，' +
        '「健保給付與否」決定<b>誰付錢</b>。指引 COL-8 註 e 的原文是' +
        '「Bevacizumab continuation after progression is <b>FDA approved, but not by DOH</b>」—— ' +
        '講的是<b>我國主管機關未核准該適應症</b>，不是健保不給付。本頁先前把兩者混為一談，已更正。</div>' +
        '<ul class="rx-items">' +
        '<li><span class="drug">bevacizumab</span> 於疾病進展後續用：經 <b>美國 FDA 核准</b>，' +
        '惟<b>我國主管機關未核准此適應症</b>（COL-8 註 e 原文之 DOH）。' +
        '健保條文 9.37 亦無「惡化後可續用」之依據 —— 一線與二線兩處都要求續用時<b>提出影像學證據證實無惡化</b>，' +
        '且二線條文限定病人須「<b>未曾接受過 bevacizumab</b>」。</li>' +
        '<li><span class="drug">ziv-aflibercept</span>、<span class="drug">ramucirumab</span>、' +
        '<span class="drug">nivolumab</span> ± <span class="drug">ipilimumab</span>、' +
        '<span class="drug">encorafenib</span> + <span class="drug">cetuximab</span>、' +
        '<span class="drug">pembrolizumab</span> 雖經 <b>TFDA 核准</b>，惟<b>均須自費</b>。</li>' +
              '</ul>' +
        '<div class="rx-panel-h" style="margin-top:10px">健保給付條件（第 9 節現行條文，查詢日 2026-08-16）<span class="rx-panel-src">健保署</span></div>' +
        '<ul class="rx-items">' +
        '<li><b>抗 EGFR（<span class="drug">cetuximab</span> 9.27／<span class="drug">panitumumab</span> 9.53）</b>：' +
        '一線與 FOLFIRI 或 FOLFOX 併用，<b>限 RAS 原生型</b>，須檢附 <b>All-RAS 基因突變分析報告</b>並符合通則十二；' +
        '<b>須事前審查，每次療程 18 週為限</b>，續用須以客觀證據證實無惡化。' +
        '<b>cetuximab 與 panitumumab 只能擇一</b>；<b>不得與 bevacizumab 併用</b>；' +
        '<b>R0 完全切除且查無轉移病灶者不得申請</b>（115/2/1 新增）。<br>' +
        '<b>健保並未把抗 EGFR 綁在「左側原發」</b> —— 兩份條文全文都沒有原發部位的字樣（與國際指引的臨床偏好不同，勿混淆）。<br>' +
        '<b>panitumumab 另有後線條文</b>（115/2/1 新增，目前唯一對新病人開放的後線抗 EGFR）：已用過含 5-FU、irinotecan 與 oxaliplatin 之二線以上治療失敗、RAS 原生型、' +
        '且<b>先前未曾用過任何抗 EGFR</b>；每次 9 週、<b>總療程 18 週為上限</b>。</li>' +
        '<li><b><span class="drug">bevacizumab</span>（9.37）</b>：一線與 FOLFIRI／FOLFOX／5-FU-LV 併用，' +
        '<b>總療程 36 週為上限</b>，事前審查每次 18 週；<b>無 RAS／BRAF／MMR 前提，也無左右側限制</b>；不得與抗 EGFR 併用。' +
        '二線另有一條（限先前用過抗 EGFR 無效、<b>未曾用過 bevacizumab</b>、RAS 無突變），需 All-RAS 報告，總療程 24 週為上限。</li>' +
        '<li><b><span class="drug">encorafenib</span>（9.134）＋ cetuximab</b>：BRAF V600E 突變之<b>二線</b>治療；' +
        '需曾用過 bevacizumab 併 FOLFIRI／FOLFOX／5-FU-LV、<b>未曾用過抗 EGFR</b>、ECOG ≤2、檢附 BRAF V600E 報告。' +
        '事前審查每 12 週一次，<b>總療程 24 週為上限</b>；<b>用過本組合後即不得再申請抗 EGFR</b>。' +
        '（9.27 之對應條文另要求 RAS 無突變，兩條須併看。）</li>' +
        '<li><b><span class="drug">regorafenib</span>（9.51）</b>：需先前用過 fluoropyrimidine、oxaliplatin、irinotecan 與抗 VEGF；' +
        '<b>K-ras 原生型者還要再用過抗 EGFR</b>。需 All-RAS 報告、事前審查每次 8 週。<b>不得與 trifluridine/tipiracil 併用。</b></li>' +
        '<li><b><span class="drug">trifluridine/tipiracil</span>（Lonsurf，9.66）</b>：條件與 regorafenib 平行' +
        '（先前用過三類化療＋抗 VEGF；RAS 原生型者再加抗 EGFR）。' +
        '<b>不得與 regorafenib 或 fruquintinib 併用</b>。此條<b>無事前審查</b>，改採病歷留存備查、惡化即停藥。</li>' +
        '<li><b><span class="drug">pembrolizumab</span>（9.69）</b>：大腸直腸癌<b>唯一入口是「無法切除或轉移性 MSI-H／dMMR 之第一線單用」</b>' +
        '（114/6/1 新增）。ECOG ≤1；事前審查每次 12 週、每 12 週以 i-RECIST 評估；' +
        '<b>連續兩次評估為 SD 者不得續用</b>；<b>給付時程自初次用藥起算 2 年</b>。' +
        '每位病人每個適應症<b>限一種免疫檢查點抑制劑且不得互換</b>。</li>' +
        '<li><b>不給付於大腸直腸癌者</b>：<span class="drug">nivolumab</span>（條文明文「限 pembrolizumab」）、' +
        '<span class="drug">ipilimumab</span>、<span class="drug">atezolizumab</span>、' +
        '<span class="drug">ramucirumab</span>（9.92 僅涵蓋肝細胞癌）；' +
        '<b><span class="drug">ziv-aflibercept</span> 台灣健保完全未收載</b>（查無品項）。</li>' +
        '<li><b>化療骨架</b>：<span class="drug">oxaliplatin</span>（9.10）與 5-FU／folinic acid 併用治療轉移性結腸直腸癌，' +
        '<b>再加 irinotecan（即 FOLFOXIRI）則 oxaliplatin 不予給付</b>；輔助適應症條文寫的是「<b>第三期結腸癌</b>」，' +
        '字面上<b>不含直腸癌、也不含高風險第二期</b>。' +
        '<span class="drug">capecitabine</span>（9.17）輔助限第三期結腸癌、<b>以八個療程為限</b>。' +
        '<span class="drug">UFUR</span>（9.11）之第 II／III 期結腸／直腸癌<b>術後輔助</b>使用期限<b>不得超過 2 年</b>' +
        '（此 2 年上限<b>只適用於術後輔助</b>，不是轉移性用藥的上限）。' +
        '<span class="drug">5-FU</span> 無個別給付規定條文。</li>' +
        '</ul>' +
        '<div class="rx-warn"><b>給付條文會變，開單前請以健保署當期公告為準。</b>' +
        '本區塊之條文查詢日為 2026-08-16；「通則十二」（基因檢測須由何種認證實驗室執行、報告如何檢附）之逐字條文未能取得，' +
        '實際檢附方式請與院內審查窗口確認。</div>' +
        '</div></details>' +

      /* 上列為 COL-8 之「線別與適應症」；實際劑量與打法見 COL-11(1)(2)（結腸與直腸共用） */
      ((typeof crcMetastaticRegimens === 'function') ? crcMetastaticRegimens() : '') +

      '</div>';
  }

  /* ---------- 輔助化療處方（COL-10；結腸與直腸共用，見 crc-regimens.js）---------- */
  function adjRxPanel() {
    return (typeof crcAdjuvantRegimens === 'function') ? crcAdjuvantRegimens() : '';
  }

  /* ---------- 主渲染 ---------- */
  function ccRender() {
    var s = ccSt;

    ccShow('cc_polyp', s.entry === 'polyp');
    ccShow('cc_c2p', s.entry === 'polyp');
    ccShow('cc_resect', s.entry === 'resect');
    ccShow('cc_c2r', s.entry === 'resect');
    ccShow('cc_meta', s.entry === 'meta');
    ccShow('cc_c2m', s.entry === 'meta');

    // A. 惡性息肉：僅「良好特徵」需再問息肉形態
    var showMorph = (s.entry === 'polyp' && s.pfind === 'fav');
    ccShow('cc_c3p', showMorph);
    ccShow('cc_s3p', showMorph);
    renderPolypRec();

    // B. 非轉移：已切除者（非 unres）才進入 T×N 病理分期
    var showTn = (s.entry === 'resect' && s.pres && s.pres !== 'unres');
    ccShow('cc_c3r', showTn);
    ccShow('cc_s3r', showTn);

    var g = (showTn && s.tn) ? TN_GROUP[s.tn] : null;
    var showS2t3 = (g === 'g-ii' && s.tn === 't3_n0');
    var showS2t4 = (g === 'g-ii' && s.tn === 't4_n0');
    ccShow('cc_c4r3', showS2t3); ccShow('cc_s4r3', showS2t3);
    ccShow('cc_c4r4', showS2t4); ccShow('cc_s4r4', showS2t4);

    ccShow('cc_adj_rec', !!g);
    renderResectRec();
    renderAdjRec(g);

    // C. 轉移：僅肝／肺轉移需再問可切除性
    var showMres = (s.entry === 'meta' && s.msite === 'liverlung');
    ccShow('cc_c3m', showMres);
    ccShow('cc_s3m', showMres);
    renderMetaRec();

    // D. 復發（COL-9）
    ccShow('cc_recur', s.entry === 'recur');
    ccShow('cc_c2rec', s.entry === 'recur');
    // 已證實之異時性轉移 → 問可切除性；CEA 升高路徑不需（先做 workup）
    var showRres = (s.entry === 'recur' && s.rentry === 'metach');
    ccShow('cc_c3rec', showRres); ccShow('cc_s3rec', showRres);
    // 不可切除者 → 問是否 12 個月內曾用 FOLFOX/CAPEOX
    var showRprior = (showRres && s.rres === 'r_unres');
    ccShow('cc_c4rec', showRprior); ccShow('cc_s4rec', showRprior);
    renderRecurRec();
  }

  /* ---------- A. 惡性息肉（COL-1）---------- */
  function renderPolypRec() {
    var s = ccSt;
    if (s.entry !== 'polyp') return;
    var R = 'cc_polyp_rec', F = 'cc_polyp_fu';

    if (!s.pfind) { idleRec(R, F, '請選擇步驟 2（病理檢視結果）'); return; }

    // 切緣陰性但任一項不良 → COL-1-1 明文為「個案討論考慮追加手術」，不是一律開刀
    if (s.pfind === 'unfav') {
      result(R, F, 'rec-nonop', '切緣陰性但有不良特徵 → <b>個案討論</b>考慮追加手術（不是一律開刀）', [
        '<span class="rx-h">COL-1-1 的原文是「case by case」</span>',
        '<b>切緣陰性</b>（腫瘤距切緣 &gt;1mm）但出現下列任一項 —— <b>侵犯深度 Haggitt level 4 或 SM &gt;1mm</b>、' +
        '<b>G3／G4</b>、<b>Ly 或 V 陽性</b>、<b>budding G2/3</b> —— COL-1-1 寫的是' +
        '「<b>個案討論考慮追加手術</b>（Consider additional surgery case by case）」，' +
        '<b>而不是 COL-1 那句較強的「結腸切除併區域淋巴結整塊切除」</b>。同一份指引兩頁的強度不同，此處採較細緻的 COL-1-1。',
        '<span class="rx-h">討論時要權衡的東西</span>',
        '<b>一邊</b>：殘存淋巴結轉移的風險（不良特徵愈多風險愈高，尤其 SM &gt;1mm 併 Ly/V 陽性或 budding G2/3）。',
        '<b>另一邊</b>：這位病人接受結腸切除的手術風險（年齡、共病、體能），以及病灶位置（低位直腸者代價更大）。',
        '<b>決定追加手術者</b>：先完成分期檢查（CBC、BCS、CEA、胸部／腹部／骨盆 CT），' +
        '再行<b>結腸切除併區域淋巴結整塊切除</b>；術後依病理分期決定輔助治療（COL-3）。',
        '<b>決定不追加手術者</b>：進入下方的內視鏡追蹤排程，並明確記錄討論內容與病人意願。'
      ], 'COL-1-1：Margin negative ＋（Ly 或 V(+)／Budding G2-3／G3-G4／Haggitt level 4／SM &gt;1mm）→ Consider additional surgery case by case。' +
        'COL-1 對「unfavorable histologic features 或 High Risk Features」寫的是 Colectomy with en bloc removal of regional lymph nodes；兩頁強度不同。',
        'scope', pT1FlowHtml());
      return;
    }

    // 切緣陽性／標本破碎 → 追加手術（COL-1-1 之強建議）
    if (s.pfind === 'm_pos') {
      result(R, F, 'rec-urgent', '切緣陽性或無法評估 → 追加手術（COL-1-1 之強建議）', [
        '<b>檢查</b>：考慮骨盆 MRI（以區辨直腸癌與結腸癌，如低位乙狀結腸腫瘤；直腸位於 MRI 所定薦岬至恥骨聯合上緣虛擬連線之下）；CBC、BCS、CEA；胸部／腹部／骨盆 CT。',
        '<b>處置</b>：<b>Colectomy with en bloc removal of regional lymph nodes</b>（結腸切除併區域淋巴結整塊切除）。' +
        'COL-1-1 對<b>切緣陽性</b>只有這一個出口，沒有「個案討論」的餘地。',
        '<b>切緣陰性的定義是腫瘤距切緣 &gt;1mm</b>（COL-1-1 註 a）；標本破碎或切緣無法評估者，視同無法確認陰性。',
        '術後依病理分期決定輔助治療（COL-3）— 可返回步驟 1 選擇「結腸癌 · 非轉移」查詢輔助治療。'
      ], 'COL-1-1：Margin positive → Additional surgery。COL-1：Fragmented specimen／margin cannot be assessed → 分期檢查後行結腸切除併區域淋巴結整塊切除 → COL-3。',
        null, pT1FlowHtml());
      return;
    }

    // 良好特徵 → 依息肉形態
    if (!s.pmorph) { idleRec(R, F, '請選擇步驟 3（息肉形態）'); return; }

    if (s.pmorph === 'ped') {
      result(R, F, 'rec-elective', '有柄息肉含侵襲癌（特徵良好）→ 觀察 Observe', [
        '<b>Observe</b>：單一標本完整切除、組織學特徵良好、切緣乾淨之<b>有柄</b>息肉 → 觀察即可。',
        '<b>注意（COL-1 註 g）</b>：觀察須理解無柄（sessile）惡性息肉相較於有柄（polypoid）惡性息肉，' +
        '在<b>殘存病灶、疾病復發、死亡率與血行性轉移</b>之不良結果發生率顯著較高，<b>但淋巴結轉移不然</b>。'
      ], 'COL-1：Single specimen, completely removed with favorable histologic features and clear margins → Pedunculated polyp with invasive cancer → Observe → COL-3。',
        'scope', pT1FlowHtml());
      return;
    }

    result(R, F, 'rec-elective', '無柄息肉含侵襲癌（特徵良好）→ 觀察 或 結腸切除', [
      '<b>Observe</b>；<b>或 Colectomy with en bloc removal of regional lymph nodes</b>（結腸切除併區域淋巴結整塊切除）— 二者擇一。',
      '<b>注意（COL-1 註 g）</b>：選擇觀察須理解<b>無柄</b>惡性息肉之殘存病灶、疾病復發、死亡率與血行性轉移之不良結果發生率' +
      '顯著高於有柄惡性息肉（<b>淋巴結轉移則否</b>）— 此即無柄病灶多加列切除選項之理由。'
    ], 'COL-1：favorable 之 Sessile polyp with invasive cancer → Observe or Colectomy with en bloc removal of regional lymph nodes → COL-3。',
      'scope', pT1FlowHtml());
  }

  /* ---------- B1. 非轉移 · 初步建議處置（COL-2）---------- */
  function renderResectRec() {
    var s = ccSt;
    if (s.entry !== 'resect') return;
    var R = 'cc_resect_rec', F = 'cc_resect_fu';

    if (!s.pres) { idleRec(R, F, '請選擇步驟 2（可切除性與阻塞與否）'); return; }

    // 局部無法切除／無法耐受手術 → 系統性治療／化放療 → 再評估轉換
    if (s.pres === 'unres') {
      result(R, F, 'rec-nonop', '局部無法切除 或 無法耐受手術 → 系統性治療／化放療 → 再評估',
        [
          '<b>初始治療（COL-2）</b>：系統性治療（Systemic therapy）；<b>或</b> 持續輸注 <span class="drug">5-FU</span> + 放射治療；' +
          '<b>或</b> <span class="drug">capecitabine</span> + 放射治療。',
          '<b>再評估</b>：Re-evaluation for conversion to resectable disease — 若轉換為可切除 → <b>手術 ± 系統性治療</b>。',
          '無法轉換者 → 依進展性／轉移性疾病之系統性治療（COL-8，如下）。',
          '<b>緩解性處置（COL-2 註 f）</b>：<b>無法控制之出血 → 放射治療</b>；<b>阻塞 → 支架置放</b>；以及支持性照護。' +
          '這一條常被漏掉，但它正是這一支病人最可能需要的具體手段。',
          '<span class="rx-h">放射治療在結腸癌的定位</span>　<span class="rx-sub">COL-14／COL-15</span>',
          '<b>COL-14 明文</b>：放療「may be considered for initially unresectable／borderline resectable or medically inoperable ' +
          '<b>non-metastatic T4 colon cancer</b>」—— 也就是這一格的病人。',
          '<b>劑量（COL-15）</b>：每次 ≥1.8 Gy、每週 5 次；長程療程總量 <b>45–60 Gy</b>。' +
          '<b>照野須依原發部位個別規劃</b>：COL-16 的標靶體積定義是直腸專屬的，<b>不可直接套用於結腸</b>。'
        ],
        systemicNote + '｜COL-2：Locally unresectable or medically inoperable → systemic therapy／5-FU 或 capecitabine + RT → re-evaluation for conversion → surgery ± systemic therapy → COL-8。',
        'palliative', systemicPanel());
      return;
    }

    // 可切除 → 手術（初步建議處置）；輔助治療見下方 T×N 步驟
    var lead = [];
    if (s.pres === 'nonobs') {
      lead.push('<b>Colectomy with en bloc removal of regional lymph nodes</b>（結腸切除併區域淋巴結整塊切除）。');
    } else if (s.pres === 'obs') {
      lead.push('<b>當次結腸切除併區域淋巴結整塊切除</b>（One-stage colectomy with en bloc removal of regional lymph nodes）；');
      lead.push('<b>或</b> 切除併轉流（Resection with diversion）；<b>或</b> 轉流（Diversion）；<b>或</b> 支架置放（Stent，選擇性病例）。');
      lead.push('先行轉流或支架者 → 後續再行<b>結腸切除併區域淋巴結整塊切除</b>。');
    } else { // t4b
      lead.push('<b>考慮新輔助化療</b>：<span class="rx">FOLFOX</span> 或 <span class="rx">CapeOx</span>（Consider neoadjuvant FOLFOX or CapeOx）。');
      lead.push('<b>新輔助化療後必須先再評估，才決定是否進手術室</b>（COL-2 原圖未畫這一步，屬實務補充）：' +
        '<b>① 降期或穩定</b> → 行結腸切除併區域淋巴結整塊切除；' +
        '<b>② 未降期或進展</b> → <b>不要直接開刀</b>，改走 COL-2 的「局部無法切除」路徑' +
        '（系統性治療；或持續輸注 <span class="drug">5-FU</span> ＋ 放療；或 <span class="drug">capecitabine</span> ＋ 放療），之後再評估轉換可能。');
      lead.push('<b>⚠ 接受過新輔助化療者，術後檢體是 ypT／ypN</b>；' +
        'COL-3 的輔助治療分層（第 II 期高風險特徵、IDEA 之 3 vs 6 個月）全部是在<b>未經新輔助治療</b>的 pTN 族群推導出來的，' +
        '<b>ypTN 沒有 COL-3 的直接依據，須經多專科團隊個案討論</b>。');
    }
    lead.push('術後依<b>病理分期</b>決定輔助治療 → 請於下方步驟 3 點選 <b>T×N 格子</b>（COL-3）。');
    result(R, F, 'rec-elective',
      s.pres === 'obs' ? '可切除、有阻塞 → 手術處置' :
        (s.pres === 't4b' ? '臨床 T4b → 考慮新輔助化療 → 結腸切除' : '可切除、無阻塞 → 結腸切除 + 區域淋巴結整塊切除'),
      lead,
      'COL-2：Resectable non-obstructing／obstructing／clinical T4b 之 PRIMARY TREATMENT → COL-3。', null);
  }

  /* ---------- B2. 非轉移 · 輔助治療（COL-3）---------- */
  function renderAdjRec(g) {
    var s = ccSt;
    var R = 'cc_adj_rec', F = 'cc_adj_fu';
    if (!g) { renderFollowup(F, null); return; }

    if (g === 'g-none') {
      result(R, F, 'rec-elective', 'Tis／T1,N0,M0／T2,N0,M0 → 不需輔助治療', [
        '<b>輔助治療：None</b>（不需輔助化療）。',
        '進入大腸鏡追蹤（見下方）。'
      ], 'COL-3(1)：Tis; T1, N0, M0; T2, N0, M0 → Adjuvant therapy = None。', 'scope');
      return;
    }

    if (g === 'g-ii') {
      var tLabel = (s.tn === 't3_n0') ? 'T3, N0, M0' : 'T4, N0, M0';
      if (!s.s2) { idleRec(R, F, '請於步驟 4 選擇 ' + tLabel + ' 之 MMR 狀態' + (s.tn === 't3_n0' ? '與高風險特徵' : '')); return; }

      if (s.s2 === 's2_msi') {
        result(R, F, 'rec-elective', 'T3–4, N0, M0 且 MSI-H／dMMR → 不需輔助治療', [
          '<b>輔助治療：None</b>。',
          '<b>理由（COL-3 註 a）</b>：<b>第 II 期 MSI-H 病人預後良好，且無法從 5-FU 輔助治療獲益</b>。',
          '<b>MMR 檢測（COL-3 註 a）</b>：所有 <b>&lt; 70 歲</b>病人皆應考慮檢測錯配修復蛋白（MMR，COL-18）。',
          '目前尚無足夠證據支持以多基因檢測套組（multi-gene assay panels）決定輔助治療。'
        ], 'COL-3(1)：T3-4, N0, M0（MSI-H or dMMR）→ Adjuvant therapy = None。', 'scope');
        return;
      }
      if (s.s2 === 's2_low') {
        result(R, F, 'rec-elective', 'T3,N0,M0（MSS/pMMR、無高風險特徵）→ 觀察 或 單方口服／靜脈氟嘧啶', [
          '<b>Observation</b>（觀察）；',
          '<b>或</b> 考慮 <span class="drug">capecitabine</span> 或 <span class="rx">5-FU/leucovorin</span>。',
          '<b>第 II 期不加 oxaliplatin</b>：於第 II 期結腸癌，5-FU/leucovorin 加上 oxaliplatin <b>尚未顯示存活效益</b>（COL-3 註 d）。'
        ], 'COL-3(1)：T3, N0, M0（MSS/pMMR and no high risk features）→ Observation or consider capecitabine or 5-FU/leucovorin。', 'curative', adjRxPanel());
        return;
      }
      // s2_high
      result(R, F, 'rec-elective', '高風險第 II 期（T3,N0,M0 高復發風險；或 T4,N0,M0 MSS/pMMR）→ 輔助化療', [
        '<span class="rx">5-FU/leucovorin ± oxaliplatin</span>（<span class="rx">FOLFOX</span>）；',
        '<b>或</b> <span class="drug">capecitabine</span> ± <span class="drug">oxaliplatin</span>（<span class="rx">CapeOX</span>）；',
        '<b>或</b> 臨床試驗；<b>或</b> 觀察（Observation）。',
        '<b>高風險定義（COL-3(1)）</b>：Grade 3–4、淋巴血管侵犯、腸阻塞、<b>取樣淋巴結 &lt; 12 顆</b>、' +
        '神經周圍侵犯、局部穿孔、切緣接近／無法確定／陽性。',
        '<b>T4 且侵犯至固定構造者，考慮放射治療</b>（COL-3 註 b）。',
        '<b>年齡 ≥ 70 歲者，加用 oxaliplatin 之效益未被證實</b>（COL-3 註 e）。'
      ], 'COL-3(1)：T3, N0, M0 high risk for systemic recurrence 或 T4, N0, M0（MSS/pMMR）→ FOLFOX／CapeOX／clinical trial／observation。Bevacizumab、cetuximab、panitumumab、irinotecan 不可用於第 II／III 期之輔助治療（臨床試驗除外，COL-3 註 c）。', 'curative', adjRxPanel());
      return;
    }

    if (g === 'g-low') {
      result(R, F, 'rec-elective', '低風險第 III 期（T1–3, N1）→ 輔助化療', [
      '<span class="rx-h">先確認 MMR／MSI 狀態</span>　<span class="rx-sub">COL-3 註 a：MMR 檢測應考慮用於所有 &lt; 70 歲病人</span>',
      '<b>2026 年起，第 III 期的 MMR 狀態會改變輔助治療</b>：<b>ATOMIC</b> 第三期試驗（Sinicrope FA et al. NEJM 2026;394:1155-1166）'
      + '收已切除之<b>第 III 期 dMMR 結腸癌</b>，在 <span class="rx">mFOLFOX6</span> 之上加 <span class="drug">atezolizumab</span> 6 個月、'
      + '之後單用 atezolizumab 至滿 12 個月：<b>3 年無病存活 86.3% vs 76.2%（HR 0.50，p&lt;0.001）</b>；'
      + 'Grade 3–4 不良事件 84.1% vs 71.9%。',
      '<b>台大大腸直腸癌指引尚未納入此路徑</b>，台灣<b>此適應症亦尚未納保</b>；'
      + 'dMMR／MSI-H 之第 III 期病人請經多專科討論，並先確認藥物取得與院內品項。<b>pMMR／MSS 者維持下列標準處方。</b>',
        '<span class="rx-h">建議 Preferred</span>　<span class="rx">CapeOX</span> <b>3 個月</b>；<b>或</b> <span class="rx">FOLFOX</span> <b>3–6 個月</b>。',
        '<span class="rx-h">其他選項 Other options</span>　<span class="drug">capecitabine</span>（6 個月）或 <span class="drug">5-FU</span>（6 個月）。',
        '<b>IDEA 分析（COL-3 註 h）</b>：T1–3, N1 低風險第 III 期，<b>3 個月 CapeOX 對無病存活不劣於 6 個月</b>；' +
        '惟 <b>3 個月 FOLFOX 之不劣性尚未被證實</b>。',
        '<b>3 個月相較 6 個月療程之 Grade 3+ 神經毒性顯著較低</b>（FOLFOX 3% vs 16%；CapeOX 3% vs 9%）。'
      ], 'COL-3(2)：T1–3, N1（low risk stage III）→ Preferred CapeOX (3 mo) or FOLFOX (3–6 mo)；Other options: capecitabine (6 mo) or 5-FU (6 mo)。無禁忌症者術後 6 週內開始。', 'curative', adjRxPanel());
      return;
    }

    // g-high
    result(R, F, 'rec-elective', '高風險第 III 期（T4, N1–2；任何 T, N2）→ 輔助化療', [
      '<span class="rx-h">先確認 MMR／MSI 狀態</span>　<span class="rx-sub">COL-3 註 a：MMR 檢測應考慮用於所有 &lt; 70 歲病人</span>',
      '<b>2026 年起，第 III 期的 MMR 狀態會改變輔助治療</b>：<b>ATOMIC</b> 第三期試驗（Sinicrope FA et al. NEJM 2026;394:1155-1166）'
      + '收已切除之<b>第 III 期 dMMR 結腸癌</b>，在 <span class="rx">mFOLFOX6</span> 之上加 <span class="drug">atezolizumab</span> 6 個月、'
      + '之後單用 atezolizumab 至滿 12 個月：<b>3 年無病存活 86.3% vs 76.2%（HR 0.50，p&lt;0.001）</b>；'
      + 'Grade 3–4 不良事件 84.1% vs 71.9%。',
      '<b>台大大腸直腸癌指引尚未納入此路徑</b>，台灣<b>此適應症亦尚未納保</b>；'
      + 'dMMR／MSI-H 之第 III 期病人請經多專科討論，並先確認藥物取得與院內品項。<b>pMMR／MSS 者維持下列標準處方。</b>',
      '<span class="rx-h">建議 Preferred</span>　<span class="rx">CapeOX</span> <b>3–6 個月</b>；<b>或</b> <span class="rx">FOLFOX</span> <b>6 個月</b>。',
      '<span class="rx-h">其他選項 Other options</span>　<span class="drug">capecitabine</span>（6 個月）或 <span class="drug">5-FU</span>（6 個月）。',
      '<b>IDEA 分析（COL-3 註 h）</b>：T4、N1–2 或任何 T、N2 之高風險第 III 期，<b>3 個月 FOLFOX 之無病存活劣於 6 個月</b>；' +
      '而 <b>3 個月 CapeOX 相較 6 個月之不劣性尚未被證實</b>。',
      '<b>T4 且侵犯至固定構造者，考慮放射治療</b>（COL-3 註 b）。'
    ], 'COL-3(2)：T4, N1-2, T any, N2（high risk stage III）→ Preferred CapeOX (3–6 mo) or FOLFOX (6 mo)；Other options: capecitabine (6 mo) or 5-FU (6 mo)。', 'curative', adjRxPanel());
  }

  /* ---------- C. 轉移（COL-4 → COL-5／6／7／8）---------- */
  function renderMetaRec() {
    var s = ccSt;
    if (s.entry !== 'meta') return;
    var R = 'cc_meta_rec', F = 'cc_meta_fu';

    if (!s.msite) { idleRec(R, F, '請選擇步驟 2（轉移型態）'); return; }

    // 腹膜轉移（COL-5）
    if (s.msite === 'periton') {
      result(R, F, 'rec-nonop', '同時性腹腔／腹膜轉移（COL-5）',
        [
          '<b>COL-5 原圖是三條平行分支，三者的處置完全不同 —— 先確認這位病人落在哪一條：</b>',
          '<span class="rx-h">① 無阻塞 Non-obstructing</span>　<b>不開刀</b>，直接進行進展性／轉移性疾病之系統性治療（COL-8，如下）。',
          '<span class="rx-h">② 阻塞或即將阻塞 Obstructed / imminent obstruction</span>　' +
          '<b>先解決阻塞</b>：結腸切除、<b>或</b>轉流造口（diverting ostomy）、<b>或</b>阻塞繞道、<b>或</b>支架置放 —— ' +
          '四者擇一，依阻塞位置、病人狀況與是否計畫後續全身治療決定；之後接系統性治療（COL-8）。',
          '<span class="rx-h">③ 無遠處轉移 No distant metastasis</span>　' +
          '<b>減積手術（cytoreduction surgery）</b>：最佳減積手術 ± <b>HIPEC（選擇性）</b>；之後接系統性治療（COL-8）。' +
          '<b>注意這一條的前提是「腹膜之外沒有其他轉移」</b> —— 有肝或肺轉移者不走這條。',
          '<b>注意（COL-5 註 a）</b>：<b>積極的減積清創與／或腹腔化療，不建議於臨床試驗以外之情境施行</b>。',
          '<b>HIPEC（COL-5 註 b）</b>：與最佳減積手術併行之 HIPEC 屬<b>選擇性（optional）</b>程序，' +
          '依個別病人臨床狀況與外科醫師經驗決定。'
        ],
        systemicNote + '｜COL-5：Synchronous abdominal/peritoneal metastases → 依阻塞與否及有無遠處轉移分流 → COL-8。',
        'palliative',
        ((typeof crcHipecRegimens === 'function') ? crcHipecRegimens() : '') + systemicPanel());
      return;
    }

    // 其他部位不可切除轉移（COL-8）
    if (s.msite === 'other') {
      result(R, F, 'rec-nonop', '其他部位、同時性不可切除轉移 → 系統性治療（COL-8）',
        ['<b>直接進入進展性／轉移性疾病之系統性治療</b>（Chemotherapy for Advanced or Metastatic Disease，COL-8）。'],
        systemicNote + '｜COL-4：Synchronous unresectable metastases of other sites → See Chemotherapy for Advanced or Metastatic Disease（COL-8）。',
        'palliative', systemicPanel());
      return;
    }

    // 肝／肺轉移 → 可切除性
    if (!s.mres) { idleRec(R, F, '請選擇步驟 3（肝／肺轉移之可切除性）'); return; }

    if (s.mres === 'm_res') {
      result(R, F, 'rec-elective', '可切除之同時性「僅」肝／肺轉移（COL-6）', [],
        'COL-6：Resectable synchronous liver and/or lung metastases only → 下列 TREATMENT 四選一 → ADJUVANT THERAPY → SURVEILLANCE；復發 → COL-8。',
        'resected_m1',
        '<div class="rec-detail rx-panel">' +
          '<div class="rx-panel-h">可切除之同時性肝／肺轉移<span class="rx-panel-src">COL-6</span></div>' +
          rxLine('治療 Treatment', '以下擇一', [
            '<b>同時性或分期之結腸切除</b> + 肝或肺切除及／或局部治療（Synchronous or staged colectomy with liver or lung resection and/or local treatment）。',
            '<b>新輔助治療 2–3 個月</b>（<span class="rx">FOLFOX</span> 或 <span class="rx">CapeOX</span> ± <span class="drug">bevacizumab</span>；' +
            '或 <span class="rx">FOLFIRI</span> ± <span class="drug">cetuximab</span>［<b>僅 KRAS/NRAS 野生型</b>］；或 <span class="rx">FOLFOXIRI</span>）' +
            '→ 之後同時性或分期之結腸切除與轉移病灶切除。',
            '<b>先行結腸切除</b> → 化療 2–3 個月（<span class="rx">FOLFIRI</span> 或 <span class="rx">FOLFOX</span> 或 <span class="rx">CapeOX</span> ± <span class="drug">bevacizumab</span>；' +
            '或 <span class="rx">FOLFIRI</span> ± <span class="drug">cetuximab</span>［<b>僅 KRAS/NRAS 野生型</b>］；或 <span class="rx">FOLFOXIRI</span>）→ 分期切除轉移病灶。',
            '<b>dMMR／MSI-H</b>：考慮 <span class="drug">pembrolizumab</span> → 之後同時性或分期之結腸切除與轉移病灶切除及／或局部治療（<b>TFDA 核准，須自費</b>）。'
          ]) +
          rxLine('輔助治療 Adjuvant', '轉移病灶已切除；建議圍手術期共 6 個月，總時程不應超過 6 個月（COL-6 註 g）', [
            '<span class="rx">FOLFOX</span>／<span class="rx">CapeOx</span>（<b>preferred</b>）± 標靶治療。',
            '或 <span class="drug">capecitabine</span> 或 <span class="rx">5-FU/leucovorin</span> ± 標靶治療。',
            '<b>或</b> 考慮觀察，或縮短化療療程。'
          ]) +
          '<details class="rx-more"><summary>註記 Notes（bevacizumab 手術時序、BRAF V600E、肝動脈灌注）▸</summary><div class="rx-note"><ul class="rx-items">' +
            '<li><b>Bevacizumab 手術時序（COL-6 註 b）</b>：最後一劑 <span class="drug">bevacizumab</span> 與手術應間隔 <b>至少 6 週</b>，術後 <b>至少 6–8 週</b>再重新開始；' +
            '≥ 65 歲者中風及其他動脈事件風險增加；bevacizumab 可能干擾傷口癒合。</li>' +
            '<li><b>BRAF V600E（COL-6 註 c）</b>：BRAF V600E 突變者對 <span class="drug">panitumumab</span> 或 <span class="drug">cetuximab</span>（單用或併細胞毒性化療）<b>極不可能有反應</b>。</li>' +
            '<li><b>肝動脈灌注 ± 全身性 <span class="rx">5-FU/leucovorin</span> 亦為選項</b>（category 2B，COL-6 註 a）。</li>' +
          '</ul></div></details>' +
        '</div>');
      return;
    }

    // 不可切除肝／肺轉移（COL-7）
    result(R, F, 'rec-nonop', '不可切除之同時性「僅」肝／肺轉移（COL-7）', [],
      systemicNote + '｜COL-7：Unresectable synchronous liver and/or lung metastases only → systemic therapy → re-evaluate q2mo → converted to resectable（→ 手術 + 輔助）或 remain unresectable（→ COL-8）。',
      'palliative',
      '<div class="rec-detail rx-panel">' +
        '<div class="rx-panel-h">不可切除之同時性肝／肺轉移<span class="rx-panel-src">COL-7</span></div>' +
        rxLine('治療 Treatment', '', [
          '<b>系統性治療</b>：<span class="rx">FOLFIRI</span> 或 <span class="rx">FOLFOX</span> 或 <span class="rx">CapeOX</span> 或 <span class="rx">FOLFOXIRI</span> ± <span class="drug">bevacizumab</span>。',
          '<b>或</b> <span class="rx">FOLFIRI</span> 或 <span class="rx">FOLFOX</span> 或 <span class="rx">FOLFOXIRI</span> ± <span class="drug">panitumumab</span> 或 <span class="drug">cetuximab</span>（<b>僅 KRAS/NRAS/BRAF 野生型</b>）。',
          '<b>或</b> <span class="drug">pembrolizumab</span>（<b>僅 dMMR／MSI-H</b>，須自費）。',
          '<b>結腸切除之時機</b>：<b>僅在</b>有立即阻塞風險、顯著出血、穿孔或其他顯著腫瘤相關症狀時才考慮切除原發灶。'
        ]) +
        rxLine('再評估 Re-evaluation', '每 2 個月', [
          '<b>每 2 個月</b>重新評估是否可轉換為可切除（若轉換為可切除是合理目標）。',
          '<b>轉換為可切除（Converted to resectable）</b> → 同時性或分期之結腸切除與轉移病灶切除 → ' +
          '輔助治療：系統性化療 ± 標靶治療，<b>或</b>考慮觀察或縮短化療療程（圍手術期治療至多 6 個月）→ 追蹤；復發見 COL-9。',
          '<b>仍不可切除（Remain unresectable）</b> → 依進展性／轉移性疾病之系統性治療（COL-8，見下）。',
          '<b>⚠ 第三種結果：治療中進展（Progression）</b> —— COL-7 的再評估只畫了「轉換成功」與「仍不可切除」兩條，' +
          '但實務上第三種是<b>轉化治療期間腫瘤變大或出現新病灶</b>。此時應：' +
          '① <b>換骨架</b>（oxaliplatin 骨架進展 → 改 irinotecan 骨架，反之亦然，依 COL-8 之線別）；' +
          '② <b>重新評估「轉換為可切除」是否仍是合理目標</b> —— 進展本身通常代表腫瘤生物學不利，' +
          '繼續以轉換為目標可能只是延後緩解治療；' +
          '③ 出現阻塞、出血或穿孔等原發灶症狀 → 依 COL-2 註 f 給局部緩解處置。' +
          '<b>此出口為 COL-7 原圖之外的實務補充。</b>'
        ]) +
        '<details class="rx-more"><summary>註記 Notes（標靶治療適用、FOLFOX + cetuximab）▸</summary><div class="rx-note"><ul class="rx-items">' +
          '<li><b>標靶治療（COL-7 註 e）</b>：僅適用於延續有良好新輔助反應者。</li>' +
          '<li><b>FOLFOX + <span class="drug">cetuximab</span>（COL-7 註 b）</b>：用於<b>潛在可切除</b>肝轉移之資料互相矛盾。</li>' +
        '</ul></div></details>' +
      '</div>' + systemicPanel());
  }

  /* ---------- D. 復發（COL-9）---------- */
  function renderRecurRec() {
    var s = ccSt;
    if (s.entry !== 'recur') return;
    var R = 'cc_recur_rec', F = 'cc_recur_fu';

    if (!s.rentry) { idleRec(R, F, '請選擇步驟 2（復發之呈現）'); return; }

    // 血清 CEA 連續升高 → workup
    if (s.rentry === 'cea') {
      result(R, F, 'rec-nonop', '血清 CEA 連續升高 → 復發檢查', [
        '<b>檢查</b>：理學檢查、<b>大腸鏡</b>、<b>胸部／腹部／骨盆 CT</b>。',
        '<b>影像陰性（Negative findings）</b> → <b>考慮 PET-CT</b>；並於 <b>3 個月後重新評估</b>胸部／腹部／骨盆 CT。若仍為陰性 → 持續追蹤；轉為陽性 → 依已證實之轉移處置。',
        '<b>影像陽性（Positive findings）</b> → 依<b>已證實之異時性轉移</b>處置（請於<b>步驟 2</b> 改選「已證實之異時性轉移」以取得治療建議）。'
      ], 'COL-9：Serial CEA elevation → workup（PE／colonoscopy／chest-abd-pelvic CT）；negative → consider PET-CT 並 3 個月後重新評估影像；positive → 依 documented metastases 處置。', null);
      return;
    }

    // 已證實之異時性轉移
    if (!s.rres) { idleRec(R, F, '請選擇步驟 3（異時性轉移之可切除性）'); return; }

    if (s.rres === 'r_res') {
      result(R, F, 'rec-elective', '可切除之異時性轉移（COL-9）', [
        '<b>考慮 PET-CT。</b>',
        '<b>兩條路線的術後系統性治療清單不同</b>（COL-9 原圖是兩個獨立的 ADJUVANT 方塊，不要合併看）：',
        '<span class="rx-h">路線一 · 直接切除及／或局部消融</span>　術後：' +
        '<span class="rx">FOLFOX</span>／<span class="rx">CapeOx</span>（<b>preferred</b>）± 標靶治療；' +
        '<b>或</b> <span class="drug">capecitabine</span>／<span class="rx">5-FU/leucovorin</span> ± 標靶治療。' +
        '<b>此路線的清單中沒有「觀察」。</b>',
        '<span class="rx-h">路線二 · 先新輔助化療 2–3 個月（COL-6）再切除／消融</span>　術後：' +
        '<span class="rx">FOLFOX</span>／<span class="rx">CapeOx</span> ± 標靶治療；' +
        '<b>或</b> <span class="drug">capecitabine</span>／<span class="rx">5-FU/leucovorin</span> ± 標靶治療；<b>或觀察（observation）</b>。' +
        '<b>此路線未標 preferred。</b>',
        '圍手術期治療總時程<b>不應超過 6 個月</b>。'
      ], 'COL-9：Documented metachronous metastases · Resectable → consider PET-CT → resection and/or local ablation 或 neoadjuvant chemo 2–3 mo（COL-6）then resection/ablation → adjuvant FOLFOX/CapeOx（preferred）± biologic 或 capecitabine/5-FU/LV ± biologic 或 observation。',
        'resected_m1');
      return;
    }

    // 不可切除 → 依 12 個月內是否曾用 FOLFOX/CAPEOX 決定骨架
    if (!s.rprior) { idleRec(R, F, '請選擇步驟 4（12 個月內是否曾用 FOLFOX／CAPEOX）'); return; }

    if (s.rprior === 'p_yes') {
      result(R, F, 'rec-nonop', '不可切除之異時性轉移 · 12 個月內曾用 FOLFOX／CAPEOX（COL-9）', [
        '<b>改採 irinotecan 為基礎之骨架</b>：<span class="rx">FOLFIRI-like</span> ± <span class="drug">bevacizumab</span>；' +
        '<b>或</b> ± <span class="drug">cetuximab</span>（<b>僅 KRAS／NRAS 野生型</b>）。',
        '<b>BRAF V600E 突變陽性</b> → <span class="drug">encorafenib</span> + <span class="drug">cetuximab</span>。',
        '<b>每 2 個月重新評估反應以判定可切除性</b>；轉為可切除 → 切除及／或局部消融（回步驟 3 之可切除路徑）。',
        '完整系統性治療線別選單見下方（COL-8）。'
      ], 'COL-9：Documented metachronous metastases · Unresectable · previous adjuvant FOLFOX/CAPEOX within 12 months → FOLFIRI-like ± bevacizumab 或 ± cetuximab［KRAS/NRAS WT］或 Encorafenib+cetuximab［BRAF V600E］→ reassess response q2mo → resectable/unresectable。' + '｜' + systemicNote,
        'palliative', systemicPanel());
      return;
    }

    result(R, F, 'rec-nonop', '不可切除之異時性轉移 · 未於 12 個月內用過 FOLFOX／CAPEOX（COL-9）', [
      '<b>依進展性／轉移性疾病之系統性治療（COL-8）</b>——完整線別選單見下方。',
      '<b>每 2 個月重新評估反應以判定可切除性</b>；轉為可切除 → 切除及／或局部消融（回步驟 3 之可切除路徑）。'
    ], 'COL-9：Documented metachronous metastases · Unresectable · no prior adjuvant FOLFOX/CAPEOX within 12 months → Systemic therapy（COL-8）→ reassess response q2mo。' + '｜' + systemicNote,
      'palliative', systemicPanel());
  }

  /* ---------- 事件 ---------- */
  function ccPick(key, val, btn) {
    ccSel(btn);
    var s = ccSt;
    if (key === 'entry') {
      s.entry = val;
      s.pfind = s.pmorph = s.pres = s.tn = s.s2 = s.msite = s.mres = s.rentry = s.rres = s.rprior = null;
      ccClearSel(['cc_s2p', 'cc_s3p', 'cc_s2r', 'cc_s3r', 'cc_s4r3', 'cc_s4r4', 'cc_s2m', 'cc_s3m',
        'cc_s2rec', 'cc_s3rec', 'cc_s4rec']);
    } else if (key === 'rentry') {
      s.rentry = val; s.rres = s.rprior = null;
      ccClearSel(['cc_s3rec', 'cc_s4rec']);
    } else if (key === 'rres') {
      s.rres = val; s.rprior = null;
      ccClearSel(['cc_s4rec']);
    } else if (key === 'rprior') {
      s.rprior = val;
    } else if (key === 'pfind') {
      s.pfind = val; s.pmorph = null;
      ccClearSel(['cc_s3p']);
    } else if (key === 'pmorph') { s.pmorph = val; }
    else if (key === 'pres') {
      s.pres = val; s.tn = s.s2 = null;
      ccClearSel(['cc_s3r', 'cc_s4r3', 'cc_s4r4']);
    } else if (key === 'tn') {
      s.tn = val; s.s2 = null;
      ccClearSel(['cc_s4r3', 'cc_s4r4']);
    } else if (key === 's2') { s.s2 = val; }
    else if (key === 'msite') {
      s.msite = val; s.mres = null;
      ccClearSel(['cc_s3m']);
    } else if (key === 'mres') { s.mres = val; }
    ccRender();
  }

  function ccReset() {
    for (var k in ccSt) { if (ccSt.hasOwnProperty(k)) ccSt[k] = null; }
    var root = document.getElementById('ccPath');
    if (root) root.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    ['cc_polyp_fu', 'cc_resect_fu', 'cc_adj_fu', 'cc_meta_fu', 'cc_recur_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    ccRender();
  }

  function initColonPathway() { ccReset(); }

  // 匯出
  global.colonPathwayHTML = colonPathwayHTML;
  global.initColonPathway = initColonPathway;
  global.ccPick = ccPick;
  global.ccReset = ccReset;
})(window);
