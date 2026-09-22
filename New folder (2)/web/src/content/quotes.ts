// Rotates once per day (same quote for everyone on a given date), picked
// deterministically from the date so it doesn't need any server round-trip.
export interface Quote {
  uz: string;
  ru: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { uz: "Har kichik qadam — katta o'zgarishning boshlanishi.", ru: 'Каждый маленький шаг — начало больших перемен.', author: 'Lao Tzu' },
  { uz: "Kim bo'lishni xohlasangiz, hoziroq shunday bo'lishga harakat qiling.", ru: 'Начните быть тем, кем вы хотите стать, прямо сейчас.', author: 'Rumiy' },
  { uz: "Muvaffaqiyat yakuniy emas, muvaffaqiyatsizlik halokatli emas — davom etish jasorati muhim.", ru: 'Успех не окончателен, неудача не фатальна — важна смелость продолжать.', author: 'Winston Churchill' },
  { uz: "O'zingizga ishoning va bilingki, siz o'zingiz o'ylagandan ham kuchlisiz.", ru: 'Верьте в себя и знайте, что вы сильнее, чем думаете.', author: 'Christian D. Larson' },
  { uz: "Kelajakni bashorat qilishning eng yaxshi yo'li — uni yaratishdir.", ru: 'Лучший способ предсказать будущее — создать его.', author: 'Abraham Lincoln' },
  { uz: "Sizning vaqtingiz cheklangan, shuning uchun uni boshqa birovning hayotini yashab sarflamang.", ru: 'Ваше время ограничено, не тратьте его, живя чужой жизнью.', author: 'Steve Jobs' },
  { uz: "Men muvaffaqiyatsizlikka uchramadim. Shunchaki ishlamaydigan 10 000 usulni topdim.", ru: 'Я не терпел неудачу. Я просто нашёл 10 000 способов, которые не работают.', author: 'Thomas Edison' },
  { uz: "Kuch g'alabadan kelmaydi. Sizning kurashlaringiz sizga bardoshni rivojlantiradi.", ru: 'Сила приходит не от побед. Ваши трудности развивают вашу выносливость.', author: 'Arnold Schwarzenegger' },
  { uz: "Bilim — bu kuch, lekin xarakter undan ham muhimroq.", ru: 'Знание — сила, но характер важнее.', author: 'Alber Eynshteyn' },
  { uz: "Hech qachon kech emas, siz xohlagan kishi bo'lish uchun.", ru: 'Никогда не поздно стать тем, кем вы хотите быть.', author: 'George Eliot' },
  { uz: "Yurak bilan qilingan har bir ish — go'zallik yaratadi.", ru: 'Всё, что делается от сердца, создаёт красоту.', author: 'Rabindranat Tagor' },
  { uz: "Siz kutgan o'zgarishning o'zi bo'ling.", ru: 'Будьте той переменой, которую хотите видеть в мире.', author: 'Mahatma Gandi' },
  { uz: "Qiyinchiliklar sizni yiqitish uchun emas, sizni tanib olish uchun keladi.", ru: 'Трудности приходят не чтобы сломить вас, а чтобы раскрыть вас.', author: "Anonim, sharqona hikmat" },
  { uz: "Kichik boshlanishlardan qo'rqmang, katta narsalarning barchasi kichikdan boshlangan.", ru: 'Не бойтесь маленьких начинаний — всё великое начиналось с малого.', author: 'Laoszi' },
  { uz: "O'zingizga mehribon bo'ling — siz eng yaxshisini qilyapsiz, buni bilaman.", ru: 'Будьте добры к себе — вы делаете всё возможное, я знаю это.', author: 'Maya Anjelou' },
  { uz: "Sabr achchiq, lekin uning mevasi shirin.", ru: 'Терпение горько, но плод его сладок.', author: 'Aristotel' },
  { uz: "Har bir kun — yangidan boshlash imkoniyati.", ru: 'Каждый день — это возможность начать заново.', author: "Anonim" },
  { uz: "O'z-o'zingizni bilish — barcha donolikning boshlanishidir.", ru: 'Познание себя — начало всей мудрости.', author: 'Aristotel' },
  { uz: "Ishonch — bu manzilni bilmasdan turib ham birinchi qadamni tashlash.", ru: 'Вера — это первый шаг, даже когда вы не видите всей лестницы.', author: 'Martin Lyuter King' },
  { uz: "Hayotingizni o'zgartirish uchun avval fikringizni o'zgartiring.", ru: 'Чтобы изменить жизнь, сначала измените мысли.', author: 'Norman Vinsent Pil' },
];

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function todaysQuote(): Quote {
  const idx = dayOfYear(new Date()) % QUOTES.length;
  return QUOTES[idx];
}
