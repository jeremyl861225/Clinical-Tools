/* ============================================================
   胰臟癌治療互動決策流程 Pancreatic Adenocarcinoma Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 全部重寫（第二版）。舊版已刪除，未沿用其程式碼。

   主要資料來源：國立臺灣大學醫學院附設醫院 胰臟癌診療指引
   （文件編號 50710-2-000030，版次 11；2026/06/16 第 87 次癌症醫療委員會
     修訂通過；PANC-1～PANC-10、PANC-A～PANC-E）。17 頁全部 render 成 PNG 逐頁核對。
   健保給付條文查詢日：2026-08-17（健保署藥品給付規定第 9 節）。

   ※ 本模組只涵蓋胰臟腺癌（pancreatic adenocarcinoma）。
     胰臟神經內分泌腫瘤在 pnet-pathway.js；IPMN／MCN 等囊性腫瘤不在本指引範圍。

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
    'scope',   // dx | postop | recur
    'mets',    // 影像上有無遠處轉移：no | yes
    'jaun',    // 黃疸與膽管炎：nojaun | chol | jaun
    'rsec',    // 可切除性（PANC-B）：res | bord | la
    'bplan',   // borderline 的策略：neo | resect
    'oper',    // 手術結果：done | unres | prog
    'ps',      // 體能狀態：good | poor
    'line',    // 線別：l1 | l2
    'rsite',   // 復發型態：local | distant
    'rint'     // 距離初次治療完成：gt6 | lt6
  ];
  KEYS.forEach(function (k) { S[k] = null; });

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/index.js 逐碼實跑核對）
     ⚠ 'FO 1QB04'、'TA 1CC06'、'TA 4CE96' 內含半形空白，任何環節都不可 trim。
     ========================================================== */
  var PC_DRUGS = [
    { key: 'gemcitabine', cards: [['17', 'GEI1CB14', 'Gemmis 健仕注射液 200 mg/6 mL']],
      flag: '條文限「晚期或無法切除」' },
    { key: 'nab-paclitaxel', cards: [['17', 'ABR1CC38', 'Abraxane 亞伯杉注射劑 100 mg', 'albumin-bound paclitaxel']],
      flag: '胰臟癌無健保給付' },
    { key: 'erlotinib', cards: [['17', 'TA 4CE96', 'Tarceva 得舒緩膜衣錠 150 mg']],
      flag: '胰臟癌無健保給付（9.29 限肺癌）' },
    { key: '5-FU', re: '5-FU|fluorouracil', cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']] },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']] },
    { key: 'irinotecan', re: '(?<!liposomal )(?<!nanoliposomal )irinotecan',
      cards: [['17', 'CAM1CE20', 'Campto 抗癌妥靜脈輸注濃縮液 100 mg/5 mL', 'irinotecan HCl']] },
    { key: 'liposomal irinotecan', re: 'liposomal irinotecan|Onivyde|nal-IRI',
      cards: [['17', 'ONI1CI13', 'Onivyde 安能得微脂體注射劑 43 mg/10 mL', 'irinotecan liposomal']] },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']] },
    { key: 'S-1', re: 'S-1|TS-1', cards: [['17', 'TS14CB44', 'TS-1 愛斯萬膠囊 20 mg', 'tegafur ＋ gimeracil ＋ oteracil']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg/50 mL']] },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑 80 mg/4 mL']] },
    { key: '胰臟酵素', re: '胰臟酵素|pancreatic enzyme|pancreatin',
      cards: [['15', 'CRE4HD15', 'Creon 25000 腸溶膠囊（lipase 25000 units）', 'pancreatin'],
              ['15', 'PRO4HD11', 'Protase 優妙化腸溶微粒膠囊', 'pancrelipase']] }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="pancPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="pc-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="pc-node" id="' + id + '">' +
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
     2. 共用參考區塊 —— 每一段只在這裡定義一次
     ========================================================== */

  /* 2a. 可切除性判定 —— 指引 PANC-B 頁的正式名稱是
     「CRITERIA DEFINING RESECTABILITY STATUS」，其中那張表逐字標題為
     「M. D. Anderson criteria for resectability of pancreatic cancer」。
     ⚠ 對外一律稱 M.D. Anderson criteria，PANC-B 只當頁碼定位用。 */
  function resectReference() {
    return fold('<b>可切除、borderline、還是切不下來？</b>三個血管的判定準則 · <b>M.D. Anderson criteria</b>',
      '<table>' +
      '<tr><td></td><td><b>看的是腫瘤和三條血管的關係，不是 TNM。</b><br>' +
      '這套準則的名字是 <b>M.D. Anderson criteria</b> —— 台大胰臟癌診療指引把它逐字收在 PANC-B 頁，' +
      '該頁標題為 <b>Criteria Defining Resectability Status</b>，表格標題為 ' +
      '<b>「M. D. Anderson criteria for resectability of pancreatic cancer」</b>。</td></tr>' +
      '<tr><td><b>SMA</b><br>上腸繫膜動脈</td><td>' +
      '<b>可切除</b>：沒有侵犯，腫瘤與動脈之間有正常脂肪層。<br>' +
      '<b>Borderline</b>：腫瘤貼合動脈周長 <b>≤ 180°（一半以下）</b>；動脈周圍條紋狀變化；' +
      '接觸點形成凸面朝向血管者，切除成功的機會較高。<br>' +
      '<b>局部晚期</b>：<b>包覆 &gt; 180°</b>。</td></tr>' +
      '<tr><td><b>腹腔動脈幹<br>／肝動脈</b></td><td>' +
      '<b>可切除</b>：沒有侵犯。<br>' +
      '<b>Borderline</b>：總肝動脈的<b>短節段包覆或貼合</b>（典型在胃十二指腸動脈起始處）；' +
      '<b>外科醫師要事先準備做 vascular resection／interposition grafting</b>' +
      '（指引原文：the surgeon should be prepared for vascular resection/interposition grafting）。<br>' +
      '<b>局部晚期</b>：包覆且通常<b>無法重建</b>（因為侵犯延伸到腹腔動脈幹／脾動脈與左胃動脈交界，' +
      '或腹腔動脈幹起始處）。</td></tr>' +
      '<tr><td><b>SMV／PV</b><br>上腸繫膜靜脈<br>／門靜脈</td><td>' +
      '<b>可切除</b>：血管通暢。<br>' +
      '<b>Borderline</b>：<b>短節段阻塞，而且上下兩端都有適合吻合的血管</b>；' +
      '單純節段性靜脈阻塞而沒有 SMA 侵犯很少見，電腦斷層上應該看得出來。<br>' +
      '<b>局部晚期</b>：阻塞且<b>無法重建</b>。</td></tr>' +
      '<tr><td><b>什麼情況<br>算切不下來</b></td><td>' +
      '<b>胰頭</b>：遠處轉移／SMA 包覆 &gt; 180° 或任何腹腔動脈幹貼合／SMV 與門靜脈阻塞且無法重建／' +
      '主動脈侵犯或包覆。<br>' +
      '<b>胰體</b>：遠處轉移／SMA 或腹腔動脈幹包覆 &gt; 180°／SMV 與門靜脈阻塞且無法重建／主動脈侵犯。<br>' +
      '<b>胰尾</b>：遠處轉移／SMA 或腹腔動脈幹包覆 &gt; 180°。<br>' +
      '<b>淋巴結</b>：<b>轉移到切除範圍以外的淋巴結，應視為不可切除。</b></td></tr>' +
      '</table>');
  }

  /* 2b. 診斷與分期原則（PANC-A） */
  function stagingReference() {
    return fold('<b>影像與切片要怎麼做？</b>七條原則（PANC-A）',
      '<ul class="rec-sub">' +
      '<li><b>#1 可切除性的判定要多專科會診</b>；<b>切除手術應該在每年執行 15–20 例以上胰臟切除的機構進行。</b></li>' +
      '<li><b>#2 影像要用胰臟專用的 CT protocol 或 MRI</b>：三相橫斷面、薄切；' +
      '最佳的多相技術包含非顯影相加動脈相、胰實質相與門靜脈相，腹部用 <b>3 mm</b> 薄切。' +
      '這樣才能精確看出腫瘤與腸繫膜血管的關係，並偵測到小至 <b>3–5 mm</b> 的轉移。</li>' +
      '<li><b>#3 PET/CT 的角色仍不明確</b>：可以在正式的胰臟 CT protocol 之後，' +
      '用於「高風險」病人偵測胰臟外轉移；<b>不能取代高品質的顯影 CT。</b></li>' +
      '<li><b>#4 內視鏡超音波（EUS）可以和 CT 互補。</b></li>' +
      '<li><b>#5 可切除的病人，EUS 導引的 FNA 優於 CT 導引</b>（診斷率較高、較安全、' +
      '腹膜種植風險可能較低）。<b>手術切除前不一定要有惡性的切片證據；' +
      '臨床高度懷疑時，切片沒有診斷出來也不應該延遲手術。</b></li>' +
      '<li><b>#6 診斷性分期腹腔鏡</b>用來排除影像看不到的轉移（<b>尤其是胰體與胰尾的病灶</b>），' +
      '部分機構常規在手術或化放療前做，或選擇性用於<b>散播風險較高者：borderline resectable、' +
      'CA 19-9 明顯升高、原發腫瘤大、或區域淋巴結大</b>。</li>' +
      '<li><b>#7 腹腔鏡或剖腹沖洗液細胞學陽性等同於 M1。</b>' +
      '<b>如果這樣的病人已經做了切除，之後仍應以 M1 治療。</b></li></ul>');
  }

  /* 2c. 處方（PANC-E） */
  function metaRxTable(ps) {
    var r = '';
    r += '<tr><td><b>gemcitabine 單方</b></td><td>800–1000 mg/m² 靜脈輸注 30 分鐘，' +
      '<b>每週一次連續 3 週，每 28 天一個週期</b>。' +
      '固定速率輸注（<b>10 mg/m²/min</b>）可以取代標準輸注</td></tr>';
    r += '<tr><td><b>capecitabine 單方</b>／<b>S-1 單方</b></td><td>指引列為可接受的單方選項</td></tr>';
    if (ps === 'good') {
      r += '<tr><td><b>NALIRIFOX</b><br>版次 11 新增</td><td>' +
        '<b>liposomal irinotecan 50 mg/m²、oxaliplatin 60 mg/m²、leucovorin 400 mg/m²、' +
        'fluorouracil 2400 mg/m²（連續靜脈輸注 46 小時），依序給予；' +
        '28 天一個週期的第 1 天與第 15 天各一次</b></td></tr>';
      r += '<tr><td><b>FOLFIRINOX</b></td><td>oxaliplatin ＋ irinotecan ＋ leucovorin ＋ 5-FU</td></tr>';
      r += '<tr><td><b>gemcitabine ＋ nab-paclitaxel</b></td><td>指引列為可接受的合併處方</td></tr>';
      r += '<tr><td><b>gemcitabine ＋ erlotinib</b></td><td>指引列為可接受的合併處方</td></tr>';
      r += '<tr><td><b>gemcitabine ＋ fluoropyrimidine</b></td><td>搭配 capecitabine、S-1 或 5-FU</td></tr>';
      r += '<tr><td><b>gemcitabine ＋ cisplatin</b></td><td><b>指引特別註明「尤其是可能的遺傳性癌症」</b></td></tr>';
      r += '<tr><td><b>GTX</b></td><td>gemcitabine ＋ docetaxel ＋ capecitabine</td></tr>';
      r += '<tr><td><b>fluoropyrimidine ＋ oxaliplatin</b></td><td>capecitabine 或 5-FU 搭配 oxaliplatin</td></tr>';
    }
    r += '<tr><td><b>第二線</b></td><td>' +
      '<b>先前沒用過 gemcitabine 的人，第二線可以用 gemcitabine。</b>' +
      '其他：capecitabine；fluoropyrimidine ＋ oxaliplatin；' +
      '<b>nanoliposomal irinotecan ＋ 5-FU/leucovorin（gemcitabine 失敗後）</b></td></tr>';
    return foldRx('<b>這個病人可以用的處方</b>（藥名、劑量、頻率；已依體能過濾；PANC-E）',
      '<table>' + r + '</table>');
  }

  function adjRxTable() {
    return foldRx('<b>術後輔助治療可以用的處方</b>（PANC-6、PANC-E）',
      '<table>' +
      '<tr><td><b>gemcitabine</b></td><td>指引列在第一個</td></tr>' +
      '<tr><td><b>5-FU/leucovorin</b></td><td></td></tr>' +
      '<tr><td><b>capecitabine</b>／<b>S-1</b></td><td>單方選項</td></tr>' +
      '<tr><td><b>gemcitabine ＋ capecitabine</b></td><td></td></tr>' +
      '<tr><td><b>FOLFIRINOX</b></td><td>oxaliplatin ＋ irinotecan ＋ leucovorin ＋ 5-FU</td></tr>' +
      '<tr><td>與化放療的搭配</td><td><b>gemcitabine 為基礎的治療常和 5-FU 為基礎的化放療「依序」合併</b>；' +
      '化放療前後可用 5-FU 或 gemcitabine</td></tr>' +
      '<tr><td>復發之後</td><td><b>先前用 fluoropyrimidine 者換 gemcitabine 為基礎；' +
      '先前用 gemcitabine 者換 fluoropyrimidine 為基礎</b></td></tr>' +
      '</table>');
  }

  /* 2d. 放射治療（PANC-D） */
  function rtReference() {
    return fold('<b>放射治療要照多少？</b>三個情境的劑量與靶區（PANC-D）',
      '<table>' +
      '<tr><td>方式與擺位</td><td>3DCRT、IMRT 或 VMAT；<b>仰臥並使用固定裝置</b>；' +
      '<b>腫瘤移動 ≥ 1 cm 者建議做呼吸控制與評估</b>（選擇性）</td></tr>' +
      '<tr><td><b>術前／borderline</b></td><td><b>接在全身化療之後或之間</b>；' +
      '<b>目前沒有標準處方</b>。分次選項（選擇性）：<b>36 Gy 分 15 次（2.4 Gy）、' +
      '45–54 Gy 分 1.8–2.2 Gy、或 40 Gy 分 10 次</b>，每日一次、每週 5 天。靶區＝原發腫瘤</td></tr>' +
      '<tr><td><b>不可切除／<br>局部晚期</b></td><td><b>接在全身化療之後或之間</b>；' +
      '<b>每次 1.8–2.5 Gy，每日一次、每週 5 天；累積總劑量最高 ≥ 45–60 Gy</b>，加或不加同步化療。<br>' +
      '<b>SBRT</b>：沒有標準處方；選項為 <b>3 次（總劑量 30–45 Gy）或 5 次（25–45 Gy）</b>；' +
      '<b>SBRT 不併用同步化療</b>。<br>靶區＝原發腫瘤加臨床陽性淋巴結；選擇性淋巴照射為選項' +
      '（<b>胰頭病灶</b>：胰十二指腸、胰上、腹腔、肝門淋巴結與整個十二指腸環；' +
      '<b>胰體／胰尾病灶</b>：胰十二指腸、肝門、外側胰上、脾門淋巴結）</td></tr>' +
      '<tr><td><b>術後</b></td><td><b>接在全身化療之後或之間</b>；' +
      '<b>每次 1.8–2.2 Gy，每日一次、每週 5 天；45–46 Gy，肉眼病灶可再加 5–9 Gy boost</b>。' +
      '靶區＝殘存腫瘤（若有）、腫瘤床周圍、手術吻合處、病理陽性淋巴結與鄰近淋巴引流區</td></tr>' +
      '<tr><td>指引的兩句限制</td><td><b>化放療應該保留給「接受全身化療期間沒有出現轉移」的病人</b>' +
      '（PANC-8 註 p）；<b>出現轉移而進展的病人不應該做化放療，除非是為了緩和</b>（PANC-E）</td></tr>' +
      '</table>');
  }

  /* 2e. 緩和與支持性照護（PANC-C） */
  function palliationReference() {
    return fold('<b>緩和與支持性照護的六件事</b>（PANC-C）',
      '<table>' +
      '<tr><td><b>膽道阻塞</b></td><td><b>內視鏡膽道支架為首選</b>；其次為經皮膽道引流後再內化；' +
      '再其次為開放性膽腸繞道</td></tr>' +
      '<tr><td><b>胃出口阻塞</b></td><td><b>體能好</b>：胃空腸吻合（開放或腹腔鏡）± J-tube，' +
      '或考慮腸道支架。<b>體能差</b>：腸道支架，或 feeding jejunostomy。' +
      '<b>體能差的病人放腸道支架特別重要</b></td></tr>' +
      '<tr><td><b>嚴重的腫瘤相關<br>腹痛</b></td><td><b>腹腔神經叢阻斷術</b>' +
      '（透視導引，沒有的話用電腦斷層導引）；' +
      '若原本的治療計畫沒有包含化放療，可考慮緩和性化放療</td></tr>' +
      '<tr><td><b>憂鬱、疼痛<br>與營養不良</b></td><td>適當時機請<b>安寧緩和醫療團隊正式評估</b></td></tr>' +
      '<tr><td><b>胰臟功能不全</b></td><td>消化酵素分泌不足 → <b>補充胰臟酵素</b></td></tr>' +
      '<tr><td><b>血栓栓塞疾病</b></td><td><b>低分子量肝素優於 warfarin</b></td></tr>' +
      '<tr><td colspan="2"><b>緩和性手術要留給預期壽命較長的病人</b>（PANC-C 註 2）；' +
      '流程圖裡的繞道手術也一律加上「<b>預估存活超過 6 個月</b>」這個前提。</td></tr>' +
      '</table>');
  }

  /* 2f. 健保條文 —— 不掃藥卡 */
  function nhiReference() {
    return fold('<b>健保怎麼給付胰臟癌的藥？</b>（第 9 節條文，查詢日 2026-08-17）',
      '<table>' +
      '<tr><td>gemcitabine<br>9.4</td><td><b>台大處方集的品項是 Gemmis</b>，而條文把 Gemmis 單獨列出來：' +
      '<b>「Gemmis 限給付於……晚期或無法手術切除之非小細胞肺癌及胰臟癌病患」</b>；' +
      '其餘廠牌則「依藥品許可證登載之適應症範圍內給付」於胰臟癌。' +
      '<br>⚠ <b>依條文字面，Gemmis 用於「已切除」的術後輔助治療不在給付範圍內</b>，' +
      '實務上以審查為準，開單前建議先確認。</td></tr>' +
      '<tr><td>oxaliplatin<br>9.10 第 3 項</td><td><b>「與 5-fluorouracil、leucovorin 及 irinotecan 併用' +
      '（FOLFIRINOX），作為轉移性胰臟癌之第一線治療」</b> —— ' +
      '<b>條文寫的是轉移性、第一線</b>，局部晚期與輔助情境不在字面內。</td></tr>' +
      '<tr><td>liposomal irinotecan<br>9.12.2（Onivyde）</td><td>' +
      '<b>① 與 5-FU 及 leucovorin 併用於「曾接受過 gemcitabine 治療後復發或惡化」之轉移性胰腺癌</b>；' +
      '<b>② 自 114/12/1 起，與 oxaliplatin、5-FU 和 leucovorin 併用，作為轉移性胰腺癌成人病人' +
      '第一線治療</b>（也就是 NALIRIFOX）。<b>兩者都需事前審查。</b></td></tr>' +
      '<tr><td>S-1<br>9.46 第 1 項</td><td><b>「治療局部晚期無法手術切除或轉移性胰臟癌病人」</b> —— ' +
      '<b>局部晚期也在條文內</b>，這一點和 oxaliplatin 不一樣。</td></tr>' +
      '<tr><td>capecitabine 9.17</td><td><b>條文的適應症清單沒有胰臟癌</b>' +
      '（乳癌、轉移性結腸直腸癌、第三期結腸癌輔助、晚期胃癌第一線）。' +
      '指引把 capecitabine 列為可接受的單方與合併選項，<b>但在胰臟癌要自費。</b></td></tr>' +
      '<tr><td>' + NR('nab-paclitaxel') + '<br>' + NR('erlotinib') + '</td><td>' +
      '<b>兩者用於胰臟癌都沒有健保給付</b>：' + NR('nab-paclitaxel') + ' 查無對應的給付條文；' +
      NR('erlotinib') + ' 9.29 的適應症限非小細胞肺癌。' +
      '指引 PANC-E 把 gemcitabine ＋ ' + NR('nab-paclitaxel') + ' 與 gemcitabine ＋ ' + NR('erlotinib') +
      ' 都列為可接受的合併處方，<b>但在台灣要自費。</b></td></tr>' +
      '<tr><td colspan="2"><b>整體來說：胰臟癌真正有健保的骨架是 gemcitabine（限晚期／無法切除）、' +
      'FOLFIRINOX 的 oxaliplatin（限轉移性第一線）、S-1（含局部晚期）、' +
      '以及 Onivyde 的兩個情境。</b>其餘多為自費，開始療程前要先算清楚。</td></tr>' +
      '</table>');
  }

  /* 2g. 追蹤 */
  function followupHTML(kind) {
    if (kind === 'palli') {
      return '<div class="fu-label">治療期間要一起處理的事（PANC-C）</div><ul class="fu-list">' +
        '<li><b>膽道阻塞</b>：內視鏡膽道支架為首選（<b>不可切除者用永久性支架</b>）。</li>' +
        '<li><b>胃出口阻塞</b>：體能好做胃空腸吻合，體能差放腸道支架或 feeding jejunostomy。</li>' +
        '<li><b>嚴重腹痛</b>：腹腔神經叢阻斷術。</li>' +
        '<li><b>胰臟功能不全 → 補充胰臟酵素</b>；營養不良與憂鬱要請安寧緩和團隊評估。</li>' +
        '<li><b>血栓栓塞：低分子量肝素優於 warfarin。</b></li>' +
        '<li>體能持續變差 → best supportive care 與安寧照護（PANC-8 註 s）。</li></ul>';
    }
    return '<div class="fu-label">術後追蹤原則（PANC-6）</div><ul class="fu-list">' +
      '<li><b>每 3 個月一次共 2 年，之後每年一次。</b></li>' +
      '<li>每次追蹤要做：<b>病史與理學檢查（評估症狀）、CA 19-9、CEA、電腦斷層</b>。</li>' +
      '<li><b>治療前的基準值要先留下來</b>：CT、CA 19-9、CEA（PANC-6 原文）。</li>' +
      '<li><b>CA 19-9 在良性膽道阻塞時也會上升</b>，要等膽道充分減壓、膽紅素正常之後測到的值才算基準；' +
      '<b>Lewis 抗原陰性的人可能完全測不到 CA 19-9</b>（PANC-2 註 b）。</li>' +
      '<li>發現復發 → 回步驟 1 選「切除後復發」。</li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function pancPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依<b>台大醫院胰臟癌診療指引</b>（版次 11，2026/06/16 癌症醫療委員會修訂通過；' +
      'PANC-1～PANC-10、PANC-A～PANC-E）編成的互動決策流程。步驟照臨床決策實際發生的先後排：' +
      '<b>影像與切片 → 有沒有轉移 → 黃疸怎麼處理 → 切不切得下來 → 開刀或先給藥 → 術後輔助 → 復發</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是可切除性準則、處方劑量、' +
      '放療劑量、健保條文與參考資料。<br>' +
      '<b>本流程只涵蓋胰臟腺癌</b>；胰臟神經內分泌腫瘤請在上方癌別選單改選「胰臟神經內分泌腫瘤」。</p>';
    h += '<div class="onc-path" id="pcPath">';

    h += node0('pc_n1', '1', '這位病人目前在哪一個階段？',
      opt('scope', 'dx', '臨床懷疑或剛確診胰臟腺癌，還在決定治療方向', 'PANC-1：從影像與轉移與否開始') +
      opt('scope', 'postop', '已經接受切除手術，要決定輔助治療與追蹤', 'PANC-6') +
      opt('scope', 'recur', '切除之後復發', 'PANC-10'));

    /* ── A. 診斷與治療方向 ── */
    h += '<div id="pc_b_dx" class="hidden">';
    h += node('pc_n_mets', '2', '胰臟專用 CT protocol 或 MRI 上，有沒有遠處轉移？（PANC-1）',
      opt('mets', 'no', '沒有遠處轉移', '') +
      opt('mets', 'yes', '有遠處轉移', ''),
      stagingReference());
    h += recBox('pc_r_mets', '建議處置 · 確認診斷與治療方向');
    h += node('pc_n_jaun', '3', '有沒有黃疸？有沒有膽管炎或發燒？（PANC-2）',
      opt('jaun', 'nojaun', '沒有黃疸', '') +
      opt('jaun', 'chol', '有黃疸，而且有膽管炎症狀或發燒', '') +
      opt('jaun', 'jaun', '有黃疸，但沒有膽管炎症狀也沒有發燒', ''));
    h += recBox('pc_r_jaun', '建議處置 · 術前處置與腫瘤標記');
    h += node('pc_n_rsec', '4', '依 M.D. Anderson criteria，這個腫瘤屬於哪一類？',
      opt('rsec', 'res', 'Resectable 可切除', '三條血管都沒有侵犯') +
      opt('rsec', 'bord', 'Borderline resectable', '短節段的血管貼合或阻塞，但有機會切除並重建') +
      opt('rsec', 'la', 'Locally advanced unresectable 局部晚期不可切除', '沒有遠處轉移，但切不下來'),
      resectReference());
    h += recBox('pc_r_rsec', '建議處置 · 這一類要怎麼走');
    h += node('pc_n_bplan', '5', 'Borderline 的兩條路要走哪一條？（PANC-4、PANC-5）',
      opt('bplan', 'neo', 'Planned neoadjuvant therapy', '先給藥，再重新評估能不能開') +
      opt('bplan', 'resect', 'Planned resection', '直接進手術室，剖腹探查'));
    h += node('pc_n_oper', '5', '手術當下的結果是哪一種？（PANC-3、PANC-4、PANC-5）',
      opt('oper', 'done', '順利完成切除', '') +
      opt('oper', 'unres', '術中發現無法切除', '') +
      opt('oper', 'prog', '疾病進展，無法進行手術', '只會發生在先做過術前治療的病人'));
    h += recBox('pc_r_oper', '建議處置 · 手術當下與之後');
    h += '</div>';

    /* ── D. 復發（PANC-10）── */
    h += '<div id="pc_b_recur" class="hidden">';
    h += node('pc_n_rsite', '2', '復發的型態是哪一種？（PANC-10）',
      opt('rsite', 'local', '局部復發', '') +
      opt('rsite', 'distant', '遠處轉移，合併或不合併局部復發', ''));
    h += node('pc_n_rint', '3', '距離初次治療完成多久？（PANC-10）',
      opt('rint', 'gt6', '超過 6 個月', '') +
      opt('rint', 'lt6', '不到 6 個月', ''));
    h += recBox('pc_r_recur', '建議處置 · 切除後復發');
    h += fuBox('pc_f_recur');
    h += '</div>';

    /* ── B. 全身治療（PANC-8、PANC-9）── */
    h += '<div id="pc_b_sys" class="hidden">';
    h += node('pc_n_ps', '3', '病人的體能狀態是哪一種？（PANC-7 註 n）',
      opt('ps', 'good', '體能好', 'ECOG 0–1，疼痛控制良好、膽道支架通暢、營養攝取足夠') +
      opt('ps', 'poor', '體能差', '不符合上面任一項'));
    h += node('pc_n_line', '4', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第二線（salvage therapy）', ''));
    h += recBox('pc_r_sys', '建議處置 · 全身治療');
    h += fuBox('pc_f_sys');
    h += '</div>';

    /* ── C. 術後輔助（PANC-6）── */
    h += '<div id="pc_b_adj" class="hidden">';
    h += recBox('pc_r_adj', '建議處置 · 術後輔助治療與追蹤');
    h += fuBox('pc_f_adj');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="pancReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="pc_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="pc_drugs"></div>';
    return h;
  }

  /* ==========================================================
     4. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }

  function collapseAll() {
    var root = el('pcPath');
    if (!root) return;
    root.querySelectorAll('.pc-node').forEach(function (n) {
      if (n.id !== 'pc_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['pc_b_dx', 'pc_b_sys', 'pc_b_adj', 'pc_b_recur'].forEach(function (id) { show(id, false); });
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
     5. 各分支
     ========================================================== */
  function renderDx() {
    show('pc_b_dx', true);
    show('pc_n_mets', true);
    if (!S.mets) return;

    if (S.mets === 'yes') {
      fill('pc_r_mets', 'rec-nonop', '影像上已有遠處轉移<br>→ 先取得病理，再走轉移性的全身治療', [
        H('要做的事', 'PANC-1'),
        '<b>以抽吸或切片確認轉移病灶＋原發病灶的診斷。</b>',
        '<b>如果拿不到轉移病灶的檢體，就從原發病灶取</b>（PANC-1 註 b）。',
        H('有黃疸的話', 'PANC-9'),
        '<b>做膽道引流，而且轉移性的病人「以永久性支架為優先」</b>（permanent stent preferred）。',
        EV('這一點和局部晚期不一樣 —— 局部晚期那一頁寫的是「可擴張金屬支架為優先」。' +
          '差別在預期存活與是否還有手術機會。'),
        H('一個要注意的排版問題', 'PANC-1'),
        EV('PANC-1 的「Metastatic disease」那條箭頭在圖上標的是「See Metastatic Disease (PANC-10)」，' +
          '<b>但 PANC-9 才是 METASTATIC DISEASE，PANC-10 是 RECURRENCE AFTER RESECTION</b>。' +
          '這是指引圖面的頁碼誤植；本頁依內容接到 PANC-9。'),
        H('下一步', ''),
        '<b>下面的步驟 3 開始決定要用什麼藥。</b>'
      ], 'PANC-1（metastatic disease → 切片確認 → 轉移性治療）、註 b、PANC-9。',
        more(palliationReference()));
      showSys('3');
      return;
    }

    fill('pc_r_mets', 'rec-elective', '影像上沒有遠處轉移<br>→ 先做多專科評估，再判定可切除性', [
      H('要做的四件事', 'PANC-1'),
      '<b>① 多專科團隊會診</b> —— 指引明列應包含<b>外科、診斷影像、介入性內視鏡、腫瘤內科、' +
        '放射腫瘤科與病理科</b>（PANC-1 註 a）。',
      '<b>② 考慮內視鏡超音波（EUS）。</b>',
      '<b>③ 肝功能檢查。</b>',
      '<b>④ 胸部影像。</b>',
      H('切片要不要先做？', 'PANC-A #5'),
      '<b>可切除的病人手術前不一定要有惡性的切片證據；臨床高度懷疑時，' +
        '切片沒有診斷出來也不應該延遲手術。</b>',
      EV('這一條常被誤解成「一定要切片才能開刀」。指引的立場相反 —— ' +
        '<b>陰性的切片不是延後手術的理由</b>。但要做切片的話，' +
        '可切除者 <b>EUS 導引的 FNA 優於 CT 導引</b>（診斷率高、腹膜種植風險可能較低）。'),
      H('影像的技術要求', 'PANC-A #2'),
      '<b>要用胰臟專用的 CT protocol：三相橫斷面、薄切，腹部 3 mm。</b>' +
        '這樣才看得出腫瘤與腸繫膜血管的關係，並偵測到小至 3–5 mm 的轉移。'
    ], 'PANC-1（no metastatic disease → multidisciplinary review）、註 a、PANC-A #2 與 #5。',
      more(stagingReference()));

    show('pc_n_jaun', true);
    if (!S.jaun) return;
    renderJaun();
  }

  function renderJaun() {
    var L = [], cls = 'rec-elective', title;
    if (S.jaun === 'chol') {
      cls = 'rec-urgent';
      title = '有黃疸，而且有膽管炎症狀或發燒<br>→ 先做暫時性膽道引流並給抗生素';
      L.push(H('順序不能顛倒', 'PANC-2'));
      L.push('<b>先做暫時性膽道引流（temporary biliary drainage）並給抗生素涵蓋，' +
        '之後才測術前的 CA 19-9 與 CEA。</b>');
      L.push(EV('這一格是唯一有時間壓力的分支 —— 膽管炎不先處理，' +
        '後面的分期與手術安排都沒有意義。'));
    } else if (S.jaun === 'jaun') {
      title = '有黃疸，但沒有膽管炎也沒有發燒<br>→ 直接測術前的 CA 19-9 與 CEA';
      L.push(H('處置', 'PANC-2'));
      L.push('<b>不需要先做膽道引流，直接測術前 CA 19-9 與 CEA。</b>');
      L.push(EV('指引把「有黃疸但沒有膽管炎」和「沒有黃疸」放在同一個結果 —— ' +
        '只有膽管炎或發燒才需要先引流。'));
    } else {
      title = '沒有黃疸<br>→ 測術前的 CA 19-9 與 CEA';
      L.push(H('處置', 'PANC-2'));
      L.push('<b>測術前 CA 19-9 與 CEA。</b>');
    }

    L.push(H('CA 19-9 的兩個判讀陷阱', 'PANC-2 註 b'));
    L.push('<b>① 良性的膽道阻塞也會讓 CA 19-9 上升</b> —— ' +
      '<b>要等膽道充分減壓、膽紅素正常之後測到的值，才能當作基準。</b>');
    L.push('<b>② Lewis 抗原陰性的人可能完全測不到 CA 19-9</b>，' +
      '這種人不能用 CA 19-9 追蹤。');
    L.push(H('接下來', 'M.D. Anderson criteria（指引 PANC-B）'));
    L.push('<b>依 M.D. Anderson criteria 的三血管準則判定可切除性</b>：resectable、borderline resectable，' +
      '或 locally advanced unresectable。');

    fill('pc_r_jaun', cls, title, L, 'PANC-2（黃疸與膽管炎的分流、術前腫瘤標記）、註 b。',
      more(palliationReference()));

    setNum('pc_n_rsec', '4');
    show('pc_n_rsec', true);
    if (!S.rsec) return;
    renderRsec();
  }

  function renderRsec() {
    if (S.rsec === 'la') {
      fill('pc_r_rsec', 'rec-urgent',
        'Locally advanced unresectable<br>→ 先取得病理，處理黃疸，再依體能決定全身治療', [
        H('先做的三件事', 'PANC-7'),
        '<b>① 沒有做過切片的話先做切片</b>（PANC-A #1 與 #5）。',
        '<b>② 有黃疸就做膽道引流 —— 這一格「以可擴張金屬支架為優先」</b>' +
          '（expandable metal stent preferred；除非在腹腔鏡或剖腹時已做過膽道繞道）。',
        '<b>③ 依體能狀態決定走哪一條治療。</b>',
        H('切片沒有確認到癌症的話', 'PANC-7'),
        '<b>重新切片，並考慮做腹腔鏡合併切片（如果之前沒做過）</b>；' +
          '<b>腹腔鏡導引的切片在這個情境可能特別有用</b>（註 m）。',
        '<b>如果確認的是其他癌症，就轉到對應的台大指引。</b>',
        H('這一格的定義提醒', 'M.D. Anderson criteria（指引 PANC-B）'),
        '<b>「切不下來」看的是血管：SMA 或腹腔動脈幹包覆 &gt; 180°、' +
          'SMV 與門靜脈阻塞且無法重建、主動脈侵犯，' +
          '以及轉移到切除範圍以外的淋巴結。</b>',
        H('下一步', ''),
        '<b>下面的步驟 5 開始依體能決定全身治療。</b>'
      ], 'PANC-7（locally advanced unresectable 的 workup）、註 l、註 m、PANC-B（M.D. Anderson criteria）。',
        more(resectReference(), palliationReference()));
      showSys('5');
      return;
    }

    if (S.rsec === 'res') {
      fill('pc_r_rsec', 'rec-elective',
        'Resectable 可切除<br>→ 直接手術；高風險者先考慮分期腹腔鏡', [
        H('手術前的選擇性步驟', 'PANC-3、PANC-A #6'),
        '<b>高風險病人或臨床有指徵時，考慮做分期腹腔鏡</b>（staging laparoscopy，選擇性）。',
        '<b>指引列出的高風險是：borderline resectable、CA 19-9 明顯升高、原發腫瘤大、' +
          '或區域淋巴結大</b>；<b>胰體與胰尾的病灶尤其要考慮</b>（PANC-A #6）。',
        EV('<b>腹腔鏡或剖腹沖洗液細胞學陽性等同於 M1</b>（PANC-A #7）—— ' +
          '而且指引寫「如果這樣的病人已經做了切除，之後仍應以 M1 治療」。' +
          '這就是為什麼要在開刀之前把它問清楚。'),
        H('手術', 'PANC-3'),
        '<b>剖腹探查 → 順利的話做切除。</b>',
        '<b>切除手術應該在每年執行 15–20 例以上胰臟切除的機構進行</b>（PANC-A #1）。',
        H('要不要先給術前治療？', 'PANC-3 註 e'),
        '<b>可切除的病人若要做術前治療，指引寫的是「考慮在臨床試驗中進行」，' +
          '而且需要切片確認為腺癌。</b>',
        '<b>有膽道阻塞的病人，要先做持久的膽道減壓。</b>',
        EV('也就是說 —— <b>可切除的胰臟癌，指引的標準做法還是直接開刀</b>，' +
          '術前治療放在臨床試驗的架構下。這和 borderline 那一格不一樣。'),
        H('下一步', ''),
        '<b>下面的步驟 5 選手術當下的結果。</b>'
      ], 'PANC-3（resectable 的 workup 與 treatment）、註 e、PANC-A #1／#6／#7。',
        more(stagingReference(), resectReference()));
      setNum('pc_n_oper', '5');
      show('pc_n_oper', true);
      if (!S.oper) return;
      renderOper();
      return;
    }

    fill('pc_r_rsec', 'rec-elective',
      'Borderline resectable<br>→ 先取得病理與膽道引流，再決定走術前治療還是直接開刀', [
      H('先做的兩件事', 'PANC-4'),
      '<b>① 切片或 FNA</b>（PANC-A #1 與 #5）。',
      '<b>② 有膽道阻塞就放暫時性引流。</b>',
      H('切片沒有確認到癌症的話', 'PANC-4'),
      '<b>重複切片。</b>再次確認不是癌症時，<b>要排除自體免疫性胰臟炎（AIP）</b>，' +
        '並考慮走 planned resection 或腹腔鏡。',
      EV('AIP 會在影像上長得很像胰臟癌 —— 這是指引在這一格特別點名的鑑別診斷。'),
      H('接下來的兩條路', 'PANC-4、PANC-5'),
      '<b>① Planned neoadjuvant therapy</b>：先給藥，之後用腹部（胰臟 protocol）、骨盆與胸部影像重新評估。',
      '<b>② Planned resection</b>：直接進手術室剖腹探查。',
      H('選術前治療時要知道的一句話', 'PANC-4 註 h'),
      '<b>「支持特定術前處方的證據有限，各家在化療與化放療的用法上做法不一。' +
        '在高機率會切出陽性切緣的情況下執行手術，並不建議。」</b>',
      EV('這句話的兩半各有意思：<b>前半是說術前處方沒有標準答案</b>；' +
        '<b>後半才是選術前治療的真正理由 —— 避免一台注定 R1 的手術。</b>'),
      H('下一步', ''),
      '<b>下面的步驟 5 選要走哪一條。</b>'
    ], 'PANC-4（borderline resectable 的 workup 與兩條路）、註 h、註 i、PANC-B（M.D. Anderson criteria）。',
      more(resectReference(), rtReference()));

    setNum('pc_n_bplan', '5');
    show('pc_n_bplan', true);
    if (!S.bplan) return;
    setNum('pc_n_oper', '6');
    show('pc_n_oper', true);
    if (!S.oper) return;
    renderOper();
  }

  function renderOper() {
    var neo = (S.rsec === 'bord' && S.bplan === 'neo');
    if (S.oper === 'done') {
      fill('pc_r_oper', 'rec-elective',
        (neo ? '術前治療後順利完成切除' : '順利完成切除') + '<br>→ 走術後輔助治療與追蹤（PANC-6）', [
        H('接下來', 'PANC-6'),
        '<b>依 PANC-6 決定術後輔助治療，並開始追蹤。</b>',
        '<b>治療前要先留下基準值：電腦斷層、CA 19-9、CEA。</b>',
        neo ? '<b>已經接受過術前化放療或化療的病人，手術後仍是追加化療的候選人</b>（PANC-6 註 k）。'
            : '<b>沒有做過術前化療、而且已從手術充分恢復的病人，應該給予輔助治療；' +
              '治療應在 4–8 週內開始</b>（PANC-6 註 k）。',
        H('下一步', ''),
        '<b>下面就是術後輔助治療的建議。</b>'
      ], 'PANC-6（post-operative adjuvant treatment）、註 k。', null);
      show('pc_b_adj', true);
      renderAdjRec();
      return;
    }

    if (S.oper === 'prog') {
      fill('pc_r_oper', 'rec-urgent',
        '術前治療期間疾病進展，無法進行手術<br>→ 依有無黃疸處理，再走全身治療', [
        H('先看有沒有黃疸', 'PANC-4'),
        '<b>沒有黃疸 → 直接依疾病範圍走 locally advanced unresectable（PANC-7）或 ' +
          'metastatic disease（PANC-9）。</b>',
        '<b>有黃疸 → 膽道引流或繞道手術（限預估存活超過 6 個月），' +
          '± 開放性酒精腹腔神經叢阻斷術。</b>',
        EV('「預估存活超過 6 個月」是指引在每一個繞道手術選項都加上的前提（PANC-C 註 2）—— ' +
          '<b>緩和性手術要留給預期壽命較長的病人</b>。'),
        H('下一步', ''),
        '<b>下面的步驟開始決定要用什麼藥。</b>'
      ], 'PANC-4（disease progression precluding surgery）、PANC-C。',
        more(palliationReference()));
      showSys(S.rsec === 'bord' ? '7' : '6');
      return;
    }

    fill('pc_r_oper', 'rec-urgent',
      '術中發現無法切除<br>→ 先確認病理，再依有無黃疸與疾病範圍處理', [
      H('第一件事', 'PANC-3、PANC-5'),
      '<b>如果之前沒有做過，現在就用抽吸或切片確認是腺癌。</b>',
      H('接下來', 'PANC-5'),
      '<b>沒有黃疸 → 依疾病範圍走 locally advanced unresectable（PANC-7）或 metastatic disease（PANC-9）。</b>',
      '<b>有黃疸 → 膽道引流或膽道繞道（限預估存活超過 6 個月），± 開放性酒精腹腔神經叢阻斷術。</b>',
      EV('人已經在手術室裡，這一刻做膽道繞道與腹腔神經叢阻斷的代價最低 —— ' +
        '這是 PANC-3／PANC-5 把它們放在這一格的原因。'),
      H('PANC-3 多寫的一條', 'PANC-3'),
      '<b>可切除但術中發現切不下來的病人，指引另外列出「繞道手術（限預估存活超過 6 個月）」' +
        '作為並列選項。</b>',
      H('下一步', ''),
      '<b>下面的步驟開始決定要用什麼藥。</b>'
    ], 'PANC-3／PANC-5（unresectable at surgery）、PANC-C（緩和性手術的前提）。',
      more(palliationReference()));
    showSys(S.rsec === 'bord' ? '7' : '6');
  }

  /* ---------- 術後輔助（PANC-6）---------- */
  function renderPostop() {
    show('pc_b_adj', true);
    renderAdjRec();
  }

  function renderAdjRec() {
    fill('pc_r_adj', 'rec-elective', '已完成切除，沒有復發或轉移的證據<br>→ 術後輔助治療，之後每 3 個月追蹤', [
      H('先留基準值', 'PANC-6'),
      '<b>電腦斷層、CA 19-9、CEA。</b>',
      H('指引列的三組選項', 'PANC-6'),
      '<b>① 臨床試驗為優先</b>（clinical trial preferred）。',
      '<b>② 全身性 gemcitabine 或 5-FU/leucovorin，接在化放療之前或之後</b>' +
        '（化放療用 fluoropyrimidine 或 gemcitabine 為基礎）。',
      '<b>③ 單純化療</b>：<b>gemcitabine</b>　或　<b>5-FU/leucovorin</b>　或　' +
        '<b>capecitabine</b>　或　<b>S-1</b>。',
      EV('PANC-E 的輔助那一段還多列了 <b>gemcitabine ＋ capecitabine</b> 與 <b>FOLFIRINOX</b>。' +
        '兩頁合起來看才是完整的選項清單。'),
      H('什麼時候開始、給誰', 'PANC-6 註 k'),
      '<b>接受過術前化放療或化療的病人，術後仍是追加化療的候選人。</b>',
      '<b>沒有做過術前化療、而且已從手術充分恢復的病人應該給予輔助治療；治療應在 4–8 週內開始。</b>',
      '<b>如果全身性化療排在化放療之前，每一種治療模式結束後都要用電腦斷層重新分期。</b>',
      H('追蹤', 'PANC-6'),
      '<b>每 3 個月一次共 2 年，之後每年一次</b>；每次做<b>病史與理學檢查（評估症狀）、CA 19-9、CEA、電腦斷層</b>。',
      H('健保要先算清楚的一件事', '9.4'),
      '<b>台大處方集的 gemcitabine 品項是 Gemmis，而條文把 Gemmis 限縮在「晚期或無法手術切除」的胰臟癌</b> —— ' +
        '<b>依條文字面，已切除的術後輔助不在給付範圍內。</b>實務上以審查為準，開單前建議先確認。',
      EV('<b>' + NR('capecitabine') + ' 9.17 的適應症清單也沒有胰臟癌</b>；' +
        'S-1 的 9.46 條文則寫「局部晚期無法手術切除或轉移性」，同樣不涵蓋輔助情境。' +
        '這一格的自費風險比其他癌別高很多。')
    ], 'PANC-6（post-operative adjuvant treatment 與 surveillance）、註 j、註 k、PANC-E（輔助處方）；' +
      '健保 9.4／9.17／9.46 查詢日 2026-08-17。',
      more(adjRxTable(), rtReference(), nhiReference()));
    fu('pc_f_adj', null);
  }

  /* ---------- 全身治療（PANC-8、PANC-9）---------- */
  function showSys(baseNum) {
    var n = parseInt(baseNum, 10);
    show('pc_b_sys', true);
    setNum('pc_n_ps', String(n));
    show('pc_n_ps', true);
    if (!S.ps) return;
    setNum('pc_n_line', String(n + 1));
    show('pc_n_line', true);
    if (!S.line) return;
    renderSys();
  }

  function renderSys() {
    var meta = (S.mets === 'yes' || S.rsite === 'distant');
    var L = [], cls, title;
    var psTxt = S.ps === 'good' ? '體能好' : '體能差';
    var siteTxt = meta ? '轉移性' : '局部晚期不可切除';

    if (S.ps === 'poor') {
      cls = 'rec-nonop';
      title = siteTxt + '　·　體能差<br>→ 低強度單藥，或直接進入支持性照護';
      L.push(H('指引列的選項', meta ? 'PANC-9' : 'PANC-8'));
      L.push('<b>gemcitabine</b>');
      L.push('<b>先前用過 gemcitabine 為基礎治療的人，改用 fluoropyrimidine 為基礎的化療</b>' +
        '（capecitabine、S-1 或 5-FU）。');
      L.push('<b>或 best supportive care，包含安寧照護</b>（註 s）。');
      L.push(EV('這一格<b>不用三藥處方</b> —— FOLFIRINOX、NALIRIFOX 與 gemcitabine ＋ ' +
        NR('nab-paclitaxel') + ' 在指引裡都掛在「good performance status」那一條。'));
      L.push(H('體能好不好，指引有定義', 'PANC-7 註 n'));
      L.push('<b>「Good performance status」＝ ECOG 0–1，而且疼痛控制良好、膽道支架通暢、營養攝取足夠。</b>');
      L.push(EV('這個定義的後三項是可以處理的 —— <b>先把疼痛、膽道與營養處理好，' +
        '有些病人會從「體能差」變成「體能好」</b>，治療選項也就跟著變多。'));
    } else if (S.line === 'l1') {
      cls = 'rec-elective';
      title = siteTxt + '　·　體能好　·　第一線<br>→ 臨床試驗為優先，否則從下列處方選一個';
      L.push(H('指引把臨床試驗放在第一位', meta ? 'PANC-9' : 'PANC-8'));
      L.push('<b>Clinical trial preferred。</b>');
      L.push(H('可以用的處方', 'PANC-E'));
      L.push('<b>NALIRIFOX</b>（版次 11 新增）：<b>liposomal irinotecan 50 mg/m²、oxaliplatin 60 mg/m²、' +
        'leucovorin 400 mg/m²、fluorouracil 2400 mg/m²（連續輸注 46 小時），依序給予；' +
        '28 天一個週期的第 1 天與第 15 天各一次。</b>');
      L.push('<b>FOLFIRINOX</b>　或　<b>gemcitabine 為基礎的合併治療</b>' +
        '（gemcitabine ＋ nab-paclitaxel、＋ erlotinib、＋ fluoropyrimidine、＋ cisplatin、或 GTX）。');
      L.push('<b>gemcitabine 單方</b>：800–1000 mg/m² 輸注 30 分鐘，每週一次連續 3 週，每 28 天一個週期；' +
        '固定速率輸注 10 mg/m²/min 可以取代標準輸注。');
      L.push('<b>capecitabine 單方</b>　或　<b>S-1 單方</b>　或　<b>fluoropyrimidine ＋ oxaliplatin</b>。');
      L.push(EV('<b>gemcitabine ＋ cisplatin 指引特別註明「尤其是可能的遺傳性癌症」</b> —— ' +
        '有家族史的病人這一格值得多想一步（見最下方的遺傳性胰臟癌區塊）。'));
      if (!meta) {
        L.push(H('局部晚期多一個選項：化放療', 'PANC-8 註 o、註 p'));
        L.push('<b>選擇性病人（局部晚期而沒有全身轉移）可以在「充分的化療療程之後」接鞏固性化放療。</b>');
        L.push('<b>指引的但書寫得很明確：化放療應該保留給「接受全身化療期間沒有出現轉移」的病人</b>（註 p）。');
        L.push('<b>對化放療反應顯著的病人可以考慮手術切除，但指引寫「目前沒有明確的證據支持這個做法」。</b>');
        L.push('<b>有指徵時做腹腔鏡以評估遠處疾病</b>（註 o）。');
      }
      L.push(H('健保會給付哪幾個', '9.10、9.12.2、9.4、9.46'));
      if (meta) {
        L.push('<b>FOLFIRINOX 的 oxaliplatin（9.10 第 3 項）與 NALIRIFOX 的 liposomal irinotecan' +
          '（9.12.2 第 2 項，114/12/1 起）都限「轉移性、第一線」</b> —— 這一格符合。');
      } else {
        L.push('<b>oxaliplatin 9.10 第 3 項的 FOLFIRINOX 條文寫的是「轉移性胰臟癌之第一線治療」，' +
          '局部晚期不在字面內</b>；<b>S-1 的 9.46 條文則明寫涵蓋「局部晚期無法手術切除」</b>。');
      }
      L.push('<b>gemcitabine：台大的品項 Gemmis 條文限「晚期或無法手術切除之胰臟癌」，這一格符合。</b>');
      L.push('<b>' + NR('nab-paclitaxel') + ' 與 ' + NR('erlotinib') + ' 用於胰臟癌都沒有健保給付</b>，' +
        NR('capecitabine') + ' 的條文也沒有胰臟癌 —— <b>這三個要自費。</b>');
    } else {
      cls = 'rec-nonop';
      title = siteTxt + '　·　體能好　·　第二線<br>→ 換掉第一線用過的那一類，臨床試驗仍為優先';
      L.push(H('指引的原則', 'PANC-8、PANC-9、PANC-E'));
      L.push('<b>Clinical trial（preferred）。</b>');
      L.push('<b>先前用過 fluoropyrimidine 為基礎治療的人 → 改用 gemcitabine 為基礎的治療。</b>');
      L.push('<b>先前沒用過 gemcitabine 的人，第二線就可以用 gemcitabine。</b>');
      L.push('<b>先前用過 gemcitabine 而進展的人 → nanoliposomal irinotecan ＋ 5-FU/leucovorin。</b>');
      L.push('<b>其他選項</b>：capecitabine；fluoropyrimidine（capecitabine 或 5-FU）＋ oxaliplatin。');
      if (!meta) {
        L.push(H('局部晚期的一個額外選項', 'PANC-8'));
        L.push('<b>如果之前沒做過化放療，而且原發病灶是唯一的進展部位，可以做化放療。</b>');
        L.push(EV('這兩個條件要同時成立 —— <b>「沒做過」加上「原發灶是唯一進展的地方」</b>。' +
          '已經有轉移的人不做（除非為了緩和）。'));
      }
      L.push(H('健保', '9.12.2'));
      L.push('<b>Onivyde（liposomal irinotecan）＋ 5-FU ＋ leucovorin 用於「曾接受過 gemcitabine 治療後' +
        '復發或惡化」之轉移性胰腺癌，健保有給付，需事前審查。</b>');
      L.push(EV('注意條文寫的是<b>轉移性</b>；局部晚期用這個組合不在條文字面內。'));
      L.push(H('體能再退步的話', 'PANC-8 註 r、註 s'));
      L.push('<b>Salvage therapy 最好保留給仍維持良好體能的病人</b>（註 r）；' +
        '<b>體能變差就走 best supportive care，包含安寧照護</b>（註 s）。');
    }

    fill('pc_r_sys', cls, title, L,
      (meta ? 'PANC-9（metastatic disease）' : 'PANC-8（locally advanced unresectable）') +
      '、PANC-7 註 n（體能定義）、PANC-E（處方與劑量）；健保條文查詢日 2026-08-17。',
      more(metaRxTable(S.ps), rtReference(), palliationReference(), nhiReference()));
    fu('pc_f_sys', 'palli');
  }

  /* ---------- 復發（PANC-10）---------- */
  function renderRecur() {
    show('pc_b_recur', true);
    show('pc_n_rsite', true);
    if (!S.rsite) return;

    if (S.rsite === 'local') {
      fill('pc_r_recur', 'rec-elective', '切除後局部復發<br>→ 四個並列選項，先看化放療做過沒有', [
        H('指引列的四個選項', 'PANC-10'),
        '<b>① 臨床試驗（優先）。</b>',
        '<b>② 如果之前沒做過，考慮化放療。</b>',
        '<b>③ 換用其他的全身性化療。</b>',
        '<b>④ Best supportive care。</b>',
        EV('「如果之前沒做過」是第 ② 項的前提 —— <b>術後已經做過化放療的病人，' +
          '這一格就只剩下換藥或支持性照護</b>。'),
        H('換藥的原則', 'PANC-E'),
        '<b>先前用 fluoropyrimidine 為基礎者 → 換 gemcitabine 為基礎；' +
          '先前用 gemcitabine 為基礎者 → 換 fluoropyrimidine 為基礎。</b>',
        H('放射治療的劑量', 'PANC-D'),
        '<b>術後情境：每次 1.8–2.2 Gy、每日一次、每週 5 天，45–46 Gy，' +
          '肉眼病灶可再加 5–9 Gy boost。</b>'
      ], 'PANC-10（local recurrence）、PANC-D（放療劑量）、PANC-E（換藥原則）。',
        more(rtReference(), adjRxTable(), palliationReference(), nhiReference()));
      fu('pc_f_recur', 'palli');
      return;
    }

    show('pc_n_rint', true);
    if (!S.rint) return;

    var L = [];
    L.push(H('指引列的選項', 'PANC-10'));
    L.push('<b>臨床試驗（優先）。</b>');
    if (S.rint === 'gt6') {
      L.push('<b>可以用「原本用過的那一套全身性化療」</b>（systemic chemotherapy as previously administered）。');
      L.push('<b>或換用其他化療。</b>');
      L.push('<b>或 best supportive care／安寧照護。</b>');
      L.push(EV('<b>距離初次治療完成超過 6 個月，代表腫瘤對原本的處方沒有原發性抗藥</b> —— ' +
        '所以指引允許重新使用同一套。這是這一格和「不到 6 個月」唯一的差別，但差很多。'));
    } else {
      L.push('<b>換用其他化療</b>（alternative chemotherapy）。');
      L.push('<b>或 best supportive care，包含安寧照護</b>（註 s）。');
      L.push(EV('<b>不到 6 個月就復發，等於原本的處方已經失敗</b> —— ' +
        '指引在這一格<b>沒有列「重複原本的化療」這個選項</b>，這是和上一格最重要的差別。'));
    }
    L.push(H('換藥的原則', 'PANC-E'));
    L.push('<b>先前用 fluoropyrimidine 為基礎者 → 換 gemcitabine 為基礎；' +
      '先前用 gemcitabine 為基礎者 → 換 fluoropyrimidine 為基礎。</b>');
    L.push('<b>gemcitabine 失敗之後 → nanoliposomal irinotecan ＋ 5-FU/leucovorin</b>（健保 9.12.2 有給付，' +
      '限轉移性，需事前審查）。');
    L.push(H('下一步', ''));
    L.push('<b>下面的步驟依體能與線別給出完整的處方選項。</b>');

    fill('pc_r_recur', 'rec-elective',
      '切除後出現遠處轉移' + (S.rint === 'gt6' ? '，距初次治療完成超過 6 個月' : '，距初次治療完成不到 6 個月') +
      '<br>→ ' + (S.rint === 'gt6' ? '可以重複原本的處方，也可以換藥' : '換一套處方，不重複原本的'),
      L, 'PANC-10（metastatic disease with or without local recurrence）、註 s、PANC-E。',
      more(nhiReference()));
    showSys('4');
  }

  /* ==========================================================
     6. 最下方：遺傳性胰臟癌
     ========================================================== */
  function hereditaryBlock() {
    var L = [];
    L.push(H('台大胰臟癌診療指引寫到哪裡', 'PANC-E'));
    L.push('<b>指引全文只有一句碰到遺傳：PANC-E 在列合併處方時註明' +
      '「gemcitabine ＋ cisplatin（especially for possible hereditary cancers）」。</b>');
    L.push(EV('也就是說 —— <b>指引承認「可能的遺傳性癌症」會改變處方選擇，' +
      '但沒有列出什麼時候要懷疑、要驗什麼、驗到之後怎麼辦。</b>以下三段屬院外實證。'));

    L.push(H('什麼時候要懷疑？', '台大指引未列，屬院外實證'));
    L.push('<b>所有確診胰臟腺癌的病人都應該做胚系基因檢測</b> —— ' +
      '這是目前國際指引的一致立場，<b>沒有年齡或家族史的門檻</b>。');
    L.push('<b>家族中有兩位以上一等親罹患胰臟癌</b>，或家族中同時出現' +
      '<b>乳癌、卵巢癌、黑色素瘤、大腸直腸癌</b>的聚集，更要積極。');
    L.push('<b>發病年輕、或本人另有其他原發癌症</b>也是提示。');

    L.push(H('要驗哪些基因？', '台大指引未列，屬院外實證'));
    L.push('<b>同源重組修復相關：BRCA1、BRCA2、PALB2、ATM</b> —— ' +
      '這一組最重要，因為<b>會直接改變用藥</b>。');
    L.push('<b>錯誤配對修復（Lynch syndrome）：MLH1、MSH2、MSH6、PMS2、EPCAM。</b>');
    L.push('<b>其他症候群：CDKN2A（家族性非典型多痣黑色素瘤）、STK11（Peutz-Jeghers）、' +
      'TP53（Li-Fraumeni）、遺傳性胰臟炎的 PRSS1。</b>');
    L.push(EV('以上基因清單<b>台大胰臟癌診療指引版次 11 全文沒有列</b>，' +
      '本頁引自 NCCN Pancreatic Adenocarcinoma 與 NCCN Genetic/Familial High-Risk Assessment: ' +
      'Breast, Ovarian, Pancreatic, and Prostate，本頁查核之公開版本分別為 v2.2024 與 v3.2024。' +
      '<b>要驗之前請照會遺傳諮詢。</b>'));

    L.push(H('驗到致病變異會改變什麼？', '台大指引未列，屬院外實證'));
    L.push('<b>BRCA1／BRCA2／PALB2：對含鉑的處方反應較好</b> —— ' +
      '這正是指引 PANC-E 註明「gemcitabine ＋ cisplatin 尤其用於可能的遺傳性癌症」的道理，' +
      '<b>FOLFIRINOX 與 NALIRIFOX 也都含鉑</b>。');
    L.push('<b>germline BRCA 突變且第一線含鉑治療後沒有進展者，維持性 olaparib 是國際指引的選項</b>；' +
      '<b>但台灣健保的 olaparib 條文不含胰臟癌，台大指引也未列</b>，要用需自費並與病人說明。');
    L.push('<b>Lynch syndrome（dMMR／MSI-H）：免疫檢查點抑制劑成為選項</b>，' +
      '同樣不在台大胰臟癌指引與健保胰臟癌條文內。');
    L.push('<b>一等親要做 cascade testing</b>；<b>帶因的親屬可以進入胰臟癌高風險監測</b>' +
      '（一般以磁振膽胰管造影或內視鏡超音波每年一次），這部分要由專門的高風險門診安排。');
    L.push(EV('把這一段放在流程最下方，是因為<b>它與病人走哪一條治療路線無關 —— 每一條都適用</b>。' +
      '但它會改變兩件很實際的事：<b>第一線要不要選含鉑的處方</b>，以及<b>家屬要不要來看門診</b>。'));

    return '<div class="bc-gene-h">要不要驗基因？懷疑遺傳性胰臟癌時怎麼做' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     7. 最下方：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'pc-drug-' + code.replace(/ /g, '_'); }

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
    var g = el('pc_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = hereditaryBlock();
  }

  function renderDrugCards() {
    var box = el('pc_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— '</b></td><td>' 這種標籤邊界在 textContent 裡是零寬度的，
         會把 'FOLFIRINOX' 和 'oxaliplatin' 黏成 'FOLFIRINOXoxaliplatin'，
         整字比對就抓不到 oxaliplatin，那張藥卡會無聲消失。改成把標籤換成空白。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('pcPath');
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
    PC_DRUGS.forEach(function (d) {
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
     8. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope) {
      if (S.scope === 'dx') renderDx();
      else if (S.scope === 'postop') renderPostop();
      else if (S.scope === 'recur') renderRecur();
    }
    renderDrugCards();
  }

  /* ==========================================================
     9. 互動
     ========================================================== */
  var SEL_GROUPS = ['pc_n1', 'pc_n_mets', 'pc_n_jaun', 'pc_n_rsec', 'pc_n_bplan', 'pc_n_oper',
    'pc_n_ps', 'pc_n_line', 'pc_n_rsite', 'pc_n_rint'];

  var DOWNSTREAM = {
    scope: ['mets', 'jaun', 'rsec', 'bplan', 'oper', 'ps', 'line', 'rsite', 'rint'],
    mets: ['jaun', 'rsec', 'bplan', 'oper', 'ps', 'line'],
    jaun: ['rsec', 'bplan', 'oper', 'ps', 'line'],
    rsec: ['bplan', 'oper', 'ps', 'line'],
    bplan: ['oper', 'ps', 'line'],
    oper: ['ps', 'line'],
    ps: ['line'],
    rsite: ['rint', 'ps', 'line'],
    rint: ['ps', 'line']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function pancPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      clearSelectionMarks();
    }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }

  function reapplyMarks() {
    var pairs = [
      ['pc_n1', 'scope'], ['pc_n_mets', 'mets'], ['pc_n_jaun', 'jaun'], ['pc_n_rsec', 'rsec'],
      ['pc_n_bplan', 'bplan'], ['pc_n_oper', 'oper'], ['pc_n_ps', 'ps'], ['pc_n_line', 'line'],
      ['pc_n_rsite', 'rsite'], ['pc_n_rint', 'rint']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /pancPick\('([a-z]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function pancReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }

  function initPancPathway() { pancReset(); }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息 —— 流程圖只是
     點了沒反應。panc 與 prostate 曾同用 pcPick／pcReset。 */
  global.pancPathwayHTML = pancPathwayHTML;
  global.initPancPathway = initPancPathway;
  global.pancPick = pancPick;
  global.pancReset = pancReset;
})(window);
