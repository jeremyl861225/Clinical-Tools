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
  'VI. Cardiovascular-renal Drugs': '心血管與腎臟用藥',
  'IX. Hematological Agents': '血液用藥',
  'X. Endocrine and Metabolic Agents': '內分泌與代謝用藥',
  'XI. Antiallergic Agents and Antihistamines': '抗過敏與抗組織胺',
  'XII. Respiratory Tract Drugs': '呼吸道用藥',
  'XIII. Gastrointestinal Agents': '腸胃道用藥',
  'XIV. Immunologic Agents and Vaccines': '免疫製劑與疫苗',
  'XVI. Antiinfective Agents': '抗微生物劑',
  'XVII. Urologic Agents': '泌尿道用藥',
  'XVIII. Antidotes in Poisoning': '中毒解毒劑',
  'XX. Dental preparations': '牙科製劑',
  'XXI. Dermatological Preparations': '皮膚科製劑',
  'XXIII. Ophthalmic Preparations': '眼科製劑'
};

const IDX = window.DRUGDB_INDEX || [];
let curTop = '';        // 目前選的藥理大類（空字串＝全部）
let curCls = '';        // 目前選的機轉標籤
let curQ = '';          // 搜尋字串

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

function matches(d) {
  if (curTop && (d.tops || []).indexOf(curTop) < 0) return false;
  if (curCls && (d.cls || []).indexOf(curCls) < 0) return false;
  if (!curQ) return true;
  const hay = [d.name, d.brand, d.zh, (d.cls || []).join(' '),
    (d.strengths || []).join(' '), (d.codes || [d.code]).join(' ')]
    .join(' ').toLowerCase();
  return curQ.split(/\s+/).every(t => hay.indexOf(t) >= 0);
}

function renderTops() {
  const n = {};
  IDX.forEach(d => (d.tops || []).forEach(t => { n[t] = (n[t] || 0) + 1; }));
  const keys = Object.keys(n).sort((a, b) => n[b] - n[a]);
  el('db-tops').innerHTML =
    `<button class="db-cat ${curTop ? '' : 'active'}" onclick="pickTop('')">全部<span>${IDX.length}</span></button>` +
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

function pickTop(t) { curTop = t; curCls = ''; clsOpen = false; renderTops(); renderCls(); renderList(); }
function pickCls(c) { curCls = c; renderCls(); renderList(); }
function onSearch(v) { curQ = (v || '').trim().toLowerCase(); renderList(); }

function renderList() {
  const hits = IDX.filter(matches);
  el('db-count').textContent = `${hits.length} 個品項` +
    (hits.length > 400 ? '（品項較多，可用上方分類或搜尋縮小範圍）' : '');
  // 同學名的品項排在一起，商品名為次序；未展開的卡片只畫標題列，展開時才載入該分類資料
  el('db-list').innerHTML = hits.map(d => {
    const badges = (d.strengths || []).map(s => `<span class="db-strength">${esc(s)}</span>`).join('');
    const tags = (d.tags || []).map(t => `<span class="db-tag">${esc(t)}</span>`).join('');
    return `
    <details class="drugcard" id="drug-${esc(d.code)}" data-pid="${d.pid}" data-code="${esc(d.code)}"
             data-codes="${esc((d.codes || [d.code]).join(' '))}" ontoggle="onCardToggle(this)">
      <summary>
        <span class="dc-name">${esc(shortBrand(d.brand))}</span>
        ${tags}
        ${zhName(d.zh) ? `<span class="dc-zh">${esc(zhName(d.zh))}</span>` : ''}
        ${badges}
        <span class="dc-nameen">${esc(d.name)}</span>
        ${(d.cls && d.cls[0])
          ? `<button type="button" class="dc-class" title="列出同機轉藥物"
               onclick="event.preventDefault();event.stopPropagation();pickCls('${esc(d.cls[0])}')"
             >${esc(d.cls[0])}</button>` : ''}
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

function field(label, text, warn) {
  if (!text || !String(text).trim()) return '';
  return `<div class="dc-field"><div class="dc-flabel">${label}</div>
    <div class="dc-ftext ${warn ? 'dc-warn' : ''}">${esc(text)}</div></div>`;
}

function rowTbl(label, rows, cols) {
  if (!rows || !rows.length) return '';
  const body = rows.map(r => cols.map(([k, t]) => r[k]
    ? `<tr><td>${t}</td><td>${esc(r[k])}</td></tr>` : '').join('')).join(
      rows.length > 1 ? '<tr class="tbl-sep"><td colspan="2"></td></tr>' : '');
  if (!body.replace(/<tr class="tbl-sep">.*?<\/tr>/g, '')) return '';
  return `<div class="dc-field"><div class="dc-flabel">${label}</div>
    <div class="dc-ftext"><table class="renal-tbl"><tbody>${body}</tbody></table></div></div>`;
}

/* 懷孕分級：台大有的寫字母（B、C(AUS)），有的只寫敘述，字母才做成徽章 */
function pregField(v) {
  if (!v) return '';
  const m = String(v).match(/^\s*([ABCDX]\d?)\s*([\s\S]*)$/);
  const grade = m ? m[1] : '';
  const note = (m ? m[2] : String(v)).replace(/^[;；,，\s]+/, '').trim();
  return `<div class="dc-field"><div class="dc-flabel">懷孕藥品分級</div><div class="dc-ftext">` +
    (grade ? `<span class="dc-preg">Category ${grade}</span>` : '') +
    (note ? `<span class="dc-pregnote">${esc(note)}</span>` : '') + `</div></div>`;
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
// 這些「單字＋句點」是劑量修飾語或縮寫，不視為句尾，不在其後斷行
const DOSE_ABBR = new Set(['max', 'min', 'approx', 'appro', 'no', 'cf', 'viz', 'etc',
  'wk', 'wks', 'hr', 'hrs', 'mo', 'mos', 'yr', 'yrs']);

function fmtDose(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  let head = '';
  const rm = t.match(DOSE_ROUTE);
  if (rm) { head = rm[0].trim(); t = t.slice(rm[0].length).trim(); }

  // 以 †(適應症標頭) 與 ‡(族群) 作為換行標記，稍後轉成 HTML；標記字元本身不出現在資料裡
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

  let html = head ? `<div class="dl-head">${esc(head)}</div>` : '';
  segs.forEach(seg => {
    seg.split('†').forEach((chunk, ci) => {
      chunk = chunk.trim();
      if (!chunk) return;
      if (ci > 0) {                                  // 適應症標頭：Xxx: rest
        const mi = chunk.indexOf(':');
        html += `<div class="dl-sect">${esc(chunk.slice(0, mi).replace(/[‡†]/g, '').trim())}</div>`;
        chunk = chunk.slice(mi + 1).trim();
        if (!chunk) return;
      }
      // 族群拆行；每個族群再依 ; 斷成子項
      chunk.split('‡').forEach(part => {
        part = part.trim().replace(/^[;,]\s*/, '');
        if (!part) return;
        const bits = part.split(/;\s+/);
        html += `<div class="dl-line">${esc(bits[0])}</div>`;
        for (let k = 1; k < bits.length; k++)
          if (bits[k].trim()) html += `<div class="dl-sub">${esc(bits[k].trim())}</div>`;
      });
    });
  });
  return `<div class="dose-fmt">${html}</div>`;
}

function doseField(text) {
  if (!text || !String(text).trim()) return '';
  return `<div class="dc-field"><div class="dc-flabel">常用劑量</div>
    <div class="dc-ftext">${fmtDose(text)}</div></div>`;
}

/* 單一規格（variant）的明細欄位 */
function variantBody(v) {
  const price = [v.nhi ? `健保 NT$ ${esc(v.nhi)}` : '', v.selfpay ? `自費 NT$ ${esc(v.selfpay)}` : '']
    .filter(Boolean).join('　·　');
  return `
    ${field('商品名／含量', v.brand)}
    ${doseField(v.dose)}
    ${field('最大劑量', v.maxDose)}
    ${rowTbl('腎功能調整', v.renal, [['adjust', '是否調整'], ['ccr', 'CCr'], ['dose', '建議劑量'], ['freq', '建議頻次']])}
    ${rowTbl('肝功能調整', v.hepatic, [['adjust', '是否調整'], ['dose', '調整建議']])}
    ${rowTbl('透析劑量', v.dialysis, [['hd_dose', 'HD 劑量'], ['hd_removal', 'HD 移除比例'], ['hd_supp', 'HD 後補充'],
      ['pd_dose', 'PD 劑量'], ['pd_removal', 'PD 移除比例'], ['pd_supp', 'PD 後補充'], ['remark', '備註']])}
    ${rowTbl('CVVH／CRRT 劑量', v.cvvh, [['cvvh', 'CVVH'], ['cvvhd', 'CVVHD'], ['cvvhdf', 'CVVHDF'], ['remark', '備註']])}
    ${rowTbl('注射給藥指引', v.injection, [['route', '給藥途徑'], ['reconstitute', '溶解液及體積'],
      ['diluent', '稀釋液及體積'], ['conc', '給藥濃度'], ['time', '輸注時間／速率'], ['notes', '注意事項'],
      ['storage', '原包裝儲存'], ['stab_recon', '溶解後安定性'], ['stab_dilute', '稀釋後安定性'],
      ['container', '容器相容性']])}
    ${pregField(v.preg)}
    ${v.ctrl ? field('管制藥品分級', v.ctrl) : ''}
    ${field('適應症（衛福部許可證）', v.ind)}
    ${field('藥理作用', v.action)}
    ${field('副作用', v.adverse)}
    ${field('禁忌', v.contra, true)}
    ${field('安全警訊', v.alert, true)}
    ${field('飲食交互作用', v.food)}
    ${field('備註', v.note)}
    ${v.nhiRule ? `<div class="dc-field"><div class="dc-flabel">健保給付規定（節錄）</div>
       <div class="dc-ftext db-nhi">${esc(v.nhiRule)}</div></div>` : ''}
    ${field('藥品外觀', v.look)}
    ${field('藥商', v.company)}
    ${price ? field('藥價', price) : ''}
    <div class="db-foot">藥品八碼 ${esc(v.code)}　·　台大分類：${esc(v.cat || '')}</div>`;
}

/* 整張藥卡：共用表頭（學名／機轉／劑型）＋各規格分頁。單一規格則不顯示分頁。 */
function cardBody(d) {
  const cls = (d.cls || []).map(c => `<span class="db-moa">${esc(c)}</span>`).join('');
  const header = `
    ${field('學名', d.name)}
    ${cls ? `<div class="dc-field"><div class="dc-flabel">藥理機轉</div>
       <div class="dc-ftext db-moas">${cls}</div></div>` : ''}
    ${field('劑型', d.form)}`;
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

renderTops();
renderCls();
renderList();
applyHash();
window.addEventListener('hashchange', applyHash);
