/* ============================================================
   腎細胞癌治療互動決策流程 Renal Cell Carcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 腎臟癌診療指引
   版次 15（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000020
   指引本文標題 Clinical Guidelines of Kidney Cancer, NTUH-V1.2026
   ※ 流程結構依指引第 2 頁之決策圖判讀（非文字順序）。三個容易讀錯之處：
     ① 指引把<b>組織型態（clear cell vs non-clear cell）放在全身性治療之前</b>，
        而且<b>只掛在需要全身性治療的那一段</b>——第 I–III 期手術完直接進 Regular F/U，
        不經組織型態分流；復發後才回到全身性治療。
     ② 第 IV 期不是單一方塊，而是<b>依「手術可行性」分成三格</b>：可切除之單一轉移、
        原發可切除但多處轉移、手術不可切除。三格的下一步完全不同。
     ③ 非亮細胞型<b>只有一份藥單，沒有 1st／2nd line 之分</b>；亮細胞型才分兩線。
        指引在非亮細胞型該格以 <b>Clinical trial (preferred) or Sunitinib (preferred)</b> 開頭。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var rcSt = {
    stage: null,   // early | four
    surg: null,    // s_radical | s_nss              （第 I–III 期）
    m4: null,      // m_solitary | m_multi | m_unres （第 IV 期）
    histo: null    // cc | ncc
  };

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
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }
  function d(name) { return '<span class="drug">' + name + '</span>'; }

  /* ---------- 檢查與縮寫（指引第 2 頁上方）---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>初始評估與檢查 Workup ▸</summary>' +
      '<div class="dx-h">病史與理學檢查（指引明列）</div>' +
      '<ul class="dx-list">' +
      '<li><b>典型三聯徵 Triad</b>：<b>腰脅痛 flank pain</b>、<b>腰脅腫塊 flank mass</b>、<b>血尿 hematuria</b>' +
      '——但指引同時把<b>「因腎臟影像偶然發現」</b>畫成與三聯徵並列的入口，' +
      '現今多數腎細胞癌屬於後者。</li>' +
      '<li>血液檢查：<b>CBC、生化、電解質、LDH、ALP</b></li>' +
      '<li><b>臨床有需要時考慮針刺切片</b>（consider needle biopsy, if clinically indicated）</li>' +
      '</ul>' +
      '<div class="dx-h">主要檢查 Essential</div>' +
      '<ul class="dx-list">' +
      '<li><b>腹部 CT 或 MRI</b></li>' +
      '<li><b>胸部 X 光 CXR</b></li>' +
      '</ul>' +
      '<div class="dx-h">次要檢查 Optional</div>' +
      '<ul class="dx-list">' +
      '<li>腎臟超音波 Renal echo</li>' +
      '<li>骨骼掃描 Bone scan</li>' +
      '<li>腦部 MRI——<b>臨床有需要時</b></li>' +
      '<li><b>疑為尿路上皮癌時</b>（如中央型腫塊 central mass）：考慮<b>尿液細胞學、IVU、輸尿管鏡與逆行性攝影</b>' +
      '——此條是為了<b>把腎盂尿路上皮癌從腎細胞癌裡篩出來</b>，兩者治療完全不同（見本頁「上泌尿道腫瘤」）。</li>' +
      '</ul>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>RCC</b> — renal cell carcinoma 腎細胞癌</li>' +
      '<li><b>NSS</b> — nephron-sparing surgery 腎元保留手術（部分腎切除）</li>' +
      '<li><b>RFA</b> — radiofrequency ablation 射頻消融</li>' +
      '<li><b>IL-2</b> — interleukin-2　｜　<b>mets</b> — metastases 轉移</li>' +
      '<li><b>IMDC</b> — International Metastatic RCC Database Consortium 風險分層（指引以 poor／intermediate／favorable risk 引用）</li>' +
      '</ul></details>';
  }

  /* ---------- IMDC 風險分層：指引多處以 poor／intermediate-risk 決定藥物，但未列出因子 ---------- */
  function imdcHtml() {
    return '<details class="kps-details"><summary>指引所引用之 poor／intermediate-risk 是什麼？（IMDC 風險分層）▸</summary>' +
      '<div class="note"><b>本院指引未列出風險因子本身</b>，僅在藥物選擇處引用「for poor- and intermediate-risk groups」' +
      '（Ipilimumab + Nivolumab、Cabozantinib）與「for poor-prognosis patients」（Temsirolimus）。' +
      '其所指為 <b>IMDC（Heng）風險模型</b>，共六項因子：</div>' +
      '<ul class="dx-list">' +
      '<li>自診斷至全身性治療之間隔 <b>&lt;1 年</b></li>' +
      '<li>Karnofsky 體能狀態 <b>&lt;80%</b></li>' +
      '<li><b>血色素低於正常下限</b></li>' +
      '<li><b>校正後血鈣高於正常上限</b></li>' +
      '<li><b>嗜中性球高於正常上限</b></li>' +
      '<li><b>血小板高於正常上限</b></li>' +
      '</ul>' +
      '<div class="note"><b>0 項＝favorable、1–2 項＝intermediate、≥3 項＝poor。</b>' +
      '模型之驗證論文見下方參考文獻（Heng et al.）。</div>' +
      '</details>';
  }

  /* ---------- 追蹤 ---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤 Regular F/U（指引第 2 頁）</div>' +
      '<ul class="fu-list">' +
      '<li>指引以單一 <b>Regular F/U</b> 方塊表示，<b>未指定固定間隔或項目</b>——本頁不代為填入，' +
      '以免把指引沒寫的東西當成院內規範。</li>' +
      '<li><b>追蹤的作用是接到「復發 Relapse」這一格</b>：一旦復發，即由此進入全身性治療段落' +
      '（先分亮細胞／非亮細胞型，見上方第 3 步）。</li>' +
      '<li>第 IV 期接受手術者（腎切除＋轉移病灶切除、減積腎切除）<b>同樣匯入 Relapse 這一格</b>，' +
      '故手術與全身性治療在指引上是<b>先後銜接</b>而非二擇一。</li>' +
      '</ul>';
  }

  /* ---------- 全身性治療藥單 ---------- */
  function ccPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">亮細胞型全身性治療 Predominant clear cell histology<span class="rx-panel-src">指引第 2 頁</span></div>' +
      '<div class="rx-def"><b>指引以 <span class="rx">or</span> 並列全部選項，未指定單一首選</b>；' +
      '兩線的第一項都是 <b>Clinical trial</b>。括號內之族群限制為指引原文所載。</div>' +
      rxLine('第一線 1st line', '', [
        '<span class="rx">Clinical trial</span>',
        '<span class="rx">Axitinib + pembrolizumab</span>',
        '<span class="rx">Cabozantinib + nivolumab</span>',
        '<span class="rx">Lenvatinib + pembrolizumab</span>',
        '<span class="rx">Ipilimumab + nivolumab</span>　<b>（for poor- and intermediate-risk groups）</b>',
        d('Cabozantinib') + '　<b>（for poor- and intermediate-risk groups）</b>',
        '<span class="rx">Axitinib + avelumab</span>',
        d('Sunitinib') + '、' + d('Pazopanib'),
        d('Temsirolimus') + '　<b>（for poor-prognosis patients）</b>',
        '<b>高劑量</b> ' + d('IL-2'),
        '<b>＆最佳支持療法 Best supportive care</b>'
      ]) +
      rxLine('第二線 2nd line', '', [
        '<span class="rx">Clinical trial</span>',
        d('Axitinib') + '、<span class="rx">Axitinib + pembrolizumab</span>、<span class="rx">Axitinib + avelumab</span>',
        d('Cabozantinib') + '、<span class="rx">Cabozantinib + nivolumab</span>',
        d('Nivolumab') + '、<span class="rx">Ipilimumab + nivolumab</span>',
        '<span class="rx">Lenvatinib + everolimus</span>、<span class="rx">Lenvatinib + pembrolizumab</span>',
        d('Everolimus') + '、' + d('Temsirolimus'),
        d('Sunitinib') + '、' + d('Pazopanib'),
        d('IL-2') + '、' + d('Bevacizumab'),
        d('Belzutifan') + '　<b>——僅出現在第二線</b>（HIF-2α 抑制劑）',
        '<b>＆最佳支持療法 Best supportive care</b>'
      ]) +
      '<div class="rx-warn"><b>惡化（Progression）後</b>指引導向 <b>Hospice care if needed</b>（必要時安寧療護）；' +
      '另有一格 <b>Consider salvage nephrectomy in selected cases</b>（經篩選者考慮救援性腎切除），' +
      '由第一／二線藥物治療以虛線連出——是<b>治療中的補充選項</b>，非獨立路線。</div>' +
      '</div>';
  }

  function nccPanel() {
    return '<div class="rec-detail rx-panel">' +
      '<div class="rx-panel-h">非亮細胞型全身性治療 Non-clear cell histology<span class="rx-panel-src">指引第 2 頁</span></div>' +
      '<div class="rx-def"><b>非亮細胞型只有一份藥單，指引未分線別</b>——與亮細胞型分 1st／2nd line 不同。' +
      '<b>開頭兩項均標示 preferred</b>。</div>' +
      rxLine('指引所列（依原文順序）', '', [
        '<span class="rx">Clinical trial</span>　<b>（preferred）</b>',
        d('Sunitinib') + '　<b>（preferred）</b>',
        d('Cabozantinib') + '、<span class="rx">Cabozantinib + nivolumab</span>',
        '<span class="rx">Lenvatinib + everolimus</span>',
        d('Nivolumab') + '、' + d('Pembrolizumab'),
        d('Temsirolimus') + '、' + d('Pazopanib') + '、' + d('Erlotinib') + '、' + d('Axitinib'),
        '<b>化療——<u>僅限肉瘤樣分化</u></b>（chemotherapy, in sarcomatoid only）',
        '<b>＆最佳支持療法 Best supportive care</b>'
      ]) +
      '<div class="rx-warn"><b>惡化（Progression）後</b>導向 <b>Hospice care if needed</b>；' +
      '亦以虛線連至 <b>Consider salvage nephrectomy in selected cases</b>。</div>' +
      '</div>';
  }

  /* ---------- 建議處置 ---------- */
  function recPrimary(s) {
    if (s.stage === 'early') {
      if (s.surg === 's_radical') {
        return { cls: 'rec-elective', title: '第 I／II／III 期 · 根除性腎切除 Radical nephrectomy', detail:
          rxLine('原發治療', '指引：Stage I, II, III → Surgical excision', [
            '<b>根除性腎切除 Radical nephrectomy</b> → <b>Regular F/U</b>。'
          ]),
          note: '指引第 2 頁。<b>第 I–III 期手術後直接進追蹤</b>，指引<u>未</u>畫出任何輔助全身性治療的方塊——組織型態分流只掛在需要全身性治療的那一段。' };
      }
      if (s.surg === 's_nss') {
        return { cls: 'rec-elective', title: '第 I／II／III 期 · 腎元保留手術或微創消融', detail:
          rxLine('適應症——指引逐條列出，符合者才走這條', '', [
            '<b>多發性原發腫瘤</b>　Multiple primaries',
            '<b>單腎狀態</b>　Uninephric state',
            '<b>腎功能不全</b>　Renal insufficiency',
            '<b>經篩選之單側小腫瘤</b>——<b>多數 ≦4 cm，有時 4–7 cm</b>' +
            '（mostly ≦4cm, sometimes 4-7cm）'
          ]) +
          rxLine('術式', '', [
            '<b>腎元保留手術 Nephron-sparing surgery（部分腎切除）</b>',
            '<b>或 微創治療 Minimally invasive therapy</b>：<b>射頻消融 RFA</b> 或 <b>冷凍治療 cryotherapy</b>'
          ]) + '→ <b>Regular F/U</b>。',
          note: '指引第 2 頁。<b>這四項適應症是指引原文，不是概括描述</b>；不符者走根除性腎切除。' };
      }
      return null;
    }

    if (s.stage === 'four') {
      if (s.m4 === 'm_solitary') {
        return { cls: 'rec-elective', title: '第 IV 期 · 可切除之單一轉移 Resectable solitary meta', detail:
          rxLine('原發治療', '', [
            '<b>腎切除 + 轉移病灶切除 Nephrectomy + metastasectomy</b>'
          ]) +
          '<div class="rx-def">→ 之後匯入 <b>Relapse</b> 一格，再依組織型態進入全身性治療（見上方第 3 步）。</div>',
          note: '指引第 2 頁。<b>單一可切除轉移是第 IV 期裡唯一「兩處都切」的一格</b>。' };
      }
      if (s.m4 === 'm_multi') {
        return { cls: 'rec-elective', title: '第 IV 期 · 原發可切除但多處轉移 Resectable primary with multiple mets', detail:
          rxLine('原發治療', '', [
            '<b>考慮減積腎切除 Considering cytoreductive nephrectomy</b>' +
            '——指引用字為 <b>considering</b>，非常規建議。'
          ]) +
          '<div class="rx-def">→ 之後接全身性治療（見上方第 3 步）。' +
          '減積腎切除在標靶治療時代的角色見下方參考文獻（CARMENA 等）。</div>',
          note: '指引第 2 頁。<b>此格與上一格的差別在轉移病灶數目</b>，不在原發腫瘤是否可切除——兩格的原發腫瘤都可切。' };
      }
      if (s.m4 === 'm_unres') {
        return { cls: 'rec-nonop', title: '第 IV 期 · 手術不可切除 Surgery unresectable', detail:
          rxLine('先取得組織', '', [
            '<b>組織取樣 Tissue sampling</b>——指引在這一格<b>把病理放在治療之前</b>，' +
            '因為下一步的藥單完全取決於亮細胞／非亮細胞型。'
          ]) +
          '<div class="rx-def">→ 依組織型態進入全身性治療（見上方第 3 步）。</div>',
          note: '指引第 2 頁。<b>不可切除者不做腎切除，但仍必須有病理</b>——這正是初始評估把「臨床有需要時考慮針刺切片」列進去的理由。' };
      }
      return null;
    }
    return null;
  }

  function recSystemic(s) {
    if (s.histo === 'cc') {
      return { cls: 'rec-nonop', title: '全身性治療 · 亮細胞型為主 Predominant clear cell', panel: ccPanel(),
        note: '指引第 2 頁。<b>本頁刻意不把 1st／2nd line 做成兩個按鈕</b>——臨床上使用者已知自己在第幾線，需要的是整份藥單並列可比。' };
    }
    if (s.histo === 'ncc') {
      return { cls: 'rec-nonop', title: '全身性治療 · 非亮細胞型 Non-clear cell', panel: nccPanel(),
        note: '指引第 2 頁。<b>非亮細胞型不分線別</b>，且化療僅限肉瘤樣分化者。' };
    }
    return null;
  }

  /* ---------- 版面 ---------- */
  function rccPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院腎臟癌診療指引 版次 15（2026/06/16，文件編號 50710-2-000020）</b>' +
      '之互動決策流程（指引本文 NTUH-V1.2026，第 2 頁決策圖）。逐步點選以取得對應建議處置與藥單。</p>';
    h += '<div class="onc-path" id="rcPath">';

    h += dxHtml();

    h += step('rc_s1', '1', '臨床分期？',
      opt('stage', 'early', '第 I / II / III 期', '→ 手術切除') +
      opt('stage', 'four', '第 IV 期', '→ 依手術可行性分三格'),
      '<div class="note">指引把第 I–III 期收在一格（<b>Stage I, II, III → Surgical excision</b>），第 IV 期才展開。</div>');

    h += connH('rc_c1');
    h += step('rc_s2', '2', '是否符合腎元保留之適應症？',
      opt('surg', 's_nss', '符合 → 腎元保留手術或消融', '多發／單腎／腎功能不全／經篩選之小腫瘤') +
      opt('surg', 's_radical', '不符合 → 根除性腎切除'),
      '<div class="note">指引把腎元保留的四項適應症<b>直接寫在方塊裡</b>，不是留給臨床自行判斷的模糊地帶。</div>');

    h += step('rc_s2m', '2', '第 IV 期之手術可行性？',
      opt('m4', 'm_solitary', '可切除之單一轉移', 'Resectable solitary meta') +
      opt('m4', 'm_multi', '原發可切除、多處轉移', 'Resectable primary with multiple mets') +
      opt('m4', 'm_unres', '手術不可切除', 'Surgery unresectable'),
      '<div class="note">三格的下一步完全不同：切兩處／考慮減積腎切除／先取組織。</div>');

    h += '<div class="flow-rec rec-idle" id="rc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';

    h += connH('rc_c2');
    h += step('rc_s3', '3', '需要全身性治療時：組織型態？',
      opt('histo', 'cc', '亮細胞型為主', 'Predominant clear cell') +
      opt('histo', 'ncc', '非亮細胞型', 'Non-clear cell'),
      '<div class="note"><b>第 I–III 期術後尚不需要本步</b>——待追蹤期間復發（Relapse）再回到這裡。' +
      '第 IV 期則三格最後都匯入此分流。</div>');

    h += '<div class="flow-rec rec-idle hidden" id="rc_rec2"><div class="rec-label">全身性治療 Systemic therapy</div>' +
      '<div class="rec-title">請選擇組織型態</div></div>';
    h += '<div class="flow-fu hidden" id="rc_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="rcReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function rcRender() {
    var s = rcSt;
    var early = s.stage === 'early';
    var four = s.stage === 'four';

    show('rc_c1', !!s.stage);
    show('rc_s2', early);
    show('rc_s2m', four);

    var rec = document.getElementById('rc_rec');
    var rec2 = document.getElementById('rc_rec2');
    var fu = document.getElementById('rc_fu');
    if (!rec) return;

    var done = (early && !!s.surg) || (four && !!s.m4);
    var r = done ? recPrimary(s) : null;
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      show('rc_c2', false); show('rc_s3', false); show('rc_rec2', false);
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    show('rc_c2', true);
    show('rc_s3', true);

    var a = s.histo ? recSystemic(s) : null;
    if (rec2) {
      if (a) {
        rec2.className = 'flow-rec ' + a.cls;
        rec2.innerHTML = '<div class="rec-label">全身性治療 Systemic therapy</div>' +
          '<div class="rec-title">' + a.title + '</div>' +
          a.panel +
          '<div class="rec-detail">' + imdcHtml() + '</div>' +
          (a.note ? '<div class="rec-note">' + a.note + '</div>' : '');
      } else {
        rec2.className = 'flow-rec rec-idle hidden';
        rec2.innerHTML = '<div class="rec-label">全身性治療 Systemic therapy</div>' +
          '<div class="rec-title">請選擇組織型態</div>';
      }
    }

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function rcClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function rcPick(key, val, btn) {
    var s = rcSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'stage') {
      s.stage = val; s.surg = s.m4 = s.histo = null;
      rcClearSel(['rc_s2', 'rc_s2m', 'rc_s3']);
    } else if (key === 'surg') {
      s.surg = val;
    } else if (key === 'm4') {
      s.m4 = val;
    } else if (key === 'histo') {
      s.histo = val;
    }
    rcRender();
  }

  function rcReset() {
    for (var k in rcSt) { if (rcSt.hasOwnProperty(k)) rcSt[k] = null; }
    var root = document.getElementById('rcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('rc_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    var rec2 = document.getElementById('rc_rec2');
    if (rec2) { rec2.classList.add('hidden'); }
    rcRender();
  }

  function initRccPathway() { rcReset(); }

  global.rccPathwayHTML = rccPathwayHTML;
  global.initRccPathway = initRccPathway;
  global.rcPick = rcPick;
  global.rcReset = rcReset;
})(window);
