/* 藥物資料庫 —— 台大醫院藥劑部處方集藥卡。
 *
 * 一張藥卡＝一個商品名（藥品八碼），欄位與抗生素藥卡一致（去掉抗菌譜／在地感受性），
 * 另加「藥理機轉」標籤（DPP-4 抑制劑、SGLT2 抑制劑…），可直接點標籤列出同機轉的藥。
 *
 * 資料分兩層，避免一次載入整個資料庫（全庫約 2 MB，手機開頁會卡）：
 *   data/drugs/index.js  全庫輕量索引（學名／商品名／中文名／機轉／大類），開頁即載，
 *                        搜尋與清單都只靠它。
 *   data/drugs/<pid>.js  各藥理分類的完整藥卡；使用者展開某張卡時才注入 <script> 載入，
 *                        載過就留在 window.DRUGDB_DATA 不再重載。
 * 兩者皆由 work/drugcards/build_cards.py 產生，勿手改。
 */
'use strict';

/* 藥理大類（台大分類的羅馬數字層）中文名；沒列到的照英文原名顯示。 */
const TOP_ZH = {
  'I. Analgesic Drugs': '止痛藥',
  'II. Psychopharmacologic Drugs': '精神科用藥',
  'III. Neurologic Drugs': '神經科用藥',
  'IV. Agents Used in Anesthesia': '麻醉用藥',
  'V. Musculoskeletal And Joint Diseases': '骨骼肌肉與關節用藥',
  'VIII. Enzyme': '酵素製劑',
  'VI. Cardiovascular-renal Drugs': '心血管與腎臟用藥',
  'VII. Nutritional Agents, Electrolytic, and Water Balance': '營養／電解質與水分平衡',
  'IX. Hematological Agents': '血液用藥',
  'X. Endocrine and Metabolic Agents': '內分泌與代謝用藥',
  'XI. Antiallergic Agents and Antihistamines': '抗過敏與抗組織胺',
  'XII. Respiratory Tract Drugs': '呼吸道用藥',
  'XIII. Gastrointestinal Agents': '腸胃道用藥',
  'XIV. Immunologic Agents and Vaccines': '免疫製劑與疫苗',
  'XV. Antineoplastic Agents': '抗腫瘤藥',
  'XVI. Antiinfective Agents': '抗微生物劑',
  'XVII. Urologic Agents': '泌尿道用藥',
  'XVIII. Antidotes in Poisoning': '中毒解毒劑',
  'XIX. Diagnostic Aids': '診斷用劑',
  'XX. Dental preparations': '牙科製劑',
  'XXI. Dermatological Preparations': '皮膚科製劑',
  'XXII. ENT Preparations': '耳鼻喉製劑',
  'XXIII. Ophthalmic Preparations': '眼科製劑',
  'XXIV. Miscellaneous': '其他',
  'XXV. Radiopharmaceuticals': '放射性藥品'
};

const IDX = window.DRUGDB_INDEX || [];
let curTop = '';        // 目前選的藥理大類（空字串＝全部）
let curCls = '';        // 目前選的機轉標籤
let curQ = '';          // 搜尋字串
let curSrc = '';        // 來源：'' 全部／'ntuh' 台大處方集／'ext' 非台大處方

const el = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* 商品名短名：劑型／含量之前的那幾個字即品牌名（前綴已於建置時清掉）
   （'Januvia FC Tablet, equivalent to sitagliptin 100 mg/tab' → 'Januvia'）。 */
const FORM_WORD = /\b(Tablets?|Capsules?|Injection|Solution|Soln|Syrup|Suspension|Powder|Granules?|Patch|Pen|Inhal\w*|Spray|Cream|Gel|Suppository|Effervescent|Lyo\w*|F\.?C\.?|Film-coated|Oral|SR|CR|MR|XR|ER|Sterile|for)\b/i;
function shortBrand(b) {
  const s = String(b || '').trim();
  const words = s.split(/\s+/);
  const out = [];
  for (const w of words) {
    if (out.length && (FORM_WORD.test(w) || /[\d,]/.test(w))) break;
    out.push(w);
    if (out.length >= 4) break;
  }
  return out.join(' ').replace(/[,，]$/, '') || s;
}

/* 台大對沒有中文品名的藥填「無正式中文名」，那是註記不是名字，不要當中文名顯示 */
const zhName = z => (!z || z.indexOf('無正式中文名') >= 0) ? '' : z;

/* ---------------- 清單與篩選 ---------------- */

const EXT_TAG = '非台大處方';
const ABX_TAG = '抗生素';
const isExt = d => (d.tags || []).indexOf(EXT_TAG) >= 0;
const isAbx = d => (d.tags || []).indexOf(ABX_TAG) >= 0;
/* 來源兩分：台大（處方集＋抗生素藥物查詢）／非台大處方。
   抗生素本來就是台大的資料，分成兩顆按鈕只是把同一個來源切開，
   還把來源列擠到超出螢幕寬；卡上的「抗生素」標籤已經分得出是哪一批。 */
const srcOf = d => isExt(d) ? 'ext' : 'ntuh';

function matches(d) {
  if (curSrc && srcOf(d) !== curSrc) return false;
  if (curTop && (d.tops || []).indexOf(curTop) < 0) return false;
  if (curCls && (d.cls || []).indexOf(curCls) < 0) return false;
  if (!curQ) return true;
  /* tags／atc 也進 hay：非台大處方那批用 tags 標來源、atc 帶 ATC 碼，
     不納進來就只有「說整句」查得到、這裡查不到，兩個搜尋欄行為會不一致 */
  const hay = [d.name, d.brand, d.zh, (d.cls || []).join(' '),
    (d.strengths || []).join(' '), (d.codes || [d.code]).join(' '),
    (d.tags || []).join(' '), (d.atc || []).join(' '), (d.alias || []).join(' ')]
    .join(' ').toLowerCase();
  return curQ.split(/\s+/).every(t => hay.indexOf(t) >= 0);
}

/* 來源列：台大處方集的卡與公開資料建的卡混在一起，欄位深度差很多
   （非台大那批沒有腎／肝／透析／CVVH／注射給藥指引），所以要能分開看。 */
function renderSrc() {
  const n = {};
  IDX.forEach(d => { n[srcOf(d)] = (n[srcOf(d)] || 0) + 1; });
  const opts = [['', '全部', IDX.length],
                ['ntuh', '台大處方', n.ntuh || 0],
                ['ext', '非台大處方', n.ext || 0]];
  el('db-src').innerHTML = opts.map(([v, label, n]) =>
    `<button class="db-src-btn ${curSrc === v ? 'active' : ''}" onclick="pickSrc('${v}')">
      ${label}<span>${n}</span></button>`).join('');
}

function renderTops() {
  const n = {};
  IDX.forEach(d => {
    if (curSrc && srcOf(d) !== curSrc) return;
    (d.tops || []).forEach(t => { n[t] = (n[t] || 0) + 1; });
  });
  const keys = Object.keys(n).sort((a, b) => n[b] - n[a]);
  const tot = IDX.filter(d => !curSrc || srcOf(d) === curSrc).length;
  el('db-tops').innerHTML =
    `<button class="db-cat ${curTop ? '' : 'active'}" onclick="pickTop('')">全部<span>${tot}</span></button>` +
    keys.map(t => `<button class="db-cat ${curTop === t ? 'active' : ''}" onclick="pickTop('${esc(t)}')">
      ${esc(TOP_ZH[t] || t)}<span>${n[t]}</span></button>`).join('');
}

/* 機轉標籤列：全庫上百個標籤會把清單擠到看不見，預設只露出最常見的十幾個，
   其餘收在「更多」後面；正在篩選中的標籤一定會顯示，否則按了自己就消失。 */
const CLS_SHOWN = 14;
let clsOpen = false;

function renderCls() {
  const n = {};
  IDX.forEach(d => {
    if (curSrc && srcOf(d) !== curSrc) return;
    if (curTop && (d.tops || []).indexOf(curTop) < 0) return;
    (d.cls || []).forEach(c => { n[c] = (n[c] || 0) + 1; });
  });
  const keys = Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b));
  if (keys.length < 2) { el('db-cls').innerHTML = ''; return; }
  const hidden = clsOpen ? 0 : Math.max(0, keys.length - CLS_SHOWN);
  const shown = clsOpen ? keys
    : keys.slice(0, CLS_SHOWN).concat(curCls && keys.indexOf(curCls) >= CLS_SHOWN ? [curCls] : []);
  el('db-cls').innerHTML =
    `<span class="db-cls-lbl">藥理機轉</span>` +
    `<button class="db-clschip ${curCls ? '' : 'active'}" onclick="pickCls('')">不限</button>` +
    shown.map(c => `<button class="db-clschip ${curCls === c ? 'active' : ''}" onclick="pickCls('${esc(c)}')"
      >${esc(c)}<span>${n[c]}</span></button>`).join('') +
    (hidden ? `<button class="db-clsmore" onclick="toggleCls()">更多 ${hidden} 種 ▾</button>`
            : (clsOpen ? `<button class="db-clsmore" onclick="toggleCls()">收合 ▴</button>` : ''));
}

function toggleCls() { clsOpen = !clsOpen; renderCls(); }

function pickSrc(v) {
  curSrc = v; curTop = ''; curCls = ''; clsOpen = false;
  renderSrc(); renderTops(); renderCls(); renderList();
}

function pickTop(t) { curTop = t; curCls = ''; clsOpen = false; renderTops(); renderCls(); renderList(); }
function pickCls(c) { curCls = c; renderCls(); renderList(); }
function onSearch(v) { curQ = (v || '').trim().toLowerCase(); renderList(); }

/* 抗生素卡的抗菌覆蓋徽章：收合狀態就要能判讀，所以畫在 <summary> 內。
   四級與抗生素頁同義：2＝強效／在地 %S ≥ 90（粗框）、1＝涵蓋、'p'＝部分（琥珀）、
   0＝不涵蓋（暗＋刪除線）。整組菌別都要列出——只列涵蓋的就看不出這支藥不涵蓋什麼。
   徽章順序由 index.js 的 covs 決定（＝抗生素頁 COV_LABELS 的順序），這裡不再排序。 */
const COV_TIER = { 2: 'sy-hi', 1: 'yes', p: 'partial' };
function covStrip(d) {
  if (d.catLabel) return `<div class="dc-cov"><span class="cov-tag cat">${esc(d.catLabel)}</span></div>`;
  if (!d.covs || !d.covs.length) return '';
  return `<div class="dc-cov">` + d.covs.map(c =>
    `<span class="cov-tag ${COV_TIER[c[1]] || 'no'}">${esc(c[0])}</span>`).join('') + `</div>`;
}

function renderList() {
  const hits = IDX.filter(matches);
  el('db-count').textContent = `${hits.length} 個品項` +
    (hits.length > 400 ? '（品項較多，可用上方分類或搜尋縮小範圍）' : '');
  // 同學名的品項排在一起，商品名為次序；未展開的卡片只畫標題列，展開時才載入該分類資料
  el('db-list').innerHTML = hits.map(d => {
    const badges = (d.strengths || []).map(s => `<span class="db-strength">${esc(s)}</span>`).join('');
    /* 「非台大處方」給不同底色——那批不是台大處方集，清單上要一眼分得出來 */
    const tags = (d.tags || []).map(t =>
      `<span class="db-tag${t === '非台大處方' ? ' db-tag-ext'
        : (t === '抗生素' ? ' db-tag-abx' : '')}">${esc(t)}</span>`).join('');
    return `
    <details class="drugcard" id="drug-${esc(d.code)}" data-pid="${d.pid}" data-code="${esc(d.code)}"
             data-codes="${esc((d.codes || [d.code]).join(' '))}" ontoggle="onCardToggle(this)">
      <summary>
        <span class="dc-name">${decodeEnt(esc(shortBrand(d.brand)))}</span>
        ${tags}
        ${zhName(d.zh) ? `<span class="dc-zh">${decodeEnt(esc(zhName(d.zh)))}</span>` : ''}
        ${badges}
        <span class="dc-nameen">${esc(d.name)}</span>
        ${(d.cls && d.cls[0])
          ? `<button type="button" class="dc-class" title="列出同機轉藥物"
               onclick="event.preventDefault();event.stopPropagation();pickCls('${esc(d.cls[0])}')"
             >${esc(d.cls[0])}</button>` : ''}
        ${covStrip(d)}
      </summary>
      <div class="dc-body"><div class="db-loading">載入中…</div></div>
    </details>`;
  }).join('') ||
    '<div class="db-empty">找不到符合的藥品。可改用學名、商品名或中文品名搜尋。</div>';
}

/* ---------------- 分類資料的延遲載入 ---------------- */

const loading = {};
function loadPid(pid) {
  window.DRUGDB_DATA = window.DRUGDB_DATA || {};
  if (window.DRUGDB_DATA[pid]) return Promise.resolve();
  if (loading[pid]) return loading[pid];
  loading[pid] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = `../data/drugs/${pid}.js`;
    s.onload = res;
    s.onerror = () => rej(new Error('load ' + pid));
    document.head.appendChild(s);
  });
  return loading[pid];
}

function onCardToggle(node) {
  if (!node.open || node.dataset.filled) return;
  const pid = node.dataset.pid, code = node.dataset.code;
  loadPid(pid).then(() => {
    const d = (window.DRUGDB_DATA[pid] || []).find(x => x.code === code);
    node.querySelector('.dc-body').innerHTML = d ? cardBody(d)
      : '<div class="db-empty">這個品項的明細尚未建檔。</div>';
    node.dataset.filled = '1';
  }).catch(() => {
    node.querySelector('.dc-body').innerHTML =
      '<div class="db-empty">明細載入失敗，請重新整理頁面。</div>';
  });
}

/* ---------------- 藥卡內容 ---------------- */

/* 欄位內文裡的網址（健保給付規定 PDF、食藥署仿單 PDF）做成可點的連結。
   一定要**先 esc() 再 linkify**——反過來等於讓資料內容注入 HTML。
   長網址直接印出來很難讀，所以認得出來的換成標籤，其餘才顯示原網址。 */
const NAMED_ENT = { ge: '≥', le: '≤', lt: '<', gt: '>', amp: '&', nbsp: ' ',
  emsp: ' ', ensp: ' ', reg: '®', copy: '©', deg: '°', times: '×', middot: '·',
  ndash: '–', mdash: '—', hellip: '…', plusmn: '±', micro: 'µ' };
function decodeEnt(html) {
  return html
    .replace(/&amp;#(\d{2,6});/g, (m, n) => {
      const c = Number(n);
      /* 私用區（Wingdings 項目符號那類）解出來是空白方框，不如留原樣 */
      if (c >= 0xE000 && c <= 0xF8FF) return '';
      return (c === 60 || c === 62 || c === 38) ? m : String.fromCodePoint(c);
    })
    .replace(/&amp;([a-z]{2,8});/gi, (m, name) => {
      const v = NAMED_ENT[name.toLowerCase()];
      return (v === undefined || v === '<' || v === '>' || v === '&') ? m : v;
    });
}
const URL_RE = /https?:\/\/[^\s，、）)】」"'<>]+/g;
function linkLabel(u) {
  if (/INAE3000.*getPDF/i.test(u)) return '給付規定 PDF';
  if (/mcp\.fda\.gov\.tw/i.test(u)) return '仿單 PDF';
  return u.length > 48 ? u.slice(0, 45) + '…' : u;
}
function linkify(text) {
  /* 實體解碼放在這裡而不是 richText：nhiRule 等欄位直接走 linkify，
     只掛在 richText 上會漏（Apixaban 的 ≥ 在給付規定欄仍是字面實體）。 */
  return decodeEnt(esc(text)).replace(URL_RE, u =>
    `<a href="${u}" target="_blank" rel="noopener" class="ref-link">${esc(linkLabel(u))}</a>`);
}

/* 台大原始資料在抗菌譜、懷孕分級等欄位用 <b> 排版。逐字 esc 會把標籤原樣印出來，
   所以比照 doseField 的做法：只放行 <b>／<i>／<br>，其餘一律轉義。 */
const TAG_OK = /&lt;(\/?)(b|i|br)\s*\/?&gt;/gi;
/* 台大原始頁面把符號寫成 HTML 實體（Apixaban 減量準則的 ≥／≤ 就是 &#8805;／&#8804;）。
   esc() 會把 & 轉成 &amp;，畫面就印出字面「&#8805;」，三個門檻的不等號全看不到。
   在渲染端一次解回真字元：只認數字實體與一小張具名表，不放行任何標籤。
   放在 esc() 之後、只還原成**文字符號**，不會破壞 esc→linkify 的安全順序。 */
function richText(t) {
  return linkify(t).replace(TAG_OK, (m, close, tag) =>
    `<${close}${tag.toLowerCase()}>`);
}

function field(label, text, warn) {
  if (!text || !String(text).trim()) return '';
  return `<div class="dc-field"><div class="dc-flabel">${label}</div>
    <div class="dc-ftext ${warn ? 'dc-warn' : ''}">${richText(text)}</div></div>`;
}

function rowTbl(label, rows, cols) {
  if (!rows || !rows.length) return '';
  /* 型別防線：同一個欄位在兩批資料裡型別不同（台大的 food 是字串、抗生素卡是
     物件陣列）。字串走 rows.map 會 throw，整張卡的 catch 只會顯示「明細載入失敗」——
     第十輪就是這樣一次打壞 129 張台大卡（warfarin、14 支胰島素、amiodarone…）。
     字串一律退回純文字欄位。 */
  if (typeof rows === 'string') return field(label, rows);
  if (!Array.isArray(rows)) return '';
  /* 表格內文也可能帶 <b>／<br>（台大 acyclovir 透析、foscarnet 腎功能就是），
     跟 field() 走同一套白名單，否則標籤會原樣印出來。 */
  const body = rows.map(r => cols.map(([k, t]) => r[k]
    ? `<tr><td>${t}</td><td>${richText(r[k])}</td></tr>` : '').join('')).join(
      rows.length > 1 ? '<tr class="tbl-sep"><td colspan="2"></td></tr>' : '');
  if (!body.replace(/<tr class="tbl-sep">.*?<\/tr>/g, '')) return '';
  return `<div class="dc-field"><div class="dc-flabel">${label}</div>
    <div class="dc-ftext"><table class="renal-tbl"><tbody>${body}</tbody></table></div></div>`;
}

/* 腎功能調整專用：**一個門檻一列**，不要一個欄位一列。

   rowTbl() 的通則（一欄位一列）在透析、CVVH、注射那幾欄是對的——那些欄位
   每一列的標籤都不同（HD 劑量／PD 劑量／給藥途徑／稀釋液…），一列一欄位讀起來
   就是一張鍵值表。但腎功能調整不是：它是「門檻 → 劑量」的對照，同一組標籤
   （CCr／建議劑量）會隨門檻數重複 N 次。Cefazolin 四個門檻就排成
       CCr｜CCr ≥55        建議劑量｜常規劑量
       CCr｜CCr 35–54      建議劑量｜常規劑量，間隔 ≥q8h        …
   共 8 列加 3 條分隔線；vancomycin／peramivir／colistin 有 8 個門檻，
   會長到 24 列。使用者實機回報「過於冗長」，並指名照 tools/antibiotics.html
   藥物查詢那張卡的編排——那邊的資料本來就是 {k, v} 一列一門檻（見
   js/antibiotics.js 的 renalField），四個門檻就是四列。這裡把 drug-database
   的 {ccr, dose, freq} 收斂成同一個形狀。

   套用條件（掃過全庫 1,343 張有 renal 的卡定出來的）：
     · 必須**每一列都有 ccr**——全庫 0 張卡是「有些列有門檻、有些沒有」，
       所以 any/all 不會出現灰色地帶；沒有門檻的（657 張只有 adjust、
       88 張只有 dose）本來就不是對照表，維持 rowTbl 原樣。
     · 必須**至少一列有 dose 或 freq**——另有 17 列是「有 ccr 但沒有劑量」
       （如 Luspatercept：adjust=N、ccr=eGFR 30-89，意思是這個範圍不用調），
       壓成一列會讓右欄空著只剩一個破折號，那比原樣還難讀，故退回 rowTbl。
     · adjust 只印**一列**，不逐門檻重複：全庫 0 張卡的 adjust 在同一張卡內
       有第二種值，所以去重是無損的。 */
function renalTbl(rows) {
  if (typeof rows === 'string') return field('腎功能調整', rows);
  if (!Array.isArray(rows) || !rows.length) return '';
  const cell = k => rows.some(r => r[k] && String(r[k]).trim());
  const everyCcr = rows.every(r => r.ccr && String(r.ccr).trim());
  if (!everyCcr || !(cell('dose') || cell('freq'))) {
    return rowTbl('腎功能調整', rows,
      [['adjust', '是否調整'], ['ccr', 'CCr'], ['dose', '建議劑量'], ['freq', '建議頻次']]);
  }
  const adj = [...new Set(rows.map(r => r.adjust).filter(x => x && String(x).trim()))];
  const head = adj.length
    ? `<tr><td>是否調整</td><td>${adj.map(richText).join('；')}</td></tr>` : '';
  /* dose 與 freq 併成同一格，中間用全形間隔號——台大原始資料裡這兩欄是
     「2.5 mg」＋「BID (1,2)」這種一句話被拆成兩欄的關係，不是兩件事。 */
  const body = rows.map(r => {
    const v = [r.dose, r.freq].filter(x => x && String(x).trim()).map(richText).join('　');
    return `<tr><td>${richText(r.ccr)}</td><td>${v}</td></tr>`;
  }).join('');
  return `<div class="dc-field"><div class="dc-flabel">腎功能調整</div>
    <div class="dc-ftext"><table class="renal-tbl renal-thr"><tbody>${head}${body}</tbody></table></div></div>`;
}

/* 台大在地感受性：一支藥動輒 15 個菌種，逐列排成表格會變成十幾張小表把整張卡洗掉。
   改成與 tools/antibiotics.html 的 abgSpectrum() 同一套徽章列——一菌一枚，級別
   由資料自帶（build_abx_cards.py 的 abg_tier）：≥90 粗框／80–89 亮／60–79 琥珀／
   <60 暗＋刪除線。菌株數放 title，不佔版面但查得到。 */
const ABG_TIER = { 2: 'sy-hi', 1: 'yes', p: 'partial' };
/* 台大報表收到 n≥5 的菌，廣效藥一支破百枚徽章會把常見菌淹掉；資料已依
   「常見致病菌／抗藥分層在前、長尾依株數遞減在後」排序，故切前 ABG_FOLD 枚，
   其餘按一下再展開。與 tools/antibiotics.html 的 covFold() 同一套。 */
const ABG_FOLD = 24;
let abgFoldSeq = 0;
function suscStrip(rows, proxy) {
  if (!rows || !rows.length) return '';
  const cells = rows.map(r =>
    `<span class="cov-tag ${ABG_TIER[r.t] || 'no'}"${r.n ? ` title="菌株數 ${esc(r.n)}"` : ''}
     >${esc(r.org)} ${esc(r.s)}</span>`);
  let body;
  if (cells.length <= ABG_FOLD) {
    body = `<div class="dc-cov">${cells.join('')}</div>`;
  } else {
    const id = 'dbabg' + (++abgFoldSeq);
    body = `<div class="dc-cov">${cells.slice(0, ABG_FOLD).join('')}`
      + `<span class="cov-tag" style="cursor:pointer" `
      + `onclick="document.getElementById('${id}').hidden=false;this.remove()">`
      + `＋還有 ${cells.length - ABG_FOLD} 種（依株數遞減）</span>`
      + `<span id="${id}" hidden>${cells.slice(ABG_FOLD).join('')}</span></div>`;
  }
  const cap = '台大 2026 上半年在地感受性 %S'
    + (proxy ? `（以 ${esc(proxy)} 為同類代表）` : '')
    + '　·　≥90 粗框 / 80–89 亮 / 60–79 琥珀 / &lt;60 暗　·　* ＝本期無資料、沿用 2025 上半年';
  return `<div class="dc-susc"><div class="dc-susc-cap">${cap}</div>${body}</div>`;
}

/* 抗菌譜與備註：文字譜與感受性徽章同屬一欄（抗生素頁就是這樣排的），
   拆成兩欄會讓「這支藥涵蓋什麼」被中間的欄名切斷。抗菌覆蓋那六／八枚旗標
   不在這裡重畫——清單摘要列已經有了（covStrip），與抗生素頁的版面一致。 */
function spectrumField(v) {
  const susc = suscStrip(v.abg, v.abgProxy);
  if (!v.spectrum && !susc) return '';
  return `<div class="dc-field"><div class="dc-flabel">抗菌譜與備註</div>
    <div class="dc-ftext">${v.spectrum ? richText(v.spectrum) : ''}${susc}</div></div>`;
}


/* 懷孕分級：台大有的寫字母（B、C(AUS)），有的只寫敘述，字母才做成徽章 */
function pregField(v) {
  if (!v) return '';
  const m = String(v).match(/^\s*([ABCDX]\d?)\s*([\s\S]*)$/);
  const grade = m ? m[1] : '';
  const note = (m ? m[2] : String(v)).replace(/^[;；,，\s]+/, '').trim();
  return `<div class="dc-field"><div class="dc-flabel">懷孕藥品分級</div><div class="dc-ftext">` +
    (grade ? `<span class="dc-preg">Category ${grade}</span>` : '') +
    (note ? `<span class="dc-pregnote">${richText(note)}</span>` : '') + `</div></div>`;
}

/* 常用劑量排版：台大原文是一整段英文（"PO with meals. Adults, ... ; ... . Children, ..."），
   一行讀完很吃力。逐字不刪，只在自然邊界插入換行／縮排，提高可讀性：
   · 給藥途徑（開頭到第一個句點）獨立一行、粗體。
   · 適應症標頭（"Xxx:"）另起一段、粗體。
   · 族群（Adults／Children／Neonates…）另起一行。
   · 句點與分號在括號外時斷句；分號視為同族群下的子項，縮排呈現。 */
const DOSE_ROUTE = /^(?:PO|IV|IM|SC|SL|PR|IN|IT|IO|ID|Top|Topical|Inhal\w*|Nebuli\w*|Intra\w*|Oral|Rectal|Buccal|Transdermal|Ophthalmic)\b[^.]*\./i;
const DOSE_POP = /\b(?:Adults?|Children|Child|Neonates?|Infants?(?:\s+and\s+children)?|Adolescents?|Elderly|Geriatric|Pediatric|Paediatric)\b[,:]/g;
const DOSE_HEADER = /(^|[.;]\s+)([A-Z][A-Za-z][A-Za-z0-9 /()\-,&]{1,60}?):\s+/g;
/* 台大原文偶爾**掉了句點**，新適應症的標頭直接黏在上一段的劑量後面：
     「…Children, 1 mg/kg; max. 6 mg/kg Edema: Slow IV or IM. Adults, 20-40 mg…」
   （Rasitol／furosemide，使用者實機回報）。DOSE_HEADER 要求標頭前面是行首、
   句點或分號，這種情形一個都接不到，於是「Edema:」被當成上一行的續句印在
   「max. 6 mg/kg」後面——畫面上 Edema 看起來像 Acute pulmonary edema 的內容，
   實際上它是同一層的適應症標頭。
   補一條：**數字＋單位**（可帶 /kg、/day 這種分母）之後緊接一個大寫標頭時，
   視為掉了句點的段落邊界。左邊界原樣留著（`$1` 回填），不新增任何字元。
   全庫 1,581 段走 fmtDose 的劑量字串實測只命中 30 處、11 種標頭，逐一看過
   都是真的掉句點：furosemide 的 Edema、albumin 的 Hypoproteinemia、
   medroxyprogesterone 的兩個癌別、lidocaine 的 Transtracheal injection、
   protamine 的 Antagonise heparin infusion，其餘是被壓平的表格（NOTE:／
   Vial B contains:），做成標頭也不會更差。 */
const DOSE_UNIT = '(?:mg|g|mcg|µg|ug|ng|kg|mL|ml|L|U|IU|KIU|units?|mmol|mEq|%|hrs?|mins?|days?|wks?|mos?|yrs?)';
const DOSE_DROP = new RegExp(
  '(\\d[\\d.,–\\-]*\\s*' + DOSE_UNIT + '(?:/[A-Za-z²]+)*)\\s+' +
  '([A-Z][A-Za-z][A-Za-z0-9 /()\\-,&]{1,60}?):\\s+', 'g');
/* 給藥方式／劑量階段的標籤（Continuous infusion、Loading dose…）：它們前面
   確實有句點，DOSE_HEADER 接得到，但**它們不是適應症**——furosemide 的
   「Continuous infusion」是 Edema 底下的給法之一，做成與 Acute pulmonary
   edema、Edema 同級的粗體段標，就把層級講錯了（使用者實機回報）。
   改判成子層 .dl-stage：字仍然是粗的（它是個標籤），但縮排、不占段標的
   上下留白，讀起來就是「上一個適應症底下的一種給法」。
   形狀限定為「階段詞 ＋ dose／infusion」，可帶一個括號補述；全庫實測命中
   38 處、11 種（Maintenance dose 16、Initial dose 8、Loading dose 5、
   Continuous infusion 5、Usual Dose 4…），沒有一個是適應症。
   刻意**不**收 Low／Moderate／High dose、Total daily dose、Pediatric dose、
   Test dose for oliguria… 那些帶了額外語意或本來就可以當段標的字串。 */
const DOSE_STAGE = /^(?:continuous|intermittent|loading|maintenance|initial|usual|starting|subsequent|single|target)\s+(?:iv\s+|slow\s+)?(?:dose|infusion)(?:\s*\([^)]*\))?$/i;
// 這些「單字＋句點」是劑量修飾語或縮寫，不視為句尾，不在其後斷行
const DOSE_ABBR = new Set(['max', 'min', 'approx', 'appro', 'no', 'cf', 'viz', 'etc',
  'wk', 'wks', 'hr', 'hrs', 'mo', 'mos', 'yr', 'yrs']);

function fmtDose(text) {
  /* 先解實體再斷句：分號是斷句符號，而數字實體正好以分號結尾，
     `Scr &#8805; 1.5 mg/dL` 會被切成 `Scr &amp;#8805` ＋ 斷行，門檻的 ≥ 直接消失。
     目前 0 例（唯一在 dose 帶實體的走 <br> 分支），但這是顆地雷。 */
  text = decodeEnt(esc(String(text == null ? '' : text)))
    .replace(/&amp;/g, '\u0000AMP\u0000').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/\u0000AMP\u0000/g, '&');
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  let head = '';
  const rm = t.match(DOSE_ROUTE);
  if (rm) { head = rm[0].trim(); t = t.slice(rm[0].length).trim(); }

  // 以 †(適應症標頭) 與 ‡(族群) 作為換行標記，稍後轉成 HTML；標記字元本身不出現在資料裡
  /* 掉句點的邊界先補標記。必須在 DOSE_HEADER **之前**跑：跑完之後那個標頭前面
     是「† 」而不是句點，DOSE_HEADER 的 (^|[.;]\s+) 接不到它，不會重複標記。 */
  t = t.replace(DOSE_DROP, (m, lead, h) => `${lead} †${h}: `);
  t = t.replace(DOSE_HEADER, (m, pre, h) => `${pre}†${h}: `);
  t = t.replace(DOSE_POP, m => `‡${m}`);

  // 在括號外的句點後斷段。不切開：小數（後面非空白）、以及縮寫（句點前的字母詞
  // ≤ 2 字母，如 q.d.／e.g.／vs.／i.e.）。整段句點前是完整單字（day.／wks.）才斷。
  const segs = [];
  let cur = '', depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '(' || c === '（') depth++;
    else if (c === ')' || c === '）') depth = Math.max(0, depth - 1);
    cur += c;
    if (c === '.' && depth === 0 && /\s/.test(t[i + 1] || ' ')) {
      const lw = (cur.slice(0, -1).match(/[A-Za-z]+$/) || [''])[0];
      if ((lw.length === 0 || lw.length > 2) && !DOSE_ABBR.has(lw.toLowerCase())) {
        segs.push(cur.trim()); cur = '';
      }
    }
  }
  if (cur.trim()) segs.push(cur.trim());

  let html = head ? `<div class="dl-head">${richText(head)}</div>` : '';
  segs.forEach(seg => {
    seg.split('†').forEach((chunk, ci) => {
      chunk = chunk.trim();
      if (!chunk) return;
      if (ci > 0) {                                  // 適應症標頭：Xxx: rest
        const mi = chunk.indexOf(':');
        const label = chunk.slice(0, mi).replace(/[‡†]/g, '').trim();
        // 給藥方式／劑量階段降一層，不與適應症同級（見 DOSE_STAGE 的說明）
        html += `<div class="${DOSE_STAGE.test(label) ? 'dl-stage' : 'dl-sect'}">${richText(label)}</div>`;
        chunk = chunk.slice(mi + 1).trim();
        if (!chunk) return;
      }
      // 族群拆行；每個族群再依 ; 斷成子項
      chunk.split('‡').forEach(part => {
        part = part.trim().replace(/^[;,]\s*/, '');
        if (!part) return;
        const bits = [];
        part.split(/;\s+/).forEach(seg => {
          seg = seg.trim();
          if (!seg) return;
          // 以比較／體重帶或 "or" 開頭的子句，是上一段的同群劑量帶（如
          // "≦ 60 kg, 50 mg tid; > 60 kg, 100 mg tid"），接回同一行、不另立子項
          if (bits.length && /^(?:[<>≤≥≦≧]|or\b)/.test(seg))
            bits[bits.length - 1] += '；' + seg;
          else bits.push(seg);
        });
        html += `<div class="dl-line">${richText(bits[0])}</div>`;
        for (let k = 1; k < bits.length; k++)
          html += `<div class="dl-sub">${richText(bits[k])}</div>`;
      });
    });
  });
  return `<div class="dose-fmt">${html}</div>`;
}

function doseField(text) {
  if (!text || !String(text).trim()) return '';
  /* 抗生素頁的劑量原文用 <br> 排版（台大原始資料就是這樣寫的），
     fmtDose 是為台大處方集那種一整段英文設計的，套上去會把 <br> 當內文。
     含標籤的走簡單路徑：只放行 <br>，其餘一律轉義。 */
  if (/<br\s*\/?>/i.test(text)) {
    return `<div class="dc-field"><div class="dc-flabel">常用劑量</div>
      <div class="dc-ftext">${richText(text)}</div></div>`;
  }
  return `<div class="dc-field"><div class="dc-flabel">常用劑量</div>
    <div class="dc-ftext">${fmtDose(text)}</div></div>`;
}

/* 輸注流速調整（nomogram）：資料在 data/drugs/extras.js 的手寫補充層，以藥品八碼掛在
   **單一規格**上——同一張卡的封管沖洗液、透析用抗凝血劑不能照這張表調流速。

   不走 rowTbl：那是「標籤｜內容」的兩欄鍵值表，這裡是五欄對照表，一列＝一個檢驗
   區間，欄名是共用表頭而不是每列重複的標籤。表頭壓成兩欄會把「anti-Xa 0.3–0.7 對
   應 aPTT 60–85」這個同列關係拆散，那正是這張表唯一要傳達的事。 */
function titrateField(code) {
  const ex = (window.DRUGDB_EXTRA || {})[code];
  if (!ex || !ex.titrate || !ex.titrate.length) return '';
  const tables = ex.titrate.map(t => `
    <div class="dc-titr">
      <div class="dc-titr-cap">${esc(t.title)}${t.sub ? `<span>${esc(t.sub)}</span>` : ''}</div>
      <div class="dc-titr-wrap"><table class="titr-tbl">
        <thead><tr><th>anti-Xa<br>(U/mL)</th><th>aPTT<br>(sec)</th><th>Bolus</th>
          <th>停輸注</th><th>流速調整</th></tr></thead>
        <tbody>${(t.rows || []).map(r =>
          `<tr class="${r.hi ? 'titr-hi' : ''}"><td>${esc(r.x)}</td><td>${esc(r.a)}</td>` +
          `<td>${esc(r.b)}</td><td>${esc(r.s)}</td><td>${esc(r.r)}</td></tr>`).join('')}
        </tbody></table></div>
    </div>`).join('');
  return `<div class="dc-field"><div class="dc-flabel">輸注流速調整</div>
    <div class="dc-ftext">${tables}
      ${ex.titrateNote ? `<div class="dc-titr-note">${richText(ex.titrateNote)}</div>` : ''}
      ${ex.titrateSrc ? `<div class="db-food-src">來源：${esc(ex.titrateSrc)}</div>` : ''}
    </div></div>`;
}

/* 單一規格（variant）的明細欄位 */
function variantBody(v) {
  const price = [v.nhi ? `健保 NT$ ${esc(v.nhi)}` : '', v.selfpay ? `自費 NT$ ${esc(v.selfpay)}` : '']
    .filter(Boolean).join('　·　');
  return `
    ${field('商品名／含量', v.brand)}
    ${photoField(v)}
    ${doseField(v.dose)}
    ${titrateField(v.code)}
    ${field('最大劑量', v.maxDose)}
    ${field('兒科劑量', v.peds)}
    ${rowTbl('剝半／磨粉／管餵', v.crush, [['h', '剝半'], ['c', '磨粉'], ['t', '管餵'],
      ['cap', '膠囊可打開'], ['why', '說明'], ['note', '備註']])}
    ${renalTbl(v.renal)}
    ${rowTbl('肝功能調整', v.hepatic, [['adjust', '是否調整'], ['dose', '調整建議']])}
    ${rowTbl('透析劑量', v.dialysis, [['form', '劑型'], ['hd_dose', 'HD 劑量'], ['hd_removal', 'HD 移除比例'], ['hd_supp', 'HD 後補充'],
      ['pd_dose', 'PD 劑量'], ['pd_removal', 'PD 移除比例'], ['pd_supp', 'PD 後補充'], ['remark', '備註']])}
    ${rowTbl('CVVH／CRRT 劑量', v.cvvh, [['cvvh', 'CVVH'], ['cvvhd', 'CVVHD'], ['cvvhdf', 'CVVHDF'], ['remark', '備註']])}
    ${rowTbl('注射給藥指引', v.injection, [['route', '給藥途徑'], ['reconstitute', '溶解液及體積'],
      ['diluent', '稀釋液及體積'], ['volume', '體積（每劑／每瓶）'], ['conc', '給藥濃度'],
      ['time', '輸注時間／速率'], ['alt_routes', '替代給藥途徑'], ['notes', '注意事項'],
      ['storage', '原包裝儲存'], ['stab_recon', '溶解後安定性'], ['stab_dilute', '稀釋後安定性'],
      ['container', '容器相容性'], ['stab_note', '安定性備註']])}
    ${rowTbl('延長輸注建議（重症／ICU · 4 小時）', v.eif, [['when', '建議時機'],
      ['solvent', '溶劑／最高濃度／安定性'], ['ld', 'Loading dose'],
      ['md', 'Maintenance dose（依 CLCr）'], ['note', '備註']])}
    ${pregField(v.preg)}
    ${field('口服生體可用率 Bioavailability', v.bioav)}
    ${field('分布 / 組織穿透 Distribution', v.dist)}
    ${field('代謝途徑', v.metab)}
    ${spectrumField(v)}
    ${v.ctrl ? field('管制藥品分級', v.ctrl) : ''}
    ${field('適應症（衛福部許可證）', v.ind)}
    ${field('藥理作用', v.action)}
    ${field('副作用', v.adverse)}
    ${field('禁忌', v.contra, true)}
    ${field('安全警訊', v.alert, true)}
    ${rowTbl('飲食交互作用', v.food, [['f', '食品'], ['s', '嚴重度'],
      ['e', '影響'], ['m', '處置']])}
    ${field('儲存條件', v.storage)}
    ${field('備註', v.note)}
    ${v.nhiRule ? `<div class="dc-field"><div class="dc-flabel">健保給付規定（節錄）</div>
       <div class="dc-ftext db-nhi">${linkify(v.nhiRule)}</div></div>` : ''}
    ${field('藥品外觀', v.look)}
    ${field('藥商', v.company)}
    ${price ? field('藥價', price) : ''}
    <div class="db-foot">${v.src
      ? `${esc(v.src)}　·　分類：${esc(v.cat || '')}`
      : `藥品八碼 ${esc(v.code)}　·　台大分類：${esc(v.cat || '')}`}</div>`;
}

/* Liverpool 交互作用查核外連。
   University of Liverpool 的使用條款禁止重製與衍生（"No modification, reproduction,
   re-use, further distribution or transmission in any form is allowed, including
   creation of derivative works, without our prior written consent"），所以這裡
   只做導流、不落地任何他們的資料。
   他們的 checker 是「主要藥（ARV／DAA／腫瘤藥）× 併用藥」的結構，掛在降血壓藥之類的
   卡上只是雜訊，因此僅在該卡本身可能是主要藥時才出現。
   注意 checker 不吃網址參數（前端沒有任何 $location.search() 處理），只能落在查詢頁，
   所以按鈕文案要讓使用者知道到站後仍需自己選藥。 */
const LP_ARV = /(tenofovir|emtricitabine|lamivudine|abacavir|zidovudine|dolutegravir|raltegravir|bictegravir|efavirenz|rilpivirine|nevirapine|doravirine|darunavir|atazanavir|lopinavir|ritonavir|cobicistat|maraviroc|etravirine|cabotegravir|lenacapavir|fostemsavir|elvitegravir)/i;
/* interferon 要挑掉 beta-1a（多發性硬化症）與 ropeginterferon alfa-2b（真性紅血球增多症），
   那兩個不是肝炎用藥。beta 靠限定 alfa 排除；ropeginterferon 因為字串本身含
   「peginterferon alfa」，得再擋一次詞首（不用 lookbehind，iOS Safari 舊版不支援）。 */
const LP_HEP = /(sofosbuvir|velpatasvir|ledipasvir|glecaprevir|pibrentasvir|elbasvir|grazoprevir|daclatasvir|voxilaprevir|ribavirin|entecavir|(^|[^a-z])peginterferon alfa)/i;

/* COVID 抗病毒藥。Paxlovid（Nirmatrelvir/Ritonavir）的 ritonavir 只是藥動 booster，
   不是拿來治 HIV 的——照 LP_ARV 判會被送到 HIV checker，但它該去 COVID checker。
   所以 COVID 先判，命中就不再掛 HIV。單獨的 ritonavir（HIV booster）不受影響。 */
const LP_COVID = /(nirmatrelvir|molnupiravir|remdesivir|ensitrelvir|paxlovid)/i;

function liverpoolLinks(d) {
  const n = d.name || '';
  const sites = [];
  const isCovid = LP_COVID.test(n);
  if (isCovid) sites.push(['COVID', 'https://www.covid19-druginteractions.org/checker']);
  if (!isCovid && LP_ARV.test(n)) sites.push(['HIV', 'https://www.hiv-druginteractions.org/checker']);
  if (LP_HEP.test(n)) sites.push(['肝炎', 'https://www.hep-druginteractions.org/checker']);
  if ((d.tops || []).some(t => /Antineoplastic/i.test(t)))
    sites.push(['腫瘤', 'https://cancer-druginteractions.org/']);
  if (!sites.length) return '';
  const links = sites.map(([label, url]) =>
    `<a href="${url}" target="_blank" rel="noopener" class="db-lpbtn">Liverpool ${label} checker</a>`
  ).join('');
  return `<div class="dc-field"><div class="dc-flabel">交互作用查核（外部）</div>
    <div class="dc-ftext db-lp">${links}
    <span class="db-lpnote">University of Liverpool 維護，紅黃綠燈分級。
      到站後請自行選取本藥與併用藥；資料留在對方網站，本站未收錄。</span></div></div>`;
}

/* DDInter 的飲食交互作用。
   **跟台大自己的「飲食交互作用」欄分開顯示，不合併。** 台大那一欄（v.food）
   是院方資料、只有 182 個規格有且很簡略（例「檳榔 [4]」）；這一區是外部來源、
   含完整機轉與處置。依台大資料優先的原則，兩者不一致時以台大為準，
   所以這裡標明來源、擺在台大那欄之後，讓人分得出誰是誰。
   資料在 data/ddi/food-cards.js（約 0.9 MB，以藥卡學名為鍵），
   本頁不載 4.7 MB 的交互作用總索引。 */
const DDI_LV = ['未分級', 'Minor 輕度', 'Moderate 中度', 'Major 重大'];
const DDI_PIPS = ['▫▫▫', '◼▫▫', '◼◼▫', '◼◼◼'];

function ddiFoodField(d) {
  const rows = (window.DDI_FOOD_CARDS || {})[d.name];
  if (!rows || !rows.length) return '';
  const items = rows.map(r => `
    <details class="db-food">
      <summary>
        <span class="db-food-lv lv-${r.lv}">${DDI_PIPS[r.lv]} ${esc(DDI_LV[r.lv])}</span>
        <span class="db-food-n">${esc(r.n)}</span>
        ${rows.some(x => x.d !== r.d) ? `<span class="db-food-d">對 ${esc(r.d)}</span>` : ''}
      </summary>
      <div class="db-food-b">
        ${r.i ? `<div class="db-food-l">機轉</div><div class="db-food-t">${esc(r.i)}</div>` : ''}
        ${r.m ? `<div class="db-food-l">處置</div><div class="db-food-t mg">${esc(r.m)}</div>` : ''}
      </div>
    </details>`).join('');
  return `<div class="dc-field"><div class="dc-flabel">飲食交互作用（DDInter）</div>
    <div class="dc-ftext">${items}
      <div class="db-food-src">來源 DDInter 2.0（CC BY-NC-SA 4.0），非台大藥劑部資料；
        與上方台大「飲食交互作用」欄不一致時，以台大為準。
        <a href="ddi.html" class="ref-link">完整交互作用查核 →</a></div>
    </div></div>`;
}

/* ---------------- 藥品外觀照 ----------------
 *
 * 照片**直接外連台大藥劑部原站**，一張都不落地：
 *   縮圖 DrugImage/New/s/<八碼>-<A..D>.jpg （約 180×120、9 KB）
 *   原圖 DrugImage/New/<八碼>-<A..D>.jpg   （1536 px、300 KB，點開才載）
 * 這樣做的三個理由：(1) 4642 張原圖共 1.4 GB，放進 repo 不可能；(2) 照片是台大拍的
 * 攝影著作，本 repo 是公開的，外連＝不重製、不散布；(3) 新的藥理分類匯入後，
 * 圖片網址靠藥碼就拼得出來，不必重抓、不必轉檔。
 *
 * 代價是離線看不到照片（其餘欄位仍離線可用），所以載入失敗時要留一句說明而不是破圖。
 * sw.js 只攔同源請求，這些跨網域圖片走瀏覽器自己的 HTTP 快取，看過就不會再抓。
 *
 * 只認 data/drugs/images.js 對照表裡的藥碼——非台大處方（x-*）與抗生素卡（abx）的
 * code 不是台大八碼，樂觀嘗試只會打出一堆 404。新分類匯入後跑一次
 * workspace/work/ntuh-drug-images/probe_codes.py 就會把新藥碼併進對照表。 */
const NTUH_IMG = 'https://dept.ntuh.gov.tw/phar/DrugImage/New/';

function imgUrl(code, sfx, big) {
  return NTUH_IMG + (big ? '' : 's/') + encodeURIComponent(code + '-' + sfx + '.jpg');
}

function photoField(v) {
  const sfxs = (window.DRUG_IMAGES || {})[v.code];
  if (!sfxs) return '';
  const shots = [...sfxs].map((s, i) => `
    <button type="button" class="db-shot" onclick="openShot('${esc(v.code)}','${sfxs}',${i})"
            aria-label="放大第 ${i + 1} 張外觀照">
      <img src="${imgUrl(v.code, s)}" alt="${esc(v.brand || v.name || '')} 外觀照 ${i + 1}"
           decoding="async" onerror="this.closest('.db-shot').hidden=true">
    </button>`).join('');
  return `<div class="dc-field"><div class="dc-flabel">藥品外觀照</div>
    <div class="dc-ftext"><div class="db-shots">${shots}</div>
      <div class="db-shots-src">台大醫院藥劑部原站照片（點圖放大）·　需連線</div></div></div>`;
}

/* 燈箱：全頁覆蓋、載原圖。多張時可左右切換。 */
function openShot(code, sfxs, i) {
  let box = el('db-lightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'db-lightbox';
    box.className = 'db-lightbox';
    box.innerHTML = `
      <button type="button" class="db-lb-close" aria-label="關閉">×</button>
      <button type="button" class="db-lb-nav db-lb-prev" aria-label="上一張">‹</button>
      <img class="db-lb-img" alt="">
      <button type="button" class="db-lb-nav db-lb-next" aria-label="下一張">›</button>
      <div class="db-lb-cap"></div>`;
    document.body.appendChild(box);
    // 點背景（不是圖或按鈕）關閉
    box.addEventListener('click', (e) => { if (e.target === box) closeShot(); });
    box.querySelector('.db-lb-close').onclick = closeShot;
    box.querySelector('.db-lb-prev').onclick = () => stepShot(-1);
    box.querySelector('.db-lb-next').onclick = () => stepShot(1);
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('db-lb-open')) return;
      if (e.key === 'Escape') closeShot();
      if (e.key === 'ArrowLeft') stepShot(-1);
      if (e.key === 'ArrowRight') stepShot(1);
    });
  }
  box.dataset.code = code;
  box.dataset.sfxs = sfxs;
  document.body.classList.add('db-lb-open');   // 鎖住背景捲動
  showShot(i);
}

function showShot(i) {
  const box = el('db-lightbox');
  const sfxs = box.dataset.sfxs, code = box.dataset.code;
  const n = sfxs.length;
  i = (i + n) % n;
  box.dataset.i = i;
  const img = box.querySelector('.db-lb-img');
  img.src = imgUrl(code, sfxs[i], true);
  img.alt = `${code} 外觀照 ${i + 1}／${n}`;
  // 原圖 300 KB，離線或台大站臨時不通時要講清楚，不要留一個破圖框
  img.onerror = () => { box.querySelector('.db-lb-cap').textContent = '照片載入失敗——需要連線才看得到台大原站的照片'; };
  box.querySelector('.db-lb-cap').textContent = n > 1 ? `${i + 1} / ${n}　·　${code}` : code;
  box.querySelectorAll('.db-lb-nav').forEach(b => { b.hidden = n < 2; });
}

function stepShot(d) {
  const box = el('db-lightbox');
  showShot(Number(box.dataset.i || 0) + d);
}

function closeShot() {
  document.body.classList.remove('db-lb-open');
  const box = el('db-lightbox');
  if (box) box.querySelector('.db-lb-img').removeAttribute('src');  // 停掉還在下載的原圖
}

/* 整張藥卡：共用表頭（學名／機轉／劑型）＋各規格分頁。單一規格則不顯示分頁。 */
function cardBody(d) {
  const cls = (d.cls || []).map(c => `<span class="db-moa">${esc(c)}</span>`).join('');
  const header = `
    ${field('學名', d.name)}
    ${cls ? `<div class="dc-field"><div class="dc-flabel">藥理機轉</div>
       <div class="dc-ftext db-moas">${cls}</div></div>` : ''}
    ${field('劑型', d.form)}
    ${liverpoolLinks(d)}
    ${ddiFoodField(d)}`;
  const vs = (d.variants || []).map(v => ({ cat: d.cat, ...v }));
  if (vs.length <= 1) return header + (vs[0] ? variantBody(vs[0]) : '');

  // 多規格：以含量分頁，避免不同劑量的劑量／腎肝調整混在一起看不清
  const labels = uniqueLabels(vs);
  const tabs = vs.map((v, i) =>
    `<button type="button" class="db-vtab ${i === 0 ? 'active' : ''}"
       onclick="switchVariant(this, ${i})">${esc(labels[i])}</button>`).join('');
  const panes = vs.map((v, i) =>
    `<div class="db-vpane ${i === 0 ? '' : 'hidden'}">${variantBody(v)}</div>`).join('');
  return header +
    `<div class="db-vtabs"><span class="db-vtabs-lbl">含量規格</span>${tabs}</div>
     <div class="db-vpanes">${panes}</div>`;
}

// 分頁標籤＝含量；若重複或缺漏，補上序號以維持唯一
function uniqueLabels(vs) {
  const seen = {};
  return vs.map((v, i) => {
    let s = v.strength || ('規格 ' + (i + 1));
    if (seen[s]) s += ' ·' + (++seen[s]); else seen[s] = 1;
    return s;
  });
}

function switchVariant(btn, i) {
  const card = btn.closest('.dc-body');
  card.querySelectorAll('.db-vtab').forEach((b, k) => b.classList.toggle('active', k === i));
  card.querySelectorAll('.db-vpane').forEach((p, k) => p.classList.toggle('hidden', k !== i));
}

/* ---------------- 進場 ---------------- */

// 網址帶 #code=XXXX 時直接展開該藥卡（合併後一張卡含多個八碼，任一皆可連進來）
function applyHash() {
  const m = location.hash.match(/#code=([A-Za-z0-9 %]+)/);
  if (!m) return;
  const code = decodeURIComponent(m[1]).trim();
  let card = el('drug-' + code);
  if (!card) card = [...document.querySelectorAll('.drugcard')]
    .find(c => (c.dataset.codes || '').split(' ').indexOf(code) >= 0);
  if (card) { card.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

renderSrc();
renderTops();
renderCls();
renderList();
applyHash();
window.addEventListener('hashchange', applyHash);
