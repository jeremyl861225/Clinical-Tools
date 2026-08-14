/* 臨床造句列：三面向詞表與 136 個標的的面向標註（由 catalog-136.json 擴充）。
   第 4 輪（查詢彈性與詞語廣度）新增：
   · s／c／a 三個詞表的部分項目加了 sub（下位詞陣列）——選中上位詞時，
     展開式比對（js/sentence.js，非本檔案負責）可以連同 sub 裡的下位詞一起命中。
   · 除了給 sub，凡是「sub 展開得到的下位詞在 136 項裡有對應」的組合，
     這裡也直接把上位詞材化（直標）到那些項目的 s/c/a 陣列上——
     這樣即使展開比對邏輯還沒接上，這些查詢在資料層面已經是對的。
   · 每個新詞、每一筆補上的標註前面都有 // 註解說明為什麼對到那個項目。 */
window.FACETS = {
  "s": [
    /* 第 6 輪（字詞查詢廣度）對 s 表做的三件事，逐條理由見各行 // 註解：
       (1) 每個部位補口語俗名／簡稱／英文，讓「肚子」「肺」「骨頭」「脖子」查得到；
       (2) 器官型部位補 sub，讓上位詞帶得出下位詞（腹部→腹內各器官、腦→腦血管與意識…）；
       (3) 新增四個上位部位詞（腸道／消化道／血管／神經系統），見本陣列末端。 */
    // 上位詞。口語只會說「肚子」「肚」「腹」；sub 收編所有腹內器官與腹壁，
    // 這樣「我遇到腹部的癌症」帶得出胃癌／大腸直腸癌／胰臟癌／肝細胞癌／膽管癌／
    // GIST／NET，而不是只有直接標了「腹部」的那幾張流程頁。食道一併收進來的
    // 理由是本檔 tools[] 自己把 esoph 歸在 sec="abdomen"（腹部急症）。
    {"w": "腹部", "al": "abdomen abdominal 腹腔 肚子 肚 腹 腹內 腹腔內 intraabdominal belly", "sub": ["闌尾", "膽道", "胰臟", "肝臟", "食道", "胃十二指腸", "小腸", "大腸", "腹壁與疝氣", "腹膜", "腸繫膜血管"]},
    // 「盲腸」是闌尾的俗名（既有）；「蟲垂」是舊譯名。
    {"w": "闌尾", "al": "appendix appendicitis appendiceal 盲腸 蟲垂"},
    // 值班多半只說一個「膽」字；膽結石／總膽管／膽囊管的說法都要落到膽道。
    {"w": "膽道", "al": "biliary gallbladder cholecyst bile 膽囊 膽管 CBD 膽 膽道系統 總膽管 膽囊管 膽結石"},
    {"w": "胰臟", "al": "pancreas pancreatic 胰 胰腺 胰頭 胰尾 胰體"},
    {"w": "肝臟", "al": "liver hepatic hepato 肝 肝膽 肝門 肝葉"},
    {"w": "食道", "al": "esophagus esophageal oesophagus 食管 食道下端 賁門"},
    // 「上消化道」在臨床上就是指胃與十二指腸這一段。
    {"w": "胃十二指腸", "al": "stomach gastric duodenum duodenal gastroduodenal 胃 十二指腸 PU 胃部 胃竇 幽門 上消化道"},
    // 「small」「bowel」兩個通用 token 讓給新的上位詞「腸道」（見本陣列末端）——
    // 打 bowel 的人多半沒有分大小腸，收窄成小腸就是使用者抱怨的「查不到」。
    {"w": "小腸", "al": "small-bowel small-intestine jejunum ileum SB 空腸 迴腸 小腸段"},
    {"w": "大腸", "al": "colon colorectal rectum cecum sigmoid 結腸 直腸 乙狀結腸 升結腸 橫結腸 降結腸 大腸直腸"},
    {"w": "腹壁與疝氣", "al": "hernia abdominal-wall inguinal groin 腹壁 疝 疝氣 腹股溝 脫腸"},
    {"w": "腹膜", "al": "peritoneum peritoneal intraperitoneal 腹膜腔 腹膜炎部位 腹膜透析 腹透 peritoneal-dialysis PD CAPD APD peritonitis"},
    {"w": "腸繫膜血管", "al": "mesenteric SMA SMV IMA 腸繫膜 腸子血管"},
    {"w": "軟組織", "al": "soft tissue skin 皮膚 筋膜 傷口 肌肉 蜂窩組織 表皮"},
    {"w": "會陰", "al": "perineum perianal Fournier 陰囊 會陰部 肛門 肛周 生殖器"},
    // sub 收冠狀動脈：「我遇到心臟的…」要帶得出 ACS 與 GRACE，不是只有心衰竭與 ACLS。
    {"w": "心臟", "al": "heart cardiac myocardium cardio 心肌 心 心室 心房 心臟功能", "sub": ["冠狀動脈"]},
    {"w": "冠狀動脈", "al": "coronary PCI CABG 冠脈 心導管 支架 stent"},
    {"w": "主動脈", "al": "aorta aortic 主動脈弓 大動脈 升主動脈 降主動脈 胸主動脈 腹主動脈"},
    // 通用字「動脈」讓給新的上位詞「血管」（見本陣列末端）——單打「動脈」的人
    // 未必是問下肢動脈，收窄在周邊動脈會漏掉主動脈與腸繫膜血管。
    {"w": "周邊動脈", "al": "peripheral-artery limb PAD 下肢 下肢動脈 周邊血管 腳 手腳"},
    // 通用字「pulmonary」讓給「肺與氣道」（那才是使用者說「肺」時要的那一大群）。
    {"w": "肺循環", "al": "pulmonary-vasculature PE 肺動脈 肺血管 肺循環系統"},
    // sub 收氣道／呼吸器／肺循環：打一個「肺」字要帶得出插管、呼吸器設定與肺栓塞。
    {"w": "肺與氣道", "al": "lung lungs pulmonary 肺 肺部 肺葉 呼吸 呼吸系統 胸腔 chest", "sub": ["氣道", "呼吸器", "肺循環"]},
    {"w": "氣道", "al": "airway intubation trachea 插管 喉頭 呼吸道 氣管 聲門"},
    {"w": "呼吸器", "al": "ventilator mechanical-ventilation vent 呼吸機 通氣 上呼吸器 呼吸器設定"},
    {"w": "腎臟", "al": "kidney kidneys renal 腎 CRRT 腎臟功能 洗腎 透析"},
    // 脾臟：先前「脾臟的創傷」查不到——不是標註漏掉，是詞表根本沒有這個詞，
    // 使用者指名要能查到。只掛 trauma-path 一個標的，依據是該頁本身：
    // 輸血門檻「在脾／腎／十二指腸-胰臟／骨盆指引為 4–6 U」、E-FAST 左上腹切面
    // 「看脾腎隱窩與脾膈間」、AAST-OIS 逐臟器處置含脾修補。
    // 「脾曲」（volvulus／bowel-obstruction／gi-ischemia）是大腸的解剖標記不是脾臟，
    // 「脾動脈／保脾遠端胰切除」（panc-pathway）是胰臟手術的鄰接構造，都不掛。
    {"w": "脾臟", "al": "spleen splenic 脾 脾臟破裂 脾破裂 脾損傷 脾切除 splenectomy 無脾 asplenia 脾臟外傷"},
    // sub 收體液與酸鹼：電解質異常與滲透壓、酸鹼在值班上是同一件事的三個面向。
    {"w": "電解質", "al": "electrolyte electrolytes sodium potassium 鈉 鉀 鈣 離子 血鈉 血鉀 鎂 磷", "sub": ["體液與滲透壓", "酸鹼"]},
    {"w": "酸鹼", "al": "acid base acid-base pH 血氣 ABG 酸中毒 鹼中毒 動脈血氣"},
    {"w": "體液與滲透壓", "al": "fluid osmolality 水分 補液 滲透壓 輸液 點滴 脫水 水腫"},
    {"w": "血糖", "al": "glucose glycemia DKA HHS 血醣 糖尿病 diabetes 胰島素 insulin"},
    {"w": "甲狀腺", "al": "thyroid 甲狀腺素 T4 TSH 甲亢 甲狀腺功能"},
    {"w": "腎上腺", "al": "adrenal cortisol 皮質醇 類固醇 steroid ACTH"},
    // sub 收腦血管與意識：打「頭」「腦」的人要的是中風、腦出血、TBI、癲癇一整群。
    {"w": "腦", "al": "brain cerebral ICP 顱內 頭 頭部 大腦 腦部 顱骨 腦壓", "sub": ["腦血管", "意識"]},
    {"w": "腦血管", "al": "cerebrovascular stroke 中風 動脈瘤 腦中風 腦動脈 腦血管疾病"},
    {"w": "意識", "al": "consciousness GCS ACVPU 昏迷 神智 意識狀態 清醒度 mental-status"},
    {"w": "凝血", "al": "coagulation anticoagulant coagulopathy 抗凝 抗血小板 出血 血小板 INR warfarin DOAC 凝血功能"},
    // sub 收病原菌：說「我遇到感染」的人也該看得到「依病原菌」那條路。
    {"w": "感染與敗血", "al": "infection sepsis 敗血 感染源 感染科 感染症", "sub": ["病原菌"]},
    {"w": "病原菌", "al": "organism pathogen microbiology 細菌 菌種 培養 菌 微生物 革蘭氏"},
    {"w": "抗生素", "al": "antibiotic antibacterial antimicrobial abx 抗菌 抗生素 抗微生物"},
    {"w": "抗黴菌藥", "al": "antifungal candida 黴菌 念珠菌 真菌 黴菌感染"},
    {"w": "抗病毒藥", "al": "antiviral antivirals 病毒 抗病毒 病毒感染"},
    // sub 收五類專科用藥：打一個「藥」字要帶得出抗生素、升壓劑、鎮靜止痛的所有藥頁。
    {"w": "一般藥物", "al": "drug drugs medication medications formulary 處方 藥品 藥物 藥 用藥 開藥 藥單", "sub": ["抗生素", "抗黴菌藥", "抗病毒藥", "升壓與強心藥", "鎮靜止痛"]},
    {"w": "升壓與強心藥", "al": "vasopressor vasoactive inotrope 升壓劑 強心 升壓 血壓藥 levophed norepinephrine dopamine dobutamine"},
    {"w": "鎮靜止痛", "al": "sedation sedative analgesia opioid 麻醉 鎮靜 止痛 疼痛 pain 嗎啡 fentanyl"},
    {"w": "病人整體", "al": "patient whole 全身 共病 病況 病人 整體 一般狀況 全人"},
    {"w": "圍手術期", "al": "perioperative preop postop 術前 術後 圍術期 手術前 手術後 開刀前 開刀後"},
    {"w": "手術排程", "al": "scheduling priority 排刀 急刀 開刀房 排程 開刀時間 OR"},
    // sub 收燒燙傷：燒燙傷本來就是創傷的一種，打「創傷」不該漏掉燒燙傷補液。
    {"w": "創傷", "al": "trauma injury 外傷 車禍 撞到 摔倒 跌倒 墜落 刀傷 槍傷 鈍傷 穿刺傷", "sub": ["燒燙傷"]},
    {"w": "燒燙傷", "al": "burn burns scald 燙傷 灼傷 火燒 熱傷害"},
    {"w": "營養", "al": "nutrition nutritional enteral parenteral 營養 餵食 TPN 進食 灌食 靜脈營養"},
    {"w": "靜脈血栓", "al": "VTE DVT 血栓 深部靜脈 靜脈栓塞 血栓預防"},
    {"w": "心房顫動", "al": "atrial fibrillation AF Afib 心房纖維顫動 不規則心跳"},
    {"w": "休克循環", "al": "shock hemodynamics perfusion 血壓 循環 灌流 血行動力學 血壓低 循環衰竭"},
    {"w": "兒科", "al": "pediatric pediatrics child 小兒 兒童 新生兒 嬰兒 小朋友 孩子"},
    // 乳癌唯一對應的解剖部位；原本乳癌被誤標成 s=['癌症']，這裡給它真正的部位。
    {"w": "乳房", "al": "breast mammary 乳腺 乳 乳部"},
    // 白血病／淋巴癌／MDS／MPN 六個血液腫瘤共用的部位——這些是全身性血液疾病，沒有單一解剖器官可掛，比照「感染與敗血」「病人整體」的做法給一個系統級部位。
    // sub 收凝血：凝血功能異常本來就是血液系統的問題，打「血」要看得到抗凝逆轉與 VTE 那幾頁。
    {"w": "血液與骨髓", "al": "hematologic haematology heme blood marrow 血液系統 骨髓 血液腫瘤 造血 血 血球 白血球 血液科", "sub": ["凝血"]},
    // 子宮頸癌／子宮內膜癌／子宮肉瘤／卵巢癌四個婦癌共用的部位。
    {"w": "婦科", "al": "gynecologic gynecology uterus ovary cervix 子宮 卵巢 婦產 婦癌 婦女 陰道 子宮頸 輸卵管 骨盆腔"},
    // 上泌尿道腫瘤／腎細胞癌／膀胱癌／攝護腺癌四個泌尿癌別共用的部位；也用來讓「依部位」抗生素模式能接住泌尿道感染的查詢（見下方 abx-mode-empiric 的部位擴充）。
    // 補中文器官名（膀胱／攝護腺／輸尿管…）——原本只有英文 bladder／prostate，中文打不到。
    // sub 收腎臟：腎臟是泌尿道的一部分，打「泌尿」不該漏掉 eGFR 與 AKI。
    {"w": "泌尿系統", "al": "urologic urinary tract ureter bladder prostate 泌尿 腎盂輸尿管 泌尿道 膀胱 攝護腺 前列腺 輸尿管 腎盂 尿道 尿路 泌尿科", "sub": ["腎臟"]},
    // 鼻咽癌／頭頸癌共用的部位；原本兩者都掛在錯誤的 s=['癌症']。
    // sub 收甲狀腺：甲狀腺長在脖子上，打「脖子」「頸部」要看得到甲狀腺那兩頁。
    {"w": "頭頸", "al": "head neck 頭頸部 鼻咽 咽喉 口腔 脖子 頸部 頸 喉嚨 舌 扁桃腺 下咽", "sub": ["甲狀腺"]},
    // 第 5 輪合併頁內子目標新增：c 已有「骨關節感染」卻沒有對應部位詞
    // （data/sub-abx.js 的「骨與關節感染」#site 子目標需要，s 標註逐字沿用該檔）。
    {"w": "骨與關節", "al": "bone joint osteomyelitis 骨科 骨骼 關節 骨髓炎 化膿性關節炎 人工關節 骨頭 骨 脊椎 spine 髖 膝"},

    /* ══ 第 6 輪新增的四個上位部位詞：值班說話時很少一開口就講到器官層級，
       「腸子」「消化道」「血管」「神經」這四種說法原本一個都查不到。 ══ */
    // 「腸」「腸子」不分大小腸——sub 兩邊都收，不逼使用者先決定是小腸還是大腸。
    {"w": "腸道", "al": "bowel intestine gut 腸 腸子 腸管 腸道系統", "sub": ["小腸", "大腸"]},
    // 從食道到大腸一整條；「消化道出血」「消化道穿孔」這類說法的部位面向落點。
    {"w": "消化道", "al": "GI gastrointestinal digestive 消化系統 腸胃 腸胃道", "sub": ["食道", "胃十二指腸", "小腸", "大腸"]},
    // 通用字「動脈」在此收編（見上方周邊動脈的註解）；涵蓋主動脈剝離、肢體缺血、
    // 腸繫膜缺血、肺栓塞、腦血管五群——問「血管」的人要的就是這一整組。
    {"w": "血管", "al": "vascular vessel vessels 動脈 靜脈 血管系統 大血管 血流", "sub": ["主動脈", "周邊動脈", "腸繫膜血管", "肺循環", "腦血管"]},
    // 腦＋腦血管＋意識三者的上位詞；「神經」「CNS」原本查不到任何東西。
    {"w": "神經系統", "al": "neurologic neurology neuro nervous CNS 神經 中樞神經 神經科", "sub": ["腦", "腦血管", "意識"]},
  ],
  "c": [
    /* 第 6 輪（字詞查詢廣度）對 c 表做的四件事，逐條理由見各行 // 註解：
       (1) 把被窄詞條搶走的通用字還給上位詞。buildFacetIndex() 是先到先得
           （`if(!idx[a]) idx[a]=o`），窄的詞條排在前面就會把 infection／
           obstruction／bleeding／hemorrhage／trauma／shock／failure／cancer／
           tumor／carcinoma 這些通用字整個吃掉，使用者打那個字只會查到窄的那
           一撮——這正是使用者兩次抱怨的「過度收斂」。通用字一律改由上位詞持有，
           窄詞條改用連字號寫法（intra-abdominal-infection、septic-shock…），
           查得到的東西只增不減。
       (2) 上位詞補 sub，讓「阻塞」「感染」「出血」「意識障礙」帶得出下位診斷。
       (3) 30 個癌別的 al 原本只是把英文名整串抄進來，切出來的 token 全是
           Cancer／Carcinoma／Tumor／Leukemia／(Acute／&／／ 這種通用字與雜訊；
           改寫成真正的別名（縮寫＋中文俗名＋專屬英文），通用字讓給「癌症」。
       (4) 末端新增缺血／發炎／結石／白血病／膽道阻塞／創傷後抗生素六個詞。 */
    {"w": "闌尾炎", "al": "appendicitis 盲腸炎 闌尾發炎"},
    // 通用字 infection 讓給下方的上位詞「感染」；sub 收編所有腹內感染來源，
    // 這是使用者原話「出現所有腹內感染」要的那一組。
    {"w": "腹腔感染", "al": "intra-abdominal-infection IAI cIAI 腹內感染 腹腔內感染", "sub": ["闌尾炎", "膽囊炎", "膽管炎", "憩室炎", "腹內膿瘍", "腹膜炎", "消化道穿孔"]},
    {"w": "腹內膿瘍", "al": "abscess 膿瘍 膿包 積膿 化膿"},
    {"w": "膽囊炎", "al": "cholecystitis 膽囊發炎 Tokyo TG18"},
    {"w": "膽管炎", "al": "cholangitis 膽道感染 膽管發炎"},
    {"w": "憩室炎", "al": "diverticulitis Hinchey 憩室發炎"},
    {"w": "胰臟炎", "al": "pancreatitis Atlanta 胰臟發炎"},
    {"w": "壞死性軟組織感染", "al": "necrotizing fasciitis NSTI 壞死性筋膜炎 爛肉 食肉菌"},
    // 通用字 obstruction 讓給下方的上位詞「阻塞」；sub 收絞窄／扭轉／套疊／嵌頓——
    // 使用者原話抱怨「我遇到小腸的腸阻塞」只跑出腸套疊，反過來也要成立。
    {"w": "腸阻塞", "al": "bowel-obstruction SBO LBO ileus 腸道阻塞 小腸阻塞 大腸阻塞 麻痺性腸阻塞 腸不通 脹氣", "sub": ["腸絞窄", "腸扭轉", "腸套疊", "嵌頓"]},
    {"w": "腸絞窄", "al": "strangulation 絞窄 缺血性腸阻塞 腸子壞死"},
    {"w": "腸扭轉", "al": "volvulus 乙狀結腸扭轉 腸子扭到"},
    {"w": "腸套疊", "al": "intussusception 腸子套住"},
    {"w": "疝氣", "al": "hernia inguinal 腹股溝 脫腸 凸出來"},
    {"w": "嵌頓", "al": "incarceration incarcerated strangulated 箝頓 卡住 推不回去"},
    {"w": "腸缺血", "al": "mesenteric-ischemia AMI CMI 腸繫膜缺血 缺血性大腸炎 腸子缺血"},
    {"w": "食道穿孔", "al": "esophageal perforation Boerhaave 食道破裂 食道裂傷"},
    {"w": "消化道穿孔", "al": "perforation free-air 破洞 游離氣體 穿孔 破掉 腸破 食道穿孔 esophageal perforation"},
    {"w": "消化性潰瘍穿孔", "al": "peptic ulcer PPU 潰瘍穿孔 胃穿孔 十二指腸穿孔"},
    // 第 7 輪補 sub：腹膜炎在臨床上幾乎都是「續發性」的——先有破口才有腹膜炎。
    // 使用者原話：「腹膜的發炎也要顯示 PPU」。gi-perforation.html 自己的頁面文字就寫
    // 「適用所有續發性腹膜炎（含小腸／大腸穿孔）」，所以這裡把腹膜炎的來源收成 sub，
    // 選「腹膜炎」（或上位詞「發炎」）就一併帶出消化性潰瘍穿孔（PULP）、消化道穿孔、
    // 闌尾炎、憩室炎與腹腔感染。與「腹腔感染」互相收編成環，expand() 有 seen 防護不會無限遞迴。
    {"w": "腹膜炎", "al": "peritonitis 腹膜發炎 板硬 全腹壓痛 續發性腹膜炎", "sub": ["消化性潰瘍穿孔", "消化道穿孔", "闌尾炎", "憩室炎", "腹腔感染"]},
    // 通用字 bleeding 讓給下方的上位詞「出血」；sub 收上／下消化道出血。
    {"w": "消化道出血", "al": "GI-bleeding GIB 腸胃道出血 腸胃出血 消化道大出血", "sub": ["上消化道出血", "下消化道出血"]},
    {"w": "上消化道出血", "al": "UGIB upper-GI-bleeding 吐血 咖啡色嘔吐物 黑便 melena"},
    {"w": "下消化道出血", "al": "LGIB lower-GI-bleeding 血便 解血便 鮮血便 hematochezia"},
    {"w": "食道急症", "al": "Boerhaave 食道穿孔 食道異物 異物 腐蝕性 吞入"},
    // 通用字 trauma 讓給下方的上位詞「創傷」。
    {"w": "腹部創傷", "al": "abdominal-trauma FAST AAST 腹部外傷 鈍傷 穿刺傷 肚子撞到"},
    // 通用字 ACS 改由「急性冠心症」持有——臨床上單講 ACS 十次有九次是急性冠心症；
    // 這一頁另有 IAH／腹腔室症候群／abdominal compartment syndrome 三種說法可查，
    // 「說整句」的全文搜尋也吃得到本頁 en 欄的「IAH / ACS & Open Abdomen」。
    {"w": "腹腔高壓", "al": "IAH intra-abdominal-hypertension abdominal-compartment-syndrome 腹腔室症候群 腹腔內高壓 open-abdomen 開腹減壓 肚子壓力高"},
    {"w": "急刀分級", "al": "emergency priority 急刀 等候時間 幾級刀 排刀"},
    {"w": "分類分級", "al": "classification grading 分類系統 Csendes Forrest 分型"},
    {"w": "抗栓管理", "al": "antithrombotic bridging 停藥 橋接 抗凝 抗血小板 術前停藥"},
    // 同義詞：IHCA＝院內心跳停止＝心跳停止。ACLS 是 136 項裡唯一對得上的項目，沒有 sub 可補。
    // 補口語與波形名（沒脈搏／壓胸／VF／asystole），值班喊的就是這些字。
    {"w": "心跳停止", "al": "cardiac-arrest CPR ROSC 復甦 IHCA OHCA 院內心跳停止 院外心跳停止 復甦後照護 沒有脈搏 沒心跳 壓胸 asystole VF pulseless"},
    {"w": "心律不整", "al": "arrhythmia tachycardia 心搏過速 EKG 心電圖 心跳快", "sub": ["心搏過緩"]},
    // 節律器模式頁需要一個「心跳太慢」的狀況詞：原本 bradycardia 只是心律不整的別名，
    // 打「心跳慢」「房室阻滯」「裝節律器」都落不到那一頁。獨立成詞並收節律器相關口語。
    {"w": "心搏過緩", "al": "bradycardia 心搏過緩 心跳慢 心跳過慢 竇性心搏過緩 sinus-bradycardia 房室阻滯 AV-block heart-block 傳導阻滯 傳導延遲 節律器 pacemaker 心律調節器 起搏 pacing 暫時性節律器 temporary-pacing 心外膜線 磁鐵 magnet"},
    {"w": "敗血症", "al": "sepsis 敗血 感染合併器官衰竭", "sub": ["敗血性休克", "菌血症"]},
    // 通用字 shock 讓給下方的上位詞「休克」（原本被這一條先搶走，打 shock 只出得來敗血性休克那一頁）。
    {"w": "敗血性休克", "al": "septic-shock 敗血症休克 感染性休克"},
    {"w": "心因性休克", "al": "cardiogenic-shock SCAI 心源性休克 心臟打不動"},
    {"w": "血行動力學監測", "al": "hemodynamic Swan-Ganz PAC 肺動脈導管 右心導管"},
    // 同義詞：掉血壓＝低血壓（al 已有）＝休克。sub 除既有三型外再收肺栓塞（阻塞型休克）
    // 與腎上腺危機（分佈型休克）——這兩個是值班「血壓掉了」時最常被漏掉的可逆原因。
    {"w": "休克", "al": "shock hypotension hypoperfusion 低血壓 灌流不足 掉血壓 血壓掉 血壓低 血壓不穩 休克狀態", "sub": ["敗血性休克", "心因性休克", "創傷大出血", "肺栓塞", "腎上腺危機"]},
    {"w": "肺栓塞", "al": "pulmonary-embolism PE CTPA D-dimer 肺動脈栓塞"},
    // 通用字 hemorrhage 讓給下方的上位詞「出血」。
    {"w": "創傷大出血", "al": "massive-hemorrhage damage-control 大量輸血 MTP 失血性休克 大出血 血流不止"},
    // 通用字 ACS 在此收編（見上方腹腔高壓的註解）。
    {"w": "急性冠心症", "al": "ACS STEMI NSTEMI 心肌梗塞 心絞痛 胸痛 MI"},
    // 通用字 failure 讓給下方的上位詞「衰竭」（原本被這一條先搶走）。
    {"w": "心臟衰竭", "al": "heart-failure HFrEF HFpEF HFmrEF 心衰竭 心臟功能不全 肺水腫 喘"},
    // 同上，讓出 failure；補值班會用的口語（喘不過氣／二氧化碳蓄積）與 sub。
    {"w": "呼吸衰竭", "al": "respiratory-failure ARF 呼吸功能不全 換氣不足 二氧化碳蓄積 喘不過氣 呼吸喘", "sub": ["低血氧", "ARDS", "機械通氣", "高流量氧氣", "插管"]},
    {"w": "ARDS", "al": "acute-respiratory-distress-syndrome 急性呼吸窘迫 兩側肺浸潤"},
    {"w": "低血氧", "al": "hypoxemia desaturation 缺氧 SpO2 血氧掉 血氧低 氧氣不夠"},
    {"w": "機械通氣", "al": "mechanical-ventilation 肺保護 潮氣容積 PEEP 呼吸器設定 上呼吸器"},
    {"w": "高流量氧氣", "al": "HFNC HFNO high-flow 高流量鼻導管 氧氣治療"},
    {"w": "插管", "al": "intubation RSI 快速誘導 氣管內管 放管"},
    {"w": "急性腎損傷", "al": "AKI acute-kidney-injury 腎衰竭 腎功能惡化 肌酸酐上升", "sub": ["透析時機", "少尿", "腎功能"]},
    {"w": "透析時機", "al": "RRT dialysis CRRT 洗腎 血液透析 上機"},
    {"w": "腎功能", "al": "eGFR creatinine 肌酸酐 腎絲球 腎功能不全 CKD"},
    {"w": "腦出血", "al": "ICH intracerebral-hemorrhage 顱內出血 腦溢血 出血性中風"},
    {"w": "蜘蛛膜下腔出血", "al": "SAH aSAH aneurysm 動脈瘤 蛛網膜下腔出血 動脈瘤破裂 爆炸性頭痛"},
    {"w": "創傷性腦損傷", "al": "TBI head-injury 頭部外傷 撞到頭 腦挫傷 EDH SDH"},
    {"w": "缺血性中風", "al": "ischemic-stroke tPA thrombectomy 血栓溶解 腦梗塞 中風 取栓"},
    {"w": "癲癇重積", "al": "status-epilepticus seizure 抽搐 癲癇 發作 痙攣 convulsion 全身抽"},
    // 使用者原話：「我遇到意識障礙→也要出現腦出血與 SAH」。除了 ich-path 本來就標了
    // 意識障礙之外，sub 再收整組「叫不醒要先排除什麼」的鑑別——中風、TBI、癲癇後狀態、
    // 低血鈉、DKA／HHS，這些都是值班遇到意識改變時會一起想到的。
    {"w": "意識障礙", "al": "altered-consciousness coma confusion delirium GCS 昏迷 譫妄 意識不清 神智不清 叫不醒 意識改變 沒反應", "sub": ["腦出血", "蜘蛛膜下腔出血", "缺血性中風", "創傷性腦損傷", "癲癇重積", "低血鈉", "DKA", "HHS"]},
    {"w": "肢體缺血", "al": "acute-limb-ischaemia ALI Rutherford 急性肢體缺血 腳冰冷 摸不到脈"},
    {"w": "主動脈剝離", "al": "aortic dissection IMH PAU 剝離"},
    {"w": "甲狀腺風暴", "al": "thyroid storm Burch-Wartofsky 甲亢危象"},
    {"w": "腎上腺危機", "al": "adrenal crisis hydrocortisone 腎上腺功能不全"},
    {"w": "高血鉀", "al": "hyperkalemia hyperkalaemia K 鉀離子過高 鉀高 血鉀高"},
    {"w": "低血鈉", "al": "hyponatremia hyponatraemia Na 鈉離子過低 鈉低 血鈉低"},
    {"w": "高血鈉", "al": "hypernatremia hypernatraemia 自由水缺乏 free-water 鈉高 血鈉高"},
    {"w": "DKA", "al": "diabetic-ketoacidosis 糖尿病酮酸中毒 酮酸中毒 酮體"},
    {"w": "HHS", "al": "hyperosmolar hyperglycemic 高滲透壓高血糖 高糖高滲透壓"},
    {"w": "高血糖", "al": "hyperglycemia hyperglycaemia 血糖過高 血糖高 糖太高"},
    {"w": "酸鹼失衡", "al": "acid-base-disorder acidosis alkalosis 代謝性酸中毒 呼吸性鹼中毒 anion-gap 陰離子間隙 酸中毒 鹼中毒"},
    // sub 收四種具體離子異常：打「電解質異常」不必再自己想是鉀還是鈉。
    {"w": "電解質異常", "al": "electrolyte-disorder 校正 離子異常 電解質不平衡 離子", "sub": ["高血鉀", "低血鉀", "低血鈉", "高血鈉", "高血鈣", "低血鈣", "低血鎂", "低血磷", "高血磷", "滲透壓間隙"]},
    /* 電解質失衡頁把六種電解質的高低兩端都寫成獨立段落，所以狀況詞也要分得出來——
       原本只有高血鉀／低血鈉／高血鈉三個，打「低血鉀」「高血鈣」「低血磷」都是 0 筆。
       六個新詞全部收進上面「電解質異常」的 sub，所以打上位詞仍然帶得出全部。 */
    {"w": "低血鉀", "al": "hypokalemia hypokalaemia 鉀低 血鉀低 鉀離子過低 補鉀 KCl"},
    {"w": "高血鈣", "al": "hypercalcemia hypercalcaemia 鈣高 血鈣高 惡性高血鈣 副甲狀腺 PTH PTHrP zoledronic denosumab calcitonin"},
    {"w": "低血鈣", "al": "hypocalcemia hypocalcaemia 鈣低 血鈣低 校正鈣 游離鈣 ionized-calcium 抽搐 tetany Chvostek Trousseau 副甲狀腺功能低下"},
    {"w": "低血鎂", "al": "hypomagnesemia hypomagnesaemia 鎂低 血鎂低 補鎂 硫酸鎂 magnesium torsades"},
    {"w": "低血磷", "al": "hypophosphatemia hypophosphataemia 磷低 血磷低 補磷 再餵食 refeeding 脫離呼吸器"},
    {"w": "高血磷", "al": "hyperphosphatemia hyperphosphataemia 磷高 血磷高 磷結合劑 phosphate-binder 腫瘤溶解"},
    {"w": "滲透壓間隙", "al": "osmolal-gap 滲透壓差 毒性酒精"},
    {"w": "劑量體重", "al": "dosing-weight IBW ABW BSA 體表面積 理想體重 校正體重"},
    {"w": "劑量換算", "al": "conversion equivalent 等效劑量 類固醇 嗎啡 換藥 換算劑量"},
    // 補 sub：消化道出血・顱內出血（腦出血）・SAH・創傷大出血，讓「出血」這個既有詞也能當上位詞用。
    // 通用字 bleeding／hemorrhage 由這一條持有（已從消化道出血與創傷大出血讓出，見上）。
    {"w": "出血", "al": "bleeding hemorrhage haemorrhage 出血風險 逆轉 流血 失血 血紅素掉", "sub": ["消化道出血", "上消化道出血", "下消化道出血", "腦出血", "蜘蛛膜下腔出血", "創傷大出血"]},
    {"w": "燒燙傷", "al": "burn Parkland TBSA 補液 燙傷 灼傷"},
    {"w": "共病負荷", "al": "comorbidity Charlson 共病 慢性病"},
    // 通用字 failure 讓給下方的上位詞「衰竭」。
    {"w": "器官衰竭", "al": "MODS SOFA 多重器官 多重器官衰竭"},
    {"w": "重症死亡風險", "al": "ICU mortality APACHE 死亡率 重症預後"},
    {"w": "病情惡化", "al": "deterioration early-warning 早期預警 惡化 rapid-response 變差 掉下去"},
    // 通用字 operative 讓給下方的上位詞「手術」。
    {"w": "手術死亡風險", "al": "operative-mortality NELA POSSUM 術後死亡 開刀死亡率 開刀風險"},
    {"w": "術後併發症", "al": "complication Clavien-Dindo 併發症"},
    {"w": "營養不良", "al": "malnutrition GLIM NRS 營養風險"},
    {"w": "再餵食症候群", "al": "refeeding syndrome 再餵食"},
    {"w": "輸液選擇", "al": "IV fluid crystalloid 輸液 點滴 打點滴 掛水 補液 維持輸液 maintenance fluid 生理食鹽水 normal saline NS half saline D5W 葡萄糖水 乳酸林格 Lactated Ringer LR Hartmann Ringer Taita 台大一號 台大三號 台大五號 大塚"},
    {"w": "靜脈營養", "al": "parenteral nutrition PN TPN PPN 全靜脈營養 周邊靜脈營養 營養針 高卡 三合一袋 Bfluid Clinimix Oliclinomel Nutriflex Smoflipid 脂肪乳 lipid emulsion 胺基酸 amino acid 微量元素 trace element Addaven 綜合維生素 Lyo-Povigent"},
    {"w": "VTE 風險", "al": "venous thromboembolism Caprini Padua 血栓風險"},
    {"w": "中風風險", "al": "stroke risk CHA2DS2 抗凝適應症"},
    {"w": "侵襲性念珠菌感染", "al": "invasive candidiasis candida 念珠菌"},
    {"w": "肝纖維化", "al": "fibrosis FIB-4 纖維化"},
    // 硬化／肝纖維化：使用者回報「肝臟的硬化」找不到 FIB-4。FIB-4 的 c 標的是
    // 「肝纖維化」，而肝硬化就是纖維化的終末期——查硬化的人要的正是纖維化評估工具，
    // 故以 sub 讓上位的「肝硬化」展開到「肝纖維化」；反向不設（查纖維化不必然要看硬化）。
    {"w": "肝硬化", "al": "cirrhosis Child-Pugh MELD 肝功能失代償 肝差 硬化 肝臟硬化 肝變硬", "sub": ["肝纖維化"]},
    // 通用字 failure 讓給下方的上位詞「衰竭」。
    {"w": "急性肝衰竭", "al": "acute-liver-failure ALF King's-College 猛爆性肝炎 肝昏迷"},
    {"w": "肝移植排序", "al": "transplant listing 移植 等候名單"},
    {"w": "抗生素選擇", "al": "empiric therapy 經驗性用藥 換藥 降階"},
    {"w": "MRSA", "al": "methicillin resistant 抗藥性金黃色葡萄球菌 vancomycin"},
    {"w": "綠膿桿菌", "al": "Pseudomonas aeruginosa 假單胞菌"},
    {"w": "ESBL", "al": "extended spectrum beta-lactamase 超廣效"},
    {"w": "厭氧菌", "al": "anaerobe Bacteroides metronidazole 厭氧"},
    {"w": "腸球菌", "al": "Enterococcus VRE 腸球菌"},
    {"w": "菌血症", "al": "bacteremia blood culture 血液培養"},
    {"w": "肺炎", "al": "pneumonia CAP HAP VAP 肺部感染"},
    {"w": "泌尿道感染", "al": "UTI urinary 尿路感染"},
    {"w": "皮膚軟組織感染", "al": "SSTI cellulitis 蜂窩性組織炎"},
    {"w": "心內膜炎", "al": "endocarditis 感染性心內膜炎"},
    {"w": "骨關節感染", "al": "osteomyelitis septic arthritis 骨髓炎"},
    {"w": "中樞神經感染", "al": "meningitis CNS 腦膜炎"},
    {"w": "導管相關感染", "al": "catheter related CLABSI 導管感染"},
    {"w": "手術預防性抗生素", "al": "surgical prophylaxis Bratzler 預防性抗生素"},
    {"w": "開放性骨折", "al": "open fracture Gustilo 骨折"},
    {"w": "破傷風", "al": "tetanus 破傷風類毒素"},
    {"w": "抗結核", "al": "tuberculosis TB 結核"},
    {"w": "抗病毒治療", "al": "antiviral influenza herpes 抗病毒", "sub": ["HIV", "HBV", "HCV", "CMV", "HSV/VZV", "Influenza", "SARS-CoV-2", "RSV"]},
    {"w": "免疫低下", "al": "immunocompromised neutropenia 嗜中性球低下"},
    {"w": "懷孕用藥", "al": "pregnancy 孕婦 哺乳 懷孕分級"},
    {"w": "藥物禁忌", "al": "contraindication allergy 過敏 交互作用"},
    // 交互作用本來只是「藥物禁忌」的一個 al，但現在有一頁專門在做這件事
    // （tools/ddi.html，10 萬組配對），值得升成自己的概念詞，否則造句造不到那一頁。
    // al 收三類寫法：英文正式名與縮寫（DDI／drug-drug interaction）、口語（撞藥／會不會撞／
    // 可不可以一起吃）、以及機轉關鍵字（CYP／P-gp／QT／血清素症候群）——
    // 值班上問的常常是「這兩支一起下會不會有事」而不是「交互作用」四個字。
    {"w": "交互作用", "al": "interaction interactions drug-drug DDI drug-interaction 藥物交互作用 藥品交互作用 藥物相互作用 相互作用 併用 合併用藥 一起吃 一起給 同時使用 撞藥 對撞 會不會撞 CYP CYP450 P-gp P-glycoprotein QT 延長 血清素症候群 serotonin DDInter"},
    {"w": "處方集", "al": "formulary 藥卡 台大藥劑部 商品名"},
    /* 這三個詞在 HEAD 就是死詞：沒有任何標的的 c 陣列掛過它們（「癌症治療」在
       tools[] 裡出現 30 次是 secTitle 欄，不是 c 標註），選了會得到 0 件事。
       第 6 輪補 sub: ["癌症"]——展開會遞迴到癌症自己的 30 個癌別，於是這三個
       說法都落到同一批癌別頁上（30 個癌別頁本來就同時含分期／淋巴結／治療三塊）。 */
    {"w": "癌症分期", "al": "staging TNM AJCC FIGO 分期 期別 第幾期", "sub": ["癌症"]},
    {"w": "淋巴結分群", "al": "lymph node station 淋巴結 分群 淋巴", "sub": ["癌症"]},
    {"w": "癌症治療", "al": "chemotherapy adjuvant neoadjuvant 化療 標靶 免疫治療 抗癌治療", "sub": ["癌症"]},
    {"w": "少尿", "al": "oliguria urine output 尿量"},
    {"w": "發燒", "al": "fever pyrexia 體溫"},
    {"w": "呼吸急促", "al": "tachypnea 喘 呼吸速率"},
    {"w": "兒童病人", "al": "pediatric child 小兒 兒童"},
    /* 30 個癌別的 al 改寫（第 6 輪）。原本每一條都只是把 tools[].en 整串抄過來，
       splitWords() 切出來的是 Cancer／Carcinoma／Tumor／Sarcoma／Leukemia／
       Neoplasms／(Acute／(PV／&／／ 這些通用字與雜訊：先到先得的結果是打
       「cancer」只出得來肺癌一頁、打「tumor」只出得來 GIST、打「carcinoma」
       只出得來肝細胞癌。這裡改成真正的別名——臨床縮寫（NSCLC／HCC／CRC／GIST／
       AML／CML／RCC／UTUC／NPC…）＋中文俗名＋各自專屬的英文，通用字一律讓給
       下方的上位詞「癌症」。英文全名不會因此查不到：「說整句」的全文索引吃的是
       tools[].name／en／desc，那三欄一個字都沒動。 */
    {"w": "肺癌", "al": "lung NSCLC SCLC 非小細胞肺癌 小細胞肺癌 肺腺癌 肺部腫瘤"},
    {"w": "食道癌", "al": "esophageal oesophageal 食道腫瘤 食道鱗狀細胞癌 食道腺癌"},
    {"w": "胃癌", "al": "gastric stomach 胃部腫瘤 胃腺癌 印戒細胞癌"},
    {"w": "胰臟癌", "al": "PDAC pancreatic ductal-adenocarcinoma IPMN MCN 胰腺癌 胰臟腫瘤 胰管腺癌 胰臟囊性腫瘤"},
    {"w": "胃腸道基質瘤", "al": "GIST gastrointestinal-stromal 基質瘤 間質瘤 KIT"},
    {"w": "大腸直腸癌", "al": "CRC colorectal colon-cancer rectal-cancer 結腸癌 直腸癌 大腸癌"},
    {"w": "肛門癌", "al": "anal squamous 肛管癌 肛門鱗狀細胞癌"},
    {"w": "闌尾癌", "al": "appendiceal 闌尾腫瘤 黏液性腫瘤 假性黏液瘤 pseudomyxoma"},
    {"w": "肝細胞癌", "al": "HCC hepatocellular 肝癌 肝腫瘤 肝細胞肝癌"},
    {"w": "膽管癌", "al": "CCA cholangiocarcinoma iCCA pCCA dCCA 膽道癌 Klatskin 肝門膽管癌"},
    {"w": "神經內分泌瘤", "al": "NET NEN pNET neuroendocrine 類癌 carcinoid 神經內分泌腫瘤"},
    {"w": "乳癌", "al": "breast 乳房腫瘤 乳腺癌 HER2 三陰性"},
    {"w": "甲狀腺癌", "al": "thyroid-cancer PTC FTC MTC ATC 乳突癌 濾泡癌 髓質癌 未分化癌"},
    {"w": "軟組織肉瘤", "al": "STS soft-tissue-sarcoma 肉瘤 脂肪肉瘤 平滑肌肉瘤"},
    {"w": "急性骨髓性白血病", "al": "AML myeloid 急性骨髓白血病 骨髓性白血病"},
    {"w": "淋巴癌", "al": "lymphoma Hodgkin Non-Hodgkin DLBCL 淋巴瘤 何杰金氏"},
    {"w": "急性淋巴性白血病", "al": "ALL lymphoblastic 急性淋巴球性白血病 淋巴性白血病"},
    {"w": "慢性骨髓性白血病", "al": "CML chronic-myeloid BCR-ABL 慢性骨髓白血病 費城染色體"},
    {"w": "骨髓分化不良症候群", "al": "MDS myelodysplastic 骨髓化生不良 骨髓分化不良"},
    {"w": "骨髓增生性腫瘤", "al": "MPN myeloproliferative PV ET MF 真性紅血球增多症 原發性血小板增多症 骨髓纖維化"},
    {"w": "子宮頸癌", "al": "cervical-cancer 子宮頸腫瘤 HPV FIGO 子宮頸"},
    {"w": "子宮內膜癌", "al": "endometrial 子宮體癌 子宮內膜腫瘤"},
    {"w": "子宮肉瘤", "al": "uterine-sarcoma leiomyosarcoma 子宮平滑肌肉瘤"},
    {"w": "卵巢癌", "al": "ovarian fallopian-tube primary-peritoneal 卵巢腫瘤 輸卵管癌 原發性腹膜癌 CA-125"},
    {"w": "上泌尿道腫瘤", "al": "UTUC upper-tract-urothelial 腎盂癌 輸尿管癌 上泌尿道尿路上皮癌"},
    {"w": "腎細胞癌", "al": "RCC renal-cell 腎癌 腎臟腫瘤 clear-cell"},
    {"w": "膀胱癌", "al": "bladder-cancer NMIBC MIBC urothelial 尿路上皮癌 膀胱腫瘤"},
    {"w": "攝護腺癌", "al": "prostate-cancer PSA Gleason 前列腺癌 攝護腺腫瘤"},
    {"w": "鼻咽癌", "al": "NPC nasopharyngeal EBV 鼻咽腫瘤"},
    {"w": "頭頸癌", "al": "HNSCC head-neck-cancer 口腔癌 喉癌 下咽癌 舌癌 頭頸部腫瘤"},
    // 從 s 表移過來——「癌症」是狀況不是部位。30 個癌別已直接掛上這個字（見上），這裡的 sub 供未來展開式比對／字輪過濾使用。
    // 第 6 輪：通用字 cancer／carcinoma／tumor／neoplasm／malignancy 已從 30 個癌別的 al 讓出來給這一條（見上方癌別區塊的說明），另補「惡性腫瘤」「長瘤」等口語。
    {"w": "癌症", "al": "cancer carcinoma tumor tumour neoplasm neoplasms malignancy oncology ca 腫瘤 癌 惡性腫瘤 惡性 長瘤 腫塊 泌尿癌 婦癌 血液腫瘤", "sub": ["肺癌", "食道癌", "胃癌", "胰臟癌", "胃腸道基質瘤", "大腸直腸癌", "肛門癌", "闌尾癌", "肝細胞癌", "膽管癌", "神經內分泌瘤", "乳癌", "甲狀腺癌", "軟組織肉瘤", "急性骨髓性白血病", "淋巴癌", "急性淋巴性白血病", "慢性骨髓性白血病", "骨髓分化不良症候群", "骨髓增生性腫瘤", "子宮頸癌", "子宮內膜癌", "子宮肉瘤", "卵巢癌", "上泌尿道腫瘤", "腎細胞癌", "膀胱癌", "攝護腺癌", "鼻咽癌", "頭頸癌"]},
    // 涵蓋呼吸／心臟／肝／腎衰竭；肝硬化＝慢性肝衰竭、腎功能＝腎功能不全的量測都算進來，才接得到 Child-Pugh／MELD／eGFR 這類臨床上真的會被叫成「腎衰竭」「肝衰竭」查詢的項目。
    // 第 6 輪：通用字 failure 已從心臟／呼吸／急性肝／器官衰竭四條讓出來給這一條；sub 再補 ARDS 與透析時機（腎衰竭問到底就是要不要洗腎）。
    {"w": "衰竭", "al": "failure insufficiency organ-failure multi-organ-failure 衰竭 器官衰竭 功能不全 撐不住", "sub": ["呼吸衰竭", "心臟衰竭", "急性肝衰竭", "肝硬化", "器官衰竭", "急性腎損傷", "腎功能", "ARDS", "透析時機"]},
    // 涵蓋腹部創傷・TBI・燒燙傷・創傷後抗生素・創傷大出血。
    // 第 6 輪：通用字 trauma／injury 已從腹部創傷與急性腎損傷讓出來給這一條；補口語（撞到／摔倒／刀傷）與開放性骨折。
    {"w": "創傷", "al": "trauma injury 外傷 車禍 撞到 摔倒 跌倒 墜落 刀傷 槍傷 受傷", "sub": ["腹部創傷", "創傷性腦損傷", "燒燙傷", "創傷後抗生素", "創傷大出血", "開放性骨折"]},
    // 涵蓋圍手術期各站：NELA／P-POSSUM／SORT（手術死亡風險）、CCI 綜合併發症指數（術後併發症）、緊急手術分級（急刀分級）、手術預防（手術預防性抗生素）、圍手術期抗栓／CHA2DS2-VASc／HAS-BLED（抗栓管理）。
    // 第 6 輪 sub 再補：衰弱（CFS 是術前評估）、營養不良（ESPEN 外科術前營養）、VTE 風險（Caprini 就是外科版）。
    {"w": "手術", "al": "surgery operative operation perioperative 手術 開刀 圍手術期 上刀 排刀", "sub": ["手術死亡風險", "術後併發症", "急刀分級", "手術預防性抗生素", "抗栓管理", "衰弱", "營養不良", "VTE 風險"]},
    // 涵蓋腹腔感染、敗血症、NSTI 等；刻意收得廣，因為值班喊「感染」時通常還沒鎖定器官。
    // 第 6 輪：通用字 infection 已從腹腔感染讓出來給這一條；sub 再補闌尾炎／膽囊炎／膽管炎／憩室炎／腹膜炎／腹內膿瘍（這些本來就是感染，只是原本得靠各頁自己直標「感染」才查得到，計分工具那幾頁沒有直標就漏掉），另收抗結核／破傷風／抗黴菌／抗病毒。
    {"w": "感染", "al": "infection infectious 感染源 感染症 發燒感染 有沒有感染", "sub": ["腹腔感染", "敗血症", "敗血性休克", "壞死性軟組織感染", "肺炎", "侵襲性念珠菌感染", "菌血症", "泌尿道感染", "皮膚軟組織感染", "心內膜炎", "骨關節感染", "中樞神經感染", "導管相關感染", "闌尾炎", "膽囊炎", "膽管炎", "憩室炎", "腹膜炎", "腹內膿瘍", "抗結核", "破傷風", "抗黴菌治療", "抗病毒治療"]},
    // 涵蓋腸阻塞・腸扭轉・腸套疊・膽道阻塞。
    // 第 6 輪：通用字 obstruction 已從腸阻塞讓出來給這一條；再補嵌頓（嵌頓疝氣就是機械性阻塞）。
    {"w": "阻塞", "al": "obstruction obstructive blockage 阻塞 塞住 不通 堵住", "sub": ["腸阻塞", "腸扭轉", "腸套疊", "腸絞窄", "膽道阻塞", "嵌頓"]},
    // 低血氧／呼吸衰竭／ARDS／高流量氧氣，值班喊「缺氧」時這四個都算數。
    // 第 6 輪 sub 再補機械通氣與插管——「缺氧」問到底就是要不要插管、呼吸器怎麼設。
    {"w": "缺氧", "al": "hypoxia hypoxemia hypoxaemia desaturation 低血氧 血氧下降 血氧掉 SpO2 喘 氧氣不夠", "sub": ["低血氧", "呼吸衰竭", "ARDS", "高流量氧氣", "機械通氣", "插管"]},

    /* ══ 第 6 輪新增的六個狀況詞。前三個是值班會脫口而出、原本卻一個字都
       對不上的上位詞（缺血／發炎／結石）；後三個補的是「別的地方已經在用、
       詞表卻沒有這一筆」的漏洞——白血病是三種白血病的共同說法，膽道阻塞與
       創傷後抗生素則是 tools[] 與上位詞 sub 都已經引用、詞表卻查無此詞
       （expand() 雖然仍會拿字面去比對而查得到，但詞輪列不出來，等於選不到）。 ══ */
    // 涵蓋腸繫膜缺血、急性肢體缺血、心肌缺血（ACS）與腦梗塞——四個器官的缺血是同一句話。
    {"w": "缺血", "al": "ischemia ischaemia ischemic 缺血性 血流不足 不通血 血管塞住", "sub": ["腸缺血", "肢體缺血", "急性冠心症", "缺血性中風"]},
    // 「發炎」是病人與值班最常用的字；對應到本工具箱裡以「炎」為名的那一整排。
    // 第 7 輪 sub 補兩個「名字裡有炎、原本卻接不到」的：
    // · 腸缺血——使用者原話「小腸的發炎，應該也要出現腸缺血」。gi-ischemia.html 自己
    //   通篇用的就是「缺血性結腸炎／大腸缺血 CI」「節段性缺血性結腸炎」這些「炎」字病名。
    // · 急性肝衰竭——該詞條的 al 本來就寫著「猛爆性肝炎」，肝炎就是肝的發炎。
    {"w": "發炎", "al": "inflammation inflammatory 炎症 發炎反應 紅腫熱痛 CRP 高", "sub": ["闌尾炎", "膽囊炎", "膽管炎", "憩室炎", "胰臟炎", "腹膜炎", "肺炎", "皮膚軟組織感染", "腸缺血", "急性肝衰竭"]},
    // 膽結石／總膽管結石的查詢落點；ASGE 分層在分類與分級系統頁，處置在膽囊炎流程頁。
    {"w": "結石", "al": "stone stones calculus gallstone choledocholithiasis 膽結石 膽道結石 石頭", "sub": ["總膽管結石", "膽囊炎", "膽管炎"]},
    // 三種白血病的共同上位詞；通用字 leukemia 由這一條持有（已從 AML／ALL／CML 讓出）。
    {"w": "白血病", "al": "leukemia leukaemia 血癌 白血球過高", "sub": ["急性骨髓性白血病", "急性淋巴性白血病", "慢性骨髓性白血病"]},
    // chole-path 的 c 陣列與上位詞「阻塞」的 sub 都已經在用這個字，詞表卻沒有這一筆。
    {"w": "膽道阻塞", "al": "biliary-obstruction 膽道塞住 黃疸 阻塞性黃疸 總膽管結石阻塞"},
    // abx-trauma-abx 的 c 陣列與上位詞「創傷」的 sub 都已經在用這個字，詞表卻沒有這一筆。
    {"w": "創傷後抗生素", "al": "trauma-antibiotics 創傷用藥 外傷抗生素 開放傷口抗生素"},

    /* ══ 第 5 輪：合併 323 個頁內子目標時補的新詞（見 data/sub-abx.js／sub-drugs.js／
       sub-classif.js 的檔頭說明）。33 個病原菌名的中文名與英文別名逐字取自
       data/sub-abx.js（來源 Clinical-Tools/data/antibiotics/regimens.js 的
       window.BACTERIA 各項 en 欄位，非自編）；16 個抗黴菌／抗病毒／抗寄生蟲覆蓋類別詞
       取自 data/sub-drugs.js 藥物的覆蓋標註原文（引自 window.COV_LABELS_FUNGAL／
       VIRAL／PARA 的標籤文字）。凡是中西名字面不同但指同一個概念的（麴菌/Aspergillus、
       毛黴菌/Mucorales、困難梭菌/C. difficile/困難梭狀桿菌感染），用 sub 雙向收編，
       選任一邊都能同時命中病原菌子目標與相關藥物子目標。
       每一個新詞都已材化進 hub-antibiotics（藥物查詢）或 classifications（分類與
       分級系統）這兩個頁級項目的 s／c 陣列（見下方 tools[] 的對應筆），保證選了
       就一定有東西可對，不是建了卻查不到——這句話只講「主清單字面比對」這一件事，
       不要誤讀成「三份子目標資料檔裡只有這兩個 parent」。實測 window.Sent.subsByParent
       有 4 個 parent：hub-antibiotics(155)／abx-mode-empiric(61)／
       abx-mode-bacteria(44)／classifications(33)；js/views.js 的
       growthPickerHTML()（頁內子目標的「選一個子目標，句子繼續長」清單）走的是
       sub-*.js 各筆的 parent 欄位，跟這裡的 s／c 關鍵字材化是兩條互不相干的
       路徑——abx-mode-empiric／abx-mode-bacteria 一樣會經過 growthPickerHTML()
       （hub-antibiotics 因為 impl='abx' 走原生頁，不經過）。 ══ */
    {"w": "金黃色葡萄球菌", "al": "Staphylococcus aureus S.aureus MSSA staph"},
    {"w": "肺炎鏈球菌", "al": "Streptococcus pneumoniae pneumococcus S.pneumoniae"},
    {"w": "李斯特菌", "al": "Listeria monocytogenes listeriosis"},
    {"w": "鮑氏不動桿菌", "al": "Acinetobacter baumannii CRAB"},
    {"w": "嗜麥芽窄食單胞菌", "al": "Stenotrophomonas maltophilia"},
    {"w": "A 群鏈球菌", "al": "Streptococcus pyogenes GAS 化膿鏈球菌 group A streptococcus"},
    {"w": "B 群鏈球菌", "al": "Streptococcus agalactiae GBS group B streptococcus"},
    {"w": "AmpC 型", "al": "AmpC AmpC producers β-lactamase Enterobacter Citrobacter Serratia"},
    {"w": "創傷弧菌", "al": "Vibrio vulnificus"},
    {"w": "卡他莫拉菌", "al": "Moraxella catarrhalis"},
    // 困難梭菌＝C. difficile＝困難梭狀桿菌感染（sub-classif.js 分類系統條目的名稱）；三個字面都收進來。
    {"w": "困難梭菌", "al": "Clostridioides difficile Clostridium difficile CDI", "sub": ["C. difficile", "困難梭狀桿菌感染"]},
    {"w": "多殺巴斯德氏菌", "al": "Pasteurella multocida"},
    {"w": "大腸桿菌 / 克雷伯氏菌", "al": "E.coli Klebsiella Escherichia coli Klebsiella pneumoniae 大腸桿菌 克雷伯氏菌"},
    {"w": "少動鞘胺醇單胞菌", "al": "Sphingomonas paucimobilis"},
    {"w": "抗碳青黴烯腸道菌", "al": "CRE carbapenem-resistant Enterobacterales"},
    {"w": "新型隱球菌", "al": "Cryptococcus neoformans cryptococcosis"},
    {"w": "曲狀桿菌", "al": "Campylobacter jejuni"},
    {"w": "毛黴菌", "al": "mucormycosis 毛黴菌病", "sub": ["Mucorales"]},
    {"w": "洋蔥伯克霍爾德氏菌", "al": "Burkholderia cepacia"},
    {"w": "流感嗜血桿菌", "al": "Haemophilus influenzae"},
    {"w": "淋病雙球菌", "al": "Neisseria gonorrhoeae gonorrhea"},
    {"w": "產吲哚金黃桿菌", "al": "Chryseobacterium indologenes"},
    {"w": "產氣單胞菌", "al": "Aeromonas hydrophila"},
    {"w": "腦膜炎雙球菌", "al": "Neisseria meningitidis meningococcus"},
    {"w": "草綠色鏈球菌", "al": "viridans group streptococci Streptococcus viridans"},
    {"w": "表皮／凝固酶陰性葡萄球菌", "al": "coagulase-negative staphylococci CoNS Staphylococcus epidermidis"},
    {"w": "諾卡氏菌", "al": "Nocardia nocardiosis"},
    {"w": "變形桿菌／摩根氏菌／普羅威登斯菌", "al": "Proteus Morganella Providencia"},
    {"w": "退伍軍人桿菌", "al": "Legionella pneumophila legionnaires"},
    {"w": "非傷寒沙門氏菌", "al": "non-typhoidal Salmonella NTS"},
    {"w": "類鼻疽伯克霍爾德氏菌", "al": "Burkholderia pseudomallei melioidosis 類鼻疽"},
    {"w": "麴菌", "al": "aspergillosis 侵襲性麴菌病", "sub": ["Aspergillus"]},
    {"w": "黴漿菌 / 披衣菌", "al": "Mycoplasma Chlamydophila Chlamydia 黴漿菌 披衣菌"},

    // 抗黴菌／抗病毒／抗寄生蟲覆蓋類別詞（16 個）；跟上面兩組中文病原菌名雙向 sub。
    {"w": "Aspergillus", "al": "aspergillosis 侵襲性麴菌病", "sub": ["麴菌"]},
    {"w": "Mucorales", "al": "mucormycosis 毛黴菌病", "sub": ["毛黴菌"]},
    {"w": "glabrata/krusei", "al": "Candida glabrata Candida krusei 念珠菌"},
    {"w": "Histoplasma", "al": "Histoplasma capsulatum histoplasmosis 組織漿菌病"},
    {"w": "Blastomyces", "al": "Blastomyces dermatitidis blastomycosis 芽生菌病"},
    {"w": "Coccidioides", "al": "coccidioidomycosis 球黴菌病"},
    {"w": "Fusarium", "al": "fusariosis"},
    {"w": "HIV", "al": "human immunodeficiency virus 人類免疫缺乏病毒 愛滋病毒 愛滋病"},
    {"w": "HBV", "al": "hepatitis B virus B型肝炎 乙型肝炎"},
    {"w": "HCV", "al": "hepatitis C virus C型肝炎 丙型肝炎"},
    {"w": "CMV", "al": "cytomegalovirus 巨細胞病毒"},
    {"w": "HSV/VZV", "al": "herpes simplex virus varicella zoster virus 疱疹病毒 水痘帶狀疱疹病毒"},
    {"w": "Influenza", "al": "influenza flu 流感"},
    {"w": "SARS-CoV-2", "al": "COVID-19 coronavirus 新冠肺炎 新型冠狀病毒"},
    {"w": "RSV", "al": "respiratory syncytial virus 呼吸道融合病毒"},
    {"w": "瘧原蟲", "al": "malaria Plasmodium 瘧疾"},
    {"w": "原蟲", "al": "protozoa amoeba Toxoplasma 阿米巴 弓形蟲"},
    {"w": "線蟲", "al": "nematode roundworm 蛔蟲 蟯蟲 鉤蟲 鞭蟲"},
    {"w": "絛蟲", "al": "tapeworm cestode 絛蟲病"},
    {"w": "吸蟲", "al": "fluke trematode schistosomiasis 血吸蟲"},
    {"w": "外寄生蟲", "al": "ectoparasite scabies 疥瘡 蝨"},

    // 基線分類詞：把上面具體病原菌／覆蓋詞收進更好記的上位詞。
    {"w": "抗黴菌治療", "al": "antifungal 抗黴菌 抗真菌", "sub": ["侵襲性念珠菌感染", "glabrata/krusei", "Aspergillus", "Mucorales", "Histoplasma", "Blastomyces", "Coccidioides", "Fusarium", "局部黴菌感染"]},
    {"w": "抗寄生蟲治療", "al": "antiparasitic 驅蟲 抗原蟲", "sub": ["瘧原蟲", "原蟲", "線蟲", "絛蟲", "吸蟲", "外寄生蟲"]},
    // 資料實際字面是「抗麻風」；別名補上使用者可能誤寫的異體字「抗痲瘋」。
    {"w": "抗麻風", "al": "leprosy Hansen's disease anti-leprosy 麻風病 痲瘋病 抗痲瘋"},
    // 非典型覆蓋（fluoroquinolone／macrolide／tetracycline 等藥物頁常見標註），與病原菌頁的「黴漿菌 / 披衣菌」「退伍軍人桿菌」相通。
    {"w": "非典型", "al": "atypical atypical pathogens", "sub": ["黴漿菌 / 披衣菌", "退伍軍人桿菌"]},
    // 局部／黏膜表面用抗黴菌藥（fenticonazole、nystatin）——刻意不掛「侵襲性念珠菌感染」，
    // 見 data/sub-drugs.js 檔頭關於這兩顆藥被排除的說明（正式版徽章不分全身性與局部性，
    // 查詢索引要回答「現在該打開什麼」，不能讓侵襲性念珠菌感染的查詢拿到一條外用乳膏）。
    {"w": "局部黴菌感染", "al": "topical antifungal superficial mycosis dermatophyte tinea ringworm 癬 股癬 足癬 甲癬 頭癬 陰道念珠菌 口咽念珠菌"},

    // 分類與分級系統頁的子目標新詞。
    {"w": "總膽管結石", "al": "choledocholithiasis CBD stone ASGE"},
    {"w": "衰弱", "al": "frailty Clinical Frailty Scale CFS Rockwood"},
  ],
  "a": [
    /* ══ 第 6 輪：動作面向的口語擴充 ══════════════════════════════════
       使用者原話：「我打『我遇到腹膜的感染，我要』後面可以輸入『給抗生素』或
       『找原因』…以上只是舉例，請拓展到其他用詞。」
       動作格是三個面向裡最薄的一塊（30 個詞、平均 5.5 個別名），而值班真正
       打出來的是「怎麼辦」「該開刀嗎」「開多少」「幾分」「多嚴重」「什麼時候」
       這種口語，不是「定嚴重度」這種標題語。以下每一條都補上同義的口語問法、
       英文與縮寫；另在末端新增一個上位動作詞「怎麼處理」，把最常見的那句
       「這個要怎麼辦」接到整條處置鏈上。
       原則同其他兩個面向：只增不減，寧可多給候選。 ══════════════════════ */
    {"w": "算分數", "al": "score scoring calculate calculator 計分 分數 算一下 幾分 評分 計算 算出來"},
    {"w": "定嚴重度", "al": "severity grade grading risk-stratification 分級 嚴重度 風險分層 多嚴重 嚴不嚴重 分幾級 危不危險 重不重"},
    {"w": "要不要開刀", "al": "operative surgery operation 手術 開刀 保守 要不要手術 需不需要手術 該不該開 要開嗎 開不開 該開刀嗎 保守治療 非手術治療 NOM"},
    {"w": "選術式", "al": "procedure approach technique 術式 手術方式 怎麼開刀 開什麼刀 用什麼術式 入路 腹腔鏡 開腹 切多少"},
    {"w": "判時機", "al": "timing when 時機 多久 幾小時 追蹤 監測頻率 多久追蹤 什麼時候 何時 幾天 要等多久 現在還是等 等得了嗎 多久一次"},
    {"w": "查劑量", "al": "dose dosing dosage 劑量 用法 給藥 開多少 要開多少 幾毫克 mg 濃度 泡法 輸注 infusion 稀釋 給多少 一天幾次"},
    {"w": "查腎肝調整", "al": "renal hepatic adjustment 腎功能 肝功能 透析 CVVH 腎調整 肝調整 洗腎劑量 renal-dose 腎不好怎麼給"},
    {"w": "查覆蓋菌譜", "al": "spectrum coverage susceptibility 菌譜 覆蓋 感受性 涵蓋 打得到 蓋不蓋得住 有沒有涵蓋 抗菌範圍"},
    {"w": "查分期", "al": "staging stage TNM 分期 期別 第幾期 期數 早期晚期 幾期"},
    {"w": "查禁忌", "al": "contraindication warning adverse 禁忌 警示 副作用 可不可以給 能不能用 有沒有禁忌 不良反應 會不會有問題"},
    // 與「查禁忌」分開：禁忌問的是「這一支能不能給這個病人」，交互作用問的是
    // 「這幾支湊在一起會不會出事」，兩者落到不同的頁面。
    {"w": "查交互作用", "al": "interaction interactions DDI drug-drug 交互作用 相互作用 會不會撞 撞不撞 可不可以一起吃 可不可以一起給 能不能併用 併用 合併用藥 一起下 對撞"},
    // 決策流程的本質就是鑑別與分流，31 個 pathway 全部直標；另加兩個以分型／分類為主的查閱頁（分類與分級系統、菌譜資料庫、依病原菌模式）。
    // 第 6 輪補：值班第一句話多半是「這是什麼」「為什麼會這樣」，不是「找原因」這三個字。
    {"w": "找原因", "al": "鑑別診斷 是什麼 查病因 differential diagnosis etiology workup 怎麼分型 分型 分類 為什麼 原因 病因 怎麼會 什麼病 診斷 鑑別 找病灶 怎麼來的"},
    // 疑似感染時值班的第一個念頭。sub 沿用 brief 給的三個精確動作詞，但本檔案只材化到查覆蓋菌譜這一支真正專屬抗生素的動作詞（見下方「七、抗微生物六個入口」）——查劑量／查禁忌是幾十個劑量計算器共用的泛用動作詞，若展開式比對（js/sentence.js）直接把 sub 三個字都當成 OR 條件用來單獨搜尋（不靠 s／c 同時收斂），會把不相干的項目也掃進來，請那邊實作時注意。
    // 第 6 輪補：「要不要給抗生素」「上抗生素」「換藥」「降階」都是同一件事。
    {"w": "給抗生素", "al": "選抗生素 怎麼給藥 要給什麼藥 經驗性治療 antibiotics empiric therapy 給藥 用藥 開藥 要不要抗生素 上抗生素 用什麼抗生素 換抗生素 降階 de-escalation 抗生素怎麼給 打什麼抗生素", "sub": ["查覆蓋菌譜", "查劑量", "查禁忌"]},
    // 腎功能不好時要調劑量。sub 沿用 brief 給的兩個精確動作詞，但材化只用查腎肝調整這一支（查劑量太泛用，理由同「給抗生素」的註解）——材化後命中 eGFR／Child-Pugh／藥物資料庫等已含查腎肝調整的項目。
    {"w": "怎麼調", "al": "腎功能調整 換算 劑量調整 dose-adjustment renal-adjustment conversion 怎麼算 要調嗎 需不需要調 減量 減半 調劑量", "sub": ["查劑量", "查腎肝調整"]},
    // 術前抗栓藥要不要停，直接標到 periop-anticoag（唯一對得上的項目）。
    {"w": "停藥", "al": "橋接 bridging hold stop 術前停藥 antithrombotic 要不要停 停多久 何時停 停幾天 先停藥"},
    // 出血病人要拮抗抗凝劑，直標到 anticoag-reversal 與 periop-anticoag（其「急刀／反轉」分頁本來就講反轉劑量）。
    {"w": "逆轉", "al": "拮抗 antidote reverse reversal 反轉 解藥 反轉劑 拮抗劑 中和"},
    // chole-path：desc 明寫「膽囊引流」是治療選項之一；divert-path：desc 明寫「經皮引流」；panc-path：desc 明寫「壞死感染之 step-up 引流時機」；gi-perf-path：desc 明寫「決定 NOM、引流或手術入路」
    {"w": "要不要引流", "al": "drainage percutaneous 引流 percutaneous-drainage 放管子 pigtail 引流管 穿刺引流 要不要放管"},
    // rsi：整頁就是快速誘導插管本身；ards-path：desc 明寫升階路徑 HFNO → 插管 → 肺保護通氣
    {"w": "要不要插管", "al": "intubate intubation 插管 airway 插不插管 該插管嗎 要不要放管 airway-management"},
    // trauma-resus：desc 明寫 FFP:pRBC ≥1:2、fibrinogen 給法，屬大量輸血協定；ich-path：desc 明寫「不需開刀者輸血小板都是 Class 3 有害」，輸血本身是決策點
    {"w": "要不要輸血", "al": "transfusion blood-product 輸血 MTP 輸幾袋 給血 血品 要不要給血 輸血小板"},
    // aki-path：整頁副標就是 AKI & RRT Timing Pathway
    {"w": "要不要洗腎", "al": "dialysis RRT CRRT 洗腎 透析 上洗腎 需不需要透析 要洗嗎 上機時機"},
    // trauma-path：desc 明寫依血行動力學與 E-FAST 決定「可安全影像者」才做 CT，即影像 vs 剖腹的分流；aas-path：desc 明寫 ADD-RS 計分是用來「分流影像」
    {"w": "要不要照CT", "al": "CT imaging image 影像 電腦斷層 要不要影像 做什麼檢查 要照什麼 超音波 X光 要不要掃"},
    // fgsi：desc 明寫「用於加護病房收治判斷，非手術判準」——原文就是這個問句
    {"w": "要不要轉ICU", "al": "ICU admission 加護病房 收治 要不要收 收加護 轉加護病房 需不需要ICU 要不要升級照護"},
    // acls：整頁就是 2025 AHA 復甦演算法；trauma-resus：整頁就是 Damage Control Resuscitation Pathway；sepsis-path：desc 明寫 30 mL/kg 平衡鹽液起始復甦
    {"w": "怎麼復甦", "al": "CPR resuscitation resuscitate ACLS 復甦 急救 壓胸 電擊 救回來 怎麼急救 怎麼壓"},
    // vasopressor：整頁就是升壓/強心藥流速計算；cs-path：desc 明寫「不先給強心劑」的升壓策略；sepsis-path：desc 明寫 norepinephrine → vasopressin → epinephrine 升階；hf：desc 明寫急性心衰竭的處置涵蓋這一塊
    {"w": "給升壓劑", "al": "vasopressor pressor inotrope 升壓 強心 升血壓 血壓拉不起來 需不需要升壓 要不要上升壓 用哪一支升壓"},
    // lpv：整頁就是肺保護通氣設定；resp-failure：c 已含機械通氣，整頁是四型呼吸衰竭的支持治療階梯；ards-path：desc 明寫 HFNO → 插管 → 肺保護通氣 → 俯臥 → NMBA → ECMO
    {"w": "怎麼通氣", "al": "ventilate ventilation vent-setting 呼吸器設定 通氣設定 呼吸器怎麼設 潮氣量 PEEP 設定 參數怎麼調 呼吸器參數"},
    // tbi-path：desc 明寫 ICP >22 才治療、CPP 60–70、decompressive craniectomy
    {"w": "降腦壓", "al": "ICP intracranial-pressure 顱內壓 降腦壓 腦壓高 減壓 開顱減壓"},
    // gi-bleed-path：desc 明寫「選擇止血方式」；trauma-resus：desc 明寫 TXA／fibrinogen 等止血藥物協定；anticoag-reversal：逆轉抗凝本身就是止血手段之一
    {"w": "怎麼止血", "al": "hemostasis haemostasis 止血 血止不住 止不住 止血方式 怎麼止 止血劑"},
    // 跟家屬解釋時要有數字；直標到七個明確以死亡率／移植優先序／預後分級為內容的項目。
    {"w": "判預後", "al": "prognosis outcome survival 預後 存活率 會不會死 死亡率 mortality 預後如何 活多久 有沒有救 跟家屬解釋 病情解釋"},
    // 30 個癌別頁本來就同時含分期／淋巴結／治療三塊（見 catalog 的癌症治療 hub 說明），直標到全部 30 個。
    {"w": "看治療", "al": "治療 治療決策 chemotherapy regimen treatment adjuvant neoadjuvant 化療 標靶 免疫治療 怎麼治療 要怎麼治 治療方式 怎麼治 處方 治療計畫"},
    // 24 個有實體手術的癌別 ＋ 淋巴癌（本身就是以淋巴結分期）＝ 25 個；白血病／MDS／MPN 是全身性血液腫瘤，沒有 TNM 的 N 分期，不標。
    {"w": "查淋巴結", "al": "lymph node station dissection 淋巴結 分群 N分期 淋巴 清掃 幾群 要清到哪"},
    // 只標到 24 個「可手術」的實體癌——術後／術前輔助治療是這些癌別才有的決策點；六個血液腫瘤（白血病／淋巴癌／MDS／MPN）治療模式不是「手術＋輔助」，不標。
    {"w": "要不要輔助治療", "al": "adjuvant neoadjuvant 輔助治療 術後化療 術前化療 要不要化療 開完刀還要做什麼 術前要不要先化療"},

    /* ══ 第 8 輪新增：「我要一套分級／分型系統」這個動作 ══════════════════
       使用者原話舉的例子是「我遇到闌尾炎，我要術中分級」。動作面向原本 31 個詞
       裡沒有任何一個表達「請給我一套分級系統」——最接近的兩個都在講別的事：
         · 「定嚴重度」問的是**這個病人多嚴重**（NEWS2、qSOFA、SOFA 都算），
           不是「有哪一套分級表可以套」；
         · 「找原因」的別名裡雖有「分型／分類」，但那條詞是鑑別診斷用的。
       所以新增這一條，別名收三種講法：正式名（分級系統／分類系統／分級量表）、
       值班口語（用哪一套／是第幾級／怎麼分級）、以及**判定情境**——
       「術中分級」不是我發明的說法，tools/classifications.html 自己就有：
       AAST EGS 四個判定欄位之一是「術中（Operative）」、Parkland 的英文名寫著
       「術中第一眼」、Nassar 是手術困難度分級、Hinchey 的出處欄寫「術中所見＋CT」。

       ⚠ 位置刻意排在陣列**最後面**（只在「怎麼處理」之前）：buildFacetIndex()
       建別名索引是先到先得（`if(!idx[a]) idx[a]=o`），排在前面會把「分級」「嚴重度」
       從「定嚴重度」手上搶走、把「分類」「分型」從「找原因」手上搶走，
       等於改掉既有兩個詞的行為。排最後就只認自己這幾個沒人用過的別名。 ══ */
    {"w": "查分級系統", "al": "grading classification grading-scale grading-system classification-system 分級系統 分類系統 分級表 分級量表 分級標準 分類標準 術中分級 術中分期 術中所見 哪一套分級 用哪一套 是第幾級 屬於第幾型 查分級 查分類 查分型 怎麼分級 有沒有分級"},

    /* ══ 第 6 輪新增的上位動作詞。值班打字時最常出現的其實是「怎麼辦」三個字，
       原本一個標的都對不到。這一條不新增任何臨床內容，只是把「怎麼辦」接到
       既有的六個動作詞上（找原因→定嚴重度→要不要開刀→看治療→查劑量→判時機
       就是一次完整的處置鏈），選了它等於一次看到這條線上的所有標的。
       刻意收得很寬，因為問「怎麼辦」的人正是還沒想清楚要問什麼的人。 ══ */
    {"w": "怎麼處理", "al": "management manage next-step 怎麼辦 該怎麼做 該怎麼辦 下一步 處置 怎麼處置 怎麼做 要做什麼 handle 處理方式", "sub": ["找原因", "定嚴重度", "要不要開刀", "看治療", "查劑量", "判時機"]},
  ],
  "tools": [
    {"k": "appy-path", "name": "急性闌尾炎", "en": "Appendicitis", "desc": "依複雜度、族群與膿瘍年齡分流，決定手術或非手術治療（WSES 2025 Jerusalem Guidelines · JAMA Surg 2026）", "kind": "pathway", "href": "pathways/appendicitis.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "感染", "grpEn": "Infection", "cnt": "5 項", "s": ["闌尾", "腹部", "腹膜"], "c": ["闌尾炎", "腹腔感染", "腹內膿瘍", "免疫低下", "感染"], "a": ["要不要開刀", "判時機", "選術式", "定嚴重度", "找原因"], "impl": "appy"},
    {"k": "chole-path", "name": "急性膽囊炎", "en": "Acute Cholecystitis", "desc": "先分流合併之膽道／胰臟問題，再依 TG18 嚴重度與手術風險決定早期腹腔鏡手術、膽囊引流或保守治療（TG18 · WSES · AAST）", "kind": "pathway", "href": "pathways/cholecystitis.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "感染", "grpEn": "Infection", "cnt": "5 項", "s": ["膽道", "腹部", "腹膜"], "c": ["膽囊炎", "膽管炎", "腹腔感染", "膽道阻塞", "感染", "阻塞"], "a": ["要不要開刀", "判時機", "選術式", "定嚴重度", "找原因", "要不要引流"], "impl": ""},
    {"k": "divert-path", "name": "急性大腸憩室炎", "en": "Acute Colonic Diverticulitis", "desc": "依 WSES CT 分期與生理狀態決定門診治療、抗生素、經皮引流或術式，並判定非手術後之大腸評估（WSES 2020）", "kind": "pathway", "href": "pathways/diverticulitis.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "感染", "grpEn": "Infection", "cnt": "5 項", "s": ["大腸", "腹部", "腹膜"], "c": ["憩室炎", "腹腔感染", "腹內膿瘍", "感染"], "a": ["要不要開刀", "定嚴重度", "判時機", "選術式", "找原因", "要不要引流"], "impl": ""},
    // 第 7 輪 c 補「腹內膿瘍」：本頁 desc 寫「壞死感染之 step-up 引流時機」，頁內為
    // 包裹性壞死（WON）的引流適應症——那就是腹內感染性積聚。原本「胰臟的膿瘍」查不到。
    {"k": "panc-path", "name": "急性胰臟炎", "en": "Acute Pancreatitis", "desc": "ERCP 適應症與膽囊切除時機、依 Revised Atlanta 嚴重度處置，及壞死感染之 step-up 引流時機（WSES 2019 · Atlanta 2012）", "kind": "pathway", "href": "pathways/pancreatitis.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "感染", "grpEn": "Infection", "cnt": "5 項", "s": ["胰臟", "腹部", "腹膜"], "c": ["胰臟炎", "腹腔感染", "腹內膿瘍", "器官衰竭", "衰竭", "感染"], "a": ["定嚴重度", "要不要開刀", "判時機", "選術式", "找原因", "要不要引流"], "impl": ""},
    // 第 7 輪 s 補「腹壁與疝氣」「腹部」：本頁副標就是「腹壁／會陰（Fournier's gangrene）／
    // 四肢」，頁內另有「腹壁／軀幹壞死性感染 — 緊急徹底清創」整段建議，並說明感染沿
    // Colles↔Scarpa 筋膜延伸至腹壁。原本部位沒有腹壁，「腹壁的感染」查不到。
    {"k": "nsti-path", "name": "壞死性軟組織感染", "en": "Necrotizing Soft Tissue Infection", "desc": "確立是否為壞死性後，依部位與糞便污染決定清創範圍與改道，再依再探查所見決定重複清創（WSES／SIS-E 2018）", "kind": "pathway", "href": "pathways/nsti.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "感染", "grpEn": "Infection", "cnt": "5 項", "s": ["軟組織", "會陰", "感染與敗血", "腹壁與疝氣", "腹部"], "c": ["壞死性軟組織感染", "皮膚軟組織感染", "感染"], "a": ["要不要開刀", "判時機", "定嚴重度", "選術式", "找原因"], "impl": ""},
    {"k": "bo-path", "name": "腸阻塞", "en": "Bowel Obstruction", "desc": "先分機械性／功能性（含麻痺性腸阻塞、ACPO 與毒性巨結腸之鑑別），再定病因並判斷立即手術指標（WSES · ASCRS · MASCC · EAST）", "kind": "pathway", "href": "pathways/bowel-obstruction.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["小腸", "大腸", "腹部"], "c": ["腸阻塞", "腸絞窄", "阻塞"], "a": ["要不要開刀", "判時機", "定嚴重度", "選術式", "找原因"], "impl": ""},
    // 第 6 輪 s 補「小腸」「胃十二指腸」：本頁 desc 自己就列了「…迴腸乙狀結腸打結、
    // 小腸、中腸、胃」，部位面向卻只掛大腸／腹部。使用者原話抱怨「我遇到小腸的腸阻塞，
    // 我要選術式」給的東西太少，小腸扭轉本來就在這一頁裡。（逐字引用 desc，不新增臨床內容。）
    {"k": "volv-path", "name": "腸扭轉", "en": "Volvulus", "desc": "先以生理狀態分流，再依部位決定術式——乙狀結腸、盲腸、橫結腸、脾曲、迴腸乙狀結腸打結、小腸、中腸、胃（ASCRS 2021 · WSES 2023 · SAGES 2013）", "kind": "pathway", "href": "pathways/volvulus.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["大腸", "腹部", "小腸", "胃十二指腸"], "c": ["腸扭轉", "腸阻塞", "阻塞"], "a": ["要不要開刀", "選術式", "判時機", "找原因"], "impl": ""},
    {"k": "iss-path", "name": "腸套疊", "en": "Intussusception", "desc": "兒童與成人分流，依超音波／CT 型態決定灌腸復位、觀察或 en-bloc 切除（APSA 2021 · 日本小兒急診 2012）", "kind": "pathway", "href": "pathways/intussusception.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["小腸", "兒科", "腹部"], "c": ["腸套疊", "腸阻塞", "兒童病人", "阻塞"], "a": ["要不要開刀", "判時機", "選術式", "找原因"], "impl": ""},
    {"k": "hernia-path", "name": "腹股溝疝氣", "en": "Groin Hernia", "desc": "嵌頓／絞窄疝氣依 TAXIS 禁忌決定徒手復位或緊急手術，再依腸道存活與 CDC 傷口分類選擇修補（WSES 2017 · HerniaSurge 2023）", "kind": "pathway", "href": "pathways/hernia.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["腹壁與疝氣", "腹部"], "c": ["疝氣", "嵌頓", "腸阻塞", "阻塞"], "a": ["要不要開刀", "選術式", "判時機", "找原因"], "impl": ""},
    // 第 7 輪 s 補「小腸」：使用者原話「小腸的發炎，應該也要出現腸缺血」。本頁文字寫著
    // 「Acute mesenteric ischaemia — 小腸為主」，急性腸繫膜缺血本來就是小腸的病，
    // 原本部位卻只掛腸繫膜血管／大腸，打「小腸」反而查不到這一頁。
    {"k": "gi-isch-path", "name": "腸胃道缺血", "en": "GI Ischemia", "desc": "分辨急性腸繫膜缺血 (AMI)、大腸缺血 (CI) 與慢性腸繫膜缺血 (CMI)，依 CTA 型態與腹膜炎決定血管內重建、抗凝或損害控制（ESVS 2025 · WSES 2022 · ACG 2015）", "kind": "pathway", "href": "pathways/gi-ischemia.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["腸繫膜血管", "大腸", "小腸", "腹部"], "c": ["腸缺血"], "a": ["要不要開刀", "定嚴重度", "判時機", "選術式", "找原因"], "impl": ""},
    // 第 7 輪 s 補「小腸」：使用者原話「查小腸的穿孔則沒有項目，但應該要引導到消化道穿孔」。
    // 本頁 desc 就寫著「醫源性大腸鏡與小腸穿孔」，頁面內另有整段標題為「小腸及其他腸胃道穿孔」，
    // 並寫明「適用所有續發性腹膜炎（含小腸／大腸穿孔）」。原本部位只掛胃十二指腸／大腸，小腸查不到。
    {"k": "gi-perf-path", "name": "腸胃道穿孔", "en": "GI Perforation", "desc": "依病因分流消化性潰瘍、憩室、醫源性大腸鏡與小腸穿孔，決定 NOM、引流或手術入路（WSES 2017–2020）", "kind": "pathway", "href": "pathways/gi-perforation.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "阻塞 / 缺血 / 穿孔", "grpEn": "Obstruction · Ischemia · Perforation", "cnt": "6 項", "s": ["胃十二指腸", "大腸", "小腸", "腹部", "腹膜"], "c": ["消化道穿孔", "腹膜炎", "消化性潰瘍穿孔", "腹腔感染", "感染"], "a": ["要不要開刀", "選術式", "判時機", "找原因", "要不要引流"], "impl": ""},
    // 第 7 輪 s 補「食道」「肝臟」：本頁上消化道分支的第一個分岔就是「已知或高度懷疑
    // 肝硬化／門脈高壓？」，靜脈瘤出血的部位是食道、病因在肝。原本只掛胃十二指腸／大腸，
    // 「食道的出血」「肝臟的出血」這兩句最常見的值班問法都查不到。
    {"k": "gi-bleed-path", "name": "消化道出血", "en": "GI Bleeding", "desc": "上消化道依 GBS 分流與 Forrest 分類選擇止血方式，下消化道以 Oakland score 判定可否出院（ESGE 2026 · ACG 2021 · ACG 2023）", "kind": "pathway", "href": "pathways/gi-bleeding.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "出血 / 創傷 / 腹腔高壓", "grpEn": "Hemorrhage · Trauma · Intra-abdominal Hypertension", "cnt": "4 項", "s": ["胃十二指腸", "大腸", "食道", "肝臟", "腹部"], "c": ["消化道出血", "上消化道出血", "下消化道出血", "出血"], "a": ["定嚴重度", "判時機", "要不要開刀", "選術式", "找原因", "怎麼止血"], "impl": ""},
    // 第 7 輪 c 補「阻塞」：本頁異物段落逐條處理「完全阻塞的食團有吸入與穿孔風險」與
    // 「其他未造成完全阻塞的食道異物，建議 24 小時內以軟式內視鏡處理」，
    // 食道異物／食團嵌頓本來就是阻塞。原本「食道的阻塞」查不到。
    {"k": "esoph", "name": "食道急症", "en": "Esophageal Emergencies", "desc": "穿孔／Boerhaave 依 Altorjay 條件決定手術與否、依位置決定術式；腐蝕性吞入採CT 優先（非內視鏡優先）以管壁不強化判定透壁壞死；異物依性質分 2 小時／24 小時兩級時限。附 Pittsburgh 嚴重度分數往返（WSES 2019，Oxford CEBM 分級而非 GRADE）", "kind": "pathway", "href": "pathways/esophageal-emergency.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "出血 / 創傷 / 腹腔高壓", "grpEn": "Hemorrhage · Trauma · Intra-abdominal Hypertension", "cnt": "4 項", "s": ["食道"], "c": ["食道急症", "消化道穿孔", "阻塞", "食道穿孔"], "a": ["要不要開刀", "判時機", "選術式", "定嚴重度", "找原因"], "impl": ""},
    // 第 6 輪 c 補「出血」：本頁 desc 明寫「依血行動力學反應與 E-FAST 決定是否
    // 立即剖腹」，那個決策點問的就是腹內出血。原本「我遇到腹部的出血，我要開刀嗎」
    // 只查得到消化道出血一頁，腹內出血反而漏掉。
    // 第 7 輪 s 補各實質與空腔臟器：本頁 desc 寫「依 AAST-OIS 2018 分級給各臟器處置」，
    // 頁面內逐臟器都有條文——肝（肝內膿瘍經皮引流 2A）、脾（脾修補）、腎、胰（胰廔管）、
    // 十二指腸（十二指腸-胰臟 2019 GoR 2A）、大腸、膀胱。原本部位只掛「腹部」，
    // 「肝臟的創傷」「腎臟的創傷」全部 0 件。另補腹膜（頁面寫腹腔游離液體最先積於肝上緣，
    // 即血腹）。脾臟在 s 詞表裡沒有對應的詞，故無法標。
    {"k": "trauma-path", "name": "腹部創傷", "en": "Abdominal Trauma", "desc": "依血行動力學反應與 E-FAST 決定是否立即剖腹，可安全影像者依 AAST-OIS 2018 分級給各臟器處置（WSES 2017–2020 · EAST 2010 · WTA 2018–2019）", "kind": "pathway", "href": "pathways/abdominal-trauma.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "出血 / 創傷 / 腹腔高壓", "grpEn": "Hemorrhage · Trauma · Intra-abdominal Hypertension", "cnt": "4 項", // 脾臟：AAST-OIS 逐臟器處置含脾修補，E-FAST 左上腹切面就是看脾腎隱窩與脾膈間
"s": ["腹部", "創傷", "肝臟", "胰臟", "腎臟", "脾臟", "胃十二指腸", "大腸", "泌尿系統", "腹膜"], "c": ["腹部創傷", "創傷", "出血"], "a": ["要不要開刀", "定嚴重度", "判時機", "選術式", "找原因", "要不要照CT"], "impl": ""},
    {"k": "iah-path", "name": "腹腔內腔室症候群", "en": "IAH / ACS & Open Abdomen", "desc": "依 IAP 分級與器官功能障礙區分 IAH 與 ACS，腹部打開後以 Björck 分類決定暫時性關腹與確定性關腹策略（WSACS 2013 · Björck 2016 · WSES 2018）", "kind": "pathway", "href": "pathways/iah-acs.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "出血 / 創傷 / 腹腔高壓", "grpEn": "Hemorrhage · Trauma · Intra-abdominal Hypertension", "cnt": "4 項", "s": ["腹部", "腹膜"], "c": ["腹腔高壓"], "a": ["定嚴重度", "要不要開刀", "選術式", "判時機", "找原因"], "impl": ""},
    {"k": "emerg-op", "name": "緊急手術分級", "en": "Emergency Surgery Priority Levels", "desc": "依台大醫院緊急手術作業規範查詢急刀級數（第一～五級）與合理等候時間；可用病況或術式關鍵字搜尋，一般外科列於首位，另附排程與滿線徵用原則", "kind": "tool", "href": "tools/emergency-surgery.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "排程 / 分級 / 圍手術期", "grpEn": "Scheduling · Classification · Perioperative", "cnt": "3 項", "s": ["手術排程", "病人整體"], "c": ["急刀分級", "手術"], "a": ["判時機", "定嚴重度"], "impl": ""},
        /* ══ s 欄刻意維持窄的兩個詞，不要再擴充 ══════════════════════════════
       第 8 輪曾把它擴成 25 個部位（闌尾／膽道／婦科／腦……），配上同一輪擴到
       33 個的 c 欄。比對是 s 與 c **各自獨立取交集**，於是這一筆等於宣告
       25 × 33 ＝ 825 組「部位 × 狀況」全部成立——但這一頁是 33 套彼此無關的
       分級系統的合輯，它的婦科內容是癌症分期，跟心因性休克毫無關係。
       實機後果（使用者回報）：選了「婦科」之後，狀況面板列出闌尾炎／膽囊炎／
       憩室炎／胰臟炎／腸阻塞…一整片 n=1 的候選，每一個點下去都是同一頁；
       而「我遇到婦科的休克」也會跑出「分類與分級系統」。
       改法不是砍到剩兩個，而是**逐條對照該頁真的收錄了哪 33 套系統**再決定：
       留下的 12 個部位每一個都有對應的系統（闌尾＝AAST EGS；膽道＝TG18／
       Parkland／Nassar／Niemeier／Mirizzi／總膽管結石；胰臟＝Revised Atlanta／
       DBC／CTSI；胃十二指腸＝Forrest；大腸＝Hinchey／WSES CT／乙狀結腸扭轉／
       困難梭菌；腹壁與疝氣＝EHS／Nyhus／Gilbert；小腸＝腸皮瘻管；腹膜＝腹腔內
       念珠菌感染；腦＝Marshall／Rotterdam／Hunt & Hess／WFNS／Fisher；
       心臟＝SCAI SHOCK；病人整體＝Clavien-Dindo／CFS）。
       刪掉的是查證後**該頁根本沒有對應系統**的：婦科、乳房（33 套裡一套婦科或
       乳房的都沒有）、肝臟、食道、會陰、軟組織、肺與氣道、腦血管、意識、
       腸繫膜血管、休克循環、抗黴菌藥、圍手術期。
       這一頁要被找到，靠的是：(1) c 欄那 33 個它真的收錄的狀況；
       (2) 動作「查分級系統」；(3) 頁內子目標索引——49 套分級系統各自有名字與
       #sys= 深層連結，打 Hinchey／AAST／Forrest 直接命中那一套，
       那才是正確的粒度。**不要用擴充 s 欄來讓它更容易被找到。** */
    {"k": "classifications", "name": "分類與分級系統", "en": "Grading & Classification Systems", "desc": "腹部急症各疾病的嚴重度分級、解剖分型與影像分期集中於一頁：AAST EGS（16 疾病）、TG18 膽囊炎／膽管炎、ASGE 總膽管結石、Parkland／Nassar、Niemeier、Mirizzi Csendes、WSES CT／Hinchey、Revised Atlanta／DBC／Balthazar CTSI、EHS／Nyhus／Gilbert-Rutkow-Robbins、Forrest；圍手術期之 Clavien-Dindo、ISREC 吻合口漏（併 ISGLS／ISGPS／ECCG 對照）、Clinical Frailty Scale；神經外傷之 Marshall CT 分類與 Rotterdam CT 分數；以及 C. difficile、腸皮／腸道－大氣瘻管、腹腔念珠菌、減重術後急症、乙狀結腸扭轉；循環之 SCAI SHOCK 心因性休克分級（A–E）", "kind": "mega", "href": "tools/classifications.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "排程 / 分級 / 圍手術期", "grpEn": "Scheduling · Classification · Perioperative", "cnt": "3 項", "s": ["腹部", "病人整體", "闌尾", "膽道", "胰臟", "胃十二指腸", "小腸", "大腸", "腹壁與疝氣", "腹膜", "腦", "心臟"], "c": ["分類分級", "膽囊炎", "消化道出血", "胰臟炎", "出血", "總膽管結石", "衰弱", "困難梭菌", "闌尾炎", "腹腔感染", "腹內膿瘍", "腹膜炎", "膽管炎", "膽道阻塞", "憩室炎", "消化道穿孔", "消化性潰瘍穿孔", "食道急症", "疝氣", "嵌頓", "腸阻塞", "腸扭轉", "腸缺血", "感染", "皮膚軟組織感染", "侵襲性念珠菌感染", "器官衰竭", "上消化道出血", "術後併發症", "創傷性腦損傷", "蜘蛛膜下腔出血", "心因性休克", "腹腔高壓"], "a": ["定嚴重度", "查分期", "找原因", "查分級系統"], "impl": ""},
    {"k": "periop-anticoag", "name": "圍手術期抗栓藥物管理", "en": "Perioperative Antithrombotic Management", "desc": "依藥物、CrCl 與處置出血風險輸出 DOAC／warfarin 的術前停藥天數、是否橋接、術後重啟時機，附術前用藥日曆；另含抗血小板與支架後手術延遲。刻意並列 CHEST 2022／EHRA 2021／ASRA 第 5 版三套方案而不合併——同一病人三者可差一至兩天，神經軸麻醉與機械瓣橋接的分歧另有標示。另設「急刀／反轉」分頁：以台大急刀五級對應反轉決策與劑量（idarucizumab、4F-PCC、維生素 K），標明 andexanet 已於 2025-12 退出美國市場且 ISTH 列急刀為不應使用", "kind": "tool", "href": "tools/periop-anticoag.html", "sec": "abdomen", "secTitle": "腹部急症", "secEn": "Abdominal Emergencies", "grp": "排程 / 分級 / 圍手術期", "grpEn": "Scheduling · Classification · Perioperative", "cnt": "3 項", "s": ["圍手術期", "凝血", "一般藥物"], "c": ["抗栓管理", "出血", "中風風險", "手術"], "a": ["判時機", "查劑量", "查禁忌", "停藥", "逆轉"], "impl": ""},
    {"k": "acls", "name": "ACLS", "en": "Advanced Cardiovascular Life Support", "desc": "依 2025 AHA CPR & ECC 官方 18 張演算法整理：成人之終止復甦、BLS、心跳停止、心搏過速／過緩、電擊整流、復甦後照護、異物哽塞、孕婦停止與 LVAD；另含兒科 PALS 與新生兒復甦。心跳停止、心搏過速與心搏過緩三張做成互動式流程；心電圖判讀圖鑑已獨立為 tools/ekg.html", "kind": "tool", "href": "tools/acls.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["心臟", "意識", "兒科"], "c": ["心跳停止", "心律不整", "意識障礙"], "a": ["查劑量", "判時機", "定嚴重度", "怎麼復甦"], "impl": ""},
    {"k": "sepsis-path", "name": "敗血性休克 Sepsis & Septic Shock Pathway", "en": "Sepsis & Septic Shock", "desc": "依 SSC 2026（2021 版已被取代）：抗生素時機依「可能／很可能／確定」三級分流（3 小時 vs 1 小時）、感染源控制 6 小時、30 mL/kg 平衡鹽液，到 norepinephrine → vasopressin → epinephrine 的升階；≥65 歲 MAP 目標降為 60–65、升壓劑可先走周邊靜脈", "kind": "pathway", "href": "pathways/sepsis.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["感染與敗血", "休克循環"], "c": ["敗血症", "敗血性休克", "菌血症", "發燒", "感染", "休克"], "a": ["定嚴重度", "查劑量", "判時機", "找原因", "怎麼復甦", "給升壓劑"], "impl": ""},
    {"k": "cs-path", "name": "心因性休克 Cardiogenic Shock Pathway", "en": "Cardiogenic Shock", "desc": "五個分頁。辨識用 SCAI 2022 五級（血壓正常仍可能是休克，C 級以乳酸 ≥2 為界，D 級必須「經過一段時間仍失敗」）與 CPO／PAPi；病因分流逐條引用 2023 ESC ACS——立即冠脈攝影與病灶血管 PCI（I B）、機械併發症手術（I C）、無機械併發症不建議常規 IABP（III B）；支持治療兩段式（起始處方 → 1–2 小時軌跡決定升階），並守住「灌流沒回來之前不利尿、不先給強心劑」；藥物含台大仿單劑量與體重換算、每張藥卡獨立框出禁忌症（nitroglycerin 在休克是仿單禁忌）；證據並列 ECLS-SHOCK 陰性與 DanGer Shock 正面之時間差", "kind": "pathway", "href": "pathways/cardiogenic-shock.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["心臟", "休克循環", "升壓與強心藥"], "c": ["心因性休克", "休克"], "a": ["定嚴重度", "查劑量", "判時機", "要不要開刀", "找原因", "給升壓劑"], "impl": ""},
    {"k": "swan", "name": "Swan-Ganz 導管判讀 Pulmonary Artery Catheter Pathway", "en": "Pulmonary Artery Catheter", "desc": "五個分頁。置放波形（RA→RV→PA→楔壓連續示意圖，含右心衰竭時 step-up 消失最易把 RV 誤認為 PA）；數值換算（輸入壓力與 CO 即算出 CI／SVR／PVR／DPG／CPO／PAPi／RA:PAWP／RVSWI／SvO₂ 相關參數並標示異常）；型態判讀互動流程（低血容／左心／右心／填塞／後負荷／分佈性，各附「還要驗證什麼」）＋ Forrester 四象限；異常波形圖示（巨大 v 波、TR 心室化、填塞 y 消失、收縮 vs 限制、whip、阻尼不良、over-wedging）；證據並列四個陰性 RCT 與心因性休克登錄／統合分析的落差（PACCS 仍進行中）", "kind": "pathway", "href": "pathways/swan-ganz.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["心臟", "休克循環"], "c": ["血行動力學監測", "休克"], "a": ["定嚴重度", "判時機", "找原因"], "impl": ""},
    {"k": "pe", "name": "肺栓塞", "en": "Acute Pulmonary Embolism", "desc": "依 2019 ESC 之診斷路徑（臨床機率、D-dimer、CTPA）、危險分層（休克、sPESI、右心室功能與心肌指標），到抗凝與再灌流治療與各藥物劑量", "kind": "tool", "href": "tools/pe.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["肺循環"], "c": ["肺栓塞"], "a": ["定嚴重度", "查劑量", "判時機"], "impl": ""},
    {"k": "trauma-resus", "name": "創傷大出血 Damage Control Resuscitation Pathway", "en": "Damage Control Resuscitation", "desc": "依 歐洲創傷大出血指引第六版（2023）：TBI 讓每個目標反向——無 TBI 採 permissive hypotension（SBP 80–90、血小板 >50），嚴重 TBI 反而 MAP ≥80、血小板 >100。含 TXA 3 小時門檻（1g/10min＋1g/8h）、FFP:pRBC ≥1:2、fibrinogen ≤1.5 g/L 給 3–4 g、離子鈣與致命三角", "kind": "pathway", "href": "pathways/trauma-resuscitation.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["創傷", "凝血", "休克循環"], "c": ["創傷大出血", "出血", "休克", "創傷"], "a": ["查劑量", "判時機", "定嚴重度", "找原因", "要不要輸血", "怎麼復甦", "怎麼止血"], "impl": ""},
    {"k": "vasoactive", "name": "血管活性藥物對照", "en": "Vasopressors, Inotropes & Inodilators", "desc": "四個分頁。效應對照表把 CO／PAOP／SVR／MAP／HR／CVP／PVR 七個參數 × 十支藥排成一張矩陣，與院外對照表逐格比對、三格不一致處標出理由（vasopressin 的肺阻力、升壓劑一律走中心靜脈、mcg/min 與 mcg/kg/min 在 60 kg 病人差 60 倍）；藥物卡附台大仿單劑量、泡法與即時 mL/hr 換算，並標出台大查無的四支（phenylephrine 針劑、nitroprusside、levosimendan、angiotensin II）；另有依休克型態選藥與試驗證據", "kind": "tool", "href": "tools/vasoactive.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "休克與復甦", "grpEn": "Shock & Resuscitation", "cnt": "7 項", "s": ["升壓與強心藥", "休克循環", "心臟", "一般藥物"], "c": ["休克", "敗血性休克", "心因性休克", "心臟衰竭", "血行動力學監測", "劑量換算"], "a": ["查劑量", "給升壓劑", "查禁忌", "怎麼調", "定嚴重度"], "impl": ""},
    {"k": "acs", "name": "急性冠心症", "en": "Acute Coronary Syndrome", "desc": "分流、心電圖判讀、再灌流時機（直接 PCI 與溶栓）、抗栓藥物與依體重換算之劑量；另含支架置放後之 DAPT 時長與緊急 CABG 的處理", "kind": "tool", "href": "tools/acs.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "心臟", "grpEn": "Cardiac", "cnt": "4 項", "s": ["冠狀動脈", "心臟"], "c": ["急性冠心症"], "a": ["查劑量", "判時機", "定嚴重度", "選術式"], "impl": ""},
    {"k": "hf", "name": "心臟衰竭", "en": "NTUH Heart Failure Guideline", "desc": "臺大醫院心血管中心第三版（2026/06 修訂）互動版：定義與診斷、HFrEF／HFmrEF／HFpEF 各自的藥物治療、心律處置、急性心衰竭、共病、機械循環支持與周產期心肌病變，末附台大院內流程與文獻", "kind": "tool", "href": "tools/heart-failure.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "心臟", "grpEn": "Cardiac", "cnt": "4 項", "s": ["心臟"], "c": ["心臟衰竭", "衰竭"], "a": ["查劑量", "定嚴重度", "給升壓劑"], "impl": ""},
    {"k": "pacemaker", "name": "節律器模式", "en": "Pacemaker Modes", "desc": "六個分頁，含可互動的 NBG 五碼編碼器（選出腔室與反應即翻成白話，並對 AAI 用在房室阻滯、VVI 用在竇性心律這類會出事的組合直接示警）。模式選擇與適應症逐條標 ESC 2021／2018 ACC-AHA-HRS 的 Class；暫時性節律器含經皮、經靜脈與心臟術後心外膜線（感知度數字越小＝越敏感單獨框出）；圍手術期把磁鐵放在節律器上是非同步、放在 ICD 上只停抗頻脈治療的差別放在最前面", "kind": "tool", "href": "tools/pacemaker.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "心臟", "grpEn": "Cardiac", "cnt": "4 項", "s": ["心臟", "圍手術期"], "c": ["心搏過緩", "心律不整", "心跳停止"], "a": ["怎麼調", "判時機", "找原因", "怎麼處理", "要不要開刀"], "impl": ""},
    /* 心電圖圖鑑原本是 acls.html 裡的十個分頁，使用者要求抽成獨立頁面並補上
       「非缺血性致命心電圖」與「暈厥八症候群」兩張圖譜提到的型態，故在此新增
       一個標的（acls 的 desc 同步拿掉圖鑑那一段，避免兩處各自宣稱擁有它）。 */
    {"k": "ekg", "name": "心電圖判讀圖鑑", "en": "ECG Pattern Atlas · EKG", "desc": "十一個分頁、七十餘型：竇性、心房、心室、房室阻滯、束支與分支、腔室肥大、節律器、缺血梗塞、全身因素、其他型態，以及猝死型態與暈厥（BE WHAT QT PiE 八症候群，含 ARVC 的 epsilon 波、HOCM 的匕首狀 Q 波、鈉離子通道阻斷的 aVR 終末 R 波、三束支阻滯、短 QT）。每型一張依判讀準則即時合成的示意波形＋判讀準則＋致病原因，另含 QTc 計算器", "kind": "mega", "href": "tools/ekg.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "心臟", "grpEn": "Cardiac", "cnt": "4 項", "s": ["心臟", "意識"], "c": ["心律不整", "心跳停止", "心搏過緩", "急性冠心症", "電解質異常", "高血鉀", "低血鉀", "肺栓塞", "意識障礙"], "a": ["找原因", "定嚴重度", "判時機"], "impl": ""},
    {"k": "resp-failure", "name": "呼吸衰竭總論 Acute Respiratory Failure Pathway", "en": "Acute Respiratory Failure", "desc": "四型分類 → 病因（心因性肺水腫／COPD 急性惡化／非心因性 AHRF-ARDS／氣喘／幫浦問題／術後／休克）→ 各自的診斷、第一線支持與具體藥物劑量 → 反應評估 → 難治時才進入 ECMO 判定（VV／VA／VAV，含 ELSO 適應症與禁忌）；改善者流程即止，不會走到 ECMO", "kind": "pathway", "href": "pathways/respiratory-failure.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "呼吸衰竭與氣道", "grpEn": "Respiratory Failure & Airway", "cnt": "4 項", "s": ["肺與氣道", "呼吸器"], "c": ["呼吸衰竭", "低血氧", "機械通氣", "衰竭", "缺氧"], "a": ["定嚴重度", "查劑量", "判時機", "找原因", "怎麼通氣"], "impl": ""},
    {"k": "ards-path", "name": "急性低血氧與 ARDS AHRF & ARDS Pathway", "en": "AHRF & ARDS", "desc": "HFNO → 插管 → 肺保護通氣 → 俯臥 → NMBA → ECMO 的完整升階，含 EOLIA 收案條件；三份現行指引（ESICM 2023／ATS 2024／SSC 2026）在 PEEP、神經肌肉阻斷與類固醇上方向不同，本頁逐條標明出處而不合併", "kind": "pathway", "href": "pathways/ards.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "呼吸衰竭與氣道", "grpEn": "Respiratory Failure & Airway", "cnt": "4 項", "s": ["肺與氣道", "呼吸器"], "c": ["ARDS", "低血氧", "呼吸衰竭", "衰竭", "缺氧"], "a": ["定嚴重度", "判時機", "查劑量", "找原因", "要不要插管", "怎麼通氣"], "impl": ""},
    {"k": "lpv", "name": "肺保護通氣 Lung-Protective Ventilation Pathway", "en": "Lung-Protective Ventilation", "desc": "預測體重與潮氣容積計算、PEEP/FiO₂ 兩張對照表，以及「調不好時怎麼辦」的四路排查——氧合不足、Pplat 過高／驅動壓偏高、呼吸性酸中毒、人機不同步；逐步數字出自 ARDSNet 協定卡（試驗方案），指引條文另行標註", "kind": "pathway", "href": "pathways/lung-protective-ventilation.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "呼吸衰竭與氣道", "grpEn": "Respiratory Failure & Airway", "cnt": "4 項", "s": ["呼吸器"], "c": ["機械通氣", "ARDS", "缺氧"], "a": ["查劑量", "定嚴重度", "找原因", "怎麼通氣"], "impl": ""},
    {"k": "rsi", "name": "快速誘導插管", "en": "Rapid Sequence Intubation", "desc": "分「流程、藥物、困難氣道、特殊情境、併發症、證據」六段：誘導與肌肉鬆弛藥物依體重換算劑量，每張藥卡之禁忌症獨立框出；困難氣道與插管後低血壓、去飽和之處置一併列出", "kind": "tool", "href": "tools/rsi.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "呼吸衰竭與氣道", "grpEn": "Respiratory Failure & Airway", "cnt": "4 項", "s": ["氣道", "鎮靜止痛"], "c": ["插管"], "a": ["查劑量", "判時機", "要不要插管"], "impl": ""},
    {"k": "aki-path", "name": "急性腎損傷 AKI & RRT Timing Pathway", "en": "AKI & RRT Timing", "desc": "先問緊急適應症、再問是否已到「不宜再等」的界線，最後才是模式與抗凝處方。五個隨機試驗顯示提早啟動不改善死亡率（STARRT-AKI 加速組 90 天仍依賴透析者反而較多），但 AKIKI-2 顯示超過寡尿 72 小時或 BUN 112 mg/dL 之後再拖有害", "kind": "pathway", "href": "pathways/aki-crrt.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "腎臟", "grpEn": "Kidney", "cnt": "2 項", "s": ["腎臟"], "c": ["急性腎損傷", "透析時機", "少尿", "衰竭"], "a": ["判時機", "定嚴重度", "查劑量", "找原因", "要不要洗腎"], "impl": ""},
    {"k": "crrt", "name": "CRRT 連續性腎臟替代療法", "en": "Continuous Renal Replacement Therapy", "desc": "五個分頁，接在「該不該洗」之後講「怎麼開」。模式把 CVVH／CVVHD／CVVHDF／SCUF 的差別收斂成兩個問題（溶質靠什麼過去、液體從哪裡進）；處方分頁內建計算器，輸入體重、血流、透析液與前後稀釋即算出前稀釋校正後的實送劑量與濾過分率，偏離 20-25 mL/kg/h 或 FF 大於 25% 時示警；抗凝並列 KDIGO 2012 與 2026 草案（檸檬酸由 2B 升為 1B），附檸檬酸蓄積的判定；溶液與禁忌用台大實際品項（CVVH A／B 液、Prismasol B0、Regiocit）", "kind": "pathway", "href": "pathways/crrt.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "腎臟", "grpEn": "Kidney", "cnt": "2 項", "s": ["腎臟", "電解質", "體液與滲透壓"], "c": ["急性腎損傷", "透析時機", "腎功能", "電解質異常", "低血磷"], "a": ["怎麼調", "查劑量", "要不要洗腎", "判時機", "查腎肝調整"], "impl": ""},
    {"k": "ich-path", "name": "腦出血與 SAH Spontaneous ICH & Aneurysmal SAH Pathway", "en": "Spontaneous ICH & Aneurysmal SAH", "desc": "兩個分頁。自發性 ICH 依 AHA/ASA 2022：抗栓逆轉是唯一 Class 1，降到 <130 mmHg 與不需開刀者輸血小板都是 Class 3 有害；cerebellar hemorrhage ≥15 mL 或壓迫 brainstem 須立即清除（Class 1），brainstem hemorrhage 指引無建議。Aneurysmal SAH 依 AHA/ASA 2023：24 小時內處理動脈瘤與 enteral nimodipine（唯一 Class 1／LOE A 藥物）；tranexamic acid、statin、magnesium 皆為 Class 3，血壓刻意沒有數字目標", "kind": "pathway", "href": "pathways/ich.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "神經", "grpEn": "Neurology", "cnt": "4 項", "s": ["腦", "腦血管"], "c": ["腦出血", "蜘蛛膜下腔出血", "出血", "意識障礙"], "a": ["要不要開刀", "判時機", "查劑量", "定嚴重度", "找原因", "要不要輸血"], "impl": ""},
    {"k": "tbi-path", "name": "創傷性腦損傷 Traumatic Brain Injury Pathway", "en": "Traumatic Brain Injury", "desc": "依 Bullock 2006 手術門檻與 BTF 第 4 版／SIBICC 階梯：EDH >30 cm³、SDH 厚度 >10 mm 或 shift >5 mm、contusion >50 cm³、posterior fossa 有 mass effect 逐病灶的開刀數字；ICP >22 才治療、CPP 60–70，decompressive craniectomy 的時機決定成敗（DECRA 早期更差 vs RESCUEicp 晚期換命）；corticosteroid 屬 Level I 禁忌，TXA 只在 mild-to-moderate 有益", "kind": "pathway", "href": "pathways/tbi.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "神經", "grpEn": "Neurology", "cnt": "4 項", "s": ["腦", "創傷"], "c": ["創傷性腦損傷", "意識障礙", "創傷"], "a": ["定嚴重度", "要不要開刀", "判時機", "找原因", "降腦壓"], "impl": ""},
    {"k": "stroke", "name": "缺血性中風", "en": "Acute Ischemic Stroke", "desc": "依 2026 AHA/ASA 分流、靜脈溶栓（alteplase／tenecteplase 各有劑量上限）、動脈取栓適應症與時間窗，以及血壓、抗栓與併發症之早期處置", "kind": "tool", "href": "tools/stroke.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "神經", "grpEn": "Neurology", "cnt": "4 項", "s": ["腦血管"], "c": ["缺血性中風"], "a": ["判時機", "查劑量", "定嚴重度"], "impl": ""},
    {"k": "seizure-path", "name": "癲癇重積 Seizures & Status Epilepticus Pathway", "en": "Seizures & Status Epilepticus", "desc": "五個分頁。診斷依 NICE NG217 與 AAN／AES 2015（EEG 不可用來排除癲癇、首次發作 2 週內轉診）；分類用 ILAE 2025 新版（取代 2017，四大類 21 種發作型）與 ILAE 2015 重積四軸；重積含輸入體重即時換算一線／二線／麻醉輸注劑量與 cEEG、NCSE、超難治處置；另有藥物表與子癲症、酒精戒斷、心跳停止後（TELSTAR：抑制週期性腦波不改善預後）、腦傷後預防用藥等特殊情境", "kind": "pathway", "href": "pathways/seizure.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "神經", "grpEn": "Neurology", "cnt": "4 項", "s": ["腦", "意識"], "c": ["癲癇重積", "意識障礙"], "a": ["查劑量", "判時機", "找原因"], "impl": ""},
    {"k": "ali-path", "name": "肢體缺血 Acute Limb Ischaemia Pathway", "en": "Acute Limb Ischaemia", "desc": "依 ESVS 2020：Rutherford 分級（I/IIa/IIb/III）決定速度——所有可挽救肢體先立即全身 heparin；IIa 影像後考慮導管溶栓、IIb 立即再灌流（手術取栓為主，溶栓太慢）、III 一次性截肢（勉強再灌流有害）。含 6P、Doppler 判準與腔室症候群", "kind": "pathway", "href": "pathways/acute-limb-ischemia.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "血管", "grpEn": "Vascular", "cnt": "2 項", "s": ["周邊動脈"], "c": ["肢體缺血"], "a": ["定嚴重度", "要不要開刀", "判時機", "選術式", "找原因"], "impl": ""},
    {"k": "aas-path", "name": "主動脈症候群 Acute Aortic Syndrome Pathway", "en": "Acute Aortic Syndrome", "desc": "依 2022 ACC/AHA：ADD-RS 勾選計分（0–3）分流影像，anti-impulse 順序不可顛倒——先 IV β 阻斷劑到 HR 60–80，血壓仍高才加血管擴張劑到 SBP <120；type A 外科急症、uncomplicated B 內科、complicated B 用 TEVAR", "kind": "pathway", "href": "pathways/acute-aortic-syndrome.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "血管", "grpEn": "Vascular", "cnt": "2 項", "s": ["主動脈"], "c": ["主動脈剝離"], "a": ["要不要開刀", "判時機", "定嚴重度", "選術式", "找原因", "要不要照CT"], "impl": ""},
    {"k": "endo-path", "name": "內分泌危象 Thyroid Storm & Adrenal Crisis Pathway", "en": "Thyroid Storm & Adrenal Crisis", "desc": "兩者都先治療後確診：甲狀腺風暴以 Burch-Wartofsky 分流並列出治療五面向（碘須在 thionamide 之後給）；腎上腺危機依 SfE 2016——立即 hydrocortisone 100 mg、第一小時 1000 mL 生理食鹽水，含礦皮質素時機與生病日規則", "kind": "pathway", "href": "pathways/adrenal-crisis.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "內分泌代謝", "grpEn": "Endocrine & Metabolic", "cnt": "5 項", "s": ["甲狀腺", "腎上腺"], "c": ["甲狀腺風暴", "腎上腺危機"], "a": ["查劑量", "定嚴重度", "判時機", "找原因"], "impl": ""},
    {"k": "lyte-path", "name": "電解質急症 Hyperkalaemia & Hyponatraemia Pathway", "en": "Hyperkalaemia & Hyponatraemia", "desc": "高鉀依 UKKA 2023 五步驟（鈣鹽是 30 mL 10% 葡萄糖酸鈣不是 10 mL；calcium resonium 已不再常規使用）；低鈉依 SfE 2022（150 mL 3% 間歇推注、明確建議不要用 Adrogué-Madias 公式），並內建矯正速率追蹤——算出本 24 小時窗的上限與剩餘額度。含反彈性高鉀與過度矯正（回降、desmopressin）的處理", "kind": "pathway", "href": "pathways/electrolyte-emergency.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "內分泌代謝", "grpEn": "Endocrine & Metabolic", "cnt": "5 項", "s": ["電解質", "腎臟"], "c": ["高血鉀", "低血鈉", "電解質異常"], "a": ["查劑量", "定嚴重度", "判時機", "找原因"], "impl": ""},
    {"k": "lyte-all", "name": "電解質失衡", "en": "Na · K · Cl · Ca · Mg · P", "desc": "六個分頁、十二種失衡，每一種都給分級到鑑別路徑到處置三段。參考區間直接取自台大檢驗醫學部，並把台大單位混用的陷阱框出來（鈣鎂是 mmol/L、磷卻是 mg/dL）。高血鉀逐條標 UKKA 2023 的 GRADE，並誠實指出指引首選的兩種鉀結合劑台大都沒有、台大唯一有的樹脂正是指引說不要常規用的那種；高血鈣依 Endocrine Society 2023（denosumab 條件式優於雙磷酸鹽）。急救演算法不重複，指回致命電解質急症頁", "kind": "pathway", "href": "pathways/electrolyte.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "內分泌代謝", "grpEn": "Endocrine & Metabolic", "cnt": "5 項", "s": ["電解質", "體液與滲透壓", "腎臟"], "c": ["電解質異常", "高血鉀", "低血鉀", "低血鈉", "高血鈉", "高血鈣", "低血鈣", "低血鎂", "低血磷", "高血磷", "再餵食症候群"], "a": ["找原因", "定嚴重度", "查劑量", "怎麼調", "怎麼處理"], "impl": ""},
    {"k": "nutrition", "name": "輸液營養 IV Fluids & Nutrition Pathway", "en": "IV Fluids & Nutrition", "desc": "六個分頁。晶體輸液把 N/S、half saline、D5W、Dext-saline、L/R、Ringer's 與 Taita 一到五號放進同一張成分表，Taita 的數字取自食藥署仿單原表，並點出台大同時有兩支電解質不同的乳酸林格；靜脈營養液比較 Bfluid／Clinimix／Oliclinomel／Nutriflex／Smoflipid，用滲透壓 800 mOsm/L 決定周邊或中央；添加劑點名 Lyo-Povigent 含維生素 K1 會影響 warfarin、其 thiamine 不足以預防再餵食；計算器把 propofol 的脂肪一起算進 1.5 g/kg/d 額度，並在 GIR 超過 5 mg/kg/min 時示警；時機分頁依 ESPEN 2023，早期全量 EN 與 PN 都不可用（R8, Grade A），PN 在三到七天內開始", "kind": "pathway", "href": "pathways/nutrition.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "內分泌代謝", "grpEn": "Endocrine & Metabolic", "cnt": "5 項", "s": ["營養", "體液與滲透壓", "電解質", "一般藥物"], "c": ["輸液選擇", "靜脈營養", "營養不良", "再餵食症候群", "電解質異常", "低血磷", "低血鈉"], "a": ["查劑量", "怎麼調", "查禁忌", "判時機", "怎麼處理"], "impl": ""},
    {"k": "dka-path", "name": "高血糖危象 DKA & HHS Pathway", "en": "DKA & HHS", "desc": "依 ADA／EASD 2024 共識（2009 年以來首次更新）：血糖門檻降為 ≥200、酮體改用定量 β-羥丁酸、陰離子間隙不再是第一線判準；含依血鉀決定能否開始胰島素、平衡鹽優於生理食鹽水、以及酸中毒停滯時如何分辨高氯性酸中毒", "kind": "pathway", "href": "pathways/dka-hhs.html", "sec": "critical", "secTitle": "急重症處置", "secEn": "Emergency & Critical Care", "grp": "內分泌代謝", "grpEn": "Endocrine & Metabolic", "cnt": "5 項", "s": ["血糖"], "c": ["DKA", "HHS", "高血糖"], "a": ["查劑量", "定嚴重度", "判時機", "找原因"], "impl": ""},
    {"k": "abg", "name": "動脈血氣分析判讀", "en": "ABG interpretation · Acid–base", "desc": "輸入 pH／PaCO₂／HCO₃⁻ 即判出是哪一型（含急性／慢性呼吸性障礙與混合型），並以 Winter's 等六條代償公式抓出被蓋住的第二個障礙；再由白蛋白校正後的陰離子間隙與 delta gap 自動分流到 GOLDMARK（含滲透壓間隙）、尿液陰離子間隙／RTA 分型或尿液氯", "kind": "tool", "href": "tools/abg.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般計算", "grpEn": "General Calculations", "cnt": "5 項", "s": ["酸鹼", "肺與氣道"], "c": ["酸鹼失衡", "滲透壓間隙"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "body-metrics", "name": "體型與劑量體重", "en": "BMI · BSA · IBW · ABW", "desc": "一次算出 BMI（國民健康署體位分類＋WHO 亞洲切點）、BSA（Mosteller 與 Du Bois 並列）、IBW／ABW／LBW，並直接給出 6 mL/kg PBW 的潮氣容積與「實際體重是 IBW 的幾 %、該不該改用 ABW」的判斷", "kind": "tool", "href": "tools/body-metrics.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般計算", "grpEn": "General Calculations", "cnt": "5 項", "s": ["病人整體", "一般藥物"], "c": ["劑量體重"], "a": ["算分數", "查劑量"], "impl": ""},
    {"k": "dose-conversion", "name": "藥物劑量換算", "en": "Steroid · Opioid · Loop Diuretic", "desc": "三類藥物選「從哪一種換到哪一種」即出等效劑量。類固醇同時顯示礦皮質素活性與作用時間並不等效；鴉片類依 CDC 2022 MME 係數算出每日當量後，把「等效劑量」與「折減 25–50% 後的建議起始劑量」分成兩個數字（methadone／buprenorphine 刻意不提供換入）", "kind": "tool", "href": "tools/dose-conversion.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般計算", "grpEn": "General Calculations", "cnt": "5 項", "s": ["一般藥物", "鎮靜止痛"], "c": ["劑量換算"], "a": ["查劑量", "算分數"], "impl": "", "kw": "Med conversion"},
    {"k": "corrected-labs", "name": "校正鈉／校正鈣", "en": "Corrected Sodium & Calcium", "desc": "高血糖之校正鈉並列 Katz 1.6 與 Hillier 實測的 2.4（血糖 >400 另有提示）；校正鈣依台大的 mmol/L 報告單位計算並可切換 mg/dL，同時標明危重症與 CRRT 下應直接驗游離鈣的理由", "kind": "tool", "href": "tools/corrected-labs.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般計算", "grpEn": "General Calculations", "cnt": "5 項", "s": ["電解質"], "c": ["電解質異常", "低血鈉"], "a": ["算分數"], "impl": ""},
    {"k": "osmolality", "name": "血清滲透壓與滲透壓間隙", "en": "Osmolality & Osmolal Gap", "desc": "計算滲透壓、有效滲透壓（tonicity，不含尿素）與滲透壓間隙三者分開呈現；並列兩條常見公式讓你看到間隙隨公式而變，另附由間隙回推毒性酒精濃度。間隙正常不可用來排除毒性酒精中毒（Hoffman 1993 原始結論）", "kind": "tool", "href": "tools/osmolality.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般計算", "grpEn": "General Calculations", "cnt": "5 項", "s": ["體液與滲透壓", "酸鹼"], "c": ["滲透壓間隙", "低血鈉"], "a": ["算分數"], "impl": ""},
    {"k": "grace", "name": "GRACE", "en": "Global Registry of Acute Coronary Events", "desc": "以年齡、心跳、血壓、肌酸酐、Killip 分級等推估住院與 6 個月死亡風險；> 140 為高風險，NSTE-ACS 建議 24 小時內冠狀動脈攝影", "kind": "tool", "href": "tools/grace.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "急性冠心症", "grpEn": "Acute Coronary Syndrome", "cnt": "1 項", "s": ["冠狀動脈", "心臟"], "c": ["急性冠心症"], "a": ["算分數", "定嚴重度", "判時機"], "impl": ""},
    {"k": "wells-pe", "name": "Wells Score (PE)", "en": "Clinical Probability of PE", "desc": "七項準則推估肺栓塞臨床機率，同時顯示三分法與兩分法；決定該驗 D-dimer 還是直接做 CTPA", "kind": "tool", "href": "tools/wells-pe.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肺栓塞", "grpEn": "Pulmonary Embolism", "cnt": "4 項", "s": ["肺循環"], "c": ["肺栓塞"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "geneva", "name": "Revised Geneva", "en": "Revised & Simplified Geneva Score", "desc": "完整版與簡化版並列計算的肺栓塞臨床機率；全為客觀項目，不含「PE 是否為最可能診斷」的主觀判斷", "kind": "tool", "href": "tools/geneva.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肺栓塞", "grpEn": "Pulmonary Embolism", "cnt": "4 項", "s": ["肺循環"], "c": ["肺栓塞"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "perc", "name": "PERC Rule", "en": "PE Rule-out Criteria", "desc": "臨床機率已為低時，八項全陰即可不驗 D-dimer 直接排除 PE（漏診率 < 2%）；全有全無的門檻，任一項陽性即不成立", "kind": "tool", "href": "tools/perc.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肺栓塞", "grpEn": "Pulmonary Embolism", "cnt": "4 項", "s": ["肺循環"], "c": ["肺栓塞"], "a": ["算分數"], "impl": ""},
    {"k": "pesi", "name": "PESI／sPESI", "en": "PE Severity Index", "desc": "確診 PE 後的30 天死亡風險分層：原始 PESI（11 項 → Class I–V）與簡化 sPESI（6 項 → 二分）並列，同一組輸入自動換算；抓出可早期出院／門診治療的低危族群，並對接 2019 ESC 的中危分層", "kind": "tool", "href": "tools/pesi.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肺栓塞", "grpEn": "Pulmonary Embolism", "cnt": "4 項", "s": ["肺循環"], "c": ["肺栓塞"], "a": ["算分數", "定嚴重度"], "impl": "", "kw": "PESI sPESI"},
    {"k": "anticoag-reversal", "name": "抗凝／抗血小板逆轉", "en": "Antithrombotic Reversal", "desc": "依 ACC 2020 出血決策路徑選藥即出方案：VKA 的 4F-PCC 依 INR（25/35/50 U/kg）＋vitamin K、dabigatran 的 idarucizumab 5 g、FXa 抑制劑的 andexanet 高/低劑量（依劑量與最後服藥時間）；含肝素、抗血小板（PATCH）與溶栓相關出血", "kind": "tool", "href": "tools/anticoagulant-reversal.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "創傷 / 出血", "grpEn": "Trauma & Hemostasis", "cnt": "2 項", "s": ["凝血", "一般藥物"], "c": ["抗栓管理", "出血", "腦出血", "手術"], "a": ["查劑量", "判時機", "查禁忌", "算分數", "逆轉", "怎麼止血"], "impl": ""},
    {"k": "burns", "name": "燒燙傷補液", "en": "Burn Shock Resuscitation", "desc": "輸入體重與 %TBSA 即算 ABA 2024 起始 2 mL/kg/% 與 Parkland 對照的 24 小時量與前/後段速率（含受傷後已過時間修正）；附 rule of nines、尿量終點與 ABA 轉診條件", "kind": "tool", "href": "tools/burns.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "創傷 / 出血", "grpEn": "Trauma & Hemostasis", "cnt": "2 項", "s": ["燒燙傷", "創傷"], "c": ["燒燙傷", "創傷"], "a": ["算分數", "查劑量"], "impl": ""},
    {"k": "cci", "name": "Charlson 共病指數", "en": "Charlson Comorbidity Index (CCI)", "desc": "勾選共病項目計算指數，評估共病負荷與10年預估存活率，常用於研究校正與術前風險溝通。注意：與「綜合併發症指數 CCI」同縮寫但完全不同，後者評的是術後併發症負荷", "kind": "tool", "href": "tools/cci.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "共病評估", "grpEn": "Comorbidity", "cnt": "1 項", "s": ["病人整體"], "c": ["共病負荷"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "nihss", "name": "NIHSS", "en": "NIH Stroke Scale", "desc": "15 個項目、0–42 分，含 UN（截肢／插管）不計入總分的處理。標明語言項目權重 9 分而忽略與視野僅 4 分——右半球與後循環中風分數系統性偏低；治療決策看的是失能性缺損而非分數高低", "kind": "tool", "href": "tools/nihss.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "神經", "grpEn": "Neurology", "cnt": "2 項", "s": ["腦血管", "意識"], "c": ["缺血性中風"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "egfr", "name": "eGFR", "en": "2021 CKD-EPI cr / cr-cys", "desc": "與台大檢驗報告同一條公式（≥18 歲採 2021 CKD-EPI）；填入 cystatin C 即自動改用雙標記式並顯示兩式差距與該懷疑哪個標記受干擾。另附 Cockcroft-Gault 與「未經體表面積校正的 GFR」供藥物劑量調整", "kind": "tool", "href": "tools/egfr.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腎臟", "grpEn": "Kidney", "cnt": "3 項", "s": ["腎臟", "一般藥物"], "c": ["腎功能", "衰竭"], "a": ["算分數", "查腎肝調整", "怎麼調"], "impl": ""},
    {"k": "fena", "name": "FeNa／FeUN", "en": "Fractional Excretion of Na / Urea", "desc": "腎前性與 ATN 之鑑別。刻意並列兩篇結論相反的研究——Carvounis 2002 支持「用利尿劑就改看 FeUN」（89% 的腎前性＋利尿劑者 FeUN ≤35%），Pépin 2007 卻顯示其特異度僅 33%、明言不能替代；另列 FeNa 偽低／偽高的完整清單", "kind": "tool", "href": "tools/fena.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腎臟", "grpEn": "Kidney", "cnt": "3 項", "s": ["腎臟"], "c": ["急性腎損傷", "少尿", "衰竭"], "a": ["算分數"], "impl": "", "kw": "FeNa FeUN"},
    {"k": "water-deficit", "name": "高血鈉自由水缺乏", "en": "Free Water Deficit", "desc": "算出缺水量、Adrogué-Madias 每公升輸液的血鈉變化、本日允許降幅所需的輸液量與速率。並標明證據落差：Chauhan 2019 在重症成人未找到快速矯正造成腦水腫的病例，但兒童仍須嚴格限速；公式不含持續損失，必須量測補回", "kind": "tool", "href": "tools/water-deficit.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腎臟", "grpEn": "Kidney", "cnt": "3 項", "s": ["電解質", "體液與滲透壓"], "c": ["高血鈉", "電解質異常"], "a": ["算分數", "查劑量"], "impl": ""},
    {"k": "thyroid-storm", "name": "Burch-Wartofsky", "en": "BWPS for Thyroid Storm", "desc": "甲狀腺風暴的計分（≥45 高度提示、25–44 即將發生、<25 不太可能）；當代研究中 ≥45 敏感度 99% 但特異度僅 12%——是篩檢工具不是診斷準則。含誘發事件與心房顫動獨立計分的提醒", "kind": "tool", "href": "tools/thyroid-storm.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["甲狀腺"], "c": ["甲狀腺風暴"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "dka-hhs", "name": "DKA／HHS 診斷與嚴重度", "en": "Hyperglycemic Crisis Criteria", "desc": "依 2024 共識報告判定 DKA（D／K／A 三項）與 HHS（四項），自動計算有效與總滲透壓並給出建議照護層級；含血糖正常型 DKA 的辨識與「陰離子間隙不可作為緩解判準」的說明", "kind": "tool", "href": "tools/dka-hhs.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["血糖"], "c": ["DKA", "HHS", "高血糖"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "kdigo-aki", "name": "KDIGO AKI 分期", "en": "KDIGO AKI Staging", "desc": "肌酸酐與尿量各自判期後取較嚴重者；含 48 小時 ≥0.3 mg/dL 的絕對上升判準、開始 RRT 即列第 3 期，以及基準肌酸酐取法造成的誤差說明（KDIGO 2026 改版仍在草案階段，本頁依 2012 版）", "kind": "tool", "href": "tools/kdigo-aki.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["腎臟"], "c": ["急性腎損傷", "少尿", "衰竭"], "a": ["算分數", "定嚴重度", "查分期"], "impl": ""},
    {"k": "ards", "name": "ARDS 診斷與分級", "en": "ARDS New Global Definition", "desc": "依 2024 新全球定義判定是否成立 ARDS 與嚴重度：可用 SpO₂/FiO₂ 取代動脈血氣、納入未插管（HFNO ≥30 L/min）與資源受限判準，含氧流速估算 FiO₂ 與海拔校正；並列 Berlin 2012 對照", "kind": "tool", "href": "tools/ards.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["肺與氣道", "呼吸器"], "c": ["ARDS", "低血氧", "缺氧"], "a": ["算分數", "定嚴重度", "查分期"], "impl": ""},
    {"k": "rox", "name": "ROX Index", "en": "HFNC Outcome Index", "desc": "(SpO₂/FiO₂) ÷ 呼吸速率，用於及早辨識高流量鼻導管注定失敗的病人；失敗切點隨時點上升（2h <2.85／6h <3.47／12h <3.85），≥4.88 與較低插管風險相關", "kind": "tool", "href": "tools/rox.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["肺與氣道", "呼吸器"], "c": ["低血氧", "高流量氧氣", "呼吸衰竭", "衰竭", "缺氧"], "a": ["算分數", "判時機"], "impl": ""},
    {"k": "news2", "name": "NEWS2", "en": "National Early Warning Score 2", "desc": "七項生理參數的病情惡化預警分數；SSC 2026 指名 NEWS／NEWS2／MEWS／SIRS 作為敗血症篩檢工具優於 qSOFA。含 SpO₂ Scale 2（高碳酸血症呼吸衰竭專用）與各分數對應的監測頻率與升階層級", "kind": "tool", "href": "tools/news2.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["病人整體", "感染與敗血"], "c": ["病情惡化", "敗血症", "發燒", "呼吸急促", "感染"], "a": ["算分數", "定嚴重度", "判時機"], "impl": "news2"},
    {"k": "sofa", "name": "SOFA", "en": "Sequential Organ Failure Assessment", "desc": "六大器官系統評分；疑似感染病人SOFA上升≥2分，符合Sepsis-3敗血症定義", "kind": "tool", "href": "tools/sofa.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["病人整體", "感染與敗血"], "c": ["器官衰竭", "敗血症", "衰竭", "感染"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "apache", "name": "APACHE II", "en": "Acute Physiology & Chronic Health Eval.", "desc": "評估ICU入住24小時內疾病嚴重度，分數越高住院死亡風險越高", "kind": "tool", "href": "tools/apache.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["病人整體"], "c": ["重症死亡風險", "器官衰竭", "衰竭"], "a": ["算分數", "定嚴重度", "判預後"], "impl": ""},
    {"k": "vasopressor", "name": "Vasopressor Calc", "en": "Vasoactive-Inotropic Score", "desc": "計算多重升壓/強心藥物流速並加總VIS，數值越高代表循環支持需求越大", "kind": "tool", "href": "tools/vasopressor.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "重症 / 多器官功能", "grpEn": "Critical Care", "cnt": "9 項", "s": ["升壓與強心藥", "休克循環"], "c": ["休克", "心因性休克"], "a": ["查劑量", "算分數", "給升壓劑"], "impl": ""},
    // 第 6 輪 s 補「腹部」：NELA 的 desc 明寫「急診剖腹術後 30 天死亡率預測」，
    // 部位就是腹部。原本只掛病人整體／圍手術期，「我遇到腹部的手術，我要判預後」查不到東西。
    // （P-POSSUM 與 SORT 是全術式通用的風險模型，不是腹部專屬，故不比照補。）
    {"k": "nela", "name": "NELA PRS", "en": "NELA Parsimonious Risk Score", "desc": "急診剖腹術後 30 天死亡率預測，13 項術前變項。本頁為 2023 年 4 月起的新版 PRS，2018 年舊版已由 NELA 明令停用；含 5%／10% 高風險門檻與未經台灣族群校準之警示", "kind": "tool", "href": "tools/nela.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般手術風險", "grpEn": "Surgical Risk", "cnt": "4 項", "s": ["病人整體", "圍手術期", "腹部"], "c": ["手術死亡風險", "手術"], "a": ["算分數", "定嚴重度", "判預後"], "impl": ""},
    {"k": "possum", "name": "P-POSSUM", "en": "Portsmouth POSSUM", "desc": "預測手術術後 30 天死亡率，常用於手術品質稽核與族群風險校正", "kind": "tool", "href": "tools/p-possum.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般手術風險", "grpEn": "Surgical Risk", "cnt": "4 項", "s": ["病人整體", "圍手術期"], "c": ["手術死亡風險", "手術"], "a": ["算分數", "定嚴重度", "判預後"], "impl": ""},
    {"k": "sort", "name": "SORT", "en": "Surgical Outcome Risk Tool", "desc": "以 ASA、緊急度、手術別與嚴重度、癌症、年齡預估 30 天全因死亡率，用於術前風險溝通與稽核校正", "kind": "tool", "href": "tools/sort.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般手術風險", "grpEn": "Surgical Risk", "cnt": "4 項", "s": ["病人整體", "圍手術期"], "c": ["手術死亡風險", "手術"], "a": ["算分數", "定嚴重度", "判預後"], "impl": ""},
    {"k": "iah", "name": "WSACS IAH", "en": "IAH / ACS Grading", "desc": "輸入 IAP 與 MAP 判定 IAH 分級（Grade I–IV）、是否成立 ACS 與 APP；含 primary／secondary／recurrent 分類對減壓時機的影響、WSACS 完整風險因子清單，以及兒童專屬閾值（兒科小組未採納成人分級，故兒童模式不輸出 Grade）", "kind": "tool", "href": "tools/iah.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "一般手術風險", "grpEn": "Surgical Risk", "cnt": "4 項", "s": ["腹部", "腹膜"], "c": ["腹腔高壓"], "a": ["算分數", "定嚴重度", "查分期"], "impl": ""},
    {"k": "nutrition-risk", "name": "營養風險評估", "en": "NRS-2002 · GLIM · Refeeding Risk", "desc": "NRS-2002 篩檢（含最常被刪掉的疾病嚴重度原型描述）、GLIM 診斷與嚴重度分級（內建亞洲 BMI 切點）、再餵食風險。NICE 與 ASPEN 刻意分開計算不合併——兩者對「餵食前要不要先矯正低電解質」是相反的指令。外科依據為 ESPEN 2025 更新版（非 2017／2021），術前靜脈營養療程已改為 10–14 天", "kind": "tool", "href": "tools/nutrition-risk.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "圍手術期 / 併發症", "grpEn": "Perioperative & Complications", "cnt": "5 項", "s": ["營養", "圍手術期"], "c": ["營養不良", "再餵食症候群"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "vte-risk", "name": "VTE 風險評估", "en": "Caprini · Padua · IMPROVE Bleeding", "desc": "外科用 Caprini 2005（AT9 收錄版）決定預防強度、內科用 Padua、以 IMPROVE 評出血風險；含腹腔／骨盆腔癌症手術之延長預防。刻意並列兩套互不相容的 Caprini 分級——同為 3–4 分，AT9 稱「中度約 3%」而 Bahl 稱「高度 0.97%」；另標示 AT9 的 ≥5 分給藥門檻與 Pannucci 統合分析「≥7 分才有顯著效益」之落差", "kind": "tool", "href": "tools/vte-risk.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "圍手術期 / 併發症", "grpEn": "Perioperative & Complications", "cnt": "5 項", "s": ["靜脈血栓", "圍手術期", "凝血"], "c": ["VTE 風險", "出血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "cha2ds2-vasc", "name": "CHA₂DS₂-VASc", "en": "Stroke Risk in Atrial Fibrillation", "desc": "同時算出 CHA₂DS₂-VASc（滿分 9，含性別）與 ESC 2024 改用的 CHA₂DS₂-VA（滿分 8），並分列 ESC 2024／ACC AHA 2023／APHRS 2021 三套門檻——同一位女病人兩套差一分，且 APHRS（台灣主導）在低分時比歐美更早介入。刻意不印每分年中風率表（兩份現行指引皆已不印，跨世代差距達 60 倍）", "kind": "tool", "href": "tools/cha2ds2-vasc.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "圍手術期 / 併發症", "grpEn": "Perioperative & Complications", "cnt": "5 項", "s": ["心房顫動", "凝血"], "c": ["中風風險", "抗栓管理", "手術"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "has-bled", "name": "HAS-BLED", "en": "Bleeding Risk in Atrial Fibrillation", "desc": "逐項計分並單獨列出可矯正的出血因子與矯正後可降到幾分。標明現行指引立場：ESC 2024 已不再納入任何結構化出血風險分數、不建議僅憑出血因子停用抗凝；≥3 分的意思是「矯正因子＋提早追蹤」，不是停藥。含原文的 SI 單位換算（Cr >200 µmol/L ＝ >2.26 mg/dL）", "kind": "tool", "href": "tools/has-bled.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "圍手術期 / 併發症", "grpEn": "Perioperative & Complications", "cnt": "5 項", "s": ["心房顫動", "凝血"], "c": ["出血", "抗栓管理", "手術"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "cci-clavien", "name": "CCI 綜合併發症指數", "en": "Comprehensive Complication Index", "desc": "依 Clavien-Dindo 分級輸入各級併發症件數，合併為 0–100 連續量尺。彌補「只取最高級」遺失累積負荷的問題。與 Charlson 共病指數同縮寫但完全不同", "kind": "tool", "href": "tools/cci-clavien.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "圍手術期 / 併發症", "grpEn": "Perioperative & Complications", "cnt": "5 項", "s": ["圍手術期", "病人整體"], "c": ["術後併發症", "手術"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "aas", "name": "AAS", "en": "Adult Appendicitis Score", "desc": "以性別年齡調整之成人分數（0–24），AUC 0.882 優於 Alvarado 與 AIR；≥16 高度可能、≥18 原文認為可直接手術", "kind": "tool", "href": "tools/aas.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "闌尾炎", "grpEn": "Appendicitis", "cnt": "4 項", "s": ["闌尾"], "c": ["闌尾炎"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "alvarado", "name": "Alvarado", "en": "Alvarado Score", "desc": "評估急性闌尾炎機率，≥7分建議外科會診，敏感度高但特異度較AIR score低", "kind": "tool", "href": "tools/alvarado.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "闌尾炎", "grpEn": "Appendicitis", "cnt": "4 項", "s": ["闌尾"], "c": ["闌尾炎"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "air", "name": "AIR Score", "en": "Appendicitis Inflammatory Response", "desc": "發炎反應導向之闌尾炎評分，特異度優於Alvarado，9–12分高度懷疑闌尾炎", "kind": "tool", "href": "tools/air.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "闌尾炎", "grpEn": "Appendicitis", "cnt": "4 項", "s": ["闌尾"], "c": ["闌尾炎"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "parc", "name": "pARC", "en": "Pediatric Appendicitis Risk Calculator", "desc": "以連續機率量表評估5–18歲兒童闌尾炎風險，較PAS更能區分高低風險族群", "kind": "tool", "href": "tools/parc.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "闌尾炎", "grpEn": "Appendicitis", "cnt": "4 項", "s": ["闌尾", "兒科"], "c": ["闌尾炎", "兒童病人"], "a": ["算分數", "定嚴重度"], "impl": ""},
    // 第 7 輪 s 補「腹膜」：使用者原話「腹膜的發炎也要顯示 PPU」。消化性潰瘍穿孔就是
    // 續發性腹膜炎最常見的來源——gi-perforation.html 寫「適用所有續發性腹膜炎」，且同一個
    // 疾病的流程頁 gi-perf-path 與腹膜炎計分 mpi 本來就都掛著「腹膜」，這裡只是補上一致的標註。
    {"k": "pulp", "name": "PULP Score", "en": "Peptic Ulcer Perforation Score", "desc": "預測消化性潰瘍穿孔30天死亡率，表現優於傳統Boey score與ASA分級", "kind": "tool", "href": "tools/pulp.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "消化性潰瘍穿孔", "grpEn": "Peptic Ulcer Perforation", "cnt": "1 項", "s": ["胃十二指腸", "腹膜"], "c": ["消化性潰瘍穿孔", "消化道穿孔"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "candida-score", "name": "Candida Score", "en": "Candida Score & Colonization Index", "desc": "非嗜中性球低下危重病人之侵襲性念珠菌感染風險。經驗證的用途是「排除」而非啟動治療；含 2006 迴歸係數版與 2009 整數版的差異、以及 Pittet 移生指數", "kind": "tool", "href": "tools/candida-score.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腹膜炎", "grpEn": "Peritonitis", "cnt": "3 項", "s": ["感染與敗血", "抗黴菌藥"], "c": ["侵襲性念珠菌感染", "免疫低下", "感染"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "mpi", "name": "MPI", "en": "Mannheim Peritonitis Index", "desc": "評估腹膜炎嚴重度並預測死亡率，分數越高（0–47分）預後越差", "kind": "tool", "href": "tools/mpi.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腹膜炎", "grpEn": "Peritonitis", "cnt": "3 項", "s": ["腹膜"], "c": ["腹膜炎", "腹腔感染", "感染"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "wses", "name": "WSES Sepsis Score", "en": "WSES Sepsis Severity Score", "desc": "評估複雜性腹內感染之敗血症嚴重度，用於預測死亡率與器官衰竭風險", "kind": "tool", "href": "tools/wses.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腹膜炎", "grpEn": "Peritonitis", "cnt": "3 項", "s": ["腹膜", "感染與敗血"], "c": ["腹膜炎", "腹腔感染", "敗血症", "感染"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "gbs", "name": "Glasgow-Blatchford", "en": "Glasgow-Blatchford Score", "desc": "上消化道出血內視鏡前風險分層，預測是否需住院介入或死亡；≤1 分可考慮門診處理，各分數中鑑別力最佳（AUROC 0.86）", "kind": "tool", "href": "tools/gbs.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "消化道出血", "grpEn": "GI Bleeding", "cnt": "4 項", "s": ["胃十二指腸"], "c": ["消化道出血", "上消化道出血", "出血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "rockall", "name": "Rockall Score", "en": "Rockall Score", "desc": "上消化道出血死亡與再出血風險分層，分內視鏡前（0–7）與完整（0–11）兩段；休克分級由血壓心跳自動判定，避免常見的抄錯", "kind": "tool", "href": "tools/rockall.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "消化道出血", "grpEn": "GI Bleeding", "cnt": "4 項", "s": ["胃十二指腸"], "c": ["消化道出血", "上消化道出血", "出血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "aims65", "name": "AIMS65", "en": "AIMS65 Score", "desc": "上消化道出血住院死亡率預測（白蛋白、INR、意識、收縮壓、年齡各 1 分）；預測死亡優於 GBS，≥2 分為高風險", "kind": "tool", "href": "tools/aims65.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "消化道出血", "grpEn": "GI Bleeding", "cnt": "4 項", "s": ["胃十二指腸"], "c": ["消化道出血", "上消化道出血", "出血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "oakland", "name": "Oakland Score", "en": "Oakland Score", "desc": "下消化道出血安全出院評估（0–35 分，越低越安全）；≤8 分約 95% 機率可安全出院，血紅素權重最重", "kind": "tool", "href": "tools/oakland.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "消化道出血", "grpEn": "GI Bleeding", "cnt": "4 項", "s": ["大腸"], "c": ["消化道出血", "下消化道出血", "出血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "wassmer", "name": "Wassmer Score", "en": "Clinical Severity Score for SBO", "desc": "預測黏連性小腸阻塞是否需手術切除腸段，≥4分列為高風險", "kind": "tool", "href": "tools/wassmer.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腸阻塞", "grpEn": "Bowel Obstruction", "cnt": "3 項", "s": ["小腸"], "c": ["腸阻塞", "腸絞窄", "阻塞"], "a": ["算分數", "要不要開刀"], "impl": ""},
    {"k": "angers", "name": "Angers CT Score", "en": "Angers CT Score", "desc": "依CT影像特徵預測黏連性小腸阻塞保守治療失敗風險，≥5分為高風險", "kind": "tool", "href": "tools/angers.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腸阻塞", "grpEn": "Bowel Obstruction", "cnt": "3 項", "s": ["小腸"], "c": ["腸阻塞", "腸絞窄", "阻塞"], "a": ["算分數", "要不要開刀"], "impl": ""},
    {"k": "millet", "name": "Millet Score", "en": "Combined CT Findings for Strangulation", "desc": "結合3項CT徵象評估小腸阻塞絞窄風險，三項皆無時可高信心排除絞窄", "kind": "tool", "href": "tools/millet.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腸阻塞", "grpEn": "Bowel Obstruction", "cnt": "3 項", "s": ["小腸"], "c": ["腸阻塞", "腸絞窄", "阻塞"], "a": ["算分數", "要不要開刀"], "impl": ""},
    {"k": "radial", "name": "RADIAL Score", "en": "RADIAL Score for AMI Mortality", "desc": "預測急性腸繫膜缺血住院死亡率，分數越高（0–13分）死亡率越高", "kind": "tool", "href": "tools/radial.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腸繫膜缺血", "grpEn": "Mesenteric Ischemia", "cnt": "2 項", // 小腸：AMI 就是小腸缺血——pathways/gi-ischemia.html 標題即「Acute mesenteric
     // ischaemia — 小腸為主」，該流程本身也已掛「小腸」。使用者回報「小腸的缺血」查不到這兩支。
     "s": ["腸繫膜血管", "小腸"], "c": ["腸缺血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "amiscore", "name": "AMI Diagnostic Score", "en": "Novel Scoring System for AMI Diagnosis", "desc": "以常規血液檢驗（WBC、RDW、MPV、D-dimer）輔助急診鑑別急性腸繫膜缺血", "kind": "tool", "href": "tools/ami.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "腸繫膜缺血", "grpEn": "Mesenteric Ischemia", "cnt": "2 項", // 小腸：AMI 就是小腸缺血——pathways/gi-ischemia.html 標題即「Acute mesenteric
     // ischaemia — 小腸為主」，該流程本身也已掛「小腸」。使用者回報「小腸的缺血」查不到這兩支。
     "s": ["腸繫膜血管", "小腸"], "c": ["腸缺血"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "fib4", "name": "FIB-4", "en": "Fibrosis-4 Index", "desc": "進行性肝纖維化的非侵入性初篩。並列兩套切點——脂肪肝（MASLD）用 1.30／2.67、原始 HIV/HCV 用 1.45／3.25，依病因自動選讀；≥65 歲自動改用 2.0 低風險切點，<35 歲標示敏感度不足。中間帶必須做彈性造影或 ELF，不可停在這一步", "kind": "tool", "href": "tools/fib4.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肝臟", "grpEn": "Hepatology", "cnt": "4 項", "s": ["肝臟"], "c": ["肝纖維化"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "acute-liver-failure", "name": "急性肝衰竭", "en": "Acute Liver Failure", "desc": "King's College Criteria 移植判準（acetaminophen 與非 acetaminophen 分軌，自動判陽性/未達）；KCC 陰性不排除移植需求。含 NAC 適應症、肝性腦病與顱內壓管理、病因專屬治療（O'Grady 1989／ACG 2023）", "kind": "tool", "href": "tools/acute-liver-failure.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肝臟", "grpEn": "Hepatology", "cnt": "4 項", "s": ["肝臟"], "c": ["急性肝衰竭", "肝移植排序", "衰竭"], "a": ["定嚴重度", "判時機", "算分數", "判預後"], "impl": ""},
    {"k": "childpugh", "name": "Child-Pugh", "en": "Child-Pugh Score", "desc": "評估肝硬化嚴重度分級A/B/C，C級病人手術風險顯著升高", "kind": "tool", "href": "tools/child-pugh.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肝臟", "grpEn": "Hepatology", "cnt": "4 項", "s": ["肝臟"], "c": ["肝硬化", "衰竭"], "a": ["算分數", "定嚴重度", "查腎肝調整", "怎麼調", "判預後"], "impl": ""},
    {"k": "meld", "name": "MELD 3.0", "en": "Model for End-Stage Liver Disease 3.0", "desc": "計算終末期肝病死亡風險，用於肝移植等候名單優先順序排序", "kind": "tool", "href": "tools/meld.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "肝臟", "grpEn": "Hepatology", "cnt": "4 項", "s": ["肝臟"], "c": ["肝硬化", "肝移植排序", "衰竭"], "a": ["算分數", "定嚴重度", "判預後"], "impl": ""},
    {"k": "marshall", "name": "Modified Marshall Score", "en": "Organ Failure in Acute Pancreatitis", "desc": "Revised Atlanta 2012 定義器官衰竭之評分：呼吸（PaO₂/FiO₂）、腎臟（Cr）、心血管（收縮壓）任一項 ≥2 分即為器官衰竭；持續 >48 小時為重度", "kind": "tool", "href": "tools/marshall.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "胰臟炎", "grpEn": "Pancreatitis", "cnt": "1 項", "s": ["胰臟"], "c": ["胰臟炎", "器官衰竭", "衰竭"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "lrinec", "name": "LRINEC", "en": "Laboratory Risk Indicator for Necrotizing Fasciitis", "desc": "以 CRP／WBC／Hb／Na／Cr／Glucose 六項常規檢驗（0–13 分）提高壞死性感染的警覺；敏感度僅 68%，不可用於排除診斷", "kind": "tool", "href": "tools/lrinec.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "壞死性軟組織感染", "grpEn": "Necrotizing Soft Tissue Infection", "cnt": "2 項", "s": ["軟組織"], "c": ["壞死性軟組織感染", "皮膚軟組織感染", "感染"], "a": ["算分數", "定嚴重度"], "impl": ""},
    {"k": "fgsi", "name": "FGSI / UFGSI", "en": "Fournier's Gangrene Severity Index · Uludağ", "desc": "Fournier's gangrene 預後分層：九項生理參數加總（FGSI），再加侵犯範圍與年齡（UFGSI）；用於加護病房收治判斷，非手術判準", "kind": "tool", "href": "tools/fgsi.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "壞死性軟組織感染", "grpEn": "Necrotizing Soft Tissue Infection", "cnt": "2 項", "s": ["會陰", "軟組織"], "c": ["壞死性軟組織感染", "感染"], "a": ["算分數", "定嚴重度", "要不要轉ICU"], "impl": ""},
    // 第 6 輪 s 補八個感染部位（腹膜／腹部／膽道／軟組織／肺與氣道／泌尿系統／心臟／腦）：
    // 本頁的 c 陣列早就列著腹腔感染、肺炎、泌尿道感染、皮膚軟組織感染、心內膜炎、
    // 中樞神經感染，部位面向卻只有「抗生素／病原菌／感染與敗血／骨與關節」，
    // 於是「我遇到腹膜的感染，我要給抗生素」只出得來 abx-mode-empiric 一件。
    // 這裡的部位清單逐字比照 abx-mode-empiric（同一份抗生素指引的兩個入口），不新增任何臨床內容。
    {"k": "hub-antibiotics", "name": "藥物查詢", "en": "Drug Lookup", "desc": "抗生素指引、菌譜資料庫、手術預防、創傷用藥、注射轉口服與輸注配伍", "kind": "mode", "href": "tools/antibiotics.html#mode=lookup", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素", "病原菌", "感染與敗血", "抗黴菌藥", "抗病毒藥", "骨與關節", "腹膜", "腹部", "膽道", "軟組織", "肺與氣道", "泌尿系統", "心臟", "腦"], "c": ["抗生素選擇", "MRSA", "綠膿桿菌", "ESBL", "厭氧菌", "腸球菌", "菌血症", "肺炎", "泌尿道感染", "皮膚軟組織感染", "心內膜炎", "骨關節感染", "中樞神經感染", "導管相關感染", "腹腔感染", "手術預防性抗生素", "開放性骨折", "破傷風", "抗結核", "抗病毒治療", "侵襲性念珠菌感染", "免疫低下", "懷孕用藥", "藥物禁忌", "敗血症", "手術", "感染", "金黃色葡萄球菌", "肺炎鏈球菌", "李斯特菌", "鮑氏不動桿菌", "嗜麥芽窄食單胞菌", "A 群鏈球菌", "B 群鏈球菌", "AmpC 型", "創傷弧菌", "卡他莫拉菌", "困難梭菌", "多殺巴斯德氏菌", "大腸桿菌 / 克雷伯氏菌", "少動鞘胺醇單胞菌", "抗碳青黴烯腸道菌", "新型隱球菌", "曲狀桿菌", "毛黴菌", "洋蔥伯克霍爾德氏菌", "流感嗜血桿菌", "淋病雙球菌", "產吲哚金黃桿菌", "產氣單胞菌", "腦膜炎雙球菌", "草綠色鏈球菌", "表皮／凝固酶陰性葡萄球菌", "諾卡氏菌", "變形桿菌／摩根氏菌／普羅威登斯菌", "退伍軍人桿菌", "非傷寒沙門氏菌", "類鼻疽伯克霍爾德氏菌", "麴菌", "黴漿菌 / 披衣菌", "Aspergillus", "Mucorales", "glabrata/krusei", "Histoplasma", "Blastomyces", "Coccidioides", "Fusarium", "HIV", "HBV", "HCV", "CMV", "HSV/VZV", "Influenza", "SARS-CoV-2", "RSV", "瘧原蟲", "原蟲", "線蟲", "絛蟲", "吸蟲", "外寄生蟲", "抗黴菌治療", "抗寄生蟲治療", "抗麻風", "非典型", "局部黴菌感染"], "a": ["查劑量", "查腎肝調整", "查覆蓋菌譜", "查禁忌", "怎麼調", "給抗生素"], "kw": "抗生素 抗微生物 經驗性用藥 菌譜 感受性 antibiogram 敗血症 菌血症 IAI UTI 肺炎 SSTI 心內膜炎 骨關節 CNS 術後預防 IDSA SIS AHA β-lactamase Ambler 抗黴菌 手術預防 預防性抗生素 創傷 外傷 開放性骨折 破傷風 抗病毒 抗寄生蟲 麻風 念珠菌 麴菌 毛黴菌", "impl": "abx"},
    {"k": "hub-drugdb", "name": "藥物資料庫", "en": "Drug Database", "desc": "台大醫院藥劑部處方集 · 一商品名一張藥卡", "kind": "mega", "href": "tools/drug-database.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "直接指向頁面的入口", "grpEn": "Direct Hubs", "cnt": "3 項", "s": ["一般藥物"], "c": ["處方集", "藥物禁忌", "懷孕用藥"], "a": ["查劑量", "查腎肝調整", "查禁忌", "怎麼調"], "kw": "藥物 藥品 藥卡 處方集 formulary 台大藥劑部 學名 商品名 中文品名 機轉 藥理分類 劑量 腎功能 肝功能 透析 CVVH 注射給藥指引 懷孕分級 健保價 自費價 藥價", "impl": ""},
    // kw 除了正式名稱，刻意收了病房口語（撞藥／會不會撞／可不可以一起吃）與機轉字
    // （CYP3A4／P-gp／QT／血清素症候群）——「說整句」是打字查的，使用者不會先想到
    //「交互作用」四個字。severity 三級的英文也收，因為藥師交班會直接講 major。
    {"k": "hub-ddi", "name": "交互作用查核", "en": "Drug Interactions", "desc": "把病人的藥一個一個加進來，列出所有兩兩配對的交互作用、機轉與處置建議，重大的排最前面 · DDInter 2.0", "kind": "mega", "href": "tools/ddi.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "直接指向頁面的入口", "grpEn": "Direct Hubs", "cnt": "3 項", "s": ["一般藥物"], "c": ["交互作用", "藥物禁忌", "處方集"], "a": ["查交互作用", "查禁忌", "怎麼處理"], "kw": "DDI ddi drug-drug interaction drug-drug interactions drug drug interaction drug interaction interactions drug-interaction 交互作用 藥物交互作用 藥品交互作用 藥物相互作用 相互作用 併用 合併用藥 一起吃 一起給 同時使用 撞藥 對撞 會不會撞 撞不撞 可不可以一起吃 能不能併用 多重用藥 polypharmacy DDInter major moderate minor 重大 中度 輕度 機轉 處置 management mechanism CYP CYP450 CYP3A4 CYP2C9 CYP2C19 P-gp P-glycoprotein QT QT延長 血清素症候群 serotonin syndrome 橫紋肌溶解 rhabdomyolysis INR", "impl": ""},
    {"k": "cancer-lung", "name": "肺癌", "en": "Lung Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=lung", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "其他實體腫瘤", "grpEn": "Other Solid Tumors", "cnt": "4 項", "s": ["肺與氣道"], "c": ["肺癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-esoph", "name": "食道癌", "en": "Esophageal Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=esoph", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["食道"], "c": ["食道癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-gastric", "name": "胃癌", "en": "Gastric Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=gastric", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["胃十二指腸"], "c": ["胃癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-panc", "name": "胰臟癌", "en": "Ductal Adenocarcinoma & IPMN / MCN", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=panc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["胰臟"], "c": ["胰臟癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-gist", "name": "胃腸道基質瘤", "en": "Gastrointestinal Stromal Tumor", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=gist", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["胃十二指腸", "小腸", "大腸"], "c": ["胃腸道基質瘤", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-colorectal", "name": "大腸直腸癌", "en": "Colorectal Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=colorectal", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["大腸"], "c": ["大腸直腸癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-anal", "name": "肛門癌", "en": "Anal Cancer (Squamous)", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=anal", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["會陰"], "c": ["肛門癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-appendix", "name": "闌尾癌", "en": "Appendiceal Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=appendix", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["闌尾"], "c": ["闌尾癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-hcc", "name": "肝細胞癌", "en": "Hepatocellular Carcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=hcc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["肝臟"], "c": ["肝細胞癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-cca", "name": "膽管癌", "en": "Cholangiocarcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=cca", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["膽道"], "c": ["膽管癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-net", "name": "神經內分泌瘤", "en": "Neuroendocrine Tumor", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=net", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "消化道癌", "grpEn": "GI Cancers", "cnt": "10 項", "s": ["胰臟", "小腸", "胃十二指腸"], "c": ["神經內分泌瘤", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-breast", "name": "乳癌", "en": "Breast Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=breast", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "其他實體腫瘤", "grpEn": "Other Solid Tumors", "cnt": "4 項", "s": ["乳房"], "c": ["乳癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-thyroid", "name": "甲狀腺癌", "en": "Thyroid Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=thyroid", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "其他實體腫瘤", "grpEn": "Other Solid Tumors", "cnt": "4 項", "s": ["甲狀腺"], "c": ["甲狀腺癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    // 第 7 輪 s 補「腹部」：js/sts-pathway.js 內含「原發性腹膜後肉瘤（RPS）之獨立流程」，
    // 腹膜後屬腹部。刻意不標「腹膜」——腹膜後腔與腹膜腔是兩個不同的腔室，標了會誤導。
    {"k": "cancer-sts", "name": "軟組織肉瘤", "en": "Soft Tissue Sarcoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=sts", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "其他實體腫瘤", "grpEn": "Other Solid Tumors", "cnt": "4 項", "s": ["軟組織", "腹部"], "c": ["軟組織肉瘤", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-aml", "name": "急性骨髓性白血病", "en": "Leukemia (Acute Myeloid Leukemia)", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=aml", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["急性骨髓性白血病", "癌症"], "a": ["查分期", "看治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-lymphoma", "name": "淋巴癌", "en": "Lymphoma (Hodgkin & Non-Hodgkin)", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=lymphoma", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["淋巴癌", "癌症"], "a": ["查分期", "看治療", "查淋巴結"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-all", "name": "急性淋巴性白血病", "en": "Acute Lymphoblastic Leukemia", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=all", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["急性淋巴性白血病", "癌症"], "a": ["查分期", "看治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-cml", "name": "慢性骨髓性白血病", "en": "Chronic Myeloid Leukemia", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=cml", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["慢性骨髓性白血病", "癌症"], "a": ["查分期", "看治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-mds", "name": "骨髓分化不良症候群", "en": "Myelodysplastic Syndromes / Neoplasms", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=mds", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["骨髓分化不良症候群", "癌症"], "a": ["查分期", "看治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-mpn", "name": "骨髓增生性腫瘤", "en": "Myeloproliferative Neoplasms (PV / ET / MF)", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=mpn", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "血液腫瘤", "grpEn": "Hematologic Malignancies", "cnt": "6 項", "s": ["血液與骨髓"], "c": ["骨髓增生性腫瘤", "癌症"], "a": ["查分期", "看治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-cervix", "name": "子宮頸癌", "en": "Cervical Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=cervix", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "婦科腫瘤", "grpEn": "Gynecologic Cancers", "cnt": "4 項", "s": ["婦科"], "c": ["子宮頸癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-endometrial", "name": "子宮內膜癌", "en": "Endometrial Carcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=endometrial", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "婦科腫瘤", "grpEn": "Gynecologic Cancers", "cnt": "4 項", "s": ["婦科"], "c": ["子宮內膜癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-utsarc", "name": "子宮肉瘤", "en": "Uterine Sarcoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=utsarc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "婦科腫瘤", "grpEn": "Gynecologic Cancers", "cnt": "4 項", "s": ["婦科"], "c": ["子宮肉瘤", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    // 第 7 輪 s 補「腹膜」：本標的 en 欄本身就是「Ovarian / Fallopian Tube / Primary
    // Peritoneal Cancer」，js/ovarian-pathway.js 也寫「卵巢癌、輸卵管癌與原發性腹膜癌
    // 共用同一套流程」。原發性腹膜癌的部位就是腹膜，原本只掛婦科。
    {"k": "cancer-ovarian", "name": "卵巢癌", "en": "Ovarian / Fallopian Tube / Primary Peritoneal Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=ovarian", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "婦科腫瘤", "grpEn": "Gynecologic Cancers", "cnt": "4 項", "s": ["婦科", "腹膜"], "c": ["卵巢癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-utuc", "name": "上泌尿道腫瘤", "en": "Upper Tract Urothelial Carcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=utuc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "泌尿腫瘤", "grpEn": "Urologic Cancers", "cnt": "4 項", "s": ["泌尿系統", "腎臟"], "c": ["上泌尿道腫瘤", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-rcc", "name": "腎細胞癌", "en": "Renal Cell Carcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=rcc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "泌尿腫瘤", "grpEn": "Urologic Cancers", "cnt": "4 項", "s": ["腎臟", "泌尿系統"], "c": ["腎細胞癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-bladder", "name": "膀胱癌", "en": "Urinary Bladder Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=bladder", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "泌尿腫瘤", "grpEn": "Urologic Cancers", "cnt": "4 項", "s": ["泌尿系統"], "c": ["膀胱癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-prostate", "name": "攝護腺癌", "en": "Prostate Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=prostate", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "泌尿腫瘤", "grpEn": "Urologic Cancers", "cnt": "4 項", "s": ["泌尿系統"], "c": ["攝護腺癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-npc", "name": "鼻咽癌", "en": "Nasopharyngeal Carcinoma", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=npc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "頭頸腫瘤", "grpEn": "Head & Neck Cancers", "cnt": "2 項", "s": ["頭頸"], "c": ["鼻咽癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "cancer-hnc", "name": "頭頸癌", "en": "Head & Neck Cancer", "desc": "分期、淋巴結分群與治療決策", "kind": "cancer", "href": "tools/cancer.html#cancer=hnc", "sec": "cancer", "secTitle": "癌症治療", "secEn": "Cancer Treatment", "grp": "頭頸腫瘤", "grpEn": "Head & Neck Cancers", "cnt": "2 項", "s": ["頭頸"], "c": ["頭頸癌", "癌症"], "a": ["查分期", "選術式", "看治療", "查淋巴結", "要不要輔助治療"], "kw": "癌症 分期 TNM AJCC FIGO 淋巴結 治療 neoadjuvant adjuvant 化療 標靶 免疫", "impl": ""},
    {"k": "abx-mode-empiric", "name": "依部位", "en": "Empiric by Site", "desc": "抗生素指引、菌譜資料庫、手術預防、創傷用藥、注射轉口服與輸注配伍", "kind": "mode", "href": "tools/antibiotics.html#mode=empiric", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["感染與敗血", "腹膜", "腹部", "膽道", "軟組織", "肺與氣道", "腎臟", "心臟", "腦", "泌尿系統"], "c": ["抗生素選擇", "感染"], "a": ["查覆蓋菌譜", "給抗生素"], "kw": "抗生素 抗微生物 經驗性用藥 菌譜 感受性 腹膜炎 腹膜透析 腹透 peritonitis peritoneal dialysis PD CAPD APD 腹腔內注射 intraperitoneal IP", "impl": ""},
    {"k": "abx-mode-bacteria", "name": "依病原菌", "en": "By Pathogen", "desc": "抗生素指引、菌譜資料庫、手術預防、創傷用藥、注射轉口服與輸注配伍", "kind": "mode", "href": "tools/antibiotics.html#mode=bacteria", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["病原菌"], "c": ["抗生素選擇"], "a": ["查覆蓋菌譜", "找原因", "給抗生素"], "kw": "抗生素 抗微生物 經驗性用藥 菌譜 感受性", "impl": ""},
    {"k": "abx-spectrum-database", "name": "菌譜資料庫", "en": "Spectrum Database", "desc": "β-內醯胺酶分類、抗細菌／抗黴菌感受性菌譜、CR-GNB 新藥抗菌譜，整合台大 2026 上半年在地感受性 %S", "kind": "mega", "href": "tools/spectrum-database.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素"], "c": ["抗生素選擇"], "a": ["查覆蓋菌譜", "找原因", "給抗生素"], "kw": "抗生素 抗微生物 菌譜 手術預防 創傷", "impl": ""},
    {"k": "abx-surgical-prophylaxis", "name": "手術預防", "en": "Surgical Prophylaxis", "desc": "依台大醫院《手術預防性抗微生物製劑使用規範》（文件 15650-2-000016，版次 8）表一，並以 ASHP／IDSA／SIS／SHEA 2013 指引補充台大表一未列之術式", "kind": "tool", "href": "tools/surgical-prophylaxis.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素"], "c": ["抗生素選擇", "手術預防性抗生素", "手術"], "a": ["查覆蓋菌譜", "給抗生素"], "kw": "抗生素 抗微生物 菌譜 手術預防 創傷", "impl": ""},
    {"k": "abx-trauma-abx", "name": "創傷用藥", "en": "Trauma Antibiotics", "desc": "依損傷部位整理創傷後預防性抗生素的建議、療程與證據強度，並含破傷風預防決策", "kind": "tool", "href": "tools/trauma-abx.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素"], "c": ["抗生素選擇", "創傷後抗生素", "創傷"], "a": ["查覆蓋菌譜", "給抗生素"], "kw": "抗生素 抗微生物 菌譜 手術預防 創傷", "impl": ""},
    {"k": "abx-iv-to-po", "name": "注射轉口服", "en": "IV to PO Switch", "desc": "依台大醫院《抗微生物製劑注射轉口服劑型建議》（文件 15660-3-000005，版次 1）表一，含七條轉換條件的床邊檢核，與 34 種口服抗微生物製劑的吸收率、吸收部位、管灌可行性", "kind": "tool", "href": "tools/iv-to-po.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素"], "c": ["抗生素選擇"], "a": ["給抗生素", "怎麼調", "查劑量"], "kw": "抗生素 抗微生物 注射轉口服 IV to PO switch 口服吸收率 bioavailability 生體可用率 管灌 鼻胃管 鼻空腸管 NJ 降階 de-escalation 停針", "impl": ""},
    {"k": "abx-y-site", "name": "輸注與配伍", "en": "Infusion & Y-site Compatibility", "desc": "依台大醫院《β-lactam 類抗生素輸注時間建議》（文件 15600-3-000002，版次 3），含延長輸注（4 小時）的原則與 52 種常用注射藥品對 8 種 β-lactam 的 Y-site 相容性", "kind": "tool", "href": "tools/y-site.html", "sec": "hubs", "secTitle": "入口", "secEn": "Hubs", "grp": "抗微生物", "grpEn": "Antimicrobials", "cnt": "8 項", "s": ["抗生素"], "c": ["抗生素選擇"], "a": ["給抗生素", "怎麼調", "查劑量"], "kw": "抗生素 抗微生物 延長輸注 extended infusion 持續輸注 Y-site 相容性 配伍 fT>MIC 重症 ICU β-lactam 安定性 溶劑", "impl": ""},
    /* 這兩頁原本不在 136 個標的裡——沒有標的就沒有句子軌跡，造句設計下那兩頁
       既看不到「清空句子」、返回鍵又被收掉，等於走不出去（見 css/ui-sentence.css
       .back-stack 那一段）。使用者指定補進來，並要求「搜尋欄找得到（例如 pss）」，
       所以縮寫一律寫進 en 欄，說整句的索引才吃得到。 */
    {"k": "ich-score", "name": "ICH Score", "en": "ICH Score · Intracerebral Hemorrhage Score", "desc": "自發性腦內出血 30 天死亡率分層（Hemphill 2001），含 ABC/2 血腫體積估算", "kind": "tool", "href": "tools/ich-score.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "神經", "grpEn": "Neurology", "cnt": "2 項", "s": ["腦", "腦血管"], "c": ["腦出血", "出血", "意識障礙"], "a": ["算分數", "定嚴重度", "判時機"], "impl": ""},
    {"k": "pss", "name": "Pittsburgh 食道穿孔嚴重度", "en": "PSS · Pittsburgh Esophageal Perforation Severity Score", "desc": "食道穿孔嚴重度分數（Abbas 2009，Schweigert 2016 多國驗證），用於分流保守、內視鏡處置或手術", "kind": "tool", "href": "tools/pss.html", "sec": "scores", "secTitle": "計分工具", "secEn": "Scoring Tools", "grp": "食道", "grpEn": "Esophagus", "cnt": "1 項", "s": ["食道"], "c": ["食道急症", "消化道穿孔", "食道穿孔"], "a": ["算分數", "定嚴重度", "要不要開刀"], "impl": ""},
  ],

  /* ══════════════════════════════════════════════════════════════════════
     classif ── tools/classifications.html 頁內 33 套分級系統 ＋ AAST EGS
                16 個疾病的**查詢標註**（第 8 輪新增）
     ══════════════════════════════════════════════════════════════════════
     使用者原話：「請將分類與分級系統中的每個頁面（包含 AAST EGS 的每個項目的
     表格）都可以在句子中找到（例如我遇到闌尾炎，我要術中分級）」。

     ── 這裡放的是什麼，不放什麼 ──────────────────────────────────────────
     只有**面向標註**（s／c 兩個陣列）。中文名、英文名、出處、所屬分頁、
     深層連結一律**不在這裡**——那些是 tools/classifications.html 自己的
     內容，由 js/sentence-nav.js 在執行期把該頁抓回來用 DOMParser 讀出來
     （parseClassif()／parseAast()，那一段本來就存在）。這一份因此不是
     第二個真相來源：它一個字的臨床內容都沒有，抄不走也漂移不了；
     頁面改了名字、改了出處、換了分頁，這裡完全不必動。

     ── 為什麼不是新增 33 個 tools[] 標的 ────────────────────────────────
     tools[] 是「136 個標的」那份清單，首頁的指向數、六大分類每一格的「N 件」、
     內頁軌跡的件數全部靠它數出來。把 33 套分級系統加進去會讓 136 變成 169，
     那是**另一件事**（分級系統是頁內的一格，不是一個頁面）。所以標的數維持
     136 不變，這 33＋16 筆走的是既有的「頁內子目標」那條路——與抗生素指引的
     10 個感染部位、44 隻病原菌、155 張藥卡同一個層級。

     ── 每一筆的 s／c 是怎麼決定的 ───────────────────────────────────────
     逐條回 tools/classifications.html 讀該系統自己的區塊（sys-head 的中英文名
     ＋ 底下 .sys-body 的內容）決定，沒有一條是憑印象對照的；理由寫在各行 //。
     只用既有詞表的詞，不為此新增任何 s／c 詞條。
     刻意**不標上位詞**（感染／創傷／出血／阻塞／結石／衰竭／手術）：那七個詞
     的 sub 陣列已經涵蓋這裡用到的窄詞，expand() 會自己帶出來，重複標只會讓
     日後兩邊不一致。唯一的例外是 c「感染」本身——AAST 的感染性大腸炎、
     骨盆腔發炎、肛周膿瘍、肋膜腔感染、手術部位感染這五個疾病，詞表裡**沒有**
     對應的窄詞，標上位詞是唯一誠實的選擇（見各行註解）。

     鍵值：33 套用該頁自己的 sys-<id>（＝ #sys= 深層連結的值）；
           AAST 的 16 個疾病用「aast/<k>」，<k> 是該頁 AAST 陣列自己的 k 欄位
           （A–P，也就是下拉選單印出來的那個字母），不是陣列索引——
           索引會因為排序改變而指錯，字母不會。 */
  "classif": {
    /* ── 跨疾病 ────────────────────────────────────────────────────────
       AAST 那一顆**母項**只標通用詞：它是一個含 16 個疾病的下拉選單，
       真正的部位／狀況落在 16 個子項上（見下）。母項若也標了各疾病的詞，
       同一句話會同時命中母項與子項，畫面上就是同一張表出現兩次。 */
    "aast": {"s": ["腹部", "病人整體"], "c": ["分類分級"]},

    // AAST EGS 16 個疾病：名稱逐字取自該頁 AAST 陣列的 zh／en 欄位。
    "aast/A": {"s": ["闌尾"], "c": ["闌尾炎", "腹腔感染"]},                 // 急性闌尾炎 Acute Appendicitis
    // 乳房感染：Grade I 原文即 breast cellulitis（本頁譯「乳房蜂窩組織炎」），故用皮膚軟組織感染。
    "aast/B": {"s": ["乳房", "軟組織"], "c": ["皮膚軟組織感染"]},            // 乳房感染 Breast Infections
    "aast/C": {"s": ["膽道"], "c": ["膽囊炎", "腹腔感染"]},                  // 急性膽囊炎 Acute Cholecystitis
    "aast/D": {"s": ["大腸"], "c": ["憩室炎", "腹腔感染"]},                  // 急性大腸憩室炎
    "aast/E": {"s": ["食道"], "c": ["食道急症", "消化道穿孔"]},              // 食道穿孔 Esophageal Perforation
    // Grade II–V 逐級寫 incarcerated／gangrenous，故一併標嵌頓。
    "aast/F": {"s": ["腹壁與疝氣"], "c": ["疝氣", "嵌頓"]},                  // 疝氣（內疝或腹壁疝）
    // 感染性大腸炎：詞表沒有對應的窄詞（困難梭菌太窄——本條含所有 infectious colitis），標上位詞「感染」。
    "aast/G": {"s": ["大腸"], "c": ["感染"]},                               // 感染性大腸炎 Infectious Colitis
    "aast/H": {"s": ["小腸"], "c": ["腸阻塞"]},                             // 黏連性腸阻塞
    "aast/I": {"s": ["腸繫膜血管", "小腸"], "c": ["腸缺血"]},                // 腸道動脈缺血
    "aast/J": {"s": ["胰臟"], "c": ["胰臟炎"]},                             // 急性胰臟炎
    // 骨盆腔發炎疾病：詞表沒有 PID 的窄詞；婦科的別名本來就收「骨盆腔」。
    "aast/K": {"s": ["婦科"], "c": ["感染"]},                               // 骨盆腔發炎疾病 PID
    "aast/L": {"s": ["胃十二指腸"], "c": ["消化性潰瘍穿孔", "消化道穿孔"]},   // 消化性潰瘍穿孔（胃或十二指腸）
    // 肛周膿瘍：不標「腹內膿瘍」——那一條講的是腹腔內，肛周不在腹腔內。
    "aast/M": {"s": ["會陰"], "c": ["感染"]},                               // 肛周膿瘍 Perirectal Abscess
    // 肋膜腔感染：詞表沒有膿胸／肋膜腔的窄詞，部位落在肺與氣道（其別名含「胸腔」）。
    "aast/N": {"s": ["肺與氣道"], "c": ["感染"]},                           // 肋膜腔感染 Pleural Space Infection
    "aast/O": {"s": ["軟組織"], "c": ["皮膚軟組織感染"]},                    // 軟組織感染 Soft Tissue Infections
    // 手術部位感染：SSI 是術後併發症，同時詞表沒有 SSI 的窄詞，故另標上位詞「感染」。
    "aast/P": {"s": ["圍手術期", "軟組織"], "c": ["術後併發症", "感染"]},     // 手術部位感染 Surgical Site Infections

    /* ── 膽道分頁 ─────────────────────────────────────────────────────── */
    "tg18-gb":          {"s": ["膽道"], "c": ["膽囊炎", "腹腔感染"]},        // TG18 急性膽囊炎嚴重度分級
    "tg18-cholangitis": {"s": ["膽道"], "c": ["膽管炎", "腹腔感染"]},        // TG18 急性膽管炎
    // ASGE：本頁表格的判準是 CBD 結石／T-Bil／CBD 擴張，處置是 ERCP，故兼標膽道阻塞。
    "asge":             {"s": ["膽道"], "c": ["總膽管結石", "膽道阻塞"]},     // 總膽管結石風險分層
    "parkland":         {"s": ["膽道"], "c": ["膽囊炎"]},                   // Parkland 膽囊發炎分級（術中第一眼）
    // Nassar：評的是膽囊這台刀多難開，三欄全是膽囊／膽囊管蒂／沾黏。
    "nassar":           {"s": ["膽道"], "c": ["膽囊炎"]},                   // Nassar 手術困難度分級
    // Niemeier：Type I 自由穿孔＝瀰漫性膽汁性腹膜炎、Type II 局部穿孔＝膽囊周圍膿瘍。
    "niemeier":         {"s": ["膽道"], "c": ["膽囊炎", "腹膜炎", "腹內膿瘍"]}, // Niemeier 膽囊破裂分型
    // Mirizzi：Csendes 分型的軸是「總膽管受侵程度」，本質是膽道阻塞；
    // 不標「總膽管結石」——嵌頓的結石在 Hartmann pouch／膽囊管，不是總膽管內的結石。
    "mirizzi":          {"s": ["膽道"], "c": ["膽道阻塞"]},                  // Mirizzi syndrome — Csendes 分型

    /* ── 大腸憩室分頁 ─────────────────────────────────────────────────── */
    "wses-ct": {"s": ["大腸"], "c": ["憩室炎"]},                                     // WSES CT 分期
    // Hinchey：III／IV 期就是化膿性／糞性腹膜炎，Ib／II 期是結腸旁與遠處膿瘍。
    "hinchey": {"s": ["大腸"], "c": ["憩室炎", "腹膜炎", "腹內膿瘍"]},                 // Hinchey／Modified Hinchey

    /* ── 胰臟分頁 ─────────────────────────────────────────────────────── */
    // Atlanta／DBC 兩套的軸都含「器官衰竭」（Marshall ≥2 / SOFA ≥2）。
    "atlanta": {"s": ["胰臟"], "c": ["胰臟炎", "器官衰竭"]},                 // Revised Atlanta
    "dbc":     {"s": ["胰臟"], "c": ["胰臟炎", "器官衰竭"]},                 // DBC 決定因子分類
    "ctsi":    {"s": ["胰臟"], "c": ["胰臟炎"]},                            // Balthazar CTSI（純影像，無全身因子）

    /* ── 疝氣分頁：三套都是腹股溝疝的解剖分型 ─────────────────────────── */
    "ehs":     {"s": ["腹壁與疝氣"], "c": ["疝氣"]},                        // EHS 腹股溝疝氣分類
    "nyhus":   {"s": ["腹壁與疝氣"], "c": ["疝氣"]},                        // Nyhus 分類
    "gilbert": {"s": ["腹壁與疝氣"], "c": ["疝氣"]},                        // Gilbert／Rutkow-Robbins

    /* ── 消化道出血分頁 ───────────────────────────────────────────────── */
    // Forrest：英文名即 Peptic Ulcer Bleeding，是內視鏡下的上消化道出血分級。
    "forrest": {"s": ["胃十二指腸"], "c": ["上消化道出血", "消化道出血"]},    // Forrest 分類

    /* ── 圍手術期分頁 ─────────────────────────────────────────────────── */
    "clavien":     {"s": ["圍手術期"], "c": ["術後併發症"]},                 // Clavien-Dindo 手術併發症分級
    // ISREC：本頁明寫「只限直腸前位切除」，故部位兼標大腸。
    "isrec":       {"s": ["圍手術期", "大腸"], "c": ["術後併發症"]},          // 吻合口漏 ISREC 嚴重度分級
    // 四套「漏」：本頁對照表的器官欄依序是直腸、肝膽胰、胰臟手術、食道切除。
    "leak-family": {"s": ["圍手術期", "大腸", "肝臟", "胰臟", "食道"], "c": ["術後併發症"]}, // 四套「漏」的分級
    // CFS 不分部位（衰弱是全人狀態），對到的是 s「病人整體」；本頁收在圍手術期分頁。
    "cfs":         {"s": ["病人整體", "圍手術期"], "c": ["衰弱"]},           // 臨床衰弱量表 CFS

    /* ── 神經分頁 ─────────────────────────────────────────────────────── */
    // Marshall／Rotterdam 的英文名／內文都寫 Traumatic Brain Injury。
    "marshall-ct": {"s": ["腦"], "c": ["創傷性腦損傷"]},                     // Marshall CT 分類
    "rotterdam":   {"s": ["腦"], "c": ["創傷性腦損傷"]},                     // Rotterdam CT 分數
    // 以下四套的內文都是 SAH（Hunt-Hess 原文講顱內動脈瘤手術時機、Fisher 講腦池
    // 蜘蛛膜下腔血液厚度、mFisher 的世代是 1,355 名 SAH 病人、WFNS 是 SAH 分級）。
    "hunt-hess": {"s": ["腦", "腦血管"], "c": ["蜘蛛膜下腔出血"]},            // Hunt & Hess 分級
    "wfns":      {"s": ["腦", "腦血管", "意識"], "c": ["蜘蛛膜下腔出血"]},    // WFNS 分級（軸是 GCS）
    "fisher":    {"s": ["腦", "腦血管"], "c": ["蜘蛛膜下腔出血"]},            // Fisher 分級
    "mfisher":   {"s": ["腦", "腦血管"], "c": ["蜘蛛膜下腔出血"]},            // modified Fisher 分級

    /* ── 循環分頁 ─────────────────────────────────────────────────────── */
    // 休克不必另標：c「休克」的 sub 已含心因性休克，expand() 會帶到。
    "scai": {"s": ["心臟", "休克循環"], "c": ["心因性休克"]},                 // SCAI SHOCK 分級 A–E

    /* ── 其他分頁 ─────────────────────────────────────────────────────── */
    "cdiff":     {"s": ["大腸"], "c": ["困難梭菌"]},                         // 困難梭狀桿菌大腸炎 嚴重度
    // ECF／EAF：本頁的 Björck 修訂分類講的是開放腹腔（open abdomen）底下的腸道滲漏。
    "ecf":       {"s": ["小腸", "腹部"], "c": ["術後併發症", "腹腔高壓"]},    // 腸皮／腸道－大氣瘻管
    "iac":       {"s": ["腹膜", "腹部", "抗黴菌藥"], "c": ["侵襲性念珠菌感染", "腹腔感染"]}, // 腹腔內念珠菌感染
    // OBA 只涵蓋 LSG／LRYGB 術後晚期併發症，本頁最長的一段是內疝造成的腸阻塞。
    "bariatric": {"s": ["胃十二指腸", "圍手術期"], "c": ["術後併發症", "腸阻塞"]}, // 減重手術後急症
    "volvulus":  {"s": ["大腸"], "c": ["腸扭轉", "腸阻塞"]}                  // 乙狀結腸扭轉
  },

  "lex": {"scopePre": "在", "scopePost": "，", "p0": "我遇到", "p1": "的", "p2": "，我要", "phS": "部位／主體", "phC": "狀況", "phA": "我要做的事"}
};
