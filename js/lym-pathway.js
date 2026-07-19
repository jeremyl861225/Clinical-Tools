/* ============================================================
   淋巴癌治療互動決策流程 Lymphoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 淋巴癌診療指引 版次 17
   （NTU Lymphoma Clinical Guideline, NTULYM-G6-2026，2026/06/16）
   放射治療段落另依同份指引「二、Lymphoma Radiation Therapy Guidelines」
   （NTUH 2025 Ver 1.0，第 51–71 頁）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。

   設計：淋巴癌的第一個決策是「病理亞型」，其後每個亞型各有自己的分期／
   風險／反應分叉，彼此不共用。故步驟 2–4 之題目與選項由 SUBS 表驅動，
   選擇亞型後才填入；藥物選單一律放在建議處置色塊內（見 skill 之
   「step 是決策、其餘是內容」原則）。
   ============================================================ */
(function (global) {
  'use strict';

  var lySt = { sub: null, a: null, b: null, c: null };

  /* ---------- 小工具 ---------- */
  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="lyPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function conn(id) { return '<div class="flow-connector" id="' + id + '">↓</div>'; }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function lyShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function lySel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }

  /* ---------- 常用藥物／療程片段 ---------- */
  function d(x) { return '<span class="drug">' + x + '</span>'; }
  function rx(x) { return '<span class="rx">' + x + '</span>'; }
  function h(x) { return '<span class="rx-h">' + x + '</span>'; }

  // 指引每頁下方之固定註記
  var NHI_NOTE = '指引原文以底線標示健保給付方案；本頁以文字註明，實際給付範圍以健保署最新公告為準。免疫治療副作用照護請詳見台大醫院「癌症免疫治療藥物照護原則」。';

  /* ---------- 追蹤區塊 ---------- */
  var FU = {
    // 第 5 頁（侷限期）與第 6 頁（蔓延期）之追蹤頻率不同，分開列
    nhl_limited: ['理學檢查與抽血：每 3–6 個月，持續 5 年。',
      '監測影像：至多至第 2 年，頻率不高於每 6 個月一次。',
      '<span class="tx-role" style="background:var(--muted-soft);">註</span> 參加臨床試驗者頻率可能不同，由 IRB 審查通過後實施。'],
    nhl_advanced: ['理學檢查與抽血：每 3–6 個月，持續 5 年。',
      '監測影像：第 1–2 年頻率不高於每 6 個月一次；其後 3 年可考慮每年一次。',
      '<span class="tx-role" style="background:var(--muted-soft);">註</span> 參加臨床試驗者頻率可能不同，由 IRB 審查通過後實施。'],
    indolent: ['理學檢查與抽血：每 3–6 個月，持續 5 年。',
      '監測影像：至多至第 2 年，頻率不高於每 6 個月一次。',
      '疾病進展時重新評估治療適應症（見上方適應症清單）。'],
    hl: ['理學檢查與抽血：第 1–2 年每 3–6 個月；至第 3 年每 6–12 個月；其後每年一次（追蹤至 5 年）。',
      'CT：療程結束後第 6、12、18、24 個月，或依臨床需要。<b>PET 僅在最後一次 PET 為 Deauville 4–5 時才做。</b>',
      '<b>滿 5 年後</b>：每年量血壓；療程結束後每 10 年考慮一次心臟超音波。',
      '<b>接受胸部或腋下放射治療者</b>：療程結束後 8–10 年，或年滿 40 歲起，每年乳房篩檢。'],
    pcnsl: ['腦部 MRI：每 3–6 個月，追蹤至 5 年。',
      '合併眼內或脊髓侵犯者，追蹤時一併評估該部位。'],
    tcell: ['理學檢查與抽血：每 3–6 個月，持續 5 年；監測影像頻率不高於每 6 個月一次。',
      '和緩型 T 細胞淋巴瘤出現<b>疾病進展或大細胞轉化</b>時，改依侵襲性 T 細胞淋巴瘤處理。']
  };

  function renderFollowup(type) {
    var el = document.getElementById('ly_fu');
    if (!el) return;
    if (!type || !FU[type]) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    el.innerHTML = '<div class="fu-label">追蹤與監測 Follow-up</div><ul class="fu-list"><li>' +
      FU[type].join('</li><li>') + '</li></ul>';
  }

  /* ---------- 建議處置色塊 ---------- */
  function ulRec(cls, title, lines, note) {
    var el = document.getElementById('ly_rec');
    if (!el) return;
    el.className = 'flow-rec ' + cls;
    el.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }
  function R(cls, title, lines, note, fu) { ulRec(cls, title, lines, note); renderFollowup(fu); }
  function idle(title) { ulRec('rec-idle', title, [], ''); renderFollowup(null); }

  /* ---------- 共用療程清單 ---------- */

  // 第 9 頁：DLBCL／HGBL／PMBCL 一線
  function dlbclFirstLine() {
    return [
      h('一線治療 First-line') + '<br>' + rx('R-CHOP') + '（健保）或 ' + rx('Pola-R-CHP') +
        '（' + d('polatuzumab vedotin') + '＋' + d('rituximab') + '＋' + d('cyclophosphamide') + '＋' + d('doxorubicin') + '＋' + d('prednisone') + '，POLARIX）。' +
        '<br><b>R-CHOP 最多六個療程</b>；<b>第一期非 bulky</b> 者，可考慮在 R-CHOP 三個療程後若正子為 CMR，再一次 R-CHOP 即進入觀察追蹤期。',
      h('依體能與共病調整') + '<ul>' +
        '<li><b>>80 歲或衰弱</b>：' + rx('R-mini-CHOP') + '／' + rx('Pola-R-mini-CHP') + '／' + rx('R-CVP') + '／' + rx('R+OP') + '／' + rx('BR') + '（' + d('bendamustine') + '±' + d('rituximab') + '）／' + d('lenalidomide') + '±' + d('rituximab') + '／' + d('rituximab') + ' 單方。</li>' +
        '<li><b>左心室射出分率不佳</b>：' + rx('R-CEOP') + '（以 ' + d('etoposide') + ' 或 ' + d('epirubicin') + ' 取代）／' + rx('R-CDOP') + '（' + d('liposomal doxorubicin') + '）／' + rx('R-GCVP') + '。</li></ul>',
      h('依亞型') + '<ul>' +
        '<li><b>PMBCL</b>：' + rx('DA-EPOCH-R') + '。</li>' +
        '<li><b>HGBL</b>：' + rx('R-CODOX-M／R-IVAC') + ' 或 ' + rx('Hyper-CVAD') + '；<b>可考慮前置自體周邊血幹細胞移植</b>。亦可 (' + d('glofitamab') + ' 或 ' + d('epcoritamab') + ')＋R-CHOP。</li>' +
        '<li><b>MYC／BCL2 雙表現 DLBCL</b>：' + d('tucidinostat') + '＋R-CHOP。</li>' +
        '<li><b>Smart Start</b>：' + rx('RLI') + ' 引導後接 R-CHOP。</li></ul>',
      h('一線維持治療（選擇性）') + '<br>' + d('lenalidomide') + '（60–80 歲）；' + d('cyclophosphamide') + ' 節拍式化療（選定病人）。',
      h('合併中樞神經侵犯') + '<ul>' +
        '<li><b>腦實質</b>：全身性高劑量 ' + d('methotrexate') + '（≥3 g/m²，於 21 天為一週期之 R-CHOP 第 15 天給予）。</li>' +
        '<li><b>腦膜</b>：三合一鞘內注射（TIT），或如上之全身性高劑量 ' + d('methotrexate') + '。</li></ul>'
    ];
  }

  // 第 10 頁：DLBCL／HGBL／PMBCL 救援
  function dlbclSalvage() {
    return [
      h('救援化療 Salvage chemotherapy') + '<br>' +
        rx('ESHAP') + '±R｜' + rx('GDP') + '±R｜' + rx('GemOx') + '±R｜' + rx('ICE') + '±R｜' +
        rx('DHAP') + '／' + rx('DHAX') + '／' + rx('DHAC') + '±R（X＝' + d('oxaliplatin') + '、C＝' + d('carboplatin') + '）｜' +
        rx('BOMES') + '±R｜' + rx('MINE') + '±R。',
      h('高劑量化療與細胞治療') + '<br>高劑量化療併<b>自體幹細胞救援</b>；<b>CAR-T</b>。',
      h('標靶與免疫治療') + '<ul>' +
        '<li>' + d('polatuzumab vedotin') + '＋BR 或 ＋R-GemOx。</li>' +
        '<li>' + d('glofitamab') + '（以 ' + d('obinutuzumab') + ' 前導）±GemOx（STARGLO）。</li>' +
        '<li>' + d('epcoritamab') + ' ±（R-ICE 或 R²）。</li>' +
        '<li>' + d('tafasitamab') + '＋' + d('lenalidomide') + '。</li>' +
        '<li>' + d('lenalidomide') + ' ±' + d('rituximab') + ' ±' + d('brentuximab vedotin') + '。</li>' +
        '<li>' + d('selinexor') + '；' + d('rituximab') + ' 單方。</li>' +
        '<li><b>PMBCL</b>：' + d('pembrolizumab') + ' 或 ' + d('nivolumab') + ' 併 ' + d('brentuximab vedotin') + '。</li></ul>',
      '其他已取得國內適應症的治療、經內科部血液科科會或腫瘤部部會公告的<b>恩慈療法</b>、或經專案申請獲准之治療。'
    ];
  }

  /* ---------- 亞型定義表 ---------- */
  /* 每個亞型：label（步驟 1 選項）、sub（選項副標）、steps（步驟 2–4）、rec（建議處置）。
     steps[i] = { q:題目, opts:[[值, 標題, 副標]...], when:function(s){顯示條件} } */
  var SUBS = {

    /* ===== 第 4–10 頁：DLBCL／HGBL／PMBCL ===== */
    dlbcl: {
      label: 'DLBCL／HGBL／PMBCL',
      sub: '瀰漫性大 B 細胞／高惡性度 B 細胞／原發縱膈大 B 細胞淋巴瘤',
      steps: [
        { q: '臨床分期（Modified Ann Arbor）', key: 'a', opts: [
          ['limited', '第一、二期 Stage I–II', '不論 non-bulky 或 bulky（第 5 頁）'],
          ['advanced', '第三、四期 Stage III–IV', '蔓延期（第 6 頁）']
        ] },
        { q: '誘導治療後之反應評估', key: 'b', opts: [
          ['cr', '完全緩解 CR／CMR', '完全（代謝）緩解'],
          ['pr', '部分緩解 PR／PMR', '部分（代謝）緩解'],
          ['pd', '無反應或疾病進展 NR／PD', 'No response or progressive disease']
        ] },
        { q: '是否為高劑量治療（自體移植）之候選者？', key: 'c',
          when: function (s) { return s.b === 'pd'; },
          opts: [
            ['hd', '是 · 適合高劑量治療', 'Candidate for high dose therapy'],
            ['nohd', '否 · 不適合高劑量治療', 'Not candidate for high dose therapy']
          ] }
      ],
      rec: function (s) {
        if (!s.a) return idle('請選擇步驟 2（臨床分期）');
        var fu = s.a === 'limited' ? 'nhl_limited' : 'nhl_advanced';
        if (!s.b) {
          if (s.a === 'limited') {
            return R('rec-elective', '第一、二期：臨床試驗，或一線治療 → 放療前評估',
              ['<b>誘導治療</b>：臨床試驗，或一線治療（如下）。',
                '<b>放射治療前評估</b>：重複所有初始為陽性之檢查（Pre-RT evaluation, repeat all positive studies），再依反應決定後續（見下方步驟 3）。'
              ].concat(dlbclFirstLine()),
              NHI_NOTE + '（第 5、9 頁）', null);
          }
          return R('rec-elective', '第三、四期：臨床試驗，或一線治療 → 期中再分期',
            ['<b>誘導治療</b>：臨床試驗，或一線治療（如下）。',
              '<b>期中再分期</b>：完成 <b>2–4 個療程</b>後重做影像與所有初始陽性之檢查，再依反應決定後續（見下方步驟 3）。',
              '<b>若用 R-CHOP</b>：加上期中評估在內，<b>不超過六個療程</b>。<b>若為 HGBL</b>：考慮化療併周邊血幹細胞收集（PBSCH）。'
            ].concat(dlbclFirstLine()),
            NHI_NOTE + '（第 6、9 頁）', null);
        }
        if (s.b === 'cr') {
          if (s.a === 'limited') {
            return R('rec-elective', '第一、二期 · 完全緩解 → 完成原訂療程',
              ['完成原訂之完整療程（complete planned course of treatment），進入追蹤。',
                '<b>第一期非 bulky</b> 者，可於 R-CHOP 三個療程後若正子為 CMR，再一次 R-CHOP 即進入觀察追蹤期。'],
              '第 5 頁。', fu);
          }
          return R('rec-elective', '第三、四期 · 完全代謝緩解（CMR）→ 完成療程',
            ['完成原訂療程；<b>若為 HGBL，考慮前置自體幹細胞移植（upfront ASCT）</b>。',
              '若用 R-CHOP，加上期中評估在內不超過六個療程。'],
            '第 6 頁。', fu);
        }
        if (s.b === 'pr') {
          if (s.a === 'limited') {
            return R('rec-elective', '第一、二期 · 部分緩解 → 完成療程 ± 放療 ± 自體移植',
              ['完成完整療程 <b>± 放射治療</b> <b>± 自體幹細胞移植（Auto-SCT）</b>。',
                h('放射治療劑量（中至高惡性度，第 64 頁）') + '<br>化療後 <b>CR → 鞏固性 ISRT／INRT／IFRT 30–40 Gy</b>；<b>PR → 40–56 Gy</b>；難治或不適合化療者 40–55 Gy。'],
              '第 5 頁；放療依「Lymphoma Radiation Therapy Guidelines」第 64 頁。', fu);
          }
          return R('rec-elective', '第三、四期 · 部分代謝緩解（PMR）→ 完成療程後續治療',
            ['完成原訂療程後，<b>擇一</b>：見復發／難治疾病之處置｜<b>選定病人給予維持治療</b>｜<b>選定病人給予放射治療</b>。',
              h('放射治療（第三、四期，第 64 頁）') + '<br>鞏固性放療為<b>選擇性</b>；何杰金氏以外之中至高惡性度淋巴瘤，PR 者照野劑量 40–56 Gy。'],
            '第 6 頁。', fu);
        }
        // PD
        if (!s.c) {
          return R('rec-nonop', '無反應／疾病進展 → 復發或難治疾病',
            ['依<b>是否適合高劑量治療</b>分流（見下方步驟 4）。',
              s.a === 'limited' ? '<b>第一、二期</b>另可於選定病人給予放射治療（RT in select patients）。'
                : '第三、四期無反應或進展者，直接進入復發／難治流程。'],
            '第 5、6、7 頁。', null);
        }
        if (s.c === 'hd') {
          return R('rec-nonop', '適合高劑量治療 → 救援治療 → 依反應決定鞏固',
            ['<b>先給</b>：臨床試驗，或救援治療（如下）。',
              '<b>救援後 CR 或 PR</b> → <b>自體幹細胞移植 ± IFRT</b>，或臨床試驗，或選定病人異體移植，或續行救援治療。',
              '<b>救援後無反應</b> → CAR-T，或臨床試驗，或緩和性放療，或最佳支持治療，或續行救援治療，或異體移植。',
              h('橋接放療（B 細胞淋巴瘤，第 65 頁）') + '<br>CAR-T 前之橋接放療為選擇性：<b>侷限病灶 20–40 Gy</b>；<b>廣泛病灶 20–30 Gy</b>。'
            ].concat(dlbclSalvage()),
            NHI_NOTE + '（第 7、10 頁；放療第 65 頁）', 'nhl_advanced');
        }
        return R('rec-urgent', '不適合高劑量治療 → CAR-T／臨床試驗／救援或緩和治療',
          ['<b>擇一</b>：<b>CAR-T</b>｜臨床試驗｜救援治療｜<b>緩和性放射治療</b>。',
            '<b>其後無反應</b> → 臨床試驗，或緩和性放療，或<b>最佳支持治療</b>，或續行救援治療，或異體移植。',
            h('橋接放療（第 65 頁）') + '<br>CAR-T 前橋接放療：侷限病灶 20–40 Gy；廣泛病灶 20–30 Gy。'
          ].concat(dlbclSalvage()),
          NHI_NOTE + '（第 7、10 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 11–13 頁：PCNSL ===== */
    pcnsl: {
      label: '原發中樞神經淋巴瘤 PCNSL',
      sub: 'Primary central nervous system lymphoma',
      steps: [
        { q: '誘導治療（高劑量 MTX 為主）後之反應', key: 'a', opts: [
          ['crpr', '完全或部分緩解 CR／PR', '進入鞏固治療'],
          ['pd', '無反應或疾病進展 NR／PD', '改採其他誘導或救援方案'],
          ['rec', '追蹤中復發 Recurrence', '再誘導治療']
        ] }
      ],
      rec: function (s) {
        var induction = [
          h('誘導治療 Induction') + '<br><b>高劑量 ' + d('methotrexate') + ' 為主之方案</b>；<b>若為 B 細胞則加上 ' + d('rituximab') + '</b>。',
          h('合併其他部位侵犯時') + '<ul>' +
            '<li><b>腦脊髓液細胞學陽性</b> → 鞘內化學治療。</li>' +
            '<li><b>眼部侵犯</b> → 考慮放射治療。</li>' +
            '<li><b>脊髓侵犯</b> → 考慮放射治療。</li>' +
            '<li><b>顱外侵犯</b> → 考慮加上其他侵襲性淋巴瘤之治療。</li></ul>'
        ];
        if (!s.a) {
          return R('rec-elective', 'PCNSL：高劑量 MTX 為主之誘導治療',
            induction.concat(['完成誘導後依反應決定鞏固或救援（見下方步驟 2）。',
              '<span class="tx-role" style="background:var(--muted-soft);">診斷</span> 神經外科認定無法切片時，可以<b>腦部 MRI ＋ 腰椎穿刺</b>之細胞學型態與流式細胞免疫表型建立診斷；顱內壓升高者腰椎穿刺有時須延後至化療後（第 3 頁）。']),
            NHI_NOTE + '（第 12 頁）', null);
        }
        if (s.a === 'crpr') {
          return R('rec-elective', 'CR／PR → 鞏固治療',
            induction.concat([
              h('鞏固治療 Consolidation（擇一）') + '<ul>' +
                '<li><b>全腦放射治療（WBRT）</b>。</li>' +
                '<li><b>自體周邊血幹細胞移植（APBSCT）</b>。</li>' +
                '<li>' + d('cytarabine') + ' 高劑量（HDAC）±' + d('etoposide') + '。</li>' +
                '<li><b>低劑量全腦放療</b>。</li></ul>',
              h('全腦放療劑量與範圍（第 68–69 頁）') + '<br>1.8–2.0 Gy/次。<b>CR 者 WBRT 20–36 Gy</b>；<b>PR、無反應或反應短暫者</b> WBRT 20–36 Gy 後局部加量至總劑量 40–50 Gy，或直接局部放療 40–50 Gy。CTV 含<b>顱內全部內容、後方視網膜、下至第 2 頸椎</b>；<b>眼內淋巴瘤須納入雙側眼球</b>。<b>年齡 ≥60 歲者鞏固性 WBRT 為選擇性</b>（延遲性神經毒性考量）。'
            ]),
            '第 12、68、69 頁。', 'pcnsl');
        }
        if (s.a === 'pd') {
          return R('rec-nonop', '無反應／疾病進展 → 改採其他方案',
            [h('擇一') + '<ul>' +
              '<li>高劑量 ' + d('methotrexate') + ' ±' + d('rituximab') + '。</li>' +
              '<li>' + d('temozolomide') + ' ±' + d('rituximab') + '。</li>' +
              '<li>' + d('lenalidomide') + ' ±' + d('rituximab') + '。</li>' +
              '<li>臨床試驗。</li></ul>',
              '不適合化療者：<b>全腦放療 20–36 Gy 後局部加量至 40–50 Gy</b>（第 68、69 頁）。'],
            NHI_NOTE + '（第 12 頁）', 'pcnsl');
        }
        return R('rec-nonop', '復發 → 再誘導（救援）治療',
          [h('再誘導 Re-induction') + '<br>高劑量 ' + d('methotrexate') + ' 為主之方案（B 細胞加 ' + d('rituximab') + '）；反應後同樣進入鞏固治療（APBSCT／HDAC±etoposide／低劑量 WBRT／WBRT）。',
            '<b>再次復發</b> → 改採其他救援方案，或 <b>' + d('tirabrutinib') + ' 等 BTK 抑制劑</b>。',
            '無反應或進展 → 高劑量 MTX±R／' + d('temozolomide') + '±R／' + d('lenalidomide') + '±R／臨床試驗。'],
          '第 13 頁。', 'pcnsl');
      }
    },

    /* ===== 第 14–16 頁：MCL ===== */
    mcl: {
      label: '被套細胞淋巴瘤 MCL',
      sub: 'Mantle cell lymphoma',
      steps: [
        { q: '分期與表現型態', key: 'a', opts: [
          ['early', '第一期，或相鄰之非 bulky 第二期', 'Stage I, or contiguous non-bulky stage II'],
          ['nonbulky2', '非相鄰之非 bulky 第二期，或白血病型非結節性 CLL-like 併脾腫大',
            'Non-contiguous non-bulky II, or leukemic non-nodal CLL-like with splenomegaly'],
          ['advanced', '非相鄰之 bulky 第二期，或第三、四期', 'Noncontiguous bulky II, or stage III–IV']
        ] },
        { q: '', key: 'b', dyn: true },
        { q: '治療後之反應評估', key: 'c',
          when: function (s) { return s.a === 'advanced' ? !!s.b : (s.a === 'nonbulky2' && s.b === 'sx'); },
          opts: [
            ['cr', '完全緩解 CR', ''],
            ['pr', '部分緩解 PR', '']
          ] }
      ],
      // 步驟 3 依步驟 2 而異
      dynStep: function (s, idx) {
        if (idx !== 1) return null;
        if (s.a === 'nonbulky2') {
          return { q: '有無症狀？', opts: [
            ['nosx', '無症狀 No symptoms', '→ 觀察'],
            ['sx', '有症狀 Symptomatic', '→ 進入全身性治療']
          ] };
        }
        if (s.a === 'advanced') {
          return { q: 'TP53 狀態（指引第 3 頁：確診 MCL 建議做 TP53 NGS）', opts: [
            ['wt', 'TP53 野生型 Wild type', '可用高強度一線治療'],
            ['mut', 'TP53 突變 Mutated', '高強度治療效益差，以臨床試驗或中等強度為主']
          ] };
        }
        return null;
      },
      rec: function (s) {
        var agg = h('高強度一線治療 Aggressive first-line') + '<ul>' +
          '<li>' + rx('VR-CAP') + '／' + rx('(V)R-DHAP') + ' 交替使用。</li>' +
          '<li>' + rx('BR') + ' 之後接 ' + rx('R-HDAC') + '（高劑量 ' + d('cytarabine') + '）。</li>' +
          '<li><b>Triangle 策略</b>：高劑量 ' + d('cytarabine') + ' 為主之誘導併 <b>BTK 抑制劑</b>，<b>不做自體周邊血幹細胞移植</b>。</li></ul>';
        var mod = h('中等強度一線治療 Moderate first-line') + '<ul>' +
          '<li>' + rx('BR') + '（' + d('bendamustine') + '＋' + d('rituximab') + '）。</li>' +
          '<li>' + rx('VR-CAP') + '。</li>' +
          '<li>' + d('lenalidomide') + '＋' + d('rituximab') + '。</li>' +
          '<li>' + rx('RBAC500') + '。</li></ul>';
        var salv = h('救援治療 Salvage') + '<ul>' +
          '<li>尚未使用過之一線方案。</li>' +
          '<li><b>BTK 抑制劑</b>：' + d('ibrutinib') + ' ±' + d('rituximab') + '｜' + d('acalabrutinib') + '｜' + d('zanubrutinib') + '。</li>' +
          '<li>' + d('ibrutinib') + '＋' + d('venetoclax') + '；' + d('bortezomib') + '＋' + d('rituximab') + '。</li>' +
          '<li>' + d('cladribine') + '；' + rx('R-GemOx') + '；' + rx('R-DHAP／C／X') + '。</li>' +
          '<li>' + d('glofitamab') + '；<b>異體幹細胞移植</b>。</li></ul>' +
          '其他已取得國內適應症的治療、恩慈療法或專案申請獲准之治療。';

        if (!s.a) return idle('請選擇步驟 2（分期與表現型態）');

        if (s.a === 'early') {
          return R('rec-elective', '第一期／相鄰非 bulky 第二期：放射治療或一線治療',
            ['<b>擇一</b>：<b>放射治療（RT）</b>，或<b>一線治療</b>。',
              h('放射治療劑量（低惡性度第一、二期，第 63 頁）') + '<br>建議劑量 <b>ISRT／INRT／IFRT 24–36 Gy</b>；替代劑量 20–50 Gy。',
              agg, mod],
            NHI_NOTE + '（第 15、16 頁；放療第 63 頁）', 'nhl_limited');
        }

        if (s.a === 'nonbulky2') {
          if (!s.b) return idle('請選擇步驟 3（有無症狀）');
          if (s.b === 'nosx') {
            return R('rec-elective', '無症狀 → 觀察 Observation',
              ['<b>觀察</b>，暫不治療；出現症狀時再進入全身性治療。',
                '<span class="tx-role" style="background:var(--muted-soft);">註</span> 白血病型非結節性 CLL-like 併脾腫大者，臨床行為近似和緩型，觀察是合理選項。'],
              '第 15 頁。', 'indolent');
          }
          // symptomatic → 同 advanced 之治療選單
          if (!s.c) {
            return R('rec-elective', '有症狀 → 臨床試驗，或一線治療',
              ['<b>擇一</b>：臨床試驗｜高強度一線治療 → PBSCH → 自體移植｜中等強度一線治療。',
                agg, mod],
              NHI_NOTE + '（第 15、16 頁）', null);
          }
        }

        if (s.a === 'advanced') {
          if (!s.b) return idle('請選擇步驟 3（TP53 狀態）');
          if (!s.c) {
            if (s.b === 'wt') {
              return R('rec-elective', 'TP53 野生型：臨床試驗，或高強度／中等強度一線治療',
                ['<b>擇一</b>：<b>臨床試驗</b>｜<b>高強度一線治療 → PBSCH → 自體幹細胞移植（ASCT）</b>｜<b>中等強度一線治療</b>。',
                  agg, mod],
                NHI_NOTE + '（第 15、16 頁）', null);
            }
            return R('rec-nonop', 'TP53 突變：臨床試驗，或中等強度一線治療',
              ['<b>擇一</b>：<b>臨床試驗</b>｜<b>中等強度一線治療</b>。',
                '<span class="tx-role" style="background:var(--muted-soft);">註</span> 指引在 TP53 突變分支<b>未列入</b>高強度治療 → PBSCH → ASCT；第 3 頁列 <b>TP53 NGS 為確診 MCL 之檢查項目（健保給付，需取健保署 VPN 帳號）</b>。',
                mod],
              NHI_NOTE + '（第 15、16 頁）', null);
          }
        }

        // 反應評估（nonbulky2 有症狀者，或 advanced）
        if (s.c === 'cr') {
          return R('rec-elective', '完全緩解 → 考慮 rituximab 維持治療，或追蹤',
            ['<b>擇一</b>：考慮 ' + d('rituximab') + ' <b>維持治療</b>｜<b>追蹤觀察</b>。'],
            '第 15 頁。', 'nhl_advanced');
        }
        return R('rec-nonop', '部分緩解 → 臨床試驗或救援治療',
          ['<b>擇一</b>：<b>臨床試驗</b>｜<b>救援治療</b>（如下）。', salv],
          NHI_NOTE + '（第 15、16 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 18–21 頁：濾泡型淋巴瘤 ===== */
    fl: {
      label: '濾泡型淋巴瘤 FL',
      sub: 'Follicular lymphoma',
      steps: [
        { q: '組織分級與分期', key: 'a', opts: [
          ['g3b', 'Grade 3B', '→ <b>比照 DLBCL 治療</b>'],
          ['early', 'Grade 1–3A · 第一期或相鄰第二期', '潛在可治癒 potentially curable'],
          ['adv', 'Grade 1–3A · 非相鄰第二期，或第三、四期', '依 GELF 適應症決定是否治療']
        ] },
        { q: 'GELF 治療適應症', key: 'b',
          when: function (s) { return s.a === 'adv'; },
          opts: [
            ['neg', 'GELF(−) 不符合任一條', '→ 觀察等待 Watch &amp; wait'],
            ['pos', 'GELF(+) 符合任一條', '→ 開始全身性治療']
          ] },
        { q: '治療後之反應評估', key: 'c',
          when: function (s) { return s.a === 'early' || (s.a === 'adv' && s.b === 'pos'); },
          opts: [
            ['pos', '有反應 Response(+)', ''],
            ['neg', '無反應 Response(−)', '']
          ] }
      ],
      rec: function (s) {
        var gelf = '<div class="cbx"><div class="cbx-h">GELF 治療適應症　<span class="cbx-sub">符合任一條即為 GELF(+)</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">①</span>≥3 個淋巴結部位，各 ≥3cm</span>' +
          '<span class="cb"><span class="cb-k">②</span>任一淋巴結或結外腫瘤 ≥7cm</span>' +
          '<span class="cb"><span class="cb-k">③</span>B 症狀</span>' +
          '<span class="cb"><span class="cb-k">④</span>脾腫大</span>' +
          '<span class="cb"><span class="cb-k">⑤</span>肋膜積液或腹水</span>' +
          '<span class="cb"><span class="cb-k">⑥</span>血球低下（白血球 &lt;1,000/µL 及／或血小板 &lt;100k/µL）</span>' +
          '<span class="cb"><span class="cb-k">⑦</span>白血病性惡性細胞 &gt;5,000/µL</span>' +
          '</div></div>';
        var first = h('一線治療 First-line') + '<ul>' +
          '<li>' + rx('BR') + '｜' + rx('R-CHOP') + '｜' + rx('R-CVP') + '。</li>' +
          '<li>' + rx('GB') + '｜' + rx('G-CHOP') + '｜' + rx('G-CVP') + '（G＝' + d('obinutuzumab') + '）。</li>' +
          '<li>' + d('lenalidomide') + '＋' + d('rituximab') + '；' + d('rituximab') + ' 單方。</li></ul>';
        var maint = h('一線維持治療 Maintenance') + '<br>' +
          d('rituximab') + ' 375 mg/m² <b>每 12 週一次，共 8 劑</b>；或 ' + d('obinutuzumab') + ' 1,000 mg <b>每 12 週一次，共 8 劑</b>。';
        var salv = h('救援治療 Salvage（適合高劑量化療併自體幹細胞救援者）') + '<ul>' +
          '<li>' + d('obinutuzumab') + '＋' + d('bendamustine') + '（用於 rituximab 抗藥）。</li>' +
          '<li>' + d('lenalidomide') + '＋' + d('rituximab') + '；' + d('obinutuzumab') + '＋' + d('zanubrutinib') + '（ROSEWOOD）。</li>' +
          '<li>(' + d('glofitamab') + ' 或 ' + d('epcoritamab') + ') ± 化療；<b>CAR-T</b>。</li>' +
          '<li>單方或合併：' + d('chlorambucil') + '／' + d('cyclophosphamide') + '｜' + d('vincristine') + '｜蒽環類或 ' + d('etoposide') + '｜' + d('fludarabine') + '｜' + d('cisplatin') + '｜' + d('cytarabine') + '｜' + d('rituximab') + ' 或放射免疫治療｜類固醇。</li>' +
          '<li><b>若已轉化為 DLBCL</b>：使用 DLBCL 之治療藥物。</li>' +
          '<li>臨床試驗中之研究用藥。</li></ul>' +
          '<span class="tx-role" style="background:var(--muted-soft);">註</span> 有共病者之化療方案調整由主治醫師視情況調整。';

        if (!s.a) return idle('請選擇步驟 2（組織分級與分期）');

        if (s.a === 'g3b') {
          return R('rec-nonop', 'Grade 3B → 比照 DLBCL 治療',
            ['<b>濾泡型淋巴瘤 Grade 3B 依 DLBCL 之流程與方案治療</b>——請於上方步驟 1 改選「DLBCL／HGBL／PMBCL」以取得完整流程。',
              '第 19 頁：Follicular Lymphoma (Grade 3B) → Treat as DLBCL。'],
            '第 19 頁。', null);
        }

        if (s.a === 'early') {
          if (!s.c) {
            return R('rec-elective', '第一期／相鄰第二期（潛在可治癒）',
              [h('擇一') + '<ul>' +
                '<li><b>ISRT</b>（involved-site 放射治療）。</li>' +
                '<li>ISRT ＋ <b>anti-CD20</b> ± 化學治療。</li>' +
                '<li>anti-CD20 ± 化學治療。</li>' +
                '<li>臨床試驗。</li></ul>',
                h('放射治療劑量（低惡性度第一、二期，第 63 頁）') + '<br>建議 <b>ISRT／INRT／IFRT 24–36 Gy</b>；替代劑量 20–50 Gy。和緩型淋巴瘤之減量放療（4 Gy）證據見 FORT 試驗。',
                '完成後進行反應評估（見下方步驟 4）。'],
              NHI_NOTE + '（第 19 頁；放療第 63 頁）', null);
          }
        }

        if (s.a === 'adv') {
          if (!s.b) {
            return R('rec-idle', '非相鄰第二期或第三、四期 → 先判定 GELF 適應症',
              [gelf, '請於下方步驟 3 選擇 GELF(+) 或 GELF(−)。'], '第 19 頁。', null);
          }
          if (s.b === 'neg') {
            return R('rec-elective', 'GELF(−) → 觀察等待 Watch &amp; wait',
              [gelf,
                '<b>觀察等待</b>，或參加臨床試驗。<b>不需立即治療</b>。',
                h('何時改為治療（第 20 頁）') + '<ul>' +
                  '<li>臨床試驗。</li><li>疾病相關症狀。</li><li>器官功能受威脅。</li>' +
                  '<li>Bulky 病灶。</li><li>疾病進展或血球低下。</li><li><b>轉化為 DLBCL</b>。</li></ul>'],
              '第 19、20 頁。', 'indolent');
          }
          if (!s.c) {
            return R('rec-elective', 'GELF(+) → anti-CD20 ± 化療 ± ISRT',
              [gelf, '<b>擇一</b>：<b>anti-CD20 ± 化學治療 ± ISRT</b>｜臨床試驗。', first, maint,
                '完成後進行反應評估（見下方步驟 4）。'],
              NHI_NOTE + '（第 19、21 頁）', null);
          }
        }

        if (s.c === 'pos') {
          return R('rec-elective', '有反應 → 維持治療、臨床試驗或觀察',
            ['<b>擇一</b>：<b>維持治療</b>｜<b>臨床試驗</b>｜<b>觀察</b>。', maint,
              '疾病進展時重新判定治療適應症；符合者再治療，不符合者續行觀察（第 20 頁）。'],
            '第 20、21 頁。', 'indolent');
        }
        return R('rec-nonop', '無反應 → 救援治療',
          [h('擇一') + '<ul><li>臨床試驗。</li><li><b>救援化學免疫治療</b>。</li><li><b>自體幹細胞移植（ASCT）</b>。</li><li><b>CAR-T</b>。</li></ul>', salv],
          NHI_NOTE + '（第 20、21 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 22–24 頁：CLL／SLL ===== */
    cll: {
      label: 'CLL／SLL',
      sub: '慢性淋巴球性白血病／小淋巴球性淋巴瘤',
      steps: [
        { q: '疾病型態與分期', key: 'a', opts: [
          ['sll_loc', 'SLL · 侷限（Ann Arbor 第一期）', '→ 局部放射治療（若有適應症）'],
          ['watch', 'SLL 蔓延期，或 CLL Rai 0–2／Binet A–B', '依治療適應症決定'],
          ['treat', 'CLL 進展中，或 Rai 3–4／Binet C', '→ 直接全身性治療'],
          ['richter', 'Richter 氏轉化', '→ 比照侵襲性淋巴瘤']
        ] },
        { q: '是否符合治療適應症？', key: 'b',
          when: function (s) { return s.a === 'watch'; },
          opts: [
            ['neg', '適應症(−)', '→ 觀察'],
            ['pos', '適應症(+)', '→ 全身性治療']
          ] },
        { q: '全身性治療後之反應與持續時間', key: 'c',
          when: function (s) { return s.a === 'treat' || (s.a === 'watch' && s.b === 'pos'); },
          opts: [
            ['long', '有反應且持續 >2 年', ''],
            ['short', '有反應但持續 <2 年', ''],
            ['neg', '無反應 Response(−)', '']
          ] }
      ],
      rec: function (s) {
        var ind = '<div class="cbx"><div class="cbx-h">治療適應症 Indications for treatment　<span class="cbx-sub">符合任一即可</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">·</span>臨床試驗</span>' +
          '<span class="cb"><span class="cb-k">·</span>疾病相關症狀</span>' +
          '<span class="cb"><span class="cb-k">·</span>倦怠</span>' +
          '<span class="cb"><span class="cb-k">·</span>盜汗</span>' +
          '<span class="cb"><span class="cb-k">·</span>體重減輕</span>' +
          '<span class="cb"><span class="cb-k">·</span>無感染之發燒</span>' +
          '<span class="cb"><span class="cb-k">·</span>器官功能受威脅</span>' +
          '<span class="cb"><span class="cb-k">·</span>Bulky 病灶</span>' +
          '<span class="cb"><span class="cb-k">·</span>進行性血球低下</span>' +
          '</div></div>';
        var sys = h('全身性治療藥物選項（單方或合併，第 24 頁）') + '<ul>' +
          '<li><b>標靶</b>：' + d('ibrutinib') + '｜' + d('acalabrutinib') + '｜' + d('zanubrutinib') + '｜' + d('venetoclax') + '。</li>' +
          '<li><b>抗 CD20</b>：' + d('rituximab') + ' 或 ' + d('obinutuzumab') + '。</li>' +
          '<li><b>化療</b>：' + d('chlorambucil') + '｜' + d('cyclophosphamide') + '｜' + d('vincristine') + '｜' + d('adriamycin') + '｜' + d('fludarabine') + '｜' + d('bendamustine') + '。</li>' +
          '<li>類固醇；臨床試驗中之研究用藥。</li></ul>';

        if (!s.a) return idle('請選擇步驟 2（疾病型態與分期）');

        if (s.a === 'sll_loc') {
          return R('rec-elective', 'SLL 侷限（第一期）→ 局部放射治療',
            ['<b>局部放射治療（local xRT），若有適應症</b>。',
              h('放射治療劑量（低惡性度第一、二期，第 63 頁）') + '<br>建議 <b>ISRT／INRT／IFRT 24–36 Gy</b>；替代劑量 20–50 Gy。'],
            '第 23 頁；放療第 63 頁。', 'indolent');
        }
        if (s.a === 'richter') {
          return R('rec-urgent', 'Richter 氏轉化 → 比照侵襲性淋巴瘤 ± 異體移植',
            ['<b>依侵襲性淋巴瘤處理（manage as aggressive lymphoma）± 異體造血幹細胞移植（allo-HSCT）</b>。',
              '侵襲性淋巴瘤之完整方案請於上方步驟 1 改選「DLBCL／HGBL／PMBCL」。'],
            '第 23 頁。', 'nhl_advanced');
        }
        if (s.a === 'watch' && !s.b) {
          return R('rec-idle', 'SLL 蔓延期／CLL Rai 0–2、Binet A–B → 先判定治療適應症',
            [ind, '請於下方步驟 3 選擇適應症(+) 或 (−)。'], '第 23 頁。', null);
        }
        if (s.a === 'watch' && s.b === 'neg') {
          return R('rec-elective', '適應症(−) → 觀察 Observation',
            [ind, '<b>觀察，暫不治療</b>；定期評估上列適應症，出現任一項時再開始全身性治療。'],
            '第 23 頁。', 'indolent');
        }
        if (!s.c) {
          return R('rec-elective', '開始全身性治療 → 反應評估',
            [ind, sys, '完成後評估反應與反應持續時間（見下方步驟 4）。'],
            NHI_NOTE + '（第 23、24 頁）', null);
        }
        if (s.c === 'long') {
          return R('rec-elective', '反應持續 >2 年 → 可沿用原藥或換未曝露藥物',
            ['<b>復發時：以先前使用過之藥物再治療，或換用未曝露之藥物</b>（retreat with prior drugs or switch to unexposed drugs）。', sys],
            '第 24 頁。', 'indolent');
        }
        if (s.c === 'short') {
          return R('rec-nonop', '反應持續 <2 年 → 換未曝露藥物 ± 異體移植',
            ['<b>以未曝露之藥物進行救援治療 ± 異體造血幹細胞移植（allo-HSCT）</b>。', sys],
            '第 24 頁。', 'nhl_advanced');
        }
        return R('rec-nonop', '無反應 → 換未曝露藥物 ± 異體移植',
          ['<b>以未曝露之藥物進行救援治療 ± 異體造血幹細胞移植（allo-HSCT）</b>。', sys],
          '第 24 頁。', 'nhl_advanced');
      }
    },

    /* ===== 第 25–26 頁：胃 MALToma ===== */
    malt: {
      label: '胃 MALT 淋巴瘤',
      sub: 'Gastric MALToma（黏膜相關淋巴組織淋巴瘤）',
      steps: [
        { q: '分期', key: 'a', opts: [
          ['early', '第一、二期（侷限）', '→ 先做幽門螺旋桿菌除菌'],
          ['adv', '第三、四期', '→ 比照晚期濾泡型淋巴瘤（Grade 1–2）']
        ] },
        { q: '除菌後之反應評估（HP 與淋巴瘤各自判定）', key: 'b',
          when: function (s) { return s.a === 'early'; },
          opts: [
            ['hn_ln', 'HP(−) · 淋巴瘤(−)', '兩者皆緩解'],
            ['hn_lp', 'HP(−) · 淋巴瘤(+)', '菌除掉了，淋巴瘤未退'],
            ['hp_ln', 'HP(+) · 淋巴瘤(−)', '菌未除掉，淋巴瘤已退'],
            ['hp_lp', 'HP(+) · 淋巴瘤(+)', '兩者皆未緩解']
          ] },
        { q: '', key: 'c', dyn: true }
      ],
      dynStep: function (s, idx) {
        if (idx !== 2) return null;
        if (s.b === 'hn_lp') {
          return { q: '有無症狀？', opts: [
            ['asx', '無症狀 Asymptomatic', '→ 觀察'],
            ['sx', '有症狀 Symptomatic', '→ 放療或全身性治療']
          ] };
        }
        if (s.b === 'hp_lp') {
          return { q: '淋巴瘤病灶穩定或進展？', opts: [
            ['stable', '穩定且無症狀 Stable and asymptomatic', '→ 僅做第二線除菌'],
            ['prog', '進展中或有症狀 Progressing or symptomatic', '→ 第二線除菌 ＋ 放療／全身性治療']
          ] };
        }
        return null;
      },
      rec: function (s) {
        var rt = h('放射治療（低惡性度第一、二期，第 63 頁）') + '<br>建議 <b>ISRT／INRT／IFRT 24–36 Gy</b>；替代劑量 20–50 Gy。<b>「if unexposed」＝先前未接受過該部位放療者才適用</b>。';
        var sysNhl = '<b>全身性治療比照其他和緩型非何杰金氏淋巴瘤</b>（systemic therapy as for other indolent NHL）——藥物選單請於上方步驟 1 改選「其他和緩型 B 細胞淋巴瘤」或「濾泡型淋巴瘤」。';

        if (!s.a) return idle('請選擇步驟 2（分期）');
        if (s.a === 'adv') {
          return R('rec-nonop', '第三、四期 → 比照晚期濾泡型淋巴瘤（Grade 1–2）',
            ['<b>依晚期濾泡型淋巴瘤（Grade 1–2）之流程處置</b>——請於上方步驟 1 改選「濾泡型淋巴瘤 FL」，並於分期選「Grade 1–3A · 非相鄰第二期，或第三、四期」，以 GELF 適應症決定是否治療。',
              '第 26 頁：Gastric MALToma (stage III/IV) → managements as follicular lymphoma (Grade 1-2) of advanced stages。'],
            '第 26 頁。', null);
        }
        if (!s.b) {
          return R('rec-elective', '第一、二期：幽門螺旋桿菌除菌 → 反應評估',
            ['<b>先做 HP 除菌（HP eradication）</b>，再以內視鏡與病理同時評估<b>細菌是否根除</b>與<b>淋巴瘤是否緩解</b>——這兩件事各自獨立，四種組合的處置都不同（見下方步驟 3）。'],
            '第 26 頁。', null);
        }
        if (s.b === 'hn_ln') {
          return R('rec-elective', 'HP(−) · 淋巴瘤(−) → 觀察',
            ['<b>觀察（Observe）</b>；細菌與淋巴瘤皆已緩解，不需追加治療。',
              '定期內視鏡追蹤。'],
            '第 26 頁。', 'indolent');
        }
        if (s.b === 'hp_ln') {
          return R('rec-elective', 'HP(+) · 淋巴瘤(−) → 第二線除菌',
            ['<b>第二線幽門螺旋桿菌除菌（2nd line HP eradication）</b>。',
              '淋巴瘤已緩解，故不需放療或全身性治療；除菌後續行追蹤。'],
            '第 26 頁。', 'indolent');
        }
        if (s.b === 'hn_lp') {
          if (!s.c) return idle('請選擇步驟 3（有無症狀）');
          if (s.c === 'asx') {
            return R('rec-elective', 'HP(−) · 淋巴瘤(+) · 無症狀 → 觀察',
              ['<b>觀察（Observe）</b>。細菌已根除、淋巴瘤雖仍在但無症狀，指引選擇先觀察。',
                '出現症狀時改為放療（若該部位未曾照射）或比照其他和緩型 NHL 之全身性治療。'],
              '第 26 頁。', 'indolent');
          }
          return R('rec-nonop', 'HP(−) · 淋巴瘤(+) · 有症狀 → 放療或全身性治療',
            ['<b>擇一</b>：<b>放射治療（若該部位先前未照射過）</b>｜<b>比照其他和緩型 NHL 之全身性治療</b>。', rt, sysNhl],
            '第 26 頁；放療第 63 頁。', 'indolent');
        }
        // hp_lp
        if (!s.c) return idle('請選擇步驟 3（病灶穩定或進展）');
        if (s.c === 'stable') {
          return R('rec-elective', 'HP(+) · 淋巴瘤(+) · 穩定且無症狀 → 第二線除菌',
            ['<b>僅做第二線幽門螺旋桿菌除菌</b>；病灶穩定且無症狀者暫不加放療或全身性治療。',
              '除菌後再次評估；若轉為進展或出現症狀，改走下一分支。'],
            '第 26 頁。', 'indolent');
        }
        return R('rec-nonop', 'HP(+) · 淋巴瘤(+) · 進展或有症狀 → 第二線除菌 ＋ 放療／全身性治療',
          ['<b>第二線幽門螺旋桿菌除菌</b>，<b>並且</b>加上：<b>放射治療（若該部位先前未照射過）</b>，或<b>比照其他和緩型 NHL 之全身性治療</b>。',
            '<span class="tx-role" style="background:var(--muted-soft);">注意</span> 此分支是「除菌<b>＋</b>治療」，不是二擇一（第 26 頁原圖為 2nd line HP eradication <b>＋</b> RT／systemic therapy）。',
            rt, sysNhl],
          '第 26 頁；放療第 63 頁。', 'indolent');
      }
    },

    /* ===== 第 27–28 頁：脾邊緣區淋巴瘤 ===== */
    smzl: {
      label: '脾邊緣區淋巴瘤 SMZL',
      sub: 'Splenic marginal zone lymphoma',
      steps: [
        { q: 'C 型肝炎病毒狀態', key: 'a', opts: [
          ['hcv', 'HCV(+)', '→ 先治療 C 型肝炎'],
          ['nohcv', 'HCV(−)，或無 HCV 治療適應症', '→ 依症狀與血球決定']
        ] },
        { q: '臨床表現', key: 'b',
          when: function (s) { return s.a === 'nohcv'; },
          opts: [
            ['asx', '無症狀 Asymptomatic', '→ 觀察'],
            ['sx', '血球低下或脾腫大 Cytopenia or splenomegaly', '→ 治療']
          ] }
      ],
      rec: function (s) {
        if (!s.a) return idle('請選擇步驟 2（HCV 狀態）');
        if (s.a === 'hcv') {
          return R('rec-elective', 'HCV(+) → 先給 C 型肝炎治療，再觀察',
            ['<b>先治療 C 型肝炎（HCV therapy）</b>——SMZL 與 HCV 感染相關，抗病毒治療本身即可能使淋巴瘤緩解。',
              '之後<b>觀察（Observe）</b>並定期臨床評估。',
              '<b>若疾病進展</b> → 比照其他<b>晚期和緩型非何杰金氏淋巴瘤</b>處置。'],
            '第 28 頁。', 'indolent');
        }
        if (!s.b) return idle('請選擇步驟 3（臨床表現）');
        if (s.b === 'asx') {
          return R('rec-elective', '無症狀 → 觀察 Observation',
            ['<b>觀察</b>並定期臨床評估；出現血球低下或脾腫大時再治療。',
              '<b>若疾病進展</b> → 比照其他晚期和緩型非何杰金氏淋巴瘤處置。'],
            '第 28 頁。', 'indolent');
        }
        return R('rec-elective', '血球低下或脾腫大 → 脾切除或 rituximab 為主之治療',
          [h('擇一（第 28 頁）') + '<ul>' +
            '<li><b>脾臟切除術（splenectomy）</b>。</li>' +
            '<li>' + d('rituximab') + ' ± 化學治療。</li>' +
            '<li>' + d('rituximab') + ' ± ' + d('lenalidomide') + '。</li></ul>',
            '治療後定期臨床評估；<b>疾病進展時比照其他晚期和緩型非何杰金氏淋巴瘤</b>處置。'],
          NHI_NOTE + '（第 28 頁）', 'indolent');
      }
    },

    /* ===== 第 29–31 頁：其他和緩型 B 細胞淋巴瘤 ===== */
    indolentb: {
      label: '其他和緩型 B 細胞淋巴瘤',
      sub: '含淋巴漿細胞淋巴瘤／Waldenström 巨球蛋白血症、毛狀細胞白血病、結節性邊緣區淋巴瘤等',
      steps: [
        { q: '分期', key: 'a', opts: [
          ['early', '第一、二期（非 bulky）', '→ 局部治療或觀察'],
          ['adv', 'Bulky 第二期，或第三、四期', '→ 依治療適應症決定']
        ] },
        { q: '是否符合治療適應症？', key: 'b',
          when: function (s) { return s.a === 'adv'; },
          opts: [
            ['neg', '適應症(−)', '→ 觀察'],
            ['pos', '適應症(+)', '→ 全身性治療']
          ] },
        { q: '全身性治療後之反應', key: 'c',
          when: function (s) { return s.a === 'adv' && s.b === 'pos'; },
          opts: [
            ['pos', '有反應 Response(+)', ''],
            ['neg', '無反應 Response(−)', '']
          ] }
      ],
      rec: function (s) {
        var ind = '<div class="cbx"><div class="cbx-h">治療適應症 Indications for treatment　<span class="cbx-sub">符合任一即可</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">·</span>臨床試驗</span>' +
          '<span class="cb"><span class="cb-k">·</span>疾病相關症狀</span>' +
          '<span class="cb"><span class="cb-k">·</span>倦怠</span>' +
          '<span class="cb"><span class="cb-k">·</span>盜汗</span>' +
          '<span class="cb"><span class="cb-k">·</span>體重減輕</span>' +
          '<span class="cb"><span class="cb-k">·</span>無感染之發燒</span>' +
          '<span class="cb"><span class="cb-k">·</span>器官功能受威脅</span>' +
          '<span class="cb"><span class="cb-k">·</span>Bulky 病灶</span>' +
          '<span class="cb"><span class="cb-k">·</span>疾病進展或血球低下</span>' +
          '<span class="cb"><span class="cb-k">·</span>病人意願</span>' +
          '</div></div>';
        var sys = h('全身性治療藥物選項（單方或合併，第 30 頁）') + '<ul>' +
          '<li>' + d('chlorambucil') + '｜' + d('cyclophosphamide') + '｜' + d('vincristine') + '｜蒽環類｜' + d('etoposide') + '｜' + d('bendamustine') + '。</li>' +
          '<li><b>CD20(+) 者</b>：' + d('rituximab') + '。</li>' +
          '<li>類固醇；臨床試驗中之治療。</li></ul>';
        var salv = h('救援治療藥物選項（單方或合併，第 31 頁）') + '<ul>' +
          '<li>' + d('chlorambucil') + ' 或 ' + d('cyclophosphamide') + '｜' + d('vincristine') + '｜蒽環類或 ' + d('etoposide') + '。</li>' +
          '<li>' + d('fludarabine') + '｜' + d('cisplatin') + '｜' + d('cytarabine') + '｜' + d('bendamustine') + '。</li>' +
          '<li><b>CD20(+) 者</b>：' + d('rituximab') + ' 或放射免疫治療。</li>' +
          '<li>類固醇；臨床試驗中之研究用藥。</li>' +
          '<li><b>Waldenström 巨球蛋白血症</b>：' + d('zanubrutinib') + '。</li></ul>';

        if (!s.a) return idle('請選擇步驟 2（分期）');
        if (s.a === 'early') {
          return R('rec-elective', '第一、二期：局部放療、rituximab ± 化療，或觀察',
            [h('擇一（第 30 頁）') + '<ul>' +
              '<li><b>局部放射治療（local xRT）</b>。</li>' +
              '<li>' + d('rituximab') + ' ± 化學治療。</li>' +
              '<li>放射治療 ＋ ' + d('rituximab') + ' ± 化學治療。</li>' +
              '<li><b>觀察</b>。</li></ul>',
              h('放射治療劑量（低惡性度第一、二期，第 63 頁）') + '<br>建議 <b>ISRT／INRT／IFRT 24–36 Gy</b>；替代劑量 20–50 Gy。'],
            NHI_NOTE + '（第 30 頁；放療第 63 頁）', 'indolent');
        }
        if (!s.b) {
          return R('rec-idle', 'Bulky 第二期或第三、四期 → 先判定治療適應症',
            [ind, '請於下方步驟 3 選擇適應症(+) 或 (−)。'], '第 30 頁。', null);
        }
        if (s.b === 'neg') {
          return R('rec-elective', '適應症(−) → 觀察 Observation',
            [ind, '<b>觀察，暫不治療</b>；定期評估上列適應症。'], '第 30 頁。', 'indolent');
        }
        if (!s.c) {
          return R('rec-elective', '適應症(+) → 全身性治療 → 反應評估',
            [ind, sys, '完成後評估反應（見下方步驟 4）。'], NHI_NOTE + '（第 30 頁）', null);
        }
        if (s.c === 'pos') {
          return R('rec-elective', '有反應 → 臨床追蹤 ± 自體移植',
            ['<b>臨床追蹤（clinical follow-up）± 自體造血幹細胞移植（auto-HSCT）</b>。',
              '疾病進展時重新判定治療適應症；符合者進入救援治療，不符合者續行觀察（第 31 頁）。'],
            '第 31 頁。', 'indolent');
        }
        return R('rec-nonop', '無反應 → 救援治療',
          [salv], NHI_NOTE + '（第 31 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 32–40 頁：何杰金氏淋巴瘤 ===== */
    hl: {
      label: '何杰金氏淋巴瘤 HL',
      sub: 'Hodgkin lymphoma',
      steps: [
        { q: '臨床分期與危險分組', key: 'a', opts: [
          ['fav', '第 IA–IIA 期 · Favorable', '無 bulky、≤3 個部位（第 55 頁）'],
          ['unfav', '第 I–II 期 · Unfavorable', 'Bulky 或 non-bulky 皆屬之（第 35 頁）'],
          ['adv', '第 III–IV 期', '晚期（第 36 頁）']
        ] },
        { q: '', key: 'b', dyn: true },
        { q: '', key: 'c', dyn: true }
      ],
      /* 依<b>步驟索引</b>回傳該格的題目，而不是「下一題」——渲染時每個版位各呼叫一次，
         若照狀態回傳「下一題」，同一份規格會被兩個版位取用，答完後兩格又同時落空。 */
      dynStep: function (s, idx) {
        var restage = [
          ['cr', '完全緩解 CR', ''],
          ['pr', '部分緩解 PR', ''],
          ['sdpd', '疾病穩定或進展 SD／PD', '→ 見復發／難治疾病']
        ];
        if (idx === 1) {
          if (s.a === 'adv') {
            return { q: '一線方案選擇（第 36 頁之兩條主線）', opts: [
              ['abvd', 'ABVD／A+AVD（第四期）× 2–4 療程 → 再分期', '第 36 頁上半'],
              ['beacopd', '考慮 escalated BEACOPD × 4 療程 → 再分期', '第 36 頁下半']
            ] };
          }
          return { q: '誘導化療後之再分期（Restaging）', opts: restage };
        }
        if (idx === 2) {
          if (s.a === 'adv') return { q: '再分期結果', opts: restage };
          // 侷限期只有 PR 需要追加治療，故僅此分支再問一次
          if ((s.a === 'fav' || s.a === 'unfav') && s.b === 'pr') {
            return { q: '追加治療後之再評估', opts: [
              ['cr', '完全緩解 CR', '→ 追蹤'],
              ['noncr', '未達完全緩解 Non-CR', '→ 見復發／難治疾病']
            ] };
          }
        }
        return null;
      },
      rec: function (s) {
        var first = h('一線治療 First-line（第 40 頁）') + '<ul>' +
          '<li>' + rx('ABVD') + '。</li>' +
          '<li>' + rx('BEACOPD') + '（D＝' + d('dacarbazine') + '）或 <b>escalated BEACOPD（eBEACOPD）</b>。</li>' +
          '<li><b>第三、四期</b>：' + rx('BrECADD') + '（HD21）｜' + rx('BV+AVD') + '（' + d('brentuximab vedotin') + '＋AVD）。</li>' +
          '<li><b>年長者</b>：AVD ＋ 放射治療｜' + d('brentuximab vedotin') + '＋' + d('dacarbazine') + '。</li>' +
          '<li>' + d('pembrolizumab') + ' 後接 AVD，或 ' + d('nivolumab') + '＋AVD；' + d('brentuximab vedotin') + '＋' + d('nivolumab') + '＋AVD。</li></ul>';
        var salv = h('二線／救援治療（第 40 頁）') + '<ul>' +
          '<li>' + rx('ESHAP') + '｜' + rx('DHAP／C／X') + '｜' + rx('ICE') + '｜' + rx('GVD') + '（' + d('gemcitabine') + '＋' + d('vinorelbine') + '＋類固醇）。</li>' +
          '<li>' + rx('IGEV') + '（' + d('ifosfamide') + '＋' + d('gemcitabine') + '＋' + d('vinorelbine') + '）｜' + rx('Benda-GEV') + '｜' + rx('miniBEAM') + '｜' + rx('MINE') + '。</li>' +
          '<li>' + d('brentuximab vedotin') + '（<b>僅限典型 HL</b>）單用或與 ' + d('nivolumab') + ' 等併用。</li>' +
          '<li>' + d('nivolumab') + '；' + d('pembrolizumab') + '；<b>異體幹細胞移植</b>。</li></ul>';
        var rtEarly = h('放射治療劑量（第 55 頁）') + '<ul>' +
          '<li><b>Favorable IA／IIA</b>（無 bulky、≤3 個部位）：CR 者 <b>ISRT／INRT／IFRT 20–30 Gy</b>；<b>化療後 PR 者 36–45 Gy</b>。</li>' +
          '<li><b>Unfavorable IA／IIA 或 IB／IIB</b>：CR 者 <b>20–30 Gy</b>；<b>PR 者 30–50 Gy</b>。</li></ul>' +
          '<b>照野定義（第 56–57 頁）</b>：INRT／ISRT 以<b>化療前</b>腫瘤體積為準；IFRT 為受侵犯之淋巴區域。GTV＝殘餘淋巴結；CR 者 CTV 為初始受侵犯之淋巴結，PR 者由 GTV 外擴涵蓋初始受侵犯淋巴結；<b>縱膈淋巴結之 CTV 寬度取化療後之縱膈寬度</b>；PTV 外放 0.3–1cm。避開從未受侵犯之正常結構（肌肉、血管、肺、心臟）。';
        var rtAdv = h('放射治療（第三、四期，第 58 頁）') + '<br><b>鞏固性放療為選擇性</b>，用於初始 bulky 或 PET 陽性之區域。適應症：<b>bulky 病灶｜未達完全緩解｜完全緩解不確定</b>。劑量：<b>CR 者 ISRT／INRT／IFRT 20–30 Gy</b>；<b>未達 CR 者再加量 10–16 Gy</b>。';

        if (!s.a) return idle('請選擇步驟 2（分期與危險分組）');

        /* --- 第 IA–IIA 期 Favorable（第 34 頁）--- */
        if (s.a === 'fav') {
          if (!s.b) {
            return R('rec-elective', '第 IA–IIA 期 Favorable：單用化療 ABVD → 再分期',
              ['<b>初始治療：單用化學治療（C/T alone）— ' + rx('ABVD') + '</b>，之後再分期（見下方步驟 3）。',
                first],
              NHI_NOTE + '（第 34、40 頁）', null);
          }
          if (s.b === 'cr') {
            return R('rec-elective', 'CR → ABVD 共 4 個療程即完成',
              ['<b>' + rx('ABVD') + ' 共 4 個療程（total 4）</b>，之後進入追蹤。',
                '<span class="tx-role" style="background:var(--muted-soft);">註</span> 這是 favorable 分組相對於 unfavorable（total 6）最主要的差別——CR 者療程數可減至 4。'],
              '第 34 頁。', 'hl');
          }
          if (s.b === 'sdpd') {
            return R('rec-nonop', 'SD／PD → 見復發或難治疾病',
              ['<b>直接進入復發／難治流程</b>（第 37 頁）：依<b>是否為自體移植候選者</b>分流。',
                '<b>適合自體移植</b>：臨床試驗或二線治療 → CR／PR 則 <b>自體移植 ± IFRT</b>，或臨床試驗，或選定病人異體移植 ± IFRT；無反應則臨床試驗或救援化療。',
                '<b>不適合自體移植</b>：臨床試驗，或二線治療，或<b>緩和性放療</b>；其後可臨床試驗／緩和放療／<b>最佳支持治療</b>／救援化療／異體移植。',
                salv],
              NHI_NOTE + '（第 34、37、40 頁）', 'nhl_advanced');
          }
          // PR
          if (!s.c) {
            return R('rec-elective', 'PR → 追加治療（ABVD 共 6，或 ABVD 4–6 ＋ IFRT，或 eBEACOPD）',
              [h('擇一（第 34 頁）') + '<ul>' +
                '<li>' + rx('ABVD') + ' 共 6 個療程。</li>' +
                '<li>' + rx('ABVD') + ' 共 4–6 個療程 <b>＋ IFRT</b>。</li>' +
                '<li><b>eBEACOPD</b>。</li></ul>',
                '追加治療後再評估（見下方步驟 4）。', rtEarly],
              NHI_NOTE + '（第 34、40、55 頁）', null);
          }
          if (s.c === 'cr') {
            return R('rec-elective', '追加治療後達 CR → 進入追蹤', ['完成治療，進入追蹤。', rtEarly], '第 34 頁。', 'hl');
          }
          return R('rec-nonop', '追加治療後仍未達 CR → 見復發或難治疾病',
            ['<b>進入復發／難治流程</b>（第 37 頁）：依是否為自體移植候選者分流（同上）。', salv],
            NHI_NOTE + '（第 34、37、40 頁）', 'nhl_advanced');
        }

        /* --- 第 I–II 期 Unfavorable（第 35 頁）--- */
        if (s.a === 'unfav') {
          if (!s.b) {
            return R('rec-elective', '第 I–II 期 Unfavorable：ABVD → 再分期',
              ['<b>初始治療：' + rx('ABVD') + '</b>（bulky 與 non-bulky 皆同），之後再分期（見下方步驟 3）。',
                '<div class="cbx"><div class="cbx-h">第一、二期之不良因子（第 39 頁）　<span class="cbx-sub">符合任一即為 unfavorable</span></div><div class="cbx-items">' +
                  '<span class="cb"><span class="cb-k">·</span>Bulky：CXR 縱膈腫塊 &gt;胸廓內徑 1／3，或 CT 任一腫塊 &gt;10cm</span>' +
                  '<span class="cb"><span class="cb-k">·</span>無症狀者 ESR ≥50</span>' +
                  '<span class="cb"><span class="cb-k">·</span>&gt;3 個淋巴區域</span>' +
                  '<span class="cb"><span class="cb-k">·</span>B 症狀</span>' +
                  '<span class="cb"><span class="cb-k">·</span>&gt;1 處淋巴組織外侵犯</span>' +
                  '</div></div>',
                first],
              NHI_NOTE + '（第 35、39、40 頁）', null);
          }
          if (s.b === 'cr') {
            return R('rec-elective', 'CR → ABVD 共 6 個療程 ± IFRT',
              ['<b>' + rx('ABVD') + ' 共 6 個療程（total 6）± IFRT</b>，之後進入追蹤。', rtEarly],
              '第 35、55 頁。', 'hl');
          }
          if (s.b === 'sdpd') {
            return R('rec-nonop', 'SD／PD → 見復發或難治疾病',
              ['<b>進入復發／難治流程</b>（第 37 頁）：依是否為自體移植候選者分流。', salv],
              NHI_NOTE + '（第 35、37、40 頁）', 'nhl_advanced');
          }
          if (!s.c) {
            return R('rec-elective', 'PR → ABVD 共 6 ± IFRT，或 eBEACOPD',
              [h('擇一（第 35 頁）') + '<ul>' +
                '<li>' + rx('ABVD') + ' 共 6 個療程 <b>± IFRT</b>。</li>' +
                '<li><b>eBEACOPD</b>。</li></ul>',
                '追加治療後再評估（見下方步驟 4）。', rtEarly],
              NHI_NOTE + '（第 35、40、55 頁）', null);
          }
          if (s.c === 'cr') {
            return R('rec-elective', '追加治療後達 CR → 進入追蹤', ['完成治療，進入追蹤。', rtEarly], '第 35 頁。', 'hl');
          }
          return R('rec-nonop', '追加治療後仍未達 CR → 見復發或難治疾病',
            ['<b>進入復發／難治流程</b>（第 37 頁）。', salv], NHI_NOTE + '（第 35、37、40 頁）', 'nhl_advanced');
        }

        /* --- 第 III–IV 期（第 36 頁）--- */
        if (!s.b) {
          return R('rec-elective', '第 III–IV 期：先選一線方案',
            ['<b>第 36 頁列出兩條平行主線</b>：<ul>' +
              '<li><b>' + rx('ABVD') + '／' + rx('A+AVD') + '（第四期）× 2–4 個療程</b> → 再分期。</li>' +
              '<li><b>考慮 escalated BEACOPD × 4 個療程</b> → 再分期。</li></ul>',
              first, rtAdv],
            NHI_NOTE + '（第 36、40、58 頁）', null);
        }
        if (!s.c) return idle('請選擇步驟 4（再分期結果）');
        if (s.c === 'sdpd') {
          return R('rec-nonop', 'SD／PD → 見復發或難治疾病',
            ['<b>進入復發／難治流程</b>（第 37 頁）：依是否為自體移植候選者分流。',
              '<b>第二次以上復發</b>：臨床試驗，或緩和性放療，或<b>最佳支持治療</b>，或救援化療，或異體移植。', salv],
            NHI_NOTE + '（第 36、37、40 頁）', 'nhl_advanced');
        }
        if (s.b === 'abvd') {
          if (s.c === 'cr') {
            return R('rec-elective', 'ABVD／A+AVD 後 CR → 完成 6 個療程（± IFRT）',
              [h('擇一（第 36 頁）') + '<ul>' +
                '<li>' + rx('ABVD') + ' 共 6 個療程。</li>' +
                '<li>' + rx('ABVD') + ' 共 6 個療程 <b>＋ IFRT</b>。</li>' +
                '<li>續用 ' + rx('A+AVD') + ' 共 6 個療程。</li></ul>', rtAdv],
              '第 36、58 頁。', 'hl');
          }
          return R('rec-elective', 'ABVD／A+AVD 後 PR → 完成 6 個療程 ± IFRT，再評估',
            [h('擇一（第 36 頁）') + '<ul>' +
              '<li>' + rx('ABVD') + ' 共 6 個療程 <b>± IFRT</b>。</li>' +
              '<li>續用 ' + rx('A+AVD') + ' 共 6 個療程。</li></ul>',
              '<b>其後再評估</b>：達 <b>CR</b> → 追蹤；<b>未達 CR</b> → 見復發或難治疾病（第 37 頁）。', rtAdv, salv],
            NHI_NOTE + '（第 36、37、58 頁）', 'hl');
        }
        // eBEACOPD 主線
        if (s.c === 'cr') {
          return R('rec-elective', 'eBEACOPD 後 CR → baseline BEACOPD 共 4 個療程 ± IFRT',
            ['<b>' + rx('BEACOPD') + '（baseline）共 4 個療程 ± IFRT</b>，之後進入追蹤。', rtAdv],
            '第 36、58 頁。', 'hl');
        }
        return R('rec-elective', 'eBEACOPD 後 PR → escalated BEACOPD 共 4 個療程 ± IFRT，再評估',
          ['<b>escalated BEACOPD 共 4 個療程 ± IFRT</b>。',
            '<b>其後再評估</b>：達 <b>CR</b> → 追蹤；<b>未達 CR</b> → 見復發或難治疾病（第 37 頁）。', rtAdv, salv],
          NHI_NOTE + '（第 36、37、58 頁）', 'hl');
      }
    },

    /* ===== 第 41–43 頁：侵襲性 T 細胞淋巴瘤 ===== */
    tcell: {
      label: '侵襲性 T 細胞淋巴瘤',
      sub: 'PTCL-NOS、AITL、ALCL（ALK±）、MEITL、ATL/L、肝脾 γδ TCL 等',
      steps: [
        { q: '期中再分期（誘導化療 4 個療程後）', key: 'a', opts: [
          ['crpr', '完全或部分緩解 CR／PR', '→ 完成誘導療程'],
          ['sdpd', '疾病穩定或進展 SD／PD', '→ 救援、緩和或臨床試驗'],
          ['rr', '難治或復發 Refractory／Recurrence', '完成誘導後又復發者']
        ] }
      ],
      rec: function (s) {
        var scope = '<div class="cbx"><div class="cbx-h">本流程涵蓋之亞型（第 41 頁）</div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">·</span>PTCL, NOS</span>' +
          '<span class="cb"><span class="cb-k">·</span>AITL</span>' +
          '<span class="cb"><span class="cb-k">·</span>Nodal PTCL with FTH phenotype</span>' +
          '<span class="cb"><span class="cb-k">·</span>系統性 ALCL（ALK 陽性或陰性）</span>' +
          '<span class="cb"><span class="cb-k">·</span>MEITL</span>' +
          '<span class="cb"><span class="cb-k">·</span>ATL/L</span>' +
          '<span class="cb"><span class="cb-k">·</span>肝脾或原發皮膚 γδ TCL</span>' +
          '<span class="cb"><span class="cb-k">·</span>原發皮膚 CD8+ 侵襲性表皮親和性細胞毒性 TCL</span>' +
          '<span class="cb"><span class="cb-k">·</span>毛囊親和性蕈狀肉芽腫</span>' +
          '<span class="cb"><span class="cb-k">·</span>濾泡性 TCL</span>' +
          '</div></div>';
        var first = h('一線誘導化療 First-line induction（第 43 頁）') + '<ul>' +
          '<li>' + rx('CHOP') + ' 或 ' + rx('mini-CHOP') + ' ±L｜' + rx('CHOEP') + ' 或 ' + rx('mini-CHOEP') + ' ±L。</li>' +
          '<li>' + rx('DA-EPOCH') + ' ±L（劑量層級由主治醫師決定）。</li>' +
          '<li><b>左心室射出分率不佳</b>：' + rx('CEOP') + '（' + d('etoposide') + '）／' + rx('CDOP') + '（' + d('liposomal doxorubicin') + '）／' + rx('R-GCVP') + ' ±L。</li>' +
          '<li>' + d('bendamustine') + ' ±L｜' + rx('A+CHP') + '（' + d('brentuximab vedotin') + '＋CHP）｜' + rx('LVD') + '｜' + rx('AspaMetDex') + '。</li></ul>' +
          '<span class="tx-role" style="background:var(--muted-soft);">註</span> <b>L ＝ ' + d('L-asparaginase') + '</b>。有共病者之方案調整由主治醫師決定。';
        var salv = h('救援治療 Salvage（第 43 頁）') + '<ul>' +
          '<li>' + d('pralatrexate') + ' ±L｜' + rx('ESHAP') + ' ±L｜' + rx('GDP') + ' ±L｜' + rx('GemOx') + ' ±L｜' + rx('ICE') + ' ±L。</li>' +
          '<li>' + rx('DHAP／C／X') + ' ±L｜' + rx('MINE') + ' ±L｜' + d('bendamustine') + ' ±L｜' + rx('AspaMetDex') + '。</li>' +
          '<li>' + d('mogamulizumab') + '（復發／難治之 ATLL 或蕈狀肉芽腫）｜' + d('tucidinostat') + '。</li>' +
          '<li>' + d('pembrolizumab') + '（復發／難治之蕈狀肉芽腫）｜<b>全皮膚電子束治療</b>（Sézary 症候群）。</li></ul>';

        if (!s.a) {
          return R('rec-elective', '侵襲性 T 細胞淋巴瘤：臨床試驗，或一線誘導化療 × 4 療程',
            [scope,
              '<b>第一、二、三、四期同一條流程</b>（第 42 頁原圖之起點即為 Stage I,II,III,IV）——與 B 細胞淋巴瘤不同，分期在此不改變起始治療。',
              '<b>擇一</b>：<b>臨床試驗</b>｜<b>建議之一線誘導化療 × 4 個療程</b>，之後做<b>期中再分期</b>（見下方步驟 2）。',
              first],
            NHI_NOTE + '（第 41、42、43 頁）', null);
        }
        if (s.a === 'crpr') {
          return R('rec-elective', 'CR／PR → 完成誘導療程，並考慮前置幹細胞移植',
            [scope,
              '<b>完成誘導療程（complete induction）</b>。',
              '<b>並考慮前置幹細胞移植（consider upfront SCT）</b>，或直接進入追蹤。',
              '<span class="tx-role" style="background:var(--muted-soft);">註</span> 第 42 頁原圖在 complete induction 之後同時畫出「Consider upfront SCT」與「Follow-up」兩個去向，並非只有移植一途。',
              first],
            NHI_NOTE + '（第 42、43 頁）', 'nhl_advanced');
        }
        if (s.a === 'sdpd') {
          return R('rec-nonop', 'SD／PD → 救援治療、緩和治療或臨床試驗',
            [scope,
              '<b>擇一</b>：<b>救援治療</b>｜<b>緩和治療（palliation）</b>｜<b>臨床試驗</b>。',
              '<b>救援或臨床試驗有反應者</b> → <b>考慮鞏固性幹細胞移植（consolidative SCT）</b>；<b>緩和治療者</b> → 追蹤。',
              salv],
            NHI_NOTE + '（第 42、43 頁）', 'nhl_advanced');
        }
        return R('rec-nonop', '難治或復發 → 救援治療 ± 鞏固性幹細胞移植',
          [scope,
            '完成誘導後難治或復發者，同樣進入<b>救援治療／緩和治療／臨床試驗</b>三選一；有反應者<b>考慮鞏固性幹細胞移植</b>。',
            salv],
          NHI_NOTE + '（第 42、43 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 44–46 頁：結外 NK/T 細胞淋巴瘤（鼻型） ===== */
    enktl: {
      label: '結外 NK/T 細胞淋巴瘤（鼻型）',
      sub: 'Extranodal NK/T-cell lymphoma, nasal type',
      steps: [
        { q: '臨床分期', key: 'a', opts: [
          ['limited', '第一、二期（limited stage）', '誘導化療併同步放射治療'],
          ['extensive', '第三、四期（extensive stage）', '全身性誘導化療']
        ] },
        { q: '誘導後再分期', key: 'b', opts: [
          ['cr', '完全緩解 CR', ''],
          ['noncr', '未達 CR（＝難治）或復發', 'Non-CR (refractory) or recurrence']
        ] }
      ],
      rec: function (s) {
        var salv = h('救援治療 Salvage（第 46 頁）') + '<ul>' +
          '<li>' + d('pralatrexate') + ' ±L｜' + rx('ESHAP') + ' ±L｜' + rx('GDP') + ' ±L｜' + rx('GemOx') + ' ±L｜' + rx('ICE') + ' ±L。</li>' +
          '<li>' + rx('DHAP') + ' ±L｜' + rx('DHAX') + ' ±L｜' + rx('MINE') + ' ±L｜' + d('bendamustine') + ' ±L｜' + rx('AspaMetDex') + '。</li></ul>' +
          '<span class="tx-role" style="background:var(--muted-soft);">註</span> <b>L ＝ ' + d('L-asparaginase') + '</b>——ENKTL 對含 L-asparaginase 之方案特別敏感，這是本病與其他 T 細胞淋巴瘤最重要的治療差異。';

        if (!s.a) return idle('請選擇步驟 2（臨床分期）');
        if (!s.b) {
          if (s.a === 'limited') {
            return R('rec-elective', '第一、二期：臨床試驗，或侷限期誘導化療（併同步放療）',
              [h('侷限期誘導方案（第 46 頁）') + '<ul>' +
                '<li><b>2/3 ' + rx('DeVIC') + ' ＋ 同步放射治療</b>。</li>' +
                '<li>' + rx('VIPD') + ' ＋ 同步放射治療。</li>' +
                '<li>' + rx('LVD') + ' ＋ <b>同步或三明治式</b>放射治療。</li>' +
                '<li>' + rx('AspaMetDex') + '。</li></ul>',
                '<b>放射治療在侷限期 ENKTL 是治療主體之一，不是附加</b>——三個方案中有三個明列併用放療。',
                '完成誘導後做再分期（見下方步驟 3）。'],
              NHI_NOTE + '（第 45、46 頁）', null);
          }
          return R('rec-elective', '第三、四期：臨床試驗，或蔓延期誘導化療',
            [h('蔓延期誘導方案（第 46 頁）') + '<ul>' +
              '<li>' + rx('DDGP') + '｜' + rx('GeLOx') + '｜' + rx('SMILE') + '。</li>' +
              '<li>' + rx('VIPD') + '｜' + rx('LVD') + '｜' + rx('AspaMetDex') + '。</li></ul>',
              '完成誘導後做再分期（見下方步驟 3）。'],
            NHI_NOTE + '（第 45、46 頁）', null);
        }
        if (s.b === 'cr') {
          return R('rec-elective', 'CR → 幹細胞移植（自體或異體）或追蹤',
            ['<b>' + (s.a === 'limited' ? '第一、二期' : '第三、四期') + ' 達 CR</b>：可行<b>幹細胞移植（allo 或 auto）</b>，或直接進入追蹤。',
              '<span class="tx-role" style="background:var(--muted-soft);">註</span> 第 45 頁原圖在 CR 之後同時畫出「SCT: allo or auto」與「Follow-up」兩個去向。'],
            '第 45 頁。', 'nhl_advanced');
        }
        return R('rec-nonop', '未達 CR（難治）或復發 → 救援、緩和或臨床試驗',
          ['<b>擇一</b>：<b>救援治療</b>｜<b>緩和治療</b>｜<b>臨床試驗</b>。',
            '<b>有反應者</b> → <b>幹細胞移植（allo 或 auto）</b>；緩和治療者 → 追蹤。',
            salv],
          NHI_NOTE + '（第 45、46 頁）', 'nhl_advanced');
      }
    },

    /* ===== 第 47–48 頁：和緩型 T 細胞淋巴瘤 ===== */
    indolentt: {
      label: '和緩型 T 細胞淋巴瘤',
      sub: '蕈狀肉芽腫／Sézary 症候群、原發皮膚 CD30+ ALCL、淋巴瘤樣丘疹病、T/NK-LGL 等',
      steps: [
        { q: '治療後之反應', key: 'a', opts: [
          ['resp', '有反應 Responsive', '→ 追蹤'],
          ['pd', '疾病進展或大細胞轉化', 'PD or large cell transformation']
        ] }
      ],
      rec: function (s) {
        var scope = '<div class="cbx"><div class="cbx-h">本流程涵蓋之亞型（第 47 頁）</div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">·</span>蕈狀肉芽腫／Sézary 症候群</span>' +
          '<span class="cb"><span class="cb-k">·</span>原發皮膚 CD30+ ALCL 或淋巴瘤樣丘疹病</span>' +
          '<span class="cb"><span class="cb-k">·</span>T 或 NK 大顆粒淋巴球白血病（LGL）</span>' +
          '<span class="cb"><span class="cb-k">·</span>皮下脂膜炎樣 TCL（無噬血症候群或大細胞轉化者）</span>' +
          '</div></div>';
        var menu = h('治療選項（第 48 頁；由皮膚科與／或血液腫瘤科醫師視情況決定）') + '<ul>' +
          '<li><b>皮膚導向治療</b>：光照治療｜局部放射治療或<b>全皮膚電子束治療</b>｜外用藥物。</li>' +
          '<li><b>全身性</b>：' + d('isotretinoin') + '｜' + d('ATRA') + '｜' + d('interferon alpha') + '｜' + d('methotrexate') + '。</li>' +
          '<li>' + d('brentuximab vedotin') + '｜' + d('gemcitabine') + '｜' + d('pralatrexate') + '｜' + d('doxorubicin') + '。</li>' +
          '<li>' + d('chlorambucil') + '｜' + d('cyclophosphamide') + '｜' + d('etoposide') + '｜' + d('bortezomib') + '。</li></ul>';

        if (!s.a) {
          return R('rec-elective', '和緩型 T 細胞淋巴瘤：依病灶範圍選擇治療',
            [scope,
              '<b>本病<u>沒有</u>固定的分期導向流程</b>——第 48 頁列出的是一份治療選單，<b>由皮膚科與／或血液腫瘤科醫師依病灶範圍與病人狀況決定</b>。',
              menu,
              '治療後依反應決定後續（見下方步驟 2）。'],
            NHI_NOTE + '（第 47、48 頁）', null);
        }
        if (s.a === 'resp') {
          return R('rec-elective', '有反應 → 追蹤', [scope, '<b>進入追蹤</b>；復發時可重複或更換上述治療選項。', menu],
            '第 48 頁。', 'tcell');
        }
        return R('rec-nonop', '疾病進展或大細胞轉化 → 改依侵襲性 T 細胞淋巴瘤處理',
          [scope,
            '<b>出現疾病進展或大細胞轉化者，改依「侵襲性 T 細胞淋巴瘤」之流程與方案治療</b>——請於上方步驟 1 改選該亞型以取得完整流程。',
            '第 48 頁：PD or large cell transformation → See aggressive TCL。'],
          '第 48 頁。', 'tcell');
      }
    }
  };

  var SUB_ORDER = ['dlbcl', 'pcnsl', 'mcl', 'fl', 'cll', 'malt', 'smzl', 'indolentb', 'hl', 'tcell', 'enktl', 'indolentt'];

  /* ---------- 版面 HTML ---------- */
  function lymPathwayHTML() {
    var h2 = '';
    h2 += '<p class="onc-note">依 <b>台大醫院淋巴癌診療指引 版次 17</b>（NTULYM-G6-2026，2026/06/16）之互動決策流程；放射治療劑量依同份指引「二、Lymphoma Radiation Therapy Guidelines」（2025 Ver 1.0）。<b>淋巴癌的第一個決策是病理亞型</b>，其後各亞型之分期與反應分叉互不相通，故請先選亞型。逐步點選以取得對應建議處置、藥物療程與追蹤方式。</p>';
    h2 += '<div class="onc-path" id="lymPath">';

    // 步驟 1：病理亞型
    var o = '';
    SUB_ORDER.forEach(function (k) { o += opt('sub', k, SUBS[k].label, SUBS[k].sub); });
    h2 += step('ly_s1', '1', '病理亞型 Histologic subtype', o,
      '<div class="note"><b>診斷依據（第 3 頁）</b>：切除性切片、粗針切片（建議 16G 或 18G）、骨髓抽吸併免疫表型，或（僅限神經外科認定無法切片之原發中樞神經淋巴瘤）腦部 MRI ＋ 腰椎穿刺細胞學與流式細胞免疫表型；外院診斷者建議由本院血液病理科覆閱。</div>');

    // 步驟 2–4：內容由亞型決定，選定後填入
    h2 += connH('ly_c2');
    h2 += '<div class="flow-step hidden" id="ly_s2"></div>';
    h2 += connH('ly_c3');
    h2 += '<div class="flow-step hidden" id="ly_s3"></div>';
    h2 += connH('ly_c4');
    h2 += '<div class="flow-step hidden" id="ly_s4"></div>';

    h2 += '<div class="flow-rec rec-idle" id="ly_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請先於步驟 1 選擇病理亞型</div></div>';
    h2 += '<div class="flow-fu hidden" id="ly_fu"></div>';

    h2 += '<div class="flow-reset"><button class="btn-reset" onclick="lyReset()">重置</button></div>';
    h2 += '</div>';
    return h2;
  }

  /* ---------- 步驟填充 ---------- */
  function fillStep(elId, num, spec, key) {
    var el = document.getElementById(elId);
    if (!el || !spec) return;
    var o = '';
    spec.opts.forEach(function (x) { o += opt(key, x[0], x[1], x[2]); });
    el.innerHTML = '<div class="flow-step-head"><span class="flow-num">' + num + '</span>' +
      '<span class="flow-q">' + spec.q + '</span></div><div class="flow-opts">' + o + '</div>';
  }

  // 取得某亞型第 n 個步驟之規格（dyn 者由 dynStep 產生）
  function specFor(def, s, idx) {
    var st = def.steps[idx];
    if (!st) return null;
    if (st.when && !st.when(s)) return null;
    if (st.dyn) {
      var dyn = def.dynStep ? def.dynStep(s, idx) : null;
      if (!dyn) return null;
      return { q: dyn.q, opts: dyn.opts, key: st.key };
    }
    return { q: st.q, opts: st.opts, key: st.key };
  }

  /* ---------- 主渲染 ---------- */
  function lyRender() {
    var s = lySt;
    var def = s.sub ? SUBS[s.sub] : null;

    if (!def) {
      ['ly_c2', 'ly_s2', 'ly_c3', 'ly_s3', 'ly_c4', 'ly_s4'].forEach(function (id) { lyShow(id, false); });
      idle('請先於步驟 1 選擇病理亞型');
      return;
    }

    /* 收集「在目前選擇下實際適用」的步驟，依序填入版位。
       中間步驟不適用時必須<b>跳過而非中斷</b>——例如濾泡型第一期不需判定 GELF，
       但仍要問反應評估；CLL 第 Rai 3–4 期直接治療、不需判定適應症，但仍要問反應。
       早期版本以「上一個版位是否已作答」當作下一步的條件，這兩條分支因而永遠走不到
       最後一步（瀏覽器逐支點測時抓到）。 */
    var slots = ['ly_s2', 'ly_s3', 'ly_s4'];
    var conns = ['ly_c2', 'ly_c3', 'ly_c4'];
    var visible = [];
    for (var i = 0; i < def.steps.length && visible.length < slots.length; i++) {
      var sp = specFor(def, s, i);
      if (!sp) continue;                 // 此步驟於目前選擇下不適用 → 略過，續看下一個
      visible.push(sp);
      if (!s[sp.key]) break;             // 尚未作答 → 後面的先不顯示
    }

    slots.forEach(function (id, k) {
      var spec = visible[k];
      lyShow(conns[k], !!spec);
      lyShow(id, !!spec);
      if (!spec) return;
      fillStep(id, String(k + 2), spec, spec.key);
      // 步驟內容是重建的，selected 狀態須自行還原
      var v = s[spec.key];
      if (!v) return;
      document.getElementById(id).querySelectorAll('.flow-opt').forEach(function (b) {
        if (b.getAttribute('onclick').indexOf("'" + v + "'") !== -1) b.classList.add('selected');
      });
    });

    def.rec(s);
  }

  /* ---------- 事件 ---------- */
  function lyPick(key, val, btn) {
    lySel(btn);
    if (key === 'sub') {
      lySt.sub = val; lySt.a = lySt.b = lySt.c = null;
    } else if (key === 'a') {
      lySt.a = val; lySt.b = lySt.c = null;          // 上游改變即清空下游
    } else if (key === 'b') {
      lySt.b = val; lySt.c = null;
    } else if (key === 'c') {
      lySt.c = val;
    }
    lyRender();
  }

  function lyReset() {
    lySt.sub = lySt.a = lySt.b = lySt.c = null;
    var root = document.getElementById('lymPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('ly_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    lyRender();
  }

  function initLymPathway() { lyReset(); }

  // 匯出
  global.lymPathwayHTML = lymPathwayHTML;
  global.initLymPathway = initLymPathway;
  global.lyPick = lyPick;
  global.lyReset = lyReset;
})(window);
