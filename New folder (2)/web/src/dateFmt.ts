// Manual uz/ru date formatting. Intl.DateTimeFormat's 'uz-UZ' locale data is
// spotty across browsers/ICU builds (falls back to things like "M09 9, WED"),
// so month/weekday names are spelled out here instead of trusted to Intl.
import { Lang } from './i18n';

const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];
// Genitive case, as used after a day number in Russian ("9 сентября").
const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const WEEKDAYS_UZ = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const WEEKDAYS_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function parts(dateIso: string) {
  const d = new Date(dateIso);
  return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), weekday: d.getDay() };
}

/** "9-sentyabr, chorshanba" / "9 сентября, среда" */
export function formatLongDateWithWeekday(dateIso: string, lang: Lang) {
  const { day, month, weekday } = parts(dateIso);
  if (lang === 'ru') return `${day} ${MONTHS_RU[month]}, ${WEEKDAYS_RU[weekday]}`;
  return `${day}-${MONTHS_UZ[month]}, ${WEEKDAYS_UZ[weekday]}`;
}

/** "9-sentyabr 2026" / "9 сентября 2026 г." */
export function formatDate(dateIso: string, lang: Lang) {
  const { day, month, year } = parts(dateIso);
  if (lang === 'ru') return `${day} ${MONTHS_RU[month]} ${year} г.`;
  return `${day}-${MONTHS_UZ[month]} ${year}`;
}

/** "9-sentyabrdan a'zo" / "Участник с 9 сентября 2026 г." */
export function formatMemberSince(dateIso: string, lang: Lang) {
  const { day, month, year } = parts(dateIso);
  if (lang === 'ru') return `Участник с ${day} ${MONTHS_RU[month]} ${year} г.`;
  return `${day}-${MONTHS_UZ[month]}dan a'zo`;
}
