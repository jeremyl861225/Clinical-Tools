/* ============================================================
   攝護腺癌治療互動決策流程 Prostate Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 攝護腺癌診療指引
   版次 15（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000021
   指引本文標題 Clinical Guidelines of Prostate Cancer, NTUH-V.1.2026
   流程圖見指引第 2 頁（初診斷→原發治療）與第 3 頁（PSA 失敗→轉移→去勢阻抗）；
   放療技術細節見第 4–15 頁。
   ※ 流程結構依第 2、3 頁決策圖判讀（非文字順序）。四個容易讀錯之處：
     ① <b>FIR 與 UIR 的定義只差在「符合幾項」</b>：FIR ＝ T2b-T2c／Gleason 3+4／PSA 10-20
        <b>其中一項</b>；UIR ＝ 其中<b>兩項</b>，<b>或</b> Gleason 4+3。純文字抽取會把兩者的
        條件錯接（指引原文把 One of／Two of 以紅字標出，就是因為易混）。
     ② <b>預期餘命（LE）的切點不是一個數</b>：低／FIR／UIR 用 <b>10 年</b>，
        高／極高風險與 N1 用 <b>5 年</b>。把兩者都寫成 10 年是常見的錯誤。
     ③ 第 3 頁的三個 PSA 失敗入口（post-RP／post-RT／post-energy ablation）
        <b>後續分流各不相同</b>——只有 post-RT 那條會問「是否為局部治療之候選者」。
     ④ M1 CRPC 之<b>「無內臟轉移」與「有內臟轉移」是兩份不同藥單</b>：
        <span class="rx">Radium-223</span> 只出現在無內臟轉移那份，
        <span class="rx">Mitoxantrone</span> 只出現在有內臟轉移那份。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var pcSt = {
    extent: null,  // loc | n1 | m1
    risk: null,    // low | fir | uir | high
    le: null,      // le_short | le_long
    fail: null,    // f_rp | f_rt_cand | f_rt_nocand | f_abl
    crpc: null     // c_m0 | c_m1_no_visc | c_m1_visc
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
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }
  function d(name) { return '<span class="drug">' + name + '</span>'; }

  /* ---------- 檢查與縮寫（指引第 2、4 頁）---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>診斷與分期檢查 Workup（指引第 2 頁）▸</summary>' +
      '<div class="dx-h">切片前之評估</div>' +
      '<ul class="dx-list">' +
      '<li><b>肛門指診 DRE（主要檢查）</b></li>' +
      '<li><b>PSA（主要檢查）</b>，另可併用 <b>PSA density、PSADT、PHI score</b></li>' +
      '<li><b>經直腸超音波 TRUS-P／微超音波 micro-US</b>、<b>多參數 MRI（mpMRI）</b></li>' +
      '<li>→ <b>攝護腺切片 Prostate biopsy</b></li>' +
      '</ul>' +
      '<div class="dx-h">切片陰性 Negative</div>' +
      '<ul class="dx-list">' +
      '<li><b>觀察</b>、<b>重做切片或 MRI 導引標的切片</b>、<b>經尿道切片 TUR-Biopsy</b>' +
      '——三者在指引圖上<b>並列</b>，非先後順序。</li>' +
      '</ul>' +
      '<div class="dx-h">切片陽性 Positive → 分期檢查</div>' +
      '<ul class="dx-list">' +
      '<li><b>腹部／骨盆腔 CT（optional）</b>，<b>或 mpMRI（主要檢查）</b></li>' +
      '<li><b>骨骼掃描（主要檢查；低風險者為 optional）</b>，<b>或 PSMA-PET（optional）</b></li>' +
      '<li>→ 分為<b>臨床侷限性 Clinically localized</b>／<b>局部晚期 Locally advanced（N1）</b>／' +
      '<b>轉移性 Metastatic（any T, any N, M1）</b>。</li>' +
      '</ul>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations（指引第 4 頁「註」）▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>DRE</b> — digital rectal examination 肛門指診</li>' +
      '<li><b>PSA</b> — prostate specific antigen　｜　<b>PSADT</b> — PSA doubling time 倍增時間</li>' +
      '<li><b>PHI</b> — prostate health index　｜　<b>mpMRI</b> — multi-parametric MRI</li>' +
      '<li><b>PSMA-PET</b> — prostate-specific membrane antigen 正子攝影</li>' +
      '<li><b>LE</b> — life expectancy 預期餘命　｜　<b>AS</b> — active surveillance 積極監測</li>' +
      '<li><b>FIR／UIR</b> — favorable／unfavorable intermediate risk 中度風險之有利／不利分層</li>' +
      '<li><b>RP</b> — radical prostatectomy 根除性攝護腺切除　｜　<b>LND</b> — lymph node dissection</li>' +
      '<li><b>RT</b> — radiotherapy　｜　<b>ADT</b> — androgen deprivation therapy 雄性素剝奪治療</li>' +
      '<li><b>ECE</b> — extracapsular extension 莢膜外侵犯　｜　<b>SVI</b> — seminal vesicle invasion 儲精囊侵犯</li>' +
      '<li><b>CRPC</b> — castration resistant prostate cancer 去勢阻抗性攝護腺癌</li>' +
      '</ul></details>';
  }

  /* ---------- 風險分層定義（指引第 2 頁，紅字標示 One of／Two of）---------- */
  function riskDefHtml() {
    return '<details class="kps-details"><summary>本院風險分層之完整定義（指引第 2 頁）▸</summary>' +
      '<table>' +
      '<tr><td>Low risk</td><td><b>T1–T2a</b> 且 <b>Gleason 2–6</b> 且 <b>PSA &lt;10</b>（三項皆須符合）</td></tr>' +
      '<tr><td>FIR</td><td><b>T2b–T2c、Gleason 3+4、PSA 10–20 之中<u>僅符合一項</u></b>（One of）</td></tr>' +
      '<tr><td>UIR</td><td><b>T2b–T2c、Gleason 7、PSA 10–20 之中<u>符合兩項</u></b>（Two of）；' +
      '<b>或 Gleason 4+3</b>（不論其他條件）</td></tr>' +
      '<tr><td>High／very-high</td><td><b>T3–T4</b>，<b>或 Gleason 8–10</b>，<b>或 PSA &gt;20</b>（任一項即成立）</td></tr>' +
      '<tr><td>N1</td><td>局部晚期：<b>區域淋巴結轉移</b></td></tr>' +
      '<tr><td>M1</td><td>轉移性：<b>any T, any N, M1</b></td></tr>' +
      '</table>' +
      '<div class="note"><b>FIR 與 UIR 的差別只在「符合幾項」，另加一條 Gleason 4+3 一律歸 UIR。</b>' +
      '指引原文把 <b>One of</b> 與 <b>Two of</b> 以紅字標出，正是因為這兩格最易混。' +
      '注意 FIR 那格寫的是 <b>Gleason 3+4</b>、UIR 那格寫的是 <b>Gleason 7</b>——' +
      '兩者在指引原文中的用字不同。</div>' +
      '</details>';
  }

  /* ---------- 放療技術細節（指引第 4–15 頁）---------- */
  function rtHtml() {
    return '<details class="kps-details"><summary>放射治療之技術細節（指引第 4–15 頁）▸</summary>' +
      rxLine('根治性放療之靶區 Definitive RT target volumes', '第 6 頁', [
        '<b>CTV_P</b>：<b>整個攝護腺 + 雙側近端儲精囊</b>——用於 <b>T1–T2</b>；' +
        '<b>T3a</b> 者<b>另加莢膜外侵犯（EPE）之邊界</b>。',
        '<b>CTV</b>：<b>整個攝護腺 + 雙側受侵犯之儲精囊</b>——用於 <b>T3b</b>，' +
        '以及 <b>T3a 且同時 PSA &gt;20 與 Gleason ≥8</b> 者。',
        '<b>骨盆腔照射</b>：<b>骨盆腔內淋巴結陽性</b>，或<b>推估淋巴結轉移風險高於顯著水準</b>時。' +
        '<b>高風險為 candidate；中度風險為 considered；低風險則不照射。</b>'
      ]) +
      rxLine('根治性放療劑量 RT dose', '第 7 頁', [
        '<b>≥75.6–79.2 Gy，1.8–2.0 Gy/fx</b>（至 CTV_P 或 CTV）；' +
        '<b>高／中度風險者可考慮至 81.0 Gy</b>。',
        '<b>中度低分次（moderately hypofractionated）</b>：' +
        '<b>64.6 Gy／19 fx 至 72 Gy／30 fx，2.4–3.4 Gy/fx，4–6 週</b>。',
        '<b>極低分次（SBRT）</b>：<b>限 ≤T2c、PSA ≤20、Gleason grade group ≤3</b>，' +
        '<b>35–43 Gy／4–7 fx</b>。'
      ]) +
      rxLine('術後放療 POST-RP RT', '第 8–9 頁', [
        '<b>輔助放療 Adjuvant RT</b>——適應症：<b>pT3、切緣陽性、或 Gleason 8–10</b>；' +
        'CTV 為<b>攝護腺床</b>；劑量 <b>64–72 Gy，1.8–2.0 Gy/fx</b>。',
        '<b>救援放療 Salvage RT</b>——適應症：<b>生化失敗＝連續兩次 PSA &gt;0.2 ng/mL</b>；' +
        '<b>或 PSA &gt;0.1 ng/mL 或連續三次上升</b>（依 RADICALS-RT 試驗規範，optional）；' +
        '劑量 <b>≥64–72 Gy</b>。'
      ]) +
      rxLine('轉移性之根治性／緩解性放療', '第 10 頁', [
        '<b>低體積轉移之定義</b>：<b>無內臟轉移</b>；<b>僅脊椎和／或骨盆骨轉移</b>；' +
        '<b>或 1 處脊椎／骨盆外轉移 + &lt;4 處脊椎或骨盆骨轉移</b>。',
        '<b>對原發攝護腺之放療</b>：<b>STAMPEDE 方案 55 Gy／20 fx 或 6 Gy × 6 fx</b>；' +
        '<b>HORRAD 方案 70 Gy／35 fx 或 57.76 Gy／19 fx</b>。',
        '<b>骨盆腔淋巴引流區放療為選項</b>（有淋巴結病灶時優先）；' +
        '<b>寡轉移病灶放療為選項</b>，可與攝護腺放療同步或接續。'
      ]) +
      rxLine('正常組織限制（傳統／中度低分次）', '第 7 頁', [
        '<b>PTV：95% 體積達處方劑量（V100 ≥ 95%）</b>',
        '<b>直腸 65 Gy &lt; 25%</b>　｜　<b>膀胱 65 Gy &lt; 30%</b>　｜　<b>股骨頭 55 Gy ≦ 5%</b>'
      ]) +
      '</details>';
  }

  /* ---------- 追蹤／後續 ---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤與後續 Follow-up</div>' +
      '<ul class="fu-list">' +
      '<li>指引第 2 頁之原發治療方塊（Energy ablation／RP &amp; LN(−)／RP &amp; adverse features／RT／RP &amp; N1）' +
      '<b>全部接到第 3 頁的 PSA 失敗流程</b>——追蹤的核心指標是 <b>PSA</b>。</li>' +
      '<li><b>RP 後有不良病理特徵（切緣陽性、ECE 或 SVI）者，第 2 頁直接以箭頭指向 RT</b>' +
      '——即術後放療（輔助或救援，見放療細節）。</li>' +
      '<li><b>骨轉移者</b>：指引在第 3 頁單獨列出 <b>' + d('Denosumab') + ' 或 ' + d('Zoledronate') + '</b> 一格。</li>' +
      '<li>PSA 失敗之三個入口與後續分流，請於上方第 4 步選擇。</li>' +
      '</ul>';
  }

  /* ---------- 建議處置：原發治療（第 2 頁）---------- */
  function recPrimary(s) {
    var isShort = s.le === 'le_short';

    if (s.extent === 'loc') {
      if (s.risk === 'low') {
        return { cls: 'rec-elective', title: '臨床侷限性 · 低風險 Low risk', detail:
          isShort
            ? rxLine('預期餘命 &lt;10 年', 'LE&lt;10y', [ '<b>觀察 Observation</b>' ])
            : rxLine('預期餘命 ≥10 年', 'LE≥10y', [
                '<b>積極監測 AS（favored，指引標為優先）</b>',
                '<b>或 放療 RT</b>',
                '<b>或 根除性攝護腺切除 RP ± 淋巴結廓清</b>',
                '<b>或 能量消融治療 energy ablation therapy</b>'
              ]),
          note: '指引第 2 頁。<b>低風險且 LE≥10 年者，指引唯一標示 favored 的是積極監測</b>——其餘三項為並列選項。' };
      }
      if (s.risk === 'fir') {
        return { cls: 'rec-elective', title: '臨床侷限性 · 有利之中度風險 FIR', detail:
          isShort
            ? rxLine('預期餘命 &lt;10 年', 'LE&lt;10y', [ '<b>觀察 Observation</b>', '<b>或 放療 RT</b>' ])
            : rxLine('預期餘命 ≥10 年', 'LE≥10y', [
                '<b>放療 RT</b>',
                '<b>或 RP ± 淋巴結廓清</b>',
                '<b>或 能量消融治療</b>',
                '<b>或 積極監測 AS</b>'
              ]),
          note: '指引第 2 頁。<b>FIR ＝ T2b-T2c／Gleason 3+4／PSA 10-20 三項中<u>僅符合一項</u></b>。' +
            '與 UIR 相比，FIR 的選項<b>仍保留 AS</b>，且<b>不含 ADT</b>。' };
      }
      if (s.risk === 'uir') {
        return { cls: 'rec-elective', title: '臨床侷限性 · 不利之中度風險 UIR', detail:
          isShort
            ? rxLine('預期餘命 &lt;10 年', 'LE&lt;10y', [
                '<b>觀察 Observation</b>',
                '<b>或 RT ± ADT（4–6 個月）</b>',
                '<b>或 能量消融治療</b>'
              ])
            : rxLine('預期餘命 ≥10 年', 'LE≥10y', [
                '<b>RT ± ADT（4–6 個月）</b>',
                '<b>或 RP ± 淋巴結廓清</b>'
              ]),
          note: '指引第 2 頁。<b>UIR ＝ 三項中符合<u>兩項</u>，或 Gleason 4+3</b>。' +
            '<b>ADT 自 UIR 才開始出現，療程為短期 4–6 個月</b>——與高風險之 2–3 年長期 ADT 不同。' +
            '<b>UIR 的 LE≥10 年那格已無 AS</b>。' };
      }
      if (s.risk === 'high') {
        return { cls: 'rec-elective', title: '臨床侷限性 · 高／極高風險 High／very-high', detail:
          isShort
            ? rxLine('預期餘命 &lt;5 年', 'LE&lt;5y——<b>注意此處切點為 5 年，不是 10 年</b>', [
                '<b>觀察 Observation</b>',
                '<b>或 RT ± ADT</b>',
                '<b>或 冷凍治療 Cryotherapy</b>'
              ])
            : rxLine('預期餘命 &gt;5 年', 'LE&gt;5y', [
                '<b>RT + ADT（<u>2–3 年</u>）</b>',
                '<b>或 RP + 淋巴結廓清</b>',
                '<b>或 冷凍治療</b>'
              ]),
          note: '指引第 2 頁。<b>切點在此改為 5 年</b>（低／FIR／UIR 為 10 年）。' +
            '<b>ADT 療程亦改為 2–3 年</b>，且此格之 RP 是 <b>RP + LND</b>（不再是 ±）。' };
      }
      return null;
    }

    if (s.extent === 'n1') {
      return { cls: 'rec-elective', title: '局部晚期 · N1（區域淋巴結轉移）', detail:
        isShort
          ? rxLine('預期餘命 &lt;5 年', 'LE&lt;5y', [ '<b>觀察 Observation</b>', '<b>或 RT ± ADT</b>' ])
          : rxLine('預期餘命 &gt;5 年', 'LE&gt;5y', [
              '<b>RT + ADT ± ' + d('Abiraterone') + '</b>',
              '<b>或 RP + 淋巴結廓清</b>',
              '<b>或 ADT ± ' + d('Abiraterone') + '</b>'
            ]),
        note: '指引第 2 頁。<b>N1 是唯一在原發治療階段就出現 abiraterone 的分層</b>；' +
          '切點同高風險為 <b>5 年</b>。' };
    }

    if (s.extent === 'm1') {
      return { cls: 'rec-nonop', title: '轉移性 · any T, any N, M1', detail:
        rxLine('全身性治療（第 3 頁 Disseminated 方塊）', '指引以 / 並列', [
          '<b>ADT</b>，和／或以下之一：',
          d('Docetaxel'),
          d('Abiraterone') + ' + ' + d('Prednisolone'),
          d('Apalutamide') + '、' + d('Enzalutamide') + '、' + d('Darolutamide'),
          '<span class="rx">ADT + docetaxel + darolutamide</span>　<b>（三合一）</b>',
          '<b>含鉑化療——<u>限小細胞型</u></b>（platinum-based chemotherapy, small cell）'
        ]) +
        rxLine('低體積轉移者可併原發攝護腺放療', '第 10 頁', [
          '<b>定義</b>：無內臟轉移；僅脊椎和／或骨盆骨轉移；或 1 處脊椎／骨盆外轉移 + &lt;4 處脊椎或骨盆骨轉移。',
          '<b>STAMPEDE 方案 55 Gy／20 fx 或 6 Gy × 6 fx</b>；<b>HORRAD 方案 70 Gy／35 fx 或 57.76 Gy／19 fx</b>。'
        ]) +
        '<div class="rx-def"><b>骨轉移者另給 ' + d('Denosumab') + ' 或 ' + d('Zoledronate') + '</b>（第 3 頁單獨一格）。</div>',
        note: '指引第 2 頁導向第 3 頁之 Disseminated 方塊。<b>此處尚屬去勢敏感（hormone-sensitive）階段</b>；' +
          '惡化後才進入去勢阻抗（CRPC），見下方第 5 步。' };
    }
    return null;
  }

  /* ---------- 建議處置：PSA 失敗（第 3 頁）---------- */
  function recFail(s) {
    if (s.fail === 'f_rp') {
      return { cls: 'rec-elective', title: 'RP 後 PSA 持續或復發 Post RP, PSA persistence or recurrence', detail:
        rxLine('先做評估', '第 3 頁：全部項目皆標 ±（依臨床需要）', [
          '<b>±骨骼掃描、±切片、±CT/MRI、±PSADT、±PSMA-PET</b>'
        ]) +
        rxLine('無遠處轉移 No distant mets', '', [
          '<b>RT ± ADT</b>　<b>或 觀察</b>'
        ]) +
        rxLine('有遠處轉移 Distant mets', '', [
          '<b>ADT ± RT</b>——<b>放療限用於<u>有症狀或負重骨</u>之病灶</b>' +
          '（ADT ± RT for symptomatic or weight bearing bone）',
          '<b>或 觀察</b>'
        ]) +
        '<div class="rx-def">再惡化即進入 <b>Disseminated</b>（見上方 M1 之全身性治療），' +
        '其後為去勢阻抗（第 5 步）。救援放療之 PSA 門檻見放療細節。</div>',
        note: '指引第 3 頁。<b>RP 這條路不問「是否為局部治療候選者」</b>——那一問只掛在 post-RT 那條。' };
    }
    if (s.fail === 'f_rt_cand') {
      return { cls: 'rec-elective', title: 'RT 後 PSA 失敗 · 為局部治療之候選者', detail:
        '<div class="rx-def"><b>候選者之三項條件（指引明列，須全部符合）</b>：' +
        '<b>T1–2，Nx 或 N0</b>；<b>LE &gt;10 年</b>；<b>目前 PSA &lt;10</b>。</div>' +
        rxLine('先做評估', '', [
          '<b>切片、骨骼掃描、±腹部/骨盆腔 CT、±MRI、±PSADT、±PSMA-PET</b>'
        ]) +
        rxLine('依評估結果分三路', '', [
          '<b>局部病灶 Local disease</b> → <b>RP 或能量消融，或觀察</b>。',
          '<b>無局部病灶、無轉移</b> → <b>觀察或 ADT</b>。',
          '<b>遠處轉移</b> → 進入 <b>Disseminated</b>。'
        ]),
        note: '指引第 3 頁。<b>RT 後 PSA 失敗的定義為「PSA 持續、升至最低點 +2，或 DRE 陽性」</b>；' +
          '「升至 nadir +2」即 Phoenix 定義。' };
    }
    if (s.fail === 'f_rt_nocand') {
      return { cls: 'rec-elective', title: 'RT 後 PSA 失敗 · 非局部治療之候選者', detail:
        rxLine('處置', '', [ '<b>觀察或 ADT</b>（Observation or ADT）' ]),
        note: '指引第 3 頁。<b>不符 T1-2／LE&gt;10y／PSA&lt;10 三項條件者即歸此格</b>，不再做局部評估。' };
    }
    if (s.fail === 'f_abl') {
      return { cls: 'rec-elective', title: '能量消融後 PSA 升至最低點 +2 Post energy ablation', detail:
        rxLine('先做評估', '', [
          '<b>切片、骨骼掃描、±腹部/骨盆腔 CT、±MRI、±PSMA-PET</b>'
        ]) +
        rxLine('無遠處轉移 No distant mets', '', [
          '<b>RT + ADT</b>　<b>或 ADT</b>　<b>或 觀察</b>　<b>或 第二次能量消融</b>（2nd energy ablation）'
        ]) +
        rxLine('有遠處轉移 Distant mets', '', [ '<b>ADT 或觀察</b>' ]),
        note: '指引第 3 頁。<b>「再做一次消融」是這條路獨有的選項</b>，RP 與 RT 後的兩條路都沒有。' };
    }
    return null;
  }

  /* ---------- 建議處置：去勢阻抗（第 3 頁下半）---------- */
  function crpcPanel(kind) {
    if (kind === 'c_m0') {
      return '<div class="rec-detail rx-panel">' +
        '<div class="rx-panel-h">M0 CRPC（非轉移性去勢阻抗）<span class="rx-panel-src">指引第 3 頁</span></div>' +
        '<div class="rx-def"><b>本格的分流軸是 PSADT（PSA 倍增時間），切點 10 個月</b>' +
        '——指引在四行中提到三次。</div>' +
        rxLine('指引所列', '', [
          '<b>持續 ADT</b>（Keep ADT）',
          '<b>' + d('Apalutamide') + '／' + d('Enzalutamide') + '／' + d('Darolutamide') +
          '——<u>PSADT &lt;10 個月者</u>，指引標為 preferred</b>',
          '<b>其他次級荷爾蒙治療</b>——<b>尤其 PSADT &lt;10 個月者</b>',
          '<b>觀察</b>——<b>尤其 PSADT ≥10 個月者</b>'
        ]) +
        '</div>';
    }
    if (kind === 'c_m1_no_visc') {
      return '<div class="rec-detail rx-panel">' +
        '<div class="rx-panel-h">M1 CRPC · 無內臟轉移 No visceral mets<span class="rx-panel-src">指引第 3 頁</span></div>' +
        '<div class="rx-def"><b>全體 M1 CRPC 共通之四項</b>：持續 ADT；' +
        '<b>骨轉移者給 ' + d('Denosumab') + ' 或 ' + d('Zoledronate') + '</b>；' +
        '<b>無症狀或症狀輕微者可給 ' + d('Sipuleucel-T') + '</b>；' +
        '<b>骨痛者給緩解性放療</b>。</div>' +
        rxLine('本格藥單（依指引原文順序）', '', [
          d('Enzalutamide'),
          d('Abiraterone acetate') + ' + ' + d('Prednisolone'),
          d('Docetaxel') + '、' + d('Carbazitaxel') + '（<b>docetaxel 之後</b>）',
          '<b>' + d('Radium-223') + '——<u>只出現在本格</u></b>（有內臟轉移者無此項）',
          d('Corticosteroids'),
          '<span class="rx">Clinical trial</span>',
          '<b>' + d('PARPi') + '（selected）</b>、<b>' + d('Lutetium-177–PSMA-617') + '（selected）</b>',
          '<b>其他次級荷爾蒙治療</b>'
        ]) +
        '<div class="rx-warn">惡化後導向 <b>最佳支持療法 Best supportive care</b>。</div>' +
        '</div>';
    }
    if (kind === 'c_m1_visc') {
      return '<div class="rec-detail rx-panel">' +
        '<div class="rx-panel-h">M1 CRPC · 有內臟轉移 Visceral mets<span class="rx-panel-src">指引第 3 頁</span></div>' +
        '<div class="rx-def"><b>共通四項同上</b>（持續 ADT、骨轉移用骨質藥、Sipuleucel-T、骨痛放療）。' +
        '<b>本格以 ' + d('Docetaxel') + ' 起首</b>——與無內臟轉移那格以 enzalutamide 起首不同。</div>' +
        rxLine('本格藥單（依指引原文順序）', '', [
          d('Docetaxel'),
          d('Enzalutamide'),
          d('Abiraterone acetate') + ' + ' + d('Prednisolone'),
          d('Carbazitaxel') + '（<b>docetaxel 之後</b>）',
          '<b>' + d('Mitoxantrone') + ' + ' + d('Prednisolone') + '——<u>只出現在本格</u></b>',
          '<span class="rx">Clinical trial</span>',
          '<b>' + d('PARPi') + '（selected）</b>、<b>' + d('Lutetium-177–PSMA-617') + '（selected）</b>',
          '<b>其他次級荷爾蒙治療</b>'
        ]) +
        '<div class="rx-warn"><b>此格<u>無</u> ' + d('Radium-223') + '</b>——radium-223 為親骨性核種，' +
        '指引僅列於無內臟轉移那格。惡化後導向 <b>最佳支持療法 Best supportive care</b>。</div>' +
        '</div>';
    }
    return '';
  }

  function recCrpc(s) {
    if (!s.crpc) return null;
    var title = s.crpc === 'c_m0' ? '去勢阻抗 · M0 CRPC'
      : (s.crpc === 'c_m1_no_visc' ? '去勢阻抗 · M1 CRPC（無內臟轉移）' : '去勢阻抗 · M1 CRPC（有內臟轉移）');
    var note = s.crpc === 'c_m0'
      ? '指引第 3 頁。<b>M0 CRPC 惡化後以「Metastasis」箭頭接到 M1 CRPC</b>。'
      : '指引第 3 頁。<b>兩份 M1 CRPC 藥單不可互換</b>：radium-223 僅見於無內臟轉移、mitoxantrone 僅見於有內臟轉移。';
    return { cls: 'rec-nonop', title: title, panel: crpcPanel(s.crpc), note: note };
  }

  /* ---------- 版面 ---------- */
  function prostatePathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院攝護腺癌診療指引 版次 15（2026/06/16，文件編號 50710-2-000021）</b>' +
      '之互動決策流程（指引本文 NTUH-V.1.2026；第 2 頁初診斷→原發治療、第 3 頁 PSA 失敗→轉移→去勢阻抗、' +
      '第 4–15 頁放療技術）。逐步點選以取得對應建議處置與藥單。</p>';
    h += '<div class="onc-path" id="pcPath">';

    h += dxHtml();

    h += step('pc_s1', '1', '分期檢查後之疾病範圍？',
      opt('extent', 'loc', '臨床侷限性 Clinically localized', '→ 再分四層風險') +
      opt('extent', 'n1', '局部晚期 N1', '區域淋巴結轉移') +
      opt('extent', 'm1', '轉移性 M1', 'any T, any N, M1'));

    h += connH('pc_c1');
    h += step('pc_s2', '2', '風險分層？',
      opt('risk', 'low', 'Low risk', 'T1–T2a 且 Gleason 2–6 且 PSA <10') +
      opt('risk', 'fir', 'FIR', 'T2b-T2c／Gleason 3+4／PSA 10-20 之<b>一項</b>') +
      opt('risk', 'uir', 'UIR', '之<b>兩項</b>；或 Gleason 4+3') +
      opt('risk', 'high', 'High／very-high', 'T3–T4 或 Gleason 8–10 或 PSA >20'),
      riskDefHtml());

    h += connH('pc_c2');
    h += step('pc_s3', '3', '預期餘命 Life expectancy？',
      opt('le', 'le_short', '較短', '低/FIR/UIR：<10 年　｜　高風險與 N1：<5 年') +
      opt('le', 'le_long', '較長', '低/FIR/UIR：≥10 年　｜　高風險與 N1：>5 年'),
      '<div class="note"><b>切點依風險分層而異</b>：低／FIR／UIR 用 <b>10 年</b>，' +
      '高／極高風險與 N1 用 <b>5 年</b>。這是指引第 2 頁五個治療方塊裡唯一不一致的參數，' +
      '也是本頁把它獨立成一步的原因。</div>');

    h += '<div class="flow-rec rec-idle" id="pc_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';

    h += connH('pc_c3');
    h += step('pc_s4', '4', '治療後之 PSA 失敗事件？',
      opt('fail', 'f_rp', 'RP 後 PSA 持續或復發') +
      opt('fail', 'f_rt_cand', 'RT 後失敗 · 是局部治療候選者', 'T1-2、Nx/N0、LE>10y、PSA<10') +
      opt('fail', 'f_rt_nocand', 'RT 後失敗 · 非候選者') +
      opt('fail', 'f_abl', '能量消融後 PSA 升至 nadir +2'),
      '<div class="note">尚未出現 PSA 失敗者<b>可略過本步</b>。' +
      '<b>三個入口的後續分流不同</b>——只有 RT 那條會先問是否為局部治療候選者。</div>');

    h += '<div class="flow-rec rec-idle hidden" id="pc_rec2"><div class="rec-label">PSA 失敗之處置 Recurrence</div>' +
      '<div class="rec-title">請選擇上方選項</div></div>';

    h += connH('pc_c4');
    h += step('pc_s5', '5', '已進展至去勢阻抗（CRPC）？',
      opt('crpc', 'c_m0', 'M0 CRPC', '無轉移 · 依 PSADT 決定') +
      opt('crpc', 'c_m1_no_visc', 'M1 CRPC · 無內臟轉移') +
      opt('crpc', 'c_m1_visc', 'M1 CRPC · 有內臟轉移'),
      '<div class="note">尚未進展至去勢阻抗者<b>可略過本步</b>。' +
      '<b>M1 CRPC 的兩格是兩份不同藥單</b>，非同一份的子集。</div>');

    h += '<div class="flow-rec rec-idle hidden" id="pc_rec3"><div class="rec-label">去勢阻抗 CRPC</div>' +
      '<div class="rec-title">請選擇上方選項</div></div>';
    h += '<div class="flow-fu hidden" id="pc_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="pcReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function pcRender() {
    var s = pcSt;
    var loc = s.extent === 'loc';
    var n1 = s.extent === 'n1';
    var m1 = s.extent === 'm1';

    show('pc_c1', loc);
    show('pc_s2', loc);
    // 預期餘命只掛在侷限性與 N1；M1 之處置與 LE 無關
    var needLe = loc ? !!s.risk : n1;
    show('pc_c2', needLe);
    show('pc_s3', needLe);

    var rec = document.getElementById('pc_rec');
    var rec2 = document.getElementById('pc_rec2');
    var rec3 = document.getElementById('pc_rec3');
    var fu = document.getElementById('pc_fu');
    if (!rec) return;

    var done = m1 || (needLe && !!s.le);
    var r = done ? recPrimary(s) : null;
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      show('pc_c3', false); show('pc_s4', false); show('pc_rec2', false);
      show('pc_c4', false); show('pc_s5', false); show('pc_rec3', false);
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      '<div class="rec-detail">' + rtHtml() + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    // 第 4 步（PSA 失敗）只掛在接受過局部治療者；M1 一開始就沒有局部治療可失敗
    show('pc_c3', !m1);
    show('pc_s4', !m1);

    var a = (!m1 && s.fail) ? recFail(s) : null;
    if (rec2) {
      if (a) {
        rec2.className = 'flow-rec ' + a.cls;
        rec2.innerHTML = '<div class="rec-label">PSA 失敗之處置 Recurrence</div>' +
          '<div class="rec-title">' + a.title + '</div>' +
          '<div class="rec-detail">' + a.detail + '</div>' +
          (a.note ? '<div class="rec-note">' + a.note + '</div>' : '');
      } else {
        rec2.className = 'flow-rec rec-idle hidden';
        rec2.innerHTML = '<div class="rec-label">PSA 失敗之處置 Recurrence</div>' +
          '<div class="rec-title">請選擇上方選項</div>';
      }
    }

    show('pc_c4', true);
    show('pc_s5', true);
    var cr = recCrpc(s);
    if (rec3) {
      if (cr) {
        rec3.className = 'flow-rec ' + cr.cls;
        rec3.innerHTML = '<div class="rec-label">去勢阻抗 CRPC</div>' +
          '<div class="rec-title">' + cr.title + '</div>' +
          cr.panel +
          (cr.note ? '<div class="rec-note">' + cr.note + '</div>' : '');
      } else {
        rec3.className = 'flow-rec rec-idle hidden';
        rec3.innerHTML = '<div class="rec-label">去勢阻抗 CRPC</div>' +
          '<div class="rec-title">請選擇上方選項</div>';
      }
    }

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function pcClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function pcPick(key, val, btn) {
    var s = pcSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'extent') {
      s.extent = val; s.risk = s.le = s.fail = s.crpc = null;
      pcClearSel(['pc_s2', 'pc_s3', 'pc_s4', 'pc_s5']);
    } else if (key === 'risk') {
      s.risk = val; s.le = null;
      pcClearSel(['pc_s3']);
    } else if (key === 'le') {
      s.le = val;
    } else if (key === 'fail') {
      s.fail = val;
    } else if (key === 'crpc') {
      s.crpc = val;
    }
    pcRender();
  }

  function pcReset() {
    for (var k in pcSt) { if (pcSt.hasOwnProperty(k)) pcSt[k] = null; }
    var root = document.getElementById('pcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('pc_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    ['pc_rec2', 'pc_rec3'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    pcRender();
  }

  function initProstatePathway() { pcReset(); }

  global.prostatePathwayHTML = prostatePathwayHTML;
  global.initProstatePathway = initProstatePathway;
  global.pcPick = pcPick;
  global.pcReset = pcReset;
})(window);
