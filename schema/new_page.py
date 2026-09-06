#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/new_page.py — 一道指令把新頁面接進站內的四個地方

    python3 schema/new_page.py --kind tool --k my-score --file tools/my-score.html \
        --name "中文名" --en "English Name" --desc "一句話說明" \
        --sec scores --grp "重症 / 多器官功能" [--eyebrow …] [--sub …] [--back-label …] \
        [--s 部位,部位] [--c 狀況,狀況] [--a 動作,動作] [--dry-run] [--bump]

做的事（依序）：
  1. 由 schema/templates/<kind>.html 產生頁面骨架（head／tail 與現有 119 頁逐字相同）。
  2. index.html：在 --sec 分類、--grp 分組的清單最後加一張 .tool-card，並把「N 項」加一。
  3. data/facets.js：在 "tools" 陣列末端補一筆（secTitle／secEn／grpEn 從 index.html 讀，不用手填；s/c/a 只能用詞表既有的詞）。
  4. sw.js：把頁面加進 PRECACHE_URLS（tools/ 或 pathways/ 那一段的最後）；不動 CACHE_VERSION（加 --bump 才會 +1）。
  5. 跑 schema/check_pages.py（含 check_kinds）與 schema/check_registry.py。

--dry-run 只印出會插進三個檔案的片段與位置，不寫任何檔。
index.html 與 sw.js 是多個 session 共用的熱點檔：本檔在**寫入當下**才重讀它們，
且只在對應的插入點各動一行／一塊，不重排其他內容。做完請立刻 commit 自己的檔案。
"""
import argparse
import html as H
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(ROOT, 'schema', 'templates')
SEC = {
    'abdomen': ('sec-abdomen', '腹部急症', 'Abdominal Emergencies'),
    'critical': ('sec-critical', '急重症處置', 'Emergency & Critical Care'),
    'scores': ('sec-scores', '計分工具', 'Scoring Tools'),
}
KIND_DEFAULT_EYEBROW = {'tool': 'Scoring Tool', 'pathway': 'Clinical Decision Pathway', 'guide': 'Clinical Guide'}


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as fh:
        return fh.read()


def write(p, s):
    with open(os.path.join(ROOT, p), 'w', encoding='utf-8') as fh:
        fh.write(s)


def esc(s):
    return H.escape(s, quote=False)


def render_page(a):
    head = open(os.path.join(TPL, '_head.html'), encoding='utf-8').read().rstrip('\n')
    tail = open(os.path.join(TPL, '_tail.html'), encoding='utf-8').read().rstrip('\n')
    body = open(os.path.join(TPL, a.kind + '.html'), encoding='utf-8').read()
    out = body.replace('{{HEAD}}', head).replace('{{TAIL}}', tail)
    kid = re.sub(r'[^A-Za-z0-9]', '_', a.k)   # JS 識別字不能有連字號
    rep = {'{{TITLE}}': a.name, '{{K}}': a.k, '{{EYEBROW}}': a.eyebrow, '{{SUB}}': a.sub,
           '{{BACK_LABEL}}': a.back_label}
    for key, val in rep.items():
        out = out.replace(key, val)
    # JS 識別字（函式名／變數名）改用底線版：{{K}} 出現在 onclick 與 var 裡的那些
    out = re.sub(r'\b' + re.escape(a.k) + r'(St|Pick|Render|Reset|Tab)\b', kid + r'\1', out)
    return out + '\n'


def index_snippet(a, deci, tag):
    cls = 'tool-card deci-card' if deci else 'tool-card'
    tagspan = ' <span class="deci-tag">Pathway</span>' if tag else ''
    return ('        <div class="%s" id="card-view-%s" onclick="location.href=\'%s\'">\n'
            '          <div class="tool-name">%s <span class="tool-en">%s</span>%s</div>\n'
            '          <div class="tool-desc">%s</div>\n'
            '        </div>\n') % (cls, a.k, a.file, esc(a.name), esc(a.en), tagspan, esc(a.desc))


def insert_index(src, a):
    sec_id, _, _ = SEC[a.sec]
    sm = re.search(r'<section class="home-sec[^"]*" id="%s">(.*?)</section>' % sec_id, src, re.S)
    if not sm:
        raise SystemExit('index.html 找不到 #' + sec_id)
    body_start, body_end = sm.start(1), sm.end(1)
    groups = list(re.finditer(r'<div class="tool-group[^"]*">', src[body_start:body_end]))
    target = None
    grp_en = ''
    for i, g in enumerate(groups):
        gs = body_start + g.start()
        ge = body_start + (groups[i + 1].start() if i + 1 < len(groups) else body_end - body_start)
        seg = src[gs:ge]
        t = re.search(r'group-title">([^<]*)', seg)
        if t and t.group(1) == a.grp:
            target = (gs, ge, seg)
            e = re.search(r'group-en">([^<]*)', seg)
            grp_en = H.unescape(e.group(1)) if e else ''
            break
    if not target:
        names = [re.search(r'group-title">([^<]*)', src[body_start + g.start():body_start + g.start() + 400]).group(1) for g in groups]
        raise SystemExit('index.html 的 #%s 沒有分組「%s」。現有：%s' % (sec_id, a.grp, '、'.join(names)))
    gs, ge, seg = target
    close = seg.rfind('\n      </div>\n    </div>')   # .home-list 與 .tool-group 的收尾
    if close < 0:
        raise SystemExit('分組「%s」的清單收尾找不到（縮排格式與預期不同）' % a.grp)
    n = len(re.findall(r'class="tool-card', seg))
    deci = a.file.startswith('pathways/')
    tag = deci and a.sec == 'critical'
    card = index_snippet(a, deci, tag)
    seg2 = seg[:close + 1] + card + seg[close + 1:]
    seg2 = re.sub(r'group-count">\d+ 項', 'group-count">%d 項' % (n + 1), seg2, count=1)
    return src[:gs] + seg2 + src[ge:], n + 1, grp_en, card


def facets_line(a, n, grp_en):
    _, sec_title, sec_en = SEC[a.sec]
    row = {'k': a.k, 'name': a.name, 'en': a.en, 'desc': a.desc, 'kind': a.kind, 'href': a.file,
           'sec': a.sec, 'secTitle': sec_title, 'secEn': sec_en, 'grp': a.grp, 'grpEn': grp_en,
           's': a.s, 'c': a.c, 'a': a.a}        # cnt／impl 兩欄 2026-09-04 已整批移除（零讀者）
    return '    ' + json.dumps(row, ensure_ascii=False) + ',\n'


def insert_facets(src, line):
    i = src.find('"tools": [')
    if i < 0:
        raise SystemExit('data/facets.js 找不到 "tools": [')
    m = re.compile(r'\n  \],?\n').search(src, i)
    if not m:
        raise SystemExit('data/facets.js 找不到 tools 陣列的收尾')
    return src[:m.start() + 1] + line + src[m.start() + 1:]


def insert_sw(src, a, bump):
    folder = a.file.split('/')[0]
    lines = src.split('\n')
    last = max(i for i, l in enumerate(lines) if l.strip().startswith("'./%s/" % folder))
    lines.insert(last + 1, "  './%s'," % a.file)
    out = '\n'.join(lines)
    if bump:
        out, k = re.subn(r"(CACHE_VERSION = CACHE_PREFIX \+ 'v)(\d+)'",
                         lambda m: m.group(1) + str(int(m.group(2)) + 1) + "'", out, count=1)
        if k != 1:
            raise SystemExit('sw.js 找不到 CACHE_VERSION')
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--kind', required=True, choices=['tool', 'pathway', 'guide'])
    ap.add_argument('--k', required=True, help='識別碼：card-view-<k>、view-<k>、facets 的 k')
    ap.add_argument('--file', required=True, help='tools/<name>.html 或 pathways/<name>.html')
    ap.add_argument('--name', required=True, help='中文名（首頁卡片與造句清單）')
    ap.add_argument('--en', required=True, help='英文名')
    ap.add_argument('--desc', required=True, help='一句話說明（含指引來源）')
    ap.add_argument('--sec', required=True, choices=sorted(SEC))
    ap.add_argument('--grp', required=True, help='index.html 該分類內既有的分組標題（要逐字相同）')
    ap.add_argument('--eyebrow', default=None)
    ap.add_argument('--sub', default='')
    ap.add_argument('--back-label', default=None, help='h1 超過 14 字時的返回鍵簡稱')
    ap.add_argument('--s', default='', help='facets 部位（逗號分隔）')
    ap.add_argument('--c', default='', help='facets 狀況（逗號分隔）')
    ap.add_argument('--a', default='', help='facets 動作（逗號分隔）')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--bump', action='store_true', help='一併把 CACHE_VERSION +1（政策：新增頁只加 precache 行，不必 bump；刪檔／改名或整批換新才 bump）')
    a = ap.parse_args()

    if not re.match(r'^[a-z0-9-]+$', a.k):
        raise SystemExit('--k 只能用小寫英數與連字號')
    if not re.match(r'^(tools|pathways)/[a-z0-9-]+\.html$', a.file):
        raise SystemExit('--file 要像 tools/xxx.html 或 pathways/xxx.html')
    if a.kind == 'tool' and a.sec != 'scores':
        raise SystemExit('kind=tool 的頁面必須在 --sec scores（check_kinds.py 的雙向判準）')
    if a.kind != 'tool' and a.sec == 'scores':
        raise SystemExit('--sec scores 底下只能放 kind=tool')
    a.eyebrow = a.eyebrow or KIND_DEFAULT_EYEBROW[a.kind]
    a.back_label = a.back_label or a.name
    a.s = [x.strip() for x in a.s.split(',') if x.strip()]
    a.c = [x.strip() for x in a.c.split(',') if x.strip()]
    a.a = [x.strip() for x in a.a.split(',') if x.strip()]

    if os.path.exists(os.path.join(ROOT, a.file)):
        raise SystemExit(a.file + ' 已存在')
    idx = read('index.html')
    if 'id="card-view-%s"' % a.k in idx:
        raise SystemExit('index.html 已有 #card-view-' + a.k)
    fac = read('data/facets.js')
    if '{"k": "%s"' % a.k in fac:
        raise SystemExit('data/facets.js 已有 k=' + a.k)
    sw = read('sw.js')
    if "'./%s'" % a.file in sw:
        raise SystemExit('sw.js 已列了 ' + a.file)

    page = render_page(a)
    idx2, n, grp_en, card = insert_index(idx, a)
    fline = facets_line(a, n, grp_en)
    fac2 = insert_facets(fac, fline)
    sw2 = insert_sw(sw, a, a.bump)

    print('── 頁面 %s（%d 行）' % (a.file, page.count('\n')))
    print('── index.html › #%s › 「%s」 → %d 項' % (SEC[a.sec][0], a.grp, n))
    print(card, end='')
    print('── data/facets.js › tools[] 末端')
    print(fline, end='')
    print('── sw.js › PRECACHE_URLS%s' % ('＋ CACHE_VERSION +1' if a.bump else '（不 bump：新增頁面只加 precache 行）'))
    if a.dry_run:
        print('（--dry-run：未寫入任何檔案）')
        return 0

    write(a.file, page)
    write('index.html', idx2)
    write('data/facets.js', fac2)
    write('sw.js', sw2)
    print('已寫入四個檔案。接著跑檢查：')
    rc = 0
    for script in ('schema/check_pages.py', 'schema/check_registry.py'):
        r = subprocess.run([sys.executable, os.path.join(ROOT, script)], cwd=ROOT)
        rc = rc or r.returncode
    print('\n下一步：填內容 → 瀏覽器實測 → git add %s index.html data/facets.js sw.js → commit → push' % a.file)
    return rc


if __name__ == '__main__':
    sys.exit(main())
