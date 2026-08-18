#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""data/facets.js 的 kind 欄位（造句導覽清單左邊那顆型別徽章）自動檢查。

2026-08-18 新增。起因：型別原本只有「計分／流程」兩類，新頁面加進來時沒有判準
可循，ACLS、肺栓塞這種整理型頁面被標成「計分」，心因性休克、Swan-Ganz、糖尿病
用藥、B 型肝炎用藥這種多分頁頁面被標成「流程」。改成三類之後把判準寫成可執行的
檢查，免得下一個 session 又憑印象標。

判準（完整版寫在 data/facets.js 的 "tools" 陣列上方）：
  · tool 「計分」＝首頁「計分工具」分類（sec == "scores"）的頁面，一個不多一個不少。
  · pathway「流程」＝一頁一條互動決策路徑、逐步選到底才給結論，**不得有分頁列**。
  · guide 「指引」＝整理型／多分頁參考頁。有分頁列的一律是這一類。
  · cancer／mega／mode 不在本檢查範圍（癌別、總站、模式各有自己的形態）。

⚠ 「有沒有分頁列」是看頁面本身有沒有 data-p= / data-tab= / class="tabbar"，
   不是看檔案放在 tools/ 還是 pathways/ ——目錄位置與型別無關。

用法：python3 schema/check_kinds.py     （在 repo 根目錄跑；有錯回傳 1）
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACETS = os.path.join(ROOT, 'data', 'facets.js')

VALID = {'tool', 'pathway', 'guide', 'cancer', 'mega', 'mode'}
TAB_MARKS = re.compile(r'data-p="|data-tab="|class="tabbar"')

# 例外名單：本質是計分表、但沒有掛在「計分工具」分類底下的標的。目前是空的
# （ich-score 與 pss 雖然首頁卡片放在別組，facets 的 sec 仍是 scores）。
SCORING_EXCEPT = set()


def rows():
    src = open(FACETS, encoding='utf-8').read()
    pat = re.compile(
        r'\{"k": "([\w-]+)", "name": "(.*?)",.*?"kind": "(\w+)", "href": "(.*?)",'
        r'.*?"sec": "(\w+)"', re.S)
    out = []
    for m in pat.finditer(src):
        k, name, kind, href, sec = m.groups()
        out.append({'k': k, 'name': name, 'kind': kind, 'href': href, 'sec': sec})
    return out


def main():
    errs = []
    items = rows()
    if not items:
        print('✗ data/facets.js 解析不到任何標的——格式變了，先修這裡')
        return 1

    for it in items:
        k, kind, sec = it['k'], it['kind'], it['sec']
        name = it['name'][:20]

        if kind not in VALID:
            errs.append('✗ %s（%s）：kind "%s" 不在允許清單 %s'
                        % (k, name, kind, '／'.join(sorted(VALID))))
            continue

        if kind in ('cancer', 'mega', 'mode'):
            continue

        # 計分工具分類 ⇔ kind == tool，雙向都要成立
        if sec == 'scores' and kind != 'tool':
            errs.append('✗ %s（%s）：在「計分工具」分類裡，kind 應為 tool，現在是 %s'
                        % (k, name, kind))
        if kind == 'tool' and sec != 'scores' and k not in SCORING_EXCEPT:
            errs.append('✗ %s（%s）：標成「計分」但不在計分工具分類（sec=%s）——'
                        '不是輸入算分的頁面就該標 guide'
                        % (k, name, sec))

        # 有分頁列的頁面不可能是「一條走到底」的流程
        path = os.path.join(ROOT, it['href'].split('#')[0])
        if not os.path.exists(path):
            errs.append('✗ %s（%s）：href 指向的檔案不存在 %s' % (k, name, it['href']))
            continue
        html = open(path, encoding='utf-8').read()
        has_tabs = bool(TAB_MARKS.search(html))
        if kind == 'pathway' and has_tabs:
            errs.append('✗ %s（%s）：頁面有分頁列，不能標「流程」，應為 guide「指引」'
                        % (k, name))

    if errs:
        print('\n'.join(errs))
        print('\n共 %d 項不符。判準見 data/facets.js "tools" 陣列上方的註解。' % len(errs))
        return 1

    n = {}
    for it in items:
        n[it['kind']] = n.get(it['kind'], 0) + 1
    print('✓ facets kind 檢查通過（%d 個標的：%s）'
          % (len(items), '、'.join('%s %d' % (a, b) for a, b in sorted(n.items()))))
    return 0


if __name__ == '__main__':
    sys.exit(main())
