import { Strings } from '../i18n';

export type Screen = 'home' | 'coaching' | 'maqsad' | 'kasb' | 'profil';

const ICONS: Record<Screen, JSX.Element> = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h5v-6h2v6h5a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),
  coaching: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 1 1-4.24-7.36L21 3l-1 4.86a8.46 8.46 0 0 1 1 3.64Z" />
    </svg>
  ),
  maqsad: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  ),
  kasb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  ),
  profil: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
};

export function TabBar({ screen, onChange, t }: { screen: Screen; onChange: (s: Screen) => void; t: Strings }) {
  const tabs: { key: Screen; label: string }[] = [
    { key: 'home', label: t.tabHome },
    { key: 'coaching', label: t.tabCoaching },
    { key: 'maqsad', label: t.tabMaqsad },
    { key: 'profil', label: t.tabProfil },
  ];
  const active = 'var(--color-accent-700)';
  return (
    <div className="qn-content-scrim" style={{ display: 'flex', borderTop: '1px solid var(--color-divider)', padding: '8px 6px 22px', flex: 'none' }}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="qn-tab"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            cursor: 'pointer',
            color: screen === tab.key ? active : 'inherit',
          }}
        >
          {ICONS[tab.key]}
          <span style={{ fontSize: 10 }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
