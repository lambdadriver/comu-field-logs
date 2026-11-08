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
