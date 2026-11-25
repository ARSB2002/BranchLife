
'use strict';
/* ===== v5: تولید تصادفی با بذر (قابل بازتولید) ===== */
let rnd=Math.random.bind(Math);
function setSeed(n){let s=(n>>>0)||1;rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function unseed(){rnd=Math.random.bind(Math)}

/* =====================================================================
   LIFE Simulator v2 — ساختار موتورها
   Game Core · Life · Economy · Career · Social · World · Event · Save · UI
   زمان: هر ماه ۳۰ روز، هر سال ۱۲ ماه = ۳۶۰ روز (در تمام بخش‌ها یکسان)
   ===================================================================== */
const VER=4,KEYP='life.v2.slot',OLD='life1',THK='life.theme',LNGK='life.lang',DM=30,DY=360;
const $=s=>document.querySelector(s);
/* ====== i18n / Calendar / Currency System (v4) ====== */
let LANG=(()=>{try{return localStorage.getItem(LNGK)||'en'}catch(e){return 'en'}})();
const PDIG='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>{const s=String(x);return LANG==='fa'?s.replace(/[0-9]/g,d=>PDIG[+d]):s};
const faN=n=>LANG==='fa'?Number(n).toLocaleString('fa-IR'):Number(n).toLocaleString('en-US');
const cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(v)));
const R=(a,b)=>Math.floor(rnd()*(b-a+1))+a,pick=a=>a[R(0,a.length-1)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
/* Gregorian months (EN) + Jalali months (FA) */
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const JMN=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
/* Jalali ↔ Gregorian conversion (standard algorithm) */
function _jtg(jy,jm,jd){jy+=1595;let days=-1460799+365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4),gy,gm,gd;
for(gy=1600;days>=365;gy++){const ly=gy%4===0&&(gy%100!==0||gy%400===0)?366:365;days-=ly}
for(gm=0;gm<11;gm++){const dm=[31,(gy%4===0&&(gy%100!==0||gy%400===0))?29:28,31,30,31,30,31,31,30,31,30,31][gm];if(days>=dm)days-=dm;else break}
gd=days+1;return{y:gy,m:gm,d:gd}}
const jalaliToGregorian=_jtg;
function gregorianToJalali(gy,gm,gd){
/* Simple accurate conversion: Jalali year ≈ Gregorian year - 621 (adjust for Nowruz) */
const isBeforeNowruz=gm<2||(gm===2&&gd<21);
const jy=isBeforeNowruz?gy-622:gy-621;
/* Calculate Jalali month and day */
const nowruzDay=79; /* March 21 is day 79 of Gregorian year */
let dayOfYear=0;
const g_days=[31,28,31,30,31,30,31,31,30,31,30,31];
for(let i=0;i<gm;i++)dayOfYear+=g_days[i];
dayOfYear+=gd;
let jDayOfYear;
if(isBeforeNowruz)jDayOfYear=dayOfYear+286;else jDayOfYear=dayOfYear-79;
if(jDayOfYear>365)jDayOfYear-=365;
/* Jalali months: 6×31 + 5×30 + 1×29 */
const j_days=[31,31,31,31,31,31,30,30,30,30,30,29];
let jm=0,jd=0;
for(let i=0;i<12;i++){if(jDayOfYear<=j_days[i]){jm=i;jd=jDayOfYear;break}jDayOfYear-=j_days[i]}
return{y:jy,m:jm,d:jd}}
/* Display: year stored as Gregorian (2025+) → formatted by language
   EN: show Gregorian year directly; FA: convert to Jalali */
const fmtYear=gy=>{if(LANG==='fa'){try{const j=gregorianToJalali(gy,0,1);return fa(j.y)}catch(e){return fa(gy)}}return fa(gy)};
const fmtMonth=mo=>LANG==='fa'?JMN[mo]:MN[mo];
const fmtDate=(y,mo,d=1)=>{if(LANG==='fa'){try{const j=gregorianToJalali(y,mo,d);return JMN[j.m]+' '+fa(j.y)}catch(e){return JMN[mo]+' '+fa(y)}}return MN[mo]+' '+fa(y)+(d>1?', '+fa(d):'')};
/* Currency: EN=USD ($), FA=Toman (مليون تومان / هزار تومان) */
const USD_FACTOR=10; /* internal unit display scaling for EN */
const TMN_FACTOR=1;  /* internal unit = 1 million toman for FA */
function fm(n){if(LANG==='en'){n=Math.round(n*5)*USD_FACTOR*2;return(n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US')}
 n=Math.round(n);const sign=n<0?'−':'',abs=Math.abs(n);
 if(abs===0)return LANG==='fa'?'۰ تومان':'$0';
 if(abs<1)return sign+fa(Math.round(abs*1000))+' هزار تومان';
 if(abs<1000)return sign+fa(abs)+' میلیون تومان';
 return sign+fa((abs/1000).toFixed(1))+' میلیارد تومان'}
/* i18n dictionary */
const I18N={
 fa:{home:'خانه',character:'شخصیت',relations:'روابط',work:'شغل',finance:'مالی',assets:'دارایی',phone:'گوشی',world:'جهان',school:'مدرسه و دانشگاه',lifepath:'مسیر زندگی',market:'بازار و خانواده',property:'املاک و جهان',history:'تاریخچه',settings:'تنظیمات',guide:'راهنما',
  brand:'BranchLife',tagline:'داستانت را بساز، یک انتخاب در هر لحظه',
  new_life:'شروع زندگی من',cancel:'انصراف',slot:'اسلات',continue_life:'ادامه زندگی',delete:'حذف',empty:'خالی',corrupted:'خراب',in_progress:'در حال انجام',deceased:'فوت شده',last_saved:'آخرین ذخیره',years_old:'ساله',theme:'پوسته',auto:'خودکار',light:'روشن',dark:'تاریک',
  name:'نام شخصیت',gender:'جنسیت',country:'کشور',family_bg:'پیشینه خانوادگی',start_life:'شروع زندگی',difficulty:'سختی بازی',male:'مرد',female:'زن',random:'تصادفی (پیشنهادی)',poor:'خانواده فقیر',middle:'خانواده متوسط',wealthy:'خانواده ثروتمند',from_birth:'از تولد (پیشنهادی)',from18:'از ۱۸ سالگی',easy:'آسان',normal:'معمولی',hard:'سخت',
  menu:'☰ منو',age:'سن',single:'مجرد',married:'متأهل',cash:'موجودی',health:'سلامت',happiness:'خوشحالی',intelligence:'هوش',looks:'ظاهر',energy:'انرژی',fame:'شهرت',stress:'استرس',addiction:'اعتیاد',debt:'بدهی',
  job:'شغل',student:'دانشجو',retired:'بازنشسته',unemployed:'بیکار',preschool:'خردسال',schoolchild:'محصل',partner:'شریک',spouse:'همسر',
  last_event:'آخرین اتفاق زندگی',pass_year:'⏳ گذر زمان (یک سال)',pass_year_desc:'تا کلیک نکنی زمان نمی‌گذرد؛ انرژی هر سال دوباره پر می‌شود',
  activities:'فعالیت‌ها',activities_desc:'هر فعالیت در سال سهمیه محدودی دارد؛ با گذر سال پر می‌شود',free_cmd:'دستور آزاد',free_cmd_ph:'اقدام موردنظر خود را بنویس...',free_cmd_btn:'اجرای دستور',free_cmd_desc:'موتور قوانین هر دستور را اعتبارسنجی می‌کند.',
  pocket_money:'پول توجیبی ماهانه از خانواده',traits:'ویژگی‌های شخصیتی',traits_desc:'روی احتمال رویدادها و نتیجه انتخاب‌ها اثر دارند',records:'سوابق',education:'تحصیلات',work_history:'سابقه کار',
  relations_desc:'با هر نفر می‌توانی صحبت کنی، پول بخواهی، هدیه بدهی یا بیرون بروی',love:'محبت',trust:'اعتماد',respect:'احترام',anger:'عصبانیت',goal:'هدف',memories:'خاطرات',finances:'وضع مالی',
  talk:'صحبت',ask_money:'درخواست پول',gift:'هدیه',go_out:'بیرون رفتن',apologize:'عذرخواهی',cut_ties:'قطع ارتباط',propose:'خواستگار',have_child:'فرزندآوری',divorce:'طلاق',children:'فرزندان',
  work_market:'وضعیت بازار',search_job:'جست‌وجوی کار',resign:'استعفا',retire:'بازنشستگی',salary:'حقوق',per_month:'در ماه',business_income:'درآمد کسب‌وکار',
  finance_status:'وضعیت مالی',year:'سال',income:'درآمد',expenses:'هزینه‌ها',tax:'مالیات',rent:'اجاره',food:'خوراک',transport:'حمل‌ونقل',loan_payment:'قسط وام',other:'سایر',monthly_saving:'پس‌انداز ماهانه',monthly_income:'درآمد ماهانه',monthly_expense:'هزینه ماهانه',gambling_debt:'بدهی قماری',
  invest:'سرمایه‌گذاری',withdraw_all:'نقد کردن همه',bank_loan:'وام بانکی',pay_off:'تسویه کامل',interest_rate:'نرخ سالانه',
  house:'خانه',car:'خودرو',insurance:'بیمه درمانی',business:'کسب‌وکار',net_worth:'دارایی خالص',buy_house:'خرید خانه',sell_house:'فروش',buy_car:'خرید خودرو',sell_car:'فروش (۶۰٪ قیمت)',get_insurance:'تهیه بیمه',cancel_insurance:'لغو بیمه',
  world_news:'اخبار جهان',move_city:'نقل مکان',migrate:'مهاجرت',economy_status:'وضعیت اقتصاد',inflation:'تورم امسال',cost_scale:'مقیاس هزینه‌ها',loan_rate:'نرخ وام',
  achievements:'دستاوردها',life_history:'تاریخچه مهم زندگی',recent_events:'رویدادهای اخیر',biography:'زندگینامه',download_text:'دانلود متن',
  language:'زبان',persian:'فارسی',english:'انگلیسی',storage:'ذخیره‌سازی',save_manual:'ذخیره دستی',slot_menu:'منوی اسلات‌ها',delete_life:'حذف این زندگی',data_version:'نسخه داده',saved:'ذخیره شد.',
  school_tab:'🏫 مدرسه',school_age_desc:'مدرسه از ۷ تا ۱۷ سالگی ادامه دارد',pick_school:'انتخاب مدرسه',university_tab:'🎓 دانشگاه',university_apps:'درخواست دانشگاه',apps_locked:'درخواست دانشگاه از ۱۸ سالگی و پس از پایان مدرسه باز می‌شود',
  self_funded:'هزینه شخصی',guardian_funded:'هزینه قیم',scholarship:'بورسیه',self_funded_desc:'از پول خودت می‌پردازی',guardian_desc:'قیمت بر اساس وضعیت خانواده و سختی بازی',scholarship_desc:'نیازمند هوش و خلاقیت بالا',apply:'درخواست',admitted:'پذیرفته شدی',enroll:'ثبت‌نام',
  classmates:'همکلاسی‌ها',classmates_desc:'وقتی با همکلاسی‌ای صمیمی می‌شوی، او وارد روابطت می‌شود',close_friend:'دوست صمیمی',staff:'کادر آموزشی',chat:'گپ',study_together:'هم‌مطالعه',prank:'شوخی',
  heir_system:'سیستم وارث',heir_desc:'وارثت را از ۱۸ سالگی تعیین کن. پس از مرگ، زندگی را از طریق وارث ادامه بده',designate_heir:'تعیین وارث',designated:'وارث تعیین‌شده',no_heir:'هیچ وارثی تعیین نشده',continue_as:'ادامه با',heir_locked:'تعیین وارث از ۱۸ سالگی ممکن است',no_children_yet:'هنوز فرزندی نداری. وارثانت فرزندانت خواهند بود',
  death_title:'درگذشت',death_cause:'علت',final_assets:'دارایی نهایی',final_education:'تحصیلات',final_children:'فرزندان',final_happiness:'خوشحالی پایانی',final_achievements:'دستاوردها',key_moments:'لحظه‌های مهم زندگی',back_to_menu:'بازگشت به منو',delete_save:'حذف این ذخیره',
  deposit:'ذخیره',accessibility:'دسترس‌پذیری و ظاهر',font_size:'اندازه متن',dense_layout:'چیدمان فشرده',on:'روشن',off:'خاموش',game:'بازی',difficulty_label:'سختی',run_test:'اجرای تست خودکار',download_bio:'دانلود زندگینامه',error_report:'گزارش خطا',no_errors:'خطایی ثبت نشده است',export_err:'خروجی',clear_err:'پاک کردن',
  saving_failed:'ذخیره‌سازی ناموفق بود',corrupted_save:'این ذخیره خراب است',invalid_save:'ساختار ذخیره معتبر نیست',no_backup:'نسخه پشتیبان پیدا نشد',backup_corrupt:'نسخه پشتیبان هم خراب است',restored:'زندگی از نسخه پشتیبان بازیابی شد',
  stages_childhood:'کودکی',stages_school:'سال‌های مدرسه',stages_teens:'نوجوانی',stages_young:'جوانی',stages_career:'شغل و خانواده',stages_midlife:'میانسالی',stages_golden:'سال‌های طلایی',
  passed_away:'درگذشت',gift_received:'تولدت مبارک',years:'سال',months:'ماه',
  guide_title:'راهنمای شروع',guide_intro:'زمان فقط با دکمه «⏳ گذر زمان» جلو می‌رود؛ هر کلیک یک سال',guide_quota:'هر فعالیت در سال سهمیه دارد',guide_events:'رویدادها گاهی وسط سال ظاهر می‌شوند',guide_family_support:'تا ۲۶ سالگی اگر درآمد نداشته باشی خانواده کمک می‌کند',guide_difficulty:'سختی بازی روی پول و تورم اثر دارد',
  metric_health:'سلامت',metric_happiness:'خوشحالی',metric_iq:'هوش',metric_looks:'ظاهر',metric_energy:'انرژی',metric_fame:'شهرت',metric_stress:'استرس',metric_addiction:'اعتیاد به قمار',
  desc_health:'اگر زیر ۲۵ باشد می‌میری. استرس بالا سلامت را می‌خورد',desc_happiness:'با دوستی و موفقیت بالا، با بدهی و بیکاری پایین',desc_iq:'روی استخدام و بورسیه اثر دارد',desc_looks:'روی دوست‌یابی و مدلینگ اثر دارد',desc_energy:'با فعالیت کم، با استراحت پر می‌شود',desc_fame:'از شبکه اجتماعی و موفقیت می‌آید',desc_stress:'کار و بدهی بالا، استراحت پایین',desc_addiction:'با هر شرط بالا می‌رود',
  personality:'شخصیت',personality_desc:'خلاقیت، نظم، اعتمادبه‌نفس، اجتماعی‌بودن و جاه‌طلبی روی ارتقا و درآمد اثر می‌گذارند',
  event:'رویداد',continue_btn:'ادامه',select_lang:'انتخاب زبان',lang_fa_desc:'فارسی، تقویم شمسی، تومان',lang_en_desc:'English, Gregorian calendar, USD',
  select_country:'انتخاب کشور',select_gender:'انتخاب جنسیت',select_difficulty:'انتخاب سختی',start:'شروع',year_label:'سال',month_label:'ماه',
  biz_income_passive:'درآمد غیرفعال',no_partner_yet:'شریک زندگی نداری. در تب گوشی آشنا شو',no_partner:'شریکی نداری',monthly_cost_child:'هزینه ماهانه هر فرزند',
  dead:'فوت شده',alive:'زنده',cut:'قطع شده',years_old_short:'س',slot_short:'اسلات',
  },
 en:{home:'Home',character:'Character',relations:'Relations',work:'Work',finance:'Finance',assets:'Assets',phone:'Phone',world:'World',school:'School & University',lifepath:'Life Path',market:'Market & Family',property:'Property & World',history:'History',settings:'Settings',guide:'Guide',
  brand:'BranchLife',tagline:'Shape your story, one choice at a time',
  new_life:'Start my life',cancel:'Cancel',slot:'Slot',continue_life:'Continue life',delete:'Delete',empty:'Empty',corrupted:'Corrupted',in_progress:'In progress',deceased:'Deceased',last_saved:'Last saved',years_old:'years old',theme:'Theme',auto:'Auto',light:'Light',dark:'Dark',
  name:'Character name',gender:'Gender',country:'Country',family_bg:'Family background',start_life:'Start life',difficulty:'Difficulty',male:'Male',female:'Female',random:'Random (recommended)',poor:'Poor family',middle:'Middle-class family',wealthy:'Wealthy family',from_birth:'From birth (recommended)',from18:'From age 18',easy:'Easy',normal:'Normal',hard:'Hard',
  menu:'☰ Menu',age:'Age',single:'Single',married:'Married',cash:'Cash',health:'Health',happiness:'Happiness',intelligence:'Intelligence',looks:'Looks',energy:'Energy',fame:'Fame',stress:'Stress',addiction:'Addiction',debt:'Debt',
  job:'Job',student:'Student',retired:'Retired',unemployed:'Unemployed',preschool:'Preschool',schoolchild:'Student',partner:'Partner',spouse:'Spouse',
  last_event:'Last life event',pass_year:'⏳ Pass time (one year)',pass_year_desc:'Time only passes when you click; energy refills each year',
  activities:'Activities',activities_desc:'Each activity has a yearly quota; refills at year start',free_cmd:'Free command',free_cmd_ph:'Type what you want to do...',free_cmd_btn:'Execute',free_cmd_desc:'The rules engine validates each command',
  pocket_money:'Monthly pocket money from family',traits:'Personality traits',traits_desc:'Affect event odds and choice outcomes',records:'Records',education:'Education',work_history:'Work history',
  relations_desc:'Talk, ask for money, give gifts, or go out with each person',love:'Love',trust:'Trust',respect:'Respect',anger:'Anger',goal:'Goal',memories:'Memories',finances:'Finances',
  talk:'Talk',ask_money:'Ask for money',gift:'Gift',go_out:'Go out',apologize:'Apologize',cut_ties:'Cut ties',propose:'Propose',have_child:'Have a child',divorce:'Divorce',children:'Children',
  work_market:'Market status',search_job:'Search for work',resign:'Resign',retire:'Retire',salary:'Salary',per_month:'per month',business_income:'Business income',
  finance_status:'Financial status',year:'Year',income:'Income',expenses:'Expenses',tax:'Tax',rent:'Rent',food:'Food',transport:'Transport',loan_payment:'Loan payment',other:'Other',monthly_saving:'Monthly saving',monthly_income:'Monthly income',monthly_expense:'Monthly expense',gambling_debt:'Gambling debt',
  invest:'Invest',withdraw_all:'Withdraw all',bank_loan:'Bank loan',pay_off:'Pay off',interest_rate:'Annual rate',
  house:'House',car:'Car',insurance:'Health insurance',business:'Business',net_worth:'Net worth',buy_house:'Buy house',sell_house:'Sell',buy_car:'Buy car',sell_car:'Sell (60% price)',get_insurance:'Get insurance',cancel_insurance:'Cancel insurance',
  world_news:'World news',move_city:'Move city',migrate:'Emigrate',economy_status:'Economy status',inflation:'Inflation this year',cost_scale:'Cost scale',loan_rate:'Loan rate',
  achievements:'Achievements',life_history:'Key life history',recent_events:'Recent events',biography:'Biography',download_text:'Download text',
  language:'Language',persian:'Persian',english:'English',storage:'Storage',save_manual:'Save manually',slot_menu:'Slot menu',delete_life:'Delete this life',data_version:'Data version',saved:'Saved.',
  school_tab:'🏫 School',school_age_desc:'School runs from age 7 to 17',pick_school:'Pick school',university_tab:'🎓 University',university_apps:'University Applications',apps_locked:'Applications open at age 18, when school ends',
  self_funded:'Self-funded',guardian_funded:'Guardian',scholarship:'Scholarship',self_funded_desc:'You pay from your own money',guardian_desc:'Cost depends on family wealth and difficulty',scholarship_desc:'Requires high intelligence and creativity',apply:'Apply',admitted:'Admitted',enroll:'Enroll',
  classmates:'Classmates',classmates_desc:'When you become close with a classmate, they join your relations',close_friend:'Close friend',staff:'Staff',chat:'Chat',study_together:'Study together',prank:'Prank',
  heir_system:'Heir System',heir_desc:'Designate your heir from age 18. After death, continue life through your heir',designate_heir:'Designate heir',designated:'Designated heir',no_heir:'No heir designated',continue_as:'Continue as',heir_locked:'You can designate an heir from age 18',no_children_yet:'No children yet. Your heirs will be your kids',
  death_title:'Passed away',death_cause:'Cause',final_assets:'Final assets',final_education:'Education',final_children:'Children',final_happiness:'Final happiness',final_achievements:'Achievements',key_moments:'Key moments of life',back_to_menu:'Back to menu',delete_save:'Delete this save',
  deposit:'Save',accessibility:'Accessibility & appearance',font_size:'Font size',dense_layout:'Dense layout',on:'On',off:'Off',game:'Game',difficulty_label:'Difficulty',run_test:'Run self-test',download_bio:'Download biography',error_report:'Error report',no_errors:'No errors logged',export_err:'Export',clear_err:'Clear',
  saving_failed:'Saving failed',corrupted_save:'This save is corrupted',invalid_save:'This save structure is invalid',no_backup:'No backup found',backup_corrupt:'Backup is also corrupted',restored:'Life restored from backup',
  stages_childhood:'Childhood',stages_school:'School years',stages_teens:'Teens',stages_young:'Young adulthood',stages_career:'Career and family',stages_midlife:'Midlife',stages_golden:'Golden years',
  passed_away:'passed away',gift_received:'Happy birthday',years:'years',months:'months',
  guide_title:'Getting started',guide_intro:'Time only passes when you click "⏳ Pass time"; each click is one year',guide_quota:'Each activity has a yearly quota',guide_events:'Events appear during the year',guide_family_support:'Until age 26 with no income, your family helps',guide_difficulty:'Difficulty affects starting money and inflation',
  metric_health:'Health',metric_happiness:'Happiness',metric_iq:'Intelligence',metric_looks:'Looks',metric_energy:'Energy',metric_fame:'Fame',metric_stress:'Stress',metric_addiction:'Gambling addiction',
  desc_health:'If below 25 at year end you die. High stress drains health',desc_happiness:'Rises with friends and success, falls with debt and unemployment',desc_iq:'Affects hiring and scholarships',desc_looks:'Affects dating and modeling',desc_energy:'Decreases with activity, refills with rest',desc_fame:'Comes from social media and success',desc_stress:'Work and debt raise it, rest lowers it',desc_addiction:'Rises with each bet',
  personality:'Personality',personality_desc:'Creativity, discipline, confidence, sociability and ambition affect promotions and income',
  event:'Event',continue_btn:'Continue',select_lang:'Select language',lang_fa_desc:'Persian, Jalali calendar, Toman',lang_en_desc:'English, Gregorian calendar, USD',
  select_country:'Select country',select_gender:'Select gender',select_difficulty:'Select difficulty',start:'Start',year_label:'Year',month_label:'Month',
  biz_income_passive:'Passive income',no_partner_yet:'No partner yet. Meet people in the Phone tab',no_partner:'No partner',monthly_cost_child:'Monthly cost per child',
  dead:'Deceased',alive:'Alive',cut:'Cut',years_old_short:'y',slot_short:'Slot',
 }};
function tx(k,...a){const d=I18N[LANG]||I18N.fa;let s=d[k]||I18N.en[k]||k;a.forEach((v,i)=>s=s.replace(new RegExp('\\{'+i+'\\}','g'),String(v)));return s}
function setLang(l){LANG=l;try{localStorage.setItem(LNGK,l)}catch(e){}document.documentElement.lang=l;document.documentElement.dir=l==='fa'?'rtl':'ltr';rend()}
function applyLangDir(){document.documentElement.lang=LANG;document.documentElement.dir=LANG==='fa'?'rtl':'ltr'}

/* ---------- داده‌های ثابت ---------- */
// m: مقیاس هزینه‌ها (قدرت خرید) · i: تورم پایه · lr: نرخ سالانه وام · sx: حساسیت اجتماعی
const C={
'Iran':{m:1,i:.25,lr:.3,sx:.3,c:['Ahvaz','Tehran','Shiraz','Tabriz','Mashhad']},
'USA':{m:4,i:.04,lr:.08,sx:.04,c:['Chicago','New York','Los Angeles']},
'Canada':{m:3.5,i:.04,lr:.07,sx:.04,c:['Toronto','Vancouver']},
'Germany':{m:3.5,i:.03,lr:.06,sx:.04,c:['Berlin','Munich']},
'Turkey':{m:1.2,i:.35,lr:.4,sx:.12,c:['Istanbul','Ankara']},
'Japan':{m:3,i:.02,lr:.03,sx:.04,c:['Osaka','Tokyo']},
'UK':{m:3.5,i:.04,lr:.07,sx:.04,c:['Manchester','London']}};
// [نام، حداقل مدرک، حقوق پایه (واحد)، سختی استخدام]
/* Jobs: [name, min_education, base_salary, hiring_difficulty] */
const J=[
['Laborer',0,17,0],['Salesperson',0,19,0],['Driver',0,18,2],['Cashier',0,16,1],
['Teacher',1,26,5],['Office clerk',1,30,5],['Nurse',1,28,6],['Journalist',1,35,8],['Chef',1,32,7],
['Programmer',1,48,15],['Designer',1,40,10],['Accountant',1,38,8],['Pharmacist',1,42,12],
['Project manager',2,75,20],['Lawyer',2,85,18],['Architect',2,70,15],['Pilot',2,90,22],
['Doctor',3,115,25],['Surgeon',3,140,28],['Professor',3,95,20]];
const LV=['','Senior','Lead','Manager'];
const ED=['High school','Bachelor','Master','Medical doctorate'];
const PR=[['Bachelor',1,8],['Master',2,4],['Medicine',3,14]];
const RL={father:'Father',mother:'Mother',friend:'Friend',partner:'Partner',step:'Stepparent'};
/* Life stages with bilingual descriptions - dynamic based on LANG */
const ST_FA=[[0,'کودکی اولیه','👶','خانواده، رشد اولیه و رویدادهای کودکی. بیشتر تصمیم‌ها را دیگران برایت می‌گیرند.'],[6,'سال‌های مدرسه','🎒','مدرسه، یادگیری، دوستان و اولین ویژگی‌های شخصیتی‌ات.'],[13,'نوجوانی','🎧','علایق، انتخاب رشته و استقلال فزاینده؛ نزدیک به کنکور و دانشگاه.'],[18,'جوانی','🎓','دانشگاه، ورود به بازار کار و استقلال مالی.'],[25,'شغل و خانواده','💼','رشد شغلی، ازدواج، فرزند و مدیریت زندگی.'],[40,'میانسالی','🏡','مسئولیت‌های خانوادگی، دارایی و بحران‌های میانسالی.'],[60,'سال‌های طلایی','🌅','بازنشستگی، سلامت، پیوندهای خانوادگی و میراث.']];
const ST_EN=[[0,'Early childhood','👶','Family, early growth and childhood events. Most decisions are made for you.'],[6,'School years','🎒','School, learning, friends and the first traits of your personality.'],[13,'Teens','🎧','Interests, choosing a track and growing independence; college entrance approaches.'],[18,'Young adulthood','🎓','College, entering the job market and financial independence.'],[25,'Career and family','💼','Career growth, marriage, kids and running your life.'],[40,'Midlife','🏡','Family responsibilities, assets and midlife crises.'],[60,'Golden years','🌅','Retirement, health, family ties and legacy.']];
const getST=()=>LANG==='fa'?ST_FA:ST_EN;
const stage=a=>getST().filter(x=>a>=x[0]).pop();
const TR_FA=[['cr','🎨','خلاقیت','روی درآمد فریلنسری، سرگرمی‌ها و ایده‌های کسب‌وکار اثر دارد'],['di','📏','نظم','روی استخدام، ارتقا و موفقیت تحصیلی اثر دارد'],['cf','💪','اعتمادبه‌نفس','روی مصاحبه‌ها، مذاکرات حقوقی و روابط اثر دارد'],['so','🤝','اجتماعی‌بودن','روی دوستی‌ها، محبوبیت و شبکه‌سازی اثر دارد'],['am','🎯','جاه‌طلبی','روی ارتقاها و ایده‌های بزرگ (و استرس) اثر دارد']];
const TR_EN=[['cr','🎨','Creativity','Affects freelance income, hobbies and business ideas'],['di','📏','Discipline','Affects hiring, promotions and school success'],['cf','💪','Confidence','Affects interviews, salary talks and relationships'],['so','🤝','Sociability','Affects friendships, popularity and networking'],['am','🎯','Ambition','Affects promotions and big ideas (and stress)']];
const getTR=()=>LANG==='fa'?TR_FA:TR_EN;
const TABS=[['i','❓',''],['h','🏠',''],['c','🧬',''],['r','👨‍👩‍👦',''],['u','🏫',''],['j','💼',''],['f','💳',''],['a','🏘',''],['p','📱',''],['z','🧭',''],['k','📊',''],['v','🌐',''],['w','🌍',''],['x','📜',''],['s','⚙️','']];
const tabLabel=k=>{const m={i:'guide',h:'home',c:'character',r:'relations',u:'school',j:'work',f:'finance',a:'assets',p:'phone',z:'lifepath',k:'market',v:'property',w:'world',x:'history',s:'settings'};return tx(m[k]||k)};
const LB={c:'Cash',h:'Health',hp:'Happiness',en:'Energy',str:'Stress',iq:'Intelligence',lk:'Looks',fame:'Fame',add:'Addiction',db:'Debt'},BAD={str:1,add:1,db:1};
const BG={h:['Horse racing',.33,2.8],f:['Football betting',.47,2],b:['Blackjack',.46,2],s:['Slots',.16,6],l:['Lottery',.025,40]};
const IT=['Serious relationship','Casual dating','Tonight only'];

/* =============================== Game Core =============================== */
let S=null,flash='',NS=0;
const DUM=()=>({n:'—',alive:0,cut:1,love:0,trust:0,resp:0,anger:0,h:0,age:0,mem:[]});
const g=r=>S.npcs.find(n=>n.role==r)||DUM();
const has=r=>{const n=S.npcs.find(x=>x.role==r);return !!(n&&n.alive&&!n.cut)};
const D=(k,v)=>{S.st[k]=cl(S.st[k]+v)},T=(k,v)=>{S.tr[k]=cl(S.tr[k]+v)},TC=(k,p)=>{if(rnd()<p)T(k,1)};
const pay=x=>{S.cash-=x*S.m},cst=x=>{if(S.age>=18)pay(x)},can=x=>S.age<18||S.cash>=x*S.m,med=x=>{if(S.age>=18)pay(S.ins?x*.4:x)};
const NR=(n,l,t,r,a)=>{n.love=cl(n.love+(l||0));n.trust=cl(n.trust+(t||0));n.resp=cl(n.resp+(r||0));n.anger=cl(n.anger+(a||0))};
const mem=(n,t)=>{n.mem.unshift(fa(S.age)+' ساله: '+t);n.mem=n.mem.slice(0,12)};
const log=t=>{S.news=t;S.log.unshift(fa(S.age)+' ساله: '+t);S.log=S.log.slice(0,40)};
const H=t=>{S.hist.unshift([S.age,t]);S.hist=S.hist.slice(0,400)};
const housePrice=()=>2500*S.m*((S.x&&S.x.hi)||1),carPrice=()=>600*S.m;
const net=()=>S.cash+S.inv+XNW()+(S.home?housePrice():0)+(S.car?carPrice()*.6:0)-(S.loan?S.loan.bal:0)-S.gb.debt;
const jn=j=>j.n+(j.lvl>0?' ('+LV[j.lvl]+')':'');
const snap=()=>({c:S.cash/S.m,db:S.gb.debt/S.m,add:S.gb.add,...S.st});
const diff=(a,b)=>Object.keys(LB).map(k=>[k,Math.round(((b[k]||0)-(a[k]||0))*10)/10]).filter(x=>Math.abs(x[1])>=1);
const X=()=>{S.gb=S.gb||{n:0,w:0,l:0,add:0,debt:0,mb:0,s:0};S.dt=S.dt||{sw:8,mt:0,dd:0,bk:0,os:0,cards:[],ms:[],preg:0}};
const msg=t=>{log(t);commit()};
function commit(){chkAch();save();rend()}
function res(f,d){const a=snap(),t=f(),b=snap();S.rs={t,d:diff(a,b)};log(t);d?advD(d):commit()}
function advD(n){if(!S||S.ev||S.dead)return;S.pend=n;run()}
function run(){while(S.pend>0&&!S.ev&&!S.dead){const st=Math.min(S.pend,DM-S.d);S.d+=st;S.pend-=st;if(S.d>=DM){S.d=0;if(tick())break}}commit()}

/* =============================== Life Engine ============================== */
/* Character creation with occupation and income for all characters */
const NPC_JOBS=[[LANG==='fa'?'معلم':'Teacher',1.5],[LANG==='fa'?'مهندس':'Engineer',3],[LANG==='fa'?'پرستار':'Nurse',1.8],[LANG==='fa'?'کارمند':'Clerk',1.2],[LANG==='fa'?'راننده':'Driver',1],[LANG==='fa'?'فروشنده':'Salesperson',1.3],[LANG==='fa'?'آشپز':'Chef',2],[LANG==='fa'?'کارگر':'Laborer',0.8],[LANG==='fa'?'طراح':'Designer',2.5],[LANG==='fa'?'حسابدار':'Accountant',2.2],[LANG==='fa'?'نقاش':'Painter',1.4],[LANG==='fa'?'اصلاحگر':'Barber',1.1],[LANG==='fa'?'مدرس خصوصی':'Tutor',1.6],[LANG==='fa'?'نگهبان':'Security',0.9],[LANG==='fa'?'تکنسین':'Technician',1.7]];
function mk(role,n,age,pers,goal,fin,love,m0){const job=age>=18?pick(NPC_JOBS):[LANG==='fa'?'دانشجو':'Student',0];const income=Math.round(job[1]*(role=='father'||role=='mother'?1:0.7)*20);return{role,n,age,pers,goal,fin,love,trust:cl(love-R(0,10)),resp:cl(love-R(0,15)),anger:R(0,12),h:R(55,85),occupation:job[0],income,mem:[m0||(LANG==='fa'?'در کودکی کنارت بوده است.':'Was by your side in childhood.')],alive:1,cut:0}}
const FRN=['Sarah','Ben','Nick','Ella','Maya','Leo'];
function birthday(){S.age++;S.npcs.forEach(n=>{if(n.alive)n.age++});const L=LANG;log((L==='fa'?'تولدت مبارک! ':'Happy birthday! ')+fa(S.age)+(L==='fa'?' ساله شدی.':' years old.'));
 if(S.age<=45&&S.st.str<50)D('h',3);if(S.age>45)D('h',-2);if(S.age>65)D('h',-4);
 if(S.age==6&&!S.npcs.some(n=>n.role=='friend')){S.npcs.push(mk('friend',pick(FRN),6,L==='fa'?'شوخ و کمی بی‌برنامه':'Playful',L==='fa'?'می‌خواهد با تو بازی کند':'Wants to play with you',L==='fa'?'متوسط':'middle',60,L==='fa'?'همسایه یا هم‌کلاسی‌ات بود.':'Was a neighbor or classmate.'))}
 if(S.age==18){const gift={p:1,m:10,w:60}[S.f]*S.m;S.cash+=gift;log((L==='fa'?'۱۸ ساله شدی و وارد بزرگسالی شدی. خانواده ':'You turned 18 and became an adult. Your family gave you ')+fm(gift)+(L==='fa'?' به‌عنوان شروع زندگی به تو داد.':' as a start in life.'));H(L==='fa'?'به ۱۸ سالگی رسیدی و بزرگسال شدی.':'You reached 18 and became an adult.')}
 else if(S.age%10==0)H((L==='fa'?'تولد ':'Birthday ')+fa(S.age)+(L==='fa'?' سالگی':''))}
function yearly(){const co=C[S.co],e=S.eco;
 if(e.t!='n'){if(--e.y<=0)e.t='n'}
 else if(rnd()<.2){e.t=rnd()<.5?'r':'b';e.y=R(1,3);S.wn.unshift(fa(S.y)+': '+(e.t=='r'?'رکود اقتصادی آغاز شد؛ استخدام سخت‌تر و اخراج‌ها بیشتر می‌شود.':'رونق اقتصادی آغاز شد؛ بازار کار و بورس گرم است.'))}
 S.infl=Math.max(.005,co.i+R(-3,5)/100+(e.t=='r'?-.01:e.t=='b'?.01:0)+DIF[S.dif||'n'].inf);S.m*=1+S.infl;
 S.rentX=Math.min(2,1+((S.rentX||1)-1)*.8);S.wn.unshift(fa(S.y)+': تورم سالانه '+fa(Math.round(S.infl*100))+'٪ ثبت شد.');S.wn=S.wn.slice(0,6);
 if(S.job){S.job.sal*=1+S.infl*.95;S.exp++;S.job.yr=(S.job.yr||0)+1;
  if(S.job.lvl<3&&S.job.yr>=2&&rnd()<.2+S.tr.am/400+S.tr.di/500){S.job.lvl++;S.job.yr=0;S.job.sal*=1.2;log('ارتقا گرفتی: '+jn(S.job)+'. حقوقت ۲۰٪ بالا رفت.');H('ارتقای شغلی: '+jn(S.job))}}
 if(S.retired)S.pen*=1+S.infl*.85;
 S.npcs.forEach(n=>{if(!n.alive)return;n.h=cl(n.h-(n.age<=50?R(0,1):n.age<=65?R(0,3):R(2,5)));
  if(n.h<=2||(n.age>65&&rnd()<(n.age-60)**2/9000)){n.alive=0;D('hp',-30);D('str',15);log(n.n+' ('+RL[n.role]+'ت) درگذشت. دلت شکست.');H(n.n+' ('+RL[n.role]+') درگذشت.');
   if((n.role=='father'||n.role=='mother')&&S.age>=18){const inh={p:5,m:30,w:150}[S.f]*S.m/2;S.cash+=inh;H('از '+RL[n.role]+' ارث رسید: '+fm(inh))}
   if(n.role=='partner')S.married=0}});
 const a=S.age,p=a>50?(a-50)**2/6000:0;if(S.st.h<25||rnd()<p)S.dead=S.st.h<25?'بیماری و فرسودگی بدن':'مرگ طبیعی در پیری'}

/* ================================ Tick ================================== */
function tick(){const s=S,m=s.m,ad=s.age>=18;s.mo++;if(s.mo>11){s.mo=0;s.y++;yearly()}
 if(s.dead)return 1;
 if(s.mo==s.bm)birthday();
 // اقتصاد ماهانه
 const sal=s.job?s.job.sal:0,tax=sal*(sal>40*m?.18:.1),bz=s.biz*m,pen=s.retired?s.pen:0,al=PKM();
 const inc=sal-tax+bz+pen+al,rent=ad&&!s.home?5.5*m*s.rentX:0,fd=ad?4*m:0,tr=ad?(s.car?3:1.5)*m:0,ot=ad?(3+(s.home?1.5:0)+(s.ins?1.5:0)+s.kids*6)*m:0;
 let ln=0;if(s.loan){const L=s.loan;L.bal*=1+L.r/12;ln=L.left<=1?L.bal:Math.min(L.pay,L.bal);L.bal-=ln;L.left--;if(L.bal<.5||L.left<=0){s.cash-=L.bal;s.loan=null;log('اقساط وام تمام شد.')}}
 const sup=ad&&!sal&&!bz&&!pen&&!(s.x&&s.x.jail>0),fam=sup&&s.age<26&&(has('father')||has('mother')),ua=sup&&!fam?(m>=3?10:5)*m:0,dx=DX(),rE=fam?0:rent,fE=fam?0:fd,tE=fam?tr*.5:tr,oE=fam?ot*.3:ot;
 s.last={inc:sal-tax+pen,al,bz,tax,rent:rE*dx,fd:fE*dx,tr:tE*dx,ot:oE*dx,ln,ua};s.cash+=inc+ua-(rE+fE+tE+oE)*dx-ln;
 if(s.inv>0)s.inv*=1+(R(-40,55)+({n:0,b:12,r:-15}[s.eco.t]))/1000;
 if(s.cash<0)s.cash*=1.02;
 const B=s.gb;s.dt.sw=8;
 if(B.debt>0){B.debt*=1.08;if(B.debt>200*m){D('h',-12);D('hp',-8);log('طلبکارها تنبیهت کردند؛ بدهی قماری از کنترل خارج شده.')}}
 if(ad&&B.add>45&&rnd()<B.add/150){const l=Math.min(Math.max(s.cash,0),R(3,12)*m*B.add/40);s.cash-=l;D('hp',-3);B.l+=l;B.n++;log('وسوسه‌ات غالب شد و بی‌اختیار '+fm(l)+' باختی.')}
 if(!B.mb&&B.add>0)B.add=cl(B.add-2);B.mb=0;
 if(s.cash<-300*m){s.cash=0;s.inv=0;s.home=0;s.car=0;s.loan=null;D('hp',-25);log('ورشکسته شدی؛ بدهی‌ها تسویه و دارایی‌ها مصادره شد. باید از صفر شروع کنی.');H('ورشکسته شدی.')}
 // استرس و انرژی
 const ds=-5+(s.job?3:0)+(s.cash<0?2:0)+(B.debt>0?5:0)+Math.min(s.kids,3)*2+(s.tr.am>70?2:0)+(s.eco.t=='r'?1:0)+(s.age>=13&&s.age<18?1:0);
 if(s.age<18)D('h',1);D('str',ds);if(s.st.str>70){D('h',-2);D('hp',-2)}
 s.st.en=Math.min(100,s.st.en+(s.st.str>70?25:40));
 if(s.cash<0)D('hp',-2);if(ad&&!s.job&&!s.study&&!s.retired&&!s.biz&&!(s.x&&s.x.hero))D('hp',-1);
 if(s.st.h<=0)s.dead='بیماری و فرسودگی بدن';if(s.dead)return 1;
 if(s.dt.preg>0&&!--s.dt.preg){s.ev={id:'preg',res:null,d:[]};return 1}
 const el=EV.filter(e=>{const a=s.age;return(!e.a||(a>=e.a[0]&&a<=e.a[1]))&&!(e.once&&s.fl[e.id])&&e.c(s)&&evOK(e)});
 const wt=e=>e.w*evW(e)*(e.id=='layoff'&&s.eco.t=='r'?3:1);
 if(rnd()<.5&&el.length){let r=rnd()*el.reduce((a,e)=>a+wt(e),0);for(const e of el){r-=wt(e);if(r<=0){s.ev={id:e.id,res:null,d:[]};evMark(e);return 1}}}
 return 0}

/* ============================== Career Engine ============================= */
function apply(i){const j=J[i];if(!j||S.age<18||S.retired||S.ev||S.job)return;
 const ch=jobCh(j),L=LANG;
 if(S.edu<j[1])log(L==='fa'?'مدرک لازم برای «'+j[0]+'» را نداری.':'You lack the degree for '+j[0]+'.');
 else if(rnd()*100<ch){S.job={n:j[0],sal:Math.round(j[2]*S.m*DSA()),lvl:0,yr:0};log((L==='fa'?'استخدام شدی: ':'Hired: ')+j[0]+(L==='fa'?'، حقوق ماهانه ':' monthly salary ')+fm(S.job.sal));H((L==='fa'?'استخدام شدی: ':'Hired: ')+j[0])}
 else log((L==='fa'?'درخواست کارت برای «':'Your application for ')+j[0]+(L==='fa'?'» پذیرفته نشد (شانس: ':' was rejected (chance: ')+fa(ch)+'%).');
 advD(7)}
function quit(){if(!S.job)return;const L=LANG;log((L==='fa'?'از شغل ':'Resigned from ')+S.job.n+'.');H((L==='fa'?'استعفا از شغل ':'Resigned from ')+S.job.n);S.job=null;commit()}
/* Unified university study system: startStudy requires prior admission (XAdmit) 
   If no admission, auto-assigns default university with self-funded */
function startStudy(i){const p=PR[i],L=LANG;if(!p||S.age<18||S.study||S.ev)return;if(S.edu>=p[1])return msg(L==='fa'?'این مدرک را قبلاً داری.':'You already have this degree.');
 if(i==2&&S.st.iq<70)return msg(L==='fa'?'هوشت برای کنکور پزشکی کافی نیست.':'Your IQ is too low for medical school.');
 /* Auto-create admission if not present (backward compat) */
 const x=XE();if(!x.adm){x.ut=0;x.fund='p';x.adm={i:0,m:'p',y:S.age}}
 S.study={i,done:0};log((L==='fa'?'وارد دانشگاه شدی: ':'Enrolled in university: ')+p[0]);H((L==='fa'?'ثبت‌نام در ':'Enrolled in ')+p[0]);commit()}
/* term() processes one semester; tuition handled by funding method */
function term(){const p=S.study&&PR[S.study.i],L=LANG;if(!p||S.ev)return;
 const x=XE(),u=UNI[x.ut||0],baseT=8*S.m,fullT=u[1]*S.m;
 /* Tuition: self=pays full, guardian=partial based on family, scholarship=pays nothing */
 if(x.fund==='p'){if(S.cash<fullT)return msg((L==='fa'?'پول شهریه را نداری (':'You lack tuition (')+fm(fullT)+').');S.cash-=fullT}
 else if(x.fund==='f'){const par=has('father')?g('father'):has('mother')?g('mother'):null;const cov=par?({'ضعیف':.2,'poor':.2,'متوسط':.5,'middle':.5,'خوب':.85,'wealthy':.85}[par.fin]||.5):0;const pay=fullT*(1-cov);if(S.cash<pay)return msg((L==='fa'?'پول کافی نداری (':'You lack funds (')+fm(pay)+').');S.cash-=pay;log((L==='fa'?'قیم بخشی از شهریه را پرداخت.':'Guardian covered part of tuition.'))}
 else if(x.fund==='s'){log(L==='fa'?'بورسیه شهریه را پوشش داد.':'Scholarship covered tuition.')}
 S.study.done++;D('iq',2);D('en',-20);D('str',5);TC('di',.4);
 if(S.study.done>=p[2]){S.edu=Math.max(S.edu,p[1]);log((L==='fa'?'فارغ‌التحصیل شدی: ':'Graduated: ')+p[0]+'!');H((L==='fa'?'فارغ‌التحصیلی: ':'Graduation: ')+p[0]);S.study=null}else log((L==='fa'?'ترم ':'Semester ')+fa(S.study.done)+(L==='fa'?' از ':' of ')+fa(p[2])+(L==='fa'?' گذشت.':' completed.'));
 advD(180)}
function dropStudy(){if(!S.study)return;const L=LANG;log(L==='fa'?'تحصیل را رها کردی.':'You dropped out.');S.study=null;D('hp',-4);commit()}
function doRetire(){if(S.age<60||S.retired)return msg(S.retired?'قبلاً بازنشسته شده‌ای.':'بازنشستگی از ۶۰ سالگی ممکن است.');
 S.pen=S.job?S.job.sal*.4:5*S.m;S.job=null;S.study=null;S.retired=1;D('str',-15);log('بازنشسته شدی؛ حقوق بازنشستگی ماهانه '+fm(S.pen));H('بازنشسته شدی.');commit()}

/* ============================= Economy Engine ============================= */
function buyHouse(){if(S.age<18)return msg('خرید خانه From age 18 ممکن است.');if(S.home)return msg('خانه داری.');const p=housePrice();
 if(S.cash<p)return msg('قیمت یک آپارتمان معمولی حدود '+fm(p)+' است و موجودی‌ات کافی نیست؛ قوانین جهان اجازه نمی‌دهند.');
 S.cash-=p;S.home=1;D('hp',8);D('str',-5);H('خانه خریدی.');msg('خانه را خریدی. دیگر اجاره نمی‌دهی.')}
function sellHouse(){if(!S.home)return msg('خانه‌ای نداری.');const p=housePrice()*.97;S.cash+=p;S.home=0;msg('خانه را فروختی: '+fm(p)+'. از ماه بعد اجاره می‌دهی.')}
function buyCar(){if(S.age<18)return msg('You must be at least 18 to buy a car.');if(!XDl().has)return msg('You need a driver’s license first. Take the test in the Life Path tab.');if(S.car)return msg('You already own a car.');const p=carPrice();if(S.cash<p)return msg('A car costs about '+fm(p)+'.');S.cash-=p;S.car=1;D('hp',5);H('You bought a car.');msg('You bought a car; its monthly cost is higher than public transport.')}
function sellCar(){if(!S.car)return;const p=carPrice()*.6;S.cash+=p;S.car=0;msg('خودرو را فروختی: '+fm(p))}
function toggleIns(){if(S.age<18)return;S.ins=S.ins?0:1;msg(S.ins?'بیمه درمانی گرفتی: ماهانه '+fm(1.5*S.m)+'، هزینه درمان ۶۰٪ کمتر.':'بیمه را لغو کردی.')}
function invest(a){a=Math.floor(+a);if(S.age<18||!(a>0)||a*S.m>S.cash)return msg('موجودی کافی نیست یا مبلغ نامعتبر است.');pay(a);S.inv+=a*S.m;msg('مبلغ '+fm(a*S.m)+' را وارد بازار کردی؛ نوسان دارد.')}
function withdraw(){if(S.inv<=0)return;S.cash+=S.inv;msg('سرمایه‌گذاری را نقد کردی: '+fm(S.inv));S.inv=0}
function takeLoan(u,n){if(S.ev)return;if(S.loan)return msg('یک وام فعال داری؛ ابتدا آن را تسویه کن.');if(S.age<21)return msg('وام بانکی از ۲۱ سالگی ممکن است.');
 if(!S.job&&!S.biz&&!S.retired)return msg('بانک بدون درآمد مستمر وام نمی‌دهد.');
 const P=u*S.m,r=C[S.co].lr,i=r/12,pm=P*i/(1-Math.pow(1+i,-n)),cap=(S.job?S.job.sal:0)*.4+S.biz*S.m*.5+(S.retired?S.pen*.4:0);
 if(pm>cap)return msg('قسط ماهانه '+fm(pm)+' نسبت به درآمدت زیاد است؛ بانک رد کرد.');
 S.cash+=P;S.loan={bal:P,pay:pm,left:n,r};D('str',4);msg('وام '+fm(P)+' گرفتی؛ قسط ماهانه '+fm(pm)+' برای '+fa(n)+' ماه (نرخ سالانه '+fa(Math.round(r*100))+'٪).')}
function payLoan(){if(!S.loan)return;const p=S.loan.bal;if(S.cash<p)return msg('برای تسویه کامل '+fm(p)+' لازم است.');S.cash-=p;S.loan=null;D('str',-6);msg('وام تسویه شد.')}

/* ============================== Social Engine ============================= */
/* Activities with dynamic bilingual labels (objects for runtime translation) */
const A={
play:[{fa:'بازی و گردش (۱ روز)',en:'Play (1 day)'},1,()=>{const L=LANG;D('hp',6);D('en',-8);D('str',-3);return L==='fa'?'بازی کردی و حسابی خوش گذشت.':'You played and had a great time.'},s=>s.age<13],
study:[{fa:'مطالعه و مهارت‌آموزی (۱ روز)',en:'Study (1 day)'},1,()=>{const L=LANG;D('iq',1);D('en',-10);D('str',2);TC('di',.5);return L==='fa'?'چیز تازه‌ای یاد گرفتی.':'You learned something new.'},s=>1],
gym:[{fa:'باشگاه و ورزش (۱ روز)',en:'Gym (1 day)'},1,()=>{const L=LANG;cst(.3);D('h',2);D('en',-12);D('hp',2);D('str',-4);TC('di',.4);return L==='fa'?'ورزش کردی و بدنت سبک‌تر شد.':'You exercised and felt lighter.'},s=>s.age>=12],
friends:[{fa:'دیدن دوستان (۱ روز)',en:'See friends (1 day)'},1,()=>{const L=LANG;cst(1);D('hp',5);D('en',-8);D('str',-4);NR(g('friend'),4+(S.tr.so>60?2:0));mem(g('friend'),L==='fa'?'با هم بیرون رفتید.':'You hung out together.');TC('so',.5);return L==='fa'?'شب خوبی بود.':'It was a good night.'},s=>s.age>=6],
hobby:[{fa:'سرگرمی خلاق (۱ روز)',en:'Creative hobby (1 day)'},1,()=>{const L=LANG;D('hp',4);D('en',-8);D('str',-3);TC('cr',.7);return L==='fa'?'ساعت‌ها غرق کار خلاقانه شدی.':'You spent hours absorbed in creative work.'},s=>1],
rest:[{fa:'استراحت (۱ روز)',en:'Rest (1 day)'},1,()=>{const L=LANG;D('en',25);D('hp',2);D('str',-8);return L==='fa'?'کمی انرژی گرفتی.':'You regained some energy.'},s=>1],
side:[{fa:'پروژه فریلنسری (۱ ماه)',en:'Freelance project (1 month)'},30,()=>{const L=LANG;const v=R(3,8)*S.m*(1+S.tr.cr/150);S.cash+=v;D('en',-25);D('hp',-3);D('str',5);S.st.fame=cl(S.st.fame+1);return L==='fa'?'درآمد جانبی: '+fm(v):'Side income: '+fm(v)},s=>s.age>=16&&!s.retired]};
const actLabel=k=>{const a=A[k];if(!a)return k;const lbl=a[0];return typeof lbl==='object'?(lbl[LANG]||lbl.en):lbl};
function act(k){const a=A[k],L=LANG;if(!a||S.ev||S.dead)return;if(S.st.en<15&&k!='rest')return msg(L==='fa'?'انرژی‌ات کم است؛ اول استراحت کن.':'Your energy is low; rest first.');log(a[2]());advD(a[1])}
function npcAct(r,k){const n=g(r),L=LANG;if(!n.alive||S.ev)return;let t;
 /* Smart NPC memory: characters reference past interactions */
 const memRef=()=>{if(!n.mem||n.mem.length<2)return '';const recent=n.mem[1]||n.mem[0];if(L==='fa'){if(recent.includes('هدیه'))return ' به هدیه قبلی‌ات هم اشاره کرد.';if(recent.includes('پول'))return' از وام قبلی صحبت کرد.';if(recent.includes('بیرون'))return' از گردش قبلی خوشحال بود.'}else{if(recent.includes('gift'))return' mentioned your last gift.';if(recent.includes('money'))return' brought up the last loan.';if(recent.includes('out'))return' reminisced about your last outing.'}return ''};
 if(k=='talk'){NR(n,4,2,0,-3);mem(n,L==='fa'?'با او صحبت کردی.':'Talked with them.');const refs=[L==='fa'?'او از روزهای قدیم حرف زد.':'They talked about old days.',L==='fa'?'گفت‌وگوی آرامی داشتید.':'You had a calm chat.',L==='fa'?'کمی نگران آینده‌ات بود.':'They were a bit worried about your future.'];t=pick(refs)+memRef()}
 if(k=='money'){const o=rnd()<n.trust/100*({p:.4,m:.7,w:1}[S.f]);const v=5*S.m;if(o){S.cash+=v;NR(n,-2,-3);mem(n,L==='fa'?'ازش پول خواستی.':'Asked for money.');t=n.n+' '+(L==='fa'?'به تو ':'gave you ')+fm(v)+(L==='fa'?' داد.':'')}else{NR(n,-3,-2,0,6);mem(n,L==='fa'?'ازش پول خواستی و نشد.':'Asked for money, denied.');t=n.n+' '+(L==='fa'?'نتوانست یا نخواست کمک کند.':'could not or would not help.')}}
 if(k=='gift'){if(!can(2))t=L==='fa'?'پول کافی برای هدیه نداری.':'Not enough money for a gift.';else{cst(2);NR(n,8,2,2);mem(n,L==='fa'?'برایش هدیه گرفتی.':'Gave them a gift.');t=n.n+' '+(L==='fa'?'از هدیه خوشحال شد.':'was happy with the gift.')}}
 if(k=='out'){cst(1.5);NR(n,5,3);D('hp',4);D('str',-3);mem(n,L==='fa'?'با هم بیرون رفتید.':'Went out together.');t=L==='fa'?'گردش خوبی بود.':'It was a nice outing.'}
 if(k=='sorry'){if(n.anger<5)t=L==='fa'?'لازم نبود؛ او ناراحت نبود.':'No need; they were not upset.';else{NR(n,2,3,0,-25);mem(n,L==='fa'?'عذرخواهی کردی.':'Apologized.');t=L==='fa'?'بخشیدت.':'They forgave you.'}}
 if(k=='cut'){NR(n,-40,-30,-10,10);n.cut=1;if(r=='partner'){S.dt.bk++;S.married=0}mem(n,L==='fa'?'ارتباط را قطع کردی.':'Cut ties.');t=L==='fa'?'ارتباط را قطع کردی.':'You cut ties.'}
 log(t);if(k=='talk')commit();else advD(1)}
function marry(){const p=g('partner'),L=LANG;if(!has('partner')||S.married)return;if(p.love<70||p.trust<55)return msg(L==='fa'?'رابطه‌تان هنوز به ازدواج نرسیده (محبت ≥ ۷۰ و اعتماد ≥ ۵۵ لازم است).':'Your relationship is not ready for marriage (love ≥ 70 and trust ≥ 55 required).');
 res(()=>{pay(15);S.married=1;D('hp',12);D('str',-5);NR(p,10,10,5,-10);NR(g('mother'),6,4);mem(p,L==='fa'?'ازدواج کردید.':'Got married.');H(L==='fa'?'با '+p.n+' ازدواج کردی.':'Married '+p.n+'.');return L==='fa'?'با '+p.n+' ازدواج کردی. هزینه مراسم '+fm(15*S.m)+' شد.':'You married '+p.n+'. Wedding cost '+fm(15*S.m)+'.'})}
function haveChild(){const p=g('partner'),L=LANG;if(!S.married||!has('partner'))return;if(S.age<20||S.age>45)return msg(L==='fa'?'این سن برای فرزندآوری مناسب نیست.':'This age is not suitable for having children.');
 res(()=>{S.kids++;pay(10);D('hp',10);D('str',10);D('en',-20);NR(p,6,4);H(L==='fa'?'صاحب فرزند شدی.':'Had a child.');return L==='fa'?'فرزندی به خانواده اضافه شد. هزینه ماهانه فرزند به خرجت اضافه می‌شود.':'A child joined your family. Monthly cost added to expenses.'})}
function divorce(){const p=g('partner'),L=LANG;if(!S.married||!has('partner'))return;
 res(()=>{if(S.cash>0)S.cash/=2;p.cut=1;S.married=0;S.dt.bk++;D('hp',-15);D('str',12);mem(p,L==='fa'?'از هم جدا شدید.':'Divorced.');H(L==='fa'?'از '+p.n+' جدا شدی.':'Divorced '+p.n+'.');return L==='fa'?'طلاق گرفتید و نصف دارایی نقدی تقسیم شد.':'You divorced and split cash assets in half.'})}

/* ---- گوشی: دوست‌یابی و شرط‌بندی ---- */
const card=()=>{const pf=S.dt.pf||(S.g=='Male'?'Female':'Male');return{n:pick(pf=='Female'?['Nora','Sienna','Mia','Elena','Paige','Tessa']:['Adam','Kai','Peter','Sam','Max','Blake']),a:R(18,34),j:pick(['طراح','پرستار','مهندس','عکاس','دانشجو','بارتندر','مربی ورزش','نویسنده']),b:pick(['قهوه و کتاب','آخر هفته‌ها دنبال ماجراجویی','کم‌حرف، اما دلپذیر','شوخ‌طبعی بهترین ویژگی من است','فقط آدم‌های واقعی']),lk:R(35,95),it:pick([0,0,1,1,2]),lv:0}};
function bet(k,a){a=Math.floor(+a);const G=BG[k],B=S.gb;if(S.ev||S.age<18||!G)return;if(!(a>0)||a*S.m>S.cash)return msg('موجودی کافی نیست؛ مبلغ را کمتر کن.');
 res(()=>{const x=a*S.m,w=rnd()<G[1];B.n++;B.mb=1;S.cash-=x;
  if(w){S.cash+=x*G[2];B.w+=x*(G[2]-1);B.s++;B.add=cl(B.add+3+B.s*2);D('hp',5);return G[0]+': برنده شدی! '+fm(x*(G[2]-1))+' سود. حس شانس، خطرناک‌ترین دارو است.'}
  B.l+=x;B.s=0;B.add=cl(B.add+(x>S.cash*.3?6:2));D('hp',-4);D('str',4);return G[0]+': باختی؛ '+fm(x)+' رفت. یک دور دیگر، شاید جبران شود؟'},1)}
function loanShark(){if(S.ev||S.age<18)return;res(()=>{S.cash+=50*S.m;S.gb.debt+=50*S.m;D('hp',-2);D('str',6);return 'رباخور بدون ضامن '+fm(50*S.m)+' داد؛ بهره‌اش ۸٪ در ماه است و وقتی سر برسد، مهربان نیست.'})}
function payD(){if(S.ev)return;res(()=>{const p=Math.min(Math.max(S.cash,0),S.gb.debt);S.cash-=p;S.gb.debt-=p;D('hp',3);D('str',-4);return 'بخشی از بدهی را پرداختی: '+fm(p)})}
function swp(r){const Tt=S.dt;if(S.ev||S.age<18)return;if(Tt.sw<1)return msg('سوایپ‌های امسال تمام شد؛ سال بعد دوباره.');if(!Tt.cards.length)Tt.cards.push(card());const c=Tt.cards.shift();Tt.sw--;
 if(r&&rnd()<.22+S.st.lk/220+S.st.fame/300+S.tr.so/500){Tt.mt++;Tt.ms.push(c);res(()=>'با '+c.n+' مچ شدی!')}else msg(r?c.n+' لایکت را پاسخ نداد.':'رد کردی.')}
function dte(i){const c=S.dt.ms[i];if(S.ev||!c)return;if(!can(2)||S.st.en<15)return msg('پول یا انرژی کافی برای قرار نداری.');
 res(()=>{pay(2);D('en',-10);S.dt.dd++;if(rnd()<.5+S.tr.cf/250+S.st.lk/400){c.lv=Math.min(3,c.lv+1);D('hp',6);return 'قرار با '+c.n+' خوب پیش رفت؛ نزدیک‌تر شدید.'}D('hp',-3);return 'قرار با '+c.n+' ناجور بود؛ شیمی‌تان جور نشد.'},1)}
function rls(i){if(S.ev)return;const c=S.dt.ms.splice(i,1)[0];if(!c)return;S.npcs=S.npcs.filter(n=>n.role!='partner');S.married=0;S.npcs.push(mk('partner',c.n,c.a,'علاقه‌مند به '+c.j,'می‌خواهد رابطه‌تان جدی شود','متوسط',62,'از طریق گوشی آشنا شدید.'));res(()=>{D('hp',10);return 'با '+c.n+' وارد رابطه شدی. از تب «روابط» مراقبش باش.'})}
function ons(i,p){const c=S.dt.ms[i],Tt=S.dt,sx=C[S.co].sx;if(S.ev||!c)return;
 res(()=>{if(rnd()>[.7,.45,.1][c.it]+S.st.lk/300+S.st.fame/400){D('hp',-4);return c.n+' پیشنهادت را رد کرد؛ کمی خجالت‌زده شدی.'}
  Tt.os++;Tt.ms.splice(i,1);D('hp',8);D('en',-15);let t='شبی را با '+c.n+' گذراندی؛ صبح هرکدام راه خودتان رفتید.';const pt=g('partner');
  if(rnd()<(p?.03:.2)){D('h',-R(8,16));med(3);t+=' چند هفته بعد معلوم شد عفونت منتقل شده؛ درمانش گران و تلخ بود.'}
  if(rnd()<(p?.03:.16))Tt.preg=R(2,3);
  if(has('partner')&&rnd()<.4){NR(pt,-45,-55,-30,45);D('hp',-12);mem(pt,'خیانتت را فهمید.');t+=' '+pt.n+' ماجرا را فهمید و اعتمادش از بین رفت.';if(rnd()<.5){pt.cut=1;S.married=0;Tt.bk++;t+=' رابطه تمام شد.'}}
  if(rnd()<sx){['father','mother'].forEach(r=>NR(g(r),-8,-15,-10,12));D('hp',-6);t+=' شایعه‌اش به خانواده رسید و آبرویت زیر سؤال رفت.'}
  else if(rnd()<.4){D('hp',-6);t+=' صبح که رفت، حس پوچی داشتی.'}
  return t},1)}

/* ================================ World Engine ============================ */
function migrate(co){if(!C[co]||co==S.co||S.ev)return;const c=400*S.m;
 if(S.age<18)return msg('مهاجرت مستقل From age 18 ممکن است.');if(S.edu<1)return msg('برای ویزای کاری حداقل کارشناسی لازم است.');
 if(S.cash+(S.home?housePrice()*.97:0)<c)return msg('برای مهاجرت حدود '+fm(c)+' لازم داری.');
 res(()=>{const r=C[co].m/C[S.co].m;if(S.home){S.cash+=housePrice()*.97;S.home=0}if(S.car){S.cash+=carPrice()*.5;S.car=0}
  S.cash-=c;S.cash*=r;S.inv*=r;S.gb.debt*=r;if(S.loan){S.loan.bal*=r;S.loan.pay*=r;S.loan.r=C[co].lr}
  S.m*=r;S.co=co;S.city=C[co].c[0];S.job=null;S.biz=0;S.infl=C[co].i;S.eco={t:'n',y:0};
  S.npcs.forEach(n=>{if(n.role=='father'||n.role=='mother')NR(n,-5,-3)});D('str',12);D('hp',3);
  H('به '+co+' مهاجرت کردی.');return 'به '+co+' مهاجرت کردی. خانه، خودرو و شغل قبلی‌ات را رها کردی و ارزش دارایی‌ها به اقتصاد تازه تبدیل شد.'})}
function moveCity(city){if(S.ev||S.age<18||!C[S.co].c.includes(city)||city==S.city)return;if(!can(10))return msg('هزینه جابه‌جایی '+fm(10*S.m)+' است.');
 res(()=>{pay(10);S.city=city;S.job=null;D('str',6);H('به '+city+' نقل مکان کردی.');return 'به '+city+' رفتی. شغل قبلی‌ات را از دست دادی ولی شروعی تازه داری.'})}

/* ============================== Achievements ============================== */
const ACH=[['edu','🎓','فارغ‌التحصیل دانشگاه',()=>S.edu>=1],['doc','🩺','پزشک شدی',()=>S.edu>=3],['job','💼','اولین شغل',()=>S.exp>0||!!S.job||!!S.retired],['home','🏠','صاحب خانه',()=>!!S.home],['car','🚗','صاحب خودرو',()=>!!S.car],['love','💞','اولین رابطه جدی',()=>has('partner')],['wed','💍','ازدواج',()=>!!S.married],['kid','👶','پدر یا مادر شدی',()=>S.kids>0],['biz','💡','کسب‌وکار شخصی',()=>!!S.biz],['bil','💰','دارایی خالص ۱ میلیارد',()=>net()>=1000*S.m],['mig','✈️','مهاجرت',()=>S.co!=S.sco],['ret','🌅','بازنشستگی',()=>!!S.retired],['six','🎂','رسیدن به ۶۰ سالگی',()=>S.age>=60],['eig','🏆','رسیدن به ۸۰ سالگی',()=>S.age>=80]];
function chkAch(){if(!S)return;ACH.forEach(a=>{if(S.ach[a[0]]===undefined&&a[3]()){S.ach[a[0]]=S.age;H('دستاورد: '+a[2]);S.news='دستاورد تازه: '+a[1]+' '+a[2]}})}

/* ================================ Event Engine ============================ */
const fr=()=>g('friend');
const EV=[
// ---- کودکی و نوجوانی ----
{id:'steps',e:'👣',w:3,a:[1,2],once:1,c:s=>1,t:'First Steps',x:'Today you stood on your own feet for the first time. Your parents watch you, holding their breath.',o:[
 ['I walk toward Mom',()=>{NR(g('mother'),8,5);D('hp',4);return 'Mom scooped you up, laughing; she kept the video on her phone for years.'}],
 ['I walk toward Dad',()=>{NR(g('father'),8,5);D('hp',4);return 'Dad lifted you over his head; even the quietest man in the world was happy that day.'}]]},
{id:'school1',e:'🎒',w:5,a:[6,7],once:1,c:s=>1,t:'First Day of School',x:'Your new bag is on your shoulder and your stomach is in knots. You have to decide at the school gate.',o:[
 ['I walk into class with excitement',()=>{T('cf',4);TC('so',.8);D('hp',4);return 'The first day went better than expected, and you met a few kids right away.'}],
 ['I don’t let go of Mom’s hand',()=>{NR(g('mother'),5,3);D('str',4);return 'Mom stayed beside you until the first bell. It took a while to get used to the classroom.'}],
 ['I talk to the kid next to me',()=>{T('so',3);const f=fr();NR(f,6,5);mem(f,'You met on the first day of school.');return 'That kid later became a close friend.'}]]},
{id:'bully',e:'😠',w:2,a:[7,16],c:s=>1,t:'Bullying at School',x:'A classmate has been picking on you for a while and mocks you in front of others.',o:[
 ['I tell my teacher or parents',()=>{NR(g('mother'),3,6);NR(g('father'),3,6);D('str',-6);return 'The adults solved it and your sense of safety came back.'}],
 ['I stand up to them',()=>rnd()<.4+S.tr.cf/200?(T('cf',5),D('hp',4),'Standing your ground worked, and they left you alone.'):(D('h',-6),D('hp',-6),NR(g('father'),0,0,0,5),'The fight ended badly and you went home bruised and upset.')],
 ['I stay silent',()=>{T('cf',-4);D('str',10);D('hp',-6);return 'You stayed quiet for months and it weighed on you.'}]]},
{id:'passion',e:'🎨',w:3,a:[7,15],once:1,c:s=>1,t:'Discovering a Passion',x:'In an after-school class you found something that makes you lose track of time. This choice will shape your talents for years.',o:[
 ['Painting and art',()=>{const x=XE();T('cr',8);D('hp',4);x.sk.art+=20;x.passion='art';H('Discovered a passion for art');return 'You spent hours alone with paint and paper; your creativity blossomed. Your art skill jumped and future creative careers are now open to you.'}],
 ['Team sports',()=>{const x=XE();D('h',5);T('di',5);T('so',3);x.sk.sport+=20;x.passion='sport';H('Discovered a passion for sports');return 'Sports built your body and your spirit. Your athletic skill improved; a sports career path is now available.'}],
 ['Science and books',()=>{const x=XE();D('iq',4);T('di',3);T('am',2);x.sk.code+=15;x.passion='science';H('Discovered a passion for science');return 'Curiosity carried you into a new world. Your technical skill grew; science and tech careers are more open.'}],
 ['Music and friendly circles',()=>{const x=XE();T('so',6);T('cr',3);D('hp',4);x.sk.music+=20;x.passion='music';H('Discovered a passion for music');return 'You made new friends in the music group and your musical talent emerged; a music career path is now open.'}]]},
{id:'exam',e:'📝',w:3,a:[9,17],c:s=>1,t:'Important Exam',x:'You have an important exam tomorrow and haven’t studied yet. What do you do tonight?',o:[
 ['I study until morning',()=>{D('iq',2);T('di',3);D('str',8);D('en',-20);return 'You got a good grade but were wrecked from lack of sleep.'}],
 ['I review calmly and steadily',()=>{D('iq',1);D('str',-2);TC('di',.7);return S.tr.di>55?'Your discipline paid off and you took the exam calmly.':'You got an average grade, but you felt fine.'}],
 ['I cheat',()=>rnd()<.4?(NR(g('father'),-4,-10,-8,10),NR(g('mother'),-4,-10,-8,10),T('di',-3),D('hp',-6),'The proctor noticed and told your parents.'):(T('di',-2),D('hp',2),'You got the grade, but your conscience bothers you.')]]},
{id:'pfight',e:'🗯',w:2,a:[3,16],c:s=>has('father')&&has('mother')&&XE().pc>=45,t:'Parents’ Fight',x:'At night you hear your parents shouting in their room. Your heart trembles.',o:[
 ['I step in and tell them to stop',()=>{T('cf',3);D('str',6);NR(g('mother'),2,3);NR(g('father'),2,3);return 'They went quiet and looked at you, ashamed. The night calmed down.'}],
 ['I stay in my room',()=>{D('str',8);D('hp',-4);return 'You listened under the blanket until the noise died down.'}],
 ['I ask Mom tomorrow',()=>{NR(g('mother'),5,4);D('str',-2);return 'Mom calmly explained that grown-ups argue sometimes too.'}]]},
{id:'trip',e:'🚗',w:2,a:[4,14],c:s=>1,t:'Family Trip',x:'Your parents have decided to go on a trip this weekend.',o:[
 ['I enjoy the trip and stay close to them',()=>{D('hp',8);D('str',-6);NR(g('father'),4,3);NR(g('mother'),4,3);return 'You made a memory that will stay with you for years.'}],
 ['I mostly stay busy on my phone',()=>{D('hp',2);NR(g('father'),-2,0,0,2);return 'The trip went by, but you drifted a little apart.'}]]},
{id:'crush',e:'💘',w:3,a:[14,17],once:1,c:s=>1,t:'First Crush',x:'There is someone in class who makes your heart beat faster. How you handle this will affect your confidence and social skills for years.',o:[
 ['I honestly say I like them',()=>{const x=XE();if(rnd()<.35+S.tr.cf/250+S.st.lk/400){D('hp',10);T('cf',5);x.firstCrush='success';H('First crush said yes');return 'They smiled back; your first romance began. Your confidence soared and future relationships will benefit from this early success.'}D('hp',-8);T('cf',2);x.firstCrush='rejected';H('First crush rejected');return 'The answer was no. You were hurt, but you kept your courage and learned resilience.'}],
 ['I write them a letter',()=>{const x=XE();T('cr',5);D('hp',3);T('cf',2);x.firstCrush='letter';H('First crush letter');return 'You handed over the letter, heart pounding. You never got a clear answer, but you saw their smile. Your creativity and courage both grew.'}],
 ['I just watch from afar',()=>{const x=XE();D('hp',-2);T('cf',-3);x.firstCrush='missed';H('Missed first crush');return 'Months passed and the chance never came. Your confidence took a hit; future social interactions will be slightly harder.'}]]},
{id:'konkoor',e:'🏫',w:5,a:[17,17],once:1,c:s=>1,t:'Entrance Exam Year',x:'This is a decisive year and everyone talks about the future.',o:[
 ['I study day and night',()=>{D('iq',4);T('di',5);D('str',12);D('en',-20);return 'It was the hardest year of your life, but you came out more prepared than ever.'}],
 ['Both study and life',()=>{D('iq',2);D('hp',3);return 'You kept your balance and your body held up.'}],
 ['I give up on the exam',()=>{D('iq',-1);D('hp',4);NR(g('father'),-4,-3,-3,6);return 'You felt relieved, but your father wasn’t happy.'}]]},
// ---- مشترک ----
{id:'cold',e:'🤒',w:4,a:[1,120],c:s=>1,t:'Severe Cold',x:()=>S.age<13?'You’ve had a fever and body aches for days and feel weak; your parents are worried.':'You’ve had a fever and body aches for days. Life goes on, but your body is warning you.',o:[
 ['Rest and treatment',()=>{med(1);D('h',-2);D('en',10);return 'You got better after a week.'+(S.age>=18?' Treatment costs were paid.':'')}],
 ['I ignore it and carry on',()=>{D('h',S.age<13?-3:-9);D('hp',-4);return 'You got weaker and the illness dragged on.'}]]},
{id:'inherit',e:'🕊',w:1,a:[20,120],c:s=>1,t:'Small Inheritance',x:'A distant relative has passed away and part of their estate has come to you.',o:[['I accept',()=>{S.cash+=15*S.m;return fm(15*S.m)+' was deposited into your account.'}]]},
{id:'crash',e:'🛵',w:1,a:[16,120],c:s=>1,t:'Minor Accident',x:'On your way home, a motorcyclist hits you. The injury isn’t serious.',o:[['I get treated',()=>{med(3);D('h',-4);D('str',4);return 'You were in pain for a few days'+(S.age>=18?' and it cost money.':'.')}]]},
{id:'newface',e:'🎉',w:2,a:[14,120],c:s=>1,t:'New Acquaintance',x:'At a get-together you meet someone who shares many of your interests.',o:[
 ['I get their number',()=>{D('hp',6);NR(fr(),2);TC('so',.8);return 'You made a new friend and your circle grew.'}],
 ['I feel shy and leave',()=>{D('hp',-3);return 'On the way back you felt a little regret.'}]]},
// ---- بزرگسالی ----
{id:'night',e:'📞',w:3,a:[20,120],c:s=>g('father').alive,t:'Midnight Call',x:'It’s almost 11:40 PM when your phone rings. Your mother says anxiously: “Your father felt unwell at work today and was taken to the hospital. The doctors haven’t said anything definite yet.”',o:[
 ['I go to the hospital right away',()=>{const f=g('father');D('en',-30);D('str',6);NR(f,10,8,3);mem(f,'You were by his side the night at the hospital.');f.h=cl(f.h+5);return 'You stayed with Dad until morning. You’re exhausted, but he squeezed your hand. Diagnosis: nervous strain and a mild heart problem.'}],
 ['I call the doctor first',()=>{const f=g('father');NR(f,2,4,2);mem(f,'You asked the doctor before going.');return 'The doctor said he’s stable. You went in the morning, more at ease. Dad was grateful.'}],
 ['I talk to Mom and calm her down',()=>{NR(g('mother'),8,5);mem(g('mother'),'You calmed her over the phone that night.');return 'Mom calmed down a little. Dad was discharged the next day.'}],
 ['I wait until morning',()=>{const f=g('father');NR(f,-10,-8,-3,10);mem(f,'You didn’t come the night he was sick.');return 'When you arrived in the morning, Dad said nothing. That silence was heavier than any complaint.'}]]},
{id:'promo',e:'📈',w:3,a:[20,120],c:s=>s.job&&!s.retired,t:'Possible Promotion',x:'Your manager is happy with your work and hinted at a possible promotion. But it comes with more responsibility.',o:[
 ['I take on more responsibility',()=>{S.job.sal*=1.12;D('en',-15);D('hp',-3);D('str',8);S.exp++;return 'Your salary rose 12%, but you get home later at night.'}],
 ['I ask directly for a raise',()=>rnd()<.35+S.st.iq/300+S.tr.cf/300?(S.job.sal*=1.08,'Your manager agreed: an 8% raise.'):(D('hp',-5),'Your manager said “there’s no budget.” You feel a bit discouraged.')],
 ['I stay quiet for now',()=>'Nothing happened. The opportunity left as quietly as it came.']]},
{id:'offer',e:'💼',w:2,a:[22,58],c:s=>s.job&&!s.retired,t:'Better Job Offer',x:'Another company offered you a higher salary, but you’d start over and have to fit in with new coworkers.',o:[
 ['I accept',()=>{S.job.sal*=1.2;S.job.lvl=0;S.job.yr=0;D('str',8);H('Changed companies for a higher salary.');return 'Your salary rose 20%, but you must rebuild your standing.'}],
 ['I decline',()=>{D('hp',-1);return 'You stayed. Maybe the next chance will be better.'}]]},
{id:'lend',e:'🤝',w:3,a:[18,120],c:s=>has('friend'),t:'Loan Request',x:()=>`${g('friend').n}, your close friend, says with embarrassment that they’re in financial trouble and need to borrow ${fm(10*S.m)}.`,o:[
 ['I lend it',()=>{const f=g('friend');if(S.cash<10*S.m)return 'You don’t have the money. You had to apologize.';pay(10);NR(f,6,10);mem(f,'You lent them money.');return rnd()<.6?'A few months later they paid you back in full and were grateful.':(f.trust=cl(f.trust-15),'They still haven’t paid you back and are slow to answer your calls.')}],
 ['I don’t lend it',()=>{const f=g('friend');NR(f,-8,-3,0,6);mem(f,'You turned down their request for a loan.');return 'They accepted, but their voice turned cold.'}],
 ['I give half the amount',()=>{if(S.cash<5*S.m)return 'You can’t even afford that.';pay(5);NR(g('friend'),3,4);return 'They said even this is a big help.'}]]},
{id:'stock',e:'📊',w:2,a:[20,120],c:s=>s.cash>25*s.m,t:'Stock Tip',x:'A coworker says one stock “is sure to go up.” It’s risky.',o:[
 ['I put in a big chunk',()=>{pay(20);const k=rnd()<.5;S.inv+=k?20*S.m*1.6:20*S.m*.4;return k?'It actually paid off: your investment grew 60%.':'The market reversed and 60% of your investment evaporated.'}],
 ['No, I won’t take the risk',()=>'Two months later the stock moved 10%; not enough to make you regret it.']]},
{id:'rent',e:'🏠',w:2,a:[18,120],c:s=>!s.home,t:'Rent Increase',x:'Your landlord announced that rent goes up 20% next month.',o:[
 ['I accept',()=>{S.rentX*=1.2;return 'Rent went up and your monthly costs increased.'}],
 ['I negotiate',()=>rnd()<.45+S.tr.cf/400?(S.rentX*=1.08,'You agreed on 8%.'):(S.rentX*=1.25,'The landlord got angry and announced 25%.')]]},
{id:'layoff',e:'🧾',w:1.5,a:[22,120],c:s=>s.job&&!s.retired,t:'Layoffs',x:'The company announced layoffs and your name is on the list.',o:[
 ['I accept and look for work',()=>{S.job=null;D('str',10);return 'You lost your job. You can find a new one in the “Work & study” tab.'}],
 ['I negotiate',()=>rnd()<.35+S.st.iq/300+S.tr.cf/400?'You stayed, but with no raise.':(S.job=null,D('hp',-8),D('str',10),'The negotiation went nowhere and you were fired.')]]},
{id:'mom',e:'💌',w:3,a:[19,120],c:s=>g('mother').alive&&!g('mother').cut,t:'Missing Mom',x:'Your mother calls: “You haven’t come by in a while, I just wanted to hear your voice.”',o:[
 ['I’ll visit tomorrow',()=>{const m=g('mother');NR(m,8,4);D('hp',4);D('str',-4);mem(m,'You dropped by unannounced.');return 'You had lunch together. She felt at peace.'}],
 ['I say I’m busy',()=>{NR(g('mother'),-5,-2,0,3);return 'She said, “Okay, take care of yourself.” Her voice was sad.'}]]},
{id:'carfix',e:'🔧',w:2,a:[18,120],c:s=>s.car,t:'Car Trouble',x:'Your car broke down on the road and the mechanic says it’ll be expensive.',o:[
 ['I repair it',()=>{pay(6);D('str',3);return 'Repaired;  '+fm(6*S.m)+' spent.'}],
 ['I sell it',()=>{S.car=0;S.cash+=carPrice()*.4;return 'You sold the car for scrap price. You’re back on public transport.'}]]},
{id:'idea',e:'💡',w:2,a:[22,60],c:s=>s.tr.cr>=50&&s.cash>35*s.m&&!s.biz&&!s.retired,t:'Business Idea',x:'An idea sparked in your mind that could become a small business. Starting costs a lot and it’s risky.',o:[
 ['I invest',()=>{pay(30);D('str',8);const p=.3+S.tr.cr/200+S.tr.am/300+({n:0,b:.1,r:-.1}[S.eco.t]);if(rnd()<p){S.biz=R(4,9);H('You started a business.');return 'Your idea took off! You make about  '+fm(S.biz*S.m)+' a month in passive income.'}D('hp',-8);return 'The market didn’t respond and you lost your investment.'}],
 ['Not now',()=>{T('am',-1);return 'You wrote the idea in your notebook; maybe someday.'}]]},
{id:'pfight2',e:'💔',w:3,a:[18,120],c:s=>has('partner'),t:'Disagreement with Your Partner',x:()=>`${g('partner').n} complains that you don’t spend enough time together, and the mood has turned tense.`,o:[
 ['I apologize and promise to do better',()=>{NR(g('partner'),5,4,0,-20);D('str',-3);return 'They calmed down and took your hand again.'}],
 ['I defend myself',()=>{NR(g('partner'),-8,-4,-3,15);D('str',5);return 'The argument escalated and you were both upset.'}],
 ['I sit and listen patiently',()=>{NR(g('partner'),7,8,3,-15);return 'You had a deep conversation and understood each other more.'}]]},
{id:'midlife',e:'🌀',w:4,a:[40,55],once:1,c:s=>1,t:'Midlife Crisis',x:'One morning you look in the mirror and ask: “Is this really the life I wanted?”',o:[
 ['I change my path',()=>{T('cr',5);D('hp',6);D('str',8);return 'You took a risk and started something new; scary, but alive.'}],
 ['I stay the course',()=>{D('hp',-2);D('str',-4);return 'You stayed. You’re tired, but calm.'}],
 ['I go on a long trip',()=>{med(0);pay(15);D('hp',10);D('str',-12);return 'The trip opened your mind;  '+fm(15*S.m)+' was spent.'}]]},
{id:'elder',e:'🧓',w:3,a:[30,120],c:s=>[g('father'),g('mother')].some(n=>n.alive&&!n.cut&&n.age>=68),t:'Caring for Parents',x:'Your elderly parent can no longer manage on their own.',o:[
 ['I hire a nurse',()=>{pay(8);const n=[g('father'),g('mother')].find(x=>x.alive&&!x.cut&&x.age>=68);NR(n,4,5,4);n.h=cl(n.h+6);return 'You hired a nurse;  '+fm(8*S.m)+' was spent and their condition improved.'}],
 ['I care for them myself',()=>{const n=[g('father'),g('mother')].find(x=>x.alive&&!x.cut&&x.age>=68);D('en',-20);D('str',10);NR(n,10,8,6);n.h=cl(n.h+8);return 'You got tired, but you didn’t leave them alone.'}],
 ['I don’t have time',()=>{const n=[g('father'),g('mother')].find(x=>x.alive&&!x.cut&&x.age>=68);NR(n,-10,-8,-4,10);D('hp',-4);return 'They said nothing, but you won’t forget the look in their eyes.'}]]},
{id:'illness',e:'🏥',w:2,a:[30,120],c:s=>s.st.h<55,t:'Serious Illness',x:'Tests show your body is worn out from years of neglect and the doctor recommends immediate treatment.',o:[
 ['Full treatment',()=>{med(25);D('h',10);D('str',4);return 'The treatment was hard'+(S.ins?' (insurance covered a large part of the cost)':'')+' but you got better.'}],
 ['Neglect',()=>{D('h',-12);D('str',8);return 'The problem got worse. Your body gave a serious warning.'}]]},
{id:'retireq',e:'🌅',w:5,a:[60,75],once:1,c:s=>!s.retired,t:'Time to Retire',x:'You’ve turned 60; it’s time to ask how long you want to keep working.',o:[
 ['I retire',()=>{doRetire();return 'From today you receive a pension:  '+fm(S.pen)}],
 ['I keep working',()=>{T('am',1);return 'You decided to keep working. You can retire later from the “Work” tab.'}]]},
// ---- شرط‌بندی ----
{id:'shark',e:'🕴',w:4,c:s=>s.gb.debt>0,t:'Debt Collector',x:()=>'A man sent by the loan shark blocks your way: “You owe  '+fm(S.gb.debt)+' ; time to pay up.”',o:[
 ['I pay everything I have',()=>{const p=Math.min(Math.max(S.cash,0),S.gb.debt);S.cash-=p;S.gb.debt-=p;if(S.gb.debt>0){D('h',-10);return fm(p)+' paid; you were beaten over the rest.'}return 'The debt is settled. You breathed a sigh of relief.'}],
 ['I ask for more time',()=>rnd()<.5?(S.gb.debt*=1.25,'You got more time, but with 25% more interest.'):(D('h',-25),D('hp',-10),'They refused and beat you.')],
 ['I call the police',()=>rnd()<.4?(S.gb.debt=0,D('hp',6),'The police stepped in and the debt was voided.'):(D('h',-30),S.gb.debt*=1.3,'They threatened and beat you.')]]},
{id:'intervene',e:'🫂',w:3,c:s=>s.gb.add>=30&&g('mother').alive,t:'Family Intervention',x:'Your mother and friend found out how much you’ve gambled and sit across from you, worried.',o:[
 ['I accept and quit',()=>{S.gb.add=cl(S.gb.add-30);NR(g('mother'),8,10);D('hp',-2);return 'It was hard, but you took the first step.'}],
 ['I deny it',()=>{NR(g('mother'),-6,-14,-4,10);return 'You denied everything; a heavy silence remained.'}],
 ['I promise, but keep going',()=>{S.gb.add=cl(S.gb.add-8);NR(g('mother'),-3,-10);return 'Your promise was a lie and their trust shrank.'}]]},
{id:'raid',e:'🚔',w:1,c:s=>s.gb.n>6&&s.co=='Iran',t:'Police Raid',x:'An illegal betting den was raided and your name is on the list.',o:[['I pay the fine',()=>{pay(20);D('hp',-8);return 'The fine was paid.'}]]},
{id:'preg',e:'🍼',w:0,c:s=>0,t:'Unexpected News',x:'The test is positive: a pregnancy from a one-night stand. A heavy decision lies ahead.',o:[
 ['I take full responsibility',()=>{S.kids++;pay(15);D('hp',-3);return 'You accepted responsibility; the monthly cost of a child was added to your expenses.'}],
 ['Financial support only',()=>{pay(30);D('hp',-8);return 'You paid some money and stepped back; your conscience isn’t clear.'}],
 ['Denial and distance',()=>{D('hp',-12);S.st.fame=cl(S.st.fame+3);NR(g('mother'),-10,-20,-12,10);pay(40);return 'The story leaked and you had to pay damages; your family is unhappy.'}]]}
];
const evOf=id=>EV.find(e=>e.id==id);
function pickO(i){if(!S.ev||S.ev.res)return;const v=evOf(S.ev.id),o=v&&v.o[i];if(!o)return;
 const a=snap(),r=o[1]();if(v.once)S.fl[v.id]=1;S.ev.res=r;S.ev.d=diff(a,snap());log(v.t+': '+r);if(v.w>=2||v.once)H(v.e+' '+v.t+': '+r);commit()}

/* ================================ Save Engine ============================== */
function fix(o){const n=x=>typeof x==='number'&&isFinite(x);
 if(!o||typeof o!=='object'||typeof o.name!=='string'||!n(o.age)||!n(o.cash)||!o.st||typeof o.st!=='object'||!Array.isArray(o.npcs)||!C[o.co])return null;
 const MIGR={2:o=>{o.dif=o.dif||'n'}};for(let v=(typeof o.v=='number'?o.v:1);v<VER;v++)if(MIGR[v])MIGR[v](o);
 const D0={m:1,inv:0,home:0,car:0,ins:0,rentX:1,edu:0,exp:0,kids:0,y:2025,mo:0,d:0,bm:0,biz:0,retired:0,pen:0,infl:.05,married:0,pend:0};
 for(const k in D0)if(!n(o[k]))o[k]=D0[k];
 o.name=o.name.slice(0,24)||'Unnamed';o.age=Math.max(0,Math.min(120,Math.floor(o.age)));o.mo=cl(o.mo,0,11);o.d=cl(o.d,0,DM-1);o.bm=cl(o.bm,0,11);o.pend=0;o.m=Math.max(.1,o.m);o.edu=cl(o.edu,0,3);
 if(o.g!='Female'&&o.g!='Male')o.g='Male';if(!['e','n','h'].includes(o.dif))o.dif='n';if(!['p','m','w'].includes(o.f))o.f='m';
 if(!C[o.sco])o.sco=o.co;if(!C[o.co].c.includes(o.city))o.city=C[o.co].c[0];
 const st=o.st,tr=(o.tr&&typeof o.tr=='object')?o.tr:{};
 for(const k of['h','hp','iq','lk','en','fame'])st[k]=n(st[k])?cl(st[k]):50;st.str=n(st.str)?cl(st.str):20;
 o.tr={};for(const k of['cr','di','cf','so','am'])o.tr[k]=n(tr[k])?cl(tr[k]):(k=='cf'&&n(st.cf)?cl(st.cf):50);delete st.cf;
 o.npcs=o.npcs.filter(x=>x&&typeof x.role=='string'&&RL[x.role]&&typeof x.n=='string').slice(0,8).map(x=>{for(const k of['love','trust','resp','anger','h','age'])x[k]=n(x[k])?cl(x[k],0,120):50;x.alive=x.alive?1:0;x.cut=x.cut?1:0;x.mem=Array.isArray(x.mem)?x.mem.filter(t=>typeof t=='string').slice(0,12):[];x.pers=String(x.pers||'');x.goal=String(x.goal||'');x.fin=String(x.fin||'متوسط');x.n=x.n.slice(0,30);return x});
 o.log=Array.isArray(o.log)?o.log.filter(t=>typeof t=='string').slice(0,40):[];
 o.wn=Array.isArray(o.wn)?o.wn.filter(t=>typeof t=='string').slice(0,6):[];
 o.hist=Array.isArray(o.hist)?o.hist.filter(h=>Array.isArray(h)&&n(h[0])&&typeof h[1]=='string').slice(0,400):[];
 o.fl=(o.fl&&typeof o.fl=='object')?o.fl:{};o.ach=(o.ach&&typeof o.ach=='object')?o.ach:{};o.news=typeof o.news=='string'?o.news:'';
 if(o.job&&!(typeof o.job.n=='string'&&n(o.job.sal)))o.job=null;if(!o.job)o.job=null;else{o.job.lvl=cl(o.job.lvl||0,0,3);o.job.yr=n(o.job.yr)?o.job.yr:0}
 if(!o.study||!(n(o.study.i)&&PR[o.study.i]&&n(o.study.done)))o.study=null;
 if(!o.loan||!(n(o.loan.bal)&&n(o.loan.pay)&&n(o.loan.left)&&n(o.loan.r)))o.loan=null;
 o.eco=(o.eco&&['n','r','b'].includes(o.eco.t))?{t:o.eco.t,y:n(o.eco.y)?o.eco.y:0}:{t:'n',y:0};
 o.dead=typeof o.dead=='string'?o.dead:null;
 o.ev=(o.ev&&typeof o.ev.id=='string'&&evOf(o.ev.id))?{id:o.ev.id,res:typeof o.ev.res=='string'?o.ev.res:null,d:Array.isArray(o.ev.d)?o.ev.d.filter(x=>Array.isArray(x)&&LB[x[0]]&&n(x[1])):[]}:null;
 o.rs=null;o.last=null;o.app=(o.app=='d'||o.app=='b')?o.app:'';if(!TABS.some(t=>t[0]==o.tab))o.tab='h';
 const gb=(o.gb&&typeof o.gb=='object')?o.gb:{};for(const k of['n','w','l','add','debt','mb','s'])gb[k]=n(gb[k])?gb[k]:0;o.gb=gb;
 const dt=(o.dt&&typeof o.dt=='object')?o.dt:{};for(const k of['sw','mt','dd','bk','os','preg'])dt[k]=n(dt[k])?dt[k]:(k=='sw'?8:0);
 dt.cards=[];dt.ms=Array.isArray(dt.ms)?dt.ms.filter(c=>c&&typeof c.n=='string').slice(0,20).map(c=>({n:c.n.slice(0,20),a:cl(c.a||20,0,99),j:String(c.j||'').slice(0,30),b:String(c.b||'').slice(0,80),lk:cl(c.lk||50),it:cl(c.it||0,0,2),lv:cl(c.lv||0,0,3)})):[];
 if(dt.pf!='Female'&&dt.pf!='Male')delete dt.pf;o.dt=dt;
 o.v=VER;return o}
function save(){if(!S||!S.slot)return;const key=KEYP+S.slot,j=JSON.stringify({v:VER,t:Date.now(),S});
 try{const old=LS.get(key);if(old){const oj=JSON.parse(old),oa=oj&&oj.S&&oj.S.age;if(typeof oa=='number'&&oa!==S.age){LS.set(key+'.bak',old);if(oa%5==0)LS.set(key+'.bak5',old)}}}catch(e){}
 if(!LS.set(key,j))flash='ذخیره‌سازی ناموفق بود (حافظه مرورگر پر یا بسته است). از «تنظیمات» خروجی JSON بگیر.'}
function readSlot(i){const raw=LS.get(KEYP+i);if(!raw)return null;try{const j=JSON.parse(raw);return(j&&j.S&&typeof j.S=='object')?j:'bad'}catch(e){return 'bad'}}
function openSlot(i){const r=readSlot(i);if(!r||r==='bad'){flash='این ذخیره خراب است؛ می‌توانی آن را حذف کنی یا از فایل پشتیبان وارد کنی.';return rend()}
 const o=fix(r.S);if(!o){flash='ساختار این ذخیره معتبر نیست.';return rend()}S=o;S.slot=i;rend()}
function delSlot(i){if(!confirm('این ذخیره برای همیشه حذف شود؟'))return;LS.del(KEYP+i);LS.del(KEYP+i+'.bak');LS.del(KEYP+i+'.bak5');if(S&&S.slot==i)S=null;rend()}
function dl(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function exportSlot(i){const raw=LS.get(KEYP+i);if(!raw)return;dl('life-slot'+i+'.json',raw)}
function exportCur(){if(!S)return;save();dl('life-'+(S.slot||0)+'.json',JSON.stringify({v:VER,t:Date.now(),S}))}
function importText(t,slot){let o=null;try{const j=JSON.parse(t);o=fix(j&&j.S?j.S:j)}catch(e){}
 if(!o){flash='فایل معتبر نیست؛ ذخیره وارد نشد.';return rend()}
 o.slot=slot;LS.set(KEYP+slot,JSON.stringify({v:VER,t:Date.now(),S:o}));flash='ذخیره با موفقیت در Slot '+fa(slot)+' وارد شد.';rend()}
function impGo(){const t=$('#imp').value.trim();if(!t){flash='متن JSON را بچسبان یا فایل را انتخاب کن.';return rend()}importText(t,+$('#isl').value)}
function impFile(inp){const f=inp.files&&inp.files[0];if(!f)return;if(f.size>2e6){flash='فایل بیش از حد بزرگ است.';return rend()}const r=new FileReader();r.onload=()=>importText(String(r.result),+$('#isl').value);r.readAsText(f)}
function migOld(){const raw=LS.get(OLD);if(!raw)return;let sl=1;for(let i=1;i<=3;i++)if(!LS.get(KEYP+i)){sl=i;break}importText(raw,sl)}
function goMenu(){save();S=null;NS=0;rend()}
function focusName(){setTimeout(()=>{const e=$('#nm');if(e){try{e.scrollIntoView({block:'center'})}catch(_){}e.focus()}},60)}
function applyTheme(){const v=LS.get(THK),h=document.documentElement;if(v=='light'||v=='dark')h.setAttribute('data-theme',v);else h.removeAttribute('data-theme')}
function setTheme(v){if(v=='auto')LS.del(THK);else LS.set(THK,v);applyTheme();rend()}

/* ============================== شروع زندگی جدید ============================ */
function newLife(slot,nm0,gn,co,fa0,sa,dif){if(!C[co])return;dif=DIF[dif]?dif:'n';const nm=(nm0.trim()||'Unnamed').slice(0,24);let f=fa0;if(f=='r')f=pick(['p','m','m','w']);if(!['p','m','w'].includes(f))f='m';
 const m=C[co].m,ad=sa=='a',age=ad?18:0,bm=R(0,11);
 /* Bilingual family names: Persian for Iran/Turkey, English for others */
 const useFaNames=(co=='Iran'||co=='Turkey');
 const sn=useFaNames?pick(['رضایی','احمدی','کریمی','موسوی','حسینی']):pick(['Smith','Johnson','Brown','Davis','Wilson','Taylor']);
 const dad=useFaNames?pick(['محمد','علی','رضا','حسین']):pick(['James','John','Robert','Michael','David']);
 const mom=useFaNames?pick(['مریم','زهرا','فاطمه','سمیه']):pick(['Mary','Sarah','Emma','Lisa','Anna']);
 const fin={p:LANG==='fa'?'ضعیف':'poor',m:LANG==='fa'?'متوسط':'middle',w:LANG==='fa'?'خوب':'wealthy'}[f];
 const L=LANG;
 S={v:VER,slot,dif,lang:LANG,name:nm,g:gn=='Female'?'Female':'Male',co,sco:co,city:pick(C[co].c),f,m,age,y:2025,mo:ad?6:bm,d:0,bm,
  cash:ad?Math.round({p:3,m:40,w:250}[f]*m*DIF[dif].cx):0,inv:0,home:0,car:0,ins:0,rentX:1,edu:0,study:null,job:null,exp:0,biz:0,retired:0,pen:0,married:0,kids:0,loan:null,
  infl:C[co].i,eco:{t:'n',y:0},wn:[],fl:{},ach:{},hist:[],log:[],ev:null,pend:0,tab:LS.get('life.tut')?'h':'i',last:null,dead:null,app:'',rs:null,
  news:ad?(L==='fa'?'زندگی تازه‌ات شروع شد.':'Your new life begins.'):(L==='fa'?'به دنیا آمدی؛ همه‌چیز پیش رویت باز است.':'You were born; everything lies ahead of you.'),
  st:{h:R(65,92),hp:R(50,75),iq:R(45,92),lk:R(40,85),en:80,fame:R(0,5),str:R(5,20)},
  tr:{cr:R(30,75),di:R(30,75),cf:R(40,70),so:R(30,75),am:R(30,75)},
  npcs:[mk('father',dad+' '+sn,ad?R(48,56):R(26,38),L==='fa'?'کم‌حرف و مسئولیت‌پذیر':'Quiet and responsible',L==='fa'?'می‌خواهد فرزندش آینده‌ای مطمئن داشته باشد':'Wants a secure future for their child',fin,R(70,92),ad?'':(L==='fa'?'روز تولدت اولین بار تو را در آغوش گرفت.':'Held you for the first time on the day you were born.')),mk('mother',mom+' '+sn,ad?R(45,53):R(24,35),L==='fa'?'مهربان و نگران':'Kind and caring',L==='fa'?'دلش می‌خواهد بیشتر ببیندت':'Wants to see you more',fin,R(75,95),ad?'':(L==='fa'?'اولین نفری بود که صدایت را شنید.':'Was the first to hear your voice.'))]};
 if(ad)S.npcs.push(mk('friend',pick(FRN),R(18,22),L==='fa'?'شوخ و کمی بی‌برنامه':'Playful and a bit spontaneous',L==='fa'?'می‌خواهد کارش را راه بیندازد':'Wants to get their career going',fin,R(55,75)));
 X();NS=0;LS.set('life.tut','1');
 const cityN=S.city;
 log(ad?(L==='fa'?'در '+cityN+' زندگی تازه‌ای را آغاز کردی. ۱۸ ساله‌ای؛ دیپلم داری.':'Started a new life in '+cityN+'. You are 18; you have a high school diploma.'):(L==='fa'?'در '+cityN+'، '+S.co+' به دنیا آمدی. زندگی‌ات از همین‌جا شروع می‌شود.':'You were born in '+cityN+', '+S.co+'. Your life begins here.'));
 H(ad?(L==='fa'?'زندگی مستقل از ۱۸ سالگی شروع شد.':'Independent life started at age 18.'):(L==='fa'?'در '+cityN+' به دنیا آمدی.':'You were born in '+cityN+'.'));
 commit()}

/* ============================== دستور آزاد ============================== */
function cmd(t){t=(t||'').trim();if(!t||S.ev)return;
 if(S.age<18)return msg('هنوز برای این تصمیم‌ها کوچک هستی؛ بعد From age 18 ممکن می‌شوند.');
 const nv=+((t.match(/[\d۰-۹]+/)||['0'])[0].replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
 const hs=/(خانه|ملک|آپارتمان)/.test(t),cr=/(ماشین|خودرو)/.test(t);
 if(hs&&/(بخر|خرید)/.test(t))return buyHouse();
 if(hs&&/(بفروش|فروش)/.test(t))return sellHouse();
 if(cr&&/(بخر|خرید)/.test(t))return buyCar();
 if(cr&&/(بفروش|فروش)/.test(t))return sellCar();
 if(/بیمه/.test(t))return toggleIns();
 if(/بازنشست/.test(t))return doRetire();
 if(/پزشک/.test(t)){if(S.edu<3)return msg('پزشک شدن نیازمند مدرک پزشکی (۱۴ ترم) است. از تب شغل و تحصیل وارد دانشگاه شو.');if(S.job&&S.job.n=='Doctor')return msg('هم‌اکنون پزشک هستی.');S.job={n:'پزشک',sal:115*S.m,lvl:0,yr:0};S.retired=0;H('در بیمارستان استخدام شدی.');return msg('در بیمارستان استخدام شدی: پزشک.')}
 if(/(بورس|سرمایه)/.test(t))return invest(nv||10);
 if(/(باشگاه|ورزش)/.test(t))return act('gym');
 if(/(کار|شغل|استخدام)/.test(t))return msg('برای کار از بخش «شغل و تحصیل» اقدام کن؛ آنجا شرایط هر شغل دیده می‌شود.');
 if(/مهاجرت/.test(t)){const co=Object.keys(C).find(c=>t.includes(c));return co?migrate(co):msg('کشور مقصد را بنویس، مثلاً «مهاجرت به کانادا».')}
 msg('این دستور را نمی‌فهمم. (تفسیر آزاد با هوش مصنوعی در مرحله بعد اضافه می‌شود؛ فعلاً: خرید یا فروش خانه و خودرو، بیمه، بازنشستگی، پزشک شدن، سرمایه‌گذاری، ورزش، مهاجرت)')}

/* ==================================== UI ================================== */
const chips=d=>d.map(([k,v])=>{const good=BAD[k]?v<0:v>0;return`<span class="chip ${good?'pos':'neg'}">${LB[k]} ${v>0?'+':'−'}${(k=='c'||k=='db')?fm(Math.abs(v)*S.m):fa(Math.abs(v))}</span>`}).join('');
const bar=(i,l,v,bad)=>`<div><div class="bl"><span>${i} ${l}</span><span>${fa(Math.round(v))}</span></div><div class="bar"><i class="${bad&&v>60?'w':''}" style="width:${cl(v)}%"></i></div></div>`;
const avatar=s=>{const a=s.age,f=s.g=='Female';return a<3?'👶':a<18?(f?'👧':'👦'):a<60?(f?'👩':'👨'):(f?'👵':'👴')};
const dtm=t=>{try{return new Date(t).toLocaleString('fa-IR')}catch(e){return ''}};
const tab=t=>{S.tab=t;rend();window.scrollTo(0,0)};

function titleHTML(){
 let b=`<div class="brand">${tx('brand')}</div><div class="sub">${tx('tagline')}</div>${flash?`<div class="news">${esc(flash)}</div>`:''}`;flash='';
 b+=`<div class="c"><h3>${tx('select_lang')}</h3><div class="row" style="justify-content:center"><button class="${LANG==='fa'?'p':''}" onclick="setLang('fa')">🇮🇷 ${tx('persian')}<br><span style="font-size:11px;opacity:.7">${tx('lang_fa_desc')}</span></button><button class="${LANG==='en'?'p':''}" onclick="setLang('en')">🇬🇧 ${tx('english')}<br><span style="font-size:11px;opacity:.7">${tx('lang_en_desc')}</span></button></div></div>`;
 let form='';
 if(NS)form=`<div class="c"><h3>${tx('new_life')} — ${tx('slot')} ${fa(NS)}</h3><label>${tx('name')}<input id="nm" type="text" maxlength="24" autocomplete="off" autocapitalize="off" enterkeyhint="done" placeholder="${LANG==='fa'?'نامت را وارد کن':'Enter your name'}"></label><label>${tx('gender')}<select id="gn"><option value="Male">${tx('male')}</option><option value="Female">${tx('female')}</option></select></label><label>${tx('country')}<select id="co">${Object.keys(C).map(c=>`<option>${c}</option>`).join('')}</select></label><label>${tx('family_bg')}<select id="fa"><option value="r">${tx('random')}</option><option value="p">${tx('poor')}</option><option value="m">${tx('middle')}</option><option value="w">${tx('wealthy')}</option></select></label><label>${tx('start_life')}<select id="sa"><option value="b">${tx('from_birth')}</option><option value="a">${tx('from18')}</option></select></label><label>${tx('difficulty')}<select id="df"><option value="e">${tx('easy')}</option><option value="n" selected>${tx('normal')}</option><option value="h">${tx('hard')}</option></select></label><div class="row"><button class="p" onclick="newLife(NS,$('#nm').value,$('#gn').value,$('#co').value,$('#fa').value,$('#sa').value,$('#df').value)">${tx('new_life')}</button><button onclick="NS=0;rend()">${tx('cancel')}</button></div></div>`;
 for(let i=1;i<=3;i++){const r=readSlot(i);
  if(r==='bad')b+=`<div class="c"><b>${tx('slot')} ${fa(i)}</b><p class="neg">${tx('corrupted_save')}</p><div class="row">${readBak(i)?`<button class="p" onclick="restoreBak(${i})">${tx('restored')}</button>`:''}<button class="d" onclick="delSlot(${i})">${tx('delete')}</button></div></div>`;
  else if(r){const s=r.S;b+=`<div class="c"><b>${tx('slot')} ${fa(i)} · ${esc(s.name||'؟')}</b><div class="mu">${typeof s.age=='number'?fa(s.age)+' '+tx('years_old'):''} · ${s.dead?tx('deceased'):tx('in_progress')} · ${tx('last_saved')}: ${esc(dtm(r.t))}</div><div class="row"><button class="p" onclick="openSlot(${i})">${tx('continue_life')}</button>${readBak(i)?`<button onclick="restoreBak(${i})">${tx('restored')}</button>`:''}<button class="d" onclick="delSlot(${i})">${tx('delete')}</button></div></div>`}
  else b+=`<div class="c"><b>${tx('slot')} ${fa(i)}</b> <span class="mu">${tx('empty')}</span><div class="row"><button class="p" onclick="NS=${i};rend();focusName()">${tx('new_life')}</button></div></div>`}
 b+=`<div class="row" style="justify-content:center">${tx('theme')}: <button class="${(LS.get(THK)||'auto')=='auto'?'p':''}" onclick="setTheme('auto')">${tx('auto')}</button><button class="${LS.get(THK)=='light'?'p':''}" onclick="setTheme('light')">${tx('light')}</button><button class="${LS.get(THK)=='dark'?'p':''}" onclick="setTheme('dark')">${tx('dark')}</button></div>`;
 return form+b}
function deadHTML(){const s=S,sg=Object.keys(s.ach).length;
 return`<div class="brand">${tx('brand')}</div><div class="c"><h2>${avatar(s)} ${esc(s.name)} ${tx('passed_away')}</h2><p>${fa(s.age)} ${tx('years')}، ${tx('death_cause')}: ${esc(s.dead)}.</p><ul><li>${tx('final_assets')}: ${fm(net())}</li><li>${tx('final_education')}: ${ED[s.edu]}</li><li>${tx('final_children')}: ${fa(s.kids)}</li><li>${tx('final_happiness')}: ${fa(s.st.hp)}/100</li><li>${tx('final_achievements')}: ${fa(sg)} / ${fa(ACH.length)}</li></ul><h3 style="margin-top:12px">${tx('key_moments')}</h3><ul>${s.hist.slice(0,10).map(h=>`<li>${fa(h[0])} ${tx('years')}: ${esc(h[1])}</li>`).join('')}</ul><p><b>${epitaph(s)}</b></p><div class="row"><button class="p" onclick="goMenu()">${tx('back_to_menu')}</button><button class="d" onclick="delSlot(${s.slot})">${tx('delete_save')}</button></div></div>`}
function head(){const s=S,st=s.st,sg=stage(s.age),pt=has('partner')?g('partner'):null;
 const stgMap=['stages_childhood','stages_school','stages_teens','stages_young','stages_career','stages_midlife','stages_golden'];const sgi=getST().findIndex(x=>x[0]===sg[0]);const stgTx=tx(stgMap[sgi]||'stages_young');
 const job=s.retired?tx('retired'):s.job?jn(s.job):(s.x&&s.x.hero&&s.age>=18)?(LANG==='fa'?'ابرقهرمان':'Superhero'):s.study?tx('student'):s.age<6?tx('preschool'):s.age<18?tx('schoolchild'):tx('unemployed');
 return`<div class="top"><div class="brand2">${tx('brand')}</div><button onclick="goMenu()">${tx('menu')}</button></div>
<div class="c prof"><div class="av">${avatar(s)}</div><div style="flex:1;min-width:0"><div class="big">${esc(s.name)}</div><div class="mu">${fa(s.age)} ${tx('years_old')} | ${s.g==="Male"?tx('male'):tx('female')} | ${esc(s.city)}, ${esc(s.co)}</div><span class="chip">${sg[2]} ${stgTx}</span><div class="mu">${fmtYear(s.y)} · ${pt?(s.married?tx('married')+' '+esc(pt.n):tx('partner')+' '+esc(pt.n)):tx('single')} · ${esc(job)}</div></div></div>
<div class="c"><div class="big ${s.cash<0?'neg':''}">${fm(s.cash)}</div><div class="mu">${tx('cash')}${s.inv?' · '+tx('invest')+': '+fm(s.inv):''}${s.loan?' · '+tx('debt')+': '+fm(s.loan.bal):''}</div></div>
<div class="c g2">${bar('🫀',tx('health'),s.st.h)}${bar('😊',tx('happiness'),st.hp)}${bar('🧠',tx('intelligence'),st.iq)}${bar('✨',tx('looks'),st.lk)}${bar('⚡',tx('energy'),st.en)}${bar('⭐',tx('fame'),st.fame)}${bar('😰',tx('stress'),st.str,1)}${s.gb.add>0?bar('🎲',tx('addiction'),s.gb.add,1):''}</div>
<div class="news"><b>${tx('last_event')}</b><br>${esc(s.news)}</div>
<div class="nav">${TABS.map(([k,i,l])=>`<button class="${s.tab==k?'on':''}" onclick="tab('${k}')">${i} ${tabLabel(k)}</button>`).join('')}</div>`}

function tH(){const s=S,sg=stage(s.age);const stgMap=['stages_childhood','stages_school','stages_teens','stages_young','stages_career','stages_midlife','stages_golden'];const sgi=getST().findIndex(x=>x[0]===sg[0]);const stgTx=tx(stgMap[sgi]||'stages_young');
 return`<div class="c"><h3>${sg[2]} ${stgTx}</h3><p class="mu">${sg[3]}</p>${s.age>=6&&s.age<18?`<p class="mu">💰 ${tx('pocket_money')}: ${fm(PKM())}</p>`:''}</div>
<div class="c"><button class="p" onclick="XYear()">${tx('pass_year')}</button><div class="mu">${tx('pass_year_desc')}</div></div>
<div class="c"><h3>${tx('activities')}</h3><p class="mu">${tx('activities_desc')}</p><div class="row">${Object.keys(A).filter(k=>A[k][3](s)).map(k=>`<button ${aLeft(k)<=0?'disabled':''} onclick="act('${k}')">${actLabel(k).replace(/ \([^)]*\)/,'')} · ${fa(aLeft(k))}/${fa(getACAP(k))}</button>`).join('')}</div></div>`}
function tC(){const s=S,L=LANG;
 return`<div class="c"><h3>${L==='fa'?'ویژگی‌های شخصیتی':'Personality Traits'}</h3><p class="mu">${L==='fa'?'این ویژگی‌ها روی احتمال رویدادها و نتیجه انتخاب‌هایت اثر دارند و با تجربه‌هایت تغییر می‌کنند.':'These traits affect event odds and choice outcomes, and change with experience.'}</p>${getTR().map(t=>`<div style="margin:10px 0">${bar(t[1],t[2],s.tr[t[0]])}<div class="mu">${t[3]}</div></div>`).join('')}</div>
<div class="c g2">${bar('🧠',tx('intelligence'),s.st.iq)}${bar('✨',tx('looks'),s.st.lk)}${bar('⭐',tx('fame'),s.st.fame)}${bar('😰',tx('stress'),s.st.str,1)}</div>
<div class="c"><h3>${L==='fa'?'سوابق':'Records'}</h3><ul><li>${L==='fa'?'تحصیلات':'Education'}: ${ED[s.edu]}${XE().trk?' ('+(L==='fa'?'مسیر دبیرستان: ':'High school track: ')+XTR[XE().trk]+')':''}</li><li>${L==='fa'?'سابقه کار':'Work experience'}: ${fa(s.exp)} ${L==='fa'?'سال':'years'}</li><li>${L==='fa'?'شغل':'Job'}: ${s.job?esc(jn(s.job)):s.retired?tx('retired'):'—'}</li></ul></div>`}
function tR(){const s=S,L=LANG;
 const rlLabel=r=>{const m={father:L==='fa'?'پدر':'Father',mother:L==='fa'?'مادر':'Mother',friend:L==='fa'?'دوست':'Friend',partner:L==='fa'?'شریک':'Partner',step:L==='fa'?'نامادرد/ناپدر':'Stepparent'};return m[r]||r};
 let b=s.npcs.map(n=>`<div class="c"><div class="big">${esc(n.n)}${n.alive?'':' ('+(L==='fa'?'فوت‌شده':'Deceased')+')'}</div><div class="mu">${rlLabel(n.role)} · ${fa(n.age)} ${L==='fa'?'ساله':'years old'} · ${esc(n.pers)}</div>${n.occupation?`<div class="mu">💼 ${n.occupation} · ${L==='fa'?'درآمد ماهانه: ':'Monthly income: '}${fm(n.income*S.m)}</div>`:''}<div class="g2" style="margin:10px 0">${bar('❤️',L==='fa'?'محبت':'Love',n.love)}${bar('🤝',L==='fa'?'اعتماد':'Trust',n.trust)}${bar('🙏',L==='fa'?'احترام':'Respect',n.resp)}${bar('😠',L==='fa'?'عصبانیت':'Anger',n.anger,1)}${bar('🫀',L==='fa'?'سلامت':'Health',n.h)}<div class="mu">${L==='fa'?'وضع مالی':'Finances'}: ${esc(n.fin)}</div></div><p class="mu">${L==='fa'?'هدف':'Goal'}: ${esc(n.goal)}</p><b>${L==='fa'?'خاطرات':'Memories'}</b><ul>${n.mem.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>${n.alive&&!n.cut?`<div class="row">${[[L==='fa'?'صحبت':'Talk',L==='fa'?'درخواست پول':'Ask for money'],[L==='fa'?'هدیه':'Gift',L==='fa'?'بیرون رفتن':'Go out'],[L==='fa'?'عذرخواهی':'Apologize',L==='fa'?'قطع ارتباط':'Cut ties']].map(([l1,l2],i)=>`<button onclick="npcAct('${n.role}','${['talk','money','gift','out','sorry','cut'][i]}')">${l1}</button>`).join('')}<button onclick="npcAct('${n.role}','money')">${L==='fa'?'درخواست پول':'Ask'} (${fa(askLeft(n))}/3)</button></div>${n.role=='partner'?`<div class="row">${!s.married?`<button class="p" onclick="marry()">${L==='fa'?'خواستگار':'Propose'}</button>`:`<button onclick="haveChild()">${L==='fa'?'فرزندآوری':'Have a child'}</button><button class="d" onclick="divorce()">${L==='fa'?'طلاق':'Divorce'}</button>`}</div>`:''}`:n.cut?`<span class="neg">${L==='fa'?'ارتباط قطع شده.':'Contact is cut.'}</span>`:''}</div>`).join('');
 if(s.kids>0)b+=`<div class="c"><b>${L==='fa'?'فرزندان':'Children'}: ${fa(s.kids)}</b><div class="mu">${L==='fa'?'هزینه ماهانه هر فرزند: ':'Monthly cost per child: '}${fm(8*s.m)}</div></div>`;
 if(s.age>=18&&!has('partner'))b+=`<div class="c mu">${tx('no_partner_yet')}</div>`;
 return b}
function tJ(){const s=S;
 if(s.age<18)return`<div class="c"><h3>💼 ${tx('work')}</h3><p class="mu">${LANG==='fa'?'کار و استخدام از ۱۸ سالگی باز می‌شود. تا آن موقع با مطالعه و فعالیت، مهارت‌هایت را بساز.':'Work and employment open at age 18. Until then, build your skills through study and activities.'}</p></div>`;
 const ph={n:LANG==='fa'?'عادی':'Normal',b:LANG==='fa'?'رونق 📈':'Boom 📈',r:LANG==='fa'?'رکود 📉':'Recession 📉'}[s.eco.t];
 let b=`<div class="c"><h3>💼 ${tx('work')}</h3><p class="mu">${tx('work_market')}: ${ph} · ${tx('education')}: ${ED[s.edu]}${s.job?` · ${tx('job')}: ${esc(jn(s.job))} (${fm(s.job.sal)} ${tx('per_month')})`:''}${s.biz?` · ${tx('business_income')}: ${fm(s.biz*s.m)} ${tx('per_month')}`:''}</p>`;
 if(s.retired)b+=`<p>${tx('retired')}; ${tx('salary')} ${tx('per_month')}: ${fm(s.pen)}</p>`;
 else{if(!s.job)b+=`<select id="jb">${J.map((j,i)=>`<option value="${i}" ${j[1]>s.edu?'disabled':''}>${j[0]} — ${fm(j[2]*s.m)} · ${LANG==='fa'?'شانس':'chance'} ≈ ${fa(jobCh(j))}%${j[1]>s.edu?' · '+ED[j[1]]:''}</option>`).join('')}</select><button onclick="apply(+$('#jb').value)">${tx('search_job')}</button>`;
  else b+=`<button onclick="quit()">${tx('resign')}</button>`;
  if(s.age>=60)b+=` <button class="p" onclick="doRetire()">${tx('retire')}</button>`}
 b+='</div>';
 /* Education is now in the School & University tab (tU) */
 return b}
/* ===== Gold investment system ===== */
const goldPrice=()=>{const x=XE();x.gp=x.gp||50;return Math.round(x.gp*S.m)};
function buyGold(g){const s=S,x=XE(),L=LANG;if(s.age<18||s.ev)return;const cost=g*goldPrice();if(s.cash<cost)return msg(L==='fa'?'پول کافی نداری.':'Not enough cash.');s.cash-=cost;x.gold=(x.gold||0)+g;msg(L==='fa'?'طلبا خریدی.':'You bought gold.');commit()}
function sellGold(){const s=S,x=XE(),L=LANG;if(!x.gold)return msg(L==='fa'?'طلایی نداری.':'You have no gold.');const val=x.gold*goldPrice();s.cash+=val;x.gold=0;msg(L==='fa'?'طلها را فروختی: ':'You sold gold for ')+fm(val);commit()}
/* Gold price fluctuates yearly */
const goldYearly=()=>{const x=XE();x.gp=x.gp||50;x.gp=Math.max(10,x.gp*(1+R(-15,25)/100))};

function tF(){const s=S,L=LANG,l=s.last||{inc:s.job?s.job.sal*.9:0,bz:s.biz*s.m,tax:0,rent:s.home?0:5.5*s.m*s.rentX,fd:4*s.m,tr:1.5*s.m,ot:3*s.m,ln:0},ex=l.rent+l.fd+l.tr+l.ot+l.ln,tot=l.inc+l.bz+(l.al||0)+(l.hero||0)+(l.ua||0)+(l.skillInc||0);
 const lbl=(fa,en)=>L==='fa'?fa:en;
 return`<div class="c"><h3>${lbl('وضعیت مالی','Financial status')} — ${lbl('سال','Year')} ${fmtYear(s.y)}</h3><div class="big ${s.cash<0?'neg':''}" style="margin:6px 0">${fm(s.cash)}</div><table>
 <tr><td>${s.retired?lbl('بازنشستگی','Pension'):lbl('حقوق','Salary')} (${lbl('پس از مالیات','after tax')})</td><td>${fm(l.inc)}</td></tr>
 <tr><td>${lbl('درآمد کسب‌وکار','Business income')}</td><td>${fm(l.bz)}</td></tr>
 ${l.skillInc?`<tr><td>${lbl('درآمد مهارت','Skill income')}</td><td>${fm(l.skillInc)}</td></tr>`:''}
 ${l.al?`<tr><td>${lbl('پول توجیبی','Pocket money')}</td><td>${fm(l.al)}</td></tr>`:''}
 ${l.hero?`<tr><td>${lbl('حقوق ابرقهرمانی','Hero salary')}</td><td>${fm(l.hero)}</td></tr>`:''}
 ${l.ua?`<tr><td>${lbl('حمایت دولتی','Government support')}</td><td>${fm(l.ua)}</td></tr>`:''}
 <tr><td>${lbl('مالیات','Tax')}</td><td>${fm(l.tax)}</td></tr>
 <tr><td>${lbl('اجاره','Rent')}</td><td>${fm(l.rent)}</td></tr>
 <tr><td>${lbl('خوراک','Food')}</td><td>${fm(l.fd)}</td></tr>
 <tr><td>${lbl('حمل‌ونقل','Transport')}</td><td>${fm(l.tr)}</td></tr>
 <tr><td>${lbl('قسط وام','Loan payment')}</td><td>${fm(l.ln)}</td></tr>
 <tr><td>${lbl('سایر','Other')} (${lbl('بیمه، فرزند','insurance, kids')})</td><td>${fm(l.ot)}</td></tr>
 <tr><td><b>${lbl('پس‌انداز ماهانه','Monthly saving')}</b></td><td class="${tot-ex<0?'neg':'pos'}"><b>${fm(tot-ex)}</b></td></tr></table>
 ${bar('📥',lbl('درآمد ماهانه','Monthly income'),tot/Math.max(tot,ex,1)*100)}${bar('📤',lbl('هزینه ماهانه','Monthly expense'),ex/Math.max(tot,ex,1)*100,1)}
 <p class="mu">${lbl('تورم امسال','Inflation this year')} ${esc(s.co)}: ${fa(Math.round(s.infl*100))}%</p></div>
${s.age>=18?`<div class="c"><h3>${lbl('سرمایه‌گذاری در بورس','Stock Investment')}</h3><p class="mu">${lbl('موجودی بازار','Market balance')}: ${fm(s.inv)} · ${lbl('نوسان ماهانه','monthly fluctuation')}</p><div class="row"><button onclick="invest(10)">${lbl('۱۰ واحد','10 units')}</button><button onclick="invest(50)">${lbl('۵۰ واحد','50 units')}</button><button onclick="withdraw()">${lbl('نقد کردن همه','Withdraw all')}</button></div></div>
<div class="c"><h3>🥇 ${lbl('سرمایه‌گذاری طلا','Gold Investment')}</h3><p class="mu">${lbl('موجودی طلا','Gold balance')}: ${fa(Math.round((XE().gold||0)*100)/100)} ${lbl('گرم','grams')} · ${lbl('ارزش','value')}: ${fm((XE().gold||0)*goldPrice())}</p><div class="row"><button onclick="buyGold(1)">${lbl('خرید ۱ گرم','Buy 1g')}</button><button onclick="buyGold(10)">${lbl('خرید ۱۰ گرم','Buy 10g')}</button><button onclick="sellGold()">${lbl('فروش همه طلا','Sell all gold')}</button></div></div>
<div class="c"><h3>🏦 ${lbl('وام بانکی','Bank Loan')}</h3>${s.loan?`<p>${lbl('مانده','Balance')}: ${fm(s.loan.bal)} · ${lbl('قسط','Payment')}: ${fm(s.loan.pay)} · ${fa(s.loan.left)} ${lbl('ماه مانده','months left')}</p><button onclick="payLoan()">${lbl('تسویه کامل','Pay off')}</button>`:`<p class="mu">${lbl('نرخ سالانه','Annual rate')} ${fa(Math.round(C[s.co].lr*100))}% · ${lbl('از ۲۱ سالگی و با درآمد مستمر','From age 21 with steady income')}</p><div class="row"><button onclick="takeLoan(50,24)">50/24</button><button onclick="takeLoan(150,36)">150/36</button><button onclick="takeLoan(400,60)">400/60</button></div>`}</div>`:''}
<div class="c"><b>${lbl('بدهی قماری','Gambling debt')}</b>: ${fm(s.gb.debt)}</div>`}
function tA(){const s=S,L=LANG;if(s.age<18)return`<div class="c mu">${L==='fa'?'دارایی‌ها از ۱۸ سالگی باز می‌شوند.':'Assets unlock at age 18.'}</div>`;
 const lbl=(fa,en)=>L==='fa'?fa:en;
 return`<div class="c"><h3>🏠 ${lbl('خانه','House')}</h3><p class="mu">${lbl('قیمت روز','Current price')}: ${fm(housePrice())}</p>${s.home?`<p>${lbl('صاحب خانه‌ای.','You own a house.')}</p><button onclick="sellHouse()">${lbl('فروش','Sell')}</button>`:`<p>${lbl('اجاره‌نشین هستی.','You are renting.')}</p><button class="p" onclick="buyHouse()">${lbl('خرید خانه','Buy house')}</button>`}</div>
<div class="c"><h3>🚗 ${lbl('خودرو','Car')}</h3><p class="mu">${lbl('قیمت روز','Current price')}: ${fm(carPrice())}</p>${s.car?`<p>${lbl('خودرو داری.','You own a car.')}</p><button onclick="sellCar()">${lbl('فروش','Sell')} (60%)</button>`:`<button class="p" onclick="buyCar()">${lbl('خرید خودرو','Buy car')}</button>`}</div>
<div class="c"><h3>🩺 ${lbl('بیمه درمانی','Health Insurance')}</h3><p class="mu">${lbl('هزینه ماهانه','Monthly cost')} ${fm(1.5*s.m)}; ${lbl('هزینه‌های درمان را ۶۰٪ کم می‌کند.','Reduces medical costs by 60%.')}</p><button onclick="toggleIns()">${s.ins?lbl('لغو بیمه','Cancel'):lbl('تهیه بیمه','Get insurance')}</button></div>
<div class="c"><h3>💡 ${lbl('کسب‌وکار','Business')}</h3><p>${s.biz?lbl('درآمد ماهانه: ','Monthly income: ')+fm(s.biz*s.m):lbl('هنوز کسب‌وکاری نداری.','You have no business yet.')}</p></div>
<div class="c"><b>${lbl('دارایی خالص','Net worth')}</b>: ${fm(net())}</div>`}
function PH(){const s=S,B=s.gb,Tt=s.dt,pt=g('partner'),hp=has('partner'),back='<button onclick="S.app=\'\';rend()">← گوشی</button>';
 if(s.age<18)return`<div class="c"><h3>📱 گوشی</h3><p class="mu">برنامه‌های گوشی From age 18 باز می‌شوند.</p></div>`;
 if(!s.app)return`<div class="c"><h3>گوشی</h3><div class="apps" style="margin-top:10px"><button onclick="S.app='d';rend()"><b>💘</b>هم‌دل</button><button onclick="S.app='b';rend()"><b>🎰</b>بت‌لند</button></div></div><div class="c g2"><div><b>عاشقانه</b><div class="mu">مچ: ${fa(Tt.mt)} · قرار: ${fa(Tt.dd)}<br>یک‌شبه: ${fa(Tt.os)} · جدایی: ${fa(Tt.bk)}<br>فرزند: ${fa(s.kids)}</div></div><div><b>قمار</b><div class="mu">شرط: ${fa(B.n)} · اعتیاد: ${fa(B.add)}٪<br>برد کل: ${fm(B.w)}<br>باخت کل: ${fm(B.l)}</div></div></div>`;
 if(s.app=='b')return`<div class="c"><div class="hd"><h3>🎰 بت‌لند</h3>${back}</div><p class="mu">خانه همیشه کمی جلوتر است. اعتیاد: ${fa(B.add)}٪ · بدهی رباخور: ${fm(B.debt)}</p><label>مبلغ شرط (واحد: میلیون × مقیاس کشور)<input id="ba" type="number" value="5" min="1"></label><div class="row">${Object.keys(BG).map(k=>`<button onclick="bet('${k}',$('#ba').value)">${BG[k][0]} (×${fa(BG[k][2])})</button>`).join('')}</div><hr><div class="row"><button onclick="loanShark()">قرض ${fa(50)} واحد از رباخور (۸٪ ماهانه)</button>${B.debt>0?'<button onclick="payD()">پرداخت بدهی</button>':''}</div></div>`;
 if(!Tt.cards.length)Tt.cards.push(card());const c=Tt.cards[0],pf=Tt.pf||(s.g=='Male'?'Female':'Male');
 return`<div class="c"><div class="hd"><h3>💘 هم‌دل</h3>${back}</div><p class="mu">سوایپ باقی‌مانده امسال: ${fa(Tt.sw)} · نمایش: ${pf} <button onclick="S.dt.pf='${pf=='Female'?'Male':'Female'}';S.dt.cards=[];rend()">تغییر</button></p></div><div class="c" style="text-align:center"><div style="font-size:46px">${pf=='Female'?'👩':'🧑'}</div><div class="big">${esc(c.n)}، ${fa(c.a)}</div><div class="mu">${esc(c.j)} · ظاهر ${fa(c.lk)} · ${IT[c.it]}</div><p>«${esc(c.b)}»</p><div class="row" style="justify-content:center"><button onclick="swp(0)">✕ رد</button><button class="p" onclick="swp(1)">♥ لایک</button></div></div>${Tt.ms.length?'<h3>مچ‌ها</h3>':''}${Tt.ms.map((c,i)=>`<div class="c"><b>${esc(c.n)}</b> <span class="mu">${esc(c.j)} · ${IT[c.it]} · نزدیکی ${fa(c.lv)}/۳</span><div class="row"><button onclick="dte(${i})">قرار قهوه</button>${c.lv>=2&&!hp?`<button class="p" onclick="rls(${i})">شروع رابطه</button>`:''}<button onclick="ons(${i},1)">پیشنهاد امشب (با محافظ)</button><button onclick="ons(${i},0)">پیشنهاد امشب (بدون محافظ)</button><button onclick="S.dt.ms.splice(${i},1);rend()">Delete</button></div></div>`).join('')}`}
function tW(){const s=S,co=C[s.co],ph={n:'عادی',b:'رونق 📈',r:'رکود 📉'}[s.eco.t];
 let b=`<div class="c"><h3>🌍 ${esc(s.co)} · ${esc(s.city)}</h3><table><tr><td>وضعیت اقتصاد</td><td>${ph}</td></tr><tr><td>تورم امسال</td><td>${fa(Math.round(s.infl*100))}٪</td></tr><tr><td>مقیاس هزینه‌ها</td><td>${fa(co.m)}×</td></tr><tr><td>نرخ وام</td><td>${fa(Math.round(co.lr*100))}٪</td></tr></table><p class="mu">All amounts are shown in US dollars and scale with each country's purchasing power.</p></div>
<div class="c"><h3>📰 اخبار جهان</h3>${s.wn.length?`<ul>${s.wn.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:'<p class="mu">فعلاً خبری نیست؛ با گذر سال‌ها اخبار اقتصادی ثبت می‌شود.</p>'}</div>`;
 if(s.age>=18){b+=`<div class="c"><h3>نقل مکان در ${esc(s.co)}</h3><div class="row">${co.c.filter(x=>x!=s.city).map(x=>`<button onclick="moveCity('${x}')">${x}</button>`).join('')}</div><p class="mu">هزینه ${fm(10*s.m)}؛ شغل فعلی را از دست می‌دهی.</p></div><div class="c"><h3>مهاجرت</h3><p class="mu">هزینه ${fm(400*s.m)}؛ حداقل کارشناسی لازم است. خانه و خودرو فروخته می‌شود و شغل را از دست می‌دهی.</p><div class="row">${Object.keys(C).filter(x=>x!=s.co).map(x=>`<button onclick="migrate('${x}')">${x}</button>`).join('')}</div></div>`}
 return b}
/* ===== Life Goals System ===== */
const GOALS_DEF=[
 {id:'wealth1',fa:'ثروت ۱ میلیون',en:'Wealth $1M',check:()=>net()>=1000*S.m,icon:'💰'},
 {id:'wealth10',fa:'ثروت ۱۰ میلیون',en:'Wealth $10M',check:()=>net()>=10000*S.m,icon:'💎'},
 {id:'marry30',fa:'ازدواج تا ۳۰ سالگی',en:'Marry by age 30',check:()=>S.married&&S.age<=30,icon:'💍'},
 {id:'kids3',fa:'۳ فرزند',en:'Have 3 children',check:()=>S.kids>=3,icon:'👶'},
 {id:'degree',fa:'مدرک کارشناسی',en:'Bachelor degree',check:()=>S.edu>=1,icon:'🎓'},
 {id:'master',fa:'مدرک کارشناسی ارشد',en:'Master degree',check:()=>S.edu>=2,icon:'📜'},
 {id:'doctor',fa:'پزشک شدن',en:'Become a doctor',check:()=>S.edu>=3,icon:'🩺'},
 {id:'home',fa:'صاحب خانه شدن',en:'Own a house',check:()=>!!S.home,icon:'🏠'},
 {id:'car',fa:'صاحب خودرو شدن',en:'Own a car',check:()=>!!S.car,icon:'🚗'},
 {id:'retire60',fa:'بازنشستگی تا ۶۰ سالگی',en:'Retire by age 60',check:()=>S.retired&&S.age<=60,icon:'🌅'},
 {id:'famous',fa:'شهرت بالا',en:'High fame',check:()=>S.st.fame>=50,icon:'⭐'},
 {id:'longlife',fa:'طول عمر ۸۰ سال',en:'Live to 80',check:()=>S.age>=80,icon:'🎂'},
];
function setGoal(id){const x=XE();x.goals=x.goals||{};if(!x.goals.active)x.goals.active=[];const idx=x.goals.active.indexOf(id);if(idx>=0)x.goals.active.splice(idx,1);else if(x.goals.active.length<5)x.goals.active.push(id);rend()}
function goalsCard(){const s=S,L=LANG,x=XE();x.goals=x.goals||{};
 const active=x.goals.active||[];
 const completed=Object.keys(x.goals).filter(k=>k.startsWith('done_')&&x.goals[k]).length;
 /* Check completed goals */
 GOALS_DEF.forEach(g=>{if(active.includes(g.id)&&g.check()&&!x.goals['done_'+g.id]){x.goals['done_'+g.id]=S.age;H(L==='fa'?'هدف محقق شد: ':'Goal achieved: '+(L==='fa'?g.fa:g.en));D('hp',10)}});
 const html=`<div class="c"><h3>🎯 ${L==='fa'?'اهداف زندگی':'Life Goals'}</h3><p class="mu">${L==='fa'?'تا ۵ هدف انتخاب کن. با محقق شدن هر هدف، خوشحالی افزایش می‌یابد.':'Select up to 5 goals. Each achievement boosts happiness.'}</p>
 <p class="mu">${L==='fa'?'اهداف محقق‌شده: ':'Completed goals: '}${fa(completed)}</p>
 <div class="row">${GOALS_DEF.map(g=>{const isOn=active.includes(g.id);const isDone=x.goals['done_'+g.id];return `<button class="${isDone?'p':''}" ${isDone?'disabled':''} onclick="setGoal('${g.id}')">${g.icon} ${L==='fa'?g.fa:g.en}${isDone?' ✓':''}</button>`}).join('')}</div></div>`;
 return html}
function tX(){const s=S,L=LANG;
 return`<div class="c"><h3>🏅 ${L==='fa'?'دستاوردها':'Achievements'} (${fa(Object.keys(s.ach).length)}/${fa(ACH.length)})</h3><div class="ach" style="margin-top:8px">${ACH.map(a=>`<div class="${s.ach[a[0]]!==undefined?'on':''}">${a.h&&s.ach[a[0]]===undefined?(L==='fa'?'❓ دستاورد مخفی':'❓ Hidden'):a[1]+' '+a[2]}${s.ach[a[0]]!==undefined?`<div class="mu">${L==='fa'?'در ':'At '}${fa(s.ach[a[0]])}${L==='fa'?' سالگی':' years old'}</div>`:''}</div>`).join('')}</div></div>
<div class="c"><h3>📜 ${L==='fa'?'تاریخچه مهم زندگی':'Key Life History'}</h3>${s.hist.length?`<ul>${s.hist.map(h=>`<li>${fa(h[0])} ${L==='fa'?'ساله: ':': '}${esc(h[1])}</li>`).join('')}</ul>`:`<p class="mu">${L==='fa'?'هنوز اتفاق مهمی ثبت نشده است.':'No major events recorded yet.'}</p>`}</div>
<div class="c"><h3>📰 ${L==='fa'?'رویدادهای اخیر':'Recent Events'}</h3><ul>${s.log.slice(0,15).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
<div class="c"><h3>📖 ${L==='fa'?'زندگینامه':'Biography'}</h3>${bioText()}<div class="row"><button onclick="exportBio()">${L==='fa'?'دانلود متن':'Download text'}</button></div></div>
${goalsCard()}`}
function tS(){const s=S,th=LS.get(THK)||'auto';
 return`<div class="c"><h3>${tx('language')}</h3><p class="mu">${LANG==='fa'?'فارسی: تقویم شمسی، تومان. | انگلیسی: تقویم میلادی، دلار.':'Persian: Jalali calendar, Toman. | English: Gregorian calendar, USD.'}</p><div class="row"><button class="${LANG==='fa'?'p':''}" onclick="setLang('fa')">🇮🇷 ${tx('persian')}</button><button class="${LANG==='en'?'p':''}" onclick="setLang('en')">🇬🇧 ${tx('english')}</button></div></div>
<div class="c"><h3>${tx('theme')}</h3><div class="row"><button class="${th=='auto'?'p':''}" onclick="setTheme('auto')">${tx('auto')}</button><button class="${th=='light'?'p':''}" onclick="setTheme('light')">${tx('light')}</button><button class="${th=='dark'?'p':''}" onclick="setTheme('dark')">${tx('dark')}</button></div></div>
<div class="c"><h3>${tx('storage')}</h3><p class="mu">${tx('slot')} ${fa(s.slot||0)} · ${LANG==='fa'?'ذخیره خودکار پس از هر رویداد':'Auto-save after each event'} · ${tx('data_version')}: ${fa(VER)}</p><div class="row"><button class="p" onclick="save();msg(tx('saved'))">${tx('save_manual')}</button><button onclick="goMenu()">${tx('slot_menu')}</button><button class="d" onclick="delSlot(${s.slot||0})">${tx('delete_life')}</button></div></div>${tSX()}`}

function rendCore(){const e=$('#app');if(!e)return;
 if(!S){e.innerHTML=titleHTML();return}
 if(S.dead){e.innerHTML=deadHTML();return}
 const s=S,fn={i:tI,u:tU,v:tV,z:tZ,k:tK,h:tH,c:tC,r:tR,j:tJ,f:tF,a:tA,p:PH,w:tW,x:tX,s:tS}[s.tab]||tH;
 let b=head()+fn();
 if(s.rs&&!s.ev)b+=`<div class="mod" role="dialog" aria-modal="true"><div class="c"><p>${esc(s.rs.t)}</p><div>${chips(s.rs.d)}</div><button class="p o" onclick="S.rs=null;rend()">ادامه</button></div></div>`;
 if(s.ev){const v=evOf(s.ev.id);if(v)b+=`<div class="mod" role="dialog" aria-modal="true"><div class="c"><div class="em">${v.e}</div><div class="mu" style="text-align:center">رویداد · ${fa(s.age)} ساله</div><h2 style="text-align:center">${v.t}</h2><p>${esc(typeof v.x=='function'?v.x():v.x)}</p>${s.ev.res?`<div class="news ${evTone(s.ev.d)}">${esc(s.ev.res)}</div><div>${chips(s.ev.d||[])}</div><button class="p o" onclick="S.ev=null;run()">ادامه</button>`:v.o.map((o,i)=>`<button class="o" onclick="pickO(${i})">${o[0]}</button>`).join('')}</div></div>`}
 e.innerHTML=b}
/* ===================== v2: مسیرها، خانواده، کسب‌وکار، بازار، سلامت، جرم ===================== */
const XCO=[['نفت‌پارس',.9],['دیجی‌تک',1.6],['مسکن‌ساز',1],['دارویار',1.2],['غذاسان',.8],['انرژی‌نو',1.8]];
const XDIS=[['dia','دیابت',.3],['hyp','فشار خون',.25],['heart','بیماری قلبی',.4],['dep','افسردگی',.35],['asth','آسم',.2]];
const XSK={art:'🎨 هنر',model:'📸 مدلینگ',sport:'🏅 ورزش',music:'🎵 موسیقی',biz:'💼 تجارت',code:'💻 فنی'};
const XKN=['Aiden','Mia','Noah','Zoe','Ryan','Ella','Owen','Hannah'];
const XTR={math:'ریاضی',bio:'تجربی',hum:'انسانی',art:'هنر','':'—'};
const XD=(k,v)=>{const w=Math.floor(Math.abs(v));D(k,Math.sign(v)*(w+(rnd()<Math.abs(v)-w?1:0)))};
function XE(){const x=S.x=S.x||{};const d={sk:{art:0,sport:0,music:0,biz:0,code:0},dis:[],kids:[],nl:[],hs:[]};
 for(const k in d)if(!x[k]||typeof x[k]!='object')x[k]=d[k];
 for(const k of['rec','jail','par','gk','rent','pet'])if(typeof x[k]!='number')x[k]=0;
 if(typeof x.hi!='number')x.hi=1;if(!x.gen)x.gen=1;if(typeof x.trk!='string')x.trk='';if(typeof x.career!='string')x.career='';
 if(!x.stk)x.stk={p:XCO.map(c=>10*c[1]),o:XCO.map(()=>0)};if(!x.her)x.her=[pick(XDIS)[0],pick(XDIS)[0]];return x}
const XNW=()=>{const x=S.x;if(!x)return 0;return(x.stk?x.stk.o.reduce((a,n,i)=>a+n*x.stk.p[i]*S.m,0):0)+(x.co?(x.co.emp*12+30)*S.m:0)};
/* ---- حلقه ماهانه ---- */
const xt0=tick;
tick=function(){const s=S,x=XE(),m=s.m,r=xt0();if(s.dead)return r;const ad=s.age>=18;
 x.hi=Math.max(.5,x.hi*(1+(R(-12,20)+({n:0,b:8,r:-10}[s.eco.t]))/1000));
 XCO.forEach((c,i)=>{x.stk.p[i]=Math.max(1,x.stk.p[i]*(1+(R(-60,70)*c[1]+({n:0,b:15,r:-25}[s.eco.t]))/1000));if(x.stk.o[i]&&rnd()<.08)s.cash+=x.stk.o[i]*x.stk.p[i]*m*.03});
 if(x.jail>0){x.jail--;D('hp',-2);if(!x.jail){x.par=12;log('از زندان آزاد شدی؛ یک سال آزادی مشروط هستی.')}}else if(x.par>0)x.par--;
 if(ad&&x.career&&x.jail<=0){const k=x.career;if(k=='sport'&&s.age>38){x.career='';log('دوران ورزش حرفه‌ای‌ات تمام شد.')}else s.cash+=x.sk[k]*.35*m*(k=='sport'?1.2:1)}
 if(x.rent&&!s.home)x.rent=0;if(x.rent)s.cash+=6*x.hi*m;
 if(x.pet){s.cash-=.8*m;XD('hp',.6)}
 x.dis.forEach(d=>{XD('h',d.tx?-.05:d.known?-.25:-.3);if(d.id=='dep'&&!d.tx)XD('hp',-.8)});
 const c=x.co;if(c&&ad){if(rnd()<.05)c.riv=cl(c.riv+(rnd()<.6?1:-1),0,4);
  const rev=(10+c.emp*9+c.ads*6+x.sk.biz/4)*m*({n:1,b:1.2,r:.8}[s.eco.t])*Math.pow(.88,c.riv),p=rev-(c.emp*7+c.ads*3+4)*m;s.cash+=p;c.pf=p;c.neg=p<0?c.neg+1:0;
  if(c.neg>=8||(s.cash<-150*m&&p<0)){x.co=null;D('hp',-12);D('str',12);log('شرکتت ورشکست شد و تعطیل شد؛ می‌توانی بعداً دوباره شروع کنی.');H('شرکت ورشکست شد.')}}
 return r};
/* ---- حلقه سالانه ---- */
const xy0=yearly;yearly=function(){xy0();if(!S.dead)XY()};
function XY(){const s=S,x=XE(),m=s.m,L=LANG,nl=t=>{x.nl.unshift(fa(s.age)+': '+t);x.nl=x.nl.slice(0,12)};
 while(x.kids.length<s.kids)x.kids.push({n:pick(XKN),age:0,g:rnd()<.5?'Female':'Male'});
 x.kids.forEach(k=>{k.age++;if(k.age==28&&!k.mar){k.mar=1;const q=R(0,3);x.gk+=q;if(q)nl(L==='fa'?'فرزندت '+k.n+' صاحب '+fa(q)+' فرزند شد؛ نوه‌دار شدی!':'Your child '+k.n+' had '+fa(q)+' kids; you became a grandparent!')}});
 /* ===== NPC Intelligence: NPCs live their own lives, make decisions, remember interactions ===== */
 s.npcs.forEach(n=>{if(!n.alive||n.cut||n.role=='father'||n.role=='mother')return;
  const Li=n.life=n.life||{j:0,m:0,k:0,a:0},r=rnd();
  /* NPCs make autonomous life decisions based on personality */
  if(n.age>=20&&!Li.j&&r<.3){Li.j=1;n.fin=L==='fa'?'خوب':'good';nl(L==='fa'?n.n+' شغل پیدا کرد.':n.n+' found a job.')}
  else if(n.role=='friend'&&n.age>=24&&!Li.m&&r<.12){Li.m=1;nl(L==='fa'?n.n+' ازدواج کرد.':n.n+' got married.')}
  else if(n.role=='friend'&&Li.m&&!Li.k&&r<.2){Li.k=1;nl(L==='fa'?n.n+' صاحب فرزند شد.':n.n+' had a child.')}
  else if(!Li.a&&n.age>=22&&r<.05){Li.a=1;n.love=cl(n.love-15);nl(L==='fa'?n.n+' مهاجرت کرد؛ رابطه‌تان کم‌رنگ شد.':n.n+' emigrated; your relationship faded.')}
  else if(r<.08){n.fin=L==='fa'?'ضعیف':'poor';mem(n,L==='fa'?'دچار مشکل مالی شد.':'Had financial trouble.');nl(L==='fa'?n.n+' دچار مشکل مالی شد.':n.n+' ran into financial trouble.')}
  /* NPC relationship decay and dynamic reactions based on player behavior */
  if(n.role=='friend'){n.love=cl(n.love-R(0,4));
   /* NPCs remember player's recent actions and react */
   if(n.love<30&&rnd()<.25){n.cut=1;nl(L==='fa'?n.n+' رابطه را با تو قطع کرد.':n.n+' cut ties with you.');H(L==='fa'?n.n+' دوستی را تمام کرد.':n.n+' ended the friendship.')}}
  /* NPC personality-driven decisions: confident NPCs more likely to act, sociable ones keep in touch */
  if(n.pers&&rnd()<.15){const conf=(n.pers.match(/مطمئن|confident|جسور/i)?1:0),soc=(n.pers.match(/اجتماعی|social|مهربان|friendly/i)?1:0);
   if(soc&&rnd()<.5){n.love=cl(n.love+R(1,3));nl(L==='fa'?n.n+' با تو تماس گرفت و حال احوال پرسید.':n.n+' called you to catch up.')}
   if(conf&&n.age>=25&&!Li.j&&rnd()<.3){Li.j=1;n.fin=L==='fa'?'خوب':'good';nl(L==='fa'?n.n+' با جسارت شغل بهتری گرفت.':n.n+' boldly landed a better job.')}}});
 XDIS.forEach(d=>{if(x.dis.some(q=>q.id==d[0]))return;let p=Math.max(0,(s.age-20)/500)*d[2]+(s.st.str>65?.01:0);if(x.her.includes(d[0]))p*=2.5;if(rnd()<p)x.dis.push({id:d[0],n:d[1],known:0,tx:0})});
 if(s.ins)x.dis.forEach(d=>{if(!d.known&&rnd()<.5){d.known=1;nl(L==='fa'?'در معاینه بیمه '+d.n+' تشخیص داده شد؛ می‌توانی از «مسیر زندگی» درمانش کنی.':'Insurance exam detected '+d.n+'; you can treat it from the Life Path tab.')}});
 const nw=net();if(nw>1500*m){const t=nw*.01;s.cash-=t;log(L==='fa'?'مالیات دارایی '+fm(t)+' پرداخت شد.':'Property tax '+fm(t)+' paid.')}if(s.home)s.cash-=housePrice()*.003;
 x.hs.push([s.age,Math.round(nw/m),Math.round(s.st.h),Math.round(s.st.hp)]);x.hs=x.hs.slice(-120);
 if(s.age>=6&&s.age<=24){const t=s.st.iq*.5+s.tr.di*.4+R(-10,15)-(s.st.str>70?10:0);x.gpa=cl(Math.round(x.gpa?x.gpa*.6+t*.4:t))}}
/* ---- شغل: سابقه کیفری و اثر رشته ---- */
const xa0=apply;apply=function(i){const x=XE(),L=LANG;if(x.jail>0)return msg(L==='fa'?'در زندان نمی‌توانی کار کنی.':'You cannot work while in prison.');
 if(x.rec&&S.age>=18&&!S.job&&!S.ev&&!S.retired&&rnd()<.5)return msg(L==='fa'?'سابقه کیفری باعث رد شدن درخواستت شد.':'Your criminal record caused your application to be rejected.');
 const had=S.job;xa0(i);if(!had&&S.job){const n=S.job.n;
  /* High school track bonus */
  if((x.trk=='math'&&/Programmer|Project/.test(n))||(x.trk=='bio'&&n=='Doctor')||(x.trk=='hum'&&/Teacher|Office/.test(n))){S.job.sal*=1.1;log(L==='fa'?'رشته دبیرستانت به استخدامت کمک کرد؛ حقوق ۱۰٪ بیشتر.':'Your high school track helped; salary +10%.')}
  /* Career path skill bonus: if you have a matching career path, salary increases */
  if(x.career){const cs=x.sk[x.career]||0;if(cs>=50){const bonus=1+cs/200;S.job.sal=Math.round(S.job.sal*bonus);log((L==='fa'?'مهارت مسیر حرفه‌ای‌ات ('+cs+') حقوقت را ':'Your career path skill ('+cs+') boosted salary by ')+fa(Math.round((bonus-1)*100))+'%')}}}};
/* ---- اقدامات ---- */
function XTrain(k){const s=S,x=XE(),L=LANG;if(s.ev||s.st.en<15)return msg(L==='fa'?'انرژی کافی نداری.':'Not enough energy.');if(!can(2))return msg((L==='fa'?'هزینه تمرین ':'Training costs ')+fm(2*S.m)+'.');cst(2);
 res(()=>{x.sk[k]=Math.min(100,x.sk[k]+R(2,5)+(s.st.iq>70?1:0));D('en',-20);
  /* Training also gives small personality boosts */
  if(k=='art')T('cr',1);if(k=='sport'){D('h',1);T('di',1)}if(k=='music')T('so',1);if(k=='biz')T('am',1);if(k=='code')D('iq',1);
  return (L==='fa'?'تمرین ':'Trained ')+XSK[k].replace(/^[^\s]+ /,'')+(L==='fa'?'؛ مهارت بالا رفت.':'; skill improved.')},12)}
/* Career path: now affects job opportunities and salary */
function XCareer(k){const x=XE(),L=LANG;if(x.jail>0)return;x.career=k;
 /* Starting a career path gives immediate skill boost and unlocks income */
 x.sk[k]=Math.min(100,(x.sk[k]||0)+10);
 msg((L==='fa'?'مسیر حرفه‌ای ':'Career path ')+XSK[k].replace(/^[^\s]+ /,'')+(L==='fa'?' شروع شد. مهارتت با تمرین رشد می‌کند و درآمد از آن می‌آید.':' started. Train to grow your skill and earn income.'))}
/* Skill-based income: characters with high skill in their career path earn passive income */
function skillIncome(){const x=XE();if(!x.career)return 0;const sk=x.sk[x.career]||0;if(sk<30)return 0;return Math.round(sk*.4*S.m*DSA())}
function XStartCo(){const s=S,x=XE();if(s.age<20||x.co||x.jail>0)return;if(!can(40))return msg('سرمایه شروع '+fm(40*s.m)+' است.');pay(40);x.co={n:'شرکت '+s.name,emp:0,ads:0,riv:0,neg:0,pf:0};H('شرکت تأسیس کردی.');msg('شرکت تأسیس شد.')}
function XCoOp(k){const s=S,x=XE(),c=x.co;if(!c)return;
 if(k=='hire'){if(c.emp>=12||!can(5))return msg('امکان استخدام نیست.');pay(5);c.emp++;msg('یک کارمند استخدام کردی.')}
 else if(k=='fire'){if(c.emp<1)return;c.emp--;msg('یک نفر را تعدیل کردی.')}
 else if(k=='ad'){if(c.ads>=5||!can(8))return msg('تبلیغات بیشتر ممکن نیست.');pay(8);c.ads++;msg('کمپین تبلیغاتی راه انداختی.')}
 else if(k=='sell'){s.cash+=(c.emp*12+c.ads*6+15)*s.m;x.co=null;H('شرکت را فروختی.');msg('شرکت را فروختی.')}}
function XCheck(){if(S.ev||!can(3))return msg('هزینه آزمایش '+fm(3*S.m)+' است.');const x=XE();med(3);const u=x.dis.filter(d=>!d.known);u.forEach(d=>d.known=1);res(()=>u.length?'آزمایش‌ها نشان داد: '+u.map(d=>d.n).join('، ')+' داری.':'آزمایش‌ها سالم بود.',3)}
function XTreat(i){const d=XE().dis[i];if(!d||d.tx||!can(8))return msg('هزینه درمان '+fm(8*S.m)+' است.');med(8);d.tx=1;D('h',4);if(d.id=='dep')D('hp',10);msg('درمان '+d.n+' را شروع کردی.')}
function XCrime(k){const s=S,x=XE();if(s.age<18||s.ev||x.jail>0)return;const f=k!='t',H2=k=='h',g=(H2?R(300,800):f?R(60,150):R(8,25))*s.m,p=H2?.65:f?.5:.35;
 res(()=>{if(rnd()>p){s.cash+=g;D('str',6);return (f?'کلاهبرداری':'سرقت')+' موفق بود: '+fm(g)+'. اما ترس لو رفتن رهایت نمی‌کند.'}
  x.rec++;s.cash-=g*1.5;x.jail=(H2?48:f?24:6)*(x.par>0?2:1);s.job=null;D('hp',-15);D('str',15);NR(g2('mother'),-8,-15,-15,5);H('دستگیر و زندانی شدی.');return 'دستگیر شدی؛ دادگاه تو را به '+fa(x.jail)+' ماه زندان و جریمه محکوم کرد. شغلت را از دست دادی و سابقه کیفری گرفتی.'},10)}
const g2=r=>g(r);
const XEN={trip:['✈️ سفر',12,20,{hp:15,str:-15},'سفر فوق‌العاده‌ای بود.'],con:['🎤 کنسرت',3,5,{hp:6},'شب خوبی بود.'],par:['🎉 مهمانی',2,5,{hp:5,str:-4},'با دوستان خوش گذراندی.'],clo:['👕 خرید لباس',3,3,{lk:3,hp:2},'ظاهر جدیدت خوب است.'],vol:['🤝 کار داوطلبانه',0,10,{hp:5,fame:2},'حس مفید بودن داشتی.'],gam:['🎮 بازی ویدئویی',1,5,{hp:4,str:-5},'ساعتی استراحت.']};
function XFun(k){const a=XEN[k];if(S.age<12||S.ev||!can(a[1]))return msg('پول کافی نیست.');cst(a[1]);res(()=>{for(const q in a[3])D(q,a[3][q]);return a[4]},a[2])}
function XPet(){if(S.age<18||XE().pet||!can(4))return;pay(4);XE().pet=1;D('hp',8);msg('یک حیوان خانگی به خانه آوردی؛ ماهانه کمی هزینه دارد ولی خوشحالت می‌کند.')}
function XStk(i,d){const x=XE(),p=x.stk.p[i]*S.m*10;if(S.age<18||S.ev)return;
 if(d>0){if(S.cash<p)return msg('برای ۱۰ سهم '+fm(p)+' لازم است.');S.cash-=p;x.stk.o[i]+=10;msg('۱۰ سهم '+XCO[i][0]+' خریدی.')}
 else{if(x.stk.o[i]<10)return;S.cash+=p*.99;x.stk.o[i]-=10;msg('۱۰ سهم '+XCO[i][0]+' فروختی.')}}
function XRent(){if(!S.home)return msg('خانه‌ای برای اجاره دادن نداری.');XE().rent=XE().rent?0:1;msg(XE().rent?'خانه را اجاره دادی؛ اکنون بیرون اجاره‌نشین هستی و درآمد ماهانه دارد.':'اجاره‌دادن را متوقف کردی.')}
/* ---- نسل بعد ---- */
function XHeir(i){const o=S,x=o.x,c=x.kids[i];if(!o.dead||!c)return;
 const sh=Math.max(0,net())*.85/Math.max(1,x.kids.length),pa=o.npcs.find(n=>n.role=='partner'&&n.alive&&o.married),dd=mk(o.g=='Male'?'father':'mother',o.name,o.age,'Deceased','—','متوسط',60,'پدر/مادرت بود.');dd.alive=0;
 const pp=pa?mk(o.g=='Male'?'mother':'father',pa.n,pa.age,pa.pers,pa.goal,pa.fin,70,'پدر/مادرت بود.'):null;
 const n=Object.assign({},o,{name:c.n,g:c.g,age:c.age,bm:R(0,11),d:0,dead:null,cash:sh,inv:0,home:i==0&&o.home?1:0,car:0,ins:0,edu:0,study:null,job:null,exp:0,biz:0,retired:0,pen:0,married:0,kids:0,loan:null,ev:null,rs:null,pend:0,tab:'h',app:'',fl:{},hist:[[c.age,'نسل بعد: زندگی را از '+o.name+' به ارث بردی.']],log:[],
  npcs:[dd,...(pp?[pp]:[]),mk('friend',pick(FRN),c.age,'شوخ','می‌خواهد با تو وقت بگذراند','متوسط',60,'دوست قدیمی')],
  st:{h:R(70,95),hp:60,iq:cl(o.st.iq+R(-12,10)),lk:R(40,85),en:80,fame:R(0,5),str:15},
  gb:{n:0,w:0,l:0,add:0,debt:0,mb:0,s:0},dt:{sw:8,mt:0,dd:0,bk:0,os:0,cards:[],ms:[],preg:0}});
 n.mo=n.mo>11?0:n.mo;n.news='نسل بعد: تو حالا '+c.n+' هستی و '+fm(sh)+' ارث رسیده است.';
 n.x={gen:x.gen+1,nm:1,hi:x.hi,sk:{art:0,sport:0,music:0,biz:0,code:0},stk:{p:x.stk.p,o:XCO.map(()=>0)},dis:[],kids:[],nl:[],hs:[],her:x.her,rec:0,jail:0,par:0,gk:0,rent:0,pet:0,trk:'',career:'',co:null};
 S=n;chkAch();save();rend()}
const xd0=deadHTML;deadHTML=function(){let h=xd0();const x=S.x;if(x&&x.kids&&x.kids.length&&S.age>0){const ok=x.kids.map((k,i)=>[k,i]).filter(([k])=>k.age>=16);if(ok.length)h+=`<div class="c"><h3>👪 ادامه‌ی راه؛ نسل بعد</h3><p class="mu">دارایی (پس از ۱۵٪ مالیات ارث) بین ${fa(x.kids.length)} فرزند تقسیم می‌شود. با کدام فرزند ادامه می‌دهی؟</p>${ok.map(([k,i])=>`<button class="p" onclick="XHeir(${i})">ادامه با ${esc(k.n)} (${fa(k.age)} ساله)</button>`).join('')}</div>`}return h};
/* ---- رویدادهای زنجیره‌ای و تازه ---- */
const xe=(id,e,w,a,once,c,t,x,o)=>EV.push({id,e,w,a,once,c,t,x,o}),FL=k=>S.fl[k];
xe('trk15','🧭',9,[15,15],1,s=>1,'Choosing a Track','It’s time to choose a track; this decision will affect your career, friends, emigration and your family’s view of you for years.',[
 ['Math',()=>{const x=XE();x.trk='math';x.sk.code+=15;D('iq',3);NR(g('father'),5,0,6);return 'You chose math; the technical path and emigration are more open to you.'}],
 ['Biology',()=>{XE().trk='bio';D('iq',2);NR(g('mother'),6,0,8);return 'You chose biology; the path to medicine opened up, but competition is tough.'}],
 ['Humanities',()=>{XE().trk='hum';T('so',6);NR(fr(),6,4,0);return 'You chose humanities; your social circle grew wider.'}],
 ['Art',()=>{const x=XE();x.trk='art';x.sk.art+=22;T('cr',8);NR(g('father'),-8,-3,-10);return 'You chose art; your family worries about your future, but your talent blossomed.'}]]);
xe('trkout','🌍',5,[22,32],1,s=>s.x&&s.x.trk=='math','Overseas Job Offer','Because of the track you chose, a foreign company offered you a job.',[['I accept',()=>{S.cash+=20*S.m;D('str',6);return 'You took the offer and received a signing bonus; apply for emigration from the “World” tab.'}],['I stay',()=>{D('hp',3);return 'You preferred to stay.'}]]);
xe('tal','🌟',6,[7,11],1,s=>1,'Discovering a Talent','Your teacher says they’ve seen something special in you. Which one do you pursue?',['music','sport','art','biz'].map(k=>[XSK[k],()=>{XE().sk[k]+=25;D('hp',4);return 'Your talent in  '+XSK[k]+' has started growing from now on; later you can make it your life path.'}]));
xe('mvsch','🏫',4,[8,13],1,s=>1,'Changing Schools','Your family moved to another city and your school changed.',[['I take it hard',()=>{NR(fr(),-20,-5);D('hp',-6);return 'You missed your old friend.'}],['I make new friends',()=>{D('hp',5);T('so',4);return 'You settled into the new school quickly.'}]]);
xe('div','💔',3,[8,16],1,s=>has('father')&&has('mother')&&XE().pc>=70&&((XE().evc&&XE().evc.pfight)||0)>=2&&rnd()<.3,'Parents divorce','After years of tension, your parents have decided to separate. You have to choose who you will live with.',[['Live with Mom',()=>XDiv('mother')],['Live with Dad',()=>XDiv('father')]]);
function XDiv(k){const o=k=='mother'?'father':'mother',x=XE();NR(g(k),8,8);NR(g(o),-10,-8);D('hp',-10);D('str',10);x.cust=k;x.divAge=S.age;x.so=rnd()<.6?1:0;H('Your parents divorced; you live with your '+k+'.');return 'You now live with your '+k+'. The house is quieter, but sadder. You can still see your '+o+' from the Relations tab.'}
function XFam(){const s=S,x=XE();if(x.cust&&x.so&&!x.step&&s.age<=24&&s.age-x.divAge>=2&&s.npcs.length<8&&rnd()<.25){x.step=1;const m=x.cust=='mother',n=mk('step',XNM(m?'m':'f'),R(34,50),'Newcomer in the family','wants to fit in','متوسط',35,'Joined your family after your parents split.');n.anger=R(5,20);s.npcs.push(n);H('Your '+(m?'mom':'dad')+' married '+n.n+'.');x.nl.unshift(fa(s.age)+': '+n.n+' is now your '+(m?'stepfather':'stepmother')+'.')}}
xe('ptj','🛵',4,[15,17],1,s=>1,'Part-Time Job','You can work over the summer.',[['I work',()=>{S.cash+=4*S.m;D('str',4);T('di',3);return 'You earned your first income through your own effort.'}],['Rest',()=>{D('hp',5);return 'You had a great summer.'}]]);
xe('mil','🪖',8,[19,26],1,s=>s.g=='Male'&&s.co=='Iran','Military Service','It’s time for military service.',[['I go',()=>{D('str',6);D('h',3);T('di',6);return 'It was a hard period, but it built character.'}],['Medical or paid exemption',()=>{pay(25);return 'You paid the fee and were exempted from service.'}]]);
xe('brk','💔',3,[18,40],0,s=>has('partner')&&!s.married,'Heartbreak','Your relationship with  '+' has hit a dead end.',[['I end it',()=>{const p=g('partner');p.cut=1;D('hp',-18);D('str',10);return 'The relationship ended; it takes time to heal.'}],['I give a second chance',()=>{NR(g('partner'),-5,-5);D('str',4);return 'You decided to try harder.'}]]);
xe('fr1','🧒',6,[8,13],1,s=>has('friend'),'A Secret Between Friends','You and your friend made a big childish secret.',[['I keep their secret',()=>{NR(fr(),12,10);S.fl.fa=1;return 'Your friendship grew strong.'}],['I tell others',()=>{NR(fr(),-5,-15,-5,5);S.fl.fa=1;return 'You regretted it very soon.'}]]);
xe('fr2','⚡',6,[14,18],1,s=>has('friend')&&FL('fa'),'Conflict with a Friend','You got into a fight with your old friend over a misunderstanding.',[['I apologize',()=>{NR(fr(),8,10,5,-10);S.fl.fb=1;return 'You made up.'}],['I keep my distance',()=>{NR(fr(),-25,-15,-8,15);S.fl.fb=1;return 'You drifted apart for years.'}]]);
xe('fr3','👋',6,[20,28],1,s=>has('friend')&&FL('fb'),'Reunion','You ran into your childhood friend by chance.',[['I make plans',()=>{NR(fr(),15,12);S.fl.fc=1;return 'Your friendship came back to life.'}],['A quick hello',()=>{S.fl.fc=1;return 'There was nothing left to say.'}]]);
xe('fr4','🤝',7,[28,36],1,s=>has('friend')&&FL('fc')&&s.cash>=30*s.m,'Partnership Offer','Your friend wants to start a company with you.',[['I become a partner',()=>{pay(30);const x=XE();if(!x.co)x.co={n:'Joint company with  '+fr().n,emp:2,ads:1,riv:0,neg:0,pf:0};S.fl.fd=1;return 'The joint company got started.'}],['I decline',()=>{NR(fr(),-8,-4);return 'You turned down the offer.'}]]);
xe('fr5','🗡️',9,[38,48],1,s=>has('friend')&&FL('fd'),'Partner’s Betrayal','You found out your partner has been moving company money around.',[['I file a complaint',()=>{const x=XE();x.co=null;fr().cut=1;pay(20);D('str',12);return 'The case closed and the partnership dissolved; the friendship is over.'}],['I forgive',()=>{NR(fr(),5,-30,0,-5);pay(40);D('hp',-5);return 'You forgave, but your trust isn’t what it was and you lost money.'}]]);
xe('schol','🎓',9,[17,19],1,s=>s.x&&s.x.gpa>=75,'Academic Scholarship','Your high GPA led a university to offer you a scholarship.',[['Scholarship abroad',()=>{S.cash+=15*S.m;D('str',6);D('iq',2);return 'The path to study abroad opened up; emigrate from the “World” tab.'}],['Stay in town',()=>{D('hp',3);return 'You chose to stay.'}]]);
xe('expel','🚫',8,[18,30],1,s=>s.study&&s.x&&s.x.gpa<45,'Expulsion Warning','Your GPA has dropped so far that the university has issued a warning.',[['I make up for it',()=>{D('str',10);T('di',4);return 'You started a strict plan.'}],['Withdraw',()=>{S.study=null;D('hp',-8);return 'You quit your studies; you’ll have to find another path.'}]]);
xe('pill','🏥',6,[45,65],1,s=>has('father')||has('mother'),'Parents’ Illness','Your parents have fallen ill and need care.',[['I care for them',()=>{D('str',10);const p=has('father')?g('father'):g('mother');NR(p,12,10,10);return 'You stayed by their side.'}],['Treatment costs',()=>{med(20);const p=has('father')?g('father'):g('mother');p.h=cl(p.h+15);return 'You paid for the treatment.'}]]);
xe('lone','🕯️',6,[68,95],1,s=>1,'Loneliness in Old Age','The house is quiet and several old friends are gone.',[['I call my children',()=>{D('hp',6);return 'Your grandchildren’s voices lifted your mood.'}],['I reflect on memories',()=>{D('hp',2);return 'You looked back on your life with pride.'}]]);
/* ---- دستاوردهای تازه ---- */
ACH.push(['x_leg','👑','نسل بعد را ادامه دادی',()=>S.x&&S.x.gen>1],['x_biz','🏢','شرکتی با ۱۰ کارمند ساختی',()=>S.x&&S.x.co&&S.x.co.emp>=10],['x_star','🏆','ستاره حرفه‌ای شدی',()=>S.x&&S.x.career&&S.x.sk[S.x.career]>=90],['x_jail','🔒','تجربه زندان',()=>S.x&&S.x.rec>0],['x_gk','👵','نوه‌دار شدی',()=>S.x&&S.x.gk>0]);
/* ---- رابط کاربری ---- */
function XB(f,t,c){return`<button${c?` class="${c}"`:''} onclick="${f}">${t}</button>`}
function tZ(){const s=S,x=XE(),m=s.m,ad=s.age>=18,c=x.co;
 let h=`<div class="c"><h3>🧭 مسیرهای زندگی</h3><p class="mu">رشته: ${XTR[x.trk]} · مسیر حرفه‌ای: ${x.career?XSK[x.career]:'—'} · معدل: ${x.gpa?fa(x.gpa):'—'}</p>`+Object.keys(XSK).map(k=>`<div class="mu">${XSK[k]}: ${fa(Math.round(x.sk[k]))}/۱۰۰</div><div class="row">${s.age>=6?XB(`XTrain('${k}')`,'تمرین'):''}${ad&&x.sk[k]>=45&&k!='biz'&&k!='code'?XB(`XCareer('${k}')`,'مسیر حرفه‌ای'):''}</div>`).join('')+'</div>';
 h+=`<div class="c"><h3>🏢 شرکت شخصی</h3>`+(c?`<p>${esc(c.n)} · کارمند: ${fa(c.emp)} · تبلیغات: ${fa(c.ads)} · رقبا: ${fa(c.riv)}</p><p class="mu">سود ماه گذشته: ${fm(c.pf||0)}</p><div class="row">${XB("XCoOp('hire')",'استخدام')}${XB("XCoOp('fire')",'تعدیل')}${XB("XCoOp('ad')",'تبلیغ')}${XB("XCoOp('sell')",'فروش شرکت','d')}</div>`:`<p class="mu">با ${fm(40*m)} سرمایه (از ۲۰ سالگی) شرکت بزن؛ کارمند، تبلیغات و رقابت دارد و ممکن است ورشکست شود.</p>${s.age>=20?XB('XStartCo()','تأسیس شرکت','p'):''}`)+'</div>';
 h+=`<div class="c"><h3>🩺 سلامت</h3>`+(x.dis.length?x.dis.map((d,i)=>`<div class="row"><span>${d.n} ${d.known?(d.tx?'· تحت درمان':'· تشخیص داده‌شده'):'· ناشناخته'}</span>${d.known&&!d.tx?XB(`XTreat(${i})`,'درمان'):''}</div>`).join(''):'<p class="mu">بیماری مزمن شناخته‌شده‌ای نداری.</p>')+`<p class="mu">ژن‌های خانوادگی و استرس بلندمدت روی بیماری‌ها اثر دارند.</p><div class="row">${XB('XCheck()','آزمایش پزشکی')}</div></div>`;
 h+=`<div class="c"><h3>🎭 سرگرمی</h3><div class="row">${Object.keys(XEN).map(k=>XB(`XFun('${k}')`,XEN[k][0])).join('')}${ad&&!x.pet?XB('XPet()','🐶 حیوان خانگی'):''}</div></div>`;
 if(ad)h+=`<div class="c"><h3>⚖️ جرم و قانون</h3><p class="mu">سابقه کیفری: ${fa(x.rec)}${x.jail>0?' · زندان: '+fa(x.jail)+' ماه':x.par>0?' · آزادی مشروط: '+fa(x.par)+' ماه':''} · هر جرم خطر دستگیری، زندان و رد شدن در استخدام دارد.</p><div class="row">${XB("XCrime('t')",'سرقت','d')}${XB("XCrime('f')",'کلاهبرداری','d')}${XB("XCrime('h')",'سرقت بزرگ (ثروت یا زندان)','d')}</div></div>`;
 return h}
function XCh(){const h=XE().hs;if(h.length<2)return'<p class="mu">پس از چند سال نمودار نمایش داده می‌شود.</p>';const W=300,H=90,mn=Math.min(...h.map(r=>r[1])),mx=Math.max(mn+1,...h.map(r=>r[1])),L=(f,a,b,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2" points="${h.map((r,i)=>(i/(h.length-1)*W).toFixed(1)+','+(H-(f(r)-a)/(b-a)*H).toFixed(1)).join(' ')}"/>`;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${L(r=>r[1],mn,mx,'#3b82f6')}${L(r=>r[2],0,100,'#10b981')}${L(r=>r[3],0,100,'#f59e0b')}</svg><div class="mu">آبی: ثروت · سبز: سلامت · نارنجی: خوشحالی</div>`}
function tK(){const s=S,x=XE(),ad=s.age>=18,pt=g('partner');
 let h=`<div class="c"><h3>📊 نمودار زندگی</h3>${XCh()}</div>`;
 if(ad)h+=`<div class="c"><h3>📈 بورس</h3><p class="mu">نوسان ماهانه: حدود ۶٪− تا ۷٪+ (شرکت‌های پرریسک تا ۱۲٪)؛ رکود ۲٫۵٪− و رونق ۱٫۵٪+ اضافه می‌کند. هر خرید و فروش ۱۰ سهم است.</p>${XCO.map((c,i)=>`<div class="row"><span>${c[0]} · قیمت هر سهم: ${fm(x.stk.p[i]*s.m)} (${(x.stk.ch&&x.stk.ch[i]>=0?'▲ ':'▼ ')+fa(Math.abs((x.stk.ch||[])[i]||0).toFixed(1))}٪ ماه قبل) · دارم: ${fa(x.stk.o[i])}</span>${XB(`XStk(${i},1)`,'خرید ۱۰')}${XB(`XStk(${i},-1)`,'فروش ۱۰')}</div>`).join('')}</div><div class="c"><h3>🏘 بازار مسکن</h3><p class="mu">شاخص قیمت ملک: ${fa(Math.round(x.hi*100))} · قیمت فعلی: ${fm(housePrice())}</p>${s.home?XB('XRent()',x.rent?'پایان اجاره‌دادن':'اجاره دادن خانه'):''}</div>`;
 h+=`<div class="c"><h3>🌳 شجره‌نامه (نسل ${fa(x.gen)})</h3><ul>${s.npcs.filter(n=>n.role=='father'||n.role=='mother').map(n=>`<li>${RL[n.role]}: ${esc(n.n)} ${n.alive?'':'(Deceased)'}</li>`).join('')}<li>تو: ${esc(s.name)}</li>${pt.alive?`<li>${s.married?'همسر':'شریک'}: ${esc(pt.n)}</li>`:''}${x.kids.map(k=>`<li>فرزند: ${esc(k.n)} (${fa(k.age)} ساله)</li>`).join('')}${x.gk?`<li>نوه‌ها: ${fa(x.gk)}</li>`:''}</ul></div><div class="c"><h3>🧑‍🤝‍🧑 زندگی مستقل اطرافیان</h3>${x.nl.length?`<ul>${x.nl.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="mu">اطرافیانت زندگی خودشان را دارند؛ خبرها اینجا می‌آید.</p>'}</div>`;
 return h}

/* Tabs already defined with all entries in v4 */
/* ===================== v3 ===================== */
const NMS=[['James','Liam','Ethan','Noah','Lucas','Oliver','Mason','Henry','Daniel','Owen','Caleb','Jack'],['Emma','Sophia','Maya','Olivia','Chloe','Grace','Lily','Hannah','Zoe','Ruby','Nora','Ella']];
const XNM=g=>pick(NMS[g=='f'?1:g=='m'?0:R(0,1)]);
const pcXE=XE;XE=function(){const x=pcXE();if(typeof x.pw!='number')x.pw=rnd()<.3?R(45,95):R(0,40);if(!x.sm)x.sm={f:0,p:0};if(!x.of)x.of={on:0,sub:0,svc:[0,0,0,0,0]};if(!x.ex)x.ex=[];if(!x.cn)x.cn=[];if(typeof x.sk.model!='number')x.sk.model=0;if(typeof x.gpa!='number')x.gpa=0;
 if(!x.re)x.re=[0,1,2,3].map(()=>({n:XNM(),f:R(80,125)/100,own:0}));if(!x.rv)x.rv=[0,1,2].map(i=>({n:'گروه '+['صنعتی آرمان','تجاری سپهر','سرمایه نوین'][i],v:R(100,400)}));return x};
const cap=(k,n)=>{const c=XE().cap=XE().cap||{};if((c[k]||0)>=n){msg('سقف سالانه این کار تمام شده؛ سال بعد دوباره.');return 0}c[k]=(c[k]||0)+1;return 1};
const HC=[['شرکت قدرتمند وات اینترنشنال','قهرمان‌نما و منفعت‌طلب',['ولتیج','پالس','اسپارک']],['آسکورپ','شرور',['ویپر','گلوم','دارک‌فنگ']],['صنایع استارک','خوب',['آرک‌گارد','تکنو‌ناوت','نووا']],['انجمن نگهبانان','خوب',['شیلد‌ما','دیده‌بان','سپیده']]];
const SCH=[['Public school',0,0],['Public model school',3,2],['Private school',10,4],['International school',25,7]];
const UNI=[['Local university',.7,40,0],['Top public university',.5,75,4],['Private university',2.5,50,2],['International university',4,85,6]];
const XA={salon:['💇 آرایشگاه و پوست',2,12,{lk:3}],fit:['🏋️ تناسب اندام',1,14,{lk:3,h:2,en:-15}],style:['👗 استایل جدید',3,12,{lk:3,hp:2}],zen:['🧘 مدیتیشن',0,12,{str:-10,h:1,hp:3}],diet:['🥗 رژیم سالم',1,12,{h:3,lk:2}],ster:['💉 مکمل ممنوعه بدنسازی ⚠️',4,18,{lk:6,h:-6,hp:2}],smk:['🚬 سیگار/قلیان ⚠️',1,16,{str:-8,hp:3,h:-4}],nite:['🍸 شب‌نشینی پرمصرف ⚠️',3,18,{hp:8,lk:-2,h:-4,str:-6}],crash:['🥬 رژیم شدید ⚠️',0,16,{lk:5,h:-5,en:-15}]};
const XS={nose:['👃 جراحی بینی',40,{lk:10},.08,18],lip:['👄 فیلر لب و گونه',15,{lk:5},.04,18],lift:['🧴 لیفت صورت',70,{lk:12},.06,35],lipo:['⚕️ لیپوساکشن',50,{lk:6},.05,18],hair:['💈 کاشت مو',30,{lk:4},.02,18]};
const XF2=()=>({'Turkey':.6,'Iran':.5,'USA':1.4,'Japan':1.2,'Germany':1.1}[S.co]||1);
const DK={cin:['🎬 سینما',2,{hp:6}],res:['🍽 رستوران',4,{hp:8}],trip:['🏞 سفر دو نفره',15,{hp:14,str:-10}],walk:['🌳 پیاده‌روی',0,{hp:4,str:-5}],pic:['🧺 پیک‌نیک',1.5,{hp:7}],dance:['💃 کنسرت و رقص',5,{hp:9}]};
/* ---- هسته: گذر زمان فقط سالانه ---- */
advD=function(n){if(!S||S.ev||S.dead)return;commit()};
function XYear(){if(!S||S.ev||S.dead)return;XE().evy=0;S.pend=12*DM;run()}
/* Pass time button is now only in tH() to avoid duplication */
const xt1=tick;tick=function(){const s=S,x=XE(),pre=x.stk.p.slice(),r=xt1();if(s.dead)return r;
 x.stk.ch=x.stk.p.map((p,i)=>(p/pre[i]-1)*100);const m=s.m;
  {const hs=heroSal();if(hs>0&&x.jail<=0){s.cash+=hs;if(s.last)s.last.hero=hs}else if(s.last)s.last.hero=0}
  /* Skill-based passive income from career path */
  const si=skillIncome();if(si>0&&x.jail<=0){s.cash+=si;if(s.last)s.last.skillInc=si}
 if(x.of&&x.of.on)s.cash+=x.of.sub*.012*m*(1+x.of.svc.filter(Boolean).length*.3);
 (x.re||[]).forEach(q=>{if(q.own)s.cash+=housePrice()*q.f*.004});
 return r};
/* ---- حلقه سالانه ---- */
const xy1=yearly;yearly=function(){xy1();if(!S.dead)XY3()};
function XY3(){const s=S,x=XE(),m=s.m,nl=t=>{x.nl.unshift(fa(s.age)+': '+t);x.nl=x.nl.slice(0,12)};
 x.cap={};
 if(!x.nm){if(s.age<=2||(s.age==18&&!x.hs.length)){s.npcs.forEach(n=>{if(n.role=='father')n.n=XNM('m');if(n.role=='mother')n.n=XNM('f');if(n.role=='friend')n.n=XNM()})}x.nm=1}
 if(typeof x.pw!='number')x.pw=rnd()<.3?R(45,95):R(0,40);
 if(!x.sm)x.sm={f:0,p:0};if(!x.of)x.of={on:0,sub:0,svc:[0,0,0,0,0]};if(!x.ex)x.ex=[];if(!x.cn)x.cn=[];
 if(!x.re)x.re=[0,1,2,3].map(()=>({n:XNM(),f:R(80,125)/100,own:0}));if(!x.rv)x.rv=[0,1,2].map(i=>({n:'گروه '+['صنعتی آرمان','تجاری سپهر','سرمایه نوین'][i],v:R(100,400)}));
 if(s.age>=7&&s.age<18&&!x.sc)x.sc=XRos('s',0);
 const sm=x.sm;sm.f=Math.round(sm.f*.97);s.st.fame=cl(s.st.fame*.94+(sm.f>1000?Math.log10(sm.f)*1.2:0)+(x.hero?x.hero.rank*.5:0));
 if(s.age>=16)x.sk.model=cl(Math.max(x.sk.model||0,s.st.lk-35)+Math.min(3,Math.log10(sm.f+1)/2));
 if(x.of.on){x.of.sub=Math.round(x.of.sub*.9+(sm.f/80+s.st.fame*4)*(1+x.of.svc.filter(Boolean).length*.4));
  if(s.st.fame>55&&x.of.sub>300&&rnd()<.35){const k=R(0,3);if(k==0&&!s.home){s.home=1;nl('یکی از مخاطبانت خانه به تو هدیه داد!');H('هدیه خانه از مخاطبان')}else if(k==1&&!s.car){s.car=1;nl('مخاطبی خودرو هدیه داد!')}else{const v=R(10,60)*m;s.cash+=v;nl('مخاطبانت جواهرات و هدایای نقدی به ارزش '+fm(v)+' فرستادند.')}}}
 (x.re||[]).forEach(q=>{q.f=Math.max(.5,q.f*(1+R(-6,10)/100));if(!q.own&&rnd()<.3){const o=XNM();nl('در بازار ملک، '+q.n+' ملکش را به '+o+' فروخت.');q.n=o}});
 x.rv.forEach(r=>{r.v=Math.max(30,r.v*(1+R(-15,25)/100));if(rnd()<.1)nl(r.n+' رقیب خود را خرید و بزرگ‌تر شد.')});
 if(x.co)x.co.riv=x.rv.filter(r=>r.v>x.co.emp*12+30).length;
 if(x.fake&&rnd()<.03){x.rec++;x.jail=12;s.job=null;D('hp',-12);log('پلیس هویت جعلی‌ات را کشف کرد؛ جعل سند و کلاهبرداری ثابت شد.');H('هویت جعلی لو رفت.')}
 if(s.age>=18&&!x.heistDone&&x.rec>=2&&x.jail<=0&&s.cash>300*m){x.heistDone=1}
 if(x.hero&&rnd()<.2)nl('شرکت '+HC[x.hero.c][0]+' از تو برای عملیات بزرگ دعوت کرد.');
 if(s.age>=7&&x.sc&&s.age<18)D('h',0);
 if(x.sc)x.sc.cls.forEach(c=>{if(c.rel>=70)D('hp',1)});
 s.npcs.forEach(n=>{if(n.role=='partner')n.anger=cl(n.anger-3)});
 if(s.age>=8&&!has('friend')&&rnd()<.35){s.npcs=s.npcs.filter(n=>!(n.role=='friend'&&(n.cut||!n.alive)));if(s.npcs.length<8){const L=LANG;const nf=mk('friend',XNM(),Math.max(6,s.age+R(-2,2)),L==='fa'?'تازه‌آشنا':'New friend',L==='fa'?'می‌خواهد دوست خوبی برایت باشد':'Wants to be a good friend',L==='fa'?'متوسط':'middle',45,L==='fa'?'در مدرسه یا محله آشنا شدید.':'Met at school or in the neighborhood.');s.npcs.push(nf);nl(L==='fa'?'با '+nf.n+' دوست شدی.':'Became friends with '+nf.n)}}
 /* Gold price fluctuates yearly */
 if(typeof goldYearly==='function')goldYearly();
 /* Life goals check */
 if(typeof goalsCard==='function')goalsCard()}
/* ---- مدرسه و دانشگاه ---- */
function XRos(k,t){const u=k=='u',T=u?['استاد راهنما','استاد ریاضی','استاد تخصصی','رئیس دانشکده']:['معلم ریاضی','معلم ادبیات','معلم علوم','مدیر مدرسه','مشاور'];
 return{k,t,cls:[0,1,2,3,4,5].map(()=>({n:XNM(),rel:R(10,40)})),st:T.map(r=>({n:XNM(),r,rel:R(15,45)}))}}
function XPickSch(i){const x=XE();if(S.age<7||S.age>17||S.ev)return;if(i>({p:1,m:2,w:3}[S.f]))return msg('خانواده‌ات توان مالی این مدرسه را ندارد.');x.sc=XRos('s',i);D('iq',SCH[i][2]);msg('به '+SCH[i][0]+' منتقل شدی؛ همکلاسی‌ها و معلم‌های جدید داری.')}
function XPickUni(i){const x=XE();if(S.study||S.ev)return msg('در حین تحصیل نمی‌توانی دانشگاه را عوض کنی.');if(S.st.iq<UNI[i][2])return msg('هوش‌ات برای پذیرش در '+UNI[i][0]+' کافی نیست.');x.ut=i;msg(UNI[i][0]+' را برای تحصیل انتخاب کردی.')}
function XFund(m){XE().fund=m;msg({f:'شهریه را پدرت می‌پردازد (به وضع مالی او بستگی دارد).',s:'برای بورسیه تلاش می‌کنی (به هوش و خلاقیت بستگی دارد).',p:'خودت شهریه را می‌پردازی.'}[m])}
const xs0=startStudy;startStudy=function(i){const had=S.study;xs0(i);if(!had&&S.study){const x=XE();x.sc=XRos('u',x.ut||0);D('iq',UNI[x.ut||0][3]/2)}};
const xm0=term;term=function(){const c0=S.cash,x=XE();xm0();const sp=c0-S.cash;if(sp>0){const u=UNI[x.ut||0],f=x.fund||'p',fa0=g('father');S.cash-=sp*(u[1]-1);const t=sp*u[1];
 if(f=='f'&&fa0.alive){const r={'ضعیف':0,'متوسط':.5,'خوب':1}[fa0.fin]||0;S.cash+=t*r;NR(fa0,-r*0,0,2)}
 else if(f=='s'&&((S.st.iq+S.tr.cr)/2>=62||x.gpa>=80)){S.cash+=t;log('بورسیه دانشگاه شهریه‌ات را پوشش داد.')}}};
function XSc(k,i){const x=XE(),sc=x.sc;if(!sc||S.ev||S.st.en<10||!cap('sc',14))return;const c=sc.cls[i],t=sc.st[i];
 res(()=>{if(k=='talk'){c.rel=cl(c.rel+8);D('hp',3);return 'با '+c.n+' گپ زدی؛ رابطه‌تان بهتر شد.'}
  if(k=='study'){c.rel=cl(c.rel+6);D('iq',1);x.gpa=cl(x.gpa+1);return 'با '+c.n+' درس خواندی.'}
  if(k=='prank'){if(rnd()<.5){c.rel=cl(c.rel-15);sc.st.forEach(q=>q.rel=cl(q.rel-4));D('str',4);return 'شوخی‌ات بد درآمد و '+c.n+' و کادر مدرسه ناراحت شدند.'}c.rel=cl(c.rel+10);D('hp',4);return 'شوخی‌ات گرفت؛ همه خندیدند.'}
  if(k=='tch'){t.rel=cl(t.rel+10);x.gpa=cl(x.gpa+2);return 'با '+t.r+' ('+t.n+') صحبت کردی و او نگاه بهتری به تو پیدا کرد.'}
  if(k=='gift'){if(!can(1))return 'پولش را نداری.';cst(1);t.rel=cl(t.rel+6);return 'برای '+t.r+' هدیه بردی.'}},0)}
['🧪 امتحان سخت','🗣 سخنرانی روی صحنه','🚌 اردوی مدرسه','🥊 دعوا در حیاط','📚 مسابقه علمی','🍪 فروشگاه مدرسه'].forEach((t,i)=>xe('sch'+i,'🏫',4,[7,17],0,s=>s.x&&s.x.sc,t,'در مدرسه '+t+' پیش آمده است.',[['با جدیت شرکت می‌کنم',()=>{D('iq',1);D('str',4);XE().gpa=cl(XE().gpa+2);const c=XE().sc.cls[R(0,5)];c.rel=cl(c.rel+6);return 'تلاش کردی و '+c.n+' هم به تو نزدیک‌تر شد.'}],['بی‌خیال می‌شوم',()=>{D('hp',3);XE().gpa=cl(XE().gpa-2);return 'کمی خوش گذشت ولی نمره‌ات آسیب دید.'}]]));
['🎉 جشن دانشجویی','📝 پروژه گروهی','🧑‍🏫 اختلاف با استاد','💼 کارآموزی','📢 اعتراض دانشجویی'].forEach((t,i)=>xe('uni'+i,'🎓',4,[18,40],0,s=>s.study&&s.x&&s.x.sc&&s.x.sc.k=='u',t,'در دانشگاه '+t+' پیش آمده است.',[['درگیر می‌شوم',()=>{D('iq',1);D('str',5);const c=XE().sc.cls[R(0,5)];c.rel=cl(c.rel+8);return 'با '+c.n+' و بقیه ارتباط بهتری گرفتی.'}],['فاصله می‌گیرم',()=>{D('hp',2);XE().gpa=cl(XE().gpa-2);return 'کنار کشیدی.'}]]));
/* ---- شغل ---- */
function XOT(){const s=S,x=XE();if(!s.job||s.ev||s.st.en<20||!cap('ot',6))return;res(()=>{s.cash+=s.job.sal*.4;D('en',-25);D('str',8);x.ot=(x.ot||0)+1;return 'اضافه‌کاری کردی و '+fm(s.job.sal*.4)+' گرفتی.'},0)}
function XPromo(){const s=S,x=XE();if(!s.job||s.job.lvl>=3||s.ev||!cap('pr',2))return;res(()=>{if(rnd()<.12+s.tr.di/300+(x.ot||0)*.04+s.exp*.015){s.job.lvl++;s.job.yr=0;s.job.sal*=1.2;x.ot=0;H('ارتقا: '+jn(s.job));return 'مدیر درخواستت را پذیرفت: '+jn(s.job)+'، حقوق ۲۰٪ بیشتر.'}D('str',4);return 'این بار موفق نشدی؛ مدیر گفت باید بیشتر تلاش کنی.'},0)}
const xn0=npcAct;
/* ---- روابط ---- */
function XBC(){const p=g('partner'),x=XE();if(!has('partner')||S.age<18)return;if(p.trust+p.love+R(-20,20)>115){x.bc=1;NR(p,2,3);msg(p.n+' موافقت کرد و از روش پیشگیری استفاده می‌کند.')}else{NR(p,-4,-3,0,8);msg(p.n+' با این پیشنهاد مخالفت کرد و ناراحت شد.')}}
function XIntim(pr){const s=S,x=XE(),p=g('partner');if(s.age<18||!has('partner')||s.ev||!cap('in',6))return;
 if(p.love<45||p.anger>40)return msg(p.n+' امروز تمایلی ندارد.');if(!pr&&!x.bc&&p.trust<60)return msg(p.n+' بدون محافظت موافق نیست.');
 res(()=>{NR(p,6,3);D('hp',6);D('str',-5);let t='شب صمیمانه‌ای را با '+p.n+' گذراندی.';if(!pr&&rnd()<.03){D('h',-5);t+=' بعداً نگران سلامتی‌ات شدی؛ آزمایش بده.'}
  if(rnd()<(pr?.03:x.bc?.06:.28)&&!s.dt.preg){s.dt.preg=9;t+=' '+p.n+' باردار شد.'}return t},0)}
function XDateK(k){const p=g('partner'),d=DK[k];if(!has('partner')||S.ev||!can(d[1])||!cap('dk',10))return msg('پول یا سقف سالانه‌ات کافی نیست.');cst(d[1]);res(()=>{NR(p,5,3);for(const q in d[2])D(q,d[2][q]);return d[0]+' با '+p.n+' عالی بود.'},0)}
function XFD(){const f=g('friend');if(S.age<18||!has('friend')||has('partner')||!cap('fd',2))return;res(()=>{if(f.love>=60&&rnd()<.5){S.npcs=S.npcs.filter(n=>n.role!='partner');f.role='partner';f.love=cl(f.love+10);return f.n+' پیشنهادت را قبول کرد؛ حالا در رابطه هستید.'}NR(f,-8,-3);return f.n+' فقط دوست ماندن را ترجیح داد.'},0)}
function XFake(){const L=LANG;if(S.age<18||S.ev||!confirm(L==='fa'?'جعل مرگ و تغییر هویت؟ شغل، مدرک و روابط فعلی رها می‌شوند.':'Fake death and change identity? Your job, degree, and relationships will be lost.'))return;const x=XE();if(!can(100))return msg((L==='fa'?'هزینه جعل هویت ':'Identity change costs ')+fm(100*S.m)+'.');pay(100);S.npcs.forEach(n=>x.ex.push({n:n.n,role:n.role,love:n.love,age:n.age}));x.ex=x.ex.slice(-10);
 /* Prompt for new name */
 const newName=prompt(L==='fa'?'نام جدید خود را وارد کنید:':'Enter your new name:','');
 if(newName&&newName.trim())S.name=newName.trim().slice(0,24);else S.name=XNM(S.g=='Female'?'f':'m')+' '+XNM();
 S.npcs=[mk('friend',XNM(),S.age,L==='fa'?'تازه‌آشنا':'New acquaintance',L==='fa'?'می‌خواهد با تو دوست شود':'Wants to be your friend',L==='fa'?'متوسط':'middle',40,L==='fa'?'بعد از تغییر هویت آشنا شدید.':'Met after your identity change.')];H(L==='fa'?'مرگ خود را جعل کردی.':'You faked your death.');S.job=null;S.edu=0;S.study=null;S.married=0;S.kids=0;x.kids=[];x.fake=1;S.st.fame=0;x.sm.f=0;D('str',12);msg(L==='fa'?'دنیا فکر می‌کند مرده‌ای. رابطه‌های قبلی در «روابط سابق» ثبت شد.':'The world thinks you are dead. Previous relationships are saved in "Past relationships".')}
function XEx(i){const x=XE(),e=x.ex[i];if(!e||S.npcs.length>=8||S.ev)return;if(S.npcs.some(n=>n.role==e.role&&!n.cut))return msg('جایگاه '+RL[e.role]+' فعلاً پر است.');x.ex.splice(i,1);S.npcs.push(mk(e.role,e.n,e.age,'آشنای قدیمی','دلش برای روزهای قدیم تنگ شده','متوسط',40,'با هویت تازه‌ات دوباره آشنا شدید؛ از اول شروع کردید.'));msg('رابطه‌ات را با '+e.n+' از اول ساختی.')}
/* ---- ظاهر، سلامت، عمل زیبایی، جنسیت ---- */
function XAct(k){const a=XA[k];if(S.age<a[2]||S.ev||!can(a[1])||!cap('a'+k,6))return;cst(a[1]);res(()=>{for(const q in a[3])D(q,a[3][q]);return a[0].replace(' ⚠️','')+' انجام شد.'+(a[0].includes('⚠️')?' اثر مثبت دارد ولی بدنت هزینه‌اش را می‌دهد.':'')},0)}
function XSurg(k){const a=XS[k];if(S.age<a[4]||S.ev||!cap('sg',2))return;const c=a[1]*XF2();if(!can(c))return msg('هزینه '+fm(c*S.m)+' است.');cst(c);res(()=>{for(const q in a[2])D(q,a[2][q]);if(rnd()<a[3]){med(15);D('h',-10);return 'عمل انجام شد ولی عارضه پیش آمد؛ هزینه درمان اضافه پرداختی.'}return a[0]+' با موفقیت انجام شد.'},0)}
function XGender(){const L=LANG;if(S.age<18||S.ev||!confirm(L==='fa'?'جراحی تغییر جنسیت؟ این تصمیم بزرگی است و روی روابطت اثر می‌گذارد.':'Gender reassignment surgery? This is a big decision and affects your relationships.'))return;const c=150*XF2();if(!can(c))return msg((L==='fa'?'هزینه ':'Cost: ')+fm(c*S.m)+'.');cst(c);S.g=S.g=='Male'?'Female':'Male';D('hp',12);D('str',6);S.npcs.forEach(n=>{if(n.alive&&!n.cut){const d=R(-22,8);NR(n,d,d/2,d)}});H(L==='fa'?'جراحی تغییر جنسیت انجام دادی.':'Gender reassignment surgery completed.');
 /* Prompt for new name */
 const newName=prompt(L==='fa'?'نام جدید خود را وارد کنید (یا Cancel برای نگه‌داشتن نام قبلی):':'Enter your new name (or Cancel to keep your old name):','');
 if(newName&&newName.trim()){S.name=newName.trim().slice(0,24);H(L==='fa'?'نامت را تغییر دادی.':'You changed your name.')}
 msg(L==='fa'?'جراحی انجام شد و هویتی که احساس می‌کردی را زندگی می‌کنی؛ واکنش اطرافیان متفاوت بود.':'Surgery complete; you now live the identity you feel inside. Reactions from others varied.')}
function XModel(){const s=S,x=XE();if(s.age<16||s.age>40||s.ev||!cap('md',2))return;res(()=>{if(rnd()<s.st.lk/130+Math.log10(x.sm.f+1)/20){x.sk.model=cl(x.sk.model+8);s.st.fame=cl(s.st.fame+4);s.cash+=10*s.m;return 'در آزمون مدلینگ پذیرفته شدی و اولین قرارداد را بستی.'}D('str',4);return 'آژانس ردت کرد؛ شبکه‌های اجتماعی می‌تواند شانس بعدی‌ات را بهتر کند.'},0)}
/* ---- شبکه اجتماعی و آنلی‌فنز ---- */
function XPost(k){const s=S,x=XE(),sm=x.sm;if(s.age<16||s.ev||!cap('pt',24))return;res(()=>{const lk=1+s.st.lk/80;
 if(k==0){const v=Math.round(R(20,150)*lk);sm.f+=v;return 'پست جدید: '+fa(v)+' دنبال‌کننده تازه.'}
 if(k==1){if(rnd()<.2){const v=Math.round(R(800,6000)*lk);sm.f+=v;s.st.fame=cl(s.st.fame+2);return 'ویدیویت وایرال شد! '+fa(v)+' دنبال‌کننده.'}sm.f+=30;return 'ویدیو دیده نشد.'}
 if(k==2){if(sm.f<1000)return 'برای تبلیغ حداقل ۱۰۰۰ دنبال‌کننده لازم است.';const v=sm.f/1000*2*s.m;s.cash+=v;return 'قرارداد تبلیغاتی: '+fm(v)}
 const v=R(200,3000);sm.f+=v;s.st.fame=cl(s.st.fame+3);D('str',8);NR(g('mother'),-4,-3);return 'جنجال‌سازی دنبال‌کننده‌ها را بالا برد ('+fa(v)+') ولی استرس و حاشیه آورد.'},0)}
function XOF(k){const s=S,x=XE(),o=x.of;if(s.age<18||s.ev)return;
 if(k=='on'){if(o.on)return;o.on=1;s.npcs.forEach(n=>{if(n.alive&&!n.cut){const d=Math.round(R(-25,8)*(n.role=='partner'?1.3:1)*(/سنتی|مذهبی|سخت/.test(n.pers)?1.4:1));NR(n,d,d/2,d,d<0?-d/2:0);mem(n,'از فعالیتت در آنلی‌فنز خبردار شد.')}});H('در آنلی‌فنز فعالیت را شروع کردی.');return msg('حساب بزرگسالان ساختی؛ خانواده، دوستان و شریکت بسته به شخصیتشان واکنش نشان دادند.')}
 if(k=='promo'){if(!cap('of',12))return;return res(()=>{const v=Math.round((x.sm.f/50+s.st.fame*3+20)*(1+o.svc.filter(Boolean).length*.3));o.sub+=v;D('en',-10);return 'تبلیغ کردی و '+fa(v)+' مشترک تازه آمد.'},0)}
 const i=+k;o.svc[i]=o.svc[i]?0:1;msg('سرویس تغییر کرد.')}
const xp0=PH;PH=function(){const s=S,x=XE(),b='<button onclick="S.app=\'\';rend()">← گوشی</button>',sm=x.sm||{f:0},o=x.of||{on:0,sub:0,svc:[0,0,0,0,0]};
 if(s.app=='sm')return`<div class="c">${b}<h3>📸 شبکه‌های اجتماعی</h3><p>دنبال‌کننده: ${fa(Math.round(sm.f))} · شهرت: ${fa(s.st.fame)}</p><div class="row">${[['پست روزمره',0],['ویدیو',1],['تبلیغ برند',2],['جنجال',3]].map(([t,i])=>XB(`XPost(${i})`,t)).join('')}</div></div>`;
 if(s.app=='of')return`<div class="c">${b}<h3>💎 پلتفرم اشتراکی (۱۸+)</h3>`+(o.on?`<p>مشترکین: ${fa(o.sub)} · درآمد ماهانه تقریبی: ${fm(o.sub*.012*s.m)}</p><div class="row">${['📸 عکس','🎥 ویدیو','💬 چت','📡 لایو','🎁 سفارشی'].map((t,i)=>XB(`XOF(${i})`,(o.svc[i]?'✅ ':'')+t)).join('')}${XB("XOF('promo')",'تبلیغ و جذب مخاطب','p')}</div>`:`<p class="mu">با شروع فعالیت، مخاطبانی جذب می‌کنی و ممکن است هدیه بگیری؛ ولی خانواده و اطرافیان واکنش نشان می‌دهند.</p>${XB("XOF('on')",'شروع فعالیت','p')}`)+'</div>';
 const ap=(s.age>=16?`<button onclick="S.app='sm';rend()">📸 شبکه اجتماعی</button>`:'')+(s.age>=18?`<button onclick="S.app='of';rend()">💎 پلتفرم اشتراکی</button>`:'');return xp0()+(ap?`<div class="c"><h3>اپلیکیشن‌های بیشتر</h3><div class="row">${ap}</div></div>`:'')};
/* ---- ابرقهرمان ---- */
function XHApply(i){const s=S,x=XE();if(s.age<5||x.hero||s.ev||!cap('ha',2))return;
 res(()=>{if(x.pw>=50&&rnd()<.4+x.pw/250){x.hero={c:i,rank:1,xp:0,rel:HC[i][2].map(()=>R(25,45))};H('به '+HC[i][0]+' پیوستی؛ ابرقهرمان شدی.');return 'استعدادت تأیید شد و به '+HC[i][0]+' پیوستی؛ حقوق ماهانه‌ات ('+fm(heroSal())+') از همین حالا به درآمدت اضافه شد.'}return 'استعدادت برای '+HC[i][0]+' کافی نبود.'},0)}
/* ---- بازار ملک ---- */
function XBuyRE(i){const x=XE(),q=x.re[i],p=housePrice()*q.f;if(S.age<18||q.own||S.ev)return;if(S.cash<p)return msg('قیمت این ملک '+fm(p)+' است.');S.cash-=p;q.own=1;msg('ملک را از '+q.n+' خریدی؛ اجاره‌اش درآمد ماهانه دارد.')}
function XSellRE(i){const x=XE(),q=x.re[i],p=housePrice()*q.f*.95;if(!q.own)return;S.cash+=p;q.own=0;q.n=XNM();msg('ملک را به '+q.n+' فروختی: '+fm(p))}
/* ---- دستاوردهای مخفی ---- */
[['h_b','💰','میلیاردر مخفی',()=>net()>=5000*S.m],['h_f','🕵️','مرده‌ی زنده',()=>S.x&&S.x.fake],['h_h','🦸','ستاره‌ی ابرقهرمان‌ها',()=>S.x&&S.x.hero&&S.x.hero.rank>=4],['h_m','📸','چهره‌ی برتر',()=>S.x&&S.x.sk.model>=85],['h_s','📱','ستاره‌ی میلیونی',()=>S.x&&S.x.sm&&S.x.sm.f>=1000000],['h_r','🏘','سلطان املاک',()=>S.x&&S.x.re&&S.x.re.filter(q=>q.own).length>=3],['h_w','⚔️','شاهد سقوط کشورها',()=>S.x&&S.x.cn&&S.x.cn.length>=3]].forEach(a=>{ACH.push(a);a.h=1});
/* ---- رابط: تب‌ها ---- */
const xz0=tZ;tZ=function(){const s=S,x=XE(),ad=s.age>=18,p=g('partner');let h=xz0();h+=XHeroCard();
 if(s.job)h+=`<div class="c"><h3>💼 اضافه‌کاری و ارتقا</h3><div class="row">${XB('XOT()','اضافه‌کاری')}${XB('XPromo()','درخواست ارتقا','p')}</div></div>`;
 h+=`<div class="c"><h3>✨ ظاهر و سلامت</h3><div class="row">${Object.keys(XA).filter(k=>s.age>=XA[k][2]).map(k=>XB(`XAct('${k}')`,XA[k][0])).join('')}</div>${ad?`<h3>🔪 عمل‌های زیبایی (هزینه بر اساس کشور)</h3><div class="row">${Object.keys(XS).filter(k=>s.age>=XS[k][4]).map(k=>XB(`XSurg('${k}')`,XS[k][0]+' · '+fm(XS[k][1]*XF2()*s.m))).join('')}${XB('XGender()','⚧ جراحی تغییر جنسیت')}</div>`:''}</div>`;
 if(s.age>=16&&s.age<=40)h+=`<div class="c"><h3>📸 مسیر مدلینگ</h3><p class="mu">مهارت مدلینگ: ${fa(Math.round(x.sk.model||0))} · شبکه‌های اجتماعی به‌صورت غیرمستقیم کمک می‌کنند.</p>${XB('XModel()','آزمون آژانس مدلینگ')}</div>`;
 if(ad&&has('partner'))h+=`<div class="c"><h3>💞 رابطه با ${esc(p.n)}</h3><p class="mu">پیشگیری از بارداری شریک: ${x.bc?'فعال':'غیرفعال'}</p><div class="row">${XB('XBC()','درخواست پیشگیری')}${XB('XIntim(1)','رابطه جنسی محافظت‌شده')}${XB('XIntim(0)','رابطه جنسی بدون محافظت','d')}</div><div class="row">${Object.keys(DK).map(k=>XB(`XDateK('${k}')`,DK[k][0])).join('')}</div></div>`;
 else if(ad&&has('friend'))h+=`<div class="c"><h3>💘 ${esc(g('friend').n)}</h3>${XB('XFD()','پیشنهاد رابطه به دوست')}</div>`;
 if(ad)h+=`<div class="c"><h3>🕵️ هویت</h3>${XB('XFake()','جعل مرگ و تغییر هویت','d')}${x.ex.length?`<h3>روابط سابق</h3>${x.ex.map((e,i)=>`<div class="row"><span>${esc(e.n)} (${RL[e.role]})</span>${XB(`XEx(${i})`,'ساخت رابطه از اول')}</div>`).join('')}`:''}</div>`;return h};
function tU(){const s=S,x=XE(),sc=x.sc;
 let h=`<div class="c"><h3>🏫 ${tx('school_tab').replace('🏫 ','')}</h3>`;
 /* School section (ages 7-17) */
 if(s.age>=7&&s.age<18){h+=`<p class="mu">${tx('school_age_desc')}</p><div class="row">${SCH.map((q,i)=>XB(`XPickSch(${i})`,q[0]+(sc&&sc.k=='s'&&sc.t==i?' ✅':''))).join('')}</div>`}
 else if(s.age<7){h+=`<p class="mu">${LANG==='fa'?'مدرسه از ۷ سالگی شروع می‌شود.':'School starts at age 7.'}</p>`}
 else{h+=`<p class="mu">${LANG==='fa'?'مدرسه را تمام کرده‌ای. حالا می‌توانی برای دانشگاه اقدام کنی.':'You have finished school. You can now apply to university.'}</p>`}
 h+='</div>';
 /* University Applications (locked until 18 + school end) */
 h+=XAdCard();
 /* Current studies (moved from Work & study tab) */
 if(s.age>=18){
  h+='<div class="c"><h3>🎓 '+(LANG==='fa'?'تحصیل':'Studies')+'</h3>';
  if(s.study){const p=PR[s.study.i];h+=`<p>${LANG==='fa'?'در حال تحصیل':'Studying'}: ${p[0]} — ${LANG==='fa'?'ترم':'term'} ${fa(s.study.done)} ${LANG==='fa'?'از':'of'} ${fa(p[2])}</p><div class="row"><button class="p" onclick="term()">${LANG==='fa'?'گذراندن یک ترم':'Pass a term'} (${fm(8*s.m)})</button><button class="d" onclick="dropStudy()">${LANG==='fa'?'ترک تحصیل':'Drop out'}</button></div>`}
  else if(!x.adm){const o=PR.map((p,i)=>s.edu<p[1]&&(i!=1||s.edu==1)&&(i!=2||s.edu<3)?`<button onclick="startStudy(${i})">${LANG==='fa'?'ثبت‌نام':'Enroll'} ${p[0]} (${fa(p[2])} ${LANG==='fa'?'ترم':'terms'})</button>`:'').join('');h+=o||`<p class="mu">${LANG==='fa'?'همه مسیرهای دانشگاهی را طی کرده‌ای.':'You have completed all available university paths.'}</p>`}
  else{h+=`<p class="mu">${LANG==='fa'?'قبولی دانشگاهت آماده است. از دکمه ثبت‌نام شروع کن.':'Your admission is ready. Click enroll to start.'}</p>`}
  h+='</div>'}
 /* Classmates / Staff interactions */
 if(sc){h+=`<div class="c"><h3>${sc.k=='u'?(LANG==='fa'?'هم‌دانشگاهی‌ها':'Classmates'):(LANG==='fa'?'همکلاسی‌ها':'Classmates')}</h3><p class="mu">${tx('classmates_desc')}</p>${sc.cls.map((c,i)=>`<div class="row"><span>${esc(c.n)} · ${LANG==='fa'?'رابطه':'rel'} ${fa(c.rel)}${c.rel>=70?' ('+tx('close_friend')+')':''}</span>${XB(`XSc('talk',${i})`,tx('chat'))}${XB(`XSc('study',${i})`,tx('study_together'))}${XB(`XSc('prank',${i})`,tx('prank'))}</div>`).join('')}</div><div class="c"><h3>${tx('staff')}</h3>${sc.st.map((t,i)=>`<div class="row"><span>${t.r}: ${esc(t.n)} · ${LANG==='fa'?'رابطه':'rel'} ${fa(t.rel)}</span>${XB(`XSc('tch',${i})`,tx('talk'))}${XB(`XSc('gift',${i})`,tx('gift'))}</div>`).join('')}</div>`}
 return h}
function tV(){const s=S,x=XE();let t='';
 t+=`<div class="c"><h3>🏘 ${LANG==='fa'?'بازار املاک':'Property Market'}</h3>${x.re.map((q,i)=>`<div class="row"><span>${LANG==='fa'?'مالک: ':'Owner: '}${q.own?(LANG==='fa'?'تو':'you'):esc(q.n)} · ${fm(housePrice()*q.f)}</span>${q.own?XB(`XSellRE(${i})`,tx('sell_house')):s.age>=18?XB(`XBuyRE(${i})`,tx('buy_house')):''}</div>`).join('')}</div><div class="c"><h3>🏭 ${LANG==='fa'?'رقبای اقتصادی':'Economic Rivals'}</h3>${x.rv.map(r=>`<div>${r.n}: ${LANG==='fa'?'ارزش ':'value '}${fm(r.v*s.m)}</div>`).join('')}</div>`;return t}

/* (legacy tab splice removed) */
/* ===================== v4: سهمیه‌های سالانه، تعادل رویدادها، پول تو جیبی، ابرقهرمان ===================== */
/* ---- پول تو جیبی (۶ تا ۱۷ سالگی، وابسته به وضع خانواده) ---- */
function PKM(){const s=S;if(!s||s.age<6||s.age>=18)return 0;const par=['father','mother'].filter(r=>has(r)).length;if(!par)return 0;
 const base={p:.3,m:1.2,w:4}[s.f]||1;return base*(1+(s.age-6)*.1)*(par==2?1:.6)*s.m}

/* ---- فعالیت‌ها: سهمیه سالانه ---- */
/* Activity quotas scaled by difficulty: harder = fewer activities
   Computed lazily to avoid TDZ issues with DIF defined later */
const ACAP_BASE={play:5,study:8,gym:6,friends:6,hobby:6,rest:4,side:4};
function getACAP(k){const dac=(typeof DIF!=='undefined'&&DIF[S&&S.dif])?DIF[S.dif].ac:1;return Math.max(1,Math.round(ACAP_BASE[k]*dac))}
const aUsed=k=>((XE().cap||{})['A_'+k])||0,aLeft=k=>Math.max(0,getACAP(k)-aUsed(k));
act=function(k){const a=A[k],L=LANG;if(!a||S.ev||S.dead)return;
 if(aLeft(k)<=0)return msg((L==='fa'?'سهمیه امسالِ «':'This year\'s quota for «')+a[0].replace(/ \([^)]*\)/,'')+(L==='fa'?'» تمام شد.':'» is used up.'));
 if(S.st.en<15&&k!='rest')return msg(L==='fa'?'انرژی‌ات کم است؛ اول استراحت کن.':'Your energy is low; rest first.');
 const c=XE().cap=XE().cap||{};c['A_'+k]=aUsed(k)+1;log(a[2]());commit()};

/* ---- درخواست پول: برای هر نفر سالی ۳ بار ---- */
const askUsed=n=>((XE().cap||{})['ask_'+n.role+'_'+n.n])||0,askLeft=n=>Math.max(0,3-askUsed(n));
npcAct=function(r,k){const n=g(r);
 if(k=='money'&&n.alive&&!S.ev){
  if(askLeft(n)<=0)return msg(n.n+' می‌گوید امسال بیش از سه بار نمی‌تواند به تو پول بدهد؛ سال بعد دوباره بپرس.');
  const c=XE().cap=XE().cap||{};c['ask_'+r+'_'+n.n]=askUsed(n)+1}
 xn0(r,k)};

/* ---- تعادل رویدادها: فاصله بین تکرارها و شرایط خانوادگی ---- */
const EVR={cold:{cd:3},pfight:{cd:3,mx:3},lend:{cd:3},pfight2:{cd:3},night:{cd:4},crash:{cd:3},inherit:{cd:6,mx:2},bully:{cd:3},rent:{cd:3},offer:{cd:4},promo:{cd:3},stock:{cd:3},layoff:{cd:5},carfix:{cd:3},mom:{cd:2},elder:{cd:3},illness:{cd:3},shark:{cd:2},intervene:{cd:3},raid:{cd:4},decree:{cd:3},festival:{cd:3},draft:{cd:3}};
function evOK(e){const x=XE(),s=S;if((x.evy||0)>=3)return false;
 if(e.once)return true;
 const r=EVR[e.id]||{},cd=r.cd||2,l=x.evl&&x.evl[e.id];
 if(l!==undefined&&s.age-l<cd)return false;
 if(r.mx&&((x.evc&&x.evc[e.id])||0)>=r.mx)return false;
 if(e.id=='pfight'&&s.fl.pdiv)return false;
 if(e.id=='lend'){const f=g('friend');if(f.fin=='خوب'||f.love<35)return false}
 return true}
function evW(e){const s=S,t=s.st;
 if(e.id=='cold')return Math.max(.3,(100-t.h)/45+(t.str>60?.6:0)+(s.age<6||s.age>65?.6:0));
 if(e.id=='pfight')return{p:1.8,m:1,w:.5}[s.f]||1;
 if(e.id=='lend')return g('friend').fin=='ضعیف'?2.5:.6;
 return 1}
function evMark(e){const x=XE();x.evl=x.evl||{};x.evc=x.evc||{};x.evl[e.id]=S.age;x.evc[e.id]=(x.evc[e.id]||0)+1;x.evy=(x.evy||0)+1;
 if(e.id=='div')S.fl.pdiv=1;
 if(e.id=='lend'){const f=g('friend');if(f.alive)f.fin='متوسط'}}

/* ---- ابرقهرمان: حقوق، رتبه، رابطه با تیم، ماموریت‌ها ---- */
const HRT=['','تازه‌وارد','عضو رسمی','قهرمان باتجربه','سرپرست تیم','فرمانده'],HSAL=[0,70,95,125,160,200];
const hh=()=>XE().hero;
const HK=()=>{const h=hh(),k=h?HC[h.c][1]:'';return k=='شرور'?'e':k=='خوب'?'g':k=='تابع پادشاه'?'k':'m'};
const HMi=()=>{const h=hh();return h&&h.cur&&h.cur.i!=null?h.cur.i:0};
const HMn=()=>{const h=hh();if(!h)return 'همتیمی';const a=HC[h.c][2];return(a[HMi()]||a[0]).split(' (')[0]};
function XHFix(h){if(!h)return;const n=HC[h.c][2].length;if(!Array.isArray(h.rel)||h.rel.length!=n)h.rel=HC[h.c][2].map(()=>R(25,45));
 h.rank=Math.min(5,Math.max(1,h.rank||1));h.xp=Math.min(12,Math.max(0,h.xp||0))}
function XHRank(){const h=hh();if(!h)return;h.xp=Math.min(12,Math.max(0,h.xp));const nr=Math.min(5,1+Math.floor(h.xp/3));
 if(nr>h.rank){h.rank=nr;const t='ارتقا گرفتی: '+HRT[nr]+' در '+HC[h.c][0];log(t);H(t);D('hp',6);S.st.fame=cl(S.st.fame+3)}}
const HX=v=>{const h=hh();if(!h)return;h.xp=(h.xp||0)+v;XHRank()};
const HR=(i,v)=>{const h=hh();if(h)h.rel[i]=cl(h.rel[i]+v)},HRA=v=>{const h=hh();if(h)h.rel=h.rel.map(r=>cl(r+v))};
const HAV=()=>{const h=hh();return h&&h.rel&&h.rel.length?Math.round(h.rel.reduce((a,b)=>a+b,0)/h.rel.length):0};
function XHDemote(){const h=hh();if(!h)return;h.rank=Math.max(1,h.rank-1);h.xp=Math.min(h.xp,3*(h.rank-1)+1)}
const hwin=b=>rnd()<Math.min(.92,Math.max(.08,b+(XE().pw-50)/250+hh().rank*.03+(S.st.h-50)/400));
const Rw=u=>u*S.m*(1+hh().rank*.4);
const HQ=()=>has('partner')?g('partner'):has('friend')?g('friend'):g('mother');
function heroSal(){const h=S.x&&S.x.hero;if(!h||!HC[h.c])return 0;const k=HC[h.c][1],f=k=='شرور'?1.25:k.startsWith('قهرمان‌نما')?1.3:k=='تابع پادشاه'?.9:1;
 return HSAL[Math.min(5,Math.max(1,h.rank||1))]*f*S.m*(S.age<18?.2:1)}
function XTeam(i){const x=XE(),h=x.hero;if(!h||S.ev)return;XHFix(h);if(S.st.en<15)return msg('انرژی کافی نداری.');
 const c=x.cap=x.cap||{},k='tm'+i;if((c[k]||0)>=2)return msg('امسال بیش از دو بار با '+HMnAt(i)+' تمرین نکرده‌ای؛ سال بعد دوباره.');
 c[k]=(c[k]||0)+1;
 res(()=>{HR(i,R(5,9));HX(.5);D('hp',4);D('en',-10);return 'با '+HMnAt(i)+' تمرین کردی؛ رابطه‌ات با او بهتر شد.'},0)}
const HMnAt=i=>{const h=hh();return h?HC[h.c][2][i].split(' (')[0]:''};

const MS=[];
const xm=(id,e,k,t,x,o,c)=>{MS.push({id,k,c});EV.push({id,e,w:0,c:()=>0,t,x,o,ms:1})};
function XMission(){const s=S,x=XE(),h=x.hero;if(!h||s.ev)return;XHFix(h);
 if(s.age<12)return msg('ماموریت میدانی از ۱۲ سالگی ممکن است؛ فعلاً با تیم تمرین کن.');
 if(x.jail>0)return msg('در زندان نمی‌توانی ماموریت بروی.');
 if(s.st.en<20)return msg('برای ماموریت انرژی کافی نداری؛ استراحت کن.');
 if(!cap('ms',3))return;
 const k=HK(),el=MS.filter(m=>m.k.includes(k)&&m.id!=h.last&&(!m.c||m.c())),ex=el.find(m=>m.id=='ms_exam'),pl=el.filter(m=>m.id!='ms_exam');
 const m=(ex&&rnd()<.5)?ex:pick(pl);
 h.cur={id:m.id,i:R(0,HC[h.c][2].length-1)};h.last=m.id;D('en',-10);s.ev={id:m.id,res:null,d:[]};commit()}
const xpk=pickO;
pickO=function(i){const v=S.ev&&evOf(S.ev.id),h=hh();if(!(v&&v.ms&&h&&!S.ev.res))return xpk(i);
 const a={x:h.xp,r:h.rank,m:HAV()};xpk(i);
 if(S.ev&&S.ev.res){const h2=hh();let t='';
  if(!h2)t=' · از سازمان بیرون انداخته شدی';
  else{const dm=HAV()-a.m,dx=Math.round((h2.xp-a.x)*10)/10;
   if(dm)t+=' · رابطه با تیم '+(dm>0?'+':'−')+fa(Math.abs(dm));
   if(dx)t+=' · ارتقا '+(dx>0?'+':'−')+fa(Math.abs(dx)).replace('.','٫');
   if(h2.rank>a.r)t+=' · رتبه جدید: '+HRT[h2.rank]}
  S.ev.res+=t;commit()}};

xm('ms_fire','🔥','gemk','آتش‌سوزی برج',()=>HMn()+' از بی‌سیم خبر می‌دهد: برجی در مرکز شهر آتش گرفته و ده‌ها نفر داخلش گیر افتاده‌اند. باید همین حالا تصمیم بگیری.',[
 ['وارد ساختمان می‌شوم',()=>{D('en',-15);if(hwin(.5)){S.cash+=Rw(40);S.st.fame=cl(S.st.fame+6);D('hp',6);D('str',6);HX(1.5);HRA(5);H('نجات جان مردم از آتش‌سوزی برج');return 'از میان دود چند نفر را بیرون آوردی و نامت سر زبان‌ها افتاد.'}
  D('h',-18);D('str',10);HRA(-4);return 'آتش تو را هم محاصره کرد؛ سوخته و زخمی بیرون آمدی و تیم ریسک بیهوده‌ات را سرزنش کرد.'}],
 ['از بیرون هماهنگ می‌کنم',()=>{D('en',-8);if(hwin(.75)){S.cash+=Rw(15);S.st.fame=cl(S.st.fame+2);HX(.8);HR(HMi(),8);HRA(2);return 'با هماهنگی '+HMn()+' همه یکی‌یکی بیرون آمدند؛ کند بود، اما بی‌تلفات.'}
  D('hp',-6);D('str',6);HRA(-2);return 'هماهنگی دیر جواب داد و چند نفر آسیب دیدند.'}],
 ['منتظر آتش‌نشانی می‌مانم',()=>{S.st.fame=cl(S.st.fame-3);D('hp',-8);D('str',6);HRA(-6);HR(HMi(),-6);return 'کنار کشیدی. دیر رسیدن نیروها فاجعه ساخت و همتیمی‌هایت این را فراموش نمی‌کنند.'}]]);

xm('ms_chase','🏃','gemk','تعقیب در شب',()=>HK()=='e'?'محموله‌ی ارزشمندی در دست سازمان رقیب است و ماشین‌های محافظ همین حالا از شهر خارج می‌شوند.':'ابرشروری فراری با یک گروگان سوار موتور از شهر بیرون می‌زند و فرصت چندانی نداری.',[
 ['تعقیب مستقیم',()=>{D('en',-15);if(hwin(.55)){S.cash+=Rw(30);S.st.fame=cl(S.st.fame+4);HX(1.2);HRA(3);return 'به او رسیدی و کار را تمام کردی؛ تیم تحسینت کرد.'}D('h',-12);D('hp',-4);return 'او فرار کرد و تو با زانوی آسیب‌دیده ماندی.'}],
 ['کمین می‌گذارم',()=>{if(rnd()<.45+S.tr.di/250){S.cash+=Rw(25);HX(1.5);HR(HMi(),5);return 'نقشه‌ات دقیق کار کرد؛ بدون درگیری غافلگیرش کردی.'}D('str',5);return 'نقشه لو رفت و ساعت‌ها بی‌نتیجه ماندی.'}],
 ['از همتیمی کمک می‌خواهم',()=>{const h=hh();if(h.rel[HMi()]<30){HR(HMi(),-3);D('hp',-3);return HMn()+' نخواست کمکت کند؛ هنوز به تو اعتماد ندارد.'}
  HR(HMi(),10);HX(.7);S.cash+=Rw(15);return 'با '+HMn()+' کار را تمام کردید و افتخارش را نصف کردید.'}]]);

xm('ms_hostage','🏦','gmk','گروگان‌گیری در بانک',()=>'مسلحان بانک را بسته‌اند و چند نفر را گروگان گرفته‌اند. پلیس منتظر تصمیم توست.',[
 ['مذاکره می‌کنم',()=>{if(rnd()<.35+S.tr.cf/250+S.st.iq/400){S.cash+=Rw(30);S.st.fame=cl(S.st.fame+5);HX(1.5);HRA(3);H('گروگان‌ها را با مذاکره آزاد کردی');return 'با صبر و حرف‌زدن همه گروگان‌ها سالم آزاد شدند.'}D('str',12);return 'مذاکره شکست خورد و ساعت‌ها زیر فشار روانی ماندی.'}],
 ['حمله سریع',()=>{if(hwin(.5)){S.cash+=Rw(50);S.st.fame=cl(S.st.fame+7);HX(2);D('str',5);return 'چند ثانیه‌ای کار تمام شد؛ شهر از تو حرف می‌زند.'}S.st.fame=cl(S.st.fame-4);D('hp',-10);D('h',-10);HRA(-6);return 'یکی از گروگان‌ها زخمی شد؛ شهرتت لکه‌دار و تیم ناراضی است.'}],
 ['کار را به پلیس می‌سپارم',()=>{HX(.2);S.st.fame=cl(S.st.fame-1);HRA(-2);return 'پلیس مسئله را حل کرد؛ تو فقط تماشا کردی.'}]]);

xm('ms_secret','🗂','gemk','پرونده‌ی ممنوعه',()=>'در بایگانی سازمان به سندی برمی‌خوری که نشان می‌دهد مدیران بخشی از عملیات‌ها را برای سود خودشان ساخته‌اند.',[
 ['افشا می‌کنم ⚠️',()=>{if(rnd()<.45+S.tr.cf/300+S.st.iq/500){S.st.fame=cl(S.st.fame+10);HRA(-20);HX(-2);D('str',10);H('رازی از سازمان را افشا کردی');return 'مردم تو را تحسین کردند، اما سازمان و بیشتر همتیمی‌هایت از تو دلخورند.'}
  const nm=HC[hh().c][0];XE().hero=null;H('از '+nm+' اخراج شدی');D('hp',-12);S.st.fame=cl(S.st.fame-3);return 'سند جعلی از آب درآمد، تو را به خیانت متهم کردند و از سازمان اخراج شدی.'}],
 ['سکوت می‌کنم و سند را به رئیس می‌دهم',()=>{HX(1.5);S.cash+=Rw(40);D('hp',-3);return 'رئیس قدردانی کرد و پاداش داد؛ اما وجدانت ناراحت است.'}],
 ['به همتیمی مورد اعتمادم می‌گویم',()=>{const h=hh();if(h.rel[HMi()]>=50){HR(HMi(),10);HX(.5);return 'تو و '+HMn()+' تصمیم گرفتید سند را امن نگه دارید؛ این راز شما را به هم نزدیک‌تر کرد.'}
  HR(HMi(),-15);HX(-1);D('str',8);return HMn()+' ماجرا را به بالادستی‌ها گفت و تو را زیر ذره‌بین گذاشتند.'}]]);

xm('ms_pr','📺','gemk','قرارداد تبلیغاتی',()=>'یک برند بزرگ می‌خواهد چهره‌ی تبلیغاتی‌اش باشی. سازمان نظر دوگانه‌ای دارد.',[
 ['قبول می‌کنم',()=>{S.cash+=Rw(60);S.st.fame=cl(S.st.fame+6);const sm=XE().sm;if(sm)sm.f+=R(300,3000);HRA(-5);return 'پول خوبی گرفتی و دنبال‌کننده‌هایت زیاد شد؛ اما بعضی‌ها گفتند نام سازمان را فروخته‌ای.'}],
 ['رد می‌کنم',()=>{HRA(3);D('hp',2);return 'تیم از اینکه نام سازمان را نفروخته‌ای خوشحال شد.'}],
 ['قبول می‌کنم و درآمد را با تیم تقسیم می‌کنم',()=>{S.cash+=Rw(30);S.st.fame=cl(S.st.fame+3);HRA(8);return 'نصف پول را به تیم دادی؛ شهرت و دوستی هر دو گرفتی.'}]]);

xm('ms_hurt','🩹','gemk','همتیمی زخمی',()=>HMn()+' در میانه‌ی عملیات زخمی شده و ماموریت هنوز تمام نشده است.',[
 ['کنارش می‌مانم',()=>{HR(HMi(),15);HX(.2);D('en',-10);D('hp',3);return 'ماموریت را نیمه‌کاره رها کردی، اما '+HMn()+' این را فراموش نمی‌کند.'}],
 ['ماموریت را تمام می‌کنم',()=>{if(hwin(.6)){HX(2);S.cash+=Rw(35);HR(HMi(),-12);S.st.fame=cl(S.st.fame+3);return 'ماموریت را تمام کردی، اما '+HMn()+' از اینکه تنهایش گذاشتی دلخور است.'}HR(HMi(),-20);D('h',-8);return 'نه ماموریت جواب داد، نه '+HMn()+' بخشید.'}],
 ['از سازمان کمک می‌خواهم',()=>{HX(.5);HRA(2);HR(HMi(),5);return 'تیم پزشکی رسید و کار با هماهنگی پیش رفت.'}]]);

xm('ms_rival','⚡','gemk','دوئل با قهرمان رقیب',()=>'یک قهرمان از سازمان رقیب جلوی دوربین‌ها تو را به دوئل دعوت می‌کند.',[
 ['قبول می‌کنم',()=>{if(hwin(.5)){S.st.fame=cl(S.st.fame+8);HX(1.5);S.cash+=Rw(25);return 'جلوی دوربین‌ها پیروز شدی و نامت بر سر زبان‌ها افتاد.'}S.st.fame=cl(S.st.fame-5);D('h',-14);D('hp',-8);HRA(-3);return 'جلوی دوربین‌ها شکست خوردی؛ بدنت و اعتبارت هر دو آسیب دیدند.'}],
 ['رد می‌کنم',()=>{S.st.fame=cl(S.st.fame-2);D('str',2);return 'همه فکر کردند ترسیده‌ای.'}],
 ['پیشنهاد مذاکره می‌دهم',()=>{if(rnd()<.4+S.tr.cf/250){S.st.fame=cl(S.st.fame+3);HX(.8);HRA(2);return 'با گفت‌وگو بدون درگیری کار تمام شد؛ احترام هر دو طرف را گرفتی.'}D('hp',-3);return 'او مذاکره را ضعف دید و مسخره‌ات کرد.'}]]);

xm('ms_identity','🎭','gemk','هویت در خطر',()=>'خبرنگاری به هویت واقعی‌ات مشکوک شده و دنبال مدرک می‌گردد.'+(HQ().n!='—'?' '+HQ().n+' هم متوجه رفتارهای عجیبت شده است.':''),[
 ['حقیقت را به نزدیک‌ترینم می‌گویم',()=>{const q=HQ();NR(q,8,10,5);mem(q,'راز ابرقهرمانی‌ات را فهمید.');if(rnd()<.2){HRA(-6);D('str',8);return 'او رازدارت بود، اما کسی حرف‌هایتان را شنید و راز تا حدی بیرون درز کرد.'}return q.n+' هم رازدارت شد و نزدیک‌تر شدید.'}],
 ['خبرنگار را ساکت می‌کنم',()=>{if(rnd()<.45){D('str',6);HX(.5);return 'خبرنگار عقب نشست؛ اما حس بدی ماند.'}S.st.fame=cl(S.st.fame-6);HRA(-8);D('hp',-6);return 'ماجرا رسانه‌ای شد و تیم از رفتارت ناراضی است.'}],
 ['انکار می‌کنم و دور می‌شوم',()=>{HRA(1);D('str',6);return 'این بار گذشت، اما خبرنگار هنوز دنبالت است.'}]]);

xm('ms_exam','🎖','gemk','ارزیابی ارتقا',()=>'فرماندهان سازمان آماده‌اند تو را برای رتبه‌ی بالاتر بسنجند. این فرصتی کم‌پیدا برای ارتقاست.',[
 ['در ارزیابی سخت شرکت می‌کنم',()=>{D('en',-15);if(hwin(.55)){HX(2.5);S.st.fame=cl(S.st.fame+3);return 'از آزمون سخت سربلند بیرون آمدی.'}HX(-.5);D('str',8);return 'آزمون سنگین بود و نتیجه‌اش به نفعت نشد.'}],
 ['با کمک تیم آماده می‌شوم',()=>{if(HAV()>=50){HX(2);HRA(5);return 'تیم کمکت کرد و با هم آماده شدید؛ نتیجه‌ی خوبی گرفتی.'}HX(.5);D('str',4);return 'تیم هنوز به اندازه‌ی کافی به تو اعتماد ندارد؛ کمک چندانی نکردند.'}],
 ['به تعویق می‌اندازم',()=>{D('str',-2);return 'فعلاً صبر کردی؛ فرصت دیگری پیش خواهد آمد.'}]],()=>{const h=hh();return h&&h.rank<5&&(h.xp-3*(h.rank-1))>=2});

xm('ms_extort','🧨','em','حق حفاظت',()=>'سازمان از تو می‌خواهد از یک کسب‌وکار محلی «حق حفاظت» بگیری.',[
 ['می‌گیرم',()=>{S.cash+=Rw(70);HX(1.5);HRA(3);NR(g('mother'),-4,-6,-5,3);if(rnd()<.2){XE().rec++;S.st.fame=cl(S.st.fame-5);return 'پول را گرفتی، اما ردپایی ماند و سابقه کیفری گرفتی.'}return 'پول را گرفتی و رئیس راضی است.'}],
 ['سرباز می‌زنم',()=>{HX(-.5);HRA(-6);D('hp',3);return 'وجدانت راحت شد، اما رئیس خوشحال نیست.'}],
 ['به پلیس خبر می‌دهم',()=>{if(rnd()<.5){S.st.fame=cl(S.st.fame+3);HX(-1);HRA(-10);return 'پلیس وارد شد؛ سازمان تو را مقصر می‌داند.'}D('h',-10);HRA(-15);HX(-1);return 'ماجرا لو رفت و تو را به‌عنوان خائن مورد حمله قرار دادند.'}]]);

/* ---- کارت شرکت‌های ابرقهرمانی (در «مسیر زندگی») ---- */
function XHeroCard(){const s=S,x=XE(),h=x.hero;let t='<div class="c"><h3>🦸 شرکت‌های ابرقهرمانی (از ۵ سالگی)</h3>';
 if(h){XHFix(h);const o=HC[h.c],pr=h.rank<5?Math.max(0,Math.min(100,(h.xp-3*(h.rank-1))/3*100)):100,cp=x.cap||{},ml=Math.max(0,3-(cp.ms||0));
  t+='<p>عضو '+o[0]+' · رتبه '+fa(h.rank)+' ('+HRT[h.rank]+') · استعداد: '+fa(x.pw)+'</p>';
  t+='<p class="mu">💰 حقوق ماهانه: '+fm(heroSal())+(s.age<18?' (کارآموز)':'')+'</p>';
  t+='<div class="g2" style="margin:8px 0">'+bar('⬆️',h.rank<5?'ارتقا به «'+HRT[h.rank+1]+'»':'ارتقا (بالاترین رتبه)',pr)+bar('🤝','رابطه با قهرمان‌های سازمان',HAV())+'</div>';
  t+='<div class="g2" style="margin:8px 0">'+o[2].map((n,i)=>bar('🦸',n.split(' (')[0],h.rel[i])).join('')+'</div>';
  t+='<div class="row">'+XB('XMission()','⚔️ ماموریت ('+fa(ml)+' of 3)','p')+'</div><div class="row">'+o[2].map((n,i)=>XB('XTeam('+i+')','تمرین با '+n.split(' (')[0]+' ('+fa(Math.max(0,2-(cp['tm'+i]||0)))+')')).join('')+'</div>';
  t+='<p class="mu">ماموریت‌ها رویدادهای تصمیم‌محورند؛ نتیجه‌شان روی پول، شهرت، سلامت، رابطه با تیم و ارتقایت اثر می‌گذارد.</p>'}
 else t+='<p class="mu">فقط با درخواست به شرکت‌ها می‌شود ابرقهرمان شد؛ استعداد شما تعیین‌کننده است. ابرقهرمانی شغلی پردرآمد است و حقوقش از همان لحظه‌ی استخدام به درآمدت اضافه می‌شود.</p>';
 t+=HC.map((c,i)=>'<div class="row"><span>'+c[0]+' ('+c[1]+') · '+c[2].slice(0,3).map(n=>n.split(' (')[0]).join('، ')+'</span>'+(!h&&s.age>=5?XB('XHApply('+i+')','درخواست'):'')+'</div>').join('')+'</div>';
 return t}

/* ===================== v5: اصلاحات، ابزارهای پایداری، راهنما، تست ===================== */
/* ---- ثبت خطا و رندر ایمن ---- */
const ERK='life.errlog';
function logErr(e,c){try{const a=JSON.parse(LS.get(ERK)||'[]');a.unshift({t:Date.now(),m:String((e&&e.message)||e).slice(0,200),s:String((e&&e.stack)||'').split('\n').slice(0,4).join(' | ').slice(0,400),age:S&&S.age,tab:S&&S.tab,ev:S&&S.ev&&S.ev.id,c:c||''});LS.set(ERK,JSON.stringify(a.slice(0,30)))}catch(_){}}
try{window.addEventListener('error',ev=>logErr(ev.error||ev.message,'window'));window.addEventListener('unhandledrejection',ev=>logErr(ev.reason,'promise'))}catch(_){}
function rend(){try{rendCore()}catch(e){logErr(e,'render');const el=$('#app');if(el)el.innerHTML=`<div class="c"><h3>خطا در نمایش</h3><p class="neg">${esc(String(e&&e.message||e))}</p><p class="mu">بازی ذخیره شده است. خطا در «تنظیمات ← گزارش خطا» ثبت شد.</p><div class="row"><button class="p" onclick="try{S.tab='h';S.ev=null;S.rs=null}catch(e){};rend()">بازگشت به خانه</button><button onclick="goMenu()">منو</button></div></div>`}}
function clearErr(){LS.del(ERK);rend()}
function exportErr(){dlt('life-errors.txt',(LS.get(ERK)||'[]'))}
function dlt(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
/* ---- سختی بازی ---- */
/* Difficulty: Easy/Normal/Hard with substantial differences
   cx = starting cash multiplier (easy gets more)
   ex = expense multiplier (hard pays more for everything)
   inf = inflation modifier (hard has higher inflation)
   jl = job luck penalty (hard has lower hiring chances)
   sa = salary multiplier (hard earns less)
   ac = activity quota multiplier (hard gets fewer activities) */
const DIF={
 e:{n:LANG==='fa'?'آسان':'Easy',cx:2.0,ex:.75,inf:-.04,jl:15,sa:1.3,ac:1.5},
 n:{n:LANG==='fa'?'معمولی':'Normal',cx:1.0,ex:1.0,inf:0,jl:0,sa:1.0,ac:1.0},
 h:{n:LANG==='fa'?'سخت':'Hard',cx:.3,ex:1.6,inf:.08,jl:-25,sa:.6,ac:.6}
};
const DX=()=>DIF[(S&&S.dif)||'n'].ex;
const DSA=()=>DIF[(S&&S.dif)||'n'].sa;
const DJL=()=>DIF[(S&&S.dif)||'n'].jl;
const DAC=()=>DIF[(S&&S.dif)||'n'].ac;
/* ---- شانس استخدام (شفاف) - under difficulty influence ---- */
function jobCh(j){return cl(25+S.st.iq*.3+S.tr.di*.1+S.tr.cf*.2+S.exp*2-j[3]+({n:0,b:12,r:-18}[S.eco.t])+DJL(),3,95)}
/* ---- ترمیم وضعیت‌های ناسازگار ---- */
function repair(){if(!S)return;
 const ps=S.npcs.filter(n=>n.role=='partner'&&n.alive&&!n.cut);
 if(ps.length>1)ps.slice(1).forEach(n=>{n.cut=1});
 if(S.married&&!has('partner'))S.married=0;
 if(!(S.kids>=0))S.kids=0;
 ['father','mother'].forEach(r=>{const a=S.npcs.filter(n=>n.role==r);if(a.length>1)S.npcs=S.npcs.filter(n=>n.role!=r||n===a[0])});
 if(S.job&&S.retired)S.job=null;
 if(S.study&&S.age<18)S.study=null;
 ['cash','inv'].forEach(k=>{if(!isFinite(S[k]))S[k]=0});
 if(S.npcs.length>8)S.npcs=S.npcs.slice(0,8)}
const cm0=commit;commit=function(){try{repair()}catch(e){logErr(e,'repair')}cm0()};
/* ---- نسخه پشتیبان ---- */
function readBak(i){for(const k of['bak','bak5']){const r=LS.get(KEYP+i+'.'+k);if(r){try{const j=JSON.parse(r);if(j&&j.S)return{j,k}}catch(e){}}}return null}
function restoreBak(i){const b=readBak(i);if(!b){flash='نسخه پشتیبان پیدا نشد.';return rend()}const o=fix(b.j.S);if(!o){flash='نسخه پشتیبان هم خراب است.';return rend()}o.slot=i;LS.set(KEYP+i,JSON.stringify({v:VER,t:Date.now(),S:o}));flash='زندگی از نسخه پشتیبان ('+fa(o.age)+' سالگی) بازیابی شد.';rend()}
/* ---- تنظیمات ظاهر ---- */
function applyPrefs(){try{const fs=LS.get('life.fs');if(fs)document.documentElement.style.setProperty('--fs',fs+'px');document.body.classList.toggle('dense',LS.get('life.dense')=='1')}catch(e){}}
function setFS(v){LS.set('life.fs',String(v));applyPrefs();rend()}
function setDense(){LS.set('life.dense',LS.get('life.dense')=='1'?'0':'1');applyPrefs();rend()}
/* ---- لحن نتیجه رویداد ---- */
function evTone(d){const v=(d||[]).reduce((a,x)=>a+(BAD[x[0]]?-x[1]:x[1]),0);return v>0?'okc':v<0?'badc':''}
/* ---- زندگینامه و پایان‌بندی ---- */
function bioLines(){const s=S;return[s.name+'، '+s.g+'، متولد '+s.city+'، '+s.co+'.'].concat(s.hist.slice().reverse().map(h=>fa(h[0])+' سالگی: '+h[1]))}
function bioText(){return'<ul>'+bioLines().map(l=>`<li>${esc(l)}</li>`).join('')+'</ul>'}
function exportBio(){dlt('life-bio.txt',bioLines().join('\n'))}
function epitaph(s){const x=s.x||{},nw=net();
 if(x.hero&&x.hero.rank>=4)return'قهرمانی که نامش در شهر ماند.';
 if(nw>=1000*s.m)return'ثروتی ساخت که نسل بعد هم از آن بهره برد.';
 if(x.rec>0&&x.jail>=0&&x.rec>=2)return'زندگی‌اش پر از حاشیه و ریسک بود.';
 if(s.kids>=3)return'خانواده‌ای بزرگ از او به یادگار ماند.';
 if(s.edu>=3)return'پزشکی که عمرش را به درمان دیگران داد.';
 if(s.st.fame>=60)return'چهره‌ای که بسیاری می‌شناختند.';
 if(s.age>=80)return'عمری طولانی و پراز خاطره.';
 if(s.age<30)return'زندگی‌ای کوتاه که نیمه‌تمام ماند.';
 return'زندگی‌ای معمولی، با لحظه‌های ارزشمند.'}
/* ---- راهنما ---- */
function tI(){const rows=[['🫀 سلامت','اگر پایان سال زیر ۲۵ باشد می‌میری. استرس بالای ۷۰ هر ماه سلامت و خوشحالی را می‌خورد.'],['😊 خوشحالی','با دوستی، بازی، موفقیت و خرید خانه بالا می‌رود؛ با بدهی، بیکاری و استرس پایین.'],['🧠 هوش (IQ)','روی شانس استخدام، پذیرش در دانشگاه و بورسیه اثر دارد و با مطالعه بالا می‌رود.'],['✨ ظاهر','روی شانس دوست‌یابی، مدلینگ و مچ شدن اثر دارد.'],['⚡ انرژی','با هر فعالیت کم می‌شود؛ با استراحت و گذر سال پر می‌شود. زیر ۱۵ فقط استراحت ممکن است.'],['⭐ شهرت','از شبکه اجتماعی، ابرقهرمانی و موفقیت می‌آید و هر سال کمی فروکش می‌کند.'],['😰 استرس','کار، بدهی و فرزند آن را بالا می‌برند؛ استراحت و سرگرمی پایینش می‌آورند.'],['🎲 اعتیاد به قمار','با هر شرط بالا می‌رود. بالای ۴۵ ممکن است بی‌اختیار ببازی.'],['❤️ محبت / 🤝 اعتماد / 🙏 احترام / 😠 عصبانیت','چهار شاخص رابطه با هر نفر. ازدواج به محبت ≥ ۷۰ و اعتماد ≥ ۵۵ نیاز دارد.']];
 return`<div class="c"><h3>❓ راهنمای شروع</h3><ul><li>زمان فقط با دکمهٔ «⏳ گذر زمان» جلو می‌رود؛ هر کلیک یک سال.</li><li>هر فعالیت در سال سهمیه دارد و با گذر سال دوباره پر می‌شود.</li><li>رویدادها گاهی وسط سال ظاهر می‌شوند و تصمیمت را می‌خواهند.</li><li>All amounts are in US dollars and scale with each country's purchasing power.</li><li>تا ۲۶ سالگی اگر درآمد نداشته باشی، خانواده هزینه‌های اصلی را می‌دهد؛ بعد از آن کمک بیکاری کوچکی می‌گیری.</li><li>سختی بازی (آسان/معمولی/سخت) هنگام ساخت زندگی انتخاب می‌شود و روی پول اولیه، هزینه‌ها و تورم اثر دارد.</li></ul></div><div class="c"><h3>📖 واژه‌نامهٔ شاخص‌ها</h3>${rows.map(r=>`<p><b>${r[0]}</b><br><span class="mu">${r[1]}</span></p>`).join('')}</div><div class="c"><h3>🎓 شخصیت</h3><p class="mu">خلاقیت، نظم، اعتمادبه‌نفس، اجتماعی‌بودن و جاه‌طلبی روی احتمال ارتقا، درآمد فریلنسری، دوست‌یابی و ایده‌های کسب‌وکار اثر می‌گذارند.</p></div>`}
/* (guide tab already in TABS) */
/* ---- تست خودکار داخل بازی ---- */
let TESTRES=null;
function selfTest(){const out=[],keep=S,kNS=NS,ok=(n,c,d)=>out.push([n,!!c,d||'']);
 const mkL=(co,sa)=>{newLife(0,'تست','Male',co,'m',sa||'a');S.slot=0;return S};
 const stepYear=()=>{let g=0;S.pend=12*DM;run();while(S.ev&&g++<40){if(!S.ev.res)pickO(0);else{S.ev=null;run()}}};
 try{setSeed(20260101);
  let s=mkL('Iran','a');
  ok('بازسازی و اعتبارسنجی ذخیره',(()=>{const o=fix(JSON.parse(JSON.stringify(S)));return o&&o.age==S.age&&Math.abs(o.cash-S.cash)<1})());
  ok('رد ذخیره خراب',fix({})===null&&fix(null)===null);
  S.cash=1000*S.m;S.edu=1;const ub=net()/S.m;migrate('Canada');
  ok('مهاجرت: ارزش دارایی به واحد جدید درست تبدیل می‌شود',S.co=='Canada'&&Math.abs(net()/S.m-(ub-400))<2,'قبل '+Math.round(ub)+' بعد '+Math.round(net()/S.m));
  s=mkL('USA','a');S.age=25;S.job={n:'برنامه‌نویس',sal:48*S.m,lvl:0,yr:0};S.cash=200*S.m;takeLoan(50,24);
  ok('وام: دریافت',!!S.loan&&S.cash>200*S.m);for(let i=0;i<3&&!S.dead;i++)stepYear();ok('وام: اقساط تمام می‌شود',!S.loan||S.loan.left<=0||S.dead);
  s=mkL('Germany','a');const p=mk('partner','همسر تست',25,'مهربان','-','متوسط',90);S.npcs.push(p);marry();
  ok('ازدواج',S.married==1);p.alive=0;repair();ok('ناسازگاری ازدواج بدون همسر برطرف می‌شود',S.married==0);
  s=mkL('Canada','a');const f=g('father');f.age=95;f.h=1;const c0=S.cash;yearly();ok('مرگ والد و ارث',!f.alive&&S.cash>c0);
  const ages=[];for(let k=0;k<3;k++){mkL(['Iran','Turkey','Japan'][k],'b');let n=0;while(!S.dead&&n++<140){if(S.ev){if(!S.ev.res)pickO(0);else{S.ev=null;run()}}else{if(S.age>=18&&!S.job&&!S.retired&&S.age<60)apply(0);stepYear()}}ages.push(S.age);ok('زندگی کامل '+(k+1)+': بدون مقدار نامعتبر',isFinite(S.cash)&&isFinite(net())&&Object.values(S.st).every(isFinite),'مرگ در '+S.age)}
  ok('طول عمر منطقی (میانگین بالای ۴۰)',ages.reduce((a,b)=>a+b,0)/ages.length>40,'سن‌ها: '+ages.join('، '))
 }catch(e){logErr(e,'selftest');ok('اجرای تست بدون خطا',false,String(e&&e.message||e))}
 unseed();S=keep;NS=kNS;TESTRES=out;if(S)S.tab='s';rend()}
function testHTML(){if(!TESTRES)return'';return`<div class="c"><h3>نتیجهٔ تست خودکار (${fa(TESTRES.filter(t=>t[1]).length)}/${fa(TESTRES.length)})</h3><ul>${TESTRES.map(t=>`<li class="${t[1]?'pos':'neg'}">${t[1]?'✓':'✗'} ${esc(t[0])} ${t[2]?'<span class="mu">'+esc(t[2])+'</span>':''}</li>`).join('')}</ul></div>`}
function tSX(){const fs=LS.get('life.fs')||'15',er=(()=>{try{return JSON.parse(LS.get(ERK)||'[]')}catch(e){return[]}})();
 return`<div class="c"><h3>دسترس‌پذیری و ظاهر</h3><p class="mu">اندازهٔ متن: ${fa(fs)}</p><div class="row">${[13,15,17,19].map(v=>`<button class="${fs==v?'p':''}" onclick="setFS(${v})">${fa(v)}</button>`).join('')}<button onclick="setDense()">${LS.get('life.dense')=='1'?'چیدمان فشرده: روشن':'چیدمان فشرده: خاموش'}</button></div></div>
<div class="c"><h3>بازی</h3><p class="mu">سختی: ${DIF[s_dif()].n}</p><div class="row"><button onclick="selfTest()">اجرای تست خودکار</button><button onclick="exportBio()">دانلود زندگینامه</button></div></div>${testHTML()}
<div class="c"><h3>گزارش خطا (${fa(er.length)})</h3>${er.length?`<ul>${er.slice(0,5).map(e=>`<li class="mu">${esc(e.m)} · ${fa(e.age==null?'؟':e.age)} years old · ${esc(e.c||'')}</li>`).join('')}</ul>`:'<p class="mu">خطایی ثبت نشده است.</p>'}<div class="row"><button onclick="exportErr()">خروجی</button><button class="d" onclick="clearErr()">پاک کردن</button></div></div>`}
const s_dif=()=>(S&&S.dif&&DIF[S.dif])?S.dif:'n';
applyPrefs();
applyLangDir();

applyTheme();rend();

const famXE=XE;XE=function(){const x=famXE();if(typeof x.pc!='number')x.pc=rnd()<.25?R(65,95):rnd()<.4?R(40,64):R(0,39);return x};
const famYearly=yearly;yearly=function(){famYearly();if(S&&!S.dead)XFam()};

const DLQ=`What does a red traffic light mean?|Slow down|Stop|Proceed with care|1
A flashing yellow light tells you to:|Stop completely|Proceed with caution|Speed up|1
When may you go at a green light?|Always immediately|When the intersection is clear|Only after honking|1
A stop sign requires you to:|Slow down|Come to a full stop|Yield only to trucks|1
A yield sign means:|Give way to other traffic|Always stop|Speed up|0
A solid yellow line on your side means:|You may pass|No passing|Parking allowed|1
A broken white line separates:|Traffic in opposite directions|Lanes going the same way|Parking spaces|1
At an uncontrolled intersection, who goes first?|The faster driver|The vehicle that arrived first|The larger vehicle|1
When must you use headlights?|Only on highways|At night and in poor visibility|Never in rain|1
A safe following distance in good conditions is about:|1 second|3 seconds|10 seconds|1
In rain you should:|Keep the same speed|Increase following distance|Use high beams|1
Who must wear seat belts?|Only the driver|All occupants|Only highway drivers|1
If you feel drowsy while driving:|Open a window and continue|Pull over and rest|Turn up the music|1
After drinking alcohol you should:|Drive slowly|Never drive|Drive if you feel fine|1
Pedestrians are waiting at a crosswalk. You:|Honk|Stop and let them cross|Speed up|1
An ambulance with sirens approaches. You:|Ignore it|Pull over and stop|Speed up|1
A school bus is stopped with flashing lights. You:|Pass slowly|Stop and wait|Honk|1
Using a phone while driving is OK:|Hands-free when safe|Anytime|At red lights only|0
Hydroplaning happens when:|Tires lose contact with the road due to water|Brakes overheat|The engine stalls|0
If your car skids you should:|Slam the brakes|Ease off the gas and steer where you want to go|Turn sharply|1
The horn should be used to:|Greet people|Warn of danger|Show anger|1
Before changing lanes you should:|Signal, check mirrors and blind spot|Only signal|Only honk|0
Your blind spot is:|An area not visible in your mirrors|The area in front|The area behind a trailer|0
Parking uphill next to a curb, turn the wheels:|Toward the curb|Away from the curb|Straight|1
Parking downhill next to a curb, turn the wheels:|Toward the curb|Away from the curb|Straight|0
A double solid yellow line means:|Passing allowed|No passing from either side|Bus lane|1
A diamond-shaped sign is generally:|A warning|A regulation|A guide|0
An octagonal sign always means:|Yield|Stop|Railroad|1
Railroad crossing lights are flashing. You:|Cross quickly|Stop and wait|Honk|1
The safe speed is:|The limit or lower for conditions|Always the limit|10 over the limit|0
When entering a freeway you should:|Stop at the ramp end|Match traffic speed|Drive slowly|1
On US roads the passing lane is the:|Right lane|Left lane|Shoulder|1
A traffic signal is out. Treat the intersection as:|A free-for-all|A four-way stop|A yield|1
The best steering wheel grip is:|One hand at the bottom|Both hands at 9 and 3|One hand on top|1
Tire pressure should be checked:|Never|Regularly|Only after a puncture|1
The oil warning light means:|Low oil pressure|Door open|Low fuel|0
A check-engine light means:|The engine system needs inspection|Radio fault|Window problem|0
A brake warning light means:|Fill the tank|Brake system problem|Flat tire|1
If your brakes fail you should:|Pump the pedal and downshift|Turn off the engine at speed|Jump out|0
If a tire blows out you should:|Brake hard|Grip the wheel, ease off gas and slow gradually|Turn sharply|1
In fog use:|High beams|Low beams|No lights|1
Driving in fog, you should:|Speed up|Slow down and increase distance|Follow closely|1
Black ice is most likely:|At midday|On bridges in freezing temperatures|In summer|1
Braking in snow should be:|Sudden|Gentle and early|Late|1
Turn signals should be used:|Before turning or changing lanes|After turning|Never|0
Turning left on a green light you must yield to:|Oncoming traffic|No one|Parked cars|0
A right turn on red (where allowed) requires:|A full stop and yielding|No stop|Honking|0
In a roundabout you yield to:|Traffic already in the circle|Traffic entering|No one|0
Driving behind a motorcycle you should:|Tailgate|Keep extra distance|Honk|1
When passing a cyclist you should:|Pass closely|Leave ample space|Honk|1
A pedestrian with a white cane:|Should be ignored|Has full right of way|Should be honked at|1
Where is stopping prohibited?|Near a fire hydrant|In your own driveway|On a quiet street|0
Minimum distance to park from a fire hydrant (US):|2 ft|15 ft|40 ft|1
You may park:|On crosswalks|In designated spaces|On sidewalks|1
A “No U-turn” sign means:|U-turns allowed|U-turns prohibited|Trucks only|1
A one-way sign means you must:|Go in the arrow direction|Go any direction|Reverse|0
A green arrow means:|A protected turn|Stop|Yield|0
Small children should ride:|In the front seat|In an appropriate car seat|On a lap|1
Never leave children:|Alone in the car|Buckled in|In car seats|0
Wearing sunglasses at night:|Is safe|Reduces visibility|Helps|1
Medication that causes drowsiness:|Is fine|Should not be taken before driving|Improves alertness|1
Speeding increases:|Stopping distance|Fuel economy|Safety|0
Doubling your speed makes braking distance about:|The same|Twice as long|Four times as long|2
Stopping distance equals reaction distance plus:|Following distance|Braking distance|Visibility|1
Typical driver reaction time is about:|0.1 s|0.75–1.5 s|5 s|1
When merging you should:|Match speed and find a gap|Stop|Cut in|0
Tailgating means:|Following too closely|Driving fast|Parking badly|0
Best response to road rage:|Retaliate|Stay calm and avoid eye contact|Chase them|1
After an accident you should first:|Leave|Stop, check for injuries, call emergency services|Argue|1
After a minor accident, exchange:|Nothing|Contact and insurance information|Only names|1
Hazard lights are used when:|Your vehicle is a temporary hazard|Driving fast|Parking at night|0
A flashing red light means:|Stop like a stop sign|Slow down|Go|0
A solid white line across the road is:|A stop line|A parking area|A passing zone|0
A yellow traffic light means:|Speed up|Prepare to stop|Go|1
When parallel parking you should be:|Far from the curb|Close to the curb|Across a driveway|1
Driving under the influence results in:|Nothing|Penalties and serious danger|Praise|1
Brake lights warn drivers:|Behind you|In front of you|Beside you|0
Rear-view mirrors should be adjusted:|Before driving|While driving|Never|0
Before reversing you should:|Check behind|Honk|Speed up|0
If you miss your exit you should:|Back up|Continue to the next exit|Stop|1
High beams may be used:|Near oncoming cars|On empty dark roads|In fog|1
At night you should be able to:|Stop within your headlight range|Drive faster|Ignore signs|0
Seat belts:|Reduce the risk of death|Do nothing|Only help in cities|0
Airbags work best with:|Seat belts|No belts|Children in front|0
Winter tires improve:|Traction in cold and snow|Fuel economy|Noise|0
Wiper blades should be replaced:|When they streak|Never|Only if broken|0
Driving too slowly can be dangerous because:|It disrupts traffic flow|It saves gas|It helps others|0
At a four-way stop, who goes first?|The first to arrive|The largest vehicle|The fastest|0
After driving through standing water:|Speed up|Test your brakes|Ignore it|1
A steady red arrow means:|Stop for that turn|Proceed|Yield|0
A school zone sign means:|Reduce speed and watch for children|Speed up|Park|0
Overtaking is forbidden:|On hills with limited visibility|On straight empty roads|At night|0
Never idle in a closed garage because of:|Carbon monoxide|Oxygen|Heat|0
You should refuel:|When empty|Before the tank gets low|Never|1
Arrows painted on lanes show:|Allowed direction of travel|Parking|Speed|0
Cargo should be:|Secured|Loose|Hanging out|0
Headlights should be on when:|Windshield wipers are in use|Never|Midday only|0
Passing on the right is allowed when:|The vehicle ahead is turning left on a multilane road|Always|Never|0
Distracted driving includes:|Eating, texting and adjusting devices|Looking ahead|Using turn signals|0
A broken yellow line on your side of the road means:|Passing is allowed when it is safe|Passing is never allowed|Parking only|0`.split('\n').map(l=>{const p=l.split('|');return{q:p[0],o:p.slice(1,-1),a:+p[p.length-1]}});
function XDl(){const x=XE();return x.dl=x.dl||{has:0,tries:0,q:null}}
function XDlStart(){const s=S,d=XDl();if(d.has)return msg('You already have a driver’s license.');if(s.age<16)return msg('You can take the driving test from age 16.');const fee=Math.round(15*s.m)/10;if(s.age>=18){if(s.cash<fee)return msg('The exam fee is '+fm(fee)+'.');s.cash-=fee}else H('Your guardian paid the driving exam fee.');const a=[];while(a.length<5){const i=R(0,DLQ.length-1);if(!a.includes(i))a.push(i)}d.q=a;rend()}
function XDlGo(){const d=XDl();if(!d.q)return;XDlScore(d.q.map((_,i)=>+document.getElementById('dq'+i).value))}
function XDlScore(ans){const d=XDl(),sc=d.q.filter((qi,i)=>DLQ[qi].a===ans[i]).length;d.q=null;d.tries++;if(sc>=4){d.has=1;H('You passed the driving test and got your license.');D('hp',6);msg('You scored '+sc+'/5 and passed! You now have a driver’s license and can buy a car.')}else msg('You scored '+sc+'/5. You need at least 4 correct to pass. You can retake the test.');rend()}
const tZ0=tZ;tZ=function(){const d=XDl();let h=tZ0();h+='<div class="c"><h3>🚗 Driver’s License</h3>';if(d.has)h+='<p>You have a driver’s license ✔</p>';else if(d.q)h+='<p class="mu">Answer all 5 questions. You need at least 4 correct.</p>'+d.q.map((qi,i)=>{const q=DLQ[qi];return '<p><b>'+(i+1)+'. '+esc(q.q)+'</b></p><select id="dq'+i+'"><option value="-1">Choose…</option>'+q.o.map((o,k)=>'<option value="'+k+'">'+esc(o)+'</option>').join('')+'</select>'}).join('')+'<button class="p" onclick="XDlGo()">Submit answers</button>';else h+='<p class="mu">'+(S.age<16?'Available from age 16.':'5 random questions; 4 correct to pass. Fee: '+fm(1.5*S.m)+(S.age<18?' (paid by your guardian until 18).':'.')+(d.tries?' Attempts so far: '+d.tries+'.':''))+'</p>'+(S.age>=16?'<button class="p" onclick="XDlStart()">Take the test</button>':'');return h+'</div>'};

function XAdmit(i,m){const s=S,x=XE(),u=UNI[i];if(s.age<18)return msg(tx('apps_locked'));if(s.study)return msg(LANG==='fa'?'در حال تحصیل هستی.':'You are already studying.');if(x.ay===s.age)return msg(LANG==='fa'?'امسال قبلاً درخواست داده‌ای. سال بعد دوباره.':'You already applied this year. Try again next year.');const cr=+((s.tr&&s.tr.cr)??(s.st&&s.st.cr)??50),iq=s.st.iq;
const L=LANG;
if(iq<u[2])return msg((L==='fa'?'هوشت برای پذیرش در ':'Your intelligence is too low for ')+u[0]+' ('+(L==='fa'?'حداقل ':'min ')+fa(u[2])+(L==='fa'?' لازم':' needed')+')');
if(m=='s'){const sc=(iq+cr)/2;const need=u[2]+10;if(sc<need)return msg((L==='fa'?'بورسیه رد شد: ترکیب هوش و خلاقیت باید ':'Scholarship denied: you need combined IQ+creativity of ')+fa(need)+(L==='fa'?' باشد (تو: ':' (yours: ')+Math.round(sc)+')')}
if(m=='f'){if(!(has('father')||has('mother')))return msg(L==='fa'?'قیمی برای پرداخت شهریه نداری.':'No guardian is available to pay your tuition.');const famCap={p:.7,m:2.5,w:4}[s.f]||.7,difMod={e:1.3,n:1,h:.7}[s.dif||'n']||1;if(u[1]>famCap*difMod)return msg((L==='fa'?'خانواده‌ات توان مالی '+u[0]+' را ندارند (سطح انتخابی و سختی بازی مؤثر است).':'Your family cannot afford '+u[0]+' (affected by difficulty).'))}
if(m=='p'){const need=Math.round(u[1]*10*s.m*10)/10;if(s.cash<need)return msg((L==='fa'?'حداقل ':'You need at least ')+fm(need)+(L==='fa'?' پول نقد لازم داری.':' in cash.'))}
x.ay=s.age;const admitCh=Math.min(1,.55+(iq-u[2])*.025);if(rnd()>=admitCh)return msg((L==='fa'?'برای '+u[0]+' درخواست دادی اما امسال پذیرفته نشدی.':'You applied to '+u[0]+' but were not admitted this year.'));
x.ut=i;x.fund=m;x.adm={i,m,y:s.age};const ft={f:tx('guardian_funded'),s:tx('scholarship'),p:tx('self_funded')}[m];H((L==='fa'?'قبول شدی: ':'Admitted to ')+u[0]);msg((L==='fa'?'قبول شدی: ':'Admitted: ')+u[0]+' ('+ft+'). '+(L==='fa'?'از تب مدرسه و دانشگاه ثبت‌نام کن.':'Enroll from the School & University tab.'));rend()}
function XAdCard(){const s=S,x=XE(),L=LANG,hd='<div class="c"><h3>🎓 '+tx('university_apps')+'</h3>';
if(s.age<18)return hd+'<p class="mu">'+tx('apps_locked')+'</p></div>';
const fm2=m=>({f:tx('guardian_funded'),s:tx('scholarship'),p:tx('self_funded')})[m]||m;
return hd+'<p class="mu">'+(L==='fa'?'دانشگاه را انتخاب کن و روش تأمین شهریه را مشخص کن. ':'Choose a university and how to pay. ')+tx('guardian_desc')+'. '+tx('scholarship_desc')+'.'+(x.adm?' '+(L==='fa'?'قبولی فعلی: ':'Current admission: ')+UNI[x.adm.i][0]+' ('+fm2(x.adm.m)+').':'')+'</p>'
+UNI.map((u,i)=>'<p><b>'+u[0]+'</b> · '+(L==='fa'?'حداقل هوش ':'min. IQ ')+fa(u[2])+'</p>'
+'<table style="margin:4px 0"><tr><td>'+tx('self_funded')+'</td><td class="mu">'+tx('self_funded_desc')+'</td></tr>'
+'<tr><td>'+tx('guardian_funded')+'</td><td class="mu">'+tx('guardian_desc')+'</td></tr>'
+'<tr><td>'+tx('scholarship')+'</td><td class="mu">'+tx('scholarship_desc')+'</td></tr></table>'
+'<div class="row">'+XB('XAdmit('+i+",'p')",tx('apply')+' · '+tx('self_funded'))+XB('XAdmit('+i+",'f')",tx('apply')+' · '+tx('guardian_funded'))+XB('XAdmit('+i+",'s')",tx('apply')+' · '+tx('scholarship'))+'</div>').join('')+'</div>'}
/* tU now includes university applications natively; old override removed */;
function XCls(){const s=S,x=XE();if(s.dead||s.age<7||s.age>22)return;x.cls=x.cls||[];if(s.age<=18&&x.cls.filter(c=>!c.f).length<5&&rnd()<.5)x.cls.push({n:XNM(rnd()<.5?'f':'m'),close:R(5,25),f:0});x.cls.forEach(c=>{if(c.f)return;c.close+=R(0,14);if(c.close>=65&&s.npcs.length<10){c.f=1;const id=1+s.npcs.filter(n=>/^cf\d/.test(n.role)).length;s.npcs.push(mk('cf'+id,c.n,s.age,'Classmate','wants to stay close','متوسط',c.close,'You became close friends at school.'));H('You and '+c.n+' became close friends.');x.nl.unshift(fa(s.age)+': '+c.n+' joined your inner circle.')}})}
const clsYearly=yearly;yearly=function(){clsYearly();XCls()};
const tR0=tR;tR=function(){if(S)S.npcs.forEach(n=>{if(/^cf\d/.test(n.role))RL[n.role]='Close friend'});return tR0()};
function XSetHeir(i){const x=XE(),k=(x.kids||[])[i];if(S.age<18)return msg(tx('heir_locked'));if(!k)return;x.heir=k.n;msg(k.n+' '+(LANG==='fa'?'به‌عنوان وارث تعیین شد.':'is now your designated heir.'));rend()}
const tK0=tK;tK=function(){const x=XE(),ks=x.kids||[],L=LANG;return tK0()+'<div class="c"><h3>📜 '+(L==='fa'?'وارث':'Heir')+'</h3>'+(S.age<18?'<p class="mu">'+tx('heir_locked')+'</p>':ks.length?'<p class="mu">'+(L==='fa'?'وارث تعیین‌شده: ':'Designated heir: ')+esc(x.heir||tx('no_heir'))+'. '+(L==='fa'?'پس از مرگ، زندگی از طریق وارث ۱۶ ساله یا بالاتر ادامه می‌یابد.':'If you die, your life can continue through an heir aged 16+.')+'</p><div class="row">'+ks.map((k,i)=>XB('XSetHeir('+i+')',esc(k.n)+' ('+fa(k.age)+(L==='fa'?' سال':'y')+')'+(x.heir===k.n?' ✅':''))).join('')+'</div>':'<p class="mu">'+tx('no_children_yet')+'</p>')+'</div>'};
const dh0=deadHTML;deadHTML=function(){const x=XE(),i=(x.kids||[]).findIndex(k=>k.n===x.heir&&k.age>=16),L=LANG;let h=dh0();if(i>=0)h+='<div class="c"><h3>👪 '+(L==='fa'?'ادامه زندگی':'Continue life')+'</h3><p>'+(L==='fa'?'وارث تعیین‌شده: ':'Designated heir: ')+'<b>'+esc(x.heir)+'</b></p>'+XB('XHeir('+i+')',tx('continue_as')+' '+esc(x.heir))+'</div>';return h};;
