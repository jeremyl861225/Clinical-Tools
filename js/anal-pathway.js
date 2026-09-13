/* ============================================================
   肛門癌治療互動決策流程 Anal Cancer Treatment Pathway
   ------------------------------------------------------------
   2026-09-13 從零建立 —— 這個癌別先前**完全沒有流程模組**，
   只有 cancers.js 裡三張靜態卡片。

   ❗❗ 台大醫院沒有肛門癌診療指引（已查證）：
     大腸直腸癌診療指引 版次 21 全文的 anal 命中**全部是「直腸癌侵犯肛管時的保肛手術與
     放療照野」**（COL-13／14「Anal preserving rectal cancer」、COL-16/17 的照野設計、
     COL-3～8 的 transanal excision），**不是肛門鱗狀細胞癌這個疾病**。
   → 本頁**全部是院外實證**，逐處標明出處與版本。

   來源（全文均已取得並抽成純文字）：
     · **ESMO CPG 2021**（Rao S et al. Ann Oncol 2021;32:1087-1100，PMID 34175386）—— 帶 [LoE, Grade]
     · **ASCRS 2018**（Revised，PMID 29878949）—— 最新版；2022／2023 那兩篇是 anal fissure 不是癌
     · **ACPGBI 2017**（Geh I et al.，PMID 28632308）
       ⚠ 其分期章節仍用 AJCC 第 7 版，**過期兩代，分期一律不要用它**；化放療與照野建議可用。
     · **NCCN Anal Carcinoma 現行為 Version 2.2026**；
       ⚠ 本頁引用的逐字條文來自可公開取得的 **V2.2023**（JNCCN 刊登版 Discussion），
       **演算法頁 ANAL-1～8 未取得**，引用一律標版本。
     · AJCC v9（Janczewski LM et al. Ann Surg Oncol 2024，PMID 38735904）

   ❗這個癌別最重要的一件事：**治療主軸與隔壁的直腸癌相反**。
     直腸癌以手術切除為主軸；**肛管鱗狀細胞癌的標準根治治療是同步化放療，
     手術（APE／APR）只作為化放療後殘存或局部復發的救援治療。**
     （但不要寫成「完全相反」——直腸癌現在也有 TNT 與 watch-and-wait。）

   ❗台灣端（查詢日 2026-09-13）：
     **肛門癌在台灣沒有任何一張藥證、也沒有任何一條健保給付條文。**
     · 534 條給付規定 PDF 全文檢索（NFKC 正規化後）「肛」只有 5 處，**全部與癌無關**；
       整份 410 頁《藥品給付規定》（115.4.23）交叉驗證結果相同；英文 anal cancer／anal canal 0 筆。
     · 食藥署許可證資料集 36 **全庫（含已註銷）**搜「肛門癌」「肛管癌」「anal cancer」「肛門鱗狀」
       → **全部 0 筆**。
     · **mitomycin 台灣現行只剩一張藥證**（衛部藥輸字第028315號，有效至 2027/05/26），
       適應症逐字「胃癌、膀胱癌（灌注使用）、肺癌、肉瘤、白血病等症狀之緩解」——**不含肛門癌**。
     · **carboplatin 三張現效藥證的適應症就只有「卵巢癌。」四個字** ——
       肛門癌用 carboplatin ＋ paclitaxel 是**條文外加仿單外雙重**。
     · **retifanlimab 在台灣藥證與健保皆 0 筆。**

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   ============================================================ */
(function (global) {
  'use strict';

  var S = {};
  var KEYS = ['site', 'cstage', 'resp', 'line', 'mt'];
  KEYS.forEach(function (k) { S[k] = null; });

  var AN_DRUGS = [
    { key: 'mitomycin', cards: [['17', 'MIN1CD06', 'Mitonco 密多邁杏凍晶注射劑 10 mg', 'mitomycin']],
      flag: '❗台灣藥證適應症不含肛門癌（仿單外）' },
    { key: '5-FU', re: '5-FU|fluorouracil',
      cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']],
      flag: '❗無專屬健保條文；藥證未列肛門癌' },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg', 'capecitabine']],
      flag: '❗健保 9.17 只寫乳癌／結腸直腸癌／胃癌' },
    { key: 'carboplatin', cards: [['17', 'KEM1CA32', 'Kemocarb 爾定康靜脈注射液 150 mg', 'carboplatin']],
      flag: '❗台灣藥證適應症只有「卵巢癌。」四個字' },
    { key: 'paclitaxel', cards: [['17', 'PHY1CC03', 'Paclitaxel 輝克癒蘇注射劑', 'paclitaxel']],
      flag: '❗健保 9.5.1 未寫肛門癌' },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg', 'cisplatin']],
      flag: '❗無專屬健保條文' },
    { key: 'nivolumab', cards: [['17', 'OPD1CEJ9', 'Opdivo 保疾伏注射劑', 'nivolumab']],
      flag: '❗健保 9.69 未寫肛門癌' },
    { key: 'pembrolizumab', cards: [['17', 'KEY1CEO9', 'Keytruda 吉舒達注射劑 100 mg', 'pembrolizumab']],
      flag: '❗健保 9.69 的泛癌別 MSI-H 只給大腸直腸癌' }
  ];

  function opt(k, v, t, s) {
    return '<button class="flow-opt" onclick="anPick(\'' + k + '\',\'' + v + '\',this)">' +
      t + (s ? '<span class="fo-sub">' + s + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="an-node hidden" id="' + id + '"><div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head"><span class="flow-num">' + num +
      '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts, extra) {
    return '<div class="an-node" id="' + id + '"><div class="flow-step">' +
      '<div class="flow-step-head"><span class="flow-num">' + num + '</span>' +
      '<span class="flow-q">' + q + '</span></div><div class="flow-opts">' + opts + '</div>' +
      (extra || '') + '</div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }
  function H(t, s) { return '<span class="rx-h">' + t + '</span>' + (s ? '　<span class="rx-sub">' + s + '</span>' : ''); }
  function EV(t) { return '@ev ' + t; }
  function SUB(a) { return '<ul class="rec-sub"><li>' + a.join('</li><li>') + '</li></ul>'; }
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }
  function fold(s, i) { return '<details class="kps-details"><summary>' + s + ' ▸</summary>' + i + '</details>'; }

  /* ---------- 參考區塊 ---------- */
  function crtReference() {
    return fold('<b>同步化放療的處方與照野</b>（ESMO 2021／ASCRS 2018／NCCN V2.2023）',
      '<table>' +
      '<tr><td><b>標準骨幹</b></td>' +
      '<td>ESMO 逐字：<b>「RT with concomitant 5-FU and MMC … standard of care <u>[I, A]</u>」</b><br>' +
      'ASCRS 逐字：<b>「The primary treatment for all squamous cell cancers of the anal canal … ' +
      'is CRT.<u>（Strong recommendation based on high-quality evidence, 1A）</u>」</b></td></tr>' +
      '<tr><td>❗<b>Nigro protocol 的<br>原始劑量引不得</b></td>' +
      '<td><b>Nigro 1974 原文取不到</b>（期刊付費、PubMed 無摘要）。' +
      '<b>只有 ASCRS 轉述的「30 Gy」有原文支持，5-FU 與 MMC 的 mg/m² 屬未查證。</b><br>' +
      '→ <b>要寫劑量請改引有全文的試驗</b>：' + SUB([
        '<b>ACT II</b>：<b>50.4 Gy／28 次</b>；<b><span class="rx">5-FU</span> 1000 mg/m² ' +
          'd1–4 與 d29–32</b>；<b><span class="rx">mitomycin</span> 12 mg/m² d1</b>',
        '<b>RTOG 98-11</b>：<b><span class="rx">mitomycin</span> 10 mg/m² d1 與 d29</b>']) + '</td></tr>' +
      '<tr><td>❗<b>cisplatin 不可<br>常規取代 mitomycin</b></td>' +
      '<td><b>RTOG 98-11 原文逐字：「<u>These findings do not support the use of cisplatin in place ' +
      'of mitomycin</u>」</b>；造口率 <b>10% 對 19%（P = .02）</b>，較差的是 cisplatin 組。<br>' +
      '<b>2012 長期更新更進一步：mitomycin 組的 5 年無病存活 67.8% 對 57.8%（P = .006）、' +
      '整體存活 78.3% 對 70.7%（P = .026）</b>，結論「RT + FU/MMC <u>remains the preferred standard ' +
      'of care</u>」。<b>不是「沒有改善」，是 mitomycin 顯著較好。</b><br>' +
      '❗<b>但 RTOG 98-11 的 cisplatin 臂同時多了 induction 化療、而且放療延到第 57 天才開始</b> —— ' +
      '<b>NCCN 明文說無法歸因是「換 cisplatin」還是「加 induction」。</b>' +
      '<b>真正的純替換驗證是 ACT II：26 週完全反應率 90.5% 對 89.6%（p = 0.64），' +
      '療效相當但非更優。</b><br>' +
      '❗<b>不要寫成「mitomycin 又有效又較安全」</b> —— <b>mitomycin 的血液毒性反而較高。</b><br>' +
      '❗<b>數字順序兩份來源是相反的</b>：NCCN 寫「in favor of the mitomycin group (57.8% v 67.8%)」' +
      '（前者是 cisplatin 組），原論文寫「MMC versus CDDP（67.8% v 57.8%）」。<b>抄的時候要看清楚。</b></td></tr>' +
      '<tr><td><b>❗鼠蹊部照野</b></td>' +
      '<td>ESMO：<b>「should be included in the RT fields <u>in most cases, even in the absence of</u> ' +
      'clearly demonstrable involvement」</b><br>' +
      'ACPGBI：<b>常規給所有 T2–T4；省略時復發率約 30%；小的 T1 可選擇性省略（grade B）</b><br>' +
      'NCCN V2.2023：<b>初始 30.6 Gy 涵蓋鼠蹊，淋巴結陰性者於 36 Gy 後縮野</b></td></tr>' +
      '<tr><td><b>IMRT</b></td>' +
      '<td>❗<b>RTOG 0529 並未達到主要終點</b>（急性 GU／GI grade 2 以上兩邊都是 <b>77%</b>）—— ' +
      '<b>只有血液毒性、grade 3 以上腸胃道與皮膚毒性下降。</b>' +
      '<b>不可寫成「IMRT 已證實降低毒性」。</b></td></tr>' +
      '<tr><td>❗<b>HIV 陽性</b></td>' +
      '<td>NCCN 逐字：<b>「modifications to treatment … <u>should not be made solely on the basis of ' +
      'HIV status</u>」</b><br>' +
      'ASCRS 同意但補充：<b>CD4 &lt; 200 者毒性顯著較高</b>；' +
      '<b>已有 HIV／AIDS 相關併發症者可能需要減量</b>。</td></tr>' +
      '</table>');
  }

  function week26Reference() {
    return fold('<b>❗治療後什麼時候判定完全緩解 —— 這一題答錯會讓病人白挨一次 APR</b>',
      '<table>' +
      '<tr><td><b>ACT II 的原始數字</b></td>' +
      '<td>逐字：<b>「<u>151 (72%) of the 209 patients</u> who had not had a CR at assessment 1 had a ' +
      'CR by assessment 3」</b>；作者的結論是<b>「the optimum time … is <u>26 weeks from starting ' +
      'chemoradiotherapy</u>」</b>。<br>' +
      'ESMO 2021 直接收為建議：<b>「The optimum timepoint to assess tumour response after CRT is ' +
      '<u>26 weeks</u> <u>[II, B]</u>」</b>。</td></tr>' +
      '<tr><td>❗<b>三個常見的抄錯</b></td>' +
      '<td><b>① 起算點是「化放療<u>開始</u>」不是「結束」</b>。' +
      'ACT II 的療程中位 38 天，兩者差約 5–6 週。' +
      '<b>NCCN 改用另一種講法：「療程<u>結束後</u>最多觀察 6 個月、每 3 個月再評估」</b> —— ' +
      '<b>兩種講法不等價，引用時要講明是哪一種。</b><br>' +
      '<b>② 這是 post-hoc 分析，不是「證實」</b>。評估時點未經隨機分派，' +
      '作者用的字是 <b>「Our data <u>suggests</u>」「it <u>seems</u> safe」「<u>prospective data are ' +
      'required</u>」</b>。<br>' +
      '<b>③ 試驗<u>沒有</u>觀察到任何一例「因為太早判定而白挨 APR」</b> —— ' +
      '原文是假設語氣的「the earlier assessment <u>could lead to</u> some patients having ' +
      'unnecessary surgery」。</td></tr>' +
      '<tr><td>❗<b>可以等的只有<br>正在退縮的病灶</b></td>' +
      '<td>原文同時要求<b>「治療結束起就密切追蹤，以便對<u>進行性疾病</u>及時安排挽救手術」</b>。<br>' +
      '<b>「26 週」不是「26 週前都不用看」</b> —— ' +
      '<b>切片證實疾病<u>進展</u>時仍應立即安排救援手術。</b></td></tr>' +
      '<tr><td>❗<b>ASCRS 這一句不可引</b></td>' +
      '<td>ASCRS 2018 把這個數字抄錯了：它寫<b>「<u>29%</u> of patients who did not demonstrate a ' +
      'complete remission at 11 weeks had achieved a complete response by 26 weeks」</b>，' +
      '<b>而原文與 NCCN 都是 72%（151/209）。</b></td></tr>' +
      '</table>');
  }

  function nhiReference() {
    return fold('<b>❗台灣：肛門癌沒有任何一張藥證，也沒有任何一條健保條文</b>（查詢日 2026-09-13）',
      '<table>' +
      '<tr><td><b>怎麼查的</b></td>' +
      '<td><b>534 條給付規定 PDF 全部抓下來（526 份成功抽文字），先做 NFKC 正規化再搜「肛」</b> —— ' +
      '<b>全庫只有 5 處命中，全部與癌無關</b>（不能用肛門栓劑者才給 NSAID 針、直腸外科人工肛門造口、' +
      'podophyllotoxin 生殖器疣含肛門附近、克隆氏症肛門周圍廔管）。<br>' +
      '<b>再抓整份 410 頁《藥品給付規定》（115.4.23）交叉驗證，命中處相同。' +
      '英文 anal cancer／anal canal 各 0 筆。</b><br>' +
      '<b>食藥署許可證資料集 36 <u>全庫（含已註銷）</u>搜「肛門癌」「肛管癌」「anal cancer」' +
      '「肛門鱗狀」→ 全部 0 筆。</b></td></tr>' +
      '<tr><td>❗<b>mitomycin</b></td>' +
      '<td><b>台灣現行只剩一張藥證</b>：衛部藥輸字第028315號 密多邁杏凍晶注射劑（有效至 2027/05/26，未註銷）。<br>' +
      '<b>適應症逐字：「胃癌、膀胱癌（灌注使用）、肺癌、肉瘤、白血病等症狀之緩解。」</b> —— ' +
      '<b>不含肛門癌。</b>（其餘 11 筆 mitomycin 全部已註銷。）<br>' +
      '<b>健保端沒有專屬條文</b>（欄位 druG_UFILE_NAME_LIST = X），' +
      '<b>所以是「沒有條文可套」而不是「條文不給」。</b></td></tr>' +
      '<tr><td>❗<b>carboplatin</b></td>' +
      '<td><b>三張現效藥證的適應症就只有「卵巢癌。」四個字</b> —— ' +
      '<b>肛門癌用 carboplatin ＋ paclitaxel 是條文外加仿單外<u>雙重</u>超適應症。</b></td></tr>' +
      '<tr><td>❗<b>retifanlimab</b></td>' +
      '<td><b>台灣藥證與健保皆 0 筆</b> —— ' +
      '<b>而它正是國際上轉移性肛門癌第一線的新標準（POD1UM-303）。' +
      '這一格在台灣完全沒有路。</b></td></tr>' +
      '<tr><td>❗<b>免疫治療</b></td>' +
      '<td><b>健保 9.69 的泛癌別 MSI-H／dMMR 只給「大腸直腸癌」一項</b>；' +
      '<b>pembrolizumab 藥證裡的「泛實體腫瘤 MSI-H」與「TMB-H ≥ 10 mut/Mb」兩項健保都沒有。</b></td></tr>' +
      '<tr><td><b>實務上的意義</b></td>' +
      '<td><b>肛門癌在台灣的標準治療（5-FU ＋ mitomycin ＋ 放療）從藥證到健保條文都沒有立足點。</b>' +
      '<b>唯一的一般性入口是《全民健康保險藥物給付項目及支付標準》第 12 條第 1 項第 4 款的' +
      '「特殊病例個案事前審查」</b>（第 63 條要 7 份文件、第 64 條保險人三週內核定）。<br>' +
      '<b>放療端則不受此限</b> —— 放射治療走診療項目，不走藥品給付規定。</td></tr>' +
      '</table>');
  }

  function stagingReference() {
    return fold('<b>AJCC v9 改了什麼</b>（2022 發表，<b>2023-01-01 起強制使用</b>）',
      '<table>' +
      '<tr><td><b>為什麼要改</b></td>' +
      '<td><b>第 8 版有一個分期悖論：stage IIB 的 5 年存活 63.7%，反而<u>低於</u> IIIA 的 73.0%</b>' +
      '（NCDB 24,328 例）。</td></tr>' +
      '<tr><td><b>v9 的四項改變</b></td>' +
      '<td>· <b>IIB → T1–T2 N1 M0</b><br>· <b>IIIA → T3 N0–N1 M0</b><br>' +
      '· <b>IIIC → T4 N1 M0</b><br>· <b>刪除 stage 0</b><br>' +
      '❗<b>T／N 定義唯一的改動是 obturator nodes 納入 N1a。</b></td></tr>' +
      '<tr><td>❗<b>引用的坑</b></td>' +
      '<td><b>CA Cancer J Clin 的那篇摘要只列了三項改變（漏掉 IIIC）</b> —— ' +
      '<b>要用 Ann Surg Oncol 的 editorial 版本（PMID 38735904）。</b></td></tr>' +
      '<tr><td>❗<b>ACPGBI 2017 的<br>分期不要用</b></td>' +
      '<td><b>它仍用 AJCC 第 7 版，已經過期兩代。</b>' +
      '<b>該指引的化放療、照野與 treatment gap 建議仍可用，但分期一律不要引它。</b></td></tr>' +
      '<tr><td>❗<b>分期與治療要分開</b></td>' +
      '<td><b>AJCC v9「Anus」章節逐字寫「applies to <u>all carcinomas</u> originating in the anal ' +
      'canal」</b> —— <b>連腺癌也用這一套分期</b>；<b>但治療上腺癌要走直腸癌指引。</b>' +
      '<b>「分期用哪一套」與「治療走哪一條」是兩件事，不要混。</b></td></tr>' +
      '</table>');
  }

  /* ---------- 版面 ---------- */
  function analPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">❗<b>這一頁最重要的一句話：肛管鱗狀細胞癌的治療主軸和隔壁的直腸癌是相反的。</b><br>' +
      '<b>直腸癌以手術切除為主軸；肛管鱗狀細胞癌的標準根治治療是<u>同步化放療</u>，' +
      '手術（APE／APR）只作為化放療後殘存或局部復發的<u>救援</u>治療。</b>' +
      '（但不要記成「完全相反」—— 直腸癌現在也有 TNT 與 watch-and-wait。）<br>' +
      '⚠<b>台大醫院沒有肛門癌診療指引</b> —— 大腸直腸癌診療指引 版次 21 全文的 anal 命中' +
      '<b>全部是「直腸癌侵犯肛管時的保肛手術與放療照野」，不是肛門鱗狀細胞癌這個疾病</b>。' +
      '<b>所以本頁全部是院外實證</b>：ESMO CPG 2021（PMID 34175386，帶 [LoE, Grade]）、' +
      'ASCRS 2018（PMID 29878949，最新版）、ACPGBI 2017（PMID 28632308）、' +
      'NCCN Anal Carcinoma（現行 v2.2026，但可公開取得的逐字條文為 <b>V2.2023</b>，本頁引用一律標版本）。<br>' +
      '❗<b>台灣端：肛門癌沒有任何一張藥證，也沒有任何一條健保給付條文</b>' +
      '（534 條給付規定全文檢索「肛」只有 5 處且全部與癌無關；食藥署全庫搜「肛門癌」0 筆）。' +
      '<b>連 mitomycin 的藥證適應症都不含肛門癌。</b>詳見下方橫列。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b></p>';
    h += '<div class="onc-path" id="anPath">';

    h += node0('an_n1', '1', '病灶的位置與病理型態？',
      opt('site', 'canal', '<b>肛管</b> anal canal 的鱗狀細胞癌', '主線：根治性同步化放療') +
      opt('site', 'margin', '<b>肛緣</b> anal margin 的鱗狀細胞癌', '早期可以只做局部切除，和肛管不同') +
      opt('site', 'nonscc', '病理<b>不是</b>鱗狀細胞癌（腺癌或黑色素瘤）', '❗不走這一頁'),
      stagingReference());

    h += node('an_n_cstage', '2', '有沒有遠端轉移？',
      opt('cstage', 'm0', '沒有遠端轉移（M0）', '→ 根治性同步化放療') +
      opt('cstage', 'm1', '有遠端轉移（M1）', '→ 全身治療'));
    h += recBox('an_r_crt', '建議處置 · 根治性同步化放療');
    h += node('an_n_resp', '3', '治療後的評估結果？（❗先看下方的 26 週那一格再判讀）',
      opt('resp', 'cr', '完全臨床緩解 cCR', '') +
      opt('resp', 'persist', '仍有殘存病灶，但正在退縮', '') +
      opt('resp', 'prog', '切片證實疾病進展，或後來局部復發', ''),
      week26Reference());
    h += recBox('an_r_resp', '建議處置 · 治療後怎麼接');
    h += fuBox('an_f_resp');
    h += node('an_n_line', '3', '轉移性疾病要決定第幾線？',
      opt('line', 'l1', '第一線', '') +
      opt('line', 'l2', '第一線之後', ''));
    h += recBox('an_r_meta', '建議處置 · 轉移性疾病');
    h += fuBox('an_f_meta');

    h += node('an_n_mt', '2', '肛緣病灶屬於哪一種？',
      opt('mt', 't1n0', 'T1 N0、高分化，且未侵犯括約肌', '這一格局部切除就是根治治療') +
      opt('mt', 'other', '超過 T1，或分化差，或已侵犯括約肌，或 N 陽性', ''));
    h += recBox('an_r_margin', '建議處置 · 肛緣癌');
    h += fuBox('an_f_margin');

    h += recBox('an_r_nonscc', '建議處置 · 不是鱗狀細胞癌的走哪裡');

    h += '<div class="flow-reset"><button class="back-btn" onclick="anReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="an_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="an_drugs"></div>';
    return h;
  }

  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function collapseAll() {
    var root = el('anPath');
    if (!root) return;
    root.querySelectorAll('.an-node').forEach(function (n) { if (n.id !== 'an_n1') n.classList.add('hidden'); });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
  }
  function liOf(t) {
    if (t.indexOf('@ev ') === 0) return '<li class="ev">' + t.slice(4) + '</li>';
    if (t.indexOf('<span class="rx-h">') === 0) return '<li class="hd">' + t + '</li>';
    return '<li>' + t + '</li>';
  }
  function fill(id, cls, title, lines, src, extra) {
    var e = el(id);
    if (!e) return;
    var lb = e.querySelector('.rec-label');
    var lt = lb ? lb.textContent : '建議處置';
    e.className = 'flow-rec ' + cls;
    e.innerHTML = '<div class="rec-label">' + lt + '</div><div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') + (src ? '<div class="rec-note">' + src + '</div>' : '');
  }
  function fu(id, html) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = '<div class="fu-h">接下來怎麼追蹤</div><ul class="fu-list">' + html + '</ul>';
  }

  var SRC_EXT = '❗台大醫院無肛門癌診療指引，本頁全部為院外實證：ESMO CPG 2021（Rao S et al. ' +
    'Ann Oncol 2021;32:1087-1100，PMID 34175386）、ASCRS 2018（PMID 29878949）、' +
    'ACPGBI 2017（PMID 28632308，⚠分期章節過期兩代不可引）、NCCN Anal Carcinoma V2.2023' +
    '（現行版本為 v2.2026，但其演算法頁未能公開取得）。台灣藥證與健保查詢日 2026-09-13。';

  /* ---------- 各分支 ---------- */
  function renderCrt() {
    var L = [];
    L.push(H('主建議', 'ESMO [I, A]；ASCRS 1A'));
    L.push('<b>根治性同步化放療：放療 ＋ <span class="rx">5-FU</span> ＋ ' +
      '<span class="rx">mitomycin</span></b>。' +
      'ESMO 逐字<b>「RT with concomitant 5-FU and MMC … standard of care <u>[I, A]</u>」</b>；' +
      'ASCRS 逐字<b>「The primary treatment for all squamous cell cancers of the anal canal … ' +
      'is CRT.（Strong recommendation based on high-quality evidence, <u>1A</u>）」</b>。');
    L.push('❗<b>手術不是第一線</b>：ESMO 逐字<b>「The role of surgery as a <u>salvage</u> treatment ' +
      'is accepted」</b>。<b>這是本頁與直腸癌最大的差別。</b>');
    L.push('<b><span class="rx">capecitabine</span> 可以取代輸注型 5-FU</b>（口服，省人工血管）。');
    L.push(H('❗四種可以一開始就做手術的例外', 'ESMO [IV, C]'));
    L.push('<b>下列情形可以考慮直接做腹會陰切除（APE）</b>：' + SUB([
      '<b>先前接受過骨盆放療，無法再放療</b>',
      '<b>病理是腺癌或腺鱗癌</b>（不是鱗狀細胞癌）',
      '<b>移植後使用免疫抑制劑</b>',
      '<b>病人拒絕化放療</b>']) +
      '<b>證據等級只有 [IV, C]，是少數情形，不是常規。</b>');
    L.push(H('要開的處方寫法', ''));
    L.push('❗<b>不要引 Nigro 1974 的原始劑量</b> —— 原文取不到' +
      '（期刊付費、PubMed 無摘要），<b>只有「30 Gy」這個數字有轉述來源，' +
      '5-FU 與 mitomycin 的 mg/m² 屬未查證</b>。');
    L.push('<b>要寫劑量請引有全文的試驗</b>：' + SUB([
      '<b>ACT II：放療 50.4 Gy／28 次；<span class="rx">5-FU</span> 1000 mg/m² d1–4 與 d29–32；' +
        '<span class="rx">mitomycin</span> 12 mg/m² d1</b>',
      '<b>RTOG 98-11：<span class="rx">mitomycin</span> 10 mg/m² d1 與 d29</b>']));
    L.push('❗<b>鼠蹊部照野一般要含進去</b>：ESMO 逐字<b>「should be included in the RT fields ' +
      '<u>in most cases, even in the absence of</u> clearly demonstrable involvement」</b>；' +
      'ACPGBI 的做法是<b>常規給所有 T2–T4，省略時復發率約 30%；只有小的 T1 可選擇性省略（grade B）</b>。');
    L.push('❗<b>HIV 陽性不改變治療</b>：NCCN 逐字<b>「modifications to treatment … <u>should not be ' +
      'made solely on the basis of HIV status</u>」</b>。<b>但 ASCRS 補充 CD4 &lt; 200 者毒性顯著較高，' +
      '已有 HIV／AIDS 相關併發症者可能需要減量。</b>');
    L.push(H('❗台灣端：這一整套在台灣沒有藥證也沒有健保條文', '查詢日 2026-09-13'));
    L.push('<b>肛門癌在台灣沒有任何一張藥證、也沒有任何一條健保給付條文</b>' +
      '（534 條給付規定全文檢索「肛」只有 5 處且全部與癌無關；食藥署全庫搜「肛門癌」0 筆）。');
    L.push('❗<b>連 <span class="rx">mitomycin</span> 都不行</b>：台灣現行只剩一張藥證，' +
      '<b>適應症逐字「胃癌、膀胱癌（灌注使用）、肺癌、肉瘤、白血病等症狀之緩解」—— 不含肛門癌</b>。' +
      '<b>健保端則是「沒有專屬條文可套」而不是「條文不給」。</b>' +
      '<b>唯一的一般性入口是支付標準第 12 條第 1 項第 4 款的特殊病例個案事前審查。</b>' +
      '<b>放療端不受此限（走診療項目）。</b>');
    fill('an_r_crt', 'rec-elective',
      '肛管鱗狀細胞癌、無遠端轉移<br>→ 根治性同步化放療（<b>不是手術</b>）',
      L, SRC_EXT, crtReference() + nhiReference() + week26Reference());
  }

  function renderResp() {
    var L = [], cls = 'rec-elective', title = '', fuHtml = '';
    L.push(H('❗判讀之前先確認時間點對不對', ''));
    L.push('<b>ACT II：第 11 週還沒達到完全緩解的 209 人裡，<u>有 151 人（72%）在第 26 週達到了</u></b>；' +
      '作者的結論是<b>「最佳評估時點是<u>自化放療開始</u>起算第 26 週」</b>，' +
      'ESMO 2021 收為建議 <b>[II, B]</b>。');
    L.push('❗<b>起算點是「開始」不是「結束」</b> —— ACT II 的療程中位 38 天，兩者差約 5–6 週。' +
      '<b>NCCN 用的是另一種講法：「療程<u>結束後</u>最多觀察 6 個月、每 3 個月再評估」。' +
      '兩種講法不等價。</b>');

    if (S.resp === 'cr') {
      cls = 'rec-nonop';
      title = '完全臨床緩解（cCR）<br>→ 不做手術，進入追蹤';
      L.push(H('主建議', ''));
      L.push('<b>達到完全緩解就不需要手術</b> —— <b>這就是化放療作為器官保留治療的目的，' +
        '多數病人可以免除永久性人工肛門。</b>');
      L.push('<b>接下來是定期的臨床與影像追蹤</b>，見下方追蹤區塊。');
      fuHtml = '<li><b>追蹤的重點是<u>局部</u>復發</b> —— 肛門癌的復發以局部為主，' +
        '<b>理學檢查與肛門指診（DRE）在追蹤中的地位很高。</b></li>' +
        '<li><b>鼠蹊部淋巴結要一併觸診</b>。</li>' +
        '<li>❗<b>局部復發仍然可以救</b> —— 救援性腹會陰切除（APE）是這個癌別' +
        '「治療失敗之後仍有根治機會」的關鍵，不要因為復發就直接轉安寧。</li>';
    } else if (S.resp === 'persist') {
      cls = 'rec-elective';
      title = '仍有殘存病灶，但正在退縮<br>→ ❗不要急著開刀，可以等到第 26 週';
      L.push(H('這一格就是 ACT II 要解決的問題', ''));
      L.push('<b>ACT II 的重點是：第 11 週看起來沒有完全緩解的人，有 <u>72%</u> 到第 26 週會達到。</b>' +
        '<b>太早判定失敗，會讓這些人白挨一次腹會陰切除與永久性人工肛門。</b>');
      L.push('❗<b>但三個限制要一起講</b>：' + SUB([
        '<b>這是 post-hoc 分析，評估時點未經隨機分派</b> —— ' +
          '作者用的字是「Our data <u>suggests</u>」「it <u>seems</u> safe」' +
          '「<u>prospective data are required</u>」，<b>不是「證實」</b>',
        '<b>試驗<u>沒有</u>觀察到任何一例真的白挨 APR</b> —— ' +
          '原文是假設語氣的「could lead to some patients having unnecessary surgery」',
        '❗<b>可以等的只有「<u>正在退縮</u>」的殘存病灶</b>']));
      L.push('❗<b>原文同時要求「治療結束起就密切追蹤，以便對<u>進行性疾病</u>及時安排挽救手術」</b> —— ' +
        '<b>「等到 26 週」不等於「26 週前都不用看」。</b>' +
        '<b>病灶只要不是在退縮，就要重新評估並考慮切片。</b>');
      L.push('<b>ASCRS 2018 這一句不可引用</b>：它把數字抄成「<b>29%</b>… had achieved a complete ' +
        'response by 26 weeks」，<b>而原文與 NCCN 都是 72%（151/209）</b>。');
      fuHtml = '<li><b>在等待期間要密切追蹤</b>：臨床評估與肛門指診，' +
        '<b>目的是及早發現「不是在退縮而是在進展」的病人。</b></li>' +
        '<li><b>到了評估時點仍未緩解、或期間出現進展 → 切片確認後安排救援手術。</b></li>';
    } else {
      cls = 'rec-urgent';
      title = '切片證實進展，或化放療後局部復發<br>→ 救援性腹會陰切除（APE）';
      L.push(H('主建議', 'ESMO'));
      L.push('<b>ESMO 逐字：「The role of surgery as a <u>salvage</u> treatment is accepted」</b> —— ' +
        '<b>這就是手術在肛門癌唯一的根治性角色。</b>');
      L.push('❗<b>疾病<u>進展</u>不適用「等到 26 週」那一條</b> —— ' +
        'ACT II 原文明確要求對進行性疾病<b>及時</b>安排挽救手術。' +
        '<b>可以等的只有正在退縮的殘存病灶。</b>');
      L.push('<b>開刀之前一定要切片確認</b> —— 化放療後的纖維化與殘存腫瘤在影像上難以區分。');
      L.push('<b>救援手術通常意味著永久性人工肛門</b>，術前諮商要講清楚。');
      L.push(EV('<b>NCCN 患者版 2026 提到兩個這一格的延伸情境</b>：' +
        '<b>APR 之前可考慮免疫治療</b>，以及<b>鼠蹊部復發有兩個選項</b>。' +
        '❗<b>這些來自患者版小冊，不是演算法頁（ANAL-1～8 未能公開取得），引用時要標明。</b>'));
      fuHtml = '<li><b>救援手術後的追蹤同樣以局部與鼠蹊部為重點。</b></li>' +
        '<li><b>若救援手術也無法根治，轉入轉移性疾病的全身治療</b> —— ' +
        '請回步驟 2 選「有遠端轉移」。</li>';
    }
    fill('an_r_resp', cls, title, L, SRC_EXT + '｜ACT II post-hoc（PMID 28209296）；ESMO [II, B]。',
      week26Reference() + crtReference() + nhiReference());
    if (fuHtml) fu('an_f_resp', fuHtml);
  }

  function renderMeta() {
    var L = [], cls = 'rec-urgent', title = '';
    if (S.line === 'l1') {
      title = '轉移性肛門癌 · 第一線<br>→ 國際標準已經換人了，但台灣拿不到';
      L.push(H('❗第一線標準在 2025 年換了', 'POD1UM-303'));
      L.push('<b>POD1UM-303</b>（Lancet 2025，PMID 40517007）：' +
        '<b><span class="rx">carboplatin</span> ＋ <span class="rx">paclitaxel</span> ' +
        '＋ retifanlimab</b>，<b>無惡化存活 9.3 對 7.4 個月，HR 0.63</b>。');
      L.push('<b>NCCN 患者版 2026 的第一線首選已經是 carboplatin ＋ paclitaxel ＋ retifanlimab</b>，' +
        '並列了七個「假定等效」的 PD-1 抑制劑。');
      L.push('❗<b>但 retifanlimab 在台灣藥證與健保皆 0 筆</b> —— <b>這一格在台灣完全沒有路。</b>');
      L.push(H('退回到上一代標準', 'InterAAct'));
      L.push('<b><span class="rx">carboplatin</span> ＋ <span class="rx">paclitaxel</span></b>' +
        '（InterAAct，PMID 32530769）。');
      L.push('❗<b>InterAAct 贏的不是反應率</b>：<b>兩臂的客觀反應率幾乎一樣（57% 對 59%）</b>，' +
        '<b>贏的是毒性（嚴重不良事件 62% 對 36%）與整體存活（12.3 對 20 個月，HR 2.00）</b> —— ' +
        '<b>較差的是 cisplatin ＋ 5-FU 那一臂。</b>' +
        '<b>所以選 carboplatin ＋ paclitaxel 的理由是耐受性，不是有效性。</b>');
      L.push('❗<b>台灣端更糟</b>：<b>carboplatin 的三張現效藥證適應症就只有「卵巢癌。」四個字</b>，' +
        '<b>用在肛門癌是條文外加仿單外<u>雙重</u>超適應症</b>；' +
        '<b><span class="rx">paclitaxel</span> 的健保 9.5.1 也沒有寫肛門癌。</b>');
    } else {
      title = '轉移性肛門癌 · 第一線之後<br>→ 免疫治療，但在台灣要自費';
      L.push(H('可用的證據', ''));
      L.push('<b><span class="rx">nivolumab</span></b>（NCI9673）與 ' +
        '<b><span class="rx">pembrolizumab</span></b>（KEYNOTE-158 的肛門癌世代）。');
      L.push('❗<b>KEYNOTE-158 有兩篇，很容易混成一篇</b>：' +
        '<b>肛門癌世代是 PMID 35114169，客觀反應率 11%</b>；' +
        '<b>另一篇是 MSI-H 非大腸癌的泛癌別世代</b>。' +
        '<b>NCCN V2.2023 把兩篇連著寫，抄的時候要看清楚。</b>');
      L.push('<b>反應率不高（約 11%），但這一格本來就沒有更好的選擇。</b>');
      L.push(H('❗台灣端', '查詢日 2026-09-13'));
      L.push('<b>健保 9.69 沒有任何一條寫肛門癌</b>；' +
        '<b>而 9.69 的泛癌別 MSI-H／dMMR 只給「大腸直腸癌」一項</b>。' +
        '<b>pembrolizumab 藥證裡的「泛實體腫瘤 MSI-H」與「TMB-H ≥ 10 mut/Mb」兩項健保都沒有。</b>');
      L.push('<b>所以免疫治療在台灣的肛門癌是全額自費，或走個案事前審查。</b>');
      L.push(EV('<b>HPV 相關的背景</b>：肛門癌絕大多數與 HPV 有關，' +
        '<b>ANCHOR 試驗</b>（PMID 35704479）證實在 ≥ 35 歲、HIV 陽性、切片證實高度鱗狀上皮內病變' +
        '（HSIL）者，<b>治療 HSIL 可使進展為肛門癌的機率下降 57%</b>' +
        '（173 對 402 每 10 萬人年，P = 0.03）。<b>這是預防面的證據，不是這一格的治療。</b>'));
    }
    fill('an_r_meta', cls, title, L,
      SRC_EXT + '｜POD1UM-303（PMID 40517007）、InterAAct（PMID 32530769）、' +
      'KEYNOTE-158 肛門癌世代（PMID 35114169）、ANCHOR（PMID 35704479）。' +
      '❗<b>NICE 尚未發布 retifanlimab 的技術評估（GID-TA11625，預計 2026-12-16）。</b>',
      nhiReference() + crtReference());
    fu('an_f_meta', '<li><b>台灣這一格的實務問題是「藥拿不到」而不是「不知道用什麼」</b> —— ' +
      '事前規劃自費或個案事前審查的時間，比選藥本身更花時間。</li>' +
      '<li><b>支持性照護與症狀控制在這一格的比重很高</b>（局部疼痛、出血、排便問題）。</li>');
  }

  function renderMargin() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗肛緣和肛管是兩件事', ''));
    L.push('<b>ESMO 逐字：「Local excision of early-stage cancers in the <u>anal canal</u> is ' +
      '<u>contraindicated</u>」</b> —— <b>肛管的早期癌<u>禁止</u>只做局部切除。</b>' +
      '<b>但肛緣（anal margin）不同，早期可以局部切除根治。</b>' +
      '<b>所以第一步一定要先分清楚病灶在哪裡。</b>');
    if (S.mt === 't1n0') {
      cls = 'rec-nonop';
      title = '肛緣癌 · T1 N0、高分化、未侵犯括約肌<br>→ 局部切除就是根治治療';
      L.push(H('主建議', ''));
      L.push('<b>單純局部切除（local excision）即可作為根治治療</b>，' +
        '<b>不需要化放療、也不需要腹會陰切除。</b>');
      L.push('❗<b>切緣的門檻三家指引不同，要先確認你在用哪一套</b>：' + SUB([
        '<b>ASCRS 與 NCCN：1 cm</b>',
        '<b>ESMO：&gt; 1 mm</b>']) +
        '<b>兩者差了一個數量級 —— 病理報告寫「切緣 3 mm」時，' +
        '照 ESMO 是夠的、照 ASCRS／NCCN 是不夠的。</b>');
      L.push('<b>四個條件要同時成立</b>：<b>T1、N0、高分化、未侵犯括約肌。</b>' +
        '<b>任一項不成立就要走下面那一條。</b>');
      L.push('<b>切緣不足時的處理</b>：可考慮再切除，或改走同步化放療。');
    } else {
      title = '肛緣癌 · 超過 T1，或分化差，或侵犯括約肌，或 N 陽性<br>→ 比照肛管，走同步化放療';
      L.push(H('主建議', ''));
      L.push('<b>不符合局部切除條件的肛緣癌，處置比照肛管鱗狀細胞癌</b> —— ' +
        '<b>根治性同步化放療（放療 ＋ <span class="rx">5-FU</span> ＋ ' +
        '<span class="rx">mitomycin</span>），手術保留為救援。</b>');
      L.push('<b>處方、照野與台灣的用藥障礙，見下方可展開的橫列</b>（與肛管那一條相同）。');
      L.push('❗<b>鼠蹊部照野在這一格同樣要考慮</b> —— ' +
        'ACPGBI 的做法是常規給所有 T2–T4。');
      L.push('<b>治療後的評估一樣適用「26 週」那一條</b> —— ' +
        '請回步驟 1 選「肛管」以查看完整的評估與救援路徑，或直接看下方橫列。');
    }
    fill('an_r_margin', cls, title, L,
      SRC_EXT + '｜切緣門檻：ASCRS 2018 與 NCCN V2.2023 為 1 cm，ESMO 2021 為 &gt; 1 mm。',
      crtReference() + week26Reference() + nhiReference());
    fu('an_f_margin', '<li><b>肛緣癌局部切除後的追蹤重點是局部復發與鼠蹊部淋巴結。</b></li>' +
      '<li><b>切緣不足或復發時，仍可改走同步化放療</b> —— ' +
      '<b>局部切除失敗不等於要直接做腹會陰切除。</b></li>');
  }

  function renderNonScc() {
    fill('an_r_nonscc', 'rec-nonop',
      '病理不是鱗狀細胞癌<br>→ ❗腺癌走直腸癌、黑色素瘤走黑色素瘤，都不走這一頁',
      [H('主建議', 'NCCN 逐字'),
      '<b>「anal adenocarcinoma and anal melanoma are managed according to the <u>NCCN Guidelines ' +
        'for Rectal Cancer</u> and the <u>NCCN Guidelines for Melanoma</u>, respectively」</b>',
      '<b>ACPGBI 也明講：「anal cancer refers <u>specifically to squamous cell carcinoma</u>」</b> —— ' +
        '<b>這個癌別的名字本身就只指鱗狀細胞癌。</b>',
      H('❗但分期是另一回事，不要一起搬走', ''),
      '<b>AJCC v9 的「Anus」章節逐字寫「applies to <u>all carcinomas</u> originating in the anal ' +
        'canal」</b> —— <b>連腺癌也用這一套分期。</b>',
      '❗<b>所以「分期用哪一套」與「治療走哪一條」是兩件事</b>：' +
        '<b>肛管腺癌的<u>分期</u>用肛門那一套，<u>治療</u>走直腸癌那一套。</b>' +
        '<b>兩者混用是這個癌別最常見的錯誤之一。</b>',
      H('順帶一提：這也是可以直接開刀的例外之一', 'ESMO [IV, C]'),
      '<b>ESMO 列的四種可以一開始就做腹會陰切除的情形裡，' +
        '其中一項就是「病理是<u>腺癌或腺鱗癌</u>」。</b>' +
        '<b>另三項是：先前接受過骨盆放療、移植後免疫抑制、病人拒絕化放療。</b>',
      '<b>請改看本站「大腸直腸癌」或「黑色素瘤」分頁。</b>'],
      SRC_EXT + '｜AJCC v9 Anus 章節適用範圍；ESMO 2021 [IV, C]。',
      stagingReference());
  }

  /* ---------- 基因段 ---------- */
  function geneBlock() {
    var L = [];
    L.push(H('❗肛門癌的答案和多數實體癌相反：要驗的不是腫瘤基因，是病毒與免疫狀態', ''));
    L.push('<b>肛門鱗狀細胞癌絕大多數與 <u>HPV</u> 有關</b>，' +
      '<b>ESMO 的診斷流程（Figure 1）把「Consider: <u>HIV test</u> / <u>p16-HPV</u> / PET-CT」' +
      '列在標準工作流程的最後一格。</b>' +
      '<b>這兩項會改變的是照護安排與共病處理，不是選藥。</b>');
    L.push(H('HIV 檢測：驗到會改變什麼', ''));
    L.push('❗<b>不改變治療決定</b>：NCCN 逐字<b>「modifications to treatment … <u>should not be made ' +
      'solely on the basis of HIV status</u>」</b>。');
    L.push('<b>但會改變兩件事</b>：' + SUB([
      '<b>CD4 &lt; 200 者化放療毒性顯著較高</b>（ASCRS），要預期較多支持性照護',
      '<b>已有 HIV／AIDS 相關併發症者可能需要減量</b>（ASCRS）']));
    L.push('<b>而且會帶出一個預防面的行動</b>：' +
      '<b>ANCHOR 試驗</b>（PMID 35704479）證實 ≥ 35 歲、HIV 陽性、切片證實高度鱗狀上皮內病變' +
      '（HSIL）者，<b>治療 HSIL 可使進展為肛門癌的機率下降 <u>57%</u></b>' +
      '（173 對 402 每 10 萬人年，P = 0.03）。' +
      '<b>這是這一頁唯一有隨機證據的「預防」動作。</b>');
    L.push(H('❗MSI-H／dMMR：驗得到，但台灣用不到', ''));
    L.push('<b>免疫治療在後線是有角色的</b>（KEYNOTE-158 肛門癌世代 PMID 35114169，' +
      '客觀反應率 11%；NCI9673 的 ' + NR('nivolumab') + '），' +
      '<b>但台灣健保 9.69 的泛癌別 MSI-H／dMMR <u>只給「大腸直腸癌」一項</u></b>，' +
      '<b>pembrolizumab 藥證裡的「泛實體腫瘤 MSI-H」與「TMB-H ≥ 10 mut/Mb」兩項健保都沒有。</b>');
    L.push('<b>所以驗之前要先講清楚：驗出來也沒有健保的路。</b>');
    L.push(H('沒有「必驗的驅動基因」', ''));
    L.push('<b>這個癌別沒有像肺癌、膽道癌那樣「驗到就能換一條標靶路」的驅動基因</b> —— ' +
      '<b>三份指引都沒有把分子檢測列為治療前的必要步驟。</b>' +
      '<b>要驗的是 p16／HPV（診斷與預後）與 HIV（共病與預防），不是腫瘤基因套組。</b>');
    return '<div class="bc-gene-h">要不要驗基因？這一頁要驗的是 HPV 與 HIV，不是腫瘤基因' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ---------- 藥卡 ---------- */
  var drugSig = '';
  function cardId(c) { return 'an-drug-' + c.replace(/ /g, '_'); }
  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }
  function renderDrugCards() {
    var box = el('an_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('anPath');
    if (root) {
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }
    var g = el('an_gene');
    if (g) { g.classList.toggle('hidden', !txt.trim()); if (txt.trim() && !g.innerHTML) g.innerHTML = geneBlock(); }
    var picked = [];
    AN_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' +
        (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });
    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;
    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var n = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML = '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡' +
      '<span class="bc-drugbox-n">' + picked.length + ' 種藥 · ' + n + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">❗<b>肛門癌在台灣沒有任何一張藥證、也沒有任何一條健保給付條文</b>' +
      '（534 條給付規定全文檢索「肛」只有 5 處且全部與癌無關；食藥署全庫搜「肛門癌」0 筆）。' +
      '<b>下面每一張卡的徽章都標明了該藥「用於肛門癌時」的狀態 —— 全部是仿單外或條文外。</b>' +
      '<b>唯一的一般性入口是支付標準第 12 條第 1 項第 4 款的特殊病例個案事前審查；' +
      '放療端不受此限。</b></div>' +
      picked.map(function (d) {
        return d.cards.map(function (c) { return drugCardHTML(c, d.label || d.key, d.flag); }).join('');
      }).join('');
    if (window.DrugCard && window.requestIdleCallback) {
      var pids = {};
      picked.forEach(function (d) { d.cards.forEach(function (c) { pids[c[0]] = 1; }); });
      window.requestIdleCallback(function () {
        Object.keys(pids).forEach(function (pid) { window.DrugCard.loadPid(pid).catch(function () {}); });
      });
    }
  }

  /* ---------- render 與互動 ---------- */
  function render() {
    collapseAll();
    if (S.site === 'canal') {
      show('an_n_cstage', true);
      if (S.cstage === 'm0') {
        renderCrt();
        show('an_n_resp', true);
        if (S.resp) renderResp();
      } else if (S.cstage === 'm1') {
        show('an_n_line', true);
        if (S.line) renderMeta();
      }
    } else if (S.site === 'margin') {
      show('an_n_mt', true);
      if (S.mt) renderMargin();
    } else if (S.site === 'nonscc') {
      renderNonScc();
    }
    renderDrugCards();
  }
  var SEL_GROUPS = ['an_n1', 'an_n_cstage', 'an_n_resp', 'an_n_line', 'an_n_mt'];
  var DOWNSTREAM = { site: ['cstage', 'resp', 'line', 'mt'], cstage: ['resp', 'line'] };
  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function anPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) { down.forEach(function (k) { S[k] = null; }); clearSelectionMarks(); }
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }
  function reapplyMarks() {
    [['an_n1', 'site'], ['an_n_cstage', 'cstage'], ['an_n_resp', 'resp'],
     ['an_n_line', 'line'], ['an_n_mt', 'mt']].forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /anPick\('([a-z0-9_]+)','([a-z0-9_]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }
  function anReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    render();
  }
  function initAnalPathway() { anReset(); }

  global.analPathwayHTML = analPathwayHTML;
  global.initAnalPathway = initAnalPathway;
  global.anPick = anPick;
  global.anReset = anReset;
})(window);
