/* ============================================================
   胃癌治療互動決策流程 Gastric Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 胃癌診療指引 V.1 2026
   （NTUH Gastric Cancer Guidelines in Oncology, AGC-1 ～ AGC-5）
   本模組為 cancer-staging.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var gcSt = {
    scope: null,               // loco | m1
    fit: null,                 // fit_res | fit_unres | unfit
    strat: null,               // esd | upfront | periop
    esdcur: null,              // esd_cur | esd_noncur
    rstatus: null,             // R0 | R1 | R2
    pstage: null,              // p_early | p_adj
    line: null,                // first | second | third
    her2: null,                // her2p | her2n
    cps: null,                 // cps1 | cpslt1
    bm: null,                  // pdl15 | pdl11 | dmmr | cldn | none
    ps: null                   // ps_good | ps_poor
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
  function rec(id, label) {
    return '<div class="flow-rec rec-idle" id="' + id + '"><div class="rec-label">' + label +
      '</div><div class="rec-title">請完成上方步驟</div></div>';
  }

  /* ---------- 版面 HTML ---------- */
  function gastricPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院胃癌診療指引 V.1 2026</b>（NTUH Gastric Cancer Guidelines, AGC-1～AGC-5）之互動決策流程。逐步點選以取得對應建議處置與藥物療程。</p>';

    h += '<div class="onc-path" id="gcPath">';

    // Step 1 — 疾病範圍
    h += step('gc_s1', '1', '疾病範圍（初始分期）',
      opt('scope', 'loco', '侷限性 Locoregional（M0）', '無遠處轉移') +
      opt('scope', 'm1', '轉移性／不可切除（M1 or unresectable）', '遠處轉移、腹膜擴散、腹水細胞學陽性，或無法完整切除'));

    /* ===================== M0 侷限性 ===================== */
    h += '<div id="gc_loco" class="hidden">';
    h += conn('gc_c2');
    h += step('gc_s2', '2', '醫療適合度與可切除性',
      opt('fit', 'fit_res', '可耐受手術 · 潛在可切除', 'Medically fit，potentially resectable') +
      opt('fit', 'fit_unres', '可耐受手術 · 不可切除（M0）', 'Fit 但腹膜擴散／血管包覆／無法完整切除') +
      opt('fit', 'unfit', '無法耐受大手術', 'Medically unfit for major surgery'),
      '<div class="note">考慮根治手術前，建議先做 <b>腹腔鏡 + 腹腔沖洗細胞學</b>（laparoscopy with cytology）評估腹膜擴散。</div>');

    // resectable 子流程
    h += '<div id="gc_res" class="hidden">';
    h += conn('gc_c3');
    h += step('gc_s3', '3', '臨床分期 → 治療策略',
      opt('strat', 'esd', '內視鏡切除候選 ESD', 'cT1a、分化良好、無潰瘍 ≤2cm（或有潰瘍 ≤3cm）；未分化無潰瘍 ≤2cm') +
      opt('strat', 'upfront', '直接根治性手術', '可切除、非 bulky（cT1b–cT3、N0–N+）') +
      opt('strat', 'periop', '圍手術期化療 → 手術', 'cT4N+ 或 bulky nodes（borderline resectable）'));

    // ESD 治癒性判定
    h += step('gc_s3b', '3b', 'ESD 術後病理是否為治癒性切除？',
      opt('esdcur', 'esd_cur', '治癒性（curative）', '切緣陰性、LVI(−)、submucosal 侵犯 <500µm') +
      opt('esdcur', 'esd_noncur', '非治癒性（non-curative）', '切緣陽性、LVI(+) 或深部侵犯 ≥500µm'));
    h = h.replace('id="gc_s3b"', 'id="gc_s3b" class="hidden"');

    // 手術結果 R status
    h += step('gc_s4', '4', '手術切除結果（R status）',
      opt('rstatus', 'R0', 'R0 切除', '無殘存腫瘤') +
      opt('rstatus', 'R1', 'R1 切除', '顯微鏡下殘存（microscopic）') +
      opt('rstatus', 'R2', 'R2 切除', '肉眼可見殘存（gross residual）'));
    h = h.replace('id="gc_s4"', 'id="gc_s4" class="hidden"');

    // R0 病理分期
    h += step('gc_s4b', '4b', 'R0 病理分期（決定術後輔助化療）',
      opt('pstage', 'p_early', 'pT1N0 或 pT2N0', '早期、淋巴結陰性') +
      opt('pstage', 'p_adj', 'pT3、pT4 或 任何 T、N+', '侵犯較深或淋巴結轉移'));
    h = h.replace('id="gc_s4b"', 'id="gc_s4b" class="hidden"');

    h += '</div>'; // gc_res

    h += rec('gc_loco_rec', '建議處置 · 侷限性 Locoregional');
    h += '</div>'; // gc_loco

    /* ===================== M1 轉移／不可切除 ===================== */
    h += '<div id="gc_meta" class="hidden">';
    h += conn('gc_mc2');
    h += step('gc_m_line', '2', '治療線別 Line of therapy',
      opt('line', 'first', '一線 1st line', '初治轉移／不可切除') +
      opt('line', 'second', '二線 2nd line', '一線失敗後') +
      opt('line', 'third', '三線以後 3rd line+', '多線治療後'));

    h += step('gc_m_her2', '3', 'HER2 狀態',
      opt('her2', 'her2p', 'HER2 陽性', 'IHC 3+ 或 IHC 2+ 且 ISH(+)') +
      opt('her2', 'her2n', 'HER2 陰性', '不符 HER2+ 定義'));
    h = h.replace('id="gc_m_her2"', 'id="gc_m_her2" class="hidden"');

    h += step('gc_m_cps', '4', 'PD-L1 CPS（HER2+ 一線）',
      opt('cps', 'cps1', 'CPS ≥1', 'Dako 22C3') +
      opt('cps', 'cpslt1', 'CPS <1', ''));
    h = h.replace('id="gc_m_cps"', 'id="gc_m_cps" class="hidden"');

    h += step('gc_m_bm', '4', '生物標記加成（HER2− 一線，依序評估）',
      opt('bm', 'pdl15', 'PD-L1 CPS ≥5', '→ nivolumab（健保給付 HER2−）') +
      opt('bm', 'pdl11', 'PD-L1 CPS ≥1', '→ pembrolizumab') +
      opt('bm', 'dmmr', 'dMMR／MSI-H', '→ nivolumab 或 pembrolizumab') +
      opt('bm', 'cldn', 'CLDN18.2 陽性', '→ zolbetuximab（2+/3+ ≥75% 腫瘤細胞）') +
      opt('bm', 'none', '皆陰性', '→ 單純化療'));
    h = h.replace('id="gc_m_bm"', 'id="gc_m_bm" class="hidden"');

    h += step('gc_m_ps', '5', '體能狀態 → 化療骨架',
      opt('ps', 'ps_good', '體能良好', '含鉑雙合一（FOLFOX／CAPOX／FP）') +
      opt('ps', 'ps_poor', '體能不佳', 'KPS ≤50／ECOG 3 → HDFL／5-FU 為主'));
    h = h.replace('id="gc_m_ps"', 'id="gc_m_ps" class="hidden"');

    h += rec('gc_meta_rec', '建議處置 · 轉移／不可切除 Systemic');
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

  function gcBackbone() {
    if (gcSt.ps === 'ps_good')
      return '含鉑雙合一 — <span class="drug">cisplatin</span> 或 <span class="drug">oxaliplatin</span> ＋ fluoropyrimidine（<span class="drug">5-FU</span>／<span class="drug">capecitabine</span>／<span class="drug">S-1</span>），如 <span class="rx">FOLFOX</span>／<span class="rx">CAPOX</span>／<span class="rx">FP</span>';
    if (gcSt.ps === 'ps_poor')
      return '<span class="rx">HDFL</span>（每週 24hr 輸注高劑量 <span class="drug">5-FU</span> 2,000–2,600 mg/m² ＋ <span class="drug">leucovorin</span> 300 mg/m²）或 5-FU/LV 為主';
    return '<i>（請於步驟 5 選擇體能狀態）</i>';
  }

  /* ---------- 主渲染 ---------- */
  function gcRender() {
    var s = gcSt;

    // 顯示對應主軌
    gcShow('gc_loco', s.scope === 'loco');
    gcShow('gc_c2', s.scope === 'loco');
    gcShow('gc_meta', s.scope === 'm1');
    gcShow('gc_mc2', s.scope === 'm1');

    /* ===== M0 侷限性 ===== */
    gcShow('gc_res', s.fit === 'fit_res');
    gcShow('gc_c3', s.fit === 'fit_res');
    gcShow('gc_s3b', s.fit === 'fit_res' && s.strat === 'esd');
    var surgical = (s.strat === 'upfront' || s.strat === 'periop');
    gcShow('gc_s4', s.fit === 'fit_res' && surgical);
    gcShow('gc_s4b', s.fit === 'fit_res' && surgical && s.rstatus === 'R0');
    renderLocoRec();

    /* ===== M1 轉移 ===== */
    gcShow('gc_m_her2', !!s.line && s.line !== 'third');
    gcShow('gc_m_cps', s.line === 'first' && s.her2 === 'her2p');
    gcShow('gc_m_bm', s.line === 'first' && s.her2 === 'her2n');
    gcShow('gc_m_ps', s.line === 'first');
    renderMetaRec();
  }

  function renderLocoRec() {
    var s = gcSt;
    if (s.scope !== 'loco') return;
    var id = 'gc_loco_rec';

    if (!s.fit) { ulRec(id, 'rec-idle', '請選擇步驟 2（醫療適合度）', [], ''); return; }

    if (s.fit === 'fit_unres' || s.fit === 'unfit') {
      var t = s.fit === 'fit_unres'
        ? '不可切除（M0）：系統性化療 → 再分期'
        : '無法耐受手術：系統性化療 或 最佳支持治療';
      ulRec(id, 'rec-nonop', t, [
        '依體能狀態選擇化療骨架（見下方「轉移／不可切除」流程與常用療程）。',
        '化療後<b>再分期</b>（Chest／Abd＋Pelvis CT、EGD、±PET）；達 cCR 或大幅反應且適合者 → 考慮手術。',
        '體能極差（KPS ≤50／ECOG 3）→ HDFL 或最佳支持治療 / 安寧療護。'
      ], 'AGC-2／AGC-3：medically fit unresectable 或 medically unfit → chemotherapy，治療後再分期；cCR 者可考慮手術。');
      return;
    }

    // fit_res
    if (!s.strat) { ulRec(id, 'rec-idle', '請選擇步驟 3（治療策略）', [], ''); return; }

    if (s.strat === 'esd') {
      if (!s.esdcur) {
        ulRec(id, 'rec-elective', '內視鏡黏膜下剝離（ESD）', [
          '適應症：分化型無潰瘍；分化型有潰瘍且 ≤3cm；未分化型無潰瘍且 ≤2cm。',
          '完成後依病理判定是否為治癒性切除（見步驟 3b）。'
        ], 'AGC-2：cT1 符合條件者可考慮 ESD。');
        return;
      }
      if (s.esdcur === 'esd_cur') {
        ulRec(id, 'rec-elective', 'ESD 治癒性切除 → 觀察追蹤', [
          '切緣陰性、LVI(−)、submucosal 侵犯 <500µm → 視為治癒。',
          '定期內視鏡與影像追蹤（AGC-4）。'
        ], '');
      } else {
        ulRec(id, 'rec-nonop', 'ESD 非治癒性 → 追加治療', [
          '<b>追加胃切除 + 淋巴結廓清</b>（首選）。',
          '或 repeat ESD；或密切觀察（依風險、共病與病人意願）。'
        ], 'AGC-2：non-curative ESD → surgical resection／repeat ESD／close observation。');
      }
      return;
    }

    // 手術（upfront / periop）
    if (!s.rstatus) {
      var lead = [];
      if (s.strat === 'periop')
        lead.push('<b>術前</b>：三合一化療 <span class="rx">FLOT</span>（<span class="drug">5-FU</span>＋<span class="drug">leucovorin</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">docetaxel</span>）或 <span class="rx">DOS</span>（<span class="drug">docetaxel</span>＋<span class="drug">oxaliplatin</span>＋<span class="drug">S-1</span>）；無法耐受三合一 → 鉑+fluoropyrimidine 雙合一。');
      lead.push('遠端癌：<b>次全胃切除</b>（首選）；近端／賁門癌：全胃或近端胃切除。');
      lead.push('<b>D2 廓清</b>（D0 不可接受）；建議切緣 >5cm；至少評估 <b>16 顆</b>淋巴結。');
      if (s.strat === 'periop') lead.push('術後接續完成圍手術期化療。');
      ulRec(id, 'rec-elective',
        s.strat === 'periop' ? '圍手術期化療 → 根治性胃切除 + D2' : '根治性胃切除 + D2 廓清',
        lead,
        'AGC-2：D2 recommended、≥16 nodes；perioperative 三合一（FLOT／DOS）用於 cT4N+ 或 bulky N。durvalumab+FLOT 僅 US FDA 核准，TFDA 未核准。');
      return;
    }

    if (s.rstatus === 'R1') {
      ulRec(id, 'rec-nonop', 'R1（顯微殘存）→ Salvage 化療', [
        '依 AGC-5 系統性治療；必要時再切除或局部治療（RT）。'
      ], '');
      return;
    }
    if (s.rstatus === 'R2') {
      ulRec(id, 'rec-urgent', 'R2（肉眼殘存）→ Salvage 化療 或 BSC', [
        '系統性化療（見轉移流程）；體能極差者最佳支持治療。'
      ], '');
      return;
    }

    // R0
    if (!s.pstage) { ulRec(id, 'rec-idle', 'R0 → 請選擇步驟 4b（病理分期）', [], ''); return; }
    if (s.pstage === 'p_early') {
      ulRec(id, 'rec-elective', 'R0 + pT1–2 N0 → 追蹤觀察', [
        '不需輔助化療；定期追蹤（AGC-4）。',
        '近端／全胃切除者監測維生素 B12（每 6–12 個月）。'
      ], '');
    } else {
      ulRec(id, 'rec-elective', 'R0 + pT3–4 或 N+ → 術後輔助化療', [
        '<span class="rx">S-1</span> 單方（ACTS-GC）。',
        '<span class="rx">XELOX</span>（<span class="drug">capecitabine</span>＋<span class="drug">oxaliplatin</span>，CLASSIC）。',
        '<span class="rx">S-1 + docetaxel</span>（JACCRO GC-07）— <b>pStage III 建議</b>。',
        '<span class="rx">SOX</span>（<span class="drug">S-1</span>＋<span class="drug">oxaliplatin</span>，ARTIST 2）— <b>pStage III 建議</b>。'
      ], 'AGC-3：D2 R0 後 pT3-4 或 pN+ → adjuvant chemo。S-1+docetaxel 與 SOX 於 pStage III 之 3 年無復發存活優於 S-1 單方；惟 capecitabine／oxaliplatin／docetaxel 於 adjuvant 未納健保。');
    }
  }

  function renderMetaRec() {
    var s = gcSt;
    if (s.scope !== 'm1') return;
    var id = 'gc_meta_rec';

    if (!s.line) { ulRec(id, 'rec-idle', '請選擇步驟 2（治療線別）', [], ''); return; }

    if (s.line === 'first') {
      if (!s.her2) { ulRec(id, 'rec-idle', '請選擇步驟 3（HER2 狀態）', [], ''); return; }

      if (s.her2 === 'her2p') {
        var l1 = ['化療骨架（依體能）：' + gcBackbone(), '＋ <span class="drug">trastuzumab</span>（抗 HER2，ToGA）'];
        if (s.cps === 'cps1') l1.push('<b>CPS ≥1：再加 <span class="drug">pembrolizumab</span>（KEYNOTE-811）</b>');
        else if (s.cps === 'cpslt1') l1.push('<b>CPS <1：僅加 trastuzumab（不加免疫）</b>');
        else l1.push('<i>（請於步驟 4 選 CPS）</i>：CPS ≥1 → 加 pembrolizumab；CPS <1 → 僅 trastuzumab');
        ulRec(id, 'rec-elective', 'HER2 陽性 · 一線：化療 + 抗 HER2（± 免疫）', l1,
          'HER2+ 定義：IHC 3+ 或 IHC 2+ 且 ISH(+)。');
        return;
      }

      // HER2 陰性
      var l2 = ['化療骨架（依體能）：' + gcBackbone()];
      var add = {
        pdl15: '<b>PD-L1 CPS ≥5：加 <span class="drug">nivolumab</span>（CheckMate 649；健保給付 HER2−）</b>',
        pdl11: '<b>PD-L1 CPS ≥1：加 <span class="drug">pembrolizumab</span>（KEYNOTE-859）</b>',
        dmmr: '<b>dMMR／MSI-H：加 <span class="drug">nivolumab</span> 或 <span class="drug">pembrolizumab</span>（不分線別，ESMO Pan-Asia）</b>',
        cldn: '<b>CLDN18.2 陽性：加 <span class="drug">zolbetuximab</span>（SPOTLIGHT／GLOW；健保 115/04/01 起給付 HER2−）</b>',
        none: '無可加成標記：單純化療骨架'
      };
      if (s.bm) l2.push(add[s.bm]);
      else l2.push('<i>（請於步驟 4 選生物標記加成）</i>');
      ulRec(id, 'rec-elective', 'HER2 陰性 · 一線：化療 ± 免疫／標靶', l2,
        'PD-L1：nivolumab CPS ≥5（Dako 28-8，健保給付 HER2−）；pembrolizumab CPS ≥1（Dako 22C3）。CLDN18.2+：2+/3+ 膜染色 ≥75% 存活腫瘤細胞。');
      return;
    }

    if (s.line === 'second') {
      var l3 = [
        '<span class="drug">docetaxel</span>（COUGAR-02）',
        '單方或合併：cisplatin／oxaliplatin／taxane／irinotecan／5-FU-HDFL／capecitabine／S-1',
        '<span class="drug">ramucirumab</span> ± <span class="drug">paclitaxel</span>（RAINBOW；抗血管新生）'
      ];
      if (s.her2 === 'her2p') l3.push('<b>HER2+：<span class="drug">trastuzumab deruxtecan</span>（T-DXd，DESTINY-Gastric）</b>');
      else if (!s.her2) l3.push('<i>（可於步驟 3 選 HER2；HER2+ 可用 T-DXd）</i>');
      ulRec(id, 'rec-elective', '二線治療 2nd line', l3,
        'ramucirumab、paclitaxel、trastuzumab deruxtecan 目前健保未給付。');
      return;
    }

    // third+
    ulRec(id, 'rec-elective', '三線以後 3rd line+', [
      '<span class="drug">trifluridine/tipiracil</span>（FTD/TPI，TAGS）',
      '<span class="drug">nivolumab</span>（ATTRACTION-2）',
      '<span class="drug">pembrolizumab</span>（若 CPS ≥1 或 MSI-H／dMMR，KEYNOTE-061）',
      '臨床試驗'
    ], '後線 nivolumab／pembrolizumab 經 TFDA 核准但健保未給付，需自費。');
  }

  /* ---------- 事件 ---------- */
  function gcPick(key, val, btn) {
    gcSel(btn);
    var s = gcSt;
    if (key === 'scope') {
      s.scope = val;
      s.fit = s.strat = s.esdcur = s.rstatus = s.pstage = null;
      s.line = s.her2 = s.cps = s.bm = s.ps = null;
      gcClearSel(['gc_s2', 'gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b',
        'gc_m_line', 'gc_m_her2', 'gc_m_cps', 'gc_m_bm', 'gc_m_ps']);
    } else if (key === 'fit') {
      s.fit = val; s.strat = s.esdcur = s.rstatus = s.pstage = null;
      gcClearSel(['gc_s3', 'gc_s3b', 'gc_s4', 'gc_s4b']);
    } else if (key === 'strat') {
      s.strat = val; s.esdcur = s.rstatus = s.pstage = null;
      gcClearSel(['gc_s3b', 'gc_s4', 'gc_s4b']);
    } else if (key === 'esdcur') { s.esdcur = val; }
    else if (key === 'rstatus') { s.rstatus = val; s.pstage = null; gcClearSel(['gc_s4b']); }
    else if (key === 'pstage') { s.pstage = val; }
    else if (key === 'line') {
      s.line = val; s.her2 = s.cps = s.bm = s.ps = null;
      gcClearSel(['gc_m_her2', 'gc_m_cps', 'gc_m_bm', 'gc_m_ps']);
    } else if (key === 'her2') { s.her2 = val; s.cps = s.bm = null; gcClearSel(['gc_m_cps', 'gc_m_bm']); }
    else if (key === 'cps') { s.cps = val; }
    else if (key === 'bm') { s.bm = val; }
    else if (key === 'ps') { s.ps = val; }
    gcRender();
  }

  function gcReset() {
    for (var k in gcSt) { if (gcSt.hasOwnProperty(k)) gcSt[k] = null; }
    var root = document.getElementById('gcPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    gcRender();
  }

  function initGastricPathway() { gcReset(); }

  // 匯出（供 cancer-staging.js 與 inline onclick 使用）
  global.gastricPathwayHTML = gastricPathwayHTML;
  global.initGastricPathway = initGastricPathway;
  global.gcPick = gcPick;
  global.gcReset = gcReset;
})(window);
