/* ============================================================
   子宮內膜癌治療互動決策流程 Endometrial Carcinoma Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 婦癌診療指引
   版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000011
   對應頁面 UN-1、ENDO-1 ～ ENDO-14、ENDO-A（病理與分子分析原則）
   ※ 流程結構依指引各頁決策圖判讀（非文字順序）。三個易錯之處：
     ① UN-1 先分「純類子宮內膜癌」與「高風險組織型態」，後者四種各有專屬頁面
        （ENDO-11～14），不可套用 ENDO-4 的期別×分級表。
     ② ENDO-4 的每一格是「同一期別＋分級」下的並列選項（or），不是分支。
     ③ ENDO-13（未分化／去分化癌）在手術路徑上<b>完全沒有期別分層</b>——
        全期別同一個建議；勿自行補上期別分支。
   ※ 本模組保留指引中以紅字標註之本院在地修訂（見各處「本院修訂」註記）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var enSt = {
    histo: null,   // endometrioid | serous | clearcell | undiff | carcinosarc
    pres: null,    // uterus | cervix | extra          （僅 endometrioid，ENDO-1～3）
    op: null,      // op_yes | op_fert | op_no
    stg: null      // 手術分期結果
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="enPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 初始評估（UN-1）---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>初始評估 Initial evaluation（UN-1）▸</summary>' +
      '<ul class="dx-list">' +
      '<li>病史與理學檢查；CBC（含血小板）、肝功能、腎功能、生化，<b>並考慮 CA-125</b></li>' +
      '<li><b>專家病理判讀</b>；臨床上有需要時追加子宮內膜切片</li>' +
      '<li>影像檢查</li>' +
      '<li><b>建議做腫瘤分子檢測與遺傳性癌症風險評估</b>（ENDO-A、UTSARC-A）</li>' +
      '<li>考慮生殖細胞（germline）和／或多基因套組檢測</li>' +
      '<li>高齡病人另見老年腫瘤學準則</li>' +
      '</ul>' +
      '<div class="dx-h">本院必要檢查（Essential examination，指引以標示強調）</div>' +
      '<ul class="dx-list"><li><b>子宮內膜切片 endometrial biopsy</b></li><li><b>PET、骨盆腔 CT／MRI</b></li></ul>' +
      '</details>';
  }

  /* ---------- 分子分型（ENDO-A 2 of 4、3 of 4）---------- */
  function molHtml() {
    return '<details class="dx-details"><summary>分子分析原則與四型分類 Molecular classification（ENDO-A 2–3 of 4）▸</summary>' +
      '<div class="dx-h">圖 1：分類順序（<b>嚴格依序</b>，先到先歸）</div>' +
      '<ul class="dx-list">' +
      '<li><b>① POLE 定序</b>：有致病性突變（exonuclease domain）→ <b>POLE 型</b>，分類結束。</li>' +
      '<li><b>② 無 POLE 突變 → MMR 免疫組化或 MSI 檢測</b>：異常 → <b>dMMR／MSI-H 型</b>。</li>' +
      '<li><b>③ MMR 正常 → p53 免疫組化</b>：正常／野生型 → <b>NSMP 型</b>；異常／突變型 → <b>p53 異常型</b>。</li>' +
      '<li>因此<b>同時有 POLE 突變與 MMR 缺失者歸為 POLE 型</b>——順序決定歸類，不可平行判讀。</li>' +
      '</ul>' +
      '<div class="dx-h">指引要點</div>' +
      '<ul class="dx-list">' +
      '<li>四型<b>預後不同</b>，回溯性資料顯示對治療反應亦不同，<b>可能需要相對於舊準則的升階或降階治療</b>；前瞻性隨機試驗仍在進行中。</li>' +
      '<li><b>不論組織型態</b>，均建議加做 POLE 定序、MMR 免疫組化或 MSI、以及 p53 免疫組化以輔助形態判讀。</li>' +
      '<li>四型任一皆<b>強烈鼓勵參加臨床試驗</b>。檢測可用初次切片、刮除檢體或最終子宮切除檢體。</li>' +
      '<li>MMR 多以免疫組化判定；<b>結果模稜兩可時建議加做 MSI</b>。<b>MLH1 表現缺失須進一步評估啟動子甲基化</b>以釐清是否為表觀遺傳機轉。疑似生殖細胞突變者<b>強烈建議遺傳諮詢</b>；子宮內膜癌／大腸直腸癌家族史強烈者，<b>不論 MMR 或 MLH1 甲基化結果均建議遺傳諮詢與檢測</b>。</li>' +
      '<li><b>HER2 免疫組化</b>（必要時反射性 FISH）建議用於<b>所有 p53 異常之癌</b>（不論組織型態）<b>及所有轉移／復發疾病</b>（<b>本院修訂加入</b>）。</li>' +
      '<li><b>ER／PR 檢測</b>建議用於第 III 期、第 IV 期及復發疾病。</li>' +
      '<li>轉移或復發者<b>考慮 NTRK 與 RET 基因融合檢測</b>（<b>RET 為本院修訂加入</b>）；並可考慮腫瘤突變負荷（TMB）。</li>' +
      '</ul>' +
      '<div class="dx-h">病理報告要點（ENDO-A 1 of 4）</div>' +
      '<ul class="dx-list">' +
      '<li>子宮切除術式、<b>檢體完整性（完整／已剖開／碎解）</b>、腫瘤部位與大小、組織型態與分級、<b>肌層侵犯深度（以 mm 對肌層厚度 mm 表示）</b>、子宮頸間質侵犯、<b>LVSI</b>。</li>' +
      '<li><b>本院修訂</b>：<b>顯著 LVSI（substantial）之門檻由 ≥4 條改為 ≥5 條</b>受侵犯血管／每張 H&amp;E 切片。</li>' +
      '<li>前哨淋巴結須做<b>超分期（ultrastaging）</b>；<b>孤立腫瘤細胞記為 N0(i+)，不上調分期</b>，但應納入輔助治療討論。須載明侵犯層級（骨盆腔／髂總／主動脈旁）與各級之孤立腫瘤細胞、微轉移、巨轉移顆數。</li>' +
      '</ul>' +
      '</details>';
  }

  /* ---------- 追蹤（ENDO-9）---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤與復發處置 Surveillance（ENDO-9／ENDO-10）</div>' +
      '<ul class="fu-list">' +
      '<li><b>理學檢查（含骨盆腔）</b>：前 2–3 年每 3–6 個月，其後至第 5 年每 6–12 個月，之後每年一次。</li>' +
      '<li><b>CA-125</b>：初始即升高者、或漿液性組織型態者追蹤之。</li>' +
      '<li><b>影像</b>：依症狀或理學檢查可疑復發時安排。</li>' +
      '<li>治療長期與晚期副作用之評估與處置（婦科癌症存活照護原則 UN-B）。</li>' +
      '<li><b>局部區域復發（影像無遠處轉移）</b> → ENDO-10：<b>先分「該處是否曾接受放療」</b>。未曾放療或僅曾陰道近接者 → EBRT ± 近接 ± 全身治療，<b>或</b>手術探查併切除 ± IORT（IORT 為 category 3）。曾接受 EBRT 者 → 手術探查併切除 ± IORT ± 全身治療 ± 姑息性 EBRT，<b>或</b>近接治療 ± 全身治療。</li>' +
      '<li><b>孤立轉移</b> → 考慮切除和／或 EBRT／<b>SBRT</b>（<b>SBRT 為本院修訂加入</b>）或局部消融；<b>考慮全身治療</b>（<b>原「category 2B」經本院刪除</b>）。無法局部處理或再復發 → 比照瀰漫性轉移。</li>' +
      '<li><b>瀰漫性轉移</b> → 全身治療 ± 姑息性 EBRT；惡化則轉最佳支持療法。</li>' +
      '</ul>';
  }

  /* ---------- ENDO-4：第 I 期期別 × 分級輔助治療表 ---------- */
  var ENDO4 = {
    ia_g12: { t: '第 IA 期 · G1／G2', lines: [
      '<b>觀察為優先（Observation preferred）</b>',
      '<b>或</b> 若有 <b>LVSI</b> 和／或<b>年齡 ≥60 歲</b>，考慮<b>陰道近接治療</b>'
    ]},
    ia_g3: { t: '第 IA 期 · G3', lines: [
      '<b>陰道近接治療為優先</b>',
      '<b>或</b> <b>無肌層侵犯</b>者考慮<b>觀察</b>',
      '<b>或</b> <b>年齡 ≥70 歲</b>或有 <b>LVSI</b> 者考慮 <b>EBRT（category 2B）</b>'
    ]},
    ib_g1: { t: '第 IB 期 · G1', lines: [
      '<b>陰道近接治療為優先</b>',
      '<b>或</b> <b>年齡 &lt;60 歲且無 LVSI</b> 者考慮<b>觀察</b>'
    ]},
    ib_g2: { t: '第 IB 期 · G2', lines: [
      '<b>陰道近接治療為優先</b>',
      '<b>或</b> <b>年齡 ≥60 歲</b>和／或有 <b>LVSI</b> 者考慮 <b>EBRT</b>',
      '<b>或</b> <b>年齡 &lt;60 歲且無 LVSI</b> 者考慮<b>觀察</b>'
    ]},
    ib_g3: { t: '第 IB 期 · G3', lines: [
      '<b>放射治療（EBRT 和／或陰道近接治療）± 全身治療</b>',
      '（<b>全身治療為 category 2B</b>）'
    ]}
  };

  function recFor(s) {
    /* ── 類子宮內膜癌 ── */
    if (s.histo === 'endometrioid') {

      if (s.op === 'op_fert') {
        return { cls: 'rec-elective', title: '保留生育功能之處置（ENDO-8）', detail:
          '<div class="note"><b>以下條件<u>全部</u>須符合</b>：' +
          '<ul class="dx-list">' +
          '<li><b>Grade 1</b> 類子宮內膜腺癌，<b>以子宮鏡（本院修訂：hysteroscopy 為優先）</b>與擴刮術取得，並經專家病理判讀確認</li>' +
          '<li>MRI（優先）或經陰道超音波顯示<b>病灶侷限於子宮內膜</b></li>' +
          '<li>影像無可疑或轉移性病灶</li>' +
          '<li>無藥物治療或懷孕之禁忌</li>' +
          '<li>病人須被告知<b>保留生育並非子宮內膜癌之標準治療</b></li>' +
          '</ul></div>' +
          rxLine('治療前準備', 'ENDO-8', [
            '<b>治療前先諮詢生殖專科</b>；建議腫瘤分子檢測與遺傳性癌症風險評估（UN-1）；<b>確認驗孕陰性</b>。'
          ]) +
          rxLine('原發治療', 'ENDO-8', [
            '<b>持續性黃體素治療</b>：<span class="drug">megestrol</span>、<span class="drug">medroxyprogesterone</span>、<b><span class="drug">levonorgestrel 子宮內投藥系統（IUD）</span>（保留生育之優先選擇）</b>',
            '<b>考慮子宮鏡下腫瘤評估與切除</b>（<b>本院修訂加入</b>）',
            '考慮<b>雙重黃體素治療</b>［（megestrol 或 medroxyprogesterone）+ levonorgestrel IUD］',
            '體重管理與生活型態調整衛教'
          ]) +
          rxLine('追蹤與時程', 'ENDO-8', [
            '<b>每 3–6 個月做子宮內膜評估</b>（擴刮術或子宮內膜切片）。',
            '<b>6 個月達完全反應</b> → 鼓勵受孕（持續每 6–12 個月取樣；未積極嘗試受孕時可考慮維持黃體素）→ <b>完成生育或取樣顯示惡化後行子宮切除併雙側輸卵管卵巢切除與分期</b>（停經前經篩選之病人可考慮保留卵巢）。',
            '<b>6 個月仍有癌</b> → <b>若尚未加上，考慮改為雙重黃體素治療</b>（<b>本院修訂</b>）→ <b>12 個月仍有癌</b> → <b>行子宮切除併雙側輸卵管卵巢切除與分期（以 12 個月內為優先）</b>。'
          ]),
          note: 'ENDO-8。<b>條件是「全部須符合」而非擇一</b>；且指引明文要求告知病人此非標準治療。' };
      }

      if (s.op === 'op_no') {
        if (s.pres === 'uterus') {
          return { cls: 'rec-nonop', title: '病灶侷限子宮但不適合原發手術（ENDO-1）', detail:
            rxLine('二擇一', 'ENDO-1', [
              '<b>體外放射治療（EBRT）和／或近接治療（優先）</b>',
              '<b>或</b> 經篩選之病人<b>考慮荷爾蒙治療</b>（含 <span class="drug">levonorgestrel IUD</span>）'
            ]),
            note: 'ENDO-1。' };
        }
        if (s.pres === 'cervix') {
          return { cls: 'rec-nonop', title: '疑似或明顯子宮頸侵犯（切片／MRI 陽性）且不適合原發手術（ENDO-2）', detail:
            rxLine('二擇一', 'ENDO-2', [
              '<b>EBRT ± 近接治療</b> → 其後：<b>若轉為可手術，於放療後 4–12 週手術切除</b>；<b>若仍不可手術則行根治性放療</b>。',
              '<b>或 全身治療（category 2B）</b> → 其後：<b>若轉為可手術則切除</b>；<b>不可手術則 EBRT + 近接治療</b>。'
            ]),
            note: 'ENDO-2。' };
        }
        return { cls: 'rec-nonop', title: '疑似子宮外病灶且不適合原發手術（ENDO-3）', detail:
          rxLine('局部區域疾病 · 二擇一', 'ENDO-3', [
            '<b>EBRT ± 近接治療 ± 全身治療</b> → <b>放療後 4–12 週重新評估手術切除</b>。',
            '<b>或 全身治療</b> → <b>依反應重新評估手術切除和／或放療</b>。'
          ]) +
          rxLine('遠處轉移', 'ENDO-3', [
            '<b>全身治療</b> → 依反應重新評估手術切除和／或放療。'
          ]),
          note: 'ENDO-3。' };
      }

      // 適合手術：先給手術計畫，選了分期結果再給輔助治療
      if (!s.stg) {
        var planLines, planNote;
        if (s.pres === 'uterus') {
          planLines = ['<b>全子宮切除併雙側輸卵管卵巢切除（TH/BSO）+ 手術分期</b>'];
          planNote = 'ENDO-1。';
        } else if (s.pres === 'cervix') {
          planLines = [
            '<b>先做子宮頸切片或骨盆腔 MRI</b>（若尚未做）。',
            '<b>結果陰性</b> → TH/BSO + 手術分期。',
            '<b>結果陽性且適合手術</b> → <b>全子宮切除（優先）或根除性子宮切除，併 BSO 與手術分期</b>；<b>或</b> EBRT ± 近接治療（<b>category 2B</b>）後<b>於放療後 4–12 週行 TH/BSO 與手術分期</b>。'
          ];
          planNote = 'ENDO-2。';
        } else {
          planLines = [
            '<b>先考慮 CA-125 與必要影像。</b>',
            '<b>無子宮外病灶證據</b> → 依「病灶侷限子宮」處理（ENDO-1）。',
            '<b>腹腔／骨盆腔侷限之病灶</b> → <b>TH/BSO + 手術分期／減積手術</b>（<b>可考慮術前化療</b>）→ 依<b>第 III–IV 期</b>輔助治療（ENDO-6）。',
            '<b>遠處轉移</b> → <b>全身治療 ± EBRT ± SBRT ± TH/BSO</b> → 追蹤。'
          ];
          planNote = 'ENDO-3。';
        }
        return { cls: 'rec-elective', title: '原發手術計畫', detail: rxLine('手術與分期', planNote.replace('。', ''), planLines) +
          '<div class="note">完成手術分期後，請於上方<b>第 4 步</b>選擇分期結果以取得輔助治療建議（ENDO-4／5／6／7）。</div>',
          note: planNote };
      }

      if (ENDO4[s.stg]) {
        var e = ENDO4[s.stg];
        return { cls: 'rec-elective', title: '輔助治療 · ' + e.t, detail:
          rxLine('並列選項（同一格內以 or 並列）', 'ENDO-4', e.lines),
          note: 'ENDO-4。表中每一格是<b>同一期別＋分級下的並列選項</b>，不是分支——決定選哪一項的是 LVSI 與年齡，不是再往下分期。' };
      }
      if (s.stg === 'st2') {
        return { cls: 'rec-elective', title: '輔助治療 · 第 II 期（G1–G3）', detail:
          rxLine('單一建議', 'ENDO-5', [
            '<b>EBRT（優先）</b>',
            '<b>和／或</b> 陰道近接治療',
            '<b>± 全身治療</b>（<b>全身治療為 category 2B</b>）'
          ]),
          note: 'ENDO-5。<b>第 II 期只有一列，涵蓋 G1–G3</b>——分級在此不改變輔助治療建議。' };
      }
      if (s.stg === 'st34') {
        return { cls: 'rec-elective', title: '輔助治療 · 第 III／IV 期', detail:
          rxLine('單一建議', 'ENDO-6', [
            '<b>全身治療</b>',
            '<b>± EBRT</b>',
            '<b>± 陰道近接治療</b>'
          ]),
          note: 'ENDO-6。<b>本頁無分級、亦無次分期之分層</b>——第 III 與第 IV 期共用同一個建議，勿自行細分。' };
      }
      if (s.stg === 'incomp') {
        return { cls: 'rec-elective', title: '手術分期不完整（ENDO-7）', detail:
          '<div class="note"><b>本頁分期依據為 2009 FIGO</b>——指引在 ENDO-7 明文標示，與 ENDO-4／5／6 所標之「updated FIGO」不同頁不同版，判讀時請留意。</div>' +
          rxLine('先做影像；影像陰性者依下列分流', 'ENDO-7', [
            '<b>IA、G1–2 有肌層侵犯且無 LVSI</b> → 依 ENDO-4。',
            '<b>IA、G3 且無肌層侵犯</b> → 依 ENDO-4。',
            '<b>IA、G3 有肌層侵犯且無 LVSI</b> → 依 ENDO-4。',
            '<b>IB 任何分級，或任何有肌層侵犯併 LVSI 者</b> → <b>考慮手術重新分期</b>：已重新分期 → 依手術分期之輔助治療；<b>未重新分期 → 放療（EBRT 和／或陰道近接）± 全身治療（全身治療為 category 2B）</b>。'
          ]) +
          rxLine('影像可疑或陽性', 'ENDO-7', [
            '<b>可手術切除</b> → 手術。',
            '<b>不適合手術</b> → <b>切片</b> → 治療後再考慮手術。'
          ]) +
          rxLine('≥ 第 II 期', 'ENDO-7', [
            '影像（必要時切片）→ 依<b>第 II 期（ENDO-5）</b>或<b>第 III–IV 期（ENDO-6）</b>之輔助治療。'
          ]),
          note: 'ENDO-7。' };
      }
    }

    /* ── 高風險組織型態（ENDO-11～ENDO-14）── */
    var VAR = {
      serous:     { n: '漿液性癌 Serous carcinoma', sec: 'ENDO-11' },
      clearcell:  { n: '亮細胞癌 Clear cell carcinoma', sec: 'ENDO-12' },
      undiff:     { n: '未分化／去分化癌 Undifferentiated / dedifferentiated', sec: 'ENDO-13' },
      carcinosarc:{ n: '癌肉瘤 Carcinosarcoma', sec: 'ENDO-14' }
    };
    var v = VAR[s.histo];
    if (!v) return null;

    if (s.op === 'op_no') {
      if (s.histo === 'undiff') {
        return { cls: 'rec-nonop', title: v.n + ' · 不適合原發手術', detail:
          rxLine('單一路徑', v.sec, [
            '<b>全身治療 ± EBRT ± 陰道近接治療</b> → <b>依反應重新評估手術切除和／或放療</b>。'
          ]),
          note: v.sec + '。' };
      }
      if (s.histo === 'carcinosarc') {
        return { cls: 'rec-nonop', title: v.n + ' · 不適合原發手術', detail:
          rxLine('子宮侷限之疾病 ± 影像上骨盆腔淋巴結侵犯 · 二擇一', v.sec, [
            '<b>EBRT ± 近接治療 ± 全身治療</b> → 重新評估手術切除。',
            '<b>或 全身治療</b> → 依反應重新評估手術切除和／或放療。'
          ]) +
          rxLine('其他轉移性疾病', v.sec, [
            '<b>全身治療 ± EBRT</b>，<b>或</b>最佳支持療法。'
          ]),
          note: v.sec + '。' };
      }
      return { cls: 'rec-nonop', title: v.n + ' · 不適合原發手術', detail:
        rxLine('二擇一', v.sec, [
          '<b>EBRT ± 近接治療 ± 全身治療</b> → 重新評估手術切除。',
          '<b>或 全身治療</b> → 依反應重新評估手術切除和／或放療。'
        ]),
        note: v.sec + '。' };
    }

    // 適合手術
    if (s.histo === 'undiff') {
      return { cls: 'rec-elective', title: v.n + ' · 適合原發手術', detail:
        rxLine('追加檢查', v.sec, ['考慮 CA-125、影像檢查']) +
        rxLine('原發治療', v.sec, [
          '<b>TH/BSO 併手術分期</b>；<b>有肉眼可見病灶時考慮最大程度減積手術</b>'
        ]) +
        rxLine('術後治療', v.sec, [
          '<b>全身治療 ± EBRT ± 陰道近接治療</b>'
        ]),
        note: v.sec + '。<b>本組在手術路徑上完全沒有期別分層</b>——不論第幾期都是同一個建議，這是指引原文，非本頁省略。' };
    }

    if (s.histo === 'carcinosarc') {
      if (!s.stg) {
        return { cls: 'rec-elective', title: v.n + ' · 原發手術計畫', detail:
          rxLine('追加檢查', v.sec, ['考慮 CA-125、影像檢查']) +
          rxLine('原發治療', v.sec, ['<b>TH/BSO 併手術分期</b>；<b>有肉眼可見病灶時考慮最大程度減積手術</b>']) +
          '<div class="note">請於上方<b>第 4 步</b>選擇術後期別以取得輔助治療建議。</div>',
          note: v.sec + '。<b>癌肉瘤依 ST-1／ST-2 以子宮內膜癌之 TNM 分期</b>，不套用子宮肉瘤之 ST-3／ST-4。' };
      }
      if (s.stg === 'cs_ia') {
        return { cls: 'rec-elective', title: v.n + ' · 第 IA 期', detail:
          rxLine('輔助治療', v.sec, [
            '<b>全身治療 + 陰道近接治療</b>'
          ]) +
          '<div class="note"><b>本院修訂</b>：原文之「± EBRT」在第 IA 期<b>已由本院刪除</b>——第 IA 期不加 EBRT，這是本院與原始 NCCN 版本的實質差異。</div>',
          note: v.sec + '。' };
      }
      return { cls: 'rec-elective', title: v.n + ' · 第 IB／II／III／IV 期', detail:
        rxLine('輔助治療', v.sec, ['<b>全身治療 ± EBRT ± 陰道近接治療</b>']),
        note: v.sec + '。' };
    }

    // 漿液性／亮細胞：四個術後發現
    if (!s.stg) {
      return { cls: 'rec-elective', title: v.n + ' · 原發手術計畫', detail:
        rxLine('追加檢查', v.sec, ['考慮 CA-125、影像檢查']) +
        rxLine('原發治療', v.sec, ['<b>TH/BSO 併手術分期</b>；<b>有肉眼可見病灶時考慮最大程度減積手術</b>']) +
        '<div class="note">請於上方<b>第 4 步</b>選擇術後發現以取得輔助治療建議。</div>',
        note: v.sec + '。' };
    }
    if (s.stg === 'sc_none') {
      return { cls: 'rec-elective', title: v.n + ' · 子宮無殘存病灶且手術分期陰性', detail:
        rxLine('輔助治療', v.sec, ['<b>觀察 Observe</b>']),
        note: v.sec + '。' };
    }
    if (s.stg === 'sc_ia_ni') {
      return { cls: 'rec-elective', title: v.n + ' · 非侵犯性第 IA 期', detail:
        rxLine('三個並列選項', v.sec + '（<b>本院修訂之區塊</b>）', [
          '<b>觀察</b>',
          '<b>或 全身治療 ± 陰道近接治療</b>',
          '<b>或 陰道近接治療</b>'
        ]),
        note: v.sec + '。此三選項為<b>本院在地修訂之內容</b>（指引以紅字標示），與原始版本不同。' };
    }
    if (s.stg === 'sc_inv') {
      return { cls: 'rec-elective', title: v.n + ' · 侵犯性第 IA 期／第 IB 期／第 II 期', detail:
        rxLine('二擇一', v.sec, [
          '<b>全身治療 ± EBRT ± 陰道近接治療</b>',
          '<b>或 EBRT ± 陰道近接治療</b>'
        ]),
        note: v.sec + '。<b>與類子宮內膜癌最大的差別</b>：漿液性與亮細胞癌<b>自侵犯性 IA 期起即納入全身治療</b>，沒有「觀察為優先」這一格。' };
    }
    if (s.stg === 'sc_34') {
      return { cls: 'rec-elective', title: v.n + ' · 第 III／IV 期', detail:
        rxLine('輔助治療', v.sec, ['<b>全身治療 ± EBRT ± 陰道近接治療</b>']),
        note: v.sec + '。' };
    }
    return null;
  }

  function endoPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院婦癌診療指引 版次 10（2026/06/16，文件編號 50710-2-000011）</b>子宮體腫瘤章節（UN-1、ENDO-1～ENDO-14、ENDO-A）之互動決策流程。' +
      '分期依指引 ST-1／ST-2 所載之 <b>AJCC 8th／FIGO 2009</b>。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="enPath">';

    h += dxHtml() + molHtml();

    h += step('en_s1', '1', '組織型態？',
      opt('histo', 'endometrioid', '純類子宮內膜癌', 'Pure endometrioid · ENDO-1～10') +
      opt('histo', 'serous', '漿液性癌', 'ENDO-11') +
      opt('histo', 'clearcell', '亮細胞癌', 'ENDO-12') +
      opt('histo', 'undiff', '未分化／去分化癌', 'ENDO-13') +
      opt('histo', 'carcinosarc', '癌肉瘤', 'ENDO-14'),
      '<div class="note">UN-1 的第一個分叉。<b>後四者為「高風險組織型態」，各有專屬頁面，不套用 ENDO-4 之期別×分級表。</b>子宮肉瘤（LMS、ESS、UUS）不在本頁，見<b>子宮肉瘤</b>條目。</div>');

    h += connH('en_c1');
    h += step('en_s2', '2', '初始臨床發現？',
      opt('pres', 'uterus', '病灶侷限於子宮', 'ENDO-1') +
      opt('pres', 'cervix', '疑似或明顯子宮頸侵犯', 'ENDO-2') +
      opt('pres', 'extra', '疑似子宮外病灶', 'ENDO-3'));

    h += connH('en_c2');
    h += step('en_s3', '3', '手術適合性與生育需求？',
      opt('op', 'op_yes', '適合原發手術') +
      opt('op', 'op_fert', '希望保留生育功能', '僅類子宮內膜癌 · ENDO-8') +
      opt('op', 'op_no', '不適合原發手術'));

    h += step('en_s4', '4', '手術分期結果？',
      opt('stg', 'ia_g12', '第 IA 期 · G1／G2') +
      opt('stg', 'ia_g3', '第 IA 期 · G3') +
      opt('stg', 'ib_g1', '第 IB 期 · G1') +
      opt('stg', 'ib_g2', '第 IB 期 · G2') +
      opt('stg', 'ib_g3', '第 IB 期 · G3') +
      opt('stg', 'st2', '第 II 期', 'G1–G3 共用') +
      opt('stg', 'st34', '第 III／IV 期') +
      opt('stg', 'incomp', '手術分期不完整', 'ENDO-7'));

    h += step('en_s4v', '4', '術後發現？',
      opt('stg', 'sc_none', '子宮無殘存病灶且手術分期陰性') +
      opt('stg', 'sc_ia_ni', '非侵犯性第 IA 期') +
      opt('stg', 'sc_inv', '侵犯性 IA／IB／II 期') +
      opt('stg', 'sc_34', '第 III／IV 期'));

    h += step('en_s4c', '4', '術後期別？',
      opt('stg', 'cs_ia', '第 IA 期') +
      opt('stg', 'cs_rest', '第 IB／II／III／IV 期'));

    h += '<div class="flow-rec rec-idle" id="en_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="en_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="enReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function enRender() {
    var s = enSt;
    var endo = s.histo === 'endometrioid';
    var variant = !!s.histo && !endo;

    show('en_c1', !!s.histo);
    show('en_s2', endo);                       // 初始臨床發現僅類子宮內膜癌有
    show('en_c2', endo ? !!s.pres : !!s.histo);
    show('en_s3', endo ? !!s.pres : variant);

    var surgical = s.op === 'op_yes';
    show('en_s4', endo && surgical);
    show('en_s4v', surgical && (s.histo === 'serous' || s.histo === 'clearcell'));
    show('en_s4c', surgical && s.histo === 'carcinosarc');

    var done = (endo && !!s.pres && !!s.op) || (variant && !!s.op);

    var rec = document.getElementById('en_rec');
    var fu = document.getElementById('en_fu');
    if (!rec) return;

    if (!done) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }

    var r = recFor(s);
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function enClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function enPick(key, val, btn) {
    var s = enSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'histo') {
      s.histo = val; s.pres = s.op = s.stg = null;
      enClearSel(['en_s2', 'en_s3', 'en_s4', 'en_s4v', 'en_s4c']);
    } else if (key === 'pres') {
      s.pres = val; s.op = s.stg = null;
      enClearSel(['en_s3', 'en_s4', 'en_s4v', 'en_s4c']);
    } else if (key === 'op') {
      s.op = val; s.stg = null;
      enClearSel(['en_s4', 'en_s4v', 'en_s4c']);
    } else if (key === 'stg') {
      s.stg = val;
    }
    enRender();
  }

  function enReset() {
    for (var k in enSt) { if (enSt.hasOwnProperty(k)) enSt[k] = null; }
    var root = document.getElementById('enPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('en_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    enRender();
  }

  function initEndoPathway() { enReset(); }

  global.endoPathwayHTML = endoPathwayHTML;
  global.initEndoPathway = initEndoPathway;
  global.enPick = enPick;
  global.enReset = enReset;
})(window);
