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
