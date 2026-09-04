#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/check_cancer_wiring.py — 癌症子系統的六個登錄點交叉檢查（由 check_pages.py 呼叫）

一個癌別要對齊六個地方，過去全靠人工：
  (1) data/cancer/cancers.js 的條目（id、pathway:'<k>'、家族 CANCER_FAMILIES）
  (2) js/<k>-pathway.js 模組，尾端匯出 global.<k>PathwayHTML 與 global.init<K>Pathway
  (3) tools/cancer.html 的 <script src="../js/<k>-pathway.js">（必須排在 js/cancer-staging.js 之前）
  (4) js/cancer-staging.js 兩條 if-chain（switchTab 呼叫 init<K>Pathway、renderTx 呼叫 <k>PathwayHTML）
      與 ONC_TILE_IMG（方磚圖版）
  (5) sw.js PRECACHE_URLS（模組與 assets/organs/<id>.png）
  (6) data/facets.js 的 cancer-<id> 條目
少一處都不會報錯：模組沒接進 if-chain 只會退回 tx 卡片、沒進 precache 只會離線開不了、
方磚沒圖只會變純色。本檔把六處變成斷言。✗ 錯誤（回傳 1）、△ 警告。

用法：python3 schema/check_cancer_wiring.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as fh:
        return fh.read()


def cap(k):
    return k[0].upper() + k[1:]


def main():
    errs, warns = [], []
    E, W = errs.append, warns.append
    cz = read('data/cancer/cancers.js')
    page = read('tools/cancer.html')
    stg = read('js/cancer-staging.js')
    sw = read('sw.js')
    fac = read('data/facets.js')

    # (1) 條目、家族、pathway 鍵
    ids = re.findall(r"^\s*id:\s*'([\w-]+)'", cz, re.M)          # 頂層條目（子分型用 key:）
    fam = re.search(r'window\.CANCER_FAMILIES\s*=\s*\[(.*?)\n\];', cz, re.S)
    family_ids, members = [], set()
    if fam:
        for fm in re.finditer(r"id:\s*'([\w-]+)'.*?members:\s*\[(.*?)\]", fam.group(1), re.S):
            family_ids.append(fm.group(1))
            members |= set(re.findall(r"'([\w-]+)'", fm.group(2)))
    ids = [i for i in ids if i not in family_ids]
    keys = sorted(set(re.findall(r"pathway:\s*'([\w-]+)'", cz)))
    if not ids or not keys:
        E('data/cancer/cancers.js 解析不到 id／pathway（格式變了，先修本檔的 regex）')
        print('\n'.join('✗ ' + e for e in errs))
        return 1

    # (2)(3)(4)(5) 每個 pathway 鍵
    scripts = re.findall(r'<script src="\.\./js/([\w-]+)\.js"></script>', page)
    stg_pos = scripts.index('cancer-staging') if 'cancer-staging' in scripts else len(scripts)
    pre = set(re.findall(r"'\./([^']+)'", sw))
    init_chain = set(re.findall(r"c\.pathway === '([\w-]+)' && typeof init\w+Pathway === 'function'", stg))
    html_chain = set(re.findall(r"c\.pathway === '([\w-]+)' && typeof \w+PathwayHTML === 'function'", stg))
    for k in keys:
        mod = 'js/%s-pathway.js' % k
        if not os.path.exists(os.path.join(ROOT, mod)):
            E('cancers.js 用了 pathway:\'%s\'，但 %s 不存在' % (k, mod))
            continue
        src = read(mod)
        for name in ('%sPathwayHTML' % k, 'init%sPathway' % cap(k)):
            if not re.search(r'global\.%s\s*=' % re.escape(name), src):
                E('%s 沒有匯出 global.%s（cancer-staging.js 靠命名規則呼叫）' % (mod, name))
        base = '%s-pathway' % k
        if base not in scripts:
            E('tools/cancer.html 沒有載入 %s' % mod)
        elif scripts.index(base) > stg_pos:
            E('tools/cancer.html 把 %s 排在 js/cancer-staging.js 之後（初始化時模組還沒定義）' % mod)
        if mod not in pre:
            E('sw.js PRECACHE_URLS 少了 %s（離線開癌症頁會缺這一支）' % mod)
        if k not in init_chain:
            E('js/cancer-staging.js switchTab 的 if-chain 沒有 pathway \'%s\'（治療分頁不會初始化）' % k)
        if k not in html_chain:
            E('js/cancer-staging.js renderTx 的 if-chain 沒有 pathway \'%s\'（會退回 tx 卡片）' % k)
    for k in sorted((init_chain | html_chain) - set(keys)):
        W('js/cancer-staging.js 分派了 pathway \'%s\'，但 cancers.js 沒有任何條目用它（死分派）' % k)
    for base in scripts:
        if base.endswith('-pathway') and base[:-8] not in keys and base != 'pnet-pathway'[:-3]:
            W('tools/cancer.html 載入 js/%s.js，但沒有條目以它為 pathway（pnet 由 net 內嵌屬例外）' % base)
    for f in sorted(os.listdir(os.path.join(ROOT, 'js'))):
        if f.endswith('-pathway.js') and f[:-3] not in scripts:
            W('js/%s 沒有被 tools/cancer.html 載入（孤兒模組）' % f)

    # (4) 方磚圖版 → (5) 圖檔與 precache
    tm = re.search(r'var ONC_TILE_IMG = \{(.*?)\};', stg, re.S)
    tiles = dict(re.findall(r"(\w+):\s*(1|'[\w-]+')", re.sub(r'//[^\n]*', '', tm.group(1)))) if tm else {}
    for cid in ids + family_ids:
        v = tiles.get(cid)
        if v is None:
            W('癌別 %s 不在 js/cancer-staging.js 的 ONC_TILE_IMG（方磚會是純色）' % cid)
            continue
        f = 'assets/organs/%s.png' % (cid if v == '1' else v.strip("'"))
        if not os.path.exists(os.path.join(ROOT, f)):
            E('ONC_TILE_IMG 指向 %s，但檔案不存在' % f)
        elif f not in pre:
            E('sw.js PRECACHE_URLS 少了 %s' % f)
    for cid in tiles:
        if cid not in ids and cid not in family_ids:
            W('ONC_TILE_IMG 有 %s，但 cancers.js 沒有這個癌別' % cid)

    # (6) facets
    fk = set(re.findall(r'\{"k": "cancer-([\w-]+)"', fac))
    for cid in ids:
        if cid not in fk:
            W('data/facets.js 沒有 cancer-%s 條目（造句導覽列不到這個癌別）' % cid)
    for cid in fk:
        if cid not in ids and cid not in family_ids:
            E('data/facets.js 有 cancer-%s，但 cancers.js 沒有這個癌別' % cid)
    for cid in members:
        if cid not in ids:
            E('CANCER_FAMILIES 的成員 %s 不是 cancers.js 的條目' % cid)

    for e in errs:
        print('✗ ' + e)
    for w in warns:
        print('△ ' + w)
    if not errs:
        print('— 癌症接線檢查：%d 個癌別、%d 個家族、%d 支流程模組，%d 錯 %d 警' % (len(ids), len(family_ids), len(keys), len(errs), len(warns)))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
