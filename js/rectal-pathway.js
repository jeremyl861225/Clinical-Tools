/* ============================================================
   直腸癌治療互動決策流程 Rectal Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-08-16 全部重寫（第二版）。舊版已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引
   （文件編號 50710-2-000007，版次 21；2026/06/16 第 87 次癌症醫療委員會
     修訂通過；直腸章節 COL-12(1)～COL-12(3)、化放療處方 COL-13、
     放射治療 COL-14～COL-16、全身性治療 COL-8、復發 COL-9）
   以及 大腸直腸癌治療藥物處方（文件編號 50710-2-000015，版次 12；
     檢視日期 2026/06/16）。頁碼以 COL-x 標於各建議。
   指引所依據之公開版本：NCCN rectal 2026v1、colon 2026v1（COL-18）。
   健保給付條文查詢日：2026-08-16（來源：健保署藥品給付規定第 9 節）。

   ※ 惡性息肉（pT1）的處置結腸與直腸共用同一頁（COL-1、COL-1-1），
     已寫在 colon-pathway.js，本檔不重複。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  /* ==========================================================
     0. 狀態
     ========================================================== */
  var S = {};
  var KEYS = [
    'scope',    // m0 | m1 | recur
    'ctn',      // cT×cN×CRM 格
    'ptn',      // 直接手術後的病理 pT×pN 格
    'strat',    // COL-12(2) 的策略：std（標準順序）| tnt
    'order',    // TNT 的順序：rtfirst | chemofirst
    'restage',  // 再分期後：op | ccr | contra
    'mres',     // M1 轉移可切除性：res | unres
    'msym',     // 不可切除 M1 有無症狀：sym | asym
    'bio',      // 生物標記：msi | wt | ras | braf
    'fit',      // 能否耐受 intensive therapy：yes | no
    'line',     // 線別：l1 | l2 | l3 | l4
    'rsite',    // 復發型態：pelvis | distant | cea
    'rprev'     // 局部復發時，之前有沒有照射過骨盆：rt | nort
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-16 對 data/drugs/index.js 逐碼實跑核對）
     ⚠ 'AV 1CE89' 內含半形空白，任何環節都不可 trim。
     ========================================================== */
  var RC_DRUGS = [
    { key: '5-FU', re: '5-FU|fluorouracil', cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']] },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']] },
    { key: 'UFUR', re: 'UFUR|uracil-tegafur|tegafur',
      cards: [['17', 'UFU4CB31', 'UFUR 友復膠囊（tegafur 100 mg ＋ uracil 224 mg）', 'tegafur ＋ uracil']] },
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']] },
    { key: 'irinotecan', re: '(?<!liposomal )irinotecan', cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']] },
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
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg/4 mL']] },
    { key: 'nivolumab', cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑 20 mg/2 mL、120 mg/12 mL']] },
    { key: 'ipilimumab', cards: [['17', 'YER1CEI0', 'Yervoy 益伏注射劑 50 mg/10 mL']], flag: '大腸直腸癌需自費' }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="rectPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="rct-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="rct-node" id="' + id + '">' +
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
  /* 「這個藥<b>不可以</b>用」這種否定句裡的藥名要包起來 —— 最下方的藥卡掃描是純字串比對，
     不包的話「cetuximab 不可以用在輔助情境」會讓畫面長出一張 Erbitux 的藥卡，
     等於把禁忌藥推到醫師眼前。renderDrugCards() 會先把 .no-rx 整段移掉再比對。 */
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
     2. 決策格
     ========================================================== */
  var GCLS = { none: 'g-none', ii: 'g-ii', low: 'g-low', high: 'g-high' };

  function gridHTML(idBase, stateKey, cols, rows, groupOf, legend, note) {
    /* 欄數變體：預設 3 欄。直腸的臨床格只有兩欄（cN0／cN1–2），沒有 tn-c2
       會套到 3 欄的 template，列標題會被擠到上一列。 */
    var h = '<div class="tn-wrap"><div class="tn-grid' +
      (cols.length === 4 ? ' tn-c4' : (cols.length === 2 ? ' tn-c2' : '')) + '">';
    h += '<div class="tn-corner"></div>';
    cols.forEach(function (c) {
      h += '<div class="tn-ch">' + c[1] + (c[2] ? '<span class="tn-sub2">' + c[2] + '</span>' : '') + '</div>';
    });
    rows.forEach(function (r) {
      h += '<div class="tn-rh">' + r[1] + (r[2] ? '<span class="tn-sub2">' + r[2] + '</span>' : '') + '</div>';
      cols.forEach(function (c) {
        var key = r[0] + '_' + c[0];
        h += '<button class="tn-cell ' + GCLS[groupOf(r[0], c[0])] + '" id="' + idBase + '_' + key + '" ' +
          'onclick="rectPick(\'' + stateKey + '\',\'' + key + '\',this)">' + r[3] + c[3] + '</button>';
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

  /* ---------- 2a. 臨床分期格：cT × cN，第三軸是 CRM（COL-12(1)）---------- */
  /* ⚠ r[1] 是列標題（.tn-rh 是 flex 容器，第二行要走 tn-sub2 也就是 r[2]，不能用 <br>）；
     r[3] 是格子內的短標籤，這裡刻意帶一個 <br> 讓「分期」與「N」分兩行，
     否則 cT3 的兩列會印出一模一樣的文字。 */
  var CT_ROWS = [
    ['ct12', 'cT1–2', '未穿透固有肌層', 'cT1–2<br>'],
    ['ct3c', 'cT3 · CRM 乾淨', '距直腸繫膜筋膜 &gt; 1 mm', 'cT3 CRM 乾淨<br>'],
    ['ct3i', 'cT3 · CRM 受侵犯', '≤ 1 mm、侵犯提肛肌或括約肌間平面', 'cT3 CRM 受侵犯<br>'],
    ['ct4', 'cT4 或局部不可切除', '含無法耐受手術者', 'cT4<br>']
  ];
  var CN_COLS = [
    ['cn0', 'cN0', '影像看不到轉移淋巴結', 'cN0'],
    ['cn12', 'cN1–2', '有轉移淋巴結', 'cN1–2']
  ];
  var CTN = {
    ct12: { cn0: 'none', cn12: 'low' },
    ct3c: { cn0: 'low', cn12: 'low' },
    ct3i: { cn0: 'high', cn12: 'high' },
    ct4: { cn0: 'high', cn12: 'high' }
  };
  var CTN_LEGEND = [
    ['none', '直接手術'],
    ['low', '先做術前治療（標準順序或 TNT 都可以）'],
    ['high', '一定要走全程術前治療 TNT']
  ];
  function ctnGroup(r, c) { return CTN[r][c]; }
  function ctnParts() {
    var p = S.ctn.split('_');
    return { t: p[0], n: p[1], g: ctnGroup(p[0], p[1]) };
  }
  function ctnName() {
    var p = ctnParts();
    var t = { ct12: 'cT1–2', ct3c: 'cT3（CRM 乾淨）', ct3i: 'cT3（CRM 受侵犯）', ct4: 'cT4／局部不可切除' }[p.t];
    return t + '　' + (p.n === 'cn0' ? 'cN0' : 'cN1–2');
  }

  /* ---------- 2b. 直接手術後的病理 pT×pN（COL-12(1) → COL-3）---------- */
  var PT_ROWS = [
    ['t1', 'pT1', '侵犯黏膜下層', 'T1'],
    ['t2', 'pT2', '侵犯固有肌層', 'T2'],
    ['t3', 'pT3', '穿透固有肌層至直腸周圍組織', 'T3'],
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
    ['none', '不需要輔助 CCRT，也不需要輔助化療'],
    ['ii', '要輔助 CCRT；化療依第 II 期原則判斷'],
    ['low', '要輔助 CCRT ＋ 低風險第 III 期化療'],
    ['high', '要輔助 CCRT ＋ 高風險第 III 期化療']
  ];
  function ptnGroup(r, c) { return PTN[r][c === 'n0' ? 0 : (c === 'n1' ? 1 : 2)]; }
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

  /* 3a. 化放療同步的處方（COL-13） */
  function ccrtRxTable() {
    return foldRx('<b>化放療同步的實際處方</b>（藥名、劑量、頻率；COL-13）',
      '<table>' +
      '<tr><td>RT ＋ 口服 fluoropyrimidine</td><td>capecitabine 800–1200 mg/m² 每日兩次、每週 5 天，' +
      '合併 RT × 5 週；或 UFUR 300–350 mg/m²/day、每週 5 天 × 5 週</td></tr>' +
      '<tr><td>RT ＋ 5-FU/leucovorin</td><td>5-FU 400 mg/m² IV bolus ＋ leucovorin 20 mg/m² IV bolus，' +
      '於 RT 第 1 與第 5 週各 4 天</td></tr>' +
      '<tr><td>RT ＋ 持續輸注 5-FU</td><td>5-FU 225 mg/m²，24 小時輸注，RT 期間每週 5 或 7 天</td></tr>' +
      '<tr><td>RT ＋ 每週低劑量 5-FU/LV</td><td>5-FU 450–550 mg/m² IV bolus ＋ leucovorin 20–30 mg/m² IV bolus，' +
      'RT 期間每週一次</td></tr>' +
      '<tr><td>RT ＋ FOLFOX</td><td>oxaliplatin 40–85 mg/m² 打 2 小時；leucovorin 300–400 mg/m² 與 oxaliplatin ' +
      '同時（可用 Y 型接頭同一條管路）→ 5-FU 2000–2800 mg/m² 輸注 24–48 小時，RT 期間 q2w × 2–3 cycles。' +
      '或 5-FU bolus 400 mg/m² ＋ 2000–2400 mg/m² 輸注 46–48 小時，q2w × 2–3 cycles。' +
      '或 5-FU 225–250 mg/m²/day ＋ oxaliplatin 50–60 mg/m²，RT 期間每週一次</td></tr>' +
      '<tr><td>RT ＋ XELOX</td><td>capecitabine 800 mg/m² 每日兩次 ＋ oxaliplatin 50 mg/m²，每週 5 天，合併 RT × 5 週</td></tr>' +
      '<tr><td>RT ＋ HDFL</td><td>5-FU 400 mg/m² IV push，2400 mg/m² 輸注 48 小時</td></tr>' +
      '<tr><td>合併標靶</td><td>COL-13 註記「' + NR('bevacizumab') + ' 5–7.5 mg/kg q2–3w 可選擇性加入上述化放療處方」。' + '<b>但 COL-3(1) 註 c 又寫「第 II 或 III 期的輔助情境不應使用 ' + NR('bevacizumab') + '，臨床試驗除外」</b> —— 指引兩處說法不一致，本頁照錄，實際使用請以多專科討論為準。</td></tr>' +
      '<tr><td>溶劑</td><td>' + NR('oxaliplatin') + ' 用 <b>D5W</b>；標靶藥用 <b>0.9% sodium chloride</b></td></tr>' +
      '</table>');
  }

  /* 3b. 全身化療處方（COL-10 輔助、COL-11 晚期） */
  function chemoRxTable() {
    return foldRx('<b>FOLFOX 與 CAPEOX 的實際處方</b>（COL-10）',
      '<table>' +
      '<tr><td><b>modified FOLFOX6</b><br>q2w</td><td>oxaliplatin 85 mg/m² IV（D1）；leucovorin 400 mg/m² IV 2 hr；' +
      '5-FU 400 mg/m² IV bolus（D1）→ 5-FU 2400 mg/m² 輸注 46 hr</td></tr>' +
      '<tr><td><b>FOLFOX4</b><br>q2w</td><td>oxaliplatin 85 mg/m² ＋ leucovorin 200 mg/m² IV 2 hr（D1）→ ' +
      '5-FU 400 mg/m² bolus → 5-FU 600 mg/m² 輸注 22 hr；D2 重複</td></tr>' +
      '<tr><td><b>XELOX（CAPEOX）</b><br>q3w</td><td>oxaliplatin 85–130 mg/m² IV（D1）；' +
      'capecitabine 800–1250 mg/m² 口服 每日兩次（D1–14）</td></tr>' +
      '<tr><td><b>Oxaliplatin-HDFL24</b><br>q3w</td><td>oxaliplatin 60–65 mg/m² IV 2–4 hr（D1、D8）；' +
      '5-FU 2000–2600 mg/m² ＋ leucovorin 300 mg/m² 輸注 24 hr（D1、D8）</td></tr>' +
      '<tr><td><b>capecitabine 單方</b><br>q3w</td><td>capecitabine 800–1250 mg/m² 口服 每日兩次（D1–14）</td></tr>' +
      '<tr><td><b>HDFL</b><br>每週</td><td>5-FU 2600 mg/m² ＋ leucovorin 300 mg/m² IV（D1）</td></tr>' +
      '<tr><td>療程長度</td><td>術前 TNT 用 <b>12–16 週</b>；術後輔助也是 <b>12–16 週</b>；' +
      '<b>圍手術期治療合計以不超過 6 個月為原則</b></td></tr>' +
      '</table>');
  }

  /* ⚠ 這張表會被最下方的藥卡掃描讀進去，所以<b>必須依這個病人的生物標記與線別過濾</b>。
     整份菜單照印會讓 RAS 突變的病人畫面上長出 cetuximab 的藥卡 —— 那是禁忌藥。 */
  function metaRxTable(bio, line) {
    var egfr = (bio === 'wt');
    var braf = (bio === 'braf');
    var msi = (bio === 'msi');
    var l2plus = (line === 'l2' || line === 'l3' || line === 'l4');
    var later = (line === 'l3' || line === 'l4');
    var eTail = egfr ? '　±　cetuximab 首劑 400 mg/m²、之後 250 mg/m² 每週　±　panitumumab 6 mg/kg' : '';
    var r = '';
    r += '<tr><td><b>mFOLFOX6</b><br>q2w</td><td>oxaliplatin 85 mg/m² D1；leucovorin 400 mg/m² 2 hr；' +
      '5-FU 400 mg/m² bolus → 2400 mg/m² 輸注 46 hr　±　bevacizumab 5 mg/kg' + eTail + '</td></tr>';
    r += '<tr><td><b>FOLFIRI</b><br>q2w</td><td>irinotecan 150–180 mg/m² D1；leucovorin 400 mg/m² 2 hr；' +
      '5-FU 400 mg/m² D1 → 2400 mg/m² 輸注 46 hr　±　bevacizumab 5 mg/kg' + eTail +
      (l2plus ? '　±　ramucirumab 8 mg/kg q2w（<b>大腸直腸癌無健保給付</b>）' : '') + '</td></tr>';
    r += '<tr><td><b>XELOX</b><br>q3w</td><td>oxaliplatin 130 mg/m² D1；capecitabine 850–1000 mg/m² 每日兩次（D1–14）' +
      '　±　bevacizumab 7.5 mg/kg</td></tr>';
    r += '<tr><td><b>FOLFOXIRI</b><br>q2w</td><td>irinotecan 165 mg/m² D1；oxaliplatin 85 mg/m² D1；' +
      'leucovorin 400 mg/m² D1；5-FU 3200 mg/m² 輸注 48 hr</td></tr>';
    if (braf && l2plus) {
      r += '<tr><td><b>encorafenib ＋ cetuximab</b><br>BRAF V600E · 第二線</td><td>encorafenib 300 mg 口服 每日一次；' +
        'cetuximab 首劑 400 mg/m²、之後 250 mg/m² 每週</td></tr>';
    }
    if (msi) {
      r += '<tr><td><b>pembrolizumab</b><br>dMMR／MSI-H</td><td>200 mg IV D1 q3w</td></tr>';
      r += '<tr><td><b>nivolumab ± ipilimumab</b><br>dMMR／MSI-H</td><td>nivolumab 3 mg/kg q2w；或 nivolumab 3 mg/kg ＋ ' +
        'ipilimumab 1 mg/kg q3w 共四劑，之後 nivolumab 3 mg/kg q2w</td></tr>';
    }
    if (later) {
      r += '<tr><td><b>regorafenib</b></td><td>120–160 mg 口服 每日一次（D1–21），每 28 天重複；前 4 週每週監測</td></tr>';
      r += '<tr><td><b>trifluridine ＋ tipiracil</b></td><td>35 mg/m²（以 trifluridine 計）口服 每日兩次，' +
        'D1–5 與 D8–12，28 天一個週期；單次上限 80 mg</td></tr>';
    }
    return foldRx('<b>這個病人可以用的處方</b>（已依生物標記與線別過濾；COL-11(1)、COL-11(2)）',
      '<table>' + r + '</table>');
  }

  /* 3c. 放射治療（COL-14、COL-15、COL-16）—— 不掃藥卡 */
  function rtReference() {
    return fold('<b>放射治療要照哪裡、照多少？</b>適應症、劑量與靶區（COL-14、COL-15、COL-16）',
      '<table>' +
      '<tr><td><b>術前 CCRT／RT<br>的適應症</b></td><td>① <b>臨床上局部晚期的直腸癌：≥ 臨床 T3 或 N 陽性</b>；' +
      '② <b>可手術的晚期直腸癌（M1）</b>；③ <b>要保留肛門的直腸癌</b></td></tr>' +
      '<tr><td><b>術後 CCRT<br>的適應症</b></td><td>① <b>切緣陽性或過近</b>；② <b>pT3–4 或 pN1–2</b>；' +
      '③ <b>M1 且轉移與直腸病灶已同時切除者</b>；④ <b>要保留肛門的直腸癌</b></td></tr>' +
      '<tr><td>方式</td><td>3D conformal（3–4 fields）、IMRT、VMAT 或其他新技術；<b>≥ 6MV photon</b>。' +
      '<b>質子治療為選擇性</b>，細節依放腫部技術規範</td></tr>' +
      '<tr><td>劑量與分次</td><td><b>每次 ≥ 1.8 Gy、每週 5 次</b>；<b>長程總劑量 45–60 Gy</b>' +
      '（COL-12(1) 註 c 寫常用 4500–5040 cGy／5 週）；<b>短程 25 Gy 分 5 次</b></td></tr>' +
      '<tr><td>擺位</td><td>俯臥或仰臥；<b>可行的話脹尿</b>；用固定裝置</td></tr>' +
      '<tr><td>照野（3DRT）</td><td>術前，或低前位切除（LAR）術後 → <b>骨盆</b>；' +
      '腹會陰切除（APR）術後 → <b>骨盆 ± 會陰疤痕加邊界</b>；' +
      '<b>侵犯到齒狀線以下的肛管及／或肛周皮膚 → 照野要考慮納入鼠蹊區</b></td></tr>' +
      '<tr><td>CTV</td><td>直腸 GTV 徑向 +1–1.5 cm、頭尾向 +2.5 cm；淋巴結 GTV 對稱外擴 0.5–1.5 cm；' +
      '含直腸繫膜與直腸周圍淋巴引流；薦前淋巴（薦骨前緣往前 8–10 mm 的組織）</td></tr>' +
      '<tr><td><b>選擇性淋巴結<br>照射範圍</b></td><td>基本：<b>直腸周圍、內髂</b>；' +
      '<b>N 陽性位於內髂、cT4 或 cN2 → 加閉孔</b>；' +
      '<b>T4 向前侵犯 → 加外髂</b>；<b>侵犯肛管 → 考慮鼠蹊與外髂</b></td></tr>' +
      '<tr><td>PTV</td><td>CTV ＋ 0.5–1 cm</td></tr>' +
      '</table>');
  }

  /* 3d. 健保條文 —— 不掃藥卡 */
  function nhiAdj() {
    return fold('<b>健保怎麼給付直腸癌的化療？</b>（第 9 節條文，查詢日 2026-08-16）',
      '<table>' +
      '<tr><td>UFUR<br>9.11</td><td><b>「直腸癌、結腸癌第 II、III 期患者之術後輔助性治療，使用期限不得超過 2 年」</b>' +
      '—— 條文明文包含直腸癌，也是唯一涵蓋第 II 期的輔助用藥。</td></tr>' +
      '<tr><td>oxaliplatin<br>9.10</td><td>條文的輔助適應症寫的是 <b>「第三期<u>結腸</u>癌（Dukes C）原發腫瘤完全切除' +
      '手術後的輔助療法」</b>，<b>字面上只寫結腸</b>；轉移性那一條則寫「轉移性結腸直腸癌」。' +
      '<b>直腸癌的輔助 FOLFOX／CAPEOX 是否符合條文，實務上以審查為準</b>，本頁不代為認定。</td></tr>' +
      '<tr><td>capecitabine<br>9.17</td><td>輔助適應症同樣寫 <b>「第三期<u>結腸</u>癌患者手術後的輔助性療法，' +
      '以八個療程為限」</b>；轉移性那一條寫「轉移性結腸直腸癌的第一線用藥」。</td></tr>' +
      '<tr><td>標靶藥</td><td><b>輔助情境完全沒有給付。</b>指引也寫 bevacizumab、cetuximab、panitumumab、' +
      'irinotecan 不應用於第 II／III 期的輔助治療（COL-3(1) 註 c）。</td></tr>' +
      '</table>');
  }

  function nhiMeta() {
    return fold('<b>健保怎麼給付轉移性大腸直腸癌？</b>互斥與順序陷阱（第 9 節條文，查詢日 2026-08-16）',
      '<table>' +
      '<tr><td>bevacizumab<br>9.37</td><td><b>第一線</b>與 FOLFIRI／FOLFOX／5-FU＋leucovorin 併用，' +
      '<b>總療程上限 36 週</b>，每次事前審查 18 週。<b>第二線</b>（Zirabev 除外）限 RAS 未突變、' +
      '先前 anti-EGFR 無效、<b>且從未用過 bevacizumab</b>，<b>總上限 24 週、劑量 5 mg/kg q2w</b>。</td></tr>' +
      '<tr><td colspan="2"><b>① bevacizumab 不得與 cetuximab 或 panitumumab 併用。</b></td></tr>' +
      '<tr><td>cetuximab 9.27<br>panitumumab 9.53</td><td>限 <b>All-RAS 未突變</b>並檢附認證實驗室報告。' +
      '第一線與 FOLFIRI 或 FOLFOX 併用，每次 18 週；後線限二線以上細胞毒性治療失敗，每次 9 週、' +
      '<b>總上限 18 週</b>。</td></tr>' +
      '<tr><td colspan="2"><b>② cetuximab 與 panitumumab 只能擇一，終生不得互換。' +
      '③ 經 R0 切除且查無轉移病灶者不得申請（2026/02/01 新增）。</b></td></tr>' +
      '<tr><td>encorafenib<br>9.134</td><td>與 cetuximab 併用作為 <b>BRAF V600E 的第二線</b>，須同時符合：' +
      '曾用過 bevacizumab ＋ FOLFIRI／FOLFOX／5-FU-leucovorin、<b>從未用過 anti-EGFR</b>、ECOG ≤ 2、' +
      '檢附 BRAF V600E 報告。<b>總上限 24 週；用了之後不得再申請任何 anti-EGFR。</b></td></tr>' +
      '<tr><td>regorafenib 9.51<br>trifluridine ＋ tipiracil 9.66<br>fruquintinib 9.136</td><td>' +
      '三者條件相同：先前用過 fluoropyrimidine、oxaliplatin、irinotecan 為基礎的化療<b>與 anti-VEGF</b>；' +
      '<b>若 RAS 未突變還要用過 anti-EGFR</b>。<b>三者不得互相併用，是依序單用。</b></td></tr>' +
      '<tr><td>pembrolizumab<br>9.69(11)</td><td><b>限 pembrolizumab 用於無法切除或轉移性 MSI-H／dMMR 的第一線</b>' +
      '（2025/06/01 起）。給付期限自初次處方起算 <b>2 年</b>，事前審查每次 12 週，需 <b>ECOG ≤ 1</b>，' +
      '不需檢附 PD-L1 報告。<b>nivolumab、ipilimumab 用於大腸直腸癌不在條文內 → 自費。</b></td></tr>' +
      '<tr><td colspan="2"><b>④ 9.69 通則：治療期間不可合併申報該適應症的標靶藥物，' +
      '「無效後或給付時程期滿後則不再給付該適應症相關之標靶藥物」，大腸直腸癌不在除外名單內。</b>' +
      '依此條文，先用 pembrolizumab 的病人，之後的 bevacizumab、cetuximab、panitumumab 將不再給付。</td></tr>' +
      '<tr><td>ramucirumab 9.92<br>ziv-aflibercept</td><td>ramucirumab <b>健保只給付肝細胞癌</b>；' +
      'ziv-aflibercept <b>台大處方集沒有這個品項、也沒有健保給付</b>（處方集內的 aflibercept 是眼內注射的 ' +
      'Eylea，完全不同的產品）。兩者指引 COL-8(1) 有列，在台大都用不到或要自費。</td></tr>' +
      '<tr><td>oxaliplatin<br>9.10</td><td><b>「治療轉移性結腸直腸癌，惟若再加用 irinotecan 則不予給付」</b>' +
      '—— 也就是 <b>FOLFOXIRI／FOLFIRINOX 的 oxaliplatin 不給付</b>。</td></tr>' +
      '</table>');
  }

  /* 3e. watch and wait（COL-12(2)、COL-12(3) 註 d） */
  function wwReference() {
    return fold('<b>什麼是 watch and wait？指引怎麼寫的？</b>（COL-12(2)／COL-12(3) 註 d）',
      '<table>' +
      '<tr><td>適用對象</td><td><b>達到臨床完全緩解（complete clinical response）</b>，而且' +
      '<b>肛門指診、直腸磁振造影、直接內視鏡評估三者都看不到殘存病灶</b>的病人</td></tr>' +
      '<tr><td>執行的場域</td><td><b>限有經驗的多專科團隊的中心</b>（in centers with experienced ' +
      'multidisciplinary teams）</td></tr>' +
      '<tr><td>指引明講的不確定</td><td><b>「相較於標準的手術切除，局部及／或遠處失敗的風險增加多少，' +
      '目前尚未被充分刻畫」</b></td></tr>' +
      '<tr><td>決策方式</td><td><b>「非手術處置的決定，應包含與病人針對其風險承受度的仔細討論」</b></td></tr>' +
      '<tr><td>本頁的立場</td><td>台大指引只寫到上面這四點，<b>沒有列追蹤時程、影像頻率或再生長的處置</b>。' +
      '要走這條路請以多專科團隊的共識為準。</td></tr>' +
      '</table>');
  }

  /* 3f. 追蹤 */
  function followupHTML(kind) {
    if (kind === 'early') {
      return '<div class="fu-label">追蹤原則 · pT1–2 N0（COL-3(1)）</div><ul class="fu-list">' +
        '<li><b>大腸鏡 1 年後做一次。</b>有 advanced adenoma → 1 年後再做；沒有 → 3 年後再做，之後每 5 年一次。</li>' +
        '<li>advanced adenoma 指<b>絨毛狀息肉、息肉 &gt; 1 cm、或高度異型增生</b>。</li>' +
        '<li><b>低前位切除或經肛門切除後，考慮每 6 個月做一次乙狀結腸鏡，持續 3–5 年。</b></li></ul>';
    }
    if (kind === 'meta') {
      return '<div class="fu-label">追蹤原則 · 轉移病灶已切除（COL-6、COL-7）</div><ul class="fu-list">' +
        '<li>病史與理學檢查每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年。</li>' +
        '<li><b>CEA 每 3–6 個月一次共 2 年，之後每 6 個月一次共 5 年。</b></li>' +
        '<li><b>胸部／腹部／骨盆 CT 每 3–6 個月一次共 2 年，之後每 6–12 個月一次到滿 5 年；' +
        '直腸癌之復發高風險者則每年一次至滿 5 年。</b></li>' +
        '<li>大腸鏡 1 年後做一次；術前因阻塞未能完成者，<b>術後 3–6 個月內補做</b>。</li>' +
        '<li><b>低前位切除或經肛門切除後，考慮每 6 個月做一次乙狀結腸鏡，持續 3–5 年。</b></li>' +
        '<li><b>直腸癌不常規安排 PET-CT</b>（COL-6 原文）。</li></ul>';
    }
    if (kind === 'palli') {
      return '<div class="fu-label">追蹤與支持治療（COL-8）</div><ul class="fu-list">' +
        '<li>每 2 個月以影像評估反應與是否轉為可切除；疾病進展就換次線。</li>' +
        '<li>骨盆症狀（出血、疼痛、阻塞、廔管）優先處理 —— 放射治療、支架或造口都在選項內。</li>' +
        '<li>免疫檢查點抑制劑依 i-RECIST 評估；連續兩次都是 stable disease 者健保不得續用（9.69）。</li>' +
        '<li>末期病人：安寧緩和照護，照會安寧共同照護團隊。</li></ul>';
    }
    return '<div class="fu-label">追蹤原則 · 第 II／III 期（COL-3(1)、COL-3(2)、COL-6）</div><ul class="fu-list">' +
      '<li>病史與理學檢查每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年。</li>' +
      '<li><b>CEA 每 3–6 個月一次共 2 年，之後每 6 個月一次到滿 5 年</b>（pT2 以上）。</li>' +
      '<li><b>復發高風險者</b>胸部／腹部／骨盆 CT 每 6–12 個月一次共 5 年；<b>直腸癌之高風險者每年一次至滿 5 年</b>。' +
      '這裡的高風險指<b>神經或血管侵犯、或分化不良</b>。</li>' +
      '<li>大腸鏡 1 年後做一次；有 advanced adenoma 則 1 年後再做，沒有則 3 年後再做、之後每 5 年一次。' +
      '術前因阻塞未能完成者，<b>術後 3–6 個月內補做</b>。</li>' +
      '<li><b>低前位切除或經肛門切除後，考慮每 6 個月做一次乙狀結腸鏡，持續 3–5 年</b> —— ' +
      '這是直腸癌獨有的一條，用來找吻合處的局部復發。</li>' +
      '<li><b>直腸癌不常規安排 PET-CT。</b></li>' +
      '<li>追蹤中 CEA 上升或影像發現病灶 → 回步驟 1 選「治療後復發」。</li></ul>';
  }

  /* ==========================================================
     4. 版面
     ========================================================== */
  function rectalPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院大腸直腸癌診療指引</b>（版次 21，2026/06/16 癌症醫療委員會修訂通過；' +
      '所依據之公開版本為 NCCN rectal 2026v1）編成的<b>直腸癌</b>互動決策流程。' +
      '步驟照臨床決策實際發生的先後排：<b>骨盆磁振造影定 cT／cN 與環周切緣 → 直接開刀還是先給藥 → ' +
      '術前治療怎麼排 → 再分期之後怎麼開 → 術後放療與化療 → 轉移或復發</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是處方劑量、放療靶區、健保條文與參考資料。<br>' +
      '<b>大腸鏡切下的惡性息肉（pT1）</b>結腸與直腸共用同一頁（COL-1、COL-1-1），' +
      '請切換到上方的「結腸」頁籤；分期本身（AJCC 第 8 版）另見「分期 TNM」頁籤。</p>';
    h += '<div class="onc-path" id="rcPath">';

    /* 步驟 1 */
    h += node0('rc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'm0', '直腸病灶，影像沒有遠處轉移（M0）', '從骨盆磁振造影定出來的 cT、cN 與環周切緣開始') +
      opt('scope', 'm1', '直腸癌合併遠處轉移（M1）', '') +
      opt('scope', 'recur', '治療後復發', '骨盆局部復發、異時性遠處轉移，或 CEA 上升'));

    /* ── A. M0 ── */
    h += '<div id="rc_b_m0" class="hidden">';
    h += node('rc_n_ctn', '2', '骨盆磁振造影定出來的分期落在哪一格？（點 cT 與 cN 的交會格；COL-12(1)）', '',
      '<div id="rc_ctn_hold"></div>');
    h += recBox('rc_r_ctn', '建議處置 · 直接開刀還是先給藥');
    h += '</div>';

    /* A-1 直接手術 */
    h += '<div id="rc_b_up" class="hidden">';
    h += node('rc_n_ptn', '3', '術後病理落在哪一格？（點 pT 與 pN 的交會格；COL-12(1)、COL-3、COL-17）', '',
      '<div id="rc_ptn_hold"></div>');
    h += recBox('rc_r_up_adj', '建議處置 · 術後放射治療與輔助化療');
    h += fuBox('rc_f_up');
    h += '</div>';

    /* A-2 需要術前治療 */
    h += '<div id="rc_b_neo" class="hidden">';
    h += node('rc_n_strat', '3', '術前治療要走哪一種策略？（COL-12(2)）',
      opt('strat', 'std', '標準順序', '術前化放療或短程放療 → 手術 → 術後 FOLFOX 或 CAPEOX 12–16 週') +
      opt('strat', 'tnt', 'Total neoadjuvant therapy（TNT）', '化放療與化療都在術前做完 → 手術 → 追蹤'));
    h += node('rc_n_order', '4', 'TNT 的兩個順序要選哪一個？（COL-12(2)、COL-12(3)）',
      opt('order', 'rtfirst', '先化放療（或短程放療），再打 FOLFOX／CAPEOX 12–16 週', '') +
      opt('order', 'chemofirst', '先打 FOLFOX／CAPEOX 12–16 週，再做化放療（或短程放療）', ''));
    h += recBox('rc_r_neo', '建議處置 · 術前治療的處方與安排');
    h += '</div>';

    /* 共用：再分期 */
    h += '<div id="rc_b_restage" class="hidden">';
    h += node('rc_n_restage', '5', '再分期之後是哪一種狀況？（COL-12(2)、COL-12(3)）',
      opt('restage', 'op', '可以做經腹切除', 'transabdominal resection') +
      opt('restage', 'ccr', '達到臨床完全緩解，想討論 watch and wait',
        '肛門指診、直腸磁振造影、內視鏡三者都看不到殘存病灶') +
      opt('restage', 'contra', '手術有禁忌，或仍然無法切除', ''));
    h += recBox('rc_r_restage', '建議處置 · 再分期之後怎麼做');
    h += fuBox('rc_f_restage');
    h += '</div>';

    /* ── B. M1 ── */
    h += '<div id="rc_b_m1" class="hidden">';
    h += node('rc_n_mres', '2', '遠處轉移可不可以切除？（COL-12(1)）',
      opt('mres', 'res', '轉移病灶可以切除', 'T any, N any, M1 resectable metastases') +
      opt('mres', 'unres', '轉移病灶不可切除，或病人無法耐受手術', ''));
    h += node('rc_n_msym', '3', '直腸原發灶有沒有症狀？（COL-12(1)）',
      opt('msym', 'sym', '有症狀', '出血、阻塞、疼痛、裏急後重') +
      opt('msym', 'asym', '沒有症狀', ''));
    h += recBox('rc_r_m1', '建議處置 · 轉移性直腸癌的局部處置');
    h += fuBox('rc_f_m1');
    h += '</div>';

    /* ── C. 復發 ── */
    h += '<div id="rc_b_recur" class="hidden">';
    h += node('rc_n_rsite', '2', '復發的型態是哪一種？',
      opt('rsite', 'pelvis', '骨盆內局部復發', '吻合處、直腸繫膜、側方淋巴結或薦前') +
      opt('rsite', 'distant', '異時性遠處轉移', '肝、肺或其他部位') +
      opt('rsite', 'cea', 'CEA 上升，但影像還沒找到病灶', ''));
    h += node('rc_n_rprev', '3', '之前有沒有照射過骨盆？',
      opt('rprev', 'rt', '有，做過術前或術後放射治療', '') +
      opt('rprev', 'nort', '沒有照射過', ''));
    h += recBox('rc_r_recur', '建議處置 · 復發');
    h += fuBox('rc_f_recur');
    h += '</div>';

    /* 共用：全身性治療 */
    h += '<div id="rc_b_sys" class="hidden">';
    h += node('rc_n_bio', '4', '生物標記的結果是哪一種？（COL-12(1) 註 h、COL-8）',
      opt('bio', 'msi', 'dMMR 或 MSI-H', '不論 RAS／BRAF —— 這一格的治療完全不一樣') +
      opt('bio', 'wt', 'pMMR／MSS，RAS 與 BRAF 都沒有突變', '') +
      opt('bio', 'ras', 'pMMR／MSS，RAS 有突變', 'KRAS exon 2 或 non-exon 2、或 NRAS') +
      opt('bio', 'braf', 'pMMR／MSS，BRAF V600E 突變', ''));
    h += node('rc_n_fit', '5', '病人能不能耐受 intensive therapy？（COL-8）',
      opt('fit', 'yes', '可以', '') +
      opt('fit', 'no', '不行', '先用低強度，體能改善再升階'));
    h += node('rc_n_line', '6', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線', '') +
      opt('line', 'l3', '第二次進展之後', '') +
      opt('line', 'l4', '第三次進展之後', ''));
    h += recBox('rc_r_sys', '建議處置 · 全身性治療');
    h += fuBox('rc_f_sys');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="rectReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="rc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="rc_drugs"></div>';
    /* 補充參考面板（院外實證，預設全部收合）—— 結腸與直腸共用，見 js/crc-supplement.js */
    h += (typeof crcSupplementHTML === 'function') ? crcSupplementHTML() : '';
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
    var root = el('rcPath');
    if (!root) return;
    root.querySelectorAll('.rct-node').forEach(function (n) {
      if (n.id !== 'rc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['rc_b_m0', 'rc_b_up', 'rc_b_neo', 'rc_b_restage', 'rc_b_m1', 'rc_b_sys', 'rc_b_recur']
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

  /* ---------- A. M0 ---------- */
  function renderM0() {
    show('rc_b_m0', true);
    show('rc_n_ctn', true);
    var hold = el('rc_ctn_hold');
    if (hold) {
      /* ⚠ .tn-cap 有 text-transform:uppercase —— 拉丁字會被全大寫（cT3 會變成 CT3），
         所以 caption 只放中文短標，臨床字串一律放到格子下方的 note。 */
      hold.innerHTML = '<div class="tn-cap">治療前臨床分期</div>' +
        gridHTML('rc_ctnc', 'ctn', CN_COLS, CT_ROWS, ctnGroup, CTN_LEGEND,
          '<b>這張表的第三軸是環周切緣（CRM），不是 TNM</b> —— COL-12(1) 把 cT3 依 CRM 乾淨與否' +
          '分進兩條完全不同的流程，所以 cT3 在表上有兩列。' +
          '<b>這裡的顏色代表「要不要先給藥、給到什麼程度」，不是嚴重度。</b>' +
          '<b>cT1–2 N0 的判定必須依骨盆磁振造影（首選）或經直腸超音波</b>（COL-12(1) 註 f）—— ' +
          '不可以只憑指診或大腸鏡。<b>乾淨的 CRM 定義是：距直腸繫膜筋膜 &gt; 1 mm、未侵犯提肛肌、' +
          '且未侵入括約肌間平面</b>（COL-12(2) 註 a）。');
      if (S.ctn) {
        var b = el('rc_ctnc_' + S.ctn);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.ctn) return;

    var p = ctnParts();
    if (p.g === 'none') { renderUpfront(); return; }
    renderNeoPlan(p.g);
  }

  /* A-1 直接手術 */
  function renderUpfront() {
    fill('rc_r_ctn', 'rec-nonop', ctnName() + '<br>→ 直接手術，不需要術前治療', [
      H('手術', 'COL-12(1)'),
      '<b>Resection</b> —— 直腸癌的標準是<b>全直腸繫膜切除（TME）</b>，目標是環周切緣陰性。',
      H('術後的兩件事', 'COL-12(1)'),
      '<b>① pT3–4 或 pN1–2 → 要做輔助 CCRT。</b>',
      '<b>② 輔助化療依 COL-3 的原則判斷</b>（也就是和結腸癌同一套）。',
      EV('這一格的重點是：<b>直接手術不代表術後就沒事</b>。' +
        '術前影像判為 cT1–2 N0，但術後病理升期的情況並不少 —— 所以下一步的 pT×pN 格才是真正的決策點。'),
      H('指引在這一格沒有寫的事', 'COL-12(1)'),
      '<b>台大指引在這個分支沒有列局部切除（TEM／TAMIS）的選項。</b>' +
        '要走局部切除請以多專科團隊的共識為準，本頁不代為建議。',
      H('先確認一件事', 'COL-12(1) 註 f'),
      '<b>cT1–2 N0 這個判斷必須來自骨盆磁振造影（首選）或經直腸超音波</b>；' +
        '磁振造影有禁忌時才用經直腸超音波，表淺病灶也可以考慮用超音波。'
    ], 'COL-12(1)（cT1–2 N0 → Resection；pT3–4 或 pN1–2 → 輔助 CCRT）、註 f（分期依據）。',
      more(rtReference()));

    show('rc_b_up', true);
    show('rc_n_ptn', true);
    var hold = el('rc_ptn_hold');
    if (hold) {
      hold.innerHTML = '<div class="tn-cap">術後病理分期</div>' +
        gridHTML('rc_ptnc', 'ptn', PN_COLS, PT_ROWS, ptnGroup, PTN_LEGEND,
          '<b>pTis（原位癌／黏膜內癌）不會有淋巴結轉移</b>，切除就完成治療，所以沒有放進格子裡。' +
          '<b>這裡的顏色代表「術後還要做什麼」，不是嚴重度。</b>' +
          '<b>放射治療的門檻與化療的門檻不一樣</b>：<b>pT3–4 或 pN1–2 就要做輔助 CCRT</b>（COL-14）；' +
          '化療則依 COL-3 的第 II／III 期分層。<b>pN1 包含 N1c</b>（沒有淋巴結轉移，但直腸繫膜組織有腫瘤沉積）。');
      if (S.ptn) {
        var b = el('rc_ptnc_' + S.ptn);
        if (b) b.classList.add('selected');
      }
    }
    if (!S.ptn) return;
    renderUpAdj();
  }

  function renderUpAdj() {
    var p = ptnParts(), L = [], cls, title;

    if (p.g === 'none') {
      cls = 'rec-nonop';
      title = ptnName() + '<br>→ 不需要輔助 CCRT，也不需要輔助化療';
      L.push(H('處置', 'COL-12(1)、COL-14、COL-3(1)'));
      L.push('<b>術後病理是 pT1–2 N0 → 沒有達到輔助 CCRT 的門檻（pT3–4 或 pN1–2）。</b>');
      L.push('<b>化療欄位在 COL-3(1) 寫的是 None。</b>');
      L.push('<b>接下來只要追蹤</b>（見下方追蹤原則）。');
      L.push(EV('例外：<b>切緣陽性或過近</b>仍然是輔助 CCRT 的適應症（COL-14），' +
        '不論 T 與 N 分期。這一點病理報告要看清楚。'));
      fill('rc_r_up_adj', cls, title, L,
        'COL-12(1)、COL-14（術後 CCRT 的四項適應症）、COL-3(1)（輔助化療分層）。',
        more(rtReference()));
      fu('rc_f_up', 'early');
      return;
    }

    /* 有適應症 */
    L.push(H('放射治療', 'COL-12(1)、COL-14'));
    L.push('<b>要做輔助 CCRT。</b>' + (p.g === 'ii'
      ? '這一格符合的是「<b>pT3–4</b>」。'
      : '這一格符合的是「<b>pN1–2</b>」' + (p.t === 't3' || p.t === 't4' ? '，同時也符合「<b>pT3–4</b>」。' : '。')));
    L.push('<b>CCRT 的化療用 5-FU 或 capecitabine</b>；常用放射劑量 <b>4500–5040 cGy 分 5 週</b>' +
      '（COL-12(1) 註 c）。');
    L.push(EV('COL-14 列的術後 CCRT 適應症共四項：<b>① 切緣陽性或過近；② pT3–4 或 pN1–2；' +
      '③ M1 且轉移與直腸病灶已同時切除；④ 要保留肛門者</b>。符合任一項就有適應症。'));
    L.push(EV('COL-12(1) 註 d 特別寫：<b>「第 II／III 期直腸癌，CCRT 與手術的先後順序不影響存活；' +
      '但術前 CCRT 的毒性比術後 CCRT 低」</b>。所以術後才做 CCRT 是不得已 —— ' +
      '這也是為什麼流程把絕大多數 ≥ cT3 或 cN 陽性的病人都放在術前那條路。'));

    L.push(H('輔助化療', 'COL-3(1)、COL-3(2)'));
    if (p.g === 'ii') {
      L.push('<b>pT3–4 N0 走第 II 期的原則</b>：先看 MMR／MSI，再看高風險特徵。');
      L.push('<b>MSI-H 或 dMMR 的第 II 期不需要輔助化療</b>（預後好，而且不從 ' + NR('5-FU') + ' 得到好處）。');
      L.push('<b>pMMR／MSS 且沒有高風險特徵</b> → 觀察，或 capecitabine 或 5-FU/leucovorin 單方；' +
        '<b>不加 ' + NR('oxaliplatin') + '</b>（第 II 期加 ' + NR('oxaliplatin') + ' 的存活好處未獲證實）。');
      L.push('<b>pMMR／MSS 且有高風險特徵，或 pT4 N0</b> → FOLFOX、CapeOX、臨床試驗或觀察四者並列。');
      L.push('<b>第 II 期的全身性復發高風險特徵（七項，符合任一項即是）：</b>' + SUB([
        '<b>Grade 3–4</b>（分化不良或未分化）',
        '<b>淋巴管或血管侵犯</b>',
        '<b>腸阻塞</b>',
        '<b>檢出的淋巴結 &lt; 12 顆</b>',
        '<b>神經周圍侵犯</b>',
        '<b>局部穿孔</b>',
        '<b>切緣過近、無法判定或陽性</b>'
      ]));
    } else if (p.g === 'low') {
      L.push('<b>低風險第 III 期（pT1–3 N1）：CapeOX 3 個月，或 FOLFOX 3–6 個月</b>；' +
        '不能用 oxaliplatin 時可用 capecitabine 或 5-FU 6 個月。');
      L.push('<b>想打 3 個月就選 CapeOX</b> —— CapeOX 3 個月不劣於 6 個月；' +
        'FOLFOX 3 個月對 6 個月的非劣性未獲證實（COL-3(2) 註 h）。');
    } else {
      L.push('<b>高風險第 III 期（pT4、或 N1–2 合併 T4、或任何 T 且 N2）：CapeOX 3–6 個月，' +
        '或 FOLFOX 打滿 6 個月</b>。');
      L.push('<b>FOLFOX 3 個月的無病存活「劣於」6 個月</b> —— 選 FOLFOX 就要打滿（COL-3(2) 註 h）。');
    }
    L.push('<b>沒有禁忌就在術後 6 週內開始輔助化療</b>（COL-3(1)）。');
    L.push('<b>' + NR('bevacizumab、cetuximab、panitumumab、irinotecan') + ' 不可以用在輔助情境</b>' +
      '（臨床試驗除外；COL-3(1) 註 c）。');

    fill('rc_r_up_adj', p.g === 'high' ? 'rec-urgent' : 'rec-elective',
      ptnName() + '<br>→ 輔助 CCRT ＋ ' +
      (p.g === 'ii' ? '依第 II 期原則決定化療' : (p.g === 'low' ? '低風險第 III 期化療' : '高風險第 III 期化療')),
      L, 'COL-12(1)、註 c（CCRT 劑量）、註 d（術前 vs 術後 CCRT）、COL-14（適應症）、' +
      'COL-3(1)／COL-3(2)（輔助化療）、COL-10／COL-13（處方）。',
      more(rtReference(), ccrtRxTable(), chemoRxTable(), nhiAdj()));
    fu('rc_f_up', 'std');
  }

  /* A-2 需要術前治療 */
  function renderNeoPlan(g) {
    var L = [], cls, title;

    if (g === 'low') {
      cls = 'rec-elective';
      title = ctnName() + '<br>→ 先做術前治療；標準順序或 TNT 兩條都在指引內';
      L.push(H('這一格為什麼要先給藥', 'COL-12(1)、COL-14'));
      L.push('<b>COL-14 的術前 CCRT／RT 適應症第一條就是「≥ 臨床 T3 或 N 陽性」</b> —— 這一格符合。');
      L.push('<b>環周切緣是乾淨的，所以手術本來就切得下來；術前治療的目的是降低局部復發，' +
        '不是為了把切不下來的變成切得下來。</b>');
      L.push(EV('COL-12(1) 註 d：<b>「CCRT 與手術的先後順序不影響第 II／III 期直腸癌的存活，' +
        '但術前 CCRT 的毒性較低」</b>，同時提醒<b>「醫師要注意冗長的 CCRT 期間有遠處進展的風險」</b>。' +
        '這句提醒正是 TNT 這條路存在的理由 —— 把全身性治療提前。'));
      L.push(H('兩條路的差別在哪裡', 'COL-12(2)'));
      L.push('<b>標準順序</b>：術前只做化放療（或短程放療）→ 手術 → <b>術後才打 FOLFOX 或 CAPEOX 12–16 週</b>。');
      L.push('<b>TNT</b>：<b>化放療與化療都在術前做完</b> → 手術 → 之後直接追蹤。');
      L.push(EV('選 TNT 的兩個實際理由：<b>① 全身性治療提早開始</b>（術後化療的完成率一向不高）；' +
        '<b>② 腫瘤退縮的機會較大，達到臨床完全緩解時可以討論 watch and wait</b>。'));
    } else {
      cls = 'rec-urgent';
      title = ctnName() + '<br>→ 一定要走全程術前治療（TNT）';
      L.push(H('這一格為什麼一定要 TNT', 'COL-12(1)、COL-12(3)'));
      L.push('<b>COL-12(1) 把「cT3 且 CRM 受侵犯、cT4 任何 N、局部不可切除或無法耐受手術」' +
        '整組送到 COL-12(3)，而 COL-12(3) 只列 TNT 一種策略</b>（兩個順序都可以）。');
      L.push('<b>這一格直接開刀切不乾淨</b> —— CRM 受侵犯代表腫瘤已經到直腸繫膜筋膜、提肛肌或括約肌間平面。');
      L.push(EV('<b>乾淨的 CRM 定義：距直腸繫膜筋膜 &gt; 1 mm、未侵犯提肛肌、且未侵入括約肌間平面</b>' +
        '（COL-12(3) 註 a）。差的就是這 1 mm —— 它決定了走哪一整條流程。'));
      L.push(H('一件不能做的事', 'COL-12(3) 註 e'));
      L.push('<b>FOLFOXIRI 在這個情境不建議使用。</b>');
    }

    L.push(H('術前治療的三個組成', 'COL-12(2)、COL-12(3)'));
    L.push('<b>① 長程化放療</b>：capecitabine 或持續輸注 5-FU 合併放射治療。' +
      '<b>不能耐受這兩者的人，可以改用 bolus 5-FU/leucovorin 合併放射治療</b>（註 b）。');
    L.push('<b>② 短程放射治療</b>：25 Gy 分 5 次。' +
      '<b>要不要用短程放療必須在多專科的場合評估，並討論「需不需要降期」與「長期毒性的可能」</b>（註 c）。');
    L.push('<b>③ 化療</b>：FOLFOX 或 CAPEOX，<b>12–16 週</b>。');

    fill('rc_r_ctn', cls, title, L,
      'COL-12(1)（臨床分期分流）、COL-12(2)／COL-12(3)（術前治療的內容）、註 a（CRM 定義）、' +
      '註 b（不耐受時的替代）、註 c（短程放療的評估）、註 e（不用 FOLFOXIRI）、COL-14（放療適應症）。',
      more(rtReference()));

    show('rc_b_neo', true);
    if (g === 'high') {
      /* COL-12(3) 只列 TNT 一種策略，所以不問「標準還是 TNT」，直接問順序。 */
      S.strat = 'tnt';
      setNum('rc_n_order', '3');
      show('rc_n_order', true);
      if (!S.order) return;
      renderNeoRx(true, '4');
      return;
    }

    setNum('rc_n_strat', '3');
    show('rc_n_strat', true);
    if (!S.strat) return;
    if (S.strat === 'std') { renderNeoRx(false, '4'); return; }
    setNum('rc_n_order', '4');
    show('rc_n_order', true);
    if (!S.order) return;
    renderNeoRx(true, '5');
  }

  function renderNeoRx(isTnt, restageNum) {
    var L = [], title, cls = 'rec-elective';

    if (!isTnt) {
      title = '標準順序<br>→ 術前化放療或短程放療 → 手術 → 術後 FOLFOX 或 CAPEOX 12–16 週';
      L.push(H('術前要給什麼', 'COL-12(2)'));
      L.push('<b>長程化放療</b>（capecitabine 或持續輸注 5-FU ＋ 放射治療），' +
        '<b>或短程放射治療</b>（25 Gy 分 5 次）—— 兩者擇一。');
      L.push(H('什麼時候再分期', 'COL-12(2)'));
      L.push('<b>放射治療結束後 8 週考慮再分期</b>（最佳的腫瘤反應出現在這個時間）。');
      L.push(EV('COL-12(1) 註 c 另寫「<b>CCRT 完成後 6 週開刀</b>」。' +
        '兩個數字不衝突 —— 6 週是排刀的時間，8 週是評估最佳反應的時間；' +
        '走 watch and wait 評估的人會等到 8 週。'));
      L.push(H('手術之後', 'COL-12(2)'));
      L.push('<b>經腹切除後，術後打 FOLFOX 或 CAPEOX 12–16 週</b>，然後進入追蹤。');
      L.push('<b>圍手術期治療合計以不超過 6 個月為原則。</b>');
    } else if (S.order === 'rtfirst') {
      title = 'TNT · 先化放療再化療<br>→ 化放療（或短程放療）→ FOLFOX／CAPEOX 12–16 週 → 手術';
      L.push(H('順序', 'COL-12(2)、COL-12(3)'));
      L.push('<b>① 長程化放療</b>（capecitabine 或持續輸注 5-FU ＋ 放射治療）<b>，或短程放射治療</b>（25 Gy 分 5 次）。');
      L.push('<b>② 接著打 FOLFOX 或 CAPEOX，12–16 週。</b>');
      L.push('<b>③ 放射治療結束後 6–12 週再分期</b>，然後手術。');
      L.push(EV('先做放射治療的好處是<b>局部控制先落地</b>，而且 CRM 受侵犯的病人可以早一點看到降期。' +
        '代價是全身性治療晚幾週開始。'));
    } else {
      title = 'TNT · 先化療再化放療<br>→ FOLFOX／CAPEOX 12–16 週 → 化放療（或短程放療）→ 手術';
      L.push(H('順序', 'COL-12(2)、COL-12(3)'));
      L.push('<b>① 先打 FOLFOX 或 CAPEOX，12–16 週。</b>');
      L.push('<b>② 接著做長程化放療（或短程放射治療）。</b>');
      L.push('<b>③ 放射治療結束後 6–12 週再分期</b>，然後手術。');
      L.push(EV('先做化療的好處是<b>全身性治療最早開始</b> —— 直接對應 COL-12(1) 註 d 提醒的' +
        '「冗長的 CCRT 期間有遠處進展的風險」。代價是局部控制晚幾週。'));
    }

    if (isTnt) {
      L.push(H('TNT 之後的一個差別', 'COL-12(2)、COL-12(3)'));
      L.push('<b>TNT 做完手術之後直接進入追蹤 —— 指引沒有再排術後化療</b>' +
        '（全身性治療已經在術前給完了）。');
    }

    L.push(H('開始之前要處理的事', 'COL-12(1)'));
    L.push('<b>造口治療師術前定位與衛教</b>（不論最後有沒有做造口，位置都要先標）。');
    L.push('<b>適當病人要討論生育功能保存</b> —— 骨盆放射治療會影響生育。');
    L.push('<b>建議多專科團隊評估。</b>');
    L.push('<b>轉移性的基因狀態（RAS、BRAF ± HER2 amplification）要一併確定</b>（COL-12(1) 註 h）。');

    fill('rc_r_neo', cls, title, L,
      'COL-12(2)／COL-12(3)（術前治療的順序與時程）、COL-12(1) 註 c／註 d／註 h、COL-13（化放療處方）、' +
      'COL-10（FOLFOX／CAPEOX 處方）、COL-15／COL-16（放療設定與靶區）。',
      more(ccrtRxTable(), chemoRxTable(), rtReference(), nhiAdj()));

    show('rc_b_restage', true);
    setNum('rc_n_restage', restageNum);
    show('rc_n_restage', true);
    if (!S.restage) return;
    renderRestage(isTnt, String(parseInt(restageNum, 10) + 1));
  }

  function renderRestage(isTnt, sysNum) {
    var L = [], cls, title;

    if (S.restage === 'op') {
      cls = 'rec-elective';
      title = '可以做經腹切除<br>→ 手術，' + (isTnt ? '之後直接追蹤' : '之後補 FOLFOX 或 CAPEOX 12–16 週');
      L.push(H('手術', 'COL-12(2)、COL-12(3)'));
      L.push('<b>Transabdominal resection</b> —— 標準是<b>全直腸繫膜切除（TME）</b>。');
      L.push(EV('COL-12(1) 註 c：<b>CCRT 完成後 6 週開刀</b>。'));
      L.push(H('手術之後', isTnt ? 'COL-12(3)' : 'COL-12(2)'));
      if (isTnt) {
        L.push('<b>TNT 已經把化放療與化療都給完了，指引在這裡直接接到追蹤（surveillance）。</b>');
      } else {
        L.push('<b>術後打 FOLFOX 或 CAPEOX 12–16 週</b>，然後進入追蹤。');
        L.push('<b>圍手術期治療合計以不超過 6 個月為原則。</b>');
      }
      L.push(H('術後病理若出現這兩種狀況', 'COL-14'));
      L.push('<b>切緣陽性或過近 → 仍是輔助 CCRT 的適應症</b>（如果術前只做過短程放療，這一點要重新評估）。');
      L.push('<b>要保留肛門的病人 → 也在輔助 CCRT 的適應症內。</b>');
      fill('rc_r_restage', cls, title, L,
        'COL-12(2)／COL-12(3)（再分期後之經腹切除）、COL-12(1) 註 c、COL-14（輔助 CCRT 適應症）。',
        more(chemoRxTable(), rtReference(), nhiAdj()));
      fu('rc_f_restage', 'std');
      return;
    }

    if (S.restage === 'ccr') {
      cls = 'rec-elective';
      title = '達到臨床完全緩解<br>→ watch and wait 可以討論，但條件很嚴格';
      L.push(H('指引怎麼寫的', 'COL-12(2)／COL-12(3) 註 d'));
      L.push('<b>「達到臨床完全緩解，而且肛門指診、直腸磁振造影與直接內視鏡評估都沒有殘存病灶的證據者，' +
        '在有經驗的多專科團隊的中心，可以考慮 watch and wait 的非手術處置。」</b>');
      L.push('<b>三項評估缺一不可</b>：' + SUB([
        '<b>肛門指診</b>（digital rectal examination）',
        '<b>直腸磁振造影</b>（rectal MRI）',
        '<b>直接內視鏡評估</b>（direct endoscopic evaluation）'
      ]));
      L.push(H('指引明講的不確定', 'COL-12(2)／COL-12(3) 註 d'));
      L.push('<b>「相較於標準的手術切除，局部及／或遠處失敗的風險增加多少，目前尚未被充分刻畫。」</b>');
      L.push('<b>「非手術處置的決定，應包含與病人針對其風險承受度的仔細討論。」</b>');
      L.push(EV('這兩句是指引自己寫的保留 —— <b>不是「效果一樣好」，是「還不知道差多少」</b>。' +
        '和病人談的時候要把這句話原封不動地傳達。'));
      L.push(H('台大指引沒有寫的部分', ''));
      L.push('<b>台大指引沒有列 watch and wait 的追蹤時程、影像頻率、也沒有列再生長時的處置。</b>' +
        '要走這條路，追蹤方案請以多專科團隊的共識為準，本頁不代為訂定。');
      L.push('<b>選擇經腹切除仍然是這一格的標準選項</b> —— 回到上一步改選「可以做經腹切除」。');
      fill('rc_r_restage', cls, title, L,
        'COL-12(2)／COL-12(3) 註 d（watch and wait 的原文四點）。',
        more(wwReference()));
      fu('rc_f_restage', 'std');
      return;
    }

    cls = 'rec-urgent';
    title = '手術有禁忌，或仍然無法切除<br>→ 改走全身性治療';
    L.push(H('處置', 'COL-12(2)、COL-12(3)'));
    L.push('<b>指引在這一格寫的是 systemic therapy</b> —— 也就是接到 COL-8 的治療菜單。');
    L.push('<b>FOLFOXIRI 在這個情境不建議使用</b>（COL-12(2) 註 e、COL-12(3) 註 e）。');
    L.push(H('骨盆症狀要另外處理', 'COL-12(1)'));
    L.push('<b>出血、阻塞、疼痛時，放射治療、支架、造口都在選項內</b>，' +
      '不必等全身性治療見效。');
    L.push(H('下一步', ''));
    L.push('<b>下面的步驟開始決定要用什麼藥。</b>');
    fill('rc_r_restage', cls, title, L,
      'COL-12(2)／COL-12(3)（resection contraindicated → systemic therapy）、註 e、COL-8。', null);
    showSys(sysNum);
  }

  /* ---------- B. M1 ---------- */
  function renderM1() {
    show('rc_b_m1', true);
    show('rc_n_mres', true);
    if (!S.mres) return;

    if (S.mres === 'res') {
      fill('rc_r_m1', 'rec-elective',
        '轉移病灶可以切除<br>→ 先做術前治療，再同時或分期切除轉移與直腸病灶', [
        H('術前的三個選項', 'COL-12(1)'),
        '<b>① CCRT</b>（化放療同步）',
        '<b>② 新輔助化療</b>（依 COL-3、COL-6 的處方）',
        '<b>③ pembrolizumab —— 限 dMMR／MSI-H</b>',
        H('再分期', 'COL-12(1) 註 g'),
        '<b>放射治療結束後 6–12 週再分期</b>（最佳的腫瘤反應在這個時間；此註限長程化放療）。',
        H('手術', 'COL-12(1)'),
        '<b>分期或同時切除轉移病灶與直腸病灶</b>（staged or synchronous resection）。',
        H('手術之後', 'COL-12(1)、COL-14'),
        '<b>CCRT，或接 COL-8 的全身性治療。</b>',
        '<b>COL-14 明列「M1 且轉移與直腸病灶已同時切除者」是術後 CCRT 的適應症之一</b> —— ' +
          '如果術前沒有做過放射治療，這一條就會用上。',
        H('pembrolizumab 這一條要注意', ''),
        EV('健保 9.69(11) 給付的是「<b>無法切除或轉移性</b> MSI-H／dMMR 大腸直腸癌的<b>第一線</b>」。' +
          '轉移可切除的病人用在術前，<b>字面上不在條文範圍內</b>，申請前要先確認。' +
          '指引 COL-6 註 h 原本寫「需自費」，那一句在「無法切除或轉移性」的情境已經不成立。'),
        H('多專科團隊', 'COL-12(1)'),
        '<b>這一格一定要多專科團隊評估</b>，而且要有做過肝膽或肺轉移切除的外科醫師參與（COL-4）。'
      ], 'COL-12(1)（T any N any M1 可切除轉移）、註 g（再分期時機）、COL-14（術後 CCRT 適應症）、' +
        'COL-6（處方與圍手術期上限）；健保 9.69 查詢日 2026-08-16。',
        more(ccrtRxTable(), chemoRxTable(), metaRxTable(S.bio, S.line), rtReference(), nhiMeta()));
      fu('rc_f_m1', 'meta');
      return;
    }

    show('rc_n_msym', true);
    if (!S.msym) return;

    var L = [], cls, title;
    if (S.msym === 'sym') {
      cls = 'rec-urgent';
      title = '轉移不可切除、直腸原發灶有症狀<br>→ 先讓症狀受控，再談全身性治療';
      L.push(H('五個並列的選項', 'COL-12(1)'));
      L.push('<b>① CCRT</b>　<b>② 造口（colostomy）</b>　' +
        '<b>③ 切除受侵犯的直腸段</b>　<b>④ 支架（stenting）</b>　<b>⑤ 全身性治療</b>');
      L.push('<b>選哪一個取決於症狀是什麼</b>：出血或疼痛為主 → 放射治療；' +
        '阻塞為主 → 造口或支架；穿孔或廔管 → 手術。');
      L.push(EV('指引把五個並列、沒有排序。<b>這一格的目標是症狀控制，不是根治</b>，' +
        '所以「哪一個最快讓病人舒服、又最不耽誤全身性治療」才是判準。'));
    } else {
      cls = 'rec-nonop';
      title = '轉移不可切除、直腸原發灶沒有症狀<br>→ 直接走緩和性全身治療';
      L.push(H('處置', 'COL-12(1)'));
      L.push('<b>緩和性全身治療（COL-8），並對選擇性病人考慮局部治療。</b>');
      L.push('<b>沒有症狀的原發灶不需要先切。</b>');
      L.push(EV('切了不會改善存活，而且會延遲全身性治療的開始。' +
        '「選擇性病人的局部治療」指的是預期會出問題（例如接近完全阻塞）的個案。'));
    }
    L.push(H('下一步', ''));
    L.push('<b>下面的步驟 4 開始決定要用什麼藥。</b>');

    fill('rc_r_m1', cls, title, L, 'COL-12(1)（T any N any M1 不可切除轉移或無法耐受手術）。',
      more(rtReference()));
    showSys('4');
  }

  /* ---------- 共用：全身性治療 COL-8 ---------- */
  function showSys(baseNum) {
    var n = parseInt(baseNum, 10);
    show('rc_b_sys', true);
    setNum('rc_n_bio', String(n));
    setNum('rc_n_fit', String(n + 1));
    setNum('rc_n_line', String(n + 2));
    show('rc_n_bio', true);
    if (!S.bio) return;
    show('rc_n_fit', true);
    if (!S.fit) return;
    show('rc_n_line', true);
    if (!S.line) return;
    renderSys();
  }

  function bioLabel() {
    return { msi: 'dMMR／MSI-H', wt: 'RAS／BRAF 都沒有突變', ras: 'RAS 突變', braf: 'BRAF V600E 突變' }[S.bio];
  }
  function lineLabel() {
    return { l1: '第一線', l2: '第二線', l3: '第二次進展之後', l4: '第三次進展之後' }[S.line];
  }
  function sysHeadline() {
    if (S.fit === 'no') return '低強度起步，體能改善再升階';
    if (S.line === 'l1') return (S.bio === 'msi' ? 'pembrolizumab，或化療骨架加標靶' : '化療骨架加標靶');
    if (S.line === 'l2') return (S.bio === 'braf' ? 'encorafenib ＋ cetuximab' : '換掉第一線用過的那一支');
    return '後線單藥依序使用';
  }

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
      L.push('<b>cetuximab 與 panitumumab 也只能擇一，終生不得互換。</b>');
      L.push(EV('原發腫瘤的左右側在第一線會影響 anti-EGFR 的效果 —— ' +
        '<b>右側（肝曲到盲腸）反應機會低</b>（COL-8(3) 註 a）。' +
        '<b>直腸屬於左側</b>（指引把左側定義為脾曲到直腸），所以這一點對直腸癌是有利的。'));
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
    L.push(H('健保對第一線的兩個上限', '9.37、9.10'));
    L.push('<b>bevacizumab 第一線總療程上限 36 週</b>，事前審查每次 18 週。');
    L.push('<b>oxaliplatin 條文寫「治療轉移性結腸直腸癌，惟若再加用 irinotecan 則不予給付」</b> —— ' +
      '<b>FOLFOXIRI／FOLFIRINOX 的 oxaliplatin 不給付。</b>');
    return L;
  }

  function renderSys() {
    var L = [], cls = 'rec-elective';
    var title = bioLabel() + '　·　' + (S.fit === 'yes' ? '可耐受 intensive therapy' : '不適合 intensive therapy') +
      '　·　' + lineLabel() + '<br>→ ' + sysHeadline();

    if (S.fit === 'no') {
      L.push(H('第一線的選項', 'COL-8(3)'));
      if (S.bio === 'msi') {
        L.push('<b>nivolumab 或 pembrolizumab 單用</b>，或 <b>nivolumab ＋ ipilimumab</b>（都限 dMMR／MSI-H）。');
        L.push(EV('體能不好的 MSI-H 病人，免疫治療反而是最適合的一條 —— 毒性型態和化療完全不同。'));
      }
      L.push('<b>持續輸注 5-FU ＋ leucovorin ± bevacizumab</b>，或 <b>capecitabine ± bevacizumab</b>。');
      if (S.bio === 'wt') {
        L.push('<b>cetuximab 或 panitumumab</b> —— 條件是 <b>KRAS／NRAS／BRAF 都是 wild-type，' +
          '而且原發腫瘤在左側</b>；<b>直腸屬於左側</b>（指引定義左側為脾曲到直腸），所以這一格適用。');
      } else if (S.bio === 'ras' || S.bio === 'braf') {
        L.push(EV('這一格<b>不能用 anti-EGFR</b>：' +
          (S.bio === 'ras' ? '任何已知的 KRAS 或 NRAS 突變都是禁忌（COL-8(1) 註 d）。'
            : 'BRAF V600E 者反應機會極低，COL-8(3) 的 anti-EGFR 選項也限 BRAF wild-type。')));
      }
      L.push('<b>或直接進入 best supportive care。</b>');
      L.push(H('接下來看什麼', 'COL-8(3)'));
      L.push('<b>體能狀態有改善 → 升階到 intensive therapy（回上面把步驟改成「可以」）。</b>');
      L.push('<b>體能狀態沒有改善 → best supportive care。</b>');
      fill('rc_r_sys', 'rec-nonop', title, L,
        'COL-8(3)（不適合 intensive therapy）、註 a（左側與右側）、COL-11（處方）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('rc_f_sys', 'palli');
      return;
    }

    if (S.bio === 'msi' && S.line === 'l1') {
      L.push(H('第一線就用免疫治療', 'COL-8(2)'));
      L.push('<b>pembrolizumab</b>（限 dMMR／MSI-H）—— COL-8(2) 把它與化療並列為第一線。');
      L.push('<b>健保 9.69(11) 自 2025/06/01 起給付 pembrolizumab 於無法切除或轉移性 MSI-H／dMMR 的第一線</b>' +
        '（查詢日 2026-08-16）。指引 COL-7 註 f、COL-8(1) 註 h 寫的「需自費」<b>已經不成立</b>。');
      L.push(EV('<b>nivolumab 與 ipilimumab 用於大腸直腸癌仍然不在健保條文內</b>。'));
      L.push(H('開始之前一定要想清楚的一件事', '健保 9.69 通則 (4)'));
      L.push('<b>條文原文：「治療期間亦不可合併申報該適應症之標靶藥物，無效後或給付時程期滿後' +
        '則不再給付該適應症相關之標靶藥物」，而大腸直腸癌不在除外名單內。</b>');
      L.push('<b>依此條文，先用了 pembrolizumab 的病人，之後的 ' + NR('bevacizumab、cetuximab、panitumumab') + ' ' +
        '將不再給付。</b>第一線就要把整條路想完。');
      L.push(EV('其他 9.69 通則：給付期限自初次處方起算 <b>2 年</b>；事前審查每次 12 週；' +
        '初次申請要 <b>ECOG ≤ 1</b>；大腸直腸癌不需檢附 PD-L1 報告；' +
        '連續兩次評估都是 stable disease 者不得續用。'));
      L = L.concat(firstLineChemoLines());
      fill('rc_r_sys', cls, title, L,
        'COL-8(2)（pembrolizumab 第一線）、COL-8(1)、COL-11（處方）；健保 9.69 查詢日 2026-08-16。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('rc_f_sys', 'palli');
      return;
    }

    if (S.line === 'l1') {
      L = L.concat(firstLineChemoLines());
      if (S.bio === 'braf') {
        L.push(H('BRAF V600E 在第一線的注意事項', 'COL-6 註 c、健保 9.134'));
        L.push('<b>第一線不加 anti-EGFR</b>，而且<b>不可以在第一線把 anti-EGFR 用掉</b> —— ' +
          '用掉了第二線的 ' + NR('encorafenib ＋ cetuximab') + ' 就不符合健保 9.134「未曾接受過 anti-EGFR」。');
        L.push('<b>第一線要把 bevacizumab 那條路先走完</b>，這也是 9.134 的前提條件之一。');
      }
      fill('rc_r_sys', cls, title, L, 'COL-8(1)、COL-8(2)（第一線）、COL-11（處方）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('rc_f_sys', 'palli');
      return;
    }

    if (S.line === 'l2') {
      L.push(H('第二線的骨架：換掉第一線用過的那一支', 'COL-8(1)'));
      L.push('<b>第一線用 FOLFOX-like → 第二線換成含 irinotecan 的處方</b>：' +
        'FOLFIRI ± bevacizumab，或 irinotecan ± bevacizumab。');
      L.push('<b>第一線用 FOLFIRI-like → 第二線換成含 oxaliplatin 的處方</b>：FOLFOX-like。');
      if (S.bio === 'wt') {
        L.push(H('這一格可以加 anti-EGFR', 'COL-8(1)'));
        L.push('<b>FOLFIRI 或 irinotecan ± cetuximab 或 panitumumab</b>；' +
          '第一線用 FOLFIRI 者則是 <b>FOLFOX-like ± cetuximab 或 panitumumab</b>。' +
          '<b>限 KRAS／NRAS／BRAF 都是 wild-type。</b>');
        L.push(EV('健保 9.27／9.53 的後線條件是「已接受過含 5-FU、irinotecan、oxaliplatin 之二線以上' +
          '細胞毒性治療失敗」，每次 9 週、總上限 18 週 —— 條文的「後線」比指引的「第二線」更晚。'));
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
        L.push(EV('這一條把 anti-EGFR 變成「一生只能打一次的牌」 —— ' +
          'BRAF V600E 的病人要在第二線就決定要把它用在哪裡。'));
      }
      if (S.bio === 'ras') {
        L.push(EV('<b>RAS 突變者全程不能用 anti-EGFR</b>（COL-8(1) 註 d），' +
          '所以第二線的標靶只有抗血管新生那一類。'));
      }
      L.push(H('抗血管新生藥在第二線', 'COL-8(1) 註 e～註 g'));
      L.push('<b>bevacizumab 進展後續用是美國核准、但台灣未核准</b>（註 e）。' +
        '健保 9.37 的第二線另有專屬條文：限 RAS 未突變、先前 anti-EGFR 無效、' +
        '<b>而且從未用過 bevacizumab</b>，總療程 24 週、劑量 5 mg/kg q2w。');
      L.push('<b>ziv-aflibercept 與 ramucirumab 指引有列，但在台大都開不到或要自費</b>：' +
        'ziv-aflibercept <b>不在台大處方集內、也沒有健保給付</b>；ramucirumab 健保 9.92 <b>只給付肝細胞癌</b>。');
      fill('rc_r_sys', cls, title, L,
        'COL-8(1)（第二線）、COL-11(1)／COL-11(2)（處方）；健保條文查詢日 2026-08-16。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      fu('rc_f_sys', 'palli');
      return;
    }

    cls = 'rec-nonop';
    L.push(H(S.line === 'l3' ? '第二次進展之後的選項' : '第三次進展之後的選項', 'COL-8(1)、COL-8(2)'));
    if (S.line === 'l3') {
      if (S.bio === 'wt') {
        L.push('<b>irinotecan ＋ cetuximab 或 panitumumab</b>（限 KRAS／NRAS／BRAF wild-type，而且之前沒用過）。');
      }
      L.push('<b>regorafenib</b>　或　<b>trifluridine ＋ tipiracil ± bevacizumab</b>。');
      if (S.bio === 'msi') L.push('<b>nivolumab ± ipilimumab，或 pembrolizumab</b>（限 dMMR／MSI-H）。');
      if (S.bio === 'braf') L.push('<b>encorafenib ＋ cetuximab</b>（限 BRAF V600E，若第二線還沒用過）。');
      L.push('<b>第一線用 FOLFIRI-like 而還沒用過 FOLFOX-like 者，這一格也可以用 FOLFOX-like。</b>');
    } else {
      L.push('<b>regorafenib</b>　或　<b>trifluridine ＋ tipiracil ± bevacizumab（先前沒用過的話）</b>。');
      L.push('<b>臨床試驗</b>　或　<b>best supportive care</b>。');
    }
    L.push(H('後線這三支藥的健保規則（最容易踩到的地方）', '9.51、9.66、9.136'));
    L.push('<b>regorafenib、trifluridine ＋ tipiracil、fruquintinib 三者的給付前提相同</b>：' +
      '先前用過 fluoropyrimidine、oxaliplatin、irinotecan 為基礎的化療<b>與 anti-VEGF</b>；' +
      '<b>若 RAS 未突變，還要再用過 anti-EGFR</b>。都要檢附 All-RAS 報告、都要事前審查。');
    L.push('<b>三者不得互相併用 —— 是依序單用，不是疊加。</b>');
    L.push(EV('<b>fruquintinib（Fruzaqla）台大處方集有這個品項，健保 9.136 自 2026/06/01 起給付</b>，' +
      '但<b>台大指引版次 21 沒有列</b>。要用請以健保條文與多專科討論為依據。'));
    L.push(H('劑量與監測', 'COL-11(2)'));
    L.push('<b>regorafenib 120–160 mg 口服 每日一次（D1–21），每 28 天一個週期；前 4 週要每週監測不良反應。</b>');
    L.push('<b>trifluridine ＋ tipiracil 35 mg/m²（以 trifluridine 計）口服 每日兩次，D1–5 與 D8–12，' +
      '28 天一個週期；單次上限 80 mg。</b>');

    fill('rc_r_sys', cls, title, L,
      'COL-8(1)／COL-8(2)（後線）、COL-11(2)（處方）；健保 9.51、9.66、9.136 查詢日 2026-08-16。',
      more(metaRxTable(S.bio, S.line), nhiMeta()));
    fu('rc_f_sys', 'palli');
  }

  /* ---------- C. 復發 ---------- */
  function renderRecur() {
    show('rc_b_recur', true);
    show('rc_n_rsite', true);
    if (!S.rsite) return;

    if (S.rsite === 'cea') {
      fill('rc_r_recur', 'rec-elective',
        'CEA 連續上升，但影像還沒找到病灶<br>→ 先做一輪檢查；陰性就 3 個月後再照一次', [
        H('第一輪檢查', 'COL-9'),
        '<b>理學檢查（含肛門指診）、大腸鏡、胸部／腹部／骨盆 CT。</b>',
        H('找到病灶', 'COL-9'),
        '<b>依復發的位置處理</b>（回到上一步改選「骨盆內局部復發」或「異時性遠處轉移」）。',
        H('沒找到病灶', 'COL-9'),
        '<b>考慮 PET-CT</b>，並<b>在 3 個月後重新做胸部／腹部／骨盆 CT</b>。',
        EV('<b>沒有可測量的病灶就無法評估療效</b>，也無法判斷是不是偽陽性。' +
          '指引的設計是用時間換確定性，不是「CEA 一升就給藥」。'),
        EV('注意 COL-6 寫「<b>直腸癌不常規建議 PET-CT</b>」；' +
          'COL-9 的「consider PET-CT」是用在 CEA 上升而常規影像陰性這個特定情境。'),
        H('順便確認的一件事', 'COL-9 註 b'),
        '<b>要確定腫瘤的 KRAS／NRAS／BRAF 狀態</b> —— 之後要決定標靶時會用到。'
      ], 'COL-9（CEA 上升的處理流程）、註 b；COL-6（直腸癌不常規做 PET-CT）。', null);
      fu('rc_f_recur', 'std');
      return;
    }

    if (S.rsite === 'distant') {
      fill('rc_r_recur', 'rec-elective',
        '異時性遠處轉移<br>→ 先判斷可不可以切除，再決定給藥還是開刀', [
        H('可以切除', 'COL-9'),
        '<b>考慮 PET-CT 確認沒有其他病灶</b>，並<b>由多專科團隊評估（含外科會診）</b>。',
        '<b>① 直接切除及／或局部消融</b>，或 <b>② 先給 2–3 個月新輔助化療再切除</b>。',
        '<b>術後：FOLFOX 或 CapeOx（優先）± 標靶</b>，或 <b>capecitabine 或 5-FU/leucovorin ± 標靶</b>；' +
          '也可以考慮觀察或縮短療程。<b>圍手術期總長度以 6 個月為上限。</b>',
        H('不可以切除', 'COL-9'),
        '<b>過去 12 個月內沒有用過 FOLFOX／CAPEOX → 走 COL-8 的全身性治療</b>（下面的步驟）。',
        '<b>過去 12 個月內用過 → 換成含 irinotecan 的處方</b>：FOLFIRI-like ± bevacizumab，' +
          '或 FOLFIRI-like ± ' + NR('cetuximab') + '（限 KRAS／NRAS wild-type）；' +
          '<b>BRAF V600E 者用 ' + NR('encorafenib ＋ cetuximab') + '</b>。',
        '<b>不論走哪一條，每 2 個月重新評估反應與可切除性。</b>',
        EV('COL-9 在這條路的末端特地寫了「Reassess response to determine resectability every 2 months」' +
          '—— <b>不可切除不等於永遠不可切除</b>。'),
        H('這一段的來源', ''),
        EV('COL-9 是<b>寫在大腸癌章節</b>的復發流程；台大指引的直腸癌章節（COL-12）沒有另外列復發流程。' +
          '遠處轉移的處置兩者一致，所以本頁沿用 COL-9。')
      ], 'COL-9（已證實之異時性轉移）、註 b、註 c；COL-6（圍手術期上限）。',
        more(metaRxTable(S.bio, S.line), nhiMeta()));
      showSys('3');
      return;
    }

    /* 骨盆內局部復發 —— 台大指引未列 */
    show('rc_n_rprev', true);
    if (!S.rprev) return;

    var L = [];
    L.push(H('先講清楚這一段的來源', ''));
    L.push('<b>台大醫院大腸直腸癌診療指引版次 21 沒有列直腸癌的骨盆局部復發流程</b>' +
      '（COL-9 是寫給大腸癌的，內容是異時性遠處轉移）。');
    L.push('<b>以下屬院外實證</b>，出處為指引自己在 COL-18 引用的 ' +
      'NCCN Clinical Practice Guidelines in Oncology — Rectal Cancer（rectal 2026v1），' +
      '以及本頁「主要文獻」列出的、已逐筆核對過 PubMed 的研究。');

    L.push(H('第一步：確認範圍與能不能 R0 切除', ''));
    L.push('<b>骨盆磁振造影</b>看侵犯範圍（薦骨、側壁、泌尿生殖器官）；' +
      '<b>胸部／腹部／骨盆 CT</b>排除同時的遠處轉移；<b>切片證實</b>是復發而不是放療後纖維化。');
    L.push('<b>PET-CT 在這個情境有幫助</b> —— 用來分辨纖維化與活性腫瘤，並找出隱藏的遠處病灶。');
    L.push('<b>能不能達成 R0 切除，是這一格唯一真正重要的問題。</b>' +
      '有遠處轉移、或評估後無法 R0，就以全身性治療與症狀控制為主。');

    L.push(H('第二步：手術', ''));
    L.push('<b>孤立性的骨盆局部復發，R0 切除是唯一有根治機會的做法</b>；' +
      '範圍常常需要做到<b>骨盆廓清（pelvic exenteration）</b>，' +
      '必要時合併薦骨切除。<b>這是高風險手術，要在有經驗的中心進行。</b>');

    if (S.rprev === 'nort') {
      L.push(H('第三步：放射治療（沒有照射過的病人）', 'COL-14、COL-15'));
      L.push('<b>沒有照射過骨盆的病人，術前化放療是標準做法</b> —— ' +
        '劑量與靶區依 COL-15、COL-16（長程 45–60 Gy，每次 ≥ 1.8 Gy、每週 5 次）。');
      L.push('<b>這一格比照射過的病人容易處理很多</b>，因為劑量還有空間。');
    } else {
      L.push(H('第三步：再放射治療（已經照射過的病人）', '院外實證'));
      L.push('<b>再放射治療（re-irradiation）的證據有限</b>，一篇系統性回顧的結論是：' +
        '<b>只限選擇性病人、要限縮照射體積、用超分割合併化療、而且要在專家中心執行</b>。');
      L.push('<b>不要把它當成常規選項</b> —— 骨盆已經照過一輪，小腸、膀胱與薦神經叢的耐受量都所剩無幾。');
    }

    L.push(H('第四步：不能開刀時', ''));
    L.push('<b>全身性治療（COL-8）</b>，並針對症狀處理：' +
      '<b>出血或疼痛 → 放射治療；阻塞 → 造口或支架；廔管 → 轉流</b>。');
    L.push('<b>骨盆疼痛常常需要早期照會疼痛科或安寧共同照護</b> —— 這一格的症狀負擔特別重。');

    fill('rc_r_recur', 'rec-urgent',
      '骨盆內局部復發' + (S.rprev === 'rt' ? '、之前照射過' : '、之前沒照射過') +
      '<br>→ 先確認能不能 R0 切除，再決定放療與手術策略', L,
      '台大指引未列直腸復發流程；本段依 COL-18 所引用之 NCCN rectal 2026v1，' +
      '並參考本頁主要文獻（re-irradiation 之系統性回顧、骨盆廓清之 R0 結果）。',
      more(rtReference(), metaRxTable(S.bio, S.line), nhiMeta()));
    fu('rc_f_recur', 'palli');
  }

  /* ==========================================================
     7. 最下方：遺傳性大腸直腸癌
     ========================================================== */
  function hereditaryBlock() {
    var L = [];
    L.push(H('什麼時候要懷疑遺傳性大腸直腸癌？', '台大指引 COL-1 註 b、COL-2 註 a、COL-3(1) 註 a'));
    L.push('<b>指引只寫了兩句，但這兩句涵蓋所有人</b>：' + SUB([
      '<b>「所有大腸癌病人都要做家族史諮詢」</b>',
      '<b>「所有 &lt; 70 歲的病人都應該考慮做 MMR 蛋白檢測」</b>（COL-18）'
    ]));
    L.push(EV('<b>家族史問診沒有門檻，是每個人都要做的</b>；MMR 檢測則以 70 歲為分界。' +
      '台大指引沒有再列細部的臨床判準。'));

    L.push(H('要驗哪些基因？', '台大指引未列，屬院外實證'));
    L.push('<b>第一步不是驗基因，是驗腫瘤：MMR 免疫組織化學染色（MLH1、MSH2、MSH6、PMS2）或 MSI 檢測。</b>');
    L.push('<b>MLH1 表現喪失時要先排除後天原因</b>：驗 <b>BRAF V600E</b> 或 <b>MLH1 啟動子甲基化</b>；' +
      '這兩者陽性通常代表是<b>散發性</b>的，不是 Lynch syndrome。');
    L.push('<b>懷疑 Lynch syndrome 時驗 germline：MLH1、MSH2、MSH6、PMS2、EPCAM</b>（EPCAM 缺失會讓 MSH2 失活）。');
    L.push('<b>大腸有多發息肉時驗的是另一組：APC</b>（家族性腺瘤性息肉症）<b>與 MUTYH</b>' +
      '（雙套等位基因缺陷才發病，是體染色體隱性）。');
    L.push(EV('以上基因清單<b>台大大腸直腸癌診療指引版次 21 全文沒有列</b>，' +
      '本頁引自 NCCN Genetic/Familial High-Risk Assessment: Colorectal, Endometrial, and Gastric，' +
      '本頁查核之公開版本為 v3.2024。<b>要驗之前請照會遺傳諮詢。</b>'));

    L.push(H('驗到致病變異之後要加做什麼？', '台大指引未列，屬院外實證'));
    L.push('<b>Lynch syndrome：大腸鏡改為每 1 年一次</b>，開始的年齡也要提前。');
    L.push('<b>女性要加做子宮內膜與卵巢的評估</b> —— Lynch syndrome 的第二常見癌症是子宮內膜癌。');
    L.push('<b>手術範圍會跟著改</b>：確診 Lynch syndrome 而且還年輕的病人，' +
      '<b>切除範圍（含全大腸切除的可能）會被拿出來討論</b>，因為剩下的腸道仍有很高的異時性癌症風險。');
    L.push('<b>一等親要做 cascade testing</b>（針對已知的那一個變異點檢測）。');
    L.push(EV('把這一段放在流程最下方，是因為<b>它與病人走哪一條治療路線無關 —— 每一條都適用</b>。' +
      '但它會改變兩件很實際的事：<b>手術要切多少</b>，以及<b>家屬要不要來看門診</b>。'));

    L.push(H('台灣的檢測給付現況', '健保，查詢日 2026-08-16'));
    L.push('<b>申請 anti-EGFR（cetuximab／panitumumab）所需的 All-RAS 基因突變分析，' +
      '有伴隨式診斷給付碼 30104B</b>，須由認證實驗室執行。');
    L.push(EV('台大指引 COL-4 註 c 對 RAS／BRAF／HER2 的 NGS 檢測寫的是「未納入健保給付」。' +
      '<b>兩者不衝突</b>：伴隨式診斷給付的是「為了申請某一支藥而做的單項檢測」，不是整組 NGS 套組。'));

    return '<div class="bc-gene-h">要不要驗基因？懷疑遺傳性大腸直腸癌時怎麼做' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     8. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';

  function cardId(code) { return 'rc-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('rc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = hereditaryBlock();
  }

  function renderDrugCards() {
    var box = el('rc_drugs');
    if (!box) return;
    var txt = '';
    /* 取文字前先把 .no-rx（否定句裡的藥名、溶劑說明）整段拿掉 —— 直接讀 textContent 的話，
       「cetuximab 不可以用在輔助情境」會長出一張 Erbitux 的藥卡。 */
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      return c.textContent;
    }
    var root = el('rcPath');
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
    RC_DRUGS.forEach(function (d) {
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
      if (S.scope === 'm0') renderM0();
      else if (S.scope === 'm1') renderM1();
      else if (S.scope === 'recur') renderRecur();
    }
    renderDrugCards();
  }

  /* ==========================================================
     10. 互動
     ========================================================== */
  var SEL_GROUPS = ['rc_n1', 'rc_n_ctn', 'rc_n_ptn', 'rc_n_strat', 'rc_n_order', 'rc_n_restage',
    'rc_n_mres', 'rc_n_msym', 'rc_n_bio', 'rc_n_fit', 'rc_n_line', 'rc_n_rsite', 'rc_n_rprev'];

  var DOWNSTREAM = {
    scope: ['ctn', 'ptn', 'strat', 'order', 'restage', 'mres', 'msym', 'bio', 'fit', 'line', 'rsite', 'rprev'],
    ctn: ['ptn', 'strat', 'order', 'restage', 'bio', 'fit', 'line'],
    strat: ['order', 'restage', 'bio', 'fit', 'line'],
    order: ['restage', 'bio', 'fit', 'line'],
    restage: ['bio', 'fit', 'line'],
    mres: ['msym', 'bio', 'fit', 'line'],
    msym: ['bio', 'fit', 'line'],
    bio: ['fit', 'line'],
    fit: ['line'],
    rsite: ['rprev', 'bio', 'fit', 'line'],
    rprev: ['bio', 'fit', 'line']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function rectPick(key, val, btn) {
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
      ['rc_n1', 'scope'], ['rc_n_strat', 'strat'], ['rc_n_order', 'order'], ['rc_n_restage', 'restage'],
      ['rc_n_mres', 'mres'], ['rc_n_msym', 'msym'], ['rc_n_bio', 'bio'], ['rc_n_fit', 'fit'],
      ['rc_n_line', 'line'], ['rc_n_rsite', 'rsite'], ['rc_n_rprev', 'rprev']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /rectPick\('([a-z]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
    if (S.ctn) { var c = el('rc_ctnc_' + S.ctn); if (c) c.classList.add('selected'); }
    if (S.ptn) { var d = el('rc_ptnc_' + S.ptn); if (d) d.classList.add('selected'); }
  }

  function rectReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    var h1 = el('rc_ctn_hold'); if (h1) h1.innerHTML = '';
    var h2 = el('rc_ptn_hold'); if (h2) h2.innerHTML = '';
    render();
  }

  function initRectalPathway() { rectReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息 —— 流程圖只是
     點了沒反應。本檔曾因與 rcc-pathway.js 同樣使用 rcPick／rcReset 而失效。 */
  global.rectalPathwayHTML = rectalPathwayHTML;
  global.initRectalPathway = initRectalPathway;
  global.rectPick = rectPick;
  global.rectReset = rectReset;
})(window);
