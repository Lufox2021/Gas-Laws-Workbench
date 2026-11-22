# python3 test/browser_test.py — drives every problem through Coaching, plus Testing and the Gas Lab
import pathlib, sys, json
from playwright.sync_api import sync_playwright
url = pathlib.Path('index.html').resolve().as_uri()
errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width':1200,'height':900})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(url)
    pg.screenshot(path='/tmp/shot_review.png', full_page=True)
    ids = pg.evaluate('PROBLEMS.map(p=>p.id)')
    pg.click('nav button[data-tab=coach]')
    for pid in ids:
        pg.select_option('#c-prob', pid)
        if pg.query_selector('#d-check'):
            for hb in pg.query_selector_all('#dec .hbtn'): hb.click()
            pg.click('#d-check')               # wrong (empty) → marks
            pg.click('#d-check'); pg.click('#d-check')
            pg.click('#d-showbtn')
        steps = pg.evaluate(f'stepsFor(PROBLEMS.find(p=>p.id=="{pid}")).map(s=>s.choice? s.ans : String(s.ans))')
        for a in steps:
            pg.click('#s-hintbtn')
            if not pg.query_selector('#s-hint .hint'): errs.append('no step hint ' + pid)
            el = pg.query_selector('#s-in')
            if el.evaluate('e=>e.tagName') == 'SELECT': pg.select_option('#s-in', a)
            else: el.fill(a)
            pg.click('#s-check')
        if not pg.query_selector('#c-sum .summary'): errs.append('no summary for ' + pid)
        if pid in ('t11','m1','o8','d4','s7','r1'): pg.screenshot(path=f'/tmp/shot_{pid}.png', full_page=True)
    # a diagnosis check on t4: Celsius answer
    pg.select_option('#c-prob', 't4'); pg.click('#d-check'); pg.click('#d-check'); pg.click('#d-check'); pg.click('#d-showbtn')
    pg.fill('#s-in', '25'); pg.click('#s-check')
    print('t4 diag:', pg.inner_text('#s-fb')[:90])
    # Testing
    pg.click('nav button[data-tab=test]')
    for i in range(6):
        pg.click('#t-new')
        pid = pg.evaluate('T.p.id')
        f = pg.evaluate('String(T.S[T.S.finalIndex].ans)')
        while pg.is_enabled('#t-hintbtn'): pg.click('#t-hintbtn')
        if len(pg.query_selector_all('#t-hints li')) != pg.evaluate('T.S.length'): errs.append('test hints ' + pid)
        pg.fill('#t-in', '1'); pg.click('#t-check')
        pg.fill('#t-in', f); pg.click('#t-check')
        if 'Correct' not in pg.inner_text('#t-fb'): errs.append('test fail ' + pid)
    print('score:', pg.inner_text('#t-score'))
    # Gas Lab
    pg.click('nav button[data-tab=lab]')
    for v in (0.5, 1.0, 2.0, 3.0): pg.evaluate(f'labMove("P",{v})')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/shot_lab1.png', full_page=True)
    pg.click('.lhold[value=V]')   # hold n? held was n,T → now T,V
    print('held after click:', pg.evaluate('L.held'), 'change', pg.evaluate('L.change'), 'resp', pg.evaluate('labResp()'))
    pg.click('.lhold[value=n]')   # back to V,n
    pg.click('.lchg[value=T]')
    for v in (200, 350, 500, 650): pg.evaluate(f'labMove("T",{v})')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/shot_lab2.png', full_page=True)
    print('law:', pg.inner_text('#lab-law'))
    # Instructor: template download box, upload with one bad row, try in browser, problems.json
    pg.click('nav button[data-tab=inst]')
    pg.click('#i-tmpl')
    pg.click('#i-out .i-show'); tmpl = pg.input_value('#i-out textarea')
    lines = tmpl.split('\r\n')
    cols = pg.evaluate('PROBLEM_COLS')
    def row(d): return ','.join(d.get(c, '') for c in cols)
    lines.append(row({'id':'bad1','problem_type':'3','solver':'one','find':'P','V':'2.0 L','T':'25 C'}))
    lines.append(row({'id':'up1','problem_type':'4','solver':'stoich','sub':'V2V','V':'10.0 L','known':'H2','target':'NH3','rxn':'N2 + 3 H2 -> 2 NH3'}))
    csv = '\r\n'.join(lines)
    pathlib.Path('/tmp/upload.csv').write_text(csv)
    pg.set_input_files('#i-file', '/tmp/upload.csv')
    pg.wait_for_timeout(300)
    print('upload:', pg.inner_text('#i-res p'))
    n0 = pg.evaluate('ACTIVE.length')
    pg.click('#i-try')
    print('active before/after:', n0, pg.evaluate('ACTIVE.length'), '|', pg.inner_text('#i-saved'))
    pg.click('#i-json')
    pg.click('#i-json-out .i-show'); js = pg.input_value('#i-json-out textarea')
    import json; print('problems.json entries:', len(json.loads(js)))
    pg.screenshot(path='/tmp/shot_inst.png', full_page=True)
    # uploaded V2V problem works in coaching
    pg.click('nav button[data-tab=coach]'); pg.select_option('#c-level', '4'); pg.select_option('#c-prob', 'up1')
    pg.select_option('#d-ratio', '2/3'); pg.select_option('#d-needR', 'no'); pg.click('#d-check')
    pg.fill('#s-in', '6.667'); pg.click('#s-check')
    print('up1 summary:', pg.inner_text('#c-sum .big'))
    pg.click('nav button[data-tab=inst]'); pg.click('#i-clear')
    print('after clear:', pg.evaluate('ACTIVE.length'))
    b.close()
print('ERRORS:', errs if errs else 'none')
