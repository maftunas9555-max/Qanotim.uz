// In-memory stand-in for the real Express API, used only by the standalone
// demo build (window.__QN_MOCK__ = true). Lets the exact same UI components
// run from a single offline HTML file with no server — nothing here is used
// in the real app.
import { COACHING_QUESTIONS, PATTERN_INFO, type PatternTag } from './content/coaching';
import { TEMPERAMENT_QUESTIONS, TEMPERAMENT_INFO, type Temperament } from './content/temperament';
import { RIASEC_QUESTIONS, RIASEC_INFO, riasecCode, type RiasecType } from './content/riasec';

const LETTERS = ['A', 'B', 'C', 'D'];

class MockApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

interface MockUser {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
  lang: 'uz' | 'ru';
  subscriptionStart: string;
  subscriptionEnd: string;
}
interface MockGoal {
  id: string;
  text: string;
  done: boolean;
  source: string;
  recurring: boolean;
  current: number | null;
  total: number | null;
  unit: string | null;
  plan: string[] | null;
}
interface HistoryItem {
  id: string;
  text: string;
  done: boolean;
}

let currentUser: MockUser | null = null;
let goals: MockGoal[] = [];
const dailyLog: Record<string, { done: number; total: number }> = {};
const historySnapshots: Record<string, HistoryItem[]> = {};
let lastRolloverDate = todayKey();
let coachingAnswers: number[] = [];
let coachingSessionId: string | null = null;
let coachChatStarted = false;
let coachChatCount = 0;
let coachChatMessages: { role: 'user' | 'assistant'; text: string }[] = [];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seedForNewUser() {
  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  goals = [
    { id: uid(), text: 'Ertalabki 15 daqiqalik mashq', done: true, source: 'matn', recurring: false, current: null, total: null, unit: null, plan: null },
    { id: uid(), text: 'Ishga oid 1 vazifani yakunlash', done: false, source: 'matn', recurring: false, current: null, total: null, unit: null, plan: null },
  ];
  const labels = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sh', 'Ya'];
  const hist = [80, 60, 100, 40, 90, 70];
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyLog[d.toISOString().slice(0, 10)] = { done: hist[6 - i], total: 100 };
  }
  void labels;
  for (const key of Object.keys(historySnapshots)) delete historySnapshots[key];
  lastRolloverDate = todayKey();
  coachingAnswers = [];
  coachingSessionId = null;
  coachChatStarted = false;
  coachChatCount = 0;
  coachChatMessages = [];
  return { now, end };
}

function currentStepText(g: MockGoal): string {
  if (g.recurring && g.plan && g.current) return g.plan[g.current - 1] ?? g.text;
  return g.text;
}

function serializeGoal(g: MockGoal) {
  return {
    ...g,
    text: g.recurring ? `${currentStepText(g)} (${g.current}/${g.total})` : g.text,
    baseText: g.text,
  };
}

// Mirrors server/src/routes/goals.ts: freezes today's goals into a history
// snapshot, then advances every recurring goal forward regardless of
// whether it was completed, and archives one-off goals out of the live list.
function rolloverOneDay(dateKey: string) {
  const doneCount = goals.filter((g) => g.done).length;
  dailyLog[dateKey] = { done: doneCount, total: goals.length };
  historySnapshots[dateKey] = goals.map((g) => ({ id: g.id, text: currentStepText(g), done: g.done }));
  const remaining: MockGoal[] = [];
  for (const g of goals) {
    if (g.recurring && g.current !== null && g.total !== null) {
      if (g.current < g.total) g.current += 1;
      g.done = false;
      remaining.push(g);
    }
    // non-recurring goals are archived into history, not carried forward
  }
  goals = remaining;
}

function rollover() {
  const today = todayKey();
  if (lastRolloverDate >= today) return;
  const cursor = new Date(lastRolloverDate + 'T00:00:00Z');
  const todayDate = new Date(today + 'T00:00:00Z');
  for (let i = 0; i < 60 && cursor < todayDate; i++) {
    rolloverOneDay(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  lastRolloverDate = today;
}

function requireAuth() {
  if (!currentUser) throw new MockApiError(401, 'not_authenticated');
  return currentUser;
}

function computeAnalysis(answers: number[], userName: string) {
  const counts: Record<PatternTag, number> = { P: 0, M: 0, C: 0, S: 0 };
  const cites: Record<PatternTag, { label: string; text: string }[]> = { P: [], M: [], C: [], S: [] };
  answers.forEach((optIdx, i) => {
    const tag = COACHING_QUESTIONS[i].tags[optIdx];
    counts[tag]++;
    cites[tag].push({ label: `${i + 1}${LETTERS[optIdx]}`, text: COACHING_QUESTIONS[i].options[optIdx] });
  });
  const deficitOrder: Exclude<PatternTag, 'S'>[] = ['P', 'M', 'C'];
  deficitOrder.sort((a, b) => counts[b] - counts[a]);
  const mainTag = deficitOrder[0];
  const secondTag = deficitOrder[1];
  const mkPara = (tag: Exclude<PatternTag, 'S'>) => {
    const c = cites[tag];
    const citeStr = c.map((x) => x.label).join(', ');
    return { title: `${PATTERN_INFO[tag].title} (${citeStr})`, body: PATTERN_INFO[tag].body(c[0].text.replace(/\.$/, '')) };
  };
  return {
    main: counts[mainTag] > 0 ? mkPara(mainTag) : null,
    second: counts[secondTag] > 0 ? mkPara(secondTag) : null,
    strengthCites: cites.S.map((x) => x.label).join(', '),
    hasStrength: cites.S.length > 0,
    conclusion: `${userName}, tahlil shuni ko'rsatadiki, sizni ko'proq band qilib turgan narsa — ${PATTERN_INFO[mainTag].title.toLowerCase()}. Bugundan boshlab kichik, "yetarlicha yaxshi" qadamlar bilan harakat qiling: mukammal emas, tugallangan ishni tanlang. Vaqt o'tishi bilan atrofingizdagilarning munosabati ham siz ko'rsatgan natija bilan birga o'zgaradi.`,
    mainKey: mainTag,
  };
}

const COACH_LINES_UZ = [
  "Buni his qilganingiz uchun rahmat — bu chindan ham muhim. Keling, shu tuyg'u qayerdan kelayotganini birga ko'rib chiqamiz. Aynan qaysi payt bu his eng kuchli bo'ladi?",
  "Tushunaman. Shu haqda o'ylaganingizda, tanangizda buni qayerda his qilasiz?",
  "Sizni tinglayapman. Agar shu vaziyatga bir qadam tashqaridan qarasangiz, o'zingizga nima maslahat bergan bo'lardingiz?",
  "Bu chindan og'ir bo'lishi mumkin. Nima sizni bugun bir oz bo'lsa ham yengil his qildirardi?",
];
const COACH_LINES_RU = [
  'Спасибо, что поделились — это действительно важно. Давайте вместе разберёмся, откуда берётся это чувство. Когда оно проявляется сильнее всего?',
  'Понимаю вас. Когда вы думаете об этом, где в теле вы это ощущаете?',
  'Я вас слушаю. Если бы вы посмотрели на эту ситуацию со стороны, что бы вы себе посоветовали?',
  'Это действительно может быть тяжело. Что сегодня помогло бы вам почувствовать себя хоть немного легче?',
];

export async function mockRequest<T>(method: string, path: string, data?: unknown): Promise<T> {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 200));

  if (path === '/health' && method === 'GET') {
    return { ok: true, googleConfigured: false, coachConfigured: true, devLoginEnabled: false, googleClientId: null } as T;
  }

  if (path === '/auth/guest' && method === 'POST') {
    const name = ((data as any)?.name as string | undefined)?.trim() || 'Mehmon';
    const { now, end } = seedForNewUser();
    currentUser = {
      id: uid(),
      name,
      email: null,
      picture: null,
      lang: 'uz',
      subscriptionStart: now.toISOString(),
      subscriptionEnd: end.toISOString(),
    };
    return { user: currentUser } as T;
  }
  if (path === '/auth/logout' && method === 'POST') {
    currentUser = null;
    return { ok: true } as T;
  }
  if (path === '/auth/me' && method === 'GET') {
    return { user: requireAuth() } as T;
  }
  if (path === '/user/lang' && method === 'PATCH') {
    const user = requireAuth();
    user.lang = (data as any)?.lang === 'ru' ? 'ru' : 'uz';
    return { user } as T;
  }

  if (path.startsWith('/goals')) {
    requireAuth();
    rollover();
  }

  if (path === '/goals' && method === 'GET') {
    return { goals: goals.map(serializeGoal) } as T;
  }
  const SPLIT: Record<string, { count: number; unit: string }> = { haftalik: { count: 7, unit: 'kun' }, oylik: { count: 30, unit: 'kun' }, yillik: { count: 12, unit: 'oy' } };
  if (path === '/goals/plan' && method === 'POST') {
    requireAuth();
    const { text, duration } = (data as any) ?? {};
    const sp = SPLIT[duration];
    if (!sp) throw new MockApiError(400, 'invalid_duration');
    const plan = Array.from({ length: sp.count }, (_, i) => `${text} — ${i + 1}-${sp.unit} uchun qadam`);
    return { plan } as T;
  }
  if (path === '/goals' && method === 'POST') {
    const { text, source } = (data as any) ?? {};
    const g: MockGoal = { id: uid(), text: String(text).trim(), done: false, source: source === 'ovoz' ? 'ovoz' : 'matn', recurring: false, current: null, total: null, unit: null, plan: null };
    goals.push(g);
    return { goal: serializeGoal(g) } as T;
  }
  if (path === '/goals/recurring' && method === 'POST') {
    const { text, duration, split, plan } = (data as any) ?? {};
    const sp = SPLIT[duration];
    if (!sp) throw new MockApiError(400, 'invalid_duration');
    const validPlan = Array.isArray(plan) && plan.length === sp.count ? (plan as string[]) : null;
    const g: MockGoal = split
      ? { id: uid(), text: String(text).trim(), done: false, source: duration, recurring: true, current: 1, total: sp.count, unit: sp.unit, plan: validPlan }
      : { id: uid(), text: String(text).trim(), done: false, source: duration, recurring: false, current: null, total: null, unit: null, plan: null };
    goals.push(g);
    return { goal: serializeGoal(g) } as T;
  }
  const deleteMatch = path.match(/^\/goals\/([^/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const idx = goals.findIndex((x) => x.id === deleteMatch[1]);
    if (idx === -1) throw new MockApiError(404, 'not_found');
    goals.splice(idx, 1);
    return undefined as T;
  }
  const toggleMatch = path.match(/^\/goals\/([^/]+)\/toggle$/);
  if (toggleMatch && method === 'PATCH') {
    const g = goals.find((x) => x.id === toggleMatch[1]);
    if (!g) throw new MockApiError(404, 'not_found');
    g.done = !g.done;
    return { goal: serializeGoal(g) } as T;
  }
  const historyGetMatch = path.match(/^\/goals\/history\/(\d{4}-\d{2}-\d{2})$/);
  if (historyGetMatch && method === 'GET') {
    const date = historyGetMatch[1];
    if (date === todayKey()) {
      return { items: goals.map((g) => ({ id: g.id, text: currentStepText(g), done: g.done })) } as T;
    }
    return { items: historySnapshots[date] ?? [] } as T;
  }
  const historyPatchMatch = path.match(/^\/goals\/history\/(\d{4}-\d{2}-\d{2})\/([^/]+)$/);
  if (historyPatchMatch && method === 'PATCH') {
    const [, date, itemId] = historyPatchMatch;
    const { done, text } = (data as any) ?? {};
    const nextText = typeof text === 'string' && text.trim() ? text.trim() : null;
    if (date === todayKey()) {
      const g = goals.find((x) => x.id === itemId);
      if (!g) throw new MockApiError(404, 'not_found');
      if (typeof done === 'boolean') g.done = done;
      if (nextText) {
        if (g.recurring && g.plan && g.current) {
          g.plan = g.plan.map((step, i) => (i === g.current! - 1 ? nextText : step));
        } else {
          g.text = nextText;
        }
      }
      return { item: { id: g.id, text: currentStepText(g), done: g.done } } as T;
    }
    const items = historySnapshots[date];
    const item = items?.find((x) => x.id === itemId);
    if (!item) throw new MockApiError(404, 'not_found');
    if (typeof done === 'boolean') item.done = done;
    if (nextText) item.text = nextText;
    return { item } as T;
  }
  if (path === '/goals/weekly' && method === 'GET') {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const isToday = i === 0;
      let pct = 0;
      let doneCount = 0;
      let totalCount = 0;
      if (isToday) {
        doneCount = goals.filter((g) => g.done).length;
        totalCount = goals.length;
        pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
      } else {
        const row = dailyLog[key];
        doneCount = row?.done ?? 0;
        totalCount = row?.total ?? 0;
        pct = row ? Math.round((row.done / row.total) * 100) : 0;
      }
      days.push({ date: key, pct, doneCount, totalCount, isToday });
    }
    return { days } as T;
  }
  if (path === '/goals/streak' && method === 'GET') {
    requireAuth();
    return { streak: 3 } as T;
  }

  if (path === '/coaching/latest' && method === 'GET') {
    const user = requireAuth();
    if (!coachingSessionId) return { session: null } as T;
    const analysis = computeAnalysis(coachingAnswers, user.name);
    const summaryRows = coachingAnswers.map((optIdx: number, i: number) => ({
      qNum: `${i + 1}. ${COACHING_QUESTIONS[i].q}`,
      answerText: `${LETTERS[optIdx]}) ${COACHING_QUESTIONS[i].options[optIdx]}`,
    }));
    const messages = coachChatMessages;
    return { session: { sessionId: coachingSessionId, analysis, summaryRows, messages } } as T;
  }
  if (path === '/coaching/questions' && method === 'GET') {
    return { questions: COACHING_QUESTIONS.map((q) => ({ q: q.q, options: q.options })) } as T;
  }
  if (path === '/coaching/submit' && method === 'POST') {
    const user = requireAuth();
    const { answers } = (data as any) ?? {};
    coachingAnswers = answers;
    coachingSessionId = uid();
    coachChatStarted = false;
    coachChatCount = 0;
    coachChatMessages = [];
    const analysis = computeAnalysis(answers, user.name);
    const summaryRows = answers.map((optIdx: number, i: number) => ({
      qNum: `${i + 1}. ${COACHING_QUESTIONS[i].q}`,
      answerText: `${LETTERS[optIdx]}) ${COACHING_QUESTIONS[i].options[optIdx]}`,
    }));
    return { sessionId: coachingSessionId, analysis, summaryRows } as T;
  }
  const startChatMatch = path.match(/^\/coaching\/([^/]+)\/start-chat$/);
  if (startChatMatch && method === 'POST') {
    const user = requireAuth();
    const lang = (data as any)?.lang || user.lang;
    if (coachChatStarted) return { messages: coachChatMessages } as T;
    coachChatStarted = true;
    const analysis = computeAnalysis(coachingAnswers, user.name);
    const openers: Record<Exclude<PatternTag, 'S'>, { uz: string; ru: string }> = {
      P: {
        uz: 'Aytingchi — agar bugun o\'zingizga "mukammal emas, shunchaki tugallangan" bo\'lishga ruxsat bersangiz, birinchi qadamingiz nima bo\'lardi?',
        ru: 'Скажите — если бы вы сегодня разрешили себе быть "не идеальной, а просто завершившей", каким был бы ваш первый шаг?',
      },
      M: {
        uz: "Aytingchi — oxirgi marta o'zingizning haqiqiy fikringizni aytishdan tortinib, jim qolgan payt qachon edi?",
        ru: 'Скажите — когда в последний раз вы промолчали, хотя хотели сказать то, что действительно думаете?',
      },
      C: {
        uz: "Aytingchi — agar bugun hech kimga hisob bermasdan, faqat o'zingiz uchun bir soat vaqt topsangiz, uni nimaga sarflardingiz?",
        ru: 'Скажите — если бы сегодня у вас появился один час только для себя, без отчёта перед кем-либо, на что бы вы его потратили?',
      },
    };
    const text = `${analysis.main ? `"${analysis.main.title.toLowerCase()}" ` : ''}${openers[analysis.mainKey][lang === 'ru' ? 'ru' : 'uz']}`;
    coachChatMessages = [{ role: 'assistant', text }];
    return { messages: coachChatMessages } as T;
  }
  const msgMatch = path.match(/^\/coaching\/([^/]+)\/message$/);
  if (msgMatch && method === 'POST') {
    requireAuth();
    const lang = (data as any)?.lang;
    const text = (data as any)?.text ?? '';
    const lines = lang === 'ru' ? COACH_LINES_RU : COACH_LINES_UZ;
    const reply = lines[coachChatCount % lines.length];
    coachChatCount++;
    coachChatMessages.push({ role: 'user', text }, { role: 'assistant', text: reply });
    return { reply } as T;
  }
  if (path === '/coaching/stats' && method === 'GET') {
    requireAuth();
    return { coachingDoneCount: coachingAnswers.length, sessionsCompleted: coachingSessionId ? 1 : 0 } as T;
  }
  if (path === '/coaching/pattern' && method === 'GET') {
    const user = requireAuth();
    if (!coachingAnswers.length) return { mainKey: null, prompt: null } as T;
    const analysis = computeAnalysis(coachingAnswers, user.name);
    const prompts: Record<string, string> = {
      P: "Bugun bitta ishni 'yetarlicha yaxshi' darajasida tugatib, uni qayta ko'rib chiqmasdan qoldirib ko'rasizmi?",
      M: "Bugun kimgadir 'yo'q' deb aytish imkoni bo'lsa, birinchi kim xayolingizga keladi?",
      C: "Bugun hech kimga hisob bermasdan, faqat o'zingiz uchun 20 daqiqa vaqt topsangiz, nima qilardingiz?",
    };
    return { mainKey: analysis.mainKey, prompt: prompts[analysis.mainKey] ?? null } as T;
  }

  if (path === '/kasb/questions' && method === 'GET') {
    return {
      temperament: TEMPERAMENT_QUESTIONS.map((q) => ({ q: q.q, options: q.options.map((o) => o.label) })),
      riasec: RIASEC_QUESTIONS.map((q) => ({ q: q.q, options: q.options.map((o) => o.label) })),
    } as T;
  }
  if (path === '/kasb/temperament' && method === 'POST') {
    requireAuth();
    const { answers } = (data as any) ?? {};
    const scores: Record<Temperament, number> = { X: 0, S: 0, F: 0, M: 0 };
    answers.forEach((optIdx: number, i: number) => {
      scores[TEMPERAMENT_QUESTIONS[i].options[optIdx].type]++;
    });
    const top = (Object.entries(scores) as [Temperament, number][]).sort((a, b) => b[1] - a[1])[0][0];
    return { temperament: top, info: TEMPERAMENT_INFO[top], scores } as T;
  }
  if (path === '/kasb/riasec' && method === 'POST') {
    requireAuth();
    const { answers } = (data as any) ?? {};
    const scores: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    answers.forEach((optIdx: number, i: number) => {
      scores[RIASEC_QUESTIONS[i].options[optIdx].type]++;
    });
    const [top1, top2] = riasecCode(scores);
    const info1 = RIASEC_INFO[top1];
    const info2 = RIASEC_INFO[top2];
    const result = {
      code: `${top1}${top2}`,
      title: info1.title,
      desc: `${info1.desc} Bundan tashqari, sizda ${info2.name.toLowerCase()} yo'nalishiga xos qiziqish ham kuchli — bu sizga ${info1.name.toLowerCase()} yo'nalishida o'ziga xos qirra qo'shadi.`,
      steps: info1.steps,
    };
    return { id: uid(), result, scores } as T;
  }

  throw new MockApiError(404, 'not_found', `mock: unhandled ${method} ${path}`);
}

export { MockApiError };
