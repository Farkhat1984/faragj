import {
  AlarmClock,
  CircleStop,
  Crown,
  Hourglass,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Sparkles
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type {
  AssetKind,
  EventCard,
  InvestDifficulty,
  InvestGameConfig,
  InvestPublicState
} from './investTypes';

type InvestMeta = {
  firstYear: number;
  lastYear: number;
  defaults: InvestGameConfig;
  kindPresets: Record<InvestDifficulty, AssetKind[]>;
};

const PHASE_LABELS: Record<string, string> = {
  'invest-briefing': 'Брифинг',
  'invest-trading': 'Торговля',
  'invest-event-reveal': 'Событие',
  'invest-results': 'Результаты',
  'invest-final': 'Финал'
};

function formatUsd(n: number) {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function InvestAdminView({
  state,
  token,
  participantsCount
}: {
  state: InvestPublicState;
  token: string;
  participantsCount: number;
}) {
  const [meta, setMeta] = useState<InvestMeta | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<InvestMeta>('/api/invest/meta').then(
      (m) => { if (!cancelled) setMeta(m); },
      (e) => { if (!cancelled) setError((e as Error).message); }
    );
    return () => { cancelled = true; };
  }, []);

  if (state.active) {
    return (
      <InvestLiveControl
        state={state}
        token={token}
        onError={setError}
        error={error}
        loading={loading}
        setLoading={setLoading}
      />
    );
  }

  if (!meta) {
    return (
      <section className="inv-card">
        <p className="inv-text-muted">{error || 'Загружаем настройки...'}</p>
      </section>
    );
  }

  return (
    <InvestSetup
      meta={meta}
      token={token}
      participantsCount={participantsCount}
      onError={setError}
      error={error}
      loading={loading}
      setLoading={setLoading}
    />
  );
}

// ============================================================
// Setup wizard
// ============================================================

function InvestSetup({
  meta,
  token,
  participantsCount,
  onError,
  error,
  loading,
  setLoading
}: {
  meta: InvestMeta;
  token: string;
  participantsCount: number;
  onError: (msg: string) => void;
  error: string;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const [config, setConfig] = useState<InvestGameConfig>(meta.defaults);

  // При смене difficulty подгружаем preset активов
  useEffect(() => {
    setConfig((c) => ({ ...c, allowedKinds: meta.kindPresets[c.difficulty] }));
  }, [config.difficulty, meta.kindPresets]);

  const years = config.endYear - config.startYear + 1;
  const totalSeconds = years * (config.briefingSeconds + config.tradingSeconds + config.eventRevealSeconds + config.resultsSeconds);
  const minutes = Math.round(totalSeconds / 60);

  async function start() {
    setLoading(true);
    onError('');
    try {
      await api('/api/admin/invest/start', {
        method: 'POST',
        body: JSON.stringify(config)
      }, token);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof InvestGameConfig>(key: K, value: InvestGameConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  return (
    <div className="inv-admin">
      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 12 }}>
          <Settings size={14} /> Настройка партии
        </div>

        <div className="inv-admin-setup">
          <div className="inv-admin-form">
            <div className="inv-admin-form__row">
              <label>
                Начальный год
                <input
                  type="number"
                  min={meta.firstYear}
                  max={meta.lastYear - 1}
                  value={config.startYear}
                  onChange={(e) => setField('startYear', Math.max(meta.firstYear, Math.min(meta.lastYear - 1, Number(e.target.value))))}
                />
              </label>
              <label>
                Конечный год
                <input
                  type="number"
                  min={config.startYear + 1}
                  max={meta.lastYear}
                  value={config.endYear}
                  onChange={(e) => setField('endYear', Math.max(config.startYear + 1, Math.min(meta.lastYear, Number(e.target.value))))}
                />
              </label>
              <label>
                Сложность
                <select
                  value={config.difficulty}
                  onChange={(e) => setField('difficulty', e.target.value as InvestDifficulty)}
                >
                  <option value="easy">🟢 Easy — кэш, депозиты, золото, индексы</option>
                  <option value="normal">🟡 Normal — всё включено, codename выкл</option>
                  <option value="hard">🔴 Hard — всё включено + codename</option>
                </select>
              </label>
            </div>

            <div className="inv-admin-form__row">
              <label>
                Стартовый капитал USD
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={config.startUsd}
                  onChange={(e) => setField('startUsd', Number(e.target.value))}
                />
              </label>
              <label>
                Стартовый капитал KZT
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={config.startKzt}
                  onChange={(e) => setField('startKzt', Number(e.target.value))}
                />
              </label>
              <label className="inv-admin-form__check">
                <input
                  type="checkbox"
                  checked={config.codenameMode}
                  onChange={(e) => setField('codenameMode', e.target.checked)}
                />
                <span>Codename mode — скрыть имена компаний и индексов</span>
              </label>
            </div>

            <div className="inv-admin-form__row">
              <label>
                Лимит на актив, %
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={config.capPerAssetPct}
                  onChange={(e) => setField('capPerAssetPct', Number(e.target.value))}
                />
              </label>
              <label>
                Лимит на сектор, %
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={config.capPerSectorPct}
                  onChange={(e) => setField('capPerSectorPct', Number(e.target.value))}
                />
              </label>
              <label className="inv-admin-form__check">
                <input
                  type="checkbox"
                  checked={config.enableAltHistory}
                  onChange={(e) => setField('enableAltHistory', e.target.checked)}
                />
                <span>Альтернативная история</span>
              </label>
            </div>

            <div className="inv-admin-form__row">
              <label>
                Брифинг, сек
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.briefingSeconds}
                  onChange={(e) => setField('briefingSeconds', Number(e.target.value))}
                />
              </label>
              <label>
                Торговля, сек
                <input
                  type="number"
                  min="20"
                  max="600"
                  value={config.tradingSeconds}
                  onChange={(e) => setField('tradingSeconds', Number(e.target.value))}
                />
              </label>
              <label>
                Раскрытие событий, сек
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={config.eventRevealSeconds}
                  onChange={(e) => setField('eventRevealSeconds', Number(e.target.value))}
                />
              </label>
              <label>
                Результаты, сек
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.resultsSeconds}
                  onChange={(e) => setField('resultsSeconds', Number(e.target.value))}
                />
              </label>
            </div>

            {error && <p style={{ color: 'var(--inv-red-dark)', margin: 0 }}>{error}</p>}

            <div className="inv-admin-actions">
              <button
                className="primary-button"
                disabled={loading || participantsCount === 0}
                onClick={start}
              >
                <Play size={18} />
                {loading ? 'Запускаем...' : participantsCount === 0 ? 'Подключи игроков' : `Запустить (${participantsCount} игроков)`}
              </button>
            </div>
          </div>

          <aside className="inv-admin-summary">
            <h3>Превью партии</h3>
            <ul>
              <li><span>Период:</span> <strong>{config.startYear}–{config.endYear}</strong></li>
              <li><span>Лет:</span> <strong>{years}</strong></li>
              <li><span>Старт капитал:</span> <strong>{formatUsd(config.startUsd)} + ₸{config.startKzt.toLocaleString('ru-RU')}</strong></li>
              <li><span>Расчётное время:</span> <strong>~{minutes} мин</strong></li>
              <li><span>Codename:</span> <strong>{config.codenameMode ? 'вкл' : 'выкл'}</strong></li>
              <li><span>Alt-history:</span> <strong>{config.enableAltHistory ? `${config.altHistoryCount} карт` : 'выкл'}</strong></li>
              <li><span>Активов:</span> <strong>{config.allowedKinds.length} классов</strong></li>
            </ul>

            <p className="inv-text-muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>
              Когда нажмёшь «Запустить» — у всех подключённых игроков начнётся первый год.
              Можно ускорять/пропускать фазы вручную.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Live control
// ============================================================

function InvestLiveControl({
  state,
  token,
  onError,
  error,
  loading,
  setLoading
}: {
  state: InvestPublicState;
  token: string;
  onError: (m: string) => void;
  error: string;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const now = useNow();
  const remaining = state.phaseEndsAt ? Math.max(0, state.phaseEndsAt - now) : 0;
  const seconds = Math.ceil(remaining / 1000);

  async function nextPhase() {
    setLoading(true);
    onError('');
    try {
      await api('/api/admin/invest/next-phase', { method: 'POST' }, token);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function abort() {
    if (!window.confirm('Завершить инвест-игру? Все прогрессы будут потеряны.')) return;
    setLoading(true);
    onError('');
    try {
      await api('/api/admin/invest/abort', { method: 'POST' }, token);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const phaseLabel = state.phase ? PHASE_LABELS[state.phase] ?? state.phase : '—';

  return (
    <div className="inv-admin">
      <section className="inv-admin-live-state">
        <div className="inv-admin-live-state__year">
          <span>Год</span>
          <strong>{state.game?.currentYear ?? '—'} / {state.game?.config.endYear ?? '—'}</strong>
        </div>
        <div className="inv-admin-live-state__phase">
          <Hourglass size={16} />
          {phaseLabel}
          {state.phaseEndsAt && <span style={{ marginLeft: 8, opacity: 0.7 }}>{seconds}c</span>}
        </div>
      </section>

      {error && (
        <section className="inv-card" style={{ background: 'var(--inv-red-soft)', borderColor: '#fecdd3' }}>
          <p style={{ color: 'var(--inv-red-dark)', margin: 0 }}>{error}</p>
        </section>
      )}

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 12 }}>
          <Settings size={14} /> Управление
        </div>
        <div className="inv-admin-actions">
          <button className="primary-button" onClick={nextPhase} disabled={loading || state.phase === 'invest-final'}>
            <SkipForward size={18} /> Следующая фаза
          </button>
          <button className="danger-button" onClick={abort} disabled={loading}>
            <CircleStop size={18} /> Завершить игру
          </button>
        </div>
      </section>

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 10 }}>
          <Sparkles size={14} /> Игроки ({state.participants.length})
        </div>
        <div className="inv-leaderboard">
          {state.participants.map((p, i) => {
            const lbRow = state.leaderboard.find((r) => r.participantId === p.participantId);
            return (
              <div key={p.participantId} className="inv-leader-row">
                <span className="inv-leader-row__rank">{lbRow?.rank ?? i + 1}</span>
                <strong>
                  {p.online ? '🟢' : '⚫'} {p.nickname} {p.pendingOrderSubmitted ? '✅' : ''}
                </strong>
                <span className="inv-leader-row__bal">{formatUsd(p.totalUsd)}</span>
                <span className={`inv-leader-row__delta ${(lbRow?.yearReturnPct ?? 0) > 0.5 ? 'is-up' : (lbRow?.yearReturnPct ?? 0) < -0.5 ? 'is-down' : 'is-flat'}`}>
                  {lbRow ? (lbRow.yearReturnPct >= 0 ? '+' : '') + lbRow.yearReturnPct.toFixed(1) + '%' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {state.phase === 'invest-briefing' || state.phase === 'invest-trading' ? (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 10 }}>
            <AlarmClock size={14} /> Текущие новости
          </div>
          <div className="inv-news-grid">
            {state.currentEvents.length === 0 ? (
              <p className="inv-text-muted">Нет новостей в этом году</p>
            ) : (
              state.currentEvents.map((ev) => (
                <article
                  key={ev.id}
                  className={`inv-news inv-news--${ev.type === 'fake' ? 'fake' : ev.tone}`}
                >
                  <header className="inv-news__head">
                    <h3 className="inv-news__title">{ev.title}</h3>
                    <span className={`inv-pill inv-pill--${ev.type === 'fake' ? 'fake' : ev.tone}`}>
                      {ev.type === 'fake' ? 'Фейк' : ev.tone}
                    </span>
                  </header>
                  <p className="inv-news__body">{ev.description}</p>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {state.phase === 'invest-final' && state.game?.altHistoryActive && state.game.altHistoryActive.length > 0 ? (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 10 }}>
            <Crown size={14} /> Альт-история этой партии
          </div>
          <div className="inv-althistory-reveal">
            {state.game.altHistoryActive.map((m) => (
              <div className="inv-althistory-row" key={m.id}>
                <strong>{m.title}</strong>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
