#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
schema/validate_cancers.py

驗證 data/cancer/cancers.js（window.CANCERS）是否符合
schema/cancer.schema.md 所定義的欄位與型別。

不依賴任何第三方套件（純標準庫），因為 cancers.js 是 JS 陣列字面量
（非嚴格 JSON：key 不加引號、字串可用單引號，且 refs 欄位的 url 以
`PM('pmid')`／`PS('query')` 兩個 helper 函式呼叫組成，而非字面字串）。
本檔案內建一個最小化的 JS 值 tokenizer／parser 來讀取它，僅認識
`PM(...)`／`PS(...)` 這兩種函式呼叫並在解析時還原成對應字串（依
cancers.js 檔頭 `const PM = id => ...` / `const PS = q => ...` 的定義
重新實作，不執行來源檔案中的任何程式碼）。

用法：
    python3 schema/validate_cancers.py
    （可用 --file 指定其他路徑；預設 data/cancer/cancers.js）

退出碼：發現任何錯誤時為 1，否則為 0。
"""

import argparse
import os
import re
import sys
from urllib.parse import quote


# ---------------------------------------------------------------------------
# 最小化 JS 值 tokenizer / parser（支援 PM(...)／PS(...) 函式呼叫）
# ---------------------------------------------------------------------------

class JSSyntaxError(Exception):
    pass


_PUNCT = set('{}[]:,()')

_IDENT_RE = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]*')
_NUMBER_RE = re.compile(r'-?\d+(\.\d+)?([eE][+-]?\d+)?')

# 對應 cancers.js 檔頭：
#   const PM = id => 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/';
#   const PS = q  => 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(q);
def _call_PM(args):
    if len(args) != 1 or not isinstance(args[0], str):
        raise JSSyntaxError(f'PM(...) 預期單一字串參數，實際={args!r}')
    return 'https://pubmed.ncbi.nlm.nih.gov/' + args[0] + '/'


def _call_PS(args):
    if len(args) != 1 or not isinstance(args[0], str):
        raise JSSyntaxError(f'PS(...) 預期單一字串參數，實際={args!r}')
    return 'https://pubmed.ncbi.nlm.nih.gov/?term=' + quote(args[0], safe='')


_KNOWN_CALLS = {'PM': _call_PM, 'PS': _call_PS}


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
            quote_ch = ch
            j = i + 1
            buf = []
            while j < n and src[j] != quote_ch:
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
            self.next()
            # 函式呼叫：PM('...') / PS('...')
            if self.peek()[0] == '(':
                return self._parse_call(val, pos)
            # 極少數情況資料中可能出現裸字 identifier，當成字串處理以求穩健。
            return val
        raise JSSyntaxError(f'無法解析的值，token={self.peek()!r}')

    def _parse_call(self, name, pos):
        self.expect('(')
        args = []
        if self.peek()[0] != ')':
            while True:
                args.append(self.parse_value())
                if self.peek()[0] == ',':
                    self.next()
                    continue
                break
        self.expect(')')
        fn = _KNOWN_CALLS.get(name)
        if fn is None:
            raise JSSyntaxError(f'不支援的函式呼叫 {name}(...) (pos {pos})；僅支援 PM/PS')
        return fn(args)

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
    return parser.parse_value()


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
# Schema 驗證規則（對應 schema/cancer.schema.md）
# ---------------------------------------------------------------------------

REQUIRED_STRING_FIELDS = ['id', 'zh', 'en', 'group', 'edition']
OPTIONAL_STRING_FIELDS = ['staging_note', 'node_note']
TX_ROLE_CLASSES = {'neo', 'surg', 'adj', 'sys'}


def _is_string(v):
    return isinstance(v, str)


def _validate_tnm_rows(key, field, rows, errors):
    if not isinstance(rows, list):
        errors.append(f'[{key}] `{field}` 應為陣列，實際型別={type(rows).__name__}')
        return
    for i, row in enumerate(rows):
        if not isinstance(row, list) or len(row) < 2:
            errors.append(f'[{key}] `{field}[{i}]` 應為 [code, desc] 陣列，實際={row!r}')
            continue
        code, desc = row[0], row[1]
        if not _is_string(code) or not code.strip():
            errors.append(f'[{key}] `{field}[{i}].code` 應為非空字串，實際={code!r}')
        if not _is_string(desc) or not desc.strip():
            errors.append(f'[{key}] `{field}[{i}].desc` 應為非空字串，實際={desc!r}')


def _validate_matrix(key, mx, errors):
    if not isinstance(mx, dict):
        errors.append(f'[{key}] `matrix` 應為物件，實際型別={type(mx).__name__}')
        return
    for f in ('ncols', 'trows', 'cells'):
        if f not in mx:
            errors.append(f'[{key}] `matrix` 缺少必要欄位 `{f}`')
    # mrows：M 列（接在 T 列之後、橫跨 N 欄），讓 stage IV 出現在表格上。
    # 非必要欄位（少數部位無 M 分期列），但只要存在就必須結構正確。
    if 'mrows' in mx:
        if not isinstance(mx['mrows'], list):
            errors.append(f'[{key}] `matrix.mrows` 應為陣列')
        else:
            for i, m in enumerate(mx['mrows']):
                if not isinstance(m, list) or len(m) < 2 \
                        or not _is_string(m[0]) or not _is_string(m[1]):
                    errors.append(
                        f'[{key}] `matrix.mrows[{i}]` 應為 [M 代碼, 分期, 說明?] 陣列，實際={m!r}'
                    )
    if 'ncols' in mx:
        if not isinstance(mx['ncols'], list) or not mx['ncols']:
            errors.append(f'[{key}] `matrix.ncols` 應為非空陣列')
        else:
            for i, c in enumerate(mx['ncols']):
                if not isinstance(c, list) or len(c) < 1 or not _is_string(c[0]):
                    errors.append(f'[{key}] `matrix.ncols[{i}]` 應為 [code, sublabel?] 陣列，實際={c!r}')
    if 'trows' in mx:
        if not isinstance(mx['trows'], list) or not mx['trows']:
            errors.append(f'[{key}] `matrix.trows` 應為非空陣列')
        else:
            for i, t in enumerate(mx['trows']):
                if not _is_string(t):
                    errors.append(f'[{key}] `matrix.trows[{i}]` 應為字串，實際={t!r}')
    if 'cells' in mx:
        if not isinstance(mx['cells'], list):
            errors.append(f'[{key}] `matrix.cells` 應為陣列')
        else:
            n_trows = len(mx.get('trows', []))
            n_ncols = len(mx.get('ncols', []))
            if n_trows and len(mx['cells']) != n_trows:
                errors.append(
                    f'[{key}] `matrix.cells` 列數（{len(mx["cells"])}）與 `trows` 長度（{n_trows}）不符'
                )
            for i, row in enumerate(mx['cells']):
                if not isinstance(row, list):
                    errors.append(f'[{key}] `matrix.cells[{i}]` 應為陣列，實際={row!r}')
                    continue
                if n_ncols and len(row) != n_ncols:
                    errors.append(
                        f'[{key}] `matrix.cells[{i}]` 欄數（{len(row)}）與 `ncols` 長度（{n_ncols}）不符'
                    )
                for j, s in enumerate(row):
                    if not _is_string(s) or not s.strip():
                        errors.append(f'[{key}] `matrix.cells[{i}][{j}]` 應為非空字串，實際={s!r}')
    if 'm1' in mx and not _is_string(mx['m1']):
        errors.append(f'[{key}] `matrix.m1` 應為字串，實際={mx["m1"]!r}')


def _validate_stages(key, stages, errors):
    if not isinstance(stages, list) or not stages:
        errors.append(f'[{key}] `stages` 應為非空陣列')
        return
    for i, row in enumerate(stages):
        if not isinstance(row, list) or len(row) < 2:
            errors.append(f'[{key}] `stages[{i}]` 應為 [stage, criteria, note?] 陣列，實際={row!r}')
            continue
        stage, criteria = row[0], row[1]
        if not _is_string(stage) or not stage.strip():
            errors.append(f'[{key}] `stages[{i}].stage` 應為非空字串，實際={stage!r}')
        if not _is_string(criteria) or not criteria.strip():
            errors.append(f'[{key}] `stages[{i}].criteria` 應為非空字串，實際={criteria!r}')
        if len(row) >= 3 and row[2] is not None and not _is_string(row[2]):
            errors.append(f'[{key}] `stages[{i}].note` 應為字串，實際={row[2]!r}')


def _validate_nodes(key, nodes, errors):
    if not isinstance(nodes, list):
        errors.append(f'[{key}] `nodes` 應為陣列，實際型別={type(nodes).__name__}')
        return
    for i, row in enumerate(nodes):
        if not isinstance(row, list) or len(row) < 2:
            errors.append(f'[{key}] `nodes[{i}]` 應為 [code, name_zh, group?] 陣列，實際={row!r}')
            continue
        code, name_zh = row[0], row[1]
        if not _is_string(code) or not code.strip():
            errors.append(f'[{key}] `nodes[{i}].code` 應為非空字串，實際={code!r}')
        if not _is_string(name_zh) or not name_zh.strip():
            errors.append(f'[{key}] `nodes[{i}].name_zh` 應為非空字串，實際={name_zh!r}')
        if len(row) >= 3 and row[2] is not None and not _is_string(row[2]):
            errors.append(f'[{key}] `nodes[{i}].group` 應為字串，實際={row[2]!r}')


def _validate_tx(key, tx, errors, warnings):
    if not isinstance(tx, list) or not tx:
        errors.append(f'[{key}] `tx` 應為非空陣列')
        return
    for i, item in enumerate(tx):
        if not isinstance(item, dict):
            errors.append(f'[{key}] `tx[{i}]` 應為物件，實際={item!r}')
            continue
        for f in ('role', 'cls', 'label', 'html'):
            if f not in item:
                errors.append(f'[{key}] `tx[{i}]` 缺少必要欄位 `{f}`')
            elif not _is_string(item[f]) or not item[f].strip():
                errors.append(f'[{key}] `tx[{i}].{f}` 應為非空字串，實際={item[f]!r}')
        if 'cls' in item and item['cls'] not in TX_ROLE_CLASSES:
            warnings.append(
                f'[{key}] `tx[{i}].cls`={item["cls"]!r} 不在常見值 {sorted(TX_ROLE_CLASSES)} 內'
            )


def _validate_refs(key, refs, errors):
    if not isinstance(refs, list) or not refs:
        errors.append(f'[{key}] `refs` 應為非空陣列')
        return
    for i, row in enumerate(refs):
        if not isinstance(row, list) or len(row) < 2:
            errors.append(f'[{key}] `refs[{i}]` 應為 [label, url] 陣列，實際={row!r}')
            continue
        label, url = row[0], row[1]
        if not _is_string(label) or not label.strip():
            errors.append(f'[{key}] `refs[{i}].label` 應為非空字串，實際={label!r}')
        if not _is_string(url) or not url.startswith('http'):
            errors.append(f'[{key}] `refs[{i}].url` 應為 http(s) 開頭的字串，實際={url!r}')


def validate_cancer(idx, c, errors, warnings):
    key = c.get('id', f'#{idx}') if isinstance(c, dict) else f'#{idx}'
    if not isinstance(c, dict):
        errors.append(f'[{key}] 條目本身不是物件（object），實際型別={type(c).__name__}')
        return

    for f in REQUIRED_STRING_FIELDS:
        if f not in c:
            errors.append(f'[{key}] 缺少必要欄位 `{f}`')
        elif not _is_string(c[f]) or not c[f].strip():
            errors.append(f'[{key}] 欄位 `{f}` 應為非空字串，實際={c[f]!r}')

    for f in OPTIONAL_STRING_FIELDS:
        if f in c and not _is_string(c[f]):
            errors.append(f'[{key}] 欄位 `{f}` 應為字串，實際={c[f]!r}')

    # T / N / M 分期列表（必要，可為空陣列但欄位需存在）
    for f in ('t', 'n', 'm'):
        if f not in c:
            errors.append(f'[{key}] 缺少必要欄位 `{f}`')
        else:
            _validate_tnm_rows(key, f, c[f], errors)

    # 分期組合：matrix 與 stages 二擇一（matrix 優先），至少要有一個
    has_matrices = 'matrices' in c
    has_matrix = 'matrix' in c
    has_stages = 'stages' in c
    if not has_matrices and not has_matrix and not has_stages:
        errors.append(f'[{key}] 缺少分期組合資料：`matrices`、`matrix` 與 `stages` 皆不存在')
    if has_matrices:
        mats = c['matrices']
        if not isinstance(mats, list) or not mats:
            errors.append(f'[{key}] `matrices` 應為非空陣列')
        else:
            if 'matrix_axis' not in c:
                errors.append(f'[{key}] 有 `matrices` 但缺少 `matrix_axis`（選擇器標題）')
            seen = set()
            for i, v in enumerate(mats):
                if not isinstance(v, dict):
                    errors.append(f'[{key}] `matrices[{i}]` 應為物件')
                    continue
                for f in ('key', 'label'):
                    if not _is_string(v.get(f)) or not v.get(f, '').strip():
                        errors.append(f'[{key}] `matrices[{i}].{f}` 應為非空字串')
                k = v.get('key')
                if k in seen:
                    errors.append(f'[{key}] `matrices` 的 key 重複：{k!r}')
                seen.add(k)
                _validate_matrix(f'{key}/{k}', v, errors)
    if has_matrix:
        _validate_matrix(key, c['matrix'], errors)
    if has_stages:
        _validate_stages(key, c['stages'], errors)

    # 淋巴結分群（選填，但若存在需符合格式）
    if 'nodes' in c:
        _validate_nodes(key, c['nodes'], errors)
    else:
        warnings.append(f'[{key}] 沒有 `nodes` 欄位，「淋巴結分群」頁籤將只顯示 node_note（若有）或空白')

    # 治療建議（選填，但若存在需符合格式）
    if 'tx' in c:
        _validate_tx(key, c['tx'], errors, warnings)
    else:
        warnings.append(f'[{key}] 沒有 `tx` 欄位，「治療建議」頁籤將為空白')

    # 主要文獻（選填，但若存在需符合格式）
    if 'refs' in c:
        _validate_refs(key, c['refs'], errors)
    else:
        warnings.append(f'[{key}] 沒有 `refs` 欄位，不會顯示主要文獻區塊')


def main():
    ap = argparse.ArgumentParser(description='驗證 cancer-staging CANCERS 資料的欄位/型別')
    ap.add_argument('--file', default=None, help='cancers.js 路徑（預設 data/cancer/cancers.js，相對本 repo 根目錄）')
    args = ap.parse_args()

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = args.file or os.path.join(repo_root, 'data', 'cancer', 'cancers.js')

    if not os.path.isfile(path):
        print(f'找不到檔案：{path}', file=sys.stderr)
        sys.exit(2)

    with open(path, encoding='utf-8') as f:
        src = f.read()

    try:
        cancers = load_window_assignment(src, 'CANCERS')
    except JSSyntaxError as e:
        print(f'解析 {path} 失敗：{e}', file=sys.stderr)
        sys.exit(2)

    if not isinstance(cancers, list):
        print(f'window.CANCERS 應為陣列，實際型別={type(cancers).__name__}', file=sys.stderr)
        sys.exit(2)

    errors = []
    warnings = []
    seen_ids = {}
    for idx, entry in enumerate(cancers):
        validate_cancer(idx, entry, errors, warnings)
        if isinstance(entry, dict) and 'id' in entry:
            cid = entry['id']
            if cid in seen_ids:
                errors.append(f'[{cid}] `id` 重複（與第 {seen_ids[cid]} 筆重複），CANCERS.find 只會取到第一筆')
            else:
                seen_ids[cid] = idx

    print(f'讀取到 {len(cancers)} 筆癌症條目（{path}）')
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
        print(f'結果：0 錯誤、{len(warnings)} 筆警告。所有癌症條目皆符合 schema 必要欄位要求。')
        sys.exit(0)


if __name__ == '__main__':
    main()
