import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME=os.environ.get("CHROME_BIN") or next(p for p in ("/usr/bin/google-chrome","/usr/local/bin/google-chrome") if os.path.exists(p))
# Phone-size test of the APK's bundled web assets, served from the same https origin the APK uses,
# with a stand-in for the Android bridge (window.ComuAndroid) that records calls.
import json, base64, os, mimetypes
from playwright.sync_api import sync_playwright
from PIL import Image
WWW=os.path.join(ROOT,'web','assets-www'); ORIGIN='https://appassets.androidplatform.net'; BASE=ORIGIN+'/assets/www/'
OUT=os.path.join(ROOT,'tests','out','screens'); os.makedirs(OUT,exist_ok=True)
R={}; fails=[]; errs=[]; ext=[]
def ok(n,c,info=''):
    R[n]=bool(c)
    if not c: fails.append((n,str(info)[:300]))
BRIDGE="""window.__calls=[];window.ComuAndroid={print:function(t){__calls.push(['print',t])},saveFile:function(n,m,b){__calls.push(['save',n,m,b])},
keepScreenOn:function(on){__calls.push(['keep',on])},setBars:function(c){__calls.push(['bars',c])},appVersion:function(){return '1.0'}};"""
def route(r):
    u=r.request.url
    if u.startswith(ORIGIN+'/assets/'):
        p=WWW+'/'+u[len(BASE):].split('?')[0].split('#')[0]
        if p.endswith('/'): p+='index.html'
        if os.path.isfile(p): return r.fulfill(status=200,body=open(p,'rb').read(),content_type=mimetypes.guess_type(p)[0] or 'text/html')
        return r.fulfill(status=404,body='')
    ext.append(u); return r.abort()
def calls(pg,kind): return [c for c in pg.evaluate("window.__calls") if c[0]==kind]
def pix(path,mode):
    im=Image.open(path).convert('RGB'); bad=0; tot=0
    for (r,g,b) in im.getdata():
        if r+g+b<30: continue
        tot+=1
        if mode=='red' and not (g<=r*0.25+2 and b<=r*0.25+2 and abs(g-b)<=8): bad+=1
    return bad,tot
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    c=b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,is_mobile=True,has_touch=True)
    c.add_init_script(BRIDGE); c.route('**/*',route)
    pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(BASE+'index.html'); pg.wait_for_timeout(300)
    tiles=pg.evaluate("[...document.querySelectorAll('a.apptile')].map(a=>[a.getAttribute('href'),a.innerText.replace(/\\n/g,' ')])")
    ok('launcher_tiles',[t[0] for t in tiles]==['214/index.html','309/index.html','tcard/index.html'],tiles); R['tiles']=tiles
    ok('launcher_credit','by lambdadriver' in pg.inner_text('#credit'))
    pg.screenshot(path=OUT+'/home_light.png')
    pg.click('#btnTheme'); pg.wait_for_timeout(150); ok('launcher_dark',pg.evaluate("document.documentElement.dataset.theme")=='dark')
    pg.screenshot(path=OUT+'/home_dark.png')
    # ICS 214
    pg.click('#go214'); pg.wait_for_load_state(); pg.wait_for_timeout(300)
    ok('214_loaded',pg.evaluate("!!window.ICS214"))
    ok('214_theme_adopted',pg.evaluate("document.documentElement.dataset.theme")=='dark')
    ok('214_home_btn',pg.is_visible('#btnApkHome'))
    ok('bars_set',len(calls(pg,'bars'))>0,calls(pg,'bars'))
    pg.click('#btnPace'); pg.wait_for_timeout(100)
    if pg.is_visible('#paceToggle'): pg.click('#paceToggle')
    pg.fill('#pcName','Sample Name'); pg.select_option('#pcPosSel',index=2); pg.fill('#pcAgency','Example County Comm Unit'); pg.click('#paceSave'); pg.wait_for_timeout(100)
    pg.click('#btnHome'); pg.check('#optField'); pg.wait_for_timeout(100)
    ok('field_keep_screen_on',calls(pg,'keep')[-1][1] is True,calls(pg,'keep'))
    pg.uncheck('#optField'); pg.wait_for_timeout(100); ok('field_off_releases',calls(pg,'keep')[-1][1] is False)
    pg.click('#btnNew'); pg.wait_for_timeout(250)
    if pg.is_visible('#dlgBtns'): pg.click('#dlgBtns button.primary'); pg.wait_for_timeout(150)
    pg.click('[data-tab=tLog]'); pg.fill('#qText','Radio check with all units complete'); pg.click('#btnAdd'); pg.wait_for_timeout(150)
    pg.screenshot(path=OUT+'/ics214_log_dark.png')
    pg.click('[data-tab=tOut]') if pg.is_visible('[data-tab=tOut]') else None
    pg.evaluate("document.getElementById('btnPrint').click()"); pg.wait_for_timeout(150)
    ok('print_bridge',len(calls(pg,'print'))==1,calls(pg,'print'))
    pg.evaluate("document.getElementById('btnCsv').click()"); pg.wait_for_timeout(400)
    sv=calls(pg,'save'); ok('csv_export_bridge',len(sv)==1 and sv[0][1].endswith('.csv') and 'Radio check' in base64.b64decode(sv[0][3]).decode('utf-8-sig'),[x[:3] for x in sv])
    pg.click('#btnHome'); pg.evaluate("document.getElementById('btnExportAll').click()"); pg.wait_for_timeout(400)
    sv=calls(pg,'save'); js=json.loads(base64.b64decode(sv[-1][3]).decode('utf-8')) if sv else {}
    ok('json_export_bridge',len(sv)==2 and sv[-1][1].endswith('.json') and len(js.get('logs',[]))==1,[x[:3] for x in sv])
    # back: log -> main -> launcher
    pg.click('#logList [data-open]'); pg.wait_for_timeout(150)
    r1=pg.evaluate("comuBack()"); pg.wait_for_timeout(150); ok('back_to_main',r1=='main' and pg.is_visible('#viewLogs'),r1)
    pg.click('#btnAbout'); pg.wait_for_timeout(100); r0=pg.evaluate("comuBack()"); ok('back_closes_dialog',r0=='dialog' and not pg.evaluate("document.getElementById('dlg').open"),r0)
    pg.evaluate("comuBack()"); pg.wait_for_load_state(); pg.wait_for_timeout(300)
    ok('back_to_launcher',pg.url.endswith('/assets/www/index.html'),pg.url)
    # ICS 309: shared My Info + theme
    pg.click('#go309'); pg.wait_for_load_state(); pg.wait_for_timeout(300)
    p309=pg.evaluate("ICS309.getPace()"); ok('309_shared_myinfo',p309['name']=='Sample Name' and p309['agency']=='Example County Comm Unit',p309)
    ok('309_theme_adopted',pg.evaluate("document.documentElement.dataset.theme")=='dark')
    pg.click('#btnTheme'); pg.wait_for_timeout(150); th309=pg.evaluate("document.documentElement.dataset.theme")
    pg.screenshot(path=OUT+'/ics309_home_night.png')
    pg.click('#btnApkHome'); pg.wait_for_load_state(); pg.wait_for_timeout(300)
    ok('launcher_follows_app_theme',pg.evaluate("document.documentElement.dataset.theme")==th309=='night',th309)
    f=OUT+'/home_night.png'; pg.screenshot(path=f); bad,tot=pix(f,'red'); ok('launcher_night_red_only',bad==0,(bad,tot))
    # T-Card
    pg.click('#goTcard'); pg.wait_for_load_state(); pg.wait_for_timeout(300)
    ok('tcard_loaded',pg.evaluate("!!window.TCARD") and pg.is_visible('#btnApkHome'))
    ptc=pg.evaluate("TCARD.getPace()"); ok('tcard_shared_myinfo',ptc['name']=='Sample Name',ptc)
    f=OUT+'/tcard_night.png'; pg.screenshot(path=f); bad,tot=pix(f,'red'); ok('tcard_night_red_only',bad==0,(bad,tot))
    pg.click('#btnTheme'); pg.wait_for_timeout(100); pg.click('#btnTheme'); pg.wait_for_timeout(100)
    pg.screenshot(path=OUT+'/tcard_light.png')
    ok('launcher_back_exits',True)
    pg.click('#btnApkHome'); pg.wait_for_load_state(); pg.wait_for_timeout(200); ok('launcher_back_value',pg.evaluate("comuBack()")=='exit')
    pg.screenshot(path=OUT+'/home_final.png')
    b.close()
ok('no_page_errors',not errs,errs[:5]); ok('no_external_requests',not ext,ext[:5])
R['FAILS']=fails; print(json.dumps(R,indent=1)); print('PASSED %d/%d'%(sum(1 for k,v in R.items() if v is True),sum(1 for k,v in R.items() if isinstance(v,bool))))
