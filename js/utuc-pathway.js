/* ============================================================
   上泌尿道尿路上皮癌治療互動決策流程 UTUC Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 上泌尿道腫瘤診療指引
   版次 15（2026/06/16 第 84 次癌症醫療委員會修訂通過），文件編號 50710-2-000018
   指引本文標題 Clinical Guidelines of Upper Tract Urothelial Carcinoma, NTUH-V1.2026
   ※ 流程結構依指引第 2 頁之決策圖判讀（非文字順序）。三個容易讀錯之處：
     ① 指引的<b>第一個分叉是「有無轉移」</b>，不是風險分層——風險分層（低／高）
        只掛在 non-metastatic 那一側，轉移側走的是全身性治療。
     ② 低風險與高風險<b>都可以做 KSS</b>，但意義相反：低風險的 KSS 與 NU 並列為
        兩個對等選項；高風險的 KSS 在圖上明寫 <b>not favored, selected pts</b>。
     ③ 術後輔助治療分兩格而非一格：<b>pT2-4／pN+ → 考慮輔助化療</b>；
        <b>ypT2-4／pN+（即已接受新輔助化療者）→ 考慮輔助化療「或免疫治療」</b>。
        兩格的箭頭來源不同（前者來自直接手術，後者來自新輔助後手術）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var utSt = {
    extent: null,   // nonmeta | meta
    risk: null,     // low | high            （非轉移）
    path: null,     // p_low | p_high | p_yp （術後病理）
    cis: null,      // cis_ok | cis_no       （轉移）
    line: null      // l_post_plat | l_post_io_ok | l_post_io_no （後線）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="utPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 危險因子與檢查（指引第 2 頁左上）---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>病史危險因子與初始檢查 History &amp; Workup ▸</summary>' +
      '<div class="dx-h">病史（指引逐條列出——台灣的上泌尿道腫瘤流行病學與西方不同，這幾項不是例行問診而是分期前的關鍵資訊）</div>' +
      '<ul class="dx-list">' +
      '<li><b>吸菸 Smoking</b></li>' +
      '<li><b>末期腎病／腎移植 ESRD／transplantation</b></li>' +
      '<li><b>中草藥使用 Chinese herb use</b>（馬兜鈴酸相關腎病變在台灣為重要致病因子）</li>' +
      '<li><b>出生地 Birth place</b>、<b>居住地 Residency</b>（烏腳病流行區之砷暴露）</li>' +
      '<li><b>職業 Occupation</b>（芳香胺、染料、橡膠）</li>' +
      '<li>理學檢查 Physical examination</li>' +
      '</ul>' +
      '<div class="dx-h">主要檢查 Essential</div>' +
      '<ul class="dx-list">' +
      '<li><b>輸尿管鏡 + 沖洗細胞學 + 切片</b>　Ureteroscopy + wash cytology + biopsy</li>' +
      '<li><b>腹部＋骨盆腔 CT urography</b>；若 CTU 有禁忌則行 <b>MR urography</b></li>' +
      '<li><b>尿液細胞學 Urine cytology</b></li>' +
      '</ul>' +
      '<div class="dx-h">次要檢查 Optional</div>' +
      '<ul class="dx-list">' +
      '<li>骨骼掃描 Bone scan（optional）</li>' +
      '<li>腎功能掃描 Renal scan（optional）</li>' +
      '<li>胸部 X 光或胸部 CT（optional）</li>' +
      '<li><b>逆行性腎盂攝影 Retrograde pyelogram</b>——當<b>碘或釓顯影劑不可行</b>時</li>' +
      '</ul>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>UTUC</b> — upper tract urothelial carcinoma 上泌尿道尿路上皮癌</li>' +
      '<li><b>NU with cuff</b> — radical nephroureterectomy with bladder cuff excision 根除性腎輸尿管切除併膀胱袖口切除</li>' +
      '<li><b>KSS</b> — kidney-sparing surgery 保留腎臟手術（輸尿管鏡消融／節段性輸尿管切除）</li>' +
      '<li><b>LND</b> — lymph node dissection 淋巴結廓清</li>' +
      '<li><b>C/T</b> — chemotherapy 化學治療　｜　<b>IO</b> — immuno-oncology 免疫治療</li>' +
      '<li><b>EV</b> — enfortumab vedotin-ejfv（Nectin-4 抗體藥物複合體）</li>' +
      '<li><b>URS</b> — ureteroscopy 輸尿管鏡　｜　<b>BC</b> — bladder cancer 膀胱癌</li>' +
      '</ul></details>';
  }

  /* ---------- 追蹤（指引第 2 頁下方追蹤方塊）---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤與監測 Surveillance</div>' +
      '<ul class="fu-list">' +
      '<li><b>追蹤間隔依風險分層而定</b>（Follow-up interval based on risk-stratification）——指引未指定固定月數，' +
      '而是明講依風險決定，低風險者可拉長、高風險者須密集。</li>' +
      '<li><b>膀胱鏡 Cystoscopy</b>——UTUC 之膀胱內復發率高，膀胱鏡是追蹤的核心而非附帶項目。</li>' +
      '<li><b>上泌尿道影像 Upper tract imaging</b>：<b>CTU 或 MRU</b>。</li>' +
      '<li><b>胸部影像 Chest imaging</b>。</li>' +
      '<li><b>尿液細胞學 Urine cytology</b>。</li>' +
      '<li><b>接受 KSS 者須嚴格追蹤並定期輸尿管鏡</b>（stringent follow-up and URS for KSS）——保留腎臟換來的是更密集的內視鏡監測。</li>' +
      '</ul>';
  }

  /* ---------- 復發與後續事件（指引第 2 頁右下四個方塊）---------- */
  function relapseHtml() {
    return '<details class="kps-details"><summary>追蹤期間發現異常之處置（指引右下四方塊）▸</summary>' +
      rxLine('腎輸尿管切除後之局部復發', 'Local recurrence after N/U', [
        '導向<b>轉移病灶切除／緩解性手術</b>（metastasectomy／palliative surgery）<b>或緩解性放療</b>（palliative radiotherapy）。'
      ]) +
      rxLine('轉移', 'Metastasis', [
        '同上，導向<b>轉移病灶切除／緩解性手術</b>或<b>緩解性放療</b>；全身性治療依轉移側之流程。'
      ]) +
      rxLine('對側上泌尿道尿路上皮癌', 'Contralateral upper tract urothelial cancer', [
        '<b>比照 UTUC 處置</b>（Treat as UTUC）——即回到本流程之起點重新分層。'
      ]) +
      rxLine('膀胱癌', 'Bladder cancer', [
        '<b>比照膀胱癌處置</b>（Treat as BC）——請改看本頁「膀胱癌」之治療流程。'
      ]) +
      '</details>';
  }

  /* ---------- 建議處置 ---------- */
  function recPrimary(s) {
    /* ── 非轉移 ── */
    if (s.extent === 'nonmeta') {
      if (s.risk === 'low') {
        return { cls: 'rec-elective', title: '非轉移 · 低風險 UTUC', detail:
          '<div class="rx-def"><b>低風險之定義（指引明列，須<u>全部</u>符合）</b>：' +
          '<b>單發（unifocal）</b>、<b>&lt;2 cm</b>、<b>高惡性度細胞學陰性</b>（negative high-grade cytology）、' +
          '<b>切片為低惡性度</b>（low-grade biopsy）、<b>影像無侵犯表現</b>（no invasive images）。</div>' +
          rxLine('兩個對等選項', '指引以 ♦ 並列，未指定優先者', [
            '<b>保留腎臟手術 Kidney-sparing surgery（KSS）</b>',
            '<b>或 根除性腎輸尿管切除併膀胱袖口切除 NU with cuff</b>'
          ]),
          note: '指引第 2 頁。<b>低風險的 KSS 與 NU 是對等選項</b>——與高風險那格的 KSS（明寫 not favored）意義完全不同，勿混為一談。' };
      }
      if (s.risk === 'high') {
        return { cls: 'rec-elective', title: '非轉移 · 高風險 UTUC', detail:
          '<div class="rx-def"><b>高風險</b>即<b>不符合低風險全部條件者</b>——指引以「High risk」單一方塊表示，未再細分。</div>' +
          rxLine('指引所列三項', '', [
            '<b>NU with cuff ± LND ± 術後單劑膀胱內灌注化療</b>' +
            '（<span class="rx">post-op intravesical C/T for one dose</span>）——' +
            '<b>術後單劑膀胱內化療是為了降低膀胱內復發</b>，非治療原發腫瘤。',
            '<b>新輔助全身性化療 Neoadjuvant systemic chemotherapy</b>（<b>selected pts</b>）——' +
            '腎輸尿管切除後腎功能必然下降，故<b>順鉑為主之化療在術前給予較有機會完成</b>。',
            '<b>KSS</b>——指引明寫 <b>not favored, selected pts</b>（不建議，僅限經篩選之病人）。'
          ]),
          note: '指引第 2 頁。<b>三項中只有第一項是常規路徑</b>；第二項限選擇性病人、第三項指引直接標示不建議。' };
      }
      return null;
    }

    /* ── 轉移 ── */
    if (s.extent === 'meta') {
      if (s.cis === 'cis_ok') {
        return { cls: 'rec-nonop', title: '轉移性 UTUC · 可用順鉑（cisplatin-eligible）', detail:
          rxLine('第一線 · 指引所列三項', 'Cis-eligible', [
            '<span class="rx">Pembrolizumab + enfortumab vedotin-ejfv（EV）</span>',
            '<b>化療續以 <span class="drug">avelumab</span> 維持治療</b>——' +
            '<b>條件：化療 4–6 個週期後未惡化</b>（if no PD after 4–6 cycles of chemo）。',
            '<span class="rx">Gem/Cis + nivolumab</span> 續以 <span class="drug">nivolumab</span> 維持治療。'
          ]),
          note: '指引第 2 頁「Cis-eligible」方塊。<b>維持治療的門檻是「未惡化」而非「有反應」</b>——疾病穩定者同樣接續 avelumab。' };
      }
      if (s.cis === 'cis_no') {
        return { cls: 'rec-nonop', title: '轉移性 UTUC · 不適用順鉑（cisplatin-ineligible）', detail:
          rxLine('第一線 · 指引所列三項', 'Cis-ineligible', [
            '<span class="rx">Pembrolizumab + EV</span>',
            '<b>化療續以 <span class="drug">avelumab</span> 維持治療</b>（同樣以化療 4–6 個週期後未惡化為條件）。',
            '<b>單用免疫治療（IO alone）</b>——<b>限 PD-L1 陽性或完全無法接受含鉑化療者</b>' +
            '（if PD-L1 + or platinum-ineligible）。'
          ]),
          note: '指引第 2 頁「Cis-ineligible」方塊。<b>「不適用順鉑」與「不適用任何鉑類」是兩件事</b>——單用 IO 的條件是後者（或 PD-L1 陽性），不是前者。' };
      }
      return null;
    }
    return null;
  }

  /* 術後輔助治療：必須先有手術與病理報告才成立，故排在原發治療建議之後 */
  function recAdjuvant(s) {
    if (s.path === 'p_low') {
      return { cls: 'rec-elective', title: '術後病理 pT0／pTa／pT1', detail:
        rxLine('不加輔助治療', '', [
          '<b>直接進入追蹤</b>——指引此格<b>無輔助治療箭頭</b>，直接連到追蹤方塊。'
        ]),
        note: '指引第 2 頁。<b>非肌肉侵犯性之術後病理不做輔助治療</b>；追蹤內容見下方。' };
    }
    if (s.path === 'p_high') {
      return { cls: 'rec-elective', title: '術後病理 pT2–T4 或 pN(+)（未接受新輔助治療）', detail:
        rxLine('輔助治療', '', [
          '<b>考慮輔助化療 Consider adjuvant chemotherapy（C/T）</b>——' +
          '指引用字為 <b>consider</b>，非一律給予。'
        ]),
        note: '指引第 2 頁。此格<b>只有化療、沒有免疫治療</b>；免疫治療只出現在新輔助後（ypT）那一格。輔助化療之隨機試驗依據為 POUT（見下方參考文獻）。' };
    }
    if (s.path === 'p_yp') {
      return { cls: 'rec-elective', title: '術後病理 ypT2–T4 或 pN(+)（已接受新輔助化療）', detail:
        rxLine('輔助治療', '', [
          '<b>考慮輔助化療<u>或</u>免疫治療 Consider adjuvant C/T or IO</b>'
        ]),
        note: '指引第 2 頁。<b>這一格與上一格是兩個獨立方塊，箭頭來源不同</b>——已接受新輔助化療卻仍殘存 ypT2-4／pN+ 者，指引多給一個免疫治療的選項。' };
    }
    return null;
  }

  /* 後線治療（轉移側 PD 之後）：指引右側「Post-platinum／Post-IO」三格 */
  function recLater(s) {
    if (s.line === 'l_post_plat') {
      return { cls: 'rec-nonop', title: '含鉑治療後惡化 Post-platinum', detail:
        rxLine('指引所列', 'Post-platinum', [
          '<b>免疫治療（IO）</b>，<b>或</b>替代化療，<b>或</b> <span class="drug">EV</span>，<b>或</b> <span class="drug">Erdafitinib</span>（selected pts）',
          '<span class="drug">Trastuzumab deruxtecan</span>（selected pts）'
        ]) +
        '<div class="rx-def"><b>指引於三格後線之後統一註記：<span class="rx">Offer clinical trial if qualified</span></b>' +
        '（符合條件者應提供臨床試驗）。再惡化者導向<b>最佳支持療法</b>。</div>',
        note: '指引第 2 頁右側。<b>Erdafitinib 之 selected pts 指 FGFR2／FGFR3 基因變異者</b>（THOR 試驗族群，見參考文獻）。' };
    }
    if (s.line === 'l_post_io_ok') {
      return { cls: 'rec-nonop', title: '免疫治療後惡化 · 可用順鉑 Post-IO, cis-eligible', detail:
        rxLine('指引所列', 'Post-IO, cis-eligible', [
          '<span class="rx">Gem/Cis</span> 或其他化療',
          '<span class="drug">EV</span>',
          '<span class="drug">Erdafitinib</span>（selected pts）',
          '<span class="drug">Trastuzumab deruxtecan</span>（selected pts）'
        ]) +
        '<div class="rx-def"><span class="rx">Offer clinical trial if qualified</span>；再惡化者導向<b>最佳支持療法</b>。</div>',
        note: '指引第 2 頁右側。' };
    }
    if (s.line === 'l_post_io_no') {
      return { cls: 'rec-nonop', title: '免疫治療後惡化 · 不適用順鉑 Post-IO, cis-ineligible', detail:
        rxLine('指引所列', 'Post-IO, cis-ineligible', [
          '<span class="drug">EV</span>',
          '<span class="rx">Gem/Carbo</span> 或其他化療',
          '<span class="drug">Erdafitinib</span>（selected pts）',
          '<span class="drug">Trastuzumab deruxtecan</span>（selected pts）'
        ]) +
        '<div class="rx-def"><span class="rx">Offer clinical trial if qualified</span>；再惡化者導向<b>最佳支持療法</b>。</div>',
        note: '指引第 2 頁右側。<b>與上一格的差別只在化療骨架（carboplatin 取代 cisplatin）</b>，EV 與標靶／ADC 選項相同。' };
    }
    return null;
  }

  /* ---------- 症狀控制／寡殘存 ---------- */
  function localHtml() {
    return '<details class="kps-details"><summary>症狀控制或寡殘存病灶之局部處置（Symptom control or oligo-residual）▸</summary>' +
      rxLine('指引所列兩項', '以紅字標示於轉移側', [
        '<b>轉移病灶切除／緩解性手術</b>　Metastasectomy／palliative surgery',
        '<b>緩解性放療</b>　Palliative radiotherapy'
      ]) +
      '<div class="note">此方塊<b>橫跨在全身性治療之下</b>，不是另一條治療路線——是全身性治療期間為了症狀或殘存病灶所加的局部處置。</div>' +
      '</details>';
  }

  /* ---------- 版面 ---------- */
  function utucPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院上泌尿道腫瘤診療指引 版次 15（2026/06/16，文件編號 50710-2-000018）</b>' +
      '之互動決策流程（指引本文 NTUH-V1.2026，第 2 頁決策圖）。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="utPath">';

    h += dxHtml();

    h += step('ut_s1', '1', '疾病範圍？',
      opt('extent', 'nonmeta', '非轉移 Non-metastatic', '走風險分層 → 手術') +
      opt('extent', 'meta', '轉移 Metastatic', '走全身性治療'),
      '<div class="note">指引的<b>第一個分叉是有無轉移</b>，不是風險分層——風險分層只掛在非轉移側。</div>');

    h += connH('ut_c1');
    h += step('ut_s2', '2', '風險分層？',
      opt('risk', 'low', '低風險 Low risk', '單發 · <2cm · 細胞學與切片皆低惡性度 · 影像無侵犯') +
      opt('risk', 'high', '高風險 High risk', '不符低風險全部條件者'),
      '<div class="note"><b>低風險為「全部條件皆須符合」</b>：單發、&lt;2 cm、高惡性度細胞學陰性、低惡性度切片、影像無侵犯表現。任一項不符即為高風險。</div>');

    h += step('ut_s2m', '2', '是否適用順鉑（cisplatin）？',
      opt('cis', 'cis_ok', '可用順鉑 Cis-eligible') +
      opt('cis', 'cis_no', '不適用順鉑 Cis-ineligible'),
      '<div class="note">轉移側的分流軸是<b>順鉑適用性</b>——這是尿路上皮癌全身性治療的傳統分水嶺（腎功能、體能狀態、聽力、神經病變、心衰竭）。</div>');

    h += '<div class="flow-rec rec-idle" id="ut_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';

    h += connH('ut_c2');
    h += step('ut_s3', '3', '若已接受手術：術後病理？',
      opt('path', 'p_low', 'pT0 / pTa / pT1', '非肌肉侵犯 · 直接追蹤') +
      opt('path', 'p_high', 'pT2–T4 或 pN(+)', '未接受新輔助治療') +
      opt('path', 'p_yp', 'ypT2–T4 或 pN(+)', '已接受新輔助化療'),
      '<div class="note">尚未手術者<b>可略過本步</b>。<b>pT 與 ypT 是兩個不同方塊</b>——y 代表術前已給過全身性治療，其輔助治療多一個免疫治療選項。</div>');

    h += step('ut_s3m', '3', '第一線治療後惡化（PD）之後線？',
      opt('line', 'l_post_plat', '含鉑後 Post-platinum') +
      opt('line', 'l_post_io_ok', '免疫後 · 可用順鉑', 'Post-IO, cis-eligible') +
      opt('line', 'l_post_io_no', '免疫後 · 不適用順鉑', 'Post-IO, cis-ineligible'),
      '<div class="note">尚未惡化者<b>可略過本步</b>。指引在三格後線之後統一註明 <b>Offer clinical trial if qualified</b>，再惡化者導向最佳支持療法。</div>');

    h += '<div class="flow-rec rec-idle hidden" id="ut_rec2"><div class="rec-label">後續治療 Next step</div>' +
      '<div class="rec-title">請選擇上方選項</div></div>';
    h += '<div class="flow-fu hidden" id="ut_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="utReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function utRender() {
    var s = utSt;
    var nonmeta = s.extent === 'nonmeta';
    var meta = s.extent === 'meta';

    show('ut_c1', !!s.extent);
    show('ut_s2', nonmeta);
    show('ut_s2m', meta);

    var rec = document.getElementById('ut_rec');
    var rec2 = document.getElementById('ut_rec2');
    var fu = document.getElementById('ut_fu');
    if (!rec) return;

    var done = (nonmeta && !!s.risk) || (meta && !!s.cis);
    var r = done ? recPrimary(s) : null;
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      show('ut_c2', false); show('ut_s3', false); show('ut_s3m', false); show('ut_rec2', false);
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (meta ? '<div class="rec-detail">' + localHtml() + '</div>' : '') +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    show('ut_c2', done);
    show('ut_s3', nonmeta);
    show('ut_s3m', meta);

    var a = nonmeta ? (s.path ? recAdjuvant(s) : null) : (s.line ? recLater(s) : null);
    if (rec2) {
      var lbl = nonmeta ? '輔助治療 Adjuvant' : '後線治療 Later line';
      if (a) {
        rec2.className = 'flow-rec ' + a.cls;
        rec2.innerHTML = '<div class="rec-label">' + lbl + '</div>' +
          '<div class="rec-title">' + a.title + '</div>' +
          '<div class="rec-detail">' + a.detail + '</div>' +
          (a.note ? '<div class="rec-note">' + a.note + '</div>' : '');
      } else {
        rec2.className = 'flow-rec rec-idle hidden';
        rec2.innerHTML = '<div class="rec-label">' + lbl + '</div>' +
          '<div class="rec-title">請選擇上方選項</div>';
      }
    }

    if (fu) {
      fu.innerHTML = fuHtml() + relapseHtml();
      fu.classList.remove('hidden');
    }
  }

  function utClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function utPick(key, val, btn) {
    var s = utSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'extent') {
      s.extent = val; s.risk = s.path = s.cis = s.line = null;
      utClearSel(['ut_s2', 'ut_s2m', 'ut_s3', 'ut_s3m']);
    } else if (key === 'risk') {
      s.risk = val; s.path = null;
      utClearSel(['ut_s3']);
    } else if (key === 'cis') {
      s.cis = val; s.line = null;
      utClearSel(['ut_s3m']);
    } else if (key === 'path') {
      s.path = val;
    } else if (key === 'line') {
      s.line = val;
    }
    utRender();
  }

  function utReset() {
    for (var k in utSt) { if (utSt.hasOwnProperty(k)) utSt[k] = null; }
    var root = document.getElementById('utPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('ut_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    var rec2 = document.getElementById('ut_rec2');
    if (rec2) { rec2.classList.add('hidden'); }
    utRender();
  }

  function initUtucPathway() { utReset(); }

  global.utucPathwayHTML = utucPathwayHTML;
  global.initUtucPathway = initUtucPathway;
  global.utPick = utPick;
  global.utReset = utReset;
})(window);
