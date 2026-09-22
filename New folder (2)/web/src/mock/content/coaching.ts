// The 10 adaptive coaching questions, ported verbatim from the approved design
// (chats/chat1.md). Each option is tagged with the psychological pattern it
// signals: P = perfectionism, M = people-pleasing/conforming to others,
// C = quiet exhaustion/self-neglect, S = a named strength.
export type PatternTag = 'P' | 'M' | 'C' | 'S';

export interface CoachingQuestion {
  q: string;
  options: string[];
  tags: PatternTag[];
}

export const COACHING_QUESTIONS: CoachingQuestion[] = [
  {
    q: "Kun oxirida sizni nima ko'proq charchatadi?",
    options: [
      'Kun davomida qilingan tinimsiz, jismoniy mehnat.',
      'Qilishga ulgurmay qolgan muhim ishlarimning yuki va vijdoni azobi.',
      "Boshqalarning ko'ngliga qarash va umidlarini oqlashga urinish.",
      "Bugun ham o'zimning haqiqiy orzularimga vaqt ajratmaganimni anglash.",
    ],
    tags: ['C', 'P', 'M', 'C'],
  },
  {
    q: "Agar bugun tunda xotirangiz o'chib qolsa-yu, ertalab o'zingiz haqingizda faqat bitta narsani eslay olsangiz, u nima bo'lardi?",
    options: [
      'Yaqinlarim, oilam kimligi.',
      'Qanday qobiliyatga, iqtidorga ega ekanligim.',
      'Hayotdagi eng katta maqsadim nima ekanligi.',
      "O'zimning qanday inson ekanligim (xarakterim, qadriyatlarim).",
    ],
    tags: ['M', 'S', 'S', 'S'],
  },
  {
    q: 'Odatda biror muhim ishni (yoki loyihani) eng oxirgi daqiqagacha paysalga solsangiz, buning haqiqiy sababi nima bo\'ladi?',
    options: [
      'Ishning zerikarli yoki juda uzoq davom etishi.',
      "Uni mukammal bajara olmaslik qo'rquvi (Perfeksionizm).",
      'Boshqa "tezkor" kundalik muammolar diqqatimni chalg\'itib qo\'yishi.',
      'Bu ish aslida menga emas, boshqalarga kerakligini ich-ichimdan bilishim.',
    ],
    tags: ['C', 'P', 'C', 'M'],
  },
  {
    q: "O'zingiz bilan ko'zgu oldida yolg'iz qolganda, nigohingizda ko'pincha qaysi tuyg'uni ko'rasiz?",
    options: [
      'Charchoq va dam olishga bo\'lgan ehtiyoj.',
      'Hali amalga oshmagan ulkan salohiyat va uchqun.',
      'Tashvish va ertangi kunga bo\'lgan xavotir.',
      "O'zimga nisbatan qattiqqo'llik va talabchanlik.",
    ],
    tags: ['C', 'S', 'C', 'P'],
  },
  {
    q: "Tasavvur qiling, uzoq bir orolga ketib qoldingiz. Hech qanday majburiyat, uy ishlari, qoidalar yo'q. Uchinchi kuni nima qila boshlardingiz?",
    options: [
      "O'zim uchun nimadir yangi narsa yaratishni, qurishni yoki yozishni.",
      'Orolni o\'rganishni va yangi narsalarni kashf qilishni.',
      "Uydagilarni va o'zimning odatiy yumushlarimni sog'ina boshlardim.",
      "Faqat uxlar, yotar va hech narsa haqida o'ylamaslikda davom etardim.",
    ],
    tags: ['S', 'S', 'M', 'C'],
  },
  {
    q: "Hayotingizdagi eng og'ir damlar va xatolaringiz sizga asosan nimani o'rgatdi?",
    options: [
      "Odamlarga ko'r-ko'rona ishonmaslikni.",
      'Har qanday vaziyatdan ham chiqib keta oladigan kuchim borligini.',
      "Hamma narsa o'tkinchi ekanligini, asabiylashishga arzimasligini.",
      "O'zimni va tuyg'ularimni e'tiborsiz qoldirmaslik kerakligini.",
    ],
    tags: ['M', 'S', 'C', 'S'],
  },
  {
    q: 'Mukammal kun siz uchun qanday yakunlanadi?',
    options: [
      "Rejadagi hamma ishlar 100% tikkacha bo'lib, bajarilgan holda.",
      "Uyda tinchlik, yaqinlarimning minnatdor va xotirjam tabassumi bilan.",
      "O'zimning shaxsiy ustimda ishlab, ko'zga ko'rinarli qadam tashlaganimni his qilib.",
      "Barcha tashvishlarni esdan chiqarib, miyam to'liq dam olgan holda.",
    ],
    tags: ['P', 'M', 'S', 'C'],
  },
  {
    q: 'Kimdir sizni haksiz tanqid qilsa yoki qadringizga yetmasa, ichki holatingiz qanday bo\'ladi?',
    options: [
      "Qattiq g'azablanaman va o'zimni himoya qilishga, isbotlashga tushaman.",
      'Tashqaridan indamayman-u, kun bo\'yi shu gapni ichimda chaynab, ezilaman.',
      'Aybni o\'zimdan qidirib, rostdan ham shundaymikan, deb ikkilana boshlayman.',
      'Tabassum qilaman, bu ularning shaxsiy ongsiz muammosi ekanligini tushunaman.',
    ],
    tags: ['P', 'M', 'P', 'S'],
  },
  {
    q: "Hoziroq qo'lingizda bitta sehrli tayoqcha paydo bo'lsa-yu, faqatgina bitta narsani o'zgartira olsa, nimani tanlardingiz?",
    options: [
      "Moddiy va maishiy muammolarning to'liq hal bo'lishini.",
      'Atrofimdagi muhit va odamlarning menga munosabati o\'zgarishini.',
      "Ichimdagi barcha qo'rquv, ikkilanish va o'zimni ayblash hissi butunlay yo'qolishini.",
      'Kunimga qo\'shimcha 5 soatlik vaqt berilishini.',
    ],
    tags: ['C', 'M', 'P', 'C'],
  },
  {
    q: "10 yildan keyingi siz bugungi sizga bitta xat yozsa, uning asosiy jumlasi qaysi bo'lardi?",
    options: [
      '"Iltimos, o\'zingni buncha qiynab, mukammallikka intilaverma, biroz yasha."',
      '"Rahmat senga! O\'sha tavakkalni qilib, o\'z yo\'lingni tanlaganing uchun."',
      '"Boshqalarni rozi qilaman deb, ichingdagi iste\'dodni so\'ndirganing qanday yomon bo\'ldi."',
      '"Sabr qil, bu qiyin kunlarning hammasi o\'tib ketadi."',
    ],
    tags: ['P', 'S', 'M', 'C'],
  },
];

export const PATTERN_INFO: Record<
  Exclude<PatternTag, 'S'>,
  { title: string; body: (quote: string) => string }
> = {
  P: {
    title: "Yaratuvchi va Perfeksionizm tuzog'i",
    body: (quote) =>
      `Sizda kuchli ichki standart va o'z ishingizni mukammal qilishga bo'lgan intilish bor. Bu ajoyib fazilat, ammo ayni shu intilish ko'pincha ishni boshlashdan cho'chishga va "${quote}" kabi holatlarga olib keladi. Natijada bajarilmagan ishlarning yuki jismoniy charchoqdan ham ko'proq og'irlik qiladi.`,
  },
  M: {
    title: 'Muhit bosimi va ichki kurash',
    body: (quote) =>
      `Siz boshqalarning kutganlariga mos kelishga, ularni xafa qilmaslikka katta ahamiyat berasiz. Bu ko'pincha o'z ovozingizni ichingizga yutib, "${quote}" holatida qolishga olib keladi — vaqt o'tishi bilan katta hissiy charchoqqa aylanadi.`,
  },
  C: {
    title: 'Sukunatdagi charchoq',
    body: (quote) =>
      `Siz og'ir kunlarga chidashni, "${quote}" deb o'zingizni ovutishni yaxshi bilasiz. Ammo sabr har doim yechim emas — ba'zan bu shunchaki charchoqni ko'rinmas qilib turadi, xolos.`,
  },
};

export const COACH_OPENERS: Record<Exclude<PatternTag, 'S'>, string> = {
  P: 'Aytingchi — agar bugun o\'zingizga "mukammal emas, shunchaki tugallangan" bo\'lishga ruxsat bersangiz, birinchi qadamingiz nima bo\'lardi?',
  M: "Aytingchi — oxirgi marta o'zingizning haqiqiy fikringizni aytishdan tortinib, jim qolgan payt qachon edi? O'shanda nima his qildingiz?",
  C: 'Aytingchi — agar bugun hech kimga hisob bermasdan, faqat o\'zingiz uchun bir soat vaqt topsangiz, uni nimaga sarflardingiz?',
};
