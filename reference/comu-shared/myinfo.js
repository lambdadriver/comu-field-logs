/* ---------- Shared My Info: one profile for ICS 214, ICS 309 and T-Card on this device ----------
   Every save also goes to comu.myinfo.v1 with the app that wrote it. On load, an app uses that shared copy
   when another app saved last; when it saved last itself, its own key is current. */
var MYINFO_SHARED_KEY='comu.myinfo.v1', MYINFO_ALL=['name','callsign','position','agency'];
function myinfoShared(){try{var o=JSON.parse(localStorage.getItem(MYINFO_SHARED_KEY)||'null');return o&&typeof o==='object'?o:null}catch(e){return null}}
function myinfoMerge(p,app){var s=myinfoShared(); if(!s||s.by===app) return p; MYINFO_ALL.forEach(function(k){if(typeof s[k]==='string') p[k]=s[k]}); return p}
function myinfoPublish(p,app){try{var o=myinfoShared()||{}; MYINFO_ALL.forEach(function(k){if(typeof p[k]==='string') o[k]=p[k]}); o.by=app; o.updated=Date.now(); localStorage.setItem(MYINFO_SHARED_KEY,JSON.stringify(o))}catch(e){}}
