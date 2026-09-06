#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/render_compare.py — 重構前後的渲染比對（用 schema/cdp.py 驅動本機 Chrome，開 file:// 不經 service worker）

拍什麼（都是「使用者看得到的結果」，不是程式碼）：
  home/<tile>      首頁造句設計把每一格方磚攤開後的整份清單（innerText ＋ 正規化 innerHTML）
  trail/<page>     幾個內頁 .app-header 下方那條造句軌跡的文字
  cancer/<id>/<tab> 30 個癌別（含 colon／rectal 子型）三個分頁各自的 #oncTab innerHTML（正規化）
  console/<page>   每次載入後的 console 錯誤

  styles/<page>/<theme>-<w> 全站每一頁、亮暗兩主題、390 與 1440 兩寬度：每個元素的 computed style ＋ bbox 指紋
                   （動 CSS 檔位置、抽共用樣式時的零變化證明；側欄、畫布等動態疊層排除）

用法：
  python3 schema/render_compare.py snapshot <dir>          # 內容快照（首頁清單／軌跡／癌別）
  python3 schema/render_compare.py styles <dir>            # 樣式指紋快照（約 10 分鐘）
  python3 schema/render_compare.py compare <dirA> <dirB> [--common]   # 逐鍵比對；--common 只比兩邊都有的鍵（RC_ONLY 局部重拍時用）
建議先對同一份程式碼拍兩次比對，確認零差異（排除非決定性），再改程式、再拍、再比。
"""
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from cdp import Browser  # noqa: E402

TILES = ['card-view-abdomen', 'card-view-antibiotics', 'card-view-critical', 'card-view-cancer', 'card-view-scores']
TRAIL_PAGES = ['tools/sofa.html', 'pathways/appendicitis.html', 'pathways/diabetes.html',
               'tools/antibiotics.html', 'tools/classifications.html', 'tools/pss.html', 'tools/cancer.html']
NORM_JS = """(function(sel){var el=document.querySelector(sel); if(!el) return null;
  return el.innerHTML.replace(/\\s+/g,' ').replace(/> </g,'><').trim();})"""


def furl(rel):
    return 'file://' + os.path.join(ROOT, rel)


def cancer_targets():
    """回傳 [(顯示鍵, 條目 id, 子分型 key 或 None)]：頂層 30 個條目，加上每個 subtypes 內的 key。"""
    src = open(os.path.join(ROOT, 'data/cancer/cancers.js'), encoding='utf-8').read()
    fam = re.search(r'window\.CANCER_FAMILIES\s*=\s*\[(.*?)\n\];', src, re.S)
    fam_ids = set(re.findall(r"id:\s*'([\w-]+)'", fam.group(1))) if fam else set()
    heads = [(m.start(), m.group(1)) for m in re.finditer(r"^\s*id:\s*'([\w-]+)'", src, re.M) if m.group(1) not in fam_ids]
    out = []
    for n, (pos, cid) in enumerate(heads):
        end = heads[n + 1][0] if n + 1 < len(heads) else len(src)
        seg = src[pos:end]
        out.append((cid, cid, None))
        i = seg.find('subtypes:')
        if i >= 0:
            j = seg.index('[', i); depth = 0; k = j
            while k < len(seg):
                if seg[k] == '[': depth += 1
                elif seg[k] == ']':
                    depth -= 1
                    if depth == 0: break
                k += 1
            for key in re.findall(r"\bkey:\s*'([\w-]+)'", seg[j:k]):
                out.append(('%s/%s' % (cid, key), cid, key))
    return out


def snapshot(outdir):
    os.makedirs(outdir, exist_ok=True)
    data = {}
    with Browser(width=390, height=844, mobile=True) as b:
        # 1. 首頁五格
        b.open(furl('index.html'), wait=1.5)
        data['console/index'] = b.console_errors()
        for tile in TILES:
            b.js("(function(){var t=document.querySelector('#sentHome [data-tile=\"%s\"], #sentHome button[data-act=\"tile\"][data-id=\"%s\"]');"
                 "if(!t){var all=Array.from(document.querySelectorAll('#sentHome button'));t=all.find(function(x){return (x.getAttribute('data-id')||'')==='%s'||(x.getAttribute('data-tile')||'')==='%s';});}"
                 "if(t) t.click(); return !!t;})()" % (tile, tile, tile, tile))
            b.wait(0.6)
            txt = b.js("(function(){var el=document.getElementById('sentHome'); return el?el.innerText:null;})()")
            html = b.js(NORM_JS + "('#sentHome')")
            data['home/%s/text' % tile] = txt
            data['home/%s/html' % tile] = html
            # 回到六格
            b.js("(function(){var x=Array.from(document.querySelectorAll('#sentHome button')).find(function(x){return /六大分類|返回/.test(x.textContent);}); if(x) x.click(); return !!x;})()")
            b.wait(0.4)
        # 2. 內頁軌跡
        for p in TRAIL_PAGES:
            b.open(furl(p), wait=1.2)
            data['trail/%s' % p] = b.js("(function(){var el=document.getElementById('sentTrail'); return el?el.innerText:null;})()")
            data['console/%s' % p] = b.console_errors()
        # 3. 癌症三分頁
        b.open(furl('tools/cancer.html'), wait=1.5)
        for label, cid, sub in cancer_targets():
            try:
                if sub is not None:
                    b.js("SUBTYPE[%s] = %s" % (json.dumps(cid), json.dumps(sub)))
                b.js("showDetail(%s)" % json.dumps(cid))
                b.wait(0.15)
                for tab in ('stage', 'node', 'tx'):
                    b.js("switchTab(%s, %s)" % (json.dumps(cid), json.dumps(tab)))
                    if tab == 'tx':
                        for _ in range(60):            # 延遲載入的模組最多等 6 秒
                            if not b.js("!!document.querySelector('#oncTab .onc-loading')"):
                                break
                            b.wait(0.1)
                    else:
                        b.wait(0.05)
                    data['cancer/%s/%s' % (label, tab)] = b.js(NORM_JS + "('#oncTab')")
                data['cancer/%s/head' % label] = b.js("(function(){var el=document.querySelector('#oncDetail .onc-title'); return el?el.innerText:null;})()")
            except Exception as exc:                  # noqa: BLE001
                data['error/%s' % label] = str(exc)[:300]
        data['console/tools/cancer.html(after all)'] = b.console_errors()
    with open(os.path.join(outdir, 'snapshot.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=0)
    print('— 拍了 %d 個鍵 → %s' % (len(data), outdir))
    bad = {k: v for k, v in data.items() if k.startswith('console/') and v}
    for k, v in bad.items():
        print('△ %s: %s' % (k, str(v)[:200]))
    return 0


STYLE_JS = r"""(function(){
  var props=['display','position','color','background-color','border-top-width','border-top-style','border-top-color',
    'border-bottom-width','border-bottom-style','border-bottom-color','border-left-width','border-left-color',
    'border-right-width','border-right-color','border-radius','font-family','font-size','font-weight','font-style',
    'line-height','letter-spacing','text-transform','text-decoration-line','text-decoration-color','text-align',
    'white-space','opacity','visibility','box-shadow','margin-top','margin-bottom','margin-left','margin-right',
    'padding-top','padding-bottom','padding-left','padding-right','gap','flex-direction','flex-wrap','align-items',
    'justify-content','grid-template-columns','overflow-x','overflow-y','z-index','transform','outline-width'];
  function h32(str){var h=0x811c9dc5;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=(h*0x01000193)>>>0;}return ('0000000'+h.toString(16)).slice(-8);}
  var skip='#side-nav, .nav-toggle, .nav-scrim, #cat-canvas, #orca-canvas, #ct-splash, #ptr-wrap, canvas, script, style, link, meta';
  var els=document.querySelectorAll('body *'); var out=[]; var texts=0;
  for(var i=0;i<els.length;i++){var el=els[i]; if(el.matches(skip)||el.closest(skip)) continue;
    var cs=getComputedStyle(el); var r=el.getBoundingClientRect();
    var s=el.tagName+'.'+el.className+'|'+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+','+Math.round(r.height);
    for(var j=0;j<props.length;j++) s+='|'+cs.getPropertyValue(props[j]);
    var b=getComputedStyle(el,'::before').content, a=getComputedStyle(el,'::after').content; s+='|'+b+'|'+a;
    out.push(h32(s));}
  return {n:out.length, h:out.join(' ')};
})()"""


# 幾個頁面在載入後多拍一個「互動過的狀態」（JS 渲染的內容才會進指紋）：
#   key 是頁面路徑，值是要跑的 JS；跑完等 1.2 秒再拍，鍵名加上 "@state"
STATE_JS = {
    'tools/cancer.html': "showDetail('gastric'); switchTab('gastric','tx');",
    'tools/antibiotics.html': "var b=document.querySelector('#abx-sites .abx-site, #abx-sites button'); if(b) b.click(); var t=document.querySelector('#abx-types button'); if(t) t.click();",
    'tools/drug-database.html': "var d=document.querySelector('#db-list details, #db-list .dc-card summary, #db-list button'); if(d){ if(d.tagName==='DETAILS') d.open=true; else d.click(); }",
    'pathways/swan-ganz.html': "var b=document.querySelectorAll('.tab-row .tab-btn, .tab-btn')[1]; if(b) b.click();",
    'tools/heart-failure.html': "var b=document.querySelectorAll('.tabbar button, .tabbar .tab')[1]; if(b) b.click();",
    'pathways/diabetes.html': "var b=document.querySelectorAll('.tab-row .tab-btn')[1]; if(b) b.click();",
    'pathways/hypertension.html': "var b=document.querySelectorAll('.tab-row .tab-btn')[1]; if(b) b.click();",
    'tools/spectrum-database.html': "var b=document.querySelectorAll('.tab-row .tab-btn, .abx-mode, button')[2]; if(b) b.click();",
    'tools/acls.html': "var b=document.querySelector('.algo-card, .acls-card, details summary, .tab-btn'); if(b){ if(b.tagName==='SUMMARY') b.parentElement.open=true; else b.click(); }",
    'tools/classifications.html': "var b=document.querySelectorAll('#cl_tabs .tab-btn')[3]; if(b) b.click();",
}


def all_pages():
    out = ['index.html']
    for d in ('tools', 'pathways'):
        for n in sorted(os.listdir(os.path.join(ROOT, d))):
            if n.endswith('.html'):
                out.append(d + '/' + n)
    only = os.environ.get('RC_ONLY')           # 除錯用：RC_ONLY=sofa,crrt 只拍檔名含這些字的頁
    if only:
        keys = [k.strip() for k in only.split(',') if k.strip()]
        out = [p for p in out if any(k in p for k in keys)]
    return out


def styles(outdir):
    os.makedirs(outdir, exist_ok=True)
    data = {}
    combos = [('light', 390, 844, True), ('dark', 390, 844, True), ('light', 1440, 900, False)]
    with Browser(width=390, height=844, mobile=True) as b:
        for theme, w, hgt, mobile in combos:
            b.resize(w, hgt, mobile=mobile)
            b.set_media(color_scheme=theme, reduced_motion=True)
            for p in all_pages():
                try:
                    b.open(furl(p), wait=1.0)
                    b.wait(0.6)                       # 讓「上墨」動畫與 defer 腳本收尾
                    r = b.js(STYLE_JS)
                    data['styles/%s/%s-%d' % (p, theme, w)] = r
                    if p in STATE_JS:
                        b.js('(function(){' + STATE_JS[p] + '})()')
                        for _ in range(40):
                            if not b.js("!!document.querySelector('.onc-loading')"):
                                break
                            b.wait(0.1)
                        b.wait(1.2)
                        data['styles/%s@state/%s-%d' % (p, theme, w)] = b.js(STYLE_JS)
                    errs = b.console_errors()
                    if errs:
                        data['console/%s/%s-%d' % (p, theme, w)] = errs
                except Exception as exc:              # noqa: BLE001
                    data['error/%s/%s-%d' % (p, theme, w)] = str(exc)[:300]
            print('  %s %d: %d 頁' % (theme, w, len(all_pages())))
    with open(os.path.join(outdir, 'snapshot.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False)
    print('— 拍了 %d 個鍵 → %s' % (len(data), outdir))
    for k in sorted(data):
        if k.startswith('error/'):
            print('✗ ' + k + ': ' + str(data[k])[:160])
    return 0


def compare(a, b, common=False):
    A = json.load(open(os.path.join(a, 'snapshot.json'), encoding='utf-8'))
    B = json.load(open(os.path.join(b, 'snapshot.json'), encoding='utf-8'))
    keys = sorted(set(A) & set(B)) if common else sorted(set(A) | set(B))   # --common：只比兩邊都有的鍵（局部重拍時用）
    diffs = 0
    for k in keys:
        va, vb = A.get(k), B.get(k)
        if va == vb:
            continue
        diffs += 1
        if k.startswith('styles/') and isinstance(va, dict) and isinstance(vb, dict):
            ha, hb = va['h'].split(' '), vb['h'].split(' ')
            first = next((n for n, (x, y) in enumerate(zip(ha, hb)) if x != y), min(len(ha), len(hb)))
            print('✗ %s  元素數 %d → %d，第一個不同的元素索引 %d' % (k, va['n'], vb['n'], first))
            continue
        sa, sb = json.dumps(va, ensure_ascii=False), json.dumps(vb, ensure_ascii=False)
        i = 0
        while i < min(len(sa), len(sb)) and sa[i] == sb[i]:
            i += 1
        print('✗ %s\n    A: …%s…\n    B: …%s…' % (k, sa[max(0, i - 60):i + 120], sb[max(0, i - 60):i + 120]))
    print('— %d 個鍵，%d 個不同' % (len(keys), diffs))
    return 1 if diffs else 0


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'snapshot':
        sys.exit(snapshot(sys.argv[2]))
    if len(sys.argv) >= 3 and sys.argv[1] == 'styles':
        sys.exit(styles(sys.argv[2]))
    if len(sys.argv) >= 4 and sys.argv[1] == 'compare':
        sys.exit(compare(sys.argv[2], sys.argv[3], common='--common' in sys.argv))
    print(__doc__)
    sys.exit(2)
