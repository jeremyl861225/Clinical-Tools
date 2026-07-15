
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
  else el.innerHTML = renderTx(c);
}

function renderStage(c){
  var h = '';
  if(c.staging_note) h += '<p class="onc-note">'+c.staging_note+'</p>';
  h += tnmTable('T — 原發腫瘤', c.t);
  h += tnmTable('N — 區域淋巴結', c.n);
  h += tnmTable('M — 遠處轉移', c.m);
  if(c.matrix){
    h += renderMatrix(c.matrix);
  } else if(c.stages && c.stages.length){
    h += '<div class="onc-sec-h">分期組合 Stage Grouping</div>';
    h += '<table class="stage"><tr><th>分期</th><th>條件</th></tr>';
    c.stages.forEach(function(s){
      h += '<tr><td>'+s[0]+'</td><td>'+(s[1]||'')+(s[2]?'　'+s[2]:'')+'</td></tr>';
    });
    h += '</table>';
  }
  return h;
}

var STAGE_RANK = {'0':0,'I':1,'IA':1,'IA1':1,'IA2':1,'IA3':1,'IB':1,
  'II':2,'IIA':2,'IIB':3,'IIC':3,
  'IIIA':4,'IIIB':5,'IIIC':6,'III':4,
  'IV':7,'IVA':7,'IVB':7,'IVC':7};
function shadeClass(s){ var r = STAGE_RANK[s]; return 'sm-s'+(r==null?0:r); }

function renderMatrix(mx){
  var h = '<div class="onc-sec-h">分期組合 Stage Grouping（T×N，皆 M0）</div><div class="sm-wrap"><table class="smx">';
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

function renderNode(c){
  var h = '';
  if(c.node_note) h += '<p class="onc-note">'+c.node_note+'</p>';
  (c.nodes||[]).forEach(function(n){
    h += '<div class="node-item"><span class="ni-code">'+n[0]+'</span>'+n[1]+
         (n[2] ? '<span class="node-group">'+n[2]+'</span>' : '')+'</div>';
  });
  return h;
}

function renderTx(c){
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
