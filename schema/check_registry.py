#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/check_registry.py — 頁面登錄簿的交叉檢查（由 check_pages.py 呼叫）

一個頁面在站內登錄在五個地方，彼此靠人工保持一致：
  (1) index.html 的 .tool-card（所屬分類 section、分組 .tool-group、分組標頭的「N 項」）
      → js/nav.js 側欄與 js/search.js 全站查詢都從這裡的 DOM 建清單
  (2) data/facets.js "tools" 陣列（name／en／desc／kind／href／sec／grp…）→ 造句導覽
  (3) sw.js PRECACHE_URLS（check_pages.py 已檢查）
  (4) 頁面自己的返回鍵錨點 ../index.html#card-view-<k> → 回首頁時展開該區並亮該卡
  (5) 首頁沒有卡片的子頁：js/nav.js HUB_PAGES（側欄）與 js/search.js SUB_PAGES（查詢）
另有幾份「硬編碼的派生表」：js/sentence-nav.js 的 TAB_PAGES（哪些頁有分頁列）、TILE（六格方磚）、
SECT_ORDER；index.html 路由的 SECTIONS；css/ui-sentence.css 以 #view-<k> 掛鉤的規則。

這些副本漂移時不會報錯：件數寫錯只是數字不對、facets 的 name 多塞了英文只是清單印兩次、
返回鍵錨點不存在只是回首頁不會亮卡、子頁沒登錄只是側欄與查詢找不到它。
本檔把它們全部變成可執行的斷言。✗ 為錯誤（回傳 1），△ 為警告（不計入）。

用法：python3 schema/check_registry.py [--verbose]   （check_pages.py 會自動呼叫）
"""
import html as H
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 首頁 section id → facets 的 sec 值（新增大類時這裡、index.html 路由 SECTIONS、
# js/sentence-nav.js 的 SECT_ORDER／TILE 四處都要改，見 ARCHITECTURE.md）
SEC_OF = {'sec-abdomen': 'abdomen', 'sec-critical': 'critical', 'sec-scores': 'scores'}

# index.html 卡片 id 與 facets 的 k 刻意不同者：改 k 會讓既有 ?sent= 連結失效，故不改
K_ALIAS = {'electrolyte': 'lyte-all'}

# 首頁沒有卡片、由別頁的分頁列或內文連入的頁面。
#   tile   ＝返回鍵該指向的首頁卡（None ＝ 返回主選單不帶錨點）
#   hub    ＝側欄要掛在哪個方磚底下（js/nav.js HUB_PAGES 的鍵；None ＝ 不進側欄，由母頁連入）
SUBHUB = {
    'tools/spectrum-database.html':   {'tile': 'card-view-antibiotics', 'hub': 'tools/antibiotics.html'},
    'tools/surgical-prophylaxis.html': {'tile': 'card-view-antibiotics', 'hub': 'tools/antibiotics.html'},
    'tools/trauma-abx.html':          {'tile': 'card-view-antibiotics', 'hub': 'tools/antibiotics.html'},
    'tools/iv-to-po.html':            {'tile': 'card-view-antibiotics', 'hub': 'tools/antibiotics.html'},
    'tools/y-site.html':              {'tile': 'card-view-antibiotics', 'hub': 'tools/antibiotics.html'},
    'tools/ddi.html':                 {'tile': None,                    'hub': 'tools/drug-database.html'},
    'tools/ich-score.html':           {'tile': 'card-view-ich-path',    'hub': None},
    'tools/pss.html':                 {'tile': 'card-view-esoph',       'hub': None},
}

TITLE_SUFFIX = ' · 臨床工具箱'
TITLE_OWN = {'tools/acls.html', 'tools/ekg.html', 'tools/heart-failure.html'}   # 自有全名的三頁（刻意）

# <head> 內必須依序出現的共用資源（../ 與 ./ 正規化成 R/ 後比對；中間可以夾其他行）
HEAD_SEQ = [
    'href="R/css/styles.css"',
    '<!-- pwa-head-tags -->',
    '<!-- ui-mode:start -->',
    "localStorage.getItem('ct-ui')!=='classic'",
    'href="R/css/ui-sentence.css"',
    'src="R/js/ui-mode.js" defer',
    '<!-- ui-mode:end -->',
    '<!-- sentence-nav:start -->',
    'src="R/data/facets.js" defer',
    'src="R/js/sentence-nav.js" defer',
    '<!-- sentence-nav:end -->',
    'name="theme-color"',
    'rel="manifest" href="R/manifest.webmanifest"',
    'name="apple-mobile-web-app-title"',
    'href="R/css/nav.css"',
    'src="R/js/nav.js" defer',
    'src="R/js/backlink.js" defer',
]

# 首頁卡片的契約：js/nav.js cardItem() 與 js/search.js indexCards() 用這條 regex 讀 onclick，
# 不符的卡片會從側欄與查詢中**靜默消失**
CARD_ONCLICK = re.compile(r"^location\.href='(tools|pathways)/[a-z0-9-]+\.html'$")

# 有分頁列的記號（與 check_kinds.py 相同）；這些頁面要在 sentence-nav.js 的 TAB_PAGES 裡
TAB_MARKS = re.compile(r'data-p="|data-tab="|class="tabbar"')
TAB_PAGES_EXEMPT = {'classifications'}   # 分級系統頁有自己的解析器（parseClassif），不走 TAB_PAGES

ZH_NUM = {'一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
          '十': 10, '十一': 11, '十二': 12, '十三': 13}


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as fh:
        return fh.read()


def text(s):
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def pages():
    for d in ('tools', 'pathways'):
        for n in sorted(os.listdir(os.path.join(ROOT, d))):
            if n.endswith('.html'):
                yield d + '/' + n


# ───────────────────────── index.html ─────────────────────────
def parse_index(src):
    cards, groups = [], []
    for sm in re.finditer(r'<section class="home-sec[^"]*" id="(sec-\w+)">(.*?)</section>', src, re.S):
        sec = SEC_OF.get(sm.group(1))
        for part in re.split(r'(?=<div class="tool-group)', sm.group(2)):
            if not part.lstrip().startswith('<div class="tool-group'):
                continue
            t = re.search(r'group-title">([^<]*)', part)
            e = re.search(r'group-en">([^<]*)', part)
            c = re.search(r'group-count">(\d+)', part)
            g = {'sec': sec, 'title': H.unescape(t.group(1)) if t else '?', 'en': H.unescape(e.group(1)) if e else '',
                 'declared': int(c.group(1)) if c else None, 'cards': []}
            for cm in re.finditer(r'<div class="tool-card[^"]*" id="card-view-([\w-]+)"([^>]*)>(.*?)<div class="tool-desc">(.*?)</div>', part, re.S):
                k, attrs, head, desc = cm.groups()
                oc = re.search(r'onclick="([^"]*)"', attrs)
                nm = re.search(r'<div class="tool-name">(.*?)</div>', head, re.S)
                name = en = ''
                if nm:
                    inner = re.sub(r'<span class="deci-tag">.*?</span>', '', nm.group(1), flags=re.S)
                    en_m = re.search(r'<span class="tool-en">(.*?)</span>', inner, re.S)
                    en = text(en_m.group(1)) if en_m else ''
                    name = text(re.sub(r'<span class="tool-en">.*?</span>', '', inner, flags=re.S))
                card = {'k': k, 'onclick': oc.group(1) if oc else '', 'name': name, 'en': en,
                        'desc': text(desc), 'sec': sec, 'grp': g['title'], 'has_en_span': bool(nm and 'tool-en' in nm.group(1))}
                m = CARD_ONCLICK.match(card['onclick'])
                card['href'] = card['onclick'][15:-1] if m else ''
                g['cards'].append(card)
                cards.append(card)
            groups.append(g)
    hub_ids = re.findall(r'<a class="hub-card[^"]*" id="(card-view-[\w-]+)" href="([^"]+)"', src)
    route = re.search(r'SECTIONS = \{([^}]*)\}', src)
    route_keys = re.findall(r"(\w+): 'sec-\w+'", route.group(1)) if route else []
    return cards, groups, hub_ids, route_keys


# ───────────────────────── data/facets.js ─────────────────────────
def parse_facets(src):
    """tools[] 逐行 json.loads；s/c/a 詞表只抓 "w"。"""
    tools = []
    i = src.find('"tools": [')
    m = re.compile(r'\n  \],?\n').search(src, i)
    body = src[i:m.start()] if (i >= 0 and m) else src
    buf = ''
    for line in body.split('\n'):
        s = line.strip()
        if not buf and not s.startswith('{"k":'):
            continue
        s = re.sub(r'\s*//[^"]*$', '', s)               # 行尾的 // 註解（不含引號；條目內的網址是 "…" 包住的，不會誤砍）
        buf = (buf + ' ' + s).strip() if buf else s
        if not re.search(r'\}\s*,?$', buf):             # 條目跨行（trauma-path／radial／amiscore）
            continue
        s, buf = buf, ''
        try:
            tools.append(json.loads(s.rstrip(',')))
        except Exception as exc:                      # noqa: BLE001
            tools.append({'k': '?', '_bad': s[:80], '_err': str(exc)})
    vocab = {}
    for key in ('s', 'c', 'a'):
        km = re.search(r'\n  "%s": \[(.*?)\n  \],' % key, src, re.S)
        vocab[key] = set(re.findall(r'\{"w": "([^"]+)"', km.group(1))) if km else set()
    return tools, vocab


def js_string_list(src, name):
    """讀 `var NAME = ['a', 'b', /* 註解 */ 'c'];` 這種字面量的字串清單（不執行 JS）。"""
    m = re.search(r'var %s = \[(.*?)\];' % name, src, re.S)
    if not m:
        return None
    body = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S)
    return re.findall(r"'([^']+)'", body)


def tab_count(html):
    tabs = set(re.findall(r'<button[^>]*data-(?:p|tab)="([^"]+)"', html))
    if not tabs and 'TABS = [' in html:                       # heart-failure 用字面陣列
        tabs = set(re.findall(r"\['([^']+)',\s*'[^']*',\s*'[^']*'\]", html))
    return len(tabs)


def claimed_tabs(s):
    m = re.search(r'([一二兩三四五六七八九十]{1,2}|\d+)\s*個?分頁', s)
    if not m:
        return None
    v = m.group(1)
    return int(v) if v.isdigit() else ZH_NUM.get(v)


def main():
    verbose = '--verbose' in sys.argv
    errs, warns = [], []
    E, W = errs.append, warns.append

    idx_src = read('index.html')
    cards, groups, hub_ids, route_keys = parse_index(idx_src)
    tools, vocab = parse_facets(read('data/facets.js'))
    nav_src, search_src, sent_src, css_src = read('js/nav.js'), read('js/search.js'), read('js/sentence-nav.js'), read('css/ui-sentence.css')
    by_k = {t['k']: t for t in tools}
    card_by_k = {c['k']: c for c in cards}
    index_ids = set(re.findall(r'id="(card-view-[\w-]+)"', idx_src))
    page_set = set(pages())

    for t in tools:
        if '_bad' in t:
            E('data/facets.js 有一筆 tools 條目不是合法 JSON（%s）：%s' % (t['_err'], t['_bad']))

    # 1. 分組件數
    for g in groups:
        if g['declared'] is not None and g['declared'] != len(g['cards']):
            E('index.html 分組「%s」寫 %d 項，實際 %d 張卡' % (g['title'], g['declared'], len(g['cards'])))

    # 2. 卡片契約（側欄與查詢靠這條 regex）
    for c in cards:
        if not c['href']:
            E('index.html #card-view-%s 的 onclick 不是 location.href=\'tools|pathways/xxx.html\'（側欄與查詢會漏掉它）：%s' % (c['k'], c['onclick']))
        elif c['href'] not in page_set:
            E('index.html #card-view-%s 連到不存在的 %s' % (c['k'], c['href']))
        if not c['has_en_span']:
            W('index.html #card-view-%s 的 .tool-name 沒有 .tool-en（側欄英文名會空）' % c['k'])

    # 3. 首頁卡片 ↔ facets 條目
    sec_title = {}
    for c in cards:
        k = K_ALIAS.get(c['k'], c['k'])
        r = by_k.get(k)
        if not r:
            E('index.html #card-view-%s 在 data/facets.js 沒有 k="%s" 的條目（造句導覽列不到它）' % (c['k'], k))
            continue
        if r.get('href', '').split('#')[0] != c['href']:
            E('%s: index 連到 %s，facets href 是 %s' % (k, c['href'], r.get('href')))
        fname = text(r.get('name', ''))
        if (r.get('en') and r['en'] in fname and fname != r['en']) or fname.endswith(' Pathway'):
            E('%s: facets name「%s」內嵌了英文／Pathway（name 只放中文，英文放 en，否則造句清單印兩次）' % (k, fname))
        elif fname != c['name']:
            W('%s: facets name「%s」與首頁中文名「%s」不同（可以不同，但請確認是刻意的）' % (k, fname, c['name']))
        if r.get('sec') != c['sec']:
            E('%s: sec 不同 — index 在 %s，facets 寫 %s' % (k, c['sec'], r.get('sec')))
        if r.get('grp') != c['grp']:
            E('%s: grp 不同 — index 分組「%s」，facets 寫「%s」' % (k, c['grp'], r.get('grp')))
        g = next((g for g in groups if g['sec'] == c['sec'] and g['title'] == c['grp']), None)
        if g and r.get('grpEn') != g['en']:
            E('%s: grpEn「%s」≠ 首頁分組英文「%s」' % (k, r.get('grpEn'), g['en']))
        if text(r.get('desc', '')) != c['desc']:
            W('%s: facets desc 與首頁 tool-desc 文字不同（兩處各自撰寫；若是同一句請同步）' % k)
    # 3b. secTitle/secEn 同一 sec 要一致；cnt/impl 是死欄位
    for r in tools:
        s = r.get('sec')
        if s not in sec_title:
            sec_title[s] = (r.get('secTitle'), r.get('secEn'))
        elif sec_title[s] != (r.get('secTitle'), r.get('secEn')):
            E('%s: secTitle/secEn 與同 sec 其他條目不同（%s／%s vs %s／%s）' % (r['k'], r.get('secTitle'), r.get('secEn'), *sec_title[s]))
        for dead in ('cnt', 'impl'):
            if dead in r:
                E('%s: facets 條目帶了 "%s" 欄位——全站沒有程式讀它，2026-09-04 已整批移除，不要再加' % (r['k'], dead))
        for key in ('s', 'c', 'a'):
            for w in r.get(key, []):
                if w not in vocab[key]:
                    E('%s: %s 用了詞表沒有的詞「%s」（造句導覽會靜默忽略）' % (r['k'], key, w))

    # 4. facets → 首頁（三大分類）
    alias_rev = {v: k for k, v in K_ALIAS.items()}
    for r in tools:
        if r.get('sec') in ('abdomen', 'critical', 'scores'):
            k = alias_rev.get(r['k'], r['k'])
            href = r.get('href', '').split('#')[0]
            if k not in card_by_k and href not in SUBHUB and href not in {h for _, h in hub_ids}:
                E('facets %s（%s）列在 %s／%s，但首頁沒有這張卡，也不在 check_registry.py 的 SUBHUB 名單' % (r['k'], r.get('name'), r.get('sec'), r.get('grp')))

    # 5. 子頁登錄：nav.js HUB_PAGES 與 search.js SUB_PAGES
    hub_m = re.search(r'var HUB_PAGES = \{(.*?)\n  \};', nav_src, re.S)
    hub_pages = {}
    if hub_m:
        for km in re.finditer(r"'([^']+\.html)': \[(.*?)\]", hub_m.group(1), re.S):
            hub_pages[km.group(1)] = set(re.findall(r"href: '([^'#]+)", km.group(2)))
    sub_m = re.search(r'var SUB_PAGES = \[(.*?)\n  \];', search_src, re.S)
    sub_pages = set(re.findall(r"url: '([^']+)'", sub_m.group(1))) if sub_m else set()
    hub_hrefs = {href for _, href in hub_ids if href.endswith('.html')}   # 方磚直達的三頁本身就是入口
    carded = {c['href'] for c in cards} | hub_hrefs
    for p in sorted(page_set - carded):
        if p not in SUBHUB:
            E('%s 沒有首頁卡片，也不在 check_registry.py 的 SUBHUB 名單（決定它要掛在哪個方磚下、返回鍵指哪張卡）' % p)
            continue
        if p not in sub_pages:
            E('%s 沒有首頁卡片，卻不在 js/search.js SUB_PAGES（全站查詢與內文索引找不到它）' % p)
        hub = SUBHUB[p]['hub']
        if hub and p not in hub_pages.get(hub, set()):
            E('%s 應掛在側欄「%s」底下，但 js/nav.js HUB_PAGES 沒列它' % (p, hub))
    for hub, items in hub_pages.items():
        for p in items:
            if p not in page_set:
                E('js/nav.js HUB_PAGES 列了不存在的 %s' % p)
    for p in sub_pages:
        if p not in page_set:
            E('js/search.js SUB_PAGES 列了不存在的 %s' % p)
        elif p in carded:
            W('js/search.js SUB_PAGES 列了首頁已有卡片的 %s（會在查詢出現兩次）' % p)

    # 6. 逐頁：返回鍵錨點、標題、head 順序、SW 路徑、footer、eyebrow、分頁登錄
    tab_pages = js_string_list(sent_src, 'TAB_PAGES') or []
    k_of_page = {}
    for r in tools:
        href = r.get('href', '')
        if '#' not in href:
            k_of_page.setdefault(href, r['k'])
    for p in sorted(page_set):
        src = read(p)
        m = re.search(r"location\.href='\.\./index\.html(#card-view-[\w-]+)?'", src)
        if m:
            anchor = (m.group(1) or '')[1:]
            if p in SUBHUB:
                want = SUBHUB[p]['tile']
                if (want or '') != anchor:
                    E('%s: 返回鍵錨點是 #%s，子頁應指向 #%s' % (p, anchor or '(無)', want or '(無)'))
            elif anchor and anchor not in index_ids:
                E('%s: 返回鍵指向 #%s，index.html 沒有這個 id（回首頁不會亮卡）' % (p, anchor))
            elif not anchor:
                W('%s: 返回鍵沒帶 #card-view-… 錨點' % p)
        t = re.search(r'<title>(.*?)</title>', src, re.S)
        if t and not t.group(1).endswith(TITLE_SUFFIX) and p not in TITLE_OWN:
            E('%s: <title> 後綴不是「%s」：%s' % (p, TITLE_SUFFIX.strip(), t.group(1)))
        head = re.search(r'<head>(.*?)</head>', src, re.S)
        if head:
            h = head.group(1).replace('../', 'R/').replace('./', 'R/')
            pos = 0
            for needle in HEAD_SEQ:
                i = h.find(needle, pos)
                if i < 0:
                    E('%s: <head> 缺少或順序錯誤：%s（照 schema/templates/_head.html）' % (p, needle))
                    break
                pos = i + len(needle)
        if "register('../sw.js')" not in src:
            E('%s: service worker 註冊路徑不是 ../sw.js' % p)
        if 'tool-footer' not in src:
            W('%s: 沒有 footer.tool-footer（出處文獻）' % p)
        tc = re.search(r'name="theme-color" content="([^"]+)"', src)
        if tc and tc.group(1) != '#1f5a6b':
            W('%s: theme-color %s（其他頁都是 #1f5a6b）' % (p, tc.group(1)))
        k = k_of_page.get(p)
        r = by_k.get(k) if k else None
        eb = re.search(r'class="eyebrow">([^<]*)<', src)
        if r and eb and 'Pathway' in eb.group(1) and r.get('kind') != 'pathway':
            W('%s: eyebrow 寫「%s」但 facets kind 是 %s' % (p, eb.group(1), r.get('kind')))
        has_tabs = bool(TAB_MARKS.search(src))
        if r and has_tabs and r.get('kind') in ('guide', 'pathway') and k not in tab_pages and k not in TAB_PAGES_EXEMPT:
            E('%s（%s）有分頁列，但不在 js/sentence-nav.js 的 TAB_PAGES（說整句查不到它的分頁）' % (p, k))
        n = tab_count(src)
        for label, s in (('index', card_by_k.get(alias_rev.get(k, k) if k else '', {}).get('desc', '')), ('facets', text(r.get('desc', '')) if r else '')):
            cl = claimed_tabs(s)
            if cl and n and cl != n:
                E('%s: %s desc 說有 %d 個分頁，頁面實際 %d 個' % (p, label, cl, n))
    for k in tab_pages:
        r = by_k.get(k)
        if not r:
            E('js/sentence-nav.js TAB_PAGES 列了 facets 沒有的 k「%s」' % k)
            continue
        p = r.get('href', '').split('#')[0]
        if p in page_set and not TAB_MARKS.search(read(p)):
            E('js/sentence-nav.js TAB_PAGES 列了 %s，但該頁沒有分頁列記號' % k)

    # 7. 硬編碼派生表：TILE、SECT_ORDER、SECTIONS、ui-sentence 的 #view- 掛鉤
    tile_m = re.search(r'var TILE = \{(.*?)\n  \};', sent_src, re.S)
    tile = dict(re.findall(r"'(card-view-[\w-]+)':\s*\{ by: '(\w+)'", tile_m.group(1))) if tile_m else {}
    tile_grp = re.findall(r"by: 'grp', v: '([^']+)'", tile_m.group(1)) if tile_m else []
    hub_id_set = {h for h, _ in hub_ids}
    for h in hub_id_set - set(tile):
        E('index.html 方磚 #%s 不在 js/sentence-nav.js 的 TILE（造句首頁不會有這一格）' % h)
    for h in set(tile) - hub_id_set:
        E('js/sentence-nav.js TILE 列了 index.html 沒有的方磚 #%s' % h)
    grp_all = {t.get('grp') for t in tools}
    for gname in tile_grp:
        if gname not in grp_all:
            E('js/sentence-nav.js TILE 的 grp「%s」在 facets 沒有任何條目' % gname)
    sect_order = js_string_list(sent_src, 'SECT_ORDER') or []
    for s in {t.get('sec') for t in tools} - set(sect_order):
        E('facets 用了 sec「%s」，但 js/sentence-nav.js 的 SECT_ORDER 沒有它' % s)
    hub_hashes = {href[1:] for _, href in hub_ids if href.startswith('#')}
    for kname in route_keys:
        if kname not in hub_hashes:
            E('index.html 路由 SECTIONS 有「%s」，但沒有 href="#%s" 的方磚' % (kname, kname))
    for kname in hub_hashes - set(route_keys):
        E('index.html 方磚 href="#%s" 沒有對應的路由 SECTIONS 鍵' % kname)
    all_html = idx_src + ''.join(read(p) for p in page_set)
    for vid in sorted(set(re.findall(r'#view-([\w-]+)', css_src))):
        if 'id="view-%s"' % vid not in all_html:
            E('css/ui-sentence.css 以 #view-%s 掛鉤，但沒有任何頁面有這個 id（死規則）' % vid)

    # 8. js/sentence-nav.js 對其他頁面 DOM 的硬耦合（壞了會靜靜變 0 筆）
    cl = read('tools/classifications.html')
    for needle in ('id="cl_tabs"', 'class="sys-head" id="sys-', 'class="sys-name"', 'id="ae_dz"', "{k:'A',zh:'"):
        if needle not in cl:
            E('tools/classifications.html 少了 sentence-nav.js parseClassif/parseAast 依賴的 %s' % needle)
    if 'TABS = [' not in read('tools/heart-failure.html'):
        E('tools/heart-failure.html 少了 sentence-nav.js parseTabs 依賴的 TABS = [ 字面陣列')
    for k in tab_pages:
        r = by_k.get(k)
        p = r.get('href', '').split('#')[0] if r else ''
        if p in page_set and 'location.hash' not in read(p):
            E('%s 在 TAB_PAGES 內，但頁面不讀 location.hash（造句導覽的分頁深層連結會落空）' % p)

    for e in errs:
        print('✗ ' + e)
    for w in warns:
        print('△ ' + w)
    if verbose or not errs:
        print('— 登錄簿檢查：首頁 %d 張卡／%d 組，facets %d 條，%d 錯 %d 警' % (len(cards), len(groups), len(tools), len(errs), len(warns)))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
