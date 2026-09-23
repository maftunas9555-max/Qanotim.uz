import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

interface GoalRow {
  id: string;
  user_id: string;
  text: string;
  done: number;
  missed: number;
  source: string;
  recurring: number;
  current: number | null;
  total: number | null;
  unit: string | null;
  plan: string | null;
  created_at: string;
}

const SPLIT: Record<string, { count: number; unit: string }> = {
  haftalik: { count: 7, unit: 'kun' },
  oylik: { count: 30, unit: 'kun' },
  yillik: { count: 12, unit: 'oy' },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// For a recurring goal with a generated day-by-day plan, shows that day's
// specific step instead of just repeating the goal's own title every day.
function currentStepText(g: GoalRow): string {
  if (!g.plan || !g.current) return g.text;
  try {
    const steps = JSON.parse(g.plan) as string[];
    return steps[g.current - 1] ?? g.text;
  } catch {
    return g.text;
  }
}

function serialize(g: GoalRow) {
  return {
    id: g.id,
    text: g.recurring ? `${currentStepText(g)} (${g.current}/${g.total})` : g.text,
    baseText: g.text,
    done: !!g.done,
    source: g.source,
    recurring: !!g.recurring,
    current: g.current,
    total: g.total,
    unit: g.unit,
  };
}

function listGoals(userId: string) {
  return db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at ASC').all(userId) as unknown as GoalRow[];
}

// Freezes `dateKey`'s goals into daily_snapshot/daily_log, then moves each
// goal forward to the next day: a recurring goal always advances (no
// penalty for an unfinished day — "kecha 1/30 bo'lsa bugun 2/30" regardless
// of whether yesterday was completed), while a one-off goal is archived
// into history and removed from the live list instead of being flagged
// "missed".
function rolloverOneDay(userId: string, dateKey: string) {
  const goals = listGoals(userId);
  const doneCount = goals.filter((g) => g.done).length;
  db.prepare(
    `INSERT INTO daily_log (user_id, date, done_count, total_count) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET done_count = excluded.done_count, total_count = excluded.total_count`
  ).run(userId, dateKey, doneCount, goals.length);

  const snapshotStmt = db.prepare(
    `INSERT INTO daily_snapshot (id, user_id, date, goal_id, text, done, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date, goal_id) DO UPDATE SET text = excluded.text, done = excluded.done`
  );
  const advanceStmt = db.prepare('UPDATE goals SET done = 0, current = ? WHERE id = ?');
  const deleteStmt = db.prepare('DELETE FROM goals WHERE id = ?');
  const now = new Date().toISOString();

  for (const g of goals) {
    const displayText = g.recurring ? currentStepText(g) : g.text;
    snapshotStmt.run(randomUUID(), userId, dateKey, g.id, displayText, g.done ? 1 : 0, now);

    if (g.recurring && g.current !== null && g.total !== null) {
      if (g.current < g.total) advanceStmt.run(g.current + 1, g.id);
      // else: already reached the target count — leave it, the goal is complete
    } else {
      deleteStmt.run(g.id);
    }
  }
}

// Runs at the start of every /api/goals request: catches this user's goals
// up to today, one day at a time, if they haven't been opened since an
// earlier day. Replaces the old manual "Kun oxiri tekshiruvi" button.
function rollover(userId: string) {
  const row = db.prepare('SELECT last_rollover_date FROM users WHERE id = ?').get(userId) as
    | { last_rollover_date: string }
    | undefined;
  if (!row) return;
  const today = todayKey();
  if (!row.last_rollover_date) {
    // First time under this schema — set today as the baseline without
    // replaying history, so an existing account doesn't get treated as
    // having missed every day since it was created.
    db.prepare('UPDATE users SET last_rollover_date = ? WHERE id = ?').run(today, userId);
    return;
  }
  if (row.last_rollover_date >= today) return;

  const cursor = new Date(row.last_rollover_date + 'T00:00:00Z');
  const todayDate = new Date(today + 'T00:00:00Z');
  const MAX_DAYS = 60; // safety cap against pathological catch-up loops
  for (let i = 0; i < MAX_DAYS && cursor < todayDate; i++) {
    rolloverOneDay(userId, cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  db.prepare('UPDATE users SET last_rollover_date = ? WHERE id = ?').run(today, userId);
}

goalsRouter.use((req, res, next) => {
  rollover(req.userId!);
  next();
});

goalsRouter.get('/', (req, res) => {
  const goals = listGoals(req.userId!).map(serialize);
  res.json({ goals });
});

// Quick add from the text composer on the Maqsad screen (always "today", non-recurring).
goalsRouter.post('/', (req, res) => {
  const { text, source } = req.body ?? {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text_required' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO goals (id, user_id, text, done, missed, source, recurring, created_at)
     VALUES (?, ?, ?, 0, 0, ?, 0, ?)`
  ).run(id, req.userId!, text.trim(), source === 'ovoz' ? 'ovoz' : 'matn', new Date().toISOString());
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as unknown as GoalRow;
  res.status(201).json({ goal: serialize(goal) });
});

// "+" FAB modal on Maqsad: haftalik/oylik/yillik goal, optionally auto-split into a daily recurring goal.
// When split, `plan` is the array of per-day texts the user typed herself (one slot per day/month) —
// there's no AI generation here, each slot is just an independently editable entry (see currentStepText).
goalsRouter.post('/recurring', (req, res) => {
  const { text, duration, split, plan } = req.body ?? {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text_required' });
  }
  if (!SPLIT[duration]) {
    return res.status(400).json({ error: 'invalid_duration' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  if (split) {
    const sp = SPLIT[duration];
    const planJson = Array.isArray(plan) && plan.every((x) => typeof x === 'string') && plan.length === sp.count ? JSON.stringify(plan) : null;
    db.prepare(
      `INSERT INTO goals (id, user_id, text, done, missed, source, recurring, current, total, unit, plan, created_at)
       VALUES (?, ?, ?, 0, 0, ?, 1, 1, ?, ?, ?, ?)`
    ).run(id, req.userId!, text.trim(), duration, sp.count, sp.unit, planJson, now);
  } else {
    db.prepare(
      `INSERT INTO goals (id, user_id, text, done, missed, source, recurring, created_at)
       VALUES (?, ?, ?, 0, 0, ?, 0, ?)`
    ).run(id, req.userId!, text.trim(), duration, now);
  }
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as unknown as GoalRow;
  res.status(201).json({ goal: serialize(goal) });
});

goalsRouter.delete('/:id', (req, res) => {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!goal) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

goalsRouter.patch('/:id/toggle', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!) as
    | GoalRow
    | undefined;
  if (!goal) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE goals SET done = ? WHERE id = ?').run(goal.done ? 0 : 1, goal.id);
  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id) as unknown as GoalRow;
  res.json({ goal: serialize(updated) });
});

// Unsuffixed text for history rows — the live goal list shows "(2/30)"
// counters via serialize(), but a history entry (today's or a frozen past
// day's) should show just that day's step, matching what daily_snapshot
// already stores, so editing one never bakes the counter into the text.
function historyText(g: GoalRow): string {
  return g.recurring ? currentStepText(g) : g.text;
}

// History: today reads/edits the live goals directly; any earlier date
// reads/edits the frozen daily_snapshot written when that day rolled over.
goalsRouter.get('/history/:date', (req, res) => {
  const { date } = req.params;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid_date' });
  if (date > todayKey()) return res.status(400).json({ error: 'future_date' });

  if (date === todayKey()) {
    const items = listGoals(req.userId!).map((g) => ({ id: g.id, text: historyText(g), done: !!g.done }));
    return res.json({ items });
  }
  const rows = db
    .prepare('SELECT id, text, done FROM daily_snapshot WHERE user_id = ? AND date = ? ORDER BY created_at ASC')
    .all(req.userId!, date) as { id: string; text: string; done: number }[];
  res.json({ items: rows.map((r) => ({ id: r.id, text: r.text, done: !!r.done })) });
});

goalsRouter.patch('/history/:date/:itemId', (req, res) => {
  const { date, itemId } = req.params;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid_date' });
  const { done, text } = req.body ?? {};
  const nextText = typeof text === 'string' && text.trim() ? text.trim() : null;

  if (date === todayKey()) {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(itemId, req.userId!) as GoalRow | undefined;
    if (!goal) return res.status(404).json({ error: 'not_found' });
    const nextDone = typeof done === 'boolean' ? done : !!goal.done;
    if (nextText) {
      if (goal.recurring && goal.plan && goal.current) {
        const steps = JSON.parse(goal.plan) as string[];
        steps[goal.current - 1] = nextText;
        db.prepare('UPDATE goals SET done = ?, plan = ? WHERE id = ?').run(nextDone ? 1 : 0, JSON.stringify(steps), goal.id);
      } else {
        db.prepare('UPDATE goals SET done = ?, text = ? WHERE id = ?').run(nextDone ? 1 : 0, nextText, goal.id);
      }
    } else {
      db.prepare('UPDATE goals SET done = ? WHERE id = ?').run(nextDone ? 1 : 0, goal.id);
    }
    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id) as unknown as GoalRow;
    return res.json({ item: { id: updated.id, text: historyText(updated), done: !!updated.done } });
  }

  const row = db.prepare('SELECT id FROM daily_snapshot WHERE id = ? AND user_id = ? AND date = ?').get(itemId, req.userId!, date);
  if (!row) return res.status(404).json({ error: 'not_found' });
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (typeof done === 'boolean') {
    sets.push('done = ?');
    vals.push(done ? 1 : 0);
  }
  if (nextText) {
    sets.push('text = ?');
    vals.push(nextText);
  }
  if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' });
  vals.push(itemId);
  db.prepare(`UPDATE daily_snapshot SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const updated = db.prepare('SELECT id, text, done FROM daily_snapshot WHERE id = ?').get(itemId) as {
    id: string;
    text: string;
    done: number;
  };
  res.json({ item: { id: updated.id, text: updated.text, done: !!updated.done } });
});

goalsRouter.get('/weekly', (req, res) => {
  const rows = db
    .prepare('SELECT date, done_count, total_count FROM daily_log WHERE user_id = ? ORDER BY date DESC LIMIT 7')
    .all(req.userId!) as { date: string; done_count: number; total_count: number }[];
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const days: { date: string; pct: number; doneCount: number; totalCount: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    let pct = 0;
    let doneCount = 0;
    let totalCount = 0;
    if (isToday) {
      const live = listGoals(req.userId!);
      doneCount = live.filter((g) => g.done).length;
      totalCount = live.length;
      pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
    } else {
      const row = byDate.get(key);
      doneCount = row?.done_count ?? 0;
      totalCount = row?.total_count ?? 0;
      pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    }
    days.push({ date: key, pct, doneCount, totalCount, isToday });
  }
  res.json({ days });
});

goalsRouter.get('/streak', (req, res) => {
  const rows = db
    .prepare('SELECT date, done_count FROM daily_log WHERE user_id = ? ORDER BY date DESC')
    .all(req.userId!) as { date: string; done_count: number }[];
  const byDate = new Map(rows.map((r) => [r.date, r.done_count]));

  const liveGoals = listGoals(req.userId!);
  const liveDoneToday = liveGoals.some((g) => g.done);

  let streak = 0;
  const cursor = new Date();
  if (!liveDoneToday && !byDate.has(todayKey())) {
    // today has no progress yet — start counting from yesterday
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    const isToday = key === todayKey();
    const done = isToday ? liveDoneToday || (byDate.get(key) ?? 0) > 0 : (byDate.get(key) ?? 0) > 0;
    if (!done) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  res.json({ streak });
});
