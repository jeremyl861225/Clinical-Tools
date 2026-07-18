/* ============================================================
   肝細胞癌治療互動決策流程 Hepatocellular Carcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 肝細胞癌診療指引
   版次 20（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000008
   ※ 流程結構依指引第 3 頁之決策圖判讀（非文字順序）：
     第一個分叉為 PVT／肝外轉移，其次才是 Child-Pugh。
     「1-3／≧4」僅掛於 PVT(-) + Child A,B；「Within／Beyond UCSF」僅掛於 PVT(-) + Child C。
   ※ 系統性治療 1L／2L 選單依第 4 頁 Figure 1，置於建議處置內（臨床醫師知道自己在第幾線，
     需要的是完整選單而非流程圖）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var hcSt = {
    ext: null,   // pvtneg | pvtpos      （PVT／肝外轉移）
    cp: null,    // ab | c               （Child-Pugh）
    num: null,   // n13 | n4             （腫瘤數目；僅 pvtneg + ab）
    ucsf: null   // within | beyond      （UCSF 標準；僅 pvtneg + c）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="hcPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 縮寫對照 ---------- */
  function abbrHtml() {
    return '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>PVT</b> — portal vein thrombosis 門靜脈栓塞</li>' +
      '<li><b>PTA</b> — percutaneous tumor ablation 經皮腫瘤消融</li>' +
      '<li><b>TACE</b> — trans-catheter arterial chemoembolization 經導管動脈化學栓塞</li>' +
      '<li><b>LT</b> — liver transplantation 肝臟移植</li>' +
      '<li><b>EBRT</b> — external-beam radiotherapy 體外放射治療</li>' +
      '<li><b>SBRT</b> — stereotactic body radiotherapy 立體定位放射治療</li>' +
      '<li><b>HAIC</b> — hepatic arterial infusion chemotherapy 肝動脈灌注化學治療</li>' +
      '<li><b>SIRT</b> — selective internal radiation therapy 選擇性體內放射治療</li>' +
      '</ul></details>';
  }

  /* ---------- 指引第 3 頁註 1–6 ---------- */
  function notesHtml(keys) {
    var N = {
      1: '<b>註 1</b>　依個別病人之<b>腫瘤負荷與功能儲備</b>而定。',
      2: '<b>註 2</b>　第一線建議：<span class="rx">Atezolizumab/bevacizumab</span>、<span class="rx">Durvalumab/tremelimumab</span>、<span class="rx">Ipilimumab/nivolumab</span>、<span class="drug">Sorafenib</span> 或 <span class="drug">Lenvatinib</span>。第二線建議：<span class="drug">Regorafenib</span>、<span class="drug">Cabozantinib</span>、<span class="drug">Nivolumab</span>、<span class="drug">Pembrolizumab</span>、<span class="rx">Nivolumab + ipilimumab</span>，或 <span class="drug">Ramucirumab</span>（<b>僅限 AFP ≥ 400 ng/mL</b>）。詳見下方 Figure 1。',
      3: '<b>註 3</b>　<b>HAIC 應保留給以肝臟為主（liver-predominant）之疾病。</b>',
      4: '<b>註 4</b>　<b>BCLC A／B 期</b>：PTA 無法執行時可考慮 EBRT；SBRT 與 hypofractionated RT 之選擇應依<b>正常組織安全性</b>調整。<b>BCLC C 期</b>：EBRT 可作為<b>合併治療之一環</b>、用於<b>症狀緩解</b>，或用於<b>寡轉移（oligometastasis）</b>。',
      5: '<b>註 5</b>　當局部治療不適合，且呈現<b>瀰漫性、浸潤性或廣泛雙葉肝侵犯</b>時，可考慮系統性治療。',
      6: '<b>註 6</b>　<b>TACE 合併</b> <span class="rx">durvalumab + bevacizumab</span>、<span class="rx">pembrolizumab + lenvatinib</span> 或 <span class="rx">atezolizumab + bevacizumab</span> 可考慮之，因具潛在<b>無惡化存活（PFS）效益</b>。'
    };
    var out = keys.map(function (k) { return '<li>' + N[k] + '</li>'; }).join('');
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">指引註解</span>' +
      '<span class="rx-sub">第 3 頁</span></div><ul class="rx-items">' + out + '</ul></div>';
  }

  /* ---------- Figure 1：晚期 HCC 之系統性治療 ---------- */
  function fig1Html() {
    return '<details class="kps-details"><summary>Figure 1：晚期肝細胞癌之系統性治療（第 4 頁）▸</summary>' +
      rxLine('第一線 1L Therapy', '', [
        '<span class="rx">Anti-PD1/PD-L1 combinations</span>　<b>註 1</b>：包含但不限於 <span class="rx">atezolizumab + bevacizumab</span>、<span class="rx">durvalumab + tremelimumab</span>、<span class="rx">ipilimumab + nivolumab</span>，或由主治醫師判斷適當之<b>其他多激酶抑制劑 + PD1/PD-L1 合併</b>。',
        '<span class="drug">Sorafenib</span> 或 <span class="drug">Lenvatinib</span>　<b>註 2</b>：<b>當 anti-PD1/PD-L1 合併治療不可行或不適當（如有禁忌症）時</b>。',
        '<b>Clinical Trial</b>（臨床試驗）'
      ]) +
      rxLine('第二線 2L Therapy', '', [
        '<span class="drug">Regorafenib</span>',
        '<span class="drug">Ramucirumab</span>　<b>僅限 AFP ≥ 400 ng/mL</b>',
        '<span class="drug">Cabozantinib</span>',
        '<span class="drug">Anti-PD1</span> 或 <span class="drug">Anti-PD-L1</span>',
        '<span class="rx">Nivolumab + Ipilimumab</span>',
        '<b>Clinical Trial</b>（臨床試驗）'
      ]) +
      '<div class="note">Figure 1 中<b>實線箭頭</b>代表<b>依臨床試驗數據</b>，<b>灰色虛線箭頭</b>代表<b>依專家意見</b>。' +
      '本頁以選單形式呈現：臨床上醫師已知病人所在線別，需要的是該線別的完整選項，而非逐步分流。</div>' +
      '</details>';
  }

  /* ---------- 追蹤（指引第 2 頁 四、）——與胃癌同款 fu-label／fu-list ---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤與監測 Follow-up（指引第 2 頁）</div>' +
      '<ul class="fu-list">' +
      '<li><b>完成所有治療後 3 個月內</b>：一次 AFP 及影像（超音波或 CT/MRI）。</li>' +
      '<li><b>1 年內 ≥3 次</b> AFP 及影像；<b>PIVKA-II 一年兩次</b>。</li>' +
      '<li>「所有治療」含手術切除、局部消融、肝臟移植、TACE、放射治療及其他（肝動脈化療、化療、標靶、免疫治療等）。</li>' +
      '<li><b>肝炎治療</b>：除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。</li>' +
      '<li>特殊狀況經<b>肝癌多專科團隊討論</b>取得共識；免疫治療副作用照護參院內「癌症免疫治療藥物照護原則」；可與病人討論<b>臨床試驗</b>。</li>' +
      '</ul>';
  }

  /* ---------- 診斷與分期（指引第 1–2 頁）——安靜的參考區塊 ---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>診斷與分期檢查（指引第 1–2 頁）▸</summary>' +
      '<div class="dx-h">一、肝細胞癌診斷（符合任一）</div>' +
      '<ul class="dx-list">' +
      '<li><b>臨床診斷</b>：慢性肝炎／肝硬化／曾罹肝癌之病人，tumor &gt; 1cm，且一種相符影像（CT／MRI／CEUS）。</li>' +
      '<li><b>病理診斷</b>：手術或切片之病理／細胞學證實。</li>' +
      '<li>開刀切除後病理若<b>非</b>肝細胞癌則排除；特殊情形可提肝癌團隊會議。</li>' +
      '</ul>' +
      '<div class="dx-h">二、肝癌分期檢查</div>' +
      '<ul class="dx-list">' +
      '<li>CT／MRI／CEUS（任一）為主要影像分期依據。</li>' +
      '<li>參考 Child-Pugh score 與 performance status 以確認 <b>BCLC 分期</b>。</li>' +
      '</ul>' +
      '<div class="dx-h">三、高危險群追蹤（第 2 頁）</div>' +
      '<ul class="dx-list">' +
      '<li>HBsAg 或 anti-HCV 陽性：每 6–12 個月 AFP ＋ 超音波或 CT/MRI。</li>' +
      '<li>肝硬化：每 3–6 個月 AFP ＋ 超音波或 CT/MRI；PIVKA-II 一年兩次。</li>' +
      '</ul>' +
      '</details>';
  }

  /* ---------- 建議處置內容 ---------- */
  function recFor(s) {
    // PVT(+) 或肝外轉移
    if (s.ext === 'pvtpos') {
      if (s.cp === 'ab') {
        return {
          cls: 'rec-elective',
          title: 'Multi-modality therapy 多模式治療',
          detail: rxLine('治療選項', 'PVT(+) 或肝外轉移 · Child A,B', [
            '<b>Systemic therapy</b><sup>1,2</sup>　系統性治療',
            '<b>TACE</b><sup>1</sup>',
            '<b>Resection</b><sup>1</sup>　手術切除',
            '<b>HAIC</b><sup>1,3</sup>　肝動脈灌注化學治療',
            '<b>EBRT</b><sup>1,4</sup>　體外放射治療',
            '<b>SIRT</b>　選擇性體內放射治療'
          ]) + notesHtml([1, 2, 3, 4]) + fig1Html(),
          note: '本組即 <b>BCLC C 期</b>之範疇。指引將此六項<b>並列為多模式治療</b>，未指定單一首選；實際選擇依<b>個別病人之腫瘤負荷與功能儲備</b>（註 1）。'
        };
      }
      return {
        cls: 'rec-nonop',
        title: 'EBRT 或最佳支持療法',
        detail: rxLine('治療選項', 'PVT(+) 或肝外轉移 · Child C', [
          '<b>EBRT</b><sup>1,4</sup>　體外放射治療',
          '<b>Best supportive care</b>　最佳支持療法'
        ]) + notesHtml([1, 4]),
        note: '肝功能為 <b>Child C</b> 且已有 PVT／肝外轉移者，指引僅列此二項（以 <b>or</b> 並列）。相當於 <b>BCLC D 期</b>之處置。'
      };
    }

    // PVT(-) 且無肝外轉移
    if (s.cp === 'ab') {
      if (s.num === 'n13') {
        return {
          cls: 'rec-elective',
          title: '局部療法為主（可含根治性治療）',
          detail: rxLine('治療選項', 'PVT(-)、無肝外轉移 · Child A,B · 腫瘤 1–3 顆', [
            '<b>Resection</b>　手術切除',
            '<b>LT</b>　肝臟移植',
            '<b>PTA</b>　經皮腫瘤消融',
            '<b>TACE ± Immunotherapy-based combination therapy</b><sup>6</sup>',
            '<b>EBRT</b><sup>4</sup>',
            '<b>SIRT</b>',
            '<b>HAIC</b><sup>1,3</sup>',
            '<b>Systemic therapy</b><sup>5</sup>'
          ]) + notesHtml([1, 3, 4, 5, 6]) + fig1Html(),
          note: '此組含<b>根治性選項</b>（切除、移植、消融）。<b>LT 亦列於本組</b>——指引在 Child A,B 且腫瘤 1–3 顆時即將移植列為選項，不限於 Child C。'
        };
      }
      return {
        cls: 'rec-elective',
        title: '局部區域療法 ± 系統性治療',
        detail: rxLine('治療選項', 'PVT(-)、無肝外轉移 · Child A,B · 腫瘤 ≧4 顆', [
          '<b>Resection</b>　手術切除',
          '<b>TACE ± Immunotherapy-based combination therapy</b><sup>6</sup>',
          '<b>SIRT</b>',
          '<b>HAIC</b><sup>1,3</sup>',
          '<b>Systemic therapy</b><sup>5</sup>'
        ]) + notesHtml([1, 3, 5, 6]) + fig1Html(),
        note: '與 1–3 顆組相比，本組<b>不列 LT 與 PTA</b>，亦<b>不列 EBRT</b>——這是指引圖上的實質差異，非省略。'
      };
    }

    // PVT(-) + Child C
    if (s.ucsf === 'within') {
      return {
        cls: 'rec-elective',
        title: 'LT 肝臟移植',
        detail: rxLine('治療選項', 'PVT(-)、無肝外轉移 · Child C · 符合 UCSF 標準', [
          '<b>LT</b>　肝臟移植'
        ]) +
        '<div class="note"><b>本指引採 UCSF 標準（非 Milan criteria）</b>作為 Child C 病人之移植門檻判定。' +
        'UCSF 標準較 Milan 寬鬆；指引第 3 頁圖上僅標示「Within UCSF／Beyond UCSF」，未於本文複述其數值定義。</div>',
        note: '<b>Child C 且符合 UCSF 者，指引僅列肝臟移植一項</b>——移植同時處理腫瘤與末期肝病。'
      };
    }
    return {
      cls: 'rec-nonop',
      title: 'EBRT 或最佳支持療法',
      detail: rxLine('治療選項', 'PVT(-)、無肝外轉移 · Child C · 超出 UCSF 標準', [
        '<b>EBRT</b><sup>1,4</sup>　體外放射治療',
        '<b>Best supportive care</b>　最佳支持療法'
      ]) + notesHtml([1, 4]),
      note: '<b>Child C 且超出 UCSF 者不列移植</b>；末期肝功能無法承受根治性治療，處置以放療緩解與支持療法為主。'
    };
  }

  /* ---------- 版面（以胃癌流程圖為範本：簡潔開場 → 步驟 → 建議處置在下方）---------- */
  function hccPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院肝細胞癌診療指引 版次 20（2026/06/16，文件編號 50710-2-000008）</b>之互動決策流程。流程結構依<b>指引第 3 頁決策圖</b>判讀——先分「PVT／肝外轉移」，再分肝功能（Child-Pugh）。<b>治療分派以 BCLC 為主，AJCC TNM 僅為解剖分期</b>，兩者不可互換（見分期分頁）。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="hcPath">';

    h += dxHtml() + abbrHtml();

    h += step('hc_s1', '1', '有無門靜脈栓塞（PVT）或肝外轉移？',
      opt('ext', 'pvtneg', 'PVT (−)', '且無肝外轉移') +
      opt('ext', 'pvtpos', 'PVT (+) 或肝外轉移', 'Extrahepatic metastasis'),
      '<div class="note">指引圖上的<b>第一個分叉</b>——先分 PVT／肝外轉移，再分肝功能。</div>');

    h += connH('hc_c1');
    h += step('hc_s2', '2', 'Child-Pugh 分級？',
      opt('cp', 'ab', 'Child A、B', '肝功能保留') +
      opt('cp', 'c', 'Child C', '末期肝功能'));

    h += connH('hc_c2');
    h += step('hc_s3num', '3', '腫瘤數目？',
      opt('num', 'n13', '1–3 顆') +
      opt('num', 'n4', '≧4 顆'));

    h += step('hc_s3ucsf', '3', '是否符合 UCSF 標準？',
      opt('ucsf', 'within', 'Within UCSF', '符合') +
      opt('ucsf', 'beyond', 'Beyond UCSF', '超出'),
      '<div class="note"><b>本指引以 UCSF 標準判定移植門檻，非 Milan criteria。</b></div>');

    // 建議處置與追蹤：置於步驟之後（流程圖下方），與胃癌一致
    h += '<div class="flow-rec rec-idle" id="hc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="hc_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="hcReset()">重置</button></div>';
    h += '</div>'; // hcPath
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function hcRender() {
    var s = hcSt;
    var isNeg = s.ext === 'pvtneg';
    var isPos = s.ext === 'pvtpos';

    show('hc_c1', !!s.ext);
    show('hc_s2', !!s.ext);

    // 第 3 步依分支而異：腫瘤數（PVT- + AB）或 UCSF（PVT- + C）；PVT+ 無第 3 步
    var needNum = isNeg && s.cp === 'ab';
    var needUcsf = isNeg && s.cp === 'c';
    show('hc_c2', needNum || needUcsf);
    show('hc_s3num', needNum);
    show('hc_s3ucsf', needUcsf);

    var done = (isPos && !!s.cp) ||
      (needNum && !!s.num) ||
      (needUcsf && !!s.ucsf);

    var rec = document.getElementById('hc_rec');
    var fu = document.getElementById('hc_fu');
    if (!rec) return;

    if (!done) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }

    var r = recFor(s);
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function hcClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function hcPick(key, val, btn) {
    var s = hcSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'ext') {
      s.ext = val; s.cp = s.num = s.ucsf = null;
      hcClearSel(['hc_s2', 'hc_s3num', 'hc_s3ucsf']);
    } else if (key === 'cp') {
      s.cp = val; s.num = s.ucsf = null;
      hcClearSel(['hc_s3num', 'hc_s3ucsf']);
    } else if (key === 'num') {
      s.num = val;
    } else if (key === 'ucsf') {
      s.ucsf = val;
    }
    hcRender();
  }

  function hcReset() {
    for (var k in hcSt) { if (hcSt.hasOwnProperty(k)) hcSt[k] = null; }
    var root = document.getElementById('hcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('hc_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    hcRender();
  }

  function initHccPathway() { hcReset(); }

  // 匯出
  global.hccPathwayHTML = hccPathwayHTML;
  global.initHccPathway = initHccPathway;
  global.hcPick = hcPick;
  global.hcReset = hcReset;
})(window);
