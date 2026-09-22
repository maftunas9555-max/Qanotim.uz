import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/user.js';
import { goalsRouter } from './routes/goals.js';
import { coachingRouter } from './routes/coaching.js';
import { kasbRouter } from './routes/kasb.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-me' || process.env.JWT_SECRET === 'change-me-to-a-long-random-string')) {
  console.error('Refusing to start: set a real JWT_SECRET (not the placeholder) before running in production.');
  process.exit(1);
}

const app = express();
const origins = (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    googleConfigured: !!process.env.GOOGLE_CLIENT_ID,
    coachConfigured: !!process.env.GEMINI_API_KEY,
    devLoginEnabled: process.env.ALLOW_DEV_LOGIN === '1',
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/coaching', coachingRouter);
app.use('/api/kasb', kasbRouter);
app.use('/api/admin', adminRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serves the built React app (web/dist) so the whole product runs as a
// single deployable service — no separate frontend host or CORS needed.
// `index: false` stops express.static from auto-serving index.html for "/" —
// that path always goes through the explicit route below instead, which
// marks it no-store so mobile browsers/proxies can't get stuck showing a
// stale cached copy of the app shell (hashed JS/CSS assets are still safe
// to cache normally, since their filenames change on every rebuild).
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
app.use(express.static(webDist, { index: false }));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(webDist, 'index.html'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  // Every expected failure is already handled at its route with its own status/body;
  // reaching here means something unexpected happened, so don't echo internal details.
  res.status(500).json({ error: 'internal_error' });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`Qanotim API listening on http://localhost:${port}`);
});
