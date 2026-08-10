/* =========================================================================
   SITES — 感染部位 → 型態 → 建議 regimen（引用 DRUGS 的 key）
   regimen: {role:'first'|'alt'|'special', label, drugs:[key...], dur, note}
   ========================================================================= */
window.SITES = [
  {id:'bacteremia', name:'菌血症 / 敗血症', en:'Bacteremia / Sepsis', icon:'🩸',
   types:[
     {name:'不明來源之敗血症（經驗性）', en:'Sepsis, source unknown',
      note:'先抽兩套血液培養再給藥；一小時內開始。廣覆蓋 GNB(含 Pseudomonas)，若休克／院內／有 MRSA 風險加抗 MRSA。找到來源後儘速降階。',
      regimens:[
        {role:'first', label:'抗綠膿 β-lactam ± 抗 MRSA', drugs:['piptazo'], dur:'找到來源後計算，一般 7–14 天', note:'或 cefepime／meropenem 擇一。有 MRSA 風險(留置導管、近期住院、已知移生)加 vancomycin。'},
        {role:'first', label:'抗綠膿 + 抗 MRSA（休克／高風險）', drugs:['cefepime','vancomycin'], dur:'依來源，7–14 天', note:'血流動力不穩、免疫低下或 MRSA 高風險時的組合。'},
        {role:'alt', label:'β-lactam 過敏替代', drugs:['aztreonam','vancomycin'], dur:'依來源，7–14 天', note:'嚴重 β-lactam 過敏；必要時加 aminoglycoside 補 GNB 協同。'}
      ]},
     {name:'導管相關血流感染 CRBSI', en:'Catheter-related BSI',
      note:'考慮移除感染導管。經驗性覆蓋 MRSA(常為葡萄球菌)，重症加 GNB(含 Pseudomonas)。',
      regimens:[
        {role:'first', label:'抗 MRSA', drugs:['vancomycin'], dur:'拔管後：S. aureus ≥14 天、CoNS 5–7 天', note:'最常見致病菌為 coagulase-negative staph／S. aureus。'},
        {role:'first', label:'抗 MRSA + 抗綠膿（重症／免疫低下／股靜脈導管）', drugs:['vancomycin','cefepime'], dur:'GNB 7–14 天；念珠菌 血培養轉陰後 14 天', note:'加 GNB 覆蓋；念珠菌風險(TPN、廣效抗生素、多部位移生)加 micafungin。'},
        {role:'alt', label:'daptomycin（vancomycin MIC 高或不耐受）', drugs:['daptomycin'], dur:'依病原，S. aureus ≥14 天', note:'菌血症用 8–10 mg/kg。'},
        {role:'alt', label:'Teicoplanin（台灣常用，可替代 vancomycin）', drugs:['teicoplanin'], dur:'依病原，S. aureus ≥14 天', note:'穩定之導管相關感染合理替代；須給足 loading dose 並監測 trough。已排除／未合併心內膜炎時尤佳。'}
      ]},
     {name:'MRSA 菌血症（培養確診）', en:'MRSA bacteremia',
      note:'需找感染源、移除異物、追蹤血培養轉陰、評估心內膜炎。療程自血培養轉陰起算。',
      regimens:[
        {role:'first', label:'Vancomycin（TDM 目標 AUC/MIC 400–600）', drugs:['vancomycin'], dur:'血培養轉陰起 ≥14 天；有併發症 4–6 週'},
        {role:'first', label:'Daptomycin 8–10 mg/kg', drugs:['daptomycin'], dur:'血培養轉陰起 ≥14 天', note:'vancomycin 失敗、MIC ≥2 或腎毒性時。不可用於肺源。'},
        {role:'alt', label:'Ceftaroline（頑固性、合併用藥）', drugs:['ceftaroline'], dur:'血培養轉陰起 ≥14 天'},
        {role:'alt', label:'Teicoplanin（台灣常用替代，需足量）', drugs:['teicoplanin'], dur:'血培養轉陰起 ≥14 天', note:'台灣常用；須給足 loading dose、trough 目標較高。合併心內膜炎／深部感染或療效不佳時仍以 vancomycin／daptomycin 為主，並會診感染科。'}
      ]},
     {name:'Gram 陰性菌血症（腸道菌）', en:'Gram-negative bacteremia',
      note:'依培養與抗藥性降階。ESBL 首選 carbapenem；CRE 用新型 BLI。多數可短療程。',
      regimens:[
        {role:'first', label:'Ceftriaxone（感受性 Enterobacterales）', drugs:['ceftriaxone'], dur:'7 天（穩定、感染源已控制）～14 天'},
        {role:'first', label:'Meropenem（ESBL）', drugs:['meropenem'], dur:'7–14 天'},
        {role:'special', label:'Ceftazidime-avibactam（CRE）', drugs:['ceftazavi'], dur:'依病原與反應，常 ≥14 天', note:'需感染科／抗生素管理審核。'}
      ]},
     {name:'念珠菌血症', en:'Candidemia',
      note:'移除中心導管；眼底檢查；血培養轉陰後 14 天療程。中重症／不穩定先用 echinocandin。',
      regimens:[
        {role:'first', label:'Micafungin（echinocandin，首選）', drugs:['micafungin'], dur:'血培養轉陰後 14 天'},
        {role:'alt', label:'Fluconazole（穩定、未曾用 azole、感受性）', drugs:['fluconazole'], dur:'血培養轉陰後 14 天'}
      ]}
   ]},

  {id:'transplant', name:'移植後 / 免疫低下感染', en:'Post-transplant / Immunocompromised', icon:'🧬',
   types:[
     {name:'發熱性中性球低下（經驗性）', en:'Febrile neutropenia',
      note:'ANC <500。緊急給抗綠膿單藥；有低血壓／黏膜炎／導管感染／已知 MRSA 移生加 vancomycin。持續發燒 4–7 天加抗黴菌。',
      regimens:[
        {role:'first', label:'抗綠膿 β-lactam 單藥', drugs:['cefepime'], dur:'至 ANC 恢復且退燒無感染徵象', note:'或 pip-tazo／meropenem。'},
        {role:'first', label:'加抗 MRSA（不穩定／導管／黏膜炎）', drugs:['cefepime','teicoplanin'], dur:'至 ANC 恢復；有病灶依病灶', note:'台灣以 teicoplanin 為首選（once-daily、腎毒性較低）；vancomycin 為替代。若確診 MRSA 菌血症／心內膜炎或肺源，改以 vancomycin／daptomycin／linezolid。'},
        {role:'special', label:'持續發燒加經驗性抗黴菌', drugs:['micafungin'], dur:'依黴菌感染評估', note:'高風險黴菌感染另考慮 voriconazole／L-AmB(本表未列)。'}
      ]},
     {name:'肺囊蟲肺炎 PJP', en:'Pneumocystis (PJP)',
      note:'移植／長期類固醇／HIV 之乾咳、低血氧、雙側浸潤。中重症(PaO₂<70)加類固醇。',
      regimens:[
        {role:'first', label:'高劑量 TMP-SMX', drugs:['tmpsmx'], dur:'21 天'},
        {role:'alt', label:'Clindamycin ＋ primaquine（磺胺不耐，primaquine 未列）', drugs:['clindamycin'], dur:'21 天', note:'primaquine 需先驗 G6PD。'}
      ]},
     {name:'PJP 預防', en:'PJP prophylaxis',
      note:'實體器官／幹細胞移植、長期高劑量類固醇之預防。',
      regimens:[
        {role:'first', label:'TMP-SMX single-DS（每日或每週三次）', drugs:['tmpsmx'], dur:'免疫抑制期間持續（常 6–12 個月以上）'}
      ]},
     {name:'CMV 感染 / 病', en:'CMV infection',
      note:'移植後常見；依 CMV DNA(PCR)監測，D+/R− 高風險。減免疫抑制。',
      regimens:[
        {role:'first', label:'Valganciclovir（口服）／Ganciclovir（靜脈，重症）', drugs:['valganciclovir','ganciclovir'], dur:'至症狀緩解且病毒量連續轉陰，常 ≥2–3 週'}
      ]},
     {name:'侵襲性念珠菌感染', en:'Invasive candidiasis',
      note:'移植、腹部手術、TPN、廣效抗生素之高風險族群。',
      regimens:[
        {role:'first', label:'Micafungin（echinocandin）', drugs:['micafungin'], dur:'血培養轉陰後 14 天（深部感染更久）'},
        {role:'alt', label:'Fluconazole（穩定、感受性）', drugs:['fluconazole'], dur:'血培養轉陰後 14 天'}
      ]}
   ]},

  {id:'iai', name:'腹腔內感染 IAI', en:'Intra-abdominal Infection', icon:'🫁',
   types:[
     {name:'社區型・輕中度', en:'Community-acquired, mild–moderate',
      note:'如穿孔性闌尾炎、憩室炎。須涵蓋腸道 GNB＋厭氧。搭配感染源控制(引流／手術)。',
      regimens:[
        {role:'first', label:'Ertapenem 單藥', drugs:['ertapenem'], dur:'感染源控制後 4–5 天'},
        {role:'first', label:'Ceftriaxone ＋ Metronidazole', drugs:['ceftriaxone','metronidazole'], dur:'感染源控制後 4–5 天'},
        {role:'alt', label:'β-lactam 過敏：FQ ＋ Metronidazole', drugs:['ciprofloxacin','metronidazole'], dur:'感染源控制後 4–5 天'}
      ]},
     {name:'社區型・高風險 / 重度', en:'Community-acquired, high-risk / severe',
      note:'APACHE II 高、高齡、免疫低下、感染源控制延遲。擴大覆蓋含 Pseudomonas。',
      regimens:[
        {role:'first', label:'Piperacillin-tazobactam', drugs:['piptazo'], dur:'感染源控制後 4–7 天'},
        {role:'first', label:'Meropenem（重症／曾用抗生素）', drugs:['meropenem'], dur:'感染源控制後 4–7 天'},
        {role:'alt', label:'Cefepime ＋ Metronidazole', drugs:['cefepime','metronidazole'], dur:'感染源控制後 4–7 天'}
      ]},
     {name:'院內型 / 術後', en:'Healthcare-associated / postoperative',
      note:'依院內抗藥圖譜；覆蓋 Pseudomonas、ESBL，MRSA 風險或已移生者加抗 MRSA，念珠菌風險加抗黴菌。',
      regimens:[
        {role:'first', label:'抗綠膿 β-lactam（± MRSA／抗黴菌）', drugs:['meropenem'], dur:'感染源控制後 4–7 天', note:'或 pip-tazo／cefepime+metronidazole。MRSA 風險加 vancomycin；上消化道穿孔／TPN 念珠菌風險加 micafungin。'},
        {role:'special', label:'加抗 MRSA', drugs:['teicoplanin'], dur:'同主方案', note:'台灣以 teicoplanin 為首選（once-daily、腎毒性較低）；vancomycin 為替代。'},
        {role:'special', label:'加抗黴菌（念珠菌風險）', drugs:['micafungin'], dur:'依培養與反應'}
      ]},
     {name:'急性膽道感染', en:'Acute cholangitis / cholecystitis',
      note:'膽道感染以腸道 GNB 為主；中重度膽管炎需儘速膽道引流(ERCP)。腸球菌覆蓋依嚴重度。',
      regimens:[
        {role:'first', label:'Ceftriaxone ＋ Metronidazole', drugs:['ceftriaxone','metronidazole'], dur:'感染源控制後 4–5 天', note:'膽腸吻合／複雜性以厭氧覆蓋為要。'},
        {role:'first', label:'Piperacillin-tazobactam（中重度／院內）', drugs:['piptazo'], dur:'感染源控制後 4–7 天', note:'一併覆蓋腸球菌與 Pseudomonas。'}
      ]},
     {name:'感染性胰臟壞死', en:'Infected pancreatic necrosis',
      note:'僅在確診感染性壞死時給抗生素；選擇能穿透胰臟壞死組織者(carbapenem／FQ／metronidazole)。',
      regimens:[
        {role:'first', label:'Meropenem', drugs:['meropenem'], dur:'依清創與臨床反應，常 2–4 週'},
        {role:'alt', label:'Ciprofloxacin ＋ Metronidazole', drugs:['ciprofloxacin','metronidazole'], dur:'依清創與臨床反應，常 2–4 週'}
      ]},
     {name:'胃腸穿孔', en:'Hollow viscus perforation',
      note:'胃腸道穿孔導致腹腔內感染／腹膜炎，須涵蓋腸道 GNB＋厭氧，並依上／下消化道來源、社區／院內、嚴重度決定廣度與是否加抗黴菌／抗 MRSA。感染源控制（手術修補／引流）為關鍵：上消化道（胃／十二指腸）穿孔迅速修補且低風險者療程可短；下消化道（結腸）穿孔厭氧與 GNB 菌量高、污染重，療程與廣度依污染程度與感染源控制而定。',
      regimens:[
        {role:'first', label:'社區型：Ceftriaxone ＋ Metronidazole（或 Ertapenem）', drugs:['ceftriaxone','metronidazole'], dur:'感染源控制後 4–5 天'},
        {role:'first', label:'院內／重症／曾用抗生素：Piperacillin-tazobactam 或 Meropenem', drugs:['piptazo'], dur:'感染源控制後 4–7 天'},
        {role:'special', label:'加抗黴菌（見下方適應症）', drugs:['micafungin'], dur:'依培養與反應', note:'Candida 於上消化道穿孔常見。指徵：上消化道（胃／十二指腸）穿孔、術後或院內型、反覆滲漏、重症敗血症、免疫低下、長期 TPN／廣效抗生素、腹腔／引流培養出念珠菌。單純社區型下消化道穿孔且低風險者通常不需。'},
        {role:'special', label:'加抗 MRSA（院內／已移生）', drugs:['teicoplanin'], dur:'同主方案', note:'台灣以 teicoplanin 為首選（once-daily、腎毒性較低）；vancomycin 為替代；深部感染需足量並監測 trough。'}
      ]},
     {name:'腸阻塞 / 麻痺性腸阻塞', en:'Ileus / bowel obstruction',
      note:'單純機械性或麻痺性腸阻塞本身不是抗生素適應症。僅在懷疑絞扼(strangulation)、腸壞死、穿孔或腹膜炎時才給藥。',
      regimens:[
        {role:'none', label:'單純腸阻塞：不需經驗性抗生素', drugs:[], note:'無腸壞死／穿孔／腹膜炎徵象者以鼻胃管減壓、禁食、輸液處理即可；不建議常規預防性抗生素。手術前預防性給藥另見「術後 / 外科」。'},
        {role:'special', label:'疑絞扼／腸壞死／穿孔：比照社區型 IAI', drugs:['piptazo'], dur:'感染源控制後 4–7 天', note:'覆蓋腸道 GNB＋厭氧；重症／曾用抗生素改 meropenem。'}
      ]},
     {name:'腸缺血 / 腸系膜缺血', en:'Ischemic bowel / mesenteric ischemia',
      note:'腸黏膜屏障破壞、細菌移位，中重度建議廣效抗生素覆蓋腸道菌叢＋厭氧，並儘速處理血流(手術／血管介入)。',
      regimens:[
        {role:'first', label:'Piperacillin-tazobactam', drugs:['piptazo'], dur:'依手術與臨床反應，常 4–7 天', note:'一併覆蓋 GNB(含 Pseudomonas)、厭氧與腸球菌。'},
        {role:'alt', label:'Ceftriaxone ＋ Metronidazole（輕中度）', drugs:['ceftriaxone','metronidazole'], dur:'依臨床反應'},
        {role:'special', label:'透壁壞死／需腸切除：比照重度 IAI', drugs:['meropenem'], dur:'術後 4–7 天'}
      ]},
     {name:'消化道出血', en:'GI bleeding',
      note:'抗生素僅在特定情境有適應症：肝硬化併靜脈曲張／上消化道出血需預防性抗生素（Baveno VII，可降低細菌感染與再出血、改善存活）。非靜脈曲張、非肝硬化之出血（消化性潰瘍、小腸、大腸）本身不是抗生素適應症，除非合併穿孔、缺血、憩室炎或敗血症。',
      regimens:[
        {role:'first', label:'食道／胃靜脈曲張出血（肝硬化）：Ceftriaxone 預防', drugs:['ceftriaxone'], dur:'最多 7 天（止血穩定可提早停）', note:'首選 1 g/day，尤其進展期肝硬化或當地 quinolone 抗藥率高者（Baveno VII）。'},
        {role:'alt', label:'靜脈曲張出血之替代：Fluoroquinolone', drugs:['ciprofloxacin'], dur:'最多 7 天', note:'傳統為 norfloxacin 口服；本表以 ciprofloxacin 代表此類。'},
        {role:'none', label:'消化性潰瘍出血：不需預防性抗生素', drugs:[], note:'非靜脈曲張性上消化道出血不需常規抗生素。H. pylori 陽性者於病情穩定後給根除療程（屬計畫性治療，非急性經驗用藥）。'},
        {role:'none', label:'小腸出血：不需抗生素', drugs:[], note:'血管發育不良、腫瘤、Meckel 憩室、小腸潰瘍等本身無感染指徵。'},
        {role:'none', label:'大腸出血（憩室、血管發育不良、痔瘡等）：不需抗生素', drugs:[], note:'單純下消化道出血不需抗生素；僅合併憩室炎、缺血性腸炎、穿孔或敗血症時，比照對應之腹腔內感染給藥。'}
      ]},
     {name:'痔瘡出血', en:'Hemorrhoid bleeding',
      note:'單純痔瘡出血沒有感染指徵，不是抗生素適應症。',
      regimens:[
        {role:'none', label:'單純痔瘡出血：不需抗生素', drugs:[], note:'僅在合併肛周膿瘍、蜂窩性組織炎、壞死性感染、免疫低下或術後感染時才給藥。'},
        {role:'special', label:'合併肛周膿瘍／蜂窩性組織炎', drugs:['amoxclav'], dur:'依感染控制', note:'重症／免疫低下比照腹會陰壞死性感染廣效覆蓋(見 SSTI 壞死性感染)。'}
      ]}
   ]},

  {id:'uti', name:'泌尿道感染 UTI', en:'Urinary Tract Infection', icon:'🚻',
   types:[
     {name:'單純性膀胱炎', en:'Uncomplicated cystitis',
      note:'非孕、無結構異常之下泌尿道感染。優先窄效、短療程口服。',
      regimens:[
        {role:'first', label:'Nitrofurantoin', drugs:['nitrofurantoin'], dur:'5 天'},
        {role:'first', label:'TMP-SMX（當地抗藥率 <20%）', drugs:['tmpsmx'], dur:'3 天'},
        {role:'alt', label:'Fosfomycin（含部分 ESBL）', drugs:['fosfomycin'], dur:'單一劑量'}
      ]},
     {name:'急性腎盂腎炎', en:'Acute pyelonephritis',
      note:'上泌尿道感染／發燒。門診可口服 FQ；住院／嘔吐用靜脈。避免 nitrofurantoin／fosfomycin(組織濃度不足)。',
      regimens:[
        {role:'first', label:'Ceftriaxone（住院起始）', drugs:['ceftriaxone'], dur:'β-lactam 10–14 天'},
        {role:'first', label:'Ciprofloxacin／Levofloxacin（門診口服）', drugs:['ciprofloxacin'], dur:'FQ 5–7 天'},
        {role:'alt', label:'ESBL 風險：Ertapenem／Meropenem', drugs:['ertapenem'], dur:'10–14 天'}
      ]},
     {name:'複雜性 / 導管相關 UTI', en:'Complicated / catheter-associated',
      note:'結構異常、留置導管、男性、免疫低下。依培養與院內抗藥圖譜，覆蓋含 Pseudomonas；儘量移除／更換導管。',
      regimens:[
        {role:'first', label:'Piperacillin-tazobactam', drugs:['piptazo'], dur:'7 天（迅速改善）～14 天'},
        {role:'first', label:'Cefepime', drugs:['cefepime'], dur:'7–14 天'},
        {role:'special', label:'ESBL：Meropenem／Ertapenem', drugs:['meropenem'], dur:'7–14 天'}
      ]},
     {name:'急性細菌性攝護腺炎', en:'Acute bacterial prostatitis',
      note:'需組織穿透良好者；療程較長。',
      regimens:[
        {role:'first', label:'Ciprofloxacin／Levofloxacin', drugs:['ciprofloxacin'], dur:'2–4 週'},
        {role:'alt', label:'TMP-SMX', drugs:['tmpsmx'], dur:'2–4 週'},
        {role:'alt', label:'重症住院：Ceftriaxone', drugs:['ceftriaxone'], dur:'2–4 週（可先靜脈後口服接續）'}
      ]}
   ]},

  {id:'pneumonia', name:'肺炎 / 呼吸道', en:'Pneumonia / Respiratory', icon:'🫀',
   types:[
     {name:'社區型肺炎・門診', en:'CAP, outpatient',
      note:'無共病之門診 CAP。需覆蓋肺炎鏈球菌與非典型菌。',
      regimens:[
        {role:'first', label:'Amoxicillin-clavulanate ＋ Macrolide／Doxycycline', drugs:['amoxclav','azithromycin'], dur:'最少 5 天且退燒穩定 48–72 小時', note:'或以呼吸道 FQ 單藥替代。'},
        {role:'first', label:'呼吸道 FQ 單藥', drugs:['levofloxacin'], dur:'最少 5 天', note:'或 moxifloxacin。'}
      ]},
     {name:'社區型肺炎・住院（非 ICU）', en:'CAP, inpatient non-ICU',
      note:'β-lactam ＋ macrolide，或呼吸道 FQ 單藥。',
      regimens:[
        {role:'first', label:'Ceftriaxone ＋ Azithromycin', drugs:['ceftriaxone','azithromycin'], dur:'5–7 天'},
        {role:'first', label:'呼吸道 FQ 單藥', drugs:['levofloxacin'], dur:'5–7 天'}
      ]},
     {name:'社區型肺炎・重度 / ICU', en:'CAP, severe / ICU',
      note:'β-lactam ＋（macrolide 或 FQ）。評估 MRSA(壞死／流感後)與 Pseudomonas 風險並加藥。',
      regimens:[
        {role:'first', label:'Ceftriaxone ＋ Azithromycin', drugs:['ceftriaxone','azithromycin'], dur:'7 天（依反應）'},
        {role:'special', label:'MRSA 風險加抗 MRSA', drugs:['vancomycin'], dur:'7 天以上', note:'或 linezolid(肺穿透佳)。'},
        {role:'special', label:'Pseudomonas 風險改抗綠膿 β-lactam', drugs:['piptazo'], dur:'7 天以上', note:'或 cefepime／meropenem＋FQ。'}
      ]},
     {name:'院內 / 呼吸器相關肺炎 HAP/VAP', en:'HAP / VAP',
      note:'依院內抗藥圖譜。覆蓋 Pseudomonas＋MRSA；多重抗藥風險用雙抗綠膿。',
      regimens:[
        {role:'first', label:'抗綠膿 β-lactam ＋ 抗 MRSA', drugs:['cefepime','vancomycin'], dur:'7 天', note:'β-lactam 可用 pip-tazo／meropenem；抗 MRSA 可用 linezolid。'},
        {role:'special', label:'MDR 風險加第二抗綠膿', drugs:['amikacin'], dur:'7 天', note:'或抗綠膿 FQ；避免同類雙藥。'},
        {role:'alt', label:'MDR Pseudomonas：Ceftolozane-tazobactam／Ceftazidime-avibactam', drugs:['ceftolotazo'], dur:'7 天（依反應）'}
      ]},
     {name:'吸入性肺炎 / 膿胸', en:'Aspiration pneumonia',
      note:'厭氧覆蓋依情境；社區吸入多可用 amoxclav。膿胸需引流。',
      regimens:[
        {role:'first', label:'Ampicillin-sulbactam', drugs:['ampsulbactam'], dur:'5–7 天（膿胸／壞死性較長）'},
        {role:'alt', label:'Amoxicillin-clavulanate（門診口服）', drugs:['amoxclav'], dur:'5–7 天'},
        {role:'alt', label:'β-lactam 過敏：Moxifloxacin', drugs:['moxifloxacin'], dur:'5–7 天'}
      ]}
   ]},

  {id:'ssti', name:'皮膚軟組織 SSTI', en:'Skin & Soft-Tissue Infection', icon:'🩹',
   types:[
     {name:'非化膿性蜂窩性組織炎', en:'Non-purulent cellulitis',
      note:'多為 β-hemolytic streptococci／MSSA。無膿瘍者初始不需常規覆蓋 MRSA。',
      regimens:[
        {role:'first', label:'Cefazolin（靜脈）／Cephalexin（口服）', drugs:['cefazolin'], dur:'5–6 天（可依反應延長）'},
        {role:'alt', label:'β-lactam 過敏：Clindamycin', drugs:['clindamycin'], dur:'5–6 天'}
      ]},
     {name:'化膿性 / 膿瘍（MRSA）', en:'Purulent / abscess (MRSA)',
      note:'核心處置為切開引流；中重度加覆蓋 CA-MRSA 的抗生素並送膿液培養。',
      regimens:[
        {role:'first', label:'Teicoplanin（住院／重度，台灣首選）', drugs:['teicoplanin'], dur:'引流後 5–7 天', note:'SSTI 非 CNS 感染，teicoplanin 與 vancomycin 療效相當且 once-daily、可 IM、腎毒性較低，適合 OPAT／腎功能不佳者；深部感染需足量。'},
        {role:'first', label:'口服：TMP-SMX 或 Doxycycline', drugs:['tmpsmx'], dur:'引流後 5–7 天', note:'門診輕中度 CA-MRSA。'},
        {role:'alt', label:'Vancomycin（替代）', drugs:['vancomycin'], dur:'引流後 5–7 天'},
        {role:'alt', label:'Linezolid（口服替代／頑固）', drugs:['linezolid'], dur:'引流後 5–7 天'}
      ]},
     {name:'壞死性軟組織感染', en:'Necrotizing fasciitis',
      note:'外科急症——緊急清創為第一要務。廣效經驗性＋抑毒素(clindamycin)；確診 A 群鏈球菌可降階 penicillin＋clindamycin。',
      regimens:[
        {role:'first', label:'廣效 β-lactam ＋ 抗 MRSA ＋ Clindamycin', drugs:['piptazo','vancomycin','clindamycin'], dur:'至不需再清創且臨床穩定後', note:'clindamycin 用於抑制外毒素合成。'},
        {role:'alt', label:'β-lactam 過敏：Meropenem 替代 pip-tazo', drugs:['meropenem','vancomycin','clindamycin'], dur:'至不需再清創且臨床穩定後'}
      ]},
     {name:'糖尿病足感染', en:'Diabetic foot infection',
      note:'依嚴重度與是否慢性／曾用抗生素決定廣度；評估骨髓炎與缺血。輕度可窄效，中重度覆蓋 GNB＋厭氧±MRSA。',
      regimens:[
        {role:'first', label:'輕度：Amoxicillin-clavulanate', drugs:['amoxclav'], dur:'1–2 週'},
        {role:'first', label:'中重度：Piperacillin-tazobactam（± 抗 MRSA）', drugs:['piptazo'], dur:'軟組織 2–3 週；合併骨髓炎更久', note:'MRSA 風險或已移生加 vancomycin 或 teicoplanin（後者 once-daily、適合長療程／OPAT、腎毒性較低）。'},
        {role:'special', label:'加抗 MRSA：Teicoplanin（台灣常用）或 Vancomycin', drugs:['teicoplanin'], dur:'依感染控制', note:'糖尿病足常需較長療程，teicoplanin once-daily／可 IM／腎毒性低而適合；需足量並監測 trough。'},
        {role:'alt', label:'β-lactam 過敏：FQ ＋ Metronidazole（± vancomycin）', drugs:['ciprofloxacin','metronidazole'], dur:'2–3 週'}
      ]},
     {name:'肛周膿瘍', en:'Perianal / anorectal abscess',
      note:'核心處置為切開引流。單純肛周膿瘍引流後多數不需抗生素；有蜂窩性組織炎、全身感染徵象、免疫低下／糖尿病／中性球低下、人工瓣膜或深部（坐骨直腸窩／骨盆直腸）膿瘍時才給。覆蓋腸道 GNB＋厭氧。',
      regimens:[
        {role:'none', label:'單純膿瘍引流後：多數不需抗生素', drugs:[], note:'免疫正常、無蜂窩性組織炎或全身感染徵象者，充分引流即可。'},
        {role:'first', label:'門診（有蜂窩性組織炎）：Amoxicillin-clavulanate', drugs:['amoxclav'], dur:'依感染控制，約 5–7 天'},
        {role:'first', label:'住院／重度：Ceftriaxone ＋ Metronidazole（或 Pip-tazo）', drugs:['ceftriaxone','metronidazole'], dur:'依感染控制'},
        {role:'special', label:'免疫低下／中性球低下：涵蓋 Pseudomonas', drugs:['piptazo'], dur:'依感染控制', note:'此族群肛周感染可迅速惡化；及早廣效並會診。'}
      ]}
   ]},

  {id:'endocarditis', name:'感染性心內膜炎', en:'Infective Endocarditis', icon:'💗',
   types:[
     {name:'原生瓣膜・經驗性', en:'Native valve, empiric',
      note:'血流動力學穩定者先取 ≥3 套血培養等結果；急性／重症才經驗給藥。覆蓋 S. aureus(含 MRSA)＋鏈球菌＋腸球菌。感染科／心臟科會診。',
      regimens:[
        {role:'first', label:'Vancomycin ＋ Ceftriaxone', drugs:['vancomycin','ceftriaxone'], dur:'依病原重新計算，通常 4–6 週', note:'涵蓋 MRSA、鏈球菌、HACEK；培養結果出來後降階。'},
        {role:'alt', label:'Vancomycin ＋ Gentamicin（腸球菌考量）', drugs:['vancomycin','gentamicin'], dur:'4–6 週', note:'gentamicin 用協同劑量；留意腎毒性。'}
      ]},
     {name:'Viridans 鏈球菌 / S. bovis（感受性）', en:'Viridans strep / S. bovis',
      note:'penicillin 感受性原生瓣膜心內膜炎，預後較佳。',
      regimens:[
        {role:'first', label:'Penicillin G 或 Ceftriaxone', drugs:['penG'], dur:'4 週（單藥）', note:'加 gentamicin 協同可縮短為 2 週(選擇性病人)。'},
        {role:'first', label:'Ceftriaxone（方便門診靜脈治療）', drugs:['ceftriaxone'], dur:'4 週'},
        {role:'alt', label:'Vancomycin（β-lactam 過敏）', drugs:['vancomycin'], dur:'4 週'}
      ]},
     {name:'腸球菌 Enterococcus', en:'Enterococcal',
      note:'需細胞壁藥＋協同(aminoglycoside 或雙 β-lactam)。檢驗高濃度 aminoglycoside 抗性(HLAR)。',
      regimens:[
        {role:'first', label:'Ampicillin ＋ Ceftriaxone', drugs:['ampicillin','ceftriaxone'], dur:'6 週', note:'E. faecalis 首選之一，尤其 HLAR 陽性或欲避免腎毒性。'},
        {role:'alt', label:'Ampicillin ＋ Gentamicin', drugs:['ampicillin','gentamicin'], dur:'4–6 週', note:'需 HLAR 陰性；監測腎功能。'}
      ]},
     {name:'葡萄球菌（原生瓣膜）', en:'Staphylococcal, native valve',
      note:'S. aureus 原生瓣膜心內膜炎，病程猛烈。',
      regimens:[
        {role:'first', label:'MSSA：Nafcillin／Oxacillin 或 Cefazolin', drugs:['nafcillin'], dur:'6 週', note:'非嚴重過敏可用 cefazolin。'},
        {role:'first', label:'MRSA：Vancomycin 或 Daptomycin', drugs:['vancomycin'], dur:'6 週', note:'daptomycin 8–10 mg/kg 為替代。'}
      ]},
     {name:'人工瓣膜（葡萄球菌）', en:'Prosthetic valve, staphylococcal',
      note:'PVE 常需外科；葡萄球菌採三合一含 rifampin。感染科會診必要。',
      regimens:[
        {role:'first', label:'MRSA：Vancomycin ＋ Rifampin ＋ Gentamicin', drugs:['vancomycin','rifampin','gentamicin'], dur:'Vanco/Rifampin ≥6 週；Gentamicin 前 2 週', note:'MRSA PVE 標準三合一；rifampin 待菌血症清除後加入。'},
        {role:'special', label:'MSSA：Nafcillin ＋ Rifampin ＋ Gentamicin', drugs:['nafcillin','rifampin','gentamicin'], dur:'Nafcillin/Rifampin ≥6 週；Gentamicin 前 2 週'}
      ]}
   ]},

  {id:'bonejoint', name:'骨與關節感染', en:'Bone & Joint Infection', icon:'🦴',
   types:[
     {name:'急性骨髓炎（經驗性）', en:'Acute osteomyelitis, empiric',
      note:'成人以 S. aureus 為主；儘量取骨培養／血培養再給藥。依 MRSA 風險決定經驗覆蓋。',
      regimens:[
        {role:'first', label:'Teicoplanin（涵蓋 MRSA 經驗，台灣首選）', drugs:['teicoplanin'], dur:'≥4–6 週', note:'骨關節長療程 once-daily、可 IM、腎毒性較低；需足量並監測 trough（骨感染目標較高）。確認 MSSA 後降階 cefazolin／nafcillin。'},
        {role:'alt', label:'Vancomycin（替代）', drugs:['vancomycin'], dur:'≥4–6 週'},
        {role:'first', label:'Cefazolin 或 Nafcillin（MSSA 確診）', drugs:['cefazolin'], dur:'4–6 週'},
        {role:'alt', label:'加 GNB 覆蓋（免疫低下／術後／植入物）', drugs:['cefepime'], dur:'4–6 週'}
      ]},
     {name:'化膿性關節炎', en:'Septic arthritis',
      note:'關節引流／沖洗＋抗生素。經驗覆蓋 MRSA；性活躍年輕者考慮淋病(N. gonorrhoeae)。',
      regimens:[
        {role:'first', label:'Teicoplanin ＋ Ceftriaxone', drugs:['teicoplanin','ceftriaxone'], dur:'3–4 週', note:'ceftriaxone 覆蓋 GNB 與淋球菌；抗 MRSA 台灣以 teicoplanin 為首選，vancomycin 為替代。'},
        {role:'alt', label:'Teicoplanin ＋ Cefepime（GNB／Pseudomonas 風險）', drugs:['teicoplanin','cefepime'], dur:'3–4 週'}
      ]},
     {name:'人工關節感染 PJI', en:'Prosthetic joint infection',
      note:'常需清創或更換假體；葡萄球菌加 rifampin(生物膜)。感染科會診。',
      regimens:[
        {role:'first', label:'Teicoplanin ＋ Rifampin', drugs:['teicoplanin','rifampin'], dur:'依手術策略，靜脈後常口服接續共 3–6 個月', note:'抗 MRSA 台灣以 teicoplanin 為首選（vancomycin 為替代）；rifampin 僅在保留假體之清創、傷口乾燥且引流管移除後加入。'},
        {role:'special', label:'MSSA：Nafcillin／Cefazolin ＋ Rifampin', drugs:['nafcillin','rifampin'], dur:'同上'}
      ]},
     {name:'糖尿病足骨髓炎', en:'Diabetic foot osteomyelitis',
      note:'延續糖尿病足感染；骨髓炎療程較長，依骨培養與是否手術切除決定。',
      regimens:[
        {role:'first', label:'Piperacillin-tazobactam（± 抗 MRSA）', drugs:['piptazo'], dur:'未切除 6 週；完全切除感染骨 2–5 天～2 週', note:'MRSA 風險加 vancomycin。'},
        {role:'alt', label:'FQ ＋ Metronidazole（± Vancomycin）', drugs:['ciprofloxacin','metronidazole'], dur:'同上'}
      ]}
   ]},

  {id:'cns', name:'中樞神經系統感染', en:'CNS Infection', icon:'🧠',
   types:[
     {name:'社區型細菌性腦膜炎（經驗性）', en:'Community-acquired meningitis',
      note:'醫療急症——立即經驗治療，勿因等影像／腰椎穿刺而延遲。疑肺炎鏈球菌先／同時給 dexamethasone。>50 歲或免疫低下加 ampicillin 覆蓋 Listeria。',
      regimens:[
        {role:'first', label:'Vancomycin ＋ Ceftriaxone（高劑量）', drugs:['vancomycin','ceftriaxone'], dur:'依病原：腦膜炎雙球菌 7 天、肺炎鏈球菌 10–14 天', note:'ceftriaxone 2 g q12h；併用 dexamethasone。CNS 感染請用 vancomycin，勿以 teicoplanin 替代（CSF 穿透差）。'},
        {role:'special', label:'>50 歲／免疫低下加 Ampicillin（Listeria）', drugs:['ampicillin'], dur:'Listeria ≥21 天'}
      ]},
     {name:'院內 / 術後腦膜炎（含分流）', en:'Healthcare-associated meningitis',
      note:'神經外科術後、腦室外引流／分流。覆蓋 MRSA＋Pseudomonas；常需移除感染裝置。',
      regimens:[
        {role:'first', label:'Vancomycin ＋ Cefepime', drugs:['vancomycin','cefepime'], dur:'依病原與裝置處理，常 10–14 天以上', note:'cefepime 2 g q8h。'},
        {role:'alt', label:'Vancomycin ＋ Meropenem', drugs:['vancomycin','meropenem'], dur:'依病原，常 10–14 天以上', note:'meropenem 2 g q8h。'}
      ]},
     {name:'疑似病毒性腦炎（HSV）', en:'Suspected HSV encephalitis',
      note:'意識改變／發燒／局部神經學徵象／顳葉病灶。不要延遲 acyclovir，常與細菌性腦膜炎經驗治療併行至排除。',
      regimens:[
        {role:'first', label:'Acyclovir（經驗，充分水化）', drugs:['acyclovir'], dur:'HSV 確診 14–21 天', note:'PCR 陰性且臨床不符可停藥。'}
      ]}
   ]},

  {id:'postop', name:'術後 / 外科（一般外科）', en:'Postoperative / General Surgery', icon:'',
   types:[
     {name:'手術預防性抗生素（依手術類別）', en:'Surgical prophylaxis',
      note:'切皮前 60 分鐘內給單劑靜脈抗生素（vancomycin／FQ 需 120 分鐘）；長手術超過建議間隔或失血 >1500 mL 術中再給；多數乾淨／乾淨-污染手術術後不需續用（≤24 小時）。劑量依體重：cefazolin <120 kg 2 g、≥120 kg 3 g。',
      regimens:[
        {role:'first', label:'多數手術（乾淨／乾淨-污染：上消化道、肝膽、疝氣含 mesh、乳房、腹壁）：Cefazolin', drugs:['cefazolin'], dur:'切皮前單劑；一般 ≤24 小時', note:'長手術每 4 小時重給一次。'},
        {role:'first', label:'大腸直腸 / 闌尾 / 穿透腸道：Cefazolin ＋ Metronidazole', drugs:['cefazolin','metronidazole'], dur:'切皮前單劑', note:'另建議術前機械性腸道準備＋口服抗生素(neomycin＋erythromycin 或 metronidazole)。'},
        {role:'alt', label:'台灣常用替代：Cefmetazole 單藥（含厭氧覆蓋）', drugs:['cefmetazole'], dur:'切皮前單劑'},
        {role:'alt', label:'β-lactam 嚴重過敏：Clindamycin（±Gentamicin）／Vancomycin', drugs:['clindamycin'], dur:'切皮前單劑', note:'需覆蓋 GNB 時加 gentamicin／aztreonam；MRSA 移生者加／改 vancomycin。'}
      ]},
     {name:'術後腹腔感染 / 吻合口滲漏', en:'Postop peritonitis / anastomotic leak',
      note:'屬院內型腹腔內感染；覆蓋 Pseudomonas、ESBL、腸球菌，並依風險加抗 MRSA／抗黴菌。感染源控制（引流／再手術）是關鍵。',
      regimens:[
        {role:'first', label:'Piperacillin-tazobactam', drugs:['piptazo'], dur:'感染源控制後 4–7 天', note:'重症／曾用抗生素改 meropenem。'},
        {role:'special', label:'加抗 MRSA（風險／已移生）', drugs:['teicoplanin'], dur:'同主方案', note:'台灣以 teicoplanin 為首選（once-daily、腎毒性較低）；vancomycin 為替代。'},
        {role:'special', label:'加抗黴菌（見下一型態之適應症）', drugs:['micafungin'], dur:'依培養與反應'}
      ]},
     {name:'術後何時加抗黴菌（腹腔念珠菌）', en:'When to add antifungal',
      note:'術後腹腔感染是否加 Candida 覆蓋的判斷。符合下列指徵者建議經驗性抗黴菌。',
      regimens:[
        {role:'special', label:'符合指徵 → Echinocandin（首選，不穩定／曾用 azole／中重症）', drugs:['micafungin'], dur:'依感染源控制與培養，血培養陽性者轉陰後 14 天', note:'指徵：上消化道穿孔／滲漏、反覆手術或吻合口滲漏、院內型 IAI、免疫低下、重症敗血症、長期 TPN、久用廣效抗生素、腹腔／引流培養出念珠菌。'},
        {role:'alt', label:'穩定、未曾用 azole、感受性 → Fluconazole', drugs:['fluconazole'], dur:'依培養與反應'},
        {role:'none', label:'不符指徵：不需常規抗黴菌', drugs:[], note:'單純社區型、低風險、下消化道來源且無上述危險因子者，不需常規經驗性抗黴菌。'}
      ]},
     {name:'術後傷口感染 SSI', en:'Surgical site infection',
      note:'淺層 SSI 常只需拆線引流；深部／器官腔隙依部位處理。經驗覆蓋依手術類別與 MRSA 風險。',
      regimens:[
        {role:'first', label:'乾淨手術、無 MRSA 風險：Cefazolin', drugs:['cefazolin'], dur:'依清創與反應'},
        {role:'first', label:'MRSA 風險／已移生：Teicoplanin（台灣首選）', drugs:['teicoplanin'], dur:'依反應', note:'台灣以 teicoplanin 為首選（once-daily、可 IM、腎毒性較低）；vancomycin 為替代。'},
        {role:'alt', label:'腸道／會陰手術：Cefazolin ＋ Metronidazole', drugs:['cefazolin','metronidazole'], dur:'依反應', note:'或直接用 pip-tazo。'}
      ]},
     {name:'術後發燒之感染源評估', en:'Postop fever workup',
      note:'術後發燒鑑別（Wind 肺、Water 尿路、Wound 傷口、Walking DVT、Wonder-drug 藥物、導管）；先找來源，避免無來源亂投廣效抗生素。',
      regimens:[
        {role:'none', label:'無明確感染源：不需經驗性抗生素', drugs:[], note:'術後 48 小時內發燒多為非感染性（如 atelectasis）。系統評估各來源；有腹瀉查 C. difficile。'},
        {role:'special', label:'導管相關血流感染：見「菌血症 → CRBSI」', drugs:['vancomycin'], dur:'見 CRBSI'},
        {role:'special', label:'C. difficile 腸炎', drugs:['vancomycinPO'], dur:'10 天', note:'口服 vancomycin 125 mg q6h（或 fidaxomicin，本表未列）；停用誘發之抗生素。'}
      ]}
   ]},

  {id:'sti', name:'性傳染病 STI', en:'Sexually Transmitted Infections', icon:'🧫',
   types:[
     {name:'尿道炎 / 子宮頸炎', en:'Urethritis / Cervicitis (NGU)',
      note:'先以 NAAT 驗淋病與披衣菌，但不等結果即經驗治療。非淋菌性尿道炎（NGU）首選 doxycycline。治療期間及性伴侶完成治療前禁性行為 7 天。性伴侶（症狀出現／診斷前 60 天內）須一併評估治療。持續／復發者查 M. genitalium 與 T. vaginalis。',
      regimens:[
        {role:'first', label:'非淋菌性尿道炎 NGU／子宮頸炎：Doxycycline', drugs:['doxycycline'], dur:'100 mg bid ×7 天', note:'子宮頸炎若淋病風險高或當地盛行率高，同時給 ceftriaxone 500 mg IM。'},
        {role:'alt', label:'替代：Azithromycin 單劑', drugs:['azithromycin'], dur:'1 g 單劑；或 500 mg 首劑後 250 mg qd ×4 天'},
        {role:'special', label:'持續／復發 NGU：先驗 M. genitalium／T. vaginalis', drugs:['metronidazole'], dur:'滴蟲 2 g 單劑（或 tinidazole 2 g）', note:'與女性有性行為之男性且當地滴蟲盛行者，可先推定治療滴蟲；其餘（含 MSM）驗 M. genitalium 後依抗藥性給兩階段療法。'}
      ]},
     {name:'淋病・單純性（子宮頸／尿道／直腸／咽部）', en:'Uncomplicated gonorrhea',
      note:'CDC 2021 起改為 ceftriaxone <b>單藥</b>（不再常規併 azithromycin）。未排除披衣菌者加 doxycycline。泌尿生殖道與直腸感染不需 test-of-cure；<b>咽部感染須於治療後 7–14 天以培養或 NAAT 做 test-of-cure</b>。3 個月後重驗（再感染率高）。',
      regimens:[
        {role:'first', label:'Ceftriaxone 500 mg IM 單劑（≥150 kg 用 1 g）', drugs:['ceftriaxone'], dur:'單劑', note:'未排除披衣菌者加 doxycycline 100 mg bid ×7 天。孕婦亦同此方案。'},
        {role:'alt', label:'Cephalosporin 過敏：Gentamicin 240 mg IM ＋ Azithromycin 2 g 口服', drugs:['gentamicin','azithromycin'], dur:'各單劑', note:'直腸／咽部感染之證據不足；嚴重過敏（過敏性休克、SJS）請會診感染科。'},
        {role:'alt', label:'無法取得 ceftriaxone：Cefixime 800 mg 口服單劑', drugs:['cefixime'], dur:'單劑', note:'<b>咽部感染療效不足，不建議</b>；亦為性伴侶加速治療（EPT）之口服選項。'},
        {role:'special', label:'疑似治療失敗', drugs:['ceftriaxone'], dur:'先以原方案 ceftriaxone 500 mg IM 重治', note:'多數其實是再感染。若再感染機會低，取檢體做培養＋藥敏（NAAT 無法測藥敏），並會診感染科／通報衛生單位。'}
      ]},
     {name:'淋病・結膜炎與瀰漫性感染 DGI', en:'Gonococcal conjunctivitis / DGI',
      note:'DGI 表現為關節炎－皮疹症候群或化膿性關節炎；少數為腦膜炎／心內膜炎。住院評估、抽血與關節液培養。',
      regimens:[
        {role:'first', label:'淋菌結膜炎：Ceftriaxone 1 g IM 單劑', drugs:['ceftriaxone'], dur:'單劑', note:'併生理食鹽水沖洗患眼一次。'},
        {role:'first', label:'關節炎／皮疹症候群：Ceftriaxone 1 g IM/IV q24h', drugs:['ceftriaxone'], dur:'臨床改善 24–48 小時後可改口服，總療程 ≥7 天'},
        {role:'first', label:'淋菌腦膜炎／心內膜炎：Ceftriaxone 1–2 g IV q12–24h', drugs:['ceftriaxone'], dur:'腦膜炎 10–14 天；心內膜炎 ≥4 週'},
        {role:'alt', label:'替代：Cefotaxime 1 g IV q8h（或 ceftizoxime 1 g q8h）', drugs:['cefotaxime'], dur:'同上', note:'ceftizoxime 台灣未上市。未排除披衣菌者加 doxycycline 100 mg bid ×7 天。'}
      ]},
     {name:'披衣菌感染', en:'Chlamydia trachomatis infection',
      note:'CDC 2021 已把首選由 azithromycin 改為 <b>doxycycline</b>（直腸與咽部療效較佳）。非孕婦不需 test-of-cure，但 3 個月後應重驗。孕婦須於療程結束 4 週後做 test-of-cure。',
      regimens:[
        {role:'first', label:'Doxycycline 100 mg bid ×7 天', drugs:['doxycycline'], dur:'7 天'},
        {role:'alt', label:'替代：Azithromycin 1 g 單劑 或 Levofloxacin 500 mg qd ×7 天', drugs:['azithromycin','levofloxacin'], dur:'單劑／7 天'},
        {role:'first', label:'孕期：Azithromycin 1 g 口服單劑', drugs:['azithromycin'], dur:'單劑', note:'孕期禁用 doxycycline；療程結束 4 週後做 test-of-cure。'},
        {role:'alt', label:'孕期替代：Amoxicillin 500 mg tid ×7 天', drugs:['amoxicillin'], dur:'7 天'}
      ]},
     {name:'生殖道黴漿菌 M. genitalium', en:'Mycoplasma genitalium',
      note:'持續／復發之 NGU 或子宮頸炎的常見原因。一律採兩階段療法：先 doxycycline 降菌量，再依 macrolide 抗藥性給 azithromycin 或 moxifloxacin。',
      regimens:[
        {role:'first', label:'可測抗藥性・macrolide 感受性：Doxycycline ×7 天 → Azithromycin', drugs:['doxycycline','azithromycin'], dur:'doxy 100 mg bid ×7 天；接 azithro 1 g 首劑後 500 mg qd ×3 天（共 2.5 g）'},
        {role:'first', label:'可測抗藥性・macrolide 抗藥：Doxycycline ×7 天 → Moxifloxacin', drugs:['doxycycline','moxifloxacin'], dur:'doxy 100 mg bid ×7 天；接 moxi 400 mg qd ×7 天'},
        {role:'first', label:'無法測抗藥性（NAAT 陽性）：Doxycycline ×7 天 → Moxifloxacin', drugs:['doxycycline','moxifloxacin'], dur:'同上'}
      ]},
     {name:'骨盆腔發炎 PID', en:'Pelvic inflammatory disease',
      note:'最低診斷條件：子宮頸舉痛／子宮壓痛／附件壓痛任一，性活躍年輕女性即可經驗治療（門檻宜低）。住院指徵：無法排除外科急症、輸卵管卵巢膿瘍、懷孕、重症或高燒 >38.5°C、無法耐受口服、口服治療無效。門診治療 72 小時內須改善，否則住院重新評估。裝有 IUD 者不必移除。',
      regimens:[
        {role:'first', label:'靜脈：Ceftriaxone 1 g q24h ＋ Doxycycline ＋ Metronidazole', drugs:['ceftriaxone','doxycycline','metronidazole'], dur:'臨床改善 24–48 小時後改口服，總共 14 天', note:'doxycycline 100 mg 口服／IV q12h、metronidazole 500 mg 口服／IV q12h；能口服就口服（靜脈 doxycycline 疼痛）。'},
        {role:'first', label:'靜脈：Cefoxitin 2 g q6h ＋ Doxycycline（或 Cefotetan 2 g q12h＋Doxycycline）', drugs:['cefoxitin','doxycycline'], dur:'總共 14 天', note:'cefotetan 台灣未上市。'},
        {role:'first', label:'肌注／口服（輕中度）：Ceftriaxone 500 mg IM 單劑 ＋ Doxycycline ＋ Metronidazole', drugs:['ceftriaxone','doxycycline','metronidazole'], dur:'doxycycline 與 metronidazole 各 ×14 天', note:'或 cefoxitin 2 g IM＋probenecid 1 g 口服同時給。體重 >150 kg 且確診淋病者 ceftriaxone 用 1 g。'},
        {role:'alt', label:'替代靜脈：Ampicillin-sulbactam 3 g q6h ＋ Doxycycline', drugs:['ampsulbactam','doxycycline'], dur:'總共 14 天', note:'對輸卵管卵巢膿瘍覆蓋佳。'},
        {role:'alt', label:'替代靜脈：Clindamycin 900 mg q8h ＋ Gentamicin', drugs:['clindamycin','gentamicin'], dur:'改善後改口服 clindamycin 450 mg qid 或 doxycycline 100 mg bid，滿 14 天', note:'gentamicin loading 2 mg/kg 後 1.5 mg/kg q8h，或每日一次 3–5 mg/kg。有輸卵管卵巢膿瘍時以 clindamycin 或 metronidazole 續行以覆蓋厭氧菌。'},
        {role:'none', label:'不建議：含 quinolone 之方案', drugs:[], note:'因淋球菌 quinolone 抗藥普遍，CDC 不建議以 quinolone 治療 PID。'}
      ]},
     {name:'急性副睪炎', en:'Acute epididymitis',
      note:'依可能病原選方案：<35 歲性活躍者多為披衣菌／淋病；行插入性肛交者須同時覆蓋腸道菌；年長、近期泌尿處置者以腸道菌為主。48–72 小時未改善須重新評估（睪丸扭轉、膿瘍、腫瘤）。',
      regimens:[
        {role:'first', label:'披衣菌／淋病為主：Ceftriaxone 500 mg IM 單劑 ＋ Doxycycline', drugs:['ceftriaxone','doxycycline'], dur:'doxycycline 100 mg bid ×10 天'},
        {role:'first', label:'披衣菌／淋病＋腸道菌（插入性肛交）：Ceftriaxone ＋ Levofloxacin', drugs:['ceftriaxone','levofloxacin'], dur:'levofloxacin 500 mg qd ×10 天'},
        {role:'first', label:'僅腸道菌（年長／泌尿處置後）：Levofloxacin 單藥', drugs:['levofloxacin'], dur:'500 mg qd ×10 天'}
      ]},
     {name:'急性直腸炎', en:'Acute proctitis',
      note:'肛交後之肛門直腸疼痛、裡急後重、分泌物。經驗治療同時涵蓋淋病與披衣菌，並驗 HSV 與梅毒。',
      regimens:[
        {role:'first', label:'Ceftriaxone 500 mg IM 單劑 ＋ Doxycycline', drugs:['ceftriaxone','doxycycline'], dur:'doxycycline 100 mg bid ×7 天'},
        {role:'special', label:'血性分泌物／肛周或黏膜潰瘍／裡急後重且直腸披衣菌陽性（疑 LGV）', drugs:['doxycycline'], dur:'延長為 100 mg bid ×21 天'}
      ]},
     {name:'梅毒（依分期）', en:'Syphilis by stage',
      note:'<b>Penicillin 是唯一有充分實證的藥</b>。追蹤非螺旋體試驗（RPR／VDRL）titer，6–12 個月應下降四倍。治療後 24 小時內可能出現 Jarisch-Herxheimer 反應。孕婦與 HIV 感染者劑量同一般族群，孕婦青黴素過敏須<b>減敏後仍用 penicillin</b>。',
      regimens:[
        {role:'first', label:'初期／二期／早期潛伏：Benzathine penicillin G 2.4 MU IM 單劑', drugs:['penG'], dur:'單劑', note:'嬰兒與兒童 50,000 units/kg IM（上限 2.4 MU）單劑。'},
        {role:'first', label:'晚期潛伏／病期不明／三期（CSF 正常）：Benzathine penicillin G 7.2 MU', drugs:['penG'], dur:'2.4 MU IM 每週一次 ×3 次（共 7.2 MU）'},
        {role:'first', label:'神經性／眼／耳梅毒：水溶性 Penicillin G 18–24 MU/day', drugs:['penG'], dur:'3–4 MU IV q4h 或連續輸注 ×10–14 天', note:'替代：procaine penicillin G 2.4 MU IM qd＋probenecid 500 mg 口服 qid ×10–14 天（台大未收錄此二品項）。'},
        {role:'first', label:'先天性梅毒（確診／高度可能）：水溶性 Penicillin G 10 天', drugs:['penG'], dur:'50,000 units/kg/dose IV，出生 7 天內 q12h、其後 q8h，共 10 天', note:'或 procaine penicillin G 50,000 units/kg IM qd ×10 天。可能性較低者（scenario 3）可用 benzathine 50,000 units/kg IM 單劑。'},
        {role:'alt', label:'非孕、非神經性梅毒之青黴素過敏替代：Doxycycline', drugs:['doxycycline'], dur:'100 mg bid ×14 天（晚期潛伏 28 天）', note:'資料有限、須密切血清追蹤；孕婦不可用。'}
      ]},
     {name:'生殖器疱疹 HSV', en:'Genital herpes',
      note:'初次臨床發作一律給抗病毒藥（可縮短病程但無法根除潛伏病毒）。復發可選發作性治療（前驅期或 24 小時內開始）或每日抑制療法（可降低傳染給伴侶之風險）。',
      regimens:[
        {role:'first', label:'初次發作（10 天未癒可延長）', drugs:['acyclovir','valacyclovir','famciclovir'], dur:'7–10 天', note:'acyclovir 400 mg tid；valacyclovir 1 g bid；famciclovir 250 mg tid。'},
        {role:'first', label:'復發・發作性治療', drugs:['acyclovir','valacyclovir','famciclovir'], dur:'1–5 天（依方案）', note:'acyclovir 800 mg bid ×5 天或 800 mg tid ×2 天；valacyclovir 500 mg bid ×3 天或 1 g qd ×5 天；famciclovir 1 g bid ×1 天、或 500 mg 單次後 250 mg bid ×2 天、或 125 mg bid ×5 天。'},
        {role:'first', label:'復發・每日抑制療法', drugs:['acyclovir','valacyclovir','famciclovir'], dur:'長期', note:'acyclovir 400 mg bid；valacyclovir 500 mg qd（一年 ≥10 次者用 1 g qd）；famciclovir 250 mg bid。'},
        {role:'special', label:'HIV 感染者', drugs:['acyclovir','valacyclovir','famciclovir'], dur:'發作性 5–10 天；抑制療法長期', note:'抑制：acyclovir 400–800 mg 每日 2–3 次、valacyclovir 500 mg bid、famciclovir 500 mg bid。發作性：acyclovir 400 mg tid、valacyclovir 1 g bid、famciclovir 500 mg bid。'},
        {role:'special', label:'孕期抑制療法（自 36 週起，減少剖腹產）', drugs:['acyclovir','valacyclovir'], dur:'自 36 週至分娩', note:'acyclovir 400 mg tid 或 valacyclovir 500 mg bid。分娩時有活動性病灶或前驅症狀者建議剖腹產。'},
        {role:'special', label:'重症／併發症（瀰漫性、肺炎、肝炎、腦膜炎、腦炎）：靜脈 Acyclovir', drugs:['acyclovir'], dur:'5–10 mg/kg IV q8h，臨床改善後改口服滿 ≥10 天'}
      ]},
     {name:'軟性下疳 / LGV / 腹股溝肉芽腫', en:'Chancroid / LGV / Donovanosis',
      note:'生殖器潰瘍之鑑別診斷，均須同時驗梅毒與 HIV。LGV 好發於 MSM，常表現為出血性直腸炎。',
      regimens:[
        {role:'first', label:'軟性下疳（H. ducreyi）', drugs:['azithromycin','ceftriaxone','ciprofloxacin','erythromycin'], dur:'依方案', note:'azithromycin 1 g 單劑；或 ceftriaxone 250 mg IM 單劑；或 ciprofloxacin 500 mg bid ×3 天；或 erythromycin base 500 mg tid ×7 天。HIV 感染者癒合較慢，可能需重複療程。'},
        {role:'first', label:'LGV（C. trachomatis L1–L3）：Doxycycline', drugs:['doxycycline'], dur:'100 mg bid ×21 天'},
        {role:'alt', label:'LGV 替代：Azithromycin 或 Erythromycin', drugs:['azithromycin','erythromycin'], dur:'azithro 1 g 每週 ×3 週；erythro base 500 mg qid ×21 天'},
        {role:'first', label:'腹股溝肉芽腫（donovanosis）：Azithromycin', drugs:['azithromycin'], dur:'1 g 每週一次或 500 mg qd，≥3 週且病灶完全癒合'},
        {role:'alt', label:'腹股溝肉芽腫替代', drugs:['doxycycline','tmpsmx','erythromycin'], dur:'皆 ≥3 週且病灶完全癒合', note:'doxycycline 100 mg bid；TMP-SMX 1 顆 DS bid；erythromycin base 500 mg qid。'}
      ]},
     {name:'細菌性陰道炎 BV', en:'Bacterial vaginosis',
      note:'僅治療有症狀者。性伴侶（男性）不需治療。復發常見，可換用另一建議方案。孕婦有症狀即治療，可用任一建議方案。CDC 2021 指出並無證據支持 metronidazole 之類 disulfiram 反應，已取消治療期間禁酒警語。',
      regimens:[
        {role:'first', label:'Metronidazole 口服 500 mg bid ×7 天', drugs:['metronidazole'], dur:'7 天'},
        {role:'first', label:'Metronidazole 0.75% 陰道凝膠 5 g qd ×5 天', drugs:['metronidazole'], dur:'5 天', note:'台大品項：素女潔陰道用凝膠 7.5 mg/g。'},
        {role:'first', label:'Clindamycin 2% 陰道乳膏 5 g 睡前 ×7 天', drugs:['clindamycin'], dur:'7 天', note:'油性基劑，治療期間及其後 72 小時內會減弱保險套與陰道隔膜。'},
        {role:'alt', label:'替代：口服 Clindamycin／Tinidazole／Secnidazole', drugs:['clindamycin','tinidazole'], dur:'依方案', note:'clindamycin 300 mg bid ×7 天，或陰道栓劑 100 mg 睡前 ×3 天；tinidazole 2 g qd ×2 天或 1 g qd ×5 天；secnidazole 2 g 口服顆粒單劑（台灣未上市）。'}
      ]},
     {name:'陰道滴蟲症', en:'Trichomoniasis',
      note:'唯一有效的藥物類別為 nitroimidazole。所有性伴侶須同時治療，且至雙方治療完成、症狀消失前禁性行為。所有患者於治療後 3 個月重驗（再感染率高）。',
      regimens:[
        {role:'first', label:'女性：Metronidazole 500 mg bid ×7 天', drugs:['metronidazole'], dur:'7 天', note:'隨機試驗顯示 7 天療程優於 2 g 單劑；HIV 感染女性一律用此方案。'},
        {role:'first', label:'男性：Metronidazole 2 g 口服單劑', drugs:['metronidazole'], dur:'單劑'},
        {role:'alt', label:'替代（男女皆可）：Tinidazole 2 g 口服單劑', drugs:['tinidazole'], dur:'單劑', note:'腸胃道副作用較少。'},
        {role:'special', label:'持續感染（已排除再暴露）', drugs:['metronidazole','tinidazole'], dur:'重覆 metronidazole 500 mg bid ×7 天；仍失敗改 tinidazole 2 g qd ×7 天', note:'metronidazole 抗藥率 4–10%。仍失敗者須送藥敏並會診專家。nitroimidazole IgE 型過敏者須減敏，無替代藥物類別。'}
      ]},
     {name:'外陰陰道念珠菌感染 VVC', en:'Vulvovaginal candidiasis',
      note:'分未併發症（偶發、輕中度、C. albicans、免疫正常）與併發症型（復發、嚴重、非 albicans、糖尿病／免疫低下）。非性傳染病，但列於 CDC STI 指引之陰道炎章節。孕期<b>只能用局部 azole 塗抹 7 天</b>。',
      regimens:[
        {role:'first', label:'未併發症・局部 azole', drugs:['clotrimazole','miconazole','fenticonazole','nystatin'], dur:'1–7 天（依劑型）', note:'CDC：clotrimazole 1% 乳膏 5 g ×7–14 天或 2% ×3 天；miconazole 2% ×7 天、4% ×3 天，或栓劑 100 mg ×7 天／200 mg ×3 天／1200 mg 單劑。台大院內品項：fenticonazole 陰道軟膠囊 200 mg ×3 天或 600 mg 單劑、nystatin 陰道錠 10 萬單位 qd ×2 週。'},
        {role:'first', label:'未併發症・口服：Fluconazole 150 mg 單劑', drugs:['fluconazole'], dur:'單劑'},
        {role:'special', label:'嚴重型（廣泛紅腫、糜爛、龜裂）', drugs:['fluconazole'], dur:'150 mg ×2 劑間隔 72 小時；或局部 azole 7–14 天'},
        {role:'special', label:'復發型（一年 ≥3 次）', drugs:['fluconazole'], dur:'誘導 100／150／200 mg 於第 1、4、7 天共 3 劑；維持 100–200 mg 每週一次 ×6 個月'},
        {role:'special', label:'非 albicans 念珠菌', drugs:['fluconazole'], dur:'改用非 fluconazole 之 azole 7–14 天', note:'復發者陰道用硼酸 600 mg 膠囊 qd ×3 週（清除率約 70%）；仍復發轉介專科。'},
        {role:'none', label:'孕期：禁用口服 fluconazole', drugs:[], note:'單劑 150 mg 與自然流產及先天異常相關；孕婦僅能用局部 azole 塗抹 7 天。'}
      ]},
     {name:'肛門生殖器疣（HPV）', en:'Anogenital warts',
      note:'治療目的為去除病灶症狀，無法根除 HPV 感染。依疣體大小、位置、數目與病人偏好選擇；3 個月內無反應應換方案。孕婦禁用 podofilox、podophyllin 與 sinecatechins，imiquimod 亦建議避免。',
      regimens:[
        {role:'first', label:'病人自行塗抹：Imiquimod 3.75% 或 5% 乳膏', drugs:['imiquimod'], dur:'5% 每週 3 次最長 16 週；3.75% 每晚最長 8 週', note:'可能削弱保險套與陰道隔膜。'},
        {role:'first', label:'病人自行塗抹：Podofilox 0.5% 溶液／凝膠', drugs:['podofilox'], dur:'bid ×3 天後停 4 天為一週期，最多 4 週期', note:'單次面積 ≤10 cm²、每日 ≤0.5 mL。孕婦禁用。'},
        {role:'first', label:'病人自行塗抹：Sinecatechins 15% 軟膏', drugs:[], dur:'tid 至疣體清除，最長 16 週', note:'綠茶萃取物，台灣未上市；孕婦禁用，可能削弱保險套。'},
        {role:'first', label:'醫師施行：冷凍治療／手術切除／三氯醋酸（TCA）或二氯醋酸（BCA）80–90%', drugs:[], dur:'冷凍與 TCA/BCA 每 1–2 週重複', note:'陰道、子宮頸、尿道口、肛門內之疣只能用冷凍或手術／TCA-BCA（陰道內不可用冷凍探頭，有穿孔與瘻管風險）；子宮頸疣須先排除高度鱗狀上皮內病變（HSIL）並會診專科；肛門內疣會診大腸直腸專科。'}
      ]},
     {name:'陰蝨 / 疥瘡', en:'Pediculosis pubis / Scabies',
      note:'性接觸者與同住者須一併治療，衣物寢具以熱水洗滌高溫烘乾。疥瘡治療後搔癢可持續 2 週，非治療失敗。',
      regimens:[
        {role:'first', label:'陰蝨：Permethrin 1% cream rinse（或 pyrethrin＋piperonyl butoxide）', drugs:['permethrin'], dur:'塗患部 10 分鐘後洗掉', note:'抗藥性增加中；治療失敗可改 malathion 0.5% 乳液塗 8–12 小時（台灣未上市）。'},
        {role:'first', label:'疥瘡：Permethrin 5% 乳膏', drugs:['permethrin'], dur:'頸部以下全身塗抹，8–14 小時後洗掉', note:'嬰幼兒須連頭皮、臉、頸一併塗；孕婦與哺乳婦首選。'},
        {role:'first', label:'疥瘡：口服 Ivermectin 200 µg/kg', drugs:['ivermectin'], dur:'第 1 天與第 14 天各一次', note:'對蟲卵活性有限，第二劑不可省略；<15 kg 兒童安全性未確立。台大核准適應症即為疥瘡。'},
        {role:'alt', label:'陰蝨口服替代：Ivermectin 250 µg/kg', drugs:['ivermectin'], dur:'7–14 天後重複一次'},
        {role:'special', label:'結痂型（挪威型）疥瘡', drugs:['permethrin','ivermectin'], dur:'局部 permethrin 每日 ×7 天後改每週 2 次；併 ivermectin 第 1、2、8、9、15 天（重症加第 22、29 天）', note:'免疫低下者高傳染性，須隔離並會診。'},
        {role:'none', label:'不建議：Lindane 1%', drugs:[], note:'僅在無法耐受或其他方案失敗時使用；孕婦、哺乳婦、<10 歲兒童禁用（神經毒性）。'}
      ]},
     {name:'性侵害後預防性治療', en:'Post–sexual assault prophylaxis',
      note:'除抗生素外，同時評估：緊急避孕、B 型肝炎疫苗（未接種者，不需 HBIG）、HPV 疫苗（9–26 歲）、HIV 暴露後預防（<72 小時內開始，28 天療程，須會診）。追蹤複驗。',
      regimens:[
        {role:'first', label:'女性：Ceftriaxone 500 mg IM ＋ Doxycycline ＋ Metronidazole', drugs:['ceftriaxone','doxycycline','metronidazole'], dur:'doxycycline 100 mg bid ×7 天；metronidazole 500 mg bid ×7 天', note:'體重 ≥150 kg 者 ceftriaxone 用 1 g。'},
        {role:'first', label:'男性：Ceftriaxone 500 mg IM ＋ Doxycycline', drugs:['ceftriaxone','doxycycline'], dur:'doxycycline 100 mg bid ×7 天'}
      ]},
     {name:'新生兒 / 嬰幼兒', en:'Neonatal & pediatric STI',
      note:'新生兒感染源自產程暴露；預防的關鍵是孕期篩檢與治療。嬰幼兒若診斷淋病或披衣菌（非產程感染年齡），須通報並評估性侵害。',
      regimens:[
        {role:'first', label:'預防新生兒淋菌眼炎：0.5% Erythromycin 眼膏', drugs:['erythromycin'], dur:'出生時雙眼各單次塗抹'},
        {role:'first', label:'淋菌性新生兒眼炎（治療）：Ceftriaxone 25–50 mg/kg IV/IM 單劑（max 250 mg）', drugs:['ceftriaxone'], dur:'單劑', note:'高膽紅素新生兒改用 cefotaxime。'},
        {role:'first', label:'新生兒瀰漫性淋病：Ceftriaxone 25–50 mg/kg/day IV/IM qd', drugs:['ceftriaxone','cefotaxime'], dur:'7 天（確診腦膜炎 10–14 天）', note:'或 cefotaxime 25 mg/kg q12h。'},
        {role:'first', label:'新生兒披衣菌結膜炎／嬰兒披衣菌肺炎：口服 Erythromycin', drugs:['erythromycin'], dur:'base 或 ethylsuccinate 50 mg/kg/day 分 4 次 ×14 天', note:'療效僅約 80%，可能需第二療程；<6 週齡須留意肥厚性幽門狹窄。替代：azithromycin 懸液 20 mg/kg/day qd ×3 天。'},
        {role:'first', label:'先天性梅毒：水溶性 Penicillin G ×10 天', drugs:['penG'], dur:'50,000 units/kg/dose IV，出生 7 天內 q12h、其後 q8h，共 10 天', note:'或 procaine penicillin G 50,000 units/kg IM qd ×10 天；可能性低者 benzathine 50,000 units/kg IM 單劑。'},
        {role:'first', label:'兒童披衣菌感染（<45 kg）：口服 Erythromycin', drugs:['erythromycin','azithromycin','doxycycline'], dur:'依體重與年齡', note:'<45 kg：erythromycin base／ethylsuccinate 50 mg/kg/day 分 4 次 ×14 天；≥45 kg 但 <8 歲：azithromycin 1 g 單劑；≥8 歲：azithromycin 1 g 單劑或 doxycycline 100 mg bid ×7 天。'},
        {role:'first', label:'兒童單純性淋病（≤45 kg）：Ceftriaxone 25–50 mg/kg IV/IM 單劑（max 250 mg IM）', drugs:['ceftriaxone'], dur:'單劑', note:'>45 kg 者比照成人方案。菌血症／關節炎：≤45 kg 用 50 mg/kg（max 2 g）qd ×7 天；>45 kg 用 1 g qd ×7 天。'}
      ]}
   ]}
];

/* =========================================================================
   BACTERIA — 依病原菌之建議治療（引用 DRUGS）。dur 省略：療程依感染部位而定。
   ========================================================================= */
window.BACTERIA = [
  {group:'Gram 陽性球菌', items:[
    {name:'金黃色葡萄球菌 (MSSA)', en:'S. aureus, methicillin-susceptible', kw:'staph MSSA 葡萄球菌',
     note:'甲氧西林敏感。首選抗葡萄球菌 penicillin 或第一代 cephalosporin，優於 vancomycin。',
     regimens:[
       {role:'first', label:'Nafcillin／Oxacillin 或 Cefazolin', drugs:['nafcillin']},
       {role:'first', label:'Cefazolin（等效、方便）', drugs:['cefazolin']},
       {role:'alt', label:'β-lactam 過敏：Vancomycin／Cefazolin(非嚴重過敏)', drugs:['vancomycin']}
     ]},
    {name:'抗藥金黃色葡萄球菌 (MRSA)', en:'S. aureus, methicillin-resistant', kw:'MRSA staph 葡萄球菌',
     note:'甲氧西林抗藥。菌血症／心內膜炎首選 vancomycin(TDM)或 daptomycin；肺炎不可用 daptomycin。皮膚軟組織、骨關節等非 CNS／非菌血症之感染，台灣可以 teicoplanin 為首選（腎毒性較低）。',
     regimens:[
       {role:'first', label:'Vancomycin（TDM AUC/MIC 400–600；菌血症／心內膜炎／CNS）', drugs:['vancomycin']},
       {role:'first', label:'Daptomycin（菌血症；不可用於肺炎）', drugs:['daptomycin']},
       {role:'alt', label:'Teicoplanin（SSTI／骨關節等，台灣常用；需足量並監測 trough）', drugs:['teicoplanin']},
       {role:'alt', label:'Linezolid（肺炎／口服）／Ceftaroline', drugs:['linezolid']}
     ]},
    {name:'肺炎鏈球菌', en:'Streptococcus pneumoniae', kw:'strep pneumococcus 肺炎',
     note:'依 penicillin 感受性。腦膜炎在感受性未知前 vancomycin＋ceftriaxone。',
     regimens:[
       {role:'first', label:'Penicillin G／Amoxicillin（penicillin 感受性）', drugs:['penG']},
       {role:'first', label:'Ceftriaxone（中度抗藥或非腦膜炎）', drugs:['ceftriaxone']},
       {role:'special', label:'腦膜炎／高抗藥加 Vancomycin', drugs:['vancomycin']}
     ]},
    {name:'A 群鏈球菌（化膿鏈球菌）', en:'Streptococcus pyogenes (GAS)', kw:'group A strep 鏈球菌',
     note:'penicillin 幾乎無抗藥。侵襲性／壞死性感染／中毒性休克加 clindamycin 抑毒素。',
     regimens:[
       {role:'first', label:'Penicillin G／Ampicillin', drugs:['penG']},
       {role:'special', label:'侵襲性／壞死性加 Clindamycin（抑毒素）', drugs:['clindamycin']},
       {role:'alt', label:'β-lactam 過敏：Vancomycin', drugs:['vancomycin']}
     ]},
    {name:'B 群鏈球菌', en:'Streptococcus agalactiae (GBS)', kw:'group B strep 鏈球菌',
     note:'新生兒與成人侵襲性感染。',
     regimens:[{role:'first', label:'Penicillin G／Ampicillin', drugs:['penG']}]},
    {name:'草綠色鏈球菌', en:'Viridans group streptococci', kw:'viridans strep 心內膜炎',
     note:'常見於心內膜炎；依 penicillin MIC。',
     regimens:[
       {role:'first', label:'Penicillin G 或 Ceftriaxone', drugs:['penG']},
       {role:'alt', label:'β-lactam 過敏：Vancomycin', drugs:['vancomycin']}
     ]},
    {name:'腸球菌 (E. faecalis)', en:'Enterococcus faecalis', kw:'enterococcus 腸球菌',
     note:'多對 ampicillin 感受。心內膜炎需協同(ampicillin＋ceftriaxone 或＋gentamicin)。',
     regimens:[
       {role:'first', label:'Ampicillin（±Ceftriaxone／Gentamicin 協同）', drugs:['ampicillin']},
       {role:'alt', label:'Ampicillin 抗藥／過敏：Vancomycin', drugs:['vancomycin']}
     ]},
    {name:'腸球菌 (E. faecium) / VRE', en:'Enterococcus faecium / VRE', kw:'VRE enterococcus 腸球菌 抗萬古',
     note:'常對 ampicillin／vancomycin 抗藥(VRE)。',
     regimens:[
       {role:'first', label:'Linezolid 或 Daptomycin', drugs:['linezolid']},
       {role:'alt', label:'Daptomycin（高劑量，菌血症）', drugs:['daptomycin']}
     ]},
    {name:'表皮／凝固酶陰性葡萄球菌', en:'Coagulase-negative staphylococci', kw:'CoNS staph epidermidis 導管',
     note:'常見導管／人工裝置感染，多為甲氧西林抗藥。',
     regimens:[{role:'first', label:'Vancomycin', drugs:['vancomycin']}]},
    {name:'李斯特菌', en:'Listeria monocytogenes', kw:'listeria 腦膜炎',
     note:'孕婦、老人、免疫低下之腦膜炎／菌血症；cephalosporin 無效。',
     regimens:[
       {role:'first', label:'Ampicillin（±Gentamicin 協同）', drugs:['ampicillin']},
       {role:'alt', label:'磺胺過敏以外之替代：TMP-SMX', drugs:['tmpsmx']}
     ]}
  ]},
  {group:'Gram 陰性桿菌', items:[
    {name:'大腸桿菌 / 克雷伯氏菌（非 ESBL）', en:'E. coli / Klebsiella (non-ESBL)', kw:'ecoli klebsiella 大腸桿菌 克雷伯',
     note:'依感受性；社區型多可用第三代 cephalosporin。',
     regimens:[
       {role:'first', label:'Ceftriaxone', drugs:['ceftriaxone']},
       {role:'alt', label:'Fluoroquinolone', drugs:['ciprofloxacin']}
     ]},
    {name:'ESBL 腸道菌', en:'ESBL-producing Enterobacterales', kw:'ESBL 大腸桿菌 克雷伯',
     note:'產 ESBL；carbapenem 為菌血症首選。cUTI 可考慮新型 BLI。',
     regimens:[
       {role:'first', label:'Meropenem（重症／菌血症）', drugs:['meropenem']},
       {role:'first', label:'Ertapenem（非 Pseudomonas 來源）', drugs:['ertapenem']},
       {role:'alt', label:'cUTI：Ceftolozane-tazo／Ceftazidime-avi', drugs:['ceftolotazo']}
     ]},
    {name:'AmpC 型（Enterobacter/Serratia/Citrobacter）', en:'AmpC producers', kw:'ampc enterobacter serratia citrobacter',
     note:'避免第三代 cephalosporin(誘導型去抑制致治療失敗)；用 cefepime 或 carbapenem。',
     regimens:[
       {role:'first', label:'Cefepime', drugs:['cefepime']},
       {role:'alt', label:'Meropenem（重症）', drugs:['meropenem']}
     ]},
    {name:'綠膿桿菌', en:'Pseudomonas aeruginosa', kw:'pseudomonas 綠膿桿菌',
     note:'抗綠膿 β-lactam；重症／中性球低下可加 aminoglycoside。MDR 用新型 BLI／colistin。',
     regimens:[
       {role:'first', label:'Cefepime／Pip-tazo／Ceftazidime／Meropenem', drugs:['cefepime']},
       {role:'special', label:'重症加 Aminoglycoside 協同', drugs:['amikacin']},
       {role:'alt', label:'MDR：Ceftolozane-tazo／Ceftazidime-avi／Colistin', drugs:['ceftolotazo']}
     ]},
    {name:'鮑氏不動桿菌', en:'Acinetobacter baumannii', kw:'acinetobacter 不動桿菌',
     note:'常多重抗藥；sulbactam 成分具活性。',
     regimens:[
       {role:'first', label:'Ampicillin-sulbactam（高劑量 sulbactam）', drugs:['ampsulbactam']},
       {role:'alt', label:'Meropenem（感受性）', drugs:['meropenem']},
       {role:'special', label:'MDR：Colistin／Tigecycline', drugs:['colistin']}
     ]},
    {name:'嗜麥芽窄食單胞菌', en:'Stenotrophomonas maltophilia', kw:'stenotrophomonas 窄食',
     note:'對 carbapenem 天然抗藥；TMP-SMX 為首選。',
     regimens:[
       {role:'first', label:'TMP-SMX', drugs:['tmpsmx']},
       {role:'alt', label:'Levofloxacin', drugs:['levofloxacin']}
     ]},
    {name:'產吲哚金黃桿菌', en:'Chryseobacterium indologenes', kw:'chryseobacterium flavobacterium 金黃桿菌 環境菌',
     note:'環境伺機菌，多重內在抗藥（對多數 β-lactam／carbapenem／aminoglycoside 抗藥）；依感受性選藥，常用 fluoroquinolone 或 TMP-SMX。',
     regimens:[
       {role:'first', label:'Levofloxacin（依感受性）', drugs:['levofloxacin']},
       {role:'alt', label:'TMP-SMX／Minocycline（依感受性）', drugs:['tmpsmx']}
     ]},
    {name:'少動鞘胺醇單胞菌', en:'Sphingomonas paucimobilis', kw:'sphingomonas 鞘胺醇單胞菌 環境菌',
     note:'環境伺機菌，低毒力；對 carbapenem、aminoglycoside、fluoroquinolone 多敏感。',
     regimens:[
       {role:'first', label:'Carbapenem 或 Fluoroquinolone（依感受性）', drugs:['meropenem']},
       {role:'alt', label:'Levofloxacin', drugs:['levofloxacin']}
     ]},
    {name:'流感嗜血桿菌', en:'Haemophilus influenzae', kw:'haemophilus 嗜血桿菌',
     regimens:[
       {role:'first', label:'Ceftriaxone', drugs:['ceftriaxone']},
       {role:'alt', label:'Amoxicillin-clavulanate（口服）', drugs:['amoxclav']}
     ]},
    {name:'腦膜炎雙球菌', en:'Neisseria meningitidis', kw:'meningococcus 腦膜炎雙球菌',
     regimens:[
       {role:'first', label:'Ceftriaxone', drugs:['ceftriaxone']},
       {role:'alt', label:'Penicillin G（感受性）', drugs:['penG']}
     ]},
    {name:'淋病雙球菌', en:'Neisseria gonorrhoeae', kw:'gonorrhea 淋病 gc',
     note:'CDC 2021 起單純性感染改為 <b>ceftriaxone 單藥</b>（不再常規併 azithromycin）；未排除披衣菌者加 doxycycline。咽部感染須做 test-of-cure。詳見「依部位 → 性傳染病 STI」。',
     regimens:[
       {role:'first', label:'單純性感染：Ceftriaxone 500 mg IM 單劑（≥150 kg 用 1 g）', drugs:['ceftriaxone']},
       {role:'special', label:'未排除披衣菌：加 Doxycycline 100 mg bid ×7 天', drugs:['doxycycline']},
       {role:'alt', label:'Cephalosporin 過敏：Gentamicin 240 mg IM ＋ Azithromycin 2 g', drugs:['gentamicin','azithromycin']},
       {role:'alt', label:'無法取得 ceftriaxone：Cefixime 800 mg 口服單劑（咽部無效）', drugs:['cefixime']},
       {role:'special', label:'瀰漫性感染 DGI：Ceftriaxone 1 g IM/IV q24h', drugs:['ceftriaxone']}
     ]},
    {name:'變形桿菌／摩根氏菌／普羅威登斯菌', en:'Proteus / Morganella / Providencia', kw:'proteus morganella providencia 變形桿菌 摩根 普羅威登斯',
     note:'對 nitrofurantoin／colistin 天然抗藥。Morganella／Providencia 具誘導型 AmpC，避免第三代 cephalosporin 單用。下方在地感受性分「奇異變形桿菌」與「Proteus／Morganella／Providencia 群」兩列。',
     regimens:[
       {role:'first', label:'Ampicillin／Ceftriaxone（依感受性；AmpC 者用 cefepime／carbapenem）', drugs:['ceftriaxone']}
     ]},
    {name:'抗碳青黴烯腸道菌 (CRE)', en:'Carbapenem-resistant Enterobacterales', kw:'CRE KPC NDM 抗碳青黴烯',
     note:'依碳青黴烯酶型別選藥；屬保留用藥，需感染科／抗生素管理。',
     regimens:[
       {role:'special', label:'Ceftazidime-avibactam（KPC／OXA-48）', drugs:['ceftazavi']},
       {role:'alt', label:'Colistin（±Tigecycline）挽救', drugs:['colistin']}
     ]},
    {name:'非傷寒沙門氏菌（侵襲性）', en:'Non-typhoidal Salmonella, invasive', kw:'salmonella 沙門氏',
     regimens:[
       {role:'first', label:'Ceftriaxone', drugs:['ceftriaxone']},
       {role:'alt', label:'Fluoroquinolone', drugs:['ciprofloxacin']}
     ]},
    {name:'類鼻疽伯克霍爾德氏菌', en:'Burkholderia pseudomallei', kw:'burkholderia pseudomallei melioidosis 類鼻疽',
     note:'台灣／東南亞；糖尿病人高風險。急性期靜脈治療 ≥10–14 天，之後口服根除期 3–6 個月以防復發。',
     regimens:[
       {role:'first', label:'急性期：Ceftazidime 或 Meropenem', drugs:['ceftazidime']},
       {role:'first', label:'根除期：TMP-SMX（口服 3–6 個月）', drugs:['tmpsmx']}
     ]},
    {name:'洋蔥伯克霍爾德氏菌', en:'Burkholderia cepacia complex', kw:'burkholderia cepacia 洋蔥 囊狀纖維化',
     note:'囊狀纖維化／院內感染；多重內在抗藥（含 colistin 天然抗藥）。依感受性選藥。',
     regimens:[
       {role:'first', label:'TMP-SMX 或 Meropenem 或 Ceftazidime（依感受性）', drugs:['tmpsmx']}
     ]},
    {name:'創傷弧菌', en:'Vibrio vulnificus', kw:'vibrio vulnificus 創傷弧菌 海洋 壞死',
     note:'海水／生食貝類接觸、肝病／免疫低下之壞死性軟組織感染與敗血症；及早清創、預後差。',
     regimens:[
       {role:'first', label:'Doxycycline ＋ Ceftriaxone（或 Cefotaxime）', drugs:['doxycycline','ceftriaxone']},
       {role:'alt', label:'Fluoroquinolone', drugs:['levofloxacin']}
     ]},
    {name:'產氣單胞菌', en:'Aeromonas hydrophila', kw:'aeromonas 產氣單胞 淡水 水蛭',
     note:'淡水／水蛭／外傷相關軟組織感染；常帶誘導型 β-lactamase。',
     regimens:[
       {role:'first', label:'第三代 cephalosporin 或 Fluoroquinolone（±Doxycycline）', drugs:['ceftriaxone']}
     ]},
    {name:'多殺巴斯德氏菌', en:'Pasteurella multocida', kw:'pasteurella 巴斯德 動物咬傷 貓狗',
     note:'貓／狗咬傷之常見菌。',
     regimens:[
       {role:'first', label:'Amoxicillin-clavulanate（或 Penicillin G）', drugs:['amoxclav']}
     ]},
    {name:'卡他莫拉菌', en:'Moraxella catarrhalis', kw:'moraxella catarrhalis 卡他',
     note:'呼吸道感染；多產 β-lactamase。',
     regimens:[
       {role:'first', label:'Amoxicillin-clavulanate 或第二／三代 cephalosporin', drugs:['amoxclav']},
       {role:'alt', label:'Macrolide／Doxycycline', drugs:['azithromycin']}
     ]},
    {name:'曲狀桿菌', en:'Campylobacter jejuni', kw:'campylobacter 曲狀桿菌 腸炎',
     note:'腸炎；FQ 抗藥率上升，首選 macrolide。',
     regimens:[
       {role:'first', label:'Azithromycin', drugs:['azithromycin']}
     ]}
  ]},
  {group:'厭氧 / 其他', items:[
    {name:'脆弱擬桿菌', en:'Bacteroides fragilis', kw:'bacteroides 厭氧 anaerobe',
     note:'橫膈下厭氧代表菌。',
     regimens:[
       {role:'first', label:'Metronidazole', drugs:['metronidazole']},
       {role:'alt', label:'Pip-tazo／Carbapenem（合併需氧菌時）', drugs:['piptazo']}
     ]},
    {name:'困難梭菌', en:'Clostridioides difficile', kw:'cdiff cdi 困難梭菌 偽膜性',
     note:'停用誘發抗生素。口服 vancomycin 或 fidaxomicin 為首選（fidaxomicin 復發率較低）。',
     regimens:[
       {role:'first', label:'口服 Vancomycin 125 mg q6h', drugs:['vancomycinPO']},
       {role:'first', label:'Fidaxomicin（復發率較低）', drugs:['fidaxomicin']},
       {role:'alt', label:'Metronidazole（僅輕症或無替代時）', drugs:['metronidazole']}
     ]}
  ]},
  {group:'非典型', items:[
    {name:'黴漿菌 / 披衣菌', en:'Mycoplasma / Chlamydophila', kw:'mycoplasma chlamydia 非典型 atypical',
     regimens:[
       {role:'first', label:'Azithromycin', drugs:['azithromycin']},
       {role:'alt', label:'Doxycycline／呼吸道 FQ', drugs:['doxycycline']}
     ]},
    {name:'退伍軍人桿菌', en:'Legionella pneumophila', kw:'legionella 退伍軍人',
     regimens:[
       {role:'first', label:'Levofloxacin 或 Azithromycin', drugs:['levofloxacin']}
     ]}
  ]},
  {group:'分枝桿菌 / 放線菌', items:[
    {name:'結核分枝桿菌', en:'Mycobacterium tuberculosis', kw:'tuberculosis TB 結核 分枝桿菌 RIPE',
     note:'標準四合一：強化期 2 個月 RIPE，續 INH＋RIF 維持 4 個月（共 6 個月）；依藥敏調整。',
     regimens:[
       {role:'first', label:'Isoniazid ＋ Rifampin ＋ Pyrazinamide ＋ Ethambutol（RIPE）', drugs:['isoniazid','rifampin','pyrazinamide','ethambutol']}
     ]},
    {name:'諾卡氏菌', en:'Nocardia spp.', kw:'nocardia 諾卡 放線菌 免疫低下',
     note:'免疫低下之肺／腦膿瘍；療程長（數月）。',
     regimens:[
       {role:'first', label:'TMP-SMX（重症加 carbapenem／amikacin）', drugs:['tmpsmx']}
     ]}
  ]},
  {group:'黴菌 / 病毒', items:[
    {name:'白色念珠菌', en:'Candida albicans', kw:'candida 念珠菌 fungus',
     regimens:[
       {role:'first', label:'Fluconazole（穩定）或 Micafungin（中重症）', drugs:['fluconazole']},
       {role:'alt', label:'Micafungin（不穩定／曾用 azole）', drugs:['micafungin']}
     ]},
    {name:'光滑／克魯斯念珠菌', en:'Candida glabrata / krusei', kw:'candida glabrata krusei 念珠菌',
     note:'常對 fluconazole 抗藥／劑量依賴。',
     regimens:[{role:'first', label:'Echinocandin（Micafungin／Anidulafungin）', drugs:['micafungin']}]},
    {name:'麴菌', en:'Aspergillus spp.', kw:'aspergillus 麴菌 侵襲性 黴菌 免疫低下',
     note:'侵襲性麴菌病（中性球低下／免疫低下／移植）。',
     regimens:[
       {role:'first', label:'Voriconazole', drugs:['voriconazole']},
       {role:'alt', label:'Liposomal amphotericin B（或 Isavuconazole，本表未列）', drugs:['amphoLipo']}
     ]},
    {name:'毛黴菌', en:'Mucorales (Mucormycosis)', kw:'mucor mucormycosis 毛黴 糖尿病酮酸',
     note:'糖尿病酮酸中毒／免疫低下之 rhino-orbital-cerebral 或肺部感染；及早手術清創為關鍵。',
     regimens:[
       {role:'first', label:'Liposomal amphotericin B（＋手術清創）', drugs:['amphoLipo']},
       {role:'alt', label:'Isavuconazole／Posaconazole（本表未列）', drugs:[]}
     ]},
    {name:'新型隱球菌', en:'Cryptococcus neoformans', kw:'cryptococcus 隱球菌 腦膜炎 HIV',
     note:'免疫低下／HIV 之腦膜炎：誘導→鞏固→維持三階段。',
     regimens:[
       {role:'first', label:'誘導：Liposomal amphotericin B ＋ Flucytosine', drugs:['amphoLipo','flucytosine']},
       {role:'first', label:'鞏固／維持：Fluconazole', drugs:['fluconazole']}
     ]},
    {name:'巨細胞病毒', en:'Cytomegalovirus (CMV)', kw:'CMV 巨細胞病毒 移植',
     regimens:[{role:'first', label:'Valganciclovir／Ganciclovir', drugs:['valganciclovir','ganciclovir']}]},
    {name:'單純疱疹病毒', en:'Herpes simplex virus (HSV)', kw:'HSV 疱疹 腦炎 生殖器',
     note:'腦炎用靜脈 acyclovir 10 mg/kg q8h ×14–21 天。生殖器疱疹三種口服藥（acyclovir／valacyclovir／famciclovir）療效相當，依方案見下；詳見「依部位 → 性傳染病 STI → 生殖器疱疹」。',
     regimens:[
       {role:'first', label:'腦炎／重症：靜脈 Acyclovir', drugs:['acyclovir']},
       {role:'first', label:'生殖器疱疹初次發作（7–10 天）', drugs:['acyclovir','valacyclovir','famciclovir']},
       {role:'first', label:'復發之發作性治療（1–5 天）／每日抑制療法', drugs:['valacyclovir','famciclovir']}
     ]}
  ]},
  {group:'性傳染病病原體', items:[
    {name:'梅毒螺旋體', en:'Treponema pallidum', kw:'syphilis treponema 梅毒 螺旋體 硬性下疳',
     note:'<b>Penicillin 為唯一有充分實證之藥物</b>，依分期給藥。孕婦青黴素過敏須減敏後仍用 penicillin。追蹤 RPR／VDRL titer，6–12 個月應下降四倍。',
     regimens:[
       {role:'first', label:'初期／二期／早期潛伏：Benzathine penicillin G 2.4 MU IM 單劑', drugs:['penG']},
       {role:'first', label:'晚期潛伏／病期不明／三期：Benzathine penicillin G 2.4 MU IM 每週 ×3', drugs:['penG']},
       {role:'first', label:'神經／眼／耳梅毒：水溶性 Penicillin G 18–24 MU/day ×10–14 天', drugs:['penG']},
       {role:'alt', label:'非孕、非神經性之過敏替代：Doxycycline 100 mg bid ×14 天（晚期 28 天）', drugs:['doxycycline']}
     ]},
    {name:'砂眼披衣菌', en:'Chlamydia trachomatis', kw:'chlamydia 披衣菌 砂眼 LGV 尿道炎 子宮頸炎',
     note:'CDC 2021 首選已由 azithromycin 改為 doxycycline（直腸與咽部療效較佳）。血清型 L1–L3 造成 LGV，療程 21 天。孕期改 azithromycin。',
     regimens:[
       {role:'first', label:'泌尿生殖道／直腸／咽部：Doxycycline 100 mg bid ×7 天', drugs:['doxycycline']},
       {role:'alt', label:'替代：Azithromycin 1 g 單劑／Levofloxacin 500 mg qd ×7 天', drugs:['azithromycin','levofloxacin']},
       {role:'first', label:'孕期：Azithromycin 1 g 單劑（替代 amoxicillin 500 mg tid ×7 天）', drugs:['azithromycin','amoxicillin']},
       {role:'first', label:'LGV（L1–L3）：Doxycycline 100 mg bid ×21 天', drugs:['doxycycline']},
       {role:'first', label:'新生兒結膜炎／嬰兒肺炎：口服 Erythromycin 50 mg/kg/day 分 4 次 ×14 天', drugs:['erythromycin']}
     ]},
    {name:'生殖道黴漿菌', en:'Mycoplasma genitalium', kw:'mycoplasma genitalium 黴漿菌 NGU 尿道炎',
     note:'持續／復發性 NGU 與子宮頸炎之常見病原。細胞壁缺乏 → β-lactam 無效。一律兩階段療法（先 doxycycline 降菌量）。',
     regimens:[
       {role:'first', label:'Macrolide 感受性：Doxycycline ×7 天 → Azithromycin 1 g 後 500 mg qd ×3 天', drugs:['doxycycline','azithromycin']},
       {role:'first', label:'Macrolide 抗藥或無法檢測：Doxycycline ×7 天 → Moxifloxacin 400 mg qd ×7 天', drugs:['doxycycline','moxifloxacin']}
     ]},
    {name:'陰道滴蟲', en:'Trichomonas vaginalis', kw:'trichomonas 滴蟲 陰道炎 原蟲',
     note:'唯一有效之藥物類別為 nitroimidazole。性伴侶須同治，治療後 3 個月重驗。',
     regimens:[
       {role:'first', label:'女性：Metronidazole 500 mg bid ×7 天（優於單劑；HIV 感染者亦同）', drugs:['metronidazole']},
       {role:'first', label:'男性：Metronidazole 2 g 口服單劑', drugs:['metronidazole']},
       {role:'alt', label:'替代：Tinidazole 2 g 口服單劑', drugs:['tinidazole']},
       {role:'special', label:'持續感染：重覆 7 天療程；仍失敗改 Tinidazole 2 g qd ×7 天', drugs:['tinidazole']}
     ]},
    {name:'杜克雷嗜血桿菌（軟性下疳）', en:'Haemophilus ducreyi', kw:'ducreyi chancroid 軟性下疳 生殖器潰瘍',
     note:'疼痛性生殖器潰瘍＋壓痛性腹股溝淋巴結腫（可化膿破潰）。須同時排除梅毒與 HSV，並驗 HIV。',
     regimens:[
       {role:'first', label:'Azithromycin 1 g 單劑 或 Ceftriaxone 250 mg IM 單劑', drugs:['azithromycin','ceftriaxone']},
       {role:'alt', label:'Ciprofloxacin 500 mg bid ×3 天 或 Erythromycin base 500 mg tid ×7 天', drugs:['ciprofloxacin','erythromycin']}
     ]},
    {name:'肉芽腫克雷伯氏菌（腹股溝肉芽腫）', en:'Klebsiella granulomatis', kw:'donovanosis granuloma inguinale 腹股溝肉芽腫 鼠蹊',
     note:'無痛、進行性、易出血之肉芽性潰瘍。療程須持續至病灶完全癒合（≥3 週），癒合前復發常見。',
     regimens:[
       {role:'first', label:'Azithromycin 1 g 每週一次（或 500 mg qd），≥3 週且癒合', drugs:['azithromycin']},
       {role:'alt', label:'Doxycycline 100 mg bid／TMP-SMX 1 DS bid／Erythromycin base 500 mg qid', drugs:['doxycycline','tmpsmx','erythromycin']}
     ]},
    {name:'細菌性陰道炎菌叢', en:'Bacterial vaginosis-associated flora', kw:'BV gardnerella 細菌性陰道炎 陰道菌叢 厭氧',
     note:'乳酸桿菌減少、Gardnerella vaginalis 與厭氧菌過度增生之菌叢失衡（非單一致病菌）。僅治療有症狀者；男性伴侶不需治療。',
     regimens:[
       {role:'first', label:'Metronidazole 口服 500 mg bid ×7 天，或 0.75% 陰道凝膠 5 g qd ×5 天', drugs:['metronidazole']},
       {role:'first', label:'Clindamycin 2% 陰道乳膏 5 g 睡前 ×7 天', drugs:['clindamycin']},
       {role:'alt', label:'口服 Clindamycin 300 mg bid ×7 天／Tinidazole 2 g qd ×2 天', drugs:['clindamycin','tinidazole']}
     ]},
    {name:'人類乳突病毒', en:'Human papillomavirus (HPV)', kw:'HPV 菜花 尖形濕疣 疣 乳突',
     note:'無全身性抗病毒藥；治療只去除疣體、不能根除感染。疫苗為主要預防手段。子宮頸疣須先排除 HSIL。',
     regimens:[
       {role:'first', label:'病人自行塗抹：Imiquimod 3.75%／5% 乳膏', drugs:['imiquimod']},
       {role:'first', label:'病人自行塗抹：Podofilox 0.5% 溶液／凝膠（孕婦禁用）', drugs:['podofilox']},
       {role:'first', label:'醫師施行：冷凍治療／手術切除／TCA 或 BCA 80–90%', drugs:[]}
     ]},
    {name:'陰蝨', en:'Phthirus pubis', kw:'pediculosis pubis 陰蝨 蝨 外寄生蟲',
     regimens:[
       {role:'first', label:'Permethrin 1% cream rinse 塗 10 分鐘後洗掉', drugs:['permethrin']},
       {role:'alt', label:'口服 Ivermectin 250 µg/kg，7–14 天後重複', drugs:['ivermectin']}
     ]},
    {name:'疥蟎', en:'Sarcoptes scabiei', kw:'scabies 疥瘡 疥蟎 外寄生蟲 結痂型',
     note:'治療後搔癢可持續 2 週，非治療失敗。同住者與性接觸者須一併治療。',
     regimens:[
       {role:'first', label:'Permethrin 5% 乳膏頸部以下全身，8–14 小時後洗掉', drugs:['permethrin']},
       {role:'first', label:'口服 Ivermectin 200 µg/kg，第 1、14 天各一次', drugs:['ivermectin']},
       {role:'special', label:'結痂型：局部 permethrin ＋ 口服 ivermectin 多劑', drugs:['permethrin','ivermectin']}
     ]}
  ]}
];

/* ---- 覆蓋標記顯示名 ---- */
window.COV_LABELS={mrsa:'MRSA',pseudo:'Pseudomonas',anaerobe:'厭氧',atypical:'非典型',esbl:'ESBL',enterococcus:'腸球菌'};
window.COV_LABELS_FUNGAL={candida:'Candida',glabkrusei:'glabrata/krusei',aspergillus:'Aspergillus',mucor:'Mucorales',fusarium:'Fusarium',histo:'Histoplasma',blasto:'Blastomyces',cocci:'Coccidioides'};
/* 抗病毒：病毒別八旗標（covSet:'viral'） */
window.COV_LABELS_VIRAL={hsv:'HSV/VZV',cmv:'CMV',flu:'Influenza',cov2:'SARS-CoV-2',hbv:'HBV',hcv:'HCV',hiv:'HIV',rsv:'RSV'};
/* 抗寄生蟲／原蟲：旗標（covSet:'para'） */
/* ameba 旗標涵蓋阿米巴、梨形鞭毛蟲、弓形蟲等——阿米巴本身即原蟲的一種（非並列關係），
   且本旗標不只阿米巴，故用上位詞「原蟲」；瘧原蟲另立旗標。 */
window.COV_LABELS_PARA={malaria:'瘧原蟲',ameba:'原蟲',nematode:'線蟲',cestode:'絛蟲',trematode:'吸蟲',ectopara:'外寄生蟲'};

/* ---- regimen role 顯示文字（原內嵌於 render 邏輯旁，屬資料） ---- */
window.ROLE_TXT={first:'首選',alt:'替代',special:'特殊 / 加用',none:'不需 / 不建議'};
