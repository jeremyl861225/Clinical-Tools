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

/* 跨頁保存／還原流程選項：使用者點開計分工具再按返回時，不該從頭重選。
   狀態存在 sessionStorage（關閉分頁即失效），按「重置」則主動清除。
   還原時靠 onclick 內的 pick 呼叫字串反查按鈕，重新標上 .selected。

   用法（置於 pathway 自己的 render/reset 定義之後）：
     var p = flowPersist('gbSt', gbSt, 'view-gi-bleed-path', 'gbPick', gbPick, gbReset, gbRender);
     gbPick = p.pick; gbReset = p.reset; p.restore();
   呼叫端須覆寫原本的 pick／reset，因 inline onclick 於點擊當下才解析全域名稱。 */
function flowPersist(key, st, viewId, pickName, pick, reset, render){
  function save(){ try{ sessionStorage.setItem(key, JSON.stringify(st)); }catch(e){} }
  return {
    pick: function(k,v,btn){ pick(k,v,btn); save(); },
    reset: function(){ try{ sessionStorage.removeItem(key); }catch(e){} reset(); },
    restore: function(){ try{
      var s=JSON.parse(sessionStorage.getItem(key)||'null'); if(!s) return;
      Object.assign(st,s);
      Object.keys(st).forEach(function(k){
        var v=st[k]; if(v==null) return;
        var b=document.querySelector('#'+viewId+' .flow-opt[onclick*="'+pickName+'(\''+k+'\',\''+v+'\'"]');
        if(b) b.classList.add('selected');
      });
      render();
    }catch(e){} }
  };
}
