import { useState } from 'react';
import { Strings, Lang } from '../../i18n';
import { Goal, api } from '../../api';
import { BackHeader } from '../BackHeader';
import { formatLongDateWithWeekday } from '../../dateFmt';

type ModalStep = 'form' | 'confirm' | 'bulk';

interface HistoryItem {
  id: string;
  text: string;
  done: boolean;
}

const DURATIONS = ['haftalik', 'oylik', 'yillik'] as const;
const SPLIT_COUNT: Record<(typeof DURATIONS)[number], number> = { haftalik: 7, oylik: 30, yillik: 12 };

const COUNTER_RE = / \(\d+\/\d+\)$/;
function stripCounter(g: Goal): string {
  return g.recurring ? g.text.replace(COUNTER_RE, '') : g.text;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, deltaDays: number) {
  const d = new Date(dateKey + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function MaqsadScreen({
  t,
  lang,
  goals,
  goalsDoneN,
  onBack,
  onGoalsChanged,
}: {
  t: Strings;
  lang: Lang;
  goals: Goal[];
  goalsDoneN: number;
  onBack: () => void;
  onGoalsChanged: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('form');
  const [modalDraft, setModalDraft] = useState('');
  const [modalDuration, setModalDuration] = useState<(typeof DURATIONS)[number]>('haftalik');
  const [bulkPlan, setBulkPlan] = useState<string[]>([]);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalEditText, setGoalEditText] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDate, setHistoryDate] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  async function addGoal() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await api.post('/goals', { text: draft.trim(), source: 'matn' });
      setDraft('');
      onGoalsChanged();
    } finally {
      setBusy(false);
    }
  }

  async function toggleGoal(id: string) {
    await api.patch(`/goals/${id}/toggle`);
    onGoalsChanged();
  }

  async function deleteGoal(id: string) {
    await api.del(`/goals/${id}`);
    onGoalsChanged();
  }

  function startGoalEdit(g: Goal) {
    setEditingGoalId(g.id);
    setGoalEditText(stripCounter(g));
  }

  async function commitGoalEdit(g: Goal) {
    const text = goalEditText.trim();
    setEditingGoalId(null);
    if (!text || text === stripCounter(g)) return;
    await api.patch(`/goals/history/${todayKey()}/${g.id}`, { text });
    onGoalsChanged();
  }

  function openModal() {
    setShowModal(true);
    setModalStep('form');
    setModalDraft('');
    setModalDuration('haftalik');
    setBulkPlan([]);
  }

  function goToBulk() {
    setBulkPlan(Array(SPLIT_COUNT[modalDuration]).fill(''));
    setModalStep('bulk');
  }

  async function confirmBulk() {
    setBusy(true);
    try {
      const plan = bulkPlan.map((s) => s.trim() || modalDraft.trim());
      await api.post('/goals/recurring', { text: modalDraft.trim(), duration: modalDuration, split: true, plan });
      onGoalsChanged();
      setShowModal(false);
    } finally {
      setBusy(false);
    }
  }

  async function declineSplit() {
    setBusy(true);
    try {
      await api.post('/goals/recurring', { text: modalDraft.trim(), duration: modalDuration, split: false });
      onGoalsChanged();
      setShowModal(false);
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory(date: string) {
    setHistoryDate(date);
    setHistoryLoading(true);
    setEditingId(null);
    try {
      const { items } = await api.get<{ items: HistoryItem[] }>(`/goals/history/${date}`);
      setHistoryItems(items);
    } finally {
      setHistoryLoading(false);
    }
  }

  function openHistory(date?: string) {
    setHistoryOpen(true);
    loadHistory(date || todayKey());
  }

  function closeHistory() {
    setHistoryOpen(false);
    setEditingId(null);
  }

  function shiftHistory(deltaDays: number) {
    const next = shiftDateKey(historyDate, deltaDays);
    if (next > todayKey()) return;
    loadHistory(next);
  }

  async function toggleHistoryItem(item: HistoryItem) {
    const { item: updated } = await api.patch<{ item: HistoryItem }>(`/goals/history/${historyDate}/${item.id}`, {
      done: !item.done,
    });
    setHistoryItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    if (historyDate === todayKey()) onGoalsChanged();
  }

  function startEdit(item: HistoryItem) {
    setEditingId(item.id);
    setEditText(item.text);
  }

  async function commitEdit(item: HistoryItem) {
    const text = editText.trim();
    setEditingId(null);
    if (!text || text === item.text) return;
    const { item: updated } = await api.patch<{ item: HistoryItem }>(`/goals/history/${historyDate}/${item.id}`, { text });
    setHistoryItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    if (historyDate === todayKey()) onGoalsChanged();
  }

  const isHistoryToday = historyDate === todayKey();

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <BackHeader t={t} onBack={onBack} />
        <div
          onClick={() => openHistory()}
          aria-label={t.historyTitle}
          title={t.historyTitle}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid var(--color-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 'none',
            color: 'var(--color-accent-700)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </div>
      </div>
      <h2 style={{ fontSize: 22, marginBottom: 2 }}>{t.todayGoal}</h2>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>{t.today}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>{t.todayList}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, opacity: 0.55 }}>
            {goalsDoneN}/{goals.length}
          </span>
          <div
            onClick={openModal}
            aria-label={t.newGoal}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#fff',
              border: '1.5px solid var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flex: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
        {goals.map((g, i) => (
          <div
            key={g.id}
            className={`qn-opt${g.done ? ' is-selected' : ''}`}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.5, flex: 'none', minWidth: 14 }}>{i + 1}.</span>
            <span
              onClick={() => toggleGoal(g.id)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 3,
                border: '1.5px solid var(--color-divider)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                cursor: 'pointer',
                background: g.done ? 'var(--color-accent)' : 'transparent',
              }}
            >
              {g.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              )}
            </span>
            {editingGoalId === g.id ? (
              <input
                autoFocus
                className="input"
                style={{ flex: 1, fontSize: 13, padding: '5px 8px' }}
                value={goalEditText}
                onChange={(e) => setGoalEditText(e.target.value)}
                onBlur={() => commitGoalEdit(g)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditingGoalId(null);
                }}
              />
            ) : (
              <span
                onClick={() => startGoalEdit(g)}
                style={{ fontSize: 13.5, flex: 1, cursor: 'text', textDecoration: g.done ? 'line-through' : 'none' }}
              >
                {g.text}
              </span>
            )}
            <span
              onClick={() => deleteGoal(g.id)}
              aria-label={t.deleteGoal}
              style={{
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                cursor: 'pointer',
                opacity: 0.45,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>{t.addToList}</div>

      <div className="field" style={{ marginBottom: 8 }}>
        <textarea
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.goalPlaceholder}
          style={{ minHeight: 60, resize: 'vertical' }}
        />
      </div>
      <button type="button" onClick={addGoal} disabled={!draft.trim() || busy} className="btn btn-primary btn-block">
        {t.addToList}
      </button>

      {showModal && (
        <div className="dialog-backdrop">
          <div className="dialog">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="dialog-title">{t.newGoal}</div>
              <div
                onClick={() => setShowModal(false)}
                style={{ cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
            </div>

            {modalStep === 'form' && (
              <>
                <div className="field">
                  <textarea
                    className="input"
                    value={modalDraft}
                    onChange={(e) => setModalDraft(e.target.value)}
                    placeholder={t.modalGoalPlaceholder}
                    style={{ minHeight: 56, resize: 'vertical' }}
                  />
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55, margin: '8px 0 6px' }}>
                  {t.durationLabel}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {DURATIONS.map((d) => (
                    <div
                      key={d}
                      onClick={() => setModalDuration(d)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '7px 4px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 11,
                        background: modalDuration === d ? 'var(--color-accent)' : 'transparent',
                        color: modalDuration === d ? '#fdfdfc' : 'var(--color-text)',
                        border: '1px solid var(--color-divider)',
                      }}
                    >
                      {t[`dur_${d}` as 'dur_haftalik']}
                    </div>
                  ))}
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    {t.no}
                  </button>
                  <button type="button" className="btn btn-primary" disabled={!modalDraft.trim()} onClick={() => setModalStep('confirm')}>
                    {t.continueBtn}
                  </button>
                </div>
              </>
            )}

            {modalStep === 'confirm' && (
              <>
                <p className="dialog-body">{t.dailyAddConfirm}</p>
                <div className="dialog-actions">
                  <button type="button" className="btn btn-secondary" disabled={busy} onClick={declineSplit}>
                    {t.no}
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={goToBulk}>
                    {t.yes}
                  </button>
                </div>
              </>
            )}

            {modalStep === 'bulk' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflow: 'auto', marginBottom: 14 }}>
                  {bulkPlan.map((val, i) => (
                    <div key={i} style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                      <div style={{ fontSize: 10.5, opacity: 0.55, marginBottom: 4 }}>
                        {modalDraft} — {i + 1}/{bulkPlan.length}
                      </div>
                      <textarea
                        className="input"
                        value={val}
                        onChange={(e) => {
                          const next = [...bulkPlan];
                          next[i] = e.target.value;
                          setBulkPlan(next);
                        }}
                        placeholder={t.modalGoalPlaceholder}
                        style={{ minHeight: 40, fontSize: 13, resize: 'vertical' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setModalStep('confirm')}>
                    {t.back}
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmBulk}>
                    {t.startPlan}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="dialog-backdrop">
          <div className="dialog">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div className="dialog-title">{t.historyTitle}</div>
              <div
                onClick={closeHistory}
                style={{ cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 14px' }}>
              <div
                onClick={() => shiftHistory(-1)}
                aria-label="prev"
                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  {isHistoryToday ? t.historyToday : formatLongDateWithWeekday(historyDate, lang)}
                </div>
              </div>
              <div
                onClick={() => shiftHistory(1)}
                aria-label="next"
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isHistoryToday ? 'default' : 'pointer',
                  opacity: isHistoryToday ? 0.25 : 1,
                  flex: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>
            </div>

            {historyLoading && <p className="dialog-body">{t.loading}</p>}

            {!historyLoading && historyItems.length === 0 && <p className="dialog-body">{t.historyEmpty}</p>}

            {!historyLoading && historyItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflow: 'auto' }}>
                {historyItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="qn-opt"
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      border: '1px solid var(--color-divider)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 11px',
                    }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.5, flex: 'none', minWidth: 14 }}>{i + 1}.</span>
                    <span
                      onClick={() => toggleHistoryItem(item)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        border: '1.5px solid var(--color-divider)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                        cursor: 'pointer',
                        background: item.done ? 'var(--color-accent)' : 'transparent',
                      }}
                    >
                      {item.done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12l5 5L20 6" />
                        </svg>
                      )}
                    </span>
                    {editingId === item.id ? (
                      <input
                        autoFocus
                        className="input"
                        style={{ flex: 1, fontSize: 13, padding: '5px 8px' }}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => commitEdit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(item)}
                        title={t.historyEditHint}
                        style={{
                          fontSize: 13.5,
                          flex: 1,
                          cursor: 'text',
                          textDecoration: item.done ? 'line-through' : 'none',
                          opacity: item.done ? 0.65 : 1,
                        }}
                      >
                        {item.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
