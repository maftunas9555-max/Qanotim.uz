import { useState } from 'react';
import { STR } from '../i18n';

const t = STR.uz;

const SLIDES = [
  { title: t.onboard1Title, body: t.onboard1Body },
  { title: t.onboard2Title, body: t.onboard2Body },
  { title: t.onboard3Title, body: t.onboard3Body },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            border: '1px solid var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, maxWidth: 280, margin: 0 }}>{slide.body}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === idx ? 'var(--color-accent)' : 'var(--color-divider)',
              transition: 'width 0.2s ease',
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => (isLast ? onDone() : setIdx(idx + 1))}
      >
        {isLast ? t.startOnboard : t.continueOnboard}
      </button>
    </div>
  );
}
