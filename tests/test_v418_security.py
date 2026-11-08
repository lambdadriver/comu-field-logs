import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME=os.environ.get("CHROME_BIN") or next(p for p in ("/usr/bin/google-chrome","/usr/local/bin/google-chrome") if os.path.exists(p))
# v4.18 / v1.5 / v1.2 checks: malicious imports render as text and never run; 214 print with 40+ resources keeps entry 1.
import json, tempfile, os, copy
from playwright.sync_api import sync_playwright
P='"><img src=x onerror="window.__xss=(window.__xss||0)+1">'   # attribute breakout + tag
fails=[]; res={}
def ok(n,c,info=''):
    res[n]=bool(c); print(('PASS ' if c else 'FAIL ')+n, info if not c else '')
    if not c: fails.append(n)
def jf(o):
    f=tempfile.NamedTemporaryFile('w',suffix='.json',delete=False); json.dump(o,f); f.close(); return f.name
def click(pg,sel):
    pg.evaluate("s=>{var e=document.querySelector(s); if(e) e.click()}",sel); pg.wait_for_timeout(250)
def check(pg,tag,errs):
    x=pg.evaluate("window.__xss||0"); bad=pg.evaluate("document.querySelectorAll('[onerror],img[src=\"x\"]').length")
    ok(tag+'_no_exec',x==0 and bad==0,(x,bad)); 
def shown(pg): return pg.evaluate("document.body.innerText+' '+Array.from(document.querySelectorAll('input,textarea,select option')).map(e=>e.value||e.textContent).join(' ')")
URL={'214':os.path.join(ROOT,'apps','ICS_214_Activity_Log_v4.18.html'),'309':os.path.join(ROOT,'apps','ICS_309_Communications_Log_v1.5.html'),'tc':os.path.join(ROOT,'apps','TCard_Printer_Tracker_v1.2.html')}
def log214():
    return {'logs':[{'id':'L'+P,'incidentName':'Inc '+P,'opFromDate':'2026-10-31','opFromTime':'08:00','name':'Name '+P,'icsPosition':'COMT','homeAgency':'Ag '+P,'activityType':'Type '+P,
      'resources':[{'id':'R'+P,'name':'Res '+P,'position':'Pos '+P,'agency':'RAg '+P}],
      'entries':[{'id':'E'+P,'date':'2026-10-31','time':'08:05','text':'Note '+P,'ts':1}],'updated':1}]}
def log309():
    return {'logs':[{'id':'L'+P,'incidentName':'Inc '+P,'opFromDate':'2026-10-31','opFromTime':'08:00','radioOperator':'Op '+P,'netId':'N'+P,
      'entries':[{'id':'E'+P,'date':'2026-10-31','time':'08:05','from':'F'+P,'to':'T'+P,'text':'Note '+P,'ts':1}],'updated':1}],
      'nets':[{'id':'N'+P,'name':'Net '+P,'channel':'Ch '+P}]}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    def page(k):
        ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.dismiss())
        pg.goto('file://'+URL[k]); pg.wait_for_timeout(300); return pg,errs
    # ---- ICS 214 ----
    pg,errs=page('214'); ok('214_version',pg.evaluate('ICS214.version')=='4.18')
    pg.set_input_files('#fileImport',jf(log214())); pg.wait_for_timeout(400); check(pg,'214_list',errs)
    click(pg,'.item .info'); check(pg,'214_log',errs); t=shown(pg)
    ok('214_text_visible',all(s+P in t for s in ['Note ','Res ']) ,t[:200])
    ok('214_id_roundtrip',pg.evaluate("document.querySelector('#entries .e').dataset.id")=='E'+P)
    click(pg,'#btnHome'); click(pg,'#btnSummary'); check(pg,'214_summary',errs); ok('214_summary_text','Type '+P in shown(pg))
    pg.evaluate("ICS214.buildFormPrint()"); check(pg,'214_print',errs); ok('214_print_text','Note '+P in pg.evaluate("document.getElementById('printRoot').textContent"))
    ok('214_no_js_errors',not errs,errs)
    # 214 print: 40/45/60 resources, first entry must be on a sheet and fully visible
    for nres in (0,8,39,40,45,60):
        L=log214()['logs'][0]; L['id']='big%d'%nres; L['updated']=2
        L['resources']=[{'id':'r%d'%i,'name':'Res %d'%i,'position':'P','agency':'A'} for i in range(nres)]
        L['entries']=[{'id':'e%d'%i,'date':'2026-10-31','time':'09:%02d'%i,'text':'ENTRY-%03d'%i,'ts':i} for i in range(12)]
        pg.evaluate("o=>ICS214.importData(o)",{'logs':[L]}); pg.evaluate("id=>ICS214.buildFormPrint(id)",L['id']); pg.emulate_media(media='print')
        r=pg.evaluate("""()=>{var out={};document.querySelectorAll('#printRoot .acts td:nth-child(2)').forEach(td=>{var m=td.textContent.match(/ENTRY-\\d+/);if(!m)return;
          var w=td.closest('.actwrap').getBoundingClientRect(),c=td.getBoundingClientRect(); out[m[0]]=(out[m[0]]||0)+(c.top>=w.top-0.5&&c.bottom<=w.bottom+0.5?1:0)});
          return {vis:out,pages:document.getElementById('printRoot').dataset.pages}}""")
        pg.emulate_media(media='screen')
        good=all(r['vis'].get('ENTRY-%03d'%i)==1 for i in range(12))
        ok('214_print_%dres_all12_visible_once'%nres,good,r)
    pg.close()
    # ---- ICS 309 ----
    pg,errs=page('309'); ok('309_version',pg.evaluate('ICS309.version')=='1.5')
    pg.set_input_files('#fileImport',jf(log309())); pg.wait_for_timeout(400); check(pg,'309_list',errs)
    click(pg,'.item .info'); check(pg,'309_log',errs); t=shown(pg)
    ok('309_text_visible','Note '+P in t and 'F'+P in t,t[:200])
    ok('309_id_roundtrip',pg.evaluate("document.querySelector('#entries .e').dataset.id")=='E'+P)
    click(pg,'#btnHome'); click(pg,'#btnNets'); check(pg,'309_nets',errs); ok('309_net_text','Net '+P in shown(pg))
    ok('309_net_id_roundtrip',pg.evaluate("(document.querySelector('.net[data-id]')||{dataset:{}}).dataset.id")=='N'+P)
    pg.evaluate("ICS309.buildFormPrint()"); check(pg,'309_print',errs); ok('309_print_text','Note '+P in pg.evaluate("document.getElementById('printRoot').textContent"))
    ok('309_no_js_errors',not errs,errs); pg.close()
    # ---- T-Card ----
    pg,errs=page('tc'); s=json.load(open(os.path.join(ROOT,'tests','fixtures','tcard-sample.json'))); s=copy.deepcopy(s)
    c=s['cards'][0]; c['id']='C'+P; c['ident']='Id '+P; c['notes']='Note '+P; c['assignedTo']='As '+P; c['location']='Loc '+P
    d=pg.evaluate('TCARD.getState()'); s['statuses']=d['statuses']+[{'id':'S'+P,'name':'Stat '+P}]
    s['categories']=d['categories'][:1]; s['categories'][0]=dict(s['categories'][0],name='Cat '+P,color='#ff0000;"'+P)
    s['types']=d['types'][:1]; s['types'][0]=dict(s['types'][0],name='Typ '+P,color='#00ff00"'+P)
    ok('tc_version',pg.evaluate('TCARD.version')=='1.2')
    pg.set_input_files('#fileImport',jf(s)); pg.wait_for_timeout(400); check(pg,'tc_board',errs)
    ok('tc_text_visible','Id '+P in shown(pg),shown(pg)[:200])
    ok('tc_id_roundtrip',pg.evaluate("s=>!!Array.from(document.querySelectorAll('.tile')).find(t=>t.dataset.id===s)",'C'+P))
    pg.evaluate("s=>Array.from(document.querySelectorAll('.tile')).find(t=>t.dataset.id===s).click()",'C'+P); pg.wait_for_timeout(250); check(pg,'tc_status_dialog',errs)
    ok('tc_dialog_text','Loc '+P in shown(pg) and 'Stat '+P in shown(pg))
    pg.evaluate("Array.from(document.querySelectorAll('#dlg button')).find(b=>/Open card/.test(b.textContent)).click()"); pg.wait_for_timeout(250); check(pg,'tc_card',errs)
    ok('tc_card_notes','Note '+P in shown(pg))
    click(pg,'#cDone'); click(pg,'#btnSettings'); check(pg,'tc_settings',errs); ok('tc_settings_text','Cat '+P in shown(pg) or 'Typ '+P in shown(pg))
    click(pg,'#btnPrintView'); click(pg,'#pPrintAll'); check(pg,'tc_print',errs); click(pg,'#pPrintBoard'); check(pg,'tc_board_print',errs)
    ok('tc_no_js_errors',not errs,errs); pg.close()
    b.close()
print('RESULT', 'ALL PASS' if not fails else 'FAILS: '+', '.join(fails), len(res),'checks')
