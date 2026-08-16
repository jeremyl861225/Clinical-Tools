/* ============================================================
   結腸癌治療互動決策流程 Colon Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-08-16 全部重寫（第二版）。舊版已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引
   （文件編號 50710-2-000007，版次 21；2026/06/16 第 87 次癌症醫療委員會
     修訂通過；結腸章節 COL-1～COL-9、處方 COL-10／COL-11、放療 COL-14）
   以及 大腸直腸癌治療藥物處方（文件編號 50710-2-000015，版次 12；
     檢視日期 2026/06/16）。頁碼以 COL-x 標於各建議。
   指引所依據之公開版本：NCCN colon 2026v1、rectal 2026v1（COL-18）。
   健保給付條文查詢日：2026-08-16（來源：健保署藥品給付規定第 9 節）。

   ※ 本模組僅涵蓋「結腸 Colon」。直腸專屬之新輔助放化療、TME、環周切緣、
     proctoscopy 追蹤在 rectal-pathway.js。

   ── 遵守的六條版面規則（見 skill: pathway-ux-rules.md）────────────
   1. 沒有選之前，下游的步驟與建議框一律不出現（collapseAll）。
   2. 建議框只講「它正上方那一步」的結論。
   3. 決策用正常字；理由與試驗數據降階成小灰字（li.ev）或收合（details）。
   4. 同一件事只寫一次，共用內容各自只有一個函式。
   5. 臨床術語用英文原詞；縮寫只留大家都用的（CRM、TME、MMR、MSI、HIPEC、
      CCRT、RT、CEA）。中英之間補半形空白。
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
    'scope',   // polyp | m0 | m1 | recur
    'pmar',    // 惡性息肉的切緣：clear | bad
    'pfeat',   // 惡性息肉的病理特徵：fav | unfav
    'pshape',  // 惡性息肉的形態：ped | ses
    'pres',    // COL-2 的四個 findings：nonobs | obs | t4b | unres
    'ptn',     // 術後病理 pT×pN 格
    'mmr',     // 第 II 期的 MMR／MSI：dmmr | pmmr
    'hrisk',   // 第 II 期 pMMR 的高風險特徵：yes | no
    'msite',   // COL-4 轉移分布：liverlung | periton | other
    'mres',    // 肝／肺轉移可切除性：res | unres
    'pperi',   // COL-5 腹膜轉移：nonobs | obs | peri
    'bio',     // 生物標記：msi | wt | ras | braf
    'fit',     // 能否耐受 intensive therapy：yes | no
    'line',    // 線別：l1 | l2 | l3 | l4
    'rentry',  // COL-9 復發的呈現：cea | doc
    'rres',    // 異時性轉移可切除性：res | unres
    'rprior'   // 12 個月內是否用過 FOLFOX／CAPEOX：yes | no
  ];
  KEYS.forEach(function (k) { S[k] = null; });


  /* ==========================================================
     0b. 學名 → 台大藥卡
     ----------------------------------------------------------
     2026-08-16 對 data/drugs/index.js 逐碼實跑核對。
     code 一律是「卡層主碼」；⚠ 'AV 1CE89' 內含半形空白，任何環節都不可 trim。
     re：流程圖內文裡用來認出這個藥的樣式（沒寫就用 key 本身當整字比對）。
     flag：藥卡本身看不出來、但會改變門診動作的旗標。
     ========================================================== */
  var CC_DRUGS = [
    /* ── fluoropyrimidine 骨架 ─────────────────────── */
    { key: '5-FU', re: '5-FU|fluorouracil', cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']] },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']] },
    { key: 'UFUR', re: 'UFUR|uracil-tegafur|tegafur',
      cards: [['17', 'UFU4CB31', 'UFUR 友復膠囊（tegafur 100 mg ＋ uracil 224 mg）', 'tegafur ＋ uracil']] },

    /* ── 細胞毒性合併用藥 ─────────────────────────── */
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']] },
    { key: 'irinotecan', re: '(?<!liposomal )irinotecan', cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']] },

    /* ── 標靶 ─────────────────────────────────── */
    { key: 'bevacizumab', cards: [['17', 'AV 1CE89', 'Avastin 癌思停注射劑 100 mg/4 mL']] },
    { key: 'cetuximab', cards: [['17', 'ERB1CEB4', 'Erbitux 爾必得舒注射液 100 mg/20 mL']] },
    { key: 'panitumumab', cards: [['17', 'VEC1CEL3', 'Vectibix 維必施注射劑 100 mg/5 mL']] },
    { key: 'ramucirumab', cards: [['17', 'CYR1CEL4', 'Cyramza 欣銳擇注射劑 100 mg/10 mL']],
      flag: '大腸直腸癌無健保給付（9.92 限肝癌）' },
    { key: 'regorafenib', cards: [['17', 'STI4CEE2', 'Stivarga 癌瑞格膜衣錠 40 mg']] },
    { key: 'trifluridine ＋ tipiracil', re: 'trifluridine|tipiracil|Lonsurf',
      cards: [['17', 'LON4CB57', 'Lonsurf 朗斯弗膜衣錠 15 mg／20 mg', 'trifluridine ＋ tipiracil']] },
    { key: 'encorafenib', cards: [['17', 'BRA4CG34', 'Braftovi 迫癌癒膠囊 75 mg']] },
    { key: 'fruquintinib', cards: [['17', 'FRU4CG59', 'Fruzaqla 伏腸剋膠囊 1 mg／5 mg']],
      flag: '台大指引未列；健保 9.136 已給付後線' },

    /* ── 免疫檢查點抑制劑 ─────────────────────────── */
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']] },
    { key: 'nivolumab', cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑 20 mg/2 mL、120 mg/12 mL']] },
    { key: 'ipilimumab', cards: [['17', 'YER1CEI0', 'Yervoy 益伏注射劑 50 mg/10 mL']], flag: '大腸直腸癌需自費' },

    /* ── HIPEC 用藥 ──────────────────────────────── */
    { key: 'mitomycin', re: 'mitomycin', cards: [['17', 'MIN1CD06', 'Mitonco 密多邁杏凍晶注射劑 10 mg']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg/50 mL']] }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ccPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }

  /* 一個節點 ＝ 箭頭 + 步驟卡，整包一起開關，箭頭不會單獨留在畫面上 */
  function node(id, num, q, opts, extra) {
    return '<div class="cc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="cc-node" id="' + id + '">' +
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
  /* 「這個藥<b>不可以</b>用」這種否定句裡的藥名要包起來 —— 最下方的藥卡掃描是純字串比對，
     不包的話「cetuximab 不可以用在輔助情境」會讓畫面長出一張 Erbitux 的藥卡，
     等於把禁忌藥推到醫師眼前。renderDrugCards() 會先把 .no-rx 整段移掉再比對。 */
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }

  function fold(summary, inner) {
    return '<details class="kps-details"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  /* 處方表專用。和 fold() 只差一個 rx-table class —— 最下方的藥卡掃描會把這種表
     一起掃進去（裡面列的是真的要開的藥），健保條文那種表則不掃，否則會把整本
     藥典列出來。 */
  function foldRx(summary, inner) {
    return '<details class="kps-details rx-table"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  /* 建議卡末尾的參考資料：和上面的建議條列用同一個 ul、同一種點點與行距 */
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

  /* ==========================================================
     2. T×N 決策格（COL-3(1)／COL-3(2) 的術後輔助治療分組）
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
          'onclick="ccPick(\'' + stateKey + '\',\'' + key + '\',this)">' + r[3] + c[3] + '</button>';
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

  /* pTis 不可能有淋巴結轉移，所以不放進格子裡（避免點得出矛盾的組合），
     改寫在格子上方的說明列。 */
  var PT_ROWS = [
    ['t1', 'pT1', '侵犯黏膜下層', 'T1'],
    ['t2', 'pT2', '侵犯固有肌層', 'T2'],
    ['t3', 'pT3', '穿透固有肌層至結腸周圍組織', 'T3'],
    ['t4', 'pT4a–b', '穿透臟層腹膜／直接侵犯鄰近器官', 'T4']
  ];
  var PN_COLS = [
    ['n0', 'pN0', '沒有轉移', 'N0'],
    ['n1', 'pN1', '1–3 顆（含 N1c 腫瘤沉積）', 'N1'],
    ['n2', 'pN2', '≥ 4 顆', 'N2']
  ];
  var PTN = {
    t1: ['none', 'low', 'high'],
    t2: ['none', 'low', 'high'],
    t3: ['ii', 'low', 'high'],
    t4: ['ii', 'high', 'high']
  };
  var PTN_LEGEND = [
    ['none', '不需要輔助化療'],
    ['ii', '第 II 期：要先看 MMR 與高風險特徵'],
    ['low', '低風險第 III 期'],
    ['high', '高風險第 III 期']
  ];
  function ptnGroup(r, c) {
    return PTN[r][c === 'n0' ? 0 : (c === 'n1' ? 1 : 2)];
  }
  function ptnParts() {
    var p = S.ptn.split('_');
    return { t: p[0], n: p[1], g: ptnGroup(p[0], p[1]) };
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

  /* 3a. 第 II 期的高風險特徵（COL-3(1)）—— 規則 6：一定要寫出條件內容 */
  var HR_ITEMS = [
    '<b>Grade 3–4</b>（分化不良或未分化）',
    '<b>淋巴管或血管侵犯</b>（lymphatic / vascular invasion）',
    '<b>腸阻塞</b>（bowel obstruction）',
    '<b>檢出的淋巴結 &lt; 12 顆</b>',
    '<b>神經周圍侵犯</b>（perineural invasion）',
    '<b>局部穿孔</b>（localized perforation）',
    '<b>切緣過近、無法判定或陽性</b>'
  ];
  function hrFeatureList() { return SUB(HR_ITEMS); }

  /* 3b. 輔助化療處方（COL-10；藥物處方文件第一節） */
  function adjRxTable(withOxali) {
    var ox = '';
    if (withOxali) { ox =
      '<tr><td><b>FOLFOX4</b><br>q2w × 12 cycles</td><td>' +
      'oxaliplatin 85 mg/m² ＋ leucovorin 200 mg/m² IV 2 hr（D1）→ 5-FU 400 mg/m² IV bolus（D1）→ ' +
      '5-FU 600 mg/m² 輸注 22 hr（D1）；D2 重複 leucovorin 200 mg/m² 2 hr、5-FU 400 mg/m² bolus、5-FU 600 mg/m² 22 hr</td></tr>' +
      '<tr><td><b>modified FOLFOX6</b><br>q2w × 12 cycles</td><td>' +
      'oxaliplatin 85 mg/m² IV（D1）；leucovorin 400 mg/m² IV 2 hr；5-FU 400 mg/m² IV bolus（D1）→ ' +
      '5-FU 2400 mg/m² 輸注 46 hr</td></tr>' +
      '<tr><td><b>Oxaliplatin-HDFL24</b><br>q3w × 6–8 cycles</td><td>' +
      'oxaliplatin 60–65 mg/m² IV 2–4 hr（D1、D8）；5-FU 2000–2600 mg/m² ＋ leucovorin 300 mg/m² 輸注 24 hr（D1、D8）</td></tr>' +
      '<tr><td><b>XELOX（CapeOX）</b><br>q3w × 8 cycles</td><td>' +
      'oxaliplatin 85–130 mg/m² IV（D1）；capecitabine 800–1250 mg/m² 口服 每日兩次（D1–14）</td></tr>'; }
    return foldRx('<b>這個病人可以用的輔助處方</b>（藥名、劑量、頻率、療程數；COL-10）',
      '<table>' + ox +
      '<tr><td><b>capecitabine 單方</b><br>q3w × 24 週</td><td>capecitabine 800–1250 mg/m² 口服 每日兩次（D1–14）</td></tr>' +
      '<tr><td><b>LV5FU2</b><br>q2w</td><td>leucovorin 200 mg/m² 輸注（D1、D2）；5-FU 400 mg/m² bolus（D1、D2）→ 5-FU 600 mg/m² 輸注 22 hr（D1、D2）</td></tr>' +
      '<tr><td><b>HDFL</b><br>每週 × 6 個月</td><td>5-FU 2600 mg/m² ＋ leucovorin 300 mg/m² IV（D1）</td></tr>' +
      '<tr><td><b>LDFL</b><br>每週 × 6 個月</td><td>5-FU 450–550 mg/m² ＋ leucovorin 45–55 mg/m² IV（D1）</td></tr>' +
      '<tr><td><b>UFUR</b><br>口服</td><td>UFUR 300–350 mg/m²/day × 4 週，± leucovorin 30 mg 口服 tid × 4 週，停 1 週，q5w × 5 cycles</td></tr>' +
      '<tr><td>溶劑</td><td>' + NR('oxaliplatin') + ' 用 <b>D5W</b>；標靶藥用 <b>0.9% sodium chloride</b></td></tr>' +
      '</table>');
  }

  /* 3c. 晚期／轉移性處方（COL-11(1)、COL-11(2)）
     ⚠ 這張表會被最下方的藥卡掃描讀進去，所以<b>必須依這個病人的生物標記與線別過濾</b>。
     整份菜單照印會讓 RAS 突變的病人畫面上長出 cetuximab 的藥卡 —— 那是禁忌藥。 */
  function metaRxTable(bio, line) {
    var egfr = (bio === 'wt');
    var braf = (bio === 'braf');
    var msi = (bio === 'msi');
    var l2plus = (line === 'l2' || line === 'l3' || line === 'l4');
    var later = (line === 'l3' || line === 'l4');
    var eTail = egfr ? '　±　cetuximab 首劑 400 mg/m²、之後 250 mg/m² 每週　±　panitumumab 6 mg/kg IV D1' : '';
    var r = '';
    r += '<tr><td><b>mFOLFOX6</b><br>q2w</td><td>oxaliplatin 85 mg/m² IV（D1）；leucovorin 400 mg/m² 2 hr；' +
      '5-FU 400 mg/m² bolus（D1）→ 5-FU 2400 mg/m² 輸注 46 hr　±　bevacizumab 5 mg/kg IV D1' + eTail + '</td></tr>';
    r += '<tr><td><b>XELOX</b><br>q3w</td><td>oxaliplatin 130 mg/m² IV D1；capecitabine 850–1000 mg/m² 每日兩次（D1–14）' +
      '　±　bevacizumab 7.5 mg/kg IV D1</td></tr>';
    r += '<tr><td><b>FOLFIRI</b><br>q2w</td><td>irinotecan 150–180 mg/m² IV D1；leucovorin 400 mg/m² 2 hr；' +
      '5-FU 400 mg/m² D1 → 2400 mg/m² 輸注 46 hr　±　bevacizumab 5 mg/kg' + eTail +
      (l2plus ? '　±　ramucirumab 8 mg/kg IV D1 q2w（<b>大腸直腸癌無健保給付</b>）' : '') + '</td></tr>';
    r += '<tr><td><b>FOLFOXIRI</b><br>q2w</td><td>irinotecan 165 mg/m² D1；oxaliplatin 85 mg/m² D1；' +
      'leucovorin 400 mg/m² D1；5-FU 3200 mg/m² 輸注 48 hr</td></tr>';
    r += '<tr><td><b>Irinotecan-HDFL24/48</b><br>q3w／q4w</td><td>irinotecan 75 mg/m² IV 2–4 hr（D1、D8）；' +
      '5-FU 2000–3000 mg/m² ＋ leucovorin 300 mg/m² 輸注 24–48 hr（D1、D8）</td></tr>';
    r += '<tr><td><b>irinotecan 單方</b></td><td>100–125 mg/m² IV 2–4 hr（D1、D8）q3w，' +
      '或 180 mg/m² IV 30–90 min D1 q3w' + (egfr ? '　±　cetuximab 或 panitumumab' : '') + '</td></tr>';
    r += '<tr><td><b>XELIRI</b><br>q3w</td><td>capecitabine 1000 mg/m² 每日兩次（D1–14）；' +
      'irinotecan 100–125 mg/m²（D1、D8）　±　bevacizumab 7.5 mg/kg</td></tr>';
    if (braf && l2plus) {
      r += '<tr><td><b>encorafenib ＋ cetuximab</b><br>BRAF V600E · 第二線</td><td>encorafenib 300 mg 口服 每日一次；' +
        'cetuximab 首劑 400 mg/m²、之後 250 mg/m² 每週</td></tr>';
    }
    if (msi) {
      r += '<tr><td><b>pembrolizumab</b><br>dMMR／MSI-H</td><td>200 mg IV D1 q3w</td></tr>';
      r += '<tr><td><b>nivolumab</b><br>dMMR／MSI-H</td><td>3 mg/kg IV D1 q2w</td></tr>';
      r += '<tr><td><b>nivolumab ＋ ipilimumab</b><br>dMMR／MSI-H</td><td>nivolumab 3 mg/kg ＋ 低劑量 ipilimumab ' +
        '1 mg/kg q3w（共四劑），之後 nivolumab 3 mg/kg q2w</td></tr>';
    }
    if (later) {
      r += '<tr><td><b>regorafenib</b></td><td>120–160 mg 口服 每日一次（D1–21），每 28 天重複；' +
        '<b>前 4 週要每週監測不良反應</b></td></tr>';
      r += '<tr><td><b>trifluridine ＋ tipiracil</b></td><td>35 mg/m²（以 trifluridine 計）口服 每日兩次，' +
        'D1–5 與 D8–12，28 天一個週期；<b>trifluridine 單次上限 80 mg</b></td></tr>';
    }
    r += '<tr><td>溶劑</td><td>oxaliplatin 用 <b>D5W</b>；' + NR('標靶藥（bevacizumab、ramucirumab、cetuximab、' +
      'panitumumab）') + '用 <b>0.9% sodium chloride</b></td></tr>';
    return foldRx('<b>這個病人可以用的處方</b>（藥名、劑量、頻率；已依生物標記與線別過濾；COL-11(1)、COL-11(2)）',
      '<table>' + r + '</table>');
  }

  /* 3d. HIPEC 處方（COL-11(3)） */
  function hipecTable() {
    return foldRx('<b>HIPEC 的實際處方</b>（COL-11(3)）',
      '<table>' +
      '<tr><td>oxaliplatin</td><td>200–460 mg/m²，灌注 30–60 分鐘</td></tr>' +
      '<tr><td>5-FU</td><td>650 mg/m²，灌注 60–120 分鐘</td></tr>' +
      '<tr><td>mitomycin C</td><td>15 mg/m²，灌注 60 分鐘</td></tr>' +
      '<tr><td>cisplatin</td><td>25 mg/m²，灌注 60 分鐘</td></tr>' +
      '<tr><td>irinotecan</td><td>100 mg/m²，灌注 90 分鐘</td></tr>' +
      '</table>');
  }

  /* 3e. 結腸的化放療處方（COL-13；結腸只用在局部不可切除／T4 的轉換治療） */
  function ccrtRxTable() {
    return foldRx('<b>化放療同步的實際處方</b>（COL-13）',
      '<table>' +
      '<tr><td>RT ＋ 口服 fluoropyrimidine</td><td>capecitabine 800–1200 mg/m² 每日兩次、每週 5 天，' +
      '合併 RT × 5 週；或 UFUR 300–350 mg/m²/day、每週 5 天 × 5 週</td></tr>' +
      '<tr><td>RT ＋ 持續輸注 5-FU</td><td>5-FU 225 mg/m²，24 小時輸注，RT 期間每週 5 或 7 天</td></tr>' +
      '<tr><td>RT ＋ 5-FU/leucovorin</td><td>5-FU 400 mg/m² bolus ＋ leucovorin 20 mg/m² bolus，' +
      '於 RT 第 1 與第 5 週各 4 天</td></tr>' +
      '<tr><td>RT ＋ HDFL</td><td>5-FU 400 mg/m² IV push，2400 mg/m² 輸注 48 小時</td></tr>' +
      '</table>');
  }

  /* 3f. IDEA：輔助化療要打 3 個月還是 6 個月（COL-3(2) 註 h） */
  function ideaTable() {
    return fold('<b>3 個月還是 6 個月？</b>IDEA 的結論與神經毒性差異（COL-3(2) 註 h）',
      '<table>' +
      '<tr><td><b>低風險第 III 期</b><br>T1–3 N1</td><td><b>CapeOX 3 個月的無病存活不劣於 6 個月</b>；' +
      'FOLFOX 3 個月對 6 個月的<b>非劣性未獲證實</b> → 想打 3 個月就選 CapeOX</td></tr>' +
      '<tr><td><b>高風險第 III 期</b><br>T4、N1–2、任何 T 且 N2</td><td>' +
      '<b>FOLFOX 3 個月的無病存活劣於 6 個月</b>；CapeOX 3 個月對 6 個月的非劣性未獲證實 → ' +
      '選 FOLFOX 就要打滿 6 個月</td></tr>' +
      '<tr><td>神經毒性的代價</td><td>Grade 3 以上神經毒性：FOLFOX <b>3% vs 16%</b>（3 vs 6 個月）；' +
      'CapeOX <b>3% vs 9%</b></td></tr>' +
      '</table>');
  }

  /* 3g. 健保條文（第 9 節；查詢日 2026-08-16）—— 這一段不掃藥卡 */
  function nhiAdj() {
    return fold('<b>健保怎麼給付輔助化療？</b>（第 9 節條文，查詢日 2026-08-16）',
      '<table>' +
      '<tr><td>oxaliplatin<br>9.10</td><td><b>限「第三期結腸癌（Dukes C）原發腫瘤完全切除手術後的輔助療法」</b>。' +
      '第 II 期不在條文內。</td></tr>' +
      '<tr><td>capecitabine<br>9.17</td><td><b>「第三期結腸癌患者手術後的輔助性療法，以八個療程為限」</b>' +
      '（q3w × 8 ＝ 約 6 個月）。</td></tr>' +
      '<tr><td>UFUR<br>9.11</td><td><b>「直腸癌、結腸癌第 II、III 期患者之術後輔助性治療，使用期限不得超過 2 年」</b>' +
      '—— <b>這是條文裡唯一涵蓋第 II 期的輔助用藥</b>。</td></tr>' +
      '<tr><td>標靶藥</td><td><b>輔助情境完全沒有給付</b>；指引本身也寫「bevacizumab、cetuximab、' +
      'panitumumab、irinotecan 不應用於第 II 或 III 期的輔助治療，臨床試驗除外」（COL-3(1) 註 c）。</td></tr>' +
      '</table>');
  }

  function nhiMeta() {
    return fold('<b>健保怎麼給付轉移性大腸直腸癌？</b>互斥與順序陷阱（第 9 節條文，查詢日 2026-08-16）',
      '<table>' +
      '<tr><td>bevacizumab<br>9.37</td><td><b>第一線</b>：與 FOLFIRI／FOLFOX／5-FU＋leucovorin 併用；' +
      '<b>總療程上限 36 週</b>，事前審查每次 18 週。<b>第二線</b>（Zirabev 除外）：限 RAS 未突變、' +
      '先前用過 fluoropyrimidine ＋ cetuximab 或 panitumumab 無效、<b>且從未用過 bevacizumab</b> 者，' +
      '<b>總療程上限 24 週，劑量限 5 mg/kg q2w</b>。</td></tr>' +
      '<tr><td colspan="2"><b>① bevacizumab 不得與 cetuximab 或 panitumumab 併用</b>（9.37、9.27、9.53 三處都寫）。</td></tr>' +
      '<tr><td>cetuximab 9.27<br>panitumumab 9.53</td><td>限 <b>All-RAS 未突變</b>，需檢附認證實驗室的 All-RAS 基因突變分析報告。' +
      '第一線與 FOLFIRI 或 FOLFOX 併用，每次 18 週。後線限「已接受過含 5-FU、irinotecan、oxaliplatin 之二線以上治療失敗」，' +
      '每次 9 週、<b>總上限 18 週</b>。</td></tr>' +
      '<tr><td colspan="2"><b>② cetuximab 與 panitumumab 只能擇一，終生不得互換。</b></td></tr>' +
      '<tr><td colspan="2"><b>③ 經手術完全切除（R0）且查無轉移病灶者，不得申請 cetuximab／panitumumab</b>' +
      '（2026/02/01 新增）。</td></tr>' +
      '<tr><td>encorafenib<br>9.134</td><td>與 cetuximab 併用作為 <b>BRAF V600E 突變 mCRC 的第二線</b>，要同時符合：' +
      '① 曾用過 bevacizumab ＋ FOLFIRI／FOLFOX／5-FU-leucovorin；② <b>從未用過任何 anti-EGFR 藥品</b>；' +
      '③ ECOG ≤ 2；④ 檢附 BRAF V600E 檢測報告。<b>總療程上限 24 週。</b></td></tr>' +
      '<tr><td colspan="2"><b>④ 用了 encorafenib ＋ cetuximab 之後，不得再申請任何 anti-EGFR 藥品。</b>' +
      '所以 BRAF V600E 的病人，anti-EGFR 這張牌只能打一次，要決定打在哪裡。</td></tr>' +
      '<tr><td>regorafenib 9.51<br>trifluridine ＋ tipiracil 9.66<br>fruquintinib 9.136</td><td>' +
      '三者的給付條件相同：先前用過 fluoropyrimidine、oxaliplatin、irinotecan 為基礎的化療<b>與 anti-VEGF</b>；' +
      '<b>若 RAS 未突變，還要再用過 anti-EGFR</b>。都要檢附 All-RAS 報告、都要事前審查。</td></tr>' +
      '<tr><td colspan="2"><b>⑤ regorafenib 不得與 trifluridine ＋ tipiracil 併用；trifluridine ＋ tipiracil 也不得與 ' +
      'regorafenib 或 fruquintinib 併用。</b>後線三支藥是<b>依序單用</b>，不是疊加。</td></tr>' +
      '<tr><td>pembrolizumab<br>9.69(11)</td><td><b>限 pembrolizumab，用於無法切除或轉移性 MSI-H／dMMR 的第一線</b>' +
      '（2025/06/01 起給付）。給付期限自初次處方起算 <b>2 年</b>，事前審查每次 12 週，需 ECOG ≤ 1。' +
      '大腸直腸癌<b>不需檢附 PD-L1 報告</b>。</td></tr>' +
      '<tr><td colspan="2"><b>⑥ nivolumab、ipilimumab 用於大腸直腸癌不在健保條文內 → 自費</b>' +
      '（9.69 只把大腸直腸癌寫給 pembrolizumab）。</td></tr>' +
      '<tr><td colspan="2"><b>⑦ 9.69 通則：每位病人每個適應症只給付一種免疫檢查點抑制劑、不得互換；' +
      '治療期間不可合併申報該適應症的標靶藥物，「無效後或給付時程期滿後則不再給付該適應症相關之標靶藥物」' +
      '（大腸直腸癌不在除外名單內）。</b>依此條文，MSI-H 病人若先用 pembrolizumab，之後的 bevacizumab、' +
      'cetuximab、panitumumab 將不再給付 —— 第一線就要把整條路想完。</td></tr>' +
      '<tr><td>ramucirumab<br>9.92</td><td><b>健保只給付肝細胞癌</b>，大腸直腸癌不在條文內。' +
      '指引 COL-8(1) 註 g 也寫「台灣核准但病人需自費」。</td></tr>' +
      '<tr><td>ziv-aflibercept</td><td><b>台灣沒有健保給付，台大處方集也沒有這個品項</b>（處方集內的 aflibercept ' +
      '是眼內注射的 Eylea，完全不同的產品）。指引 COL-8(1) 有列，但在台大開不到。</td></tr>' +
      '<tr><td>oxaliplatin<br>9.10</td><td><b>「治療轉移性結腸直腸癌，惟若再加用 irinotecan 則不予給付」</b> —— ' +
      '也就是 <b>FOLFOXIRI／FOLFIRINOX 的 oxaliplatin 不給付</b>。</td></tr>' +
      '<tr><td>All-RAS 檢測</td><td>健保有伴隨式診斷給付碼 <b>30104B</b>（認證實驗室之 All-RAS 基因突變分析），' +
      '為申請 anti-EGFR 的必要附件。</td></tr>' +
      '</table>');
  }

  /* 3h. 追蹤 */
  function followupHTML(kind) {
    if (kind === 'early') {
      return '<div class="fu-label">追蹤原則 · pTis／pT1–2 N0（COL-3(1)）</div><ul class="fu-list">' +
        '<li><b>大腸鏡 1 年後做一次。</b>若有 advanced adenoma → 1 年後再做；沒有 → 3 年後再做，之後每 5 年一次。</li>' +
        '<li>advanced adenoma 指<b>絨毛狀息肉、息肉 &gt; 1 cm、或高度異型增生</b>（COL-3(1) 註 f）。</li>' +
        '<li>這一格<b>不需要規則性的 CT 與 CEA 追蹤</b>。</li></ul>';
    }
    if (kind === 'meta') {
      return '<div class="fu-label">追蹤原則 · 轉移病灶已切除（COL-6、COL-7）</div><ul class="fu-list">' +
        '<li>病史與理學檢查每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年。</li>' +
        '<li><b>CEA 每 3–6 個月一次共 2 年，之後每 6 個月一次共 5 年。</b></li>' +
        '<li><b>胸部／腹部／骨盆 CT 每 3–6 個月一次共 2 年，之後每 6–12 個月一次到滿 5 年。</b></li>' +
        '<li>大腸鏡 1 年後做一次；有 advanced adenoma 則 1 年後再做，沒有則 3 年後再做、之後每 5 年一次。' +
        '若術前因阻塞未能完成大腸鏡，<b>術後 3–6 個月內補做</b>。</li>' +
        '<li><b>不常規安排 PET-CT。</b></li>' +
        '<li>再次復發 → 回步驟 1 選「治療後追蹤發現復發」。</li></ul>';
    }
    if (kind === 'palli') {
      return '<div class="fu-label">追蹤與支持治療（COL-8）</div><ul class="fu-list">' +
        '<li>每 2 個月以影像評估反應與是否轉為可切除；疾病進展就換次線。</li>' +
        '<li>出現腸阻塞、大量出血、穿孔等症狀時，即使是不可切除的病人也要處理原發灶（COL-7）。</li>' +
        '<li>免疫檢查點抑制劑的評估依 i-RECIST；連續兩次評估都是 stable disease 者健保不得續用（9.69）。</li>' +
        '<li>末期病人：安寧緩和照護，照會安寧共同照護團隊。</li></ul>';
    }
    return '<div class="fu-label">追蹤原則 · 第 II／III 期（COL-3(1)、COL-3(2)）</div><ul class="fu-list">' +
      '<li>病史與理學檢查每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年。</li>' +
      '<li><b>CEA 每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年</b>（pT2 以上）。</li>' +
      '<li><b>復發高風險者</b>胸部／腹部／骨盆 CT 每 6–12 個月一次共 5 年。' +
      '這裡的高風險指<b>神經或血管侵犯、或分化不良</b>（COL-3(1) 註 g）。</li>' +
      '<li>大腸鏡 1 年後做一次；有 advanced adenoma 則 1 年後再做，沒有則 3 年後再做、之後每 5 年一次。' +
      '若術前因阻塞未能完成大腸鏡，<b>術後 3–6 個月內補做</b>。</li>' +
      '<li><b>不常規安排 PET-CT。</b></li>' +
      '<li>追蹤中 CEA 上升或影像發現病灶 → 回步驟 1 選「治療後追蹤發現復發」。</li></ul>';
  }

  /* ==========================================================
     4. 版面
     ========================================================== */
  function colonPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院大腸直腸癌診療指引</b>（版次 21，2026/06/16 癌症醫療委員會修訂通過；' +
      '所依據之公開版本為 NCCN colon 2026v1）編成的<b>結腸癌</b>互動決策流程。' +
      '步驟照臨床決策實際發生的先後排：<b>大腸鏡與影像 → 可不可以切、要不要先給藥 → 開完看病理 → ' +
      '要不要輔助化療 → 轉移或復發時怎麼接</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是處方劑量、健保條文與參考資料。' +
      '分期本身（AJCC 第 8 版）另見「分期 TNM」頁籤；<b>直腸癌請在上方切換到「直腸」</b>。</p>';
    h += '<div class="onc-path" id="ccPath">';

    /* 步驟 1 */
    h += node0('cc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'polyp', '大腸鏡切下息肉，病理報告是侵襲癌', 'malignant polyp（pT1）—— 要決定觀察還是追加手術') +
      opt('scope', 'm0', '已確診結腸腺癌，影像沒有遠處轉移（M0）', '從「可不可以切」開始') +
      opt('scope', 'm1', '已有遠處轉移（M1）', '同時性轉移，或初診斷就是第 IV 期') +
      opt('scope', 'recur', '治療後追蹤發現復發', 'CEA 上升，或影像／切片證實的異時性轉移'));

    /* ── A. 惡性息肉（COL-1、COL-1-1）── */
    h += '<div id="cc_b_polyp" class="hidden">';
    h += node('cc_n_pmar', '2', '內視鏡切除標本的切緣與完整度？（COL-1、COL-1-1）',
      opt('pmar', 'clear', '單一標本完整切除，而且切緣乾淨', '乾淨切緣的定義是「距腫瘤 &gt; 1 mm」（COL-1-1 註 a）') +
      opt('pmar', 'bad', '切緣陽性、標本破碎、或切緣無法評估', ''),
      fold('內視鏡切下來的標本要怎麼送？（COL-1-2）',
        '<ul class="rec-sub"><li>用不鏽鋼針<b>撐開釘在硬板上</b>，保持標本原本的邊界，並標示口側與肛側。</li>' +
        '<li>切片方向必須<b>垂直於切除面</b>，才能正確判讀侵犯深度與切緣。</li>' +
        '<li>通常<b>整個病灶以 2 mm 間隔連續切片</b>。</li>' +
        '<li>病理報告要涵蓋：組織型別、grade、侵犯深度、angiolymphatic invasion、切緣（COL-1 註 c）。</li></ul>'));
    h += node('cc_n_pfeat', '3', '病理有沒有下面任何一項不良特徵？（COL-1、COL-1-1）',
      opt('pfeat', 'fav', '完全沒有，全部都是良好特徵', 'Haggitt level ≤ 3 且黏膜下侵犯 ≤ 1 mm、grade 1–2、Ly(−)V(−)、tumor budding G1') +
      opt('pfeat', 'unfav', '有其中任何一項', '只要一項就算不良'),
      fold('<b>這裡的「不良特徵」到底是哪幾項？</b>（COL-1 的高風險清單 ＋ COL-1-1 的四條軸）',
        '<table>' +
        '<tr><td>侵犯深度</td><td><b>Haggitt level 4</b>，或<b>黏膜下侵犯 &gt; 1 mm</b>' +
        '（有柄型用 Haggitt 分級；無柄型看侵犯深度，&lt; 1 mm 才算良好）</td></tr>' +
        '<tr><td>分化程度</td><td><b>Grade 3 或 4</b>（分化不良或未分化）</td></tr>' +
        '<tr><td>脈管侵犯</td><td><b>lymphatic 或 vascular invasion 陽性</b></td></tr>' +
        '<tr><td>tumor budding</td><td><b>G2 或 G3</b>（高度）</td></tr>' +
        '<tr><td>神經周圍侵犯</td><td><b>perineural invasion 陽性</b></td></tr>' +
        '<tr><td>切緣</td><td><b>切緣陽性或 &lt; 1 mm</b></td></tr>' +
        '<tr><td>切除方式</td><td><b>分塊切除</b>（piecemeal removal）</td></tr>' +
        '</table>'));
    h += node('cc_n_pshape', '4', '這顆息肉是什麼形態？（COL-1）',
      opt('pshape', 'ped', '有柄型 pedunculated polyp', '') +
      opt('pshape', 'ses', '無柄型 sessile polyp', ''));
    h += recBox('cc_r_polyp', '建議處置 · 惡性息肉');
    h += fuBox('cc_f_polyp');
    h += '</div>';

    /* ── B. 已確診、無遠處轉移（COL-2）── */
    h += '<div id="cc_b_m0" class="hidden">';
    h += node('cc_n_pres', '2', '影像與大腸鏡評估後，這個腫瘤屬於哪一種？（COL-2）',
      opt('pres', 'nonobs', '可以切除，而且沒有阻塞', '') +
      opt('pres', 'obs', '可以切除，但有阻塞', '') +
      opt('pres', 't4b', '臨床 T4b（侵犯或黏連鄰近器官）', '') +
      opt('pres', 'unres', '局部無法切除，或病人無法耐受手術', ''),
      fold('<b>開刀前要做完的檢查</b>（COL-2）—— 打★的是決定臨床分期、治療前必須完成的',
        '<ul class="rec-sub">' +
        '<li><b>★ 大腸鏡</b>（大腸鏡不完全時做下消化道攝影）</li>' +
        '<li><b>★ 胸部／腹部／骨盆 CT</b>：靜脈或口服顯影劑。若 CT 顯影不足或對顯影劑有禁忌，' +
        '改用腹部／骨盆 MRI 加非顯影胸部 CT</li>' +
        '<li>切片、<b>MMR</b>、病理複閱、CBC、生化、<b>CEA</b></li>' +
        '<li>考慮腹部／骨盆 MRI —— <b>低位乙狀結腸的腫瘤要用 MRI 分清楚是結腸癌還是直腸癌</b>' +
        '（直腸的定義是薦岬到恥骨聯合上緣的虛擬連線以下）</li>' +
        '<li><b>造口治療師術前定位與衛教</b></li>' +
        '<li><b>PET-CT 不列為常規</b>：不能取代顯影 CT，只用在顯影 CT 有疑義、或對顯影劑有強烈禁忌時</li>' +
        '<li>適當病人討論生育功能保存</li>' +
        '<li><b>所有大腸癌病人都要做家族史諮詢</b>（COL-2 註 a）</li></ul>'));
    h += recBox('cc_r_pres', '建議處置 · 原發腫瘤要怎麼處理');
    h += '</div>';

    /* ── 共用：術後病理 → 輔助治療（COL-3）── */
    h += '<div id="cc_b_adj" class="hidden">';
    h += node('cc_n_ptn', '3', '術後病理落在哪一格？（點 pT 與 pN 的交會格；COL-3(1)、COL-3(2)、COL-17）', '',
      '<div id="cc_ptn_hold"></div>');
    h += node('cc_n_mmr', '4', 'MMR／MSI 的結果是哪一種？（COL-3(1) 註 a）',
      opt('mmr', 'dmmr', 'dMMR 或 MSI-H', '錯誤配對修復功能不足／高度微衛星不穩定') +
      opt('mmr', 'pmmr', 'pMMR 或 MSS', '修復功能正常／微衛星穩定'));
    h += node('cc_n_hrisk', '5', '有沒有下面任何一項高風險特徵？（COL-3(1)）',
      opt('hrisk', 'no', '一項都沒有', '') +
      opt('hrisk', 'yes', '有其中任何一項', ''),
      '<div class="note"><b>第 II 期的全身性復發高風險特徵（COL-3(1) 原文七項）：</b>' +
      HR_ITEMS.join('、').replace(/<\/?b>/g, '') + '。</div>');
    h += recBox('cc_r_adj', '建議處置 · 術後輔助治療');
    h += fuBox('cc_f_adj');
    h += '</div>';

    /* ── C. 轉移性（COL-4）── */
    h += '<div id="cc_b_m1" class="hidden">';
    h += node('cc_n_msite', '2', '轉移分布在哪裡？（COL-4）',
      opt('msite', 'liverlung', '只有肝臟轉移，或只有肺臟轉移', '這一格是唯一有機會根治的轉移型態') +
      opt('msite', 'periton', '同時性腹腔／腹膜轉移', '') +
      opt('msite', 'other', '其他部位的同時性不可切除轉移', ''),
      fold('<b>轉移性病人開始治療前要驗的東西</b>（COL-4）—— 打★的是治療前必須完成的',
        '<ul class="rec-sub">' +
        '<li><b>★ 大腸鏡、★ 胸部／腹部／骨盆 CT</b>（靜脈顯影）</li>' +
        '<li><b>腫瘤基因：RAS 與 BRAF ± HER2 amplification</b>（單獨檢測或包在 NGS 內）</li>' +
        '<li><b>MMR 或 MSI 狀態</b>（若之前沒驗過）</li>' +
        '<li>CBC、生化、<b>CEA</b>；臨床有需要就切片</li>' +
        '<li>選擇性手術可根治的病人，考慮 <b>PET-CT（顱底到大腿中段）</b></li>' +
        '<li>肝轉移有機會切除者，<b>考慮肝臟 MRI</b></li>' +
        '<li><b>多專科團隊評估，而且要有做過肝膽與肺轉移切除的外科醫師參與</b></li>' +
        '<li>指引註記「基因檢測未納入健保給付」（COL-4 註 c）；但<b>申請 anti-EGFR 所需的 All-RAS 檢測' +
        '另有伴隨式診斷給付碼 30104B</b>，查詢日 2026-08-16。</li></ul>'));
    h += node('cc_n_mres', '3', '肝／肺轉移的可切除性？（COL-4）',
      opt('mres', 'res', '可以切除', '→ COL-6') +
      opt('mres', 'unres', '目前不可切除', '有機會轉換，或無法轉換 → COL-7'));
    h += node('cc_n_pperi', '3', '腹膜轉移的病人現在是哪一種狀況？（COL-5）',
      opt('pperi', 'nonobs', '沒有阻塞', '') +
      opt('pperi', 'obs', '有阻塞或即將阻塞', '') +
      opt('pperi', 'peri', '只有腹膜轉移，沒有其他遠處轉移', ''));
    h += recBox('cc_r_msite', '建議處置 · 轉移的局部處置');
    h += fuBox('cc_f_msite');
    h += '</div>';

    /* ── D. 復發（COL-9）── */
    h += '<div id="cc_b_recur" class="hidden">';
    h += node('cc_n_rentry', '2', '復發是怎麼被發現的？（COL-9）',
      opt('rentry', 'cea', 'CEA 連續上升，但還沒找到病灶', '') +
      opt('rentry', 'doc', '影像或切片已經證實的異時性轉移', ''));
    h += node('cc_n_rres', '3', '這個異時性轉移可不可以切除？（COL-9）',
      opt('rres', 'res', '可以切除', '') +
      opt('rres', 'unres', '不可切除', '有機會轉換，或無法轉換'));
    h += node('cc_n_rprior', '4', '<b>過去 12 個月內</b>有沒有用過 FOLFOX 或 CAPEOX？（COL-9）',
      opt('rprior', 'no', '沒有', '') +
      opt('rprior', 'yes', '有', ''));
    h += recBox('cc_r_recur', '建議處置 · 復發');
    h += fuBox('cc_f_recur');
    h += '</div>';

    /* ── 共用：全身性治療（COL-8）── */
    h += '<div id="cc_b_sys" class="hidden">';
    h += node('cc_n_bio', '4', '生物標記的結果是哪一種？（COL-4、COL-8）',
      opt('bio', 'msi', 'dMMR 或 MSI-H', '不論 RAS／BRAF —— 這一格的治療完全不一樣') +
      opt('bio', 'wt', 'pMMR／MSS，RAS 與 BRAF 都沒有突變', 'All-RAS wild-type、BRAF wild-type') +
      opt('bio', 'ras', 'pMMR／MSS，RAS 有突變', 'KRAS exon 2 或 non-exon 2、或 NRAS') +
      opt('bio', 'braf', 'pMMR／MSS，BRAF V600E 突變', ''));
    h += node('cc_n_fit', '5', '病人能不能耐受 intensive therapy？（COL-8）',
      opt('fit', 'yes', '可以', '走 COL-8(1)／COL-8(2)') +
      opt('fit', 'no', '不行', '走 COL-8(3)：先用低強度，體能改善再升階'));
    h += node('cc_n_line', '6', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', '') +
      opt('line', 'l3', '第二次進展之後', '') +
      opt('line', 'l4', '第三次進展之後', ''));
    h += recBox('cc_r_sys', '建議處置 · 全身性治療');
    h += fuBox('cc_f_sys');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="ccReset()">重置</button></div>';
    h += '</div>';
    /* 這兩個區塊刻意放在 #ccPath 之外：流程圖每次點選都會重寫建議框的 innerHTML，
       藥卡若放在裡面，使用者展開的卡會被銷毀重建、收起來。 */
    h += '<div class="bc-gene hidden" id="cc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="cc_drugs"></div>';
    /* 補充參考面板（院外實證，預設全部收合）—— 結腸與直腸共用，見 js/crc-supplement.js */
    h += (typeof crcSupplementHTML === 'function') ? crcSupplementHTML() : '';
    return h;
  }

  /* ==========================================================
     5. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  /* 共用節點在不同分支的步驟編號不同，render 時改寫 */
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }

  /* 先把整個流程關到只剩步驟 1，再由分支逐層打開。
     這是「沒選之前不出現」的唯一保證，不要在別處另外開關。 */
  function collapseAll() {
    var root = el('ccPath');
    if (!root) return;
    root.querySelectorAll('.cc-node').forEach(function (n) {
      if (n.id !== 'cc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['cc_b_polyp', 'cc_b_m0', 'cc_b_adj', 'cc_b_m1', 'cc_b_sys', 'cc_b_recur']
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

  /* ---------- A. 惡性息肉 ---------- */
  function renderPolyp() {
    show('cc_b_polyp', true);
    show('cc_n_pmar', true);
    if (!S.pmar) return;

    if (S.pmar === 'bad') {
      fill('cc_r_polyp', 'rec-elective',
        '切緣陽性、標本破碎或無法評估<br>→ 做完分期檢查後追加結腸切除', [
        H('要做的事', 'COL-1'),
        '<b>先做分期檢查</b>：CBC、生化、<b>CEA</b>、<b>胸部／腹部／骨盆 CT</b>；' +
          '低位乙狀結腸的病灶<b>考慮骨盆 MRI</b>，以區分是結腸癌還是直腸癌。',
        '<b>接著做結腸切除併區域淋巴結整塊切除</b>（colectomy with en bloc removal of regional lymph nodes）。',
        EV('切緣沒有辦法判定、或標本破碎，就等於「不知道切乾淨了沒有」。' +
          '這種情況下觀察不是選項，因為殘存病灶與淋巴結轉移都無法排除。'),
        H('之後怎麼接', 'COL-3'),
        '<b>手術後依病理走輔助治療的判斷</b> —— 下面的步驟 3 會出現 pT×pN 格。'
      ], 'COL-1（惡性息肉的處置）、COL-1-1（pT1 的病理分流）。', null);
      show('cc_b_adj', true);
      setNum('cc_n_ptn', '3');
      renderAdjGrid('3');
      return;
    }

    show('cc_n_pfeat', true);
    if (!S.pfeat) return;

    if (S.pfeat === 'unfav') {
      fill('cc_r_polyp', 'rec-elective',
        '切緣乾淨，但有不良或高風險特徵<br>→ 個案評估是否追加結腸切除', [
        H('指引的原文寫法', 'COL-1、COL-1-1'),
        '<b>COL-1-1 寫的是「consider additional surgery case by case」</b> —— ' +
          '不是一律開刀，也不是一律觀察，要逐案討論。',
        '<b>COL-1 則把有高風險特徵者直接排到「分期檢查 → 結腸切除併區域淋巴結整塊切除」。</b>' +
          '兩頁的語氣不同，實務上<b>建議提到多專科團隊討論</b>。',
        H('討論時要放進去秤的東西', ''),
        EV('往開刀那邊傾斜的：<b>切緣 &lt; 1 mm、Haggitt level 4、黏膜下侵犯 &gt; 1 mm、' +
          'lymphatic 或 vascular invasion、tumor budding G2/G3、grade 3–4</b> —— ' +
          '這幾項與殘存病灶及淋巴結轉移風險有關。'),
        EV('往觀察那邊傾斜的：<b>手術風險高、年紀大、只有單一項不良特徵、腫瘤位置切除代價大' +
          '（例如需要做造口）</b>。'),
        H('先做的檢查', 'COL-1'),
        '不論最後怎麼決定，<b>CBC、生化、CEA、胸部／腹部／骨盆 CT 都要先做</b>；' +
          '低位乙狀結腸的病灶考慮骨盆 MRI。',
        H('如果決定開刀', 'COL-3'),
        '術後依病理走輔助治療的判斷 —— 下面的步驟 4 會出現 pT×pN 格。'
      ], 'COL-1（惡性息肉）、COL-1-1（pT1 的四條病理軸）。', null);
      show('cc_b_adj', true);
      setNum('cc_n_ptn', '4');
      renderAdjGrid('4');
      return;
    }

    show('cc_n_pshape', true);
    if (!S.pshape) return;

    if (S.pshape === 'ped') {
      fill('cc_r_polyp', 'rec-nonop',
        '有柄型、切緣乾淨、病理良好<br>→ 觀察即可，不需要追加手術', [
        H('處置', 'COL-1、COL-1-1'),
        '<b>觀察（observe），不需要追加結腸切除。</b>',
        '<b>依大腸鏡追蹤時程回診</b>（見下方追蹤原則）。',
        EV('有柄型的癌細胞要越過的距離比較長，只要 Haggitt level ≤ 3、切緣乾淨、' +
          '沒有脈管侵犯與高度 budding，殘存病灶與淋巴結轉移的機率很低。'),
        H('要注意的一件事', 'COL-1 註 g'),
        EV('指引特別註明：選擇觀察時要理解 —— <b>相較於有柄型的惡性息肉，' +
          '非息肉樣（無柄／平坦）的惡性病灶其殘存病灶、復發、死亡與血行轉移的不良結果明顯較多</b>' +
          '（<b>但淋巴結轉移不在其中</b>）。這句話是用來提醒「形態本身就是風險因子」。')
      ], 'COL-1（有柄型 → observe）、COL-1-1（切緣陰性且四條軸都良好 → follow-up）。', null);
      fu('cc_f_polyp', 'early');
      return;
    }

    fill('cc_r_polyp', 'rec-elective',
      '無柄型、切緣乾淨、病理良好<br>→ 觀察或追加結腸切除，兩條都在指引內', [
      H('指引把兩條路並列', 'COL-1'),
      '<b>① 觀察（observe）</b>，或 <b>② 結腸切除併區域淋巴結整塊切除</b>。',
      '<b>先和病人討論，不要預設哪一條。</b>',
      H('為什麼無柄型多一個選項', 'COL-1 註 g'),
      '<b>非息肉樣（無柄／平坦）的惡性病灶，殘存病灶、復發、死亡與血行轉移明顯較多</b> —— ' +
        '這是指引明講的差別；<b>但淋巴結轉移的機率並沒有比較高</b>。',
      EV('也就是說，追加手術的理由主要是「怕原地還有殘存病灶」，而不是「怕淋巴結」。' +
        '這會影響討論的方向：如果內視鏡切除的完整度很有把握，觀察就比較站得住腳。'),
      H('如果決定開刀', 'COL-3'),
      '術後依病理走輔助治療的判斷 —— 下面的步驟 5 會出現 pT×pN 格。'
    ], 'COL-1（無柄型 → observe or colectomy）、COL-1 註 g。', null);
    show('cc_b_adj', true);
    setNum('cc_n_ptn', '5');
    renderAdjGrid('5');
    fu('cc_f_polyp', 'early');
  }

  /* ---------- B. 已確診、無遠處轉移 ---------- */
  function renderM0() {
    show('cc_b_m0', true);
    show('cc_n_pres', true);
    if (!S.pres) return;

    var L = [], cls = 'rec-elective', title = '', extra = null;

    if (S.pres === 'nonobs') {
      title = '可切除、無阻塞<br>→ 結腸切除併區域淋巴結整塊切除';
      L.push(H('手術', 'COL-2'));
      L.push('<b>Colectomy with en bloc removal of regional lymph nodes</b>（結腸切除併區域淋巴結整塊切除）。');
      L.push('<b>淋巴結至少要檢出 12 顆</b>才能可靠分期。');
      L.push(EV('檢出 &lt; 12 顆本身就是第 II 期的全身性復發高風險特徵（COL-3(1)）。' +
        '病理報告若是 pN0 但顆數不足，應請病理科重新檢查檢體找更多淋巴結。'));
    } else if (S.pres === 'obs') {
      title = '可切除、但有阻塞<br>→ 四種術式都在指引內，依病人狀況選';
      L.push(H('四個並列的選項', 'COL-2'));
      L.push('<b>① 一次手術完成切除併區域淋巴結整塊切除</b>（one-stage colectomy）');
      L.push('<b>② 切除併轉流</b>（resection with diversion）');
      L.push('<b>③ 只做轉流</b>（diversion）');
      L.push('<b>④ 支架</b>（stent，選擇性病例）');
      L.push(EV('指引把四個並列、沒有排優先序。實務上決定因素是<b>病人的血行動力學是否穩定、' +
        '腸道有無擴張與缺血、以及是否有足夠的術前準備時間</b>。' +
        '選 ③ 或 ④ 的病人，之後仍要回來做根治性切除。'));
      L.push(H('之後怎麼接', 'COL-2'));
      L.push('選 ③ 轉流或 ④ 支架者，<b>後續仍要做結腸切除併區域淋巴結整塊切除</b>再進入輔助治療的判斷。');
    } else if (S.pres === 't4b') {
      cls = 'rec-elective';
      title = '臨床 T4b（侵犯或黏連鄰近器官）<br>→ 考慮先給術前化療，再切除';
      L.push(H('指引的建議', 'COL-2'));
      L.push('<b>考慮新輔助化療 FOLFOX 或 CapeOx</b>，之後再做結腸切除併區域淋巴結整塊切除。');
      L.push(EV('T4b 直接開刀很容易切不乾淨（R1／R2）。先縮小腫瘤與周邊發炎反應，' +
        '整塊切除的成功率比較高。指引用的是「consider」，不是強制。'));
      L.push(H('放射治療的角色', 'COL-14'));
      L.push('<b>結腸癌的放射治療只在一種情況下考慮</b>：' +
        '「initially unresectable／borderline resectable，或無法耐受手術的非轉移性 T4 結腸癌」。');
      L.push(EV('也就是說 —— <b>可以切的 T4b 不需要放射治療，先化療就好</b>；' +
        '放射治療是留給切不下來的。這和直腸癌完全不同。'));
      extra = more(adjRxTable(true));
    } else {
      cls = 'rec-urgent';
      title = '局部無法切除，或無法耐受手術<br>→ 先做全身治療或化放療，再評估能不能轉成可切除';
      L.push(H('第一步', 'COL-2'));
      L.push('<b>全身性治療</b>，或 <b>持續輸注 5-FU ＋ 放射治療</b>，或 <b>capecitabine ＋ 放射治療</b>。');
      L.push(H('放射治療在結腸癌的唯一適應症', 'COL-14'));
      L.push('<b>「initially unresectable／borderline resectable，或無法耐受手術的非轉移性 T4 結腸癌」' +
        '—— 這是 COL-14 給結腸癌的全部內容</b>，其餘的放射治療適應症都是寫給直腸癌的。');
      L.push(H('接下來', 'COL-2'));
      L.push('<b>重新評估能不能轉成可切除</b>（re-evaluation for conversion to resectable disease）。');
      L.push('轉成可切除 → <b>手術 ± 全身性治療</b>。');
      L.push('仍然不可切除 → 走 <b>COL-8 的全身性治療</b>（回步驟 1 選「已有遠處轉移」' +
        '會走到同一份治療菜單，但那裡的內容是為轉移性寫的，這一格請以緩解症狀為目標）。');
      L.push(EV('緩和性治療可以包含：出血無法控制時的放射治療、阻塞時放支架、支持性照護（COL-2 註 f）。'));
      extra = more(ccrtRxTable(), nhiMeta());
    }

    fill('cc_r_pres', cls, title, L, 'COL-2（可切除性與原發腫瘤處置）、COL-14（放射治療適應症）。', extra);

    /* 走到手術的三條路 → 術後病理 */
    if (S.pres === 'unres') return;
    show('cc_b_adj', true);
    setNum('cc_n_ptn', '3');
    renderAdjGrid('3');
  }

  /* ---------- 共用：術後病理 pT×pN → 輔助治療 ---------- */
  function renderAdjGrid(baseNum) {
    var n = parseInt(baseNum, 10);
    show('cc_n_ptn', true);
    var hold = el('cc_ptn_hold');
    if (hold) {
      /* ⚠ .tn-cap 有 text-transform:uppercase —— 拉丁字會被全大寫（pTis 會變成 PTIS），
         所以 caption 只放中文短標，臨床字串一律放到格子下方的 note。 */
      hold.innerHTML = '<div class="tn-cap">術後病理分期</div>' +
        gridHTML('cc_ptnc', 'ptn', PN_COLS, PT_ROWS, ptnGroup, PTN_LEGEND,
          '<b>pTis（原位癌／黏膜內癌）不會有淋巴結轉移</b>，切除就完成治療、不需要輔助化療' +
          '（COL-3(1)），所以沒有放進格子裡。' +
          '<b>這裡的顏色代表「輔助治療的決策分組」，不是嚴重度。</b>' +
          '<b>pN1 包含 N1c</b>（沒有淋巴結轉移，但漿膜下、腸繫膜或非腹膜化的結腸旁組織有腫瘤沉積）。' +
          '第 II 期（T3–4 N0）那兩格還要再看 MMR 與高風險特徵才會有答案，所以另外分色。');
      if (S.ptn) {
        var b = el('cc_ptnc_' + S.ptn);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.ptn) return;

    var p = ptnParts();

    if (p.g === 'none') { renderAdjNone(); return; }
    if (p.g === 'low' || p.g === 'high') { renderAdjStage3(p.g); return; }

    /* 第 II 期：先問 MMR */
    setNum('cc_n_mmr', String(n + 1));
    show('cc_n_mmr', true);
    if (!S.mmr) return;
    if (S.mmr === 'dmmr') { renderAdjMsi(); return; }

    /* pMMR：T4N0 直接落在高風險臂，不必再問（COL-3(1) 把 T4N0 MSS 排在同一列）*/
    if (p.t === 't4') { renderAdjStage2(true); return; }

    setNum('cc_n_hrisk', String(n + 2));
    show('cc_n_hrisk', true);
    if (!S.hrisk) return;
    renderAdjStage2(S.hrisk === 'yes');
  }

  function renderAdjNone() {
    fill('cc_r_adj', 'rec-nonop', ptnName() + '<br>→ 不需要輔助化療', [
      H('處置', 'COL-3(1)'),
      '<b>手術已經完成治療，輔助治療欄位寫的是 None。</b>',
      '<b>接下來只要做大腸鏡追蹤</b>（見下方追蹤原則）。',
      EV('這一格（Tis、T1N0、T2N0）復發率低，化療的絕對獲益小到不值得承受毒性。')
    ], 'COL-3(1)（Tis；T1,N0,M0；T2,N0,M0 → None）。', null);
    fu('cc_f_adj', 'early');
  }

  function renderAdjMsi() {
    fill('cc_r_adj', 'rec-nonop',
      ptnName() + '，dMMR／MSI-H<br>→ 不需要輔助化療', [
      H('處置', 'COL-3(1)'),
      '<b>T3–4 N0 M0 而且是 MSI-H 或 dMMR → 輔助治療欄位寫的是 None。</b>',
      H('為什麼不給', 'COL-3(1) 註 a'),
      '<b>第 II 期的 MSI-H 病人預後好，而且不會從 ' + NR('5-FU') + ' 的輔助治療得到好處。</b>',
      EV('這是把 MMR 排在輔助治療決策前面的唯一理由 —— 它會直接把一個「本來要考慮化療」的病人' +
        '變成「不用化療」。所以 COL-3(1) 註 a 才寫「所有 &lt; 70 歲的病人都應該考慮做 MMR 檢測」。'),
      EV('注意這一條<b>只適用於第 II 期</b>。第 III 期（有淋巴結轉移）不論 MMR 如何都要輔助化療。'),
      H('不建議做的事', 'COL-3(1) 註 a'),
      '<b>指引明講「目前的資料不足以建議用多基因套組（multi-gene assay panel）來決定輔助治療」。</b>'
    ], 'COL-3(1)（T3-4, N0, M0 (MSI-H or dMMR) → None）、COL-3(1) 註 a、COL-18。', null);
    fu('cc_f_adj', 'std');
  }

  function renderAdjStage2(highRisk) {
    var L = [], title, cls;
    if (!highRisk) {
      cls = 'rec-elective';
      title = 'pT3N0，pMMR／MSS，沒有高風險特徵<br>→ 觀察，或給單方 fluoropyrimidine';
      L.push(H('指引把兩條路並列', 'COL-3(1)'));
      L.push('<b>① 觀察（observation）</b>，或 <b>② 考慮 capecitabine，或 5-FU/leucovorin</b>。');
      L.push('<b>不加 ' + NR('oxaliplatin') + '。</b>');
      L.push(EV('COL-3(1) 註 d 明講：<b>「第 II 期結腸癌在 5-FU/leucovorin 上加 oxaliplatin，' +
        '存活的好處並未被證實」</b>。所以這一格即使要給藥也是單方。'));
      L.push(H('決定的方向', ''));
      L.push('<b>沒有高風險特徵的第 II 期，化療的絕對獲益只有幾個百分點</b>，' +
        '要和病人討論年齡、共病與意願再決定。');
    } else {
      cls = 'rec-elective';
      title = (S.ptn === 't4_n0' ? 'pT4N0' : 'pT3N0 且有高風險特徵') +
        '，pMMR／MSS<br>→ 四個選項並列，一般以 oxaliplatin 為主的合併處方為主';
      L.push(H('指引列的四個選項', 'COL-3(1)'));
      L.push('<b>① 5-FU/leucovorin ± oxaliplatin（FOLFOX）</b>');
      L.push('<b>② capecitabine ± oxaliplatin（CapeOX）</b>');
      L.push('<b>③ 臨床試驗</b>');
      L.push('<b>④ 觀察</b>');
      L.push(EV('四個並列、沒有排序 —— 這代表<b>指引本身並不認為高風險第 II 期一定要化療</b>，' +
        '「觀察」還留在選項裡。'));
      L.push(H(S.ptn === 't4_n0' ? '這一格為什麼算高風險' : '符合的是哪一項', 'COL-3(1)'));
      if (S.ptn === 't4_n0') {
        L.push('<b>T4N0 且 pMMR／MSS，COL-3(1) 直接把它和「T3N0 高風險」排在同一列</b>，' +
          '不需要再另外找高風險特徵。');
      } else {
        L.push('<b>第 II 期的全身性復發高風險特徵（七項，符合任一項即是）：</b>' + hrFeatureList());
      }
      L.push(H('T4 還要多想一件事', 'COL-3(1) 註 b'));
      L.push('<b>T4 且已侵犯到固定構造者，考慮放射治療。</b>');
    }

    L.push(H('不論選哪一條，都適用的三件事', 'COL-3(1)'));
    L.push('<b>沒有禁忌就在術後 6 週內開始輔助化療。</b>');
    L.push('<b>' + NR('bevacizumab、cetuximab、panitumumab、irinotecan') + ' 不可以用在輔助情境</b>（臨床試驗除外；註 c）。');
    L.push('<b>年齡 ≥ 70 歲者加 ' + NR('oxaliplatin') + ' 的好處未獲證實</b>（註 e）。');

    fill('cc_r_adj', cls, title, L,
      'COL-3(1)（第 II 期的分層與四個選項）、註 b（T4 的放射治療）、註 c（輔助禁用標靶）、' +
      '註 d（第 II 期加 oxaliplatin 未證實）、註 e（≥ 70 歲）。',
      more(adjRxTable(highRisk), nhiAdj()));
    fu('cc_f_adj', 'std');
  }

  function renderAdjStage3(g) {
    var L = [], title, cls;
    if (g === 'low') {
      cls = 'rec-elective';
      title = ptnName() + '（低風險第 III 期）<br>→ CapeOX 3 個月，或 FOLFOX 3–6 個月';
      L.push(H('優先選項', 'COL-3(2)'));
      L.push('<b>CapeOX 3 個月</b>，或 <b>FOLFOX 3–6 個月</b>。');
      L.push(H('其他選項', 'COL-3(2)'));
      L.push('<b>capecitabine 6 個月</b>，或 <b>5-FU 6 個月</b>（不能用 oxaliplatin 時）。');
      L.push(H('3 個月還是 6 個月？', 'COL-3(2) 註 h'));
      L.push('<b>想打 3 個月就選 CapeOX</b> —— CapeOX 3 個月的無病存活不劣於 6 個月；' +
        '<b>FOLFOX 3 個月對 6 個月的非劣性並未被證實</b>。');
      L.push(EV('低風險第 III 期定義為 <b>T1–3 N1</b>。Grade 3 以上神經毒性 3 個月對 6 個月：' +
        'CapeOX 3% vs 9%、FOLFOX 3% vs 16% —— 這是選 3 個月最實際的理由。'));
    } else {
      cls = 'rec-urgent';
      title = ptnName() + '（高風險第 III 期）<br>→ CapeOX 3–6 個月，或 FOLFOX 打滿 6 個月';
      L.push(H('優先選項', 'COL-3(2)'));
      L.push('<b>CapeOX 3–6 個月</b>，或 <b>FOLFOX 6 個月</b>。');
      L.push(H('其他選項', 'COL-3(2)'));
      L.push('<b>capecitabine 6 個月</b>，或 <b>5-FU 6 個月</b>。');
      L.push(H('這一格為什麼不能只打 3 個月', 'COL-3(2) 註 h'));
      L.push('<b>FOLFOX 3 個月的無病存活「劣於」6 個月</b> —— 選 FOLFOX 就要打滿 6 個月。' +
        'CapeOX 3 個月對 6 個月的非劣性在這一格<b>同樣未獲證實</b>。');
      L.push(EV('高風險第 III 期定義為 <b>T4、或 N1–2 合併 T4、或任何 T 且 N2（≥ 4 顆）</b>。'));
    }
    L.push(H('不論選哪一條，都適用的三件事', 'COL-3(1)'));
    L.push('<b>沒有禁忌就在術後 6 週內開始輔助化療。</b>');
    L.push('<b>' + NR('bevacizumab、cetuximab、panitumumab、irinotecan') + ' 不可以用在輔助情境</b>（臨床試驗除外；註 c）。');
    L.push('<b>年齡 ≥ 70 歲者加 ' + NR('oxaliplatin') + ' 的好處未獲證實</b>（註 e）。');

    fill('cc_r_adj', cls, title, L,
      'COL-3(2)（第 III 期的分層與療程）、註 h（IDEA）、COL-3(1) 註 c／註 e、COL-10（處方）。',
      more(ideaTable(), adjRxTable(true), nhiAdj()));
    fu('cc_f_adj', 'std');
  }

  /* ---------- C. 轉移性 ---------- */
  function renderM1() {
    show('cc_b_m1', true);
    show('cc_n_msite', true);
    if (!S.msite) return;

    if (S.msite === 'other') {
      fill('cc_r_msite', 'rec-nonop',
        '其他部位的同時性不可切除轉移<br>→ 直接走全身性治療', [
        H('處置', 'COL-4'),
        '<b>COL-4 把這一格直接接到 COL-8 的全身性治療。</b>',
        '<b>原發灶原則上不切</b>，除非有立即的阻塞風險、明顯出血、穿孔，或其他明顯的腫瘤相關症狀（COL-7）。',
        EV('這一格沒有根治的機會，開刀只會延遲全身性治療的開始。' +
          '例外都是「不處理會馬上出事」的情況。'),
        H('下一步', ''),
        '<b>下面的步驟 3 開始決定要用什麼藥。</b>'
      ], 'COL-4（同時性不可切除轉移 → COL-8）、COL-7（原發灶何時要切）。', null);
      showSys('3');
      return;
    }

    if (S.msite === 'periton') {
      show('cc_n_pperi', true);
      setNum('cc_n_pperi', '3');
      if (!S.pperi) return;
      renderPeri();
      return;
    }

    show('cc_n_mres', true);
    setNum('cc_n_mres', '3');
    if (!S.mres) return;
    if (S.mres === 'res') { renderLiverLungRes(); return; }
    renderLiverLungUnres();
  }

  function renderPeri() {
    var L = [], cls, title, extra = null;
    if (S.pperi === 'nonobs') {
      cls = 'rec-nonop';
      title = '腹膜轉移、沒有阻塞<br>→ 直接走全身性治療';
      L.push(H('處置', 'COL-5'));
      L.push('<b>COL-5 把「非阻塞」這一格直接接到 COL-8 的全身性治療</b>，不先開刀。');
      L.push(EV('腹膜轉移的原發灶只要沒有阻塞，切了也不會改善存活。'));
      L.push(H('下一步', ''));
      L.push('<b>下面的步驟 4 開始決定要用什麼藥。</b>');
    } else if (S.pperi === 'obs') {
      cls = 'rec-urgent';
      title = '腹膜轉移、有阻塞或即將阻塞<br>→ 先解決阻塞，再走全身性治療';
      L.push(H('四個並列的選項', 'COL-5'));
      L.push('<b>① 結腸切除</b>　<b>② 轉流造口</b>（diverting ostomy）　' +
        '<b>③ 繞道</b>（bypass of impending obstruction）　<b>④ 支架</b>');
      L.push('<b>處理完阻塞之後接 COL-8 的全身性治療。</b>');
      L.push(EV('這一格的手術目的是<b>維持腸道通暢，讓化療能夠開始</b>，不是根治。' +
        '選擇哪一種取決於阻塞的位置與病人的體能。'));
      L.push(H('下一步', ''));
      L.push('<b>下面的步驟 4 開始決定要用什麼藥。</b>');
    } else {
      cls = 'rec-elective';
      title = '只有腹膜轉移、沒有其他遠處轉移<br>→ 減積手術，HIPEC 為選擇性';
      L.push(H('處置', 'COL-5'));
      L.push('<b>Cytoreduction surgery（減積手術）</b>：目標是 optimal cytoreduction，<b>± HIPEC（選擇性）</b>。');
      L.push(H('指引對這一段的兩句保留', 'COL-5 註 a、註 b'));
      L.push('<b>「積極的減積手術及／或腹腔內化療，在臨床試驗之外並不建議」</b>（註 a）。');
      L.push('<b>「HIPEC 合併 optimal cytoreduction 是選擇性的處置，取決於個別病人的狀況與外科醫師的經驗」</b>（註 b）。');
      L.push(EV('這兩句話合起來的意思是：<b>減積手術本身要挑病人，HIPEC 更要挑中心</b>。' +
        '不是所有只有腹膜轉移的病人都該做。'));
      extra = more(hipecTable());
    }
    fill('cc_r_msite', cls, title, L, 'COL-5（同時性腹腔／腹膜轉移）、COL-11(3)（HIPEC 處方）。', extra);
    if (S.pperi === 'peri') { fu('cc_f_msite', 'meta'); return; }
    showSys('4');
  }

  function renderLiverLungRes() {
    fill('cc_r_msite', 'rec-elective',
      '只有肝或只有肺轉移，而且可以切除<br>→ 手術是主軸，圍手術期化療合計不超過 6 個月', [
      H('四條並列的路', 'COL-6'),
      '<b>① 同時或分期做結腸切除加肝或肺切除及／或局部治療</b>（synchronous or staged colectomy）',
      '<b>② 先給 2–3 個月術前治療，再同時或分期切除</b>：' +
        'FOLFOX 或 CapeOX ± bevacizumab；或 FOLFIRI ± cetuximab（<b>限 KRAS／NRAS wild-type</b>）；或 FOLFOXIRI',
      '<b>③ 先做結腸切除，術後給 2–3 個月化療，再分期切除轉移病灶</b>（處方同上）',
      '<b>④ dMMR／MSI-H 者可考慮先給 pembrolizumab</b>，再同時或分期切除原發與轉移病灶',
      H('術後輔助治療', 'COL-6'),
      '<b>FOLFOX 或 CapeOx（優先）± 標靶</b>，或 <b>capecitabine 或 5-FU/leucovorin ± 標靶</b>；' +
        '也可以<b>考慮觀察或縮短療程</b>。',
      '<b>圍手術期的化療總長度不應超過 6 個月</b>（註 g）—— 術前給了幾個月，術後就要扣掉。',
      H('用 bevacizumab 時的時間安排', 'COL-6 註 b'),
      '<b>最後一劑 bevacizumab 與擇期手術之間至少間隔 6 週；術後至少 6–8 週才能重新開始。</b>',
      EV('bevacizumab 會干擾傷口癒合，並增加中風與其他動脈事件的風險（≥ 65 歲尤其明顯）。' +
        '這個間隔是排刀時最容易忽略的一件事。'),
      H('BRAF V600E 的例外', 'COL-6 註 c'),
      '<b>BRAF V600E 突變者對 ' + NR('panitumumab 或 cetuximab') + ' 反應的機會極低</b>，單用或合併都一樣。',
      H('指引另外提到的一個選項', 'COL-6 註 a'),
      EV('<b>肝動脈灌注（hepatic artery infusion）± 全身 5-FU/leucovorin</b> 也是一個選項，' +
        '指引標為 category 2B。'),
      H('pembrolizumab 這一條要注意', 'COL-6 註 h'),
      EV('指引原文寫「pembrolizumab 經台灣核准用於大腸直腸癌，但病人需自費」。' +
        '<b>這一句已經不成立</b> —— 健保 9.69(11) 自 2025/06/01 起給付 pembrolizumab 於' +
        '<b>無法切除或轉移性</b> MSI-H／dMMR 大腸直腸癌的第一線。' +
        '但注意條文寫的是「無法切除或轉移性」，<b>可切除的病人用在術前，仍不在條文範圍內</b>。')
    ], 'COL-6（可切除的同時性肝／肺轉移）、註 a（肝動脈灌注）、註 b（bevacizumab 與手術的間隔）、' +
      '註 c（BRAF V600E）、註 g（圍手術期總長 6 個月）、註 h；健保 9.69 查詢日 2026-08-16。',
      more(metaRxTable(S.bio, S.line), nhiMeta()));
    fu('cc_f_msite', 'meta');
  }

  function renderLiverLungUnres() {
    fill('cc_r_msite', 'rec-elective',
      '只有肝或只有肺轉移，但目前不可切除<br>→ 以轉換為目標，每 2 個月重新評估一次', [
      H('第一步', 'COL-7'),
      '<b>開始全身性治療</b>，處方見下面的步驟 4–6（要看生物標記與體能）。',
      '<b>只有在有立即的阻塞風險、明顯出血、穿孔或其他明顯腫瘤相關症狀時，才切除原發灶。</b>',
      H('這一格最關鍵的一件事', 'COL-7'),
      '<b>如果「轉換成可切除」是一個合理的目標，就要每 2 個月重新評估一次可切除性。</b>',
      EV('指引在頁尾又寫了一次：「Re-evaluation for resection should be planned after 2 months of ' +
        'pre-op chemotherapy and every 2 months thereafter」。' +
        '<b>沒有排定評估時間，病人就會一路化療下去、錯過可以開刀的窗口</b> —— 這是這一頁的重點。'),
      H('轉換成功', 'COL-7'),
      '<b>同時或分期切除結腸與轉移病灶</b> → 術後<b>全身性化療 ± 標靶，或考慮觀察或縮短療程</b>' +
        '（圍手術期治療以 6 個月為上限）。',
      H('仍然不可切除', 'COL-7'),
      '<b>回到 COL-8 的全身性治療</b>，以疾病控制為目標。',
      H('用 bevacizumab 時的時間安排', 'COL-7 註 a'),
      '<b>最後一劑與擇期手術間隔至少 6 週，術後至少 6–8 週才重新開始。</b>',
      H('一個指引明講的不確定', 'COL-7 註 b'),
      EV('<b>「對於潛在可切除肝轉移的病人，FOLFOX ＋ cetuximab 的資料互相矛盾」</b> —— ' +
        '指引沒有給出結論，這一格的標靶選擇要多專科討論。'),
      EV('註 e 另寫：<b>標靶治療只適合用來延續原本反應良好的術前治療</b>。')
    ], 'COL-7（不可切除的同時性肝／肺轉移）、註 a（bevacizumab 與手術）、註 b（FOLFOX＋cetuximab 的矛盾資料）、註 e。',
      more(metaRxTable(S.bio, S.line)));
    showSys('4');
  }

  /* ---------- 共用：全身性治療 COL-8 ---------- */
  function showSys(baseNum) {
    var n = parseInt(baseNum, 10);
    show('cc_b_sys', true);
    setNum('cc_n_bio', String(n));
    setNum('cc_n_fit', String(n + 1));
    setNum('cc_n_line', String(n + 2));
    show('cc_n_bio', true);
    if (!S.bio) return;
    show('cc_n_fit', true);
    if (!S.fit) return;
    show('cc_n_line', true);
    if (!S.line) return;
    renderSys();
  }

  function bioLabel() {
    return { msi: 'dMMR／MSI-H', wt: 'RAS／BRAF 都沒有突變', ras: 'RAS 突變', braf: 'BRAF V600E 突變' }[S.bio];
  }
  function lineLabel() {
    return { l1: '第一線', l2: '第二線', l3: '第二次進展之後', l4: '第三次進展之後' }[S.line];
  }

  function renderSys() {
    var L = [], cls = 'rec-elective';
    var title = bioLabel() + '　·　' + (S.fit === 'yes' ? '可耐受 intensive therapy' : '不適合 intensive therapy') +
      '　·　' + lineLabel() + '<br>→ ' + sysHeadline();

    /* ── 不適合 intensive therapy（COL-8(3)）── */
    if (S.fit === 'no') {
      L.push(H('第一線的選項', 'COL-8(3)'));
      if (S.bio === 'msi') {
        L.push('<b>nivolumab 或 pembrolizumab 單用</b>，或 <b>nivolumab ＋ ipilimumab</b>（都限 dMMR／MSI-H）。');
        L.push(EV('體能不好的 MSI-H 病人，免疫治療反而是最適合的一條 —— 毒性型態和化療完全不同。'));
      }
      L.push('<b>持續輸注 5-FU ＋ leucovorin ± bevacizumab</b>，或 <b>capecitabine ± bevacizumab</b>。');
      if (S.bio === 'wt') {
        L.push('<b>cetuximab 或 panitumumab</b> —— 但有兩個條件要同時成立：' + SUB([
          '<b>KRAS／NRAS／BRAF 都是 wild-type</b>',
          '<b>而且原發腫瘤在左側</b>（脾曲到直腸）'
        ]));
        L.push('<b>右側腫瘤（肝曲到盲腸）在第一線對 cetuximab／panitumumab 反應的機會很低</b>（註 a）。');
        L.push(EV('橫結腸（肝曲到脾曲）的資料不足，指引沒有結論。'));
      } else if (S.bio === 'ras' || S.bio === 'braf') {
        L.push(EV('這一格<b>不能用 anti-EGFR</b>：' +
          (S.bio === 'ras' ? '任何已知的 KRAS（exon 2 或 non-exon 2）或 NRAS 突變都是禁忌（COL-8(1) 註 d）。'
            : 'BRAF V600E 者對 cetuximab／panitumumab 反應的機會極低（COL-6 註 c）；' +
              'COL-8(3) 的 anti-EGFR 選項也限 BRAF wild-type。')));
      }
      L.push('<b>或直接進入 best supportive care。</b>');
      L.push(H('接下來看什麼', 'COL-8(3)'));
      L.push('<b>體能狀態有改善 → 升階到 intensive therapy（回上面把步驟改成「可以」）。</b>');
      L.push('<b>體能狀態沒有改善 → best supportive care。</b>');
      L.push(EV('這一頁的設計就是「先用低強度換體能」。它不是終點，是一個轉折點。'));

      fill('cc_r_sys', 'rec-nonop', title, L,
        'COL-8(3)（不適合 intensive therapy）、註 a（左側與右側）、COL-11（處方）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('cc_f_sys', 'palli');
      return;
    }

    /* ── 可耐受 intensive therapy ── */
    if (S.bio === 'msi' && S.line === 'l1') {
      cls = 'rec-elective';
      L.push(H('第一線就用免疫治療', 'COL-8(2)'));
      L.push('<b>pembrolizumab</b>（限 dMMR／MSI-H）—— COL-8(2) 把它與化療並列為第一線。');
      L.push('<b>健保 9.69(11) 自 2025/06/01 起給付 pembrolizumab 於無法切除或轉移性 MSI-H／dMMR 的第一線</b>' +
        '（查詢日 2026-08-16）。指引 COL-7 註 f、COL-8(1) 註 h 寫的「需自費」<b>已經不成立</b>。');
      L.push(EV('注意 <b>nivolumab 與 ipilimumab 用於大腸直腸癌仍然不在健保條文內</b>，' +
        '9.69 把大腸直腸癌只寫給 pembrolizumab。'));
      L.push(H('開始之前一定要想清楚的一件事', '健保 9.69 通則 (4)'));
      L.push('<b>條文原文：「治療期間亦不可合併申報該適應症之標靶藥物，無效後或給付時程期滿後' +
        '則不再給付該適應症相關之標靶藥物」，而大腸直腸癌不在除外名單內。</b>');
      L.push('<b>依此條文，先用了 pembrolizumab 的病人，之後的 ' + NR('bevacizumab、cetuximab、panitumumab') + ' ' +
        '將不再給付。</b>第一線就要把整條路想完，不要等到要換藥才發現。');
      L.push(EV('其他 9.69 通則：給付期限自初次處方起算 <b>2 年</b>；事前審查每次 12 週；' +
        '初次申請要 <b>ECOG ≤ 1</b>；大腸直腸癌不需檢附 PD-L1 報告；' +
        '連續兩次評估都是 stable disease 者不得續用。'));
      L.push(H('化療也仍然是選項', 'COL-8(1)、COL-8(2)'));
      L.push('<b>不想走免疫治療（或申請不下來）時，第一線的化療骨架與其他型別相同</b> —— 見下面。');
      L = L.concat(firstLineChemoLines());
      fill('cc_r_sys', cls, title, L,
        'COL-8(2)（pembrolizumab 第一線）、COL-8(1)、COL-11（處方）；健保 9.69 查詢日 2026-08-16。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('cc_f_sys', 'palli');
      return;
    }

    if (S.line === 'l1') {
      L = L.concat(firstLineChemoLines());
      if (S.bio === 'braf') {
        L.push(H('BRAF V600E 在第一線的注意事項', 'COL-6 註 c、COL-8(1) 註 i'));
        L.push('<b>第一線不加 anti-EGFR</b> —— BRAF V600E 者對 ' + NR('cetuximab／panitumumab') + ' 反應的機會極低。');
        L.push('<b>' + NR('encorafenib ＋ cetuximab') + ' 是「第二線」的處方，不是第一線。</b>' +
          '健保 9.134 也要求先用過 bevacizumab ＋ FOLFIRI／FOLFOX／5-FU-leucovorin。');
        L.push(EV('所以 BRAF V600E 的病人，第一線要把 <b>bevacizumab 那條路先走完</b>，' +
          '而且<b>不可以在第一線把 anti-EGFR 用掉</b> —— 用掉了第二線的 encorafenib ＋ cetuximab ' +
          '就不符合健保 9.134 第 (2) 款「未曾接受過 anti-EGFR」。'));
      }
      fill('cc_r_sys', cls, title, L, 'COL-8(1)、COL-8(2)（第一線）、COL-11（處方）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('cc_f_sys', 'palli');
      return;
    }

    if (S.line === 'l2') {
      L.push(H('第二線的骨架：換掉第一線用過的那一支', 'COL-8(1)'));
      L.push('<b>第一線用 FOLFOX-like → 第二線換成含 irinotecan 的處方</b>：' +
        'FOLFIRI ± bevacizumab，或 irinotecan ± bevacizumab。');
      L.push('<b>第一線用 FOLFIRI-like → 第二線換成含 oxaliplatin 的處方</b>：FOLFOX-like。');
      if (S.bio === 'wt') {
        L.push(H('這一格可以加 anti-EGFR', 'COL-8(1)'));
        L.push('<b>FOLFIRI ± cetuximab 或 panitumumab</b>，或 <b>irinotecan ± cetuximab 或 panitumumab</b>；' +
          '第一線用 FOLFIRI 者則是 <b>FOLFOX-like ± cetuximab 或 panitumumab</b>。' +
          '<b>限 KRAS／NRAS／BRAF 都是 wild-type。</b>');
        L.push(EV('健保 9.27／9.53 的後線條件是「已接受過含 5-FU、irinotecan、oxaliplatin 之二線以上' +
          '細胞毒性治療失敗」，每次 9 週、總上限 18 週 —— 條文的「後線」比指引的「第二線」更晚。' +
          '第一線就申請 anti-EGFR 的條文則是與 FOLFIRI 或 FOLFOX 併用、每次 18 週。'));
      }
      if (S.bio === 'braf') {
        cls = 'rec-urgent';
        L.push(H('這一格有專屬處方', 'COL-8(1)、COL-11(2)'));
        L.push('<b>encorafenib ＋ cetuximab</b>（限 BRAF V600E 突變）。' +
          '劑量：encorafenib 300 mg 口服 每日一次；cetuximab 首劑 400 mg/m²、之後 250 mg/m² 每週。');
        L.push('<b>健保 9.134 要同時符合四個條件：</b>' + SUB([
          '曾接受過 <b>bevacizumab ＋ FOLFIRI／FOLFOX／5-FU-leucovorin</b>',
          '<b>從未接受過任何 anti-EGFR 藥品</b>',
          '<b>ECOG ≤ 2</b>',
          '檢附 <b>BRAF V600E 突變的基因檢測報告</b>'
        ]));
        L.push('<b>總療程上限 24 週；而且用了之後不得再申請任何 anti-EGFR 藥品。</b>');
        L.push(EV('這一條把 anti-EGFR 變成「一生只能打一次的牌」。' +
          'BRAF V600E 的病人要在第二線就決定：<b>把 anti-EGFR 用在 encorafenib 這個組合，' +
          '就不能再單獨用 cetuximab／panitumumab</b>。'));
      }
      if (S.bio === 'ras') {
        L.push(EV('<b>RAS 突變者全程不能用 anti-EGFR</b>（COL-8(1) 註 d）。' +
          '所以第二線的標靶只有抗血管新生那一類。'));
      }
      L.push(H('抗血管新生藥在第二線', 'COL-8(1) 註 e、註 f、註 g'));
      L.push('<b>bevacizumab 進展後續用是美國核准、但台灣未核准</b>（註 e）。' +
        '健保 9.37 的第二線另有專屬條文：限 RAS 未突變、先前 anti-EGFR 無效、' +
        '<b>而且從未用過 bevacizumab</b>，總療程 24 週、劑量 5 mg/kg q2w。');
      L.push('<b>ziv-aflibercept 與 ramucirumab 指引有列，但在台大都開不到或要自費</b>：' +
        'ziv-aflibercept <b>不在台大處方集內、也沒有健保給付</b>；' +
        'ramucirumab 健保 9.92 <b>只給付肝細胞癌</b>。');
      if (S.bio === 'msi') {
        L.push(H('MSI-H 這一格', 'COL-8(1)'));
        L.push('<b>免疫治療若第一線沒用，仍可在後線使用</b>（nivolumab ± ipilimumab 或 pembrolizumab）；' +
          '但健保只給付 pembrolizumab 於第一線。');
      }
      fill('cc_r_sys', cls, title, L, 'COL-8(1)（第二線）、COL-11(1)／COL-11(2)（處方）；健保條文查詢日 2026-08-16。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('cc_f_sys', 'palli');
      return;
    }

    /* 第三、四線 */
    cls = 'rec-nonop';
    L.push(H(S.line === 'l3' ? '第二次進展之後的選項' : '第三次進展之後的選項', 'COL-8(1)、COL-8(2)'));
    if (S.line === 'l3') {
      if (S.bio === 'wt') {
        L.push('<b>irinotecan ＋ cetuximab 或 panitumumab</b>（限 KRAS／NRAS／BRAF wild-type，而且之前沒用過）。');
      }
      L.push('<b>regorafenib</b>　或　<b>trifluridine ＋ tipiracil ± bevacizumab</b>。');
      if (S.bio === 'msi') {
        L.push('<b>nivolumab ± ipilimumab，或 pembrolizumab</b>（限 dMMR／MSI-H）。');
      }
      if (S.bio === 'braf') {
        L.push('<b>encorafenib ＋ cetuximab</b>（限 BRAF V600E，若第二線還沒用過）。');
      }
      L.push('<b>第一線用 FOLFIRI-like 而還沒用過 FOLFOX-like 者，這一格也可以用 FOLFOX-like。</b>');
    } else {
      L.push('<b>regorafenib</b>　或　<b>trifluridine ＋ tipiracil ± bevacizumab（先前沒用過的話）</b>。');
      L.push('<b>臨床試驗</b>　或　<b>best supportive care</b>。');
    }
    L.push(H('後線這三支藥的健保規則（最容易踩到的地方）', '9.51、9.66、9.136'));
    L.push('<b>regorafenib、trifluridine ＋ tipiracil、fruquintinib 三者的給付前提相同</b>：' +
      '先前用過 fluoropyrimidine、oxaliplatin、irinotecan 為基礎的化療<b>與 anti-VEGF</b>；' +
      '<b>若 RAS 未突變，還要再用過 anti-EGFR</b>。都要檢附 All-RAS 報告、都要事前審查。');
    L.push('<b>三者不得互相併用</b>：regorafenib 不得與 trifluridine ＋ tipiracil 併用（9.51）；' +
      'trifluridine ＋ tipiracil 不得與 regorafenib 或 fruquintinib 併用（9.66）。<b>是依序單用，不是疊加。</b>');
    L.push(EV('<b>fruquintinib（Fruzaqla）台大處方集有這個品項，健保 9.136 自 2026/06/01 起給付</b>，' +
      '但<b>台大指引版次 21 沒有列</b> —— 指引的後線只寫 regorafenib 與 trifluridine ＋ tipiracil。' +
      '要用的話請以健保條文與多專科討論為依據。'));
    L.push(H('劑量與監測', 'COL-11(2)'));
    L.push('<b>regorafenib 120–160 mg 口服 每日一次（D1–21），每 28 天一個週期</b>；' +
      '<b>前 4 週要每週監測不良反應</b>（手足皮膚反應與肝功能）。');
    L.push('<b>trifluridine ＋ tipiracil 35 mg/m²（以 trifluridine 計）口服 每日兩次，D1–5 與 D8–12，' +
      '28 天一個週期；trifluridine 單次上限 80 mg。</b>');

    fill('cc_r_sys', cls, title, L,
      'COL-8(1)／COL-8(2)（後線）、COL-11(2)（處方）；健保 9.51、9.66、9.136 查詢日 2026-08-16。',
      more(metaRxTable(S.bio, S.line), nhiMeta()));
    fu('cc_f_sys', 'palli');
  }

  function sysHeadline() {
    if (S.fit === 'no') return '低強度起步，體能改善再升階';
    if (S.line === 'l1') return (S.bio === 'msi' ? 'pembrolizumab，或化療骨架加標靶' : '化療骨架加標靶');
    if (S.line === 'l2') return (S.bio === 'braf' ? 'encorafenib ＋ cetuximab' : '換掉第一線用過的那一支');
    return '後線單藥依序使用';
  }

  /* 第一線的化療骨架 —— 四個生物標記格共用，只有標靶那一行不同 */
  function firstLineChemoLines() {
    var L = [];
    L.push(H('第一線的化療骨架', 'COL-8(1)、COL-8(2)'));
    L.push('<b>FOLFOX-like</b>（XELOX、Oxaliplatin-HDFL 或 CapOx 都算）　或　<b>FOLFIRI-like</b>' +
      '（XELIRI、Irinotecan-HDFL 都算）　或　<b>FOLFIRINOX</b>。');
    L.push(EV('指引選 FOLFIRINOX 而不是 FOLFOXIRI，理由寫在 COL-8(2) 註 f：' +
      '<b>FOLFOXIRI 的 5-FU 劑量偏高（3200 mg/m² 打 48 小時）</b>；' +
      'FOLFIRINOX 用的 2400 mg/m² 打 46 小時才與 FOLFOX、FOLFIRI 的起始劑量一致。'));
    L.push(H('要加哪一種標靶', 'COL-8(1)'));
    if (S.bio === 'wt') {
      L.push('<b>可以加 bevacizumab，也可以加 cetuximab 或 panitumumab</b>（限 KRAS／NRAS wild-type）。');
      L.push('<b>但兩類不可以併用</b> —— 指引與健保 9.37／9.27／9.53 都寫明 ' +
        'bevacizumab 不得與 cetuximab 或 panitumumab 併用。');
      L.push('<b>cetuximab 與 panitumumab 也只能擇一，終生不得互換</b>（9.27、9.53）。');
      L.push(EV('原發腫瘤的左右側在第一線會影響 anti-EGFR 的效果：' +
        '<b>右側（肝曲到盲腸）反應機會低</b>，指引在 COL-8(3) 註 a 明講。' +
        '橫結腸的資料不足。'));
    } else if (S.bio === 'ras') {
      L.push('<b>加 bevacizumab。</b>');
      L.push('<b>任何已知的 KRAS（exon 2 或 non-exon 2）或 NRAS 突變，都不可以用 ' + NR('cetuximab 或 panitumumab') + '</b>' +
        '（COL-8(1) 註 d）。');
    } else if (S.bio === 'braf') {
      L.push('<b>加 bevacizumab。</b>');
      L.push('<b>不要在第一線用 anti-EGFR</b> —— BRAF V600E 者反應的機會極低（COL-6 註 c）。');
    } else {
      L.push('<b>加 bevacizumab</b>（走化療這條路時）。');
    }
    L.push(H('健保對第一線的兩個上限', '9.37'));
    L.push('<b>bevacizumab 第一線總療程上限 36 週</b>，事前審查每次 18 週，續用要提出無惡化的客觀證據。');
    L.push('<b>oxaliplatin 9.10 的條文寫「治療轉移性結腸直腸癌，惟若再加用 irinotecan 則不予給付」</b> —— ' +
      '也就是 <b>FOLFOXIRI／FOLFIRINOX 的 oxaliplatin 不給付</b>。');
    return L;
  }

  /* ---------- D. 復發（COL-9）---------- */
  function renderRecur() {
    show('cc_b_recur', true);
    show('cc_n_rentry', true);
    if (!S.rentry) return;

    if (S.rentry === 'cea') {
      fill('cc_r_recur', 'rec-elective',
        'CEA 連續上升，但影像還沒找到病灶<br>→ 先做一輪檢查；陰性就 3 個月後再照一次', [
        H('第一輪檢查', 'COL-9'),
        '<b>理學檢查、大腸鏡、胸部／腹部／骨盆 CT。</b>',
        H('找到病灶', 'COL-9'),
        '<b>依「已證實的異時性轉移」處理</b>（回到上一步改選另一個選項）。',
        H('沒找到病灶', 'COL-9'),
        '<b>考慮 PET-CT</b>，並<b>在 3 個月後重新做胸部／腹部／骨盆 CT</b>。',
        '<b>PET-CT 或 3 個月後的 CT 找到病灶 → 依已證實的轉移處理；仍然陰性 → 繼續追蹤。</b>',
        EV('這一格最常見的錯誤是「CEA 一升就急著給藥」。' +
          '<b>沒有可測量的病灶就沒有辦法評估療效</b>，也無法判斷是不是偽陽性。' +
          '指引的設計就是用時間換確定性。'),
        H('順便確認的一件事', 'COL-9 註 b'),
        '<b>要確定腫瘤的 KRAS／NRAS／BRAF 狀態</b> —— 之後要決定標靶時會用到。'
      ], 'COL-9（CEA 上升的處理流程）、註 a（檢查依個別病人狀況）、註 b。', null);
      fu('cc_f_recur', 'std');
      return;
    }

    show('cc_n_rres', true);
    if (!S.rres) return;

    if (S.rres === 'res') {
      fill('cc_r_recur', 'rec-elective',
        '已證實的異時性轉移、可以切除<br>→ 直接切除或局部消融，或先給 2–3 個月化療再切', [
        H('先做的事', 'COL-9'),
        '<b>考慮 PET-CT</b>（確認沒有其他病灶再開刀）。',
        '<b>要有多專科團隊評估，包含外科會診</b>（註 c）。',
        H('兩條並列的路', 'COL-9'),
        '<b>① 切除及／或局部消融</b>（resection and/or local ablation）',
        '<b>② 先給 2–3 個月的新輔助化療（依 COL-6 的處方），再切除及／或局部消融</b>',
        H('之後的輔助治療', 'COL-9'),
        '<b>FOLFOX 或 CapeOx（優先）± 標靶</b>，或 <b>capecitabine 或 5-FU/leucovorin ± 標靶</b>。',
        '<b>先給了新輔助化療的人，術後可以是「± 標靶」或直接觀察</b> —— ' +
          '圍手術期總長度一樣以 6 個月為上限。',
        EV('這一格和初診斷就有可切除肝／肺轉移（COL-6）的處理原則是一樣的：' +
          '<b>能切就切，化療是配角</b>。')
      ], 'COL-9（已證實之異時性轉移，可切除）、註 c（多專科評估）、COL-6（處方與療程上限）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('cc_f_recur', 'meta');
      return;
    }

    show('cc_n_rprior', true);
    if (!S.rprior) return;

    var L = [];
    if (S.rprior === 'no') {
      L.push(H('處置', 'COL-9'));
      L.push('<b>過去 12 個月內沒有用過 FOLFOX／CAPEOX → 走 COL-8 的全身性治療</b>，' +
        'oxaliplatin 這條路還是新的。');
      L.push('<b>下面的步驟 5 開始決定要用什麼藥。</b>');
      L.push(EV('這個 12 個月的分界是在問「oxaliplatin 還算不算沒用過」。' +
        '距離上次輔助化療夠久，重新使用是合理的。'));
    } else {
      L.push(H('處置', 'COL-9'));
      L.push('<b>過去 12 個月內用過 FOLFOX／CAPEOX → 直接換成含 irinotecan 的處方</b>：');
      L.push('<b>FOLFIRI-like ± bevacizumab</b>，或 <b>FOLFIRI-like ± cetuximab（限 KRAS／NRAS wild-type）</b>；');
      L.push('<b>BRAF V600E 者：encorafenib ＋ cetuximab</b>。');
      L.push(EV('12 個月內才用過 oxaliplatin 就等於「已經失敗過」，再用一次的反應率低，' +
        '而且神經毒性會疊加。'));
    }
    L.push(H('這一格最重要的一句話', 'COL-9'));
    L.push('<b>每 2 個月重新評估反應，判斷有沒有轉成可切除。</b>');
    L.push(EV('COL-9 在這一條路的末端特地寫了「Reassess response to determine resectability every 2 months」' +
      '—— 不可切除不等於永遠不可切除。'));

    fill('cc_r_recur', 'rec-elective',
      '已證實的異時性轉移、不可切除<br>→ ' + (S.rprior === 'yes' ? '換成含 irinotecan 的處方' : '走全身性治療') +
      '，每 2 個月重評可切除性', L,
      'COL-9（不可切除之異時性轉移；12 個月內是否用過 FOLFOX／CAPEOX）。',
      more(metaRxTable(S.bio, S.line), nhiMeta()));

    if (S.rprior === 'no') { showSys('5'); return; }
    fu('cc_f_recur', 'palli');
  }

  /* ==========================================================
     7. 最下方：遺傳性大腸癌
     ---------------------------------------------------------- */
  function hereditaryBlock() {
    var L = [];
    L.push(H('什麼時候要懷疑遺傳性大腸癌？', '台大指引 COL-1 註 b、COL-2 註 a'));
    L.push('<b>指引只寫了兩句，但這兩句涵蓋所有人</b>：' + SUB([
      '<b>「所有大腸癌病人都要做家族史諮詢」</b>（All patients with colon cancer should be counseled for family history）',
      '<b>「所有 &lt; 70 歲的病人都應該考慮做 MMR 蛋白檢測」</b>（COL-3(1) 註 a、COL-18）'
    ]));
    L.push(EV('也就是說 —— <b>家族史問診沒有門檻，是每個人都要做的</b>；' +
      'MMR 檢測則以 70 歲為分界。台大指引沒有再列細部的臨床判準。'));

    L.push(H('要驗哪些基因？', '台大指引未列，屬院外實證'));
    L.push('<b>第一步不是驗基因，是驗腫瘤：MMR 免疫組織化學染色（MLH1、MSH2、MSH6、PMS2）或 MSI 檢測。</b>' +
      '這一步台大指引有寫（COL-3(1) 註 a）。');
    L.push('<b>MLH1 表現喪失時要先排除後天原因</b>：先驗 <b>BRAF V600E</b> 或 <b>MLH1 啟動子甲基化</b>；' +
      '這兩者陽性通常代表是<b>散發性</b>的，不是 Lynch syndrome。');
    L.push('<b>懷疑 Lynch syndrome 時驗的是 germline：MLH1、MSH2、MSH6、PMS2、EPCAM</b>（EPCAM 缺失會讓 MSH2 失活）。');
    L.push('<b>大腸有多發息肉時要驗的是另一組</b>：<b>APC</b>（家族性腺瘤性息肉症）與 <b>MUTYH</b>' +
      '（雙套等位基因缺陷才發病，是體染色體隱性）。');
    L.push(EV('以上基因清單<b>台大大腸直腸癌診療指引版次 21 全文沒有列</b>，' +
      '本頁引自 NCCN Genetic/Familial High-Risk Assessment: Colorectal, Endometrial, and Gastric，' +
      '本頁查核之公開版本為 v3.2024。<b>要驗之前請照會遺傳諮詢。</b>'));

    L.push(H('驗到致病變異之後要加做什麼？', '台大指引未列，屬院外實證'));
    L.push('<b>Lynch syndrome：大腸鏡從每 1–2 年一次改為每 1 年一次</b>，而且開始的年齡要提前。');
    L.push('<b>女性要加做子宮內膜與卵巢的評估</b> —— Lynch syndrome 的第二常見癌症是子宮內膜癌。');
    L.push('<b>手術範圍會跟著改</b>：確診 Lynch syndrome 而且還年輕的病人，' +
      '<b>次全結腸切除（subtotal colectomy）會被拿出來討論</b>，因為剩下的大腸仍有很高的異時性癌症風險。');
    L.push('<b>一等親要做 cascade testing</b>（家族成員針對已知的那一個變異點檢測）。');
    L.push(EV('把這一段放在流程最下方，是因為<b>它與病人走哪一條治療路線無關 —— 每一條都適用</b>。' +
      '但它會改變兩件很實際的事：<b>手術要切多少</b>，以及<b>家屬要不要來看門診</b>。'));

    L.push(H('台灣的檢測給付現況', '健保，查詢日 2026-08-16'));
    L.push('<b>申請 anti-EGFR（cetuximab／panitumumab）所需的 All-RAS 基因突變分析，' +
      '有伴隨式診斷給付碼 30104B</b>，須由認證實驗室執行。');
    L.push(EV('但台大指引 COL-4 註 c 對 RAS／BRAF／HER2 的 NGS 檢測寫的是「未納入健保給付」。' +
      '<b>兩者不衝突</b>：伴隨式診斷給付的是「為了申請某一支藥而做的單項檢測」，' +
      '不是整組 NGS 套組。實務上要先確認申請的是哪一種。'));

    return '<div class="bc-gene-h">要不要驗基因？懷疑遺傳性大腸癌時怎麼做' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     8. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';

  function cardId(code) { return 'cc-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('cc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = hereditaryBlock();
  }

  function renderDrugCards() {
    var box = el('cc_drugs');
    if (!box) return;
    var txt = '';
    /* 取文字前先把 .no-rx（否定句裡的藥名、溶劑說明）整段拿掉 —— 直接讀 textContent 的話，
       「cetuximab 不可以用在輔助情境」會長出一張 Erbitux 的藥卡。 */
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      return c.textContent;
    }
    var root = el('ccPath');
    if (root) {
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        /* 只取「這個病人要用的藥」那幾行：跳過 li.ev（理由與證據）—— 那裡常拿別的情境
           當對照，掃進去就會冒出跟這個病人無關的藥卡。 */
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        /* 收合的處方表也要掃：裡面列的是真的會開的處方與藥名（處方表本身已依生物標記
           與線別過濾）。健保條文那一段不掃 —— 它幾乎把整本藥典提過一次。 */
        r.querySelectorAll('details.rx-table').forEach(function (d) { txt += textOf(d) + '\n'; });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }

    renderGeneBlock(!!txt.trim());

    var picked = [];
    CC_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' + (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });

    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;          // 集合沒變就不動 DOM，保住已經展開的卡
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
      if (S.scope === 'polyp') renderPolyp();
      else if (S.scope === 'm0') renderM0();
      else if (S.scope === 'm1') renderM1();
      else if (S.scope === 'recur') renderRecur();
    }
    renderDrugCards();
  }

  /* ==========================================================
     10. 互動
     ========================================================== */
  var SEL_GROUPS = ['cc_n1', 'cc_n_pmar', 'cc_n_pfeat', 'cc_n_pshape', 'cc_n_pres', 'cc_n_ptn',
    'cc_n_mmr', 'cc_n_hrisk', 'cc_n_msite', 'cc_n_mres', 'cc_n_pperi',
    'cc_n_bio', 'cc_n_fit', 'cc_n_line', 'cc_n_rentry', 'cc_n_rres', 'cc_n_rprior'];

  /* 上游一改，下游全部歸零 —— 否則會出現「上游的建議掛在下游選項後面」 */
  var DOWNSTREAM = {
    scope: ['pmar', 'pfeat', 'pshape', 'pres', 'ptn', 'mmr', 'hrisk', 'msite', 'mres', 'pperi',
      'bio', 'fit', 'line', 'rentry', 'rres', 'rprior'],
    pmar: ['pfeat', 'pshape', 'ptn', 'mmr', 'hrisk'],
    pfeat: ['pshape', 'ptn', 'mmr', 'hrisk'],
    pshape: ['ptn', 'mmr', 'hrisk'],
    pres: ['ptn', 'mmr', 'hrisk'],
    ptn: ['mmr', 'hrisk'],
    mmr: ['hrisk'],
    msite: ['mres', 'pperi', 'bio', 'fit', 'line'],
    mres: ['bio', 'fit', 'line'],
    pperi: ['bio', 'fit', 'line'],
    bio: ['fit', 'line'],
    fit: ['line'],
    rentry: ['rres', 'rprior', 'bio', 'fit', 'line'],
    rres: ['rprior', 'bio', 'fit', 'line'],
    rprior: ['bio', 'fit', 'line']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function ccPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      /* 先把所有選取標記清掉，render 之後再依 state 重打 —— 這樣下游的舊選取
         不會殘留在畫面上（那是「上游建議掛在下游」的視覺成因）。 */
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
      ['cc_n1', 'scope'], ['cc_n_pmar', 'pmar'], ['cc_n_pfeat', 'pfeat'], ['cc_n_pshape', 'pshape'],
      ['cc_n_pres', 'pres'], ['cc_n_mmr', 'mmr'], ['cc_n_hrisk', 'hrisk'],
      ['cc_n_msite', 'msite'], ['cc_n_mres', 'mres'], ['cc_n_pperi', 'pperi'],
      ['cc_n_bio', 'bio'], ['cc_n_fit', 'fit'], ['cc_n_line', 'line'],
      ['cc_n_rentry', 'rentry'], ['cc_n_rres', 'rres'], ['cc_n_rprior', 'rprior']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /ccPick\('([a-z]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
    if (S.ptn) { var c = el('cc_ptnc_' + S.ptn); if (c) c.classList.add('selected'); }
  }

  function ccReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    var h = el('cc_ptn_hold'); if (h) h.innerHTML = '';
    render();
  }

  function initColonPathway() { ccReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息 —— 流程圖只是
     點了沒反應。 */
  global.colonPathwayHTML = colonPathwayHTML;
  global.initColonPathway = initColonPathway;
  global.ccPick = ccPick;
  global.ccReset = ccReset;
})(window);
