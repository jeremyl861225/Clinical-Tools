/* ============================================================
   食道癌治療互動決策流程 Esophageal Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 食道癌診療指引 版次 17（2026/06/16）
   （NTUH Clinical Guidelines of Esophageal Cancer in Oncology, V.1 2026）
   流程頁面對應：投影片 3（work-up／分流）、4（可切除且體能可）、
   5（T1bN1~3 或 T2-T4a 依組織型態）、6（體能不可／不可切除 T4b）、
   7（Stage IVB）、8（局部區域全身性治療原則）、9（R/M ESCC）、10（R/M EAC）；
   放射治療劑量取自同份指引「Radiation Therapy Guidelines」2025 Version 1.0。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var ecSt = {
    stage: null,     // loco | ivb
    fit: null,       // fit_res | unfit | unres
    tclass: null,    // tis_t1a | t1bn0 | adv
    histo: null,     // escc | eac
    aortic: null,    // aortic_yes | aortic_no
    reassess: null,  // re_res | re_unres
    ps: null         // ps_le2 | ps_ge3
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ecPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 版面 HTML ---------- */
  function esophPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院食道癌診療指引 版次 17（2026/06/16）</b>之互動決策流程。逐步點選以取得對應處置、化放療療程與後續評估方式。<b>臨床分期依 AJCC 第 8 版（2018 年版手冊）</b>。</p>';
    h += '<div class="onc-path" id="ecPath">';

    // Step 1 — 臨床分期
    h += step('ec_s1', '1', '臨床分期（完成 work-up 後）',
      opt('stage', 'loco', 'Stage I～IVA　局部區域性', 'Locoregional disease') +
      opt('stage', 'ivb', 'Stage IVB　轉移性', 'Metastatic disease'),
      '<div class="note"><b>必要檢查（★ 為可決定臨床分期、應於治療前完成者）：</b>病史與理學檢查、ESCC 或 EAC 之病理診斷、EGD、<b>★胸部 CT</b>（必要時加做腦／頸／腹／骨盆 CT）、<b>★PET-CT（優先）或 PET</b>（無 M1 證據時）、CBC 與生化、<b>★EUS</b>（無 M1 證據時）、<b>★支氣管鏡</b>（下段胸腔／隆突以下食道癌非必要）、耳鼻喉科會診、腹腔鏡（無 M1 證據且腫瘤位於 GE junction 時可選）、肺功能檢查（可切除者）、上消化道鋇劑攝影（可選）。<br><b>另需：</b>多專科團隊評估、營養評估（必要時放置鼻胃管或空腸造廔管提供營養支持）。</div>');

    /* ===================== 局部區域性 Stage I～IVA ===================== */
    h += '<div id="ec_loco" class="hidden">';
    h += conn('ec_c2');
    h += step('ec_s2', '2', '可切除性與體能適合度',
      opt('fit', 'fit_res', '可切除 · 體能可耐受手術', 'Resectable, medically fit（Stage I～IVA，T4b 除外）') +
      opt('fit', 'unfit', '可切除 · 體能無法耐受手術', 'Resectable, medically unfit') +
      opt('fit', 'unres', '不可切除（T4b）', 'Unresectable — 侵犯主動脈、椎體或氣管'),
      '<div class="note"><b>T4a</b>＝侵犯胸膜、心包膜、奇靜脈、橫膈或腹膜（可切除）；<b>T4b</b>＝侵犯其他鄰近構造，如主動脈、椎體或氣管（不可切除）。</div>');

    // 2-1 可切除且體能可 → 腫瘤分類
    h += '<div id="ec_res" class="hidden">';
    h += conn('ec_c3');
    h += step('ec_s3', '3', '腫瘤分類 Tumor classification',
      opt('tclass', 'tis_t1a', 'Tis 或 T1a', '高度異生／侷限於黏膜層') +
      opt('tclass', 't1bn0', 'T1b N0', '侵犯黏膜下層、無淋巴結轉移') +
      opt('tclass', 'adv', 'T1b N1～3　或　T2–T4a 任何 N', '局部進展；需再依組織型態分流'));

    h += connH('ec_c3b');
    h += step('ec_s3b', '3b', '組織型態 Histology',
      opt('histo', 'escc', 'ESCC　食道鱗狀細胞癌', 'Esophageal squamous cell carcinoma') +
      opt('histo', 'eac', 'EAC　食道腺癌', 'Esophageal adenocarcinoma'));
    h = h.replace('id="ec_s3b"', 'id="ec_s3b" class="hidden"');
    h += '</div>'; // ec_res

    // 2-3 不可切除 T4b → 是否侵犯主動脈
    h += '<div id="ec_unres" class="hidden">';
    h += conn('ec_c4');
    h += step('ec_s4', '3', '是否合併主動脈侵犯？',
      opt('aortic', 'aortic_yes', '合併主動脈侵犯', 'With aortic involvement → 可考慮 TEVAR') +
      opt('aortic', 'aortic_no', '無主動脈侵犯', '侵犯椎體、氣管等其他構造'));

    h += connH('ec_c4b');
    h += step('ec_s4b', '3b', 'TEVAR 後再評估 Reassessment',
      opt('reassess', 're_res', '轉為可切除且體能可耐受', 'Resectable and medically fit') +
      opt('reassess', 're_unres', '仍不可切除或體能不可', 'Unresectable or medically unfit'));
    h = h.replace('id="ec_s4b"', 'id="ec_s4b" class="hidden"');
    h += '</div>'; // ec_unres

    h += rec('ec_loco_rec', '建議處置 · 局部區域性 Locoregional');
    h += '<div class="flow-fu hidden" id="ec_loco_fu"></div>';
    h += '</div>'; // ec_loco

    /* ===================== Stage IVB ===================== */
    h += '<div id="ec_meta" class="hidden">';
    h += conn('ec_mc2');
    h += step('ec_s5', '2', '體能狀態 ECOG Performance status',
      opt('ps', 'ps_le2', 'ECOG PS ≤ 2', '可接受抗癌治療') +
      opt('ps', 'ps_ge3', 'ECOG PS ≥ 3', '體能不佳'));
    h += rec('ec_meta_rec', '建議處置 · 轉移性 Stage IVB');
    h += '<div class="flow-fu hidden" id="ec_meta_fu"></div>';
    h += '</div>'; // ec_meta

    h += '<div class="flow-reset"><button class="btn-reset" onclick="ecReset()">重置</button></div>';
    h += '</div>'; // ecPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function ecSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function ecShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function ecClearSel(ids) {
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

  /* ---------- 後續評估／支持治療區塊 ---------- */
  /* 注意：本指引（版次 17）全文並無術後監測（surveillance）時程章節——
     頁 7–16 為放射治療指引。故此區塊只放本指引確實載明之內容，
     不自行補上追蹤間隔。 */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">後續處置 Follow-up（本指引所載）</div><ul class="fu-list">' +
        '<li><b>術後放射治療適應症</b>：肉眼可見殘存病灶；切緣過近或陽性（吻合處或環周）；病理淋巴結陽性及／或包膜外侵犯（可選）。</li>' +
        '<li><b>術後放射治療劑量</b>：≥1.8～2.5 Gy／次，每週 5 次；未接受術前放療者累積 50–70 Gy，已接受術前放療者累積 60–70 Gy。</li>' +
        '<li><b>術前化放療 + 食道切除 + 淋巴結廓清後，若為 R0 切除但仍有殘存病灶</b> → 輔助 <span class="drug">nivolumab</span>（CheckMate 577）。</li>' +
        '<li>復發時依「復發／轉移性食道癌全身性治療原則」處置（見 Stage IVB 分支）。</li>' +
        '<li><span class="fu-gap">本院食道癌診療指引未訂定術後定期追蹤時程（無 surveillance 章節）；追蹤間隔請依主治團隊與院內規定。</span></li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">後續評估與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>持續評估治療反應、毒性與體能狀態；疾病進展或無法耐受時轉換全身性治療或臨床試驗。</li>' +
        '<li><b>營養</b>：全程營養評估，必要時放置鼻胃管或空腸造廔管提供營養支持（work-up 階段即應納入）。</li>' +
        '<li><b>局部症狀</b>：可考慮其他抗癌治療，包括放射治療、手術、局部消融治療等。</li>' +
        '<li><b>免疫治療副作用</b>：照護原則請詳見台大醫院<b>「癌症免疫治療藥物照護原則」</b>。</li>' +
        '<li>體能持續惡化（ECOG ≥3）→ 最佳支持治療（BSC）及／或安寧療護。</li>' +
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

  /* ---------- 放射治療劑量（RT Guidelines 2025 v1.0）---------- */
  /* 這兩段常接在條列句尾，故自帶前置換行——否則 .rx-h 會與前句擠在同一行，
     在窄螢幕上讀起來像同一句話。 */
  var rtPreop = '<br><span class="rx-h">術前同步化放療 劑量</span><br>1.8–2.25 Gy／次，每週 5 次；<b>總劑量 40–50.4 Gy</b>。適應症：可手術之局部進展疾病。';
  var rtDefinitive = '<br><span class="rx-h">根治性同步化放療 劑量</span><br>≥1.8–2.5 Gy／次，每週 5 次；<b>累積總劑量 50–70 Gy</b>。<b>頸段食道癌</b>可能適合 >50 Gy。根治性 CCRT 後若技術可行，可考慮<b>近接治療（brachytherapy）加強劑量</b>：4–5 Gy／次共 2 次，處方於中央位置深 1cm 或食道黏膜下 5mm，每週 1 次，近接治療期間避免同步化療。<br>適應症：無法手術／不可切除疾病、局部進展疾病、全身性治療反應良好或有局部區域症狀之轉移性疾病。';

  /* ---------- 全身性治療（局部區域性，投影片 8）---------- */
  function locoSystemic() {
    return [
      '<span class="rx-h">術前或根治性同步化放療之化療處方</span><ul>' +
        '<li><span class="rx">platinum／5-FU</span>（<span class="drug">cisplatin</span> 或 <span class="drug">carboplatin</span> ＋ <span class="drug">5-fluorouracil</span>）</li>' +
        '<li><span class="rx">taxane／platinum</span>（<span class="drug">paclitaxel</span> ＋ <span class="drug">cisplatin</span>／<span class="drug">carboplatin</span>）</li>' +
        '<li><b>臨床試驗處方（優先建議參加臨床試驗）</b></li>' +
        '</ul>',
      '<span class="rx-h">圍手術期化療處方</span><br><span class="rx">docetaxel／oxaliplatin／5-fluorouracil</span>（<span class="drug">docetaxel</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">5-FU</span>）',
      '<span class="rx-h">術前化療處方</span><ul>' +
        '<li><span class="rx">docetaxel／cisplatin／5-fluorouracil</span>（DCF 三合一）</li>' +
        '<li><b>臨床試驗處方（優先建議參加臨床試驗）</b></li>' +
        '</ul>',
      '<span class="rx-h">輔助治療</span><br>術前化放療 → 食道切除 + 淋巴結廓清後，<b>R0 切除但仍有殘存病灶</b>者：<span class="drug">nivolumab</span>（CheckMate 577）。',
      '<span class="rx-note">化療處方之選擇應依病人特性（體能狀態與治療目標）個別化。</span>'
    ];
  }

  /* ---------- 全身性治療（復發／轉移，投影片 9–10）---------- */
  function metaSystemic() {
    return [
      '<span class="rx-h">ESCC 鱗狀細胞癌</span>　<span class="rx-sub">一線建議：化療併用免疫治療（優先參加臨床試驗；可檢測 PD-L1 表現）</span><ul>' +
        '<li><b>化療處方可為</b>：<span class="rx">platinum／5-FU</span>；<span class="rx">taxane／platinum／5-FU</span>；<span class="rx">methotrexate／cisplatin／5-FU</span>（MP-HDFL，本院處方）。</li>' +
        '<li><b>免疫治療處方可為</b>：<span class="drug">nivolumab</span>；<span class="drug">pembrolizumab</span>；<span class="drug">tislelizumab</span>；<span class="drug">nivolumab</span> ＋ <span class="drug">ipilimumab</span>。</li>' +
        '</ul>',
      '<span class="rx-h">EAC 腺癌</span><br>包括化療、免疫治療或標靶治療在內之全身性治療藥物選擇，<b>依「晚期胃腺癌」之建議辦理</b>（見本站胃癌條目之轉移性治療）。',
      '<span class="rx-note">多數復發或轉移性食道癌為無法治癒之疾病；全身性治療可能改善存活及／或症狀。處方選擇應依病人體能狀態、器官功能、腫瘤負荷等臨床參數個別化。</span>'
    ];
  }

  var immunoNote = '免疫治療相關副作用及照護原則，請詳見台大醫院<b>「癌症免疫治療藥物照護原則」</b>。';

  /* ---------- 主渲染 ---------- */
  function ecRender() {
    var s = ecSt;

    ecShow('ec_loco', s.stage === 'loco');
    ecShow('ec_c2', s.stage === 'loco');
    ecShow('ec_meta', s.stage === 'ivb');
    ecShow('ec_mc2', s.stage === 'ivb');

    var res = (s.fit === 'fit_res');
    ecShow('ec_res', res);
    ecShow('ec_c3', res);
    var adv = res && s.tclass === 'adv';
    ecShow('ec_c3b', adv);
    ecShow('ec_s3b', adv);

    var unres = (s.fit === 'unres');
    ecShow('ec_unres', unres);
    ecShow('ec_c4', unres);
    var tevar = unres && s.aortic === 'aortic_yes';
    ecShow('ec_c4b', tevar);
    ecShow('ec_s4b', tevar);

    renderLocoRec();
    renderMetaRec();
  }

  /* 不可切除／體能不可共用之非手術四選項（投影片 6） */
  function nonOperativeOptions() {
    return [
      '<b>同步化放療 Chemoradiotherapy</b>　' + rtDefinitive,
      '<b>放射治療 Radiotherapy</b>（單獨放療）',
      '<b>全身性治療 Systemic therapy</b>　—　處方見「復發／轉移性食道癌全身性治療原則」（本指引第 9–10 頁）：',
      '<span class="rx-h">ESCC</span> 化療併用免疫治療為一線建議：化療 <span class="rx">platinum／5-FU</span>、<span class="rx">taxane／platinum／5-FU</span>、<span class="rx">methotrexate／cisplatin／5-FU</span>；免疫 <span class="drug">nivolumab</span>／<span class="drug">pembrolizumab</span>／<span class="drug">tislelizumab</span>／<span class="drug">nivolumab</span>＋<span class="drug">ipilimumab</span>。<span class="rx-h">EAC</span> 依晚期胃腺癌之建議。',
      '<b>最佳支持治療及／或安寧療護</b> Best supportive care and/or hospice care'
    ];
  }

  function renderLocoRec() {
    var s = ecSt;
    if (s.stage !== 'loco') return;
    var R = 'ec_loco_rec', F = 'ec_loco_fu';

    if (!s.fit) { idleRec(R, F, '請選擇步驟 2（可切除性與體能適合度）'); return; }

    /* --- 可切除 · 體能無法耐受手術（投影片 6 上半）--- */
    if (s.fit === 'unfit') {
      result(R, F, 'rec-nonop', '可切除但體能無法耐受手術', [
        '<b>Tis 或 T1a</b> → <b>內視鏡局部治療</b>（endoscopic local therapy）。',
        '<b>T1b～T4b 任何 N</b> → 下列選項擇一：',
        '<b>① 同步化放療</b>　' + rtDefinitive,
        '<b>② 放射治療</b>（單獨放療）',
        '<b>③ 全身性治療</b>（處方見本指引第 9–10 頁，同「復發／轉移」原則）',
        '<b>④ 最佳支持治療及／或安寧療護</b>'
      ], '本指引投影片 6：Stage I～IVA（T4b 除外）、resectable、medically unfit。原圖之腫瘤分類欄寫作「T1b～T4b Any N」，與標題「except T4b」略有出入，引用時請留意。', 'palliative');
      return;
    }

    /* --- 不可切除 T4b（投影片 6 下半）--- */
    if (s.fit === 'unres') {
      if (!s.aortic) { idleRec(R, F, '請選擇步驟 3（是否合併主動脈侵犯）'); return; }

      if (s.aortic === 'aortic_no') {
        result(R, F, 'rec-nonop', '不可切除（T4b，無主動脈侵犯）：非手術治療', nonOperativeOptions(),
          '本指引投影片 6：不可切除（T4b）之非手術治療選項。原圖僅就「合併主動脈侵犯」者畫出 TEVAR 路徑，其餘 T4b 逕採上列非手術選項。', 'palliative');
        return;
      }

      // 合併主動脈侵犯 → TEVAR
      if (!s.reassess) {
        result(R, F, 'rec-nonop', 'T4b 合併主動脈侵犯 → 胸主動脈血管內支架（TEVAR）', [
          '<b>Endovascular thoracic aortic stent graft（TEVAR）</b>：先行主動脈支架置放，再依後續評估決定治療路徑。',
          'TEVAR 後<b>重新評估可切除性與體能</b>（見下方步驟 3b）。'
        ], '本指引投影片 6：Unresectable（T4b）— WITH AORTIC INVOLVEMENT → TEVAR。', null);
        return;
      }
      if (s.reassess === 're_res') {
        result(R, F, 'rec-elective', 'TEVAR 後轉為可切除且體能可 → 依「可切除」路徑（局部進展）處置', [
          '重新評估為 <b>RESECTABLE and medically fit</b> → <b>比照可切除之局部進展疾病</b>（T1b N1～3 或 T2–T4a 任何 N）處置。',
          '亦即依組織型態（ESCC／EAC）選擇：術前化放療或新輔助臨床試驗（優先）＋食道切除＋淋巴結廓清 ±輔助 <span class="drug">nivolumab</span>；根治性同步化放療；食道切除＋淋巴結廓清；ESCC 另可選新輔助三合一化療＋食道切除；EAC 另可選圍手術期化療＋食道切除＋淋巴結廓清。',
          '請於步驟 2 改選「可切除 · 體能可耐受手術」以展開完整選項。'
        ], '本指引投影片 6：Reassessment RESECTABLE and medically fit → Treat as resectable section（locally advanced）。', null);
        return;
      }
      result(R, F, 'rec-nonop', 'TEVAR 後仍不可切除或體能不可 → 非手術治療', nonOperativeOptions(),
        '本指引投影片 6：Reassessment UNRESECTABLE or medically unfit → 非手術治療選項。', 'palliative');
      return;
    }

    /* --- 可切除 · 體能可耐受手術（投影片 4、5）--- */
    if (!s.tclass) { idleRec(R, F, '請選擇步驟 3（腫瘤分類）'); return; }

    if (s.tclass === 'tis_t1a') {
      result(R, F, 'rec-elective', 'Tis 或 T1a：兩項選擇', [
        '<b>① 內視鏡局部治療</b>　Endoscopic local therapy',
        '<b>② 食道切除 + 淋巴結廓清</b>　Esophagectomy + lymph node dissection'
      ], '本指引投影片 4：Tis or T1a → 上列兩項並列，未分組織型態。', 'curative');
      return;
    }

    if (s.tclass === 't1bn0') {
      result(R, F, 'rec-elective', 'T1b N0：三項選擇', [
        '<b>① 內視鏡局部治療 + 淋巴結廓清</b>　Endoscopic local therapy + lymph node dissection',
        '<b>② 食道切除 + 淋巴結廓清</b>　Esophagectomy + lymph node dissection',
        '<b>③ 根治性同步化放療</b>　Definitive chemoradiotherapy　' + rtDefinitive
      ], '本指引投影片 4：T1bN0 為<b>三項並列選項</b>，且<b>不依組織型態分流</b>（組織型態分流出現在下一列的 T1b N1～3／T2–T4a）。', 'curative');
      return;
    }

    // adv：T1b N1~3 或 T2-T4a 任何 N → 依組織型態（投影片 5）
    if (!s.histo) { idleRec(R, F, '請選擇步驟 3b（組織型態 ESCC／EAC）'); return; }

    if (s.histo === 'escc') {
      result(R, F, 'rec-elective', 'ESCC · T1b N1～3 或 T2–T4a 任何 N：四項選擇', [
        '<b>① 術前化放療 或 新輔助臨床試驗（優先）</b> ＋ 食道切除 ＋ 淋巴結廓清 ±輔助 <span class="drug">nivolumab</span>*　' + rtPreop,
        '<b>② 根治性同步化放療</b>　Definitive chemoradiotherapy　' + rtDefinitive,
        '<b>③ 食道切除 + 淋巴結廓清</b>　Esophagectomy + lymph node dissection',
        '<b>④ 新輔助三合一化療 + 食道切除</b>　Neoadjuvant triplet chemotherapy + esophagectomy　<span class="rx">docetaxel／cisplatin／5-FU</span>（DCF；JCOG1109 NExT）—— <b>2026 年版新增</b>',
        '<span class="rx-note">* 輔助 <span class="drug">nivolumab</span> 適用於<b>術後仍有殘存病灶且為 R0 切除</b>者（CheckMate 577）。</span>'
      ].concat(locoSystemic()),
        '本指引投影片 5（ESCC）：四項並列。第 ④ 項「新輔助三合一化療＋食道切除」於原圖以紅字標示，屬 2026 修訂新增之 ESCC 治療選項，且<b>僅列於 ESCC，不列於 EAC</b>。', 'curative');
      return;
    }

    result(R, F, 'rec-elective', 'EAC · T1b N1～3 或 T2–T4a 任何 N：三項選擇', [
      '<b>① 術前化放療 或 新輔助臨床試驗（優先）</b> ＋ 食道切除 ＋ 淋巴結廓清 ±輔助 <span class="drug">nivolumab</span>*　' + rtPreop,
      '<b>② 圍手術期化療 + 食道切除 + 淋巴結廓清</b>　<span class="rx">docetaxel／oxaliplatin／5-FU</span>（ESOPEC）',
      '<b>③ 食道切除 + 淋巴結廓清</b>　Esophagectomy + lymph node dissection',
      '<span class="rx-note">* 輔助 <span class="drug">nivolumab</span> 適用於<b>術後仍有殘存病灶且為 R0 切除</b>者（CheckMate 577）。</span>'
    ].concat(locoSystemic()),
      '本指引投影片 5（EAC）：三項並列。EAC <b>不含</b>「新輔助三合一化療」該項（該項僅列於 ESCC）。', 'curative');
  }

  function renderMetaRec() {
    var s = ecSt;
    if (s.stage !== 'ivb') return;
    var R = 'ec_meta_rec', F = 'ec_meta_fu';

    if (!s.ps) { idleRec(R, F, '請選擇步驟 2（ECOG 體能狀態）'); return; }

    if (s.ps === 'ps_ge3') {
      result(R, F, 'rec-urgent', 'Stage IVB · ECOG PS ≥ 3：最佳支持治療／安寧療護', [
        '<b>最佳支持治療及／或安寧療護</b>　Best supportive care and/or hospice care'
      ], '本指引投影片 7：Stage IVB、ECOG performance status ≧3 → BSC and/or hospice care（無其他並列選項）。', 'palliative');
      return;
    }

    result(R, F, 'rec-nonop', 'Stage IVB · ECOG PS ≤ 2：四項選擇', [
      '<b>① 全身性治療之臨床試驗（優先建議）</b>　Clinical trials of systemic therapy（preferred）—— 原圖以紅字標示為優先',
      '<b>② 全身性治療</b>　Systemic therapy（處方見下）',
      '<b>③ 其他抗癌治療</b>　包括放射治療、手術、局部消融治療等',
      '<b>④ 最佳支持治療及／或安寧療護</b>'
    ].concat(metaSystemic()),
      '本指引投影片 7（分流）與第 9–10 頁（全身性治療原則）。', 'palliative');
  }

  /* ---------- 事件 ---------- */
  function ecPick(key, val, btn) {
    ecSel(btn);
    var s = ecSt;
    if (key === 'stage') {
      s.stage = val;
      s.fit = s.tclass = s.histo = s.aortic = s.reassess = s.ps = null;
      ecClearSel(['ec_s2', 'ec_s3', 'ec_s3b', 'ec_s4', 'ec_s4b', 'ec_s5']);
    } else if (key === 'fit') {
      s.fit = val; s.tclass = s.histo = s.aortic = s.reassess = null;
      ecClearSel(['ec_s3', 'ec_s3b', 'ec_s4', 'ec_s4b']);
    } else if (key === 'tclass') {
      s.tclass = val; s.histo = null;
      ecClearSel(['ec_s3b']);
    } else if (key === 'histo') { s.histo = val; }
    else if (key === 'aortic') {
      s.aortic = val; s.reassess = null;
      ecClearSel(['ec_s4b']);
    } else if (key === 'reassess') { s.reassess = val; }
    else if (key === 'ps') { s.ps = val; }
    ecRender();
  }

  function ecReset() {
    for (var k in ecSt) { if (ecSt.hasOwnProperty(k)) ecSt[k] = null; }
    var root = document.getElementById('ecPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['ec_loco_fu', 'ec_meta_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    ecRender();
  }

  function initEsophPathway() { ecReset(); }

  // 匯出
  global.esophPathwayHTML = esophPathwayHTML;
  global.initEsophPathway = initEsophPathway;
  global.ecPick = ecPick;
  global.ecReset = ecReset;
})(window);
