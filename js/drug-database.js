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
  'III. Anticonvulsants': '抗癲癇藥',
  'IV. Agents Used in Anesthesia': '麻醉用藥',
  'VI. Cardiovascular-renal Drugs': '心血管與腎臟用藥',
  'IX. Hematological Agents': '血液用藥',
  'X. Endocrine and Metabolic Agents': '內分泌與代謝用藥',
  'XI. Antiallergic Agents and Antihistamines': '抗過敏與抗組織胺',
  'XII. Respiratory Tract Drugs': '呼吸道用藥',
  'XIII. Gastrointestinal Agents': '腸胃道用藥',
  'XVI. Antiinfective Agents': '抗微生物劑',
  'XVIII. Antidotes in Poisoning': '中毒解毒劑'
};

const IDX = window.DRUGDB_INDEX || [];
let curTop = '';        // 目前選的藥理大類（空字串＝全部）
let curCls = '';        // 目前選的機轉標籤
let curQ = '';          // 搜尋字串

const el = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* 商品名短名：去掉管制／專案等前綴與劑型含量，只留辨識得出來的那幾個字
   （'Januvia FC Tablet, equivalent to sitagliptin 100 mg/tab' → 'Januvia'）。 */
const FORM_WORD = /\b(Tablets?|Capsules?|Injection|Solution|Soln|Syrup|Suspension|Powder|Granules?|Patch|Pen|Inhal\w*|Spray|Cream|Gel|Suppository|Effervescent|Lyo\w*|F\.?C\.?|Film-coated|Oral|SR|CR|MR|XR|ER|Sterile|for)\b/i;
function shortBrand(b) {
  let s = String(b || '').replace(/^\s*(?:[（(]管\d[）)]|<專>|＜專＞|兒|＠|@)\s*/g, '').trim();
  const words = s.split(/\s+/);
  const out = [];
  for (const w of words) {
    if (out.length && (FORM_WORD.test(w) || /[\d,]/.test(w))) break;
    out.push(w);
    if (out.length >= 4) break;
  }
  return out.join(' ').replace(/[,，]$/, '') || s;
}

/* 含量：同一商品名常有多個規格（Jardiance 10 mg／25 mg 各一張卡），
   標題只寫商品名會分不出來，故把第一段含量抓出來接在後面。 */
function strengthOf(b) {
  const m = String(b || '').match(/([\d.,]+\s*(?:mg|mcg|g|mL|U|IU|%)[^,;()]*)/i);
  return m ? m[1].trim() : '';
}

/* 台大對沒有中文品名的藥填「無正式中文名」，那是註記不是名字，不要當中文名顯示 */
const zhName = z => (!z || z.indexOf('無正式中文名') >= 0) ? '' : z;

/* ---------------- 清單與篩選 ---------------- */

function matches(d) {
  if (curTop && (d.tops || []).indexOf(curTop) < 0) return false;
  if (curCls && (d.cls || []).indexOf(curCls) < 0) return false;
  if (!curQ) return true;
  const hay = [d.name, d.brand, d.zh, (d.cls || []).join(' '), (d.clsZh || []).join(' '), d.code]
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

/* 機轉標籤列：只列出目前大類底下實際有藥的機轉，否則全庫上百個標籤掃不完 */
function renderCls() {
  const n = {};
  IDX.forEach(d => {
    if (curTop && (d.tops || []).indexOf(curTop) < 0) return;
    (d.cls || []).forEach((c, i) => {
      if (!n[c]) n[c] = { n: 0, zh: (d.clsZh || [])[i] || '' };
      n[c].n++;
      if (!n[c].zh && (d.clsZh || [])[i]) n[c].zh = (d.clsZh || [])[i];
    });
  });
  const keys = Object.keys(n).sort((a, b) => n[b].n - n[a].n || a.localeCompare(b));
  el('db-cls').innerHTML = keys.length < 2 ? '' :
    `<span class="db-cls-lbl">藥理機轉</span>` +
    `<button class="db-clschip ${curCls ? '' : 'active'}" onclick="pickCls('')">不限</button>` +
    keys.map(c => `<button class="db-clschip ${curCls === c ? 'active' : ''}" onclick="pickCls('${esc(c)}')"
      title="${esc(n[c].zh)}">${esc(n[c].zh || c)}<span>${n[c].n}</span></button>`).join('');
}

function pickTop(t) { curTop = t; curCls = ''; renderTops(); renderCls(); renderList(); }
function pickCls(c) { curCls = c; renderCls(); renderList(); }
function onSearch(v) { curQ = (v || '').trim().toLowerCase(); renderList(); }

function renderList() {
  const hits = IDX.filter(matches);
  el('db-count').textContent = `${hits.length} 個品項` +
    (hits.length > 400 ? '（品項較多，可用上方分類或搜尋縮小範圍）' : '');
  // 同學名的品項排在一起，商品名為次序；未展開的卡片只畫標題列，展開時才載入該分類資料
  el('db-list').innerHTML = hits.map(d => `
    <details class="drugcard" id="drug-${esc(d.code)}" data-pid="${d.pid}" data-code="${esc(d.code)}"
             ontoggle="onCardToggle(this)">
      <summary>
        <span class="dc-name">${esc(shortBrand(d.brand))}</span>
        ${zhName(d.zh) ? `<span class="dc-zh">${esc(zhName(d.zh))}</span>` : ''}
        ${strengthOf(d.brand) ? `<span class="db-strength">${esc(strengthOf(d.brand))}</span>` : ''}
        <span class="dc-nameen">${esc(d.name)}</span>
        ${(d.clsZh && d.clsZh[0]) || (d.cls && d.cls[0])
          ? `<button type="button" class="dc-class" title="列出同機轉藥物"
               onclick="event.preventDefault();event.stopPropagation();pickCls('${esc((d.cls || [])[0])}')"
             >${esc((d.clsZh || [])[0] || (d.cls || [])[0])}</button>` : ''}
      </summary>
      <div class="dc-body"><div class="db-loading">載入中…</div></div>
    </details>`).join('') ||
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

function cardBody(d) {
  const cls = (d.cls || []).map(c => `<span class="db-moa">${esc(c.zh || c.en)}` +
    (c.zh && c.en ? `<span class="db-moa-en">${esc(c.en)}</span>` : '') + `</span>`).join('');
  const price = [d.nhi ? `健保 NT$ ${esc(d.nhi)}` : '', d.selfpay ? `自費 NT$ ${esc(d.selfpay)}` : '']
    .filter(Boolean).join('　·　');
  return `
    ${field('商品名／含量', d.brand)}
    ${field('學名', d.name)}
    ${cls ? `<div class="dc-field"><div class="dc-flabel">藥理機轉</div>
       <div class="dc-ftext db-moas">${cls}</div></div>` : ''}
    ${field('劑型', d.form)}
    ${field('常用劑量', d.dose)}
    ${field('最大劑量', d.maxDose)}
    ${rowTbl('腎功能調整', d.renal, [['adjust', '是否調整'], ['ccr', 'CCr'], ['dose', '建議劑量'], ['freq', '建議頻次']])}
    ${rowTbl('肝功能調整', d.hepatic, [['adjust', '是否調整'], ['dose', '調整建議']])}
    ${rowTbl('透析劑量', d.dialysis, [['hd_dose', 'HD 劑量'], ['hd_removal', 'HD 移除比例'], ['hd_supp', 'HD 後補充'],
      ['pd_dose', 'PD 劑量'], ['pd_removal', 'PD 移除比例'], ['pd_supp', 'PD 後補充'], ['remark', '備註']])}
    ${rowTbl('CVVH／CRRT 劑量', d.cvvh, [['cvvh', 'CVVH'], ['cvvhd', 'CVVHD'], ['cvvhdf', 'CVVHDF'], ['remark', '備註']])}
    ${rowTbl('注射給藥指引', d.injection, [['route', '給藥途徑'], ['reconstitute', '溶解液及體積'],
      ['diluent', '稀釋液及體積'], ['conc', '給藥濃度'], ['time', '輸注時間／速率'], ['notes', '注意事項'],
      ['storage', '原包裝儲存'], ['stab_recon', '溶解後安定性'], ['stab_dilute', '稀釋後安定性'],
      ['container', '容器相容性']])}
    ${pregField(d.preg)}
    ${d.ctrl ? field('管制藥品分級', d.ctrl) : ''}
    ${field('適應症（衛福部許可證）', d.ind)}
    ${field('藥理作用', d.action)}
    ${field('副作用', d.adverse)}
    ${field('禁忌', d.contra, true)}
    ${field('安全警訊', d.alert, true)}
    ${field('飲食交互作用', d.food)}
    ${field('備註', d.note)}
    ${d.nhiRule ? `<div class="dc-field"><div class="dc-flabel">健保給付規定（節錄）</div>
       <div class="dc-ftext db-nhi">${esc(d.nhiRule)}</div></div>` : ''}
    ${field('藥品外觀', d.look)}
    ${field('藥商', d.company)}
    ${price ? field('藥價', price) : ''}
    <div class="db-foot">藥品八碼 ${esc(d.code)}　·　台大分類：${esc(d.cat || '')}</div>`;
}

/* ---------------- 進場 ---------------- */

// 網址帶 #code=XXXX 時直接展開該藥卡（供其他頁面連過來）
function applyHash() {
  const m = location.hash.match(/#code=([A-Za-z0-9 %]+)/);
  if (!m) return;
  const code = decodeURIComponent(m[1]);
  const card = el('drug-' + code);
  if (card) { card.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

renderTops();
renderCls();
renderList();
applyHash();
window.addEventListener('hashchange', applyHash);
