import { Strings } from '../../i18n';
import { User } from '../../api';
import { Screen } from '../TabBar';
import { formatLongDateWithWeekday } from '../../dateFmt';
import { todaysQuote } from '../../content/quotes';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SectionRow({ icon, title, body, onClick }: { icon: JSX.Element; title: string; body: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="qn-opt"
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-md)',
        padding: 13,
        marginBottom: 9,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '1px solid var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          color: 'var(--color-accent-700)',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>{body}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-divider)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 6l6 6-6 6" />
      </svg>
    </div>
  );
}

export function HomeScreen({
  t,
  user,
  goalsDoneN,
  goalsTotal,
  streak,
  dailyPrompt,
  onNavigate,
}: {
  t: Strings;
  user: User;
  goalsDoneN: number;
  goalsTotal: number;
  streak: number;
  dailyPrompt: string | null;
  onNavigate: (s: Screen) => void;
}) {
  const dateLabel = formatLongDateWithWeekday(new Date().toISOString(), user.lang);
  const quote = todaysQuote();

  return (
    <div>
      <div className="qn-wordmark">{t.appName}!</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
            {dateLabel}
          </div>
          <h1 style={{ fontSize: 26, margin: '2px 0 0' }}>
            {t.hello}, {user.name}
          </h1>
        </div>
        <div
          onClick={() => onNavigate('profil')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--color-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            color: 'var(--color-accent-700)',
            overflow: 'hidden',
          }}
        >
          {user.picture ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(user.name)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, color: 'var(--color-accent-700)' }}>{streak}</div>
          <div style={{ fontSize: 10.5, opacity: 0.65 }}>{t.streak}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, color: 'var(--color-accent-700)' }}>
            {goalsDoneN}/{goalsTotal}
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.65 }}>{t.todayGoals}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-kicker">{t.dailySpark}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontStyle: 'italic', lineHeight: 1.35 }}>
          "{user.lang === 'ru' ? quote.ru : quote.uz}"
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 8 }}>— {quote.author}</div>
      </div>

      {dailyPrompt && (
        <div
          className="card"
          onClick={() => onNavigate('coaching')}
          style={{ marginBottom: 22, borderColor: 'var(--color-accent)', cursor: 'pointer' }}
        >
          <div className="card-kicker">{t.dailyQuestion}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.45 }}>{dailyPrompt}</div>
        </div>
      )}

      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>{t.sections}</div>

      <SectionRow
        onClick={() => onNavigate('coaching')}
        title={t.coachingCardTitle}
        body={t.coachingCardBody}
        icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 1 1-4.24-7.36L21 3l-1 4.86a8.46 8.46 0 0 1 1 3.64Z" />
          </svg>
        }
      />
      <SectionRow
        onClick={() => onNavigate('maqsad')}
        title={t.maqsadCardTitle}
        body={t.maqsadCardBody}
        icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="4.5" />
          </svg>
        }
      />
      <SectionRow
        onClick={() => onNavigate('kasb')}
        title={t.kasbCardTitle}
        body={t.kasbCardBody}
        icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 13h18" />
          </svg>
        }
      />
    </div>
  );
}
