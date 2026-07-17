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
    {name:'淋病雙球菌', en:'Neisseria gonorrhoeae', kw:'gonorrhea 淋病',
     note:'合併 Chlamydia 覆蓋。',
     regimens:[{role:'first', label:'Ceftriaxone（＋Azithromycin／Doxycycline）', drugs:['ceftriaxone','azithromycin']}]},
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
    {name:'單純疱疹病毒', en:'Herpes simplex virus (HSV)', kw:'HSV 疱疹 腦炎',
     regimens:[{role:'first', label:'Acyclovir', drugs:['acyclovir']}]}
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
