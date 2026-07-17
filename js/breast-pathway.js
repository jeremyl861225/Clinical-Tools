/* ============================================================
   乳癌治療互動決策流程 Breast Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 乳癌診療指引
   （NTUH Clinical Guidelines of Breast Cancer in Oncology,
     文件編號 50710-2-000010，版次 14，2023.V1；
     修制訂 2023/12/28、癌委會檢視通過 2026/06/16）
   投影片頁碼以指引內頁編號 p1–p49 標註於各建議之出處。
   分期（AJCC 8th）不屬本指引範圍，另見「分期 TNM」頁籤。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var bcSt = {
    scope: null,     // dcis | lcis | ebc | mbc | recur
    dloc: null,      // dcis 局部治療：d_bct | d_sm
    sub: null,       // 亞型：her2 | erpos | tnbc
    strat: null,     // 初始策略：upfront | nact
    ax: null,        // upfront 腋下：ax_neg | ax_z0011 | ax_noz | ax_cnpos
    naxi: null,      // NACT 後腋下：n_cn0 | n_ycn0 | n_ycn1
    resp: null,      // NACT 後病理反應：pcr | nonpcr
    msub: null,      // MBC 亞型：m_her2 | m_erpos | m_tnbc
    mfirst: null,    // MBC HR+ 一線：et_first | chemo_first
    rsite: null      // 復發：r_bctrt | r_bctlndrt | r_nort | r_ax | r_scf | r_imn
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="bcPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function breastPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院乳癌診療指引</b>（NTUH，版次 14／2023.V1，2026/06/16 癌委會檢視通過；base on 2023 NCCN、2023 St. Gallen consensus、ABC6）之互動決策流程。逐步點選以取得對應建議處置、藥物療程與追蹤方式。<b>健保未給付之藥物於文中標註</b>。</p>';
    h += '<div class="onc-path" id="bcPath">';

    // Step 1 — 疾病型態與範圍
    h += step('bc_s1', '1', '疾病型態與範圍',
      opt('scope', 'dcis', '原位管癌 DCIS（Tis N0M0）', '導管原位癌') +
      opt('scope', 'lcis', '小葉原位癌 LCIS', 'Lobular carcinoma in situ') +
      opt('scope', 'ebc', '侵襲性乳癌 · 無遠處轉移（M0）', 'EBC／局部晚期：管、小葉、混合、化生型（含 micropapillary、medullary）') +
      opt('scope', 'mbc', '晚期／轉移性乳癌（M1）', 'Advanced / Metastatic Breast Cancer') +
      opt('scope', 'recur', '局部／區域復發', 'Local / regional recurrence'),
      '<div class="cbx"><div class="cbx-h">WORK-UP（p1、p3）</div><div class="cbx-items">' +
        '<span class="cb">病史與理學檢查</span>' +
        '<span class="cb">CBC/DC</span>' +
        '<span class="cb">肝功能（含 ALP）</span>' +
        '<span class="cb">腎功能</span>' +
        '<span class="cb"><span class="cb-k">必要</span>雙側診斷性乳房攝影（stage 0~III）</span>' +
        '<span class="cb">超音波（必要時）</span>' +
        '<span class="cb">組織診斷（首選 core biopsy）</span>' +
        '<span class="cb">ER／PR／HER2</span>' +
      '</div></div>' +
      '<div class="cbx"><div class="cbx-h">HER2 判讀（p2）</div><div class="cbx-items">' +
        '<span class="cb"><span class="cb-k">IHC 0–1+</span>陰性（通常不做 FISH）</span>' +
        '<span class="cb"><span class="cb-k">IHC 2+</span>須做 FISH</span>' +
        '<span class="cb"><span class="cb-k">IHC 3+</span>陽性（不需 FISH）</span>' +
      '</div></div>' +
      '<div class="note"><b>全身分期</b>（CT/MRI、PET 或 bone scan）：T1-3 N(−) 不常規做，除非有相關症狀或異常檢驗／理學發現；cN0、pT1-2N1M0 亦不特別考慮（Z0011）；<b>cT3N1、cTanyN2、cTanyN3、cT4Nany、pStage III 強烈考慮</b>；DCIS 完全不考慮。最終仍由主治醫師判斷。<br>NACT 後手術檢體會重複 ER／PR／HER2 染色。<br><b>gBRCA1/2 檢測（p4、p5）</b>：符合遺傳諮詢條件（家族史、雙側乳癌或 &lt;35 歲發病）者；或可能受益於 PARP 抑制劑者 — EBC：HER2(−) stage II/III 且符合 OlympiA 條件；ABC：HER2(−) 且曾接受化療（術前、術後或轉移期）。</div>');

    /* ===================== DCIS ===================== */
    h += '<div id="bc_dcis" class="hidden">';
    h += conn('bc_dc1');
    h += step('bc_s_dcis', '2', '局部治療方式（p6）',
      opt('dloc', 'd_bct', '乳房保留手術 BCT', '切緣過近或陽性 → 再切除（除非為深部或表淺切緣）') +
      opt('dloc', 'd_sm', '全乳切除 SM(TM) ± SLNB ± 重建', '腫瘤過大／多發或病人選擇'));
    h += rec('bc_dcis_rec', '建議處置 · DCIS');
    h += '<div class="flow-fu hidden" id="bc_dcis_fu"></div>';
    h += '</div>';

    /* ===================== LCIS ===================== */
    h += '<div id="bc_lcis" class="hidden">';
    h += conn('bc_lc1');
    h += rec('bc_lcis_rec', '建議處置 · LCIS');
    h += '<div class="flow-fu hidden" id="bc_lcis_fu"></div>';
    h += '</div>';

    /* ===================== EBC（M0 侵襲癌）===================== */
    h += '<div id="bc_ebc" class="hidden">';
    h += conn('bc_ec1');
    h += step('bc_s2', '2', '生物亞型（依 ER／PR、HER2；p16）',
      opt('sub', 'her2', 'HER2(+)', '不論 ER；IHC 3+ 或 IHC 2+/FISH(+)') +
      opt('sub', 'erpos', 'ER(+) HER2(−)', 'Luminal') +
      opt('sub', 'tnbc', 'ER(−) HER2(−)（TNBC）', '三陰性'));

    h += conn('bc_ec2');
    h += step('bc_s3', '3', '初始治療策略（p8、p9、p11、p18、p19）',
      opt('strat', 'upfront', '直接手術（upfront surgery）', '多數 cStage I／II；HER2(+) cT1abN0 建議直接手術（APT，避免過度治療）') +
      opt('strat', 'nact', '術前輔助治療（NAT）→ 手術', '局部晚期且體能適合（fit），或希望 BCT。建議用於：HER2(+) ≥T2N0／≥N1／HR(−)HER2(+) ≥T1cN0；TNBC ≥T2N0／≥N1；臨床試驗'),
      '<div class="note"><b>手術原則（p8）</b>：可行時 <b>BCT 優於全乳切除</b>；BCT 後全乳放療為必要。BCT 之陰性切緣定義為「<b>no ink on invasive tumor or DCIS</b>」。cN0 首選 SLNB、cN(+) 行 ALND（術前應對可疑淋巴結先做 FNA）。<br><b>NAT 前後（p12）</b>：停經前女性須討論生育議題並轉介婦產科考慮凍卵／胚胎保存；<b>腫瘤床至少置放 1 個 clip</b>；詳細評估腋下淋巴結，臨床陽性者若可行則 NAT 前 clip 標記（現行 clip 多無法以超音波辨識，需乳攝導引定位）；選擇性乳房 MRI。治療中每次評估腫瘤反應；治療後可行則 BCT ＋適當腋下分期，否則全乳切除＋適當腋下分期。<br><b>對側預防性乳房切除（p9）</b>：單側乳癌而對側正常、病人因焦慮要求同時切除者，應先切除罹癌側並照會精神科，建議考慮 3~6 個月；若極度焦慮無法等待 3 個月，須經精神科醫師同意方可執行。</div>');

    // upfront 腋下
    h += connH('bc_ec3');
    h += step('bc_s4u', '4', '腋下處置與前哨淋巴結結果（p10、p15、p48）',
      opt('ax', 'ax_neg', 'cN0 → SLNB：pN0(sn)', '前哨陰性') +
      opt('ax', 'ax_z0011', 'cN0 → SLNB：pN1(sn) 且符合 Z0011', 'SLN 僅 1–2 顆(+)、T1-2、接受 BCT 且已規劃術後放療、有足量輔助全身治療（尤其 ER(+)）') +
      opt('ax', 'ax_noz', 'cN0 → SLNB：pN1(sn) 但不符合 Z0011', '如全乳切除、T3、未規劃放療') +
      opt('ax', 'ax_cnpos', 'cN(+)（術前已證實）', '直接 ALND'));
    h = h.replace('id="bc_s4u"', 'id="bc_s4u" class="hidden"');

    // NACT 腋下
    h += connH('bc_ec4');
    h += step('bc_s4n', '4', 'NACT 後腋下分期（p13、p14）',
      opt('naxi', 'n_cn0', 'NACT 前 cN0', 'NACT 後 SLNB alone（除非臨床惡化 PD）') +
      opt('naxi', 'n_ycn0', 'NACT 前 cN1-2 → ycN0', '降期成功') +
      opt('naxi', 'n_ycn1', 'NACT 前 cN1-2 → ycN1', '腋下仍臨床陽性'));
    h = h.replace('id="bc_s4n"', 'id="bc_s4n" class="hidden"');

    h += connH('bc_ec5');
    h += step('bc_s5n', '5', '術後病理反應（p18、p20、p21）',
      opt('resp', 'pcr', '病理完全緩解 pCR', '') +
      opt('resp', 'nonpcr', '殘存病灶 non-pCR', ''));
    h = h.replace('id="bc_s5n"', 'id="bc_s5n" class="hidden"');

    h += rec('bc_ebc_rec', '建議處置 · 侵襲性乳癌（M0）');
    h += '<div class="flow-fu hidden" id="bc_ebc_fu"></div>';
    h += '</div>';

    /* ===================== MBC ===================== */
    h += '<div id="bc_mbc" class="hidden">';
    h += conn('bc_mc1');
    h += step('bc_s_msub', '2', '生物亞型（p37）',
      opt('msub', 'm_her2', 'HER2(+)', '抗 HER2 藥物須與化療併用') +
      opt('msub', 'm_erpos', 'HR(+) HER2(−)', 'ET 優先，除非 visceral crisis 或快速惡化') +
      opt('msub', 'm_tnbc', 'TNBC（HR(−)HER2(−)）', ''));

    h += connH('bc_mc2');
    h += step('bc_s_mfirst', '3', 'HR(+)：一線是否可用內分泌治療（p37、p38）',
      opt('mfirst', 'et_first', '無 visceral crisis、無快速惡化', 'ET 優先（± CDK4/6 抑制劑）') +
      opt('mfirst', 'chemo_first', 'Visceral crisis 或快速惡化', '先化療'));
    h = h.replace('id="bc_s_mfirst"', 'id="bc_s_mfirst" class="hidden"');

    h += rec('bc_mbc_rec', '建議處置 · 轉移性（M1）');
    h += '<div class="flow-fu hidden" id="bc_mbc_fu"></div>';
    h += '</div>';

    /* ===================== 復發 ===================== */
    h += '<div id="bc_recur" class="hidden">';
    h += conn('bc_rc1');
    h += step('bc_s_rsite', '2', '復發型態（p36）',
      opt('rsite', 'r_bctrt', '單純局部復發 · 初始為 BCT + RT', 'Local recurrence only') +
      opt('rsite', 'r_bctlndrt', '單純局部復發 · 初始為 BCT + LND + RT', '') +
      opt('rsite', 'r_nort', '單純局部復發 · 初始為 BCT 或 SM、未放療', '') +
      opt('rsite', 'r_ax', '腋下復發 Axillary', '區域復發／局部＋區域復發') +
      opt('rsite', 'r_scf', '鎖骨上復發 Supraclavicular', '') +
      opt('rsite', 'r_imn', '內乳淋巴結復發 Internal mammary', ''));
    h += rec('bc_recur_rec', '建議處置 · 局部／區域復發');
    h += '<div class="flow-fu hidden" id="bc_recur_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset" style="display:flex; justify-content:flex-end;">' +
      '<button class="btn-reset" onclick="bcReset()">重置</button></div>';
    h += '</div>'; // bcPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function bcSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function bcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function bcClearSel(ids) {
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

  /* ---------- 追蹤區塊（p27）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤原則 Principles of Follow-up（p27）</div><ul class="fu-list">' +
        '<li>門診追蹤：<b>每 3–6 個月共 5 年</b>，之後每年一次。</li>' +
        '<li><b>每年乳房影像為必要</b>：乳房攝影及／或乳房超音波。</li>' +
        '<li>腹部超音波、胸部 X 光：選擇性（optional）。</li>' +
        '<li><b>不常規</b>安排 CT 或 bone scan，僅在臨床有指徵時。</li>' +
        '<li><b>不建議</b>常規腫瘤標記追蹤。</li>' +
        '<li>實際追蹤策略由醫病討論後決定（at the discretion of physician-patient discussion）。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care（p27、p37）</div><ul class="fu-list">' +
        '<li>定期評估治療反應與毒性；疾病進展 → 次線／後線治療或臨床試驗。</li>' +
        '<li>轉移期不常規以腫瘤標記追蹤；影像檢查依臨床需要安排。</li>' +
        '<li>末期病人：<b>安寧緩和照護，照會安寧共同照護團隊</b>（依安寧緩和醫療條例）。</li>' +
        '<li>最終治療決定仍取決於病人與醫師之討論。</li>' +
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

  /* ---------- 可折疊參考表 ---------- */
  function vnpiDetails() {
    var rows = [
      ['腫瘤大小', '≤1.5 cm', '1.6–4.0 cm', '≥4.1 cm'],
      ['病理', 'Non-high grade、壞死(−)', 'Non-high grade、壞死(+)', 'High grade'],
      ['切緣', '≥1.0 cm', '0.1–0.9 cm', '＜0.1 cm'],
      ['年齡', '>60 歲', '40–60 歲', '<40 歲']
    ];
    var t = '<details class="kps-details"><summary>Van Nuys Prognostic Index（VNPI）計分表 ▸</summary><table>' +
      '<tr><td></td><td>1 分</td><td>2 分</td><td>3 分</td></tr>';
    rows.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; });
    t += '<tr><td>4–6 分</td><td colspan="3">低風險：放療為選擇性（optional RT）</td></tr>' +
      '<tr><td>7–9 分</td><td colspan="3">中風險：建議輔助放療</td></tr>' +
      '<tr><td>10–12 分</td><td colspan="3">高風險：建議全乳切除</td></tr>';
    t += '</table></details>';
    return t;
  }

  function chemoGenDetails() {
    var t = '<details class="kps-details"><summary>化療處方世代分類（依 Adjuvant! Online；p28、p29–p31）▸</summary><table>' +
      '<tr><td>第一代</td><td>CMF；AC×4；EC×4</td></tr>' +
      '<tr><td>第二代</td><td>CEF；FAC；AC-T／EC-T；TC（USO9735）；A- 或 E-CMF</td></tr>' +
      '<tr><td>第三代</td><td>Dose dense ATC（CALGB9741）；TAC（BCIRG001）；TEC；FEC-T（PACS01）；AC-wT（E1199）</td></tr>' +
      '<tr><td>常用處方</td><td>AC-T／EC-T：cyclophosphamide 500–600 mg/m² + epirubicin 75–100 mg/m²（或 doxorubicin 60 mg/m²）D1 ×4 cycles，接續 paclitaxel 175–225 mg/m²（或 docetaxel 75–100 mg/m²）×4 cycles，皆 q21d</td></tr>' +
      '<tr><td></td><td>AC-wT（E1199）：AC／EC ×4（q21d）→ paclitaxel 80 mg/m² D1、D8、D15 共 12 劑</td></tr>' +
      '<tr><td></td><td>TC ×4–6（USO9735）：docetaxel 75 mg/m² + cyclophosphamide 500–600 mg/m² D1 q21d</td></tr>' +
      '<tr><td></td><td>TAC（BCIRG001）／TEC：docetaxel 75 mg/m² + doxorubicin 50（或 epirubicin 70）mg/m² + cyclophosphamide 500 mg/m² q21d ×6（須 G-CSF 支持）</td></tr>' +
      '<tr><td></td><td>其他可用：CEF、FAC、modified FEC-T（PACS01）、classical／modified CMF</td></tr>' +
      '<tr><td>院內共識</td><td>術後六至八週內開始化療（除非傷口癒合不良）；第二代較第一代約降低 15% 相對復發率，第三代較第二代再降低 15%。危險因子以腫瘤大小、淋巴結轉移顆數、tumor grade 最重要，再加年齡、ER、PR、HER2、Ki-67。<b>NCCN 輔助處方中無 liposomal doxorubicin，故本院指引亦不含</b>；若病人堅持以其取代 doxorubicin／epirubicin，基於有治療優於無治療仍可接受，但病歷須詳細註明。E1199：docetaxel 與 paclitaxel 可互換，以 q3w docetaxel 與每週 paclitaxel 為優先。</td></tr>' +
      '</table></details>';
    return t;
  }

  function htDetails() {
    var t = '<details class="kps-details"><summary>內分泌治療原則（HT，p23、p24）▸</summary><table>' +
      '<tr><td>ER 陽性定義</td><td>1% ≤ ER &lt; 10% → ± 使用 HT；ER &lt; 1% → 不使用 HT；ER(−) 但 PR &gt; 10% → ± 使用 HT</td></tr>' +
      '<tr><td>停經前</td><td>tamoxifen 至少 5 年；之後 — 仍停經前或不確定：可再 5 年 tamoxifen（共 10 年）；已停經：換 AI 再 5 年，或再 5 年 tamoxifen（共 10 年）。雙側卵巢切除後依停經後原則。高風險者可用 GnRH agonist + AI／tamoxifen 5 年。</td></tr>' +
      '<tr><td>停經後</td><td>AI 5 年；或 AI 2–3 年後換 tamoxifen（至多共 10 年）；或 tamoxifen 2–3 年後換 AI 5 年（共 7–8 年）；或 tamoxifen 5 年後再 5 年 tamoxifen 或 5 年 AI。心血管疾病高風險或骨質疏鬆者，AI 應謹慎使用。</td></tr>' +
      '<tr><td>監測</td><td>使用 tamoxifen 且子宮存在者，每年婦科評估；使用 AI 者建議定期骨密度（BMD）檢查（健保未給付）。</td></tr>' +
      '</table></details>';
    return t;
  }

  /* ---------- RT 原則（p47、p49）---------- */
  function rtLines(afterNact) {
    var l = [
      '<span class="rx-h">放射治療 Radiotherapy</span>　<span class="rx-sub">p47</span>',
      'BCT 後<b>所有病人</b>皆有放療指徵。低風險年長者（年齡 &gt;70、cN0、切緣乾淨、HR(+) 且使用 tamoxifen 或 AI）因絕對效益小可考慮省略（<b>CALGB 9343</b>：&gt;70 歲、ER(+)、stage I 者 BCT 後放療無整體存活效益）；惟放療於此族群仍可改善局部控制（local control）。',
      '全乳切除後<b>胸壁放療之明確指徵</b>：腋下淋巴結 <b>≥4 顆(+)</b>；切緣(+)；侵犯皮膚；侵犯胸壁（僅侵犯 pectoral fascia 不算）；<b>T3 且腋下淋巴結(+)</b>；腋下 1–3 顆(+) 者依危險因子決定。'
    ];
    if (afterNact) {
      l.push('<b>NACT 後輔助放療（NTUH 共識，p49）</b><ul>' +
        '<li><b>可考慮省略</b> PMRT／Breast RT + RNI：pCR 且符合其一 — HR(+)；HER2(+) 且初始 cTanyN0-1；TNBC 且初始 cT1-2N0。</li>' +
        '<li><b>應接受</b> PMRT／Breast RT + RNI：未達 pCR 而依臨床分期本有指徵者；NACT 後 pN(+)；cT1-2N1 之 HER2(+) 未達 pCR 者。</li>' +
        '<li><b>應由放射腫瘤科評估</b>：cT1-2N1 之 HR(+)／TNBC 僅殘存乳房腫瘤者；cT3N0 且 ypT1-2N0 者。</li></ul>');
    }
    return l;
  }

  /* ---------- 全身輔助治療（依亞型）---------- */
  var nhiNote = '健保給付提醒：EBC 之 <b>trastuzumab 僅給付淋巴結陽性者</b>（皮下劑型已給付），LN(−) 者需自費；<b>pertuzumab、T-DM1、neratinib、abemaciclib、TS-1、olaparib、pembrolizumab 於 EBC 均未給付</b>。院內立場（p21）：研究顯示不論淋巴結是否陽性，neo/adj trastuzumab-based 化療皆顯著降低 HER2(+) 病人之復發率與死亡率，故對 LN(−) 但腫瘤有一定大小或風險較高者團隊仍建議使用；pertuzumab、T-DM1 亦同理，經討論後自費使用。';

  function her2Adj(nonPcr, hadNact) {
    var l = [
      '<span class="rx-h">HER2(+)：抗 HER2 + 化療</span>　<span class="rx-sub">p17、p18、p34、p35</span>',
      '<b>依病理分期（p17）</b><ul>' +
        '<li>pT1mi–pT1aN0：<b>±</b>（化療 + <span class="drug">trastuzumab</span>）。</li>' +
        '<li>pT1bN0 或 pT1aN1mi：<b>可考慮</b>化療 + <span class="drug">trastuzumab</span>。</li>' +
        '<li>≥ pT1cN0：化療 + <span class="drug">trastuzumab</span>。</li>' +
        '<li>LN(+)：輔助化療 + <span class="drug">trastuzumab</span>，<b>建議加上</b> <span class="drug">pertuzumab</span>（未給付）。</li></ul>',
      '<span class="drug">trastuzumab</span> 療程若未特別指定應<b>總計 1 年</b>；因給付因素，<b>9–12 週亦視為可接受</b>（p34）。劑量：6 mg/kg q3W（首劑加 2 mg/kg loading、輸注時間較長）、或 2 mg/kg q1W、或 4 mg/kg q2W；<b>皮下劑型</b> 600 mg 固定劑量 SC 3–5 分鐘 q3W，不需 loading。<span class="drug">pertuzumab</span>：840 mg 首劑，第 2 週期起 420 mg q3W。',
      '<span class="rx">TCHP</span>（<span class="drug">docetaxel</span> 75 mg/m² + <span class="drug">carboplatin</span> AUC 5–6 或 <span class="drug">cisplatin</span> 50–70 mg/m² + <span class="drug">trastuzumab</span> ±<span class="drug">pertuzumab</span>，q21d ×6）；<span class="rx">AC/EC → TH 或 THP</span>；亦可先 TH／THP 再接 (F)EC／(F)AC。抗 HER2 抗體<b>不與 anthracycline 併用</b>（心毒性），與 taxane 併用。院內共識：taxane 部分可改 <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15，platinum 可改 carboplatin AUC 1.5 D1、8、15。',
      '<span class="rx">APT</span>（Dana-Farber）：<span class="drug">paclitaxel</span> 80 mg/m² 每週 ×12 週 + <span class="drug">trastuzumab</span> 共 1 年（與 paclitaxel 同時開始）— <b>僅適用 T &lt; 3 cm、淋巴結陰性</b>。',
      'ER(+) 者：<b>輔助內分泌治療為必要</b>，於化療完成後開始（p17）。' + htDetails(),
      '院內另註（p21）：HER2(+) 病人之 neo/adj 化療，文獻可用之處方即使 NCCN 未提及（如 CMF、TC）本院亦認為可用。'
    ];
    if (hadNact) {
      l.splice(1, 0, '<b>NACT（p18）</b>：≥cT2NanyM0 可考慮 NACT，<b>至少 18 週</b>；cT1cN0 可選 upfront surgery 或 NACT（taxane + trastuzumab 為處方選項之一）；N(+) 者加 <span class="drug">pertuzumab</span>（未給付）。');
    }
    if (nonPcr) {
      l.splice(1, 0, '<b>Non-pCR（p18）</b>：<b>換用</b> <span class="drug">T-DM1</span> 3.6 mg/kg q3W ×14 週期（依 <b>KATHERINE</b> 試驗；未給付）；至少完成 <span class="drug">trastuzumab</span> 至滿 1 年。若先前 NACT 未含 anthracycline，可考慮術後再加 anthracycline。');
      l.push('<b>延長輔助 <span class="drug">neratinib</span></b> 1 年（未給付）：可考慮用於高風險 HR(+)/HER2(+)，如 LN(+) 或 non-pCR。<b>NTUH 共識：neratinib 可提早開始</b> — 化療後即可，與抗 HER2 治療及內分泌治療併行。');
    } else {
      l.push('<b>延長輔助 <span class="drug">neratinib</span></b> 1 年（未給付）：可考慮用於高風險 HR(+)/HER2(+)，如 LN(+)。NTUH 共識：可於化療後即開始，與抗 HER2 及內分泌治療併行。');
    }
    l.push(chemoGenDetails());
    return l;
  }

  function erAdj() {
    return [
      '<span class="rx-h">ER(+) HER2(−)：內分泌治療 ± 化療</span>　<span class="rx-sub">p22</span>',
      '<b>≤ pT2N0</b>：輔助內分泌治療（ET），或輔助化療 + ET；風險以<b>多基因檢測</b>、IHC4 分數或臨床病理參數評估。',
      '<b>≥ pT3N0</b>：傾向輔助化療 + ET。',
      '<b>pT1-2 N1mi–N1</b>：通常輔助化療 + ET，除非多基因檢測顯示低復發風險。',
      '<b>Tany N2-3</b>：輔助化療 + ET。',
      '高風險者：<span class="drug">abemaciclib</span> 2 年，或 <span class="drug">TS-1</span> 1 年（<b>兩者均未納健保</b>）。',
      '多基因檢測：前瞻性證據來自 <b>Oncotype DX（TAILORx）</b>；其他 MammaPrint、PAM50、EndoPredict、BCI <b>均為預後性（prognostic）</b>工具。',
      htDetails(),
      chemoGenDetails()
    ];
  }

  function tnbcAdj(nonPcr, hadNact) {
    var l = [
      '<span class="rx-h">ER(−) HER2(−)（TNBC）</span>　<span class="rx-sub">p19、p20、p21、p32、p33</span>',
      '<b>化療為適應症，除非極低風險（p19）</b>：pT1miN0 可省略；pT1aN0-1mi、pT1bN0 → ±化療。<b>優先考慮參加臨床試驗</b>。'
    ];
    if (hadNact) {
      l.push('<b>NACT（p19）</b>：TNBC 通常建議術前化療。<b>≥cT1cN1 或 ≥cT2N0 建議於 NACT 加上 <span class="drug">pembrolizumab</span></b>（未給付、有 irAE 風險，須與病人審慎討論）；若使用 pembrolizumab，<b>應依 KEYNOTE-522 處方</b>。');
      l.push('<span class="rx">[EC/AC + T-carbo] + pembro（KN-522）</span>：<span class="drug">pembrolizumab</span> 200 mg D1 + <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15 + <span class="drug">carboplatin</span> AUC 5 D1（或 AUC 1.5 D1、8、15），q21d ×4（cycles 1–4）→ <span class="drug">pembrolizumab</span> 200 mg + <span class="drug">doxorubicin</span> 60 mg/m²（或 <span class="drug">epirubicin</span> 90 mg/m²）+ <span class="drug">cyclophosphamide</span> 600 mg/m² D1，q21d ×4（cycles 5–8）→ 術後輔助 <span class="drug">pembrolizumab</span> 200 mg q21d ×9。');
      l.push('<b>NACT 併用鉑類（p33）</b>：（1）較常見為 EC/AC 後接 taxane + platinum ×4；（2）部分病人可 anthracycline-free：T + platinum ×6（<span class="drug">docetaxel</span> 75 mg/m² D1 或 <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15 ＋ <span class="drug">carboplatin</span> AUC 5 D1 或 AUC 1.5 D1、8、15，或 <span class="drug">cisplatin</span> 50–70 mg/m² D1，q21d）。');
    }
    if (nonPcr) {
      l.push('<b>Non-pCR（p20）</b><ul>' +
        '<li>建議延長輔助 <span class="drug">capecitabine</span> <b>6–12 個月</b>（<b>CREATE-X</b>：1000–1250 mg/m² BID D1-14 q3W ×6–8 週期，即 24 週；HER2(−) 且 NACT 後未達 pCR 者顯著增加 DFS，TNBC subgroup 效益更明顯）。</li>' +
        '<li>gBRCA1/2(+)：建議 <span class="drug">olaparib</span> 1 年（<b>OlympiA</b>，未給付）。</li>' +
        '<li><b>olaparib 與 capecitabine 不建議併用</b>。</li>' +
        '<li>先前 NACT 已用 pembrolizumab → 可 <span class="drug">pembrolizumab</span> + <span class="drug">capecitabine</span>。</li>' +
        '<li>先前 NACT 已用 pembrolizumab 且 gBRCA1/2(+) → 可 <span class="drug">pembrolizumab</span> + <span class="drug">olaparib</span>。</li></ul>');
    } else if (!hadNact) {
      l.push('<b>直接手術者（p20）</b><ul>' +
        '<li>gBRCA1/2(+) 且 <b>≥pT2 或 ≥pN1</b> → 建議追加 <span class="drug">olaparib</span> 1 年。</li>' +
        '<li>可考慮延長輔助 <span class="drug">capecitabine</span> 1 年。</li>' +
        '<li>輔助化療加上 <span class="drug">pembrolizumab</span> 僅在審慎討論後方可考慮。</li></ul>');
    }
    l.push('<b>TNBC 其他選擇（p21）</b>：<b>IBCSG 22-00</b>（ER &lt; 10% 者於標準輔助化療後追加 1 年低劑量口服化療 <span class="drug">cyclophosphamide</span> + <span class="drug">methotrexate</span>）雖未達統計顯著，TNBC subgroup 之 DFS 呈現有利趨勢。兩者證據強度有限，但因 TNBC 預後較差、選擇少，團隊認為對高風險病人討論以上選項有合理學術依據。');
    l.push(olympiaDetails());
    l.push(chemoGenDetails());
    return l;
  }

  function olympiaDetails() {
    return '<details class="kps-details"><summary>OlympiA 延長輔助 olaparib 條件（p21）▸</summary><table>' +
      '<tr><td>效益</td><td>延長輔助 <b>olaparib 1 年</b>，改善 IDFS 與 DDFS</td></tr>' +
      '<tr><td>共同條件</td><td>HER2(−) 且帶 gBRCA1/2 突變</td></tr>' +
      '<tr><td>若接受 NACT</td><td>TNBC：non-pCR；ER(+)：non-pCR 且 <b>CPS-EG score ≥ 3</b></td></tr>' +
      '<tr><td>若手術優先</td><td>TNBC：≥pT2 或 ≥pN1；ER(+)：<b>LN ≥ 4</b>；其他高風險</td></tr>' +
      '<tr><td>備註</td><td>健保未給付，須充分討論並搭配遺傳諮詢；ER(+) 可設定較高門檻</td></tr>' +
      '</table></details>';
  }

  function adjBySubtype(sub, nonPcr, hadNact) {
    if (sub === 'her2') return her2Adj(nonPcr, hadNact);
    if (sub === 'erpos') return erAdj();
    return tnbcAdj(nonPcr, hadNact);
  }

  /* ---------- 轉移性系統治療 ---------- */
  var mbcNote = '轉移性乳癌原則（p37）：HR(+) 者除非有 <b>visceral crisis</b> 或快速惡化，應先用內分泌治療；化療以<b>序貫單一藥物優於合併化療</b>；HER2(+) 者抗 HER2 藥物應與化療併用。最終決定取決於病人與醫師討論。';

  function mbcChemoMenu() {
    return '<details class="kps-details"><summary>轉移性乳癌化療處方與劑量（p42、p43、p45）▸</summary><table>' +
      '<tr><td>原則</td><td>無證據顯示某處方優於其他；<b>無確定的一線處方</b>；病人偏好為選擇處方的關鍵因素之一。所有早期乳癌處方（合併或其中單一藥物）皆可於轉移時使用，除非有已知抗藥性疑慮（如快速復發）或 anthracycline 已達累積劑量。因轉移無法治癒，劑量依病人最佳臨床利益比調整，不強求建議劑量。</td></tr>' +
      '<tr><td>PLD</td><td>Pegylated liposomal doxorubicin 30–50 mg/m² D1, q3-4W</td></tr>' +
      '<tr><td>Eribulin</td><td>1.4 mg/m² D1、D8</td></tr>' +
      '<tr><td>Capecitabine</td><td>850–1000 mg/m² PO BID D1–14, q21d</td></tr>' +
      '<tr><td>Vinorelbine (N)</td><td>25–30 mg/m² D1、8, q3W</td></tr>' +
      '<tr><td>N-HDFL</td><td>Vinorelbine 25 mg/m² D1、8 + (5-FU 2000–2600 mg/m² ± leucovorin 300 mg/m²) 24hr D1、8, q3W</td></tr>' +
      '<tr><td>NP</td><td>Vinorelbine 25 mg/m² + cisplatin 30–35 mg/m² D1、8, q3W</td></tr>' +
      '<tr><td>P-HDFL</td><td>Cisplatin 30–35 mg/m² + (5-FU 2000–2600 mg/m² ± leucovorin 300 mg/m²) D1、8, q3W</td></tr>' +
      '<tr><td>TG</td><td>Paclitaxel 80 mg/m² + gemcitabine 800 mg/m² D1、8, q3W</td></tr>' +
      '<tr><td>BEEP</td><td>Bevacizumab 15 mg/kg D1 + cisplatin 70 mg/m² D2 + etoposide 70 mg/m² D2–4, q3W</td></tr>' +
      '<tr><td>其他</td><td>合併 bevacizumab 與化療是合理的。<b>不建議作為一線</b>：mitoxantrone、mitomycin C、ixabepilone — 應保留給已多線治療而無其他選擇者。</td></tr>' +
      '</table></details>';
  }

  function parpMbcLine() {
    return '<b>gBRCA1/2 突變（p41）</b>：HER2(−) 且 gBRCA1/2(+) 者 PARP 抑制劑之 PFS 較佳；可用 <span class="drug">olaparib</span> 或 <span class="drug">talazoparib</span>。<b>健保僅給付 TNBC；ER(+) 未給付</b>。';
  }

  function mbcHer2Lines() {
    return [
      '<span class="rx-h">HER2(+) MBC</span>　<span class="rx-sub">p39、p44</span>',
      '<b>可用之抗 HER2 藥物（p39）</b>：<span class="drug">trastuzumab</span>（通常與化療併用）、<span class="drug">pertuzumab</span>（與 trastuzumab 併用為雙重阻斷）、<span class="drug">T-DM1</span>、<span class="drug">lapatinib</span>（通常與 capecitabine 併用）— 以上為<b>健保有條件給付</b>；<span class="drug">T-DXd</span>（用於任何含 trastuzumab 治療失敗後）與 <span class="drug">neratinib</span>（通常與 capecitabine 併用）<b>健保未給付</b>。',
      '<span class="rx-h">一線首選：THP</span><br><span class="drug">trastuzumab</span> 6 mg/kg（C1D1 8 mg/kg）+ <span class="drug">pertuzumab</span> 420 mg（C1D1 840 mg）+ <span class="drug">docetaxel</span> 75 mg/m² D1 q3W，或 <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15 q3W。',
      '<span class="rx-h">二線以後 ≥2nd line</span><br><span class="drug">T-DM1</span> 3.6 mg/kg q3W；<span class="drug">T-DXd</span> 5.4 mg/kg q3W；<span class="drug">lapatinib</span> 1250 mg/day PO + <span class="drug">capecitabine</span> 1250 mg/m² PO BID D1-14 q3W（最大劑量）。',
      parpMbcLine(),
      mbcChemoMenu()
    ];
  }

  function mbcTnbcLines() {
    return [
      '<span class="rx-h">TNBC MBC</span>　<span class="rx-sub">p40、p44</span>',
      '<b>一線化療加上免疫治療（IO）可改善 PFS 與 OS（p40）</b><ul>' +
        '<li><b>IMpassion130</b>：適用 <b>PD-L1 IC(+)</b> 之 TNBC；伴隨式診斷 <b>Ventana SP142</b>；化療夥伴為 <span class="drug">nab-paclitaxel</span>（<span class="drug">atezolizumab</span>）。</li>' +
        '<li><b>KEYNOTE-355</b>：適用 <b>PD-L1 CPS ≥ 10</b>；伴隨式診斷 <b>Dako 22C3</b>；化療夥伴為 gemcitabine/platinum、nab-paclitaxel 或 paclitaxel。<span class="drug">pembrolizumab</span> 200 mg q3W 併化療。</li>' +
        '<li><b>NTUH 修正</b>：認同 TNBC 一線加上 IO 之概念；<b>依建議之伴隨式診斷</b>執行；<b>化療夥伴可較廣</b>。pembrolizumab／atezolizumab 均未給付。</li></ul>',
      '<span class="rx-h">三線以後 ≥3rd line</span><br><span class="drug">sacituzumab govitecan</span> 10 mg/kg IF 3 小時 D1、D8, q3W。',
      parpMbcLine(),
      mbcChemoMenu()
    ];
  }

  function mbcErLines(chemoFirst) {
    var l = [
      '<span class="rx-h">HR(+) HER2(−) MBC</span>　<span class="rx-sub">p37、p38（台灣乳房醫學會共識）</span>'
    ];
    if (chemoFirst) {
      l.push('<b>Visceral crisis 或快速惡化 → 先化療</b>（p37）：以序貫單一藥物為優先；控制後仍可回到內分泌治療。');
    } else {
      l.push('<b>一線治療：ET 單方、ET + CDK4/6 抑制劑，或化療</b>（p38）；依<b>疾病活性</b>（短 DFI、內臟腫瘤負荷、症狀）與<b>對 ET 反應之機率</b>（抗藥性型別 I°/II°、內在亞型、生物標記）決定偏向 ET 或化療。');
      l.push('風險分層（p38）：<b>低風險</b> → 單方 ET（或 ET + CDK4/6）；<b>中風險</b> → ET + CDK4/6（或單方 ET／化療）；<b>高風險</b> → 化療、ET + CDK4/6。另須考量內臟／非內臟轉移與 ESR1 突變對 ET 選擇之影響。');
    }
    l.push('<b>健保給付</b>：自 <b>2019/10/1</b> 起給付<b>停經後婦女之 CDK4/6 抑制劑與 AI 併用</b>作為轉移後一線治療（p38）。');
    l.push(parpMbcLine());
    l.push(mbcChemoMenu());
    l.push(htDetails());
    return l;
  }

  /* ---------- 主渲染 ---------- */
  function bcRender() {
    var s = bcSt;

    bcShow('bc_dcis', s.scope === 'dcis'); bcShow('bc_dc1', s.scope === 'dcis');
    bcShow('bc_lcis', s.scope === 'lcis'); bcShow('bc_lc1', s.scope === 'lcis');
    bcShow('bc_ebc', s.scope === 'ebc');   bcShow('bc_ec1', s.scope === 'ebc');
    bcShow('bc_mbc', s.scope === 'mbc');   bcShow('bc_mc1', s.scope === 'mbc');
    bcShow('bc_recur', s.scope === 'recur'); bcShow('bc_rc1', s.scope === 'recur');

    // EBC：步驟 3 需先選亞型；步驟 4 依策略分岔
    var showS3 = (s.scope === 'ebc' && !!s.sub);
    bcShow('bc_ec2', showS3); bcShow('bc_s3', showS3);
    var upf = showS3 && s.strat === 'upfront';
    var nact = showS3 && s.strat === 'nact';
    bcShow('bc_ec3', upf);   bcShow('bc_s4u', upf);
    bcShow('bc_ec4', nact);  bcShow('bc_s4n', nact);
    var showResp = nact && !!s.naxi;
    bcShow('bc_ec5', showResp); bcShow('bc_s5n', showResp);

    // MBC：HR(+) 才問一線策略
    var showMF = (s.scope === 'mbc' && s.msub === 'm_erpos');
    bcShow('bc_mc2', showMF); bcShow('bc_s_mfirst', showMF);

    renderDcis(); renderLcis(); renderEbc(); renderMbc(); renderRecur();
  }

  /* ---------- DCIS ---------- */
  function renderDcis() {
    var s = bcSt;
    if (s.scope !== 'dcis') return;
    var R = 'bc_dcis_rec', F = 'bc_dcis_fu';
    if (!s.dloc) { idleRec(R, F, '請選擇步驟 2（局部治療方式）'); return; }
    if (s.dloc === 'd_bct') {
      result(R, F, 'rec-elective', 'DCIS：乳房保留手術（BCT）', [
        '<b>切緣</b>：過近或陽性 → <b>再切除（re-excision）</b>，除非為深部或表淺切緣（p6、p46）。',
        '<b>輔助放療</b>：BCT 後依 <b>VNPI 分數</b>或 <b>ECOG 5194 條件</b>（腫瘤 &lt;2.5 cm 且 low／intermediate grade 且切緣 &gt;3 mm）決定是否放療（p46）；詳細依放射治療指引。' + vnpiDetails(),
        '<b>輔助內分泌治療</b>：ER(+) → 建議 <span class="drug">tamoxifen</span> <b>5 年</b>（p6、p23）；主要用於接受腫瘤切除者，以降低<b>同側復發</b>。'
      ], '出處：p6（DCIS Management）、p46（Principles of Radiotherapy - DCIS）、p23（HT）。DCIS 不做全身分期檢查（p3）。', 'curative');
    } else {
      result(R, F, 'rec-elective', 'DCIS：全乳切除 SM(TM) ± SLNB ± 重建', [
        '<b>不需輔助放療</b>（simple mastectomy：no need for adjuvant RT，p46）。',
        '<b>SLNB</b>：對<b>全乳切除者更應積極考慮</b>，以及切除位置可能影響日後 SLND 者（p6 註 b）。',
        '<b>輔助內分泌治療</b>：ER(+) → 建議 <span class="drug">tamoxifen</span> 5 年；對全乳切除者<b>性質較接近第二預防</b>（p6 註 c）。'
      ], '出處：p6（DCIS Management）、p46（Principles of Radiotherapy - DCIS）。', 'curative');
    }
  }

  /* ---------- LCIS ---------- */
  function renderLcis() {
    if (bcSt.scope !== 'lcis') return;
    result('bc_lcis_rec', 'bc_lcis_fu', 'rec-elective', 'LCIS：不需強制切除，追蹤觀察', [
      '<b>LCIS：resection not mandatory，surveillance</b>（p7）。',
      '<b>Pleomorphic LCIS</b>：<b>比照 DCIS 處理</b>（p7）。'
    ], '出處：p7（LCIS Management）。', 'curative');
  }

  /* ---------- EBC ---------- */
  function renderEbc() {
    var s = bcSt;
    if (s.scope !== 'ebc') return;
    var R = 'bc_ebc_rec', F = 'bc_ebc_fu';

    if (!s.sub) { idleRec(R, F, '請選擇步驟 2（生物亞型）'); return; }
    if (!s.strat) { idleRec(R, F, '請選擇步驟 3（初始治療策略）'); return; }

    if (s.strat === 'upfront') {
      if (!s.ax) { idleRec(R, F, '請選擇步驟 4（腋下處置與前哨結果）'); return; }
      var loc = [
        '<span class="rx-h">局部治療 Locoregional</span>　<span class="rx-sub">p8、p10</span>',
        '<b>BCT 為首選</b>（尤其 stage I），但尊重病人意願；<b>BCT + SLND/ALND + xRT</b>。指引原文：「xRT follow by C/T when C/T indicated」（p10）。',
        '不做乳房保留者：<b>SM + ALND/SLND</b>；若 <b>pN2 或切緣(+)</b> → 加上 xRT（p10）。',
        '陰性切緣定義：<b>no ink on invasive tumor or DCIS</b>（p8）。'
      ];
      var axl = ['<span class="rx-h">腋下處置 Axilla</span>　<span class="rx-sub">p8、p15、p48</span>'];
      if (s.ax === 'ax_neg') {
        axl.push('<b>pN0(sn) → 不需 ALND</b>（p15）。');
      } else if (s.ax === 'ax_z0011') {
        axl.push('<b>符合 ACOSOG Z0011 → 可免除進一步 ALND</b>（p8）。' +
          '<div class="cbx"><div class="cbx-h">Z0011 條件　<span class="cbx-sub">須全部符合</span></div>' +
          '<div class="cbx-items">' +
            '<span class="cb"><span class="cb-k">a</span>cN0 且 SLN 僅 1–2 顆(+)</span>' +
            '<span class="cb"><span class="cb-k">b</span>T1-2</span>' +
            '<span class="cb"><span class="cb-k">c</span>接受 BCT 且已規劃術後放療</span>' +
            '<span class="cb"><span class="cb-k">d</span>有足量之輔助全身治療</span>' +
            '<span class="cb"><span class="cb-k">e</span>尤其 ER(+)</span>' +
          '</div></div>');
      } else if (s.ax === 'ax_noz') {
        axl.push('<b>不符合 Z0011 → ALND</b>（p15）。');
        axl.push('<b>p48 補充</b>：cLN(−)、s/p SM + SLND、pT1-2 且 SLN(+ 1–2 顆) → <b>應完成 ALND</b>。若 ALND 不完整（取出 LN &lt; 10 顆）：TNBC 或 LVI(+) 且總陽性淋巴結仍為 1–2 顆 → 建議完成 ALND；non-TNBC 且 LVI(−)（任何 LN 陽性）→ 建議 ALND，除非外科醫師認為完整 ALND 困難、或病人充分討論後仍拒絕 → 此時<b>依 AMAROS 試驗建議區域放療（腋下 + SCF）± 胸壁放療</b>。');
      } else {
        axl.push('<b>cN(+) → ALND</b>（p8）；術前應對可疑淋巴結先行 FNA（p10 註 b）。');
      }
      var lines = loc.concat(axl).concat(rtLines(false))
        .concat(['<span class="rx-h">術後輔助全身治療 Adjuvant systemic</span>'])
        .concat(adjBySubtype(s.sub, false, false));
      result(R, F, 'rec-elective', '直接手術（upfront surgery）→ 局部治療 + 輔助全身治療', lines,
        nhiNote + '　出處：p8–p10（手術原則）、p15／p48（腋下）、p47（放療）、p17–p24（全身治療）。', 'curative');
      return;
    }

    // NACT
    if (!s.naxi) { idleRec(R, F, '請選擇步驟 4（NACT 後腋下分期）'); return; }
    if (!s.resp) {
      result(R, F, 'rec-nonop', '術前輔助治療（NAT）→ 手術（待病理反應）', [
        '<span class="rx-h">NAT 適應症</span>　<span class="rx-sub">p9、p11</span>',
        'NAT 通常用於<b>局部晚期且體能適合（fit）</b>的病人，或希望做 BCT 者；<b>局部晚期（通常 stage III 或 T3N0）強烈建議</b>（p11）。',
        '亞型建議（p9）：HER2(+) — ≥T2N0、≥N1，或 HR(−)/HER2(+) 之 ≥T1cN0；TNBC — ≥T2N0 或 ≥N1；或臨床試驗收案。',
        'Stage IIA／IIB／IIIA 且符合乳房保留條件者：<b>Neoadjuvant C/T 或 neoadjuvant HT（若 ER+）</b> → SM + SLNB/ALND 或 BCT + SLNB/ALND；<b>若病人偏好，亦可直接手術</b>（p11）。',
        '<span class="rx-h">NAT 前後注意事項</span>　<span class="rx-sub">p12</span>',
        '停經前女性須討論生育議題並轉介婦產科考慮凍卵／胚胎保存；腫瘤床<b>至少置放 1 個 clip</b>；詳細評估腋下淋巴結，臨床陽性者若可行則先 clip 標記；選擇性乳房 MRI。治療中<b>每次評估腫瘤反應</b>。',
        '完成 NAT 後 → 請選擇<b>步驟 5（術後病理反應）</b>以取得輔助治療建議。'
      ].concat(axNactLines(s.naxi)), '出處：p9、p11、p12、p13、p14。', null);
      return;
    }

    var nonPcr = (s.resp === 'nonpcr');
    var l2 = ['<span class="rx-h">術後局部治療</span>　<span class="rx-sub">p12</span>',
      '可行則 <b>BCT + 適當腋下分期</b>，否則<b>全乳切除 + 適當腋下分期</b>。']
      .concat(axNactLines(s.naxi))
      .concat(rtLines(true))
      .concat(['<span class="rx-h">術後輔助全身治療 Adjuvant systemic</span>'])
      .concat(adjBySubtype(s.sub, nonPcr, true));
    result(R, F, nonPcr ? 'rec-nonop' : 'rec-elective',
      nonPcr ? 'NACT 後 non-pCR → 強化輔助治療' : 'NACT 後 pCR → 完成既定輔助治療',
      l2,
      nhiNote + '　出處：p12–p14（手術／腋下）、p49（NACT 後放療共識）、p17–p21（全身治療）。', 'curative');
  }

  function axNactLines(naxi) {
    var l = ['<span class="rx-h">NACT 後腋下處置</span>　<span class="rx-sub">p13、p14</span>'];
    if (naxi === 'n_cn0') {
      l.push('<b>cN0</b>：可 upfront SLNB，或 <b>NACT 後 SLNB alone</b>（除非臨床惡化 PD）（p13）。');
      l.push('SLNB 結果：<b>pN0(sn) → 不需 ALND</b>；<b>pN1(sn)（含 pNmi、pN0(i+)）→ ALND</b>（p14）。');
    } else if (naxi === 'n_ycn0') {
      l.push('<b>cN1-2 → ycN0</b>：行 SLNB。<b>SLN(−) 且腋下分期足量（adequate）→ 可免除 ALND</b>；<b>SLN(+) → ALND</b>（p14）。');
      l.push('<b>Adequate SLN 之定義</b>（p13、p14）：(1) <b>雙示蹤劑（dual tracer）且取出 ≥3 顆淋巴結</b>；或 (2) <b>SLNB + 標記淋巴結摘除（targeted node removal）</b>。若先前已 clip 標記淋巴結，需<b>取出標記之淋巴結 + SLND（不論顆數）</b>。');
      l.push('<b>任何淋巴結陽性（含 pNmi 或 pN0(i+)）→ 後續 ALND</b>（p13）。現行 clip 通常無法以超音波辨識，需<b>乳房攝影導引針定位</b>。');
    } else {
      l.push('<b>cN1-2 → ycN1（腋下仍臨床陽性）→ ALND</b>（p13、p14）。');
    }
    return l;
  }

  /* ---------- MBC ---------- */
  function renderMbc() {
    var s = bcSt;
    if (s.scope !== 'mbc') return;
    var R = 'bc_mbc_rec', F = 'bc_mbc_fu';
    if (!s.msub) { idleRec(R, F, '請選擇步驟 2（生物亞型）'); return; }
    if (s.msub === 'm_her2') {
      result(R, F, 'rec-nonop', 'HER2(+) 轉移性乳癌：抗 HER2 + 化療', mbcHer2Lines(), mbcNote, 'palliative');
      return;
    }
    if (s.msub === 'm_tnbc') {
      result(R, F, 'rec-nonop', 'TNBC 轉移性乳癌：化療 ± 免疫治療', mbcTnbcLines(), mbcNote, 'palliative');
      return;
    }
    if (!s.mfirst) { idleRec(R, F, '請選擇步驟 3（HR(+) 一線策略）'); return; }
    var cf = (s.mfirst === 'chemo_first');
    result(R, F, cf ? 'rec-urgent' : 'rec-nonop',
      cf ? 'HR(+) HER2(−) MBC：visceral crisis／快速惡化 → 先化療'
         : 'HR(+) HER2(−) MBC：內分泌治療優先（± CDK4/6 抑制劑）',
      mbcErLines(cf), mbcNote, 'palliative');
  }

  /* ---------- 復發 ---------- */
  function renderRecur() {
    var s = bcSt;
    if (s.scope !== 'recur') return;
    var R = 'bc_recur_rec', F = 'bc_recur_fu';
    if (!s.rsite) { idleRec(R, F, '請選擇步驟 2（復發型態）'); return; }
    var map = {
      r_bctrt: ['單純局部復發（初始 BCT + RT）', '<b>SM + 淋巴結分期</b>（若先前未做 level I/II ALND）。'],
      r_bctlndrt: ['單純局部復發（初始 BCT + LND + RT）', '<b>可行則手術；或先系統性治療，之後若可行再手術</b>。'],
      r_nort: ['單純局部復發（初始 BCT 或 SM、未放療）', '<b>可行則手術 + 放療至胸壁、SCF、ICF 淋巴結</b>。'],
      r_ax: ['腋下復發 Axillary recurrence', '<b>可行則手術；放療（若可行，至胸壁、SCF、ICF、腋下）</b>。'],
      r_scf: ['鎖骨上復發 Supraclavicular recurrence', '<b>放療（若可行，至胸壁、SCF、ICF）</b>。'],
      r_imn: ['內乳淋巴結復發 Internal mammary node recurrence', '<b>放療（若可行，至胸壁、SCF、ICF、內乳淋巴結）</b>。']
    };
    var m = map[s.rsite];
    result(R, F, 'rec-nonop', m[0], [
      '<span class="rx-h">局部治療 Locoregional</span>　<span class="rx-sub">p36</span>',
      m[1],
      '<span class="rx-h">系統性治療 Systemic therapy</span>　<span class="rx-sub">p36</span>',
      '<b>所有型態之局部／區域復發皆接續系統性治療</b>；<b>化療係依 CALOR 試驗結果建議</b>（p36 註 *）。',
      '處方選擇依亞型，比照轉移性乳癌之系統性治療（p37–p45）：HR(+) 內分泌治療 ± CDK4/6 抑制劑；HER2(+) 抗 HER2 + 化療（THP → T-DM1／T-DXd）；TNBC 化療 ± IO。',
      mbcChemoMenu()
    ], '出處：p36（Local recurrence only／Regional only or Local &amp; regional recurrence）。' , 'palliative');
  }

  /* ---------- 事件 ---------- */
  function bcPick(key, val, btn) {
    bcSel(btn);
    var s = bcSt;
    if (key === 'scope') {
      s.scope = val;
      s.dloc = s.sub = s.strat = s.ax = s.naxi = s.resp = s.msub = s.mfirst = s.rsite = null;
      bcClearSel(['bc_s_dcis', 'bc_s2', 'bc_s3', 'bc_s4u', 'bc_s4n', 'bc_s5n', 'bc_s_msub', 'bc_s_mfirst', 'bc_s_rsite']);
    } else if (key === 'dloc') { s.dloc = val; }
    else if (key === 'sub') {
      s.sub = val; s.strat = s.ax = s.naxi = s.resp = null;
      bcClearSel(['bc_s3', 'bc_s4u', 'bc_s4n', 'bc_s5n']);
    } else if (key === 'strat') {
      s.strat = val; s.ax = s.naxi = s.resp = null;
      bcClearSel(['bc_s4u', 'bc_s4n', 'bc_s5n']);
    } else if (key === 'ax') { s.ax = val; }
    else if (key === 'naxi') { s.naxi = val; s.resp = null; bcClearSel(['bc_s5n']); }
    else if (key === 'resp') { s.resp = val; }
    else if (key === 'msub') { s.msub = val; s.mfirst = null; bcClearSel(['bc_s_mfirst']); }
    else if (key === 'mfirst') { s.mfirst = val; }
    else if (key === 'rsite') { s.rsite = val; }
    bcRender();
  }

  function bcReset() {
    for (var k in bcSt) { if (bcSt.hasOwnProperty(k)) bcSt[k] = null; }
    var root = document.getElementById('bcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['bc_dcis_fu', 'bc_lcis_fu', 'bc_ebc_fu', 'bc_mbc_fu', 'bc_recur_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    bcRender();
  }

  function initBreastPathway() { bcReset(); }

  // 匯出
  global.breastPathwayHTML = breastPathwayHTML;
  global.initBreastPathway = initBreastPathway;
  global.bcPick = bcPick;
  global.bcReset = bcReset;
})(window);
