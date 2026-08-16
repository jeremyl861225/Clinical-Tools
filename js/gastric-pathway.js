/* ============================================================
   胃癌治療互動決策流程 Gastric Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全部重寫（第二版）。舊版已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 胃癌診療指引
   （文件編號 50710-2-000013，版次 17；2026/06/16 修制訂／檢視／公告；
     AGC-1～AGC-5、AGC-P）。19 頁全部 render 成 PNG 逐頁核對。
   健保給付條文查詢日：2026-08-17（健保署藥品給付規定第 9 節）。

   ── 遵守的六條版面規則（見 skill: pathway-ux-rules.md）────────────
   1. 沒有選之前，下游的步驟與建議框一律不出現（collapseAll）。
   2. 建議框只講「它正上方那一步」的結論。
   3. 決策用正常字；理由與試驗數據降階成小灰字（li.ev）或收合（details）。
   4. 同一件事只寫一次，共用內容各自只有一個函式。
   5. 臨床術語用英文原詞；縮寫只留大家都用的（ESD、EGD、CPS、MMR、MSI、
      CLDN18.2、HER2、ECOG、RT）。中英之間補半形空白。
   6. 凡是「高風險」「符合條件」，一定要在同一格寫出條件內容。

   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  /* ==========================================================
     0. 狀態
     ========================================================== */
  var S = {};
  var KEYS = [
    'scope',    // work | esd | postop | meta | recur
    'extent',   // AGC-1 分流：fitres | fitunres | unfit | m1
    'plan',     // 可切除者：up（直接手術）| peri（術前化療）
    'einx',     // ESD 適應症：i1 | i2 | i3 | none
    'ecur',     // ESD 後是否 curative：yes | no
    'rstat',    // 手術切除程度：r0 | r1 | r2 | m1
    'ptn',      // 術後病理 pT×pN 格
    'rest',     // 化療後再分期：ccr | residual
    'her2',     // HER2 狀態：pos | neg
    'bio',      // HER2 陰性的生物標記：cps5 | cps1 | msi | cldn | none
    'hcps',     // HER2 陽性的 CPS：lt1 | ge1
    'fit',      // 體能：good | poor
    'line',     // 線別：l1 | l2 | l3
    'rps'       // 復發時的體能：good | poor
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/index.js 逐碼實跑核對）
     ⚠ 'HE 1CE35' 與 'TA 1CC06' 內含半形空白，任何環節都不可 trim。
     ========================================================== */
  var GC_DRUGS = [
    { key: '5-FU', re: '5-FU|fluorouracil', cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']] },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']] },
    { key: 'S-1', re: 'S-1|TS-1', cards: [['17', 'TS14CB44', 'TS-1 愛斯萬膠囊 20 mg', 'tegafur ＋ gimeracil ＋ oteracil']] },
    { key: 'UFUR', re: 'UFUR|tegafur/uracil|uracil-tegafur',
      cards: [['17', 'UFU4CB31', 'UFUR 友復膠囊（tegafur 100 mg ＋ uracil 224 mg）', 'tegafur ＋ uracil']] },
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg/50 mL']] },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑 80 mg/4 mL']] },
    { key: 'paclitaxel', re: '(?<!nab-)paclitaxel', cards: [['17', 'PHY1CC03', 'Phyxol 輝克癒蘇注射劑 30 mg/5 mL']],
      flag: '胃癌無健保給付' },
    { key: 'irinotecan', re: '(?<!liposomal )irinotecan', cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']] },
    { key: 'trastuzumab', re: '(?<!-)trastuzumab(?!-)',
      cards: [['17', 'HE 1CE35', 'Herceptin 賀癌平凍晶注射劑 440 mg'],
              ['17', 'HER1CH25', 'Herzuma 赫珠瑪凍晶注射劑 440 mg（生物相似藥）', 'trastuzumab'],
              ['17', 'OGI1CH25', 'Ogivri 癌吉清凍晶注射劑 440 mg（生物相似藥）', 'trastuzumab']] },
    { key: 'trastuzumab-deruxtecan', re: 'trastuzumab-deruxtecan|T-DXd',
      cards: [['17', 'ENH1CH06', 'Enhertu 優赫得注射劑 100 mg', 'trastuzumab deruxtecan']],
      flag: '胃癌無健保給付' },
    { key: 'ramucirumab', cards: [['17', 'CYR1CEL4', 'Cyramza 欣銳擇注射劑 100 mg/10 mL']],
      flag: '胃癌無健保給付（9.92 限肝癌）' },
    { key: 'zolbetuximab', cards: [['17', 'VYL1CH60', 'Vyloy 威絡益凍晶注射劑 100 mg']] },
    { key: 'nivolumab', cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑 20 mg/2 mL、120 mg/12 mL']] },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']] },
    { key: 'trifluridine ＋ tipiracil', re: 'trifluridine|tipiracil|Lonsurf',
      cards: [['17', 'LON4CB57', 'Lonsurf 朗斯弗膜衣錠 15 mg／20 mg', 'trifluridine ＋ tipiracil']] }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="gcPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="gc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="gc-node" id="' + id + '">' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div></div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }

  function H(title, src) {
    return '<span class="rx-h">' + title + '</span>' + (src ? '　<span class="rx-sub">' + src + '</span>' : '');
  }
  function EV(t) { return '@ev ' + t; }
  function SUB(items) { return '<ul class="rec-sub"><li>' + items.join('</li><li>') + '</li></ul>'; }
  /* 否定句裡的藥名要包起來 —— 藥卡掃描是純字串比對，不包的話
     「輔助情境 oxaliplatin 不給付」會長出一張歐力普的卡。 */
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }

  function fold(summary, inner) {
    return '<details class="kps-details"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function foldRx(summary, inner) {
    return '<details class="kps-details rx-table"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function more() {
    var parts = [].slice.call(arguments).filter(Boolean);
    if (!parts.length) return '';
    return '<ul class="rec-detail rec-more"><li>' + parts.join('</li><li>') + '</li></ul>';
  }

  /* ==========================================================
     2. 術後病理 pT×pN 決策格（AGC-3；分期依 AJCC 第 8 版）
     ========================================================== */
  var GCLS = { none: 'g-none', ii: 'g-ii', low: 'g-low', high: 'g-high' };

  function gridHTML(idBase, stateKey, cols, rows, groupOf, legend, note) {
    var n = cols.length;
    var h = '<div class="tn-wrap"><div class="tn-grid' +
      (n === 5 ? ' tn-c5' : (n === 4 ? ' tn-c4' : (n === 2 ? ' tn-c2' : ''))) + '">';
    h += '<div class="tn-corner"></div>';
    cols.forEach(function (c) {
      h += '<div class="tn-ch">' + c[1] + (c[2] ? '<span class="tn-sub2">' + c[2] + '</span>' : '') + '</div>';
    });
    rows.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + (r[2] ? '<span class="tn-sub2">' + r[2] + '</span>' : '') + '</div>';
      cols.forEach(function (c) {
        var key = r[0] + '_' + c[0];
        h += '<button class="tn-cell ' + GCLS[groupOf(r[0], c[0])] + '" id="' + idBase + '_' + key + '" ' +
          'onclick="gcPick(\'' + stateKey + '\',\'' + key + '\',this)">' + r[3] + c[3] + '</button>';
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

  var PT_ROWS = [
    ['t1', 'pT1', '黏膜或黏膜下層', 'T1'],
    ['t2', 'pT2', '固有肌層', 'T2'],
    ['t3', 'pT3', '漿膜下', 'T3'],
    ['t4a', 'pT4a', '穿透漿膜', 'T4a'],
    ['t4b', 'pT4b', '侵犯鄰近器官', 'T4b']
  ];
  var PN_COLS = [
    ['n0', 'pN0', '0 顆', 'N0'],
    ['n1', 'pN1', '1–2 顆', 'N1'],
    ['n2', 'pN2', '3–6 顆', 'N2'],
    ['n3a', 'pN3a', '7–15 顆', 'N3a'],
    ['n3b', 'pN3b', '≥ 16 顆', 'N3b']
  ];
  /* 分期取自 AJCC 第 8 版病理分期表（與本頁「分期 TNM」頁籤同一份）。
     none ＝ AGC-3 的「pT1N0／pT2N0 → 直接追蹤」；
     low  ＝ 要輔助化療，但病理分期是第 I–II 期；
     high ＝ 病理第 III 期 —— AGC-5 註 a 指名這一格優先用 S-1 ＋ docetaxel 或 SOX。 */
  var STAGE = {
    t1: ['IA', 'IB', 'IIA', 'IIB', 'IIIB'],
    t2: ['IB', 'IIA', 'IIB', 'IIIA', 'IIIB'],
    t3: ['IIA', 'IIB', 'IIIA', 'IIIB', 'IIIC'],
    t4a: ['IIB', 'IIIA', 'IIIA', 'IIIB', 'IIIC'],
    t4b: ['IIIA', 'IIIB', 'IIIB', 'IIIC', 'IIIC']
  };
  var NIDX = { n0: 0, n1: 1, n2: 2, n3a: 3, n3b: 4 };
  function stageOf(r, c) { return STAGE[r][NIDX[c]]; }
  function ptnGroup(r, c) {
    if (c === 'n0' && (r === 't1' || r === 't2')) return 'none';
    return stageOf(r, c).indexOf('III') === 0 ? 'high' : 'low';
  }
  var PTN_LEGEND = [
    ['none', '不需要輔助化療，直接追蹤'],
    ['low', '要輔助化療（病理第 I–II 期）'],
    ['high', '要輔助化療（病理第 III 期）']
  ];
  function ptnParts() {
    var p = S.ptn.split('_');
    return { t: p[0], n: p[1], g: ptnGroup(p[0], p[1]), st: stageOf(p[0], p[1]) };
  }
  function ptnName() {
    var p = ptnParts();
    var tr = PT_ROWS.filter(function (r) { return r[0] === p.t; })[0];
    var cc = PN_COLS.filter(function (c) { return c[0] === p.n; })[0];
    return tr[1] + cc[1].replace('p', '');
  }

  /* ==========================================================
     3. 共用參考區塊 —— 每一段只在這裡定義一次
     ========================================================== */

  /* 3a. 手術原則（AGC-2 2 of 3） */
  function surgeryReference() {
    return fold('<b>根治性手術的原則</b>：切多少、廓清到哪裡、什麼情況叫做切不下來（AGC-2）',
      '<table>' +
      '<tr><td>術式</td><td><b>遠端（body ＋ antrum）→ subtotal gastrectomy 為優先</b>；' +
      '<b>近端（cardia）→ total 或 proximal gastrectomy，依情況而定</b></td></tr>' +
      '<tr><td>脾臟</td><td><b>可行的話避免切脾</b>（splenectomy: avoided, if possible）</td></tr>' +
      '<tr><td>切緣</td><td><b>距離肉眼腫瘤上下各 &gt; 5 cm 為優先</b></td></tr>' +
      '<tr><td>淋巴結廓清</td><td><b>D0 不可接受；建議做 D2</b>（D0: unacceptable；D2: recommended）</td></tr>' +
      '<tr><td>淋巴結顆數</td><td><b>至少要評估 16 顆</b>（AGC-2、AGC-P 都寫）</td></tr>' +
      '<tr><td><b>什麼叫做<br>切不下來</b></td><td>符合任一項即為 unresectable for cure：' +
      '<b>① 腹膜播種或遠處轉移；② 無法完成完整切除；③ 侵犯或包覆主要血管構造</b></td></tr>' +
      '<tr><td>D 廓清的<br>站別範圍</td><td>依術式而異（全胃／遠端／近端／保留幽門各不相同），' +
      '見本頁<b>「淋巴結分群」頁籤</b>，那裡可以按術式切換</td></tr>' +
      '</table>');
  }

  /* 3b. 輔助化療處方（AGC-3、AGC-5） */
  function adjRxTable(stage3) {
    var r = '';
    r += '<tr><td><b>S-1 單方</b></td><td>台大指引把 S-1 列在第一個；' +
      '健保 9.46 給付於<b>術後輔助、TNM 第 II 期（排除 T1）、IIIA 或 IIIB 且已做根除性手術者，限用 1 年</b></td></tr>';
    r += '<tr><td><b>HDFL</b></td><td>每週一次，24 小時輸注<b>高劑量 5-FU 2000–2600 mg/m²</b> ＋ ' +
      '<b>leucovorin 300 mg/m²（最多 500 mg）</b>（劑量取自 AGC-5 化療骨架那一段）</td></tr>';
    r += '<tr><td><b>XELOX</b><br>capecitabine ＋ oxaliplatin</td><td>' +
      '⚠ <b>輔助情境的 capecitabine 與 oxaliplatin 健保不給付</b>（AGC-5 註 b）</td></tr>';
    if (stage3) {
      r += '<tr><td><b>S-1 ＋ docetaxel</b><br>病理第 III 期</td><td>' +
        '3 年無復發存活優於 S-1 單方（AGC-3 註 a、AGC-5 註 a）。' +
        '⚠ <b>輔助情境的 docetaxel 健保不給付</b></td></tr>';
      r += '<tr><td><b>SOX</b><br>S-1 ＋ oxaliplatin<br>病理第 III 期</td><td>' +
        '3 年無復發存活優於 S-1 單方。⚠ <b>輔助情境的 oxaliplatin 健保不給付</b></td></tr>';
    }
    r += '<tr><td>指引自己的一句話</td><td><b>「Optimal regimen not established」</b>（AGC-5）——' +
      '所以最後一個選項寫的是 <b>as patient-doctor\'s discussion</b></td></tr>';
    return foldRx('<b>這個病人可以用的輔助處方</b>（AGC-3、AGC-5；已依病理分期過濾）',
      '<table>' + r + '</table>');
  }

  /* 3c. 化療骨架（AGC-5 2 of 3） */
  function backboneTable() {
    return foldRx('<b>化療骨架怎麼選？</b>依體能分兩類（AGC-5）',
      '<table>' +
      '<tr><td><b>體能好</b><br>標準治療</td><td><b>含鉑處方：cisplatin 或 oxaliplatin ＋ fluoropyrimidine</b>' +
      '（capecitabine、tegafur/uracil 或 5-FU），加或不加 leucovorin</td></tr>' +
      '<tr><td><b>體能差</b><br>Karnofsky ≤ 50<br>或 ECOG ≥ 3</td><td>' +
      '<b>5-FU 為主的處方</b>：<b>HDFL</b> ＝ 每週一次、24 小時輸注高劑量 5-FU（2000–2600 mg/m²）' +
      '＋ leucovorin（300 mg/m²，最多 500 mg）；或其他 5-FU/leucovorin 為基礎的處方</td></tr>' +
      '</table>');
  }

  /* 3d. 生物標記（AGC-P、AGC-5 註 c–f） */
  function biomarkerReference() {
    return fold('<b>不可切除或轉移性一定要驗的四個生物標記</b>與判讀切點（AGC-P、AGC-5 註 c–f）',
      '<table>' +
      '<tr><td><b>HER2</b></td><td>IHC 及／或 ISH。<b>陽性的定義：IHC 3+，或 IHC 2+ 合併 ISH 陽性</b>（註 c）</td></tr>' +
      '<tr><td><b>PD-L1 CPS</b></td><td><b>抗體不同、切點也不同</b>（註 d）：' +
      '<b>Dako 22C3 對應 pembrolizumab（切點 CPS ≥ 1）</b>；' +
      '<b>Dako 28-8 對應 nivolumab（切點 CPS ≥ 5）</b>。' +
      '<b>報告要看是用哪一支抗體驗的，不能互換套用。</b></td></tr>' +
      '<tr><td><b>MSI／MMR</b></td><td>要用 PD-1 抑制劑的候選者才驗。' +
      'ESMO Pan-Asia 建議 <b>MSI-H／dMMR 者不論第幾線都可以加 anti-PD1</b>（註 e）</td></tr>' +
      '<tr><td><b>CLDN18.2</b></td><td>抗體 <b>CLDN18 43-14A</b>。' +
      '<b>陽性定義：≥ 75% 的存活腫瘤細胞呈現中至強（2+ 或 3+）膜染色</b>（註 f）</td></tr>' +
      '<tr><td>病理報告<br>本身要有的</td><td>侵犯深度、組織型別與 grade、血管侵犯、黏膜與深部切緣、' +
      '腫瘤與食道胃接合處的相對位置、轉移與檢出淋巴結的數目與位置（<b>至少 16 顆</b>）（AGC-P）</td></tr>' +
      '<tr><td colspan="2"><b>PD-L1 與 CLDN18.2 都陽性時要先用哪一個？指引明講「最佳順序未定」</b>，' +
      '正在等 ILUSTRO（NCT03505320）與 LUCERNA（NCT06011531）的結果。' +
      '而健保規定<b>免疫檢查點抑制劑與 zolbetuximab 只能擇一</b>，所以這是一個要當場決定、不能兩個都用的岔路。</td></tr>' +
      '</table>');
  }

  /* 3e. 健保條文 —— 這一段不掃藥卡 */
  function nhiAdj() {
    return fold('<b>健保怎麼給付胃癌的輔助化療？</b>（第 9 節條文，查詢日 2026-08-17）',
      '<table>' +
      '<tr><td>S-1<br>9.46</td><td><b>「胃癌術後輔助性化療，用於罹患 TNM stage II（排除 T1）、IIIA 或 IIIB 胃癌' +
      '且接受過胃癌根除性手術的成年患者，限用 1 年」</b>；需經事前審查。' +
      '<b>這是輔助情境唯一給付的處方。</b></td></tr>' +
      '<tr><td>capecitabine<br>oxaliplatin<br>docetaxel</td><td>' +
      '<b>指引 AGC-5 註 b 自己寫了：「輔助情境下 ' + NR('capecitabine、oxaliplatin 與 docetaxel') +
      ' 目前健保不給付」。</b>條文面也對得上：' + NR('oxaliplatin') + ' 9.10 的胃癌適應症是' +
      '「局部晚期及復發／轉移性」、' + NR('capecitabine') + ' 9.17 的胃癌適應症是「晚期胃癌第一線」，' +
      '兩者都不涵蓋術後輔助。</td></tr>' +
      '<tr><td colspan="2">也就是說：<b>想在術後給 XELOX、SOX 或 S-1 ＋ docetaxel，藥費要自費或走專案。' +
      '這一點在跟病人談療程之前就要先講清楚。</b></td></tr>' +
      '</table>');
  }

  function nhiMeta() {
    return fold('<b>健保怎麼給付轉移性胃癌？</b>互斥與順序陷阱（第 9 節條文，查詢日 2026-08-17）',
      '<table>' +
      '<tr><td>trastuzumab<br>9.18 第 3 項</td><td><b>限 IV 劑型。</b>與 <b>capecitabine（或 5-FU）及 cisplatin</b> ' +
      '併用，用於<b>未曾接受過化學治療</b>的 HER2 過度表現（IHC 3+ 或 FISH+）轉移性胃腺癌或胃食道接合處腺癌。' +
      '事前審查核准後<b>每 24 週</b>檢附療效評估再申請。' +
      '<br>⚠ <b>條文寫的搭配是 cisplatin</b>；指引的骨架允許 oxaliplatin，' +
      '<b>換成 oxaliplatin 就不在條文字面範圍內</b>，申請前要先確認。</td></tr>' +
      '<tr><td>nivolumab<br>9.69(5)</td><td><b>限 nivolumab</b> 併用 fluoropyrimidine（5-FU 或 capecitabine）' +
      '及 <b>oxaliplatin</b>，用於<b>第一線</b>治療晚期或轉移性、<b>不具 HER2 過度表現</b>的胃癌。' +
      '生物標記表列的切點是 <b>CPS ≥ 5</b>（事審代碼 P052）。' +
      '<br><b>pembrolizumab 在胃癌第一線「尚未給付於此適應症」</b> —— ' +
      '指引寫的 CPS ≥ 1 加 pembrolizumab 是可以做、但要自費。</td></tr>' +
      '<tr><td>zolbetuximab<br>9.133</td><td><b>115/04/01 起給付。</b>限與 fluoropyrimidine ＋ 含鉑化療併用，' +
      '用於 <b>CLDN18.2 陽性、HER2 陰性</b>的局部晚期不可切除或轉移性胃腺癌<b>第一線</b>，並且：' +
      '<b>① ECOG ≤ 1；② 初次申請要附病理報告、CLDN18.2 陽性（≥ 75% 腫瘤細胞中至強染色）與 HER2 陰性報告。</b>' +
      '事前審查每次 12 週。</td></tr>' +
      '<tr><td colspan="2"><b>① 最重要的一條互斥：zolbetuximab 與免疫檢查點抑制劑「僅能擇一給付，' +
      '且治療失敗時不可互換」</b>（9.133 第 3 點與 9.69(5) II 兩處都寫）。' +
      'CLDN18.2 陽性又 CPS ≥ 5 的病人，<b>第一線就要選定一邊，之後不能換</b>。</td></tr>' +
      '<tr><td colspan="2"><b>② 9.69 通則</b>：每位病人每個適應症只給付一種免疫檢查點抑制劑、不得互換；' +
      '治療期間不可合併申報該適應症的標靶藥物；<b>給付期限自初次處方起算 2 年</b>；' +
      '事前審查每次 12 週；初次申請要 <b>ECOG ≤ 1</b>。</td></tr>' +
      '<tr><td>後線免疫治療</td><td><b>9.69 單獨使用的轉移性胃癌那一條，限「109/04/01 前已核准者」續用</b> —— ' +
      '也就是新病人拿不到。指引 AGC-5 註 h 講的是同一件事：' +
      '<b>「TFDA 已核准 ' + NR('pembrolizumab 與 nivolumab') + ' 用於後線，但健保後線不給付，需自費」。</b></td></tr>' +
      '<tr><td>ramucirumab 9.92<br>paclitaxel<br>trastuzumab-deruxtecan 9.115</td><td>' +
      '<b>三者用於轉移性胃癌都沒有健保給付</b>（指引 AGC-5 註 g 明寫）。條文面也對得上：' +
      NR('ramucirumab') + ' 9.92 只給付肝細胞癌；' + NR('trastuzumab deruxtecan') +
      ' 9.115 只有乳癌適應症。</td></tr>' +
      '<tr><td>trifluridine ＋ tipiracil<br>9.66 第 2 項</td><td>轉移性胃癌：' +
      '<b>先前接受過兩種（含）以上治療</b>（含 fluoropyrimidine、platinum、taxane 或 irinotecan 為基礎的化療，' +
      '以及 HER2/neu 標靶治療[如果適合]）的轉移性胃腺癌或胃食道接合處腺癌病人。</td></tr>' +
      '<tr><td>oxaliplatin 9.10<br>capecitabine 9.17</td><td>' +
      'oxaliplatin：與 fluoropyrimidine 類（capecitabine、5-FU、UFUR，<b>不含 S-1</b>）併用於' +
      '局部晚期及復發／轉移性胃癌。capecitabine：合併 platinum 用於<b>晚期胃癌第一線</b>。</td></tr>' +
      '</table>');
  }

  /* 3f. 追蹤與支持性治療（AGC-4） */
  function followupHTML(kind) {
    if (kind === 'palli') {
      return '<div class="fu-label">支持性治療的四個常見問題（AGC-4）</div><ul class="fu-list">' +
        '<li><b>阻塞</b>：支架、雷射、光動力治療、放射治療、手術。</li>' +
        '<li><b>營養</b>：管灌餵食、營養諮詢。' +
        '<b>但腹膜轉移合併惡性腹水者，不會擇期放 feeding jejunostomy 或 gastrostomy</b>（AGC-1 註 c）。</li>' +
        '<li><b>疼痛</b>：放射治療及／或藥物。</li>' +
        '<li><b>出血</b>：放射治療、手術、內視鏡治療，或經動脈栓塞。</li>' +
        '<li>末期病人：安寧緩和照護，照會安寧共同照護團隊。</li></ul>';
    }
    return '<div class="fu-label">追蹤原則（AGC-4）</div><ul class="fu-list">' +
      '<li><b>病史與理學檢查每 3–4 個月一次共 3 年，之後每 4–6 個月一次。</b></li>' +
      '<li>CBC、血小板、生化：依臨床需要。</li>' +
      '<li>影像或內視鏡：依臨床需要（<b>指引沒有訂固定的影像時程</b>）。</li>' +
      '<li><b>CEA 每 3–6 個月一次</b>，初診斷時就上升者尤其要追。</li>' +
      '<li><b>做過全胃切除或近端胃切除的病人，每 6–12 個月要監測 vitamin B12</b>；' +
      '連續兩次都在正常範圍就可以停止例行監測（AGC-4 註 a）。</li>' +
      '<li>發現復發 → 回步驟 1 選「治療後追蹤發現復發」。</li></ul>';
  }

  /* ==========================================================
     4. 版面
     ========================================================== */
  function gastricPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院胃癌診療指引</b>（版次 17，2026/06/16 修訂公告；AGC-1～AGC-5、AGC-P）' +
      '編成的互動決策流程。步驟照臨床決策實際發生的先後排：' +
      '<b>分期檢查 → 能不能開刀 → 先開刀還是先給藥 → 開完看 R 與病理 → 輔助治療 → 復發或轉移</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是處方、生物標記判讀、健保條文與參考資料。' +
      '分期本身（AJCC 第 8 版）與淋巴結站別（JGCA）另見上方兩個頁籤。</p>';
    h += '<div class="onc-path" id="gcPath">';

    /* 步驟 1 */
    h += node0('gc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'work', '剛確診胃腺癌，正在做分期檢查', 'AGC-1：先決定能不能開刀') +
      opt('scope', 'esd', '早期胃癌，想評估能不能只做內視鏡切除', 'AGC-2：ESD 的三項適應症') +
      opt('scope', 'postop', '手術已經完成，要決定輔助治療', 'AGC-3：R 分類與術後病理') +
      opt('scope', 'meta', '不可切除或轉移性，要決定全身治療', 'AGC-5：依 HER2、PD-L1、MMR、CLDN18.2 選藥') +
      opt('scope', 'recur', '治療後追蹤發現復發', 'AGC-4'));

    /* ── A. 分期檢查與可切除性（AGC-1）── */
    h += '<div id="gc_b_work" class="hidden">';
    h += node('gc_n_extent', '2', '分期檢查做完之後，病人落在哪一格？（AGC-1）',
      opt('extent', 'fitres', '局部區域（M0），體能可以開刀，而且評估為可切除', '') +
      opt('extent', 'fitunres', '局部區域（M0），體能可以開刀，但腫瘤切不下來', '') +
      opt('extent', 'unfit', '體能無法承受大手術', '') +
      opt('extent', 'm1', '已經有遠處轉移（第 IV 期）', '含腹膜、遠處淋巴結、腹水細胞學陽性'),
      fold('<b>分期檢查要做哪些？</b>（AGC-1）',
        '<ul class="rec-sub">' +
        '<li><b>一定要做</b>：病史與理學檢查、<b>腹部＋骨盆電腦斷層（可加腹部超音波）</b>、' +
        '<b>胸部電腦斷層或胸部 X 光</b>、<b>上消化道內視鏡（EGD）</b>、CBC 與血小板、生化、<b>CEA</b>。</li>' +
        '<li><b>選擇性</b>：內視鏡超音波 EUS（早期胃癌時）、' +
        '<b>全身骨骼掃描（病理第 III 期或臨床第 IV 期時）</b>、' +
        '<b>正子造影 PET/CT（選擇性，而且要自費）</b>、多專科團隊評估。</li>' +
        '<li><b>考慮根治性手術時要做診斷性腹腔鏡加腹水細胞學</b>（AGC-1 註 b）——' +
        '目的是找出影像看不到的腹膜擴散。可切除者<b>建議做</b>；不可切除者為選擇性。</li></ul>'));
    h += recBox('gc_r_extent', '建議處置 · 這一格要走哪一條路');
    h += '</div>';

    /* ── A-1 可切除：先開刀還是先給藥（AGC-2）── */
    h += '<div id="gc_b_pre" class="hidden">';
    h += node('gc_n_plan', '3', '實際決定走哪一條？（AGC-2）',
      opt('plan', 'up', 'Upfront surgery', '直接做根治性手術') +
      opt('plan', 'peri', 'Perioperative chemotherapy', '先做術前化療 —— 指引限縮在 cT4N+ 或 bulky nodes'));
    h += recBox('gc_r_plan', '建議處置 · 手術或術前化療');
    h += '</div>';

    /* ── B. ESD（AGC-2 3 of 3）── */
    h += '<div id="gc_b_esd" class="hidden">';
    h += node('gc_n_einx', '2', '這個病灶符合哪一項內視鏡切除的適應症？（AGC-2）',
      opt('einx', 'i1', '分化型癌，沒有潰瘍', '<b>這一項沒有大小限制</b>') +
      opt('einx', 'i2', '分化型癌，有潰瘍，腫瘤直徑 ≤ 3 cm', '') +
      opt('einx', 'i3', '未分化型癌，沒有潰瘍，腫瘤直徑 ≤ 2 cm', '') +
      opt('einx', 'none', '三項都不符合', ''));
    h += node('gc_n_ecur', '3', '切下來之後，病理是不是 curative？（AGC-2）',
      opt('ecur', 'yes', '是：切緣乾淨、沒有脈管侵犯、黏膜下侵犯 &lt; 500 μm', '三個條件全部符合') +
      opt('ecur', 'no', '不是：三個條件有任何一項不符合', ''));
    h += recBox('gc_r_esd', '建議處置 · 內視鏡切除');
    h += fuBox('gc_f_esd');
    h += '</div>';

    /* ── C. 手術結果與輔助治療（AGC-3）── */
    h += '<div id="gc_b_op" class="hidden">';
    h += node('gc_n_rstat', '3', '手術的切除程度是哪一種？（AGC-3）',
      opt('rstat', 'r0', 'R0 —— 完全切除，切緣沒有癌細胞', '') +
      opt('rstat', 'r1', 'R1 —— 顯微鏡下仍有殘存癌細胞', 'microscopically residual cancer') +
      opt('rstat', 'r2', 'R2 —— 肉眼可見的殘存癌', 'grossly residual cancer') +
      opt('rstat', 'm1', '術中發現遠處轉移（M1）', ''));
    h += node('gc_n_ptn', '4', '術後病理落在哪一格？（點 pT 與 pN 的交會格；AGC-3、AJCC 第 8 版）', '',
      '<div id="gc_ptn_hold"></div>');
    h += recBox('gc_r_adj', '建議處置 · 術後輔助治療');
    h += fuBox('gc_f_adj');
    h += '</div>';

    /* ── E. 復發（AGC-4）── */
    h += '<div id="gc_b_recur" class="hidden">';
    h += node('gc_n_rps', '2', '復發時病人的體能是哪一種？（AGC-4）',
      opt('rps', 'good', 'Karnofsky ≥ 60，或 ECOG ≤ 2', '') +
      opt('rps', 'poor', 'Karnofsky ≤ 50，或 ECOG ≥ 3', ''));
    h += recBox('gc_r_recur', '建議處置 · 復發');
    h += fuBox('gc_f_recur');
    h += '</div>';

    /* ── 共用：全身治療（AGC-5）── */
    h += '<div id="gc_b_sys" class="hidden">';
    h += node('gc_n_her2', '3', 'HER2 是陽性還是陰性？（AGC-5 註 c）',
      opt('her2', 'pos', 'HER2 陽性', 'IHC 3+，或 IHC 2+ 合併 ISH 陽性') +
      opt('her2', 'neg', 'HER2 陰性', ''),
      biomarkerReference());
    h += node('gc_n_hcps', '4', 'PD-L1 的 CPS 是多少？（用 Dako 22C3 驗的那一份）',
      opt('hcps', 'lt1', 'CPS &lt; 1', '') +
      opt('hcps', 'ge1', 'CPS ≥ 1', ''));
    h += node('gc_n_bio', '4', '其他三個生物標記，這位病人符合哪一項？（AGC-5）',
      opt('bio', 'msi', 'dMMR 或 MSI-H', '這一項優先 —— 不論第幾線都可以用 anti-PD1') +
      opt('bio', 'cldn', 'CLDN18.2 陽性', '≥ 75% 腫瘤細胞中至強膜染色') +
      opt('bio', 'cps5', 'PD-L1 CPS ≥ 5（Dako 28-8）', '') +
      opt('bio', 'cps1', 'PD-L1 CPS ≥ 1 但 &lt; 5（Dako 22C3）', '') +
      opt('bio', 'none', '以上都不符合', ''));
    h += node('gc_n_fit', '5', '病人的體能是哪一種？（AGC-5 化療骨架分類）',
      opt('fit', 'good', '體能好', '可以用含鉑的標準處方') +
      opt('fit', 'poor', '體能差（Karnofsky ≤ 50 或 ECOG ≥ 3）', '走 5-FU 為主的處方'));
    h += node('gc_n_line', '6', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', '') +
      opt('line', 'l3', '第三線以後', ''));
    h += recBox('gc_r_sys', '建議處置 · 全身治療');
    h += fuBox('gc_f_sys');
    h += '</div>';

    /* ── D. 化療後再分期（AGC-3 2 of 2）── */
    h += '<div id="gc_b_restage" class="hidden">';
    h += node('gc_n_rest', '3', '化療之後重新分期的結果？（AGC-3）',
      opt('rest', 'ccr', '臨床完全緩解（cCR）或主要反應', '') +
      opt('rest', 'residual', '仍有殘存病灶、局部區域或遠處轉移', ''));
    h += recBox('gc_r_restage', '建議處置 · 化療後的再評估');
    h += fuBox('gc_f_restage');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="gcReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="gc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="gc_drugs"></div>';
    return h;
  }

  /* ==========================================================
     5. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }

  function collapseAll() {
    var root = el('gcPath');
    if (!root) return;
    root.querySelectorAll('.gc-node').forEach(function (n) {
      if (n.id !== 'gc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['gc_b_work', 'gc_b_pre', 'gc_b_esd', 'gc_b_op', 'gc_b_restage', 'gc_b_recur', 'gc_b_sys']
      .forEach(function (id) { show(id, false); });
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

  /* ==========================================================
     6. 各分支
     ========================================================== */

  /* ---------- A. 分期與可切除性 ---------- */
  function renderWork() {
    show('gc_b_work', true);
    show('gc_n_extent', true);
    if (!S.extent) return;

    if (S.extent === 'fitres') {
      fill('gc_r_extent', 'rec-elective',
        '局部區域（M0）、體能可以開刀、評估為可切除<br>→ 走根治性手術這條路，開刀前先做腹腔鏡', [
        H('先做的一件事', 'AGC-1 註 b'),
        '<b>考慮根治性手術時，建議先做診斷性腹腔鏡加腹水細胞學</b>（laparoscopy with cytology）。',
        EV('目的是找出影像看不到的腹膜擴散 —— 腹水細胞學陽性在 AJCC 第 8 版就算 M1，' +
          '會把整個治療方向從根治改成緩和。這一步做在開刀之前，才有意義。'),
        H('接下來的三個並列選項', 'AGC-2'),
        '<b>① Conventional surgery with curative intent</b>',
        '<b>② Laparoscope-assisted surgery with curative intent</b>（cT1 有適應症時應考慮 ESD）',
        '<b>③ Perioperative chemotherapy</b> —— <b>但指引把它限縮在「borderline resectable：cT4N+ 或 bulky nodes」</b>',
        EV('也就是說 —— <b>大部分可切除的胃癌是直接開刀</b>，術前化療不是常規。' +
          '下面的步驟 3 就是在做這個決定。')
      ], 'AGC-1（臨床分流與腹腔鏡）、AGC-2（三個並列的原發治療）。', more(surgeryReference()));
      show('gc_b_pre', true);
      show('gc_n_plan', true);
      if (!S.plan) return;
      renderPlan();
      return;
    }

    if (S.extent === 'fitunres') {
      fill('gc_r_extent', 'rec-elective',
        '局部區域（M0）、體能可以開刀，但腫瘤切不下來<br>→ 先做化療，之後再評估能不能開', [
        H('先確認「切不下來」是哪一種', 'AGC-2'),
        '<b>符合任一項即為 unresectable for cure</b>：' + SUB([
          '<b>腹膜播種或遠處轉移</b>',
          '<b>無法完成完整切除</b>',
          '<b>侵犯或包覆主要血管構造</b>'
        ]),
        H('處置', 'AGC-2、AGC-3'),
        '<b>先做化療（AGC-5 的骨架），之後做 adjunctive treatment post-chemotherapy 的再分期。</b>',
        '<b>腹腔鏡在這一格是選擇性的</b>（AGC-1 註 b）。',
        H('下一步', ''),
        '<b>下面的步驟 3 開始決定要用什麼藥；化療後的再分期見再下一段。</b>'
      ], 'AGC-2（不可切除的定義與流程）、AGC-1 註 b。', more(surgeryReference()));
      showSys('3');
      /* 化療選完（步驟 3–6）之後才問再分期，所以它是步驟 7；
         gc_b_restage 在版面上必須排在 gc_b_sys 之後，否則步驟 7 會冒到步驟 3 上面。 */
      if (!S.line) return;
      show('gc_b_restage', true);
      setNum('gc_n_rest', '7');
      show('gc_n_rest', true);
      if (S.rest) renderRestage();
      return;
    }

    if (S.extent === 'unfit') {
      fill('gc_r_extent', 'rec-nonop',
        '體能無法承受大手術<br>→ 以緩和為目標：salvage therapy ± palliative surgery', [
        H('處置', 'AGC-1'),
        '<b>Salvage therapy ± palliative surgery。</b>',
        H('palliative surgery 是為了什麼', 'AGC-1 註 c'),
        '<b>只為了兩件事：解除機械性阻塞，或止住明顯的腸胃道出血。</b>',
        '<b>腹膜轉移合併惡性腹水的病人，不會擇期放 feeding jejunostomy 或 gastrostomy</b>（指引原文明講）。',
        EV('這一句是寫給外科的：在腹膜癌病與惡性腹水的情況下，造廔管的併發症與滲漏風險高，' +
          '而且不會改善預後 —— 所以不做，不是「還沒安排」。'),
        H('全身治療要不要給', 'AGC-4'),
        '<b>看體能</b>：Karnofsky ≥ 60 或 ECOG ≤ 2 → 可以走全身治療；' +
          'Karnofsky ≤ 50 或 ECOG ≥ 3 → <b>HDFL（或其他 5-FU/leucovorin），或直接進入支持性照護與安寧</b>。',
        H('下一步', ''),
        '<b>下面的步驟 3 開始決定要用什麼藥。</b>'
      ], 'AGC-1（medically unfit → salvage ± palliative surgery）、註 c、AGC-4（體能分流）。', null);
      showSys('3');
      return;
    }

    fill('gc_r_extent', 'rec-nonop',
      '第 IV 期（M1）<br>→ Salvage therapy ± palliative surgery，以全身治療為主軸', [
      H('處置', 'AGC-1'),
      '<b>Salvage therapy ± palliative surgery（AGC-4）。</b>',
      '<b>M1 的定義包含腹膜轉移、遠處淋巴結轉移，以及腹水細胞學陽性</b>（AJCC 第 8 版）。',
      H('開刀只做兩件事', 'AGC-1 註 c'),
      '<b>解除機械性阻塞，或止住明顯的腸胃道出血。</b>' +
        '腹膜轉移合併惡性腹水者<b>不會擇期放 feeding jejunostomy 或 gastrostomy</b>。',
      H('開始全身治療之前要驗的四個標記', 'AGC-P'),
      '<b>HER2、PD-L1（CPS）、MMR／MSI、CLDN18.2</b> —— ' +
        '<b>這四個決定第一線要加哪一支藥，一定要在開始治療前驗完。</b>',
      H('下一步', ''),
      '<b>下面的步驟 3 開始決定要用什麼藥。</b>'
    ], 'AGC-1（Stage IV → salvage ± palliative surgery）、註 c、AGC-P（生物標記）。',
      more(biomarkerReference()));
    showSys('3');
  }

  function renderPlan() {
    if (S.plan === 'up') {
      fill('gc_r_plan', 'rec-elective', 'Upfront surgery<br>→ 根治性手術，D2 廓清，至少檢出 16 顆淋巴結', [
        H('術式怎麼選', 'AGC-2'),
        '<b>遠端（body ＋ antrum）→ subtotal gastrectomy 為優先。</b>',
        '<b>近端（cardia）→ total 或 proximal gastrectomy，依情況而定。</b>',
        '<b>可行的話避免切脾。</b>',
        '<b>切緣以距離肉眼腫瘤上下各 &gt; 5 cm 為優先。</b>',
        H('淋巴結', 'AGC-2、AGC-P'),
        '<b>D0 不可接受；建議做 D2。</b>',
        '<b>至少要評估 16 顆淋巴結。</b>',
        EV('D 廓清各站別的範圍依術式而異（全胃、遠端、近端、保留幽門四種都不一樣），' +
          '本頁「淋巴結分群」頁籤可以按術式切換查看。'),
        H('cT1 的例外', 'AGC-2'),
        '<b>cT1 若符合內視鏡切除的適應症，應該先考慮 ESD</b>（回步驟 1 選「早期胃癌」）。',
        H('之後怎麼接', 'AGC-3'),
        '<b>術後依 R 分類與病理分期決定輔助治療</b> —— 下面的步驟 4 開始。'
      ], 'AGC-2（手術原則與不可切除的定義）、AGC-P（至少 16 顆）。', more(surgeryReference()));
      show('gc_b_op', true);
      setNum('gc_n_rstat', '4'); setNum('gc_n_ptn', '5');
      show('gc_n_rstat', true);
      if (!S.rstat) return;
      renderOp('5');
      return;
    }

    fill('gc_r_plan', 'rec-elective',
      'Perioperative chemotherapy<br>→ 三藥處方為首選，做完再手術', [
      H('先確認適應症', 'AGC-2、AGC-5'),
      '<b>指引把術前化療限縮在「borderline resectable」，也就是 cT4N+ 或 bulky nodes。</b>',
      EV('不是所有可切除的胃癌都要先給藥 —— AGC-2 用的字是「can be considered for cT4N+ or bulky nodes」。' +
        '不符合這個條件就回上一步選 upfront surgery。'),
      H('處方', 'AGC-5'),
      '<b>首選是三藥：fluoropyrimidine ＋ platinum ＋ docetaxel（FLOT 或 DOS）。</b>',
      '<b>不能耐受三藥的人，改用 platinum ＋ fluoropyrimidine 兩藥。</b>',
      H('一個常被誤會的處方', 'AGC-2 註 b'),
      '<b>Perioperative durvalumab ＋ FLOT 只有美國 FDA 核准，TFDA 到目前為止還沒核准。</b>',
      EV('這一句是版次 17 特別加上去的紅字。看到國外的資料寫 durvalumab ＋ FLOT 時，' +
        '要記得在台灣還不能這樣開。'),
      H('之後怎麼接', 'AGC-3'),
      '<b>化療做完之後手術，術後依 R 分類與病理分期決定要不要再給輔助治療</b> —— 下面的步驟 4 開始。'
    ], 'AGC-2（primary treatment 的第三個選項與註 b）、AGC-5（perioperative chemotherapy 的處方）。',
      more(backboneTable(), surgeryReference()));
    show('gc_b_op', true);
    setNum('gc_n_rstat', '4'); setNum('gc_n_ptn', '5');
    show('gc_n_rstat', true);
    if (!S.rstat) return;
    renderOp('5');
  }

  /* ---------- B. ESD ---------- */
  function renderEsd() {
    show('gc_b_esd', true);
    show('gc_n_einx', true);
    if (!S.einx) return;

    if (S.einx === 'none') {
      fill('gc_r_esd', 'rec-elective',
        '三項適應症都不符合<br>→ 不做內視鏡切除，走手術這條路', [
        H('指引列的三項適應症', 'AGC-2'),
        '<b>① 分化型癌，沒有潰瘍 —— 這一項沒有大小限制。</b>',
        '<b>② 分化型癌，有潰瘍，腫瘤直徑 ≤ 3 cm。</b>',
        '<b>③ 未分化型癌，沒有潰瘍，腫瘤直徑 ≤ 2 cm。</b>',
        EV('第 ① 項<b>沒有大小限制</b>是最常被記錯的一條 —— ' +
          '≤ 3 cm 是給「有潰瘍」的，≤ 2 cm 是給「未分化型」的。'),
        H('處置', 'AGC-2'),
        '<b>回步驟 1 選「剛確診胃腺癌，正在做分期檢查」，走根治性手術的流程。</b>'
      ], 'AGC-2（endoscopic resection with curative intent 的三項適應症）。', more(surgeryReference()));
      return;
    }

    show('gc_n_ecur', true);
    if (!S.ecur) return;

    var inxTxt = { i1: '分化型、無潰瘍（無大小限制）', i2: '分化型、有潰瘍、≤ 3 cm', i3: '未分化型、無潰瘍、≤ 2 cm' }[S.einx];

    if (S.ecur === 'yes') {
      fill('gc_r_esd', 'rec-nonop',
        inxTxt + '，切除後判定為 curative<br>→ 觀察即可', [
        H('處置', 'AGC-2'),
        '<b>Observation。</b>不需要追加手術，也不需要輔助化療。',
        H('curative 的三個條件（要全部符合）', 'AGC-2'),
        '<b>① 切緣乾淨（margin free）；② 沒有 lymphovascular invasion；③ 黏膜下侵犯 &lt; 500 μm。</b>',
        EV('這三個條件是在切下來之後由病理決定的，不是切之前預測的。' +
          '所以 ESD 同時是治療也是分期 —— 病理回來才知道夠不夠。'),
        H('追蹤', 'AGC-4'),
        '<b>依 AGC-4 的追蹤原則</b>（見下方）。'
      ], 'AGC-2（endoscopic resection → curative? → observation）。', null);
      fu('gc_f_esd', null);
      return;
    }

    fill('gc_r_esd', 'rec-elective',
      inxTxt + '，切除後判定為 non-curative<br>→ 三個並列選項，依殘存風險決定', [
      H('指引列的三個選項', 'AGC-2'),
      '<b>① Repeat ESD</b>　<b>② Surgical resection</b>　<b>③ Close observation</b>',
      EV('三個並列、沒有排序。實務上的方向是：' +
        '<b>只有水平切緣陽性、其他都乾淨 → repeat ESD 或密切追蹤比較站得住腳；' +
        '有脈管侵犯或黏膜下侵犯 ≥ 500 μm → 淋巴結轉移的風險上來了，手術的理由比較強</b>。'),
      H('哪一個條件沒過，決定往哪邊走', 'AGC-2'),
      '<b>curative 要同時滿足：切緣乾淨、沒有 lymphovascular invasion、黏膜下侵犯 &lt; 500 μm。</b>' +
        '<b>病理報告要逐條看是哪一條沒過。</b>',
      H('決定做手術的話', 'AGC-2、AGC-3'),
      '<b>回步驟 1 選「剛確診胃腺癌」走手術流程，或選「手術已經完成」直接看術後輔助治療。</b>'
    ], 'AGC-2（curative? → No → repeat ESD / surgical resection / close observation）。',
      more(surgeryReference()));
  }

  /* ---------- C. 手術結果與輔助治療 ---------- */
  function renderPostop() {
    show('gc_b_op', true);
    setNum('gc_n_rstat', '2'); setNum('gc_n_ptn', '3');
    show('gc_n_rstat', true);
    if (!S.rstat) return;
    renderOp('3');
  }

  function renderOp(ptnNum) {
    if (S.rstat === 'r0') {
      setNum('gc_n_ptn', ptnNum);
      show('gc_n_ptn', true);
      var hold = el('gc_ptn_hold');
      if (hold) {
        hold.innerHTML = '<div class="tn-cap">術後病理分期</div>' +
          gridHTML('gc_ptnc', 'ptn', PN_COLS, PT_ROWS, ptnGroup, PTN_LEGEND,
            '<b>這裡的顏色代表「術後還要不要給藥、以及要給哪一組處方」，不是嚴重度。</b>' +
            'AGC-3 的原始分法只有兩段（<b>pT1N0／pT2N0 直接追蹤</b>；<b>pT3、pT4 或任何 T 合併 N 陽性要輔助化療</b>）；' +
            '第三色是再往下分出<b>病理第 III 期</b> —— AGC-5 註 a 指名這一格優先用 S-1 ＋ docetaxel 或 SOX。' +
            '分期取自 AJCC 第 8 版，與本頁「分期 TNM」頁籤同一份。');
        if (S.ptn) { var b = el('gc_ptnc_' + S.ptn); if (b) b.classList.add('selected'); }
      }
      if (!S.ptn) return;
      renderAdj();
      return;
    }

    if (S.rstat === 'r1') {
      fill('gc_r_adj', 'rec-elective',
        'R1 切除（顯微鏡下有殘存癌）<br>→ 走和 R0 高危險群同一個輔助化療方框', [
        H('這一格最容易看錯的地方', 'AGC-3'),
        '<b>AGC-3 的 R1 那一條箭頭，指向的是「adjuvant chemotherapy」那個方框，不是 salvage chemotherapy。</b>',
        EV('也就是說 —— <b>R1 的處置和 pT3／pT4／N 陽性的 R0 病人是同一組選項</b>，' +
          '不是掉到緩和治療那一段。看流程圖時很容易把 R1 和 R2 併在一起，那是錯的。'),
        H('可以用的處方', 'AGC-3、AGC-5'),
        '<b>S-1</b>　或　<b>capecitabine ＋ oxaliplatin（XELOX）</b>　或　<b>S-1 ＋ docetaxel</b>　' +
          '或　<b>S-1 ＋ oxaliplatin（SOX）</b>　或　<b>依醫病討論決定</b>。',
        '<b>指引自己寫「optimal regimen not established」</b>（AGC-5）—— 所以最後一項才是「醫病討論」。',
        H('要不要加放射治療？', ''),
        EV('<b>台大胃癌診療指引版次 17 全文沒有列術後放射治療</b>（AGC-3 的 R1 那一條只接到化療）。' +
          '要做 chemoradiation 屬院外實證，請提多專科團隊討論，本頁不代為建議。')
      ], 'AGC-3（R1 → adjuvant chemotherapy）、AGC-5（post-operative chemotherapy 的處方）。',
        more(adjRxTable(true), nhiAdj()));
      fu('gc_f_adj', null);
      return;
    }

    if (S.rstat === 'r2') {
      fill('gc_r_adj', 'rec-urgent',
        'R2 切除（肉眼可見的殘存癌）<br>→ Salvage chemotherapy，或極差體能者直接支持性照護', [
        H('兩個選項', 'AGC-3'),
        '<b>① Salvage chemotherapy（AGC-5 的全身治療）。</b>',
        '<b>② Best supportive care —— 指引限縮在「very poor performance status」。</b>',
        EV('R2 在治療意圖上已經不是根治了，所以走的是 AGC-5 的全身治療菜單，' +
          '和轉移性病人同一套；體能是決定給不給藥的唯一分水嶺。'),
        H('下一步', ''),
        '<b>下面的步驟開始決定要用什麼藥</b> —— 記得要先驗 HER2、PD-L1、MMR／MSI 與 CLDN18.2（AGC-P）。'
      ], 'AGC-3（R2 → salvage chemotherapy 或 BSC）、AGC-P。', more(biomarkerReference()));
      showSys(String(parseInt(ptnNum, 10)));
      return;
    }

    fill('gc_r_adj', 'rec-urgent',
      '術中發現遠處轉移（M1）<br>→ Salvage chemotherapy', [
      H('處置', 'AGC-3'),
      '<b>Salvage chemotherapy（AGC-5）。</b>',
      '<b>M1 包含腹膜轉移、遠處淋巴結轉移與腹水細胞學陽性</b>（AJCC 第 8 版）。',
      EV('這也是 AGC-1 註 b 要在根治手術前先做腹腔鏡加腹水細胞學的理由 —— ' +
        '在開腹之後才發現，代價高很多。'),
      H('下一步', ''),
      '<b>下面的步驟開始決定要用什麼藥</b> —— 先驗 HER2、PD-L1、MMR／MSI 與 CLDN18.2（AGC-P）。'
    ], 'AGC-3（M1 → salvage chemotherapy）、AGC-1 註 b、AGC-P。', more(biomarkerReference()));
    showSys(String(parseInt(ptnNum, 10)));
  }

  function renderAdj() {
    var p = ptnParts(), L = [], cls, title;

    if (p.g === 'none') {
      cls = 'rec-nonop';
      title = ptnName() + '（病理第 ' + p.st + ' 期）<br>→ 不需要輔助化療，直接進入追蹤';
      L.push(H('處置', 'AGC-3'));
      L.push('<b>AGC-3 把 R0 切除後的 pT1N0 與 pT2N0 直接接到 follow-up，中間沒有輔助化療。</b>');
      L.push(EV('這一格復發率低，化療的絕對獲益小到不值得承受毒性與一年的口服藥。'));
      L.push(H('追蹤時要記得的一件事', 'AGC-4 註 a'));
      L.push('<b>做過全胃或近端胃切除的病人，每 6–12 個月要監測 vitamin B12</b>；' +
        '連續兩次正常就可以停止例行監測。');
    } else {
      var stage3 = (p.g === 'high');
      cls = stage3 ? 'rec-urgent' : 'rec-elective';
      title = ptnName() + '（病理第 ' + p.st + ' 期）<br>→ ' +
        (stage3 ? '要輔助化療，優先用 S-1 ＋ docetaxel 或 SOX' : '要輔助化療');
      L.push(H('為什麼這一格要給', 'AGC-3、AGC-5'));
      L.push('<b>AGC-3：R0 切除後，pT3、pT4 或任何 T 合併淋巴結陽性者要做輔助化療。</b>');
      L.push('<b>AGC-5 寫得更精確：「recommended in pT3-4 or pN+ patients after D2 resection」</b> —— ' +
        '<b>前提是這一台刀做的是 D2</b>。');
      L.push(H('可以用的處方', 'AGC-3、AGC-5'));
      if (stage3) {
        L.push('<b>優先：S-1 ＋ docetaxel，或 SOX（S-1 ＋ oxaliplatin）。</b>');
        L.push('<b>理由寫在 AGC-3 註 a 與 AGC-5 註 a：這兩個處方的 3 年無復發存活優於 S-1 單方，' +
          '所以指名建議用於病理第 III 期。</b>');
        L.push('<b>其他選項</b>：S-1 單方、HDFL、XELOX，或依醫病討論決定。');
      } else {
        L.push('<b>S-1</b>　或　<b>HDFL</b>　或　<b>XELOX（capecitabine ＋ oxaliplatin）</b>　或　<b>依醫病討論決定</b>。');
        L.push(EV('<b>S-1 ＋ docetaxel 與 SOX 是指名給病理第 III 期的</b>（AGC-3 註 a、AGC-5 註 a），' +
          '這一格（第 ' + p.st + ' 期）沒有那份證據。'));
      }
      L.push('<b>指引自己寫「optimal regimen not established」</b> —— 所以最後一個選項是「依醫病討論決定」。');
      L.push(H('開處方之前一定要先講的一件事', 'AGC-5 註 b、健保 9.46'));
      L.push('<b>輔助情境只有 S-1 有健保給付</b>（9.46：TNM 第 II 期排除 T1、IIIA 或 IIIB，' +
        '接受過根除性手術，<b>限用 1 年</b>）。');
      L.push('<b>指引註 b 自己寫：輔助情境下 ' + NR('capecitabine、oxaliplatin 與 docetaxel') +
        ' 目前健保不給付。</b>');
      L.push(EV('所以 XELOX、SOX、S-1 ＋ docetaxel 這三個處方在術後要自費或走專案。' +
        '這件事要在開始療程<b>之前</b>跟病人講清楚，不是打到一半才發現。'));
    }

    fill('gc_r_adj', cls, title, L,
      'AGC-3（surgical outcomes → adjuvant chemotherapy）、AGC-3 註 a、' +
      'AGC-5（post-operative chemotherapy 與註 a、註 b）；分期依 AJCC 第 8 版。',
      p.g === 'none' ? null : more(adjRxTable(p.g === 'high'), nhiAdj()));
    fu('gc_f_adj', null);
  }

  /* ---------- D. 化療後再分期 ---------- */
  function renderRestage() {
    if (S.rest === 'ccr') {
      fill('gc_r_restage', 'rec-elective',
        '化療後達到臨床完全緩解或主要反應<br>→ 適合的話開刀；不適合就追蹤', [
        H('處置', 'AGC-3'),
        '<b>Surgery, if appropriate</b>（適合的話就手術），<b>或達到 cCR 者進入 follow-up（AGC-4）</b>。',
        '<b>「if appropriate」是指引原文</b> —— 要不要開刀由多專科團隊依病灶範圍與病人狀況決定，' +
          '<b>指引沒有給出更細的判準</b>。',
        H('再分期要做哪些檢查', 'AGC-3'),
        '<b>胸部電腦斷層或 X 光、腹部＋骨盆電腦斷層、CBC 與生化、上消化道內視鏡（EGD）</b>；' +
          '<b>PET/CT 為自費</b>。',
        H('如果決定開刀', 'AGC-2、AGC-3'),
        '<b>術後依 R 分類與病理分期決定要不要再給輔助治療</b>（回步驟 1 選「手術已經完成」）。'
      ], 'AGC-3（restaging → cCR 或 major response → surgery if appropriate / follow-up）。',
        more(surgeryReference()));
      fu('gc_f_restage', null);
      return;
    }
    fill('gc_r_restage', 'rec-urgent',
      '化療後仍有殘存病灶或出現轉移<br>→ 走 salvage therapy', [
      H('處置', 'AGC-3'),
      '<b>Salvage therapy（AGC-5）。</b>',
      '<b>這代表目前的處方沒有把疾病控制住，要換線</b> —— 上面的線別選第二線或第三線以後。',
      EV('AGC-3 的這一條沒有再細分「局部殘存」與「遠處轉移」，兩者都接到同一個 salvage therapy。')
    ], 'AGC-3（restaging → residual disease, locoregional and/or distant metastases → salvage therapy）。', null);
    fu('gc_f_restage', 'palli');
  }

  /* ---------- E. 復發 ---------- */
  function renderRecur() {
    show('gc_b_recur', true);
    show('gc_n_rps', true);
    if (!S.rps) return;

    if (S.rps === 'good') {
      fill('gc_r_recur', 'rec-elective',
        '復發、Karnofsky ≥ 60 或 ECOG ≤ 2<br>→ 走全身治療，或優先考慮臨床試驗', [
        H('兩個選項', 'AGC-4'),
        '<b>① Systemic therapy（AGC-5）。</b>',
        '<b>② Clinical trials。</b>',
        EV('AGC-4 註 b 寫得很明確：<b>「台大與 NCCN 都相信任何癌症病人最好的處置是在臨床試驗中」，' +
          '特別鼓勵參加。</b>這一句在復發這一格是並列的第一順位，不是附註。'),
        H('開始之前要確認的事', 'AGC-P'),
        '<b>如果之前沒驗過，現在要補驗 HER2、PD-L1（CPS）、MMR／MSI 與 CLDN18.2</b> —— ' +
          '這四個決定要加哪一支藥。',
        H('下一步', ''),
        '<b>下面的步驟 3 開始決定要用什麼藥。</b>'
      ], 'AGC-4（recurrence → performance status → systemic therapy 或 clinical trials）、註 b、AGC-P。',
        more(biomarkerReference()));
      showSys('3');
      return;
    }

    fill('gc_r_recur', 'rec-nonop',
      '復發、Karnofsky ≤ 50 或 ECOG ≥ 3<br>→ HDFL，或直接進入支持性照護與安寧', [
      H('兩個選項', 'AGC-4'),
      '<b>① HDFL（或其他 5-FU/leucovorin 為基礎的處方）。</b>',
      '<b>② Best supportive care／hospice care。</b>',
      H('HDFL 的打法', 'AGC-5'),
      '<b>每週一次，24 小時輸注高劑量 5-FU 2000–2600 mg/m²，加 leucovorin 300 mg/m²（最多 500 mg）。</b>',
      EV('這一格<b>不用含鉑處方</b> —— AGC-5 把 5-FU 為主的骨架明確指定給 ' +
        'Karnofsky ≤ 50 或 ECOG ≥ 3 的病人。'),
      H('支持性照護要處理的四件事', 'AGC-4'),
      '<b>阻塞、營養、疼痛、出血</b> —— 各自的做法見下方。'
    ], 'AGC-4（Karnofsky ≤ 50 或 ECOG ≥ 3 → HDFL 或 BSC／hospice）、AGC-5（HDFL 劑量）。',
      more(backboneTable()));
    fu('gc_f_recur', 'palli');
  }

  /* ---------- 共用：全身治療 AGC-5 ---------- */
  function showSys(baseNum) {
    var n = parseInt(baseNum, 10);
    show('gc_b_sys', true);
    setNum('gc_n_her2', String(n));
    show('gc_n_her2', true);
    if (!S.her2) return;
    if (S.her2 === 'pos') {
      setNum('gc_n_hcps', String(n + 1));
      show('gc_n_hcps', true);
      if (!S.hcps) return;
    } else {
      setNum('gc_n_bio', String(n + 1));
      show('gc_n_bio', true);
      if (!S.bio) return;
    }
    setNum('gc_n_fit', String(n + 2));
    show('gc_n_fit', true);
    if (!S.fit) return;
    setNum('gc_n_line', String(n + 3));
    show('gc_n_line', true);
    if (!S.line) return;
    renderSys();
  }

  function bioLabel() {
    if (S.her2 === 'pos') return 'HER2 陽性　·　' + (S.hcps === 'ge1' ? 'CPS ≥ 1' : 'CPS < 1');
    return 'HER2 陰性　·　' + { msi: 'dMMR／MSI-H', cldn: 'CLDN18.2 陽性', cps5: 'CPS ≥ 5',
      cps1: 'CPS ≥ 1 但 < 5', none: '三個標記都不符合' }[S.bio];
  }
  function lineLabel() { return { l1: '第一線', l2: '第二線', l3: '第三線以後' }[S.line]; }

  function backboneLines() {
    var L = [];
    L.push(H('化療骨架先定下來', 'AGC-5'));
    if (S.fit === 'good') {
      L.push('<b>體能好 → 含鉑處方：cisplatin 或 oxaliplatin ＋ fluoropyrimidine</b>' +
        '（capecitabine、tegafur/uracil 或 5-FU），加或不加 leucovorin。');
    } else {
      L.push('<b>體能差（Karnofsky ≤ 50 或 ECOG ≥ 3）→ 5-FU 為主的處方</b>：' +
        '<b>HDFL</b>（每週一次、24 小時輸注 5-FU 2000–2600 mg/m² ＋ leucovorin 300 mg/m²，最多 500 mg），' +
        '或其他 5-FU/leucovorin 為基礎的處方。');
      L.push(EV('這一格<b>不加標靶或免疫治療</b>比較常見 —— ' +
        '健保對 nivolumab 與 zolbetuximab 的初次申請都要求 <b>ECOG ≤ 1</b>，' +
        '體能差的病人條件上就過不了。'));
    }
    return L;
  }

  function renderSys() {
    var L = [], cls = 'rec-elective';
    var title = bioLabel() + '　·　' + lineLabel() + '<br>→ ' + sysHeadline();

    if (S.line === 'l1') {
      L = L.concat(backboneLines());
      L.push(H('骨架之上要加什麼', 'AGC-5'));
      if (S.her2 === 'pos') {
        if (S.hcps === 'lt1') {
          L.push('<b>加 trastuzumab。</b>');
          L.push(EV('CPS < 1 的 HER2 陽性病人，AGC-5 只列 trastuzumab 一項（加上臨床試驗）。'));
        } else {
          L.push('<b>加 trastuzumab 與 pembrolizumab。</b>');
          L.push(EV('AGC-5 把 HER2 陽性依 CPS 分成兩格：<b>CPS < 1 只加 trastuzumab；' +
            'CPS ≥ 1 才加上 pembrolizumab</b>。這裡的 CPS 是用 Dako 22C3 驗的。'));
        }
        L.push('<b>臨床試驗也是並列的選項。</b>');
        L.push(H('健保會給付到哪裡', '9.18 第 3 項'));
        L.push('<b>trastuzumab 限 IV 劑型，而且條文寫的搭配是「capecitabine（或 5-FU）＋ cisplatin」，' +
          '用於未曾化療的 HER2 過度表現（IHC 3+ 或 FISH+）轉移性胃腺癌或胃食道接合處腺癌。</b>');
        L.push('<b>換成 oxaliplatin 就不在條文字面範圍內</b>，事前審查前要先確認。' +
          '核准後<b>每 24 週</b>要檢附療效評估再申請。');
        if (S.hcps === 'ge1') {
          L.push('<b>pembrolizumab 用於胃癌第一線「尚未給付於此適應症」</b>（9.69 生物標記表）—— ' +
            '指引寫的這一格可以做，<b>但要自費</b>。');
        }
      } else if (S.bio === 'msi') {
        L.push('<b>加 nivolumab 或 pembrolizumab（dMMR／MSI-H）。</b>');
        L.push('<b>ESMO Pan-Asia 建議 MSI-H／dMMR 者不論第幾線都可以加 anti-PD1</b>（AGC-5 註 e）—— ' +
          '所以這一格在後線也一樣適用。');
        L.push(H('健保的實際情形', '9.69(5)'));
        L.push('<b>健保在胃癌第一線只給付 nivolumab，而且條件是「併用 fluoropyrimidine 及 oxaliplatin、' +
          'HER2 陰性、CPS ≥ 5」</b>。');
        L.push(EV('也就是說 —— <b>MSI-H 但 CPS < 5 的病人，指引建議用、健保條文卻對不上</b>。' +
          '申請前要先確認 PD-L1 報告（Dako 28-8）的 CPS 值，不能只靠 MSI 結果送件。'));
      } else if (S.bio === 'cldn') {
        L.push('<b>加 zolbetuximab（CLDN18.2 陽性）。</b>');
        L.push('<b>健保 9.133 自 115/04/01 起給付</b>：限與 fluoropyrimidine ＋ 含鉑化療併用，' +
          'CLDN18.2 陽性、HER2 陰性的第一線，<b>而且要 ECOG ≤ 1</b>；' +
          '初次申請要附<b>CLDN18.2 陽性（≥ 75% 腫瘤細胞中至強染色）</b>與 HER2 陰性的報告。');
        L.push(H('這一格最重要的一個岔路', '9.133 第 3 點、9.69(5) II'));
        L.push('<b>zolbetuximab 與免疫檢查點抑制劑只能擇一給付，而且治療失敗時不可互換。</b>');
        L.push('<b>如果這位病人同時 CLDN18.2 陽性又 CPS ≥ 5，第一線就要選定一邊，之後不能換。</b>');
        L.push(EV('指引對這個問題的答案是「還不知道」：' +
          '<b>「PD-L1 與 CLDN18.2 都陽性時，最佳順序尚未確定」</b>，' +
          '正在等 ILUSTRO（NCT03505320）與 LUCERNA（NCT06011531）。' +
          '所以這是一個要靠多專科討論與病人偏好決定的岔路，不是有標準答案的。'));
      } else if (S.bio === 'cps5') {
        L.push('<b>加 nivolumab（CPS ≥ 5，用 Dako 28-8 驗）。</b>');
        L.push('<b>健保 9.69(5) 就是給這一格的</b>：限 nivolumab 併用 fluoropyrimidine（5-FU 或 capecitabine）' +
          '及 <b>oxaliplatin</b>，第一線、HER2 陰性、<b>CPS ≥ 5</b>。');
        L.push(EV('注意條文指定的鉑類是 <b>oxaliplatin</b>，不是 cisplatin —— ' +
          '和 trastuzumab 那條（指定 cisplatin）剛好相反，開單前要看清楚是哪一條在給付。'));
        L.push(H('若這位病人同時 CLDN18.2 陽性', '9.133、9.69(5) II'));
        L.push('<b>' + NR('zolbetuximab') + ' 與免疫檢查點抑制劑只能擇一給付、失敗時不可互換 —— 第一線就要決定。</b>');
      } else if (S.bio === 'cps1') {
        L.push('<b>加 pembrolizumab（CPS ≥ 1，用 Dako 22C3 驗）。</b>');
        L.push(H('但健保這一格是空的', '9.69 生物標記表'));
        L.push('<b>胃癌第一線的免疫治療，健保只給付 ' + NR('nivolumab') + ' 且要求 CPS ≥ 5</b>；' +
          'pembrolizumab 在這個適應症「尚未給付」。<b>CPS ≥ 1 但 < 5 的病人要自費。</b>');
        L.push(EV('CPS 的兩個切點對應兩支不同的抗體與兩支不同的藥：' +
          '<b>Dako 22C3 → pembrolizumab → 切點 1；Dako 28-8 → nivolumab → 切點 5</b>。' +
          '報告上是哪一支抗體驗的，決定了能不能送件。'));
      } else {
        L.push('<b>四個標記都不符合 → 就用化療骨架，不加標靶或免疫治療。</b>');
        L.push(EV('AGC-5 的第一線是「chemotherapy ± immunotherapy 或 targeted therapy」，' +
          '加號後面那一段完全由 HER2、PD-L1、MMR/MSI 與 CLDN18.2 決定。四個都不符合就只剩骨架。'));
        L.push('<b>臨床試驗是並列的選項</b>（AGC-4 註 b）。');
      }
      fill('gc_r_sys', cls, title, L,
        'AGC-5（第一線 chemotherapy ± immunotherapy／targeted therapy）、註 c–f、AGC-P；' +
        '健保 9.18／9.69／9.133 查詢日 2026-08-17。',
        more(backboneTable(), biomarkerReference(), nhiMeta()));
      fu('gc_f_sys', 'palli');
      return;
    }

    if (S.line === 'l2') {
      L.push(H('第二線的選項', 'AGC-5'));
      L.push('<b>docetaxel。</b>');
      L.push('<b>單方或合併：cisplatin、oxaliplatin、taxanes、irinotecan、5-FU/HDFL、capecitabine、S-1。</b>');
      L.push('<b>ramucirumab，加或不加 paclitaxel。</b>');
      if (S.her2 === 'pos') {
        L.push('<b>trastuzumab-deruxtecan（HER2 陽性）</b> —— 這是版次 17 新增的紅字項目。');
      }
      L.push('<b>臨床試驗。</b>');
      L.push(H('這一格的健保現況', 'AGC-5 註 g、9.92、9.115'));
      L.push('<b>指引註 g 自己寫：轉移性胃癌的 ' + NR('ramucirumab、paclitaxel、trastuzumab-deruxtecan') +
        ' 目前健保都不給付。</b>');
      L.push(EV('條文面也對得上：' + NR('ramucirumab') + ' 9.92 只給付肝細胞癌；' +
        NR('trastuzumab deruxtecan') + ' 9.115 只有乳癌適應症。' +
        '<b>所以第二線真正有健保的，是那些細胞毒性藥物的組合。</b>'));
      if (S.bio === 'msi') {
        L.push(H('MSI-H 的例外', 'AGC-5 註 e'));
        L.push('<b>ESMO Pan-Asia 建議 MSI-H／dMMR 者不論第幾線都可以加 anti-PD1</b> —— ' +
          '但健保後線不給付免疫治療，要自費。');
      }
      fill('gc_r_sys', cls, title, L, 'AGC-5（2nd line therapy）、註 g；健保條文查詢日 2026-08-17。',
        more(backboneTable(), nhiMeta()));
      fu('gc_f_sys', 'palli');
      return;
    }

    cls = 'rec-nonop';
    L.push(H('第三線以後的選項', 'AGC-5'));
    L.push('<b>trifluridine ＋ tipiracil。</b>');
    L.push('<b>nivolumab。</b>');
    L.push('<b>pembrolizumab —— 限 PD-L1 CPS ≥ 1，或 MSI-H，或 dMMR。</b>');
    L.push('<b>臨床試驗。</b>');
    L.push(H('後線免疫治療的健保現況', 'AGC-5 註 h、9.69'));
    L.push('<b>指引註 h 自己寫：TFDA 已核准 ' + NR('pembrolizumab 與 nivolumab') +
      ' 用於後線，但健保後線不給付，需自費。</b>');
    L.push(EV('條文面：9.69 單獨使用的「轉移性胃癌」那一條，' +
      '<b>限 109/04/01 前已經核准的病人續用</b> —— 新病人拿不到。'));
    L.push(H('trifluridine ＋ tipiracil 的健保條件', '9.66 第 2 項'));
    L.push('<b>要先接受過兩種（含）以上治療</b>，包含 fluoropyrimidine、platinum、taxane 或 irinotecan ' +
      '為基礎的化療，以及 HER2/neu 標靶治療（如果適合）。');
    L.push('<b>劑量：35 mg/m²（以 trifluridine 計）口服 每日兩次，D1–5 與 D8–12，28 天一個週期；' +
      '單次上限 80 mg。</b>');
    fill('gc_r_sys', cls, title, L,
      'AGC-5（3rd line or later therapy）、註 h；健保 9.66、9.69 查詢日 2026-08-17。',
      more(nhiMeta()));
    fu('gc_f_sys', 'palli');
  }

  function sysHeadline() {
    if (S.line === 'l3') return '後線單藥，多數要自費';
    if (S.line === 'l2') return '換一類細胞毒性藥；標靶與 ADC 要自費';
    if (S.her2 === 'pos') return S.hcps === 'ge1' ? '化療 ＋ trastuzumab ＋ pembrolizumab' : '化療 ＋ trastuzumab';
    return { msi: '化療 ＋ anti-PD1', cldn: '化療 ＋ zolbetuximab', cps5: '化療 ＋ nivolumab',
      cps1: '化療 ＋ pembrolizumab（自費）', none: '單純化療骨架' }[S.bio];
  }

  /* ==========================================================
     7. 最下方：什麼時候要懷疑遺傳性胃癌
     ========================================================== */
  function hereditaryBlock() {
    var L = [];
    L.push(H('台大胃癌診療指引怎麼寫的', 'AGC-1～AGC-P'));
    L.push('<b>版次 17 全文沒有列家族史問診、遺傳諮詢或胚系基因檢測的建議。</b>' +
      '生物標記那一段（AGC-P）驗的 HER2、PD-L1、MSI／MMR、CLDN18.2 <b>都是腫瘤檢體的體細胞檢測，' +
      '目的是選藥，不是找遺傳性癌症</b>。');
    L.push(EV('把這一點寫出來，是因為「有驗 MSI」很容易被當成「已經篩過 Lynch syndrome 了」。' +
      '<b>腫瘤 MSI-H 只是起點，要確認是不是遺傳性還需要另外的胚系檢測與遺傳諮詢。</b>'));

    L.push(H('什麼時候該想到遺傳性胃癌？', '台大指引未列，屬院外實證'));
    L.push('<b>瀰漫型（diffuse-type／印戒細胞）胃癌而且發病年輕</b>，尤其是 <b>&lt; 50 歲</b>。');
    L.push('<b>家族中有兩位以上一等或二等親罹患胃癌，其中一位是瀰漫型。</b>');
    L.push('<b>家族中同時有瀰漫型胃癌與小葉型乳癌</b> —— 這個組合特別指向 <b>CDH1</b>。');
    L.push('<b>腫瘤 MMR 表現缺失或 MSI-H，而且家族史符合大腸直腸癌／子宮內膜癌的聚集</b> → 想 Lynch syndrome。');

    L.push(H('要驗什麼基因？', '台大指引未列，屬院外實證'));
    L.push('<b>遺傳性瀰漫型胃癌（HDGC）：CDH1</b>，部分家族是 <b>CTNNA1</b>。');
    L.push('<b>Lynch syndrome：MLH1、MSH2、MSH6、PMS2、EPCAM</b>（先做腫瘤 MMR／MSI 篩檢，' +
      'MLH1 缺失要先驗 BRAF V600E 或 MLH1 啟動子甲基化排除後天原因）。');
    L.push('<b>其他會合併胃息肉或胃癌的症候群：APC（家族性腺瘤性息肉症）、STK11（Peutz-Jeghers）、' +
      'SMAD4／BMPR1A（幼年型息肉症）。</b>');
    L.push(EV('以上基因清單<b>台大胃癌診療指引版次 17 全文沒有列</b>，' +
      '本頁引自 NCCN Genetic/Familial High-Risk Assessment: Colorectal, Endometrial, and Gastric，' +
      '本頁查核之公開版本為 v3.2024。<b>要驗之前請照會遺傳諮詢。</b>'));

    L.push(H('驗到致病變異之後會改變什麼？', '台大指引未列，屬院外實證'));
    L.push('<b>CDH1 致病變異帶因者，會被討論預防性全胃切除</b> —— ' +
      '因為 <b>內視鏡追蹤對瀰漫型胃癌的偵測率很差</b>（癌細胞在黏膜下散開，看不到腫塊）。');
    L.push('<b>女性 CDH1 帶因者要加做乳房監測</b>（小葉型乳癌風險升高）。');
    L.push('<b>Lynch syndrome：大腸鏡改為每 1 年一次，女性加做子宮內膜評估。</b>');
    L.push('<b>一等親要做 cascade testing。</b>');
    L.push(EV('這一段和病人走哪一條治療路線無關，每一條都適用，所以放在流程最下方。' +
      '但它會改變兩件很實際的事：<b>要不要建議預防性手術</b>，以及<b>家屬要不要來看門診</b>。'));

    return '<div class="bc-gene-h">要不要驗基因？懷疑遺傳性胃癌時怎麼做' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     8. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'gc-drug-' + code.replace(/ /g, '_'); }

  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }

  function renderGeneBlock(hasRec) {
    var g = el('gc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = hereditaryBlock();
  }

  function renderDrugCards() {
    var box = el('gc_drugs');
    if (!box) return;
    var txt = '';
    /* 取文字前先把 .no-rx（否定句裡的藥名）整段拿掉 —— 直接讀 textContent 的話，
       「輔助情境 oxaliplatin 不給付」會長出一張歐力普的藥卡。 */
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— '</b></td><td>' 這種標籤邊界在 textContent 裡是零寬度的，
         會把 'FOLFIRINOX' 和 'oxaliplatin' 黏成 'FOLFIRINOXoxaliplatin'，
         整字比對就抓不到 oxaliplatin，那張藥卡會無聲消失。改成把標籤換成空白。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('gcPath');
    if (root) {
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        r.querySelectorAll('details.rx-table').forEach(function (d) { txt += textOf(d) + '\n'; });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }

    renderGeneBlock(!!txt.trim());

    var picked = [];
    GC_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' + (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });

    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;

    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var nCards = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡<span class="bc-drugbox-n">' +
      picked.length + ' 種藥 · ' + nCards + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">點藥名展開台大醫院藥劑部處方集的完整藥卡（劑量、腎肝功能調整、' +
      '禁忌、健保給付規定、剝半磨粉）。<b>離線也看得到；只有藥品外觀照是台大原站外連，需要連線。</b></div>' +
      picked.map(function (d) {
        return d.cards.map(function (c) { return drugCardHTML(c, d.label || d.key, d.flag); }).join('');
      }).join('');

    if (window.DrugCard && window.requestIdleCallback) {
      var pids = {};
      picked.forEach(function (d) { d.cards.forEach(function (c) { pids[c[0]] = 1; }); });
      window.requestIdleCallback(function () {
        Object.keys(pids).forEach(function (pid) { window.DrugCard.loadPid(pid).catch(function () {}); });
      });
    }
  }

  /* ==========================================================
     9. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope) {
      if (S.scope === 'work') renderWork();
      else if (S.scope === 'esd') renderEsd();
      else if (S.scope === 'postop') renderPostop();
      else if (S.scope === 'meta') renderMeta();
      else if (S.scope === 'recur') renderRecur();
    }
    renderDrugCards();
  }

  function renderMeta() {
    showSys('2');
  }

  /* ==========================================================
     10. 互動
     ========================================================== */
  var SEL_GROUPS = ['gc_n1', 'gc_n_extent', 'gc_n_plan', 'gc_n_einx', 'gc_n_ecur', 'gc_n_rstat',
    'gc_n_ptn', 'gc_n_rest', 'gc_n_rps', 'gc_n_her2', 'gc_n_hcps', 'gc_n_bio', 'gc_n_fit', 'gc_n_line'];

  var DOWNSTREAM = {
    scope: ['extent', 'plan', 'einx', 'ecur', 'rstat', 'ptn', 'rest', 'rps',
      'her2', 'hcps', 'bio', 'fit', 'line'],
    extent: ['plan', 'rstat', 'ptn', 'rest', 'her2', 'hcps', 'bio', 'fit', 'line'],
    plan: ['rstat', 'ptn', 'her2', 'hcps', 'bio', 'fit', 'line'],
    einx: ['ecur'],
    rstat: ['ptn', 'her2', 'hcps', 'bio', 'fit', 'line'],
    rps: ['her2', 'hcps', 'bio', 'fit', 'line'],
    her2: ['hcps', 'bio', 'fit', 'line'],
    hcps: ['fit', 'line'],
    bio: ['fit', 'line'],
    fit: ['line'],
    line: ['rest']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function gcPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
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

  function reapplyMarks() {
    var pairs = [
      ['gc_n1', 'scope'], ['gc_n_extent', 'extent'], ['gc_n_plan', 'plan'], ['gc_n_einx', 'einx'],
      ['gc_n_ecur', 'ecur'], ['gc_n_rstat', 'rstat'], ['gc_n_rest', 'rest'], ['gc_n_rps', 'rps'],
      ['gc_n_her2', 'her2'], ['gc_n_hcps', 'hcps'], ['gc_n_bio', 'bio'], ['gc_n_fit', 'fit'],
      ['gc_n_line', 'line']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /gcPick\('([a-z0-9]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
    if (S.ptn) { var c = el('gc_ptnc_' + S.ptn); if (c) c.classList.add('selected'); }
  }

  function gcReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    var h = el('gc_ptn_hold'); if (h) h.innerHTML = '';
    render();
  }

  function initGastricPathway() { gcReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。 */
  global.gastricPathwayHTML = gastricPathwayHTML;
  global.initGastricPathway = initGastricPathway;
  global.gcPick = gcPick;
  global.gcReset = gcReset;
})(window);
