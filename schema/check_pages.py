#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/check_pages.py

全站頁面體檢：把「每頁都該有」的事情變成可執行的檢查，而不是靠記憶。
這些規則過去都是人工維持的，實際清查時每一項都有漏掉的頁面。

檢查項目
  1. 離線完整性 —— 每個 tools/、pathways/ 的頁面，以及頁面引用到的
     css／js／data／assets，都必須列在 sw.js 的 PRECACHE_URLS 內；
     反之 PRECACHE_URLS 列到的檔案必須真的存在
     （cache.addAll 是全有全無，少一個檔就整個安裝失敗、離線全掛）。
  2. 共用資源 —— 每頁都要載入 styles.css、nav.css、nav.js、backlink.js、
     pull-to-refresh.js，並註冊 service worker。
  3. 返回鍵 —— 每頁都要有一顆連回 index.html 的「返回主選單」，
     且該鍵要放在 .back-stack 內（js/backlink.js 會把「返回來源頁」插在它上面）。
  4. 頁首三件組 —— .app-header 內要有 .eyebrow / h1 / .sub。
  5. 頁面簡稱 —— <body data-back-label> 供別頁的返回鍵顯示；
     未指定時 backlink.js 會退回 h1，h1 過長的頁面應明確指定。

用法：
    python3 schema/check_pages.py            # 只列問題
    python3 schema/check_pages.py --verbose  # 一併列出通過的頁數

退出碼：發現任何錯誤時為 1，否則為 0。
"""

import argparse
import os
import re
import sys

# 讓本檔不論從哪個工作目錄被呼叫，都找得到同一層的 check_kinds.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 每頁都必須引用的共用資源（以檔名比對，不管相對路徑深度）
REQUIRED = [
    ('css/styles.css', 'styles.css'),
    ('css/nav.css', 'nav.css'),
    ('js/nav.js', 'nav.js'),
    ('js/backlink.js', 'backlink.js'),
    ('js/pull-to-refresh.js', 'pull-to-refresh.js'),
]
# h1 超過這個中文字數就該自訂 data-back-label，否則返回鍵會被撐得很長
LABEL_LIMIT = 14


def rel(path):
    return os.path.relpath(path, ROOT)


def pages():
    out = []
    for d in ('tools', 'pathways'):
        folder = os.path.join(ROOT, d)
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if name.endswith('.html'):
                out.append(os.path.join(folder, name))
    return out


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def precache_urls():
    """取出 sw.js 的 PRECACHE_URLS；只讀陣列字面量，不執行任何程式碼。"""
    src = read(os.path.join(ROOT, 'sw.js'))
    m = re.search(r'PRECACHE_URLS\s*=\s*\[(.*?)\n\];', src, re.S)
    if not m:
        return None
    return set(re.findall(r"'\./([^']+)'", m.group(1)))


def referenced_assets(html, page):
    """頁面靜態引用到的站內檔案，換算成相對站台根目錄的路徑。"""
    found = set()
    here = os.path.dirname(rel(page))
    pat = r'(?:src|href)="((?:\.\./|\./)?[\w./-]+\.(?:css|js|png|jpg|jpeg|svg|webp|webmanifest))"'
    for m in re.finditer(pat, html):
        target = os.path.normpath(os.path.join(here, m.group(1)))
        if not target.startswith('..'):
            found.add(target.replace(os.sep, '/'))
    return found


def check_page(page, pre):
    """回傳這一頁的問題清單。"""
    html = read(page)
    name = rel(page)
    bad = []

    # 1. 自己在不在 precache
    if pre is not None and name not in pre:
        bad.append('未列入 sw.js 的 PRECACHE_URLS，離線會開天窗')

    # 1b. 引用到的靜態資源在不在 precache
    if pre is not None:
        for asset in sorted(referenced_assets(html, page) - pre):
            bad.append(f'引用了 {asset} 但它不在 PRECACHE_URLS')

    # 2. 共用資源
    for _, filename in REQUIRED:
        if filename not in html:
            bad.append(f'未載入 {filename}')
    if 'serviceWorker' not in html:
        bad.append('未註冊 service worker')

    # 3. 返回鍵
    home = re.findall(r'<button[^>]*class="[^"]*back-btn[^"]*"[^>]*>', html)
    home = [b for b in home if 'index.html' in b]
    if not home:
        bad.append('沒有連回 index.html 的「返回主選單」按鈕')
    elif 'back-stack' not in html:
        bad.append('返回鍵不在 .back-stack 內，backlink.js 插入的返回來源頁鍵會排版錯亂')

    # 4. 頁首三件組
    header = re.search(r'<div class="app-header">(.*?)</div>\s*</div>', html, re.S)
    if header:
        block = header.group(1)
        for cls, label in (('eyebrow', '.eyebrow'), ('sub', '.sub')):
            if f'class="{cls}"' not in block:
                bad.append(f'.app-header 缺 {label}')
        if '<h1>' not in block:
            bad.append('.app-header 缺 h1')

    # 5. 頁面簡稱
    label = re.search(r'<body[^>]*data-back-label="([^"]*)"', html)
    if not label:
        h1 = re.search(r'<h1>(.*?)</h1>', html, re.S)
        text = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
        if len(text) > LABEL_LIMIT:
            bad.append(f'未設 data-back-label，會退回過長的 h1（{len(text)} 字）')
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--verbose', action='store_true')
    args = ap.parse_args()

    pre = precache_urls()
    problems = 0

    if pre is None:
        print('✗ sw.js 讀不到 PRECACHE_URLS，離線檢查略過')
        problems += 1
    else:
        # precache 清單裡指到不存在的檔案 —— cache.addAll 會整批失敗
        for url in sorted(pre):
            if url in ('', './') or url.endswith('/'):
                continue
            if not os.path.exists(os.path.join(ROOT, url)):
                print(f'✗ sw.js: PRECACHE_URLS 列了 {url}，但檔案不存在')
                problems += 1

    checked = 0
    for page in pages():
        bad = check_page(page, pre)
        checked += 1
        for msg in bad:
            print(f'✗ {rel(page)}: {msg}')
            problems += 1

    # 6. 造句導覽的型別徽章（data/facets.js 的 kind）—— 判準寫在 schema/check_kinds.py。
    #    掛在這裡而不是要人另外記一條指令：新頁面漏標或標錯型別，跟漏進 precache
    #    一樣是「看起來好好的、實際上壞掉」，收尾只跑一支腳本才會真的被跑到。
    try:
        import check_kinds
        if check_kinds.main() != 0:
            problems += 1
    except Exception as exc:                      # noqa: BLE001 —— 檢查器自己壞掉也要說
        print(f'✗ schema/check_kinds.py 跑不起來：{exc}')
        problems += 1

    if args.verbose or not problems:
        print(f'— 檢查了 {checked} 個頁面，發現 {problems} 個問題')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
