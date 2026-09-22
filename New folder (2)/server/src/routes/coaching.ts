import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, getSessionUser } from '../auth.js';
import { COACHING_QUESTIONS, PATTERN_INFO, COACH_OPENERS, type PatternTag } from '../content/coaching.js';
import { todaysPrompt } from '../content/dailyPrompts.js';
import { generateCoachReply, type ChatTurn } from '../coach.js';
import { asyncHandler } from '../asyncHandler.js';

export const coachingRouter = Router();
coachingRouter.use(requireAuth);

const LETTERS = ['A', 'B', 'C', 'D'];

export interface AnalysisPara {
  title: string;
  body: string;
}
export interface Analysis {
  main: AnalysisPara | null;
  second: AnalysisPara | null;
  strengthCites: string;
  hasStrength: boolean;
  conclusion: string;
  mainKey: Exclude<PatternTag, 'S'>;
}

function computeAnalysis(answers: number[], userName: string): Analysis {
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

  const mkPara = (tag: Exclude<PatternTag, 'S'>): AnalysisPara => {
    const c = cites[tag];
    const citeStr = c.map((x) => x.label).join(', ');
    return {
      title: `${PATTERN_INFO[tag].title} (${citeStr})`,
      body: PATTERN_INFO[tag].body(c[0].text.replace(/\.$/, '')),
    };
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

// Lets a returning user go straight back into their coach conversation
// instead of retaking the 10-question intake every time they open Coaching.
coachingRouter.get('/latest', (req, res) => {
  const session = db
    .prepare('SELECT id, answers FROM coaching_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.userId!) as { id: string; answers: string } | undefined;
  if (!session) return res.json({ session: null });

  const user = getSessionUser(req.userId!)!;
  const answers = JSON.parse(session.answers) as number[];
  const analysis = computeAnalysis(answers, user.name);
  const summaryRows = answers.map((optIdx: number, i: number) => ({
    qNum: `${i + 1}. ${COACHING_QUESTIONS[i].q}`,
    answerText: `${LETTERS[optIdx]}) ${COACHING_QUESTIONS[i].options[optIdx]}`,
  }));
  const messages = db
    .prepare('SELECT role, text FROM coach_messages WHERE session_id = ? ORDER BY created_at ASC')
    .all(session.id) as { role: string; text: string }[];

  res.json({ session: { sessionId: session.id, analysis, summaryRows, messages } });
});

coachingRouter.get('/questions', (_req, res) => {
  res.json({ questions: COACHING_QUESTIONS.map((q) => ({ q: q.q, options: q.options })) });
});

coachingRouter.post('/submit', (req, res) => {
  const { answers } = req.body ?? {};
  if (!Array.isArray(answers) || answers.length !== COACHING_QUESTIONS.length || answers.some((a) => ![0, 1, 2, 3].includes(a))) {
    return res.status(400).json({ error: 'invalid_answers' });
  }
  const user = getSessionUser(req.userId!)!;
  const analysis = computeAnalysis(answers, user.name);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO coaching_sessions (id, user_id, answers, main_tag, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId!, JSON.stringify(answers), analysis.mainKey, now, now);

  const summaryRows = answers.map((optIdx: number, i: number) => ({
    qNum: `${i + 1}. ${COACHING_QUESTIONS[i].q}`,
    answerText: `${LETTERS[optIdx]}) ${COACHING_QUESTIONS[i].options[optIdx]}`,
  }));

  res.status(201).json({ sessionId: id, analysis, summaryRows });
});

function loadSession(userId: string, sessionId: string) {
  const session = db
    .prepare('SELECT * FROM coaching_sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, userId) as { id: string; answers: string; main_tag: string } | undefined;
  if (!session) return null;
  const answers = JSON.parse(session.answers) as number[];
  return { session, answers };
}

coachingRouter.get('/:sessionId/messages', (req, res) => {
  const found = loadSession(req.userId!, req.params.sessionId);
  if (!found) return res.status(404).json({ error: 'not_found' });
  const messages = db
    .prepare('SELECT role, text FROM coach_messages WHERE session_id = ? ORDER BY created_at ASC')
    .all(req.params.sessionId) as { role: string; text: string }[];
  res.json({ messages });
});

async function replyAndPersist(sessionId: string, userId: string, userName: string, lang: string, answers: number[]) {
  const analysis = computeAnalysis(answers, userName);
  const history = db
    .prepare('SELECT role, text FROM coach_messages WHERE session_id = ? ORDER BY created_at ASC')
    .all(sessionId) as unknown as ChatTurn[];
  const reply = await generateCoachReply({ userName, lang, analysis, history });
  const id = randomUUID();
  db.prepare(`INSERT INTO coach_messages (id, user_id, session_id, role, text, created_at) VALUES (?, ?, ?, 'assistant', ?, ?)`).run(
    id,
    userId,
    sessionId,
    reply,
    new Date().toISOString()
  );
  return reply;
}

// Kicks off the conversation once the user accepts the coach's offer.
coachingRouter.post('/:sessionId/start-chat', asyncHandler(async (req, res) => {
  const found = loadSession(req.userId!, req.params.sessionId);
  if (!found) return res.status(404).json({ error: 'not_found' });
  const user = getSessionUser(req.userId!)!;
  const lang = (req.body?.lang as string) || user.lang;

  const existing = db.prepare('SELECT COUNT(*) as c FROM coach_messages WHERE session_id = ?').get(req.params.sessionId) as {
    c: number;
  };
  if (existing.c > 0) {
    const messages = db
      .prepare('SELECT role, text FROM coach_messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(req.params.sessionId);
    return res.json({ messages });
  }

  try {
    const opener = await replyAndPersist(req.params.sessionId, req.userId!, user.name, lang, found.answers);
    res.json({ messages: [{ role: 'assistant', text: opener }] });
  } catch (err) {
    res.status(502).json({ error: 'coach_unavailable', message: (err as Error).message });
  }
}));

coachingRouter.post('/:sessionId/message', asyncHandler(async (req, res) => {
  const found = loadSession(req.userId!, req.params.sessionId);
  if (!found) return res.status(404).json({ error: 'not_found' });
  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text_required' });
  }
  const user = getSessionUser(req.userId!)!;
  const lang = (req.body?.lang as string) || user.lang;

  const id = randomUUID();
  db.prepare(`INSERT INTO coach_messages (id, user_id, session_id, role, text, created_at) VALUES (?, ?, ?, 'user', ?, ?)`).run(
    id,
    req.userId!,
    req.params.sessionId,
    text.trim(),
    new Date().toISOString()
  );

  try {
    const reply = await replyAndPersist(req.params.sessionId, req.userId!, user.name, lang, found.answers);
    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: 'coach_unavailable', message: (err as Error).message });
  }
}));

coachingRouter.get('/stats', (req, res) => {
  const rows = db.prepare('SELECT answers FROM coaching_sessions WHERE user_id = ?').all(req.userId!) as { answers: string }[];
  const totalAnswers = rows.reduce((sum, r) => sum + (JSON.parse(r.answers) as number[]).length, 0);
  res.json({ coachingDoneCount: totalAnswers, sessionsCompleted: rows.length });
});

// A daily-rotating, pattern-specific question shown on Home once the user
// has at least one coaching result — nudges toward a small concrete action
// tied to what their intake actually revealed, not a generic prompt.
coachingRouter.get('/pattern', (req, res) => {
  const row = db
    .prepare('SELECT main_tag FROM coaching_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.userId!) as { main_tag: string | null } | undefined;
  const mainKey = row?.main_tag as Exclude<PatternTag, 'S'> | undefined;
  if (!mainKey) return res.json({ mainKey: null, prompt: null });
  const user = getSessionUser(req.userId!)!;
  res.json({ mainKey, prompt: todaysPrompt(mainKey, user.lang) });
});
