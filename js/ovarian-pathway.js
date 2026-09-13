/* ============================================================
   卵巢癌／輸卵管癌／原發性腹膜癌治療互動決策流程
   Ovarian / Fallopian Tube / Primary Peritoneal Cancer Pathway
   ------------------------------------------------------------
   2026-09-13 打掉重做（舊版 451 行為舊世代寫法：無收合、無下游歸零表、無藥卡、無基因段）。

   院內來源：台大婦癌診療指引 版次 10（2026/06/16 癌委會修訂通過，共 68 頁）
     · 卵巢癌 OV-1 ～ OV-8 於 p47–54；Less Common Ovarian Cancers LCOC-1 ～ LCOC-14 於 p55–68。
     · 22 張流程圖已全部 render 成 220 dpi PNG 逐張看圖判讀（箭頭走向以看圖為準）。

   ❗❗ 這份院內指引的卵巢癌章節有結構性殘缺，做這一頁時必須知道：
     ① **OV-A／OV-B／OV-C／LCOC-A／LCOC-B 五個頁面被引用 30 次以上，但整份文件裡不存在**
        （p68 就是最後一頁）。後果：**指引告訴你「打白金」，但沒有告訴你打什麼、多少、幾次**；
        說「comprehensive surgical staging」，但沒有列出要做哪些步驟。
        全文件 `AUC` 0 次、`mg/m` 0 次 —— **整份指引沒有任何一個化療劑量**。
     ② **沒有任何 footnote 頁**，但上標 a、e、f、g、i、j、s、v、w… 到處都是，限定條件全部無從查。
     ③ **卵巢癌章節沒有分期版本宣告**（子宮頸章與子宮體章都有寫）—— 章節內 FIGO／AJCC 皆 0 次，
        但每一頁都在用 IA／IB／IC1／IC2／IC3 分流（IC 三分來自 FIGO 2014）。
     ④ **OV-5（p51）整頁是貼上的點陣圖而且被裁切** —— 第三支（HR proficient／unknown）的
        「If bevacizumab used…」之後內容佚失；同一頁還貼了兩組互相矛盾的欄標題上標（v vs w、i vs e,i）。
     ⑤ 紅筆修訂只改了一半：OV-1 把 molecular 改成 biomarker，但 OV-2、OV-3、LCOC-7 沒跟著改，
        且刪除線原文仍看得見（未清稿）。
     ⑥ OV-1 台大自加的黃底「Essential examination：CA-125、PET、pelvis CT/MRI」與同一格左側
        NCCN 欄的「as clinically indicated」直接衝突，而且 PET 根本不在 NCCN 的 workup 清單裡。
   → 本頁的做法：**院內指引寫得出來的照寫並標頁碼；指引缺的那一半一律標明「指引未列」並改用
     院外實證（ESMO CPG 2023、BGCS 2024、GCIG）**，不假裝院內指引是完整的。

   院外來源：
     · **ESMO CPG 2023**（Ledermann JA et al. Ann Oncol 2023;34(10):833-848，PMID 37597580）
     · **BGCS 2024 update**（EJOG 2024;300:69-123，PMID 39002401）
     · ESGO-ESMO-ESP consensus 2024（PMID 38307807）—— ⚠ 全文取不到，只能二手轉述
     · NCCN Ovarian **v4.2026** —— ⚠ 需登入，內容一律未查證，本頁不引
     · GCIG OCCC6（Lancet Oncol 2022;23:e374-e384）

   ❗三個會改變門診動作的時效性問題（查核日 2026-09-13）：
     · **「platinum-sensitive／resistant」這個二分法已經在指引層面被放棄**。ESMO CPG 2023 逐字
       「discontinued in clinical practice following the 2018 ESMO-ESGO Consensus Conference」。
       **但台大 OV-7 仍以「6 個月」分流**，而且 FDA 仿單與部分試驗分層仍在用 —— 兩邊都要寫。
     · **PARP 抑制劑的適應症在 2024 與 2026 兩度縮減**，ESMO CPG 2023 對此的敘述已經過時。
     · **HIPEC 在 ESMO CPG 2023 是 [II, D]（不建議）**，而台大 OV-2 以紅字自加了三處
       「Consider HIPEC」。兩者方向相反，頁面要並列。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   ============================================================ */
(function (global) {
  'use strict';

  var S = {};
  var KEYS = ['scope', 'cand', 'resp', 'stage', 'hrd', 'bev', 'tfi', 'lhisto'];
  KEYS.forEach(function (k) { S[k] = null; });

  /* 學名 → 台大藥卡（2026-09-13 逐碼核對） */
  var OV_DRUGS = [
    { key: 'carboplatin', cards: [['17', 'KEM1CA32', 'Kemocarb 爾定康靜脈注射液 150 mg', 'carboplatin'],
        ['17', 'PAR1CA32', 'Paraplatin 佳鉑帝靜脈注射液', 'carboplatin']] },
    { key: 'paclitaxel', cards: [['17', 'PHY1CC03', 'Paclitaxel 輝克癒蘇注射劑', 'paclitaxel']] },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg', 'cisplatin']],
      flag: 'HIPEC 用 100 mg/m²（OVHIPEC-1）' },
    { key: 'bevacizumab', cards: [['17', 'AV 1CE89', 'Avastin 癌思停注射劑', 'bevacizumab'],
        ['17', 'ALY1CH63', 'Alymsys 艾麥思注射劑（生物相似藥）', 'bevacizumab']],
      flag: '健保 9.37.3 卵巢上皮細胞／輸卵管／原發性腹膜癌' },
    { key: 'olaparib', cards: [['17', 'LYN4CET5', 'Lynparza 令癌莎膜衣錠 150 mg', 'olaparib']],
      flag: '健保限 BRCA 突變；美國後線單藥適應症已撤回' },
    { key: 'niraparib', cards: [['17', 'ZEU4CI05', 'Zejula 截永樂錠 100 mg', 'niraparib']],
      flag: '❗美國一線維持 2026/03 起縮限 HRD 陽性' },
    { key: 'docetaxel', cards: [['17', 'TA 1CC06', 'Taxotere 剋癌易注射劑', 'docetaxel']] },
    { key: 'gemcitabine', cards: [['17', 'GEI1CB14', 'Gemzar 健仕注射液', 'gemcitabine']] },
    { key: 'topotecan', cards: [['17', 'TOO1CE19', 'Hycamtin 癌康定注射劑', 'topotecan']] },
    { key: 'ifosfamide', cards: [['17', 'HOL1CA13', 'Holoxan 好克癌注射劑', 'ifosfamide']] },
    { key: 'letrozole', cards: [['17', 'FEM4CB22', 'Femara 復乳納膜衣錠 2.5 mg', 'letrozole']],
      flag: 'LGSC 與 G1 endometrioid 的維持選項（category 2B）' },
    { key: 'anastrozole', cards: [['17', 'ARI4CB22', 'Arimidex 安美達錠 1 mg', 'anastrozole']] },
    { key: 'megestrol', cards: [['17', 'MEE5LF15', 'Megace 麥格斯口服懸液劑', 'megestrol acetate']] },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg', 'pembrolizumab']],
      flag: '❗卵巢癌的免疫治療試驗幾乎全部陰性' }
  ];

  /* ---------- 版面小工具 ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ovPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="ov-node hidden" id="' + id + '"><div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head"><span class="flow-num">' + num +
      '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts, extra) {
    return '<div class="ov-node" id="' + id + '"><div class="flow-step">' +
      '<div class="flow-step-head"><span class="flow-num">' + num + '</span>' +
      '<span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div>' + (extra || '') + '</div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }
  function H(t, s) { return '<span class="rx-h">' + t + '</span>' + (s ? '　<span class="rx-sub">' + s + '</span>' : ''); }
  function EV(t) { return '@ev ' + t; }
  function SUB(a) { return '<ul class="rec-sub"><li>' + a.join('</li><li>') + '</li></ul>'; }
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }
  function fold(s, inner) { return '<details class="kps-details"><summary>' + s + ' ▸</summary>' + inner + '</details>'; }

  /* ==========================================================
     共用參考區塊
     ========================================================== */

  /* 院內指引的殘缺清單 —— 這一格每條路徑都會用到 */
  function gapReference() {
    return fold('<b>❗院內指引卵巢癌章節的殘缺清單</b>（做決策前一定要知道）',
      '<table>' +
      '<tr><td colspan="2"><b>台大婦癌診療指引 版次 10 的卵巢癌章節（p47–68）共 22 張流程圖，' +
      '但支撐這些流程的說明頁全部不在文件裡。</b>以下為逐頁 grep 驗證的結果。</td></tr>' +
      '<tr><td>❗<b>五個缺頁</b></td>' +
      '<td><b>OV-A、OV-B、OV-C、LCOC-A、LCOC-B 被引用 30 次以上，但整份文件裡不存在</b>' +
      '（p68 就是最後一頁）。<br>' +
      '<b>後果</b>：<b>指引告訴你「打白金」，但不告訴你打什麼、多少、幾次</b>；' +
      '說「comprehensive surgical staging」，但不列出要做哪些步驟；' +
      '<b>全文件 AUC 0 次、mg/m 0 次 —— 整份指引沒有任何一個化療劑量。</b></td></tr>' +
      '<tr><td>❗<b>沒有註腳頁</b></td>' +
      '<td>上標 a、e、f、g、i、j、s、v、w 等到處都是（例：OV-8「Consider secondary ' +
      'cytoreductive surgery^i,j」、LCOC-5「Observe^g」），<b>但文件裡沒有任何一頁註腳</b>，' +
      '<b>所有限定條件都無從查</b>。</td></tr>' +
      '<tr><td>❗<b>沒有分期版本宣告</b></td>' +
      '<td>子宮頸癌章（p3）寫「All staging in guidelines is based on updated 2018 FIGO staging」、' +
      '子宮體章（p19）也有；<b>卵巢癌章節 grep FIGO／AJCC 皆 0 次</b>，' +
      '但每一頁都在用 IA／IB／IC1／IC2／IC3 分流。<b>IC 三分來自 FIGO 2014，但用哪一版無從確認。</b></td></tr>' +
      '<tr><td>❗<b>OV-5 整頁是<br>被裁切的貼圖</b></td>' +
      '<td>p51 是 5 個貼上的點陣圖，<b>PDF 文字層只有「OV-5」三個字，不可搜尋、不可複製</b>。<br>' +
      '<b>原圖被裁切</b>：第三支（HR proficient／HR unknown）的「If bevacizumab used during primary ' +
      'chemotherapy：Bevacizumab」之後<b>內容整段佚失</b>；右側出口也被裁成半字。<br>' +
      '同一頁還貼了<b>兩組不同上標的欄標題</b>（v vs w、i vs e,i），互相矛盾。</td></tr>' +
      '<tr><td>❗<b>紅筆只改一半</b></td>' +
      '<td>OV-1 把「genetic risk evaluation and germline and somatic testing」改成' +
      '「…somatic <b>biomarker</b> testing」，<b>但 OV-2、OV-3 仍是舊寫法</b>；' +
      'OV-6 把 molecular 改成 biomarker 三處，<b>但 LCOC-7 沒跟著改</b>。' +
      '<b>刪除線原文仍看得見（未清稿）。</b></td></tr>' +
      '<tr><td>❗<b>院內自加與<br>原文打架</b></td>' +
      '<td>OV-1 台大自加的黃底「<b>Essential examination：CA-125、PET、pelvis CT/MRI</b>」，' +
      '與<b>同一格左側</b>的原文「Ultrasound and/or abdomen/pelvis CT/MRI <b>as clinically ' +
      'indicated</b>」「Chest CT or chest x-ray <b>as clinically indicated</b>」直接衝突；' +
      '<b>而且 PET 根本不在原文的 workup 清單裡</b>。<br>' +
      'HIPEC 三處紅字也不一致：一支寫「Consider HIPEC<b>/cisplatin</b>」，另兩支只寫「Consider HIPEC」。</td></tr>' +
      '<tr><td><b>流程斷頭</b></td>' +
      '<td><b>LCOC-4 的「黏液性 borderline → Observe」畫到 Observe 就結束</b>，沒有接到追蹤頁' +
      '（而漿液性 borderline 有 LCOC-8～10 三頁完整路徑）。<br>' +
      '<b>LCOC-11 的 Stage I 性索間質瘤沒有復發出口</b>（只有 Stage II–IV 那支接得到）。<br>' +
      '<b>LCOC-14 的「Incomplete clinical response → LCOC-A」指向不存在的頁</b> —— ' +
      '生殖細胞瘤二線失敗後流程無出口。<br>' +
      '<b>OV-1 沒有 Stage IC 想保留生育功能的路徑</b>，只有 IA、IB 有。</td></tr>' +
      '<tr><td><b>本頁的做法</b></td>' +
      '<td><b>指引寫得出來的照寫並標頁碼；指引缺的那一半一律標明「指引未列」，' +
      '並改用標明出處的院外實證（ESMO CPG 2023、BGCS 2024、GCIG）。</b><br>' +
      '<b>不假裝院內指引是完整的，也不用記憶去補它沒寫的東西。</b></td></tr>' +
      '</table>');
  }

  /* platinum-sensitive / resistant 的存廢 */
  function tfiReference() {
    return fold('<b>❗「platinum-sensitive／resistant」這個分法已經被指引放棄了</b>',
      '<table>' +
      '<tr><td><b>ESMO CPG 2023<br>逐字</b></td>' +
      '<td>這個二分法已經<b>「discontinued in clinical practice following the <u>2018 ESMO-ESGO ' +
      'Consensus Conference</u>」</b>。<br>' +
      '改用 <b>TFIp（treatment-free interval from platinum，距上次白金治療的無治療間隔）</b>，' +
      '再加上「platinum <b>is</b> the best option when…／<b>is not</b> the best option when…」的判準，' +
      '<b>而不是用一個月數把病人切成兩類。</b></td></tr>' +
      '<tr><td><b>GCIG OCCC6</b></td>' +
      '<td>Lancet Oncol 2022;23:e374-e384 Statement 7 逐字：' +
      '<b>「Eligibility based <u>only</u> on the interval from last platinum treatment is ' +
      '<u>discouraged</u>」</b>。</td></tr>' +
      '<tr><td>❗<b>但台大指引<br>還在用</b></td>' +
      '<td><b>OV-7（p53）仍以「6 個月」二分</b>：<br>' +
      '<b>Platinum-resistant</b>：「Progression on primary, maintenance or recurrence therapy <b>or</b> ' +
      'Stable or persistent disease (if not on maintenance therapy) <b>or</b> Complete remission and ' +
      'relapse <b>&lt; 6 mo</b> after completing chemotherapy」<br>' +
      '<b>Platinum-sensitive</b>：「Complete remission and relapse <b>≥ 6 mo</b> after completing ' +
      'prior chemotherapy」<br>' +
      '❗<b>而且沒有 partially platinum-sensitive（6–12 個月）這一層，也沒有 platinum-refractory 的定義。</b></td></tr>' +
      '<tr><td>❗<b>而且仿單還在用</b></td>' +
      '<td><b>FDA 的仿單（Elahere、Avastin）與部分試驗的分層仍然用這個詞</b> —— ' +
      '<b>所以開藥、申請給付時還是得用它。</b><br>' +
      '<b>結論：討論治療策略時用 TFIp 與那三條判準；填申請單時用舊的二分法。' +
      '兩套並存，不要以為只有一套。</b></td></tr>' +
      '</table>');
  }

  /* PARP 抑制劑的適應症變動 */
  function parpReference() {
    return fold('<b>❗PARP 抑制劑的適應症在 2024 與 2026 兩度縮減</b>（指引的敘述已經追不上）',
      '<table>' +
      '<tr><td colspan="2">❗<b>照舊版指引或舊簡報寫 PARP 會寫錯。以下為查核日 2026-09-13 的現況。</b></td></tr>' +
      '<tr><td><b>2024-03-26<br>後線單藥<br>三個一起撤</b></td>' +
      '<td>美國 FDA 已正式撤銷<b>三個</b>藥用於晚期卵巢癌的「<b>後線單藥治療</b>」適應症' +
      '（Federal Register 89 FR 20982）：<br>' +
      '<b>rucaparib</b>（≥ 2 線化療後 BRCA 突變）、<b>olaparib</b>（≥ 3 線後 germline BRCA 突變）、' +
      '<b>niraparib</b>（≥ 3 線後 HRD 陽性）。<b>三者生效日同為 2024-03-26</b>，' +
      '藥廠早在 2022 年 6–9 月即自願改仿單移除。<br>' +
      '❗<b>常見的錯誤說法是「只撤 rucaparib 與 niraparib」—— olaparib 也在內。</b></td></tr>' +
      '<tr><td><b>撤回的理由<br>是整體存活</b></td>' +
      '<td><b>ARIEL4</b>：rucaparib 組中位整體存活 <b>19.4 對化療 25.4 個月（HR 1.3，95% CI 1.0–1.7，' +
      'p = 0.047）—— 方向是偏害的</b>。<br>' +
      '<b>SOLO3</b>：接受過三線以上化療者 <b>HR 1.33（29.9 對 39.4 個月）</b>。<br>' +
      '❗<b>niraparib 被撤的理由不是它自己的存活數據</b> —— QUADRA 是單臂試驗無法排除存活受損，' +
      'FDA 依前兩項隨機試驗推定為 <b>class-wide effect</b>。</td></tr>' +
      '<tr><td>❗<b>2026-03<br>又縮一次</b></td>' +
      '<td><b>niraparib（Zejula）的「第一線維持」在 2026 年 3 月被縮到 <u>HRD 陽性</u></b>' +
      '（現行仿單生效 2026-07-28，變更註記「Indications and Usage (1.1) 3/2026」）—— ' +
      '<b>不再是 PRIMA 當年的全收。</b><br>' +
      '<b>olaparib 的復發維持已縮成 germline／somatic BRCA 突變</b>；' +
      '<b>rucaparib 在卵巢癌只剩 BRCA 突變的復發維持一項。</b></td></tr>' +
      '<tr><td>❗<b>指引已過時</b></td>' +
      '<td><b>ESMO CPG 2023 那句「FDA 撤回 niraparib 與 rucaparib、但不含 olaparib」現在是錯的</b>；' +
      '<b>2022 年 SGO 那張「any BRCA or HRD status」的表也已過期。</b><br>' +
      '<b>台大 OV-5 列的三個藥（olaparib、niraparib、rucaparib）是「維持治療」不是後線單藥</b>，' +
      '這一點沒有受撤回影響；但各自的適用族群已經和圖上不同。</td></tr>' +
      '<tr><td><b>維持治療仍保留</b></td>' +
      '<td><b>被撤的是「後線單藥治療」，復發後的「維持治療」在美國仍保留，只是被限縮。</b>' +
      '<b>台灣的健保條件見下方健保橫列。</b></td></tr>' +
      '<tr><td>❗<b>台灣連 rucaparib<br>的藥證都沒有</b></td>' +
      '<td><b>' + NR('rucaparib') + ' 在台灣<u>健保與食藥署藥證皆查無</u></b> —— ' +
      '<b>不是「有藥證但沒健保（自費買得到）」，是<u>自費也買不到</u>。</b>' +
      '它也不在台大處方集，本頁不列它的藥卡。<br>' +
      '<b>台大 OV-5 的圖上把它和 olaparib、niraparib 並列成三個選項，' +
      '但在台灣這一格實際上只有兩個藥。</b></td></tr>' +
      '</table>');
  }

  /* BRCA / HRD 檢測 */
  function hrdReference() {
    return fold('<b>BRCA 與 HRD 檢測：什麼時候驗、驗到什麼會改變處置</b>（ESMO CPG 2023）',
      '<table>' +
      '<tr><td><b>什麼時候驗</b></td>' +
      '<td><b>「所有高惡性度（high-grade）卵巢癌在<u>診斷時</u>就要驗 germline and/or somatic ' +
      'BRCA」[I, A]</b>；<b>晚期高惡性度另要驗 HRD [I, A]</b>。<br>' +
      '<b>台大 OV-1 的紅字改寫成「genetic risk evaluation and germline and somatic biomarker ' +
      'testing (if not previously done)」</b>，方向一致。</td></tr>' +
      '<tr><td>❗<b>腫瘤檢測不能<br>取代 germline</b></td>' +
      '<td><b>腫瘤組織檢測抓不到 large genomic rearrangement，也抓不到 BRCA methylation</b> —— ' +
      '<b>所以腫瘤 BRCA 陰性不等於 germline 陰性，兩者不能互相取代。</b></td></tr>' +
      '<tr><td><b>HRD 怎麼定義</b></td>' +
      '<td>FDA 的定義是 <b>BRCA 突變<u>與／或</u>基因體不穩定性（genomic instability）</b>。<br>' +
      '❗<b>EMA 不綁特定檢測，FDA 綁 companion diagnostic</b> —— 台灣要看藥證與健保怎麼寫。</td></tr>' +
      '<tr><td>❗<b>HRD 陰性不能<br>當作禁用理由</b></td>' +
      '<td><b>ESMO 2020 生物標記指引逐字：現行檢測「lack negative predictive value」</b> —— ' +
      '<b>HRD 陰性只代表「沒驗到」，不代表「不會有效」。</b></td></tr>' +
      '<tr><td>❗<b>檢體品質門檻</b></td>' +
      '<td><b>腫瘤細胞含量 &lt; 30% 的檢體不應發 HRD 報告</b> —— ' +
      '<b>一致性會掉到 60%</b>（PMID 39312094）。各平台之間一致性約 <b>85–95%</b>。</td></tr>' +
      '</table>');
  }

  /* 健保 */
  function nhiReference() {
    return fold('<b>健保與藥證</b>（查詢日 2026-09-13）',
      '<table>' +
      '<tr><td><b>bevacizumab</b><br>9.37.3</td>' +
      '<td>條文涵蓋<b>「卵巢上皮細胞、輸卵管或原發性腹膜癌」</b>，與 carboplatin／paclitaxel 併用。<br>' +
      '❗<b>注意這一條寫的「原發性腹膜癌」是婦科的原發性腹膜癌</b> —— ' +
      '<b>不可拿來套闌尾來源的腹膜假黏液瘤或其他腹膜轉移。</b></td></tr>' +
      '<tr><td><b>PARP 抑制劑</b></td>' +
      '<td><b>olaparib 與 niraparib 台大處方集都有</b>；<b>' + NR('rucaparib') + ' 沒有</b>。' +
      '<b>健保條件與美國仿單不同，申請前要看現行條文。</b></td></tr>' +
      '<tr><td><b>化療骨幹</b></td>' +
      '<td><b>carboplatin ＋ paclitaxel</b> 為主，兩者都是常備品項。' +
      '❗<b>台大指引本身沒有列任何劑量</b>（見缺頁那一格），<b>劑量要查院內處方或院外指引。</b></td></tr>' +
      '<tr><td>❗<b>HIPEC</b></td>' +
      '<td><b>健保沒有 HIPEC 的給付項目</b>（《醫療服務給付項目及支付標準》逐筆檢索查無，' +
      '「減積」二字只出現在 80418B 婦癌減積手術一項）。<b>實務上是自費。</b><br>' +
      '<b>婦癌減積手術 80418B（BSO ＋ omentectomy ＋ ATH ＋ retroperitoneal lymphadenectomy ' +
      '＋ radical dissection for debulking）50,588 點</b>是有給付的，' +
      '<b>但那是手術本身，不含熱灌注。</b></td></tr>' +
      '</table>');
  }

  /* ==========================================================
     版面
     ========================================================== */
  function ovarianPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><b>卵巢癌、輸卵管癌與原發性腹膜癌用同一套流程</b>' +
      '（院內指引各頁標題也一律三者並列）。<br>' +
      '院內來源：<b>台大婦癌診療指引 版次 10</b>（2026/06/16 癌委會修訂通過）' +
      '<b>OV-1 ～ OV-8（p47–54）與 LCOC-1 ～ LCOC-14（p55–68）</b>，' +
      '22 張流程圖已全部 render 成 PNG 逐張看圖判讀。<br>' +
      '❗<b>但這份院內指引的卵巢癌章節有結構性殘缺</b>：' +
      '<b>OV-A／OV-B／OV-C／LCOC-A／LCOC-B 五個頁面被引用 30 次以上卻不存在</b>，' +
      '<b>整份文件沒有任何一個化療劑量</b>（AUC 與 mg/m² 各 0 次），' +
      '<b>也沒有任何一頁註腳</b>（但上標到處都是）。' +
      '<b>所以「打白金」這件事指引說了，「打什麼、多少、幾次」它沒說。</b>' +
      '本頁的做法是<b>指引寫得出來的照寫並標頁碼，缺的那一半標明「指引未列」並改用院外實證</b>' +
      '（ESMO CPG 2023、BGCS 2024、GCIG），詳見下方可展開的殘缺清單。<br>' +
      '❗<b>三個會改變門診動作的時效性問題</b>：' +
      '<b>「platinum-sensitive／resistant」已被指引層面放棄</b>（但台大 OV-7 與 FDA 仿單還在用）；' +
      '<b>PARP 抑制劑的適應症在 2024 與 2026 兩度縮減</b>；' +
      '<b>HIPEC 在 ESMO 是 [II, D] 不建議，而台大 OV-2 以紅字自加了三處「Consider HIPEC」</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b></p>';
    h += '<div class="onc-path" id="ovPath">';

    h += node0('ov_n1', '1', '現在要決定的是哪一段？',
      opt('scope', 'init', '初次處置 —— 先開刀還是先化療', '台大 OV-1／OV-2') +
      opt('scope', 'adj', '手術後 —— 要決定輔助化療', '台大 OV-4') +
      opt('scope', 'maint', '化療結束 —— 要決定維持治療', '台大 OV-5（❗該頁是被裁切的貼圖）') +
      opt('scope', 'rec', '復發', '台大 OV-7／OV-8') +
      opt('scope', 'lcoc', '少見型態 Less Common Ovarian Cancers', '台大 LCOC-1～14；處置與主線不同'),
      gapReference());

    h += node('ov_n_cand', '2', '婦癌專科醫師評估後，屬於哪一種？',
      opt('cand', 'pds', '可以手術，而且預期能達到 optimal cytoreduction', '→ 直接開刀（PDS）') +
      opt('cand', 'nact', '手術條件差，或預期達不到 optimal cytoreduction', '→ 先化療（NACT）再中間減積'));
    h += recBox('ov_r_init', '建議處置 · 先開刀還是先化療');
    h += node('ov_n_resp', '3', '新輔助化療後的反應？',
      opt('resp', 'response', '有反應 Response', '') +
      opt('resp', 'stable', '疾病穩定 Stable disease', '') +
      opt('resp', 'prog', '疾病進展 Progression', ''));
    h += recBox('ov_r_nact', '建議處置 · 中間減積手術要不要做');
    h += fuBox('ov_f_init');

    h += node('ov_n_stage', '2', '手術分期的結果？（台大 OV-4，p50）',
      opt('stage', 'ia_ib_g1', 'Stage IA／IB，grade 1', '') +
      opt('stage', 'ia_ib_g2', 'Stage IA／IB，grade 2 endometrioid', '') +
      opt('stage', 'ia_ib_g3', 'Stage IA／IB，grade 3 endometrioid 或 high-grade serous', '') +
      opt('stage', 'ic', 'Stage IC', '') +
      opt('stage', 'ii_iv', 'Stage II、III、IV', ''));
    h += recBox('ov_r_adj', '建議處置 · 輔助化療');
    h += fuBox('ov_f_adj');

    h += node('ov_n_hrd', '2', 'BRCA 與 HRD 的狀態？（台大 OV-5 的第一個分岔）',
      opt('hrd', 'brca', 'germline 或 somatic BRCA1／2 致病性變異', '') +
      opt('hrd', 'hrd', 'BRCA 野生型或未知，<b>但</b> HR deficient', '') +
      opt('hrd', 'hrp', 'BRCA 野生型或未知，且 HR proficient 或 HR 未知', '❗這一支的原圖被裁切'),
      hrdReference());
    h += node('ov_n_bev', '3', '第一線化療期間有沒有用過 bevacizumab？',
      opt('bev', 'notused', '沒有用過', '') +
      opt('bev', 'used', '有用過', ''));
    h += recBox('ov_r_maint', '建議處置 · 維持治療');
    h += fuBox('ov_f_maint');

    h += node('ov_n_tfi', '2', '復發的型態？（台大 OV-7 仍用 6 個月二分）',
      opt('tfi', 'resistant', '進展中、穩定或持續存在，或完全緩解後 &lt; 6 個月復發', 'OV-7 稱 platinum-resistant') +
      opt('tfi', 'sensitive', '完全緩解後 ≥ 6 個月復發', 'OV-7 稱 platinum-sensitive → OV-8'),
      tfiReference());
    h += recBox('ov_r_rec', '建議處置 · 復發');
    h += fuBox('ov_f_rec');

    h += node('ov_n_lhisto', '2', '是哪一種少見型態？（台大 LCOC，共八型）',
      opt('lhisto', 'carcinosarc', 'Carcinosarcoma 癌肉瘤', 'LCOC-2 ❗版面是「先治療、後分期」') +
      opt('lhisto', 'clearcell', 'Clear cell 亮細胞癌', 'LCOC-3') +
      opt('lhisto', 'mucinous', 'Mucinous 黏液性癌', 'LCOC-4') +
      opt('lhisto', 'g1endo', 'Grade 1 endometrioid', 'LCOC-5') +
      opt('lhisto', 'lgsc', 'Low-grade serous 低惡性度漿液性癌', 'LCOC-6／7') +
      opt('lhisto', 'borderline', 'Serous borderline（低惡性潛能 LMP）', 'LCOC-8～10') +
      opt('lhisto', 'sexcord', 'Sex cord-stromal 性索間質瘤', 'LCOC-11') +
      opt('lhisto', 'germcell', 'Germ cell 生殖細胞瘤', 'LCOC-12～14'));
    h += recBox('ov_r_lcoc', '建議處置 · 少見型態');
    h += fuBox('ov_f_lcoc');

    h += '<div class="flow-reset"><button class="back-btn" onclick="ovReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="ov_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="ov_drugs"></div>';
    return h;
  }

  /* ---------- 顯示控制 ---------- */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function collapseAll() {
    var root = el('ovPath');
    if (!root) return;
    root.querySelectorAll('.ov-node').forEach(function (n) { if (n.id !== 'ov_n1') n.classList.add('hidden'); });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
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
    e.innerHTML = '<div class="rec-label">' + labelTxt + '</div><div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') + (src ? '<div class="rec-note">' + src + '</div>' : '');
  }
  function fu(id, html) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = '<div class="fu-h">接下來怎麼追蹤</div><ul class="fu-list">' + html + '</ul>';
  }

  var SRC_NTUH = '台大婦癌診療指引 版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過）';
  var FU_OV6 = '<li><b>台大 OV-6（p52）逐字</b>：<b>「Visits every 2–4 mo for 2 y, then 3–6 mo for 3 y, ' +
    'then annually after 5 y」</b>。</li>' +
    '<li><b>理學檢查含骨盆內診（as clinically indicated）；胸腹骨盆 CT／MRI／PET-CT 依臨床需要；' +
    'CBC 與生化依需要。</b></li>' +
    '<li><b>CA-125 或其他腫瘤標記 —— 只在「initially elevated」時追</b>。' +
    '❗<b>絕對數值門檻與倍增判準（GCIG 定義）指引未列。</b></li>' +
    '<li><b>若尚未做過，要轉介遺傳風險評估。</b></li>' +
    '<li>❗<b>OV-6 的三個出口</b>：<b>CA-125 上升且未曾化療 → 回 OV-1</b>；' +
    '<b>臨床復發且曾化療 → OV-7</b>；<b>CA-125 連續上升且曾化療 → 可延後治療或立即治療' +
    '（category 2B）→ OV-7</b>。</li>';

  /* ==========================================================
     各分支
     ========================================================== */
  function renderInit() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗這個分岔怎麼判，指引只給了兩個機制', 'OV-1，p47'));
    L.push('<b>「Evaluation by <u>gynecologic oncologist</u>」與「Histologic confirmation ' +
      '(biopsy preferred) and/or <u>Laparoscopic evaluation to determine feasibility of resection</u>」</b>');
    L.push('❗<b>指引沒有給任何客觀門檻</b> —— <b>沒有 Fagotti score、沒有 PCI、' +
      '沒有影像判準、沒有 CA-125 門檻</b>。<b>判斷完全依賴婦癌專科醫師的評估與腹腔鏡所見。</b>');
    if (S.cand === 'pds') {
      title = '可以手術且預期達到 optimal cytoreduction<br>→ 直接做減積手術（PDS）';
      L.push(H('主建議', 'OV-1 逐字'));
      L.push('<b>「IA–IV, surgical candidate, optimal cytoreduction likely (fertility not desired)」' +
        '→「<u>Hysterectomy/BSO + comprehensive staging and debulking as needed</u>」</b>');
      L.push('❗<b>「comprehensive surgical staging」到底要做哪些步驟，指引沒有展開</b> —— ' +
        '全章節只有 comprehensive surgical staging／complete staging／completion staging surgery ' +
        '這些詞，<b>探查、腹腔沖洗液、大網膜切除、腹膜切片、淋巴結摘除六項一次都沒出現</b>' +
        '（章節內 omentectomy 0 次、washing 0 次、lymphadenectomy 0 次）。' +
        '<b>步驟內容要查院外指引。</b>');
      L.push('❗<b>殘餘腫瘤的公分數指引也沒有給</b> —— <b>章節內 0 個公分數字、沒有 R0、' +
        '沒有 suboptimal 一詞</b>。residual 的 19 次全是定性描述' +
        '（「Suspect resectable / unresectable residual disease」之類）。');
      L.push(H('想保留生育功能的話', 'OV-1'));
      L.push('<b>「IA (fertility desired) → <u>USO</u> + comprehensive surgical staging」</b>；' +
        '<b>「IB (fertility desired) → <u>BSO</u> + comprehensive surgical staging」</b>');
      L.push('❗<b>只到 Stage IA 與 IB</b>。<b>Stage IC 想保留生育功能的病人在這張圖上沒有路徑</b> —— ' +
        '只能落進「IA–IV…（fertility <b>not</b> desired）」那一格。' +
        '<b>年齡上限、組織型限制、完成生育後要不要補做手術，指引都未列。</b>');
      L.push('❗<b>台大自加的黃底「Essential examination：CA-125、PET、pelvis CT/MRI」' +
        '與同一格左側的原文衝突</b> —— 原文寫的是' +
        '<b>「Ultrasound and/or abdomen/pelvis CT/MRI <u>as clinically indicated</u>」</b>，' +
        '<b>而且 PET 根本不在原文的 workup 清單裡</b>。<b>同一格內同時說「臨床需要時才做」與「必做」。</b>');
      L.push(EV('<b>院外實證：手術時機的四個試驗</b>。<b>EORTC 55971</b>（PMID 20818904，' +
        '❗<b>它的信賴區間是 90% 不是 95%</b>，而且 NEJM 摘要<u>沒有</u>中位整體存活，' +
        '常被引的「29 對 30 個月」只見於二手來源）與 <b>CHORUS</b>（PMID 26002111）支持 NACT 非劣。' +
        '<b>SCORPION 有兩篇</b>（周術期 n=110，PMID 26998845；存活 n=171，PMID 33028623），' +
        '<b>R0 率分別是 45.5%/57.7% 與 47.6%/77.0%，不要混引。</b>' +
        '❗<b>TRUST 至今沒有正式論文</b>，數字全部來自評論轉述' +
        '（PDS 的完全切除率 70%、PFS 22.1 對 19.7 個月 HR 0.80、' +
        '<b>整體存活 54.3 對 48.3 個月 HR 0.89（0.74–1.08）未達顯著</b>）；' +
        '<b>網路上流傳的「19.4% 對 51.2% 完全切除率」與原文矛盾，已驗證不可信。</b>'));
    } else {
      cls = 'rec-nonop';
      title = '手術條件差，或預期達不到 optimal cytoreduction<br>→ 先做新輔助化療（OV-2）';
      L.push(H('主建議', 'OV-1 逐字'));
      L.push('<b>「Poor surgical candidate <u>or</u> Low likelihood of optimal cytoreduction」' +
        '→「Neoadjuvant Therapy (OV-2)」</b>');
      L.push('<b>開始之前要有組織學確認</b>（切片為佳），<b>並／或用腹腔鏡評估可切除性</b>。');
      L.push('❗<b>化療處方與劑量指引未列</b> —— 導向的是不存在的 OV-C。' +
        '<b>骨幹為 <span class="rx">carboplatin</span> ＋ <span class="rx">paclitaxel</span>，' +
        '但劑量與週期要查院外來源或院內處方。</b>');
      L.push('<b>接下來依化療反應決定中間減積手術</b> —— 見步驟 3。');
    }
    fill('ov_r_init', cls, title, L, SRC_NTUH + ' OV-1（p47）。' +
      '❗<b>「comprehensive staging」的步驟、殘餘腫瘤的定義、化療處方與劑量，' +
      '院內指引全部未列（導向不存在的 OV-A／OV-C）</b>，須查院外來源。' +
      '院外實證：ESMO CPG 2023（PMID 37597580）、BGCS 2024（PMID 39002401）。',
      gapReference() + nhiReference());
  }

  function renderNact() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.resp === 'prog') {
      cls = 'rec-urgent';
      title = '新輔助化療期間進展<br>→ 不做中間減積；改走復發／進展的路';
      L.push(H('這一格的意義', 'OV-2'));
      L.push('<b>在新輔助化療下進展，代表白金為基礎的治療沒有控制住疾病。</b>' +
        '<b>這在 OV-7 的定義裡就直接落入「platinum-resistant」那一類</b>' +
        '（「Progression on primary… therapy」）。');
      L.push('<b>請回步驟 1 選「復發」，並在步驟 2 選第一項。</b>');
      L.push('❗<b>但要注意 OV-7 的這個分類方式在指引層面已經被放棄</b> —— ' +
        '見下方可展開的橫列。<b>實務上要看的是「白金還是不是最好的選項」，不是只看月數。</b>');
    } else {
      var r = S.resp === 'response' ? '有反應' : '疾病穩定';
      title = '新輔助化療後 · ' + r + '<br>→ 做中間減積手術（IDS），並接回輔助化療';
      L.push(H('主建議', 'OV-2，p48'));
      L.push('<b>接中間減積手術（interval debulking surgery），之後回到 adjuvant therapy。</b>');
      L.push('❗<b>OV-2 全章唯一的療程數字</b>：<b>「Continue current therapy ' +
        '(for a total of <u>at least 6 cycles</u>)」</b>。' +
        '<b>整份指引的化療數字就只有這一個。</b>');
      L.push(H('❗HIPEC：台大自加，但和 ESMO 的方向相反', ''));
      L.push('<b>台大在 OV-2 用紅字自加了三處 HIPEC，全部在這一條 NACT → IDS 的路上</b>：' +
        '<b>有反應那支寫「Consider HIPEC<u>/cisplatin</u>」（唯一指名藥物者），' +
        '疾病穩定那支的兩處只寫「Consider HIPEC」。</b>' +
        '❗<b>同一頁、同一個手術情境，指定藥物與否不一致。</b>' +
        '<b>溫度、時間、劑量、適應期別指引都沒有寫。</b>');
      L.push('❗<b>PDS 那條路（OV-1 → OV-4）完全沒有提到 HIPEC</b> —— ' +
        '<b>這一點和證據是一致的</b>（見下一條）。');
      L.push(EV('<b>OVHIPEC-1</b>（van Driel，NEJM 2018，PMID 29342393）的適用範圍比多數人記得的窄得多：' +
        '<b>只收 FIGO stage III（不含 IV）</b>；<b>只在「至少三個療程（at least three cycles）」' +
        '新輔助 carboplatin ＋ paclitaxel 未進展者</b>；' +
        '<b>隨機化是在手術台上、以「預期可達殘餘 ≤ 10 mm」為前提</b>；' +
        '<b>HIPEC 用 cisplatin 100 mg/m²</b>。10 年最終分析存活益處仍成立。<br>' +
        '❗<b>但 ESMO CPG 2023 給 HIPEC 的是 [II, <u>D</u>]（不建議），' +
        '腹腔內化療（i.p. chemotherapy）更是 [I, <u>E</u>]</b>，' +
        '並明文說 OVHIPEC 的結果「很難外推」。' +
        '<b>韓國的隨機試驗（PMID 35262624）整體是陰性的，只有 interval 次族群有益。</b>' +
        '<b>ESGO-ESMO-ESP 共識對此「無法達成共識」。</b>' +
        '<b>所以這一格要和病人講清楚：台大圖上有、國際指引不建議，而且台灣健保不給付。</b>'));
      L.push('❗<b>OV-2 的箭頭有一處看圖才知道</b>：' +
        '<b>疾病穩定那一條的第二個 IDS 格，是用折線<u>向上</u>匯進 adjuvant therapy</b>，' +
        '不是直線往右。<b>只讀文字層會接錯。</b>');
    }
    fill('ov_r_nact', cls, title, L, SRC_NTUH + ' OV-2（p48，已 render PNG 逐格核對箭頭）。' +
      'HIPEC 的院外對照：OVHIPEC-1（PMID 29342393）、韓國 RCT（PMID 35262624）、' +
      'ESMO CPG 2023 [II, D]（PMID 37597580）。<b>健保沒有 HIPEC 給付項目。</b>',
      gapReference() + tfiReference() + nhiReference());
    fu('ov_f_init', FU_OV6);
  }

  function renderAdj() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.stage === 'ia_ib_g1') {
      cls = 'rec-nonop';
      title = 'Stage IA／IB，grade 1<br>→ 觀察';
      L.push(H('主建議', 'OV-4，p50'));
      L.push('<b>Stage IA 與 IB 的 grade 1 在 OV-4 走「Observe」。</b>');
      L.push('❗<b>這是唯一完全不給化療的一格</b>，其餘各格都要打白金。');
    } else if (S.stage === 'ia_ib_g2') {
      title = 'Stage IA／IB，grade 2 endometrioid<br>→ 觀察或打白金，兩者都可以';
      L.push(H('主建議', 'OV-4 逐字'));
      L.push('<b>「Observe <u>or</u> Intravenous (IV) platinum-based therapy ' +
        '[see primary regimens for stage I disease (OV-C, 5 of 12)]」</b>');
      L.push('❗<b>看圖才知道的順序</b>：<b>只有 grade 2 endometrioid 這一格有「Observe or」兩個選項</b>；' +
        '<b>grade 3 endometrioid 與 high-grade serous 會和 Stage IC 合流到「只有 IV platinum」那一格</b>。' +
        '<b>文字層抽出來的順序是相反的。</b>');
      L.push('❗<b>處方導向的 OV-C 第 5 頁不存在</b> —— <b>要打什麼、多少、幾次，指引沒有寫。</b>');
    } else if (S.stage === 'ia_ib_g3' || S.stage === 'ic') {
      var w = S.stage === 'ic' ? 'Stage IC' : 'Stage IA／IB，grade 3 endometrioid 或 high-grade serous';
      title = w + '<br>→ 靜脈白金為基礎的化療（沒有觀察這個選項）';
      L.push(H('主建議', 'OV-4 逐字'));
      L.push('<b>「IV platinum-based therapy [(OV-C, 5 of 12)]」</b>');
      L.push('❗<b>這一格沒有 Observe</b> —— <b>和 grade 2 endometrioid 那一格的差別就在這裡。</b>');
      if (S.stage === 'ic') {
        L.push('❗<b>Stage IC 的三分（IC1 手術中破裂／IC2 術前破裂或表面腫瘤／IC3 腹水或沖洗液陽性）' +
          '來自 FIGO 2014</b>，<b>但院內指引的卵巢癌章節沒有宣告用哪一版分期</b>（FIGO 與 AJCC 各 0 次）。' +
          '<b>子宮頸章與子宮體章都有宣告，只有卵巢癌這一章沒有。</b>');
      }
      L.push('❗<b>處方與劑量指引未列</b>（導向不存在的 OV-C）。' +
        '<b>骨幹為 <span class="rx">carboplatin</span> ＋ <span class="rx">paclitaxel</span>。</b>');
      L.push('<b>Stage I 之後導向 OV-6 追蹤，不經 OV-5 維持治療。</b>');
    } else {
      cls = 'rec-urgent';
      title = 'Stage II、III、IV<br>→ 白金為基礎的化療，之後要決定維持治療';
      L.push(H('主建議', 'OV-4 逐字'));
      L.push('<b>「Platinum-based chemotherapy [see primary regimens for stage II–IV disease ' +
        '(OV-C, 6 of 12)]」</b>');
      L.push('❗<b>OV-C 第 6 頁不存在</b>，<b>處方與劑量指引沒有寫。</b>');
      L.push('❗<b>bevacizumab 的位置是一個斷點</b>：' +
        '<b>OV-4（初始治療頁）從頭到尾沒有提到 bevacizumab</b>，' +
        '<b>但下一頁 OV-5 卻直接以「有沒有在第一線化療用過 bevacizumab」分流。</b>' +
        '<b>「什麼時候該加 bevacizumab」在這份文件裡無從得知。</b>' +
        '（健保端見下方橫列：<b>9.37.3 涵蓋卵巢上皮細胞、輸卵管或原發性腹膜癌</b>。）');
      L.push('<b>化療結束後請回步驟 1 選「化療結束 —— 要決定維持治療」</b>，' +
        '那一格會依 BRCA／HRD 狀態與有沒有用過 bevacizumab 分流。');
    }
    fill('ov_r_adj', cls, title, L, SRC_NTUH + ' OV-4（p50，已 render PNG 核對；' +
      '❗grade 2 與 grade 3／HGS 的順序只有看圖才對得出來）。' +
      '❗<b>處方與劑量導向不存在的 OV-C，指引未列。</b>',
      gapReference() + nhiReference());
    fu('ov_f_adj', FU_OV6);
  }

  function renderMaint() {
    var L = [], cls = 'rec-elective', title = '';
    var used = S.bev === 'used';
    var name = S.hrd === 'brca' ? 'BRCA1／2 致病性變異' :
      (S.hrd === 'hrd' ? 'BRCA 野生型或未知，但 HR deficient' : 'BRCA 野生型或未知，且 HR proficient 或未知');
    title = name + ' · ' + (used ? '第一線用過 bevacizumab' : '第一線沒有用過 bevacizumab') + '<br>';

    L.push(H('❗這一頁本身有品質問題，先知道再看內容', 'OV-5，p51'));
    L.push('<b>整頁是 5 個貼上的點陣圖，PDF 文字層只有「OV-5」三個字，不可搜尋、不可複製。</b>' +
      '<b>同一頁貼了兩組不同上標的欄標題（v vs w、i vs e,i），互相矛盾。</b>');

    if (S.hrd === 'brca') {
      cls = 'rec-elective';
      title += '→ PARP 抑制劑維持治療（category 1）';
      L.push(H('主建議', 'OV-5 逐字'));
      if (used) {
        L.push('<b>「<span class="rx">Olaparib</span> + <span class="rx">Bevacizumab</span> ' +
          '(category 1) <u>or</u> <span class="rx">Niraparib</span> + Bevacizumab (if unable to ' +
          'tolerate Olaparib) <u>or</u> Olaparib <u>or</u> Niraparib <u>or</u> ' + NR('Rucaparib') + '」</b>');
        L.push('❗<b>niraparib ＋ bevacizumab 的條件是「不能耐受 olaparib」</b>，不是並列首選。');
      } else {
        L.push('<b>「<span class="rx">Olaparib</span> (category 1) <u>or</u> ' +
          '<span class="rx">Niraparib</span> (category 1) <u>or</u> ' + NR('Rucaparib') +
          ' <u>or</u> <u>Observe for select stage II disease with CR</u>」</b>');
        L.push('❗<b>「Observe」這個選項只給「選定的 Stage II 且完全緩解」者</b>，' +
          '不是所有 BRCA 突變者都能觀察。');
      }
      L.push('❗<b>' + NR('rucaparib') + ' 不在台大處方集</b>，' +
        '<b>圖上有但院內調不到</b>，本頁不列它的藥卡。');
    } else if (S.hrd === 'hrd') {
      title += '→ 仍有 PARP 抑制劑的角色';
      L.push(H('主建議', 'OV-5 逐字'));
      if (used) {
        L.push('<b>「<span class="rx">Olaparib</span> + <span class="rx">Bevacizumab</span> ' +
          '(category 1) <u>or</u> <span class="rx">Niraparib</span> + Bevacizumab (if unable to ' +
          'tolerate Olaparib) <u>or</u> Bevacizumab <u>or</u> Olaparib」</b>');
        L.push('❗<b>這一支比 BRCA 那一支多了「單用 Bevacizumab」這個選項</b>，' +
          '<b>而且沒有列 ' + NR('rucaparib') + '。</b>');
      } else {
        L.push('<b>「<span class="rx">Olaparib</span> <u>or</u> <span class="rx">Niraparib</span> ' +
          '<u>or</u> ' + NR('Rucaparib') + ' <u>or</u> Observe (if CR)」</b>');
        L.push('❗<b>這一支的 Observe 條件比 BRCA 那一支寬</b> —— ' +
          '<b>只要完全緩解即可，不限 Stage II。</b>');
      }
    } else {
      cls = 'rec-nonop';
      title += '→ ❗這一支的原圖被裁切，內容佚失';
      L.push(H('❗這一格能看到的只有這些', 'OV-5 第三支'));
      if (used) {
        L.push('<b>「If bevacizumab used during primary chemotherapy：<span class="rx">Bevacizumab</span>」</b>' +
          ' —— ❗<b>然後原圖就被裁掉了，之後的內容整段佚失。</b>');
        L.push('❗<b>右側出口「Monitoring/Follow-Up」也被裁成半字</b>；' +
          '頁面中段另有一塊白底遮住「If bevacizumab used during pri<b>mary</b> chemotherapy」的字。');
        L.push('<b>所以這一格在院內指引裡是讀不完整的。</b>' +
          '<b>要完整內容只能查院外指引，或回頭確認原始 NCCN 頁面。</b>');
      } else {
        L.push('<b>「Observe (if CR) <u>or</u> Therapy for Persistent Disease or Recurrence (OV-7)」</b>');
        L.push('<b>沒有用過 bevacizumab、且 HR proficient 或未知者，' +
          '圖上的選項就是觀察（若完全緩解）或直接進入復發治療那一頁。</b>');
        L.push('❗<b>沒有 PARP 抑制劑</b> —— 這一支和上面兩支最大的差別。');
      }
    }
    L.push(H('❗適應症在 2024 與 2026 兩度縮減，圖上的分法已經追不上', ''));
    L.push('<b>美國 2024-03-26 撤銷 ' + NR('rucaparib') + '、' + NR('olaparib') + '、' +
      NR('niraparib') + ' 三者的「後線單藥治療」適應症</b>（Federal Register 89 FR 20982）；' +
      '<b>2026 年 3 月起 ' + NR('niraparib') + ' 的「第一線維持」被縮到 <u>HRD 陽性</u></b>。' +
      '<b>被撤的是後線單藥，維持治療仍保留但已限縮</b> —— 詳見下方橫列。');
    L.push('❗<b>ESMO CPG 2023 那句「FDA 撤回 ' + NR('niraparib') + ' 與 ' + NR('rucaparib') +
      '、但不含 ' + NR('olaparib') + '」現在是錯的。</b>');
    fill('ov_r_maint', cls, title, L, SRC_NTUH + ' OV-5（p51）。' +
      '❗<b>該頁整頁為貼上的點陣圖且第三支被裁切，內容不完整</b>；' +
      '本頁已 render 原始嵌入圖（p51_img1.png）確認裁切位置。' +
      'PARP 適應症現況查自 FDA Federal Register 89 FR 20982 與現行仿單，查核日 2026-09-13。',
      parpReference() + hrdReference() + gapReference() + nhiReference());
    fu('ov_f_maint', FU_OV6);
  }

  function renderRec() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.tfi === 'resistant') {
      cls = 'rec-urgent';
      title = 'OV-7 歸為 platinum-resistant<br>→ 指引只寫到「支持性照護與／或復發治療」';
      L.push(H('OV-7 的定義逐字', 'p53'));
      L.push('<b>「Progression on primary, maintenance or recurrence therapy <u>or</u> ' +
        'Stable or persistent disease (if not on maintenance therapy) <u>or</u> Complete remission ' +
        'and relapse <b>&lt; 6 mo</b> after completing chemotherapy」</b>');
      L.push('<b>→「Best supportive care (NCCN Guidelines for Palliative Care) <u>and/or</u> ' +
        'Recurrence therapy (OV-C, 9 of 12)」</b>');
      L.push('❗<b>OV-C 第 9 頁不存在</b> —— <b>實際要用什麼藥，指引沒有寫。</b>' +
        '<b>這一格是整份卵巢癌章節缺頁影響最大的地方。</b>');
      L.push(H('❗這個分類方式本身已經被指引放棄', ''));
      L.push('<b>ESMO CPG 2023 逐字：這個二分法已「discontinued in clinical practice following the ' +
        '2018 ESMO-ESGO Consensus Conference」</b>；' +
        '<b>GCIG OCCC6 Statement 7：「Eligibility based <u>only</u> on the interval from last ' +
        'platinum treatment is <u>discouraged</u>」</b>。');
      L.push('<b>改用 TFIp 加上「白金是不是最好的選項」的判準</b>，而不是用月數切兩類。' +
        '❗<b>但 FDA 仿單與部分試驗分層仍在用舊詞，開藥與申請給付時還是得用。</b>');
      L.push('❗<b>OV-7 還少了兩層</b>：<b>沒有 partially platinum-sensitive（6–12 個月）</b>，' +
        '<b>也沒有 platinum-refractory 的定義。</b>');
      L.push(EV('<b>這一格的院外實證重點</b>：<b>AURELIA</b>（PMID 24637997）支持在此情境加 ' +
        '<span class="rx">bevacizumab</span>；' +
        '<b>mirvetuximab soravtansine 於 FRα 陽性者</b>有 SORAYA（PMID 36716407）與 ' +
        'MIRASOL（PMID 38055253）。' +
        '❗<b>免疫治療在卵巢癌幾乎全軍覆沒</b>：JAVELIN 100（HR 1.43）、JAVELIN 200、IMagyn050、' +
        'ATALANTE、<b>NINJA 的 PFS 甚至是反向的（HR 1.5，P = .002）</b>。' +
        '<b>ATALANTE 的 ITT PFS p = .041 也不是陽性</b>（階層檢定下未達顯著）—— ' +
        '<b>看到 p &lt; 0.05 就判陽性會出錯。</b>' +
        'DUO-O 與 KEYLYNK-001 看似陽性，但兩者「只加免疫、不加 olaparib」的對照臂都不顯著。'));
    } else {
      title = 'OV-7 歸為 platinum-sensitive（≥ 6 個月）<br>→ 走 OV-8';
      L.push(H('OV-7 的定義逐字', 'p53'));
      L.push('<b>「Complete remission and relapse <b>≥ 6 mo</b> after completing prior chemotherapy」' +
        '→ OV-8</b>');
      L.push(H('OV-8 的內容', 'p54'));
      L.push('<b>「Consider secondary cytoreductive surgery^i,j」</b> —— ' +
        '❗<b>只寫 Consider，而病人選擇條件掛在上標 i 與 j，' +
        '而這份文件<u>沒有任何一頁註腳</u>，條件無從查。</b>');
      L.push('<b>「Continue <span class="rx">bevacizumab</span> if previously treated with ' +
        'chemotherapy + bevacizumab」</b>');
      L.push('<b>「PARPi therapy (for those with BRCA1/2 mutation)：' +
        '◇ If not previously used (category 1)　◇ If disease has not progressed during prior ' +
        'PARPi treatment」</b>');
      L.push('❗<b>維持治療的年限（2 年／3 年／至疾病進展）指引完全沒有寫</b> —— ' +
        'OV-5 與 OV-8 都沒有任何時間長度。');
      L.push('❗<b>OV-8 有一條看圖才知道的迴圈</b>：' +
        '<b>「Biochemical relapse → Delay treatment until radiographic and/or clinical relapse」' +
        '有一條折線<u>回頭接到上方的「Radiographic and/or clinical relapse」格</u></b>。' +
        '<b>只讀文字層會把它做成死路。</b>');
      L.push(EV('<b>二次減積手術的證據不一致，要知道差在哪</b>：' +
        '<b>DESKTOP III</b>（PMID 34874631，以 <b>AGO score</b> 正選病人）' +
        '整體存活 <b>53.7 對 46.0 個月，HR 0.75，P = 0.02（陽性）</b>；' +
        '<b>GOG-0213</b>（PMID 31722153，由主治醫師自行判斷可切除）' +
        '<b>HR 1.29（50.6 對 64.7 個月），P = 0.08（陰性，數字上反而較差）</b>。<br>' +
        '<b>試驗自述的差異有兩個</b>：<b>病人與中心的選擇方式（AGO score 對主治判斷）</b>，' +
        '以及<b>後續 bevacizumab 維持的比例（DESKTOP III 23%、GOG-0213 84%、SOC-1 1%）</b>。' +
        '❗<b>指引主要採納的是「選擇條件」這個解釋</b>' +
        '（ESMO CPG 2023：「the most convincing is the <u>absence of objective selection criteria</u> ' +
        'for surgery」）；<b>bevacizumab 之說仍有爭議，不可寫成定論。</b>' +
        '<b>第三筆 SOC-1（以 iModel 選人）PFS 陽性，最終整體存活尚未成熟。</b>'));
    }
    fill('ov_r_rec', cls, title, L, SRC_NTUH + ' OV-7（p53）、OV-8（p54，已 render PNG 核對迴圈）。' +
      '❗<b>復發治療的實際處方導向不存在的 OV-C 第 9 頁；二次減積的病人選擇條件掛在不存在的註腳。</b>' +
      '院外實證：ESMO CPG 2023（PMID 37597580）、GCIG OCCC6（Lancet Oncol 2022;23:e374-e384）、' +
      'DESKTOP III（PMID 34874631）、GOG-0213（PMID 31722153）、SOC-1（PMID 33705695）。',
      tfiReference() + parpReference() + gapReference() + nhiReference());
    fu('ov_f_rec', FU_OV6);
  }

  function renderLcoc() {
    var L = [], cls = 'rec-elective', title = '';
    var t = S.lhisto;
    if (t === 'carcinosarc') {
      title = 'Carcinosarcoma 癌肉瘤（LCOC-2，p56）<br>→ ❗版面是「先治療、後分期」';
      L.push(H('❗這一頁的箭頭順序和直覺相反', '已 render zoom 核對'));
      L.push('<b>正確走法：Carcinosarcoma →〔<span class="rx">IV paclitaxel/carboplatin</span> ' +
        'q3wk (preferred) <u>or</u> Other systemic therapy〕→ 才分 Stage I ／ Stage II–IV</b>');
      L.push('❗<b>只讀文字層會做成「Stage I → paclitaxel/carboplatin」，那是錯的。</b>' +
        '<b>照箭頭走，醫師要先選處方才會看到期別分岔。</b>');
      L.push('<b>這也是全章唯一寫出藥名與週期的一格</b>：' +
        '<b>「IV paclitaxel/carboplatin every 3 weeks (preferred)」</b>。');
      L.push('<b>Stage II–IV 之後多一格</b>：<b>「If known BRCA1/2 mutation, consider maintenance ' +
        'therapy (post-primary therapy) (OV-5)」</b>；<b>Stage I 直接到 OV-6 追蹤。</b>');
      L.push('❗<b>治療格內部已經按「Stage I (OV-C 5 of 12) / Stage II–IV (OV-C 6 of 12)」分處方，' +
        '但期別分岔畫在這一格之後</b> —— <b>這是圖本身的內在矛盾。</b>');
    } else if (t === 'clearcell') {
      title = 'Clear cell 亮細胞癌（LCOC-3，p57）<br>→ 期別決定有沒有「觀察」這個選項';
      L.push(H('❗兩臂容易被文字層對調', '已 render 核對'));
      L.push('<b>Stage IA、IB、IC1 → 「IV platinum-based therapy <u>or Observe</u>」</b>');
      L.push('<b>Stage IC2–IC3 → 「IV platinum-based therapy」（<u>沒有</u> Observe 選項）</b>');
      L.push('❗<b>文字層抽出來的兩臂是對調的。</b>');
      L.push('❗<b>處方與劑量一樣導向不存在的 OV-C。</b>');
    } else if (t === 'mucinous') {
      title = 'Mucinous 黏液性癌（LCOC-4，p58）<br>→ ❗borderline 那一支在圖上是斷頭的';
      L.push(H('❗這一頁有一個流程斷點', ''));
      L.push('<b>「Borderline → Observe」這一支畫到 Observe 就結束，' +
        '圖上沒有連到右側的 Monitoring／Follow-Up（OV-6）縱線。</b>');
      L.push('❗<b>對照組是漿液性 borderline</b> —— <b>同一份指引給它 LCOC-8～10 三頁完整追蹤路徑，' +
        '黏液性 borderline 卻在此斷頭。</b><b>這一格的追蹤要自行比照漿液性那三頁或查院外指引。</b>');
      L.push('<b>侵襲性黏液性癌的處置依期別走白金為基礎的化療</b>，處方同樣未列。');
    } else if (t === 'g1endo') {
      title = 'Grade 1 endometrioid（LCOC-5，p59）<br>→ 化療或荷爾蒙治療，但兩條路的下游不同';
      L.push(H('❗維持治療只接在化療那一條', '已 render 核對'));
      L.push('<b>維持治療格<u>只接在「Chemotherapy」那一條</u>；' +
        '「Hormonal therapy (category 2B)」是<u>直接橫向到追蹤頁</u>，不經維持治療。</b>');
      L.push('❗<b>只讀文字層會把兩條路都接到維持治療，那是錯的。</b>');
      L.push('<b>維持治療逐字：「Maintenance <span class="rx">letrozole</span> ' +
        '<u>(category 2B)</u> or other hormonal therapy (category 2B)」</b>');
      L.push('❗<b>和 LCOC-6 的標示不一致</b>：<b>letrozole 在這一頁標 category 2B，' +
        '在 LCOC-6（低惡性度漿液性癌）卻沒有標。</b><b>同一個藥、兩頁不同標示。</b>');
    } else if (t === 'lgsc') {
      title = 'Low-grade serous 低惡性度漿液性癌（LCOC-6／7，p60–61）<br>→ 荷爾蒙治療的角色比主線大';
      L.push(H('主建議', 'LCOC-6'));
      L.push('<b>維持治療：「Maintenance <span class="rx">letrozole</span> or Other hormonal ' +
        'therapy (category 2B)」</b>');
      L.push('❗<b>注意標示的差異</b>：<b>這一頁的 letrozole <u>沒有</u>標 category 2B，' +
        '但 LCOC-5 的同一個藥標了。</b>');
      L.push('❗<b>另一個不一致</b>：<b>LCOC-6 的 Stage II–IV 維持格<u>沒有</u> Observe 選項，' +
        '但 Stage IC 格有。</b>');
      L.push('<b>維持治療格同樣只接在化療那一條</b>，荷爾蒙治療直接橫向到追蹤頁。');
      L.push('❗<b>LCOC-7（p61）仍寫「Tumor <u>molecular</u> testing if not previously done」</b> —— ' +
        '<b>台大在 OV-6 已把 molecular 改成 biomarker 三處，但這一頁沒有跟著改。</b>');
    } else if (t === 'borderline') {
      title = 'Serous borderline 低惡性潛能（LCOC-8～10，p62–64）<br>→ 有完整的三頁路徑與專屬追蹤表';
      L.push(H('追蹤表和主線不同', 'LCOC-10 逐字'));
      L.push('<b>「Visits every <u>3–12 mo for up to 5 y</u>, then as clinically indicated」</b>');
      L.push('<b>「CA-125 … <u>every visit</u> if initially elevated」</b>' +
        '（❗<b>比主線 OV-6 的「依臨床需要」密</b>）');
      L.push('<b>「Ultrasound as indicated for patients with fertility-sparing surgery」</b>');
      L.push('❗<b>p62 的頁標題印殘了</b> —— <b>只印「(Low Malignant Potential)」，' +
        '「Ovarian Serous Borderline Epithelial Tumors」那一行掉了</b>（p63、p64 同型頁面都完整）。');
      L.push('<b>漿液性 borderline 有三頁完整路徑，是 LCOC 裡結構最完整的一組。</b>');
    } else if (t === 'sexcord') {
      cls = 'rec-nonop';
      title = 'Sex cord-stromal 性索間質瘤（LCOC-11，p65）<br>→ ❗Stage I 在圖上沒有復發出口';
      L.push(H('保留生育功能', 'LCOC-11 逐字'));
      L.push('<b>「Disease clinically confined to ovary, fertility desired → Fertility-sparing ' +
        'surgery with complete staging」</b>');
      L.push(H('❗這一頁的流程斷點', '已 render 核對'));
      L.push('<b>Stage I 兩支的「Surveillance (LCOC-B)」<u>沒有</u>接到' +
        '「If clinical relapse：Consider secondary cytoreductive surgery or Recurrence therapy」那格</b>，' +
        '<b>只有 Stage II–IV 那支接得到。</b>' +
        '<b>等於 Stage I 性索間質瘤復發時，流程上沒有出口。</b>');
      L.push('❗<b>而且 LCOC-B 這一頁本身不存在</b> —— <b>追蹤表無從查。</b>');
    } else {
      title = 'Germ cell 生殖細胞瘤（LCOC-12～14，p66–68）<br>→ 全章少數寫出處方名稱的一組';
      L.push(H('保留生育功能', 'LCOC-12 逐字'));
      L.push('<b>「Fertility desired → Fertility-sparing surgery and comprehensive staging (OV-A)」</b>' +
        ' —— ❗<b>OV-A 這一頁不存在。</b>');
      L.push(H('處方', 'LCOC-13 逐字'));
      L.push('<b>「<span class="rx">TIP</span> (<span class="rx">paclitaxel</span>/' +
        '<span class="rx">ifosfamide</span>/<span class="rx">cisplatin</span>)」</b>、' +
        '<b>「High-dose chemotherapy + hematopoietic cell transplant (HCT)」</b>');
      L.push('❗<b>看圖才知道的一條</b>：<b>「Persistently elevated markers with definitive residual ' +
        'disease」是<u>橫向直接</u>接到 TIP／高劑量化療加移植那一格，<u>不經 biopsy</u>。</b>');
      L.push(H('❗這一組有兩個斷頭', ''));
      L.push('<b>LCOC-14 的「Incomplete clinical response → LCOC-A」指向不存在的頁</b> —— ' +
        '<b>生殖細胞瘤二線治療失敗後，流程上沒有出口。</b>');
      L.push('<b>LCOC-14 另有一條迴圈</b>：<b>「Complete clinical response」折線回到「Observe (LCOC-B)」</b>，' +
        '<b>而 LCOC-B 同樣不存在。</b>');
    }
    fill('ov_r_lcoc', cls, title, L, SRC_NTUH + ' LCOC-1 ～ LCOC-14（p55–68），' +
      '22 張流程圖已全部 render 成 220 dpi PNG 逐張看圖判讀，箭頭走向以看圖為準。' +
      '❗<b>LCOC-A 與 LCOC-B 兩頁被引用但不存在；處方一律導向不存在的 OV-C。</b>',
      gapReference() + nhiReference());
    fu('ov_f_lcoc', '<li>❗<b>漿液性 borderline 有專屬追蹤表</b>（LCOC-10）：' +
      '<b>每 3–12 個月、最多 5 年，之後依臨床需要</b>；<b>初始升高者每次門診都驗 CA-125</b>；' +
      '<b>保留生育功能者依需要做超音波。</b></li>' +
      '<li>❗<b>生殖細胞瘤與性索間質瘤的追蹤表在 LCOC-B —— 該頁不存在。</b></li>' +
      '<li><b>其餘型態回到主線 OV-6 的追蹤排程</b>：' +
      '<b>每 2–4 個月 2 年，之後每 3–6 個月 3 年，5 年後每年一次。</b></li>');
  }

  /* ==========================================================
     最下方一：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('卵巢癌是少數「診斷時就該驗」的癌別', 'ESMO CPG 2023'));
    L.push('<b>「所有<u>高惡性度</u>卵巢癌在<u>診斷時</u>就要驗 germline 與／或 somatic BRCA」[I, A]</b>；' +
      '<b>晚期高惡性度另要驗 HRD [I, A]</b>。' +
      '<b>不是等到復發才驗，也不是只驗有家族史的人。</b>');
    L.push('<b>台大 OV-1 的紅字改寫方向一致</b>：' +
      '「genetic risk evaluation and germline and somatic <b>biomarker</b> testing (if not previously done)」。' +
      '❗<b>但 OV-2、OV-3 沒跟著改，仍是舊寫法「germline and somatic testing」；' +
      'OV-6 改了三處 molecular → biomarker，LCOC-7 沒改。刪除線原文也還看得見。</b>');
    L.push(H('❗驗到會改變什麼', ''));
    L.push('<b>BRCA 突變會直接改變維持治療</b>：<b>OV-5 的第一個分岔就是 BRCA／HRD 狀態</b>，' +
      '<b>BRCA 突變那一支的 PARP 抑制劑是 category 1</b>。' +
      '<b>OV-8 的復發維持也寫明「PARPi therapy (for those with BRCA1/2 mutation)」。</b>');
    L.push('<b>癌肉瘤也要看</b>：<b>LCOC-2 的 Stage II–IV 之後有一格' +
      '「If known BRCA1/2 mutation, consider maintenance therapy (OV-5)」。</b>');
    L.push('<b>還會改變家屬的處置</b> —— germline 陽性要做家族檢測與遺傳諮詢。');
    L.push(H('❗三個檢測上的坑', ''));
    L.push('<b>① 腫瘤檢測不能取代 germline</b>：' +
      '<b>腫瘤組織抓不到 large genomic rearrangement，也抓不到 BRCA methylation。</b>' +
      '<b>腫瘤 BRCA 陰性不等於 germline 陰性。</b>');
    L.push('<b>② HRD 陰性不能當作不用 PARP 的理由</b>：' +
      '<b>ESMO 2020 生物標記指引逐字說現行檢測「lack negative predictive value」</b> —— ' +
      '<b>陰性只代表沒驗到，不代表不會有效。</b>');
    L.push('<b>③ 檢體品質有門檻</b>：<b>腫瘤細胞含量 &lt; 30% 的檢體不應發 HRD 報告</b>，' +
      '一致性會掉到 60%。各平台之間一致性約 85–95%。');
    L.push(EV('<b>HRD 的定義本身各家不同</b>：FDA 定義為 <b>BRCA 突變<u>與／或</u>基因體不穩定性</b>；' +
      '<b>EMA 不綁特定檢測，FDA 綁 companion diagnostic</b>。' +
      '台灣要看藥證與健保條文怎麼寫。'));
    return '<div class="bc-gene-h">要不要驗基因？卵巢癌是「診斷時就要驗」的那一類' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     最下方二：藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(c) { return 'ov-drug-' + c.replace(/ /g, '_'); }
  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }
  function renderDrugCards() {
    var box = el('ov_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('ovPath');
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
    var g = el('ov_gene');
    if (g) { g.classList.toggle('hidden', !txt.trim()); if (txt.trim() && !g.innerHTML) g.innerHTML = geneBlock(); }

    var picked = [];
    OV_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' +
        (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });
    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;
    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var nCards = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML = '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡' +
      '<span class="bc-drugbox-n">' + picked.length + ' 種藥 · ' + nCards + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">點藥名展開台大醫院藥劑部處方集的完整藥卡。' +
      '<b>徽章標明該藥「用於卵巢癌時」在台灣的狀態。</b>' +
      '❗<b>台大婦癌指引本身沒有列任何化療劑量</b>（全文件 AUC 與 mg/m² 各 0 次，' +
      '處方導向不存在的 OV-C 頁），<b>劑量請以藥卡與院內處方為準。</b>' +
      '<b>rucaparib 不在台大處方集，故無藥卡。</b></div>' +
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
     總 render 與互動
     ========================================================== */
  function render() {
    collapseAll();
    if (S.scope === 'init') {
      show('ov_n_cand', true);
      if (S.cand) {
        renderInit();
        if (S.cand === 'nact') { show('ov_n_resp', true); if (S.resp) renderNact(); }
        else fu('ov_f_init', FU_OV6);
      }
    } else if (S.scope === 'adj') {
      show('ov_n_stage', true);
      if (S.stage) renderAdj();
    } else if (S.scope === 'maint') {
      show('ov_n_hrd', true);
      if (S.hrd) { show('ov_n_bev', true); if (S.bev) renderMaint(); }
    } else if (S.scope === 'rec') {
      show('ov_n_tfi', true);
      if (S.tfi) renderRec();
    } else if (S.scope === 'lcoc') {
      show('ov_n_lhisto', true);
      if (S.lhisto) renderLcoc();
    }
    renderDrugCards();
  }

  var SEL_GROUPS = ['ov_n1', 'ov_n_cand', 'ov_n_resp', 'ov_n_stage', 'ov_n_hrd',
    'ov_n_bev', 'ov_n_tfi', 'ov_n_lhisto'];
  var DOWNSTREAM = {
    scope: ['cand', 'resp', 'stage', 'hrd', 'bev', 'tfi', 'lhisto'],
    cand: ['resp'],
    hrd: ['bev']
  };
  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ovPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) { down.forEach(function (k) { S[k] = null; }); clearSelectionMarks(); }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }
  function reapplyMarks() {
    var pairs = [['ov_n1', 'scope'], ['ov_n_cand', 'cand'], ['ov_n_resp', 'resp'],
      ['ov_n_stage', 'stage'], ['ov_n_hrd', 'hrd'], ['ov_n_bev', 'bev'],
      ['ov_n_tfi', 'tfi'], ['ov_n_lhisto', 'lhisto']];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /ovPick\('([a-z0-9_]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }
  function ovReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }
  function initOvarianPathway() { ovReset(); }

  global.ovarianPathwayHTML = ovarianPathwayHTML;
  global.initOvarianPathway = initOvarianPathway;
  global.ovPick = ovPick;
  global.ovReset = ovReset;
})(window);
