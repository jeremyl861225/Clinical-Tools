#!/usr/bin/env python3
"""極簡 Chrome DevTools Protocol 驅動器（純標準函式庫，不需安裝任何套件）。

這台機器沒有 node、沒有 playwright、沒有 websocket-client，
但評審必須「真的操作」頁面，所以自己接一條 CDP 通道：
自帶 WebSocket 客戶端 → 真實滑鼠事件、真實鍵盤、console 收集、
prefers-color-scheme／prefers-reduced-motion 模擬、整頁截圖。

當函式庫用：

    from cdp import Browser
    with Browser(width=390, height=844, mobile=True, color_scheme='dark') as b:
        b.open('file:///.../index.html')
        b.click_text('NEWS2')            # 真的按下去
        b.type_into('#rr', '22')
        print(b.text('#total'))
        b.shot('out.png', full=True)
        print(b.console_errors())

當指令用：

    python3 cdp.py <url> --script probe.js --shot out.png --size 390x844 \
                   --theme dark --reduced-motion --full
"""
import base64
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


# ────────────────────────── 迷你 WebSocket 客戶端 ──────────────────────────
class WS:
    def __init__(self, url, timeout=30):
        m = re.match(r"ws://([^:/]+):(\d+)(/.*)", url)
        if not m:
            raise ValueError(f"看不懂的 ws url: {url}")
        host, port, path = m.group(1), int(m.group(2)), m.group(3)
        self.sock = socket.create_connection((host, port), timeout=timeout)
        self.sock.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError("握手時連線被關閉")
            buf += chunk
        head, _, rest = buf.partition(b"\r\n\r\n")
        if b"101" not in head.split(b"\r\n")[0]:
            raise ConnectionError(f"WebSocket 握手失敗：{head[:120]!r}")
        self._buf = rest

    # ── 低階讀寫 ──
    def _read(self, n):
        while len(self._buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionError("連線關閉")
            self._buf += chunk
        out, self._buf = self._buf[:n], self._buf[n:]
        return out

    def send(self, text):
        payload = text.encode()
        header = bytearray([0x81])            # FIN + text
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < (1 << 16):
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        mask = os.urandom(4)
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(bytes(header) + masked)

    def recv(self):
        """回傳一個完整訊息（自動接續分片、自動回 pong）。"""
        chunks, opcode = [], None
        while True:
            b0, b1 = self._read(2)
            fin = b0 & 0x80
            op = b0 & 0x0F
            length = b1 & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._read(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._read(8))[0]
            data = self._read(length) if length else b""
            if op == 0x9:                      # ping → pong
                self.sock.sendall(b"\x8a\x80" + os.urandom(4))
                continue
            if op == 0x8:
                raise ConnectionError("對方關閉了 WebSocket")
            if op in (0x1, 0x2):
                opcode = op
            chunks.append(data)
            if fin:
                break
        return b"".join(chunks).decode("utf-8", "replace")

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass


# ────────────────────────────── 瀏覽器 ──────────────────────────────
class Browser:
    def __init__(self, width=1440, height=900, mobile=False, color_scheme=None,
                 reduced_motion=False, scale=1, port=None, headless=True, quiet=True):
        self.w, self.h, self.mobile, self.scale = width, height, mobile, scale
        self.color_scheme = color_scheme
        self.reduced_motion = reduced_motion
        self.port = port or _free_port()
        self.profile = tempfile.mkdtemp(prefix="cdp-profile-")
        self._id = 0
        self.console = []
        self.exceptions = []
        args = [
            CHROME,
            f"--remote-debugging-port={self.port}",
            f"--user-data-dir={self.profile}",
            "--remote-allow-origins=*",
            "--no-first-run", "--no-default-browser-check",
            "--disable-gpu", "--hide-scrollbars",
            "--disable-features=Translate,MediaRouter",
            "--allow-file-access-from-files",
            f"--window-size={width},{height}",
            "about:blank",
        ]
        if headless:
            args.insert(1, "--headless=new")
        self.proc = subprocess.Popen(
            args, stdout=subprocess.DEVNULL,
            stderr=(subprocess.DEVNULL if quiet else None))
        self.ws = WS(self._wait_target())
        self.send("Page.enable")
        self.send("Runtime.enable")
        self.send("Log.enable")
        self._apply_emulation()

    # ── 生命週期 ──
    def _wait_target(self, timeout=25):
        end = time.time() + timeout
        last = None
        while time.time() < end:
            try:
                raw = urllib.request.urlopen(
                    f"http://127.0.0.1:{self.port}/json/list", timeout=2).read()
                for t in json.loads(raw):
                    if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
                        return t["webSocketDebuggerUrl"]
            except Exception as e:      # Chrome 還沒開好
                last = e
            time.sleep(0.15)
        raise RuntimeError(f"連不上 Chrome 除錯埠 {self.port}：{last}")

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass
        try:
            self.proc.terminate()
            self.proc.wait(timeout=5)
        except Exception:
            try:
                self.proc.kill()
            except Exception:
                pass
        shutil.rmtree(self.profile, ignore_errors=True)

    # ── CDP 基本呼叫 ──
    def send(self, method, **params):
        self._id += 1
        mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if "id" in msg and msg["id"] == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method} 失敗：{msg['error']}")
                return msg.get("result", {})
            self._on_event(msg)

    def _on_event(self, msg):
        m = msg.get("method", "")
        p = msg.get("params", {})
        if m == "Runtime.consoleAPICalled":
            txt = " ".join(
                str(a.get("value", a.get("description", ""))) for a in p.get("args", []))
            self.console.append({"level": p.get("type", "log"), "text": txt})
        elif m == "Log.entryAdded":
            e = p.get("entry", {})
            self.console.append({"level": e.get("level", "log"),
                                 "text": e.get("text", ""),
                                 "url": e.get("url", "")})
        elif m == "Runtime.exceptionThrown":
            d = p.get("exceptionDetails", {})
            self.exceptions.append(
                d.get("exception", {}).get("description") or d.get("text", "未知例外"))

    def _pump(self, seconds):
        """把等待期間累積的事件抽乾（否則 console 收不到）。"""
        end = time.time() + seconds
        self.ws.sock.settimeout(0.08)
        try:
            while time.time() < end:
                try:
                    self._on_event(json.loads(self.ws.recv()))
                except socket.timeout:
                    pass
                except OSError:
                    break
        finally:
            self.ws.sock.settimeout(30)

    def _apply_emulation(self):
        self.send("Emulation.setDeviceMetricsOverride",
                  width=self.w, height=self.h, deviceScaleFactor=self.scale,
                  mobile=self.mobile)
        feats = []
        if self.color_scheme:
            feats.append({"name": "prefers-color-scheme", "value": self.color_scheme})
        if self.reduced_motion:
            feats.append({"name": "prefers-reduced-motion", "value": "reduce"})
        # 一律送出（空清單＝清掉覆寫），避免殘留上一次的設定
        self.send("Emulation.setEmulatedMedia", features=feats)
        if self.mobile:
            self.send("Emulation.setTouchEmulationEnabled", enabled=True,
                      maxTouchPoints=5)

    def set_media(self, color_scheme=None, reduced_motion=None):
        if color_scheme is not None:
            self.color_scheme = color_scheme
        if reduced_motion is not None:
            self.reduced_motion = reduced_motion
        self._apply_emulation()

    def resize(self, width, height, mobile=None):
        self.w, self.h = width, height
        if mobile is not None:
            self.mobile = mobile
        self._apply_emulation()

    # ── 導覽 ──
    def open(self, url, wait=1.2):
        self.send("Page.navigate", url=url)
        self._pump(wait)
        self.wait_ready()
        return self

    def wait_ready(self, timeout=10):
        end = time.time() + timeout
        while time.time() < end:
            if self.js("document.readyState") == "complete":
                return True
            self._pump(0.1)
        return False

    def wait(self, seconds):
        self._pump(seconds)
        return self

    def url(self):
        return self.js("location.href")

    # ── JS ──
    def js(self, expr, await_promise=False):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=await_promise, userGesture=True)
        if r.get("exceptionDetails"):
            d = r["exceptionDetails"]
            raise RuntimeError("JS 例外：" +
                               (d.get("exception", {}).get("description") or d.get("text", "")))
        return r.get("result", {}).get("value")

    def text(self, selector):
        return self.js(f"(document.querySelector({json.dumps(selector)})||{{}}).innerText || ''")

    def exists(self, selector):
        return bool(self.js(f"!!document.querySelector({json.dumps(selector)})"))

    def count(self, selector):
        return int(self.js(f"document.querySelectorAll({json.dumps(selector)}).length"))

    # ── 真實輸入 ──
    def _center(self, selector=None, text=None, exact=False):
        """回傳 (x, y)；先捲進視窗再量測。找不到就丟例外。"""
        if selector:
            find = f"document.querySelector({json.dumps(selector)})"
            what = selector
        else:
            t = json.dumps(text)
            cmp_ = "txt === t" if exact else "txt.includes(t)"
            # 挑「真的看得見、而且最貼近這段文字」的元素：
            # 先濾掉隱藏元素，再排除「內部還有另一個也符合的元素」的外層容器，
            # 最後在剩下的候選裡挑文字最短的（＝最貼合目標的那一個）。
            find = f"""(function(){{
              const t = {t};
              const vis = el => {{
                if (!el.isConnected) return false;
                const s = getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden'
                    || parseFloat(s.opacity) === 0) return false;
                if (el.offsetParent === null && s.position !== 'fixed') return false;
                const r = el.getBoundingClientRect();
                return r.width >= 8 && r.height >= 8;
              }};
              let cand = [...document.querySelectorAll(
                'a,button,[role=button],[role=option],[role=link],[onclick],summary,'
                + 'label,li,td,th,div,span,h1,h2,h3,h4,p,section,article')]
                .filter(el => {{
                  // 可見文字比對不到時，也認 aria-label／title／alt
                  // （例如把標籤拆成多個 span 的圖磚，innerText 會被換行切開）
                  const raw = (el.innerText || el.textContent || '').trim();
                  const flat = raw.replace(/\\s+/g, '');
                  const aria = ((el.getAttribute && (el.getAttribute('aria-label')
                                || el.getAttribute('title') || el.getAttribute('alt'))) || '').trim();
                  const tf = t.replace(/\\s+/g, '');
                  let txt = raw;
                  let hit = ({cmp_});
                  if (!hit && flat.includes(tf)) {{ hit = true; txt = raw; }}
                  if (!hit && aria) {{ txt = aria; hit = ({cmp_}); }}
                  if (!hit) return false;
                  return vis(el);
                }});
              if (!cand.length) return null;
              // 排除「還包著另一個候選」的外層
              const inner = cand.filter(el => !cand.some(o => o !== el && el.contains(o)));
              const pool = inner.length ? inner : cand;
              // 文字最短者最貼合；同長度時取面積最小者
              pool.sort((a, b) => {{
                const la = (a.innerText || '').trim().length;
                const lb = (b.innerText || '').trim().length;
                if (la !== lb) return la - lb;
                const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
                return (ra.width * ra.height) - (rb.width * rb.height);
              }});
              let el = pool[0];
              // 若本身不可點，往上找最近的可點祖先（tool-card 這種 onclick 在外層的情況）
              if (!el.matches('a,button,[role=button],[onclick],summary,input,select,label')) {{
                const up = el.closest('a,button,[role=button],[onclick],summary,label');
                if (up && vis(up)) el = up;
              }}
              return el;
            }})()"""
            what = f"文字「{text}」"
        r = self.js(f"""(function(){{
          const el = {find};
          if (!el) return null;
          el.scrollIntoView({{block:'center', inline:'center', behavior:'instant'}});
          const r = el.getBoundingClientRect();
          return {{x: r.left + r.width/2, y: r.top + r.height/2,
                   w: r.width, h: r.height, tag: el.tagName}};
        }})()""")
        if not r:
            raise LookupError(f"找不到可點的元素：{what}")
        return r

    def click(self, selector=None, text=None, exact=False, wait=0.45):
        box = self._center(selector, text, exact)
        x, y = box["x"], box["y"]
        for ev in ("mouseMoved", "mousePressed", "mouseReleased"):
            p = dict(type=ev, x=x, y=y, button="left", clickCount=1,
                     buttons=1 if ev == "mousePressed" else 0)
            if ev == "mouseMoved":
                p["buttons"] = 0
            self.send("Input.dispatchMouseEvent", **p)
        self._pump(wait)
        return box

    def click_text(self, text, **kw):
        return self.click(text=text, **kw)

    def tap(self, selector=None, text=None, wait=0.45):
        """行動裝置的觸控點擊（會產生 touchstart/touchend）。"""
        box = self._center(selector, text)
        pt = [{"x": box["x"], "y": box["y"], "radiusX": 12, "radiusY": 12, "force": 1}]
        self.send("Input.dispatchTouchEvent", type="touchStart", touchPoints=pt)
        self.send("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        self._pump(wait)
        return box

    def type_into(self, selector, value, wait=0.3):
        """聚焦後逐字送入真實鍵盤事件（頁面的 input 監聽器才會被觸發）。"""
        self.click(selector, wait=0.1)
        self.js(f"""(function(){{
          const el = document.querySelector({json.dumps(selector)});
          el.focus();
          if ('value' in el) {{ el.value = ''; el.dispatchEvent(new Event('input',{{bubbles:true}})); }}
        }})()""")
        for ch in str(value):
            self.send("Input.dispatchKeyEvent", type="keyDown", text=ch,
                      unmodifiedText=ch, key=ch)
            self.send("Input.dispatchKeyEvent", type="keyUp", key=ch)
        self._pump(wait)

    def press(self, key, wait=0.25):
        codes = {"Enter": 13, "Tab": 9, "Escape": 27, "ArrowDown": 40,
                 "ArrowUp": 38, "ArrowLeft": 37, "ArrowRight": 39, "Backspace": 8}
        code = codes.get(key, 0)
        text = "\r" if key == "Enter" else ("\t" if key == "Tab" else "")
        self.send("Input.dispatchKeyEvent", type="keyDown", key=key,
                  windowsVirtualKeyCode=code, nativeVirtualKeyCode=code, text=text)
        self.send("Input.dispatchKeyEvent", type="keyUp", key=key,
                  windowsVirtualKeyCode=code, nativeVirtualKeyCode=code)
        self._pump(wait)

    def scroll(self, dy=600, x=None, y=None, wait=0.3):
        self.send("Input.dispatchMouseEvent", type="mouseWheel",
                  x=x if x is not None else self.w // 2,
                  y=y if y is not None else self.h // 2,
                  deltaX=0, deltaY=dy)
        self._pump(wait)

    # ── 觀測 ──
    def shot(self, path, full=False, max_height=16000):
        params = {"format": "png", "captureBeyondViewport": bool(full)}
        if full:
            m = self.send("Page.getLayoutMetrics")
            css = m.get("cssContentSize") or m.get("contentSize")
            h = min(int(css["height"]), max_height)
            params["clip"] = {"x": 0, "y": 0, "width": self.w, "height": h, "scale": 1}
        data = self.send("Page.captureScreenshot", **params)["data"]
        path = os.path.abspath(path)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        return path

    def console_errors(self):
        bad = [c for c in self.console
               if c.get("level") in ("error", "severe")
               or "Uncaught" in c.get("text", "")]
        return [c["text"] for c in bad] + self.exceptions

    def overflow_x(self):
        """回傳橫向溢出的像素數（0 = 沒有溢出）。"""
        return int(self.js(
            "Math.max(0, document.documentElement.scrollWidth - window.innerWidth)"))

    def small_targets(self, min_px=44):
        """列出小於 min_px 的**控制項**（按鈕／輸入／導覽元件）。

        內文段落裡的行內文獻連結不計入——它們是文字的一部分，
        把它們撐成 44px 反而會破壞排版，也不是觸控目標規範的本意。
        那些另外回報在 inline_links()。
        """
        return self.js(f"""(function(){{
          const out = [];
          document.querySelectorAll(
            'a,button,[role=button],[role=radio],[role=tab],[role=option],'
            + 'summary,input,select,textarea,[onclick],[tabindex]')
            .forEach(el => {{
              const r = el.getBoundingClientRect();
              const st = getComputedStyle(el);
              if (st.display === 'none' || st.visibility === 'hidden') return;
              if (r.width === 0 || r.height === 0) return;
              if (el.type === 'hidden') return;
              // 行內文字連結：display:inline 且被有實質文字的段落包著 → 不算控制項
              if (el.tagName === 'A' && st.display === 'inline') {{
                const p = el.parentElement;
                const ptxt = p ? (p.innerText || '').trim().length : 0;
                const etxt = (el.innerText || '').trim().length;
                if (ptxt > etxt + 12) return;
              }}
              if (r.width < {min_px} || r.height < {min_px}) {{
                out.push({{tag: el.tagName.toLowerCase(),
                          cls: (el.className || '').toString().slice(0, 40),
                          w: Math.round(r.width), h: Math.round(r.height),
                          text: (el.innerText || el.value || '').trim().slice(0, 24)}});
              }}
            }});
          return out.slice(0, 60);
        }})()""") or []

    def inline_links(self, min_px=44):
        """內文行內連結中小於 min_px 者（僅供參考，不列入觸控目標違規）。"""
        return self.js(f"""(function(){{
          const out = [];
          document.querySelectorAll('a').forEach(el => {{
            const st = getComputedStyle(el);
            if (st.display !== 'inline') return;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            const p = el.parentElement;
            const ptxt = p ? (p.innerText || '').trim().length : 0;
            const etxt = (el.innerText || '').trim().length;
            if (ptxt <= etxt + 12) return;
            if (r.width < {min_px} || r.height < {min_px}) {{
              out.push({{w: Math.round(r.width), h: Math.round(r.height),
                        text: (el.innerText || '').trim().slice(0, 30)}});
            }}
          }});
          return out.slice(0, 40);
        }})()""") or []


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


# ────────────────────────────── 指令列 ──────────────────────────────
def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--script", help="要在頁面上執行的 JS 檔（可做點擊等操作）")
    ap.add_argument("--eval", dest="expr", help="直接執行一段 JS 並印出結果")
    ap.add_argument("--shot")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--size", default="1440x900")
    ap.add_argument("--mobile", action="store_true")
    ap.add_argument("--theme", choices=["light", "dark"])
    ap.add_argument("--reduced-motion", action="store_true")
    ap.add_argument("--wait", type=float, default=1.0)
    ap.add_argument("--console", action="store_true")
    ap.add_argument("--audit", action="store_true",
                    help="印出橫向溢出與過小的觸控目標")
    a = ap.parse_args()

    w, h = (int(x) for x in a.size.lower().split("x"))
    with Browser(width=w, height=h, mobile=a.mobile, color_scheme=a.theme,
                 reduced_motion=a.reduced_motion) as b:
        b.open(a.url)
        b.wait(a.wait)
        if a.script:
            src = open(a.script, encoding="utf-8").read()
            try:
                print(b.js("(function(){\n" + src + "\n})()"))
            except RuntimeError as e:
                print(e, file=sys.stderr)
        if a.expr:
            print(b.js(a.expr))
        if a.shot:
            print("截圖：" + b.shot(a.shot, full=a.full))
        if a.audit:
            print(f"橫向溢出：{b.overflow_x()} px")
            small = b.small_targets()
            print(f"小於 44px 的可點目標：{len(small)} 個")
            for s in small[:15]:
                print(f"   {s['tag']}.{s['cls'][:24]} {s['w']}×{s['h']} 「{s['text']}」")
        if a.console or a.audit:
            errs = b.console_errors()
            print(f"console 錯誤：{len(errs)}")
            for e in errs[:10]:
                print("   " + str(e)[:160])
    return 0


if __name__ == "__main__":
    sys.exit(main())
