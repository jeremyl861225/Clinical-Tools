/* ============================================================
   子宮頸癌治療互動決策流程 Cervical Cancer Treatment Pathway
   資料來源：國立臺灣大學醫學院附設醫院 婦癌診療指引
   版次 10（2026/06/16 第 87 次癌症醫療委員會修訂通過），文件編號 50710-2-000011
   對應頁面 CERV-1 ～ CERV-15
   ※ 流程結構依指引各頁之決策圖判讀（非文字順序）。三個容易讀錯之處：
     ① CERV-1 對 IA1／IA2／IB1／IB2 同時畫出「保留生育」與「不保留生育」兩條
        平行箭頭——兩者是並行選項，非先後步驟，故生育需求是本流程的獨立分叉。
     ② IB3 與 IIA2 同時指向 CERV-4（含手術選項）與 CERV-6（根治性化放療），
        是唯一兩條路都成立的分期，指引未指定優先者。
     ③ CERV-5 之「中度風險（Sedlis）」與「高度風險（淋巴結／切緣／子宮旁陽性）」
        建議強度不同（前者化療為 category 2B，後者同步化放療為 category 1），不可合併。
   本模組為 cancer.html 治療分頁專用；自足，不依賴 common.js。
   ============================================================ */
(function (global) {
  'use strict';

  var cxSt = {
    histo: null,   // usual | necc
    stage: null,   // ia1 | ia2ib1 | ib2 | iia1 | ib3iia2 | iibiva | ivb | incidental
    fert: null,    // fert_yes | fert_no      （僅早期）
    path: null,    // p_neg | p_high | p_para （CERV-5 術後病理發現）
    nstage: null   // n_local | n_la | n_meta （NECC）
  };

  /* ---------- 版面 helpers ---------- */
  function opt(key, val, title, sub) {
    return '<button class="flow-opt" onclick="cxPick(\'' + key + '\',\'' + val + '\',this)">' +
      title + (sub ? '<span class="fo-sub">' + sub + '</span>' : '') + '</button>';
  }
  function step(id, num, q, optsHtml, extra) {
    return '<div class="flow-step" id="' + id + '"><div class="flow-step-head">' +
      '<span class="flow-num">' + num + '</span><span class="flow-q">' + q + '</span></div>' +
      '<div class="flow-opts">' + optsHtml + '</div>' + (extra || '') + '</div>';
  }
  function connH(id) { return '<div class="flow-connector hidden" id="' + id + '">↓</div>'; }
  function rxLine(head, sub, items) {
    return '<div class="rx-line"><div class="rx-line-h"><span class="rx-h">' + head + '</span>' +
      (sub ? '<span class="rx-sub">' + sub + '</span>' : '') + '</div>' +
      '<ul class="rx-items"><li>' + items.join('</li><li>') + '</li></ul></div>';
  }

  /* ---------- 檢查與縮寫（CERV-1）---------- */
  function dxHtml() {
    return '<details class="dx-details"><summary>初始檢查 Workup（CERV-1）▸</summary>' +
      '<div class="dx-h">指引所列檢查</div>' +
      '<ul class="dx-list">' +
      '<li>病史與理學檢查（H&amp;P）、全血球計數（含血小板）</li>' +
      '<li><b>子宮頸切片與病理判讀</b>；必要時錐狀切片（cone biopsy）</li>' +
      '<li>肝功能／腎功能檢查、影像檢查</li>' +
      '<li><b>≥ IB3 者考慮麻醉下檢查（EUA）併膀胱鏡／直腸鏡</b></li>' +
      '<li>考慮 HIV 檢驗；有需要時戒菸衛教與介入</li>' +
      '<li><b>考慮生育保留之選項，或轉介生殖內分泌不孕症（REI）專科</b></li>' +
      '</ul>' +
      '<div class="dx-h">本院必要檢查（Essential examination，指引以標示強調）</div>' +
      '<ul class="dx-list">' +
      '<li><b>子宮頸切片 Cervical biopsy</b></li>' +
      '<li><b>PET、骨盆腔 CT／MRI</b></li>' +
      '</ul>' +
      '</details>' +
      '<details class="dx-details"><summary>縮寫名稱對照 Abbreviations ▸</summary>' +
      '<ul class="dx-list">' +
      '<li><b>LVSI</b> — lymphovascular space invasion 淋巴血管腔侵犯</li>' +
      '<li><b>EBRT</b> — external beam radiation therapy 體外放射治療</li>' +
      '<li><b>SLN</b> — sentinel lymph node 前哨淋巴結</li>' +
      '<li><b>EUA</b> — examination under anesthesia 麻醉下檢查</li>' +
      '<li><b>IORT</b> — intraoperative radiation therapy 術中放射治療</li>' +
      '<li><b>NECC</b> — small cell neuroendocrine carcinoma of the cervix 子宮頸小細胞神經內分泌癌</li>' +
      '<li><b>REI</b> — reproductive endocrinology and infertility 生殖內分泌不孕症</li>' +
      '</ul></details>';
  }

  /* ---------- 保守手術條件（CERV-2／CERV-3 共用，全部條件均須符合）---------- */
  function consCritHtml() {
    return '<div class="note"><b>保守（保留生育）手術條件——以下<u>全部</u>須符合</b>（CERV-2／CERV-3）：' +
      '<ul class="dx-list">' +
      '<li>無 LVSI</li>' +
      '<li>錐狀切片切緣陰性</li>' +
      '<li>鱗狀細胞癌（任何分級）<b>或</b>一般型腺癌（<b>僅限 grade 1 或 2</b>）</li>' +
      '<li>腫瘤大小 <b>≤2cm</b></li>' +
      '<li>侵犯深度 <b>≤10mm</b></li>' +
      '<li>影像無轉移證據</li>' +
      '</ul></div>';
  }

  /* ---------- 追蹤（CERV-11）---------- */
  function fuHtml() {
    return '<div class="fu-label">追蹤與監測 Surveillance（CERV-11）</div>' +
      '<ul class="fu-list">' +
      '<li><b>病史與理學檢查</b>：前 2 年每 3–6 個月、第 3–5 年每 6–12 個月，其後<b>依個別復發風險</b>每年一次。</li>' +
      '<li><b>子宮頸／陰道細胞學</b>每年一次，用於偵測下生殖道之新生病變。</li>' +
      '<li><b>影像追蹤依分期而定</b>；血液檢查（CBC、BUN、creatinine）於症狀或理學檢查可疑復發時安排。</li>' +
      '<li><b>衛教</b>：復發症狀、生活型態、體重、運動、性健康（陰道擴張器、潤滑／保濕劑、更年期荷爾蒙治療）、戒菸、營養諮詢，及治療之長期與晚期副作用。</li>' +
      '<li><b>疑似持續或復發</b>時：追加影像、必要時切片 ± EUA、選擇性病例可手術探查；考慮以 FDA 核可或 CLIA 認證實驗室之檢測做<b>全面分子檢測</b>；<b>若無法取得組織，可考慮血漿 ctDNA</b>。</li>' +
      '</ul>';
  }

  /* ---------- 復發與轉移（CERV-12／CERV-13），供多個終點共用 ---------- */
  function relapseHtml() {
    return '<details class="kps-details"><summary>復發之處置（CERV-12／CERV-13）▸</summary>' +
      rxLine('局部／區域復發', 'CERV-12：<b>先分「是否曾接受放療」</b>', [
        '<b>未曾放療，或復發於原照野之外</b>：可行時考慮<b>手術切除</b> → 個別化 EBRT + 同步含鉑化療 ± 近接治療。',
        '<b>曾放療 · 中央型復發</b>：<b>骨盆腔臟器摘除術（pelvic exenteration）</b> ± IORT（IORT 為 category 3）；<b>或</b>於<b>經審慎篩選之病人</b>行根除性子宮切除、近接治療或個別化 EBRT ± 同步含鉑化療。',
        '<b>曾放療 · 非中央型復發</b>：個別化 EBRT ± 同步含鉑化療、切除 ± IORT（category 3）、系統性治療，或最佳支持療法。',
        '<b>上述任一再復發</b> → 系統性治療或最佳支持療法。'
      ]) +
      rxLine('第 IVB 期或遠處轉移復發', 'CERV-13', [
        '<b>可局部處理者</b>：切除 ± 個別化 EBRT、<b>或</b>局部消融 ± 個別化 EBRT、<b>或</b>個別化 EBRT ± 同步含鉑化療；並<b>考慮輔助系統性治療</b>。',
        '<b>不可局部處理者</b>：<b>系統性治療</b>和／或<b>最佳支持療法</b>。'
      ]) +
      '<div class="note">指引本文以「systemic therapy」統稱，未於 CERV-12／CERV-13 逐條列出藥名；' +
      '晚期／復發子宮頸癌之現行標準骨架與其試驗依據見本頁下方參考文獻（GOG-240、KEYNOTE-826、innovaTV 301）。</div>' +
      '</details>';
  }

  /* ---------- 建議處置 ---------- */
  function recFor(s) {
    /* ── 小細胞神經內分泌癌 NECC（CERV-14／CERV-15）── */
    if (s.histo === 'necc') {
      if (s.nstage === 'n_local_small') {
        return { cls: 'rec-elective', title: 'NECC · 侷限子宮頸且腫瘤 ≤4cm', detail:
          rxLine('兩個並列選項', 'CERV-14', [
            '<b>根除性子宮切除 + 骨盆腔淋巴結廓清</b>（<b>適合原發手術者為優先</b>）± 主動脈旁淋巴結取樣<br>→ 術後：<b>化療</b>（<span class="rx">cisplatin/etoposide</span> 或 <span class="rx">carboplatin/etoposide</span>）<b>或</b>化放療。',
            '<b>化放療 + 近接治療</b><br>→ 其後<b>考慮追加系統性治療</b>。'
          ]),
          note: 'CERV-14。<b>NECC 自 CERV-1 起就與一般型分流</b>——即使侷限子宮頸，指引也一律納入化療，不採「單純手術後觀察」。' };
      }
      if (s.nstage === 'n_local_big') {
        return { cls: 'rec-elective', title: 'NECC · 侷限子宮頸但腫瘤 &gt;4cm', detail:
          rxLine('兩個並列選項', 'CERV-14', [
            '<b>化放療 + 近接治療</b> → 考慮追加系統性治療。',
            '<b>新輔助化療</b>（<span class="rx">cisplatin/etoposide</span> 或 <span class="rx">carboplatin/etoposide</span>）→ <b>考慮根除性子宮切除</b>：<br>· <b>未行子宮切除</b> → 回到<b>化放療 + 近接治療</b>；<br>· <b>已行子宮切除</b> → <b>考慮輔助放療或化放療</b>，再考慮追加系統性治療。'
          ]),
          note: 'CERV-14。此處指引圖上有<b>兩條回折箭頭</b>（新輔助化療後未手術者折回化放療、手術者折回追加系統性治療），是流程圖而非單向樹狀。' };
      }
      if (s.nstage === 'n_la') {
        return { cls: 'rec-elective', title: 'NECC · 局部晚期（IB3–IVA）', detail:
          rxLine('原發治療', 'CERV-15', [
            '<b>化放療 + 近接治療 ± 化療</b>（<span class="rx">cisplatin/etoposide</span> 或 <span class="rx">carboplatin/etoposide</span>）——<b>優先</b>',
            '<b>或</b> <b>新輔助化療</b>（同上方案）<b>續以</b>化放療 + 近接治療'
          ]) +
          rxLine('評估治療反應後', 'CERV-15', [
            '<b>有反應</b> → 進入追蹤（CERV-11）。',
            '<b>持續存在或復發 · 局部</b> → 系統性治療、最佳支持療法，<b>或考慮骨盆腔臟器摘除術</b>。',
            '<b>持續存在或復發 · 遠處轉移</b> → 依 CERV-13 處置。'
          ]),
          note: 'CERV-15。' };
      }
      return { cls: 'rec-nonop', title: 'NECC · 轉移性疾病', detail:
        rxLine('依 CERV-13 處置', '', [
          '<b>可局部處理者</b>：切除、局部消融或個別化 EBRT ± 同步含鉑化療，並考慮輔助系統性治療。',
          '<b>不可局部處理者</b>：系統性治療和／或最佳支持療法。'
        ]) + relapseHtml(),
        note: 'CERV-14 將轉移性 NECC 直接導向 CERV-13。' };
    }

    /* ── 偶發：單純子宮切除後才發現侵襲癌（CERV-9／CERV-10）── */
    if (s.stage === 'incidental') {
      return { cls: 'rec-elective', title: '單純（筋膜外）子宮切除後偶然發現侵襲癌', detail:
        rxLine('第 IA1 期', 'CERV-9', [
          '病理判讀確認<b>無 LVSI</b> → <b>直接進入追蹤</b>（CERV-11）。'
        ]) +
        rxLine('IA2–IB1 且符合全部保守手術條件', 'CERV-9（條件同 CERV-2／CERV-3，惟依全子宮切除標本判定）', [
          '<b>骨盆腔淋巴結廓清（優先）</b>：淋巴結陰性 → 追蹤；<b>淋巴結陽性 → 依 CERV-10 處置</b>。',
          '<b>或</b> 骨盆腔 EBRT + 近接治療 ± 同步含鉑化療（<b>用於標本完整性不明時</b>）→ 追蹤。'
        ]) +
        rxLine('IA1–IA2 併 LVSI、或 IB1 不符保守條件、或切緣陽性／肉眼殘存', 'CERV-10', [
          '先做 H&amp;P、CBC、肝腎功能與影像，再依結果分流：',
          '<b>切緣陰性且影像陰性</b> → ① 骨盆腔 EBRT + 近接治療 ± 同步含鉑化療 → 追蹤；<b>或</b> ②（<b>子宮切除標本未達 Sedlis 條件時可選</b>）<b>完成子宮旁組織／陰道上段切除 + 骨盆腔淋巴結廓清</b> ± 主動脈旁淋巴結取樣（取樣為 category 2B）——淋巴結陰性且無殘存 → 追蹤；淋巴結／切緣／子宮旁陽性 → 下列放化療。',
          '<b>切緣陽性、肉眼殘存、影像陽性，或原發腫瘤特徵已達 Sedlis 條件</b> → <b>骨盆腔 EBRT</b>（主動脈旁淋巴結陽性者加照該區）<b>+ 同步含鉑化療（category 1）</b> ± 個別化近接治療（陰道切緣陽性時）→ 追蹤。'
        ]),
        note: 'CERV-9／CERV-10。<b>CERV-10 的兩條上游路徑（子宮旁切除後陽性、與切緣陽性／已達 Sedlis）匯入同一個放化療方塊</b>，指引圖上是共用終點而非兩個相同方塊。' };
    }

    /* ── IVB ── */
    if (s.stage === 'ivb') {
      return { cls: 'rec-nonop', title: '第 IVB 期 · 遠處轉移', detail:
        rxLine('依 CERV-13 處置', '', [
          '<b>可局部處理者</b>：<b>切除 ± 個別化 EBRT</b>、<b>或</b>局部消融 ± 個別化 EBRT、<b>或</b>個別化 EBRT ± 同步含鉑化療；並<b>考慮輔助系統性治療</b> → 追蹤（CERV-11）。',
          '<b>不可局部處理者</b>：<b>系統性治療</b>和／或<b>最佳支持療法</b>。'
        ]) + relapseHtml(),
        note: 'CERV-1 將 IVB 直接導向 CERV-13。' };
    }

    /* ── IIB–IVA：根治性化放療（CERV-6～CERV-8）── */
    if (s.stage === 'iibiva') {
      return { cls: 'rec-nonop', title: '第 IIB／III／IVA 期 · 根治性化放療（無原發手術選項）', detail:
        rxLine('追加分期檢查 · 二擇一', 'CERV-6', [
          '<b>僅影像分期</b>：淋巴結陰性 → <b>骨盆腔 EBRT + 同步含鉑化療 + 近接治療（category 1）</b>；淋巴結陽性 → 依 CERV-7。',
          '<b>或 手術分期（category 2B）</b>：主動脈旁 ± 骨盆腔淋巴結廓清。陰性 → 同上 category 1 方案；陽性 → 依 CERV-8。'
        ]) +
        rxLine('影像顯示淋巴結陽性（FIGO 2018 IIIC r）', 'CERV-7', [
          '<b>骨盆腔陽性、主動脈旁陰性</b>：① 骨盆腔 EBRT + 同步含鉑化療 + 近接治療（category 1）± 主動脈旁照野；<b>或</b> ② <b>先手術分期主動脈旁</b>——陰性則同 category 1 方案，陽性則<b>延伸照野 EBRT</b> + 同步含鉑化療 + 近接治療。',
          '<b>骨盆腔與主動脈旁皆陽性</b>：<b>延伸照野 EBRT + 同步含鉑化療 + 近接治療</b>。',
          '<b>遠處轉移（必要時切片證實）</b>：系統性治療 ± 個別化放療。'
        ]) +
        rxLine('手術分期發現淋巴結陽性', 'CERV-8', [
          '<b>骨盆腔陽性、主動脈旁陰性（IIIC1p）</b>：骨盆腔 EBRT + 同步含鉑化療 + 近接治療（category 1）。',
          '<b>主動脈旁陽性（IIIC2p）</b>：追加影像評估遠處轉移——陰性 → <b>延伸照野 EBRT</b> + 同步含鉑化療 + 近接治療；陽性 → 切片可疑處，切片陰性同前，<b>切片陽性 → 系統性治療 ± 個別化放療</b>。'
        ]),
        note: 'CERV-6～CERV-8。<b>本組無原發手術選項</b>——指引僅 IB3／IIA2 同時保留手術路徑（CERV-4），IIB 以上一律根治性化放療。' };
    }

    /* ── IB3／IIA2：兩條路都成立 ── */
    if (s.stage === 'ib3iia2' && !s.path) {
      return { cls: 'rec-elective', title: '第 IB3／IIA2 期 · 兩條原發治療路徑並存', detail:
        rxLine('CERV-4 之三個並列選項', '指引未指定優先者', [
          '<b>骨盆腔 EBRT + 同步含鉑化療 + 近接治療（category 1）</b> → 追蹤。',
          '<b>或 根除性子宮切除 + 骨盆腔淋巴結廓清</b> ± 主動脈旁淋巴結廓清（category 2B）→ <b>依術後病理發現決定輔助治療</b>（請於上方選擇第 4 步）。',
          '<b>或 骨盆腔 EBRT + 同步含鉑化療 + 近接治療 + 選擇性完成子宮切除（category 3）</b> → 追蹤。'
        ]) +
        '<div class="note"><b>IB3 與 IIA2 是唯一同時指向 CERV-4（含手術）與 CERV-6（根治性化放療）的分期。</b>' +
        'CERV-4 該方塊並註明「亦見 CERV-6 之非原發手術病人建議」。若選擇根治性化放療，處置同上方 IIB–IVA 之 CERV-6 流程。</div>',
        note: 'CERV-4 ＋ CERV-6。' };
    }

    /* ── 早期：先看有無保留生育需求 ── */
    var early = (s.stage === 'ia1' || s.stage === 'ia2ib1' || s.stage === 'ib2' || s.stage === 'iia1');

    if (early && s.fert === 'fert_yes') {
      if (s.stage === 'ia1') {
        return { cls: 'rec-elective', title: '第 IA1 期 · 保留生育 · 無 LVSI', detail:
          rxLine('原發治療', 'CERV-2', [
            '<b>錐狀切片（cone biopsy）併切緣陰性</b>——以<b>未破碎標本</b>、<b>至少 1mm 陰性切緣</b>為佳。',
            '<b>切緣陽性時</b>：重做錐狀切片，<b>或</b>施行子宮頸切除術（trachelectomy）。'
          ]),
          note: 'CERV-2。<b>IA1 無 LVSI 者不需淋巴結手術</b>——這是唯一單靠錐狀切片即可完成治療的分期。若有 LVSI 則改走下方 IA1–IA2 併 LVSI 之建議。' };
      }
      if (s.stage === 'ia2ib1') {
        return { cls: 'rec-elective', title: '第 IA2–IB1 期 · 保留生育', detail:
          rxLine('符合全部保守手術條件者', 'CERV-2', [
            '<b>錐狀切片併切緣陰性</b> <b>+</b> <b>骨盆腔淋巴結廓清</b>（<b>或</b>前哨淋巴結 SLN 定位）'
          ]) + consCritHtml() +
          rxLine('IA1–IA2 併 LVSI', 'CERV-2', [
            '<b>根除性子宮頸切除術（radical trachelectomy）+ 骨盆腔淋巴結廓清</b>（考慮 SLN 定位）',
            '<b>或</b> 錐狀切片併切緣陰性 <b>+</b> 骨盆腔淋巴結廓清（考慮 SLN 定位）',
            '→ 兩者皆<b>依術後病理發現決定輔助治療</b>（CERV-5，請選第 4 步）。'
          ]) +
          rxLine('IB1 不符保守手術條件（及選擇性 IB2）', 'CERV-2', [
            '<b>根除性子宮頸切除術 + 骨盆腔淋巴結廓清 ± 主動脈旁淋巴結廓清</b>（考慮 SLN 定位）→ 依 CERV-5。'
          ]),
          note: 'CERV-2。<b>「錐狀切片＋淋巴結」中的「+」是必要合併，「骨盆腔廓清 or SLN」才是二擇一</b>——這兩層在指引圖上是不同層級，勿混。' };
      }
      return { cls: 'rec-elective', title: '第 ' + (s.stage === 'ib2' ? 'IB2' : 'IIA1') + ' 期 · 保留生育之適用性有限', detail:
        rxLine('指引所列', 'CERV-2', [
          '<b>僅「選擇性 IB2（select IB2）」</b>列入保留生育路徑：<b>根除性子宮頸切除術 + 骨盆腔淋巴結廓清 ± 主動脈旁淋巴結廓清</b>（考慮 SLN 定位）→ 依 CERV-5。',
          '<b>IIA1 未列入保留生育路徑</b>——CERV-1 對 IIA1 僅畫出一條箭頭指向 CERV-4。'
        ]),
        note: 'CERV-1／CERV-2。若不保留生育，請於第 3 步改選「不保留生育」以取得 CERV-3／CERV-4 之建議。' };
    }

    /* ── 早期 · 不保留生育（CERV-3／CERV-4）── */
    if (early && s.fert === 'fert_no' && !s.path) {
      if (s.stage === 'ia1') {
        return { cls: 'rec-elective', title: '第 IA1 期（無 LVSI）· 不保留生育 · 依錐狀切片結果分流', detail:
          rxLine('錐狀切片切緣陰性', 'CERV-3', [
            '<b>不適合手術</b> → <b>觀察</b> → 追蹤。',
            '<b>適合手術</b> → <b>筋膜外子宮切除（extrafascial hysterectomy）</b> → 追蹤。'
          ]) +
          rxLine('錐狀切片切緣陽性（分化不良或癌）', 'CERV-3', [
            '<b>不適合手術</b> → <b>近接治療 ± 骨盆腔 EBRT</b> → 追蹤。',
            '<b>適合手術</b> → 考慮<b>重做錐狀切片</b>以評估侵犯深度、排除 IA2／IB1；<b>或</b>行<b>筋膜外</b>（切緣為分化不良時）<b>或改良式根除性子宮切除</b>，<b>切緣為癌時加做骨盆腔淋巴結廓清（廓清為 category 2B）</b>（考慮 SLN 定位）→ 依 CERV-5。'
          ]),
          note: 'CERV-3。<b>四個分流由「切緣狀態 × 是否適合手術」兩兩交叉而成</b>，非單一軸。' };
      }
      if (s.stage === 'ia2ib1') {
        return { cls: 'rec-elective', title: '第 IA2–IB1 期 · 不保留生育', detail:
          rxLine('符合全部保守手術條件者', 'CERV-3', [
            '<b>筋膜外子宮切除 + 骨盆腔淋巴結廓清</b>（或 SLN 定位）→ 依 CERV-5。'
          ]) + consCritHtml() +
          rxLine('IA1–IA2 併 LVSI', 'CERV-3：<b>兩個選項的下游終點不同</b>', [
            '<b>改良式根除性子宮切除 + 骨盆腔淋巴結廓清</b>（考慮 SLN 定位）→ <b>依 CERV-5 決定輔助治療</b>。',
            '<b>或 骨盆腔 EBRT + 近接治療</b> → <b>直接進入追蹤</b>（無術後病理可判，故不經 CERV-5）。'
          ]) +
          rxLine('IB1 不符保守手術條件', 'CERV-4', [
            '<b>根除性子宮切除 + 骨盆腔淋巴結廓清（category 1）</b> ± 主動脈旁淋巴結廓清（category 2B）（考慮 SLN 定位）→ 依 CERV-5。',
            '<b>或 骨盆腔 EBRT + 近接治療 ± 同步含鉑化療</b> → 追蹤。'
          ]),
          note: 'CERV-3／CERV-4。' };
      }
      return { cls: 'rec-elective', title: '第 ' + (s.stage === 'ib2' ? 'IB2' : 'IIA1') + ' 期 · 不保留生育', detail:
        rxLine('CERV-4 之兩個並列選項（終點不同）', 'IB1 不符保守條件、IB2、IIA1 三者共用同一方塊', [
          '<b>根除性子宮切除 + 骨盆腔淋巴結廓清（category 1）</b> ± 主動脈旁淋巴結廓清（category 2B）（考慮 SLN 定位）→ <b>依術後病理發現決定輔助治療</b>（CERV-5，請選第 4 步）。',
          '<b>或 骨盆腔 EBRT + 近接治療 ± 同步含鉑化療</b> → <b>直接進入追蹤</b>。'
        ]),
        note: 'CERV-4。' };
    }

    /* ── CERV-5：術後病理發現 → 輔助治療 ── */
    if (s.path === 'p_neg') {
      return { cls: 'rec-elective', title: '術後病理：淋巴結、切緣、子宮旁皆陰性（中度風險）', detail:
        rxLine('輔助治療 · 二擇一', 'CERV-5', [
          '<b>觀察</b>',
          '<b>或 骨盆腔 EBRT</b>——當<b>原發腫瘤大小、間質侵犯深度和／或 LVSI 之組合達 Sedlis 條件</b>時（<b>放療為 category 1</b>）<b>± 同步含鉑化療（化療為 category 2B）</b>'
        ]),
        note: 'CERV-5。<b>這一格的化療只有 category 2B</b>——與下一格（淋巴結／切緣／子宮旁陽性）的 category 1 同步化放療強度不同，兩者不可混用。Sedlis 條件之原始試驗為 GOG-92（見參考文獻）。' };
    }
    if (s.path === 'p_high') {
      return { cls: 'rec-elective', title: '術後病理：骨盆腔淋巴結、切緣或子宮旁陽性（高風險）', detail:
        rxLine('先做影像評估遠處轉移，再給', 'CERV-5', [
          '<b>EBRT + 同步含鉑化療（category 1）</b>',
          '<b>± 陰道近接治療</b>'
        ]),
        note: 'CERV-5。<b>三項任一陽性即屬本組</b>（骨盆腔淋巴結陽性 <b>和／或</b> 手術切緣陽性 <b>和／或</b> 子宮旁陽性）。依據為 GOG-109／SWOG-8797（見參考文獻）。' };
    }
    if (s.path === 'p_para') {
      return { cls: 'rec-elective', title: '術後病理：手術分期發現主動脈旁淋巴結陽性', detail:
        rxLine('先做影像評估遠處轉移', 'CERV-5', [
          '<b>遠處轉移陰性</b> → <b>延伸照野 EBRT + 同步含鉑化療 ± 近接治療</b>。',
          '<b>遠處轉移陽性</b> → <b>切片可疑處</b>：切片<b>陰性</b>則同上（延伸照野 EBRT + 同步含鉑化療 ± 近接治療）；切片<b>陽性</b>則<b>系統性治療 ± 個別化 EBRT</b>。'
        ]),
        note: 'CERV-5。<b>影像陽性不等於轉移</b>——指引要求先切片證實，切片陰性者仍走根治性延伸照野放化療。' };
    }

    return null;
  }

  /* ---------- 版面 ---------- */
  function cervixPathwayHTML() {
    var h = '';
    h += '<p class="onc-note">依 <b>台大醫院婦癌診療指引 版次 10（2026/06/16，文件編號 50710-2-000011）</b>子宮頸癌章節（CERV-1～CERV-15）之互動決策流程。' +
      '分期採 <b>FIGO 2018</b>。逐步點選以取得對應建議處置與追蹤。</p>';
    h += '<div class="onc-path" id="cxPath">';

    h += dxHtml();

    h += step('cx_s1', '1', '組織型態？',
      opt('histo', 'usual', '鱗狀細胞癌／腺癌／腺鱗癌', '一般型，佔絕大多數') +
      opt('histo', 'necc', '小細胞神經內分泌癌 NECC', '自 CERV-1 起即獨立分流'),
      '<div class="note">CERV-1 的<b>第一個分叉</b>是組織型態，不是分期——NECC 走完全不同的 CERV-14／CERV-15。</div>');

    h += connH('cx_c1');
    h += step('cx_s2', '2', 'FIGO 2018 臨床分期？',
      opt('stage', 'ia1', 'IA1', '侵犯深度 ≤3mm') +
      opt('stage', 'ia2ib1', 'IA2 / IB1', '深度 >3–5mm ／ ≥5mm 且 ≤2cm') +
      opt('stage', 'ib2', 'IB2', '>2cm 且 ≤4cm') +
      opt('stage', 'iia1', 'IIA1', '陰道上 2/3、無子宮旁、≤4cm') +
      opt('stage', 'ib3iia2', 'IB3 / IIA2', '>4cm（兩條路徑並存）') +
      opt('stage', 'iibiva', 'IIB / III / IVA', '根治性化放療') +
      opt('stage', 'ivb', 'IVB', '遠處轉移') +
      opt('stage', 'incidental', '偶發發現', '單純子宮切除後才知為侵襲癌'));

    h += step('cx_s2n', '2', 'NECC 之疾病範圍？',
      opt('nstage', 'n_local_small', '侷限子宮頸 · ≤4cm') +
      opt('nstage', 'n_local_big', '侷限子宮頸 · >4cm') +
      opt('nstage', 'n_la', '局部晚期（IB3–IVA）') +
      opt('nstage', 'n_meta', '轉移性疾病'));

    h += connH('cx_c2');
    h += step('cx_s3', '3', '是否希望保留生育功能？',
      opt('fert', 'fert_yes', '希望保留生育', 'CERV-2') +
      opt('fert', 'fert_no', '不保留生育', 'CERV-3／CERV-4'),
      '<div class="note">CERV-1 對 IA1／IA2／IB1／IB2 <b>同時畫出兩條平行箭頭</b>——保留生育與否是<b>並行選項</b>，由病人意願決定，不是先後步驟。</div>');

    h += connH('cx_c3');
    h += step('cx_s4', '4', '若已接受根除性手術：術後病理發現？',
      opt('path', 'p_neg', '淋巴結、切緣、子宮旁皆陰性', '中度風險 · Sedlis') +
      opt('path', 'p_high', '骨盆腔淋巴結／切緣／子宮旁陽性', '高風險') +
      opt('path', 'p_para', '手術分期發現主動脈旁淋巴結陽性'),
      '<div class="note">尚未手術、或選擇根治性化放療者<b>可略過本步</b>——上方建議處置已含該路徑之完整內容。</div>');

    h += '<div class="flow-rec rec-idle" id="cx_rec"><div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">請完成上方步驟</div></div>';
    h += '<div class="flow-fu hidden" id="cx_fu"></div>';

    h += '<div class="flow-reset"><button class="btn-reset" onclick="cxReset()">重置</button></div>';
    h += '</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  function cxRender() {
    var s = cxSt;
    var usual = s.histo === 'usual';
    var necc = s.histo === 'necc';

    show('cx_c1', !!s.histo);
    show('cx_s2', usual);
    show('cx_s2n', necc);

    // 第 3 步（生育需求）僅掛於早期且可能手術者
    var early = usual && (s.stage === 'ia1' || s.stage === 'ia2ib1' || s.stage === 'ib2' || s.stage === 'iia1');
    show('cx_c2', early);
    show('cx_s3', early);

    // 第 4 步（術後病理）掛於所有有手術選項的分期
    var surgical = usual && (
      (early && s.fert === 'fert_no') ||
      (early && s.fert === 'fert_yes' && s.stage !== 'ia1') ||
      s.stage === 'ib3iia2'
    );
    show('cx_c3', surgical);
    show('cx_s4', surgical);

    var done = (necc && !!s.nstage) ||
      (usual && (s.stage === 'ivb' || s.stage === 'iibiva' || s.stage === 'incidental')) ||
      (usual && s.stage === 'ib3iia2') ||
      (early && !!s.fert);

    var rec = document.getElementById('cx_rec');
    var fu = document.getElementById('cx_fu');
    if (!rec) return;

    if (!done) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }

    var r = recFor(s);
    if (!r) {
      rec.className = 'flow-rec rec-idle';
      rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
        '<div class="rec-title">請完成上方步驟</div>';
      if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
      return;
    }
    rec.className = 'flow-rec ' + r.cls;
    rec.innerHTML = '<div class="rec-label">建議處置 Recommendation</div>' +
      '<div class="rec-title">' + r.title + '</div>' +
      '<div class="rec-detail">' + r.detail + '</div>' +
      (r.note ? '<div class="rec-note">' + r.note + '</div>' : '');

    if (fu) { fu.innerHTML = fuHtml(); fu.classList.remove('hidden'); }
  }

  function cxClearSel(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    });
  }

  function cxPick(key, val, btn) {
    var s = cxSt;
    var wrap = btn.closest('.flow-opts');
    if (wrap) wrap.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');

    if (key === 'histo') {
      s.histo = val; s.stage = s.fert = s.path = s.nstage = null;
      cxClearSel(['cx_s2', 'cx_s2n', 'cx_s3', 'cx_s4']);
    } else if (key === 'stage') {
      s.stage = val; s.fert = s.path = null;
      cxClearSel(['cx_s3', 'cx_s4']);
    } else if (key === 'fert') {
      s.fert = val; s.path = null;
      cxClearSel(['cx_s4']);
    } else if (key === 'path') {
      s.path = val;
    } else if (key === 'nstage') {
      s.nstage = val;
    }
    cxRender();
  }

  function cxReset() {
    for (var k in cxSt) { if (cxSt.hasOwnProperty(k)) cxSt[k] = null; }
    var root = document.getElementById('cxPath');
    if (root) root.querySelectorAll('.flow-opt').forEach(function (b) { b.classList.remove('selected'); });
    var fu = document.getElementById('cx_fu');
    if (fu) { fu.classList.add('hidden'); fu.innerHTML = ''; }
    cxRender();
  }

  function initCervixPathway() { cxReset(); }

  global.cervixPathwayHTML = cervixPathwayHTML;
  global.initCervixPathway = initCervixPathway;
  global.cxPick = cxPick;
  global.cxReset = cxReset;
})(window);
