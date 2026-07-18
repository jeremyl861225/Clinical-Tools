/* ============================================================
   神經內分泌瘤治療互動決策流程 Neuroendocrine Tumor Treatment Pathway
   直腸 NET 局部治療流程資料來源：
     國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引 版次 21（2026/06/16），NET-1
     （NET-2 為 AJCC v9 直腸／結腸 NET 分期表，見「分期」分頁）
   ※ NET-1 之流程結構依第 19 頁決策圖判讀（非文字順序）：
     先分「小型偶發完整切除（<1cm）」vs「其他所有直腸腫瘤」；前者依切緣與分級，
     後者依大小（<2cm vs >2cm 或淋巴結陽性）決定切除方式。
   ※ 進展性／轉移性分支之系統性治療為<b>跨部位 GEP-NET</b>之整理（SSA／PRRT／標靶／化療），
     非 NET-1 內容；胰臟 NET 之完整流程另見「胰臟神經內分泌腫瘤（pNET）」條目。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var ntSt = {
    setting: null,  // inc | other | adv   （情境）
    margin: null,   // neg | indet          （偶發瘤切緣）
    grade: null,    // g1 | g2              （偶發瘤切緣不確定時之分級）
    size: null      // lt2 | gt2            （其他直腸腫瘤之大小／淋巴結）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ntPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function cb(k, txt) { return '<span class="cb">' + (k ? '<span class="cb-k">' + k + '</span>' : '') + txt + '</span>'; }
  function cbx(head, sub, items) {
    return '<div class="cbx"><div class="cbx-h">' + head +
      (sub ? '　<span class="cbx-sub">' + sub + '</span>' : '') + '</div>' +
      '<div class="cbx-items">' + items.join('') + '</div></div>';
  }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  var cat2A = '<b>指引通則</b>：NET-1 之建議除另有標示外均為 <b>category 2A</b>。';

  /* ---------- 其他直腸腫瘤之評估（NET-1 EVALUATION）---------- */
  function evalHtml() {
    return '<div class="crit-box">' +
      cbx('評估 Evaluation', 'NET-1（其他所有直腸腫瘤）', [
        cb('影像', '<b>直腸 MRI 或經直腸超音波（Endorectal ultrasound）</b>'),
        cb('建議', '<b>大腸鏡</b>；<b>多相位（multiphasic）腹部／骨盆 CT 或 MRI</b><sup>a</sup>'),
        cb('視需要', '<b>SSTR-PET/CT 或 SSTR-PET/MRI</b><sup>b,c</sup>；胸部 CT ± 顯影劑；生化檢查')
      ]) +
      '<div class="note"><b>a</b>：多相位影像於動脈期與門靜脈期打顯影劑。<b>b</b>：SSTR-PET 範圍自顱頂至大腿中段；' +
      '<b>c</b>：追蹤劑如 68Ga-DOTATATE、64Cu-DOTATATE、68Ga-DOTATOC。<br>' +
      '<b>註 d</b>：<b>1–2 cm 之腫瘤</b>，考慮<b>麻醉下檢查（EUA）及／或 EUS</b>，若<b>侵犯固有肌層或淋巴結陽性則行根治性切除</b>。</div>' +
      '</div>';
  }

  /* ---------- 進展性／轉移性 GEP-NET 系統性治療（跨部位整理）---------- */
  function systemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">進展性／轉移性 GEP-NET · 系統性治療（跨部位整理）</div>' +
      '<div class="rx-def"><b>此區為跨部位 GEP-NET 之系統性治療整理，非 NET-1 內容。</b>' +
      '<b>胰臟 NET（PanNET）之完整互動流程請見「胰臟神經內分泌腫瘤（pNET）」條目。</b></div>' +
      rxLine('手術 / 減積', '侷限性或原發灶', [
        '<b>手術切除 + 區域淋巴結廓清</b>；小病灶（&lt;2cm、無功能、G1）可考慮觀察或摘除。',
        '<b>原發灶切除即使已有肝轉移仍常建議</b>（減積 cytoreduction）。'
      ]) +
      rxLine('體抑素類似物 SSA', '分化良好、SSTR 陽性、緩慢進展', [
        '<span class="rx">Octreotide LAR</span>（PROMID）或 <span class="rx">Lanreotide</span>（CLARINET）——抗增生兼控制類癌症候群。'
      ]) +
      rxLine('胜肽受體放射核素治療 PRRT', '', [
        '<span class="rx">Lu-177 Dotatate</span>（NETTER-1）——SSTR 陽性、SSA 後進展之中腸 NET。'
      ]) +
      rxLine('標靶 / 化療', '進展性', [
        '<span class="drug">Everolimus</span>（RADIANT-3）；<span class="drug">Sunitinib</span>（<b>限胰臟 NET</b>）。',
        '化療 <span class="rx">Capecitabine + Temozolomide（CAPTEM）</span>（尤其胰臟 NET）。',
        '<b>神經內分泌癌（NEC，分化差）</b>：<span class="rx">Platinum + Etoposide</span>（同小細胞癌）。'
      ]) +
      '</div>';
  }

  /* ---------- 版面 HTML ---------- */
  function netPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院大腸直腸癌診療指引 版次 21（2026/06/16）之 NET-1</b>——' +
      '<b>直腸神經內分泌腫瘤（rectal NET）之局部治療流程</b>。分期採 <b>AJCC v9（2023）直腸／結腸 NET</b>（NET-2，見「分期」分頁）。' +
      '<b>本流程僅適用於分化良好之直腸 NET</b>；<b>胰臟 NET 之完整流程另見「胰臟神經內分泌腫瘤（pNET）」條目</b>；' +
      '其他部位（胃／十二指腸／空腸-迴腸／闌尾）與進展性／轉移性疾病之系統性治療見下方「進展性／轉移性」分支。</p>';
    h += '<div class="onc-path" id="ntPath">';

    // Step 1 — 情境
    h += step('nt_s1', '1', '臨床情境 Clinical setting（NET-1）',
      opt('setting', 'inc', '直腸 NET · <b>小型偶發、已完整切除（&lt;1cm）</b>', 'Small (&lt;1 cm) completely resected incidental tumors') +
      opt('setting', 'other', '直腸 NET · <b>其他所有直腸腫瘤</b>', 'All other rectal tumors → 依大小決定切除方式') +
      opt('setting', 'adv', '<b>進展性／轉移性 GEP-NET</b>', '系統性治療（跨部位整理；胰臟 NET 見 pNET 條目）'));

    // ── 偶發瘤（<1cm 完整切除）分支
    h += connH('nt_c2i');
    h += step('nt_s2i', '2', '切緣 Margin（小型偶發、已完整切除）',
      opt('margin', 'neg', '<b>切緣陰性</b> Negative margin', '→ 無需額外追蹤') +
      opt('margin', 'indet', '<b>切緣不確定</b> Indeterminate margins', '→ 依分級決定'));
    h = h.replace('id="nt_s2i"', 'id="nt_s2i" class="hidden"');

    h += connH('nt_c3i');
    h += step('nt_s3i', '3', '分級 Grade（切緣不確定時）',
      opt('grade', 'g1', '<b>低惡性度 Low grade（G1）</b>', '→ 6–12 個月內視鏡評估殘存病灶') +
      opt('grade', 'g2', '<b>不確定分級 Indeterminate grade（G2）</b>', '→ 依「其他所有直腸腫瘤」流程'));
    h = h.replace('id="nt_s3i"', 'id="nt_s3i" class="hidden"');

    // ── 其他所有直腸腫瘤分支
    h += connH('nt_c2o');
    h += step('nt_s2o', '2', '腫瘤大小與淋巴結（其他所有直腸腫瘤，NET-1 FIRST-LINE TREATMENT）',
      opt('size', 'lt2', '<b>&lt;2 cm</b>', '→ 經肛門或內視鏡切除（如可行）') +
      opt('size', 'gt2', '<b>&gt;2 cm 或淋巴結陽性</b> &gt;2 cm or node positive', '→ 低前位切除／腹會陰切除／（選擇性）化放療'),
      evalHtml());
    h = h.replace('id="nt_s2o"', 'id="nt_s2o" class="hidden"');

    // 建議處置 + 追蹤
    h += '<div class="flow-rec rec-idle" id="nt_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="nt_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="ntReset()">重置</button></div>';
    h += '</div>'; // ntPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function ntSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function ntShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function ntClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
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

  /* ---------- 追蹤區塊 ---------- */
  function renderFollowup(type) {
    var el = document.getElementById('nt_fu');
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'none') {
      h = '<div class="fu-label">追蹤 Surveillance（NET-1）</div><ul class="fu-list">' +
        '<li><b>無需額外追蹤</b>（No additional follow-up required）。</li>' +
        '</ul>';
    } else if (type === 'endo') {
      h = '<div class="fu-label">追蹤 Surveillance（NET-1）</div><ul class="fu-list">' +
        '<li><b>&lt;1 cm：無需追蹤。</b></li>' +
        '<li><b>1 至 ≤2 cm</b>：<b>6 及 12 個月</b>行<b>內視鏡 + 直腸 MRI 或經直腸超音波</b>，之後<b>依臨床需要</b>。</li>' +
        '</ul>';
    } else { // advanced
      h = '<div class="fu-label">追蹤 Follow-up</div><ul class="fu-list">' +
        '<li>依腫瘤分級、部位與治療方式，以影像（多相位 CT／MRI）與生化標記定期追蹤。</li>' +
        '<li><b>胰臟 NET</b>之監測建議見「胰臟神經內分泌腫瘤（pNET）」條目（PanNET-11）。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }
  function result(cls, title, lines, note, fuType, extra) {
    ulRec('nt_rec', cls, title, lines, note, extra);
    renderFollowup(fuType);
  }
  function idleRec(title) { ulRec('nt_rec', 'rec-idle', title, [], ''); renderFollowup(null); }

  /* ---------- 主渲染 ---------- */
  function ntRender() {
    var s = ntSt;
    var inc = s.setting === 'inc', other = s.setting === 'other';

    ntShow('nt_c2i', inc); ntShow('nt_s2i', inc);
    var showGrade = inc && s.margin === 'indet';
    ntShow('nt_c3i', showGrade); ntShow('nt_s3i', showGrade);

    ntShow('nt_c2o', other); ntShow('nt_s2o', other);

    renderRec();
  }

  function renderRec() {
    var s = ntSt;
    if (!s.setting) { idleRec('請選擇步驟 1（臨床情境）'); return; }

    /* ===== 進展性／轉移性 GEP-NET ===== */
    if (s.setting === 'adv') {
      result('rec-nonop', '進展性／轉移性 GEP-NET → 系統性治療（跨部位整理）', [
        '<b>此分支非 NET-1 內容</b>，為跨部位 GEP-NET 之系統性治療整理。',
        '<b>治療依分化程度、分級、SSTR 影像與腫瘤負荷選擇</b>：SSA → PRRT → 標靶（everolimus／sunitinib）／化療（CAPTEM）；' +
        'NEC 則採 platinum + etoposide。完整選單見下方。',
        '<b>胰臟 NET（PanNET）之完整互動流程與分期請改用「胰臟神經內分泌腫瘤（pNET）」條目。</b>'
      ], '本區為跨部位 GEP-NET 系統治療整理（PROMID／CLARINET／NETTER-1／RADIANT-3／Sunitinib／CAPTEM）；胰臟 NET 見 pNET 條目。',
        'advanced', systemicPanel());
      return;
    }

    /* ===== 小型偶發、已完整切除（<1cm）===== */
    if (s.setting === 'inc') {
      if (!s.margin) { idleRec('請選擇步驟 2（切緣）'); return; }
      if (s.margin === 'neg') {
        result('rec-elective', '小型偶發、已完整切除 · <b>切緣陰性</b> → 無需額外追蹤', [
          '<b>切緣陰性（Negative margin）</b> → <b>No additional follow-up required</b>（無需額外追蹤）。',
          '完整切除之 &lt;1cm 偶發直腸 NET、切緣陰性者，復發風險極低。'
        ], 'NET-1：Small (&lt;1 cm) completely resected incidental tumors → Negative margin → No additional follow-up required。' + '｜' + cat2A,
          'none');
        return;
      }
      // indeterminate margins → grade
      if (!s.grade) { idleRec('請選擇步驟 3（分級）'); return; }
      if (s.grade === 'g1') {
        result('rec-elective', '切緣不確定 · <b>低惡性度（G1）</b> → 6–12 個月內視鏡評估殘存病灶', [
          '<b>Endoscopy at 6–12 mo to assess for residual disease</b>（6–12 個月內視鏡評估殘存病灶）。',
          '<b>陰性（Negative）</b> → <b>無需額外追蹤</b>。',
          '<b>陽性或中等分級（Positive or intermediate grade）</b> → 依「<b>其他所有直腸腫瘤</b>」流程處置' +
          '（請於<b>步驟 1</b> 改選「其他所有直腸腫瘤」）。'
        ], 'NET-1：Indeterminate margins → Low grade (G1) → Endoscopy at 6–12 mo；Negative → no follow-up；Positive or intermediate grade → follow pathway for all other rectal tumors。' + '｜' + cat2A,
          'none');
        return;
      }
      // g2 indeterminate grade
      result('rec-elective', '切緣不確定 · <b>不確定分級（G2）</b> → 依「其他所有直腸腫瘤」流程', [
        '<b>Indeterminate grade (G2)</b> → 直接<b>依「其他所有直腸腫瘤」流程處置</b>' +
        '（請於<b>步驟 1</b> 改選「其他所有直腸腫瘤」以取得依大小之切除建議）。',
        '相較於 G1（可先內視鏡追蹤），<b>G2 不採觀察路徑</b>，直接進入正式評估與切除決策。'
      ], 'NET-1：Indeterminate margins → Indeterminate grade (G2) → follow pathway below for all other rectal tumors。' + '｜' + cat2A,
        null);
      return;
    }

    /* ===== 其他所有直腸腫瘤 ===== */
    if (!s.size) { idleRec('請選擇步驟 2（腫瘤大小與淋巴結）'); return; }
    if (s.size === 'lt2') {
      result('rec-elective', '其他直腸腫瘤 · <b>&lt;2 cm</b> → 經肛門或內視鏡切除', [
        '<b>Resection（transanal or endoscopic excision, if possible）</b>——經肛門或內視鏡切除（如可行）。',
        '<b>註 d</b>：<b>1–2 cm 之腫瘤</b>，考慮<b>麻醉下檢查（EUA）及／或 EUS</b>；' +
        '若<b>侵犯固有肌層或淋巴結陽性 → 改行根治性切除</b>（見 &gt;2cm 路徑）。',
        '追蹤見下方（依 &lt;1cm／1–2cm 分）。'
      ], 'NET-1：All other rectal tumors → &lt;2 cm → Resection (transanal or endoscopic excision, if possible)。註 d：1–2cm 考慮 EUA/EUS，若 MP 侵犯或 node+ 則根治性切除。' + '｜' + cat2A,
        'endo');
      return;
    }
    result('rec-elective', '其他直腸腫瘤 · <b>&gt;2 cm 或淋巴結陽性</b> → 根治性切除（三選一）', [
      '<b>低前位切除（Low anterior resection, LAR）</b>；',
      '<b>或 腹會陰切除（Abdominoperineal resection, APR）</b>；',
      '<b>或 選擇性病人</b>——<b>新輔助或根治性化放療（neoadjuvant or definitive chemoradiation）可能有其角色</b>。',
      '三者依腫瘤位置、括約肌功能與病人條件由多專科團隊決定。'
    ], 'NET-1：All other rectal tumors → &gt;2 cm or node positive → Low anterior resection or Abdominoperineal Resection or（selected cases）neoadjuvant/definitive chemoradiation。' + '｜' + cat2A,
      'advanced');
  }

  /* ---------- 事件 ---------- */
  function ntPick(key, val, btn) {
    ntSel(btn);
    var s = ntSt;
    if (key === 'setting') {
      s.setting = val;
      s.margin = s.grade = s.size = null;
      ntClearSel(['nt_s2i', 'nt_s3i', 'nt_s2o']);
    } else if (key === 'margin') {
      s.margin = val; s.grade = null;
      ntClearSel(['nt_s3i']);
    } else if (key === 'grade') {
      s.grade = val;
    } else if (key === 'size') {
      s.size = val;
    }
    ntRender();
  }

  function ntReset() {
    for (var k in ntSt) { if (ntSt.hasOwnProperty(k)) ntSt[k] = null; }
    var root = document.getElementById('ntPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('nt_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    ntRender();
  }

  function initNetPathway() { ntReset(); }

  // 匯出
  global.netPathwayHTML = netPathwayHTML;
  global.initNetPathway = initNetPathway;
  global.ntPick = ntPick;
  global.ntReset = ntReset;
})(window);
