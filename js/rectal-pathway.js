/* ============================================================
   直腸癌治療互動決策流程 Rectal Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 大腸直腸癌診療指引
   版次 21（2026/06/16 癌症醫療委員會修訂通過）
   直腸專屬章節：COL-12(1) ～ COL-12(3)、COL-13（CCRT 處方）、
   COL-14（放射治療適應症）、COL-15（RT settings）、COL-16（放射野與標靶體積）；
   輔助化療與追蹤共用 COL-3；轉移性系統性治療共用 COL-8。
   ※ 結腸（colon）專屬之惡性息肉、CME 等內容見 colon-pathway.js。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var rcSt = {
    entry: null,     // e12 | crmclear | crminv | m1res | m1unres  （COL-12(1) CLINICAL STAGE）
    tn: null,        // tis_n0 … t4_n2   （術後病理 T×N）
    s2: null,        // s2_msi | s2_low | s2_high （COL-3(1) 第 II 期分層）
    nastrat: null,   // na_crt | na_tnt  （COL-12(2) 新輔助策略）
    rst1: null,      // rs_res | rs_no   （COL-12(2) 再分期結果）
    tntord: null,    // t_crt1 | t_chemo1（COL-12(3) TNT 順序）
    rst2: null,      // rs_res | rs_no   （COL-12(3) 再分期結果）
    sym: null        // symp | asymp     （COL-12(1) M1 不可切除）
  };

  /* ---------- 術後病理 T×N → 輔助治療分組 ----------
     COL-12(1)（cT1-2, N0 → Resection）之 PRINCIPLES OF TREATMENT：
       ・Adjuvant CCRT for pT3-4 or pN1-2
       ・Adjuvant chemotherapy（COL-3）
     故顏色分組＝「輔助 CCRT 與否」×「COL-3 輔助化療分層」：
     g-none ：Tis; T1,N0; T2,N0            → 無輔助 CCRT、無輔助化療
     g-ii   ：T3,N0 / T4,N0                → 輔助 CCRT（pT3-4）＋ 第 II 期化療需再分層
     g-low  ：T1–3, N1                     → 輔助 CCRT（pN1）＋ 低風險第 III 期化療
     g-high ：T4,N1；任何 T, N2             → 輔助 CCRT（pT4／pN2）＋ 高風險第 III 期化療   */
  var TN_GROUP = {
    tis_n0: 'g-none', t1_n0: 'g-none', t2_n0: 'g-none',
    t3_n0: 'g-ii', t4_n0: 'g-ii',
    t1_n1: 'g-low', t2_n1: 'g-low', t3_n1: 'g-low',
    t4_n1: 'g-high',
    t1_n2: 'g-high', t2_n2: 'g-high', t3_n2: 'g-high', t4_n2: 'g-high'
  };
  var TN_ROWS = ['Tis', 'T1', 'T2', 'T3', 'T4'];
  var TN_COLS = ['N0', 'N1', 'N2'];

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="rcPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function conn(id) { return '<div class="flow-connector" id="' + id + '">↓</div>'; }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rec(id, label) {
    return '<div class="flow-rec rec-idle" id="' + id + '"><div class="rec-label">' + label +
      '</div><div class="rec-title">請完成上方步驟</div></div>';
  }
  function lg(cls, txt) {
    return '<div class="tn-lg"><span class="tn-sw ' + cls + '"></span><span>' + txt + '</span></div>';
  }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  /* ---------- 術後病理 T×N 分期格 ---------- */
  function tnGridHtml() {
    var h = '<div class="tn-wrap"><div class="tn-cap">術後病理分期 pathologic stage（M0）· 點選格子</div>';
    h += '<div class="tn-grid" id="rc_tngrid">';
    h += '<div class="tn-corner">pT ＼ pN</div>';
    TN_COLS.forEach(function (n) { h += '<div class="tn-ch">' + n + '</div>'; });
    TN_ROWS.forEach(function (t) {
      h += '<div class="tn-rh">' + t + '</div>';
      TN_COLS.forEach(function (n) {
        var key = t.toLowerCase() + '_' + n.toLowerCase();
        var g = TN_GROUP[key];
        if (!g) { h += '<div class="tn-na" title="Tis 依定義為 N0">—</div>'; return; }
        h += '<button class="tn-cell ' + g + '" id="rc_tn_' + key + '" ' +
          'onclick="rcPick(\'tn\',\'' + key + '\',this)">' + t + n + '</button>';
      });
    });
    h += '</div>';
    h += '<div class="tn-legend">' +
      lg('g-none', '無輔助 CCRT、無輔助化療') +
      lg('g-ii', '輔助 CCRT（pT3-4）＋ 第 II 期化療需分層') +
      lg('g-low', '輔助 CCRT（pN1）＋ 低風險第 III 期化療') +
      lg('g-high', '輔助 CCRT（pT4／pN2）＋ 高風險第 III 期化療') +
      '</div>';
    h += '<div class="cbx"><div class="cbx-h">輔助 CCRT 適應症（COL-14 · For adjuvant CCRT setting）' +
      '<span class="cbx-sub">任一項即應考慮</span></div><div class="cbx-items">' +
      ['直腸癌切緣陽性或接近 Positive or close margin',
       '直腸癌 <b>pT3-4 或 pN1-2</b>',
       'M1：轉移與直腸病灶同時切除後 status post operation',
       '保肛之直腸癌 Anal preserving rectal cancer']
        .map(function (x) { return '<span class="cb">' + x + '</span>'; }).join('') +
      '</div></div>';
    h += '<div class="hrf">' +
      '<div class="hrf-h">第 II 期高風險特徵（COL-3(1)）　<span class="hrf-sub">任一項即屬高風險</span></div>' +
      '<div class="hrf-items">' +
        ['Grade 3–4', '淋巴血管侵犯', '腸阻塞', '取樣淋巴結 &lt; 12 顆',
         '神經周圍侵犯', '局部穿孔', '切緣接近／無法確定／陽性']
          .map(function (x) { return '<span class="hrf-b">' + x + '</span>'; }).join('') +
      '</div></div>';
    h += '<div class="note"><b>無禁忌症者應於術後 6 週內開始輔助化療</b>（COL-3）。' +
      'Tis 依定義為 N0，故 Tis／N1、Tis／N2 不適用。' +
      '本格適用於<b>初始 cT1-2, N0 直接手術</b>者；已接受新輔助治療者請改走上方對應分支。</div>';
    h += '</div>';
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function rcSel(btn) {
    var sel = btn.classList.contains('tn-cell') ? '.tn-cell' : '.flow-opt';
    var g = btn.parentNode;
    g.querySelectorAll(sel).forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function rcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function rcClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
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

  /* ---------- 追蹤區塊（COL-3 追蹤 ＋ 直腸專屬 proctoscopy；COL-6）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（COL-3 · 直腸專屬項目以粗體標示）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>CEA</b>：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>胸部／腹部／骨盆 CT</b>：復發高風險者每 6–12 個月，共 5 年。</li>' +
        '<li><b>大腸鏡</b>：1 年時；若有進階腺瘤 → 1 年後再做；若陰性 → 3 年後再做，之後每 5 年。' +
        '若因阻塞性病灶而術前未能完成大腸鏡 → <b>術後 3–6 個月做</b>。</li>' +
        '<li><b>直腸專屬：接受低前位切除（LAR）或經肛門切除者，考慮每 6 個月做 proctoscopy（直腸鏡），共 3–5 年</b>（COL-3）。</li>' +
        '<li><b>直腸癌不例行建議 PET-CT</b>（COL-3、COL-12(1) 註 e）。</li>' +
        '<li>復發 → 見復發與檢查（COL-9）。</li>' +
        '</ul>';
    } else if (type === 'ww') {
      h = '<div class="fu-label">非手術處置之追蹤 Watch &amp; wait（COL-12(2)／COL-12(3) 註 d）</div><ul class="fu-list">' +
        '<li><b>僅適用於完全臨床反應（cCR）者</b>：肛門指診（DRE）、直腸 MRI 與直接內視鏡評估<b>三者皆無殘存病灶證據</b>。</li>' +
        '<li>應於<b>具經驗之多專科團隊中心</b>執行。</li>' +
        '<li><b>局部及／或遠處失敗風險相較標準手術切除是否升高，尚未被充分界定</b>；決策須與病人就其風險承受度充分討論。</li>' +
        '<li>其餘追蹤項目同治癒性切除後（病史／理學、CEA、CT、大腸鏡），' +
        '並<b>每 6 個月 proctoscopy 共 3–5 年</b>（COL-3）。</li>' +
        '<li>再生長（regrowth）→ 補行經腹切除；復發 → COL-9。</li>' +
        '</ul>';
    } else if (type === 'resected_m1') {
      h = '<div class="fu-label">追蹤與監測 Surveillance（COL-6，轉移病灶已切除）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>CEA</b>：每 3–6 個月，共 2 年；之後每 6 個月，總計 5 年。</li>' +
        '<li><b>胸部／腹部／骨盆 CT</b>：每 3–6 個月，共 2 年；之後每 6–12 個月，總計 5 年' +
        '（<b>直腸癌：復發高風險者每年 1 次，共 5 年</b>）。</li>' +
        '<li><b>大腸鏡</b>：1 年時（若因阻塞性病灶術前未做 → 3–6 個月）；有進階腺瘤 → 1 年後再做；' +
        '無 → 3 年後再做，之後每 5 年。</li>' +
        '<li><b>接受 LAR 或經肛門切除者，考慮每 6 個月 proctoscopy，共 3–5 年</b>（COL-3）。</li>' +
        '<li><b>直腸癌不例行建議 PET-CT</b>（COL-6）。</li>' +
        '<li>復發 → 見進展性／轉移性疾病之化學治療（COL-8）。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>治療期間定期評估反應與毒性；不可切除者<b>每 2 個月重新評估轉換為可切除之可能</b>（COL-7）。</li>' +
        '<li>疾病進展 → 依序接續次線／後線系統性治療或臨床試驗（COL-8）。</li>' +
        '<li>阻塞、出血、裏急後重等局部症狀 → 考慮 CCRT、造口（colostomy）、切除受侵犯之直腸段或支架置放（COL-12(1)）。</li>' +
        '<li>體能不佳或多線治療後進展 → 最佳支持治療（best supportive care）／安寧療護。</li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  function result(recId, fuId, cls, title, lines, note, fuType, extra) {
    ulRec(recId, cls, title, lines, note, extra);
    renderFollowup(fuId, fuType);
  }
  function idleRec(recId, fuId, title) {
    ulRec(recId, 'rec-idle', title, [], '');
    renderFollowup(fuId, null);
  }

  /* ---------- 放射治療原則（COL-13／COL-14／COL-15／COL-16）---------- */
  function rtPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">COL-13～COL-16 · 直腸癌放射治療原則</div>' +

      '<div class="rx-def"><b>長程 vs 短程（COL-12(1) 註 c／COL-15）</b>：' +
      '<b>長程 CCRT</b> 建議以 <span class="drug">5-FU</span> 或 <span class="drug">capecitabine</span> 為同步化療，' +
      '常用放射劑量 <b>4500–5040 cGy／5 週</b>（COL-12(1) 註 c），<b>CCRT 完成後 6 週施行手術</b>；' +
      'COL-15 之總劑量列為 <b>長程 45–60 Gy</b>、<b>短程 25 Gy 分 5 次</b>，每次 ≥ 1.8 Gy、每週 5 次。' +
      '<b>短程 RT 之評估應在多專科團隊中進行</b>，並討論降期需求與長期毒性之可能（COL-12(2) 註 c）。</div>' +

      rxLine('CCRT 同步化療處方 Dosing schedules', 'COL-13（劑量與打法僅供參考，實際須由醫師依病情評估調整）', [
        '<span class="rx">XRT + Oral-UFT</span>：<span class="drug">capecitabine</span> 800–1200 mg/m² 每日兩次、每週 5 天 + XRT × 5 週；' +
        '或 <span class="drug">UFUR</span> 300–350 mg/m²/日、每週 5 天 + XRT × 5 週。',
        '<span class="rx">XRT + 5-FU/leucovorin</span>：<span class="drug">5-FU</span> 400 mg/m² IV bolus + <span class="drug">leucovorin</span> 20 mg/m² IV bolus × 4 天，於 XRT 第 1 與第 5 週。',
        '<span class="rx">XRT + continuous infusion 5-FU</span>：<span class="drug">5-FU</span> 225 mg/m² 持續 24 小時，XRT 期間每週 5 或 7 天。',
        '<span class="rx">XRT + weekly low dose 5-FU/LV</span>：<span class="drug">5-FU</span> 450–550 mg/m² IV bolus + <span class="drug">leucovorin</span> 20–30 mg/m² IV bolus，XRT 期間每週一次。',
        '<span class="rx">XRT + FOLFOX</span>：<span class="drug">oxaliplatin</span> 40–85 mg/m²／2 小時；<span class="drug">LV</span> 300–400 mg/m² 與 oxaliplatin 併行（可經 Y 型接頭同一條給），續 <span class="drug">5-FU</span> 2000–2800 mg/m² 輸注 24–48 小時，XRT 期間每 14 天一次，共 2–3 循環。' +
        '或 5-FU 400 mg/m² bolus 後 2000–2400 mg/m² 輸注 46–48 小時，每 14 天一次，共 2–3 循環。' +
        '或 5-FU 225–250 mg/m²/日 + oxaliplatin 50–60 mg/m²，RT 期間每週一次。',
        '<span class="rx">XRT + XELOX</span>：<span class="drug">capecitabine</span> 800 mg/m² 每日兩次 + <span class="drug">oxaliplatin</span> 50 mg/m²、每週 5 天 + XRT × 5 週。',
        '<span class="rx">XRT + HDFL</span>：<span class="drug">5-FU</span> 400 mg/m² IVP、2400 mg/m² IF 48 小時。',
        '<b>註（COL-13）</b>：<span class="drug">bevacizumab</span> 可選擇性加入上述化放療處方，5–7.5 mg/kg Q2-3W。' +
        '溶液配製：oxaliplatin 用 D5W；標靶治療用 0.9% NaCl。',
        '<b>不能耐受 capecitabine 或 infusional 5-FU 者</b>，可改用 <span class="rx">bolus 5-FU/leucovorin/RT</span>（COL-12(2) 註 b）。'
      ]) +

      '<details class="rx-more"><summary>放射治療適應症、設定與標靶體積（COL-14／COL-15／COL-16）▸</summary><div class="rx-stack">' +
        rxLine('適應症 Indications', 'COL-14', [
          '<b>新輔助 CCRT／RT</b>：臨床局部晚期直腸癌（<b>≥ clinical T3 或 N(+)</b>）；可手術之晚期直腸癌（M1）；保肛之直腸癌。',
          '<b>輔助 CCRT</b>：直腸癌切緣陽性或接近；<b>pT3-4 或 pN1-2</b>；M1 轉移與直腸病灶同時切除術後；保肛之直腸癌。',
          '<b>新輔助 RT 及／或化療</b>：可考慮用於初始不可切除／臨界可切除、或無法耐受手術之<b>非轉移性 T4 結腸癌</b>。'
        ]) +
        rxLine('RT settings', 'COL-15', [
          '<b>Mode</b>：3D conformal（3–4 fields）或 IMRT 或 VMAT 或其他創新技術；≥ 6MV photon。',
          '<b>Dose &amp; fractionation</b>：每日一次 ≥ 1.8 Gy、每週 5 次；總劑量 <b>長程 45–60 Gy</b>、<b>短程 25 Gy／5 次</b>。',
          '<b>Patient set-up</b>：俯臥或仰臥；可行時採<b>脹尿（full bladder）</b>。固定裝置（immobilization devices）。',
          '<b>Simulation</b>：仰臥或俯臥擺位；模擬 CT 掃描範圍為<b>骨盆</b>，<b>切片厚度 ≤ 5mm</b>。'
        ]) +
        rxLine('放射野與標靶體積 Radiation field / Target volume', 'COL-16', [
          '<b>3DRT 放射野</b>：新輔助設定、或低前位切除（LAR）後之輔助設定 → <b>骨盆</b>；' +
          '腹會陰聯合切除（APR）後之輔助設定 → <b>骨盆 ± 會陰疤痕併安全距離</b>；' +
          '若侵犯至<b>齒狀線以下之肛管及／或肛周皮膚</b>，治療野應考慮<b>加入鼠蹊區</b>。',
          '<b>CTV</b>：Rectal GTV（radially +1–1.5 cm、craniocaudally +2.5 cm）；Nodal GTV + 0.5–1.5 cm 對稱外擴。',
          '<b>選擇性淋巴結照射 Elective nodal irradiation</b>：直腸周圍（peri-rectal）、內髂（internal iliac）；' +
          '<b>N+ 位於內髂、cT4、cN2 → 納入閉孔（obturator）</b>；' +
          '<b>T4 向前侵犯 → 納入外髂</b>；<b>侵犯肛管 → 考慮鼠蹊與外髂</b>；' +
          '<b>薦前淋巴（presacral）</b>：薦骨前緣前方 8–10 mm 之組織。',
          '亦包含<b>直腸繫膜（mesorectum）與直腸周圍淋巴（perirectal lymphatics）</b>；標靶體積可依臨床判斷修改。',
          '<b>PTV = CTV + 0.5–1 cm</b>。',
          '<b>質子治療（proton therapy）</b>：選擇性（optional），細節請參閱該部門技術規範。'
        ]) +
      '</div></details>' +

      '</div>';
  }

  /* ---------- 系統性治療（COL-8）---------- */
  var systemicNote = 'COL-8(1)、COL-8(2)：進展性／轉移性疾病之化學治療（Chemotherapy for Advanced or Metastatic Disease）。';

  function systemicPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">COL-8 · 進展性／轉移性疾病之系統性治療</div>' +

      '<div class="rx-def"><b>療程定義</b>：<span class="rx">FOLFOX-like</span> 包含 <span class="drug">XELOX</span>、' +
      '<span class="drug">Oxaliplatin-HDFL</span> 或 <span class="drug">CapeOx</span>；' +
      '<span class="rx">FOLFIRI-like</span> 包含 <span class="drug">XELIRI</span> 或 <span class="drug">Irinotecan-HDFL</span>。</div>' +

      '<div class="rx-warn"><b>⚠ 已知 KRAS 突變（exon 2 或 non-exon 2）或 NRAS 突變者，不可使用 ' +
      '<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>。</b></div>' +

      rxLine('一線 First-line', '可耐受積極治療者', [
        '<span class="rx">FOLFOX-like</span> ± <span class="drug">bevacizumab</span>；或 <span class="rx">FOLFOX</span> ± <span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>（<b>KRAS/NRAS 野生型</b>）。',
        '<span class="rx">FOLFIRI-like</span> ± <span class="drug">bevacizumab</span>；或 <span class="rx">FOLFIRI-like</span> ± <span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>（<b>KRAS/NRAS 野生型</b>）。',
        '<span class="rx">FOLFIRINOX</span> ± <span class="drug">bevacizumab</span>（COL-8(2)）。',
        '<b>dMMR／MSI-H</b>：<span class="drug">pembrolizumab</span>（COL-8(2)，須自費）。'
      ]) +

      rxLine('二線 Second-line', '', [
        '<span class="rx">FOLFIRI</span> ±（<span class="drug">bevacizumab</span> 或 <span class="drug">ziv-aflibercept</span> 或 <span class="drug">ramucirumab</span>）。',
        '<span class="drug">irinotecan</span> ±（<span class="drug">bevacizumab</span> 或 <span class="drug">ramucirumab</span>）。',
        '<span class="rx">FOLFIRI</span> 或 <span class="drug">irinotecan</span> ±（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
        '<span class="rx">FOLFOX-like</span> ±（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
        '<b>BRAF V600E 突變</b>：<span class="drug">encorafenib</span> + <span class="drug">cetuximab</span>。'
      ]) +

      '<details class="rx-more"><summary>後線治療 Later lines（二次／三次進展後）▸</summary><div class="rx-stack">' +
        rxLine('二次進展後 After 2nd progression', '', [
          '<span class="drug">irinotecan</span> +（<span class="drug">cetuximab</span> 或 <span class="drug">panitumumab</span>）<b>［KRAS/NRAS/BRAF 野生型］</b>。',
          '<span class="drug">regorafenib</span>。',
          '<span class="drug">trifluridine + tipiracil</span> ± <span class="drug">bevacizumab</span>。',
          '<b>dMMR／MSI-H</b>：<span class="drug">nivolumab</span> ± <span class="drug">ipilimumab</span> 或 <span class="drug">pembrolizumab</span>。',
          '先前未使用過者可用 <span class="rx">FOLFOX-like</span> 或 <span class="rx">FOLFIRI-like</span>。'
        ]) +
        rxLine('三次進展後 After 3rd progression', '', [
          '<span class="drug">regorafenib</span>。',
          '<span class="drug">trifluridine + tipiracil</span> ± <span class="drug">bevacizumab</span>（若先前未曾使用）。',
          '臨床試驗（clinical trial）。',
          '最佳支持治療（best supportive care）。'
        ]) +
      '</div></details>' +

      rxLine('無法耐受積極治療者', 'Not able to tolerate intensive therapy', [
        '治療選擇依<b>醫師判斷</b>，或<b>最佳支持治療</b>（best supportive care）。'
      ]) +

      '<details class="rx-more"><summary>用藥可近性與健保給付 Reimbursement ▸</summary><div class="rx-note">' +
        '<ul class="rx-items">' +
        '<li><span class="drug">bevacizumab</span> 於疾病進展後續用經 <b>FDA 核准</b>，惟<b>健保未給付</b>。</li>' +
        '<li><span class="drug">ziv-aflibercept</span>、<span class="drug">ramucirumab</span>、' +
        '<span class="drug">nivolumab</span> ± <span class="drug">ipilimumab</span>、' +
        '<span class="drug">encorafenib</span> + <span class="drug">cetuximab</span>、' +
        '<span class="drug">pembrolizumab</span> 雖經 <b>TFDA 核准</b>，惟<b>均須自費</b>。</li>' +
        '</ul></div></details>' +

      '</div>';
  }

  /* ---------- 輔助化療處方（COL-3 ／ 台大大腸直腸癌治療藥物處方 版次 12）---------- */
  function adjRxPanel() {
    return '<details class="rx-more kps-details"><summary>輔助化療處方與劑量 Adjuvant regimens（台大大腸直腸癌治療藥物處方，適用於結腸癌及直腸癌）▸</summary>' +
      '<div class="rx-stack" style="margin-top:8px;">' +
        rxLine('Oxaliplatin-based', '', [
          '<span class="rx">FOLFOX4</span>（Q2W × 12 循環）：<span class="drug">oxaliplatin</span> 85 mg/m² + <span class="drug">LV</span> 200 mg/m²／2 小時 D1；<span class="drug">5-FU</span> 400 mg/m² IV bolus D1 續 600 mg/m² 輸注 22 小時 D1；D2 同 LV 200 mg/m²／2 小時 + 5-FU 400 bolus 續 600／22 小時。',
          '<span class="rx">mFOLFOX6</span>（Q2W × 12 循環）：<span class="drug">oxaliplatin</span> 85 mg/m² IV D1；<span class="drug">LV</span> 400 mg/m²／2 小時 D1；<span class="drug">5-FU</span> 400 mg/m² bolus D1 續 2400 mg/m²／46 小時。',
          '<span class="rx">XELOX</span>（Q3W × 8 循環）：<span class="drug">oxaliplatin</span> 85 mg/m² IV D1 + <span class="drug">capecitabine</span> 800–1250 mg/m² 每日兩次 D1–14。',
          '<span class="rx">Oxaliplatin-HDFL</span>（Q3W × 6–8 循環）：<span class="drug">oxaliplatin</span> 60–65 mg/m²／2–4 小時 D1、D8；<span class="drug">5-FU</span> 2000–2600 mg/m² + <span class="drug">LV</span> 300 mg/m²／24 小時 D1、D8。'
        ]) +
        rxLine('Fluorouracil-based', '', [
          '<span class="rx">LV5FU2</span>（Q2W）：<span class="drug">LV</span> 200 mg/m² D1、D2；<span class="drug">5-FU</span> 400 mg/m² bolus 續 600 mg/m²／22 小時 D1、D2。',
          '<span class="rx">HDFL</span>（每週 × 6 個月）：<span class="drug">5-FU</span> 2600 mg/m² IV + <span class="drug">LV</span> 300 mg/m² IV D1。',
          '<span class="rx">LDFL</span>（每週 × 6 個月）：<span class="drug">5-FU</span> 450–550 mg/m² IV + <span class="drug">LV</span> 45–55 mg/m² IV D1。'
        ]) +
        rxLine('口服 Oral', '', [
          '<span class="drug">capecitabine</span>（Xeloda）800–1250 mg/m² 每日兩次 D1–14，每 3 週一次 × 24 週。',
          '<span class="drug">UFUR</span> 300–350 mg/m²/日 × 4 週 ±<span class="drug">leucovorin</span> 30 mg po tid × 4 週，休 1 週，Q5W × 5 循環。'
        ]) +
        '<div class="rx-warn"><b>⚠ 除非參與臨床試驗，<span class="drug">bevacizumab</span>／<span class="drug">irinotecan</span>／' +
        '<span class="drug">panitumumab</span>／<span class="drug">cetuximab</span> 不建議用於輔助化療</b>' +
        '（處方集註；COL-3 註 c 同旨）。</div>' +
      '</div></details>';
  }

  /* ---------- 版面 HTML ---------- */
  function rectalPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院大腸直腸癌診療指引 版次 21（2026/06/16）</b>之直腸癌章節' +
      '（<b>COL-12(1)～COL-12(3)</b> 決策流程、<b>COL-13</b> CCRT 處方、<b>COL-14～COL-16</b> 放射治療原則；' +
      '輔助化療與追蹤共用 COL-3、轉移性系統性治療共用 COL-8）之互動決策流程。' +
      '逐步點選以取得對應建議處置、藥物療程與追蹤方式。結腸癌流程請另見「結腸癌」。</p>';
    h += '<div class="onc-path" id="rcPath">';

    // Step 1 — 臨床分期（COL-12(1) CLINICAL STAGE）
    h += step('rc_s1', '1', '臨床分期（COL-12(1) CLINICAL STAGE）',
      opt('entry', 'e12', 'cT1-2, N0', '早期、CRM 無虞（<b>須依骨盆 MRI（首選）或經直腸超音波判定</b>，COL-12(1) 註 f）') +
      opt('entry', 'crmclear', 'cT3, N any 且<b>環周切緣（CRM）乾淨</b>（MRI）；或 cT1-2, N1-2',
        'T3, N any with clear circumferential margin (CRM) by MRI; T1-2, N1-2 → COL-12(2)') +
      opt('entry', 'crminv', 'cT3, N any 且 <b>CRM 受侵犯</b>（MRI）；cT4, N any；或局部無法切除／無法耐受手術',
        'T3, N any with involved CRM (by MRI); T4, N any or locally unresectable or medically inoperable → COL-12(3)') +
      opt('entry', 'm1res', 'T any, N any, <b>M1 且轉移可切除</b>', 'Resectable metastases（COL-12(1) → COL-3、COL-6）') +
      opt('entry', 'm1unres', 'T any, N any, <b>M1 且轉移不可切除</b> 或無法耐受手術', 'Unresectable metastases or medically inoperable（COL-12(1) → COL-8）'),
      '<div class="cbx"><div class="cbx-h">治療前工作檢查 WORKUP（COL-12(1)）　<span class="cbx-sub">★ 為可決定臨床分期、應於治療前完成之關鍵檢查</span></div>' +
      '<div class="cbx-items">' +
        '<span class="cb">CBC／BCS／LDH／CEA</span>' +
        '<span class="cb"><span class="cb-k">★</span>大腸鏡，考慮 rigid proctoscopy</span>' +
        '<span class="cb">切片 Biopsy</span>' +
        '<span class="cb">病理檢視 Pathology review</span>' +
        '<span class="cb">MMR testing</span>' +
        '<span class="cb"><span class="cb-k">★</span>胸部 CT 及腹部 CT 或 MRI</span>' +
        '<span class="cb">經直腸超音波（MRI 有禁忌時，或考慮用於表淺病灶）</span>' +
        '<span class="cb">造口治療師術前定位與衛教</span>' +
        '<span class="cb">考慮多專科團隊評估</span>' +
        '<span class="cb">適當病人考慮生育風險討論／諮詢</span>' +
      '</div></div>' +
      '<div class="note"><b>PET-CT 非例行建議</b>（COL-12(1)）：PET-CT <b>不能取代</b>顯影劑增強之診斷性 CT；' +
      '僅用於評估顯影 CT 上模稜兩可之發現，或對 IV 顯影劑有強烈禁忌者（註 e）。' +
      '大腸鏡不完整時應加做 <b>LGI series</b>（註 b）。所有病人皆應進行<b>家族史諮詢</b>（註 a）。' +
      '<b>CRM 定義（COL-12(2) 註 a）</b>：腫瘤至直腸繫膜筋膜之最近距離；' +
      '<b>CRM 乾淨＝距直腸繫膜筋膜 &gt; 1mm、且未侵犯提肛肌、未侵入括約肌間平面</b>。</div>');

    /* ===================== A. cT1-2, N0（COL-12(1)）===================== */
    h += '<div id="rc_e12" class="hidden">';
    h += conn('rc_c2a');
    h += rec('rc_e12_rec', '建議處置 · cT1-2, N0（COL-12(1) PRINCIPLES OF TREATMENT）');
    h += '<div class="flow-fu hidden" id="rc_e12_fu"></div>';

    h += conn('rc_c3a');
    h += step('rc_s3a', '2', '術後病理分期 → 輔助 CCRT 與輔助化療（COL-12(1)／COL-14／COL-3）', '', tnGridHtml());

    h += connH('rc_c4a3');
    h += step('rc_s4a3', '3', 'pT3, N0, M0 → 依 MMR 狀態與高風險特徵分層（COL-3(1)）',
      opt('s2', 's2_msi', 'MSI-H 或 dMMR', '錯配修復缺失／微衛星高度不穩定') +
      opt('s2', 's2_low', 'MSS／pMMR 且<b>無</b>高風險特徵', 'MSS/pMMR and no high risk features') +
      opt('s2', 's2_high', 'MSS／pMMR 且<b>具</b>全身性復發高風險特徵', 'High risk for systemic recurrence'));
    h = h.replace('id="rc_s4a3"', 'id="rc_s4a3" class="hidden"');

    h += connH('rc_c4a4');
    h += step('rc_s4a4', '3', 'pT4, N0, M0 → 依 MMR 狀態分層（COL-3(1)）',
      opt('s2', 's2_msi', 'MSI-H 或 dMMR', 'T3–4, N0, M0（MSI-H or dMMR）→ 輔助化療 None') +
      opt('s2', 's2_high', 'MSS／pMMR', 'T4, N0, M0（MSS/pMMR）→ 輔助化療'),
      '<div class="note">COL-3(1) 之 <b>T4, N0, M0（MSS/pMMR）</b>與「T3, N0, M0 具全身性復發高風險」同列，' +
      '故 T4／MSS 不論有無其他高風險特徵，均進入輔助化療組。</div>');
    h = h.replace('id="rc_s4a4"', 'id="rc_s4a4" class="hidden"');

    h += '<div class="flow-rec rec-idle hidden" id="rc_adj_rec"><div class="rec-label">建議處置 · 輔助治療 Adjuvant therapy（COL-12(1)／COL-14／COL-3）</div><div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="rc_adj_fu"></div>';
    h += '</div>'; // rc_e12

    /* ===================== B. CRM 乾淨（COL-12(2)）===================== */
    h += '<div id="rc_crmclear" class="hidden">';
    h += conn('rc_c2b');
    h += step('rc_s2b', '2', '新輔助治療策略（COL-12(2) Neoadjuvant therapy）',
      opt('nastrat', 'na_crt', '<b>單純新輔助化放療／放療</b>（術後再補輔助化療）',
        'Long-course chemo/RT（capecitabine 或 infusional 5-FU）或 Short-course RT → 手術 → 輔助 FOLFOX/CAPEOX 12–16 週') +
      opt('nastrat', 'na_tnt', '<b>全程新輔助治療 TNT</b>（化放療與化療皆於術前完成）',
        'Total neoadjuvant therapy：chemo/RT 與 FOLFOX/CAPEOX（12–16 週）於術前依序完成 → 手術'));
    h += connH('rc_c3b');
    h += step('rc_s3b', '3', '再分期結果（Restaging）→ 可否行經腹切除',
      opt('rst1', 'rs_res', '<b>可行經腹切除</b> Transabdominal resection', '含 TME；達完全臨床反應（cCR）者可討論 watch &amp; wait（註 d）') +
      opt('rst1', 'rs_no', '<b>手術禁忌</b> Resection contraindicated', '→ 系統性治療 Systemic therapy'));
    h = h.replace('id="rc_s3b"', 'id="rc_s3b" class="hidden"');
    h += rec('rc_crmclear_rec', '建議處置 · CRM 乾淨之局部晚期直腸癌（COL-12(2)）');
    h += '<div class="flow-fu hidden" id="rc_crmclear_fu"></div>';
    h += '</div>'; // rc_crmclear

    /* ===================== C. CRM 受侵犯／T4／不可切除（COL-12(3)）===================== */
    h += '<div id="rc_crminv" class="hidden">';
    h += conn('rc_c2c');
    h += step('rc_s2c', '2', '全程新輔助治療之順序（COL-12(3) Total Neoadjuvant Therapy）',
      opt('tntord', 't_crt1', '<b>先化放療、後化療</b>（鞏固型 consolidation）',
        'Long-course chemo/RT（capecitabine 或 infusional 5-FU）或 Short-course RT → Chemotherapy 12–16 週（FOLFOX 或 CAPEOX）') +
      opt('tntord', 't_chemo1', '<b>先化療、後化放療</b>（誘導型 induction）',
        'Chemotherapy 12–16 週（FOLFOX 或 CAPEOX）→ Long-course chemo/RT 或 Short-course RT'),
      '<div class="note">COL-12(3) 對 <b>CRM 受侵犯／T4／局部無法切除或無法耐受手術</b>者，' +
      '<b>兩種順序皆為並列選項</b>，均屬全程新輔助治療（TNT）；' +
      '完成後再分期（best tumor response 6–12 週 after completion of RT）。' +
      '<b>FOLFOXIRI 於此情境不建議使用</b>（COL-12(3) 註 e）。</div>');
    h += connH('rc_c3c');
    h += step('rc_s3c', '3', '再分期結果（Restaging）→ 可否行經腹切除',
      opt('rst2', 'rs_res', '<b>可行經腹切除</b> Transabdominal resection', '含 TME；達完全臨床反應（cCR）者可討論 watch &amp; wait（註 d）') +
      opt('rst2', 'rs_no', '<b>手術禁忌</b> Resection contraindicated', '→ 系統性治療 Systemic therapy'));
    h = h.replace('id="rc_s3c"', 'id="rc_s3c" class="hidden"');
    h += rec('rc_crminv_rec', '建議處置 · CRM 受侵犯／T4／局部不可切除（COL-12(3)）');
    h += '<div class="flow-fu hidden" id="rc_crminv_fu"></div>';
    h += '</div>'; // rc_crminv

    /* ===================== D. M1 可切除（COL-12(1)）===================== */
    h += '<div id="rc_m1res" class="hidden">';
    h += conn('rc_c2d');
    h += rec('rc_m1res_rec', '建議處置 · M1 且轉移可切除（COL-12(1) → COL-3、COL-6）');
    h += '<div class="flow-fu hidden" id="rc_m1res_fu"></div>';
    h += '</div>';

    /* ===================== E. M1 不可切除（COL-12(1) → COL-8）===================== */
    h += '<div id="rc_m1unres" class="hidden">';
    h += conn('rc_c2e');
    h += step('rc_s2e', '2', '是否有原發灶相關症狀（COL-12(1)）',
      opt('sym', 'symp', '<b>有症狀</b> Symptomatic', '阻塞、出血、疼痛、裏急後重等') +
      opt('sym', 'asymp', '<b>無症狀</b> Asymptomatic', '無原發灶相關症狀'));
    h += rec('rc_m1unres_rec', '建議處置 · M1 且轉移不可切除／無法耐受手術（COL-12(1) → COL-8）');
    h += '<div class="flow-fu hidden" id="rc_m1unres_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="rcReset()">重置</button></div>';
    h += '</div>'; // rcPath
    return h;
  }

  /* ---------- 主渲染 ---------- */
  function rcRender() {
    var s = rcSt;

    rcShow('rc_e12', s.entry === 'e12'); rcShow('rc_c2a', s.entry === 'e12');
    rcShow('rc_crmclear', s.entry === 'crmclear'); rcShow('rc_c2b', s.entry === 'crmclear');
    rcShow('rc_crminv', s.entry === 'crminv'); rcShow('rc_c2c', s.entry === 'crminv');
    rcShow('rc_m1res', s.entry === 'm1res'); rcShow('rc_c2d', s.entry === 'm1res');
    rcShow('rc_m1unres', s.entry === 'm1unres'); rcShow('rc_c2e', s.entry === 'm1unres');

    // A. cT1-2 N0 → 術後病理 T×N
    renderE12Rec();
    var g = (s.entry === 'e12' && s.tn) ? TN_GROUP[s.tn] : null;
    var showS2t3 = (g === 'g-ii' && s.tn === 't3_n0');
    var showS2t4 = (g === 'g-ii' && s.tn === 't4_n0');
    rcShow('rc_c4a3', showS2t3); rcShow('rc_s4a3', showS2t3);
    rcShow('rc_c4a4', showS2t4); rcShow('rc_s4a4', showS2t4);
    rcShow('rc_adj_rec', !!g);
    renderAdjRec(g);

    // B. CRM 乾淨 → 選完策略才問再分期
    var showRst1 = (s.entry === 'crmclear' && !!s.nastrat);
    rcShow('rc_c3b', showRst1); rcShow('rc_s3b', showRst1);
    renderCrmClearRec();

    // C. CRM 受侵犯 → 選完 TNT 順序才問再分期
    var showRst2 = (s.entry === 'crminv' && !!s.tntord);
    rcShow('rc_c3c', showRst2); rcShow('rc_s3c', showRst2);
    renderCrmInvRec();

    renderM1ResRec();
    renderM1UnresRec();
  }

  /* ---------- A1. cT1-2, N0 之初始處置（COL-12(1)）---------- */
  function renderE12Rec() {
    var s = rcSt;
    if (s.entry !== 'e12') return;
    result('rc_e12_rec', 'rc_e12_fu', 'rec-elective', 'cT1-2, N0 → 直接手術切除 Resection', [
      '<b>Resection</b>：經腹切除併<b>全直腸繫膜切除（TME）</b>，以確保環周切緣（CRM）陰性。',
      '<b>cT1-2, N0 之判定必須依骨盆 MRI（首選）或經直腸超音波</b>（COL-12(1) 註 f）— 分期不足會使需新輔助治療者被直接送上手術檯。',
      '術後依<b>最終病理分期</b>決定：<b>Adjuvant CCRT for pT3-4 or pN1-2</b>（COL-12(1)、COL-14）；' +
      '及 <b>Adjuvant chemotherapy</b>（COL-3）→ 請於下方步驟 2 點選 <b>T×N 格子</b>。'
    ], 'COL-12(1)：T1-2, N0 → Resection · Adjuvant CCRT for pT3-4 or pN1-2 · Adjuvant chemotherapy（COL-3）。', null);
  }

  /* ---------- A2. 術後輔助治療（COL-12(1)／COL-14／COL-3）---------- */
  function renderAdjRec(g) {
    var s = rcSt;
    var R = 'rc_adj_rec', F = 'rc_adj_fu';
    if (!g) { renderFollowup(F, null); return; }

    var ccrtLine = '<b>輔助 CCRT（COL-12(1)／COL-14）</b>：<b>pT3-4 或 pN1-2</b> → 應行輔助同步化放療；' +
      '同步化療以 <span class="drug">5-FU</span> 或 <span class="drug">capecitabine</span> 為建議用藥、' +
      '放射劑量 4500–5040 cGy／5 週（COL-12(1) 註 c）。切緣陽性或接近、保肛之直腸癌亦為適應症（COL-14）。';
    var seqNote = '<b>時序（COL-12(1) 註 d）</b>：CCRT 與手術之先後<b>不影響第 II／III 期（T3-4／N1-2）直腸癌之存活</b>；' +
      '惟<b>術前 CCRT 之毒性低於術後 CCRT</b>，且須留意冗長 CCRT 期間發生遠端進展之風險。';

    if (g === 'g-none') {
      result(R, F, 'rec-elective', 'pTis／pT1, N0, M0／pT2, N0, M0 → 不需輔助 CCRT、不需輔助化療', [
        '<b>輔助 CCRT：不需要</b> — 未達 COL-14 之 pT3-4 或 pN1-2 適應症（切緣陽性／接近、或保肛之直腸癌者除外）。',
        '<b>輔助化療：None</b>（COL-3(1)：Tis; T1, N0, M0; T2, N0, M0 → Adjuvant therapy = None）。',
        '進入追蹤（含直腸專屬之 proctoscopy，見下方）。'
      ], 'COL-12(1)：Adjuvant CCRT 僅適用 pT3-4 或 pN1-2；COL-3(1)：Tis; T1, N0, M0; T2, N0, M0 → Adjuvant therapy = None。', 'curative');
      return;
    }

    if (g === 'g-ii') {
      var tLabel = (s.tn === 't3_n0') ? 'pT3, N0, M0' : 'pT4, N0, M0';
      if (!s.s2) { idleRec(R, F, '請於步驟 3 選擇 ' + tLabel + ' 之 MMR 狀態' + (s.tn === 't3_n0' ? '與高風險特徵' : '')); return; }

      if (s.s2 === 's2_msi') {
        result(R, F, 'rec-elective', tLabel + ' 且 MSI-H／dMMR → 輔助 CCRT（因 pT3-4）＋ 不需輔助化療', [
          ccrtLine,
          '<b>輔助化療：None</b>。<b>理由（COL-3 註 a）</b>：<b>第 II 期 MSI-H 病人預後良好，且無法從 5-FU 輔助治療獲益</b>。',
          '<b>MMR 檢測（COL-3 註 a）</b>：所有 <b>&lt; 70 歲</b>病人皆應考慮檢測錯配修復蛋白（MMR，COL-18）。',
          '目前尚無足夠證據支持以多基因檢測套組（multi-gene assay panels）決定輔助治療。',
          seqNote
        ], 'COL-12(1)：Adjuvant CCRT for pT3-4；COL-3(1)：T3-4, N0, M0（MSI-H or dMMR）→ Adjuvant chemotherapy = None。', 'curative', rtPanel());
        return;
      }
      if (s.s2 === 's2_low') {
        result(R, F, 'rec-elective', 'pT3, N0, M0（MSS/pMMR、無高風險特徵）→ 輔助 CCRT ＋（觀察 或 單方氟嘧啶）', [
          ccrtLine,
          '<b>輔助化療</b>：<b>Observation</b>（觀察）；<b>或</b>考慮 <span class="drug">capecitabine</span> 或 <span class="rx">5-FU/leucovorin</span>。',
          '<b>第 II 期不加 oxaliplatin</b>：於第 II 期，5-FU/leucovorin 加上 oxaliplatin <b>尚未顯示存活效益</b>（COL-3 註 d）。',
          seqNote
        ], 'COL-12(1)：Adjuvant CCRT for pT3-4；COL-3(1)：T3, N0, M0（MSS/pMMR and no high risk features）→ Observation or consider capecitabine or 5-FU/leucovorin。', 'curative',
          adjRxPanel() + rtPanel());
        return;
      }
      // s2_high
      result(R, F, 'rec-elective', '高風險第 II 期（pT3,N0 高復發風險；或 pT4,N0 MSS/pMMR）→ 輔助 CCRT ＋ 輔助化療', [
        ccrtLine,
        '<b>輔助化療</b>：<span class="rx">5-FU/leucovorin ± oxaliplatin</span>（<span class="rx">FOLFOX</span>）；' +
        '<b>或</b> <span class="drug">capecitabine</span> ± <span class="drug">oxaliplatin</span>（<span class="rx">CapeOX</span>）；' +
        '<b>或</b>臨床試驗；<b>或</b>觀察（Observation）。',
        '<b>高風險定義（COL-3(1)）</b>：Grade 3–4、淋巴血管侵犯、腸阻塞、<b>取樣淋巴結 &lt; 12 顆</b>、' +
        '神經周圍侵犯、局部穿孔、切緣接近／無法確定／陽性。',
        '<b>年齡 ≥ 70 歲者，加用 oxaliplatin 之效益未被證實</b>（COL-3 註 e）。',
        seqNote
      ], 'COL-12(1)：Adjuvant CCRT for pT3-4；COL-3(1)：T3, N0, M0 high risk for systemic recurrence 或 T4, N0, M0（MSS/pMMR）→ FOLFOX／CapeOX／clinical trial／observation。Bevacizumab、cetuximab、panitumumab、irinotecan 不可用於第 II／III 期之輔助治療（臨床試驗除外，COL-3 註 c）。',
        'curative', adjRxPanel() + rtPanel());
      return;
    }

    if (g === 'g-low') {
      result(R, F, 'rec-elective', '低風險第 III 期（pT1–3, N1）→ 輔助 CCRT（因 pN1）＋ 輔助化療', [
        ccrtLine,
        '<span class="rx-h">輔助化療 · 建議 Preferred</span>　<span class="rx">CapeOX</span> <b>3 個月</b>；<b>或</b> <span class="rx">FOLFOX</span> <b>3–6 個月</b>。',
        '<span class="rx-h">其他選項 Other options</span>　<span class="drug">capecitabine</span>（6 個月）或 <span class="drug">5-FU</span>（6 個月）。',
        '<b>IDEA 分析（COL-3 註 h）</b>：T1–3, N1 低風險第 III 期，<b>3 個月 CapeOX 對無病存活不劣於 6 個月</b>；' +
        '惟 <b>3 個月 FOLFOX 之不劣性尚未被證實</b>。',
        '<b>3 個月相較 6 個月療程之 Grade 3+ 神經毒性顯著較低</b>（FOLFOX 3% vs 16%；CapeOX 3% vs 9%）。',
        seqNote
      ], 'COL-12(1)：Adjuvant CCRT for pN1-2；COL-3(2)：T1–3, N1（low risk stage III）→ Preferred CapeOX (3 mo) or FOLFOX (3–6 mo)；Other options: capecitabine (6 mo) or 5-FU (6 mo)。無禁忌症者術後 6 週內開始。',
        'curative', adjRxPanel() + rtPanel());
      return;
    }

    // g-high
    result(R, F, 'rec-elective', '高風險第 III 期（pT4, N1；任何 pT, N2）→ 輔助 CCRT ＋ 輔助化療', [
      ccrtLine,
      '<span class="rx-h">輔助化療 · 建議 Preferred</span>　<span class="rx">CapeOX</span> <b>3–6 個月</b>；<b>或</b> <span class="rx">FOLFOX</span> <b>6 個月</b>。',
      '<span class="rx-h">其他選項 Other options</span>　<span class="drug">capecitabine</span>（6 個月）或 <span class="drug">5-FU</span>（6 個月）。',
      '<b>IDEA 分析（COL-3 註 h）</b>：T4、N1–2 或任何 T、N2 之高風險第 III 期，<b>3 個月 FOLFOX 之無病存活劣於 6 個月</b>；' +
      '而 <b>3 個月 CapeOX 相較 6 個月之不劣性尚未被證實</b>。',
      seqNote
    ], 'COL-12(1)：Adjuvant CCRT for pT3-4 or pN1-2；COL-3(2)：T4, N1-2, T any, N2（high risk stage III）→ Preferred CapeOX (3–6 mo) or FOLFOX (6 mo)；Other options: capecitabine (6 mo) or 5-FU (6 mo)。',
      'curative', adjRxPanel() + rtPanel());
  }

  /* ---------- 共用：再分期後之結果（COL-12(2)／COL-12(3)）---------- */
  function resectionLines(rtWeeks, adjChemo) {
    var l = [
      '<b>經腹切除 Transabdominal resection</b>：含<b>全直腸繫膜切除（TME）</b>，目標為環周切緣（CRM）陰性。' +
      '長程 CCRT 後<b>於完成後 6 週施行手術</b>（COL-12(1) 註 c）；再分期取<b>放射治療完成後 ' + rtWeeks + ' 之最佳腫瘤反應</b>。'
    ];
    if (adjChemo) {
      l.push('<b>術後輔助化療</b>：<span class="rx">FOLFOX</span> 或 <span class="rx">CAPEOX</span>，<b>12–16 週</b>' +
        '（COL-12(2)：Adjuvant treatment，<b>圍手術期治療合計以不超過 6 個月為佳</b>）。');
    } else {
      l.push('<b>術後不再另給輔助化療</b>：化療已於術前完成（TNT）→ 直接進入追蹤（COL-12(2)／COL-12(3)：Restaging → Transabdominal resection → Surveillance）。');
    }
    l.push('<b>Watch &amp; wait（COL-12(2)／COL-12(3) 註 d）</b>：達<b>完全臨床反應</b>' +
      '（肛門指診、直腸 MRI 與直接內視鏡評估<b>皆無殘存病灶證據</b>）者，' +
      '<b>可於具經驗之多專科團隊中心考慮非手術處置</b>；' +
      '惟<b>其局部及／或遠處失敗風險相較標準手術切除是否升高，尚未被充分界定</b>，' +
      '決策須與病人就其風險承受度審慎討論。');
    return l;
  }

  /* ---------- B. CRM 乾淨（COL-12(2)）---------- */
  function renderCrmClearRec() {
    var s = rcSt;
    if (s.entry !== 'crmclear') return;
    var R = 'rc_crmclear_rec', F = 'rc_crmclear_fu';

    if (!s.nastrat) { idleRec(R, F, '請選擇步驟 2（新輔助治療策略）'); return; }
    if (!s.rst1) {
      var plan = (s.nastrat === 'na_crt')
        ? '新輔助 Long-course chemo/RT（<span class="drug">capecitabine</span> 或 infusional <span class="drug">5-FU</span>）或 Short-course RT → 完成後 <b>8 週</b>考慮再分期'
        : '全程新輔助治療（TNT）：chemo/RT 與 <span class="rx">FOLFOX</span>／<span class="rx">CAPEOX</span>（12–16 週）於術前依序完成 → 完成 RT 後 <b>6–12 週</b>再分期';
      ulRec(R, 'rec-idle', '已選擇：' + plan + '。請於步驟 3 選擇再分期結果。', [], '');
      renderFollowup(F, null);
      return;
    }

    if (s.rst1 === 'rs_no') {
      result(R, F, 'rec-nonop', '再分期後<b>手術禁忌</b> → 系統性治療 Systemic therapy', [
        '<b>Resection contraindicated → Systemic therapy</b>（COL-12(2)）。',
        '<b>FOLFOXIRI 於此情境不建議使用</b>（COL-12(2) 註 e）。',
        '系統性治療之完整選單見下方 COL-8。'
      ], systemicNote + '｜COL-12(2)：Restaging → Resection contraindicated → Systemic therapy。',
        'palliative', systemicPanel());
      return;
    }

    if (s.nastrat === 'na_crt') {
      result(R, F, 'rec-elective', '新輔助化放療／放療 → 經腹切除 → 輔助 FOLFOX／CAPEOX 12–16 週 → 追蹤',
        [
          '<b>新輔助治療（COL-12(2)）</b>：<span class="rx">Long-course chemo/RT</span>' +
          '（<span class="drug">capecitabine</span> 或 infusional <span class="drug">5-FU</span>）；' +
          '<b>或</b> <span class="rx">Short-course RT</span>（25 Gy／5 次，COL-15）。' +
          '不能耐受 capecitabine 或 infusional 5-FU 者可用 <b>bolus 5-FU/leucovorin/RT</b>（註 b）。'
        ].concat(resectionLines('8 週', true)).concat([
          '<b>短程 RT 之評估應在多專科團隊中進行</b>，並討論降期需求與長期毒性之可能（註 c）。'
        ]),
        'COL-12(2)：T3, N any with clear CRM (by MRI); T1-2, N1-2 → Neoadjuvant long-course chemo/RT 或 short-course RT → Consider restaging（best tumor response 8 week after completion of RT）→ Transabdominal resection → FOLFOX or CAPEOX (12-16 weeks) → Surveillance。Adjuvant treatment 以 up to 6 month periOP treatment 為佳。',
        'curative', adjRxPanel() + rtPanel());
      return;
    }

    // na_tnt
    result(R, F, 'rec-elective', '全程新輔助治療（TNT）→ 經腹切除 → 追蹤',
      [
        '<b>TNT（COL-12(2)）</b>：<span class="rx">Long-course chemo/RT</span>' +
        '（<span class="drug">capecitabine</span> 或 infusional <span class="drug">5-FU</span>）或 <span class="rx">Short-course RT</span>，' +
        '與 <span class="rx">FOLFOX</span> 或 <span class="rx">CAPEOX</span>（<b>12–16 週</b>）' +
        '<b>兩個成分皆於術前完成</b>（兩種順序見 COL-12(3)：先化放療後化療，或先化療後化放療）。'
      ].concat(resectionLines('6–12 週', false)).concat([
        '<b>FOLFOXIRI 於此情境不建議使用</b>（註 e）。',
        '<b>圍手術期治療合計以不超過 6 個月為佳</b>（COL-12(2) Adjuvant treatment 欄標題）。'
      ]),
      'COL-12(2)：T3, N any with clear CRM (by MRI); T1-2, N1-2 → Total neoadjuvant therapy（long-course chemo/RT 或 short-course RT ＋ FOLFOX/CAPEOX 12-16 weeks）→ Restaging（best tumor response 6-12 weeks after completion of RT）→ Transabdominal resection → Surveillance。',
      'curative', rtPanel());
  }

  /* ---------- C. CRM 受侵犯／T4／不可切除（COL-12(3)）---------- */
  function renderCrmInvRec() {
    var s = rcSt;
    if (s.entry !== 'crminv') return;
    var R = 'rc_crminv_rec', F = 'rc_crminv_fu';

    if (!s.tntord) { idleRec(R, F, '請選擇步驟 2（TNT 順序）'); return; }
    if (!s.rst2) {
      var plan = (s.tntord === 't_crt1')
        ? '先 Long-course chemo/RT 或 Short-course RT → 後 Chemotherapy 12–16 週（FOLFOX 或 CAPEOX）'
        : '先 Chemotherapy 12–16 週（FOLFOX 或 CAPEOX）→ 後 Long-course chemo/RT 或 Short-course RT';
      ulRec(R, 'rec-idle', '已選擇 TNT 順序：' + plan + '。請於步驟 3 選擇再分期結果。', [], '');
      renderFollowup(F, null);
      return;
    }

    if (s.rst2 === 'rs_no') {
      result(R, F, 'rec-nonop', 'TNT 後再分期<b>手術禁忌</b> → 系統性治療 Systemic therapy', [
        '<b>Resection contraindicated → Systemic therapy</b>（COL-12(3)）。',
        '<b>FOLFOXIRI 於此情境不建議使用</b>（COL-12(3) 註 e）。',
        '系統性治療之完整選單見下方 COL-8。'
      ], systemicNote + '｜COL-12(3)：Restaging → Resection contraindicated → Systemic therapy。',
        'palliative', systemicPanel());
      return;
    }

    var seq = (s.tntord === 't_crt1')
      ? [
        '<b>① <span class="rx">Long-course chemo/RT</span></b>（<span class="drug">capecitabine</span> 或 infusional <span class="drug">5-FU</span>）' +
        '<b>或</b> <span class="rx">Short-course RT</span>（25 Gy／5 次）。',
        '<b>② <span class="rx">Chemotherapy 12–16 週</span></b>：<span class="rx">FOLFOX</span> 或 <span class="rx">CAPEOX</span>。'
      ]
      : [
        '<b>① <span class="rx">Chemotherapy 12–16 週</span></b>：<span class="rx">FOLFOX</span> 或 <span class="rx">CAPEOX</span>。',
        '<b>② <span class="rx">Long-course chemo/RT</span></b>（<span class="drug">capecitabine</span> 或 infusional <span class="drug">5-FU</span>）' +
        '<b>或</b> <span class="rx">Short-course RT</span>（25 Gy／5 次）。'
      ];

    result(R, F, 'rec-elective',
      (s.tntord === 't_crt1' ? '全程新輔助治療（先化放療、後化療）' : '全程新輔助治療（先化療、後化放療）') + ' → 經腹切除 → 追蹤',
      seq.concat(resectionLines('6–12 週', false)).concat([
        '不能耐受 capecitabine 或 infusional 5-FU 者可用 <b>bolus 5-FU/leucovorin/RT</b>（COL-12(3) 註 b）。',
        '<b>短程 RT 之評估應在多專科團隊中進行</b>，並討論降期需求與長期毒性之可能（註 c）。',
        '<b>FOLFOXIRI 於此情境不建議使用</b>（註 e）。'
      ]),
      'COL-12(3)：T3, N any with involved CRM (by MRI); T4, N any or locally unresectable or medically inoperable → Total Neoadjuvant Therapy（兩種順序並列）→ Restaging → Transabdominal resection → Surveillance；Resection contraindicated → Systemic therapy。',
      'curative', rtPanel());
  }

  /* ---------- D. M1 可切除（COL-12(1)）---------- */
  function renderM1ResRec() {
    var s = rcSt;
    if (s.entry !== 'm1res') return;
    result('rc_m1res_rec', 'rc_m1res_fu', 'rec-elective', 'M1 且轉移可切除 → 術前治療 → 再分期 → 轉移與直腸病灶分期或同時切除', [
      '<b>術前治療（COL-12(1)，三選一或合併）</b>：<span class="rx">CCRT</span>（同步化療以 <span class="drug">5-FU</span> 或 ' +
      '<span class="drug">capecitabine</span>，4500–5040 cGy／5 週，註 c）；<b>或</b>新輔助化療（Neoadjuvant chemotherapy）；' +
      '<b>或</b> <span class="drug">pembrolizumab</span>（<b>僅 dMMR／MSI-H</b>）（COL-3、COL-6）。',
      '<b>再分期</b>：取<b>放射治療完成後 6–12 週</b>之最佳腫瘤反應（Restaging，註 g 適用於 long-course chemo/RT）。',
      '<b>手術</b>：<b>轉移病灶與直腸病灶之分期或同時切除</b>（Staged or synchronous resection of metastases and rectal lesion）。' +
      '達完全臨床反應者之非手術處置（watch &amp; wait）須符合註 d 之條件並於具經驗之多專科中心討論。',
      '<b>術後</b>：續行 <span class="rx">CCRT</span>，或依進展性／轉移性疾病之系統性治療（COL-8）。' +
      '<b>M1 之轉移與直腸病灶同時切除術後，本身即為輔助 CCRT 之適應症</b>（COL-14）。',
      '<b>基因檢測（註 h）</b>：應判定 <b>RAS、BRAF ± HER-2 amplification</b> 之腫瘤基因狀態（可單獨檢測或併入 NGS）。',
      '<b>時序（註 d）</b>：CCRT 與手術之先後不影響第 II／III 期（T3-4／N1-2）直腸癌之存活；術前 CCRT 毒性較低。'
    ], 'COL-12(1)：T any, N any, M1 Resectable metastases → CCRT · Neoadjuvant chemotherapy · Pembrolizumab（dMMR/MSI-H only）（COL-3, 6）→ Restaging（best tumor response 6-12 weeks after completion of RT）→ Staged or synchronous resection of metastases and rectal lesion → CCRT or COL-8。',
      'resected_m1', rtPanel());
  }

  /* ---------- E. M1 不可切除（COL-12(1) → COL-8）---------- */
  function renderM1UnresRec() {
    var s = rcSt;
    if (s.entry !== 'm1unres') return;
    var R = 'rc_m1unres_rec', F = 'rc_m1unres_fu';

    if (!s.sym) { idleRec(R, F, '請選擇步驟 2（是否有原發灶相關症狀）'); return; }

    if (s.sym === 'symp') {
      result(R, F, 'rec-nonop', '有症狀之不可切除 M1 → 局部緩解處置（五選一）＋ 系統性治療', [
        '<b>以下擇一（COL-12(1)）</b>：<span class="rx">CCRT</span>（註 c）；<b>或</b>造口（Colostomy）；' +
        '<b>或</b>切除受侵犯之直腸段（Resection of involved rectal segment）；<b>或</b>支架置放（Stenting）；' +
        '<b>或</b>系統性治療（Systemic therapy，COL-8）。',
        '<b>基因檢測（註 h）</b>：RAS、BRAF ± HER-2 amplification（可單獨檢測或併入 NGS）。',
        '系統性治療之完整選單見下方 COL-8。'
      ], systemicNote + '｜COL-12(1)：T any, N any, M1 Unresectable metastases or medically inoperable → Symptomatic → CCRT or Colostomy or Resection of involved rectal segment or Stenting or Systemic therapy（COL-8）。',
        'palliative', systemicPanel());
      return;
    }

    result(R, F, 'rec-nonop', '無症狀之不可切除 M1 → 緩和性系統性治療（COL-8）＋ 選擇性病人考慮局部治療', [
      '<b>Palliative systemic therapy（COL-8）</b>，並<b>對選擇性病人考慮局部治療</b>' +
      '（consider local therapy for select patients）。',
      '<b>基因檢測（註 h）</b>：RAS、BRAF ± HER-2 amplification（可單獨檢測或併入 NGS）。',
      '系統性治療之完整選單見下方 COL-8。'
    ], systemicNote + '｜COL-12(1)：T any, N any, M1 Unresectable metastases or medically inoperable → Asymptomatic → Palliative systemic therapy（COL-8）and consider local therapy for select patients。',
      'palliative', systemicPanel());
  }

  /* ---------- 事件 ---------- */
  function rcPick(key, val, btn) {
    rcSel(btn);
    var s = rcSt;
    if (key === 'entry') {
      s.entry = val;
      s.tn = s.s2 = s.nastrat = s.rst1 = s.tntord = s.rst2 = s.sym = null;
      rcClearSel(['rc_s3a', 'rc_s4a3', 'rc_s4a4', 'rc_s2b', 'rc_s3b', 'rc_s2c', 'rc_s3c', 'rc_s2e']);
    } else if (key === 'tn') {
      s.tn = val; s.s2 = null;
      rcClearSel(['rc_s4a3', 'rc_s4a4']);
    } else if (key === 's2') {
      s.s2 = val;
    } else if (key === 'nastrat') {
      s.nastrat = val; s.rst1 = null;
      rcClearSel(['rc_s3b']);
    } else if (key === 'rst1') {
      s.rst1 = val;
    } else if (key === 'tntord') {
      s.tntord = val; s.rst2 = null;
      rcClearSel(['rc_s3c']);
    } else if (key === 'rst2') {
      s.rst2 = val;
    } else if (key === 'sym') {
      s.sym = val;
    }
    rcRender();
  }

  function rcReset() {
    for (var k in rcSt) { if (rcSt.hasOwnProperty(k)) rcSt[k] = null; }
    var root = document.getElementById('rcPath');
    if (root) root.querySelectorAll('.flow-opt,.tn-cell').forEach(function (b) { b.classList.remove('selected'); });
    ['rc_e12_fu', 'rc_adj_fu', 'rc_crmclear_fu', 'rc_crminv_fu', 'rc_m1res_fu', 'rc_m1unres_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    rcRender();
  }

  function initRectalPathway() { rcReset(); }

  // 匯出
  global.rectalPathwayHTML = rectalPathwayHTML;
  global.initRectalPathway = initRectalPathway;
  global.rcPick = rcPick;
  global.rcReset = rcReset;
})(window);
