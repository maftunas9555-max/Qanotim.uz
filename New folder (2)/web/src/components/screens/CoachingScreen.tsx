import { useEffect, useState } from 'react';
import { Strings } from '../../i18n';
import { api, Analysis, ChatMessage } from '../../api';
import { BackHeader } from '../BackHeader';

interface Question {
  q: string;
  options: string[];
}

type Stage = 'loading' | 'ask' | 'submitting' | 'summary' | 'declined' | 'chat';

const LETTERS = ['A', 'B', 'C', 'D'];

export function CoachingScreen({
  t,
  lang,
  onBack,
  onCompleted,
}: {
  t: Strings;
  lang: 'uz' | 'ru';
  onBack: () => void;
  onCompleted: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stage, setStage] = useState<Stage>('loading');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [summaryRows, setSummaryRows] = useState<{ qNum: string; answerText: string }[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ session: { sessionId: string; analysis: Analysis; summaryRows: typeof summaryRows; messages: ChatMessage[] } | null }>(
        '/coaching/latest'
      )
      .then((r) => {
        if (r.session) {
          setSessionId(r.session.sessionId);
          setAnalysis(r.session.analysis);
          setSummaryRows(r.session.summaryRows);
          if (r.session.messages.length > 0) {
            setMessages(r.session.messages);
            setStage('chat');
          } else {
            setStage('summary');
          }
          return;
        }
        api.get<{ questions: Question[] }>('/coaching/questions').then((r2) => {
          setQuestions(r2.questions);
          setStage('ask');
        });
      });
  }, []);

  async function next() {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
      return;
    }
    setStage('submitting');
    const r = await api.post<{ sessionId: string; analysis: Analysis; summaryRows: typeof summaryRows }>('/coaching/submit', {
      answers: nextAnswers,
    });
    setSessionId(r.sessionId);
    setAnalysis(r.analysis);
    setSummaryRows(r.summaryRows);
    setStage('summary');
    onCompleted();
  }

  async function acceptChat() {
    if (!sessionId) return;
    setChatBusy(true);
    setChatError(null);
    try {
      const r = await api.post<{ messages: ChatMessage[] }>(`/coaching/${sessionId}/start-chat`, { lang });
      setMessages(r.messages);
      setStage('chat');
    } catch (err) {
      setChatError(t.coachUnavailable);
    } finally {
      setChatBusy(false);
    }
  }

  async function sendChat() {
    if (!chatDraft.trim() || !sessionId || chatBusy) return;
    const userMsg: ChatMessage = { role: 'user', text: chatDraft.trim() };
    setMessages((m) => [...m, userMsg]);
    setChatDraft('');
    setChatBusy(true);
    setChatError(null);
    try {
      const r = await api.post<{ reply: string }>(`/coaching/${sessionId}/message`, { text: userMsg.text, lang });
      setMessages((m) => [...m, { role: 'assistant', text: r.reply }]);
    } catch (err) {
      setChatError(t.coachUnavailable);
    } finally {
      setChatBusy(false);
    }
  }

  if (stage === 'loading' || stage === 'submitting') {
    return (
      <div>
        <BackHeader t={t} onBack={onBack} />
        <div className="text-muted">{t.loading}</div>
      </div>
    );
  }

  if (stage === 'ask') {
    const cq = questions[idx];
    return (
      <div>
        <BackHeader t={t} onBack={onBack} />
        <div className="tag tag-outline" style={{ marginBottom: 10 }}>
          {t.coachingTag} · {idx + 1}/{questions.length}
        </div>
        <h2 style={{ fontSize: 21, lineHeight: 1.25, marginBottom: 16 }}>{cq.q}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {cq.options.map((text, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`qn-opt${selected === i ? ' is-selected' : ''}`}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 13px',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 21,
                  height: 21,
                  borderRadius: '50%',
                  border: '1.5px solid var(--color-divider)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {LETTERS[i]}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.4, paddingTop: 2 }}>{text}</span>
            </div>
          ))}
        </div>
        {selected !== null && (
          <button type="button" onClick={next} className="btn btn-primary btn-block">
            {idx === questions.length - 1 ? t.seeAnalysis : t.nextQuestion}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (stage === 'summary' && analysis) {
    return (
      <div>
        <BackHeader t={t} onBack={onBack} />
        <div style={{ background: 'linear-gradient(160deg, oklch(93% 0.05 195), oklch(95% 0.04 150))', borderRadius: 'var(--radius-lg)', padding: 16, margin: '-4px -4px 16px' }}>
          <div className="card-kicker" style={{ marginBottom: 6 }}>
            {t.analysisTag}
          </div>
          <h2 style={{ fontSize: 19, marginBottom: 12 }}>{t.analysisTitle}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 190, overflow: 'auto', marginBottom: 14, background: '#fdfdfc', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
            {summaryRows.map((row, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--color-divider)', padding: '6px 2px' }}>
                <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 2 }}>{row.qNum}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>{row.answerText}</div>
              </div>
            ))}
          </div>

          {analysis.main && (
            <div className="card" style={{ borderColor: 'var(--color-accent)', marginBottom: 10 }}>
              <div className="card-kicker">{analysis.main.title}</div>
              <p className="card-body">{analysis.main.body}</p>
            </div>
          )}
          {analysis.second && (
            <div className="card" style={{ marginBottom: 10 }}>
              <div className="card-kicker">{analysis.second.title}</div>
              <p className="card-body">{analysis.second.body}</p>
            </div>
          )}
          {analysis.hasStrength && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-kicker">{t.strengthTag}</div>
              <p className="card-body">
                {t.strengthBody} ({analysis.strengthCites})
              </p>
            </div>
          )}
          <div className="card-kicker" style={{ marginBottom: 6 }}>
            {t.conclusionTag}
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.9, margin: 0 }}>{analysis.conclusion}</p>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.85, marginBottom: 16 }}>{t.coachOffer}</p>
        {chatError && <p style={{ fontSize: 12.5, color: 'var(--color-accent-700)', marginBottom: 10 }}>{chatError}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={acceptChat} disabled={chatBusy} className="btn btn-primary" style={{ flex: 1 }}>
            {t.yes}
          </button>
          <button type="button" onClick={() => setStage('declined')} className="btn btn-secondary" style={{ flex: 1 }}>
            {t.no}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'declined') {
    return (
      <div>
        <BackHeader t={t} onBack={onBack} />
        <div className="card-kicker" style={{ marginBottom: 8 }}>
          {t.analysisTag}
        </div>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>{t.laterTitle}</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.85, marginBottom: 18 }}>{t.laterBody}</p>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-block">
          {t.backHome}
        </button>
      </div>
    );
  }

  // chat
  return (
    <div>
      <BackHeader t={t} onBack={onBack} />
      <div className="tag tag-accent" style={{ marginBottom: 10 }}>
        {t.chatTag}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: '82%',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginLeft: m.role === 'user' ? 'auto' : 0,
              background: m.role === 'user' ? 'var(--color-accent)' : '#fff',
              color: m.role === 'user' ? '#fdfdfc' : 'var(--color-text)',
              border: m.role === 'user' ? 'none' : '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 12px',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {m.text}
          </div>
        ))}
        {chatBusy && <div className="text-muted" style={{ fontSize: 12 }}>{t.coachThinking}</div>}
        {chatError && <div style={{ fontSize: 12.5, color: 'var(--color-accent-700)' }}>{chatError}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          value={chatDraft}
          onChange={(e) => setChatDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          placeholder={t.chatPlaceholder}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={sendChat} disabled={chatBusy || !chatDraft.trim()} className="btn btn-primary btn-icon" aria-label="Send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
