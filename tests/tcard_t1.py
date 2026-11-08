import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME=os.environ.get("CHROME_BIN") or next(p for p in ("/usr/bin/google-chrome","/usr/local/bin/google-chrome") if os.path.exists(p))
import json,subprocess,re,sys
from playwright.sync_api import sync_playwright
import pymupdf
from playwright.sync_api import Page as _Pg
_oc=_Pg.click
def _c(self,sel,*a,**k):
    if sel in ('#btnSettings','#btnPrintView','#btnPace','#btnNew','#btnAbout') and not self.is_visible(sel): _oc(self,'#btnHome')
    r=_oc(self,sel,*a,**k)
    if sel.startswith(('#dlgBtns','#dlgBody [data-sid','#btnNew','[data-sdel]')) or 'sdel' in sel: self.wait_for_timeout(120)
    return r
_Pg.click=_c
# v1.1 unify: Backup & Advanced moved to the status board (like the 214/309 home); go there first when needed
def _home_first(fn):
    def w(self,sel,*a,**k):
        try:
            if self.query_selector(sel) and not self.is_visible(sel) and self.evaluate("s=>!!document.querySelector(s).closest('#viewBoard')",sel): _oc(self,'#btnHome')
        except Exception: pass
        return fn(self,sel,*a,**k)
    return w
for _n in ('check','uncheck','select_option','fill'): setattr(_Pg,_n,_home_first(getattr(_Pg,_n)))
OUT=os.path.join(ROOT,'tests','out','tcard'); HTML=os.path.join(ROOT,'apps','TCard_Printer_Tracker_v1.2.html'); URL='file://'+HTML
data=json.load(open(os.path.join(ROOT,'tests','fixtures','tcard-sample.json')))
R={}; errs=[]; reqs=[]; fails=[]
def ok(name,cond,info=''):
    R[name]=bool(cond)
    if not cond: fails.append((name,info))
def hook(pg):
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('request',lambda r: reqs.append(r.url) if not r.url.startswith(('file:','data:','blob:')) else None)
def notoast(pg): pg.evaluate("var t=document.getElementById('toast');t.classList.remove('show')")
def st(pg,js): return pg.evaluate("(()=>{var s=TCARD.getState();return "+js+"})()")
def th(pg): return pg.evaluate("document.documentElement.dataset.theme")
def setth(pg,t):
    for i in range(6):
        if th(pg)==t: return
        pg.click('#btnTheme')
def pix(path,mode):
    from PIL import Image
    im=Image.open(path).convert('RGB'); bad=0; tot=0
    for (r,g,b) in im.getdata():
        if r+g+b<30: continue
        tot+=1
        if mode=='red' and not (g<=r*0.25+2 and b<=r*0.25+2 and abs(g-b)<=8): bad+=1
        if mode=='green' and not (r<=g*0.25+2 and b<=g*0.25+2 and abs(r-b)<=8): bad+=1
    return bad,tot
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1280,'height':900},color_scheme='light',accept_downloads=True); pg=ctx.new_page(); hook(pg)
    pg.goto(URL); pg.wait_for_timeout(200)
    # defaults
    ok('default_one_category',st(pg,"s.categories.map(c=>c.name)")==['Comms Equipment'])
    ok('default_11_types',st(pg,"s.types.length")==11 and st(pg,"s.types.every(t=>t.catId==='c_comms')"))
    ok('default_statuses',st(pg,"s.statuses.map(x=>x.name)")==['Available','Assigned','Out of Service','Demob / Returned'])
    ok('no_cat_filter_with_one_cat',pg.evaluate("!document.querySelector('[data-fbar=board] [data-flt=cat]')"))
    # ---- type CRUD + color persist
    pg.click('#btnSettings'); pg.click('[data-addtype=c_comms]'); pg.fill('#dName','Radio cache (spare)'); pg.click('#dlgBody .pal button[aria-label=Lavender]'); pg.click('#dlgBtns [value=save]')
    tid=st(pg,"s.types.find(t=>t.name==='Radio cache (spare)').id"); ok('type_add',tid and st(pg,"s.types.find(t=>t.id==='%s').color"%tid)=='#d3c1f2')
    pg.click('[data-etype=%s]'%tid); pg.fill('#dName','Spare radio cache'); pg.evaluate("(()=>{var c=document.getElementById('dColor');c.value='#12aa77';c.dispatchEvent(new Event('input'))})()"); pg.click('#dlgBtns [value=save]')
    pg.click('[data-etype=t_mob]'); pg.click('#dlgBody .pal button[aria-label=Green]'); pg.click('#dlgBtns [value=save]')
    pg.reload(); pg.wait_for_timeout(150)
    ok('type_edit_persist',st(pg,"[s.types.find(t=>t.id==='%s').name,s.types.find(t=>t.id==='%s').color,s.types.find(t=>t.id==='t_mob').color]"%(tid,tid))==['Spare radio cache','#12aa77','#9ad89a'])
    pg.click('#btnSettings'); pg.click('[data-etype=%s]'%tid); pg.click('#dlgBtns [value=del]'); pg.wait_for_timeout(100); pg.click('#dlgBtns [value=ok]'); pg.wait_for_timeout(100)
    ok('type_delete',st(pg,"!s.types.some(t=>t.id==='%s')"%tid))
    # ---- category CRUD
    pg.click('#btnAddCat'); pg.fill('#dName','Vehicles'); pg.click('#dlgBody .pal button[aria-label=Blue]'); pg.click('#dlgBtns [value=save]')
    cid=st(pg,"s.categories.find(c=>c.name==='Vehicles').id")
    pg.click('[data-addtype=%s]'%cid); pg.fill('#dName','Pickup'); pg.click('#dlgBtns [value=save]')
    pg.click('[data-ecat=%s]'%cid); pg.fill('#dName','Support Vehicles'); pg.click('#dlgBody .pal button[aria-label=Orange]'); pg.click('#dlgBtns [value=save]')
    pg.reload(); pg.wait_for_timeout(150)
    ok('cat_persist',st(pg,"[s.categories.length,s.categories[1].name,s.categories[1].color,s.types.filter(t=>t.catId===s.categories[1].id).map(t=>t.name)]")==[2,'Support Vehicles','#ffbf80',['Pickup']])
    ok('cat_filter_shows',pg.evaluate("!!document.querySelector('[data-fbar=board] [data-flt=cat]')"))
    # ---- import sample, cards
    pg.evaluate("d=>TCARD.importData(d)",data); pg.reload(); pg.wait_for_timeout(150)
    ok('import_cards',st(pg,"s.cards.length")==11)
    # new card in Vehicles via UI
    pg.select_option('[data-fbar=board] [data-flt=cat]',cid); pg.wait_for_timeout(50)
    pg.click('#btnNew'); pg.fill('#cIdent','TRUCK-2'); pg.fill('#cQty','1'); pg.fill('#cTo','Logistics'); pg.fill('#cAgency','Public Works'); pg.click('#cInNow'); pg.fill('#cNotes','4x4, tow hitch')
    pg.fill('#cLoc','Staging'); pg.press('#cLoc','Tab')
    nid=st(pg,"s.currentId")
    ok('new_card_in_filtered_cat',st(pg,"s.types.find(t=>t.id===s.cards.find(c=>c.id===s.currentId).typeId).catId")==cid)
    pg.select_option('#cStatus','s_as'); pg.wait_for_timeout(100)
    pg.reload(); pg.wait_for_timeout(150)
    c=st(pg,"s.cards.find(c=>c.id==='%s')"%nid)
    ok('card_fields_persist',c['ident']=='TRUCK-2' and c['assignedTo']=='Logistics' and c['notes']=='4x4, tow hitch' and c['status']=='s_as' and re.match(r'\d\d/\d\d \d\d:\d\d',c['checkIn']),c)
    ok('card_history',[h.get('ev') or 'status' for h in c['history']]==['created','moved','status'] and c['history'][-1]['loc']=='Staging',c['history'])
    # filters
    ok('filter_cat',len(pg.evaluate("TCARD.filtered()"))==1)
    pg.select_option('[data-fbar=board] [data-flt=cat]',''); pg.wait_for_timeout(50)
    ok('filter_all',len(pg.evaluate("TCARD.filtered()"))==12)
    pg.select_option('[data-fbar=board] [data-flt=type]','t_port'); ok('filter_type',len(pg.evaluate("TCARD.filtered()"))==2)
    pg.select_option('[data-fbar=board] [data-flt=type]','')
    pg.fill('[data-fbar=board] [data-flt=q]','hilltop'); pg.wait_for_timeout(50); ok('filter_search',sorted(pg.evaluate("TCARD.filtered()"))==['c05','c10'])
    ok('filter_count_text','2 of 12' in pg.inner_text('[data-fbar=board] [data-flt-count]'))
    pg.fill('[data-fbar=board] [data-flt=q]',''); pg.wait_for_timeout(50)
    # counts per status
    counts=pg.evaluate("[...document.querySelectorAll('.col')].map(c=>[c.dataset.sid,+c.querySelector('h3 b').textContent])")
    ok('status_counts',dict(counts)=={'s_av':3,'s_as':7,'s_oos':1,'s_dm':1},counts)
    # tap status change
    pg.click('.tile[data-id=c02]'); pg.fill('#sdLoc','Division B'); pg.click('#dlgBody [data-sid=s_as]'); pg.wait_for_timeout(100)
    c2=st(pg,"s.cards.find(c=>c.id==='c02')"); ok('tap_status',c2['status']=='s_as' and c2['location']=='Division B' and c2['history'][-1]['from']=='s_av')
    ok('ticker','CACHE-B' in pg.inner_text('#lastLine') and 'Assigned' in pg.inner_text('#lastLine'))
    # drag status change
    pg.drag_and_drop('.tile[data-id=c07]','.col[data-sid=s_oos]'); pg.wait_for_timeout(150)
    c7=st(pg,"s.cards.find(c=>c.id==='c07')"); ok('drag_status',c7['status']=='s_oos' and len(c7['history'])==2)
    # statuses editor: add, rename, reorder, delete (cards move)
    pg.click('#btnSettings'); pg.click('#btnAddStat'); pg.keyboard.type('Staged'); pg.wait_for_timeout(300)
    sid=st(pg,"s.statuses[4].id"); ok('status_add',st(pg,"s.statuses[4].name")=='Staged')
    pg.click('.strow[data-sid="%s"] [data-sup]'%sid); ok('status_reorder',st(pg,"s.statuses[3].id")==sid)
    pg.evaluate("TCARD.setStatus('c11','%s','Lot B')"%sid)
    pg.click('.strow[data-sid="%s"] [data-sdel]'%sid); pg.click('#dlgBtns [value=ok]'); pg.wait_for_timeout(100)
    c11=st(pg,"s.cards.find(c=>c.id==='c11')"); ok('status_delete_moves',st(pg,"s.statuses.length")==4 and c11['status']=='s_av' and c11['history'][-1].get('ev')=='status removed')
    pg.click('#btnHome'); ok('board_cols',pg.evaluate("document.querySelectorAll('.col').length")==4)
    # blocked deletes
    pg.click('#btnSettings'); pg.click('[data-ecat=%s]'%cid); pg.click('#dlgBtns [value=del]'); pg.wait_for_timeout(100)
    ok('cat_delete_blocked',st(pg,"s.categories.length")==2 and 'card' in pg.inner_text('#toast'))
    # card delete
    pg.click('#btnHome'); pg.click('.tile[data-id="%s"]'%nid); pg.click('#dlgBtns [value=open]'); pg.click('#cDel'); pg.click('#dlgBtns [value=ok]'); pg.wait_for_timeout(100)
    ok('card_delete',st(pg,"!s.cards.some(c=>c.id==='%s')"%nid))
    pg.click('#btnSettings'); pg.click('[data-ecat=%s]'%cid); pg.click('#dlgBtns [value=del]'); pg.wait_for_timeout(100); pg.click('#dlgBtns [value=ok]'); pg.wait_for_timeout(100)
    ok('cat_delete',st(pg,"s.categories.length")==1 and st(pg,"s.types.length")==11)
    # ---- CW
    pg.check('#optCw'); pg.evaluate("TCARD.setStatus('c02','s_av','Staging')"); ok('cw_R',pg.evaluate("TCARD.cwLast()&&TCARD.cwLast().word")=='R'); pg.uncheck('#optCw')
    # ---- My Info -> prepared by
    pg.click('#btnHome'); pg.click('#btnPace'); pg.fill('#pcName','Test Operator'); pg.select_option('#pcPosSel','COMT - Communications Technician'); pg.fill('#pcAgency','Agency A'); pg.click('#paceSave')
    pg.click('#btnHome'); pg.click('#btnPrintView'); ok('prep_prefill',pg.input_value('#pPrepName')=='Test Operator' and pg.input_value('#pPrepPos').startswith('COMT'))
    ok('incident_imported',pg.input_value('#pIncident')=='Riverside Flood Exercise')
    # ---- screenshots (light)
    pg.click('#btnHome'); notoast(pg); pg.wait_for_timeout(100); pg.screenshot(path=OUT+'/screenshot_status_board.png',full_page=True)
    pg.click('.tile[data-id=c05]'); pg.click('#dlgBtns [value=open]'); notoast(pg); pg.screenshot(path=OUT+'/screenshot_card_editor.png',full_page=True)
    pg.click('#btnSettings'); pg.click('[data-etype=t_rptr]'); pg.wait_for_timeout(100); notoast(pg); pg.screenshot(path=OUT+'/screenshot_type_colors.png')
    pg.click('#dlgBtns [value=cancel]'); notoast(pg); pg.screenshot(path=OUT+'/screenshot_settings.png',full_page=True)
    # ---- print: cards (color)
    pg.click('#btnHome'); pg.click('#btnPrintView'); pg.click('#pSelAll'); ok('sel_all','12' not in pg.inner_text('#pPrintSel') and '(11)' in pg.inner_text('#pPrintSel'))
    pg.click('#pSelNone'); pg.check('[data-sel=c01]'); pg.check('[data-sel=c05]'); pg.check('[data-sel=c09]'); ok('sel_3','(3)' in pg.inner_text('#pPrintSel'))
    pg.evaluate("TCARD.buildCardsPrint(['c01','c05','c09'])")
    dims=pg.evaluate("(()=>{var r=document.querySelector('#printRoot .tside').getBoundingClientRect();return [r.width,r.height,document.querySelectorAll('#printRoot .cm').length,document.querySelectorAll('#printRoot .tpage').length]})()")
    ok('card_dom_size',abs(dims[0]-336)<1 and abs(dims[1]-480)<1 and dims[2]==3*10 and dims[3]==2,dims)
    pg.emulate_media(media='print'); pg.pdf(path='/tmp/tc_color.pdf',format='Letter',prefer_css_page_size=True,print_background=True); pg.emulate_media(media='screen')
    pg.click('[data-pc=bw]'); pg.evaluate("TCARD.buildCardsPrint(['c01','c05','c09'])")
    pg.emulate_media(media='print'); pg.pdf(path='/tmp/tc_bw.pdf',format='Letter',prefer_css_page_size=True,print_background=True); pg.emulate_media(media='screen')
    ok('bw_color_label','CARD COLOR: YELLOW' in pg.evaluate("document.getElementById('printRoot').textContent").upper())
    pg.click('[data-pc=color]')
    pg.evaluate("TCARD.buildBoardPrint()"); pg.emulate_media(media='print'); pg.pdf(path='/tmp/tc_board.pdf',format='Letter',prefer_css_page_size=True,print_background=True); pg.emulate_media(media='screen')
    # ---- exports
    csv=pg.evaluate("TCARD.cardsCSV()"); ok('csv_cards',csv.count('\r\n')==12 and 'CACHE-A' in csv and 'Card color' in csv)
    hcsv=pg.evaluate("TCARD.historyCSV()"); ok('csv_hist',hcsv.count('\r\n')>=25 and 'status removed' in hcsv)
    with pg.expect_download() as dl: pg.evaluate("document.getElementById('btnExportAll').click()")
    dpath='/tmp/tc_backup.json'; dl.value.save_as(dpath); bk=json.load(open(dpath))
    ok('json_backup',len(bk['cards'])==11 and len(bk['types'])==11 and bk['deviceMyInfo']['name']=='Test Operator')
    with pg.expect_download() as dl2: pg.evaluate("document.getElementById('btnCsvCards').click()")
    ok('csv_download',dl2.value.suggested_filename.endswith('.csv'))
    # import into fresh context
    c2x=b.new_context(); p2=c2x.new_page(); hook(p2); p2.goto(URL); p2.set_input_files('#fileImport',dpath); p2.wait_for_timeout(300)
    ok('json_import_roundtrip',p2.evaluate("TCARD.getState().cards.length")==11 and p2.evaluate("TCARD.getState().cards.find(c=>c.id==='c05').history.length")==3)
    c2x.close()
    # ---- theme cycle + night pixels
    seq=[th(pg)]
    for k in range(4): pg.click('#btnTheme'); seq.append(th(pg))
    ok('theme_cycle',seq==['light','dark','night','dark','light'],seq)
    pg.click('#btnHome'); setth(pg,'night'); pg.reload(); pg.wait_for_timeout(200); ok('night_persist',th(pg)=='night')
    shots=[]
    for color in ['red','green']:
        pg.click('#btnSettings'); pg.select_option('#optNightColor',color); pg.wait_for_timeout(100)
        for v in ['board','settings','print','card']:
            if v=='board': pg.click('#btnHome')
            elif v=='settings': pg.click('#btnSettings')
            elif v=='print': pg.click('#btnHome'); pg.click('#btnPrintView')
            else: pg.click('#btnHome'); pg.click('.tile[data-id=c01]'); pg.click('#dlgBtns [value=open]')
            notoast(pg); pg.wait_for_timeout(150); f='/tmp/n_%s_%s.png'%(color,v); pg.screenshot(path=f,full_page=True); shots.append(f)
            bad,tot=pix(f,color); ok('night_%s_%s'%(color,v),bad==0 and tot>500,(bad,tot))
        pg.click('#btnSettings'); pg.click('[data-etype=t_port]'); pg.wait_for_timeout(100); f='/tmp/n_%s_dialog.png'%color; pg.screenshot(path=f); bad,tot=pix(f,color); ok('night_%s_typedialog'%color,bad==0,(bad,tot)); pg.click('#dlgBtns [value=cancel]')
    # print in night == print in light (night must not leak into print)
    pg.evaluate("TCARD.buildBoardPrint()"); pg.emulate_media(media='print'); pg.pdf(path='/tmp/tc_board_night.pdf',format='Letter',prefer_css_page_size=True,print_background=True); pg.emulate_media(media='screen')
    pg.select_option('#optNightColor','red'); setth(pg,'light')
    # ---- easter eggs
    pg.click('#btnHome'); pg.click('#btnAbout')
    ok('about','lambdadriver' in pg.inner_text('#dlgBody'))
    for i in range(7): pg.click('#aboutVer')
    ok('egg_unlock',pg.is_visible('#eggMenu') and pg.evaluate("document.querySelectorAll('#eggMenu input[data-egg]').length")==2)
    pg.check('#egg_waterfall'); ok('egg_waterfall',pg.evaluate("document.documentElement.dataset.egg")=='waterfall'); pg.click('#dlgBtns [value=ok]'); notoast(pg); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'/screenshot_egg_waterfall.png')
    pg.click('#btnAbout'); pg.check('#egg_qsl'); ok('egg_qsl',pg.evaluate("document.documentElement.dataset.egg")=='qsl'); pg.click('#dlgBtns [value=ok]'); notoast(pg); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'/screenshot_egg_qsl.png')
    pg.evaluate("TCARD.buildCardsPrint(['c01'])"); pg.emulate_media(media='print'); pg.pdf(path='/tmp/tc_egg.pdf',format='Letter',prefer_css_page_size=True,print_background=True); pg.emulate_media(media='screen')
    pg.click('#btnTheme'); ok('egg_off_by_theme',pg.evaluate("!document.documentElement.dataset.egg"))
    # phone + field mode
    ph=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True); pp=ph.new_page(); hook(pp); pp.goto(URL); pp.evaluate("d=>TCARD.importData(d)",data); pp.wait_for_timeout(200)
    pp.screenshot(path='/tmp/phone_board.png'); sw=pp.evaluate("document.documentElement.scrollWidth"); ok('phone_no_hscroll',sw<=390,sw)
    pp.tap('.tile[data-id=c02]'); pp.tap('#dlgBody [data-sid=s_oos]'); pp.wait_for_timeout(100); ok('phone_tap_status',pp.evaluate("TCARD.getState().cards.find(c=>c.id==='c02').status")=='s_oos')
    ph.close()
    b.close()
# pdf checks
def rects(path):
    d=pymupdf.open(path); out=[]
    for pgn in d:
        rs=[]; ln=0
        for dr in pgn.get_drawings():
            r=dr['rect']
            if abs(r.width-252)<2 and abs(r.height-360)<2: rs.append(r)
            if (abs(r.width-21.6)<1.5 and r.height<2) or (abs(r.height-8.64)<1.5 and r.width<2): ln+=1
        out.append((round(pgn.rect.width),round(pgn.rect.height),len(rs),ln))
    return out,d
rc,d=rects('/tmp/tc_color.pdf'); print('pdf cards',rc)
ok('pdf_letter_2pages',len(rc)==2 and all(x[0]==612 and x[1]==792 for x in rc))
txt=''.join(pg_.get_text() for pg_ in d)
ok('pdf_text','CACHE-A' in txt and 'STATUS HISTORY' in txt.upper() and 'Prepared by: Test Operator' in txt and 'Low power alarm' in txt)
# render & sample background color of first front (yellow), and BW white
subprocess.run(['pdftoppm','-r','50','-png','-f','1','-l','1','/tmp/tc_color.pdf','/tmp/tcc'],check=True)
subprocess.run(['pdftoppm','-r','50','-png','-f','1','-l','1','/tmp/tc_bw.pdf','/tmp/tcb'],check=True)
from PIL import Image
import glob
ci=Image.open(sorted(glob.glob('/tmp/tcc*.png'))[0]).convert('RGB'); bi=Image.open(sorted(glob.glob('/tmp/tcb*.png'))[0]).convert('RGB')
# point inside front card near bottom-left of first pair: x=(0.2+0.55+0.2)in, y=(0.2+0.2+4.5)in at 50dpi
pt=(int(0.95*50),int(4.7*50)); R['color_px']=ci.getpixel(pt); R['bw_px']=bi.getpixel(pt)
ok('pdf_color_fill',ci.getpixel(pt)[2]<160 and ci.getpixel(pt)[0]>230,ci.getpixel(pt)); ok('pdf_bw_white',bi.getpixel(pt)==(255,255,255),bi.getpixel(pt))
dd=pymupdf.open('/tmp/tc_board.pdf'); bt=''.join(x.get_text() for x in dd)
ok('board_pdf','T-Card Status Board' in bt and 'Test Operator' in bt and 'Date/Time prepared' in bt and 'Out of Service' in bt and 'Riverside Flood Exercise' in bt)
ok('board_night_same',open('/tmp/tc_board.pdf','rb').read()!=b'' and pymupdf.open('/tmp/tc_board_night.pdf')[0].get_pixmap(dpi=40).samples==pymupdf.open('/tmp/tc_board.pdf')[0].get_pixmap(dpi=40).samples)
subprocess.run(['pdftoppm','-r','110','-png','-f','1','-l','1','/tmp/tc_color.pdf',OUT+'/print_preview'],check=True)
subprocess.run(['pdftoppm','-r','80','-png','-f','1','-l','1','/tmp/tc_board.pdf','/tmp/board_sheet'],check=True)
# name scan
h=open(HTML).read()
bad=[w for w in ['gmail.com','/workspace/','keystore','.storepass'] if w.lower() in h.lower()]
ok('name_scan',not bad,bad)
ok('csp','connect-src \'none\'' in h)
ok('no_console_errors',not errs,errs[:5]); ok('no_network',not reqs,reqs[:5])
print(json.dumps(R,indent=0,default=str)); print('FAILS',fails); print('PASSED %d/%d'%(sum(1 for k,v in R.items() if v is True),sum(1 for v in R.values() if isinstance(v,bool))))
