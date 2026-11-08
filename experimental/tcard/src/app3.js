
/* ---------- Types & Statuses: categories -> types (each with a configurable color), statuses ---------- */
function palHTML(sel){return '<div class="pal" role="group" aria-label="ICS 219 card colors">'+PALETTE.map(function(p){return '<button type="button" data-hex="'+p[1]+'" style="background:'+p[1]+'" title="'+esc(p[0]+' ('+p[2]+')')+'" aria-label="'+esc(p[0])+'" aria-pressed="'+(p[1]===sel)+'"></button>'}).join('')+'</div>'}
function renderSettings(){
  $('catList').innerHTML=state.categories.map(function(k){
    var ts=state.types.filter(function(t){return t.catId===k.id});
    return '<div class="cat"><div class="crow"><span class="sw" style="background:'+k.color+'"></span><div class="nm">'+esc(k.name)+' <small>'+ts.length+' type'+(ts.length===1?'':'s')+'</small></div><button data-ecat="'+esc(k.id)+'">Edit</button><button data-addtype="'+esc(k.id)+'">+ Type</button></div>'+
      ts.map(function(t){var n=state.cards.filter(function(c){return c.typeId===t.id}).length;
        return '<div class="crow trow"><span class="sw" style="background:'+t.color+'"></span><div class="nm">'+esc(t.name)+' <small>'+esc(colorName(t.color))+(n?' · '+n+' card'+(n===1?'':'s'):'')+'</small></div><button data-etype="'+esc(t.id)+'">Edit</button></div>'}).join('')+'</div>'}).join('')||'<p class="muted">No categories.</p>';
  $('statList').innerHTML=state.statuses.map(function(s,i){return '<div class="strow" data-sid="'+esc(s.id)+'"><input type="color" data-scolor value="'+normHex(s.color)+'" aria-label="Status color"><input data-sname value="'+esc(s.name)+'" aria-label="Status name"><button data-sup="1" aria-label="Move up"'+(i?'':' disabled')+'>&#9650;</button><button data-sdown="1" aria-label="Move down"'+(i<state.statuses.length-1?'':' disabled')+'>&#9660;</button><button class="danger" data-sdel="1" aria-label="Delete status">&#10005;</button></div>'}).join('');
  applyAdvanced();
}
function editColorThing(kind,obj){ /* kind: 'cat' | 'type'; obj null = new */
  var isNew=!obj, o=obj||{name:'',color:kind==='cat'?'#c9c9c9':'#ffffff',catId:(arguments[2]||(state.categories[0]||{}).id)};
  var cats=kind==='type'?'<label for="dCat" style="margin-top:10px">Category</label><select id="dCat">'+state.categories.map(function(k){return '<option value="'+esc(k.id)+'"'+(k.id===o.catId?' selected':'')+'>'+esc(k.name)+'</option>'}).join('')+'</select>':'';
  var btns=[{t:'Cancel',v:'cancel'},{t:'Save',v:'save',cls:'primary'}]; if(!isNew) btns.unshift({t:'Delete',v:'del',cls:'danger',style:'margin-right:auto'});
  var p=dialog('<h2 style="margin-top:0">'+(isNew?'New ':'Edit ')+(kind==='cat'?'category':'type')+'</h2><label for="dName">Name</label><input id="dName" autocomplete="off" value="'+esc(o.name)+'">'+cats+
    '<label style="margin-top:10px">'+(kind==='cat'?'Category color':'Card color')+'</label>'+palHTML(normHex(o.color))+'<div class="row" style="align-items:center"><input type="color" id="dColor" value="'+normHex(o.color)+'" style="flex:0 0 64px;padding:2px" aria-label="Custom color"><span id="dClrName" class="small muted"></span></div>'+
    '<p class="nightnote">Colors are hidden in night vision.</p><div class="cprev" id="dPrev"></div>',btns);
  var sync=function(){var h=normHex($('dColor').value), pv=$('dPrev'); pv.style.background=h; pv.style.color=inkOn(h); pv.textContent=($('dName').value||'Preview')+' · '+colorName(h);
    $('dClrName').textContent=colorName(h); document.querySelectorAll('#dlgBody .pal button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.hex===h)})};
  document.querySelectorAll('#dlgBody .pal button').forEach(function(b){b.onclick=function(){$('dColor').value=b.dataset.hex;sync()}});
  $('dColor').addEventListener('input',sync); $('dName').addEventListener('input',sync); sync(); setTimeout(function(){var n=$('dName'); if(n) n.focus()},30);
  return p.then(function(v){
    if(v==='del') return delColorThing(kind,obj);
    if(v!=='save') return;
    var nm=$('dName').value.trim(); if(!nm){toast('Name is empty, not saved');return}
    var t=isNew?{id:uid()}:obj; t.name=nm; t.color=normHex($('dColor').value); if(kind==='type') t.catId=$('dCat').value;
    if(isNew) (kind==='cat'?state.categories:state.types).push(t);
    save(true); renderSettings(); toast((kind==='cat'?'Category ':'Type ')+(isNew?'added':'saved'));
  });
}
function delColorThing(kind,o){
  var tids=kind==='cat'?state.types.filter(function(t){return t.catId===o.id}).map(function(t){return t.id}):[o.id];
  var n=state.cards.filter(function(c){return tids.indexOf(c.typeId)>=0}).length;
  if(n){toast(n+' card'+(n===1?' uses':'s use')+' this '+(kind==='cat'?'category':'type')+'. Change or delete '+(n===1?'it':'them')+' first.');return}
  if(kind==='cat'&&state.categories.length<2){toast('Keep at least one category');return}
  return confirmBox('Delete the '+(kind==='cat'?'category':'type')+' “'+o.name+'”'+(kind==='cat'&&tids.length?' and its '+tids.length+' type'+(tids.length===1?'':'s'):'')+'?','Delete').then(function(ok){
    if(!ok) return;
    if(kind==='cat'){state.categories=state.categories.filter(function(k){return k.id!==o.id}); if(state.settings.fCat===o.id) state.settings.fCat=''}
    state.types=state.types.filter(function(t){return tids.indexOf(t.id)<0}); if(tids.indexOf(state.settings.fType)>=0) state.settings.fType='';
    save(true); renderSettings(); toast('Deleted');
  });
}
$('catList').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b) return;
  if(b.dataset.ecat) editColorThing('cat',catById(b.dataset.ecat));
  else if(b.dataset.etype) editColorThing('type',typeById(b.dataset.etype));
  else if(b.dataset.addtype) editColorThing('type',null,b.dataset.addtype)});
$('btnAddCat').onclick=function(){editColorThing('cat',null)};
$('statList').addEventListener('input',function(e){var k=e.target.closest('[data-scolor]'); if(k){var t=statById(k.closest('.strow').dataset.sid); if(t){t.color=normHex(k.value);save()} return} var i=e.target.closest('[data-sname]'); if(!i) return; var s=statById(i.closest('.strow').dataset.sid); if(s){s.name=i.value;save()}});
$('statList').addEventListener('change',function(e){var i=e.target.closest('[data-sname]'); if(!i) return; var s=statById(i.closest('.strow').dataset.sid); if(s&&!s.name.trim()){s.name='Status';i.value=s.name;save()}});
$('statList').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b) return; var id=b.closest('.strow').dataset.sid, a=state.statuses, i=a.findIndex(function(s){return s.id===id});
  if(b.dataset.sup&&i>0){a.splice(i-1,0,a.splice(i,1)[0]);save();renderSettings()}
  else if(b.dataset.sdown&&i<a.length-1){a.splice(i+1,0,a.splice(i,1)[0]);save();renderSettings()}
  else if(b.dataset.sdel){ if(a.length<2){toast('Keep at least one status');return}
    var n=state.cards.filter(function(c){return c.status===id}).length, to=a.filter(function(s){return s.id!==id})[0];
    confirmBox('Delete the status “'+a[i].name+'”?'+(n?' '+n+' card'+(n===1?'':'s')+' move to “'+to.name+'”.':''),'Delete').then(function(ok){if(!ok) return;
      state.cards.forEach(function(c){if(c.status===id){c.history.push({ts:Date.now(),from:id,to:to.id,loc:c.location,ev:'status removed'});c.status=to.id;c.updated=Date.now()}});
      state.statuses=a.filter(function(s){return s.id!==id}); save(true); renderSettings(); toast('Status deleted')})}});
$('btnAddStat').onclick=function(){state.statuses.push(fixStat({id:uid(),name:'New status'}));save(true);renderSettings();var ins=$('statList').querySelectorAll('[data-sname]');var x=ins[ins.length-1];x.focus();x.select()};

/* ---------- print view ---------- */
var sel={};
function printBW(){return state.settings.printColor==='bw'}
function renderPrintView(){
  renderFilters();
  document.querySelectorAll('[data-pc]').forEach(function(b){b.setAttribute('aria-pressed',(b.dataset.pc==='bw')===printBW())});
  $('pSlotIds').checked=!!state.settings.slotIds; document.querySelectorAll('[data-csz]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.csz===cSize())}); $('pSizeNote').textContent=CSIZE[cSize()].label;
  var pp=prepBy(); $('pIncident').value=state.incident; $('pPrepName').value=pp.name; $('pPrepPos').value=pp.pos; fillDatalists();
  renderPList();
}
function renderPList(){
  var list=sortCards(filtered());
  $('pList').innerHTML=list.length?list.map(function(c){return '<label class="pi"><input type="checkbox" data-sel="'+esc(c.id)+'"'+(sel[c.id]?' checked':'')+'><span class="sw" style="background:'+tColor(c)+'"></span><span>'+esc(cardLabel(c))+' <small>'+esc(tName(c)+(c.serial?' · S/N '+c.serial:'')+' · '+sName(c.status))+'</small></span></label>'}).join(''):'<p class="muted">No cards match the filter.</p>';
  syncSel();
}
function selCards(){return sortCards(filtered().filter(function(c){return sel[c.id]}))}
function syncSel(){var n=selCards().length, all=filtered().length; $('pSelCount').textContent=n+' selected'; $('pPrintSel').textContent='Print selected ('+n+')'; $('pPrintSel').disabled=!n; $('pPrintAll').textContent='Print all shown ('+all+')'; $('pPrintAll').disabled=!all}
$('pList').addEventListener('change',function(e){var i=e.target.closest('[data-sel]'); if(!i) return; if(i.checked) sel[i.dataset.sel]=1; else delete sel[i.dataset.sel]; syncSel()});
$('pSelAll').onclick=function(){filtered().forEach(function(c){sel[c.id]=1});renderPList()};
$('pSelNone').onclick=function(){sel={};renderPList()};
document.querySelectorAll('[data-csz]').forEach(function(b){b.onclick=function(){state.settings.cardSize=b.dataset.csz;save();renderPrintView()}});
document.querySelectorAll('[data-pc]').forEach(function(b){b.onclick=function(){state.settings.printColor=b.dataset.pc;save();renderPrintView()}});
$('pIncident').addEventListener('input',function(){state.incident=this.value;save()});
$('pPrepName').addEventListener('input',function(){state.prepName=this.value===pace.name?'':this.value;save()});
$('pPrepPos').addEventListener('input',function(){state.prepPos=this.value===pace.position?'':this.value;save()});
$('pPrintSel').onclick=function(){var a=selCards(); if(!a.length) return; printMode=1; buildCardsPrint(a); window.print()};
$('pPrintAll').onclick=function(){var a=sortCards(filtered()); if(!a.length) return; printMode=1; buildCardsPrint(a); window.print()};
$('pPrintBoard').onclick=function(){printMode=1; buildBoardPrint(); window.print()};
$('pPrintSlots').onclick=function(){printMode=1; buildSlotsPrint(); window.print()};
$('pPrintMap').onclick=function(){printMode=1; buildMapPrint(); window.print()};
$('pSlotIds').onchange=function(){state.settings.slotIds=this.checked;save()};

/* ---------- card sizes (inches). bc/sm: front only, grid with shared cut marks. tc: 3.5 x 5 front|back ---------- */
var CSIZE={bc:{w:3.5,h:2,strip:.32,cols:2,rows:5,label:'2 × 3.5 in business-card size, 10 per letter sheet, front only, shared cut marks.'},
  sm:{w:2.5,h:1.5,strip:.26,cols:3,rows:6,label:'1.5 × 2.5 in small cards, 18 per letter sheet, front only, shared cut marks.'},
  tc:{w:3.5,h:5,strip:.3,cols:2,rows:2,label:'3.5 × 5 in T-cards, front and back side by side, 2 per letter page with cut marks. Fold on the dashed line.'}};
function cSize(){return CSIZE[state.settings.cardSize]?state.settings.cardSize:'bc'}
function smallCard(c,k,x,y,z,printed){ /* top strip = ID + name (what shows in the board rack); status is a blank write-in box */
  var col=tColor(c), bw=printBW();
  return '<div class="scard '+k+'" style="left:'+x+'in;top:'+y+'in;width:'+z.w+'in;height:'+z.h+'in;'+sideStyle(col)+'">'+
    '<div class="ss" style="height:'+z.strip+'in;'+(bw?'':'background:rgba(255,255,255,.6);color:#000')+'"><b>'+esc(c.sid)+'</b><span>'+esc(c.name||'(no name)')+'</span></div>'+
    '<div class="sb"><div class="wst"><i>Status</i></div><div class="sr">S/N '+esc(c.serial||'—')+'</div><div class="ty">'+esc(tName(c))+(bw?' ['+esc(colorName(col))+']':'')+'</div>'+
    '<div class="ft"><span>'+esc(cName(c))+'</span><span>'+esc(printed)+' · v'+esc(APP_VERSION)+'</span></div></div></div>';
}
function gridMarks(x0,y0,z,nc,nr){ /* shared cut marks: ticks outside the grid on every cut line */
  var m='',W=nc*z.w,H=nr*z.h,i;
  for(i=0;i<=nc;i++){var x=x0+i*z.w; m+='<i class="cm v" style="left:'+x+'in;top:'+(y0-0.17)+'in"></i><i class="cm v" style="left:'+x+'in;top:'+(y0+H+0.05)+'in"></i>'}
  for(i=0;i<=nr;i++){var y=y0+i*z.h; m+='<i class="cm h" style="top:'+y+'in;left:'+(x0-0.33)+'in"></i><i class="cm h" style="top:'+y+'in;left:'+(x0+W+0.03)+'in"></i>'}
  return m;
}
function buildSmallPrint(cards,k){
  var z=CSIZE[k], per=z.cols*z.rows, root=$('printRoot'), printed=stamp(Date.now(),true), h='';
  var x0=(8.1-z.cols*z.w)/2, y0=(10.55-z.rows*z.h)/2;
  for(var p=0;p<cards.length;p+=per){
    var cs=cards.slice(p,p+per), nr=Math.ceil(cs.length/z.cols), nc=cs.length<z.cols?cs.length:z.cols;
    h+='<div class="cpage">'+cs.map(function(c,i){return smallCard(c,k,x0+(i%z.cols)*z.w,y0+Math.floor(i/z.cols)*z.h,z,printed)}).join('')+gridMarks(x0,y0,z,nc,nr)+'</div>';
  }
  root.innerHTML=h; root.dataset.pages=Math.ceil(cards.length/per); root.dataset.kind='cards-'+k;
}
/* ---------- CARD PRINT: 3.5 x 5 in, front | back side by side, 2 per letter page, cut marks ---------- */
function sideStyle(col){return printBW()?'':'background:'+col+';color:'+inkOn(col)}
function cardFront(c,printed){
  var col=tColor(c), cc=cColor(c), pp=prepBy(), bw=printBW();
  var f=function(l,v,big){return '<td><span class="l">'+l+'</span><span class="v'+(big?' big':'')+'">'+esc(v)+'</span></td>'};
  return '<div class="tside front" style="'+sideStyle(col)+'"><div class="tc-top" style="'+(bw?'':'background:'+cc+';color:'+inkOn(cc))+'"><span class="tsid">'+esc(c.sid)+'</span><span>'+esc(cName(c)||'T-Card')+' · Front</span></div>'+
    '<div class="tc-st"><i>Status</i></div>'+
    '<div class="tc-type">'+esc(tName(c))+'</div>'+(bw?'<div class="tc-clr">Card color: '+esc(colorName(col).toUpperCase())+'</div>':'')+
    '<table class="tc-f"><colgroup><col style="width:72%"><col style="width:28%"></colgroup>'+
    '<tr>'+f('Name',c.name,true)+f('Qty',c.qty,true)+'</tr>'+
    '<tr><td colspan="2"><span class="l">Serial number</span><span class="v">'+esc(c.serial)+'</span></td></tr>'+
    '<tr><td colspan="2"><span class="l">Location / Assignment</span><span class="v">'+esc(c.location)+'</span></td></tr>'+
    '<tr><td colspan="2"><span class="l">Assigned to</span><span class="v">'+esc(c.assignedTo)+'</span></td></tr>'+
    '<tr><td colspan="2"><span class="l">Owner / Home agency</span><span class="v">'+esc(c.agency)+'</span></td></tr>'+
    '<tr><td colspan="2"><span class="l">ETA / Checked in</span><span class="v">'+esc(c.checkIn)+'</span></td></tr></table>'+
    '<div class="tc-foot">Prepared by: '+esc([pp.name,pp.pos].filter(Boolean).join(', ')||'________________')+' · Printed '+esc(printed)+'<span class="tc-ver">v'+esc(APP_VERSION)+'</span></div></div>';
}
function cardBack(c){
  var col=tColor(c);
  return '<div class="tside back" style="'+sideStyle(col)+'"><div class="tc-top" style="'+(printBW()?'':'background:rgba(255,255,255,.45);color:#000')+'"><span>'+esc(cardLabel(c))+'</span><span>Back</span></div>'+
    '<div class="tc-lbl">Frequencies / talkgroups / notes</div><div class="tc-notes">'+esc(c.notes)+'</div>'+
    '<div class="tc-lbl" style="margin-top:.05in">Status history'+(utcOn()?' (UTC)':'')+'</div><div class="tc-hwrap"><table class="tc-h"><colgroup><col style="width:27%"><col style="width:33%"><col></colgroup><thead><tr><th>Date/Time</th><th>Status</th><th>Location / Assignment</th></tr></thead><tbody></tbody></table></div></div>';
}
function hRow(h){return h?'<tr><td>'+esc(stamp(h.ts))+'</td><td>'+esc(histLabel(h))+'</td><td>'+esc(histLoc(h))+'</td></tr>':'<tr><td></td><td></td><td></td></tr>'}
function fillHist(side,c){
  var w=side.querySelector('.tc-hwrap'), tb=side.querySelector('tbody'), fits=function(){return w.scrollHeight<=w.clientHeight+0.5};
  var hs=c.history.slice(), drop=0;
  var draw=function(){tb.innerHTML=(drop?'<tr class="more"><td colspan="3">… '+drop+' earlier change'+(drop===1?'':'s')+' (in the export)</td></tr>':'')+hs.slice(drop).map(hRow).join('')};
  draw(); while(!fits()&&drop<hs.length){drop++;draw()}
  var g=0; while(g++<40){tb.insertAdjacentHTML('beforeend',hRow(null)); if(!fits()){tb.removeChild(tb.lastChild);break}}
}
function marks(pair){ /* cut marks outside the corners, fold ticks at the center line */
  var m='', X=[0,7], Y=[0,5];
  Y.forEach(function(y){X.forEach(function(x){m+='<i class="cm h" style="top:'+y+'in;left:'+(x?x+0.06:-0.36)+'in"></i>'})});
  [0,3.5,7].forEach(function(x){[-0.15,5.03].forEach(function(y){m+='<i class="cm v'+(x===3.5?' fold':'')+'" style="left:'+x+'in;top:'+y+'in"></i>'})});
  pair.insertAdjacentHTML('beforeend',m);
}
function buildCardsPrint(cards){
  if(cSize()!=='tc') return buildSmallPrint(cards,cSize());
  var root=$('printRoot'); root.innerHTML=''; var printed=stamp(Date.now(),true), page=null;
  cards.forEach(function(c,i){
    if(i%2===0){page=document.createElement('div');page.className='tpage';root.appendChild(page)}
    var pr=document.createElement('div'); pr.className='tpair p'+(i%2); pr.innerHTML=cardFront(c,printed)+cardBack(c); page.appendChild(pr);
    fillHist(pr.querySelector('.back'),c); marks(pr);
  });
  root.dataset.pages=Math.ceil(cards.length/2); root.dataset.kind='cards';
}
/* ---------- STATUS BOARD SHEET ---------- */
function buildBoardPrint(){
  var root=$('printRoot'), list=sortCards(filtered()), pp=prepBy(), bw=printBW(), many=state.categories.length>1;
  var s=document.createElement('div'); s.className='bsheet';
  var h='<h1>T-Card Status List</h1><div class="meta"><div>Incident / event: <b>'+esc(state.incident||'')+'</b></div><div>Date/Time prepared: <b>'+esc(stamp(Date.now(),true))+'</b></div>'+
    '<div>Prepared by: <b>'+esc(pp.name)+'</b></div><div>Position: <b>'+esc(pp.pos)+'</b></div><div style="grid-column:1/-1">Showing: <b>'+esc(filterText())+'</b> · '+list.length+' card'+(list.length===1?'':'s')+'</div></div>'+
    '<div class="kpis">'+state.statuses.map(function(st){return '<div><b>'+list.filter(function(c){return c.status===st.id}).length+'</b>'+esc(st.name)+'</div>'}).join('')+'</div>';
  state.statuses.forEach(function(st){
    var cs=list.filter(function(c){return c.status===st.id}); if(!cs.length) return;
    h+='<h2>'+(bw?'':'<span class="bsw" style="background:'+st.color+'"></span>')+esc(st.name)+' ('+cs.length+')</h2><table><tr><th style="width:8%">Card</th><th style="width:15%">Name</th><th style="width:11%">Serial</th><th>Type</th>'+(many?'<th>Category</th>':'')+'<th style="width:6%">Qty</th><th>Location / Assignment</th><th>Assigned to</th><th style="width:12%">Since</th></tr>'+
      cs.map(function(c){var lc=lastChange(c);return '<tr><td><b>'+esc(c.sid)+'</b></td><td><b>'+esc(c.name)+'</b></td><td>'+esc(c.serial)+'</td><td>'+(bw?'':'<span class="bsw" style="background:'+tColor(c)+'"></span>')+esc(tName(c))+(bw?' <i>['+esc(colorName(tColor(c)))+']</i>':'')+'</td>'+(many?'<td>'+esc(cName(c))+'</td>':'')+'<td>'+esc(c.qty)+'</td><td>'+esc(c.location)+'</td><td>'+esc(c.assignedTo)+'</td><td>'+esc(lc?stamp(lc.ts):'')+'</td></tr>'}).join('')+'</table>';
  });
  if(!list.length) h+='<p>No cards.</p>';
  h+='<div class="foot">T-Card Printer &amp; Tracker v'+esc(APP_VERSION)+(utcOn()?' · times UTC (Z)':'')+'</div>';
  s.innerHTML=h; root.innerHTML=''; root.appendChild(s); root.dataset.kind='board';
}
/* ---------- PHYSICAL BOARD: status columns of slots exactly the selected card size ---------- */
function buildSlotsPrint(){ /* rack style: each slot shows only the top strip of its card; the bottom slot of a column is full card height */
  var root=$('printRoot'), list=sortCards(filtered()), bw=printBW(), ids=!!state.settings.slotIds, printed=stamp(Date.now(),true), k=cSize(), z=CSIZE[k];
  var CPP=Math.max(1,Math.floor((8.1+0.2)/(z.w+0.2))), RPP=Math.floor((10.55-0.55-z.h)/z.strip+1e-9)+1, X0=(8.1-(CPP*z.w+(CPP-1)*0.2))/2;
  var cols=state.statuses.map(function(st){return {st:st,cs:list.filter(function(c){return c.status===st.id})}});
  var pages=[];
  for(var g=0;g<cols.length;g+=CPP){
    var grp=cols.slice(g,g+CPP), np=Math.max.apply(null,grp.map(function(x){return Math.ceil(Math.max(x.cs.length,1)/RPP)}));
    for(var p=0;p<np;p++) pages.push({grp:grp,p:p,np:np});
  }
  root.innerHTML=pages.map(function(pg,pi){
    return '<div class="spage"><div class="shd"><span><b>T-Card Board (rack)</b>'+(state.incident?' · '+esc(state.incident):'')+' · printed '+esc(printed)+'</span><span>v'+esc(APP_VERSION)+' · sheet '+(pi+1)+' of '+pages.length+'</span></div>'+
      pg.grp.map(function(x,ci){
        var bg=bw?'':'background:'+x.st.color+';color:'+inkOn(x.st.color);
        var slots=Array.apply(null,Array(RPP)).map(function(_,j){var n=pg.p*RPP+j, c=x.cs[n], last=j===RPP-1;
          return '<div class="slot rk '+k+(last?' last':'')+'" style="width:'+z.w+'in;height:'+(last?z.h:z.strip)+'in"><div class="rs" style="height:'+z.strip+'in">'+
            (ids&&c?'<b>'+esc(c.sid)+'</b> '+esc(cardTitle(c)):'')+'<span class="sn">'+(n+1)+'</span></div>'+(last?'<div class="rl">bottom card: full height</div>':'')+'</div>'}).join('');
        return '<div class="scol" style="left:'+(X0+ci*(z.w+0.2))+'in;width:'+z.w+'in"><div class="slab" style="'+bg+'"><span>'+esc(x.st.name)+'</span><small>'+x.cs.length+' card'+(x.cs.length===1?'':'s')+(pg.np>1?' · part '+(pg.p+1)+'/'+pg.np:'')+'</small></div>'+slots+'</div>';
      }).join('')+'</div>';
  }).join('');
  root.dataset.pages=pages.length; root.dataset.kind='slots';
}
/* ---------- MAP SHEET: background with numbered markers + key ---------- */
function buildMapPrint(){
  var root=$('printRoot'), list=sortCards(filtered()).filter(function(c){return c.mx!=null}), pp=prepBy(), has=!!state.map.img;
  var h='<h1>T-Card Map</h1><div>'+(state.incident?'Incident / event: <b>'+esc(state.incident)+'</b> · ':'')+'Printed <b>'+esc(stamp(Date.now(),true))+'</b>'+(pp.name?' · Prepared by <b>'+esc([pp.name,pp.pos].filter(Boolean).join(', '))+'</b>':'')+' · '+list.length+' card'+(list.length===1?'':'s')+' on map</div>'+
    '<div class="mbox'+(has?'':' nomap')+'">'+(has?'<img alt="" src="'+state.map.img+'">':'')+
    list.map(function(c,i){return '<div class="pin" style="left:'+(c.mx*100)+'%;top:'+(c.my*100)+'%">'+(i+1)+'</div>'}).join('')+'</div>'+
    '<table><tr><th style="width:5%">#</th><th style="width:9%">Card</th><th>Name</th><th>Serial</th><th>Type</th><th>Status</th><th>Location / Assignment</th></tr>'+
    list.map(function(c,i){return '<tr><td><b>'+(i+1)+'</b></td><td><b>'+esc(c.sid)+'</b></td><td>'+esc(c.name)+'</td><td>'+esc(c.serial)+'</td><td>'+esc(tName(c))+'</td><td>'+esc(sName(c.status))+'</td><td>'+esc(c.location)+'</td></tr>'}).join('')+'</table>'+
    (list.length?'':'<p>No cards placed on the map.</p>')+'<div class="foot" style="margin-top:8px;font-size:7.5pt">T-Card Printer &amp; Tracker v'+esc(APP_VERSION)+'</div>';
  var s=document.createElement('div'); s.className='msheet'; s.innerHTML=h; root.innerHTML=''; root.appendChild(s); root.dataset.kind='map';
}
var printMode=null;
window.addEventListener('beforeprint',function(){
  if(printMode){printMode=null;return}
  if(view==='card'&&cur()) buildCardsPrint([cur()]); else buildBoardPrint();
});

/* ---------- exports / backup ---------- */
function cardsCSV(){
  var rows=[['Card','Category','Type','Card color','Name','Serial number','Qty','Owner / Home agency','Status','Location / Assignment','Assigned to','ETA / Checked in','Frequencies / talkgroups / notes','Last change'+(utcOn()?' (UTC)':'')]];
  sortCards(state.cards).forEach(function(c){var lc=lastChange(c); rows.push([c.sid,cName(c),tName(c),colorName(tColor(c)),c.name,c.serial,c.qty,c.agency,sName(c.status),c.location,c.assignedTo,c.checkIn,c.notes,lc?stamp(lc.ts,true):''])});
  return csvRows(rows);
}
function historyCSV(){
  var u=utcOn(), rows=[['Date','Time'+(u?' (UTC)':''),'Card','Name','Serial number','Type','Category','Event','From','To','Location / Assignment']], all=[];
  state.cards.forEach(function(c){c.history.forEach(function(h){all.push([h,c])})});
  all.sort(function(a,b){return a[0].ts-b[0].ts}).forEach(function(x){var h=x[0],c=x[1],p=nowP(u,new Date(h.ts));
    rows.push([usDate(p.d),p.t,c.sid,c.name,c.serial,tName(c),cName(c),h.ev||'status',h.from?sName(h.from):'',sName(h.to),h.loc||''])});
  return csvRows(rows);
}
/* ident is written too (Name + Serial) so the mainline v1.2 app can still import this file */
function backupObj(){return {app:'tcard-tracker',version:2,branch:'1.2-exp.2',exported:new Date().toISOString(),nextSid:state.nextSid,map:state.map.img?{img:state.map.img}:undefined,cards:state.cards.map(function(c){var o=clone(c); o.ident=[c.name,c.serial&&'S/N '+c.serial].filter(Boolean).join(' '); return o}),categories:state.categories,types:state.types,statuses:state.statuses,incident:state.incident,deviceMyInfo:paceIsEmpty()?undefined:paceExport()}}
$('btnCsvCards').onclick=function(){download('TCards_'+todayISO()+'.csv',cardsCSV(),'text/csv')};
$('btnCsvHist').onclick=function(){download('TCards_history_'+todayISO()+'.csv',historyCSV(),'text/csv')};
$('btnExportAll').onclick=function(){download('TCards_backup_'+todayISO()+'.json',JSON.stringify(backupObj(),null,2),'application/json');toast('Backup exported ('+state.cards.length+' cards)')};
$('btnImport').onclick=function(){$('fileImport').click()};
$('fileImport').onchange=function(){
  var f=this.files[0]; if(!f) return; var r=new FileReader();
  r.onload=function(){ try{ importData(JSON.parse(r.result)); }catch(e){ toast('Import failed: not a valid backup file'); } $('fileImport').value=''; };
  r.readAsText(f);
};
function importData(obj){
  if(!obj||!Array.isArray(obj.cards)) throw new Error('bad');
  var merge=function(key){(obj[key]||[]).forEach(function(x){if(!x||!x.id) return; var a=state[key], i=a.findIndex(function(y){return y.id===x.id}); x=clone(x); if(x.color) x.color=normHex(x.color); if(i<0) a.push(x); else a[i]=x})};
  merge('categories'); merge('types'); merge('statuses'); state.statuses.forEach(fixStat);
  state.types.forEach(function(t){if(!catById(t.catId)) t.catId=state.categories[0].id});
  var added=0, replaced=0;
  obj.cards.forEach(function(c){c=clone(c); if(c&&c.name!=null) delete c.ident; c=fixCard(c); var i=state.cards.findIndex(function(x){return x.id===c.id});
    if(i>=0){if((state.cards[i].updated||0)<=(c.updated||0)){state.cards[i]=c;replaced++}} else {state.cards.push(c);added++}});
  ensureSids(); if(obj.map&&typeof obj.map.img==='string'&&obj.map.img.indexOf('data:image/')===0&&!state.map.img) state.map.img=obj.map.img;
  if(typeof obj.incident==='string'&&!state.incident) state.incident=obj.incident;
  var pcNote=''; if(obj.deviceMyInfo){var p=paceFix(obj.deviceMyInfo); if(paceIsEmpty()&&!paceIsEmpty(p)){pace=p;paceSave();pcNote=' + My Info'}}
  save(true); show(view==='card'?'board':view); toast('Imported: '+added+' new, '+replaced+' updated'+pcNote);
}

/* ---------- Advanced ---------- */
var wakeLock=null;
function wantWake(){return !!state.settings.fieldMode&&document.visibilityState==='visible'}
function syncWake(){
  try{
    if(wantWake()){ if(!wakeLock&&navigator.wakeLock&&navigator.wakeLock.request){ navigator.wakeLock.request('screen').then(function(w){wakeLock=w; w.addEventListener&&w.addEventListener('release',function(){wakeLock=null}); if(!state.settings.fieldMode){w.release().catch(function(){})}}).catch(function(){}); } }
    else if(wakeLock){ var w=wakeLock; wakeLock=null; w.release().catch(function(){}); }
  }catch(e){}
}
document.addEventListener('visibilitychange',function(){wakeLock=document.visibilityState==='visible'?wakeLock:null;syncWake()});
function applyAdvanced(){
  var st=state.settings;
  document.documentElement.classList.toggle('field',!!st.fieldMode);
  $('optField').checked=!!st.fieldMode; $('optUTC').checked=!!st.utc; $('optNightColor').value=st.nightColor==='green'?'green':'red';
  $('optCw').checked=!!st.cw; $('optCwVol').value=Math.round(cwVol()*100); $('optCwPitch').value=cwPitch(); $('cwSub').classList.toggle('hidden',!st.cw); $('optCwPitchV').textContent=cwPitch()+' Hz';
  syncWake(); setHdr();
}
$('optField').onchange=function(){state.settings.fieldMode=this.checked;save();applyAdvanced();toast(this.checked?'Field mode on':'Field mode off')};
$('optUTC').onchange=function(){state.settings.utc=this.checked;save();applyAdvanced();renderTicker();toast(this.checked?'UTC on: times show in UTC (Z)':'UTC off: local time')};
$('optNightColor').onchange=function(){state.settings.nightColor=this.value==='green'?'green':'red';save();applyTheme()};
$('optCw').onchange=function(){state.settings.cw=this.checked;save();applyAdvanced(); if(this.checked) cwPlay('R')};
$('optCwVol').onchange=function(){state.settings.cwVol=(+this.value)/100;save();cwPlay('R')};
$('optCwPitch').oninput=function(){$('optCwPitchV').textContent=this.value+' Hz'};
$('optCwPitch').onchange=function(){state.settings.cwPitch=+this.value;save();applyAdvanced();cwPlay('R')};
/* CW sounds: shared engine (comu-shared/cw.js) */

/* ---------- About ---------- */
document.querySelectorAll('.appver').forEach(function(e){e.textContent=APP_VERSION});
var ABOUT_LINES=[
 'Works offline. Data stays on this device.',
 'Experimental side branch of v1.2. Its data is kept separately from the main T-Card app.',
 'Cards print 3.5 × 5 in, front and back side by side, with cut marks.',
 'Cards print many per letter sheet (10 at 2 × 3.5 in or 18 at 1.5 × 2.5 in), or as 3.5 × 5 T-cards.',
 'The physical board prints slots the same size as the cards, per status, so cut cards sit on top.',
 'Mainline v1.2 backups import here; old ID values go into Name.',
 'Back up with Export JSON; Import JSON restores.'];
$('btnAbout').onclick=function(){dialog('<h2 style="margin-top:0">About</h2><p style="margin:0 0 6px"><b>T-Card Printer &amp; Tracker</b> (experimental branch) by lambdadriver<br><span class="small muted" id="aboutVer" role="button" tabindex="0">Version '+esc(APP_VERSION)+'</span></p><ul id="aboutBody">'+ABOUT_LINES.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul><div id="eggSlot"></div>',[{t:'Close',v:'ok',cls:'primary'}]); eggTaps=0; renderEggMenu();
  var v=$('aboutVer'); v.onclick=verTap; v.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();verTap()}};};
/* ---------- Easter eggs (About: tap the version 7 times) ---------- */
var eggTaps=0, eggTapT=0;
function verTap(){
  var now=Date.now(); if(now-eggTapT>2500) eggTaps=0; eggTapT=now;
  if(state.settings.eggUnlocked){toast('Easter eggs are already unlocked');return}
  eggTaps++;
  if(eggTaps>=7){eggTaps=0;state.settings.eggUnlocked=true;save();renderEggMenu();toast('\uD83E\uDD5A Easter eggs unlocked!')}
  else if(eggTaps>=3){var n=7-eggTaps;toast(n+' more tap'+(n===1?'':'s')+' to unlock Easter eggs')}
}
var EGG_DESC={waterfall:'Radio waterfall scrolls behind the board.',qsl:'Cards turn into QSL postcards. TNX QSO 73.'};
function renderEggMenu(){
  var slot=$('eggSlot'); if(!slot) return;
  if(!state.settings.eggUnlocked){slot.innerHTML='';return}
  slot.innerHTML='<div id="eggMenu"><h3>&#129370; Easter eggs</h3><p class="small muted" style="margin:0">The theme button turns a mode off.</p>'+
    EGG_ORDER.map(function(k){return '<label class="toggle"><input type="checkbox" data-egg="'+k+'" id="egg_'+k+'"'+(eggOn()===k?' checked':'')+'><span>'+esc(EGGS[k].name)+'<span class="small">'+esc(EGG_DESC[k])+'</span></span></label>'}).join('')+
    '<div class="eggfoot"><button type="button" id="eggHide">Hide</button></div></div>';
  slot.querySelectorAll('input[data-egg]').forEach(function(c){c.onchange=function(){state.settings.egg=this.checked?this.dataset.egg:'';save();applyTheme();syncEggUI()}});
  $('eggHide').onclick=function(){state.settings.eggUnlocked=false;save();renderEggMenu();toast('Easter eggs hidden')};
}
function syncEggUI(){document.querySelectorAll('#eggMenu input[data-egg]').forEach(function(c){c.checked=eggOn()===c.dataset.egg})}

window.TCARD={version:APP_VERSION,getState:function(){return state},getPace:function(){return pace},importData:importData,setStatus:function(id,sid,loc){var c=state.cards.find(function(x){return x.id===id});var r=c&&setStatus(c,sid,loc);if(view==='board')renderBoardCols();return r},
  newCard:function(){return newCard()},filtered:function(){return filtered().map(function(c){return c.id})},setQuery:function(q){fq=q;renderFilters();afterFilter()},
  buildCardsPrint:function(ids){printMode=1;buildCardsPrint(ids?ids.map(function(i){return state.cards.find(function(c){return c.id===i})}).filter(Boolean):sortCards(filtered()))},buildBoardPrint:function(){printMode=1;buildBoardPrint()},buildSlotsPrint:function(){printMode=1;buildSlotsPrint()},buildMapPrint:function(){printMode=1;buildMapPrint()},render:function(){renderBoardCols()},
  cardsCSV:cardsCSV,historyCSV:historyCSV,backup:backupObj,cwLast:function(){return cwLast},show:function(v){show(v)}};

/* ---------- init ---------- */
load(); applyTheme(); applyAdvanced();
if(!storageOK) showStorageWarn('This browser is blocking local storage (private mode?). Cards will NOT be kept after closing. Use Export JSON before leaving.');
if(navigator.storage&&navigator.storage.persist){try{navigator.storage.persist()}catch(e){}}
show('board');
setHdr();
})();
</script>
<script>
/* --- inlined from comu-shared/shell.js --- */
/* COMU Field Logs APK shell hooks. Does nothing in a normal browser; only runs inside the Android app (window.ComuAndroid). */
(function(){
  var A=window.ComuAndroid; if(!A) return;
  var de=document.documentElement; de.classList.add('apk');
  var HOME='../index.html';
  function goHome(){location.href=HOME}
  /* Home (launcher) button at the left of the top bar */
  function addHome(){
    var bar=document.querySelector('header.bar .wrap'); if(!bar||document.getElementById('btnApkHome')) return;
    var b=document.createElement('button'); b.id='btnApkHome'; b.type='button'; b.className='ghost noprint';
    b.title='COMU Field Logs home'; b.setAttribute('aria-label','COMU Field Logs home'); b.innerHTML='&#8962;'; b.onclick=goHome;
    bar.insertBefore(b,bar.firstChild);
  }
  /* Printing goes to the Android print framework (Save as PDF or a printer) */
  window.print=function(){try{A.print(document.title||'Print')}catch(e){}};
  /* Exports: blob downloads are handed to Android, which saves them to Downloads */
  var blobs={}, mk=URL.createObjectURL;
  URL.createObjectURL=function(o){var u=mk.apply(URL,arguments); if(o instanceof Blob) blobs[u]=o; return u};
  var click=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    var b=this.download&&blobs[this.href];
    if(!b) return click.apply(this,arguments);
    var name=this.download, fr=new FileReader();
    fr.onload=function(){var s=String(fr.result); try{A.saveFile(name,b.type||'application/octet-stream',s.slice(s.indexOf(',')+1))}catch(e){}};
    fr.readAsDataURL(b); delete blobs[this.href];
  };
  /* Field mode keeps the screen on (native flag, in addition to the Wake Lock API) */
  function syncKeep(){try{A.keepScreenOn(de.classList.contains('field'))}catch(e){}}
  /* One theme across the home screen and all three apps (bright / dark / night, red or green) */
  var T=['light','dark','night'];
  function lastTheme(){try{return JSON.parse(localStorage.getItem('comu.lastTheme')||'null')}catch(e){return null}}
  function hex(c){var m=String(c).match(/\d+(\.\d+)?/g); if(!m||m.length<3) return ''; return '#'+m.slice(0,3).map(function(x){x=Math.round(+x).toString(16);return x.length<2?'0'+x:x}).join('')}
  function syncBars(){try{var h=document.querySelector('header.bar'); var c=hex(getComputedStyle(h||document.body).backgroundColor); if(c) A.setBars(c)}catch(e){}}
  function syncTheme(){
    syncBars(); if(de.getAttribute('data-egg')) return;
    try{localStorage.setItem('comu.lastTheme',JSON.stringify({theme:de.getAttribute('data-theme')||'light',night:de.getAttribute('data-night')||'red'}))}catch(e){}}
  function adoptTheme(){
    var lt=lastTheme(); if(!lt||de.getAttribute('data-egg')) return;
    var b=document.getElementById('btnTheme');
    for(var i=0;b&&T.indexOf(lt.theme)>=0&&de.getAttribute('data-theme')!==lt.theme&&i<4;i++) b.click();
    var nc=document.getElementById('optNightColor');
    if(nc&&(lt.night==='red'||lt.night==='green')&&de.getAttribute('data-night')!==lt.night){nc.value=lt.night; nc.dispatchEvent(new Event('change'))}
  }

  /* Android back: close a dialog, then go to the app's main list/board, then to the home screen */
  window.comuBack=function(){
    var d=document.getElementById('dlg'); if(d&&d.open){d.close('cancel');return 'dialog'}
    var main=document.querySelector('#viewLogs,#viewBoard'), h=document.getElementById('btnHome');
    if(main&&h&&main.classList.contains('hidden')){h.click();return 'main'}
    goHome(); return 'home';
  };
  function init(){
    addHome(); adoptTheme(); syncKeep(); syncTheme();
    new MutationObserver(function(){syncKeep();syncTheme()}).observe(de,{attributes:true,attributeFilter:['class','data-theme','data-night','data-egg']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
</script>
</body>
</html>
