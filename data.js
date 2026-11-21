/* SADA — content & sample data (bilingual). All people, messages and metrics are illustrative. */
'use strict';

const PLATFORMS = {
  instagram: { ar: 'إنستغرام', en: 'Instagram', limit: 2200, conn: 'connected' },
  x:         { ar: 'إكس',      en: 'X',         limit: 280,  conn: 'keys' },
  linkedin:  { ar: 'لينكدإن',  en: 'LinkedIn',  limit: 3000, conn: 'connected' },
  tiktok:    { ar: 'تيك توك',  en: 'TikTok',    limit: 2200, conn: 'planned' },
  snapchat:  { ar: 'سناب شات', en: 'Snapchat',  limit: 250,  conn: 'planned' },
  whatsapp:  { ar: 'قناة واتساب', en: 'WhatsApp channel', limit: 1000, conn: 'planned' },
};

const LANGS = {
  ar: { ar: 'العربية', en: 'Arabic', short: 'ع' },
  en: { ar: 'الإنجليزية', en: 'English', short: 'EN' },
  ur: { ar: 'الأردية', en: 'Urdu', short: 'اردو' },
};
const NEXT_LANGS = [
  { code: 'id', ar: 'الإندونيسية', en: 'Indonesian' }, { code: 'tr', ar: 'التركية', en: 'Turkish' },
  { code: 'bn', ar: 'البنغالية', en: 'Bengali' }, { code: 'fa', ar: 'الفارسية', en: 'Persian' },
];

const SOURCES = [
  { id: 'rda', ar: 'هيئة تطوير منطقة المدينة المنورة', en: 'Madinah Region Development Authority', trust: 'official' },
  { id: 'transport', ar: 'إدارة النقل بالمدينة المنورة', en: 'Madinah Transport Department', trust: 'official' },
  { id: 'vep', ar: 'برنامج تجربة الزائر', en: 'Visitor Experience Program', trust: 'official' },
  { id: 'gph', ar: 'الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي', en: 'General Authority for the Care of the Two Holy Mosques', trust: 'official', specialist: true },
  { id: 'ncm', ar: 'المركز الوطني للأرصاد', en: 'National Center for Meteorology', trust: 'official' },
  { id: 'volunteer', ar: 'برنامج التطوع بالمدينة المنورة', en: 'Madinah Volunteer Program', trust: 'official' },
  { id: 'chamber', ar: 'غرفة المدينة المنورة ومكتب الزراعة', en: 'Madinah Chamber & Agriculture Office', trust: 'partner' },
  { id: 'museum', ar: 'متحف دار المدينة', en: 'Dar Al-Madinah Museum', trust: 'partner' },
  { id: 'social', ar: 'حسابات تواصل اجتماعي غير رسمية', en: 'Unofficial social accounts', trust: 'unverified' },
];

const CATS = {
  routine:   { ar: 'خدمي', en: 'Service' },
  event:     { ar: 'فعالية', en: 'Event' },
  seasonal:  { ar: 'موسمي', en: 'Seasonal' },
  religious: { ar: 'ديني', en: 'Religious' },
  crisis:    { ar: 'سلامة وأزمات', en: 'Safety & crisis' },
};

/* Category playbooks used by the Strategy, Fact-check and Learning agents */
const PLAYBOOK = {
  routine: {
    strategy: { ar: 'هدف خدمي: تذكير عملي يُغني الزائر عن السؤال قبل أن يطرحه. الجمهور: الزوار الموجودون في المدينة حاليًا. القنوات: إكس وقناة واتساب لسرعة الوصول، وإنستغرام للصورة. التوقيت: صباحًا، قبل ساعات الذروة.',
                en: 'Service goal: a practical reminder that answers the question before the visitor asks it. Audience: visitors already in the city. Channels: X and the WhatsApp channel for fast reach, Instagram for visuals. Timing: morning, before peak hours.' },
    lesson:   { ar: 'فرضية للتجربة: قياس أثر النشر قبل التاسعة صباحًا في خفض الاستفسارات المتكررة.',
                en: 'Hypothesis to test: whether posting before 9 AM reduces repeat questions.' },
  },
  event: {
    strategy: { ar: 'هدف تسويقي: رفع الحضور وتعميق الصلة بالمكان. الجمهور: الزوار والمقيمون والعائلات. القنوات: إنستغرام وتيك توك للصورة والحركة، ولينكدإن للشركاء. التوقيت: مساءً، بعد انقضاء فترة صلاة العشاء.',
                en: 'Marketing goal: boost attendance and deepen the connection with the place. Audience: visitors, residents and families. Channels: Instagram and TikTok for image and motion, LinkedIn for partners. Timing: evening, once the Isha prayer window has passed.' },
    lesson:   { ar: 'فرضية للتجربة: مقارنة التفاعل بين الصورة الواقعية والبطاقة النصية في منشورات الفعاليات.',
                en: 'Hypothesis to test: compare engagement on realistic imagery versus text cards in event posts.' },
  },
  seasonal: {
    strategy: { ar: 'هدف توعوي موسمي: تهيئة الزائر قبل وصوله. الجمهور: القادمون خلال الموسم. القنوات: جميع المنصات، وبلغات الزوار الرئيسية. التوقيت: قبل الموسم بأسبوعين، ثم يوميًا طوال أيامه.',
                en: 'Seasonal awareness goal: prepare visitors before they arrive. Audience: arrivals during the season. Channels: every platform, in the main visitor languages. Timing: two weeks before the season, then daily throughout it.' },
    lesson:   { ar: 'فرضية للتجربة: مقارنة التفاعل بين اللغات لتحديد أولوية الترجمة في الموسم.',
                en: 'Hypothesis to test: compare engagement across languages to set translation priorities for the season.' },
  },
  religious: {
    strategy: { ar: 'هدف إرشادي: نقل التوجيه الرسمي كما صدر، بلا زيادة ولا اجتهاد. الجمهور: جميع الزوار. القنوات: القنوات الرسمية أولًا. التوقيت: بعد اعتماد المراجع المختص فقط.',
                en: 'Guidance goal: relay the official guidance exactly as issued, with nothing added and nothing inferred. Audience: all visitors. Channels: official channels first. Timing: only after specialist approval.' },
    lesson:   { ar: 'الدرس: توثيق ملاحظات المراجع المختص وإضافتها إلى دليل الأسلوب.',
                en: "Lesson: record the specialist reviewer's notes and add them to the style guide." },
  },
  crisis: {
    strategy: { ar: 'هدف السلامة: إيصال التنبيه بأسرع وقت وأوضح عبارة. الجمهور: كل من في المدينة الآن. القنوات: جميع المنصات فور اعتماد غرفة العمليات، مع تعليق أي نشر ترويجي حتى انتهاء التنبيه.',
                en: 'Safety goal: deliver the advisory as fast and as clearly as possible. Audience: everyone in the city now. Channels: every platform as soon as the operations room signs off. All promotional posts are paused until the advisory ends.' },
    lesson:   { ar: 'مؤشر للمتابعة: الزمن من صدور التنبيه الرسمي حتى نشره، والمستهدف أقل من 15 دقيقة.',
                en: 'Metric to track: time from the official advisory to publication; the target is under 15 minutes.' },
  },
};

const FACT = {
  ok: { ar: 'مطابق للمصدر الرسمي: التواريخ والأوقات والتفاصيل كما وردت، ولم يُضَف أي ادعاء غير وارد فيه.',
        en: 'Matches the official source: dates, times and details as published, with no claim added beyond it.' },
  religious: { ar: 'محتوى ديني: يلزم اعتماد المراجع المختص قبل النشر، ولم يُضِف الوكيل حكمًا ولا توجيهًا غير وارد في المصدر.',
               en: 'Religious content: specialist approval is required before publishing. The agent added no ruling or guidance beyond the source.' },
  crisis: { ar: 'مطابق لتنبيه المركز الوطني للأرصاد. يجب ذكر المصدر صراحةً، ولا يجوز تقدير درجات حرارة لم تُنشر رسميًا.',
            en: 'Matches the National Center for Meteorology advisory. The source must be named explicitly, and no temperature may be estimated unless it has been officially published.' },
};

const EVENTS = [
  {
    id: 'shuttle', cat: 'routine', src: 'transport', img: 'media/shuttle.jpg', when: { ar: 'يوميًا', en: 'Daily' },
    ar: { title: 'الحافلات الترددية… طريقك الأيسر إلى قلب المدينة', hook: 'دع سيارتك في الموقف، والطريق علينا',
          short: 'تنطلق الحافلات الترددية يوميًا من مواقف الزوار إلى وسط المدينة، من السادسة صباحًا حتى منتصف الليل.',
          more: 'رحلات منتظمة تكفيك عناء البحث عن موقف قرب المنطقة المركزية.',
          cta: 'اعرف أقرب محطة إليك عبر القنوات الرسمية لإدارة النقل.' },
    en: { title: 'Shuttle buses: the easy way into the city centre', hook: "Leave the car. We'll take it from here.",
          short: 'Shuttle buses run daily from the visitor car parks to the city centre, from 6:00 AM until midnight.',
          more: 'Regular departures spare you the hunt for parking near the central area.',
          cta: "Find your nearest stop on the Transport Department's official channels." },
    ur: { title: 'شٹل بسیں: شہر کے مرکز تک آسان راستہ',
          short: 'شٹل بسیں روزانہ صبح چھ بجے سے آدھی رات تک زائرین کی پارکنگ سے شہر کے مرکز تک چلتی ہیں۔',
          cta: 'قریب ترین اسٹاپ محکمۂ ٹرانسپورٹ کے سرکاری چینلز پر دیکھیں۔' },
    tags: { ar: ['#المدينة_المنورة', '#تنقل_ميسر'], en: ['#Madinah', '#VisitMadinah'] },
    alt: { ar: "حافلة ترددية بيضاء بلمسات خضراء تقف عند مظلة انتظار خالية في شارع تحفّه النخيل، تحت ضوء الصباح الباكر.",
           en: "A white shuttle bus with teal accents waits at an empty bus shelter on a palm-lined street in the early-morning light." },
  },
  {
    id: 'museum', cat: 'routine', src: 'museum', img: 'media/museum.jpg', when: { ar: 'يوميًا', en: 'Daily' },
    ar: { title: 'دار المدينة… حكاية المدينة تحت سقف واحد', hook: 'قرون من التاريخ في زيارة واحدة',
          short: 'يستقبل متحف دار المدينة زواره يوميًا، بتذاكر إلكترونية وجولات إرشادية تروي تاريخ المدينة وعمرانها.',
          more: 'رحلة معرفية تبدأ بتذكرة إلكترونية، وتنتهي بفهم أعمق للمكان.',
          cta: 'احجز تذكرتك عبر القنوات الرسمية للمتحف.' },
    en: { title: "Dar Al-Madinah: the city's story under one roof", hook: 'Centuries of history in a single visit',
          short: "Dar Al-Madinah Museum welcomes visitors daily, with e-tickets and guided tours that trace the city's history and architecture.",
          more: 'A journey that begins with an e-ticket and ends with a deeper sense of place.',
          cta: "Book your ticket through the museum's official channels." },
    ur: { title: 'دار المدینہ: ایک چھت تلے شہر کی کہانی',
          short: 'دار المدینہ میوزیم روزانہ زائرین کا استقبال کرتا ہے، ای ٹکٹ اور شہر کی تاریخ و تعمیرات پر رہنمائی والے دوروں کے ساتھ۔',
          cta: 'ٹکٹ میوزیم کے سرکاری چینلز سے بک کریں۔' },
    tags: { ar: ['#دار_المدينة', '#المدينة_المنورة'], en: ['#DarAlMadinah', '#VisitMadinah'] },
    alt: { ar: "مجسّم معماري لبلدة عربية قديمة، بيوتها من الطين وحولها النخيل، داخل صندوق زجاجي في قاعة متحف هادئة تزيّنها مشربيات خشبية.",
           en: "An architectural model of an old Arabian town of mud-brick houses and palm groves, in a glass case in a quiet museum hall with wooden mashrabiya screens." },
  },
  {
    id: 'dates', cat: 'event', src: 'chamber', img: 'media/dates.jpg', video: 'media/dates-tiktok.mp4', when: { ar: 'الأسبوع المقبل', en: 'Next week' },
    ar: { title: 'مهرجان التمور… موسم الطيبات في طيبة', hook: 'من نخيل المدينة إلى يديك',
          short: 'ينطلق مهرجان التمور السنوي الأسبوع المقبل بمشاركة عشرات المزارعين، مع تجارب تذوّق وأنشطة تعرّفك بأصناف تمور المدينة.',
          more: 'فرصة للقاء المزارعين، وتذوّق كل صنف من مصدره.',
          cta: 'اعرف المواعيد والموقع عبر القنوات الرسمية للغرفة.' },
    en: { title: 'The Madinah Dates Festival opens next week', hook: "From Madinah's palms to your hands",
          short: "The annual Dates Festival opens next week with dozens of local farmers, tastings and activities introducing Madinah's date varieties.",
          more: 'Meet the growers and taste each variety at its source.',
          cta: "Find the schedule and venue on the Chamber's official channels." },
    ur: { title: 'مدینہ کھجور میلہ اگلے ہفتے',
          short: 'سالانہ کھجور میلہ اگلے ہفتے درجنوں مقامی کسانوں کی شرکت سے شروع ہو رہا ہے، جہاں چکھنے اور مدینہ کی کھجوروں کی اقسام سے تعارف کا موقع ملے گا۔',
          cta: 'تاریخیں اور مقام سرکاری چینلز پر دیکھیں۔' },
    tags: { ar: ['#مهرجان_التمور', '#تمور_المدينة', '#المدينة_المنورة'], en: ['#MadinahDates', '#VisitMadinah'] },
    alt: { ar: "سلال من خوص النخيل تفيض بتمور العجوة والسكري على منصة خشبية، تتدلى فوقها عذوق التمر في ضوء المساء الذهبي.",
           en: "Palm-leaf baskets brimming with Ajwa and Sukkari dates on a wooden stall, with date clusters hanging above in golden evening light." },
  },
  {
    id: 'volunteers', cat: 'event', src: 'volunteer', img: 'media/welcome.jpg', when: { ar: 'التسجيل مفتوح', en: 'Registration open' },
    ar: { title: 'التسجيل مفتوح في برنامج التطوع لخدمة زوار المدينة', hook: 'كن أول ترحيب يلقاه ضيف المدينة',
          short: 'فُتح باب التسجيل في برنامج تطوعي لإرشاد الزوار وخدمتهم في المواقع الرئيسية.',
          more: 'ساعات قليلة من وقتك تصنع لضيف المدينة ذكرى تبقى.',
          cta: 'سجّل عبر القنوات الرسمية لبرنامج التطوع.' },
    en: { title: 'Volunteer registration is now open', hook: 'Be the first welcome a visitor receives',
          short: 'Registration is open for a volunteer programme that guides and serves visitors at key sites.',
          more: 'A few hours of your time can give a visitor a memory that lasts.',
          cta: "Register through the programme's official channels." },
    ur: { title: 'زائرین کی خدمت کے لیے رضاکار پروگرام میں رجسٹریشن جاری',
          short: 'اہم مقامات پر زائرین کی رہنمائی اور خدمات کے لیے رضاکار پروگرام میں رجسٹریشن شروع ہو گئی ہے۔',
          cta: 'سرکاری چینلز کے ذریعے رجسٹر کریں۔' },
    tags: { ar: ['#تطوع_المدينة', '#زوار_المدينة'], en: ['#VolunteerMadinah', '#VisitMadinah'] },
    alt: { ar: "نقطة ترحيب أنيقة في ساحة تحفّها النخيل: وشاحات خضراء مطوية، وخرائط مطبوعة، وقوارير ماء تحت مظلة بيضاء.",
           en: "An elegant welcome point in a palm-lined plaza: folded teal sashes, printed maps and water bottles beneath a white canopy." },
  },
  {
    id: 'ramadan', cat: 'seasonal', src: 'vep', img: 'media/ramadan.jpg', when: { ar: 'موسم رمضان', en: 'Ramadan season' },
    ar: { title: 'رمضان في المدينة… برامج تُثري رحلة الزائر', hook: 'لرمضان في المدينة مذاقٌ لا يشبهه مذاق',
          short: 'تُقدَّم خلال شهر رمضان برامج توعوية وخدمات إضافية للزوار في محيط المنطقة المركزية.',
          more: 'تُعلَن تفاصيلها تباعًا، فترقّبها.',
          cta: 'تابع القنوات الرسمية لبرنامج تجربة الزائر لمعرفة البرامج اليومية.' },
    en: { title: 'Ramadan in Madinah: programmes that enrich every visit', hook: 'Ramadan in Madinah feels like nowhere else',
          short: 'Throughout Ramadan, awareness programmes and additional visitor services run around the central area.',
          more: 'Details will follow, so stay tuned.',
          cta: "Follow the Visitor Experience Program's official channels for the daily schedule." },
    ur: { title: 'مدینہ میں رمضان: زائرین کے سفر کو نکھارنے والے پروگرام',
          short: 'رمضان کے دوران مرکزی علاقے کے اطراف آگاہی پروگرام اور اضافی خدمات فراہم کی جاتی ہیں۔',
          cta: 'روزانہ شیڈول کے لیے سرکاری چینلز فالو کریں۔' },
    tags: { ar: ['#رمضان_في_المدينة', '#زوار_المدينة'], en: ['#RamadanInMadinah', '#VisitMadinah'] },
    alt: { ar: "فوانيس نحاسية مضيئة فوق ممر هادئ في حي قديم، وهلال رقيق في سماء زرقاء داكنة، ودلّة قهوة وتمر على مائدة تنتظر الضيوف.",
           en: "Glowing brass lanterns above a quiet old-town lane, a thin crescent in a deep blue sky, and a coffee pot with dates on a table awaiting guests." },
  },
  {
    id: 'quba', cat: 'event', src: 'rda', img: null, when: { ar: 'نهاية هذا الأسبوع', en: 'This weekend' },
    ar: { title: 'معرض ثقافي يروي تاريخ مسجد قباء', hook: 'تاريخ قباء… في معرض مفتوح للزوار',
          short: 'تنظّم هيئة تطوير منطقة المدينة المنورة على مدى ثلاثة أيام معرضًا ثقافيًا يستعرض تاريخ مسجد قباء، مع جولات إرشادية مجانية.',
          more: 'يفتح المعرض أبوابه نهاية هذا الأسبوع بجوار المسجد.',
          cta: 'تابع المواعيد عبر القنوات الرسمية للهيئة.' },
    en: { title: 'A cultural exhibition on the history of Quba Mosque', hook: "Quba's history, open to every visitor",
          short: 'The Madinah Region Development Authority is staging a three-day exhibition on the history of Quba Mosque, with free guided tours.',
          more: 'It opens this weekend beside the mosque.',
          cta: "Check timings on the Authority's official channels." },
    ur: { title: 'مسجد قباء کی تاریخ پر ثقافتی نمائش',
          short: 'مدینہ منورہ ریجن ڈیولپمنٹ اتھارٹی مسجد قباء کی تاریخ پر تین روزہ نمائش منعقد کر رہی ہے، جس میں مفت رہنمائی والے دورے شامل ہیں۔',
          cta: 'اوقات اتھارٹی کے سرکاری چینلز پر دیکھیں۔' },
    tags: { ar: ['#قباء', '#المدينة_المنورة'], en: ['#Quba', '#VisitMadinah'] },
    alt: { ar: 'تُختار الصورة من المكتبة المعتمدة.', en: 'Image to be chosen from the approved library.' },
  },
  {
    id: 'nabawi', cat: 'religious', src: 'gph', img: null, when: { ar: 'مستمر', en: 'Ongoing' },
    ar: { title: 'آداب زيارة المسجد النبوي الشريف', hook: 'زيارة تليق بالمكان',
          short: 'إرشادات للزوار حول آداب الزيارة وأوقات الذروة داخل المسجد النبوي الشريف.',
          more: '',
          cta: 'اطّلع على الإرشادات كاملة عبر القنوات الرسمية للهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي.' },
    en: { title: "Etiquette for visiting the Prophet's Mosque", hook: 'A visit worthy of the place',
          short: "Guidance for visitors on visiting etiquette and peak times inside the Prophet's Mosque.",
          more: '',
          cta: 'Read the full guidance on the official channels of the General Authority for the Care of the Two Holy Mosques.' },
    ur: { title: 'مسجد نبوی شریف کی زیارت کے آداب',
          short: 'مسجد نبوی شریف میں زیارت کے آداب اور رش کے اوقات کے بارے میں زائرین کے لیے رہنمائی۔',
          cta: 'مکمل رہنمائی سرکاری چینلز پر دیکھیں۔' },
    tags: { ar: ['#المسجد_النبوي', '#زوار_المدينة'], en: ['#VisitMadinah'] },
    alt: { ar: 'تُختار الصورة من المكتبة المعتمدة.', en: 'Image to be chosen from the approved library.' },
  },
  {
    id: 'heat', cat: 'crisis', src: 'ncm', img: 'media/heat.jpg', when: { ar: 'اليوم', en: 'Today' },
    ar: { title: 'تنبيه: ارتفاع في درجات الحرارة اليوم', hook: 'حرارة مرتفعة اليوم… سلامتك أولًا',
          short: 'يتوقع المركز الوطني للأرصاد ارتفاعًا في درجات الحرارة اليوم. أكثِر من شرب الماء، وتجنّب التعرض للشمس في ساعات الذروة.',
          more: 'وإن استطعت، فاجعل تنقّلك في الصباح الباكر أو في المساء.',
          cta: 'تابع تحديثات المركز الوطني للأرصاد أولًا بأول.' },
    en: { title: 'Advisory: high temperatures today', hook: 'High heat today. Your safety comes first.',
          short: 'The National Center for Meteorology expects high temperatures today. Drink water often and stay out of the sun during peak hours.',
          more: 'Where you can, plan your movements for early morning or evening.',
          cta: 'Follow the National Center for Meteorology for the latest updates.' },
    ur: { title: 'انتباہ: آج درجۂ حرارت زیادہ رہے گا',
          short: 'قومی مرکزِ موسمیات کے مطابق آج درجۂ حرارت زیادہ رہنے کی توقع ہے۔ پانی کثرت سے پئیں اور دوپہر کی تیز دھوپ سے بچیں۔',
          cta: 'تازہ معلومات کے لیے قومی مرکزِ موسمیات کو فالو کریں۔' },
    tags: { ar: ['#المدينة_المنورة', '#سلامتك_تهمنا'], en: ['#Madinah', '#StaySafe'] },
    alt: { ar: "قارورة ماء باردة على مقعد حجري في ظل مظلة فاتحة، بجوار ساحة مشمسة تحفّها النخيل ويتموّج فوقها الهواء من شدة الحر.",
           en: "A chilled water bottle on a stone bench in the shade of a pale parasol, beside a sunny palm-lined plaza shimmering with heat." },
  },
];

const RUMOR = {
  id: 'rumor', cat: 'routine', src: 'social', img: null,
  ar: { title: 'منشور متداول: إغلاق طريق الهجرة اليوم', short: 'حساب غير رسمي يتداول خبرًا عن إغلاق جزئي لطريق الهجرة، دون ذكر أي مصدر.' },
  en: { title: 'Circulating post: Hijrah Road closed today', short: 'An unofficial account is claiming a partial closure of Hijrah Road, without citing any source.' },
};

const RADAR = [
  { ev: 'heat', mins: 12 }, { ev: 'volunteers', mins: 38 }, { ev: 'rumor', mins: 51 },
  { ev: 'dates', mins: 95 }, { ev: 'quba', mins: 180 }, { ev: 'museum', mins: 310 }, { ev: 'ramadan', mins: 540 },
];

const STAGES = {
  coord:   { ar: 'التنسيق', en: 'Coordination' },
  monitor: { ar: 'الرصد والبيانات', en: 'Monitoring & data' },
  plan:    { ar: 'التخطيط', en: 'Planning' },
  produce: { ar: 'الإنتاج', en: 'Production' },
  quality: { ar: 'الجودة', en: 'Quality' },
  publish: { ar: 'النشر', en: 'Publishing' },
  engage:  { ar: 'التفاعل', en: 'Engagement' },
  analyze: { ar: 'التحليل', en: 'Analysis' },
};

/* Sixteen agents in eight stages, plus the human approval gate (a layer, not an agent).
   mvp: true = part of the first five-agent release. */
const AGENTS = [
  { id: 'orchestrator', stage: 'coord', kind: 'llm', mvp: true, ar: 'المنسّق', en: 'Orchestrator',
    d: { ar: 'يستقبل الطلب ويوزّع المهام ويتابع الحالة، ويتوقف عند نقاط الاعتماد', en: 'Takes the request, assigns the work, tracks status and stops at every approval point' } },
  { id: 'monitor', stage: 'monitor', kind: 'rules', mvp: true, ar: 'الرصد والترندات', en: 'Monitoring & trends',
    d: { ar: 'يتابع المصادر الموثوقة والوسوم والموضوعات الرائجة', en: 'Follows trusted sources, hashtags and trending topics' } },
  { id: 'competitors', stage: 'monitor', kind: 'llm', ar: 'تحليل المنافسين', en: 'Competitor analysis',
    d: { ar: 'يرصد محتوى الحسابات النظيرة وأوقات نشرها ومعدلات تفاعلها', en: "Tracks peer accounts' content, posting times and engagement" } },
  { id: 'data', stage: 'monitor', kind: 'rules', ar: 'جمع البيانات', en: 'Data collection',
    d: { ar: 'يسحب الإحصاءات من المنصات عبر واجهاتها البرمجية ويخزّنها', en: 'Pulls statistics from the platforms through their APIs and stores them' } },
  { id: 'strategy', stage: 'plan', kind: 'llm', ar: 'الاستراتيجية والتقويم', en: 'Strategy & calendar',
    d: { ar: 'يبني خطة المحتوى ويحدد أفضل أوقات النشر', en: 'Builds the content plan and picks the best times to post' } },
  { id: 'writing', stage: 'produce', kind: 'llm', mvp: true, ar: 'الكتابة', en: 'Writing',
    d: { ar: 'يكتب النص ويعيد صياغته لكل منصة', en: 'Writes the post and reshapes it for each platform' } },
  { id: 'design', stage: 'produce', kind: 'gemini', mvp: true, ar: 'التصميم وتوليد الصور', en: 'Design & imagery',
    d: { ar: 'يولّد الصور والبطاقات وفق الهوية والقيود، بلا ذوات أرواح', en: 'Generates images and cards within the brand and its limits, with no living beings' } },
  { id: 'video', stage: 'produce', kind: 'llm', ar: 'الفيديو', en: 'Video',
    d: { ar: 'يكتب سكربتات المقاطع وأوصاف المشاهد والتعليق الصوتي', en: 'Writes short-video scripts, shot descriptions and voice-over' } },
  { id: 'hashtags', stage: 'produce', kind: 'llm', ar: 'الوسوم وتحسين الظهور', en: 'Hashtags & reach',
    d: { ar: 'يقترح الوسوم والكلمات المفتاحية', en: 'Suggests hashtags and keywords' } },
  { id: 'localize', stage: 'produce', kind: 'llm', ar: 'الترجمة والتوطين', en: 'Translation & localisation',
    d: { ar: 'يُعدّ نسخ اللغات مراعيًا السياق المحلي', en: 'Prepares each language version with local context in mind' } },
  { id: 'review', stage: 'quality', kind: 'llm', mvp: true, ar: 'المراجعة والامتثال', en: 'Review & compliance',
    d: { ar: 'يدقق اللغة وصوت العلامة والضوابط الشرعية والأنظمة وحقوق الملكية', en: 'Checks language, brand voice, religious guidelines, regulations and rights' } },
  { id: 'factcheck', stage: 'quality', kind: 'llm', ar: 'التحقق من المعلومات', en: 'Fact-check',
    d: { ar: 'يطابق الأرقام والادعاءات بمصادرها قبل النشر', en: 'Checks figures and claims against their sources before release' } },
  { id: 'gate', stage: 'quality', kind: 'layer', ar: 'بوابة الاعتماد البشري', en: 'Human approval gate',
    d: { ar: 'لا يُنشر شيء قبل أن يعتمده شخص', en: 'Nothing is published until a person approves it' } },
  { id: 'publishing', stage: 'publish', kind: 'rules', ar: 'الجدولة والنشر', en: 'Scheduling & publishing',
    d: { ar: 'ينشر المحتوى المعتمد في موعده على كل منصة', en: 'Publishes approved content on time on every platform' } },
  { id: 'community', stage: 'engage', kind: 'llm', ar: 'إدارة المجتمع', en: 'Community management',
    d: { ar: 'يصنّف الرسائل ويقرأ المشاعر ويقترح الردود، ويحيل الحساس إلى الفريق', en: 'Sorts messages, reads sentiment, drafts replies and refers sensitive cases to the team' } },
  { id: 'crisiswatch', stage: 'engage', kind: 'rules', ar: 'رصد الأزمات', en: 'Crisis watch',
    d: { ar: 'ينبّه فورًا عند ارتفاع مفاجئ في التفاعل السلبي', en: 'Raises an alert the moment negative engagement spikes' } },
  { id: 'reports', stage: 'analyze', kind: 'llm', ar: 'التقارير والتحليلات', en: 'Reports & analytics',
    d: { ar: 'يحسب المؤشرات ويقارن اختبارات A/B ويرفع التوصيات للدورة التالية', en: 'Computes KPIs, compares A/B tests and recommends the next cycle' } },
];
const PIPE_PLAN = ['orchestrator', 'monitor', 'strategy', 'writing', 'localize', 'hashtags', 'design', 'video', 'review', 'factcheck', 'gate'];
const PIPE_PUBLISH = ['publishing', 'reports'];

const MEMBERS = {
  khalid: { ar: 'خالد العتيبي', en: 'Khalid Alotaibi', role: { ar: 'مدير الإعلام', en: 'Head of media' }, ini: { ar: 'خ', en: 'KA' }, load: 4 },
  reem: { ar: 'ريم الحربي', en: 'Reem Alharbi', role: { ar: 'محررة المحتوى', en: 'Content editor' }, ini: { ar: 'ر', en: 'RA' }, load: 7 },
  abdulrahman: { ar: 'د. عبدالرحمن الجهني', en: 'Dr. Abdulrahman Aljohani', role: { ar: 'المراجع المختص', en: 'Specialist reviewer' }, ini: { ar: 'ع', en: 'AJ' }, load: 2 },
  noura: { ar: 'نورة السلمي', en: 'Noura Alsulami', role: { ar: 'مصممة المحتوى', en: 'Content designer' }, ini: { ar: 'ن', en: 'NA' }, load: 5 },
  fahad: { ar: 'فهد المطيري', en: 'Fahad Almutairi', role: { ar: 'مسؤول التفاعل', en: 'Community manager' }, ini: { ar: 'ف', en: 'FA' }, load: 6 },
  ops: { ar: 'غرفة العمليات', en: 'Operations room', role: { ar: 'اعتماد الأزمات', en: 'Crisis sign-off' }, ini: { ar: 'غ', en: 'OR' }, load: 1 },
};
const ROLE_OF = { editor: 'reem', manager: 'khalid', specialist: 'abdulrahman', ops: 'ops' };
const ROLE_NAME = {
  editor: { ar: 'محررة المحتوى', en: 'Content editor' }, manager: { ar: 'مدير الإعلام', en: 'Head of media' },
  specialist: { ar: 'المراجع المختص', en: 'Specialist reviewer' }, ops: { ar: 'غرفة العمليات', en: 'Operations room' },
};

/* Sensitivity terms. `src: 'nabd'` = in the current build; `src: 'new'` = added by this design.
   Latin terms match whole words; a trailing * means prefix match. */
const TERMS = {
  sensitive: [
    ...['المسجد النبوي', 'النبوي', 'الروضة', 'الشعائر', 'فتوى', 'حكم شرعي', 'صلاة', 'الحرم', 'قباء', 'قرآن',
        'أزمة', 'طارئ', 'حادث', 'وفاة', 'إخلاء', 'موجة حر', 'تنبيه', 'خطر',
        'prophet', 'mosque', 'fatwa', 'religious ruling', 'prayer', 'holy', 'shrine', 'quran',
        'crisis', 'emergency', 'accident', 'evacuat*', 'death', 'casualt*', 'hazard', 'heatwave', 'warning', 'alert'].map(t => ({ t, src: 'nabd' })),
    ...['مسجد نبوی', 'روضہ', 'ریاض الجنۃ', 'نماز', 'فتویٰ', 'حکم شرعی', 'ہنگامی', 'انتباہ'].map(t => ({ t, src: 'new' })),
  ],
  medium: [
    ...['فعالية', 'معرض', 'حدث', 'جديد', 'موسم', 'رمضان', 'الحج', 'العمرة',
        'event', 'exhibition', 'festival', 'new', 'season', 'ramadan', 'hajj', 'umrah'].map(t => ({ t, src: 'nabd' })),
    ...['فعاليات', 'مهرجان', 'میلہ', 'نمائش'].map(t => ({ t, src: 'new' })),
  ],
};

/* Approximate Madinah prayer times for late November (Umm al-Qura). Production reads the official feed. */
const PRAYERS = [
  { id: 'fajr', ar: 'الفجر', en: 'Fajr', t: '05:27' },
  { id: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', t: '12:09' },
  { id: 'asr', ar: 'العصر', en: 'Asr', t: '15:11' },
  { id: 'maghrib', ar: 'المغرب', en: 'Maghrib', t: '17:32' },
  { id: 'isha', ar: 'العشاء', en: 'Isha', t: '19:02' },
];
const QUIET = { before: 5, after: 30 };
/* The current build's fixed "best time" per category (nabd/agents.py, _BEST_TIME) */
const BEST = { routine: '08:30', event: '19:00', seasonal: '20:30', religious: '16:00', crisis: 'now' };

const INBOX = [
  { id: 'm1', pf: 'x', lang: 'en', who: '@traveller_2817', mins: 9, intent: 'complaint', mood: 'neg', ev: 'shuttle',
    text: "The shuttle at car park 3 hasn't come for 40 minutes. Does anyone know what's going on?",
    tr: { ar: 'الحافلة الترددية في الموقف 3 لم تصل منذ 40 دقيقة. هل يعرف أحد ما الذي يحدث؟' },
    reply: "We're sorry for the wait. We've passed this to the Transport Department right away and will update you here as soon as we hear back.",
    flag: 'escalate', note: { ar: 'شكوى تشغيلية: أُحيلت إلى إدارة النقل، ولا يَعِد الرد بأي موعد لم يُؤكَّد.', en: 'Operational complaint: escalated to the Transport Department; the reply promises no time that has not been confirmed.' } },
  { id: 'm2', pf: 'instagram', lang: 'ar', who: '@um_sara.trips', mins: 14, intent: 'question', mood: 'neu', ev: 'quba',
    text: 'هل الجولات الإرشادية في معرض قباء مجانية؟ وما مواعيدها؟',
    tr: { en: 'Are the guided tours at the Quba exhibition free? What are the timings?' },
    reply: 'أهلًا بك. الجولات الإرشادية في المعرض مجانية للزوار، وتُعلَن مواعيدها عبر القنوات الرسمية لهيئة تطوير منطقة المدينة المنورة.',
    flag: 'grounded', note: { ar: 'الرد مستند إلى المصدر الرسمي للمعرض، دون أي إضافة.', en: "Reply grounded in the exhibition's official source, with nothing added." } },
  { id: 'm3', pf: 'instagram', lang: 'ur', who: '@hafiz.lahore', mins: 22, intent: 'question', mood: 'neu', ev: 'nabawi',
    text: 'کیا ریاض الجنۃ کی زیارت کے لیے پرمٹ ضروری ہے؟',
    tr: { ar: 'هل يلزم تصريح لزيارة الروضة الشريفة؟', en: 'Is a permit required to visit the Rawdah?' },
    reply: 'جی ہاں، روضہ شریف کی زیارت کے لیے نسک ایپ کے ذریعے پیشگی اجازت نامہ ضروری ہے، اور مقررہ وقت کی پابندی لازمی ہے۔',
    flag: 'template', note: { ar: 'موضوع ديني بالأردية: التقطته قواعد الأردية المضافة في هذا التصميم، والرد مأخوذ من قالب معتمد.', en: 'A religious topic in Urdu: caught by the Urdu rules this design adds; the reply comes from an approved template.' } },
  { id: 'm4', pf: 'x', lang: 'ar', who: '@abu_faisal', mins: 31, intent: 'ruling', mood: 'neu',
    text: 'ما حكم تكرار زيارة الروضة في اليوم نفسه؟',
    tr: { en: 'What is the ruling on visiting the Rawdah more than once on the same day?' },
    reply: 'نشكر لك سؤالك. للاستفسارات الشرعية، يُرجى التواصل مع الجهات المختصة عبر قنواتها الرسمية.',
    flag: 'nofatwa', note: { ar: 'سؤال عن حكم شرعي: الوكيل لا يُفتي، ويكتفي بالإحالة.', en: 'A request for a religious ruling: the agent never issues one and replies with a referral only.' } },
  { id: 'm5', pf: 'tiktok', lang: 'ar', who: '@madinah.vibes', mins: 47, intent: 'praise', mood: 'pos', ev: 'dates',
    text: 'المهرجان كان رائعًا السنة الماضية! متى يبدأ هذه السنة؟',
    tr: { en: 'The festival was wonderful last year! When does it start this year?' },
    reply: 'يسعدنا أنه نال إعجابك! ينطلق مهرجان التمور الأسبوع المقبل، وتجد مواعيده وموقعه عبر القنوات الرسمية للغرفة.',
    flag: 'grounded', note: { ar: 'إشادة واستفسار: رد دافئ مستند إلى المصدر.', en: 'Praise and a question: a warm reply grounded in the source.' } },
  { id: 'm6', pf: 'instagram', lang: 'id', who: '@rizky.umrah', mins: 63, intent: 'question', mood: 'neu', ev: 'museum',
    text: 'Apakah Museum Dar Al-Madinah buka pada hari Jumat?',
    tr: { ar: 'هل يفتح متحف دار المدينة يوم الجمعة؟', en: 'Is Dar Al-Madinah Museum open on Friday?' },
    reply: 'Terima kasih atas pertanyaannya! Jadwal hari Jumat dapat dilihat di kanal resmi museum.',
    flag: 'noguess', note: { ar: 'لا توجد معلومة موثّقة عن يوم الجمعة، فأحال الرد إلى المصدر بدل التخمين.', en: 'No verified information about Friday, so the reply points to the source instead of guessing.' } },
  { id: 'm7', pf: 'x', lang: 'ar', who: '@q_almadinah', mins: 70, intent: 'rumor', mood: 'neu', ev: 'rumor',
    text: 'صحيح أن طريق الهجرة مسكّر اليوم؟',
    tr: { en: 'Is it true that Hijrah Road is closed today?' },
    reply: 'شكرًا لتواصلك. لم يصدر أي إعلان رسمي بذلك حتى الآن، وسننشر أي تحديث فور صدوره عن الجهات المختصة.',
    flag: 'rumor', note: { ar: 'مرتبط بخبر غير موثّق في الرصد: لا تأكيد ولا نفي قبل البيان الرسمي.', en: 'Linked to an unverified item in Monitoring: neither confirmed nor denied until an official statement is issued.' } },
  { id: 'm8', pf: 'linkedin', lang: 'en', who: 'Hospitality group', mins: 125, intent: 'partner', mood: 'pos',
    text: "We're a local hospitality group interested in partnering on visitor campaigns. Who should we contact?",
    tr: { ar: 'نحن مجموعة ضيافة محلية ونرغب في الشراكة معكم في حملات الزوار. مع مَن نتواصل؟' },
    reply: 'Thank you for reaching out. We have passed your message to our head of media, who will be in touch with you directly.',
    flag: 'assign', note: { ar: 'فرصة شراكة: أُسندت إلى مدير الإعلام.', en: 'Partnership opportunity: assigned to the head of media.' } },
];

const KPIS = [
  { id: 'acc', ar: 'دقة المحتوى', en: 'Content accuracy', v: 98.4, unit: '%', target: '≥ 98%', good: 'up',
    src: { ar: 'تدقيق عيّنة أسبوعية بمطابقتها مع المصادر', en: 'Weekly sample audited against sources' }, series: [96.1, 96.8, 97.2, 97.0, 97.9, 98.1, 98.0, 98.4] },
  { id: 'tat', ar: 'زمن الإعداد', en: 'Turnaround', v: 41, unit: { ar: ' د', en: ' min' }, target: { ar: '≤ 60 د', en: '≤ 60 min' }, good: 'down',
    src: { ar: 'الزمن من رصد الحدث حتى نشره: سجل الحوكمة', en: 'Time from detection to publication: governance log' }, series: [180, 150, 95, 80, 62, 55, 48, 41] },
  { id: 'apr', ar: 'الاعتماد من المرة الأولى', en: 'First-pass approval', v: 86, unit: '%', target: '≥ 80%', good: 'up',
    src: { ar: 'قرارات الاعتماد في سجل الحوكمة', en: 'Approval decisions in the governance log' }, series: [61, 66, 70, 74, 79, 82, 84, 86] },
  { id: 'rsp', ar: 'زمن الرد على الرسائل', en: 'Reply time', v: 22, unit: { ar: ' د', en: ' min' }, target: { ar: '≤ 30 د', en: '≤ 30 min' }, good: 'down',
    src: { ar: 'صندوق التفاعل', en: 'Engagement inbox' }, series: [95, 80, 64, 51, 40, 33, 27, 22] },
  { id: 'eng', ar: 'معدل التفاعل', en: 'Engagement rate', v: 3.6, unit: '%', target: '≥ 3%', good: 'up',
    src: { ar: 'واجهة برمجة إنستغرام (لا يتيح لينكدإن هذا المؤشر لحساباتنا)', en: 'Instagram API (LinkedIn does not expose it for our accounts)' }, series: [2.1, 2.4, 2.3, 2.9, 3.1, 3.0, 3.4, 3.6] },
];

/* Sample peer benchmarks and A/B results (illustrative, labelled as sample data in the UI) */
const PEERS = [
  { x: { ar: 'أ', en: 'A' }, best: '20:30', eng: 4.1 },
  { x: { ar: 'ب', en: 'B' }, best: '08:00', eng: 2.7 },
  { x: { ar: 'ج', en: 'C' }, best: '21:00', eng: 3.4 },
];
const AB = { a: 4.2, b: 2.9 };
const NEG_SHARE = { series: [6, 5, 7, 6, 8, 7, 9, 8, 11, 9, 8, 7], threshold: 25 };
