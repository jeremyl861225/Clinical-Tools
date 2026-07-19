
/* ============================================================
   渲染 Rendering
   ============================================================ */
var GROUP_ORDER = ['消化系 GI','婦科 Gynecologic','內分泌／乳房 Endocrine/Breast','胸腔 Thoracic','骨與軟組織 Bone & Soft Tissue','頭頸 Head & Neck','泌尿 Genitourinary','血液淋巴 Hematolymphoid'];

/* 家族（兩層選單）：範圍大到一張清單塞不下的癌別群（婦癌）先收成一張卡，
   點進去再選細分項。成員癌別本身仍是獨立的 CANCERS 條目——搜尋、#cancer= 深層
   連結、三個分頁的渲染都不受影響；家族只改變「未搜尋時」的第一層長相。 */
function familyOf(id){
  var F = window.CANCER_FAMILIES || [];
  for(var i=0;i<F.length;i++){ if(F[i].members.indexOf(id) !== -1) return F[i]; }
  return null;
}

/* 癌別方磚:圖檔以癌別 id 命名(assets/organs/<id>.png),故不需另維護對照表。
   婦科細分項共用家族圖版(同為子宮／卵巢構造)。無對應圖版者以 no-img 呈現純色方磚,不破圖。 */
var ONC_TILE_IMG = {
  gyn:1, lung:1, esoph:1, gastric:1, panc:1, breast:1, gist:1, thyroid:1,
  colorectal:1, anal:1, appendix:1, hcc:1, cca:1, net:1, sts:1,
  npc:1, hnc:1, uro:1, heme:1,
  cervix:'gyn', endometrial:'gyn', utsarc:'gyn', ovarian:'gyn',
  utuc:'uro', rcc:'uro', bladder:'uro', prostate:'uro'
};
function oncTile(id, zh, en, onclick, extraClass, extraHtml){
  var m = ONC_TILE_IMG[id];
  var file = m === 1 ? id : m;                        // 1=同名檔;字串=共用他者圖版
  var img = file
    ? '<img class="oc-img" src="../assets/organs/'+file+'.png" alt="" loading="lazy" decoding="async">'
    : '';
  return '<button class="onc-card'+(extraClass||'')+(file?'':' no-img')+'" onclick="'+onclick+'">'+
           img+'<span class="oc-scrim"></span>'+
           '<span class="oc-label">'+
             '<span class="oc-name">'+escapeHtml(zh)+'</span>'+
             '<span class="oc-en">'+escapeHtml(en)+'</span>'+
             (extraHtml||'')+
           '</span></button>';
}

function renderPicker(filter){
  filter = (filter||'').trim().toLowerCase();
  var families = window.CANCER_FAMILIES || [];
  var byGroup = {};
  // 搜尋時一律攤平到癌別本身：使用者打「卵巢」要直接看到卵巢癌，不該再多點一層家族卡。
  var grouped = !filter;
  var shown = {};

  CANCERS.forEach(function(c){
    if(filter){
      // 子分型名稱一併納入比對：大腸直腸癌之標題不含「結腸／直腸」字樣，
      // 打「結腸」「直腸」「colon」「rectum」仍須找得到這張卡。
      var hay = (c.zh + ' ' + c.en + ' ' + c.id + ' ' +
        (c.subtypes || []).map(function(s){
          return (s.label || '') + ' ' + (s.search_label || '') + ' ' + (s.search_en || '') + ' ' + (s.key || '');
        }).join(' ')).toLowerCase();
      if(hay.indexOf(filter) === -1) return;
    }
    var fam = grouped ? familyOf(c.id) : null;
    if(fam){
      if(shown[fam.id]) return;          // 同一家族只放一張卡
      shown[fam.id] = 1;
      (byGroup[fam.group] = byGroup[fam.group] || []).push({fam:fam});
    } else {
      (byGroup[c.group] = byGroup[c.group] || []).push({c:c});
    }
  });

  var html = '';
  var groups = GROUP_ORDER.filter(function(g){return byGroup[g];});
  Object.keys(byGroup).forEach(function(g){ if(groups.indexOf(g)===-1) groups.push(g); });
  if(groups.length === 0){
    html = '<div class="onc-empty">找不到符合「'+escapeHtml(filter)+'」的癌症。</div>';
  }
  groups.forEach(function(g){
    html += '<div class="onc-group-head">'+escapeHtml(g)+'</div><div class="onc-grid">';
    byGroup[g].forEach(function(x){
      if(x.fam){
        html += oncTile(x.fam.id, x.fam.zh, x.fam.en, 'showFamily(\''+x.fam.id+'\')',
                        ' is-family', '<span class="oc-count">'+x.fam.members.length+' 項</span>');
      } else {
        html += oncTile(x.c.id, x.c.zh, x.c.en, 'showDetail(\''+x.c.id+'\')');
      }
    });
    html += '</div>';
  });
  document.getElementById('oncPicker').innerHTML = html;
}

/* 點家族方磚 → 直接進入第一個成員的癌別頁，癌別切換交給頁內的 familyBar()。
   與大腸直腸癌的部位切換列同款：不再有一層「選癌別」的中間頁，少一次點擊，
   且在四個癌別之間比對時不必退回上一層。 */
function showFamily(fid){
  var F = (window.CANCER_FAMILIES||[]).filter(function(f){return f.id===fid;})[0];
  if(!F || !F.members.length) return;
  showDetail(F.members[0]);
}

/* 家族切換列：外觀與 subtypeBar 相同（.onc-subtype），差別在成員是各自獨立的
   CANCERS 條目，故 onclick 走 setFamilyMember() 而非 setSubtype()。 */
function familyBar(id){
  var F = familyOf(id);
  if(!F) return '';
  var h = '<div class="nd-ctrl onc-subtype"><div class="nd-h">'+
          escapeHtml(F.bar_label || '癌別 Cancer type')+'</div><div class="nd-btns">';
  F.members.forEach(function(mid){
    var c = CANCERS.filter(function(x){return x.id===mid;})[0];
    if(!c) return;
    h += '<button class="nd-btn'+(mid===id?' active':'')+
         '" onclick="setFamilyMember(\''+mid+'\')">'+escapeHtml(c.zh)+'</button>';
  });
  return h + '</div></div>';
}

/* 切換家族成員時沿用目前分頁——使用者在比對「四種婦癌的淋巴結」時，
   不該每換一個癌別就被丟回分期頁。
   刻意不依賴任何跨癌別的分頁狀態變數：先從 DOM 讀目前分頁，重繪後再切回去，
   如此本函式自足，不與其他機制耦合。 */
function setFamilyMember(id){
  var cur = document.querySelector('.onc-tab.active');
  var tab = cur ? cur.getAttribute('data-t') : 'stage';
  showDetail(id, true);
  switchTab(id, tab);
}

/* ---------- 子分型（同一癌別下依部位分流）----------
   結腸／直腸為同一 AJCC 分期表但治療流程、淋巴結分群與文獻皆不同，
   故合併為單一癌別條目、進入後先選部位；所選部位之欄位覆寫基礎條目，
   使三個分頁一律只呈現該部位之內容，不致混用。
   base 提供兩部位共通者（T／N／M 定義、分期矩陣、共用文獻），
   subtype 提供部位專屬者（staging_note、nodes、node_note、pathway、tx、專屬文獻）。 */
var SUBTYPE = {};        // cancerId -> 目前選取之子分型 key
var ACTIVE_TAB = {};     // cancerId -> 目前分頁，切換子分型時保留

function subtypeOf(c){
  if(!c || !c.subtypes || !c.subtypes.length) return null;
  var key = SUBTYPE[c.id] || c.subtypes[0].key;
  return c.subtypes.filter(function(x){return x.key === key;})[0] || c.subtypes[0];
}

/* 將選取之子分型覆寫至基礎條目，交給既有的 render* 函式（其不需知道子分型存在） */
function resolveCancer(c){
  var st = subtypeOf(c);
  if(!st) return c;
  var out = {};
  Object.keys(c).forEach(function(k){ if(k !== 'subtypes') out[k] = c[k]; });
  Object.keys(st).forEach(function(k){
    if(k === 'key' || k === 'label' || k === 'refs') return;
    out[k] = st[k];
  });
  // 文獻：共用（base）＋ 部位專屬（subtype）串接，避免兩處各留一份而分岔
  if(st.refs) out.refs = (c.refs || []).concat(st.refs);
  out._sub = st.key;
  return out;
}

function setSubtype(id, key){
  SUBTYPE[id] = key;
  showDetail(id, true);
}

function subtypeBar(c){
  if(!c.subtypes || !c.subtypes.length) return '';
  var cur = (subtypeOf(c) || {}).key;
  var h = '<div class="nd-ctrl onc-subtype"><div class="nd-h">'+
          escapeHtml(c.subtype_label || '部位 Site')+'</div><div class="nd-btns">';
  c.subtypes.forEach(function(s){
    h += '<button class="nd-btn'+(s.key===cur?' active':'')+
         '" onclick="setSubtype(\''+c.id+'\',\''+s.key+'\')">'+escapeHtml(s.label)+'</button>';
  });
  return h + '</div></div>';
}

function showDetail(id, keepScroll){
  var base = CANCERS.find(function(x){return x.id === id;});
  if(!base) return;
  var c = resolveCancer(base);
  var tab = ACTIVE_TAB[id] || 'stage';
  document.getElementById('oncPicker').style.display = 'none';
  document.getElementById('oncSearch').style.display = 'none';
  var d = document.getElementById('oncDetail');
  d.style.display = 'block';
  // 家族（婦癌）已無中間層——癌別改由頁內的 familyBar() 切換，故返回鍵一律回最上層清單。
  var back = '<button class="onc-back" onclick="backToPicker()">← 返回癌症清單</button>';
  // 尚未整編的癌別:只給標題與「網站架設中」,不進三分頁——沒有資料的空分頁比明講更難用。
  if(c.wip){
    d.innerHTML = back+
      '<h2 class="onc-title">'+escapeHtml(c.zh)+'<span class="oct-en">'+escapeHtml(c.en)+'</span></h2>'+
      '<div class="onc-wip">網站架設中</div>';
    if(!keepScroll) window.scrollTo(0,0);
    return;
  }
  d.innerHTML = back+
    '<h2 class="onc-title">'+escapeHtml(c.zh)+'<span class="oct-en">'+escapeHtml(c.en)+'</span></h2>'+
    familyBar(id)+
    subtypeBar(base)+
    '<div class="onc-edition">'+escapeHtml(c.edition)+'</div>'+
    '<div class="onc-tabs">'+
      '<button class="onc-tab'+(tab==='stage'?' active':'')+'" data-t="stage" onclick="switchTab(\''+id+'\',\'stage\')">分期 TNM</button>'+
      '<button class="onc-tab'+(tab==='node'?' active':'')+'" data-t="node" onclick="switchTab(\''+id+'\',\'node\')">淋巴結分群</button>'+
      '<button class="onc-tab'+(tab==='tx'?' active':'')+'" data-t="tx" onclick="switchTab(\''+id+'\',\'tx\')">治療建議</button>'+
    '</div>'+
    '<div id="oncTab"></div>'+
    renderRefs(c);
  switchTab(id, tab);
  if(!keepScroll) window.scrollTo(0,0);
}

function backToPicker(){
  document.getElementById('oncDetail').style.display = 'none';
  document.getElementById('oncPicker').style.display = 'block';
  document.getElementById('oncSearch').style.display = 'block';
  window.scrollTo(0,0);
}

function switchTab(id, tab){
  var c = resolveCancer(CANCERS.find(function(x){return x.id === id;}));
  ACTIVE_TAB[id] = tab;
  document.querySelectorAll('.onc-tab').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-t') === tab);
  });
  var el = document.getElementById('oncTab');
  if(tab === 'stage') el.innerHTML = renderStage(c);
  else if(tab === 'node') el.innerHTML = renderNode(c);
  else {
    el.innerHTML = renderTx(c);
    if(c.pathway === 'gastric' && typeof initGastricPathway === 'function') initGastricPathway();
    if(c.pathway === 'breast' && typeof initBreastPathway === 'function') initBreastPathway();
    if(c.pathway === 'colon' && typeof initColonPathway === 'function') initColonPathway();
    if(c.pathway === 'rectal' && typeof initRectalPathway === 'function') initRectalPathway();
    if(c.pathway === 'panc' && typeof initPancPathway === 'function') initPancPathway();
    if(c.pathway === 'hcc' && typeof initHccPathway === 'function') initHccPathway();
    if(c.pathway === 'sts' && typeof initStsPathway === 'function') initStsPathway();
    if(c.pathway === 'pnet' && typeof initPnetPathway === 'function') initPnetPathway();
    if(c.pathway === 'net' && typeof initNetPathway === 'function') initNetPathway();
    if(c.pathway === 'cervix' && typeof initCervixPathway === 'function') initCervixPathway();
    if(c.pathway === 'endo' && typeof initEndoPathway === 'function') initEndoPathway();
    if(c.pathway === 'utsarc' && typeof initUtsarcPathway === 'function') initUtsarcPathway();
    if(c.pathway === 'ovarian' && typeof initOvarianPathway === 'function') initOvarianPathway();
    if(c.pathway === 'utuc' && typeof initUtucPathway === 'function') initUtucPathway();
    if(c.pathway === 'rcc' && typeof initRccPathway === 'function') initRccPathway();
    if(c.pathway === 'bladder' && typeof initBladderPathway === 'function') initBladderPathway();
    if(c.pathway === 'prostate' && typeof initProstatePathway === 'function') initProstatePathway();
    if(c.pathway === 'npc' && typeof initNpcPathway === 'function') initNpcPathway();
  }
}

var MTX_VARIANT = {};   // cancerId -> 目前選取之變體 key

function setMatrixVariant(id, key){ MTX_VARIANT[id] = key; switchTab(id, 'stage'); }

function renderStage(c){
  var h = '';
  if(c.staging_note) h += '<p class="onc-note">'+c.staging_note+'</p>';
  // tnm_figo_label 存在時，T／N／M 表加一欄對應之 FIGO 期別（列資料第 3 元素）。
  // 此為 AJCC 手冊本身對婦癌採用的版面（T｜FIGO Stage｜定義），兩套代碼並列才看得出對應。
  h += tnmTable('T — 原發腫瘤', c.t, c.tnm_figo_label);
  h += tnmTable('N — 區域淋巴結', c.n, c.tnm_figo_label);
  h += tnmTable('M — 遠處轉移', c.m, c.tnm_figo_label);
  if(c.matrices && c.matrices.length){
    // 分期依判別軸（年齡／組織型態／部位…）分為多張表
    var key = MTX_VARIANT[c.id] || c.matrices[0].key;
    var v = c.matrices.filter(function(x){return x.key === key;})[0] || c.matrices[0];
    h += '<div class="nd-ctrl"><div class="nd-h">'+escapeHtml(c.matrix_axis || '分期依據')+'</div><div class="nd-btns">';
    c.matrices.forEach(function(x){
      h += '<button class="nd-btn'+(x.key===v.key?' active':'')+'" onclick="setMatrixVariant(\''+c.id+'\',\''+x.key+'\')">'+
           escapeHtml(x.label)+'</button>';
    });
    h += '</div></div>';
    if(v.note) h += '<div class="nd-def">'+v.note+'</div>';
    h += renderMatrix(v);
  } else if(c.matrix){
    h += renderMatrix(c.matrix);
  }
  // stages 為獨立區塊，不與 matrix 互斥：GIST（AJCC TNM ＋ AFIP 風險分級）、
  // HCC（AJCC ＋ BCLC）等癌別兩者並存，且各自回答不同問題。
  if(c.stages && c.stages.length){
    if(c.staging_system) h += '<div class="nd-def">分期系統：<b>'+escapeHtml(c.staging_system)+'</b></div>';
    h += '<div class="onc-sec-h">'+escapeHtml(c.stages_title || '分期組合 Stage Grouping')+'</div>';
    // 首欄標題可覆寫：stages 也用於非期別之系統（GIST 風險分級、HCC BCLC、STS 之 FNCLCC 分級），
    // 該處硬寫「分期」會與內容矛盾。
    // stages_cols 存在 → 多欄模式（如 FIGO｜TNM｜定義 對照）；欄數由 stages_cols 決定，
    // 每列即 [分期碼, 第2欄, 第3欄…]。第 2 欄以等寬字呈現（設計上放 TNM 等代碼）。
    var cols = c.stages_cols;
    var shaded = 0;
    if(cols && cols.length){
      h += '<table class="stage stage-map"><tr>';
      cols.forEach(function(t){ h += '<th>'+escapeHtml(t)+'</th>'; });
      h += '</tr>';
      c.stages.forEach(function(s){
        var cls = shadeClass(String(s[0]).replace(/\s/g,''));
        if(cls !== 'sm-s0') shaded++;
        h += '<tr><td class="st-code '+cls+'">'+s[0]+'</td>';
        for(var i = 1; i < cols.length; i++){
          h += '<td class="st-c'+i+'">'+(s[i] || '')+'</td>';
        }
        h += '</tr>';
      });
      h += '</table>';
    } else {
      h += '<table class="stage"><tr><th>'+escapeHtml(c.stages_code_label || '分期')+'</th><th>'+
           escapeHtml(c.stages_crit_label || '條件')+'</th></tr>';
      // 只有當分期碼真的是 AJCC 期別（I/II/III/IV…）時才著色並附圖例；
      // 非 TNM 系統（BCLC、風險分級、WHO grade）的代碼不是期別，著色會誤導。
      c.stages.forEach(function(s){
        var cls = shadeClass(String(s[0]).replace(/\s/g,''));
        if(cls !== 'sm-s0') shaded++;
        h += '<tr><td class="st-code '+cls+'">'+s[0]+'</td>'+
             '<td>'+(s[1]||'')+(s[2]?'　'+s[2]:'')+'</td></tr>';
      });
      h += '</table>';
    }
    if(shaded) h += '<div class="sm-legend">分期由淺至深：<span><i class="sm-s1"></i>I</span><span><i class="sm-s2"></i>II</span><span><i class="sm-s4"></i>III</span><span><i class="sm-s7"></i>IV</span></div>';
    // 表下註解：說明這張表該怎麼讀（沿用矩陣的 .sm-m1 樣式，兩者在版面上同一層級）
    if(c.stages_foot) h += '<div class="sm-m1">'+c.stages_foot+'</div>';
  }
  return h;
}

var STAGE_RANK = {'0':0,'0a':0,'0is':0,'I':1,'IA':1,'IA1':1,'IA2':1,'IA3':1,'IB':1,'IC':1,
  'IB1':1,'IB2':1,'IB3':1,'IC1':1,'IC2':1,'IC3':1,
  'II':2,'IIA':2,'IIA1':2,'IIA2':2,'IIB':3,'IIC':3,
  'IIIA':4,'IIIA1':4,'IIIA1(i)':4,'IIIA1(ii)':4,'IIIA2':4,'IIIB':5,'IIIC':6,'IIIC1':6,'IIIC2':6,'III':4,
  'IV':7,'IVA':7,'IVB':7,'IVC':7};
// 'IC'：食道腺癌 pTNM 獨有期別（T1 N0 G3、或 T2 N0 G1–2）；仍屬第一期，故與 IA／IB 同深度。
// 婦癌新增之細分期別：子宮頸 FIGO 2018 之 IB1–IB3／IIA1–IIA2／IIIC1–IIIC2、
// 卵巢 FIGO 2014 之 IC1–IC3／IIIA1–IIIA2、子宮體 IIIC1／IIIC2。未列入者會渲染成無底色。
function shadeClass(s){ var r = STAGE_RANK[s]; return 'sm-s'+(r==null?0:r); }

/* 以 canvas 依 sm-th 字體實測列標籤（T／N／M）之最大寬度，決定標籤欄寬。
   如此 table-layout:fixed 可保證資料欄等寬，標籤欄又剛好容納各表自身之標籤
   （短如「T1」一律 40px、長如食道之判別式標籤才加寬），避免欄寬忽窄忽寬。 */
var _lblCtx = null;
function labelColWidth(labels){
  if(!_lblCtx){
    var cv = document.createElement('canvas'); _lblCtx = cv.getContext('2d');
    var mono = (getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace').trim();
    _lblCtx.font = '700 11.5px ' + mono;
  }
  var w = 0;
  labels.forEach(function(t){ w = Math.max(w, _lblCtx.measureText(String(t).replace(/<[^>]+>/g,'')).width); });
  // 下限 64px：舊值 40px 是「剛好容納 M1a」的極限，短標籤的表（NET、大腸直腸…）會被壓到下限，
  // 而資料欄可寬達 390px，比例約 1:10，標籤欄看起來像被擠掉。+22 為左右留白預算。
  return Math.min(150, Math.max(64, Math.ceil(w) + 22));   // 上限 150px；超過者由 sm-th 換行
}

function renderMatrix(mx){
  var nCols = mx.ncols.length;
  var hasNG = !!mx.ng_label;               // 選填：T 列右側之合併註記欄（如 STS 之「N0」）
  var h = '<div class="onc-sec-h">分期組合 Stage Grouping</div><div class="sm-wrap"><table class="smx">';
  // colgroup：標籤欄依內容實測寬度、N0 欄固定窄欄；資料欄（N／G 期別）於 fixed 版面平均分配剩餘。
  var lblW = labelColWidth(mx.trows.concat((mx.mrows||[]).map(function(m){ return m[0]; })));
  h += '<colgroup><col class="smc-lbl" style="width:'+lblW+'px">'+(hasNG?'<col class="smc-ng">':'');
  mx.ncols.forEach(function(){ h += '<col class="smc-data">'; });
  h += '</colgroup>';
  h += '<tr><td class="sm-corner"'+(hasNG?' colspan="2"':'')+'></td>';
  mx.ncols.forEach(function(n){
    h += '<th class="sm-nh">'+n[0]+(n[1]?'<span>'+n[1]+'</span>':'')+'</th>';
  });
  h += '</tr>';
  mx.trows.forEach(function(t, i){
    h += '<tr><th class="sm-th">'+t+'</th>';
    if(hasNG && i===0) h += '<td class="sm-ng" rowspan="'+mx.trows.length+'">'+mx.ng_label+'</td>';
    // 合併記號：'^' 併入上方格（rowspan）、'<' 併入左方格（colspan）。
    // 用於期別不隨該軸改變之區塊——如子宮頸之 N1 欄自 TX 到 T3b 全是 IIIC1，
    // 併成一格才看得出「N 覆寫 T」；不併則像是每列各自算出同一個答案。
    (mx.cells[i]||[]).forEach(function(s, j){
      if(s === '^' || s === '<') return;
      var rs = 1, cs = 1;
      while(mx.cells[i+rs] && mx.cells[i+rs][j] === '^') rs++;
      while((mx.cells[i]||[])[j+cs] === '<') cs++;
      h += '<td class="sm-cell '+shadeClass(s)+'"'+
           (rs>1?' rowspan="'+rs+'"':'')+(cs>1?' colspan="'+cs+'"':'')+'>'+s+'</td>';
    });
    h += '</tr>';
  });
  // M／N 列：接在 T 列之後，期別橫跨所有資料欄並置中。
  // 具 N0 欄時，期別同時併入右側之 N0 空格（colspan = 資料欄 + 1）。
  // N 列（N1…）之列首與 N0 同色；M 列（M1…）用另色，使 N／M 兩軸不致混淆。
  (mx.mrows||[]).forEach(function(m){
    var thCls = /^N/.test(m[0]) ? 'sm-nth' : 'sm-mth';
    var span = hasNG ? nCols + 1 : nCols;
    h += '<tr class="sm-mrow"><th class="sm-th '+thCls+'">'+m[0]+'</th>'+
         '<td class="sm-cell sm-mcell '+shadeClass(m[1])+'" colspan="'+span+'">'+m[1]+'</td></tr>';
  });
  h += '</table></div>';
  h += '<div class="sm-legend">分期由淺至深：<span><i class="sm-s1"></i>I</span><span><i class="sm-s2"></i>II</span><span><i class="sm-s4"></i>III</span><span><i class="sm-s7"></i>IV</span></div>';
  if(mx.m1) h += '<div class="sm-m1">'+mx.m1+'</div>';
  return h;
}
/* figoLabel 存在 → 三欄（代碼｜FIGO｜定義），列資料第 3 元素為 FIGO 期別；
   未提供 figoLabel 或該列無第 3 元素時退回兩欄，故既有癌別不受影響。 */
function tnmTable(title, rows, figoLabel){
  if(!rows || !rows.length) return '';
  var withFigo = !!figoLabel && rows.some(function(r){ return r.length > 2; });
  var h = '<div class="onc-sec-h">'+title+'</div><table class="tnm'+(withFigo?' tnm-figo':'')+'">';
  if(withFigo){
    h += '<tr><th></th><th>'+escapeHtml(figoLabel)+'</th><th></th></tr>';
  }
  rows.forEach(function(r){
    h += '<tr><td>'+r[0]+'</td>'+
         (withFigo ? '<td class="tf-figo '+shadeClass(String(r[2]||'').replace(/\s/g,''))+'">'+(r[2]||'')+'</td>' : '')+
         '<td>'+r[1]+'</td></tr>';
  });
  return h + '</table>';
}

/* 淋巴結分群：一般癌症為固定標籤；具 node_ops 者依術式動態顯示廓清分級 */
var NODE_OP = null;     // 目前術式；切換癌別時於 renderNode 重設
var NODE_SORT = 'num';  // 'num' 站號 | 'd' 廓清分級

function setNodeOp(id, op){ NODE_OP = op; switchTab(id, 'node'); }
function setNodeSort(id, s){ NODE_SORT = s; switchTab(id, 'node'); }

/* 各癌別之廓清分級，由內而外排序；[分級名稱, CSS class] */
var NODE_LEVELS = {
  gastric: [['D1','dl-1'], ['D1+','dl-1p'], ['D2','dl-2']],
  panc:    [['標準','dl-1'], ['擴大','dl-warn']],
  // pNET 之選擇軸是「腫瘤位置」而非術式：AJCC 對胰臟 NET 之區域淋巴結定義依胰頭／頸 vs 胰體／尾而異，
  // 故此處的分級是「該淋巴結群於該部位是否屬區域（N1）」；未列出者即非區域 → 轉移屬 M1b。
  pnet:    [['區域 N1','dl-1']]
};

function renderNode(c){
  var h = '';
  if(c.node_note) h += '<p class="onc-note">'+c.node_note+'</p>';

  // 一般癌症：固定標籤；第 4 欄為選填註解
  if(!c.node_ops){
    (c.nodes||[]).forEach(function(n){
      h += '<div class="node-item"><span class="ni-code">'+n[0]+'</span>'+n[1]+
           (n[2] ? '<span class="node-group">'+n[2]+'</span>' : '')+
           (n[3] ? '<div class="ni-note">'+n[3]+'</div>' : '')+'</div>';
    });
    return h;
  }

  // 依術式動態顯示
  var opKeys = c.node_ops.map(function(o){ return o[0]; });
  if(opKeys.indexOf(NODE_OP) === -1) NODE_OP = opKeys[0];   // 切換癌別時重設為第一種術式

  var levels = NODE_LEVELS[c.id] || [];
  var lvRank = {}, lvClass = {};
  levels.forEach(function(l, i){ lvRank[l[0]] = i; lvClass[l[0]] = l[1]; });

  h += '<div class="nd-ctrl">';
  h += '<div class="nd-h">'+escapeHtml(c.node_op_label || '術式')+'</div><div class="nd-btns">';
  c.node_ops.forEach(function(o){
    h += '<button class="nd-btn'+(NODE_OP===o[0]?' active':'')+'" onclick="setNodeOp(\''+c.id+'\',\''+o[0]+'\')">'+escapeHtml(o[1])+'</button>';
  });
  h += '</div>';
  h += '<div class="nd-h">排序 Sort</div><div class="nd-btns">';
  // 第一種排序為資料原始順序；多數癌別即站號，但非站別式者（如 pNET 以 AJCC 具名解剖群描述區域淋巴結，
  // 並無 JPS 站號）須自訂標籤，否則按鈕會與 node_note「本表無站號」自相矛盾。
  h += '<button class="nd-btn'+(NODE_SORT==='num'?' active':'')+'" onclick="setNodeSort(\''+c.id+'\',\'num\')">'+escapeHtml(c.node_num_label || '站號 No.')+'</button>';
  h += '<button class="nd-btn'+(NODE_SORT==='d'?' active':'')+'" onclick="setNodeSort(\''+c.id+'\',\'d\')">'+escapeHtml(c.node_sort_label || '廓清分級')+'</button>';
  h += '</div></div>';

  if(c.node_defs && c.node_defs[NODE_OP]) h += '<div class="nd-def">'+c.node_defs[NODE_OP]+'</div>';

  var list = (c.nodes||[]).map(function(n, i){ return {n:n, i:i}; });
  if(NODE_SORT === 'd'){
    list.sort(function(a, b){
      var ra = lvRank[(a.n[3]||{})[NODE_OP]]; if(ra === undefined) ra = 9;
      var rb = lvRank[(b.n[3]||{})[NODE_OP]]; if(rb === undefined) rb = 9;
      return ra !== rb ? ra - rb : a.i - b.i;
    });
  }

  list.forEach(function(x){
    var n = x.n;
    var lv = (n[3]||{})[NODE_OP];
    var cls = lv ? (lvClass[lv] || 'dl-1') : 'dl-none';
    // 分期軸（N／M1）僅在該癌別確有站別式區域定義時顯示；胰臟依顆數分期，故留空
    var reg = (n[2] === 'R' || n[2] === 'M')
      ? '<span class="ni-reg'+(n[2]==='M'?' is-m':'')+'">'+(n[2]==='M'?'M1':'N')+'</span>' : '';
    h += '<div class="node-item '+cls+'">'+
         '<span class="ni-code">'+n[0]+'</span>'+n[1]+
         '<span class="node-group '+cls+'">'+(lv || '—')+'</span>'+ reg +
         (n[4] ? '<div class="ni-note">'+n[4]+'</div>' : '')+
         '</div>';
  });
  return h;
}

function renderTx(c){
  // 具互動決策流程圖之癌別：療程資料已整合於各建議處置色塊，tx 僅作為模組未載入時的後備
  if(c.pathway === 'gastric' && typeof gastricPathwayHTML === 'function'){
    return gastricPathwayHTML();
  }
  if(c.pathway === 'breast' && typeof breastPathwayHTML === 'function'){
    return breastPathwayHTML();
  }
  if(c.pathway === 'colon' && typeof colonPathwayHTML === 'function'){
    return colonPathwayHTML();
  }
  if(c.pathway === 'rectal' && typeof rectalPathwayHTML === 'function'){
    return rectalPathwayHTML();
  }
  if(c.pathway === 'panc' && typeof pancPathwayHTML === 'function'){
    return pancPathwayHTML();
  }
  if(c.pathway === 'hcc' && typeof hccPathwayHTML === 'function'){
    return hccPathwayHTML();
  }
  if(c.pathway === 'sts' && typeof stsPathwayHTML === 'function'){
    return stsPathwayHTML();
  }
  if(c.pathway === 'pnet' && typeof pnetPathwayHTML === 'function'){
    return pnetPathwayHTML();
  }
  if(c.pathway === 'net' && typeof netPathwayHTML === 'function'){
    return netPathwayHTML();
  }
  if(c.pathway === 'cervix' && typeof cervixPathwayHTML === 'function'){
    return cervixPathwayHTML();
  }
  if(c.pathway === 'endo' && typeof endoPathwayHTML === 'function'){
    return endoPathwayHTML();
  }
  if(c.pathway === 'utsarc' && typeof utsarcPathwayHTML === 'function'){
    return utsarcPathwayHTML();
  }
  if(c.pathway === 'ovarian' && typeof ovarianPathwayHTML === 'function'){
    return ovarianPathwayHTML();
  }
  if(c.pathway === 'utuc' && typeof utucPathwayHTML === 'function'){
    return utucPathwayHTML();
  }
  if(c.pathway === 'rcc' && typeof rccPathwayHTML === 'function'){
    return rccPathwayHTML();
  }
  if(c.pathway === 'bladder' && typeof bladderPathwayHTML === 'function'){
    return bladderPathwayHTML();
  }
  if(c.pathway === 'npc' && typeof npcPathwayHTML === 'function'){
    return npcPathwayHTML();
  }
  if(c.pathway === 'prostate' && typeof prostatePathwayHTML === 'function'){
    return prostatePathwayHTML();
  }
  var h = '';
  (c.tx||[]).forEach(function(t){
    h += '<div class="tx '+t.cls+'"><div class="tx-head"><span class="tx-role">'+t.role+
         '</span><span class="tx-label">'+t.label+'</span></div>'+
         '<div class="tx-body">'+t.html+'</div></div>';
  });
  return h;
}

function renderRefs(c){
  if(!c.refs || !c.refs.length) return '';
  var h = '<div class="onc-reflist"><div class="rl-h">主要文獻 References（PubMed）</div>';
  c.refs.forEach(function(r){
    h += '<a href="'+r[1]+'" target="_blank" rel="noopener">'+escapeHtml(r[0])+'</a>';
  });
  return h + '</div>';
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

/* 舊條目 id → 合併後之條目與子分型。結腸／直腸原為兩個獨立癌別，
   合併為「大腸直腸癌」後，既有書籤與首頁查詢連結仍須可用。 */
var ID_ALIAS = {
  colon:  { id:'colorectal', sub:'colon'  },
  rectal: { id:'colorectal', sub:'rectal' }
};

/* 深層連結：#cancer=<id>，供首頁全站查詢直接開啟該癌症 */
function applyHash(){
  var m = decodeURIComponent((location.hash||'').replace(/^#/,'')).match(/^cancer=(.+)$/);
  if(!m) return false;
  var want = m[1];
  if(CANCERS.some(function(c){return c.id===want;})){ showDetail(want); return true; }
  var a = ID_ALIAS[want];
  if(a && CANCERS.some(function(c){return c.id===a.id;})){
    SUBTYPE[a.id] = a.sub;
    showDetail(a.id);
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', function () {
  renderPicker('');
  applyHash();
});
window.addEventListener('hashchange', applyHash);
