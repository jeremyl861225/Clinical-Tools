/* 抗生素指引 antibiotics.html — render／互動邏輯。
   依賴全域資料（由 data/antibiotics/*.js 掛載於 window）：DRUGS, SITES, BACTERIA,
   COV_LABELS, COV_LABELS_FUNGAL, COV_LABELS_VIRAL, COV_LABELS_PARA, ROLE_TXT, ABG, ABG_ORG_LABEL,
   ABG_AB_LABEL, ABG_AB_DRUG, BAC_ABG。 */

/* 藥卡標題徽章列（收合時可判讀）：抗細菌＝六大覆蓋旗標，抗黴菌＝八類。
   四級 cov[key]：2=強效／在地%S≥90(亮粗框)、1=涵蓋／80–89(亮)、'p'=部分／變異／60–79(琥珀)、
   0 或缺=不涵蓋／<60(暗掉+刪除線)。分級以台大在地 %S 優先，缺在地資料者依文獻 spectrum。
   covSet：'fungal'=抗黴菌八旗標、'viral'=病毒別八旗標、'para'=抗寄生蟲旗標、缺省=抗細菌六旗標。
   d.catLabel（如抗結核）則只顯示單一類別標籤。 */
const COV_SETS = {fungal:()=>COV_LABELS_FUNGAL, viral:()=>COV_LABELS_VIRAL, para:()=>COV_LABELS_PARA};
function covTier(v){ return v===2?'sy-hi':(v===1?'yes':(v==='p'?'partial':'no')); }
function covLabels(set){ return COV_SETS[set] ? COV_SETS[set]() : COV_LABELS; }
/* 徽章皆為按鈕：點覆蓋旗標→列出同類別中涵蓋該病原的藥；點類別標籤→列出同類別的藥。
   徽章位於 <summary> 內，故 drugFilter() 需 preventDefault 以免同時展開／收合藥卡。 */
function covStrip(d){
  if(d.catLabel) return `<div class="dc-cov">${catBtn(d)}</div>`;
  if(!d.cov) return '';
  const set = d.covSet || 'default';
  const labels = covLabels(d.covSet);
  return `<div class="dc-cov">`+Object.keys(labels).map(key=>
    `<button type="button" class="cov-tag ${covTier(d.cov[key])}" title="列出涵蓋 ${labels[key]} 的藥物"
      onclick="drugFilter(event,'cov','${set}','${key}')">${labels[key]}</button>`).join('')+`</div>`;
}
function catBtn(d){
  const gi = drugGroupIdx(d);
  return `<button type="button" class="cov-tag cat" title="列出同類別藥物"
    onclick="drugFilter(event,'group',${gi})">${d.catLabel}</button>`;
}

/* 把 antibiogram 儲存格值轉成 {num, disp}：數字→%；字串如 "75(SDD)"→取前導數字分級、原字串顯示；
   NA／NI／無前導數字→null（略過）。 */
function abgCell(raw){
  if(typeof raw==='number') return {num:raw, disp:raw+'%'};
  const m=String(raw).match(/^(\d+)/);
  if(!m) return null;                          // NA / NI / No interpretive criteria
  return {num:+m[1], disp:String(raw)};        // 保留 (SDD) 等註記
}
function abgTier(n){ return n>=90?'sy-hi':(n>=80?'yes':(n>=60?'partial':'no')); }

/* 抗菌譜欄內的台大在地感受性徽章：依 d.abg（[{sec,col}]）列出該藥所在表格中「所有」有數值的菌種 %S。
   門檻：%S ≥90 亮＋加粗框、80–89 亮燈、60–79 琥珀、<60 暗掉＋刪除線。NA／NI 略過。 */
function abgSpectrum(d){
  if(!d.abg) return '';
  const cells=[];
  d.abg.forEach(m=>{
    const sec=ABG[m.sec]; if(!sec) return;
    const ci=sec.ab.indexOf(m.col); if(ci<0) return;
    Object.keys(sec.org).forEach(org=>{
      const c=abgCell(sec.org[org].S[ci]);
      if(!c) return;
      cells.push(`<span class="cov-tag ${abgTier(c.num)}">${ABG_ORG_LABEL[org]||org} ${c.disp}</span>`);
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
      const c=abgCell(rec.S[ci]);
      if(!c) return;
      cells.push(`<span class="cov-tag ${abgTier(c.num)}">${ABG_AB_LABEL[abk]||abk} ${c.disp}</span>`);
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

/* 劑量段落排版：把資料裡既有的 <br>／•／【】／子項結構排成有懸掛縮排的條列，
   純段落（無結構標記）原樣返回，不臆造斷行、不改動任何字元。
   注意：欄位字串內有大量「字面 <」（如「< 60 kg」「<12 歲」），故只按字面
   「<br>」切割，其餘（含 <b>、&nbsp; 等）全部原樣保留，切勿用會吃掉 <…> 的 regex。

   split=true（僅常用劑量／兒科劑量）時，另把「途徑（…）：適應症1：劑量；適應症2：劑量」
   這種長句在自然分句處（；／。）斷行，並把開頭的「途徑：」標頭獨立一行，提升可讀性。
   斷句只在括號外進行（不會切開「（max 8 g/劑）」），逐字不增不減。 */
const DOSE_ROUTE=/^(?:口服|靜脈注射|靜脈滴注|靜脈|肌肉注射|肌肉|皮下注射|皮下|吸入|鞘內|腦室內|間歇\s*IF|緩慢\s*IF|持續\s*IF|連續\s*IF|IF|IV|PO|IM|SC)/;
function balancedParen(s){
  let d=0; for(const c of s){ if(c==='（'||c==='(')d++; else if(c==='）'||c===')'){ if(--d<0)return false; } } return d===0;
}
/* 把一個長行切成子句行；回傳 [{text, head?}]。head 為「途徑：」標頭。 */
function doseLines(seg){
  const parts=[]; let cur='', depth=0;                    // 只在括號外（depth==0）於 ；／。 斷句
  for(const c of seg){
    cur+=c;
    if(c==='（'||c==='(')depth++;
    else if(c==='）'||c===')')depth--;
    else if((c==='；'||c==='。')&&depth===0){ parts.push(cur); cur=''; }
  }
  if(cur.trim())parts.push(cur);
  const lines=parts.filter(p=>p.trim()).map(p=>({text:p.trim()}));
  if(lines.length){                                       // 首段若為「途徑（…）：…」拆出標頭
    const first=lines[0].text;
    if(DOSE_ROUTE.test(first)){
      const ci=first.indexOf('：');
      if(ci>0 && ci<first.length-1 && ci<=30 && balancedParen(first.slice(0,ci))){
        const rest=first.slice(ci+1).trim();
        lines.splice(0,1,{text:first.slice(0,ci+1),head:true},
                          ...(rest?[{text:rest}]:[]));
      }
    }
  }
  return lines;
}
function fmtDose(text,split){
  const t=String(text);
  const struct = t.indexOf('<br>')>=0 || t.trimStart()[0]==='•' || t.indexOf('【')>=0;
  if(!struct && !split) return t;                         // 一般欄位：無結構即原樣
  if(!struct && split){                                   // 劑量欄：僅在有可斷結構時才排版，單句原樣返回
    const trimmed=t.trim();
    const multi = t.indexOf('；')>=0 || DOSE_ROUTE.test(trimmed) || trimmed.slice(0,-1).indexOf('。')>=0;
    if(!multi) return t;
  }
  let html='';
  for(let raw of t.split(/<br\s*\/?>/i)){
    const s=raw.trim();
    if(!s) continue;
    const sub=s.replace(/^(?:&nbsp;|&emsp;|\s)+[-–]\s*/,'');       // 子項：縮排後接短橫
    if(sub!==s){ html+=`<div class="dl-sub">${sub}</div>`; continue; }
    if(s[0]==='•'){ html+=`<div class="dl-item">${s.slice(1).trim()}</div>`; continue; }
    if(/^【[^】]*】$/.test(s)){ html+=`<div class="dl-sect">${s}</div>`; continue; } // 整段為【段標】
    if(split){                                                     // 長行：拆途徑標頭＋子句各一行
      for(const ln of doseLines(s))
        html += ln.head ? `<div class="dl-head">${ln.text}</div>`
                        : `<div class="dl-line">${ln.text}</div>`;
    } else {
      html+=`<div class="dl-line">${s}</div>`;                     // 給藥途徑／說明／續行
    }
  }
  return `<div class="dose-fmt">${html}</div>`;
}

function renderDrugCard(k){
  const d=DRUGS[k];
  const field=(label,text,warn,split)=> (text&&String(text).trim())?
    `<div class="dc-field"><div class="dc-flabel">${label}</div>
     <div class="dc-ftext ${warn?'dc-warn':''}">${fmtDose(text,split)}</div></div>` : '';
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
  // 懷孕藥品分級：開頭若是字母分級(A/B/C/D/X，可帶 B1 等)就做成徽章，其餘說明文字接在後面；
  // 台大未給字母分級者（只有敘述）則純文字呈現，不硬套 "Category"。
  let pregField='';
  if(d.preg){
    const m = String(d.preg).match(/^\s*([ABCDX]\d?)\s*([\s\S]*)$/);
    const grade = m ? m[1] : '';
    const note  = m ? m[2].trim() : String(d.preg).trim();
    pregField = `<div class="dc-field"><div class="dc-flabel">懷孕藥品分級</div><div class="dc-ftext">`+
      (grade?`<span class="dc-preg">Category ${grade}</span>`:'')+
      (note?`<span class="dc-pregnote">${note}</span>`:'')+
      `</div></div>`;
  }
  /* 剝半／磨粉／管餵建議（台大藥劑部 crush 建議；口服劑型才有）。
     h=剝半 c=磨粉 cap=打開膠囊 t=管餵；'Y'／'N'，缺值代表該劑型不適用
     （膠囊只會有 cap，不會有 h/c），故缺值不顯示，避免無中生有。 */
  let crushField='';
  if(d.crush){
    const cr=d.crush;
    const tag=(lbl,v)=> v ? `<span class="crush-tag ${v==='Y'?'yes':'no'}">${lbl} ${v==='Y'?'可':'不可'}</span>` : '';
    const tags=[tag('剝半',cr.h),tag('磨粉',cr.c),tag('打開膠囊',cr.cap),tag('管餵',cr.t)].join('');
    if(tags||cr.why||cr.note){
      crushField=`<div class="dc-field"><div class="dc-flabel">剝半／磨粉／管餵</div><div class="dc-ftext">`+
        (tags?`<div class="crush-tags">${tags}</div>`:'')+
        (cr.why?`<div class="crush-note"><b>理由：</b>${cr.why}</div>`:'')+
        (cr.note?`<div class="crush-note"><b>管餵處理：</b>${cr.note}</div>`:'')+
        `</div></div>`;
    }
  }
  /* 飲食交互作用（台大 food 子頁）：f=食品 s=嚴重度 e=影響 m=處置。
     嚴重度沿用感受性徽章的語彙：禁忌／重大＝警示色，其餘＝中性。 */
  let foodField='';
  if(d.food && d.food.length){
    const sevCls=(x)=> (x==='禁忌'||x==='重大') ? 'hi' : 'mid';
    foodField=`<div class="dc-field"><div class="dc-flabel">飲食交互作用</div><div class="dc-ftext">`+
      d.food.map(x=>`<div class="food-item">
        <div class="food-head"><span class="food-name">${x.f}</span>${x.s?`<span class="food-sev ${sevCls(x.s)}">${x.s}</span>`:''}</div>
        ${x.e?`<div class="food-note">${x.e}</div>`:''}
        ${x.m?`<div class="food-note"><b>處置：</b>${x.m}</div>`:''}
      </div>`).join('')+`</div></div>`;
  }
  // 注射給藥指引（若為注射劑；口服藥不設此欄）
  let injField='';
  if(d.injection){
    const j=d.injection;
    const row=(t,v)=> v?`<tr><td>${t}</td><td>${v}</td></tr>`:'';
    injField=`<div class="dc-field"><div class="dc-flabel">注射給藥指引</div><div class="dc-ftext"><table class="inj-tbl"><tbody>`+
      row('給藥途徑',j.route)+row('溶解液',j.reconstitute)+row('稀釋液',j.diluent)+
      row('每劑體積',j.volume)+row('給藥濃度',j.conc)+row('輸注時間',j.time)+
      row('其他途徑',j.altRoutes)+row('注意事項',j.notes)+
      row('原包裝儲存',j.storage)+row('溶解後安定性',j.stabRecon)+
      row('稀釋後安定性',j.stabDilute)+row('安定性備註',j.stabNote)+
      row('容器相容性',j.container)+
      `</tbody></table></div></div>`;
  }
  return `<details class="drugcard" id="drug-${k}">
    <summary><span class="dc-name">${d.name}</span>${zh}<span class="dc-nameen">${sub}</span><button type="button" class="dc-class" title="列出同類別藥物" onclick="drugFilter(event,'group',${drugGroupIdx(d)})">${d.cls}</button>${covStrip(d)}</summary>
    <div class="dc-body">
      ${brandField}
      ${field(d.usualDose?'常用劑量':'劑量（成人）',d.usualDose||d.dose,false,true)}
      ${field('兒科劑量',d.peds,false,true)}
      ${field('最大劑量',d.maxDose)}
      ${renalField}
      ${field('肝功能調整',d.hepatic)}
      ${field('透析劑量（HD／PD）',d.dialysis)}
      ${field('CVVH／CRRT 劑量',d.cvvh)}
      ${injField}
      ${crushField}
      ${foodField}
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

/* 依病原菌，回傳台大在地感受性 %S≥80（亮/亮粗框）的藥卡 key（去重、過濾無卡者）。 */
function suscDrugsFor(b){
  const map=BAC_ABG[b.en]; if(!map) return [];
  const list=Array.isArray(map)?map:[map];
  const out=[];
  list.forEach(m=>{
    const sec=ABG[m.sec]; if(!sec) return;
    const rec=sec.org[m.org]; if(!rec) return;
    sec.ab.forEach((abk,ci)=>{
      const c=abgCell(rec.S[ci]);
      if(!c || c.num<80) return;                 // 只納入亮(80–89)／亮粗框(≥90)
      const dk=ABG_AB_DRUG[abk];
      if(dk && DRUGS[dk] && !out.includes(dk)) out.push(dk);
    });
  });
  return out;
}

function selectBacteria(gi,bi){
  curBac=BACTERIA[gi].items[bi];
  el('bac-crumb').innerHTML=`<b>${curBac.name}</b> <span class="sep">·</span> ${curBac.en}`;
  el('bac-note').textContent=curBac.note||'';
  el('bac-regimens').innerHTML=curBac.regimens.map(renderRegimen).join('');
  el('bac-susc').innerHTML=abgForBac(curBac);
  const seen=[]; curBac.regimens.forEach(r=>r.drugs.forEach(k=>{if(!seen.includes(k))seen.push(k);}));
  // 追加台大在地感受性亮/亮粗框（%S≥80）之藥物（regimen 未含者接在後面）
  suscDrugsFor(curBac).forEach(k=>{ if(!seen.includes(k)) seen.push(k); });
  el('bac-drugcards').innerHTML=seen.map(renderDrugCard).join('');
  show('bac-step-list',false); show('bac-step-result',true);
  window.scrollTo({top:0,behavior:'smooth'});
}

function backToBacteria(){ show('bac-step-list',true); show('bac-step-result',false); window.scrollTo({top:0,behavior:'smooth'}); }

/* 查詢模式的「種類排序」分組。

   ⚠ 比對順序與顯示順序是兩回事，不可混用同一份陣列：
   比對必須先看 catLabel／covSet（streptomycin 的 cls 含 aminoglycoside 但屬抗結核，
   fenticonazole 的 cls 是 Imidazole 但屬抗黴菌），其餘抗細菌藥才依 cls 歸類；
   而顯示要依臨床習慣排：抗細菌 → 抗細菌（其他）→ 黴菌 → 黴菌（其他）→ 抗病毒
   → 抗結核／抗麻風 → 抗寄生蟲。故以 DRUG_GROUPS 定比對優先序，GROUP_ORDER 定顯示序。 */
const DRUG_GROUPS = [
  ['抗結核 Anti-TB',              d=>d.catLabel==='抗結核'],
  ['抗麻風 Anti-leprosy',         d=>d.catLabel==='抗麻風'],
  ['多烯類 Polyenes',             d=>d.covSet==='fungal' && /polyene/i.test(d.cls||'')],
  ['棘白菌素 Echinocandins',      d=>d.covSet==='fungal' && /echinocandin/i.test(d.cls||'')],
  ['唑類 Azoles',                 d=>d.covSet==='fungal' && /azole/i.test(d.cls||'')],
  ['抗黴菌（其他） Antifungals (other)',              d=>d.covSet==='fungal'],
  ['抗寄生蟲 Antiparasitics',     d=>d.covSet==='para'],
  ['HIV 抗反轉錄病毒 HIV ART',    d=>d.covSet==='viral' && /\bHIV\b/i.test(d.cls||'')],
  ['肝炎抗病毒 Hepatitis B／C',   d=>d.covSet==='viral' && /\bHBV\b|\bHCV\b/i.test(d.cls||'')],
  ['抗病毒 Antivirals',           d=>d.covSet==='viral'],
  ['青黴素類 Penicillins',        d=>/penicillin/i.test(d.cls||'') && !/cephalosporin/i.test(d.cls||'')],
  ['頭孢子菌素類 Cephalosporins', d=>/cephalosporin|cephamycin/i.test(d.cls||'')],
  ['碳青黴烯類 Carbapenems',      d=>/carbapenem/i.test(d.cls||'')],
  ['單環內醯胺 Monobactam',       d=>/monobactam/i.test(d.cls||'')],
  ['抗 Gram(+)／anti-MRSA',       d=>/glycopeptide|lipopeptide|oxazolidinone/i.test(d.cls||'')],
  ['胺基醣苷類 Aminoglycosides',  d=>/aminoglycoside/i.test(d.cls||'')],
  ['氟喹諾酮類 Fluoroquinolones', d=>/fluoroquinolone|quinolone/i.test(d.cls||'')],
  ['四環素／甘胺醯環素 Tetracyclines／Glycylcyclines',          d=>/tetracycline|glycylcycline/i.test(d.cls||'')],
  ['巨環／林可醯胺類 Macrolides／Lincosamides',            d=>/macrolide|lincosamide/i.test(d.cls||'')],
  ['硝基咪唑類 Nitroimidazole',   d=>/nitroimidazole/i.test(d.cls||'')],
  ['多黏菌素 Polymyxin',          d=>/polymyxin/i.test(d.cls||'')],
  ['抗細菌（其他） Antibacterials (other)',              d=>true],   // 走到這裡的必為抗細菌：黴菌／病毒／寄生蟲／抗結核已於上方攔截
];
// 顯示順序（未列到的排在最後，不會消失）
const GROUP_ORDER = [
  '青黴素類 Penicillins','頭孢子菌素類 Cephalosporins','碳青黴烯類 Carbapenems',
  '單環內醯胺 Monobactam','抗 Gram(+)／anti-MRSA','胺基醣苷類 Aminoglycosides',
  '氟喹諾酮類 Fluoroquinolones','四環素／甘胺醯環素 Tetracyclines／Glycylcyclines','巨環／林可醯胺類 Macrolides／Lincosamides',
  '硝基咪唑類 Nitroimidazole','多黏菌素 Polymyxin','抗細菌（其他） Antibacterials (other)',
  '多烯類 Polyenes','棘白菌素 Echinocandins','唑類 Azoles','抗黴菌（其他） Antifungals (other)',
  'HIV 抗反轉錄病毒 HIV ART','肝炎抗病毒 Hepatitis B／C','抗病毒 Antivirals',
  '抗結核 Anti-TB','抗麻風 Anti-leprosy','抗寄生蟲 Antiparasitics',
];
function drugGroupIdx(d){ for(let i=0;i<DRUG_GROUPS.length;i++) if(DRUG_GROUPS[i][1](d||{})) return i; return DRUG_GROUPS.length-1; }
function groupSortIdx(d){
  const p = GROUP_ORDER.indexOf(DRUG_GROUPS[drugGroupIdx(d)][0]);
  return p < 0 ? GROUP_ORDER.length : p;      // 未列入 GROUP_ORDER 者殿後，不遺失
}

/* 類別標題可點擊摺疊。收合狀態存 Set，重繪（搜尋／切換排序）後仍保留。 */
const collapsedGroups = new Set();
function toggleGroup(label){
  if(collapsedGroups.has(label)) collapsedGroups.delete(label); else collapsedGroups.add(label);
  renderLookup(el('lookup-input') ? el('lookup-input').value : '');
}
function setAllGroups(collapse){
  collapsedGroups.clear();
  if(collapse) GROUP_ORDER.forEach(g=>collapsedGroups.add(g));
  renderLookup(el('lookup-input') ? el('lookup-input').value : '');
}

/* 徽章連結：點藥卡上的徽章→切到「藥物查詢」並套用篩選。
   lookupFilter = {kind:'cov', set, key} | {kind:'group', idx} | null。
   覆蓋旗標只在同一 covSet 內比較（抗細菌六旗標／黴菌／病毒／寄生蟲各自獨立，語意不通用）。 */
let lookupFilter=null;
function drugFilter(ev, kind, a, b){
  ev.preventDefault(); ev.stopPropagation();          // 別讓 <summary> 跟著展開
  lookupFilter = (kind==='cov')
    ? {kind:'cov', set:a, key:b, label:covLabels(a)[b]}
    : {kind:'group', idx:a, label:DRUG_GROUPS[a][0]};
  const inp=el('lookup-input'); if(inp) inp.value='';  // 清掉文字查詢，避免兩層條件相互抵銷
  switchMode('lookup');
  renderLookup('');
}
function clearDrugFilter(){
  lookupFilter=null;
  renderLookup(el('lookup-input')?el('lookup-input').value:'');
}
function renderFilterChip(){
  const box=el('lookup-filter'); if(!box) return;
  if(!lookupFilter){ box.innerHTML=''; return; }
  const txt = lookupFilter.kind==='cov' ? `涵蓋 ${lookupFilter.label}` : lookupFilter.label;
  box.innerHTML=`<span class="lf-lbl">篩選</span><span class="lf-chip">${txt}`+
    `<button type="button" class="lf-x" onclick="clearDrugFilter()" aria-label="清除篩選">×</button></span>`;
}

let lookupSort='alpha';
function setLookupSort(mode){
  lookupSort=mode;
  document.querySelectorAll('.lookup-sort .abx-sortbtn').forEach(b=>b.classList.toggle('active', b.dataset.sort===mode));
  renderLookup(el('lookup-input')?el('lookup-input').value:'');
}

function renderLookup(q){
  q=(q||'').trim().toLowerCase();
  let keys=Object.keys(DRUGS).filter(k=>{const d=DRUGS[k]; const prod=d.ntuhProducts?d.ntuhProducts.map(p=>(p.en||'')+' '+(p.zh||'')).join(' '):''; const hay=(d.name+' '+(d.zh||'')+' '+(d.brands?d.brands.join(' '):(d.en||''))+' '+prod+' '+d.cls).toLowerCase(); return !q || hay.includes(q);});
  if(lookupFilter){
    keys=keys.filter(k=>{
      const d=DRUGS[k];
      if(lookupFilter.kind==='group') return drugGroupIdx(d)===lookupFilter.idx;
      if((d.covSet||'default')!==lookupFilter.set || !d.cov) return false;
      const v=d.cov[lookupFilter.key];
      return v===2||v===1||v==='p';           // 強效／涵蓋／部分皆列入，暗掉（不涵蓋）者排除
    });
  }
  renderFilterChip();
  el('lookup-count').textContent = (q||lookupFilter) ? `${keys.length} 筆符合` : `共 ${keys.length} 種藥物`;
  if(!keys.length){ el('lookup-results').innerHTML='<div class="bac-empty">找不到符合的藥物。</div>'; return; }
  const byName=(a,b)=>DRUGS[a].name.localeCompare(DRUGS[b].name);
  if(lookupSort==='class'){
    // 依顯示順序（GROUP_ORDER）排，而非比對優先序
    keys.sort((a,b)=>{const ga=groupSortIdx(DRUGS[a]),gb=groupSortIdx(DRUGS[b]); return ga!==gb?ga-gb:byName(a,b);});
    const groups=[];                      // [{label, keys[]}]
    keys.forEach(k=>{
      const lbl=DRUG_GROUPS[drugGroupIdx(DRUGS[k])][0];
      if(!groups.length || groups[groups.length-1].label!==lbl) groups.push({label:lbl, keys:[]});
      groups[groups.length-1].keys.push(k);
    });
    let html=`<div class="grp-allctl">`+
      `<button type="button" class="abx-sortbtn" onclick="setAllGroups(true)">全部收合</button>`+
      `<button type="button" class="abx-sortbtn" onclick="setAllGroups(false)">全部展開</button></div>`;
    groups.forEach(g=>{
      const off=collapsedGroups.has(g.label);
      html+=`<button type="button" class="bac-group-head${off?' collapsed':''}"
        aria-expanded="${!off}" onclick="toggleGroup('${g.label.replace(/'/g,"\\'")}')">`+
        `<span class="grp-caret">${off?'▸':'▾'}</span><span class="grp-name">${g.label}</span>`+
        `<span class="grp-count">${g.keys.length}</span></button>`;
      if(!off) html+=g.keys.map(renderDrugCard).join('');
    });
    el('lookup-results').innerHTML=html;
  } else {
    keys.sort(byName);
    el('lookup-results').innerHTML = keys.map(renderDrugCard).join('');
  }
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

/* ---- 深層連結：供首頁全站查詢直接跳至指定藥物／病原菌／感染部位 ----
   #drug=<key>    藥物查詢模式並展開該藥卡
   #bac=<英文名>  依病原菌模式並選定該菌
   #site=<index>  依部位模式並選定該部位                                    */
function applyHash(){
  const h=decodeURIComponent((location.hash||'').replace(/^#/,''));
  if(!h) return false;
  let m;
  // 由菌譜資料庫（第四分頁）點回前三分頁時使用
  if((m=h.match(/^mode=(empiric|bacteria|lookup)$/))){ switchMode(m[1]); return true; }
  if((m=h.match(/^site=(\d+)$/))){
    const i=+m[1];
    if(SITES[i]){ switchMode('empiric'); selectSite(i); return true; }
  }
  if((m=h.match(/^bac=(.+)$/))){
    for(let gi=0; gi<BACTERIA.length; gi++){
      const bi=BACTERIA[gi].items.findIndex(b=>b.en===m[1]);
      if(bi>-1){ switchMode('bacteria'); renderBacteria(''); selectBacteria(gi,bi); return true; }
    }
  }
  if((m=h.match(/^drug=(.+)$/))){
    if(DRUGS[m[1]]){
      switchMode('lookup'); renderLookup('');
      // 讓 switchMode 的捲動先完成，openDrug 的 scrollIntoView 才不會被蓋掉
      setTimeout(()=>openDrug(m[1]), 60);
      return true;
    }
  }
  return false;
}

/* 由菌譜資料庫（spectrum-database.html）點藥名進來時帶 ?from=spectrum，
   顯示「返回菌譜資料庫」；返回後由該頁自 sessionStorage 還原原本捲動位置。 */
function applyBackContext(){
  var from='';
  try{ from=new URLSearchParams(location.search).get('from')||''; }catch(e){}
  if(from==='spectrum'){
    var b=document.getElementById('back-to-spectrum');
    if(b) b.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  renderSites();
  applyBackContext();
  applyHash();
});
window.addEventListener('hashchange', applyHash);
