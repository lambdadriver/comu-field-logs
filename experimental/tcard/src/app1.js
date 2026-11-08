<script>
(function(){
'use strict';
var KEY='tcard.exp1.v1';   /* own key: never touches mainline 'tcard.v1' */
var APP_VERSION='1.2-exp.2';
var $=function(id){return document.getElementById(id)};
var state;
var storageOK=true;

/* ---------- utils (same as the 214 / 309) ---------- */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function pad(n){return (n<10?'0':'')+n}
function todayISO(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function nowHM(d){d=d||new Date();return pad(d.getHours())+':'+pad(d.getMinutes())}
function nowP(utc,d){d=d||new Date();return utc?{d:d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate()),t:pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())}:{d:todayISO(d),t:nowHM(d)}}
/* --- inlined from comu-shared/esc.js --- */
/* esc(): the one HTML escaper for every COMU app. Use it on ANY stored or imported value (IDs included) that goes into innerHTML, an attribute or a template string. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

function usDate(iso){if(!iso) return ''; var p=iso.split('-'); return p[1]+'/'+p[2]+'/'+p[0]}
function shortDate(iso){if(!iso) return ''; var p=iso.split('-'); return p[1]+'/'+p[2]}
function utcOn(){return !!state.settings.utc}
function stamp(ts,full){var u=utcOn(),p=nowP(u,new Date(ts));return (full?usDate(p.d):shortDate(p.d))+' '+p.t+(u?'Z':'')}
function toast(msg){var t=$('toast'),dl=$('dlg'); if(dl&&dl.open){if(t.parentNode!==dl)dl.appendChild(t)} else if(t.parentNode!==document.body) document.body.appendChild(t);t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200)}
function download(name,text,type){
  var blob=new Blob([text],{type:type||'text/plain'});
  var url=URL.createObjectURL(blob); var a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},1500);
}
function csvCell(v){v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function csvRows(rows){return '\uFEFF'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n')+'\r\n'}
function clone(o){return JSON.parse(JSON.stringify(o))}

/* --- inlined from comu-shared/cw.js --- */
/* ---------- CW sounds: shared engine for ICS 214, ICS 309 and T-Card (needs state.settings) ---------- */
var MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
var cwCtx=null, cwLast=null;
function cwPitch(){var v=+state.settings.cwPitch;return v>=400&&v<=1000?v:700}
function cwVol(){var v=state.settings.cwVol;v=v==null?0.6:+v;return isFinite(v)?Math.max(0,Math.min(1,v)):0.6}
function cwPlay(word){
  if(!state.settings.cw) return false;
  var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
  try{
    if(!cwCtx) cwCtx=new AC(); if(cwCtx.state==='suspended'&&cwCtx.resume) cwCtx.resume();
    var dot=0.06, t=cwCtx.currentTime+0.03, osc=cwCtx.createOscillator(), g=cwCtx.createGain();
    var hz=cwPitch(), vol=cwVol(); osc.type='sine'; osc.frequency.value=hz; g.gain.setValueAtTime(0,t); osc.connect(g); g.connect(cwCtx.destination);
    var code=String(word).split('').map(function(c){return MORSE[c]||''}).join(' ');
    code.split('').forEach(function(s){
      if(s===' '){t+=dot*2;return}
      var d=s==='-'?dot*3:dot; g.gain.setTargetAtTime(0.4*vol,t,0.004); g.gain.setTargetAtTime(0,t+d,0.004); t+=d+dot;
    });
    osc.start(); osc.stop(t+0.1); cwLast={word:word,code:code,hz:hz,vol:vol,at:Date.now()}; return true;
  }catch(e){return false}
}
/* --- inlined from comu-shared/myinfo.js --- */
/* ---------- Shared My Info: one profile for ICS 214, ICS 309 and T-Card on this device ----------
   Every save also goes to comu.myinfo.v1 with the app that wrote it. On load, an app uses that shared copy
   when another app saved last; when it saved last itself, its own key is current. */
var MYINFO_SHARED_KEY='comu.myinfo.v1', MYINFO_ALL=['name','callsign','position','agency'];
function myinfoShared(){try{var o=JSON.parse(localStorage.getItem(MYINFO_SHARED_KEY)||'null');return o&&typeof o==='object'?o:null}catch(e){return null}}
function myinfoMerge(p,app){var s=myinfoShared(); if(!s||s.by===app) return p; MYINFO_ALL.forEach(function(k){if(typeof s[k]==='string') p[k]=s[k]}); return p}
function myinfoPublish(p,app){try{var o=myinfoShared()||{}; MYINFO_ALL.forEach(function(k){if(typeof p[k]==='string') o[k]=p[k]}); o.by=app; o.updated=Date.now(); localStorage.setItem(MYINFO_SHARED_KEY,JSON.stringify(o))}catch(e){}}
/* ---------- dialogs ---------- */
function dialog(html,buttons){
  return new Promise(function(res){
    var d=$('dlg'); $('dlgBody').innerHTML=html; var b=$('dlgBtns'); b.innerHTML='';
    buttons.forEach(function(x){var e=document.createElement('button');e.type='submit';e.value=x.v;e.textContent=x.t;if(x.cls)e.className=x.cls;if(x.style)e.style.cssText=x.style;b.appendChild(e)});
    d.returnValue='';
    var done=function(){d.removeEventListener('close',done);res(d.returnValue||'cancel')};
    d.addEventListener('close',done);
    if(d.showModal) d.showModal(); else {res(window.confirm($('dlgBody').textContent)?buttons[buttons.length-1].v:'cancel')}
  });
}
function confirmBox(msg,okText){return dialog('<p>'+esc(msg)+'</p>',[{t:'Cancel',v:'cancel'},{t:okText||'Delete',v:'ok',cls:'danger'}]).then(function(v){return v==='ok'})}

/* ---------- colors: the ICS 219 card colors + contrast ---------- */
var PALETTE=[['White','#ffffff','219-5'],['Gray','#c9c9c9','219-1'],['Green','#9ad89a','219-2'],['Rose','#f6b3c3','219-3'],['Blue','#9ccbff','219-4'],['Orange','#ffbf80','219-6'],['Yellow','#fff27a','219-7'],['Tan','#e6cfa3','219-8'],['Lavender','#d3c1f2','219-10']];
function normHex(h){h=String(h||'').trim().toLowerCase(); if(/^#[0-9a-f]{3}$/.test(h)) h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]; return /^#[0-9a-f]{6}$/.test(h)?h:'#ffffff'}
function colorName(h){h=normHex(h); var p=PALETTE.find(function(x){return x[1]===h}); return p?p[0]:h.toUpperCase()}
function inkOn(h){h=normHex(h); var r=parseInt(h.substr(1,2),16)/255,g=parseInt(h.substr(3,2),16)/255,b=parseInt(h.substr(5,2),16)/255;
  var f=function(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}; var L=0.2126*f(r)+0.7152*f(g)+0.0722*f(b); return L>0.22?'#000':'#fff'}

/* ---------- defaults: one category (Comms Equipment) with the comms types ---------- */
var DEF_CATS=[{id:'c_comms',name:'Comms Equipment',color:'#e6cfa3'}];
var DEF_TYPES=[
 ['t_port','Portable radios / radio cache','#fff27a'],['t_mob','Mobile radios','#ffbf80'],['t_base','Base station','#9ccbff'],
 ['t_rptr','Deployable / portable repeater','#9ad89a'],['t_gw','Gateway / interop (patch) device','#d3c1f2'],['t_sat','Satellite (voice / data)','#f6b3c3'],
 ['t_comu','Comms trailer / vehicle (COMU)','#c9c9c9'],['t_ant','Antenna / mast kit','#e6cfa3'],['t_gen','Generator / power','#ffd9a8'],
 ['t_it','IT / network kit','#b8ecec'],['t_oth','Other','#ffffff']].map(function(t){return {id:t[0],catId:'c_comms',name:t[1],color:t[2]}});
var DEF_STAT=[{id:'s_av',name:'Available',color:'#2e7d32'},{id:'s_as',name:'Assigned',color:'#1565c0'},{id:'s_oos',name:'Out of Service',color:'#c62828'},{id:'s_dm',name:'Demob / Returned',color:'#757575'}];
var STAT_CLR=['#2e7d32','#1565c0','#c62828','#757575','#ef6c00','#6a1b9a','#00838f','#5d4037'];

/* ---------- storage ---------- */
function blank(){return {version:1,cards:[],categories:clone(DEF_CATS),types:clone(DEF_TYPES),statuses:clone(DEF_STAT),currentId:null,incident:'',prepName:'',prepPos:'',nextSid:1,map:{img:''},settings:{theme:null,slotIds:true}}}
var CARD_F=['typeId','name','serial','qty','agency','status','location','assignedTo','checkIn','notes'];
function load(){
  try{ var raw=localStorage.getItem(KEY); state=raw?JSON.parse(raw):blank(); }catch(e){ storageOK=false; state=blank(); }
  if(!state||typeof state!=='object') state=blank();
  if(!state.settings) state.settings={};
  if(!Array.isArray(state.categories)) state.categories=clone(DEF_CATS);
  if(!Array.isArray(state.types)) state.types=clone(DEF_TYPES);
  if(!Array.isArray(state.statuses)||!state.statuses.length) state.statuses=clone(DEF_STAT);
  if(!Array.isArray(state.cards)) state.cards=[];
  ['incident','prepName','prepPos'].forEach(function(k){if(typeof state[k]!=='string') state[k]=''});
  state.categories.forEach(function(c){c.color=normHex(c.color);if(!c.id)c.id=uid()});
  state.types.forEach(function(t){t.color=normHex(t.color);if(!t.id)t.id=uid(); if(!catById(t.catId)&&state.categories[0]) t.catId=state.categories[0].id});
  state.statuses.forEach(fixStat);
  if(!state.map||typeof state.map!=='object') state.map={img:''}; if(typeof state.map.img!=='string'||state.map.img.indexOf('data:image/')!==0) state.map.img='';
  if(state.settings.slotIds==null) state.settings.slotIds=true;
  state.cards.forEach(fixCard); ensureSids();
  if(state.settings.egg&&!(state.settings.egg in EGGS)) state.settings.egg='';
}
function fixStat(s,i){if(!s.id)s.id=uid(); s.name=String(s.name||'Status'); if(!s.color){var i=state.statuses.indexOf(s); if(i<0) i=state.statuses.length; s.color=STAT_CLR[i%STAT_CLR.length]} s.color=normHex(s.color); return s}
/* short IDs (T-001...) printed on cards, tiles and every sheet; unique per device */
function ensureSids(){
  var used={}, mx=0;
  state.cards.forEach(function(c){var m=/^T-(\d+)$/.exec(c.sid||''); if(m&&!used[c.sid]){used[c.sid]=1; mx=Math.max(mx,+m[1])} else c.sid=''});
  var n=Math.max(mx+1,+state.nextSid||1);
  state.cards.forEach(function(c){if(!c.sid){while(used['T-'+pad3(n)]) n++; c.sid='T-'+pad3(n); used[c.sid]=1; n++}});
  state.nextSid=n;
}
function pad3(n){n=String(n);return n.length<3?('00'+n).slice(-3):n}
function fixCard(c){
  /* migrate mainline / older data: single 'ident' field -> Name (Serial left blank) */
  if(c.name==null&&c.ident!=null) c.name=c.ident; delete c.ident;
  c.mx=typeof c.mx==='number'&&isFinite(c.mx)?Math.min(1,Math.max(0,c.mx)):null; c.my=typeof c.my==='number'&&isFinite(c.my)?Math.min(1,Math.max(0,c.my)):null; if(c.mx==null||c.my==null){c.mx=null;c.my=null}
  c.sid=typeof c.sid==='string'?c.sid:'';
  CARD_F.forEach(function(k){if(c[k]==null) c[k]=''; c[k]=String(c[k])});
  if(!statById(c.status)) c.status=state.statuses[0].id;
  if(!Array.isArray(c.history)) c.history=[];
  if(!c.id) c.id=uid(); if(!c.created) c.created=Date.now(); if(!c.updated) c.updated=c.created;
  return c;
}
var saveTimer;
function save(now){
  clearTimeout(saveTimer);
  var go=function(){
    try{ localStorage.setItem(KEY,JSON.stringify(state)); }
    catch(e){ storageOK=false; showStorageWarn('Could not save to this browser’s storage ('+e.name+'). Export a JSON backup now.'); }
  };
  if(now) go(); else saveTimer=setTimeout(go,250);
}
window.addEventListener('pagehide',function(){save(true)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save(true)});
function showStorageWarn(msg){var w=$('storageWarn');w.textContent=msg;w.classList.remove('hidden')}
function touch(c){if(c) c.updated=Date.now();save()}
function cur(){return state.cards.find(function(c){return c.id===state.currentId})}
function catById(id){return state.categories.find(function(c){return c.id===id})}
function typeById(id){return state.types.find(function(t){return t.id===id})}
function statById(id){return state.statuses.find(function(s){return s.id===id})}
function typeOf(c){return typeById(c.typeId)}
function catOf(c){var t=typeOf(c);return t?catById(t.catId):null}
function tName(c){var t=typeOf(c);return t?t.name:'(no type)'}
function cName(c){var k=catOf(c);return k?k.name:''}
function tColor(c){var t=typeOf(c);return t?t.color:'#ffffff'}
function cColor(c){var k=catOf(c);return k?k.color:'#999999'}
function sName(id){var s=statById(id);return s?s.name:'(removed status)'}
function sColor(id){var s=statById(id);return s?s.color:'#999999'}
function cardTitle(c){return c.name||(c.serial?'S/N '+c.serial:'(no name)')}
function cardLabel(c){return c.sid+' '+cardTitle(c)}
function lastChange(c){return c.history.length?c.history[c.history.length-1]:null}

/* ---------- theme (bright -> dark -> night -> dark ...) ---------- */
var THEMES=['light','dark','night'];
var THEME_INFO={light:{meta:'#ffffff'},dark:{meta:'#0d0f12'},night:{meta:'#000000'}};
var THEME_NAME={light:'bright mode',dark:'dark mode',night:'night-vision mode'};
var EGGS={waterfall:{name:'Waterfall mode',meta:'#050c24'},qsl:{name:'QSL card mode',meta:'#fffaf0'}};
var EGG_ORDER=['waterfall','qsl'];
function eggOn(){var e=state.settings.egg; return EGGS[e]?e:''}
function applyTheme(){
  var egg=eggOn(), de=document.documentElement;
  de.setAttribute('data-night',state.settings.nightColor==='green'?'green':'red');
  if(egg){
    de.setAttribute('data-theme','light'); de.setAttribute('data-egg',egg);
    var bb=$('btnTheme'); bb.innerHTML='&#10022;'; bb.title='Turn off '+EGGS[egg].name+' and return to the normal theme'; bb.setAttribute('aria-label','Theme: '+EGGS[egg].name+'. Turn off');
    var mm=$('metaTheme'); if(mm) mm.setAttribute('content',EGGS[egg].meta);
    return;
  }
  de.removeAttribute('data-egg');
  var t=state.settings.theme; if(THEMES.indexOf(t)<0) t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
  de.setAttribute('data-theme',t);
  var nx=nextTheme(t,state.settings.themeDir).t, b=$('btnTheme'); b.innerHTML=nx==='night'?'&#9673;':nx==='dark'?'&#9790;':'&#9728;'; b.title='Switch to '+THEME_NAME[nx]; b.setAttribute('aria-label','Theme: '+THEME_NAME[t]+'. Switch to '+THEME_NAME[nx]);
  var m=$('metaTheme'); if(m) m.setAttribute('content',THEME_INFO[t].meta);
}
function nextTheme(c,dir){
  var i=THEMES.indexOf(c); if(i<0) i=0; dir=dir===-1?-1:1;
  if(i===0) dir=1; else if(i===THEMES.length-1) dir=-1;
  return {t:THEMES[i+dir],dir:(i+dir===0)?1:(i+dir===THEMES.length-1)?-1:dir};
}
$('btnTheme').onclick=function(){if(eggOn()){var en=EGGS[eggOn()].name;state.settings.egg='';save();applyTheme();syncEggUI();toast(en+' off');return} var n=nextTheme(document.documentElement.getAttribute('data-theme'),state.settings.themeDir);state.settings.theme=n.t;state.settings.themeDir=n.dir;save();applyTheme()};

/* ---------- views ---------- */
var view='board';
var VIEWS={board:'viewBoard',card:'viewCard',print:'viewPrint',settings:'viewSettings',pace:'viewPace'};
var TITLES={board:'T-Card Tracker',print:'Print T-Cards',settings:'Types & Statuses',pace:'My Info'};
function show(v){
  view=v; Object.keys(VIEWS).forEach(function(k){$(VIEWS[k]).classList.toggle('hidden',k!==v)});
  if(TITLES[v]) $('title').textContent=TITLES[v];
  if(v==='board') renderBoard();
  if(v==='card') renderCard();
  if(v==='print') renderPrintView();
  if(v==='settings') renderSettings();
  if(v==='pace') renderPace();
  renderTicker(); window.scrollTo(0,0); setHdr();
}
function setHdr(){document.documentElement.style.setProperty('--hdr',(document.querySelector('header.bar').offsetHeight)+'px')}
window.addEventListener('resize',setHdr);
$('btnHome').onclick=function(){show('board')};
$('btnPrintView').onclick=function(){show('print')};
$('btnSettings').onclick=function(){show('settings')};
