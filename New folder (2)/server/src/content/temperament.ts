// Stage 1 of "Kasb yo'nalishi": the classical four-temperament model
// (Hippocrates/Galen — choleric, sanguine, phlegmatic, melancholic), one of
// the oldest and most widely recognized personality frameworks.
export type Temperament = 'X' | 'S' | 'F' | 'M';

export interface TemperamentQuestion {
  q: string;
  options: { label: string; type: Temperament }[];
}

export const TEMPERAMENT_QUESTIONS: TemperamentQuestion[] = [
  {
    q: "Muammo yuzaga kelganda birinchi bo'lib nima qilasiz?",
    options: [
      { label: "Tezda harakatga o'taman", type: 'X' },
      { label: 'Odamlar bilan muhokama qilaman', type: 'S' },
      { label: 'Vaziyatni kutib, tinch tahlil qilaman', type: 'F' },
      { label: "Chuqur o'ylab, batafsil reja tuzaman", type: 'M' },
    ],
  },
  {
    q: 'Bo\'sh vaqtingizni qanday o\'tkazishni afzal ko\'rasiz?',
    options: [
      { label: "Faol mashg'ulot yoki musobaqa", type: 'X' },
      { label: "Do'stlar bilan uchrashish", type: 'S' },
      { label: 'Yolg\'iz, tinch muhitda dam olish', type: 'F' },
      { label: 'Kitob o\'qish yoki ijod bilan', type: 'M' },
    ],
  },
  {
    q: 'Boshqalar sizni qanday tasvirlaydi?',
    options: [
      { label: "Qat'iyatli va tezkor", type: 'X' },
      { label: 'Quvnoq va ochiq', type: 'S' },
      { label: 'Sabr-toqatli va barqaror', type: 'F' },
      { label: 'Chuqur his qiluvchi va sezgir', type: 'M' },
    ],
  },
  {
    q: 'Stress paytida odatda qanday reaksiya berasiz?',
    options: [
      { label: "G'azablanaman, lekin tez o'taman", type: 'X' },
      { label: 'Boshqalarga gapirib yengillashaman', type: 'S' },
      { label: 'Ichimga yutib, sekin tinchlanaman', type: 'F' },
      { label: "Uzoq vaqt o'ylab yuraman", type: 'M' },
    ],
  },
];

export const TEMPERAMENT_INFO: Record<Temperament, { title: string; desc: string }> = {
  X: { title: 'Xolerik', desc: "Siz tezkor, qat'iyatli va harakatga yo'naltirilgan shaxssiz. Qiyinchiliklardan qo'rqmaysiz." },
  S: { title: 'Sangvinik', desc: 'Siz quvnoq, ochiq va odamlar bilan ishlashni yoqtiradigan shaxssiz.' },
  F: { title: 'Flegmatik', desc: "Siz sabr-toqatli, barqaror va o'ylab ish qiladigan shaxssiz." },
  M: { title: 'Melanxolik', desc: "Siz chuqur his qiluvchi, tafsilotlarga e'tiborli va ijodiy shaxssiz." },
};
