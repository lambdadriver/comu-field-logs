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
