import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'qanotim_session';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
  lang: 'uz' | 'ru';
  subscriptionStart: string;
  subscriptionEnd: string;
}

interface UserRow {
  id: string;
  google_sub: string | null;
  email: string | null;
  name: string;
  picture: string | null;
  lang: string;
  subscription_start: string;
  subscription_end: string;
  blocked: number;
  created_at: string;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    picture: row.picture,
    lang: row.lang === 'ru' ? 'ru' : 'uz',
    subscriptionStart: row.subscription_start,
    subscriptionEnd: row.subscription_end,
  };
}

function issueCookie(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function upsertGoogleUser(opts: { sub: string; email: string | null; name: string; picture: string | null }): UserRow {
  const existing = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(opts.sub) as UserRow | undefined;
  if (existing) return existing;

  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, google_sub, email, name, picture, lang, subscription_start, subscription_end, created_at)
     VALUES (?, ?, ?, ?, ?, 'uz', ?, ?, ?)`
  ).run(id, opts.sub, opts.email, opts.name, opts.picture, now.toISOString(), end.toISOString(), now.toISOString());
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow;
}

export async function verifyGoogleIdToken(idToken: string) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub) throw new Error('Invalid Google token');
  return {
    sub: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? payload.email ?? 'Foydalanuvchi',
    picture: payload.picture ?? null,
  };
}

export class AccountBlockedError extends Error {
  constructor() {
    super('account_blocked');
  }
}

export function loginWithGoogleProfile(res: Response, profile: { sub: string; email: string | null; name: string; picture: string | null }) {
  const row = upsertGoogleUser(profile);
  if (row.blocked) throw new AccountBlockedError();
  issueCookie(res, row.id);
  return toSessionUser(row);
}

/** Local-testing-only login that skips Google entirely. Gated by ALLOW_DEV_LOGIN=1. */
export function devLogin(res: Response, name: string) {
  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  const devSub = `dev:${name.toLowerCase()}`;
  let row = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(devSub) as UserRow | undefined;
  if (!row) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO users (id, google_sub, email, name, picture, lang, subscription_start, subscription_end, created_at)
       VALUES (?, ?, NULL, ?, NULL, 'uz', ?, ?, ?)`
    ).run(id, devSub, name, now.toISOString(), end.toISOString(), now.toISOString());
    row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow;
  }
  if (row.blocked) throw new AccountBlockedError();
  issueCookie(res, row.id);
  return toSessionUser(row);
}

export function logout(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not_authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const row = db.prepare('SELECT id, blocked FROM users WHERE id = ?').get(decoded.sub) as { id: string; blocked: number } | undefined;
    if (!row) return res.status(401).json({ error: 'not_authenticated' });
    // A blocked user keeps a valid session cookie (it isn't revoked), so this
    // has to be checked on every request, not just at login — otherwise an
    // already-signed-in user an admin blocks would stay in until their cookie expires.
    if (row.blocked) return res.status(403).json({ error: 'account_blocked' });
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'not_authenticated' });
  }
}

export function getSessionUser(userId: string): SessionUser | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  return row ? toSessionUser(row) : null;
}
