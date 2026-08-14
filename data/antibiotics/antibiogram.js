/* 台大醫院 2026 上半年（01~06 月）臨床分離菌株抗生素感受性 (%S)。
   來源：最新抗生素感受性報表_-_總院.pdf（感染科／感染管制中心／檢驗醫學部細菌暨黴菌檢驗組，
   CLSI M100 S34）／data/ntuh-antibiogram-2026H1.json。內嵌以維持單檔離線。
   值為 %S；"NA"＝報表該格為「－」（未列／未測／無判讀標準）。
   分母＝病人每月分離之第一株相同菌名細菌。
   未匯入：CZA／FDC／CTT／IPR 四支新藥欄（選擇性送驗、分母不明且與 CRE 分層互相矛盾）、
   革蘭氏陰性表的 AM 與 CRO 欄（僅 E. coli 一列有值、且 AM 50% > SAM 35% 不合藥理）。原因見 JSON 的 _meta.not_imported。 */
window.ABG = {"gram_negative":{"ab":["SAM", "TZP", "cefazolin_urine", "cefazolin_other", "cefmetazole", "cefotaxime", "ceftazidime", "cefepime", "ertapenem", "imipenem", "meropenem", "gentamicin", "amikacin", "amikacin_urine", "ciprofloxacin", "levofloxacin", "tigecycline", "colistin", "SXT"],"org":{"Escherichia coli":{"n":4086,"S":[35,90,52,0,84,57,76,91,97,98,99,76,96,"NA",53,41,99,98,47]},"CRE (Escherichia coli)":{"n":93,"S":[1,11,1,0,16,0,7,40,1,49,59,68,78,"NA",23,19,92,96,17]},"Klebsiella pneumoniae":{"n":2177,"S":[50,77,56,0,69,66,67,88,87,90,93,72,92,"NA",68,54,86,95,59]},"CRE (Klebsiella pneumoniae)":{"n":269,"S":[0,9,0,0,11,2,4,35,1,23,44,36,56,"NA",8,4,57,80,17]},"Klebsiella oxytoca":{"n":183,"S":[51,84,"NA","NA",89,71,75,95,95,94,95,79,92,"NA",78,75,96,100,72]},"Enterobacter cloacae":{"n":701,"S":[0,58,"NA","NA",0,45,48,81,82,87,92,86,88,"NA",65,61,78,93,64]},"CRE (Enterobacter cloacae)":{"n":143,"S":[0,21,"NA","NA",0,14,15,57,15,25,50,69,75,"NA",47,45,61,89,45]},"Citrobacter koseri":{"n":239,"S":[80,92,"NA","NA",94,91,94,99,97,98,99,98,99,"NA",94,92,99,100,95]},"Serratia marcescens":{"n":166,"S":[0,57,"NA","NA",0,40,42,76,77,100,86,81,80,"NA",43,42,42,0,56]},"Serratia species (other)":{"n":430,"S":[1,67,"NA","NA",0,54,59,85,85,100,91,88,90,"NA",58,56,61,0,65]},"Proteus mirabilis":{"n":605,"S":[68,98,80,0,91,81,92,98,99,"NA",99,75,97,"NA",80,80,"NA","NA",50]},"Morganella morganii":{"n":179,"S":[10,96,0,0,90,76,81,99,98,0,99,90,98,"NA",77,77,0,"NA",73]},"Salmonella (non-typhi)":{"n":10,"S":["NA","NA","NA","NA","NA",40,40,"NA",60,70,80,"NA","NA","NA",30,"NA","NA","NA",20]},"Aeromonas species":{"n":62,"S":[0,65,"NA","NA",100,83,83,93,80,100,94,98,100,"NA",96,98,"NA","NA",88]},"Pseudomonas aeruginosa":{"n":1782,"S":["NA",71,"NA","NA","NA","NA",80,83,"NA",84,84,"NA","NA",98,80,75,0,98,"NA"]},"Carbapenem-resistant P. aeruginosa (CRPA)":{"n":288,"S":["NA",26,"NA","NA","NA","NA",43,47,"NA",6,3,"NA","NA",92,42,30,0,96,"NA"]},"Acinetobacter baumannii":{"n":375,"S":[76,69,"NA","NA","NA",0,69,71,"NA",73,73,74,"NA","NA",71,72,100,98,100]},"Carbapenem-resistant A. baumannii (CRAB)":{"n":98,"S":[10,0,"NA","NA","NA","NA",0,1,"NA",0,0,10,"NA","NA",0,0,"NA",95,"NA"]},"non-CR A. baumannii":{"n":277,"S":[100,94,"NA","NA","NA",0,93,97,"NA",100,100,97,"NA","NA",96,98,100,98,100]},"Acinetobacter nosocomialis":{"n":314,"S":[89,76,"NA","NA","NA","NA",84,83,"NA",78,78,83,"NA","NA",78,81,100,93,"NA"]},"Acinetobacter baumannii complex":{"n":228,"S":[79,66,"NA","NA","NA","NA",68,72,"NA",71,71,76,"NA","NA",72,73,100,96,"NA"]},"Stenotrophomonas maltophilia":{"n":783,"S":["NA",0,"NA","NA",0,0,"NA",0,0,0,0,0,0,"NA",0,78,0,"NA",77]},"Burkholderia cepacia complex":{"n":168,"S":["NA","NA","NA","NA","NA","NA",83,"NA","NA","NA",64,"NA","NA","NA","NA",22,"NA","NA",91]},"Chryseobacterium indologenes":{"n":249,"S":["NA",1,"NA","NA","NA","NA",1,6,"NA",5,2,0,0,"NA",26,34,0,"NA","NA"]},"Sphingomonas paucimobilis":{"n":109,"S":["NA",19,"NA","NA","NA","NA",52,65,"NA",98,100,70,73,"NA",66,93,"NA",0,"NA"]}}},"gram_positive":{"ab":["penicillin", "ampicillin", "oxacillin", "cefotaxime", "gentamicin", "gentamicin_high", "ciprofloxacin", "levofloxacin", "moxifloxacin", "vancomycin", "daptomycin", "clindamycin", "erythromycin", "tetracycline", "fusidic_acid", "linezolid", "SXT", "chloramphenicol"],"org":{"Staphylococcus aureus":{"n":1328,"S":["NA","NA",67,"NA",76,"NA",79,79,"NA",100,100,71,50,54,82,99,94,"NA"]},"MSSA":{"n":857,"S":["NA","NA",100,"NA",77,"NA",95,96,"NA",100,100,80,62,51,79,99,98,"NA"]},"MRSA":{"n":426,"S":["NA","NA",0,"NA",72,"NA",44,44,"NA",100,100,51,22,59,86,99,85,"NA"]},"Staphylococcus epidermidis":{"n":528,"S":["NA","NA",24,"NA",62,"NA",60,60,"NA",99,100,51,42,52,47,100,68,"NA"]},"Staphylococcus capitis":{"n":298,"S":["NA","NA",22,"NA",43,"NA",29,31,"NA",100,100,47,44,57,26,100,89,"NA"]},"Staphylococcus haemolyticus":{"n":227,"S":["NA","NA",7,"NA",37,"NA",19,22,"NA",100,100,36,13,62,50,100,48,"NA"]},"Staphylococcus hominis":{"n":94,"S":["NA","NA",36,"NA",88,"NA",64,64,"NA",100,100,41,27,48,30,100,85,"NA"]},"Staphylococcus lugdunensis":{"n":36,"S":["NA","NA",69,"NA",86,"NA",90,95,"NA",100,100,73,73,60,75,100,100,"NA"]},"Enterococcus faecalis":{"n":1442,"S":[98,99,"NA","NA","NA",63,85,86,"NA",99,65,"NA",12,9,"NA",80,"NA",100]},"Enterococcus faecium":{"n":1447,"S":[5,5,"NA","NA","NA",62,3,3,"NA",43,66,"NA",4,36,"NA",98,"NA","NA"]},"Enterococcus faecium (VRE)":{"n":822,"S":[0,0,"NA","NA","NA",54,0,0,"NA",0,50,"NA",2,24,"NA",98,"NA","NA"]},"Enterococcus faecium (non-VRE)":{"n":625,"S":[11,12,"NA","NA","NA",73,7,8,"NA",100,100,"NA",6,53,"NA",97,"NA","NA"]},"Enterococcus spp. (other)":{"n":220,"S":[58,65,"NA","NA","NA",87,90,88,"NA",69,75,"NA",52,29,"NA",90,"NA","NA"]},"Streptococcus agalactiae (Group B)":{"n":763,"S":[100,100,"NA",100,"NA","NA","NA",93,"NA",100,"NA",42,45,17,"NA","NA","NA","NA"]},"Streptococcus pyogenes (Group A)":{"n":23,"S":[100,"NA","NA",100,"NA","NA","NA",95,"NA",100,"NA",47,47,39,"NA","NA","NA","NA"]},"Streptococcus pneumoniae":{"n":26,"S":[80,"NA","NA",84,"NA","NA","NA",96,96,100,"NA",40,0,11,"NA","NA","NA","NA"]},"Streptococcus anginosus":{"n":39,"S":[100,"NA","NA",96,"NA","NA","NA",97,"NA",100,"NA",58,70,43,"NA","NA","NA","NA"]},"Streptococcus constellatus":{"n":24,"S":[87,"NA","NA",100,"NA","NA","NA",95,"NA",100,"NA",60,66,62,"NA","NA","NA","NA"]}}},"anaerobic":{"ab":["penicillin", "SAM", "cefmetazole", "flomoxef", "clindamycin", "metronidazole", "chloramphenicol"],"org":{"Bacteroides fragilis":{"n":179,"S":[0,72,76,68,38,98,92]},"Bacteroides thetaiotaomicron":{"n":79,"S":[0,56,1,32,10,100,97]},"Bacteroides pyogenes":{"n":21,"S":[42,85,100,95,42,100,100]},"Parabacteroides distasonis":{"n":25,"S":[4,24,16,28,16,100,92]},"Prevotella bivia":{"n":58,"S":[10,98,100,96,36,82,93]},"Prevotella disiens":{"n":17,"S":[11,100,100,94,17,94,100]},"Prevotella buccae":{"n":15,"S":[40,100,100,73,66,100,100]},"Fusobacterium varium":{"n":15,"S":[73,93,100,93,0,93,100]},"Veillonella parvula":{"n":26,"S":[42,100,100,100,73,96,100]},"Finegoldia magna":{"n":66,"S":[100,100,100,98,53,100,100]},"Clostridium perfringens":{"n":63,"S":[95,100,98,100,58,100,98]},"Peptoniphilus species":{"n":57,"S":[87,100,100,100,71,98,100]},"Parvimonas micra":{"n":53,"S":[98,100,100,100,81,100,100]},"Propionibacterium species":{"n":36,"S":[100,100,100,100,94,0,94]},"Peptostreptococcus anaerobius":{"n":30,"S":[33,56,100,100,76,96,96]}}},"haemophilus":{"ab":["ampicillin", "AMC", "cefuroxime", "cefpodoxime", "cefotaxime", "cefixime", "chloramphenicol", "SXT"],"org":{"Haemophilus influenzae":{"n":88,"S":[47,"NA",72,89,97,88,98,42]}}}};

/* 黴菌節（台大 2026 H1，CLSI M38／M51S）。本期報表僅列三株別，未列 C. glabrata。
   報表另有 5-FC(FLU)／amphotericin B(AB)／itraconazole／posaconazole 欄，全數為「－」故為 NA。 */
window.ABG.candida = {"ab":["fluconazole", "voriconazole", "anidulafungin", "caspofungin", "micafungin", "amphotericin_B", "flucytosine"],"org":{"Candida albicans":{"n":40,"S":[100,100,100,100,100,"NA","NA"]},"Candida tropicalis":{"n":24,"S":[87,87,100,91,95,"NA","NA"]},"Candida parapsilosis complex":{"n":15,"S":[93,93,100,100,100,"NA","NA"]}}};

/* 抗生素表所有菌種的縮寫顯示名。 */
window.ABG_ORG_LABEL = {
  "Candida albicans":"C. albicans", "Candida tropicalis":"C. tropicalis", "Candida parapsilosis complex":"C. parapsilosis",
  "Escherichia coli":"E. coli", "CRE (Escherichia coli)":"CRE E. coli", "Klebsiella pneumoniae":"K. pneumoniae", "CRE (Klebsiella pneumoniae)":"CRE K. pneumoniae", "Klebsiella oxytoca":"K. oxytoca", "Enterobacter cloacae":"E. cloacae", "CRE (Enterobacter cloacae)":"CRE E. cloacae", "Citrobacter koseri":"C. koseri", "Serratia marcescens":"S. marcescens", "Serratia species (other)":"Serratia spp.", "Proteus mirabilis":"P. mirabilis", "Morganella morganii":"M. morganii", "Salmonella (non-typhi)":"Salmonella", "Aeromonas species":"Aeromonas", "Pseudomonas aeruginosa":"P. aeruginosa", "Carbapenem-resistant P. aeruginosa (CRPA)":"CRPA", "Acinetobacter baumannii":"A. baumannii", "Carbapenem-resistant A. baumannii (CRAB)":"CRAB", "non-CR A. baumannii":"non-CR A. baumannii", "Acinetobacter nosocomialis":"A. nosocomialis", "Acinetobacter baumannii complex":"A. baumannii complex", "Stenotrophomonas maltophilia":"S. maltophilia", "Burkholderia cepacia complex":"B. cepacia", "Chryseobacterium indologenes":"C. indologenes", "Sphingomonas paucimobilis":"S. paucimobilis",
  "Staphylococcus aureus":"S. aureus", "MSSA":"MSSA", "MRSA":"MRSA", "Staphylococcus epidermidis":"S. epidermidis", "Staphylococcus capitis":"S. capitis", "Staphylococcus haemolyticus":"S. haemolyticus", "Staphylococcus hominis":"S. hominis", "Staphylococcus lugdunensis":"S. lugdunensis", "Enterococcus faecalis":"E. faecalis", "Enterococcus faecium":"E. faecium", "Enterococcus faecium (VRE)":"E. faecium VRE", "Enterococcus faecium (non-VRE)":"E. faecium 非VRE", "Enterococcus spp. (other)":"Enterococcus spp.", "Streptococcus agalactiae (Group B)":"S. agalactiae (GBS)", "Streptococcus pyogenes (Group A)":"S. pyogenes (GAS)", "Streptococcus pneumoniae":"S. pneumoniae", "Streptococcus anginosus":"S. anginosus", "Streptococcus constellatus":"S. constellatus",
  "Bacteroides fragilis":"B. fragilis", "Bacteroides thetaiotaomicron":"B. thetaiotaomicron", "Bacteroides pyogenes":"B. pyogenes", "Parabacteroides distasonis":"P. distasonis", "Prevotella bivia":"P. bivia", "Prevotella disiens":"P. disiens", "Prevotella buccae":"P. buccae", "Fusobacterium varium":"F. varium", "Veillonella parvula":"V. parvula", "Finegoldia magna":"F. magna", "Clostridium perfringens":"C. perfringens", "Peptoniphilus species":"Peptoniphilus", "Parvimonas micra":"P. micra", "Propionibacterium species":"Propionibacterium", "Peptostreptococcus anaerobius":"P. anaerobius",
  "Haemophilus influenzae":"H. influenzae"
};

/* 抗生素表欄位（抗生素）縮寫顯示名，用於「依細菌」的感受性徽章。 */
window.ABG_AB_LABEL = {
  SAM:'Amp-sulbactam', TZP:'Pip-tazo', cefazolin_urine:'Cefazolin(尿)', cefazolin_other:'Cefazolin',
  cefmetazole:'Cefmetazole', cefotaxime:'Cefotaxime', ceftazidime:'Ceftazidime', cefepime:'Cefepime',
  ertapenem:'Ertapenem', imipenem:'Imipenem', meropenem:'Meropenem', gentamicin:'Gentamicin',
  gentamicin_high:'Gentamicin(HL)', amikacin:'Amikacin', amikacin_urine:'Amikacin(尿)',
  ciprofloxacin:'Ciprofloxacin', levofloxacin:'Levofloxacin', moxifloxacin:'Moxifloxacin',
  tigecycline:'Tigecycline', colistin:'Colistin',
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
   cefazolin_urine/other→cefazolin、amikacin_urine→amikacin、oxacillin→nafcillin(Oxacillin卡)、
   amphotericin_B→amphoLipo。無對應藥卡者（fusidic_acid／chloramphenicol／cefpodoxime）省略。 */
window.ABG_AB_DRUG = {
  SAM:'ampsulbactam', TZP:'piptazo', cefazolin_urine:'cefazolin', cefazolin_other:'cefazolin',
  cefmetazole:'cefmetazole', cefotaxime:'cefotaxime', ceftazidime:'ceftazidime', cefepime:'cefepime',
  ertapenem:'ertapenem', imipenem:'imipenem', meropenem:'meropenem', gentamicin:'gentamicin',
  gentamicin_high:'gentamicin', amikacin:'amikacin', amikacin_urine:'amikacin', ciprofloxacin:'ciprofloxacin',
  levofloxacin:'levofloxacin', moxifloxacin:'moxifloxacin', tigecycline:'tigecycline', colistin:'colistin',
  SXT:'tmpsmx', penicillin:'penG', ampicillin:'ampicillin', oxacillin:'nafcillin',
  vancomycin:'vancomycin', daptomycin:'daptomycin', clindamycin:'clindamycin', erythromycin:'azithromycin',
  tetracycline:'doxycycline', linezolid:'linezolid', flomoxef:'flomoxef', metronidazole:'metronidazole',
  AMC:'amoxclav', cefuroxime:'cefuroxime', cefixime:'cefixime',
  fluconazole:'fluconazole', voriconazole:'voriconazole', anidulafungin:'anidulafungin',
  caspofungin:'caspofungin', micafungin:'micafungin', amphotericin_B:'amphoLipo', flucytosine:'flucytosine'
};

/* 病原菌 → 台大 antibiogram 菌種對照（以 BACTERIA 的 en 為鍵；一菌可對多列）。
   本期新接上：CRE（三種腸道菌的 CRE 分層）、草綠色鏈球菌（S. anginosus／constellatus）、
   Aeromonas、CRPA、E. faecium 的 VRE／非 VRE 分層。
   在抗生素表無資料之菌（ESBL、Listeria、Neisseria、非典型、C. glabrata…）不列，故不顯示徽章。 */
window.BAC_ABG = {
  "S. aureus, methicillin-susceptible":{sec:'gram_positive',org:"MSSA"},
  "S. aureus, methicillin-resistant":{sec:'gram_positive',org:"MRSA"},
  "Coagulase-negative staphylococci":[{sec:'gram_positive',org:"Staphylococcus epidermidis"},{sec:'gram_positive',org:"Staphylococcus capitis"},{sec:'gram_positive',org:"Staphylococcus haemolyticus"},{sec:'gram_positive',org:"Staphylococcus hominis"},{sec:'gram_positive',org:"Staphylococcus lugdunensis"}],
  "Streptococcus pneumoniae":{sec:'gram_positive',org:"Streptococcus pneumoniae"},
  "Streptococcus pyogenes (GAS)":{sec:'gram_positive',org:"Streptococcus pyogenes (Group A)"},
  "Streptococcus agalactiae (GBS)":{sec:'gram_positive',org:"Streptococcus agalactiae (Group B)"},
  "Viridans group streptococci":[{sec:'gram_positive',org:"Streptococcus anginosus"},{sec:'gram_positive',org:"Streptococcus constellatus"}],
  "Enterococcus faecalis":[{sec:'gram_positive',org:"Enterococcus faecalis"},{sec:'gram_positive',org:"Enterococcus spp. (other)"}],
  "Enterococcus faecium / VRE":[{sec:'gram_positive',org:"Enterococcus faecium"},{sec:'gram_positive',org:"Enterococcus faecium (VRE)"},{sec:'gram_positive',org:"Enterococcus faecium (non-VRE)"}],
  "E. coli / Klebsiella (non-ESBL)":[{sec:'gram_negative',org:"Escherichia coli"},{sec:'gram_negative',org:"Klebsiella pneumoniae"},{sec:'gram_negative',org:"Klebsiella oxytoca"}],
  "Carbapenem-resistant Enterobacterales":[{sec:'gram_negative',org:"CRE (Escherichia coli)"},{sec:'gram_negative',org:"CRE (Klebsiella pneumoniae)"},{sec:'gram_negative',org:"CRE (Enterobacter cloacae)"}],
  "AmpC producers":[{sec:'gram_negative',org:"Enterobacter cloacae"},{sec:'gram_negative',org:"Serratia marcescens"},{sec:'gram_negative',org:"Serratia species (other)"},{sec:'gram_negative',org:"Citrobacter koseri"}],
  "Proteus / Morganella / Providencia":[{sec:'gram_negative',org:"Proteus mirabilis"},{sec:'gram_negative',org:"Morganella morganii"}],
  "Non-typhoidal Salmonella, invasive":{sec:'gram_negative',org:"Salmonella (non-typhi)"},
  "Aeromonas hydrophila":{sec:'gram_negative',org:"Aeromonas species"},
  "Pseudomonas aeruginosa":[{sec:'gram_negative',org:"Pseudomonas aeruginosa"},{sec:'gram_negative',org:"Carbapenem-resistant P. aeruginosa (CRPA)"}],
  "Acinetobacter baumannii":[{sec:'gram_negative',org:"Acinetobacter baumannii"},{sec:'gram_negative',org:"non-CR A. baumannii"},{sec:'gram_negative',org:"Carbapenem-resistant A. baumannii (CRAB)"},{sec:'gram_negative',org:"Acinetobacter nosocomialis"},{sec:'gram_negative',org:"Acinetobacter baumannii complex"}],
  "Stenotrophomonas maltophilia":{sec:'gram_negative',org:"Stenotrophomonas maltophilia"},
  "Burkholderia cepacia complex":{sec:'gram_negative',org:"Burkholderia cepacia complex"},
  "Chryseobacterium indologenes":{sec:'gram_negative',org:"Chryseobacterium indologenes"},
  "Sphingomonas paucimobilis":{sec:'gram_negative',org:"Sphingomonas paucimobilis"},
  "Haemophilus influenzae":{sec:'haemophilus',org:"Haemophilus influenzae"},
  "Bacteroides fragilis":[{sec:'anaerobic',org:"Bacteroides fragilis"},{sec:'anaerobic',org:"Bacteroides thetaiotaomicron"},{sec:'anaerobic',org:"Parabacteroides distasonis"},{sec:'anaerobic',org:"Prevotella bivia"},{sec:'anaerobic',org:"Fusobacterium varium"},{sec:'anaerobic',org:"Finegoldia magna"},{sec:'anaerobic',org:"Clostridium perfringens"},{sec:'anaerobic',org:"Parvimonas micra"},{sec:'anaerobic',org:"Peptostreptococcus anaerobius"}],
  "Candida albicans":[{sec:'candida',org:"Candida albicans"},{sec:'candida',org:"Candida tropicalis"},{sec:'candida',org:"Candida parapsilosis complex"}]
};
