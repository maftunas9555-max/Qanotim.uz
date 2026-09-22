import { Router } from 'express';
import { verifyGoogleIdToken, loginWithGoogleProfile, devLogin, logout, requireAuth, getSessionUser, AccountBlockedError } from '../auth.js';
import { asyncHandler } from '../asyncHandler.js';

export const authRouter = Router();

authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential } = req.body ?? {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'missing_credential' });
    }
    try {
      const profile = await verifyGoogleIdToken(credential);
      const user = loginWithGoogleProfile(res, profile);
      res.json({ user });
    } catch (err) {
      if (err instanceof AccountBlockedError) {
        return res.status(403).json({ error: 'account_blocked' });
      }
      res.status(401).json({ error: 'google_verification_failed', message: (err as Error).message });
    }
  })
);

authRouter.post('/dev-login', (req, res) => {
  if (process.env.ALLOW_DEV_LOGIN !== '1') {
    return res.status(403).json({ error: 'dev_login_disabled' });
  }
  const name = (req.body?.name as string | undefined)?.trim() || 'Mehmon';
  try {
    const user = devLogin(res, name);
    res.json({ user });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return res.status(403).json({ error: 'account_blocked' });
    }
    throw err;
  }
});

authRouter.post('/logout', (req, res) => {
  logout(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = getSessionUser(req.userId!);
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ user });
});
