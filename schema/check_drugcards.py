#!/usr/bin/env python3
"""流程圖裡寫死的台大藥卡八碼，逐筆確認在 data/drugs/<pid>.js 真的找得到。

為什麼需要這支：藥卡是用 {pid, code} 硬寫在流程圖模組裡的，data/drugs 由
work/drugcards/build_cards.py 重新產生時若某個八碼消失或改變，畫面上只會出現
一句「這個品項的明細尚未建檔」——沒有 console error、沒有紅字，任何既有的
檢查都抓不到。而且只有主碼查得到（onCardToggle 用 x.code === code 比對），
掛到副碼一樣是這個症狀。
"""
import io, json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def codes_in(pid):
    """回傳 data/drugs/<pid>.js 內所有『卡層主碼』。"""
    f = ROOT / 'data' / 'drugs' / f'{pid}.js'
    if not f.exists():
        return None
    src = io.open(f, encoding='utf-8').read()
    i = src.index('= [')
    arr = json.loads(src[i + 2:].rstrip().rstrip(';'))
    return {d['code'] for d in arr}

def cards_in_module(path):
    """從流程圖模組抓 ['<pid>', '<code>', '<商品名>'] 這種字面值。"""
    src = io.open(ROOT / path, encoding='utf-8').read()
    return re.findall(r"\['(\d+)',\s*'([^']+)',\s*'[^']*'\]", src)

MODULES = ['js/breast-pathway.js']

def main():
    problems, total = [], 0
    cache = {}
    for mod in MODULES:
        cards = cards_in_module(mod)
        if not cards:
            problems.append(f'{mod}：一張藥卡都沒抓到，格式可能改了')
            continue
        for pid, code in cards:
            total += 1
            if pid not in cache:
                cache[pid] = codes_in(pid)
            known = cache[pid]
            if known is None:
                problems.append(f'{mod}：data/drugs/{pid}.js 不存在（code {code}）')
            elif code not in known:
                problems.append(f'{mod}：pid {pid} 找不到主碼「{code}」——'
                                f'可能是副碼，或台大資料已更新')
    for p in problems:
        print('  ✗ ' + p)
    print(f'— 檢查了 {total} 張流程圖藥卡，發現 {len(problems)} 個問題')
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
