/* ============================================================
   乳癌治療互動決策流程 Breast Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-08-16 全部重寫（第二版）。舊版已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 乳癌診療指引
   （NTUH Clinical Guidelines of Breast Cancer in Oncology, 2023.V1；
     文件編號 50710-2-000010，版次 14；修制訂 2023/12/28；
     癌症醫療委員會檢視通過 2026/06/16）。頁碼以 p1–p49 標於各建議。
   健保給付條文查詢日：2026-08-16。

   ── 本版遵守的六條版面規則 ────────────────────────────
   1. 沒有選之前，下游的步驟與建議框一律不出現。每次 render 先把整個
      流程關到只剩步驟 1（collapseAll），再依 state 逐層打開。
   2. 建議框只講「它正上方那一步」的結論，不放下游或上游的處置。
   3. 臨床決策用正常字；理由、試驗數據、與指引的差異一律降階成小灰字
      （li.ev）或收合（details）。
   4. 同一件事只寫一次。共用內容（內分泌治療、化療處方、腋下原則、
      放療適應症、健保條文）各自只有一個函式，其他地方指過去。
   5. 臨床術語一律用英文原詞，不要硬翻成中文（2026-08-16 使用者指定，
      推翻了同日早上「全部寫成中文」那一版）：aromatase inhibitor、
      pCR、LVI、IHC、grade、germline、visceral crisis、clip、FNA、
      core biopsy、micrometastasis、isolated tumor cells…；
      SLNB 與 ALND 維持縮寫。敘述本身仍是中文，中英之間補半形空白。
      唯一還是不要用的縮寫是 AI（會和人工智慧撞），一律寫全 aromatase inhibitor。
   6. 凡是「高風險」「符合條件」這種字眼，一定要在同一格寫出條件內容。

   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  /* ==========================================================
     0. 狀態
     ========================================================== */
  var S = {};
  var KEYS = [
    'scope',   // dx | dcis | lcis | inv | mbc | recur | prog
    'img',     // 影像分支：calc | mass | skin | axilla
    'dloc',    // 原位管癌局部治療：bct | tm
    'dmar',    // 原位管癌切緣：neg | close
    'sub',     // 亞型：erpos | her2hr | her2 | tnbc
    'ctn',     // 臨床 cT×cN 格
    'plan',    // up（直接手術）| na（先做術前藥物治療）
    'surg',    // 直接手術的乳房術式：bct | tm
    'ptn',     // 術後病理 pT×pN 格
    'nresp',   // 術前治療後：op_bct | op_tm | pd | inop
    'ypath',   // 術前治療後的病理：pcr | res_n0 | npos
    'mrisk',   // 轉移：crisis | high | mid | low
    'mline',   // 轉移線別：l1 | l2 | l3
    'rsite',   // 局部區域復發位置：local | axilla | scf | imn
    'rprev',   // 局部復發時的初始治療：bct_rt | bct_lnd_rt | nort
    'pstage'   // 治療中進展的階段：na | chemo | et | her2
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="bcPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }

  /* 一個節點 ＝ 箭頭 + 步驟卡，整包一起開關，箭頭不會單獨留在畫面上 */
  function node(id, num, q, opts, extra) {
    return '<div class="bc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="bc-node" id="' + id + '">' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div></div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }

  /* 建議條列的三個層級 */
  function H(title, src) {
    return '<span class="rx-h">' + title + '</span>' + (src ? '　<span class="rx-sub">' + src + '</span>' : '');
  }
  function EV(t) { return '@ev ' + t; }
  function SUB(items) { return '<ul class="rec-sub"><li>' + items.join('</li><li>') + '</li></ul>'; }

  function fold(summary, inner) {
    return '<details class="kps-details"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function panel(summary, inner) {
    return '<details class="rx-more"><summary>' + summary + ' ▸</summary><div class="rx-note">' + inner + '</div></details>';
  }
  /* 建議卡末尾的參考資料：和上面的建議條列用同一個 ul／同一種點點與行距，
     不要再自成一個間距不同的區塊（使用者 2026-08-16 指定）。 */
  function more() {
    var parts = [].slice.call(arguments).filter(Boolean);
    if (!parts.length) return '';
    return '<ul class="rec-detail rec-more"><li>' + parts.join('</li><li>') + '</li></ul>';
  }

  function tbl(rows) {
    return '<table>' + rows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    }).join('') + '</table>';
  }
  function drug(n) { return '<span class="drug">' + n + '</span>'; }

  /* ==========================================================
     2. T×N 決策格
     ========================================================== */
  var GCLS = { none: 'g-none', ii: 'g-ii', low: 'g-low', high: 'g-high' };

  function gridHTML(idBase, stateKey, cols, rows, groupOf, legend, note) {
    var h = '<div class="tn-wrap"><div class="tn-grid' + (cols.length === 4 ? ' tn-c4' : '') + '">';
    h += '<div class="tn-corner"></div>';
    cols.forEach(function (c) {
      h += '<div class="tn-ch">' + c[1] + (c[2] ? '<span class="tn-sub2">' + c[2] + '</span>' : '') + '</div>';
    });
    rows.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + (r[2] ? '<span class="tn-sub2">' + r[2] + '</span>' : '') + '</div>';
      cols.forEach(function (c) {
        var key = r[0] + '_' + c[0];
        h += '<button class="tn-cell ' + GCLS[groupOf(r[0], c[0])] + '" id="' + idBase + '_' + key + '" ' +
          'onclick="bcPick(\'' + stateKey + '\',\'' + key + '\',this)">' + r[3] + c[3] + '</button>';
      });
    });
    h += '</div><div class="tn-legend">';
    legend.forEach(function (l) {
      h += '<span class="tn-lg"><span class="tn-sw ' + GCLS[l[0]] + '"></span>' + l[1] + '</span>';
    });
    h += '</div>';
    if (note) h += '<div class="note">' + note + '</div>';
    return h + '</div>';
  }

  /* ---------- 2a. 臨床 cT×cN ---------- */
  var CT_ROWS = [
    ['t1ab', 'cT1a–b', '≤ 1 cm', 'T1a-b'],
    ['t1c', 'cT1c', '> 1–2 cm', 'T1c'],
    ['t2', 'cT2', '> 2–5 cm', 'T2'],
    ['t3', 'cT3', '> 5 cm', 'T3'],
    ['t4abc', 'cT4a–c', '侵犯胸壁或皮膚', 'T4a-c'],
    ['t4d', 'cT4d', '發炎性乳癌', 'T4d']
  ];
  var CN_COLS = [
    ['n0', 'cN0', '腋下摸不到、影像陰性', 'N0'],
    ['n1', 'cN1', '同側腋下、可推動', 'N1'],
    ['n23', 'cN2–3', '固定成團／內乳／鎖骨上下', 'N2-3']
  ];
  var CTN = {
    her2hr: { t1ab: ['none', 'low', 'high'], t1c: ['ii', 'low', 'high'], t2: ['low', 'low', 'high'], t3: ['low', 'high', 'high'], t4abc: ['high', 'high', 'high'], t4d: ['high', 'high', 'high'] },
    her2: { t1ab: ['none', 'low', 'high'], t1c: ['low', 'low', 'high'], t2: ['low', 'low', 'high'], t3: ['low', 'high', 'high'], t4abc: ['high', 'high', 'high'], t4d: ['high', 'high', 'high'] },
    tnbc: { t1ab: ['none', 'low', 'high'], t1c: ['ii', 'low', 'high'], t2: ['low', 'low', 'high'], t3: ['low', 'high', 'high'], t4abc: ['high', 'high', 'high'], t4d: ['high', 'high', 'high'] },
    erpos: { t1ab: ['none', 'ii', 'high'], t1c: ['none', 'ii', 'high'], t2: ['ii', 'ii', 'high'], t3: ['low', 'high', 'high'], t4abc: ['high', 'high', 'high'], t4d: ['high', 'high', 'high'] }
  };
  var CTN_LEGEND = [
    ['none', '直接開刀'],
    ['ii', '兩條路都可以'],
    ['low', '建議先給藥'],
    ['high', '一定要先給藥']
  ];
  function ctnGroup(r, c) {
    return CTN[S.sub][r][c === 'n0' ? 0 : (c === 'n1' ? 1 : 2)];
  }

  /* ---------- 2b. 術後病理 pT×pN ---------- */
  var PT_ROWS = [
    ['t1mi', 'pT1mi', '≤ 1 mm', 'T1mi'],
    ['t1a', 'pT1a', '> 1–5 mm', 'T1a'],
    ['t1b', 'pT1b', '> 5–10 mm', 'T1b'],
    ['t1c', 'pT1c', '> 10–20 mm', 'T1c'],
    ['t2', 'pT2', '> 20–50 mm', 'T2'],
    ['t3', 'pT3', '> 50 mm', 'T3'],
    ['t4', 'pT4', '侵犯胸壁或皮膚', 'T4']
  ];
  var PN_COLS = [
    ['n0', 'pN0', '無轉移', 'N0'],
    ['n1mi', 'pN1mi', 'micrometastasis 0.2–2 mm', 'N1mi'],
    ['n1', 'pN1', '1–3 顆', 'N1'],
    ['n23', 'pN2–3', '≥ 4 顆', 'N2-3']
  ];
  var PTN = {
    her2hr: { t1mi: ['none', 'ii', 'high', 'high'], t1a: ['none', 'ii', 'high', 'high'], t1b: ['ii', 'low', 'high', 'high'], t1c: ['low', 'low', 'high', 'high'], t2: ['low', 'low', 'high', 'high'], t3: ['low', 'low', 'high', 'high'], t4: ['high', 'high', 'high', 'high'] },
    tnbc: { t1mi: ['none', 'ii', 'low', 'high'], t1a: ['ii', 'ii', 'low', 'high'], t1b: ['ii', 'low', 'low', 'high'], t1c: ['low', 'low', 'low', 'high'], t2: ['low', 'low', 'low', 'high'], t3: ['low', 'low', 'low', 'high'], t4: ['high', 'high', 'high', 'high'] },
    erpos: { t1mi: ['none', 'low', 'low', 'high'], t1a: ['none', 'low', 'low', 'high'], t1b: ['none', 'low', 'low', 'high'], t1c: ['ii', 'low', 'low', 'high'], t2: ['ii', 'low', 'low', 'high'], t3: ['low', 'low', 'low', 'high'], t4: ['high', 'high', 'high', 'high'] }
  };
  PTN.her2 = PTN.her2hr;

  var PTN_LEGEND = {
    her2hr: [['none', '化療加抗 HER2：給或不給都行'], ['ii', '可以考慮化療加抗 HER2'], ['low', '要化療加抗 HER2'], ['high', '再加上 pertuzumab']],
    erpos: [['none', '內分泌治療就夠'], ['ii', '要不要加化療看復發風險'], ['low', '通常化療加內分泌治療'], ['high', '化療加內分泌治療，並考慮加強']],
    tnbc: [['none', '可以不化療'], ['ii', '化療給或不給都行'], ['low', '要化療'], ['high', '化療，並考慮加強']]
  };
  PTN_LEGEND.her2 = PTN_LEGEND.her2hr;

  function ptnGroup(r, c) {
    return PTN[S.sub][r][c === 'n0' ? 0 : (c === 'n1mi' ? 1 : (c === 'n1' ? 2 : 3))];
  }

  /* ==========================================================
     3. 共用參考區塊 —— 每一段只在這裡定義一次
     ========================================================== */

  /* 3a. 內分泌治療（p23、p24） */
  function etReference() {
    return fold('內分泌治療怎麼排？<b>停經前與停經後的完整處方</b>（p23、p24）', tbl([
      ['先確認<br>受體是否陽性',
        '<b>ER ≥ 10%</b> → 用內分泌治療。<br>' +
        '<b>1% ≤ ER &lt; 10%</b> → 用或不用都在指引內。<br>' +
        '<b>ER &lt; 1%</b> → 不用。<br>' +
        '<b>ER 陰性但 PR &gt; 10%</b> → 用或不用都在指引內。'],
      ['停經前',
        '<b>tamoxifen 至少 5 年</b>。5 年之後：<br>' +
        '· 仍停經前或無法確定 → 可再 5 年 tamoxifen（合計 10 年）。<br>' +
        '· 已停經 → 換 <b>aromatase inhibitor</b>（aromatase inhibitor）再 5 年，或再 5 年 tamoxifen。<br>' +
        '· 已做雙側卵巢切除 → 之後照停經後原則走。<br>' +
        '· <b>高風險者</b>可用 GnRH 類似物加 aromatase inhibitor 或 tamoxifen 共 5 年。'],
      ['停經後<br>（四選一）',
        '① <b>aromatase inhibitor 5 年</b>；<br>' +
        '② aromatase inhibitor 2–3 年後換 tamoxifen，合計最多 10 年；<br>' +
        '③ tamoxifen 2–3 年後換 aromatase inhibitor 5 年，合計 7–8 年；<br>' +
        '④ tamoxifen 5 年後，再 5 年 tamoxifen 或 5 年 aromatase inhibitor。'],
      ['什麼時候開始', '有做化療的話，<b>內分泌治療要等化療結束後才開始</b>（p17）。'],
      ['吃藥期間要追什麼',
        '· 吃 tamoxifen <b>且子宮還在</b> → 每年婦科評估。<br>' +
        '· 吃 aromatase inhibitor → 定期骨密度檢查。<br>' +
        '· <b>心血管疾病高風險或已有骨質疏鬆者，aromatase inhibitor 要謹慎使用</b>。'],
      ['指引與現況不符的一處',
        '指引 p24 寫骨密度檢查「未給付」。<b>實際上有給付</b> —— 醫療服務給付項目 <b>33064B</b> 適應症第 5 項就是' +
        '「乳癌病人接受 Aromatase Inhibitors 治療前與治療後」。兩次檢查之間有年限限制、終生也有次數上限。']
    ]));
  }

  /* 3b. 化療處方（p28–p31） */
  function chemoReference() {
    return fold('化療處方要開哪一個？<b>院內常用處方的藥名、劑量與療程</b>（p28–p31）', tbl([
      ['怎麼選強度',
        '院內共識：<b>除了強烈建議用第三代處方的病人以外，原則上只建議「要化療」或「不必化療」，' +
        '強度由主治醫師與病人討論後共同決定</b>（p28）。<br>' +
        '第二代比第一代約再降 15% 的相對復發率，第三代比第二代再降 15%。' +
        '風險因子中<b>最重要的是腫瘤大小、淋巴結轉移顆數、grade</b>，再加年齡、ER、PR、HER2、Ki-67。'],
      ['第一代',
        '<b>CMF（classical）</b>：cyclophosphamide 100 mg/m² 口服 D1–14 ＋ methotrexate 40 mg/m² D1、D8 ＋ ' +
        '5-FU 600 mg/m² D1、D8；<b>每 28 天一次，共 6 次</b>。<br>' +
        '<b>CMF（modified）</b>：cyclophosphamide 600 ＋ methotrexate 40 ＋ 5-FU 600 mg/m²，全部 D1；<b>每 21 天一次，共 6 次</b>。<br>' +
        '<b>AC ×4</b>：doxorubicin 60 ＋ cyclophosphamide 500–600 mg/m² D1；<b>每 21 天一次，共 4 次</b>。<br>' +
        '<b>EC ×4</b>：epirubicin 75–90 ＋ cyclophosphamide 500–600 mg/m² D1；<b>每 21 天一次，共 4 次</b>。'],
      ['第二代',
        '<b>CEF</b>：cyclophosphamide 500–600 ＋ epirubicin 75–100 ＋ 5-FU 500–600 mg/m² D1；<b>每 21 天一次，共 6 次</b>。<br>' +
        '<b>FAC</b>：cyclophosphamide 500–600 ＋ doxorubicin 60 ＋ 5-FU 500 mg/m² D1；<b>每 21 天一次，共 6 次</b>。<br>' +
        '<b>AC-T／EC-T</b>（CALGB9344、BCIRG-005）：先 cyclophosphamide 500–600 ＋ epirubicin 75–100' +
        '（或 doxorubicin 60）mg/m² D1 ×4，再接 paclitaxel 175–225（或 docetaxel 75–100）mg/m² D1 ×4；' +
        '<b>全部每 21 天一次，合計 8 次</b>。<br>' +
        '<b>TC ×4–6</b>（USO9735）：docetaxel 75 ＋ cyclophosphamide 500–600 mg/m² D1；<b>每 21 天一次，共 4–6 次</b>。<br>' +
        '<b>A-CMF／E-CMF</b>：doxorubicin 或 epirubicin 單用數個週期後接 CMF。<b>指引只列名稱，沒有給劑量與次數。</b>'],
      ['第三代',
        '<b>AC-wT</b>（E1199）：cyclophosphamide 500–600 ＋ doxorubicin 60（或 epirubicin 75–90）mg/m² D1，' +
        '<b>每 21 天 ×4</b>；再接 paclitaxel 80 mg/m² D1、D8、D15，<b>共 12 劑</b>。<br>' +
        '<b>TAC</b>（BCIRG001）：docetaxel 75 ＋ doxorubicin 50 ＋ cyclophosphamide 500 mg/m² D1；' +
        '<b>每 21 天一次，共 6 次，需要 G-CSF 支持</b>。<br>' +
        '<b>TEC</b>：docetaxel 75 ＋ epirubicin 70 ＋ cyclophosphamide 500 mg/m² D1；' +
        '<b>每 21 天一次，共 6 次，需要 G-CSF 支持</b>。<br>' +
        '<b>FEC-T</b>（PACS01）：第 1–4 次 cyclophosphamide 600 ＋ epirubicin 75 ＋ 5-FU 600 mg/m² D1；' +
        '第 5–8 次 docetaxel 75 mg/m² D1；<b>全部每 21 天一次</b>。<br>' +
        '<b>劑量密集 ATC</b>（CALGB9741）：<b>指引只列名稱，沒有給劑量與間隔</b>；此處不自行補上。'],
      ['什麼時候開始', '<b>除非傷口癒合不良或有其他併發症，希望在術後六至八週內開始化療</b>（p28）。'],
      ['院內兩點<br>特別說明',
        'NCCN 推薦的輔助處方裡<b>沒有 liposomal doxorubicin</b>，本院指引也不含。若病人堅持以它取代 doxorubicin 或 epirubicin，' +
        '基於有治療優於沒有治療，仍可接受，但<b>病歷須詳細註明</b>（p28）。<br>' +
        'docetaxel 與 paclitaxel 可互換，以每 3 週 docetaxel 與每週 paclitaxel 為優先（E1199）。']
    ]));
  }


  /* 3c. 腋下手術原則（p8、p13、p14） */
  function axillaReference() {
    return fold('腋下要開到什麼程度？<b>直接手術與術前治療後的規則不一樣</b>（p8、p13、p14）', tbl([
      ['直接手術<br>臨床 cN0', '<b>做 SLNB</b>（sentinel lymph node biopsy）。'],
      ['直接手術<br>臨床腋下陽性',
        '<b>做 ALND</b>（axillary lymph node dissection）。<br>' +
        '術前對可疑的淋巴結<b>應先做 FNA</b> 確認（p10 註 b）。'],
      ['sentinel node 1–2 顆陽性<br>可不可以免廓清？',
        '<b>五個條件要全部符合</b>（ACOSOG Z0011，p8）：<br>' +
        '① 臨床 cN0，sentinel node <b>只有 1–2 顆</b>陽性；② <b>T1 或 T2</b>；' +
        '③ 接受<b>乳房保留手術</b>且<b>已計畫術後放療</b>；④ 會接受<b>足量的輔助全身治療</b>；' +
        '⑤ <b>尤其是 ER 陽性者</b>。<br>' +
        '<b>五條全中才可以省略。全乳切除的人不適用</b>（第 ③ 條就不符合）。'],
      ['術前治療後<br>原本 cN0',
        '<b>做 SLNB 即可</b>；<b>但治療期間臨床惡化者不適用</b>，要做廓清（p13）。'],
      ['術前治療後<br>原本 cN1–2、治療後轉陰',
        '可以只做 SLNB，但<b>必須是「足量」的取樣</b>，定義是二選一（p14）：<br>' +
        '① <b>雙示蹤劑且取下 ≥ 3 顆</b>淋巴結；或 ② SLNB <b>加上</b>取出術前做過標記的那一顆。<br>' +
        '結果 pN0 → 不必廓清。<br>' +
        '<b>只要有任何一顆陽性（含 micrometastasis pN1mi 與 isolated tumor cells pN0(i+)）→ 要做 ALND</b>。'],
      ['術前治療後<br>腋下仍陽性', '<b>直接做 ALND</b>（p14）。'],
      ['clip 的實務問題',
        '<b>目前的 clip 多半在超音波下看不到，需要乳房攝影導引定位</b>（p13）。' +
        '要做標記就得先跟放射科講好定位方式。']
    ]));
  }

  /* 3d. 放射治療適應症（p47、p48、p49） */
  function rtReference() {
    return fold('放射治療的<b>完整適應症</b>（p47、p48、p49）', tbl([
      ['乳房保留手術後',
        '<b>原則上所有人都要做全乳放射治療</b>（p47）。<br>' +
        '唯一可以討論省略的：<b>年齡 &gt; 70、臨床 cN0、切緣乾淨、荷爾蒙受體陽性且正在服用 tamoxifen 或 aromatase inhibitor</b>' +
        '—— 絕對獲益很小，<b>但放療仍然改善局部控制</b>。'],
      ['全乳切除後<br>確定要照胸壁',
        '符合<b>任何一項</b>即需要（p47）：<b>腋下淋巴結陽性 ≥ 4 顆</b>；<b>切緣陽性</b>；<b>侵犯皮膚</b>；' +
        '<b>侵犯胸壁</b>（只碰到胸肌筋膜不算）；<b>T3 且腋下淋巴結陽性</b>。<br>' +
        '腋下淋巴結陽性 1–3 顆 → <b>依風險因子個案判斷</b>。'],
      ['sentinel node 1–2 顆陽性<br>但沒做完整廓清',
        '情境：臨床 cN0、全乳切除加 SLNB、pT1–2、sentinel node 1–2 顆陽性（p48）。<br>' +
        '<b>原則上應完成 ALND。</b>若取下的淋巴結不足 10 顆：<br>' +
        '· <b>三陰性或有 LVI</b>（lymphovascular invasion）且陽性仍是 1–2 顆 → 建議完成廓清。<br>' +
        '· 非三陰性且無 LVI → 仍建議廓清，除非外科判斷困難、或病人充分討論後仍拒絕。<br>' +
        '· 不做廓清時，依 AMAROS 試驗<b>改做區域放射治療（腋下加鎖骨上）± 胸壁</b>。'],
      ['術前治療後<br>可以考慮省略',
        '達到 <b>pCR</b>，且符合其中一項（p49）：① 荷爾蒙受體陽性；② HER2 陽性且原本是 cT 任何 N0–1；' +
        '③ 三陰性且原本是 cT1–2N0。'],
      ['術前治療後<br>應該要做',
        '① 沒有達到 pCR，且依<b>原本的臨床分期</b>本來就有適應症；② <b>術前治療後淋巴結仍陽性</b>；' +
        '③ <b>cT1–2N1 的 HER2 陽性且未達 pCR</b>（p49）。'],
      ['要請放射腫瘤科<br>評估的灰色地帶',
        '① cT1–2N1 的荷爾蒙受體陽性或三陰性，<b>只剩乳房內殘存病灶</b>；② <b>cT3N0 但術後是 ypT1–2N0</b>（p49）。'],
      ['順序', '需要化療時，<b>放療排在化療之後</b>（p10）。']
    ]));
  }

  /* 3e. 健保給付：早期乳癌 */
  function nhiEarly() {
    return panel('健保給付 · 早期乳癌 —— <b>指引 2023 年寫「未給付」的藥有五項已經反轉</b>',
      '<div class="rx-warn"><b>台大指引（2023.V1）當時的敘述</b>：trastuzumab 只給付淋巴結陽性者（p17）；' +
      'pertuzumab、T-DM1、neratinib 於早期乳癌均未給付（p17、p18）；abemaciclib 與 TS-1 未給付（p22）；' +
      'olaparib 未給付（p21）；pembrolizumab 未給付（p19、p20）。<br>' +
      '<b>其中五項已經不成立。</b>以下是健保署藥品給付規定第 9 節的現行條文，查詢日 2026-08-16。</div>' +
      '<ul class="rx-items">' +
      '<li>' + drug('trastuzumab') + '（<b>9.18.1</b>）：<b>已經不限淋巴結陽性</b>。淋巴結陰性者亦納入 —— ' +
      '術前情境限腫瘤 &gt; 2 cm 且 ER 陰性；直接手術者限 ER 陰性且腫瘤 &gt; 0.5 cm，或 ER 陽性且腫瘤 &gt; 1 cm。' +
      '需事前審查，每 24 週檢附療效再申請。<br>' +
      '<b>陷阱：ER 陽性淋巴結陰性、與直接手術的淋巴結陰性這兩支限用生物相似藥</b>' +
      '（Eirgasun 420 mg／Herzuma／Ogivri），原廠 Herceptin 不涵蓋。皮下劑型 600 mg 同屬 9.18。</li>' +
      '<li>' + drug('pertuzumab') + '（<b>9.70.1</b>）與 Phesgo（9.112.1）：<b>2024-12-01 起給付</b> —— ' +
      'HER2 IHC 3+ 或 FISH 陽性、<b>腋下淋巴結有轉移</b>、無遠處轉移。' +
      '術前用且達 pCR 者可續用，直接手術者也可作輔助治療；與 trastuzumab、Phesgo <b>合併計算上限 18 個週期</b>。' +
      '<b>淋巴結陰性仍不給付。</b></li>' +
      '<li>' + drug('T-DM1') + '（<b>9.87.1</b>）：<b>2024-08-01 起給付</b>，限術前治療後仍有殘存病灶者 —— ' +
      '需已接受 ≥ 6 週期化療（其中 taxane ≥ 3 週期）與術前 trastuzumab ≥ 3 週期，且<b>腋下淋巴結有轉移</b>，' +
      '或<b>淋巴結陰性但 ER 陰性且腫瘤 &gt; 2 cm</b>。上限 14 週期；須術後 12 週內申請；' +
      'LVEF &lt; 45% 或有症狀心衰竭者不可用。<b>健保條件比 KATHERINE 試驗窄。</b></li>' +
      '<li>' + drug('abemaciclib') + '（<b>9.107</b>）：<b>2024-03-01 起於輔助治療給付</b> —— 成年<b>女性</b>、' +
      'ER 或 PR &gt; 30%、HER2 陰性，且<b>淋巴結陽性並符合下列其一</b>：' +
      '<b>腋下淋巴結 ≥ 4 顆</b>／<b>1–3 顆且腫瘤 ≥ 5 cm</b>／<b>1–3 顆且 grade 3</b>。' +
      '須完成標準輔助化療與放療後才申請；先前內分泌治療不超過 12 週；<b>須術後 16 個月內開始</b>；最長 2 年。<br>' +
      '<b>台灣不看 Ki-67</b>（與 monarchE 試驗不同），<b>男性不在條文內</b>。' +
      '⚠ 用了這條之後進展者，<b>日後不得再申請任何 CDK4/6 抑制劑</b>（9.72.7）。</li>' +
      '<li>' + drug('olaparib') + '（<b>9.85.4</b>）：<b>2025-06-01 起給付</b> —— <b>germline</b> BRCA1/2 突變、HER2 陰性。' +
      '需完成 ≥ 6 週期含 anthracycline 或 taxane 的化療，並於最後一次治療後 12 週內開始，最長 1 年。<br>' +
      '<b>高風險定義（健保版）</b>：三陰性 —— 術前化療後未達 pCR，或直接手術後 ≥ pN1，或 pN0 但腫瘤 ≥ 2 cm；' +
      '荷爾蒙受體陽性且 HER2 陰性 —— 術前化療後未達 pCR，或直接手術後<b>淋巴結 ≥ 4 顆</b>。' +
      '<b>健保不走 CPS+EG 分數那條路。</b><br>' +
      '⚠ 輔助情境 <b>olaparib 與 pembrolizumab 只能擇一給付</b>。</li>' +
      '<li>' + drug('pembrolizumab') + '（<b>9.69.2(7)</b>）：<b>2025-06-01 起於早期三陰性乳癌給付</b> —— ' +
      '非轉移的第 II 至 IIIb 期（cT1cN1–2 或 T2–4N0–2）。處方固定：pembrolizumab ＋ carboplatin ＋ paclitaxel ×4，' +
      '再接 pembrolizumab ＋ cyclophosphamide ＋（doxorubicin 或 epirubicin）×4。' +
      '<b>輔助期只給付未達 pCR 者</b>（單用 ≤ 9 週期）；術前加輔助合計上限 17 週期。' +
      '<b>此適應症不需檢附 PD-L1 報告。</b>⚠ 術前治療中進展、或輔助期復發，即不得續用。</li>' +
      '<li>' + drug('neratinib') + '：<b>仍未給付</b>（健保藥品清單查無此成分）。指引 p18 的敘述仍然正確。</li>' +
      '<li>' + drug('capecitabine') + ' 的術後強化與 ' + drug('TS-1') + '：<b>仍未給付</b> —— ' +
      'capecitabine 條文 9.17 的乳癌適應症只到「局部晚期／轉移性」，沒有輔助那一條；TS-1 條文 9.46 完全沒有乳癌。</li>' +
      '<li><b>輔助用 ribociclib（NATALEE 試驗）</b>：<b>未給付</b> —— ribociclib 只有 9.72（轉移性）一條。' +
      '<b>台灣可用於輔助治療的 CDK4/6 抑制劑只有 abemaciclib</b>，這個不對稱很容易踩到。</li>' +
      '<li><b>Oncotype DX、MammaPrint 等多基因復發風險檢測</b>：<b>自費</b>。' +
      '健保 2024-05-01 起的次世代定序給付，乳癌那一格<b>只涵蓋三陰性乳癌的 BRCA 檢測</b>。</li>' +
      '<li><b>輔助用雙磷酸鹽或 denosumab</b>（非轉移的骨骼保護）：<b>不給付</b> —— ' +
      'zoledronate 4 mg（5.5.3.2.1）與 denosumab 120 mg（5.5.4）都只涵蓋蝕骨性骨轉移。</li>' +
      '</ul>' +
      '<div class="rx-def"><b>院內立場（p21）</b>：研究顯示<b>不論淋巴結是否陽性</b>，術前或術後 trastuzumab 併化療都顯著降低 ' +
      'HER2 陽性病人的復發率與死亡率。因此對<b>淋巴結陰性但腫瘤有一定大小或風險較高</b>者，團隊仍建議使用。' +
      'HER2 陽性病人的化療處方，<b>文獻上可用但 NCCN 未提及者（如 CMF、TC）本院亦認為可用</b>。</div>' +
      '<div class="rx-warn"><b>實務提醒</b>：健保並未給付所列全部藥物，實際劑量與療程<b>受病人經濟狀況限制</b>（p35 註二）。' +
      'trastuzumab 標準療程為 1 年，但<b>因給付因素，9–12 週亦被視為可接受</b>（p34）。<br>' +
      '<b>條文會變，開藥前請以健保署當期公告為準。</b>查詢日 2026-08-16。</div>');
  }

  /* 3f. 健保給付：轉移性乳癌 */
  function nhiMeta() {
    return panel('健保給付 · 轉移性乳癌 —— <b>2024–2026 有多項新增，也有多組互斥</b>',
      '<div class="rx-warn"><b>台大指引（2023.V1）當時的敘述</b>：CDK4/6 抑制劑加 aromatase inhibitor 自 2019-10-01 給付停經後第一線（p38）；' +
      'trastuzumab、pertuzumab、T-DM1、lapatinib 為有條件給付，<b>T-DXd 與 neratinib 未給付</b>（p39）；' +
      'PARP 抑制劑<b>只有三陰性給付</b>（p41）；pembrolizumab 與 atezolizumab 於三陰性均未給付（p40）。' +
      '以下為現行條文，查詢日 2026-08-16。</div>' +
      '<ul class="rx-items">' +
      '<li><b>CDK4/6 抑制劑</b>（<b>9.72</b>）：<b>只涵蓋 ribociclib 與 palbociclib</b>，<b>abemaciclib 不在其中</b>。' +
      '條件：ER 或 PR &gt; 30%、HER2 陰性、<b>沒有 visceral crisis、沒有腦轉移、不可以只有骨轉移</b>。' +
      '停經後（9.72.1）需年齡 ≥ 55、曾雙側卵巢切除、或 FSH 與 estradiol 達停經後範圍；' +
      '停經前、圍停經期與<b>男性</b>（9.72.2，2025-07-01 新增男性）須併用 aromatase inhibitor 加 GnRH 類似物。' +
      '<b>已不限第一線</b>；<b>終生上限 24 個月</b>，兩種藥只能擇一。<br>' +
      '⚠ 曾用 everolimus 失敗者不得申請；<b>輔助期用過 abemaciclib 失敗者亦不得申請</b>（9.72.7）。</li>' +
      '<li>' + drug('abemaciclib') + '：<b>轉移性不給付</b> —— 它只有 9.107（輔助）一條。藥有給付，但只在輔助情境。</li>' +
      '<li>' + drug('everolimus') + '（<b>9.36.1 第 4 項</b>）：與 exemestane 併用；荷爾蒙受體陽性、HER2 陰性、' +
      '<b>無 visceral crisis</b>、曾用<b>非固醇類</b> aromatase inhibitor 失敗且未曾用過 exemestane。' +
      '⚠ 用了它失敗後<b>不得再申請 CDK4/6 抑制劑</b>。</li>' +
      '<li>' + drug('alpelisib') + '（<b>9.129</b>，2026-01-01 新增）：與 fulvestrant 併用；<b>停經後</b>、曾用 CDK4/6 抑制劑後進展、' +
      'ER 或 PR &gt; 30%、HER2 陰性、<b>PIK3CA 突變</b>。</li>' +
      '<li>' + drug('capivasertib') + '（<b>9.135</b>，2026-06-01 新增）：與 fulvestrant 併用；<b>停經後</b>、曾用 CDK4/6 抑制劑後進展、' +
      '荷爾蒙受體陽性、HER2 陰性、<b>PIK3CA／AKT1／PTEN 任一變異</b>。⚠ 與 alpelisib 加 fulvestrant <b>擇一給付</b>。</li>' +
      '<li>' + drug('elacestrant') + '：<b>未給付</b>（健保藥品清單查無此成分）。</li>' +
      '<li><b>抗 HER2 藥物</b>：trastuzumab（9.18.2）；pertuzumab 與 Phesgo（9.70.2／9.112.2，<b>限第一線</b>、上限 18 個月）；' +
      'T-DM1（9.87.2，<b>第二線</b>、上限 10 個月／13 週期）；<b>T-DXd（9.115，2025-02-01 起給付）</b> —— ' +
      'HER2 陽性第二線（上限 18 週期），以及 <b>HER2 低表現</b>（ER 與 PR 皆陰性且 HER2 IHC 1+，或 2+ 但 ISH 陰性）的晚期乳癌；' +
      'lapatinib（9.47，<b>限腦轉移</b>且已用過 anthracycline、taxane 與 trastuzumab 後進展）。<b>tucatinib 未給付。</b><br>' +
      '⚠ <b>最重要的一條：T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換</b>；' +
      '<b>T-DXd 與 sacituzumab govitecan 也互斥</b>。排治療順序前先把這條算進去。</li>' +
      '<li><b>PARP 抑制劑</b>（<b>9.85.2</b>）：olaparib 與 talazoparib <b>仍只限三陰性</b>' +
      '（ER、PR、HER2 皆陰性）且 <b>germline</b> BRCA1/2 突變。' +
      '<b>荷爾蒙受體陽性的 BRCA 突變轉移性乳癌仍不給付。</b>兩藥擇一。</li>' +
      '<li><b>免疫治療</b>（<b>9.69</b>）：<b>轉移性三陰性乳癌仍不給付</b> —— 條文中乳癌只有「早期三陰性乳癌」一格。' +
      'KEYNOTE-355 與 IMpassion130 的處方<b>皆不在給付範圍</b>。</li>' +
      '<li>' + drug('sacituzumab govitecan') + '（<b>9.106</b>）：三陰性（2024-02-01）—— 已失敗 ≥ 2 線全身治療' +
      '（其中 ≥ 1 線用於晚期）、ECOG ≤ 1、曾用 taxane、<b>未曾用過 T-DXd</b>。' +
      '荷爾蒙受體陽性且 HER2 陰性（2025-10-01 新增）—— 無活動性腦轉移、' +
      '<b>曾用 CDK4/6 抑制劑 ≤ 12 個月且有內臟轉移</b>、且已接受 ≥ 2 線轉移性化療。</li>' +
      '<li>' + drug('bevacizumab') + '（9.37）：<b>乳癌沒有適應症</b>。指引 p43 的 BEEP 處方與 p45「合併 bevacizumab 是合理的」屬<b>自費</b>。</li>' +
      '<li>' + drug('eribulin') + '（9.48.1）：轉移性乳癌且<b>先前已用過 anthracycline 與 taxane</b>；每 3 個週期評估反應並記錄。</li>' +
      '<li><b>骨轉移</b>：zoledronate 4 mg（5.5.3.2.1）與 denosumab 120 mg（5.5.4）皆給付，' +
      '但<b>限蝕骨性骨轉移</b>。（這兩條在第 5 節不在第 9 節，所以常找不到。）</li>' +
      '</ul>' +
      '<div class="rx-warn"><b>條文會變，開藥前請以健保署當期公告為準。</b>查詢日 2026-08-16。</div>');
  }

  /* 3g. 連 SLNB 都可以省略的其他情況 */
  function omitSlnbReference() {
    return fold('連 SLNB 都可以省略的其他情況（<b>台大指引未列，屬院外實證</b>）', tbl([
      ['小葉原位癌', '以追蹤為主，<b>不做腋下分期</b>（p7）。多形性小葉原位癌比照原位管癌處理。'],
      ['預防性乳房切除', '意外發現癌症 &lt; 5%、淋巴結轉移約 1%。'],
      ['乳房肉瘤、血管肉瘤<br>惡性葉狀腫瘤', '走血行轉移，不做腋下分期。'],
      ['年長且低風險',
        '<b>全部符合</b>：年齡 ≥ 70、臨床腋下陰性、T1（≤ 2 cm）、荷爾蒙受體陽性且 HER2 陰性、' +
        '將接受內分泌治療、接受乳房保留手術。依據 CALGB 9343。<br>' +
        '<b>若腋下結果會改變放療或全身治療決策，仍應個案考慮。</b>'],
      ['停經後、小腫瘤<br>腋下超音波陰性',
        '<b>七項全部符合</b>（ASCO 2025 據 INSEMA 試驗把門檻由 ≥ 70 降到 ≥ 50）：' +
        '停經後、年齡 ≥ 50、<b>術前腋下超音波陰性</b>、grade 1–2、腫瘤 ≤ 2 cm、' +
        '荷爾蒙受體陽性且 HER2 陰性、接受乳房保留手術<b>並做放療</b>。'],
      ['<b>絕對不可以省略</b>',
        '<b>三陰性與 HER2 陽性</b>；<b>男性乳癌</b>；grade 3、年齡 &lt; 50、cT2 以上、小葉癌；' +
        '<b>臨床腋下陽性</b>；<b>發炎性乳癌</b>（SLNB 為禁忌，應做 ALND）；' +
        '<b>術前治療期間臨床惡化者</b>（p13）。<br>' +
        '<b>腫瘤小本身不是省略的理由</b> —— 必須另外符合上面某一整組條件。'],
      ['總原則',
        '上面所有條件背後的共同原則只有一句：<b>腋下的結果不會改變後續治療</b>，或<b>病人的預期壽命有限</b>。' +
        '反過來說，只要腋下結果會改變放療或全身治療的決定，就不該省略。']
    ]));
  }

  /* 3h. 追蹤原則（p27） */
  function followupHTML(kind) {
    if (kind === 'insitu') {
      return '<div class="fu-label">追蹤原則 · 原位癌（p27）</div><ul class="fu-list">' +
        '<li>門診每 3–6 個月一次共 5 年，之後每年一次；<b>每年乳房影像是必要的</b>。</li>' +
        '<li><b>原位管癌完全不做全身分期</b> —— 電腦斷層、正子造影、骨骼掃描都不考慮（p3）。</li>' +
        '<li>服用 tamoxifen 者每年婦科評估。</li>' +
        '<li>日後若出現侵襲性復發，回步驟 1 改選「侵襲性乳癌」重新評估。</li></ul>';
    }
    if (kind === 'meta') {
      return '<div class="fu-label">追蹤與支持治療（p27、p37）</div><ul class="fu-list">' +
        '<li>定期評估治療反應與副作用；疾病進展就換次線治療或考慮臨床試驗。</li>' +
        '<li>轉移期<b>不常規以腫瘤標記追蹤</b>；影像依臨床需要安排。</li>' +
        '<li>骨轉移者評估骨骼保護用藥（<b>健保限蝕骨性骨轉移</b>）。</li>' +
        '<li><b>末期病人：安寧緩和照護，照會安寧共同照護團隊</b>（p37）。</li>' +
        '<li>最終治療決定仍取決於病人與醫師的討論。</li></ul>';
    }
    return '<div class="fu-label">追蹤原則（p27）</div><ul class="fu-list">' +
      '<li>門診每 3–6 個月一次共 5 年，之後每年一次。</li>' +
      '<li><b>每年乳房影像是必要的</b>：乳房攝影及／或乳房超音波。</li>' +
      '<li>腹部超音波、胸部 X 光：可做可不做。</li>' +
      '<li><b>不常規</b>安排電腦斷層或骨骼掃描，只在臨床有指徵時。</li>' +
      '<li><b>不建議</b>常規追蹤腫瘤標記。</li>' +
      '<li>服用 tamoxifen 且子宮還在者<b>每年婦科評估</b>；服用 aromatase inhibitor 者<b>定期骨密度檢查</b>。</li>' +
      '<li>追蹤中發現復發 → 回步驟 1 選「局部或區域復發」或「轉移性乳癌」。</li></ul>';
  }

  /* 原位管癌用的兩張參考表 */
  function vnpiTable() {
    return fold('<b>VNPI 計分表</b>（Van Nuys Prognostic Index）—— 決定要不要放療、要不要改全乳切除（p46）',
      '<table>' +
      '<tr><td></td><td>1 分</td><td>2 分</td><td>3 分</td></tr>' +
      '<tr><td>腫瘤大小</td><td>≤ 1.5 cm</td><td>1.6–4.0 cm</td><td>≥ 4.1 cm</td></tr>' +
      '<tr><td>病理</td><td>非高分化等級、無壞死</td><td>非高分化等級、有壞死</td><td>高分化等級</td></tr>' +
      '<tr><td>切緣</td><td>≥ 1.0 cm</td><td>0.1–0.9 cm</td><td>&lt; 0.1 cm</td></tr>' +
      '<tr><td>年齡</td><td>&gt; 60 歲</td><td>40–60 歲</td><td>&lt; 40 歲</td></tr>' +
      '<tr><td><b>4–6 分</b></td><td colspan="3">低風險：<b>放療是選擇性的</b></td></tr>' +
      '<tr><td><b>7–9 分</b></td><td colspan="3">中風險：<b>建議做輔助放療</b></td></tr>' +
      '<tr><td><b>10–12 分</b></td><td colspan="3">高風險：<b>建議改做全乳切除</b></td></tr>' +
      '<tr><td>另一套準則</td><td colspan="3">ECOG E5194 條件：腫瘤 &lt; 2.5 cm、低或中度分化、切緣 &gt; 3 mm —— 亦可作為省略放療的依據</td></tr>' +
      '</table>');
  }
  function bctContraTable() {
    return fold('什麼情況不能做乳房保留手術？<b>絕對與相對禁忌</b>（台大指引未列，引自 NCCN）', tbl([
      ['絕對禁忌',
        '① <b>懷孕期間就必須放療</b>（部分病人可延到產後）；② <b>乳房攝影呈瀰漫性可疑或惡性微鈣化</b>；' +
        '③ <b>病灶範圍太廣</b>，單一區段切除無法同時達到乾淨切緣與可接受外觀；④ <b>瀰漫性切緣陽性</b>；' +
        '⑤ ATM 基因雙等位失活。'],
      ['相對禁忌',
        '① <b>同側胸壁或乳房曾接受放療</b>（一定要先問到當年的劑量與照野）；' +
        '② <b>皮膚受侵犯的活動性結締組織疾病</b>，尤其硬皮症與紅斑性狼瘡；③ 局部切緣陽性；' +
        '④ <b>已知或懷疑遺傳性乳癌基因</b>；⑤ 腫瘤 &gt; 5 cm。'],
      ['原位管癌專屬', '<b>再切除仍達不到足夠切緣者，應改做全乳切除</b>；另 VNPI 10–12 分建議全乳切除（p46）。'],
      ['出處',
        'NCCN 乳癌指引 <b>BINV-G</b>（Special Considerations to Breast-Conserving Therapy Requiring RT）與 <b>DCIS-1</b> 註 e；' +
        '本頁查核的公開版本為 v5.2020，該段自 2018 年版起未變動。<b>台大指引本身沒有列這些條件。</b>']
    ]));
  }

  /* OlympiA 與 CPS+EG */
  function olympiaTable() {
    return fold('輔助 olaparib 的條件怎麼算？<b>OlympiA 試驗與健保條文不一樣</b>（p21）', tbl([
      ['試驗版<br>直接手術者',
        '<b>三陰性</b>：腋下淋巴結陽性（≥ pN1，任何腫瘤大小），或淋巴結陰性但侵襲性腫瘤病理大小 &gt; 2 cm（≥ pT2）。<br>' +
        '<b>ER 及／或 PR 陽性、HER2 陰性</b>：<b>需要 ≥ 4 顆</b>病理確認的陽性淋巴結。'],
      ['試驗版<br>術前化療後手術者',
        '<b>三陰性</b>：乳房及／或切下的淋巴結還有殘存侵襲癌（未達 pCR）。<br>' +
        '<b>ER 及／或 PR 陽性、HER2 陰性</b>：未達 pCR，<b>而且 CPS+EG 分數 ≥ 3</b>。'],
      ['CPS+EG 怎麼算',
        '把四項分數相加，總分 0–6：<br>' +
        '<b>臨床分期</b>（治療前）：I、IIA = 0；IIB、IIIA = 1；IIIB、IIIC = 2。<br>' +
        '<b>病理分期</b>（治療後）：0、I = 0；IIA、IIB、IIIA、IIIB = 1；IIIC = 2。<br>' +
        '<b>ER 陰性</b>：1 分。<b>nuclear grade 3</b>：1 分。<br>' +
        '（若無法判定 nuclear grade，改用 histologic grade；只有 Nottingham 總分 9 分才算 1 分。）'],
      ['健保版（9.85.4）<br>與試驗的差別',
        '<b>健保不採用 CPS+EG。</b>健保的高風險定義是：<br>' +
        '<b>三陰性</b> —— 術前化療後未達 pCR，或直接手術後 ≥ pN1，或 pN0 但腫瘤 ≥ 2 cm。<br>' +
        '<b>荷爾蒙受體陽性、HER2 陰性</b> —— 術前化療後未達 pCR，或直接手術後淋巴結 ≥ 4 顆。<br>' +
        '所以荷爾蒙受體陽性者在健保下反而比試驗<b>寬</b>（不必算分數），三陰性則一致。'],
      ['共同條件',
        '<b>必須是 germlineBRCA1/2 突變、HER2 陰性</b>，療程 1 年。' +
        '健保另外要求：完成 ≥ 6 週期含 anthracycline 或 taxane 的化療，並於最後一次治療後 12 週內開始。<br>' +
        '⚠ <b>輔助情境的 olaparib 與 pembrolizumab 只能擇一給付。</b>'],
      ['出處', 'OlympiA 試驗計畫書（NCT02032823）第 4.1 節與附錄 H；台大指引 p21；健保署藥品給付規定 9.85.4。']
    ]));
  }

  /* 轉移期化療處方 */
  function mbcChemoTable() {
    return fold('轉移期的化療處方有哪些？（p42、p43、p44、p45）', tbl([
      ['三個基本前提',
        '① <b>所有早期乳癌的處方，不管是合併處方或其中的單一藥物，轉移時都可以用。</b><br>' +
        '② 只有<b>已知抗藥性的疑慮（例如很快就復發）</b>，或 <b>anthracycline 已達累積劑量</b>時才不適合。<br>' +
        '③ <b>沒有證據顯示哪個處方比較好，也沒有明確的第一線處方；病人的偏好是關鍵因素之一。</b>'],
      ['單一藥物',
        '<b>pegylated liposomal doxorubicin</b> 30–50 mg/m² 每 3–4 週；<b>eribulin</b> 1.4 mg/m² D1、D8；<br>' +
        '<b>capecitabine</b> 850–1000 mg/m² 每日兩次 D1–14，每 21 天；<b>vinorelbine</b> 25–30 mg/m² D1、D8，每 3 週。'],
      ['合併處方',
        '<b>N-HDFL</b>：vinorelbine 25 mg/m² D1、D8 ＋（5-FU 2000–2600 mg/m² ± leucovorin 300 mg/m²）24 小時輸注 D1、D8。<br>' +
        '<b>NP</b>：vinorelbine ＋ cisplatin 30–35 mg/m² D1、D8。<b>P-HDFL</b>：cisplatin ＋ 高劑量 5-FU，D1、D8。<br>' +
        '<b>TG</b>：paclitaxel 80 mg/m² ＋ gemcitabine 800 mg/m²，D1、D8。<br>' +
        '<b>BEEP</b>：bevacizumab 15 mg/kg D1 ＋ cisplatin 70 mg/m² D2 ＋ etoposide 70 mg/m² D2–4。'],
      ['不建議當第一線', '<b>mitoxantrone、mitomycin C、ixabepilone</b> —— 保留給已治療過很多線、沒有其他選擇者（p45）。'],
      ['健保注意',
        '<b>bevacizumab 在乳癌沒有適應症</b>，所以 BEEP 處方屬<b>自費</b>。' +
        '<b>eribulin</b> 限先前已用過 anthracycline 與 taxane 者（9.48.1）。']
    ]));
  }

  /* 遺傳諮詢與 BRCA 檢測（p4、p5） */
  function geneticTable() {
    return fold('要不要轉遺傳諮詢？要不要驗 BRCA？（p4、p5）', tbl([
      ['考慮遺傳諮詢的三個大條件', '<b>符合家族史條件</b>、<b>雙側乳癌</b>，或<b>發病年齡很輕（&lt; 35 歲）</b>。'],
      ['家族史的八項定義',
        '① ≥ 3 名女性家族成員罹患乳癌（不限年齡）；<br>' +
        '② ≥ 2 名女性罹患乳癌，其中一人診斷時 ≤ 50 歲；<br>' +
        '③ ≥ 1 名女性罹患乳癌，加上一名家族成員罹患卵巢癌（可以是同一人）；<br>' +
        '④ ≥ 1 名女性 &lt; 35 歲確診乳癌；<br>' +
        '⑤ ≥ 1 名女性罹患雙側乳癌（第一個乳癌確診時需 &lt; 50 歲）；<br>' +
        '⑥ ≥ 1 名女性確診卵巢癌（確診時需 &lt; 40 歲）；<br>' +
        '⑦ ≥ 2 名女性確診卵巢癌（不限年齡）；<br>' +
        '⑧ ≥ 1 名男性家族成員確診乳癌（不限年齡）。'],
      ['什麼人該驗 germline BRCA1/2',
        '① 符合上面的遺傳諮詢條件者；<br>' +
        '② <b>可能因 PARP 抑制劑受益者</b> —— 早期乳癌中 HER2 陰性的第 II／III 期且符合 OlympiA 條件者；' +
        '晚期乳癌中 HER2 陰性且曾在術前、輔助或轉移情境接受過化療者。'],
      ['為什麼要早點驗',
        '<b>驗出來會改變治療</b>：影響能不能用 olaparib、影響要不要建議雙側預防性切除、' +
        '也影響乳房保留手術的選擇（遺傳性乳癌基因是相對禁忌）。等到要開藥才驗常常來不及。']
    ]));
  }

  /* ==========================================================
     4. 版面 HTML
     ========================================================== */
  function breastPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院乳癌診療指引</b>（版次 14／2023.V1，2026/06/16 癌症醫療委員會檢視通過；' +
      '以 2023 NCCN、2023 St. Gallen 共識與 ABC6 為基礎）編成的互動決策流程。' +
      '步驟照臨床決策實際發生的先後排：<b>影像發現 → 病理與臨床分期 → 先開刀還是先給藥 → 怎麼開 → 術後放療與輔助治療 → 復發或轉移</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是參考資料、處方劑量與健保條文。' +
      '分期本身（AJCC 第 8 版）另見「分期 TNM」頁籤。</p>';
    h += '<div class="onc-path" id="bcPath">';

    /* 步驟 1 */
    h += node0('bc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'dx', '影像有異常，還沒有病理診斷', '乳房攝影微鈣化、超音波腫塊、皮膚變化、腋下腫塊') +
      opt('scope', 'dcis', '原位管癌 DCIS（ductal carcinoma in situ）', 'Tis N0M0，含無侵襲成分的柏哲德氏病') +
      opt('scope', 'lcis', '小葉原位癌 LCIS（lobular carcinoma in situ）', '') +
      opt('scope', 'inv', '侵襲性乳癌、沒有遠處轉移（M0）', '管狀、小葉、混合、化生型癌 —— 從決定先開刀還是先給藥開始') +
      opt('scope', 'mbc', '轉移性乳癌（M1，有遠處轉移）', '第一線到後線') +
      opt('scope', 'recur', '局部或區域復發（M0）', '乳房內、胸壁、腋下、鎖骨上、內乳淋巴結') +
      opt('scope', 'prog', '治療中進展，或治療剛結束就復發', '術前治療中惡化；輔助治療期間或剛結束就復發'));

    /* A. 影像 → 診斷 */
    h += '<div id="bc_b_dx" class="hidden">';
    h += node('bc_n_dx', '2', '影像看到的是什麼？',
      opt('img', 'calc', '乳房攝影：可疑微鈣化，摸不到腫塊', '') +
      opt('img', 'mass', '超音波或觸診：腫塊', '') +
      opt('img', 'skin', '皮膚變化：紅、腫、橘皮、潰瘍', '要先排除發炎性乳癌') +
      opt('img', 'axilla', '以腋下腫塊表現，乳房找不到原發灶', ''));
    h += recBox('bc_r_dx', '建議處置 · 取得診斷與分期前檢查');
    h += fuBox('bc_f_dx');
    h += '</div>';

    /* B. 原位管癌 */
    h += '<div id="bc_b_dcis" class="hidden">';
    h += node('bc_n_dloc', '2', '局部治療打算怎麼做？（p6）',
      opt('dloc', 'bct', '乳房保留手術', '') +
      opt('dloc', 'tm', '全乳切除 ± SLNB ± 重建',
        '再切除仍達不到乾淨切緣、乳房攝影呈瀰漫性惡性微鈣化、病灶範圍太廣單一切口切不乾淨、不能接受放射治療、VNPI 10–12 分，或病人選擇'),
      vnpiTable() + bctContraTable());
    h += node('bc_n_dmar', '3', '乳房保留手術的切緣結果？（p6）',
      opt('dmar', 'neg', '切緣乾淨', '') +
      opt('dmar', 'close', '切緣過近或陽性', ''));
    h += recBox('bc_r_dcis', '建議處置 · 原位管癌');
    h += fuBox('bc_f_dcis');
    h += '</div>';

    /* C. 小葉原位癌 */
    h += '<div id="bc_b_lcis" class="hidden">';
    h += recBox('bc_r_lcis', '建議處置 · 小葉原位癌（p7）');
    h += fuBox('bc_f_lcis');
    h += '</div>';

    /* D. 侵襲癌主線 */
    h += '<div id="bc_b_inv" class="hidden">';
    h += node('bc_n_sub', '2', '生物亞型是哪一種？（依切片的 ER／PR 與 HER2；p2）',
      opt('sub', 'erpos', 'ER/PR(+) HER2(−)　—　Luminal A 或 Luminal B（HER2 陰性型）', '最常見；以內分泌治療為主軸') +
      opt('sub', 'her2hr', 'ER/PR(+) HER2(+)　—　Luminal B（HER2 陽性型）', '兩條軸線都要走') +
      opt('sub', 'her2', 'ER/PR(−) HER2(+)　—　HER2 型（HER2-enriched）', '') +
      opt('sub', 'tnbc', 'ER/PR(−) HER2(−)　—　TNBC（三陰性）', ''),
      fold('HER2 怎麼判讀？ER 幾 % 算陽性？（p2、p23）', tbl([
        ['HER2 IHC 0 或 1+', '陰性，通常不做 FISH'],
        ['HER2 IHC 2+', '<b>必須做 FISH</b> 才能定案'],
        ['HER2 IHC 3+', '陽性，不需要 FISH'],
        ['ER 陽性的定義', 'ER ≥ 10% → 用內分泌治療；1% ≤ ER &lt; 10% → 用或不用都在指引內；ER &lt; 1% → 不用；ER 陰性但 PR &gt; 10% → 用或不用都在指引內'],
        ['術前治療之後', '<b>手術檢體要重做一次 ER、PR、HER2 染色</b>（p2）']
      ])));
    h += node('bc_n_ctn', '3', '臨床分期落在哪一格？（點 cT 與 cN 的交會格；p8、p9、p11）', '',
      '<div id="bc_ctn_hold"></div>');
    h += recBox('bc_r_ctn', '建議處置 · 先開刀還是先給藥');
    h += node('bc_n_plan', '4', '實際決定走哪一條？',
      opt('plan', 'up', 'Upfront surgery', '直接手術') +
      opt('plan', 'na', 'Neoadjuvant therapy', '先做藥物治療，之後再手術'));

    /* D-1 直接手術 */
    h += '<div id="bc_b_up" class="hidden">';
    h += recBox('bc_r_up_op', '建議處置 · 手術要怎麼開（乳房與腋下）');
    h += node('bc_n_surg', '5', '乳房手術實際做了哪一種？',
      opt('surg', 'bct', '乳房保留手術', '') +
      opt('surg', 'tm', '全乳切除', ''));
    h += node('bc_n_ptn', '6', '術後病理落在哪一格？（點 pT 與 pN 的交會格；p17、p19、p22）', '',
      '<div id="bc_ptn_hold"></div>');
    h += recBox('bc_r_up_adj', '建議處置 · 術後輔助治療與放射治療');
    h += fuBox('bc_f_up');
    h += '</div>';

    /* D-2 術前治療 */
    h += '<div id="bc_b_na" class="hidden">';
    h += recBox('bc_r_na_rx', '建議處置 · 術前藥物治療的處方與開始前的準備');
    h += node('bc_n_nresp', '5', '術前治療結束、重新評估後是哪一種狀況？（p12）',
      opt('nresp', 'op_bct', '腫瘤縮小，可以做乳房保留手術', '') +
      opt('nresp', 'op_tm', '可以手術，但要做全乳切除', '') +
      opt('nresp', 'pd', '治療期間腫瘤變大或臨床惡化', '') +
      opt('nresp', 'inop', '治療後仍然無法手術', ''));
    h += recBox('bc_r_na_op', '建議處置 · 手術與腋下處理');
    h += node('bc_n_ypath', '6', '手術檢體的病理結果？（三選一）',
      opt('ypath', 'pcr', '乳房與淋巴結都沒有殘存的侵襲癌',
        'pCR（pathologic complete response）—— 依定義淋巴結必定陰性') +
      opt('ypath', 'res_n0', '乳房還有殘存侵襲癌，但淋巴結陰性', '') +
      opt('ypath', 'npos', '淋巴結有轉移', '含 micrometastasis ypN1mi 與 isolated tumor cells ypN0(i+)'));
    h += recBox('bc_r_na_adj', '建議處置 · 術後輔助治療與放射治療');
    h += fuBox('bc_f_na');
    h += '</div>';
    h += '</div>';

    /* E. 轉移性 */
    h += '<div id="bc_b_mbc" class="hidden">';
    h += node('bc_n_msub', '2', '生物亞型是哪一種？（轉移病灶若能切片，應重驗；p2）',
      opt('sub', 'erpos', 'ER/PR(+) HER2(−)　—　Luminal A 或 Luminal B（HER2 陰性型）', '') +
      opt('sub', 'her2hr', 'ER/PR(+) HER2(+)　—　Luminal B（HER2 陽性型）', '走抗 HER2 那條路，再加上內分泌治療') +
      opt('sub', 'her2', 'ER/PR(−) HER2(+)　—　HER2 型（HER2-enriched）', '') +
      opt('sub', 'tnbc', 'ER/PR(−) HER2(−)　—　TNBC（三陰性）', ''));
    h += node('bc_n_mrisk', '3', '疾病活性有多高？（p38，台灣乳房醫學會共識圖）',
      opt('mrisk', 'crisis', '有 visceral crisis，或進展很快', '器官功能已經受影響，需要短時間內見效') +
      opt('mrisk', 'high', '高風險（但沒有 visceral crisis）', 'disease-free interval 短、內臟腫瘤負荷高、已有症狀') +
      opt('mrisk', 'mid', '中風險', '') +
      opt('mrisk', 'low', '低風險', 'disease-free interval 長、只有骨或軟組織轉移、沒有症狀'),
      fold('這幾格怎麼分？（p38 圖的兩條軸）', tbl([
        ['第一條軸<br>疾病活性', '① <b>disease-free interval 短</b>；② <b>內臟腫瘤負荷高</b>；③ <b>已經有症狀</b>。'],
        ['第二條軸<br>對內分泌治療的反應機率', '① <b>內分泌治療抗藥型別</b>（原發性／續發性）；② 內在亞型；③ 生物標記（如 ESR1 突變）。'],
        ['抗藥型別的定義',
          '<b>原發性抗藥</b>：輔助內分泌治療的前 2 年內就復發，或轉移後第一線內分泌治療 6 個月內就進展。<br>' +
          '<b>續發性抗藥</b>：輔助內分泌治療 2 年後才復發，或結束後 12 個月內復發，或第一線內分泌治療 6 個月後才進展。'],
        ['三格對應的第一線',
          '<b>低風險</b> → 單用內分泌治療（也可以加 CDK4/6 抑制劑）。<br>' +
          '<b>中風險</b> → 內分泌治療加 CDK4/6 抑制劑（單用內分泌治療、或化療也在選項內）。<br>' +
          '<b>高風險</b> → 化療，或內分泌治療加 CDK4/6 抑制劑。'],
        ['visceral crisis 是什麼',
          '指<b>器官功能已經因為腫瘤而受損、需要在短時間內見效的治療</b>（例如快速惡化的肝衰竭、' +
          '大量癌性淋巴管炎造成的呼吸衰竭）。<b>不是「有內臟轉移」就叫 visceral crisis。</b>' +
          '這一格是唯一會讓荷爾蒙受體陽性病人跳過內分泌治療、直接化療的理由（p37）。']
      ])));
    h += node('bc_n_mline', '4', '現在要決定的是第幾線治療？',
      opt('mline', 'l1', '第一線（轉移後還沒用過藥）', '') +
      opt('mline', 'l2', '第二線', '') +
      opt('mline', 'l3', '第三線以後', ''));
    h += recBox('bc_r_mbc', '建議處置 · 轉移性乳癌');
    h += fuBox('bc_f_mbc');
    h += '</div>';

    /* F. 局部區域復發 */
    h += '<div id="bc_b_recur" class="hidden">';
    h += node('bc_n_rsite', '2', '復發在哪裡？（p36）',
      opt('rsite', 'local', '只有局部復發（乳房內或胸壁）', '') +
      opt('rsite', 'axilla', '腋下淋巴結復發', '') +
      opt('rsite', 'scf', '鎖骨上淋巴結復發', '') +
      opt('rsite', 'imn', '內乳淋巴結復發', ''));
    h += node('bc_n_rprev', '3', '當初的初始治療是哪一種？（p36）',
      opt('rprev', 'bct_rt', '乳房保留手術＋放射治療', '') +
      opt('rprev', 'bct_lnd_rt', '乳房保留手術＋腋下淋巴結手術＋放射治療', '') +
      opt('rprev', 'nort', '乳房保留手術或全乳切除，但沒有做過放射治療', ''));
    h += recBox('bc_r_recur', '建議處置 · 局部或區域復發');
    h += fuBox('bc_f_recur');
    h += '</div>';

    /* G. 治療中進展 */
    h += '<div id="bc_b_prog" class="hidden">';
    h += node('bc_n_pstage', '2', '是在哪一段治療中出狀況？',
      opt('pstage', 'na', '術前藥物治療期間，腫瘤變大或臨床惡化', '') +
      opt('pstage', 'chemo', '輔助化療還沒做完就復發', '') +
      opt('pstage', 'et', '輔助內分泌治療期間，或結束後 12 個月內復發', '') +
      opt('pstage', 'her2', '抗 HER2 輔助治療期間或剛結束就復發', ''));
    h += recBox('bc_r_prog', '建議處置 · 治療中進展或早期復發');
    h += fuBox('bc_f_prog');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="bcReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ==========================================================
     5. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }

  /* 先把整個流程關到只剩步驟 1，再由分支逐層打開。
     這是「沒選之前不出現」的唯一保證，不要在別處另外開關。 */
  function collapseAll() {
    var root = el('bcPath');
    if (!root) return;
    root.querySelectorAll('.bc-node').forEach(function (n) {
      if (n.id !== 'bc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['bc_b_dx', 'bc_b_dcis', 'bc_b_lcis', 'bc_b_inv', 'bc_b_mbc', 'bc_b_recur', 'bc_b_prog',
      'bc_b_up', 'bc_b_na'].forEach(function (id) { show(id, false); });
  }

  function liOf(t) {
    if (t.indexOf('@ev ') === 0) return '<li class="ev">' + t.slice(4) + '</li>';
    if (t.indexOf('<span class="rx-h">') === 0) return '<li class="hd">' + t + '</li>';
    return '<li>' + t + '</li>';
  }

  function fill(id, cls, title, lines, src, extra) {
    var e = el(id);
    if (!e) return;
    var label = e.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置';
    e.className = 'flow-rec ' + cls;
    e.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') +
      (src ? '<div class="rec-note">' + src + '</div>' : '');
  }

  function fu(id, kind) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = followupHTML(kind);
  }

  function subLabel(s) {
    return {
      her2hr: 'ER/PR(+) HER2(+)',
      her2: 'ER/PR(−) HER2(+)',
      erpos: 'ER/PR(+) HER2(−)',
      tnbc: 'TNBC'
    }[s];
  }
  function ctnParts() {
    var p = S.ctn.split('_');
    return { t: p[0], n: p[1], g: ctnGroup(p[0], p[1]) };
  }
  function ctnName() {
    var p = ctnParts();
    var tr = CT_ROWS.filter(function (r) { return r[0] === p.t; })[0];
    var cc = CN_COLS.filter(function (c) { return c[0] === p.n; })[0];
    return tr[1] + cc[1].replace('c', '');
  }

  /* ==========================================================
     6. 各分支
     ========================================================== */

  /* ---------- A. 影像 → 診斷 ---------- */
  function renderDx() {
    show('bc_b_dx', true);
    show('bc_n_dx', true);
    if (!S.img) return;

    var L = [], title = '';
    if (S.img === 'calc') {
      title = '可疑微鈣化 → 立體定位切片取得組織診斷';
      L.push(H('先做什麼', 'p1'));
      L.push('<b>雙側乳房攝影是必要的</b>（第 0 至 III 期都要做），必要時加乳房超音波。');
      L.push('<b>用立體定位或導線定位取組織，優先用 core biopsy</b>（core biopsy）。');
      L.push(EV('指引 p1 原文是「Tissue diagnosis, core biopsy favored」。FNA 分不出原位癌與侵襲癌，' +
        '也做不了 ER、PR、HER2 染色，所以微鈣化的病灶不用細針。'));
    } else if (S.img === 'mass') {
      title = '乳房腫塊 → core biopsy 取得組織診斷';
      L.push(H('先做什麼', 'p1、p10'));
      L.push('<b>雙側乳房攝影是必要的</b>，加乳房超音波。');
      L.push('<b>對腫塊做 core biopsy。</b>');
      L.push('<b>同時評估腋下淋巴結；可疑者術前先做 FNA 確認</b>（p10 註 b）。');
      L.push(EV('腋下先驗過，是為了在開刀前就知道要做 SLNB 還是 ALND —— ' +
        '這個結果也決定要不要在術前先放 clip。'));
    } else if (S.img === 'skin') {
      title = '皮膚紅腫或橘皮 → 先排除發炎性乳癌';
      L.push(H('先做什麼', 'p1、p9'));
      L.push('<b>皮膚切片加乳房腫塊切片</b>；影像做雙側乳房攝影加超音波。');
      L.push('<b>一旦確定是發炎性乳癌（cT4d），不可以直接開刀</b> —— 一律先做全身藥物治療。');
      L.push(EV('發炎性乳癌屬局部晚期。SLNB 在這一型是禁忌（皮下淋巴管已被腫瘤堵住，定位不準），' +
        '腋下要做完整廓清；也不可以做乳房保留手術。'));
    } else {
      title = '腋下腫塊、乳房找不到原發灶 → 先確認是不是乳癌';
      L.push(H('先做什麼', 'p1、p3'));
      L.push('<b>腋下淋巴結切片</b>，並做 ER、PR、HER2 染色。');
      L.push('<b>加做乳房磁振造影</b>找隱匿的原發灶。');
      L.push(EV('磁振造影在這個情境是少數明確有用的地方；一般乳癌的術前磁振造影屬選擇性（p12）。'));
    }

    L.push(H('不論哪一種都要做的基本檢查', 'p1'));
    L.push('病史與理學檢查、<b>血球計數含分類</b>、<b>肝功能（含鹼性磷酸酶）</b>、<b>腎功能</b>。');
    L.push('切片檢體做 <b>ER、PR、HER2</b>，以及 Ki-67。');

    L.push(H('要不要做全身分期？', 'p3'));
    L.push('<b>不常規做</b> —— T1–3 且淋巴結陰性者，除非<b>有相關症狀</b>，或<b>抽血、理學檢查有異常</b>。');
    L.push('<b>強烈建議做的四種</b>：cT3N1、任何 T 但 cN2、任何 T 但 cN3、cT4 任何 N；另加術後病理第 III 期。');
    L.push('<b>原位管癌完全不做。</b>');
    L.push(EV('全身分期指電腦斷層或磁振造影、正子造影、骨骼掃描。' +
      '臨床 cN0 但術後是 pT1–2N1M0 者「不強烈建議」做（Z0011 的族群本來就不靠影像決定治療）。' +
      '最終仍由主治醫師判斷。'));

    fill('bc_r_dx', 'rec-elective', title, L,
      'p1（work-up）、p2（IHC 原則）、p3（全身分期原則）、p4（遺傳諮詢）、p5（gBRCA1/2 檢測適應症）、p10 註 b。',
      more(geneticTable()));
    fu('bc_f_dx', null);
  }

  /* ---------- B. 原位管癌 ---------- */
  function renderDcis() {
    show('bc_b_dcis', true);
    show('bc_n_dloc', true);
    if (!S.dloc) return;

    if (S.dloc === 'bct') {
      show('bc_n_dmar', true);
      if (!S.dmar) return;

      if (S.dmar === 'close') {
        fill('bc_r_dcis', 'rec-urgent', '切緣過近或陽性 → 再切除一次', [
          H('局部處置', 'p6'),
          '<b>re-excision</b> —— <b>除非那個切緣是深部或表淺</b>。',
          EV('深部切緣已經切到胸肌筋膜、表淺切緣已經切到皮膚，這兩個方向再切也切不出更多組織。'),
          '<b>再切除後仍達不到乾淨切緣 → 改做全乳切除</b>（此時不需要輔助放療）。',
          EV('台大 p6 只寫 re-excision；「切不乾淨就改全乳切除」是 NCCN DCIS-1 註 e 的明文。' +
            '另外 VNPI 10–12 分本來就建議全乳切除（p46，計分表在步驟 2）。')
        ].concat(dcisAxLines(false)),
          'p6：BCT（close or positive margin）→ re-excision，unless deep or superficial margin。', null);
        fu('bc_f_dcis', 'insitu');
        return;
      }

      fill('bc_r_dcis', 'rec-elective', '乳房保留手術 → 依風險決定放療，ER 陽性者加 tamoxifen', [
        H('局部處置', 'p6、p46'),
        '<b>乳房保留手術，切緣乾淨。要不要加輔助放療，用 VNPI 分數或 ECOG E5194 條件決定</b>（計分表在步驟 2）。',
        EV('VNPI 4–6 分放療為選擇性；7–9 分建議放療；10–12 分建議改做全乳切除。' +
          'E5194 條件是腫瘤 &lt; 2.5 cm、低或中度分化、切緣 &gt; 3 mm。實際照野與劑量依放射治療指引。')
      ].concat(dcisAxLines(false)).concat([
        H('輔助治療', 'p6、p23'),
        'ER 陽性者<b>建議 ' + drug('tamoxifen') + ' 5 年</b>。',
        EV('在乳房保留手術這一群，tamoxifen 的主要目的是<b>降低同側乳房復發</b>（p6 註 a）—— ' +
          '和全乳切除那一群的用意不一樣。'),
        '<b>原位管癌完全不做全身分期</b>（p3）。'
      ]),
        'p6：Tis N0M0 → BCT → adjuvant RT or not；if ER(+), suggest tamoxifen for 5 yr。p46：VNPI／E5194。',
        more(omitSlnbReference(), etReference()));
      fu('bc_f_dcis', 'insitu');
      return;
    }

    fill('bc_r_dcis', 'rec-elective', '全乳切除 ± SLNB ± 重建', [
      H('局部處置', 'p6、p46'),
      '<b>單純全乳切除 —— 不需要輔助放療</b>（p46）。可以同時做乳房重建。'
    ].concat(dcisAxLines(true)).concat([
      H('輔助治療', 'p6'),
      'ER 陽性者建議 ' + drug('tamoxifen') + ' 5 年。',
      EV('但在全乳切除這一群，它的性質<b>比較接近對側乳房的二級預防</b>（p6 註 c），' +
        '而不是降低同側復發 —— 同側乳房已經切掉了。決定要不要吃五年時，應該把這一點講清楚。')
    ]),
      'p6：Tis N0M0 → SM(TM) ± SLNB ± Reconstruction；p46：Simple mastectomy — no need for adjuvant RT。',
      more(omitSlnbReference(), etReference()));
    fu('bc_f_dcis', 'insitu');
  }

  function dcisAxLines(mastectomy) {
    var L = [H('腋下', 'p6 註 b')];
    if (mastectomy) {
      L.push('<b>要做全乳切除，就把 SLNB 一起做掉。</b>');
      L.push(EV('台大 p6 註 b 原文是「more strongly considered for mastectomy patient」。' +
        '理由不是原位管癌本身會轉移，而是<b>全乳切除後乳房的淋巴引流已經沒了</b>：' +
        '萬一手術檢體升級為侵襲癌，就再也做不了 sentinel node mapping，只剩腋下廓清一途。' +
        '做乳房保留手術的人沒有這個問題，可以事後補做。'));
      L.push('<b>不可以做 ALND</b> —— 在沒有侵襲癌證據、也沒有證實腋下轉移之前，原位管癌一律不做。');
      L.push(EV('升級的機率不低：原位管癌開刀後升級為侵襲癌者，各研究為 7–28%；' +
        '但<b>純原位管癌本身的淋巴結轉移率只有約 1–2%</b>。<br>' +
        '若最終病理出現侵襲癌，<b>整個療程改依第 I／II 期侵襲癌處理</b>，包含淋巴結分期 —— ' +
        '請回步驟 1 改選「侵襲性乳癌」。'));
      return L;
    }
    L.push('<b>純原位管癌做乳房保留手術 → 不需要腋下分期，連 SLNB 都不用做。</b>');
    L.push(EV('理由有兩層：<b>純原位管癌的淋巴結轉移率只有約 1–2%</b>；' +
      '而且即使手術檢體升級為侵襲癌（各研究 7–28%），' +
      '<b>乳房保留手術後乳房的淋巴引流還在，可以回頭補做</b>，不會失去機會。'));
    L.push('<b>但下面四種情況，SLNB 要在這一次手術一併做：</b>' + SUB([
      '<b>需要（或已改為）全乳切除</b> —— 切了就補不回來。',
      '<b>切除位置會破壞日後的 sentinel node mapping</b> —— 中央區或乳暈後、外上象限、腋尾，或大範圍腫瘤整形手術。',
      '<b>病理已經懷疑有侵襲或微侵襲。</b>',
      '<b>臨床表現與病理不相符</b> —— 例如摸得到明顯腫塊，報告卻只寫原位管癌。'
    ]));
    L.push(EV('出處：台大 p6 註 b；美國乳房外科醫學會（ASBrS）《Axillary Management for Patients With ' +
      'In-Situ and Invasive Breast Cancer》資源指引（2026-02-24 版）A 節；NCCN DCIS-1 註 f。'));
    return L;
  }

  /* ---------- C. 小葉原位癌 ---------- */
  function renderLcis() {
    show('bc_b_lcis', true);
    fill('bc_r_lcis', 'rec-nonop', '不一定要開刀，以追蹤為主', [
      H('處置', 'p7'),
      '<b>典型小葉原位癌：切除不是必要的，以追蹤為主。</b>',
      '<b>pleomorphic LCIS：比照原位管癌處理</b> —— 需完整切除，' +
      '並依原位管癌的規則決定放療與內分泌治療。',
      '<b>不做腋下分期，也不做全身分期。</b>',
      EV('小葉原位癌被視為「風險指標」而不是真正的癌前病灶 —— 它預告的是<b>雙側</b>乳房日後的風險上升，' +
        '不是那個位置一定會長出癌；所以把它切乾淨並不會降低風險，追蹤才是重點。多形性亞型是例外。'),
      H('要跟病人講清楚的兩件事', ''),
      '① 這不是癌症的第 0 期，<b>但兩側乳房日後的風險都會上升</b>，所以追蹤要做兩側。',
      '② 若是 <b>core biopsy</b> 取得的診斷，要確認影像與病理是否相符；<b>不相符時仍需手術切除確認</b>。'
    ], 'p7：LCIS — resection not mandatory, surveillance；Pleomorphic LCIS — managed as DCIS。', null);
    fu('bc_f_lcis', 'insitu');
  }

  /* ---------- D. 侵襲癌主線 ---------- */
  function renderInv() {
    show('bc_b_inv', true);
    show('bc_n_sub', true);
    if (!S.sub) return;

    show('bc_n_ctn', true);
    var hold = el('bc_ctn_hold');
    if (hold) {
      hold.innerHTML = '<div class="tn-cap">生物亞型：' + subLabel(S.sub) + '（換亞型時本表會跟著換）</div>' +
        gridHTML('bc_ctnc_' + S.sub, 'ctn', CN_COLS, CT_ROWS, ctnGroup, CTN_LEGEND,
          '<b>這裡的顏色代表「先開刀還是先給藥」，不是嚴重度。</b>建議術前治療的門檻依亞型不同：' +
          'HER2 陽性是 ≥cT2N0、或 ≥cN1、或荷爾蒙受體陰性者的 ≥cT1cN0；三陰性是 ≥cT2N0 或 ≥cN1；' +
          '荷爾蒙受體陽性且 HER2 陰性者指引沒有列門檻，只在局部晚期或想做乳房保留手術時考慮（p9、p11）。');
      if (S.ctn) {
        var b = el('bc_ctnc_' + S.sub + '_' + S.ctn);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.ctn) return;

    renderCtnRec();
    show('bc_n_plan', true);
    if (!S.plan) return;

    if (S.plan === 'up') renderUpfront();
    else renderNeo();
  }

  function renderCtnRec() {
    var p = ctnParts(), L = [], cls, title;

    if (p.g === 'none') {
      cls = 'rec-nonop';
      title = ctnName() + '（' + subLabel(S.sub) + '）<br>→ 建議直接手術';
      L.push(H('這一格為什麼是直接手術', 'p8、p9'));
      L.push('<b>大部分臨床第 I、II 期的病人都是直接手術</b>（p8）；這一格沒有達到指引建議術前治療的門檻。');
      if (S.sub === 'her2hr' || S.sub === 'her2') {
        L.push(EV('HER2 陽性的 cT1a–bN0，指引明寫「建議直接手術，符合 APT 試驗族群，避免過度治療」（p18）。' +
          'APT 只收腫瘤 &lt; 3 cm 且淋巴結陰性者，處方是每週 paclitaxel 12 週加 trastuzumab 滿 1 年。'));
      }
      if (S.sub === 'erpos') {
        L.push(EV('荷爾蒙受體陽性且 HER2 陰性者，指引沒有列出建議術前治療的門檻 —— ' +
          '這一型對化療的反應率本來就低；先開刀拿到完整的病理分期，反而比較好決定後面要不要化療。'));
      }
    } else if (p.g === 'ii') {
      cls = 'rec-elective';
      title = ctnName() + '（' + subLabel(S.sub) + '）<br>→ 兩條路都可以，看想不想保留乳房';
      L.push(H('這一格為什麼兩條都行', 'p9、p11'));
      L.push('<b>沒有達到指引「建議」術前治療的門檻，但術前治療是合理選項</b> —— ' +
        '主要理由是<b>把腫瘤縮小以便做乳房保留手術</b>（p11）。');
      L.push('<b>先問病人想不想保留乳房</b>：想保留但目前腫瘤與乳房的比例不允許 → 走術前治療；沒有這個顧慮 → 直接手術。');
      if (S.sub === 'her2hr') {
        L.push(EV('HER2 陽性的 cT1cN0，指引把兩條路並列（p18）：直接手術，或術前治療（處方可用 taxane 加 trastuzumab）。' +
          '荷爾蒙受體陰性的 cT1cN0 則明列在「建議術前治療」內 —— 差別就在 ER。'));
      }
      if (S.sub === 'tnbc') {
        L.push(EV('三陰性的門檻是 ≥cT2N0 或 ≥cN1，cT1cN0 剛好在門檻之下。' +
          '但三陰性走術前治療還有一個額外理由：<b>沒有達到 pCR 者，術後可以再加強</b>' +
          '（capecitabine、olaparib）—— 直接手術就拿不到這個資訊。'));
      }
      if (S.sub === 'erpos') {
        L.push(EV('這一格是臨床第 IIA 或 IIB 期。p11 說「符合乳房保留條件者可考慮術前化療或術前內分泌治療」，' +
          '所以決定因素是乳房保留的意願與可行性，不是腫瘤本身。'));
      }
    } else if (p.g === 'low') {
      cls = 'rec-elective';
      title = ctnName() + '（' + subLabel(S.sub) + '）<br>→ 建議先做術前藥物治療';
      L.push(H('這一格為什麼建議先給藥', 'p9、p11'));
      if (S.sub === 'her2hr' || S.sub === 'her2') {
        L.push('<b>HER2 陽性，已達指引建議術前治療的門檻</b>：≥cT2N0、或 ≥cN1、或荷爾蒙受體陰性者的 ≥cT1cN0（p9）。');
      } else if (S.sub === 'tnbc') {
        L.push('<b>三陰性，已達指引建議術前治療的門檻</b>：≥cT2N0 或 ≥cN1（p9）。');
      } else {
        L.push('<b>cT3N0 屬局部晚期，指引明列「強烈建議」走術前治療</b>（p11）。');
      }
      L.push('<b>術前治療也讓後面多一個決策點</b>：手術檢體有沒有殘存病灶，會決定術後要不要再加強。');
      L.push(EV('HER2 陽性未達 pCR 者可換 T-DM1；三陰性未達者可加 capecitabine，' +
        '帶 germline BRCA 突變者可加 olaparib。直接手術的人拿不到這個資訊，也就用不到這些藥。'));
    } else {
      cls = 'rec-urgent';
      title = ctnName() + '（' + subLabel(S.sub) + '）<br>→ 局部晚期，一定要先做全身治療';
      L.push(H('這一格為什麼不能先開刀', 'p11'));
      L.push('<b>局部晚期（通常是第 III 期，或 cT3N0 以上）—— 指引寫「highly recommended」走術前治療</b>（p11）。');
      if (p.t === 't4d') {
        L.push('<b>發炎性乳癌（cT4d）：絕對不可以直接開刀。</b>一律先做全身藥物治療；之後<b>只能做全乳切除加 ALND</b>，' +
          '<b>不可以做乳房保留手術，也不可以只做 SLNB</b>。');
        L.push(EV('皮下淋巴管已被腫瘤堵住，sentinel node mapping 不可靠；而且發炎性乳癌的皮膚侵犯是瀰漫性的，切不出乾淨的切緣。'));
      }
      if (p.n === 'n23') {
        L.push('<b>cN2–3 屬第 III 期</b> —— 這一格也是<b>強烈建議做全身分期</b>的族群（p3）：先確認沒有遠處轉移再開始。');
      }
    }

    L.push(H('決定之前先確認的三件事', 'p9、p11'));
    L.push('① <b>病人體能適合</b>（指引 2023 年版特地加了「fit」這個字）；② 有沒有臨床試驗可以收案；③ 病人的意願。');
    if (p.g !== 'high') {
      L.push(EV('指引把術前治療的定位寫得很清楚（p9）：<b>通常用於局部晚期且體能適合者，或想做乳房保留手術者</b>。' +
        '不是所有能給的都該給。'));
    }

    fill('bc_r_ctn', cls, title, L,
      'p8（手術原則）、p9（術前治療的適應症）、p11（術前治療的情境）、p3（全身分期）。', null);
  }

  /* ---------- D-1 直接手術 ---------- */
  function renderUpfront() {
    show('bc_b_up', true);

    var p = ctnParts();
    var L = [H('乳房', 'p8、p10')];
    L.push('<b>可行的話，乳房保留手術優於全乳切除</b>；第 I 期尤其如此，但要尊重病人的選擇。');
    L.push('<b>做了乳房保留手術就一定要做術後放療</b> —— 這兩件事綁在一起，不能只做前半。');
    L.push('<b>乾淨切緣的定義是「墨汁沒有沾到侵襲癌或原位管癌」</b>（no ink on tumor）。');
    L.push(EV('這個定義比一般想像的寬 —— 只要腫瘤沒有碰到染色的切緣面就算乾淨，不需要留幾 mm 的距離。' +
      '（原位管癌的標準不同，見原位管癌流程。）'));

    L.push(H('腋下', 'p8、p10 註 b'));
    if (p.n === 'n0') {
      L.push('<b>臨床 cN0 → 做 SLNB。</b>');
      L.push('<b>sentinel node 若是 1–2 顆陽性，能不能免掉 ALND？五個條件要全部符合</b>（ACOSOG Z0011）：' + SUB([
        '臨床 cN0，而且 <b>sentinel node 只有 1–2 顆陽性</b>',
        '<b>T1 或 T2</b>',
        '接受<b>乳房保留手術</b>，而且<b>已經計畫要做術後放療</b>',
        '會接受<b>足量的輔助全身治療</b>',
        '<b>尤其是 ER 陽性者</b>'
      ]));
      L.push(EV('五條全中才能省略。<b>全乳切除的人不適用</b>（第 3 條就不符合）—— 這是最常搞錯的地方。' +
        '若因故沒做完整廓清、取下的淋巴結不足 10 顆，處理方式見下方放射治療適應症表的 p48 那一列。'));
    } else {
      L.push('<b>臨床腋下淋巴結陽性 → 做 ALND。</b>');
      L.push('<b>術前對可疑的淋巴結應該先做 FNA 確認</b>（p10 註 b）—— 影像可疑不等於轉移。');
      L.push(EV('Z0011 只適用於臨床 cN0 的病人，這一格用不到。'));
    }

    L.push(H('這一台刀之前還要處理的一件事', 'p9'));
    L.push('若病人因焦慮而要求同時切除<b>健康的對側乳房</b>：<b>先切罹癌側，照會精神科，建議病人再考慮 3 至 6 個月</b>；' +
      '若極度焦慮無法等待 3 個月，<b>必須在精神科醫師同意的狀況下才執行</b>。');

    fill('bc_r_up_op', 'rec-elective', '直接手術 —— 乳房與腋下要怎麼開', L,
      'p8（手術原則）、p9（對側預防性切除）、p10（第 ≤IIB 期與 T3N1 的局部治療）。',
      more(axillaReference()));

    show('bc_n_surg', true);
    if (!S.surg) return;

    show('bc_n_ptn', true);
    var hold = el('bc_ptn_hold');
    if (hold) {
      hold.innerHTML = '<div class="tn-cap">生物亞型：' + subLabel(S.sub) + '（每個亞型的分組準則不一樣）</div>' +
        gridHTML('bc_ptnc_' + S.sub, 'ptn', PN_COLS, PT_ROWS, ptnGroup, PTN_LEGEND[S.sub],
          '<b>pN0 這一欄包含 isolated tumor cells pN0(i+)</b>（≤ 0.2 mm 且 ≤ 200 個細胞），分期上仍當作 N0。' +
          '<b>pN1mi 是 micrometastasis</b>（0.2–2 mm）。<b>pN2–3 是 ≥ 4 顆</b> —— 這一欄同時也是胸壁放射治療與輔助 abemaciclib 的門檻。');
      if (S.ptn) {
        var b = el('bc_ptnc_' + S.sub + '_' + S.ptn);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.ptn) return;

    renderAdjuvant('bc_r_up_adj', 'up');
    fu('bc_f_up', null);
  }

  /* ---------- D-2 術前治療 ---------- */
  function renderNeo() {
    show('bc_b_na', true);

    var L = [];
    L.push(H('開始之前一定要做的五件事', 'p12'));
    L.push('① <b>停經前女性要討論生育議題</b>，有需要就轉介婦產科做卵子或胚胎冷凍保存。');
    L.push('② <b>在腫瘤處至少放一個 clip</b> 標出腫瘤床。');
    L.push('③ <b>詳細評估腋下淋巴結。</b>');
    L.push('④ <b>臨床腋下陽性者，可行的話在治療前先對那顆淋巴結做標記。</b>');
    L.push('⑤ 選擇性：部分病人做乳房磁振造影。');
    L.push(EV('第 ② 和第 ④ 點是同一個道理：腫瘤縮掉之後就找不到原來的位置了。' +
      '<b>沒有放 clip，達到完全緩解時外科不知道要切哪裡。</b>' +
      '實務上要注意 —— <b>目前的 clip 多半在超音波下看不到，需要乳房攝影導引定位</b>（p13），要事先跟放射科講好。'));

    L = L.concat(neoRegimenLines());

    L.push(H('治療期間', 'p12'));
    L.push('<b>每一次回診都要評估腫瘤反應</b> —— 目的是及早發現沒有反應的人，而不是等療程跑完才知道。');

    fill('bc_r_na_rx', 'rec-elective', '術前藥物治療 —— 處方與開始前的準備', L,
      'p12（術前治療的一般原則）、p18／p19（各亞型的術前處方）、p32–p35（處方劑量）。',
      more(chemoReference(), nhiEarly()));

    show('bc_n_nresp', true);
    if (!S.nresp) return;

    if (S.nresp === 'pd') {
      fill('bc_r_na_op', 'rec-urgent', '治療期間進展 —— 換路線，而且腋下不能只做 sentinel node', [
        H('先做什麼', 'p3、p12'),
        '<b>重新影像評估，確認是局部進展還是已經出現遠處轉移。</b>出現遠處轉移就改走轉移性乳癌流程（回步驟 1）。',
        H('仍是局部疾病時', 'p13'),
        '<b>腋下不可以只做 SLNB，要做 ALND。</b>',
        EV('指引原文是「after NACT, SLNB alone, <b>unless clinical PD</b>」（p13）。' +
          '對治療沒有反應的腫瘤，sentinel node 的偽陰性率無法接受。'),
        '<b>換一個沒有交叉抗藥性的處方</b>，或評估直接手術（若仍可切除）。<b>優先考慮臨床試驗收案。</b>',
        H('這是一個要多專科討論的節點', ''),
        '術前治療中進展的病人預後差，<b>建議提到多專科團隊會議討論</b>，不宜單一科別決定。'
      ], 'p12（治療期間每次評估反應）、p13（clinical PD 時不可只做 SLNB）、p3（全身分期）。', null);
      return;
    }
    if (S.nresp === 'inop') {
      fill('bc_r_na_op', 'rec-urgent', '治療後仍無法手術 —— 改以全身治療與放射治療控制', [
        H('處置', 'p11、p12'),
        '<b>換用另一線全身治療</b>；荷爾蒙受體陽性者可考慮術前內分泌治療（p11）。',
        '<b>照會放射腫瘤科評估局部放射治療。</b>',
        '<b>優先考慮臨床試驗收案。</b>',
        H('要持續做的事', 'p12'),
        '<b>每次回診評估反應；反應好、體能改善時要回頭重新評估手術可行性</b> —— 「現在不能開」不等於「以後都不能開」。',
        EV('若持續進展，就依轉移性疾病處理，並同時評估安寧共同照護的介入時機（p37）。')
      ], 'p11（局部晚期）、p12（治療期間評估）、p37（末期病人之安寧照護）。', null);
      return;
    }

    var pn = ctnParts().n;
    var OL = [H('乳房', 'p12')];
    if (S.nresp === 'op_bct') {
      OL.push('<b>做乳房保留手術，並做適當的腋下分期</b>（p12）。');
      OL.push('<b>切除範圍以術前放的 clip 定位</b>；乾淨切緣一樣是「墨汁沒有沾到腫瘤」。');
      if (ctnParts().t === 't4d') {
        OL.push('<b>但發炎性乳癌不可以做乳房保留手術</b> —— 本例原本是 cT4d，請改選「要做全乳切除」。');
      }
    } else {
      OL.push('<b>做全乳切除，並做適當的腋下分期</b>（p12）。可以同時討論乳房重建。');
    }

    OL.push(H('腋下 —— 術前治療後的規則和直接手術不一樣', 'p13、p14'));
    if (pn === 'n0') {
      OL.push('<b>原本是臨床 cN0 → 術前治療後做 SLNB 即可。</b>');
      OL.push(EV('前提是治療期間沒有臨床惡化。若曾經惡化，就要做 ALND（p13）。'));
    } else {
      OL.push('<b>原本臨床腋下陽性、治療後腋下轉為陰性 → 可以只做 SLNB，但取樣必須「足量」，' +
        '定義是二選一</b>：' + SUB([
          '<b>用雙示蹤劑，而且取下 ≥ 3 顆</b>淋巴結；或',
          '<b>SLNB，加上取出術前做過標記的那一顆</b>（不論總顆數）'
        ]));
      OL.push('<b>結果 pN0 → 不必廓清。只要有任何一顆陽性 —— 包含 micrometastasis pN1mi 與 isolated tumor cells pN0(i+) —— 就要做 ALND</b>（p14）。');
      OL.push('<b>治療後腋下仍然陽性 → 直接做 ALND。</b>');
      OL.push(EV('這裡和直接手術最大的不同：<b>直接手術可以套 Z0011 免廓清，術前治療後不行。</b>' +
        '術前治療後任何殘存的淋巴結轉移都代表對治療反應不完全，門檻因此拉到「一顆都不能有」。'));
    }

    fill('bc_r_na_op', 'rec-elective',
      (S.nresp === 'op_bct' ? '乳房保留手術' : '全乳切除') + ' ＋ 腋下分期', OL,
      'p12（術前治療後的手術原則）、p13、p14（術前治療情境的腋下分期策略）。',
      more(axillaReference()));

    show('bc_n_ypath', true);
    if (!S.ypath) return;

    renderAdjuvant('bc_r_na_adj', 'na');
    fu('bc_f_na', null);
  }

  function neoRegimenLines() {
    var L = [], s = S.sub, p = ctnParts();

    if (s === 'her2hr' || s === 'her2') {
      L.push(H('處方 · HER2 陽性', 'p18、p34、p35'));
      L.push('<b>化療加 ' + drug('trastuzumab') + '，至少 18 週。</b>');
      L.push('<b>淋巴結陽性者建議再加上 ' + drug('pertuzumab') + '</b>（p17、p18）。');
      L.push('常見排法：EC 或 AC 之後接 taxane 加抗 HER2；或先打 taxane 加抗 HER2，再接 EC 或 AC。');
      L.push('<b>抗 HER2 抗體不要和 anthracycline 同時打</b>（心臟毒性），要和 taxane 一起（p34）。');
      L.push('<b>trastuzumab 總療程未特別指定時應為滿 1 年</b>（p17）。');
      L.push(EV('TCHP 處方：docetaxel 75 mg/m² ＋ carboplatin AUC 5–6（或 cisplatin 50–70 mg/m²）每 21 天 ×6，' +
        '搭配 trastuzumab（±pertuzumab）。院內共識：taxane 改成每週 paclitaxel 80 mg/m²（D1、D8、D15）、' +
        '或白金改成 carboplatin AUC 1.5 每週，都符合「taxane 加白金」的概念（p35）。<br>' +
        'trastuzumab 劑量：6 mg/kg 每 3 週（首劑加 2 mg/kg 負荷劑量），或 2 mg/kg 每週，或 4 mg/kg 每 2 週；' +
        '皮下劑型為固定 600 mg 每 3 週、不需負荷劑量。pertuzumab 首劑 840 mg，之後 420 mg 每 3 週。'));
    } else if (s === 'tnbc') {
      L.push(H('處方 · 三陰性', 'p19、p32、p33'));
      L.push('<b>≥cT1cN1 或 ≥cT2N0 者，建議在術前化療中加上 ' + drug('pembrolizumab') + '</b>（p19）。');
      L.push('<b>一旦決定用 pembrolizumab，就照 KEYNOTE-522 的處方走，不要自己拼</b>（p19、p32）：' + SUB([
        '<b>第 1–4 週期</b>（每 21 天）：pembrolizumab 200 mg ＋ paclitaxel 80 mg/m²（D1、D8、D15）＋ carboplatin AUC 5（D1）或 AUC 1.5（D1、D8、D15）',
        '<b>第 5–8 週期</b>（每 21 天）：pembrolizumab 200 mg ＋（doxorubicin 60 mg/m² 或 epirubicin 90 mg/m²）＋ cyclophosphamide 600 mg/m²',
        '<b>術後</b>：單用 pembrolizumab 200 mg 每 21 天 ×9 週期'
      ]));
      L.push('<b>不用 pembrolizumab 時，白金有兩種加法</b>（p33）：' + SUB([
        'EC 或 AC 之後接 taxane 加白金，共 4 個週期（比較常見）',
        '不用 anthracycline 的人：taxane 加白金共 6 個週期'
      ]));
      L.push('<b>優先考慮臨床試驗收案</b>（p19）。');
      L.push(EV('pembrolizumab 已於 2025-06-01 納入健保給付（早期三陰性、第 II–IIIb 期），' +
        '但<b>輔助期只給付未達 pCR 者</b>，且與輔助 olaparib 只能擇一。詳見下方健保條文。<br>' +
        '指引 p19 的原始警語仍然重要：<b>此藥會造成免疫相關不良反應，須與病人非常仔細地討論。</b>'));
    } else {
      L.push(H('處方 · 荷爾蒙受體陽性、HER2 陰性', 'p11、p28–p31'));
      L.push('<b>術前化療，或術前內分泌治療</b>（p11）。');
      L.push('<b>術前內分泌治療適合體能較差、年紀較大或腫瘤生長緩慢的人</b>；反應慢，通常要用數個月才看得到縮小。');
      L.push('化療處方沿用早期乳癌的標準處方（見下方收合的處方表）。');
      L.push(EV('這一型對化療的反應率本來就比 HER2 陽性與三陰性低，達到 pCR 的比例也低。' +
        '所以走術前治療的主要目的通常是<b>把腫瘤縮小以保留乳房</b>，而不是為了拿到 pCR 這個預後資訊。'));
    }

    if (p.g === 'high') {
      L.push(H('這一格的額外提醒', 'p11'));
      L.push('<b>局部晚期病人的療程要跑完再評估手術</b> —— 中途手術通常拿不到乾淨切緣。');
    }
    return L;
  }

  /* ---------- 術後輔助治療 ---------- */
  function renderAdjuvant(recId, path) {
    var s = S.sub, L = [], cls = 'rec-elective', title, g = null, pt = null, pn = null;

    if (path === 'up') {
      var pp = S.ptn.split('_');
      pt = pp[0]; pn = pp[1];
      g = ptnGroup(pt, pn);
      var ptr = PT_ROWS.filter(function (r) { return r[0] === pt; })[0];
      var pnc = PN_COLS.filter(function (c) { return c[0] === pn; })[0];
      title = ptr[1] + pnc[1].replace('p', '') + '（' + subLabel(s) + '）<br>→ 術後輔助治療';
      L = L.concat(adjSystemicUpfront(s, pt, pn, g));
    } else {
      title = { pcr: 'pCR', res_n0: '乳房有殘存病灶、淋巴結陰性', npos: '淋巴結仍有轉移' }[S.ypath] +
        '（' + subLabel(s) + '）<br>→ 術後輔助治療';
      L = L.concat(adjSystemicNeo(s));
    }

    if (s === 'erpos' || s === 'her2hr') {
      L.push(H('內分泌治療', 'p17、p23、p24'));
      L.push('<b>荷爾蒙受體陽性者一定要做內分泌治療</b>；<b>有化療的話，等化療結束後才開始</b>（p17）。');
      L.push('<b>停經前先用 ' + drug('tamoxifen') + '；停經後先用 aromatase inhibitor</b>（aromatase inhibitor）。' +
        '完整的排法見下方收合表。');
    }

    L = L.concat(rtLines(path));

    L.push(H('療程結束後', 'p27'));
    L.push('<b>門診每 3–6 個月一次共 5 年，之後每年一次；每年乳房影像是必要的。</b>細節見下方追蹤區塊。');

    if (path === 'up') {
      if (g === 'high') cls = 'rec-urgent';
      else if (g === 'none') cls = 'rec-nonop';
    } else if (S.ypath !== 'pcr') {
      cls = 'rec-urgent';
    }

    fill(recId, cls, title, L,
      path === 'up'
        ? 'p17（HER2 陽性）、p19／p20（三陰性）、p22（荷爾蒙受體陽性）、p21（BRCA）、p23／p24（內分泌治療）、p47／p48（放射治療）。'
        : 'p18（HER2 陽性術後）、p20（三陰性術後）、p21（BRCA 與 OlympiA）、p22、p23／p24（內分泌治療）、p49（術前治療後的放射治療）。',
      more(etReference(), chemoReference(), rtReference(), olympiaTable(), nhiEarly()));
  }

  function adjSystemicUpfront(s, pt, pn, g) {
    var L = [];
    if (s === 'her2hr' || s === 'her2') {
      L.push(H('化療與抗 HER2 治療', 'p17'));
      if (g === 'none') {
        L.push('<b>這一格（pT1mi–pT1a 且 pN0）指引寫「±（化療加 trastuzumab）」—— 給或不給都在指引範圍內。</b>');
        L.push('<b>要做的是把「絕對復發風險本來就很低」講清楚，然後和病人一起決定</b>，而不是預設要給。');
      } else if (g === 'ii') {
        L.push('<b>這一格（pT1b 且 pN0，或 pT1a 且 pN1mi）指引寫「可以考慮（consider）化療加 trastuzumab」</b>（p17）。');
        L.push('傾向給的理由：腫瘤已達 5 mm 以上、grade 高、有 LVI、年紀輕。');
      } else if (g === 'low') {
        L.push('<b>≥pT1c 且淋巴結陰性 → 化療加 ' + drug('trastuzumab') + '</b>（p17）。');
        L.push('腫瘤 &lt; 3 cm 且淋巴結陰性者可用 APT 處方：<b>每週 paclitaxel 80 mg/m² 共 12 週，' +
          'trastuzumab 從第一天起同時開始、滿 1 年</b>（p35）。');
      } else {
        L.push('<b>淋巴結陽性 → 化療加 ' + drug('trastuzumab') + '，並建議再加上 ' + drug('pertuzumab') + '</b>（p17）。');
        if (pn === 'n23') {
          L.push('<b>這一格是 ≥ 4 顆，同時也達到胸壁放射治療的明確適應症</b>（見下方放射治療段）。');
        }
      }
      if (g !== 'none') {
        L.push('<b>trastuzumab 沒有特別指定時，總療程應為滿 1 年</b>（p17）。');
        L.push(EV('健保：trastuzumab 已不限淋巴結陽性（9.18.1）；pertuzumab 於早期乳癌<b>只給付淋巴結陽性者</b>（9.70.1）。' +
          '院內立場（p21）是<b>不論淋巴結是否陽性</b>，只要腫瘤有一定大小或風險較高就建議用 trastuzumab。詳見下方健保條文。'));
      }
      if (s === 'her2hr' && (pn === 'n1' || pn === 'n23')) {
        L.push('<b>荷爾蒙受體陽性且 HER2 陽性、淋巴結陽性者，可考慮延長輔助 ' + drug('neratinib') + ' 1 年</b>（p18）。');
        L.push(EV('指引對這裡的「高風險」只舉了兩個例子：<b>淋巴結陽性</b>，或<b>術前治療後未達 pCR</b>。' +
          '院內共識是 neratinib 可以提早開始 —— 化療結束後即可，與抗 HER2 治療、內分泌治療同時進行。' +
          '<b>neratinib 目前仍未納入健保給付。</b>'));
      }
    } else if (s === 'tnbc') {
      L.push(H('化療', 'p19'));
      if (g === 'none') {
        L.push('<b>pT1mi 且 pN0 → 可以不做化療</b>（p19）。');
      } else if (g === 'ii') {
        L.push('<b>這一格（pT1a 且 pN0 或 pN1mi，或 pT1b 且 pN0）指引寫「± 化療」—— 給或不給都在指引範圍內</b>（p19）。');
        L.push('傾向給的理由：grade 3、有 LVI、年紀輕、Ki-67 很高。');
      } else {
        L.push('<b>要做化療</b>（p19：除了風險非常低的以外都有適應症）。<b>優先考慮臨床試驗收案。</b>');
      }
      if (g === 'low' || g === 'high') {
        L.push(H('直接手術後還能不能再加強？', 'p20、p21'));
        L.push('<b>帶 germline BRCA1/2 突變者：≥pT2 或 ≥pN1 時，建議加 ' + drug('olaparib') + ' 1 年</b>（p20）。');
        L.push('<b>沒有 BRCA 突變者：可以考慮加 ' + drug('capecitabine') + ' 1 年</b>（p20）。');
        L.push('<b>把 pembrolizumab 加進輔助化療，只有在充分討論後才考慮</b>（p20）。');
        L.push(EV('這裡的門檻和「術前治療後未達 pCR」不同 —— 直接手術的人沒有 pCR 這個資訊，' +
          '所以改用 pT 與 pN 當門檻。<br>' +
          '<b>capecitabine 的術後強化健保不給付</b>（條文 9.17 的乳癌適應症只到局部晚期或轉移性）。' +
          'olaparib 於 2025-06-01 起給付，條件見下方 OlympiA 表。'));
      }
    } else {
      L.push(H('要不要化療？', 'p22'));
      if (g === 'none') {
        L.push('<b>這一格（≤pT1b 且淋巴結陰性）用內分泌治療就夠了。</b>');
      } else if (g === 'ii') {
        L.push('<b>≤pT2 且淋巴結陰性 → 內分泌治療，或化療加內分泌治療。要不要加化療，取決於復發風險評估</b>（p22）。');
        L.push('<b>風險評估的三種方法（擇一）</b>：' + SUB([
          '<b>多基因檢測</b> —— Oncotype DX（有前瞻性 TAILORx 試驗支持）；MammaPrint、PAM50、EndoPredict、BCI 均為預後型',
          '<b>IHC4 分數</b>（用 ER、PR、HER2、Ki-67 四個 IHC 指標計算）',
          '<b>臨床與病理參數</b> —— 腫瘤大小、grade、年齡、Ki-67'
        ]));
        L.push(EV('<b>多基因檢測全部自費。</b>健保 2024-05-01 起的次世代定序給付，乳癌那一格只涵蓋三陰性乳癌的 BRCA 檢測。'));
      } else if (g === 'low') {
        if (pn === 'n0') {
          L.push('<b>≥pT3 且淋巴結陰性 → 傾向化療加內分泌治療</b>（p22）。');
        } else {
          L.push('<b>pT1–2 且 pN1mi 至 pN1 → 通常化療加內分泌治療，除非多基因檢測顯示復發風險低</b>（p22）。');
        }
      } else {
        L.push('<b>任何 T 但 pN2–3（≥ 4 顆）→ 化療加內分泌治療</b>（p22）。');
      }
      if (pn === 'n1' || pn === 'n23') {
        L.push(H('內分泌治療要不要加強？', 'p22'));
        L.push('<b>高風險者可加 ' + drug('abemaciclib') + ' 2 年，或 ' + drug('TS-1') + ' 1 年</b>（p22）。');
        L.push('<b>健保對 abemaciclib 的「高風險」定義很具體 —— 淋巴結陽性且符合下列其一</b>（條文 9.107）：' + SUB([
          '<b>腋下淋巴結 ≥ 4 顆</b>',
          '<b>腋下淋巴結 1–3 顆，而且腫瘤 ≥ 5 cm</b>',
          '<b>腋下淋巴結 1–3 顆，而且 grade 3</b>'
        ]));
        L.push(EV('另外還要符合：成年<b>女性</b>、ER 或 PR &gt; 30%、HER2 陰性、完成標準輔助化療與放療、' +
          '先前內分泌治療不超過 12 週、<b>術後 16 個月內開始</b>、最長 2 年。<br>' +
          '<b>台灣不看 Ki-67</b>（與 monarchE 試驗不同）；<b>男性不在條文內</b>；' +
          '<b>用了之後進展者，日後不得再申請任何 CDK4/6 抑制劑。</b><br>' +
          '<b>TS-1 未給付</b>（條文 9.46 完全沒有乳癌）；輔助 ribociclib 也未給付。'));
      }
      L.push(H('帶 BRCA 突變的話', 'p21'));
      L.push('<b>荷爾蒙受體陽性、HER2 陰性、帶 germline BRCA1/2 突變，而且淋巴結 ≥ 4 顆 → 可加 ' +
        drug('olaparib') + ' 1 年</b>。條件見下方 OlympiA 表。');
    }
    return L;
  }

  function adjSystemicNeo(s) {
    var L = [], pcr = (S.ypath === 'pcr'), npos = (S.ypath === 'npos');

    if (s === 'her2hr' || s === 'her2') {
      L.push(H('抗 HER2 治療', 'p18'));
      if (pcr) {
        L.push('<b>達到 pCR → 把 trastuzumab（±pertuzumab）打滿 1 年就好，不用換藥。</b>');
        L.push(EV('健保：術前用過 pertuzumab 且達 pCR 者可以續用（9.70.1）；' +
          'trastuzumab 與 pertuzumab、Phesgo 合併計算上限 18 個週期。'));
      } else {
        L.push('<b>沒有達到 pCR → 換成 ' + drug('T-DM1') + '</b>（依 KATHERINE 試驗，p18）。' +
          '劑量 3.6 mg/kg 每 3 週，共 14 個週期（p35）。');
        L.push('<b>不論換不換，抗 HER2 治療至少要把 trastuzumab 補滿 1 年</b>（p18）。');
        L.push('<b>若術前的處方沒有用過 anthracycline，術後可以考慮再補上</b>（p18）。');
        L.push(EV('健保 T-DM1（9.87.1，2024-08-01 起）條件比試驗窄：需已接受 ≥ 6 週期化療（taxane ≥ 3 週期）' +
          '與術前 trastuzumab ≥ 3 週期，<b>且腋下淋巴結有轉移，或淋巴結陰性但 ER 陰性且腫瘤 &gt; 2 cm</b>；' +
          '上限 14 週期，須術後 12 週內申請。KATHERINE 試驗本身收所有殘存病灶者。'));
      }
      if (s === 'her2hr' && !pcr) {
        L.push('<b>荷爾蒙受體陽性且 HER2 陽性的高風險者，可考慮延長輔助 ' + drug('neratinib') + ' 1 年</b>（p18）。');
        L.push(EV('指引對這裡的「高風險」只舉兩個例子：<b>淋巴結陽性</b>或<b>未達 pCR</b>，本例符合。' +
          '院內共識是可以提早開始 —— 化療結束後即可，與抗 HER2 治療、內分泌治療同時進行。' +
          '<b>目前仍未納入健保給付。</b>'));
      }
    } else if (s === 'tnbc') {
      L.push(H('術後還要不要加強？', 'p20'));
      if (pcr) {
        L.push('<b>達到 pCR → 沒有殘存病灶，就沒有「殘存病灶加強」的適應症。</b>' +
          '把原訂療程走完（若術前用過 pembrolizumab，術後單用 pembrolizumab 補滿）。');
        L.push(EV('健保 pembrolizumab（9.69.2(7)）的<b>輔助期只給付未達 pCR 者</b>；' +
          '達到 pCR 者術後那 9 個週期屬自費。這是台灣與 KEYNOTE-522 試驗設計最大的落差。'));
      } else {
        L.push('<b>建議加 ' + drug('capecitabine') + ' 6 至 12 個月</b>（依 CREATE-X 試驗，p20）。' +
          '劑量 1000–1250 mg/m² 每日兩次 D1–14，每 21 天一次，共 6–8 個週期（p33）。');
        L.push('<b>帶 germline BRCA1/2 突變者：建議加 ' + drug('olaparib') + ' 1 年</b>（p20）。');
        L.push('<b>olaparib 和 capecitabine 不建議併用</b>（p20）。');
        L.push('<b>術前用過 pembrolizumab 的話：可以 pembrolizumab 加 capecitabine；' +
          '若同時帶 BRCA 突變，可以 pembrolizumab 加 olaparib</b>（p20）。');
        L.push(EV('健保上有一個硬限制：<b>輔助情境的 olaparib 與 pembrolizumab 只能擇一給付</b>；' +
          'capecitabine 的術後強化<b>完全不給付</b>。所以指引列的四種組合裡，' +
          '真正能全額給付的只有「單用 pembrolizumab」或「單用 olaparib」其中一種。'));
      }
    } else {
      L.push(H('術後還要不要加強？', 'p20、p21、p22'));
      if (pcr) {
        L.push('<b>達到 pCR → 完成原訂化療療程，接內分泌治療。</b>');
      } else {
        L.push('<b>完成原訂化療療程，接內分泌治療</b>（p22）。');
        L.push('<b>帶 germline BRCA1/2 突變且未達 pCR 者，可考慮加 ' + drug('olaparib') + ' 1 年</b>' +
          ' —— 但這一型指引<b>多要求一個門檻：CPS+EG 分數 ≥ 3</b>（p21）。算法見下方收合表。');
        L.push(EV('指引 p21 對荷爾蒙受體陽性者的原話是「may set higher bar」（門檻可以訂高一點）。' +
          '不過<b>健保 9.85.4 並沒有採用 CPS+EG 那條路</b> —— 健保只認「未達 pCR」' +
          '或「直接手術後淋巴結 ≥ 4 顆」。所以會出現「試驗要求算分數、健保不要求」的落差。'));
      }
      if (npos) {
        L.push('<b>淋巴結陽性者，內分泌治療可考慮加上 ' + drug('abemaciclib') + ' 2 年</b>（p22）。');
        L.push('<b>健保的「高風險」定義 —— 淋巴結陽性且符合下列其一</b>（條文 9.107）：' + SUB([
          '<b>腋下淋巴結 ≥ 4 顆</b>',
          '<b>腋下淋巴結 1–3 顆，而且腫瘤 ≥ 5 cm</b>',
          '<b>腋下淋巴結 1–3 顆，而且 grade 3</b>'
        ]));
        L.push(EV('須<b>術後 16 個月內開始</b>、先前內分泌治療不超過 12 週、完成標準輔助化療與放療後才申請。' +
          '<b>用了之後進展者，日後不得再申請任何 CDK4/6 抑制劑。</b>'));
      }
    }
    return L;
  }

  /* 放射治療 —— 由已知的 state 算出來，不另外開步驟 */
  function rtLines(path) {
    var L = [H('放射治療', path === 'na' ? 'p49' : 'p47、p48')];

    if (path === 'na') {
      var pcr = (S.ypath === 'pcr'), npos = (S.ypath === 'npos'), c = ctnParts();
      if (npos) {
        L.push('<b>術前治療後淋巴結仍陽性 → 要做</b> post-mastectomy radiotherapy，或乳房放射治療加 regional nodal irradiation（p49）。');
      } else if (!pcr) {
        L.push('<b>沒有達到 pCR → 依「原本的臨床分期」判斷有沒有適應症</b>（p49）。本例原本是 ' + ctnName() + '。');
        if ((c.t === 't1c' || c.t === 't2') && c.n === 'n1' && (S.sub === 'her2hr' || S.sub === 'her2')) {
          L.push('<b>cT1–2N1 的 HER2 陽性且未達 pCR → 指引明列為「應該要做」</b>（p49）。');
        } else if ((c.t === 't1c' || c.t === 't2') && c.n === 'n1') {
          L.push('<b>cT1–2N1 的荷爾蒙受體陽性或三陰性、只剩乳房內殘存病灶 → 屬灰色地帶，請放射腫瘤科評估</b>（p49）。');
        } else if (c.t === 't3' && c.n === 'n0') {
          L.push('<b>cT3N0 但術後是 ypT1–2N0 → 屬灰色地帶，請放射腫瘤科評估</b>（p49）。');
        }
      } else {
        L.push('<b>達到 pCR，可以考慮省略</b> —— 需符合下列其中一項（p49）：' + SUB([
          '荷爾蒙受體陽性',
          'HER2 陽性且<b>原本</b>是 cT 任何 N0–1',
          '三陰性且<b>原本</b>是 cT1–2N0'
        ]));
        var can = (S.sub === 'erpos' || S.sub === 'her2hr') ||
          (S.sub === 'her2' && (c.n === 'n0' || c.n === 'n1')) ||
          (S.sub === 'tnbc' && (c.t === 't1ab' || c.t === 't1c' || c.t === 't2') && c.n === 'n0');
        L.push(can
          ? '<b>本例符合上面其中一項 → 可以和放射腫瘤科討論省略。</b>'
          : '<b>本例不符合上面任何一項 → 仍應依原本的臨床分期做放療。</b>');
      }
      if (S.nresp === 'op_bct') {
        L.push('<b>不過做了乳房保留手術就一定要做全乳放射治療</b>；上面談的省略是指 regional nodal irradiation 與胸壁照射的部分。');
      }
      return L;
    }

    var pp = S.ptn.split('_'), pt = pp[0], pn = pp[1];
    if (S.surg === 'bct') {
      L.push('<b>做了乳房保留手術 → 一定要做全乳放射治療</b>（p47）。');
      L.push('<b>唯一可以討論省略的族群：年齡 &gt; 70、臨床 cN0、切緣乾淨、荷爾蒙受體陽性且正在服用 tamoxifen 或 ' +
        'aromatase inhibitor</b> —— 絕對獲益很小，<b>但放療仍然改善局部控制</b>（p47）。');
      if (pn === 'n23') L.push('<b>淋巴結 ≥ 4 顆者，還要加做 regional nodal irradiation。</b>');
    } else {
      var need = [];
      if (pn === 'n23') need.push('<b>腋下淋巴結陽性 ≥ 4 顆</b>');
      if (pt === 't3' && pn !== 'n0') need.push('<b>T3 且腋下淋巴結陽性</b>');
      if (pt === 't4') need.push('<b>T4（侵犯胸壁或皮膚）</b>');
      if (need.length) {
        L.push('<b>本例符合胸壁放射治療的明確適應症：</b>' + need.join('、') + '（p47）。');
      } else if (pn === 'n1') {
        L.push('<b>腋下淋巴結陽性 1–3 顆 → 依風險因子個案判斷</b>（p47）。');
        L.push(EV('<b>指引沒有列出這裡的「風險因子」內容。</b>實務上會納入考慮的包括年齡輕、grade 3、' +
          '有 LVI、切緣接近、荷爾蒙受體陰性、取下的淋巴結數目偏少。' +
          '這一段屬指引未定義的部分，應由放射腫瘤科個案評估。'));
      } else {
        L.push('<b>本例不符合胸壁放射治療的明確適應症</b>，除非另有下列情況（p47）：<b>切緣陽性</b>、' +
          '<b>侵犯皮膚</b>、<b>侵犯胸壁</b>（只碰到胸肌筋膜不算）。');
      }
      if ((pn === 'n1' || pn === 'n1mi') &&
        (pt === 't1mi' || pt === 't1a' || pt === 't1b' || pt === 't1c' || pt === 't2')) {
        L.push('<b>若是全乳切除加 SLNB、sentinel node 1–2 顆陽性而沒做完整廓清，處理方式在 p48</b>：' + SUB([
          '<b>原則上應完成 ALND</b>',
          '取下的淋巴結不足 10 顆，且是<b>三陰性或有 LVI</b>、陽性仍為 1–2 顆 → 建議完成廓清',
          '非三陰性且無 LVI → 仍建議廓清，除非外科判斷困難、或病人充分討論後仍拒絕',
          '不做廓清時，依 AMAROS 試驗<b>改做區域放射治療（腋下加鎖骨上）± 胸壁</b>'
        ]));
      }
    }
    L.push('<b>需要化療時，放療排在化療之後</b>（p10）。');
    return L;
  }

  /* ---------- E. 轉移性 ---------- */
  function renderMbc() {
    show('bc_b_mbc', true);
    show('bc_n_msub', true);
    if (!S.sub) return;

    var needRisk = (S.sub === 'erpos' || S.sub === 'her2hr');
    if (needRisk) {
      show('bc_n_mrisk', true);
      if (!S.mrisk) return;
    }
    show('bc_n_mline', true);
    if (!S.mline) return;

    var L = [], title, cls = 'rec-elective';
    var lineTxt = { l1: '第一線', l2: '第二線', l3: '第三線以後' }[S.mline];

    L.push(H('先講三個總原則', 'p37、p42'));
    L.push('① <b>荷爾蒙受體陽性者，先用內分泌治療</b> —— 除非有 visceral crisis 或進展很快。');
    L.push('② <b>化療以「單一藥物依序使用」優於「多藥合併」。</b>');
    L.push('③ <b>HER2 陽性者，抗 HER2 藥物要和化療一起用。</b>');
    L.push(EV('第 ② 點的理由是轉移性乳癌治不好，目標是延長控制時間、同時維持生活品質；' +
      '合併化療的反應率高一點，但毒性明顯增加，整體存活沒有比較好。<br>' +
      '指引 p42 講得更直接：<b>沒有證據顯示哪一個處方比另一個好，也沒有明確的第一線處方，' +
      '病人的偏好是選擇的關鍵因素之一。</b>'));

    if (S.sub === 'erpos') { L = L.concat(mbcErLines()); title = '荷爾蒙受體陽性、HER2 陰性 · ' + lineTxt; }
    else if (S.sub === 'her2hr' || S.sub === 'her2') { L = L.concat(mbcHer2Lines()); title = 'HER2 陽性 · ' + lineTxt; }
    else { L = L.concat(mbcTnbcLines()); title = '三陰性 · ' + lineTxt; }

    if (S.mrisk === 'crisis') cls = 'rec-urgent';

    L.push(H('不論哪一型都要處理的三件事', 'p37、p43'));
    L.push('<b>骨轉移</b>：評估骨骼保護用藥。<b>健保只給付蝕骨性骨轉移</b>' +
      '（zoledronate 條文 5.5.3.2.1、denosumab 5.5.4 —— 在第 5 節不在第 9 節，所以常找不到）。');
    L.push('<b>劑量可以調整</b>：轉移期治不好，臨床上劑量會依病人的最佳利益調整，<b>不強求建議劑量</b>（p43）。');
    L.push('<b>末期病人：安寧緩和照護，照會安寧共同照護團隊</b>（p37）。');

    fill('bc_r_mbc', cls, title, L,
      'p37（總原則）、p38（內分泌治療決策圖）、p39（抗 HER2 藥物）、p40（三陰性免疫治療）、p41（PARP 抑制劑）、p42–p45（化療處方）。',
      more(mbcChemoTable(), nhiMeta()));
    fu('bc_f_mbc', 'meta');
  }

  function mbcErLines() {
    var L = [], r = S.mrisk, l = S.mline;

    L.push(H('這一線要用什麼', 'p38'));
    if (r === 'crisis') {
      L.push('<b>有 visceral crisis 或進展很快 → 先用化療，不用內分泌治療。</b>');
      L.push(EV('這是指引唯一寫明可以跳過內分泌治療的情況（p37）。<b>visceral crisis 指器官功能已經受損、' +
        '需要短時間內見效</b>，不是「有內臟轉移」就算。控制住之後，仍可以回頭換成內分泌治療加 CDK4/6 抑制劑作為維持。'));
      L.push('<b>健保的 CDK4/6 抑制劑條文明文排除 visceral crisis</b>（9.72），所以這一格本來也申請不到。');
    } else if (l === 'l1') {
      if (r === 'low') {
        L.push('<b>低風險 → 單用內分泌治療即可</b>（也可以加 CDK4/6 抑制劑）。');
        L.push('停經後用 aromatase inhibitor；停經前用卵巢功能抑制加 aromatase inhibitor 或 tamoxifen。');
      } else if (r === 'mid') {
        L.push('<b>中風險 → 內分泌治療加 CDK4/6 抑制劑</b>（單用內分泌治療、或化療也在選項內）。');
      } else {
        L.push('<b>高風險 → 化療，或內分泌治療加 CDK4/6 抑制劑</b>（兩者都在指引的選項內）。');
      }
      L.push('<b>健保給付的 CDK4/6 抑制劑只有 ' + drug('ribociclib') + ' 與 ' + drug('palbociclib') +
        '</b>（條文 9.72）—— <b>abemaciclib 在轉移性不給付</b>。');
      L.push('<b>申請條件</b>：' + SUB([
        'ER 或 PR &gt; 30%、HER2 陰性',
        '<b>沒有 visceral crisis、沒有腦轉移</b>',
        '<b>不可以只有骨轉移</b>',
        '停經後（9.72.1）：年齡 ≥ 55、或曾雙側卵巢切除、或 FSH 與 estradiol 達停經後範圍',
        '停經前、圍停經期與男性（9.72.2）：<b>須併用 aromatase inhibitor 加 GnRH 類似物</b>',
        '<b>終生上限 24 個月</b>，兩種藥只能擇一'
      ]));
      L.push(EV('「不可以只有骨轉移」這條最容易踩到 —— 只有骨轉移的病人反而申請不到，' +
        '雖然臨床上這是預後最好、最適合長期內分泌治療的一群。'));
    } else {
      L.push('<b>先問一個問題：之前用過什麼？後線的選擇幾乎完全由前面用過什麼決定。</b>');
      L.push('<b>用過 CDK4/6 抑制劑後進展，而且驗到基因變異的話</b>：' + SUB([
        '<b>PIK3CA 突變</b> → ' + drug('alpelisib') + ' 加 fulvestrant（健保 9.129，2026-01-01 起，限停經後）',
        '<b>PIK3CA、AKT1 或 PTEN 任一變異</b> → ' + drug('capivasertib') + ' 加 fulvestrant（健保 9.135，2026-06-01 起，限停經後）',
        '⚠ <b>這兩條擇一給付，不能都用</b>'
      ]));
      L.push('<b>非固醇類 aromatase inhibitor 失敗後</b>：' + drug('everolimus') +
        ' 加 exemestane（健保 9.36.1 第 4 項；限無 visceral crisis、未曾用過 exemestane）。');
      L.push('<b>⚠ 順序陷阱：用過 everolimus 失敗者，之後不得再申請 CDK4/6 抑制劑</b>（9.72.6）。' +
        '所以 <b>CDK4/6 抑制劑要排在 everolimus 前面</b>。');
      L.push('<b>如果帶 germline BRCA1/2 突變 → 可以用 PARP 抑制劑（' + drug('olaparib') + ' 或 ' +
        drug('talazoparib') + '），但要自費。</b>');
      L.push(EV('健保 9.85.2 的 PARP 抑制劑<b>只給付三陰性</b>；' +
        '<b>ER/PR(+) 的 BRCA 突變轉移性乳癌不給付</b>（指引 p41 已寫明這一點，至今未變）。'));
      L.push('<b>用過 CDK4/6 抑制劑 ≤ 12 個月、有內臟轉移，又已接受 ≥ 2 線轉移性化療者 → ' +
        drug('sacituzumab govitecan') + '</b>（健保 9.106，2025-10-01 起新增此適應症）。');
      L.push('<b>' + drug('elacestrant') + ' 在台灣未給付</b>（健保藥品清單查無此成分）。');
      L.push('<b>內分泌治療的選項走完了就換化療</b> —— 處方見下方收合表。');
    }
    return L;
  }

  function mbcHer2Lines() {
    var L = [], l = S.mline;
    L.push(H('這一線要用什麼', 'p39、p44'));
    if (l === 'l1') {
      L.push('<b>第一線首選：' + drug('trastuzumab') + ' ＋ ' + drug('pertuzumab') + ' ＋ taxane</b>（p44）。');
      L.push(EV('劑量：trastuzumab 6 mg/kg（首劑 8 mg/kg）＋ pertuzumab 420 mg（首劑 840 mg），每 3 週；' +
        '搭配 docetaxel 75 mg/m² 每 3 週，或 paclitaxel 80 mg/m²（D1、D8、D15）。<br>' +
        '健保：pertuzumab 與 Phesgo 於轉移性<b>限第一線</b>，上限 18 個月（9.70.2／9.112.2）。'));
    } else if (l === 'l2') {
      L.push('<b>第二線：' + drug('T-DM1') + ' 或 ' + drug('T-DXd') + '</b>（p39、p44）。');
      L.push('<b>⚠ 這裡有一條會影響後面所有安排的健保限制：T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換；' +
        'T-DXd 與 sacituzumab govitecan 也互斥。</b>排順序前先算清楚。');
      L.push(EV('劑量：T-DM1 3.6 mg/kg 每 3 週（健保 9.87.2，上限 10 個月／13 週期）；' +
        'T-DXd 5.4 mg/kg 每 3 週（健保 9.115，HER2 陽性第二線上限 18 週期）。<br>' +
        '指引 p39 寫 T-DXd「未給付」—— <b>這一項已於 2025-02-01 反轉。</b>'));
    } else {
      L.push('<b>第三線以後可用的：</b>' + SUB([
        '<b>' + drug('T-DXd') + '</b> —— 在任何含 trastuzumab 的治療失敗後皆可（p39）',
        '<b>' + drug('lapatinib') + ' 加 ' + drug('capecitabine') + '</b> —— <b>健保限腦轉移</b>，且已用過 anthracycline、taxane 與 trastuzumab 後進展（9.47）',
        '<b>' + drug('neratinib') + ' 加 capecitabine</b> —— <b>未給付</b>（p39）',
        '<b>' + drug('tucatinib') + '</b> —— <b>未給付</b>',
        '<b>trastuzumab 繼續用下去、換化療夥伴</b> —— 這是實務上最常走的一條'
      ]));
      L.push(EV('lapatinib 加 capecitabine 劑量：lapatinib 1250 mg 每日一次 ＋ capecitabine 1250 mg/m² ' +
        '每日兩次 D1–14，每 3 週（最大劑量，p44）。'));
    }
    if (S.sub === 'her2hr') {
      L.push(H('荷爾蒙受體也陽性的話', 'p37'));
      L.push('<b>抗 HER2 治療仍然是主軸</b>；內分泌治療可以在化療結束後接上去作為維持。');
      L.push(EV('健保的 CDK4/6 抑制劑條文（9.72）<b>要求 HER2 陰性</b>，所以這一型用不到 CDK4/6 抑制劑的給付。'));
    }
    L.push(H('腦轉移', 'p39'));
    L.push('<b>HER2 陽性的腦轉移比例高，有神經症狀時要積極影像評估。</b>' +
      '健保的 lapatinib 條文正是為腦轉移而設（9.47）。');
    return L;
  }

  function mbcTnbcLines() {
    var L = [], l = S.mline;
    L.push(H('這一線要用什麼', 'p40、p41、p44'));
    if (l === 'l1') {
      L.push('<b>第一線：化療；適合的人再加上免疫治療</b>（p40）。');
      L.push('<b>兩個試驗的 companion diagnostic 不一樣，不可以混用</b>：' + SUB([
        '<b>IMpassion130</b> —— 用 <b>Ventana SP142</b> 判讀 PD-L1 免疫細胞陽性；化療夥伴是 nab-paclitaxel；藥是 atezolizumab',
        '<b>KEYNOTE-355</b> —— 用 <b>Dako 22C3</b> 判讀 <b>CPS ≥ 10</b>；化療夥伴是 gemcitabine 加白金、nab-paclitaxel 或 paclitaxel；藥是 pembrolizumab'
      ]));
      L.push('<b>院內立場：認同第一線加免疫治療的概念、依各自建議的 companion diagnostic 選病人，但化療夥伴可以放寬</b>（p40）。');
      L.push('<b>⚠ 但轉移性三陰性的免疫治療在台灣完全不給付</b> —— 健保 9.69 的乳癌只有「早期三陰性乳癌」一格，' +
        '<b>這兩個處方目前都是自費</b>。');
      L.push(EV('PD-L1 驗出 CPS ≥ 10（Dako 22C3）只代表符合 KEYNOTE-355 的族群定義，' +
        '<b>不代表拿得到給付</b>；開始前務必把費用講清楚。'));
      L.push(H('如果帶 BRCA1/2 生殖細胞突變', 'p41'));
      L.push('<b>' + drug('olaparib') + ' 或 ' + drug('talazoparib') + ' 有給付</b>（健保 9.85.2）—— ' +
        '限 ER、PR、HER2 皆陰性且 <b>germline</b> BRCA1/2 突變。兩藥擇一。');
      L.push(EV('這一條是三陰性與 ER/PR(+) 最大的給付差別 —— 同樣帶 BRCA 突變，三陰性有給付，ER/PR(+) 沒有。'));
    } else if (l === 'l2') {
      L.push('<b>換另一個化療處方</b>（單一藥物依序使用；處方見下方收合表）。');
      L.push('<b>帶 germline BRCA1/2 突變、而且還沒用過 PARP 抑制劑的話，這一線可以用 ' + drug('olaparib') +
        ' 或 ' + drug('talazoparib') + '，健保有給付</b>（9.85.2，限三陰性加 germline BRCA 突變）。');
    } else {
      L.push('<b>第三線以後：' + drug('sacituzumab govitecan') + '</b> —— 10 mg/kg，D1、D8，每 3 週（p44）。');
      L.push('<b>健保條件（9.106）</b>：' + SUB([
        '已失敗 <b>≥ 2 線</b>全身治療，其中 <b>≥ 1 線</b>用於晚期',
        'ECOG ≤ 1',
        '曾使用過 taxane',
        '<b>未曾使用過 T-DXd</b>（兩者互斥）'
      ]));
      L.push('<b>HER2 低表現者（ER 與 PR 皆陰性，且 HER2 IHC 1+，或 2+ 但 ISH 陰性）可以用 ' +
        drug('T-DXd') + '</b>（健保 9.115）。');
      L.push(EV('三陰性報告上寫 HER2 IHC 1+ 或 2+/ISH 陰性的人，其實有一條額外的路 —— ' +
        '這是 2023 年指引沒有、2025-02-01 才開的給付。翻病理報告時要特別看這一欄。'));
    }
    L.push(EV('指引 p45 列出<b>不建議當第一線</b>的三個藥：mitoxantrone、mitomycin C、ixabepilone —— ' +
      '應保留給已經治療過很多線、沒有其他選擇的病人。'));
    return L;
  }

  /* ---------- F. 局部區域復發 ---------- */
  function renderRecur() {
    show('bc_b_recur', true);
    show('bc_n_rsite', true);
    if (!S.rsite) return;

    var L = [], title;

    if (S.rsite === 'local') {
      show('bc_n_rprev', true);
      if (!S.rprev) return;
      title = '只有局部復發（乳房內或胸壁）';
      L.push(H('局部處置 —— 完全取決於當初做過什麼', 'p36'));
      if (S.rprev === 'bct_rt') {
        L.push('<b>當初是乳房保留手術加放射治療 → 這次做全乳切除，並做淋巴結分期</b>' +
          '（如果第 I／II 級腋下廓清之前沒有做過）。');
        L.push(EV('乳房不能再照一次放療，所以局部控制只能靠手術。淋巴結分期要不要做，取決於當年有沒有做過完整廓清。'));
      } else if (S.rprev === 'bct_lnd_rt') {
        L.push('<b>當初是乳房保留手術加腋下淋巴結手術加放射治療 → 能開就開；不能開就先做全身治療，之後再評估手術</b>（p36）。');
      } else {
        L.push('<b>當初沒有做過放射治療 → 能開就開，並加做胸壁、鎖骨上與鎖骨下淋巴結的放射治療</b>（p36）。');
        L.push(EV('這一格是唯一還有放療空間的 —— 當年沒照過，這次可以照。'));
      }
    } else {
      title = { axilla: '腋下淋巴結復發', scf: '鎖骨上淋巴結復發', imn: '內乳淋巴結復發' }[S.rsite];
      L.push(H('局部處置', 'p36'));
      if (S.rsite === 'axilla') {
        L.push('<b>能開就開；放射治療照胸壁、鎖骨上、鎖骨下與腋下</b>（可行的話）。');
      } else if (S.rsite === 'scf') {
        L.push('<b>以放射治療為主，照胸壁、鎖骨上與鎖骨下</b>（可行的話）。');
      } else {
        L.push('<b>放射治療照胸壁、鎖骨上、鎖骨下與內乳淋巴結</b>（可行的話）。');
      }
    }

    L.push(H('全身治療 —— 這一段才是重點', 'p36 註 *'));
    L.push('<b>不論復發在哪裡，都要做全身治療。</b>');
    L.push(EV('指引註記寫明依據是 <b>CALOR 試驗</b> —— 可完全切除的局部復發，術後再給化療能改善結果。' +
      '常見的錯誤是把局部復發當成「再開一次刀就好」，只處理局部而不給全身治療。'));
    L.push('<b>先確認沒有遠處轉移</b>（此時屬「強烈建議做全身分期」的情境，p3）；有遠處轉移就改走轉移性乳癌流程。');
    L.push('<b>復發病灶要重新做 ER、PR、HER2 染色</b> —— 受體狀態可能和原發灶不一樣，會改變用藥。');
    L.push('全身治療的藥物依重新確認的亞型決定，並把<b>之前用過什麼、用了多久</b>算進去。');

    fill('bc_r_recur', 'rec-urgent', title, L,
      'p36（局部與區域復發的處置表，含 CALOR 試驗註記）、p3（全身分期）、p2（IHC 重驗）。', null);
    fu('bc_f_recur', null);
  }

  /* ---------- G. 治療中進展 ---------- */
  function renderProg() {
    show('bc_b_prog', true);
    show('bc_n_pstage', true);
    if (!S.pstage) return;

    var L = [], title;
    L.push(H('第一件事：先確認這是局部還是全身的問題', 'p2、p3'));
    L.push('<b>做影像確認有沒有遠處轉移。</b>有遠處轉移 → 回步驟 1 改走「轉移性乳癌」。');
    L.push('<b>可以切片就重新切片</b>，重驗 ER、PR、HER2 —— 受體會變，尤其在治療壓力下。');

    if (S.pstage === 'na') {
      title = '術前藥物治療期間腫瘤變大或臨床惡化';
      L.push(H('處置', 'p12、p13'));
      L.push('<b>換一個沒有交叉抗藥性的處方，或評估直接手術</b>（若仍可切除）。<b>優先考慮臨床試驗收案。</b>');
      L.push('<b>腋下不可以只做 SLNB —— 要做 ALND</b>（p13 明文的例外）。');
      L.push(EV('指引原文：「after NACT, SLNB alone, <b>unless clinical PD</b>」。' +
        '對治療沒有反應的腫瘤，sentinel node 的偽陰性率無法接受。'));
      L.push('<b>建議提多專科團隊會議討論</b> —— 這一群病人預後差，不宜單一科別決定。');
    } else if (S.pstage === 'chemo') {
      title = '輔助化療還沒做完就復發';
      L.push(H('處置', 'p42、p43'));
      L.push('<b>這代表對現行處方有抗藥性 —— 換一個不同機轉、沒有交叉抗藥性的處方。</b>');
      L.push('<b>把 anthracycline 的累積劑量算清楚</b>：它有終生累積劑量上限，換藥前先算已經用掉多少。');
      L.push(EV('指引 p43 講得很清楚：早期乳癌的所有處方轉移時都可以用，' +
        '<b>只有「已知抗藥性的疑慮（例如快速復發）」或 anthracycline 已達累積劑量時才不適合</b>。' +
        '在治療中復發，正好就是那個「已知抗藥性」的情況。'));
    } else if (S.pstage === 'et') {
      title = '輔助內分泌治療期間，或結束後 12 個月內復發';
      L.push(H('處置', 'p38'));
      L.push('<b>在輔助內分泌治療期間進展，或結束後 12 個月內復發 → 下一步用 ' + drug('fulvestrant') +
        ' 加 CDK4/6 抑制劑，不要再用同一類的內分泌單方。</b>');
      L.push('<b>兩個時間門檻不要搞混</b>：' + SUB([
        '<b>2 年</b> —— 用來「分類」抗藥型別：輔助治療前 2 年內復發叫原發性抗藥，2 年後才復發叫續發性抗藥',
        '<b>12 個月</b> —— 用來「決定下一步用什麼藥」：治療中進展或結束後 12 個月內復發，就換 fulvestrant 加 CDK4/6 抑制劑'
      ]));
      L.push(EV('分類（2 年）是用來估預後與溝通的，換藥（12 個月）才是實際的操作門檻。' +
        '這兩個數字來自不同的文件體系，很常被混在一起講。'));
      L.push('<b>健保：CDK4/6 抑制劑已不限第一線</b>（9.72），但仍要求沒有 visceral crisis、沒有腦轉移、不可以只有骨轉移。');
    } else {
      title = '抗 HER2 輔助治療期間或剛結束就復發';
      L.push(H('處置', 'p39、p44'));
      L.push('<b>視為對 trastuzumab 有抗藥性 → 下一步換 ' + drug('T-DM1') + ' 或 ' + drug('T-DXd') + '。</b>');
      L.push('<b>T-DXd 的適應症是「任何含 trastuzumab 的治療失敗後」</b>（p39）—— 輔助期失敗也算在內。');
      L.push('<b>⚠ 健保限制：T-DXd、T-DM1、lapatinib 三者只能擇一給付、不可互換</b>；' +
        'T-DXd 與 sacituzumab govitecan 也互斥。');
      L.push(EV('若復發在腦部，lapatinib 加 capecitabine 是健保唯一為腦轉移設計的條文（9.47），' +
        '但要求已用過 anthracycline、taxane 與 trastuzumab 後進展。'));
    }

    L.push(H('共通的一句話', 'p37'));
    L.push('<b>最終治療決定仍取決於病人與醫師的討論</b>；末期病人應照會安寧共同照護團隊。');

    fill('bc_r_prog', 'rec-urgent', title, L,
      'p12、p13（術前治療中進展）、p38（內分泌抗藥）、p39（抗 HER2 後線）、p42、p43（化療原則）、p2、p3（重驗與分期）。',
      more(nhiMeta()));
    fu('bc_f_prog', 'meta');
  }

  /* ==========================================================
     7. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (!S.scope) return;
    if (S.scope === 'dx') renderDx();
    else if (S.scope === 'dcis') renderDcis();
    else if (S.scope === 'lcis') renderLcis();
    else if (S.scope === 'inv') renderInv();
    else if (S.scope === 'mbc') renderMbc();
    else if (S.scope === 'recur') renderRecur();
    else if (S.scope === 'prog') renderProg();
  }

  /* ==========================================================
     8. 互動
     ========================================================== */
  var SEL_GROUPS = ['bc_n1', 'bc_n_dx', 'bc_n_dloc', 'bc_n_dmar', 'bc_n_sub', 'bc_n_ctn', 'bc_n_plan',
    'bc_n_surg', 'bc_n_ptn', 'bc_n_nresp', 'bc_n_ypath',
    'bc_n_msub', 'bc_n_mrisk', 'bc_n_mline',
    'bc_n_rsite', 'bc_n_rprev', 'bc_n_pstage'];

  /* 上游一改，下游全部歸零 —— 否則會出現「上游的建議掛在下游選項後面」 */
  var DOWNSTREAM = {
    scope: ['img', 'dloc', 'dmar', 'sub', 'ctn', 'plan', 'surg', 'ptn', 'nresp', 'ypath',
      'mrisk', 'mline', 'rsite', 'rprev', 'pstage'],
    dloc: ['dmar'],
    sub: ['ctn', 'plan', 'surg', 'ptn', 'nresp', 'ypath', 'mrisk', 'mline'],
    ctn: ['plan', 'surg', 'ptn', 'nresp', 'ypath'],
    plan: ['surg', 'ptn', 'nresp', 'ypath'],
    surg: ['ptn'],
    nresp: ['ypath'],
    mrisk: ['mline'],
    rsite: ['rprev']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function bcPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      /* 先把所有選取標記清掉，render 之後再依 state 重打 —— 這樣下游的
         舊選取不會殘留在畫面上（那是「上游建議掛在下游」的來源）。 */
      clearSelectionMarks();
    }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var sel = btn.classList.contains('tn-cell') ? '.tn-cell' : '.flow-opt';
      var g = btn.parentNode;
      if (g) g.querySelectorAll(sel).forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }

  /* 依 state 重新標記所有選取 —— 格子是每次 render 重畫的，必須這樣補 */
  function reapplyMarks() {
    var pairs = [
      ['bc_n1', 'scope'], ['bc_n_dx', 'img'], ['bc_n_dloc', 'dloc'], ['bc_n_dmar', 'dmar'],
      ['bc_n_sub', 'sub'], ['bc_n_plan', 'plan'], ['bc_n_surg', 'surg'], ['bc_n_nresp', 'nresp'],
      ['bc_n_ypath', 'ypath'], ['bc_n_msub', 'sub'], ['bc_n_mrisk', 'mrisk'],
      ['bc_n_mline', 'mline'], ['bc_n_rsite', 'rsite'],
      ['bc_n_rprev', 'rprev'], ['bc_n_pstage', 'pstage']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /bcPick\('([a-z]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
    if (S.sub && S.ctn) {
      var c = el('bc_ctnc_' + S.sub + '_' + S.ctn); if (c) c.classList.add('selected');
    }
    if (S.sub && S.ptn) {
      var d = el('bc_ptnc_' + S.sub + '_' + S.ptn); if (d) d.classList.add('selected');
    }
  }

  function bcReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    var h1 = el('bc_ctn_hold'); if (h1) h1.innerHTML = '';
    var h2 = el('bc_ptn_hold'); if (h2) h2.innerHTML = '';
    render();
  }

  function initBreastPathway() { bcReset(); }

  global.breastPathwayHTML = breastPathwayHTML;
  global.initBreastPathway = initBreastPathway;
  global.bcPick = bcPick;
  global.bcReset = bcReset;
})(window);
