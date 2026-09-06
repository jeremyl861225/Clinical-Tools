---
name: 臨床工具箱 Clinical Tools
description: 骨白紙上的墨字，零圓角零陰影髮絲線；句子是狀態，臨床數值是版面上最大的東西。
colors:
  sentence-bg: "#efece1"
  sentence-bg2: "#e6e2d4"
  sentence-bg3: "#dcd7c6"
  sentence-fg: "#1f1f1d"
  sentence-fg2: "#474643"
  sentence-dim: "#706e69"
  sentence-line: "#c3bda9"
  sentence-line2: "#a8a18b"
  sentence-inv-bg: "#1f1f1d"
  sentence-inv-fg: "#efece1"
  sentence-hot: "#ab0027"
  sentence-warn: "#954b00"
  sentence-calm: "#2b5f45"
  sentence-mid: "#615e09"
  classic-ink: "#1f1f1d"
  classic-paper: "#f4f2ec"
  classic-panel: "#ffffff"
  classic-line: "#d8d3c4"
  classic-accent: "#40263a"
  classic-accent-soft: "#dbd5d3"
  classic-accent2: "#820b33"
  classic-accent2-soft: "#e4d2d2"
  classic-muted: "#5b5a57"
  tile-accent: "#ed893a"
  pal-ink: "#1f1f1d"
  pal-plum: "#40263a"
  pal-wine: "#820b33"
  pal-crimson: "#cb2e3e"
  pal-orange: "#ed893a"
typography:
  display:
    fontFamily: "Iowan Old Style, Georgia, Noto Serif TC, Songti TC, serif"
    fontSize: "clamp(20px, 3.6vw, 26px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
  title:
    fontFamily: "Iowan Old Style, Georgia, Noto Serif TC, Songti TC, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Noto Sans TC, PingFang TC, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "ui-monospace, SF Mono, Menlo, Roboto Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.22em"
  metric:
    fontFamily: "Iowan Old Style, Georgia, Noto Serif TC, Songti TC, serif"
    fontSize: "clamp(30px, 26cqi, 46px)"
    fontWeight: 600
    lineHeight: 1
rounded:
  none: "0px"
  hairline: "2px"
  pill: "999px"
components:
  card:
    backgroundColor: "transparent"
    textColor: "{colors.sentence-fg}"
    rounded: "{rounded.none}"
    padding: "14px 15px 10px"
  result:
    backgroundColor: "{colors.sentence-bg2}"
    textColor: "{colors.sentence-fg}"
    rounded: "{rounded.none}"
    padding: "16px 16px 13px"
  metric-value:
    textColor: "{colors.sentence-fg}"
    typography: "{typography.metric}"
  back-btn:
    backgroundColor: "transparent"
    textColor: "{colors.sentence-fg}"
    rounded: "{rounded.none}"
    padding: "7px 12px"
    height: "44px"
  section-title:
    textColor: "{colors.sentence-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  tool-card:
    backgroundColor: "{colors.classic-panel}"
    textColor: "{colors.classic-ink}"
    rounded: "{rounded.hairline}"
    padding: "13px 16px"
---

# Design System: 臨床工具箱 Clinical Tools

## Overview

**Creative North Star: "造句設計"**

這不是一套借來的比喻，是這個專案自己長出來的設計語言，寫在 `css/ui-sentence.css` 的檔頭。
它的核心信條只有一句：**句子即狀態、退詞即返回、網址即句子**。使用者不是在選單裡找頁面，
是在造一個句子——「我遇到 / 腹部的 / 癌症」——句子造完，畫面就是答案。退掉一個詞就是上一步。

視覺跟著這個信條走：**骨白紙上的墨字**（亮色 `#efece1` / `#14211c`），
暗色反過來是極深墨綠底配骨白字（`#0a1512` / `#ece6d8`）。
全站零圓角、零陰影、一律髮絲線，字型全部用系統字、不載入任何外部字體——
離線是產品鐵則，字型不能是例外。

密度高、對比硬、不裝飾。這是給受過訓練的人在急診走廊上單手用的東西，
版面上每一格墨都要換到資訊。裝飾性的東西一律不放，
包括那些讓工具「看起來友善」的圓角、柔和陰影與漸層。

**明確的反面參照**（使用者指定，不得漂移過去）：

- **醫療 App 的親切風**——大圓角、粉藍淡綠、插畫人物、鼓勵語句。臨床工具不是衛教 App。
- **AI 生的那種頁**——紫藍漸層 hero、Inter 配維素體、emoji 當標題記號、每個區塊都是圓角卡片。
- **紙本教科書的死板**——印刷質感可以，但不能失去工具性。點得動、算得出來、查得到，是底線。

**Key Characteristics:**

- 骨白／墨的雙色底，臨床色只在臨床語意上出現
- 零圓角、零陰影、1px 髮絲線；深度靠色階與線，不靠光
- 系統字堆疊，零外部載入
- serif 標題 ＋ mono 標籤 ＋ sans 內文的三聲部
- 版面上最大的元素永遠是臨床數值
- 兩套主題並存：造句設計為預設，正式版（classic）可切換，兩者不得互相污染

## Colors

骨白與墨是紙與字；臨床色是訊號，不是版面元素。

**2026-09 換版：五色一組的暖色階。** 近黑 → 深梅 → 酒紅 → 緋紅 → 橘。
兩件事**照舊不動**：米白底與虎鯨的顏色。

**分工原則：深色成員承載文字、亮色成員承載填色。** 這不是美感問題而是量出來的——
緋紅在米白上只有 4.44、橘只有 2.15，當內文都不到 AA 的 4.5。所以臨床語意色用的是
它們**加深後**的變體，原色留給燈號填色、圖磚與螢光筆。換版後每一個角色的對比都與
換版前等值或更好（hot 6.33→6.43、warn 5.31→5.41、accent 6.50→11.41、accent2 5.51→8.68），
**沒有任何一項無障礙退步**。

### Palette（五個原色，只在下面的角色裡出現）

| Token | Hex | 亮底對比 | 角色 |
|---|---|---|---|
| `--pal-ink` | `#1f1f1d` | 13.96 | 內文、反白底 |
| `--pal-plum` | `#40263a` | 11.41 | 導覽主強調 |
| `--pal-wine` | `#820b33` | 8.68 | 第二強調、文字選取 |
| `--pal-crimson` | `#cb2e3e` | 4.44 | **只做填色**（燈號、急迫徽章） |
| `--pal-orange` | `#ed893a` | 2.15 | **只做填色**（螢光筆、圖磚） |

### Primary

- **骨白 Bone White** (`#efece1`)：造句設計的紙。所有內容坐在它上面。暗色模式換成極深墨綠 `#0a1512`。**照舊不動。**
- **墨 Ink** (`#1f1f1d`)：文字、強邊框、反白區塊的底。色票的近黑，暖的黑。

### Secondary（臨床嚴重度，僅此用途）

- **緋紅（加深）** (`#ab0027`)：最高急迫度／危險。暗色 `#fd5f66`。
- **橘（加深）** (`#954b00`)：中等。暗色直接用原色 `#ed893a`（深底上不必加深）。
- **墨綠 Ink Green** (`#2b5f45`)：低／安全。暗色 `#79b58e`。**照舊不動——
  這套色票裡沒有「安全」色，拿暖色當低風險會把臨床語意講反。**
- **橄欖 Olive** (`#615e09`)：墨綠與新 warn 之間的過渡，**只給癌症頁的 T×N 決策格用**。

### Tertiary（正式版主題）

- **深梅 Plum** (`#40263a`)：正式版的主強調色，用於區段標題、焦點、卡片 hover 邊框。
- **酒紅 Wine** (`#820b33`)：第二強調色，用於「返回來源頁」鍵與勾選項；也是文字選取的底色。
- **橘 Orange** (`#ed893a`)：圖磚焦點環、「剛才所在的入口」脈動，以及**螢光筆**。

### Neutral

- **髮絲線 Hairline** (`#c3bda9` / 較重的 `#a8a18b`)：所有分隔與外框。**照舊不動**（本來就是米白的家族）。
- **次要墨 Ink 2** (`#474643`)：副標與說明文字。
- **弱墨 Dim** (`#706e69`)：eyebrow、單位、註記。
  中性灰一律在**墨↔紙的軸上**取值，不從色票推——用色票推會被彩度放大成偏橄欖的灰。

### 感受性階序（菌譜資料庫專用）

「這支藥對這隻菌有多好」自成一條階序，**越亮＝越有效**，與臨床嚴重度（越紅＝越危險）
方向相反——兩者在不同的表上、不會同時出現，各自的圖例都寫明了方向。

| 級距 | 亮色 | 暗色 | 說明 |
|---|---|---|---|
| 無效 `--sn` | `#40263a` 深梅 | `#5e4357` | 塊上骨白字 11.41 |
| 變異 `--s0` | `#820b33` 酒紅 | `#a33850` | 8.68 |
| 有效 `--s1` | `#c82a3c` 緋紅加深 | `#ed595f` | 4.61（原色 `#cb2e3e` 只有 4.44，不到 AA） |
| 強效 `--s2` | `#ed893a` 橘實心 ＋ 墨字 | 同左 | 6.48；**橘只能當底不能當字**（當字只有 2.15） |

文字版是 `--sh-lo/--sh-mid/--sh-ok/--sh-hi`（`.sLo/.sMid/.sOk/.sHi`），
同一條階序但全部收在文字安全的明度範圍內。

### Named Rules

**臨床色不做導覽的規則。** 加深緋紅／加深橘／墨綠三色**只用於臨床嚴重度**，
永遠不拿來當導覽色、分類色或裝飾色。使用者看到紅色就該是「這件事危險」，
不能是「這是第三個分頁」。酒紅（結構）與緋紅（臨床）雖同屬紅色家族，但明度差得夠開——
換版前的鏽紅 `#a13d2f` 與硃砂 `#97331d` 其實更接近，這一項是變好不是變差。

**深色承載文字、亮色承載填色的規則。** `--pal-crimson` 與 `--pal-orange`
**永遠不可以直接當內文顏色**，它們在米白上分別只有 4.44 與 2.15。要當文字就用加深變體。

**三重編碼規則。** 嚴重度一律以**格數／邊框粗細 ＋ 文字 ＋ 色**至少三重編碼。
色盲、灰階列印、強光下的手機螢幕都不能讓資訊消失。單靠顏色傳遞嚴重度的設計一律不通過。

## Typography

**Display / 標題字：** Iowan Old Style（fallback Georgia → Noto Serif TC → Songti TC → serif）
**Body / 內文字：** 系統 sans（-apple-system → BlinkMacSystemFont → Noto Sans TC → PingFang TC）
**Label / 資料字：** 系統 mono（ui-monospace → SF Mono → Menlo → Roboto Mono）
正式版主題另用 Inter（sans）與 IBM Plex Mono（mono）。

**Character:** serif 負責「這是一份可引用的文件」，mono 負責「這是一個欄位／一個數值」，
sans 負責讀。三者分工嚴格，不混用——serif 不拿去做標籤，mono 不拿去做長段落。

### Hierarchy

- **Display**（serif 500，`clamp(20px, 3.6vw, 26px)`，字距 .06em）：頁首 h1。
- **Title**（serif 600，17px）：工具名、器官名、區塊主標。
- **Body**（sans 400，13px／行高 1.62）：內文。正式版為 15px／1.55。
- **Label**（mono 400，10px，字距 .22em，全大寫）：eyebrow、區段標題、欄位單位。
- **Metric**（serif 600，容器查詢驅動，實測 2 欄 × 176px 下約 45.8px）：結果面板的臨床數值。

### Named Rules

**最大的東西是臨床數值的規則。** 結果面板的數值用容器查詢隨欄寬縮放，
下限不得低於 44px。專案裡有過一次教訓：欄寬從 172px 改窄到 112px，
數值被壓到 30px，「畫面上最大的東西是答案」這件事就沒了。欄寬與字級要一起看。

**三聲部不混用的規則。** serif = 文件／標題／數值，mono = 標籤／欄位／單位，sans = 內文。
一個元素只能屬於一個聲部。

## Layout

單欄捲動，內容容器 `max-width: 820px` 置中。body padding `20px 14px 60px`。
頁首是固定的三件組：eyebrow（mono 全大寫）、h1（serif）、sub（副標），下方一條 2px 墨線收尾。

結果區用 `grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))` 自動分欄；
最小欄寬 120px 是硬下限，改小會連帶壓掉數值字級（見上方 Named Rule）。

視窗鎖定裝置寬度：`touch-action: manipulation` 取消輕點兩下放大，
`text-size-adjust: 100%` 阻止 iOS 橫放自行放大字級。版面不靠使用者縮放來補救。

**動態：** 見下方獨立的 Motion 一節。

### Named Rules

**44px 規則。** 所有可觸控目標至少 44px。這是造句設計獨有的要求，
理由是使用情境包含在急診站著單手操作。

**不讓整頁橫向溢出的規則。** 表格與橫向清單一律自己 `overflow-x: auto`，
永遠不讓 body 產生橫向捲動。

**不動文字節點的規則。** 樣式層只加樣式：不用 `text-overflow: ellipsis` 截字、
不用 `display: none` 藏內容、不用 `order` 或 `flex-direction: row-reverse` 改變閱讀順序。
臨床資訊不能因為版面而消失或改順序。圖形記號可以用 `::before/::after` 的 content 做
（已驗證不會混進 `innerText`）。

## Elevation & Depth

**這套系統沒有陰影。** `--sentence-shadow: none`；全庫 214 處 `border-radius: 0`。
深度完全由三件事表達：**底色階**（`bg` / `bg2` / `bg3` 三層骨白）、**髮絲線**（1px）、
**邊框粗細**（一般 1px，需要強調時 2px 實墨框）。

唯一出現的 box-shadow 都是 `inset` 的焦點環或狀態環（例如 `0 0 0 3px var(--accent-soft)` 的
輸入框聚焦、`inset 0 0 0 2px rgba(201,162,39,.5)` 的金色圖磚脈動），
它們是**狀態訊號不是層次**。

### Named Rules

**平的規則。** 表面永遠是平的。要讓某個東西「浮起來」的唯一手段是把它的邊框從 1px 換成 2px，
或把底色換到下一階。不准引入投影。

## Motion 動態

**核心比喻：上墨。** 新出現的資訊不是滑進來、也不是淡進來，是**沿著閱讀方向被畫上去**的。
句子裡的詞由左而右上墨、流程圖的下一步由上而下上墨、改變的數字亮一道螢光。
這是「骨白紙上的墨字」這套語言自己的動法，不是借來的介面慣例——
把它拿掉，畫面不會只是少了裝飾，而是看不出「剛剛那一下造成了什麼」。

### 時間軸

`css/styles.css` 的 `:root`（全站共用，兩套主題都吃）：

| Token | 值 | 用在哪 |
|---|---|---|
| `--mo-tap` | 110ms | 按下的當下 |
| `--mo-fast` | 180ms | 一般狀態切換 |
| `--mo-slow` | 260ms | 上墨、展開、換版 |
| `--mo-exit` | 140ms | 收起 |
| `--mo-ease` | `cubic-bezier(.22,.61,.36,1)` | 全部 |

造句設計另有一組同義的 `--sentence-fast/slow/ease`（早於本系統，維持不動）。

### Named Rules

**不做位移、不做投影的規則。** 「平的規則」說表面永遠是平的，要浮起來只能換邊框粗細或
底色階。動態層因此沒有任何 `translate`／`scale`／當層次用的 `box-shadow`；
唯一的 inset box-shadow 是按壓回饋，那屬於 Elevation 一節允許的「狀態訊號」。

**不做入場的規則。** 捲到哪裡就淡出一塊，是裝飾不是回饋，全站不做。
唯一的例外是開場畫面（見下），那是**開啟 App** 這個事件的回饋，不是頁面內容的入場。

**收起比展開快的規則。** 使用者已經知道自己要收起什麼，不必再看一次過程。

**只標記真的變了的東西的規則。** 造句導覽的 `renderRow()`／`renderPointer()` 是
`innerHTML` 整塊重畫，節點每次都是新的——所以 `transition` 在狀態切換時**永遠不會觸發**，
能動的只有新節點上的 `@keyframes`。但反過來，不加判斷就等於每畫一次全部重播一次：
退掉一個詞，沒被動到的另外兩格也會跟著閃。`js/sentence-nav.js` 的 `moPrev`／`moPrevN`
負責這個判斷。**另有一個實測到的陷阱：點一個詞會觸發 3 次 `renderHome()`**
（點擊、網址同步、再一次），第 1 次畫出來的節點帶著記號、動畫開始跑，第 2 次就把它整塊
換掉，動畫等於沒播過。解法不是去改重繪次數（那是導覽最核心的一段），而是讓記號在
`MO_HOLD = 700ms` 的窗口內存活。

### 動在哪裡

| 事件 | 動態 | 掛在哪 |
|---|---|---|
| 按下任何可點的東西 | 中性灰 inset 填色，無 transition（要當下就有） | `css/styles.css` `:active` |
| 詞落進句子 | 由左而右上墨（連同標示面向的下底線一起畫出來） | `.sent-chip.is-landed` |
| 「指向 N 件事」變了 | 底色階往上跳一階再退回（520ms） | `.sent-point-n.is-changed b` |
| 流程圖出現下一步 | 由上而下上墨 | `.flow-step.flow-revealed` |
| 建議處置換了 | 標籤→標題→細節→附註依序淡入，總長 290ms | `.flow-rec.rec-landed` |
| `<details>` 展開 | 由上而下上墨（`::details-content`，漸進增強） | `css/styles.css` |
| PWA 開場 | 整片墨色收斂成一頭虎鯨 | `index.html` 的 `splash:start` 區段 |

按壓回饋刻意用**中性灰**（`rgba(128,128,128,.14)`）而不是主題色：這一段是共用層，
用 `--hover-bg` 之類的正式版變數會把正式版的暖白帶進造句設計，兩套主題不得互相污染。
`.sc-x:hover` 本來就是用 `rgba(128,128,128,…)`，不是新發明的手法。

### 開場畫面（唯一的作者級時刻）

只在**以 PWA 獨立視窗開啟**且**該分頁工作階段的第一次**播放，隨手一點即跳過，全長 0.98 秒。
整片墨色蓋滿畫面、中央一枚骨白的腸絨毛圖（就是桌面圖示），墨色縮小之後才看出來
**那片黑本身是一頭虎鯨**。

- 虎鯨的 73 個頂點是拿 `js/orca.js` **自己的剖面控制點**在純側面 θ=90° 下算出來的側視剪影
  ——那個角度投影會退化成 2D，所以剪影可以離線算死。牠因此跟游在首頁上的是同一頭鯨。
- 腸絨毛是從 `icons/icon-512.png` 描出來的輪廓，與桌面圖示逐像素相同。
- **錨點必須落在肚子上**（0.692, 0.639）：錨點若落在背鰭那一欄，算出來要放到 60 倍視窗高
  （約 48,000px，瀏覽器撐不住）；移到腹側之後 390×844 只要 17.6 倍就蓋得滿。
- 兩個主題都**以近黑開場**。暗色不可以直接沿用「墨＝前景色」那一套：暗色的前景是骨白，
  開場會變成一整片骨白鋪滿螢幕——半夜在病房開 App 等於閃光彈。

### 關掉動態效果時

`prefers-reduced-motion` **不是把動態全部關掉**，是減少位移、保留意義：
上墨改成純淡入、依序出現的延遲歸零、開場不做收斂只停一下，
但**按下的回饋與「這個數字剛換過」的螢光一律保留**——那些是回饋，不是裝飾。


## Shapes

**方角。** `border-radius: 0` 是預設值，正式版少數元件用 2px（卡片、按鈕、輸入框）作為微弱的軟化，
造句設計把它們一併歸零。唯二的例外是資料型徽章的 pill（`999px`，例如器官分數）與圓形指示點（`50%`）——
它們圓是因為那是「一顆數值」的形狀，不是為了柔和。

邊框是這套系統的主要造形語言：1px 髮絲線劃分區域，2px 實墨框標示結果，
虛線（`1px dashed`）標示補充關係。

## Components

### 卡片 Card

- **形狀：** 方角（0）。造句設計為透明底 ＋ 1px `line2` 外框；正式版為白底 ＋ 1px `line` 外框、2px 圓角。
- **內距：** `14px 15px 10px`（造句）／`16px 18px`（正式版）。
- **陰影：** 無。

### 工具卡 Tool Card（首頁清單的簽名元件）

- **形狀：** 2px 圓角，左側 3px 粗邊。
- **靜止：** 左邊框為 `accent-soft`，幾乎看不見。
- **Hover：** 左邊框與外框同時轉為 `accent` 實色，底色換到 `hover-bg`。轉場 150ms。
- **性格：** 這是「精確、克制、不招手」的具體樣貌——卡片安靜地待著，只在你碰它時給一條線的回饋。
- **決策流程卡** 用 `accent2`（鏽紅）走同一套邏輯，與計分工具卡分流。

### 結果面板 Result

- **造句設計：** `bg2` 底 ＋ **2px 實墨外框**，方角，內距 `16px 16px 13px`。
- **正式版：** 反白深色板（`#132126` 底、`#f4f2ec` 字），不隨主題切換——答案永遠是蓋上去的一塊。
- **內部：** mono 全大寫的 `metric-label`（10.5px，字距 .08em）＋ serif 巨型 `metric-value`。

### 返回鍵 Back Button

- **形狀：** 方角，1px 線框，透明底，mono 12px。
- **堆疊：** 直向、右對齊、間距 6px。「返回來源頁」鍵（由 `js/backlink.js` 自動注入）
  用 `accent2` 邊框與文字，與「返回主選單」在顏色上分流。
- **高度：** ≥44px。

### 輸入欄 Field

- **形狀：** 1px 線框、方角（正式版 2px）、`field-bg` 底。
- **Focus：** `:focus-within` 時邊框轉 `accent`，外加 `0 0 0 3px var(--accent-soft)` 的柔環，
  同時左側 icon 也轉 `accent`。轉場 180ms。
- **數值輸入** 一律 mono 14.5px，寬度 110px。

### 螢光筆 Highlighter（2026-09 新增，全站唯一的「標重點」手勢）

- **形狀：** 一道**手繪**的麥克筆筆觸——略帶傾斜、上下緣起伏、起筆處疊一層（筆停頓的地方較深）、
  下緣壓一條積墨。整段是內嵌 SVG（離線可用、不發請求），顏色烘在檔案裡，
  所以亮暗兩套各有一份（`--hl-img`）。
- **顏色：** 橘 `#ed893a`，亮色 0.34 疊加、暗色 0.30。墨字壓在上面仍有 10.4 的對比。
- **用在哪：** `<mark>`（內文刻意標記）、`<strong>`（強調語意，全站僅 28 處）、
  `.gs-hl`（搜尋命中，全站最高頻的落點）、`.hl`（要刻意標重點時自己加）、
  首頁「這句話目前指向 **N** 件事」的那個數字，以及**決策流程「建議處置」裡的粗體**
  ——那是整條流程的答案，粗體就是重點。
- **兩支筆：** 一般版（0.34）給淺底；濃版 `--hl-img-deep`（約 0.52）只給**正式版**
  的建議處置面板，那裡是深色實心板，一般版疊上去幾乎看不見。
  造句設計的建議面板是淺底，用的仍是一般版。
- **換行：** `box-decoration-break: clone`，換行的每一段各自得到一筆，
  不會被拉成一條橫跨兩行的怪東西。

**用量規則。** 螢光筆**刻意不掛在 `<b>` 上**：全站 `<b>` 有 19,058 個（臨床內文用它標關鍵詞），
螢光筆一旦變成常態就不再是強調。它只出現在「使用者自己找的東西」（搜尋命中）
與「作者刻意標的東西」（`<mark>`／`.hl`）上。

**頁面不得自己定義 `mark`。** 頁內 `<style>` 排在外部樣式表之後，
自己寫一條 `mark{background:…}` 就會把螢光筆整條蓋掉（`background` 簡寫會把
`background-image` 一併重設成 `none`）。tools/heart-failure.html 曾經這樣，已移除。

### 區段標題 Section Title

- mono 10px、字距 .2em、全大寫、`dim` 色，下方一條 1px 墨線。
- 這是全站最常見的結構記號，它把長頁面切成可掃視的段落。

## Do's and Don'ts

### Do:

- **Do** 用邊框粗細與底色階製造層次（1px → 2px，`bg` → `bg2` → `bg3`）。
- **Do** 讓臨床數值成為版面上最大的元素，下限 44px。
- **Do** 把嚴重度做成三重編碼：格數／粗細 ＋ 文字 ＋ 色。
- **Do** 讓表格自己 `overflow-x: auto`。
- **Do** 用系統字堆疊；離線是鐵則。
- **Do** 讓新出現的資訊「上墨」——沿著閱讀方向被畫出來，而不是滑進來或淡進來。
- **Do** 在動之前先確認「這一下真的變了嗎」；沒變就不要動（見 Motion 的 `moPrev`）。
- **Do** 把造句設計的規則全部寫在 `[data-ui="sentence"]` 之下，
  這樣「關閉時等於這個檔案不存在」是可以被證明的。

### Don't:

- **Don't** 加投影。這套系統沒有光源；動態層也一樣，沒有 translate／scale／投影。
- **Don't** 做入場動畫或捲動揭露。頁面內容不該因為「被看到」而動。
- **Don't** 在共用層用正式版的色票變數（`--hover-bg` 等）做回饋，會污染造句設計。
- **Don't** 給任何東西圓角，除了 pill 型數值徽章與圓點。
- **Don't** 拿臨床嚴重度三色（加深緋紅／加深橘／墨綠）當導覽色或裝飾色。
- **Don't** 拿 `--pal-crimson`／`--pal-orange` 當內文顏色，它們在米白上只有 4.44／2.15。
- **Don't** 把螢光筆掛到 `<b>` 或任何常態出現的標記上——常態的強調等於沒有強調。
- **Don't** 用 `ellipsis` 截字、用 `display: none` 藏內容、用 `order` 改變閱讀順序。
- **Don't** 載入外部字體。
- **Don't** 混用三聲部（serif 標籤、mono 長文都不行）。
- **Don't** 動 `css/styles.css`、`css/nav.css` 既有選擇器來達成造句設計的效果——
  兩套主題必須維持互不污染，這是可用 `baseline.py --compare` 驗證的契約。
