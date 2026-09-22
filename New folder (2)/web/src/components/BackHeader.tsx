import { Strings } from '../i18n';

export function BackHeader({ t, onBack }: { t: Strings; onBack: () => void }) {
  return (
    <div
      onClick={onBack}
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.6, marginBottom: 14, cursor: 'pointer' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 6l-6 6 6 6" />
      </svg>
      {t.back}
    </div>
  );
}
