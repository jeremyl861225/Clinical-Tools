/* ============================================================
   胃癌治療互動決策流程 Gastric Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胃癌診療指引 V.1 2026
   （NTUH Gastric Cancer Guidelines in Oncology, AGC-1 ～ AGC-5）
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var gcSt = {
    scope: null,     // loco | m1
    fit: null,       // fit_res | fit_unres | unfit
    strat: null,     // esd | upfront | periop
    esdcur: null,    // esd_cur | esd_noncur
    rstatus: null,   // R0 | R1 | R2
    pstage: null,    // p_early | p_adj
    restage: null    // ccr | residual（fit_unres 化療後再分期）
  };

  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="gcPick(\'' + key + '\',\'' + val + '\',this)">' +
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
  function gastricPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院胃癌診療指引 V.1 2026</b>（NTUH，AGC-1～AGC-5）之互動決策流程。逐步點選以取得對應建議處置、藥物療程與追蹤方式。</p>';
    h += '<div class="onc-path" id="gcPath">';

    // Step 1 — 疾病範圍：局限性 / 轉移性
    h += step('gc_s1', '1', '疾病範圍（初始分期）',
      opt('scope', 'loco', '侷限性 Locoregional（M0）', '無遠處轉移') +
      opt('scope', 'm1', '轉移性 Metastatic（M1）', '遠處轉移（含腹膜、遠處淋巴結、腹水細胞學陽性）'));

    /* ===================== M0 侷限性 ===================== */
    h += '<div id="gc_loco" class="hidden">';
    h += conn('gc_c2');
    h += step('gc_s2', '2', '醫療適合度與可切除性',
      opt('fit', 'fit_res', '可耐受手術 · 潛在可切除', 'Medically fit，potentially resectable') +
      opt('fit', 'fit_unres', '可耐受手術 · 不可切除（M0）', '腹膜擴散／血管包覆／無法完整切除') +
      opt('fit', 'unfit', '無法耐受大手術', 'Medically unfit for major surgery'),
      '<div class="note">考慮根治手術前，建議先做 <b>腹腔鏡 + 腹腔沖洗細胞學</b>（laparoscopy with cytology）評估腹膜擴散。</div>');

    // resectable 子流程
    h += '<div id="gc_res" class="hidden">';
    h += conn('gc_c3');
    h += step('gc_s3', '3', '臨床分期 → 治療策略',
      opt('strat', 'esd', '內視鏡切除 ESD', 'cT1a，符合任一：①分化型、無潰瘍（不限大小）；②分化型、有潰瘍且 ≤3cm；③未分化型、無潰瘍且 ≤2cm') +
      opt('strat', 'upfront', '直接根治性手術', '可切除、非 bulky（cT1b–cT3、N0–N+）') +
      opt('strat', 'periop', '圍手術期化療 → 手術', 'cT4N+ 或 bulky nodes（borderline resectable）'));

    h += connH('gc_c3b');
    h += step('gc_s3b', '3b', 'ESD 術後病理是否為治癒性切除？',
      opt('esdcur', 'esd_cur', '治癒性（curative）', '切緣陰性、LVI(−)、submucosal 侵犯 <500µm') +
      opt('esdcur', 'esd_noncur', '非治癒性（non-curative）', '切緣陽性、LVI(+) 或深部侵犯 ≥500µm'));
    h = h.replace('id="gc_s3b"', 'id="gc_s3b" class="hidden"');

    h += connH('gc_c4');
    h += step('gc_s4', '4', '手術切除結果（R status）',
      opt('rstatus', 'R0', 'R0 切除', '無殘存腫瘤') +
      opt('rstatus', 'R1', 'R1 切除', '顯微鏡下殘存（microscopic）') +
      opt('rstatus', 'R2', 'R2 切除', '肉眼可見殘存（gross residual）'));
    h = h.replace('id="gc_s4"', 'id="gc_s4" class="hidden"');

    h += connH('gc_c4b');
    h += step('gc_s4b', '4b', 'R0 病理分期（決定術後輔助化療）',
      opt('pstage', 'p_early', 'pT1N0 或 pT2N0', '早期、淋巴結陰性') +
      opt('pstage', 'p_adj', 'pT3、pT4 或 任何 T、N+', '侵犯較深或淋巴結轉移'));
    h = h.replace('id="gc_s4b"', 'id="gc_s4b" class="hidden"');

    h += '</div>'; // gc_res

    h += rec('gc_loco_rec', '建議處置 · 侷限性 Locoregional');

    // 不可切除（fit）化療後再分期（AGC-3, 2 of 2）— 置於建議處置之後
    h += connH('gc_c_restage');
    h += step('gc_s_restage', '3', '化療後再分期反應（AGC-3, 2 of 2）',
      opt('restage', 'ccr', '臨床完全緩解（cCR）或大幅反應', 'clinical CR / major response') +
      opt('restage', 'residual', '殘存病灶／局部或遠處轉移', 'residual, locoregional and/or distant'));
    h = h.replace('id="gc_s_restage"', 'id="gc_s_restage" class="hidden"');

    h += '<div class="flow-fu hidden" id="gc_loco_fu"></div>';
    h += '</div>'; // gc_loco

    /* ===================== M1 轉移性 ===================== */
    h += '<div id="gc_meta" class="hidden">';
    h += conn('gc_mc2');
    h += rec('gc_meta_rec', '建議處置 · 轉移性 Systemic');
    h += '<div class="flow-fu hidden" id="gc_meta_fu"></div>';
    h += '</div>'; // gc_meta

    h += '<div class="flow-reset" style="display:flex; justify-content:flex-end;">' +
      '<button class="btn-reset" onclick="gcReset()">重置</button></div>';
    h += '</div>'; // gcPath
    return h;
  }

  /* ---------- 互動 helpers ---------- */
  function gcSel(btn) {
    var g = btn.parentNode;
    g.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function gcShow(id, on) { var el = document.getElementById(id); if (el) el.classList.toggle('hidden', !on); }
  function gcClearSel(ids) {
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

  /* ---------- 追蹤區塊（AGC-4）---------- */
  function renderFollowup(fuId, type) {
    var el = document.getElementById(fuId);
    if (!el) return;
    if (!type) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var h;
    if (type === 'curative') {
      h = '<div class="fu-label">追蹤與監測 Follow-up（AGC-4）</div><ul class="fu-list">' +
        '<li>病史＋理學檢查（Hx &amp; P.E.）：前 3 年每 3–4 個月，之後每 4–6 個月。</li>' +
        '<li>CBC、血小板、生化（BCS）：視臨床需要。</li>' +
        '<li>影像學（Chest／Abd＋Pelvis CT）或內視鏡：視臨床需要。</li>' +
        '<li>CEA：每 3–6 個月（尤其初始即升高者）。</li>' +
        '<li>維生素 B12：近端／全胃切除者每 6–12 個月監測；連續兩次正常可停止例行監測。</li>' +
        '<li>復發時 → salvage 系統性治療（見系統性治療）或臨床試驗。</li>' +
        '</ul>';
    } else { // palliative / supportive
      h = '<div class="fu-label">追蹤與支持治療 Follow-up / Supportive care</div><ul class="fu-list">' +
        '<li>定期評估治療反應與毒性（影像／內視鏡視需要）；持續追蹤體能狀態。</li>' +
        '<li>CEA、CBC、生化視臨床需要監測；近端／全胃切除者監測維生素 B12。</li>' +
        '<li>疾病進展 → 次線／後線系統性治療或臨床試驗。</li>' +
        '<li>支持治療模式：<b>阻塞</b>—stent／雷射／光動力／RT／手術；<b>營養</b>—腸道營養、營養諮詢；<b>疼痛</b>—RT 及／或藥物；<b>出血</b>—RT／內視鏡治療／經動脈栓塞。</li>' +
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

  /* ---------- 系統性治療（1st/2nd/3rd line）詳述 ---------- */
  function kpsDetailsHtml() {
    var rows = [
      ['100%', 'Normal, no complaints, no signs of disease'],
      ['90%', 'Capable of normal activity, few symptoms or signs of disease'],
      ['80%', 'Normal activity with some difficulty, some symptoms or signs'],
      ['70%', 'Caring for self, not capable of normal activity or work'],
      ['60%', 'Requiring some help, can take care of most personal requirements'],
      ['50%', 'Requires help often, requires frequent medical care'],
      ['40%', 'Disabled, requires special care and help'],
      ['30%', 'Severely disabled, hospital admission indicated but no risk of death'],
      ['20%', 'Very ill, urgently requiring admission, requires supportive measures or treatment'],
      ['10%', 'Moribund, rapidly progressive fatal disease processes'],
      ['0%', 'Death']
    ];
    var t = '<details class="kps-details"><summary>Karnofsky Performance Status（KPS）分級表 ▸</summary><table>';
    rows.forEach(function (r) { t += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    t += '</table></details>';
    return t;
  }

  var systemicNote =
    'HER2+ 定義：IHC 3+ 或 IHC 2+ 且 ISH(+)。PD-L1：nivolumab 用 CPS ≥5（Dako 28-8）、pembrolizumab CPS ≥1（Dako 22C3）。CLDN18.2+：2+/3+ 膜染色 ≥75% 存活腫瘤細胞。ramucirumab／paclitaxel／T-DXd／後線 PD-1 抑制劑健保多未給付，需自費；durvalumab+FLOT 僅美國 FDA 核准。';

  function systemicLines() {
    return [
      '<span class="rx-h">化療骨架 Backbone</span><br>體能良好 → 含鉑雙合一 <span class="rx">FOLFOX</span>／<span class="rx">CAPOX</span>／<span class="rx">FP</span>（<span class="drug">cisplatin</span> 或 <span class="drug">oxaliplatin</span> ＋ <span class="drug">5-FU</span>／<span class="drug">capecitabine</span>／<span class="drug">S-1</span>）；體能不佳（KPS ≤50／ECOG 3）→ <span class="rx">HDFL</span>（週 24hr <span class="drug">5-FU</span> 2,000–2,600 mg/m²＋<span class="drug">leucovorin</span> 300 mg/m²）或 5-FU/LV。' + kpsDetailsHtml(),
      '<span class="rx-h">一線 1st line</span>　<span class="rx-sub">依 HER2／PD-L1／MMR-MSI／CLDN18.2 加成</span><ul>' +
        '<li><b>HER2+</b>：＋<span class="drug">trastuzumab</span>（ToGA）；CPS ≥1 再加 <span class="drug">pembrolizumab</span>（KEYNOTE-811）。</li>' +
        '<li><b>HER2− · PD-L1 CPS ≥5</b>：＋<span class="drug">nivolumab</span>（CheckMate 649，健保給付）；CPS ≥1：＋<span class="drug">pembrolizumab</span>（KEYNOTE-859）。</li>' +
        '<li><b>dMMR／MSI-H</b>：＋<span class="drug">nivolumab</span> 或 <span class="drug">pembrolizumab</span>（不分線別）。</li>' +
        '<li><b>CLDN18.2+</b>：＋<span class="drug">zolbetuximab</span>（SPOTLIGHT／GLOW，健保 115/04/01 起給付 HER2−）。</li>' +
        '</ul>',
      '<span class="rx-h">二線 2nd line</span><br><span class="drug">docetaxel</span>（COUGAR-02）；<span class="drug">ramucirumab</span> ± <span class="drug">paclitaxel</span>（RAINBOW）；HER2+ 可用 <span class="drug">trastuzumab deruxtecan</span>（T-DXd）。',
      '<span class="rx-h">三線後 3rd line+</span><br><span class="drug">trifluridine/tipiracil</span>（TAGS）；<span class="drug">nivolumab</span>（ATTRACTION-2）；<span class="drug">pembrolizumab</span>（CPS ≥1 或 MSI-H／dMMR）；臨床試驗。'
    ];
  }

  /* ---------- 主渲染 ---------- */
  function gcRender() {
    var s = gcSt;

    gcShow('gc_loco', s.scope === 'loco');
    gcShow('gc_c2', s.scope === 'loco');
    gcShow('gc_meta', s.scope === 'm1');
    gcShow('gc_mc2', s.scope === 'm1');

    // M0
    var res = (s.fit === 'fit_res');
    gcShow('gc_res', res);
    gcShow('gc_c3', res);
    var esd = res && s.strat === 'esd';
    gcShow('gc_c3b', esd);
    gcShow('gc_s3b', esd);
    var surgical = (s.strat === 'upfront' || s.strat === 'periop');
    var esdNoncur = (s.strat === 'esd' && s.esdcur === 'esd_noncur');
    var showR = res && (surgical || esdNoncur);
    gcShow('gc_c4', showR);
    gcShow('gc_s4', showR);
    var showPs = showR && s.rstatus === 'R0';
    gcShow('gc_c4b', showPs);
    gcShow('gc_s4b', showPs);
    var unres = (s.fit === 'fit_unres');
    gcShow('gc_c_restage', unres);
    gcShow('gc_s_restage', unres);
    renderLocoRec();

    // M1
    renderMetaRec();
  }

  function renderLocoRec() {
    var s = gcSt;
    if (s.scope !== 'loco') return;
    var R = 'gc_loco_rec', F = 'gc_loco_fu';

    if (!s.fit) { idleRec(R, F, '請選擇步驟 2（醫療適合度）'); return; }

    // 可耐受手術但不可切除 → 系統性化療 → 再分期
    if (s.fit === 'fit_unres') {
      if (!s.restage) {
        result(R, F, 'rec-nonop', '不可切除（M0）：系統性化療 → 再分期',
          systemicLines(), systemicNote + ' 完成化療後依再分期反應決定後續（見下方步驟 3）。', 'palliative');
      } else if (s.restage === 'ccr') {
        result(R, F, 'rec-elective', '化療後 cCR／大幅反應 → 手術（若適合）',
          systemicLines().concat(['<b>再分期：臨床完全緩解（cCR）或大幅反應</b> → 若技術可行且體能允許，接受根治性手術（curative intent）；cCR 者亦可選擇密切追蹤（AGC-4）。']),
          systemicNote, 'curative');
      } else {
        result(R, F, 'rec-nonop', '化療後殘存／轉移 → Salvage therapy',
          systemicLines().concat(['<b>再分期：殘存病灶／局部或遠處轉移</b> → 接續 salvage 系統性治療（如上）或臨床試驗；必要時局部治療（RT）。']),
          systemicNote, 'palliative');
      }
      return;
    }

    // 無法耐受大手術 → 系統性化療 或 BSC
    if (s.fit === 'unfit') {
      result(R, F, 'rec-nonop', '無法耐受手術：系統性化療 或 最佳支持治療',
        systemicLines().concat(['體能極差（KPS ≤50／ECOG 3）→ 最佳支持治療（BSC）／安寧療護。']),
        systemicNote, 'palliative');
      return;
    }

    // 可耐受手術、可切除
    if (!s.strat) { idleRec(R, F, '請選擇步驟 3（治療策略）'); return; }

    // ESD 分支
    if (s.strat === 'esd' && !s.esdcur) {
      result(R, F, 'rec-elective', '內視鏡黏膜下剝離（ESD）', [
        '<div class="cbx"><div class="cbx-h">適應症 Endoscopic resection with curative intent　' +
          '<span class="cbx-sub">符合任一即可</span></div><div class="cbx-items">' +
          '<span class="cb"><span class="cb-k">①</span>分化型、無潰瘍（不限大小）</span>' +
          '<span class="cb"><span class="cb-k">②</span>分化型、有潰瘍且腫瘤 ≤3cm</span>' +
          '<span class="cb"><span class="cb-k">③</span>未分化型、無潰瘍且腫瘤 ≤2cm</span>' +
        '</div></div>',
        '完成後依病理判定是否為治癒性切除（見步驟 3b）。'
      ], 'AGC-2：cT1 符合條件者可考慮 ESD。', null);
      return;
    }
    if (s.esdcur === 'esd_cur') {
      result(R, F, 'rec-elective', 'ESD 治癒性切除 → 觀察追蹤', [
        '切緣陰性、LVI(−)、submucosal 侵犯 <500µm → 視為治癒。',
        '定期內視鏡與影像追蹤（見下方追蹤）。'
      ], '', 'curative');
      return;
    }

    // 以下為切除後 R status：手術（upfront／periop）或 ESD 非治癒性追加手術共用
    var esdNoncur = (s.strat === 'esd' && s.esdcur === 'esd_noncur');

    if (!s.rstatus) {
      var lead = [];
      if (esdNoncur) {
        lead.push('ESD 非治癒性 → <b>追加胃切除 + 淋巴結廓清（D2）</b>（首選）；或 repeat ESD／密切觀察（依風險、共病與病人意願）。');
        lead.push('追加手術後依切除結果（R status）決定後續（見下方步驟 4）。');
        result(R, F, 'rec-nonop', 'ESD 非治癒性 → 追加胃切除 + D2', lead,
          'AGC-2：non-curative ESD → surgical resection／repeat ESD／close observation。', null);
        return;
      }
      if (s.strat === 'periop')
        lead.push('<b>術前</b>：三合一化療 <span class="rx">FLOT</span>（<span class="drug">5-FU</span>＋<span class="drug">leucovorin</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">docetaxel</span>）或 <span class="rx">DOS</span>（<span class="drug">docetaxel</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">S-1</span>）；無法耐受三合一 → 鉑+fluoropyrimidine 雙合一。');
      lead.push('遠端癌：<b>次全胃切除</b>（首選）；近端／賁門癌：全胃或近端胃切除。');
      lead.push('<b>D2 廓清</b>（D0 不可接受）；建議切緣 >5cm；至少評估 <b>16 顆</b>淋巴結。');
      if (s.strat === 'periop') lead.push('術後接續完成圍手術期化療。');
      result(R, F, 'rec-elective',
        s.strat === 'periop' ? '圍手術期化療 → 根治性胃切除 + D2' : '根治性胃切除 + D2 廓清',
        lead,
        'AGC-2：D2 recommended、≥16 nodes；perioperative 三合一（FLOT／DOS）用於 cT4N+ 或 bulky N。durvalumab+FLOT 僅 US FDA 核准，TFDA 未核准。', null);
      return;
    }

    if (s.rstatus === 'R1') {
      result(R, F, 'rec-nonop', 'R1（顯微殘存）→ Salvage 化療 / 局部治療',
        ['顯微鏡下殘存 → 接續系統性 salvage 治療；必要時再切除或局部 RT。'].concat(systemicLines()),
        systemicNote, 'palliative');
      return;
    }
    if (s.rstatus === 'R2') {
      result(R, F, 'rec-urgent', 'R2（肉眼殘存）→ Salvage 化療 或 BSC',
        ['肉眼可見殘存 → 系統性治療（如下）；體能極差者最佳支持治療。'].concat(systemicLines()),
        systemicNote, 'palliative');
      return;
    }

    // R0
    if (!s.pstage) { idleRec(R, F, 'R0 → 請選擇步驟 4b（病理分期）'); return; }
    if (s.pstage === 'p_early') {
      result(R, F, 'rec-elective', 'R0 + pT1–2 N0 → 追蹤觀察', [
        '不需輔助化療；定期追蹤（見下方追蹤）。'
      ], '', 'curative');
    } else {
      result(R, F, 'rec-elective', 'R0 + pT3–4 或 N+ → 術後輔助化療', [
        '<span class="rx-h">最佳療程尚未確立</span>　<span class="rx-sub">Optimal regimen not established；可依病人狀況與醫病討論選擇</span>',
        '<span class="rx">S-1</span> 單方（ACTS-GC）。',
        '<span class="rx">HDFL</span>（週 24hr <span class="drug">5-FU</span> 2,000–2,600 mg/m²＋<span class="drug">leucovorin</span> 300 mg/m²）。',
        '<span class="rx">XELOX</span>（<span class="drug">capecitabine</span>＋<span class="drug">oxaliplatin</span>，CLASSIC）。',
        '<span class="rx">S-1 + docetaxel</span>（<span class="drug">S-1</span>＋<span class="drug">docetaxel</span>，JACCRO GC-07）— <b>pStage III 建議</b>。',
        '<span class="rx">SOX</span>（<span class="drug">S-1</span>＋<span class="drug">oxaliplatin</span>，ARTIST 2）— <b>pStage III 建議</b>。'
      ], 'AGC-5（1 of 3）：D2 切除後 pT3-4 或 pN+ → post-operative chemotherapy，最佳療程尚未確立。S-1+docetaxel 與 SOX 於 pStage III 之 3 年無復發存活優於 S-1 單方；惟 capecitabine／oxaliplatin／docetaxel 於 adjuvant 未納健保。', 'curative');
    }
  }

  function renderMetaRec() {
    var s = gcSt;
    if (s.scope !== 'm1') return;
    result('gc_meta_rec', 'gc_meta_fu', 'rec-elective', '轉移性（M1）：系統性治療',
      systemicLines(), systemicNote, 'palliative');
  }

  /* ---------- 事件 ---------- */
  function gcPick(key, val, btn) {
    gcSel(btn);
    var s = gcSt;
    if (key === 'scope') {
      s.scope = val;
      s.fit = s.strat = s.esdcur = s.rstatus = s.pstage = s.restage = null;
      gcClearSel(['gc_s2', 'gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b', 'gc_s_restage']);
    } else if (key === 'fit') {
      s.fit = val; s.strat = s.esdcur = s.rstatus = s.pstage = s.restage = null;
      gcClearSel(['gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b', 'gc_s_restage']);
    } else if (key === 'strat') {
      s.strat = val; s.esdcur = s.rstatus = s.pstage = null;
      gcClearSel(['gc_s3b', 'gc_s4', 'gc_s4b']);
    } else if (key === 'esdcur') { s.esdcur = val; }
    else if (key === 'rstatus') { s.rstatus = val; s.pstage = null; gcClearSel(['gc_s4b']); }
    else if (key === 'pstage') { s.pstage = val; }
    else if (key === 'restage') { s.restage = val; }
    gcRender();
  }

  function gcReset() {
    for (var k in gcSt) { if (gcSt.hasOwnProperty(k)) gcSt[k] = null; }
    var root = document.getElementById('gcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    // 隱藏追蹤區塊
    ['gc_loco_fu', 'gc_meta_fu'].forEach(function (id) {
      var el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    gcRender();
  }

  function initGastricPathway() { gcReset(); }

  // 匯出
  global.gastricPathwayHTML = gastricPathwayHTML;
  global.initGastricPathway = initGastricPathway;
  global.gcPick = gcPick;
  global.gcReset = gcReset;
})(window);
