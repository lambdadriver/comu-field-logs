import json,sys,os,pymupdf
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
OUT=os.path.join(HERE,'out'); os.makedirs(OUT, exist_ok=True)
HTML=os.path.join(ROOT,'TCard_Tracker_v1.2-exp.2.html')
URL='file://'+HTML
main=json.load(open(os.path.join(HERE,'sample.json')))
CHROME=os.environ.get('CHROME_BIN') or next(p for p in ('/usr/bin/google-chrome','/usr/local/bin/google-chrome') if os.path.exists(p))
MAP=os.path.join(HERE,'map.png')
R={}; errs=[]; reqs=[]
def ok(n,c,info=''):
    R[n]=bool(c); print(('PASS ' if c else 'FAIL ')+n+('' if c else ' :: '+str(info)))
def hook(pg):
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('request',lambda r: reqs.append(r.url) if not r.url.startswith(('file:','data:','blob:')) else None)
def st(pg): return pg.evaluate("TCARD.getState()")
def center(pg,sel):
    b=pg.locator(sel).first.bounding_box(); return b['x']+b['width']/2,b['y']+b['height']/2
with sync_playwright() as p:
    br=p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    ctx=br.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page(); hook(pg)
    # mainline data present on same device must not be touched
    pg.goto(URL); pg.evaluate("localStorage.setItem('tcard.v1','MAINLINE-SENTINEL')"); pg.reload(); pg.wait_for_timeout(300)
    ok('version shown', pg.evaluate("TCARD.version")=='1.2-exp.2' and 'v1.2-exp.2' in pg.inner_text('header') and '1.2-exp.2' in pg.inner_text('#credit'))
    # 1 name/serial via UI
    pg.click('#btnNew'); pg.fill('#cName','Portable cache A'); pg.fill('#cSerial','SN-55&<x>'); pg.wait_for_timeout(400); pg.click('#cDone')
    c=st(pg)['cards'][0]; ok('name/serial separate fields', c['name']=='Portable cache A' and c['serial']=='SN-55&<x>' and c['sid']=='T-001' and 'ident' not in c, c)
    ok('tile shows sid/name/serial', 'T-001' in pg.inner_text('#board') and 'S/N SN-55&<x>' in pg.inner_text('#board'))
    pg.evaluate("TCARD.setQuery('SN-55')"); ok('search by serial', len(pg.evaluate("TCARD.filtered()"))==1)
    pg.evaluate("TCARD.setQuery('T-001')"); ok('search by short ID', len(pg.evaluate("TCARD.filtered()"))==1); pg.evaluate("TCARD.setQuery('')")
    bk=pg.evaluate("TCARD.backup()")
    ok('export has name/serial/sid + mainline ident', bk['cards'][0]['name']=='Portable cache A' and bk['cards'][0]['serial']=='SN-55&<x>' and bk['cards'][0]['ident']=='Portable cache A S/N SN-55&<x>' and bk['cards'][0]['sid']=='T-001')
    # 2 old (mainline) data import
    pg.evaluate("d=>TCARD.importData(d)",main); pg.wait_for_timeout(200); s=st(pg)
    mc=[x for x in s['cards'] if x['id']==main['cards'][0]['id']][0]
    ok('mainline import: ident->Name, serial blank', mc['name']=='CACHE-A' and mc['serial']=='' and 'ident' not in mc, mc)
    sids=[x['sid'] for x in s['cards']]; ok('short IDs unique after import', len(set(sids))==len(sids)==12, sids)
    ok('mainline key untouched', pg.evaluate("localStorage.getItem('tcard.v1')")=='MAINLINE-SENTINEL' and pg.evaluate("!!localStorage.getItem('tcard.exp1.v1')"))
    # round trip exp backup into fresh device
    bk=pg.evaluate("TCARD.backup()")
    ctx2=br.new_context(); p2=ctx2.new_page(); hook(p2); p2.goto(URL); p2.wait_for_timeout(200); p2.evaluate("d=>TCARD.importData(d)",bk)
    s2=st(p2); a={x['id']:(x['name'],x['serial'],x['sid']) for x in s2['cards']}; b={x['id']:(x['name'],x['serial'],x['sid']) for x in s['cards']}
    ok('export->import round trip (name/serial/sid)', a==b)
    ctx2.close()
    # 3 mouse drag across columns
    pg.click('#btnHome'); pg.wait_for_timeout(100)
    cid=main['cards'][0]['id']; before=[x for x in st(pg)['cards'] if x['id']==cid][0]['status']
    target='s_oos' if before!='s_oos' else 's_av'
    x0,y0=center(pg,'#board .tile[data-id="%s"]'%cid); x1,y1=center(pg,'#board .col[data-sid="%s"] h3'%target)
    pg.mouse.move(x0,y0); pg.mouse.down(); pg.mouse.move(x0+20,y0+10,steps=3); pg.mouse.move(x1,y1+30,steps=8)
    ok('drop target highlighted', pg.evaluate("s=>document.querySelector('#board .col[data-sid=\"'+s+'\"]').classList.contains('over')",target) and pg.locator('.dghost').count()==1)
    pg.screenshot(path=OUT+'/shot_drag_mouse.png')
    pg.mouse.up(); pg.wait_for_timeout(200)
    cc=[x for x in st(pg)['cards'] if x['id']==cid][0]
    ok('mouse drag changes status + history', cc['status']==target and cc['history'][-1]['to']==target and pg.locator('#dlg[open]').count()==0)
    # 4 touch drag (CDP touch events -> pointer events) via grip
    cdp=ctx.new_cdp_session(pg)
    cid2=main['cards'][1]['id']; b2=[x for x in st(pg)['cards'] if x['id']==cid2][0]['status']; t2='s_dm' if b2!='s_dm' else 's_av'
    # quick swipe on a tile must NOT drag (scroll gesture)
    x0,y0=center(pg,'#board .tile[data-id="%s"] .tl2'%cid2); x1,y1=center(pg,'#board .col[data-sid="%s"] h3'%t2)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0}]})
    for i in range(1,6): cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0,'y':y0-30*i}]}); pg.wait_for_timeout(10)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); pg.wait_for_timeout(450)
    ok('touch quick swipe does not drag', [x for x in st(pg)['cards'] if x['id']==cid2][0]['status']==b2 and pg.locator('.dghost').count()==0)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(50)
    x0,y0=center(pg,'#board .tile[data-id="%s"] .tl2'%cid2); x1,y1=center(pg,'#board .col[data-sid="%s"] h3'%t2)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0}]}); pg.wait_for_timeout(400)
    ok('touch hold arms drag (held outline)', pg.locator('#board .tile.held').count()==1)
    for i in range(1,11): cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+(x1-x0)*i/10,'y':y0+(y1+30-y0)*i/10}]}); pg.wait_for_timeout(15)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); pg.wait_for_timeout(250)
    cc=[x for x in st(pg)['cards'] if x['id']==cid2][0]; ok('touch press-and-hold drag (tile body) changes status', cc['status']==t2, (b2,cc['status']))
    # tap still opens status dialog
    pg.wait_for_timeout(450); pg.click('#board .tile[data-id="%s"] .tl2'%cid2); pg.wait_for_timeout(150); ok('click tile opens status dialog', pg.locator('#dlg[open]').count()==1); pg.click('#dlgBtns [value=close]'); pg.wait_for_timeout(150)
    pg.screenshot(path=OUT+'/shot_board_columns.png',full_page=True)
    # 5 map
    pg.click('[data-bv=map]'); pg.set_input_files('#fileMap', MAP); pg.wait_for_timeout(600)
    ok('map image stored as data URL', st(pg)['map']['img'].startswith('data:image/jpeg'))
    cid3=main['cards'][2]['id']
    pg.locator('#mapTray .tile[data-id="%s"]'%cid3).scroll_into_view_if_needed()
    x0,y0=center(pg,'#mapTray .tile[data-id="%s"]'%cid3); mb=pg.locator('#mapArea').bounding_box()
    # mapArea may be off-screen after scrolling; drag with auto-scroll is unreliable, so scroll so both visible
    pg.evaluate("window.scrollTo(0,document.getElementById('mapArea').getBoundingClientRect().top+scrollY-80)"); pg.wait_for_timeout(100)
    x0,y0=center(pg,'#mapTray .tile[data-id="%s"]'%cid3); mb=pg.locator('#mapArea').bounding_box()
    tx,ty=mb['x']+mb['width']*0.4,mb['y']+min(mb['height']*0.45,500)
    vis=y0<900
    if not vis: pg.set_viewport_size({'width':1280,'height':1600}); pg.wait_for_timeout(100); x0,y0=center(pg,'#mapTray .tile[data-id="%s"]'%cid3); mb=pg.locator('#mapArea').bounding_box(); tx,ty=mb['x']+mb['width']*0.4,mb['y']+mb['height']*0.45
    pg.mouse.move(x0,y0); pg.mouse.down(); pg.mouse.move(x0+15,y0-10,steps=3); pg.mouse.move(tx,ty,steps=10); pg.mouse.up(); pg.wait_for_timeout(300)
    cc=[x for x in st(pg)['cards'] if x['id']==cid3][0]
    exp_fx=(tx-mb['x'])/mb['width']; exp_fy=(ty-mb['y'])/mb['height']
    ok('mouse drag onto map sets x/y', cc['mx'] is not None and abs(cc['mx']-exp_fx)<0.01 and abs(cc['my']-exp_fy)<0.01, (cc['mx'],cc['my'],exp_fx,exp_fy))
    # touch place a second card on map via grip
    cid4=main['cards'][3]['id']; x0,y0=center(pg,'#mapTray .tile[data-id="%s"] .tl1'%cid4); tx2,ty2=mb['x']+mb['width']*0.75,mb['y']+mb['height']*0.7
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0}]}); pg.wait_for_timeout(400)
    for i in range(1,11): cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+(tx2-x0)*i/10,'y':y0+(ty2-y0)*i/10}]}); pg.wait_for_timeout(15)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); pg.wait_for_timeout(300)
    cc4=[x for x in st(pg)['cards'] if x['id']==cid4][0]; ok('touch press-and-hold onto map sets x/y', cc4['mx'] is not None and abs(cc4['mx']-0.75)<0.02, (cc4['mx'],cc4['my']))
    pg.screenshot(path=OUT+'/shot_board_map.png',full_page=True)
    pg.reload(); pg.wait_for_timeout(400)
    cc=[x for x in st(pg)['cards'] if x['id']==cid3][0]
    ok('map placement + map view persist after reload', cc['mx'] is not None and abs(cc['mx']-exp_fx)<0.01 and pg.is_visible('#mapWrap') and pg.locator('#mapArea .mk').count()==2 and st(pg)['map']['img'].startswith('data:image/'))
    bk=pg.evaluate("TCARD.backup()"); e3=[x for x in bk['cards'] if x['id']==cid3][0]
    ctx3=br.new_context(); p3=ctx3.new_page(); hook(p3); p3.goto(URL); p3.wait_for_timeout(200); p3.evaluate("d=>TCARD.importData(d)",bk)
    s3=st(p3); i3=[x for x in s3['cards'] if x['id']==cid3][0]
    ok('x/y + map image round-trip through export', i3['mx']==e3['mx'] and i3['my']==e3['my'] and s3['map']['img']==bk['map']['img'])
    ctx3.close()
    # drag marker back to tray
    mx0,my0=center(pg,'#mapArea .mk[data-id="%s"]'%cid4); tb=pg.locator('#mapTray').bounding_box()
    pg.mouse.move(mx0,my0); pg.mouse.down(); pg.mouse.move(mx0+10,my0+10,steps=2); pg.mouse.move(tb['x']+tb['width']-30,tb['y']+tb['height']/2,steps=10); pg.mouse.up(); pg.wait_for_timeout(250)
    ok('marker dragged to tray is unplaced', [x for x in st(pg)['cards'] if x['id']==cid4][0]['mx'] is None)
    # 6 escaping
    evil={'cards':[{'id':'evil1','name':'<img src=x onerror="window.__x=1">','serial':'"><script>window.__x=2</script>','typeId':'t_port','status':'s_as','location':'<b onmouseover=window.__x=3>L</b>','notes':'<svg onload=window.__x=4>','mx':0.2,'my':0.2,'sid':'<i>T-9</i>','history':[]}],
          'statuses':[{'id':'s_as','name':'Assigned<img src=x onerror=window.__x=5>','color':'red;background:url(x)'}],'incident':'<img src=x onerror=window.__x=6>'}
    pg.evaluate("d=>TCARD.importData(d)",evil); pg.wait_for_timeout(200)
    pg.evaluate("TCARD.render()"); pg.click('[data-bv=cols]'); pg.wait_for_timeout(100)
    for k in ['bc','sm','tc']:
        pg.evaluate("k=>{TCARD.getState().settings.cardSize=k}",k)
        for fn in ['buildCardsPrint()','buildBoardPrint()','buildSlotsPrint()','buildMapPrint()']: pg.evaluate("TCARD."+fn); pg.wait_for_timeout(60)
    ev=[x for x in st(pg)['cards'] if x['id']=='evil1'][0]
    ok('escaping holds (board, map, all prints x 3 card sizes)', pg.evaluate("window.__x")is None and pg.locator('#board img, #mapArea .mk img, #printRoot script, #printRoot svg').count()==0 and ev['sid'].startswith('T-') and st(pg)['statuses'][1]['color']=='#ffffff', (pg.evaluate("window.__x"),ev['sid']))
    # remove evil card for clean previews
    pg.evaluate("()=>{var s=TCARD.getState(); s.cards=s.cards.filter(c=>c.id!=='evil1'); var a=s.statuses.find(x=>x.id==='s_as'); a.name='Assigned'; a.color='#1565c0'; s.incident='Exercise demo'}"); pg.evaluate("TCARD.render()")
    # 7 print layouts -> PDF + PNG
    pg.emulate_media(media='print')
    def pdf(fn,name):
        pg.evaluate("TCARD."+fn); pg.wait_for_timeout(200)
        pg.pdf(path=OUT+'/'+name+'.pdf',format='Letter',prefer_css_page_size=True,print_background=True)
        d=pymupdf.open(OUT+'/'+name+'.pdf'); n=len(d)
        for i in range(min(n,2)): d[i].get_pixmap(dpi=60).save(OUT+'/%s_p%d.png'%(name,i+1))
        return d
    W={'bc':(336,192,30.72),'sm':(240,144,24.96),'tc':(336,480,28.8)}
    for k in ['bc','sm','tc']:
        pg.evaluate("k=>{TCARD.getState().settings.cardSize=k}",k)
        d=pdf('buildCardsPrint()','preview_cards_'+k); t=''.join(x.get_text() for x in d)
        if k!='tc':
            cs=pg.evaluate("[...document.querySelectorAll('#printRoot .scard')].map(e=>{var r=e.getBoundingClientRect(),s=e.querySelector('.ss').getBoundingClientRect();return [r.width,r.height,s.height]})")
            per=10 if k=='bc' else 18
            ok('cards %s: %d per Letter sheet, size, front only, cut marks'%(k,per), len(d)==-(-12//per) and pg.evaluate("document.querySelector('#printRoot .cpage').querySelectorAll('.scard').length")==min(12,per) and all(abs(c[0]-W[k][0])<.5 and abs(c[1]-W[k][1])<.5 for c in cs) and pg.locator('#printRoot .back').count()==0 and pg.locator('#printRoot .cm').count()>0, (len(d),cs[:1]))
            ok('cards %s: ID/name/serial/type + blank status box (no printed status)'%k, 'T-001' in t and 'CACHE-A' in t and 'S/N' in t and 'Portable radios' in t and 'STATUS' in t.upper() and 'Out of Service' not in t and 'Assigned' not in t)
        else:
            ok('cards tc: 3.5x5 front+back still works, blank status box', len(d)==6 and pg.locator('#printRoot .back').count()==12 and pg.evaluate("[...document.querySelectorAll('#printRoot .front .tc-st')].every(e=>e.innerText.trim().toUpperCase()==='STATUS')"))
        d=pdf('buildSlotsPrint()','preview_board_'+k)
        sl=pg.evaluate("[...document.querySelectorAll('#printRoot .scol')][0] ? [...document.querySelectorAll('#printRoot .scol')[0].querySelectorAll('.slot')].map(e=>{var r=e.getBoundingClientRect();return [r.width,r.height]}) : []")
        ok('board %s: rack strips = card strip, bottom slot = full card, width = card'%k, len(sl)>2 and all(abs(x[0]-W[k][0])<.5 for x in sl) and all(abs(x[1]-W[k][2])<.5 for x in sl[:-1]) and abs(sl[-1][1]-W[k][1])<.5 and 'T-0' in d[0].get_text(), (sl[:2],sl[-1:],len(sl)))
        print('   %s: %d slots/column/sheet, %d sheets'%(k,len(sl),len(d)))
    pg.evaluate("k=>{TCARD.getState().settings.cardSize='bc'}",'bc')
    pg.evaluate("TCARD.getState().settings.slotIds=false")
    pg.evaluate("TCARD.buildSlotsPrint()"); ok('board blank mode (no IDs)', 'T-0' not in pg.inner_text('#printRoot')); pg.evaluate("TCARD.getState().settings.slotIds=true")
    d=pdf('buildBoardPrint()','preview_status_list'); ok('status list lists short ID + name', 'T-001' in d[0].get_text() and 'CACHE-A' in d[0].get_text())
    d=pdf('buildMapPrint()','preview_map'); t=d[0].get_text(); ok('map print: background + numbered pins + key', len(d[0].get_images())>=1 and pg.locator('#printRoot .pin').count()==1 and 'T-0' in t)
    pg.emulate_media(media='screen')
    # phone viewport smoke
    pg.set_viewport_size({'width':390,'height':844}); pg.click('[data-bv=cols]'); pg.wait_for_timeout(150); pg.screenshot(path=OUT+'/shot_phone_columns.png')
ok('no console errors', not errs, errs); ok('no network requests', not reqs, reqs)
print(sum(R.values()),'/',len(R))
