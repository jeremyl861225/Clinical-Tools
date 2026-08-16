/* ============================================================
   胃癌治療互動決策流程 Gastric Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胃癌診療指引 V.1 2026
   （NTUH Gastric Cancer Guidelines in Oncology, AGC-1 ～ AGC-5）
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var gcSt = {
    scope: null,     // loco | m1
    fit: null,       // fit_res | fit_unres | unfit
    strat: null,     // esd | upfront | periop
    esdcur: null,    // esd_cur | esd_noncur
    rstatus: null,   // R0 | R1 | R2
    pstage: null,    // p_early | p_adj
    restage: null,   // ccr | residual（fit_unres 化療後再分期）
    prerest: null,   // pre_go | pre_m1 | pre_intol（圍手術期化療後、進手術室之前的再分期）
    mline: null,     // m_1st | m_2nd | m_3rd     （M1 之治療線別）
    mps: null,       // ps_good | ps_poor         （M1 之體能狀態 → 化療骨架）
    mbio: null       // b_her2_hi | b_her2_lo | b_msi | b_cps5 | b_cps1 | b_cldn | b_none
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="gcPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function gastricPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院胃癌診療指引 V.1 2026</b>（NTUH，AGC-1～AGC-5）之互動決策流程。逐步點選以取得對應建議處置、藥物療程與追蹤方式。</p>';
    h += '<div class="onc-path" id="gcPath">';

    // Step 1 — 疾病範圍：局限性 / 轉移性
    h += step('gc_s1', '1', '疾病範圍（初始分期）',
      opt('scope', 'loco', '侷限性 Locoregional（M0）', '無遠處轉移') +
      opt('scope', 'm1', '轉移性 Metastatic（M1）', '遠處轉移（含腹膜、遠處淋巴結、腹水細胞學陽性）'),
      '<div class="cbx"><div class="cbx-h">初始檢查 WORK-UP（AGC-1 1 of 2）　<span class="cbx-sub">Primary Investigations</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb">病史與理學檢查</span>' +
        '<span class="cb">腹部＋骨盆 CT（± 腹部超音波）</span>' +
        '<span class="cb">胸部 CT／X 光</span>' +
        '<span class="cb">上消化道內視鏡 EGD</span>' +
        '<span class="cb">CBC、血小板、生化 BCS</span>' +
        '<span class="cb">CEA</span>' +
      '</div></div>' +
      '<div class="cbx"><div class="cbx-h">進階評估 ADDITIONAL EVALUATION　<span class="cbx-sub">Secondary Investigations</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb"><span class="cb-k">選擇性</span>內視鏡超音波 EUS（早期胃癌）</span>' +
        '<span class="cb">全身骨掃描（病理分期 III 或臨床分期 IV）</span>' +
        '<span class="cb"><span class="cb-k">選擇性</span>PET/CT（自費）</span>' +
        '<span class="cb"><span class="cb-k">選擇性</span>多專科團隊評估</span>' +
      '</div></div>' +
      '<div class="note"><b>M0／M1 是靠上面這些檢查判定的，不是靠猜。</b>此外 <b>AGC-1 註 a</b> 之「medically fit」' +
      '指的是<b>能耐受腹部大手術</b>，與體能狀態（KPS／ECOG）不是同一件事。<br>' +
      '<b>小提醒</b>：本頁把「疾病範圍」與「醫療適合度」拆成兩步，是為了讓 M1 與 M0 各走各的；' +
      '<b>術中或腹腔鏡才發現的 M1</b> 請走步驟 4 的「術中發現 M1」。</div>');

    /* ===================== M0 侷限性 ===================== */
    h += '<div id="gc_loco" class="hidden">';
    h += conn('gc_c2');
    h += step('gc_s2', '2', '醫療適合度與可切除性',
      opt('fit', 'fit_res', '可耐受手術 · 潛在可切除', 'Medically fit，potentially resectable') +
      opt('fit', 'fit_unres', '可耐受手術 · 不可切除（M0）', '腹膜擴散／血管包覆／無法完整切除') +
      opt('fit', 'unfit', '無法耐受大手術', 'Medically unfit for major surgery'),
      '<div class="note"><b>腹腔鏡 + 腹腔沖洗細胞學（AGC-1 註 b）</b>：用於<b>考慮根治性手術時評估腹膜擴散</b>。' +
      'AGC-1 對三條路的建議強度不同 —— <b>「可耐受手術 · 潛在可切除」列為 recommended</b>，' +
      '<b>「可耐受手術 · 不可切除」與「無法耐受大手術」列為 optional</b>。<br>' +
      '<b>⚠ 腹腔沖洗細胞學陽性（CY1）依定義即為 M1</b>（本頁分期頁籤之 M1 定義含「腹水細胞學陽性」）—— ' +
      '一旦 CY1，病人就不再是 M0，應改走<b>系統性治療（AGC-5）</b>，' +
      '而不是繼續往根治性手術走。這是這一步最容易被忽略的後果。<br>' +
      '<b>不可切除的判定準則（AGC-2 2 of 3）</b>：腹膜種植或遠處轉移；無法完整切除；主要血管被侵犯或包覆。</div>');

    // resectable 子流程
    h += '<div id="gc_res" class="hidden">';
    h += conn('gc_c3');
    h += step('gc_s3', '3', '臨床分期 → 治療策略',
      opt('strat', 'esd', '內視鏡切除 ESD', '<b>cT1</b> 且符合任一：①分化型、無潰瘍（不限大小）；②分化型、有潰瘍且 ≤3cm；③未分化型、無潰瘍且 ≤2cm') +
      opt('strat', 'upfront', '直接根治性手術（預設路徑）', '所有未達 ESD 條件、也未選擇圍手術期化療者 — 指引<b>未依 T 分期限制手術</b>') +
      opt('strat', 'periop', '圍手術期化療 → 手術（可考慮）', '<b>cT4N+ 或 bulky nodes</b> 之臨界可切除者，指引措辭為「can be considered」，非強制'),
      '<div class="note"><b>AGC-2（1 of 3）原文</b>：「Conventional surgery with curative intent, <b>or</b> Laparoscope-assisted surgery with curative intent' +
      '（<b>ESD should be considered for cT1 if indicated</b>）, <b>or</b> Perioperative chemotherapy（<b>can be considered</b> for cT4N+ or bulky nodes）」。<br>' +
      '也就是說<b>手術是預設路徑，圍手術期化療是可考慮的替代</b>；ESD 的門檻是 <b>cT1</b>（不是 cT1a）—— ' +
      '治癒性判定本身就允許<b>黏膜下侵犯 &lt;500 µm</b>，pT1b SM1 仍可能是治癒性 ESD。</div>');

    h += connH('gc_c3b');
    h += step('gc_s3b', '3b', 'ESD 術後病理是否為治癒性切除？',
      opt('esdcur', 'esd_cur', '治癒性（curative）', '切緣陰性、LVI(−)、submucosal 侵犯 <500µm') +
      opt('esdcur', 'esd_noncur', '非治癒性（non-curative）', '切緣陽性、LVI(+) 或深部侵犯 ≥500µm'));
    h = h.replace('id="gc_s3b"', 'id="gc_s3b" class="hidden"');

    h += connH('gc_c_pre');
    h += step('gc_s_pre', '3c', '術前化療後再分期（AGC-2 1 of 3：M0 vs M1）',
      opt('prerest', 'pre_go', '有反應或穩定 → 進行手術', 'M0 維持不變') +
      opt('prerest', 'pre_m1', '進展或新出現遠處轉移（M1）', '→ 改走 Salvage Therapy（AGC-5）') +
      opt('prerest', 'pre_intol', '無法耐受三合一處方', '→ 改鉑 + fluoropyrimidine 雙合一，再重新評估'),
      '<div class="cbx"><div class="cbx-h">再分期檢查 RESTAGING（AGC-3 2 of 2）</div><div class="cbx-items">' +
        '<span class="cb">胸部 CT／X 光</span>' +
        '<span class="cb">腹部＋骨盆 CT</span>' +
        '<span class="cb">CBC、BCS</span>' +
        '<span class="cb">上消化道內視鏡 EGD</span>' +
        '<span class="cb"><span class="cb-k">自費</span>PET/CT</span>' +
      '</div></div>' +
      '<div class="note"><b>AGC-2（1 of 3）把「可耐受手術 · 潛在可切除」明確分成 M0 與 M1 兩條</b>：' +
      'M0 → 原發治療；<b>M1 → Salvage Therapy（AGC-5）</b>。也就是說最初判定的 M0 <b>不是永久的</b>，' +
      '術前化療期間變成 M1 就要換路。</div>');
    h = h.replace('id="gc_s_pre"', 'id="gc_s_pre" class="hidden"');

    h += connH('gc_c4');
    h += step('gc_s4', '4', '手術切除結果（R status）',
      opt('rstatus', 'R0', 'R0 切除', '無殘存腫瘤') +
      opt('rstatus', 'R1', 'R1 切除', '顯微鏡下殘存（microscopic）') +
      opt('rstatus', 'R2', 'R2 切除', '肉眼可見殘存（gross residual）') +
      opt('rstatus', 'M1', '術中發現 M1', '開腹後發現腹膜種植、肝轉移或遠處淋巴結轉移'));
    h = h.replace('id="gc_s4"', 'id="gc_s4" class="hidden"');

    h += connH('gc_c4b');
    h += step('gc_s4b', '4b', 'R0 病理分期（決定術後輔助化療）',
      opt('pstage', 'p_early', 'pT1N0 或 pT2N0', '早期、淋巴結陰性') +
      opt('pstage', 'p_adj', 'pT3、pT4 或 任何 T、N+', '侵犯較深或淋巴結轉移'));
    h = h.replace('id="gc_s4b"', 'id="gc_s4b" class="hidden"');

    h += '</div>'; // gc_res

    h += rec('gc_loco_rec', '建議處置 · 侷限性 Locoregional');

    // 不可切除（fit）化療後再分期（AGC-3, 2 of 2）— 置於建議處置之後
    h += connH('gc_c_restage');
    h += step('gc_s_restage', '3d', '化療後再分期反應（AGC-3, 2 of 2）',
      opt('restage', 'ccr', '臨床完全緩解（cCR）或大幅反應', 'clinical CR / major response') +
      opt('restage', 'residual', '殘存病灶／局部或遠處轉移', 'residual, locoregional and/or distant'),
      '<div class="cbx"><div class="cbx-h">再分期檢查 RESTAGING（AGC-3 2 of 2）</div><div class="cbx-items">' +
        '<span class="cb">胸部 CT／X 光</span>' +
        '<span class="cb">腹部＋骨盆 CT</span>' +
        '<span class="cb">CBC、BCS</span>' +
        '<span class="cb">上消化道內視鏡 EGD</span>' +
        '<span class="cb"><span class="cb-k">自費</span>PET/CT</span>' +
      '</div></div>');
    h = h.replace('id="gc_s_restage"', 'id="gc_s_restage" class="hidden"');

    h += '<div class="flow-fu hidden" id="gc_loco_fu"></div>';
    h += '</div>'; // gc_loco

    /* ===================== M1 轉移性 ===================== */
    h += '<div id="gc_meta" class="hidden">';
    h += conn('gc_mc2');
    h += step('gc_s_mline', '2', '目前是第幾線治療？（AGC-5 2 of 3／3 of 3）',
      opt('mline', 'm_1st', '一線 First line', '生物標記在這一線決定要加什麼藥') +
      opt('mline', 'm_2nd', '二線 Second line', '') +
      opt('mline', 'm_3rd', '三線以後 Third line or later', ''),
      '<div class="note"><b>先問線別，是為了不要把二線、三線的藥表倒在一個還沒開始治療的病人面前。</b>' +
      '一線的內容由生物標記決定（見下面兩步）；二線與三線後的清單則與標記關係較小。</div>');

    h += connH('gc_c_mps');
    h += step('gc_s_mps', '3', '體能狀態 → 化療骨架（AGC-5 2 of 3）',
      opt('mps', 'ps_good', '體能良好', 'Karnofsky &gt;50 且 ECOG ≤2 → <b>含鉑雙合一</b>為標準治療') +
      opt('mps', 'ps_poor', '體能不佳', 'Karnofsky ≤50 或 ECOG 3 → <b>改用 5-FU 為基礎</b>'),
      kpsDetailsHtml());
    h = h.replace('id="gc_s_mps"', 'id="gc_s_mps" class="hidden"');

    h += connH('gc_c_mbio');
    h += step('gc_s_mbio', '4', '生物標記 → 一線要加什麼（AGC-5 2 of 3）',
      opt('mbio', 'b_her2_hi', '<b>HER2 陽性</b>，且 PD-L1 <b>CPS ≥1</b>', 'IHC 3+ 或 IHC 2+/ISH(+)；CPS 以 Dako 22C3 判讀') +
      opt('mbio', 'b_her2_lo', '<b>HER2 陽性</b>，且 PD-L1 <b>CPS &lt;1</b>', '') +
      opt('mbio', 'b_msi', 'HER2 陰性 · <b>dMMR／MSI-H</b>', '不分線別皆可加抗 PD-1') +
      opt('mbio', 'b_cps5', 'HER2 陰性 · PD-L1 <b>CPS ≥5</b>', 'Dako 28-8；台灣唯一有給付的免疫治療入口') +
      opt('mbio', 'b_cps1', 'HER2 陰性 · PD-L1 <b>CPS 1–4</b>', '') +
      opt('mbio', 'b_cldn', 'HER2 陰性 · <b>CLDN18.2 陽性</b>', '≥75% 存活腫瘤細胞呈 2+/3+ 膜染色') +
      opt('mbio', 'b_none', 'HER2 陰性 · 上述標記皆陰性', '單純化療'),
      '<div class="note"><b>四個標記要一起看，不是挑一個</b>：HER2、PD-L1 CPS、MMR／MSI、CLDN18.2。<br>' +
      '<b>HER2 判讀（AGC-5 註 c）</b>：IHC 3+，或 IHC 2+ 且 ISH 陽性。' +
      '<b>兩種 PD-L1 抗體不可混用（註 d）</b>：pembrolizumab 用 <b>Dako 22C3</b>（CPS ≥1），nivolumab 用 <b>Dako 28-8</b>（CPS ≥5）。<br>' +
      '<b>同時 PD-L1 陽性且 CLDN18.2 陽性者，指引明文說最佳順序「尚未確立」</b>' +
      '（先 zolbetuximab、先免疫治療、或併用），待 ILUSTRO（NCT03505320）與 LUCERNA（NCT06011531）之結果 —— ' +
      '此時請依腫瘤負荷、症狀急迫性與給付可近性於多專科會議決定，並把不確定性告知病人。</div>');
    h = h.replace('id="gc_s_mbio"', 'id="gc_s_mbio" class="hidden"');

    h += rec('gc_meta_rec', '建議處置 · 轉移性 Systemic');
    h += '<div class="flow-fu hidden" id="gc_meta_fu"></div>';
    h += '</div>'; // gc_meta

    h += '<div class="flow-reset"><button class="btn-reset" onclick="gcReset()">重置</button></div>';
    h += '</div>'; // gcPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function gcSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function gcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function gcClearSel(ids) {
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

  /* ---------- 追蹤區塊（AGC-4）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（AGC-4）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查（Hx &amp; P.E.）：前 3 年每 3–4 個月，之後每 4–6 個月。</li>' +
        '<li>CBC、血小板、生化（BCS）：視臨床需要。</li>' +
        '<li>影像學（Chest／Abd＋Pelvis CT）或內視鏡：視臨床需要。</li>' +
        '<li>CEA：每 3–6 個月（尤其初始即升高者）。</li>' +
        '<li>維生素 B12：近端／全胃切除者每 6–12 個月監測；連續兩次正常可停止例行監測。</li>' +
        '<li><b>復發時先看體能狀態再決定救援治療（AGC-4）</b>：' +
        '<b>KPS ≥60 或 ECOG ≤2</b> → 系統性治療（AGC-5）<b>或臨床試驗</b>；' +
        '<b>KPS ≤50 或 ECOG ≥3</b> → <span class="rx">HDFL</span>（或其他 5-FU/leucovorin）<b>或最佳支持治療／安寧療護</b>。' +
        '這一格決定的是病人拿到含鉑雙合一還是舒適照護，不能跳過。</li>' +
        '<li><b>臨床試驗（AGC-4 註 b）</b>：台大與 NCCN 皆認為任何癌症病人的最佳處置是參加臨床試驗，並<b>特別鼓勵</b>參與。</li>' +
        '</ul>';
    } else { // palliative / supportive
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care（AGC-4）</div><ul class="fu-list">' +
        '<li><b>已做過胃切除者，AGC-4 的術後追蹤項目一樣要做</b>（AGC-3 把每一條手術結果都接到 AGC-4）：' +
        '病史＋理學檢查前 3 年每 3–4 個月、之後每 4–6 個月；CEA 每 3–6 個月；' +
        '<b>近端或全胃切除者每 6–12 個月監測維生素 B12</b>（連續兩次正常可停止例行監測）。</li>' +
        '<li>定期評估治療反應與毒性（影像／內視鏡視需要）；持續追蹤體能狀態。</li>' +
        '<li>CEA、CBC、生化視臨床需要監測；近端／全胃切除者監測維生素 B12。</li>' +
        '<li>疾病進展 → 次線／後線系統性治療或臨床試驗。</li>' +
        '<li>支持治療模式：<b>阻塞</b>—stent／雷射／光動力／RT／手術；<b>營養</b>—腸道營養、營養諮詢；<b>疼痛</b>—RT 及／或藥物；<b>出血</b>—RT／內視鏡治療／經動脈栓塞。</li>' +
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

  /* ---------- 系統性治療（1st/2nd/3rd line）詳述 ---------- */
  function kpsDetailsHtml() {
    var rows = [
      ['100%', 'Normal, no complaints, no signs of disease'],
      ['90%', 'Capable of normal activity, few symptoms or signs of disease'],
      ['80%', 'Normal activity with some difficulty, some symptoms or signs'],
      ['70%', 'Caring for self, not capable of normal activity or work'],
      ['60%', 'Requiring some help, can take care of most personal requirements'],
      ['50%', 'Requires help often, requires frequent medical care'],
      ['40%', 'Disabled, requires special care and help'],
      ['30%', 'Severely disabled, hospital admission indicated but no risk of death'],
      ['20%', 'Very ill, urgently requiring admission, requires supportive measures or treatment'],
      ['10%', 'Moribund, rapidly progressive fatal disease processes'],
      ['0%', 'Death']
    ];
    var t = '<details class="kps-details"><summary>Karnofsky Performance Status（KPS）分級表 ▸</summary><table>';
    rows.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    t += '</table></details>';
    return t;
  }

  var systemicNote =
    'HER2+ 定義：IHC 3+ 或 IHC 2+ 且 ISH(+)。PD-L1：nivolumab 用 CPS ≥5（Dako 28-8）、pembrolizumab CPS ≥1（Dako 22C3）。CLDN18.2+：2+/3+ 膜染色 ≥75% 存活腫瘤細胞。健保於此癌別只給付 nivolumab（限 CPS ≥5 且 HER2 陰性）與 zolbetuximab（限 HER2 陰性、CLDN18.2 陽性，115/04/01 起，不論 PD-L1）；pembrolizumab、ramucirumab、paclitaxel、T-DXd 與後線 PD-1 抑制劑多需自費。輔助情境之 capecitabine、oxaliplatin、docetaxel 亦未給付（AGC-5 註 b）。';

  /* 把一線／二線／三線的完整選單收進可折疊區塊：
     很多建議卡真正要講的是「這一步要做什麼決定」，把整份藥表攤在前面反而看不到重點。 */
  function systemicDetails(label) {
    return '<details class="rx-more"><summary>' + (label || '系統性治療細節') + ' ▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px"><ul class="rx-items"><li>' +
      systemicLines().join('</li><li>') + '</li></ul></div></details>';
  }

  function systemicLines() {
    return [
      '<span class="rx-h">化療骨架 Backbone</span><br>體能良好 → 含鉑雙合一 <span class="rx">FOLFOX</span>／<span class="rx">CAPOX</span>／<span class="rx">FP</span>（<span class="drug">cisplatin</span> 或 <span class="drug">oxaliplatin</span> ＋ <span class="drug">5-FU</span>／<span class="drug">capecitabine</span>／<span class="drug">S-1</span>）；體能不佳（KPS ≤50／ECOG 3）→ <span class="rx">HDFL</span>（週 24hr <span class="drug">5-FU</span> 2,000–2,600 mg/m²＋<span class="drug">leucovorin</span> 300 mg/m²）或 5-FU/LV。' + kpsDetailsHtml(),
      '<span class="rx-h">一線 1st line</span>　<span class="rx-sub">依 HER2／PD-L1／MMR-MSI／CLDN18.2 加成</span><ul>' +
        '<li><b>HER2+ · CPS &lt;1</b>：＋<span class="drug">trastuzumab</span>（ToGA）。<b>CPS ≥1</b>：＋<span class="drug">trastuzumab</span> 與 <span class="drug">pembrolizumab</span>（KEYNOTE-811）—— <b>pembrolizumab 需自費</b>。</li>' +
        '<li><b>HER2− · PD-L1 CPS ≥5</b>：＋<span class="drug">nivolumab</span>（CheckMate 649）—— ' +
        '<b>健保只給付 nivolumab，且限 CPS ≥5 且 HER2 陰性者</b>（AGC-5 註 d）。' +
        '<b>CPS ≥1</b>：＋<span class="drug">pembrolizumab</span>（KEYNOTE-859）—— <b>需自費</b>。</li>' +
        '<li><b>dMMR／MSI-H</b>：＋<span class="drug">nivolumab</span> 或 <span class="drug">pembrolizumab</span>' +
        '（ESMO Pan-Asia 指引建議<b>不分線別</b>加上抗 PD-1，AGC-5 註 e）。</li>' +
        '<li><b>CLDN18.2+</b>：＋<span class="drug">zolbetuximab</span>（SPOTLIGHT／GLOW）—— ' +
        '<b>健保自 115/04/01 起給付 HER2 陰性且 CLDN18.2 陽性者，且不論 PD-L1 表現</b>（AGC-5 註 f）。' +
        'CLDN18.2 陽性定義：<b>≥75% 存活腫瘤細胞呈中度至強度（2+ 或 3+）膜染色</b>。</li>' +
        '<li><b>臨床試驗</b>（HER2 陽性與陰性兩個方塊都列出這一條）。</li>' +
        '<li><b>⚠ 同時 PD-L1 陽性且 CLDN18.2 陽性者怎麼排？</b>指引明文：' +
        '<b>最佳順序（先 zolbetuximab、先免疫治療、或併用）尚未確立</b>，' +
        '有待 <b>ILUSTRO（NCT03505320）</b>與 <b>LUCERNA（NCT06011531）</b>之結果。' +
        '這是多專科會議上最常卡住的一格，指引選擇誠實地說「還不知道」。</li>' +
        '</ul>',
      '<span class="rx-h">二線 2nd line</span><br><span class="drug">docetaxel</span>（COUGAR-02）；' +
      '<b>單一藥物或合併處方</b>：<span class="drug">cisplatin</span>、<span class="drug">oxaliplatin</span>、taxane 類、' +
      '<span class="drug">irinotecan</span>、<span class="rx">5-FU/HDFL</span>、<span class="drug">capecitabine</span>、<span class="drug">S-1</span>' +
      '；<span class="drug">ramucirumab</span> ± <span class="drug">paclitaxel</span>（RAINBOW）；' +
      'HER2+ 可用 <span class="drug">trastuzumab deruxtecan</span>（T-DXd）—— <b>用之前應重新切片確認 HER2 仍為陽性</b>，' +
      '一線治療後 HER2 轉陰並不少見；臨床試驗。',
      '<span class="rx-h">三線後 3rd line+</span><br><span class="drug">trifluridine/tipiracil</span>（TAGS）；<span class="drug">nivolumab</span>（ATTRACTION-2）；<span class="drug">pembrolizumab</span>（CPS ≥1 或 MSI-H／dMMR）；臨床試驗。'
    ];
  }

  /* ---------- 主渲染 ---------- */
  function gcRender() {
    var s = gcSt;

    gcShow('gc_loco', s.scope === 'loco');
    gcShow('gc_c2', s.scope === 'loco');
    gcShow('gc_meta', s.scope === 'm1');
    gcShow('gc_mc2', s.scope === 'm1');

    // M0
    var res = (s.fit === 'fit_res');
    gcShow('gc_res', res);
    gcShow('gc_c3', res);
    var esd = res && s.strat === 'esd';
    gcShow('gc_c3b', esd);
    gcShow('gc_s3b', esd);
    var periop = res && s.strat === 'periop';
    gcShow('gc_c_pre', periop);
    gcShow('gc_s_pre', periop);
    var esdNoncur = (s.strat === 'esd' && s.esdcur === 'esd_noncur');
    // 圍手術期化療者，要先過「術前再分期」這一關才進手術結果；
    // 進展成 M1 或無法耐受處方者不該再被問 R status。
    var surgical = (s.strat === 'upfront') || (periop && s.prerest === 'pre_go');
    var showR = res && (surgical || esdNoncur);
    gcShow('gc_c4', showR);
    gcShow('gc_s4', showR);
    var showPs = showR && s.rstatus === 'R0';
    gcShow('gc_c4b', showPs);
    gcShow('gc_s4b', showPs);
    var unres = (s.fit === 'fit_unres' || s.fit === 'unfit');
    gcShow('gc_c_restage', unres);
    gcShow('gc_s_restage', unres);
    renderLocoRec();

    // M1
    renderMetaRec();
  }

  function renderLocoRec() {
    var s = gcSt;
    if (s.scope !== 'loco') return;
    var R = 'gc_loco_rec', F = 'gc_loco_fu';

    if (!s.fit) { idleRec(R, F, '請選擇步驟 2（醫療適合度）'); return; }

    // 可耐受手術但不可切除 → 系統性化療 → 再分期
    if (s.fit === 'fit_unres') {
      if (!s.restage) {
        result(R, F, 'rec-nonop', '不可切除（M0）：系統性化療 → 再分期', [
          '<b>先做全身性化療</b>，完成後<b>依再分期反應決定後續</b>（見下方步驟 3d）—— ' +
          '反應好的病人 <b>AGC-3（2 of 2）留有回到手術的出口</b>，不要把這一支當成單純的緩解治療。',
          palliativeSurgLine(),
          systemicDetails('化療處方與線別（AGC-5）')
        ], systemicNote + '｜AGC-1：Medically fit, unresectable → Salvage therapy ± Palliative surgery。', null);
      } else if (s.restage === 'ccr') {
        result(R, F, 'rec-elective', '化療後 cCR／大幅反應 → 手術（若適合）', [
          '<span class="rx-h">這一步要決定的事</span>',
          '<b>AGC-3（2 of 2）原文：「Surgery, if appropriate; or Follow-up for cCR（see AGC-4）」</b> —— ' +
          '兩個並列選項：<b>技術可行且體能允許 → 接受根治性手術</b>；<b>達 cCR 者亦可選擇密切追蹤</b>。',
          '手術前應完成再分期檢查（見上方步驟 3d 的清單），特別是<b>重新排除腹膜擴散</b>。',
          '若決定開刀，接下來走步驟 4 的手術結果（R status）。',
          systemicDetails('化療內容與後線選單')
        ], systemicNote, 'curative');
      } else {
        result(R, F, 'rec-nonop', '化療後殘存／轉移 → Salvage therapy', [
          '<b>再分期：殘存病灶／局部或遠處轉移</b> → 接續 salvage 系統性治療或臨床試驗；必要時局部治療（放射治療）。',
          palliativeSurgLine(),
          systemicDetails('系統性治療細節（線別與生物標記）')
        ], systemicNote, 'palliative');
      }
      return;
    }

    // 無法耐受大手術 → 系統性化療 → 再分期（AGC-2 把「可耐受但不可切除」與「無法耐受手術」括在同一個括號裡，
    // 兩者都是 M0 → Chemotherapy（AGC-5）→ Adjunctive Treatment Post-chemotherapy（AGC-3），
    // 也就是說反應好的病人仍有回到手術的機會。原本這一支是死路，反應再好也走不到手術。）
    if (s.fit === 'unfit') {
      var unfitNote = '<b>「無法耐受大手術」與「體能狀態差」不是同一件事</b> —— ' +
        '心肺共病導致無法接受大手術的病人，體能可能仍足以接受全劑量化療；' +
        '化療骨架的選擇請依 <b>KPS／ECOG</b> 判斷（見下方），不要因為不能開刀就自動降階。';
      if (!s.restage) {
        result(R, F, 'rec-nonop', '無法耐受大手術（M0）：系統性化療 → 再分期',
          [unfitNote, systemicDetails('化療處方與線別（AGC-5）')],
          systemicNote + '｜AGC-2（1 of 3）：Medically fit, unresectable <b>或</b> Medically unfit（M0）→ Chemotherapy（AGC-5）→ Adjunctive Treatment Post-chemotherapy（AGC-3）。完成化療後請於下方步驟 3 選擇再分期結果。', null);
      } else if (s.restage === 'ccr') {
        result(R, F, 'rec-elective', '化療後 cCR／大幅反應 → 重新評估手術可行性',
          [unfitNote, '<b>再分期：臨床完全緩解（cCR）或大幅反應</b> → <b>若共病已改善且技術可行，仍可考慮根治性手術</b>（AGC-3 之 Surgery, if appropriate）；' +
           'cCR 者亦可選擇密切追蹤（AGC-4）。', systemicDetails('化療處方與線別（AGC-5）')],
          systemicNote, 'curative');
      } else {
        result(R, F, 'rec-nonop', '化療後殘存／轉移 → Salvage therapy',
          [unfitNote, '<b>再分期：殘存病灶／局部或遠處轉移</b> → 接續 salvage 系統性治療或臨床試驗；必要時局部治療（放射治療）。',
           palliativeSurgLine(),
           '<b>體能極差（KPS ≤50／ECOG 3）→ 最佳支持治療（BSC）／安寧療護。</b>',
           systemicDetails('化療處方與線別（AGC-5）')],
          systemicNote, 'palliative');
      }
      return;
    }

    // 可耐受手術、可切除
    if (!s.strat) { idleRec(R, F, '請選擇步驟 3（治療策略）'); return; }

    // ESD 分支
    if (s.strat === 'esd' && !s.esdcur) {
      result(R, F, 'rec-elective', '內視鏡黏膜下剝離（ESD）', [
        '<div class="cbx"><div class="cbx-h">適應症 Endoscopic resection with curative intent　' +
          '<span class="cbx-sub">符合任一即可</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">①</span>分化型、無潰瘍（不限大小）</span>' +
          '<span class="cb"><span class="cb-k">②</span>分化型、有潰瘍且腫瘤 ≤3cm</span>' +
          '<span class="cb"><span class="cb-k">③</span>未分化型、無潰瘍且腫瘤 ≤2cm</span>' +
        '</div></div>',
        '完成後依病理判定是否為治癒性切除（見步驟 3b）。'
      ], 'AGC-2：cT1 符合條件者可考慮 ESD。', null);
      return;
    }
    if (s.esdcur === 'esd_cur') {
      result(R, F, 'rec-elective', 'ESD 治癒性切除 → 觀察追蹤', [
        '<b>治癒性判定（AGC-2 3 of 3）</b>：<b>切緣陰性、脈管侵犯(−)、黏膜下侵犯 &lt;500 µm</b>，三者皆須符合。' +
        '指引在此格只寫 <b>Observation</b>。',
        '<span class="rx-h">指引未列但一定要做的兩件事</span>',
        '<b>① 檢測並根除幽門螺旋桿菌</b>。',
        '<b>② 每年內視鏡監測異時性胃癌</b> —— 即使根除成功，異時性胃癌仍會發生（文獻報告 5 年累積發生率約 9%），' +
        '故監測不能因為根除而停止。<b>這兩條為指引外之實務補充，台大胃癌診療指引未規範。</b>',
        '<b>注意：下方追蹤表中的維生素 B12 監測是給「近端或全胃切除」病人的，ESD 病人不適用。</b>'
      ], 'AGC-2（3 of 3）：Margin free, and lymphovascular invasion(−), and submucosal invasion &lt; 500 µm → Curative → Observation。' +
        'H. pylori 根除與每年內視鏡監測為指引外之實務補充。', 'curative');
      return;
    }

    // 以下為切除後 R status：手術（upfront／periop）或 ESD 非治癒性追加手術共用
    var esdNoncur = (s.strat === 'esd' && s.esdcur === 'esd_noncur');

    if (!s.rstatus) {
      var lead = [];
      if (esdNoncur) {
        lead.push('<b>AGC-2（3 of 3）把三個選項並列，沒有標示優先順序</b>：' +
          '<b>① 追加胃切除 + 淋巴結廓清（D2）　② 重做 ESD　③ 密切觀察</b>。' +
          '本頁不替指引加上「首選」二字 —— 實務上是依殘存病灶的淋巴結轉移風險（垂直切緣、侵犯深度、脈管侵犯）、' +
          '病人共病與意願，經多專科討論後決定。');
        lead.push('追加手術後依切除結果（R status）決定後續（見下方步驟 4）。');
        result(R, F, 'rec-nonop', 'ESD 非治癒性 → 追加胃切除 + D2', lead,
          'AGC-2：non-curative ESD → surgical resection／repeat ESD／close observation。', null);
        return;
      }
      // 圍手術期化療：先處理術前再分期的三個出口，之後才談手術
      if (s.strat === 'periop') {
        var pre = [
          '<b>術前處方（AGC-5 1 of 3）</b>：三合一化療 <span class="rx">FLOT</span>' +
          '（<span class="drug">5-FU</span>＋<span class="drug">leucovorin</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">docetaxel</span>）' +
          '或 <span class="rx">DOS</span>（<span class="drug">docetaxel</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">S-1</span>）為優先；' +
          '<b>無法耐受三合一者，鉑 + fluoropyrimidine 雙合一為替代方案</b>（指引明文）。',
          '<b>適應症</b>：臨界可切除（<b>cT4N+ 或 bulky N</b>）者「可考慮」使用，非強制。',
          '<b>durvalumab + FLOT（MATTERHORN）</b>：AGC-2 註 b 明文「僅美國 FDA 核准、<b>TFDA 尚未核准</b>」，' +
          '健保亦未給付；可作為臨床試驗或自費討論之選項（指引狀態日期 2026/06）。<br>' +
          '<b>〔指引外之試驗數據，供討論用〕</b>MATTERHORN 第三期試驗（Janjigian YY et al. NEJM 2025;393:217-230，948 人）：' +
          '<b>2 年無事件存活 67.4% vs 58.5%（HR 0.71，95% CI 0.58–0.86，P&lt;0.001）</b>、' +
          '<b>病理完全緩解 19.2% vs 7.2%</b>；2 年整體存活 75.7% vs 70.4%。' +
          '<b>⚠ 存活的比較未達其預設的顯著門檻</b>（P=0.03，門檻為 P&lt;0.0001）—— ' +
          '主要指標是無事件存活，講給病人聽時這一點要說清楚。' +
          'Grade 3/4 不良事件兩組相當（71.6% vs 71.2%）。'
        ];
        if (!s.prerest) {
          result(R, F, 'rec-nonop', '圍手術期化療（術前段）→ 完成後再分期', pre.concat([
            '<b>完成術前化療後務必再分期</b>（見下方步驟 3c 的檢查清單）—— ' +
            'AGC-2（1 of 3）把「可耐受手術 · 潛在可切除」分成 <b>M0</b>（→ 原發治療）與 <b>M1</b>（→ Salvage Therapy，AGC-5）兩條，' +
            '<b>最初判定的 M0 不是永久的</b>。'
          ]), 'AGC-5（1 of 3）：Perioperative chemotherapy；AGC-2（1 of 3）：M0／M1 兩條分支。', null);
          return;
        }
        if (s.prerest === 'pre_m1') {
          result(R, F, 'rec-urgent', '術前化療期間進展或新出現 M1 → 改走 Salvage Therapy（AGC-5）', [
            '<b>不再進手術室</b>：AGC-2（1 of 3）把此格直接接到 <b>Salvage Therapy（AGC-5）</b>。',
            '<b>先確認這是真的進展</b>：以再分期檢查（胸部 CT／X 光、腹部＋骨盆 CT、EGD、CBC/BCS，必要時自費 PET/CT）判定。',
            '<b>換線原則</b>：一線用過含鉑三合一者，二線依 AGC-5 選 docetaxel、單方或合併處方、ramucirumab ± paclitaxel；' +
            'HER2 陽性者用 T-DXd（<b>用前需重新切片確認 HER2</b>）。',
            palliativeSurgLine(),
            systemicDetails('救援化療處方與線別（AGC-5）')
          ], 'AGC-2（1 of 3）：Medically fit, potentially resectable → M1 → Salvage Therapy（see AGC-5）。', 'palliative');
          return;
        }
        if (s.prerest === 'pre_intol') {
          result(R, F, 'rec-nonop', '無法耐受三合一處方 → 改鉑 + fluoropyrimidine 雙合一', [
            '<b>AGC-5（1 of 3）明文</b>：「For patients unable to tolerate triplet regimen, ' +
            '<b>a combination of platinum and fluoropyrimidine may be an alternative</b>」。',
            '也就是 <span class="rx">FOLFOX</span>／<span class="rx">CAPOX</span>／<span class="rx">FP</span> 之類的雙合一，' +
            '<b>不是直接放棄術前治療</b>。',
            '換成雙合一後<b>重新評估反應與手術可行性</b>；可回到步驟 3c 選「有反應或穩定」繼續。',
            '<b>體能極差（KPS ≤50／ECOG 3）者</b>，化療骨架應改為 5-FU 為基礎（<span class="rx">HDFL</span>）。',
            systemicDetails('化療骨架與線別（AGC-5）')
          ], 'AGC-5（1 of 3）：三合一無法耐受時之替代方案。', null);
          return;
        }
        lead = lead.concat(pre);
      }
      lead.push('遠端癌：<b>次全胃切除</b>（首選）；近端／賁門癌：全胃或近端胃切除。');
      lead.push('<b>D2 廓清</b>（D0 不可接受）；建議切緣 >5cm；至少評估 <b>16 顆</b>淋巴結。');
      lead.push('<b>脾臟切除：盡可能避免</b>（AGC-2 2 of 3 原文「Splenectomy: avoided, if possible」）—— ' +
        '這是這個方塊裡唯一會改變開刀當下動作的一條，近端／大彎側腫瘤合併 No.10／11d 疑似轉移時最常被拿出來討論。');
      lead.push('<b>不可切除的判定準則（AGC-2 2 of 3）</b>：① 腹膜種植或遠處轉移；② 無法完整切除；③ 主要血管被侵犯或包覆。');
      if (s.strat === 'periop') lead.push('術後接續完成圍手術期化療。');
      result(R, F, 'rec-elective',
        s.strat === 'periop' ? '圍手術期化療 → 根治性胃切除 + D2' : '根治性胃切除 + D2 廓清',
        lead,
        'AGC-2：D2 recommended、≥16 nodes；perioperative 三合一（FLOT／DOS）用於 cT4N+ 或 bulky N。durvalumab+FLOT 僅 US FDA 核准，TFDA 未核准。', null);
      return;
    }

    if (s.rstatus === 'R1') {
      result(R, F, 'rec-elective', 'R1（顯微殘存）→ 術後輔助化療（與 pT3-4／N+ 同一組）',
        adjuvantLines().concat([
          '<b>AGC-3（1 of 2）原圖：R1 的箭頭指向的是「ADJUVANT CHEMOTHERAPY」那個方塊</b>，' +
          '與 pT3、pT4 或 Any T、N+ 共用同一份處方清單，之後接<b>追蹤（AGC-4）</b>。' +
          '走 salvage 化療的是 <b>R2</b>，不是 R1。',
          '<b>再切除與局部放療未見於本指引之 R1 條文</b>（放療只出現在 AGC-4 之支持治療：阻塞、疼痛、出血）。' +
          '若團隊考慮再切除，屬指引之外，請經多專科討論並記錄。'
        ]),
        'AGC-3（1 of 2）：R1 resection（microscopically residual cancer）→ ADJUVANT CHEMOTHERAPY → Follow-up（see AGC-4）。', 'curative');
      return;
    }
    if (s.rstatus === 'R2') {
      result(R, F, 'rec-urgent', 'R2（肉眼殘存）→ Salvage 化療 或 最佳支持治療',
        ['肉眼可見殘存 → 系統性治療；<b>體能極差者為最佳支持治療</b>（AGC-3 原文即如此二選一）。',
         palliativeSurgLine(),
         '<b>此類病人仍需 AGC-4 的術後追蹤項目</b>（近端／全胃切除者之維生素 B12、CEA 與定期理學檢查），見下方追蹤區塊。',
         systemicDetails('救援化療處方與線別（AGC-5）')],
        systemicNote + '｜AGC-3（1 of 2）：R2 resection（grossly residual cancer）→ Salvage Chemotherapy（see AGC-5）or Best supportive care（very poor performance status）。', 'palliative');
      return;
    }
    if (s.rstatus === 'M1') {
      result(R, F, 'rec-urgent', '術中發現遠處／腹膜轉移（M1）→ Salvage 化療',
        ['<b>AGC-3（1 of 2）之手術結果有四條箭頭，M1 是第四條</b> —— 開腹後才發現腹膜種植、肝轉移或遠處淋巴結轉移，' +
         '在胃癌是常見情形，處置直接走 <b>Salvage Chemotherapy（AGC-5）</b>。',
         palliativeSurgLine(),
         systemicDetails('救援化療處方與線別（AGC-5）')],
        systemicNote + '｜AGC-3（1 of 2）：M1 → Salvage Chemotherapy（see AGC-5）。', 'palliative');
      return;
    }

    // R0
    if (!s.pstage) { idleRec(R, F, 'R0 → 請選擇步驟 4b（病理分期）'); return; }
    if (s.pstage === 'p_early') {
      result(R, F, 'rec-elective', 'R0 + pT1–2 N0 → 追蹤觀察', [
        '不需輔助化療；定期追蹤（見下方追蹤）。'
      ], '', 'curative');
    } else {
      result(R, F, 'rec-elective', 'R0 + pT3–4 或 N+ → 術後輔助化療', adjuvantLines(),
        'AGC-5（1 of 3）：D2 切除後 pT3-4 或 pN+ → post-operative chemotherapy，最佳療程尚未確立。S-1+docetaxel 與 SOX 於 pStage III 之 3 年無復發存活優於 S-1 單方；惟 capecitabine／oxaliplatin／docetaxel 於 adjuvant 未納健保。', 'curative');
    }
  }

  /* AGC-3 之 ADJUVANT CHEMOTHERAPY 方塊：R0 之 pT3-4／N+ 與 R1 共用同一份清單 */
  function adjuvantLines() {
    return [
      '<span class="rx-h">最佳療程尚未確立</span>　<span class="rx-sub">Optimal regimen not established；可依病人狀況與醫病討論選擇</span>',
      '<span class="rx">S-1</span> 單方（ACTS-GC）。',
      '<span class="rx">HDFL</span>（週 24hr <span class="drug">5-FU</span> 2,000–2,600 mg/m²＋<span class="drug">leucovorin</span> 300 mg/m²）。',
      '<span class="rx">XELOX</span>（<span class="drug">capecitabine</span>＋<span class="drug">oxaliplatin</span>，CLASSIC）。',
      '<span class="rx">S-1 + docetaxel</span>（<span class="drug">S-1</span>＋<span class="drug">docetaxel</span>，JACCRO GC-07）— <b>pStage III 建議</b>。',
      '<span class="rx">SOX</span>（<span class="drug">S-1</span>＋<span class="drug">oxaliplatin</span>，ARTIST 2）— <b>pStage III 建議</b>。'
    ];
  }

  /* AGC-1 把三條非治癒路徑都收在「Salvage therapy ± Palliative surgery」，
     其註 c 同時給了適應症與一條明確的禁止事項 —— 對外科使用者這是 AGC-1 最實用的一段。 */
  function palliativeSurgLine() {
    return '<span class="rx-h">姑息性手術 Palliative surgery</span>　<span class="rx-sub">AGC-1（2 of 2）註 c</span>　' +
      '姑息性切除或繞道手術，用於<b>解除機械性阻塞</b>或<b>止住明顯的消化道出血</b>。' +
      '<b>⚠ 腹膜癌症擴散合併惡性腹水者，不常規置放餵食空腸造廔或胃造廔。</b>';
  }

  function renderMetaRec() {
    var s = gcSt;
    if (s.scope !== 'm1') return;
    var R = 'gc_meta_rec', F = 'gc_meta_fu';
    if (!s.mline) { idleRec(R, F, '請選擇步驟 2（目前是第幾線治療）'); return; }
    if (!s.mps) { idleRec(R, F, '請選擇步驟 3（體能狀態）'); return; }

    var backbone = (s.mps === 'ps_good')
      ? '<b>化療骨架：含鉑雙合一</b>（<span class="drug">cisplatin</span> 或 <span class="drug">oxaliplatin</span> ＋ ' +
        '<span class="drug">5-FU</span>／<span class="drug">capecitabine</span>／<span class="drug">S-1</span>，' +
        '可加或不加 leucovorin）—— AGC-5 稱此為「體能良好者之標準治療」。'
      : '<b>化療骨架：5-FU 為基礎</b>（<span class="rx">HDFL</span>：每週 24 小時輸注 <span class="drug">5-FU</span> 2,000–2,600 mg/m² ＋ ' +
        '<span class="drug">leucovorin</span> 300 mg/m²，最高 500 mg；或其他 5-FU/leucovorin 為基礎之處方）—— ' +
        'AGC-5 明列此為 <b>Karnofsky ≤50 或 ECOG 3</b> 者之骨架，<b>不要硬上含鉑雙合一</b>。';

    if (s.mline === 'm_2nd') {
      result(R, F, 'rec-nonop', '轉移性（M1）· 二線治療（AGC-5 3 of 3）', [
        backbone,
        '<b>二線選項（指引並列，無首選）</b>：<span class="drug">docetaxel</span>（COUGAR-02）；' +
        '<b>單一藥物或合併處方</b>（<span class="drug">cisplatin</span>、<span class="drug">oxaliplatin</span>、taxane 類、' +
        '<span class="drug">irinotecan</span>、<span class="rx">5-FU/HDFL</span>、<span class="drug">capecitabine</span>、<span class="drug">S-1</span>）；' +
        '<span class="drug">ramucirumab</span> ± <span class="drug">paclitaxel</span>（RAINBOW）；<b>臨床試驗</b>。',
        '<b>HER2 陽性者：<span class="drug">trastuzumab deruxtecan</span>（T-DXd）</b> —— ' +
        '<b>用之前必須重新切片確認 HER2 仍為陽性</b>；胃癌的 HER2 表現本來就異質，一線 trastuzumab 之後轉陰並不罕見。' +
        '<b>〔指引參考文獻第 30 篇即為此試驗〕</b>DESTINY-Gastric04（Shitara K et al. NEJM 2025;393:336-348，494 人）：' +
        'T-DXd vs ramucirumab + paclitaxel，<b>中位整體存活 14.7 vs 11.4 個月（HR 0.70）</b>、客觀反應率 44.3% vs 29.1%。' +
        '<b>⚠ 間質性肺病／肺炎 13.9% vs 1.3%</b> —— 用藥前後要交代咳嗽與喘的警訊並定期追蹤影像。',
        '<b>健保實務</b>：ramucirumab、paclitaxel、T-DXd 多需自費；' +
        '<b>irinotecan、capecitabine、S-1 這幾個「單方或合併」選項才是有給付、開得出來的那一組</b>，' +
        '不要因為它們排在清單第二條就忽略。',
        palliativeSurgLine(),
        systemicDetails('完整處方與線別選單（AGC-5）')
      ], systemicNote + '｜AGC-5（3 of 3）2nd line therapy。', 'palliative');
      return;
    }
    if (s.mline === 'm_3rd') {
      result(R, F, 'rec-nonop', '轉移性（M1）· 三線以後（AGC-5 3 of 3）', [
        backbone,
        '<b>三線後選項</b>：<span class="drug">trifluridine/tipiracil</span>（TAGS）；' +
        '<span class="drug">nivolumab</span>（ATTRACTION-2）；' +
        '<span class="drug">pembrolizumab</span>（<b>PD-L1 CPS ≥1 或 MSI-H／dMMR</b>）；<b>臨床試驗</b>。',
        '<b>此線別的體能狀態評估比藥物選擇更重要</b>：' +
        'AGC-4 對復發病人的分流是 <b>KPS ≥60 或 ECOG ≤2 → 系統性治療或臨床試驗</b>；' +
        '<b>KPS ≤50 或 ECOG ≥3 → HDFL 或最佳支持治療／安寧療護</b>。',
        palliativeSurgLine(),
        systemicDetails('完整處方與線別選單（AGC-5）')
      ], systemicNote + '｜AGC-5（3 of 3）3rd line or later therapy；AGC-4 之體能分流。', 'palliative');
      return;
    }

    // 一線 —— 由生物標記決定加什麼
    if (!s.mbio) { idleRec(R, F, '請選擇步驟 4（生物標記）'); return; }
    var addOn = {
      b_her2_hi: ['HER2 陽性 · PD-L1 CPS ≥1 → 化療 ＋ trastuzumab ＋ pembrolizumab',
        ['<b>加 <span class="drug">trastuzumab</span> 與 <span class="drug">pembrolizumab</span></b>（KEYNOTE-811）。',
         '<b>⚠ pembrolizumab 在胃癌需自費</b> —— AGC-5 註 d 明文「<b>只有 nivolumab 獲健保給付</b>，且限 CPS ≥5 且 HER2 陰性者」。' +
         '也就是說 HER2 陽性這條路上的免疫治療一律自費。',
         '<b>二線之後若要用 T-DXd，須重新切片確認 HER2</b>。']],
      b_her2_lo: ['HER2 陽性 · PD-L1 CPS &lt;1 → 化療 ＋ trastuzumab',
        ['<b>加 <span class="drug">trastuzumab</span></b>（ToGA）。CPS &lt;1 者指引不加免疫治療。',
         '<b>HER2 定義（AGC-5 註 c）</b>：IHC 3+，或 IHC 2+ 且 ISH 陽性。',
         '<b>二線之後若要用 T-DXd，須重新切片確認 HER2</b>。']],
      b_msi: ['HER2 陰性 · dMMR／MSI-H → 化療 ＋ 抗 PD-1（不分線別）',
        ['<b>加 <span class="drug">nivolumab</span> 或 <span class="drug">pembrolizumab</span></b>。' +
         'AGC-5 註 e：<b>ESMO Pan-Asia 指引建議 dMMR／MSI-H 者不論線別皆加抗 PD-1</b>。',
         '<b>健保</b>：胃癌只有 nivolumab 有給付，且條件是 <b>CPS ≥5 且 HER2 陰性</b>；' +
         '<b>單憑 MSI-H 並不構成給付條件</b>，這一點與大腸直腸癌不同（大腸直腸癌的 MSI-H 有 pembrolizumab 一線給付）。',
         '若同時 CPS ≥5，走 nivolumab 這條在給付上比較站得住。']],
      b_cps5: ['HER2 陰性 · PD-L1 CPS ≥5 → 化療 ＋ nivolumab（台灣唯一有給付的免疫治療入口）',
        ['<b>加 <span class="drug">nivolumab</span></b>（CheckMate 649）。',
         '<b>健保給付條件（AGC-5 註 d）</b>：<b>CPS ≥5 且 HER2 陰性</b>；判讀抗體為 <b>Dako 28-8</b>。' +
         '<b>這是胃癌唯一有健保給付的免疫治療</b>，其餘（pembrolizumab）皆需自費。',
         '若同時 CLDN18.2 陽性，見下方順序未定之說明。']],
      b_cps1: ['HER2 陰性 · PD-L1 CPS 1–4 → 化療 ＋ pembrolizumab（自費）',
        ['<b>加 <span class="drug">pembrolizumab</span></b>（KEYNOTE-859，CPS ≥1）；判讀抗體為 <b>Dako 22C3</b>。',
         '<b>⚠ 需自費</b>：健保只給付 nivolumab 且門檻是 CPS ≥5（Dako 28-8）。' +
         '<b>CPS 1–4 這一段落在「有實證但沒給付」的區間</b>，開始之前要把費用講清楚。',
         '若同時 CLDN18.2 陽性，<b>zolbetuximab 反而是有給付的那一個</b>（見下）。']],
      b_cldn: ['HER2 陰性 · CLDN18.2 陽性 → 化療 ＋ zolbetuximab（有給付）',
        ['<b>加 <span class="drug">zolbetuximab</span></b>（SPOTLIGHT／GLOW）。',
         '<b>健保自 115/04/01 起給付</b>：HER2 陰性且 CLDN18.2 陽性者，<b>不論 PD-L1 表現</b>（AGC-5 註 f）。',
         '<b>CLDN18.2 陽性定義</b>：<b>≥75% 存活腫瘤細胞</b>呈中度至強度（<b>2+ 或 3+</b>）膜染色。',
         '<b>同時 PD-L1 陽性者怎麼排？指引明文說「尚未確立」</b> —— 先 zolbetuximab、先免疫治療、或併用，' +
         '待 <b>ILUSTRO（NCT03505320）</b>與 <b>LUCERNA（NCT06011531）</b>之結果。' +
         '<b>在台灣，給付可近性常常是實際的決定因素</b>：zolbetuximab 與 nivolumab（CPS ≥5）都有給付，pembrolizumab 沒有。']],
      b_none: ['HER2 陰性 · 四項標記皆陰性 → 單純化療',
        ['<b>依體能狀態選骨架即可</b>，指引在此不加任何標靶或免疫治療。',
         '<b>臨床試驗（AGC-5 一線之 HER2 陽性與陰性兩個方塊都列出這一條）</b>：' +
         'AGC-4 註 b 進一步寫「台大與 NCCN 皆認為任何癌症病人的最佳處置是參加臨床試驗，並<b>特別鼓勵</b>參與」。']]
    }[s.mbio];

    result(R, F, 'rec-nonop', '轉移性（M1）· 一線：' + addOn[0], [backbone].concat(addOn[1]).concat([
      '<b>臨床試驗</b>為 AGC-5 一線兩個方塊皆列出的選項。',
      palliativeSurgLine(),
      systemicDetails('完整處方與線別選單（AGC-5）')
    ]), systemicNote + '｜AGC-5（2 of 3）：1st line — Chemotherapy +/− Immunotherapy or Targeted therapy（according to HER-2, PD-L1, MMR/MSI, and CLDN18.2）。',
      'palliative');
    return;
  }

  /* ---------- 事件 ---------- */
  function gcPick(key, val, btn) {
    gcSel(btn);
    var s = gcSt;
    if (key === 'scope') {
      s.scope = val;
      s.fit = s.strat = s.esdcur = s.prerest = s.rstatus = s.pstage = s.restage = null;
      s.mline = s.mps = s.mbio = null;
      gcClearSel(['gc_s_mline', 'gc_s_mps', 'gc_s_mbio']);
      gcClearSel(['gc_s2', 'gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b', 'gc_s_restage']);
    } else if (key === 'fit') {
      s.fit = val; s.strat = s.esdcur = s.prerest = s.rstatus = s.pstage = s.restage = null;
      gcClearSel(['gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b', 'gc_s_restage']);
    } else if (key === 'strat') {
      s.strat = val; s.esdcur = s.prerest = s.rstatus = s.pstage = null;
      gcClearSel(['gc_s3b', 'gc_s_pre', 'gc_s4', 'gc_s4b']);
    } else if (key === 'prerest') {
      s.prerest = val; s.rstatus = s.pstage = null;
      gcClearSel(['gc_s4', 'gc_s4b']);
    } else if (key === 'esdcur') {
      // 由「非治癒性」改回「治癒性」時，若不清掉下游的 R status／病理分期，
      // 舊答案會留著並產生一張矛盾的建議卡。
      s.esdcur = val; s.rstatus = s.pstage = null;
      gcClearSel(['gc_s4', 'gc_s4b']);
    }
    else if (key === 'rstatus') { s.rstatus = val; s.pstage = null; gcClearSel(['gc_s4b']); }
    else if (key === 'pstage') { s.pstage = val; }
    else if (key === 'restage') { s.restage = val; }
    else if (key === 'mline') { s.mline = val; s.mps = s.mbio = null; gcClearSel(['gc_s_mps', 'gc_s_mbio']); }
    else if (key === 'mps') { s.mps = val; s.mbio = null; gcClearSel(['gc_s_mbio']); }
    else if (key === 'mbio') { s.mbio = val; }
    gcRender();
  }

  function gcReset() {
    for (var k in gcSt) { if (gcSt.hasOwnProperty(k)) gcSt[k] = null; }
    var root = document.getElementById('gcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    // 隱藏追蹤區塊
    ['gc_loco_fu', 'gc_meta_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    gcRender();
  }

  function initGastricPathway() { gcReset(); }

  // 匯出
  global.gastricPathwayHTML = gastricPathwayHTML;
  global.initGastricPathway = initGastricPathway;
  global.gcPick = gcPick;
  global.gcReset = gcReset;
})(window);
