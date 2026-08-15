/* ============================================================
   乳癌治療互動決策流程 Breast Cancer Treatment Pathway
   ------------------------------------------------------------
   主要資料來源：國立臺灣大學醫學院附設醫院 乳癌診療指引
   （NTUH Clinical Guidelines of Breast Cancer in Oncology, 2023.V1；
     文件編號 50710-2-000010，版次 14；修制訂 2023/12/28；
     癌症醫療委員會檢視通過 2026/06/16）
   指引內頁編號以 p1–p49 標於各建議之出處。

   流程順序刻意依臨床決策的實際發生順序編排：
     影像發現 →（切片病理 + cTNM）→ 先開刀或先做術前輔助治療
     → 怎麼開（乳房手術 + 腋下手術）→ 術後放療與輔助全身治療
     → 復發／轉移之升階治療
   分期（AJCC 8th）不屬本指引範圍，另見「分期 TNM」頁籤。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var bcSt = {
    scope: null,   // dx | dcis | lcis | ebc | prog | mbc | recur
    /* 影像診斷分支 */
    img: null,     // im_calc | im_mass | im_skin | im_axilla
    /* DCIS */
    dloc: null,    // d_bct | d_sm
    dmar: null,    // dm_neg | dm_close
    /* 侵襲癌（M0）主線 */
    sub: null,     // her2hr | her2 | erpos | tnbc
    ctn: null,     // 臨床 cT×cN 格：t1ab_n0 … t4d_n23
    strat: null,   // up | nact | noop
    nresp: null,   // NACT 治療中反應：na_resp | na_pd
    surg: null,    // sg_bct | sg_sm
    ax: null,      // 腋下處置結果（upfront 與 NACT 共用一個 key，選項組不同）
    ptn: null,     // 術後 pT×pN 格：t1mi_n0 … t4_n23
    resp: null,    // NACT 後病理反應：pcr | nonpcr
    /* 治療中／治療後早期進展 */
    pg: null,      // pg_nact | pg_chemo | pg_et | pg_her2 | pg_cdk
    pget: null,    // 內分泌抗性判定：et_prim | et_sec | et_late
    /* 轉移性 */
    msub: null,    // m_her2 | m_erpos | m_tnbc
    mcrisis: null, // mc_no | mc_yes
    /* 局部／區域復發 */
    rsite: null    // r_bctrt | r_bctlndrt | r_nort | r_ax | r_scf | r_imn
  };

  /* ==========================================================
     版面 helpers
     ========================================================== */
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
  function lg(cls, txt) {
    return '<div class="tn-lg"><span class="tn-sw ' + cls + '"></span><span>' + txt + '</span></div>';
  }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  /* ==========================================================
     一、臨床分期格 cT×cN → 初始策略（p9、p11、p18、p19）
     顏色隨「生物亞型」改變 —— 台大的 NACT 適應症本來就是分亞型寫的，
     用同一張灰格子表達四種亞型會直接寫錯，故四種亞型各一張。
     ========================================================== */
  var CTN_ROWS = [
    ['t1ab', 'T1a–b', '≤10mm'],
    ['t1c', 'T1c', '>10–20mm'],
    ['t2', 'T2', '>2–5cm'],
    ['t3', 'T3', '>5cm'],
    ['t4ac', 'T4a–c', '胸壁／皮膚'],
    ['t4d', 'T4d', '發炎性']
  ];
  var CTN_COLS = [['n0', 'cN0', '腋下臨床陰性'], ['n1', 'cN1', '可動腋下(+)'], ['n23', 'cN2–3', '固定／內乳／鎖骨上下']];

  /* g-none 直接手術｜g-low 兩者皆可｜g-ii 建議 NACT｜g-high 局部晚期強烈建議先全身治療 */
  var CTN_GROUP = {
    her2hr: {  // HR(+)/HER2(+)：台大 ≥T2N0、≥N1 建議 NACT；cT1abN0 走 APT 直接手術；cT1cN0 兩者皆可
      t1ab: ['g-none', 'g-ii', 'g-high'],
      t1c: ['g-low', 'g-ii', 'g-high'],
      t2: ['g-ii', 'g-ii', 'g-high'],
      t3: ['g-ii', 'g-ii', 'g-high'],
      t4ac: ['g-high', 'g-high', 'g-high'],
      t4d: ['g-high', 'g-high', 'g-high']
    },
    her2: {    // HR(−)/HER2(+)：多一條「≥T1cN0 亦建議 NACT」
      t1ab: ['g-none', 'g-ii', 'g-high'],
      t1c: ['g-ii', 'g-ii', 'g-high'],
      t2: ['g-ii', 'g-ii', 'g-high'],
      t3: ['g-ii', 'g-ii', 'g-high'],
      t4ac: ['g-high', 'g-high', 'g-high'],
      t4d: ['g-high', 'g-high', 'g-high']
    },
    tnbc: {    // 台大 ≥T2N0、≥N1；T1cN0 台大未列入而 ASCO 有 → 標為兩者皆可並註明差異
      t1ab: ['g-none', 'g-ii', 'g-high'],
      t1c: ['g-low', 'g-ii', 'g-high'],
      t2: ['g-ii', 'g-ii', 'g-high'],
      t3: ['g-ii', 'g-ii', 'g-high'],
      t4ac: ['g-high', 'g-high', 'g-high'],
      t4d: ['g-high', 'g-high', 'g-high']
    },
    erpos: {   // HR(+)/HER2(−)：NACT 為選擇性（降期以行 BCT）；局部晚期（stage III 或 T3N0）才強烈建議
      t1ab: ['g-none', 'g-low', 'g-high'],
      t1c: ['g-none', 'g-low', 'g-high'],
      t2: ['g-none', 'g-low', 'g-high'],
      t3: ['g-ii', 'g-ii', 'g-high'],
      t4ac: ['g-high', 'g-high', 'g-high'],
      t4d: ['g-high', 'g-high', 'g-high']
    }
  };

  var SUB_LABEL = {
    her2hr: 'HR(+) / HER2(+)',
    her2: 'HR(−) / HER2(+)',
    erpos: 'HR(+) / HER2(−)',
    tnbc: 'HR(−) / HER2(−)（TNBC）'
  };

  function ctnGridHtml(sub) {
    var G = CTN_GROUP[sub];
    var h = '<div class="tn-wrap" id="bc_ctnwrap_' + sub + '">';
    h += '<div class="tn-cap">臨床分期 clinical stage（M0）· 點選格子</div>';
    h += '<div class="tn-sub">亞型：<b>' + SUB_LABEL[sub] + '</b>　—　台大之術前輔助治療（NACT）適應症<b>依亞型而異</b>，' +
      '故切換亞型時整張表會重新上色（p9、p11、p18、p19）。</div>';
    h += '<div class="tn-grid" id="bc_ctngrid_' + sub + '">';
    h += '<div class="tn-corner">cT ＼ cN</div>';
    CTN_COLS.forEach(function (c) { h += '<div class="tn-ch">' + c[1] + '<span class="tn-sub2">' + c[2] + '</span></div>'; });
    CTN_ROWS.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + '<span class="tn-sub2">' + r[2] + '</span></div>';
      CTN_COLS.forEach(function (c, i) {
        var key = r[0] + '_' + c[0];
        var g = G[r[0]][i];
        // id 必須帶亞型：四張表同時存在於 DOM，不帶亞型就會產生四組重複 id
        h += '<button class="tn-cell ' + g + '" id="bc_ctnc_' + sub + '_' + key + '" ' +
          'onclick="bcPick(\'ctn\',\'' + key + '\',this)">' + r[1] + c[1].replace('c', '') + '</button>';
      });
    });
    h += '</div>';
    h += '<div class="tn-legend">' +
      lg('g-none', '直接手術 Upfront surgery') +
      lg('g-low', '直接手術或術前輔助治療皆可（依 BCT 意願／降期需求）') +
      lg('g-ii', '建議術前輔助治療 NACT（ER(+) 停經後亦可用 NAHT）') +
      lg('g-high', '局部晚期 — 強烈建議先做全身治療，勿直接手術') +
      '</div>';
    h += '<div class="note"><b>台大 NACT 適應症原文（p9）</b>：術前輔助治療通常用於<b>局部晚期且體能適合（fit）</b>者，' +
      '或希望接受乳房保留手術者；<b>建議用於</b> — HER2(+)：≥T2N0、或 ≥N1、或 HR(−)/HER2(+) 之 ≥T1cN0；' +
      'TNBC：≥T2N0、或 ≥N1；以及臨床試驗收案。<br>' +
      '<b>台大與 ASCO 的門檻差異</b>：ASCO 術前治療指引建議 TNBC <b>≥cT1c 或 cN(+)</b> 即給術前化療（cT1a／cT1bN0 不常規給），' +
      '較台大的 ≥T2N0 低一級；HER2(+) 則兩者一致（T1aN0／T1bN0 不常規給）。此差異已反映在 TNBC 之 T1c／N0 格（標為「兩者皆可」）。<br>' +
      '<b>發炎性乳癌（T4d）</b>：不論亞型一律先做全身治療，且<b>不做乳房保留手術</b>。<br>' +
      '<b>前提</b>：只有在「術後本來就有化療適應症」時才把化療提前 — 復發風險低者，把化療前移並不會增加絕對效益。</div>';
    h += '</div>';
    return h;
  }

  /* ==========================================================
     二、術後病理格 pT×pN → 輔助全身治療（p17、p19、p22）
     ========================================================== */
  var PTN_ROWS = [
    ['t1mi', 'T1mi', '≤1mm'],
    ['t1a', 'T1a', '>1–5mm'],
    ['t1b', 'T1b', '>5–10mm'],
    ['t1c', 'T1c', '>10–20mm'],
    ['t2', 'T2', '>2–5cm'],
    ['t3', 'T3', '>5cm'],
    ['t4', 'T4', '胸壁／皮膚']
  ];
  var PTN_COLS = [['n0', 'pN0', '含 ITC'], ['n1mi', 'pN1mi', '微轉移'], ['n1', 'pN1', '1–3 顆'], ['n23', 'pN2–3', '≥4 顆']];

  var PTN_GROUP = {
    her2hr: {
      t1mi: ['g-none', 'g-ii', 'g-high', 'g-high'],
      t1a: ['g-none', 'g-ii', 'g-high', 'g-high'],
      t1b: ['g-ii', 'g-high', 'g-high', 'g-high'],
      t1c: ['g-low', 'g-high', 'g-high', 'g-high'],
      t2: ['g-low', 'g-high', 'g-high', 'g-high'],
      t3: ['g-low', 'g-high', 'g-high', 'g-high'],
      t4: ['g-low', 'g-high', 'g-high', 'g-high']
    },
    erpos: {
      t1mi: ['g-ii', 'g-low', 'g-low', 'g-high'],
      t1a: ['g-ii', 'g-low', 'g-low', 'g-high'],
      t1b: ['g-ii', 'g-low', 'g-low', 'g-high'],
      t1c: ['g-ii', 'g-low', 'g-low', 'g-high'],
      t2: ['g-ii', 'g-low', 'g-low', 'g-high'],
      t3: ['g-low', 'g-low', 'g-low', 'g-high'],
      t4: ['g-low', 'g-low', 'g-low', 'g-high']
    },
    tnbc: {
      t1mi: ['g-none', 'g-ii', 'g-high', 'g-high'],
      t1a: ['g-ii', 'g-ii', 'g-high', 'g-high'],
      t1b: ['g-ii', 'g-high', 'g-high', 'g-high'],
      t1c: ['g-high', 'g-high', 'g-high', 'g-high'],
      t2: ['g-high', 'g-high', 'g-high', 'g-high'],
      t3: ['g-high', 'g-high', 'g-high', 'g-high'],
      t4: ['g-high', 'g-high', 'g-high', 'g-high']
    }
  };
  PTN_GROUP.her2 = PTN_GROUP.her2hr;   // 化療／抗 HER2 之門檻兩者相同；差別在內分泌與 neratinib，寫在建議內文

  var PTN_LEGEND = {
    her2hr: [
      ['g-none', '±（化療 + trastuzumab 可給可不給）'],
      ['g-ii', '可考慮 化療 + trastuzumab'],
      ['g-low', '化療 + trastuzumab'],
      ['g-high', '化療 + trastuzumab（LN(+) 建議再加 pertuzumab）']
    ],
    erpos: [
      ['g-ii', '內分泌治療；或 化療 + 內分泌（依多基因檢測／IHC4／臨床病理分層）'],
      ['g-low', '通常 化療 + 內分泌（多基因檢測低風險者可免化療）'],
      ['g-high', '化療 + 內分泌治療']
    ],
    tnbc: [
      ['g-none', '可省略化療'],
      ['g-ii', '± 化療（與病人討論）'],
      ['g-high', '建議化療']
    ]
  };
  PTN_LEGEND.her2 = PTN_LEGEND.her2hr;

  var PTN_NOTE = {
    her2hr: '<b>p17 原文</b>：pT1mi–pT1aN0 ±（C/T + trastuzumab）；pT1bN0 或 pT1aN1mi 可考慮 C/T + trastuzumab；≥pT1cN0 給 C/T + trastuzumab；' +
      'LN(+) 給輔助 C/T + trastuzumab 並<b>建議加 pertuzumab</b>。trastuzumab 未特別指定時<b>總計 1 年</b>。' +
      'ER(+) 者輔助內分泌治療為必要，<b>於化療完成後才開始</b>。<br>' +
      '<b>本表之外推</b>：指引未明列 <b>pT1mi／pN1mi</b>，此格比照其明列的 pT1aN1mi 標為「可考慮」，臨床請個案判斷。',
    erpos: '<b>p22 原文</b>：≤pT2N0 給輔助內分泌治療（ET）或 化療＋ET，風險以<b>多基因檢測、IHC4 分數或臨床病理參數</b>評估；' +
      '≥pT3N0 傾向 化療＋ET；pT1-2 N1mi–N1 通常 化療＋ET，除非多基因檢測顯示低復發風險；TanyN2-3 給 化療＋ET。' +
      '高風險者可加 <b>abemaciclib 2 年</b>或 <b>TS-1 1 年</b>。<br>' +
      '<b>本表之外推</b>：指引以「pT1-2 N1mi–N1」敘述，<b>pT3–4 且 N1mi–N1</b> 未明列，本表依「≥pT3N0 傾向加化療」與「LN(+)」兩條合併歸入同組。',
    tnbc: '<b>p19 原文</b>：除非風險極低，否則有化療指徵 — pT1miN0 可省略；pT1aN0–N1mi、pT1bN0 ± 化療；優先考慮臨床試驗收案。' +
      '<br><b>本表之外推</b>：pT1mi 且 pN1mi 指引未明列，比照 pT1aN1mi 標為「± 化療」。'
  };
  PTN_NOTE.her2 = PTN_NOTE.her2hr;

  function ptnGridHtml(sub) {
    var G = PTN_GROUP[sub];
    var h = '<div class="tn-wrap" id="bc_ptnwrap_' + sub + '">';
    h += '<div class="tn-cap">術後病理分期 pathologic stage（M0）· 點選格子</div>';
    h += '<div class="tn-sub">亞型：<b>' + SUB_LABEL[sub] + '</b>　—　輔助全身治療的門檻<b>依亞型而異</b>（p17、p19、p22）。</div>';
    h += '<div class="tn-grid tn-c4" id="bc_ptngrid_' + sub + '">';
    h += '<div class="tn-corner">pT ＼ pN</div>';
    PTN_COLS.forEach(function (c) { h += '<div class="tn-ch">' + c[1] + '<span class="tn-sub2">' + c[2] + '</span></div>'; });
    PTN_ROWS.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + '<span class="tn-sub2">' + r[2] + '</span></div>';
      PTN_COLS.forEach(function (c, i) {
        var key = r[0] + '_' + c[0];
        var g = G[r[0]][i];
        h += '<button class="tn-cell ' + g + '" id="bc_ptn_' + sub + '_' + key + '" ' +
          'onclick="bcPick(\'ptn\',\'' + key + '\',this)">' + r[1] + c[1].replace('p', '') + '</button>';
      });
    });
    h += '</div>';
    h += '<div class="tn-legend">' + PTN_LEGEND[sub].map(function (x) { return lg(x[0], x[1]); }).join('') + '</div>';
    h += '<div class="note">' + PTN_NOTE[sub] + '<br>' +
      '<b>化療起始時間（p28）</b>：除非傷口癒合不良或其他併發症，一般希望<b>術後六至八週內</b>開始化療。' +
      '<b>pN0 欄含孤立腫瘤細胞 pN0(i+)</b>（≤0.2mm 且 ≤200 個細胞），分期上仍視為 N0。</div>';
    h += '</div>';
    return h;
  }

  /* ==========================================================
     可折疊參考表
     ========================================================== */
  function vnpiDetails() {
    var rows = [
      ['腫瘤大小', '≤1.5 cm', '1.6–4.0 cm', '≥4.1 cm'],
      ['病理', 'Non-high grade、壞死(−)', 'Non-high grade、壞死(+)', 'High grade'],
      ['切緣', '≥1.0 cm', '0.1–0.9 cm', '＜0.1 cm'],
      ['年齡', '>60 歲', '40–60 歲', '<40 歲']
    ];
    var t = '<details class="kps-details"><summary>Van Nuys Prognostic Index（VNPI）計分表（p46）▸</summary><table>' +
      '<tr><td></td><td>1 分</td><td>2 分</td><td>3 分</td></tr>';
    rows.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; });
    t += '<tr><td>4–6 分</td><td colspan="3">低風險：放療為選擇性（optional RT）</td></tr>' +
      '<tr><td>7–9 分</td><td colspan="3">中風險：建議輔助放療</td></tr>' +
      '<tr><td>10–12 分</td><td colspan="3">高風險：建議全乳切除</td></tr>' +
      '<tr><td>另一準則</td><td colspan="3">ECOG E5194 條件：腫瘤 &lt;2.5 cm、低或中度分化、切緣 &gt;3 mm — 亦可作為省略放療之依據</td></tr>';
    t += '</table></details>';
    return t;
  }

  function chemoGenDetails() {
    return '<details class="kps-details"><summary>化療處方世代分類與常用處方（依 Adjuvant! Online；p28–p31）▸</summary><table>' +
      '<tr><td>第一代</td><td>CMF；AC×4；EC×4</td></tr>' +
      '<tr><td>第二代</td><td>CEF；FAC；AC-T／EC-T；TC（USO9735）；A- 或 E-CMF</td></tr>' +
      '<tr><td>第三代</td><td>Dose dense ATC（CALGB9741）；TAC（BCIRG001）；TEC；FEC-T（PACS01）；AC-wT（E1199）</td></tr>' +
      '<tr><td>AC-T／EC-T<br>（CALGB9344、BCIRG-005）</td><td>cyclophosphamide 500–600 mg/m² + epirubicin 75–100 mg/m²（或 doxorubicin 60 mg/m²）D1 ×4，接續 paclitaxel 175–225 mg/m²（或 docetaxel 75–100 mg/m²）×4；皆 q21d</td></tr>' +
      '<tr><td>AC-wT（E1199）</td><td>AC／EC ×4（q21d）→ paclitaxel 80 mg/m² D1、D8、D15 共 12 劑</td></tr>' +
      '<tr><td>TC ×4–6（USO9735）</td><td>docetaxel 75 mg/m² + cyclophosphamide 500–600 mg/m² D1 q21d</td></tr>' +
      '<tr><td>TAC（BCIRG001）／TEC</td><td>docetaxel 75 mg/m² + doxorubicin 50（TEC 用 epirubicin 70）mg/m² + cyclophosphamide 500 mg/m² q21d ×6，須 G-CSF 支持</td></tr>' +
      '<tr><td>其他可用</td><td>CEF、FAC、modified FEC-T（PACS01）、classical／modified CMF</td></tr>' +
      '<tr><td>院內共識</td><td>第二代較第一代約降低 15% 相對復發率，第三代較第二代再降 15%。危險因子以<b>腫瘤大小、淋巴結轉移顆數、tumor grade</b> 最重要，再加年齡、ER、PR、HER2、Ki-67。' +
      'NCCN 輔助處方中<b>無 liposomal doxorubicin</b>，故本院指引亦不含；若病人堅持以其取代 doxorubicin／epirubicin，基於有治療優於無治療仍可接受，但病歷須詳細註明。' +
      'E1199：docetaxel 與 paclitaxel 可互換，以 q3w docetaxel 與每週 paclitaxel 為優先。</td></tr>' +
      '</table></details>';
  }

  function htDetails() {
    return '<details class="kps-details"><summary>內分泌治療原則（p23、p24）▸</summary><table>' +
      '<tr><td>ER 陽性定義</td><td>1% ≤ ER &lt; 10% → <b>±</b> 使用內分泌治療；ER &lt; 1% → 不使用；ER(−) 但 PR &gt; 10% → <b>±</b> 使用</td></tr>' +
      '<tr><td>DCIS</td><td>接受乳房保留手術者建議輔助 tamoxifen 5 年</td></tr>' +
      '<tr><td>停經前</td><td>tamoxifen 至少 5 年；之後 — 仍停經前或不確定：可再 5 年 tamoxifen（共 10 年）；已停經：換 AI 再 5 年，或再 5 年 tamoxifen（共 10 年）。' +
      '雙側卵巢切除後依停經後原則。<b>高風險者可用 GnRH agonist + AI／tamoxifen 5 年</b>。</td></tr>' +
      '<tr><td>停經後</td><td>AI 5 年；或 AI 2–3 年後換 tamoxifen（至多共 10 年）；或 tamoxifen 2–3 年後換 AI 5 年（共 7–8 年）；或 tamoxifen 5 年後再 5 年 tamoxifen 或 5 年 AI。' +
      '<b>心血管疾病高風險或骨質疏鬆者，AI 應謹慎使用</b>。</td></tr>' +
      '<tr><td>監測</td><td>使用 tamoxifen 且<b>子宮存在</b>者每年婦科評估；使用 AI 者建議定期骨密度（BMD）檢查 —— ' +
      '指引 p24 寫「未給付」，但<b>醫療服務給付項目 33064B 之適應症第 5 項即為「乳癌病人接受 Aromatase Inhibitors 治療前與治療後」</b>，' +
      '兩次檢查須間隔一定年限且終生有次數上限，開單前確認。</td></tr>' +
      '</table></details>';
  }

  function favHistoDetails() {
    return '<details class="kps-details"><summary>預後良好之組織型態（favorable histologies，p25、p26）▸</summary><table>' +
      '<tr><td>涵蓋</td><td>黏液性（mucinous）、管狀（tubular）、乳突狀（papillary）</td></tr>' +
      '<tr><td>手術</td><td>與一般侵襲癌相同</td></tr>' +
      '<tr><td>ER 狀態</td><td>通常 ER(+)；若判為 ER(−) <b>必須重做 IHC</b>，仍為 ER(−) 則<b>比照一般風險侵襲癌處理</b></td></tr>' +
      '<tr><td>輔助治療</td><td>ER(+) 者<b>單用內分泌治療</b>；LN(+) 者 ± 輔助化療</td></tr>' +
      '<tr><td>黏液性</td><td>若為 hypercellular 亞型且 Ki-67 高，可討論輔助化療之適應症</td></tr>' +
      '<tr><td>乳突狀</td><td>通常 p63(+)，比照原位癌處理。<b>Intracystic／encapsulated papillary carcinoma</b> 可能失去 p63，但臨床行為仍偏原位癌；' +
      '惟<b>有 3% 淋巴結侵犯機會，應做 SLNB</b>。</td></tr>' +
      '</table></details>';
  }

  /* ==========================================================
     放射治療（p46、p47、p48、p49）
     ========================================================== */
  function rtLines(ctx) {
    // ctx: 'bct' | 'sm' | 'nact'
    var l = [];
    if (ctx === 'bct') {
      l.push('<b>乳房保留手術後全乳放療為必要</b>（p8）。<b>唯一的例外</b>：低風險年長者 — 年齡 &gt;70、cN0、切緣乾淨、HR(+) 且服用 tamoxifen 或 AI —' +
        '因絕對效益小可考慮省略（<b>CALGB 9343</b>：&gt;70 歲、ER(+)、stage I 者 BCT 後放療<b>無整體存活效益</b>）；' +
        '但即使在此族群，<b>放療仍改善局部控制</b>，故省略與否應與病人討論（p47）。');
    }
    if (ctx === 'sm') {
      l.push('<b>全乳切除後胸壁放療（PMRT）之明確指徵</b>（p47）：腋下淋巴結 <b>≥4 顆(+)</b>；<b>切緣(+)</b>；' +
        '侵犯<b>皮膚</b>；侵犯<b>胸壁</b>（僅侵犯 pectoral fascia 不算）；<b>T3 且腋下淋巴結(+)</b>。' +
        '腋下 <b>1–3 顆(+)</b> 者依危險因子個別決定。');
    }
    if (ctx === 'nact') {
      l.push('<b>NACT 後之輔助放療（NTUH 共識，p49）</b><ul>' +
        '<li><b>可考慮省略</b> PMRT／Breast RT + 區域淋巴照射（RNI）：達 pCR 且符合其一 — HR(+)；HER2(+) 且初始 cTanyN0-1；TNBC 且初始 cT1-2N0。</li>' +
        '<li><b>應接受</b> PMRT／Breast RT + RNI：未達 pCR 而依<b>臨床分期</b>本有指徵者；NACT 後 <b>pN(+)</b>；<b>cT1-2N1 之 HER2(+) 未達 pCR</b> 者。</li>' +
        '<li><b>應由放射腫瘤科評估</b>後決定：cT1-2N1 之 HR(+)／TNBC <b>僅殘存乳房腫瘤</b>者；<b>cT3N0 且 ypT1-2N0</b> 者。</li></ul>' +
        '<b>放療指徵依「治療前的臨床分期」而非只看術後病理</b> — 這是 NACT 情境最常被忽略的一點。');
    }
    l.push('<b>放療與化療的順序</b>（p10）：乳房保留手術後若有化療指徵，指引所列為 <b>xRT follow by C/T</b>（放療之後接化療）；' +
      '全乳切除後若 pN2 或切緣(+) 則加放療。實務排序仍由放射腫瘤科與腫瘤內科共同決定。');
    return l;
  }

  /* ==========================================================
     健保給付（p17、p18、p19、p21、p35、p38、p39、p40、p41）
     ========================================================== */
  /* 台大指引為 2023 年版本，其「未給付」敘述在 2024–2026 之間已有九項反轉。
     兩邊都要寫：指引原文是病人手上那份文件說的，現行條文才是今天送審會過的。 */
  function nhiPanelEBC() {
    return '<details class="rx-more"><summary>健保給付 · 早期乳癌（EBC）—— <b>指引 2023 年的敘述已有多項反轉，請看現行條文</b> ▸</summary><div class="rx-note">' +
      '<div class="rx-warn"><b>台大指引（2023.V1）當時的敘述</b>：EBC 之 trastuzumab <b>僅給付淋巴結陽性者</b>（p17）；' +
      'pertuzumab、T-DM1、neratinib 於 EBC <b>均未給付</b>（p17、p18）；abemaciclib 與 TS-1 <b>未給付</b>（p22）；' +
      'olaparib 於 EBC <b>未給付</b>（p21）；pembrolizumab <b>未給付</b>（p19、p20）。<br>' +
      '<b>這些敘述有五項已經不成立</b> —— 下表為健保署藥品給付規定第 9 節之現行條文（查詢日 2026-08-16）。</div>' +
      '<ul class="rx-items">' +
      '<li><span class="drug">trastuzumab</span>（<b>9.18.1</b>，現行版 2026-08-01）：<b>已不再限於淋巴結陽性</b>。' +
      '除 LN(+) 之外，<b>淋巴結陰性早期乳癌亦納入</b>：術前情境腫瘤 &gt;2cm 且 ER(−)；直接手術者 ER(−) 腫瘤 &gt;0.5cm 或 ER(+) 腫瘤 &gt;1cm。' +
      '需事前審查，早期乳癌每 24 週檢附療效再申請。<b>注意：ER(+) 淋巴結陰性與直接手術之淋巴結陰性兩支限用生物相似藥</b>（Eirgasun 420mg／Herzuma／Ogivri），原廠 Herceptin 不涵蓋。' +
      '皮下劑型 600mg 同屬 9.18，無另訂條件。</li>' +
      '<li><span class="drug">pertuzumab</span>（<b>9.70.1</b>）與 <b>Phesgo</b>（9.112.1）：<b>2024-12-01 起於 EBC 給付</b> —— ' +
      'HER2 IHC3+/FISH(+) 且<b>腋下淋巴結轉移</b>、無遠處轉移者；術前使用且 pCR 者可續用，直接手術者亦可作輔助治療；' +
      '與 trastuzumab、Phesgo <b>合併計算上限 18 個週期</b>。<b>淋巴結陰性仍不給付</b>。</li>' +
      '<li><span class="drug">T-DM1</span>（<b>9.87.1</b>）：<b>2024-08-01 起於術前治療後殘存病灶給付</b> —— 需已接受 ≥6 週期化療（含 taxane ≥3 週期）與術前 trastuzumab ≥3 週期後仍有殘存，' +
      '且符合<b>腋下淋巴結轉移</b>，或<b>淋巴結陰性但 ER(−) 且腫瘤 &gt;2cm</b>。上限 14 週期（與 trastuzumab 合計 18 週期）；須術後 12 週內申請；LVEF &lt;45% 或症狀性心衰竭不可用。' +
      '<b>健保條件比 KATHERINE 窄</b>（KATHERINE 收所有殘存病灶者）。</li>' +
      '<li><span class="drug">abemaciclib</span>（<b>9.107</b>）：<b>2024-03-01 起於輔助治療給付</b> —— 成年<b>女性</b>、HR(+)（ER 或 PR &gt;30%）、HER2(−)、' +
      '淋巴結陽性且符合其一：<b>pALN ≥4 顆</b>／<b>pALN 1–3 顆且腫瘤 ≥5cm</b>／<b>pALN 1–3 顆且 grade 3</b>。' +
      '須完成標準輔助化療與放療後才申請；先前內分泌治療不超過 12 週；<b>須術後 16 個月內開始</b>；最長 2 年。' +
      '<b>台灣不看 Ki-67</b>（與 monarchE 不同），且<b>男性不在條文內</b>。⚠ 用此藥後進展者，<b>日後不得再申請任何 CDK4/6 抑制劑</b>（9.72.7）。</li>' +
      '<li><span class="drug">olaparib</span>（<b>9.85.4</b>）：<b>2025-06-01 起於高復發風險早期乳癌給付</b> —— <b>生殖細胞</b> BRCA1/2 突變、HER2(−)；' +
      '需完成 ≥6 週期含 anthracycline／taxane 之化療，並於最後一次治療後 12 週內開始，最長 1 年。' +
      '高風險定義：<b>TNBC</b> — 術前化療後 non-pCR，或直接手術後 ≥pN1 或 pN0 但腫瘤 ≥2cm；' +
      '<b>HR(+)/HER2(−)</b> — 術前化療後 non-pCR，或直接手術後<b>淋巴結 ≥4 顆</b>（<b>不走 CPS-EG 分數那條路</b>）。' +
      '⚠ 輔助情境<b>olaparib 與 pembrolizumab 只能擇一給付</b>。</li>' +
      '<li><span class="drug">pembrolizumab</span>（<b>9.69.2(7)</b>）：<b>2025-06-01 起於早期三陰性乳癌給付</b> —— 非轉移之 stage II–IIIb' +
      '（cT1cN1-2 或 T2-4N0-2）。術前：pembrolizumab + carboplatin + paclitaxel ×4，再接 pembrolizumab + cyclophosphamide +（doxorubicin 或 epirubicin）×4。' +
      '<b>輔助期只給付未達 pCR 者</b>（單用 pembrolizumab ≤9 週期）；術前＋輔助合計上限 17 週期。<b>此適應症不需檢附 PD-L1 報告</b>。' +
      '⚠ 術前治療中進展或輔助期復發即不得續用。</li>' +
      '<li><span class="drug">ribociclib</span> 之輔助治療（NATALEE）：<b>仍未給付</b> —— ribociclib 只有 9.72（轉移性）一條，沒有輔助的支線。' +
      '<b>台灣的輔助 CDK4/6 抑制劑只有 abemaciclib</b>，這個不對稱在臨床上很容易踩到。</li>' +
      '<li><span class="drug">neratinib</span>：<b>仍未給付</b>（健保藥品清單查無此成分之品項）。指引 p18 的敘述仍然正確。</li>' +
      '<li><span class="drug">capecitabine</span> 之術後強化（CREATE-X）與 <span class="drug">TS-1</span>：<b>仍未給付</b> —— ' +
      'capecitabine 條文 9.17 之乳癌適應症只到「局部晚期／轉移性」，沒有輔助或術後強化那一條；TS-1 條文 9.46 完全沒有乳癌。</li>' +
      '<li><b>Oncotype DX／MammaPrint</b> 等多基因復發風險檢測：<b>自費</b>。健保 2024-05-01 起的次世代定序給付，乳癌那一格<b>只涵蓋三陰性乳癌的 BRCA 檢測</b>，不含預後型多基因檢測。</li>' +
      '<li><b>骨密度（DXA）檢查</b>：<b>有給付</b> —— 醫療服務給付項目 <b>33064B</b> 之適應症第 5 項即為「乳癌病人在接受 Aromatase Inhibitors 治療前與治療後」。' +
      '（指引 p24 寫「未給付」，此處與現行支付標準不符。）兩次檢查須間隔一定年限且終生有次數上限，開單前確認。</li>' +
      '<li><b>輔助用雙磷酸鹽／denosumab</b>（非轉移之骨骼保護）：<b>不給付</b> —— zoledronate 4mg（5.5.3.2.1）與 denosumab 120mg（5.5.4）都<b>只涵蓋蝕骨性骨轉移</b>。</li>' +
      '</ul>' +
      '<div class="rx-def"><b>院內立場（p21）</b>：現有研究顯示<b>不論淋巴結是否陽性</b>，術前／術後 trastuzumab-based 化療皆顯著降低 HER2(+) 病人之復發率與死亡率；' +
      '因此對<b>淋巴結陰性但腫瘤有一定大小或風險較高</b>者，團隊仍建議使用 trastuzumab-based 治療。' +
      'HER2(+) 病人之術前／術後化療，<b>文獻上可用但 NCCN 未提及之處方（如 CMF、TC）本院亦認為可用</b>。' +
      '<b>這一段立場在 2026 年更站得住腳</b> —— 淋巴結陰性者現在多數已納入給付。</div>' +
      '<div class="rx-warn"><b>實務提醒（p35 註二）</b>：健保並未給付所列全部藥物，<b>實際使用劑量與療程受病人經濟狀況限制</b>。' +
      'trastuzumab 標準療程為 1 年，但<b>因給付因素，9–12 週亦被視為可接受</b>（p34）。<br>' +
      '<b>給付條文會變，開藥前請以健保署當期公告為準</b>；本表資料查詢日為 2026-08-16。</div>' +
      '</div></details>';
  }

  function nhiPanelMBC() {
    return '<details class="rx-more"><summary>健保給付 · 轉移性乳癌（MBC）—— <b>2024–2026 有多項新增</b> ▸</summary><div class="rx-note">' +
      '<div class="rx-warn"><b>台大指引（2023.V1）當時的敘述</b>：CDK4/6 + AI 自 2019/10/1 給付停經後一線（p38）；' +
      'trastuzumab／pertuzumab／T-DM1／lapatinib 為有條件給付，<b>T-DXd 與 neratinib 未給付</b>（p39）；' +
      'PARP 抑制劑<b>僅 TNBC 給付</b>（p41）；pembrolizumab 與 atezolizumab 於 TNBC <b>均未給付</b>（p40）。' +
      '以下為健保署現行條文（查詢日 2026-08-16）。</div>' +
      '<ul class="rx-items">' +
      '<li><b>CDK4/6 抑制劑</b>（<b>9.72</b>，現行版 2025-07-01）：<b>只涵蓋 ribociclib 與 palbociclib</b>（<b>abemaciclib 不在其中</b>）。' +
      '條件：ER 或 PR &gt;30%、HER2(−)、<b>無內臟危象、無腦轉移</b>、<b>不可只有骨轉移</b>。' +
      '停經後（9.72.1）需年齡 ≥55、曾雙側卵巢切除、或 FSH 與 estradiol 達停經後範圍；停經前／圍停經期與<b>男性</b>（9.72.2，2025-07-01 新增男性）須併用 AI ＋ GnRH 類似物。' +
      '<b>已不限一線</b>（110/10/1 起解除）。<b>終生上限 24 個月</b>，兩藥只能擇一（僅因無法耐受可換）。' +
      '⚠ 曾用 everolimus 失敗者不得申請 CDK4/6（9.72.6）；<b>輔助 abemaciclib 失敗者亦不得申請</b>（9.72.7）。</li>' +
      '<li><span class="drug">abemaciclib</span>：<b>轉移性不給付</b> —— 它只有 9.107（輔助）一條。這一點很反直覺：藥有給付，但只在輔助情境。</li>' +
      '<li><span class="drug">everolimus</span>（<b>9.36.1 第 4 項</b>）：與 <b>exemestane</b> 併用，HR(+)/HER2(−) 轉移性、<b>無內臟危象</b>、曾使用<b>非固醇類 AI 失敗</b>且未曾用過 exemestane。' +
      '⚠ everolimus 失敗後<b>不得再申請 CDK4/6 抑制劑</b>。</li>' +
      '<li><span class="drug">alpelisib</span>（<b>9.129</b>，2026-01-01 新增）：與 <b>fulvestrant</b> 併用，<b>停經後</b>、曾用 CDK4/6 抑制劑後進展、ER 或 PR &gt;30%、HER2(−)、<b>PIK3CA 突變</b>。</li>' +
      '<li><span class="drug">capivasertib</span>（<b>9.135</b>，2026-06-01 新增）：與 <b>fulvestrant</b> 併用，<b>停經後</b>、曾用 CDK4/6 後進展、HR(+)、HER2(−)、' +
      '<b>PIK3CA／AKT1／PTEN 任一變異</b>。⚠ 與 alpelisib+fulvestrant <b>擇一給付</b>。</li>' +
      '<li><span class="drug">elacestrant</span>：<b>未給付</b>（健保藥品清單查無此成分）。</li>' +
      '<li><b>抗 HER2</b>：<span class="drug">trastuzumab</span>（9.18.2）、<span class="drug">pertuzumab</span>／Phesgo（9.70.2／9.112.2，一線、上限 18 個月）、' +
      '<span class="drug">T-DM1</span>（9.87.2，二線、上限 10 個月／13 週期）、<b><span class="drug">T-DXd</span>（9.115，<b>2025-02-01 起給付</b>）</b>' +
      '—— HER2(+) 二線（上限 18 週期），以及 <b>HER2-low（ER 與 PR 皆陰性且 HER2 IHC1+ 或 2+/ISH−）</b>之晚期／轉移性乳癌；' +
      '<span class="drug">lapatinib</span>（9.47，限<b>腦轉移</b>且已用過 anthracycline、taxane 與 trastuzumab 後進展者）。' +
      '<b><span class="drug">tucatinib</span> 未給付</b>。<br>' +
      '⚠ <b>最重要的一條限制：T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換</b>；<b>T-DXd 與 sacituzumab govitecan 亦互斥</b>。' +
      '排治療順序前先把這條算進去。</li>' +
      '<li><b>PARP 抑制劑</b>（<b>9.85.2</b>）：<span class="drug">olaparib</span>／<span class="drug">talazoparib</span> <b>仍僅限三陰性</b>' +
      '（ER、PR、HER2 皆陰性）且<b>生殖細胞</b> BRCA1/2 突變者；<b>HR(+)/HER2(−) 的 gBRCA 轉移性乳癌仍不給付</b>。兩藥擇一。</li>' +
      '<li><b>免疫治療</b>（<b>9.69</b>）：<b>轉移性 TNBC 仍不給付</b> —— 條文中乳癌只有「早期三陰性乳癌」一格。' +
      'KEYNOTE-355（pembrolizumab + 化療）與 IMpassion130（atezolizumab + nab-paclitaxel）<b>皆不在給付範圍</b>；atezolizumab 於乳癌完全無適應症。</li>' +
      '<li><span class="drug">sacituzumab govitecan</span>（<b>9.106</b>）：<b>TNBC</b>（2024-02-01）— 已failed ≥2 線全身治療（≥1 線用於晚期）、ECOG ≤1、曾用 taxane、<b>未曾用 T-DXd</b>；' +
      '<b>HR(+)/HER2(−)</b>（2025-10-01 新增）— 無活動性腦轉移、<b>曾用 CDK4/6 抑制劑 ≤12 個月且有內臟轉移</b>、且已接受 ≥2 線轉移性化療。</li>' +
      '<li><span class="drug">bevacizumab</span>（9.37）：<b>乳癌無適應症</b>（條文七項適應症中沒有乳癌）。指引 p43 的 <span class="rx">BEEP</span> 處方與 p45 「合併 bevacizumab 是合理的」屬<b>自費</b>使用。</li>' +
      '<li><span class="drug">eribulin</span>（9.48.1）：轉移性乳癌且<b>先前已用過 anthracycline 與 taxane</b> 者；每 3 個週期評估反應並記錄。與 ixabepilone 互斥。</li>' +
      '<li><b>骨轉移</b>：zoledronate 4mg（5.5.3.2.1）與 denosumab 120mg（5.5.4）皆給付，但<b>限蝕骨性（osteolytic）骨轉移</b>。' +
      '（這兩條在第 5 節不在第 9 節，是常找不到的原因。）</li>' +
      '</ul>' +
      '<div class="rx-def"><b>伴隨式診斷（p40）</b>：IMpassion130 以 <b>Ventana SP142</b> 判讀 PD-L1 IC(+)，化療夥伴為 nab-paclitaxel；' +
      'KEYNOTE-355 以 <b>Dako 22C3</b> 判讀 <b>CPS ≥ 10</b>，化療夥伴為 gemcitabine／platinum、nab-paclitaxel 或 paclitaxel。' +
      '<b>NTUH 修正</b>：認同一線加入免疫治療的概念、依各自建議之伴隨式診斷選擇病人，但<b>化療夥伴可較寬</b>。<br>' +
      '<b>給付條文會變，開藥前請以健保署當期公告為準</b>；本表資料查詢日為 2026-08-16。</div>' +
      '</div></details>';
  }

  /* ==========================================================
     腋下手術：可省略前哨淋巴結切片（SLNB）的情境
     —— 台大指引本身未列成一張表，故此處註明各條之來源。
     ========================================================== */
  function omitAxDetails() {
    return '<details class="kps-details"><summary>什麼時候<b>連 SLNB 都不用做</b>？▸</summary><table>' +
      '<tr><td>純 DCIS<br>行乳房保留手術</td><td><b>不需</b>腋下分期。DCIS 本身的淋巴結轉移率僅約 1–2%；' +
      '若最終病理升級為侵襲癌（各研究 7–28%，統合分析約 25.8%），<b>乳房保留手術後仍可回頭補做 SLNB</b>，因為乳房淋巴引流還在。<br>' +
      '台大 p6 註 b：SLNB「<b>更強烈考慮</b>用於接受全乳切除者，以及切除位置可能影響日後 SLNB 者」——即單純 BCS 之 DCIS 並非必做。</td></tr>' +
      '<tr><td>DCIS <b>要</b>做 SLNB<br>的四種情況</td><td>① <b>需行全乳切除</b>（切了就補不回來）；② 切除位置會破壞日後前哨定位（中央／乳暈後、外上象限、腋尾，或大範圍腫瘤整形手術）；' +
      '③ 切片<b>已懷疑有侵襲或微侵襲</b>；④ <b>臨床與病理不相符</b>（例如可觸摸的大腫塊但報告只寫 DCIS）。' +
      '<br>來源：台大 p6 註 b；美國乳房外科醫學會（ASBrS）與 NCCN 之 DCIS 腋下處置原則。</td></tr>' +
      '<tr><td>LCIS</td><td>切除非必要、以追蹤為主（p7），<b>不做腋下分期</b>。多形性 LCIS 比照 DCIS 處理。</td></tr>' +
      '<tr><td>年長且低風險<br>（Choosing Wisely）</td><td>全部符合：<b>年齡 ≥70</b>、臨床腋下陰性（不需超音波）、<b>T1（≤2cm）</b>、<b>HR(+) 且 HER2(−)</b>、' +
      '<b>將接受內分泌治療</b>、接受乳房保留手術。<br>依據 <b>CALGB 9343</b>（≥70 歲、T1N0、ER(+)，lumpectomy + tamoxifen ± 放療；' +
      '12.6 年追蹤：10 年局部區域無復發 98% vs 90%，但<b>遠處轉移、乳癌死亡與整體存活皆無差異</b>）。' +
      '<b>若腋下結果會改變放療或全身治療決策，仍應個案考慮做腋下分期。</b></td></tr>' +
      '<tr><td>停經後、小腫瘤、<br>超音波陰性<br>（SOUND／INSEMA）</td><td><b>SOUND</b>（JAMA Oncol 2023）：腫瘤 ≤2cm、<b>術前腋下超音波陰性</b>、接受 BCS + 放療。' +
      '5 年無遠處疾病存活 98.0%（不做腋下手術）vs 97.7%（SLNB），達非劣性；<b>兩組腋下復發率皆 0.4%</b>。' +
      '值得注意的是：SLNB 組其實有 13.7% 淋巴結陽性，但<b>知不知道結果並未改變輔助治療的比例</b>。<br>' +
      '<b>INSEMA</b>（NEJM 2025）：影像 &lt;5cm、cN0/iN0、BCS + 全乳放療，5502 人。' +
      '族群以 HR(+)/HER2(−)（95.2%）、grade 1–2（96.4%）、中位年齡 62 歲為主。<br>' +
      '<b>ASCO 2025 據此把門檻從 ≥70 降到 ≥50</b>：需<b>七項全部符合</b>—— 停經後、年齡 ≥50、<b>術前腋下超音波陰性</b>、grade 1–2、' +
      '腫瘤 ≤2cm、HR(+) 且 HER2(−)、接受乳房保留手術＋放療。<br>' +
      '<b>台大指引尚未納入 SOUND／INSEMA，此屬院外實證</b>，採用前應經多專科討論並記錄。' +
      '小葉癌與其他組織型在兩個試驗中都偏少（12.7%／8.5%），應保守。</td></tr>' +
      '<tr><td>其他可省略者</td><td>預防性（風險降低）乳房切除 —— 意外發現癌症 &lt;5%、淋巴結轉移約 1%；乳房肉瘤／血管肉瘤／惡性葉狀腫瘤（走血行轉移）；' +
      '<b>預期壽命有限或腋下結果不會改變輔助治療</b>者 —— 這是上面所有條件背後真正的共同原則。</td></tr>' +
      '<tr><td><b>不可省略</b></td><td><b>三陰性與 HER2(+)</b>：淋巴結轉移率較高，且在 SOUND／INSEMA 中佔比極低（INSEMA 分別 1.2% 與 3.6%）。' +
      '小的 HER2(+) 腫瘤更是要靠淋巴結狀態決定走 APT 還是升階治療。<br>' +
      '<b>T1a／微侵襲不是省略的理由</b>——腫瘤小本身不夠，必須另外符合上面某一條。（INSEMA 中腫瘤 &lt;1cm 的次族群反而是唯一風險比偏向手術的一組。）<br>' +
      '<b>男性乳癌</b>：兩個試驗都沒收男性，不可外推。<br>' +
      '<b>grade 3、年齡 &lt;50、cT2 以上、小葉癌</b>：在驗證族群之外。<br>' +
      '<b>全乳切除的侵襲癌</b>、<b>cN(+)</b>、<b>發炎性乳癌</b>（SLNB 為禁忌，應做 ALND）。<br>' +
      '<b>術前化療之後</b>：省略腋下手術仍屬研究中，現階段應做 SLNB。<b>術前治療期間臨床惡化者不可只做 SLNB</b>（台大 p13）。</td></tr>' +
      '</table></details>';
  }

  function etResistDetails() {
    return '<details class="kps-details"><summary>內分泌抗性的定義 —— 兩套數字不要搞混 ▸</summary><table>' +
      '<tr><td>原發性抗性<br>primary</td><td><b>在輔助內分泌治療的前 2 年內復發</b>；或轉移期一線內分泌治療<b>開始後 6 個月內</b>進展（治療中）。' +
      '（不因是否併用 CDK4/6 抑制劑而改變。）</td></tr>' +
      '<tr><td>次發性抗性<br>secondary</td><td>其他情況，包括：輔助內分泌治療<b>滿 2 年之後</b>才復發（治療中）；轉移期一線內分泌治療<b>滿 6 個月後</b>才進展；' +
      '二線以後任何時間點進展；<b>以及已知有 ESR1 突變</b>。</td></tr>' +
      '<tr><td>內分泌不敏感<br>insensitivity</td><td>後線內分泌治療<b>2 個月內</b>即進展，且已無其他有意義的內分泌選項。' +
      '這是四種分類中<b>對臨床決策影響最大</b>的一種。</td></tr>' +
      '<tr><td>未曾使用<br>endocrine-naïve</td><td>從未接受過內分泌治療者；<b>實務上先當作敏感</b>，直到證明不是。</td></tr>' +
      '<tr><td><b>兩套數字</b></td><td>上面的 <b>2 年</b>是 ESO-ESMO ABC 共識（第 6／7 版，2024）用來分類抗性型別的界線，' +
      '目的主要是讓臨床試驗的族群可以互相比較。<br>' +
      '但<b>治療演算法（NCCN、ESMO）與藥證所用的界線是 12 個月</b>：「在輔助內分泌治療中進展，或完成後 12 個月內復發」' +
      '——符合這一條者，一線建議改為 <b>fulvestrant ＋ CDK4/6 抑制劑</b>（而非 AI ＋ CDK4/6）。' +
      '所以本步驟依<b>可執行的 12 個月界線</b>分組，抗性型別另行標註。<br>' +
      '<b>ABC 6/7 自己也提醒</b>：抗性與敏感是連續的，這些定義對臨床決策的用處其實有限。</td></tr>' +
      '<tr><td>台大指引</td><td><b>台大乳癌診療指引未收錄內分泌抗性的定義</b>；本表為院外共識，僅供分類參考。</td></tr>' +
      '</table></details>';
  }

  function z0011Box() {
    return '<div class="cbx"><div class="cbx-h">ACOSOG Z0011 可免除進一步腋下廓清之條件（p8）　<span class="cbx-sub">五項須全部符合</span></div>' +
      '<div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">a</span>cN0，前哨淋巴結僅 1–2 顆陽性</span>' +
      '<span class="cb"><span class="cb-k">b</span>T1–T2</span>' +
      '<span class="cb"><span class="cb-k">c</span>接受乳房保留手術且已規劃術後放療</span>' +
      '<span class="cb"><span class="cb-k">d</span>有足量的輔助全身治療</span>' +
      '<span class="cb"><span class="cb-k">e</span>尤其是 ER(+) 者</span>' +
      '</div>' +
      '<div class="note" style="margin-top:7px"><b>Z0011 不適用的情境</b>：可觸摸到的腋下病灶、超過 2 顆前哨淋巴結陽性、<b>全乳切除</b>、未做全乳放療、' +
      '以及<b>接受過術前化療者</b> — 這些族群省略腋下廓清的安全性未被證實。<b>微轉移（≤2mm）不是 Z0011 的族群</b>，其證據來自 IBCSG 23-01。</div></div>';
  }

  /* ==========================================================
     追蹤區塊（p27、p37）
     ========================================================== */
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
        '<li><b>不建議</b>常規追蹤腫瘤標記。</li>' +
        '<li>服用 tamoxifen 且子宮存在者，<b>每年婦科評估</b>；服用 AI 者建議<b>定期骨密度檢查</b>（健保項目 33064B 有給付，見治療建議內之給付表）。</li>' +
        '<li>實際追蹤策略由醫病討論後決定（at the discretion of physician-patient discussion）。</li>' +
        '<li>追蹤中發現復發 → 回步驟 1 選擇「局部／區域復發」或「轉移性乳癌」。</li>' +
        '</ul>';
    } else if (type === 'dcis') {
      h = '<div class="fu-label">追蹤原則 · 原位癌（p27）</div><ul class="fu-list">' +
        '<li>門診追蹤每 3–6 個月共 5 年，之後每年一次；<b>每年乳房影像為必要</b>。</li>' +
        '<li>DCIS <b>完全不做全身分期</b>（CT／PET／bone scan 皆不考慮，p3）。</li>' +
        '<li>服用 tamoxifen 者每年婦科評估。</li>' +
        '<li>若日後發現侵襲性復發 → 依侵襲癌流程重新評估。</li>' +
        '</ul>';
    } else if (type === 'inop') {
      h = '<div class="fu-label">追蹤與再評估</div><ul class="fu-list">' +
        '<li>治療期間<b>每次回診評估腫瘤反應</b>（p12）；反應良好且體能改善者，<b>重新評估手術可行性</b>。</li>' +
        '<li>影像追蹤依臨床需要安排；不常規追蹤腫瘤標記。</li>' +
        '<li>持續進展 → 依進展性／轉移性疾病處理。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care（p27、p37）</div><ul class="fu-list">' +
        '<li>定期評估治療反應與毒性；疾病進展 → 次線／後線治療或臨床試驗。</li>' +
        '<li>轉移期<b>不常規以腫瘤標記追蹤</b>；影像檢查依臨床需要安排。</li>' +
        '<li>骨轉移者評估骨骼保護用藥與骨骼相關事件之預防。</li>' +
        '<li>末期病人：<b>安寧緩和照護，照會安寧共同照護團隊</b>（依安寧緩和醫療條例）。</li>' +
        '<li>最終治療決定仍取決於病人與醫師之討論。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  /* ==========================================================
     互動 helpers
     ========================================================== */
  function bcSel(btn) {
    var sel = btn.classList.contains('tn-cell') ? '.tn-cell' : '.flow-opt';
    var g = btn.parentNode;
    g.querySelectorAll(sel).forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function bcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function bcClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ulRec(id, cls, title, lines, note, extra) {
    var el = document.getElementById(id);
    if (!el) return;
    // className 直接覆寫會把 bcShow() 加上的 hidden 一起洗掉，
    // 建議色塊就會在還不該出現的時候先冒出來（此處曾中招）。
    var wasHidden = el.classList.contains('hidden');
    el.className = 'flow-rec ' + cls + (wasHidden ? ' hidden' : '');
    var label = el.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置 Recommendation';
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (extra || '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }
  function result(recId, fuId, cls, title, lines, note, fuType, extra) {
    ulRec(recId, cls, title, lines, note, extra);
    renderFollowup(fuId, fuType);
  }
  function idleRec(recId, fuId, title) {
    ulRec(recId, 'rec-idle', title, [], '');
    renderFollowup(fuId, null);
  }

  /* ==========================================================
     版面 HTML
     ========================================================== */
  function breastPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院乳癌診療指引</b>（NTUH，版次 14／2023.V1；2026/06/16 癌症醫療委員會檢視通過；' +
      'base on 2023 NCCN、2023 St. Gallen consensus、ABC6 與新近試驗結果）之互動決策流程，' +
      '步驟順序依<b>臨床決策實際發生的先後</b>編排：影像發現 →（病理 + cTNM）→ 先開刀或先做術前治療 → 怎麼開 → 術後放療與輔助治療 → 復發／轉移。' +
      '<b>健保未給付之藥物於文中標註</b>；引用之指引頁碼標於各建議下方。</p>';
    h += '<div class="onc-path" id="bcPath">';

    /* ---------- 步驟 1 ---------- */
    h += step('bc_s1', '1', '目前處在哪一步？',
      opt('scope', 'dx', '影像發現異常，尚未確診', '乳房攝影微鈣化／超音波腫塊 → 切片與檢查') +
      opt('scope', 'dcis', '原位管癌 DCIS（Tis N0M0）', '含柏哲德氏病無侵襲成分者') +
      opt('scope', 'lcis', '小葉原位癌 LCIS', 'Lobular carcinoma in situ') +
      opt('scope', 'ebc', '侵襲性乳癌 · 無遠處轉移（M0）', '管、小葉、混合、化生型（含 micropapillary、medullary）— 從初始策略走到輔助治療') +
      opt('scope', 'prog', '治療中進展 或 治療後早期復發', '術前化療中惡化；輔助化療／內分泌／抗 HER2／CDK4/6 治療期間或剛結束就復發') +
      opt('scope', 'mbc', '轉移性乳癌（M1）', 'Advanced / Metastatic Breast Cancer — 一線與後線') +
      opt('scope', 'recur', '局部／區域復發', 'Local / regional recurrence（無遠處轉移）'));

    /* ===================== A. 影像 → 診斷 ===================== */
    h += '<div id="bc_dx" class="hidden">';
    h += conn('bc_dx1');
    h += step('bc_s_dx', '2', '影像發現的型態',
      opt('img', 'im_calc', '乳房攝影：微鈣化（無明顯腫塊）', 'Suspicious microcalcifications') +
      opt('img', 'im_mass', '超音波／觸診：腫塊', 'Mass on ultrasound or palpation') +
      opt('img', 'im_skin', '皮膚變化：紅腫、橘皮、潰瘍', '需排除發炎性乳癌') +
      opt('img', 'im_axilla', '以腋下腫塊表現、乳房未見原發灶', 'Axillary presentation, occult primary'));
    h += rec('bc_dx_rec', '建議處置 · 診斷與檢查（p1、p2、p3、p4、p5）');
    h += '<div class="flow-fu hidden" id="bc_dx_fu"></div>';
    h += '</div>';

    /* ===================== B. DCIS ===================== */
    h += '<div id="bc_dcis" class="hidden">';
    h += conn('bc_dc1');
    h += step('bc_s_dcis', '2', '局部治療方式（p6）',
      opt('dloc', 'd_bct', '乳房保留手術 BCT', '之後依 VNPI 或 E5194 條件決定是否放療') +
      opt('dloc', 'd_sm', '全乳切除 SM(TM) ± SLNB ± 重建', '腫瘤過大／多發、VNPI 10–12 分或病人選擇'),
      omitAxDetails());
    h += connH('bc_dc2');
    h += step('bc_s_dmar', '3', '乳房保留手術之切緣（p6）',
      opt('dmar', 'dm_neg', '切緣乾淨', '') +
      opt('dmar', 'dm_close', '切緣過近或陽性', '→ 再切除（re-excision），除非為深部或表淺切緣'));
    h = h.replace('id="bc_s_dmar"', 'id="bc_s_dmar" class="hidden"');
    h += rec('bc_dcis_rec', '建議處置 · 原位管癌 DCIS');
    h += '<div class="flow-fu hidden" id="bc_dcis_fu"></div>';
    h += '</div>';

    /* ===================== C. LCIS ===================== */
    h += '<div id="bc_lcis" class="hidden">';
    h += conn('bc_lc1');
    h += rec('bc_lcis_rec', '建議處置 · 小葉原位癌 LCIS（p7）');
    h += '<div class="flow-fu hidden" id="bc_lcis_fu"></div>';
    h += '</div>';

    /* ===================== D. 侵襲癌 M0（主線）===================== */
    h += '<div id="bc_ebc" class="hidden">';

    // 步驟 2：亞型
    h += conn('bc_e1');
    h += step('bc_s2', '2', '生物亞型（依切片之 ER／PR、HER2；p2、p16）',
      opt('sub', 'her2hr', 'HR(+) / HER2(+)', 'Luminal B（HER2 陽性）— 化療＋抗 HER2＋內分泌') +
      opt('sub', 'her2', 'HR(−) / HER2(+)', 'HER2-enriched — NACT 門檻最低（≥T1cN0）') +
      opt('sub', 'erpos', 'HR(+) / HER2(−)', 'Luminal — 多數以內分泌為主軸') +
      opt('sub', 'tnbc', 'HR(−) / HER2(−)（TNBC）', '三陰性'),
      '<div class="cbx"><div class="cbx-h">HER2 判讀原則（p2）</div><div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">IHC 0–1+</span>陰性，通常不做 FISH</span>' +
      '<span class="cb"><span class="cb-k">IHC 2+</span><b>須做 FISH</b></span>' +
      '<span class="cb"><span class="cb-k">IHC 3+</span>陽性，不需 FISH</span>' +
      '</div></div>' +
      '<div class="note"><b>ER 陽性的門檻（p23）</b>：1% ≤ ER &lt; 10% → <b>±</b> 使用內分泌治療（此族群行為多接近 ER(−)，' +
      '本流程請視臨床判斷選 HR(+) 或 HR(−) 分支）；ER &lt; 1% → 不使用內分泌治療；ER(−) 但 PR &gt; 10% → ± 使用。<br>' +
      '<b>NACT 之後，手術檢體會重複做 ER／PR／HER2 染色</b>（p2）— 亞型可能改變，後續輔助治療應以術後結果為準。' +
      favHistoDetails() + '</div>');

    // 步驟 3：cT×cN 格（四張，依亞型顯示其一）
    h += connH('bc_e2');
    h += step('bc_s3', '3', '臨床分期 cT×cN → 先開刀還是先做全身治療？',
      '',
      '<div id="bc_ctn_her2hr" class="hidden">' + ctnGridHtml('her2hr') + '</div>' +
      '<div id="bc_ctn_her2" class="hidden">' + ctnGridHtml('her2') + '</div>' +
      '<div id="bc_ctn_erpos" class="hidden">' + ctnGridHtml('erpos') + '</div>' +
      '<div id="bc_ctn_tnbc" class="hidden">' + ctnGridHtml('tnbc') + '</div>');
    h = h.replace('id="bc_s3"', 'id="bc_s3" class="hidden"');

    h += '<div class="flow-rec rec-idle hidden" id="bc_strat_rec"><div class="rec-label">建議處置 · 初始治療策略</div><div class="rec-title">請完成上方步驟</div></div>';

    // 步驟 4：實際採取的策略
    h += connH('bc_e3');
    h += step('bc_s4', '4', '實際採取的初始治療',
      opt('strat', 'up', '直接手術 Upfront surgery', '術後再依病理分期決定輔助治療') +
      opt('strat', 'nact', '術前輔助治療（NACT／NAHT）→ 再手術', '含降期以行乳房保留手術、降期腋下') +
      opt('strat', 'noop', '不適合手術 或 局部無法切除', '體能不佳、共病、或局部晚期無法切除'),
      '<div class="note"><b>術前治療開始前必做（p12）</b>：與停經前女性<b>討論生育議題</b>並轉介婦產科考慮凍卵／胚胎保存；' +
      '<b>腫瘤床至少置放 1 個 clip 標記</b>；<b>詳細評估腋下淋巴結</b>，臨床陽性者若可行則於治療前 clip 標記該顆淋巴結' +
      '（<b>現行 clip 多無法以超音波辨識，需乳房攝影導引針定位</b>）；選擇性乳房 MRI。治療中<b>每次回診評估腫瘤反應</b>。' +
      '治療後可行則做乳房保留手術＋適當腋下分期，否則全乳切除＋適當腋下分期。</div>');
    h = h.replace('id="bc_s4"', 'id="bc_s4" class="hidden"');

    // 步驟 5（NACT 分支）：治療中反應
    h += connH('bc_e4n');
    h += step('bc_s5n', '5', '術前治療期間的反應（p12、p13）',
      opt('nresp', 'na_resp', '有反應或穩定 → 完成療程後手術', '') +
      opt('nresp', 'na_pd', '治療中臨床惡化（clinical PD）', '腫瘤變大、腋下新病灶或出現遠處轉移'));
    h = h.replace('id="bc_s5n"', 'id="bc_s5n" class="hidden"');
    h += '<div class="flow-rec rec-idle hidden" id="bc_na_rec"><div class="rec-label">建議處置 · 術前輔助治療處方</div><div class="rec-title">請完成上方步驟</div></div>';

    // 步驟 6：乳房手術方式
    h += connH('bc_e5');
    h += step('bc_s6', '6', '乳房手術方式（p8、p10、p11）',
      opt('surg', 'sg_bct', '乳房保留手術 BCT + 全乳放療', '可行時優於全乳切除；切緣定義為 no ink on invasive tumor or DCIS') +
      opt('surg', 'sg_sm', '全乳切除 SM ± 重建', '腫瘤／乳房比例不利、多中心病灶、無法放療、或病人選擇'),
      '<div class="note"><b>手術原則（p8）</b>：<b>多數 cStage I／II 以直接手術為主</b>；可行時<b>乳房保留手術優於全乳切除</b>，' +
      '尤其第 I 期，但應尊重病人意願；BCT 後<b>全乳放療為必要</b>。BCT 的陰性切緣定義為「<b>no ink on invasive tumor or DCIS</b>」。<br>' +
      '<b>不做乳房保留者（p10）</b>：SM + ALND／SLND；若 <b>pN2 或切緣(+) 則加放療</b>。<b>做乳房保留者</b>：BCT + SLND／ALND + 放療；' +
      '有化療指徵時<b>放療之後接化療</b>。<br>' +
      '<b>對側預防性乳房切除（p9）</b>：單側乳癌而對側乳房正常，病人因自身焦慮希望同時切除正常側時，' +
      '<b>應優先切除罹癌側，並照會精神科</b>，建議病人考慮 3~6 個月；若極度焦慮無法等待 3 個月，' +
      '<b>必須在精神科醫師同意的狀況下才執行手術</b>。</div>');
    h = h.replace('id="bc_s6"', 'id="bc_s6" class="hidden"');

    // 步驟 7u：腋下（直接手術）
    h += connH('bc_e6u');
    h += step('bc_s7u', '7', '腋下處置與前哨淋巴結結果 · 直接手術（p8、p10、p15、p48）',
      opt('ax', 'ax_omit', '未做腋下手術', '純 DCIS 之 BCS、LCIS，或年長低風險族群（見下表）') +
      opt('ax', 'ax_neg', 'cN0 → SLNB：pN0(sn)（含 ITC）', '前哨陰性') +
      opt('ax', 'ax_mi', 'cN0 → SLNB：pN1mi(sn) 微轉移', '>0.2mm 或 >200 細胞且 ≤2mm') +
      opt('ax', 'ax_z11', 'cN0 → SLNB：1–2 顆巨轉移，<b>符合</b> Z0011', '') +
      opt('ax', 'ax_noz', 'cN0 → SLNB：1–2 顆巨轉移，<b>不符合</b> Z0011', '如全乳切除、T3、未規劃放療') +
      opt('ax', 'ax_3', 'cN0 → SLNB：≥3 顆陽性', '') +
      opt('ax', 'ax_cnpos', 'cN(+) 術前已證實（FNA）→ ALND', '術前對可疑淋巴結應先做 FNA'),
      z0011Box() + omitAxDetails());
    h = h.replace('id="bc_s7u"', 'id="bc_s7u" class="hidden"');

    // 步驟 7n：腋下（NACT 後）
    h += connH('bc_e6n');
    h += step('bc_s7n', '7', 'NACT 後的腋下分期（p13、p14）',
      opt('ax', 'na_cn0_neg', '治療前 cN0 → 術後 SLNB 陰性 ypN0(sn)', '不需 ALND') +
      opt('ax', 'na_cn0_pos', '治療前 cN0 → 術後 SLNB 陽性', '含 ypN1mi 與 ypN0(i+) — 均須後續 ALND') +
      opt('ax', 'na_ycn0_neg', '治療前 cN1-2 → ycN0 → SLNB／TAD 陰性', '足量前哨即可免 ALND') +
      opt('ax', 'na_ycn0_pos', '治療前 cN1-2 → ycN0 → SLNB／TAD 陽性', '') +
      opt('ax', 'na_ycn1', '治療前 cN1-2 → 仍 ycN(+)', '直接 ALND'),
      '<div class="cbx"><div class="cbx-h">「足量前哨淋巴結」的定義（p14 註 #）　<span class="cbx-sub">符合其一</span></div>' +
      '<div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">1</span>雙示蹤劑（dual tracer）且取出 ≥3 顆淋巴結</span>' +
      '<span class="cb"><span class="cb-k">2</span>SLNB + 標記淋巴結摘除（targeted node removal，TAD）</span>' +
      '</div>' +
      '<div class="note" style="margin-top:7px"><b>p13 原文</b>：cN0 者可術前 SLNB，或於 NACT 後單做 SLNB —— <b>除非治療中臨床惡化（PD）</b>。' +
      'cN(+) 接受 NACT 者：若降為 ycN0，可單做 SLND（需雙示蹤劑且取 ≥3 顆），' +
      '若治療前已 clip 標記淋巴結則<b>取出標記淋巴結 + SLND（不論顆數）</b>；' +
      '<b>任一顆陽性（含 pNmi 與 pN0(i+)）即須後續 ALND</b>。若仍 ycN(+) → ALND。<br>' +
      '<b>與 Z0011 的差別</b>：Z0011 的「1–2 顆陽性可免 ALND」<b>不適用於接受過術前化療者</b>；NACT 後只要有殘存腫瘤細胞就要 ALND。<br>' +
      '<b>為什麼要求「足量前哨」</b>：術前化療後對原本 cN(+) 的腋下做 SLNB，偽陰性率超過 10%；' +
      '取出<b>治療前標記的那顆淋巴結</b>、用<b>雙示蹤劑</b>、取到 <b>≥3 顆</b>，三者都能把偽陰性率壓下來（ACOSOG Z1071 與 TAD 相關研究）。<br>' +
      '<b>要估算殘存非前哨淋巴結的機率？</b>已有納入<b>治療前 cN 分期（N1 vs N2/3）、乳房是否達 pCR、陽性前哨顆數</b>之 nomogram' +
      '（Cheng M et al. J Surg Oncol 2020，見下方文獻列表）。<b>是討論用的輔助工具，不取代 p14 的規則</b> —— 台大的規則仍是「任一顆陽性即做 ALND」。</div></div>');
    h = h.replace('id="bc_s7n"', 'id="bc_s7n" class="hidden"');

    h += '<div class="flow-rec rec-idle hidden" id="bc_ax_rec"><div class="rec-label">建議處置 · 腋下手術與局部治療</div><div class="rec-title">請完成上方步驟</div></div>';

    // 步驟 8u：術後病理格
    h += connH('bc_e7u');
    h += step('bc_s8u', '8', '術後病理分期 pT×pN → 輔助全身治療', '',
      '<div id="bc_ptn_her2hr" class="hidden">' + ptnGridHtml('her2hr') + '</div>' +
      '<div id="bc_ptn_her2" class="hidden">' + ptnGridHtml('her2') + '</div>' +
      '<div id="bc_ptn_erpos" class="hidden">' + ptnGridHtml('erpos') + '</div>' +
      '<div id="bc_ptn_tnbc" class="hidden">' + ptnGridHtml('tnbc') + '</div>');
    h = h.replace('id="bc_s8u"', 'id="bc_s8u" class="hidden"');

    // 步驟 8n：NACT 後病理反應
    h += connH('bc_e7n');
    h += step('bc_s8n', '8', '術後病理反應（p18、p20、p21）',
      opt('resp', 'pcr', '病理完全緩解 pCR', '乳房與腋下皆無殘存侵襲癌（ypT0/is ypN0）') +
      opt('resp', 'nonpcr', '殘存病灶 non-pCR', '乳房或腋下仍有殘存侵襲癌'));
    h = h.replace('id="bc_s8n"', 'id="bc_s8n" class="hidden"');

    h += '<div class="flow-rec rec-idle hidden" id="bc_adj_rec"><div class="rec-label">建議處置 · 輔助治療與放射治療</div><div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="bc_adj_fu"></div>';
    h += '</div>'; // bc_ebc

    /* ===================== E. 治療中進展／治療後早期復發 ===================== */
    h += '<div id="bc_prog" class="hidden">';
    h += conn('bc_pg1');
    h += step('bc_s_pg', '2', '在哪一種治療當中（或剛結束）出現進展？',
      opt('pg', 'pg_nact', '術前化療（NACT）進行中臨床惡化', '腫瘤變大、腋下新病灶') +
      opt('pg', 'pg_chemo', '輔助化療進行中或剛結束即出現轉移', '含術前化療後已手術、輔助期出現遠處病灶') +
      opt('pg', 'pg_et', '輔助內分泌治療期間或結束後復發', '需先判定原發性或次發性內分泌抗性') +
      opt('pg', 'pg_her2', '輔助抗 HER2 治療期間或結束 12 個月內復發', '') +
      opt('pg', 'pg_cdk', '輔助 CDK4/6 抑制劑（abemaciclib／ribociclib）期間或結束後復發', ''));
    h += connH('bc_pg2');
    h += step('bc_s_pget', '3', '復發與輔助內分泌治療的時間關係',
      opt('pget', 'et_on', '<b>仍在</b>輔助內分泌治療中復發', '不論已服用幾年') +
      opt('pget', 'et_le12', '完成輔助內分泌治療後 <b>≤12 個月</b>復發', '') +
      opt('pget', 'et_gt12', '完成輔助內分泌治療後 <b>&gt;12 個月</b>才復發', '一般視為對內分泌治療仍敏感'),
      etResistDetails());
    h = h.replace('id="bc_s_pget"', 'id="bc_s_pget" class="hidden"');
    h += rec('bc_prog_rec', '建議處置 · 治療中進展／治療後早期復發');
    h += '<div class="flow-fu hidden" id="bc_prog_fu"></div>';
    h += '</div>';

    /* ===================== F. 轉移性（M1）===================== */
    h += '<div id="bc_mbc" class="hidden">';
    h += conn('bc_m1');
    h += step('bc_s_msub', '2', '生物亞型（p37）',
      opt('msub', 'm_erpos', 'HR(+) HER2(−)', '內分泌治療優先，除非 visceral crisis 或快速惡化') +
      opt('msub', 'm_her2', 'HER2(+)', '抗 HER2 藥物須與化療併用') +
      opt('msub', 'm_tnbc', 'TNBC（HR(−) HER2(−)）', '化療為主軸，一線可加免疫治療'),
      '<div class="note"><b>晚期／轉移性乳癌總則（p37）</b>：依 ABC 與 NCCN 指引，<b>HR(+) 者應先用內分泌治療</b>，' +
      '除非有 <b>visceral crisis</b> 或快速惡化；化療以<b>循序單一藥物優於合併化療</b>；' +
      'HER2(+) 者抗 HER2 藥物<b>應與化療併用</b>；末期病人應轉介安寧緩和照護與安寧共同照護團隊。<br>' +
      '<b>轉移期化療的三個原則（p43）</b>：① 所有早期乳癌的處方（合併或其中單一藥物）皆可於轉移時使用；' +
      '② 僅在<b>已知抗藥（如快速復發）或 anthracycline 已達累積劑量</b>時才不適用；' +
      '③ 因轉移無法治癒，劑量會依病人最佳臨床利益比調整，<b>不強求建議劑量</b>。<br>' +
      '<b>轉移病灶應盡可能重新切片</b>確認 ER／PR／HER2 — 亞型可能與原發灶不同。</div>');
    h += connH('bc_m2');
    h += step('bc_s_mcrisis', '3', 'HR(+)：一線可否用內分泌治療（p37、p38）',
      opt('mcrisis', 'mc_no', '無 visceral crisis、無快速惡化', '→ 內分泌治療 ± CDK4/6 抑制劑') +
      opt('mcrisis', 'mc_yes', '有 visceral crisis 或快速惡化', '→ 先化療控制，之後再轉回內分泌治療'));
    h = h.replace('id="bc_s_mcrisis"', 'id="bc_s_mcrisis" class="hidden"');
    h += rec('bc_mbc_rec', '建議處置 · 轉移性乳癌（M1）');
    h += '<div class="flow-fu hidden" id="bc_mbc_fu"></div>';
    h += '</div>';

    /* ===================== G. 局部／區域復發 ===================== */
    h += '<div id="bc_recur" class="hidden">';
    h += conn('bc_r1');
    h += step('bc_s_rsite', '2', '復發的位置與初始治療方式（p36）',
      opt('rsite', 'r_bctrt', '單純局部復發 · 初始為 BCT + 放療', 'Local recurrence only') +
      opt('rsite', 'r_bctlndrt', '單純局部復發 · 初始為 BCT + 淋巴結廓清 + 放療', '') +
      opt('rsite', 'r_nort', '單純局部復發 · 初始為 BCT 或全乳切除、<b>未</b>放療', '') +
      opt('rsite', 'r_ax', '腋下復發 Axillary', '區域復發，或局部＋區域復發') +
      opt('rsite', 'r_scf', '鎖骨上復發 Supraclavicular', '') +
      opt('rsite', 'r_imn', '內乳淋巴結復發 Internal mammary', ''),
      '<div class="note">復發時應<b>重新取得組織診斷並重測 ER／PR／HER2</b>，並完成分期檢查以排除同時存在的遠處轉移' +
      '（若有遠處轉移 → 回步驟 1 選「轉移性乳癌」）。</div>');
    h += rec('bc_recur_rec', '建議處置 · 局部／區域復發');
    h += '<div class="flow-fu hidden" id="bc_recur_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="bcReset()">重置</button></div>';
    h += '</div>'; // bcPath
    return h;
  }

  /* ==========================================================
     主渲染
     ========================================================== */
  function bcRender() {
    var s = bcSt;

    bcShow('bc_dx', s.scope === 'dx'); bcShow('bc_dx1', s.scope === 'dx');
    bcShow('bc_dcis', s.scope === 'dcis'); bcShow('bc_dc1', s.scope === 'dcis');
    bcShow('bc_lcis', s.scope === 'lcis'); bcShow('bc_lc1', s.scope === 'lcis');
    bcShow('bc_ebc', s.scope === 'ebc'); bcShow('bc_e1', s.scope === 'ebc');
    bcShow('bc_prog', s.scope === 'prog'); bcShow('bc_pg1', s.scope === 'prog');
    bcShow('bc_mbc', s.scope === 'mbc'); bcShow('bc_m1', s.scope === 'mbc');
    bcShow('bc_recur', s.scope === 'recur'); bcShow('bc_r1', s.scope === 'recur');

    /* --- A 診斷 --- */
    renderDxRec();

    /* --- B DCIS：只有乳房保留手術才問切緣 --- */
    var showMar = (s.scope === 'dcis' && s.dloc === 'd_bct');
    bcShow('bc_dc2', showMar); bcShow('bc_s_dmar', showMar);
    renderDcisRec();
    renderLcisRec();

    /* --- D 侵襲癌主線 --- */
    if (s.scope === 'ebc') {
      // 步驟 3：依亞型顯示對應的 cT×cN 格
      var hasSub = !!s.sub;
      bcShow('bc_e2', hasSub); bcShow('bc_s3', hasSub);
      ['her2hr', 'her2', 'erpos', 'tnbc'].forEach(function (k) {
        bcShow('bc_ctn_' + k, hasSub && s.sub === k);
        bcShow('bc_ptn_' + k, s.sub === k);
      });
      bcShow('bc_strat_rec', hasSub && !!s.ctn);
      renderStratRec();

      // 步驟 4：選了格子才問實際策略
      var showS4 = hasSub && !!s.ctn;
      bcShow('bc_e3', showS4); bcShow('bc_s4', showS4);

      var isNact = s.strat === 'nact';
      var isUp = s.strat === 'up';
      var isNoop = s.strat === 'noop';

      // 步驟 5（僅 NACT）：治療中反應
      bcShow('bc_e4n', isNact); bcShow('bc_s5n', isNact);
      bcShow('bc_na_rec', isNact);
      renderNaRec();

      // 步驟 6：手術方式 —— 直接手術者；或 NACT 有反應者
      var toSurg = isUp || (isNact && s.nresp === 'na_resp');
      bcShow('bc_e5', toSurg); bcShow('bc_s6', toSurg);

      // 步驟 7：腋下（兩組選項擇一）
      var showAxU = isUp && !!s.surg;
      var showAxN = isNact && s.nresp === 'na_resp' && !!s.surg;
      bcShow('bc_e6u', showAxU); bcShow('bc_s7u', showAxU);
      bcShow('bc_e6n', showAxN); bcShow('bc_s7n', showAxN);
      bcShow('bc_ax_rec', (showAxU || showAxN) && !!s.ax);
      renderAxRec();

      // 步驟 8：術後病理
      var showPtn = showAxU && !!s.ax;
      var showResp = showAxN && !!s.ax;
      bcShow('bc_e7u', showPtn); bcShow('bc_s8u', showPtn);
      bcShow('bc_e7n', showResp); bcShow('bc_s8n', showResp);
      bcShow('bc_adj_rec', isNoop || showPtn || showResp);
      renderAdjRec(isNoop, showPtn, showResp);
    } else {
      // 離開侵襲癌分支時，把它底下的建議色塊一併收起來
      bcShow('bc_strat_rec', false); bcShow('bc_na_rec', false);
      bcShow('bc_ax_rec', false); bcShow('bc_adj_rec', false);
    }

    /* --- E 治療中進展：只有內分泌那條需要再問時間點 --- */
    var showPget = (s.scope === 'prog' && s.pg === 'pg_et');
    bcShow('bc_pg2', showPget); bcShow('bc_s_pget', showPget);
    renderProgRec();

    /* --- F 轉移性：只有 HR(+) 需要問 visceral crisis --- */
    var showCrisis = (s.scope === 'mbc' && s.msub === 'm_erpos');
    bcShow('bc_m2', showCrisis); bcShow('bc_s_mcrisis', showCrisis);
    renderMbcRec();

    /* --- G 局部／區域復發 --- */
    renderRecurRec();
  }

  /* ==========================================================
     A. 影像 → 診斷（p1–p5）
     ========================================================== */
  function workupBox() {
    return '<div class="cbx"><div class="cbx-h">侵襲性乳癌之基本檢查 WORK-UP（p1）</div><div class="cbx-items">' +
      '<span class="cb">病史與理學檢查</span>' +
      '<span class="cb">CBC／DC</span>' +
      '<span class="cb">肝功能（<b>含 ALP</b>）</span>' +
      '<span class="cb">腎功能</span>' +
      '<span class="cb"><span class="cb-k">必要</span>雙側診斷性乳房攝影（stage 0~III）</span>' +
      '<span class="cb">超音波（必要時）</span>' +
      '<span class="cb"><span class="cb-k">首選</span>組織診斷 — core biopsy</span>' +
      '<span class="cb">切片或手術檢體之 ER／PR／HER2</span>' +
      '</div></div>';
  }
  function stagingBox() {
    return '<div class="cbx"><div class="cbx-h">全身分期檢查的取捨（p3）　<span class="cbx-sub">systemic staging = CT／MRI、PET 或 bone scan</span></div>' +
      '<div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">不做</span>T1-3 N(−)：不常規做</span>' +
      '<span class="cb"><span class="cb-k">例外</span>有相關症狀</span>' +
      '<span class="cb"><span class="cb-k">例外</span>檢驗或理學檢查異常</span>' +
      '<span class="cb"><span class="cb-k">不特別</span>cN0、pT1-2N1M0（Z0011）</span>' +
      '<span class="cb"><span class="cb-k">強烈考慮</span>cT3N1</span>' +
      '<span class="cb"><span class="cb-k">強烈考慮</span>cTanyN2、cTanyN3</span>' +
      '<span class="cb"><span class="cb-k">強烈考慮</span>cT4Nany</span>' +
      '<span class="cb"><span class="cb-k">強烈考慮</span>病理分期 III</span>' +
      '<span class="cb"><span class="cb-k">完全不做</span>DCIS</span>' +
      '</div><div class="note" style="margin-top:7px">最終決定仍由主治醫師判斷（final decision at attending physician’s discretion）。</div></div>';
  }
  function geneticDetails() {
    return '<details class="kps-details"><summary>遺傳諮詢與 gBRCA1/2 檢測適應症（p4、p5）▸</summary><table>' +
      '<tr><td>何時考慮<br>遺傳諮詢</td><td><b>家族史</b>、<b>雙側乳癌</b>、或<b>發病年齡極輕（&lt;35 歲）</b></td></tr>' +
      '<tr><td>家族史之定義<br>（符合任一）</td><td>' +
      '(1) ≥3 名女性家族成員罹患乳癌（年齡不限）<br>' +
      '(2) ≥2 名女性家族成員罹患乳癌，其中一人確診時 ≤50 歲<br>' +
      '(3) ≥1 名女性家族成員確診乳癌，且有一名家族成員確診卵巢癌（可為同一人）<br>' +
      '(4) ≥1 名女性家族成員 &lt;35 歲確診乳癌<br>' +
      '(5) ≥1 名女性家族成員確診雙側乳癌（第一個乳癌確診時需 &lt;50 歲）<br>' +
      '(6) ≥1 名女性家族成員確診卵巢癌（確診時需 &lt;40 歲）<br>' +
      '(7) ≥2 名女性家族成員確診卵巢癌（年齡不限）<br>' +
      '(8) ≥1 名男性家族成員確診乳癌（年齡不限）</td></tr>' +
      '<tr><td>gBRCA1/2 或<br>遺傳基因套組</td><td>符合上述遺傳諮詢條件者；或<b>可能受益於 PARP 抑制劑</b>者 —<br>' +
      '<b>早期乳癌</b>：HER2(−) 且為第 II／III 期、符合 OlympiA 試驗條件者<br>' +
      '<b>晚期乳癌</b>：HER2(−) 且曾於術前、術後或轉移期接受過化療者</td></tr>' +
      '</table></details>';
  }

  function renderDxRec() {
    var s = bcSt;
    if (s.scope !== 'dx') return;
    var R = 'bc_dx_rec', F = 'bc_dx_fu';
    if (!s.img) { idleRec(R, F, '請選擇步驟 2（影像發現的型態）'); return; }

    var lines = [];
    if (s.img === 'im_calc') {
      lines.push('<span class="rx-h">微鈣化 · 取得組織診斷</span>　<span class="rx-sub">p1</span>');
      lines.push('影像判讀為 <b>BI-RADS 4 或 5</b> 之可疑微鈣化 → 取<b>組織診斷</b>，<b>core biopsy 為首選</b>。' +
        '單純鈣化在超音波下常看不到，通常需<b>立體定位（stereotactic）／乳房攝影導引</b>切片，多以真空輔助切片（VAB）取得足量檢體。');
      lines.push('<b>切片當下留下標記 clip</b>，並以<b>標本 X 光</b>確認取到目標鈣化 —— 否則後續無法定位，也無從判斷是否取樣失準。');
      lines.push('BI-RADS 3（可能良性）者以<b>短期追蹤</b>為主；BI-RADS 0 者需補做加壓放大攝影或超音波再判讀。' +
        '（BI-RADS 分類屬 ACR 系統，非台大乳癌診療指引之內容。）');
    } else if (s.img === 'im_mass') {
      lines.push('<span class="rx-h">腫塊 · 取得組織診斷</span>　<span class="rx-sub">p1</span>');
      lines.push('<b>超音波導引粗針切片（core biopsy）為首選</b>；細針抽吸（FNA）不足以判定侵襲性與做完整 ER／PR／HER2 判讀，' +
        '故 FNA 主要用於<b>可疑淋巴結</b>的術前確認（p10 註 b），不用於原發腫瘤的確診。');
      lines.push('必做<b>雙側診斷性乳房攝影</b>（stage 0~III 為必要），必要時加超音波。');
      lines.push('<b>同時仔細評估腋下</b>：術前對可疑淋巴結應做 FNA —— 這一步決定的是「cN0 走 SLNB、cN(+) 走 ALND」，是後面所有腋下決策的起點（p8、p10）。');
    } else if (s.img === 'im_skin') {
      lines.push('<span class="rx-h">皮膚變化 · 先排除發炎性乳癌</span>　<span class="rx-sub">p1、p9、p11</span>');
      lines.push('<b>乳房病灶 core biopsy</b> ＋ <b>受累皮膚之 punch biopsy</b>（找真皮淋巴管栓 dermal lymphatic invasion）。');
      lines.push('<b>發炎性乳癌（T4d）屬局部晚期</b> — 一律<b>先做全身治療</b>，且<b>不做乳房保留手術</b>；' +
        '應完成全身分期檢查（cT4Nany 為強烈考慮之族群，p3）。');
      lines.push('皮膚潰瘍、同側衛星結節、皮膚水腫（含橘皮）屬 <b>T4b</b>；侵犯胸壁屬 <b>T4a</b>（僅侵犯 pectoral fascia 不算）。');
    } else {
      lines.push('<span class="rx-h">以腋下腫塊表現、乳房未見原發灶</span>　<span class="rx-sub">p1、p3</span>');
      lines.push('<b>腋下淋巴結 core biopsy</b>，並做 ER／PR／HER2 與乳房來源之免疫染色，以確認是乳癌轉移。');
      lines.push('乳房攝影與超音波陰性者，<b>加做乳房 MRI</b> 尋找隱匿性原發灶。');
      lines.push('此屬 <b>cTanyN(+)</b>，依 p3 應<b>強烈考慮全身分期</b>；治療上比照局部晚期處理。');
    }
    lines.push('<b>病理報告拿到後</b>：依「是否為侵襲癌」與「ER／PR／HER2」回到步驟 1 選擇 <b>原位癌（DCIS）</b> 或 <b>侵襲性乳癌</b> 分支。' +
      'NACT 之後手術檢體會<b>重複</b>做 ER／PR／HER2 染色（p2）。');

    result(R, F, 'rec-elective', '診斷與治療前檢查', lines,
      'p1（work-up）、p2（IHC 原則）、p3（全身分期原則）、p4（遺傳諮詢）、p5（gBRCA1/2 檢測適應症）。',
      null,
      '<div class="rec-detail">' + workupBox() + stagingBox() +
      '<div class="cbx"><div class="cbx-h">HER2 判讀（p2）</div><div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">IHC 0–1+</span>陰性，通常不做 FISH</span>' +
      '<span class="cb"><span class="cb-k">IHC 2+</span><b>須做 FISH</b></span>' +
      '<span class="cb"><span class="cb-k">IHC 3+</span>陽性，不需 FISH</span>' +
      '</div></div>' + geneticDetails() + '</div>');
  }

  /* ==========================================================
     B. DCIS（p6、p46）
     ========================================================== */
  function renderDcisRec() {
    var s = bcSt;
    if (s.scope !== 'dcis') return;
    var R = 'bc_dcis_rec', F = 'bc_dcis_fu';
    if (!s.dloc) { idleRec(R, F, '請選擇步驟 2（局部治療方式）'); return; }

    var lines = [];
    if (s.dloc === 'd_bct') {
      if (!s.dmar) { idleRec(R, F, '請選擇步驟 3（乳房保留手術之切緣）'); return; }
      if (s.dmar === 'dm_close') {
        result(R, F, 'rec-urgent', 'DCIS · 乳房保留手術切緣過近或陽性 → 再切除', [
          '<span class="rx-h">局部處置</span>　<span class="rx-sub">p6</span>',
          '<b>Re-excision（再切除）</b> —— <b>除非該切緣為深部（deep）或表淺（superficial）</b>，' +
          '因為深部切緣已達胸肌筋膜、表淺切緣已達皮膚，再切也切不出更多組織。',
          '再切除後仍無法達到乾淨切緣者 → 改行<b>全乳切除</b>（此時不需輔助放療）。',
          '<b>VNPI 10–12 分（高風險）者本來就建議全乳切除</b>（p46）。'
        ], 'p6：BCT（close or positive margin）→ re-excision，unless deep or superficial margin。', 'dcis',
          '<div class="rec-detail">' + vnpiDetails() + '</div>');
        return;
      }
      result(R, F, 'rec-elective', 'DCIS · 乳房保留手術 → 依風險決定放療 ＋（ER(+)）tamoxifen', [
        '<span class="rx-h">局部處置</span>　<span class="rx-sub">p6、p46</span>',
        '<b>乳房保留手術</b>，陰性切緣後<b>依 VNPI 分數或 ECOG E5194 條件決定是否輔助放療</b>：' +
        'VNPI 4–6 分（低風險）放療為選擇性；7–9 分（中風險）建議輔助放療；10–12 分（高風險）建議改行全乳切除。' +
        'E5194 條件為腫瘤 &lt;2.5 cm、低或中度分化、切緣 &gt;3 mm。實際照野與劑量請依放射治療指引。',
        '<b>腋下</b>：單純 BCS 之 DCIS <b>原則不需 SLNB</b>；' +
        '若<b>切除位置可能影響日後 SLNB</b>（如外上象限大範圍切除），則應在此次手術一併做（p6 註 b）。',
        '<span class="rx-h">輔助治療</span>　<span class="rx-sub">p6、p23</span>',
        'ER(+) 者<b>建議 <span class="drug">tamoxifen</span> 5 年</b>；在乳房保留手術族群，其主要目的是<b>降低同側乳房復發</b>（p6 註 a）。',
        '<b>DCIS 完全不做全身分期</b>（CT／PET／bone scan 皆不考慮，p3）。'
      ], 'p6：Tis N0M0 → BCT → adjuvant RT or not（referred to radiotherapy guidelines）；if ER(+), suggest tamoxifen for 5 yr。p46：VNPI／E5194。', 'dcis',
        '<div class="rec-detail">' + vnpiDetails() + htDetails() + '</div>');
      return;
    }

    result(R, F, 'rec-elective', 'DCIS · 全乳切除 ± SLNB ± 重建', [
      '<span class="rx-h">局部處置</span>　<span class="rx-sub">p6、p46</span>',
      '<b>單純全乳切除 SM(TM)</b> —— <b>不需輔助放療</b>（p46）。可同時做乳房重建。',
      '<b>腋下：SLNB 在全乳切除族群「更強烈考慮」</b>（p6 註 b）。理由是全乳切除後乳房淋巴引流已破壞，' +
      '若最終病理升級為侵襲癌就<b>再也補不回前哨淋巴結切片</b>；接受乳房保留手術者則仍可事後補做。',
      '<span class="rx-h">輔助治療</span>　<span class="rx-sub">p6</span>',
      'ER(+) 者建議 <span class="drug">tamoxifen</span> 5 年 —— 但在全乳切除族群，其性質<b>比較接近對側乳房的二級預防</b>（p6 註 c），' +
      '而非降低同側復發，決定時應把這一點講清楚。'
    ], 'p6：Tis N0M0 → SM(TM) ± SLNB ± Reconstruction；p46：Simple mastectomy — no need for adjuvant RT。', 'dcis',
      '<div class="rec-detail">' + omitAxDetails() + htDetails() + '</div>');
  }

  function renderLcisRec() {
    if (bcSt.scope !== 'lcis') return;
    result('bc_lcis_rec', 'bc_lcis_fu', 'rec-elective', 'LCIS · 不必然需要手術，以追蹤為主', [
      '<span class="rx-h">處置</span>　<span class="rx-sub">p7</span>',
      '<b>典型 LCIS：切除非必要（resection not mandatory），以追蹤（surveillance）為主。</b>',
      '<b>多形性 LCIS（pleomorphic LCIS）：比照 DCIS 處理</b> —— 需完整切除並比照 DCIS 決定放療與內分泌治療。',
      'LCIS <b>不做腋下分期</b>、不做全身分期。',
      'LCIS 為<b>雙側乳癌的風險指標</b>而非直接前驅病灶；風險降低藥物（如 tamoxifen）之使用請個別討論並考慮遺傳諮詢（p4）。'
    ], 'p7：LCIS Management — LCIS: resection not mandatory, surveillance；Pleomorphic LCIS: managed as DCIS。', 'dcis');
  }

  /* ==========================================================
     D-1. 初始策略（步驟 3 的格子）
     ========================================================== */
  var CTN_LABEL = {};
  CTN_ROWS.forEach(function (r) {
    CTN_COLS.forEach(function (c) { CTN_LABEL[r[0] + '_' + c[0]] = r[1] + ' ' + c[1]; });
  });

  function renderStratRec() {
    var s = bcSt;
    if (s.scope !== 'ebc') return;
    var R = 'bc_strat_rec';
    if (!s.sub) { ulRec(R, 'rec-idle', '請先選擇步驟 2（生物亞型）', [], ''); return; }
    if (!s.ctn) { ulRec(R, 'rec-idle', '請於步驟 3 點選 cT×cN 格子', [], ''); return; }

    var row = s.ctn.split('_')[0];
    var colIdx = ['n0', 'n1', 'n23'].indexOf(s.ctn.split('_')[1]);
    var g = CTN_GROUP[s.sub][row][colIdx];
    var lab = CTN_LABEL[s.ctn];
    var lines = [];
    var title, cls;

    if (g === 'g-none') {
      cls = 'rec-elective';
      title = lab + '（' + SUB_LABEL[s.sub] + '）→ 建議直接手術';
      if (s.sub === 'her2hr' || s.sub === 'her2') {
        lines.push('<b>cT1a–bN0 之 HER2(+) 建議直接手術</b>，理由是要符合 <b>APT 試驗</b>族群（T &lt; 3cm、淋巴結陰性），' +
          '術後給 <span class="drug">paclitaxel</span> 每週 ×12 週 ＋ <span class="drug">trastuzumab</span> 共 1 年即可，' +
          '<b>以免過度治療（prevent over treatment）</b>（p18）。');
      } else if (s.sub === 'tnbc') {
        lines.push('台大列出的 TNBC 術前化療門檻為 <b>≥T2N0 或 ≥N1</b>（p9），此格未達門檻 → 直接手術，術後再依病理分期決定化療。');
      } else {
        lines.push('HR(+)/HER2(−) 且分期在 <b>≤IIB 與 T3N1</b> 者，指引的預設情境即為<b>不做術前治療</b>（p10）：' +
          '做乳房保留者 BCT + SLND／ALND + 放療；不做乳房保留者 SM + ALND／SLND。');
        lines.push('<b>例外</b>：若腫瘤相對乳房體積偏大、病人希望保留乳房，仍可用術前化療或（停經後）術前內分泌治療降期以爭取 BCT（p11）。');
      }
      lines.push('<b>先決條件</b>：把化療提前並不會增加絕對效益 —— <b>只有在術後本來就有化療適應症時才考慮術前化療</b>。');
    } else if (g === 'g-low') {
      cls = 'rec-elective';
      title = lab + '（' + SUB_LABEL[s.sub] + '）→ 直接手術或術前治療皆可';
      if (s.sub === 'her2hr') {
        lines.push('<b>cT1cN0（p18）：可選擇直接手術，或選擇 NACT</b> —— 後者可用 <b>taxane + trastuzumab</b> 作為處方選項之一。');
        lines.push('注意：同樣是 T1cN0，<b>HR(−)/HER2(+) 台大是「建議 NACT」</b>，HR(+)/HER2(+) 則兩者皆可 —— ' +
          '差別在 HR(−)/HER2(+) 復發風險較高、對術前治療的反應率也較高。');
      } else if (s.sub === 'tnbc') {
        lines.push('<b>台大列的門檻是 ≥T2N0</b>，故 T1cN0 未達「建議 NACT」；' +
          '但 <b>ASCO 術前治療指引建議 TNBC ≥cT1c 或 cN(+) 即給術前化療</b>（僅 cT1a／cT1bN0 不常規給）。' +
          '兩者不一致，此格標為「兩者皆可」，實務上多數 T1c TNBC 會走術前化療以取得病理反應資訊。');
        lines.push('走術前化療的額外理由：<b>殘存病灶（non-pCR）者可加 <span class="drug">capecitabine</span></b>（CREATE-X），' +
          'gBRCA1/2(+) 者可加 <span class="drug">olaparib</span>（OlympiA）—— 這些後續選項<b>只有做了術前化療才拿得到</b>。');
      } else {
        lines.push('此分期（stage IIA／IIB）且<b>符合乳房保留條件</b>者，指引列為：<b>術前化療或（ER(+)）術前內分泌治療</b>，' +
          '或<b>依病人意願直接手術</b>（p11）。');
        lines.push('HR(+)/HER2(−) 對術前化療的 pCR 率較低，<b>降期以爭取乳房保留</b>是主要目的，而非取得預後資訊。');
      }
    } else if (g === 'g-ii') {
      cls = 'rec-nonop';
      title = lab + '（' + SUB_LABEL[s.sub] + '）→ 建議先做術前輔助治療（NACT／NAHT）';
      if (s.sub === 'her2hr' || s.sub === 'her2') {
        lines.push('台大 p9：HER2(+) 之 <b>≥T2N0、≥N1</b>' + (s.sub === 'her2' ? '，或 <b>HR(−)/HER2(+) 之 ≥T1cN0</b>' : '') +
          ' 建議以術前治療取代直接手術。');
        lines.push('<b>至少 18 週的術前治療</b>（p18）；<b>N(+) 者加上 <span class="drug">pertuzumab</span></b>。' +
          '<b>指引寫「未給付」，但健保已自 2024-12-01 於早期乳癌給付</b>（條文 9.70.1，限<b>淋巴結陽性</b>、與 trastuzumab 合計上限 18 個週期）。');
        lines.push('走術前治療的關鍵理由：<b>未達 pCR 者可換 <span class="drug">T-DM1</span></b>（KATHERINE），這是直接手術拿不到的資訊。');
      } else if (s.sub === 'tnbc') {
        lines.push('台大 p9：TNBC 之 <b>≥T2N0 或 ≥N1</b> 建議術前化療。');
        lines.push('<b>≥cT1cN1 或 ≥cT2N0 建議在術前化療加上 <span class="drug">pembrolizumab</span></b>；' +
          '若使用 pembrolizumab，<b>化療處方最好照 KEYNOTE-522 的做法走</b>（p19）。' +
          '<b>指引寫「未給付」，但健保已自 2025-06-01 於早期三陰性乳癌給付</b>（條文 9.69.2(7)，stage II–IIIb，不需檢附 PD-L1 報告；' +
          '<b>輔助期只給付未達 pCR 者</b>）。仍有免疫相關不良事件（irAE），須仔細討論。');
        lines.push('未達 pCR 者的後續選項（capecitabine、olaparib）同樣<b>只有做了術前化療才存在</b>。');
      } else {
        lines.push('<b>局部晚期（通常為 stage III 或 T3N0）強烈建議先做全身治療</b>（p11）。');
        lines.push('停經後 ER(+) 者可用<b>術前內分泌治療（NAHT）</b>取代術前化療 —— 對 HR(+)/HER2(−) 而言，' +
          '降期效果相近而毒性低很多，代價是需時較久（通常 4–6 個月以上）。');
      }
      lines.push('<b>前提是體能適合（fit）</b>（p9）—— 體能無法承受術前化療者，直接手術反而是較好的選擇。');
    } else {
      cls = 'rec-urgent';
      title = lab + '（' + SUB_LABEL[s.sub] + '）→ 局部晚期，先做全身治療，勿直接手術';
      lines.push('<b>T4（含胸壁／皮膚侵犯與發炎性乳癌）與 N2–3 屬局部晚期</b>，' +
        '指引將 <b>stage IIIB／IIIC</b> 明列於「with neoadjuvant treatment」的情境（p11）。');
      if (row === 't4d') {
        lines.push('<b>發炎性乳癌（T4d）</b>：一律先做全身治療；<b>不做乳房保留手術</b>，術式為全乳切除 + 腋下淋巴結廓清，術後放療。');
      }
      lines.push('<b>應完成全身分期</b>（cTanyN2、cTanyN3、cT4Nany 皆為 p3 之「強烈考慮」族群）—— 先排除已經是 M1。');
      lines.push('若治療後轉為可切除 → 依步驟 4 選「術前輔助治療 → 再手術」繼續；若始終無法切除或體能不允許 → 選「不適合手術」。');
    }

    lines.push('<b>術前治療開始前的四件事（p12）</b>：① 停經前女性<b>討論生育議題</b>、必要時轉介婦產科凍卵／胚胎保存；' +
      '② <b>腫瘤床至少放 1 個 clip</b>；③ 詳細評估腋下，臨床陽性者若可行則<b>先 clip 標記該顆淋巴結</b>；④ 選擇性乳房 MRI。');
    if (g !== 'g-none') {
      lines.push('<b>想估算這個病人達到 pCR 的機率？</b> 已有納入<b>年齡、分化度、HR／HER2 狀態、T 分期、N 分期與是否化療</b>之 nomogram 可預測病理完全緩解' +
        '（Ye K et al. Cancer Med 2025，見下方文獻列表）。<b>這類模型是討論用的輔助工具，不取代指引的適應症</b>；' +
        '術前治療的門檻仍以 p9 的條文為準。');
    }

    ulRec(R, cls, title, lines,
      'p9（Principles of Operation：NACT 適應症）、p10（無術前治療之局部治療）、p11（有術前治療之情境）、p18（HER2(+) 之細節）、p19（TNBC 之細節）、p12（術前治療之一般原則）。');
  }

  /* ==========================================================
     D-2. 術前輔助治療處方（步驟 5）
     ========================================================== */
  function naRegimenLines(sub) {
    var l = [];
    if (sub === 'her2hr' || sub === 'her2') {
      l.push('<span class="rx-h">HER2(+) 之術前處方</span>　<span class="rx-sub">p18、p34、p35</span>');
      l.push('<b>至少 18 週</b>的術前治療（p18）。<b>N(+) 者加 <span class="drug">pertuzumab</span></b>。' +
        '<b>指引寫「未給付」，但健保已自 2024-12-01 於早期乳癌給付</b>（條文 9.70.1，限淋巴結陽性）。');
      l.push('<span class="rx">TCHP</span>：<span class="drug">docetaxel</span> 75 mg/m² ＋ ' +
        '<span class="drug">carboplatin</span> AUC 5–6（或 <span class="drug">cisplatin</span> 50–70 mg/m²）＋ ' +
        '<span class="drug">trastuzumab</span> ±<span class="drug">pertuzumab</span>，q21d ×6 週期。' +
        '<b>院內共識可調整</b>：taxane 改 <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15；' +
        'platinum 改 carboplatin AUC 1.5 D1、8、15 —— 都符合 taxane+platinum 的概念。');
      l.push('<span class="rx">AC／EC → TH 或 THP</span>；或先 TH／THP 再接 (F)EC／(F)AC。' +
        '<b>抗 HER2 抗體不與 anthracycline 併用</b>（心毒性），與 taxane 併用（p34）。');
      l.push('<span class="drug">trastuzumab</span> 劑量：6 mg/kg q3W（首劑另加 2 mg/kg、輸注時間拉長，無反應後可縮短）、' +
        '或 2 mg/kg q1W、或 4 mg/kg q2W；<b>皮下劑型 600 mg 固定劑量 SC 3–5 分鐘 q3W，不需首劑加量</b>。' +
        '<span class="drug">pertuzumab</span>：首劑 840 mg，第 2 週期起 420 mg，q3W。');
      l.push('<b>療程長度與給付</b>：trastuzumab／pertuzumab 典型為 1 年；<b>因給付因素，9–12 週亦被視為可接受</b>（p34）。');
    } else if (sub === 'tnbc') {
      l.push('<span class="rx-h">TNBC 之術前處方</span>　<span class="rx-sub">p19、p32、p33</span>');
      l.push('<b>≥cT1cN1 或 ≥cT2N0 建議加上 <span class="drug">pembrolizumab</span></b>；一旦使用 pembrolizumab，' +
        '<b>化療處方最好照 KEYNOTE-522 的做法走</b>（p19）。');
      l.push('<span class="rx">[EC/AC + T-carbo] + pembro</span>（KEYNOTE-522 處方，p32）：<br>' +
        '<b>週期 1–4（q21d）</b>：<span class="drug">pembrolizumab</span> 200 mg D1 ＋ ' +
        '<span class="drug">paclitaxel</span> 80 mg/m² D1、8、15 ＋ ' +
        '<span class="drug">carboplatin</span> AUC 5 D1（或 AUC 1.5 D1、8、15）<br>' +
        '<b>週期 5–8（q21d）</b>：<span class="drug">pembrolizumab</span> 200 mg D1 ＋ ' +
        '<span class="drug">doxorubicin</span> 60 mg/m²（或 <span class="drug">epirubicin</span> 90 mg/m²）＋ ' +
        '<span class="drug">cyclophosphamide</span> 600 mg/m² D1<br>' +
        '<b>術後接續</b>：輔助 <span class="drug">pembrolizumab</span> 200 mg q21d ×9 週期。');
      l.push('<b>不用 pembrolizumab 時的白金加法（p33）</b>：常見為 EC／AC 之後接 <b>taxane + platinum ×4 週期</b>；' +
        '部分病人可走<b>不含 anthracycline</b> 的 <b>T + platinum ×6 週期</b>。' +
        'platinum 可用 carboplatin AUC 5 D1、AUC 1.5 D1/8/15，或 cisplatin 50–70 mg/m² D1 q21d。');
      l.push('<b>優先考慮臨床試驗收案</b>（p19）。');
    } else {
      l.push('<span class="rx-h">HR(+)/HER2(−) 之術前處方</span>　<span class="rx-sub">p11、p22、p28–p31</span>');
      l.push('<b>術前化療（NACT）或術前內分泌治療（NAHT，限 ER(+)）二擇一</b>（p11）。' +
        'NAHT 主要用於<b>停經後</b>病人，毒性遠低於化療，代價是需時較久。');
      l.push('化療處方沿用早期乳癌的標準處方（AC-T／EC-T、AC-wT、TC、TAC／TEC 等，見下表）。' +
        '<b>本院共識</b>：除了強烈建議用第三代化療者以外，原則上只建議「化療或不化療」，<b>處方強度由主治醫師與病人討論後共同決定</b>（p28）。');
      l.push('HR(+)/HER2(−) 的 pCR 率本來就低，因此<b>術前治療的目的多半是降期以爭取乳房保留</b>，' +
        '而不是靠 pCR 來調整術後藥物。');
    }
    l.push('<b>治療期間每次回診評估腫瘤反應</b>（p12）—— 反應不佳時要及早發現，而不是等療程跑完。');
    return l;
  }

  function renderNaRec() {
    var s = bcSt;
    if (s.scope !== 'ebc' || s.strat !== 'nact') return;
    var R = 'bc_na_rec';
    if (!s.sub) { ulRec(R, 'rec-idle', '請先選擇步驟 2（生物亞型）', [], ''); return; }
    if (!s.nresp) {
      ulRec(R, 'rec-nonop', '術前輔助治療處方（' + SUB_LABEL[s.sub] + '）', naRegimenLines(s.sub),
        'p18（HER2(+)）、p19／p32／p33（TNBC）、p11／p28（HR(+)HER2(−)）、p34／p35（抗 HER2 處方與劑量）。' +
        '請於步驟 5 選擇治療期間的反應。', null,
        '<div class="rec-detail">' + chemoGenDetails() + nhiPanelEBC() + '</div>');
      return;
    }
    if (s.nresp === 'na_pd') {
      ulRec(R, 'rec-urgent', '術前治療期間臨床惡化（clinical PD）→ 停止現行處方、重新分期', [
        '<span class="rx-h">立即處置</span>',
        '<b>停止現行術前處方</b>，重新做影像與必要時重新切片 —— <b>先確認是不是已經出現遠處轉移</b>（若是 → 回步驟 1 走「轉移性乳癌」）。',
        '<b>仍為 M0 且可切除者：直接手術</b>，不要為了「跑完療程」而繼續無效的處方。',
        '<b>仍為 M0 但不可切除者</b>：換另一類全身治療（改用未曾用過的機轉／藥物類別），或先做<b>放射治療</b>爭取局部控制，' +
        '之後再重新評估手術可行性。',
        '<span class="rx-h">腋下處置會改變</span>　<span class="rx-sub">p13</span>',
        '<b>p13 明文：cN0 者「NACT 後可單做 SLNB —— 除非臨床惡化（unless clinical PD）」。</b>' +
        '也就是說<b>治療中惡化的病人不能只做前哨淋巴結切片</b>，應做腋下淋巴結廓清（ALND）。' +
        '這一條很容易被漏掉，因為它藏在一個 unless 子句裡。',
        '<span class="rx-h">乳房手術方式也要重新評估</span>',
        '原本規劃靠降期換乳房保留的病人，惡化後<b>多半已不符合乳房保留條件</b>，應重新討論全乳切除。',
        '<b>治療期間每次回診都要評估腫瘤反應</b>（p12）—— 這一步的存在就是為了避免整個療程結束才發現無效。'
      ], 'p12（During NA(C)T: assess tumor response every time）、p13（cN0：after NACT, SLNB alone, unless clinical PD）。' +
        '「改用何種處方」台大乳癌指引未逐條規範，實務上依未用過之藥物類別選擇，並考慮臨床試驗。');
      return;
    }
    ulRec(R, 'rec-nonop', '術前輔助治療處方（' + SUB_LABEL[s.sub] + '）· 有反應 → 完成療程後手術', naRegimenLines(s.sub),
      'p18（HER2(+)）、p19／p32／p33（TNBC）、p11／p28（HR(+)HER2(−)）、p34／p35（抗 HER2 處方與劑量）。' +
      'p12：治療後可行則做乳房保留手術＋適當腋下分期，否則全乳切除＋適當腋下分期。', null,
      '<div class="rec-detail">' + chemoGenDetails() + nhiPanelEBC() + '</div>');
  }

  /* ==========================================================
     D-3. 腋下與局部治療（步驟 7）
     ========================================================== */
  function renderAxRec() {
    var s = bcSt;
    if (s.scope !== 'ebc' || !s.ax) return;
    var R = 'bc_ax_rec';
    var isSm = s.surg === 'sg_sm';
    var lines = [], title, cls = 'rec-elective';

    switch (s.ax) {
      case 'ax_omit':
        cls = 'rec-elective';
        title = '未做腋下手術 —— 確認確實落在可省略的族群';
        lines = [
          '<span class="rx-h">可省略腋下分期的情境</span>',
          '<b>純 DCIS 且行乳房保留手術</b>：原則不需要（p6 註 b 僅對全乳切除者與可能影響日後 SLNB 之切除位置「更強烈考慮」）。',
          '<b>LCIS</b>：以追蹤為主，不做腋下分期（p7）。',
          '<b>年長且低風險</b>（&gt;70 歲、cN0、HR(+)/HER2(−)、T1、將接受內分泌治療）：腋下結果不改變治療決策。' +
          '<b>此條為院外實證（CALGB 9343 族群、Choosing Wisely），台大指引未明文列出</b>，採用前須個案討論並記錄。',
          '<span class="rx-h">不可省略者</span>',
          '<b>侵襲癌接受全乳切除</b>（切了就補不回來）、<b>cN(+)</b>、<b>接受過術前化療</b>（腋下病理決定放療與後續藥物）、' +
          '<b>發炎性乳癌</b>、<b>術前治療期間臨床惡化者</b>（p13）。',
          '省略腋下手術者，<b>放療照野與輔助全身治療只能依原發腫瘤的特徵決定</b> —— 決定省略時就要接受這個限制。'
        ];
        break;
      case 'ax_neg':
        title = '前哨淋巴結陰性 pN0(sn) → 不需進一步腋下手術';
        lines = [
          '<b>SLNB 陰性即完成腋下分期</b>，不做 ALND。',
          '<b>孤立腫瘤細胞 pN0(i+)</b>（≤0.2mm 且 ≤200 個細胞）<b>在分期上視為 N0</b>，同樣不需 ALND。' +
          '（注意：這一條只適用於<b>直接手術</b>；術前化療後的 ypN0(i+) 依 p13 仍須 ALND。）',
          isSm ? '全乳切除後之胸壁放療依 p47 的明確指徵決定（此處 pN0，通常不需要，除非切緣(+)、侵犯皮膚或胸壁）。'
            : '乳房保留手術後<b>全乳放療為必要</b>（低風險年長者例外，見下）。'
        ].concat(rtLines(isSm ? 'sm' : 'bct'));
        break;
      case 'ax_mi':
        title = '前哨淋巴結微轉移 pN1mi(sn)';
        lines = [
          '<b>微轉移（&gt;0.2mm 或 &gt;200 細胞，且 ≤2mm）不是 Z0011 的族群</b> —— Z0011 收的是巨轉移。' +
          '微轉移可免除腋下廓清的證據來自 <b>IBCSG 23-01</b>（乳房保留＋放療族群，10 年追蹤無差異）。',
          isSm ? '<b>本例為全乳切除</b>：台大 p48 的規範是針對 SLN 巨轉移（1–2 顆）寫的，微轉移未逐條規範；' +
            '應以多專科討論決定「完成 ALND」或「依 AMAROS 概念給區域放療」。'
            : '<b>本例為乳房保留 + 全乳放療</b>：多數情況可<b>不做腋下廓清</b>。',
          '<b>分期上 pN1mi 屬 N1</b>，故輔助全身治療請依步驟 8 的 pN1mi 欄判讀（HER2(+) 之 pT1aN1mi 是指引明列的「可考慮化療＋trastuzumab」格）。'
        ].concat(rtLines(isSm ? 'sm' : 'bct'));
        break;
      case 'ax_z11':
        title = '前哨 1–2 顆巨轉移且符合 Z0011 → 可免除進一步腋下廓清';
        lines = [
          '<b>五項條件全部符合才成立</b>（p8）：cN0 且 SLN 僅 1–2 顆(+)、T1–T2、接受乳房保留手術且已規劃術後放療、' +
          '有足量的輔助全身治療、尤其是 ER(+) 者。',
          '<b>免除 ALND 的代價是要有全乳放療</b> —— Z0011 的族群全部接受了乳房切線放療。' +
          '若病人最後沒做放療，這個免除就失去依據。',
          '此族群依 p3 <b>不特別考慮全身分期</b>（cN0、pT1-2N1M0）。'
        ].concat(rtLines('bct'));
        break;
      case 'ax_noz':
        cls = 'rec-nonop';
        title = '前哨 1–2 顆巨轉移但不符合 Z0011 → 完成腋下廓清（或以區域放療替代）';
        lines = [
          '<span class="rx-h">台大 p48 的逐條規範</span>　<span class="rx-sub">cLN(−)、s/p SM+SLND、pT1-2、SLN 1–2 顆(+)</span>',
          '<b>原則應完成腋下淋巴結廓清（complete ALND）。</b>',
          '<b>若腋下廓清不完整（取出淋巴結 &lt;10 顆）</b>：<br>' +
          '· <b>TNBC 或有淋巴血管侵犯 LVI(+)</b>，且殘存陽性淋巴結為 1–2 顆 → <b>建議完成 ALND</b>。<br>' +
          '· <b>非 TNBC 且 LVI(−)</b>（任何淋巴結陽性）→ 建議 ALND，<b>除非外科醫師認為完成廓清有困難、或病人在充分討論後仍拒絕</b> —— ' +
          '此時<b>依 AMAROS 試驗建議改給區域放療（腋下＋鎖骨上窩）± 胸壁放療</b>。',
          '<b>不符合 Z0011 的常見原因</b>：全乳切除、T3 以上、未規劃全乳放療、術前已做過化療。'
        ].concat(rtLines(isSm ? 'sm' : 'bct'));
        break;
      case 'ax_3':
        cls = 'rec-nonop';
        title = '前哨 ≥3 顆陽性 → 腋下淋巴結廓清 ＋ 放療';
        lines = [
          '<b>超過 2 顆前哨陽性已在 Z0011 的收案範圍之外</b> → 完成腋下淋巴結廓清。',
          '<b>腋下 ≥4 顆陽性是全乳切除後胸壁放療的明確指徵</b>（p47）；1–3 顆陽性者依危險因子決定。',
          '此族群（cTanyN2 以上）依 p3 應<b>強烈考慮全身分期</b>。'
        ].concat(rtLines(isSm ? 'sm' : 'bct'));
        break;
      case 'ax_cnpos':
        cls = 'rec-nonop';
        title = 'cN(+) 術前已證實 → 腋下淋巴結廓清（ALND）';
        lines = [
          '<b>cN0 首選 SLNB、cN(+) 行 ALND</b>（p8）；<b>術前對可疑淋巴結應先做 FNA</b> 確認（p10 註 b）—— ' +
          '這一步決定了整條腋下路線，不能省。',
          '<b>如果這位病人本來就要做全身治療</b>，可考慮改走「術前治療 → 降期後再評估腋下」的路線（p13、p14），' +
          '降為 ycN0 者有機會以 SLNB／TAD 取代 ALND，減少淋巴水腫。這是把 cN(+) 病人排進術前治療的重要理由之一。',
          '此族群依 p3 應<b>強烈考慮全身分期</b>（cT3N1、cTanyN2、cTanyN3）。'
        ].concat(rtLines(isSm ? 'sm' : 'bct'));
        break;
      case 'na_cn0_neg':
        title = 'NACT 前 cN0 → 術後前哨陰性 ypN0(sn) → 不需 ALND';
        lines = [
          '<b>p13、p14</b>：cN0 者可術前 SLNB，或於 NACT 後單做 SLNB —— <b>除非治療中臨床惡化（PD）</b>。',
          '本例前哨陰性 → <b>不做腋下淋巴結廓清</b>。'
        ].concat(rtLines('nact'));
        break;
      case 'na_cn0_pos':
        cls = 'rec-nonop';
        title = 'NACT 前 cN0 → 術後前哨陽性 → 須做 ALND';
        lines = [
          '<b>p14 明文：任一顆陽性，包括 ypN1mi 與 ypN0(i+)，均須後續 ALND。</b>',
          '<b>這裡不能套 Z0011</b> —— Z0011 排除了接受術前化療的病人。術前化療後的殘存腫瘤細胞，' +
          '代表的是「對化療不敏感的殘存病灶」，臨床意義與未治療過的 1–2 顆陽性完全不同。',
          '<b>NACT 後 pN(+) 是接受 PMRT／Breast RT + 區域淋巴照射的明確指徵</b>（p49）。'
        ].concat(rtLines('nact'));
        break;
      case 'na_ycn0_neg':
        title = 'cN1-2 降期為 ycN0 → SLNB／TAD 陰性 → 可免除 ALND';
        lines = [
          '<b>前提是取到「足量前哨」</b>（p14 註 #）：<b>雙示蹤劑且取出 ≥3 顆</b>，或 <b>SLNB + 標記淋巴結摘除（TAD）</b>。' +
          '取不到這個量，偽陰性率會高到不能接受。',
          '<b>治療前已 clip 標記淋巴結者：取出標記淋巴結 + SLND，不論顆數</b>（p13）。' +
          '<b>現行 clip 多無法以超音波辨識，需乳房攝影導引針定位</b> —— 這件事要在手術排程時就先安排。',
          '<b>放療不能一起省</b>：降階腋下手術的安全性建立在有做區域淋巴照射的前提上；' +
          '是否照射依 p49 的 NTUH 共識判定。'
        ].concat(rtLines('nact'));
        break;
      case 'na_ycn0_pos':
        cls = 'rec-nonop';
        title = 'cN1-2 降期為 ycN0 → SLNB／TAD 仍有陽性 → 須做 ALND';
        lines = [
          '<b>p14：任一顆陽性（含 pNmi、pN0(i+)）即須後續 ALND。</b>',
          '<b>NACT 後 pN(+) 為 PMRT／Breast RT + 區域淋巴照射的明確指徵</b>（p49）。',
          '腋下有殘存病灶意味著<b>未達 pCR</b> → 請於步驟 8 選「殘存病灶 non-pCR」，' +
          '以取得 T-DM1（HER2(+)）、capecitabine／olaparib（TNBC）等術後強化選項。'
        ].concat(rtLines('nact'));
        break;
      case 'na_ycn1':
        cls = 'rec-nonop';
        title = '術前治療後腋下仍臨床陽性 ycN(+) → 直接 ALND';
        lines = [
          '<b>p13、p14：若 ycN(+)，做 ALND</b>，不再嘗試前哨淋巴結切片。',
          '腋下未降期代表<b>對術前治療反應不佳</b>，必為 non-pCR → 步驟 8 請選「殘存病灶」。',
          '<b>PMRT／Breast RT + 區域淋巴照射有明確指徵</b>（p49：NACT 後 pN(+)）。'
        ].concat(rtLines('nact'));
        break;
    }

    ulRec(R, cls, title, lines,
      'p8（手術與 Z0011 原則）、p10（無術前治療之局部治療）、p13／p14（術前化療情境之腋下分期）、p15（直接 SLNB 之情境）、' +
      'p47（放療指徵）、p48（SLN 1–2 顆陽性且腋下廓清不完整之處理）、p49（NACT 後放療之 NTUH 共識）。',
      null, '<div class="rec-detail">' + omitAxDetails() + '</div>');
  }

  /* ==========================================================
     D-4. 輔助全身治療（步驟 8）
     ========================================================== */
  function olympiaDetails() {
    return '<details class="kps-details"><summary>OlympiA 條件 — gBRCA1/2(+) 早期乳癌之延長輔助 olaparib（p21）▸</summary><table>' +
      '<tr><td>療程</td><td><span class="drug">olaparib</span> 1 年；改善無侵襲性疾病存活（IDFS）與無遠處疾病存活（DDFS）</td></tr>' +
      '<tr><td>基本條件</td><td><b>HER2(−)</b> 且帶有 <b>gBRCA1/2 生殖細胞突變</b></td></tr>' +
      '<tr><td>做過術前化療者</td><td>TNBC：<b>non-pCR</b>；ER(+)：<b>non-pCR 且 CPS-EG 分數 ≥ 3</b></td></tr>' +
      '<tr><td>直接手術者</td><td>TNBC：<b>≥pT2 或 ≥pN1</b>；ER(+)：<b>淋巴結 ≥4 顆</b>；或其他高風險</td></tr>' +
      '<tr><td>給付與討論</td><td>指引當時寫<b>健保未給付</b>；<b>健保已自 2025-06-01 納入</b>（條文 9.85.4）。' +
      '健保之高風險定義與 OlympiA 略有不同：三陰性為「術前化療後 non-pCR」或「直接手術後 ≥pN1、或 pN0 但腫瘤 ≥2cm」；' +
      'HR(+)/HER2(−) 為「術前化療後 non-pCR」或「直接手術後<b>淋巴結 ≥4 顆</b>」（<b>不採 CPS-EG 分數</b>）。' +
      '須完成 ≥6 週期含 anthracycline／taxane 之化療，並於最後一次治療後 12 週內開始。' +
      '仍需完整討論並搭配<b>遺傳諮詢</b>（僅生殖細胞 BRCA 計入）。⚠ 輔助情境與 pembrolizumab 擇一給付。</td></tr>' +
      '</table></details>';
  }
  function tnbcOptionDetails() {
    return '<details class="kps-details"><summary>TNBC 的其他輔助選項與其證據強度（p21 之院內說明）▸</summary><table>' +
      '<tr><td>CREATE-X</td><td>第三期隨機非雙盲試驗。HER2(−) 早期乳癌，經<b>足量</b>術前化療後<b>未達 pCR</b>者，' +
      '術後加 <b>24 週 capecitabine</b> 顯著增加無病存活（DFS），<b>在 TNBC 次族群效益更明顯</b>。</td></tr>' +
      '<tr><td>IBCSG 22-00</td><td>針對 <b>ER &lt; 10%</b> 者，標準輔助化療後再加<b>一年低劑量口服化療</b>（cyclophosphamide + MTX）。' +
      '<b>未達統計顯著</b>，但 TNBC 次族群有增加 DFS 的趨勢。</td></tr>' +
      '<tr><td>院內立場</td><td>兩者<b>證據強度有限</b>；但因 TNBC 預後較差、治療選擇少，團隊認為<b>針對高風險病人與病患討論以上選擇有合理的學術依據</b>。</td></tr>' +
      '<tr><td>劑量（p33）</td><td><span class="drug">capecitabine</span> 1000–1250 mg/m² BID D1–14，q3W，共 6–8 週期</td></tr>' +
      '</table></details>';
  }

  function her2AdjLines(g, hrPos, path) {
    var l = ['<span class="rx-h">HER2(+)：抗 HER2 ＋ 化療</span>　<span class="rx-sub">p17、p18、p34、p35</span>'];
    if (path === 'up') {
      if (g === 'g-none') {
        l.push('<b>本格為 pT1mi–pT1aN0 → ±（化療 + <span class="drug">trastuzumab</span>）</b>（p17）。' +
          '也就是<b>給或不給都在指引範圍內</b>，應把「絕對復發風險很低」講清楚後由病人一起決定。');
      } else if (g === 'g-ii') {
        l.push('<b>本格為 pT1bN0 或 pT1aN1mi → 可考慮（consider）化療 + <span class="drug">trastuzumab</span></b>（p17）。');
      } else if (g === 'g-low') {
        l.push('<b>本格為 ≥pT1cN0 → 化療 + <span class="drug">trastuzumab</span></b>（p17）。' +
          '注意：<b>健保於 EBC 僅給付淋巴結陽性者</b>，本格為 LN(−)，trastuzumab 需自費（院內立場見下方給付說明）。');
      } else {
        l.push('<b>本格為淋巴結陽性 → 輔助化療 + <span class="drug">trastuzumab</span>，並<b>建議加上</b> <span class="drug">pertuzumab</span></b>（p17）。<b>指引寫 pertuzumab 未給付，但健保已自 2024-12-01 於淋巴結陽性早期乳癌給付</b>（條文 9.70.1，與 trastuzumab 合計上限 18 個週期）。');
      }
      l.push('<span class="rx">APT</span>（Dana-Farber，p35）：<span class="drug">paclitaxel</span> 80 mg/m² 每週 ×12 週 ＋ ' +
        '<span class="drug">trastuzumab</span> 共 1 年（與 paclitaxel 同時開始）—— <b>僅適用 T &lt; 3 cm、淋巴結陰性</b>。' +
        '這是小腫瘤避免過度治療的標準做法。');
    } else if (path === 'pcr') {
      l.push('<b>已達 pCR</b>：<b>完成 <span class="drug">trastuzumab</span> 至滿 1 年</b>（若術前有用 <span class="drug">pertuzumab</span> 則一併完成）。' +
        '無須換藥。');
    } else {
      l.push('<b>未達 pCR（non-pCR）→ 換用 <span class="drug">T-DM1</span></b> 3.6 mg/kg q3W ×<b>14 個週期</b>（依 <b>KATHERINE</b> 試驗；p18、p35）。' +
        'p18 之措辭為「if affordable」，<b>但健保已自 2024-08-01 給付</b>（條文 9.87.1）—— ' +
        '需已接受 ≥6 週期化療（含 taxane ≥3 週期）與術前 trastuzumab ≥3 週期後仍有殘存，且符合<b>腋下淋巴結轉移</b>，' +
        '或<b>淋巴結陰性但 ER(−) 且腫瘤 &gt;2cm</b>；上限 14 週期，須<b>術後 12 週內</b>申請。<b>條件比 KATHERINE 窄。</b>');
      l.push('無論是否換 T-DM1，<b>至少完成 <span class="drug">trastuzumab</span> 至滿 1 年</b>（p18）。');
      l.push('<b>若先前的術前治療不含 anthracycline，可考慮術後再加 anthracycline</b>（p18）。');
    }
    l.push('<span class="drug">trastuzumab</span> 療程若未特別指定應<b>總計 1 年</b>；因給付因素，<b>9–12 週亦被視為可接受</b>（p34）。' +
      '劑量：6 mg/kg q3W（首劑另加 2 mg/kg）、2 mg/kg q1W 或 4 mg/kg q2W；<b>皮下劑型 600 mg 固定劑量 q3W，不需首劑加量</b>。');
    l.push('<b>抗 HER2 抗體不與 anthracycline 併用</b>（心毒性考量），與 taxane 併用（p34）。常見組合為 EC／AC → TH 或 THP；或 TH／THP 先、再接 (F)EC／(F)AC。');
    if (hrPos) {
      l.push('<span class="rx-h">內分泌治療</span>　<span class="rx-sub">p17、p23、p24</span>');
      l.push('<b>ER(+) 者輔助內分泌治療為必要（mandated），且於化療完成後才開始</b>（p17）—— 不與化療同時給。');
      l.push('<b>延長輔助 <span class="drug">neratinib</span> 1 年</b>（<b>健保仍未給付</b>，2026-08 查證）：可考慮用於<b>高風險 HR(+)/HER2(+)</b>，如 LN(+) 或 non-pCR。' +
        '<b>NTUH 共識：neratinib 可提早開始</b> —— 化療結束後即可，與抗 HER2 治療及內分泌治療併行（p18）。');
    } else {
      l.push('<b>本例 HR(−)</b>：不需輔助內分泌治療；<b>neratinib 的適應症是高風險 HR(+)/HER2(+)</b>，故不適用（p18）。');
    }
    return l;
  }

  function erAdjLines(g, path) {
    var l = ['<span class="rx-h">HR(+) / HER2(−)：內分泌治療為主軸</span>　<span class="rx-sub">p22、p23、p24</span>'];
    if (path === 'up') {
      if (g === 'g-ii') {
        l.push('<b>本格為 ≤pT2N0 → 輔助內分泌治療（ET），或 化療 + ET</b>；' +
          '風險以<b>多基因檢測、IHC4 分數或臨床病理參數</b>評估（p22）。');
        l.push('多基因檢測的證據來自前瞻性的 <b>Oncotype DX TAILORx</b> 試驗；' +
          '其他檢測（<b>MammaPrint、PAM50、EndoPredict、BCI</b>）<b>皆屬預後性（prognostic）</b>工具（p22 註）。' +
          '——「預後性」與「可預測化療效益」不是同一件事，選用時要分清楚。');
      } else if (g === 'g-low') {
        l.push('<b>本格為 ≥pT3N0（傾向 化療 + ET）或 pT1-2 N1mi–N1（通常 化療 + ET，除非多基因檢測顯示低復發風險）</b>（p22）。');
        l.push('<b>停經前且淋巴結 1–3 顆陽性者，多基因檢測不適合用來省略化療</b> —— 這是國際指引（ASCO biomarker guideline，依 RxPONDER）與台大' +
          '「unless low risk by multi-gene assay」之間需要留意的落差，實務上停經前病人請把卵巢功能抑制一併納入討論。');
      } else {
        l.push('<b>本格為 TanyN2–3 → 化療 + 內分泌治療</b>（p22）。此格<b>不以多基因檢測豁免化療</b>。');
      }
      l.push('<b>高風險者可加：<span class="drug">abemaciclib</span> 2 年，或 <span class="drug">TS-1</span> 1 年</b>（p22）。' +
        '<b>指引寫兩者均未給付，但 abemaciclib 已自 2024-03-01 納入輔助給付</b>（條文 9.107）：' +
        '成年女性、HR(+)（ER 或 PR &gt;30%）、HER2(−)、淋巴結陽性且符合 <b>pALN ≥4 顆</b>／<b>1–3 顆且腫瘤 ≥5cm</b>／<b>1–3 顆且 grade 3</b> 之一；' +
        '須完成標準輔助化放療後申請、<b>術後 16 個月內開始</b>、最長 2 年。' +
        '⚠ <b>用此藥後進展者，日後不得再申請任何 CDK4/6 抑制劑</b>（9.72.7）。<b>TS-1 仍未給付</b>（條文 9.46 無乳癌適應症）。');
    } else if (path === 'pcr') {
      l.push('<b>已達 pCR</b>（HR(+)/HER2(−) 的 pCR 率本來就低，達到者屬預後良好族群）：<b>完成輔助內分泌治療</b>。');
      l.push('若術前用的是內分泌治療（NAHT），術後<b>繼續同一套內分泌治療</b>並累計療程。');
      l.push('高風險者仍可討論 <span class="drug">abemaciclib</span> 2 年（p22；健保 9.107 自 2024-03-01 起於淋巴結陽性高風險族群給付）或 <span class="drug">TS-1</span> 1 年（仍未給付）。');
    } else {
      l.push('<b>未達 pCR</b>：完成輔助內分泌治療；<b>依殘存病灶的分期與淋巴結狀態</b>判定是否屬 p22 的高風險族群。');
      l.push('<b>高風險者：<span class="drug">abemaciclib</span> 2 年</b>（p22；健保 9.107 自 2024-03-01 起給付，限淋巴結陽性且符合三項高風險條件之一），' +
        '<b>或 <span class="drug">TS-1</span> 1 年</b>（仍未給付）。');
      l.push('<b>gBRCA1/2(+) 者</b>：<b>non-pCR 且 CPS-EG 分數 ≥3</b> 才符合 OlympiA 的 ER(+) 條件 → <span class="drug">olaparib</span> 1 年（p21）。' +
        '<b>指引寫未給付，但健保已自 2025-06-01 納入</b>（條文 9.85.4）—— 惟健保之 HR(+) 條件為「術前化療後 non-pCR」或「直接手術後淋巴結 ≥4 顆」，' +
        '<b>不走 CPS-EG 分數那條路</b>，且須於最後一次治療後 12 週內開始。' +
        'ER(+) 族群<b>可設較高門檻</b>。');
    }
    l.push('<b>內分泌治療的選擇（p23、p24）</b>：停經前以 <span class="drug">tamoxifen</span> 至少 5 年為基礎，' +
      '高風險者可用 <b>GnRH agonist ＋ AI／tamoxifen 5 年</b>；停經後以 <b>AI 5 年</b>為主，' +
      '亦可 AI 與 tamoxifen 交替（詳見下表）。ER 1–10% 之弱陽性者為「± 使用」。');
    l.push('<b>監測</b>：服用 tamoxifen 且子宮存在者<b>每年婦科評估</b>；服用 AI 者建議<b>定期骨密度檢查</b>（健保 33064B 有給付）。' +
      '心血管疾病高風險或骨質疏鬆者，AI 應謹慎使用。');
    return l;
  }

  function tnbcAdjLines(g, path, usedPembro) {
    var l = ['<span class="rx-h">TNBC（HR(−)/HER2(−)）</span>　<span class="rx-sub">p19、p20、p21、p32、p33</span>'];
    if (path === 'up') {
      if (g === 'g-none') {
        l.push('<b>本格為 pT1miN0 → 可省略化療（can omit）</b>（p19）。');
      } else if (g === 'g-ii') {
        l.push('<b>本格為 pT1aN0–N1mi 或 pT1bN0 → ± 化療</b>（p19）—— 給或不給都在指引範圍內，與病人討論絕對效益後決定。');
      } else {
        l.push('<b>除非風險極低，TNBC 皆有化療指徵</b>（p19）；本格屬需要化療者。處方見下方世代分類表。');
      }
      l.push('<b>直接手術族群的加強選項（p20）</b>：<br>' +
        '· <b>gBRCA1/2(+)</b> 且 <b>≥pT2 或 ≥pN1</b> → 建議加 <span class="drug">olaparib</span> 1 年。' +
        '<b>指引寫未給付，但健保已自 2025-06-01 納入</b>（條文 9.85.4，三陰性之直接手術族群條件即為 ≥pN1 或 pN0 但腫瘤 ≥2cm）。<br>' +
        '· 可考慮<b>延長輔助 <span class="drug">capecitabine</span> 1 年</b>。<br>' +
        '· <b>把 <span class="drug">pembrolizumab</span> 加進輔助化療，只有在仔細討論後才考慮</b>（有 irAE）。' +
        '<b>健保僅給付「術前用過 KEYNOTE-522 處方且未達 pCR」者的輔助 pembrolizumab</b>（9.69.2(7)）—— 直接手術者不在給付範圍。');
      l.push('<b>優先考慮臨床試驗收案</b>（p19）。');
    } else if (path === 'pcr') {
      l.push('<b>已達 pCR</b>：預後良好，<b>不需再加 capecitabine 或 olaparib</b>（CREATE-X 與 OlympiA 的 TNBC 條件都要求 non-pCR）。');
      l.push(usedPembro
        ? '<b>術前若使用了 <span class="drug">pembrolizumab</span>，術後接續輔助 pembrolizumab 200 mg q21d ×9 個週期</b>（KEYNOTE-522 處方，p32）。'
        : '術前若使用了 <span class="drug">pembrolizumab</span>，術後應接續輔助 pembrolizumab ×9 個週期（p32）。');
    } else {
      l.push('<b>未達 pCR（p20）—— 這是 TNBC 最需要加強治療的族群：</b>');
      l.push('· <b>延長輔助 <span class="drug">capecitabine</span> 6–12 個月</b>（依 CREATE-X；p33 之劑量為 1000–1250 mg/m² BID D1–14 q3W ×6–8 週期）。');
      l.push('· <b>gBRCA1/2(+) 者建議 <span class="drug">olaparib</span> 1 年</b>（OlympiA）。' +
        '<b>健保已自 2025-06-01 給付</b>（9.85.4，三陰性之術前化療後 non-pCR 即符合）；' +
        '⚠ <b>輔助情境下 olaparib 與 pembrolizumab 只能擇一給付</b>。');
      l.push('· <b>olaparib 與 capecitabine 不建議併用</b>（p20）。');
      l.push('· 先前用過術前 <span class="drug">pembrolizumab</span> 者，<b>可用 pembrolizumab + capecitabine</b>；' +
        '若同時是 gBRCA1/2(+)，<b>可用 pembrolizumab + olaparib</b>（p20）。');
    }
    return l;
  }

  function renderAdjRec(isNoop, showPtn, showResp) {
    var s = bcSt;
    if (s.scope !== 'ebc') return;
    var R = 'bc_adj_rec', F = 'bc_adj_fu';

    if (isNoop) {
      var nl = ['<span class="rx-h">不適合手術／局部無法切除</span>　<span class="rx-sub">p11、p22、p37、p43</span>'];
      if (s.sub === 'erpos') {
        nl.push('<b>HR(+) 者以「原發內分泌治療」為主</b>：停經後用 AI、停經前用 tamoxifen ±卵巢功能抑制（p23、p24），' +
          '定期評估反應，體能改善且腫瘤降期後<b>重新評估手術可行性</b>。');
      } else if (s.sub === 'her2hr' || s.sub === 'her2') {
        nl.push('<b>HER2(+) 者：抗 HER2 治療必須與化療併用</b>（p37）；體能不佳者可選毒性較低的組合（如每週 paclitaxel + trastuzumab）。');
      } else {
        nl.push('<b>TNBC 無內分泌或抗 HER2 選項</b>，以化療為主；體能不佳者採循序單一藥物、劑量依耐受度調整。');
      }
      nl.push('局部症狀（潰瘍、出血、疼痛）→ 考慮<b>緩解性放射治療</b>。');
      nl.push('<b>每次回診評估反應</b>（p12）；轉為可切除且體能允許 → 回步驟 4 改選「術前輔助治療 → 再手術」。');
      nl.push('持續進展或已出現遠處轉移 → 回步驟 1 選「轉移性乳癌」。');
      nl.push('末期病人：<b>安寧緩和照護，照會安寧共同照護團隊</b>（p37）。');
      result(R, F, 'rec-nonop', '不適合手術或局部無法切除 → 全身治療 ± 放療 → 再評估', nl,
        'p11（局部晚期之術前治療）、p37（晚期治療總則）、p12（治療中評估反應）。' +
        '「無法手術者的逐條處方」台大乳癌指引未單獨規範，此處依同亞型之全身治療原則整理。',
        'inop', '<div class="rec-detail">' + chemoGenDetails() + htDetails() + nhiPanelEBC() + '</div>');
      return;
    }

    if (!showPtn && !showResp) { idleRec(R, F, '請完成上方步驟'); return; }

    var hrPos = (s.sub === 'her2hr' || s.sub === 'erpos');
    var lines = [], title, cls = 'rec-elective', g = null, path;

    if (showPtn) {
      if (!s.ptn) { idleRec(R, F, '請於步驟 8 點選 pT×pN 格子'); return; }
      var row = s.ptn.split('_')[0], col = s.ptn.split('_').slice(1).join('_');
      var ci = ['n0', 'n1mi', 'n1', 'n23'].indexOf(col);
      g = PTN_GROUP[s.sub][row][ci];
      path = 'up';
      var rowLab = PTN_ROWS.filter(function (r) { return r[0] === row; })[0][1];
      var colLab = PTN_COLS[ci][1];
      title = rowLab + ' ' + colLab + '（' + SUB_LABEL[s.sub] + '）→ 輔助全身治療';
      cls = (g === 'g-none') ? 'rec-elective' : (g === 'g-high' ? 'rec-urgent' : 'rec-nonop');
    } else {
      if (!s.resp) { idleRec(R, F, '請於步驟 8 選擇術後病理反應'); return; }
      path = (s.resp === 'pcr') ? 'pcr' : 'nonpcr';
      title = (s.resp === 'pcr' ? '病理完全緩解 pCR' : '殘存病灶 non-pCR') +
        '（' + SUB_LABEL[s.sub] + '）→ 術後輔助治療';
      cls = (s.resp === 'pcr') ? 'rec-elective' : 'rec-urgent';
    }

    if (s.sub === 'her2hr' || s.sub === 'her2') {
      lines = her2AdjLines(g, hrPos, path);
    } else if (s.sub === 'erpos') {
      lines = erAdjLines(g, path);
    } else {
      lines = tnbcAdjLines(g, path, true);
    }

    // 放射治療
    lines.push('<span class="rx-h">放射治療</span>　<span class="rx-sub">p47、p48、p49</span>');
    var rtCtx = (s.strat === 'nact') ? 'nact' : (s.surg === 'sg_sm' ? 'sm' : 'bct');
    lines = lines.concat(rtLines(rtCtx));
    if (s.strat === 'nact') lines = lines.concat(rtLines(s.surg === 'sg_sm' ? 'sm' : 'bct'));

    // 化療起始時間
    lines.push('<b>化療起始時間（p28）</b>：除非傷口癒合不良或其他併發症，一般希望<b>術後六至八週內</b>開始化療。');

    var extra = '<div class="rec-detail">' + chemoGenDetails();
    if (hrPos) extra += htDetails();
    if (s.sub === 'tnbc') extra += tnbcOptionDetails();
    if (s.sub !== 'her2hr' && s.sub !== 'her2') extra += olympiaDetails();
    extra += favHistoDetails() + nhiPanelEBC() + '</div>';

    result(R, F, cls, title, lines,
      'p17（HER2(+) 依病理分期）、p18（HER2(+) 之 NACT 與 non-pCR）、p19／p20（TNBC）、p21（OlympiA 與 TNBC 其他選項）、' +
      'p22（ER(+)HER2(−)）、p23／p24（內分泌治療原則）、p28–p35（化療與抗 HER2 處方）、p47／p49（放療）。',
      'curative', extra);
  }

  /* ==========================================================
     E. 治療中進展／治療後早期復發
     ========================================================== */
  function renderProgRec() {
    var s = bcSt;
    if (s.scope !== 'prog') return;
    var R = 'bc_prog_rec', F = 'bc_prog_fu';
    if (!s.pg) { idleRec(R, F, '請選擇步驟 2（在哪一種治療當中出現進展）'); return; }

    var lines = [], title, cls = 'rec-urgent', note;

    if (s.pg === 'pg_nact') {
      title = '術前化療進行中臨床惡化 → 停藥、重新分期、改走手術或換全身治療';
      lines = [
        '<span class="rx-h">第一步：確認這真的是進展</span>',
        '<b>以理學檢查為主</b>；影像的角色是<b>確認臨床上的懷疑</b>，並沿用治療前最有參考價值的那一種（乳房攝影、超音波或 MRI）。' +
        '<b>不可用腫瘤標記（CA15-3、CA27-29）判定進展</b>，也不建議為了找進展而做例行影像 —— 真正進展的比例很低。',
        '<b>先排除已出現遠處轉移</b> —— 若已 M1，治療目標從治癒轉為緩解，請回步驟 1 走「轉移性乳癌」。' +
        '必要時<b>重新切片</b>（亞型可能被誤判，或腫瘤本身異質）。',
        '<span class="rx-h">仍為 M0 且可切除：兩條路，指引沒有偏好</span>',
        '<b>換另一套全身處方</b>，<b>或直接進手術</b> —— 這是<b>多專科團隊的判斷</b>，兩者都在建議範圍內。' +
        '未做完的療程可以移到術後補完。<b>不要為了跑完療程而繼續一個已被證明無效的處方。</b>',
        '<span class="rx-h">仍為 M0 但不可切除／局部晚期</span>',
        '<b>加做全身治療，和／或術前放射治療</b>；若因此轉為可切除 → 全乳切除或乳房保留手術＋腋下手術分期；' +
        '仍不可切除 → 個別化處理。<b>術前放療只出現在「不可切除」這一支</b>，可切除的病人不走這條。',
        '<span class="rx-h">腋下處置必須改變</span>　<span class="rx-sub">台大 p13</span>',
        '<b>台大 p13 明文：cN0 者「NACT 後可單做 SLNB —— 除非臨床惡化（unless clinical PD）」。</b>' +
        '<b>治療中惡化的病人不能只做前哨淋巴結切片。</b>',
        '治療前已 cN(+) 而治療後仍 ycN(+) 者（惡化者依定義即屬此類）→ <b>Level I／II 腋下淋巴結廓清</b>（台大 p13、p14）。',
        '<span class="rx-h">乳房手術方式也要重新討論</span>',
        '原本靠降期爭取乳房保留的病人，惡化後多半已不符合乳房保留條件。',
        '<b>放療指徵依「治療前的臨床分期」判定</b>（台大 p49）—— 惡化者幾乎必然落在「應接受 PMRT／Breast RT ＋ 區域淋巴照射」那一組。',
        '<span class="rx-h">要知道的一件事</span>',
        '<b>術前治療中真正進展的比例很低</b>（最大宗的系列中約 3%，且過半發生在<b>前兩個週期</b>內），' +
        '但<b>一旦發生，無惡化存活與整體存活都顯著較差</b>。這也是指引要求「每次回診評估反應」而不是靠例行影像篩檢的理由。'
      ];
      note = '台大 p12（治療中每次評估反應）、p13（unless clinical PD）、p14（ycN(+) → ALND）、p49（NACT 後放療之 NTUH 共識）。' +
        '「換處方或直接手術由多專科決定」「不可切除者才用術前放療」「不可用腫瘤標記判定進展」為 NCCN 乳癌指引術前全身治療原則與 ASCO 術前治療指引之建議；' +
        '<b>台大乳癌診療指引未就此情境逐條規範</b>，ASCO 亦指出此情境缺乏隨機試驗證據。';
    } else if (s.pg === 'pg_chemo') {
      title = '輔助化療期間或剛結束就出現轉移 → 視為對該類藥物抗藥';
      cls = 'rec-nonop';
      lines = [
        '<span class="rx-h">為什麼要換類別</span>　<span class="rx-sub">台大 p43</span>',
        '<b>台大 p43 原則二明文：「有已知抗藥性的疑慮（如快速復發）或者是 anthracycline 類達累積劑量，才不適合使用」</b>之前的處方。' +
        '也就是說，早期乳癌的處方原則上都可以在轉移期沿用，<b>唯獨「快速復發」是明列的例外</b>。',
        '<span class="rx-h">界線畫在哪裡 —— 沒有指引定義，只有試驗的收案窗</span>',
        '「taxane-refractory」<b>沒有任何指引給過定義</b>。真正決定實務的是各個試驗與藥證的收案條件：',
        '<b>三陰性 · 一線免疫治療</b>：KEYNOTE-355 要求<b>根治性治療結束到復發之間 ≥6 個月</b>。' +
        '<b>不到 6 個月就復發者不在該試驗族群內</b>，pembrolizumab ＋ 化療對她並無一線證據。' +
        '（此適應症在台灣本來就<b>未給付</b>，見下方給付表。）',
        '<b>三陰性 · sacituzumab govitecan</b>：關鍵是 <b>12 個月</b> —— 若在（術前／術後）化療結束 <b>12 個月內</b>復發，' +
        '<b>該次化療可算作一線</b>，病人因此在轉移期只需再走一線化療就用得到此藥。' +
        '台灣健保 9.106 另要求 ≥2 線全身治療、曾用 taxane、ECOG ≤1、且<b>未曾用過 T-DXd</b>。',
        '<b>HER2-low（ER／PR 皆陰性且 HER2 IHC1+ 或 2+/ISH−）</b>：若在輔助化療期間或結束 <b>6 個月內</b>進展，' +
        '<span class="drug">T-DXd</span> 可考慮提前到一線；台灣健保 9.115 之 HER2-low 條文要求 ECOG ≤1 且 ≥1 次先前化療。',
        '<span class="rx-h">實務上要一併確認的三件事</span>',
        '① <b>anthracycline 累積劑量</b>（doxorubicin 一般以 450–550 mg/m² 為上限區間，epirubicin 較高）—— 已達上限者不可再用，並評估左心室射出分率。' +
        '（此為藥品仿單與腫瘤內科實務，非本指引條文。）',
        '② <b>重新取得轉移病灶組織並重測 ER／PR／HER2</b> —— 亞型可能與原發灶不同，換錯類別就白換了；' +
        '<b>順便看 HER2 是不是 low</b>，這會多開一條路。',
        '③ HER2(−) 且曾接受化療者 → <b>做 gBRCA1/2 檢測</b>（台大 p5 明列此為檢測適應症）。',
        '<span class="rx-h">接下來</span>',
        '確認亞型後回步驟 1 選「轉移性乳癌」取得完整選單。' +
        '<b>HR(+) 者即使剛化療完，只要沒有 visceral crisis 或快速惡化，一線仍應優先用內分泌治療</b>（台大 p37）。'
      ];
      note = '台大 p43（轉移期化療三原則）、p37（晚期治療總則）、p5（gBRCA1/2 檢測適應症）。' +
        '各收案窗（KEYNOTE-355 之 ≥6 個月、ASCENT 與 sacituzumab govitecan 藥證之 12 個月、T-DXd 於 HER2-low 之 6 個月）取自各該試驗與藥證條文；' +
        '<b>台大乳癌指引未就此情境逐條規範</b>。健保條件見下方給付表。';
    } else if (s.pg === 'pg_her2') {
      title = '輔助抗 HER2 治療期間或結束 12 個月內復發 → 不重複一線雙標靶，直接進二線';
      cls = 'rec-nonop';
      lines = [
        '<span class="rx-h">判讀 —— 界線是 12 個月</span>',
        '<b>在輔助 trastuzumab 治療中、或完成後 12 個月內</b>出現轉移者，應<b>直接依「二線」建議治療</b>；' +
        '<b>超過 12 個月才復發者，才回到一線</b> <span class="rx">THP</span>（台大 p44 之 preferred 1st line）。',
        '<b>為什麼是 12 個月</b>：一線雙標靶的關鍵試驗 <b>CLEOPATRA 明文排除</b>「從完成全身治療到診斷轉移不足 12 個月」者 —— ' +
        'THP 的療效證據裡幾乎沒有這一群病人。',
        '<span class="rx-h">二線怎麼選</span>　<span class="rx-sub">台大 p39、p44</span>',
        '<b>首選 <span class="drug">T-DXd</span></b>（trastuzumab deruxtecan）5.4 mg/kg q3W —— 台大 p39 定位為「<b>任何含 trastuzumab 之治療失敗後</b>」使用。' +
        '<b>台大指引寫「未給付」，但健保已於 2025-02-01 納入</b>（條文 9.115，HER2(+) 二線，上限 18 週期）。',
        '<span class="drug">T-DM1</span> 3.6 mg/kg q3W（健保 9.87.2：二線、須有<b>內臟轉移</b>、上限 10 個月／13 週期）。',
        '<span class="drug">lapatinib</span> 1250 mg/day PO ＋ <span class="drug">capecitabine</span> 1250 mg/m² BID D1–14 q3W' +
        '（健保 9.47 <b>限腦轉移</b>且已用過 anthracycline、taxane 與 trastuzumab 後進展者）。',
        '<span class="drug">neratinib</span> ＋ capecitabine（台大 p39）與 <span class="drug">tucatinib</span>：<b>台灣健保均未給付</b>。',
        '<b>⚠ 台灣最關鍵的一條限制：T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換</b>' +
        '（9.115、9.87.2、9.47）；<b>T-DXd 與 sacituzumab govitecan 亦互斥</b>。' +
        '<b>排治療順序前先把這條算進去</b>，第一步選錯等於少一條路。',
        '<span class="rx-h">仍要做的事</span>',
        '<b>重新切片確認 HER2 仍為陽性</b>；ER 也要重測（會影響是否併用內分泌治療）。',
        '<b>抗 HER2 藥物應與化療併用</b>（台大 p37）；有腦轉移者，藥物選擇要把中樞神經活性納入考量。'
      ];
      note = '台大 p37（抗 HER2 須與化療併用）、p39（可用藥物與給付）、p44（處方與劑量）。' +
        '「≤12 個月視同二線」為 ASCO 晚期 HER2 陽性乳癌指引之明文，ESMO 用 9–12 個月，' +
        'T-DXd 藥證與 DESTINY-Breast03 收案則用「治療中或結束 6 個月內」；' +
        '<b>台大乳癌指引未就此情境逐條規範</b>。健保條文與互斥規則見下方給付表。';
    } else if (s.pg === 'pg_cdk') {
      title = '輔助 CDK4/6 抑制劑期間或結束後復發 → 換機轉，不要原藥再挑戰';
      cls = 'rec-nonop';
      lines = [
        '<span class="rx-h">先講清楚證據的位置</span>',
        '<b>沒有任何指引直接規範這個情境</b> —— 這是本頁證據最薄弱的一格，講清楚比硬給一個答案有用。',
        'ESO-ESMO ABC 6/7 的立場是：<b>進展後繼續使用 CDK4/6 抑制劑「在臨床試驗之外不建議」</b>' +
        '（MAINTAIN 同時換藥與換內分泌骨架有小幅獲益，PACE 與 PALMIRA 只換骨架則失敗，結果互相矛盾）。' +
        'NCCN 的二線 CDK4/6 抑制劑雖為第 1 級推薦，但<b>前提是「先前未曾使用過」</b>。',
        '<span class="rx-h">唯一的第三期資料</span>',
        '<b>postMONARCH</b> 是唯一前瞻納入這個族群（含輔助期 CDK4/6 後復發者）的第三期試驗：' +
        '<span class="drug">abemaciclib</span> ＋ <b>fulvestrant</b> vs 安慰劑＋fulvestrant，' +
        '研究者評估之無惡化存活 HR 0.73（中位 6.0 vs 5.3 個月）。' +
        '<b>絕對獲益很小，而且這是「二線等級」的治療，不是一線原藥再挑戰的背書。</b>',
        '<b>同一顆藥再挑戰有負面資料</b>：AGAIN／WJOG14220B（第二期）針對 abemaciclib 進展後再用 abemaciclib，<b>主要指標未達成</b>' +
        '（中位無惡化存活 4.2 個月）。postMONARCH 中<b>只有 8% 病人先前用過 abemaciclib</b>，不能拿來替同藥再挑戰背書。',
        '<span class="rx-h">實務上怎麼走</span>',
        '<b>優先換機轉，並讓分子檢測決定方向</b>：<b>PIK3CA 突變</b> → <span class="drug">alpelisib</span> ＋ fulvestrant' +
        '（健保 9.129，2026-01-01 起；限<b>停經後</b>、曾用 CDK4/6 後進展）；' +
        '<b>PIK3CA／AKT1／PTEN 任一變異</b> → <span class="drug">capivasertib</span> ＋ fulvestrant' +
        '（健保 9.135，2026-06-01 起；同樣限停經後、曾用 CDK4/6 後進展）。⚠ <b>這兩者擇一給付</b>。',
        '<span class="drug">everolimus</span> ＋ exemestane（健保 9.36.1）亦為選項，' +
        '但<b>用過 everolimus 失敗後就不得再申請 CDK4/6</b>（9.72.6）—— 順序要先想好。',
        '<b>有 visceral crisis 或快速惡化者，一線直接用化療</b>（台大 p37）。',
        '<span class="rx-h">台灣特有的一條陷阱</span>',
        '<b>輔助 abemaciclib 治療中進展者，依健保 9.107 必須停藥，且日後「不得再使用任何 CDK4/6 抑制劑」</b>' +
        '（9.72.7 亦有相同的鎖）。<b>這條比國際指引更硬</b>，在決定要不要開始輔助 abemaciclib 時就該一起討論。',
        '<span class="rx-h">一定要做的檢查</span>',
        '<b>重新切片</b>並重測 ER／PR／HER2（順便看 HER2 是不是 low）；<b>PIK3CA／AKT1／PTEN 檢測</b>（決定上面兩條路）；' +
        '<b>gBRCA1/2 檢測</b>（台大 p5）。<b>ESR1 檢測不建議在這個時間點做</b> —— ' +
        '它主要是在轉移期 AI 壓力下後天產生，應留到<b>後續內分泌治療進展時</b>再以 ctDNA 檢測。'
      ];
      note = '台大 p22（abemaciclib 為高風險輔助選項）、p37（visceral crisis）、p5（gBRCA 檢測）。' +
        'ABC 6/7 之「進展後不建議續用 CDK4/6」、NCCN 二線 CDK4/6 之「先前未曾使用」前提、postMONARCH 與 AGAIN 之結果均為院外實證；' +
        '<b>台大乳癌指引未就此情境規範</b>。健保 9.107／9.72.7 之互鎖見下方給付表。';
    } else {
      // 輔助內分泌治療期間或結束後復發
      if (!s.pget) { idleRec(R, F, '請選擇步驟 3（復發與輔助內分泌治療的時間關係）'); return; }
      cls = 'rec-nonop';
      if (s.pget === 'et_gt12') {
        title = '完成輔助內分泌治療 >12 個月才復發 → 視為對內分泌治療仍敏感，走標準一線';
        cls = 'rec-elective';
        lines = [
          '<span class="rx-h">判讀</span>',
          '<b>不符合演算法所用的「治療中進展或結束 12 個月內復發」條件</b>，這一組對內分泌治療的反應機會最好。',
          '<span class="rx-h">一線選擇</span>',
          '<b>芳香環酶抑制劑（AI）＋ CDK4/6 抑制劑</b>為標準一線（台大 p38：中／高風險為內分泌 ＋ CDK4/6）。' +
          '<b>停經前病人須併用卵巢功能抑制。</b>',
          '<b>低風險者單用內分泌治療也是合理選項</b>（p38 之風險分層圖：低風險 → 單一藥物內分泌治療）。'
        ];
      } else {
        title = (s.pget === 'et_on' ? '仍在輔助內分泌治療中復發' : '完成輔助內分泌治療 ≤12 個月內復發') +
          ' → 一線改用 fulvestrant ＋ CDK4/6 抑制劑';
        lines = [
          '<span class="rx-h">這一格為什麼重要</span>',
          '<b>「在輔助內分泌治療中進展，或完成後 12 個月內復發」是治療演算法真正使用的界線。</b>' +
          '符合者一線<b>不用 AI，改用 <span class="drug">fulvestrant</span> ＋ CDK4/6 抑制劑</b> —— ' +
          '病人是在 AI／tamoxifen 的壓力下復發的，換內分泌骨架才有意義。',
          s.pget === 'et_on'
            ? '<b>抗性型別</b>：復發發生在輔助內分泌治療<b>前 2 年內</b>屬「原發性抗性」，<b>滿 2 年之後</b>屬「次發性抗性」' +
              '（ESO-ESMO ABC 6/7）。分類本身不改變上面的一線選擇，但影響對治療反應的期待。'
            : '<b>抗性型別</b>：ABC 第 6／7 版已把「完成後 12 個月內復發」併入次發性抗性的概括條款、不再單獨列名；' +
              '真正決定用藥的仍是這個 12 個月的界線。',
          '<span class="rx-h">先做分子檢測再決定加什麼</span>',
          '<b>PIK3CA 狀態是這個族群的第一個分岔</b>。<b>PIK3CA 突變</b>者，' +
          '<span class="drug">inavolisib</span> ＋ palbociclib ＋ fulvestrant 於此適應症有第三期證據（<b>台灣健保未收載此藥</b>）；' +
          '<b>PIK3CA／AKT1／PTEN 變異</b>者，<span class="drug">capivasertib</span> ＋ fulvestrant 之藥證即涵蓋' +
          '「輔助治療中或結束 12 個月內復發」（健保 9.135 於 2026-06-01 起給付，但<b>限停經後且曾用 CDK4/6 後進展</b>，本格病人多半還沒用過 CDK4/6，會卡住）。',
          '<b>ESR1 檢測不在這個時間點做</b> —— ESR1 突變主要在轉移期 AI 壓力下後天產生，' +
          '應留到<b>後續內分泌治療進展時</b>再以 ctDNA 檢測。<span class="drug">elacestrant</span> 也不是這一格的一線用藥' +
          '（其適應症為 ESR1 突變且已接受 ≥1 線內分泌治療後進展；<b>台灣健保未收載</b>）。',
          '<span class="rx-h">健保（9.72）要注意</span>',
          '僅涵蓋 <b>ribociclib 與 palbociclib</b>（<b>abemaciclib 於轉移性不給付</b>）；' +
          '需 ER 或 PR &gt;30%、HER2(−)、<b>無內臟危象、無腦轉移、不可只有骨轉移</b>；<b>終生上限 24 個月</b>；' +
          '停經前／圍停經期與男性須併用 AI ＋ GnRH 類似物。' +
          '條文<b>未指定停經後族群的內分泌夥伴</b>，是否可搭 fulvestrant 請先與藥劑部或審查確認。',
          '<b>有 visceral crisis 或快速惡化者，一線直接用化療</b>（台大 p37）；控制住之後再轉回內分泌治療。'
        ];
      }
      lines.push('<span class="rx-h">不論屬於哪一組，都要做的三件事</span>');
      lines.push('① <b>重新取得轉移病灶組織並重測 ER／PR／HER2</b> —— 受體狀態可能改變；順便看 HER2 是不是 low（會多一條 T-DXd 的路）。');
      lines.push('② <b>gBRCA1/2 檢測</b>：台大 p5 明列「晚期乳癌之 HER2(−) 且曾接受化療者」為檢測適應症；' +
        '但 PARP 抑制劑在台灣<b>僅三陰性給付、HR(+) 不給付</b>（健保 9.85.2）。');
      lines.push('③ 評估是否有 <b>visceral crisis</b>（器官功能已受威脅，而非只是「有內臟轉移」）—— 有的話一線直接化療（台大 p37）。');
      note = '台大 p37（HR(+) 先用內分泌治療）、p38（台灣乳房醫學會共識之風險分層與健保 CDK4/6 一線給付）、p5（gBRCA 檢測）、健保 9.72／9.85.2。' +
        '「治療中進展或結束 12 個月內復發 → fulvestrant ＋ CDK4/6」為 NCCN 與 ESMO 之演算法條文；' +
        '內分泌抗性之時間定義為 ESO-ESMO ABC 6/7 共識。<b>台大乳癌診療指引未收錄這些定義與分支</b>。';
    }

    result(R, F, cls, title, lines, note, 'palliative',
      '<div class="rec-detail">' + nhiPanelMBC() + '</div>');
  }

  /* ==========================================================
     F. 轉移性乳癌（p37–p45）
     ========================================================== */
  function mbcErPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">HR(+) / HER2(−) 轉移性乳癌<span class="rx-panel-src">p37、p38、p43</span></div>' +
      '<div class="rx-def"><b>一線的三種型態（p38，台灣乳房醫學會共識）</b>：單用內分泌治療、內分泌治療 + CDK4/6 抑制劑、或化療。' +
      '選擇依<b>疾病活性</b>（無病間隔短、內臟腫瘤負荷、症狀）與<b>對內分泌治療反應的機率</b>（抗性型別、內在亞型、生物標記）判斷。</div>' +
      rxLine('風險分層 → 一線選擇', 'p38', [
        '<b>低風險</b>：單一藥物內分泌治療（亦可內分泌 + CDK4/6）。',
        '<b>中風險</b>：內分泌 + CDK4/6 抑制劑（或單一藥物內分泌治療；或化療）。',
        '<b>高風險</b>：化療（或內分泌 + CDK4/6）。',
        '<b>健保：2019/10/1 起給付停經後婦女之 CDK4/6 抑制劑 + AI 作為轉移後第一線治療。</b>'
      ]) +
      rxLine('化療（無標準一線處方）', 'p43', [
        '<span class="drug">pegylated liposomal doxorubicin</span> 30–50 mg/m² D1 q3–4W。',
        '<span class="drug">eribulin</span> 1.4 mg/m² D1、D8。',
        '<span class="drug">capecitabine</span> 850–1000 mg/m² PO BID D1–14 q21d。',
        '<span class="drug">vinorelbine</span> 25–30 mg/m² D1、D8 q3W。',
        '<span class="rx">N-HDFL</span>：vinorelbine 25 mg/m² D1、8 ＋（5-FU 2000–2600 mg/m² ± leucovorin 300 mg/m²）24 小時輸注 D1、8，q3W。',
        '<span class="rx">NP</span>：vinorelbine 25 mg/m² ＋ cisplatin 30–35 mg/m² D1、8，q3W。',
        '<span class="rx">P-HDFL</span>：cisplatin 30–35 mg/m² ＋（5-FU 2000–2600 mg/m² ± leucovorin）D1、8，q3W。',
        '<span class="rx">TG</span>：paclitaxel 80 mg/m² ＋ gemcitabine 800 mg/m² D1、8，q3W。',
        '<span class="rx">BEEP</span>：bevacizumab 15 mg/kg D1 ＋ cisplatin 70 mg/m² D2 ＋ etoposide 70 mg/m² D2–4，q3W。'
      ]) +
      rxLine('gBRCA1/2(+)', 'p41', [
        '<span class="drug">olaparib</span> 或 <span class="drug">talazoparib</span>（HER2(−) 且 gBRCA1/2(+) 者 PFS 較佳）。',
        '<b>健保僅於 TNBC 給付；ER(+) 不給付</b>。'
      ]) +
      '<div class="rx-warn"><b>不建議作為一線的藥物（p45）</b>：<span class="drug">mitoxantrone</span>、' +
      '<span class="drug">mitomycin C</span>、<span class="drug">ixabepilone</span> —— 應保留給已多線治療、無其他選擇者。<br>' +
      '<b>合併 <span class="drug">bevacizumab</span> 與化療是合理的（p45）。</b></div>' +
      nhiPanelMBC() +
      '</div>';
  }
  function mbcHer2Panel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">HER2(+) 轉移性乳癌<span class="rx-panel-src">p37、p39、p44</span></div>' +
      '<div class="rx-def"><b>總則（p37）</b>：HER2(+) 者<b>抗 HER2 藥物應與化療併用</b>。' +
      'ER 同時陽性者，化療結束後可接內分泌治療與抗 HER2 治療併行維持。</div>' +
      rxLine('一線 First line（preferred）', 'p44', [
        '<span class="rx">THP</span>：<span class="drug">trastuzumab</span> 6 mg/kg（C1D1 8 mg/kg）＋ ' +
        '<span class="drug">pertuzumab</span> 420 mg（C1D1 840 mg）＋ ' +
        '<span class="drug">docetaxel</span> 75 mg/m² q3W，或 <span class="drug">paclitaxel</span> 80 mg/m² D1、8、15 q3W。'
      ]) +
      rxLine('二線以後 ≥ 2nd line', 'p44', [
        '<span class="drug">T-DM1</span> 3.6 mg/kg q3W。',
        '<span class="drug">T-DXd</span>（trastuzumab deruxtecan）5.4 mg/kg q3W —— p39 定位為「<b>任何含 trastuzumab 之治療失敗後</b>」使用。' +
        '<b>指引寫未給付，但健保已自 2025-02-01 納入</b>（條文 9.115：HER2(+) 二線，上限 18 週期；另涵蓋 HER2-low）。',
        '<span class="drug">lapatinib</span> 1250 mg/day PO ＋ <span class="drug">capecitabine</span> 1250 mg/m² BID D1–14 q3W（最大劑量）。',
        '<span class="drug">neratinib</span> 通常與 capecitabine 併用（p39）；<b>健保仍未給付</b>。' +
        '⚠ <b>T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換</b>；T-DXd 與 sacituzumab govitecan 亦互斥。'
      ]) +
      rxLine('可用之抗 HER2 藥物與給付', 'p39', [
        '<b>有條件給付</b>：<span class="drug">trastuzumab</span>（通常與化療併用）、' +
        '<span class="drug">pertuzumab</span>（與 trastuzumab 併用形成雙重阻斷）、<span class="drug">T-DM1</span>、' +
        '<span class="drug">lapatinib</span>（通常與 capecitabine 併用）。',
        '<b>指引當時列為未給付者</b>：<span class="drug">T-DXd</span>（<b>已於 2025-02-01 納入給付</b>，條文 9.115）、<span class="drug">neratinib</span>（<b>仍未給付</b>）。'
      ]) +
      '<div class="rx-def"><b>轉移期化療的沿用原則（p43）</b>：所有早期乳癌的處方（合併或其中單一藥物）皆可於轉移時使用；' +
      '僅在<b>已知抗藥（如快速復發）或 anthracycline 已達累積劑量</b>時不適用。</div>' +
      nhiPanelMBC() +
      '</div>';
  }
  function mbcTnbcPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">三陰性（TNBC）轉移性乳癌<span class="rx-panel-src">p40、p41、p44</span></div>' +
      '<div class="rx-def"><b>一線加入免疫治療可改善 PFS 與 OS（p40）</b>，但必須依各自的<b>伴隨式診斷</b>選病人。</div>' +
      rxLine('一線 First line', 'p40、p44', [
        '<b>IMpassion130</b>：適用 <b>PD-L1 IC(+)</b>（伴隨式診斷 <b>Ventana SP142</b>），化療夥伴為 <b>nab-paclitaxel</b>。',
        '<b>KEYNOTE-355</b>：適用 <b>PD-L1 CPS ≥ 10</b>（伴隨式診斷 <b>Dako 22C3</b>），化療夥伴為 <b>gemcitabine／platinum、nab-paclitaxel 或 paclitaxel</b>；' +
        '<span class="drug">pembrolizumab</span> 200 mg q3W 併化療。',
        '<b>NTUH 修正（p40）</b>：認同一線加入免疫治療的概念、依建議之伴隨式診斷選病人，但<b>化療夥伴可較寬</b>。',
        '<b>⚠ 轉移性 TNBC 之 <span class="drug">pembrolizumab</span> 與 <span class="drug">atezolizumab</span> 至 2026-08 仍均未給付</b>' +
        '（條文 9.69 之乳癌只有「早期三陰性乳癌」一格）。'
      ]) +
      rxLine('三線以後 ≥ 3rd line', 'p44', [
        '<span class="drug">sacituzumab govitecan</span> 10 mg/kg 3 小時輸注 D1、D8，q3W。'
      ]) +
      rxLine('gBRCA1/2(+)', 'p41', [
        '<span class="drug">olaparib</span> 或 <span class="drug">talazoparib</span>。<b>TNBC 有給付</b>（ER(+) 不給付）。',
        '<b>檢測適應症（p5）</b>：晚期乳癌之 HER2(−) 且曾於術前、術後或轉移期接受過化療者。'
      ]) +
      rxLine('化療', 'p43', [
        '早期乳癌的所有處方皆可沿用（除非已知抗藥或 anthracycline 達累積劑量）。',
        '常用單方與組合同 HR(+) 段：pegylated liposomal doxorubicin、eribulin、capecitabine、vinorelbine、' +
        '<span class="rx">N-HDFL</span>、<span class="rx">NP</span>、<span class="rx">P-HDFL</span>、<span class="rx">TG</span>、<span class="rx">BEEP</span>。',
        '<b>循序單一藥物優於合併化療</b>（p37）。'
      ]) +
      nhiPanelMBC() +
      '</div>';
  }

  function renderMbcRec() {
    var s = bcSt;
    if (s.scope !== 'mbc') return;
    var R = 'bc_mbc_rec', F = 'bc_mbc_fu';
    if (!s.msub) { idleRec(R, F, '請選擇步驟 2（生物亞型）'); return; }

    var common = [
      '<b>轉移病灶應盡可能重新切片</b>並重測 ER／PR／HER2 —— 與原發灶不同的情況並不罕見，會直接改變治療。',
      '<b>循序單一藥物優於合併化療</b>（p37）。',
      '<b>末期病人：安寧緩和照護，照會安寧共同照護團隊</b>（p37，依安寧緩和醫療條例）。'
    ];

    if (s.msub === 'm_her2') {
      result(R, F, 'rec-nonop', 'HER2(+) 轉移性乳癌 → 抗 HER2 ＋ 化療', [
        '<span class="rx-h">總則</span>　<span class="rx-sub">p37</span>',
        '<b>抗 HER2 藥物必須與化療併用</b>；一線首選 <span class="rx">THP</span>（trastuzumab + pertuzumab + taxane）。',
        '<b>ER 同時陽性者</b>：化療完成後可接內分泌治療，與抗 HER2 治療併行維持。',
        '<b>先前用過 trastuzumab 且在輔助治療中或結束 12 個月內復發者</b>：不宜重複一線雙標靶，請改走步驟 1 的' +
        '「治療中進展／治療後早期復發」分支。'
      ].concat(common), 'p37（總則）、p39（可用藥物與給付）、p44（處方與劑量）、p43（化療沿用原則）。',
        'palliative', mbcHer2Panel());
      return;
    }
    if (s.msub === 'm_tnbc') {
      result(R, F, 'rec-nonop', 'TNBC 轉移性乳癌 → 化療 ＋（合適者）一線免疫治療', [
        '<span class="rx-h">總則</span>　<span class="rx-sub">p40、p37</span>',
        '<b>化療為主軸</b>，循序單一藥物優於合併化療。',
        '<b>一線加入免疫治療可改善 PFS 與 OS</b>，但必須先做 PD-L1 伴隨式診斷（SP142 之 IC(+)，或 22C3 之 CPS ≥ 10）。' +
        '<b>兩種免疫藥物於轉移性 TNBC 至 2026-08 仍均未給付</b>（早期三陰性乳癌之 pembrolizumab 則已於 2025-06-01 納入）。',
        '<b>務必檢測 gBRCA1/2</b>（p5）—— TNBC 是台灣唯一給付 PARP 抑制劑的族群（p41）。'
      ].concat(common), 'p40（免疫治療與伴隨式診斷）、p41（PARP 抑制劑與給付）、p44（處方）、p43（化療原則）、p5（gBRCA 檢測）。',
        'palliative', mbcTnbcPanel());
      return;
    }

    // HR(+) HER2(−)
    if (!s.mcrisis) { idleRec(R, F, '請選擇步驟 3（是否有 visceral crisis 或快速惡化）'); return; }
    if (s.mcrisis === 'mc_yes') {
      result(R, F, 'rec-urgent', 'HR(+) HER2(−) ＋ visceral crisis／快速惡化 → 一線先用化療', [
        '<span class="rx-h">為什麼先化療</span>　<span class="rx-sub">p37</span>',
        '<b>p37 原文：HR(+) 者應先用內分泌治療，「除非有 visceral crisis 或快速惡化」。</b>' +
        '內分泌治療起效慢，器官功能已受威脅時來不及。',
        '<b>Visceral crisis</b> 指內臟轉移已造成器官功能不全（如肝功能急速惡化、癌性淋巴管炎導致呼吸衰竭），' +
        '而非只是「有內臟轉移」——這兩者常被混淆。',
        '<b>選擇單一藥物、循序使用</b>（p37）；早期乳癌用過的處方原則上都可沿用，' +
        '除非快速復發已知抗藥、或 anthracycline 已達累積劑量（p43）。',
        '<b>症狀控制住之後，應轉回內分泌治療</b>（± CDK4/6 抑制劑）作為維持。'
      ].concat(common), 'p37（總則與 visceral crisis 例外）、p38（風險分層）、p43（化療原則）。',
        'palliative', mbcErPanel());
      return;
    }
    result(R, F, 'rec-nonop', 'HR(+) HER2(−) 轉移性乳癌 → 一線內分泌治療 ±CDK4/6 抑制劑', [
      '<span class="rx-h">一線</span>　<span class="rx-sub">p37、p38</span>',
      '<b>內分泌治療優先</b>（p37）。依<b>疾病活性</b>與<b>對內分泌治療反應的機率</b>分為低／中／高風險：' +
      '低風險 → 單一藥物內分泌治療；中風險 → 內分泌 + CDK4/6 抑制劑；高風險 → 化療或 內分泌 + CDK4/6（p38）。',
      '<b>健保自 2019/10/1 起給付停經後婦女之 CDK4/6 抑制劑 + AI 作為轉移後第一線治療</b>（p38）。' +
      '停經前病人需併用卵巢功能抑制。',
      '<b>內分泌骨架應避開輔助期用過的藥</b>；曾在輔助內分泌治療期間或結束 12 個月內復發者，' +
      '請改走步驟 1 的「治療中進展／治療後早期復發」分支判定抗性型別。',
      '<b>gBRCA1/2(+) 者</b>可用 <span class="drug">olaparib</span> 或 <span class="drug">talazoparib</span>，' +
      '但<b>健保僅於 TNBC 給付，ER(+) 不給付</b>（p41）。'
    ].concat(common), 'p37（HR(+) 先用內分泌治療）、p38（台灣乳房醫學會共識之風險分層與健保給付）、p41（PARP 抑制劑）、p43（化療）。',
      'palliative', mbcErPanel());
  }

  /* ==========================================================
     G. 局部／區域復發（p36）
     ========================================================== */
  function renderRecurRec() {
    var s = bcSt;
    if (s.scope !== 'recur') return;
    var R = 'bc_recur_rec', F = 'bc_recur_fu';
    if (!s.rsite) { idleRec(R, F, '請選擇步驟 2（復發的位置與初始治療方式）'); return; }

    var map = {
      r_bctrt: ['單純局部復發 · 初始為 BCT + 放療', [
        '<b>全乳切除 ＋ 淋巴結分期</b>（SM + LN staging）—— <b>若先前未做過 Level I／II 腋下廓清才需要做腋下分期</b>（p36）。',
        '已放療過的乳房無法再做保留手術，這是此格必然走向全乳切除的原因。'
      ]],
      r_bctlndrt: ['單純局部復發 · 初始為 BCT + 淋巴結廓清 + 放療', [
        '<b>可行則手術；或先做全身治療，之後若可行再手術</b>（OP if possible, or systemic therapy then op if possible，p36）。',
        '腋下已廓清、乳房已放療，可用的局部手段所剩不多，因此把全身治療放到手術之前是合理選項。'
      ]],
      r_nort: ['單純局部復發 · 初始為 BCT 或全乳切除、未放療', [
        '<b>可行則手術 ＋ 放療至胸壁、鎖骨上窩（SCF）與鎖骨下窩（ICF）淋巴結</b>（p36）。',
        '先前<b>未</b>放療是這一格最重要的資訊 —— 放療的空間還在，應該用。'
      ]],
      r_ax: ['腋下復發 Axillary', [
        '<b>可行則手術；放療（若可行）照射胸壁、SCF、ICF 與腋下</b>（p36）。'
      ]],
      r_scf: ['鎖骨上復發 Supraclavicular', [
        '<b>放療（若可行）照射胸壁、SCF、ICF</b>（p36）。此處通常無手術角色。'
      ]],
      r_imn: ['內乳淋巴結復發 Internal mammary', [
        '<b>放療（若可行）照射胸壁、SCF、ICF 與內乳淋巴結</b>（p36）。'
      ]]
    };
    var m = map[s.rsite];
    var lines = ['<span class="rx-h">局部處置</span>　<span class="rx-sub">p36</span>'].concat(m[1]);
    lines.push('<span class="rx-h">全身治療</span>　<span class="rx-sub">p36 註 *</span>');
    lines.push('<b>不論屬於哪一格，都要接全身治療</b> —— p36 的表把每一條局部處置都連到同一個「Systemic tx*」方塊。' +
      '<b>註 * 明文：化療之建議依 CALOR 研究之結果</b>。');
    lines.push('全身治療的內容依<b>重新確認的</b> ER／PR／HER2 決定：HR(+) 加內分泌治療、HER2(+) 加抗 HER2 治療。' +
      '<b>復發病灶務必重新切片並重測受體</b>。');
    lines.push('<b>先排除遠處轉移</b> —— 局部／區域復發者應完成分期檢查；若同時有遠處轉移，治療目標與藥物選擇完全不同，' +
      '請回步驟 1 選「轉移性乳癌」。');
    lines.push('<b>gBRCA1/2 檢測</b>：曾接受過化療的 HER2(−) 病人為檢測適應症（p5）。');

    result(R, F, 'rec-nonop', m[0], lines,
      'p36（Local recurrence only／Regional only or Local &amp; regional recurrence 之對照表；' +
      '註 *：Chemotherapy recommended based on CALOR study results）、p5（gBRCA1/2 檢測適應症）。',
      'palliative');
  }

  /* ==========================================================
     互動
     ========================================================== */
  function bcPick(key, val, btn) {
    var s = bcSt;
    bcSel(btn);
    if (key === 'scope') {
      s.scope = val;
      s.img = s.dloc = s.dmar = null;
      s.sub = s.ctn = s.strat = s.nresp = s.surg = s.ax = s.ptn = s.resp = null;
      s.pg = s.pget = null;
      s.msub = s.mcrisis = null;
      s.rsite = null;
      bcClearSel(['bc_s_dx', 'bc_s_dcis', 'bc_s_dmar', 'bc_s2', 'bc_s3', 'bc_s4', 'bc_s5n', 'bc_s6',
        'bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n', 'bc_s_pg', 'bc_s_pget', 'bc_s_msub', 'bc_s_mcrisis', 'bc_s_rsite']);
    } else if (key === 'img') {
      s.img = val;
    } else if (key === 'dloc') {
      s.dloc = val; s.dmar = null; bcClearSel(['bc_s_dmar']);
    } else if (key === 'dmar') {
      s.dmar = val;
    } else if (key === 'sub') {
      s.sub = val;
      s.ctn = s.strat = s.nresp = s.surg = s.ax = s.ptn = s.resp = null;
      bcClearSel(['bc_s3', 'bc_s4', 'bc_s5n', 'bc_s6', 'bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n']);
    } else if (key === 'ctn') {
      s.ctn = val;
      s.strat = s.nresp = s.surg = s.ax = s.ptn = s.resp = null;
      bcClearSel(['bc_s4', 'bc_s5n', 'bc_s6', 'bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n']);
    } else if (key === 'strat') {
      s.strat = val;
      s.nresp = s.surg = s.ax = s.ptn = s.resp = null;
      bcClearSel(['bc_s5n', 'bc_s6', 'bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n']);
    } else if (key === 'nresp') {
      s.nresp = val;
      s.surg = s.ax = s.ptn = s.resp = null;
      bcClearSel(['bc_s6', 'bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n']);
    } else if (key === 'surg') {
      s.surg = val;
      s.ax = s.ptn = s.resp = null;
      bcClearSel(['bc_s7u', 'bc_s7n', 'bc_s8u', 'bc_s8n']);
    } else if (key === 'ax') {
      s.ax = val;
      s.ptn = s.resp = null;
      bcClearSel(['bc_s8u', 'bc_s8n']);
    } else if (key === 'ptn') {
      s.ptn = val;
    } else if (key === 'resp') {
      s.resp = val;
    } else if (key === 'pg') {
      s.pg = val; s.pget = null; bcClearSel(['bc_s_pget']);
    } else if (key === 'pget') {
      s.pget = val;
    } else if (key === 'msub') {
      s.msub = val; s.mcrisis = null; bcClearSel(['bc_s_mcrisis']);
    } else if (key === 'mcrisis') {
      s.mcrisis = val;
    } else if (key === 'rsite') {
      s.rsite = val;
    }
    bcRender();
  }

  function bcReset() {
    Object.keys(bcSt).forEach(function (k) { bcSt[k] = null; });
    var root = document.getElementById('bcPath');
    if (root) root.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    if (root) root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    bcRender();
  }

  function initBreastPathway() { bcReset(); }

  global.breastPathwayHTML = breastPathwayHTML;
  global.initBreastPathway = initBreastPathway;
  global.bcPick = bcPick;
  global.bcReset = bcReset;
})(window);
