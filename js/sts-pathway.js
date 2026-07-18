/* ============================================================
   軟組織肉瘤治療互動決策流程 Soft Tissue Sarcoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 肉瘤診療指引 版次 08
   （Sarcoma Clinical Guidelines in Oncology, NTUH – v.1 2026；
     2026/06/16 第 87 次癌症醫療委員會會議修訂通過；
     陳偉武／李佳真／李明璟醫師，NTUH 肉瘤多科診療團隊制訂）
   ※ 本模組涵蓋：軟組織肉瘤（STS，侷限 Stage I–III 與轉移 Stage IV）
     ＋ 原發性腹膜後肉瘤（RPS）之獨立流程。
   ※ 本院指引之 bone sarcoma 段落為敘述性原則、無流程圖，故不在此流程內；
     GIST 亦不在此流程內（另見「胃腸道基質瘤（GIST）」條目）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var stSt = {
    type: null,    // sts | rps          （肉瘤類型／部位）
    scope: null,   // loc | met          （STS 疾病範圍）
    res: null,     // res | unres        （STS 侷限性之可切除性）
    grade: null,   // g1 | g23           （STS 侷限可切除之分級與風險）
    strat: null,   // surg | neo         （STS 侷限可切除 G2/3 之策略）
    rst: null,     // R0 | R1            （STS 手術切緣）
    reass: null,   // res2 | unres2      （STS 不可切除經術前治療後再評估）
    rpsres: null   // res | border | unres（RPS 可切除性）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="stPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  var mdtNote = '<b>治療前多科團隊（MDT）討論為強烈建議</b>（指引註 a：MDT discussion before management strongly recommended）。';

  /* ---------- 治療前評估（STS，指引第 3 頁）---------- */
  function workupHtml() {
    return '<div class="crit-box">' +
      cbx('影像檢查 Adequate imaging', '治療前 Pre-treatment management', [
        cb('必要', '<b>CT</b><sup>a</sup> ± <b>MRI</b>'),
        cb('必要', '<b>X 光平片</b>（原發部位、胸部）Plain x-ray film'),
        cb('選擇性', '± 血管攝影 Angiogram'),
        cb('選擇性', '± <b>Bone scan</b><sup>b</sup>'),
        cb('選擇性', '± <b>PET</b><sup>c</sup>')
      ]) +
      cbx('特殊情形 Special cases', '依組織型態指定之額外影像', [
        cb('黏液樣脂肪肉瘤 Myxoid LPS', '<b>脊椎影像 Spine imaging</b>'),
        cb('中樞神經影像 CNS imaging', '<b>ASPS（腺泡狀軟組織肉瘤）、血管肉瘤、心臟肉瘤</b>'),
        cb('脊椎腫瘤 Spine tumor', '<b>PET 與 bone scan 用於「排除」</b>（used for exclusion）')
      ]) +
      cbx('計畫性切片 Planned biopsy', '', [
        cb('順序', '<b>影像檢查後再切片</b> Biopsy after imaging'),
        cb('位置', '<b>切片路徑須置於未來計畫切除範圍之上</b> Placed along planned future resection'),
        cb('外院診斷', '於他院初次診斷為肉瘤者，<b>建議由本院肉瘤 MDT 病理科醫師 review 病理</b>')
      ]) +
      '<div class="note"><b>a</b>：有 <b>lymphoid involvement</b> 之個案建議安排<b>含顯影劑（contrast）之 chest CT</b>；' +
      '若為<b>內臟腫瘤（visceral tumor）</b>，建議安排 <b>chest CT ＋ abd/pelvis CT</b>。<br>' +
      '<b>b</b>：軟組織肉瘤於 <b>deep tumor 懷疑有 bone invasion 時</b>安排 bone scan（<b>superficial tumor 則為 optional</b>）。<br>' +
      '<b>c</b>：PET 考慮用於下列型態—— <b>Ewing 肉瘤（PNET）、橫紋肌肉瘤、血管肉瘤、上皮樣肉瘤、透明細胞肉瘤、滑膜肉瘤</b>；' +
      '<b>尤其高惡性度者</b>。<br>' +
      '<b>v.1 2026 改版新增</b>：<b>PET/CT 可考慮作為 sarcoma staging 的選擇</b>（optional）——可幫助判斷 ' +
      '<b>lymph node 和／或 bone involvement</b>，且<b>應註明影像範圍是否要包含四肢</b>。</div>' +
      '</div>';
  }

  /* ---------- RPS 定義（指引第 9 頁）---------- */
  function rpsDefHtml() {
    return '<div class="crit-box">' +
      '<div class="note"><b>原發性腹膜後肉瘤（RPS）之定義：<u>非內臟來源</u>（non-visceral origin）。</b></div>' +
      cbx('納入 Inclusion', '', [
        cb('最常見型態', '<b>分化良好脂肪肉瘤（WD LPS）、去分化脂肪肉瘤（DD LPS）、平滑肌肉瘤（LMS）、' +
          '孤立性纖維瘤（solitary fibrous tumor）、惡性周邊神經鞘瘤（MPNST）、' +
          '未分類／未分化多形性肉瘤（undifferentiated pleomorphic sarcoma）</b>'),
        cb('較少見型態', '滑膜肉瘤（synovial sarcoma）、黏液纖維肉瘤（myxofibrosarcoma）'),
        cb('其他', '大靜脈與腰大肌之肉瘤（sarcoma of major veins and psoas muscle）；輸尿管平滑肌肉瘤（ureteric LMS）')
      ]) +
      cbx('排除 Exclusion', '不屬 RPS 分類', [
        cb('', '良性腫瘤 Benign tumors'),
        cb('', '<b>GIST</b>（另見「胃腸道基質瘤」條目）'),
        cb('', '硬纖維瘤 Desmoid tumor'),
        cb('', '內臟肉瘤 Visceral sarcomas'),
        cb('', '腎上腺皮質癌 Adrenal cortical carcinoma'),
        cb('', '副神經節瘤 Paraganglioma'),
        cb('', '惡性嗜鉻細胞瘤 Malignant pheochromocytoma')
      ]) +
      '<div class="note"><b>⚠ 被排除於 RPS 分類之肉瘤型態，仍應於 MDT 討論</b>' +
      '（指引原文：Sarcoma subtypes that are excluded from RPS classification should still be discussed in a ' +
      'multidisciplinary team setting to ensure the best possible outcomes for these patients）。</div>' +
      cbx('診斷與影像 Diagnosis &amp; Image', '', [
        cb('切片', '<b>CNB（core needle biopsy）</b>'),
        cb('CT', '<b>含顯影劑之 CT，範圍自胸部至骨盆</b>（chest to pelvic）'),
        cb('腦部影像', '<b>Optimal</b>——於<b>平滑肌肉瘤（LMS）</b>或<b>其他有大血管侵犯之肉瘤型態</b>時<b>強烈建議</b>'),
        cb('分期補充', '<b>FDG PET 或 bone scan</b> 可考慮用以完成分期')
      ]) +
      '</div>';
  }

  /* ---------- MDT 組成（RPS，指引註 1）---------- */
  function rpsMdtNote() {
    return '<b>RPS 之決策應納入</b>：<b>肉瘤外科醫師</b>（含一般外科、泌尿科、心臟血管外科、骨科）、' +
      '腫瘤內科、放射診斷科、放射腫瘤科與病理科（指引註 1）。';
  }

  /* ---------- 姑息性全身治療選單（指引第 6 頁）---------- */
  function palliativeSystemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">Palliative systemic treatment recommendations<span class="rx-panel-src">指引第 6 頁</span></div>' +
      '<div class="rx-def"><b>本院指引<u>鼓勵局部無法手術或轉移性軟組織肉瘤之病人加入臨床試驗</b></u>' +
      '（Enrollment into clinical trials is encouraged）。</div>' +
      rxLine('一線 First-line', '以 anthracycline 為主', [
        '<b>應以 <span class="rx">anthracycline 為基礎之治療</span>作為一線考量</b>' +
        '（Anthracycline-based treatment should be considered as first-line treatment）。',
        '<b>血管肉瘤 Angiosarcoma</b> → <span class="drug">Liposomal doxorubicin</span> 可作為<b>替代選項</b>。',
        '<b>晚期隆突性皮膚纖維肉瘤（DFSP）且已確認 <u>PDGFB translocation</u></b> → ' +
        '<span class="drug">Imatinib</span> 可作為<b>一線</b>給予。'
      ]) +
      rxLine('其他一線選項 Other first-line', '', [
        '<span class="rx">Ifosfamide 為基礎之處方</span>',
        '<span class="rx">Gemcitabine 為基礎之處方</span>',
        '<span class="rx">Paclitaxel 為基礎之處方</span>',
        '<span class="drug">Dacarbazine</span>'
      ]) +
      rxLine('二線以後 Second or later line', '', [
        '<span class="drug">Pazopanib</span>',
        '<span class="drug">Eribulin</span>',
        '<span class="drug">Trabectedin</span>',
        '<span class="drug">Ifosfamide</span>',
        '<span class="drug">Dacarbazine</span>'
      ]) +
      rxLine('免疫檢查點抑制劑 ICI', '<b>僅限特定亞型</b>', [
        '<b>可考慮用於下列軟組織肉瘤亞型</b>：<b>腺泡狀軟組織肉瘤（ASPS）、血管肉瘤（angiosarcoma）、' +
        '未分化多形性肉瘤（UPS）</b>。'
      ]) +
      rxLine('基因變異標靶 Targeted', '', [
        '<b>具特定基因變異之肉瘤（如 <span class="drug">NTRK</span>、<span class="drug">ALK</span>）</b> → ' +
        '<b>應考慮對應之標靶藥物</b>（targeted agents should be considered）。'
      ]) +
      '</div>';
  }

  /* ---------- 版面 HTML ---------- */
  function stsPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院肉瘤診療指引 版次 08（NTUH Sarcoma v.1 2026，2026/06/16）</b>之互動決策流程。' +
      '逐步點選以取得對應建議處置、藥物療程與追蹤方式。' +
      '<b>本院指引全篇以「多科團隊（MDT）討論」為治療前提</b>，多數處置以 or 並列而未指定單一首選。' +
      '<b>骨肉瘤（bone sarcoma）不在本流程內</b>——本院指引該段為敘述性原則、無流程圖。</p>';
    h += '<div class="onc-path" id="stPath">';

    // Step 1 — 肉瘤類型／部位
    h += step('st_s1', '1', '肉瘤類型與原發部位',
      opt('type', 'sts', '軟組織肉瘤 STS', '軀幹／四肢、頭頸、內臟等（指引第 3–6 頁）') +
      opt('type', 'rps', '原發性腹膜後肉瘤 RPS', '非內臟來源之腹膜後肉瘤（指引第 9–12 頁，獨立流程）'),
      '<div class="note">' + mdtNote + '</div>');

    // ===== STS 分支 =====
    // Step 2 — 疾病範圍
    h += connH('st_c2');
    h += step('st_s2', '2', '疾病範圍 Disease extent',
      opt('scope', 'loc', '侷限性疾病 Localized（Stage I–III）', '指引第 3–5 頁') +
      opt('scope', 'met', '轉移性疾病 Metastatic（Stage IV）', '指引第 5–6 頁'),
      workupHtml());
    h = h.replace('id="st_s2"', 'id="st_s2" class="hidden"');

    // Step 3 — 可切除性
    h += connH('st_c3');
    h += step('st_s3', '3', '可切除性 Resectability（侷限性疾病）',
      opt('res', 'res', '可切除 Resectable', '→ 指引第 4 頁「Treatment of resectable disease」') +
      opt('res', 'unres', '不可切除 Unresectable', '→ 指引第 4 頁「Treatment of unresectable disease」'));
    h = h.replace('id="st_s3"', 'id="st_s3" class="hidden"');

    // Step 4 — 分級與風險（可切除）
    h += connH('st_c4');
    h += step('st_s4', '4', '組織學分級與風險因子（可切除侷限性 STS）',
      opt('grade', 'g1', 'Grade 1', '低惡性度，且無下列風險因子') +
      opt('grade', 'g23', 'Grade 2／3　<b>或</b>大型腫瘤（≥5cm）<b>或</b>術前確認無法達乾淨切緣',
        '三者<b>任一</b>成立即走此分支'),
      '<div class="note"><b>指引第 4 頁圖示：</b>「Grade 2/3<sup>a</sup>　<b>or</b> large tumor size (≥5 cm) ' +
      '<b>or</b> clean margin unattainable confirmed preoperatively」——' +
      '<b>此三項為<u>並列的觸發條件</u></b>，並非只看分級。' + mdtNote + '</div>');
    h = h.replace('id="st_s4"', 'id="st_s4" class="hidden"');

    // Step 5 — 治療策略（G2/3）
    h += connH('st_c5');
    h += step('st_s5', '5', '治療策略（Grade 2／3 或大型腫瘤或切緣難達者）',
      opt('strat', 'surg', '直接手術 Surgery', '指引圖示之並列選項①') +
      opt('strat', 'neo', '術前輔助治療 → 手術', '<b>Neoadjuvant RT</b> 或 <b>C/T ± RT</b> → Surgery<sup>b</sup>（並列選項②）'),
      '<div class="note"><b>此二者於指引圖中為<u>並列（or）之平行選項</u>，未指定首選。</b><br>' +
      '<b>指引註 b（v.1 2026 改版重點，原文以紅字標示）</b>：' +
      '<b>建議 preoperative RT 完到手術之間至少間隔 3–6 週，較能有效減少 wound complication</b>' +
      '（依最新 NCCN guideline 建議）。</div>');
    h = h.replace('id="st_s5"', 'id="st_s5" class="hidden"');

    // Step 6 — 手術切緣
    h += connH('st_c6');
    h += step('st_s6', '6', '手術切緣 Surgical margin',
      opt('rst', 'R0', 'R0 resection', '切緣陰性') +
      opt('rst', 'R1', 'R1 resection', '顯微鏡下切緣陽性 → 先 image work-up'));
    h = h.replace('id="st_s6"', 'id="st_s6" class="hidden"');

    // Step 4u — 不可切除：術前治療後再評估
    h += connH('st_c4u');
    h += step('st_s4u', '4', '術前治療後之再評估（不可切除侷限性 STS）',
      opt('reass', 'res2', '轉為可切除 Resectable', '→ 回到「可切除侷限性 STS」流程') +
      opt('reass', 'unres2', '仍不可切除 Unresectable', '→ 局部與姑息處置'),
      '<div class="note"><b>指引第 4 頁圖示</b>：Unresectable Localized STS → ' +
      '<b>Neoadjuvant C/T ± R/T　<u>或</u>　R/T</b> → 再評估，可能結果為 <b>Resectable</b>、' +
      '<b>Amputation?</b>、或 <b>Unresectable</b>。<b>「Amputation?」於原圖即以問號呈現</b>，' +
      '屬須經 MDT 個別討論之選項，未列為建議處置。</div>');
    h = h.replace('id="st_s4u"', 'id="st_s4u" class="hidden"');

    // ===== RPS 分支 =====
    h += connH('st_c2r');
    h += step('st_s2r', '2', '可切除性 Resectability（原發性腹膜後肉瘤 RPS）',
      opt('rpsres', 'res', '可切除 Resectable', '指引第 10–11 頁') +
      opt('rpsres', 'border', '臨界可切除 Borderline resectable', '指引第 11 頁') +
      opt('rpsres', 'unres', '不可切除 Unresectable', '指引第 12 頁'),
      rpsDefHtml());
    h = h.replace('id="st_s2r"', 'id="st_s2r" class="hidden"');

    // 建議處置 + 追蹤
    h += '<div class="flow-rec rec-idle" id="st_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="st_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="stReset()">重置</button></div>';
    h += '</div>'; // stPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function stSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function stShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function stClearSel(ids) {
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

  /* ---------- 追蹤區塊（指引第 3、5 頁）---------- */
  function renderFollowup(type) {
    var el = document.getElementById('st_fu');
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤 Follow-up（指引第 3、5 頁 · For localized STS disease）</div><ul class="fu-list">' +
        '<li><b>原發部位</b>：<b>術後基準（baseline）與定期影像</b>——<b>MRI／CT／超音波／X 光</b>' +
        '（Post-op baseline and periodic imaging of primary site）。</li>' +
        '<li><b>胸部影像</b>：<b>每 3–6 個月一次，共 2–3 年</b>；之後<b>每 6–12 個月一次，共 2 年</b>；<b>之後每年一次</b>。</li>' +
        '<li><b>高惡性度 STS（High grade STS）</b>：<b>前 2 年每 3–4 個月</b>影像追蹤一次。</li>' +
        '<li><b>指引註 d</b>：影像<b>包含 chest CT 或 CXR</b>，<b>至少每半年到一年</b>一次' +
        '（v.1 2026 改版明列之 chest 影像追蹤頻率）。</li>' +
        '</ul>';
    } else if (type === 'rps_curative') {
      h = '<div class="fu-label">追蹤 Follow-up（指引第 11 頁 · RPS 註 3）</div><ul class="fu-list">' +
        '<li><b>影像追蹤之模式（modality）依<u>組織型態</u>與<u>醫師選擇</u>而定</b>' +
        '（The modality of image follow-up is based on the histology and physician’s choice）。' +
        '<b>本院指引未對 RPS 指定固定之追蹤影像時程</b>。</li>' +
        '<li><b>應考慮長期追蹤</b>——<b>因具<u>晚期復發（late recurrence）</u>之風險</b>' +
        '（Long-term follow-up should be considered due to the risk of late recurrence）。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>治療期間定期評估<b>反應與毒性</b>；疾病進展 → 依上方選單進入<b>次一線治療</b>。</li>' +
        '<li><b>鼓勵加入臨床試驗</b>（指引第 6 頁：局部無法手術或轉移性 STS 之病人）。</li>' +
        '<li><b>最佳支持療護（Best supportive care）</b>為指引明列之處置選項之一（指引第 4 頁不可切除流程）。</li>' +
        '<li><b>胸部影像追蹤</b>（指引註 d）：至少<b>每半年到一年</b>一次，含 chest CT 或 CXR。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }
  function result(cls, title, lines, note, fuType, extra) {
    ulRec('st_rec', cls, title, lines, note, extra);
    renderFollowup(fuType);
  }
  function idleRec(title) { ulRec('st_rec', 'rec-idle', title, [], ''); renderFollowup(null); }

  /* ---------- 主渲染 ---------- */
  function stRender() {
    var s = stSt;
    var isSts = s.type === 'sts', isRps = s.type === 'rps';

    stShow('st_c2', isSts); stShow('st_s2', isSts);

    var loc = isSts && s.scope === 'loc';
    stShow('st_c3', loc); stShow('st_s3', loc);

    var locRes = loc && s.res === 'res';
    stShow('st_c4', locRes); stShow('st_s4', locRes);

    var g23 = locRes && s.grade === 'g23';
    stShow('st_c5', g23); stShow('st_s5', g23);

    // 切緣步驟：G1 直接手術後即有切緣；G2/3 須先選定策略（兩條策略皆導向手術）
    var showMargin = locRes && (s.grade === 'g1' || (g23 && !!s.strat));
    stShow('st_c6', showMargin); stShow('st_s6', showMargin);

    var locUnres = loc && s.res === 'unres';
    stShow('st_c4u', locUnres); stShow('st_s4u', locUnres);

    stShow('st_c2r', isRps); stShow('st_s2r', isRps);

    renderRec();
  }

  function renderRec() {
    var s = stSt;
    if (!s.type) { idleRec('請選擇步驟 1（肉瘤類型與原發部位）'); return; }

    /* ===== RPS（指引第 9–12 頁）===== */
    if (s.type === 'rps') {
      if (!s.rpsres) { idleRec('請選擇步驟 2（RPS 之可切除性）'); return; }
      if (s.rpsres === 'res') {
        result('rec-elective', '可切除之腹膜後肉瘤（RPS）→ MDT 手術規劃 → 手術 → MDT 術後處置討論', [
          '<b>① MDT 討論以進行手術規劃</b>（MDT discussion for surgical planning）。' + rpsMdtNote(),
          '<b>② 手術：應盡可能達成 <u>en bloc 整塊切除</u></b>（En bloc resection should be achieved if possible，指引註 2）。',
          '<b>③ 術後再次 MDT 討論</b>（MDT discussion for post-operative management）——' +
          '<b>術前之 MDT 討論即有助於預先擬定術後處置策略，包括是否使用輔助放療</b>。',
          '<b>④ 輔助治療（Adjuvant Tx）</b>：<b>應依<u>手術所見與病理報告</u>決定</b>' +
          '（Post-operative treatment [radiotherapy/chemotherapy] should be based on surgical findings and pathology report）。' +
          '<b>輔助放療與化療之證據有限，惟可依個案討論</b>（The evidence for adjuvant radiotherapy and chemotherapy is limited ' +
          'but could be discussed on an individual basis，指引註 2）。',
          '<b>⚠ 術前放療（Neoadjuvant RT）：<u>不常規建議</u></b>——' +
          '<b>惟依 <span class="rx">STRASS</span> 試驗之<u>亞組分析</u>與 off-trial <span class="rx">STREXIT</span> 資料，' +
          '<u>可考慮</u>用於<u>分化良好脂肪肉瘤（WD LPS）</u>或<u>其他 G1–2 之肉瘤</u></b>（指引註 2、參考文獻 5、6）。' +
          '<b>術前放療與化療之整體證據有限</b>（The evidence of neoadjuvant radiotherapy and chemotherapy is limited）。'
        ], '指引第 10–11 頁：Resectable RPS → MDT discussion for surgical planning<sup>1,2</sup> → Surgery → ' +
          'MDT discussion<sup>1</sup> for post-operative management → Adjuvant Tx<sup>2</sup> → Follow-up<sup>3</sup>。' +
          '｜STRASS 主要試驗結果為陰性（Bonvalot, Lancet Oncol 2020），本院之「可考慮」係依其亞組分析與 STREXIT（Callegaro, Ann Surg 2023）。',
          'rps_curative', rpsDefHtml());
        return;
      }
      if (s.rpsres === 'border') {
        result('rec-elective', '臨界可切除之腹膜後肉瘤（RPS）→ 先由 MDT 判定可切除性', [
          '<b>MDT 討論以判定可切除性</b>（MDT discussion for Resectability）。' + rpsMdtNote(),
          '<b>判定為可切除</b> → 依<b>可切除 RPS</b> 之處置（Refer to resectable tx）——' +
          '請於<b>步驟 2</b> 改選「可切除 Resectable」以取得完整建議。',
          '<b>判定為不可切除</b> → 依<b>不可切除 RPS</b> 之處置（Refer to unresectable tx）——' +
          '請於<b>步驟 2</b> 改選「不可切除 Unresectable」。',
          '<b>本院指引於此節點<u>未列出任何治療處置</u></b>：臨界可切除之流程圖僅有「MDT 判定 → 導向可切除或不可切除」兩條出口，' +
          '<b>未載明降階（downstaging）之術前治療處方</b>。'
        ], '指引第 11 頁：Borderline Resectable RPS → MDT discussion<sup>1</sup> for Resectability → ' +
          'Resectable（Refer to resectable tx）／Unresectable（Refer to unresectable tx）。',
          null, rpsDefHtml());
        return;
      }
      // unres
      result('rec-nonop', '不可切除之腹膜後肉瘤（RPS）→ MDT 評估姑息手術之適應症', [
        '<b>MDT 討論以評估<u>姑息手術之適應症</u></b>' +
        '（MDT discussion for evaluating the indication of palliative surgery）。' + rpsMdtNote(),
        '<b>指引圖示之兩條出口</b>：<b>①「姑息手術 Palliative surgery」</b>；' +
        '<b>②「全身治療／放射治療 Systemic treatment / Radiotherapy」</b>。',
        '<b>全身治療之處方選單</b>見下方（本院指引第 6 頁之姑息性全身治療建議，適用於局部無法手術或轉移性 STS）。'
      ], '指引第 12 頁：Unresectable RPS → MDT discussion<sup>1</sup> for evaluating the indication of palliative surgery → ' +
        'Palliative surgery ／ Systemic treatment / Radiotherapy。',
        'palliative', palliativeSystemicPanel());
      return;
    }

    /* ===== STS ===== */
    if (!s.scope) { idleRec('請選擇步驟 2（疾病範圍）'); return; }

    /* --- 轉移性（Stage IV，指引第 5–6 頁）--- */
    if (s.scope === 'met') {
      result('rec-nonop', '轉移性軟組織肉瘤（Stage IV）→ 依個案並列之全身性、局部與姑息處置', [
        '<b>本院指引第 5 頁對轉移性 STS 之處置<u>全部以「± Δ」並列呈現，未指定順序或首選</u></b>：' +
        '<b>± 手術（Surgery）</b>、<b>± 放射治療（Radiotherapy）</b>、<b>± 全身性治療（Systemic therapy）</b>、' +
        '<b>± 姑息治療（Palliative treatment）</b>、<b>± 其他局部治療（other local therapy）</b>。',
        '<b>其他局部治療（指引註 d）</b>：包括<b>射頻燒灼（radiofrequency ablation）、冷凍消融（cryoablation）</b>等。',
        '<b>治療前評估與影像同侷限性疾病</b>（指引第 5 頁之 Pre-treatment management 與第 3 頁完全相同）——見上方步驟 2 之評估區塊。',
        '<b>全身性治療之完整處方選單</b>見下方（指引第 6 頁）。'
      ], '指引第 5 頁：For metastatic STS disease (Stage IV) → Pre-treatment management（同侷限性疾病之影像與切片原則）→ ' +
        'Treatment：± Surgery ／ ± Radiotherapy ／ ± Systemic therapy ／ ± Palliative treatment ／ ± other local therapy<sup>d</sup>。' +
        '｜姑息性全身治療處方見指引第 6 頁。',
        'palliative', palliativeSystemicPanel());
      return;
    }

    /* --- 侷限性（Stage I–III）--- */
    if (!s.res) { idleRec('請選擇步驟 3（可切除性）'); return; }

    /* 不可切除（指引第 4 頁下半）*/
    if (s.res === 'unres') {
      if (!s.reass) {
        result('rec-elective', '不可切除之侷限性 STS → 先行術前治療，再評估可切除性', [
          '<b>指引圖示之並列選項</b>：<b>①「Neoadjuvant C/T ± R/T」</b>　<b>或</b>　<b>②「R/T」（單獨放療）</b>' +
          '——<b>兩者為 or 並列，未指定首選</b>。',
          '<b>治療後再評估</b>，指引圖示之三條出口為：<b>Resectable</b>（→ 依可切除流程）、' +
          '<b>Amputation?</b>（<b>原圖即以問號呈現</b>，須經 MDT 個別討論）、<b>Unresectable</b>（→ 局部與姑息處置）。',
          '請於<b>步驟 4</b> 選擇再評估之結果。'
        ], '指引第 4 頁：Unresectable Localized STS → Neoadjuvant C/T ± R/T　or　R/T → Resectable ／ Amputation? ／ Unresectable。',
          null);
        return;
      }
      if (s.reass === 'res2') {
        result('rec-elective', '術前治療後<b>轉為可切除</b> → 依「可切除侷限性 STS」流程處置', [
          '<b>指引圖示</b>：Resectable → <b>「See resectable Localized STS」</b>——' +
          '<b>直接回到可切除流程</b>，不另立處方。',
          '請於<b>步驟 3</b> 改選「可切除 Resectable」，並於步驟 4 選擇分級與風險因子，以取得完整建議與追蹤方式。',
          '<b>⚠ 已接受術前放療者</b>：<b>建議 preoperative RT 完到手術之間至少間隔 3–6 週</b>，' +
          '較能有效減少 wound complication（指引註 b，v.1 2026 改版重點）。'
        ], '指引第 4 頁：Unresectable Localized STS → （Neoadjuvant C/T ± R/T or R/T）→ Resectable → See resectable Localized STS。',
          null);
        return;
      }
      // unres2
      result('rec-nonop', '術前治療後<b>仍不可切除</b> → 局部與姑息處置（指引圖示之並列選單）', [
        '<b>R/T</b>——<b>若先前未曾照射</b>（R/T if not previously irradiated）。',
        '<b>C/T</b>——<b>若先前未曾給予</b>（C/T if not previously given）。',
        '<b>姑息手術 Palliative surgery</b>。',
        '<b>其他局部治療 Other local therapy</b><sup>a</sup>——<b>包括射頻燒灼（radiofrequency ablation）、' +
        '冷凍消融（cryoablation）</b>等（此項於指引原圖<b>以紅字標示</b>，為改版重點）。',
        '<b>最佳支持療護 Best supportive care</b>。',
        '<b>以上五項於指引圖中為<u>並列選單</u>，未指定順序或首選。</b>'
      ], '指引第 4 頁：Unresectable Localized STS → Unresectable → R/T if not previously irradiated ／ ' +
        'C/T if not previously given ／ Palliative surgery ／ Other local therapy<sup>a</sup> ／ Best supportive care。' +
        '｜註 a：other local therapy includes radiofrequency ablation, cryoablation…',
        'palliative', palliativeSystemicPanel());
      return;
    }

    /* 可切除（指引第 4 頁上半）*/
    if (!s.grade) { idleRec('請選擇步驟 4（組織學分級與風險因子）'); return; }

    // Grade 2/3：須先選策略
    if (s.grade === 'g23' && !s.strat) {
      result('rec-elective', 'Grade 2／3（或 ≥5cm，或術前確認無法達乾淨切緣）→ 選擇治療策略', [
        '<b>指引圖示之兩條<u>平行</u>路徑</b>：<b>①「Surgery」（直接手術）</b>　<b>或</b>　' +
        '<b>②「Neoadjuvant RT or C/T ± RT」→「Surgery」</b>。<b>兩者為 or 並列，未指定首選。</b>',
        '<b>兩條路徑<u>匯流於同一組切緣結果</u></b>（R0／R1），後續處置相同。',
        '<b>⚠ 選擇術前放療者</b>：<b>建議 preoperative RT 完到手術之間至少間隔 3–6 週，較能有效減少 wound complication</b>' +
        '（指引註 b，v.1 2026 改版重點，原文以紅字標示；依最新 NCCN guideline 建議）。',
        '請於<b>步驟 5</b> 選擇策略，再於<b>步驟 6</b> 選擇手術切緣。'
      ], '指引第 4 頁：Resectable Localized STS → Grade 2/3<sup>a</sup> or large tumor size (≥5 cm) or clean margin ' +
        'unattainable confirmed preoperatively → Surgery　or　Neoadjuvant RT or C/T ± RT → Surgery<sup>b</sup>。',
        null);
      return;
    }

    if (!s.rst) { idleRec('請選擇步驟 6（手術切緣 R0／R1）'); return; }

    var neoDone = (s.grade === 'g23' && s.strat === 'neo');
    var planTxt = neoDone ? '術前輔助治療（RT 或 C/T ± RT）後手術' : '手術';

    /* Grade 1 */
    if (s.grade === 'g1') {
      if (s.rst === 'R0') {
        result('rec-elective', 'Grade 1 · 手術 · <b>R0 切除</b> → MDT 風險評估<b>或</b>追蹤', [
          '<b>指引圖示</b>：Grade 1 → Surgery → R0 resection → <b>「MDT risk assessment <u>or</u> Follow up」</b>。',
          '<b>此二者為並列選項</b>——<b>本院指引於 Grade 1 且 R0 之情形，<u>未要求輔助治療</u></b>，' +
          '亦未列出任何輔助放療或化療之處方。',
          '<b>對照 Grade 2／3 之 R0</b>：後者明確導向「<b>MDT risk assessment <u>for adjuvant R/T ± C/T</u></b>」，' +
          '<b>本分支則否</b>——此為兩個分級在 R0 後最主要的差異。',
          '追蹤方式見下方。'
        ], '指引第 4 頁：Resectable Localized STS → Grade 1<sup>a</sup> → Surgery → R0 resection → ' +
          'MDT risk assessment or Follow up。',
          'curative');
        return;
      }
      // R1
      result('rec-elective', 'Grade 1 · 手術 · <b>R1 切除</b> → 影像檢查 → 再切除<b>或</b>考慮放療', [
        '<b>① Image work-up</b>——<b>指引圖示於 R1 之後、處置之前，明確插入影像檢查此一步驟</b>。',
        '<b>② 之後之並列選項</b>：<b>「Re-resection（再切除）」</b>　<b>或</b>　<b>「Consider R/T（考慮放療）」</b>。',
        '<b>⚠ 注意本分支<u>不含化療</u></b>：Grade 1 之 R1 僅列「Re-resection or Consider R/T」；' +
        '<b>Grade 2／3 之 R1 才另列「Adjuvant R/T」與「MDT risk assessment for adjuvant R/T ± C/T」</b>。',
        mdtNote
      ], '指引第 4 頁：Grade 1<sup>a</sup> → Surgery → R1 resection → Image work-up → Re-resection or Consider R/T。',
        'curative');
      return;
    }

    /* Grade 2/3 */
    if (s.rst === 'R0') {
      result('rec-elective', 'Grade 2／3（或 ≥5cm／切緣難達）· ' + planTxt + ' · <b>R0 切除</b> → MDT 風險評估以決定輔助治療', [
        '<b>指引圖示</b>：R0 resection → <b>「MDT risk assessment <u>for adjuvant R/T ± C/T</u>」</b>。',
        '<b>與 Grade 1 之 R0 之差異</b>：Grade 1 為「MDT risk assessment <b>or</b> Follow up」（<b>不指向輔助治療</b>）；' +
        '<b>本分支則明確為「<u>for adjuvant R/T ± C/T</u>」</b>——即 MDT 評估的目的就是決定要不要做輔助放療與化療。',
        '<b>本院指引<u>未列出輔助放療之劑量或化療處方</u></b>，亦未指定何種風險因子應觸發輔助治療——' +
        '<b>此判斷交由 MDT 依個案決定</b>。' + mdtNote,
        (neoDone ? '<b>本路徑已接受術前輔助治療</b>（RT 或 C/T ± RT）——指引註 b：' +
          '<b>preoperative RT 完到手術之間至少間隔 3–6 週</b>，較能有效減少 wound complication。'
          : '<b>本路徑為直接手術</b>（未接受術前輔助治療）；指引圖中直接手術與術前輔助治療後手術<b>匯流至相同之 R0／R1 處置</b>。')
      ], '指引第 4 頁：Grade 2/3<sup>a</sup> or large tumor size (≥5 cm) or clean margin unattainable confirmed preoperatively → ' +
        '（Surgery　or　Neoadjuvant RT or C/T ± RT → Surgery<sup>b</sup>）→ R0 resection → ' +
        'MDT risk assessment for adjuvant R/T ± C/T。',
        'curative');
      return;
    }
    // R1
    result('rec-elective', 'Grade 2／3（或 ≥5cm／切緣難達）· ' + planTxt + ' · <b>R1 切除</b> → 影像檢查 → 三項並列選項', [
      '<b>① Image work-up</b>——<b>指引圖示於 R1 之後、處置之前，明確插入影像檢查此一步驟</b>。',
      '<b>② 之後之<u>三項</u>並列選項</b>（原圖以 or 並列）：<b>「Re-resection（再切除）」</b>　<b>或</b>　' +
      '<b>「Adjuvant R/T（輔助放療）」</b>　<b>或</b>　' +
      '<b>「MDT risk assessment for adjuvant R/T ± C/T（MDT 風險評估以決定輔助放療 ± 化療）」</b>。',
      '<b>與 Grade 1 之 R1 之差異</b>：Grade 1 僅有<b>兩項</b>（Re-resection or Consider R/T）且<b>不含化療</b>；' +
      '<b>本分支多出「Adjuvant R/T」與含化療之「MDT risk assessment for adjuvant R/T ± C/T」</b>。',
      '<b>本院指引未列出輔助放療劑量或化療處方</b>，交由 MDT 依個案決定。' + mdtNote,
      (neoDone ? '<b>本路徑已接受術前輔助治療</b>——若已照射過，再次放療之可行性須經 MDT 評估。'
        : '<b>本路徑為直接手術</b>（未接受術前輔助治療）。')
    ], '指引第 4 頁：Grade 2/3<sup>a</sup> … → （Surgery　or　Neoadjuvant RT or C/T ± RT → Surgery<sup>b</sup>）→ ' +
      'R1 resection → Image work-up → Re-resection or Adjuvant R/T or MDT risk assessment for adjuvant R/T ± C/T。',
      'curative');
  }

  /* ---------- 事件 ---------- */
  function stPick(key, val, btn) {
    stSel(btn);
    var s = stSt;
    if (key === 'type') {
      s.type = val;
      s.scope = s.res = s.grade = s.strat = s.rst = s.reass = s.rpsres = null;
      stClearSel(['st_s2', 'st_s3', 'st_s4', 'st_s5', 'st_s6', 'st_s4u', 'st_s2r']);
    } else if (key === 'scope') {
      s.scope = val;
      s.res = s.grade = s.strat = s.rst = s.reass = null;
      stClearSel(['st_s3', 'st_s4', 'st_s5', 'st_s6', 'st_s4u']);
    } else if (key === 'res') {
      s.res = val;
      s.grade = s.strat = s.rst = s.reass = null;
      stClearSel(['st_s4', 'st_s5', 'st_s6', 'st_s4u']);
    } else if (key === 'grade') {
      s.grade = val;
      s.strat = s.rst = null;
      stClearSel(['st_s5', 'st_s6']);
    } else if (key === 'strat') {
      s.strat = val;
      s.rst = null;
      stClearSel(['st_s6']);
    } else if (key === 'rst') {
      s.rst = val;
    } else if (key === 'reass') {
      s.reass = val;
    } else if (key === 'rpsres') {
      s.rpsres = val;
    }
    stRender();
  }

  function stReset() {
    for (var k in stSt) { if (stSt.hasOwnProperty(k)) stSt[k] = null; }
    var root = document.getElementById('stPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('st_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    stRender();
  }

  function initStsPathway() { stReset(); }

  // 匯出
  global.stsPathwayHTML = stsPathwayHTML;
  global.initStsPathway = initStsPathway;
  global.stPick = stPick;
  global.stReset = stReset;
})(window);
