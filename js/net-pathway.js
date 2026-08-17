/* ============================================================
   神經內分泌瘤治療互動決策流程 Neuroendocrine Tumor Treatment Pathway
   ------------------------------------------------------------
   2026-08-17 打掉重做。舊版（367 行）只有三個分支（胰臟／直腸／其他），
   「其他部位」是一張跨部位的大卡，胃／十二指腸／小腸各自的手術決策完全沒有。

   ⚠ 舊版把台大 NET-1 的結構做錯了（已 render PNG 逐格核對 p19 決策圖）：
     舊版「其他所有直腸腫瘤」的第一個分支是腫瘤大小。
     **實際上第一個分支是 T 分期**：
       T1    ──────────────→ 直接經肛門或內視鏡切除（不看大小、不做延伸評估）
       T2–T4 → 延伸評估（大腸鏡／多相位 CT 或 MRI／視需要 SSTR-PET、胸部 CT、生化）
                 ├─ < 2 cm            → 經肛門或內視鏡切除
                 └─ > 2 cm 或淋巴結陽性 → 低前位切除／腹會陰切除／（選擇性）化放療
     **大小分岔與延伸評估只屬於 T2–T4。**

   ⚠ 台大來源的界線（重要，本頁逐處標明）：
     ① **胰臟 NET**：台大胰臟神經內分泌腫瘤診療指引 版次 02
        （文件編號 50710-2-000048，2026/06/16 第 87 次癌委會通過，55 頁；Source: NCCN v3.2025）
        → 完整流程委派 pnet-pathway.js（PanNET-1～13、WDG3、PDNEC-1）
     ② **直腸 NET**：台大大腸直腸癌診療指引 版次 21（50710-2-000007，2026/06/16）NET-1（p19）
     ③ **跨部位通則**：上述胰臟 NET 指引裡有一整批 **NE-x 章節其實是跨部位的**，
        不是只講胰臟 —— NE-D 影像、NE-E 生化、NE-F 手術、**NE-H 1 OF 9 胃腸道 NET 全身治療**、
        NE-J PRRT、NE-K 肝臟導向、NE-L 荷爾蒙症狀、PDNEC-1「**Extrapulmonary**」。
        本頁引用這些時一律註明「收錄於台大胰臟 NET 指引這份文件」。
     ④ **胃／十二指腸／小腸／結腸各部位的手術決策，台大文件沒有** → 院外實證：
        ENETS 2023 胃十二指腸（PMID 37401795）、ENETS 2024 小腸（PMID 38977327，取代 2023 版）、
        ENETS 2023 結腸直腸（PMID 37345509）、ENETS 2022 類癌症候群（PMID 35613326）。
     ⑤ **闌尾 NET** 已在闌尾癌分頁做完（ASCRS 2025 ＋ ENETS 2023 aNET），本頁指過去不重寫。

   健保與藥證查詢日：**2026-08-17**。三個關鍵事實：
     · **PRRT（Lutathera 鎦癌平，衛部藥輸字第 R00104 號，有效至 2031/04/07）有台灣藥證，
        但健保完全不給付**；而且**藥證限「G1 及 G2」且「SSA 治療無效」**，
        不涵蓋第一線 PRRT（NETTER-2）與 NET G3。
     · **cabozantinib 有藥證有健保，但條文只寫腎細胞癌與甲狀腺癌，NET 沒有入口**
        —— 而台大 NE-H 已把它列為胃腸道 NET 的 Preferred。
     · **temozolomide 健保條文只寫腦瘤 → CAPTEM 用於 NET 是藥證外加健保外。**
     · **telotristat 台灣完全沒有藥證**（食藥署許可證資料集 0 筆）。

   ── 遵守的六條版面規則見 skill: pathway-ux-rules.md ──
   pnet-pathway.js 須於本檔之前載入。本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  /* ==========================================================
     0. 狀態
     ========================================================== */
  var S = {};
  var KEYS = [
    'site',    // panc | gastric | duod | si | rectal | appendix | adv | nec | sym
    'gtype',   // 胃 NET 型別：t1 | t2 | t3
    'g1size',  // 胃 type I：lt1 | mid | gt2
    'g3size',  // 胃 type III：lt1 | mid | gt2
    'dfeat',   // 十二指腸：small | mid | surg | amp
    'sistate', // 小腸：loc | mf | meta
    'rmode',   // 直腸：inc | other | r1
    'margin',  // 直腸偶發瘤切緣：neg | indet
    'grade',   // 切緣不確定時分級：g1 | g2
    'rt',      // 直腸其他腫瘤 T 分期：t1 | t24
    'rsize',   // T2–T4 的大小／淋巴結：lt2 | gt2
    'r1size',  // R1 再切除：gt2 | mid | lt1
    'line',    // 晚期線別：l1 | l2 | l3
    'sstr',    // SSTR 影像：pos | neg
    'ki67',    // 第一線的增生指數：lo | hi
    'syn'      // 功能性症候群：cs | insulin | gastrin | vip | glucagon
  ];
  KEYS.forEach(function (k) { S[k] = null; });
  var pancInjected = false;

  /* ==========================================================
     0b. 學名 → 台大藥卡（2026-08-17 對 data/drugs/ 逐碼實跑核對）
     ⚠ 徽章寫的是「這個藥用於 NET 時在台灣的藥證與健保狀態」。
     ⚠ 只在「用不到／沒有入口」的敘述裡出現的藥（sunitinib 於腸道 NET、
       telotristat）一律用 NR() 包住，不列卡。
     ========================================================== */
  var NT_DRUGS = [
    { key: 'octreotide',
      cards: [['12', 'SAN1LD27', 'Sandostatin LAR 善得定長效緩釋注射劑 20 mg', 'octreotide acetate'],
              ['12', 'SAN1LD15', 'Sandostatin 善得定注射液 0.1 mg/mL', 'octreotide acetate']],
      flag: '健保 5.4.4.3「晚期間腸 NET」；需事前審查' },
    { key: 'lanreotide',
      cards: [['12', 'SO 1LD27', 'Somatuline Autogel 舒得寧長效型注射凝膠劑', 'lanreotide acetate']],
      flag: '健保 5.4.6.3「胃、腸、胰 GEP-NET」；需事前審查' },
    { key: 'everolimus', cards: [['17', 'AFI4CEC1', 'Afinitor 癌伏妥錠 5 mg', 'everolimus']],
      flag: '健保 9.36.1.3 限胃腸道／肺部來源之非功能性 NET' },
    { key: 'temozolomide', cards: [['17', 'TEM4CA37', 'Temodal 帝盟多膠囊 100 mg', 'temozolomide']],
      flag: '❗健保 9.25 只寫腦瘤，NET 用屬藥證外' },
    { key: 'capecitabine', cards: [['17', 'XEL4CB24', 'Xeloda 截瘤達錠 500 mg']],
      flag: '❗NET 無藥證亦無健保' },
    { key: '5-FU', re: '5-FU|fluorouracil',
      cards: [['17', '5FU1CB41', '5-FU 好復注射液 1000 mg/20 mL', 'fluorouracil']],
      flag: '許可證寫「消化器官癌」，NET 未列名' },
    { key: 'leucovorin',
      cards: [['11', 'FO 1QB04', 'Folina 芙琳亞注射液 100 mg/10 mL', 'leucovorin calcium'],
              ['11', 'COV1QB04', 'Covorin 克廢喦注射液 50 mg/5 mL', 'leucovorin calcium']] },
    { key: 'oxaliplatin', cards: [['17', 'OXA1CA14', 'Oxalip 歐力普注射劑 50 mg/10 mL']],
      flag: '❗NET 無藥證亦無健保' },
    { key: 'cisplatin', cards: [['17', 'KEO1CA10', 'Kemoplat 克莫抗癌注射劑 50 mg/50 mL']] },
    { key: 'carboplatin', cards: [['17', 'KEM1CA32', 'Kemocarb 注射劑 150 mg/15 mL', 'carboplatin']] },
    { key: 'etoposide',
      cards: [['17', 'FYT1CC11', 'Fytosid 癌妥滅靜脈注射液 100 mg/5 mL', 'etoposide'],
              ['17', 'VEG4CC11', 'Vepesid 滅必治軟膠囊 50 mg', 'etoposide']] },
    { key: 'diazoxide', cards: [['27', 'PRO5DB99', 'Diazoxide（台大處方集無正式中文品名）', 'diazoxide']],
      flag: 'insulinoma 穩定血糖用' }
  ];

  /* ==========================================================
     1. 版面小工具
     ========================================================== */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="ntPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function node(id, num, q, opts, extra) {
    return '<div class="nt-node hidden" id="' + id + '">' +
      '<div class="flow-connector">↓</div>' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      (opts ? '<div class="flow-opts">' + opts + '</div>' : '') + (extra || '') + '</div></div>';
  }
  function node0(id, num, q, opts) {
    return '<div class="nt-node" id="' + id + '">' +
      '<div class="flow-step"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + opts + '</div></div></div>';
  }
  function recBox(id, label) {
    return '<div class="flow-rec rec-idle hidden" id="' + id + '">' +
      '<div class="rec-label">' + label + '</div><div class="rec-title"></div></div>';
  }
  function fuBox(id) { return '<div class="flow-fu hidden" id="' + id + '"></div>'; }

  function H(title, src) {
    return '<span class="rx-h">' + title + '</span>' + (src ? '　<span class="rx-sub">' + src + '</span>' : '');
  }
  function EV(t) { return '@ev ' + t; }
  function SUB(items) { return '<ul class="rec-sub"><li>' + items.join('</li><li>') + '</li></ul>'; }
  function NR(t) { return '<span class="no-rx">' + t + '</span>'; }
  function fold(summary, inner) {
    return '<details class="kps-details"><summary>' + summary + ' ▸</summary>' + inner + '</details>';
  }
  function more() {
    var parts = [].slice.call(arguments).filter(Boolean);
    if (!parts.length) return '';
    return '<ul class="rec-detail rec-more"><li>' + parts.join('</li><li>') + '</li></ul>';
  }

  var cat2A = '台大 NET-1 通則：All recommendations are category 2A unless otherwise indicated.';

  /* ==========================================================
     2. 共用參考區塊（同一件事只寫一次，其他地方指過來）
     ========================================================== */

  /* 2a. 分化與分級 —— 這一格弄錯會整條路徑走錯 */
  function gradeReference() {
    return fold('<b>❗先確認是 NET 還是 NEC</b>（WHO 2019／消化系統腫瘤分類第 5 版）',
      '<table>' +
      '<tr><td colspan="2"><b>分期與分級是兩條互相獨立的軸。</b>分級只看 <b>Ki-67</b> 與' +
      '<b>有絲分裂數</b>，與 T／N／M 完全無關，<b>兩者取較高者為準</b>。</td></tr>' +
      '<tr><td><b>G1</b></td><td>有絲分裂 &lt; 2/2mm² <b>且</b> Ki-67 &lt; 3%</td></tr>' +
      '<tr><td><b>G2</b></td><td>有絲分裂 2–20/2mm² <b>或</b> Ki-67 3–20%</td></tr>' +
      '<tr><td><b>G3</b></td><td>有絲分裂 &gt; 20/2mm² <b>或</b> Ki-67 &gt; 20%</td></tr>' +
      '<tr><td>❗<b>最常犯的錯</b></td><td><b>NET G3 仍然是「分化良好」，不等於 NEC。</b>' +
      '<b>Ki-67 &gt; 20% 同時見於 NET G3 與 NEC，不能只憑 Ki-67 判斷</b>，' +
      '必須依<b>形態學的分化程度</b>區分。<br>' +
      '台大 PDNEC-1A 註 c 明載：<b>並非所有 Ki-67 &gt; 20% 者皆為分化差。</b><br>' +
      '兩者的預後與治療完全不同 —— <b>NEC 走白金加 etoposide，NET G3 不走。</b></td></tr>' +
      '<tr><td><b>NEC 與 MiNEN</b></td><td>分化差的<b>神經內分泌癌（小細胞／大細胞型）</b>與' +
      '<b>混合型神經內分泌-非神經內分泌腫瘤（MiNEN）</b>。' +
      '<b>於分期不適用 NET 的六套表</b>，須改用該部位<b>癌症（adenocarcinoma）</b>的分期系統。' +
      '<b>治療請在步驟 1 選「分化差的 NEC 或 MiNEN」。</b></td></tr>' +
      '<tr><td>影像分工</td><td><b>FDG-PET 用於 G2 以上或 NEC</b>；' +
      '<b>FDG-PET 與 SSTR-PET 合併評分的預後價值優於病理分級</b>（台大 NE-D）。</td></tr>' +
      '</table>');
  }

  /* 2b. 影像原則（台大 NE-D，跨部位） */
  function imagingReference() {
    return fold('<b>影像原則</b>（台大 NE-D，收錄於胰臟 NET 指引，內容為跨部位 NET 通則）',
      '<table>' +
      '<tr><td><b>解剖影像</b></td><td>CT 或 MRI 皆可，須包含原發部位。' +
      '<b>肝轉移常為高血流，所以要做多相位（動脈期＋門靜脈期）對比 CT</b> —— ' +
      'NET 常在動脈期強化。<b>可考慮用 MRI 取代 CT 以減少輻射。</b></td></tr>' +
      '<tr><td><b>SSTR 影像</b></td><td>選項：<b>SSTR-PET/CT 或 SSTR-PET/MRI</b>；' +
      '<b>octreotide SPECT/CT 只在做不到 SSTR-PET 時才用</b>（敏感度差很多，' +
      '而且通常無法和多相位 CT／MRI 一起做）。<br>' +
      '追蹤劑：<b>68Ga-DOTATATE、68Ga-DOTATOC 或 64Cu-DOTATATE</b>。<br>' +
      '❗<b>SSTR 陽性的定義是「可測量病灶的吸收高於肝臟」。</b><br>' +
      '❗<b>SSTR-PET 應盡量與對比 CT／MRI 同時做</b> —— ' +
      '對比影像是用來抓出 <b>SSTR 陰性</b>的病灶，兩者缺一不可。</td></tr>' +
      '<tr><td><b>追蹤頻率</b></td><td><b>轉移性分化良好 NET：解剖影像每 12 週–12 個月</b>，' +
      '依臨床或病理上的侵略性徵象決定。<br>' +
      '<b>根治性手術後追蹤至少 10 年</b>；依年齡與復發風險可延長，' +
      '但<b>超過 10 年的最佳排程資料有限</b>。</td></tr>' +
      '<tr><td>不需常規做</td><td>沒有已知腫瘤或特定臨床疑慮時，' +
      '<b>分化良好 NET 一般不需要腦部影像</b>。</td></tr>' +
      '<tr><td>❗<b>類癌心臟病<br>的心臟超音波</b></td>' +
      '<td><b>TTE 要包含瓣膜形態（尤其三尖瓣與肺動脈瓣）、右心大小與功能</b>；' +
      '有瓣膜疾病時要做<b>攪動生理食鹽水注射</b>看有沒有心房層面分流。<br>' +
      '<b>沒有已知類癌心臟病者：有呼吸困難／疲倦／水腫／腹水症狀，或理學檢查有頸靜脈壓上升／' +
      '水腫／腹水，或<u>計畫做腸／肝切除之前</u>，以及每 1–3 年重新評估。</b><br>' +
      '<b>已知類癌心臟病（不論有沒有換過瓣）：每年評估所有瓣膜並會診心臟科。</b></td></tr>' +
      '</table>');
  }

  /* 2c. 生化檢查（台大 NE-E，跨部位） */
  function biochemReference() {
    return fold('<b>生化與荷爾蒙檢查</b>（台大 NE-E，跨部位通則）',
      '<table>' +
      '<tr><td colspan="2">❗<b>荷爾蒙檢查要由症狀決定，無症狀者不常規篩檢。</b>' +
      '有功能性腫瘤的病人才會有荷爾蒙過量的臨床症狀。</td></tr>' +
      '<tr><td>❗<b>假性升高</b></td><td><b>PPI、其他藥物、某些疾病與某些食物會造成 ' +
      'gastrin 與 chromogranin A 假性升高。</b><br>' +
      '<b>gastrin 最好在空腹、且停 PPI 超過一週的狀態下驗</b>；' +
      '<b>但有明顯 gastrinoma 症狀或併發症風險者，PPI 要繼續用。</b></td></tr>' +
      '<tr><td><b>類癌症候群</b></td><td>原發灶<b>在小腸與闌尾，直腸罕見</b>。' +
      '<b>胃腸道原發灶通常不會有荷爾蒙過度分泌的症狀，除非已廣泛轉移。</b><br>' +
      '症狀：<b>flushing、diarrhea、心臟瓣膜纖維化、bronchoconstriction</b>。<br>' +
      '檢查：<b>24 小時尿或血漿 5-HIAA</b>。<br>' +
      '❗<b>檢查前 48 小時與檢查期間要避開</b>：酪梨、香蕉、哈密瓜、茄子、鳳梨、李子、番茄、' +
      '山核桃／胡桃、大蕉、奇異果、椰棗、葡萄柚、蜜瓜、核桃。</td></tr>' +
      '<tr><td><b>Insulinoma</b></td><td>胰臟。低血糖。<b>驗空腹血糖；低血糖當下驗 ' +
      'serum insulin、pro-insulin、C-peptide。</b></td></tr>' +
      '<tr><td><b>VIPoma</b></td><td>多在胰臟，胰外罕見。<b>嚴重水瀉、低血鉀。驗 serum VIP。</b></td></tr>' +
      '<tr><td><b>Glucagonoma</b></td><td>胰臟。<b>flushing、腹瀉、高血糖、皮膚炎、易凝血狀態。' +
      '驗 serum glucagon。</b></td></tr>' +
      '<tr><td><b>Gastrinoma</b></td><td>胰臟或十二指腸。<b>胃潰瘍、十二指腸潰瘍、腹瀉。' +
      '驗 serum gastrin。</b></td></tr>' +
      '<tr><td><b>Somatostatinoma</b></td><td>胰臟或十二指腸。' +
      '<b>高血糖、膽結石、腹瀉／脂肪便。驗 serum somatostatin。</b></td></tr>' +
      '<tr><td>❗</td><td><b>懷疑 MEN2 時，任何侵入性處置之前要先評估 PCC／PGL。</b></td></tr>' +
      '</table>');
  }

  /* 2d. 手術通則（台大 NE-F，跨部位） */
  function surgeryReference() {
    return fold('<b>手術通則</b>（台大 NE-F，跨部位 NET 通則）',
      '<table>' +
      '<tr><td><b>淋巴結</b></td><td><b>胃腸道 NET 的切除要包含足夠的區域淋巴結切除</b>' +
      '（可行時含所有可觸摸到的病灶）。</td></tr>' +
      '<tr><td>❗<b>小腸要用手摸</b></td><td><b>「especially important for small bowel NETs where ' +
      'manual palpation of the entire length of bowel is recommended as the rate of synchronous ' +
      'primary tumors is high (15%–30% incidence)」</b><br>' +
      '<b>同時性原發灶 15%–30%，一定要摸完全長小腸。</b>' +
      '可行時可用混合式微創方式切除摸到的病灶。</td></tr>' +
      '<tr><td><b>減積手術</b></td><td><b>切掉 &gt; 90% 的轉移病灶可以緩解症狀、預防未來症狀，' +
      '並改善功能性腫瘤病人的無惡化存活。</b><br>' +
      '<b>最適合相對緩慢（indolent）的轉移性小腸 NET；預期術後會快速惡化者較不適合。</b><br>' +
      '<b>有類癌症候群等荷爾蒙症候群的病人通常能從減積手術得到緩解。</b><br>' +
      '<b>肝轉移優先用保留肝實質的方式（含摘除 enucleation 與消融）。</b></td></tr>' +
      '<tr><td>❗<b>要不要順便<br>切膽囊</b></td>' +
      '<td><b>台大 NE-F：預計要長期使用 SSA 的晚期 NET 病人，手術時建議一併切除膽囊</b> —— ' +
      '這些病人發生膽道症狀與膽囊炎的風險較高。<br>' +
      '❗<b>但 ENETS 2024 小腸 NET 指引持不同看法</b>：' +
      '「recently, it has been demonstrated that <b>on-demand surgery can be considered ' +
      'non-inferior to the prophylactic cholecystectomy</b> in patients affected by Si-NET」——' +
      '<b>有需要再開，不劣於預防性切除。</b><br>' +
      '<b>兩份不同調，請與病人討論後決定。</b></td></tr>' +
      '<tr><td>❗<b>Whipple 之後</b></td><td><b>胰十二指腸切除後再做肝臟導向治療' +
      '（肝切除、熱消融、化學栓塞），膽道感染與肝膿瘤的風險上升。</b><br>' +
      '<b>轉移情境下要評估做 Whipple 的後果</b> —— 這種情況下手術通常不是根治性的，' +
      '<b>而且會長期影響肝臟導向治療。</b></td></tr>' +
      '<tr><td>❗<b>類癌心臟病</b></td><td><b>有顯著類癌心臟病時，只要有可能就在肝切除之前先換瓣。</b></td></tr>' +
      '<tr><td>❗<b>預防 carcinoid crisis</b></td>' +
      '<td><b>有類癌症候群的病人，麻醉誘導前應考慮先給非腸道（parenteral）octreotide。</b></td></tr>' +
      '<tr><td>脾切除</td><td>做脾切除者都要接種<b>肺炎鏈球菌、Hib、C 群腦膜炎</b>疫苗；' +
      '<b>可能的話在擇期脾切除前至少 14 天施打</b>，來不及就在術後病情穩定後盡快補。</td></tr>' +
      '<tr><td>復發與寡轉移</td><td><b>局部區域復發、孤立遠端轉移，或原本無法切除但已縮小的腫瘤，' +
      '在體能狀態足夠的選定病人可以考慮切除。</b></td></tr>' +
      '<tr><td>小腸原發灶</td><td><b>轉移情境下，空腸／迴腸 NET 的原發灶與腸繫膜淋巴結，' +
      '在原發灶造成症狀時應切除；無症狀者也可考慮切除，以減少未來的阻塞、腸繫膜缺血、' +
      '出血或穿孔。</b></td></tr>' +
      '</table>');
  }

  /* 2e. 台大 NE-H 1 OF 9：胃腸道 NET（WD G1/G2）全身治療選單（欄位已 render 核對） */
  function systemicReference() {
    /* ⚠ 用 fold() 不是 foldRx()：這是「整份選單」（含台灣拿不到或沒健保的藥），
       不是這位病人的處方。這位病人真正要開的藥寫在建議卡的一般條列裡。 */
    return fold('<b>全身治療的完整選單</b>（台大 NE-H 1 OF 9，胃腸道 NET 分化良好 G1／G2）',
      '<table>' +
      '<tr><td colspan="2">⚠ <b>三欄的歸屬只看得出來，抽文字會亂序 —— 本表已 render 圖檔逐欄核對。</b></td></tr>' +
      '<tr><td><b>Preferred<br>Regimens</b><br>（五項同欄）</td>' +
      '<td>· <b>Cabozantinib</b>（<b>category 1</b> if prior treatment with everolimus or ' +
      'lutetium Lu 177 dotatate）<br>' +
      '· <b>Everolimus</b>（<b>category 1</b> for nonfunctional tumors）<br>' +
      '· <b>PRRT with lutetium Lu 177 dotatate</b>（if SSTR-positive and progression on ' +
      'octreotide LAR/lanreotide）（<b>category 1</b> for progressive mid-gut tumors）<br>' +
      '· <b>First-line PRRT with lutetium Lu 177 dotatate</b>（if SSTR-positive, ' +
      '<b>Ki-67 ≥ 10%</b>, and clinically significant tumor burden）<br>' +
      '· <b>Octreotide LAR or lanreotide</b></td></tr>' +
      '<tr><td><b>Other Recommended<br>Regimens</b></td><td><b>None</b>（這一欄是空的）</td></tr>' +
      '<tr><td><b>Useful in Certain<br>Circumstances</b></td>' +
      '<td>· 標準劑量 SSA 下進展時，<b>超劑量 octreotide LAR 或 lanreotide</b>（if SSTR-positive）<br>' +
      '· <b>局部晚期無法切除者可考慮放療 ± 併用 fluoropyrimidine 為基礎的化療</b>' +
      '（❗<b>excluding small bowel mesenteric</b> —— 小腸腸繫膜病灶排除在外）<br>' +
      '· <b>細胞毒性化療，僅在其他選項都不可行時（all category 3）</b>：' +
      '5-FU、capecitabine、dacarbazine、oxaliplatin、temozolomide 可用於進展性疾病</td></tr>' +
      '<tr><td colspan="2"><b>逐字通則</b></td></tr>' +
      '<tr><td>❗<b>不做輔助治療</b></td><td><b>「There is no known role for systemic treatment ' +
      'in the <u>adjuvant</u> setting for NETs.」</b></td></tr>' +
      '<tr><td>❗<b>沒有順序可循</b></td><td><b>「Currently, there are <u>no data to support a ' +
      'specific sequence</u> of regional versus systemic therapy, and no data to guide sequencing ' +
      'of the following systemic therapy options.」</b><br>' +
      '也就是說本頁的線別只是常見走法，<b>不是有證據的固定順序</b>。</td></tr>' +
      '<tr><td>❗<b>進展時 SSA 要停還是留</b></td>' +
      '<td>註 a：<b>臨床上顯著惡化時，<u>非功能性</u>腫瘤應停掉 octreotide LAR／lanreotide，' +
      '<u>功能性</u>腫瘤要繼續</b>；這些藥可以與後續任何選項併用。</td></tr>' +
      '<tr><td><b>標準劑量</b></td><td>註 e：<b>octreotide LAR 20–30 mg IM 或 lanreotide 120 mg SC，' +
      '每 4 週一次</b>；更高劑量已證實安全。<b>突發症狀可考慮 octreotide 100–250 mcg SC TID。</b></td></tr>' +
      '<tr><td><b>超劑量</b></td><td>註 h：進展後為控制症狀與腫瘤，<b>octreotide LAR 可到每月 60 mg、' +
      'lanreotide 可到每 14 天 120 mg</b>，在選定病例可能有用。</td></tr>' +
      '<tr><td>其他註解</td><td>註 b：<b>everolimus 對類癌症候群的效果尚未建立。</b>' +
      '註 c：第三期試驗做在<b>非功能性</b>腫瘤。' +
      '註 d：<b>SSA 在 SSTR 陽性腫瘤的效益最大</b>。' +
      '註 f：<b>PROMID</b> 證實 octreotide LAR 對晚期 midgut NET 有抗腫瘤效果、' +
      '<b>CLARINET</b> 證實 lanreotide 對晚期分化良好轉移性 G1／G2 GEP-NET 有抗腫瘤效果。' +
      '註 g：注射處併發症可換另一種 SSA。</td></tr>' +
      '</table>');
  }

  /* 2f. PRRT（台大 NE-J，跨部位） */
  function prrtReference() {
    return fold('<b>PRRT 的操作細節</b>（台大 NE-J；台灣藥證與健保狀態一併列出）',
      '<table>' +
      '<tr><td><b>是什麼</b></td><td><b>Lutetium Lu 177 dotatate 是帶放射標記的 SSA。</b>' +
      'FDA 核准用於 ≥ 12 歲的 SSTR 陽性 GEP-NET，<b>含 foregut、midgut、hindgut</b>。</td></tr>' +
      '<tr><td><b>適格條件</b></td><td><b>分化良好 NET ＋ SSTR-PET 證實有 SSTR 表現 ＋ ' +
      '骨髓、腎、肝功能足夠。</b></td></tr>' +
      '<tr><td><b>劑量</b></td><td><b>200 mCi 靜脈輸注 30–40 分鐘，每 8 週一次，共 4 次</b>' +
      '（除非因不良反應需調整）。</td></tr>' +
      '<tr><td>❗<b>SSA 的時間安排</b></td>' +
      '<td><b>每次 PRRT 前 4 週不可給長效 SSA；短效 SSA 至少治療前 24 小時停；' +
      '兩者都可在治療後 4–24 小時恢復。</b>理由是 SSA 與 PRRT 會競爭 SSTR 結合。<br>' +
      '<b>功能性腫瘤一般在 PRRT 期間繼續 SSA；非功能性腫瘤是否受益尚不明確。</b></td></tr>' +
      '<tr><td><b>腎保護</b></td><td><b>胺基酸輸注是 PRRT 不可省略的一部分</b>：' +
      '治療前 30 分鐘、治療同時、治療後 3 小時給。<br>' +
      '<b>arginine 2.5%／lysine 2.5% 於 1000 mL NaCl，250 mL/h 輸 4 小時</b>' +
      '（只能由調配藥局取得，但比商業配方不易引起噁心）；' +
      '商業配方（約 20 種胺基酸）催吐性較強，<b>用商業配方時建議積極給預防性止吐藥</b>。<br>' +
      '<b>台灣有專用藥證</b>：LysaKare 離腎保輸注液（衛部藥輸字第028153號，' +
      '適應症逐字「用於減少成人使用 lutetium(177Lu) oxodotreotide 進行胜肽受體放射性核素療法' +
      '（PRRT）期間的腎臟輻射暴露量」）—— ❗<b>有效日期 2026/09/28，用之前要先確認是否已展延。</b></td></tr>' +
      '<tr><td><b>要告知的風險</b></td><td><b>對自己與他人的輻射曝露、骨髓抑制、' +
      '次發性骨髓分化不良症候群與白血病、腎毒性、肝毒性、' +
      '神經內分泌荷爾蒙危機或類癌危機（flushing、腹瀉、低血壓、bronchoconstriction）、' +
      '胚胎毒性、不孕、噁心嘔吐（來自必須併用的胺基酸輸注）。</b><br>' +
      '<b>避孕：女性最後一劑後 7 個月、男性 4 個月。</b>治療前要確認懷孕狀態。</td></tr>' +
      '<tr><td><b>治療後</b></td><td>依機構輻射安全規範給詳細指示；' +
      '<b>要監測全血計數與含腎、肝功能的血液生化。</b></td></tr>' +
      '<tr><td>證據不足的部位</td><td><b>PCC／PGL 與肺／胸腺 NET 目前沒有隨機資料</b>，' +
      '有療效報告；<b>這些罕見族群強烈建議參加臨床試驗。</b>' +
      'PRRT <b>可能減輕有症狀 insulinoma 與其他功能性 NET 的症狀</b>。</td></tr>' +
      '<tr><td>❗<b>台灣的藥證與健保</b></td>' +
      '<td><b>有藥證</b>：Lutathera 鎦癌平注射液 370 MBq/mL（衛部藥輸字第 R00104 號，有效至 2031/04/07）。<br>' +
      '<b>適應症逐字</b>：「用於治療成人<u>無法手術切除或轉移性</u>，<u>分化良好（G1 及 G2）</u>' +
      '且<u>經體抑素類似物（somatostatin analogue）治療無效</u>之體抑素受體（somatostatin receptor）' +
      '陽性的胃腸道胰腺神經內分泌腫瘤（GEP-NETs）。」<br>' +
      '❗<b>兩個落差</b>：<b>① 藥證要求「SSA 治療無效」，不涵蓋第一線 PRRT</b>' +
      '（而台大 NE-H 已把第一線 PRRT 列為 Preferred、ENETS 2024 也支持 Ki-67 ≥ 10% 者用）；' +
      '<b>② 藥證限 G1 及 G2，不涵蓋 NET G3。</b><br>' +
      '❗<b>健保完全不給付</b>：藥品給付規定查無條文；' +
      '《醫療服務給付項目及支付標準》6,010 個現行項目逐筆檢索' +
      '「DOTATATE／DOTATOC／octreoscan／PRRT／鎦／Ga-68」<b>全部 0 命中</b>。<br>' +
      '❗<b>SSTR-PET（68Ga-DOTATATE）本身也沒有給付代碼</b> —— ' +
      '而它同時是 PRRT 的必要適格條件。<b>兩件事都要自費。</b></td></tr>' +
      '</table>');
  }

  /* 2g. 肝臟導向治療（台大 NE-K） */
  function liverReference() {
    return fold('<b>肝臟導向治療</b>（台大 NE-K，跨部位）',
      '<table>' +
      '<tr><td><b>四類</b></td><td><b>① 手術切除（可含術中熱消融）② 肝動脈栓塞' +
      '（bland TAE、TACE、TARE）③ 經皮熱消融 ④ 放療（SBRT／SABR）</b></td></tr>' +
      '<tr><td><b>栓塞的適應症</b></td><td>分化良好 NET、<b>肝臟為主（liver-dominant）、無法切除</b>的' +
      '轉移，且符合其一：<br>· <b>在 SSA 或其他全身治療下仍有症狀</b><br>' +
      '· <b>在 SSA 或其他全身治療下進展</b><br>' +
      '· <b>肝臟病灶負荷大者可作為減積治療，不必等到進展</b></td></tr>' +
      '<tr><td><b>效果</b></td><td>回溯研究的影像反應率差異大，<b>平均約 60%</b>；' +
      '<b>有荷爾蒙症候群者約 85% 症狀得到緩解</b>。</td></tr>' +
      '<tr><td>❗<b>相對禁忌</b></td><td><b>基礎肝功能明顯不良（黃疸、腹水）、' +
      '肝腫瘤負荷 &gt; 70%</b>。</td></tr>' +
      '<tr><td>❗<b>先前 Whipple<br>或膽道器械操作</b></td>' +
      '<td><b>會因膽道細菌移生而增加肝膿瘤風險：' +
      'TAE／TACE 後感染併發症約 20%、TARE 約 8%，即使有廣效抗生素覆蓋也一樣。</b></td></tr>' +
      '<tr><td>❗<b>不要用載藥微球</b></td><td><b>「Drug-eluting embolics are associated with ' +
      'increased hepatobiliary toxicity in the NET population, and are <u>not recommended</u>.」</b>' +
      '—— 這一條和肝細胞癌的做法不同，特別容易搞混。</td></tr>' +
      '<tr><td>TAE vs TACE</td><td><b>沒有完成的隨機試驗比較過，兩者都可接受。</b><br>' +
      '雙葉病灶一般<b>分至少兩次、間隔約 1 個月</b>；負荷極高者可能需要三到四次才能安全治完全肝。<br>' +
      '<b>有荷爾蒙症候群者栓塞前要給短效 octreotide</b>；' +
      '一般需<b>過夜觀察</b>處理栓塞後症候群（疼痛、噁心）與荷爾蒙症狀加劇。</td></tr>' +
      '<tr><td>TARE 的位置</td><td>特別適合：<b>單葉或節段（小於單葉）分布</b>；' +
      '<b>先前做過 Whipple 或膽道器械操作者</b>（肝膽感染風險低於 TAE／TACE）。<br>' +
      '<b>TARE 耐受性優於 TAE／TACE，但長期存活者可能出現晚發的放射線誘發慢性肝毒性</b>，' +
      '雙葉放射栓塞者尤須注意。<b>TARE 與 PRRT 的先後安全性至今無證據支持或反對。</b></td></tr>' +
      '<tr><td>消融</td><td><b>經皮熱消融（常用微波，射頻與冷凍消融亦可）可考慮用於寡轉移肝病灶，' +
      '一般為 ≤ 4 個病灶且每個 &lt; 3 cm。</b>可行性要看有無安全的經皮影像導引路徑，' +
      '以及與血管、膽管或鄰近非標的構造的距離。</td></tr>' +
      '</table>');
  }

  /* 2h. 健保與藥證（NET 專屬） */
  function nhiReference() {
    return fold('<b>❗健保與藥證在 NET 的缺口</b>（查詢日 2026-08-17）',
      '<table>' +
      '<tr><td colspan="2"><b>四個 NET 常用藥的健保入口，差別在文義涵蓋得到還是涵蓋不到。</b></td></tr>' +
      '<tr><td><b>octreotide 長效型</b><br>5.4.4</td>' +
      '<td>第 3 項逐字：<b>「治療患有晚期間腸（midgut）或已排除原位非間腸處而原位不明之' +
      '分化良好（well-differentiated）的神經內分泌瘤患者。」</b><br>' +
      '→ <b>空腸-迴腸、右側結腸、闌尾都屬中腸衍生，文義涵蓋得到；' +
      '原發不明而已排除非中腸來源者也涵蓋。</b><br>' +
      '<b>劑量：第 3 項每次 30 mg、間隔四週</b>（第 1、2 項為 20 mg）；超量須於病歷詳細紀錄備查。<br>' +
      '<b>需事前審查，每次申請以一年為限，期滿要再申請。</b><br>' +
      '第 2 項「患有功能性症狀之胃、腸、胰內分泌腫瘤」則<b>要有功能性症狀才適用</b>。<br>' +
      '❗通則四之(二)11：<b>octreotide 攜回需個案事前報准。</b></td></tr>' +
      '<tr><td><b>lanreotide</b><br>5.4.6</td>' +
      '<td>第 3 項：<b>「治療無法切除、分化程度為良好或中度、局部進展或轉移性之' +
      '胃、腸、胰臟神經內分泌腫瘤（GEP-NETs）」</b> → <b>文義涵蓋最寬，不限部位。</b><br>' +
      '<b>每月限 120 mg 長效注射劑一針，間隔 4 週；需事前審查，每次一年為限。</b><br>' +
      '❗<b>非功能性患者「須附 6 個月內 somatostatin-receptor 陽性報告」，' +
      '但支付標準核醫項目查無 Ga-68 DOTATATE PET 或 In-111 octreoscan 的給付代碼</b> —— ' +
      '<b>條文要求的檢查本身沒有對應給付項目。</b></td></tr>' +
      '<tr><td><b>everolimus</b><br>9.36.1</td>' +
      '<td>第 3 項：<b>「使用於無法切除、局部晚期或轉移之<u>胃腸道或肺部來源</u>之' +
      '<u>非功能性</u>神經內分泌腫瘤成人病患」</b>，三個條件要同時符合：' +
      '<b>① 分化程度良好；② 為進展性腫瘤，即過去 12 個月影像持續惡化（RECIST 定義）；' +
      '③ 不可合併使用化學藥物或其他標靶藥物。</b><br>' +
      '<b>限每日最大劑量 10 mg；需事前審查，每次療程 3 個月為限</b>，' +
      '初次附病理與影像報告，之後每 3 個月申請並附影像與前次療效評估。<br>' +
      '❗<b>「非功能性」是硬條件 —— 有類癌症候群的病人套不進這一條</b>' +
      '（而台大 NE-H 註 b 本來也說 everolimus 對類癌症候群的效果未建立）。<br>' +
      '❗<b>互斥</b>：第 2 項（胰臟 NET）明文<b>「本品與 sunitinib 不得轉換使用」</b>' +
      '（僅嚴重不良反應或耐受不良例外）。</td></tr>' +
      '<tr><td>❗<b>' + NR('sunitinib') + '</b><br>9.31.3</td>' +
      '<td><b>條文與許可證都嚴格限「胰臟」神經內分泌腫瘤。</b><br>' +
      '→ <b>腸道、胃、闌尾、直腸來源的 NET 在健保條文上完全沒有入口。</b></td></tr>' +
      '<tr><td colspan="2"><b>下面這幾個是「指引有、台灣拿不到或沒健保」的缺口。</b></td></tr>' +
      '<tr><td>❗<b>PRRT</b></td><td><b>有藥證（Lutathera 衛部藥輸字第 R00104 號）但健保完全不給付；' +
      '而且藥證限 G1／G2 且要 SSA 治療無效。</b>詳見上方 PRRT 橫列。</td></tr>' +
      '<tr><td>❗<b>cabozantinib</b></td>' +
      '<td><b>台大 NE-H 把它列為胃腸道 NET 的 Preferred（用過 everolimus 或 PRRT 之後為 category 1），' +
      '但台灣健保 9.74 的條文只寫兩個癌別：腎細胞癌（108/12/1）與甲狀腺癌（114/8/1）。' +
      'NET 完全沒有入口。</b><br>' +
      '（ENETS 2024 也註明歐洲尚未核准 TKI 用於小腸 NET，' +
      '<b>但 cabozantinib 的隨機第三期試驗已證實延長 PFS，核准仍待定。</b>）</td></tr>' +
      '<tr><td>❗<b>temozolomide<br>（CAPTEM 的一半）</b></td>' +
      '<td><b>健保 9.25 的條文只寫腦瘤</b>：復發的 anaplastic astrocytoma、glioblastoma multiforme、' +
      'anaplastic oligodendroglioma，以及新診斷 GBM 併放療。<b>需事前審查。' +
      'NET 完全沒有列名。</b><br>' +
      '→ <b>CAPTEM（capecitabine ＋ temozolomide）用於 NET 在台灣是藥證外加健保外，' +
      '兩個藥都要自費或走個案事前審查。</b></td></tr>' +
      '<tr><td>❗<b>' + NR('telotristat') + '</b></td>' +
      '<td><b>食藥署許可證資料集逐筆檢索 0 筆 —— 台灣連藥證都沒有。</b><br>' +
      '→ <b>SSA 控制不住的類癌症候群腹瀉，這個藥在台灣自費也買不到，' +
      '只能走專案進口或臨床試驗。</b></td></tr>' +
      '<tr><td>❗<b>interferon-α</b></td><td><b>健保條文（4.3.5、8.2.6.2）是 B／C 型肝炎，' +
      '沒有 NET 適應症。</b>ENETS 2024 把 IFN-α 列為 SST 陰性者的第一線選項之一' +
      '（A-2b），但同時註明<b>「The use of IFN-α is limited due to lack of availability」</b>。</td></tr>' +
      '<tr><td><b>走得通的一般性入口</b></td>' +
      '<td><b>《全民健康保險藥物給付項目及支付標準》第 12 條第 1 項第 4 款</b>：' +
      '「不符藥品許可證所載適應症及本標準藥品給付規定者。<b>惟特殊病例得以個案向保險人申請' +
      '事前審查，並經核准後給付。</b>」<b>第 63 條第 2 項要 7 份文件</b>（申請書、病人同意書、' +
      '治療計畫書、IRB 非人體試驗聲明、近一年門住診病歷影本、傳統治療無效評估報告、' +
      '近五年佐證文獻）；<b>第 64 條：保險人應於收件起三週內完成核定。</b></td></tr>' +
      '</table>');
  }

  /* 2j. 胃 NET 的三型（ENETS 2023） */
  function gastricTypeReference() {
    return fold('<b>胃 NET 分三型怎麼分、差在哪</b>（ENETS 2023 胃十二指腸，PMID 37401795）',
      '<table>' +
      '<tr><td colspan="2">❗<b>分型是靠「胃竇與胃體黏膜分開切片」判的</b> —— ' +
      '該指引結論節逐字：<b>「Evaluation of the type of gNETs by assessing separate biopsies from ' +
      'the antral and fundic mucosa is needed.」</b>' +
      '<b>沒有分開送檢就分不出型，也就決定不了處置。</b></td></tr>' +
      '<tr><td><b>Type I</b><br>75%–80%</td>' +
      '<td><b>背景是慢性萎縮性胃炎（CAG），造成高胃泌素。</b>' +
      '<b>Indolent、轉移風險 &lt; 5%、長期存活近 100%。</b>' +
      '（&lt; 10 mm 的轉移風險 &lt; 1%。）</td></tr>' +
      '<tr><td><b>Type II</b><br>5%</td>' +
      '<td><b>背景是 Zollinger-Ellison 症候群造成的高胃泌素，可能出現在 MEN-1 病人。' +
      '最罕見的一型。轉移風險 10%–30%。</b><br>' +
      '❗<b>「Treatment of patients with type II gNETs strictly depends on the management of the ' +
      'MEN-I syndrome.」—— 處置完全取決於 MEN-1 怎麼管理，沒有獨立的一套。</b></td></tr>' +
      '<tr><td><b>Type III</b><br>15%–25%</td>' +
      '<td><b>偶發病灶，沒有高胃泌素。轉移 &gt; 50%、5 年存活 70%</b>，' +
      '雖然多數形態學上仍是分化良好。<b>Type III 也可能有較高分級。</b><br>' +
      '147 例的系統性回顧：<b>G1 約 45%、G2 約 35%、G3 約 20%。</b><br>' +
      '<b>傳統上被視為需要擴大手術，但高解析內視鏡普及後，小型低分級的 type III 越來越常被發現，' +
      '所以現在有從內視鏡切除到楔狀切除的較保守選項。</b></td></tr>' +
      '<tr><td>切除前要做什麼</td><td><b>&gt; 1 cm 的病灶，以及較小但「高」G2 的病灶，' +
      '切除前要做內視鏡超音波（EUS）確認侵犯深度與局部淋巴結。' +
      '這個階段不需要其他影像。</b><br>' +
      'Type III 要更完整：<b>內視鏡、切片、胸腹橫斷面 CT、肝 MRI，' +
      '常需功能性影像（依分級用 68Ga-SSTR-PET 或 FDG-PET），多數情況還要 EUS。</b></td></tr>' +
      '<tr><td>❗Ki-67 的門檻</td><td><b>指引反覆註明「cutoff not established」</b> —— ' +
      '該用哪個 Ki-67 切點決定要不要切，<b>指引自己沒有定義</b>。' +
      '唯一給了數字的地方是 type I 的手術評估：<b>Ki-67 超過 10% 應觸發手術治療的評估。</b></td></tr>' +
      '</table>');
  }

  /* 2k. 十二指腸 NET（ENETS 2023） */
  function duodReference() {
    return fold('<b>十二指腸 NET 切除前要評估的八件事</b>（ENETS 2023，PMID 37401795）',
      '<table>' +
      '<tr><td colspan="2">❗<b>「Size of the lesion is not a definitive guide to the correct ' +
      'treatment.」—— 大小不是決定性的依據，下面八項要一起看。</b></td></tr>' +
      '<tr><td><b>要評估的八項</b></td><td>· <b>腫瘤大小</b>（通常用 EUS 與胃鏡估）<br>' +
      '· <b>相對於深層肌肉層的侵犯深度</b>（EUS 估）<br>' +
      '· <b>有沒有淋巴結或轉移擴散</b>（EUS、肝 MRI、胸腹 CT，功能性影像最好用 68Ga-SSTR-PET）<br>' +
      '· <b>分級與形態</b><br>' +
      '· <b>內視鏡外觀：中央凹陷或潰瘍代表已侵犯</b><br>' +
      '· <b>適不適合內視鏡切除</b>（大小／可及性／位置／與壺腹的距離）<br>' +
      '· <b>荷爾蒙分泌狀態</b><br>· <b>年齡與體能狀態</b></td></tr>' +
      '<tr><td>❗<b>穿孔風險很高</b></td><td><b>內視鏡治療的文獻穿孔率 15%–25%，D2 尤其危險。</b>' +
      '<b>內視鏡治療風險高或不太可能根治時，就該考慮局部十二指腸切除（duodenotomy 加腫瘤切除或摘除）' +
      '或胰十二指腸切除。</b><br>' +
      '有中心做<b>內視鏡治療併腹腔鏡待援（穿孔時救援）</b>，可兼顧高 R0 率與低穿孔風險。</td></tr>' +
      '<tr><td><b>淋巴結風險</b></td><td><b>部分系列的淋巴結轉移率高達 40%–60%，' +
      '腫瘤大小是最相關的危險因子</b>；<b>直徑 &gt; 1 cm 者 18 例中有 13 例有淋巴結轉移</b>。<br>' +
      '<b>侵犯超出黏膜下層、G2–G3、LVI 都會提高淋巴結轉移風險；功能性腫瘤的轉移潛能更高。</b></td></tr>' +
      '<tr><td>多發與症候群</td><td><b>十二指腸 NET 可以是多發的，特別是 gastrinoma，' +
      '而且與 MEN-1 有關聯。Somatostatinoma 也可長在十二指腸、常靠近壺腹，但通常沒有臨床症候群。' +
      '另與 NF1 有關聯。</b></td></tr>' +
      '<tr><td>要取幾顆淋巴結</td><td><b>至少取 8 顆才能正確分期。</b></td></tr>' +
      '<tr><td>❗watch and wait</td><td><b>證據很有限</b>：只用於 &lt; 5 mm、不易切除、非功能性、' +
      'G1、未侵犯固有肌層者，<b>而且通常是用在不適合內視鏡切除或手術的病人。' +
      '對適合手術的病人是否合適並不清楚</b>（3b-C）。</td></tr>' +
      '</table>');
  }

  /* 2l. 小腸 NET（ENETS 2024） */
  function siReference() {
    return fold('<b>小腸 NET 的手術細節</b>（ENETS 2024，PMID 38977327，取代 2023 版）',
      '<table>' +
      '<tr><td colspan="2"><b>這一格的重點不是「要不要開」，而是「怎麼開」——' +
      '開錯方式會同時失去分期與腸長度。</b></td></tr>' +
      '<tr><td>❗<b>要轉到高量中心</b></td>' +
      '<td><b>系統性回顧顯示小腸 NET 手術的 90 天死亡率：低量中心 4% vs 高量醫院 1%。</b><br>' +
      '指引點出實際問題：<b>這些病人常因腸阻塞或出血在急診情境開刀，' +
      '導致淋巴廓清與多發病灶的處理不當</b>，' +
      '所以<b>要轉介到專門的高量中心，並規劃適當的再次手術</b>（A-2b）。</td></tr>' +
      '<tr><td>❗<b>一定要用手摸完<br>整條小腸</b></td>' +
      '<td><b>同時性腫瘤佔 40%–60%，而且術前影像通常抓不到。</b><br>' +
      '<b>手術黃金標準是：開放式進路 ＋ 雙手觸摸全長小腸 ＋ 保留血管的淋巴廓清</b>（A-2b）。<br>' +
      '（台大 NE-F 的數字是同時性原發 15%–30%，同樣要求手動觸摸全長小腸。' +
      '兩份的比例不同，但結論一致。）</td></tr>' +
      '<tr><td>❗<b>不要用「pizza pie」<br>式切法</b></td>' +
      '<td><b>目標是做系統性淋巴廓清但避免短腸症</b>，' +
      '所以<b>不該用大範圍腸切除（「pizza pie」approach），要做逆行、保留血管的淋巴廓清。</b><br>' +
      '<b>一篇回溯研究顯示用這個技術可讓切除的腸段縮短約一半。</b></td></tr>' +
      '<tr><td><b>取幾顆淋巴結</b></td><td><b>至少 8 顆</b>送檢（結果仍有爭議但這是共識數字）。</td></tr>' +
      '<tr><td><b>可切除性怎麼判</b></td><td><b>看淋巴結轉移對上腸繫膜動脈的包覆程度，' +
      '依 Ohrvall 分級</b>：<b>stage 0、I、II 一般視為可切除；stage III 可能難切。</b><br>' +
      '<b>淋巴結範圍與腸繫膜纖維化程度是可切除性的兩個主要決定因素。</b></td></tr>' +
      '<tr><td><b>預後看顆數</b></td><td><b>轉移淋巴結顆數是根治手術後復發的主要預後因子：' +
      '&gt; 4 顆的 3 年無復發存活 80%，1–3 顆 90%，0 顆 93%。' +
      '回溯系列的 5 年復發率 30%–40%。</b></td></tr>' +
      '<tr><td>❗<b>大腸鏡發現的<br>不要內視鏡切</b></td>' +
      '<td><b>「Even when sometimes small SI-NEN are diagnosed by colonoscopy, ' +
      'endoscopic removal <u>should not be performed</u>.」</b><br>' +
      '理由：<b>原發灶可能切不完整或發生併發症（穿孔風險），而且可能轉移的淋巴結完全不會被處理。</b></td></tr>' +
      '<tr><td>終末迴腸的範圍</td><td><b>多機構系列顯示做正式右半結腸切除與做 ileocaecectomy 的' +
      '長期結果相當</b>；另一單中心研究則顯示<b>右半結腸切除對局限性遠端迴腸 NET 的復發是正向預後因子</b>。' +
      '<b>兩者方向不同，範圍可個案討論。</b></td></tr>' +
      '<tr><td>微創的位置</td><td><b>腹腔鏡在高量中心的淋巴結數與長期結果與開放式相當</b>，' +
      '但仍有爭議 —— <b>開放式的優點是能手摸全長小腸、血管控制較安全</b>，' +
      '做保留血管的廓清時尤其重要。</td></tr>' +
      '<tr><td><b>腸繫膜纖維化（MF）</b></td>' +
      '<td><b>男性比女性多；有 MF 者的整體存活明顯較差。</b><br>' +
      '<b>有症狀（腹痛、腸阻塞）時手術仍是治療基石</b>；<b>但一篇大型回溯研究顯示' +
      '轉移性合併 MF 的病人做緩解性手術沒有改善存活率 —— 可能有症狀上的效益</b>（C-4）。</td></tr>' +
      '<tr><td>❗<b>不做輔助治療</b></td><td><b>「Following curative resection, there is no evidence ' +
      'supporting the use of adjuvant strategies for NET and current evidence supports follow-up only.」</b>' +
      '—— <b>輔助治療除臨床試驗外不適用。</b></td></tr>' +
      '<tr><td>右側結腸怎麼辦</td><td><b>ENETS 2023 結腸直腸：右側結腸 NET 的預後與小腸 NET 相當，' +
      '「在缺乏右側結腸 NET G1／G2 專屬資料的情況下，依小腸 NET G1／G2 的演算法治療是合理的」' +
      '（Level 4 grade C）。</b><br>' +
      '❗<b>右側結腸 NET 的類癌症候群比迴腸 NET 少見。</b><br>' +
      'EV 註記：SEER 的「結腸 NET」轉移性中位存活只有 14 個月，而小腸 103 個月、盲腸 98 個月 —— ' +
      '<b>這個落差來自左右側沒有分開統計；右側結腸的癌症特異存活優於左側。</b></td></tr>' +
      '</table>');
  }

  /* 2m. 台大 NET-1 的評估欄（只屬 T2–T4） */
  function rectalEvalReference() {
    return fold('<b>台大 NET-1 的延伸評估欄（只屬 T2–T4）</b>',
      '<table>' +
      '<tr><td colspan="2">❗<b>這一格是本頁與舊版最大的差別。已 render 第 19 頁決策圖逐格核對：' +
      '延伸評估與後面的大小分岔<u>只接在 T2–T4</u>，T1 是一條長箭頭直接到' +
      '「經肛門或內視鏡切除」。</b></td></tr>' +
      '<tr><td><b>共同的第一步</b></td><td><b>Rectal MRI or Endorectal ultrasound</b>' +
      '（直腸 MRI 或經直腸超音波）—— T1 與 T2–T4 都從這裡分出來。</td></tr>' +
      '<tr><td><b>Recommended</b><br>（T2–T4）</td><td>· <b>Colonoscopy</b>（大腸鏡）<br>' +
      '· <b>Multiphasic abdomen/pelvis CT or MRI</b>（多相位腹部／骨盆 CT 或 MRI）</td></tr>' +
      '<tr><td><b>As appropriate</b><br>（T2–T4）</td>' +
      '<td>· <b>SSTR-PET/CT or SSTR-PET/MRI</b><br>· <b>Chest CT ± contrast</b><br>' +
      '· <b>Biochemical evaluation as clinically indicated</b></td></tr>' +
      '<tr><td>註 a</td><td><b>Multiphasic imaging studies are performed with IV contrast in ' +
      'arterial and portal venous phases.</b></td></tr>' +
      '<tr><td>註 b</td><td><b>SSTR-PET/CT or SSTR-PET/MRI of skull vertex to mid-thigh with ' +
      'multiphase IV contrast when possible.</b>（顱頂至大腿中段）' +
      '<b>Data are limited on the optimal timing of scans following administration of SSAs.</b></td></tr>' +
      '<tr><td>註 c</td><td>追蹤劑：<b>68Ga-DOTATATE、64Cu-DOTATATE、68Ga-DOTATOC</b>。' +
      '（PDF 文字層把 DOTATATE 抽成「DOTA7ATE」、DOTATATE 抽成「DOTAWE」，那是抽取瑕疵。）</td></tr>' +
      '<tr><td>❗註 d</td><td>逐字：<b>「For 1- to 2-cm tumors, consider examination under anesthesia ' +
      'and/or EUS with radical resection if muscularis propria invasion or node positive.」</b><br>' +
      '<b>1–2 cm 的腫瘤要考慮麻醉下檢查與／或 EUS；若侵犯固有肌層或淋巴結陽性，改做根治性切除。</b></td></tr>' +
      '<tr><td>通則</td><td>' + cat2A + '</td></tr>' +
      '</table>');
  }

  /* 2i. 追蹤 */
  function followupHTML(kind) {
    var head = '<div class="fu-h">接下來怎麼追蹤</div>';
    if (kind === 'rectal_none') {
      return head + '<ul class="fu-list">' +
        '<li><b>台大 NET-1：無需額外追蹤</b>（No additional follow-up required）。</li>' +
        '<li>依據是完整切除的 &lt; 1 cm 偶發直腸 NET、切緣陰性者復發風險極低。</li>' +
        '<li>❗<b>但 ENETS 2023 對 R1（切緣有腫瘤）的小病灶另有建議</b> —— ' +
        '如果病理其實是 R1 而不是切緣陰性，請回步驟 2 選「已切除過但切緣是 R1」。</li></ul>';
    }
    if (kind === 'rectal_endo') {
      return head + '<ul class="fu-list">' +
        '<li><b>台大 NET-1 的追蹤欄逐字（接在「經肛門或內視鏡切除」那一格之後）</b>：' +
        '<b>&lt; 1 cm 不需追蹤；1 至 ≤ 2 cm 於 6 及 12 個月做內視鏡加直腸 MRI 或經直腸超音波，' +
        '之後依臨床需要。</b></li>' +
        '<li>❗<b>PDF 文字層會把「1 to ≤2 cm」抽成「1 to S2 cm」</b>，那是抽取瑕疵不是筆誤。</li>' +
        '<li>ENETS 2023 的補充：<b>1–2 cm 病灶的復發多在原位且生長極慢，' +
        '復發時可考慮全層切除。</b></li>' +
        '<li>發現復發或轉移 → 回步驟 1 選「任何部位，已轉移或無法切除」。</li></ul>';
    }
    if (kind === 'rectal_radical') {
      return head + '<ul class="fu-list">' +
        '<li>❗<b>台大 NET-1 的追蹤欄只連在「經肛門或內視鏡切除」那一格，' +
        '根治性切除（低前位／腹會陰切除）這一條沒有寫追蹤排程。</b>' +
        '這是指引本身的缺口，不是本頁漏掉。</li>' +
        '<li>可用的院外依據 —— 台大 NE-D（跨部位）：<b>根治性手術後追蹤至少 10 年</b>；' +
        '<b>轉移性分化良好 NET 的解剖影像每 12 週–12 個月</b>，依侵略性徵象決定。</li>' +
        '<li>ENETS 2023 結腸直腸：<b>依腫瘤大小與分級個別化，一般用對比 CT 或 MRI。</b></li></ul>';
    }
    if (kind === 'gastric_t1') {
      return head + '<ul class="fu-list">' +
        '<li><b>ENETS 2023：完全內視鏡切除後 12 個月做一次 OGD</b>（2b-B）。' +
        '<b>不需要切除者首次 12 個月，之後每 1–2 年</b>（2b-B）。</li>' +
        '<li><b>一般不需要橫斷面影像追蹤。</b></li>' +
        '<li>❗<b>不要重複驗 CgA 與 gastrin</b> —— <b>慢性萎縮性胃炎本身就會讓這兩個升高，' +
        '不是復發或進展的指標。</b>這一條很容易做多餘的檢查。</li>' +
        '<li>❗<b>真正要追的是胃腺癌</b>：<b>type I 胃 NET 病人在追蹤時每年偵測到胃腺癌的比率高達 1%</b>，' +
        '所以建議<b>每 12–24 個月做 OGD</b>（2b-A）。' +
        '（相較之下，沒有胃 NET 的慢性萎縮性胃炎病人是每 3 年。）</li></ul>';
    }
    if (kind === 'gastric_t3') {
      return head + '<ul class="fu-list">' +
        '<li><b>ENETS 2023：手術切除的 type III 用對比橫斷面影像追蹤</b>（CT／肝 MRI，' +
        '有時加 OGD／EUS 或功能性影像）（5-A）。<b>時機從未明確定義。</b></li>' +
        '<li><b>做了全胃切除加淋巴結廓清者，直接套用胃腺癌的追蹤排程。</b></li>' +
        '<li><b>保守處置（內視鏡或局部手術切除）者：約 3 個月後做 OGD 檢查切除處</b>，' +
        '若無巨觀殘留，之後定期做橫斷面影像與內視鏡／EUS；' +
        '<b>頻率依最終腫瘤大小、分級與病人狀況，隨時間可以拉長。</b></li>' +
        '<li><b>68Ga-SSTR-PET（或依分級用 FDG-PET）與切片只在懷疑復發時做，' +
        '不列入常規追蹤。</b></li></ul>';
    }
    if (kind === 'duod') {
      return head + '<ul class="fu-list">' +
        '<li><b>ENETS 2023：對比胸腹 CT 及／或肝 MRI，間隔 3–12 個月，依腫瘤的惡性潛能決定。</b></li>' +
        '<li><b>未治療（觀察）者每 3–6 個月重新評估。</b></li>' +
        '<li><b>臨床狀況與 CT／MRI、生化結果不一致時，加做 68Ga-SSTR-PET 會有幫助</b> —— ' +
        '它對淋巴結轉移的判定與骨、肝轉移的顯示都優於對比 CT，能更早發現新病灶。</li>' +
        '<li><b>G3 用 FDG-PET；高 G2 而 68Ga-SSTR-PET 陰性時 FDG-PET 也有幫助。</b></li></ul>';
    }
    if (kind === 'si') {
      return head + '<ul class="fu-list">' +
        '<li><b>ENETS 2024：根治性切除後沒有證據支持任何輔助治療，現有證據只支持追蹤。</b></li>' +
        '<li>❗<b>復發風險看淋巴結顆數</b>：<b>&gt; 4 顆轉移的 3 年無復發存活 80%，' +
        '1–3 顆 90%，0 顆 93%</b>；回溯系列的<b>5 年復發率 30%–40%</b>。' +
        '<b>顆數多的人要追得緊一點。</b></li>' +
        '<li>台大 NE-D（跨部位）：<b>根治性手術後追蹤至少 10 年。</b></li>' +
        '<li>❗<b>類癌心臟病要定期用心臟超音波追</b>：沒有已知類癌心臟病者' +
        '<b>每 1–3 年，以及計畫做腸／肝切除之前</b>；已知者每年並會診心臟科。</li></ul>';
    }
    return head + '<ul class="fu-list">' +
      '<li>台大 NE-D：<b>轉移性分化良好 NET 的解剖影像每 12 週–12 個月</b>，' +
      '依臨床或病理上的侵略性徵象決定。</li>' +
      '<li><b>SSTR-PET 應與雙時相對比 CT 或 MRI 一起做</b> —— ' +
      '對比影像是用來抓 SSTR 陰性的病灶。</li>' +
      '<li>❗<b>健保的事前審查週期是治療能不能接續的實際節奏</b>：' +
      '<b>SSA（octreotide LAR 5.4.4、lanreotide 5.4.6）每次核准一年；' +
      'everolimus（9.36.1）每次 3 個月，而且每次都要附影像與前次療效評估證實無惡化。</b></li>' +
      '<li>❗<b>類癌心臟病</b>：有症狀或計畫腸／肝切除前要做心臟超音波；' +
      '已知者每年追蹤。<b>顯著類癌心臟病時，肝切除前盡可能先換瓣。</b></li></ul>';
  }

  /* ==========================================================
     3. 版面
     ========================================================== */
  function netPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">神經內分泌瘤（GEP-NET）<b>依原發部位分流</b>，因為各部位的手術決策完全不同。<br>' +
      '<b>來源的界線</b>：<b>胰臟</b>走台大<b>胰臟神經內分泌腫瘤診療指引 版次 02</b>' +
      '（文件編號 50710-2-000048，2026/06/16 第 87 次癌委會通過）的完整 PanNET 流程；' +
      '<b>直腸</b>走台大<b>大腸直腸癌診療指引 版次 21 的 NET-1</b>（第 19 頁決策圖）。<br>' +
      '⚠<b>跨部位的通則（影像、生化、手術、全身治療、PRRT、肝臟導向、荷爾蒙症狀）其實也在' +
      '台大那份胰臟 NET 指引裡</b> —— 那些章節標為 <b>NE-D／NE-E／NE-F／NE-H／NE-J／NE-K／NE-L</b>，' +
      '內容是<b>跨部位 NET</b>而非只講胰臟，PDNEC-1 的標題更明寫「<b>Extrapulmonary</b>」。' +
      '本頁引用它們時一律註明。<br>' +
      '⚠<b>胃、十二指腸、小腸、結腸各部位的手術決策台大文件沒有</b>，' +
      '改用 <b>ENETS 2023 胃十二指腸</b>、<b>ENETS 2024 小腸</b>（取代 2023 版）、' +
      '<b>ENETS 2023 結腸直腸</b>與 <b>ENETS 2022 類癌症候群</b>，逐處標明。' +
      '<b>闌尾 NET 請看「闌尾癌」分頁</b>，那邊已依 ASCRS 2025 與 ENETS 2023 做好。<br>' +
      '❗<b>台灣最要緊的三件事</b>：<b>PRRT 有藥證但健保完全不給付</b>（而且藥證限 G1／G2 且要 SSA 失敗後）；' +
      '<b>cabozantinib 已是台大列的 Preferred，健保條文卻只寫腎細胞癌與甲狀腺癌</b>；' +
      '<b>CAPTEM 的 temozolomide 健保只寫腦瘤</b>。<br>' +
      '<b>每一步選完才會出現下一步與該步的建議。</b>建議框內：<b>正常字是要做的決定</b>，' +
      '<span style="opacity:.72">小灰字是理由與證據</span>，可展開的橫列是分級、影像、生化、' +
      '手術通則、全身治療選單、PRRT、肝臟導向與健保條文。</p>';
    h += '<div class="onc-path" id="ntPath">';

    h += node0('nt_n1', '1', '原發部位是哪裡？（或直接選最下面三項）',
      opt('site', 'panc', '胰臟 Pancreas', '→ 台大完整 PanNET 流程') +
      opt('site', 'gastric', '胃 Stomach', '先分 type I／II／III，處置差很多') +
      opt('site', 'duod', '十二指腸 Duodenum', '要先看位置在不在壺腹附近') +
      opt('site', 'si', '空腸-迴腸（小腸）／右側結腸', '右側結腸比照小腸') +
      opt('site', 'rectal', '直腸 Rectum', '→ 台大 NET-1') +
      opt('site', 'appendix', '闌尾 Appendix', '→ 請看「闌尾癌」分頁') +
      opt('site', 'adv', '任何部位，已轉移或無法切除', '→ 全身治療的線別選擇') +
      opt('site', 'nec', '病理是分化差的 NEC 或 MiNEN', '不走任何 NET 流程') +
      opt('site', 'sym', '要處理功能性症狀或類癌症候群', ''));

    /* ── 胰臟：注入 pnet 流程 ── */
    h += '<div id="nt_b_panc" class="hidden">';
    h += recBox('nt_r_panc', '建議處置 · 胰臟 NET 走哪一份流程');
    h += '<div id="nt_panc"></div>';
    h += '</div>';

    /* ── 胃 ── */
    h += '<div id="nt_b_gastric" class="hidden">';
    h += node('nt_n_gtype', '2', '這個胃 NET 是哪一型？（依背景胃部病理分型）',
      opt('gtype', 't1', 'Type I：有慢性萎縮性胃炎、高胃泌素', '最常見，75–80%；轉移 < 5%') +
      opt('gtype', 't2', 'Type II：Zollinger-Ellison 加 MEN-1 的高胃泌素', '最罕見，5%；轉移 10–30%') +
      opt('gtype', 't3', 'Type III：偶發，沒有高胃泌素', '15–25%；轉移 > 50%'),
      gastricTypeReference() + gradeReference());
    h += recBox('nt_r_gtype', '建議處置 · 這一型的處置原則');
    h += node('nt_n_g1size', '3', 'Type I：腫瘤大小與有沒有高風險特徵？',
      opt('g1size', 'lt1', '< 1 cm', '轉移風險 < 1%') +
      opt('g1size', 'mid', '1–2 cm', '') +
      opt('g1size', 'gt2', '> 2 cm，或疑似侵犯固有肌層，或有高風險特徵', '高 Ki-67／LVI／淋巴結'));
    h += node('nt_n_g3size', '3', 'Type III：腫瘤大小、分級與淋巴結？',
      opt('g3size', 'lt1', 'G1 且 ≤ 10 mm，影像與 EUS 都沒有淋巴結', '') +
      opt('g3size', 'mid', '10–20 mm，G1–G2，沒有淋巴結', '') +
      opt('g3size', 'gt2', '> 20 mm，或 Ki-67 > 20%，或有淋巴結／遠端轉移', ''));
    h += recBox('nt_r_gsize', '建議處置 · 內視鏡切除、局部手術還是根治性切除');
    h += fuBox('nt_f_gastric');
    h += '</div>';

    /* ── 十二指腸 ── */
    h += '<div id="nt_b_duod" class="hidden">';
    h += node('nt_n_dfeat', '2', '這個十二指腸 NET 屬於哪一種？（位置優先於大小）',
      opt('dfeat', 'amp', '長在壺腹或近壺腹', '生物行為較兇，另一條路') +
      opt('dfeat', 'small', 'D1 的極小病灶（≤ 5 mm）、非功能性', '') +
      opt('dfeat', 'mid', '5–15 mm，非功能性，未超出黏膜下層、G1', '') +
      opt('dfeat', 'surg', '> 10–15 mm，或超出黏膜下層，或 G2–G3，或 LVI，或功能性', ''),
      duodReference());
    h += recBox('nt_r_duod', '建議處置 · 內視鏡切除、局部切除還是 Whipple');
    h += fuBox('nt_f_duod');
    h += '</div>';

    /* ── 小腸／右側結腸 ── */
    h += '<div id="nt_b_si" class="hidden">';
    h += node('nt_n_sistate', '2', '目前的狀況是哪一種？',
      opt('sistate', 'loc', '局限性、影像評估可切除', '') +
      opt('sistate', 'mf', '有腸繫膜纖維化造成的症狀（腹痛、腸阻塞）', '') +
      opt('sistate', 'meta', '已經轉移', '→ 之後接全身治療'),
      siReference() + surgeryReference());
    h += recBox('nt_r_si', '建議處置 · 手術怎麼做');
    h += fuBox('nt_f_si');
    h += '</div>';

    /* ── 直腸 ── */
    h += '<div id="nt_b_rectal" class="hidden">';
    h += node('nt_n_rmode', '2', '這位病人的直腸 NET 屬於哪一種情境？（台大 NET-1）',
      opt('rmode', 'inc', '小型偶發、已完整切除（< 1 cm）', 'Small completely resected incidental') +
      opt('rmode', 'other', '其他所有直腸腫瘤', 'All other rectal tumors') +
      opt('rmode', 'r1', '已經切除過，但病理是 R1（切緣有腫瘤）', '台大 NET-1 沒寫這一段'));
    /* 偶發瘤子分支 */
    h += node('nt_n_margin', '3', '切緣是哪一種？',
      opt('margin', 'neg', '切緣陰性 Negative margin', '') +
      opt('margin', 'indet', '切緣不確定 Indeterminate margins', ''));
    h += node('nt_n_grade', '4', '分級是哪一種？（切緣不確定時）',
      opt('grade', 'g1', '低惡性度 Low grade（G1）', '') +
      opt('grade', 'g2', '不確定分級 Indeterminate grade（G2）', ''));
    /* 其他所有直腸腫瘤子分支 */
    h += node('nt_n_rt', '3', '直腸 MRI 或經直腸超音波看到的 T 分期是？',
      opt('rt', 't1', 'T1', '直接切除，不必再分大小') +
      opt('rt', 't24', 'T2–T4', '要先做延伸評估'),
      rectalEvalReference());
    h += node('nt_n_rsize', '4', 'T2–T4 的大小與淋巴結是哪一種？',
      opt('rsize', 'lt2', '< 2 cm', '') +
      opt('rsize', 'gt2', '> 2 cm 或淋巴結陽性', ''));
    /* R1 子分支 */
    h += node('nt_n_r1size', '3', '原本那顆腫瘤的大小與特徵？（決定要不要再切）',
      opt('r1size', 'gt2', '> 2 cm，或有不良特徵（較高 G2／G3、L1、V1）', '') +
      opt('r1size', 'mid', '1–2 cm', '') +
      opt('r1size', 'lt1', '< 1 cm', ''));
    h += recBox('nt_r_rectal', '建議處置 · 直腸 NET 怎麼處理');
    h += fuBox('nt_f_rectal');
    h += '</div>';

    /* ── 闌尾（指路） ── */
    h += '<div id="nt_b_appendix" class="hidden">';
    h += recBox('nt_r_appendix', '建議處置 · 闌尾 NET 請看闌尾癌分頁');
    h += '</div>';

    /* ── 晚期全身治療 ── */
    h += '<div id="nt_b_adv" class="hidden">';
    h += node('nt_n_line', '2', '現在要決定的是第幾線？',
      opt('line', 'l1', '第一線（還沒用過任何全身治療）', '') +
      opt('line', 'l2', 'SSA 之後進展', '') +
      opt('line', 'l3', '再後線（PRRT 或 everolimus 之後）', ''),
      gradeReference() + imagingReference());
    h += node('nt_n_sstr', '3', 'SSTR 影像的結果？（陽性定義：病灶吸收高於肝臟）',
      opt('sstr', 'pos', 'SSTR 陽性', '') +
      opt('sstr', 'neg', 'SSTR 陰性', '約 10% 分化良好 NET 是陰性'));
    h += node('nt_n_ki67', '4', 'Ki-67 與腫瘤負荷？（決定第一線要不要直接上 PRRT）',
      opt('ki67', 'lo', 'Ki-67 < 10%，且沒有大量腫瘤負荷', '') +
      opt('ki67', 'hi', 'Ki-67 ≥ 10%，或腫瘤負荷明顯', ''));
    h += recBox('nt_r_adv', '建議處置 · 全身治療');
    h += fuBox('nt_f_adv');
    h += '</div>';

    /* ── NEC／MiNEN ── */
    h += '<div id="nt_b_nec" class="hidden">';
    h += recBox('nt_r_nec', '建議處置 · 分化差的 NEC 與 MiNEN');
    h += '</div>';

    /* ── 功能性症狀 ── */
    h += '<div id="nt_b_sym" class="hidden">';
    h += node('nt_n_syn', '2', '是哪一種功能性症候群？',
      opt('syn', 'cs', '類癌症候群（flushing、腹瀉、瓣膜纖維化）', '原發多在小腸與闌尾') +
      opt('syn', 'insulin', 'Insulinoma（低血糖）', '') +
      opt('syn', 'gastrin', 'Gastrinoma（胃與十二指腸潰瘍、腹瀉）', '') +
      opt('syn', 'vip', 'VIPoma（嚴重水瀉、低血鉀）', '') +
      opt('syn', 'glucagon', 'Glucagonoma（flushing、腹瀉、高血糖、皮膚炎）', ''),
      biochemReference());
    h += recBox('nt_r_sym', '建議處置 · 症狀怎麼控制');
    h += '</div>';

    h += '<div class="flow-reset"><button class="back-btn" onclick="ntReset()">重置</button></div>';
    h += '</div>';
    h += '<div class="bc-gene hidden" id="nt_gene"></div>';
    h += '<div class="bc-drugbox hidden" id="nt_drugs"></div>';
    return h;
  }

  /* ==========================================================
     4. 顯示控制
     ========================================================== */
  function el(id) { return document.getElementById(id); }
  function show(id, on) { var e = el(id); if (e) e.classList.toggle('hidden', !on); }
  function setNum(id, n) {
    var e = el(id); if (!e) return;
    var s = e.querySelector('.flow-num'); if (s) s.textContent = n;
  }
  function collapseAll() {
    var root = el('ntPath');
    if (!root) return;
    root.querySelectorAll('.nt-node').forEach(function (n) {
      if (n.id !== 'nt_n1') n.classList.add('hidden');
    });
    root.querySelectorAll('.flow-rec').forEach(function (r) { r.classList.add('hidden'); });
    root.querySelectorAll('.flow-fu').forEach(function (f) { f.classList.add('hidden'); f.innerHTML = ''; });
    ['nt_b_panc', 'nt_b_gastric', 'nt_b_duod', 'nt_b_si', 'nt_b_rectal', 'nt_b_appendix',
      'nt_b_adv', 'nt_b_nec', 'nt_b_sym'].forEach(function (id) { show(id, false); });
  }
  function liOf(t) {
    if (t.indexOf('@ev ') === 0) return '<li class="ev">' + t.slice(4) + '</li>';
    if (t.indexOf('<span class="rx-h">') === 0) return '<li class="hd">' + t + '</li>';
    return '<li>' + t + '</li>';
  }
  function fill(id, cls, title, lines, src, extra) {
    var e = el(id);
    if (!e) return;
    var label = e.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置';
    e.className = 'flow-rec ' + cls;
    e.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail">' + lines.map(liOf).join('') + '</ul>' : '') +
      (extra || '') + (src ? '<div class="rec-note">' + src + '</div>' : '');
  }
  function fu(id, kind) {
    var e = el(id);
    if (!e) return;
    e.classList.remove('hidden');
    e.innerHTML = followupHTML(kind);
  }
  function ensurePanc() {
    var host = el('nt_panc');
    if (!host) return;
    if (!pancInjected && typeof pnetPathwayHTML === 'function') {
      host.innerHTML = pnetPathwayHTML(true);   // embed 模式：無開場、無自己的重置鍵
      pancInjected = true;
      if (typeof initPnetPathway === 'function') initPnetPathway();
    }
  }

  /* ==========================================================
     5. 各分支
     ========================================================== */
  function renderPanc() {
    show('nt_b_panc', true);
    fill('nt_r_panc', 'rec-elective',
      '胰臟 NET<br>→ 下面是台大胰臟神經內分泌腫瘤診療指引的完整流程',
      [H('這一格有台大自己的完整指引', '版次 02，2026/06/16 第 87 次癌委會通過'),
      '<b>文件編號 50710-2-000048，共 55 頁，Source 為 NCCN v3.2025（10/01/2025）。</b>' +
        '涵蓋 <b>PanNET-1～13</b>（分化良好 G1／G2）、<b>WDG3-1～4</b>（分化良好 G3）、' +
        '<b>PDNEC-1／1A</b>（分化差的神經內分泌癌與混合型）。',
      '<b>三條主幹在該流程的步驟 1 就分開，互不相通</b>：' + SUB([
        '<b>分化良好 G1／G2 → PanNET-1～13</b>',
        '<b>分化良好 G3（WD G3）→ WDG3-1～4</b>',
        '<b>分化差的 NEC（小細胞／大細胞型）與混合型 MiNEN → PDNEC-1</b>']),
      '❗<b>PDNEC-1 的標題是「<u>肺外（Extrapulmonary）</u>分化差之神經內分泌癌」，' +
        '適用範圍涵蓋所有肺外部位</b>（含胃、十二指腸、空腸-迴腸、闌尾、結直腸），<b>不限胰臟</b>。' +
        '本頁把它放在胰臟分支下，只是因為它的出處是這份胰臟 NET 指引。' +
        '<b>如果你的病人是其他部位的 NEC，請回步驟 1 選「病理是分化差的 NEC 或 MiNEN」。</b>',
      H('小的胰臟 NET 要不要開', '台大 NE-F'),
      '<b>小於 2 cm 的低分級胰臟 NET，手術還是積極監測要個別化</b>，依腫瘤大小與特徵、病人狀況決定：' +
        SUB(['<b>&lt; 1 cm 的惡性潛能低於 1–2 cm</b>',
          '<b>影像上均質、邊界清楚的小腫瘤也偏向良性行為</b>',
          '<b>年齡與共病是判斷能不能監測的重點</b>',
          '❗<b>鈣化與較高的腫瘤分級及較高的淋巴結轉移率相關</b>',
          '❗<b>黑人族群的 1–2 cm 低分級胰臟 NET，淋巴結轉移風險可能與白人的 &gt; 2 cm 相當</b>']),
      '<b>Insulinoma 優先考慮摘除（enucleation）</b> —— 症狀明顯（低血糖）但很少惡性；' +
        '<b>周邊的 insulinoma 在技術可行時考慮摘除／局部切除，或保留脾臟的胰尾切除</b>。',
      '<b>&gt; 2 cm 或影像看起來惡性的非功能性與功能性胰臟 NET（glucagonoma、VIPoma、' +
        'somatostatinoma），要完整切除腫瘤到切緣陰性（含鄰近器官）並取區域淋巴結。</b>'],
      '台大胰臟神經內分泌腫瘤診療指引 版次 02（文件編號 50710-2-000048，2026/06/16 第 87 次' +
      '癌症醫療委員會會議通過；Source: NCCN Guidelines Version 3.2025, 10/01/2025）；' +
      '手術通則見同文件 NE-F。',
      surgeryReference() + gradeReference());
    ensurePanc();
  }

  function renderGastric() {
    show('nt_b_gastric', true);
    show('nt_n_gtype', true);
    if (!S.gtype) return;

    var L = [], cls = 'rec-elective', title = '';
    if (S.gtype === 't1') {
      title = '胃 NET Type I（慢性萎縮性胃炎 ＋ 高胃泌素）<br>→ 以內視鏡為主，重點反而是追胃腺癌';
      L.push(H('這一型的基本盤', 'ENETS 2023'));
      L.push('<b>最常見（75%–80%）、indolent、轉移風險 &lt; 5%、長期存活近 100%。</b>' +
        '<b>&lt; 10 mm 的轉移風險 &lt; 1%。</b>');
      L.push('<b>治療選項有四個：觀察、內視鏡切除、SSA、手術。</b>');
      L.push('❗<b>分型要靠胃竇與胃體黏膜分開切片</b> —— 沒有分開送檢就分不出型。');
      L.push(H('無法切除時才用藥', 'ENETS 2023 Q2'));
      L.push('<b>當有切除的適應症但內視鏡與手術技術都做不到時（位置困難、年紀大、共病），' +
        '用 SSA 是適當的</b>（2b-A）—— <b>octreotide 或 lanreotide</b>。');
      L.push('<b>完全反應率 25%–100%，但停藥後常復發，所以要持續給。</b>' +
        '<b>腫瘤大、或病灶進展需要反覆內視鏡切除，也可以是開始用 SSA 的理由</b>（此點資料不足）。');
      L.push(EV('gastrin 受體抑制劑 netazepide 的第二期概念驗證試驗（16 人）完全反應率 30%，' +
        '<b>但停藥後全部復發，臨床效益仍需大型隨機試驗，目前不能建議使用。</b>'));
      L.push('❗<b>抗胃竇切除術（antrectomy）不再常規提供</b>，' +
        '只在不能耐受 SSA 或拒絕持續注射的病人才是選項。');
      fu('nt_f_gastric', 'gastric_t1');
      show('nt_n_g1size', true);
    } else if (S.gtype === 't2') {
      cls = 'rec-nonop';
      title = '胃 NET Type II（Zollinger-Ellison ＋ MEN-1 的高胃泌素）<br>→ 沒有獨立的一套，完全跟著 MEN-1 走';
      L.push(H('這一型的處置就是這一句', 'ENETS 2023 §1.4'));
      L.push('<b>逐字：「Treatment of patients with type II gNETs strictly depends on the management ' +
        'of the MEN-I syndrome.」</b>—— <b>處置完全取決於 MEN-1 症候群怎麼管理。</b>');
      L.push('<b>最罕見的一型（只佔 5%），轉移風險 10%–30%</b> —— ' +
        '<b>預後要放在 MEN-1 的整體脈絡裡評估，不能只看胃的病灶。</b>');
      L.push(H('所以實際要做什麼', ''));
      L.push('<b>先確認 MEN-1 的診斷與其他內分泌腺體的狀況</b>（副甲狀腺、胰臟、腦下垂體）。' +
        '<b>台大胰臟 NET 指引有 MEN1 專章（含 MEN1-A 手術原則），請在步驟 1 選「胰臟」查閱。</b>');
      L.push('<b>高胃泌素的來源是 gastrinoma，多在胰臟或十二指腸</b> —— ' +
        '這一型的胃部病灶是高胃泌素的後果，<b>處理源頭才是重點</b>。' +
        '<b>症狀控制見步驟 1 的「要處理功能性症狀」→ Gastrinoma。</b>');
      L.push('❗<b>驗 gastrin 要空腹並停 PPI 超過一週；但有明顯 gastrinoma 症狀或併發症風險者 ' +
        'PPI 要繼續用</b>（台大 NE-E）。<b>這一格兩個要求會互相衝突，要臨床判斷。</b>');
      L.push('❗<b>懷疑 MEN2 時，任何侵入性處置前要先排除 PCC／PGL</b>（台大 NE-E）。');
    } else {
      title = '胃 NET Type III（偶發、沒有高胃泌素）<br>→ 以手術為主，但小型低分級可以保守';
      L.push(H('這一型的基本盤', 'ENETS 2023'));
      L.push('<b>轉移 &gt; 50%、5 年存活 70%</b>，雖然多數形態學上仍是分化良好。' +
        '<b>147 例的系統性回顧：G1 約 45%、G2 約 35%、G3 約 20%。</b>');
      L.push('<b>傳統上視為需要擴大手術（部分或全胃切除加廓清）；但高解析內視鏡普及後，' +
        '小型低分級的 type III 越來越常被發現，因此在高度選擇的病人有較保守的選項。</b>');
      L.push(H('切除前的評估要比 type I 完整', ''));
      L.push('<b>內視鏡、切片、胸腹橫斷面 CT、肝 MRI，常需功能性影像' +
        '（依分級用 68Ga-SSTR-PET 或 FDG-PET），多數情況還要 EUS。</b>');
      fu('nt_f_gastric', 'gastric_t3');
      show('nt_n_g3size', true);
    }
    fill('nt_r_gtype', cls, title, L,
      'ENETS 2023 胃十二指腸 NET G1-G3（Panzuto F et al. J Neuroendocrinol 2023;35(8):e13306，' +
      'PMID 37401795，Open Access）。<b>台大文件沒有胃 NET 的部位算法，本段屬院外實證。</b>',
      gastricTypeReference());

    if (S.gtype === 't1' && S.g1size) renderG1Size();
    if (S.gtype === 't3' && S.g3size) renderG3Size();
  }

  function renderG1Size() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.g1size === 'lt1') {
      cls = 'rec-nonop';
      title = 'Type I、&lt; 1 cm<br>→ 可以觀察，不需要任何處置';
      L.push(H('這一格的結論', 'ENETS 2023 §1.3.1'));
      L.push('<b>「as prognosis is usually quite favourable and tumour growth slow and risk of ' +
        'metastases is below 1% in tumours &lt; 10 mm, <u>all NET &lt; 1 cm can be observed without ' +
        'any need for intervention</u>」</b>');
      L.push('<b>觀察用的胃鏡排程指引沒有定案</b>，臨床實務從每 6 個月到每 2 年都有；' +
        '<b>最普遍的做法是第一次追蹤排在 6 個月，之後每 12 個月。</b>');
      L.push('❗<b>不需要常規重複切片</b> —— 除非出現異常特徵' +
        '（<b>潰瘍、糜爛、pitting</b>）暗示病灶已侵犯性進展。');
    } else if (S.g1size === 'mid') {
      title = 'Type I、1–2 cm<br>→ 內視鏡切除，優先用 ESD 或 FTR';
      L.push(H('主建議', 'ENETS 2023 Q1（2b-A）'));
      L.push('<b>「Endoscopic resection should be proposed in type I gNETs larger than 1 cm」</b>' +
        '（2b-A）—— <b>&gt; 1 cm 就該做內視鏡切除</b>；Ki-67 上升的病灶也一樣，' +
        '因為這兩個特徵與較高的轉移及進展風險相關。');
      L.push('❗<b>切除前要先做 EUS</b> 確認侵犯深度與局部淋巴結（&gt; 1 cm 的病灶，' +
        '以及較小但「高」G2 的病灶）。<b>這個階段不需要其他影像。</b>');
      L.push('<b>技術選擇：EMR、ESD、FTR 的出血與穿孔風險都低。' +
        '但 ESD 與 FTR 的 R0 率高於 EMR</b>（2b-B）—— ' +
        '<b>沒有頭對頭的隨機試驗比較過三者。</b>');
      L.push('❗<b>R1（切除不完整）而病灶 &gt; 1 cm → 走 step-up：EMR → ESD → FTR → 手術</b>' +
        '（4-C）。<b>較小的病灶在初次 R1 後可以只做非侵入性的內視鏡監測。</b>');
      L.push(EV('指引註明「data showing risk of local recurrence after R1 resection are scarce」——' +
        'R1 後的局部復發風險資料很少，所以 step-up 的建議等級只有 4-C。'));
      L.push('❗<b>結論節的原文把 1–2 cm 這一格講得更清楚</b>：' +
        '「Tumours between 1 cm and 2 cm in size are usually managed by endoscopic resection ' +
        'after EUS evaluation, <b>although surgery might be indicated in selected cases with G2 ' +
        'tumours and high Ki-67 (cutoff not established), and in G3 tumours</b>.」' +
        '<b>G2 加高 Ki-67，或 G3，就要考慮改開刀 —— 但 Ki-67 的切點指引自己沒有定義。</b>');
    } else {
      title = 'Type I、&gt; 2 cm 或疑似侵犯固有肌層或有高風險特徵<br>→ 上手術，做有限切除加局部淋巴結取樣';
      L.push(H('主建議', 'ENETS 2023 Q4（2b-A）'));
      L.push('<b>「Surgical approach is recommended in tumours &gt; 20 mm or with suspected ' +
        'muscolaris propria invasion (either on axial imaging or EUS).」</b>' +
        '<b>另外切片上有高風險特徵（高 Ki-67、lymphovascular invasion）也可以考慮手術。</b>');
      L.push('<b>手術範圍：首選有限切除加局部淋巴結取樣</b>（3b-A）。');
      L.push('<b>已知有淋巴結轉移者，才討論全胃切除加 D2 廓清</b>；' +
        '也可以在最終病理證實淋巴擴散後作為補做的手術（3b-A）—— ' +
        '❗<b>但指引註明「there are no solid data supporting this option」。</b>');
      L.push('❗<b>不可做內視鏡切除的情況</b>：' + SUB([
        '<b>已侵犯固有肌層</b>', '<b>疑似淋巴結轉移</b>',
        '<b>有轉移擴散的高風險特徵（高 Ki-67、血管侵犯、大小 &gt; 20 mm）</b>']) +
        '<b>這些病人要做完整分期（含橫斷面影像與 68Ga-SSTR-PET）並直接上手術。</b>');
      L.push('❗<b>Ki-67 唯一給了數字的地方就在這裡</b>：' +
        '<b>「The optimal cutoff value for Ki-67 is not determined, but Ki-67 values above 10% ' +
        'should trigger evaluation of surgical treatment.」</b>' +
        '—— <b>切點未定，但超過 10% 就該評估手術。</b>');
      L.push('<b>罕見的 G3 type I 胃 NET，因轉移風險高，建議一開始就走手術。</b>');
      L.push(EV('20 mm 這個門檻的來源：<b>SEER 資料庫與一個來自台灣的大型系列都顯示' +
        '20 mm 的切點與較高的淋巴結轉移風險相關。</b>' +
        '指引同時承認「Regarding tumour size, no clear cutoff for surgical management can be defined」。'));
      L.push('<b>內視鏡切除後 R1、或最終病理有風險特徵 → 要和病人討論手術，' +
        '以達到 R0 並／或切除局部淋巴結來排除轉移。</b>' +
        '<b>病灶位置不適合內視鏡（例如靠近 cardia）時，可能需要一開始就手術。</b>');
      L.push('<b>不能切除、或多發較大腫瘤、或頻繁復發者，可以用 SSA</b>（octreotide 或 lanreotide）' +
        '<b>降低 gastrin 分泌，減少促進腫瘤生長與進展的刺激。</b>');
    }
    fill('nt_r_gsize', cls, title, L,
      'ENETS 2023 胃十二指腸 NET G1-G3（PMID 37401795）Q1–Q4 與結論節。' +
      '<b>台大文件沒有胃 NET 的部位算法，本段屬院外實證。</b>',
      gradeReference() + nhiReference());
  }

  function renderG3Size() {
    var L = [], cls = 'rec-elective', title = '';
    if (S.g3size === 'lt1') {
      title = 'Type III、G1 且 ≤ 10 mm、無淋巴結<br>→ 可以考慮內視鏡切除';
      L.push(H('主建議', 'ENETS 2023 Q5（3a-C）'));
      L.push('<b>「Endoscopic resection may be considered in patients who have localised type III ' +
        'G1 gNETs ≤ 10 mm, and occasionally larger tumours with Ki-67 &lt; 10% and &lt; 15 mm in ' +
        'diameter if the risks of surgical resection are high provided adequate staging is allowed.」</b>');
      L.push('<b>前提是完整分期</b>：內視鏡、切片、胸腹橫斷面 CT、肝 MRI、' +
        '功能性影像（依分級用 68Ga-SSTR-PET 或 FDG-PET），多數情況還要 EUS，' +
        '<b>而且要沒有淋巴結侵犯的證據</b>。');
      L.push('❗<b>10 mm 這個門檻的理由</b>：<b>大於這個尺寸的腫瘤更可能有淋巴結轉移，' +
        '而且影像技術可能偵測不到。</b>');
      L.push('<b>技術：現有證據不支持特定的內視鏡技術（EMR vs ESD）。</b>');
      L.push('❗<b>切緣陽性（R1）要考慮追加內視鏡切除，或適當時做手術救援。</b>');
      L.push('<b>做完內視鏡切除的病人要密切追蹤（內視鏡 ＋ 胸腹 CT 與肝 MRI）' +
        '以偵測局部與遠端復發。</b>');
      L.push(EV('❗<b>有些極小（&lt; 5 mm）的腫瘤曾被 avulsion biopsy 無意間切掉，' +
        '之後也沒有復發證據，但指引明講「this approach is not generally recommended」。</b>'));
    } else if (S.g3size === 'mid') {
      title = 'Type III、10–20 mm、G1–G2、無淋巴結<br>→ 有限楔狀切除加局部淋巴結取樣';
      L.push(H('主建議', 'ENETS 2023 Q6（2b-B）'));
      L.push('<b>「A limited wedge resection with local nodal sampling (without standard ' +
        'lymphadenectomy) can be considered as a treatment option in patients with localised, ' +
        'G1–G2 type III gNETs, with no evidence of lymphadenopathy on full staging preoperative ' +
        'imaging (including EUS).」</b>—— <b>不做標準廓清。</b>');
      L.push('<b>10–20 mm 是這一格的位置</b>：<b>&lt; 10 mm 通常走內視鏡切除，' +
        '10–20 mm 則可以考慮有限手術切除作為初始治療。</b>');
      L.push('<b>符合條件後還要再看三件事來定範圍：腫瘤大小、侵犯深度、有沒有 lymphovascular ' +
        'invasion。</b><b>G1、&lt; 20 mm、侷限於黏膜下層、且無 LVI 者，楔狀切除是安全的。</b>');
      L.push('❗<b>G2 的楔狀切除仍有爭論</b> —— 指引原文「The role of wedge resections in patients ' +
        'with G2 type III gNETs remains debated, <b>as tumour grade represents a powerful predictor ' +
        'of disease aggressiveness</b>」。<b>大小的切點也沒有明確定義。</b>');
      L.push('❗<b>內視鏡切除後 R1，可以用救援性楔狀切除。</b>');
      L.push('❗<b>下列任一項在最終病理出現，就要改做根治性手術（第二線）</b>：' + SUB([
        '<b>有淋巴結轉移</b>', '<b>分級比原本的切片更高</b>',
        '<b>lymphovascular invasion</b>', '<b>切除不完全（R1）</b>']));
      L.push(EV('近期經驗顯示內視鏡切除／有限手術切除的腫瘤結果良好，' +
        '<b>支持在高度選擇的 type III 病人採取保守做法。</b>'));
    } else {
      cls = 'rec-urgent';
      title = 'Type III、&gt; 20 mm 或 Ki-67 &gt; 20% 或有淋巴結／轉移<br>→ 根治性切除加淋巴結廓清';
      L.push(H('主建議', 'ENETS 2023 Q6（2b-B）'));
      L.push('<b>「Radical surgical resection with lymphadenectomy is recommended in type III gNETs ' +
        'when nodal metastases are found/suspected on preoperative staging, if Ki-67 &gt; 20% or ' +
        'tumour diameter &gt; 20 mm.」</b>');
      L.push('<b>範圍是全胃或次全胃切除加淋巴結廓清。</b>' +
        '三個觸發條件任一成立即可：<b>① 術前影像有淋巴結或遠端轉移；② Ki-67 &gt; 20%（G3）；' +
        '③ 腫瘤 &gt; 20 mm。</b>');
      L.push(H('已經轉移的話還要不要開', 'ENETS 2023 §3'));
      L.push('❗<b>「Due to the lack of effective systemic therapeutic options surgery should be ' +
        'evaluated <u>even in the presence of metastatic condition</u>」</b> —— ' +
        '<b>只要看起來能做到完整切除（R0），即使已轉移也要評估手術</b>（4-B）。');
      L.push('<b>全胃切除加 D2 廓清本身就含區域淋巴結，所以區域淋巴結轉移不該成為排除手術的理由。</b>');
      L.push('<b>單一或多個肝轉移的完整切除，即使 G3 也可能有益</b>；' +
        '<b>G2 應評估手術，G3 只在高度選擇的個案。</b>');
      L.push('<b>其他位置的單一或多發轉移也要評估能不能完整切除。</b>');
      L.push(H('無法切除時', ''));
      L.push('<b>全身治療依分級</b>：<b>SSA 用於 G1–G2、Ki-67 &lt; 10%、SSTR 陽性者</b>' +
        '（生長慢或進展慢時 Ki-67 較高也可以給）；<b>PRRT 依受體狀態是有效選項；' +
        'everolimus 是選項但證據有限；NET G3 應給化療</b>（4-B）。' +
        '<b>詳細線別請回步驟 1 選「任何部位，已轉移或無法切除」。</b>');
      L.push('❗<b>緩解性原發灶切除只在少數情況考慮（避免局部併發症）</b>；' +
        '<b>範圍要看位置與併發症風險 —— 全胃切除只在罕見情況必要，' +
        '楔狀、遠端或次全胃切除較佳以降低圍手術期併發症。' +
        '大量病灶已侵犯內臟動脈或胰臟時，優先做胃繞道而不切腫瘤。</b>');
      L.push('<b>局部復發而無瀰漫轉移時，優先手術切除以避免出血或腸阻塞、維持生活品質。</b>' +
        '<b>體能狀態差者可用支架或空腸置管等內視鏡處置替代。</b>');
    }
    fill('nt_r_gsize', cls, title, L,
      'ENETS 2023 胃十二指腸 NET G1-G3（PMID 37401795）Q5、Q6、Q7 與 §3。' +
      '<b>台大文件沒有胃 NET 的部位算法，本段屬院外實證。</b>',
      gradeReference() + nhiReference());
  }

  function renderDuod() {
    show('nt_b_duod', true);
    show('nt_n_dfeat', true);
    if (!S.dfeat) return;

    var L = [], cls = 'rec-elective', title = '';
    if (S.dfeat === 'amp') {
      cls = 'rec-urgent';
      title = '長在壺腹或近壺腹的十二指腸 NET<br>→ 首選胰十二指腸切除加淋巴結廓清';
      L.push(H('為什麼位置優先於大小', 'ENETS 2023 Q10'));
      L.push('<b>「In general, pancreatoduodenectomy with lymphadenectomy is the procedure of choice ' +
        'for ampullary/periampullary neoplasms, <u>due to their particular aggressiveness</u>.」</b>');
      L.push('❗<b>但指引同時記錄了證據上的不一致</b>：<b>「Lesions arising in the ampullary/' +
        'periampullary area differ from other dNETs due to a more aggressive biological behaviour ' +
        'in some studies but not in others.」</b>—— <b>有研究支持、有研究不支持。</b>');
      L.push('<b>術前或術中發現淋巴結轉移 → 做胰十二指腸切除加淋巴結剝離以取得適當的腫瘤學清除。</b>');
      L.push('❗<b>&lt; 20 mm 的病灶可以考慮較不激烈的做法</b>：' +
        '<b>局部切除加淋巴結廓清，或保留胰臟的全十二指腸切除</b>。');
      L.push('<b>至少要取 8 顆淋巴結才能正確分期。</b>');
      L.push('❗<b>根治手術的代價要講清楚</b>：<b>「radical surgery is associated with a high rate of ' +
        'short- and long-term complications. Therefore, when feasible from an oncological ' +
        'perspective, other surgical strategies should be considered.」</b>');
      L.push('❗<b>Whipple 之後做肝臟導向治療會增加膽道感染與肝膿瘤風險</b>（台大 NE-F、NE-K）：' +
        '<b>TAE／TACE 後感染併發症約 20%、TARE 約 8%</b>。' +
        '<b>如果這位病人日後可能需要肝臟導向治療，這一點要放進手術決策裡。</b>');
    } else if (S.dfeat === 'small') {
      cls = 'rec-nonop';
      title = 'D1 的極小（≤ 5 mm）非功能性十二指腸 NET<br>→ EMR 類技術移除即可';
      L.push(H('主建議', 'ENETS 2023 Q8（3b-C）'));
      L.push('<b>「Very small non-functioning tumours in D1 should be removed using EMR type ' +
        'techniques.」</b>');
      L.push('<b>實務上這些病灶常在還沒有組織學診斷之前，就已經用抬起注射加套環（或診斷性切片）' +
        '移除了，而且通常不復發也不轉移。</b>');
      L.push('❗<b>如果不容易切除、非功能性、G1、未侵犯固有肌層，watch and wait 也可考慮</b>，' +
        '<b>但證據很有限，通常只用在不適合內視鏡切除或手術的病人</b>（3b-C）。' +
        '<b>對適合手術的病人是否合適並不清楚。</b>');
      L.push('<b>切除後仍要確認病理有沒有超出黏膜下層、G2–G3、LVI —— ' +
        '任一項成立就要改走手術路徑。</b>');
    } else if (S.dfeat === 'mid') {
      title = '5–15 mm、非功能性、未超出黏膜下層、G1<br>→ 可內視鏡切除，但穿孔風險相對高';
      L.push(H('主建議', 'ENETS 2023 Q8（3b-C）'));
      L.push('<b>「Lesions of 5–10 mm (and up to 15 mm in some centres) can be removed ' +
        'endoscopically after imaging work-up, <u>but risks are relatively high</u>.」</b>');
      L.push('<b>年輕、體能好的病人應該先徵詢治療性內視鏡團隊的意見評估切除與風險。' +
        '要做 EUS 以及橫斷面與功能性影像。</b>');
      L.push('<b>這些病灶多數是 G1 且沒有侵犯肌肉層；此時用 EMR／Cap EMR／ESD 是合理的。</b>');
      L.push('❗<b>但穿孔風險不低：文獻報告 15%–25%，D2 尤其危險。</b>' +
        '<b>內視鏡治療風險高或不太可能根治時，就該考慮局部十二指腸切除' +
        '（duodenotomy 加腫瘤切除或摘除）或胰十二指腸切除。</b>');
      L.push(EV('<b>有中心採用「內視鏡治療併腹腔鏡待援（穿孔時救援）」</b>，' +
        '指引評為 ESD 的新穎且有價值的替代方案，<b>能兼顧高 R0 率與低術中十二指腸穿孔風險。</b>'));
      L.push('❗<b>先確認不是多發</b>：<b>十二指腸 NET 可以多發，特別是 gastrinoma，且與 MEN-1 有關；' +
        'somatostatinoma 也可長在十二指腸、常靠近壺腹但通常沒有症候群；另與 NF1 有關聯。</b>');
    } else {
      cls = 'rec-urgent';
      title = '&gt; 10–15 mm，或超出黏膜下層，或 G2–G3，或 LVI，或功能性<br>→ 手術；範圍看位置與淋巴結';
      L.push(H('主建議', 'ENETS 2023 Q10（3-B）'));
      L.push('<b>「Surgery is recommended in cases of size &gt; 10–15 mm and/or tumour extending ' +
        'beyond the submucosa and/or grade G2-G3 and/or lymphovascular invasion.」</b>' +
        '<b>功能性腫瘤也是（轉移潛能更高）。</b>');
      L.push('❗<b>淋巴結轉移率很高</b>：<b>部分系列 40%–60%，腫瘤大小是最相關的危險因子；' +
        '直徑 &gt; 1 cm 者 18 例中 13 例有淋巴結轉移。</b>');
      L.push(H('局部切除還是 Whipple', ''));
      L.push('<b>非壺腹、非功能性、分期沒有可疑淋巴結，而內視鏡切除做不到的病人 → ' +
        '局部十二指腸切除（duodenotomy 加腫瘤切除或摘除）是有價值且安全的選項。</b>');
      L.push('❗<b>這一格的淋巴結剝離角色不明確</b>：' +
        '<b>「The role of nodal dissection in this setting is unclear as recent experience does not ' +
        'support the clearance of occult nodal metastases due to lack of association with survival ' +
        'advantages.」</b>—— <b>近期經驗不支持為了清除隱匿淋巴結轉移而擴大範圍。</b>');
      L.push('<b>術前或術中發現淋巴結轉移，或病灶在壺腹／近壺腹 → 走胰十二指腸切除加廓清。</b>');
      L.push('<b>至少取 8 顆淋巴結。</b>');
      L.push('❗<b>根治手術的短期與長期併發症率都高</b>，' +
        '<b>腫瘤學上可行時應優先考慮其他手術策略。</b>');
    }
    fill('nt_r_duod', cls, title, L,
      'ENETS 2023 胃十二指腸 NET G1-G3（PMID 37401795）§2 與 Q8–Q10；' +
      '手術後果與肝臟導向治療的交互影響見台大 NE-F／NE-K。' +
      '<b>台大文件沒有十二指腸 NET 的部位算法，本段屬院外實證。</b>',
      duodReference() + nhiReference());
    fu('nt_f_duod', 'duod');
  }

  function renderSi() {
    show('nt_b_si', true);
    show('nt_n_sistate', true);
    if (!S.sistate) return;

    var L = [], cls = 'rec-elective', title = '';
    if (S.sistate === 'loc') {
      title = '小腸 NET，局限且可切除<br>→ 一定要開，但「怎麼開」比「開不開」更關鍵';
      L.push(H('主建議', 'ENETS 2024（A-2b）'));
      L.push('<b>「All localised, resectable Si-NET should be operated, since this is the only chance ' +
        'for long-term cure given the high rate of lymph node metastases <u>even in tumours ' +
        '&lt; 10 mm</u>.」</b>—— <b>連 &lt; 10 mm 的淋巴結轉移率都高，所以沒有觀察這個選項。</b>');
      L.push('<b>偶然發現的無症狀局限性 Si-NET，手術一樣是首選治療。</b>');
      L.push(H('❗手術黃金標準的三個要素', ''));
      L.push('<b>① 開放式進路 ② 雙手觸摸全長小腸 ③ 保留血管的淋巴廓清（至少 &gt; 8 顆淋巴結），' +
        '目標是限制小腸切除的範圍</b>（A-2b）。');
      L.push('<b>為什麼要摸：同時性腫瘤佔 40%–60%，而且術前影像通常抓不到。</b>');
      L.push('❗<b>不要用「pizza pie」式大範圍腸切除，要做逆行保留血管的淋巴廓清</b> —— ' +
        '<b>回溯研究顯示用這個技術可讓切除的腸段縮短約一半。</b>');
      L.push('❗<b>要轉到高量中心</b>：<b>90 天死亡率低量中心 4% vs 高量醫院 1%。</b>' +
        '指引點出實際問題是這些病人常在急診情境開刀，導致廓清與多發病灶處理不當。');
      L.push('<b>可切除性看淋巴結轉移對上腸繫膜動脈的包覆程度（Ohrvall 分級）：' +
        'stage 0、I、II 一般可切；stage III 可能難切。</b>');
      L.push('❗<b>大腸鏡發現的小 Si-NEN 不可做內視鏡切除</b> —— ' +
        '<b>原發灶可能切不完整或穿孔，而且可能轉移的淋巴結完全不會被處理。</b>');
      L.push('<b>終末迴腸的範圍可以討論</b>：多機構系列顯示<b>正式右半結腸切除與 ileocaecectomy ' +
        '的長期結果相當</b>；另一單中心研究顯示<b>右半結腸切除對局限性遠端迴腸 NET 的復發是正向' +
        '預後因子</b>。<b>兩者方向不同。</b>');
      L.push(H('❗不做輔助治療', ''));
      L.push('<b>「Following curative resection, there is no evidence supporting the use of adjuvant ' +
        'strategies for NET and current evidence supports follow-up only.」</b>' +
        '台大 NE-H 也明文<b>「There is no known role for systemic treatment in the adjuvant ' +
        'setting for NETs」</b>。<b>兩份一致。</b>');
      L.push('❗<b>要不要順便切膽囊，兩份指引不同調</b>：' +
        '<b>台大 NE-F 說預計長期用 SSA 者手術時建議一併切除膽囊；' +
        'ENETS 2024 說「有需要再開」不劣於預防性切除。</b><b>請與病人討論後決定。</b>');
      fu('nt_f_si', 'si');
    } else if (S.sistate === 'mf') {
      title = '小腸 NET 併腸繫膜纖維化造成症狀<br>→ 手術仍是治療基石，但要講清楚它改善的是症狀';
      L.push(H('主建議', 'ENETS 2024（C-4）'));
      L.push('<b>「Surgery remains the cornerstone of treatment in patients who report symptoms ' +
        'related to MF such as abdominal pain or present with bowel obstruction.」</b>');
      L.push('❗<b>但腫瘤學上的效益有爭議</b>：<b>「a large retrospective series found that patients ' +
        'with MF and metastatic Si-NET showed <u>no improvement of survival rates after palliative ' +
        'surgery</u>. There may however be a symptomatic benefit.」</b>' +
        '<b>—— 轉移性合併腸繫膜纖維化者，緩解性手術沒有改善存活，但可能改善症狀。' +
        '術前說明要把這件事分開講。</b>');
      L.push('<b>腸繫膜纖維化本身是不良預後因子</b>：<b>男性比女性多見，有 MF 者的整體存活明顯較差。</b>');
      L.push('<b>腸繫膜纖維化也是可切除性的兩個主要決定因素之一（另一個是淋巴結範圍）。</b>');
      L.push(H('台大 NE-F 對這一格的補充', ''));
      L.push('<b>轉移情境下，空腸／迴腸 NET 的原發灶與腸繫膜淋巴結，在原發灶造成症狀時應切除；' +
        '無症狀者也可考慮切除，以減少未來的阻塞、腸繫膜缺血、出血或穿孔。</b>');
      L.push('❗<b>有類癌症候群的病人麻醉誘導前要先給非腸道 octreotide，預防 carcinoid crisis</b>' +
        '（台大 NE-F）。<b>這一格的病人常合併類癌症候群，這一步不可略過。</b>');
      L.push('❗<b>有顯著類癌心臟病時，只要有可能就在肝切除之前先換瓣</b>（台大 NE-F）。');
      fu('nt_f_si', 'si');
    } else {
      cls = 'rec-nonop';
      title = '小腸 NET 已轉移<br>→ 原發灶要不要切看症狀；全身治療請走晚期分支';
      L.push(H('原發灶的處理', '台大 NE-F'));
      L.push('<b>轉移情境下，空腸／迴腸 NET 的原發灶與腸繫膜淋巴結，' +
        '在原發灶造成症狀時應切除。</b>');
      L.push('<b>無症狀者也可考慮切除，以減少未來的阻塞、腸繫膜缺血、出血或穿孔</b> —— ' +
        '<b>這是預防性的理由，不是為了延長存活。</b>');
      L.push(H('減積手術的位置', '台大 NE-F'));
      L.push('<b>切掉 &gt; 90% 的轉移病灶可以緩解症狀、預防未來症狀，' +
        '並改善功能性腫瘤病人的無惡化存活。</b>' +
        '<b>這個策略最適合相對緩慢（indolent）的轉移性小腸 NET；' +
        '預期術後會快速惡化者較不適合。</b>');
      L.push('<b>有類癌症候群等荷爾蒙症候群的病人，通常能從減積手術得到緩解。</b>');
      L.push('<b>肝轉移優先用保留肝實質的方式（含摘除 enucleation 與消融）。</b>');
      L.push(H('接下來', ''));
      L.push('<b>全身治療的線別選擇請回步驟 1 選「任何部位，已轉移或無法切除」</b> —— ' +
        '那一條會依線別、SSTR 狀態與 Ki-67 給建議，並列出台灣的健保與藥證缺口。');
      L.push('<b>肝臟為主的病灶另有肝臟導向治療的選項，見下方可展開的橫列。</b>');
      L.push('❗<b>做肝臟導向治療前要先看有沒有類癌心臟病</b>：' +
        '<b>有顯著類癌心臟病時，只要有可能就在肝切除之前先換瓣。</b>');
      fu('nt_f_si', 'adv');
    }
    fill('nt_r_si', cls, title, L,
      'ENETS 2024 小腸 NET（Lamarca A et al. J Neuroendocrinol 2024;36(9):e13423，PMID 38977327，' +
      '取代 2023 版）§4；ENETS 2023 結腸直腸（PMID 37345509）§2.1 右側結腸比照小腸；' +
      '台大 NE-F 手術通則（收錄於胰臟 NET 指引 版次 02）。' +
      '<b>台大文件沒有小腸 NET 的部位算法，手術細節屬院外實證。</b>',
      siReference() + surgeryReference() + liverReference());
  }

  function renderRectal() {
    show('nt_b_rectal', true);
    show('nt_n_rmode', true);
    if (!S.rmode) return;

    if (S.rmode === 'inc') {
      show('nt_n_margin', true);
      if (!S.margin) return;
      if (S.margin === 'indet') { show('nt_n_grade', true); if (!S.grade) return; }
      renderRectalInc();
    } else if (S.rmode === 'other') {
      setNum('nt_n_rt', '3');
      show('nt_n_rt', true);
      if (!S.rt) return;
      if (S.rt === 't24') { show('nt_n_rsize', true); if (!S.rsize) return; }
      renderRectalOther();
    } else {
      setNum('nt_n_r1size', '3');
      show('nt_n_r1size', true);
      if (!S.r1size) return;
      renderRectalR1();
    }
  }

  function renderRectalInc() {
    var L = [], cls = 'rec-nonop', title = '', fuk = 'rectal_none';
    if (S.margin === 'neg') {
      title = '小型偶發、已完整切除（&lt; 1 cm）、切緣陰性<br>→ 無需額外追蹤';
      L.push(H('台大 NET-1 這一格逐字', 'p19 決策圖'));
      L.push('<b>Small (&lt; 1 cm) completely resected incidental tumors → Negative margin → ' +
        '<u>No additional follow-up required</u></b>');
      L.push('<b>完整切除的 &lt; 1 cm 偶發直腸 NET、切緣陰性者，復發風險極低。</b>');
      L.push('❗<b>先確認「切緣陰性」的定義</b>：ENETS 2023 的 R 定義是' +
        '<b>「檢體邊緣有腫瘤才算 R1／R2；游離邊界 &lt; 1 mm 仍算 R0」</b>。' +
        '<b>如果病理其實寫的是切緣有腫瘤，那是 R1，請回步驟 2 選第三項。</b>');
      L.push(EV('ENETS 2023 提醒一個技術細節：<b>新鮮檢體攤平固定在紙板上可減少固定收縮假象，' +
        '讓病理判得出切緣</b>。已知是 NET 的病灶（尤其 sessile）做黏膜切除時要特別注意這點。'));
    } else if (S.grade === 'g1') {
      cls = 'rec-elective';
      title = '切緣不確定 · 低惡性度（G1）<br>→ 6–12 個月做內視鏡評估殘存病灶';
      L.push(H('台大 NET-1 這一格逐字', 'p19 決策圖'));
      L.push('<b>Indeterminate margins → Low grade (G1) → ' +
        '<u>Endoscopy at 6–12 mo to assess for residual disease</u></b>');
      L.push('<b>內視鏡結果有兩個出口</b>：' + SUB([
        '<b>Negative（陰性）→ No additional follow-up required（無需額外追蹤）</b>',
        '<b>Positive or intermediate grade（陽性或中等分級）→ ' +
          'Follow pathway below for all other rectal tumors</b>' +
          '（請於<b>步驟 2</b> 改選「其他所有直腸腫瘤」）']));
      L.push('❗<b>注意這一格的第二個出口不只看「有沒有殘存」，還看「分級有沒有升上去」</b> —— ' +
        '<b>intermediate grade 也會被推到正式評估與切除的那條路。</b>');
    } else {
      cls = 'rec-elective';
      title = '切緣不確定 · 不確定分級（G2）<br>→ 直接依「其他所有直腸腫瘤」流程';
      L.push(H('台大 NET-1 這一格逐字', 'p19 決策圖'));
      L.push('<b>Indeterminate margins → Indeterminate grade (G2) → ' +
        '<u>Follow pathway below for all other rectal tumors</u></b>');
      L.push('<b>相較於 G1（可以先用內視鏡追蹤），G2 不走觀察路徑，' +
        '直接進入正式評估與切除決策。</b>');
      L.push('<b>請於步驟 2 改選「其他所有直腸腫瘤」，' +
        '會先問直腸 MRI 或經直腸超音波看到的 T 分期。</b>');
      fuk = null;
    }
    fill('nt_r_rectal', cls, title, L,
      '台大大腸直腸癌診療指引 版次 21（文件編號 50710-2-000007，2026/06/16 第 87 次癌症醫療' +
      '委員會修訂通過）NET-1，第 19 頁決策圖（本頁已 render PNG 逐格核對箭頭）。' + cat2A +
      '｜R 定義與檢體處理補充自 ENETS 2023 結腸直腸（PMID 37345509）。',
      rectalEvalReference());
    if (fuk) fu('nt_f_rectal', fuk);
  }

  function renderRectalOther() {
    var L = [], cls = 'rec-elective', title = '', fuk = 'rectal_endo';
    if (S.rt === 't1') {
      title = '其他直腸腫瘤 · <b>T1</b><br>→ 直接經肛門或內視鏡切除';
      L.push(H('❗這一格是本頁與舊版最大的差別', '已 render p19 決策圖逐格核對'));
      L.push('<b>NET-1 的第一個分岔是 T 分期，不是腫瘤大小。' +
        'T1 是一條長箭頭直接連到「Resection (transanal or endoscopic excision, if possible)」，' +
        '<u>不經過大小分岔，也不經過延伸評估欄</u>。</b>');
      L.push('<b>處置：Resection（transanal or endoscopic excision, if possible）—— ' +
        '經肛門或內視鏡切除（如可行）。</b>');
      L.push('<b>共同的第一步是 Rectal MRI or Endorectal ultrasound</b>（直腸 MRI 或經直腸超音波）' +
        '—— T1 與 T2–T4 都從這裡分出來，這一步不能省。');
      L.push('❗<b>但註 d 仍然適用於 1–2 cm 的腫瘤</b>：' +
        '<b>「For 1- to 2-cm tumors, consider examination under anesthesia and/or EUS ' +
        'with radical resection if muscularis propria invasion or node positive.」</b>' +
        '<b>—— 1–2 cm 要考慮麻醉下檢查與／或 EUS；若侵犯固有肌層或淋巴結陽性，改做根治性切除。' +
        '（侵犯固有肌層依定義就已經是 T2，所以這一步其實是在確認 T 分期沒有低估。）</b>');
      L.push('<b>切完之後要看切緣</b>：<b>若病理是 R1，請回步驟 2 選「已經切除過，但病理是 R1」</b> —— ' +
        '台大 NET-1 沒有寫 R1 的處理，那一格用的是 ENETS 2023 的建議。');
    } else if (S.rsize === 'lt2') {
      title = '其他直腸腫瘤 · T2–T4 · &lt; 2 cm<br>→ 經肛門或內視鏡切除';
      L.push(H('台大 NET-1 這一格逐字', 'p19 決策圖'));
      L.push('<b>T2–T4 → 延伸評估 → &lt; 2 cm → Resection（transanal or endoscopic excision, ' +
        'if possible）</b>');
      L.push('<b>延伸評估的內容（Recommended）：大腸鏡；多相位腹部／骨盆 CT 或 MRI。</b>' +
        '<b>（As appropriate）：SSTR-PET/CT 或 SSTR-PET/MRI；胸部 CT ± 顯影劑；' +
        '依臨床需要做生化檢查。</b>詳見下方可展開的橫列。');
      L.push('❗<b>註 d 在這一格特別重要</b>：<b>1–2 cm 的腫瘤要考慮麻醉下檢查與／或 EUS；' +
        '若侵犯固有肌層或淋巴結陽性 → 改做根治性切除（走 &gt; 2 cm 那條路）。</b>');
      L.push('❗<b>這裡有一個內在張力要注意</b>：<b>T2 依定義就是侵犯固有肌層，' +
        '而註 d 說侵犯固有肌層要做根治性切除。</b>' +
        '<b>所以「T2–T4 且 &lt; 2 cm」在實務上多半會落到根治性切除那一條 —— ' +
        '這一格請提多專科團隊討論，不要只照大小決定。</b>');
    } else {
      cls = 'rec-urgent';
      title = '其他直腸腫瘤 · T2–T4 · &gt; 2 cm 或淋巴結陽性<br>→ 根治性切除（三選一）';
      L.push(H('台大 NET-1 這一格逐字', 'p19 決策圖'));
      L.push('<b>三個並列選項</b>：' + SUB([
        '<b>Low anterior resection（低前位切除，LAR）</b>',
        '<b>Abdominoperineal Resection（腹會陰切除，APR）</b>',
        '<b>In selected cases, there may be a role for neoadjuvant or definitive chemoradiation' +
          '（選擇性病人可能有新輔助或根治性化放療的角色）</b>']));
      L.push('<b>三者依腫瘤位置、括約肌功能與病人條件由多專科團隊決定。</b>' +
        '<b>指引把化放療的措辭寫成「may be a role」與「in selected cases」，' +
        '語氣明顯比前兩項弱。</b>');
      L.push(H('❗這一格的追蹤是指引的缺口', ''));
      L.push('<b>台大 NET-1 的追蹤欄只連在「經肛門或內視鏡切除」那一格，' +
        '根治性切除這一條沒有寫追蹤排程。</b>' +
        '<b>可用的院外依據見下方追蹤區塊。</b>');
      L.push(H('已經有轉移的話', 'ENETS 2023 結腸直腸 §2.6'));
      L.push('<b>「It is common for larger rectal NET (&gt; 2 cm) to have distant metastases, ' +
        'particularly to the liver and bone.」</b>—— <b>&gt; 2 cm 的直腸 NET 常有遠端轉移，' +
        '尤其肝與骨。</b>');
      L.push('<b>原發灶要不要切，取決於有沒有局部症狀（疼痛、出血），' +
        '以及轉移病灶有沒有機會切除</b>（Level 5 grade D）。' +
        '<b>無症狀原發灶加無法切除的轉移，以全身治療控制腫瘤為優先。</b>');
      fuk = 'rectal_radical';
    }
    fill('nt_r_rectal', cls, title, L,
      '台大大腸直腸癌診療指引 版次 21 NET-1，第 19 頁決策圖（已 render PNG 逐格核對箭頭；' +
      '⚠ 第一個分岔是 T 分期而非腫瘤大小）。' + cat2A +
      '｜轉移性原發灶的處理補充自 ENETS 2023 結腸直腸（PMID 37345509）。',
      rectalEvalReference() + gradeReference());
    fu('nt_f_rectal', fuk);
  }

  function renderRectalR1() {
    var L = [], cls = 'rec-elective', title = '';
    L.push(H('❗台大 NET-1 沒有寫 R1 的處理', ''));
    L.push('<b>NET-1 只在「小型偶發、已完整切除（&lt; 1 cm）」那一支寫了「切緣不確定」' +
      '（indeterminate margins），沒有寫真正的 R1（切緣有腫瘤）該怎麼辦。' +
      '這一格全部依 ENETS 2023 結腸直腸指引（Level 3 grade C），屬院外實證。</b>');
    L.push('<b>為什麼這一格重要</b>：<b>「it is common to have an R1 resection of a rectal polyp, ' +
      'usually since it is not recognised this was a NET prior to polypectomy. This is a common ' +
      'reason for referral to a NET unit when the polyp has been resected elsewhere.」</b>' +
      '—— <b>當成息肉切掉才發現是 NET，是轉診到 NET 中心最常見的原因。</b>');
    L.push('❗<b>先確認到底算不算 R1</b>：<b>R1／R2 的定義是檢體顯示 NET 到達檢體本身的邊界；' +
      '<u>游離邊界 &lt; 1 mm 仍然算 R0</u>。</b>' +
      '<b>病理判不出來時應在報告中明確寫出，讓團隊先討論再決定下一步。</b>');

    if (S.r1size === 'gt2') {
      cls = 'rec-urgent';
      title = 'R1 切除 · 原本 &gt; 2 cm 或有不良特徵<br>→ 排除遠端轉移後做腫瘤學切除';
      L.push(H('主建議', 'ENETS 2023（Level 3 grade C）'));
      L.push('<b>「&gt; 2 cm or adverse features (higher G2 / G3; L1; V1): ' +
        'oncological resection after exclusion of distant metastases」</b>');
      L.push('<b>不良特徵的內容要寫出來</b>：' + SUB([
        '<b>較高的 G2 或 G3</b>', '<b>L1（lymphatic invasion）</b>',
        '<b>V1（vascular invasion）</b>']));
      L.push('<b>先做適當影像排除無法切除的遠端轉移，再做腫瘤學切除</b>' +
        '（低前位切除或腹會陰切除，見「其他所有直腸腫瘤」那一格）。');
      L.push('❗<b>&gt; 2 cm 的直腸 NET 常有遠端轉移，尤其肝與骨</b> —— ' +
        '<b>影像不能只做骨盆。</b>');
    } else if (S.r1size === 'mid') {
      title = 'R1 切除 · 原本 1–2 cm<br>→ 完整影像與內視鏡評估，適合就重做全層切除';
      L.push(H('主建議', 'ENETS 2023（Level 3 grade C）'));
      L.push('<b>「1–2 cm: full imaging and endoscopic work up. Repeat endoscopic resection if ' +
        'appropriate (full thickness)」</b>');
      L.push('<b>為什麼要積極</b>：<b>「there is a risk of recurrence at the site and in the ' +
        'pelvic LN」—— 原位與骨盆淋巴結都有復發風險。</b>');
      L.push('<b>具體要做的三件事</b>：' + SUB([
        '<b>仔細檢視切除處</b> —— 這個尺寸切除後的疤痕通常很容易看到',
        '<b>從切除處取切片</b>',
        '<b>做直腸 EUS 判斷切除處深部有沒有異常組織</b>']));
      L.push('<b>切除方式：由專家內視鏡醫師切除黏膜與黏膜下層到肌肉層，' +
        '或做內視鏡全層切除，或做經肛門手術。</b>');
      L.push('❗<b>這個尺寸一定要 en bloc 切</b> —— <b>「It is important for a lesion of this size ' +
        'that it is resected en bloc so that the pathologist can definitively say that there is ' +
        'now an R0 resection at the end of this second procedure.」</b>');
      L.push('❗<b>不適合內視鏡或手術切除的病人，可以在討論後採 watch and wait，' +
        '但必須說明「復發率未知，但很可能不是零」。</b>');
    } else {
      title = 'R1 切除 · 原本 &lt; 1 cm<br>→ 最好再切一次達到 R0；條件齊備時可以觀察';
      L.push(H('主建議', 'ENETS 2023（Level 3 grade C）'));
      L.push('<b>「&lt; 1 cm. Ideally: Second endoscopic resection or TAMIS to achieve R0, ' +
        'alternatively: if negative EUS, MRI and repeat biopsy: watch and wait after discussion ' +
        'with patient.」</b>');
      L.push('❗<b>先理解這一格的 R1 是怎麼來的</b>：' +
        '<b>「the usual situation is that the snare resects the tumour at or very close to the edge ' +
        'of the tumour and this is <u>technically</u> an R1 resection by oncological standards. ' +
        'This does <u>not necessarily</u> mean that there is tumour tissue remaining at the ' +
        'resection site.」</b>—— <b>技術上算 R1，但不一定真的有殘存腫瘤。</b>');
      L.push('<b>標準做法：仔細檢視切除處 ＋ 取切片 ＋ 可行時做該處的 EUS。</b>');
      L.push('<b>最安全的做法是再做一次內視鏡切除或 TAMIS，以避免任何可能的復發。</b>' +
        '❗<b>但指引直言「It is unclear whether re-resection of R1 resected small rectal NET ' +
        'affects long term outcome.」—— 再切對長期結果有沒有影響並不清楚。</b>');
      L.push('<b>採 watch and wait 的條件是 EUS、MRI 與重複切片都陰性，並與病人討論過。</b>' +
        '<b>此時要用軟式乙狀結腸鏡定期追蹤。</b>');
      L.push(EV('❗<b>韓國的大型系列（這個疾病在當地很常見）顯示：' +
        '兩年內的復發率接近 0。</b>指引同時提醒<b>「This does not necessarily mean that the ' +
        'recurrence rate is 0 for ever」</b>。<b>實務上復發多在同一位置且生長極慢，' +
        '復發時可以考慮全層切除；這些復發造成淋巴結與遠端轉移的機率極低。</b>'));
    }
    fill('nt_r_rectal', cls, title, L,
      'ENETS 2023 結腸直腸 NET（Rinke A et al. J Neuroendocrinol 2023;35(6):e13309，PMID 37345509）' +
      '§2.5（Level 3 grade C）。<b>台大 NET-1 未涵蓋 R1 切除的處理，本段全部屬院外實證。</b>',
      rectalEvalReference());
    fu('nt_f_rectal', 'rectal_endo');
  }

  function renderAppendix() {
    show('nt_b_appendix', true);
    fill('nt_r_appendix', 'rec-nonop',
      '闌尾 NET<br>→ 請看「闌尾癌」分頁，那邊已依 ASCRS 2025 與 ENETS 2023 做好',
      [H('為什麼放在闌尾癌分頁', ''),
      '<b>闌尾 NET 的手術決策（要不要補做右半結腸切除）與其他 GEP-NET 部位的邏輯不同，' +
        '而且與闌尾的上皮性腫瘤共用同一套術前評估與病理複閱原則</b>，' +
        '<b>所以整套做在闌尾癌分頁的「神經內分泌腫瘤 aNET」分支裡。</b>',
      '<b>那邊涵蓋：大小門檻（&lt; 1 cm／1–2 cm／&gt; 2 cm）、完整的不良特徵清單、' +
        '術前評估（含 Ga-DOTA PET 的三個適應症）、生化檢查要不要做、追蹤，' +
        '以及台灣的健保入口。</b>',
      H('這裡先講三個最容易記錯的門檻', ''),
      '<b>&gt; 2 cm → 右半結腸切除加區域淋巴結廓清（淋巴結轉移率可達 40%）。</b>',
      '<b>&lt; 1 cm 且無不良特徵 → 闌尾切除加完整切除 mesoappendix 就夠了，' +
        '長期無病存活 100%。</b>（注意是「加完整 mesoappendix」，不是單純闌尾切除。）',
      '<b>1–2 cm → 有爭議，要個案判斷。</b>❗<b>而且文獻上同時存在三個門檻：' +
        '1 cm、1.5 cm、2 cm；Ki-67 的門檻 PSOGI 用 2%、ASCRS 用 3%</b> —— ' +
        '<b>落在 2–3% 之間兩套指引會給不同答案。</b>',
      H('本頁與闌尾癌分頁共通的部分', ''),
      '<b>轉移或無法切除時的全身治療、PRRT、肝臟導向治療、荷爾蒙症狀控制，' +
        '兩邊用的是同一套台大 NE-x 章節</b> —— ' +
        '<b>請回步驟 1 選「任何部位，已轉移或無法切除」或「要處理功能性症狀」。</b>',
      '❗<b>類癌症候群的原發灶就是「小腸與闌尾」</b>（台大 NE-E），' +
        '<b>所以闌尾 NET 的病人出現 flushing 與腹瀉時要想到這件事。</b>'],
      '闌尾 NET 的完整流程見本站「闌尾癌」分頁（依 ASCRS 2025，PMID 40262165；' +
      'ENETS 2023 aNET，PMID 37682701 —— ⚠該文摘要不含任何大小門檻數字，' +
      '門檻一律標 ASCRS 2025 的條文）。跨部位通則見台大 NE-D／NE-E／NE-F／NE-H。',
      gradeReference() + biochemReference());
  }

  function renderAdv() {
    show('nt_b_adv', true);
    show('nt_n_line', true);
    if (!S.line) return;
    show('nt_n_sstr', true);
    if (!S.sstr) return;
    /* Ki-67 只在「第一線 ＋ SSTR 陽性」才影響建議（要不要直接上 PRRT）。
       SSTR 陰性時答案是 everolimus，與 Ki-67 無關 —— 不要問答案不會改變的問題。 */
    if (S.line === 'l1' && S.sstr === 'pos') { show('nt_n_ki67', true); if (!S.ki67) return; }

    var L = [], cls = 'rec-elective', title = '';
    var pos = S.sstr === 'pos';

    L.push(H('❗先看兩句台大 NE-H 的通則，它們會改變你怎麼讀下面的建議', ''));
    L.push('<b>「Currently, there are <u>no data to support a specific sequence</u> of regional ' +
      'versus systemic therapy, and no data to guide sequencing of the following systemic therapy ' +
      'options.」</b>—— <b>線別只是常見走法，不是有證據的固定順序。</b>');
    L.push('<b>「There is no known role for systemic treatment in the <u>adjuvant</u> setting ' +
      'for NETs.」</b>—— <b>根治性切除後不做輔助全身治療。</b>');
    L.push('<b>而且全身治療不是每個晚期病人都適合</b>：台大 NE-H 明列可考慮的替代選項為' +
      '<b>「腫瘤負荷輕且穩定者觀察」、局部區域治療、減積手術</b>，' +
      '<b>建議多專科討論後決定。</b>');

    if (S.line === 'l1') {
      if (pos && S.ki67 === 'hi') {
        title = '第一線 · SSTR 陽性 · Ki-67 ≥ 10% 或腫瘤負荷明顯<br>' +
          '→ 可以直接用 PRRT；但台灣的藥證與健保都卡在這一格';
        L.push(H('主建議', '台大 NE-H Preferred；ENETS 2024（A-1b）'));
        L.push('<b>台大 NE-H 的 Preferred 欄裡有一項就是這一格</b>：' +
          '<b>「First-line PRRT with lutetium Lu 177 dotatate（if SSTR-positive, Ki-67 ≥ 10%, ' +
          'and clinically significant tumor burden）」</b>。');
        L.push('<b>依據是 NETTER-2</b>：<b>新診斷、SSTR 陽性、G2 或 G3（Ki-67 ≥ 10% 且 ≤ 55%）的' +
          '晚期 GEP-NET（29.2% 為小腸來源），Lu-177 dotatate 對比高劑量 octreotide —— ' +
          '中位 PFS 22.8 vs 8.5 個月，分層 HR 0.276（95% CI 0.182–0.418，p &lt; 0.0001），' +
          'ORR 43.0% vs 9.3%。</b>');
        L.push('<b>ENETS 2024 對這一格的措辭</b>：<b>Ki-67 &gt; 10% 的 G2 病人，' +
          'everolimus（A-1b）與 PRRT（A-1b）都是選項</b>；' +
          '<b>PRRT 特別適合腫瘤負荷高者</b>。' +
          '❗<b>但同時提醒 NETTER-2 收的病人是高度選擇的</b> —— ' +
          '<b>「patients who could have been randomised to high-dose SSA and therefore ' +
          '<u>not in need of urgent reduction of tumour burden</u> or other more aggressive ' +
          'therapies」。</b>');
        L.push('<b>替代選項：SSA（octreotide LAR 或 lanreotide）仍然可以當第一線</b>，' +
          '尤其在生長慢或不急著減量的情況。<b>ENETS 2024 也說 SSA 在 Ki-67 &gt; 10% 的角色' +
          '「less clear」，快速進展或高負荷時需要更強的治療。</b>');
        L.push('❗<b>台灣在這一格有兩層落差，決策前一定要先確認</b>：' + SUB([
          '<b>藥證：Lutathera（衛部藥輸字第 R00104 號）的適應症要求「經體抑素類似物治療無效」' +
            '且限「分化良好 G1 及 G2」 → <u>第一線 PRRT 與 NET G3 都不在藥證範圍內</u></b>',
          '<b>健保：完全不給付 —— 藥品給付規定查無條文，支付標準 6,010 個項目也查無 ' +
            'PRRT 或 SSTR-PET 的代碼</b>',
          '<b>而 SSTR-PET 本身又是 PRRT 的必要適格條件 → 兩件事都要自費</b>']));
        L.push('<b>所以務實的路是</b>：<b>先確認 SSTR-PET 已完成（自費）→ ' +
          '評估病人能否負擔 PRRT 自費 → 不能負擔時，第一線用健保給付的 SSA' +
          '（octreotide LAR 5.4.4.3 或 lanreotide 5.4.6.3），並密切追蹤。</b>');
      } else if (pos) {
        title = '第一線 · SSTR 陽性 · Ki-67 &lt; 10% 且腫瘤負荷不大<br>→ SSA 是首選（也可以先觀察）';
        L.push(H('主建議', '台大 NE-H Preferred；ENETS 2024（A-1b）'));
        L.push('<b>Octreotide LAR 或 lanreotide 是首選</b>' +
          '（台大 NE-H Preferred 欄；ENETS 2024 A-1b）。' +
          '<b>劑量：octreotide LAR 20–30 mg IM 或 lanreotide 120 mg SC，每 4 週一次。' +
          '突發症狀可考慮 octreotide 100–250 mcg SC TID。</b>');
        L.push('<b>兩個試驗的定位不同，要分清楚</b>：' + SUB([
          '<b>PROMID</b>：收的是<u>治療未曾用藥</u>的 midgut NET，多數為 NET G1，' +
            '證實 <b>octreotide LAR 對晚期 midgut NET 有抗腫瘤效果</b>',
          '<b>CLARINET</b>：收的是<u>非功能性</u>、SSTR 陽性、<b>Ki-67 最高到 10%</b> 的晚期 GEP-NET，' +
            '<b>幾乎所有病人在開始治療時都是穩定的</b>，證實 lanreotide 有抗腫瘤效果']));
        L.push('❗<b>兩個試驗都只證實延長 time to progression 與 PFS，' +
          '沒有證實整體存活的效益</b> —— ' +
          '<b>但絕大多數安慰劑組病人在進展後跨組去用了開放標示的 SSA。</b>' +
          '<b>SSA 的客觀反應（腫瘤縮小）很罕見；生活品質可維持甚至改善。</b>');
        L.push('<b>沒有哪一種 SSA 被證實優於另一種。</b>' +
          '<b>注射處相關併發症時可考慮換另一種 SSA。</b>');
        L.push('❗<b>這一格也可以先不給藥</b>：<b>ENETS 2024 —— G1、無症狀、低腫瘤負荷且穩定的病人' +
          '可以採 watch and wait，等到進展再開始 SSA</b>（B-2b）。' +
          '<b>依據是 CLARINET 顯示 lanreotide 在從安慰劑跨組過來的進展病人身上仍有抗增生活性。</b>');
        L.push('<b>副作用大多是短暫的腸胃道症狀</b>；' +
          '❗<b>病人可能出現胰臟外分泌功能不足與脂肪便，此時要給胰酵素補充。</b>' +
          '這一點常被漏掉而誤判為腫瘤惡化。');
        L.push('<b>台灣健保走得通</b>：<b>octreotide 長效型 5.4.4.3「晚期間腸 NET」' +
          '（第 3 項每次 30 mg、間隔四週）；lanreotide 5.4.6.3「胃、腸、胰 GEP-NET」' +
          '（每月 120 mg 一針）。兩者都需事前審查，每次核准一年。</b>');
      } else {
        title = '第一線 · SSTR 陰性<br>→ SSA 沒有作用機轉，直接用 everolimus';
        L.push(H('❗先確認不是偽陰性', 'ENETS 2024'));
        L.push('<b>約 10% 分化良好的 Si-NET 不表現 SST。</b>' +
          '<b>病灶小於 1 cm 時應該做 SSTR-PET/CT（而非 SPECT）以排除偽陰性病灶。</b>');
        L.push('<b>SSTR 陽性的定義是「可測量病灶的吸收高於肝臟」</b>（台大 NE-D）；' +
          '<b>SSTR-PET 要與雙時相對比 CT 或 MRI 一起做</b>，' +
          '因為對比影像正是用來抓 SSTR 陰性病灶的。');
        L.push(H('主建議', 'ENETS 2024（A-1b）'));
        L.push('<b>「in patients with tumour lesions… Therefore, in patients with SST negative ' +
          'disease other treatment strategies are needed.」—— SSA 的抗增生作用是透過結合 SST 達成的，' +
          'SSTR 陰性就沒有這個機轉。</b>');
        L.push('<b>Everolimus 10 mg 每日口服</b>（A-1b）。' +
          '<b>ENETS 2024：在缺乏或不足的 SST 表現、且沒有類癌症候群的病人，' +
          'everolimus 是進展性 G1／G2 的首選。</b>' +
          '<b>台大 NE-H 也把 everolimus 列在 Preferred 欄（非功能性腫瘤為 category 1）。</b>');
        L.push('<b>RADIANT-4 的數字</b>：<b>302 例 GI 與肺 NET，中位 PFS 11 vs 3.9 個月' +
          '（HR 0.48），GI 次群 HR 0.56；反應率 &lt; 10%。</b>' +
          '❗<b>事後分析發現反應不一致，對 indolent 的 Si-NET 效益有限。</b>');
        L.push('❗<b>ORR &lt; 10% 這件事要放進期待管理</b> —— ' +
          '<b>「those patients with significant symptoms from large volume disease may not benefit ' +
          'symptomatically」。腫瘤量大而症狀明顯的病人不太可能靠 everolimus 緩解症狀。</b>');
        L.push('<b>常見毒性：stomatitis、感染、糖尿病、腹瀉、pneumonitis</b> —— ' +
          '<b>需要密切追蹤與積極的副作用管理。</b>');
        L.push('❗<b>另一個選項是 interferon-α</b>（ENETS 2024 A-2b），' +
          '<b>但指引自己註明「The use of IFN-α is limited due to lack of availability」，' +
          '而台灣健保條文（4.3.5、8.2.6.2）是 B／C 型肝炎，沒有 NET 適應症。</b>');
        L.push('<b>台灣健保</b>：<b>everolimus 9.36.1.3 限「胃腸道或肺部來源之<u>非功能性</u>NET」，' +
          '三個條件要同時符合：分化良好、過去 12 個月影像持續惡化、不可合併化療或其他標靶。' +
          '每次審查 3 個月、每日最多 10 mg。</b>' +
          '❗<b>「非功能性」是硬條件 —— 有類癌症候群的病人套不進這一條。</b>');
        L.push('<b>局部區域治療也可以放在前面</b>：台大 NE-H／ENETS 2024 都提到' +
          '<b>「locoregional therapies could be considered upfront」</b>，' +
          '肝臟為主的病灶尤其如此。<b>見下方肝臟導向治療橫列。</b>');
      }
    } else if (S.line === 'l2') {
      if (pos) {
        title = 'SSA 之後進展 · SSTR 陽性<br>→ PRRT 是標準第二線（台灣要自費）';
        L.push(H('主建議', '台大 NE-H Preferred；ENETS 2024（A-1b）'));
        L.push('<b>台大 NE-H</b>：<b>「PRRT with lutetium Lu 177 dotatate（if SSTR-positive and ' +
          'progression on octreotide LAR/lanreotide）」，且對<u>進展性 midgut 腫瘤是 category 1</u>。</b>');
        L.push('<b>ENETS 2024</b>：<b>「PRRT is therefore considered the standard second-line ' +
          'treatment option in the presence of homogenous SST-positive disease」</b>（A-1b）。');
        L.push('<b>NETTER-1 的數字</b>：<b>晚期進展性 Si-NET 隨機分到 Lu-177 dotatate ' +
          '（4 個 cycle，每 8 週）加 octreotide LAR 30 mg 每 28 天，對比高劑量 octreotide LAR ' +
          '60 mg 每 4 週 —— PFS 的 HR 0.21（p &lt; 0.001），中位 PFS 超過 28 個月，' +
          '生活品質改善（整體健康、體能與角色功能），腹瀉、疼痛、疲倦的惡化時間也延長。</b>');
        L.push('❗<b>但腫瘤縮小很少</b>：<b>NETTER-1 的 ORR 只有 18%</b>。' +
          '<b>最後一位病人收案後 5 年的最終分析沒有新的長期安全訊號，' +
          '但有 2% 的病人發生骨髓分化不良症候群（MDS）；腎臟副作用可能發生但通常輕微。</b>');
        L.push('❗<b>PRRT 之後要不要維持 SSA 沒有定論</b>：' +
          '<b>NETTER-1 之後接的是標準劑量 octreotide LAR，但（在沒有類癌症候群的情況下）' +
          '維持 SSA 是否優於單純觀察並未證實。有回溯資料支持其附加價值。' +
          '腫瘤負荷高者應給維持治療。</b>');
        L.push('❗<b>SSA 與 PRRT 的時間安排不能弄錯</b>（台大 NE-J）：' +
          '<b>每次 PRRT 前 4 週不可給長效 SSA；短效 SSA 至少治療前 24 小時停；' +
          '兩者都可在治療後 4–24 小時恢復。</b>理由是兩者競爭 SSTR 結合。' +
          '<b>詳細操作見下方 PRRT 橫列。</b>');
        L.push('<b>替代選項（在拿不到 PRRT 時特別重要）</b>：' + SUB([
          '<b>Everolimus</b>（台大 NE-H Preferred；ENETS 2024 A-1b）—— ' +
            '<b>ENETS 建議放在 PRRT 之後，但也承認缺乏前瞻隨機試驗資料</b>',
          '<b>超劑量 SSA</b>（台大 NE-H「Useful in Certain Circumstances」；ENETS B-2）—— ' +
            '<b>octreotide LAR 最多每月 60 mg、lanreotide 最多每 14 天 120 mg</b>',
          '<b>Cabozantinib</b>（台大 NE-H Preferred，用過 everolimus 或 PRRT 之後為 category 1）' +
            ' —— ❗<b>但台灣健保 9.74 只寫腎細胞癌與甲狀腺癌，NET 沒有入口</b>']));
        L.push('❗<b>超劑量 SSA 的實際數字要知道，才不會期待過高</b>：' +
          '<b>NETTER-1 對照組的 octreotide 60 mg/月中位 PFS 只有 8.4 個月；' +
          'CLARINET FORTE 的 lanreotide 120 mg 每 14 天在 midgut 世代中位 PFS 8.3 個月' +
          '（Ki-67 ≤ 10% 者 8.6 個月），中位反應持續 13.8 個月。</b>' +
          '<b>它適合生長慢、低增生、低負荷，或 PRRT 有禁忌（嚴重腎功能不良、骨髓功能差）的人 —— ' +
          '目的是延後更毒的治療。</b>');
        L.push('❗<b>進展時 SSA 要停還是留</b>（台大 NE-H 註 a）：' +
          '<b>臨床上顯著惡化時，<u>非功能性</u>腫瘤應停掉 octreotide LAR／lanreotide，' +
          '<u>功能性</u>腫瘤要繼續</b>；這些藥可以與後續任何選項併用。');
      } else {
        title = 'SSA 之後進展 · SSTR 陰性<br>→ Everolimus';
        L.push(H('主建議', 'ENETS 2024（A-1b）'));
        L.push('<b>「following progression on SSA, treatment with PRRT for patients with SST positive ' +
          'tumour lesions and <u>everolimus for patients with SST negative lesions</u> are the most ' +
          'likely scenarios.」</b>');
        L.push('<b>Everolimus 10 mg 每日口服。RADIANT-4：中位 PFS 11 vs 3.9 個月（HR 0.48），' +
          'GI 次群 HR 0.56；ORR &lt; 10%。</b>' +
          '❗<b>事後分析對 indolent Si-NET 效益有限。</b>');
        L.push('<b>常見毒性：stomatitis、感染、糖尿病、腹瀉、pneumonitis。</b>');
        L.push('❗<b>台灣健保 9.36.1.3 的三個硬條件</b>：<b>① 分化良好；' +
          '② 過去 12 個月影像持續惡化（RECIST 定義）；③ 不可合併化療或其他標靶藥物。' +
          '每次審查 3 個月、每日最多 10 mg，而且「非功能性」是硬條件。</b>');
        L.push('<b>替代選項</b>：<b>TKI（cabozantinib、lenvatinib、pazopanib、axitinib）在 ' +
          'SST 表現低或沒有的病人可以考慮</b>（ENETS 2024 C-2b）—— ' +
          '❗<b>但歐洲尚未核准 TKI 用於小腸 NET，台灣健保也沒有 NET 的入口。</b>');
        L.push(EV('<b>Axitinib 加 octreotide LAR 在胰外 NET 的隨機第三期，' +
          '中央判讀顯示延長中位 PFS，但在當作主要終點的局部影像判讀未達統計顯著。' +
          'Cabozantinib 的隨機第三期則已證實延長 PFS，核准仍待定。</b>'));
        L.push('❗<b>肝臟為主的病灶不要忘記局部區域治療</b> —— ' +
          '<b>台大 NE-K 的栓塞適應症包含「在 SSA 或其他全身治療下進展」，' +
          '而且腫瘤負荷大者可不必等到進展就做。詳見下方橫列。</b>');
      }
    } else {
      cls = 'rec-urgent';
      title = '再後線（PRRT 或 everolimus 之後）<br>→ 沒有標準答案，要看用過什麼與現在的特徵';
      L.push(H('指引怎麼說', 'ENETS 2024'));
      L.push('<b>「Third-line therapy following these are more difficult to state and may rely on ' +
        'prior treatment and specific characteristics at the time of progression, making discussion ' +
        'in a multidisciplinary team of huge relevance.」</b>' +
        '—— <b>沒有標準第三線，多專科討論的重要性在這一格最高。</b>');
      L.push(H('可用的選項', ''));
      L.push('<b>Cabozantinib</b>：<b>台大 NE-H 把它列在 Preferred 欄，' +
        '而且「<u>用過 everolimus 或 lutetium Lu 177 dotatate 之後為 category 1</u>」 —— ' +
        '這正是這一格的情境。</b>' +
        '❗<b>但台灣健保 9.74 的條文只寫腎細胞癌（108/12/1）與甲狀腺癌（114/8/1），' +
        'NET 完全沒有入口。</b>');
      if (pos) {
        L.push('<b>PRRT 再挑戰（rechallenge）</b>（ENETS 2024 C-4）：' +
          '<b>持續有均質 SST 表現時有很強的理由再做。' +
          '共識是「上次最後一個 cycle 之後疾病控制至少 9–12 個月」才考慮，' +
          '再給 2 個 cycle；若之後再進展且間隔又超過 12 個月、耐受良好，可以再重複一次。</b>');
        L.push(EV('<b>統合分析（5 篇、272 人）：再挑戰的 pooled 中位 PFS 12.26 個月' +
          '（初次只用 177Lu-DOTATATE 者為 13.4 個月）；兩篇報告的中位 OS 自再治療起算 26.8 個月。' +
          '安全性與初次治療相似，3 或 4 級血液毒性 9%，無 3 或 4 級腎毒性。</b>'));
      }
      L.push('<b>超劑量 SSA</b>（台大 NE-H「Useful in Certain Circumstances」）：' +
        '<b>標準劑量下進展且 SSTR 陽性時，octreotide LAR 可到每月 60 mg、' +
        'lanreotide 可到每 14 天 120 mg。</b>' +
        '<b>也適合 PRRT 有禁忌（嚴重腎功能不良、骨髓功能差）或不能用 everolimus 的人。</b>');
      L.push('<b>局部區域與肝臟導向治療</b>：' +
        '<b>台大 NE-H 沒有給區域治療與全身治療的先後順序（明文「no data」），' +
        '所以這一格可以隨時插入。肝臟為主、無法切除的病灶符合栓塞適應症。</b>');
      L.push(H('❗化療在腸道 NET 的位置很後面，而且台灣拿不到組合', ''));
      L.push('<b>台大 NE-H 把細胞毒性化療放在「Useful in Certain Circumstances」，' +
        '而且明文「if no other options feasible」、<u>全部是 category 3</u></b>：' +
        '<b>5-FU、capecitabine、dacarbazine、oxaliplatin、temozolomide 可用於進展性疾病。</b>');
      L.push('<b>ENETS 2024 的數字更直接</b>：<b>G1／G2 小腸 NET 的化療 ORR 只有 11.5%' +
        '（範圍 5.8%–17.2%）</b>。' +
        '<b>只有在 G2 且 Ki-67 15%–20%、或 NET G3、或臨床與影像快速進展、' +
        '或其他選項都被排除時才有效益</b>（C-3）。' +
        '<b>建議的方案是 CAPTEM（capecitabine ＋ temozolomide）或 FOLFOX。</b>');
      L.push('❗<b>用 5-FU 或 capecitabine 前建議驗 DPD</b>（ENETS 2024）—— ' +
        '<b>DPD 缺乏者代謝差，驗到要減量。</b>');
      L.push('❗<b>台灣的落差在這一格最嚴重</b>：' + SUB([
        '<b>temozolomide 健保 9.25 只寫腦瘤（復發的 anaplastic astrocytoma、GBM、' +
          'anaplastic oligodendroglioma，及新診斷 GBM 併放療），NET 完全沒有列名，且需事前審查</b>',
        '<b>capecitabine 9.17 的條文是乳癌、結腸直腸癌、胃癌，NET 沒有列名</b>',
        '<b>→ CAPTEM 用於 NET 在台灣是藥證外加健保外，兩個藥都要自費或走個案事前審查</b>']));
      L.push('<b>台大 NE-H 另有一項少見但可用的選項</b>：' +
        '<b>「Consider RT ± concurrent fluoropyrimidine-based chemotherapy for locally advanced ' +
        'unresectable disease」</b> —— ❗<b>但明文排除小腸腸繫膜病灶' +
        '（excluding small bowel mesenteric）。</b>');
      L.push('<b>臨床試驗</b>：<b>ENETS 2024 對 NET G3 的立場是「should preferentially be enrolled ' +
        'in clinical trials」；COMPOSE（PRRT vs 醫師選擇的 everolimus 或化療）與 COMPETE' +
        '（everolimus vs 177Lu-edotreotide）都在進行中。</b>');
    }

    fill('nt_r_adv', cls, title, L,
      '台大 NE-H 1 OF 9 胃腸道 NET（分化良好 G1／G2）全身治療（收錄於胰臟神經內分泌腫瘤診療指引 ' +
      '版次 02；三欄歸屬已 render 圖檔逐欄核對）；ENETS 2024 小腸 NET（PMID 38977327）§5、§6；' +
      'ENETS 2023 結腸直腸（PMID 37345509）§2.7。' +
      '藥證與健保查詢日 2026-08-17（食藥署許可證資料集；藥品給付規定 115.4.23 版；' +
      '支付標準開放資料，資料更新日 2026-08-12）。',
      systemicReference() + prrtReference() + liverReference() + nhiReference());
    fu('nt_f_adv', 'adv');
  }

  function renderNec() {
    show('nt_b_nec', true);
    fill('nt_r_nec', 'rec-urgent',
      '分化差的神經內分泌癌（NEC）或混合型（MiNEN）<br>→ 不走任何 NET 流程，走 PDNEC-1',
      [H('❗先確認分類沒有搞錯', '台大 PDNEC-1A 註 c'),
      '<b>「並非所有 Ki-67 &gt; 20% 者皆為分化差」</b> —— ' +
        '<b>Ki-67 &gt; 20% 同時見於 NET G3（仍屬分化良好）與 NEC（分化差），' +
        '不能只憑 Ki-67 判斷，必須依形態學的分化程度區分。</b>',
      '<b>兩者的預後與治療完全不同</b>：<b>NEC 走白金加 etoposide，NET G3 不走。' +
        '如果病理其實是 NET G3，請回步驟 1 選部位或「已轉移或無法切除」。</b>',
      H('台大有這一份流程，但要知道它在哪', ''),
      '<b>流程頁是 PDNEC-1 與 PDNEC-1A，收錄在台大<u>胰臟</u>神經內分泌腫瘤診療指引 版次 02' +
        '（第 20–21 頁）。</b>',
      '❗<b>但它的標題是「<u>Extrapulmonary</u> Poorly Differentiated: Neuroendocrine Carcinoma／' +
        'Large or Small Cell Carcinoma／Mixed Neuroendocrine-Non-neuroendocrine Neoplasm」</b> —— ' +
        '<b>適用範圍是所有<u>肺外</u>部位（含胃、十二指腸、空腸-迴腸、闌尾、結直腸、胰臟），不限胰臟。</b>' +
        '<b>本頁把它放在胰臟分支下，只是因為出處是那份文件。</b>',
      '<b>要查完整流程與處方，請在步驟 1 選「胰臟」，再於該流程的步驟 1 選' +
        '「分化差 · NEC／MiNEN」。</b>',
      H('分期要換一套', ''),
      '❗<b>NEC 與 MiNEN 不適用 NET 的六套分期表</b>（胃／十二指腸-壺腹／空腸-迴腸／闌尾／' +
        '結直腸／胰），<b>須改用該部位<u>癌症（adenocarcinoma）</u>的分期系統。</b>' +
        '<b>詳見本頁「分期 TNM」分頁的說明。</b>',
      H('處方骨架', '台大 NE-H；ENETS 2023 消化道 NEC'),
      '<b>白金為基礎加 etoposide</b>（同小細胞癌的做法）—— <b>cisplatin 或 carboplatin ＋ etoposide</b>。',
      '❗<b>ENETS 2024 對 NET G3 特別提醒一件容易搞混的事</b>：' +
        '<b>NET G3（分化良好）用的是 adenocarcinoma-like 與 alkylating 為基礎的化療' +
        '（' + NR('temozolomide') + ' 加 ' + NR('capecitabine') + ' 或 FOLFOX），' +
        '<u>而 etoposide-platinum 在 NET G3 的療效很差</u>。</b>' +
        '<b>白金加 etoposide 是給 NEC 的，不是給 NET G3 的。</b>',
      H('影像的分工', '台大 NE-D'),
      '<b>FDG-PET 應考慮用於已證實 G2 以上的 NET 或 NEC</b>；' +
        '<b>FDG-PET 與雙時相肝臟 CT 或 MRI 併用為佳。</b>',
      '<b>FDG-PET 與 SSTR-PET 合併評分的預後價值優於病理分級</b>，即使在較低分級的腫瘤也是。',
      H('台灣的用藥狀況', '查詢日 2026-08-17'),
      '<b>cisplatin、carboplatin、etoposide 都是台大處方集常備品項</b>；' +
        '這一格的處方障礙比 NET 少得多。',
      '❗<b>但要注意 NEC 不適用 NET 的健保條文</b> —— ' +
        '<b>' + NR('octreotide') + ' 5.4.4、' + NR('lanreotide') + ' 5.4.6、' +
        NR('everolimus') + ' 9.36.1 的條文都寫「分化良好」或「神經內分泌瘤」，NEC 套不進去。</b>' +
        '<b>這三個藥在這一格<u>不是</u>治療選項。</b>'],
      '台大 PDNEC-1／PDNEC-1A（收錄於胰臟神經內分泌腫瘤診療指引 版次 02 第 20–21 頁，' +
      '標題明載「Extrapulmonary」，適用所有肺外部位）；台大 NE-D 影像與 NE-H 全身治療；' +
      'ENETS 2023 消化道神經內分泌癌（PMID 36924180）；' +
      'NET G3 與 NEC 的化療差異見 ENETS 2024 小腸 NET（PMID 38977327）§5。',
      gradeReference() + imagingReference());
  }

  function renderSym() {
    show('nt_b_sym', true);
    show('nt_n_syn', true);
    if (!S.syn) return;

    var L = [], cls = 'rec-elective', title = '';
    L.push(H('先確認一件事', '台大 NE-L'));
    L.push('<b>「Medical, surgical, and interventional treatments that effectively cytoreduce ' +
      'secretory tumours are likely to also palliate hormonal symptoms.」</b>' +
      '—— <b>能有效減積的治療（含手術與局部治療）本身就會緩解荷爾蒙症狀。' +
      '下面講的是非細胞毒性的症狀控制手段。</b>');

    if (S.syn === 'cs') {
      title = '類癌症候群（flushing、腹瀉、瓣膜纖維化）<br>→ SSA 為主；還要主動找類癌心臟病';
      L.push(H('診斷', '台大 NE-E'));
      L.push('<b>原發灶在小腸與闌尾，直腸罕見。</b>' +
        '<b>胃腸道原發灶通常不會有荷爾蒙過度分泌的症狀，除非已廣泛轉移。</b>');
      L.push('<b>症狀：flushing、diarrhea、心臟瓣膜纖維化、bronchoconstriction。</b>' +
        '<b>檢查：24 小時尿或血漿 5-HIAA。</b>');
      L.push('❗<b>檢查前 48 小時與檢查期間要避開這些食物</b>（否則會偽陽性）：' +
        '<b>酪梨、香蕉、哈密瓜、茄子、鳳梨、李子、番茄、山核桃／胡桃、大蕉、奇異果、' +
        '椰棗、葡萄柚、蜜瓜、核桃。</b>');
      L.push(H('症狀控制', '台大 NE-H 註 e；ENETS 2022'));
      L.push('<b>SSA 是第一線：octreotide LAR 20–30 mg IM 或 lanreotide 120 mg SC，每 4 週一次。</b>');
      L.push('<b>突發症狀（breakthrough）：octreotide 100–250 mcg SC TID 可以考慮。</b>' +
        '<b>短效 octreotide 可以加在長效上，用來快速緩解或處理突發症狀。</b>');
      L.push('<b>標準劑量下仍有症狀 → 超劑量：octreotide LAR 最多每月 60 mg、' +
        'lanreotide 最多每 14 天 120 mg</b>（台大 NE-H 註 h；限 SSTR 陽性）。');
      L.push('❗<b>SSA 控制不住的腹瀉，指引上的下一步是 telotristat —— ' +
        '但台灣完全沒有藥證</b>（食藥署許可證資料集逐筆檢索 0 筆）。' +
        '<b>' + NR('telotristat') + ' 在台灣自費也買不到，只能走專案進口或臨床試驗。</b>');
      L.push('❗<b>' + NR('everolimus') + ' 不要用來處理類癌症候群</b> —— ' +
        '<b>台大 NE-H 註 b 明文「Effectiveness of ' + NR('everolimus') + ' in the treatment of ' +
        'patients with carcinoid syndrome has not been established」，' +
        '而且第三期試驗是做在<u>非功能性</u>腫瘤（註 c）。</b>' +
        '❗<b>台灣健保 9.36.1.3 也把「非功能性」寫成硬條件，這一格套不進去。</b>');
      L.push('<b>PRRT 可能減輕功能性 NET 的症狀</b>（台大 NE-J）；' +
        '<b>NETTER-1 顯示 PRRT 延長了腹瀉、疼痛與疲倦的惡化時間。</b>');
      L.push('<b>肝臟導向治療對這一格特別有用</b>：<b>台大 NE-K —— 栓塞在有荷爾蒙症候群的病人' +
        '症狀緩解率約 85%</b>（影像反應率平均約 60%）。' +
        '❗<b>栓塞前要給短效 octreotide，並過夜觀察栓塞後症候群與荷爾蒙症狀加劇。</b>');
      L.push(H('❗兩個會出人命的地方', ''));
      L.push('<b>① Carcinoid crisis</b>：<b>有類癌症候群的病人，麻醉誘導前應考慮先給非腸道' +
        '（parenteral）octreotide 以預防 carcinoid crisis</b>（台大 NE-F）。' +
        '<b>PRRT 也可能誘發荷爾蒙危機或類癌危機（flushing、腹瀉、低血壓、bronchoconstriction），' +
        '要事先告知</b>（台大 NE-J）。');
      L.push('<b>② 類癌心臟病</b>：<b>心臟超音波要包含瓣膜形態（尤其三尖瓣與肺動脈瓣）、' +
        '右心大小與功能；有瓣膜疾病時要做攪動生理食鹽水注射看有沒有心房層面分流。</b>' + SUB([
        '<b>沒有已知類癌心臟病者：有呼吸困難／疲倦／水腫／腹水症狀，或理學檢查有頸靜脈壓上升／' +
          '水腫／腹水，或<u>計畫做腸／肝切除之前</u>，以及每 1–3 年重新評估</b>',
        '<b>已知類癌心臟病（不論有沒有換過瓣）：每年評估所有瓣膜並會診心臟科</b>',
        '❗<b>有顯著類癌心臟病時，只要有可能就在肝切除之前先換瓣</b>（台大 NE-F）']));
    } else if (S.syn === 'insulin') {
      cls = 'rec-urgent';
      title = 'Insulinoma（低血糖）<br>→ ❗沒有 SSTR 就不能用 SSA，會讓低血糖更嚴重';
      L.push(H('診斷', '台大 NE-E'));
      L.push('<b>位置在胰臟。驗空腹血糖；低血糖當下驗 serum insulin、pro-insulin、C-peptide。</b>' +
        '<b>完整評估流程見胰臟 NET 流程的 PanNET-5（步驟 1 選「胰臟」）。</b>');
      L.push(H('❗這一格最重要的一句話', '台大 NE-L'));
      L.push('<b>「Octreotide LAR or lanreotide can be considered <u>but only if tumour expresses ' +
        'SSTRs</u>. <u>In the absence of SSTRs, octreotide LAR or lanreotide can profoundly worsen ' +
        'hypoglycaemia.</u>」</b>');
      L.push('<b>—— 用 SSA 之前一定要先確認腫瘤表現 SSTR。沒有 SSTR 而給 SSA，' +
        '會嚴重惡化低血糖。</b><b>這是全頁最需要注意的用藥安全點。</b>' +
        '<b>SSTR 陽性的定義是病灶吸收高於肝臟</b>（台大 NE-D）。');
      L.push(H('第一線的症狀控制', '台大 NE-L'));
      L.push('<b>用飲食穩定血糖，並／或使用 diazoxide 或 everolimus。</b>' +
        '<b>這兩個不依賴 SSTR，所以在 SSTR 陰性時是比 SSA 安全的選擇。</b>');
      L.push('<b>Everolimus 在這一格有雙重作用</b>（抗腫瘤加升血糖）；' +
        '❗<b>但台灣健保 9.36.1.3 限「胃腸道或肺部來源之非功能性 NET」 —— ' +
        '功能性的 insulinoma 而且是胰臟來源，兩個條件都不符合，健保套不進去。</b>');
      L.push('<b>手術是根治的方向</b>（台大 NE-F）：<b>Insulinoma 優先考慮摘除（enucleation）—— ' +
        '症狀明顯但很少惡性；周邊的 insulinoma 在技術可行時考慮摘除／局部切除，' +
        '或保留脾臟的胰尾切除。</b>' +
        '❗<b>良性 insulinoma 應考慮保留脾臟。</b>');
      L.push('<b>PRRT 可能減輕有症狀 insulinoma 的症狀</b>（台大 NE-J）—— ' +
        '前提同樣是 SSTR 陽性。');
    } else if (S.syn === 'gastrin') {
      title = 'Gastrinoma（胃與十二指腸潰瘍、腹瀉）<br>→ 高劑量 PPI 一天兩次為主';
      L.push(H('診斷', '台大 NE-E'));
      L.push('<b>位置在胰臟或十二指腸。症狀：胃潰瘍、十二指腸潰瘍、腹瀉。驗 serum gastrin。</b>');
      L.push('❗<b>驗 gastrin 有一個矛盾要臨床判斷</b>：' +
        '<b>「serum gastrin should ideally be checked when fasting and off PPI for &gt; 1 week. ' +
        '<u>However, PPI should be continued in patients with overt clinical symptoms of gastrinoma ' +
        'and/or risks of complications.</u>」</b>' +
        '<b>—— 理想上要空腹且停 PPI 超過一週，但有明顯症狀或併發症風險者 PPI 要繼續用。' +
        '兩個要求會衝突。</b>');
      L.push('❗<b>PPI、其他藥物、某些疾病與某些食物都會造成 gastrin 與 chromogranin A 假性升高。</b>');
      L.push(H('症狀控制', '台大 NE-L'));
      L.push('<b>「Manage gastric hypersecretion with high-dose PPIs, generally given two times ' +
        'a day.」—— 高劑量 PPI，一般一天兩次。</b>');
      L.push('<b>可以考慮加 octreotide LAR 或 lanreotide。</b>' +
        '<b>短效 octreotide 可以加在長效上，用於快速緩解或突發症狀。</b>');
      L.push(H('❗要主動排除 MEN-1', ''));
      L.push('<b>十二指腸 NET 可以是多發的，特別是 gastrinoma，而且與 MEN-1 有關聯</b>' +
        '（ENETS 2023）。' +
        '<b>胃 NET type II 就是 Zollinger-Ellison 加 MEN-1 造成的高胃泌素，' +
        '其處置「完全取決於 MEN-1 症候群的管理」。</b>');
      L.push('<b>台大胰臟 NET 指引有 MEN1 專章（含 MEN1-A 手術原則）—— ' +
        '請在步驟 1 選「胰臟」查閱。</b>');
      L.push('❗<b>懷疑 MEN2 時，任何侵入性處置之前要先評估 PCC／PGL</b>（台大 NE-E）。');
    } else if (S.syn === 'vip') {
      cls = 'rec-urgent';
      title = 'VIPoma（嚴重水瀉、低血鉀）<br>→ SSA 第一線，同時要補回電解質與水分';
      L.push(H('診斷', '台大 NE-E'));
      L.push('<b>最常在胰臟，胰外罕見。症狀：嚴重水瀉、低血鉀。驗 serum VIP。</b>');
      L.push(H('症狀控制', '台大 NE-L'));
      L.push('<b>「Octreotide LAR or lanreotide are the first-line management for control of ' +
        'hormone symptoms.」—— SSA 是控制荷爾蒙症狀的第一線。</b>');
      L.push('❗<b>同時要做的事</b>：<b>「Correct electrolyte imbalance (K⁺, Mg²⁺, HCO₃⁻) and ' +
        'dehydration.」—— 矯正鉀、鎂、碳酸氫根的失衡與脫水。</b>' +
        '<b>這一格的死亡風險常來自電解質與脫水，不是腫瘤本身。</b>');
      L.push('❗<b>SSTR 頑抗的病人：類固醇有效</b> —— ' +
        '<b>「Corticosteroids can be effective in patients with SSTR-refractory disease.」' +
        '這一條只出現在 VIPoma，不要套到其他症候群。</b>');
      L.push('<b>短效 octreotide 可以加在長效上，用於快速緩解或突發症狀。</b>');
      L.push('<b>能有效減積的治療（手術、局部治療）本身就會緩解症狀。</b>' +
        '<b>&gt; 2 cm 或影像看起來惡性的 VIPoma，要完整切除到切緣陰性並取區域淋巴結</b>（台大 NE-F）。');
    } else {
      title = 'Glucagonoma（flushing、腹瀉、高血糖、皮膚炎）<br>→ SSA 第一線，同時處理高血糖';
      L.push(H('診斷', '台大 NE-E'));
      L.push('<b>位置在胰臟。症狀：flushing、腹瀉、高血糖、皮膚炎、易凝血狀態。' +
        '驗 serum glucagon。</b>');
      L.push('❗<b>「易凝血狀態（hypercoagulable state）」是這一格獨有的</b> —— ' +
        '<b>其他功能性症候群的清單裡沒有這一項，術前與住院期間要把血栓風險放進評估。</b>');
      L.push(H('症狀控制', '台大 NE-L'));
      L.push('<b>「Octreotide LAR or lanreotide are the first-line management for control of ' +
        'hormone symptoms.」—— SSA 是第一線。</b>');
      L.push('<b>「Treat hyperglycaemia and diabetes, as appropriate.」—— 適當處理高血糖與糖尿病。</b>');
      L.push('<b>短效 octreotide 可以加在長效上，用於快速緩解或突發症狀。</b>');
      L.push('<b>手術</b>（台大 NE-F）：<b>&gt; 2 cm 或影像看起來惡性的 glucagonoma，' +
        '要完整切除腫瘤到切緣陰性（含鄰近器官）並取區域淋巴結。' +
        '頭部腫瘤一般做胰十二指腸切除，體尾部做胰尾切除加脾切除或保留脾臟的胰尾切除。</b>');
      L.push('❗<b>做脾切除者都要接種肺炎鏈球菌、Hib、C 群腦膜炎疫苗，' +
        '可能的話在擇期手術前至少 14 天施打</b>（台大 NE-F）。');
    }

    L.push(H('共通的一件事', '台大 NE-E'));
    L.push('❗<b>荷爾蒙檢查要由症狀決定，無症狀者不常規篩檢。</b>' +
      '<b>有功能性腫瘤的病人才會有荷爾蒙過量的臨床症狀。</b>');
    L.push('❗<b>要長期用 SSA 的病人，手術時建議一併切除膽囊</b>（台大 NE-F）—— ' +
      '<b>膽道症狀與膽囊炎風險較高。</b>' +
      '（❗ENETS 2024 對小腸 NET 持不同看法：「有需要再開」不劣於預防性切除。' +
      '<b>兩份不同調，見下方手術通則橫列。</b>）');

    fill('nt_r_sym', cls, title, L,
      '台大 NE-L 荷爾蒙症狀處置、NE-E 生化檢查、NE-F 手術通則、NE-J PRRT、NE-K 肝臟導向' +
      '（皆收錄於胰臟神經內分泌腫瘤診療指引 版次 02，內容為跨部位 NET 通則）；' +
      'ENETS 2022 類癌症候群與類癌心臟病（Grozinsky-Glasberg S et al. J Neuroendocrinol ' +
      '2022;34(7):e13146，PMID 35613326）。' + NR('telotristat') + ' 的台灣藥證狀態查自' +
      '食藥署許可證開放資料集，查詢日 2026-08-17。',
      biochemReference() + imagingReference() + surgeryReference() + nhiReference());
  }

  /* ==========================================================
     6. 最下方一：要不要驗基因？
     ========================================================== */
  function geneBlock() {
    var L = [];
    L.push(H('GEP-NET 的答案和大部分實體癌不一樣', ''));
    L.push('❗<b>台大 NE-H 沒有把分子檢測列為胃腸道 NET 全身治療的前提</b> —— ' +
      '<b>整張選單（SSA、PRRT、everolimus、cabozantinib、化療）沒有任何一項需要先驗基因，' +
      '真正決定用什麼的是 SSTR 影像、Ki-67 與腫瘤負荷。</b>' +
      '<b>這一點和膽道癌、肺癌的邏輯完全不同，不要照搬。</b>');
    L.push('<b>所以在 GEP-NET，「該做的影像」比「該驗的基因」重要得多</b>：' +
      '<b>SSTR-PET 決定能不能用 PRRT 與 SSA，FDG-PET 用於 G2 以上；' +
      '兩者合併評分的預後價值優於病理分級</b>（台大 NE-D）。');
    L.push(H('真正要驗的是遺傳症候群', ''));
    L.push('<b>MEN-1</b>：<b>胃 NET type II 就定義在 Zollinger-Ellison 加 MEN-1 的脈絡下，' +
      '其處置「完全取決於 MEN-1 症候群的管理」</b>（ENETS 2023）。' +
      '<b>十二指腸 NET 可以多發，特別是 gastrinoma，與 MEN-1 有關聯。</b>' +
      '<b>台大胰臟 NET 指引有 MEN1 專章（含 MEN1-A 手術原則與 MEN1 專屬的 PanNET 治療），' +
      '請在步驟 1 選「胰臟」查閱。</b>');
    L.push('<b>NF1</b>：<b>十二指腸的 somatostatinoma 與 NF1 有關聯</b>（ENETS 2023）。');
    L.push('❗<b>MEN2</b>：<b>懷疑 MEN2 時，任何侵入性處置之前要先評估 PCC／PGL</b>' +
      '（台大 NE-E）—— <b>順序錯了會出事。</b>');
    L.push('<b>驗到會改變什麼</b>：<b>MEN-1 會改變手術範圍與時機（因為病灶多發且會再長）、' +
      '會加上其他腺體的監測、也牽涉家屬檢測。</b>' +
      '<b>這是本頁唯一「驗到就會改變門診動作」的一類。</b>');
    L.push(H('化療前要驗的不是腫瘤基因，是病人的代謝', ''));
    L.push('❗<b>要用 5-FU 或 capecitabine（含 CAPTEM、FOLFOX）之前，' +
      'ENETS 2024 建議驗 DPD（dihydropyrimidine dehydrogenase）</b> —— ' +
      '<b>DPD 缺乏者對 5-FU 或 capecitabine 的代謝差，驗到要依結果減量。</b>' +
      '<b>這一步的目的是避免嚴重毒性，不是選藥。</b>');
    L.push(H('研究中的方向', 'ENETS 2024 §9'));
    L.push(EV('ENETS 2024 把分子分型與精準醫療列在「最近的發展」而非治療建議 —— ' +
      '<b>目前沒有經驗證的預測性生物標記可以指引 GEP-NET 的全身治療順序，' +
      '指引明文「clinical trial data and predictive biomarkers are currently lacking to guide ' +
      'the sequence of systemic therapy」。</b>'));

    return '<div class="bc-gene-h">要不要驗基因？GEP-NET 的答案是「影像比基因重要，但要主動找 MEN-1」' +
      '<span class="bc-gene-n">每一條路徑都適用</span></div>' +
      '<ul class="bc-gene-list">' + L.map(liOf).join('') + '</ul>';
  }

  /* ==========================================================
     7. 最下方二：本路徑用到的藥 · 台大藥卡
     ========================================================== */
  var drugSig = '';
  function cardId(code) { return 'nt-drug-' + code.replace(/ /g, '_'); }

  function drugCardHTML(c, gen, flag) {
    gen = c[3] || gen;
    return '<details class="drugcard" id="' + cardId(c[1]) + '" data-pid="' + c[0] +
      '" data-code="' + c[1] + '" ontoggle="onCardToggle(this)">' +
      '<summary><span class="dc-name">' + c[2] + '</span>' +
      (flag ? '<span class="db-tag db-tag-ext">' + flag + '</span>' : '') +
      '<span class="dc-nameen">' + gen + '</span></summary>' +
      '<div class="dc-body"><div class="db-loading">載入中…</div></div></details>';
  }

  function renderGeneBlock(hasRec) {
    var g = el('nt_gene');
    if (!g) return;
    g.classList.toggle('hidden', !hasRec);
    if (hasRec && !g.innerHTML) g.innerHTML = geneBlock();
  }

  function renderDrugCards() {
    var box = el('nt_drugs');
    if (!box) return;
    var txt = '';
    function textOf(n) {
      var c = n.cloneNode(true);
      c.querySelectorAll('.no-rx').forEach(function (x) { x.remove(); });
      /* ⚠ 不能直接讀 textContent —— 標籤邊界在 textContent 裡是零寬度的，
         會把兩個相鄰的藥名黏成一個字，整字比對就抓不到。 */
      return c.innerHTML.replace(/<[^>]*>/g, ' ');
    }
    var root = el('ntPath');
    if (root) {
      /* ⚠ 只掃本模組自己的建議卡；胰臟分支注入的 pnet 流程有自己的藥卡區，
         不能把它的內容也算進來。 */
      root.querySelectorAll('.flow-rec').forEach(function (r) {
        if (r.classList.contains('hidden') || r.classList.contains('rec-idle')) return;
        if (r.closest('#nt_panc')) return;
        r.querySelectorAll('ul.rec-detail:not(.rec-more) > li:not(.ev)').forEach(function (li) {
          txt += textOf(li) + '\n';
        });
        r.querySelectorAll('details.rx-table').forEach(function (d) { txt += textOf(d) + '\n'; });
        var t = r.querySelector('.rec-title');
        if (t) txt += t.textContent + '\n';
      });
    }

    renderGeneBlock(!!txt.trim());

    var picked = [];
    NT_DRUGS.forEach(function (d) {
      var re = new RegExp('(?<![A-Za-z-])(?:' + (d.re || d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ')(?![A-Za-z-])', 'i');
      if (re.test(txt)) picked.push(d);
    });

    var sig = picked.map(function (d) { return d.key; }).join('|');
    if (sig === drugSig) return;
    drugSig = sig;

    if (!picked.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    var nCards = picked.reduce(function (a, d) { return a + d.cards.length; }, 0);
    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="bc-drugbox-h">本路徑用到的藥 · 台大藥卡<span class="bc-drugbox-n">' +
      picked.length + ' 種藥 · ' + nCards + ' 張卡</span></div>' +
      '<div class="bc-drugbox-note">點藥名展開台大醫院藥劑部處方集的完整藥卡（劑量、腎肝功能調整、' +
      '禁忌、健保給付規定、剝半磨粉）。<b>徽章標明該藥「用於 NET 時」在台灣的健保與藥證狀態 —— ' +
      '不是該藥整體的給付狀態。</b>' +
      '<b>PRRT（Lutathera）不是台大處方集品項，故無藥卡；其藥證與健保狀態見建議卡內的 PRRT 橫列。</b></div>' +
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

  /* ==========================================================
     8. 總 render
     ========================================================== */
  function render() {
    collapseAll();
    if (S.site === 'panc') renderPanc();
    else if (S.site === 'gastric') renderGastric();
    else if (S.site === 'duod') renderDuod();
    else if (S.site === 'si') renderSi();
    else if (S.site === 'rectal') renderRectal();
    else if (S.site === 'appendix') renderAppendix();
    else if (S.site === 'adv') renderAdv();
    else if (S.site === 'nec') renderNec();
    else if (S.site === 'sym') renderSym();
    renderDrugCards();
  }

  /* ==========================================================
     互動
     ========================================================== */
  var SEL_GROUPS = ['nt_n1', 'nt_n_gtype', 'nt_n_g1size', 'nt_n_g3size', 'nt_n_dfeat',
    'nt_n_sistate', 'nt_n_rmode', 'nt_n_margin', 'nt_n_grade', 'nt_n_rt', 'nt_n_rsize',
    'nt_n_r1size', 'nt_n_line', 'nt_n_sstr', 'nt_n_ki67', 'nt_n_syn'];

  var DOWNSTREAM = {
    site: ['gtype', 'g1size', 'g3size', 'dfeat', 'sistate', 'rmode', 'margin', 'grade',
      'rt', 'rsize', 'r1size', 'line', 'sstr', 'ki67', 'syn'],
    gtype: ['g1size', 'g3size'],
    rmode: ['margin', 'grade', 'rt', 'rsize', 'r1size'],
    margin: ['grade'],
    rt: ['rsize'],
    line: ['sstr', 'ki67'],
    sstr: ['ki67']
  };

  function clearSelectionMarks() {
    SEL_GROUPS.forEach(function (id) {
      var e = el(id);
      if (e) e.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function ntPick(key, val, btn) {
    var down = DOWNSTREAM[key];
    S[key] = val;
    if (down) {
      down.forEach(function (k) { S[k] = null; });
      clearSelectionMarks();
    }
    if (key === 'site' && val !== 'panc' && pancInjected && typeof pnReset === 'function') pnReset();
    render();
    reapplyMarks();
    if (btn && document.body.contains(btn)) {
      var g = btn.parentNode;
      if (g) g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    }
  }

  function reapplyMarks() {
    var pairs = [
      ['nt_n1', 'site'], ['nt_n_gtype', 'gtype'], ['nt_n_g1size', 'g1size'],
      ['nt_n_g3size', 'g3size'], ['nt_n_dfeat', 'dfeat'], ['nt_n_sistate', 'sistate'],
      ['nt_n_rmode', 'rmode'], ['nt_n_margin', 'margin'], ['nt_n_grade', 'grade'],
      ['nt_n_rt', 'rt'], ['nt_n_rsize', 'rsize'], ['nt_n_r1size', 'r1size'],
      ['nt_n_line', 'line'], ['nt_n_sstr', 'sstr'], ['nt_n_ki67', 'ki67'], ['nt_n_syn', 'syn']
    ];
    pairs.forEach(function (p) {
      var box = el(p[0]);
      if (!box || !S[p[1]]) return;
      box.querySelectorAll('.flow-opt').forEach(function (b) {
        var m = /ntPick\('([a-z0-9]+)','([a-z0-9]+)'/.exec(b.getAttribute('onclick') || '');
        if (m && m[1] === p[1] && m[2] === S[p[1]]) b.classList.add('selected');
      });
    });
  }

  function ntReset() {
    KEYS.forEach(function (k) { S[k] = null; });
    clearSelectionMarks();
    if (pancInjected && typeof pnReset === 'function') pnReset();
    render();
  }

  function initNetPathway() {
    pancInjected = false;   // switchTab 每次重建 nt_panc（空），須重設旗標讓 ensurePanc 重新注入
    ntReset();
  }

  /* ⚠ 匯出名稱必須是「全癌別唯一」的：所有 *-pathway.js 都掛在同一個 window 上，
     後載入者會無聲覆蓋先載入者的同名函式，且不會有任何錯誤訊息。 */
  global.netPathwayHTML = netPathwayHTML;
  global.initNetPathway = initNetPathway;
  global.ntPick = ntPick;
  global.ntReset = ntReset;
})(window);
