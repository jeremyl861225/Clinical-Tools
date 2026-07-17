/* ============================================================
   胰臟癌治療互動決策流程 Pancreatic Adenocarcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胰臟癌診療指引
   版次 11（2026/06/16 第 87 次癌症醫療委員會修訂通過），PANC-1 ～ PANC-E
   ※ 本模組僅涵蓋胰臟腺癌（pancreatic adenocarcinoma）；
     神經內分泌腫瘤、壺腹癌、遠端膽管癌不在此流程內。
   ※ 可切除性判定依 PANC-B 之 M. D. Anderson criteria（非 NCCN）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var pcSt = {
    ext: null,    // res | bord | la | meta | rec   （PANC-1／PANC-2／PANC-10）
    surg: null,   // resected | unres_surg          （PANC-3 剖腹探查結果）
    bstrat: null, // neo | planres                  （PANC-4 vs PANC-5）
    bneo: null,   // resected | unres_surg | prog   （PANC-4 新輔助後再評估）
    bres: null,   // resected | unres_surg          （PANC-5 剖腹探查結果）
    ps: null,     // good | poor                    （PANC-7／PANC-8／PANC-9）
    rsite: null,  // local | distant                （PANC-10 復發型態）
    rtime: null,  // gt6 | lt6                      （PANC-10 距初次治療完成時間）
    adj: null     // noevid | metafound             （PANC-6 術後基準檢查）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="pcPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function conn(id) { return '<div class="flow-connector" id="' + id + '">↓</div>'; }
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

  /* ---------- PANC-B：可切除性判定準則（M. D. Anderson criteria）---------- */
  function resectCriteriaHtml() {
    return '<div class="crit-box">' +
      cbx('可切除 Resectable', 'PANC-B · M. D. Anderson criteria', [
        cb('SMA', '無侵犯；腫瘤與動脈間脂肪層正常 No extension; normal fat plane'),
        cb('腹腔動脈幹／肝動脈', '無侵犯 No extension'),
        cb('SMV／PV', '通暢 Patent')
      ]) +
      cbx('臨界可切除 Borderline resectable', '任一項即屬之', [
        cb('SMA', '腫瘤貼附 ≦ 180°（含周徑一半以下）；動脈周圍條紋狀變化、腫瘤接觸面呈凸面者切除機會較高'),
        cb('腹腔動脈幹／肝動脈', '總肝動脈短節段被包覆／貼附（多在胃十二指腸動脈起始處）；外科醫師須準備血管切除與間置移植'),
        cb('SMV／PV', '短節段阻塞，但上下游血管條件適合重建；單獨靜脈阻塞而無 SMA 侵犯者少見，且應可於 CT 顯現')
      ]) +
      cbx('局部晚期 Locally advanced', '', [
        cb('SMA', '被包覆 &gt; 180° Encased'),
        cb('腹腔動脈幹／肝動脈', '被包覆且因延伸至腹腔動脈幹／脾-左胃動脈交界或腹腔動脈幹起始處，技術上無法重建'),
        cb('SMV／PV', '阻塞且技術上無法重建 Occluded, no technical option for reconstruction')
      ]) +
      cbx('不可切除 Unresectable', 'PANC-B · 依腫瘤部位', [
        cb('胰頭 Head', '遠處轉移；SMA 包覆 &gt; 180° 或任何腹腔動脈幹貼附；SMV／門靜脈阻塞且無法重建；主動脈侵犯或包覆'),
        cb('胰體 Body', '遠處轉移；SMA 或腹腔動脈幹包覆 &gt; 180°；SMV／門靜脈阻塞且無法重建；主動脈侵犯'),
        cb('胰尾 Tail', '遠處轉移；SMA 或腹腔動脈幹包覆 &gt; 180°'),
        cb('淋巴結 Nodal', '轉移至切除範圍以外之淋巴結者，應視為不可切除')
      ]) +
      '<div class="note">SMA＝腸繫膜上動脈；SMV／PV＝腸繫膜上靜脈／門靜脈。' +
      '<b>可切除性判定依 PANC-B 所載之 M. D. Anderson criteria</b>（本指引未採 NCCN 之判定表）。</div>' +
      '</div>';
  }

  /* ---------- PANC-A：診斷與分期原則 ---------- */
  function stagingPrinciplesHtml() {
    return '<details class="kps-details"><summary>診斷與分期原則 Principles of Diagnosis and Staging（PANC-A）▸</summary>' +
      '<ul class="rx-items">' +
      '<li><b>#1</b> 診斷處置與可切除性判定應經<b>多專科會診</b>並參照適當影像；胰臟切除術應在<b>每年執行量大（15–20 例）</b>之院所進行。</li>' +
      '<li><b>#2</b> 影像須含<b>胰臟專用 protocol 之 CT 或 MRI</b>：三相橫斷影像、薄切；理想多相位技術含非顯影期＋動脈期、胰實質期與門靜脈期，<b>腹部 3mm 薄切</b>，可精確顯示腫瘤與腸繫膜血管關係，並偵測小至 <b>3–5mm</b> 之轉移灶。胰臟 protocol MRI 正逐漸成為 CT 之替代。</li>' +
      '<li><b>#3</b> <b>PET/CT 角色未明</b>；可於正式胰臟 CT protocol 後，用於「高風險」病人偵測胰外轉移。<b>不可取代高品質顯影 CT</b>。</li>' +
      '<li><b>#4</b> 內視鏡超音波（EUS）可與 CT <b>互補</b>用於分期。</li>' +
      '<li><b>#5</b> 可切除疾病之切片以 <b>EUS 導引 FNA 優於 CT 導引 FNA</b>（診斷率與安全性較佳，腹膜種植風險可能較低）。<b>手術切除前不需病理證實</b>；臨床高度懷疑胰臟癌時，不應因切片未確診而延遲手術。</li>' +
      '<li><b>#6</b> <b>診斷性分期腹腔鏡</b>用於排除影像未偵測之轉移（尤其<b>胰體、胰尾</b>病灶）：部分院所於手術或化放療前例行執行，或選擇性用於瀰漫性疾病高風險者（臨界可切除、<b>CA 19-9 顯著升高</b>、原發腫瘤大、區域淋巴結大）。</li>' +
      '<li><b>#7</b> 腹腔鏡或剖腹時<b>腹腔沖洗液細胞學陽性等同 M1</b>；若已切除，應依 M1 治療。</li>' +
      '<li><b>CA 19-9 注意（PANC-2 註 b）</b>：良性膽道阻塞時 CA 19-9 可能升高，<b>須待膽道充分減壓、膽紅素恢復正常後之數值方為適當基準</b>；<b>Lewis 抗原陰性</b>者 CA 19-9 可能測不到。</li>' +
      '</ul></details>';
  }

  /* ---------- PANC-C：緩和與支持治療 ---------- */
  function palliationHtml() {
    return '<details class="kps-details"><summary>緩和與支持治療原則 Principles of Palliation and Supportive Care（PANC-C）▸</summary>' +
      '<div class="rx-note"><b>目標</b>：預防並減輕痛苦，同時確保最佳生活品質。</div>' +
      '<ul class="rx-items">' +
      '<li><b>膽道阻塞</b>：內視鏡膽道支架（<b>首選</b>）；或經皮膽道引流後續內置化；或開放式膽道-腸道繞道。</li>' +
      '<li><b>胃出口阻塞</b>：體能佳 → 胃空腸吻合術（開放或腹腔鏡）± J-tube，或考慮腸道支架；體能差 → 腸道支架、餵食空腸造廔。<b>體能差者尤應置放腸道支架</b>。</li>' +
      '<li><b>嚴重腫瘤相關腹痛</b>：腹腔神經叢阻斷（celiac plexus neurolysis，透視導引；無法取得時 CT 導引）；若初次治療未含化放療，可考慮<b>緩和性化放療</b>。</li>' +
      '<li><b>憂鬱、疼痛與營養不良</b>：適時由<b>安寧緩和醫療團隊</b>正式評估。</li>' +
      '<li><b>胰臟功能不全</b>（消化酵素分泌不足）：<b>胰酵素補充</b>。</li>' +
      '<li><b>血栓栓塞疾病</b>：<b>低分子量肝素優於 warfarin</b>。</li>' +
      '<li><b>緩和性手術</b>最適合預期存活較長者。</li>' +
      '</ul></details>';
  }

  /* ---------- PANC-D：放射治療原則 ---------- */
  function rtHtml(which) {
    var body = '<div class="rx-note"><b>RT 設定</b>：3DCRT 或 IMRT 或 VMAT；仰臥並使用固定裝置；' +
      '呼吸調控與評估（選擇性）— 腫瘤移動 <b>≥ 1cm</b> 者建議。</div>';
    if (which === 'neo') {
      body += rxLine('新輔助／臨界可切除 Neoadjuvant / borderline resectable', 'PANC-D', [
        '於全身性化療<b>之後或之間</b>施行。',
        '<b>目前無標準治療處方</b>。',
        '劑量分次（選擇性）：<b>36 Gy／2.4 Gy 分次</b>；或 <b>45–54 Gy／1.8–2.2 Gy 分次</b>；或 <b>40 Gy／10 分次</b>。每日一次、每週 5 天。',
        '<b>標的體積</b>：原發腫瘤。'
      ]);
    } else if (which === 'la') {
      body += rxLine('不可切除／局部晚期 Unresectable / locally advanced', 'PANC-D', [
        '於全身性化療<b>之後或之間</b>施行。',
        '劑量分次：<b>1.8～2.5 Gy／分次</b>，每日一次、每週 5 天；合併或不合併同步化療之<b>最高累積總劑量 ≥ 45～60 Gy</b>。',
        '<b>SBRT</b>：目前無標準治療處方；<b>3 分次（總劑量 30–45 Gy）</b>或 <b>5 分次（25–45 Gy）</b>；<b>不合併同步化療</b>。',
        '<b>標的體積</b>：原發腫瘤＋臨床陽性淋巴結。選擇性淋巴結照射（optional）— 胰頭病灶：胰十二指腸、胰上、腹腔淋巴結、肝門淋巴結與整段十二指腸環；胰體／尾病灶：胰十二指腸、肝門、外側胰上、脾門淋巴結。'
      ]);
    } else { // post-op
      body += rxLine('術後 Postoperative', 'PANC-D', [
        '於全身性化療<b>之後或之間</b>施行。',
        '劑量分次：<b>1.8～2.2 Gy／分次</b>，每日一次、每週 5 天；<b>45–46 Gy</b>，可再對肉眼病灶加以 <b>5–9 Gy boost</b>。',
        '<b>標的體積</b>：GTV（若有殘存腫瘤）— 殘存腫瘤；環周腫瘤床、手術吻合處、病理陽性淋巴結與鄰近淋巴引流區。'
      ]);
    }
    return '<details class="kps-details"><summary>放射治療原則 Principles of Radiation Therapy（PANC-D）▸</summary>' + body + '</details>';
  }

  /* ---------- PANC-E：化學治療原則 ---------- */
  var chemoNote = 'PANC-E（Principles of chemotherapy）：全身性治療用於新輔助、輔助、局部晚期不可切除與轉移情境；' +
    '治療目標應於開始前與病人討論，並<b>強烈鼓勵參加臨床試驗</b>；接受化療者須密切追蹤。';

  /* 轉移性／局部晚期之全身治療選單（PANC-E 1 of 4） */
  function systemicPanel(ps) {
    var h = '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">PANC-E · 全身性治療處方（Metastatic 段落，局部晚期亦援用）</div>' +
      '<div class="rx-def"><b>本指引之處方一律並列，未指定「首選」單一處方；' +
      '<span class="rx">Clinical trial</span> 於各線別均列為 preferred。</b></div>';

    if (ps !== 'poor') {
      h += rxLine('可接受之單方 Acceptable monotherapy', '', [
        '<span class="drug">Gemcitabine</span> <b>800–1000 mg/m²</b>，靜脈輸注 30 分鐘，每週一次連續 3 週，每 28 天為一週期。',
        '<b>固定劑量率 gemcitabine</b>（<span class="drug">fixed-dose rate</span>，<b>10 mg/m²/min</b>）可取代標準輸注法。',
        '<span class="drug">Capecitabine</span> 或 <span class="drug">S-1</span>。'
      ]);
      h += rxLine('可接受之合併處方 Acceptable combinations', '限體能狀態良好者 for good performance status', [
        '<span class="rx">Gemcitabine + erlotinib</span>',
        '<span class="rx">FOLFIRINOX</span>',
        '<span class="rx">Gemcitabine + fluoropyrimidine</span>（如 <span class="drug">capecitabine</span>、<span class="drug">S-1</span> 或 <span class="drug">5-FU</span>）',
        '<span class="rx">Gemcitabine + cisplatin</span>　<b>（尤其用於可能之遺傳性癌症 especially for possible hereditary cancers）</b>',
        '<span class="rx">GTX</span>（<span class="drug">gemcitabine</span> + <span class="drug">docetaxel</span> + <span class="drug">capecitabine</span>）',
        '<span class="rx">Gemcitabine + nab-paclitaxel</span>',
        '<span class="rx">Fluoropyrimidine + oxaliplatin</span>（<span class="drug">capecitabine</span> 或 <span class="drug">5-FU</span> + <span class="drug">oxaliplatin</span>）',
        '<span class="rx">NALIRIFOX</span>　<b>（本次改版新增）</b>：<span class="drug">liposomal irinotecan</span> <b>50 mg/m²</b>、' +
        '<span class="drug">oxaliplatin</span> <b>60 mg/m²</b>、<span class="drug">leucovorin</span> <b>400 mg/m²</b>、' +
        '<span class="drug">fluorouracil</span> <b>2400 mg/m²</b>（依序給予，以連續靜脈輸注 <b>46 小時</b>），於 <b>28 天週期之第 1 與第 15 天</b>給藥。'
      ]);
    } else {
      h += rxLine('體能狀態不佳 Poor performance status', 'PANC-8／PANC-9', [
        '<span class="drug">Gemcitabine</span>；',
        '<b>或</b> 先前已接受 gemcitabine 為基礎治療者 → <b>fluoropyrimidine 為基礎之化療</b>（<span class="drug">capecitabine</span>／<span class="drug">5-FU</span>）；',
        '<b>或</b> <b>最佳支持治療</b>（best supportive care，<b>含安寧療護</b>）。'
      ]);
    }

    h += rxLine('二線 Second-line', '先前未用過 gemcitabine 者，二線可用 gemcitabine', [
      '<span class="drug">Capecitabine</span>',
      '<span class="rx">Fluoropyrimidine + oxaliplatin</span>（<span class="drug">capecitabine</span> 或 <span class="drug">5-FU</span> + <span class="drug">oxaliplatin</span>）',
      '<span class="rx">Nanoliposomal irinotecan + 5-FU/LV</span>　<b>（gemcitabine 失敗後）</b>',
      '<span class="rx">Clinical trial</span>。'
    ]);

    h += '<div class="rx-warn"><b>⚠ 本指引未收錄 <span class="drug">olaparib</span>／PARP 抑制劑之 gBRCA 維持治療</b>' +
      '（POLO trial，Golan T et al. NEJM 2019）。全文亦無 olaparib／PARP／BRCA／germline 之記載；' +
      'PANC-E 中唯一與遺傳性癌症相關之內容為 <span class="rx">gemcitabine + cisplatin</span>' +
      '「especially for possible hereditary cancers」。此處保留提示僅為臨床完整性，' +
      '<b>屬本院指引範圍以外之選項</b>，使用前請依院內流程確認。</div>';

    h += '</div>';
    return h;
  }

  /* 救援治療（PANC-8／PANC-9 SALVAGE THERAPY） */
  function salvagePanel(where) {
    var items = [
      '<span class="rx">Clinical trial</span>（<b>preferred</b>）；',
      '<b>或</b> 先前接受 <b>fluoropyrimidine 為基礎</b>治療者 → <b>gemcitabine 為基礎之治療</b>。'
    ];
    if (where === 'la') {
      items.push('<b>或</b> 先前未曾接受化放療、<b>且原發部位為唯一進展部位</b>者 → <b>化放療</b>（PANC-D）。');
    } else {
      items.push('<b>先前 gemcitabine 治療後進展</b> → <span class="rx">Nanoliposomal irinotecan + 5-FU/leucovorin</span>（PANC-9 圖示箭頭所指）。');
    }
    items.push('<b>體能狀態轉差</b> → <b>最佳支持治療</b>（best supportive care）' +
      (where === 'la' ? '。' : '<b>或臨床試驗</b>。'));
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">' + (where === 'la' ? 'PANC-8' : 'PANC-9') + ' · 救援治療 Salvage therapy</div>' +
      '<div class="rx-def"><b>註 r</b>：救援治療<b>最適合保有良好體能狀態者</b>。</div>' +
      rxLine('救援治療 Salvage', '', items) +
      '</div>';
  }

  /* 輔助治療選單（PANC-6 ＋ PANC-E 2 of 4） */
  function adjuvantPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">PANC-6 ＋ PANC-E · 術後輔助治療 Post-operative adjuvant treatment</div>' +
      '<div class="rx-def"><b>本指引<u>未指定首選處方</u></b>：PANC-6 將下列選項以「or」<b>並列</b>，' +
      '且以 <span class="rx">Clinical trial preferred</span> 冠於最前。</div>' +
      rxLine('PANC-6 流程圖所列', '依序以 or 並列', [
        '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
        '<b>或</b> 全身性 <span class="drug">gemcitabine</span> 或 <span class="rx">5-FU/leucovorin</span>，' +
        '於<b>化放療之前或之後</b>給予（化放療以 fluoropyrimidine 或 gemcitabine 為基礎）；',
        '<b>或</b> <b>單獨化療</b>：<span class="drug">Gemcitabine</span>　或　<span class="rx">5-FU/leucovorin</span>　或　' +
        '<span class="drug">Capecitabine</span>　或　<span class="drug">TS-1</span>。'
      ]) +
      rxLine('PANC-E（2 of 4）Adjuvant 所列', '同為並列，無首選', [
        '<span class="drug">Gemcitabine</span>',
        '<span class="rx">5-FU/leucovorin</span>',
        '<b>gemcitabine 為基礎之治療常與 5-FU 為基礎之化放療<u>依序併用</u></b>',
        '<b>化放療前後之</b> <span class="drug">5-FU</span> 或 <span class="drug">gemcitabine</span>',
        '<span class="drug">S-1</span>',
        '<span class="rx">Gemcitabine / capecitabine</span>',
        '<span class="rx">FOLFIRINOX</span>',
        '<b>輔助治療後復發者</b>：先前用 fluoropyrimidine 為基礎者 → <span class="drug">gemcitabine</span> 或 gemcitabine 為基礎之治療；' +
        '先前用 gemcitabine 為基礎者 → fluoropyrimidine 為基礎之治療。'
      ]) +
      '<div class="rx-warn"><b>⚠ 本指引未將 <span class="rx">(m)FOLFIRINOX</span> 列為輔助治療首選</b>：' +
      'PANC-6 與 PANC-E 皆為<b>並列選單</b>；<span class="rx">FOLFIRINOX</span> 僅為 PANC-E 清單之一項' +
      '（且全文使用 <b>FOLFIRINOX</b>，未出現 <b>mFOLFIRINOX</b> 字樣）。PRODIGE 24（Conroy 2018）雖列於 PANC-E 參考文獻（#16），' +
      '但流程圖未據以指定首選處方。</div>' +
      '<div class="rx-def"><b>時機（PANC-6 註 k）</b>：<b>已接受新輔助化放療或化療者，術後為追加化療之候選人</b>；' +
      '輔助治療應給予<b>未曾接受新輔助化療</b>且<b>已自手術充分恢復</b>者，並於<b>術後 4–8 週內開始</b>。' +
      '若全身性化療先於化放療，<b>每一治療模式結束後應以 CT 重新分期</b>。</div>' +
      rtHtml('post') +
      '</div>';
  }

  /* ---------- 版面 HTML ---------- */
  function pancPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院胰臟癌診療指引 版次 11（2026/06/16）</b>（NTUH，PANC-1～PANC-E）之互動決策流程。' +
      '可切除性判定依 <b>PANC-B 之 M. D. Anderson criteria</b>。逐步點選以取得對應建議處置、藥物療程與追蹤方式。' +
      '<b>本指引各線別處方多為並列選單並以臨床試驗為 preferred，未指定單一首選。</b></p>';
    h += '<div class="onc-path" id="pcPath">';

    // Step 1 — 疾病範圍
    h += step('pc_s1', '1', '疾病範圍與初始情境（PANC-1／PANC-2／PANC-10）',
      opt('ext', 'res', '可切除 Resectable', '無轉移；符合 PANC-B 可切除準則（PANC-3）') +
      opt('ext', 'bord', '臨界可切除 Borderline resectable', '無轉移（PANC-4／PANC-5）') +
      opt('ext', 'la', '局部晚期不可切除 Locally advanced unresectable', '無遠處轉移（PANC-7／PANC-8）') +
      opt('ext', 'meta', '轉移性 Metastatic disease', '影像或理學檢查發現轉移（PANC-1 → PANC-9）') +
      opt('ext', 'rec', '切除後復發 Recurrence after resection', '（PANC-10）'),
      cbx('初始檢查 WORK UP（PANC-1／PANC-2）', '★ 為關鍵項目', [
        cb('★', '胰臟 protocol CT 或 MRI（PANC-A）'),
        cb('★', '多專科團隊會診 Multidisciplinary review'),
        cb('', '考慮內視鏡超音波 EUS'),
        cb('', '肝功能檢查 Liver function tests'),
        cb('', '胸部影像 Chest image'),
        cb('', '術前 CA 19-9、CEA'),
        cb('轉移時', '轉移部位＋原發部位之抽吸／切片確認（若無法自轉移部位取得，應自原發部位切片）')
      ]) +
      cbx('黃疸之處置（PANC-2）', '', [
        cb('無黃疸', '直接測 CA 19-9、CEA → 判定可切除性'),
        cb('有黃疸＋膽管炎或發燒', '<b>暫時性膽道引流＋抗生素覆蓋</b> → 再測 CA 19-9、CEA'),
        cb('有黃疸、無膽管炎與發燒', '直接測術前 CA 19-9、CEA → 判定可切除性')
      ]) +
      resectCriteriaHtml() + stagingPrinciplesHtml());

    // Step 2r — 可切除：剖腹探查結果（PANC-3）
    h += connH('pc_c2r');
    h += step('pc_s2r', '2', '手術探查結果（PANC-3 TREATMENT）',
      opt('surg', 'resected', '手術切除 Surgical resection', '完成切除 → 術後輔助治療與監測（PANC-6）') +
      opt('surg', 'unres_surg', '術中發現不可切除 Unresectable at surgery', '→ 切片確認 → PANC-7／PANC-9'),
      '<div class="note"><b>PANC-3 註 e</b>：可考慮<b>臨床試驗之新輔助治療</b>，惟<b>須有腺癌之切片確認</b>；' +
      '有膽道阻塞者<b>須先達成持久之膽道減壓</b>。<b>註 f</b>：高風險病人或臨床有需要時，' +
      '可考慮<b>分期腹腔鏡（選擇性 optional）</b>（PANC-A #6）。</div>');
    h = h.replace('id="pc_s2r"', 'id="pc_s2r" class="hidden"');

    // Step 2b — 臨界可切除：治療策略（PANC-4 vs PANC-5）
    h += connH('pc_c2b');
    h += step('pc_s2b', '2', '臨界可切除之治療策略（PANC-4／PANC-5）',
      opt('bstrat', 'neo', '計畫新輔助治療 Planned neoadjuvant therapy', 'PANC-4') +
      opt('bstrat', 'planres', '計畫直接切除 Planned resection', 'PANC-5'),
      '<div class="note"><b>PANC-4 註 h</b>：<b>非試驗情境下，推薦特定新輔助處方之證據有限</b>，' +
      '各院對化療與化放療之使用做法不一。<b>切除後高度可能為切緣陽性者，不建議手術</b>。' +
      '<b>註 i</b>：EUS 導引 FNA 優於 CT 導引 FNA（PANC-A #1、#5）。</div>' +
      cbx('新輔助前準備（PANC-4 WORKUP）', '', [
        cb('', '切片或 FNA（PANC-A #1、#5）'),
        cb('', '若有膽道阻塞 → 置放<b>暫時性引流</b>'),
        cb('切片陽性', '→ 新輔助治療'),
        cb('未確認癌症', '→ <b>重複切片</b>；仍未確認（須排除自體免疫胰臟炎 AIP）→ 見 PANC-5 計畫切除／腹腔鏡')
      ]));
    h = h.replace('id="pc_s2b"', 'id="pc_s2b" class="hidden"');

    // Step 3bn — 新輔助後再評估（PANC-4）
    h += connH('pc_c3bn');
    h += step('pc_s3bn', '3', '新輔助治療後重複影像之再評估結果（PANC-4）',
      opt('bneo', 'resected', '手術切除 Surgical resection', '→ 術後輔助治療與監測（PANC-6）') +
      opt('bneo', 'unres_surg', '術中發現不可切除 Unresectable at surgery', '→ 依有無黃疸處置 → PANC-7／PANC-9') +
      opt('bneo', 'prog', '疾病進展致無法手術 Disease progression precluding surgery', '→ 依有無黃疸處置 → PANC-7／PANC-9'),
      '<div class="note"><b>重複影像（PANC-4）</b>：腹部（胰臟 protocol）、骨盆與胸部影像。</div>');
    h = h.replace('id="pc_s3bn"', 'id="pc_s3bn" class="hidden"');

    // Step 3bp — 計畫切除之探查結果（PANC-5）
    h += connH('pc_c3bp');
    h += step('pc_s3bp', '3', '剖腹探查結果（PANC-5 Planned Resection）',
      opt('bres', 'resected', '手術切除 Surgical resection', '→ 術後輔助治療與監測（PANC-6）') +
      opt('bres', 'unres_surg', '術中發現不可切除 Unresectable at surgery', '→ 切片確認 → 依有無黃疸處置'));
    h = h.replace('id="pc_s3bp"', 'id="pc_s3bp" class="hidden"');

    // Step 2la — 局部晚期：體能狀態（PANC-7）
    h += connH('pc_c2la');
    h += step('pc_s2la', '2', '體能狀態 Performance status（PANC-7 → PANC-8）',
      opt('ps', 'good', '體能狀態良好 Good performance status', 'ECOG 0–1、疼痛控制良好、膽道支架通暢、營養攝取足夠') +
      opt('ps', 'poor', '體能狀態不佳 Poor performance status', ''),
      '<div class="note"><b>PANC-7 註 n</b>：良好體能狀態定義為 <b>ECOG 0、1</b>，且<b>疼痛控制良好、膽道支架通暢、營養攝取足夠</b>。<br>' +
      '<b>PANC-7 WORKUP</b>：先前未做者<b>應切片</b>；有黃疸 → <b>膽道引流（首選可擴張金屬支架）</b>' +
      '（<b>註 l</b>：除非已於腹腔鏡或剖腹時完成膽道繞道）。腺癌未確認者 → 重複切片、必要時考慮<b>腹腔鏡導引切片</b>' +
      '（<b>註 m</b>）；確認為<b>其他癌症</b>者 → 依<b>該癌別之台大診療指引</b>治療。</div>');
    h = h.replace('id="pc_s2la"', 'id="pc_s2la" class="hidden"');

    // Step 2m — 轉移：體能狀態（PANC-9）
    h += connH('pc_c2m');
    h += step('pc_s2m', '2', '體能狀態 Performance status（PANC-9）',
      opt('ps', 'good', '體能狀態良好 Good performance status', 'ECOG 0–1、疼痛控制良好、膽道支架通暢、營養攝取足夠') +
      opt('ps', 'poor', '體能狀態不佳 Poor performance status', ''),
      '<div class="note"><b>PANC-9</b>：有黃疸 → <b>膽道引流（首選永久性支架）</b>' +
      '（<b>註 l</b>：除非已於腹腔鏡或剖腹時完成膽道繞道）。<b>註 n</b>：良好體能狀態＝ ECOG 0–1、' +
      '疼痛控制良好、膽道支架通暢、營養攝取足夠。</div>');
    h = h.replace('id="pc_s2m"', 'id="pc_s2m" class="hidden"');

    // Step 2rec — 復發型態（PANC-10）
    h += connH('pc_c2rec');
    h += step('pc_s2rec', '2', '復發型態（PANC-10 RECURRENCE AFTER RESECTION）',
      opt('rsite', 'local', '局部復發 Local recurrence', '') +
      opt('rsite', 'distant', '轉移性疾病（合併或不合併局部復發）', 'Metastatic disease with or without local recurrence'));
    h = h.replace('id="pc_s2rec"', 'id="pc_s2rec" class="hidden"');

    // Step 3rec — 距初次治療完成時間（PANC-10）
    h += connH('pc_c3rec');
    h += step('pc_s3rec', '3', '距初次治療完成之時間（PANC-10）',
      opt('rtime', 'gt6', '&gt; 6 個月', '&gt; 6 mo from completion of primary therapy') +
      opt('rtime', 'lt6', '&lt; 6 個月', '&lt; 6 mo from completion of primary therapy'));
    h = h.replace('id="pc_s3rec"', 'id="pc_s3rec" class="hidden"');

    // Step adj — 術後基準檢查（PANC-6）
    h += connH('pc_cadj');
    h += step('pc_sadj', '4', '術後基準檢查結果（PANC-6 POST-OPERATIVE）',
      opt('adj', 'noevid', '無復發或轉移證據 No evidence of recurrence or metastatic disease', '→ 輔助治療＋監測') +
      opt('adj', 'metafound', '發現轉移性疾病 Metastatic disease', '→ 轉移性疾病之治療（PANC-9）'),
      cbx('術前基準檢查 Baseline pretreatment（PANC-6）', '', [
        cb('', 'CT scan'), cb('', 'CA 19-9'), cb('', 'CEA')
      ]));
    h = h.replace('id="pc_sadj"', 'id="pc_sadj" class="hidden"');

    // 建議處置 + 追蹤
    h += '<div class="flow-rec rec-idle" id="pc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="pc_fu"></div>';

    h += '<div class="flow-reset" style="display:flex; justify-content:flex-end;">' +
      '<button class="btn-reset" onclick="pcReset()">重置</button></div>';
    h += '</div>'; // pcPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function pcSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function pcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function pcClearSel(ids) {
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
    var el = document.getElementById('pc_fu');
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（PANC-6）</div><ul class="fu-list">' +
        '<li><b>每 3 個月追蹤一次，共 2 年；之後每年一次</b>。</li>' +
        '<li>每次追蹤內容：<b>病史與理學檢查（H&amp;P）以評估症狀</b>、<b>CA 19-9 與 CEA</b>、<b>CT scan</b>。</li>' +
        '<li><b>切除後復發</b> → 見「切除後復發（PANC-10）」— 可返回步驟 1 選擇「切除後復發」查詢處置。</li>' +
        '<li>支持治療需求（膽道阻塞、胃出口阻塞、腹痛、胰功能不全、血栓）依 PANC-C 處理。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care（PANC-C）</div><ul class="fu-list">' +
        '<li>治療期間定期評估<b>反應與毒性</b>；接受化療者<b>須密切追蹤</b>（PANC-E）。</li>' +
        '<li>疾病進展 → <b>救援治療</b>（臨床試驗 preferred；見上方 SALVAGE 區塊）。</li>' +
        '<li><b>體能狀態轉差</b> → <b>最佳支持治療</b>（best supportive care，<b>含安寧療護</b>；PANC-8／PANC-9 註 s）。</li>' +
        '<li><b>膽道阻塞</b> → 內視鏡膽道支架（首選）；<b>胃出口阻塞</b> → 胃空腸吻合或腸道支架；' +
        '<b>嚴重腹痛</b> → 腹腔神經叢阻斷；<b>胰功能不全</b> → 胰酵素補充；<b>血栓</b> → 低分子量肝素優於 warfarin（PANC-C）。</li>' +
        '<li><b>憂鬱、疼痛與營養不良</b> → 適時由安寧緩和醫療團隊正式評估（PANC-C）。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }
  function result(cls, title, lines, note, fuType, extra) {
    ulRec('pc_rec', cls, title, lines, note, extra);
    renderFollowup(fuType);
  }
  function idleRec(title) { ulRec('pc_rec', 'rec-idle', title, [], ''); renderFollowup(null); }

  /* 術中不可切除／進展致無法手術之共用處置（PANC-3／PANC-4／PANC-5） */
  function unresAtSurgery(src) {
    var lines = [
      '<b>切片確認</b>：若先前未執行，應行<b>抽吸／切片確認為腺癌</b>（Aspiration / biopsy confirmation of adenocarcinoma）。'
    ];
    if (src === 'panc3') {
      lines.push('<b>依疾病範圍分流</b>：局部晚期不可切除 → <b>PANC-7</b>；轉移性疾病 → <b>PANC-9</b>。' +
        '可返回步驟 1 選擇對應情境查詢處置。');
      lines.push('<b>繞道手術（Bypass surgery）</b>：<b>預估存活 &gt; 6 個月</b>者施行。');
    } else {
      lines.push('<b>無黃疸 No jaundice</b> → 直接依疾病範圍分流：局部晚期不可切除 → <b>PANC-7</b>；轉移性疾病 → <b>PANC-9</b>。');
      lines.push('<b>有黃疸 Jaundice</b> → <b>膽道引流</b>或<b>繞道手術（預估存活 &gt; 6 個月者）</b>' +
        '<b>± 開放式酒精腹腔神經叢阻斷（open ethanol celiac plexus block）</b> → 再依疾病範圍分流至 PANC-7／PANC-9。');
    }
    return lines;
  }

  /* ---------- 主渲染 ---------- */
  function pcRender() {
    var s = pcSt;

    var isRes = s.ext === 'res', isBord = s.ext === 'bord',
      isLa = s.ext === 'la', isMeta = s.ext === 'meta', isRec = s.ext === 'rec';

    pcShow('pc_c2r', isRes); pcShow('pc_s2r', isRes);
    pcShow('pc_c2b', isBord); pcShow('pc_s2b', isBord);

    var showNeo = isBord && s.bstrat === 'neo';
    pcShow('pc_c3bn', showNeo); pcShow('pc_s3bn', showNeo);
    var showPlan = isBord && s.bstrat === 'planres';
    pcShow('pc_c3bp', showPlan); pcShow('pc_s3bp', showPlan);

    pcShow('pc_c2la', isLa); pcShow('pc_s2la', isLa);
    pcShow('pc_c2m', isMeta); pcShow('pc_s2m', isMeta);
    pcShow('pc_c2rec', isRec); pcShow('pc_s2rec', isRec);

    var showRtime = isRec && s.rsite === 'distant';
    pcShow('pc_c3rec', showRtime); pcShow('pc_s3rec', showRtime);

    // 已完成切除 → 術後輔助（PANC-6），三條路徑共用
    var resected = (isRes && s.surg === 'resected') ||
      (showNeo && s.bneo === 'resected') ||
      (showPlan && s.bres === 'resected');
    pcShow('pc_cadj', resected); pcShow('pc_sadj', resected);

    renderRec(resected);
  }

  function renderRec(resected) {
    var s = pcSt;
    if (!s.ext) { idleRec('請選擇步驟 1（疾病範圍與初始情境）'); return; }

    /* ===== 已切除 → 術後輔助（PANC-6），共用分支 ===== */
    if (resected) {
      if (!s.adj) {
        result('rec-elective', '已完成手術切除 → 進行術後基準檢查（PANC-6）', [
          '<b>基準檢查（Baseline pretreatment）</b>：<b>CT scan</b>、<b>CA 19-9</b>、<b>CEA</b>。',
          '請於<b>步驟 4</b> 選擇基準檢查結果以取得輔助治療建議。'
        ], 'PANC-6：Surgical resection → Baseline pretreatment（CT scan／CA19-9／CEA）→ 依有無復發或轉移分流。', null);
        return;
      }
      if (s.adj === 'metafound') {
        result('rec-nonop', '術後基準檢查發現轉移性疾病 → 依轉移性疾病治療（PANC-9）', [
          '<b>不進入輔助治療</b>；直接依<b>轉移性疾病之治療</b>處理（PANC-9）。',
          '請返回<b>步驟 1</b> 選擇「轉移性 Metastatic disease」以取得依體能狀態之完整處方選單與救援治療。'
        ], 'PANC-6：Baseline pretreatment → Metastatic disease → See Metastatic Disease（PANC-9）。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('meta') + palliationHtml());
        return;
      }
      // noevid
      result('rec-elective', '無復發或轉移證據 → 術後輔助治療＋監測（PANC-6）', [
        '<b>本指引未指定首選處方</b>：PANC-6 以 <span class="rx">Clinical trial preferred</span> 冠首，其餘選項<b>以 or 並列</b>（詳見下方選單）。',
        '<b>開始時機</b>：未曾接受新輔助化療且已自手術充分恢復者，<b>術後 4–8 週內</b>開始（PANC-6 註 k）。',
        '<b>已接受新輔助化放療／化療者</b>：為<b>術後追加化療</b>之候選人（PANC-6 註 k）。'
      ], 'PANC-6：No evidence of recurrence or metastatic disease → Clinical trial preferred / systemic gemcitabine or 5-FU/leucovorin before or after chemoradiation / chemotherapy alone（Gemcitabine · 5-FU/leucovorin · Capecitabine · TS-1）→ Surveillance。輔助處方細目見 PANC-E（2 of 4）。',
        'curative', adjuvantPanel());
      return;
    }

    /* ===== A. 可切除（PANC-3）===== */
    if (s.ext === 'res') {
      if (!s.surg) {
        result('rec-elective', '可切除 → 手術切除（必要時先行分期腹腔鏡）', [
          '<b>分期腹腔鏡（選擇性 optional）</b>：<b>高風險病人</b>或臨床有需要時考慮' +
          '（PANC-A #6：尤其<b>胰體、胰尾</b>病灶；臨界可切除、<b>CA 19-9 顯著升高</b>、原發腫瘤大、區域淋巴結大者）。',
          '<b>剖腹手術 Laparotomy</b> → 手術切除（Surgical resection）→ 術後輔助治療與監測（PANC-6）。',
          '<b>手術量（PANC-A #1）</b>：胰臟切除術應在<b>每年執行 15–20 例</b>之院所進行。',
          '<b>切片非必要（PANC-A #5）</b>：手術切除前<b>不需病理證實</b>；臨床高度懷疑時不應因切片未確診而延遲手術。',
          '<b>腹腔沖洗液細胞學陽性等同 M1</b>（PANC-A #7）。',
          '請於<b>步驟 2</b> 選擇手術探查結果。'
        ], 'PANC-3：Resectable → Consider staging laparoscopy in high-risk patients or as clinically indicated（optional）→ Laparotomy → Surgical resection（→ PANC-6）或 Unresectable at surgery。', null);
        return;
      }
      if (s.surg === 'unres_surg') {
        result('rec-nonop', '術中發現不可切除（PANC-3）→ 切片確認 → 分流治療', unresAtSurgery('panc3'),
          'PANC-3：Unresectable at surgery → Aspiration/biopsy confirmation of adenocarcinoma, if not performed previously → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）／Bypass surgery if estimated survival > 6 mo。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
        return;
      }
      return; // resected 已於上方處理
    }

    /* ===== B. 臨界可切除（PANC-4／PANC-5）===== */
    if (s.ext === 'bord') {
      if (!s.bstrat) {
        result('rec-elective', '臨界可切除（PANC-B）→ 選擇治療策略', [
          '<b>PANC-4（計畫新輔助治療）</b>：切片或 FNA；有膽道阻塞者置放<b>暫時性引流</b>；切片陽性 → 新輔助治療。',
          '<b>PANC-5（計畫直接切除）</b>：直接剖腹手術。',
          '<b>證據限制（PANC-4 註 h）</b>：<b>非試驗情境下推薦特定新輔助處方之證據有限</b>，' +
          '各院對化療與化放療之使用做法不一；<b>切除後高度可能為切緣陽性者，不建議手術</b>。',
          '<b>未確認癌症者</b>：重複切片；仍未確認（<b>須排除自體免疫胰臟炎 AIP</b>）→ 見 <b>PANC-5 計畫切除</b>／<b>腹腔鏡</b>。',
          '請於<b>步驟 2</b> 選擇治療策略。'
        ], 'PANC-4：Borderline resectable, no metastases, planned neoadjuvant therapy；PANC-5：Borderline resectable, no metastases, planned resection。', null);
        return;
      }
      if (s.bstrat === 'neo') {
        if (!s.bneo) {
          result('rec-nonop', '臨界可切除 → 新輔助治療 → 重複影像再評估（PANC-4）', [
            '<b>新輔助治療</b>（PANC-4 註 h）：<b>無標準處方</b>；PANC-E 明載「雖<b>證據不足以推薦特定新輔助處方</b>，' +
            '惟<b>多數新輔助處方納入放射治療，且此情境以化放療為首選</b>」。',
            '<b>治療後重複影像</b>：腹部（胰臟 protocol）、骨盆與胸部影像 → 再評估可切除性。',
            '<b>全身性處方</b>可參考下方 PANC-E 選單（新輔助情境無專屬處方清單）。',
            '請於<b>步驟 3</b> 選擇再評估結果。'
          ], 'PANC-4：Biopsy positive → Neoadjuvant therapy → Repeat: Abdominal（pancreas protocol）, pelvic, and chest imaging → Surgical resection／Unresectable at surgery／Disease progression precluding surgery。PANC-E（2 of 4）Neoadjuvant：insufficient evidence to recommend specific neoadjuvant regimens; most incorporate RT and chemoradiation is preferred in this setting。',
            null, rtHtml('neo') + systemicPanel('good'));
          return;
        }
        if (s.bneo === 'unres_surg') {
          result('rec-nonop', '新輔助後術中發現不可切除（PANC-4）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc4'),
            'PANC-4：Unresectable at surgery → No jaundice → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）；Jaundice → Biliary drainage or Bypass surgery（if estimated survival > 6 mo）± open ethanol celiac plexus block。' + '｜' + chemoNote,
            'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
          return;
        }
        if (s.bneo === 'prog') {
          result('rec-nonop', '新輔助後疾病進展致無法手術（PANC-4）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc4'),
            'PANC-4：Disease progression precluding surgery → No jaundice → PANC-7／PANC-9；Jaundice → Biliary drainage or Bypass surgery（if estimated survival > 6 mo）± open ethanol celiac plexus block。' +
            '｜PANC-E（2 of 4）Locally-advanced：<b>已出現轉移而進展者，除非為緩解所需，否則不應接受化放療</b>。',
            'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
          return;
        }
        return; // resected 已於上方處理
      }
      // planres
      if (!s.bres) {
        result('rec-elective', '臨界可切除 → 計畫直接切除（PANC-5）', [
          '<b>剖腹手術 Laparotomy</b> → 手術切除（Surgical resection）→ 術後輔助治療與監測（PANC-6）。',
          '<b>切除後高度可能為切緣陽性者，不建議手術</b>（PANC-4 註 h）。',
          '<b>腹腔沖洗液細胞學陽性等同 M1</b>；若已切除，應依 M1 治療（PANC-A #7）。',
          '請於<b>步驟 3</b> 選擇剖腹探查結果。'
        ], 'PANC-5：Borderline resectable, no metastases, planned resection → Laparotomy → Surgical resection（→ PANC-6）或 Unresectable at surgery。', null);
        return;
      }
      if (s.bres === 'unres_surg') {
        result('rec-nonop', '計畫切除但術中發現不可切除（PANC-5）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc5'),
          'PANC-5：Unresectable at surgery → Aspiration/biopsy confirmation of adenocarcinoma if not performed previously → No jaundice → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）；Jaundice → Biliary drainage or biliary bypass（if estimated survival > 6 mo）± open ethanol celiac plexus block。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
        return;
      }
      return;
    }

    /* ===== C. 局部晚期不可切除（PANC-7／PANC-8）===== */
    if (s.ext === 'la') {
      if (!s.ps) { idleRec('請選擇步驟 2（體能狀態 Performance status）'); return; }
      if (s.ps === 'good') {
        result('rec-nonop', '局部晚期不可切除 · 體能狀態良好 → 全身性治療 ± 鞏固性化放療（PANC-8）', [
          '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
          '<b>或</b> <span class="rx">FOLFIRINOX</span>；<b>或</b> <span class="drug">Gemcitabine</span>；' +
          '<b>或</b> <b>gemcitabine 為基礎之合併化療</b>；<b>或</b> <span class="rx">Gemcitabine + erlotinib</span>；' +
          '<b>或</b> <span class="drug">Capecitabine</span>（PANC-8 各項<b>以 or 並列</b>）。',
          '<b>或</b> 上述治療後，於<b>選擇性病人（局部晚期而無全身轉移者）</b>接續 <b>鞏固性化放療（Consolidation chemoradiation）</b>，' +
          '<b>最好在充分療程之化療之後</b>（PANC-8 註 j、o、p）。',
          '<b>化放療時機（PANC-8 註 p）</b>：<b>化放療應保留給接受全身性化療期間未發生轉移之病人</b>；' +
          '對化放療有顯著反應者<b>可考慮手術切除</b>，惟<b>目前尚無確切證據支持此作法</b>。',
          '<b>註 o</b>：依需要以<b>腹腔鏡</b>評估遠處疾病。',
          '<b>PANC-E</b>：局部晚期依體能狀態，<b>可先以上述全身性治療作為化放療前之初始治療</b>；' +
          '<b>應先評估自毒性恢復後</b>再開始化放療；<b>已出現轉移而進展者，除非為緩解所需，否則不應接受化放療</b>。'
        ], 'PANC-8：Locally advanced unresectable · Good performance status → Clinical trial preferred or FOLFIRINOX or Gemcitabine or Gemcitabine-based combination chemotherapy or Gemcitabine + erlotinib or Capecitabine or followed by Consolidation chemoradiation in selected patients。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + rtHtml('la') + salvagePanel('la') + palliationHtml());
        return;
      }
      result('rec-nonop', '局部晚期不可切除 · 體能狀態不佳 → 減量全身性治療或最佳支持治療（PANC-8）', [
        '<span class="drug">Gemcitabine</span>；',
        '<b>或</b> <b>fluoropyrimidine 為基礎之化療</b>（PANC-8 poor PS 列 <b>Fluoropyrimidine-based chemotherapy</b>）；',
        '<b>或</b> <b>最佳支持治療</b>（best supportive care，<b>含安寧療護</b>；註 g、s）。',
        '<b>體能狀態不佳者不進入鞏固性化放療</b>（PANC-8 圖示：poor PS 直接進入本列選項）。'
      ], 'PANC-8：Locally advanced unresectable · Poor performance status → Gemcitabine or Fluoropyrimidine-based chemotherapy or Best supportive care。' + '｜' + chemoNote,
        'palliative', systemicPanel('poor') + palliationHtml());
      return;
    }

    /* ===== D. 轉移性（PANC-9）===== */
    if (s.ext === 'meta') {
      if (!s.ps) { idleRec('請選擇步驟 2（體能狀態 Performance status）'); return; }
      if (s.ps === 'good') {
        result('rec-nonop', '轉移性疾病 · 體能狀態良好 → 一線全身性治療（PANC-9）', [
          '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
          '<b>或</b> <b>gemcitabine 為基礎之合併治療</b>；<b>或</b> <span class="rx">FOLFIRINOX</span>；' +
          '<b>或</b> <span class="rx">Gemcitabine + erlotinib</span>；<b>或</b> <span class="drug">Gemcitabine</span>；' +
          '<b>或</b> <span class="drug">Capecitabine</span>；<b>或</b> <span class="rx">NALIRIFOX</span>' +
          '（<b>本次改版新增之選項</b>）— PANC-9 各項<b>以 or 並列，未指定首選</b>。',
          '<b>有黃疸</b> → <b>膽道引流（首選永久性支架 permanent stent preferred）</b>，' +
          '除非已於腹腔鏡或剖腹時完成膽道繞道（註 l）。',
          '<b>NALIRIFOX 完整劑量（PANC-E）</b>：<span class="drug">liposomal irinotecan</span> 50 mg/m²、' +
          '<span class="drug">oxaliplatin</span> 60 mg/m²、<span class="drug">leucovorin</span> 400 mg/m²、' +
          '<span class="drug">fluorouracil</span> 2400 mg/m²（依序給予，連續靜脈輸注 46 小時），' +
          '於 <b>28 天週期之第 1 與第 15 天</b>給藥。'
        ], 'PANC-9：Metastatic disease · Good performance status → Clinical trial preferred or Gemcitabine-based combination therapy or FOLFIRINOX or Gemcitabine + erlotinib or Gemcitabine or Capecitabine or Nalirifox（紅字＝本次改版新增）。處方細目見 PANC-E（1 of 4）。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('meta') + palliationHtml());
        return;
      }
      result('rec-nonop', '轉移性疾病 · 體能狀態不佳 → 減量全身性治療或最佳支持治療（PANC-9）', [
        '<span class="drug">Gemcitabine</span>；',
        '<b>或</b> 先前已接受 <b>gemcitabine 為基礎</b>治療者 → <b>fluoropyrimidine 為基礎之化療</b>；',
        '<b>或</b> <b>最佳支持治療</b>（best supportive care，<b>含安寧療護</b>；註 g、s）。',
        '<b>有黃疸</b> → <b>膽道引流（首選永久性支架）</b>（註 l）。'
      ], 'PANC-9：Metastatic disease · Poor performance status → Gemcitabine or Fluoropyrimidine-based chemotherapy if previously treated with gemcitabine-based therapy or Best supportive care。' + '｜' + chemoNote,
        'palliative', systemicPanel('poor') + palliationHtml());
      return;
    }

    /* ===== E. 切除後復發（PANC-10）===== */
    if (s.ext === 'rec') {
      if (!s.rsite) { idleRec('請選擇步驟 2（復發型態）'); return; }
      if (s.rsite === 'local') {
        result('rec-nonop', '切除後<b>局部復發</b>（PANC-10）', [
          '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
          '<b>或</b> 先前未曾執行者 → <b>考慮化放療</b>（Consider chemoradiation，PANC-D）；',
          '<b>或</b> <b>替代之全身性化療</b>（Alternative systemic chemotherapy，PANC-E）；',
          '<b>或</b> <b>最佳支持治療</b>（best supportive care，PANC-C）。'
        ], 'PANC-10：Recurrence after resection → Local recurrence → Clinical trial（preferred）or Consider chemoradiation if not previously done or Alternative systemic chemotherapy or Best supportive care。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + rtHtml('la') + palliationHtml());
        return;
      }
      if (!s.rtime) { idleRec('請選擇步驟 3（距初次治療完成之時間）'); return; }
      if (s.rtime === 'gt6') {
        result('rec-nonop', '切除後轉移性復發（合併或不合併局部復發）· 距初次治療完成 <b>&gt; 6 個月</b>（PANC-10）', [
          '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
          '<b>或</b> <b>沿用先前之全身性化療</b>（Systemic chemotherapy as previously administered，PANC-E）' +
          '— <b>此選項為 &gt; 6 個月組所獨有</b>；',
          '<b>或</b> <b>替代化療</b>（Alternative chemotherapy，PANC-E）；',
          '<b>或</b> <b>最佳支持治療或安寧療護</b>（best supportive care or hospice care）。'
        ], 'PANC-10：Metastatic disease with or without local recurrence → > 6 mo from completion of primary therapy → Clinical trial（preferred）or Systemic chemotherapy as previously administered or Alternative chemotherapy or Best supportive care or hospice care。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('meta') + palliationHtml());
        return;
      }
      result('rec-nonop', '切除後轉移性復發（合併或不合併局部復發）· 距初次治療完成 <b>&lt; 6 個月</b>（PANC-10）', [
        '<span class="rx">Clinical trial</span>　<b>preferred</b>；',
        '<b>或</b> <b>替代化療</b>（Alternative chemotherapy，PANC-E）— <b>&lt; 6 個月組不列「沿用先前化療」</b>；',
        '<b>或</b> <b>最佳支持治療</b>（best supportive care，<b>含安寧療護</b>；註 g、s）。'
      ], 'PANC-10：Metastatic disease with or without local recurrence → < 6 mo from completion of primary therapy → Clinical trial（preferred）or Alternative chemotherapy or Best supportive care。' + '｜' + chemoNote,
        'palliative', systemicPanel('good') + salvagePanel('meta') + palliationHtml());
      return;
    }
  }

  /* ---------- 事件 ---------- */
  function pcPick(key, val, btn) {
    pcSel(btn);
    var s = pcSt;
    if (key === 'ext') {
      s.ext = val;
      s.surg = s.bstrat = s.bneo = s.bres = s.ps = s.rsite = s.rtime = s.adj = null;
      pcClearSel(['pc_s2r', 'pc_s2b', 'pc_s3bn', 'pc_s3bp', 'pc_s2la', 'pc_s2m', 'pc_s2rec', 'pc_s3rec', 'pc_sadj']);
    } else if (key === 'surg') {
      s.surg = val; s.adj = null;
      pcClearSel(['pc_sadj']);
    } else if (key === 'bstrat') {
      s.bstrat = val; s.bneo = s.bres = s.adj = null;
      pcClearSel(['pc_s3bn', 'pc_s3bp', 'pc_sadj']);
    } else if (key === 'bneo') {
      s.bneo = val; s.adj = null;
      pcClearSel(['pc_sadj']);
    } else if (key === 'bres') {
      s.bres = val; s.adj = null;
      pcClearSel(['pc_sadj']);
    } else if (key === 'ps') {
      s.ps = val;
    } else if (key === 'rsite') {
      s.rsite = val; s.rtime = null;
      pcClearSel(['pc_s3rec']);
    } else if (key === 'rtime') {
      s.rtime = val;
    } else if (key === 'adj') {
      s.adj = val;
    }
    pcRender();
  }

  function pcReset() {
    for (var k in pcSt) { if (pcSt.hasOwnProperty(k)) pcSt[k] = null; }
    var root = document.getElementById('pcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('pc_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    pcRender();
  }

  function initPancPathway() { pcReset(); }

  // 匯出
  global.pancPathwayHTML = pancPathwayHTML;
  global.initPancPathway = initPancPathway;
  global.pcPick = pcPick;
  global.pcReset = pcReset;
})(window);
