/* ============================================================
   胰臟神經內分泌腫瘤治療互動決策流程
   Pancreatic Neuroendocrine Tumor (PanNET) Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胰臟神經內分泌腫瘤診療指引
   版次 02（2026/06/16 第 87 次癌症醫療委員會會議通過）
   文件編號 50710-2-000048；NTUH 胰臟癌多專科診療團隊修訂
   Source: NCCN Guidelines Version 3.2025（10/01/2025）
   涵蓋章節：PanNET-1 ～ PanNET-13、WDG3-1 ～ WDG3-4、PDNEC-1／PDNEC-1A、
             NE-A（WHO 2019 分類）、NE-H（1–9，含 5 of 9 之 PDNEC 處方）
   ※ 三條主幹（步驟 1 分流，互不相通）：
     ① 分化良好 G1／G2 → PanNET-1～13
     ② 分化良好 G3（WD G3）→ WDG3-1～4
     ③ 分化差之神經內分泌癌（NEC 小細胞／大細胞型）與混合型（MiNEN）→ PDNEC-1
     ①② 為 NET（well-differentiated），③ 為 NEC／MiNEN（poorly differentiated），
     兩者預後與治療完全不同；PDNEC-1A 註 c 明載「並非所有 Ki-67 >20% 者皆為分化差」。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var pnSt = {
    grade: null,   // g12 | wdg3 | pdnec    （G1/G2 ／ WD G3 ／ 分化差 NEC・MiNEN）
    pdscope: null, // res | unres | met     （PDNEC 疾病範圍；PDNEC-1）
    func: null,    // nf | gas | ins | glu | vip   （功能性型態；G1/G2）
    scope: null,   // res | unres | met     （疾病範圍；G1/G2）
    size: null,    // le1 | m1to2 | gt2     （無功能且可切除之腫瘤大小）
    loc: null,     // head | distal | duo | occult （功能性腫瘤之位置）
    burden: null,  // low | sig             （不可切除／轉移之臨床狀態）
    w3scope: null, // res | adv             （WD G3 疾病範圍）
    w3bio: null    // fav | unfav           （WD G3 腫瘤生物學）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="pnPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  var cat2A = '<b>指引通則</b>：All recommendations are <b>category 2A</b> unless otherwise indicated。';
  var ssaDose = '<b>SSA 劑量（註 m／e）</b>：<span class="drug">Octreotide LAR</span> <b>20–30 mg IM</b> 或 ' +
    '<span class="drug">Lanreotide</span> <b>120 mg SC</b>，<b>每 4 週一次</b>；<b>更高劑量已證實安全</b>。' +
    '突破性症狀可考慮 <span class="drug">octreotide</span> <b>100–250 mcg SC TID</b>。' +
    '<b>註 n</b>：若發生注射部位相關併發症，可考慮換用另一種 SSA。';
  var insulinomaSsaWarn = '<b>⚠ 胰島素瘤（insulinoma）之 SSA 使用（註 ff／j／p）</b>：' +
    '<b>僅在 SSTR 影像為陽性時方可使用</b>；<b>SSTR 陰性者使用 octreotide LAR 或 lanreotide 可<u>嚴重惡化低血糖</u></b>' +
    '（can profoundly worsen hypoglycemia）。即使使用亦須<b>謹慎</b>，因可能<b>短暫惡化低血糖</b>。';

  /* ---------- NE-F：手術前準備（註 h／i）---------- */
  function surgPrepNote() {
    return '<b>術前疫苗（註 h）</b>：<b>若考慮之手術可能包含脾臟切除</b>，應<b>術前接種對抗莢膜細菌之疫苗</b>' +
      '（<b>肺炎鏈球菌、b 型嗜血桿菌、C 群腦膜炎雙球菌</b>）——見 NE-F（2 of 3）。<br>' +
      '<b>術式選擇（註 i）</b>：<b>視情況應考慮<u>中段胰切除（central pancreatectomy）</u>或<u>保脾手術</u></b>' +
      '（spleen-preserving surgery）。';
  }

  /* ---------- 無功能腫瘤之觀察準則（註 e）---------- */
  function obsCritHtml() {
    return '<div class="crit-box">' +
      cbx('觀察（Observation）之考量準則', '註 e', [
        cb('適用對象', '<b>小（≤2 cm）、低惡性度、偶然發現、無功能</b>之腫瘤 ' +
          '（small [≤2 cm], low-grade, incidentally discovered, non-functional tumors）'),
        cb('決策依據', '<b>預估手術風險</b>、<b>腫瘤位置</b>、<b>病人共病</b> ' +
          '（estimated surgical risk, site of tumor, and patient comorbidities）'),
        cb('證據', 'Sadot E, Ann Surg Oncol 2016;23:1361-1370｜Partelli S（<b>ASPEN</b>），Br J Surg 2022;109:1186-1190｜' +
          'Heidsma CM（<b>PANDORA</b>），Br J Surg 2021;108:888-891'),
        cb('追蹤', '<b>選擇觀察者亦須依 PanNET-11 之監測建議追蹤</b>（註 x：Surveillance recommendations also apply to cases where observation has been chosen）')
      ]) +
      '<div class="note"><b>註 f</b>：<b>帶有生殖細胞系突變（germline mutations）之病人，' +
      '依「任何達到需關注尺寸之腫瘤」決定治療</b>。<br>' +
      '<b>註 j（淋巴結）</b>：<b>1–2 cm 之 PanNET 具有<u>雖小但確實存在</u>的淋巴結轉移風險</b>' +
      '（have a small, but real risk of lymph node metastases），<b>因此應考慮淋巴結切除</b>' +
      '（lymph node resection should be considered）。</div>' +
      '</div>';
  }

  /* ---------- 各功能性腫瘤之初始評估（PanNET-1／3／5／7／9）---------- */
  function evalHtml(kind) {
    var common = [
      cb('影像', '<b>多相位（multiphasic）腹部 ± 骨盆 CT 或 MRI</b>（NE-D）——註 b：多相位影像須<b>於動脈期與門靜脈期打顯影劑</b>'),
      cb('視需要', '<b>SSTR-PET/CT 或 SSTR-PET/MRI</b>（NE-D）——註 c：範圍自<b>顱頂至大腿中段</b>；' +
        '註 d：追蹤劑如 <b>68Ga-DOTATATE、64Cu-DOTATATE、68Ga-DOTATOC</b>'),
      cb('視需要', '胸部 CT ± 顯影劑')
    ];
    var extra = [];
    var title = '';
    if (kind === 'nf') {
      title = '無功能性胰臟腫瘤 Nonfunctioning pancreatic tumors';
      extra = [
        cb('定義', '<b>無荷爾蒙分泌相關症狀者</b>——<b>不論荷爾蒙數值是否升高</b> ' +
          '（without symptoms secondary to hormone production <b>whether or not hormone levels are elevated</b>）'),
        cb('視需要', '<b>EUS ＋ 切片</b>'),
        cb('視需要', '<b>考慮遺傳諮詢與遺傳性症候群之基因檢測</b>')
      ];
    } else if (kind === 'gas') {
      title = '胃泌素瘤 Gastrinoma（通常位於十二指腸或胰頭）';
      extra = [
        cb('必要', '<b>血清 gastrin 濃度</b>（NE-E）——<b>註 k：PPI 使用可造成偽性升高</b>；' +
          '確診理想上應<b>空腹且停用 PPI &gt; 1 週</b>後檢測。<b>惟有明顯胃泌素瘤症狀及／或併發症風險者，' +
          'PPI 或 H2 阻斷劑應continue</b>'),
        cb('必要', '<b>遺傳諮詢與遺傳性症候群之基因檢測</b>（<b>此型為「必要」而非「視需要」</b>）'),
        cb('視需要', '<b>EUS ± 切片</b>——<b>註 l：切片前應先經多科討論</b>'),
        cb('視需要', '其他生化檢查（依臨床需要，NE-E）')
      ];
    } else if (kind === 'ins') {
      title = '胰島素瘤 Insulinoma';
      extra = [
        cb('必要', '<b>低血糖發作當下</b>之<b>血清 insulin、pro-insulin、C-peptide</b>（NE-E）'),
        cb('必要', '<b>空腹血糖</b>'),
        cb('視需要', 'EUS'),
        cb('視需要', '<b>選擇性動脈鈣刺激試驗</b>（selective arterial calcium stimulation test）以定位胰島素瘤'),
        cb('⚠ 注意', '<b>註 o：三分之二的胰島素瘤為 SSTR-PET <u>陰性</u></b>，' +
          '因此可能<b>影響後續治療與監測之選擇</b>'),
        cb('視需要', '考慮遺傳諮詢與基因檢測')
      ];
    } else if (kind === 'glu') {
      title = '升糖素瘤 Glucagonoma（通常位於胰尾）';
      extra = [
        cb('必要', '<b>Glucagon 與血糖</b>'),
        cb('視需要', 'EUS；其他生化檢查（NE-E）'),
        cb('視需要', '考慮遺傳諮詢與基因檢測')
      ];
    } else {
      title = 'VIP 瘤 VIPoma';
      extra = [
        cb('必要', '<b>電解質</b>'),
        cb('必要', '<b>VIP 濃度</b>'),
        cb('視需要', 'EUS；其他生化檢查（NE-E）'),
        cb('視需要', '考慮遺傳諮詢與基因檢測')
      ];
    }
    return '<div class="crit-box">' +
      cbx(title, '初始評估 EVALUATION（註 a：診斷之病理原則見 NE-A）', extra.concat(common)) +
      '</div>';
  }

  /* ---------- NE-H（2 of 9）：PanNET G1/G2 之全身性治療 ---------- */
  function systemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">局部晚期及／或遠處轉移之胰臟 NET（分化良好 G1／G2）全身性治療<span class="rx-panel-src">NE-H（2 of 9）</span></div>' +
      '<div class="rx-def"><b>⚠ 本節四項通則（NE-H 2 of 9 開頭）</b>：' +
      '<b>①</b> 全身性治療<b>並非對每位局部晚期／轉移病人皆適當</b>，應經<b>多科討論</b>決定最佳選擇' +
      '（含<b>觀察</b>、局部治療、<b>減積手術</b>或全身性治療）。' +
      '<b>②</b> <b>目前無資料支持區域性與全身性治療之特定先後順序，亦無資料可指引下列各項全身性治療之排序</b>' +
      '（no data to guide sequencing）——<b>故下列「一線／二線」之分並不存在於本指引</b>。' +
      '<b>③</b> <b>PanNET 之<u>輔助性（adjuvant）全身治療並無已知角色</u></b>' +
      '（There is no known role for systemic treatment in the adjuvant setting for PanNETs）。' +
      '<b>④</b> 劑量與時程得依情況適當調整。</div>' +
      rxLine('Preferred Regimens', '<b>指引明列之首選類別</b>', [
        '<span class="drug">Cabozantinib</span>——<b>category 1</b>（若<b>先前曾接受 everolimus、Lu-177 dotatate 或 sunitinib</b>）',
        '<span class="drug">Everolimus</span>　<b>10 mg 口服，每日一次</b>——<b>category 1（疾病進展者）</b>',
        '<span class="drug">Sunitinib</span>　<b>37.5 mg 口服，每日一次</b>——<b>category 1（疾病進展者）</b>',
        '<span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>——<b>（SSTR 陽性者）</b>',
        '<b>一線 PRRT</b> <span class="rx">Lutetium Lu 177 dotatate</span>——' +
        '<b>條件：SSTR 陽性、<u>Ki-67 ≥10%</u>、且有臨床顯著之腫瘤負荷</b>',
        '<b>PRRT</b> <span class="rx">Lutetium Lu 177 dotatate</span>——' +
        '<b>條件：SSTR 陽性且<u>已於 octreotide LAR 或 lanreotide 上進展</u></b>',
        '<span class="rx">Temozolomide + capecitabine</span>——' +
        '<b>當「需要腫瘤反應以緩解症狀或進行減積」時為 preferred</b>（preferred when tumor response is needed for symptoms or cytoreduction）'
      ]) +
      rxLine('Other Recommended Regimens', '細胞毒性化療（用於腫瘤龐大、有症狀及／或進展者）', [
        '<span class="rx">FOLFOX</span>',
        '<span class="rx">CAPEOX</span>'
      ]) +
      rxLine('Useful in Certain Circumstances', '特定情境', [
        '<b>於標準劑量 SSA 上進展者</b> → <b>超仿單劑量（above-label dose）</b>之 ' +
        '<span class="drug">octreotide LAR</span> 或 <span class="drug">lanreotide</span>（<b>若 SSTR 陽性</b>）——' +
        '<b>註 h：octreotide LAR 最高每月 60 mg；lanreotide 最高每 14 天 120 mg</b>',
        '<span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>——<b>（SSTR <u>陰性</u>者）</b>',
        '<b>具生殖細胞系 <u>VHL</u> 變異且 PanNET 進展者</b> → <b>考慮</b> <span class="drug">Belzutifan</span>' +
        '（<b>註 k：用於較大腫瘤、局部晚期不可切除與遠處疾病之資料<u>極為有限</u>，臨床試驗進行中</b>）',
        '<b>局部晚期不可切除疾病</b> → <b>考慮 RT ± 併用 fluoropyrimidine 為基礎之化療</b>' +
        '（<b>不含小腸繫膜病灶 excluding small bowel mesenteric</b>）'
      ]) +
      '<div class="rx-def">' + ssaDose + '</div>' +
      '<div class="rx-warn"><b>註 a／cc（SSA 於進展後之去留）</b>：若發生<b>臨床顯著之疾病進展</b>，' +
      '<b>octreotide LAR 或 lanreotide 應於<u>無功能性腫瘤停用</u>，而於<u>功能性腫瘤繼續使用</u></b>；' +
      '且<b>上述處方可與後續任一選項合併使用</b>。</div>' +
      '<div class="rx-warn">' + insulinomaSsaWarn + '</div>' +
      '</div>';
  }

  /* ---------- PanNET-13：後續治療 ---------- */
  function subsequentPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">疾病進展後之後續治療 SUBSEQUENT THERAPY<span class="rx-panel-src">PanNET-13</span></div>' +
      rxLine('三選一，無先後順序', '以下三條路徑於指引中以 or 並列，未定義優先次序', [
        '<span class="rx">Clinical trial</span>',
        '<b>全身性治療</b>（NE-H 2 of 9——見上方選單）',
        '<b>局部區域治療選項</b>（Locoregional therapy options——見下列）'
      ]) +
      rxLine('局部區域治療選項 Locoregional therapy options', '', [
        '<b>肝臟為主之疾病</b> → <b>考慮肝臟導向治療（liver-directed therapy）</b>——' +
        '<b>註 hh：曾接受任何膽道器械操作（biliary instrumentation）者，肝臟導向治療之<u>感染併發症風險增高</u></b>',
        '<b>局部晚期不可切除疾病</b> → <b>考慮 RT（NE-I）± 併用 fluoropyrimidine 為基礎之化療</b>' +
        '（<b>不含小腸繫膜病灶</b>）',
        '<b>寡轉移及／或有症狀之轉移</b> → <b>姑息性放療</b>（NE-I）（<b>不含繫膜腫塊 excluding mesenteric masses</b>）'
      ]) +
      '</div>';
  }

  /* ---------- NE-A（4 of 7）：WHO 2019 分類——區分 NET G3 與 NEC 的依據 ---------- */
  function whoClassPanel() {
    return '<details class="rx-more kps-details">' +
      '<summary>WHO 2019 神經內分泌腫瘤分類與分級準則（判別 NET G3 vs NEC vs MiNEN）▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px;">' +
        '<div class="rx-panel-h">胃腸道與肝膽胰神經內分泌腫瘤之分類與分級<span class="rx-panel-src">NE-A（4 of 7）</span></div>' +
        rxLine('分化良好 Well-differentiated（＝ NET）', '走 PanNET-1～13 或 WDG3-1～4', [
          '<b>NET, G1</b>——低度；有絲分裂 <b>&lt;2</b>/2mm²；Ki-67 <b>&lt;3%</b>',
          '<b>NET, G2</b>——中度；有絲分裂 <b>2–20</b>/2mm²；Ki-67 <b>3–20%</b>',
          '<b>NET, G3</b>——高度；有絲分裂 <b>&gt;20</b>/2mm²；Ki-67 <b>&gt;20%</b>' +
          '（<b>仍為分化良好</b>，走 WDG3-1～4，<b>≠ NEC</b>）'
        ]) +
        rxLine('分化差 Poorly differentiated（＝ NEC）', '走 PDNEC-1', [
          '<b>神經內分泌癌 NEC，小細胞型（SCNEC）</b>——有絲分裂 <b>&gt;20</b>/2mm²；Ki-67 <b>&gt;20%</b>',
          '<b>NEC，大細胞型（LCNEC）</b>——有絲分裂 <b>&gt;20</b>/2mm²；Ki-67 <b>&gt;20%</b>',
          '<b>註 c</b>：<b>分化差之 NEC 不另作正式分級，依定義即屬高度（high grade）</b>。'
        ]) +
        rxLine('混合型 MiNEN', '分化程度與分級皆為 Variable', [
          '<b>MiNEN</b>（混合神經內分泌–非神經內分泌腫瘤）——<b>分化：可為分化良好或分化差</b>；' +
          '分級、有絲分裂與 Ki-67 皆<b>不定</b>。',
          '<b>註 d</b>：<b>多數 MiNEN 之神經內分泌與非神經內分泌兩種成分皆為分化差</b>，' +
          '且神經內分泌成分之增生指數與其他 NEC 相當；<b>但此分類容許其中一種或兩種成分為分化良好</b>，' +
          '<b>故可行時應將兩種成分<u>分別分級</u></b>。'
        ]) +
        '<div class="rx-warn"><b>⚠ 判別關鍵（PDNEC-1A 註 c）</b>：' +
        '<b>並非所有高度（Ki-67 &gt;20%）之神經內分泌腫瘤都是分化差</b>' +
        '（Not all high-grade [Ki-67 &gt;20%] neuroendocrine neoplasms are poorly differentiated）。' +
        '<b>Ki-67 &gt;20% 只是必要條件，不是充分條件</b>——真正的分野是<b>形態學上的分化程度</b>：' +
        '分化良好者為 <b>NET G3</b>（走 WDG3-1～4），分化差者才是 <b>NEC</b>（走 PDNEC-1）。' +
        '<b>存疑時，WDG3-1 建議以組織病理或分子檢測評估 <u>p53、Rb、p16</u> 協助區分。</b></div>' +
        '<div class="rx-def"><b>註 b（增生指數之判讀）</b>：有絲分裂數以 <b>/2mm²</b> 表示' +
        '（＝ 40 倍下 10 個高倍視野、目鏡視野直徑 0.5mm），計數 <b>50 個 0.2mm² 視野（合計 10mm²）</b>；' +
        'Ki-67 則於<b>標記最密集之熱點（hot spots）</b>計數<b>至少 500 個細胞</b>。' +
        '<b>最終分級取兩項指數中「落在較高級別」者為準。</b><br>' +
        '<b>資料來源</b>：Klimstra DS, Klöppel G, La Rosa S, et al. ' +
        'WHO Classification of Tumours, Digestive System Tumours, 5th ed.（2019）。</div>' +
      '</div></details>';
  }

  /* ---------- NE-H（5 of 9）：分化差 NEC／MiNEN 之全身性治療 ---------- */
  function pdnecSystemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">肺外分化差之神經內分泌癌／大或小細胞癌／MiNEN 之全身性治療' +
      '<span class="rx-panel-src">NE-H（5 of 9）</span></div>' +
      rxLine('可切除疾病 Resectable disease', '', [
        '<span class="rx">Carboplatin + etoposide</span>',
        '<span class="rx">Cisplatin + etoposide</span>',
        '<span class="rx">FOLFIRI</span>',
        '<span class="rx">FOLFOX</span>',
        '<span class="rx">Temozolomide ± capecitabine</span>'
      ]) +
      rxLine('局部區域不可切除：化放療 Chemoradiation', '同步或依序 concurrent／sequential', [
        '<span class="drug">Capecitabine</span>——<b>當 etoposide + 鉑類不可行時</b>（when etoposide + platinum is not feasible）',
        '<span class="rx">Carboplatin + etoposide</span>',
        '<span class="rx">Cisplatin + etoposide</span>'
      ]) +
      rxLine('局部區域不可切除／轉移性：全身性治療 · 化學治療', '', [
        '<span class="rx">Carboplatin + etoposide</span>',
        '<span class="rx">Cisplatin + etoposide</span>',
        '<span class="rx">Carboplatin + irinotecan</span>',
        '<span class="rx">Cisplatin + irinotecan</span>',
        '<span class="rx">FOLFIRI</span>',
        '<span class="rx">FOLFIRINOX</span>',
        '<span class="rx">FOLFOX</span>',
        '<span class="rx">Temozolomide ± capecitabine</span>'
      ]) +
      rxLine('局部區域不可切除／轉移性：免疫治療', '<b>需生物標記</b>', [
        '<span class="drug">Pembrolizumab</span>——<b>限 MSI-H、dMMR 或 TMB-H（≥10 mut/Mb）</b>' +
        '（註 o：須經 FDA 核准之檢測判定，且<b>已於先前治療後進展、無其他滿意治療選項</b>者）',
        '<span class="drug">Nivolumab</span> + <span class="drug">ipilimumab</span>——<b>category 2B</b>，' +
        '<b>僅用於<u>轉移性且已進展</u>者</b>（only for metastatic disease with progression）'
      ]) +
      rxLine('局部區域不可切除／轉移性：標靶治療', '<b>需基因變異</b>', [
        '<span class="drug">Dabrafenib</span> + <span class="drug">trametinib</span>——<b>限 <u>BRAF V600E</u> 突變陽性</b>',
        '<span class="drug">Entrectinib</span>——<b>限 <u>NTRK</u> 基因融合陽性</b>',
        '<span class="drug">Larotrectinib</span>——<b>限 <u>NTRK</u> 基因融合陽性</b>',
        '<span class="drug">Repotrectinib</span>——<b>限 <u>NTRK</u> 基因融合陽性</b>',
        '<span class="drug">Selpercatinib</span>——<b>限 <u>RET</u> 基因融合陽性</b>'
      ]) +
      '<div class="rx-warn"><b>⚠ 註 h</b>：<b>免疫檢查點抑制劑併用化療，對所有肺外 PDNEC 病人而言仍屬<u>研究性質</u></b>' +
      '（investigational）。<br><b>⚠ 註 e</b>：<b>SSTR 影像（SSTR-PET/CT 或 SSTR-PET/MRI）<u>不屬於</u> PDNEC 之例行評估項目</b>' +
      '——此點與分化良好之 NET 相反。</div>' +
      '<div class="rx-def">' + cat2A + '</div>' +
      '</div>';
  }

  /* ---------- NE-H（4 of 9）：WD G3 之全身性治療 ---------- */
  function wdg3SystemicPanel(bio) {
    var h = '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">分化良好 G3 神經內分泌腫瘤之全身性治療<span class="rx-panel-src">NE-H（4 of 9）</span></div>' +
      '<div class="rx-def"><b>註 h</b>：<b>因缺乏前瞻性臨床試驗資料可指引治療，故<u>臨床試驗為 preferred</u></b>' +
      '（Clinical trials are preferred due to a lack of data from prospective clinical trials to guide therapy）。<br>' +
      '<b>註 m（Ki-67 55% 切點之限制）</b>：<b>適當切點應為何，資料上有其限制</b>；' +
      'Ki-67 於<b>同一腫瘤內</b>及<b>連續切片之間</b>皆存在<b>變異性／異質性</b>。' +
      '<b>臨床病程可能相當異質，治療考量須同時涵蓋病理與臨床特徵</b>。</div>';
    if (bio === 'unfav') {
      h += rxLine('Unfavorable Biology', 'Ki-67 ≥55%、生長較快、SSTR-PET 陰性', [
        '<span class="rx">Clinical trial</span>　<b>（preferred）</b>',
        '<span class="rx">Cisplatin/etoposide</span> 或 <span class="rx">Carboplatin/etoposide</span>',
        '<b>Irinotecan 為基礎之治療</b>（如 <span class="rx">FOLFIRI</span>、<span class="rx">cisplatin + irinotecan</span>、' +
        '或 <span class="rx">FOLFIRINOX</span>）',
        '<b>Oxaliplatin 為基礎之治療</b>（<span class="rx">FOLFOX</span> 或 <span class="rx">CAPEOX</span>）',
        '<span class="drug">Pembrolizumab</span>——<b>註 o：限 MSI-H、dMMR 或 TMB-H（≥10 mut/Mb）</b>' +
        '（須經 FDA 核准之檢測判定，且<b>先前治療後進展、無其他合適選項</b>者）',
        '<span class="rx">Temozolomide ± capecitabine</span>——<b>註 n：於<u>胰臟</u>原發者可能較 GI NET 更具活性</b>',
        '<span class="rx">Nivolumab + ipilimumab</span>——<b>category 2B</b>',
        '<b>局部晚期不可切除疾病</b> → <b>考慮 RT ± 併用 fluoropyrimidine 為基礎之化療</b>'
      ]);
    } else {
      h += rxLine('Favorable Biology', 'Ki-67 &lt;55%、生長較慢、SSTR-PET 陽性', [
        '<span class="rx">Clinical trial</span>　<b>（preferred）</b>',
        '<span class="drug">Cabozantinib</span>',
        '<b>化療</b>：<span class="rx">Temozolomide ± capecitabine</span>（<b>註 n：胰臟原發者可能較具活性</b>）、' +
        '<span class="rx">FOLFOX</span>、<span class="rx">CAPEOX</span>、<span class="rx">cisplatin/etoposide</span>、' +
        '或 <span class="rx">carboplatin/etoposide</span>',
        '<span class="drug">Everolimus</span>',
        '<span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>——' +
        '<b>（SSTR 陽性及／或有荷爾蒙症狀者）</b>；<b>於標準劑量進展後之超仿單劑量為 category 2B</b>',
        '<span class="drug">Pembrolizumab</span>——<b>限 MSI-H、dMMR 或 TMB-H（≥10 mut/Mb）</b>',
        '<b>PRRT</b> <span class="rx">Lutetium Lu 177 dotatate</span>——<b>（SSTR 陽性者）</b>',
        '<span class="drug">Sunitinib</span>——<b>⚠ 限<u>胰臟原發</u>（pancreas only）</b>',
        '<b>局部晚期不可切除疾病</b> → <b>考慮 RT ± 併用 fluoropyrimidine 為基礎之化療</b>'
      ]);
    }
    h += '<div class="rx-def">' + ssaDose + '</div></div>';
    return h;
  }

  /* ---------- 版面 HTML ---------- */
  function pnetPathwayHTML(embed) {
    var h = '';
    if (!embed) {
      h += '<p class="onc-note">依 <b>台大醫院胰臟神經內分泌腫瘤診療指引 版次 02（2026/06/16）</b>' +
        '（文件編號 50710-2-000048；Source: NCCN Guidelines <b>Version 3.2025</b>；PanNET-1～13、WDG3-1～4、NE-H）之互動決策流程。' +
        '<b>本流程僅適用於<u>分化良好</u>之胰臟 NET（G1／G2 與 WD G3）</b>——' +
        '分化差之<b>神經內分泌癌（NEC）</b>與<b>混合型（MiNEN）</b>不適用，須改用該部位癌症之處置。' +
        '<b>本指引各處方多以 or 並列，且明載「無資料可指引全身性治療之排序」。</b></p>';
    } else {
      // 嵌入於「神經內分泌瘤（NET）」條目之胰臟分支時的精簡說明（開場與重置鍵由 NET 統一提供）
      h += '<div class="note"><b>胰臟 NET（PanNET）之完整流程</b>——依台大胰臟神經內分泌腫瘤診療指引 版次 02' +
        '（PanNET-1～13、WDG3-1～4、PDNEC-1、NE-A、NE-H；Source: NCCN v3.2025）。' +
        '<b>步驟 1 依「分化程度」分三條主幹</b>：分化良好 G1／G2、分化良好 G3（WD G3），' +
        '以及<b>分化差之 NEC（小細胞／大細胞型）與 MiNEN</b>（走 PDNEC-1，治療與預後與 NET 完全不同）。</div>';
    }
    h += '<div class="onc-path" id="pnPath">';

    // Step 1 — 分化與分級
    h += step('pn_s1', '1', '分化與分級 Differentiation &amp; Grade（WHO 2019／消化系統腫瘤分類第 5 版）',
      opt('grade', 'g12', '分化良好 · G1／G2', 'Ki-67 &lt;3%（G1）或 3–20%（G2）→ PanNET-1～13') +
      opt('grade', 'wdg3', '分化良好 · G3（WD G3）', 'Ki-67 &gt;20% <b>但分化良好</b> → WDG3-1～4（<b>≠ NEC</b>）') +
      opt('grade', 'pdnec', '<b>分化差</b> · NEC（小細胞／大細胞型）或 MiNEN',
          'Poorly differentiated → <b>PDNEC-1</b>（≠ NET，治療與預後完全不同）'),
      '<div class="note"><b>AJCC v9（2023）之胰臟 NET 分期表明載適用於「Well-Differentiated Neuroendocrine Tumors of the ' +
      'Pancreas (<u>NET G1, G2, and G3</u>)」——即 </b><b>WD G3 與 G1／G2 共用同一張分期表</b>，但<b>治療流程不同</b>' +
      '（G1／G2 走 PanNET-1～13；WD G3 走 WDG3-1～4）。<br>' +
      '<b>WDG3-1 之評估（若對分化程度存疑）</b>：<b>考慮以組織病理或分子檢測評估 <u>p53、Rb、p16</u></b>' +
      '——用以區分「分化良好 G3」與「分化差之 NEC」。此外建議 <b>SSTR-PET/CT 或 SSTR-PET/MRI</b>、' +
      '視需要 <b>FDG-PET/CT</b>（<b>註 e：若考慮 PRRT，應同時考慮 FDG-PET 與 DOTATATE-PET</b>）、' +
      '<b>病理 review</b>，並<b>考慮腫瘤組織之分子檢測</b>（註 f：以腫瘤組織檢測為<b>優先</b>；' +
      '若不可行可考慮<b>液態切片</b>）。<b>基因檢測僅適用於十二指腸 NET 或 PanNET</b>。<br>' +
      '<b>⚠ 分化良好（NET）與分化差（NEC／MiNEN）是本頁最上游的分岔</b>——' +
      '<b>Ki-67 &gt;20% 同時見於 NET G3 與 NEC，不能只憑 Ki-67 判斷</b>，須依形態學之分化程度區分' +
      '（PDNEC-1A 註 c）。分類準則見下方 WHO 2019 對照表。<br>' +
      cat2A + '</div>' + whoClassPanel());

    // ===== G1/G2 分支 =====
    // Step 2 — 功能性型態
    h += connH('pn_c2');
    h += step('pn_s2', '2', '功能性型態 Functional status（決定評估項目、症狀控制與術式）',
      opt('func', 'nf', '無功能性 Nonfunctioning', 'PanNET-1／PanNET-2') +
      opt('func', 'gas', '胃泌素瘤 Gastrinoma', 'PanNET-3／PanNET-4（通常十二指腸或胰頭）') +
      opt('func', 'ins', '胰島素瘤 Insulinoma', 'PanNET-5／PanNET-6') +
      opt('func', 'glu', '升糖素瘤 Glucagonoma', 'PanNET-7／PanNET-8（通常胰尾）') +
      opt('func', 'vip', 'VIP 瘤 VIPoma', 'PanNET-9／PanNET-10'));
    h = h.replace('id="pn_s2"', 'id="pn_s2" class="hidden"');

    // Step 3 — 疾病範圍
    h += connH('pn_c3');
    h += step('pn_s3', '3', '疾病範圍 Disease extent',
      opt('scope', 'res', '侷限性疾病 · <b>可切除</b> Locoregional, resectable', 'PanNET-2／4／6／8／10') +
      opt('scope', 'unres', '侷限性疾病 · <b>不可切除</b> Locoregional, unresectable', '→ PanNET-12') +
      opt('scope', 'met', '轉移性疾病 Metastatic disease', '→ PanNET-12'));
    h = h.replace('id="pn_s3"', 'id="pn_s3" class="hidden"');

    // Step 4nf — 無功能可切除：腫瘤大小
    h += connH('pn_c4nf');
    h += step('pn_s4nf', '4', '腫瘤大小與侵犯／淋巴結狀態（無功能性、可切除；PanNET-2）',
      opt('size', 'le1', '小（≤1 cm）Small', '→ 觀察 Observation') +
      opt('size', 'm1to2', '&gt;1 至 ≤2 cm', '→ 三項並列：觀察／胰切除／摘除') +
      opt('size', 'gt2', '較大（&gt;2 cm）、<b>侵犯性</b>、或<b>淋巴結陽性</b>', '→ 胰切除 Pancreatectomy'),
      obsCritHtml());
    h = h.replace('id="pn_s4nf"', 'id="pn_s4nf" class="hidden"');

    // Step 4loc — 功能性可切除：位置
    h += connH('pn_c4loc');
    h += step('pn_s4loc', '4', '腫瘤位置 Location（功能性腫瘤、可切除）',
      opt('loc', 'duo', '十二指腸 Duodenum', '<b>僅胃泌素瘤適用</b>') +
      opt('loc', 'head', '胰頭 Head', '') +
      opt('loc', 'distal', '胰體／尾 Distal', '') +
      opt('loc', 'occult', '隱匿性 Occult', '<b>僅胃泌素瘤適用</b>：影像上無原發腫瘤或轉移'),
      '<div class="note"><b>位置決定術式</b>——本院指引對各功能性腫瘤依「Head／Distal」列出<u>不同</u>之手術；' +
      '胃泌素瘤另有「Duodenum」與「Occult」兩條獨有出口。<br>' + surgPrepNote() + '</div>');
    h = h.replace('id="pn_s4loc"', 'id="pn_s4loc" class="hidden"');

    // Step 4adv — 不可切除／轉移：臨床狀態
    h += connH('pn_c4adv');
    h += step('pn_s4adv', '4', '臨床狀態 Clinical status（局部晚期及／或轉移；PanNET-12）',
      opt('burden', 'low', '<b>無症狀、低腫瘤負荷、且疾病穩定</b>', 'Asymptomatic, low tumor burden, and stable disease') +
      opt('burden', 'sig', '<b>有症狀</b>　<b>或</b>　<b>臨床顯著之腫瘤負荷</b>　<b>或</b>　<b>臨床顯著之疾病進展</b>',
        '三者<b>任一</b>成立即走此分支'),
      '<div class="crit-box">' +
      cbx('評估 EVALUATION（PanNET-12）', '', [
        cb('影像', '<b>多相位腹部 ± 骨盆 CT 或 MRI</b>（NE-D），及<b>胸部 CT ± 顯影劑</b>（依臨床需要）'),
        cb('影像', '<b>SSTR-PET/CT 或 SSTR-PET/MRI</b>（NE-D）'),
        cb('生化', '<b>生化檢查</b>（依臨床需要，NE-E）')
      ]) +
      '<div class="note"><b>註 gg</b>：<b>於部分個案，直接進入一線全身性治療或局部區域治療</b>' +
      '（先於或與 octreotide LAR／lanreotide 併行）<b>可能是適當的</b>。</div></div>');
    h = h.replace('id="pn_s4adv"', 'id="pn_s4adv" class="hidden"');

    // ===== WD G3 分支 =====
    h += connH('pn_c2w');
    h += step('pn_s2w', '2', '疾病範圍 Disease extent（分化良好 G3；WDG3-1）',
      opt('w3scope', 'res', '侷限性疾病 · <b>可切除</b> Locoregional (Resectable)', '→ WDG3-2') +
      opt('w3scope', 'adv', '局部晚期／轉移性 Locally advanced / Metastatic', '→ WDG3-3（favorable）／WDG3-4（unfavorable）'));
    h = h.replace('id="pn_s2w"', 'id="pn_s2w" class="hidden"');

    h += connH('pn_c3w');
    h += step('pn_s3w', '3', '腫瘤生物學 Tumor biology（分化良好 G3）',
      opt('w3bio', 'fav', '<b>Favorable biology</b>', 'Ki-67 <b>&lt;55%</b>、生長較慢、<b>SSTR-PET 陽性</b>') +
      opt('w3bio', 'unfav', '<b>Unfavorable biology</b>', 'Ki-67 <b>≥55%</b>、生長較快、<b>SSTR-PET 陰性</b>'),
      '<div class="note"><b>註 g／m：Ki-67 55% 之切點有其資料上的限制</b>——' +
      '「適當切點應為何」缺乏充分資料，且 Ki-67 於<b>同一腫瘤內</b>與<b>連續切片之間</b>皆有<b>變異性與異質性</b>。' +
      '<b>臨床病程可能異質，治療考量須<u>同時</u>涵蓋病理與臨床特徵</b>' +
      '（指引原文：treatment considerations need to account for both pathologic and clinical features）。<br>' +
      '<b>指引使用「eg,（例如）」措辭</b>：favorable／unfavorable 之三項描述為<b>例示而非硬性判準</b>。</div>');
    h = h.replace('id="pn_s3w"', 'id="pn_s3w" class="hidden"');

    // ===== 分化差 NEC／MiNEN 分支（PDNEC-1）=====
    h += connH('pn_c2p');
    h += step('pn_s2p', '2', '疾病範圍 Disease extent（分化差 NEC／MiNEN；PDNEC-1）',
      opt('pdscope', 'res', '<b>可切除</b> Resectable', '→ 手術為主軸，處置依疾病部位而定') +
      opt('pdscope', 'unres', '<b>局部區域不可切除</b> Locoregional, unresectable', '→ 化放療或化療；進展後接續次線') +
      opt('pdscope', 'met', '<b>轉移性</b> Metastatic', '→ 化學治療；進展後接續次線'),
      '<div class="cbx"><div class="cbx-h">評估 EVALUATION（PDNEC-1；註 c、e）' +
      '　<span class="cbx-sub">建議項目與「視情況」項目分列</span></div><div class="cbx-items">' +
      cb('建議', '<b>多相位胸部／腹部／骨盆 CT</b>（NE-D）') +
      cb('建議', '<b>或</b> 胸部 CT ＋ 腹部／骨盆 MRI（NE-D）') +
      cb('視情況', '腦部 MRI 或含顯影劑之 CT') +
      cb('視情況', '<b>FDG-PET/CT</b>（NE-D）') +
      cb('視情況', '生化評估（依臨床需要）') +
      cb('視情況', '<b>考慮腫瘤組織之分子檢測</b>（註 g）') +
      '</div></div>' +
      '<div class="note"><b>註 f</b>：多相位影像須於<b>動脈期與門靜脈期</b>施打顯影劑。<br>' +
      '<b>⚠ 註 e</b>：<b>SSTR 影像（SSTR-PET/CT 或 SSTR-PET/MRI）<u>不屬於</u> PDNEC 之例行評估</b>' +
      '——與分化良好 NET 相反。<br>' +
      '<b>註 g（分子檢測）</b>：<b>局部區域不可切除／轉移且為抗癌治療候選者，應考慮腫瘤／體細胞分子檢測</b>以尋找可用藥之變異，' +
      '包括但不限於 <b>NTRK 融合、RET 融合、BRAF V600E、MSI-H、dMMR、TMB-H</b>；' +
      '<b>以腫瘤組織檢測為優先，不可行時可考慮液態切片</b>。<br>' +
      '<b>註 d（MiNEN）</b>：<b>PDNEC 常合併腺癌或鱗狀細胞癌等非神經內分泌成分，此類腫瘤之處置仍有爭議</b>；' +
      '<b>常可考慮採用針對該非神經內分泌成分之化療處方</b>。<br>' +
      '<b>文獻</b>：Eads JR et al. Endocr Relat Cancer 2023;30:e220206（註 a）；' +
      'Sorbye H et al. J Neuroendocrinol 2023;35:e13249（註 b）。</div>');
    h = h.replace('id="pn_s2p"', 'id="pn_s2p" class="hidden"');

    // 建議處置 + 追蹤
    h += '<div class="flow-rec rec-idle" id="pn_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="pn_fu"></div>';

    // 嵌入模式下不放自己的重置鍵（由外層 NET 統一提供）
    if (!embed) h += '<div class="flow-reset"><button class="btn-reset" onclick="pnReset()">重置</button></div>';
    h += '</div>'; // pnPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function pnSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function pnShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function pnClearSel(ids) {
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
    var el = document.getElementById('pn_fu');
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'surv') {
      h = '<div class="fu-label">監測 Surveillance（PanNET-11）</div><ul class="fu-list">' +
        '<li><b>術後 12 週–12 個月</b>：<b>病史與理學檢查（H&amp;P）</b>；' +
        '<b>功能性腫瘤</b>依臨床需要追蹤<b>生化標記</b>（NE-E）；' +
        '<b>多相位腹部 ± 骨盆 CT 或 MRI</b>（NE-D）；<b>胸部 CT（± 顯影劑）</b>依臨床需要。</li>' +
        '<li><b>術後 &gt; 1 年，至多至 10 年</b>：<b>每 6–12 個月</b>重複上述同一組項目。</li>' +
        '<li><b>&gt; 10 年</b>：<b>依臨床需要考慮監測</b>（註 z：Singh S et al. JAMA Oncol 2018;4:1597-1604）。</li>' +
        '<li><b>註 v</b>：<b>若出現症狀應提早追蹤</b>（Earlier, if symptoms）。</li>' +
        '<li><b>⚠ 註 w</b>：<b>SSTR 影像與 FDG-PET/CT <u>不建議</u>用於例行監測</b>' +
        '（not recommended for routine surveillance）。</li>' +
        '<li><b>註 x</b>：<b>本監測建議<u>同樣適用於選擇「觀察」之個案</u></b>。</li>' +
        '<li><b>疾病復發（註 aa）</b>：<b>於部分個案可考慮切除</b>（In select cases, resection may be considered）——' +
        '復發之處置見 NE-F（註 bb）。</li>' +
        '</ul>';
    } else if (type === 'w3res') {
      h = '<div class="fu-label">監測 Surveillance（WDG3-2 · 侷限可切除之分化良好 G3）</div><ul class="fu-list">' +
        '<li><b>每 12–24 週一次，共 2 年</b>；之後<b>每 6–12 個月一次，至多至 10 年</b>' +
        '（<b>依腫瘤生物學與 Ki-67 而定</b>）。</li>' +
        '<li>每次內容：<b>病史與理學檢查（H&amp;P）</b>、<b>含顯影劑之多相位腹部／骨盆 CT 或 MRI</b>、' +
        '<b>胸部 CT</b>（依臨床需要）。</li>' +
        '</ul>';
    } else if (type === 'w3fav') {
      h = '<div class="fu-label">監測 Surveillance（WDG3-3 · 局部晚期／轉移 · favorable biology）</div><ul class="fu-list">' +
        '<li><b>每 12–24 週一次</b>（依腫瘤生物學而定）。</li>' +
        '<li>內容：<b>H&amp;P</b>；<b>含顯影劑之多相位腹部／骨盆 CT 或 MRI</b>（NE-D）；' +
        '<b>胸部 CT（± 顯影劑）</b>依臨床需要；<b>SSTR-PET/CT 或 SSTR-PET/MRI 或 FDG-PET/CT</b> 依臨床需要（NE-D）；' +
        '<b>生化標記</b>依臨床需要。</li>' +
        '<li><b>已切除者（resectable 分支）</b>：<b>每 12–24 週一次，共 2 年</b>；之後<b>每 6–12 個月，至多至 10 年</b>。</li>' +
        '</ul>';
    } else if (type === 'w3unfav') {
      h = '<div class="fu-label">監測 Surveillance（WDG3-4 · 局部晚期／轉移 · unfavorable biology）</div><ul class="fu-list">' +
        '<li><b>每 8–12 週一次</b>（依腫瘤生物學而定）——<b>較 favorable biology 之 12–24 週<u>更密集</u></b>。</li>' +
        '<li>內容：<b>H&amp;P</b>；<b>含顯影劑之多相位腹部／骨盆 CT 或 MRI</b>（NE-D）；' +
        '<b>胸部 CT（± 顯影劑）</b>依臨床需要；<b>FDG-PET/CT</b> 依臨床需要；<b>生化標記</b>依臨床需要（NE-E）。</li>' +
        '<li><b>⚠ 注意此分支列 FDG-PET/CT 而非 SSTR-PET</b>——與 favorable biology 之 SSTR-PET 陽性相對應。</li>' +
        '</ul>';
    } else if (type === 'pdres') {
      h = '<div class="fu-label">監測 Surveillance（PDNEC-1 · 分化差 · 可切除分支）</div><ul class="fu-list">' +
        '<li><b>每 12 週一次，共 1 年；之後每 6 個月一次</b>（註 j：<b>若出現症狀應提早</b>）。</li>' +
        '<li>每次內容：<b>病史與理學檢查（H&amp;P）</b>；<b>適當之影像檢查</b>——' +
        '<b>胸部 CT（± 顯影劑）＋ 含顯影劑之腹部／骨盆 MRI</b>，' +
        '<b>或</b> <b>多相位胸部／腹部／骨盆 CT</b>（NE-D）。</li>' +
        '<li><b>⚠ 與不可切除／轉移分支不同</b>：後者為<b>每 6–16 週</b>之較密集監測。</li>' +
        '<li><b>註 k</b>：長期存活者之照護另見 NCCN Guidelines for Survivorship。</li>' +
        '</ul>';
    } else if (type === 'pdadv') {
      h = '<div class="fu-label">監測 Surveillance（PDNEC-1 · 分化差 · 局部區域不可切除／轉移分支）</div><ul class="fu-list">' +
        '<li><b>每 6–16 週一次</b>（註 j：<b>若出現症狀應提早</b>）——' +
        '<b>本監測涵蓋<u>局部區域不可切除</u>與<u>轉移性</u>兩條分支</b>（原圖之括號同時涵蓋兩列）。</li>' +
        '<li>每次內容：<b>病史與理學檢查（H&amp;P）</b>；<b>適當之影像檢查</b>——' +
        '<b>胸部 CT（± 顯影劑）＋ 含顯影劑之腹部／骨盆 MRI</b>，' +
        '<b>或</b> <b>多相位胸部／腹部／骨盆 CT</b>（NE-D）。</li>' +
        '<li><b>疾病進展</b> → <b>化學治療／免疫治療／標靶治療</b>（NE-H，三項並列；見建議處置內之處方面板）。</li>' +
        '<li><b>註 k</b>：長期存活者之照護另見 NCCN Guidelines for Survivorship。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">監測與後續 Follow-up（PanNET-12 → PanNET-13）</div><ul class="fu-list">' +
        '<li><b>觀察者</b>：以<b>標記</b>與<b>多相位腹部／骨盆 CT 或 MRI</b>（NE-D）<b>每 12 週–12 個月</b>追蹤；' +
        '<b>胸部 CT（± 顯影劑）</b>依臨床需要。</li>' +
        '<li><b>出現臨床顯著之疾病進展</b> → 進入「有症狀／顯著負荷／進展」之處置（可於步驟 4 改選）。</li>' +
        '<li><b>治療中再度進展</b> → <b>PanNET-13 後續治療</b>（見上方選單）。</li>' +
        '<li><b>已切除轉移灶與原發灶者</b> → 依 <b>PanNET-11</b> 之監測建議追蹤（見「監測」分支）。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }
  function result(cls, title, lines, note, fuType, extra) {
    ulRec('pn_rec', cls, title, lines, note, extra);
    renderFollowup(fuType);
  }
  function idleRec(title) { ulRec('pn_rec', 'rec-idle', title, [], ''); renderFollowup(null); }

  /* ---------- 主渲染 ---------- */
  function pnRender() {
    var s = pnSt;
    var g12 = s.grade === 'g12', wdg3 = s.grade === 'wdg3', pdnec = s.grade === 'pdnec';

    pnShow('pn_c2', g12); pnShow('pn_s2', g12);

    var showScope = g12 && !!s.func;
    pnShow('pn_c3', showScope); pnShow('pn_s3', showScope);

    var res = showScope && s.scope === 'res';
    var nfRes = res && s.func === 'nf';
    var funcRes = res && s.func !== 'nf';
    pnShow('pn_c4nf', nfRes); pnShow('pn_s4nf', nfRes);
    pnShow('pn_c4loc', funcRes); pnShow('pn_s4loc', funcRes);

    var adv = showScope && (s.scope === 'unres' || s.scope === 'met');
    pnShow('pn_c4adv', adv); pnShow('pn_s4adv', adv);

    pnShow('pn_c2w', wdg3); pnShow('pn_s2w', wdg3);
    var showBio = wdg3 && !!s.w3scope;
    pnShow('pn_c3w', showBio); pnShow('pn_s3w', showBio);

    pnShow('pn_c2p', pdnec); pnShow('pn_s2p', pdnec);

    renderRec();
  }

  function renderRec() {
    var s = pnSt;
    if (!s.grade) { idleRec('請選擇步驟 1（分化與分級）'); return; }

    /* ===== 分化差 NEC／MiNEN（PDNEC-1）=====
       ⚠ 流程圖之連線（已對照原圖確認）：「若進展」之次線選項與「每 6–16 週」之監測，
       其括號同時涵蓋<局部區域不可切除>與<轉移性>兩列；<可切除>則自成一列、
       採另一套較疏的監測（每 12 週 × 1 年 → 每 6 個月）。 */
    if (s.grade === 'pdnec') {
      if (!s.pdscope) { idleRec('請選擇步驟 2（疾病範圍）'); return; }

      if (s.pdscope === 'res') {
        result('rec-elective', '分化差 NEC／MiNEN · <b>可切除</b> → 依疾病部位選擇，四項並列（PDNEC-1）', [
          '<b>指引原文</b>：<b>治療選項取決於疾病侵犯之部位</b>（Therapy options depend on sites of disease），' +
          '以下<b>四項為並列選項，指引未定義優先順序</b>：',
          '<b>①</b> <b>切除</b>（NE-F）＋ <b>術後輔助化療</b>（NE-H）<b>± 放療</b>',
          '<b>②</b> <b>術前新輔助化療</b>（NE-H）<b>± 放療</b> ＋ <b>切除</b>（NE-F）',
          '<b>③</b> <b>單獨化療</b>（Chemotherapy alone，NE-H）',
          '<b>④</b> <b>根治性化放療</b>：<span class="rx">cisplatin + etoposide</span> 或 ' +
          '<span class="rx">carboplatin + etoposide</span>',
          '<b>處方細節見下方 NE-H 5 of 9。</b>'
        ], 'PDNEC-1：Extrapulmonary poorly differentiated → Resectable → Resection (NE-F) + adjuvant chemotherapy (NE-H) ± RT ／ ' +
           'Neoadjuvant chemotherapy (NE-H) ± RT + resection (NE-F) ／ Chemotherapy alone (NE-H) ／ ' +
           'Definitive chemoradiation with cisplatin + etoposide or carboplatin + etoposide。' + '｜' + cat2A,
        'pdres', pdnecSystemicPanel());
        return;
      }

      if (s.pdscope === 'unres') {
        result('rec-nonop', '分化差 NEC／MiNEN · <b>局部區域不可切除</b> → 化放療 或 化療（PDNEC-1）', [
          '<b>同步或依序之放療 ＋ 化療</b>（Concurrent or sequential RT + chemotherapy，NE-H），',
          '<b>或</b> <b>單獨化療</b>（Chemotherapy，NE-H）。',
          '<b>化放療處方（NE-H 5 of 9）</b>：<span class="drug">capecitabine</span>' +
          '（<b>當 etoposide + 鉑類不可行時</b>）／<span class="rx">carboplatin + etoposide</span>／' +
          '<span class="rx">cisplatin + etoposide</span>。',
          '<b>若進展</b>（NE-H）→ <b>化學治療</b>／<b>免疫治療</b>／<b>標靶治療</b>（三項並列，見下方處方面板）。'
        ], 'PDNEC-1：Locoregional, unresectable → Concurrent or sequential RT + chemotherapy (NE-H) or Chemotherapy (NE-H) → ' +
           'If progression (NE-H): Chemotherapy／Immunotherapy／Targeted therapy。' + '｜' + cat2A,
        'pdadv', pdnecSystemicPanel());
        return;
      }

      // met
      result('rec-nonop', '分化差 NEC／MiNEN · <b>轉移性</b> → 化學治療（PDNEC-1）', [
        '<b>化學治療</b>（Chemotherapy，NE-H）——<b>轉移性分支於 PDNEC-1 僅列此一項</b>，' +
        '不含放療（與局部區域不可切除分支之「化放療」不同）。',
        '<b>若進展</b>（NE-H）→ <b>化學治療</b>／<b>免疫治療</b>／<b>標靶治療</b>（三項並列，見下方處方面板）。',
        '<b>此分支可用 <span class="drug">nivolumab</span> + <span class="drug">ipilimumab</span></b>' +
        '（category 2B）——<b>該選項僅限「轉移性且已進展」者</b>，局部區域不可切除者不適用。'
      ], 'PDNEC-1：Metastatic → Chemotherapy (NE-H) → If progression (NE-H): Chemotherapy／Immunotherapy／Targeted therapy。' +
         '｜' + cat2A,
      'pdadv', pdnecSystemicPanel());
      return;
    }

    /* ===== 分化良好 G3（WDG3-1～4）===== */
    if (s.grade === 'wdg3') {
      if (!s.w3scope) { idleRec('請選擇步驟 2（疾病範圍）'); return; }
      if (!s.w3bio) { idleRec('請選擇步驟 3（腫瘤生物學）'); return; }

      if (s.w3scope === 'res') {
        if (s.w3bio === 'fav') {
          result('rec-elective', '分化良好 G3 · 侷限可切除 · <b>Favorable biology</b> → 切除 ＋ 區域淋巴結廓清（WDG3-2）', [
            '<b>「Resection + regional lymphadenectomy <u>if feasible</u>」</b>——' +
            '<b>本分支為<u>單一建議</u>，指引未於此列出並列選項</b>。',
            '<b>對照 unfavorable biology</b>：後者為<b>三項並列</b>（臨床試驗 preferred／切除／新輔助化療）——' +
            '<b>favorable biology 則直接手術，不列新輔助化療</b>。',
            '<b>「if feasible」為指引原文</b>：區域淋巴結廓清以<b>可行為前提</b>。'
          ], 'WDG3-2：Locoregional disease (resectable) → Favorable biology (eg, relatively low Ki-67 [<55%], slow growing, ' +
            'positive SSTR-based PET imaging) → Resection + regional lymphadenectomy if feasible。' + '｜' + cat2A,
            'w3res');
          return;
        }
        result('rec-elective', '分化良好 G3 · 侷限可切除 · <b>Unfavorable biology</b> → 三項並列（WDG3-2）', [
          '<span class="rx">Clinical trial</span>　<b>（preferred）</b>',
          '<b>或</b>　<b>切除 ＋ 區域淋巴結廓清（if feasible）</b>',
          '<b>或</b>　<b>新輔助化療（Neoadjuvant chemotherapy）——<u>依個案逐一決定</u></b>' +
          '（on a case-by-case basis，<b>例如 Ki-67 ≥55%</b>）（NE-H）',
          '<b>⚠ 與 favorable biology 之差異</b>：favorable 僅列「切除 + 區域淋巴結廓清」單一項；' +
          '<b>unfavorable 才加入「臨床試驗（preferred）」與「新輔助化療」</b>。'
        ], 'WDG3-2：Locoregional disease (resectable) → Unfavorable biology (eg, relatively high Ki-67 [≥55%], faster growing, ' +
          'negative SSTR-based PET imaging) → Clinical trial (preferred) or Resection with regional lymphadenectomy if feasible ' +
          'or Neoadjuvant chemotherapy on a case-by-case basis (eg, Ki-67 ≥55%)（NE-H）。' + '｜' + cat2A,
          'w3res', wdg3SystemicPanel('unfav'));
        return;
      }

      // 局部晚期／轉移
      if (s.w3bio === 'fav') {
        result('rec-nonop', '分化良好 G3 · 局部晚期／轉移 · <b>Favorable biology</b>（WDG3-3）', [
          '<b>可切除者</b> → <b>切除原發灶 ＋ 轉移灶</b>——' +
          '<b>條件：可行、且風險與毒性可接受</b>（if feasible, with acceptable risk and toxicity profile）。',
          '<b>不可切除、<u>無症狀且低腫瘤負荷</u>者</b> → <b>四項並列</b>：' +
          '<b>①</b> <b>短間隔追蹤影像之觀察</b>（<b>限選擇性病人</b>）；' +
          '<b>②</b> <span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>' +
          '（<b>SSTR 陽性及／或有荷爾蒙症狀者</b>）；' +
          '<b>③</b> <b>PRRT</b> <span class="rx">Lutetium Lu 177 dotatate</span>（<b>SSTR 陽性者</b>）——<b>category 2B</b>；' +
          '<b>④</b> <b>寡轉移及／或有症狀轉移之姑息性放療</b>（<b>不含繫膜腫塊</b>，NE-I）。',
          '<b>不可切除、有<u>臨床顯著腫瘤負荷</u>或<u>疾病進展證據</u>者</b> → <b>三項並列</b>：' +
          '<span class="rx">Clinical trial</span>（<b>preferred</b>）／<b>全身性治療</b>（NE-H 4 of 9，見下方選單）／' +
          '<b>局部區域治療</b>（<b>肝主導疾病之肝臟導向治療</b>；<b>寡轉移／症狀轉移之姑息放療</b>；' +
          '<b>局部晚期不可切除者考慮 RT ± fluoropyrimidine 化療</b>）。'
        ], 'WDG3-3：Locally advanced/Metastatic disease: Favorable biology → Resectable → Resection of primary + metastatic sites, ' +
          'if feasible, with acceptable risk and toxicity profile；Unresectable → Asymptomatic, low tumor burden → Observation with ' +
          'short-interval follow-up scan, in selected patients or Octreotide LAR/lanreotide or PRRT (category 2B) or Palliative RT；' +
          'Clinically significant tumor burden or evidence of disease progression → Clinical trial (preferred) or Systemic therapy ' +
          '(NE-H 4 of 9) or Locoregional therapy options。' + '｜' + cat2A,
          'w3fav', wdg3SystemicPanel('fav'));
        return;
      }
      result('rec-nonop', '分化良好 G3 · 局部晚期／轉移 · <b>Unfavorable biology</b>（WDG3-4）', [
        '<span class="rx">Clinical trial</span>　<b>（preferred）</b>',
        '<b>或</b>　<b>全身性治療選項</b>（NE-H 4 of 9——見下方選單）',
        '<b>或</b>　<b>局部區域治療選項</b>：' +
        '<b>①</b> <b>局部晚期不可切除疾病</b> → 考慮 <b>RT ± 併用 fluoropyrimidine 為基礎之化療</b>；' +
        '<b>②</b> <b>考慮加入肝臟導向治療</b>（<b>註 l：用於<u>全身性治療後仍以肝臟為主之殘餘疾病</u>之選擇性個案</b>）；' +
        '<b>③</b> <b>寡轉移及／或有症狀轉移之姑息性放療</b>（<b>不含繫膜腫塊</b>，NE-I）。',
        '<b>⚠ 本分支<u>不含手術切除選項</u></b>——WDG3-4 之圖示無「Resectable → Resection」出口，' +
        '與 favorable biology（WDG3-3）有切除出口不同。'
      ], 'WDG3-4：Locally advanced/Metastatic disease: Unfavorable biology (relatively high Ki-67 [≥55%], rapid growth rate, ' +
        'FDG-avid tumors, negative SSTR-based PET imaging) → Clinical trial (preferred) or Systemic therapy options (NE-H 4 of 9) ' +
        'or Locoregional therapy options。' + '｜' + cat2A,
        'w3unfav', wdg3SystemicPanel('unfav'));
      return;
    }

    /* ===== 分化良好 G1／G2（PanNET-1～13）===== */
    if (!s.func) { idleRec('請選擇步驟 2（功能性型態）'); return; }
    if (!s.scope) { idleRec('請選擇步驟 3（疾病範圍）'); return; }

    var evalBox = evalHtml(s.func);

    /* --- 不可切除／轉移（PanNET-12）--- */
    if (s.scope === 'unres' || s.scope === 'met') {
      if (!s.burden) { idleRec('請選擇步驟 4（臨床狀態）'); return; }
      if (s.burden === 'low') {
        result('rec-nonop', '局部晚期／轉移 · <b>無症狀、低腫瘤負荷、疾病穩定</b> → 三項並列（PanNET-12）', [
          '<b>①</b> <b>切除轉移灶與原發灶</b>——<b>若可行且臨床有指徵</b>（if possible and clinically indicated，NE-F）。' +
          '<b>註 dd：可行時採<u>分階段或同步切除</u></b>；<b>執行分階段之胰十二指腸切除與肝切除時，' +
          '應考慮<u>肝切除先於胰臟切除</u>，以降低<u>肝周敗血症</u>之風險</b>（De Jong MC, Ann Surg 2010;252:142-148）。',
          '<b>②</b> <b>觀察</b>——以<b>標記</b>與<b>多相位腹部／骨盆 CT 或 MRI</b>（NE-D）<b>每 12 週–12 個月</b>追蹤；' +
          '<b>胸部 CT（± 顯影劑）</b>依臨床需要。',
          '<b>③</b> <b>考慮</b> <span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>' +
          '（NE-H 2 of 9）——<b>此處措辭為「Consider」</b>。',
          '<b>註 ee</b>：具生殖細胞系 <b>VHL</b> 變異者使用 <span class="drug">belzutifan</span> 須<b>個別化決定</b>' +
          '（<b>category 2B</b>）；<b>用於較大腫瘤、局部晚期不可切除與遠處疾病之資料極為有限</b>。',
          '<b>出現臨床顯著之疾病進展</b> → 轉入「有症狀／顯著負荷／進展」分支（請於<b>步驟 4</b> 改選）。'
        ], 'PanNET-12：Asymptomatic, low tumor burden, and stable disease → Resect metastases and primary if possible and ' +
          'clinically indicated (NE-F)<sup>dd,ee</sup> ／ Observe with markers and multiphasic abdomen/pelvis CT or MRI every ' +
          '12 wk–12 mo and chest CT (± contrast) as clinically indicated ／ Consider octreotide LAR<sup>m,n,ff</sup> or ' +
          'lanreotide<sup>m,n,ff</sup> (NE-H 2 of 9)。' + '｜' + cat2A,
          'palliative', evalBox + systemicPanel());
        return;
      }
      result('rec-nonop', '局部晚期／轉移 · <b>有症狀／臨床顯著腫瘤負荷／臨床顯著疾病進展</b> → 四項並列（PanNET-12）', [
        '<b>①</b> <b>切除轉移灶與原發灶</b>——<b>若可行且臨床有指徵</b>（NE-F，註 dd／ee）。',
        '<b>②</b> <b>適當處理臨床顯著之症狀</b>——依各功能性型態之處置' +
        '（PanNET-1、PanNET-3、PanNET-5、PanNET-7、PanNET-9）。' +
        '<b>可於步驟 2 改選功能性型態以檢視對應之症狀控制處置。</b>',
        '<b>③</b> <span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>' +
        '——<b>若尚未接受者</b>（if not already receiving，NE-H 3 of 9）。' +
        '<b>注意此處措辭為直述而非「Consider」</b>，與低負荷分支不同。',
        '<b>④</b> <b>考慮替代之一線治療</b>（alternative front-line therapy）——' +
        '<b>全身性治療選項見 NE-H 2 of 9</b>（下方選單）；<b>局部區域治療選項見 PanNET-13</b>（下方選單）。' +
        '<b>註 gg：於部分個案，先於或與 SSA 併行進入一線全身性或局部區域治療可能是適當的。</b>',
        '<b>疾病進展</b> → <b>PanNET-13 後續治療</b>（見下方選單）。'
      ], 'PanNET-12：Symptomatic or Clinically significant tumor burden or Clinically significant progressive disease<sup>cc</sup> → ' +
        'Resect metastases and primary if possible and clinically indicated (NE-F)<sup>dd,ee</sup> ／ Manage clinically significant ' +
        'symptoms as appropriate (PanNET-1, PanNET-3, PanNET-5, PanNET-7, and PanNET-9) ／ Octreotide LAR or lanreotide (if not ' +
        'already receiving) (NE-H 3 of 9) ／ Consider alternative front-line therapy (NE-H 2 of 9 ／ PanNET-13)<sup>gg</sup> → ' +
        'Disease progression (PanNET-13)。' + '｜' + cat2A,
        'palliative', evalBox + systemicPanel() + subsequentPanel());
      return;
    }

    /* --- 可切除（PanNET-2／4／6／8／10）--- */
    /* 無功能性（PanNET-2）*/
    if (s.func === 'nf') {
      if (!s.size) { idleRec('請選擇步驟 4（腫瘤大小與侵犯／淋巴結狀態）'); return; }
      if (s.size === 'le1') {
        result('rec-elective', '無功能性 · 可切除 · <b>小（≤1 cm）</b> → <b>觀察</b>（PanNET-2）', [
          '<b>「Observation」——本分支為<u>單一建議，無並列選項</u></b>。' +
          '<b>指引於 ≤1 cm 未列出任何手術選項。</b>',
          '<b>對照 &gt;1 至 ≤2 cm</b>：後者才出現「觀察（限選擇性個案）／胰切除／摘除」三項並列。',
          '<b>註 e：觀察之決策依據</b>為<b>預估手術風險、腫瘤位置、病人共病</b>（見上方準則區塊）。',
          '<b>註 x：選擇觀察者仍須依 PanNET-11 監測建議追蹤</b>（見下方）。',
          '<b>註 g</b>：具生殖細胞系 <b>VHL</b> 變異之可切除腫瘤可<b>考慮</b> <span class="drug">belzutifan</span>；' +
          '<b>用於小型可切除腫瘤之決定須個別化</b>。'
        ], 'PanNET-2：Locoregional disease (Nonfunctioning pancreatic tumors)<sup>e</sup> → Resectable<sup>f</sup> → ' +
          'Small (≤1 cm) → Observation → PanNET-11。' + '｜' + cat2A,
          'surv', evalBox + obsCritHtml());
        return;
      }
      if (s.size === 'm1to2') {
        result('rec-elective', '無功能性 · 可切除 · <b>&gt;1 至 ≤2 cm</b> → 三項並列（PanNET-2）', [
          '<b>①</b> <b>觀察</b>——<b>限選擇性個案</b>（Observation in select cases，註 e）。',
          '<b>②</b> <b>胰切除 Pancreatectomy</b>（NE-F，註 h、i、j）。',
          '<b>③</b> <b>摘除 Enucleation</b>——<b>限選擇性個案</b>（Enucleation in select cases，註 i）。',
          '<b>⚠ 註 j（本區間之關鍵）</b>：<b>1–2 cm 之 PanNET 具有<u>雖小但確實存在</u>之淋巴結轉移風險</b>，' +
          '<b>因此應考慮淋巴結切除</b>（lymph node resection should be considered）。',
          '<b>註 i</b>：<b>視情況應考慮中段胰切除或保脾手術</b>。' +
          '<b>註 h</b>：若手術可能含脾切除，<b>術前應接種抗莢膜細菌疫苗</b>（肺炎鏈球菌、b 型嗜血桿菌、C 群腦膜炎雙球菌）。',
          '<b>三項為 or 並列，指引未指定首選。</b>'
        ], 'PanNET-2：Resectable<sup>f</sup> → >1 to ≤2 cm → Observation in select cases<sup>e</sup> or Pancreatectomy<sup>h,i,j</sup> ' +
          '(NE-F) or Enucleation in select cases<sup>i</sup> (NE-F) → PanNET-11。' + '｜' + cat2A,
          'surv', evalBox + obsCritHtml());
        return;
      }
      result('rec-elective', '無功能性 · 可切除 · <b>&gt;2 cm、侵犯性、或淋巴結陽性</b> → <b>胰切除</b>（PanNET-2）', [
        '<b>「Pancreatectomy」（NE-F，註 h、i）——本分支<u>不再列出觀察或摘除</u></b>。',
        '<b>三項觸發條件為<u>並列（or）</u></b>：<b>Larger (&gt;2 cm)</b>、<b>invasive</b>、<b>node-positive tumors</b>' +
        '——<b>任一成立即走本分支</b>，不是只看尺寸。',
        '<b>註 i</b>：<b>視情況應考慮中段胰切除（central pancreatectomy）或保脾手術</b>。',
        '<b>註 h</b>：若手術可能含脾切除，<b>術前應接種抗莢膜細菌疫苗</b>（肺炎鏈球菌、b 型嗜血桿菌、C 群腦膜炎雙球菌）——' +
        '見 NE-F（2 of 3）。',
        '<b>⚠ 注意</b>：<b>PanNET 之<u>輔助性全身治療並無已知角色</u></b>' +
        '（NE-H 2 of 9：There is no known role for systemic treatment in the adjuvant setting for PanNETs）。'
      ], 'PanNET-2：Resectable<sup>f</sup> → Larger (>2 cm), invasive, or node-positive tumors → Pancreatectomy<sup>h,i</sup> ' +
        '(NE-F) → PanNET-11。' + '｜' + cat2A,
        'surv', evalBox);
      return;
    }

    /* 功能性腫瘤（PanNET-4／6／8／10）*/
    if (!s.loc) { idleRec('請選擇步驟 4（腫瘤位置）'); return; }

    var symCtl = '', title = '', lines = [], note = '';

    if (s.func === 'gas') {
      symCtl = '<b>症狀控制（PanNET-4，貫穿各位置）</b>：<b>①</b> <b>以<u>高劑量氫離子幫浦抑制劑（PPI）</u>控制胃酸過度分泌</b>' +
        '（Manage gastric hypersecretion with high-dose proton pump inhibitors）；<b>②</b> ' +
        '<span class="drug">Octreotide LAR</span> 或 <span class="drug">Lanreotide</span>。';
      if (s.loc === 'duo') {
        title = '胃泌素瘤 · 可切除 · <b>十二指腸</b> → 十二指腸切開 ＋ 術中超音波 ＋ 局部切除／摘除 ＋ 十二指腸旁淋巴結廓清（PanNET-4）';
        lines = ['<b>十二指腸切開術（duodenotomy）＋ 術中超音波（intraoperative ultrasound）</b>；' +
          '<b>腫瘤局部切除／摘除（local resection/enucleation）＋ <u>十二指腸旁淋巴結廓清（periduodenal node dissection）</u></b>（NE-F）。',
          '<b>⚠ 十二指腸旁淋巴結廓清為本術式之明列組成</b>——胃泌素瘤之淋巴結處置在指引中<b>寫得比其他功能性腫瘤更明確</b>。'];
        note = 'PanNET-4：Locoregional disease (Gastrinoma)(NE-L) → Resectable → Duodenum → Duodenotomy and intraoperative ' +
          'ultrasound; local resection/enucleation of tumor(s) + periduodenal node dissection (NE-F) → PanNET-11。';
      } else if (s.loc === 'head') {
        title = '胃泌素瘤 · 可切除 · <b>胰頭</b> → 胰十二指腸切除術（PanNET-4）';
        lines = ['<b>胰十二指腸切除術（Pancreatoduodenectomy）</b>（NE-F，註 h）。', surgPrepNote()];
        note = 'PanNET-4：Resectable → Head → Pancreatoduodenectomy<sup>h</sup> (NE-F) → PanNET-11。';
      } else if (s.loc === 'distal') {
        title = '胃泌素瘤 · 可切除 · <b>胰體／尾</b> → 遠端胰切除 ＋ 脾切除 ＋ 區域淋巴結（PanNET-4）';
        lines = ['<b>遠端胰切除術（Distal pancreatectomy）＋ <u>脾切除</u> ＋ <u>區域淋巴結</u></b>' +
          '（Distal pancreatectomy + splenectomy<sup>h</sup> + regional nodes，NE-F）。', surgPrepNote()];
        note = 'PanNET-4：Resectable → Distal → Distal pancreatectomy + splenectomy<sup>h</sup> + regional nodes (NE-F) → PanNET-11。';
      } else { // occult
        title = '胃泌素瘤 · <b>隱匿性（影像無原發腫瘤或轉移）</b> → 觀察<b>或</b>手術探查（PanNET-4）';
        lines = ['<b>兩項並列</b>：<b>①</b> <b>觀察（Observe）</b>；<b>②</b> <b>手術探查（Exploratory surgery）</b>——' +
          '<b>含十二指腸切開術與術中超音波；腫瘤局部切除／摘除 ＋ 十二指腸旁淋巴結廓清</b>（NE-F）。',
          '<b>「Occult, no primary tumor or metastases on imaging」為胃泌素瘤<u>獨有</u>之出口</b>——' +
          '其他功能性腫瘤之流程圖無此分支。'];
        note = 'PanNET-4：Occult, no primary tumor or metastases on imaging → Observe or Exploratory surgery including ' +
          'duodenotomy and intraoperative ultrasound; local resection/enucleation of tumor(s) + periduodenal node dissection ' +
          '(NE-F) → PanNET-11。';
      }
    } else if (s.func === 'ins') {
      symCtl = '<b>症狀控制（PanNET-6）</b>：<b>以<u>飲食</u>及／或 <span class="drug">diazoxide</span> 及／或 ' +
        '<span class="drug">everolimus</span> 穩定血糖</b>（Stabilize glucose levels with diet and/or diazoxide and/or everolimus，註 p）。' +
        '<br>' + insulinomaSsaWarn;
      if (s.loc === 'duo' || s.loc === 'occult') {
        title = '胰島素瘤 · <b>此位置分支不適用</b>';
        lines = ['<b>本院指引之胰島素瘤流程（PanNET-6）僅有「Head」與「Distal」兩個位置出口</b>——' +
          '<b>「十二指腸」與「隱匿性」為<u>胃泌素瘤獨有</u>之分支</b>。',
          '請於<b>步驟 4</b> 改選「胰頭 Head」或「胰體／尾 Distal」。'];
        note = 'PanNET-6：Locoregional disease (insulinoma)(NE-L) → Resectable → 依「Exophytic or peripheral tumors by imaging」' +
          '與「Deeper or invasive tumors and those in proximity to the main pancreatic duct」再分 Head／Distal。';
        result('rec-idle', title, lines, note, null, evalBox);
        return;
      }
      title = '胰島素瘤 · 可切除 · <b>' + (s.loc === 'head' ? '胰頭' : '胰體／尾') + '</b> → 術式依腫瘤深度與位置而定（PanNET-6）';
      lines = [
        '<b>⚠ 胰島素瘤之術式<u>不是單看 Head／Distal，而是先看腫瘤深度</u></b>——指引圖示先以下列二者分流：',
        '<b>①</b> <b>影像上為<u>外突型或周邊型腫瘤</u></b>（Exophytic or peripheral tumors by imaging，' +
        '<b>註 q：不鄰近主胰管</b>）→ <b>腫瘤摘除（Tumor enucleation）</b>（NE-F）——<b>此路徑不分 Head／Distal</b>。',
        '<b>②</b> <b><u>較深或侵犯性之腫瘤</u>，以及<u>鄰近主胰管</u>者</b> → 再依位置：' +
        '<b>胰頭</b> → <b>胰十二指腸切除術</b>（NE-F，註 h）；' +
        '<b>胰體／尾</b> → <b>遠端胰切除術（<u>保脾</u>）</b>，<b>考慮微創切除</b>（NE-F）。',
        '<b>註 r</b>：<b>腫瘤較大且侵犯脾臟血管者，應執行<u>脾切除</u></b>' +
        '（Splenectomy should be performed for larger tumors involving splenic vessels）。',
        surgPrepNote()
      ];
      note = 'PanNET-6：Resectable → Exophytic or peripheral tumors by imaging<sup>q</sup> → Tumor enucleation (NE-F)；' +
        'Deeper or invasive tumors and those in proximity to the main pancreatic duct → Head → Pancreatoduodenectomy<sup>h</sup> ' +
        '(NE-F)／Distal → Distal pancreatectomy<sup>h</sup> (spleen-preserving)<sup>r</sup>, consider minimally invasive ' +
        'resection (NE-F) → PanNET-11。';
    } else if (s.func === 'glu') {
      symCtl = '<b>症狀控制（PanNET-8）</b>：<b>①</b> <span class="drug">Octreotide LAR</span> 或 ' +
        '<span class="drug">Lanreotide</span>；<b>②</b> <b>適當治療高血糖與糖尿病</b>' +
        '（Treat hyperglycemia and diabetes, as appropriate）。<br>' +
        '<b>⚠ 註 t</b>：<b>升糖素瘤已知有<u>高凝血狀態（hypercoagulable state）</u></b>——' +
        '<b>可考慮圍手術期抗凝治療</b>（Perioperative anticoagulation can be considered）。';
      if (s.loc === 'duo' || s.loc === 'occult') {
        result('rec-idle', '升糖素瘤 · <b>此位置分支不適用</b>',
          ['<b>本院指引之升糖素瘤流程（PanNET-8）僅有「Head」與「Distal」兩個位置出口</b>' +
            '（<b>指引註明升糖素瘤通常位於胰尾</b>）。',
            '請於<b>步驟 4</b> 改選「胰頭 Head」或「胰體／尾 Distal」。'],
          'PanNET-8：Locoregional disease (glucagonoma)(NE-L) → Resectable → Head<sup>s</sup>／Distal<sup>s</sup>。',
          null, evalBox);
        return;
      }
      title = '升糖素瘤 · 可切除 · <b>' + (s.loc === 'head' ? '胰頭' : '胰體／尾') + '</b> → 切除 ＋ <b>胰周淋巴結廓清</b>（PanNET-8）';
      lines = [
        (s.loc === 'head'
          ? '<b>胰十二指腸切除術 ＋ <u>胰周淋巴結廓清</u></b>（Pancreatoduodenectomy + peripancreatic lymphadenectomy，NE-F，註 h、t）。'
          : '<b>遠端胰切除術 ＋ <u>胰周淋巴結廓清</u> ＋ <u>脾切除</u></b>（Distal pancreatectomy + peripancreatic ' +
          'lymphadenectomy + splenectomy，NE-F，註 h、t）。'),
        '<b>⚠ 註 s（小型周邊腫瘤之例外）</b>：<b>小（&lt;2 cm）之周邊型升糖素瘤<u>罕見</u></b>；' +
        '<b>可考慮<u>摘除／局部切除 ＋ 胰周淋巴結廓清</u></b>（enucleation/local excision + peripancreatic lymph dissection may be considered）。',
        '<b>⚠ 註 t：高凝血狀態</b>——<b>可考慮圍手術期抗凝治療</b>。',
        surgPrepNote()
      ];
      note = 'PanNET-8：Resectable → ' + (s.loc === 'head'
        ? 'Head<sup>s</sup> → Pancreatoduodenectomy + peripancreatic lymphadenectomy<sup>h,t</sup> (NE-F)'
        : 'Distal<sup>s</sup> → Distal pancreatectomy + peripancreatic lymphadenectomy + splenectomy<sup>h,t</sup> (NE-F)') +
        ' → PanNET-11。';
    } else { // vip
      symCtl = '<b>症狀控制（PanNET-10）</b>：<b>①</b> <span class="drug">Octreotide LAR</span> 或 ' +
        '<span class="drug">Lanreotide</span>；<b>②</b> <b>矯正<u>電解質不平衡（K⁺、Mg²⁺、HCO₃⁻）</u>與<u>脫水</u></b>' +
        '（Correct electrolyte imbalance and dehydration）。';
      if (s.loc === 'duo' || s.loc === 'occult') {
        result('rec-idle', 'VIP 瘤 · <b>此位置分支不適用</b>',
          ['<b>本院指引之 VIP 瘤流程（PanNET-10）僅有「Head」與「Distal」兩個位置出口</b>。',
            '請於<b>步驟 4</b> 改選「胰頭 Head」或「胰體／尾 Distal」。'],
          'PanNET-10：Locoregional disease (VIPoma)(NE-L) → Resectable → Head<sup>u</sup>／Distal<sup>u</sup>。',
          null, evalBox);
        return;
      }
      title = 'VIP 瘤 · 可切除 · <b>' + (s.loc === 'head' ? '胰頭' : '胰體／尾') + '</b> → 切除 ＋ <b>胰周淋巴結廓清</b>（PanNET-10）';
      lines = [
        (s.loc === 'head'
          ? '<b>胰十二指腸切除術 ＋ <u>胰周淋巴結廓清</u></b>（Pancreatoduodenectomy + peripancreatic lymphadenectomy，NE-F，註 h）。'
          : '<b>遠端胰切除術 ＋ <u>胰周淋巴結廓清</u> ＋ <u>脾切除</u></b>（Distal pancreatectomy + peripancreatic ' +
          'lymphadenectomy + splenectomy，NE-F，註 h）。'),
        '<b>⚠ 註 u（小型周邊腫瘤之例外）</b>：<b>小（&lt;2 cm）之周邊型 VIP 瘤<u>罕見</u></b>；' +
        '<b>可考慮<u>摘除／局部切除 ＋ 胰周淋巴結廓清</u></b>。',
        '<b>⚠ 術前務必矯正電解質與脫水</b>——VIP 瘤之大量水瀉可致嚴重低血鉀與代謝性酸中毒。',
        surgPrepNote()
      ];
      note = 'PanNET-10：Resectable → ' + (s.loc === 'head'
        ? 'Head<sup>u</sup> → Pancreatoduodenectomy + peripancreatic lymphadenectomy<sup>h</sup> (NE-F)'
        : 'Distal<sup>u</sup> → Distal pancreatectomy + peripancreatic lymphadenectomy ± splenectomy<sup>h</sup> (NE-F)') +
        ' → PanNET-11。';
    }

    lines.push(symCtl);
    lines.push('<b>⚠ PanNET 之<u>輔助性全身治療並無已知角色</u></b>' +
      '（NE-H 2 of 9：There is no known role for systemic treatment in the adjuvant setting for PanNETs）。');
    result('rec-elective', title, lines, note + '｜' + cat2A, 'surv', evalBox);
  }

  /* ---------- 事件 ---------- */
  function pnPick(key, val, btn) {
    pnSel(btn);
    var s = pnSt;
    if (key === 'grade') {
      s.grade = val;
      s.func = s.scope = s.size = s.loc = s.burden = s.w3scope = s.w3bio = s.pdscope = null;
      pnClearSel(['pn_s2', 'pn_s3', 'pn_s4nf', 'pn_s4loc', 'pn_s4adv', 'pn_s2w', 'pn_s3w', 'pn_s2p']);
    } else if (key === 'pdscope') {
      s.pdscope = val;
    } else if (key === 'func') {
      s.func = val;
      s.scope = s.size = s.loc = s.burden = null;
      pnClearSel(['pn_s3', 'pn_s4nf', 'pn_s4loc', 'pn_s4adv']);
    } else if (key === 'scope') {
      s.scope = val;
      s.size = s.loc = s.burden = null;
      pnClearSel(['pn_s4nf', 'pn_s4loc', 'pn_s4adv']);
    } else if (key === 'size') {
      s.size = val;
    } else if (key === 'loc') {
      s.loc = val;
    } else if (key === 'burden') {
      s.burden = val;
    } else if (key === 'w3scope') {
      s.w3scope = val;
      s.w3bio = null;
      pnClearSel(['pn_s3w']);
    } else if (key === 'w3bio') {
      s.w3bio = val;
    }
    pnRender();
  }

  function pnReset() {
    for (var k in pnSt) { if (pnSt.hasOwnProperty(k)) pnSt[k] = null; }
    var root = document.getElementById('pnPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('pn_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    pnRender();
  }

  function initPnetPathway() { pnReset(); }

  // 匯出
  global.pnetPathwayHTML = pnetPathwayHTML;
  global.initPnetPathway = initPnetPathway;
  global.pnPick = pnPick;
  global.pnReset = pnReset;
})(window);
