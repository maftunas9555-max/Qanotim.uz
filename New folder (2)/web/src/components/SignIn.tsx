import { useEffect, useRef, useState } from 'react';
import { api, User } from '../api';
import { STR } from '../i18n';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface Health {
  googleConfigured: boolean;
  googleClientId: string | null;
  devLoginEnabled: boolean;
  coachConfigured: boolean;
}

export function SignIn({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const t = STR.uz;
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devName, setDevName] = useState('');
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Health>('/health').then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (!health?.googleConfigured || !health.googleClientId) return;
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !btnRef.current) {
        setTimeout(tryInit, 150);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: health.googleClientId!,
        callback: async (resp) => {
          setBusy(true);
          setError(null);
          try {
            const { user } = await api.post<{ user: User }>('/auth/google', { credential: resp.credential });
            onSignedIn(user);
          } catch (err) {
            setError((err as Error).message || 'Kirishda xatolik yuz berdi');
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 280,
      });
    };
    tryInit();
    return () => {
      cancelled = true;
    };
  }, [health, onSignedIn]);

  async function handleDevLogin() {
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post<{ user: User }>('/auth/dev-login', { name: devName.trim() || 'Mehmon' });
      onSignedIn(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px 20px',
      }}
    >
      <h1 style={{ fontSize: 26, marginBottom: 10, color: 'var(--color-accent)' }}>{t.signInTitle}</h1>
      <p style={{ fontSize: 13.5, opacity: 0.75, marginBottom: 22, maxWidth: 300 }}>{t.signInBody}</p>

      <div style={{ width: '100%', maxWidth: 300 }}>
        {!health && <div className="text-muted">{t.loading}</div>}

        {health && health.googleConfigured && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div ref={btnRef} />
          </div>
        )}

        {health && !health.googleConfigured && (
          <p style={{ fontSize: 12.5, color: 'var(--color-accent-700)' }}>
            Google Sign-In hali sozlanmagan: serverda <code>GOOGLE_CLIENT_ID</code> muhit o'zgaruvchisini
            o'rnating (server/.env.example ga qarang).
          </p>
        )}

        {health?.devLoginEnabled && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-divider)' }}>
            <label style={{ display: 'block', fontSize: 11.5, opacity: 0.6, marginBottom: 6 }}>{t.devLoginLabel}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="Madina" />
              <button type="button" className="btn btn-secondary" onClick={handleDevLogin} disabled={busy}>
                OK
              </button>
            </div>
          </div>
        )}

        {busy && (
          <div style={{ marginTop: 14 }} className="text-muted">
            {t.signingIn}
          </div>
        )}
        {error && <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--color-accent-700)' }}>{error}</div>}
      </div>
    </div>
  );
}
