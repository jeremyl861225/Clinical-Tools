#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/validate_drugs.py

驗證 data/antibiotics/drugs.js（window.DRUGS）是否符合
schema/antibiotics-drug.schema.md 所定義的欄位與型別。

不依賴任何第三方套件（純標準庫），因為 drugs.js 是 JS 物件字面量
（非嚴格 JSON：key 不加引號、字串可用單引號），本檔案內建一個最小化的
JS 值 tokenizer／parser 來讀取它，不執行任何程式碼、不改動來源檔案。

用法：
    python3 schema/validate_drugs.py
    （可用 --file 指定其他路徑；預設 data/antibiotics/drugs.js）

退出碼：發現任何錯誤時為 1，否則為 0。
"""

import argparse
import os
import re
import sys


# ---------------------------------------------------------------------------
# 最小化 JS 物件字面量 tokenizer / parser
# ---------------------------------------------------------------------------

class JSSyntaxError(Exception):
    pass


_PUNCT = set('{}[]:,')

_IDENT_START_RE = re.compile(r'[A-Za-z_$]')
_IDENT_RE = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]*')
_NUMBER_RE = re.compile(r'-?\d+(\.\d+)?([eE][+-]?\d+)?')


def _tokenize(src):
    """回傳 token list，每個 token 為 (type, value, pos)。"""
    tokens = []
    i = 0
    n = len(src)
    while i < n:
        ch = src[i]
        if ch in ' \t\r\n':
            i += 1
            continue
        if ch == ';':
            # 陳述式結尾的分號（例如 `window.DRUGS = {...};`）不屬於值文法，略過即可。
            i += 1
            continue
        if ch == '/' and i + 1 < n and src[i + 1] == '/':
            j = src.find('\n', i)
            i = n if j == -1 else j + 1
            continue
        if ch == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            if j == -1:
                raise JSSyntaxError(f'未結束的區塊註解 (pos {i})')
            i = j + 2
            continue
        if ch in _PUNCT:
            tokens.append((ch, ch, i))
            i += 1
            continue
        if ch in ('"', "'"):
            quote = ch
            j = i + 1
            buf = []
            while j < n and src[j] != quote:
                if src[j] == '\\' and j + 1 < n:
                    esc = src[j + 1]
                    mapping = {'n': '\n', 't': '\t', 'r': '\r', '\\': '\\',
                               "'": "'", '"': '"', '`': '`', '/': '/'}
                    buf.append(mapping.get(esc, esc))
                    j += 2
                else:
                    buf.append(src[j])
                    j += 1
            if j >= n:
                raise JSSyntaxError(f'未結束的字串 (pos {i})')
            tokens.append(('string', ''.join(buf), i))
            i = j + 1
            continue
        m = _NUMBER_RE.match(src, i)
        if m and (ch.isdigit() or (ch == '-' and i + 1 < n and src[i + 1].isdigit())):
            tokens.append(('number', m.group(0), i))
            i = m.end()
            continue
        m = _IDENT_RE.match(src, i)
        if m:
            word = m.group(0)
            if word == 'true':
                tokens.append(('bool', True, i))
            elif word == 'false':
                tokens.append(('bool', False, i))
            elif word == 'null':
                tokens.append(('null', None, i))
            elif word == 'NaN':
                tokens.append(('number', 'NaN', i))
            else:
                tokens.append(('ident', word, i))
            i = m.end()
            continue
        raise JSSyntaxError(f'無法辨識的字元 {ch!r} (pos {i})')
    tokens.append(('eof', None, n))
    return tokens


class _Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos]

    def next(self):
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def expect(self, ttype):
        tok = self.next()
        if tok[0] != ttype:
            raise JSSyntaxError(f'預期 {ttype!r}，實際得到 {tok!r}')
        return tok

    def parse_value(self):
        ttype, val, pos = self.peek()
        if ttype == '{':
            return self.parse_object()
        if ttype == '[':
            return self.parse_array()
        if ttype in ('string', 'number', 'bool', 'null'):
            self.next()
            if ttype == 'number':
                return float(val) if ('.' in val or 'e' in val or 'E' in val or val == 'NaN') else int(val)
            return val
        if ttype == 'ident':
            # 極少數情況資料中可能出現裸字 identifier（非標準 JS 資料常見），
            # 當成字串處理以求穩健，不因此中止驗證。
            self.next()
            return val
        raise JSSyntaxError(f'無法解析的值，token={self.peek()!r}')

    def parse_object(self):
        self.expect('{')
        obj = {}
        if self.peek()[0] == '}':
            self.next()
            return obj
        while True:
            ktype, kval, kpos = self.next()
            if ktype not in ('ident', 'string', 'number'):
                raise JSSyntaxError(f'物件 key 不合法：{(ktype, kval, kpos)!r}')
            key = str(kval)
            self.expect(':')
            value = self.parse_value()
            obj[key] = value
            nxt = self.peek()
            if nxt[0] == ',':
                self.next()
                if self.peek()[0] == '}':  # trailing comma
                    self.next()
                    break
                continue
            self.expect('}')
            break
        return obj

    def parse_array(self):
        self.expect('[')
        arr = []
        if self.peek()[0] == ']':
            self.next()
            return arr
        while True:
            arr.append(self.parse_value())
            nxt = self.peek()
            if nxt[0] == ',':
                self.next()
                if self.peek()[0] == ']':  # trailing comma
                    self.next()
                    break
                continue
            self.expect(']')
            break
        return arr


def parse_js_value(src):
    tokens = _tokenize(src)
    parser = _Parser(tokens)
    value = parser.parse_value()
    return value


def load_window_assignment(js_source, var_name):
    """從 `window.VAR = <value>;` 形式的原始碼中取出 <value> 並解析為 Python 物件。"""
    marker = f'window.{var_name}'
    idx = js_source.find(marker)
    if idx == -1:
        raise JSSyntaxError(f'找不到 window.{var_name} 的指定式')
    eq_idx = js_source.find('=', idx)
    if eq_idx == -1:
        raise JSSyntaxError(f'window.{var_name} 後找不到 =')
    rest = js_source[eq_idx + 1:]
    return parse_js_value(rest)


# ---------------------------------------------------------------------------
# Schema 驗證規則（對應 schema/antibiotics-drug.schema.md）
# ---------------------------------------------------------------------------

REQUIRED_STRING_FIELDS = ['name', 'cls', 'bioav', 'dist', 'metab', 'adverse', 'contra']
OPTIONAL_STRING_FIELDS = [
    'zh', 'en', 'vialDose', 'usualDose', 'dose', 'peds', 'maxDose',
    'hepatic', 'dialysis', 'cvvh', 'preg', 'spectrum', 'abgProxy',
]
INJECTION_SUBFIELDS = ['route', 'reconstitute', 'diluent', 'volume', 'conc', 'time', 'notes']
COV_KEYS_BACTERIAL = {'mrsa', 'pseudo', 'anaerobe', 'atypical', 'esbl', 'enterococcus'}
COV_KEYS_FUNGAL = {'candida', 'glabkrusei', 'aspergillus', 'mucor', 'fusarium', 'histo', 'blasto', 'cocci'}
# 四級：2=強效/在地%S≥90、1=涵蓋/80–89、'p'=部分/60–79、0=不涵蓋（通常省略）
COV_VALUES = {2, 1, 'p', 0}


def _is_string(v):
    return isinstance(v, str)


def validate_drug(key, d, errors, warnings):
    if not isinstance(d, dict):
        errors.append(f'[{key}] 條目本身不是物件（object），實際型別={type(d).__name__}')
        return

    # 必要欄位
    for f in REQUIRED_STRING_FIELDS:
        if f not in d:
            errors.append(f'[{key}] 缺少必要欄位 `{f}`')
        elif not _is_string(d[f]) or not d[f].strip():
            errors.append(f'[{key}] 欄位 `{f}` 應為非空字串，實際={d[f]!r}')

    # usualDose / dose 二擇一
    if 'usualDose' not in d and 'dose' not in d:
        errors.append(f'[{key}] 缺少劑量欄位（`usualDose` 或 `dose` 至少擇一）')

    # brands / ntuhProducts：至少要有一種商品名來源
    has_brands = 'brands' in d
    has_ntuh = 'ntuhProducts' in d
    if not has_brands and not has_ntuh:
        warnings.append(f'[{key}] 沒有 `brands` 也沒有 `ntuhProducts`，藥卡商品名欄位將為空')
    if has_brands and not isinstance(d['brands'], list):
        errors.append(f'[{key}] `brands` 應為陣列，實際型別={type(d["brands"]).__name__}')
    elif has_brands:
        for i, b in enumerate(d['brands']):
            if not _is_string(b):
                errors.append(f'[{key}] `brands[{i}]` 應為字串，實際={b!r}')

    if has_ntuh:
        if not isinstance(d['ntuhProducts'], list):
            errors.append(f'[{key}] `ntuhProducts` 應為陣列，實際型別={type(d["ntuhProducts"]).__name__}')
        else:
            for i, p in enumerate(d['ntuhProducts']):
                if not isinstance(p, dict):
                    errors.append(f'[{key}] `ntuhProducts[{i}]` 應為物件 {{en,zh}}，實際={p!r}')
                    continue
                if 'en' not in p and 'zh' not in p:
                    errors.append(f'[{key}] `ntuhProducts[{i}]` 需至少有 `en` 或 `zh` 其一')
                for sub in ('en', 'zh'):
                    if sub in p and not _is_string(p[sub]):
                        errors.append(f'[{key}] `ntuhProducts[{i}].{sub}` 應為字串，實際={p[sub]!r}')

    # renal：陣列 [{k,v}] 或字串
    if 'renal' in d:
        r = d['renal']
        if isinstance(r, str):
            if not r.strip():
                errors.append(f'[{key}] `renal` 字串為空')
        elif isinstance(r, list):
            for i, row in enumerate(r):
                if not isinstance(row, dict) or 'k' not in row or 'v' not in row:
                    errors.append(f'[{key}] `renal[{i}]` 應為 {{k,v}} 物件，實際={row!r}')
        else:
            errors.append(f'[{key}] `renal` 型別應為字串或陣列，實際型別={type(r).__name__}')
    else:
        warnings.append(f'[{key}] 缺少 `renal` 欄位')

    # 選填字串欄位型別檢查（若存在則須為字串）
    for f in OPTIONAL_STRING_FIELDS:
        if f in d and not _is_string(d[f]):
            errors.append(f'[{key}] 欄位 `{f}` 應為字串，實際={d[f]!r}')

    # injection
    if 'injection' in d:
        inj = d['injection']
        if not isinstance(inj, dict):
            errors.append(f'[{key}] `injection` 應為物件，實際型別={type(inj).__name__}')
        else:
            unknown = set(inj.keys()) - set(INJECTION_SUBFIELDS)
            if unknown:
                warnings.append(f'[{key}] `injection` 含未知子欄位：{sorted(unknown)}')
            for sub, val in inj.items():
                if sub in INJECTION_SUBFIELDS and not _is_string(val):
                    errors.append(f'[{key}] `injection.{sub}` 應為字串，實際={val!r}')

    # abg: [{sec,col}]
    if 'abg' in d:
        abg = d['abg']
        if not isinstance(abg, list):
            errors.append(f'[{key}] `abg` 應為陣列，實際型別={type(abg).__name__}')
        else:
            for i, m in enumerate(abg):
                if not isinstance(m, dict) or 'sec' not in m or 'col' not in m:
                    errors.append(f'[{key}] `abg[{i}]` 應為 {{sec,col}} 物件，實際={m!r}')

    # cov / covSet
    if 'cov' in d:
        cov = d['cov']
        if not isinstance(cov, dict):
            errors.append(f'[{key}] `cov` 應為物件，實際型別={type(cov).__name__}')
        else:
            allowed = COV_KEYS_FUNGAL if d.get('covSet') == 'fungal' else COV_KEYS_BACTERIAL
            for k, v in cov.items():
                if k not in allowed:
                    warnings.append(
                        f'[{key}] `cov.{k}` 不在 {"抗黴" if d.get("covSet")=="fungal" else "抗菌"} '
                        f'標準鍵集合 {sorted(allowed)} 內'
                    )
                if v not in COV_VALUES:
                    errors.append(f'[{key}] `cov.{k}` 值應為 2、1、\'p\' 或 0，實際={v!r}')
    if 'covSet' in d and d['covSet'] not in ('fungal',):
        warnings.append(f'[{key}] `covSet` 值非預期（目前只定義 \'fungal\'），實際={d["covSet"]!r}')

    # preg 常見值檢查（非強制，只提示）
    if 'preg' in d and d['preg'] not in ('A', 'B', 'C', 'D', 'X'):
        warnings.append(f'[{key}] `preg` 非常見分級 A/B/C/D/X，實際={d["preg"]!r}')


def main():
    ap = argparse.ArgumentParser(description='驗證 antibiotics DRUGS 資料的欄位/型別')
    ap.add_argument('--file', default=None, help='drugs.js 路徑（預設 data/antibiotics/drugs.js，相對本 repo 根目錄）')
    args = ap.parse_args()

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = args.file or os.path.join(repo_root, 'data', 'antibiotics', 'drugs.js')

    if not os.path.isfile(path):
        print(f'找不到檔案：{path}', file=sys.stderr)
        sys.exit(2)

    with open(path, encoding='utf-8') as f:
        src = f.read()

    try:
        drugs = load_window_assignment(src, 'DRUGS')
    except JSSyntaxError as e:
        print(f'解析 {path} 失敗：{e}', file=sys.stderr)
        sys.exit(2)

    if not isinstance(drugs, dict):
        print(f'window.DRUGS 應為物件，實際型別={type(drugs).__name__}', file=sys.stderr)
        sys.exit(2)

    errors = []
    warnings = []
    for key, entry in drugs.items():
        validate_drug(key, entry, errors, warnings)

    print(f'讀取到 {len(drugs)} 筆藥物條目（{path}）')
    print()

    if warnings:
        print(f'--- 警告（{len(warnings)} 筆，不影響通過與否）---')
        for w in warnings:
            print('  ⚠', w)
        print()

    if errors:
        print(f'--- 錯誤（{len(errors)} 筆）---')
        for e in errors:
            print('  ✗', e)
        print()
        print(f'結果：發現 {len(errors)} 筆錯誤、{len(warnings)} 筆警告。')
        sys.exit(1)
    else:
        print(f'結果：0 錯誤、{len(warnings)} 筆警告。所有藥物條目皆符合 schema 必要欄位要求。')
        sys.exit(0)


if __name__ == '__main__':
    main()
