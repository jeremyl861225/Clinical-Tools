/* ============================================================
   子宮肉瘤治療互動決策流程 Uterine Sarcoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 婦癌診療指引
   版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000011
   對應頁面 UTSARC-1 ～ UTSARC-5
   ※ 兩個易錯之處：
     ① 病理型態決定的不只是分期表，還決定輔助治療的<b>藥理類別</b>——
        低惡性度 ESS／無肉瘤過度增生之腺肉瘤走<b>內分泌</b>治療，
        有肉瘤過度增生之腺肉瘤與高惡性度組走<b>細胞毒性化療</b>。兩者不可互換。
     ② 高惡性度組之<b>第 I 期為單純觀察</b>（UTSARC-3），不加輔助治療；
        低惡性度組之第 I 期則以 BSO 為優先。
   ※ 癌肉瘤不在本頁——依指引以子宮內膜癌分期與流程（ENDO-14）處理。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var usSt = {
    dx: null,     // post_hyst | biopsy | nosurg
    histo: null,  // lowgrade | adeno_so | highgrade
    stage: null   // s1 | s23 | s4a | s4b
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="usPick(\'' + key + '\',\'' + val + '\',this)">' +
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
    return '<details class="dx-details"><summary>追加評估 Additional evaluation（UTSARC-1）▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>專家病理判讀，並考慮分子檢測</b></li>' +
      '<li>影像檢查</li>' +
      '<li><b>LMS、ESS 與腺肉瘤考慮 ER／PR 檢測</b>——這是後續能否使用內分泌治療的前提</li>' +
      '</ul></details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>ESS</b> — endometrial stromal sarcoma 子宮內膜間質肉瘤</li>' +
      '<li><b>UUS</b> — undifferentiated uterine sarcoma 未分化子宮肉瘤</li>' +
      '<li><b>LMS</b> — leiomyosarcoma 平滑肌肉瘤</li>' +
      '<li><b>SO</b> — sarcomatous overgrowth 肉瘤過度增生</li>' +
      '<li><b>PEComa</b> — perivascular epithelioid cell tumor 血管周上皮樣細胞腫瘤</li>' +
      '<li><b>TH</b> — total hysterectomy 全子宮切除；<b>SCH</b> — supracervical hysterectomy 次全子宮切除</li>' +
      '<li><b>BSO</b> — bilateral salpingo-oophorectomy 雙側輸卵管卵巢切除</li>' +
      '<li><b>IORT</b> — intraoperative radiation therapy 術中放射治療</li>' +
      '</ul></details>';
  }

  function fuHtml() {
    return '<div class="fu-label">追蹤與復發處置 Surveillance（UTSARC-4／UTSARC-5）</div>' +
      '<ul class="fu-list">' +
      '<li><b>病史與理學檢查</b>：前 2–3 年<b>每 3–4 個月</b>，其後每 6–12 個月。</li>' +
      '<li><b>影像檢查</b>；並衛教復發症狀、生活型態、體重、運動、營養、性健康（陰道擴張器、潤滑／保濕劑）、戒菸，及治療之長期與晚期副作用。</li>' +
      '<li><b>局部復發（陰道／骨盆腔，影像無遠處轉移）</b> → UTSARC-5，<b>先分是否曾接受放療</b>：<br>· <b>未曾放療</b>：手術探查併切除 ± IORT（IORT 為 category 3），<b>可考慮術前 EBRT ± 全身治療</b>；<b>或</b> EBRT ± 近接治療 ± 全身治療。<b>若有殘存病灶</b>，考慮 EBRT ± 近接治療 ± 全身治療。<br>· <b>曾接受放療</b>：手術探查併切除 ± IORT ± 全身治療（IORT 為 category 3）、<b>或</b>全身治療、<b>或</b>選擇性再照射（EBRT 和／或近接治療）。</li>' +
      '<li><b>孤立轉移</b>：<b>可切除</b> → 手術切除或其他局部消融，<b>並考慮術前或術後之全身治療與 EBRT</b>；<b>不可切除</b> → 全身治療和／或局部治療（EBRT 或局部消融），<b>有反應時考慮手術 ± EBRT</b>。</li>' +
      '<li><b>瀰漫性疾病</b>：全身治療 ± 姑息性 EBRT，<b>或</b>最佳支持療法。</li>' +
      '</ul>';
  }

  function recFor(s) {
    /* ── 手術／初始處置（UTSARC-1）── */
    if (s.dx === 'nosurg') {
      return { cls: 'rec-nonop', title: '不適合原發手術，或已知子宮外病灶而不切除', detail:
        rxLine('原發治療', 'UTSARC-1', [
          '<b>全身治療</b>和／或<b>姑息性 EBRT ± 近接治療</b>'
        ]) +
        '<div class="note">已知或疑似子宮外病灶者，指引先<b>依症狀、疾病範圍與可切除性</b>評估是否手術：可切除則行<b>全子宮切除併整塊切除 ± BSO，並切除轉移病灶</b>；不切除則走本建議。</div>',
        note: 'UTSARC-1。此路徑<b>直接進入追蹤（UTSARC-4）</b>，不經 UTSARC-2／UTSARC-3 之輔助治療分層。' };
    }

    if (!s.histo) {
      var surgLines = (s.dx === 'post_hyst') ? [
        '<b>腫瘤原已碎解，或有殘餘子宮頸</b> → <b>考慮再探查／再切除</b>。',
        '<b>有殘餘輸卵管／卵巢</b> → <b>低惡性度 ESS、腺肉瘤或 ER 陽性腫瘤者，考慮補行輸卵管卵巢切除</b>。',
        '<b>病灶侷限於子宮</b> → <b>全子宮切除併整塊切除 ± BSO</b>；術中發現子宮外病灶時，追加切除範圍<b>個別化決定</b>。'
      ] : [
        '<b>病灶侷限於子宮</b> → <b>全子宮切除併整塊切除 ± BSO</b>；術中發現子宮外病灶時，追加切除範圍<b>個別化決定</b>。',
        '<b>已知或疑似子宮外病灶</b> → 依<b>症狀、疾病範圍、可切除性</b>決定是否手術。'
      ];
      return { cls: 'rec-elective', title: '原發手術與追加處置', detail:
        rxLine('依初始發現分流', 'UTSARC-1', surgLines) +
        '<div class="note"><b>指引全程未將系統性淋巴結廓清列為標準步驟</b>——請於上方<b>第 2 步</b>選擇病理型態，以取得輔助治療建議（UTSARC-2／UTSARC-3）。</div>',
        note: 'UTSARC-1。' };
    }

    /* ── 低惡性度 ESS／腺肉瘤（無 SO）：UTSARC-2 上半 ── */
    if (s.histo === 'lowgrade') {
      if (s.stage === 's1') {
        return { cls: 'rec-elective', title: '低惡性度 ESS 或腺肉瘤（無肉瘤過度增生）· 第 I 期', detail:
          rxLine('二擇一', 'UTSARC-2', [
            '<b>BSO（優先）</b>',
            '<b>或 觀察</b>——<b>限已停經且先前已行 BSO 者</b>'
          ]) +
          '<div class="note"><b>本院修訂</b>：原文之「if menopausal <u>or</u> prior BSO」，本院將「or」刪除並強調 menopausal，即<b>需同時滿足已停經與先前已行 BSO</b>方可單純觀察。</div>',
          note: 'UTSARC-2。' };
      }
      return { cls: 'rec-elective', title: '低惡性度 ESS 或腺肉瘤（無肉瘤過度增生）· 第 II／III／IVA／IVB 期', detail:
        rxLine('輔助治療', 'UTSARC-2', [
          '<b>BSO</b>',
          '<b>± 全身性內分泌治療</b>（<b>本院修訂加入</b>）',
          '<b>± EBRT</b>（第 IVB 期為姑息性；<b>第 II／III／IVA 期之 EBRT 為 category 2B</b>）'
        ]) +
        '<div class="note"><b>本組用的是內分泌治療，不是細胞毒性化療</b>——這是低惡性度 ESS／無 SO 腺肉瘤與其他子宮肉瘤最重要的差別，也是 UTSARC-1 要求做 ER／PR 檢測的原因。</div>',
        note: 'UTSARC-2。' };
    }

    /* ── 腺肉瘤併 SO：UTSARC-2 下半 ── */
    if (s.histo === 'adeno_so') {
      if (s.stage === 's1') {
        return { cls: 'rec-elective', title: '腺肉瘤併肉瘤過度增生（SO）· 第 I 期', detail:
          rxLine('二擇一', 'UTSARC-2', [
            '<b>BSO</b>',
            '<b>或 觀察</b>——<b>限已停經且先前已行 BSO 者</b>'
          ]),
          note: 'UTSARC-2。第 I 期之處置與無 SO 者相同；<b>差別出現在第 II 期以後</b>。' };
      }
      return { cls: 'rec-elective', title: '腺肉瘤併肉瘤過度增生（SO）· 第 II／III／IVA／IVB 期', detail:
        rxLine('輔助治療', 'UTSARC-2', [
          '<b>BSO</b>',
          '<b>考慮全身治療</b>——<b>有可測量之殘存病灶時建議使用</b>',
          '<b>± EBRT</b>（第 IVB 期為姑息性；<b>第 II／III／IVA 期之 EBRT 為 category 2B</b>）'
        ]) +
        '<div class="note"><b>與無 SO 之腺肉瘤的關鍵差別</b>：此處為<b>細胞毒性全身治療</b>，非內分泌治療。肉瘤過度增生使腫瘤行為趨近高惡性度肉瘤。</div>',
        note: 'UTSARC-2。' };
    }

    /* ── 高惡性度 ESS／UUS／LMS／其他：UTSARC-3 ── */
    if (s.stage === 's1') {
      return { cls: 'rec-elective', title: '高惡性度 ESS／UUS／LMS／其他肉瘤 · 第 I 期', detail:
        rxLine('輔助治療', 'UTSARC-3', ['<b>觀察 Observe</b>']) +
        '<div class="note"><b>第 I 期為單純觀察，指引未列 BSO、化療或放療</b>——與低惡性度組（第 I 期以 BSO 為優先）不同。GOG-277 之輔助 gemcitabine/docetaxel 續以 doxorubicin 未顯示無復發存活獲益（見參考文獻）。</div>',
        note: 'UTSARC-3。' };
    }
    if (s.stage === 's23') {
      return { cls: 'rec-elective', title: '高惡性度 ESS／UUS／LMS／其他肉瘤 · 第 II／III 期', detail:
        rxLine('並列選項', 'UTSARC-3', [
          '<b>完全切除且切緣陰性者，考慮觀察</b>',
          '<b>或 考慮全身治療</b>',
          '<b>和／或 考慮 EBRT</b>'
        ]),
        note: 'UTSARC-3。三項皆為「考慮」，指引未指定優先者。' };
    }
    if (s.stage === 's4a') {
      return { cls: 'rec-elective', title: '高惡性度 ESS／UUS／LMS／其他肉瘤 · 第 IVA 期', detail:
        rxLine('輔助治療', 'UTSARC-3', ['<b>全身治療</b>和／或 <b>EBRT</b>']),
        note: 'UTSARC-3。' };
    }
    return { cls: 'rec-nonop', title: '高惡性度 ESS／UUS／LMS／其他肉瘤 · 第 IVB 期', detail:
      rxLine('輔助治療', 'UTSARC-3', ['<b>全身治療 ± 姑息性 EBRT</b>']),
      note: 'UTSARC-3。' };
  }

  function utsarcPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院婦癌診療指引 版次 10（2026/06/16，文件編號 50710-2-000011）</b>子宮肉瘤章節（UTSARC-1～UTSARC-5）之互動決策流程。' +
      '<b>癌肉瘤（carcinosarcoma）不走本流程</b>——依指引以子宮內膜癌之分期與 ENDO-14 處理，見<b>子宮內膜癌</b>條目。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="usPath">';

    h += dxHtml();

    h += step('us_s1', '1', '診斷情境？',
      opt('dx', 'post_hyst', '子宮切除後才診斷', 'TH 或 SCH ± BSO 後 · UTSARC-1') +
      opt('dx', 'biopsy', '切片或肌瘤切除後診斷', 'UTSARC-1') +
      opt('dx', 'nosurg', '不適合原發手術', ''));

    h += connH('us_c1');
    h += step('us_s2', '2', '病理型態？',
      opt('histo', 'lowgrade', '低惡性度 ESS 或腺肉瘤（無 SO）', 'UTSARC-2 · 內分泌治療路徑') +
      opt('histo', 'adeno_so', '腺肉瘤併肉瘤過度增生（SO）', 'UTSARC-2 · 細胞毒性化療路徑') +
      opt('histo', 'highgrade', '高惡性度 ESS／UUS／LMS／其他', 'UTSARC-3'),
      '<div class="note">這一步決定的<b>不只是分期表，還有輔助治療的藥理類別</b>——低惡性度組走內分泌治療，其餘走細胞毒性化療。</div>');

    h += connH('us_c2');
    h += step('us_s3', '3', '分期？',
      opt('stage', 's1', '第 I 期') +
      opt('stage', 's23', '第 II／III 期') +
      opt('stage', 's4a', '第 IVA 期') +
      opt('stage', 's4b', '第 IVB 期'));

    h += step('us_s3lg', '3', '分期？',
      opt('stage', 's1', '第 I 期') +
      opt('stage', 's23', '第 II／III／IVA／IVB 期', '指引於低惡性度組將此四期合為一格'));

    h += '<div class="flow-rec rec-idle" id="us_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="us_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="usReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function usRender() {
    var s = usSt;
    var surgical = s.dx === 'post_hyst' || s.dx === 'biopsy';
    var lowish = s.histo === 'lowgrade' || s.histo === 'adeno_so';

    show('us_c1', surgical);
    show('us_s2', surgical);
    show('us_c2', surgical && !!s.histo);
    show('us_s3', surgical && s.histo === 'highgrade');
    show('us_s3lg', surgical && lowish);

    var done = s.dx === 'nosurg' || (surgical && !!s.dx);

    var rec = document.getElementById('us_rec');
    var fu = document.getElementById('us_fu');
    if (!rec) return;

    if (!done) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }

    // 已選病理型態但尚未選分期時，先停在手術計畫（不給輔助治療）
    var s2 = { dx: s.dx, histo: (s.histo && s.stage) ? s.histo : null, stage: s.stage };
    var r = recFor(s2);
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function usClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function usPick(key, val, btn) {
    var s = usSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'dx') {
      s.dx = val; s.histo = s.stage = null;
      usClearSel(['us_s2', 'us_s3', 'us_s3lg']);
    } else if (key === 'histo') {
      s.histo = val; s.stage = null;
      usClearSel(['us_s3', 'us_s3lg']);
    } else if (key === 'stage') {
      s.stage = val;
    }
    usRender();
  }

  function usReset() {
    for (var k in usSt) { if (usSt.hasOwnProperty(k)) usSt[k] = null; }
    var root = document.getElementById('usPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('us_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    usRender();
  }

  function initUtsarcPathway() { usReset(); }

  global.utsarcPathwayHTML = utsarcPathwayHTML;
  global.initUtsarcPathway = initUtsarcPathway;
  global.usPick = usPick;
  global.usReset = usReset;
})(window);
