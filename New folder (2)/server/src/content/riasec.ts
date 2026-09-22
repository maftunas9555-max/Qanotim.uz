// Stage 2 of "Kasb yo'nalishi": John Holland's RIASEC model — the world's
// most widely used career-interest framework (the basis of O*NET's Interest
// Profiler and most professional career-guidance instruments). Each question
// keeps the same 4-option format as the rest of the app; across the 10
// questions all six types appear a roughly equal number of times.
export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecQuestion {
  q: string;
  options: { label: string; type: RiasecType }[];
}

export const RIASEC_QUESTIONS: RiasecQuestion[] = [
  {
    q: 'Ish joyida sizni eng ko\'p nima band qiladi?',
    options: [
      { label: "Qo'l bilan biror narsa qurish yoki tuzatish", type: 'R' },
      { label: 'Muammoni tahlil qilib, sababini topish', type: 'I' },
      { label: 'Yangi g\'oya yoki asar yaratish', type: 'A' },
      { label: 'Odamlarga yordam berish, ularni tinglash', type: 'S' },
    ],
  },
  {
    q: "Bo'sh vaqtingizda ko'proq nima qilishni yoqtirasiz?",
    options: [
      { label: 'Kitob o\'qish, jumboq yechish, izlanish', type: 'I' },
      { label: 'Rasm chizish, musiqa, yozish', type: 'A' },
      { label: 'Do\'stlar bilan davra qurish, tadbir tashkil qilish', type: 'E' },
      { label: 'Uy-ro\'zg\'or yoki shaxsiy arxivni tartibga solish', type: 'C' },
    ],
  },
  {
    q: 'Jamoada sizga qaysi rol yoqadi?',
    options: [
      { label: 'Aniq vazifani bajaruvchi ijrochi', type: 'R' },
      { label: 'Kontsepsiya yoki dizaynni yaratuvchi', type: 'A' },
      { label: 'Jamoani ilhomlantiruvchi, yo\'naltiruvchi lider', type: 'E' },
      { label: 'Rejalarni hujjatlashtiruvchi, tartibga soluvchi', type: 'C' },
    ],
  },
  {
    q: 'Qanday muhitda ishlash sizga ko\'proq yoqadi?',
    options: [
      { label: 'Ochiq havoda yoki qo\'l mehnati talab qiladigan muhit', type: 'R' },
      { label: 'Erkin, tadqiqotga yo\'naltirilgan muhit', type: 'I' },
      { label: 'Insonlar bilan doimiy muloqotdagi muhit', type: 'S' },
      { label: 'Tartibli, qoidalarga asoslangan tizim', type: 'C' },
    ],
  },
  {
    q: 'Qaysi ko\'nikma sizga tabiiy keladi?',
    options: [
      { label: 'Texnik yoki amaliy ko\'nikmalar', type: 'R' },
      { label: 'Mantiqiy fikrlash va tadqiq qilish', type: 'I' },
      { label: 'Boshqalarni tushunish va qo\'llab-quvvatlash', type: 'S' },
      { label: 'Odamlarni ishontirish va muzokara olib borish', type: 'E' },
    ],
  },
  {
    q: 'Muvaffaqiyatli loyihada odatda sizning hissangiz qanday bo\'lgan?',
    options: [
      { label: 'Amaliy ishni sifatli bajargansiz', type: 'R' },
      { label: 'Original yechim yoki dizayn taklif qilgansiz', type: 'A' },
      { label: 'Jamoani muvofiqlashtirib, natijaga yetaklagansiz', type: 'E' },
      { label: 'Ma\'lumot va hisobotlarni tartibga solgansiz', type: 'C' },
    ],
  },
  {
    q: 'Qaysi mavzu sizni ko\'proq qiziqtiradi?',
    options: [
      { label: 'Fan, kashfiyot, tadqiqot', type: 'I' },
      { label: 'San\'at, dizayn, ijod', type: 'A' },
      { label: 'Insonlar, jamiyat, ta\'lim', type: 'S' },
      { label: 'Biznes, tashkilot, rahbarlik', type: 'E' },
    ],
  },
  {
    q: 'Hujjat va tartib-intizom haqida fikringiz qanday?',
    options: [
      { label: 'Qo\'l bilan ishlaganda hujjat kerak emas, natija muhim', type: 'R' },
      { label: 'Kerak, lekin ijodkorlikni cheklamasligi kerak', type: 'A' },
      { label: 'Muhim emas, asosiysi odamlar bilan aloqa', type: 'S' },
      { label: 'Aniq tartib va reglament menga yoqadi', type: 'C' },
    ],
  },
  {
    q: 'Qaysi vazifa sizni ko\'proq qoniqtiradi?',
    options: [
      { label: 'Biror narsani jismonan yasab, natijasini ko\'rish', type: 'R' },
      { label: 'Insonga to\'g\'ridan-to\'g\'ri yordam berish', type: 'S' },
      { label: 'Yangi loyiha yoki bitim uchun tashabbus ko\'rsatish', type: 'E' },
      { label: 'Raqamlar yoki ma\'lumotlarni aniq tartibga solish', type: 'C' },
    ],
  },
  {
    q: 'Kelajakdagi ishingizda sizga eng muhimi nima?',
    options: [
      { label: 'Haqiqatni yoki yangi bilimni topish', type: 'I' },
      { label: 'O\'zimni erkin ifodalay olish', type: 'A' },
      { label: 'Natija va yutuqqa erishish', type: 'E' },
      { label: 'Barqarorlik va aniq tizim ichida ishlash', type: 'C' },
    ],
  },
];

export const RIASEC_INFO: Record<
  RiasecType,
  { name: string; title: string; desc: string; steps: string[] }
> = {
  R: {
    name: 'Realistik',
    title: 'Amaliy va qo\'l mehnati yo\'nalishi',
    desc: 'Siz aniq, ko\'rinadigan natija beradigan, qo\'l yoki texnik mahorat talab qiladigan ishlarda kuchlisiz. Qurilish, texnika, sport, oshpazlik, tibbiy amaliyot kabi sohalar sizga mos.',
    steps: [
      'Amaliy mahorat talab qiladigan kichik loyiha yoki hunar bilan mashq qiling',
      'Qiziqqan texnik yo\'nalish bo\'yicha qisqa kurs yoki sertifikat oling',
      'Shu sohadagi ustoz yoki mentor bilan bog\'laning',
    ],
  },
  I: {
    name: 'Tadqiqotchi',
    title: 'Tahlil va tadqiqot yo\'nalishi',
    desc: 'Siz savol berish, tekshirish va faktlarga asoslangan xulosa chiqarishni yaxshi ko\'rasiz. Ilm-fan, tahlilchilik, IT, tibbiyot tadqiqotlari kabi sohalar mos keladi.',
    steps: [
      'Qiziqtirgan mavzuda mustaqil kichik tadqiqot boshlang',
      'Ma\'lumot bilan ishlash (tahlil, statistika) ko\'nikmasini mashq qiling',
      'Natijalaringizni yozma yoki og\'zaki taqdim etishni mashq qiling',
    ],
  },
  A: {
    name: 'Badiiy',
    title: 'Ijodiy yo\'nalish — dizayn va kontent',
    desc: 'G\'oyalarni vizual, og\'zaki yoki musiqiy shaklda ifodalash sizga tabiiy keladi. Dizayn, kontent yaratish, arxitektura, brending sohalari mos keladi.',
    steps: [
      'Kichik ijodiy loyiha bilan boshlang',
      'Portfolio to\'plang va ulashing',
      'Sohadagi hamkasblar bilan tanishing',
    ],
  },
  S: {
    name: 'Ijtimoiy',
    title: 'Yordam va inson bilan ishlash yo\'nalishi',
    desc: 'Siz insonlarga g\'amxorlik qilish, o\'rgatish va ularning hayotini yaxshilashdan kuch olasiz. Ta\'lim, salomatlik, psixologiya, ijtimoiy soha mos keladi.',
    steps: [
      'Volontyorlik yoki mentorlik orqali tajriba to\'plang',
      'Muloqot va faol tinglash ko\'nikmalarini rivojlantiring',
      'O\'z ta\'sir doirangizni asta kengaytiring',
    ],
  },
  E: {
    name: 'Tadbirkor',
    title: 'Yetakchilik va tadbirkorlik yo\'nalishi',
    desc: 'Siz odamlarni birlashtirish, ishontirish va natijaga olib borishda kuchlisiz. Loyiha boshqaruvi, sotuv, tadbirkorlik, jamoa yetakchiligi mos keladi.',
    steps: [
      'Kichik jamoada yoki loyihada boshchilik tajribasi oling',
      'Muzokara va qaror qabul qilish ko\'nikmasini mashq qiling',
      'Mentordan qo\'llab-quvvatlash so\'rang',
    ],
  },
  C: {
    name: 'Konvensional',
    title: 'Tartib va tizim yo\'nalishi',
    desc: 'Siz aniqlik, tartib va ishonchli tizimlar qurishda kuchlisiz. Moliya, buxgalteriya, loyiha administratsiyasi, sifat nazorati sohalari mos keladi.',
    steps: [
      'Tartib va rejalashtirish talab qiladigan vazifani o\'z zimmangizga oling',
      'Moliyaviy yoki tashkiliy vositalarni chuqurroq o\'rganing',
      'Aniqlik talab qiladigan sertifikat dasturini ko\'rib chiqing',
    ],
  },
};

export function riasecCode(scores: Record<RiasecType, number>): [RiasecType, RiasecType] {
  const order = (Object.entries(scores) as [RiasecType, number][]).sort((a, b) => b[1] - a[1]);
  return [order[0][0], order[1][0]];
}
