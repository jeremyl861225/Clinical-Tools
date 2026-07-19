/* ============================================================
   頭頸癌治療互動決策流程 Head & Neck Cancer Treatment Pathway
   （口腔 Oral cavity／口咽 Oropharynx／下咽 Hypopharynx）
   資料來源：國立臺灣大學醫學院附設醫院 頭頸癌診療指引
   　　　　　文件編號 50710-2-000006 版次 18（2026/06/16）
   　　　　　路徑圖：p.2 口腔癌／p.3 下咽癌／p.4 口咽癌／p.5 轉移性(M1)
   　　　　　附件：「頭頸癌術後放射治療指引」（p.17–25）
   　　　　　　　　「頭頸癌器官保留(未開刀)放射治療指引」（p.26–32）
   分期依 AJCC 第 8 版；口咽 p16(+) 依 AJCC Version 9（2026/01/01 起適用）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var hnSt = {
    site: null,   // oral | opx | hpx
    p16: null,    // pos | neg          （僅口咽）
    ext: null,    // m0 | m1
    ps: null,     // e01 | e2 | e3 | e4 （M1 之體能狀態）
    grp: null,    // g1 | g2 | g3 | g4  （臨床分群）
    strat: null,  // 初始治療策略
    out: null     // 後續評估結果（術後病理／引導化療反應／放化療後殘存）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="hnPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function stepH(id, num, q, optsHtml, extra) {
    return step(id, num, q, optsHtml, extra).replace('class="flow-step"', 'class="flow-step hidden"');
  }
  function conn(id) { return '<div class="flow-connector" id="' + id + '">↓</div>'; }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rec(id, label) {
    return '<div class="flow-rec rec-idle" id="' + id + '"><div class="rec-label">' + label +
      '</div><div class="rec-title">請完成上方步驟</div></div>';
  }

  /* ---------- 版面 HTML ---------- */
  function hncPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院頭頸癌診療指引 版次 18</b>（2026/06/16，文件編號 50710-2-000006）之四張路徑圖：' +
      '<b>p.2 口腔癌</b>、<b>p.3 下咽癌</b>、<b>p.4 口咽癌</b>、<b>p.5 轉移性（M1）</b>，' +
      '放射治療處方另依附件「頭頸癌術後放射治療指引」與「頭頸癌器官保留（未開刀）放射治療指引」。' +
      '<b>鼻咽癌不適用本流程</b>（另有獨立指引，見本站「鼻咽癌」）；喉癌、鼻竇癌、唾液腺癌僅見於放射治療附件，未納入路徑圖。</p>';
    h += '<div class="onc-path" id="hnPath">';

    /* Step 1 — 原發部位 */
    h += step('hn_s1', '1', '原發部位 Primary site',
      opt('site', 'oral', '口腔 Oral cavity', '含口腔黏膜唇；路徑圖 p.2') +
      opt('site', 'opx', '口咽 Oropharynx', '扁桃體、舌根、軟顎、咽壁；路徑圖 p.4') +
      opt('site', 'hpx', '下咽 Hypopharynx', '梨狀窩、環後區、下咽後壁；路徑圖 p.3'),
      '<div class="note"><b>治療前評估（第六節）</b>　主要：頭頸部 <b>CT／MRI</b>（原發腫瘤位置、侵犯深度與周圍組織）＋<b>胸部 X 光或胸部 CT</b>（肺轉移或第二原發癌）。' +
      '次要：腹部超音波／CT（臨床懷疑肝轉移，或重度嗜酒史者之輔助篩檢）；<b>骨掃描</b>僅用於骨痛或 Alk-P 異常升高者，已做 PET-CT 者通常不需另排；' +
      '<b>PET-CT</b> 用於全身轉移評估，常用於 Stage III–IV、原發灶不明、疑似復發或高風險個案。<br>' +
      '<b>診斷之關鍵為病理組織切片</b>（第五節）。切片結果為<b>輕／中度上皮異型增生</b>者，戒除菸酒檳榔並密集追蹤，視情況局部治療；' +
      '<b>重度異型增生</b>者安排 CT／MRI 評估深度，切緣不清晰則擴大切除或局部治療，切緣清晰可密集追蹤。</div>');

    /* Step 1b — p16（僅口咽） */
    h += connH('hn_c_p16');
    h += stepH('hn_s1b', '1b', 'p16 狀態（僅口咽癌需判定）',
      opt('p16', 'neg', 'p16(−) HPV-independent', 'AJCC 第 8 版；與口腔、下咽共用分期表') +
      opt('p16', 'pos', 'p16(+) HPV-associated', 'AJCC Version 9，2026/01/01 起適用'),
      '<div class="note"><b>p16 判讀（CAP／ASCO 指引，PMID 29251996）</b>：≥70% 中至強度之細胞核<b>及</b>細胞質染色為<b>陽性</b>；' +
      '50–&lt;70% 為<b>不確定（equivocal）</b>，應加做 HPV 特異性檢測（如高危型 HPV RNA ISH；<b>單做 HPV DNA PCR 不足</b>）；&lt;50% 為陰性。' +
      '<b>p16 與 HPV 特異性檢測不一致者，一律以 HPV-independent（p16 陰性）分期與處置。</b><br>' +
      '治療上之意義：路徑圖 p.4 對 p16(+) 與 p16(−) 給<b>相同的治療選項</b>，差異僅在<b>分群之 T／N 界線</b>（p16(+) 早期組為 T0–2 N0–1，p16(−) 為 T1–2 N0–1）與<b>分期系統</b>。</div>');

    /* Step 2 — 疾病範圍 */
    h += connH('hn_c_ext');
    h += stepH('hn_s2', '2', '疾病範圍 Disease extent',
      opt('ext', 'm0', '無遠端轉移 M0', '局部／局部區域疾病 → 依部位別路徑圖') +
      opt('ext', 'm1', '遠端轉移 M1', '路徑圖 p.5（口腔癌含口咽癌和下咽癌）'));

    /* ============ M1 分支（路徑圖 p.5）============ */
    h += '<div id="hn_m1" class="hidden">';
    h += conn('hn_c_m1');
    h += step('hn_s_ps', '3', '身體表現狀況 Performance status（ECOG）',
      opt('ps', 'e01', 'ECOG 0–1', '可考慮全身性治療併局部治療或救援性手術') +
      opt('ps', 'e2', 'ECOG 2', '') +
      opt('ps', 'e3', 'ECOG 3', '') +
      opt('ps', 'e4', 'ECOG 4', ''),
      '<div class="note">路徑圖 p.5 註：<b>復發或轉移無法手術或再放療者，建議以全身性治療為主</b>；體能狀態以 ECOG 評估。</div>');
    h += rec('hn_m1_rec', '建議處置 · 轉移性（M1）');
    h += '<div class="flow-fu hidden" id="hn_m1_fu"></div>';
    h += '</div>';

    /* ============ M0 分支 ============ */
    h += '<div id="hn_m0" class="hidden">';
    h += conn('hn_c_m0');

    /* Step 3 — 臨床分群（三張路徑圖各一組，只顯示對應部位者） */
    h += stepH('hn_s3_oral', '3', '臨床分群（口腔癌路徑圖 p.2）',
      opt('grp', 'g1', 'T1–2, N0', '早期、可切除') +
      opt('grp', 'g2', 'T3 N0／T1–3 N1–3／T4a N+／可切除之 T4b N+', '進展期但可切除') +
      opt('grp', 'g3', '無法切除之 T4 和 N+／無法切除之頸部淋巴轉移', '不可切除') +
      opt('grp', 'g4', '第 3–4 期，不適手術', '因體況或病人意願不適合手術'),
      '<div class="note">第七節之一：<b>口腔癌仍以手術治療為主要選擇</b>，惟須考慮病人年齡與身心狀況。' +
      '<b>臨床分期 III 到 IVB 或嚴重頸部轉移 N≧2 者，可先以引導／新輔助化學治療（induction／neoadjuvant chemotherapy）治療，待腫瘤縮小後再進行手術。</b></div>');

    h += stepH('hn_s3_opx', '3', '臨床分群（口咽癌路徑圖 p.4）',
      opt('grp', 'g1', '早期：p16(−) T1–2 N0–1／p16(+) T0–2 N0–1', '') +
      opt('grp', 'g2', '進展期（可切除）：p16(−) T1–4b N0–3／p16(+) T0–4 N0–3', '') +
      opt('grp', 'g3', '較晚期 T 分級：p16(−) T3–4b N0–3／p16(+) T3–4 N0–3', '路徑圖另列手術＋頸部廓清術一途') +
      opt('grp', 'g4', '無法切除之原發腫瘤／不適合手術', 'p16(−) 與 p16(+) 共用'),
      '<div class="note">第七節之二：<b>口咽癌的治療以 CCRT 為主</b>——口咽部位對說話與吞嚥扮演重要角色，手術為求 tumor free margin 常需大範圍切除腫瘤旁正常組織，' +
      '對說話與吞嚥功能及日後生活品質影響甚大；改以 CCRT 則<b>保留器官同時達成局部控制</b>，五年存活率亦有不錯成效。</div>');

    h += stepH('hn_s3_hpx', '3', '臨床分群（下咽癌路徑圖 p.3）',
      opt('grp', 'g1', 'T1–2, N0', '部分 T2N0 亦適用器官保留') +
      opt('grp', 'g2', 'T2 N0／T2–3 N0–3／T1 N+', '') +
      opt('grp', 'g3', 'T4a, N0–3', '路徑圖列 CCRT、手術＋頸部廓清術、臨床試驗') +
      opt('grp', 'g4', 'T4b N0–3／無法切除之頸部腫瘤／不適合手術', ''),
      '<div class="note">第七節之三：下咽包括<b>梨形窩、環狀軟骨後區、會厭軟骨到環狀軟骨之間的後咽壁</b>，以鱗狀細胞癌為主。' +
      '<b>T1N0 及部分 T2N0</b>：可作 partial laryngopharyngectomy ＋單側或雙側頸部淋巴廓清術，或放射治療（<b>總劑量不低於 66 Gy</b>）。</div>');

    /* Step 4 — 初始治療策略 */
    h += connH('hn_c_s4');
    h += stepH('hn_s4_oral1', '4', '初始治療（口腔 T1–2 N0）',
      opt('strat', 'o1_rt', '放射治療', '') +
      opt('strat', 'o1_surg', '切除原發腫瘤 ± 單側或雙側淋巴廓清術', '') +
      opt('strat', 'o1_pdt', '光動力學或冷凍治療', '適用癌前病變及病灶廣但表淺者（第七節之四之4）'));

    h += stepH('hn_s4_oral2', '4', '初始治療（口腔，進展期可切除）',
      opt('strat', 'o2_surg', '切除原發腫瘤 ± 單側或雙側淋巴廓清術', '路徑圖同列★化學治療（III–IVB 或 N≧2 可先行引導化療）'));

    h += stepH('hn_s4_oral3', '4', '初始治療（口腔，不可切除）：依身體表現狀況',
      opt('strat', 'o3_e01', 'ECOG 0–1', '合併放射及化學治療；或前導式化療＋放射治療／合併化放療') +
      opt('strat', 'o3_e2', 'ECOG 2', '放射治療 ± 化學治療') +
      opt('strat', 'o3_e3', 'ECOG 3', '放射治療／化學治療／支持性治療'));

    h += stepH('hn_s4_p1', '4', '初始治療（早期）',
      opt('strat', 'p1_trial', '臨床試驗', '') +
      opt('strat', 'p1_rt', '放射治療 ± 化學治療', '器官保留；下咽總劑量不低於 66 Gy') +
      opt('strat', 'p1_surg', '手術治療 ＋ 同側或兩側頸部廓清術', '下咽：部分咽喉切除術（開放式或內視鏡式）；口咽：切除原發腫瘤±單側或雙側淋巴廓清術'));

    h += stepH('hn_s4_p2', '4', '初始治療（進展期，可切除）',
      opt('strat', 'p2_trial', '臨床試驗', '') +
      opt('strat', 'p2_surg', '手術治療 ＋ 同側或兩側頸部廓清術', '下咽：部分或全咽喉切除術；口咽：切除原發腫瘤±淋巴廓清術') +
      opt('strat', 'p2_ind', '前導化學治療 Induction', '下咽：docetaxel + cisplatin + 5-FU，q3wk × 2–3 週期') +
      opt('strat', 'p2_ccrt', '同步化學放射治療 CCRT', ''));

    h += stepH('hn_s4_p3', '4', '初始治療（較晚期 T 分級）',
      opt('strat', 'p3_ccrt', '同步化學放射治療 CCRT', '') +
      opt('strat', 'p3_surg', '手術 ＋ 頸部廓清術', '下咽 T4a：total laryngectomy ＋頸廓清術後追加同步化放療為<b>優先建議</b>') +
      opt('strat', 'p3_trial', '臨床試驗', ''));

    /* 初始治療建議（第一段，選定後續步驟時保留不變） */
    h += connH('hn_c_r1');
    h += rec('hn_r1', '初始治療建議 Initial treatment');

    /* Step 5 — 後續評估（依 strat 而異） */
    h += connH('hn_c_s5');

    h += stepH('hn_s5_o1', '5', '治療後評估（口腔 T1–2 N0，路徑圖 p.2 第一列）',
      opt('out', 'o1_ncr', '無殘存腫瘤', '') +
      opt('out', 'o1_res', '殘存腫瘤', '') +
      opt('out', 'o1_nrf', '無預後不良因子', ''));

    h += stepH('hn_s5_oralpath', '5', '術後病理：預後不良因子（口腔癌路徑圖 p.2 第二列）',
      opt('out', 'pa_none', '無預後不良因子', '') +
      opt('out', 'pa_single', '單一淋巴轉移且無淋巴包膜外侵犯', '') +
      opt('out', 'pa_ene', 'margin(+) 或淋巴有包膜外侵犯', '') +
      opt('out', 'pa_multi', '2 個（含）以上淋巴轉移／神經周圍侵犯／淋巴血管侵犯／其餘不良預後因子', ''),
      '<div class="note">路徑圖 p.2 註：<b>當手術切緣接近或具有癌細胞，可選擇再手術；再手術之切緣無癌細胞者，不需要接受合併化學及放射治療。</b></div>');

    h += stepH('hn_s5_path', '5', '術後病理：預後不良因子（口咽／下咽路徑圖）',
      opt('out', 'pb_none', '無預後不良因子', '') +
      opt('out', 'pb_ene', '淋巴結膜外擴散', '') +
      opt('out', 'pb_margin', '手術切緣有癌細胞', '') +
      opt('out', 'pb_other', '其餘不良預後因子', ''));

    h += stepH('hn_s5_ind', '5', '前導化學治療後之原發部位反應',
      opt('out', 'in_cr', '完全緩解 Complete response', '→ 後續放射治療') +
      opt('out', 'in_pr', '部分緩解 Partial response', '腫瘤最長徑至少減少 30%（RECIST 1.1）→ 同步化放療') +
      opt('out', 'in_npr', '未達部分緩解', '→ 手術治療（下咽：laryngectomy ＋頸廓清術），術後追加放療或同步化放療'));

    h += stepH('hn_s5_rt', '5', '放射治療／同步化放療後之評估',
      opt('out', 'rt_ncr', '原發部位無發現腫瘤、頸部無殘存腫瘤', '') +
      opt('out', 'rt_pres', '原發部位發現殘存腫瘤', '') +
      opt('out', 'rt_nres', '原發部位緩解、但頸部殘存腫瘤', ''));

    /* 後續處置建議（第二段） */
    h += connH('hn_c_r2');
    h += rec('hn_r2', '後續處置 Subsequent management');
    h += '<div class="flow-fu hidden" id="hn_m0_fu"></div>';
    h += '</div>'; // hn_m0

    h += '<div class="flow-reset"><button class="btn-reset" onclick="hnReset()">重置</button></div>';
    h += '</div>'; // hnPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function hnSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function hnShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function hnClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ulRec(id, cls, title, lines, note) {
    var el = document.getElementById(id);
    if (!el) return;
    // 建議色塊之顯示與否由 hnRender() 的 hnShow() 決定；此處整段覆寫 className，
    // 故須保留 hidden，否則尚未選完步驟的色塊會提前露出。
    var hid = el.classList.contains('hidden');
    el.className = 'flow-rec ' + cls + (hid ? ' hidden' : '');
    var label = el.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置 Recommendation';
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }
  function idle(id, title) { ulRec(id, 'rec-idle', title, [], ''); }

  /* ---------- 追蹤區塊（第九、十節；口腔保健見第七節之四之2(3)）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與檢查 Follow-up（指引第九節、第十節）</div><ul class="fu-list">' +
        '<li>復發的頭頸癌<b>常發生在治療後一年內</b>，應每 <b>1–3 個月</b>追蹤檢查一次。</li>' +
        '<li><b>每半年做一次胸部 X 光檢查。</b></li>' +
        '<li>追蹤期間須注意<b>遠隔轉移</b>及<b>第二原發腫瘤</b>之可能，常見於<b>口腔、食道、肺臟</b>。</li>' +
        '<li>頭頸癌病人出現第二原發腫瘤之比率高達 <b>15%</b>，且預後一般不好；此族群應鼓勵參與癌症預防之臨床計畫治療。</li>' +
        '<li><b>戒除嚼檳榔、吸菸、喝酒</b>可預防大部分頭頸癌之發生，亦為降低第二原發腫瘤之根本。</li>' +
        '<li><b>口腔照護（接受放射治療者）</b>：治療前會診牙科或口腔顎面外科評估牙齒牙齦，厲害之牙齦疾病或蛀牙須先治療或拔牙（好的或可修補的牙齒不一定要拔）；' +
        '必要時製作過渡性閉孔器並評估術後口腔重建。口內若有人工牙根支持之金屬假牙，須考慮暫時移除或以牙托隔離黏膜，以減少散射輻射。' +
        '治療期間仍須以<b>軟毛牙刷</b>刷牙，一般牙膏刺激性太大時改用<b>氟膠</b>；急性口內潰瘍可請醫師或牙醫師開藥緩解；' +
        '<b>每天做開口練習</b>以免開口肌纖維化導致開口困難；治療後仍須至牙科定期回診。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>定期評估治療反應與毒性；持續追蹤體能狀態（ECOG）與症狀控制。</li>' +
        '<li><b>局部復發</b>：原則上部分病人可<b>再開刀</b>或<b>再放療</b>，惟須很小心美觀功能及放療加重毒性的問題（第八節）。' +
        '體力狀況許可者，可使用化學治療與標靶治療（無論引導 induction 或同步 concurrent）來輔助開刀或再放療。</li>' +
        '<li>大部分局部復發或轉移之病人無法再做根治性治療，僅能以<b>全身治療控制症狀</b>；體力營養太差者僅能從事支持性療法。</li>' +
        '<li>疾病進展 → 次線系統性治療、免疫檢查點抑制劑或<b>臨床試驗</b>。</li>' +
        '<li><b>安寧緩和治療</b>（第七節之七）：疾病進展快速之末期病人，經醫師判定醫療上無法治癒且簽署安寧緩和醫療意願書者，' +
        '得依<b>安寧緩和醫療條例</b>實施。</li>' +
        '<li>免疫治療相關副作用及照護原則，詳見台大醫院「<b>癌症免疫治療藥物照護原則</b>」。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  /* ---------- 放射治療處方 ---------- */
  function oarHtml() {
    var oar = [
      ['脊髓 Spinal cord', 'Max ≤ 50 Gy'],
      ['腮腺 Parotid glands（至少一側）', 'Mean &lt; 26 Gy 或 V30Gy &lt; 50%'],
      ['眼／視網膜 Eyes (retina)', 'Max ≤ 60 Gy'],
      ['腦幹 Brainstem', 'Max ≤ 60 Gy'],
      ['視神經與視交叉 Optic nerves &amp; chiasm', 'Max ≤ 56 Gy'],
      ['耳 Ear', 'Mean ≤ 50 Gy']
    ];
    var t = '<details class="kps-details"><summary>正常組織劑量限制 OAR constraints ▸</summary><table>';
    oar.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    t += '</table></details>';
    return t;
  }

  /* 術後放射治療（附件 p.17–25） */
  function postopRtLines() {
    var s = hnSt;
    var ind;
    if (s.site === 'oral') {
      ind = '<b>口腔 Oral cavity</b>：淋巴結囊外擴散；切緣陽性；<b>pT3–T4 且切緣陰性</b>；' +
        '<b>兩顆以上區域淋巴結轉移（pN2–N3）</b>；顯微鏡下切緣受侵或接近之黏膜切緣；<b>Level IV 或 V 之病理淋巴結侵犯</b>。' +
        '<span class="rx-sub">（optional）</span>pT1–T2 且切緣陰性；單一區域淋巴結轉移（pN1）；神經周圍侵犯；淋巴血管侵犯；復發病灶。';
    } else if (s.site === 'opx' && s.p16 === 'pos') {
      ind = '<b>口咽 HPV-positive</b>：淋巴結囊外擴散；切緣陽性；pT3–T4 且切緣陰性；' +
        '<b>pN+ 且「≥2 顆淋巴結，或單顆 &gt;3 cm」</b><span class="rx-sub">（本版將原文之「pT3-4」條件刪除）</span>。' +
        '<span class="rx-sub">（optional）</span>顯微鏡下接近之黏膜切緣；Level IV 或 V 之病理淋巴結侵犯；區域淋巴結轉移之組織學證據；神經周圍侵犯；淋巴血管侵犯；復發病灶。';
    } else if (s.site === 'opx') {
      ind = '<b>口咽 HPV-negative</b>：淋巴結囊外擴散；切緣陽性；pT3–T4 且切緣陰性；<b>pN2–N3</b>；' +
        '顯微鏡下切緣受侵或接近之黏膜切緣；Level IV 或 V 之病理淋巴結侵犯。' +
        '<span class="rx-sub">（optional）</span>N1 而無其他不良因子；神經周圍侵犯；淋巴血管侵犯；復發病灶。';
    } else {
      ind = '<b>下咽／喉 Hypopharynx / larynx</b>：淋巴結囊外擴散；切緣陽性；pT3–T4 且切緣陰性' +
        '<span class="rx-sub">（pT3 聲門喉癌為 optional）</span>；<b>pN2–N3</b>；顯微鏡下切緣受侵或接近之黏膜切緣。' +
        '<span class="rx-sub">（optional）</span>神經周圍侵犯；淋巴血管侵犯；pN1；復發病灶。';
    }
    return [
      '<span class="rx-h">術後放射治療之適應症 Indication</span><br>' + ind,
      '<span class="rx-h">照射技術與時程 Technique</span><br>' +
        '<b>手術切除至術後放療之間隔 ≤ 8 週（≤ 6 週為佳）。</b>模式：<b>IMRT、VMAT</b> 或其他新式技術；直線加速器 ≥6 MV photon，或 TomoTherapy 6 MV。' +
        '分次：<b>每日一次、≥2.0 Gy/fx、每週 5 次</b>。擺位：仰臥、雙臂置於身側並加用手臂／肩部固定裝置；以<b>熱塑面罩</b>固定。' +
        '影像導引：on-board kV 或 MV 影像。模擬 CT 範圍含頭頸部、鎖骨上區與肺（optional），<b>切片厚度 ≤5 mm</b>。<b>質子治療為選項</b>（optional）。',
      '<span class="rx-h">標靶體積 Target volumes</span><br>' +
        '<b>CTV_H</b>＝原發腫瘤瘤床（依術前影像、術前理學檢查／內視鏡、術中所見與病理所見）＋大體受侵犯之淋巴結區域；' +
        '並含<b>病理陽性側之半頸</b>（若雙側經病理證實陽性，則 CTV_H 含雙側）。<b>CTV_I</b>（optional）＝臨床判斷之高復發風險區（如切緣極接近或殘存病灶處）。' +
        '<b>CTV_L</b>＝其餘顯微風險低之區域。<b>PTV margin 0.2–0.5 cm</b>。',
      '<span class="rx-h">處方劑量 Dose</span><br>' +
        '<b>CTV_H ≥ 66 Gy</b>（&gt;2.0 Gy/fx）｜<b>CTV_Int ≥ 50 Gy</b>｜<b>CTV_L ≥ 44 Gy</b>' +
        '<span class="rx-sub">（本版由 50 Gy 修訂為 44 Gy）</span>。<br>' +
        '計畫限制：95% PTV 達處方劑量為佳；PTV 中劑量 ≥110% 處方劑量之體積<b>不超過 5%</b>。' + oarHtml()
    ];
  }

  /* 根治性／器官保留放射治療（附件 p.26–32） */
  function definitiveRtLines() {
    var s = hnSt;
    var ind, dose;
    if (s.site === 'oral') {
      ind = '<b>口腔（含黏膜唇）</b>：<b>T1–T2 N0</b> — 不適合手術者考慮根治性放射治療；' +
        '<b>T3–T4、T1–T4 N1–3</b> — 不適合手術者考慮根治性化放療／放射治療。';
      dose = '<b>CTV_H ≥ 66 Gy</b>（≥2 Gy/fx）｜<b>CTV_I（optional）50–63 Gy</b>｜<b>CTV_L ≥ 44 Gy</b>（≥1.6 Gy/fx）' +
        '<span class="rx-sub">（本版由 50 Gy 修訂為 44 Gy）</span>。';
    } else if (s.site === 'opx' && s.p16 === 'pos') {
      ind = '<b>口咽 HPV-positive</b>：<b>T1–2 N0</b> — 以根治性放射治療為<b>優先</b>，作為手術之替代以保留器官；' +
        '<b>T0–3 N1–2</b><span class="rx-sub">（本版由原「T1-T3, N1-N2」修訂）</span> — 根治性（化）放療作為手術之替代，用於不適合手術或器官保留；' +
        '<b>T4 或 N3</b> — 以<b>根治性同步化放療為優先</b>。三者均可選擇性於放療前以減積手術或引導化療處理大體積原發腫瘤或淋巴結。';
      dose = '<b>CTV_H ≥ 66 Gy</b>（≥2 Gy/fx）；<b>HPV(+) 口咽癌之非吸菸者 ≥ 60 Gy</b>' +
        '<span class="rx-sub">（本版新增）</span>｜<b>CTV_I（optional）50–63 Gy</b>｜<b>CTV_L ≥ 44 Gy</b>（≥1.6 Gy/fx）。';
    } else {
      ind = '<b>口咽 HPV-negative／下咽／喉</b>：<b>T1 N0 及部分 T2 N0</b> — 以根治性放射治療為<b>優先</b>，作為手術之替代以保留器官；' +
        '<b>T1–T4(a)、N0–3（不含 T1N0 與部分 T2N0）</b><span class="rx-sub">（本版由原「N1-N3」修訂為「N0-3」）</span> — ' +
        '根治性化放療作為手術之替代，用於不適合手術或器官保留；<b>T4b</b> — 不適合手術者行根治性（化）放療。' +
        '大體積原發腫瘤或淋巴結者，可選擇性於放療前行減積手術或引導化療。';
      dose = '<b>CTV_H ≥ 66 Gy</b>（≥2 Gy/fx）｜<b>CTV_I（optional）50–63 Gy</b>｜<b>CTV_L ≥ 44 Gy</b>（≥1.6 Gy/fx）' +
        '<span class="rx-sub">（本版由 50 Gy 修訂為 44 Gy）</span>。' +
        (s.site === 'hpx' ? '<br>指引第七節之三另載：下咽 T1N0 及部分 T2N0 之放射治療<b>總劑量不低於 66 Gy</b>。' : '');
    }
    return [
      '<span class="rx-h">根治性放射治療之適應症 Indication</span><br>' + ind,
      '<span class="rx-h">照射技術 Technique</span><br>' +
        '<b>IMRT、VMAT</b> 或其他新式技術；直線加速器 ≥6 MV photon 或 TomoTherapy 6 MV。' +
        '分次：每日一次、每週 5 次（其他分次法依臨床適應症）。仰臥、以<b>熱塑面罩</b>固定，手臂／肩部固定裝置為選項；' +
        '影像導引採 on-board kV 或 MV 影像。模擬 CT 範圍含頭頸部、鎖骨上區與肺（optional），<b>切片厚度 ≤5 mm</b>。<b>質子治療為選項</b>。',
      '<span class="rx-h">標靶體積 Target volumes</span><br>' +
        '<b>CTV_H</b>＝CT／MRI／PET、臨床與內視鏡所見之所有大體病灶，含大體陽性淋巴結（&gt;1 cm 或中央壞死，或依放射腫瘤科醫師判斷）；' +
        '<b>CTV_I</b>（optional）＝鄰近大體淋巴結或腫瘤之高風險區；<b>CTV_L</b>＝鄰近大體腫瘤區與具顯微風險之淋巴結群。' +
        '<b>PTV margin 0.2–0.5 cm</b>。',
      '<span class="rx-h">處方劑量 Dose</span><br>' + dose +
        '<br>計畫限制：95% PTV 達 95% 處方劑量（以 95% PTV 達處方劑量為佳）；PTV 中 ≥110% 處方劑量之體積<b>不超過 5%</b>。' + oarHtml(),
      '<span class="rx-h">頸部照射範圍 Nodal CTV</span><br>' +
        '本院指引未定義分區表；預防照射範圍依國際共識（Biau 2019）——' +
        (s.site === 'oral'
          ? '<b>口腔</b>：同側 I、II、III（<b>前舌或侵犯口咽者加 IVa</b>）；N2a–b 起加 Va,b；對側 I、II、III（±IVa）。'
          : s.site === 'opx'
            ? '<b>口咽</b>：同側 (Ib)、II、III、IVa（咽後壁加 VIIa）；N2a–b 起加 Ib、Va,b、VIIa、VIIb；對側 II、III、IVa。<b>口咽是唯一不可省略 IIb 的部位。</b>'
            : '<b>下咽</b>：同側 II、III、IVa（咽後壁加 VIIa；梨狀窩尖／環後區／侵犯食道者加 VI）；N2a–b 起加 Ib、Va,b、VIIa、VIIb；對側 II、III、IVa。') +
        '詳見本頁「<b>淋巴結分群</b>」分頁。'
    ];
  }

  /* ---------- 系統性治療（第七節之三、五、六；第八節）---------- */
  function systemicLines() {
    return [
      '<span class="rx-h">化學治療 Chemotherapy</span>　<span class="rx-sub">第七節之四之3</span><br>' +
        '頭頸癌<b>以局部控制最為重要</b>。放射合併化學治療對<b>晚期（第三、四期）</b>頭頸癌可增加局部控制率並顯著增加存活率；' +
        '<b>不適或不能手術切除之腫瘤應考慮放射合併化學治療</b>。<b>原本可完全手術切除之腫瘤，術前化學治療並不能改善局部控制或增加存活率，故不建議術前化療</b>；' +
        '惟<b>雖可切除但頸部轉移極為嚴重者</b>，可考慮先用 neoadjuvant therapy，待病程不再進行時再考慮進一步手術。' +
        '特殊個案可視狀況考慮口服化療藥物，或以動脈給予標靶及化學治療藥物以增強療效。',
      '<span class="rx-h">引導化療處方 Induction regimen</span>　<span class="rx-sub">第七節之三（下咽癌）明載之處方</span><br>' +
        '<span class="rx">TPF</span>：<span class="drug">docetaxel</span> ＋ <span class="drug">cisplatin</span> ＋ <span class="drug">5-FU</span>，' +
        '每 3 週一次，<b>T1–3 N1–3 給 2–3 週期；T4a N0–3 給 3 週期</b>。' +
        '反應評估：完全緩解 → 後續放射治療；部分緩解（<b>最長徑至少減少 30%</b>，RECIST 1.1）→ 同步化放療；未達部分緩解 → 手術（laryngectomy ＋單側或雙側頸廓清術），術後追加放療或同步化放療。',
      '<span class="rx-h">標靶治療 Targeted therapy</span>　<span class="rx-sub">第七節之四之5</span><br>' +
        '頭頸癌之表皮生長因子接受體常過度表現且與預後相關，<span class="drug">cetuximab</span>（Erbitux）合併化療可提升反應率與存活率。' +
        '血管新生於頭頸癌旺盛且與致病機轉及復發轉移相關，<span class="drug">bevacizumab</span>、或含 VEGFR 之多重標靶酪胺酸激酶抑制劑' +
        '<span class="drug">sunitinib</span>、<span class="drug">sorafenib</span> 單用或併化療均有不錯效果。' +
        '<b>病情嚴重但體虛而無法承擔化療與放療副作用者，可考慮使用標靶治療</b>；惟需考量<b>出血毒性</b>與經濟因素。',
      '<span class="rx-h">免疫治療 Immunotherapy</span>　<span class="rx-sub">第七節之四之6</span><br>' +
        '<b>復發／轉移</b>：免疫檢查點抑制劑單用或合併化學治療，於部分病人之<b>第一線及第二線</b>使用已證實有一定療效，' +
        '<b>腫瘤細胞 PD-L1 表達量高者有效率較高</b>（KEYNOTE-048、KEYNOTE-040、CheckMate 141）。耐受度較化療佳，但仍應注意免疫相關副作用並儘早處理。<br>' +
        '<b>可開刀之 Stage III／IVA 且 PD-L1 有表達者</b>：術前給予 <b>2 次</b>新輔助 <span class="drug">pembrolizumab</span>、術後給予 <b>15 次</b>輔助性 <span class="drug">pembrolizumab</span> 注射，' +
        '<b>可以改善病人預後</b>（KEYNOTE-689）。<br>' +
        '<b>開刀後具高復發危險者</b>：術後輔助性 CCRT <b>加入 <span class="drug">nivolumab</span> 可以改善病人預後</b>（GORTEC 2018-01 NIVOPOST-OP）。',
      '<span class="rx-h">臨床試驗與緩和醫療</span><br>' +
        '遠隔轉移之病人應可考慮化學治療或<b>參加化學治療之臨床試驗</b>。' +
        '<b>基因療法或其他生物調適製劑療法尚未成熟，仍在研究階段</b>；上述以外之非正統療法無科學與統計上客觀有效之根據，且會延誤正規治療時機，<b>不建議使用</b>。' +
        '疾病進展快速之末期病人，經醫師判定醫療上無法治癒且簽署安寧緩和醫療意願書者，得依安寧緩和醫療條例實施<b>安寧緩和治療</b>。'
    ];
  }

  var pxNote = '頭頸癌治療藥物之處方，指引第七節之五載明「<b>詳見口腔癌治療藥物處方</b>」（另一份文件，本頁未收錄）。健保給付與適應症請依最新公告核對。';

  /* ---------- 主渲染 ---------- */
  function hnRender() {
    var s = hnSt;
    var isOpx = s.site === 'opx';
    var siteReady = !!s.site && (!isOpx || !!s.p16);

    hnShow('hn_c_p16', isOpx); hnShow('hn_s1b', isOpx);
    hnShow('hn_c_ext', siteReady); hnShow('hn_s2', siteReady);

    hnShow('hn_m1', s.ext === 'm1'); hnShow('hn_c_m1', s.ext === 'm1');
    hnShow('hn_m0', s.ext === 'm0'); hnShow('hn_c_m0', s.ext === 'm0');

    hnShow('hn_s3_oral', s.ext === 'm0' && s.site === 'oral');
    hnShow('hn_s3_opx', s.ext === 'm0' && s.site === 'opx');
    hnShow('hn_s3_hpx', s.ext === 'm0' && s.site === 'hpx');

    // Step 4：依部位與分群決定顯示哪一個策略步驟；g4 無策略步驟，直接給建議
    var s4 = null;
    if (s.ext === 'm0' && s.grp) {
      if (s.site === 'oral') {
        s4 = s.grp === 'g1' ? 'hn_s4_oral1' : s.grp === 'g2' ? 'hn_s4_oral2' : s.grp === 'g3' ? 'hn_s4_oral3' : null;
      } else {
        s4 = s.grp === 'g1' ? 'hn_s4_p1' : s.grp === 'g2' ? 'hn_s4_p2' : s.grp === 'g3' ? 'hn_s4_p3' : null;
      }
    }
    ['hn_s4_oral1', 'hn_s4_oral2', 'hn_s4_oral3', 'hn_s4_p1', 'hn_s4_p2', 'hn_s4_p3'].forEach(function (id) {
      hnShow(id, id === s4);
    });
    hnShow('hn_c_s4', !!s4);

    // 第一段建議：g4 選定即可給；其餘須先選策略
    var showR1 = s.ext === 'm0' && (s.grp === 'g4' || !!s.strat);
    hnShow('hn_c_r1', showR1); hnShow('hn_r1', showR1);

    // Step 5：依策略決定後續評估步驟
    var s5 = step5For(s);
    ['hn_s5_o1', 'hn_s5_oralpath', 'hn_s5_path', 'hn_s5_ind', 'hn_s5_rt'].forEach(function (id) {
      hnShow(id, id === s5);
    });
    hnShow('hn_c_s5', !!s5);

    var showR2 = !!s5;
    hnShow('hn_c_r2', showR2); hnShow('hn_r2', showR2);

    renderM1();
    renderR1();
    renderR2();
  }

  function step5For(s) {
    if (s.ext !== 'm0' || !s.strat) return null;
    switch (s.strat) {
      case 'o1_rt': case 'o1_surg': case 'o1_pdt': return 'hn_s5_o1';
      case 'o2_surg': return 'hn_s5_oralpath';
      case 'p1_surg': case 'p2_surg': case 'p3_surg': return 'hn_s5_path';
      case 'p2_ind': return 'hn_s5_ind';
      case 'p1_rt': case 'p2_ccrt': case 'p3_ccrt': return 'hn_s5_rt';
      default: return null;   // 臨床試驗、口腔不可切除之 ECOG 分支：無後續評估步驟
    }
  }

  /* ---- M1（路徑圖 p.5）---- */
  function renderM1() {
    var s = hnSt;
    if (s.ext !== 'm1') return;
    if (!s.ps) {
      idle('hn_m1_rec', '請選擇步驟 3（身體表現狀況 ECOG）');
      renderFollowup('hn_m1_fu', null);
      return;
    }
    var opts, title;
    if (s.ps === 'e01') {
      title = 'ECOG 0–1：全身性治療為主，並得考慮積極局部治療';
      opts = ['<b>全身性治療 ＋／− 放射治療</b>', '<b>救援性手術</b>', '全身性治療', '放射治療', '最佳支持性療法'];
    } else if (s.ps === 'e2') {
      title = 'ECOG 2：全身性治療為主';
      opts = ['<b>全身性治療 ＋／− 放射治療</b>', '全身性治療', '放射治療', '最佳支持性療法'];
    } else {
      title = 'ECOG ' + (s.ps === 'e3' ? '3' : '4') + '：以症狀控制與支持性療法為主';
      opts = ['全身性治療', '放射治療', '最佳支持性療法'];
    }
    ulRec('hn_m1_rec', 'rec-nonop', title,
      ['<span class="rx-h">路徑圖 p.5 列出之選項</span><br>' + opts.join('　｜　') +
        '<br><span class="rx-sub">路徑圖註：復發或轉移無法手術或再放療者，建議以全身性治療為主。</span>']
        .concat(systemicLines()),
      '路徑圖 p.5「口腔癌（含口咽癌和下咽癌）轉移性（M1）診療指引路徑圖」；<b>臨床試驗</b>為 M1 之並列選項（路徑圖首列）。' + pxNote);
    renderFollowup('hn_m1_fu', 'palliative');
  }

  /* ---- 第一段：初始治療建議 ---- */
  function renderR1() {
    var s = hnSt;
    if (s.ext !== 'm0') return;
    var R = 'hn_r1';

    if (!s.grp) { idle(R, '請選擇步驟 3（臨床分群）'); return; }

    /* g4：不可切除／不適合手術 */
    if (s.grp === 'g4') {
      if (s.site === 'oral') {
        ulRec(R, 'rec-nonop', '第 3–4 期不適手術：前導式化療＋放射治療 或 合併化學及放射治療',
          ['<span class="rx-h">路徑圖 p.2 第四列之選項</span><br>' +
            '<b>前導式化療 ＋ 放射治療</b>　或　<b>合併化學及放射治療（CCRT）</b>　｜　<b>支持性治療</b>']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 p.2 最下列。第七節之四之3：<b>不適或不能手術切除之腫瘤應考慮放射合併化學治療</b>。' + pxNote);
      } else {
        ulRec(R, 'rec-nonop', '無法切除之原發腫瘤／不適合手術',
          ['<span class="rx-h">路徑圖列出之四項並列選項</span><br>' +
            '<b>臨床試驗</b>　｜　<b>放射治療 或 合併放射及化學治療</b>　｜　<b>最佳支持性療法</b>　｜　<b>前導性化療 ＋／− 局部根治性治療</b>']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 最下列（p16(−) 與 p16(+) 共用）。' + pxNote);
      }
      renderFollowup('hn_m0_fu', 'palliative');
      return;
    }

    if (!s.strat) { idle(R, '請選擇步驟 4（初始治療）'); return; }

    var siteWord = s.site === 'oral' ? '口腔' : s.site === 'opx' ? '口咽' : '下咽';

    switch (s.strat) {
      /* --- 口腔 T1–2 N0 --- */
      case 'o1_rt':
        ulRec(R, 'rec-nonop', '放射治療（口腔 T1–2 N0）',
          ['<b>路徑圖 p.2 第一列三項並列選項之一。</b>第七節之四之2(1)：對於<b>小的局限性腫瘤</b>，手術切除及放射治療<b>都是有效的療法</b>，' +
            '惟需考慮病人年齡、對手術或放射治療之意願及容忍性。'].concat(definitiveRtLines()),
          '路徑圖 p.2 第一列。治療後依殘存腫瘤與預後因子決定後續（見下方步驟 5）。');
        break;
      case 'o1_surg':
        ulRec(R, 'rec-elective', '切除原發腫瘤 ± 單側或雙側淋巴廓清術（口腔 T1–2 N0）',
          ['<b>手術切除是治療口腔癌最重要的步驟</b>（第七節之四之1），依期數不同而有不同程度之切除。',
            '<b>頸部處置</b>：本院指引僅寫「單側或雙側頸部淋巴廓清術」，未定義分區。國際證據方面，' +
            'D\'Cruz 等（NEJM 2015）於<b>側化之 cN0 T1／T2 口腔鱗癌</b>隨機比較選擇性頸廓清與觀察：' +
            '3 年整體存活 <b>80.0% vs 67.5%</b>（死亡 HR 0.64，P=0.01）、3 年無疾病存活 <b>69.5% vs 45.9%</b>（P&lt;0.001），' +
            '<b>支持早期口腔癌行選擇性頸部廓清</b>。廓清範圍見本頁「淋巴結分群」分頁。',
            '<b>術前化療不建議</b>：第七節之四之3 明載「原本可以完全手術切除的腫瘤，手術前的化學治療並不能改善局部控制或增加病人的存活率」。'],
          '路徑圖 p.2 第一列。術後依殘存腫瘤與預後因子決定後續（見下方步驟 5）。');
        break;
      case 'o1_pdt':
        ulRec(R, 'rec-elective', '光動力療法或冷凍治療（口腔 T1–2 N0）',
          ['第七節之四之4：<b>針對癌前病變以及病灶廣但表淺的口腔癌／口咽癌時，可適用光動力療法或冷凍治療。</b>',
            '第六節之二亦載：輕／中度上皮異型增生者，視情況可採<b>局部治療（手術切除、雷射、冷凍或光動力療法）</b>；重度異型增生且切緣不清晰者，建議擴大切除或選擇局部治療。'],
          '路徑圖 p.2 第一列三項並列選項之一。');
        break;

      /* --- 口腔 進展期可切除 --- */
      case 'o2_surg':
        ulRec(R, 'rec-elective', '切除原發腫瘤 ± 單側或雙側淋巴廓清術（＋化學治療）',
          ['<b>路徑圖 p.2 第二列</b>：★切除原發腫瘤±單側或雙側淋巴廓清術　★化學治療。',
            '<b>引導／新輔助化療之時機</b>（第七節之一）：<b>臨床分期 III 到 IVB 或嚴重頸部轉移 N≧2 之病人，可先以 induction／neoadjuvant chemotherapy 治療，待腫瘤縮小後再進行進一步的手術治療。</b>' +
            '第七節之四之3 補充：雖可切除但<b>頸部轉移極為嚴重</b>者，可考慮先用 neoadjuvant therapy，待病程不再進行時再考慮進一步手術。',
            '<b>可完全切除者不建議術前化療</b>——兩者並不矛盾：前者針對頸部轉移嚴重而手術風險高之族群，後者針對可完全切除之一般族群。'],
          '路徑圖 p.2 第二列。<b>術後病理之預後不良因子決定輔助治療</b>（見下方步驟 5）。' + pxNote);
        break;

      /* --- 口腔 不可切除 --- */
      case 'o3_e01':
        ulRec(R, 'rec-nonop', '不可切除、ECOG 0–1：合併放射及化學治療（或前導式化療＋放療）',
          ['<span class="rx-h">路徑圖 p.2 第三列</span><br><b>合併放射及化學治療</b>　或　<b>前導式化療 ＋ 放射治療</b>　或　<b>合併化學及放射治療</b>。',
            '<b>治療後之後續</b>：路徑圖明載「<b>如果可能的話，切除殘餘原發腫瘤或淋巴結頸部淋巴廓清術</b>」。']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 p.2 第三列（★無法切除 T4 和 N+／★無法切除頸部淋巴轉移）。' + pxNote);
        renderFollowup('hn_m0_fu', 'palliative');
        break;
      case 'o3_e2':
        ulRec(R, 'rec-nonop', '不可切除、ECOG 2：放射治療 ± 化學治療',
          ['<b>路徑圖 p.2 第三列：放射治療 ± 化學治療。</b>'].concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 p.2 第三列。' + pxNote);
        renderFollowup('hn_m0_fu', 'palliative');
        break;
      case 'o3_e3':
        ulRec(R, 'rec-nonop', '不可切除、ECOG 3：放射治療／化學治療／支持性治療',
          ['<span class="rx-h">路徑圖 p.2 第三列之三項並列選項</span><br><b>放射治療</b>　｜　<b>化學治療</b>　｜　<b>支持性治療</b>。',
            '第七節之四之5：<b>病情嚴重但因病人身體虛弱，導致無法承擔副作用較大之化學治療及放射治療時，可考慮使用標靶治療</b>（需考量出血毒性與經濟因素）。']
            .concat(systemicLines()),
          '路徑圖 p.2 第三列。' + pxNote);
        renderFollowup('hn_m0_fu', 'palliative');
        break;

      /* --- 口咽／下咽 --- */
      case 'p1_trial': case 'p2_trial': case 'p3_trial':
        ulRec(R, 'rec-nonop', '臨床試驗 Clinical trial',
          ['<b>臨床試驗於路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 之每一個分群中皆為並列選項。</b>',
            '第七節之四之3：遠隔轉移之病人應可考慮化學治療或<b>參加化學治療的臨床試驗</b>。' +
            '第十節：頭頸癌病人出現第二原發腫瘤之比率高達 15%，<b>應鼓勵參與癌症預防之臨床計畫治療</b>。'],
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + '。');
        break;

      case 'p1_rt':
        ulRec(R, 'rec-nonop', '放射治療 ± 化學治療（' + siteWord + '，早期）',
          ['<b>器官保留為此選項之主要理由。</b>' +
            (s.site === 'opx'
              ? '第七節之二：<b>口咽癌的治療以 CCRT 為主</b>——若採手術，為達 tumor free margin 常需大範圍切除腫瘤旁正常組織，對說話與吞嚥功能及生活品質影響甚大；' +
                '改以 CCRT 則保留器官同時達成局部控制，五年存活率亦有不錯成效。'
              : '第七節之三：下咽癌 T1N0 及部分 T2N0 可作 partial laryngopharyngectomy ＋頸廓清術，<b>或放射治療（總劑量不低於 66 Gy）</b>。')]
            .concat(definitiveRtLines()),
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 第一列。治療後依原發部位有無殘存腫瘤決定後續（見下方步驟 5）。');
        break;

      case 'p1_surg':
        ulRec(R, 'rec-elective',
          s.site === 'opx' ? '切除原發腫瘤 ± 單側或雙側淋巴廓清術（口咽，早期）'
                           : '部分咽喉切除術（開放式或內視鏡式）＋ 同側或兩側頸部廓清術（下咽 T1–2 N0）',
          [s.site === 'opx'
            ? '<b>路徑圖 p.4 第一列</b>：切除原發腫瘤 ± 單側或雙側淋巴廓清術。惟第七節之二指出口咽癌治療<b>以 CCRT 為主</b>，選擇手術時須權衡說話與吞嚥功能。'
            : '<b>路徑圖 p.3 第一列</b>：手術治療 — 部分咽喉切除術（開放式或內視鏡式）＋ 同側或兩側頸部廓清術。第七節之三明載此術式適用 <b>T1N0 及部分 T2N0</b>。',
            '頸部廓清範圍：本院指引未定義分區；國際多專科指引（Paleri 2016）對' +
            (s.site === 'opx' ? '口咽' : '下咽') + '建議 <b>SND (II–IV)</b>。詳見本頁「淋巴結分群」分頁。'],
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 第一列。<b>術後依預後不良因子決定輔助治療</b>（見下方步驟 5）。');
        break;

      case 'p2_surg':
        ulRec(R, 'rec-elective',
          s.site === 'opx' ? '切除原發腫瘤 ± 單側或雙側淋巴廓清術（口咽，進展期）'
                           : '部分咽喉切除術／全咽喉切除術 ＋ 同側或兩側頸部廓清術（下咽，進展期）',
          [s.site === 'opx'
            ? '<b>路徑圖 p.4 第二列</b>：切除原發腫瘤 ± 單側或雙側淋巴廓清術。'
            : '<b>路徑圖 p.3 第二列</b>：手術治療 — 部分咽喉切除術（開放式或內視鏡式）／全咽喉切除術 ＋ 同側或兩側頸部廓清術。' +
              '第七節之三：T1–3 N1–3 之選項之一即為「laryngectomy ＋單側或雙側頸部淋巴廓清術，術後再追加放射治療或同步放化療」。',
            '<b>術前化療不建議</b>（第七節之四之3）：原本可完全手術切除之腫瘤，術前化療並不改善局部控制或存活。'],
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 第二列。<b>術後依預後不良因子決定輔助治療</b>（見下方步驟 5）。');
        break;

      case 'p2_ind':
        ulRec(R, 'rec-nonop', '前導化學治療 Induction chemotherapy',
          ['<span class="rx-h">處方（第七節之三，下咽癌明文）</span><br>' +
            '<span class="rx">TPF</span>：<span class="drug">docetaxel</span> ＋ <span class="drug">cisplatin</span> ＋ <span class="drug">5-FU</span>，' +
            '每 3 週一次 × <b>2–3 週期</b>（T1–3 N1–3）。',
            '<span class="rx-h">反應評估與分流（路徑圖）</span><br>' +
            '<b>完全緩解</b> → 後續<b>放射治療</b>；<b>部分緩解</b>（腫瘤最長徑至少減少 30%）→ <b>同步放化療</b>；' +
            '<b>未達部分緩解</b> → <b>手術治療</b>（下咽：laryngectomy ＋單側或雙側頸廓清術），術後再追加放射治療或同步放化療。'],
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + ' 第二列。反應評估標準見 RECIST 1.1。' + pxNote);
        break;

      case 'p2_ccrt': case 'p3_ccrt':
        ulRec(R, 'rec-nonop', '同步化學放射治療 CCRT',
          [(s.site === 'opx'
            ? '第七節之二：<b>口咽癌的治療以 CCRT 為主</b>；以 CCRT 代替手術之口咽癌病人，五年存活率亦有不錯成效。'
            : '第七節之三：T1–3 N1–3 及 T4a N0–3 之選項均包含「<b>直接接受同步放化療</b>」。') +
            '第七節之四之3：放射合併化學治療對<b>晚期（第三、四期）頭頸癌可增加局部控制率、顯著增加病人的存活率</b>。']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + '。治療後依原發部位與頸部有無殘存腫瘤決定後續（見下方步驟 5）。' + pxNote);
        break;

      case 'p3_surg':
        ulRec(R, 'rec-elective', '手術 ＋ 頸部廓清術（較晚期 T 分級）',
          [s.site === 'hpx'
            ? '<b>下咽 T4a N0–3：第七節之三明載「total laryngectomy ＋單側或雙側頸部淋巴廓清術，術後再追加同步放化療（<u>此選項為優先建議</u>）」。</b>' +
              '其餘選項為：TPF 引導化療 ×3 週期後依反應分流、直接同步放化療、或臨床試驗。'
            : '<b>路徑圖 p.4</b>：手術 ＋ 頸部廓清術 → 放射線治療或合併放射及化學治療。',
            '術後放射治療之適應症與劑量見下方；<b>手術至術後放療間隔應 ≤8 週（≤6 週為佳）</b>。'],
          '路徑圖 ' + (s.site === 'opx' ? 'p.4' : 'p.3') + '。<b>術後依預後不良因子決定輔助治療</b>（見下方步驟 5）。');
        break;

      default:
        idle(R, '請選擇步驟 4（初始治療）');
    }
  }

  /* ---- 第二段：後續處置 ---- */
  function renderR2() {
    var s = hnSt;
    var R = 'hn_r2', F = 'hn_m0_fu';
    if (!step5For(s)) return;
    if (!s.out) { idle(R, '請完成步驟 5'); renderFollowup(F, null); return; }

    var pg = s.site === 'opx' ? 'p.4' : s.site === 'hpx' ? 'p.3' : 'p.2';

    switch (s.out) {
      /* 口腔 T1–2 N0 治療後 */
      case 'o1_ncr':
        ulRec(R, 'rec-elective', '無殘存腫瘤 → 進入定期追蹤',
          ['<b>路徑圖 p.2 第一列</b>：無殘存腫瘤 → 追蹤。'], '路徑圖 p.2。');
        renderFollowup(F, 'curative');
        break;
      case 'o1_res':
        ulRec(R, 'rec-urgent', '殘存腫瘤 → 救援手術 或 合併化學及放射治療',
          ['<b>路徑圖 p.2 第一列：殘存腫瘤 → 救援手術或合併化學及放射治療。</b>']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 p.2 第一列右段。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'o1_nrf':
        ulRec(R, 'rec-elective', '無預後不良因子 → 進入定期追蹤',
          ['<b>路徑圖 p.2 第一列</b>：無預後不良因子 → 追蹤，不需追加輔助治療。'], '路徑圖 p.2。');
        renderFollowup(F, 'curative');
        break;

      /* 口腔 術後病理（路徑圖 p.2 第二列） */
      case 'pa_none':
        ulRec(R, 'rec-elective', '無預後不良因子 → 放射治療 ± 化學治療',
          ['<b>路徑圖 p.2 第二列：無預後不良因子 → 放射治療 ± 化學治療。</b>'].concat(postopRtLines()),
          '路徑圖 p.2 第二列。');
        renderFollowup(F, 'curative');
        break;
      case 'pa_single':
        ulRec(R, 'rec-elective', '單一淋巴轉移且無淋巴包膜外侵犯 → 放射治療',
          ['<b>路徑圖 p.2 第二列：單一淋巴轉移且無淋巴包膜外侵犯 → 放射治療</b>（不加化學治療）。',
            'EORTC 22931 與 RTOG 9501 之合併分析（Bernier 2005）顯示：<b>術後同步化放療之獲益族群為切緣陽性與淋巴結囊外侵犯者</b>；' +
            '單一淋巴轉移而無囊外侵犯者，加做化療之效益未獲支持——與本路徑圖一致。']
            .concat(postopRtLines()),
          '路徑圖 p.2 第二列。');
        renderFollowup(F, 'curative');
        break;
      case 'pa_ene':
        ulRec(R, 'rec-urgent', 'margin(+) 或淋巴包膜外侵犯 → 合併化學及放射治療',
          ['<b>路徑圖 p.2 第二列：margin(+) 或淋巴有包膜外侵犯 → 合併化學及放射治療。</b>',
            '<b>但先考慮再手術</b>——路徑圖 p.2 註明載：「<b>當手術切緣接近或具有癌細胞可選擇再手術，再手術之切緣無癌細胞，不需要接受合併化學及放射治療</b>」。',
            '證據基礎：EORTC 22931（Bernier NEJM 2004）與 RTOG 9501（Cooper NEJM 2004）；兩者合併分析確認<b>切緣陽性與囊外侵犯</b>為同步化放療之獲益族群（Bernier Head Neck 2005）。',
            '第七節之四之6：<b>開刀後具高復發危險者，術後輔助性 CCRT 加入 <span class="drug">nivolumab</span> 可以改善病人預後</b>（GORTEC 2018-01 NIVOPOST-OP）。']
            .concat(postopRtLines()).concat(systemicLines()),
          '路徑圖 p.2 第二列。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'pa_multi':
        ulRec(R, 'rec-urgent', '≥2 顆淋巴轉移／神經周圍侵犯／淋巴血管侵犯／其餘不良因子 → 放射治療 或 合併化學及放射治療',
          ['<b>路徑圖 p.2 第二列：2 個（含）以上之淋巴轉移、神經周圍侵犯、淋巴血管侵犯、其餘不良預後因子 → 放射治療　或　合併化學及放射治療。</b>' +
            '（路徑圖此處兩項<b>並列</b>，未指定優先。）',
            '第七節之四之2(1)：<b>手術後如有危險因子——手術切口邊緣仍有殘存腫瘤細胞、淋巴結轉移（二粒以上）、淋巴結膜外侵犯、神經周圍或淋巴血管侵犯者，需行手術後放射治療。</b>']
            .concat(postopRtLines()).concat(systemicLines()),
          '路徑圖 p.2 第二列。' + pxNote);
        renderFollowup(F, 'curative');
        break;

      /* 口咽／下咽 術後病理 */
      case 'pb_none':
        ulRec(R, 'rec-elective', '無預後不良因子 → 進入定期追蹤',
          ['<b>路徑圖 ' + pg + '：無預後不良因子 → 追蹤。</b>' +
            '惟術後放射治療之適應症尚包含 pT3–T4 切緣陰性、pN2–N3 等（見附件），須逐項核對後方可認定無適應症。'],
          '路徑圖 ' + pg + '。');
        renderFollowup(F, 'curative');
        break;
      case 'pb_ene':
        ulRec(R, 'rec-urgent', '淋巴結膜外擴散 → 合併放射及化學治療',
          ['<b>路徑圖 ' + pg + '：淋巴結膜外擴散 → 合併放射及化學治療。</b>',
            '證據基礎：EORTC 22931、RTOG 9501 及其合併分析（Bernier Head Neck 2005）——<b>囊外侵犯為同步化放療之明確獲益族群</b>。',
            '第七節之四之6：開刀後具高復發危險者，術後輔助性 CCRT <b>加入 <span class="drug">nivolumab</span> 可以改善病人預後</b>。']
            .concat(postopRtLines()).concat(systemicLines()),
          '路徑圖 ' + pg + '。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'pb_margin':
        ulRec(R, 'rec-urgent', '手術切緣有癌細胞 → 再次切除 ± 合併放射及化學治療',
          ['<b>路徑圖 ' + pg + '：手術切緣有癌細胞 → 再次切除 ± 合併放射及化學治療。</b>' +
            '<b>優先考慮再次切除</b>；若再手術之切緣無癌細胞，可不需接受合併化放療（見路徑圖 p.2 之相同註記）。']
            .concat(postopRtLines()).concat(systemicLines()),
          '路徑圖 ' + pg + '。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'pb_other':
        ulRec(R, 'rec-elective', '其餘不良預後因子 → 放射治療 或 合併放射及化學治療',
          ['<b>路徑圖 ' + pg + '：其餘不良預後因子 → 放射治療　或　合併放射及化學治療</b>（兩項並列，未指定優先）。']
            .concat(postopRtLines()),
          '路徑圖 ' + pg + '。');
        renderFollowup(F, 'curative');
        break;

      /* 引導化療反應 */
      case 'in_cr':
        ulRec(R, 'rec-elective', '原發部位完全緩解 → 後續放射治療',
          ['<b>路徑圖 ' + pg + '：原發部位完全緩解者 → 放射治療。</b>' +
            '第七節之三：「若達 complete response，則接受後續之放射治療」。']
            .concat(definitiveRtLines()),
          '路徑圖 ' + pg + ' 第二列。後續仍須評估頸部有無殘存腫瘤（頸部殘存 → 頸部廓清術）。');
        renderFollowup(F, 'curative');
        break;
      case 'in_pr':
        ulRec(R, 'rec-nonop', '原發部位部分緩解 → 同步化學及放射治療',
          ['<b>路徑圖 ' + pg + '：原發部位部分緩解者 → 放射治療或合併化學及放射治療。</b>' +
            '第七節之三：「若達 partial response（<b>腫瘤的最長徑至少減少 30%</b>），則接受同步放化療」。']
            .concat(definitiveRtLines()).concat(systemicLines()),
          '路徑圖 ' + pg + ' 第二列。緩解定義依 RECIST 1.1。後續仍須評估頸部有無殘存腫瘤。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'in_npr':
        ulRec(R, 'rec-urgent', '未達部分緩解 → 手術治療，術後追加放療或同步化放療',
          ['<b>路徑圖 ' + pg + '：原發部位未達部分緩解者 → 手術治療。</b>' +
            '第七節之三：「若達不到 partial response，便作 <b>laryngectomy ＋單側或雙側頸部淋巴廓清術</b>，術後再追加放射治療或同步放化療」。',
            '術後再依<b>預後不良因子</b>（淋巴結膜外擴散／手術切緣有癌細胞／其餘不良預後因子）決定輔助治療強度。']
            .concat(postopRtLines()),
          '路徑圖 ' + pg + ' 第二列。');
        renderFollowup(F, 'curative');
        break;

      /* 放療／同步化放療後 */
      case 'rt_ncr':
        ulRec(R, 'rec-elective', '原發部位與頸部均無殘存腫瘤 → 進入定期追蹤',
          ['<b>路徑圖 ' + pg + '：原發部位無發現腫瘤、無頸部殘存腫瘤 → 追蹤。</b>'], '路徑圖 ' + pg + '。');
        renderFollowup(F, 'curative');
        break;
      case 'rt_pres':
        ulRec(R, 'rec-urgent', '原發部位發現殘存腫瘤 → 救援手術 ± 頸部廓清術',
          ['<b>路徑圖 ' + pg + '：原發部位發現殘存腫瘤 → 救援手術 ± 頸部廓清術。</b>' +
            '（早期分群之路徑圖此處寫「救援手術」，進展期分群則寫「救援手術 ± 頸部廓清術」。）',
            '第八節：局部復發或殘存之病人可再開刀或再放療，惟須<b>很小心美觀功能及放療加重毒性</b>的問題；' +
            '體力狀況許可下，可使用化學治療與標靶治療（引導或同步）輔助開刀或再放療。']
            .concat(systemicLines()),
          '路徑圖 ' + pg + '。' + pxNote);
        renderFollowup(F, 'curative');
        break;
      case 'rt_nres':
        ulRec(R, 'rec-urgent', '原發部位緩解、頸部殘存腫瘤 → 頸部廓清術',
          ['<b>路徑圖 ' + pg + '：頸部殘存腫瘤 → 頸部廓清術。</b>（無頸部殘存腫瘤者則進入追蹤。）',
            '廓清範圍見本頁「淋巴結分群」分頁；治療後之頸部處置，本院指引未定義分區。'],
          '路徑圖 ' + pg + '。');
        renderFollowup(F, 'curative');
        break;

      default:
        idle(R, '請完成步驟 5');
    }
  }

  /* ---------- 事件 ---------- */
  function hnPick(key, val, btn) {
    hnSel(btn);
    var s = hnSt;
    var downstream = ['hn_s1b', 'hn_s2', 'hn_s_ps', 'hn_s3_oral', 'hn_s3_opx', 'hn_s3_hpx',
      'hn_s4_oral1', 'hn_s4_oral2', 'hn_s4_oral3', 'hn_s4_p1', 'hn_s4_p2', 'hn_s4_p3',
      'hn_s5_o1', 'hn_s5_oralpath', 'hn_s5_path', 'hn_s5_ind', 'hn_s5_rt'];

    if (key === 'site') {
      s.site = val; s.p16 = s.ext = s.ps = s.grp = s.strat = s.out = null;
      hnClearSel(downstream);
    } else if (key === 'p16') {
      s.p16 = val; s.ext = s.ps = s.grp = s.strat = s.out = null;
      hnClearSel(downstream.slice(1));
    } else if (key === 'ext') {
      s.ext = val; s.ps = s.grp = s.strat = s.out = null;
      hnClearSel(downstream.slice(2));
    } else if (key === 'ps') {
      s.ps = val;
    } else if (key === 'grp') {
      s.grp = val; s.strat = s.out = null;
      hnClearSel(downstream.slice(6));
    } else if (key === 'strat') {
      s.strat = val; s.out = null;
      hnClearSel(downstream.slice(12));
    } else if (key === 'out') {
      s.out = val;
    }
    hnRender();
  }

  function hnReset() {
    for (var k in hnSt) { if (hnSt.hasOwnProperty(k)) hnSt[k] = null; }
    var root = document.getElementById('hnPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['hn_m1_fu', 'hn_m0_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    hnRender();
  }

  function initHncPathway() { hnReset(); }

  // 匯出
  global.hncPathwayHTML = hncPathwayHTML;
  global.initHncPathway = initHncPathway;
  global.hnPick = hnPick;
  global.hnReset = hnReset;
})(window);
