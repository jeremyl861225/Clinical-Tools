/* ============================================================
   骨髓增生性腫瘤（費城染色體陰性）治療互動決策流程
   Ph-negative Myeloproliferative Neoplasms — PV / ET / PMF
   ------------------------------------------------------------
   ※ 本模組不是台大診療指引。
   台大血癌診療指引版次 15 完全未涵蓋 MPN——連 AML-1 的分流出口都沒有
   （該圖之四個出口為 AML non-M3、APL、ALL/MPAL、MDS），放射治療章節亦僅
   在脾臟照射一項間接相關。四個新增血液腫瘤條目中，本病種與台大指引的
   距離最遠。本流程依 WHO 第 5 版／ICC 2022 分類、各病之風險模型與公開之
   關鍵臨床試驗整編，文獻見頁尾 PubMed 連結。
   ------------------------------------------------------------
   三個病放在同一個流程裡，第一步先選病別——因為三者的治療目標完全不同：
   PV 與 ET 以「預防血栓」為主軸，PMF 以「症狀與脾臟」及「是否移植」為主軸。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var mpSt = {
    dz: null,      // pv | et | mf
    risk: null,    // low | high（PV／ET 之血栓風險）
    resp: null,    // ok | fail（PV／ET 第一線是否失敗）
    mfrisk: null,  // lower | higher（PMF 之 DIPSS 分組）
    mfissue: null  // splen | anemia（PMF 之主要問題）
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="mpPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function mpnPathwayHTML() {
    var h = '';
    h += '<p class="onc-note"><span class="tx-role" style="background:#a33a2f;">來源提醒</span> ' +
      '<b>本流程不是台大診療指引。</b>台大血癌診療指引版次 15 <b>完全未涵蓋 MPN</b>——' +
      '連 AML-1 分流圖的出口都沒有（該圖四個出口為 AML non-M3、APL、ALL/MPAL、MDS）。' +
      '下列內容依 <b>WHO 第 5 版／ICC 2022 分類</b>、各病之風險模型與公開之關鍵臨床試驗整編。' +
      '院內另有規定時以院內規定為準。</p>';
    h += '<div class="onc-path" id="mpPath">';

    h += step('mp_s1', '1', '疾病別（三者治療目標不同，故先分流）',
      opt('dz', 'pv', '真性紅血球增多症 PV', '目標：預防血栓。核心處置是放血把血比容壓到 <45%') +
      opt('dz', 'et', '原發性血小板增多症 ET', '目標：預防血栓。血小板數本身不是治療門檻') +
      opt('dz', 'mf', '骨髓纖維化 MF', '目標：症狀與脾臟控制，並判定是否該移植'),
      '<div class="note"><b>診斷必須先確認驅動突變與排除續發性原因</b>：<i>JAK2</i> V617F（PV 幾乎全部陽性）、<i>JAK2</i> exon 12、<i>CALR</i>、<i>MPL</i>；三者皆陰性者為「三陰性」，須更謹慎排除續發原因。<b>PV 之診斷需排除續發性紅血球增多</b>（缺氧、睡眠呼吸中止、吸菸、睪固酮、腎臟病變）；<b>ET 需排除反應性血小板增多</b>（缺鐵、發炎、感染、脾切除後）。<br><b>骨髓切片對區分 ET 與早期骨髓纖維化（prefibrotic PMF）是必要的</b>——兩者臨床表現可以幾乎一樣，但預後與處置不同，WHO 第 5 版與 ICC 2022 皆將其分開。</div>');

    /* ===================== PV / ET ===================== */
    h += '<div id="mp_pvet" class="hidden">';
    h += conn('mp_c2');
    h += step('mp_s2', '2', '血栓風險分層',
      opt('risk', 'low', '低風險', '年齡 ≤60 歲<b>且</b>無血栓病史') +
      opt('risk', 'high', '高風險', '年齡 >60 歲<b>或</b>有血栓病史'),
      '<div class="note"><b>血栓風險分層的兩個主軸就是「年齡」與「過去有沒有血栓」</b>，不是血球數的高低。<b>血小板數本身不是治療門檻</b>——極高血小板（>1,500 ×10⁹/L）反而要注意<b>後天性 von Willebrand 症候群</b>造成的出血風險，此時使用 aspirin 需格外謹慎，應先驗 ristocetin cofactor 活性。<br>ET 另有 <b>IPSET-thrombosis</b> 可納入 <i>JAK2</i> V617F 與心血管危險因子做更細的分層。<br><b>所有病人都應同時處理一般心血管危險因子</b>：戒菸、控制血壓、血糖與血脂——這部分的效益常被低估。</div>');

    h += connH('mp_c3');
    h += step('mp_s3', '3', '第一線降血球治療的結果',
      opt('resp', 'ok', '控制良好且可耐受', '維持現行治療') +
      opt('resp', 'fail', '無效或無法耐受', 'hydroxyurea 抗性或不耐受 → 換第二線'));
    h = hideStep(h, 'mp_s3');

    h += rec('mp_pvet_rec', '建議處置 · PV／ET');
    h += '<div class="flow-fu hidden" id="mp_pvet_fu"></div>';
    h += '</div>';

    /* ===================== MF ===================== */
    h += '<div id="mp_mf" class="hidden">';
    h += conn('mp_c10');
    h += step('mp_s10', '2', '風險分組（DIPSS／DIPSS-Plus，有分子資料時用 MIPSS70+ v2.0）',
      opt('mfrisk', 'lower', '低風險或中風險-1', '預期存活較長 → 以症狀為導向') +
      opt('mfrisk', 'higher', '中風險-2 或高風險', '→ 應評估異體造血幹細胞移植'));

    h += connH('mp_c11');
    h += step('mp_s11', '3', '目前最困擾病人的問題',
      opt('mfissue', 'splen', '脾腫大與全身症狀', '腹脹、早飽、盜汗、體重減輕、搔癢') +
      opt('mfissue', 'anemia', '貧血為主', '已輸血依賴或血色素明顯偏低'),
      '<div class="note"><b>這一步會直接改變 JAK 抑制劑的選擇</b>：ruxolitinib 會加重貧血與血小板低下，而<b>momelotinib 反而能改善貧血</b>、<b>pacritinib 可用於血小板明顯偏低者</b>。把「病人最困擾的是什麼」問清楚，比單看風險分數更能決定用藥。</div>');
    h = hideStep(h, 'mp_s11');

    h += rec('mp_mf_rec', '建議處置 · 骨髓纖維化');
    h += '<div class="flow-fu hidden" id="mp_mf_fu"></div>';
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="mpReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function mpSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function mpShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function mpClearSel(ids) {
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
    if (type === 'pvet') {
      h = '<div class="fu-label">PV／ET 之追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>PV：血比容（Hct）務必壓在 &lt;45%</b>——<b>CYTO-PV</b> 證實較寬鬆的目標（45–50%）會顯著增加心血管死亡與重大血栓事件。這是 PV 照護中最硬的一個數字。</li>' +
        '<li><b>血栓與出血事件</b>：每次回診主動詢問；同時持續處理一般心血管危險因子（戒菸、血壓、血糖、血脂）。</li>' +
        '<li><b>血球數與脾臟大小</b>：定期追蹤；脾臟持續增大、出現貧血或幼稚細胞，須警覺<b>轉為骨髓纖維化</b>（post-PV／post-ET MF）並考慮重做骨髓。</li>' +
        '<li><b>缺鐵</b>：PV 病人放血後普遍缺鐵，<b>一般不補鐵</b>（補鐵會使紅血球再度上升）；但須辨別缺鐵造成的症狀。</li>' +
        '<li><b>長期用藥安全性</b>：hydroxyurea 之皮膚變化與潰瘍；干擾素之情緒、甲狀腺與肝功能。</li>' +
        '</ul>';
    } else if (type === 'mf') {
      h = '<div class="fu-label">骨髓纖維化之追蹤 Follow-up</div><ul class="fu-list">' +
        '<li><b>症狀量表與脾臟大小</b>：以標準化的症狀評分追蹤治療效果，而非僅憑印象；脾臟以觸診距肋弓公分數記錄。</li>' +
        '<li><b>血球數</b>：JAK 抑制劑起始後常見貧血與血小板下降，<b>多在前 12–24 週最明顯而後趨穩</b>——不要一出現就停藥。</li>' +
        '<li><b>切勿驟然停用 ruxolitinib</b>：可能出現症狀急遽反彈；需停藥時應逐步減量並考慮短期類固醇。</li>' +
        '<li><b>疾病進展</b>：血球數惡化、幼稚細胞上升或出現新的全身症狀時，重做骨髓評估是否已轉為<b>急性白血病期</b>（blast phase）。</li>' +
        '<li><b>移植</b>：已啟動之移植評估應持續推進——<b>JAK 抑制劑改善症狀但不改變疾病自然史，也不具治癒性</b>。</li>' +
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
    '藥物之核准適應症與健保給付條件（尤其 ruxolitinib、fedratinib、pacritinib、momelotinib 與 ropeginterferon）各異，用藥前請先確認。';

  /* ---------- 主渲染 ---------- */
  function mpRender() {
    var s = mpSt;
    var pvet = (s.dz === 'pv' || s.dz === 'et');
    mpShow('mp_pvet', pvet);
    mpShow('mp_mf', s.dz === 'mf');
    var showResp = pvet && s.risk === 'high';
    mpShow('mp_c3', showResp); mpShow('mp_s3', showResp);
    var showIssue = (s.dz === 'mf' && !!s.mfrisk);
    mpShow('mp_c11', showIssue); mpShow('mp_s11', showIssue);
    renderPvEt();
    renderMf();
  }

  function renderPvEt() {
    var s = mpSt;
    if (s.dz !== 'pv' && s.dz !== 'et') return;
    var R = 'mp_pvet_rec', F = 'mp_pvet_fu';
    if (!s.risk) { idleRec(R, F, '請選擇步驟 2（血栓風險分層）'); return; }
    var isPV = (s.dz === 'pv');
    var lines = [];

    if (isPV) {
      lines.push('<span class="rx-h">所有 PV 病人的兩件基本處置</span>' +
        '<b>①放血（phlebotomy），目標血比容 &lt;45%</b>——<b>CYTO-PV</b> 證實較寬鬆的目標會顯著增加心血管死亡與重大血栓；這是 PV 最硬的一個數字。' +
        '<b>②低劑量 <span class="drug">aspirin</span></b>（除非有禁忌）。');
    } else {
      lines.push('<span class="rx-h">所有 ET 病人的基本處置</span>' +
        '<b>低劑量 <span class="drug">aspirin</span></b>（依症狀與風險決定，極低風險且 <i>CALR</i> 突變者之效益較不明確）。' +
        '<b>血小板數本身不是治療門檻</b>；<b>極高血小板（&gt;1,500 ×10⁹/L）反而要先排除後天性 von Willebrand 症候群</b>再決定是否用 aspirin。');
    }
    lines.push('<span class="rx-h">一般心血管危險因子</span>' +
      '戒菸、控制血壓、血糖與血脂。<b>這部分的效益常被低估</b>——血栓是 PV／ET 最主要的死因與失能來源，而這些是可改變的。');

    if (s.risk === 'low') {
      lines.push('<span class="rx-h">低風險（年齡 ≤60 且無血栓病史）→ 不常規降血球</span>' +
        '<b>低風險族群不需常規使用降血球藥物</b>，以上述基本處置加追蹤即可。' +
        '若出現<b>血栓事件、疾病相關症狀無法忍受、或血球數進行性上升</b>，再啟動降血球治療。');
      result(R, F, 'rec-elective',
        isPV ? 'PV · 低風險：放血（Hct <45%）＋ 低劑量 aspirin' : 'ET · 低風險：低劑量 aspirin ＋ 追蹤',
        lines, trialNote, 'pvet');
      return;
    }

    // 高風險
    if (!s.resp) {
      lines.push('<span class="rx-h">高風險（年齡 &gt;60 或有血栓病史）→ 加上降血球治療</span>' +
        '<b>第一線：<span class="drug">hydroxyurea</span></b>（各年齡層皆可用），或<b>干擾素</b>' +
        '（<span class="drug">ropeginterferon alfa-2b</span>、<span class="drug">peginterferon</span>）——' +
        '<b>年輕、育齡女性或希望避免長期烷化劑者，干擾素應優先考慮</b>。' +
        (isPV ? '<b>PROUD-PV／CONTINUATION-PV</b> 顯示 ropeginterferon 於 PV 之長期控制不劣於標準治療，且分子反應較佳。' : ''));
      if (!isPV) {
        lines.push('<span class="rx-h">ET 之 anagrelide</span>' +
          '<b>PT-1</b> 試驗中，hydroxyurea ＋ aspirin 在整體事件上優於 <span class="drug">anagrelide</span> ＋ aspirin' +
          '（anagrelide 組動脈血栓、出血與轉為骨髓纖維化較多，但靜脈血栓較少）——' +
          '<b>故 anagrelide 一般不作為第一線，列為第二線選項。</b>');
      }
      lines.push('<span class="rx-h">下一步</span>開始治療後請於步驟 3 填入控制結果，以決定是否需要換第二線。');
      result(R, F, 'rec-elective',
        isPV ? 'PV · 高風險：放血 ＋ aspirin ＋ 降血球治療' : 'ET · 高風險：aspirin ＋ 降血球治療',
        lines, trialNote, 'pvet');
      return;
    }

    if (s.resp === 'ok') {
      lines.push('<span class="rx-h">控制良好 → 維持現行治療</span>' +
        '維持原降血球藥物與劑量，持續追蹤血球數、脾臟大小與血栓事件。' +
        (isPV ? '<b>仍須確保血比容持續 &lt;45%</b>——藥物有效不代表可以放鬆這個目標。' : ''));
      lines.push('<span class="rx-h">警覺疾病轉型</span>' +
        '脾臟持續增大、出現貧血或周邊血幼稚細胞，須警覺<b>轉為骨髓纖維化</b>（post-PV／post-ET MF）並考慮重做骨髓。');
      result(R, F, 'rec-elective',
        (isPV ? 'PV' : 'ET') + ' · 高風險 · 控制良好：維持現行治療',
        lines, trialNote, 'pvet');
      return;
    }

    lines.push('<span class="rx-h">Hydroxyurea 抗性或不耐受 → 換第二線</span>' +
      '先確認<b>「抗性」與「不耐受」是不同的問題</b>：前者是劑量足夠仍無法達標，後者是因毒性（皮膚潰瘍、黏膜炎、腸胃道）而無法用到足量。');
    if (isPV) {
      lines.push('<span class="rx-h">PV 之第二線</span>' +
        '<b><span class="drug">Ruxolitinib</span></b>（<b>RESPONSE</b>：於 hydroxyurea 抗性／不耐受之 PV，' +
        '在血比容控制、脾臟縮小與症狀改善上優於標準治療）；' +
        '或改用<b>干擾素</b>（<span class="drug">ropeginterferon alfa-2b</span>，<b>PROUD-PV／CONTINUATION-PV</b>）。');
    } else {
      lines.push('<span class="rx-h">ET 之第二線</span>' +
        '<b><span class="drug">Anagrelide</span></b>（<b>PT-1</b>：一般不作第一線，列為第二線）；' +
        '或改用<b>干擾素</b>（<span class="drug">ropeginterferon alfa-2b</span>、<span class="drug">peginterferon</span>），' +
        '育齡女性尤其適合。');
    }
    lines.push('<span class="rx-h">別忘了重新檢視診斷</span>' +
      '第一線治療失敗時，應重新確認診斷是否正確（尤其 ET 與早期骨髓纖維化之區分需要<b>骨髓切片</b>），' +
      '以及是否已發生疾病轉型。');
    result(R, F, 'rec-nonop',
      (isPV ? 'PV' : 'ET') + ' · 高風險 · 第一線失敗：換第二線',
      lines, trialNote, 'pvet');
  }

  function renderMf() {
    var s = mpSt;
    if (s.dz !== 'mf') return;
    var R = 'mp_mf_rec', F = 'mp_mf_fu';
    if (!s.mfrisk) { idleRec(R, F, '請選擇步驟 2（風險分組）'); return; }
    if (!s.mfissue) { idleRec(R, F, '請選擇步驟 3（目前最困擾病人的問題）'); return; }
    var lines = [];

    lines.push('<span class="rx-h">先講清楚一件事</span>' +
      '<b>JAK 抑制劑能明顯改善脾臟與全身症狀，但不改變疾病自然史，也不具治癒性。</b>' +
      '骨髓纖維化唯一具治癒潛力的仍是<b>異體造血幹細胞移植</b>——用藥有效不等於可以擱置移植評估。');

    if (s.mfissue === 'splen') {
      lines.push('<span class="rx-h">脾腫大與全身症狀 → JAK 抑制劑</span>' +
        '<b><span class="drug">Ruxolitinib</span></b> 為標準起點（<b>COMFORT-I</b> 對比安慰劑、<b>COMFORT-II</b> 對比最佳可用治療，' +
        '皆顯示顯著的脾臟縮小與症狀改善）。' +
        '<b><span class="drug">Fedratinib</span></b>（<b>JAKARTA</b>）可用於第一線或 ruxolitinib 之後' +
        '（須監測<b>硫胺素／Wernicke 腦病變</b>風險）。');
      lines.push('<span class="rx-h">血小板明顯偏低者</span>' +
        '<b><span class="drug">Pacritinib</span></b>（<b>PERSIST-2</b>）之設計即針對<b>血小板低下</b>之族群，' +
        '此時優於劑量受限的 ruxolitinib。');
    } else {
      lines.push('<span class="rx-h">貧血為主 → 選會改善貧血的 JAK 抑制劑</span>' +
        '<b><span class="drug">Momelotinib</span></b>（<b>MOMENTUM</b>：於症狀性貧血之骨髓纖維化，' +
        '在輸血獨立性、症狀與脾臟三方面均優於 danazol）——' +
        '<b>這是唯一同時處理貧血與脾臟的 JAK 抑制劑</b>，此情境應優先考慮。');
      lines.push('<span class="rx-h">注意 ruxolitinib 會加重貧血</span>' +
        'ruxolitinib 起始後的貧血與血小板下降<b>多在前 12–24 週最明顯而後趨穩</b>；' +
        '但已有明顯貧血者，改用 momelotinib 或加上支持治療較合理。' +
        '<b>血小板明顯偏低者可考慮 <span class="drug">pacritinib</span></b>（<b>PERSIST-2</b>）。');
      lines.push('<span class="rx-h">其他貧血處置</span>' +
        '排除可逆原因（缺鐵、B12／葉酸、溶血、出血）；輸血支持；' +
        '長期輸血依賴者評估鐵過載。');
    }

    if (s.mfrisk === 'higher') {
      lines.push('<span class="rx-h">中風險-2 或高風險 → 移植評估</span>' +
        '<b>應立即啟動 HLA 分型與捐者搜尋，與 JAK 抑制劑治療並行</b>。' +
        '常見作法是先以 JAK 抑制劑縮小脾臟、改善體能後再移植；' +
        '<b>切勿因為藥物有效就延後移植</b>——JAK 抑制劑的療效會隨時間流失。');
      lines.push('<span class="rx-h">風險模型</span>' +
        '<b>DIPSS／DIPSS-Plus</b> 可在病程中任何時點重新計算（不限於診斷時）；' +
        '有次世代定序資料時應改用 <b>MIPSS70+ v2.0</b>，其納入高風險突變' +
        '（<i>ASXL1</i>、<i>SRSF2</i>、<i>EZH2</i>、<i>IDH1/2</i>、<i>U2AF1</i> Q157）與核型，分組更準確。');
    } else {
      lines.push('<span class="rx-h">低風險或中風險-1 → 以症狀為導向</span>' +
        '<b>無症狀者可僅觀察</b>；有症狀才治療。' +
        '此組暫不需移植，但<b>應定期以 DIPSS 重新計算風險</b>——風險分組會隨病程改變，' +
        '一旦升到中風險-2 即應轉為移植導向。');
    }
    lines.push('<span class="rx-h">切勿驟然停用 ruxolitinib</span>' +
      '可能出現症狀急遽反彈甚至類似細胞激素風暴的表現；需停藥時應<b>逐步減量</b>並考慮短期類固醇。');
    lines.push('<span class="rx-h">脾臟之其他處置</span>' +
      '藥物無法控制之症狀性脾腫大，可考慮<b>脾臟照射</b>（緩解性、效果短暫）或脾切除（風險高，須慎選病人）。');
    lines.push('<span class="rx-h">臨床試驗</span>' +
      'MF 之藥物選項仍有限，<b>臨床試驗應視為標準選項之一</b>。');

    result(R, F, s.mfrisk === 'higher' ? 'rec-urgent' : 'rec-nonop',
      s.mfissue === 'splen'
        ? '骨髓纖維化 · 脾腫大與症狀為主' + (s.mfrisk === 'higher' ? '（並行移植評估）' : '')
        : '骨髓纖維化 · 貧血為主' + (s.mfrisk === 'higher' ? '（並行移植評估）' : ''),
      lines, trialNote, 'mf');
  }

  /* ---------- 事件 ---------- */
  function mpPick(key, val, btn) {
    mpSel(btn);
    var s = mpSt;
    if (key === 'dz') {
      s.dz = val; s.risk = s.resp = s.mfrisk = s.mfissue = null;
      mpClearSel(['mp_s2', 'mp_s3', 'mp_s10', 'mp_s11']);
    } else if (key === 'risk') {
      s.risk = val; s.resp = null;
      mpClearSel(['mp_s3']);
    } else if (key === 'resp') { s.resp = val; }
    else if (key === 'mfrisk') {
      s.mfrisk = val; s.mfissue = null;
      mpClearSel(['mp_s11']);
    } else if (key === 'mfissue') { s.mfissue = val; }
    mpRender();
  }

  function mpReset() {
    for (var k in mpSt) { if (mpSt.hasOwnProperty(k)) mpSt[k] = null; }
    var root = document.getElementById('mpPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['mp_pvet_fu', 'mp_mf_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    mpRender();
  }

  function initMpnPathway() { mpReset(); }

  global.mpnPathwayHTML = mpnPathwayHTML;
  global.initMpnPathway = initMpnPathway;
  global.mpPick = mpPick;
  global.mpReset = mpReset;
})(window);
