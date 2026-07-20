/* ============================================================
   甲狀腺癌治療互動決策流程 Thyroid Cancer Treatment Pathway
   資料來源（依組織型態分屬不同指引，非單一台大 PDF）：
     · DTC：ATA 2015 分化型甲狀腺癌指引（Haugen BR et al. Thyroid 2016;26:1-133，PMID 26462967）
     · MTC：ATA 2015 髓質癌指引（Wells SA Jr et al. Thyroid 2015;25:567-610，PMID 25810047）
     · ATC：ATA 2021 未分化癌指引（Bible KC et al. Thyroid 2021;31:337-386，PMID 33728999）
     · 分期：AJCC Cancer Staging Manual 8th ed. Ch.73
   ※ 台大醫院並未公開發行甲狀腺癌診療指引，故本流程不掛台大名義；
     台灣端僅標註健保給付狀態（健保署藥品給付規定第 9 節）。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var thSt = {
    histo: null,      // dtc | mtc | atc
    /* --- DTC --- */
    dsurg: null,      // as | lobe | total
    drisk: null,      // low | int | high
    dresp: null,      // excellent | indeterminate | bio_inc | str_inc
    drefr: null,      // refractory | avid
    /* --- MTC --- */
    mext: null,       // loc（頸部侷限可切除）| adv（廣泛區域／轉移）
    mctn: null,       // undetect（測不到／正常）| ctn_lt150 | ctn_gt150
    mdt: null,        // dt_slow（>24 月）| dt_mid（6–24 月）| dt_fast（<6 月）
    /* --- ATC --- */
    astage: null,     // iva_ivb_res（可切除）| ivb_unres | ivc
    abraf: null       // braf_pos | braf_neg | braf_pending
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="thPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 互動 helpers ---------- */
  function thSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function thShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function thClearSel(ids) {
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }
  function ulRec(id, cls, title, lines, note) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'flow-rec ' + cls;
    var label = el.querySelector('.rec-label');
    var labelTxt = label ? label.textContent : '建議處置 Recommendation';
    el.innerHTML = '<div class="rec-label">' + labelTxt + '</div>' +
      '<div class="rec-title">' + title + '</div>' +
      (lines && lines.length ? '<ul class="rec-detail"><li>' + lines.join('</li><li>') + '</li></ul>' : '') +
      (note ? '<div class="rec-note">' + note + '</div>' : '');
  }

  /* ============================================================
     追蹤區塊 Follow-up
     ============================================================ */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h = '';

    if (type === 'dtc_as') {
      h = '<div class="fu-label">積極監測之追蹤 Active surveillance（ATA 2025 REC 12–14）</div><ul class="fu-list">' +
        '<li>以<b>頸部超音波</b>監測；<b>ATA 2025 REC 13 明確不建議</b>於監測期間常規測 Tg 與 TgAb。</li>' +
        '<li><b>轉為手術的觸發條件（REC 14，逐條）</b>：切片證實的<b>新</b>淋巴結轉移、原發腫瘤<b>增大 ≥3 mm</b>、遠處轉移、出現腺外侵犯證據、<b>向後方生長</b>、病人焦慮、無法配合追蹤、或病人表達手術意願。</li>' +
        '<li>侵犯喉返神經、氣管或食道者<b>不適合</b>積極監測。</li>' +
        '<li>ESMO 2019：單發微小乳突癌（≤10mm、無包膜外侵犯與淋巴結轉移）可每 <b>6–12 個月</b>超音波追蹤［III, B］。<b>年齡是唯一已知的進展預測因子</b>：10 年進展風險 &lt;30 歲 36%、30–50 歲 14%、50–60 歲 6%。</li>' +
        '<li><b>ATA 2025 REC 11B（新）</b>：超音波導引<b>經皮消融</b>可作為積極監測或手術之外的替代選項（選擇性病人，Conditional）。</li>' +
        '</ul>';
    } else if (type === 'dtc_curative') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（ATA 2015 REC 63–68／ATA 2025 REC 31／47–50）</div><ul class="fu-list">' +
        '<li><b>頸部超音波</b>：初始治療完成後 <b>6–12 個月</b>做一次，其後依風險與治療反應調整頻率。</li>' +
        '<li><b>可疑淋巴結門檻（兩版一致）</b>：最小徑 <b>≥8–10 mm</b> 且結果會改變處置 → FNA 細胞學 <b>+ 沖洗液 Tg</b>；<b>&lt;8–10 mm 可追蹤不切片</b>。沖洗液 Tg <b>&gt;10 ng/mL 高度可疑</b>，1–10 ng/mL 中度可疑。</li>' +
        '<li><b>Tg</b>：初期追蹤於服藥狀態下 <b>每 6–12 個月</b>（中高／高風險可更密集）。<b>ATA 2025 REC 47D：葉切後不常規測 Tg。</b></li>' +
        '<li><b>TgAb 陽性者以影像為主要監測工具</b>（REC 47E）：免疫分析法受干擾、LC-MS/MS 敏感度低，「不應單獨依賴」。</li>' +
        '<li><b>診斷性全身掃描</b>：低／中風險且反應極佳者不需常規做；ATA 2025 REC 49A 進一步規定<b>葉切者或未做 RAI 之全切者不應做監測用 RAI 掃描</b>。高風險或中高風險臨床懷疑復發時可做（I-123 或低活度 I-131，診斷劑量常 2–5 mCi）。</li>' +
        '<li><b>FDG-PET</b>：適用<b>高風險 + Tg 升高（一般 &gt;10 ng/mL）+ RAI 影像陰性</b>者（敏感度 83%、特異度 84%）。<b>刺激後 Tg ≤10 ng/mL 時敏感度僅 &lt;10–30%</b>，不宜使用。</li>' +
        '<li><b>ATA 2025 REC 48 — 去階梯化與「完全緩解」（全新概念）</b>：低風險、持續反應極佳達 <b>5–8 年</b> → 可停止常規超音波，改<b>每 1–2 年</b>僅追蹤生化指標；達 <b>10–15 年</b> → <b>不需再常規生化監測，視為已達完全緩解</b>（未做 RAI 之全切者同此規則）。<b>葉切者</b>：首次超音波陰性後，每 <b>1–3 年</b>超音波、持續 5–8 年。</li>' +
        '<li>復發再手術門檻（ATA 2015 REC 71）：可於解剖影像定位、<b>中央區 ≥8 mm、側頸 ≥10 mm</b>（最小徑）者考慮再手術；ATA 2025 REC 52 改為情境化陳述，並新增<b>酒精注射（PEI）與射頻消融（RFA）</b>作為再手術高風險者的替代（Conditional）。</li>' +
        '</ul>';
    } else if (type === 'dtc_excellent') {
      h = '<div class="fu-label">反應極佳後之去階梯化 De-escalation（ATA 2015 REC 63B／ATA 2025 REC 48）</div><ul class="fu-list">' +
        '<li>ATA 2015 明載：反應極佳「應導致<b>及早降低追蹤強度與頻率、以及 TSH 抑制的程度</b>」。</li>' +
        '<li><b>不需重複刺激性 Tg 測定</b>（ATA 2015 REC 63B）。</li>' +
        '<li><b>TSH 目標放寬至 0.5–2 mU/L</b>（ATA 2015 REC 70D，Strong）；ATA 2025 則僅表述為「正常參考範圍內」。</li>' +
        '<li>低風險 + 持續反應極佳 <b>5–8 年</b> → 停止常規超音波，改每 1–2 年生化追蹤；<b>10–15 年</b> → 視為<b>完全緩解</b>，不需再常規監測（ATA 2025 REC 48，全新概念）。</li>' +
        '<li>復發率參考：全切+RAI 之 excellent 為 <b>1–4%</b>（低風險 0.2–2%）；全切未做 RAI 之 excellent 為 <b>0–1.6%</b>。疾病特異死亡率 &lt;1%。</li>' +
        '</ul>';
    } else if (type === 'dtc_sys') {
      h = '<div class="fu-label">系統性治療期間之追蹤與支持 Follow-up（ATA 2025 REC 60／76／78–79）</div><ul class="fu-list">' +
        '<li>無症狀、穩定或極輕微進展、或有顯著共病者 → <b>每 3–12 個月</b>影像追蹤即可，不急於用藥（ATA 2015 REC 92A／ATA 2025 REC 60A）。</li>' +
        '<li><b>TSH 目標：結構未完全緩解者維持 &lt;0.1 mU/L 且無限期</b>（ATA 2015 REC 70A，Strong）。</li>' +
        '<li><b>寡轉移（2–5 個病灶）</b>可考慮局部消融（ATA 2025 REC 76）。</li>' +
        '<li><b>骨轉移</b>：瀰漫性或有症狀者用 bisphosphonate 或 <span class="drug">denosumab</span>（REC 78）。<b>中樞神經轉移</b>以手術切除與 SBRT 為主（REC 79）。</li>' +
        '<li>治療期間依 RECIST 評估反應與毒性；lenvatinib 之高血壓（67.8%）、腹瀉（59.4%）、疲倦（59.0%）需主動管理，因不良事件停藥率 14.2%。</li>' +
        '</ul>';
    } else if (type === 'mtc_cured') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（ATA MTC 2015 Rec 46–49）</div><ul class="fu-list">' +
        '<li>術後 <b>3 個月</b>測 calcitonin + CEA；若測不到或正常 → <b>每 6 個月 × 1 年，之後每年</b>（Rec 46）。</li>' +
        '<li>MTC 源自濾泡旁 C 細胞、<b>不受 TSH 驅動 → 不做 TSH 抑制</b>；levothyroxine 僅維持 euthyroid（Rec 31，術後 4–6 週測 TSH）。</li>' +
        '<li>術後 RAI <b>不適用</b>（Rec 51，Grade E）；例外僅為併存 PTC／FTC 成分者。</li>' +
        '<li>生化治癒（術後 basal Ctn &lt;10 pg/mL）者 10 年存活 97.7%，惟仍有約 3% 於 7.5 年內生化復發 → 不可停止追蹤。</li>' +
        '</ul>';
    } else if (type === 'mtc_marker') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（ATA MTC 2015 Rec 47–49）</div><ul class="fu-list">' +
        '<li>Ctn 升高但 <b>&lt;150 pg/mL</b> → 理學檢查 + 頸部超音波；陰性則 Ctn／CEA／US <b>每 6 個月</b>（Rec 47）。</li>' +
        '<li>Ctn <b>&gt;150 pg/mL</b> → 全面影像分期：頸部 US、胸部 CT、肝臟顯影 MRI 或三相 CT、骨骼掃描、骨盆與中軸骨 MRI（Rec 48）。</li>' +
        '<li>任何可測得之 Ctn／CEA → <b>至少每 6 個月</b>追蹤以計算 doubling time（Rec 49）。</li>' +
        '<li><b>Doubling time 之計算</b>：非線性最小平方法配適單一指數；可靠估計需 <b>至少 4 個時間點、跨 2 年以上</b>；惟 &lt;6 個月之 doubling time 於術後 12 個月內即可可靠估得。ATA 提供線上計算器。</li>' +
        '<li>Ctn 與 CEA <b>兩者都要算</b>：兩者皆 ≤25 個月 → 94% 會進展；皆 ≥25 個月 → 僅 14% 進展（一致率 80%）。</li>' +
        '</ul>';
    } else if (type === 'mtc_sys') {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care（ATA MTC 2015）</div><ul class="fu-list">' +
        '<li>依 RECIST 定期影像評估反應與毒性；持續追蹤 Ctn／CEA doubling time。</li>' +
        '<li><b>腦部</b>（Rec 55）：有神經症狀者<b>及擬啟動系統性治療者</b>皆應做腦部影像；孤立病灶 → 手術或 EBRT／SRS，多發 → 全腦 EBRT。</li>' +
        '<li><b>脊髓壓迫</b>（Rec 56）：<b>緊急</b> glucocorticoid + 手術減壓；非手術候選者單用 EBRT。</li>' +
        '<li><b>骨</b>（Rec 57–58）：骨折／瀕臨骨折 → 手術、thermoablation、cement injection 或 EBRT（EBRT 使 70% 疼痛顯著緩解）；疼痛性骨轉移 → <span class="drug">denosumab</span> 或 bisphosphonates（惟 ATA 自陳 MTC 之 bisphosphonate 證據極少，係由甲狀腺癌整體外推）。</li>' +
        '<li><b>肺</b>（Rec 59）：大的孤立轉移 → 切除；小的周邊病灶 → RFA。<b>肝</b>（Rec 60）：孤立大病灶 → 切除；瀰漫性、病灶 &lt;30mm 且侵犯 &lt;1/3 肝臟 → chemoembolization。</li>' +
        '<li><b>症狀處理</b>：腹瀉（Rec 66）先用止瀉藥，替代為 somatostatin analogs；異位 ACTH／CRH 之 Cushing syndrome（Rec 67）→ ketoconazole、mifepristone、metyrapone、mitotane，難治者雙側腎上腺切除。</li>' +
        '</ul>';
    } else if (type === 'atc_active') {
      h = '<div class="fu-label">追蹤、支持與臨終照護 Follow-up（ATA ATC 2021）</div><ul class="fu-list">' +
        '<li><b>緩和醫療應在每一個階段介入</b>（Rec 9，Strong）——不是末期才照會；處理疼痛、症狀與身心社會靈性議題。</li>' +
        '<li><b>Goals of care 討論須「儘早」啟動並「頻繁更新」</b>（GPS 5），完整揭露各選項風險效益，<b>病人偏好應主導處置</b>；鼓勵預立醫療決定（代理人、code status、POLST），並須討論 DNR 在何種情況下暫時中止（GPS 4）。</li>' +
        '<li><b>Hospice 自始即應列為選項之一</b>（Table 1 step 8）：「對某些病人，hospice 甚至從一開始就可能優於其他選擇」。正式觸發條件為<b>婉拒延命性抗腫瘤治療但仍需症狀與疼痛緩解</b>（Rec 10）。</li>' +
        '<li>長療程 IMRT 應於<b>療程中途安排 restaging 影像</b>，以偵測早期遠端進展；若遠端快速進展應立即更換系統性治療。</li>' +
        '<li><b>Oligo-progression</b>（慣例定義為 <b>≤5 個</b>轉移灶，GPS 16）：可用 SBRT 或 RFA 局部處理，以延後更換原本仍有效之系統性治療。</li>' +
        '<li><b>腦轉移</b>：壓迫性神經症狀 → <span class="drug">dexamethasone</span> <b>4–16 mg/day</b>（Rec 27）；轉介神經外科／放射腫瘤科（Rec 28）。注意 VEGFR 導向 TKI 於<b>未經治療之腦轉移</b>可能增加顱內出血風險。</li>' +
        '<li><b>骨轉移</b>：有症狀或具威脅性 → 緩和性放療（Rec 29）；<b>負重部位有結構性損害或瀕臨脊髓壓迫者，須先骨科固定再放療</b>（Rec 30，順序不可顛倒）；可用靜脈 bisphosphonate 或皮下 RANKL 抑制劑（Rec 31，Conditional；<span class="fu-gap">指引未給藥名、劑量與間隔</span>）。</li>' +
        '<li>三模式治療之代價須事先告知：住院率 60%、暫時性餵食管需求 60%、治療期間死亡率 3%；慢性淋巴水腫與頸部活動度受限常見且<b>不可逆</b>；<span class="fu-gap">生活品質資料完全闕如</span>。</li>' +
        '</ul>';
    } else if (type === 'atc_hospice') {
      h = '<div class="fu-label">緩和與安寧照護 Palliative / Hospice（ATA ATC 2021）</div><ul class="fu-list">' +
        '<li>啟動 hospice（Rec 10）：婉拒延命性抗腫瘤治療、但餘病程仍需症狀與疼痛緩解者。</li>' +
        '<li>緩和醫療照會於<b>任何階段</b>皆有用；hospice 則聚焦於已不再接受延命治療者之疼痛與症狀處理。</li>' +
        '<li>Comfort care／hospice 之同意過程應納入緩和醫療專家<b>與宗教關懷（pastoral care）</b>。</li>' +
        '<li>須理解家庭系統及其對病人決策之影響（Rec 11）；決策能力有疑慮時照會心理衛生與／或臨床倫理（GPS 3）。</li>' +
        '<li><b>營養與餵食管</b>：停止進食者應先評估<b>憂鬱及其他妨礙舒適進食之生理障礙（含吞嚥問題）</b>；最終「自願停止進食與飲水」可被提供並予尊重。與家屬對餵食管適當性有衝突時，採 ATS「7 Step」流程。<span class="fu-gap">此段無分級建議，僅見於臨床倫理章節。</span></li>' +
        '</ul>';
    }
    el.innerHTML = h;
  }

  function result(recId, fuId, cls, title, lines, note, fuType) {
    ulRec(recId, cls, title, lines, note);
    renderFollowup(fuId, fuType);
  }
  function idleRec(recId, fuId, title) {
    ulRec(recId, 'rec-idle', title, [], '');
    renderFollowup(fuId, null);
  }

  /* ============================================================
     共用內容區塊
     ============================================================ */

  /* DTC：RAI 適應症與活度（ATA 2015 REC 51/55/56 + ATA 2025 REC 32 Table 10） */
  function dtcRAI(risk) {
    var head, body;
    if (risk === 'low') {
      head = '<span class="rx-h">放射碘 RAI</span>　<span class="rx-sub">低風險：不常規建議</span><br>' +
        '<b>ATA 2015 REC 51A</b>：低風險者<b>不常規建議</b> RAI 殘餘消融；<b>REC 51B（Strong）</b>：單發微小乳突癌於葉切或全切後，若無其他不良特徵，<b>不常規建議</b>。' +
        '<b>ATA 2025 REC 32A</b>：低風險<b>不常規建議</b>——證據等級由 2015 年的 Low <b>升格為 High</b>，依據為 ESTIMABL2 與 IoN。';
      body = '<b>三個去階梯化試驗（皆已 PubMed 驗證）</b>：' +
        '<span class="rx">ESTIMABL2</span>（NEJM 2022，n=776，pT1a／pT1b N0）：<b>不給 RAI vs 給 1.1 GBq</b> 之 3 年無事件比例 <b>95.6% vs 95.9%</b>（差 −0.3 個百分點），達非劣性；<b>5 年追蹤</b>（Lancet Diabetes Endocrinol 2025）93.2% vs 94.8%，結論明言「不做術後消融而追蹤這些病人，並無損失機會」。' +
        '<span class="rx">IoN</span>（Lancet 2025，n=504，R0、pT1–pT3a、N0/Nx/N1a）：5 年無復發存活 <b>97.9% vs 96.3%</b>，絕對差 0.5 個百分點（非劣性界值 5 個百分點，p=0.033），<b>兩組皆無癌症相關死亡</b>。' +
        '<span class="rx">HiLo</span>（NEJM 2012，2×2 factorial，n=438）：<b>1.1 vs 3.7 GBq</b> 消融成功 85.0% vs 88.9%、<b>rhTSH vs 停藥</b> 87.1% vs 86.7%，皆達非劣性；高劑量組住院 ≥3 天 36.3% vs 13.0%、不良事件 33% vs 21%。長期追蹤（中位 6.5 年）復發 HR 1.10（p=0.83）。' +
        '<b>綜合訊息</b>：低風險可<b>完全省略</b> RAI；若仍給，<b>30 mCi + rhTSH 已足夠</b>。';
    } else if (risk === 'int') {
      head = '<span class="rx-h">放射碘 RAI</span>　<span class="rx-sub">中風險：應考慮（Consider）</span><br>' +
        '<b>ATA 2015 REC 51D</b>：中風險者<b>應考慮</b> RAI 輔助治療（Weak, Low）。<b>ATA 2025 REC 32B</b>：低中／中高風險「may be considered」（Conditional, Low）。';
      body = '<b>活度</b>：ATA 2015 REC 55A（<b>Strong, High</b>）——低風險或具較低風險特徵之中風險者，<b>採低活度約 30 mCi</b>；REC 56：作為<b>輔助治療</b>時可用高於消融之活度，<b>至多 150 mCi</b>，惟「是否常規使用 &gt;150 mCi 能降低 T3 與 N1 病人之結構性復發並不確定」。' +
        'ATA 2025 Table 10：低中與中高風險 <b>1.1–3.7 GBq（30–100 mCi）</b>。' +
        '<b>Table 14 逐格</b>（ATA 2015）：T1a → 否；T1b–T2 N0 → 非常規；T3（&gt;4cm 或顯微腺外侵犯）→ 考慮；T1-3 <b>N1a</b> → 考慮，惟「<b>中央區 &lt;5 顆顯微淋巴結轉移且無其他不良特徵者，資料不足以強制使用 RAI</b>」；T1-3 N1b → 考慮；T4 → 是；M1 → 是。';
    } else {
      head = '<span class="rx-h">放射碘 RAI</span>　<span class="rx-sub">高風險：常規建議（Strong）</span><br>' +
        '<b>ATA 2015 REC 51E（Strong, Moderate）</b>與 <b>ATA 2025 REC 32C</b>：高風險者<b>常規建議</b> RAI；有遠處轉移者亦常規建議（REC 32D）。';
      body = '<b>活度</b>：ATA 2025 Table 10——高風險 <b>3.7–5.55 GBq（100–150 mCi）</b>；<b>遠處轉移 3.7–7.4 GBq（100–200 mCi）</b>或考慮劑量學（dosimetry）。' +
        'ATA 2015 REC 81：經驗性治療 <b>100–200 mCi</b>；<b>若經驗性 RAI 後掃描陰性，即判定為 RAI 難治，不再給 RAI</b>。' +
        '<b>ATA 2025 REC 55A（Strong）</b>：<b>&gt;70 歲或腎衰竭者應避免經驗性給予 &gt;5.5 GBq（150 mCi）</b>，因高度可能超過毒性參數。' +
        'ESMO 2019：遠處轉移採 100–200 mCi 停藥法，每 6 個月一次共 2 年；<b>累積劑量達 600 mCi 後病灶仍持續者，治癒機會渺茫</b>。';
    }
    return head + '<br>' + body + '<br>' +
      '<span class="rx-h">準備方式</span>　<span class="rx-sub">2025 年立場翻轉</span><br>' +
      '<b>ATA 2025 REC 34A（Strong, High）</b>：擬做消融或輔助治療者，<b>rhTSH 刺激優於停用甲狀腺素</b>——2015 年 REC 54A 僅稱 rhTSH 為低／中風險者的「可接受替代方案」，且對高風險<b>無建議（證據不足）</b>。' +
      '停藥法：LT4 停 <b>3–4 週</b>；若停 ≥4 週，前期可用 LT3 替代，LT3 須停 ≥2 週。目標 <b>TSH &gt;30 mIU/L</b>（2015 為 Weak/Low，<b>2025 升格為 Good Practice Statement</b>）。低碘飲食 <b>1–2 週</b>。治療後掃描兩版皆建議（可用 SPECT/CT）。';
  }

  /* DTC：TSH 抑制目標（ATA 2015 REC 59／70；ATA 2025 已移除數值） */
  function dtcTSH(context) {
    var line;
    if (context === 'high') line = '<b>高風險 → TSH &lt;0.1 mU/L</b>（REC 59A，Strong）。';
    else if (context === 'int') line = '<b>中風險 → TSH 0.1–0.5 mU/L</b>（REC 59B）。';
    else if (context === 'lobe') line = '<b>低風險接受葉切 → TSH 0.5–2 mU/L</b>（REC 59E）；<b>若病人本身即能維持於此範圍，可不需服用甲狀腺素</b>。實務數字：目標若訂在正常範圍，<b>70–80% 葉切者可免服 LT4</b>；若訂 0.5–2.0 mIU/L 則<b>僅 20–30%</b> 可免藥。';
    else if (context === 'excellent') line = '<b>反應極佳／不確定（尤其低風險）→ 放寬至 TSH 0.5–2 mU/L</b>（REC 70D，Strong）；初始高風險但反應極佳者維持 0.1–0.5 mU/L <b>至多 5 年</b>後可放寬（REC 70C）。';
    else if (context === 'bio_inc') line = '<b>生化未完全緩解 → TSH 0.1–0.5 mU/L</b>（REC 70B）。';
    else if (context === 'str_inc') line = '<b>結構未完全緩解 → TSH &lt;0.1 mU/L，且無限期維持</b>（REC 70A，Strong）。';
    else line = '<b>低風險已消融且 Tg 測不到 → TSH 0.5–2 mU/L</b>（REC 59C）；低量可測 Tg 者 0.1–0.5 mU/L（REC 59D）。';
    return '<span class="rx-h">TSH 抑制目標</span>　<span class="rx-sub">數值僅 ATA 2015 版有</span><br>' + line +
      '<br><b>ATA 2025 已刻意移除數值分層</b>：REC 45 改為「個別化決定是否抑制至參考範圍以下，並認知高風險者較可能自 subnormal TSH 獲益」（Conditional）；<b>REC 46A：低／中風險且無生化或結構復發證據者，不建議長期 TSH 抑制</b>。Table 9 僅給「正常參考範圍內」與「低於正常參考範圍」兩類，且兩則腳註皆明載「最佳 TSH 目標範圍之資料尚無定論」。' +
      '<b>支持依據</b>：NTCTCSG（n=3,238）顯示<b>中度抑制（subnormal-to-normal）</b>於各期別之存活與無病存活皆較佳，而<b>抑制到測不到的程度並未帶來進一步改善</b>；另一低中風險世代（n=771）顯示 <b>TSH ≤0.4 mIU/L 者心房顫動與骨質疏鬆風險升高，但復發風險相同</b>。' +
      '<span class="fu-gap">若需 mIU/L 數字只能引 ATA 2015 REC 59／70 或 ESMO 2019，並註明 ATA 2025 已移除。</span>';
  }

  /* DTC：RAI 難治之系統性治療全菜單 */
  function dtcSystemic() {
    return [
      '<span class="rx-h">先做基因檢測，再決定用藥</span>　<span class="rx-sub">ATA 2025 REC 61，Strong／立場與 2015 相反</span><br>' +
        '<b>「進展性 RAI 難治 DTC 於啟動系統性治療前，應先做組織基因檢測以找出可標靶的致癌驅動變異。」</b>ATA 2015 REC 92B 原本認為不需常規做 BRAF 檢測——此處是 10 年間的方向性反轉。',
      '<span class="rx-h">何時開始、何時觀察</span>　<span class="rx-sub">ATA 2025 REC 60／63</span><br>' +
        '<b>觀察</b>：無症狀、穩定或極輕微進展、或有顯著共病者 → 每 3–12 個月影像追蹤即可。' +
        '<b>立即治療（REC 63A，Strong）</b>：<b>有症狀且不適合局部治療者，lenvatinib 或其他治療應立即開始，不應延遲。</b>' +
        '<b>REC 63B</b>：無症狀但過去 <b>12–14 個月</b>內有進展者——以療效為優先可提早啟動，以生活品質為優先可延後並持續監測。',
      '<span class="rx-h">有驅動變異者：第一線即用標靶</span>　<span class="rx-sub">ATA 2025 REC 67–70</span><br>' +
        '<b>RET fusion（REC 68，Strong）</b>→ <span class="drug">selpercatinib</span>（LIBRETTO-001：RET fusion 甲狀腺癌 <b>ORR 79%</b>，1 年 PFS 64%）或 <span class="drug">pralsetinib</span>（ARROW：<b>ORR 89%</b>，8/9）。' +
        '<b>NTRK fusion（REC 67，Strong）</b>→ <span class="drug">larotrectinib</span>（甲狀腺癌專門分析：28 例可評估 ORR 71%，<b>僅 DTC 21 例 ORR 86%</b>）或 <span class="drug">entrectinib</span>；NCCN 另列 repotrectinib。' +
        '<b>ALK fusion（REC 69，Strong／證據 Low）</b>→ ALK 標靶（僅有 crizotinib、alectinib、lorlatinib 之個案報告，因罕見無法做常規試驗）。' +
        '<b>BRAF V600E（REC 70）</b>→ (a) <b>不適合 lenvatinib</b> 者可第一線用 BRAF 導向治療（Conditional）；(b) 一線以上 MKI 進展或不耐受者<b>建議</b>使用（Strong）；(c) <b>非 V600 之 BRAF 變異不建議</b>用現行 BRAF 導向藥（Strong）。' +
        'Vemurafenib 第二期：未用過 VEGFR MKI 者 ORR 39%、用過者 27%。<span class="rx">Dabrafenib ± trametinib</span> 隨機第二期（n=53）：<b>併用未優於單用</b>（ORR 42% vs 48%，p=0.67）。',
      '<span class="rx-h">無可標靶變異：第一線多激酶抑制劑</span>　<span class="rx-sub">ATA 2025 REC 62，Strong, High</span><br>' +
        '<b>「多數情況下 lenvatinib 為首選第一線 MKI。」</b>' +
        '<span class="rx">Lenvatinib</span>（SELECT，NEJM 2015，n=392）：<b>中位 PFS 18.3 vs 3.6 個月，HR 0.21；ORR 64.8% vs 1.5%</b>。OS 兩組皆未達（後續分析 HR 0.73，p=0.10，因 <b>83% 安慰劑組跨組</b>而混淆）。' +
        '<b>起始劑量 24 mg qd</b>（REC 64A，Strong, High）：18 mg vs 24 mg 隨機試驗顯示 24 週 ORR <b>40.3% vs 57.3%，未達非劣性</b>，而 ≥G3 不良事件相當——故不應為降低毒性而預設減量。' +
        '<span class="rx">Sorafenib</span>（DECISION，Lancet 2014，n=417）：中位 PFS <b>10.8 vs 5.8 個月</b>，HR 0.59；<b>ORR 僅 12.2%</b>；OS 無差異（71.4% 跨組）。' +
        'NCCN v1.2025：兩者皆 category 1，<b>lenvatinib 為首選</b>（反應率 65% vs 12%，惟兩藥未曾直接比較）。',
      '<span class="rx-h">第二線</span>　<span class="rx-sub">ATA 2025 REC 66，Strong, High</span><br>' +
        '<span class="rx">Cabozantinib</span>（COSMIC-311 更新，Cancer 2022，n=258）：<b>中位 PFS 11.0 vs 1.9 個月，HR 0.22；ORR 11.0% vs 0%</b>。效益<b>不因既往使用哪一種 VEGFR TKI 而異</b>。' +
        'NCCN：乳突癌 category 1、濾泡與嗜酸性癌 category 2A。NCCN 另提及 lenvatinib + <span class="drug">pembrolizumab</span> 於 lenvatinib 進展後（ORR 16%、PFS 10.0 個月）「或可考慮」。',
      '<span class="rx-h">再分化 Redifferentiation</span>　<span class="rx-sub">ATA 2025 REC 74</span><br>' +
        '(A) 具可標靶突變者之 MAPK 阻斷再分化「<b>可於選擇性病人考慮，並鼓勵參加臨床試驗</b>」（Conditional, Low）。' +
        'Selumetinib 先驅研究（NEJM 2013，n=20）：<b>12/20 增加 I-124 攝取</b>（<b>NRAS 突變者 5/5</b>），8 例達治療門檻，接受 RAI 的 8 例中 5 例 PR、3 例 SD，Tg 平均下降 89%。MERAIODE BRAF 隊列（n=24）6 個月 ORR 38%。' +
        '<b>(B) 但（Strong, Moderate）：高風險、未經基因篩選之 DTC，不建議在輔助性 RAI 治療中使用再分化策略</b>——依據為 ASTRA 試驗未達標。',
      '<span class="rx-h">免疫治療與細胞毒性化療</span><br>' +
        '免疫檢查點抑制劑（REC 73，Conditional）：<b>僅於選擇性情形</b>，如<b>高腫瘤突變負荷或錯配修復缺損</b>者。' +
        '細胞毒性化療（REC 75）：僅限轉移、快速進展、有症狀或立即威脅生命者。',
      '<span class="rx-h">台灣健保給付</span>　<span class="rx-sub">健保署藥品給付規定第 9 節（115/6/23 版）</span><br>' +
        '<b>已給付</b>：<span class="drug">lenvatinib</span>（9.63，107/7/1 起）與 <span class="drug">sorafenib</span>（9.34，106/1/1 起）用於<b>放射碘治療無效之局部晚期或轉移性進行性 DTC</b>——兩者<b>不得合併使用</b>，需事前審查、每次療程 3 個月、每 3 個月檢送影像評估。' +
        '<span class="drug">cabozantinib</span>（9.74）<b>自 114/8/1（＝2025-08-01）起給付</b>二線：曾接受 VEGFR 標靶治療後惡化、放射碘無效或不適用者，每日限 1 粒。' +
        '<span class="drug">larotrectinib</span>（9.95，112/12/1）給付 NTRK fusion 之進行性甲狀腺癌，須附基因融合檢測報告。' +
        '<b>未給付（須自費）</b>：<b>selpercatinib 於第 9 節全文零命中</b>（任何癌別皆未納保）；<b>dabrafenib + trametinib（9.91）僅給付黑色素瘤與 BRAF V600E 非小細胞肺癌，全條無「甲狀腺」字樣</b>。' +
        '<span class="fu-gap">即 RET fusion 與 BRAF V600E 的標靶藥在台灣屬自費；民國 114 年＝2025 年，多個二手網站把 cabozantinib 給付起日誤植為 2024-08-01。</span>'
    ];
  }

  /* MTC 系統性治療全菜單（ATA MTC 2015 Rec 53/63/65 + 後續選擇性 RET 抑制劑證據） */
  function mtcSystemic() {
    return [
      '<span class="rx-h">先確認「該不該治療」</span>　<span class="rx-sub">ATA Rec 53，Grade C</span><br>' +
        '<b>Ctn／CEA 上升但影像無可證實之轉移病灶者，不應給予系統性治療</b>；<b>低量、穩定</b>之轉移性疾病且 Ctn 與 CEA <b>doubling time 皆 &gt;2 年</b>者亦然。指引敘述段更直接：無可測轉移之無症狀病人「it is best to do nothing」。',
      '<span class="rx-h">一線 1st line — 選擇性 RET 抑制劑</span>　<span class="rx-sub">RET 突變陽性</span><br>' +
        '<span class="drug">Selpercatinib</span>（LIBRETTO-531 第三期，第一線頭對頭勝 cabozantinib／vandetanib：中位 PFS 未達 vs 16.8 個月，<b>HR 0.28</b>；ORR 69.4% vs 38.8%；因不良事件減量 38.9% vs 77.3%、停藥 4.7% vs 26.8%）。' +
        '<span class="drug">Pralsetinib</span>（ARROW：未曾治療 RET-mutant MTC ORR <b>71%</b>，曾用 MKI 者 60%）。',
      '<span class="rx-h">非選擇性多激酶抑制劑 MKI</span>　<span class="rx-sub">ATA Rec 65，Grade A</span><br>' +
        '腫瘤負荷大且有症狀、或依 RECIST 進展者 → 同時針對 RET 與 VEGFR 之 TKI。' +
        '<span class="drug">Vandetanib</span> <b>300 mg/day</b>（ZETA：PFS HR 0.46；PR 45%；12% 因毒性停藥、35% 需減量）；' +
        '<span class="drug">Cabozantinib</span> <b>140 mg/day</b>（EXAM：中位 PFS 11.2 vs 4.0 個月，HR 0.28；ORR 28% vs 0%；<b>最終 OS 26.6 vs 21.1 個月未達顯著，P=0.24</b>；79% 需減量、16% 停藥）。' +
        'ATA 對 cabozantinib 起始劑量自陳保留：「140 mg/d 是否過毒？40–100 mg/d 是否較合理？」',
      '<span class="rx-h">細胞毒性化療</span>　<span class="rx-sub">ATA Rec 63，Grade D＝不建議</span><br>' +
        '單藥或合併細胞毒性化療<b>不應作為第一線</b>（反應率僅 15–20% 且短暫）。若仍需使用，最有效者為 <span class="drug">doxorubicin</span> 併另一藥，或 <span class="drug">5-FU</span> + <span class="drug">dacarbazine</span>。',
      '<span class="rx-h">外放射治療 EBRT</span>　<span class="rx-sub">ATA Rec 52，Grade C</span><br>' +
        '適應症為局部復發高風險——<b>顯微或肉眼殘存、腺外侵犯、或廣泛淋巴結轉移</b>——以及有呼吸道阻塞風險者。劑量：顯微殘存 <b>60–66 Gy／6 週</b>，肉眼殘存 <b>≥70 Gy</b>；鄰近脊髓者用 IMRT。' +
        '<b>順序警告</b>：啟動 EBRT 前外科must先確認病人已非再手術候選者，因放療後再手術技術上更困難。',
      '<span class="rx-h">台灣健保給付</span>　<span class="rx-sub">健保署藥品給付規定第 9 節</span><br>' +
        '<b>vandetanib</b>（第 9.86 節）為<b>唯一給付於甲狀腺髓質癌</b>者，適應症限「無法手術切除之局部侵犯或轉移性 MTC，且為症狀性及疾病侵襲性」，劑量 300 mg PO QD。' +
        '<b>cabozantinib</b>（9.74）僅給付腎細胞癌、<b>selpercatinib 與 pralsetinib 均未納健保</b>（selpercatinib 在台已有藥證「銳癌寧 Retsevmo」，&lt;50kg 120mg BID／≥50kg 160mg BID，需自費）。' +
        '<span class="fu-gap">給付規定每 1–2 個月修訂，臨床使用前請以最新版第 9 節核對。</span>'
    ];
  }

  /* ATC 系統性治療全菜單（ATA ATC 2021） */
  function atcSystemic() {
    return [
      '<span class="rx-h">BRAF V600E 陽性</span>　<span class="rx-sub">Rec 20，Strong</span><br>' +
        '<span class="rx">Dabrafenib 150 mg BID + Trametinib 2 mg QD</span>，優先於其他系統性治療（適用 IVC，及拒絕放療之不可切除 IVB）。' +
        'ROAR 更新分析（n=36）：<b>ORR 56%</b>（含 3 例 CR）、中位 PFS 6.7 個月、<b>中位 OS 14.5 個月</b>、12 個月 OS 51.7%、24 個月 OS 31.5%。' +
        '<b>解讀警語</b>：試驗只收 ECOG 0–1 且<b>排除無法吞服藥丸者</b>，可能低估真實世界腫瘤負荷；被排除於試驗外之真實世界對照（n=6）中位 PFS 僅 3.7 個月、中位 OS 9.3 個月。Dabrafenib 可穿越血腦障壁。',
      '<span class="rx-h">Neoadjuvant BRAF 導向治療 → 手術</span>　<span class="rx-sub">Rec 21，Conditional</span><br>' +
        'BRAF V600E 之不可切除 IVB 且放療可行時，<b>化放療</b>與 <b>neoadjuvant dabrafenib／trametinib</b> 為兩個並列的初始選項。' +
        'MD Anderson 經驗（Wang 2019，<b>n=6</b>）：6 人全部完全切除，<b>6 個月 OS 100%、1 年 OS 83%、局部區域控制 100%</b>。' +
        '<b>術後必須續用</b> BRAF／MEK 抑制劑以維持控制；<span class="fu-gap">完全切除後是否仍需輔助化放療，指引明言「尚不清楚」。</span>',
      '<span class="rx-h">其他驅動變異</span>　<span class="rx-sub">Rec 23，Conditional／Very low——全指引唯一「極低」證據等級</span><br>' +
        '<b>NTRK fusion</b>（非 NTRK 點突變）→ <span class="drug">larotrectinib</span> 或 <span class="drug">entrectinib</span>；<b>RET fusion</b> → <span class="drug">selpercatinib</span> 或 <span class="drug">pralsetinib</span>。' +
        '<b>建議儘可能在臨床試驗中使用</b>：selpercatinib 註冊試驗<b>僅收入 2 名 ATC</b>（其中 1 人反應持續 18 個月）；larotrectinib 之 5 名甲狀腺癌全部有反應但<b>無法確認是否為 ATC</b>。<span class="fu-gap">指引未給任何劑量。</span>',
      '<span class="rx-h">免疫檢查點抑制劑</span>　<span class="rx-sub">Rec 24，Conditional</span><br>' +
        '<b>PD-L1 高表現</b>且無其他可標靶變異之 IVC，可考慮作為一線或後線，且以臨床試驗為佳。' +
        '證據基礎為 <span class="drug">spartalizumab</span>（第二期：ORR 19%、中位 OS 5.9 個月；依 PD-L1 分層 <b>&lt;1% 者無任何反應、中位 OS 僅 1.6 個月</b>，1–49% ORR 18%，≥50% ORR 35%）。' +
        '<b>注意</b>：ATA 2021 <b>沒有 pembrolizumab 的建議條文、劑量或 MSI／TMB 導向路徑</b>（僅兩處軼事性提及）；「dab/tram 併用 PD-1 抑制劑」為 <b>ASCO</b> 之立場，<span class="fu-gap">NCCN 是否有對應條文未能由一手文件證實，勿逕自引為 NCCN 建議。</span>',
      '<span class="rx-h">無可標靶變異之細胞毒性化療</span>　<span class="rx-sub">Rec 25／Rec 19，Conditional</span><br>' +
        '<b>Rec 19「橋接」</b>：等待分子檢測結果或標靶藥可及性期間，應<b>及早啟動化療作為橋接</b>，以免有效治療被延誤。' +
        '系統性／轉移性劑量：<span class="drug">paclitaxel</span> <b>60–90 mg/m² IV 每週</b>（<b>指引明載已發表之 225 mg/m² 每週為誤植，切勿沿用</b>）；' +
        '<span class="drug">docetaxel</span> <b>60 mg/m² IV 每 3 週</b>；<span class="drug">doxorubicin</span> <b>20 mg/m² 每週或 60–75 mg/m² 每 3 週</b>（<b>唯一經 FDA 核准用於 ATC 之細胞毒性藥</b>）。' +
        '<span class="fu-gap">指引未提供非同步情境之 carboplatin AUC，亦無更正後之 q3 週 paclitaxel 劑量。</span>',
      '<span class="rx-h">抗血管新生藥與 RAI</span><br>' +
        '<b>RAI 對 ATC 無效，不應使用</b>。<span class="drug">Lenvatinib</span> 為唯一有前瞻數據者（日本試驗 ORR 24%、中位 OS 10.6 個月，僅日本核准），惟 ITOG 之確認性第二期試驗<b>因缺乏療效於期中分析即關閉</b>。' +
        '<b>出血警告</b>：腫瘤侵犯氣管、食道或大血管時，抗血管新生藥有出血與瘻管風險，須事先告知病人。',
      '<span class="rx-h">台灣健保給付</span>　<span class="rx-sub">健保署藥品給付規定第 9 節</span><br>' +
        '<b>dabrafenib 與 trametinib（第 9.91 節）僅給付黑色素瘤，甲狀腺癌不給付</b>；<b>selpercatinib／pralsetinib 未納健保</b>；<b>pembrolizumab（9.69）給付癌別不含甲狀腺</b>。' +
        'larotrectinib（9.95）為 NTRK fusion 實體腫瘤之 tumor-agnostic 給付，理論上可涵蓋 ATC。' +
        '<span class="fu-gap">即 ATC 現行最重要的標靶方案（dab+tram）在台灣須自費——決策時應與病人同時討論療效與費用（GPS 9 明列財務考量）。</span>'
    ];
  }

  /* ATC 化放療處方表（ATA ATC 2021 Table 6，四者皆每週） */
  function atcChemoRT() {
    return '<div class="cbx"><div class="cbx-h">同步化放療處方　<span class="cbx-sub">ATA ATC 2021 Table 6，四者皆為每週給藥</span></div>' +
      '<div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">①</span>Paclitaxel 50 mg/m² + Carboplatin AUC2 IV</span>' +
      '<span class="cb"><span class="cb-k">②</span>Docetaxel 20 mg/m² + Doxorubicin 20 mg/m² IV</span>' +
      '<span class="cb"><span class="cb-k">③</span>Paclitaxel 30–60 mg/m² IV 單方</span>' +
      '<span class="cb"><span class="cb-k">④</span>Docetaxel 20 mg/m² IV 單方</span>' +
      '</div></div>';
  }

  function atcRTDose() {
    return '<span class="rx-h">放射治療處方</span>　<span class="rx-sub">Rec 14／15／17 僅寫「standard fractionation IMRT」，未附劑量；以下數字出自指引定義章節而非分級建議</span><br>' +
      '根治性標準範例：<b>66 Gy／6.5 週（33 次 × 2 Gy，每週 5 天）</b>；範圍 <b>50 Gy/20 次</b> 至 <b>70 Gy/35 次</b>。' +
      '加速超分割範例 60 Gy／4 週（40 次 × 1.5 Gy，每日兩次）——中位存活 13.6 vs 10.3 個月<b>未達統計顯著</b>，且另有報告顯示毒性顯著而無存活優勢。' +
      '緩和性：<b>20 Gy/5 次</b> 或 <b>30 Gy/10 次</b>。' +
      '<b>照射體積</b>：甲狀腺／術床 + 雙側 II–V 頸淋巴結 + VI 中央區 + <b>上縱膈至隆突</b>——指引自陳此體積「非常大，因此必須有所折衷」，這正是採 IMRT（凹形劑量分布以保留脊髓、喉、食道、臂神經叢、唾液腺）的理據。';
  }

  function atcTiming() {
    return '<div class="cbx"><div class="cbx-h">時序 Timing　<span class="cbx-sub">ATA ATC 2021 Good Practice Statements</span></div>' +
      '<div class="cbx-items">' +
      '<span class="cb"><span class="cb-k">GPS 8</span>放療應於術後<b>不遲於 6 週</b>開始（內文：腫脹消退後約 2–3 週即可）</span>' +
      '<span class="cb"><span class="cb-k">GPS 10</span>化療可於術後<b>1 週內</b>啟動（癒合允許時）</span>' +
      '<span class="cb"><span class="cb-k">計畫</span>放療計畫時間應<b>少於 5 個工作天</b></span>' +
      '<span class="cb"><span class="cb-k">GPS 1</span>轉移灶切片<b>不得延誤</b>主要治療</span>' +
      '</div></div>';
  }

  /* ============================================================
     版面 HTML
     ============================================================ */
  function thyroidPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">甲狀腺癌<b>沒有單一指引可涵蓋</b>：分化型（DTC）依 <b>ATA 2015</b>、髓質癌（MTC）依 <b>ATA 2015 MTC 指引</b>、未分化癌（ATC）依 <b>ATA 2021 ATC 指引</b>，分期依 <b>AJCC 8th Ch.73</b>。三者的手術範圍、術後輔助、追蹤標記與系統性治療<b>完全不同</b>，故第一步即為組織型態。台大醫院未公開發行甲狀腺癌診療指引，本流程不掛台大名義；台灣端僅標註健保給付狀態。</p>';
    h += '<div class="onc-path" id="thPath">';

    // Step 1 — 組織型態
    h += step('th_s1', '1', '組織型態 Histology（決定後續整條路徑）',
      opt('histo', 'dtc', '分化型 DTC', '乳突 papillary／濾泡 follicular／嗜酸性 oncocytic(Hürthle)；佔絕大多數') +
      opt('histo', 'mtc', '髓質癌 MTC', '源自濾泡旁 C 細胞；標記為 calcitonin／CEA，不受 TSH 驅動、RAI 無效') +
      opt('histo', 'atc', '未分化癌 ATC', '一律第 IV 期；須以「天」為單位推進，RAI 無效'));

    /* ===================== DTC ===================== */
    h += '<div id="th_dtc" class="hidden">';
    h += conn('th_dc2');
    h += step('th_ds2', '2', '初始處置：手術範圍（ATA 2025 REC 11／15）',
      opt('dsurg', 'as', '積極監測 Active surveillance', 'cT1aN0M0（≤1cm）之乳突癌；ATA 2025 REC 11A') +
      opt('dsurg', 'lobe', '甲狀腺葉切除 Lobectomy', 'cT1（≤2cm）N0M0 應做葉切；cT2（>2–4cm）低風險單側亦以葉切為佳') +
      opt('dsurg', 'total', '全甲狀腺切除 Total thyroidectomy', '>4cm（cT3a）、任何大小合併明顯腺外侵犯（cT3b／cT4）、cN1 或 cM1'),
      '<div class="note"><b>切點在 2025 年由 1cm 上移至 2cm</b>。ATA 2025 REC 15A（<b>Strong</b>）：<b>≤2cm 無明顯腺外侵犯、cN0M0 者「應」做葉切</b>，除非雙側癌或有其他對側切除指徵；REC 15B（Conditional）：<b>&gt;2 且 ≤4cm 低風險單側（cT2N0M0），因風險與副作用顯著較低，葉切可為首選</b>，惟仍可選全切以利 RAI 與追蹤。對照 ATA 2015 REC 35 之切點為 1cm／4cm。<br>' +
      '<b>偏向雙側手術的因子</b>（ATA 2015 內文）：年齡較大、對側結節、頭頸部放射線照射病史、家族性 DTC。<br>' +
      '<b>術前細胞學分流</b>（Bethesda 2023 第 3 版惡性風險）：Nondiagnostic 13%、Benign 4%、AUS 22%、Follicular neoplasm 30%、Suspicious 74%、Malignant 97%。AUS／FN 若分子檢測 <b>RAS 陽性 → 惡性風險 84%</b>；<b>BRAF V600E／RET-PTC／PAX8-PPARγ 陽性 → &gt;95%</b>，比照確診癌處理。<span class="fu-gap">ATA 2025 明載結節／Bethesda 分流不在其範圍內，將另出獨立指引，故此段仍依 ATA 2015 + Bethesda 2023。</span><br>' +
      '<b>ATA 2025 REC 10</b>：確診 DTC 者<b>術前不常規</b>做基因體評估。</div>');

    h += connH('th_dc3');
    h += step('th_ds3', '3', '術後復發風險分層（決定 RAI 與 TSH 目標）',
      opt('drisk', 'low', '低風險 Low', '無轉移、腫瘤完整切除、無侵犯、無侵襲性組織型、無血管侵犯；cN0 或 ≤5 顆 <0.2cm 之微轉移') +
      opt('drisk', 'int', '中風險 Intermediate', '顯微腺外侵犯／首次治療後掃描見頸部 RAI-avid 病灶／侵襲性組織型／血管侵犯／cN1 或 >5 顆 N1 且皆 <3cm') +
      opt('drisk', 'high', '高風險 High', '肉眼腺外侵犯／切除不完全／遠處轉移／術後 Tg 提示遠處轉移／任一淋巴結 ≥3cm／濾泡癌廣泛血管侵犯（>4 focus）'),
      '<div class="note">上列為 <b>ATA 2015 Table 11 三級系統</b>（逐項準則完整可考）。<b>ATA 2025 已改為四級</b>：低（&lt;10%）／低中（10–15%）／中高（≥16–30%）／高（&gt;30%），並將 PTC、FTC／IEFVPTC、OTC <b>分開分層</b>（REC 28A，Strong）。' +
      '<span class="fu-gap">ATA 2025 四級的<b>逐項判定準則僅存在於 Figure 2 圖片</b>，PDF 文字層無法擷取，PMC 上的評論文亦未重製——本頁因此仍以 2015 三級呈現可操作的準則，不從記憶重建 2025 的分層表。此為已知缺口。</span><br>' +
      '<b>ATA 2025 可直接引用之單項復發率</b>：血管侵犯 <b>21% vs 4%</b>（無侵犯）；濾泡癌 <b>≥4 條血管侵犯 30–55%</b> vs &lt;4 條 2–3%；<b>顯微</b>腺外侵犯 3–9% vs <b>肉眼</b>腺外侵犯 <b>23–40%</b>；<b>&gt;3 顆</b>轉移淋巴結 <b>40%</b>；轉移灶 &gt;5mm 者 25.9%；切緣陽性 11.6%。</div>');
    h = h.replace('id="th_ds3"', 'id="th_ds3" class="hidden"');

    h += connH('th_dc4');
    h += step('th_ds4', '4', '治療反應再分層 Response to therapy（ATA 反應準則）',
      opt('dresp', 'excellent', '極佳 Excellent', '影像陰性，且抑制下 Tg <0.2 或刺激後 Tg <1 ng/mL（全切+RAI）') +
      opt('dresp', 'indeterminate', '不確定 Indeterminate', '非特異影像所見；或抑制下 Tg 0.2–1、刺激後 Tg 1–10；或 TgAb 穩定／下降') +
      opt('dresp', 'bio_inc', '生化未完全緩解', '影像陰性，但抑制下 Tg >1 或刺激後 Tg >10 ng/mL，或 TgAb 上升') +
      opt('dresp', 'str_inc', '結構未完全緩解', '有結構性或功能性疾病證據，<b>不論 Tg 高低</b>'),
      '<div class="note"><b>ATA 2025 首次依手術／RAI 型態把 Tg 切點分三欄</b>（Table 9）——這是最容易做錯的地方：' +
      '<b>全切＋RAI</b>：excellent 為抑制下 Tg &lt;0.2／刺激後 &lt;1；<b>全切但未做 RAI</b>：excellent 為抑制下 <b>Tg &lt;2.5</b>、indeterminate 為 2.5–5、biochemically incomplete 為 <b>&gt;5</b>；<b>葉切</b>：改以<b>影像</b>判定（對側葉正常或屬低風險結節／良性切片，且無異常淋巴結），<b>不以 Tg 數值分類</b>。上方選項標示的數值為全切＋RAI 之情境。<br>' +
      '<b>ATA 2025 REC 29（Strong）</b>：應在<b>決定是否給予進一步治療（含 RAI）之前</b>就先做反應分類——2015 版原設計是初始治療完成後才用，2025 提前了。<b>REC 30</b>：全切後 <b>6–12 週</b>測 Tg（Tg 達最低點的中位時間為 <b>12 週</b>，較過去認知晚）；葉切後測一次確認未異常升高，<b>但明確切點未定</b>。<br>' +
      '<b>各類別復發率</b>（ATA 2025）：全切+RAI — excellent 1–4%、indeterminate 5% 至 15–20%、生化未完全緩解 <b>20–53%</b>（合併結構性者達 85%）；全切未做 RAI — excellent 0–1.6%、indeterminate 0–5.6%、生化未完全緩解 0–31.6%。</div>');
    h = h.replace('id="th_ds4"', 'id="th_ds4" class="hidden"');

    h += connH('th_dc5');
    h += step('th_ds5', '5', '是否為放射碘難治（RAI-refractory）？',
      opt('drefr', 'avid', '仍具攝碘能力 RAI-avid', '治療後掃描顯示病灶攝碘 → 可續用 RAI') +
      opt('drefr', 'refractory', 'RAI 難治 RAI-refractory', '符合下列任一條件'),
      '<div class="note"><b>ATA 2015 REC 91 經典四條</b>（須在適當 TSH 刺激與低碘準備之下）：①惡性／轉移組織<b>從未</b>攝碘（首次治療後掃描於甲狀腺床外無攝取）；②原本攝碘的腫瘤<b>失去</b>攝碘能力（且排除穩定碘污染）；③<b>部分病灶攝碘、部分不攝碘</b>；④<b>雖有顯著攝碘但疾病仍進展</b>。' +
      '<b>ATA 2015：一旦判定為 RAI 難治，即無再給 RAI 之適應症。</b><br>' +
      '<b>ATA 2025 REC 59 重新框定</b>：(A)<b>未曾接受過消融或治療劑量 RAI 者，不能診斷為 RAI-refractory</b>（Good Practice Statement）；其 <b>Strong criteria</b> 收緊為兩條——(i) 已由結構影像或 FDG-PET 確認有病灶，但<b>治療後掃描無 I-131 攝取</b>；(ii) 適當治療劑量 RAI（治療後掃描確有攝取）後<b>不到 6 個月</b>即疾病進展。' +
      '且 ATA 2025 明確聲明：這些特徵應用來<b>風險分層「腫瘤對 RAI 反應的可能性」，而非作為硬性排除再給 RAI 的判定標準</b>——立場較 2015 寬鬆。<br>' +
      '<b>ESMO 2019</b>：遠處轉移失去攝碘能力，或 RAI 給予後 <b>6–12 個月</b>內出現結構性進展，即視為 RAI 難治［IV, A］。約 1/3 病人病灶非 RAI-avid，5 年存活 &lt;50%。</div>');
    h = h.replace('id="th_ds5"', 'id="th_ds5" class="hidden"');

    h += rec('th_dtc_rec', '建議處置 · 分化型 DTC');
    h += '<div class="flow-fu hidden" id="th_dtc_fu"></div>';
    h += '</div>';

    /* ===================== MTC ===================== */
    h += '<div id="th_mtc" class="hidden">';
    h += conn('th_mc2');
    h += step('th_ms2', '2', '疾病範圍（術前影像與 calcitonin 分期後）',
      opt('mext', 'loc', '侷限於頸部 · 可切除', '無遠處轉移，病灶限於甲狀腺與頸淋巴結') +
      opt('mext', 'adv', '廣泛區域侵犯 或 遠處轉移', '不可完整切除／已有遠處轉移'),
      '<div class="note"><b>術前必做（Rec 21）</b>：basal calcitonin + CEA + <b>germline RET 檢測（所有 MTC 都要做</b>——1–7% 的「散發型」實為遺傳性，Rec 6）；遺傳性者須排除 <b>pheochromocytoma 與副甲狀腺機能亢進</b>。' +
      '<b>Rec 39 鐵則：若 PHEO 與 MTC／HPTH 並存，PHEO 必須先切除。</b>Rec 38：MEN2A／MEN2B 且組織學確診 MTC 者，<b>不論年齡與症狀，任何介入性處置前都必須排除 PHEO</b>。<br>' +
      '<b>影像門檻（Rec 22，Grade C）</b>：所有 MTC 都做頸部超音波；<b>calcitonin &gt;500 pg/mL</b>（或頸部病灶廣泛、有轉移徵象）→ 加做頸胸顯影 CT、三相肝臟 CT 或顯影肝 MRI、中軸骨 MRI、骨骼掃描。<b>FDG-PET 與 F-DOPA-PET 皆不建議</b>（Rec 23，Grade E）。<br>' +
      '<span class="fu-gap">注意三個 calcitonin 門檻不可混用：術前影像 &gt;500（Rec 22）／術後影像 &gt;150（Rec 48）／對側頸廓清 &gt;200（Rec 26）／兒童預防性 CND &gt;40（Rec 35）。NCCN 另有一套（&gt;400、≥150），與 ATA 不同。</span></div>');

    h += connH('th_mc3');
    h += step('th_ms3', '3', '術後 calcitonin／CEA 狀態（術後 3 個月，Rec 46）',
      opt('mctn', 'undetect', '測不到／正常', '生化治癒 biochemical cure') +
      opt('mctn', 'ctn_lt150', '升高但 &lt;150 pg/mL', 'Rec 47') +
      opt('mctn', 'ctn_gt150', '&gt;150 pg/mL', 'Rec 48 → 全面影像分期'));
    h = h.replace('id="th_ms3"', 'id="th_ms3" class="hidden"');

    h += connH('th_mc4');
    h += step('th_ms4', '4', 'Calcitonin doubling time（決定是否啟動系統性治療）',
      opt('mdt', 'dt_slow', '&gt;24 個月', '研究結束時全數存活') +
      opt('mdt', 'dt_mid', '6–24 個月', '5 年存活 92%、10 年 37%') +
      opt('mdt', 'dt_fast', '&lt;6 個月', '5 年存活 25%、10 年 8%'),
      '<div class="note">多變項分析中<b>僅 calcitonin doubling time 為獨立預後因子</b>（優於 TNM 分期、EORTC score 與 CEA doubling time）。計算需<b>至少 4 個時間點、跨 2 年以上</b>；惟 &lt;6 個月者於術後 12 個月內即可可靠估得。<b>Ctn 與 CEA 兩者都應計算</b>。</div>');
    h = h.replace('id="th_ms4"', 'id="th_ms4" class="hidden"');

    h += rec('th_mtc_rec', '建議處置 · 髓質癌 MTC');
    h += '<div class="flow-fu hidden" id="th_mtc_fu"></div>';
    h += '</div>';

    /* ===================== ATC ===================== */
    h += '<div id="th_atc" class="hidden">';
    h += conn('th_ac2');
    h += step('th_as2', '2', '分期與可切除性（AJCC 8th：ATC 一律第 IV 期）',
      opt('astage', 'iva_ivb_res', 'IVA／IVB · 預期可 R0／R1 切除', '不需喉切除、氣管或動脈切除、不預期永久氣切') +
      opt('astage', 'ivb_unres', 'IVB · 不可切除', '無遠處轉移但無法達成 R0／R1') +
      opt('astage', 'ivc', 'IVC · 遠處轉移', 'Any T, Any N, M1'),
      '<div class="note"><b>呼吸道優先（Rec 7）</b>：所有 ATC 初診時應做聲帶評估，內視鏡須涵蓋咽→喉→聲門下→氣管，並加做顯影 CT 或 MRI（<b>CT 因掃描時間短可能較佳</b>）。' +
      '<b>但指引明確反對預防性氣切（GPS 7）</b>：「無立即呼吸道危險者，我們建議不要預先放置氣切」——即使是<b>不可切除的 ATC 通常也不需要</b>建立外科呼吸道。氣切僅限於<b>危及生命之窒息</b>，且應在手術室全身麻醉下執行，<b>不應在病房或急診以局部麻醉施行</b>；氣切會延誤後續放療與標靶治療達<b>2 週以上</b>且與存活下降相關。因術中氣切並不罕見，應納入所有 ATC 重大切除手術之標準同意書。<br>' +
      '<b>BRAF V600E 須「迅速」以 IHC 檢測（Rec 4）</b>：IHC 陽性即可能不必再做 NGS，陰性則應做 NGS（較敏感）；組織不可得時可用 cfDNA liquid biopsy。BRAF 變異佔 ATC 之 40–70%。<b>Targeted NGS panel 通常 1–2 週出結果</b>；whole-exome／transcriptome 因耗時過久明確不建議作為初始檢測。<span class="fu-gap">指引僅用「expeditiously／urgently」，並無以天數計的 turnaround 目標，勿引用天數。</span><br>' +
      '<b>16–30% 的 ATC 以顯著白血球增多表現（腫瘤分泌 G-CSF）——白血球高不一定代表感染。</b></div>');

    h += connH('th_ac3');
    h += step('th_as3', '3', 'BRAF V600E 狀態',
      opt('abraf', 'braf_pos', 'BRAF V600E 陽性', '佔 ATC 之 40–70%') +
      opt('abraf', 'braf_neg', 'BRAF V600E 陰性', '續行 NGS 找 NTRK／RET fusion 等') +
      opt('abraf', 'braf_pending', '尚未回報', 'Rec 19：等待期間應以化療「橋接」，不可空等'));
    h = h.replace('id="th_as3"', 'id="th_as3" class="hidden"');

    h += rec('th_atc_rec', '建議處置 · 未分化癌 ATC');
    h += '<div class="flow-fu hidden" id="th_atc_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="thReset()">重置</button></div>';
    h += '</div>'; // thPath
    return h;
  }

  /* ============================================================
     渲染
     ============================================================ */
  function thRender() {
    var s = thSt;

    thShow('th_dtc', s.histo === 'dtc'); thShow('th_dc2', s.histo === 'dtc');
    thShow('th_mtc', s.histo === 'mtc'); thShow('th_mc2', s.histo === 'mtc');
    thShow('th_atc', s.histo === 'atc'); thShow('th_ac2', s.histo === 'atc');

    // DTC 步驟可見性
    var dSurg = (s.dsurg === 'lobe' || s.dsurg === 'total');
    thShow('th_dc3', dSurg); thShow('th_ds3', dSurg);
    var dResp = dSurg && !!s.drisk;
    thShow('th_dc4', dResp); thShow('th_ds4', dResp);
    var dRefr = dResp && s.dresp === 'str_inc';
    thShow('th_dc5', dRefr); thShow('th_ds5', dRefr);

    // MTC 步驟可見性
    var mLoc = (s.mext === 'loc');
    thShow('th_mc3', mLoc); thShow('th_ms3', mLoc);
    var mDt = mLoc && (s.mctn === 'ctn_lt150' || s.mctn === 'ctn_gt150');
    thShow('th_mc4', mDt); thShow('th_ms4', mDt);

    // ATC 步驟可見性
    var aShowBraf = !!s.astage;
    thShow('th_ac3', aShowBraf); thShow('th_as3', aShowBraf);

    renderDtcRec();
    renderMtcRec();
    renderAtcRec();
  }

  /* ---------- MTC ---------- */
  function renderMtcRec() {
    var s = thSt;
    if (s.histo !== 'mtc') return;
    var R = 'th_mtc_rec', F = 'th_mtc_fu';

    if (!s.mext) { idleRec(R, F, '請選擇步驟 2（疾病範圍）'); return; }

    if (s.mext === 'adv') {
      result(R, F, 'rec-nonop', '廣泛區域侵犯／遠處轉移：以功能保留為前提之減量手術 + 系統性治療',
        ['<b>手術原則轉向保守（Rec 27，Grade C）</b>：廣泛區域或轉移性病灶，中央與側頸應採<b>較不積極</b>之手術，以保留發聲、吞嚥、副甲狀腺功能與肩關節活動度；局部控制改由 EBRT 與系統性治療達成。',
         '<b>局部復發再手術（Rec 50）</b>：應做 compartment-oriented 廓清；<b>「僅切除肉眼可見轉移淋巴結」的有限術式應避免</b>，除非該區已有大範圍前次手術。',
         '<b>再手術前的隱匿肝轉移</b>（Rec 54）：長時間頸部再手術前可考慮腹腔鏡肝臟評估切片——41 例中 8 例（19.5%）發現 &lt;5mm 白色結節，<b>CT 僅測得其中 1 例</b>。'
        ].concat(mtcSystemic()),
        'ATA MTC 2015（PMID 25810047）Rec 27／50／52–67。', 'mtc_sys');
      return;
    }

    // 侷限可切除
    if (!s.mctn) {
      result(R, F, 'rec-elective', '侷限於頸部：全甲狀腺切除 + 中央區（Level VI）廓清',
        ['<b>Rec 24（Grade B）</b>：影像無頸部淋巴結轉移、無遠處轉移者 → <b>全甲狀腺切除 + Level VI 中央區廓清</b>（即影像陰性仍做<b>預防性</b>中央區廓清）。理由：<b>不論原發腫瘤 &lt;1cm 或 &gt;4cm，中央與同側區淋巴結轉移率皆為 50–75%</b>——腫瘤大小不具保護作用，這正是 MTC 一律做全切除的核心理由。',
         '<b>Rec 26（Grade C）</b>：病灶侷限於頸部與頸淋巴結者 → 全甲狀腺切除 + Level VI + <b>受累側之側頸（II–V）廓清</b>；術前影像同側陽性但對側陰性時，若 <b>basal Ctn &gt;200 pg/mL 應考慮對側頸廓清</b>。',
         '<b>影像陰性者的預防性側頸廓清——ATA 明文未達共識（Rec 25，Grade I）</b>：「may be considered based on serum Ctn levels. <b>The Task Force did not achieve consensus on this recommendation.</b>」<span class="fu-gap">此點最常被誤引為「應依 calcitonin 做預防性側頸廓清」；ATA 並未背書。20／50／200／500 pg/mL 那組數字是指引引用 Machens &amp; Dralle 的證據，不是 ATA 建議。</span>',
         '<b>副甲狀腺處理（Rec 30，Grade B）</b>：正常腺體帶血管蒂原位保留；若無存活腺體 → 散發型 MTC／MEN2B／MEN2A 且該 RET 突變罕見合併 HPTH 者<b>自體移植至胸鎖乳突肌</b>；<b>MEN2A 且突變高度合併 HPTH 者則移植至異位肌肉床</b>（便於日後再手術）。',
         '<b>補全切除（Rec 28）</b>：單側切除後若有 germline RET 突變、術後 Ctn 升高、或影像顯示殘存 → 補做 completion thyroidectomy。<b>淋巴結腫大但 Ctn 正常不是再手術適應症。</b>',
         '<div class="cbx"><div class="cbx-h">遺傳性 MTC 之預防性甲狀腺切除　<span class="cbx-sub">ATA 2015 風險分級（2009 之 Level D／C／A+B 已改名）</span></div><div class="cbx-items">' +
           '<span class="cb"><span class="cb-k">HST</span>MEN2B、RET <b>M918T</b> → <b>出生第 1 年內</b>，甚至頭幾個月（Rec 34）</span>' +
           '<span class="cb"><span class="cb-k">H</span>RET <b>C634</b> 系列、<b>A883F</b> → <b>5 歲</b>或更早（依 Ctn 升高）；Ctn &gt;40 pg/mL 或影像／直視可見轉移才加中央區廓清（Rec 35）</span>' +
           '<span class="cb"><span class="cb-k">MOD</span>其餘所有 RET codon 突變 → <b>無固定年齡</b>，約 5 歲起追蹤、依 Ctn 升高決定（Rec 36）</span>' +
           '</div></div>' +
           '<b>A883F 於 2015 年由 Level D 降為 H</b>（其 MTC 侵襲性低於 M918T）。HST 佐證：44 名 MEN2B 兒童中<b>4 歲前手術者 9/9 全部生化治癒，5 歲後手術者僅 1/35</b>。' +
           '篩檢起始年齡：ATA-H（codon 634）<b>3 歲</b>、ATA-MOD <b>5 歲</b>起年度理學檢查 + 頸部 US + Ctn；PHEO 篩檢 ATA-H／HST 自 <b>11 歲</b>、MOD 自 <b>16 歲</b>（Rec 37）；HPTH 篩檢同齡開始（Rec 42）。' +
           '<span class="fu-gap">注意 MTC 風險與 PHEO 風險是兩條軸線：D631Y 雖屬 MOD，卻帶約 50% 的 PHEO 風險。&lt;2 歲兒童因副甲狀腺「小、半透明、難以辨識」可考慮延後手術。</span>'
        ],
        'ATA MTC 2015（PMID 25810047）Rec 24–30、34–37。術後 4–6 週測 TSH，levothyroxine 維持 euthyroid，<b>不做 TSH 抑制</b>（Rec 31）。', null);
      return;
    }

    if (s.mctn === 'undetect') {
      result(R, F, 'rec-elective', '術後 calcitonin／CEA 測不到 → 生化治癒，定期追蹤',
        ['術後 basal Ctn &lt;10 pg/mL 者 <b>10 年存活 97.7%</b>。',
         '不需系統性治療；依下方時程追蹤即可。',
         '<b>惟仍有約 3% 於 7.5 年內生化復發</b>，追蹤不可中止。'],
        'ATA MTC 2015 Rec 46。', 'mtc_cured');
      return;
    }

    // Ctn 升高 → 需 doubling time
    if (!s.mdt) {
      var stagingLine = (s.mctn === 'ctn_gt150')
        ? '<b>Ctn &gt;150 pg/mL（Rec 48）→ 立即全面影像分期</b>：頸部 US、胸部 CT、肝臟顯影 MRI 或三相顯影 CT、骨骼掃描、骨盆與中軸骨 MRI。'
        : '<b>Ctn 升高但 &lt;150 pg/mL（Rec 47）</b>：先做理學檢查 + 頸部超音波；陰性則 Ctn／CEA／US 每 6 個月追蹤，<b>暫不做全面影像</b>。';
      result(R, F, 'rec-nonop', '術後 calcitonin 升高 → 先定位病灶，再以 doubling time 決定是否治療',
        [stagingLine,
         '<b>下一步取決於 doubling time（見下方步驟 4）</b>：ATA 明文規定<b>「Ctn／CEA 上升但無影像可證實之轉移病灶者，不應給予系統性治療」</b>（Rec 53）。',
         '<b>再手術（Rec 29，Grade C）</b>：術前 basal Ctn &lt;1000 pg/mL 且初次手術僅取出 ≤5 顆轉移淋巴結者，可考慮 compartment-oriented 廓清。',
         '<b>預後量化（Rec 45）</b>：ATA 提出以陽性淋巴結<b>數目</b>分級（1–10／11–20／&gt;20）優於 AJCC 的 N1a／N1b 定性分類；<b>≥10 顆陽性或 &gt;2 個 compartment 受累者，Ctn 無法正常化</b>。'],
        'ATA MTC 2015 Rec 45／47–49／53。', 'mtc_marker');
      return;
    }

    if (s.mdt === 'dt_slow') {
      result(R, F, 'rec-elective', 'Doubling time &gt;24 個月 → 觀察追蹤，不啟動系統性治療',
        ['<b>Rec 53（Grade C）明文</b>：低量且穩定之轉移性疾病，若 Ctn 與 CEA doubling time <b>皆 &gt;2 年</b>，<b>不應給予系統性治療</b>。',
         '該族群於研究結束時<b>全數存活</b>。',
         '維持每 6 個月之 Ctn／CEA 與影像追蹤，重新計算 doubling time；轉快時再評估。',
         '<b>局部病灶</b>仍可視需要以手術或 EBRT 處理（Rec 52：顯微殘存 60–66 Gy／6 週；肉眼殘存 ≥70 Gy）。'],
        'ATA MTC 2015 Rec 52–53。Doubling time &gt;24 個月組於研究期間無死亡。', 'mtc_marker');
      return;
    }

    var dtLine = (s.mdt === 'dt_fast')
      ? '<b>Doubling time &lt;6 個月：5 年存活 25%、10 年存活 8%</b>——最具侵襲性族群，應積極評估系統性治療。'
      : '<b>Doubling time 6–24 個月：5 年存活 92%、10 年存活 37%</b>。';
    result(R, F, s.mdt === 'dt_fast' ? 'rec-urgent' : 'rec-nonop',
      'Doubling time ' + (s.mdt === 'dt_fast' ? '&lt;6 個月' : '6–24 個月') + ' → 依腫瘤負荷與症狀啟動系統性治療',
      [dtLine,
       '<b>啟動門檻（Rec 65，Grade A）</b>：腫瘤負荷大且有症狀、或依 RECIST 有進展者 → 選擇性 RET 抑制劑或 RET／VEGFR 雙標靶 TKI。' +
         '<b>但影像上若無可證實之轉移病灶，仍不應僅因指標上升而治療</b>（Rec 53）。'
      ].concat(mtcSystemic()),
      'ATA MTC 2015 Rec 53／65。<span class="fu-gap">ATA 2015 全文完全不含 selpercatinib／pralsetinib（成文早於選擇性 RET 抑制劑）；其第一線建議已被 LIBRETTO-531 覆蓋，故本頁以 selpercatinib 列為 RET 突變陽性者之首選。</span>',
      'mtc_sys');
  }

  /* ---------- ATC ---------- */
  function renderAtcRec() {
    var s = thSt;
    if (s.histo !== 'atc') return;
    var R = 'th_atc_rec', F = 'th_atc_fu';

    if (!s.astage) { idleRec(R, F, '請選擇步驟 2（分期與可切除性）'); return; }
    if (!s.abraf) {
      result(R, F, 'rec-urgent', '先確立診斷、呼吸道與 goals of care——同時等待 BRAF 結果',
        ['<b>Rec 2</b>：手術切除前應盡一切努力先以切片確立診斷，<b>因為手術切除可能是不適當的</b>；FNA 診斷率 &gt;60%，常需併行 core biopsy 以取得足夠分子檢測材料（Rec 1）。',
         '<b>Rec 8</b>：定義 goals of care 或進行治療討論<b>之前</b>，須先取得完整的疾病專屬多專科意見，且參與者須含<b>高度熟悉 ATC 治療的專家</b>。',
         '<b>Rec 19</b>：希望積極治療者，應<b>及早啟動細胞毒性化療作為「橋接」</b>，直到分子檢測結果或標靶藥可及為止——不可空等。',
         '請於上方步驟 3 選擇 BRAF V600E 狀態以取得對應方案。'],
        'ATA ATC 2021（PMID 33728999）Rec 1／2／8／19。', 'atc_active');
      return;
    }

    // IVA/IVB 可切除
    if (s.astage === 'iva_ivb_res') {
      var lines = [
        '<b>手術（Rec 12，Strong）</b>：侷限性 IVA／IVB 且<b>預期可達 R0／R1 切除</b>者，強烈建議手術切除。作者群明言「將較高價值置於手術帶來的存活延長，較低價值置於潛在併發症與化放療之延遲」。',
        '<b>但根治性擴大手術一般不建議（Rec 13）</b>：喉切除、氣管切除、食道切除、大血管或縱膈切除，僅在多專科充分討論、並考量突變狀態與標靶藥可及性後，極選擇性地執行。',
        '<b>術後放化療（Rec 14）</b>：R0／R1 切除後，體能良好、無轉移、希望積極治療者 → <b>standard fractionation IMRT + 同步系統性治療</b>（Rec 17：建議用 IMRT）。',
        atcChemoRT(),
        atcRTDose(),
        atcTiming()
      ];
      if (s.abraf === 'braf_pos') {
        lines.push('<b>BRAF V600E 陽性且屬 borderline resectable</b>：可考慮 <span class="rx">neoadjuvant dabrafenib + trametinib</span> 後再手術（MD Anderson n=6：全數完全切除、1 年 OS 83%）。<span class="fu-gap">NCCN 將可切除者之 neoadjuvant dab/tram 列為 category 2B（panel 共識較低）——此為二手來源，未經 NCCN 一手文件證實。</span>');
      }
      lines.push('<b>存活參考</b>：三模式 vs 手術+放療未化療——<b>IVA 11.2 vs 9.3 個月、IVB 9.9 vs 5.9 個月</b>（皆 p&lt;0.001）。IMRT／taxane 時代之全分期 1 年 OS 由 10% 提升至 43%，惟<b>統計顯著僅見於 IVA 與 IVB</b>。');
      result(R, F, 'rec-elective', 'IVA／IVB 可切除：手術 → 術後 IMRT + 同步化療（三模式治療）',
        lines,
        'ATA ATC 2021 Rec 12–14／17–18、GPS 8／10。<span class="fu-gap">Rec 14/15/17 本身未附 Gy/fraction，上列劑量出自指引定義章節；另指引自陳「一項系統性回顧未發現 R0 vs R1 vs R2 在無病或整體存活上有差異」——切緣狀態的理據並非無爭議。</span>',
        'atc_active');
      return;
    }

    // IVB 不可切除
    if (s.astage === 'ivb_unres') {
      var ul = [];
      if (s.abraf === 'braf_pos') {
        ul.push('<b>兩個並列選項（Rec 21，Conditional）</b>：BRAF V600E 之不可切除 IVB 且放療可行時，<b>化放療</b>與 <b>neoadjuvant dabrafenib／trametinib</b> 皆為合理的初始治療。');
        ul.push('<b>若拒絕放療</b> → 直接 <span class="rx">dabrafenib + trametinib</span>（Rec 20，Strong）。');
      } else {
        ul.push('<b>Rec 15</b>：不可切除但無轉移、體能佳且希望積極治療者 → <b>standard fractionation IMRT + 系統性治療</b>。');
        ul.push('<b>Rec 22（Strong）</b>：BRAF 非突變者，<b>為維持呼吸道</b>應考慮放療併同步化療，以降低窒息風險；最好併用 taxane ± 鉑類或 doxorubicin（例如 docetaxel + doxorubicin）。');
        ul.push('<b>GPS 12</b>：BRAF wild-type（陰性或狀態不明）之不可切除 IVB，希望積極治療且未接受化放療者，<b>應鼓勵參加臨床試驗</b>。');
      }
      ul.push('<b>Rec 16（Strong）</b>：初評不可切除者，若放療和／或系統性治療（化療或 BRAF／MEK 抑制劑）使腫瘤<b>轉為可能可切除，建議重新考慮手術</b>——不可切除不是一次性的判定。');
      ul.push(atcChemoRT());
      ul.push(atcRTDose());
      ul = ul.concat(atcSystemic());
      ul.push('<b>存活參考</b>：多模式 vs 緩和意向之 <b>IVB 專屬</b>數據——中位 OS <b>22.4 vs 4 個月</b>（OR 0.12；p=0.0001），<b>1 年存活 68% vs 0%</b>。');
      result(R, F, 'rec-nonop', 'IVB 不可切除：IMRT + 同步化療；BRAF V600E 者另有標靶選項',
        ul,
        'ATA ATC 2021 Rec 15–18／20–22、GPS 11–12。<b>GPS 11</b>：體能狀態差者應採緩和性或預防性局部區域放療，而非高劑量放療。', 'atc_active');
      return;
    }

    // IVC
    var cl = [];
    if (s.abraf === 'braf_pos') {
      cl.push('<b>Rec 20（Strong）</b>：BRAF V600E 之 IVC → <span class="rx">dabrafenib 150 mg BID + trametinib 2 mg QD</span>，<b>優先於其他所有系統性治療</b>。作者群（<b>含病友代表</b>）明言：在「先前幾乎沒有希望」的處境下，此方案有帶來深遠效益的潛力，故即使證據等級低仍給予 Strong 建議。');
    } else if (s.abraf === 'braf_neg') {
      cl.push('<b>BRAF 陰性</b>：續依 NGS 結果尋找 NTRK／RET fusion；<b>無可標靶變異者應優先考慮臨床試驗</b>（GPS 12），並依 Rec 25 使用 taxane 和／或 anthracycline，或 taxane ± 鉑類。');
    } else {
      cl.push('<b>BRAF 結果未回報</b>：依 Rec 19 <b>立即啟動化療作為橋接</b>，不可空等分子檢測；結果回報後再依變異調整。');
    }
    cl.push('<b>局部治療仍有角色（Rec 22）</b>：低轉移負荷之 IVC，若局部病灶有症狀或即將威脅呼吸道，EBRT ± 同步化療應列為優先<b>以降低窒息風險</b>。');
    cl = cl.concat(atcSystemic());
    cl.push('<b>存活參考與誠實告知</b>：ATC 歷史中位存活約 <b>5 個月</b>、1 年整體存活 <b>20%</b>；<b>3–10% 存活超過 10 年</b>。' +
      '關鍵限定：在多模式 vs 緩和意向的比較中，<b>IVC 病人之整體存活並不因治療方式而異</b>——效益集中於無遠處轉移者。指引因此明言「對積極治療的熱情必須有所節制」。' +
      '<span class="fu-gap">指引並未提供一張乾淨的分期別中位 OS 表；上列數字皆出自特定文獻的治療比較情境。</span>');
    result(R, F, 'rec-urgent', 'IVC 遠處轉移：以分子變異決定系統性治療，並同步啟動 goals of care',
      cl,
      'ATA ATC 2021 Rec 19–25、GPS 5／12／14。<b>GPS 14</b>：轉移性與進展性 ATC 預後極差，<b>best supportive care（hospice）亦應作為選項討論</b>。',
      'atc_active');
  }

  /* ---------- DTC ---------- */
  function renderDtcRec() {
    var s = thSt;
    if (s.histo !== 'dtc') return;
    var R = 'th_dtc_rec', F = 'th_dtc_fu';

    if (!s.dsurg) { idleRec(R, F, '請選擇步驟 2（初始處置：手術範圍）'); return; }

    // 積極監測
    if (s.dsurg === 'as') {
      result(R, F, 'rec-elective', '積極監測 Active surveillance（cT1aN0M0 乳突癌）',
        ['<b>ATA 2025 REC 11A（Conditional, Low）</b>：<b>「積極監測對部分 cT1aN0M0 乳突癌病人而言，是合適的處置選項。」</b>',
         '<b>ATA 2015 REC 12</b>列出四種可改採積極監測的情境：①極低風險腫瘤（如無臨床可見轉移或局部侵犯、細胞學無侵襲性證據之微小乳突癌）；②手術風險高；③預期餘命短；④有其他需先處理的醫療或外科問題。',
         '<b>ATA 2025 REC 11B（新選項）</b>：超音波導引<b>經皮消融</b>可作為積極監測或手術之外的替代方案（選擇性病人）。',
         '<b>不適合積極監測者</b>：侵犯喉返神經、氣管或食道者。',
         '<b>ATA 2025 REC 13：監測期間不建議常規測 Tg／TgAb</b>——以超音波為監測工具。'],
        'ATA 2025（PMID 40844370）REC 11–14；ATA 2015（PMID 26462967）REC 12。轉手術的觸發條件見下方追蹤區塊。', 'dtc_as');
      return;
    }

    // 已手術，尚未分層 → 手術計畫（中間狀態，不掛追蹤）
    if (!s.drisk) {
      var sg = [];
      if (s.dsurg === 'lobe') {
        sg.push('<b>ATA 2025 REC 15A（Strong, Moderate）</b>：<b>≤2cm 無明顯腺外侵犯之 cT1N0M0「應」做甲狀腺葉切除</b>，除非雙側癌或有其他對側切除指徵。');
        sg.push('<b>REC 15B（Conditional）</b>：<b>&gt;2 且 ≤4cm 之低風險單側 cT2N0M0，因風險與副作用顯著較低，葉切可為首選初始治療</b>；仍可選擇全切以利 RAI 給予與後續追蹤。');
        sg.push('<b>對照 ATA 2015 REC 35</b>：切點為 1cm／4cm——&lt;1cm 做葉切、1–4cm 雙側或單側皆可、&gt;4cm 做全切。<b>2025 年把「應做葉切」的上限由 1cm 上移至 2cm</b>，流程若沿用 2015 數值須標明版本。');
        sg.push('<b>補全切除（ATA 2025 REC 16A，Conditional）</b>：「可考慮用以處理殘存的原發惡性病灶、便於給予 RAI、和／或依術後評估之較高復發風險強化追蹤，<b>並須顧及喉返神經功能</b>」——語氣較 2015 REC 38A 保守。<b>REC 38B：不建議以 RAI 消融常規取代補全切除。</b>');
      } else {
        sg.push('<b>ATA 2025 REC 15C（Strong, Moderate）</b>：<b>&gt;4cm（cT3a）、任何大小合併明顯腺外侵犯（cT3b／cT4）、cN1 或 cM1 → 全甲狀腺切除 + 淋巴結廓清</b>。');
        sg.push('<b>ATA 2015 REC 35A</b>同向：&gt;4cm、或 gross ETE（cT4）、或 cN1、或 cM1 → near-total／total thyroidectomy。');
      }
      sg.push('<div class="cbx"><div class="cbx-h">淋巴結廓清　<span class="cbx-sub">ATA 2025 REC 19／20——中央區的語氣在 2025 年反轉</span></div><div class="cbx-items">' +
        '<span class="cb"><span class="cb-k">預防性中央區</span><b>REC 19A（Strong）：「大多數小型、非侵襲性、臨床淋巴結陰性之乳突癌（cT1–T2, cN0）與大多數濾泡癌，<b>不應</b>做預防性中央區廓清。」</b>——2015 REC 36B 原為「may be considered」</span>' +
        '<span class="cb"><span class="cb-k">例外</span>REC 19B（Conditional）：cN0 但 T3／T4，或該資訊將影響後續治療者「可考慮」，須權衡術中風險</span>' +
        '<span class="cb"><span class="cb-k">治療性中央區</span>REC 20A（Strong）：cN1a → 廓清含 <b>Level VI 及上段 Level VII</b></span>' +
        '<span class="cb"><span class="cb-k">cN1b</span>REC 20B（Conditional）：<b>同側中央區廓清應與側頸廓清、甲狀腺切除一併進行</b></span>' +
        '<span class="cb"><span class="cb-k">治療性側頸</span>REC 20C（Strong）：切片證實或臨床明顯之側頸轉移 → 廓清<b>典型含 Level IIa、III、IV、Vb</b></span>' +
        '<span class="cb"><span class="cb-k">不常規做</span>Level I、IIb、Va 不常規廓清，除非該區有轉移跡象</span>' +
        '</div></div>' +
        '<b>反轉的依據</b>（ATA 2025 引 Chen 等統合分析，n=18,376）：預防性中央區廓清使局部區域復發由 4.59% 降至 2.52%（OR 0.65），但<b>暫時性喉返神經損傷 OR 2.03、暫時性低血鈣 OR 2.23、永久性低血鈣 OR 2.22（CI 1.58–3.13）</b>——傷害超過獲益。' +
        '<b>ATA 2015 內文另明載：原發腫瘤的 BRAF V600E 狀態不應影響是否做預防性中央區廓清。</b>');
      sg.push('<b>高量術者（ATA 2025 REC 6）</b>：建議轉介年施行 <b>&gt;25–50 例</b>甲狀腺切除之術者。');
      sg.push('請於上方步驟 3 選擇復發風險分層，以取得 RAI 與 TSH 目標之建議。');
      result(R, F, 'rec-elective',
        s.dsurg === 'lobe' ? '甲狀腺葉切除 Lobectomy' : '全甲狀腺切除 Total thyroidectomy',
        sg,
        'ATA 2025（PMID 40844370）REC 6／15／16／19／20；ATA 2015（PMID 26462967）REC 35／36／37／38。', null);
      return;
    }

    // 已分層，尚未評反應 → RAI + TSH
    if (!s.dresp) {
      var riskTitle = s.drisk === 'low' ? '低風險' : (s.drisk === 'int' ? '中風險' : '高風險');
      var tshCtx = (s.dsurg === 'lobe' && s.drisk === 'low') ? 'lobe' : s.drisk;
      result(R, F, s.drisk === 'high' ? 'rec-nonop' : 'rec-elective',
        riskTitle + '：術後輔助治療（RAI 決策與 TSH 目標）',
        [dtcRAI(s.drisk), dtcTSH(tshCtx),
         '<b>下一步</b>：ATA 2025 REC 29（Strong）規定應以<b>反應準則分類治療反應</b>後，才決定後續治療或監測強度——請續選步驟 4。術後 Tg 於<b>全切後 6–12 週</b>測（達最低點的中位時間為 12 週）。'],
        'ATA 2025 REC 29／30／32／34／45／46；ATA 2015 REC 51／54–59／81。' +
          (s.drisk === 'low' ? '' : '<span class="fu-gap">ATA 2025 之四級風險分層（低／低中／中高／高）逐項準則僅存在於其 Figure 2 圖片，無法自 PDF 文字層擷取，故本頁維持 ATA 2015 三級。</span>'),
        'dtc_curative');
      return;
    }

    if (s.dresp === 'excellent') {
      result(R, F, 'rec-elective', '反應極佳 Excellent response → 降低追蹤強度與 TSH 抑制',
        ['<b>ATA 2015 Table 13</b>：復發率 <b>1–4%</b>，疾病特異死亡率 &lt;1%。指引明載此結果「<b>應導致及早降低追蹤強度與頻率、以及 TSH 抑制的程度</b>」。',
         dtcTSH('excellent'),
         '<b>不需重複刺激性 Tg 測定</b>（ATA 2015 REC 63B）。',
         '<b>ATA 2025 REC 48「完全緩解」（全新概念）</b>：低風險且持續反應極佳達 <b>10–15 年</b>者，<b>不需再為甲狀腺癌做常規生化監測，應視為已達完全緩解</b>——這是本指引首次為 DTC 定義治癒出口。'],
        'ATA 2015 REC 63B／70D、Table 13；ATA 2025 REC 48。', 'dtc_excellent');
      return;
    }

    if (s.dresp === 'indeterminate') {
      result(R, F, 'rec-elective', '反應不確定 Indeterminate → 續觀察、序列影像與 Tg',
        ['<b>ATA 2015 Table 13</b>：<b>15–20% 於追蹤中出現結構性疾病</b>，其餘穩定或消退；死亡率 &lt;1%。',
         '處置：續觀察並做序列影像與 Tg；轉為可疑者再評估或切片。',
         dtcTSH('excellent'),
         '<b>ATA 2025 Table 9 的三欄切點</b>：全切+RAI 者 indeterminate 為抑制下 Tg 0.2–1 或刺激後 1–10；<b>全切但未做 RAI 者為抑制下 Tg 2.5–5</b>；葉切者不以 Tg 分類。<span class="fu-gap">Table 9 腳註明載「最佳 TSH 目標範圍之資料尚無定論」。</span>'],
        'ATA 2015 Table 13、REC 70C/D；ATA 2025 Table 9。', 'dtc_curative');
      return;
    }

    if (s.dresp === 'bio_inc') {
      result(R, F, 'rec-nonop', '生化未完全緩解 Biochemical incomplete → 依 Tg 趨勢決定',
        ['<b>ATA 2015 Table 13 之自然史</b>：<b>≥30% 自行轉為無疾病證據</b>、20% 經追加治療後轉為無疾病證據、<b>20% 發展出結構性疾病</b>；死亡率 &lt;1%。',
         '<b>處置取決於趨勢</b>：Tg <b>穩定或下降</b> → 觀察並續 TSH 抑制；Tg <b>上升</b> → 進一步檢查與治療。',
         dtcTSH('bio_inc'),
         '<b>影像定位</b>：Tg 升高但 RAI 影像陰性時，FDG-PET 適用於<b>高風險且 Tg 一般 &gt;10 ng/mL</b> 者；<b>刺激後 Tg ≤10 ng/mL 時 FDG-PET 敏感度僅 &lt;10–30%</b>，不宜貿然使用。',
         '<b>ATA 2025 REC 58A</b>：無結構性病灶且（停藥法）刺激後 Tg &lt;10 ng/mL 者，可續觀察。',
         '<b>復發率</b>（ATA 2025）：全切+RAI 者 <b>20–53%</b>（若合併結構性疾病可達 85%）；全切未做 RAI 者 0–31.6%。'],
        'ATA 2015 Table 13、REC 68A／70B；ATA 2025 REC 58A。', 'dtc_curative');
      return;
    }

    // 結構未完全緩解
    if (!s.drefr) {
      result(R, F, 'rec-nonop', '結構未完全緩解 Structural incomplete → 先判定是否仍具攝碘能力',
        ['<b>ATA 2015 Table 13</b>：<b>50–85% 於追加治療後仍持續存在</b>；局部區域轉移死亡率可達 <b>11%</b>，<b>遠處結構性轉移可達 50%</b>——這是四類反應中唯一有實質死亡風險者。',
         '處置依<b>大小、位置、生長速率、RAI／FDG 攝取狀況與病理</b>決定治療或觀察。',
         dtcTSH('str_inc'),
         '<b>局部處理優先</b>：可於解剖影像定位、<b>中央區 ≥8 mm、側頸 ≥10 mm</b>（最小徑）者可考慮再手術（ATA 2015 REC 71）；ATA 2025 REC 52 另提供<b>酒精注射（PEI）與射頻消融（RFA）</b>作為再手術高風險者的替代。',
         '請於上方步驟 5 判定是否為 RAI 難治，以決定續用 RAI 或轉系統性治療。'],
        'ATA 2015 Table 13、REC 70A／71；ATA 2025 REC 52。', 'dtc_curative');
      return;
    }

    if (s.drefr === 'avid') {
      result(R, F, 'rec-elective', '病灶仍具攝碘能力 → 續行 RAI 治療',
        ['<b>ATA 2025 REC 59 之立場</b>：RAI 難治的判定特徵「應用來<b>風險分層腫瘤對 RAI 反應的可能性，而非作為硬性排除是否再給 RAI 的判定標準</b>」——比 2015 版寬鬆。',
         '<b>活度</b>：遠處轉移 <b>100–200 mCi</b>（3.7–7.4 GBq），或考慮劑量學（ATA 2025 Table 10）。ESMO 2019：每 6 個月一次、共 2 年。',
         '<b>停損點</b>：ESMO 2019 明載<b>累積劑量達 600 mCi 後病灶仍持續者，治癒機會渺茫</b>。ATA 2025 REC 55A：<b>&gt;70 歲或腎衰竭者應避免經驗性給予 &gt;150 mCi</b>。',
         '<b>準備方式</b>：rhTSH 刺激優於停藥（ATA 2025 REC 34A，Strong, High），目標 TSH &gt;30 mIU/L，低碘飲食 1–2 週。',
         dtcTSH('str_inc')],
        'ATA 2025 REC 34／55／59、Table 10；ESMO 2019（PMID 31549998）。', 'dtc_curative');
      return;
    }

    result(R, F, 'rec-urgent', 'RAI 難治（RAI-refractory）→ 分子分型後啟動系統性治療',
      dtcSystemic(),
      'ATA 2025（PMID 40844370）REC 59–79；ATA 2015 REC 91／92／96／97；NCCN Thyroid Carcinoma v1.2025 Insights（PMID 40639400）；ESMO 2019／2022（PMID 31549998／35491008）。' +
        '<span class="fu-gap">NCCN 現行版本為 v2.2026，其 PDF 需註冊登入，本頁僅能引用經同儕審查、開放全文的 v1.2025 Insights「全身性治療」章節；NCCN 之手術範圍、積極監測、頸廓清、RAI 適應症、TSH 目標與追蹤排程均未能查證，故未引用。</span>',
      'dtc_sys');
  }

  /* ============================================================
     事件
     ============================================================ */
  function thPick(key, val, btn) {
    thSel(btn);
    var s = thSt;
    if (key === 'histo') {
      s.histo = val;
      s.dsurg = s.drisk = s.dresp = s.drefr = null;
      s.mext = s.mctn = s.mdt = null;
      s.astage = s.abraf = null;
      thClearSel(['th_ds2', 'th_ds3', 'th_ds4', 'th_ds5', 'th_ms2', 'th_ms3', 'th_ms4', 'th_as2', 'th_as3']);
    }
    else if (key === 'mext') { s.mext = val; s.mctn = s.mdt = null; thClearSel(['th_ms3', 'th_ms4']); }
    else if (key === 'mctn') { s.mctn = val; s.mdt = null; thClearSel(['th_ms4']); }
    else if (key === 'mdt') { s.mdt = val; }
    else if (key === 'astage') { s.astage = val; s.abraf = null; thClearSel(['th_as3']); }
    else if (key === 'abraf') { s.abraf = val; }
    else if (key === 'dsurg') { s.dsurg = val; s.drisk = s.dresp = s.drefr = null; thClearSel(['th_ds3', 'th_ds4', 'th_ds5']); }
    else if (key === 'drisk') { s.drisk = val; s.dresp = s.drefr = null; thClearSel(['th_ds4', 'th_ds5']); }
    else if (key === 'dresp') { s.dresp = val; s.drefr = null; thClearSel(['th_ds5']); }
    else if (key === 'drefr') { s.drefr = val; }
    thRender();
  }

  function thReset() {
    for (var k in thSt) { if (thSt.hasOwnProperty(k)) thSt[k] = null; }
    var root = document.getElementById('thPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['th_dtc_fu', 'th_mtc_fu', 'th_atc_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    thRender();
  }

  function initThyroidPathway() { thReset(); }

  global.thyroidPathwayHTML = thyroidPathwayHTML;
  global.initThyroidPathway = initThyroidPathway;
  global.thPick = thPick;
  global.thReset = thReset;
})(window);
