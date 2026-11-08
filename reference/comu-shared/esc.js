/* esc(): the one HTML escaper for every COMU app. Use it on ANY stored or imported value (IDs included) that goes into innerHTML, an attribute or a template string. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
