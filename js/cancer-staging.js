
/* ============================================================
   渲染 Rendering
   ============================================================ */
var GROUP_ORDER = ['消化系 GI','內分泌／乳房 Endocrine/Breast','胸腔 Thoracic'];

function renderPicker(filter){
  filter = (filter||'').trim().toLowerCase();
  var byGroup = {};
  CANCERS.forEach(function(c){
    if(filter){
      var hay = (c.zh + ' ' + c.en + ' ' + c.id).toLowerCase();
      if(hay.indexOf(filter) === -1) return;
    }
    (byGroup[c.group] = byGroup[c.group] || []).push(c);
  });
  var html = '';
  var groups = GROUP_ORDER.filter(function(g){return byGroup[g];});
  Object.keys(byGroup).forEach(function(g){ if(groups.indexOf(g)===-1) groups.push(g); });
  if(groups.length === 0){
    html = '<div class="onc-empty">找不到符合「'+escapeHtml(filter)+'」的癌症。</div>';
  }
  groups.forEach(function(g){
    html += '<div class="onc-group-head">'+escapeHtml(g)+'</div><div class="onc-grid">';
    byGroup[g].forEach(function(c){
      html += '<button class="onc-card" onclick="showDetail(\''+c.id+'\')">'+
              '<span class="oc-name">'+escapeHtml(c.zh)+'</span>'+
              '<span class="oc-en">'+escapeHtml(c.en)+'</span></button>';
    });
    html += '</div>';
  });
  document.getElementById('oncPicker').innerHTML = html;
}

function showDetail(id){
  var c = CANCERS.find(function(x){return x.id === id;});
  if(!c) return;
  document.getElementById('oncPicker').style.display = 'none';
  document.getElementById('oncSearch').style.display = 'none';
  var d = document.getElementById('oncDetail');
  d.style.display = 'block';
  d.innerHTML =
    '<button class="onc-back" onclick="backToPicker()">← 返回癌症清單</button>'+
    '<h2 class="onc-title">'+escapeHtml(c.zh)+'<span class="oct-en">'+escapeHtml(c.en)+'</span></h2>'+
    '<div class="onc-edition">'+escapeHtml(c.edition)+'</div>'+
    '<div class="onc-tabs">'+
      '<button class="onc-tab active" data-t="stage" onclick="switchTab(\''+id+'\',\'stage\')">分期 TNM</button>'+
      '<button class="onc-tab" data-t="node" onclick="switchTab(\''+id+'\',\'node\')">淋巴結分群</button>'+
      '<button class="onc-tab" data-t="tx" onclick="switchTab(\''+id+'\',\'tx\')">治療建議</button>'+
    '</div>'+
    '<div id="oncTab"></div>'+
    renderRefs(c);
  switchTab(id, 'stage');
  window.scrollTo(0,0);
}

function backToPicker(){
  document.getElementById('oncDetail').style.display = 'none';
  document.getElementById('oncPicker').style.display = 'block';
  document.getElementById('oncSearch').style.display = 'block';
  window.scrollTo(0,0);
}

function switchTab(id, tab){
  var c = CANCERS.find(function(x){return x.id === id;});
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
  }
}

var MTX_VARIANT = {};   // cancerId -> 目前選取之變體 key

function setMatrixVariant(id, key){ MTX_VARIANT[id] = key; switchTab(id, 'stage'); }

function renderStage(c){
  var h = '';
  if(c.staging_note) h += '<p class="onc-note">'+c.staging_note+'</p>';
  h += tnmTable('T — 原發腫瘤', c.t);
  h += tnmTable('N — 區域淋巴結', c.n);
  h += tnmTable('M — 遠處轉移', c.m);
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
  } else if(c.stages && c.stages.length){
    if(c.staging_system) h += '<div class="nd-def">分期系統：<b>'+escapeHtml(c.staging_system)+'</b></div>';
    h += '<div class="onc-sec-h">分期組合 Stage Grouping</div>';
    h += '<table class="stage"><tr><th>分期</th><th>條件</th></tr>';
    // 只有當分期碼真的是 AJCC 期別（I/II/III/IV…）時才著色並附圖例；
    // 非 TNM 系統（BCLC、風險分級、WHO grade）的代碼不是期別，著色會誤導。
    var shaded = 0;
    c.stages.forEach(function(s){
      var cls = shadeClass(String(s[0]).replace(/\s/g,''));
      if(cls !== 'sm-s0') shaded++;
      h += '<tr><td class="st-code '+cls+'">'+s[0]+'</td>'+
           '<td>'+(s[1]||'')+(s[2]?'　'+s[2]:'')+'</td></tr>';
    });
    h += '</table>';
    if(shaded) h += '<div class="sm-legend">分期由淺至深：<span><i class="sm-s1"></i>I</span><span><i class="sm-s2"></i>II</span><span><i class="sm-s4"></i>III</span><span><i class="sm-s7"></i>IV</span></div>';
  }
  return h;
}

var STAGE_RANK = {'0':0,'I':1,'IA':1,'IA1':1,'IA2':1,'IA3':1,'IB':1,
  'II':2,'IIA':2,'IIB':3,'IIC':3,
  'IIIA':4,'IIIB':5,'IIIC':6,'III':4,
  'IV':7,'IVA':7,'IVB':7,'IVC':7};
function shadeClass(s){ var r = STAGE_RANK[s]; return 'sm-s'+(r==null?0:r); }

function renderMatrix(mx){
  var nCols = mx.ncols.length;
  var h = '<div class="onc-sec-h">分期組合 Stage Grouping（T×N 為 M0；M1 列於下方）</div><div class="sm-wrap"><table class="smx">';
  h += '<tr><td class="sm-corner"></td>';
  mx.ncols.forEach(function(n){
    h += '<th class="sm-nh">'+n[0]+(n[1]?'<span>'+n[1]+'</span>':'')+'</th>';
  });
  h += '</tr>';
  mx.trows.forEach(function(t, i){
    h += '<tr><th class="sm-th">'+t+'</th>';
    (mx.cells[i]||[]).forEach(function(s){
      h += '<td class="sm-cell '+shadeClass(s)+'">'+s+'</td>';
    });
    h += '</tr>';
  });
  // M 列：接在 T 列之後，橫跨所有 N 欄（M1 分期與 T、N 無關）
  (mx.mrows||[]).forEach(function(m){
    h += '<tr class="sm-mrow"><th class="sm-th sm-mth">'+m[0]+'</th>'+
         '<td class="sm-cell sm-mcell '+shadeClass(m[1])+'" colspan="'+nCols+'">'+
         '<b>'+m[1]+'</b>'+(m[2]?'<span class="sm-mdesc">'+m[2]+'</span>':'')+'</td></tr>';
  });
  h += '</table></div>';
  h += '<div class="sm-legend">分期由淺至深：<span><i class="sm-s1"></i>I</span><span><i class="sm-s2"></i>II</span><span><i class="sm-s4"></i>III</span><span><i class="sm-s7"></i>IV</span></div>';
  if(mx.m1) h += '<div class="sm-m1">'+mx.m1+'</div>';
  return h;
}
function tnmTable(title, rows){
  if(!rows || !rows.length) return '';
  var h = '<div class="onc-sec-h">'+title+'</div><table class="tnm">';
  rows.forEach(function(r){ h += '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>'; });
  return h + '</table>';
}

/* 淋巴結分群：一般癌症為固定標籤；具 node_ops 者（胃癌）依術式動態顯示 D 級 */
var NODE_OP = 'tg';     // 目前術式
var NODE_SORT = 'num';  // 'num' 站號 | 'd' D 分級

function setNodeOp(id, op){ NODE_OP = op; switchTab(id, 'node'); }
function setNodeSort(id, s){ NODE_SORT = s; switchTab(id, 'node'); }

var D_RANK = {'D1':1,'D1+':2,'D2':3};
function dLevelClass(lv){
  if(lv === 'D1') return 'dl-1';
  if(lv === 'D1+') return 'dl-1p';
  if(lv === 'D2') return 'dl-2';
  return 'dl-none';
}

function renderNode(c){
  var h = '';
  if(c.node_note) h += '<p class="onc-note">'+c.node_note+'</p>';

  // 一般癌症：固定標籤
  if(!c.node_ops){
    (c.nodes||[]).forEach(function(n){
      h += '<div class="node-item"><span class="ni-code">'+n[0]+'</span>'+n[1]+
           (n[2] ? '<span class="node-group">'+n[2]+'</span>' : '')+'</div>';
    });
    return h;
  }

  // 依術式動態顯示
  h += '<div class="nd-ctrl">';
  h += '<div class="nd-h">術式 Gastrectomy</div><div class="nd-btns">';
  c.node_ops.forEach(function(o){
    h += '<button class="nd-btn'+(NODE_OP===o[0]?' active':'')+'" onclick="setNodeOp(\''+c.id+'\',\''+o[0]+'\')">'+escapeHtml(o[1])+'</button>';
  });
  h += '</div>';
  h += '<div class="nd-h">排序 Sort</div><div class="nd-btns">';
  h += '<button class="nd-btn'+(NODE_SORT==='num'?' active':'')+'" onclick="setNodeSort(\''+c.id+'\',\'num\')">站號 No.</button>';
  h += '<button class="nd-btn'+(NODE_SORT==='d'?' active':'')+'" onclick="setNodeSort(\''+c.id+'\',\'d\')">D 分級</button>';
  h += '</div></div>';

  if(c.node_defs && c.node_defs[NODE_OP]) h += '<div class="nd-def">'+c.node_defs[NODE_OP]+'</div>';

  var list = (c.nodes||[]).map(function(n, i){ return {n:n, i:i}; });
  if(NODE_SORT === 'd'){
    list.sort(function(a, b){
      var ra = D_RANK[(a.n[3]||{})[NODE_OP]] || 9;
      var rb = D_RANK[(b.n[3]||{})[NODE_OP]] || 9;
      return ra !== rb ? ra - rb : a.i - b.i;
    });
  }

  list.forEach(function(x){
    var n = x.n;
    var lv = (n[3]||{})[NODE_OP];
    var cls = dLevelClass(lv);
    h += '<div class="node-item '+cls+'">'+
         '<span class="ni-code">'+n[0]+'</span>'+n[1]+
         '<span class="node-group '+cls+'">'+(lv || '—')+'</span>'+
         '<span class="ni-reg'+(n[2]==='M'?' is-m':'')+'">'+(n[2]==='M'?'M1':'N')+'</span>'+
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

document.addEventListener('DOMContentLoaded', function () {
  renderPicker('');
});
