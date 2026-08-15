/* ============================================================
   胰臟癌治療互動決策流程 Pancreatic Adenocarcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胰臟癌診療指引
   版次 11（2026/06/16 第 87 次癌症醫療委員會修訂通過），PANC-1 ～ PANC-E
   ※ 腺癌部分僅涵蓋胰臟腺癌（pancreatic adenocarcinoma）；
     神經內分泌腫瘤、壺腹癌、遠端膽管癌不在此流程內。
   ※ 可切除性判定依 PANC-B 之 M. D. Anderson criteria（非 NCCN）。

   ※ IPMN／MCN 區塊之資料來源與上述不同——台大指引 v11 全文（PANC-1～PANC-E）
     檢索 IPMN／MCN／cyst／mucinous／intraductal／囊 皆為 0 筆，本院指引未涵蓋囊性腫瘤。
     該區塊改依國際指引：Kyoto 2024（Pancreatology 2024;24:255-270，PMID 38182527）、
     European 2018（Gut 2018;67:789-804，PMID 29574408）、ACG 2018（Am J Gastroenterol
     2018;113:464-479，PMID 29485131）。三者切點不一致，差異處一律於文內標明來源。

   ※ 版面採三段式：術前可得之條件 →〔建議處置〕→ 治療結果 →〔後續處置〕→ 術後病理 →〔輔助治療〕。
     手術／新輔助之結果是「照建議動刀之後」才有的資訊，不可排在建議之前（因果順序）。
     步驟編號由 renumber() 依當下可見的步驟動態計算，故各分支的編號各自連續。
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
    adj: null,    // noevid | metafound             （PANC-6 術後基準檢查）
    /* 以下為囊性腫瘤分支（Kyoto 2024／European 2018／ACG 2018，非台大指引） */
    cyst: null,   // bd | mdmt | mcn | indet        （囊性腫瘤型態）
    crisk: null,  // hrs | wf | none                （IPMN：Kyoto HRS／WF 分層）
    cwf: null,    // aug | only30 | other           （WF 陽性者之加權因子）
    csize: null,  // lt20 | mid | ge30              （無 HRS／WF 者依最大囊腫大小定監測間隔）
    mrisk: null,  // op | obs                       （MCN：European 5.1／5.2 手術指徵）
    cpath: null   // ic | hgd | lgd                 （囊性腫瘤切除標本之病理結果）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="pancPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  /* 步驟方塊內的清單用安靜版：不再畫框（外層 .flow-step 本身已經是一個框），標題降一級。 */
  function plainList(head, items) {
    return '<div class="rx-line plain"><div class="rx-line-h"><span class="rx-h">' + head + '</span></div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  /* ---------- PANC-B：可切除性判定準則（M. D. Anderson criteria）---------- */
  function resectCriteriaHtml() {
    return '<div class="crit-box">' +
      cbx('可切除 Resectable', 'PANC-B · M. D. Anderson criteria', [
        cb('SMA', '無侵犯；腫瘤與動脈間脂肪層正常 No extension; normal fat plane'),
        cb('Celiac axis/hepatic artery', '無侵犯 No extension'),
        cb('SMV／PV', '通暢 Patent')
      ]) +
      cbx('臨界可切除 Borderline resectable', '任一項即屬之', [
        cb('SMA', '腫瘤貼附 ≦ 180°（含周徑一半以下）；動脈周圍條紋狀變化、腫瘤接觸面呈凸面者切除機會較高'),
        cb('Celiac axis/hepatic artery', '總肝動脈短節段被包覆／貼附（多在胃十二指腸動脈起始處）；外科醫師須準備血管切除與間置移植'),
        cb('SMV／PV', '短節段阻塞，但上下游血管條件適合重建；單獨靜脈阻塞而無 SMA 侵犯者少見，且應可於 CT 顯現')
      ]) +
      cbx('局部晚期 Locally advanced', '', [
        cb('SMA', '被包覆 &gt; 180° Encased'),
        cb('Celiac axis/hepatic artery', '被包覆且因延伸至腹腔動脈幹／脾-左胃動脈交界或腹腔動脈幹起始處，技術上無法重建'),
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
        '劑量分次（選擇性；<b>依 PANC-D 8 of 11</b>）：<b>36 Gy／2.4 Gy 分次</b>；或 <b>45–55 Gy／1.8–2.2 Gy 分次</b>；' +
        '或 <b>40 Gy／10 分次</b>；或 <b>33–40 Gy／5–10 分次</b>。每日一次、每週 5 天。',
        '<b>適應症（PANC-D 8 of 11）</b>：① <b>臨界可切除</b>胰臟癌；② <b>可切除但具高風險特徵</b>者 — 腫瘤體積大、CA 19-9 顯著升高、疑似淋巴結侵犯。',
        '<b>標的體積</b>：原發腫瘤。',
        '<b>頁碼落差提醒</b>：PANC-D（1 of 11）之摘要頁寫 45–54 Gy 且未列 33–40 Gy／5–10 分次；本頁採用較詳細的 <b>8 of 11</b>。'
      ]);
    } else if (which === 'la') {
      body += rxLine('不可切除／局部晚期 Unresectable / locally advanced', 'PANC-D', [
        '於全身性化療<b>之後或之間</b>施行。',
        '劑量分次：<b>1.8～2.5 Gy／分次</b>，每日一次、每週 5 天；合併或不合併同步化療之<b>最高累積總劑量 ≥ 45～60 Gy</b>。',
        '<b>適應症（PANC-D 4 of 11）</b>：① <b>醫療上／手術上不可開刀（medically／surgically inoperable）</b>；② 局部晚期無遠處轉移。',
        '<b>SBRT 或低分次放療</b>：目前無標準治療處方；<b>3 分次（總劑量 30～45 Gy）</b>或 <b>5 分次（25～50 Gy）</b>，每日一次；' +
        '另有<b>劑量升階／消融性選項：67.5 Gy／15 分次</b>或 <b>75 Gy／25 分次</b>。',
        '<b>頁碼落差提醒</b>：PANC-D（1 of 11）摘要頁之 5 分次寫 25–45 Gy 且未列消融性劑量；本頁採用較詳細的 <b>4 of 11</b>。',
        '<b>標的體積（依 PANC-D 4 of 11，NRG 2025 atlas）</b>：' +
        '<b>高劑量 CTV／GTV</b> — 原發腫瘤＋臨床陽性淋巴結＋鄰近血管。' +
        '<b>低劑量 CTV</b> — 原發腫瘤之微觀延伸 <b>0.5–1.5 cm</b>、臨床陽性淋巴結之微觀延伸 <b>0.5–1.5 cm</b>。' +
        '<b>PTV</b> — 加 <b>0.3–2 cm</b> 以涵蓋腫瘤／呼吸移動與擺位誤差。',
        '<b>選擇性淋巴結照射（optional）</b>：' +
        '<b>胰頭病灶</b> — 胰十二指腸、胰上、腹腔淋巴結、肝門淋巴結、<b>整段十二指腸環</b>、' +
        '<b>腸繫膜上動脈叢與肝總動脈叢</b>；' +
        '<b>胰體／尾病灶</b> — 胰十二指腸、肝門、外側胰上、脾門淋巴結、<b>腹腔淋巴結</b>。' +
        '（<b>PANC-D 1 of 11 的摘要頁漏列了粗體的幾項</b>，本頁採 4 of 11。）',
        '<b>正常組織限量（PANC-D 10 of 11）</b>：脊髓最大劑量 &lt;45–50 Gy；胃／十二指腸／腸道最大劑量 &lt;54–60 Gy；' +
        '肝臟平均劑量 &lt;30 Gy（根治性）或 ≤25 Gy（術後輔助）；腎臟 V18 &lt;30%。'
      ]);
    } else if (which === 'pall') {
      body += rxLine('緩解性放療 Palliative RT', 'PANC-D（9–10 of 11）', [
        '<b>適應症（optional）</b>：① <b>局部緩解</b> —— <b>阻塞、疼痛或出血</b>；' +
        '② <b>年長者及／或因共病而非根治性治療候選人</b>；③ 由臨床醫師評估之其他緩解情境。',
        '<b>標的體積</b>：<b>依臨床判斷</b>（based on clinical judgement）—— 指引未給固定範圍。',
        '<b>與 PANC-C 的關係</b>：PANC-C 只寫「若尚未做過，可考慮緩解性化放療」；' +
        '<b>單純的緩解性放療（不合併化療）在 PANC-D 9–10 of 11 才有完整適應症</b>。',
        '常與其他緩解手段併用：<b>腹腔神經叢阻斷（celiac plexus neurolysis）</b>控制疼痛、' +
        '<b>膽道或十二指腸支架</b>解除阻塞、胰酵素補充改善吸收不良。'
      ]);
    } else { // post-op
      body += rxLine('術後 Postoperative', 'PANC-D', [
        '於全身性化療<b>之後或之間</b>施行。',
        '<b>適應症（optional；PANC-D 6 of 11）</b>：<b>肉眼殘存病灶（gross residual disease）</b>、' +
        '<b>切緣陽性（positive margin）</b>、<b>病理淋巴結陽性</b>、或<b>由醫師評估之局部區域復發高風險</b>。',
        '劑量分次（<b>依 PANC-D 6 of 11</b>）：<b>1.8～2.2 Gy／分次</b>，每日一次、每週 5 天；' +
        '<b>45–50.4 Gy</b>，可再對肉眼病灶加以 <b>5–9 Gy boost</b>。',
        '<b>標的體積</b>：GTV（若有殘存腫瘤）— 殘存腫瘤；環周腫瘤床、手術吻合處、病理陽性淋巴結與鄰近淋巴引流區。',
        '<b>頁碼落差提醒</b>：PANC-D（1 of 11）摘要頁寫 45–46 Gy；本頁採用較詳細的 <b>6 of 11</b> 之 45–50.4 Gy。'
      ]);
    }
    return '<details class="kps-details"><summary>放射治療原則 Principles of Radiation Therapy（PANC-D）▸</summary>' + body + '</details>';
  }

  /* ---------- PANC-E：化學治療原則 ---------- */
  var chemoNote = 'PANC-E（Principles of chemotherapy）：全身性治療用於新輔助、輔助、局部晚期不可切除與轉移情境；' +
    '治療目標應於開始前與病人討論，並<b>強烈鼓勵參加臨床試驗</b>；接受化療者須密切追蹤。';

  /* 轉移性／局部晚期之全身治療選單（PANC-E 1 of 4） */
  function systemicPanel(ps, where) {
    var h = '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">全身性治療處方（Metastatic 段落，局部晚期亦援用）<span class="rx-panel-src">PANC-E</span></div>' +
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

    h += rxLine('二線 Second-line', (where === 'la'
      ? 'PANC-8 之體能不佳列為無條件三選一；以下二線清單取自 PANC-9'
      : '先前未用過 gemcitabine 者，二線可用 gemcitabine'), [
      '<span class="drug">Capecitabine</span>',
      '<span class="rx">Fluoropyrimidine + oxaliplatin</span>（<span class="drug">capecitabine</span> 或 <span class="drug">5-FU</span> + <span class="drug">oxaliplatin</span>）',
      '<span class="rx">Nanoliposomal irinotecan + 5-FU/LV</span>　<b>（gemcitabine 失敗後）</b>',
      '<span class="rx">Clinical trial</span>。'
    ]);

    h += rxLine('毒性與減量 Toxicity &amp; dose modification', 'PANC-E：接受化療者須密切追蹤', [
      '<b><span class="rx">FOLFIRINOX</span></b>：最常見的是<b>周邊神經病變、腹瀉、嗜中性球低下</b>。' +
      '常用的降階順序是<b>先省略 bolus 5-FU</b>、再<b>下修 irinotecan 或 oxaliplatin</b>' +
      '（即所謂 modified FOLFIRINOX），最後才考慮改為 gemcitabine 為基礎之處方。',
      '<b><span class="rx">Gemcitabine + nab-paclitaxel</span></b>：最常見的是<b>血球低下與神經病變</b>。' +
      '常用做法是<b>改為 3 週給 2 次或每 3 週一次</b>，再不行則改<b>單方 gemcitabine</b>。',
      '<b>降階不等於放棄</b>：只有在體能狀態實際轉差（而非單次檢驗異常）時，才走「最佳支持治療」那一條。' +
      '<b>以上為腫瘤內科實務作法，PANC-E 只寫「接受化療者須密切追蹤」，未逐條規範減量方式。</b>'
    ]);

    h += '<div class="rx-warn"><b>⚠ 本指引未收錄之選項（列出僅為臨床完整性，均屬本院指引範圍以外）</b><br>' +
      '<b>① <span class="drug">olaparib</span>／PARP 抑制劑之 gBRCA 維持治療</b>（POLO trial，Golan T et al. NEJM 2019）：' +
      '指引全文無 olaparib／PARP／BRCA／germline 之記載；PANC-E 中唯一與遺傳性癌症相關之內容為 ' +
      '<span class="rx">gemcitabine + cisplatin</span>「especially for possible hereditary cancers」。' +
      '<b>台灣健保 9.85 之四類適應症亦無胰臟癌，POLO 式用法不給付。</b><br>' +
      '<b>② <span class="drug">daraxonrasib</span>（pan-RAS(ON) 抑制劑）</b>：' +
      'RASolute 302 第三期試驗（O\'Reilly EM et al. NEJM 2026;395:325-337）收<b>先前治療過的轉移性胰臟腺癌</b>，' +
      '<b>中位整體存活 13.2 vs 6.6 個月（HR 0.40）、中位無惡化存活 7.3 vs 3.5 個月（HR 0.45）</b>，' +
      '相對於研究者選擇之化療。<b>需 KRAS G12 基因型</b>（試驗中 91.8% 為 RAS G12 突變）。' +
      '<b>台灣之可及性與給付須先確認。</b><br>' +
      '<b>③ 泛癌別標記</b>：<span class="drug">larotrectinib</span>（NTRK 融合）在台灣<b>有</b>健保條款（9.95），' +
      '但胰臟癌限「至少一次全身性治療失敗後又惡化」；<b>MSI-H／dMMR 之 pembrolizumab 在台灣不涵蓋胰臟癌</b>。</div>';

    h += pancNhiPanel();
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
      '<div class="rx-panel-h">救援治療 Salvage therapy<span class="rx-panel-src">' + (where === 'la' ? 'PANC-8' : 'PANC-9') + '</span></div>' +
      '<div class="rx-def"><b>註 r</b>：救援治療<b>最適合保有良好體能狀態者</b>。</div>' +
      rxLine('救援治療 Salvage', '', items) +
      '</div>';
  }

  /* 健保給付（第 9 節現行條文，查詢日 2026-08-16）。
     胰臟癌這一頁的瓶頸多半不是「該不該給」，而是「開不開得出來」。 */
  function pancNhiPanel() {
    return '<details class="rx-more"><summary>健保給付與可及性（查詢日 2026-08-16）▸</summary><div class="rx-note">' +
      '<ul class="rx-items">' +
      '<li><b><span class="drug">gemcitabine</span>（9.4）</b>：胰臟癌明列於適應症，<b>不分線別與期別</b>、無事前審查、無療程上限。' +
      '（單一品項 Gemmis 另限「晚期或無法手術切除」。）</li>' +
      '<li><b><span class="drug">nab-paclitaxel</span>（Abraxane，9.5.2）</b>：條文只有一句 ——' +
      '「<b>限併用 gemcitabine，做為轉移性胰腺癌患者之第一線治療</b>」。' +
      '也就是三個條件同時成立：<b>轉移性、第一線、必須與 gemcitabine 併用</b>。' +
      '⚠ <b>「局部晚期無法切除」不在文字範圍內</b>；一般 paclitaxel 注射劑（9.5.1）完全沒有胰臟癌適應症，不可互相援引。</li>' +
      '<li><b><span class="drug">liposomal irinotecan</span>（Onivyde，9.12.2）</b>：<b>兩條並存</b> ——' +
      '① 與 5-FU／leucovorin 併用於<b>gemcitabine 治療後復發或惡化之轉移性胰腺癌</b>（107/8/1）；' +
      '② <b>NALIRIFOX（與 oxaliplatin、5-FU、leucovorin 併用）作為轉移性胰腺癌第一線，已於 2025-12-01 納入給付</b>（114/12/1 新增）。' +
      '兩條<b>均須事前審查</b>，且均限「<b>轉移性</b>」。</li>' +
      '<li><b><span class="drug">oxaliplatin</span>（9.10 第 3 點）</b>：' +
      '「與 5-FU、leucovorin 及 irinotecan 併用（<b>FOLFIRINOX</b>），作為<b>轉移性胰臟癌之第一線</b>治療」。' +
      '⚠ <b>一般劑型 irinotecan 自己的條文（9.12.1）只寫轉移性大腸直腸癌</b>，' +
      'FOLFIRINOX 中 irinotecan 的核付依據落在 oxaliplatin 那一條，' +
      '實務上是否會被以適應症外核刪<b>無法從條文確認</b>，開單前建議先與審查窗口確認。</li>' +
      '<li><b><span class="drug">TS-1</span>（9.46 第 1 點）</b>：' +
      '「治療<b>局部晚期無法手術切除</b>或<b>轉移性</b>胰臟癌病人」—— <b>同時涵蓋兩種情境</b>，未限線別、不需事前審查。' +
      '⚠ 條文<b>未涵蓋術後輔助</b>（JASPAC-01 式用法），輔助情境是否適格無法從條文確認。</li>' +
      '<li><b><span class="drug">5-FU</span>／<span class="drug">leucovorin</span></b>：無個別給付規定條號，' +
      '依藥證適應症申報；但仍受其所屬處方（9.10、9.12.2）之條文連帶約束。</li>' +
      '<li><b>不給付於胰臟癌者</b>：' +
      '<span class="drug">capecitabine</span>（9.17 全文<b>沒有胰臟癌</b> —— 所以 <b>GemCap 與 ESPAC-4 式的術後輔助 gemcitabine + capecitabine，' +
      'capecitabine 那一半沒有給付依據</b>）；' +
      '<span class="drug">erlotinib</span>（9.29 只有非小細胞肺癌）；' +
      '<span class="drug">olaparib</span>（9.85 四類適應症<b>皆無胰臟癌</b> —— <b>POLO 式的 gBRCA 維持治療不給付</b>）；' +
      '<span class="drug">pembrolizumab</span>（9.69 <b>無胰臟癌、也無泛癌別 MSI-H 條款</b>；' +
      '台灣的 MSI-H 只在大腸直腸癌與子宮內膜癌各自成條）；' +
      '<span class="drug">entrectinib</span>（9.93 只給付 ROS-1 陽性非小細胞肺癌）。</li>' +
      '<li><b><span class="drug">larotrectinib</span>（9.95）是台灣少數的泛癌別條款</b>：' +
      '需 <b>NTRK 基因融合</b>、為轉移性或切除將造成嚴重病症、且無合適替代治療；' +
      '胰臟癌另限「<b>先前至少一次全身性治療失敗後又惡化</b>」，<b>不能第一線用</b>。' +
      '事前審查每次 12 週，初次申請須檢附 NTRK 1/2/3 融合檢測報告並符合通則十二。' +
      '⚠ 同為 NTRK 抑制劑的 entrectinib <b>不能</b>用於此條。</li>' +
      '</ul>' +
      '<div class="rx-warn"><b>一個反覆出現的分界：「轉移性」vs「局部晚期無法切除」。</b>' +
      'nab-paclitaxel（9.5.2）與 Onivyde（9.12.2）兩條都寫「轉移性」，' +
      '而 TS-1（9.46）與 Gemmis（9.4 第 2 點）明文包含「局部晚期無法手術切除」。' +
      '同一個局部晚期病人，能開的藥因此不同 —— 這是本頁最常卡住的地方。<br>' +
      '<b>給付條文會變，開單前請以健保署當期公告為準</b>；本表查詢日為 2026-08-16。</div>' +
      '</div></details>';
  }

  /* 輔助治療選單（PANC-6 ＋ PANC-E 2 of 4） */
  function adjuvantPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">術後輔助治療 Post-operative adjuvant treatment<span class="rx-panel-src">PANC-6 ＋ PANC-E</span></div>' +
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
      '<div class="rx-def"><b>〔指引外之療效比較，供選藥參考〕</b>指引把選項並列而不排序，但臨床上還是要選一個。' +
      '<b>PRODIGE 24／CCTG PA6</b> 之 5 年結果（Conroy T et al. JAMA Oncol 2022;8:1571-1578，493 人，中位追蹤 69.7 個月）：' +
      '<b>modified FOLFIRINOX vs gemcitabine</b> —— 中位整體存活 <b>53.5 vs 35.5 個月</b>（HR 0.68）、' +
      '<b>5 年整體存活 43.2% vs 31.4%</b>；中位無病存活 21.4 vs 12.8 個月（HR 0.66）。' +
      '<b>療程為 24 週（6 個月）。</b><br>' +
      '<b>體能不佳或無法耐受三合一者</b>：gemcitabine ± capecitabine（ESPAC-4）或 <span class="drug">S-1</span>。' +
      '⚠ <b>台灣健保之 capecitabine 條文（9.17）完全沒有胰臟癌</b>，GemCap 的 capecitabine 那一半沒有給付依據（見下方給付區塊）。</div>' +
      '<div class="rx-def"><b>時機（PANC-6 註 k）</b>：<b>已接受新輔助化放療或化療者，術後為追加化療之候選人</b>；' +
      '輔助治療應給予<b>未曾接受新輔助化療</b>且<b>已自手術充分恢復</b>者，並於<b>術後 4–8 週內開始</b>。' +
      '若全身性化療先於化放療，<b>每一治療模式結束後應以 CT 重新分期</b>。</div>' +
      rtHtml('post') +
      pancNhiPanel() +
      '</div>';
  }

  /* ============================================================
     囊性腫瘤 IPMN／MCN（台大指引未涵蓋，改依國際指引）
     ============================================================ */

  /* 資料來源宣告——放在囊性分支的每一個入口，避免被誤讀成台大院內共識 */
  var cystSrc = '<div class="note"><b>⚠ 本區塊之資料來源與本頁其他區塊不同。</b>' +
    '<b>台大醫院胰臟癌診療指引 版次 11 全文（PANC-1～PANC-E）未涵蓋 IPMN／MCN</b>' +
    '（逐頁檢索 IPMN／MCN／cyst／mucinous／intraductal／囊，皆 0 筆）。以下依<b>國際指引</b>：' +
    '<b>Kyoto 2024</b>（IAP 國際實證指引，僅涵蓋 IPMN）、<b>European 2018</b>（European Study Group，涵蓋 IPMN 與 MCN）、' +
    '<b>ACG 2018</b>。<b>三份指引之切點並不一致</b>，凡有分歧處均於文內標明出處；院內採用前請確認科內共識。</div>';

  function cystTypeHtml() {
    return '<details class="kps-details"><summary>囊性病灶之鑑別與典型特徵 Typical features of pancreatic cysts ▸</summary>' +
      '<ul class="rx-items">' +
      '<li><b>BD-IPMN 分支型</b>：男≒女、好發第 7 個十年；<b>與主胰管相通</b>、可多發；囊液 <b>CEA 高、amylase 高</b>。<b>最常見之偶發囊腫，癌化風險低</b>（ACG Table 2）。</li>' +
      '<li><b>MD-IPMN 主胰管型</b>：主胰管擴張（可為節段性），約半數十二指腸乳頭開口擴大（patulous orifice）；<b>癌化風險高</b>。</li>' +
      '<li><b>MT-IPMN 混合型</b>：少見；<b>癌化風險與 MD-IPMN 相當，適合手術者應切除</b>（European 4.8，GRADE 2C）。</li>' +
      '<li><b>MCN 黏液性囊性腫瘤</b>：<b>幾乎全為女性</b>、第 5–7 個十年；<b>絕大多數位於胰體尾</b>；單房、可有分隔或囊壁鈣化，<b>與主胰管不相通</b>；病理具卵巢型基質。囊液 CEA 高、amylase 不定。</li>' +
      '<li><b>SCN 漿液性囊腺瘤</b>：75% 為女性、第 6 個十年；蜂窩狀微囊；囊液 <b>CEA 低、amylase／lipase 低</b>。<b>本質為良性、特異死亡率近乎零</b>，僅在鄰近器官壓迫症狀時手術（European 6.1、6.4）；診斷明確者追蹤 1 年後改為依症狀追蹤（6.2）。</li>' +
      '<li><b>假性囊腫</b>：有急／慢性胰臟炎病史；囊液 <b>amylase／lipase 高、CEA 低</b>（amylase &lt;250 U/L 敏感度 0.44、特異度 0.98，可排除假性囊腫）。</li>' +
      '<li><b>SPN 實性偽乳頭狀腫瘤</b>：女男比 10:1、多見於 20 多歲 → <b>轉多專科團隊評估手術切除</b>（ACG #12）；術後每年追蹤至少 5 年（ACG #20）。</li>' +
      '<li><b>IOPN</b>：因反覆出現 <b>PRKACA／PRKACB 融合基因</b>，Kyoto 2024 已將其<b>自 IPMN 獨立為另一疾病實體</b>（CQ4-3）。</li>' +
      '<li><b>影像判定型別之準確度有限</b>：MRI／MRCP 判定囊腫型別 40–50%、良惡性 55–76%（ACG #3）。' +
      '<b>MRI／MRCP 為首選</b>（無輻射，最能顯示與主胰管之相通；European 2.2、ACG #2、#13）；' +
      '<b>EUS 為輔助而非取代</b>（European 3.1）。</li>' +
      '<li><b>囊液分子標記</b>：<b>KRAS／GNAS</b> 支持黏液性（IPMN／MCN）；<b>VHL 而無 KRAS／GNAS</b> 對 SCN 敏感度 &gt;99%；' +
      '<b>TP53／SMAD4／CDKN2A／PIK3CA</b> 有助辨識 HGD／侵襲癌（敏感度 9–39%、特異度 92–98%）——Kyoto CQ5-1／CQ5-2（證據 1+、等級 B）。' +
      '<b>囊液 CEA 可區分黏液性與否，但無法判定分化不良程度</b>（ACG #6；Kyoto：達 30% 之 IPMN CEA 偏低，且與分化不良程度無相關）。</li>' +
      '</ul></details>';
  }

  /* Kyoto 2024 Fig.3 之 HRS／WF 全表，並列三份指引之切點差異 */
  function hrsWfHtml() {
    return '<div class="crit-box">' +
      cbx('高風險徵象 High-risk stigmata（HRS）', 'Kyoto 2024 Fig.3 · 任一項即屬之', [
        cb('黃疸', '<b>胰頭部囊性病灶</b>造成之阻塞性黃疸（敏感度 75–83%、特異度 61–65%）'),
        cb('壁結節', '<b>強化壁結節 ≥5mm</b> 或<b>實質成分</b> solid component'),
        cb('主胰管', '<b>MPD ≥10mm</b>'),
        cb('細胞學', '<b>可疑或陽性</b>（若有執行）——「陽性」指 <b>HGD 或腺癌</b>；WHO 分級之可疑者 HGD／IC 絕對風險 91–100%，陽性者 100%')
      ]) +
      cbx('令人擔憂之特徵 Worrisome features（WF）', 'Kyoto 2024 Fig.3 · 臨床 3 項＋影像 7 項', [
        cb('臨床', '<b>急性胰臟炎</b>'),
        cb('臨床', '血清 <b>CA 19-9 升高</b>（&gt;37 U/mL；對 IPMN 併侵襲癌敏感度 41–74%、特異度 85–96%）'),
        cb('臨床', '<b>一年內新發生或急性惡化之糖尿病</b>　<b>← 2024 年新增</b>'),
        cb('影像', '囊腫 <b>≥30mm</b>'),
        cb('影像', '<b>強化壁結節 &lt;5mm</b>'),
        cb('影像', '<b>囊壁增厚／強化</b>'),
        cb('影像', '<b>MPD ≥5mm 且 &lt;10mm</b>'),
        cb('影像', '<b>胰管口徑驟變併遠端胰腺萎縮</b>'),
        cb('影像', '<b>淋巴結腫大</b>'),
        cb('影像', '<b>囊腫生長速率 ≥2.5mm／年</b>　<b>← 2024 年由「≥5mm／2 年」改為此值</b>')
      ]) +
      '<div class="note"><b>壁結節之量測</b>：EUS 以結節<b>「高度」</b>量測，非寬度或最大徑；MDCT／MRI 則以最大徑量測（Kyoto CQ1-2）。' +
      '<b>壁結節與實質成分於術前影像難以明確區分，實務上一律視為高風險發現</b>（CQ1-1）。' +
      '<b>單一項目的預測力有限</b>：壁結節 OR 僅 1.19–3.16、MPD ≥10mm 單獨 OR 僅 1.06–1.76；' +
      '<b>HRS／WF 項目愈多，HGD／侵襲癌之可能性愈高</b>，多項並存時建議借助 nomogram 判斷手術指徵（CQ1-5）。</div>' +
      '<div class="note"><b>三份指引之切點分歧（務必確認採用何者）</b>：' +
      '① <b>主胰管</b>——Kyoto：≥10mm 為 HRS、5–&lt;10mm 為 WF；<b>European：切除門檻為 MPD &gt;5mm</b>（4.10，MD／MT-IPMN 皆然），' +
      '且將 ≥10mm 列為絕對指徵、5–9.9mm 列為相對指徵；ACG：&gt;5mm 即屬需進一步評估之高風險特徵。' +
      '② <b>生長速率</b>——Kyoto <b>≥2.5mm／年</b>；European <b>≥5mm／年</b>；ACG <b>&gt;3mm／年</b>。' +
      '③ <b>用語</b>——Kyoto 刻意<b>維持 HRS／WF 而不改為「絕對／相對手術指徵」</b>，因手術與否還需併同體能、共病、餘命與病人意願判斷（Kyoto 5.2）；' +
      'European 則直接以絕對／相對指徵表述。</div>' +
      '</div>';
  }

  /* 非切除 IPMN 之監測排程（Kyoto Fig.3）＋三指引對照 */
  function cystSurvPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">非切除 IPMN 之監測 Surveillance of non-resected IPMN<span class="rx-panel-src">Kyoto 2024 Fig.3</span></div>' +
      '<div class="rx-def"><b>先做一次 6 個月的短期追蹤</b>，其後依<b>最大囊腫大小</b>決定間隔（CQ2-2，證據 2+、等級 B）。' +
      '影像以 <b>MDCT／MRI-MRCP／EUS 組合</b>，併血液腫瘤標記與 <b>HbA1c</b>，依院內政策安排（Fig.3 註 f）。</div>' +
      rxLine('依大小之監測間隔', 'Kyoto CQ2-1／CQ2-2', [
        '<b>&lt;20mm</b>：6 個月一次<b>共 1 次</b>，其後若穩定<b>每 18 個月</b>。',
        '<b>≥20mm 且 &lt;30mm</b>：6 個月一次<b>共 2 次</b>，其後若穩定<b>每 12 個月</b>。',
        '<b>≥30mm</b>：<b>每 6 個月</b>。',
        '<b>監測中出現進展</b> → <b>回到最上方重新評估 HRS／WF</b>（Fig.3 之回饋箭頭）。'
      ]) +
      rxLine('何時可停止監測', 'Kyoto CQ2-3（證據 2+、等級 C）', [
        '<b>囊腫 &lt;20mm、監測滿 5 年、無形態變化亦無 WF</b> 者，得<b>「停止監測」或「因併發胰管腺癌之可能而繼續監測」</b>——' +
        '<b>兩個選項並列</b>，須併同病人狀況與餘命判斷。',
        '<b>下列族群不適用停止監測之建議</b>：<b>年輕之 BD-IPMN 病人</b>、<b>具家族性或遺傳性風險者</b>（胰癌風險隨時間累積）。',
        '<b>長期監測之必要性仍未定論</b>，取決於地區醫療經濟、併發胰管腺癌之風險與病人年齡、狀況、餘命與意願（Fig.3 註 g）。'
      ]) +
      '<div class="rx-warn"><b>⚠ 監測的目標不只是囊腫本身</b>：IPMN 病人另有<b>併發（concomitant）胰管腺癌</b>之風險，' +
      '且該風險<b>在 5 年監測期後依然持續</b>——監測範圍應涵蓋<b>整個胰腺</b>，不可只盯著囊腫（Kyoto；European 4.1、4.6 同旨）。</div>' +
      '<div class="rx-def"><b>他家指引之排程（供對照，數字不同請勿混用）</b>——' +
      '<b>European 4.2</b>：無手術指徵者<b>第 1 年每 6 個月、其後每年</b>；具<b>相對</b>手術指徵者、高齡或重大共病者<b>每 6 個月</b>；' +
      '<b>只要仍適合手術即應持續追蹤、不建議中斷</b>（4.5）。｜' +
      '<b>ACG #14 Fig.2</b> 依大小：<b>&lt;1cm</b> MRI 每 2 年 ×4 年；<b>1–2cm</b> MRI 每年 ×3 年；' +
      '<b>2–3cm</b> MRI 或 EUS 每 6–12 個月 ×3 年；<b>&gt;3cm</b> 轉多專科團隊，MRI 與 EUS 交替每 6 個月 ×3 年；' +
      '穩定者得延長間隔，<b>不再適合手術即停止監測</b>（#15），<b>&gt;75 歲應重新評估監測之效益</b>（#16）。</div>' +
      '</div>';
  }

  /* 囊性腫瘤之手術原則（Kyoto Fig.5 ＋ European 4.9／4.13～4.18／5.5） */
  function cystOpPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">囊性腫瘤之手術原則 Operative principles<span class="rx-panel-src">Kyoto 2024 Fig.5 ＋ European 2018</span></div>' +
      rxLine('Kyoto Fig.5 手術原則', '六項', [
        '<b>術前充分告知</b>：外科醫師常在<b>不知最終病理</b>的情況下於術中決定切除範圍；若術中發現切緣為 HGD／侵襲癌，<b>切除範圍可能延伸至全胰切除</b>；切緣之 LGD 或小的惰性分支型病灶<b>可能被刻意留在殘胰</b>；因 IPMN 具<b>多發性與跳躍性進展</b>，<b>即使切緣陰性仍需長期術後監測</b>。',
        '<b>懷疑侵襲癌</b> → <b>根治性胰切除併淋巴結廓清</b>。',
        '<b>懷疑非侵襲性病灶</b> → 可行<b>保留器官之胰切除</b>（中段胰切除、保脾遠端胰切除）；BD-IPMN 通常以<b>部分胰切除</b>即可完整移除。',
        '<b>不建議預防性全胰切除</b>（內外分泌代謝後果），惟<b>須事先告知有此可能</b>。',
        '<b>切緣為低度分化不良（LGD）不需追加切除</b>（CQ4-6；European 4.17 同旨）。',
        '<b>輔助或新輔助治療為選項</b>（option）。'
      ]) +
      rxLine('術中冰凍切片 Frozen section', 'Kyoto CQ4-6／European 4.16～4.18', [
        '<b>European 4.16</b>：所有<b>部分胰切除與保留實質之切除</b>皆應對胰臟切緣做冰凍切片（GRADE 1C）。',
        '<b>切緣為侵襲癌</b> → <b>強烈建議延伸切除</b>；<b>切緣為 HGD</b> → <b>應考慮</b>延伸切除；<b>LGD</b> → 不需延伸。',
        '<b>切緣「裸露胰管（denuded duct）」不等於陰性</b>，可能時應考慮追加切除（Kyoto CQ4-6）。',
        '<b>已存在侵襲癌時，切緣之 HGD 未必須追加切除</b>——預後由侵襲成分決定，' +
        '在高齡或衰弱病人保留 HGD 切緣以避免全胰切除可能是合理的（Kyoto）。',
        '<b>冰凍切片無法排除跳躍性病灶</b>（skip lesions，發生率 6–42%）。'
      ]) +
      rxLine('切除範圍', 'European 4.9／4.13～4.14／5.5', [
        '<b>全長主胰管擴張</b> → <b>胰十二指腸切除＋切緣冰凍切片</b>；若遠端胰管另有壁結節或屬胰癌高風險（如家族性胰癌），<b>可考慮全胰切除</b>（4.9）。',
        '<b>胰頭之 IPMN 相關侵襲癌</b>：<b>不建議全胰切除</b>——預後由該癌決定（4.9）。',
        '<b>具絕對手術指徵之 IPMN</b> → <b>腫瘤學切除併標準淋巴結廓清</b>（4.14，GRADE 1C）；' +
        '<b>保留實質之胰切除（PSP）屬非腫瘤學術式</b>，僅適用於惡性機率極低者（4.13）。',
        '<b>MCN</b>（5.5）：具 HGD／癌之影像特徵者 → <b>標準腫瘤學切除＋淋巴結廓清＋脾切除</b>（<b>90–95% 為遠端胰切除</b>，GRADE 1B）；' +
        '無可疑特徵、惡性風險低者 → <b>非腫瘤學切除</b>（保脾遠端胰切除，或 PSP）。',
        '<b>多發性 BD-IPMN</b>（4.15）：<b>每一顆囊腫各自評估</b>；無可疑特徵者<b>可留置觀察</b>，不需為此擴大切除範圍。'
      ]) +
      '<div class="rx-warn"><b>⚠ 不可對符合手術指徵但不適合手術者施行消融</b>：EUS 導引酒精／paclitaxel 注射、射頻或冷凍消融<b>療效與安全性未確立</b>，' +
      '且缺乏判定消融是否完全的可靠標記——<b>不應於臨床試驗（經 IRB 核准）以外施行</b>（European 4.24，GRADE 1C）。</div>' +
      '</div>';
  }

  /* 囊性腫瘤之全身性治療（European 第 8 節） */
  function cystSystemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">囊性腫瘤相關侵襲癌之全身性治療<span class="rx-panel-src">European 2018 §8</span></div>' +
      rxLine('輔助治療 Adjuvant', 'European 8.1', [
        '<b>IPMN 併侵襲癌</b>：<b>不論淋巴結陰性或陽性，均建議輔助全身性化療</b>（GRADE 1C）——其生物行為較具侵襲性；' +
        '惟<b>淋巴結陰性者之建議並無科學證據支持</b>（原文明載）。',
        '<b>MCN 併侵襲癌</b>：輔助治療<b>比照散發性胰臟腺癌</b>（GRADE 2C；無證據可支持或推翻）。',
        '<b>無法指定特定藥物</b>：各研究異質性大；<b>最常用者為 5-FU 與 gemcitabine</b>，同胰臟腺癌之輔助治療（GRADE 2C）。' +
        '處方細目可沿用本頁 <b>PANC-6 ＋ PANC-E</b> 之輔助治療選單。'
      ]) +
      rxLine('新輔助與其他情境', 'European 8.2／8.4／8.5', [
        '<b>局部晚期之 IPMN／MCN 相關侵襲癌</b>：<b>資料不足，無法對新輔助治療做出建議</b>（8.2，GRADE 2C）；' +
        '因兩病相似，<b>可考慮比照胰臟腺癌</b>之作法。',
        '<b>不可切除或復發之惡性囊性腫瘤</b>：<b>可比照胰臟腺癌施行緩和性化療</b>（8.4，GRADE 2C；無證據支持或推翻）。',
        '<b>轉移或局部復發之切除</b>：<b>無研究可據，不建議</b>（8.5，GRADE 2C）。'
      ]) +
      '</div>';
  }

  /* ---------- 版面 HTML ---------- */
  function pancPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院胰臟癌診療指引 版次 11（2026/06/16）</b>（NTUH，PANC-1～PANC-E）之互動決策流程。' +
      '可切除性判定依 <b>PANC-B 之 M. D. Anderson criteria</b>。逐步點選以取得對應建議處置、藥物療程與追蹤方式。' +
      '<b>本指引各線別處方多為並列選單並以臨床試驗為 preferred，未指定單一首選。</b><br>' +
      '<b>囊性腫瘤（IPMN／MCN）不在台大指引範圍內</b>，該分支改依 <b>Kyoto 2024／European 2018／ACG 2018</b>，' +
      '其建議處置區塊均標明所依之國際指引。</p>';
    h += '<div class="onc-path" id="pcPath">';

    // Step 1 — 疾病範圍
    h += step('pc_s1', '1', '疾病範圍與初始情境（PANC-1／PANC-2／PANC-10）',
      opt('ext', 'res', '可切除 Resectable', '無轉移；符合 PANC-B 可切除準則（PANC-3）') +
      opt('ext', 'bord', '臨界可切除 Borderline resectable', '無轉移（PANC-4／PANC-5）') +
      opt('ext', 'la', '局部晚期不可切除 Locally advanced unresectable', '無遠處轉移（PANC-7／PANC-8）') +
      opt('ext', 'meta', '轉移性 Metastatic disease', '影像或理學檢查發現轉移（PANC-1 → PANC-9；見下方註）') +
      opt('ext', 'rec', '切除後復發 Recurrence after resection', '（PANC-10）') +
      opt('ext', 'cyst', '囊性腫瘤 IPMN／MCN（非腺癌）', '台大指引未涵蓋 → 依 Kyoto 2024／European 2018／ACG 2018'),
      plainList('初始檢查 WORK UP', [
        '<b>★</b>　胰臟 protocol CT 或 MRI（PANC-A）',
        '<b>★</b>　多專科團隊會診 Multidisciplinary review',
        '考慮內視鏡超音波 EUS',
        '肝功能檢查 Liver function tests',
        '胸部影像 Chest image',
        '術前 CA 19-9、CEA',
        '<b>轉移時</b>：轉移部位＋原發部位之抽吸／切片確認（若無法自轉移部位取得，應自原發部位切片）'
      ]) +
      cbx('黃疸之處置（PANC-2）', '', [
        cb('無黃疸', '直接測 CA 19-9、CEA → 判定可切除性'),
        cb('有黃疸＋膽管炎或發燒', '<b>暫時性膽道引流＋抗生素覆蓋</b> → 再測 CA 19-9、CEA'),
        cb('有黃疸、無膽管炎與發燒', '直接測術前 CA 19-9、CEA → 判定可切除性')
      ]) +
      '<div class="crit crit-hr" style="margin-top:9px"><div class="crit-h">分子檢測　<span class="crit-zh">本院指引未載，2026 實務</span></div>' +
      '<ul><li><b>不論家族史，所有胰臟腺癌病人都應做胚系（germline）基因套組</b>（BRCA1／BRCA2／PALB2／ATM／CDKN2A／TP53／MLH1）。' +
      '理由是<b>沒有家族史的病人帶有致病性胚系變異的比例仍有 5.2%</b>（Hu C et al. JAMA 2018;319:2401-2409，3,030 例）—— ' +
      '靠家族史篩選會漏掉大部分帶因者。BRCA2（勝算比 6.2）與 ATM（5.7）是最常見的兩個。</li>' +
      '<li><b>轉移性者再加體細胞（somatic）檢測</b>：<b>KRAS 基因型</b>（決定能不能用 pan-RAS 抑制劑）、' +
      '<b>MSI-H／dMMR</b>、<b>NTRK 融合</b>（健保 9.95 之泛癌別條款唯一開給 larotrectinib）。</li>' +
      '<li>結果會影響三件事：<b>白金類化療的選擇</b>（指引 PANC-E 本身就寫 gemcitabine + cisplatin「especially for possible hereditary cancers」）、' +
      '<b>維持治療的資格</b>（POLO 式 olaparib，<b>台灣健保不給付</b>）、以及<b>一等親的連鎖篩檢</b>。</li>' +
      '<li><b>指引全文查無 BRCA／germline／PARP／MSI／NTRK／KRAS 之記載</b>；此段為指引外之實務補充。</li></ul></div>' +
      '<div class="note"><b>兩個看指引時會被絆到的地方</b>：<br>' +
      '① <b>PANC-1 的轉移性分支標註為「See Metastatic Disease (PANC-10)」，但 PANC-10 其實是「切除後復發」</b>；' +
      '轉移性疾病的治療頁是 <b>PANC-9</b>。本流程依實際頁面導向 PANC-9，這是指引的交叉引用誤植，值得回報癌委會。<br>' +
      '② 下方的可切除性判定表只以<b>動脈包覆角度與靜脈是否阻塞</b>分類，' +
      '<b>未涵蓋現代 CT 報告上很常見的「SMV／PV 接觸 &gt;180° 但未阻塞」</b>，也<b>未納入「生物學上的臨界可切除」</b>' +
      '（CA 19-9 顯著升高、疑似區域淋巴結）—— 但後者在 PANC-A #6（分期腹腔鏡）與 PANC-D 8 of 11（新輔助化放療適應症）' +
      '確實會改變處置，判讀時不要只看血管角度。</div>' +
      resectCriteriaHtml() + stagingPrinciplesHtml());

    /* ==========================================================
       第一段：術前即可取得之條件（決定原發治療）
       手術／新輔助之「結果」一律排在建議處置之後，見第二段。
       ========================================================== */

    // Step 2b — 臨界可切除：治療策略（PANC-4 vs PANC-5）
    h += connH('pc_c2b');
    h += step('pc_s2b', '2', '臨界可切除之治療策略（PANC-4／PANC-5）',
      opt('bstrat', 'neo', '計畫新輔助治療 Planned neoadjuvant therapy', 'PANC-4') +
      opt('bstrat', 'planres', '計畫直接切除 Planned resection', 'PANC-5'),
      '<div class="note"><b>PANC-4 註 h</b>：<b>非試驗情境下，推薦特定新輔助處方之證據有限</b>，' +
      '各院對化療與化放療之使用做法不一。<b>切除後高度可能為切緣陽性者，不建議手術</b>。' +
      '<b>註 i</b>：EUS 導引 FNA 優於 CT 導引 FNA（PANC-A #1、#5）。<br>' +
      '<b>〔指引外，2026 實證〕這兩個按鈕在臨床上並不等權</b>：臨界可切除已<b>以新輔助為主流路徑</b>。' +
      '<b>PREOPANC-2</b>（Janssen QP et al. Lancet Oncol 2025;26:1346-1356，375 人）比較兩種新輔助方式，' +
      '<b>FOLFIRINOX 與 gemcitabine 為基礎之化放療存活相當（中位整體存活 21.9 vs 21.3 個月，HR 0.88，p=0.32）</b> —— ' +
      '也就是<b>兩種新輔助都可以接受</b>，但比較的對象已經不是「直接開刀」。' +
      '選擇「計畫直接切除（PANC-5）」時，<b>應說明理由</b>（診斷尚未確立、膽道問題需先處理、無法承受化療等），' +
      '而不是把它當成預設。</div>' +
      cbx('新輔助前準備（PANC-4 WORKUP）', '', [
        cb('', '切片或 FNA（PANC-A #1、#5）'),
        cb('', '若有膽道阻塞 → 置放<b>暫時性引流</b>'),
        cb('切片陽性', '→ 新輔助治療'),
        cb('未確認癌症', '→ <b>重複切片</b>；仍未確認（須排除自體免疫胰臟炎 AIP）→ 見 PANC-5 計畫切除／腹腔鏡')
      ]));
    h = h.replace('id="pc_s2b"', 'id="pc_s2b" class="hidden"');

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

    // Step 2cy — 囊性腫瘤型態（Kyoto／European／ACG）
    h += connH('pc_c2cy');
    h += step('pc_s2cy', '2', '囊性腫瘤之型態 Type of pancreatic cystic neoplasm',
      opt('cyst', 'bd', '分支型 IPMN（BD-IPMN）', '與主胰管相通、MPD &lt;5mm；最常見之偶發囊腫') +
      opt('cyst', 'mdmt', '主胰管型／混合型 IPMN（MD／MT-IPMN）', '主胰管節段性或瀰漫性擴張；癌化風險最高') +
      opt('cyst', 'mcn', '黏液性囊性腫瘤 MCN', '幾乎全為女性、胰體尾、與主胰管不相通、卵巢型基質') +
      opt('cyst', 'indet', '診斷未明之囊性病灶 Indeterminate cyst', '影像判定型別之準確度僅 40–50%'),
      cystSrc +
      cbx('起始評估 Diagnostic work-up', 'Kyoto 5.1／European §2–3／ACG #2、#6', [
        cb('影像', '<b>MRI／MRCP 為首選</b>（無輻射，最能顯示與主胰管之相通）；不能做 MRI 者以<b>胰臟 protocol CT</b> 或 <b>EUS</b> 替代'),
        cb('EUS', '<b>作為其他影像之輔助</b>；有臨床或影像上之可疑特徵時建議執行（European 3.1）'),
        cb('EUS-FNA', '<b>僅在診斷不明、且結果會改變處置時</b>執行（ACG #6；Kyoto 同旨）'),
        cb('細胞學', '<b>影像不足以支持手術時</b>應送囊液細胞學查有無 HGD／癌（ACG #7）'),
        cb('血清', '<b>CA 19-9</b>（疑有惡性轉化時可測；European 1.1）'),
        cb('不適合手術者', '<b>不論囊腫大小，不應再進一步評估偶發之胰臟囊腫</b>（ACG #4，強建議）')
      ]) +
      cystTypeHtml());
    h = h.replace('id="pc_s2cy"', 'id="pc_s2cy" class="hidden"');

    // Step 3cy — IPMN：Kyoto HRS／WF 風險分層
    h += connH('pc_c3cy');
    h += step('pc_s3cy', '3', 'IPMN 之風險分層（Kyoto 2024 Fig.3）',
      opt('crisk', 'hrs', '具高風險徵象 HRS（任一項）', '阻塞性黃疸／強化壁結節 ≥5mm 或實質成分／MPD ≥10mm／細胞學可疑或陽性') +
      opt('crisk', 'wf', '無 HRS，但有令人擔憂之特徵 WF', '臨床 3 項＋影像 7 項，見下方全表') +
      opt('crisk', 'none', '無 HRS 亦無 WF', '→ 依最大囊腫大小定監測間隔'),
      hrsWfHtml());
    h = h.replace('id="pc_s3cy"', 'id="pc_s3cy" class="hidden"');

    // Step 3mcn — MCN：手術指徵（European 5.1／5.2）
    h += connH('pc_c3mcn');
    h += step('pc_s3mcn', '3', 'MCN 之手術指徵（European 2018 §5）',
      opt('mrisk', 'op', '具手術指徵（任一項）', '囊腫 ≥40mm／有症狀／有壁結節等風險特徵（後兩者不論大小）') +
      opt('mrisk', 'obs', '&lt;40mm 且無症狀、無壁結節', '→ 可安全追蹤（European 5.2，GRADE 2C）'),
      '<div class="note"><b>European 5.1（GRADE 1B）</b>：<b>MCN ≥40mm 應手術切除</b>；' +
      '<b>有症狀</b>或<b>具風險特徵（如壁結節）</b>者<b>不論大小</b>亦建議切除。<br>' +
      '<b>30–40mm 者</b>可併同年齡、共病、手術風險與病人意願個別判斷；<b>&lt;30mm 者常難以確立 MCN 之診斷</b>，' +
      '故 <b>&lt;3cm 之 MCN 與 IPMN 採相同監測</b>（5.2）。<br>' +
      '<b>懷孕</b>：曾有 MCN 於孕期快速增大甚至破裂之個案報告，<b>孕期應密切觀察</b>（5.1）。<br>' +
      '<b>Kyoto 2024 不涵蓋 MCN</b>（其僅適用於 IPMN），故本步驟之切點來自 European 2018；' +
      'ACG 則將 MCN 與 IPMN 併同一套高風險特徵處理（#9～#11）。</div>');
    h = h.replace('id="pc_s3mcn"', 'id="pc_s3mcn" class="hidden"');

    // Step 4wf — WF 陽性者之加權因子（Kyoto Fig.3 中段方塊）
    h += connH('pc_c4wf');
    h += step('pc_s4wf', '4', 'WF 陽性者：是否具下列加權因子？（Kyoto Fig.3）',
      opt('cwf', 'aug', '具加權因子（任一項）', '反覆急性胰臟炎影響生活品質／多項 WF 疊加／年輕且適合手術') +
      opt('cwf', 'only30', '無加權因子，且 WF <b>僅為</b>囊腫 ≥30mm', '→ 進入依大小之監測（≥30mm ＝ 每 6 個月）') +
      opt('cwf', 'other', '無加權因子，屬其他 WF', '→ 依估計風險以 1–6 個月間隔監測'),
      '<div class="note"><b>Kyoto Fig.3 三項加權因子</b>：' +
      '① <b>反覆之急性胰臟炎且影響生活品質</b>——約 20% 接受切除之 IPMN 病人有胰臟炎病史，' +
      '<b>大型系列顯示併胰臟炎者之 HGD／IC 發生率與 LGD 相當</b>，故手術理由在於症狀而非癌化風險；' +
      '② <b>多項 WF 疊加而提高 HGD／IC 之可能</b>（可參考 nomogram，註 d）；' +
      '③ <b>年輕且適合手術</b>（註 e：此類因素難以明確定義，須依醫師判斷與病人年齡、狀況、餘命、意願及囊腫位置決定）。<br>' +
      '<b>WF 陽性者於決定前應先以 EUS（含 CE-EUS、必要時 EUS-FNA）進一步評估</b>（Kyoto CQ1-6）。</div>');
    h = h.replace('id="pc_s4wf"', 'id="pc_s4wf" class="hidden"');

    // Step 4sz — 無 HRS／WF 者依最大囊腫大小（Kyoto Fig.3 下段）
    h += connH('pc_c4sz');
    h += step('pc_s4sz', '4', '最大囊腫之大小（決定監測間隔，Kyoto Fig.3）',
      opt('csize', 'lt20', '&lt; 20mm', '6 個月一次共 1 次 → 穩定則每 18 個月') +
      opt('csize', 'mid', '≥ 20mm 且 &lt; 30mm', '6 個月一次共 2 次 → 穩定則每 12 個月') +
      opt('csize', 'ge30', '≥ 30mm', '每 6 個月'),
      '<div class="note"><b>Kyoto CQ2-1</b>：不同大小之 IPMN 生長速率與進展時間不同，<b>監測排程（含期程）應依囊腫大小最佳化</b>。' +
      '<b>監測期間出現進展</b>即<b>回到 HRS／WF 重新評估</b>。</div>');
    h = h.replace('id="pc_s4sz"', 'id="pc_s4sz" class="hidden"');

    /* ---------- 第一段建議：原發治療（不讀取任何治療後才有的資訊）---------- */
    h += '<div class="flow-rec rec-idle" id="pc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';

    /* ==========================================================
       第二段：依上述建議治療之後才會取得的結果
       ========================================================== */

    // Step 2r — 可切除：手術探查結果（PANC-3）
    h += connH('pc_c2r');
    h += step('pc_s2r', '2', '手術探查結果（PANC-3 TREATMENT）',
      opt('surg', 'resected', '手術切除 Surgical resection', '完成切除 → 術後輔助治療與監測（PANC-6）') +
      opt('surg', 'unres_surg', '術中發現不可切除 Unresectable at surgery', '→ 切片確認 → PANC-7／PANC-9'),
      '<div class="note"><b>PANC-3 註 e</b>：可考慮<b>臨床試驗之新輔助治療</b>，惟<b>須有腺癌之切片確認</b>；' +
      '有膽道阻塞者<b>須先達成持久之膽道減壓</b>。<b>註 f</b>：高風險病人或臨床有需要時，' +
      '可考慮<b>分期腹腔鏡（選擇性 optional）</b>（PANC-A #6）。</div>');
    h = h.replace('id="pc_s2r"', 'id="pc_s2r" class="hidden"');

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

    // Step cpath — 囊性腫瘤切除標本之病理結果（Kyoto Fig.5）
    h += connH('pc_ccpath');
    h += step('pc_scpath', '4', '切除標本之病理結果（Kyoto 2024 Fig.5）',
      opt('cpath', 'ic', '侵襲癌 Invasive carcinoma', '→ 監測比照胰臟腺癌；輔助化療見下') +
      opt('cpath', 'hgd', '非侵襲性 · 高度分化不良 HGD', '＝ carcinoma in situ；殘胰風險較高') +
      opt('cpath', 'lgd', '非侵襲性 · 低度分化不良 LGD', '仍需長期監測（多發性與跳躍性進展）'),
      '<div class="note"><b>Kyoto CQ4-1</b>：<b>HGD 可與「carcinoma in situ」互用</b>；' +
      '<b>不建議使用「malignant IPMN」一詞</b>（語意不清）。<br>' +
      '<b>CQ4-7</b>：<b>侵襲成分之大小應與 IPMN 分開量測並分開記載</b>（建議以顯微鏡量測、以 cm 表示），T 分期依該侵襲成分。<br>' +
      '<b>CQ4-2</b>：形態亞型具預後意義——<b>腸型</b>多為 colloid carcinoma（預後優於一般 PDAC）；' +
      '<b>胃型與胰膽管型</b>多為 tubular ductal adenocarcinoma。' +
      '<b>低度分化不良之胃型 IPMN 是同時存在之高度病灶的前驅，不可視為零風險</b>。</div>');
    h = h.replace('id="pc_scpath"', 'id="pc_scpath" class="hidden"');

    /* ---------- 第二段建議：治療結果之後續處置（第一段建議保留不被取代）---------- */
    h += '<div class="flow-rec rec-idle hidden" id="pc_rec2"><div class="rec-label">後續處置 Next step</div>' +
      '<div class="rec-title">請選擇上方步驟</div></div>';

    /* ==========================================================
       第三段：術後基準檢查（腺癌切除後才有）
       ========================================================== */
    h += connH('pc_cadj');
    h += step('pc_sadj', '3', '術後基準檢查結果（PANC-6 POST-OPERATIVE）',
      opt('adj', 'noevid', '無復發或轉移證據 No evidence of recurrence or metastatic disease', '→ 輔助治療＋監測') +
      opt('adj', 'metafound', '發現轉移性疾病 Metastatic disease', '→ 轉移性疾病之治療（PANC-9）'),
      cbx('術前基準檢查 Baseline pretreatment（PANC-6）', '', [
        cb('', 'CT scan'), cb('', 'CA 19-9'), cb('', 'CEA')
      ]) +
      plainList('監測 SURVEILLANCE（PANC-6）', [
        '<b>頻率：每 3 個月一次、共 2 年；之後每年一次</b>（Surveillance every 3 mo for 2 years, then annually）。',
        '<b>每次內容</b>：<b>病史與理學檢查（H&amp;P）以評估症狀</b>、<b>CA 19-9 與 CEA</b>、<b>CT scan</b>——三項並列。',
        '<b>發現復發</b> → 依<b>切除後復發（PANC-10）</b>處理；可返回步驟 1 改選「切除後復發」查詢處置。'
      ]) +
      '<div class="note"><b>PANC-6 註 k（輔助治療之時機）</b>：' +
      '<b>已接受新輔助化放療或化療者，術後為「追加化療」之候選人</b>；' +
      '輔助治療應給予<b>未曾接受新輔助化療</b>且<b>已自手術充分恢復</b>者，並<b>於術後 4–8 週內開始</b>。' +
      '<b>若全身性化療先於化放療，每一治療模式結束後應以 CT 重新分期</b>。</div>');
    h = h.replace('id="pc_sadj"', 'id="pc_sadj" class="hidden"');

    h += '<div class="flow-rec rec-idle hidden" id="pc_rec3"><div class="rec-label">輔助治療 Adjuvant</div>' +
      '<div class="rec-title">請選擇術後基準檢查結果</div></div>';

    h += '<div class="flow-fu hidden" id="pc_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="pancReset()">重置</button></div>';
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
  /* 步驟編號依「當下可見的步驟」動態計算——各分支可見的步驟數不同，
     寫死編號會讓可切除分支出現 1、2、4 這種跳號（使用者實際回報過）。 */
  var STEP_ORDER = ['pc_s1',
    'pc_s2b', 'pc_s2la', 'pc_s2m', 'pc_s2rec', 'pc_s3rec',
    'pc_s2cy', 'pc_s3cy', 'pc_s3mcn', 'pc_s4wf', 'pc_s4sz',
    'pc_s2r', 'pc_s3bn', 'pc_s3bp', 'pc_scpath',
    'pc_sadj'];
  function renumber() {
    var n = 0;
    STEP_ORDER.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.classList.contains('hidden')) return;
      n++;
      var num = el.querySelector('.flow-num');
      if (num) num.textContent = String(n);
    });
  }

  function ulRec(id, cls, title, lines, note, extra, label) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'flow-rec ' + cls;
    var lab = el.querySelector('.rec-label');
    var labelTxt = label || (lab ? lab.textContent : '建議處置 Recommendation');
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (extra || '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }

  /* ---------- 追蹤區塊 ---------- */
  function renderFollowup(type, html) {
    var el = document.getElementById('pc_fu');
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'custom') {
      h = html || '';
    } else if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（PANC-6）</div><ul class="fu-list">' +
        '<li><b>每 3 個月追蹤一次，共 2 年；之後每年一次</b>。</li>' +
        '<li>每次追蹤內容：<b>病史與理學檢查（H&amp;P）以評估症狀</b>、<b>CA 19-9 與 CEA</b>、<b>CT scan</b>。</li>' +
        '<li><b>切除後復發</b> → 見「切除後復發（PANC-10）」— 可返回步驟 1 選擇「切除後復發」查詢處置。</li>' +
        '<li>支持治療需求（膽道阻塞、胃出口阻塞、腹痛、胰功能不全、血栓）依 PANC-C 處理。</li>' +
        '<li><b>術後功能追蹤（指引未列，但每個胰十二指腸切除病人都會遇到）</b>：' +
        '<b>新發生或惡化之糖尿病</b> → 定期驗 HbA1c；' +
        '<b>胰外分泌功能不全</b>（脂肪便、體重下降、脂溶性維生素缺乏）→ <b>胰酵素補充</b>' +
        '（PANC-C 只在緩解情境提到補充酵素，術後同樣需要）；<b>體重與營養評估</b>。' +
        '<b>遠端胰切除併脾臟切除者</b> → 脾切除後之疫苗接種與<b>猛爆性感染（OPSI）衛教</b>' +
        '（本頁的黏液性囊性腫瘤 MCN 建議即為遠端胰切除併脾切除）。</li>' +
        '<li><b>CA 19-9 上升但影像陰性怎麼辦</b>：<b>不要據此就開始治療</b>。' +
        '先確認<b>膽道阻塞或膽管炎</b>是否造成偽性升高（阻塞本身就會拉高 CA 19-9），' +
        '再<b>縮短影像間隔重新評估</b>；仍找不到病灶時可依 PANC-A #3 考慮 PET-CT。' +
        '<b>此段為實務作法，PANC-6 之追蹤欄未規範。</b></li>' +
        '<li><b>年度追蹤沒有明訂的停止時間點</b>；何時降頻或停止，依個別病人餘命與意願討論後決定。</li>' +
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
  /* 第一段（原發治療）建議。fuType 傳 null 者代表尚未到終點，追蹤區塊不顯示。 */
  function result(cls, title, lines, note, fuType, extra, fuHtml) {
    ulRec('pc_rec', cls, title, lines, note, extra, '建議處置 Recommendation');
    renderFollowup(fuType, fuHtml);
  }
  function idleRec(title) {
    ulRec('pc_rec', 'rec-idle', title, [], '', '', '建議處置 Recommendation');
    renderFollowup(null);
  }
  /* 第二段（治療結果之後續處置）。第一段建議一律保留，兩段可同時對照。 */
  function result2(cls, title, lines, note, fuType, extra, label, fuHtml) {
    var el = document.getElementById('pc_rec2');
    if (el) el.classList.remove('hidden');
    ulRec('pc_rec2', cls, title, lines, note, extra, label || '後續處置 Next step');
    if (fuType !== undefined) renderFollowup(fuType, fuHtml);
  }
  /* 第三段（術後基準檢查後之輔助治療）。 */
  function result3(cls, title, lines, note, fuType, extra) {
    var el = document.getElementById('pc_rec3');
    if (el) el.classList.remove('hidden');
    ulRec('pc_rec3', cls, title, lines, note, extra, '輔助治療 Adjuvant');
    renderFollowup(fuType);
  }
  function hideRec(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'flow-rec rec-idle hidden';
  }

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
      isLa = s.ext === 'la', isMeta = s.ext === 'meta', isRec = s.ext === 'rec',
      isCyst = s.ext === 'cyst';

    /* --- 第一段：術前條件 --- */
    pcShow('pc_c2b', isBord); pcShow('pc_s2b', isBord);
    pcShow('pc_c2la', isLa); pcShow('pc_s2la', isLa);
    pcShow('pc_c2m', isMeta); pcShow('pc_s2m', isMeta);
    pcShow('pc_c2rec', isRec); pcShow('pc_s2rec', isRec);

    var showRtime = isRec && s.rsite === 'distant';
    pcShow('pc_c3rec', showRtime); pcShow('pc_s3rec', showRtime);

    pcShow('pc_c2cy', isCyst); pcShow('pc_s2cy', isCyst);
    var isIpmn = isCyst && (s.cyst === 'bd' || s.cyst === 'mdmt');
    var isMcn = isCyst && s.cyst === 'mcn';
    pcShow('pc_c3cy', isIpmn); pcShow('pc_s3cy', isIpmn);
    pcShow('pc_c3mcn', isMcn); pcShow('pc_s3mcn', isMcn);
    var showWf = isIpmn && s.crisk === 'wf';
    pcShow('pc_c4wf', showWf); pcShow('pc_s4wf', showWf);
    // 大小分層只在「無 HRS 亦無 WF」時才是待決問題；
    // 「WF 僅為囊腫 ≥30mm」本身已指定大小，再問一次會讓人選出自相矛盾的答案。
    var showSize = isIpmn && s.crisk === 'none';
    pcShow('pc_c4sz', showSize); pcShow('pc_s4sz', showSize);

    /* --- 第二段：依建議治療之後才有的結果 --- */
    var showNeo = isBord && s.bstrat === 'neo';
    var showPlan = isBord && s.bstrat === 'planres';
    pcShow('pc_c2r', isRes); pcShow('pc_s2r', isRes);
    pcShow('pc_c3bn', showNeo); pcShow('pc_s3bn', showNeo);
    pcShow('pc_c3bp', showPlan); pcShow('pc_s3bp', showPlan);

    // 囊性腫瘤走到手術者，才會有切除標本可判讀
    var cystOp = (isIpmn && (s.crisk === 'hrs' || (showWf && s.cwf === 'aug'))) || (isMcn && s.mrisk === 'op');
    pcShow('pc_ccpath', cystOp); pcShow('pc_scpath', cystOp);

    /* --- 第三段：腺癌切除後之基準檢查 --- */
    var resected = (isRes && s.surg === 'resected') ||
      (showNeo && s.bneo === 'resected') ||
      (showPlan && s.bres === 'resected');
    pcShow('pc_cadj', resected); pcShow('pc_sadj', resected);

    renumber();
    renderRec(resected, cystOp);
  }

  function renderRec(resected, cystOp) {
    var s = pcSt;
    hideRec('pc_rec2'); hideRec('pc_rec3');
    if (!s.ext) { idleRec('請選擇步驟 1（疾病範圍與初始情境）'); return; }

    /* ===== F. 囊性腫瘤 IPMN／MCN（Kyoto 2024／European 2018／ACG 2018）===== */
    if (s.ext === 'cyst') { renderCyst(cystOp); return; }

    /* ===== A. 可切除（PANC-3）===== */
    if (s.ext === 'res') {
      /* 第一段建議恆為「手術切除」，不因術中結果而被取代 */
      result('rec-elective', '可切除 → 手術切除（必要時先行分期腹腔鏡）', [
          '<b>分期腹腔鏡（選擇性 optional）</b>：<b>高風險病人</b>或臨床有需要時考慮' +
          '（PANC-A #6：尤其<b>胰體、胰尾</b>病灶；臨界可切除、<b>CA 19-9 顯著升高</b>、原發腫瘤大、區域淋巴結大者）。',
          '<b>剖腹手術 Laparotomy</b> → 手術切除（Surgical resection）→ 術後輔助治療與監測（PANC-6）。',
          '<b>手術量（PANC-A #1）</b>：胰臟切除術應在<b>每年執行 15–20 例</b>之院所進行。',
          '<b>切片非必要（PANC-A #5）</b>：手術切除前<b>不需病理證實</b>；臨床高度懷疑時不應因切片未確診而延遲手術。',
          '<b>腹腔沖洗液細胞學陽性等同 M1</b>（PANC-A #7）。',
          '<span class="rx-h">兩個在進手術室之前要先問的問題</span>',
          '<b>① 這個病人是不是手術候選人？</b> PANC-1 把整條可切除路徑掛在「<b>Surgical candidate</b>」這個判斷之下。' +
          '若因體能（ECOG 3）、肝硬化、心肺共病、年齡衰弱或病人拒絕而<b>不適合手術</b>，' +
          'PANC-D（4 of 11）之 <b>Definitive Chemoradiation</b> 適應症第一條即為「<b>medically／surgically inoperable disease</b>」——' +
          '此類病人走<b>根治性化放療</b>加 PANC-C 之支持治療，而不是進開刀房。',
          '<b>② 有沒有高風險特徵？</b> PANC-D（8 of 11）之新輔助同步化放療適應症除了臨界可切除之外，' +
          '也包含「<b>可切除但具高風險特徵</b>者：腫瘤體積大、CA 19-9 顯著升高、疑似淋巴結侵犯」。' +
          '符合者可考慮<b>先做新輔助化放療</b>，並依 PANC-A #6 併行分期腹腔鏡 —— ' +
          '不必然直接剖腹。（PANC-3 註 e 之「on clinical trial」是另一條路，非唯一。）',
          '請於<b>下方步驟</b>選擇手術探查結果。'
        ], 'PANC-3：Resectable → Consider staging laparoscopy in high-risk patients or as clinically indicated（optional）→ Laparotomy → Surgical resection（→ PANC-6）或 Unresectable at surgery。', null);
      if (!s.surg) return;
      if (s.surg === 'unres_surg') {
        result2('rec-nonop', '術中發現不可切除（PANC-3）→ 切片確認 → 分流治療', unresAtSurgery('panc3'),
          'PANC-3：Unresectable at surgery → Aspiration/biopsy confirmation of adenocarcinoma, if not performed previously → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）／Bypass surgery if estimated survival > 6 mo。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
        return;
      }
      renderResected();
      return;
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
          '請於<b>上方步驟</b>選擇治療策略。'
        ], 'PANC-4：Borderline resectable, no metastases, planned neoadjuvant therapy；PANC-5：Borderline resectable, no metastases, planned resection。', null);
        return;
      }
      if (s.bstrat === 'neo') {
        result('rec-nonop', '臨界可切除 → 新輔助治療 → 重複影像再評估（PANC-4）', [
          '<b>新輔助治療</b>（PANC-4 註 h）：<b>無標準處方</b>；PANC-E 明載「雖<b>證據不足以推薦特定新輔助處方</b>，' +
          '惟<b>多數新輔助處方納入放射治療，且此情境以化放療為首選</b>」。',
          '<b>治療後重複影像</b>：腹部（胰臟 protocol）、骨盆與胸部影像 → 再評估可切除性。',
          '<span class="rx-h">再評估要看什麼、什麼時候看</span>',
          '<b>時機</b>：完成一段充分療程之後，實務上約 <b>2–4 個月</b>。',
          '<b>判讀依三件事，不是只看影像</b>：' +
          '① <b>影像</b> —— 但要有心理準備：<b>局部縮小常不明顯，血管接觸也未必消退</b>，' +
          '影像「看起來沒變」不等於治療無效；' +
          '② <b>CA 19-9 的趨勢</b> —— 指引自己的參考文獻第 14 篇即為此主題' +
          '（Tzeng CWD et al. HPB 2014;16:430-438，「serum CA 19-9 represents a marker of response to neoadjuvant therapy in ' +
          'patients with borderline resectable pancreatic cancer」）；' +
          '③ <b>體能狀態與症狀</b>。',
          '<b>影像未進展而 CA 19-9 下降者，仍應進行手術探查</b> —— 這是臨界可切除最常被誤判的一格。' +
          '<b>此段之時機與判讀原則為指引外之實務補充</b>，PANC-4 只寫「repeat imaging」。',
          '<b>全身性處方</b>可參考下方 PANC-E 選單（新輔助情境無專屬處方清單）。',
          '請於<b>下方步驟</b>選擇再評估結果。'
        ], 'PANC-4：Biopsy positive → Neoadjuvant therapy → Repeat: Abdominal（pancreas protocol）, pelvic, and chest imaging → Surgical resection／Unresectable at surgery／Disease progression precluding surgery。PANC-E（2 of 4）Neoadjuvant：insufficient evidence to recommend specific neoadjuvant regimens; most incorporate RT and chemoradiation is preferred in this setting。',
          null, rtHtml('neo') + systemicPanel('good'));
        if (!s.bneo) return;
        if (s.bneo === 'unres_surg') {
          result2('rec-nonop', '新輔助後術中發現不可切除（PANC-4）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc4'),
            'PANC-4：Unresectable at surgery → No jaundice → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）；Jaundice → Biliary drainage or Bypass surgery（if estimated survival > 6 mo）± open ethanol celiac plexus block。' + '｜' + chemoNote,
            'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
          return;
        }
        if (s.bneo === 'prog') {
          result2('rec-nonop', '新輔助後疾病進展致無法手術（PANC-4）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc4'),
            'PANC-4：Disease progression precluding surgery → No jaundice → PANC-7／PANC-9；Jaundice → Biliary drainage or Bypass surgery（if estimated survival > 6 mo）± open ethanol celiac plexus block。' +
            '｜PANC-E（2 of 4）Locally-advanced：<b>已出現轉移而進展者，除非為緩解所需，否則不應接受化放療</b>。',
            'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
          return;
        }
        renderResected();
        return;
      }
      // planres
      result('rec-elective', '臨界可切除 → 計畫直接切除（PANC-5）', [
        '<b>剖腹手術 Laparotomy</b> → 手術切除（Surgical resection）→ 術後輔助治療與監測（PANC-6）。',
        '<b>切除後高度可能為切緣陽性者，不建議手術</b>（PANC-4 註 h）。',
        '<b>腹腔沖洗液細胞學陽性等同 M1</b>；若已切除，應依 M1 治療（PANC-A #7）。',
        '請於<b>下方步驟</b>選擇剖腹探查結果。'
      ], 'PANC-5：Borderline resectable, no metastases, planned resection → Laparotomy → Surgical resection（→ PANC-6）或 Unresectable at surgery。', null);
      if (!s.bres) return;
      if (s.bres === 'unres_surg') {
        result2('rec-nonop', '計畫切除但術中發現不可切除（PANC-5）→ 依有無黃疸處置 → 分流', unresAtSurgery('panc5'),
          'PANC-5：Unresectable at surgery → Aspiration/biopsy confirmation of adenocarcinoma if not performed previously → No jaundice → See Locally Advanced Unresectable（PANC-7）／See Metastatic Disease（PANC-9）；Jaundice → Biliary drainage or biliary bypass（if estimated survival > 6 mo）± open ethanol celiac plexus block。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + salvagePanel('la') + palliationHtml());
        return;
      }
      renderResected();
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
      ], 'PANC-8：Locally advanced unresectable · Poor performance status → Gemcitabine or Fluoropyrimidine-based chemotherapy or Best supportive care。' +
        '<b>注意 PANC-8 此列之 fluoropyrimidine 為無條件三選一</b>，不像 PANC-9 附有「先前已接受 gemcitabine 為基礎治療者」的條件。' + '｜' + chemoNote,
        'palliative', systemicPanel('poor', 'la') + rtHtml('pall') + palliationHtml());
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
      ], 'PANC-9：Metastatic disease · Poor performance status → Gemcitabine or Fluoropyrimidine-based chemotherapy <b>if previously treated with gemcitabine-based therapy</b> or Best supportive care。' + '｜' + chemoNote,
        'palliative', systemicPanel('poor', 'meta') + rtHtml('pall') + palliationHtml());
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
          '<b>或</b> <b>最佳支持治療</b>（best supportive care，PANC-C）。',
          '<span class="rx-h">先確定這真的是復發</span>',
          '<b>術後吻合處的影像判讀很難</b>：胰腸吻合處的<b>術後纖維化與狹窄</b>在 CT 上可以長得很像局部復發。' +
          '本頁在囊性腫瘤分支已經標過同樣的陷阱（「監測中新出現之主胰管擴張須釐清是 MD-IPMN 進展，還是胰腸吻合處狹窄」），' +
          '術後復發判讀同理。<b>必要時做切片或以連續影像確認變化趨勢</b>，不要只憑單張 CT 就啟動治療。' +
          'CA 19-9 上升但影像陰性者，先排除膽道阻塞造成的偽性升高。',
          '<span class="rx-h">指引沒有列、但常被問到的兩件事</span>',
          '<b>再切除（re-resection）與局部復發之 SBRT</b>：<b>PANC-10 的選項清單裡都沒有</b>。' +
          '若團隊考慮，屬指引範圍以外，應經多專科團隊個案討論並記錄理由；' +
          '本頁的囊性腫瘤段落亦記載「<b>轉移或局部復發之切除：無研究可據，不建議</b>」（European 8.5，GRADE 2C）。'
        ], 'PANC-10：Recurrence after resection → Local recurrence → Clinical trial（preferred）or Consider chemoradiation if not previously done or Alternative systemic chemotherapy or Best supportive care。' +
          '影像鑑別與再切除／SBRT 之討論為指引外之實務補充。' + '｜' + chemoNote,
          'palliative', systemicPanel('good') + rtHtml('la') + rtHtml('pall') + palliationHtml());
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

  /* 已完成切除之共用後段（PANC-6）：第二段＝進行術後基準檢查，第三段＝輔助治療 */
  function renderResected() {
    var s = pcSt;
    result2('rec-elective', '已完成手術切除 → 進行術後基準檢查（PANC-6）', [
      '<b>基準檢查（Baseline pretreatment）</b>：<b>CT scan</b>、<b>CA 19-9</b>、<b>CEA</b>。',
      '請於<b>下方步驟</b>選擇基準檢查結果以取得輔助治療建議。'
    ], 'PANC-6：Surgical resection → Baseline pretreatment（CT scan／CA19-9／CEA）→ 依有無復發或轉移分流。', null);
    if (!s.adj) return;
    if (s.adj === 'metafound') {
      result3('rec-nonop', '術後基準檢查發現轉移性疾病 → 依轉移性疾病治療（PANC-9）', [
        '<b>不進入輔助治療</b>；直接依<b>轉移性疾病之治療</b>處理（PANC-9）。',
        '請返回<b>步驟 1</b> 選擇「轉移性 Metastatic disease」以取得依體能狀態之完整處方選單與救援治療。'
      ], 'PANC-6：Baseline pretreatment → Metastatic disease → See Metastatic Disease（PANC-9）。' + '｜' + chemoNote,
        'palliative', systemicPanel('good') + salvagePanel('meta') + palliationHtml());
      return;
    }
    result3('rec-elective', '無復發或轉移證據 → 術後輔助治療＋監測（PANC-6）', [
      '<b>本指引未指定首選處方</b>：PANC-6 以 <span class="rx">Clinical trial preferred</span> 冠首，其餘選項<b>以 or 並列</b>（詳見下方選單）。',
      '<b>開始時機</b>：未曾接受新輔助化療且已自手術充分恢復者，<b>術後 4–8 週內</b>開始（PANC-6 註 k）。',
      '<b>已接受新輔助化放療／化療者</b>：為<b>術後追加化療</b>之候選人（PANC-6 註 k）。',
      '<span class="rx-h">先看病理報告：要不要加同步化放療</span>　<span class="rx-sub">PANC-D（6 of 11）</span>',
      '<b>術後同步化放療之適應症（optional）</b>：<b>肉眼殘存病灶</b>、<b>切緣陽性</b>、<b>病理淋巴結陽性</b>、' +
      '或<b>由醫師評估之局部區域復發高風險</b>。符合其一即應與放射腫瘤科討論加入化放療；' +
      '<b>四項皆無（R0、pN0、無高風險）者，維持單純輔助化療即可</b>。',
      '劑量為 <b>45–50.4 Gy</b>（1.8～2.2 Gy／分次），可再對肉眼病灶加 <b>5–9 Gy boost</b>；' +
      '同步化療以 fluoropyrimidine 或 gemcitabine 為基礎。',
      '<b>「切緣陽性」在整份指引裡只出現在這一頁</b> —— 是術後病理拿到手上第一個要對照的條件。'
    ], 'PANC-6：No evidence of recurrence or metastatic disease → Clinical trial preferred / systemic gemcitabine or 5-FU/leucovorin before or after chemoradiation / chemotherapy alone（Gemcitabine · 5-FU/leucovorin · Capecitabine · TS-1）→ Surveillance。輔助處方細目見 PANC-E（2 of 4）。',
      'curative', adjuvantPanel());
  }

  /* ============================================================
     囊性腫瘤分支之建議處置
     來源：Kyoto 2024（IPMN）、European 2018（IPMN＋MCN）、ACG 2018
     ============================================================ */
  var CYST_SRC_NOTE = '本區塊非台大指引內容——台大胰臟癌診療指引 v11 未涵蓋 IPMN／MCN。';

  /* 非切除囊腫之追蹤區塊 */
  function cystFu(kind) {
    var li;
    if (kind === 'postop') {
      li = '<div class="fu-label">術後監測 Post-operative surveillance（Kyoto 2024 Fig.5／CQ3）</div><ul class="fu-list">' +
        '<li><b>切除非侵襲性 IPMN 後，殘胰仍會出現具臨床意義之病灶</b>：5 年風險中位數 <b>10%</b>（範圍 0–21%）——' +
        '術後監測之目的即在<b>於進展為侵襲癌之前及早發現高風險病灶</b>（CQ3-1）。</li>' +
        '<li><b>間隔</b>：無額外風險因子者<b>每年一次影像</b>；<b>具家族性胰癌病史或 HGD 者每 6 個月</b>（CQ3-2、CQ3-4）。' +
        '<b>只要病人仍適合接受後續治療即應持續監測</b>。</li>' +
        '<li><b>應留意之影像變化</b>：<b>實質成分、主胰管擴張、囊性病灶增大</b>（CQ3-3）。' +
        '<b>監測中新出現之主胰管擴張須釐清是 MD-IPMN 進展，還是胰腸吻合處狹窄等其他原因</b>。</li>' +
        '<li><b>方式</b>：理學檢查＋影像（MDCT／MRI-MRCP／EUS）＋血液腫瘤標記與 HbA1c，依院內政策組合（Fig.5 註 c）。</li>' +
        '<li><b>因非侵襲性病灶而接受全胰切除者</b>，若術後 5 年監測期間無事件，<b>IPMN 專屬之監測可停止</b>（Fig.5 註 c）。</li>' +
        '<li><b>European 4.20</b>：<b>IPMN 切除後終身追蹤</b>（只要仍適合且願意再手術）；<b>HGD 或 MD-IPMN 者前 2 年每 6 個月、其後每年</b>；' +
        'LGD 者比照未切除之 IPMN。<b>ACG #18 則認為切除且無癌之 MCN 不需術後監測</b>（強建議）——<b>此處三份指引不一致</b>。</li>' +
        '</ul>';
    } else {
      li = '<div class="fu-label">囊腫監測 Cyst surveillance</div><ul class="fu-list">' +
        '<li><b>影像以 MRI／MRCP 為主</b>（European 4.4、ACG #13）；<b>應盡量固定同一種影像模式</b>，' +
        '以維持大小量測之一致性（ACG Fig.2 註）。</li>' +
        '<li><b>監測中出現 HRS／WF 或形態變化</b> → <b>回到風險分層重新評估</b>（Kyoto Fig.3 回饋箭頭）。</li>' +
        '<li><b>症狀改變應即刻觸發檢查</b>（European 4.2）。</li>' +
        '<li><b>監測範圍涵蓋整個胰腺</b>——IPMN 病人另有併發胰管腺癌之風險，且該風險於 5 年後仍持續。</li>' +
        '<li><b>不再適合手術即停止監測</b>（ACG #15，強建議）；<b>&gt;75 歲宜重新評估監測之效益</b>，76–85 歲採個別化決策（ACG #16）。</li>' +
        '<li><b>IPMN 病人不需為此做常規之胰外腫瘤篩檢</b>（European 4.6，GRADE 1C）。</li>' +
        '<li><b>有胰癌家族史之 IPMN，處置與散發性 IPMN 相同</b>（European 4.22）；<b>器官移植者亦與非移植者相同</b>（4.23，GRADE 1B）。</li>' +
        '</ul>';
    }
    return li;
  }

  function renderCyst(cystOp) {
    var s = pcSt;
    if (!s.cyst) { idleRec('請選擇上方步驟（囊性腫瘤之型態）'); return; }

    /* --- 診斷未明之囊性病灶（European §7） --- */
    if (s.cyst === 'indet') {
      result('rec-nonop', '診斷未明之囊性病灶 → 補齊檢查並依大小監測（European 2018 §7）', [
        '<b>&lt;15mm</b>：<b>橫斷影像或 EUS 擇一即可</b>（7.1）。',
        '<b>≥15mm，或診斷仍不明</b>：<b>橫斷影像與 EUS 兩者皆做</b>，必要時加做 <b>EUS-FNA</b>（7.1）。',
        '<b>監測（7.2）</b>：<b>&lt;15mm 且無惡性風險因子</b> → <b>1 年後複查</b>；<b>穩定 3 年</b>後可延長為<b>每 2 年</b>。' +
        '<b>≥15mm</b> → <b>第 1 年每 6 個月、其後每年</b>。',
        '<b>理由</b>：未定性之囊腫本質上可能為黏液性，故仍需監測；惡性轉化風險隨大小上升。',
        '<b>囊液分子標記</b>可在診斷不明且結果會改變處置時使用：<b>KRAS／GNAS</b> 支持黏液性、' +
        '<b>VHL 而無 KRAS／GNAS</b> 高度支持 SCN（Kyoto CQ5-1，證據 1+、等級 B）。',
        '<b>已確診為假性囊腫或漿液性囊腺瘤等極低惡性風險者，不需治療或進一步評估</b>（ACG #5）。'
      ], 'European 2018 §7.1、7.2；ACG 2018 #5、#6、#8；Kyoto 2024 CQ5-1。' + CYST_SRC_NOTE,
        'custom', '', cystFu('surv'));
      return;
    }

    /* --- MCN（European §5） --- */
    if (s.cyst === 'mcn') {
      if (!s.mrisk) { idleRec('請選擇上方步驟（MCN 之手術指徵）'); return; }
      if (s.mrisk === 'obs') {
        result('rec-nonop', 'MCN &lt;40mm 且無症狀、無壁結節 → 可安全追蹤（European 5.2／5.3）', [
          '<b>可安全追蹤</b>（5.2，GRADE 2C）：<b>&lt;40mm 且無可疑壁結節與症狀</b>者。',
          '<b>監測方式</b>：<b>MRI、EUS 或兩者併用</b>；<b>第 1 年每 6 個月，其後若無變化改為每年</b>；' +
          '<b>只要仍適合手術即終身監測</b>（5.3，GRADE 2C）。',
          '<b>30–40mm</b> 者可併同年齡、共病、手術風險與病人意願個別決定是否手術（5.2）。',
          '<b>&lt;30mm</b> 常難以與其他囊性病灶區分，故<b>比照 IPMN 之監測</b>（5.2）。',
          '<b>懷孕</b>：有 MCN 於孕期快速增大甚至破裂之報告，<b>孕期須密切觀察</b>（5.1）。',
          '<b>出現 ≥40mm、症狀或壁結節</b> → 依手術指徵處理（回到上方步驟改選）。'
        ], 'European 2018 §5.1～5.3。Kyoto 2024 不涵蓋 MCN；ACG 2018 將 MCN 與 IPMN 併用同一套高風險特徵（#9～#11）。' + CYST_SRC_NOTE,
          'custom', cystSurvPanel(), cystFu('surv'));
        return;
      }
      result('rec-elective', 'MCN 具手術指徵 → 手術切除（European 5.1／5.5）', [
        '<b>手術指徵（5.1，GRADE 1B）</b>：<b>≥40mm</b>；或<b>有症狀</b>；或<b>具風險特徵（如壁結節）</b>——後兩者<b>不論大小</b>。',
        '<b>術式（5.5）</b>：具 HGD／癌之影像特徵者 → <b>標準腫瘤學切除＋淋巴結廓清＋脾切除</b>' +
        '（<b>90–95% 為遠端胰切除</b>，GRADE 1B），以免侵襲癌治療不完全。',
        '<b>無可疑特徵、惡性風險低者</b> → <b>非腫瘤學切除</b>：保脾遠端胰切除（可併或不併保留脾血管），或保留實質之切除（PSP）。',
        '<b>PSP 可用於選擇性病人以降低長期糖尿病風險</b>，惟須解剖位置合適；<b>PSP 之早期併發症與住院天數較高</b>（5.5）。',
        '<b>腹腔鏡途徑可行</b>，其相對於開腹之優劣與其他適應症相當。',
        '請於<b>下方步驟</b>選擇切除標本之病理結果。'
      ], 'European 2018 §5.1、5.5。' + CYST_SRC_NOTE, null, cystOpPanel());
      renderCystPath();
      return;
    }

    /* --- IPMN（Kyoto 2024 Fig.3） --- */
    var mdmt = s.cyst === 'mdmt';
    if (!s.crisk) { idleRec('請選擇上方步驟（IPMN 之風險分層）'); return; }

    if (s.crisk === 'hrs') {
      result('rec-elective', '具高風險徵象（HRS）→ 於臨床合宜時考慮手術切除', [
        '<b>Kyoto 2024</b>：<b>適合手術之病人若具 HRS，建議手術切除</b>；' +
        '惟本指引<b>刻意保留「HRS／WF」而不改稱「絕對／相對指徵」</b>——' +
        '<b>HRS 之特異度並不完美</b>，是否手術仍須併同<b>全身狀況、共病、餘命與病人意願</b>判斷（5.2）。',
        '<b>European 2018 之對應表述</b>：<b>黃疸、細胞學為 HGD／癌、強化壁結節 ≥5mm、實質腫塊、MPD ≥10mm</b> 屬<b>絕對手術指徵</b>（4.11，GRADE 1B）。',
        mdmt ? '<b>MD／MT-IPMN 另有獨立之切除理由</b>：<b>適合手術之 MD-IPMN 應予切除</b>（European 4.7，GRADE 1B）；' +
          '<b>MT-IPMN 之惡性轉化風險與 MD-IPMN 相當，亦建議切除</b>（4.8）。' +
          '<b>European 之主胰管切除門檻為 &gt;5mm</b>（4.10，GRADE 2C／弱共識），<u>低於 Kyoto 之 ≥10mm</u>。'
          : '<b>BD-IPMN 通常以部分胰切除即可完整移除</b>（Kyoto 6.3）；懷疑侵襲癌時則需根治性切除併淋巴結廓清。',
        '<b>術前評估</b>：建議加做 <b>EUS（含 CE-EUS，必要時 EUS-FNA）</b>以評估 HGD／侵襲癌（Kyoto CQ1-6，證據 2++）。',
        '<b>IPMN 相關侵襲癌之術前分期，比照胰臟腺癌之流程</b>（European 4.21，GRADE 1C）。',
        '請於<b>下方步驟</b>選擇切除標本之病理結果。'
      ], 'Kyoto 2024 Fig.3、§5.2、§6.3、CQ1-6；European 2018 §4.7、4.8、4.10、4.11、4.21。' + CYST_SRC_NOTE,
        null, cystOpPanel());
      renderCystPath();
      return;
    }

    if (s.crisk === 'wf') {
      if (!s.cwf) { idleRec('請選擇上方步驟（WF 陽性者之加權因子）'); return; }
      if (s.cwf === 'aug') {
        result('rec-elective', '具 WF 併加權因子 → 於臨床合宜時考慮手術切除（Kyoto Fig.3）', [
          '<b>Kyoto Fig.3</b>：無 HRS 但有 WF 者，若併<b>反覆急性胰臟炎影響生活品質</b>、' +
          '<b>多項 WF 疊加</b>或<b>年輕且適合手術</b>，即進入<b>「於臨床合宜時考慮手術」</b>。',
          '<b>反覆胰臟炎之手術理由在症狀</b>：大型系列顯示併急性胰臟炎者之 HGD／IC 發生率與 LGD 相當，' +
          '<b>但反覆發作明顯損害生活品質，故應考慮手術</b>（Kyoto 5.4）。',
          '<b>多項 WF</b>：<b>項目愈多，HGD／IC 之可能性愈高</b>，建議借助 nomogram 綜合判斷（CQ1-5、Fig.3 註 d）。',
          '<b>術前先以 EUS 評估</b>（CQ1-6）；<b>細胞學為可疑或陽性者即升級為 HRS</b>（CQ4-8）。',
          '<b>European 之對應</b>：生長速率 ≥5mm／年、CA 19-9 &gt;37 U/mL（無黃疸時）、MPD 5–9.9mm、囊腫 ≥40mm、' +
          '新發生之糖尿病、IPMN 引起之急性胰臟炎、強化壁結節 &lt;5mm 均屬<b>相對</b>手術指徵（4.12，GRADE 2C）。',
          '請於<b>下方步驟</b>選擇切除標本之病理結果。'
        ], 'Kyoto 2024 Fig.3、§5.4、CQ1-5、CQ1-6；European 2018 §4.12。' + CYST_SRC_NOTE,
          null, cystOpPanel());
        renderCystPath();
        return;
      }
      if (s.cwf === 'other') {
        var wfLines = [
          '<b>Kyoto Fig.3</b>：此格為 <b>「以 1–6 個月間隔監測，間隔依估計風險而定」</b>——' +
          '<b>比無 WF 者密集</b>，且<b>一旦進展即回到最上方重新評估 HRS／WF</b>。',
          '<b>先排除惡性</b>：決定監測而非手術之前，<b>應先以 EUS（含 CE-EUS、必要時 EUS-FNA）完成初步評估</b>（Kyoto CQ1-6）。',
          '<b>European 4.2 之對應</b>：<b>具相對手術指徵者、高齡者、重大共病者，建議每 6 個月追蹤</b>（GRADE 1B）。',
          '<b>ACG #10、#11 之對應</b>：<b>新發生或惡化之糖尿病</b>、<b>囊腫每年增大 &gt;3mm</b> → <b>短間隔 MRI 或 EUS±FNA</b>；' +
          '具黃疸、胰臟炎、CA 19-9 顯著升高、壁結節／實質成分、主胰管 &gt;5mm、口徑改變併上游萎縮、' +
          '黏液性囊腫 ≥3cm、細胞學 HGD／癌者 → <b>EUS±FNA 並轉多專科團隊</b>（強建議）。'
        ];
        if (mdmt) {
          wfLines.unshift('<b>⚠ 型態不符：這一格的監測排程是為分支型（BD-IPMN）設計的。</b>' +
            '<b>MD／MT-IPMN 只要適合手術即建議切除</b>（European 4.7、4.8，GRADE 1B／2C）；' +
            '<b>European 之主胰管切除門檻為 &gt;5mm</b>（4.10），<u>低於 Kyoto 之 ≥10mm</u> —— ' +
            '也就是說，一個主胰管 5–9.9mm 的 MD／MT-IPMN 在 Kyoto 只算 WF，在 European 已經是切除門檻。' +
            '<b>不宜只憑本格就把病人放進單純監測</b>；若因不適合手術而僅能觀察，應循更密集之個別化追蹤。');
        }
        result('rec-nonop', '具 WF 但無加權因子 → 依估計風險以 1–6 個月間隔密切監測', wfLines,
          'Kyoto 2024 Fig.3、CQ1-6；European 2018 §4.2、4.7、4.8、4.10；ACG 2018 #10、#11。' + CYST_SRC_NOTE,
          'custom', cystSurvPanel(), cystFu('surv'));
        return;
      }
      // only30 → 落入依大小之監測（≥30mm）
    }

    /* 無 HRS／WF（或 WF 僅為囊腫 ≥30mm）→ 依大小之監測 */
    var only30 = s.crisk === 'wf' && s.cwf === 'only30';
    var size = only30 ? 'ge30' : s.csize;   // only30 已隱含 ≥30mm，不再另問
    if (!size) { idleRec('請選擇上方步驟（最大囊腫之大小）'); return; }
    var sched = {
      lt20: ['&lt; 20mm', '<b>6 個月一次共 1 次</b>，其後若<b>穩定則每 18 個月</b>'],
      mid: ['≥ 20mm 且 &lt; 30mm', '<b>6 個月一次共 2 次</b>，其後若<b>穩定則每 12 個月</b>'],
      ge30: ['≥ 30mm', '<b>每 6 個月</b>']
    }[size];
    var lines = [
      '<b>監測排程（Kyoto Fig.3／CQ2-2，證據 2+、等級 B）</b>：' + sched[0] + ' → ' + sched[1] + '。',
      '<b>先做一次 6 個月之短期追蹤</b>再進入上述間隔。',
      '<b>監測中出現進展</b> → <b>回到最上方重新評估 HRS／WF</b>。'
    ];
    if (only30) {
      lines.unshift('<b>本情境</b>：WF <u>僅有</u>「囊腫 ≥30mm」一項且無加權因子——' +
        'Kyoto Fig.3 將其導回<b>依大小之監測</b>（即 ≥30mm → 每 6 個月），<b>而非直接手術</b>。' +
        '<b>單以大小為手術指徵並不恰當</b>：囊腫 ≥30mm 而無其他風險因子者，惡性之陽性預測值僅 <b>27–33%</b>（European 4.1、4.3）。');
    }
    if (size === 'lt20') {
      lines.push('<b>停止監測之條件（CQ2-3）</b>：<b>&lt;20mm、滿 5 年、無形態變化亦無 WF</b> 者，' +
        '得<b>「停止監測」或「因併發胰管腺癌之可能而繼續監測」</b>——<b>兩選項並列</b>，須併同病人狀況與餘命判斷。' +
        '<b>年輕者、具家族性或遺傳性風險者不適用</b>（胰癌風險隨時間累積）。');
    } else {
      lines.push('<b>≥20mm 者在 Kyoto Fig.3 中無「停止監測」之出口</b>：未進展者標示為<b>「繼續監測」</b>。');
    }
    if (mdmt) {
      lines.push('<b>⚠ 型態不符</b>：本步驟之排程為 <b>BD-IPMN</b> 之監測。' +
        '<b>MD／MT-IPMN 只要適合手術即建議切除</b>（European 4.7、4.8，GRADE 1B／2C）；' +
        '若因不適合手術而僅能觀察，應循<b>更密集之個別化追蹤</b>，不宜套用本表。');
    }
    lines.push('<b>合併之支持性處置</b>：如出現胰臟外分泌功能不全，依需要補充胰酵素（PANC-C）。');
    result(only30 ? 'rec-nonop' : 'rec-elective',
      (only30 ? 'WF 僅為囊腫 ≥30mm' : '無 HRS 亦無 WF') + ' → 依最大囊腫大小監測（Kyoto Fig.3）',
      lines,
      'Kyoto 2024 Fig.3、CQ2-1～CQ2-3；European 2018 §4.1～4.3、4.5；ACG 2018 #14～#16。' + CYST_SRC_NOTE,
      'custom', cystSurvPanel(), cystFu('surv'));
  }

  /* 囊性腫瘤切除後之病理分流（Kyoto Fig.5） */
  function renderCystPath() {
    var s = pcSt;
    if (!s.cpath) {
      result2('rec-idle', '請選擇切除標本之病理結果', [], '', undefined, '', '術後處置與監測 Post-operative');
      return;
    }
    if (s.cpath === 'ic') {
      result2('rec-nonop', '侵襲癌 Invasive carcinoma → 比照胰臟腺癌之輔助治療與監測', [
        '<b>監測（Kyoto Fig.5）</b>：<b>與一般胰管腺癌相同</b>——即本頁 <b>PANC-6</b> 之監測（每 3 個月共 2 年，其後每年；' +
        '每次含 H&amp;P、CA 19-9 與 CEA、CT）。',
        '<b>輔助化療（European 8.1，GRADE 1C）</b>：<b>IPMN 併侵襲癌不論淋巴結陰陽性均建議輔助全身性化療</b>；' +
        '<b>MCN 併侵襲癌則比照散發性胰臟腺癌</b>（GRADE 2C）。<b>無法指定特定藥物</b>，最常用者為 <b>5-FU</b> 與 <b>gemcitabine</b>。',
        '<b>處方選單</b>見下方（同 PANC-6 ＋ PANC-E 之輔助治療內容）。',
        '<b>T 分期以侵襲成分計</b>：侵襲成分之大小應與 IPMN <b>分開量測、分開記載</b>（Kyoto CQ4-7）。',
        '<b>切緣為侵襲癌</b> → <b>強烈建議延伸切除</b>（European 4.18）；<b>但胰頭之 IPMN 相關侵襲癌不建議全胰切除</b>——預後由該癌決定（4.9）。',
        '<b>不建議切除轉移或局部復發病灶</b>（European 8.5，無研究可據）；<b>不可切除或復發者可比照胰臟腺癌施行緩和性化療</b>（8.4）。'
      ], 'Kyoto 2024 Fig.5、CQ4-7；European 2018 §4.9、4.18、8.1、8.4、8.5。' + CYST_SRC_NOTE,
        'curative', cystSystemicPanel() + adjuvantPanel(), '術後處置與監測 Post-operative');
      return;
    }
    if (s.cpath === 'hgd') {
      result2('rec-elective', '非侵襲性 · 高度分化不良（HGD）→ 每 6 個月影像監測', [
        '<b>間隔（Kyoto Fig.5／CQ3-2、CQ3-4）</b>：<b>HGD 或有胰癌家族史者，每 6 個月</b>影像監測；' +
        '<b>只要仍適合接受後續治療即持續監測</b>。',
        '<b>理由</b>：<b>HGD 與胰癌家族史是切除非侵襲性 IPMN 後、殘胰出現具臨床意義病灶之高風險特徵</b>（CQ3-4）。',
        '<b>切緣為 HGD</b> → <b>應考慮延伸切除</b>（European 4.17／4.18；Kyoto CQ4-6）；' +
        '<b>惟已存在侵襲癌時，保留切緣之 HGD 以避免全胰切除，於高齡或衰弱病人可能是合理的</b>（Kyoto 6.3）。',
        '<b>HGD 可與 carcinoma in situ 互用；不建議使用「malignant IPMN」</b>（CQ4-1）。',
        '<b>European 4.20</b>：<b>HGD 或 MD-IPMN 者前 2 年每 6 個月、其後每年</b>；' +
        'HGD 或 IPMN 相關侵襲癌之復發風險 <b>&gt;50%</b>、無病存活中位數約 <b>29 個月</b>。'
      ], 'Kyoto 2024 Fig.5、CQ3-2、CQ3-4、CQ4-1、CQ4-6；European 2018 §4.17、4.18、4.20。' + CYST_SRC_NOTE,
        'custom', '', '術後處置與監測 Post-operative', cystFu('postop'));
      return;
    }
    result2('rec-elective', '非侵襲性 · 低度分化不良（LGD）→ 每年影像監測', [
      '<b>間隔（Kyoto Fig.5／CQ3-2）</b>：<b>無額外風險因子者每年一次影像</b>；' +
      '<b>只要仍適合接受後續治療即持續監測</b>。',
      '<b>切緣為 LGD 不需追加切除</b>（Kyoto CQ4-6；European 4.17）——' +
      '術後復發常為<b>與原切除病灶無關之獨立新生病灶</b>，且小的 BD-IPMN 常是<b>刻意留在殘胰</b>的。',
      '<b>但「裸露胰管」不等於切緣陰性</b>，可能時應考慮追加切除（CQ4-6）。',
      '<b>不可視為零風險</b>：分子研究顯示<b>低度分化不良之胃型 IPMN 是同時存在之高度病灶的前驅</b>（CQ4-2）；' +
      '且 IPMN 具<b>多發性與多克隆性</b>，被認為是<b>全胰腺的疾病</b>（CQ4-4）。',
      '<b>European 4.20</b>：LGD 者<b>比照未切除之 IPMN 追蹤</b>；其復發風險 5.4–10%，無病存活中位數約 52 個月。'
    ], 'Kyoto 2024 Fig.5、CQ3-2、CQ4-2、CQ4-4、CQ4-6；European 2018 §4.17、4.20。' + CYST_SRC_NOTE,
      'custom', '', '術後處置與監測 Post-operative', cystFu('postop'));
  }

  /* ---------- 事件 ---------- */
  function pancPick(key, val, btn) {
    pcSel(btn);
    var s = pcSt;
    if (key === 'ext') {
      s.ext = val;
      s.surg = s.bstrat = s.bneo = s.bres = s.ps = s.rsite = s.rtime = s.adj = null;
      s.cyst = s.crisk = s.cwf = s.csize = s.mrisk = s.cpath = null;
      pcClearSel(['pc_s2r', 'pc_s2b', 'pc_s3bn', 'pc_s3bp', 'pc_s2la', 'pc_s2m', 'pc_s2rec', 'pc_s3rec', 'pc_sadj',
        'pc_s2cy', 'pc_s3cy', 'pc_s3mcn', 'pc_s4wf', 'pc_s4sz', 'pc_scpath']);
    } else if (key === 'cyst') {
      s.cyst = val; s.crisk = s.cwf = s.csize = s.mrisk = s.cpath = null;
      pcClearSel(['pc_s3cy', 'pc_s3mcn', 'pc_s4wf', 'pc_s4sz', 'pc_scpath']);
    } else if (key === 'crisk') {
      s.crisk = val; s.cwf = s.csize = s.cpath = null;
      pcClearSel(['pc_s4wf', 'pc_s4sz', 'pc_scpath']);
    } else if (key === 'cwf') {
      s.cwf = val; s.csize = s.cpath = null;
      pcClearSel(['pc_s4sz', 'pc_scpath']);
    } else if (key === 'csize') {
      s.csize = val;
    } else if (key === 'mrisk') {
      s.mrisk = val; s.cpath = null;
      pcClearSel(['pc_scpath']);
    } else if (key === 'cpath') {
      s.cpath = val;
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

  function pancReset() {
    for (var k in pcSt) { if (pcSt.hasOwnProperty(k)) pcSt[k] = null; }
    var root = document.getElementById('pcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('pc_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    hideRec('pc_rec2'); hideRec('pc_rec3');
    pcRender();
  }

  function initPancPathway() { pancReset(); }

  // 匯出
  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息——流程圖只是
     點了沒反應。本檔曾因與 rcc-pathway.js 同樣使用 rcPick／rcReset 而失效，
     panc 與 prostate 亦曾同用 pcPick／pcReset。新增模組時請用夠長的專屬前綴。 */
  global.pancPathwayHTML = pancPathwayHTML;
  global.initPancPathway = initPancPathway;
  global.pancPick = pancPick;
  global.pancReset = pancReset;
})(window);
