import { GoogleGenAI, type Content } from '@google/genai';
import type { Analysis } from './routes/coaching.js';

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL = process.env.COACH_MODEL || 'gemini-3.6-flash';

// Gemini calls occasionally fail with a transient error (rate limit blip,
// brief network hiccup) that succeeds again seconds later on its own — so
// retry a couple of times with a short backoff before surfacing a real
// failure to the user as "coach unavailable".
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 700): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

function langName(lang: string) {
  return lang === 'ru' ? 'Russian' : 'Uzbek';
}

function buildSystemPrompt(userName: string, lang: string, analysis: Analysis) {
  return `You are "Qanotim Coach" — a warm, emotionally attuned personal life coach inside a women's personal-growth app. You are talking with ${userName}, who just finished a 10-question reflective coaching intake.

## How to behave (grounded in real coaching practice)
- Sound like a real, caring human coach — never like a chatbot, a therapist reading a script, or a corporate assistant. Short, warm, conversational sentences.
- Use core coaching skills: active listening, reflecting back what she says in your own words, asking one open, powerful question at a time (never a list of questions), holding a non-judgmental and encouraging tone, and gently naming what's underneath the surface without diagnosing or pathologizing.
- Do not lecture or dump generic advice. Let her do most of the talking; your job is to ask the next question that helps her go one layer deeper.
- Stay squarely in a coaching frame, not clinical therapy: focus on patterns, values, and next small actions rather than treating this as a medical/mental-health consultation. If she describes something that sounds like it needs professional mental-health support, gently say so and encourage her to seek it, without refusing to keep talking supportively.
- Always reply in ${langName(lang)}, matching her language.
- Keep each reply short: 2-5 sentences, ending in at most one question.
- Your very first message to her must be especially short and simple: one or two warm sentences that name her primary pattern in plain, human terms (not clinical labels), then a single, gentle, concrete question about that specific pattern — tailored to what she personally described, not a generic opener.

## What her intake revealed
Primary pattern: ${analysis.main ? `${analysis.main.title} — ${analysis.main.body}` : 'none dominant'}
Secondary pattern: ${analysis.second ? `${analysis.second.title} — ${analysis.second.body}` : 'none'}
${analysis.hasStrength ? `Named strength: she is creative, purpose-driven, and clear on her own values.` : ''}
Coach's written conclusion from the intake: ${analysis.conclusion}

Use this understanding to guide the conversation, but don't just repeat it verbatim — build on it naturally as she responds.`;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

function toGeminiRole(role: ChatTurn['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export async function generateCoachReply(opts: {
  userName: string;
  lang: string;
  analysis: Analysis;
  history: ChatTurn[];
}): Promise<string> {
  const ai = getClient();
  const system = buildSystemPrompt(opts.userName, opts.lang, opts.analysis);

  const turns: Content[] = opts.history.map((m) => ({ role: toGeminiRole(m.role), parts: [{ text: m.text }] }));

  // The very first stored turn is always the coach's opening line (a `model`
  // message with no real user turn before it, by design — we don't want a
  // fake "Salom." bubble showing up in the chat UI), and by the time this is
  // called for a real reply, the latest entry is the user's newest message.
  // Gemini's chat history must start on a `user` turn, so the same
  // synthetic-opener trick applies to whatever precedes it.
  let history: Content[];
  let latestMessage: string;
  if (turns.length === 0) {
    history = [];
    latestMessage = 'Salom.';
  } else {
    latestMessage = turns[turns.length - 1].parts![0].text as string;
    history = turns.slice(0, -1);
    if (history.length && history[0].role !== 'user') {
      history = [{ role: 'user', parts: [{ text: 'Salom.' }] }, ...history];
    }
  }

  // A fresh chat instance per attempt avoids relying on how the SDK's
  // internal history behaves after a failed sendMessage call.
  const result = await withRetry(() => {
    const chat = ai.chats.create({ model: MODEL, config: { systemInstruction: system }, history });
    return chat.sendMessage({ message: latestMessage });
  });
  return (result.text ?? '').trim();
}
