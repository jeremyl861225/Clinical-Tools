/* 抗生素指引 antibiotics.html — render／互動邏輯。
   依賴全域資料（由 data/antibiotics/*.js 掛載於 window）：DRUGS, SITES, BACTERIA,
   COV_LABELS, COV_LABELS_FUNGAL, ROLE_TXT, ABG, ABG_ORG_LABEL, ABG_AB_LABEL, BAC_ABG。 */

/* 藥卡標題徽章列（收合時可判讀）：抗細菌＝六大覆蓋旗標，抗黴菌＝三類。
   cov[key]: 1=涵蓋(亮燈)、'p'=部分(琥珀)、缺=不涵蓋(暗掉+刪除線)。d.covSet==='fungal' 用抗黴菌標籤。 */
function covStrip(d){
  if(!d.cov) return '';
  const labels = d.covSet==='fungal'?COV_LABELS_FUNGAL:COV_LABELS;
  return `<div class="dc-cov">`+Object.keys(labels).map(key=>{
    const v=d.cov[key];
    const cls=v===1?'yes':(v==='p'?'partial':'no');
    return `<span class="cov-tag ${cls}">${labels[key]}</span>`;
  }).join('')+`</div>`;
}

/* 抗菌譜欄內的台大在地感受性徽章：依 d.abg（[{sec,col}]）列出該藥所在表格中「所有」有數值的菌種 %S。
   門檻：%S ≥90 亮＋加粗框、80–89 亮燈、60–79 琥珀、<60 暗掉＋刪除線。NA（未列/樣本不足）略過。 */
function abgSpectrum(d){
  if(!d.abg) return '';
  const cells=[];
  d.abg.forEach(m=>{
    const sec=ABG[m.sec]; if(!sec) return;
    const ci=sec.ab.indexOf(m.col); if(ci<0) return;
    Object.keys(sec.org).forEach(org=>{
      const v=sec.org[org].S[ci];
      if(typeof v!=='number') return;
      const cls = v>=90?'sy-hi' : (v>=80?'yes' : (v>=60?'partial':'no'));
      cells.push(`<span class="cov-tag ${cls}">${ABG_ORG_LABEL[org]||org} ${v}%</span>`);
    });
  });
  if(!cells.length) return '';
  const src = d.abgProxy ? `台大 2025 上半年在地感受性 %S（以 ${d.abgProxy} 為同類代表）` : '台大 2025 上半年在地感受性 %S';
  return `<div class="dc-susc"><div class="dc-susc-cap">${src}　·　≥90 粗框 / 80–89 亮 / 60–79 琥珀 / &lt;60 暗</div><div class="dc-cov">${cells.join('')}</div></div>`;
}

/* 「依細菌」的在地感受性徽章：對選定菌，列出台大表中所有有數值的抗生素 %S。
   一菌可對多個 antibiogram 菌列（如 Acinetobacter → complex／CRAB／non-MDRAB），各列分段顯示。
   門檻同藥卡：%S ≥90 亮+粗框、80–89 亮、60–79 琥珀、<60 暗；NA 略過。 */
function abgForBac(b){
  const map = BAC_ABG[b.en]; if(!map) return '';
  const list = Array.isArray(map)?map:[map];
  const blocks=[];
  list.forEach(m=>{
    const sec=ABG[m.sec]; if(!sec) return;
    const rec=sec.org[m.org]; if(!rec) return;
    const cells=[];
    sec.ab.forEach((abk,ci)=>{
      const v=rec.S[ci];
      if(typeof v!=='number') return;
      const cls = v>=90?'sy-hi' : (v>=80?'yes' : (v>=60?'partial':'no'));
      cells.push(`<span class="cov-tag ${cls}">${ABG_AB_LABEL[abk]||abk} ${v}%</span>`);
    });
    if(!cells.length) return;
    const sub = list.length>1 ? `<div class="dc-susc-cap" style="margin-top:7px">${ABG_ORG_LABEL[m.org]||m.org}（n=${rec.n}）</div>` : '';
    blocks.push(sub+`<div class="dc-cov">${cells.join('')}</div>`);
  });
  if(!blocks.length) return '';
  const n = (!Array.isArray(map)) ? `（n=${ABG[map.sec].org[map.org].n}）` : '';
  return `<div class="dc-susc"><div class="dc-susc-cap">台大 2025 上半年在地感受性 %S${n}　·　≥90 粗框 / 80–89 亮 / 60–79 琥珀 / &lt;60 暗</div>${blocks.join('')}</div>`;
}

/* =========================================================================
   Rendering
   ========================================================================= */
let curSite=null, curType=null;

function el(id){return document.getElementById(id);}
function show(id,on){el(id).classList.toggle('hidden',!on);}

function renderSites(){
  el('abx-sites').innerHTML = SITES.map((s,i)=>
    `<button class="flow-opt" onclick="selectSite(${i})">
       <span style="font-size:15px">${s.name}</span>
       <span class="fo-sub">${s.en} · ${s.types.length} 型態</span>
     </button>`).join('');
}

function selectSite(i){
  curSite=SITES[i]; curType=null;
  el('abx-crumb1').innerHTML=`<b>${curSite.name}</b>`;
  el('abx-types').innerHTML = curSite.types.map((t,j)=>
    `<button class="flow-opt" onclick="selectType(${j})">
       <span>${t.name}</span><span class="fo-sub">${t.en}</span>
     </button>`).join('');
  show('abx-step-site',false); show('abx-step-type',true); show('abx-step-result',false);
  window.scrollTo({top:0,behavior:'smooth'});
}

function selectType(j){
  curType=curSite.types[j];
  el('abx-crumb2').innerHTML=`<span>${curSite.name}</span><span class="sep">›</span><b>${curType.name}</b>`;
  el('abx-typenote').textContent=curType.note||'';
  el('abx-regimens').innerHTML = curType.regimens.map(renderRegimen).join('');
  el('abx-drugcards').innerHTML = uniqueDrugs(curType).map(renderDrugCard).join('');
  show('abx-step-type',false); show('abx-step-result',true);
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderRegimen(r){
  const has = r.drugs.length>0;
  const chips = r.drugs.map((k,idx)=>{
    const d=DRUGS[k];
    // 右側小字：優先台大商品名，其次台灣商品名，皆無則略（避免顯示 undefined）
    const en = d.ntuhProducts ? (d.ntuhProducts[0].en||d.ntuhProducts[0].zh||'')
             : (d.brands ? d.brands[0] : (d.en||''));
    return (idx>0?'<span class="rgm-plus">＋</span>':'')+
      `<button class="drug-chip" onclick="openDrug('${k}')">${d.name}${en?`<span class="dc-en">${en}</span>`:''}</button>`;
  }).join('');
  // 合併此 regimen 所有藥物的覆蓋標記
  let tags='';
  if(has){
    const cov={}; r.drugs.forEach(k=>Object.assign(cov,DRUGS[k].cov||{}));
    tags = Object.keys(COV_LABELS).map(key=>
      `<span class="cov-tag ${cov[key]?'yes':'no'}">${COV_LABELS[key]}</span>`).join('');
  }
  return `<div class="rgm ${r.role}">
    <div class="rgm-head"><span class="rgm-role">${ROLE_TXT[r.role]}</span><span class="rgm-label">${r.label}</span></div>
    ${has?`<div class="rgm-drugs">${chips}</div>`:''}
    ${r.dur&&r.dur!=='—'?`<div class="rgm-dur">建議療程：${r.dur}</div>`:''}
    ${r.note?`<div class="rgm-note">${r.note}</div>`:''}
    ${has?`<div class="cov-tags">${tags}</div>`:''}
  </div>`;
}

function uniqueDrugs(type){
  const seen=[]; type.regimens.forEach(r=>r.drugs.forEach(k=>{if(!seen.includes(k))seen.push(k);}));
  return seen;
}

function renderDrugCard(k){
  const d=DRUGS[k];
  const field=(label,text,warn)=> (text&&String(text).trim())?
    `<div class="dc-field"><div class="dc-flabel">${label}</div>
     <div class="dc-ftext ${warn?'dc-warn':''}">${text}</div></div>` : '';
  // 腎功能調整：陣列→表格；字串→純文字（向後相容）
  let renalField='';
  if(Array.isArray(d.renal)){
    const rows=d.renal.map(r=>`<tr><td>${r.k}</td><td>${r.v}</td></tr>`).join('');
    renalField=`<div class="dc-field"><div class="dc-flabel">腎功能調整（CrCl mL/min）</div><div class="dc-ftext"><table class="renal-tbl"><tbody>${rows}</tbody></table></div></div>`;
  } else if(d.renal){
    renalField=field('腎功能調整',d.renal);
  }
  const sub = d.ntuhProducts ? d.ntuhProducts.map(p=>p.en||p.zh).filter(Boolean).join('、')
              : (d.brands ? d.brands.join('、') : (d.en||''));
  const zh = d.zh ? `<span class="dc-zh">${d.zh}</span>` : '';
  // 台大所有商品名（可多品項）：每項 英文商品名（中文品名）
  const prodStr = d.ntuhProducts && d.ntuhProducts.length
    ? d.ntuhProducts.map(p=>`${p.en||''}${p.en&&p.zh?'（':''}${p.zh||''}${p.en&&p.zh?'）':''}`).join('、')
    : (d.brands?d.brands.join('、'):'');
  // 商品名／單隻劑量：整合台大商品名與單隻含量
  const brandLine = [ prodStr, d.vialDose?`　·　${d.vialDose}`:'' ].join('');
  const brandField = (d.vialDose||d.ntuhProducts)
    ? field('商品名／單隻劑量', brandLine)
    : field('台灣商品名', prodStr);
  // 懷孕藥品分級徽章
  const pregField = d.preg
    ? `<div class="dc-field"><div class="dc-flabel">懷孕藥品分級</div><div class="dc-ftext"><span class="dc-preg">Category ${d.preg}</span></div></div>` : '';
  // 注射給藥指引（若為注射劑；口服藥不設此欄）
  let injField='';
  if(d.injection){
    const j=d.injection;
    const row=(t,v)=> v?`<tr><td>${t}</td><td>${v}</td></tr>`:'';
    injField=`<div class="dc-field"><div class="dc-flabel">注射給藥指引</div><div class="dc-ftext"><table class="inj-tbl"><tbody>`+
      row('給藥途徑',j.route)+row('溶解液',j.reconstitute)+row('稀釋液',j.diluent)+
      row('每劑體積',j.volume)+row('給藥濃度',j.conc)+row('輸注時間',j.time)+row('注意事項',j.notes)+
      `</tbody></table></div></div>`;
  }
  return `<details class="drugcard" id="drug-${k}">
    <summary><span class="dc-name">${d.name}</span>${zh}<span class="dc-nameen">${sub}</span><span class="dc-class">${d.cls}</span>${covStrip(d)}</summary>
    <div class="dc-body">
      ${brandField}
      ${field(d.usualDose?'常用劑量':'劑量（成人）',d.usualDose||d.dose)}
      ${field('兒科劑量',d.peds)}
      ${field('最大劑量',d.maxDose)}
      ${renalField}
      ${field('肝功能調整',d.hepatic)}
      ${field('透析劑量（HD／PD）',d.dialysis)}
      ${field('CVVH／CRRT 劑量',d.cvvh)}
      ${injField}
      ${pregField}
      ${field('口服生體可用率 Bioavailability',d.bioav)}
      ${field('分布 / 組織穿透 Distribution',d.dist)}
      ${field('代謝途徑',d.metab)}
      ${(d.spectrum||d.abg)?`<div class="dc-field"><div class="dc-flabel">抗菌譜與備註</div><div class="dc-ftext">${d.spectrum||''}${abgSpectrum(d)}</div></div>`:''}
      ${field('常見併發症／副作用',d.adverse)}
      ${field('禁忌與警示',d.contra,true)}
    </div>
  </details>`;
}

function openDrug(k){
  // 同一藥卡可能同時存在於多個模式的 DOM；只操作目前可見者
  let target=null;
  document.querySelectorAll('.drugcard').forEach(c=>{
    if(c.id==='drug-'+k && c.offsetParent!==null) target=c;
  });
  if(!target) target=el('drug-'+k);
  if(target){ target.open=true; target.scrollIntoView({behavior:'smooth',block:'center'}); }
}

/* ---- 模式切換與新模組 ---- */
let curBac=null;

function switchMode(m){
  ['empiric','bacteria','lookup'].forEach(x=>show('mode-'+x, x===m));
  document.querySelectorAll('.abx-mode').forEach(b=>b.classList.toggle('active', b.dataset.mode===m));
  if(m==='bacteria' && !el('bac-list').innerHTML) renderBacteria('');
  if(m==='lookup' && !el('lookup-results').innerHTML) renderLookup('');
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderBacteria(q){
  q=(q||'').trim().toLowerCase();
  let html='';
  BACTERIA.forEach((g,gi)=>{
    const items=g.items.filter(b=> !q || (b.name+' '+b.en+' '+(b.kw||'')).toLowerCase().includes(q));
    if(!items.length) return;
    html+=`<div class="bac-group-head">${g.group}</div>`;
    items.forEach(b=>{
      const bi=g.items.indexOf(b);
      html+=`<button class="bac-item" onclick="selectBacteria(${gi},${bi})"><span class="bi-name">${b.name}</span><span class="bi-en">${b.en}</span></button>`;
    });
  });
  el('bac-list').innerHTML = html || '<div class="bac-empty">找不到符合的菌名。</div>';
}

function selectBacteria(gi,bi){
  curBac=BACTERIA[gi].items[bi];
  el('bac-crumb').innerHTML=`<b>${curBac.name}</b> <span class="sep">·</span> ${curBac.en}`;
  el('bac-note').textContent=curBac.note||'';
  el('bac-regimens').innerHTML=curBac.regimens.map(renderRegimen).join('');
  el('bac-susc').innerHTML=abgForBac(curBac);
  const seen=[]; curBac.regimens.forEach(r=>r.drugs.forEach(k=>{if(!seen.includes(k))seen.push(k);}));
  el('bac-drugcards').innerHTML=seen.map(renderDrugCard).join('');
  show('bac-step-list',false); show('bac-step-result',true);
  window.scrollTo({top:0,behavior:'smooth'});
}

function backToBacteria(){ show('bac-step-list',true); show('bac-step-result',false); window.scrollTo({top:0,behavior:'smooth'}); }

function renderLookup(q){
  q=(q||'').trim().toLowerCase();
  let keys=Object.keys(DRUGS).filter(k=>{const d=DRUGS[k]; const prod=d.ntuhProducts?d.ntuhProducts.map(p=>(p.en||'')+' '+(p.zh||'')).join(' '):''; const hay=(d.name+' '+(d.zh||'')+' '+(d.brands?d.brands.join(' '):(d.en||''))+' '+prod+' '+d.cls).toLowerCase(); return !q || hay.includes(q);});
  keys.sort((a,b)=>DRUGS[a].name.localeCompare(DRUGS[b].name));
  el('lookup-count').textContent = q ? `${keys.length} 筆符合` : `共 ${keys.length} 種藥物`;
  el('lookup-results').innerHTML = keys.length ? keys.map(renderDrugCard).join('') : '<div class="bac-empty">找不到符合的藥物。</div>';
}

function backToSites(){
  curType=null;
  show('abx-step-site',true); show('abx-step-type',false); show('abx-step-result',false);
  window.scrollTo({top:0,behavior:'smooth'});
}

function backToTypes(){
  show('abx-step-type',true); show('abx-step-result',false);
  window.scrollTo({top:0,behavior:'smooth'});
}

function abxReset(){
  curSite=null; curType=null;
  show('abx-step-site',true); show('abx-step-type',false); show('abx-step-result',false);
  window.scrollTo({top:0,behavior:'smooth'});
}

document.addEventListener('DOMContentLoaded', function () {
  renderSites();
});
