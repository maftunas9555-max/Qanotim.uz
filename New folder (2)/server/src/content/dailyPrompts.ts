// A small daily-rotating bank of action-oriented questions, one set per
// coaching pattern (see content/coaching.ts PATTERN_INFO), shown once a day
// on Home once the user has a coaching result — a lightweight, reliable
// alternative to calling Gemini fresh every single day for this.
import type { PatternTag } from './coaching.js';

type Lang = 'uz' | 'ru';

export const DAILY_PROMPTS: Record<Exclude<PatternTag, 'S'>, Record<Lang, string[]>> = {
  P: {
    uz: [
      "Bugun bitta ishni 'yetarlicha yaxshi' darajasida tugatib, uni qayta ko'rib chiqmasdan qoldirib ko'rasizmi?",
      "Boshlashdan cho'chib turgan bitta vazifangizga bugun faqat 10 daqiqa bag'ishlasangiz, u nima bo'lardi?",
      "Agar bugun 'mukammal' so'zini ro'yxatingizdan olib tashlasangiz, nimani boshqacha qilardingiz?",
      "Kecha yoki bugun o'zingizni ayblagan bitta narsani eslang — do'stingizga aytardingizmi buni?",
      "Bugun tugallanmagan bitta ishni ataylab 'tugallangan' deb e'lon qilib ko'rasizmi?",
      "Nima uchun aynan hozir mukammallik sizga xavfsizlik tuyg'usini berayotgandek tuyuladi?",
      "Bugun kimdandir yordam so'rashga jur'at qilsangiz, nima o'zgarardi?",
      "Bugun bir ishni qilib, natijasini ko'rsatmasdan ham o'zingizni yaxshi his qila olasizmi?",
    ],
    ru: [
      "Сможете ли вы сегодня завершить одно дело на уровне 'достаточно хорошо' и не переделывать его?",
      "Что будет, если сегодня вы посвятите задаче, которую боитесь начать, всего 10 минут?",
      "Что бы вы сделали иначе сегодня, если бы убрали слово 'идеально' из списка требований к себе?",
      "Вспомните, в чём вы себя вчера или сегодня укоряли — сказали бы вы это другу?",
      "Готовы ли вы сегодня намеренно назвать одно незавершённое дело 'завершённым'?",
      "Почему именно сейчас стремление к идеалу кажется вам источником безопасности?",
      "Что изменится, если сегодня вы решитесь попросить кого-то о помощи?",
      "Сможете ли вы сегодня сделать что-то, не показывая результат никому?",
    ],
  },
  M: {
    uz: [
      "Bugun kimgadir 'yo'q' deb aytish imkoni bo'lsa, birinchi kim xayolingizga keladi?",
      "Oxirgi marta o'z fikringizni to'liq aytolmagan payt qachon edi? Bugun shu fikrni birovga aytib ko'rasizmi?",
      "Bugun kimningdir noroziligidan qo'rqmasdan, o'z chegarangizni belgilab ko'rasizmi?",
      "Nega boshqalarning xafa bo'lishi sizga o'zingizning xafa bo'lishingizdan ham og'irroq tuyuladi?",
      "Bugun 'ha' deyishdan oldin, o'zingizdan 'men buni chindan xohlaymanmi?' deb so'raysizmi?",
      "Kimningdir sizdan norozi bo'lishi, lekin siz o'zingizga sodiq qolishingiz mumkin bo'lgan bitta vaziyatni tasavvur qiling.",
      "Bugun kichik bir qarorni faqat o'zingiz uchun, boshqalarni o'ylamasdan qabul qilib ko'rasizmi?",
      "Agar hech kim xafa bo'lmasligi kafolatlangan bo'lsa, bugun nimani boshqacha aytardingiz?",
    ],
    ru: [
      "Если бы сегодня можно было кому-то сказать 'нет', кто первым приходит на ум?",
      "Когда вы в последний раз не смогли до конца высказать своё мнение? Скажете его сегодня?",
      "Сможете ли вы сегодня обозначить свою границу, не боясь чьего-то недовольства?",
      "Почему недовольство других кажется вам тяжелее собственного расстройства?",
      "Перед тем как сказать 'да' сегодня, спросите себя: 'я правда этого хочу?'",
      "Представьте ситуацию, где кто-то будет недоволен вами, но вы останетесь верны себе.",
      "Сможете ли вы сегодня принять маленькое решение только для себя, не думая о других?",
      "Что бы вы сказали иначе сегодня, если бы никто точно не обиделся?",
    ],
  },
  C: {
    uz: [
      "Bugun hech kimga hisob bermasdan, faqat o'zingiz uchun 20 daqiqa vaqt topsangiz, nima qilardingiz?",
      "Oxirgi marta charchaganingizni ochiq aytgan payt qachon edi?",
      "Bugun 'hammasi yaxshi' demasdan, chindan qanday his qilayotganingizni yozib ko'rasizmi?",
      "Sabr qilish o'rniga, bugun kichik bir yordam so'rasangiz, nima o'zgarardi?",
      "Bugun tanangiz sizga nima demoqchi — charchoqmi, ochlikmi, dam olish kerakmi?",
      "Kimdir sizdan 'yaxshimisiz?' deb so'rasa, bugun rostini aytib ko'rasizmi?",
      "Bugun bitta mas'uliyatni boshqasiga topshirib, o'zingizga nafas oldirsangiz-chi?",
      "Charchoq belgisi paydo bo'lganda, siz odatda nima qilasiz — to'xtaysizmi yoki davom etasizmi?",
    ],
    ru: [
      "Что бы вы сделали сегодня, если бы нашли 20 минут только для себя, никому не отчитываясь?",
      "Когда вы в последний раз открыто сказали, что устали?",
      "Сможете ли вы сегодня записать, что чувствуете на самом деле, вместо привычного 'всё хорошо'?",
      "Что изменится, если сегодня вместо терпения вы попросите о небольшой помощи?",
      "Что сегодня говорит вам тело — усталость, голод, потребность в отдыхе?",
      "Если кто-то спросит 'как ты?', скажете ли вы сегодня правду?",
      "Что если сегодня вы передадите одну обязанность кому-то ещё и дадите себе выдохнуть?",
      "Когда приходит усталость, вы обычно останавливаетесь или продолжаете через силу?",
    ],
  },
};

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function todaysPrompt(pattern: Exclude<PatternTag, 'S'>, lang: string): string {
  const list = DAILY_PROMPTS[pattern][lang === 'ru' ? 'ru' : 'uz'];
  return list[dayOfYear(new Date()) % list.length];
}
