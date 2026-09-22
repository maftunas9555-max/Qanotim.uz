import { Router } from 'express';
import { db } from '../db.js';

export const adminRouter = Router();

// Single shared-secret gate, sent as a header on every request — proportionate
// for a single-owner admin tool. Disabled entirely (routes 404) unless
// ADMIN_PASSWORD is set, same spirit as ALLOW_DEV_LOGIN.
adminRouter.use((req, res, next) => {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return res.status(404).json({ error: 'admin_disabled' });
  if (req.headers['x-admin-password'] !== configured) {
    return res.status(401).json({ error: 'wrong_password' });
  }
  next();
});

interface UserRow {
  id: string;
  email: string | null;
  name: string;
  lang: string;
  subscription_start: string;
  subscription_end: string;
  blocked: number;
  created_at: string;
}

adminRouter.get('/users', (_req, res) => {
  const users = db
    .prepare('SELECT id, email, name, lang, subscription_start, subscription_end, blocked, created_at FROM users ORDER BY created_at DESC')
    .all() as unknown as UserRow[];

  const goalsCount = db.prepare('SELECT user_id, COUNT(*) as c FROM goals GROUP BY user_id').all() as unknown as {
    user_id: string;
    c: number;
  }[];
  const coachingCount = db.prepare('SELECT user_id, COUNT(*) as c FROM coaching_sessions GROUP BY user_id').all() as unknown as {
    user_id: string;
    c: number;
  }[];
  const goalsMap = new Map(goalsCount.map((r) => [r.user_id, r.c]));
  const coachingMap = new Map(coachingCount.map((r) => [r.user_id, r.c]));

  const now = new Date().toISOString();
  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      lang: u.lang,
      subscriptionStart: u.subscription_start,
      subscriptionEnd: u.subscription_end,
      createdAt: u.created_at,
      active: u.subscription_end > now,
      blocked: !!u.blocked,
      goalsCount: goalsMap.get(u.id) ?? 0,
      coachingSessionsCount: coachingMap.get(u.id) ?? 0,
    })),
  });
});

// Blocks or unblocks a user. A blocked user is rejected at login and on
// every subsequent request (see requireAuth in auth.ts) — their data is
// kept, not deleted, so unblocking restores them exactly as they were.
adminRouter.patch('/users/:id/block', (req, res) => {
  const blocked = req.body?.blocked;
  if (typeof blocked !== 'boolean') {
    return res.status(400).json({ error: 'invalid_blocked' });
  }
  const row = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(blocked ? 1 : 0, req.params.id);
  res.json({ blocked });
});

// Extends (or grants fresh) access by N months from whichever is later:
// today, or the user's current subscription end — so granting more time to
// an already-active user adds on top instead of shortening it.
adminRouter.patch('/users/:id/subscription', (req, res) => {
  const months = Number(req.body?.months);
  if (!Number.isFinite(months) || months <= 0 || months > 60) {
    return res.status(400).json({ error: 'invalid_months' });
  }
  const row = db.prepare('SELECT subscription_end FROM users WHERE id = ?').get(req.params.id) as
    | { subscription_end: string }
    | undefined;
  if (!row) return res.status(404).json({ error: 'not_found' });

  const now = new Date();
  const base = new Date(row.subscription_end);
  const from = base > now ? base : now;
  from.setMonth(from.getMonth() + months);
  const newEnd = from.toISOString();

  db.prepare('UPDATE users SET subscription_end = ? WHERE id = ?').run(newEnd, req.params.id);
  res.json({ subscriptionEnd: newEnd });
});
