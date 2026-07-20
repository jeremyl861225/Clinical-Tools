/* 決策流程共用 helpers（供 pathways/ 使用） */
function flowShow(id,on){ const el=document.getElementById(id); if(el) el.classList.toggle('hidden',!on); }
function flowClearSel(stepId){ const s=document.getElementById(stepId); if(s) s.querySelectorAll('.flow-opt').forEach(b=>b.classList.remove('selected')); }
function flowSelect(btn){ const g=btn.parentNode; g.querySelectorAll('.flow-opt').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); }
function flowRec(id,cls,title,detail,note){
  const rec=document.getElementById(id);
  rec.className='flow-rec '+cls;
  rec.innerHTML='<div class="rec-label">建議處置 Recommendation</div><div class="rec-title">'+title+'</div>'+
    (detail?'<ul class="rec-detail">'+detail+'</ul>':'')+
    (note?'<div class="rec-note">'+note+'</div>':'');
}

/* 流程圖 ⇄ 計分工具往返：點開計分工具再按返回時，不該從頭重選、也不該回到頁首。

   作法：離開前記下「已點過的 .flow-opt（依點擊順序）＋勾選框狀態＋捲動位置」，
   計分工具的返回鍵帶 ?restore=1 回來時原樣重播，畫面停在原本點開超連結的地方。
   以索引記錄，各流程頁不必自行接線；按「重置」即清空。
   狀態放 sessionStorage（關掉分頁即失效），且只在 ?restore=1 時還原 —
   從主選單重新進入仍是空白流程。 */
(function(){
  if (!/\/pathways\//.test(location.pathname)) return;
  var KEY = 'flowNav:' + location.pathname.split('/').pop();
  var MAX_PICKS = 300;          // 反覆改選也不至於無限累積
  var picks = [];
  var replaying = false;

  function opts(){ return document.querySelectorAll('.flow-opt'); }
  function boxes(){ return document.querySelectorAll('.sheet input[type=checkbox]'); }
  function toolLinks(){ return document.querySelectorAll('a[href*="tools/"], [onclick*="tools/"]'); }
  function indexOf(list, el){ return Array.prototype.indexOf.call(list, el); }

  function save(linkIdx){
    try{
      sessionStorage.setItem(KEY, JSON.stringify({
        picks: picks,
        boxes: Array.prototype.map.call(boxes(), function(cb){ return cb.checked?1:0; }),
        y: window.scrollY,
        link: (typeof linkIdx==='number') ? linkIdx : -1
      }));
    }catch(e){}
  }
  function clear(){ picks=[]; try{ sessionStorage.removeItem(KEY); }catch(e){} }

  /* 找出這次點擊是否要離開本頁去計分工具（含 <a href> 與 onclick 內的 location.href） */
  function toolLinkFrom(el){
    for (var n=el; n && n.nodeType===1; n=n.parentNode){
      var href = n.getAttribute && n.getAttribute('href');
      if (href && href.indexOf('tools/')>=0) return n;
      var oc = n.getAttribute && n.getAttribute('onclick');
      if (oc && oc.indexOf('tools/')>=0) return n;
    }
    return null;
  }

  document.addEventListener('click', function(ev){
    var t = ev.target;
    if (!t || t.nodeType!==1) return;
    if (t.closest('.btn-reset')) { clear(); return; }

    var opt = t.closest('.flow-opt');
    if (opt){
      if (!replaying){
        var i = indexOf(opts(), opt);
        if (i>=0){ picks.push(i); if (picks.length>MAX_PICKS) picks.shift(); save(); }
      }
      return;
    }
    var link = toolLinkFrom(t);
    if (link) save(indexOf(toolLinks(), link));
  }, true);

  function restore(){
    var d;
    try{ d = JSON.parse(sessionStorage.getItem(KEY)||'null'); }catch(e){ return; }
    if (!d) return;

    if (Array.isArray(d.boxes)){
      var cbs = boxes();
      d.boxes.forEach(function(v,i){
        if (!cbs[i] || cbs[i].checked===!!v) return;
        cbs[i].checked = !!v;
        cbs[i].dispatchEvent(new Event('change',{bubbles:true}));
      });
    }
    if (Array.isArray(d.picks)){
      replaying = true;
      var list = opts();
      d.picks.forEach(function(i){ if (list[i]) list[i].click(); });
      replaying = false;
      picks = d.picks.slice();
    }

    /* 版面已與離開時相同，直接回到原捲動位置；若那顆超連結仍不在視窗內才再校正一次。
       圖片等資源載入完成前高度還不夠，瀏覽器自己也會把捲軸拉回頂端，
       因此 DOM 就緒與 load 之後各補一次。 */
    function place(){
      window.scrollTo(0, d.y||0);
      var link = toolLinks()[d.link];
      if (!link || !window.innerHeight) return;
      var r = link.getBoundingClientRect();
      if (r.bottom<0 || r.top>window.innerHeight) link.scrollIntoView({block:'center'});
    }
    try{ if ('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
    requestAnimationFrame(place);
    if (document.readyState==='complete') setTimeout(place,0);
    else window.addEventListener('load', function(){ setTimeout(place,0); });
  }

  window.addEventListener('DOMContentLoaded', function(){
    if (location.search.indexOf('restore=1')<0) return;
    restore();
    /* 網址留著 ?restore=1 會讓重新整理又跳一次，還原完就抹掉 */
    try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
  });
})();
