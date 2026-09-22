const BASE = '/api';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

declare global {
  interface Window {
    __QN_MOCK__?: boolean;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (typeof window !== 'undefined' && window.__QN_MOCK__) {
    const { mockRequest, MockApiError } = await import('./mock/mockBackend');
    try {
      return await mockRequest<T>(init?.method || 'GET', path, init?.body ? JSON.parse(init.body as string) : undefined);
    } catch (err) {
      if (err instanceof MockApiError) throw new ApiError(err.status, err.code, err.message);
      throw err;
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || 'request_failed', body?.message);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── domain types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
  lang: 'uz' | 'ru';
  subscriptionStart: string;
  subscriptionEnd: string;
}

export interface Goal {
  id: string;
  text: string;
  baseText: string;
  done: boolean;
  source: string;
  recurring: boolean;
  current: number | null;
  total: number | null;
  unit: string | null;
}

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
  mainKey: 'P' | 'M' | 'C';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
