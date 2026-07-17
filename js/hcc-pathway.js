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

  /* ---------- 縮寫對照（指引第 3 頁）---------- */
  function abbrHtml() {
    return '<details class="kps-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="rx-items">' +
      '<li><b>PVT</b> — portal vein thrombosis 門靜脈栓塞</li>' +
      '<li><b>PTA</b> — percutaneous tumor ablation 經皮腫瘤消融</li>' +
      '<li><b>TACE</b> — trans-catheter arterial chemoembolization 經導管動脈化學栓塞</li>' +
      '<li><b>LT</b> — liver transplantation 肝臟移植</li>' +
      '<li><b>EBRT</b> — external-beam radiotherapy 體外放射治療</li>' +
      '<li><b>SBRT</b> — stereotactic body radiotherapy 立體定位body放射治療</li>' +
      '<li><b>HAIC</b> — hepatic arterial infusion chemotherapy 肝動脈灌注化學治療</li>' +
      '<li><b>SIRT</b> — selective internal radiation therapy 選擇性體內放射治療</li>' +
      '</ul></details>';
  }

  /* ---------- 指引第 3 頁註 1–6 ---------- */
  function notesHtml(keys) {
    var N = {
      1: '<b>註 1</b>　依個別病人之<b>腫瘤負荷與功能儲備</b>而定。',
      2: '<b>註 2</b>　第一線建議：<span class="rec-rx">Atezolizumab/bevacizumab</span>、<span class="rec-rx">Durvalumab/tremelimumab</span>、<span class="rec-rx">Ipilimumab/nivolumab</span>、<span class="rec-drug">Sorafenib</span> 或 <span class="rec-drug">Lenvatinib</span>。第二線建議：<span class="rec-drug">Regorafenib</span>、<span class="rec-drug">Cabozantinib</span>、<span class="rec-drug">Nivolumab</span>、<span class="rec-drug">Pembrolizumab</span>、<span class="rec-rx">Nivolumab + ipilimumab</span>，或 <span class="rec-drug">Ramucirumab</span>（<b>僅限 AFP ≥ 400 ng/mL</b>）。詳見下方 Figure 1。',
      3: '<b>註 3</b>　<b>HAIC 應保留給以肝臟為主（liver-predominant）之疾病。</b>',
      4: '<b>註 4</b>　<b>BCLC A／B 期</b>：PTA 無法執行時可考慮 EBRT；SBRT 與 hypofractionated RT 之選擇應依<b>正常組織安全性</b>調整。<b>BCLC C 期</b>：EBRT 可作為<b>合併治療之一環</b>、用於<b>症狀緩解</b>，或用於<b>寡轉移（oligometastasis）</b>。',
      5: '<b>註 5</b>　當局部治療不適合，且呈現<b>瀰漫性、浸潤性或廣泛雙葉肝侵犯</b>時，可考慮系統性治療。',
      6: '<b>註 6</b>　<b>TACE 合併</b> <span class="rec-rx">durvalumab + bevacizumab</span>、<span class="rec-rx">pembrolizumab + lenvatinib</span> 或 <span class="rec-rx">atezolizumab + bevacizumab</span> 可考慮之，因具潛在<b>無惡化存活（PFS）效益</b>。'
    };
    var out = keys.map(function (k) { return '<li>' + N[k] + '</li>'; }).join('');
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">指引註解</span>' +
      '<span class="rx-sub">第 3 頁</span></div><ul class="rx-items">' + out + '</ul></div>';
  }

  /* ---------- Figure 1：晚期 HCC 之系統性治療 ---------- */
  function fig1Html() {
    return '<details class="kps-details"><summary>Figure 1：晚期肝細胞癌之系統性治療（第 4 頁）▸</summary>' +
      rxLine('第一線 1L Therapy', '', [
        '<span class="rec-rx">Anti-PD1/PD-L1 combinations</span>　<b>註 1</b>：包含但不限於 <span class="rec-rx">atezolizumab + bevacizumab</span>、<span class="rec-rx">durvalumab + tremelimumab</span>、<span class="rec-rx">ipilimumab + nivolumab</span>，或由主治醫師判斷適當之<b>其他多激酶抑制劑 + PD1/PD-L1 合併</b>。',
        '<span class="rec-drug">Sorafenib</span> 或 <span class="rec-drug">Lenvatinib</span>　<b>註 2</b>：<b>當 anti-PD1/PD-L1 合併治療不可行或不適當（如有禁忌症）時</b>。',
        '<b>Clinical Trial</b>（臨床試驗）'
      ]) +
      rxLine('第二線 2L Therapy', '', [
        '<span class="rec-drug">Regorafenib</span>',
        '<span class="rec-drug">Ramucirumab</span>　<b>僅限 AFP ≥ 400 ng/mL</b>',
        '<span class="rec-drug">Cabozantinib</span>',
        '<span class="rec-drug">Anti-PD1</span> 或 <span class="rec-drug">Anti-PD-L1</span>',
        '<span class="rec-rx">Nivolumab + Ipilimumab</span>',
        '<b>Clinical Trial</b>（臨床試驗）'
      ]) +
      '<div class="note">Figure 1 中<b>實線箭頭</b>代表<b>依臨床試驗數據</b>，<b>灰色虛線箭頭</b>代表<b>依專家意見</b>。' +
      '本頁以選單形式呈現：臨床上醫師已知病人所在線別，需要的是該線別的完整選項，而非逐步分流。</div>' +
      '</details>';
  }

  /* ---------- 追蹤（指引第 2 頁 四、）---------- */
  function fuHtml() {
    return '<div class="flow-fu"><div class="fu-h">追蹤與監測 Follow-up</div>' +
      rxLine('治療後追蹤', '第 2 頁 四、（一）', [
        '<b>完成所有治療後 3 個月內</b>應接受一次 <b>AFP</b> 及影像學檢查（超音波或 CT/MRI）。',
        '<b>1 年內應接受 ≥3 次</b> AFP 及影像學檢查（超音波或 CT/MRI）。',
        '<b>PIVKA-II 一年兩次</b>。',
        '<b>註一：「所有治療」包含</b>手術切除、局部消融治療、肝臟移植、TACE、放射治療和其他治療（如肝動脈化療、化學治療、標靶治療、免疫治療等）。'
      ]) +
      rxLine('肝炎治療', '第 2 頁 四、（二）', [
        '<b>除積極處理肝細胞癌外，仍應治療慢性 B 型或 C 型肝炎。</b>'
      ]) +
      '<div class="note">※ 如有其他特殊狀況，須經<b>肝癌多專科團隊討論</b>後取得治療共識。<br>' +
      '※ 免疫治療副作用及照護原則，請參考台大醫院「癌症免疫治療藥物照護原則」相關文件。<br>' +
      '※ 主治醫師可與病人討論參與肝臟局部治療或系統性治療之<b>臨床試驗</b>。</div>' +
      '</div>';
  }

  /* ---------- 診斷與分期（指引第 1 頁）---------- */
  function dxHtml() {
    return '<details class="kps-details"><summary>診斷與分期檢查（第 1 頁）▸</summary>' +
      rxLine('一、肝細胞癌診斷', '符合下列條件任一', [
        '<b>（一）臨床診斷</b>：有<b>慢性肝炎或肝硬化或先前罹患過肝癌</b>的病人，<b>tumor &gt; 1cm</b>，及<b>一種相符合的影像學檢查</b>（CT／MRI／CEUS）。',
        '<b>（二）病理診斷</b>：病理學或細胞學證實（手術或切片）。',
        '<b>※</b> 若腫瘤經開刀切除後，正式病理報告顯示<b>非肝細胞癌，則排除在外</b>。如有特殊情形，可提至肝癌團隊會議討論。'
      ]) +
      rxLine('二、肝癌分期檢查', '', [
        '<b>CT／MRI／CEUS（任一）</b>為主要之影像診斷分期依據。',
        '同時參考 <b>Child-Pugh Score</b> 及 <b>Performance Status</b> 以確認 <b>BCLC 分期</b>。'
      ]) +
      rxLine('三、高危險群追蹤', '第 2 頁 三、', [
        '<b>B 型肝炎表面抗原或 C 型肝炎抗體陽性者</b>：每 <b>6–12 個月</b>作一次 AFP 和超音波或 CT/MRI。',
        '<b>已確診肝硬化病人</b>：每 <b>3–6 個月</b>作一次 AFP 和超音波或 CT/MRI；而<b>一年兩次</b>作 PIVKA-II 檢查。'
      ]) +
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

  /* ---------- 版面 ---------- */
  function hccPathwayHTML() {
    var h = '<div class="flow-wrap" id="hcPath">';

    h += '<div class="flow-src">資料來源：<b>台大醫院 肝細胞癌診療指引 版次 20</b>（2026/06/16 第 87 次癌症醫療委員會修訂通過，文件編號 50710-2-000008）。' +
      '流程結構依<b>第 3 頁決策圖</b>判讀。<b>治療分派請以 BCLC 為主，AJCC TNM 為解剖分期</b>，兩者不可互換（見分期分頁）。</div>';

    h += dxHtml() + abbrHtml();

    h += '<div class="flow-rec rec-idle" id="hc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請依序選擇下列項目</div></div>';
    h += '<div class="flow-fu hidden" id="hc_fu"></div>';

    h += step('hc_s1', '1', '有無門靜脈栓塞（PVT）或肝外轉移？',
      opt('ext', 'pvtneg', 'PVT (-)', '且無肝外轉移') +
      opt('ext', 'pvtpos', 'PVT (+) 或肝外轉移', 'Extrahepatic metastasis'),
      '<div class="note">此為指引圖上的<b>第一個分叉</b>——先分 PVT／肝外轉移，再分肝功能。</div>');

    h += connH('hc_c1');
    h += step('hc_s2', '2', 'Child-Pugh 分級？',
      opt('cp', 'ab', 'Child A, B', '肝功能保留') +
      opt('cp', 'c', 'Child C', '末期肝功能'));

    h += connH('hc_c2');
    h += step('hc_s3num', '3', '腫瘤數目？',
      opt('num', 'n13', '1–3 顆') +
      opt('num', 'n4', '≧4 顆'));

    h += step('hc_s3ucsf', '3', '是否符合 UCSF 標準？',
      opt('ucsf', 'within', 'Within UCSF', '符合') +
      opt('ucsf', 'beyond', 'Beyond UCSF', '超出'),
      '<div class="note"><b>本指引以 UCSF 標準判定移植門檻，非 Milan criteria。</b></div>');

    h += '<div class="flow-actions"><button class="flow-reset" onclick="hcReset()">重設 Reset</button></div>';
    h += '</div>';
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
        '<div class="rec-title">請依序選擇下列項目</div>';
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
