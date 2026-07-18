/* ============================================================
   卵巢癌治療互動決策流程 Ovarian / Fallopian Tube / Primary Peritoneal Cancer Pathway
   資料來源：國立臺灣大學醫學院附設醫院 婦癌診療指引
   版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000011
   對應頁面 OV-1 ～ OV-8、LCOC-1 ～ LCOC-14
   ※ 本流程以「臨床情境」為第一步（初次治療／維持治療／復發），而非以分期起頭——
     維持治療與復發治療各自有完整的判斷軸（生物標記、鉑類敏感性），臨床醫師知道
     自己在哪個階段，需要的是該階段的完整選單，硬串成單一路徑只會多點好幾層。
   ※ 三個易錯之處：
     ① 第 I 期不進入維持治療（OV-4 導向 OV-6 追蹤）；只有第 II–IV 期才走 OV-5。
     ② OV-5 的維持治療同時受<b>兩個</b>變數決定：BRCA／HRD 狀態，以及
        <b>一線化療是否用過 bevacizumab</b>。少看一個就會給錯建議。
     ③ 鉑類「抗性」與「敏感」的分界是 <b>完全緩解後復發距完成化療 6 個月</b>，
        且「治療中惡化」「疾病穩定或持續存在」也算抗性——不是只看時間。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var ovSt = {
    mode: null,    // primary | maint | recur | lcoc
    op: null,      // op_yes | op_no        （OV-1／OV-2）
    stage: null,   // st1_low | st1_high | st1c | st24
    brca: null,    // b_mut | b_hrd | b_hrp
    bev: null,     // bev_yes | bev_no
    plat: null     // p_resist | p_sens
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ovPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  function dxHtml() {
    return '<details class="dx-details"><summary>初始檢查 Workup（OV-1）▸</summary>' +
      '<ul class="dx-list">' +
      '<li>腹部與骨盆腔理學檢查；<b>超音波和／或腹部骨盆腔 CT／MRI</b>（臨床需要時）</li>' +
      '<li>胸部 CT 或胸部 X 光（臨床需要時）</li>' +
      '<li>CBC、生化含肝功能；<b>CA-125 或其他腫瘤標記</b></li>' +
      '<li><b>評估體能狀態與營養狀態</b>；必要時腸胃科評估、生殖內分泌不孕症（REI）評估</li>' +
      '<li><b>取得家族史</b>；臨床上可疑之病灶<b>轉介婦科腫瘤專科</b></li>' +
      '</ul>' +
      '<div class="dx-h">本院必要檢查（Essential examination，指引以標示強調）</div>' +
      '<ul class="dx-list"><li><b>CA-125</b></li><li><b>PET、骨盆腔 CT／MRI</b></li></ul>' +
      '<div class="dx-h">生物標記</div>' +
      '<ul class="dx-list"><li>所有卵巢癌、輸卵管癌與原發性腹膜癌病人均應接受<b>遺傳風險評估，以及生殖細胞與體細胞之生物標記檢測</b>（若尚未做過）。<b>「biomarker」一詞為本院修訂</b>，取代原文之「testing」。</li></ul>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>IDS</b> — interval debulking surgery 間隔減積手術</li>' +
      '<li><b>HIPEC</b> — hyperthermic intraperitoneal chemotherapy 腹腔內熱化學治療</li>' +
      '<li><b>HRD／HRP</b> — homologous recombination deficient／proficient 同源重組修復缺失／正常</li>' +
      '<li><b>PARPi</b> — poly(ADP-ribose) polymerase inhibitor</li>' +
      '<li><b>CR／PR</b> — complete／partial response 完全／部分反應</li>' +
      '<li><b>LMP</b> — low malignant potential 低惡性潛能（borderline）</li>' +
      '<li><b>MMMT</b> — malignant mixed Müllerian tumor 惡性混合苗勒氏瘤</li>' +
      '</ul></details>';
  }

  function fuHtml() {
    return '<div class="fu-label">追蹤與監測 Monitoring／Follow-up（OV-6）</div>' +
      '<ul class="fu-list">' +
      '<li><b>回診</b>：前 2 年每 2–4 個月，其後 3 年每 3–6 個月，滿 5 年後每年一次。</li>' +
      '<li>理學檢查含骨盆腔內診（臨床需要時）；<b>CA-125 或其他腫瘤標記</b>（初始即升高者）。</li>' +
      '<li>腹部骨盆腔 CT、MRI、PET/CT 或 PET（顱底至大腿中段）依臨床需要安排；CBC 與生化依需要。</li>' +
      '<li><b>若尚未做過，轉介遺傳風險評估</b>；長期健康照護。</li>' +
      '<li><b>復發之三種呈現（OV-6）</b>：<br>· <b>CA-125 上升或臨床復發，且未曾化療</b> → 影像 + <b>腫瘤生物標記檢測</b>（若未做過）→ 回到原發治療（OV-1）。<br>· <b>臨床復發且曾化療</b> → 影像 + 生物標記檢測 → 依 OV-7 之鉑類敏感性分流。<br>· <b>CA-125 連續上升且曾化療</b> → 影像 + 生物標記檢測 → <b>可延後治療至臨床復發</b>，<b>或</b>立即治療（<b>category 2B</b>）→ 依 OV-7。</li>' +
      '<li><b>建議之腫瘤生物標記</b>（OV-6 註）：以最近可得之腫瘤組織，檢測含但不限於 <b>HER2（IHC）、PD-L1（IHC, CPS）、BRCA1/2、HRD 狀態、MSI、MMR、TMB、BRAF、KRAS、FRα（FOLR1）、RET、NTRK1/2/3</b>。<b>少見型卵巢癌尤應考慮多基因套組檢測</b>。</li>' +
      '</ul>';
  }

  /* ---------- 少見型卵巢癌（LCOC-1～LCOC-14）：內容而非流程 ---------- */
  function lcocHtml() {
    return rxLine('癌肉瘤（MMMT）', 'LCOC-2', [
      '<b>靜脈注射 paclitaxel/carboplatin 每 3 週（優先）</b>，<b>或</b>其他全身治療。',
      '<b>第 II–IV 期</b>：<b>若已知 BRCA1/2 突變，考慮一線後之維持治療</b>（OV-5）。'
    ]) +
    rxLine('亮細胞癌', 'LCOC-3', [
      '<b>第 IA、IB、IC1 期</b>：靜脈含鉑治療，<b>或觀察</b>。',
      '<b>第 IC2–IC3 期</b>：<b>靜脈含鉑治療</b>（<b>無觀察選項</b>）。',
      '<b>第 II–IV 期</b>：全身治療 → 若已知 BRCA1/2 突變，考慮維持治療（OV-5）。'
    ]) +
    rxLine('黏液性腫瘤', 'LCOC-4：<b>先做腸胃道評估、CEA、CA 19-9</b>（若未做過）', [
      '<b>第 IA–IB 期癌</b>：<b>觀察</b>。',
      '<b>第 IC 期癌</b>：觀察，<b>或</b>全身治療。',
      '<b>第 II–IV 期癌</b>：全身治療。',
      '<b>Borderline</b>：<b>觀察</b>。'
    ]) +
    rxLine('Grade 1 類子宮內膜癌', 'LCOC-5', [
      '<b>第 IA–IB 期</b>：觀察。',
      '<b>第 IC 期</b>：觀察（<b>category 2B</b>），<b>或</b>全身治療——<b>化療</b>（其後可觀察，或以 <span class="drug">letrozole</span> 維持／其他荷爾蒙治療，皆 category 2B）<b>或荷爾蒙治療（category 2B）</b>。',
      '<b>第 II–IV 期</b>：全身治療——<b>化療</b>（其後觀察或 letrozole／其他荷爾蒙維持，category 2B）<b>或荷爾蒙治療（category 2B）</b>。'
    ]) +
    rxLine('低惡性度漿液性癌', 'LCOC-6：<b>追蹤走 LCOC-7，不走 OV-6</b>', [
      '<b>第 IA–IB 期</b>：觀察。',
      '<b>第 IC 期</b>：觀察（category 2B），<b>或</b>化療（續以觀察／letrozole 維持／其他荷爾蒙治療）<b>或</b>荷爾蒙治療（category 2B）。',
      '<b>第 II–IV 期</b>：化療（<b>續以 letrozole 維持或其他荷爾蒙治療——此處<u>無</u>單純觀察之選項</b>）<b>或</b>荷爾蒙治療（category 2B）。',
      '<b>復發（LCOC-7）</b>：<span class="drug">trametinib</span>、<span class="drug">binimetinib</span>（category 2B）、<b>BRAF V600E 陽性者</b> <span class="rx">dabrafenib + trametinib</span>、荷爾蒙治療、未曾使用之化療、其他全身治療，或觀察。'
    ]) +
    rxLine('漿液性 borderline 腫瘤（低惡性潛能）', 'LCOC-8～LCOC-10', [
      '<b>先前已完整手術切除</b>：最終病理<b>無低惡性度漿液性癌</b> → 觀察；<b>有</b> → 依 LCOC-6。',
      '<b>先前手術不完整</b>（LCOC-9）：先做腹部骨盆腔顯影 CT。<b>疑有殘存病灶</b> → 完成手術併切除殘存病灶、<b>或</b>保留生育之手術併切除殘存病灶、<b>或</b>經篩選病人考慮不再手術；最終病理為 borderline → 追蹤，為低惡性度漿液性癌 → LCOC-6，為<b>高惡性度漿液性癌 → 依上皮性卵巢癌 OV-4</b>。<b>無殘存病灶</b> → 觀察。',
      '<b>復發（LCOC-10）</b>：手術評估併減積（如適當）→ <b>非侵襲性</b>則觀察；<b>低惡性度侵襲性癌</b>依組織型態走對應 LCOC 頁；<b>高惡性度侵襲性癌</b>比照上皮性卵巢癌（OV-4）。'
    ]) +
    rxLine('惡性性索間質瘤', 'LCOC-11', [
      '<b>手術</b>：病灶臨床侷限於卵巢且希望保留生育 → 保留生育之手術併完整分期；其餘 → 完整分期手術。',
      '<b>第 I 期低風險</b>：<b>觀察</b>。',
      '<b>第 I 期高風險</b>（如 IC 期破裂、分化不良之第 I 期）<b>或中度風險</b>（如有異源性成分）：觀察（category 2B），<b>或</b>考慮含鉑化療（category 2B）。',
      '<b>第 II–IV 期</b>：含鉑化療，<b>或</b>侷限病灶之放射治療（category 2B）。',
      '<b>臨床復發</b>：考慮二次減積手術，或復發治療。'
    ]) +
    rxLine('惡性生殖細胞瘤', 'LCOC-12～LCOC-14', [
      '<b>手術</b>：希望保留生育 → 保留生育之手術併完整分期；否則完整分期手術。',
      '<b>觀察即可者</b>：<b>第 I 期無性細胞瘤（dysgerminoma）</b>、<b>第 I 期 grade 1 未成熟畸胎瘤</b>。',
      '<b>需化療者</b>：任何期別之胚胎癌、內胚竇瘤（卵黃囊瘤）、任何期別之非妊娠性絨毛膜癌，以及<b>第 II–IV 期無性細胞瘤</b>、<b>第 I 期 grade 2–3 或第 II–IV 期未成熟畸胎瘤</b>。',
      '<b>化療後影像評估</b>：<b>完全反應</b> → 追蹤。<b>影像有殘存但標記正常</b> → 切片、考慮手術切除或觀察；切片為<b>壞死組織</b>則比照完全反應，為<b>良性畸胎瘤</b>則影像追蹤，為<b>殘存惡性</b>則 <span class="rx">TIP（paclitaxel/ifosfamide/cisplatin）</span> <b>或高劑量化療 + 造血幹細胞移植</b>（<b>強烈建議轉介三級醫學中心</b>）。<b>標記持續升高併明確殘存病灶</b> → 同上之 TIP 或高劑量化療 + 移植。',
      '<b>復發（LCOC-14）</b>：二線化療（category 2B）、高劑量化療 + 移植（category 2B），或經篩選病人考慮手術。'
    ]);
  }

  function recFor(s) {
    /* ── 少見型 ── */
    if (s.mode === 'lcoc') {
      return { cls: 'rec-elective', title: '少見型卵巢癌 Less Common Ovarian Cancers（LCOC-1～LCOC-14）', detail:
        lcocHtml() +
        '<div class="note">本區以<b>完整選單</b>呈現而非逐步分流——臨床醫師已由病理報告知道組織型態，需要的是該型態的整段建議。' +
        '<b>癌肉瘤、亮細胞癌、黏液性、grade 1 類子宮內膜癌、低惡性度漿液性癌、borderline、性索間質瘤、生殖細胞瘤</b>八類，' +
        '在 LCOC-1 由「手術與組織學診斷」一次分出。</div>',
        note: 'LCOC-1～LCOC-14。' };
    }

    /* ── 初次治療 ── */
    if (s.mode === 'primary') {
      if (s.op === 'op_no') {
        return { cls: 'rec-nonop', title: '手術風險高，或難以達到理想減積 → 新輔助治療（OV-2）', detail:
          rxLine('確認步驟（三者並行）', 'OV-2', [
            '<b>婦科腫瘤專科評估</b>',
            '<b>組織學確認（以切片為優先）</b>',
            '<b>和／或腹腔鏡評估以判定可切除性</b>',
            '→ 確認為手術高風險或難達理想減積後，方開始新輔助治療。'
          ]) +
          rxLine('新輔助治療', 'OV-2', [
            '<b>新輔助治療（category 1）</b>；並完成<b>遺傳風險評估與生殖細胞、體細胞檢測</b>（若未做過）。'
          ]) +
          rxLine('依治療反應分流', 'OV-2', [
            '<b>有反應</b> → <b>間隔減積手術（IDS）併完成子宮切除／BSO 與減積</b>——<b>考慮 HIPEC／cisplatin</b>（<b>本院修訂加入</b>）→ 輔助治療 → <b>維持治療（OV-5）</b>。',
            '<b>疾病穩定</b> → 三個並列選項：IDS 併完成子宮切除／BSO 與減積（<b>考慮 HIPEC</b>）、<b>或</b>繼續現行治療（<b>總療程至少 6 個週期</b>）、<b>或</b>依 OV-7 之持續／復發疾病處置。',
            '<b>疾病惡化</b> → <b>依 OV-7 處置，不做手術</b>。'
          ]),
          note: 'OV-2。新輔助治療之 <b>category 1</b> 依據為 EORTC 55971 與 CHORUS；<b>HIPEC 為本院加入</b>，依據為 OVHIPEC-1（見參考文獻）。' };
      }

      if (!s.stage) {
        return { cls: 'rec-elective', title: '適合原發手術且可能達成理想減積（OV-1）', detail:
          rxLine('依臨床分期與生育需求', 'OV-1', [
            '<b>IA 期且希望保留生育</b> → <b>單側輸卵管卵巢切除（USO）+ 完整手術分期</b>。',
            '<b>IB 期且希望保留生育</b> → <b>雙側輸卵管卵巢切除（BSO）+ 完整手術分期</b>。',
            '<b>IA–IV 期、適合手術、可能達理想減積、不保留生育</b> → <b>子宮切除／BSO + 完整分期，並視需要減積</b>。'
          ]) +
          rxLine('手術後', 'OV-1', [
            '完成<b>遺傳風險評估與生殖細胞、體細胞生物標記檢測</b>（若未做過）。',
            '→ 依<b>病理分期</b>決定輔助治療（OV-4）。少見型組織型態改走 <b>LCOC-1</b>。'
          ]) +
          '<div class="note">請於上方<b>第 3 步</b>選擇病理分期以取得輔助治療建議。</div>',
          note: 'OV-1。' };
      }

      if (s.stage === 'st1_low') {
        return { cls: 'rec-elective', title: '病理分期 IA 或 IB 期 · Grade 2 類子宮內膜癌', detail:
          rxLine('二擇一', 'OV-4', [
            '<b>觀察 Observe</b>',
            '<b>或 靜脈注射含鉑治療</b>（第 I 期之一線處方，OV-C 5 of 12）'
          ]) +
          '<div class="note"><b>第 I 期不進入維持治療</b>——OV-4 將第 I 期直接導向 OV-6 追蹤，只有第 II–IV 期才走 OV-5。</div>',
          note: 'OV-4。' };
      }
      if (s.stage === 'st1_high') {
        return { cls: 'rec-elective', title: '病理分期 IA 或 IB 期 · Grade 3 類子宮內膜癌或高惡性度漿液性癌', detail:
          rxLine('單一建議', 'OV-4', [
            '<b>靜脈注射含鉑治療</b>（第 I 期之一線處方，OV-C 5 of 12）'
          ]) +
          '<div class="note"><b>本組無「觀察」選項</b>——這是與 grade 2 類子宮內膜癌同為 IA／IB 期時的實質差別。</div>',
          note: 'OV-4。' };
      }
      if (s.stage === 'st1c') {
        return { cls: 'rec-elective', title: '病理分期 IC 期 · 高惡性度漿液性癌或 grade 2／3 類子宮內膜癌', detail:
          rxLine('單一建議', 'OV-4', [
            '<b>靜脈注射含鉑治療</b>（第 I 期之一線處方，OV-C 5 of 12）'
          ]) +
          '<div class="note">IC 期與「IA／IB 期高惡性度」在 OV-4 圖上<b>匯入同一個治療方塊</b>。完成後併<b>症狀處置與最佳支持照護</b>，必要時轉介安寧緩和評估 → 追蹤（OV-6）。</div>',
          note: 'OV-4。' };
      }
      return { cls: 'rec-elective', title: '病理分期 II／III／IV 期', detail:
        rxLine('一線治療', 'OV-4', [
          '<b>含鉑化療</b>（第 II–IV 期之一線處方，OV-C 6 of 12）'
        ]) +
        rxLine('併行', 'OV-4', [
          '<b>症狀處置與最佳支持照護</b>；必要時轉介<b>安寧緩和評估</b>。'
        ]) +
        '<div class="note"><b>第 II–IV 期於一線治療後進入維持治療（OV-5）</b>，與第 I 期直接進入追蹤不同。請於上方第 1 步改選「維持治療決策」以取得 OV-5 之完整建議。</div>',
        note: 'OV-4。' };
    }

    /* ── 維持治療（OV-5）── */
    if (s.mode === 'maint') {
      var bevYes = s.bev === 'bev_yes';
      if (s.brca === 'b_mut') {
        return { cls: 'rec-elective', title: '維持治療 · 生殖細胞或體細胞 BRCA1/2 致病性變異', detail:
          bevYes
            ? rxLine('一線化療曾用 bevacizumab', 'OV-5', [
                '<b><span class="rx">Olaparib + Bevacizumab</span>（category 1）</b>',
                '<b>或</b> <span class="rx">Niraparib + Bevacizumab</span>（<b>無法耐受 olaparib 時</b>）',
                '<b>或</b> <span class="drug">Olaparib</span>、<span class="drug">Niraparib</span> 或 <span class="drug">Rucaparib</span> 單用'
              ])
            : rxLine('一線化療未用 bevacizumab', 'OV-5', [
                '<b><span class="drug">Olaparib</span>（category 1）</b>',
                '<b>或</b> <b><span class="drug">Niraparib</span>（category 1）</b>',
                '<b>或</b> <span class="drug">Rucaparib</span>',
                '<b>或</b> <b>經篩選之第 II 期且達完全反應者可觀察</b>'
              ]),
          note: 'OV-5。<b>PARP 抑制劑的 category 1 只出現在本組</b>（BRCA1/2 致病性變異）。依據為 SOLO-1、PRIMA、PAOLA-1（見參考文獻）。' };
      }
      if (s.brca === 'b_hrd') {
        return { cls: 'rec-elective', title: '維持治療 · BRCA1/2 野生型或未知 · 同源重組修復缺失（HRD）', detail:
          bevYes
            ? rxLine('一線化療曾用 bevacizumab', 'OV-5', [
                '<b><span class="rx">Olaparib + Bevacizumab</span>（category 1）</b>',
                '<b>或</b> <span class="rx">Niraparib + Bevacizumab</span>（無法耐受 olaparib 時）',
                '<b>或</b> <span class="drug">Bevacizumab</span> 單用',
                '<b>或</b> <span class="drug">Olaparib</span> 單用'
              ])
            : rxLine('一線化療未用 bevacizumab', 'OV-5', [
                '<span class="drug">Olaparib</span>、<span class="drug">Niraparib</span> 或 <span class="drug">Rucaparib</span>',
                '<b>或</b> <b>觀察（達完全反應者）</b>'
              ]),
          note: 'OV-5。<b>本組之 PARP 抑制劑單用無 category 1</b>；category 1 僅見於 olaparib + bevacizumab（PAOLA-1）。' };
      }
      return { cls: 'rec-nonop', title: '維持治療 · BRCA1/2 野生型或未知 · 同源重組修復正常（HRP）或狀態未知', detail:
        bevYes
          ? rxLine('一線化療曾用 bevacizumab', 'OV-5', ['<b><span class="drug">Bevacizumab</span></b>'])
          : rxLine('一線化療未用 bevacizumab', 'OV-5', [
              '<b>觀察（達完全反應者）</b>',
              '<b>或</b> 依 OV-7 之持續／復發疾病處置'
            ]),
        note: 'OV-5。<b>本組完全不給 PARP 抑制劑</b>——這是三組中最重要的差別，勿因「BRCA 野生型」就套用 HRD 組的建議。' };
    }

    /* ── 復發（OV-7／OV-8）── */
    if (s.plat === 'p_resist') {
      return { cls: 'rec-nonop', title: '鉑類抗性疾病（OV-7）', detail:
        '<div class="note"><b>符合下列<u>任一</u>即屬鉑類抗性</b>（OV-7）：' +
        '<ul class="dx-list">' +
        '<li><b>於一線、維持或復發治療中惡化</b></li>' +
        '<li><b>疾病穩定或持續存在</b>（未接受維持治療者）</li>' +
        '<li><b>完全緩解後，於完成化療 &lt;6 個月內復發</b></li>' +
        '</ul>不是只看時間——「治療中惡化」與「疾病穩定」同樣屬抗性。</div>' +
        rxLine('處置', 'OV-7', [
          '<b>最佳支持療法</b>',
          '<b>和／或 復發治療</b>（OV-C 9 of 12）'
        ]) +
        '<div class="note">指引本頁以「recurrence therapy」統稱並指向 OV-C（該處方頁不在本院指引所收錄之頁面範圍內），未於 OV-7 逐條列出藥名。' +
        '鉑類抗性之現行選項與其試驗依據見本頁下方參考文獻（MIRASOL）。</div>',
        note: 'OV-7。' };
    }
    if (s.plat === 'p_sens') {
      return { cls: 'rec-elective', title: '鉑類敏感疾病（OV-7 → OV-8）', detail:
        '<div class="note"><b>定義</b>：<b>完全緩解後，於完成前次化療 ≥6 個月才復發</b>。</div>' +
        rxLine('影像和／或臨床復發', 'OV-8', [
          '<b>先考慮二次減積手術</b>',
          '→ <b>合併含鉑化療——第一次復發時為優先（category 1）</b>',
          '<b>或</b> 復發治療',
          '<b>和／或</b> 最佳支持療法'
        ]) +
        rxLine('僅生化復發（CA-125 上升、影像無病灶）', 'OV-8', [
          '<b>延後治療至影像和／或臨床復發</b>（屆時回到上方之二次減積評估）',
          '<b>或 立即含鉑復發治療（category 2B）</b>和／或最佳支持療法'
        ]) +
        rxLine('復發治療後之維持治療（達 PR 或 CR 者）', 'OV-8', [
          '<b>特定情況下有用</b>：<b>先前以化療 + bevacizumab 治療者，繼續 bevacizumab</b>',
          '<b>或 PARP 抑制劑</b>（<b>BRCA1/2 突變者</b>）：<b>先前未曾使用者為 category 1</b>；且<b>限先前 PARPi 治療期間未曾惡化者</b>',
          '<b>或 觀察</b>'
        ]),
        note: 'OV-8。二次減積手術之依據為 DESKTOP III（陽性）與 GOG-213（陰性）——<b>兩試驗結論相異，差別在病人選擇條件</b>，見參考文獻。' };
    }
    return null;
  }

  function ovarianPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院婦癌診療指引 版次 10（2026/06/16，文件編號 50710-2-000011）</b>卵巢癌章節（OV-1～OV-8、LCOC-1～LCOC-14）之互動決策流程。' +
      '<b>卵巢癌、輸卵管癌與原發性腹膜癌共用同一套流程。</b>分期採 <b>FIGO 2014</b>。先選擇臨床情境，再逐步點選。</p>';
    h += '<div class="onc-path" id="ovPath">';

    h += dxHtml();

    h += step('ov_s1', '1', '目前的臨床情境？',
      opt('mode', 'primary', '初次治療', 'OV-1～OV-4') +
      opt('mode', 'maint', '一線後之維持治療決策', 'OV-5 · 第 II–IV 期') +
      opt('mode', 'recur', '持續存在或復發', 'OV-7／OV-8') +
      opt('mode', 'lcoc', '少見型卵巢癌', 'LCOC-1～LCOC-14'),
      '<div class="note">維持治療與復發治療各有<b>獨立的判斷軸</b>（生物標記、鉑類敏感性），故以情境為第一步而非分期。</div>');

    h += connH('ov_c1');
    h += step('ov_s2', '2', '是否適合原發減積手術？',
      opt('op', 'op_yes', '適合手術且可能達理想減積', 'OV-1') +
      opt('op', 'op_no', '手術高風險，或難達理想減積', 'OV-2 · 新輔助治療'));

    h += connH('ov_c2');
    h += step('ov_s3', '3', '術後病理分期？',
      opt('stage', 'st1_low', 'IA／IB 期 · G2 類子宮內膜癌') +
      opt('stage', 'st1_high', 'IA／IB 期 · G3 類子宮內膜癌或高惡性度漿液性癌') +
      opt('stage', 'st1c', 'IC 期', '高惡性度漿液性或 G2／G3 類子宮內膜癌') +
      opt('stage', 'st24', '第 II／III／IV 期'));

    h += step('ov_s2m', '2', '生物標記狀態？',
      opt('brca', 'b_mut', 'BRCA1/2 致病性變異', '生殖細胞或體細胞') +
      opt('brca', 'b_hrd', 'BRCA 野生型／未知 · HRD', '同源重組修復缺失') +
      opt('brca', 'b_hrp', 'BRCA 野生型／未知 · HRP 或未知', '同源重組修復正常'));

    h += connH('ov_c2m');
    h += step('ov_s3m', '3', '一線化療是否使用過 bevacizumab？',
      opt('bev', 'bev_no', '未使用過') +
      opt('bev', 'bev_yes', '曾使用過'),
      '<div class="note"><b>這一步不可略過</b>——OV-5 的每一個生物標記分組都再依此拆成兩套建議。</div>');

    h += step('ov_s2r', '2', '鉑類敏感性？',
      opt('plat', 'p_resist', '鉑類抗性', '治療中惡化／疾病穩定／CR 後 <6 個月復發') +
      opt('plat', 'p_sens', '鉑類敏感', 'CR 後 ≥6 個月才復發'));

    h += '<div class="flow-rec rec-idle" id="ov_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="ov_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="ovReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function ovRender() {
    var s = ovSt;
    var prim = s.mode === 'primary';
    var maint = s.mode === 'maint';
    var recur = s.mode === 'recur';

    show('ov_c1', prim || maint || recur);
    show('ov_s2', prim);
    show('ov_c2', prim && s.op === 'op_yes');
    show('ov_s3', prim && s.op === 'op_yes');
    show('ov_s2m', maint);
    show('ov_c2m', maint && !!s.brca);
    show('ov_s3m', maint && !!s.brca);
    show('ov_s2r', recur);

    var done = s.mode === 'lcoc' ||
      (prim && !!s.op) ||
      (maint && !!s.brca && !!s.bev) ||
      (recur && !!s.plat);

    var rec = document.getElementById('ov_rec');
    var fu = document.getElementById('ov_fu');
    if (!rec) return;

    if (!done) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }

    var r = recFor(s);
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function ovClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function ovPick(key, val, btn) {
    var s = ovSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'mode') {
      s.mode = val; s.op = s.stage = s.brca = s.bev = s.plat = null;
      ovClearSel(['ov_s2', 'ov_s3', 'ov_s2m', 'ov_s3m', 'ov_s2r']);
    } else if (key === 'op') {
      s.op = val; s.stage = null;
      ovClearSel(['ov_s3']);
    } else if (key === 'stage') {
      s.stage = val;
    } else if (key === 'brca') {
      s.brca = val; s.bev = null;
      ovClearSel(['ov_s3m']);
    } else if (key === 'bev') {
      s.bev = val;
    } else if (key === 'plat') {
      s.plat = val;
    }
    ovRender();
  }

  function ovReset() {
    for (var k in ovSt) { if (ovSt.hasOwnProperty(k)) ovSt[k] = null; }
    var root = document.getElementById('ovPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('ov_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    ovRender();
  }

  function initOvarianPathway() { ovReset(); }

  global.ovarianPathwayHTML = ovarianPathwayHTML;
  global.initOvarianPathway = initOvarianPathway;
  global.ovPick = ovPick;
  global.ovReset = ovReset;
})(window);
