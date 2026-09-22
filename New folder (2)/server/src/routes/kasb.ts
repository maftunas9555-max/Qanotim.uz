import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { TEMPERAMENT_QUESTIONS, TEMPERAMENT_INFO, type Temperament } from '../content/temperament.js';
import { RIASEC_QUESTIONS, RIASEC_INFO, riasecCode, type RiasecType } from '../content/riasec.js';

export const kasbRouter = Router();
kasbRouter.use(requireAuth);

kasbRouter.get('/questions', (_req, res) => {
  res.json({
    temperament: TEMPERAMENT_QUESTIONS.map((q) => ({ q: q.q, options: q.options.map((o) => o.label) })),
    riasec: RIASEC_QUESTIONS.map((q) => ({ q: q.q, options: q.options.map((o) => o.label) })),
  });
});

kasbRouter.post('/temperament', (req, res) => {
  const { answers } = req.body ?? {};
  if (
    !Array.isArray(answers) ||
    answers.length !== TEMPERAMENT_QUESTIONS.length ||
    answers.some((a) => ![0, 1, 2, 3].includes(a))
  ) {
    return res.status(400).json({ error: 'invalid_answers' });
  }
  const scores: Record<Temperament, number> = { X: 0, S: 0, F: 0, M: 0 };
  answers.forEach((optIdx: number, i: number) => {
    scores[TEMPERAMENT_QUESTIONS[i].options[optIdx].type]++;
  });
  const top = (Object.entries(scores) as [Temperament, number][]).sort((a, b) => b[1] - a[1])[0][0];
  res.json({ temperament: top, info: TEMPERAMENT_INFO[top], scores });
});

kasbRouter.post('/riasec', (req, res) => {
  const { answers, temperament } = req.body ?? {};
  if (
    !Array.isArray(answers) ||
    answers.length !== RIASEC_QUESTIONS.length ||
    answers.some((a) => ![0, 1, 2, 3].includes(a))
  ) {
    return res.status(400).json({ error: 'invalid_answers' });
  }
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

  const id = randomUUID();
  db.prepare(
    `INSERT INTO kasb_results (id, user_id, temperament, riasec_scores, riasec_code, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId!, temperament ?? null, JSON.stringify(scores), result.code, new Date().toISOString());

  res.status(201).json({ id, result, scores });
});

kasbRouter.get('/latest', (req, res) => {
  const row = db
    .prepare('SELECT * FROM kasb_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.userId!) as { temperament: Temperament | null; riasec_code: string; created_at: string } | undefined;
  if (!row) return res.json({ result: null });
  const [t1, t2] = row.riasec_code.split('') as [RiasecType, RiasecType];
  const info1 = RIASEC_INFO[t1];
  const info2 = RIASEC_INFO[t2];
  res.json({
    result: {
      temperament: row.temperament,
      temperamentInfo: row.temperament ? TEMPERAMENT_INFO[row.temperament] : null,
      code: row.riasec_code,
      title: info1.title,
      desc: `${info1.desc} Bundan tashqari, sizda ${info2.name.toLowerCase()} yo'nalishiga xos qiziqish ham kuchli — bu sizga ${info1.name.toLowerCase()} yo'nalishida o'ziga xos qirra qo'shadi.`,
      steps: info1.steps,
      createdAt: row.created_at,
    },
  });
});
