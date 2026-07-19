/* ============================================================
   骨髓分化不良症候群／腫瘤 治療互動決策流程
   Myelodysplastic Syndromes / Neoplasms (MDS) Treatment Pathway
   ------------------------------------------------------------
   ※ 本模組不是台大診療指引。
   台大血癌診療指引版次 15 之化療章節僅涵蓋 AML；MDS 在該指引中只出現於
   AML-1 的分流出口（「Myelodysplastic syndrome/neoplasm」），並無治療流程，
   放射治療章節亦未提及 MDS。因此本病種在台大指引中沒有任何可引用的處置內容。
   本流程依 IPSS-R／IPSS-M 分層與公開之關鍵臨床試驗整編，文獻見頁尾 PubMed 連結。
   ------------------------------------------------------------
   MDS 的治療決策幾乎完全由「風險分組」決定，且低危與高危的治療目標相反：
   低危以改善血球數與生活品質為目標，高危以延緩轉為 AML、延長存活為目標。
   流程即以此二分為第一步。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var mdSt = {
    risk: null,     // lower | higher
    issue: null,    // anemia | cytopenia | watch（低危）
    marker: null,   // del5q | rs | none（低危貧血）
    fit: null       // fit | unfit（高危：移植適格）
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="mdPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function mdsPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><span class="tx-role" style="background:#a33a2f;">來源提醒</span> ' +
      '<b>本流程不是台大診療指引。</b>台大血癌診療指引版次 15 之化療章節僅涵蓋 AML，' +
      '<b>MDS 在該指引中只有 AML-1 的分流出口，沒有任何治療內容，放療章節亦未提及</b>——' +
      '本病種是四個新增血液腫瘤條目中，台大指引著墨最少的一個。' +
      '下列內容依 <b>IPSS-R／IPSS-M 分層</b>與公開之關鍵臨床試驗整編。院內另有規定時以院內規定為準。</p>';
    h += '<div class="onc-path" id="mdPath">';

    h += step('md_s1', '1', '風險分組（IPSS-R，或有分子資料時用 IPSS-M）',
      opt('risk', 'lower', '<b>低危組</b> Lower-risk', 'IPSS-R Very low／Low／部分 Intermediate → 目標是改善血球數與生活品質') +
      opt('risk', 'higher', '<b>高危組</b> Higher-risk', 'IPSS-R 部分 Intermediate／High／Very high → 目標是延緩轉為 AML、延長存活'),
      '<div class="note"><b>低危與高危的治療目標是相反的</b>，故此步驟決定了後面的一切：低危組不以「消滅疾病」為目標，過度治療反而有害；高危組則須及早介入。<br><b>IPSS-R 的 Intermediate 組要往哪邊靠，是臨床上最需要判斷的地方</b>——可參考年齡、體能、輸血依賴程度與分子異常；有次世代定序資料時，<b>IPSS-M</b> 能把相當比例的病人重新分組（尤其帶 <i>TP53</i> 多重打擊、<i>SF3B1</i> 等突變者），應優先採用。<br><b>診斷時必須先排除其他造成血球低下的原因</b>：維生素 B12／葉酸缺乏、銅缺乏、HIV、藥物、酒精、自體免疫疾病、近期化放療。這些是可逆的。</div>');

    /* ===================== 低危組 ===================== */
    h += '<div id="md_lower" class="hidden">';
    h += conn('md_c2');
    h += step('md_s2', '2', '主要的臨床問題是什麼',
      opt('issue', 'anemia', '貧血為主（最常見）', '有症狀之貧血或已需輸血') +
      opt('issue', 'cytopenia', '血小板或中性球低下為主', '出血或反覆感染') +
      opt('issue', 'watch', '無症狀、血球數尚可', '目前不需治療'));

    h += connH('md_c3');
    h += step('md_s3', '3', '決定用藥的兩個標記',
      opt('marker', 'del5q', '<b>del(5q)</b>（單獨或併一項其他異常）', '有專屬藥物，與其他族群完全不同') +
      opt('marker', 'rs', '<b>環狀鐵芽球或 <i>SF3B1</i> 突變</b>', 'ring sideroblasts；紅血球成熟劑反應較佳') +
      opt('marker', 'none', '兩者皆無', '依血中 EPO 濃度決定第一線'),
      '<div class="note"><b>開始治療前務必先驗血中 EPO 濃度</b>——它決定紅血球生成刺激劑（ESA）值不值得試，是低危 MDS 最便宜也最常被略過的一項檢查。<b>EPO 越低，ESA 反應越好</b>；EPO 明顯偏高者用 ESA 的效益有限，應直接考慮其他機轉。</div>');
    h = hideStep(h, 'md_s3');

    h += rec('md_lower_rec', '建議處置 · 低危 MDS');
    h += '<div class="flow-fu hidden" id="md_lower_fu"></div>';
    h += '</div>';

    /* ===================== 高危組 ===================== */
    h += '<div id="md_higher" class="hidden">';
    h += conn('md_c10');
    h += step('md_s10', '2', '是否為異體造血幹細胞移植之適格者',
      opt('fit', 'fit', '適合移植', '年齡、體能與共病可承受，且有捐者或可尋找捐者') +
      opt('fit', 'unfit', '不適合移植', '因年齡、共病或病人意願而不考慮移植'),
      '<div class="note"><b>異體造血幹細胞移植是高危 MDS 唯一具治癒潛力的手段</b>，且<b>移植評估應在確立高危分組的當下就啟動</b>，與去甲基化藥物治療並行——找捐者需要時間，等到藥物失效才轉介往往已來不及。年齡本身不是絕對禁忌，減低強度前處置已讓相當年長的病人也能接受移植。</div>');
    h += rec('md_higher_rec', '建議處置 · 高危 MDS');
    h += '<div class="flow-fu hidden" id="md_higher_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="mdReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function mdSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function mdShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function mdClearSel(ids) {
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

  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h = '';
    if (type === 'lower') {
      h = '<div class="fu-label">低危 MDS 之追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>血球數與輸血需求</b>：定期追蹤；<b>輸血依賴本身即是獨立的不良預後因子</b>，不只是生活品質問題（Malcovati 等之研究）。</li>' +
        '<li><b>重新分期</b>：血球數惡化、輸血需求增加或出現新的臨床事件時，<b>重做骨髓與細胞遺傳學</b>——低危組會隨時間轉為高危組，分組不是一次定終身。</li>' +
        '<li><b>鐵過載</b>：長期紅血球輸血者監測血清鐵蛋白與器官鐵沉積；<b>鐵螯合治療的對象是「預期能長期存活、且持續輸血依賴」的低危族群</b>——對預後短的高危病人意義有限。</li>' +
        '<li><b>感染與出血</b>：中性球低下者衛教發燒之處理流程；血小板低下者避免抗血小板藥物與外傷。</li>' +
        '</ul>';
    } else if (type === 'higher') {
      h = '<div class="fu-label">高危 MDS 之追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>去甲基化藥物需要時間</b>：反應中位數約在 <b>4–6 個療程</b>後才出現，<b>不可因為前 2–3 個療程沒有反應就提早停藥</b>——這是臨床上最常見的誤判。應持續治療至疾病明確進展或無法耐受。</li>' +
        '<li><b>骨髓評估</b>：依療程規定重做骨髓以評估反應；血球數惡化或芽細胞上升時提前評估是否已轉為 AML。</li>' +
        '<li><b>移植</b>：已啟動之移植評估應持續推進，勿因藥物有反應而擱置——去甲基化藥物不具治癒性。</li>' +
        '<li><b>支持治療</b>：輸血、感染預防與處理、生長因子之選擇性使用；同時討論治療目標與預立醫療決定。</li>' +
        '</ul>';
    } else {
      h = '<div class="fu-label">觀察期之追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>觀察不等於不管</b>：定期追蹤全血球計數與抹片；出現症狀性血球低下、輸血需求或血球數持續下降時，重做骨髓與細胞遺傳學並重新分組。</li>' +
        '<li>衛教感染與出血的警訊；避免不必要的抗血小板與抗凝血藥物。</li>' +
        '<li>取得次世代定序資料後可用 <b>IPSS-M</b> 重新分組——部分原判低危者會被上修。</li>' +
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

  var trialNote =
    '本區塊之處置依公開臨床試驗整編，括號內為試驗名稱，對應文獻見頁尾「主要文獻」。' +
    '藥物之核准適應症與健保給付條件（尤其 luspatercept、imetelstat、lenalidomide 用於非 del(5q)）各異，用藥前請先確認。';

  function supportiveCare() {
    return '<span class="rx-h">支持治療（貫穿所有分組）</span>' +
      '<b>紅血球輸血</b>依症狀而非單一血色素數值決定；<b>血小板輸注</b>用於出血或預防性（依所在單位閾值）；' +
      '<b>感染</b>之預防與及早處理。<b>鐵螯合</b>用於長期輸血依賴且預期長期存活者。' +
      '<b>不要用「血色素數字」單獨決定輸血</b>——同樣的血色素在不同年齡與心肺共病下意義不同。';
  }

  /* ---------- 主渲染 ---------- */
  function mdRender() {
    var s = mdSt;
    mdShow('md_lower', s.risk === 'lower');
    mdShow('md_higher', s.risk === 'higher');
    var showMarker = (s.risk === 'lower' && s.issue === 'anemia');
    mdShow('md_c3', showMarker); mdShow('md_s3', showMarker);
    renderLower();
    renderHigher();
  }

  function renderLower() {
    var s = mdSt;
    if (s.risk !== 'lower') return;
    var R = 'md_lower_rec', F = 'md_lower_fu';
    if (!s.issue) { idleRec(R, F, '請選擇步驟 2（主要的臨床問題）'); return; }

    if (s.issue === 'watch') {
      result(R, F, 'rec-elective', '低危 MDS · 無症狀 → 觀察與定期追蹤', [
        '<span class="rx-h">此時不治療才是正確的</span>' +
          '<b>低危 MDS 的治療目標是改善血球數與生活品質，不是消滅疾病。</b>無症狀且血球數尚可者，' +
          '任何治療都只會帶來毒性而無對應獲益。',
        '<span class="rx-h">要做的事</span>定期追蹤全血球計數與抹片；' +
          '記錄輸血需求的起點；衛教感染與出血的警訊。',
        '<span class="rx-h">何時重新評估</span>出現症狀性血球低下、開始需要輸血、' +
          '或血球數持續下降時，<b>重做骨髓與細胞遺傳學並重新分組</b>。',
        supportiveCare()
      ], trialNote, 'watch');
      return;
    }

    if (s.issue === 'cytopenia') {
      result(R, F, 'rec-nonop', '低危 MDS · 以血小板或中性球低下為主', [
        '<span class="rx-h">先確認這是不是 MDS 造成的</span>' +
          '再次排除可逆原因（藥物、感染、自體免疫、營養缺乏），並檢視是否有<b>低增生型 MDS</b>或與再生不良性貧血重疊之表現。',
        '<span class="rx-h">免疫抑制治療的角色</span>' +
          '<b>低增生型、年輕、HLA-DR15 陽性或帶 PNH 克隆</b>之低危 MDS，可考慮免疫抑制治療；此為選擇性適應症，非常規。',
        '<span class="rx-h">去甲基化藥物</span>' +
          '嚴重且症狀明顯之血球低下，即使屬低危組，仍可考慮<b>低劑量或減量之去甲基化藥物</b>以改善血球數。',
        '<span class="rx-h">支持治療為主</span>' +
          '血小板低下以輸注與避免抗血小板藥物為主；中性球低下以感染預防與及早治療為主，' +
          '<b>不建議常規長期使用生長因子</b>。',
        supportiveCare()
      ], trialNote, 'lower');
      return;
    }

    // 貧血
    if (!s.marker) { idleRec(R, F, '請選擇步驟 3（del(5q) 與環狀鐵芽球／SF3B1）'); return; }
    var lines = [];
    if (s.marker === 'del5q') {
      lines.push('<span class="rx-h">del(5q) 有專屬藥物</span>' +
        '<b><span class="drug">Lenalidomide</span></b> 對<b>帶 del(5q) 的低危／中危-1 MDS</b>有高比例的輸血脫離與細胞遺傳學反應（<b>List 等，NEJM 2006</b>）——' +
        '這是 MDS 中「基因型直接對應到一個有效藥物」最明確的例子，<b>不要漏掉細胞遺傳學檢查</b>。');
      lines.push('<span class="rx-h">用藥前後注意</span>' +
        '治療前確認 <i>TP53</i> 狀態：<b>帶 <i>TP53</i> 突變者對 lenalidomide 反應較差且較易進展</b>。' +
        '用藥期間監測血球低下（初期常見且可能加重）、血栓風險。');
    } else if (s.marker === 'rs') {
      lines.push('<span class="rx-h">環狀鐵芽球／<i>SF3B1</i> 突變</span>' +
        '<b><span class="drug">Luspatercept</span></b>（紅血球成熟劑，機轉與 ESA 不同）對此族群之輸血脫離效果明確：' +
        '<b>MEDALIST</b>（ESA 失敗後）與 <b>COMMANDS</b>（未曾用過 ESA 者，優於 epoetin alfa）。' +
        '<b>COMMANDS 之後，luspatercept 在此族群已可作為第一線考慮</b>，不必然要等 ESA 失敗。');
      lines.push('<span class="rx-h">ESA 仍是選項</span>' +
        '血中 <b>EPO 濃度偏低</b>者，紅血球生成刺激劑（<span class="drug">darbepoetin alfa</span>、<span class="drug">epoetin</span>）仍有相當反應率' +
        '（<b>Platzbecker 等之隨機試驗</b>）；EPO 明顯偏高者效益有限。');
    } else {
      lines.push('<span class="rx-h">第一線依血中 EPO 濃度決定</span>' +
        '<b>EPO 偏低</b> → <b>紅血球生成刺激劑（ESA）</b>：<span class="drug">darbepoetin alfa</span> 或 <span class="drug">epoetin</span>' +
        '（<b>Platzbecker 等之隨機試驗</b>）。<b>EPO 明顯偏高</b> → ESA 效益有限，直接考慮其他機轉。');
      lines.push('<span class="rx-h">ESA 失敗或不適用之後</span>' +
        '<b><span class="drug">Imetelstat</span></b>（端粒酶抑制劑）對 ESA 失敗或難治之低危 MDS 可達成輸血脫離（<b>IMerge</b>）。' +
        '<b><span class="drug">Luspatercept</span></b> 主要證據在環狀鐵芽球／<i>SF3B1</i> 族群，非此族群者效益較不確定。');
      lines.push('<span class="rx-h">其他</span>' +
        '低增生型或帶 PNH 克隆者可考慮免疫抑制治療；' +
        '症狀嚴重且多線無效者可考慮<b>去甲基化藥物</b>；並隨時評估是否應重新分組。');
    }
    lines.push(supportiveCare());
    lines.push('<span class="rx-h">別忘了重新分組</span>' +
      '低危 MDS 會隨時間轉為高危。<b>治療反應消失、輸血需求增加或芽細胞上升時，重做骨髓並重新計算 IPSS-R／IPSS-M</b>。');
    result(R, F, 'rec-elective',
      s.marker === 'del5q' ? '低危 MDS · 貧血 · del(5q)：lenalidomide'
        : s.marker === 'rs' ? '低危 MDS · 貧血 · 環狀鐵芽球／SF3B1：luspatercept 或 ESA'
        : '低危 MDS · 貧血 · 無特殊標記：先看 EPO 濃度',
      lines, trialNote, 'lower');
  }

  function renderHigher() {
    var s = mdSt;
    if (s.risk !== 'higher') return;
    var R = 'md_higher_rec', F = 'md_higher_fu';
    if (!s.fit) { idleRec(R, F, '請選擇步驟 2（是否為移植適格者）'); return; }
    var lines = [];
    lines.push('<span class="rx-h">高危組的治療目標</span>' +
      '<b>延緩轉為 AML、延長存活</b>——與低危組「改善血球數」的目標不同，因此可接受較高的治療毒性。');
    lines.push('<span class="rx-h">去甲基化藥物（HMA）是藥物治療的骨架</span>' +
      '<b><span class="drug">Azacitidine</span></b> 是<b>唯一在隨機試驗中證實可延長高危 MDS 存活</b>的藥物（<b>AZA-001</b>）；' +
      '<b><span class="drug">Decitabine</span></b> 亦改善反應與無事件存活（<b>Kantarjian 等，Cancer 2006</b>）。' +
      '<b>反應中位數約在 4–6 個療程後才出現，不可因前 2–3 個療程無反應而提早停藥。</b>');
    if (s.fit === 'fit') {
      lines.push('<span class="rx-h">異體造血幹細胞移植——唯一具治癒潛力者</span>' +
        '<b>應在確立高危分組的當下就啟動 HLA 分型與捐者搜尋，與 HMA 治療並行</b>，不可依序等待。' +
        '減低強度前處置之移植在 50–75 歲之高危 MDS 病人，其存活優於非移植路徑（<b>BMT CTN 1102</b>）——' +
        '<b>年齡本身不是禁忌</b>。');
      lines.push('<span class="rx-h">移植前要不要先減積</span>' +
        '芽細胞比例偏高者，多數作法是先以 HMA（或 AML 型誘導化療）降低芽細胞再移植；' +
        '此處各單位作法不一，應依所在移植團隊之常規決定。');
    } else {
      lines.push('<span class="rx-h">不適合移植者</span>' +
        '以 <b>HMA 持續治療至疾病進展或無法耐受</b>為主軸，目標是延長存活與維持生活品質。' +
        '<b>治療目標與預立醫療決定應及早討論</b>——高危 MDS 且不適合移植者，' +
        '治療是控制而非治癒，把這件事講清楚比多換一線藥更重要。');
    }
    lines.push('<span class="rx-h"><i>TP53</i> 多重打擊</span>' +
      '此族群對現有藥物與移植的結果都明顯較差，<b>應優先評估臨床試驗</b>，' +
      '並在治療目標的討論中誠實反映預後。');
    lines.push('<span class="rx-h">臨床試驗</span>' +
      '高危 MDS 之現有藥物選項有限，<b>臨床試驗應視為標準選項之一而非最後手段</b>。');
    lines.push(supportiveCare());
    result(R, F, s.fit === 'fit' ? 'rec-elective' : 'rec-nonop',
      s.fit === 'fit' ? '高危 MDS · 適合移植：HMA 與移植評估並行' : '高危 MDS · 不適合移植：以 HMA 持續治療',
      lines, trialNote, 'higher');
  }

  /* ---------- 事件 ---------- */
  function mdPick(key, val, btn) {
    mdSel(btn);
    var s = mdSt;
    if (key === 'risk') {
      s.risk = val; s.issue = s.marker = s.fit = null;
      mdClearSel(['md_s2', 'md_s3', 'md_s10']);
    } else if (key === 'issue') {
      s.issue = val; s.marker = null;
      mdClearSel(['md_s3']);
    } else if (key === 'marker') { s.marker = val; }
    else if (key === 'fit') { s.fit = val; }
    mdRender();
  }

  function mdReset() {
    for (var k in mdSt) { if (mdSt.hasOwnProperty(k)) mdSt[k] = null; }
    var root = document.getElementById('mdPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['md_lower_fu', 'md_higher_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    mdRender();
  }

  function initMdsPathway() { mdReset(); }

  global.mdsPathwayHTML = mdsPathwayHTML;
  global.initMdsPathway = initMdsPathway;
  global.mdPick = mdPick;
  global.mdReset = mdReset;
})(window);
