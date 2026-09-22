import { Strings } from '../../i18n';
import { User } from '../../api';
import { WeekDay } from '../../App';
import { BackHeader } from '../BackHeader';
import { formatDate, formatMemberSince } from '../../dateFmt';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function dayLabel(dateIso: string, t: Strings) {
  const jsDay = new Date(dateIso).getDay(); // 0=Sun..6=Sat
  const mondayFirst = (jsDay + 6) % 7; // 0=Mon..6=Sun
  return t.weekdays[mondayFirst];
}

export function ProfilScreen({
  t,
  user,
  streak,
  goalsDoneCount,
  coachingDoneCount,
  weekly,
  onSetLang,
  onLogout,
  onBack,
}: {
  t: Strings;
  user: User;
  streak: number;
  goalsDoneCount: number;
  coachingDoneCount: number;
  weekly: WeekDay[];
  onSetLang: (lang: 'uz' | 'ru') => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const isGoogleConnected = !!user.email;

  return (
    <div>
      <BackHeader t={t} onBack={onBack} />
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: '1px solid var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px auto 10px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 22,
            color: 'var(--color-accent-700)',
            overflow: 'hidden',
          }}
        >
          {user.picture ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(user.name)}
        </div>
        <h2 style={{ fontSize: 19, marginBottom: 2 }}>{user.name}</h2>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 18 }}>{formatMemberSince(user.subscriptionStart, user.lang)}</div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 22 }}>
          <div className="card" style={{ flex: 1, padding: 9, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, color: 'var(--color-accent-700)' }}>{streak}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{t.streak}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 9, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, color: 'var(--color-accent-700)' }}>{goalsDoneCount}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{t.goalsDone}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 9, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, color: 'var(--color-accent-700)' }}>{coachingDoneCount}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{t.coachingDone}</div>
          </div>
        </div>

        <div style={{ textAlign: 'left', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderBottom: '1px solid var(--color-divider)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
              <path d="M22 12H10" />
              <path d="m17 8 5 4-5 4" />
            </svg>
            <span style={{ flex: 1, fontSize: 14 }}>Google</span>
            <span className="tag tag-accent">{isGoogleConnected ? t.connected : t.notConnected}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z" />
              <path d="M2 12h20" />
              <path d="M12 2c2.5 2.7 4 6.3 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.3-4-10s1.5-7.3 4-10Z" />
            </svg>
            <span style={{ flex: 1, fontSize: 14 }}>{t.language}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <div
                onClick={() => onSetLang('uz')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: user.lang === 'uz' ? 600 : 400,
                  background: user.lang === 'uz' ? 'var(--color-accent)' : 'transparent',
                  color: user.lang === 'uz' ? '#fdfdfc' : 'var(--color-accent-700)',
                  border: '1px solid var(--color-accent)',
                }}
              >
                UZ
              </div>
              <div
                onClick={() => onSetLang('ru')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: user.lang === 'ru' ? 600 : 400,
                  background: user.lang === 'ru' ? 'var(--color-accent)' : 'transparent',
                  color: user.lang === 'ru' ? '#fdfdfc' : 'var(--color-accent-700)',
                  border: '1px solid var(--color-accent)',
                }}
              >
                RU
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderTop: '1px solid var(--color-divider)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
            <span style={{ flex: 1, fontSize: 14 }}>{t.subscription}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {formatDate(user.subscriptionStart, user.lang)} – {formatDate(user.subscriptionEnd, user.lang)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>{t.weeklyChartTitle}</div>
          <div className="card" style={{ padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
              {weekly.map((wb) => (
                <div key={wb.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 22,
                      borderRadius: 6,
                      height: `${Math.max(wb.pct, wb.pct > 0 ? 6 : 2)}%`,
                      background: wb.isToday ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-accent) 45%, transparent)',
                    }}
                  />
                  <span style={{ fontSize: 9.5, opacity: 0.55 }}>{dayLabel(wb.date, t)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'left', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div onClick={onLogout} className="qn-opt" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-accent-700)' }}>{t.manageAccount}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-divider)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
