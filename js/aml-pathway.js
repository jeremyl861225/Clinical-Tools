/* ============================================================
   血癌（急性骨髓性白血病）治療互動決策流程
   Acute Myeloid Leukemia Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 血癌診療指引 版次 15
   （2026/06/16，文件編號 50710-2-000023；AML-1 ～ AML-16）
   放射治療部分：Leukemia Radiation Therapy Guidelines v1.0（2025/09）
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ------------------------------------------------------------
   流程分支已逐頁比對指引原圖（非僅文字擷取）；文字擷取之順序與
   圖面連線不一致者以圖面為準，例如 AML-2 的處方清單屬於「有前驅
   血液疾病／治療相關／高風險」分支（而非 de novo 分支）、AML-7 的
   favorable 組僅有 3 項（而非文字擷取所呈現的 allo-HSCT 清單）。
   ============================================================ */
(function (global) {
  'use strict';

  var amSt = {
    dx: null,        // nonm3 | apl | other
    fit: null,       // fit | unfit
    bg: null,        // denovo | secondary
    flt3: null,      // neg | pos
    ind: null,       // std（3+7／非 HDAC）| hdac（IDAC/HDAC 或 FLAG）
    resp: null,      // cr | fail（適合化療者，AML-4／5／6）
    risk: null,      // fav | int | adv（AML-7 鞏固）
    ufresp: null,    // cr | fail（不適合化療者，AML-9）
    aplphase: null,  // new | relapse
    aplrisk: null,   // low | high | highcard
    aplrel: null     // early_ato | early_anthra | late_ato
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="amPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function amlPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院血癌診療指引 版次 15</b>（2026/06/16，AML-1～AML-16）之互動決策流程。逐步點選以取得對應建議處置、藥物療程與追蹤方式。<b>本指引之化療章節僅涵蓋 AML</b>；ALL／MPAL／MDS 於第 1 步分流後即離開本指引。</p>';
    h += '<div class="onc-path" id="amPath">';

    // Step 1 — AML-1：初步評估後之診斷分流
    h += step('am_s1', '1', '骨髓與流式細胞／細胞遺傳學／分子檢查後之診斷（AML-1）',
      opt('dx', 'nonm3', 'AML，non-M3', '非急性前骨髓性白血病 → AML-2') +
      opt('dx', 'apl', 'AML，M3（APL）', '急性前骨髓性白血病 → AML-10～AML-14') +
      opt('dx', 'other', 'ALL／MPAL／未定型系列 或 MDS', '本指引化療章節未涵蓋'),
      '<div class="note"><b>AML-1 初診檢查：</b>病史與理學檢查；CBC+D/C、生化；PT、aPTT；<b>骨髓抽吸 ± 切片</b>（含免疫表型與細胞化學染色）；細胞遺傳學；<b>分子異常篩檢</b>（融合蛋白、<i>FLT3</i>-ITD、<i>FLT3</i>/TKD、<i>NPM1</i>、<i>CEBPA</i> bZIP in-frame 突變、<i>RUNX1</i> 等，建議用 NGS 平台）；HBsAg、anti-HBsAb、anti-HBcAb、anti-HCV 及／或 HBV-DNA；中心靜脈導管；未來可能接受 alloHSCT 者做 <b>HLA 分型</b>；心功能評估（選擇性，顧慮蒽環類心毒性時）；<b>有症狀者做腰椎穿刺</b>（無症狀者 category 2B）；fibrinogen、D-dimer（選擇性）；IgA／IgG／IgM（選擇性）；懷疑髓外病灶做 <b>PET/CT</b>；懷疑中樞神經出血做<b>腦部 CT（不打顯影劑）</b>；懷疑白血病腦膜炎做<b>腦部 MRI（打顯影劑）</b>；<b>考慮及早整合安寧緩和照護</b>。</div>');

    /* ===================== non-M3 AML ===================== */
    h += '<div id="am_nonm3" class="hidden">';

    h += conn('am_c2');
    h += step('am_s2', '2', '是否適合積極化療（AML-2）',
      opt('fit', 'fit', '適合化療 Fit for C/T', '可耐受標準強度誘導化療') +
      opt('fit', 'unfit', '不適合化療 Unfit for C/T', '因共病無法耐受積極誘導，或病人拒絕 → AML-8'));

    h += connH('am_c3');
    h += step('am_s3', '3', '疾病背景（決定誘導處方組別，AML-2）',
      opt('bg', 'denovo', '原發 De novo', '<b>無</b>前驅血液疾病、<b>非</b>治療相關 → AML-3') +
      opt('bg', 'secondary', '續發／治療相關／高風險', '前驅血液疾病；治療相關；具 MDS 相關基因或細胞遺傳學；poor-risk AML（<i>TP53</i>、17p−）'));
    h = hideStep(h, 'am_s3');

    h += connH('am_c4');
    h += step('am_s4', '4', '<i>FLT3</i> 突變（ITD 或 TKD）（AML-3）',
      opt('flt3', 'neg', '無 FLT3 突變', 'FLT3 wild-type → AML-4 或 AML-5') +
      opt('flt3', 'pos', '有 FLT3 突變', 'ITD 或 TKD → AML-6'));
    h = hideStep(h, 'am_s4');

    h += connH('am_c5');
    h += step('am_s5', '5', '選用之誘導方案（AML-3 之兩組並列選項）',
      opt('ind', 'std', '3+7／非 HDAC 誘導', '3+7、CBF 白血病之 Mylotarg+I3A7 等 → 依 AML-4 於 D+14–21 評估') +
      opt('ind', 'hdac', 'IDAC／HDAC + 蒽環類 或 FLAG ± 蒽環類', '高劑量 Ara-C 為基礎 → 依 AML-5 於 D+21–28 評估'));
    h = hideStep(h, 'am_s5');

    h += connH('am_c6');
    h += step('am_s6', '6', '骨髓恢復後之反應（AML-4／AML-5／AML-6）',
      opt('resp', 'cr', '完全緩解 Complete remission', '→ AML-7 緩解後鞏固') +
      opt('resp', 'fail', '誘導失敗 Induction failure', '→ 再誘導／移植／臨床試驗／支持治療'));
    h = hideStep(h, 'am_s6');

    h += connH('am_c7');
    h += step('am_s7', '7', 'ELN 遺傳學風險分組（決定鞏固強度，AML-7）',
      opt('risk', 'fav', 'Favorable', 'ELN 2022 favorable（詳見「風險分層」分頁）') +
      opt('risk', 'int', 'Intermediate', 'ELN 2022 intermediate') +
      opt('risk', 'adv', 'Adverse', 'ELN 2022 adverse'));
    h = hideStep(h, 'am_s7');

    h += connH('am_c8');
    h += step('am_s8', '4', '誘導後骨髓恢復之反應（AML-9）',
      opt('ufresp', 'cr', '完全緩解 Complete remission', '→ 後續治療與 MRD 監測') +
      opt('ufresp', 'fail', '誘導失敗 Induction failure', '→ salvage 或支持治療'));
    h = hideStep(h, 'am_s8');

    h += rec('am_nonm3_rec', '建議處置 · non-M3 AML');
    h += '<div class="flow-fu hidden" id="am_nonm3_fu"></div>';
    h += '</div>'; // am_nonm3

    /* ===================== APL（M3）===================== */
    h += '<div id="am_apl" class="hidden">';
    h += conn('am_c10');
    h += step('am_s10', '2', '病程階段（APL）',
      opt('aplphase', 'new', '初診 Newly diagnosed', '誘導＋鞏固 → AML-10～AML-12') +
      opt('aplphase', 'relapse', '第一次復發 First relapse', '形態或分子復發 → AML-14'));

    h += connH('am_c11');
    h += step('am_s11', '3', 'APL 風險分層（依初診白血球數與心臟狀況）',
      opt('aplrisk', 'low', '低風險', 'WBC ≤10,000/µL → AML-10') +
      opt('aplrisk', 'high', '高風險 · 無心臟問題', 'WBC >10,000/µL、無心臟問題 → AML-11') +
      opt('aplrisk', 'highcard', '高風險 · 有心臟問題', 'WBC >10,000/µL，低左心室射出分率或 QTc 延長 → AML-12'));
    h = hideStep(h, 'am_s11');

    h += connH('am_c12');
    h += step('am_s12', '3', '復發型態（決定挽救處方，AML-14）',
      opt('aplrel', 'early_ato', '早期復發（<6 個月），前用 ATRA + ATO', '未含蒽環類') +
      opt('aplrel', 'early_anthra', '未曾用過 ATO，或早期復發（<6 個月）於 ATRA + 蒽環類後', '') +
      opt('aplrel', 'late_ato', '晚期復發（≥6 個月），前用含 ATO 處方', ''));
    h = hideStep(h, 'am_s12');

    h += rec('am_apl_rec', '建議處置 · APL（M3）');
    h += '<div class="flow-fu hidden" id="am_apl_fu"></div>';
    h += '</div>'; // am_apl

    /* ===================== 非 AML ===================== */
    h += '<div id="am_other" class="hidden">';
    h += conn('am_c20');
    h += rec('am_other_rec', '本指引未涵蓋 Out of scope');
    h += '</div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="amReset()">重置</button></div>';
    h += '</div>'; // amPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function amSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function amShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function amClearSel(ids) {
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
    if (type === 'induction') {
      h = '<div class="fu-label">誘導後之骨髓追蹤 Follow-up（AML-4／AML-5／AML-6）</div><ul class="fu-list">' +
        '<li><b>追蹤時點</b>：3+7／非 HDAC 誘導與 FLT3 突變者於 <b>D+14–21</b> 做骨髓追蹤（AML-4、AML-6）；HDAC 誘導者於 <b>D+21–28</b>（AML-5）。</li>' +
        '<li><b>Hypoplasia</b>（定義：骨髓細胞density <20% 且其中殘存芽細胞 <5%）→ 等待血球恢復（await recovery），恢復後再判定療效。</li>' +
        '<li><b>殘存芽細胞明顯（significant residual blasts）</b>→ AML-4 之流程為追加 <b>HDAC4-6</b>（Ara-C 1.5–3 g/m² BID 共 4–6 劑）± 蒽環類後等待恢復；AML-5 與 AML-6 則直接進入療效判定。</li>' +
        '<li>血球恢復後判定為<b>完全緩解</b>或<b>誘導失敗</b>（見上方步驟）。</li>' +
        '</ul>';
    } else if (type === 'remission') {
      h = '<div class="fu-label">緩解後追蹤 Follow-up（AML-7／AML-9）</div><ul class="fu-list">' +
        '<li><b>骨髓檢查與 MRD 監測：每 3–6 個月一次，持續 2–3 年。</b></li>' +
        '<li>MRD 之判讀依本指引所引用之 <b>2025 ELN-DAVID MRD Working Party</b> 共識文件。</li>' +
        '<li>復發時 → 再誘導／挽救處方、異體造血幹細胞移植或臨床試驗。</li>' +
        '<li>全身照射（TBI）之適應症（放療指引）：AML 第一次緩解且具高風險特徵、初始誘導難治、復發治療後再緩解、任何治療後難治。</li>' +
        '</ul>';
    } else if (type === 'apl_pcr') {
      h = '<div class="fu-label">鞏固後之分子監測 Follow-up（AML-13）</div><ul class="fu-list">' +
        '<li><b>鞏固結束時</b>以骨髓或血液做 <b>PCR</b> 以確認分子緩解；接受 ATRA／ATO 處方者可考慮於鞏固期間 <b>3–4 個月</b>先行採檢。</li>' +
        '<li><b>PCR 陰性</b>：若原治療計畫含維持治療則接續維持治療，並於維持治療結束後<b>持續 PCR 監測至 2 年</b>。</li>' +
        '<li><b>PCR 陽性</b>：<b>4 週內再驗一次確認</b>。第二次仍陽性＝分子復發，<b>按第一次復發處理</b>；第二次陰性則強烈建議<b>每 3 個月監測、持續 2 年</b>。</li>' +
        '<li><b>建議每 3 個月監測、持續 2 年</b>者：高風險、年齡 >60 歲、鞏固期間曾長時間中斷、或使用含維持治療之處方但無法耐受維持治療者。</li>' +
        '<li>低風險且鞏固結束時已達分子緩解者復發風險低，<b>臨床試驗以外可不必例行監測</b>。</li>' +
        '</ul>';
    } else { // palliative
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>持續評估血球數、輸血需求、感染與出血風險；監測治療毒性與體能狀態。</li>' +
        '<li>疾病進展 → 後線挽救處方或臨床試驗。</li>' +
        '<li><b>安寧緩和照護</b>：因共病不適合積極治療、復發／難治且已至末期、或因個人因素拒絕標準治療者，依規定提供安寧緩和照護選項（AML 附註頁）。</li>' +
        '<li>免疫治療相關副作用與照護原則另見台大醫院「癌症免疫治療藥物照護原則」。</li>' +
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

  /* ---------- 共用內容 ---------- */
  var regimenNote =
    '處方縮寫（AML-3／AML-4 註）：<b>3+7</b>＝蒽環類 D+1–3 ＋ Ara-C 100 mg/m² D+1–7；<b>IDAC／HDAC + 蒽環類</b>＝Ara-C 1,000–3,000 mg/m² q12H × 3 天 ＋ 蒽環類（daunorubicin 60 mg/m² 或 idarubicin 12 mg/m²，1–3 天）；<b>FLAG</b>＝fludarabine 30 mg/m² IV d1–5 ＋ Ara-C 1–2 g/m²（fludarabine 後 4 小時開始、輸注 4 小時）d1–5 ＋ G-CSF SC d0–6，± 蒽環類（idarubicin 8 mg/m² IV 1–3 天）；<b>HDAC4-6</b>＝Ara-C 1.5–3 g/m² BID 共 4–6 劑；<b>HDAC6-8</b>＝Ara-C 1.5–3 g/m² BID 共 6–8 劑。';

  var reimburseNote =
    'AML 藥物之使用請依食藥署核准適應症與健保署給付規定；NGS 檢測請依健保署給付規範（AML 附註頁）。';

  function hsctLine() {
    return '<b>異體造血幹細胞移植（allo-HSCT）</b>：捐者為<b>手足或替代捐者</b>（sibling or alternative donors）。初診時即應為未來可能移植者安排 <b>HLA 分型</b>（AML-1）。';
  }

  /* AML-8：不適合積極誘導者之處方清單 */
  function unfitInduction() {
    return [
      '<span class="rx">Clinical trial</span>（臨床試驗）',
      '<span class="drug">Venetoclax</span> qd PO（100 mg d1、200 mg d2、400 mg d3 起）＋ <span class="drug">azacitidine</span> 75 mg/m² SC/IV（每 28 天循環之 d1–7）<sup>*</sup>',
      '<span class="drug">Venetoclax</span> qd PO（100 mg d1、200 mg d2、400 mg d3 起）＋ <span class="drug">decitabine</span> 20 mg/m² IV（每 28 天循環之 d1–5）<sup>*</sup>',
      '<span class="drug">Venetoclax</span> qd PO（100 mg d1、200 mg d2、400 mg d3、600 mg d4 起）＋ <b>低劑量</b> <span class="drug">cytarabine</span> 20 mg/m²/d SC（每 28 天循環之 d1–10）<sup>*</sup>',
      '<span class="rx">CLIA</span>（<span class="drug">cladribine</span>＋<span class="drug">idarubicin</span>＋<span class="drug">cytarabine</span>）＋ <span class="drug">venetoclax</span>',
      '<span class="drug">Gilteritinib</span> ± <span class="drug">azacitidine</span>（<i>FLT3</i>-ITD 或 TKD）',
      '低強度治療（<span class="drug">Ara-C</span> 或 <span class="drug">azacitidine</span>）',
      '最佳支持治療 Best supportive care'
    ];
  }

  /* AML-7：緩解後鞏固，依 ELN 風險分組 */
  function consolidation(risk) {
    if (risk === 'fav') {
      return [
        '<span class="rx-h">Favorable</span>',
        '<span class="rx">HDAC6-8</span> ± 蒽環類，<b>3–4 個循環</b>',
        '<span class="rx">HDAC6-8</span> ± 蒽環類 ＋ <span class="drug">midostaurin</span> 50 mg q12h（d8–21），<b>1–4 個循環</b>（<i>FLT3</i> 突變之 AML）',
        '<span class="rx">Clinical trials</span>'
      ];
    }
    if (risk === 'int') {
      return [
        '<span class="rx-h">Intermediate</span>',
        '<span class="rx">HDAC6-8</span> ± 蒽環類 <b>1–2 個循環</b>，之後 <b>allo-HSCT</b>（手足或替代捐者）',
        '<span class="rx">HDAC6-8</span> ± 蒽環類 <b>2–4 個循環</b>',
        '<span class="rx">HDAC6-8</span> ± 蒽環類 ＋ <span class="drug">midostaurin</span> 50 mg q12h 或 <span class="drug">quizartinib</span> 40 mg（<b>僅 ITD</b>）（d8–21），<b>1–4 個循環</b>，可加或不加 allo-HSCT（<i>FLT3</i> 突變之 AML）',
        'IDAC 為基礎之鞏固',
        '<span class="rx">Clinical trials</span>／研究用藥',
        '<span class="drug">Onureg</span>（口服 azacitidine）'
      ];
    }
    return [
      '<span class="rx-h">Adverse</span>',
      '<span class="rx">HDAC6-8</span> ± 蒽環類 <b>1–2 個循環</b>，之後 <b>allo-HSCT</b>（手足或替代捐者）',
      '<span class="rx">HDAC6-8</span> ± 蒽環類 ＋ <span class="drug">midostaurin</span> 50 mg q12h 或 <span class="drug">quizartinib</span> 40 mg（<b>僅 ITD</b>）（d8–21），<b>1–4 個循環</b>，可加或不加 allo-HSCT（<i>FLT3</i> 突變之 AML）',
      '<b>allo-HSCT</b>（手足或替代捐者）',
      '<span class="rx">HDAC6-8</span> ± 蒽環類 <b>2–4 個循環</b>',
      'IDAC 為基礎之鞏固',
      '<span class="rx">Clinical trials</span>／研究用藥',
      '<span class="drug">Onureg</span>（口服 azacitidine）'
    ];
  }

  /* APL 復發之共同下游（AML-14） */
  function aplRelapseDownstream() {
    return [
      '<span class="rx-h">達第二次形態緩解（second morphologic remission）</span>',
      '<b>考慮以鞘內化療做 CNS 預防</b>（<span class="drug">methotrexate</span> 或 <span class="drug">cytarabine</span>），再依 PCR 結果分流。',
      '<b>PCR 陰性</b>　·　可移植者 → <b>自體造血幹細胞移植（autologous HCT）</b>；不可移植者 → <span class="drug">arsenic trioxide</span> 鞏固（<b>共 6 個循環</b>）。',
      '<b>PCR 陽性</b>　·　可移植者 → <b>配對手足或替代捐者之異體移植</b>；不可移植者 → <span class="rx">Clinical trial</span>。',
      '<span class="rx-h">未達緩解（no remission）</span>',
      '<span class="rx">Clinical trial</span>，或配對手足／替代捐者之<b>異體移植</b>。'
    ];
  }

  /* ---------- 主渲染 ---------- */
  function amRender() {
    var s = amSt;

    amShow('am_nonm3', s.dx === 'nonm3');
    amShow('am_apl', s.dx === 'apl');
    amShow('am_other', s.dx === 'other');

    // non-M3 步驟顯示條件（連接線與其後之步驟同條件）
    var fit = (s.dx === 'nonm3' && s.fit === 'fit');
    amShow('am_c3', fit); amShow('am_s3', fit);
    var denovo = fit && s.bg === 'denovo';
    amShow('am_c4', denovo); amShow('am_s4', denovo);
    var needInd = denovo && s.flt3 === 'neg';
    amShow('am_c5', needInd); amShow('am_s5', needInd);
    var showResp = denovo && (s.flt3 === 'pos' || (s.flt3 === 'neg' && !!s.ind));
    amShow('am_c6', showResp); amShow('am_s6', showResp);
    var showRisk = showResp && s.resp === 'cr';
    amShow('am_c7', showRisk); amShow('am_s7', showRisk);
    var unfit = (s.dx === 'nonm3' && s.fit === 'unfit');
    amShow('am_c8', unfit); amShow('am_s8', unfit);

    // APL 步驟顯示條件
    var aplNew = (s.dx === 'apl' && s.aplphase === 'new');
    amShow('am_c11', aplNew); amShow('am_s11', aplNew);
    var aplRel = (s.dx === 'apl' && s.aplphase === 'relapse');
    amShow('am_c12', aplRel); amShow('am_s12', aplRel);

    renderNonM3();
    renderApl();
    renderOther();
  }

  function renderNonM3() {
    var s = amSt;
    if (s.dx !== 'nonm3') return;
    var R = 'am_nonm3_rec', F = 'am_nonm3_fu';

    if (!s.fit) { idleRec(R, F, '請選擇步驟 2（是否適合積極化療）'); return; }

    /* ---- 不適合化療：AML-8 → AML-9 ---- */
    if (s.fit === 'unfit') {
      if (!s.ufresp) {
        result(R, F, 'rec-nonop', 'AML-8：不適合積極誘導化療（或病人拒絕）之誘導治療',
          unfitInduction(),
          'AML-8：<sup>*</sup> venetoclax 之使用期間可依治療反應與風險分層調整。' + reimburseNote +
          ' 完成誘導後依骨髓恢復後之反應決定後續（見下方步驟 4）。', null);
        return;
      }
      if (s.ufresp === 'cr') {
        result(R, F, 'rec-elective', 'AML-9：完全緩解 → 後續治療（並列選項）', [
          '<b>allo-HSCT</b>（Allogeneic HCT）',
          '<span class="drug">Cytarabine</span> 100–200 mg/m²/d × 5–7 天 × 1–2 個循環 ± 蒽環類（<span class="drug">idarubicin</span> 或 <span class="drug">daunorubicin</span>）',
          '<span class="drug">Cytarabine</span> 1–1.5 g/m²/d × 4–6 劑 × 1–2 個循環 —— 限<b>體能良好、腎功能正常、且屬 better-risk／正常核型併良好分子標記</b>者',
          '<span class="drug">Venetoclax</span> qd PO ＋ <span class="drug">azacitidine</span> 75 mg/m² SC/IV（每 28 天循環之 d1–7）',
          '<span class="drug">Venetoclax</span> qd PO（100 mg d1、200 mg d2、400 mg d3 起）＋ <span class="drug">decitabine</span> 20 mg/m² IV（每 28 天循環之 d1–5）',
          '<span class="drug">Venetoclax</span> qd PO ＋ <b>低劑量</b> <span class="drug">cytarabine</span> 20 mg/m²/d SC（每 28 天循環之 d1–10）',
          '<span class="rx">CLIA</span>（<span class="drug">cladribine</span>＋<span class="drug">idarubicin</span>＋<span class="drug">cytarabine</span>）＋ <span class="drug">venetoclax</span>',
          '<span class="drug">Cytarabine</span> 1–1.5 g/m²/d 輸注 3 小時 q12h 於 d1、3、5 ＋ 口服 <span class="drug">midostaurin</span> 50 mg q12h 於 d8–21',
          '<span class="drug">CC-486</span>（口服 azacitidine）',
          '以 <b>HMA</b> 每 4–6 週維持治療直至疾病進展',
          '觀察 Observation'
        ], 'AML-9：以上為並列選項，本指引未指定首選。' + reimburseNote, 'remission');
        return;
      }
      result(R, F, 'rec-urgent', 'AML-9：誘導失敗 → 挽救治療或支持治療', [
        '<span class="rx">Clinical trials</span>（臨床試驗）',
        '最佳支持治療 Best supportive care',
        '以 <span class="rx">HDAC4-6</span>（Ara-C 1.5–3 g/m² BID 共 4–6 劑）再誘導',
        '<b>減低強度前處置之異體移植（reduced-intensity allo-HSCT）</b>',
        '以 <span class="drug">venetoclax</span> 為基礎之處方',
        '其他挽救處方 Other salvage regimens'
      ], 'AML-9。' + reimburseNote, 'palliative');
      return;
    }

    /* ---- 適合化療 ---- */
    if (!s.bg) { idleRec(R, F, '請選擇步驟 3（疾病背景）'); return; }

    if (s.bg === 'secondary') {
      result(R, F, 'rec-nonop', 'AML-2：續發性／治療相關／MDS 相關或高風險 AML 之誘導治療', [
        '<span class="rx">Clinical trial</span>（臨床試驗）',
        '以 <span class="rx">FLAG</span> 為基礎 ＋ <span class="drug">venetoclax</span>',
        '以 <span class="drug">Ara-C</span>／蒽環類為基礎之誘導',
        '以 <span class="drug">Ara-C</span>／蒽環類為基礎之誘導，之後接 <b>allo-HSCT</b>（手足或替代捐者）',
        '<b>allo-HSCT</b>（手足或替代捐者）',
        '<span class="rx">CLIA</span>（<span class="drug">cladribine</span>＋<span class="drug">idarubicin</span>＋<span class="drug">cytarabine</span>）＋ <span class="drug">venetoclax</span>',
        '<b>低劑量</b> <span class="drug">cytarabine</span> ＋ <span class="drug">venetoclax</span>',
        '去甲基化藥物 <span class="rx">HMA</span> ＋ <span class="drug">venetoclax</span>',
        '低強度治療（尤其 <span class="rx">HMA</span>）',
        '<span class="drug">CPX-351</span>'
      ], 'AML-2：本組為<b>有前驅血液疾病、治療相關、具 MDS 相關基因或細胞遺傳學、或 poor-risk（<i>TP53</i>、17p−）</b>之 AML；上列為並列選項，本指引未指定首選。' +
         hsctLine() + ' ' + reimburseNote, 'induction');
      return;
    }

    // de novo
    if (!s.flt3) { idleRec(R, F, '請選擇步驟 4（<i>FLT3</i> 突變與否）'); return; }

    // FLT3 突變 → AML-3 右分支 → AML-6
    if (s.flt3 === 'pos') {
      if (!s.resp) {
        result(R, F, 'rec-elective', 'AML-3：<i>FLT3</i> 突變（ITD／TKD）之誘導治療', [
          '<span class="rx">Clinical trial</span>（臨床試驗）',
          '<span class="rx">3+7</span> 誘導 ＋ <span class="drug">midostaurin</span> 50 mg q12H（ITD 或 TKD）；或 ＋ <span class="drug">quizartinib</span> 40 mg（<b>僅 ITD</b>）於 <b>d8–21</b>',
          '無法耐受者先給<b>低強度治療</b>，待可耐受再補 <span class="rx">3+7</span> ± <span class="drug">midostaurin</span> 50 mg q12H'
        ], 'AML-3（Yes 分支）→ 依 AML-6 於 D+14–21 做骨髓追蹤。' + regimenNote, 'induction');
        return;
      }
      if (s.resp === 'fail') {
        result(R, F, 'rec-urgent', 'AML-6：<i>FLT3</i> 突變 AML 誘導失敗', [
          '以 <span class="rx">3+7</span> ＋ <span class="drug">midostaurin</span> 50 mg q12H（ITD 或 TKD）或 <span class="drug">quizartinib</span> 40 mg（僅 ITD）d8–21，或其他處方再誘導，之後<b>盡可能接 allo-HSCT</b>（手足或替代捐者）',
          '<b>allo-HSCT</b>（手足或替代捐者）',
          '<span class="rx">Clinical trials</span>／研究用藥',
          '<span class="drug">Gilteritinib</span> 單方或以其為基礎之處方',
          '最佳支持治療 Best supportive care'
        ], 'AML-6。' + reimburseNote, 'palliative');
        return;
      }
      // resp === 'cr'
      renderConsolidation(R, F);
      return;
    }

    // FLT3 未突變 → AML-3 左分支（兩組並列）
    if (!s.ind) {
      result(R, F, 'rec-elective', 'AML-3：<i>FLT3</i> 未突變之誘導治療（兩組處方並列，請於步驟 5 選擇）', [
        '<span class="rx-h">A 組 · 3+7／非 HDAC（→ AML-4，D+14–21 評估）</span>',
        '<span class="rx">Clinical trial</span>（臨床試驗）',
        '<span class="rx">3+7</span> 誘導',
        '<span class="drug">Mylotarg</span> ＋ <span class="rx">I3A7</span> 用於 <b>CBF 白血病</b>',
        '無法耐受者先給<b>低強度治療</b>，待可耐受再補 <span class="rx">I3A7</span>',
        '<span class="rx-h">B 組 · 高劑量 Ara-C 為基礎（→ AML-5，D+21–28 評估）</span>',
        '以 <span class="rx">IDAC／HDAC</span> ＋ 蒽環類誘導',
        '<span class="rx">FLAG</span> ± 蒽環類'
      ], 'AML-3（No 分支）：A、B 兩組在指引中以「or」並列，本指引未指定首選；<b>兩組之後續骨髓評估時點與挽救處方不同</b>，故請於步驟 5 選定。' + regimenNote, null);
      return;
    }

    if (!s.resp) {
      var isStd = (s.ind === 'std');
      result(R, F, 'rec-elective',
        isStd ? 'AML-3 A 組：3+7／非 HDAC 誘導' : 'AML-3 B 組：IDAC／HDAC + 蒽環類 或 FLAG ± 蒽環類',
        isStd ? [
          '<span class="rx">Clinical trial</span>（臨床試驗）',
          '<span class="rx">3+7</span> 誘導（蒽環類 D+1–3 ＋ Ara-C 100 mg/m² D+1–7）',
          '<span class="drug">Mylotarg</span> ＋ <span class="rx">I3A7</span> 用於 <b>CBF 白血病</b>',
          '無法耐受者先給<b>低強度治療</b>，待可耐受再補 <span class="rx">I3A7</span>'
        ] : [
          '以 <span class="rx">IDAC／HDAC</span> ＋ 蒽環類誘導（Ara-C 1,000–3,000 mg/m² q12H × 3 天 ＋ daunorubicin 60 mg/m² 或 idarubicin 12 mg/m²，1–3 天）',
          '<span class="rx">FLAG</span> ± 蒽環類'
        ],
        (isStd ? 'AML-3 → AML-4：於 <b>D+14–21</b> 做骨髓追蹤。' : 'AML-3 → AML-5：於 <b>D+21–28</b> 做骨髓追蹤。') + regimenNote,
        'induction');
      return;
    }

    if (s.resp === 'fail') {
      if (s.ind === 'std') {
        result(R, F, 'rec-urgent', 'AML-4：3+7／非 HDAC 誘導後之誘導失敗', [
          '以 <span class="rx">HDAC6-8</span> ± 蒽環類、或 <span class="rx">FLAG</span> ± 蒽環類、或其他處方再誘導，之後<b>盡可能接 allo-HSCT</b>（手足或替代捐者）',
          '<b>allo-HSCT</b>（手足或替代捐者）',
          '<span class="rx">Clinical trials</span>／研究用藥',
          '最佳支持治療 Best supportive care',
          '低強度處方 Low-intensity regimens',
          '以 <span class="drug">venetoclax</span> 為基礎之處方'
        ], 'AML-4。' + regimenNote, 'palliative');
      } else {
        result(R, F, 'rec-urgent', 'AML-5：HDAC 誘導後之誘導失敗', [
          '以 <span class="rx">FLAG</span> ± 蒽環類或其他處方再誘導，之後<b>盡可能接 allo-HSCT</b>（手足或替代捐者）',
          '<b>allo-HSCT</b>（手足或替代捐者）',
          '<span class="rx">Clinical trials</span>／研究用藥',
          '最佳支持治療 Best supportive care',
          '低強度處方 Low-intensity regimens',
          '以 <span class="drug">venetoclax</span> 為基礎之處方'
        ], 'AML-5。<b>與 AML-4 的差異：HDAC 誘導後之再誘導以 FLAG 為主，不再回頭用 HDAC6-8。</b>' + regimenNote, 'palliative');
      }
      return;
    }

    renderConsolidation(R, F);
  }

  function renderConsolidation(R, F) {
    var s = amSt;
    if (!s.risk) { idleRec(R, F, '完全緩解 → 請選擇步驟 7（ELN 遺傳學風險分組）'); return; }
    var titleMap = { fav: 'Favorable', int: 'Intermediate', adv: 'Adverse' };
    result(R, F, 'rec-elective',
      'AML-7：緩解後鞏固治療（' + titleMap[s.risk] + '）',
      consolidation(s.risk),
      'AML-7：以上為並列選項，本指引未指定首選。風險分組之定義見「風險分層」分頁（ELN 2022／AML-16；本指引另列 ELN 2017／AML-15）。' +
      hsctLine() + ' ' + regimenNote, 'remission');
  }

  /* ---------- APL ---------- */
  function renderApl() {
    var s = amSt;
    if (s.dx !== 'apl') return;
    var R = 'am_apl_rec', F = 'am_apl_fu';

    if (!s.aplphase) { idleRec(R, F, '請選擇步驟 2（病程階段）'); return; }

    if (s.aplphase === 'new') {
      if (!s.aplrisk) { idleRec(R, F, '請選擇步驟 3（APL 風險分層）'); return; }
      if (s.aplrisk === 'low') {
        result(R, F, 'rec-elective', 'AML-10：低風險 APL（WBC ≤10,000/µL）之誘導與鞏固', [
          '<span class="rx-h">誘導 · Preferred regimens</span>',
          '<span class="drug">ATRA</span> 45 mg/m²/d 分次服用 ＋ <span class="drug">arsenic trioxide</span>（ATO）0.15 mg/kg IV 每日（<b>category 1</b>）',
          '<span class="drug">ATRA</span> 45 mg/m²/d 分次服用 ＋ <span class="drug">ATO</span> 0.3 mg/kg IV 於第 1 週 d1–5，第 2–8 週改 0.25 mg/kg 每週兩次（<b>category 1</b>）',
          '<span class="drug">ATRA</span> 45 mg/m²/d 分次服用 ＋ <span class="drug">GO</span>（gemtuzumab ozogamicin，<b>台灣尚無該適應症</b>）6 或 9 mg/m² 於 d5',
          '<span class="rx-h">誘導 · Other recommended regimen（ATO 有禁忌時）</span>',
          '<span class="drug">ATRA</span> 45 mg/m²/d 分次服用 ＋ <span class="drug">idarubicin</span> 12 mg/m² 於 d2、4、6、8（<b>category 1</b>）',
          '<span class="rx-h">誘導後評估</span>',
          '於 <b>d28–35</b> 做骨髓抽吸與切片以確認形態緩解，再進入鞏固（ATRA＋ATO 組為「若有血球低下時」執行）；血球恢復後即進入鞏固。',
          '<span class="rx-h">鞏固 Consolidation（與誘導處方對應）</span>',
          '<span class="drug">ATO</span> 0.15 mg/kg/d IV 每週 5 天 × 4 週、每 8 週一循環，共 <b>4 個循環</b>；併 <span class="drug">ATRA</span> 45 mg/m²/d × 2 週、每 4 週一循環，共 <b>7 個循環</b>（<b>category 1</b>）',
          '<span class="drug">ATRA</span> 45 mg/m² × 2 週、每 4 週（或 2 週 on／2 週 off）於鞏固第 1–4 療程；併 <span class="drug">ATO</span> 0.3 mg/kg IV 於第 1 週 d1–5、第 2–4 週 0.25 mg/kg 每週兩次，均於鞏固第 1–4 療程（<b>category 1</b>）',
          '<span class="drug">ATRA</span> 45 mg/m²/d 分次服用於第 1–2、5–6、9–10、13–14、17–18、21–22、25–26 週；<span class="drug">GO</span>（<b>台灣尚無該適應症</b>）6 或 9 mg/m² 每月單次，直至分子緩解',
          '<span class="drug">ATRA</span> 45 mg/m² × 15 天 ＋ <span class="drug">idarubicin</span> 5 mg/m² × 4 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">mitoxantrone</span> 10 mg/m² × 3 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">idarubicin</span> 12 mg/m² × 1 天 × 1 循環（<b>category 1</b>）'
        ], 'AML-10。<b>鞏固處方須與所選之誘導處方對應</b>（指引以三條平行路徑呈現）。' + reimburseNote, 'apl_pcr');
        return;
      }
      if (s.aplrisk === 'high') {
        result(R, F, 'rec-elective', 'AML-11：高風險 APL（WBC >10,000/µL，無心臟問題）之誘導與鞏固', [
          '<span class="rx-h">誘導 · Preferred regimens</span>',
          '<span class="drug">ATRA</span> 45 mg/m²（d1–36，分次）＋ 依年齡調整之 <span class="drug">idarubicin</span> 6–12 mg/m² 於 d2、4、6、8 ＋ <span class="drug">ATO</span> 0.15 mg/kg（d9–36，2 小時 IV 輸注）',
          '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">ATO</span> 0.15 mg/kg/d IV ＋ 單劑 <span class="drug">GO</span>（<b>台灣尚無該適應症</b>）9 mg/m²，可於 d1、d2、d3 或 d4 給予',
          '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">ATO</span> 0.3 mg/kg IV 於第 1 週 d1–5、第 2–8 週 0.25 mg/kg 每週兩次（<b>category 1</b>）＋ 單劑 <span class="drug">GO</span>（<b>台灣尚無該適應症</b>）6 mg/m²，可於 d1、d2、d3 或 d4 給予',
          '<span class="rx-h">誘導 · Other recommended regimens</span>',
          '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">daunorubicin</span> 50 mg/m² × 4 天（IV d3–6）＋ <span class="drug">cytarabine</span> 200 mg/m² × 7 天（IV d3–9）',
          '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">daunorubicin</span> 60 mg/m² × 3 天 ＋ <span class="drug">cytarabine</span> 200 mg/m² × 7 天',
          '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">idarubicin</span> 12 mg/m² 於 d2、4、6、8',
          '<span class="rx-h">誘導後評估</span>',
          '於 <b>d28</b> 做骨髓抽吸與切片以確認緩解，並<b>考慮於進入鞏固前執行腰椎穿刺</b>。',
          '<span class="rx-h">鞏固 Consolidation（與誘導處方對應）</span>',
          '<span class="drug">ATRA</span> 45 mg/m² × 28 天 ＋ <span class="drug">ATO</span> 0.15 mg/kg/d × 28 天 × 1 循環 → <span class="drug">ATRA</span> 45 mg/m² × 7 天每 2 週 × 3 次 ＋ <span class="drug">ATO</span> 0.15 mg/kg/d × 5 天／週 × 5 週 × 1 循環',
          '<span class="drug">ATO</span> 0.15 mg/kg IV 每週 5 天 × 4 週、每 8 週一循環，共 4 個循環 ＋ <span class="drug">ATRA</span> 45 mg/m² × 2 週、每 4 週一循環，共 7 個循環。若因毒性停用 ATRA 或 ATO，可每 4–5 週給單劑 <span class="drug">GO</span> 9 mg/m²（<b>台灣尚無該適應症</b>），直至完全緩解後 28 週',
          '<span class="drug">ATRA</span> 45 mg/m² × 2 週每 4 週（或 2 週 on／2 週 off）於鞏固第 1–4 療程 ＋ <span class="drug">ATO</span> 0.3 mg/kg IV 第 1 週 d1–5、第 2–4 週 0.25 mg/kg 每週兩次，均於鞏固第 1–4 療程（<b>category 1</b>）。停藥時之 GO 補救同上',
          '<span class="drug">ATO</span> 0.15 mg/kg/d × 5 天／週 × 5 週、每 7 週一循環共 2 個循環 → <span class="drug">ATRA</span> 45 mg/m² × 7 天 ＋ <span class="drug">daunorubicin</span> 50 mg/m² × 3 天 × 2 個循環',
          '<span class="drug">Daunorubicin</span> 60 mg/m² × 3 天 ＋ <span class="drug">cytarabine</span> 200 mg/m² × 5–7 天 × 1 循環 → <span class="drug">cytarabine</span> 2 g/m²（<50 歲）或 1.5 g/m²（50–60 歲）q12h × 5 天 ＋ <span class="drug">daunorubicin</span> 45 mg/m² × 3 天 × 1 循環 ＋ <b>5 劑鞘內化療</b>',
          '<span class="drug">ATRA</span> 45 mg/m² × 15 天 ＋ <span class="drug">idarubicin</span> 5 mg/m² 與 <span class="drug">cytarabine</span> 1 g/m² × 4 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">mitoxantrone</span> 10 mg/m²/d × 5 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">idarubicin</span> 12 mg/m² × 1 天 ＋ <span class="drug">cytarabine</span> 150 mg/m² q8h × 4 天 × 1 循環'
        ], 'AML-11。<b>鞏固處方須與所選之誘導處方對應</b>。' + reimburseNote, 'apl_pcr');
        return;
      }
      // highcard
      result(R, F, 'rec-nonop', 'AML-12：高風險 APL（WBC >10,000/µL，有心臟問題）之誘導與鞏固', [
        '<span class="rx-h">誘導 · 低左心室射出分率（Low ejection fraction）</span>',
        '<span class="drug">ATRA</span> 45 mg/m²/d 分兩次 ＋ <span class="drug">ATO</span> 0.15 mg/kg IV 每日 ± 單劑 <span class="drug">GO</span> 9 mg/m²（<b>台灣尚無該適應症</b>）於 d1',
        '<span class="drug">ATRA</span> 45 mg/m²/d 分兩次 ＋ <span class="drug">ATO</span> 0.3 mg/kg IV 第 1 週 d1–5、第 2–8 週 0.25 mg/kg 每週兩次（<b>category 1</b>）＋ 單劑 <span class="drug">GO</span> 6 mg/m²（<b>台灣尚無該適應症</b>）於 d1',
        '<span class="rx-h">誘導 · QTc 延長（Prolonged QTc）</span>',
        '<span class="drug">ATRA</span> 45 mg/m²/d 分兩次 ＋ 單劑 <span class="drug">GO</span> 9 mg/m²（<b>台灣尚無該適應症</b>）於 d1',
        '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">daunorubicin</span> 60 mg/m² × 3 天 ＋ <span class="drug">cytarabine</span> 200 mg/m² × 7 天',
        '<span class="drug">ATRA</span> 45 mg/m² 分次 ＋ <span class="drug">idarubicin</span> 12 mg/m² 於 d2、4、6、8（<b>>70 歲者改 d2、4、6</b>）',
        '<span class="rx-h">誘導後評估</span>',
        '於 <b>d28</b> 做骨髓抽吸與切片以確認緩解後，再進入鞏固。',
        '<span class="rx-h">鞏固 Consolidation（與誘導處方對應）</span>',
        '<span class="drug">ATO</span> 0.15 mg/kg IV 每週 5 天 × 4 週、每 8 週一循環共 4 個循環 ＋ <span class="drug">ATRA</span> 45 mg/m² 分次 × 2 週、每 4 週一循環共 7 個循環。因毒性停用 ATRA 或 ATO 時，可每 4–5 週給單劑 <span class="drug">GO</span> 9 mg/m²（<b>台灣尚無該適應症</b>），直至完全緩解後 28 週',
        '<span class="drug">ATRA</span> 45 mg/m² 分次 × 2 週每 4 週（或 2 週 on／2 週 off）於鞏固第 1–4 療程 ＋ <span class="drug">ATO</span> 0.3 mg/kg IV 第 1 週 d1–5、第 2–4 週 0.25 mg/kg 每週兩次，均於鞏固第 1–4 療程（<b>category 1</b>）。停藥時之 GO 補救同上',
        '<span class="drug">ATRA</span> 45 mg/m² 分次於第 1–2、5–6、9–10、13–14、17–18、21–22、25–26 週；<span class="drug">GO</span> 9 mg/m²（<b>台灣尚無該適應症</b>）每月單劑，直至完全緩解後 28 週',
        '<span class="drug">Daunorubicin</span> 60 mg/m² × 3 天 ＋ <span class="drug">cytarabine</span> 200 mg/m² × 7 天 × 1 循環 → <span class="drug">cytarabine</span> 2 g/m²（<50 歲）、1.5 g/m²（50–60 歲）q12h × 5 天，或 1 g/m²（>60 歲）q12h × 4 天 ＋ <span class="drug">daunorubicin</span> 45 mg/m² × 3 天 × 1 循環 ＋ <b>5 劑鞘內化療</b>',
        '<span class="drug">ATRA</span> 45 mg/m² × 15 天 ＋ <span class="drug">idarubicin</span> 5 mg/m² 與 <span class="drug">cytarabine</span> 1 g/m² × 4 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">mitoxantrone</span> 10 mg/m²/d × 5 天 × 1 循環 → <span class="drug">ATRA</span> × 15 天 ＋ <span class="drug">idarubicin</span> 12 mg/m² × 1 天 ＋ <span class="drug">cytarabine</span> 150 mg/m² q8h × 4 天 × 1 循環'
      ], 'AML-12：<b>心臟問題分兩型</b>——低射出分率者仍可用 ATO；QTc 延長者之首選為不含 ATO 之處方。<b>鞏固處方須與所選之誘導處方對應</b>。' + reimburseNote, 'apl_pcr');
      return;
    }

    // 復發
    if (!s.aplrel) { idleRec(R, F, '請選擇步驟 3（復發型態）'); return; }
    var relLead;
    if (s.aplrel === 'early_ato') {
      relLead = [
        '<span class="rx-h">復發之治療 Therapy for relapse</span>',
        '以<b>蒽環類為基礎之處方</b>（同「高風險、無心臟問題」所用者）；或 <span class="drug">GO</span>（<b>台灣尚無適應症</b>）。'
      ];
    } else if (s.aplrel === 'early_anthra') {
      relLead = [
        '<span class="rx-h">復發之治療 Therapy for relapse</span>',
        '<span class="drug">ATO</span> 0.15 mg/kg IV qd ± <span class="drug">ATRA</span> 45 mg/m²/d 分兩次 ± 單劑 <span class="drug">GO</span>（<b>台灣尚無該適應症</b>），直至血球恢復並經骨髓確認緩解。'
      ];
    } else {
      relLead = [
        '<span class="rx-h">復發之治療 Therapy for relapse</span>',
        '<span class="drug">ATO</span> 0.15 mg/kg IV qd ± <span class="drug">ATRA</span> 45 mg/m²/d 分兩次 ±（<b>蒽環類</b>或單劑 <span class="drug">GO</span>，<b>台灣尚無該適應症</b>），直至血球恢復並經骨髓確認緩解。'
      ];
    }
    var relTitle = { early_ato: 'AML-14：早期復發（<6 個月，前用 ATRA + ATO）',
                     early_anthra: 'AML-14：未曾用 ATO，或 ATRA + 蒽環類後之早期復發（<6 個月）',
                     late_ato: 'AML-14：晚期復發（≥6 個月，前用含 ATO 處方）' }[s.aplrel];
    result(R, F, 'rec-nonop', relTitle, relLead.concat(aplRelapseDownstream()),
      'AML-14。<b>三種復發型態的「復發治療」不同，但下游（CNS 預防 → PCR → 是否可移植）完全相同。</b>' +
      '分子復發（PCR 連續兩次陽性）亦按第一次復發處理（AML-13）。' + reimburseNote, 'palliative');
  }

  /* ---------- 非 AML ---------- */
  function renderOther() {
    if (amSt.dx !== 'other') return;
    ulRec('am_other_rec', 'rec-idle', '本指引之化療章節未涵蓋此類白血病', [
      '<b>ALL</b>、<b>混合表型急性白血病（MPAL）</b>、<b>混合或未定型系列之急性白血病</b>、<b>骨髓分化不良症候群／腫瘤（MDS）</b>於 AML-1 分流後即離開本指引，<b>台大血癌診療指引版次 15 未載其治療流程</b>。',
      '本指引中與這些疾病相關者<b>僅有放射治療章節</b>：<br>· <b>全身照射（TBI）</b>——<b>ALL</b>：費城染色體陽性之第一次緩解；費城染色體陰性但具高風險特徵之第一次緩解；初始誘導難治；復發治療後再緩解；任何治療後難治。<b>CML</b>：末期之快速進展或芽細胞危象。<br>· <b>顱部照射</b>——高風險 ALL 之 CNS 預防（<b>兒童 ALL 可省略預防性顱部照射</b>）；復發／難治之 CNS 白血病。',
      '<b>不要以本頁的 AML 流程套用於這些疾病。</b>請改依各該疾病之專屬指引（ALL 另見 NCCN ALL；淋巴癌另見台大淋巴癌診療指引）。'
    ], 'AML-1：分流後之四個出口中，僅 AML（non-M3 與 M3）續留本指引。放射治療內容出自本院「Leukemia Radiation Therapy Guidelines v1.0」（2025/09）。');
    renderFollowup('am_apl_fu', null);
  }

  /* ---------- 事件 ---------- */
  function amPick(key, val, btn) {
    amSel(btn);
    var s = amSt;
    if (key === 'dx') {
      s.dx = val;
      s.fit = s.bg = s.flt3 = s.ind = s.resp = s.risk = s.ufresp = null;
      s.aplphase = s.aplrisk = s.aplrel = null;
      amClearSel(['am_s2', 'am_s3', 'am_s4', 'am_s5', 'am_s6', 'am_s7', 'am_s8',
        'am_s10', 'am_s11', 'am_s12']);
    } else if (key === 'fit') {
      s.fit = val; s.bg = s.flt3 = s.ind = s.resp = s.risk = s.ufresp = null;
      amClearSel(['am_s3', 'am_s4', 'am_s5', 'am_s6', 'am_s7', 'am_s8']);
    } else if (key === 'bg') {
      s.bg = val; s.flt3 = s.ind = s.resp = s.risk = null;
      amClearSel(['am_s4', 'am_s5', 'am_s6', 'am_s7']);
    } else if (key === 'flt3') {
      s.flt3 = val; s.ind = s.resp = s.risk = null;
      amClearSel(['am_s5', 'am_s6', 'am_s7']);
    } else if (key === 'ind') {
      s.ind = val; s.resp = s.risk = null;
      amClearSel(['am_s6', 'am_s7']);
    } else if (key === 'resp') {
      s.resp = val; s.risk = null;
      amClearSel(['am_s7']);
    } else if (key === 'risk') {
      s.risk = val;
    } else if (key === 'ufresp') {
      s.ufresp = val;
    } else if (key === 'aplphase') {
      s.aplphase = val; s.aplrisk = s.aplrel = null;
      amClearSel(['am_s11', 'am_s12']);
    } else if (key === 'aplrisk') {
      s.aplrisk = val;
    } else if (key === 'aplrel') {
      s.aplrel = val;
    }
    amRender();
  }

  function amReset() {
    for (var k in amSt) { if (amSt.hasOwnProperty(k)) amSt[k] = null; }
    var root = document.getElementById('amPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    ['am_nonm3_fu', 'am_apl_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    amRender();
  }

  function initAmlPathway() { amReset(); }

  // 匯出
  global.amlPathwayHTML = amlPathwayHTML;
  global.initAmlPathway = initAmlPathway;
  global.amPick = amPick;
  global.amReset = amReset;
})(window);
