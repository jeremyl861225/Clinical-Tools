/* js/ddi.js — 交互作用查核
 *
 * 資料分三層（見 work/ddi/build_site_data.py）：
 *   DDI_INDEX  一次載入：藥物清單＋配對索引，配對只存文字池的編號
 *   DDI_TEXT   點開一組配對才載入該編號所在的分片（機轉／處置）
 *   DDI_REFS   再按「文獻」才載入（原始文獻多是仿單條目，量大且多數人不看）
 * 這樣分是因為全量純文字約 92 MB，一次載入手機會直接掛掉；
 * 而 DDInter 的敘述高度重複（不重複率僅約 5%），抽成共用池後索引才塞得下。
 */

/* 索引改用 fetch 載 data/ddi/index.json，不再由 <script> 注入。
   關鍵是**失敗要抓得到**：<script src> 載入失敗或解析失敗都沒有可攔截的訊號，
   DDI_INDEX 就是 undefined，而介面照常運作、每一次查詢都回「查無」——
   臨床上會被讀成「這兩支藥沒有交互作用」，但真相是資料根本沒載到。
   這是本頁最危險的失效模式，所以寧可整頁停用也不能讓它靜默降級。 */
let IDX = { drugs: {}, pairs: [], shard: 400 };
let SEARCH = [];
let INDEX_OK = false;
let INDEX_ERR = '';

async function loadIndex() {
  const res = await fetch('../data/ddi/index.json', { cache: 'force-cache' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data || !data.pairs || !data.pairs.length) throw new Error('索引內容是空的');
  IDX = data;
  /* 第 4 欄是台大藥卡的英文學名，只有跟 DDInter 寫法不同時才存在
     （Rifampin/Rifampicin、Valacyclovir/Valaciclovir、Aspirin/Acetylsalicylic acid…）。
     一定要進 hay：使用者是照著藥卡上的名字打的，不收就整支查不到。 */
  SEARCH = Object.keys(IDX.drugs).map(id => {
    const [en, zh, br, alt] = IDX.drugs[id];
    return {
      id, en, zh: zh || [], br: br || [], alt: alt || [],
      hay: [en, ...(zh || []), ...(br || []), ...(alt || [])].join(' ').toLowerCase(),
    };
  });
  INDEX_OK = true;
}
const SEV_ZH = ['未分級', 'Minor 輕度', 'Moderate 中度', 'Major 重大'];
const SEV_PIPS = ['▫▫▫', '◼▫▫', '◼◼▫', '◼◼◼'];
const MECH_ZH = {
  Metabolism: '代謝', Synergy: '協同', Antagonism: '拮抗', Absorption: '吸收',
  Excretion: '排除', Distribution: '分布', Others: '其他',
};

/* 選定的藥（DDInter 短碼），順序即使用者加入的順序 */
let picked = [];
let soloLimit = 60;

/* ---------- 配對查表 ---------- */
/* 106,454 組配對每次重掃太慢（換一個藥就要重算），建一次雙向 Map： */
/* byPair 給「這兩個藥有沒有撞」，byDrug 給單藥模式列全部。 */
let byPair = null, byDrug = null;
function buildMaps() {
  if (byPair) return;
  byPair = new Map();
  byDrug = new Map();
  for (const p of IDX.pairs) {
    byPair.set(p[0] + '|' + p[1], p);
    if (!byDrug.has(p[0])) byDrug.set(p[0], []);
    if (!byDrug.has(p[1])) byDrug.set(p[1], []);
    byDrug.get(p[0]).push(p);
    byDrug.get(p[1]).push(p);
  }
}
function lookup(a, b) {
  buildMaps();
  return byPair.get(a + '|' + b) || byPair.get(b + '|' + a) || null;
}

/* ---------- 分片載入 ---------- */
const loadingShard = {};
function loadShard(kind, n) {
  const bag = kind === 't' ? 'DDI_TEXT' : 'DDI_REFS';
  window[bag] = window[bag] || {};
  if (window[bag][n]) return Promise.resolve();
  const key = kind + n;
  if (loadingShard[key]) return loadingShard[key];
  loadingShard[key] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = `../data/ddi/${kind}/${n}.js`;
    s.onload = res;
    s.onerror = () => rej(new Error('load ' + key));
    document.head.appendChild(s);
  });
  return loadingShard[key];
}
function textOf(kind, i) {
  if (i < 0) return null;
  const bag = kind === 't' ? window.DDI_TEXT : window.DDI_REFS;
  const n = Math.floor(i / IDX.shard);
  return (bag && bag[n]) ? bag[n][i % IDX.shard] : undefined;
}

/* ---------- 小工具 ---------- */
const el = id => document.getElementById(id);
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function nameOf(id) { return (IDX.drugs[id] || ['?'])[0]; }
function zhOf(id) { return ((IDX.drugs[id] || [])[1] || [])[0] || ''; }
function sevMark(s) {
  return `<span class="sevmark sev-${s}"><span class="pips">${SEV_PIPS[s]}</span>${esc(SEV_ZH[s])}</span>`;
}

/* ---------- 候選清單 ---------- */
function suggest(q) {
  const box = el('ddi-sugg');
  q = q.trim().toLowerCase();
  el('ddi-clear').hidden = !q;
  if (!q) { box.hidden = true; box.innerHTML = ''; return; }

  /* 排序：英文名開頭命中 > 任一別名開頭命中 > 其他包含。同分時短的排前面， */
  /* 打 "amio" 要先看到 Amiodarone，不是某個名字裡剛好含 amio 的長複方。 */
  const hits = [];
  for (const d of SEARCH) {
    if (picked.includes(d.id)) continue;
    const i = d.hay.indexOf(q);
    if (i < 0) continue;
    let rank = 2;
    if (d.en.toLowerCase().startsWith(q)) rank = 0;
    else if ([...d.zh, ...d.br, ...d.alt].some(x => x.toLowerCase().startsWith(q))) rank = 1;
    hits.push({ d, rank, len: d.en.length });
  }
  hits.sort((a, b) => a.rank - b.rank || a.len - b.len || a.d.en.localeCompare(b.d.en));

  if (!hits.length) {
    box.innerHTML = `<div class="ddi-sugg-empty">查無「${esc(q)}」。此處只收錄本站藥卡對映得到的成分；
      複方請改打單一成分，找不到不代表沒有交互作用。</div>`;
    box.hidden = false;
    return;
  }
  buildMaps();
  box.innerHTML = hits.slice(0, 30).map(({ d }) => {
    const n = (byDrug.get(d.id) || []).length;
    const alias = [...d.zh, ...d.br, ...d.alt].slice(0, 2).join(' · ');
    const hi = esc(d.en).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'),
      '<em>$1</em>');
    return `<button type="button" class="ddi-si" role="option" data-id="${esc(d.id)}">
      <span class="ddi-si-en">${hi}</span>${alias ? `<span class="ddi-si-zh">${esc(alias)}</span>` : ''}
      <span class="ddi-si-meta">收錄 ${n} 組交互作用</span></button>`;
  }).join('');
  box.hidden = false;
}

/* ---------- 選藥 ---------- */
function add(id) {
  if (!id || picked.includes(id)) return;
  picked.push(id);
  soloLimit = 60;
  const q = el('ddi-q');
  q.value = '';
  suggest('');
  q.focus();
  render();
}
function drop(id) { picked = picked.filter(x => x !== id); soloLimit = 60; render(); }
function wipe() { picked = []; soloLimit = 60; render(); }

function renderPicked() {
  const box = el('ddi-picked');
  box.innerHTML = picked.map(id => {
    const zh = zhOf(id);
    return `<span class="ddi-chip"><span class="cw">${esc(nameOf(id))}${zh ? '　' + esc(zh) : ''}</span>
      <button type="button" class="cx" data-drop="${esc(id)}" aria-label="移除 ${esc(nameOf(id))}">×</button></span>`;
  }).join('') + (picked.length > 1
    ? `<button type="button" class="ddi-wipe" data-wipe="1">全部清掉</button>` : '');
}

/* ---------- 一組配對的列 ---------- */
function pairHTML(p, leadId) {
  /* leadId：要排在前面的那個藥。單藥模式是被查的那個藥，多藥模式是使用者先加入的那個——
     索引裡的 p[0]/p[1] 是照 DDInter 編號排的，直接照印會變成「Ketorolac × Warfarin」，
     跟使用者心裡的順序相反。 */
  let a = p[0], b = p[1];
  if (leadId && b === leadId) { a = p[1]; b = p[0]; }
  const mech = MECH_ZH[p[3]] || p[3] || '';
  const zhA = zhOf(a), zhB = zhOf(b);
  const zh = (zhA || zhB) ? `<span class="pair-zh">${esc(zhA || '—')} × ${esc(zhB || '—')}</span>` : '';
  return `<details class="pair" data-ti="${p[4]}" data-mi="${p[5]}" data-ri="${p[6]}">
    <summary>
      ${sevMark(p[2])}
      <span class="pair-names">${esc(nameOf(a))}<span class="x">×</span>${esc(nameOf(b))}</span>
      ${zh}
      ${mech ? `<span class="pair-mech">${esc(mech)}</span>` : ''}
      <span class="pair-chev">展開 ▾</span>
    </summary>
    <div class="pair-body"><div class="ddi-loading">載入中…</div></div>
  </details>`;
}

/* 展開才去載文字分片——一次全載是 92 MB，這裡只抓需要的那 400 段 */
async function fillPair(node) {
  if (node.dataset.filled) return;
  node.dataset.filled = '1';
  const ti = +node.dataset.ti, mi = +node.dataset.mi, ri = +node.dataset.ri;
  const need = [ti, mi].filter(i => i >= 0).map(i => Math.floor(i / IDX.shard));
  const body = node.querySelector('.pair-body');
  try {
    await Promise.all([...new Set(need)].map(n => loadShard('t', n)));
  } catch (e) {
    body.innerHTML = `<div class="pf-none">明細載入失敗（${esc(e.message)}），請重新整理。</div>`;
    return;
  }
  const inter = textOf('t', ti), mgmt = textOf('t', mi);
  /* 疾病那類只有一段敘述、沒有獨立的處置欄，標題也不該叫「機轉」——
     它講的是「這個病人有這個病時用這支藥會怎樣」。 */
  const isDis = node.dataset.kind === 'dis';
  body.innerHTML = `
    <div class="pf"><div class="pf-l">${isDis ? '風險與說明 Risk' : '機轉 Mechanism'}</div>
      ${inter ? `<div class="pf-t">${esc(inter)}</div>`
              : '<div class="pf-none">原始資料庫未提供敘述。</div>'}</div>
    ${isDis ? '' : `<div class="pf"><div class="pf-l">處置 Management</div>
      ${mgmt ? `<div class="pf-t mgmt">${esc(mgmt)}</div>`
             : '<div class="pf-none">原始資料庫未提供處置建議。</div>'}</div>`}
    ${ri >= 0 ? `<button type="button" class="pf-refbtn" data-ref="${ri}">參考文獻 ▾</button>
      <div class="pf-refs" hidden></div>` : ''}`;
}

async function showRefs(btn) {
  const box = btn.nextElementSibling;
  if (!box.hidden) { box.hidden = true; btn.textContent = '參考文獻 ▾'; return; }
  const ri = +btn.dataset.ref;
  btn.textContent = '載入中…';
  try {
    await loadShard('r', Math.floor(ri / IDX.shard));
  } catch (e) {
    btn.textContent = '文獻載入失敗';
    return;
  }
  box.textContent = textOf('r', ri) || '（無）';
  box.hidden = false;
  btn.textContent = '參考文獻 ▴';
}

/* ---------- 主渲染 ---------- */
function render() {
  const out = el('ddi-out'), ptr = el('ddi-count');

  /* 索引沒載到就整頁停用——寧可明白說「壞了」，也不能讓它看起來能查卻永遠查無。 */
  if (!INDEX_OK) {
    ptr.innerHTML = '';
    el('ddi-picked').innerHTML = '';
    const q = el('ddi-q');
    q.disabled = true;
    q.placeholder = '資料未載入，暫時無法查詢';
    out.innerHTML = `<div class="ddi-fail">
      <b>交互作用資料沒有載入成功，這一頁現在查不到任何東西。</b>
      <p>這不是「查無交互作用」——是資料檔（約 4.7 MB）沒下載完或沒解析成功，
      常見於網路中斷、或裝置的離線快取壞掉。<br>失敗原因：<code>${esc(INDEX_ERR || '未知')}</code><br><b>請不要把空白結果當成沒有交互作用。</b></p>
      <button type="button" class="ddi-retry" data-retry="1">清除離線快取並重新載入</button>
      <p class="ddi-fail-alt">若重試後仍然失敗，請改用
        <a href="https://ddinter2.scbdd.com/" target="_blank" rel="noopener">DDInter</a> 或
        <a href="https://www.druginteractions.org/" target="_blank" rel="noopener">University of Liverpool</a>
        的線上工具。</p></div>`;
    return;
  }

  renderPicked();
  if (!picked.length) { ptr.innerHTML = ''; out.innerHTML = emptyHTML(); return; }
  buildMaps();

  if (picked.length === 1) {
    const id = picked[0];
    const all = (byDrug.get(id) || []).slice().sort((x, y) => y[2] - x[2])
      .map(p => ({ p, lead: id }));
    const n3 = all.filter(x => x.p[2] === 3).length;
    ptr.innerHTML = `<span><b>${esc(nameOf(id))}</b> 收錄 <b>${all.length}</b> 組交互作用</span>
      ${n3 ? `<span class="hot">其中 Major ${n3} 組</span>` : ''}`;
    /* 收錄範圍內但一組配對都沒有（多為生物製劑、外用藥、解毒劑）。
       這時**不能**讓畫面空白——空白會被讀成「壞掉」或「沒查到」，
       但真相是「查過了，這支跟院內其他藥沒有已知交互作用」，要講明白。 */
    if (!all.length) {
      out.innerHTML = extraHTML('food') + extraHTML('dis')
        + ddHead(0) + `<div class="ddi-clear-msg">
        <b>${esc(nameOf(id))} 在收錄範圍內，但沒有任何一組已知交互作用。</b>
        這類多半是生物製劑、外用製劑或解毒劑。<b>不等於安全</b>——
        資料庫沒有記錄不代表不會發生，用藥前仍請對照仿單。</div>`;
      return;
    }
    const shown = all.slice(0, soloLimit);
    /* 單藥模式把藥×藥排到飲食／共病之後：這時候的藥×藥是「這支藥跟全世界的藥」
       那份幾百列的總表，不是這位病人的問題；而飲食與共病只有幾列、且對單一支藥
       就已經可以照著做。總表排前面會把那幾列直接推出螢幕外。
       多藥模式相反——那時藥×藥才是使用者真正在問的事，仍然排第一。 */
    out.innerHTML = extraHTML('food') + extraHTML('dis')
      + groupHTML(shown, `<div class="ddi-solo-note">目前只放了一種藥，列出的是它<b>全部</b>的交互作用。
          再加入這位病人的其他藥，就只會留下真正會撞的那幾組。</div>`, all.length)
      + (all.length > shown.length
        ? `<button type="button" class="ddi-more" data-more="1">再顯示 60 組（還有 ${all.length - shown.length} 組）</button>`
        : '');
    return;
  }

  /* 多藥：只算兩兩配對。記下使用者先加入的那一個當 lead，列出來的順序才跟他想的一樣。 */
  const hits = [];
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      const p = lookup(picked[i], picked[j]);
      if (p) hits.push({ p, lead: picked[i] });
    }
  }
  hits.sort((x, y) => y.p[2] - x.p[2]);
  const combos = picked.length * (picked.length - 1) / 2;
  const n3 = hits.filter(h => h.p[2] === 3).length;
  ptr.innerHTML = `<span><b>${picked.length}</b> 種藥 · <b>${combos}</b> 組兩兩組合 · 命中 <b>${hits.length}</b> 組</span>
    ${n3 ? `<span class="hot">Major ${n3} 組</span>` : ''}`;

  out.innerHTML = (hits.length
    ? groupHTML(hits, `<div class="ddi-exnote">這幾支藥兩兩配對後，DDInter 有記錄的組數。
        依嚴重度分組，Major 排在最前面。</div>`)
    : ddHead(0) + `
    <div class="ddi-clear-msg"><b>這 ${combos} 組組合在 DDInter 裡都沒有收錄。</b>
      這代表「這個資料庫沒有這筆記錄」，<b>不等於安全</b>——新藥、生物製劑與本站藥卡對映不到的成分
      本來就不在收錄範圍內。臨床上仍請對照仿單與專科 checker。</div>`)
    + extraHTML('food') + extraHTML('dis');
}

/* ---------- 藥×食物、藥×疾病 ----------
 * 資料在索引裡（IDX.food / IDX.dis），量小所以不分片，但文字仍走同一個 t 分片池，
 * 所以展開時同樣要 loadShard。
 * 位置固定排在藥×藥之下——使用者是先問「這幾支藥會不會撞」，
 * 食物與共病是接著才想到的第二層問題。
 */
const EXTRA = {
  food: { key: 'food', zh: '飲食', en: 'Food', ico: '食',
          note: '同時服用的飲食／嗜好品。分級沿用 DDInter 原始標註。' },
  dis:  { key: 'dis',  zh: '共病', en: 'Disease', ico: '病',
          note: '病人本身的疾病狀態下用這支藥的風險。<b>這裡不取代藥卡的「禁忌」欄</b>——'
              + '那一欄的來源是台大藥劑部，兩者不一致時以台大為準。' },
};

/* 把使用者選的每一支藥的食物／疾病條目攤平，標上是哪一支藥的 */
function extraRows(kind) {
  const rows = [];
  for (const id of picked) {
    for (const r of (IDX[kind] && IDX[kind][id]) || []) rows.push({ id, r });
  }
  return rows.sort((a, b) => b.r[1] - a.r[1]);
}

function extraHTML(kind) {
  const meta = EXTRA[kind];
  const rows = extraRows(kind);
  if (!rows.length) return '';
  const n3 = rows.filter(x => x.r[1] === 3).length;
  return `<div class="ddi-sec ex s${n3 ? 3 : 2}">
      <span class="zh">${esc(meta.zh)}交互作用</span>
      <span class="en">${esc(meta.en)}</span>
      <span class="n">${rows.length} 項</span>
    </div>
    <div class="ddi-exnote">${meta.note}</div>`
    + rows.map(({ id, r }) => {
      /* r = [名稱, 分級, 文字編號…]；食物有機轉＋處置兩段，疾病只有一段敘述 */
      const ti = r[2], mi = r.length > 3 ? r[3] : -1;
      return `<details class="pair ex" data-kind="${kind}" data-ti="${ti}" data-mi="${mi}">
        <summary>
          ${sevMark(r[1])}
          <span class="pair-names">${esc(r[0])}</span>
          <span class="pair-zh">對 ${esc(nameOf(id))}</span>
          <span class="pair-chev">展開 ▾</span>
        </summary>
        <div class="pair-body"><div class="ddi-loading">載入中…</div></div>
      </details>`;
    }).join('');
}

/* 藥×藥的區塊標題。跟飲食／共病用同一組樣式（點線頂框＋中英標題＋計數），
   三區看起來才是同一層級的三類問題；沒有它的話，畫面上直接跳出一條
   「Moderate 中度」的實線，讀不出那是「藥×藥」的結果。
   n 給總數：單藥模式畫面上只先放 60 列，標題要講的是全部有幾組。 */
function ddHead(n, hot) {
  return `<div class="ddi-sec ex s${hot ? 3 : 2}">
      <span class="zh">藥物交互作用</span>
      <span class="en">Drug</span>
      <span class="n">${n} 組</span>
    </div>`;
}

/* list 元素一律是 {p, lead}——單藥模式的 lead 是被查的藥，多藥模式是先加入的那個。 */
function groupHTML(list, note, total) {
  let h = ddHead(total == null ? list.length : total, list.some(x => x.p[2] === 3))
    + (note || '');
  for (const s of [3, 2, 1, 0]) {
    const g = list.filter(x => x.p[2] === s);
    if (!g.length) continue;
    h += `<div class="ddi-sec s${s}"><span class="zh">${esc(SEV_ZH[s])}</span>
      <span class="n">${g.length} 組</span></div>`
      + g.map(x => pairHTML(x.p, x.lead)).join('');
  }
  return h;
}

function emptyHTML() {
  /* 六個示範組合都是外科病房實際會遇到的。清單只留資料庫真的收得到的那幾組——
     藥名寫死但資料是外部來源，寫死的名字有一天可能對不上，寧可少顯示不要顯示壞的。 */
  const egs = [
    ['Warfarin + Amiodarone', '抗凝血劑遇上抗心律不整藥的經典組合'],
    ['Warfarin + Ciprofloxacin', '圍手術期加了抗生素，INR 會被推上去'],
    /* 用 Esomeprazole 不是 Omeprazole：台大處方集裡沒有 omeprazole 這個品項，
       寫成 Omeprazole 這張卡永遠出不來。 */
    ['Clopidogrel + Esomeprazole', 'PPI 會不會把抗血小板效果打掉'],
    ['Simvastatin + Clarithromycin', 'statin 加巨環類的橫紋肌溶解風險'],
    ['Colchicine + Clarithromycin', '術後痛風病人常被忽略的一組'],
    ['Tramadol + Sertraline', '血清素症候群'],
  ];
  buildMaps();
  const cards = egs.map(([say, sub]) => {
    const ids = say.split(' + ').map(n => {
      const f = SEARCH.find(d => d.en.toLowerCase() === n.toLowerCase());
      return f ? f.id : null;
    });
    if (ids.some(x => !x)) return '';
    return `<button type="button" class="ddi-eg" data-eg="${esc(ids.join(','))}">
      <span class="eg-say">${esc(say)}</span><span class="eg-sub">${esc(sub)}</span></button>`;
  }).filter(Boolean).join('');

  const nd = Object.keys(IDX.drugs).length;
  return `<div class="ddi-empty">
    <details class="ddi-howto"><summary>怎麼用？</summary>
      <div class="ddi-howto-body">
        上面那格打藥名（學名、中文品名或商品名都行），從候選清單點一下就加進來。
        加第二種藥開始，下面會列出所有兩兩組合裡真的有記錄的那幾組，Major 排在最前面。
        點一組展開看機轉與處置建議。<br><br>
        只放一種藥時，列出的是那個藥的全部交互作用——當成單藥速查用。<br><br>
        目前收錄 <b>${nd}</b> 種成分、<b>${IDX.pairs.length}</b> 組配對，
        全部離線可用（第一次開啟後）。
      </div></details>
    <div class="ddi-eg-h">試試看</div>
    <div class="ddi-egs">${cards}</div>
  </div>`;
}

/* ---------- 事件 ---------- */
/* 一律走委派：結果整塊會被重繪，逐一掛 listener 會在重繪後全部失效。 */
document.addEventListener('click', e => {
  const si = e.target.closest('.ddi-si');
  if (si) { add(si.dataset.id); return; }
  const dropBtn = e.target.closest('[data-drop]');
  if (dropBtn) { drop(dropBtn.dataset.drop); return; }
  if (e.target.closest('[data-wipe]')) { wipe(); return; }
  const eg = e.target.closest('[data-eg]');
  if (eg) { picked = eg.dataset.eg.split(','); soloLimit = 60; render(); return; }
  if (e.target.closest('[data-more]')) { soloLimit += 60; render(); return; }
  const ref = e.target.closest('.pf-refbtn');
  if (ref) { showRefs(ref); return; }
  /* 資料載入失敗的自救鍵：把本站的離線快取整個丟掉再重來。
     只刪 clinical-tools- 開頭的——同一個 github.io origin 還住著 book-reader、
     todo-app、patient-list，砍到別人的快取會把他們的離線能力一起清掉。 */
  if (e.target.closest('[data-retry]')) {
    const done = () => location.reload();
    Promise.resolve()
      .then(() => (self.caches ? caches.keys() : []))
      .then(ks => Promise.all(ks.filter(k => k.startsWith('clinical-tools-')).map(k => caches.delete(k))))
      .then(() => navigator.serviceWorker
        ? navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))
        : null)
      .then(done, done);
    return;
  }
  /* 點在候選清單以外就收起清單 */
  if (!e.target.closest('.ddi-pick')) {
    const box = el('ddi-sugg');
    if (box) box.hidden = true;
  }
});

document.addEventListener('toggle', e => {
  const d = e.target;
  if (!d.classList || !d.classList.contains('pair')) return;
  /* 「展開」點下去之後要變成「收合 ▴」——按鍵上的字講的是「按下去會發生什麼」，
     停在「展開」會讓人以為沒生效，三角形也要跟著翻。
     不用 CSS ::after 做：那樣的字選不起來、複製不到，樣式沒載到時整個標籤會消失。 */
  const chev = d.querySelector(':scope > summary .pair-chev');
  if (chev) chev.textContent = d.open ? '收合 ▴' : '展開 ▾';
  if (d.open) fillPair(d);
}, true);

/* ---------- 返回鍵的位置（只在造句模式） ----------
 * 「← 返回主選單」跟「清空句子」是同一件事——後者的 aria-label 就寫著
 * 「清空整句，回到主選單」，兩顆並排是重複的。所以造句模式下把整組 .back-stack
 * 收起來，只把 backlink.js 產生的「← 返回<來源頁>」搬到「清空句子」左邊。
 *
 * 為什麼不直接把主選單那顆從 HTML 刪掉：backlink.js 用它當錨點
 * （homeBtn() 找不到就 return，來源頁返回鍵根本不會生出來），
 * 而且正式版模式沒有句子列，刪了那一頁就沒有任何返回入口。
 *
 * 為什麼要 MutationObserver：.sent-point 由 sentence-nav.js 的 renderTrail()
 * 整塊重建（展開「改句子」、改任何一格都會重畫），搬過去的按鈕會被一起洗掉，
 * 所以每次重畫都要再搬一次。
 */
function relocateBackBtn() {
  if (document.documentElement.getAttribute('data-ui') !== 'sentence') return;
  const point = document.querySelector('.sent-point');
  const clear = point && point.querySelector('.sent-clear');
  if (!clear) return;
  const stack = document.querySelector('.app-header .back-stack');
  const origin = document.querySelector('.back-origin');
  if (origin && origin.parentNode !== point) point.insertBefore(origin, clear);
  /* 搬完才收起 .back-stack：先收的話 backlink.js 還沒插入時會閃一下 */
  if (stack) stack.hidden = true;
}

function watchBackBtn() {
  relocateBackBtn();
  const host = document.querySelector('.sent-trail, .rail-zone, .sheet') || document.body;
  new MutationObserver(relocateBackBtn).observe(host, { childList: true, subtree: true });
}

async function boot() {
  const q = el('ddi-q');
  /* 先把索引載進來再渲染。載入期間先給一個明確的過渡狀態——4.7 MB 在
     手機網路下要幾秒，空白畫面會讓人以為壞了。 */
  el('ddi-out').innerHTML = '<div class="ddi-loading">載入交互作用資料（約 4.7 MB）…</div>';
  try {
    await loadIndex();
  } catch (e) {
    INDEX_ERR = e && e.message ? e.message : String(e);
    console.error('DDI 索引載入失敗:', e);
  }

  /* placeholder 沒辦法用 CSS 做 RWD，窄螢幕上長版會被切在半句（「商品名（例：」）。
     手機給短版，桌機維持完整說明。要跟著 resize 走——只在載入時判一次的話，
     視窗由窄拉寬（或 iPad 轉向）會一直停在短版。 */
  const LONG = q.placeholder;
  /* 可化凝錠＝台大的 warfarin（Cofarin）。原本寫「可邁丁」是錯的——那是 Coumadin
     的中文名，台大處方集裡沒有這個品項，照著打會查不到東西。 */
  const SHORT = '加入藥物：warfarin、可化凝錠…';
  const fitPlaceholder = () => { q.placeholder = window.innerWidth < 480 ? SHORT : LONG; };
  fitPlaceholder();
  window.addEventListener('resize', fitPlaceholder);
  q.addEventListener('input', () => suggest(q.value));
  q.addEventListener('focus', () => { if (q.value) suggest(q.value); });
  q.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = document.querySelector('.ddi-si');
      if (first) { e.preventDefault(); add(first.dataset.id); }
    } else if (e.key === 'Escape') {
      el('ddi-sugg').hidden = true;
    }
  });
  el('ddi-clear').addEventListener('click', () => { q.value = ''; suggest(''); q.focus(); });
  render();
  watchBackBtn();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
