
/* ---------- My Info (own key; seeds once from the sibling 214 / 309 apps when empty) ---------- */
var PACE_KEY='tcard.exp1.myinfo.v1', PACE_SEEDS=['tcard.myinfo.v1','ics214.pace.v1','ics309.myinfo.v1'];
var PACE_FIELDS=['name','position','agency'];
var ICS_POSITIONS=[['COML','Communications Unit Leader'],['COMT','Communications Technician'],['RADO','Radio Operator'],['INCM','Incident Communications Manager'],['INTD','Incident Tactical Dispatcher'],['AUXC','Auxiliary Communications'],['ITSL','IT Service Support Leader'],['THSP','Technical Specialist'],['COMC','Communications Coordinator']];
function posValue(p){return p[0]+' - '+p[1]}
var paceEditing=false;
function paceBlank(){return {name:'',position:'',agency:''}}
function paceFix(o){var b=paceBlank(); if(!o||typeof o!=='object') return b; PACE_FIELDS.forEach(function(k){b[k]=typeof o[k]==='string'?o[k]:''}); return b}
function paceIsEmpty(o){o=o||pace;return PACE_FIELDS.every(function(k){return !String(o[k]||'').trim()})}
function paceLoad(){
  var p; try{p=paceFix(JSON.parse(localStorage.getItem(PACE_KEY)||'null'))}catch(e){p=paceBlank()}
  if(paceIsEmpty(p)) PACE_SEEDS.some(function(k){try{var s=paceFix(JSON.parse(localStorage.getItem(k)||'null')); if(!paceIsEmpty(s)){p=s;return true}}catch(e){} return false});
  return p;
}
var pace=paceFix(myinfoMerge(paceLoad(),'tcard'));
function paceExport(){var o={};PACE_FIELDS.forEach(function(k){o[k]=pace[k]});return o}
function paceSave(){try{localStorage.setItem(PACE_KEY,JSON.stringify(pace)); myinfoPublish(pace,'tcard')}catch(e){showStorageWarn('Could not save My Info ('+e.name+').')}}
function paceFillPosSelect(){var sel=$('pcPosSel'); if(sel.options.length) return;
  sel.innerHTML='<option value="">Select…</option>'+ICS_POSITIONS.map(function(p){return '<option value="'+esc(posValue(p))+'">'+esc(p[0]+' — '+p[1])+'</option>'}).join('')+'<option value="__other">Other…</option>'}
function paceSyncPos(){paceFillPosSelect(); var v=$('pcPos').value.trim(), sel=$('pcPosSel');
  var hit=ICS_POSITIONS.some(function(p){return posValue(p)===v});
  sel.value=hit?v:(v?'__other':''); $('pcPos').classList.toggle('hidden',sel.value!=='__other')}
function paceReadHTML(){
  if(paceIsEmpty()) return '<p class="mi-empty">Empty. Tap Edit.</p>';
  var F=[['Name','name'],['ICS position','position'],['Home Agency and Unit','agency']].filter(function(f){return String(pace[f[1]]||'').trim()});
  return '<dl class="mi-dl">'+F.map(function(f){return '<dt>'+f[0]+'</dt><dd>'+esc(pace[f[1]])+'</dd>'}).join('')+'</dl><p class="small muted" style="margin:8px 0 0">Fills “Prepared by” on cards and the status board sheet.</p>';
}
function renderPace(){
  if(paceIsEmpty()&&!paceEditing) paceEditing=true;
  $('paceEdit').classList.toggle('hidden',!paceEditing); $('paceRead').classList.toggle('hidden',paceEditing);
  $('paceToggle').classList.toggle('hidden',paceEditing);
  if(paceEditing){ document.querySelectorAll('#paceEdit [data-pc]').forEach(function(el){el.value=pace[el.dataset.pc]||''}); paceSyncPos(); }
  else $('paceRead').innerHTML=paceReadHTML();
}
function paceCollect(){document.querySelectorAll('#paceEdit [data-pc]').forEach(function(el){pace[el.dataset.pc]=el.value})}
$('pcPosSel').addEventListener('input',function(){var v=this.value,t=$('pcPos');
  if(v==='__other'){ if(ICS_POSITIONS.some(function(p){return posValue(p)===t.value})) t.value=''; t.classList.remove('hidden'); setTimeout(function(){t.focus()},0); }
  else { t.value=v; t.classList.add('hidden'); } });
$('paceEdit').addEventListener('input',function(){paceCollect();paceSave()});
$('paceSave').onclick=function(){paceCollect();paceSave();paceEditing=false;renderPace();window.scrollTo(0,0);toast('My Info saved')};
$('paceToggle').onclick=function(){paceEditing=true;renderPace()};
$('paceClear').onclick=function(){confirmBox('Clear My Info on this device?','Clear').then(function(ok){if(!ok)return;PACE_FIELDS.forEach(function(k){pace[k]=''});paceSave();paceEditing=true;renderPace()})};
$('btnPace').onclick=function(){paceEditing=false;show('pace')};
function prepBy(){return {name:(state.prepName||pace.name||'').trim(),pos:(state.prepPos||pace.position||'').trim()}}

/* ---------- filters (category / type / search), shared by board and print ---------- */
var fq='';
function fCat(){var v=state.settings.fCat; return v&&catById(v)?v:''}
function fType(){var v=state.settings.fType, t=v&&typeById(v); return t&&(!fCat()||t.catId===fCat())?v:''}
function cardText(c){return [c.sid,c.name,c.serial,tName(c),cName(c),c.agency,sName(c.status),c.location,c.assignedTo,c.checkIn,c.notes].join(' ').toLowerCase()}
function filtered(){
  var fc=fCat(), ft=fType(), q=fq.trim().toLowerCase();
  return state.cards.filter(function(c){var t=typeOf(c);
    if(fc&&(!t||t.catId!==fc)) return false; if(ft&&c.typeId!==ft) return false;
    if(q&&q.split(/\s+/).some(function(w){return cardText(c).indexOf(w)<0})) return false; return true});
}
function sortCards(a){return a.slice().sort(function(x,y){
  var tx=state.types.indexOf(typeOf(x)), ty=state.types.indexOf(typeOf(y)); return (tx-ty)||cardTitle(x).localeCompare(cardTitle(y),undefined,{numeric:true})})}
function filterText(){var fc=fCat(),ft=fType(),p=[]; if(state.categories.length>1) p.push(fc?catById(fc).name:'All categories'); p.push(ft?typeById(ft).name:'All types'); if(fq.trim()) p.push('“'+fq.trim()+'”'); return p.join(' · ')}
function typeOptions(sel,catId,allLabel){
  var cats=catId?[catById(catId)]:state.categories, h=allLabel!=null?'<option value="">'+esc(allLabel)+'</option>':'';
  var many=state.categories.length>1&&!catId;
  cats.forEach(function(k){var ts=state.types.filter(function(t){return t.catId===k.id}); if(!ts.length) return;
    var o=ts.map(function(t){return '<option value="'+esc(t.id)+'"'+(t.id===sel?' selected':'')+'>'+esc(t.name)+'</option>'}).join('');
    h+=many?'<optgroup label="'+esc(k.name)+'">'+o+'</optgroup>':o});
  return h;
}
function renderFilters(){
  var n=filtered().length, tot=state.cards.length;
  var h=(state.categories.length>1?'<select data-flt="cat" aria-label="Category"><option value="">All categories</option>'+state.categories.map(function(k){return '<option value="'+esc(k.id)+'"'+(k.id===fCat()?' selected':'')+'>'+esc(k.name)+'</option>'}).join('')+'</select>':'')+
    '<select data-flt="type" aria-label="Type">'+typeOptions(fType(),fCat(),'All types')+'</select>'+
    '<input type="search" data-flt="q" placeholder="Search ID, name, serial, location…" aria-label="Search" value="'+esc(fq)+'">'+
    '<span class="cnt" data-flt-count>'+(n===tot?tot+' card'+(tot===1?'':'s'):n+' of '+tot+' cards')+'</span>';
  document.querySelectorAll('[data-fbar]').forEach(function(b){b.innerHTML=h});
}
function afterFilter(){if(view==='board') renderBoardCols(); else if(view==='print') renderPList(); var n=filtered().length,tot=state.cards.length; document.querySelectorAll('[data-flt-count]').forEach(function(e){e.textContent=n===tot?tot+' card'+(tot===1?'':'s'):n+' of '+tot+' cards'})}
document.addEventListener('change',function(e){var f=e.target.closest&&e.target.closest('[data-flt]'); if(!f||f.dataset.flt==='q') return;
  if(f.dataset.flt==='cat'){state.settings.fCat=f.value; if(!fType()) state.settings.fType='';} else state.settings.fType=f.value;
  save(); renderFilters(); afterFilter()});
document.addEventListener('input',function(e){var f=e.target.closest&&e.target.closest('[data-flt="q"]'); if(!f) return; fq=f.value; afterFilter()});

/* ---------- status board: Columns (kanban) or Map view; pointer-event drag (mouse, touch, pen) ---------- */
function bview(){return state.settings.bview==='map'?'map':'cols'}
function renderBoard(){renderFilters();renderBoardCols()}
function tvars(c){return '--tc:'+tColor(c)+';--tt:'+inkOn(tColor(c))+';--cc:'+cColor(c)+';--sc:'+sColor(c.status)}
function tileHTML(c){
  var sub=[c.location,c.assignedTo].filter(Boolean).join(' · ');
  return '<div class="tile" tabindex="0" data-id="'+esc(c.id)+'" style="'+tvars(c)+'" title="'+esc(cName(c))+'">'+
    '<div class="tl1"><span class="sid">'+esc(c.sid)+'</span><b>'+esc(cardTitle(c))+'</b>'+(c.qty&&c.qty!=='1'?'<span>× '+esc(c.qty)+'</span>':'')+'</div>'+
    '<div class="tl2">'+esc(tName(c))+(c.serial?' · S/N '+esc(c.serial):'')+'</div>'+(sub?'<div class="tl3">'+esc(sub)+'</div>':'')+
    '<span class="grip" aria-hidden="true" title="Drag">&#10303;</span></div>';
}
function qtyN(c){var n=parseInt(c.qty,10);return isFinite(n)&&n>0?n:1}
function renderBoardCols(){
  var mv=bview()==='map';
  document.querySelectorAll('[data-bv]').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.bv===bview())});
  $('board').classList.toggle('hidden',mv); $('mapWrap').classList.toggle('hidden',!mv);
  if(mv) return renderMap();
  var list=sortCards(filtered()), b=$('board');
  b.style.setProperty('--cols',state.statuses.length);
  if(!state.cards.length){b.innerHTML='<div class="card muted" style="grid-column:1/-1">No cards yet. Tap <b>+ New card</b> to add equipment.</div>';return}
  b.innerHTML=state.statuses.map(function(s){var cs=list.filter(function(c){return c.status===s.id}), u=cs.reduce(function(a,c){return a+qtyN(c)},0);
    return '<div class="col" data-sid="'+esc(s.id)+'"><h3><span><i class="sd" style="background:'+s.color+'"></i>'+esc(s.name)+(u>cs.length?' <span class="u">'+u+' units</span>':'')+'</span><b>'+cs.length+'</b></h3>'+
      (cs.length?cs.map(tileHTML).join(''):'<div class="empty">None. Drop a card here.</div>')+'</div>'}).join('');
}
function renderMap(){
  var list=sortCards(filtered()), A=$('mapArea'), img=$('mapImg'), has=!!state.map.img;
  A.classList.toggle('nomap',!has); img.classList.toggle('hidden',!has); if(has&&img.getAttribute('src')!==state.map.img) img.src=state.map.img; if(!has) img.removeAttribute('src');
  A.querySelectorAll('.mk').forEach(function(m){m.remove()});
  A.insertAdjacentHTML('beforeend',list.filter(function(c){return c.mx!=null}).map(function(c){
    return '<div class="mk" tabindex="0" data-id="'+esc(c.id)+'" style="left:'+(c.mx*100)+'%;top:'+(c.my*100)+'%;'+tvars(c)+'" title="'+esc(cardLabel(c)+' · '+sName(c.status))+'">'+esc(c.sid)+' '+esc(cardTitle(c))+'</div>'}).join(''));
  var off=list.filter(function(c){return c.mx==null});
  $('mapTray').innerHTML=off.length?off.map(tileHTML).join(''):'<span class="muted small">All shown cards are on the map.</span>';
}
document.querySelectorAll('[data-bv]').forEach(function(x){x.onclick=function(){state.settings.bview=x.dataset.bv;save();renderBoardCols()}});

/* drag engine: mouse drags the whole tile; touch/pen: press and hold ~300 ms anywhere on a tile (a quick swipe still scrolls); the grip and map markers drag at once */
var drag=null, noClickUntil=0;
function dropTarget(x,y){
  var el=document.elementFromPoint(x,y); if(!el) return null;
  if(bview()==='map'){var t=el.closest('#mapTray'); if(t) return {kind:'tray',el:t}; var m=el.closest('#mapArea'); if(m) return {kind:'map',el:m}; return null}
  var c=el.closest('#board .col'); return c?{kind:'col',el:c}:null;
}
function clearOver(){document.querySelectorAll('.over').forEach(function(x){x.classList.remove('over')})}
document.addEventListener('pointerdown',function(e){
  if(view!=='board'||e.button>0) return;
  var t=e.target.closest('#board .tile,#mapTray .tile,#mapArea .mk'); if(!t) return;
  var isMk=t.classList.contains('mk'), grip=!!e.target.closest('.grip');
  var hold=e.pointerType!=='mouse'&&!grip&&!isMk; if(!hold) e.preventDefault();
  var r=t.getBoundingClientRect();
  drag={id:t.dataset.id,el:t,pid:e.pointerId,x0:e.clientX,y0:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,w:r.width,mk:isMk,on:false,ghost:null,tgt:null,hold:hold,armed:!hold};
  if(hold){var d0=drag; d0.t=setTimeout(function(){if(drag===d0){d0.armed=true;d0.el.classList.add('held');try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}}},300)}
});
document.addEventListener('pointermove',function(e){
  if(!drag||e.pointerId!==drag.pid) return;
  if(!drag.armed){ if(Math.abs(e.clientX-drag.x0)+Math.abs(e.clientY-drag.y0)>8){clearTimeout(drag.t);drag=null} return }
  if(!drag.on){ if(Math.abs(e.clientX-drag.x0)+Math.abs(e.clientY-drag.y0)<6) return;
    drag.on=true; var g=drag.el.cloneNode(true); g.classList.add('dghost'); g.removeAttribute('id'); g.style.width=drag.w+'px'; g.style.margin='0';
    if(drag.mk){drag.dx=0;drag.dy=0} document.body.appendChild(g); drag.ghost=g; drag.el.classList.add('dragging'); }
  e.preventDefault();
  drag.ghost.style.left=(e.clientX-drag.dx)+'px'; drag.ghost.style.top=(e.clientY-drag.dy)+'px';
  var t=dropTarget(e.clientX,e.clientY); clearOver(); if(t) t.el.classList.add('over'); drag.tgt=t;
  var vh=window.innerHeight; if(e.clientY<60) window.scrollBy(0,-12); else if(e.clientY>vh-60) window.scrollBy(0,12);
},{passive:false});
function endDrag(e,cancel){
  if(!drag||(e&&e.pointerId!==drag.pid)) return; var d=drag; drag=null; clearTimeout(d.t); d.el.classList.remove('held');
  if(!d.on) return; noClickUntil=Date.now()+400;
  if(d.ghost) d.ghost.remove(); d.el.classList.remove('dragging'); clearOver();
  var c=state.cards.find(function(x){return x.id===d.id}); var t=cancel?null:dropTarget(e.clientX,e.clientY);
  if(c&&t){
    if(t.kind==='col') setStatus(c,t.el.dataset.sid);
    else if(t.kind==='map'){var r=t.el.getBoundingClientRect(); c.mx=Math.round(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*10000)/10000; c.my=Math.round(Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))*10000)/10000; touch(c); save(true)}
    else if(t.kind==='tray'&&c.mx!=null){c.mx=null;c.my=null;touch(c);save(true);toast(c.sid+' taken off the map')}
  }
  renderBoardCols();
}
document.addEventListener('pointerup',function(e){endDrag(e,false)});
document.addEventListener('touchmove',function(e){if(drag&&drag.armed&&e.cancelable) e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',function(e){if(e.target.closest&&e.target.closest('.tile,.mk')) e.preventDefault()});
document.addEventListener('pointercancel',function(e){endDrag(e,true)});
function tileOpen(e){if(Date.now()<noClickUntil) return; var t=e.target.closest('.tile,.mk'); if(t) statusDialog(t.dataset.id)}
['board','mapTray','mapArea'].forEach(function(id){
  $(id).addEventListener('click',tileOpen);
  $(id).addEventListener('keydown',function(e){var t=e.target.closest('.tile,.mk'); if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();statusDialog(t.dataset.id)}});
});
/* map image: loaded from a local file, downscaled, stored inside the saved data (never fetched) */
$('btnMapLoad').onclick=function(){$('fileMap').click()};
$('fileMap').onchange=function(){
  var f=this.files[0]; this.value=''; if(!f) return; if(!/^image\//.test(f.type)){toast('Not an image file');return}
  var r=new FileReader(); r.onload=function(){var im=new Image(); im.onload=function(){
      var k=Math.min(1,1600/Math.max(im.width,im.height)), cv=document.createElement('canvas'); cv.width=Math.round(im.width*k); cv.height=Math.round(im.height*k);
      var g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,cv.width,cv.height); g.drawImage(im,0,0,cv.width,cv.height);
      state.map.img=cv.toDataURL('image/jpeg',0.82); save(true); renderBoardCols(); toast('Map loaded')};
    im.onerror=function(){toast('Could not read that image')}; im.src=r.result};
  r.readAsDataURL(f);
};
$('btnMapClear').onclick=function(){if(!state.map.img){toast('No map loaded');return} confirmBox('Remove the map image? Card positions are kept.','Remove').then(function(ok){if(!ok)return; state.map.img=''; save(true); renderBoardCols()})};

/* status change / move: every change is time-stamped in the card's history */
function setStatus(c,sid,loc){
  var s=statById(sid); if(!s) return false;
  var locCh=loc!=null&&loc.trim()!==c.location; if(locCh) c.location=loc.trim();
  if(c.status===sid&&!locCh) return false;
  var h={ts:Date.now(),to:sid,loc:c.location}; if(c.status!==sid) h.from=c.status; else h.ev='moved';
  c.status=sid; c.history.push(h); touch(c); cwPlay('R');
  toast(c.sid+' '+cardTitle(c)+(h.ev==='moved'?' moved to '+(c.location||'(blank)'):' → '+s.name)); renderTicker(); return true;
}
function statusDialog(id){
  var c=state.cards.find(function(x){return x.id===id}); if(!c) return; var lc=lastChange(c);
  dialog('<h2 style="margin:0">'+esc(cardLabel(c))+'</h2><div class="small muted">'+esc(tName(c))+' · now <b>'+esc(sName(c.status))+'</b>'+(lc?' since '+esc(stamp(lc.ts)):'')+'</div>'+
    '<label for="sdLoc" style="margin-top:12px">Location / Assignment</label><input id="sdLoc" list="dlLoc" autocomplete="off" value="'+esc(c.location)+'">'+
    '<div class="sbtns">'+state.statuses.map(function(s){return '<button type="button" data-sid="'+esc(s.id)+'" aria-pressed="'+(s.id===c.status)+'">'+esc(s.name)+'</button>'}).join('')+'</div>',
    [{t:'Close',v:'close'},{t:'Open card',v:'open',cls:'primary'}]).then(function(v){
      var loc=$('sdLoc')?$('sdLoc').value:null, sid=v.indexOf('s:')===0?v.slice(2):c.status;
      setStatus(c,sid,loc); if(v==='open'){state.currentId=c.id;save();show('card')} else if(view==='board') renderBoardCols();
    });
  fillDatalists();
  document.querySelectorAll('#dlgBody [data-sid]').forEach(function(b){b.onclick=function(){$('dlg').close('s:'+b.dataset.sid)}});
}

/* ---------- new card / card editor ---------- */
function newCard(){
  if(!state.types.length){toast('Add a type first (Types)');show('settings');return null}
  var t=typeById(fType())||(fCat()&&state.types.find(function(x){return x.catId===fCat()}))||state.types[0];
  var c=fixCard({id:uid(),created:Date.now(),typeId:t.id,qty:'1',status:state.statuses[0].id});
  c.history.push({ts:c.created,to:c.status,ev:'created'});
  state.cards.push(c); ensureSids(); state.currentId=c.id; save(true); cwPlay('E'); return c;
}
$('btnNew').onclick=function(){if(newCard()){show('card');setTimeout(function(){$('cName').focus()},50)}};
function uniq(a){var s={};a.forEach(function(x){x=String(x||'').trim();if(x)s[x]=1});return Object.keys(s).sort()}
function fillDatalists(){
  var o=function(a){return a.map(function(x){return '<option value="'+esc(x)+'">'}).join('')};
  $('dlLoc').innerHTML=o(uniq(state.cards.map(function(c){return c.location}).concat(state.cards.reduce(function(a,c){return a.concat(c.history.map(function(h){return h.loc}))},[]))));
  $('dlTo').innerHTML=o(uniq(state.cards.map(function(c){return c.assignedTo}).concat(ICS_POSITIONS.map(function(p){return p[0]}))));
  $('dlAgency').innerHTML=o(uniq(state.cards.map(function(c){return c.agency}).concat([pace.agency])));
  $('dlPositions').innerHTML=o(uniq(ICS_POSITIONS.map(posValue).concat([pace.position])));
}
function renderCardHead(c){
  var h=$('cHead'), col=tColor(c); h.style.background=col; h.style.color=inkOn(col); h.style.setProperty('--cc',cColor(c));
  h.innerHTML=esc(cardLabel(c))+'<small>'+esc(cName(c)+' · '+tName(c)+' · '+sName(c.status))+'</small>';
  $('title').textContent=cardTitle(c);
}
function histLoc(h){return h.loc||(h.ev==='created'?'New card':'')}
function histLabel(h){return h.ev==='created'?sName(h.to):h.ev==='moved'?'Moved':h.ev==='status removed'?sName(h.to)+' (status removed)':sName(h.to)}
function renderHist(c){
  var a=c.history.slice().reverse();
  $('cHist').innerHTML=a.length?'<table class="hist"><thead><tr><th>Date/Time'+(utcOn()?' (UTC)':'')+'</th><th>Status</th><th>Location / Assignment</th></tr></thead><tbody>'+
    a.map(function(h){return '<tr><td class="dt">'+esc(stamp(h.ts))+'</td><td>'+esc(histLabel(h))+'</td><td>'+esc(histLoc(h))+'</td></tr>'}).join('')+'</tbody></table>':'<p class="muted">No changes yet.</p>';
}
function renderCard(){
  var c=cur(); if(!c){show('board');return}
  $('cType').innerHTML=typeOptions(c.typeId,'',null);
  $('cStatus').innerHTML=state.statuses.map(function(s){return '<option value="'+esc(s.id)+'"'+(s.id===c.status?' selected':'')+'>'+esc(s.name)+'</option>'}).join('');
  document.querySelectorAll('#viewCard [data-c]').forEach(function(i){if(i.dataset.c!=='typeId') i.value=c[i.dataset.c]||''});
  $('cType').value=c.typeId; fillDatalists(); renderCardHead(c); renderHist(c);
}
document.querySelectorAll('#viewCard [data-c]').forEach(function(i){
  i.addEventListener(i.tagName==='SELECT'?'change':'input',function(){var c=cur(); if(!c) return; if(i.dataset.c==='location') return; c[i.dataset.c]=i.value; touch(c); renderCardHead(c)});
});
$('cLoc').addEventListener('change',function(){var c=cur(); if(c&&setStatus(c,c.status,this.value)) renderHist(c)});
$('cStatus').addEventListener('change',function(){var c=cur(); if(!c) return; setStatus(c,this.value,$('cLoc').value); renderCardHead(c); renderHist(c)});
$('cInNow').onclick=function(){var c=cur(); if(!c) return; c.checkIn=stamp(Date.now()); $('cIn').value=c.checkIn; touch(c)};
$('cDone').onclick=function(){show('board')};
$('cPrint').onclick=function(){var c=cur(); if(c){printMode=1;buildCardsPrint([c]);window.print()}};
$('cDel').onclick=function(){var c=cur(); if(!c) return; confirmBox('Delete the card “'+cardTitle(c)+'” ('+tName(c)+') and its history? This cannot be undone.','Delete card').then(function(ok){
  if(!ok) return; state.cards=state.cards.filter(function(x){return x.id!==c.id}); state.currentId=null; save(true); toast('Card deleted'); show('board')})};

/* ---------- last-change ticker (top of app; screen only) ---------- */
function renderTicker(){
  var el=$('lastLine'); if(!el) return; var best=null, bc=null;
  state.cards.forEach(function(c){var h=lastChange(c); if(h&&(!best||h.ts>=best.ts)){best=h;bc=c}});
  if(!best){el.textContent='No changes yet';el.title='';return}
  var p=nowP(utcOn(),new Date(best.ts)), txt=best.ev==='created'?' added ('+sName(best.to)+')':best.ev==='moved'?' moved':' → '+sName(best.to);
  el.innerHTML='Last: <b>'+esc(p.t+(utcOn()?'Z':''))+'</b> <b>'+esc(cardTitle(bc))+'</b>'+esc(txt)+(best.loc?' · '+esc(best.loc):'');
  el.title=el.textContent;
}
