/* ============================================================
   肺癌治療互動決策流程 Lung Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 肺癌診療指引 版次 23（2026/06/16）
   文件編號 50710-2-000009
   　壹-二　小細胞肺癌（診斷／治療）
   　壹-三　非小細胞肺癌（診斷／治療／安寧緩和）
   　壹-四　手術後追蹤檢查　壹-五　復發或轉移之治療　壹-六　追蹤檢查
   　貳　　輔助／新輔助／CCRT 處方　　參　第四期抗癌藥物處方
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var lcSt = {
    histo: null,    // nsclc | sclc
    stage: null,    // s1 | s2 | s3a | s3bc | s4
    op: null,       // op_yes | op_no
    rstat: null,    // R0 | Rpos
    biom: null,     // b_egfr | b_alk | b_none
    driver: null,   // d_egfr | d_alk | d_ros1 | d_other | d_none
    ext: null,      // limited | extensive
    ldtx: null      // ld_surg | ld_ccrt
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="lcPick(\'' + key + '\',\'' + val + '\',this)">' +
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

  /* ---------- 版面 HTML ---------- */
  function lungPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院肺癌診療指引 版次 23（2026/06/16）</b>之互動決策流程。逐步點選以取得對應建議處置、藥物療程與追蹤方式。<br>分期依 <b>AJCC／UICC 第 9 版</b>；分子檢測時機見各建議處置內之說明。</p>';
    h += '<div class="onc-path" id="lcPath">';

    // Step 1 — 組織型態
    h += step('lc_s1', '1', '病理組織型態（依最新版 WHO 肺癌分類）',
      opt('histo', 'nsclc', '非小細胞肺癌 NSCLC', '鱗狀上皮細胞癌／非鱗狀（腺癌、大細胞癌等）') +
      opt('histo', 'sclc', '小細胞肺癌 SCLC', 'Small cell lung cancer'),
      '<div class="note">兩者皆須於接受全身性抗癌藥物治療前完成 <b>B 型與 C 型肝炎篩檢</b>。晚期非鱗狀 NSCLC 應檢測 <b>EGFR、ALK、ROS1</b>；三者皆陰性須加做 <b>PD-L1</b>（IHC），並可考慮 BRAF／HER2／RET／NTRK／MET ex14／KRAS 或 NGS。</div>');

    /* ===================== NSCLC ===================== */
    h += '<div id="lc_nsclc" class="hidden">';
    h += conn('lc_c2');
    h += step('lc_s2', '2', '臨床分期 Clinical stage',
      opt('stage', 's1', 'Stage I', '') +
      opt('stage', 's2', 'Stage II', '術前建議先提多專科團隊會議或照會胸腔腫瘤內科') +
      opt('stage', 's3a', 'Stage IIIA', '術前建議先提多專科團隊會議或照會胸腔腫瘤內科') +
      opt('stage', 's3bc', 'Stage IIIB／IIIC', '') +
      opt('stage', 's4', 'Stage IV', ''),
      '<div class="note">臨床分期 N2–N3、腫瘤 >3cm、淋巴結短徑 >1cm 或中央型腫瘤，且評估適合手術或根除性放療者，<b>建議先行縱膈腔淋巴結取樣</b>（可先 EBUS-TBNA，檢體不足再手術取樣）。<b>陽性肋膜沖洗細胞學不列入分期判定。</b></div>');

    // 可否手術（I–IIIC）
    h += connH('lc_c3');
    h += step('lc_s3', '3', '是否可接受手術切除？',
      opt('op', 'op_yes', '可手術切除', '體能、肺功能與麻醉條件許可，且技術上可切除') +
      opt('op', 'op_no', '不可手術', '年邁、肺功能不佳、不適合麻醉，或評估為不可切除'));
    h = h.replace('id="lc_s3"', 'id="lc_s3" class="hidden"');

    // 切除結果
    h += connH('lc_c4');
    h += step('lc_s4', '4', '手術切除結果（切緣狀態）',
      opt('rstat', 'R0', 'R0 完整切除', '切緣陰性') +
      opt('rstat', 'Rpos', '切緣仍存有癌細胞', 'R1／R2，或肉眼殘存'));
    h = h.replace('id="lc_s4"', 'id="lc_s4" class="hidden"');

    // 術後輔助之分子標記
    h += connH('lc_c5');
    h += step('lc_s5', '5', '術後輔助治療之分子標記',
      opt('biom', 'b_egfr', 'EGFR del19 或 L858R', '') +
      opt('biom', 'b_alk', 'ALK rearrangement', '') +
      opt('biom', 'b_none', '無 EGFR／ALK 變異', '依 PD-L1 表現決定輔助免疫治療'));
    h = h.replace('id="lc_s5"', 'id="lc_s5" class="hidden"');

    // Stage IV 驅動基因
    h += connH('lc_c_drv');
    h += step('lc_s_drv', '3', '致癌驅動基因（oncogenic driver）',
      opt('driver', 'd_egfr', 'EGFR 突變', '常見型：del19／L858R') +
      opt('driver', 'd_alk', 'ALK translocation', '') +
      opt('driver', 'd_ros1', 'ROS1 translocation', '') +
      opt('driver', 'd_other', '其他可標靶變異', 'BRAF V600／MET ex14／RET／NTRK／EGFR ex20ins／KRAS G12C／HER2') +
      opt('driver', 'd_none', '無驅動基因', 'EGFR／ALK／ROS1 皆陰性 → 依 PD-L1 決策'));
    h = h.replace('id="lc_s_drv"', 'id="lc_s_drv" class="hidden"');

    h += rec('lc_nsclc_rec', '建議處置 · 非小細胞肺癌 NSCLC');
    h += '<div class="flow-fu hidden" id="lc_nsclc_fu"></div>';
    h += '</div>'; // lc_nsclc

    /* ===================== SCLC ===================== */
    h += '<div id="lc_sclc" class="hidden">';
    h += conn('lc_sc2');
    h += step('lc_s_ext', '2', '疾病範圍 Disease extent',
      opt('ext', 'limited', '侷限期 Limited stage', '病灶侷限單側、可被單一放射治療照射範圍涵蓋（含鎖骨上窩淋巴結轉移）') +
      opt('ext', 'extensive', '擴散期 Extensive stage', '出現單一放射治療照射範圍以外之遠端轉移病灶'),
      '<div class="note">分期所需檢查：<b>腦部 CT 或 MRI</b>、<b>全身骨骼掃瞄或全身正子掃描</b>，可於確診後完成。具肋膜或心包膜積液而無其他遠端轉移者，其治療由臨床醫師與放射腫瘤科醫師討論後決定。</div>');

    h += connH('lc_sc3');
    h += step('lc_s_ld', '3', '侷限期：臨床分期是否為 T1-2 N0？',
      opt('ldtx', 'ld_surg', 'cT1-2 N0 → 可考慮手術', '術後依病理 N 分期決定輔助治療') +
      opt('ldtx', 'ld_ccrt', '非 cT1-2 N0 → 同步化放療', 'CCRT 為侷限期之標準治療'));
    h = h.replace('id="lc_s_ld"', 'id="lc_s_ld" class="hidden"');

    h += rec('lc_sclc_rec', '建議處置 · 小細胞肺癌 SCLC');
    h += '<div class="flow-fu hidden" id="lc_sclc_fu"></div>';
    h += '</div>'; // lc_sclc

    h += '<div class="flow-reset"><button class="btn-reset" onclick="lcReset()">重置</button></div>';
    h += '</div>'; // lcPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function lcSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function lcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function lcClearSel(ids) {
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

  /* ---------- 追蹤區塊（壹-四／五／六）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'postop') {
      h = '<div class="fu-label">手術後追蹤 Follow-up（壹-四、壹-五）</div><ul class="fu-list">' +
        '<li><b>回診頻率</b>：手術後前兩年每 <b>3–6 個月</b>一次。</li>' +
        '<li><b>每次回診</b>：身體檢查（含<b>鎖骨上淋巴結觸診</b>）、胸部 X 光（視需要）。</li>' +
        '<li><b>胸部 X 光</b>：建議至少每 6 個月一次；高復發風險者可更密集。</li>' +
        '<li><b>腫瘤指數（CEA）</b>：視需要每 6 個月追蹤一次。</li>' +
        '<li><b>胸部 CT</b>：CXR 或 CEA 有變化時做；無症狀例行追蹤者，第一至二期每 <b>6 個月–1 年</b>、第三至四期每 <b>3–6 個月</b>。</li>' +
        '<li><b>腦部 CT／全身骨骼掃瞄</b>：有症狀或 CEA 有變化時。<b>全身正子掃描</b>：有症狀或 CEA 有變化但 CT 無法確定病灶時。</li>' +
        '<li><b>復發處置</b>（壹-五，儘量病理確認並重新分期）：局部可切除 → 照會外科評估切除；局部不可切除 → 放射治療或消融治療；多處病灶或惡性肋膜／心包膜積液 → 化療／標靶／免疫或保守治療，必要時手術引流。</li>' +
        '</ul>';
    } else { // systemic
      h = '<div class="fu-label">追蹤與支持治療 Follow-up（壹-三(三)、壹-六）</div><ul class="fu-list">' +
        '<li>化學治療<b>中</b>及<b>後</b>之影像學檢查間隔，均視病患情況而定。</li>' +
        '<li>擴散期 SCLC 建議<b>定期安排腦部影像學追蹤</b>。</li>' +
        '<li><b>安寧緩和醫療</b>：初診斷為第四期或復發且不可治癒之肺癌時，即可於建議全身性抗癌治療之<b>同時</b>轉介安寧緩和醫療門診諮詢；病人拒絕抗癌治療者亦可直接轉診。</li>' +
        '<li>疾病惡化已不適合積極抗癌治療且先前未曾照會者，建議接受緩解性、支持性之安寧醫療照護。</li>' +
        '<li>戒菸衛教；並告知家屬國民健康署對直系親屬之<b>低劑量肺部電腦斷層篩檢</b>政策。</li>' +
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

  /* ---------- 共用內容片段 ---------- */

  // 含鉑雙藥（貳-一／二，輔助與新輔助共用同一組處方）
  var PLAT_DOUBLET =
    '<span class="rx">cisplatin + vinorelbine</span>／<span class="rx">gemcitabine</span>／' +
    '<span class="rx">docetaxel</span>／<span class="rx">paclitaxel + carboplatin</span>；' +
    '非鱗狀可用 <span class="rx">pemetrexed + cisplatin</span>。' +
    '共病或無法耐受 cisplatin 者，可以 <span class="drug">carboplatin</span> AUC 4–6 取代。';

  function adjuvantLines(stage) {
    var l = [];
    l.push('<span class="rx-h">術後輔助化療 Adjuvant chemotherapy</span>　<span class="rx-sub">4 週期（貳-一）</span><br>' +
      PLAT_DOUBLET + '（排除體能狀況無法承受化療之病患）');
    if (stage === 's1') {
      l.push('<span class="rx-h">Stage IB 之特別考量</span><br>病理分期 <b>T2 且腫瘤 ≥3cm</b> 之肺腺癌，可用 <span class="drug">UFUR</span>（tegafur 250 mg/m²/day PO，BID 或 TID）作為術後輔助治療，<b>使用期限以 2 年為限</b>。<br>若具<b>分化不良</b>、侵犯 <b>visceral pleura（PL1／PL2）</b>、<b>僅做楔狀切除</b>等特徵，是否追加輔助化療<b>目前並無實證可定論</b>，請主治醫師與病人討論治療計劃。');
    }
    return l;
  }

  function adjTargetLine(biom, stage) {
    if (biom === 'b_egfr') {
      var s = '<span class="rx-h">EGFR del19／L858R → Osimertinib</span><br>' +
        '<span class="drug">osimertinib</span> 80 mg QD <b>共 3 年</b>，於完整手術切除及術後輔助化療後接續使用。';
      if (stage === 's1') {
        s += '<br>Stage IB（AJCC 7th）個案可考慮於術後輔助化療之後給予；如評估有需要亦可考慮合併接受術後輔助化療。';
      } else {
        s += '<br><b>如病人不適合接受術後輔助化療，亦可術後直接給予</b> 3 年 osimertinib。';
      }
      return s;
    }
    if (biom === 'b_alk') {
      var a = '<span class="rx-h">ALK rearrangement → Alectinib</span><br>' +
        '<span class="drug">alectinib</span> 600 mg BID <b>共 2 年</b>（stage IB–IIIA，接受完整手術切除者）。';
      if (stage === 's3a') {
        a += '<br>台大指引 Stage IIIA 條列：依 <b>AJCC 9th edition</b>，<b>腫瘤 ≥4cm 或具淋巴結轉移</b>且 ALK 陽性者可考慮術後給予。';
      } else {
        a += '<br>台大指引 Stage II 條列：依 <b>AJCC 9th edition</b> 具 ALK rearrangement 者可考慮術後給予。';
      }
      return a;
    }
    return '<span class="rx-h">無 EGFR／ALK → 輔助免疫治療</span>　<span class="rx-sub">1 年</span><br>' +
      '術前<b>未曾</b>接受新輔助免疫合併化療者，可依 PD-L1 表現考慮 <span class="drug">atezolizumab</span>（<b>限 PD-L1 ≥1%</b>；840 mg Q2W／1200 mg Q3W／1680 mg Q4W）或 <span class="drug">pembrolizumab</span>（200 mg Q3W）。<br>' +
      '術前<b>已</b>接受過新輔助免疫合併化學治療者，術後可考慮接續 <span class="drug">pembrolizumab</span> 或 <span class="drug">durvalumab</span> 輔助免疫治療。';
  }

  function neoadjLine(stage) {
    var s = '<span class="rx-h">新輔助治療 Neoadjuvant</span>　<span class="rx-sub">最多 4 週期，視治療反應再手術</span><br>';
    if (stage === 's3bc') {
      s += '對<b>可能切除的 IIIB</b> 腫瘤，若無 EGFR 及 ALK 突變，可考慮給予 2–4 週期新輔助化療，或化療合併免疫（<span class="drug">nivolumab</span>、<span class="drug">pembrolizumab</span> 或 <span class="drug">durvalumab</span>）。';
    } else {
      s += '若腫瘤<b>無 EGFR 及 ALK 突變</b>，可考慮給予 2–4 週期新輔助化療，或化療合併免疫（<span class="drug">pembrolizumab</span>、<span class="drug">nivolumab</span> 或 <span class="drug">durvalumab</span>）。';
    }
    s += '<br><span class="rx">nivolumab</span> 360 mg + 含鉑雙藥 Q3W ×3（CheckMate 816）；圍手術期則為 ×4 週期後，術後接續 nivolumab 480 mg Q4W ×12（或 pembrolizumab 200 mg Q3W ×13、durvalumab 1500 mg Q4W ×12）。';
    s += '<br><b>EGFR del19／L858R 之 stage II–IIIB</b>：<span class="drug">osimertinib</span> 80 mg QD ≥9 週 ± platinum/pemetrexed Q3W 最多 3 週期（NeoADAURA）。';
    return s;
  }

  var NODE_SAMPLING =
    '<span class="rx-h">縱膈淋巴結取樣</span><br>手術中若發現有明顯淋巴結，完成原發部位<b>同側縱膈腔淋巴結取樣</b>時建議摘除 <b>≥3 個 N2 站別</b>（<b>需包含 subcarinal node</b>）；若無明顯淋巴結，於手術紀錄及照片中加註亦視為完成淋巴結廓清。<br>' +
    '<span class="rx-sub">排除：年邁或無法配合者、術中發現已有肋膜擴散者、術中肋膜沾黏嚴重無法多處取樣者。</span>';

  var MARGIN_POS =
    '<span class="rx-h">切緣陽性之處置</span><br>建議於<b>手術後 8 週內進行放射治療</b>，或考慮<b>再切除性手術（re-resection）</b>。<br>' +
    '<span class="rx-sub">排除：因心肺功能不佳、故未做大範圍全切除手術而改由其他輔助性療法之病患。</span>';

  function ccrtLines(withDurva) {
    var l = [];
    l.push('<span class="rx-h">同步化放療 CCRT</span>　<span class="rx-sub">貳-三</span><br>' +
      '<span class="rx">paclitaxel + carboplatin</span>（paclitaxel 40–60 mg/m² + carboplatin AUC 2，D1/8/15/22/29/36）；或 ' +
      '<span class="rx">PE</span>（<span class="drug">cisplatin</span> 40–50 mg/m² D1,8,29,36 + <span class="drug">etoposide</span> 40–50 mg/m² D1-5, D29-33）；' +
      '非鱗狀可用 <span class="rx">pemetrexed + cisplatin</span>。<br>' +
      '<b>Stage IIIA／IIIB 之兩種選擇</b>：① PE + RT 45Gy，無惡化則接續手術；② PE + RT >60Gy 作為根除性治療。<br>' +
      '<b>上溝瘤（T3-4 N0-1）</b>：PE + RT 45Gy 後手術。');
    if (withDurva) {
      l.push('<span class="rx-h">鞏固性治療 Consolidation</span>　<span class="rx-sub">放射治療結束後疾病無惡化者</span><br>' +
        '<span class="drug">durvalumab</span> 10 mg/kg Q2W 或 1500 mg Q4W，<b>維持 1 年</b>（stage III、PS 0-1 無法開刀者）。<br>' +
        '<b>不可切除 stage III 且具 EGFR 突變</b>者，完成 chemoradiation 後可考慮接續 <span class="drug">osimertinib</span> 80 mg PO QD 作為鞏固治療。');
    }
    return l;
  }

  /* ---------- Stage IV 系統性治療（參-一）---------- */
  function driverLines(driver) {
    var l = [];
    if (driver === 'd_egfr') {
      l.push('<span class="rx-h">EGFR 突變</span>　<span class="rx-sub">參-一(一)，可選處方</span><br>' +
        '<span class="drug">gefitinib</span> 250 mg QD｜<span class="drug">erlotinib</span> 100–150 mg QD｜<span class="drug">afatinib</span> 30–40 mg QD｜<span class="drug">dacomitinib</span> 30–45 mg QD｜' +
        '<span class="drug">osimertinib</span> 80 mg QD｜<span class="drug">aumolertinib</span> 110 mg QD<br>' +
        '合併型：<span class="rx">erlotinib + bevacizumab</span>（7.5–15 mg/kg Q3W）｜<span class="rx">erlotinib + ramucirumab</span>（10 mg/kg Q2W）｜' +
        '<span class="rx">amivantamab + lazertinib</span>｜<span class="rx">osimertinib + pemetrexed/platinum</span> Q3W');
      l.push('<span class="rx-h">EGFR-TKI 惡化後</span><br>已用過 gefitinib／erlotinib／afatinib／dacomitinib 者，再次組織或液態切片若有 <b>T790M</b> → <span class="drug">osimertinib</span>。<br>' +
        'T790M 陽性且已接受二線 osimertinib，或 <b>T790M 陰性</b>者 → 可考慮 <span class="rx">platinum-based chemotherapy Q3W + amivantamab</span>。');
    } else if (driver === 'd_alk') {
      l.push('<span class="rx-h">ALK translocation</span>　<span class="rx-sub">參-一(二)</span><br>' +
        '<span class="drug">crizotinib</span> 250 mg BID｜<span class="drug">ceritinib</span> 450 mg QD（隨餐）｜<span class="drug">alectinib</span> 600 mg BID｜' +
        '<span class="drug">brigatinib</span> 90 mg QD ×7 天後 180 mg QD｜<span class="drug">lorlatinib</span> 100 mg QD');
      l.push('已接受 <b>ceritinib／alectinib／brigatinib</b> 治療後惡化者 → 可建議 <span class="drug">lorlatinib</span>。');
    } else if (driver === 'd_ros1') {
      l.push('<span class="rx-h">ROS1 translocation</span>　<span class="rx-sub">參-一(三)</span><br>' +
        '<span class="drug">crizotinib</span> 250 mg BID｜<span class="drug">entrectinib</span> 600 mg QD｜' +
        '<span class="drug">repotrectinib</span> 160 mg QD ×14 天，可耐受則 160 mg BID');
    } else if (driver === 'd_other') {
      l.push('<span class="rx-h">BRAF V600</span><br><span class="rx">dabrafenib + trametinib</span>（150 mg BID + 2 mg QD）｜<span class="rx">encorafenib + binimetinib</span>（450 mg QD + 45 mg BID）');
      l.push('<span class="rx-h">MET exon 14 skipping</span><br><span class="drug">capmatinib</span> 400 mg BID｜<span class="drug">tepotinib</span> 450 mg QD（隨餐）');
      l.push('<span class="rx-h">RET translocation</span><br><span class="drug">selpercatinib</span> 120 mg BID（BW <50 kg）或 160 mg BID｜<span class="drug">pralsetinib</span> 400 mg QD');
      l.push('<span class="rx-h">NTRK translocation</span><br><span class="drug">entrectinib</span> 600 mg QD｜<span class="drug">larotrectinib</span> 100 mg BID｜<span class="drug">repotrectinib</span>');
      l.push('<span class="rx-h">EGFR exon 20 insertion</span><br>一線：<span class="rx">amivantamab + pemetrexed + carboplatin</span>；曾接受其他全身性治療後惡化：<span class="drug">amivantamab</span> 單用（1050 mg，BW ≥80 kg 為 1400 mg）。');
      l.push('<span class="rx-h">KRAS G12C</span>　<span class="rx-sub">限曾接受其他全身性治療後惡化者</span><br><span class="drug">sotorasib</span> 960 mg QD｜<span class="drug">adagrasib</span> 600 mg BID');
      l.push('<span class="rx-h">ERBB2（HER2）mutation</span>　<span class="rx-sub">限曾接受其他全身性治療後惡化者</span><br><span class="drug">trastuzumab deruxtecan</span> 5.4 mg/kg Q3W');
    } else { // d_none
      l.push('<span class="rx-h">免疫檢查點抑制劑單用</span>　<span class="rx-sub">參-一(十一)1</span><br>' +
        '<b>一線及後線</b>：<span class="drug">pembrolizumab</span> 200 mg Q3W（22C3 或 SP263，<b>TPS ≥1%</b>）<br>' +
        '<b>一線</b>：<span class="drug">atezolizumab</span> 1200 mg Q3W（SP142，<b>TC ≥50% 或 IC ≥10%</b>）｜<span class="rx">nivolumab + ipilimumab</span>（28-8 或 SP263，<b>TC ≥1%</b>）<br>' +
        '<b>後線</b>：<span class="drug">nivolumab</span>｜<span class="drug">atezolizumab</span>｜<span class="drug">tislelizumab</span>');
      l.push('<span class="rx-h">免疫 + 含鉑雙藥化療</span><br>' +
        '<b>非鱗狀</b>：<span class="rx">pembrolizumab + platinum + pemetrexed</span>｜<span class="rx">atezolizumab + bevacizumab + carboplatin + paclitaxel</span>｜<span class="rx">atezolizumab + carboplatin + nab-paclitaxel</span>｜<span class="rx">nivolumab + bevacizumab + carboplatin + paclitaxel</span>｜<span class="rx">tislelizumab + pemetrexed + platinum</span>（限 PD-L1 ≥50%）<br>' +
        '<b>鱗狀</b>：<span class="rx">pembrolizumab + carboplatin + paclitaxel/nab-paclitaxel</span>｜<span class="rx">tislelizumab + paclitaxel + carboplatin</span><br>' +
        '<b>不分型</b>：<span class="rx">nivolumab + ipilimumab + platinum + 化療</span> ×2 週期後接續 nivolumab + ipilimumab');
      l.push('<span class="rx-h">含鉑雙藥化療</span><br>platinum + <span class="drug">pemetrexed</span>（限非鱗狀）／<span class="drug">docetaxel</span>／<span class="drug">paclitaxel</span>／<span class="drug">gemcitabine</span>／<span class="drug">vinorelbine</span>（IV 或 PO）');
      l.push('<span class="rx-h">單一處方化療</span><br><span class="drug">pemetrexed</span>（限非鱗狀）｜<span class="drug">docetaxel</span>｜<span class="drug">paclitaxel</span>｜<span class="drug">gemcitabine</span>｜<span class="drug">vinorelbine</span>｜<span class="drug">TS-1</span>');
      l.push('<span class="rx-h">血管新生抑制劑</span><br>一線搭配含鉑雙藥：<span class="drug">bevacizumab</span> 7.5 或 15 mg/kg（<b>限非鱗狀</b>）；二線搭配 docetaxel：<span class="drug">ramucirumab</span> 10 mg/kg Q3W。');
    }
    l.push('<span class="rx-h">局部處置（參見壹-三 5）</span><br>' +
      '主腫瘤之外僅有<b>寡轉移（oligometastasis）</b>：可考慮一併手術切除或姑息性放射治療；體能不佳無法手術者可考慮放射治療或其他局部治療。<br>' +
      '疑為<b>多發性原發腫瘤</b>且無其他轉移者，以手術切除為原則。<br>' +
      '計畫接受<b>姑息性肺腫瘤切除手術</b>者，建議術前提報胸腔腫瘤多專科團隊會議討論。');
    return l;
  }

  var IO_NOTE = '相關免疫治療副作用及照護原則，請詳見台大醫院「癌症免疫治療藥物照護原則」。carboplatin 劑量以 Calvert 公式計算（AUC 4–6；CCr <60 ml/min 建議改用 carboplatin）。';

  /* ---------- 主渲染 ---------- */
  function lcRender() {
    var s = lcSt;

    lcShow('lc_nsclc', s.histo === 'nsclc');
    lcShow('lc_c2', s.histo === 'nsclc');
    lcShow('lc_sclc', s.histo === 'sclc');
    lcShow('lc_sc2', s.histo === 'sclc');

    // --- NSCLC 步驟顯示 ---
    var loco = (s.histo === 'nsclc' && s.stage && s.stage !== 's4');
    lcShow('lc_c3', loco);
    lcShow('lc_s3', loco);

    var operated = (loco && s.op === 'op_yes');
    lcShow('lc_c4', operated);
    lcShow('lc_s4', operated);

    // 輔助分子標記：R0 切除後才問（stage I 之 IB 亦適用）
    var showBiom = (operated && s.rstat === 'R0');
    lcShow('lc_c5', showBiom);
    lcShow('lc_s5', showBiom);

    var isIV = (s.histo === 'nsclc' && s.stage === 's4');
    lcShow('lc_c_drv', isIV);
    lcShow('lc_s_drv', isIV);

    renderNsclcRec();

    // --- SCLC 步驟顯示 ---
    var ldm = (s.histo === 'sclc' && s.ext === 'limited');
    lcShow('lc_sc3', ldm);
    lcShow('lc_s_ld', ldm);
    renderSclcRec();
  }

  /* ---------- NSCLC 建議 ---------- */
  function renderNsclcRec() {
    var s = lcSt;
    if (s.histo !== 'nsclc') return;
    var R = 'lc_nsclc_rec', F = 'lc_nsclc_fu';

    if (!s.stage) { idleRec(R, F, '請選擇步驟 2（臨床分期）'); return; }

    /* ===== Stage IV ===== */
    if (s.stage === 's4') {
      if (!s.driver) { idleRec(R, F, '請選擇步驟 3（致癌驅動基因）'); return; }
      var dTitle = {
        d_egfr: 'Stage IV · EGFR 突變 → EGFR-TKI',
        d_alk: 'Stage IV · ALK 陽性 → ALK 抑制劑',
        d_ros1: 'Stage IV · ROS1 陽性 → ROS1 抑制劑',
        d_other: 'Stage IV · 其他驅動基因 → 對應標靶',
        d_none: 'Stage IV · 無驅動基因 → 依 PD-L1 之免疫／化療'
      }[s.driver];
      result(R, F, 'rec-nonop', dTitle, driverLines(s.driver),
        '參、第四期肺癌個案的抗癌藥物治療處方。' + IO_NOTE +
        '<br>惡性肋膜積液或 pleural nodule（M1a）同樣以化療／標靶／免疫治療為主；90–95% 肋膜積液為惡性，建議盡可能施行肋膜穿刺取得組織或細胞學證據，若仍無定論可考慮胸腔鏡手術。Pleurodesis 之時機視症狀與積液生長速度決定。',
        'systemic');
      return;
    }

    /* ===== Stage I–IIIC ===== */
    if (!s.op) { idleRec(R, F, '請選擇步驟 3（是否可接受手術切除）'); return; }

    // 不可手術
    if (s.op === 'op_no') {
      if (s.stage === 's1') {
        result(R, F, 'rec-nonop', 'Stage I · 無法手術 → 放射治療或其他局部治療',
          ['體能狀況不佳無法接受手術者，可考慮接受<b>放射治療</b>或其他局部治療。',
           '<span class="rx-h">SBRT／SABR</span>　<span class="rx-sub">肆、RT Guidelines</span><br>適應症包含 <b>T1–T2、N0</b> 之早期肺癌。劑量分次可選 25–34 Gy/1 fx、45–60 Gy/3 fx、≥48–50 Gy/4 fx、≥50–60 Gy/5–6 fx、60–70 Gy/8–10 fx。',
           '<span class="rx-h">根除性放療</span><br>Medically inoperable（stage I–II）：常規或大分次 ≥1.8–4 Gy/fx，累積劑量 50–66 Gy。'],
          '壹-三 1(5)：體能狀況不佳無法接受手術者，可考慮接受放射治療或其他局部治療。', 'systemic');
        return;
      }
      if (s.stage === 's2') {
        result(R, F, 'rec-nonop', 'Stage II · 無法手術 → 化放療／放療或其他局部療法',
          ['體能狀況不佳無法接受手術者，可考慮接受<b>化學治療加放射治療</b>、<b>放射治療</b>、或其他局部療法。'].concat(ccrtLines(false)),
          '壹-三 2(5)。' + IO_NOTE, 'systemic');
        return;
      }
      // IIIA / IIIB-C 不可手術
      var t3 = (s.stage === 's3a')
        ? 'Stage IIIA · 無法手術 → 同步化放療 + Durvalumab 鞏固'
        : 'Stage IIIB／IIIC · 無法手術 → 同步化放療 + Durvalumab 鞏固';
      var lines3 = [];
      if (s.stage === 's3bc') {
        lines3.push('<b>N3 及無法接受治癒性手術切除的 N2 病患</b>，可接受同步化學治療及放射治療。');
      }
      lines3 = lines3.concat(ccrtLines(true));
      lines3.push('<span class="rx-h">體能狀況不佳無法接受手術及化療者</span><br>可考慮接受<b>放射治療</b>或其他局部治療。');
      if (s.stage === 's3bc') {
        lines3.push('<span class="rx-h">EGFR del19／L858R 之 stage IIIB／IIIC</span><br>如<b>無法接受手術或同步化放療</b>，經與醫師討論可接受 <span class="rx">osimertinib ± pemetrexed-platinum</span> 作為<b>第一線治療</b>。');
      }
      result(R, F, 'rec-nonop', t3, lines3,
        (s.stage === 's3a' ? '壹-三 3(9)(10)' : '壹-三 4(1)(6)(7)(8)') + '：CCRT 後疾病無惡化者建議給予 durvalumab 維持 1 年之鞏固性治療。' + IO_NOTE,
        'systemic');
      return;
    }

    // 可手術 → 尚未選切緣
    if (!s.rstat) {
      var lines = [];
      if (s.stage === 's1') {
        lines.push('<span class="rx-h">手術切除</span>　<span class="rx-sub">壹-三 1(1)</span><br>' +
          '<b>標準術式為肺葉切除（lobectomy）</b>（排除年邁、心肺功能不佳或其他身體因素導致無法接受大範圍肺部切除者）。');
        lines.push('<div class="cbx"><div class="cbx-h">Sublobar resection 之時機　<span class="cbx-sub">腫瘤 ≤2cm，且符合下列之一</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">①</span>pure AIS histology</span>' +
          '<span class="cb"><span class="cb-k">②</span>CT 上 ground-glass appearance ≥50%</span>' +
          '<span class="cb"><span class="cb-k">③</span>腫瘤倍增時間 ≥400 天</span>' +
          '</div></div>' +
          '施行 sublobar resection 時，建議切除安全範圍（section margins）<b>≥2cm 或 ≥腫瘤直徑</b>。');
        lines.push(NODE_SAMPLING);
      } else {
        if (s.stage === 's2' || s.stage === 's3a') {
          lines.push('<span class="rx-h">術前先行多專科討論</span><br>手術前臨床分期為<b>第' + (s.stage === 's2' ? '二' : '三 A') + '期</b>之病人，建議於手術前先提報<b>多專科團隊會議</b>討論，或於術前先<b>照會胸腔腫瘤內科醫師</b>，與胸腔外科醫師一起討論治療方案。');
        } else {
          lines.push('<span class="rx-h">術前先行多專科討論</span><br>手術前確診為 <b>stage IIIB／IIIC</b> 且計畫接受治癒性手術者，建議於手術前提至<b>胸腔腫瘤多專科團隊會議</b>討論。');
        }
        lines.push(neoadjLine(s.stage));
        if (s.stage === 's2' || s.stage === 's3a') {
          lines.push('<span class="rx-h">局部侵犯個案</span><br>如<b>近端氣道腫瘤、上溝腫瘤（superior sulcus tumor）或侵犯胸廓</b>之腫瘤，可先給予同步化放療或單用新輔助化療，再視反應進行手術切除；或先手術切除，之後再追加放射治療或化學治療。');
        }
        lines.push('<span class="rx-h">手術切除</span><br>肺葉切除 + 系統性縱膈淋巴結廓清（排除因年邁、肺功能太差、不適合麻醉而無法進行手術之病患）。');
        lines.push(NODE_SAMPLING);
      }
      result(R, F, 'rec-elective',
        ({ s1: 'Stage I', s2: 'Stage II', s3a: 'Stage IIIA', s3bc: 'Stage IIIB／IIIC' }[s.stage]) + ' · 手術切除',
        lines,
        '手術完成後請於步驟 4 選擇切緣狀態，以決定後續輔助治療。術前胸部 CT 距手術日超過 3 個月建議重新檢查。', null);
      return;
    }

    // 切緣陽性
    if (s.rstat === 'Rpos') {
      var linesR = [MARGIN_POS];
      if (s.stage !== 's1') {
        linesR.push('<span class="rx-h">併行輔助化療</span><br>除輔助性化學治療外，仍<b>建議</b>考慮術後 8 週內之放射治療或再切除手術。');
        linesR = linesR.concat(adjuvantLines(s.stage));
      }
      linesR.push('<span class="rx-h">術後放射治療之適應症</span>　<span class="rx-sub">肆、Postoperative RT</span><br>' +
        'gross residual disease、positive margin、縱膈淋巴結轉移（N2，若無其他風險因子則為 optional）、extranodal extension。累積劑量 45–66 Gy，1.8–3 Gy/fx。');
      result(R, F, 'rec-urgent',
        ({ s1: 'Stage I', s2: 'Stage II', s3a: 'Stage IIIA', s3bc: 'Stage IIIB／IIIC' }[s.stage]) + ' · 切緣陽性 → 術後放療或再切除',
        linesR,
        '壹-三：接受治癒性手術後被證實切除邊緣仍存有癌細胞者，建議在手術後 8 週內進行放射治療，或考慮再切除性手術。', 'postop');
      return;
    }

    // R0 → 依分子標記給輔助治療
    if (!s.biom) { idleRec(R, F, 'R0 完整切除 → 請選擇步驟 5（術後輔助治療之分子標記）'); return; }

    var linesA = adjuvantLines(s.stage);
    linesA.push(adjTargetLine(s.biom, s.stage));
    if (s.stage === 's3bc') {
      linesA[0] = '<span class="rx-h">術後輔助化療 Adjuvant chemotherapy</span>　<span class="rx-sub">4 週期（貳-一）</span><br>' +
        '術前<b>未曾</b>接受新輔助免疫合併化學治療者，<b>應</b>接受輔助性化學治療（排除因體能狀況無法承受化療之病患）。<br>' + PLAT_DOUBLET;
    }
    var bTitle = { b_egfr: 'EGFR → Osimertinib 3 年', b_alk: 'ALK → Alectinib 2 年', b_none: '輔助化療 ± 免疫治療 1 年' }[s.biom];
    result(R, F, 'rec-elective',
      ({ s1: 'Stage I', s2: 'Stage II', s3a: 'Stage IIIA', s3bc: 'Stage IIIB／IIIC' }[s.stage]) + ' · R0 切除 → ' + bTitle,
      linesA,
      '貳-一：輔助化學治療、免疫治療及標靶藥物處方。' + IO_NOTE, 'postop');
  }

  /* ---------- SCLC 建議 ---------- */
  function renderSclcRec() {
    var s = lcSt;
    if (s.histo !== 'sclc') return;
    var R = 'lc_sclc_rec', F = 'lc_sclc_fu';

    if (!s.ext) { idleRec(R, F, '請選擇步驟 2（疾病範圍）'); return; }

    var PCI = '<span class="rx-h">預防性全腦放射治療 PCI</span><br>' +
      '侷限期或擴散期經治療後達 <b>SD／PR／CR</b>，且病人日常體能狀態與<b>精神狀態（mental status）良好</b>者，可考慮施行。<br>' +
      '劑量建議 <b>2.5 Gy ×10 fractions</b>；擴散期為 optional，若腦部 MRI 陰性可省略。';

    if (s.ext === 'limited') {
      if (!s.ldtx) { idleRec(R, F, '請選擇步驟 3（是否為 cT1-2 N0）'); return; }

      if (s.ldtx === 'ld_surg') {
        result(R, F, 'rec-elective', '侷限期 · cT1-2 N0 → 手術 + 依 pN 分期之輔助治療', [
          '<span class="rx-h">手術後依病理分期決定</span>　<span class="rx-sub">壹-二(二)1</span><br>' +
            '<b>pN0</b> → 可考慮給予<b>輔助性化學治療</b>。<br>' +
            '<b>pN1 或 pN2</b> → 可考慮給予<b>輔助性化學治療</b>或<b>同步化放療（CCRT）</b>。',
          '<span class="rx-h">化療骨架</span><br><span class="rx">EP</span>：<span class="drug">etoposide</span> 80–100 mg/m² D1-3 + <span class="drug">cisplatin</span> 60–80 mg/m² D1（或 <span class="drug">carboplatin</span> AUC 4–6），Q3W。',
          '<span class="rx-h">術後放射治療之適應症</span>　<span class="rx-sub">肆、SCLC Postoperative RT</span><br>gross residual disease、positive margin、縱膈淋巴結轉移（≥N2，若無其他風險因子則為 optional）、N1（optional）、extranodal extension。',
          PCI
        ], '壹-二(二)：臨床分期 T1-2 N0，手術後若病理分期為 pN0 可考慮輔助化療；pN1 或 pN2 可考慮輔助化療或 CCRT。' + IO_NOTE, 'postop');
        return;
      }

      result(R, F, 'rec-nonop', '侷限期 · 同步化放療（CCRT）+ Durvalumab 鞏固', [
        '<span class="rx-h">標準治療：CCRT</span>　<span class="rx-sub">壹-二(二)2</span><br>' +
          '侷限期 SCLC 之<b>標準治療為同步化學治療加放射治療</b>。<br>' +
          '體能狀況不佳無法接受 CCRT 者，可接受<b>接續性</b>化療與放療（sequential），或單獨化療或單獨放療。',
        '<span class="rx-h">化療骨架</span><br><span class="rx">EP</span>：<span class="drug">etoposide</span> 80–100 mg/m² D1-3 + <span class="drug">cisplatin</span> 60–80 mg/m² D1（或 <span class="drug">carboplatin</span> AUC 4–6，CCr <60 ml/min 建議），Q3W。',
        '<span class="rx-h">放射治療</span>　<span class="rx-sub">肆、SCLC Definitive RT</span><br>' +
          '常規分次：1.8–2.5 Gy/fx，每日一次，每週 5 天，總劑量 ≥45 Gy。<br>' +
          '超分次（hyperfractionation）：1.5–1.8 Gy/fx，每日兩次，間隔 >6 小時，總劑量 ≥45 Gy。',
        '<span class="rx-h">鞏固性免疫治療</span><br>接受完 CCRT 後<b>如果疾病沒有惡化</b>，可考慮 <span class="drug">durvalumab</span> <b>1500 mg every 4 weeks for 2 years</b>。',
        PCI
      ], '壹-二(二)2、5。具肋膜或心包膜積液而無其他遠端轉移之 SCLC，其治療由臨床醫師和放射腫瘤科醫師討論後決定。' + IO_NOTE, 'systemic');
      return;
    }

    // 擴散期
    result(R, F, 'rec-nonop', '擴散期 · 化療合併免疫治療', [
      '<span class="rx-h">一線治療</span>　<span class="rx-sub">參-二(一)</span><br>' +
        '<span class="rx">atezolizumab + etoposide + carboplatin</span>（Q3W；atezolizumab 1200 mg D1、etoposide 80–100 mg/m² D1-3、carboplatin AUC 4–6 D1）<br>' +
        '<span class="rx">durvalumab + etoposide + platinum</span>（Q3W；durvalumab 1500 mg D1）<br>' +
        '或單用 <span class="rx">etoposide + platinum</span>（EP）。',
      '<span class="rx-h">維持治療</span><br>4–6 次治療後腫瘤無惡化者：可考慮 <span class="drug">atezolizumab</span> maintenance，或 <span class="rx">atezolizumab + lurbinectedin</span>（3.2 mg/m² Q3W）；durvalumab 組則可考慮 <span class="drug">durvalumab</span> maintenance。',
      '<span class="rx-h">二線治療</span>　<span class="rx-sub">參-二(二)</span><br>' +
        '<span class="drug">topotecan</span> 1.0–1.5 mg/m² IV D1-5（或口服 ≤2.3 mg/m²/day D1-5）｜' +
        '<span class="drug">lurbinectedin</span> 3.2 mg/m² D1 Q3W｜' +
        '<span class="drug">tarlatamab</span>（第 1 個 cycle 3 週：1 mg D1、10 mg D8 及 D15；第 2 個 cycle 起每 4 週，10 mg Q2W）｜臨床試驗。',
      '<span class="rx-h">其他治療選擇</span>　<span class="rx-sub">參-二(三)</span><br>' +
        '<span class="rx">oral topotecan + cisplatin</span>｜<span class="rx">weekly irinotecan + cisplatin</span>｜' +
        '<span class="rx">CAV</span>（<span class="drug">cyclophosphamide</span> + <span class="drug">doxorubicin</span> + <span class="drug">vincristine</span>）。',
      '<span class="rx-h">鞏固性胸腔放療</span>　<span class="rx-sub">肆、Consolidative RT（optional）</span><br>擴散期對化療或化學免疫治療有反應者，可考慮 1.5–3 Gy/fx、總劑量 ≥30 Gy。',
      PCI
    ], '壹-二(二)3：擴散期 SCLC 可接受化學治療合併免疫治療，或是化學治療；建議擴散期病人<b>定期安排腦部影像學追蹤</b>。' + IO_NOTE, 'systemic');
  }

  /* ---------- 事件 ---------- */
  function lcPick(key, val, btn) {
    lcSel(btn);
    var s = lcSt;
    if (key === 'histo') {
      s.histo = val;
      s.stage = s.op = s.rstat = s.biom = s.driver = s.ext = s.ldtx = null;
      lcClearSel(['lc_s2', 'lc_s3', 'lc_s4', 'lc_s5', 'lc_s_drv', 'lc_s_ext', 'lc_s_ld']);
    } else if (key === 'stage') {
      s.stage = val; s.op = s.rstat = s.biom = s.driver = null;
      lcClearSel(['lc_s3', 'lc_s4', 'lc_s5', 'lc_s_drv']);
    } else if (key === 'op') {
      s.op = val; s.rstat = s.biom = null;
      lcClearSel(['lc_s4', 'lc_s5']);
    } else if (key === 'rstat') {
      s.rstat = val; s.biom = null;
      lcClearSel(['lc_s5']);
    } else if (key === 'biom') { s.biom = val; }
    else if (key === 'driver') { s.driver = val; }
    else if (key === 'ext') {
      s.ext = val; s.ldtx = null;
      lcClearSel(['lc_s_ld']);
    } else if (key === 'ldtx') { s.ldtx = val; }
    lcRender();
  }

  function lcReset() {
    for (var k in lcSt) { if (lcSt.hasOwnProperty(k)) lcSt[k] = null; }
    var root = document.getElementById('lcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['lc_nsclc_fu', 'lc_sclc_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    lcRender();
  }

  function initLungPathway() { lcReset(); }

  // 匯出
  global.lungPathwayHTML = lungPathwayHTML;
  global.initLungPathway = initLungPathway;
  global.lcPick = lcPick;
  global.lcReset = lcReset;
})(window);
