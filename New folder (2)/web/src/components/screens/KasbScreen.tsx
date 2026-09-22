import { useEffect, useState } from 'react';
import { Strings } from '../../i18n';
import { api } from '../../api';
import { BackHeader } from '../BackHeader';

interface QSet {
  q: string;
  options: string[];
}
interface TemperamentInfo {
  title: string;
  desc: string;
}
interface KasbResult {
  code: string;
  title: string;
  desc: string;
  steps: string[];
}

type Stage = 'loading' | 'intro' | 'temperament' | 'deepintro' | 'riasec' | 'result';

function QuestionCard({
  t,
  stageLabel,
  progress,
  q,
  selected,
  onSelect,
  onNext,
}: {
  t: Strings;
  stageLabel: string;
  progress: string;
  q: QSet;
  selected: number | null;
  onSelect: (i: number) => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="tag tag-outline" style={{ marginBottom: 10 }}>
        {stageLabel} · {progress}
      </div>
      <h3 style={{ fontSize: 19, lineHeight: 1.25, marginBottom: 14 }}>{q.q}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.options.map((label, i) => (
          <div
            key={i}
            onClick={() => onSelect(i)}
            className={`qn-opt${selected === i ? ' is-selected' : ''}`}
            style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '12px 13px', fontSize: 13.5, cursor: 'pointer' }}
          >
            {label}
          </div>
        ))}
      </div>
      {selected !== null && (
        <button type="button" onClick={onNext} className="btn btn-primary btn-block">
          {t.nextQuestion}
        </button>
      )}
    </>
  );
}

export function KasbScreen({ t, onBack }: { t: Strings; onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [temperamentQs, setTemperamentQs] = useState<QSet[]>([]);
  const [riasecQs, setRiasecQs] = useState<QSet[]>([]);

  const [tIdx, setTIdx] = useState(0);
  const [tSel, setTSel] = useState<number | null>(null);
  const [tAnswers, setTAnswers] = useState<number[]>([]);
  const [temperamentType, setTemperamentType] = useState<string | null>(null);
  const [temperamentInfo, setTemperamentInfo] = useState<TemperamentInfo | null>(null);

  const [rIdx, setRIdx] = useState(0);
  const [rSel, setRSel] = useState<number | null>(null);
  const [rAnswers, setRAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<KasbResult | null>(null);

  useEffect(() => {
    api.get<{ temperament: QSet[]; riasec: QSet[] }>('/kasb/questions').then((r) => {
      setTemperamentQs(r.temperament);
      setRiasecQs(r.riasec);
      setStage('intro');
    });
  }, []);

  function resetAll() {
    setTIdx(0);
    setTSel(null);
    setTAnswers([]);
    setTemperamentType(null);
    setTemperamentInfo(null);
    setRIdx(0);
    setRSel(null);
    setRAnswers([]);
    setResult(null);
    setStage('intro');
  }

  async function nextTemperament() {
    if (tSel === null) return;
    const next = [...tAnswers, tSel];
    setTAnswers(next);
    if (tIdx < temperamentQs.length - 1) {
      setTIdx(tIdx + 1);
      setTSel(null);
      return;
    }
    const r = await api.post<{ temperament: string; info: TemperamentInfo }>('/kasb/temperament', { answers: next });
    setTemperamentType(r.temperament);
    setTemperamentInfo(r.info);
    setStage('deepintro');
  }

  async function nextRiasec() {
    if (rSel === null) return;
    const next = [...rAnswers, rSel];
    setRAnswers(next);
    if (rIdx < riasecQs.length - 1) {
      setRIdx(rIdx + 1);
      setRSel(null);
      return;
    }
    const r = await api.post<{ result: KasbResult }>('/kasb/riasec', { answers: next, temperament: temperamentType });
    setResult(r.result);
    setStage('result');
  }

  if (stage === 'loading') {
    return (
      <div>
        <BackHeader t={t} onBack={onBack} />
        <div className="text-muted">{t.loading}</div>
      </div>
    );
  }

  return (
    <div>
      <BackHeader t={t} onBack={onBack} />

      {stage === 'intro' && (
        <>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>{t.kasbTitle}</h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.8, marginBottom: 8 }}>{t.kasbIntro1}</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.8, marginBottom: 20 }}>{t.kasbIntro2}</p>
          <button type="button" onClick={() => setStage('temperament')} className="btn btn-primary btn-block">
            {t.startTest}
          </button>
        </>
      )}

      {stage === 'temperament' && (
        <QuestionCard
          t={t}
          stageLabel={t.temperamentStage}
          progress={`${tIdx + 1}/${temperamentQs.length}`}
          q={temperamentQs[tIdx]}
          selected={tSel}
          onSelect={setTSel}
          onNext={nextTemperament}
        />
      )}

      {stage === 'deepintro' && temperamentInfo && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-kicker">{t.temperamentResultTag}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, marginBottom: 6 }}>{temperamentInfo.title}</div>
            <p className="card-body">{temperamentInfo.desc}</p>
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t.deepIntroTitle}</h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.8, marginBottom: 20 }}>{t.deepIntroBody}</p>
          <button type="button" onClick={() => setStage('riasec')} className="btn btn-primary btn-block">
            {t.continueDeep}
          </button>
        </>
      )}

      {stage === 'riasec' && (
        <QuestionCard
          t={t}
          stageLabel={t.riasecStage}
          progress={`${rIdx + 1}/${riasecQs.length}`}
          q={riasecQs[rIdx]}
          selected={rSel}
          onSelect={setRSel}
          onNext={nextRiasec}
        />
      )}

      {stage === 'result' && result && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fff',
                border: '1.5px solid var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>{t.congratsTag}</div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>{t.matchedTrack}</div>
          <div className="card" style={{ borderColor: 'var(--color-accent)', marginBottom: 14 }}>
            <span className="tag tag-outline" style={{ alignSelf: 'flex-start' }}>
              {t.hollandCode}: {result.code}
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>{result.title}</div>
            <p className="card-body">{result.desc}</p>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>{t.growthMap}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {result.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-accent-700)', flex: 'none' }}>{i + 1}</span>
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={resetAll} className="btn btn-secondary btn-block">
            {t.retakeTest}
          </button>
        </>
      )}
    </div>
  );
}
