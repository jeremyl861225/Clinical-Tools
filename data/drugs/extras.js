/* 藥卡補充層 —— 手寫，**不由 build_cards.py 產生**，以藥品八碼為鍵。
 *
 * 為什麼要獨立一層：data/drugs/<pid>.js 由 work/drugcards/build_cards.py 從台大
 * 藥劑部網站的快取重建，重跑就整個覆蓋。有些院內資料不在那些網頁上（流速調整
 * nomogram 出自台大的教育文件／簡報），寫進 <pid>.js 會在下次重建時消失，
 * 所以放這裡；drug-database.js 在展開藥卡時把本檔的欄位併到該規格上。
 *
 * 鍵＝藥品八碼（variant.code），不是商品名——同一張卡可能含多個八碼，
 * 只有真正適用的那個規格才掛（heparin 的封管沖洗液與透析用抗凝血劑不適用治療性輸注）。
 */
window.DRUGDB_EXTRA = {

  /* Heparin Injection 25000 IU/5 mL/vial —— 治療性連續輸注的流速調整。
     來源：台大醫院 anti-Xa assay for heparin（2023）院內文件所附兩張表。
     兩表都以 **Heparin 濃度 100 U/mL** 為前提（25000 IU 稀釋至 250 mL），
     ml/h 的增減量只有在這個濃度下才成立，換濃度就不能照抄。
     anti-Xa 與 aPTT 是同一列的兩種判讀方式，擇一使用。
     原表最高與最低那兩列的範圍欄是空白的（見 note 的 † 說明）。 */
  HEP1EA13: {
    titrate: [
      {
        title: 'VTE（DVT／PE）',
        sub: 'Heparin conc. 100 U/mL',
        rows: [
          { x: 'Initial', a: 'Initial', b: '80 IU/kg', s: '－', r: '15–18 U/kg/h' },
          { x: '< 0.1 †', a: '< 40 †', b: '5000 IU', s: '－', r: '↑ 3 mL/h' },
          { x: '0.1–0.19', a: '40–49', b: '3000 IU', s: '－', r: '↑ 2 mL/h' },
          { x: '0.2–0.29', a: '50–59', b: '－', s: '－', r: '↑ 1.5 mL/h' },
          { x: '0.3–0.7', a: '60–85', b: '－', s: '－', r: 'No change', hi: 1 },
          { x: '0.71–0.8', a: '86–95', b: '－', s: '－', r: '↓ 1 mL/h' },
          { x: '0.81–0.9', a: '96–120', b: '－', s: '30 分鐘', r: '↓ 1 mL/h' },
          { x: '> 0.9 †', a: '> 120 †', b: '－', s: '60 分鐘', r: '↓ 1.5 mL/h' }
        ]
      },
      {
        title: 'ACS（急性冠心症）',
        sub: 'Heparin conc. 100 U/mL',
        rows: [
          { x: 'Initial', a: 'Initial', b: '60 IU/kg', s: '－', r: '10–12 U/kg/h' },
          { x: '< 0.1 †', a: '< 40 †', b: '3000 IU', s: '－', r: '↑ 1 mL/h' },
          { x: '0.1–0.19', a: '40–49', b: '－', s: '－', r: '↑ 1 mL/h' },
          { x: '0.2–0.6', a: '50–75', b: '－', s: '－', r: 'No change', hi: 1 },
          { x: '0.61–0.7', a: '76–85', b: '－', s: '－', r: '↓ 1 mL/h' },
          { x: '0.71–0.8', a: '86–100', b: '－', s: '30 分鐘', r: '↓ 1 mL/h' },
          { x: '> 0.8 †', a: '> 100 †', b: '－', s: '60 分鐘', r: '↓ 2 mL/h' }
        ]
      }
    ],
    titrateNote: '標色那列（No change）為目標治療區間；原表以綠底標示。'
      + 'anti-Xa 與 aPTT 擇一判讀，不必兩者都符合。'
      + '† 原表最低與最高那兩列的範圍欄留空，此處依相鄰區間補上，非原文標示。'
      + '開始輸注後每 6 小時追蹤 aPTT，直到連續穩定於治療區間，之後可改每日一次。',
    titrateSrc: '台大醫院 anti-Xa assay for heparin（2023）院內文件'
  }
};
