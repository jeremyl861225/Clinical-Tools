/* ============================================================
   慢性骨髓性白血病 治療互動決策流程
   Chronic Myeloid Leukemia Treatment Pathway
   ------------------------------------------------------------
   ※ 本模組不是台大診療指引。
   台大血癌診療指引版次 15 之化療章節僅涵蓋 AML；CML 在該指引中只出現於放射
   治療章節（Leukemia Radiation Therapy Guidelines v1.0, 2025/09）的兩處：
   全身照射之適應症「末期之快速進展或芽細胞危象」，以及脾臟照射。
   該兩處在本流程中以「台大放療章節」徽章標示；其餘 TKI 相關內容依
   ELN 2020 建議與公開之關鍵臨床試驗整編，文獻見頁尾 PubMed 連結。
   ------------------------------------------------------------
   ELN 2020 的治療反應里程碑（BCR::ABL1 國際標準值 IS）是本流程的核心；
   數值一律附上「請對照 ELN 2020 原文核對」的提醒，因為各實驗室的 IS 換算
   與判讀時點會影響結論。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var cmSt = {
    phase: null,     // cp | ap | bp
    track: null,     // first | monitor | tfr（慢性期之三種情境）
    risk: null,      // low | interm（ELTS）
    milestone: null, // optimal | warning | failure
    bptype: null     // myeloid | lymphoid
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="cmPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function hideStep(h, id) { return h.replace('id="' + id + '"', 'id="' + id + '" class="hidden"'); }

  /* ---------- 版面 HTML ---------- */
  function cmlPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><span class="tx-role" style="background:#a33a2f;">來源提醒</span> ' +
      '<b>本流程不是台大診療指引。</b>台大血癌診療指引版次 15 之化療章節僅涵蓋 AML，CML 在該指引中只有放射治療章節的兩處：' +
      '末期快速進展或芽細胞危象之全身照射，以及脾臟照射——該兩處在下方以<b>綠色徽章</b>標示。' +
      '其餘 TKI 內容依 <b>ELN 2020 建議</b>與公開之關鍵臨床試驗整編。院內另有規定時以院內規定為準。</p>';
    h += '<div class="onc-path" id="cmPath">';

    h += step('cm_s1', '1', '疾病病期（依骨髓與周邊血芽細胞比例判定）',
      opt('phase', 'cp', '慢性期 Chronic phase (CP)', '芽細胞 <10%；絕大多數病人初診時屬此期') +
      opt('phase', 'ap', '加速期 Accelerated phase (AP)', '芽細胞約 10–19%，或其他加速指標') +
      opt('phase', 'bp', '芽細胞期 Blast phase (BP)', '芽細胞 ≥20%，或有髓外芽細胞病灶'),
      '<div class="note"><b>病期定義各版本不一致，引用時務必註明所依版本。</b>ELN 2020 之加速期／芽細胞期定義與 WHO 第 5 版、ICC（2022）之門檻並不相同（例如 WHO 第 5 版已取消獨立的加速期，改以「高風險特徵」描述）。本頁採臨床上最通用的芽細胞比例分界，實際判讀請依所在單位採用之分類。<br><b>初診必做</b>：骨髓抽吸＋切片（含細胞遺傳學核型，用以偵測附加染色體異常）、<b>BCR::ABL1 定量（國際標準值 IS）</b>與轉錄本型別（e13a2／e14a2／e1a2）、脾臟大小（觸診距肋弓公分數，為風險評分所需）、心血管風險評估（將影響 TKI 選擇）。</div>');

    /* ===================== 慢性期 ===================== */
    h += '<div id="cm_cp" class="hidden">';
    h += conn('cm_c2');
    h += step('cm_s2', '2', '目前面對的問題',
      opt('track', 'first', '初診 · 選擇第一線 TKI', '尚未開始治療') +
      opt('track', 'monitor', '治療中 · 評估治療反應', '已用 TKI，要判定是否需要換藥') +
      opt('track', 'tfr', '深度分子反應 · 考慮停藥', '評估是否可嘗試無治療緩解 TFR'));

    h += connH('cm_c3');
    h += step('cm_s3', '3', '<b>ELTS</b> 風險評分（EUTOS long-term survival）',
      opt('risk', 'low', '低風險 Low', '') +
      opt('risk', 'interm', '中或高風險 Intermediate / High', ''),
      '<div class="note"><b>ELTS 優於舊的 Sokal 分數</b>：Sokal（1984）建立於干擾素年代，以整體死亡為終點，在 TKI 年代會高估風險；ELTS 以「CML 相關死亡」為終點，較能反映現況。兩者皆由<b>年齡、脾臟大小、血小板數、周邊血芽細胞比例</b>計算，請以線上計算器取得分數，勿以印象判定。</div>');
    h = hideStep(h, 'cm_s3');

    h += connH('cm_c4');
    h += step('cm_s4', '3', '<b>ELN 2020</b> 治療反應里程碑（BCR::ABL1 IS）',
      opt('milestone', 'optimal', '最佳反應 Optimal', '3 個月 ≤10%｜6 個月 ≤1%｜12 個月及其後 ≤0.1%') +
      opt('milestone', 'warning', '警示 Warning', '介於最佳與失敗之間 → 加密監測，先別急著換藥') +
      opt('milestone', 'failure', '治療失敗 Failure', '6 個月 >10%｜12 個月及其後 >1%｜或失去既有反應'),
      '<div class="note"><b>上列數值請對照 ELN 2020 原文核對</b>（見頁尾文獻）——各實驗室之 IS 換算、檢體品質與判讀時點都會影響結論，且 ELN 2020 對「以存活為目標」與「以爭取停藥（TFR）為目標」設有不同的期待值。<br><b>判定失敗前必須先排除兩件事</b>：①<b>服藥順從性</b>（這是反應不佳最常見且最容易被忽略的原因）；②<b>藥物交互作用</b>（尤其影響 CYP3A4 者、以及需胃酸才能吸收的 TKI 併用制酸劑）。</div>');
    h = hideStep(h, 'cm_s4');

    h += rec('cm_cp_rec', '建議處置 · 慢性期 CML');
    h += '<div class="flow-fu hidden" id="cm_cp_fu"></div>';
    h += '</div>'; // cm_cp

    /* ===================== 加速期 ===================== */
    h += '<div id="cm_ap" class="hidden">';
    h += conn('cm_c10');
    h += rec('cm_ap_rec', '建議處置 · 加速期 CML');
    h += '<div class="flow-fu hidden" id="cm_ap_fu"></div>';
    h += '</div>';

    /* ===================== 芽細胞期 ===================== */
    h += '<div id="cm_bp" class="hidden">';
    h += conn('cm_c20');
    h += step('cm_s20', '2', '芽細胞之系列（決定併用之化療骨架）',
      opt('bptype', 'myeloid', '骨髓系 Myeloid blast crisis', '約占三分之二') +
      opt('bptype', 'lymphoid', '淋巴系 Lymphoid blast crisis', '約占三分之一，對化療反應較好'));
    h += rec('cm_bp_rec', '建議處置 · 芽細胞期 CML');
    h += '<div class="flow-fu hidden" id="cm_bp_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="cmReset()">重置</button></div>';
    h += '</div>'; // cmPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function cmSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function cmShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function cmClearSel(ids) {
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

  /* ---------- 追蹤區塊 ---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h = '';
    if (type === 'molecular') {
      h = '<div class="fu-label">分子監測 Follow-up（ELN 2020）</div><ul class="fu-list">' +
        '<li><b>BCR::ABL1 定量（IS）</b>：開始治療後每 3 個月一次，直至穩定達成主要分子反應（MMR，≤0.1%）；之後可延長為每 3–6 個月。<b>檢驗須由通過國際標準化的實驗室執行</b>，否則跨院比較的數值沒有意義。</li>' +
        '<li><b>反應不如預期或失去反應時</b>：先確認服藥順從性與藥物交互作用，再送 <b><i>ABL1</i> 激酶區突變</b>檢測，並考慮重做骨髓細胞遺傳學以偵測附加染色體異常。</li>' +
        '<li><b>TKI 之長期毒性監測</b>：心血管風險（<span class="drug">nilotinib</span>、<span class="drug">ponatinib</span> 之動脈阻塞事件）；<b>肋膜積液與肺動脈高壓</b>（<span class="drug">dasatinib</span>）；肝功能、血糖與血脂；<b>QTc</b>。毒性與療效同等重要，是換藥的正當理由。</li>' +
        '<li><b>懷孕與生育</b>：TKI 具致畸性，育齡女性須有明確避孕計畫；有生育規劃者應提早討論停藥時機與監測安排。</li>' +
        '</ul>';
    } else if (type === 'tfr') {
      h = '<div class="fu-label">停藥後之監測 Follow-up（TFR）</div><ul class="fu-list">' +
        '<li><b>停藥後的監測密度是 TFR 能否安全執行的關鍵</b>：前 6 個月<b>每月</b>、其後 6 個月每 2 個月、滿 2 年後每 3 個月做 BCR::ABL1 定量。做不到這個密度就不應停藥。</li>' +
        '<li><b>失去主要分子反應（MMR，>0.1% IS）即立刻恢復原 TKI</b>；絕大多數病人可再度取得深度分子反應。</li>' +
        '<li>約半數病人可維持長期無治療緩解；<b>復發多發生在停藥後前 6 個月</b>。</li>' +
        '<li><b>停藥戒斷症候群</b>：約兩到三成病人出現肌肉骨骼疼痛，多為自限性，必要時症狀治療。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>密切追蹤血球數、芽細胞比例與髓外病灶；持續評估體能狀態與移植可行性。</li>' +
        '<li><b>盡早完成 HLA 分型與移植評估</b>——進行期 CML 的治療窗口很窄，等到 TKI 明顯失效才轉介往往已來不及。</li>' +
        '<li>疾病進展或多線失敗 → 臨床試驗；體能極差者整合安寧緩和照護。</li>' +
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

  var tkiNote =
    '本區塊之處置依 ELN 2020 建議與公開臨床試驗整編，括號內為試驗名稱，對應文獻見頁尾「主要文獻」。' +
    'TKI 之核准適應症與健保給付條件（尤其第二線以後與 asciminib、ponatinib）各異，用藥前請先確認。';

  /* TKI 選擇之共病考量——影響第一線與換藥決策，故抽成共用段落 */
  function tkiSafety() {
    return '<span class="rx-h">依共病選 TKI（與療效同等重要）</span>' +
      '<b>心血管疾病、糖尿病或高血脂</b> → 避免 <span class="drug">nilotinib</span> 與 <span class="drug">ponatinib</span>（動脈阻塞事件）。' +
      '<b>慢性肺病、肋膜積液病史</b> → 避免 <span class="drug">dasatinib</span>（肋膜積液、肺動脈高壓）。' +
      '<b>腸胃道疾病</b> → <span class="drug">bosutinib</span> 之腹瀉較明顯。' +
      '<b>QTc 延長</b> → 注意 nilotinib。' +
      '<b>年長或追求低毒性</b> → <span class="drug">imatinib</span> 之長期安全性資料最完整。';
  }

  /* ---------- 主渲染 ---------- */
  function cmRender() {
    var s = cmSt;
    cmShow('cm_cp', s.phase === 'cp');
    cmShow('cm_ap', s.phase === 'ap');
    cmShow('cm_bp', s.phase === 'bp');

    var first = (s.phase === 'cp' && s.track === 'first');
    cmShow('cm_c3', first); cmShow('cm_s3', first);
    var monitor = (s.phase === 'cp' && s.track === 'monitor');
    cmShow('cm_c4', monitor); cmShow('cm_s4', monitor);

    renderCP();
    renderAP();
    renderBP();
  }

  function renderCP() {
    var s = cmSt;
    if (s.phase !== 'cp') return;
    var R = 'cm_cp_rec', F = 'cm_cp_fu';
    if (!s.track) { idleRec(R, F, '請選擇步驟 2（目前面對的問題）'); return; }

    /* ---- 第一線 ---- */
    if (s.track === 'first') {
      if (!s.risk) { idleRec(R, F, '請選擇步驟 3（ELTS 風險評分）'); return; }
      var lines = [];
      lines.push('<span class="rx-h">核心原則</span>' +
        '<b>慢性期 CML 的第一線目標是把病人帶進正常餘命</b>——TKI 問世後，慢性期 CML 病人的存活已接近一般族群（<b>IRIS</b> 十年追蹤）。' +
        '<b>第一線 TKI 的選擇並非比誰最強，而是在「達成深度分子反應的速度」與「長期毒性」之間取捨。</b>');
      if (s.risk === 'low') {
        lines.push('<span class="rx-h">ELTS 低風險</span>' +
          '<span class="drug">Imatinib</span> 400 mg qd 即為合理之首選——長期安全性資料最完整、費用最低，' +
          '且低風險族群以 imatinib 已可取得優良結果（<b>IRIS</b>）。' +
          '<b>若病人明確以「將來停藥（TFR）」為目標</b>，則第二代 TKI 較快達到深度分子反應，可列為優先。');
      } else {
        lines.push('<span class="rx-h">ELTS 中／高風險</span>' +
          '優先考慮<b>第二代 TKI</b>——其達成早期分子反應與深度分子反應的比例高於 imatinib，並降低進展至加速期／芽細胞期的風險：' +
          '<span class="drug">nilotinib</span>（<b>ENESTnd</b>）｜<span class="drug">dasatinib</span>（<b>DASISION</b>）｜<span class="drug">bosutinib</span>（<b>BFORE</b>）。');
      }
      lines.push('<span class="rx-h">新一代選項</span>' +
        '<span class="drug">Asciminib</span>（<b>STAMP 機轉</b>，結合於 ABL1 之肉豆蔻醯基口袋而非 ATP 結合位）於初診族群之分子反應優於研究者選定之 TKI，且毒性較低（<b>ASC4FIRST</b>）。' +
        '其與傳統 TKI 機轉不同，交叉抗藥性型態亦不同。');
      lines.push(tkiSafety());
      lines.push('<span class="rx-h">起始後的第一件事</span>' +
        '<b>衛教服藥順從性</b>——CML 是每日口服、長期服用的疾病，順從性不佳是反應不良最常見的原因，其影響超過多數藥物選擇上的差異。' +
        '同時建立 <b>3 個月</b>回診做 BCR::ABL1 定量的節奏（見下方監測）。');
      result(R, F, 'rec-elective',
        s.risk === 'low' ? '慢性期 · ELTS 低風險：第一線 TKI' : '慢性期 · ELTS 中／高風險：第一線 TKI',
        lines, tkiNote, 'molecular');
      return;
    }

    /* ---- 反應評估 ---- */
    if (s.track === 'monitor') {
      if (!s.milestone) { idleRec(R, F, '請選擇步驟 3（ELN 2020 里程碑）'); return; }
      if (s.milestone === 'optimal') {
        result(R, F, 'rec-elective', 'ELN 2020：最佳反應 → 維持現行 TKI', [
          '<span class="rx-h">處置</span><b>不換藥</b>，維持原 TKI 與原劑量。',
          '<span class="rx-h">監測</span>持續每 3 個月做 BCR::ABL1 定量，直至穩定達成主要分子反應（MMR，≤0.1% IS），之後可延長為每 3–6 個月。',
          '<span class="rx-h">往前看</span>持續達到並維持<b>深度分子反應</b>（MR4.0 或更深）者，未來可能符合<b>停藥（TFR）</b>條件——若病人有此意願，應及早把「維持深度反應足夠久」納入治療目標，並確認所在單位具備停藥後的高密度監測能力。',
          '<span class="rx-h">別忽略毒性</span>反應良好但長期毒性難以忍受者，<b>換用另一種 TKI 是正當的</b>；CML 的治療是以數十年計，生活品質同樣是療效的一部分。'
        ], tkiNote, 'molecular');
        return;
      }
      if (s.milestone === 'warning') {
        result(R, F, 'rec-nonop', 'ELN 2020：警示 → 加密監測、先查原因，別急著換藥', [
          '<span class="rx-h">警示的意義</span>' +
            '<b>「Warning」不是「Failure」</b>——它代表需要更密切追蹤與尋找可矯正的原因，而不是立即換藥。過早換藥會用掉後線選項。',
          '<span class="rx-h">先查這三件事</span>' +
            '①<b>服藥順從性</b>（最常見，且最容易被病人與醫師同時低估）；' +
            '②<b>藥物交互作用</b>（CYP3A4 誘導劑或抑制劑；需胃酸吸收之 TKI 併用制酸劑）；' +
            '③<b>檢驗本身</b>（檢體品質、實驗室是否通過國際標準化、是否為同一實驗室之連續數值）。',
          '<span class="rx-h">加密監測</span>縮短為<b>每 1–3 個月</b>做 BCR::ABL1 定量，觀察趨勢而非單一數值——<b>連續上升</b>比單次偏高更有意義。',
          '<span class="rx-h">若趨勢持續惡化</span>送 <b><i>ABL1</i> 激酶區突變</b>檢測並考慮重做骨髓細胞遺傳學（偵測附加染色體異常），依結果比照「治療失敗」處理。'
        ], tkiNote, 'molecular');
        return;
      }
      result(R, F, 'rec-urgent', 'ELN 2020：治療失敗 → 換藥，並先做突變檢測', [
        '<span class="rx-h">第一步（換藥之前）</span>' +
          '確認<b>服藥順從性</b>與<b>藥物交互作用</b>；送 <b><i>ABL1</i> 激酶區突變</b>檢測；' +
          '重做骨髓（細胞遺傳學）以確認<b>是否已進展至加速期或芽細胞期</b>——這會完全改變處置方向。',
        '<span class="rx-h">依突變選藥</span>' +
          '<b>T315I</b> → <span class="drug">ponatinib</span>（<b>PACE</b>；劑量最適化見 <b>OPTIC</b>，以較低起始劑量降低動脈阻塞風險）或 <span class="drug">asciminib</span>（需較高劑量）。' +
          '<b>其他突變或無突變</b> → 換用另一種第二代 TKI，或 <span class="drug">asciminib</span>（<b>ASCEMBL</b>：於已用過兩線以上者優於 bosutinib）。',
        tkiSafety(),
        '<span class="rx-h">異體造血幹細胞移植</span>' +
          '<b>多線 TKI 失敗、T315I 併其他突變、或已進展至進行期者，應轉介移植評估。</b>' +
          'TKI 年代雖已大幅減少移植需求，但它仍是 TKI 失效後最確定的治癒手段——<b>不要等到沒有選項才轉介</b>。',
        '<span class="rx-h">臨床試驗</span>多線失敗者應主動評估臨床試驗。'
      ], tkiNote, 'molecular');
      return;
    }

    /* ---- 停藥 TFR ---- */
    result(R, F, 'rec-nonop', '評估無治療緩解（TFR）：條件嚴格，監測比停藥本身更關鍵', [
      '<span class="rx-h">停藥前應同時滿足（依 EURO-SKI 與 STIM 等研究之族群條件）</span>' +
        '<b>①</b> 一路為<b>慢性期</b>，未曾進展至加速期或芽細胞期；' +
        '<b>②</b> TKI 已使用<b>足夠長的時間</b>（多數研究要求數年以上）；' +
        '<b>③</b> 已達<b>深度分子反應</b>（MR4.0 或更深）並<b>穩定維持相當時間</b>（多數研究要求至少 2 年）；' +
        '<b>④</b> 可取得<b>通過國際標準化、且能快速回報</b>的 BCR::ABL1 定量檢驗；' +
        '<b>⑤</b> 病人理解並願意配合停藥後的高密度監測。',
      '<span class="rx-h">最重要的一句</span>' +
        '<b>做不到停藥後的高密度監測，就不應該停藥。</b>TFR 的安全性完全建立在「一旦失去主要分子反應能立刻發現並復用 TKI」之上；' +
        '監測跟不上時，停藥的風險遠大於獲益。',
      '<span class="rx-h">預期結果</span>' +
        '約半數病人可維持長期無治療緩解（<b>EURO-SKI</b>、<b>STIM1</b>）；<b>復發多發生在停藥後前 6 個月</b>，' +
        '且<b>絕大多數復發者在恢復原 TKI 後可再度取得深度分子反應</b>——這是 TFR 得以被視為安全嘗試的前提。',
      '<span class="rx-h">不建議自行嘗試</span>' +
        '停藥應在有經驗的單位、依明確的監測計畫進行，<b>不是把藥停掉就好</b>。'
    ], tkiNote, 'tfr');
  }

  function renderAP() {
    if (cmSt.phase !== 'ap') return;
    result('cm_ap_rec', 'cm_ap_fu', 'rec-nonop', '加速期：換用強效 TKI，同時啟動移植評估', [
      '<span class="rx-h">先分清楚兩種情境</span>' +
        '<b>初診即為加速期</b>（未曾用過 TKI）與<b>治療中由慢性期進展</b>而來，預後與藥物選擇不同：' +
        '前者對 TKI 反應可能仍佳；後者代表現行 TKI 已失效，須換藥並更積極走向移植。',
      '<span class="rx-h">藥物</span>' +
        '選用<b>強效 TKI</b>並依 <b><i>ABL1</i> 激酶區突變</b>檢測結果決定：' +
        '<span class="drug">dasatinib</span>｜<span class="drug">nilotinib</span>｜<span class="drug">bosutinib</span>；' +
        '<b>T315I</b> 或多重抗藥者 → <span class="drug">ponatinib</span>（<b>PACE</b>）。必要時併用化療。',
      '<span class="rx-h">異體造血幹細胞移植</span>' +
        '<b>加速期應同步啟動移植評估與 HLA 分型，不要等 TKI 反應出來再開始找捐者</b>——找捐者本身就需要時間，' +
        '而進行期 CML 的治療窗口很窄。目標是先以 TKI 拉回慢性期，再於最佳狀態下移植。',
      '<span class="rx-h">監測</span>比慢性期更密集地追蹤血球數、芽細胞比例與 BCR::ABL1；' +
        '重做骨髓細胞遺傳學以偵測<b>附加染色體異常</b>（clonal evolution），其出現代表疾病生物學已改變。'
    ], tkiNote, 'palliative');
  }

  function renderBP() {
    var s = cmSt;
    if (s.phase !== 'bp') return;
    var R = 'cm_bp_rec', F = 'cm_bp_fu';
    if (!s.bptype) { idleRec(R, F, '請選擇步驟 2（芽細胞之系列）'); return; }
    var lines = [];
    lines.push('<span class="rx-h">目標很明確</span>' +
      '<b>芽細胞期的治療目標是把病人拉回慢性期，再盡快銜接異體造血幹細胞移植。</b>' +
      '單靠 TKI 或化療而不移植者，緩解多為短暫。');
    if (s.bptype === 'myeloid') {
      lines.push('<span class="rx-h">骨髓系芽細胞危象</span>' +
        '<b>TKI ＋ AML 型化療</b>（如 Ara-C／蒽環類為基礎，或低強度之去甲基化藥物併 <span class="drug">venetoclax</span>，依體能決定強度）。' +
        'TKI 依 <b><i>ABL1</i> 激酶區突變</b>結果選擇；<b>T315I</b> → <span class="drug">ponatinib</span>。');
    } else {
      lines.push('<span class="rx-h">淋巴系芽細胞危象</span>' +
        '<b>TKI ＋ ALL 型化療</b>（如 hyper-CVAD 骨架，或年長者以 TKI ＋ 類固醇為主）。' +
        '<b>淋巴系對治療的反應優於骨髓系</b>，取得第二次慢性期的機會較高。' +
        '<b>務必加上中樞神經預防</b>（鞘內化療）——淋巴系芽細胞危象之中樞神經侵犯風險明顯較高。');
    }
    lines.push('<span class="rx-h">異體造血幹細胞移植</span>' +
      '<b>這是芽細胞期唯一具治癒潛力的手段。</b>應在診斷芽細胞期的當下即啟動 HLA 分型與捐者搜尋，' +
      '與拉回慢性期的治療<b>並行</b>進行，不可依序等待。');
    lines.push('<span class="tx-role" style="background:var(--accent);">台大放療章節</span> ' +
      '<b>全身照射（TBI）</b>之 CML 適應症為「<b>末期之快速進展或芽細胞危象</b>」（台大 Leukemia Radiation Therapy Guidelines v1.0, 2025/09）。' +
      '照射參數：1.3–2.0 Gy／分次，每日兩次共 3–5 天（選擇性），總劑量 2–15 Gy，劑量率 5–10 cGy/min，分次間隔至少 4–6 小時；' +
      '減低強度前處置之移植則常用 2–4 Gy 分 1–2 次。');
    lines.push('<span class="rx-h">髓外芽細胞病灶</span>' +
      '芽細胞期常見髓外病灶（中樞神經、皮膚、淋巴結、骨骼）。<b>有神經症狀者務必做腰椎穿刺與影像</b>；' +
      '中樞神經侵犯依台大放療章節之「CNS 復發治療選項」處理。');
    lines.push('<span class="rx-h">臨床試驗與安寧</span>' +
      '芽細胞期預後嚴峻，應同時評估臨床試驗；體能極差或多線失敗者，及早整合安寧緩和照護。');
    result(R, F, 'rec-urgent',
      s.bptype === 'myeloid' ? '芽細胞期（骨髓系）：TKI + AML 型化療 → 移植' : '芽細胞期（淋巴系）：TKI + ALL 型化療 → 移植',
      lines, tkiNote, 'palliative');
  }

  /* ---------- 事件 ---------- */
  function cmPick(key, val, btn) {
    cmSel(btn);
    var s = cmSt;
    if (key === 'phase') {
      s.phase = val; s.track = s.risk = s.milestone = s.bptype = null;
      cmClearSel(['cm_s2', 'cm_s3', 'cm_s4', 'cm_s20']);
    } else if (key === 'track') {
      s.track = val; s.risk = s.milestone = null;
      cmClearSel(['cm_s3', 'cm_s4']);
    } else if (key === 'risk') { s.risk = val; }
    else if (key === 'milestone') { s.milestone = val; }
    else if (key === 'bptype') { s.bptype = val; }
    cmRender();
  }

  function cmReset() {
    for (var k in cmSt) { if (cmSt.hasOwnProperty(k)) cmSt[k] = null; }
    var root = document.getElementById('cmPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['cm_cp_fu', 'cm_ap_fu', 'cm_bp_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    cmRender();
  }

  function initCmlPathway() { cmReset(); }

  // 匯出
  global.cmlPathwayHTML = cmlPathwayHTML;
  global.initCmlPathway = initCmlPathway;
  global.cmPick = cmPick;
  global.cmReset = cmReset;
})(window);
