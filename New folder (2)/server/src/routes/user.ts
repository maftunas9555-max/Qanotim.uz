import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, getSessionUser } from '../auth.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.patch('/lang', (req, res) => {
  const lang = req.body?.lang === 'ru' ? 'ru' : 'uz';
  db.prepare('UPDATE users SET lang = ? WHERE id = ?').run(lang, req.userId!);
  res.json({ user: getSessionUser(req.userId!) });
});
