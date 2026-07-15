/* 台大醫院 2025 上半年臨床分離菌株抗生素感受性 (%S)。來源：抗生素感受性.pdf／
   data/ntuh-antibiogram-2025H1.json（檢驗醫學部細菌暨黴菌檢驗組，CLSI M100 S34）。
   內嵌以維持單檔離線。值為 %S；"NA"=該藥/菌未列或分離數不足。 */
window.ABG = {"gram_negative":{"ab":["SAM","TZP","cefazolin_urine","cefazolin_other","cefmetazole","cefotaxime","ceftazidime","cefepime","ertapenem","imipenem","meropenem","gentamicin","amikacin","ciprofloxacin","levofloxacin","tigecycline","colistin","SXT"],"org":{"Escherichia coli":{"n":3763,"S":[35,89,56,0,86,61,78,92,98,99,99,75,96,56,44,99,98,50]},"Klebsiella pneumoniae":{"n":1969,"S":[56,79,61,0,72,69,71,90,89,93,95,75,94,73,59,89,97,63]},"Klebsiella oxytoca":{"n":215,"S":[55,84,"NA",0,90,73,77,93,93,93,94,81,93,77,78,99,"NA",78]},"Enterobacter cloacae":{"n":527,"S":[1,59,"NA",0,"NA",44,49,80,84,89,93,84,88,66,61,81,95,64]},"Serratia marcescens":{"n":360,"S":[2,83,"NA",0,2,66,72,90,90,"NA",95,83,87,71,69,74,"NA",79]},"Proteus mirabilis":{"n":581,"S":[68,98,83,0,94,84,94,99,99,"NA",99,71,98,74,75,"NA","NA",51]},"Proteus/Morganella/Providencia":{"n":322,"S":[37,97,"NA","NA",94,84,87,99,98,"NA",99,86,98,85,83,"NA","NA",80]},"Salmonella (non-typhi)":{"n":81,"S":["NA","NA","NA","NA","NA",64,67,"NA","NA","NA","NA","NA","NA",49,"NA","NA","NA",47]},"Pseudomonas aeruginosa":{"n":1455,"S":["NA",79,"NA","NA","NA","NA",86,87,"NA",89,88,"NA","NA",86,83,"NA",98,"NA"]},"Acinetobacter baumannii complex":{"n":909,"S":[82,73,"NA","NA","NA","NA",72,74,"NA",75,75,77,"NA",74,75,"NA",99,"NA"]},"Carbapenem-resistant A. baumannii (CRAB)":{"n":243,"S":[30,2,"NA","NA","NA","NA",10,8,"NA",1,0,20,"NA",5,6,"NA",97,"NA"]},"non-MDRAB complex":{"n":690,"S":[99,96,"NA","NA","NA","NA",92,96,"NA",100,100,96,"NA",97,98,"NA",99,"NA"]},"Burkholderia cepacia complex":{"n":163,"S":["NA","NA","NA","NA","NA","NA",84,"NA","NA","NA",74,"NA","NA","NA",28,"NA","NA",88]},"Stenotrophomonas maltophilia":{"n":693,"S":["NA","NA","NA","NA","NA","NA","NA","NA","NA","NA","NA","NA","NA","NA",86,"NA","NA",85]},"Chryseobacterium indologenes":{"n":256,"S":["NA",4,"NA","NA","NA","NA",3,9,"NA",6,4,0,1,33,39,"NA","NA","NA"]},"Sphingomonas paucimobilis":{"n":104,"S":["NA",18,"NA","NA","NA","NA",57,68,"NA",98,98,73,79,71,91,"NA","NA","NA"]}}},"gram_positive":{"ab":["penicillin","ampicillin","oxacillin","cefotaxime","gentamicin","gentamicin_high","ciprofloxacin","levofloxacin","moxifloxacin","vancomycin","daptomycin","clindamycin","erythromycin","tetracycline","fusidic_acid","linezolid","SXT","chloramphenicol"],"org":{"Staphylococcus aureus":{"n":1532,"S":["NA","NA",66,"NA",74,"NA",81,82,"NA",100,100,74,48,61,87,99,96,"NA"]},"MRSA":{"n":549,"S":["NA","NA",0,"NA",74,"NA",54,54,"NA",100,100,53,24,70,90,99,92,"NA"]},"MSSA":{"n":983,"S":["NA","NA",100,"NA",73,"NA",96,96,"NA",100,100,86,62,55,85,100,99,"NA"]},"Coagulase-negative staphylococci":{"n":1023,"S":["NA","NA",27,"NA",62,"NA",53,53,"NA",99,100,53,45,58,42,99,77,"NA"]},"Enterococcus faecalis":{"n":1483,"S":[98,99,"NA","NA","NA",62,88,89,"NA",99,79,"NA","NA",10,"NA",83,"NA","NA"]},"Enterococcus faecium":{"n":1317,"S":[5,5,"NA","NA","NA",61,5,7,"NA",47,"NA","NA","NA",42,"NA",98,"NA","NA"]},"Enterococcus spp. (other)":{"n":242,"S":[57,61,"NA","NA","NA",90,92,90,"NA",66,"NA","NA","NA",33,"NA",93,"NA","NA"]},"Streptococcus pyogenes (Group A)":{"n":115,"S":[100,"NA","NA","NA","NA","NA","NA",94,"NA","NA","NA",29,30,25,"NA","NA","NA",98]},"Streptococcus agalactiae (Group B)":{"n":725,"S":[100,"NA","NA","NA","NA","NA","NA",93,"NA","NA","NA",49,52,21,"NA","NA","NA",88]},"Streptococcus pneumoniae":{"n":82,"S":[78,"NA","NA",64,"NA","NA","NA",98,98,100,"NA",21,0,7,"NA","NA","NA",88]}}},"anaerobic":{"ab":["penicillin","SAM","cefmetazole","flomoxef","clindamycin","metronidazole","chloramphenicol"],"org":{"Bacteroides fragilis":{"n":193,"S":[1,72,73,70,42,99,95]},"Bacteroides species (other than B. fragilis)":{"n":153,"S":[7,54,22,39,23,97,94]},"Prevotella species":{"n":151,"S":[22,100,99,92,46,90,97]},"Fusobacterium species":{"n":45,"S":[82,100,98,98,58,100,100]},"Peptostreptococcus species (other than P. anaerobius)":{"n":9,"S":[100,88,89,100,83,100,100]}}},"haemophilus":{"ab":["ampicillin","AMC","cefuroxime","cefpodoxime","cefotaxime","cefixime","chloramphenicol","SXT"],"org":{"Haemophilus influenzae":{"n":280,"S":[30,"NA",69,84,99,82,99,40]}}}};

/* 黴菌節（台大 2025 H1，CLSI M38／M51S；period 2025-01~06）。"NI"=無判讀標準；"75(SDD)"=劑量依賴敏感。 */
window.ABG.candida = {"ab":["fluconazole","voriconazole","anidulafungin","caspofungin","micafungin","amphotericin_B","flucytosine"],"org":{"Candida albicans":{"n":16,"S":[100,100,100,100,100,"NI","NI"]},"Candida tropicalis":{"n":23,"S":[70,48,100,96,100,"NI","NI"]},"Nakaseomyces glabrata (Candida glabrata)":{"n":16,"S":["75(SDD)","NI",100,75,100,"NI","NI"]},"Candida parapsilosis complex":{"n":14,"S":[100,100,100,100,100,"NI","NI"]}}};

/* 抗生素表所有菌種的縮寫顯示名。 */
window.ABG_ORG_LABEL = {
  'Candida albicans':'C. albicans','Candida tropicalis':'C. tropicalis','Nakaseomyces glabrata (Candida glabrata)':'C. glabrata','Candida parapsilosis complex':'C. parapsilosis',
  'Escherichia coli':'E. coli','Klebsiella pneumoniae':'K. pneumoniae','Klebsiella oxytoca':'K. oxytoca','Enterobacter cloacae':'E. cloacae','Serratia marcescens':'S. marcescens','Proteus mirabilis':'P. mirabilis','Proteus/Morganella/Providencia':'Proteus／Morg／Prov','Salmonella (non-typhi)':'Salmonella','Pseudomonas aeruginosa':'P. aeruginosa','Acinetobacter baumannii complex':'A. baumannii','Carbapenem-resistant A. baumannii (CRAB)':'CRAB','non-MDRAB complex':'non-MDRAB','Burkholderia cepacia complex':'B. cepacia','Stenotrophomonas maltophilia':'S. maltophilia','Chryseobacterium indologenes':'C. indologenes','Sphingomonas paucimobilis':'S. paucimobilis',
  'Staphylococcus aureus':'S. aureus','MRSA':'MRSA','MSSA':'MSSA','Coagulase-negative staphylococci':'CoNS','Enterococcus faecalis':'E. faecalis','Enterococcus faecium':'E. faecium','Enterococcus spp. (other)':'Enterococcus spp.','Streptococcus pyogenes (Group A)':'S. pyogenes (GAS)','Streptococcus agalactiae (Group B)':'S. agalactiae (GBS)','Streptococcus pneumoniae':'S. pneumoniae',
  'Bacteroides fragilis':'B. fragilis','Bacteroides species (other than B. fragilis)':'Bacteroides spp.','Prevotella species':'Prevotella','Fusobacterium species':'Fusobacterium','Peptostreptococcus species (other than P. anaerobius)':'Peptostreptococcus',
  'Haemophilus influenzae':'H. influenzae'
};

/* 抗生素表欄位（抗生素）縮寫顯示名，用於「依細菌」的感受性徽章。 */
window.ABG_AB_LABEL = {
  SAM:'Amp-sulbactam', TZP:'Pip-tazo', cefazolin_urine:'Cefazolin(尿)', cefazolin_other:'Cefazolin',
  cefmetazole:'Cefmetazole', cefotaxime:'Cefotaxime', ceftazidime:'Ceftazidime', cefepime:'Cefepime',
  ertapenem:'Ertapenem', imipenem:'Imipenem', meropenem:'Meropenem', gentamicin:'Gentamicin',
  gentamicin_high:'Gentamicin(HL)', amikacin:'Amikacin', ciprofloxacin:'Ciprofloxacin',
  levofloxacin:'Levofloxacin', moxifloxacin:'Moxifloxacin', tigecycline:'Tigecycline', colistin:'Colistin',
  SXT:'TMP-SMX', penicillin:'Penicillin', ampicillin:'Ampicillin', oxacillin:'Oxacillin',
  vancomycin:'Vancomycin', daptomycin:'Daptomycin', clindamycin:'Clindamycin', erythromycin:'Erythromycin',
  tetracycline:'Tetracycline', fusidic_acid:'Fusidic acid', linezolid:'Linezolid',
  chloramphenicol:'Chloramphenicol', flomoxef:'Flomoxef', metronidazole:'Metronidazole',
  AMC:'Amox-clav', cefuroxime:'Cefuroxime', cefpodoxime:'Cefpodoxime', cefixime:'Cefixime',
  fluconazole:'Fluconazole', voriconazole:'Voriconazole', anidulafungin:'Anidulafungin',
  caspofungin:'Caspofungin', micafungin:'Micafungin', amphotericin_B:'Amphotericin B', flucytosine:'Flucytosine'
};

/* antibiogram 抗生素欄位鍵 → DRUGS 藥卡 key（供「依病原菌」納入在地高感受性藥物；
   部分為同類代表：erythromycin→azithromycin、tetracycline→doxycycline、gentamicin_high→gentamicin、
   cefazolin_urine/other→cefazolin、oxacillin→nafcillin(Oxacillin卡)、amphotericin_B→amphoLipo。
   無對應藥卡者（fusidic_acid／chloramphenicol／cefpodoxime）省略。 */
window.ABG_AB_DRUG = {
  SAM:'ampsulbactam', TZP:'piptazo', cefazolin_urine:'cefazolin', cefazolin_other:'cefazolin',
  cefmetazole:'cefmetazole', cefotaxime:'cefotaxime', ceftazidime:'ceftazidime', cefepime:'cefepime',
  ertapenem:'ertapenem', imipenem:'imipenem', meropenem:'meropenem', gentamicin:'gentamicin',
  gentamicin_high:'gentamicin', amikacin:'amikacin', ciprofloxacin:'ciprofloxacin',
  levofloxacin:'levofloxacin', moxifloxacin:'moxifloxacin', tigecycline:'tigecycline', colistin:'colistin',
  SXT:'tmpsmx', penicillin:'penG', ampicillin:'ampicillin', oxacillin:'nafcillin',
  vancomycin:'vancomycin', daptomycin:'daptomycin', clindamycin:'clindamycin', erythromycin:'azithromycin',
  tetracycline:'doxycycline', linezolid:'linezolid', flomoxef:'flomoxef', metronidazole:'metronidazole',
  AMC:'amoxclav', cefuroxime:'cefuroxime', cefixime:'cefixime',
  fluconazole:'fluconazole', voriconazole:'voriconazole', anidulafungin:'anidulafungin',
  caspofungin:'caspofungin', micafungin:'micafungin', amphotericin_B:'amphoLipo', flucytosine:'flucytosine'
};

/* 病原菌 → 台大 antibiogram 菌種對照（以 BACTERIA 的 en 為鍵；一菌可對多列）。
   在抗生素表無資料之菌（Viridans、Listeria、Neisseria、CRE、非典型…）不列，故不顯示徽章。 */
window.BAC_ABG = {
  'S. aureus, methicillin-susceptible':{sec:'gram_positive',org:'MSSA'},
  'S. aureus, methicillin-resistant':{sec:'gram_positive',org:'MRSA'},
  'Streptococcus pneumoniae':{sec:'gram_positive',org:'Streptococcus pneumoniae'},
  'Streptococcus pyogenes (GAS)':{sec:'gram_positive',org:'Streptococcus pyogenes (Group A)'},
  'Streptococcus agalactiae (GBS)':{sec:'gram_positive',org:'Streptococcus agalactiae (Group B)'},
  'Enterococcus faecalis':[{sec:'gram_positive',org:'Enterococcus faecalis'},{sec:'gram_positive',org:'Enterococcus spp. (other)'}],
  'Enterococcus faecium / VRE':{sec:'gram_positive',org:'Enterococcus faecium'},
  'Coagulase-negative staphylococci':{sec:'gram_positive',org:'Coagulase-negative staphylococci'},
  'E. coli / Klebsiella (non-ESBL)':[{sec:'gram_negative',org:'Escherichia coli'},{sec:'gram_negative',org:'Klebsiella pneumoniae'},{sec:'gram_negative',org:'Klebsiella oxytoca'}],
  'AmpC producers':[{sec:'gram_negative',org:'Enterobacter cloacae'},{sec:'gram_negative',org:'Serratia marcescens'}],
  'Pseudomonas aeruginosa':{sec:'gram_negative',org:'Pseudomonas aeruginosa'},
  'Acinetobacter baumannii':[{sec:'gram_negative',org:'Acinetobacter baumannii complex'},{sec:'gram_negative',org:'Carbapenem-resistant A. baumannii (CRAB)'},{sec:'gram_negative',org:'non-MDRAB complex'}],
  'Stenotrophomonas maltophilia':{sec:'gram_negative',org:'Stenotrophomonas maltophilia'},
  'Haemophilus influenzae':{sec:'haemophilus',org:'Haemophilus influenzae'},
  'Proteus / Morganella / Providencia':[{sec:'gram_negative',org:'Proteus mirabilis'},{sec:'gram_negative',org:'Proteus/Morganella/Providencia'}],
  'Non-typhoidal Salmonella, invasive':{sec:'gram_negative',org:'Salmonella (non-typhi)'},
  'Burkholderia cepacia complex':{sec:'gram_negative',org:'Burkholderia cepacia complex'},
  'Bacteroides fragilis':[{sec:'anaerobic',org:'Bacteroides fragilis'},{sec:'anaerobic',org:'Bacteroides species (other than B. fragilis)'},{sec:'anaerobic',org:'Prevotella species'},{sec:'anaerobic',org:'Fusobacterium species'},{sec:'anaerobic',org:'Peptostreptococcus species (other than P. anaerobius)'}],
  'Chryseobacterium indologenes':{sec:'gram_negative',org:'Chryseobacterium indologenes'},
  'Sphingomonas paucimobilis':{sec:'gram_negative',org:'Sphingomonas paucimobilis'},
  'Candida albicans':[{sec:'candida',org:'Candida albicans'},{sec:'candida',org:'Candida tropicalis'},{sec:'candida',org:'Candida parapsilosis complex'}],
  'Candida glabrata / krusei':{sec:'candida',org:'Nakaseomyces glabrata (Candida glabrata)'}
};
