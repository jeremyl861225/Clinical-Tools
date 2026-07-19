/* ============================================================
   鼻咽癌治療互動決策流程 Nasopharyngeal Carcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 鼻咽癌診療指引
   　　　　　文件編號 50710-3-000012 版次 17（2026/06/16）
   　　　　　含附件「鼻咽癌放射治療指引」（p.11–14）
   期別依 AJCC／UICC 第 9 版（TNM-9，2025 年起適用）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var npSt = {
    stage: null,   // ia | adv | iv | rec
    ind: null,     // ind_pref | ccrt      （IB–III：是否優先引導化療）
    neck: null,    // ncr | nres           （治療後頸部反應）
    mets: null,    // oligo | poly         （第 IV 期轉移病灶數）
    site: null     // np | neck            （復發部位）
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="npPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function npcPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院鼻咽癌診療指引 版次 17</b>（2026/06/16，文件編號 50710-3-000012）之路徑圖與附件「鼻咽癌放射治療指引」；期別依 <b>AJCC／UICC 第 9 版</b>。逐步點選以取得對應建議處置、放射治療處方、藥物療程與追蹤方式。</p>';
    h += '<div class="onc-path" id="npPath">';

    // Step 1 — 臨床期別
    h += step('np_s1', '1', '臨床期別（AJCC 9th）／臨床情境',
      opt('stage', 'ia', '第 IA 期（T1–2 N0 M0）', '無淋巴結轉移之早期病灶') +
      opt('stage', 'adv', '第 IB–III 期（M0）', 'T1–2 N1／N2、T3 N0–2、T4 任何 N、任何 T N3') +
      opt('stage', 'iv', '第 IV 期（M1a／M1b）', '有遠端轉移') +
      opt('stage', 'rec', '局部／區域復發 Recurrent', '治療後鼻咽部或頸部復發'),
      '<div class="note">治療前評估：頭頸部 CT／MRI（原發部位、顱底與腦神經侵犯）＋胸部 X 光或胸部 CT；' +
      '腹部超音波／CT、骨掃描為次要（懷疑肝或骨轉移時）；<b>PET-CT</b> 用於評估全身轉移，常用於 Stage III–IV 或高風險病人（已做 PET-CT 通常不需另排骨掃描）。</div>');

    /* ===================== 第 IA 期 ===================== */
    h += '<div id="np_ia" class="hidden">';
    h += conn('np_c_ia');
    h += rec('np_ia_rec', '建議處置 · 第 IA 期');
    h += '<div class="flow-fu hidden" id="np_ia_fu"></div>';
    h += '</div>';

    /* ===================== 第 IB–III 期 ===================== */
    h += '<div id="np_adv" class="hidden">';
    h += conn('np_c_adv');
    h += step('np_s2', '2', 'T／N 組合 → 是否優先給予引導化療',
      opt('ind', 'ind_pref', '優先引導化療 → 同步化放療', 'T3 N1–3、T4 任何 N、或任何 T N2–3') +
      opt('ind', 'ccrt', '直接同步化放療（CCRT）', '其餘 IB–III（T1–2 N1、T3 N0）'),
      '<div class="note">附件放射治療指引：<b>Induction chemotherapy（preferred if T3, N1-3, or T4, any N, or Any T, N2-3）</b>。</div>');

    h += rec('np_adv_rec', '建議處置 · 第 IB–III 期');

    h += connH('np_c_neck');
    h += step('np_s3', '3', '治療後頸部反應（路徑圖第二列）',
      opt('neck', 'ncr', '頸部臨床完全緩解', 'Neck: complete clinical response') +
      opt('neck', 'nres', '頸部殘存腫瘤', 'Neck: residual tumor'));
    h = h.replace('id="np_s3"', 'id="np_s3" class="hidden"');

    h += '<div class="flow-fu hidden" id="np_adv_fu"></div>';
    h += '</div>';

    /* ===================== 第 IV 期（M1） ===================== */
    h += '<div id="np_iv" class="hidden">';
    h += conn('np_c_iv');
    h += step('np_s4', '2', '遠端轉移病灶數（AJCC 9th M 分類）',
      opt('mets', 'oligo', '寡轉移 M1a（≤3 個病灶）→ 第 IVA 期', '可考慮積極局部治療') +
      opt('mets', 'poly', '多發轉移 M1b（>3 個病灶）→ 第 IVB 期', '以系統性治療為主'));
    h += rec('np_iv_rec', '建議處置 · 第 IV 期');
    h += '<div class="flow-fu hidden" id="np_iv_fu"></div>';
    h += '</div>';

    /* ===================== 復發 ===================== */
    h += '<div id="np_rec" class="hidden">';
    h += conn('np_c_rec');
    h += step('np_s5', '2', '復發部位',
      opt('site', 'np', '鼻咽部復發 Local (nasopharynx)', '') +
      opt('site', 'neck', '頸部殘留腫塊或復發 Regional (neck)', ''));
    h += rec('np_rec_rec', '建議處置 · 復發 Recurrent');
    h += '<div class="flow-fu hidden" id="np_rec_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="npReset()">重置</button></div>';
    h += '</div>'; // npPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function npSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function npShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function npClearSel(ids) {
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

  /* ---------- 追蹤區塊（指引第十節；口腔保健第四節之四）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（指引第十節）</div><ul class="fu-list">' +
        '<li>復發約 <b>80% 發生於治療後 2 年內</b>，此後逐年遞減；滿 5 年後復發機率 &lt;5%。</li>' +
        '<li>回診頻率：前 2 年 <b>每 1–3 個月</b>一次；2 年後 <b>每 3–6 個月</b>一次。兩次約診間如有不適應儘速回診。</li>' +
        '<li>例行檢查：鼻後鏡或<b>鼻咽內視鏡</b>、血液檢驗、<b>胸部 X 光</b>。</li>' +
        '<li>特殊影像（CT、MRI、骨骼同位素掃描、肝臟超音波）依臨床需要安排；治療完成愈久，檢查密集度與項目愈少。</li>' +
        '<li>重點追蹤部位：鼻咽本身及鄰近組織、頸部淋巴結、骨骼、肺臟、肝臟。</li>' +
        '<li><b>口腔衛生</b>：放射治療前會診牙科（部分病人需拔牙）；治療期間以軟毛牙刷刷牙，一般牙膏刺激太大時改用氟膠；急性口內潰瘍請醫師或牙醫師開藥緩解；開口肌有纖維化疑慮者<b>長期每日做開口練習</b>；治療後部分病人需長期使用氟膠及牙托並定期牙科回診。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>定期評估治療反應與毒性（影像視需要）；持續追蹤體能狀態與症狀控制。</li>' +
        '<li>骨轉移：疼痛以放射治療及／或藥物處理；有<b>骨折或脊髓壓迫危險</b>時可考慮加做手術治療。</li>' +
        '<li>肺／肝轉移：以化學治療為主，部分病人化療後可有長期緩解；特殊情況下較局部之病灶可考慮放射治療或手術。</li>' +
        '<li>疾病進展 → 次線系統性治療、免疫檢查點抑制劑或<b>臨床試驗</b>。</li>' +
        '<li><b>安寧緩和治療</b>（指引第七節）：疾病進展快速之末期病人，經醫師判定醫療上無法治癒且簽署安寧緩和醫療意願書者，得依安寧緩和醫療條例實施。</li>' +
        '<li>免疫治療副作用之照護，另見台大醫院「癌症免疫治療藥物照護原則」。</li>' +
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

  /* ---------- 放射治療處方（附件 p.11–14）---------- */
  function rtDetailsHtml() {
    var oar = [
      ['脊髓 Spinal cord', 'Max ≤ 50 Gy'],
      ['腮腺 Parotid glands', 'Mean &lt; 26 Gy（至少一側）或 V30Gy &lt; 50%'],
      ['眼／視網膜 Eyes (retina)', '≤ 60 Gy'],
      ['腦幹 Brainstem', '≤ 60 Gy'],
      ['視神經與視交叉 Optic nerves &amp; chiasm', '≤ 56 Gy'],
      ['耳 Ear', 'Mean ≤ 50 Gy']
    ];
    var t = '<details class="kps-details"><summary>正常組織劑量限制 OAR constraints ▸</summary><table>';
    oar.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    t += '</table></details>';
    return t;
  }

  function rtLines() {
    return [
      '<span class="rx-h">照射技術 Technique</span><br><b>IMRT 或 VMAT</b>（或其他新式技術）；直線加速器 ≥6 MV photon 或 TomoTherapy 6 MV。每日一次、每週 5 次。仰臥、雙臂置於身側，以<b>熱塑面罩</b>固定（可加用肩部固定裝置）。<b>質子治療為選項</b>（optional，細節見放射腫瘤部技術規範）。',
      '<span class="rx-h">標靶體積 Target volumes</span><br><b>CTV_H</b>＝所有 CT／MRI／PET、臨床與內視鏡所見之大體病灶，含明顯陽性淋巴結（&gt;1cm 或中央壞死）；<b>CTV_Int</b>＝鄰近大體腫瘤或淋巴結之高風險區；<b>CTV_L</b>＝鄰近之顯微風險區與風險淋巴結群。<b>PTV margin 0.2–0.5 cm</b>。',
      '<span class="rx-h">處方劑量 Dose</span><br><b>CTV_H ≥ 66 Gy</b>（≥2.0 Gy/fx）｜<b>CTV_Int ≥ 50 Gy</b>｜<b>CTV_L ≥ 50 Gy</b>。指引本文所載體外放射劑量約 <b>70 Gy</b>（第一期）至 <b>70–74 Gy</b>（第三、四期），每天 2.0–2.12 Gy，連續 6–7 週。<br>計畫限制：95% PTV 達處方劑量為佳；PTV 中劑量 ≥110% 處方劑量之體積不超過 5%（可達成時以 &lt;3% 為佳）。' + rtDetailsHtml()
    ];
  }

  /* ---------- 系統性治療（指引第六節）---------- */
  var systemicNote =
    '指引第六節：複方化學治療之緩解率約 30–50%。<span class="drug">bevacizumab</span> 可合併化療用於鼻咽癌，惟<b>可能增加出血風險</b>，使用時需特別注意。免疫檢查點抑制劑之副作用照護見台大醫院「癌症免疫治療藥物照護原則」。健保給付與適應症請依最新公告核對。';

  function systemicLines() {
    return [
      '<span class="rx-h">化學治療 Chemotherapy</span>　<span class="rx-sub">指引列名藥物；依臨床狀況與副作用權衡，可單方或複方</span><br>' +
        '<span class="drug">5-FU</span><span class="drug">UFUR</span><span class="drug">Xeloda</span><span class="drug">cisplatin</span><span class="drug">methotrexate</span><span class="drug">anthracyclines</span><span class="drug">mitomycin C</span><span class="drug">vinorelbine</span><span class="drug">gemcitabine</span><span class="drug">paclitaxel</span><br>' +
        '需留意之副作用：血球降低、黏膜發炎、聽力或腎功能影響。',
      '<span class="rx-h">常用複方骨架 Regimens</span><br><span class="rx">GP</span>（<span class="drug">gemcitabine</span>＋<span class="drug">cisplatin</span>）｜<span class="rx">PF</span>（<span class="drug">cisplatin</span>＋<span class="drug">5-FU</span>）｜<span class="rx">TP</span>（<span class="drug">cisplatin</span>＋<span class="drug">paclitaxel</span>）。E1395 隨機第三期試驗顯示 PF 與 TP 於晚期頭頸癌之存活無差異。',
      '<span class="rx-h">標靶／免疫 Targeted &amp; immunotherapy</span><ul>' +
        '<li><span class="drug">cetuximab</span> ＋ <span class="drug">carboplatin</span>：復發／轉移性鼻咽癌之第二期試驗。</li>' +
        '<li><span class="drug">bevacizumab</span> 併化學治療：指引明列可用，<b>需注意出血風險</b>。</li>' +
        '<li><b>免疫檢查點抑制劑</b>：<span class="drug">nivolumab</span>（NCI-9742）、<span class="drug">pembrolizumab</span>（KEYNOTE-028，PD-L1 陽性）於部分患者有效，為化療外之另一選擇；<span class="drug">toripalimab</span> ＋ <span class="rx">GP</span> 為第一線之隨機第三期證據（JUPITER-02）。</li>' +
        '</ul>',
      '<span class="rx-h">臨床試驗 Clinical trial</span><br>指引第九節：晚期非轉移性、以及復發或轉移之病人，均可考慮參加相關臨床試驗。'
    ];
  }

  /* ---------- 主渲染 ---------- */
  function npRender() {
    var s = npSt;

    npShow('np_ia', s.stage === 'ia');   npShow('np_c_ia', s.stage === 'ia');
    npShow('np_adv', s.stage === 'adv'); npShow('np_c_adv', s.stage === 'adv');
    npShow('np_iv', s.stage === 'iv');   npShow('np_c_iv', s.stage === 'iv');
    npShow('np_rec', s.stage === 'rec'); npShow('np_c_rec', s.stage === 'rec');

    // IB–III：選定引導化療策略後才出現頸部反應這一步
    var showNeck = (s.stage === 'adv' && !!s.ind);
    npShow('np_c_neck', showNeck);
    npShow('np_s3', showNeck);

    renderIaRec();
    renderAdvRec();
    renderIvRec();
    renderRecRec();
  }

  /* ---- 第 IA 期 ---- */
  function renderIaRec() {
    if (npSt.stage !== 'ia') return;
    result('np_ia_rec', 'np_ia_fu', 'rec-elective', '根治性放射治療（Definitive RT）± 同步化學治療',
      [
        '<b>鼻咽部根治性放射治療 ＋ 頸部預防性照射</b>（definitive RT to nasopharynx and elective RT to neck）。',
        '<b>同步化放療（CCRT）為選項</b>（附件：Definitive RT — CCRT: optional）；指引本文另載「對於腫瘤體積較大的病人，亦可考慮併用化學治療」。',
        '鼻咽癌屬放射敏感腫瘤，單獨體外放射治療即為治癒性之標準治療；第一期五年存活率已達 <b>90% 以上</b>。'
      ].concat(rtLines()),
      '附件「鼻咽癌放射治療指引」：Definitive RT 之適應症為 <b>AJCC 9th Stage IA</b>。' +
      '<b>須留意</b>：指引第一頁路徑圖第一列寫的是「T1, N0, M0」，附件則以 Stage IA（T1–2 N0）為適應症——<b>T2 N0 落在兩者不一致處</b>，實務上依附件之 Stage IA 判讀。',
      'curative');
  }

  /* ---- 第 IB–III 期 ---- */
  function renderAdvRec() {
    var s = npSt;
    if (s.stage !== 'adv') return;
    var R = 'np_adv_rec', F = 'np_adv_fu';

    if (!s.ind) { idleRec(R, F, '請選擇步驟 2（是否優先給予引導化療）'); return; }

    var lines = [];
    if (s.ind === 'ind_pref') {
      lines.push('<span class="rx-h">引導化學治療 Induction</span>　<span class="rx-sub">T3 N1–3、T4 任何 N、或任何 T N2–3 時 preferred</span><br>' +
        '<span class="rx">TPF</span>（<span class="drug">docetaxel</span>＋<span class="drug">cisplatin</span>＋<span class="drug">5-FU</span>，每 3 週 ×3 週期）或 <span class="rx">GP</span>（<span class="drug">gemcitabine</span>＋<span class="drug">cisplatin</span>）；完成後接續同步化放療。');
      lines.push('<span class="rx-h">同步化放療 CCRT</span><br>以 <span class="drug">cisplatin</span> 為基礎之同步化學治療併根治性放射治療（INT-0099：cisplatin 100 mg/m² 於放療第 1、22、43 天；放療後再以 cisplatin ＋ <span class="drug">5-FU</span> ×3 週期）。');
    } else {
      lines.push('<span class="rx-h">同步化放療 CCRT</span>　<span class="rx-sub">為第 IB–III 期之標準治療</span><br>' +
        '以 <span class="drug">cisplatin</span> 為基礎之同步化學治療併根治性放射治療（INT-0099：cisplatin 100 mg/m² 於放療第 1、22、43 天；放療後再以 cisplatin ＋ <span class="drug">5-FU</span> ×3 週期）。國內外研究均顯示 CCRT 之存活優於單獨放射治療。');
    }
    lines = lines.concat(rtLines());
    lines.push('<span class="rx-h">輔助系統性治療 Adjuvant（optional）</span><br>' +
      '附件：<b>adjuvant systemic therapy: optional</b>（本版將原文之「adjuvant chemotherapy」修訂為「systemic therapy」）。指引本文：CCRT 完成後，<b>較高復發危險</b>之患者可考慮使用口服低劑量化學治療藥物以降低復發機會——即節拍式（metronomic）<span class="drug">capecitabine</span>（1 年）或口服 <span class="drug">tegafur-uracil（UFUR）</span>。');

    if (!s.neck) {
      result(R, F, 'rec-elective',
        s.ind === 'ind_pref' ? '引導化療 → 同步化放療（CCRT）' : '同步化放療（CCRT）',
        lines,
        '附件「鼻咽癌放射治療指引」：Definitive CCRT 之適應症為 <b>AJCC 9th Stage IB–III</b>。治療完成後依<b>頸部反應</b>決定後續（見下方步驟 3）。' +
        '第三、四期單獨放射治療之存活率僅約 30–50%，局部復發與遠隔轉移為治療失敗主因。',
        null);
      return;
    }

    if (s.neck === 'ncr') {
      result(R, F, 'rec-elective', '頸部臨床完全緩解 → ± 輔助化學治療 → 追蹤',
        lines.concat([
          '<b>路徑圖：Neck — complete clinical response → ± adjuvant C/T → Follow-up。</b>',
          '較高復發風險者可考慮節拍式口服化療（<span class="drug">capecitabine</span> 或 <span class="drug">UFUR</span>）；其餘進入定期追蹤。'
        ]),
        '路徑圖第二列右段。少數病人在治療後 2 至 3 個月仍可摸到殘餘之頸部腫塊，此時可考慮進一步治療或觀察。',
        'curative');
    } else {
      result(R, F, 'rec-nonop', '頸部殘存腫瘤 → 頸部廓清術（neck dissection）',
        lines.concat([
          '<b>路徑圖：Neck — residual tumor → Neck dissection → follow-up、chemotherapy 或 R/T。</b>',
          '廓清術後依殘存狀況接續<b>追蹤</b>、<b>化學治療</b>或<b>放射治療</b>。'
        ]),
        '路徑圖第二列右段。治療後 2–3 個月仍可摸到殘餘頸部腫塊者，可考慮進一步治療或觀察；及早發現並施以適當治療者仍有第二次治癒之機會。',
        'curative');
    }
  }

  /* ---- 第 IV 期（M1） ---- */
  function renderIvRec() {
    var s = npSt;
    if (s.stage !== 'iv') return;
    var R = 'np_iv_rec', F = 'np_iv_fu';

    if (!s.mets) { idleRec(R, F, '請選擇步驟 2（遠端轉移病灶數）'); return; }

    var lead = [
      '<b>路徑圖：Any T, Any N, M1a-b → Systemic therapy 或 Metastasectomy → 視臨床需要對原發部位、頸部或轉移部位施行 CCRT 或 RT。</b>',
      '常見轉移部位為<b>骨骼、肺臟、肝臟</b>。發生內臟轉移時一般以化學治療為主，部分病人於化療後可有長期緩解之機會。'
    ];

    if (s.mets === 'oligo') {
      result(R, F, 'rec-nonop', '寡轉移（M1a，第 IVA 期）：系統性治療 ＋ 積極局部治療',
        lead.concat([
          '<b>轉移病灶切除（metastasectomy）</b>：病灶數少且技術可行者可考慮。',
          '<b>對原發部位／頸部之根治性 CCRT 為選項</b>——附件明列 Definitive CCRT 之適應症包含「<b>Stage IV disease with oligometastases（optional）</b>」。',
          '對轉移部位可視臨床需要給予放射治療（如骨轉移疼痛控制）。'
        ]).concat(systemicLines()),
        systemicNote + ' AJCC 第 9 版首次細分 M1：M1a（≤3 個病灶）之 5 年存活顯著優於 M1b（>3 個），此分法即為篩選可接受積極治療者而設。',
        'palliative');
    } else {
      result(R, F, 'rec-nonop', '多發轉移（M1b，第 IVB 期）：以系統性治療為主',
        lead.concat([
          '以<b>系統性治療</b>為主；特殊情況下較局部之病灶可考慮放射治療或手術。',
          '骨轉移若有<b>骨折或脊髓壓迫</b>之危險，可考慮加做手術治療。',
          '疾病進展快速之末期病人，得依安寧緩和醫療條例實施<b>安寧緩和治療</b>（指引第七節）。'
        ]).concat(systemicLines()),
        systemicNote,
        'palliative');
    }
  }

  /* ---- 復發 ---- */
  function renderRecRec() {
    var s = npSt;
    if (s.stage !== 'rec') return;
    var R = 'np_rec_rec', F = 'np_rec_fu';

    if (!s.site) { idleRec(R, F, '請選擇步驟 2（復發部位）'); return; }

    if (s.site === 'np') {
      result(R, F, 'rec-nonop', '鼻咽部復發：再程放射治療 或 手術切除',
        [
          '<b>再程體外放射治療</b>：國內五年存活率仍約 <b>15–35%</b>；惟第二次放射治療<b>很可能造成較嚴重的放射線傷害</b>，需與主治醫師詳細討論。',
          '<b>手術切除</b>：可考慮<b>雷射</b>（本院內視鏡鼻咽切除術合併 KTP 雷射用於早期局部復發）或<b>顱底手術</b>切除，有機會完全切除；亦可考慮合併化學治療。傷口因曾接受放射線照射癒合較慢；雷射手術費時較短，顱底手術則相當繁複，術前需詳細討論。',
          '<b>光動力治療</b>：針對腫瘤表淺但範圍廣之病人可考慮。',
          '可考慮參加復發／轉移相關之<b>臨床試驗</b>（指引第九節）。'
        ].concat(systemicLines()),
        '指引第八節。及早發現鼻咽癌復發並施以適當治療，病人較有第二次治癒之機會。',
        'palliative');
    } else {
      result(R, F, 'rec-nonop', '頸部殘留腫塊或復發：頸部廓清術 或 放射治療',
        [
          '<b>頸部廓清術（neck dissection）</b>或<b>放射治療</b>。',
          '路徑圖第二列亦載：頸部殘存腫瘤 → dissection → 追蹤、化學治療或放射治療。',
          '可考慮參加復發／轉移相關之<b>臨床試驗</b>（指引第九節）。'
        ].concat(systemicLines()),
        '指引第八節：「頸部殘留腫塊或復發，則施行頸部廓清術或放射治療。」',
        'palliative');
    }
  }

  /* ---------- 事件 ---------- */
  function npPick(key, val, btn) {
    npSel(btn);
    var s = npSt;
    if (key === 'stage') {
      s.stage = val;
      s.ind = s.neck = s.mets = s.site = null;
      npClearSel(['np_s2', 'np_s3', 'np_s4', 'np_s5']);
    } else if (key === 'ind') {
      s.ind = val; s.neck = null;
      npClearSel(['np_s3']);
    } else if (key === 'neck') { s.neck = val; }
    else if (key === 'mets') { s.mets = val; }
    else if (key === 'site') { s.site = val; }
    npRender();
  }

  function npReset() {
    for (var k in npSt) { if (npSt.hasOwnProperty(k)) npSt[k] = null; }
    var root = document.getElementById('npPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['np_ia_fu', 'np_adv_fu', 'np_iv_fu', 'np_rec_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    npRender();
  }

  function initNpcPathway() { npReset(); }

  // 匯出
  global.npcPathwayHTML = npcPathwayHTML;
  global.initNpcPathway = initNpcPathway;
  global.npPick = npPick;
  global.npReset = npReset;
})(window);
