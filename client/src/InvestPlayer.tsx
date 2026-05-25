import {
  Building2,
  Coins,
  Crown,
  Eye,
  EyeOff,
  Hourglass,
  Landmark,
  LineChart,
  Lock,
  Newspaper,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type {
  AssetCatalogItem,
  EventCard,
  InvestFinalSummary,
  InvestPlayerState,
  Portfolio
} from './investTypes';

// ============================================================
// Утилиты форматирования
// ============================================================

function formatUsd(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(decimals + 1)}M`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function formatUsdFull(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function formatPct(n: number, withSign = true): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 && withSign ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function toneClassPill(tone: EventCard['tone'] | 'fake'): string {
  if (tone === 'crisis') return 'inv-pill--crisis';
  if (tone === 'boom') return 'inv-pill--boom';
  if (tone === 'shock') return 'inv-pill--shock';
  if (tone === 'fake') return 'inv-pill--fake';
  return 'inv-pill--neutral';
}

function toneClassNews(card: EventCard): string {
  if (card.type === 'fake') return 'inv-news--fake';
  if (card.tone === 'crisis') return 'inv-news--crisis';
  if (card.tone === 'boom') return 'inv-news--boom';
  if (card.tone === 'shock') return 'inv-news--shock';
  return 'inv-news--neutral';
}

function toneLabel(card: EventCard): string {
  if (card.type === 'fake') return 'Слух';
  if (card.tone === 'crisis') return 'Кризис';
  if (card.tone === 'boom') return 'Бум';
  if (card.tone === 'shock') return 'Шок';
  return 'Новость';
}

// Палитра для pie chart
const ALLOC_PALETTE = [
  '#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626',
  '#0891b2', '#db2777', '#65a30d', '#9333ea', '#0d9488',
  '#ea580c', '#475569', '#10b981', '#f59e0b', '#ef4444'
];

function colorForAsset(assetId: string): string {
  let hash = 0;
  for (let i = 0; i < assetId.length; i++) hash = (hash * 31 + assetId.charCodeAt(i)) | 0;
  return ALLOC_PALETTE[Math.abs(hash) % ALLOC_PALETTE.length];
}

// ============================================================
// Тикер таймера
// ============================================================

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  return now;
}

function TimerChip({ endsAt }: { endsAt: number | null }) {
  const now = useNow();
  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const seconds = Math.ceil(remaining / 1000);
  const urgent = remaining > 0 && remaining < 8000;
  return (
    <div className={`inv-trading-header__timer${urgent ? ' is-urgent' : ''}`}>
      <Hourglass size={16} />
      <span>{endsAt ? `${seconds}c` : '—'}</span>
    </div>
  );
}

// ============================================================
// Pie chart портфеля
// ============================================================

type AllocEntry = { assetId: string; label: string; value: number; pct: number; color: string };

function buildAllocEntries(allocation: Record<string, number>, catalog: AssetCatalogItem[], total: number): AllocEntry[] {
  const entries: AllocEntry[] = [];
  for (const [id, value] of Object.entries(allocation)) {
    if (value <= 0) continue;
    const asset = catalog.find((a) => a.id === id);
    const label = asset?.displayName ?? (id === 'cash_usd' ? 'Наличные USD' : id);
    entries.push({
      assetId: id,
      label,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
      color: id === 'cash_usd' ? '#94a3b8' : colorForAsset(id)
    });
  }
  entries.sort((a, b) => b.value - a.value);
  return entries;
}

function PortfolioPie({ entries, total, real }: { entries: AllocEntry[]; total: number; real?: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="inv-portfolio-pie">
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="20" />
        {entries.map((e) => {
          const dash = (e.pct / 100) * circumference;
          const circle = (
            <circle
              key={e.assetId}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={e.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="inv-portfolio-pie__center">
        <span>Капитал</span>
        <strong>{formatUsd(total)}</strong>
        {real !== undefined && <em>{formatUsd(real)} реал.</em>}
      </div>
    </div>
  );
}

function AllocationLegend({ entries }: { entries: AllocEntry[] }) {
  if (entries.length === 0) {
    return <p className="inv-text-muted">Портфель пуст</p>;
  }
  return (
    <div className="inv-allocation-legend">
      {entries.slice(0, 8).map((e) => (
        <div className="inv-allocation-legend__row" key={e.assetId}>
          <span className="inv-allocation-legend__dot" style={{ background: e.color }} />
          <strong>{e.label}</strong>
          <em>{formatUsd(e.value)}</em>
          <span>{e.pct.toFixed(0)}%</span>
        </div>
      ))}
      {entries.length > 8 && (
        <div className="inv-allocation-legend__row inv-text-muted" style={{ gridTemplateColumns: '1fr' }}>
          <span>… ещё {entries.length - 8} позиций</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Leaderboard
// ============================================================

function Leaderboard({ rows, selfId, max = 8 }: { rows: InvestPlayerState['leaderboard']; selfId: string; max?: number }) {
  return (
    <div className="inv-leaderboard">
      {rows.slice(0, max).map((row) => (
        <div key={row.participantId} className={`inv-leader-row${row.participantId === selfId ? ' is-self' : ''}`}>
          <span
            className={`inv-leader-row__rank${row.rank === 1 ? ' is-first' : row.rank === 2 ? ' is-second' : row.rank === 3 ? ' is-third' : ''}`}
          >
            {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
          </span>
          <strong>{row.nickname}</strong>
          <span className="inv-leader-row__bal">{formatUsd(row.totalUsd)}</span>
          <span
            className={`inv-leader-row__delta ${row.yearReturnPct > 0.5 ? 'is-up' : row.yearReturnPct < -0.5 ? 'is-down' : 'is-flat'}`}
          >
            {formatPct(row.yearReturnPct)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// BRIEFING screen
// ============================================================

function BriefingScreen({ state, selfId }: { state: InvestPlayerState; selfId: string }) {
  if (!state.game) return null;
  const portfolio = state.portfolio;
  const total = portfolio ? portfolio.cashUsd + portfolio.positions.reduce((s, p) => s + p.valueUsd, 0) : 0;
  const allocation: Record<string, number> = portfolio
    ? { cash_usd: portfolio.cashUsd, ...portfolio.positions.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.assetId]: (acc[p.assetId] ?? 0) + p.valueUsd }), {}) }
    : {};
  const entries = buildAllocEntries(allocation, state.catalog, total);
  const realTotal = portfolio?.history.at(-1)?.totalUsdReal ?? total;
  const yearsPassed = state.game.currentYear - state.game.startYear;
  const totalYears = state.game.endYear - state.game.startYear + 1;
  const progress = ((yearsPassed + 1) / totalYears) * 100;

  return (
    <div className="inv-shell">
      <section className="inv-hero">
        <div className="inv-hero__year">
          <strong>{state.game.currentYear}</strong>
          <div>
            <span className="inv-section-title">
              <Newspaper size={14} /> Год {yearsPassed + 1} из {totalYears}
            </span>
            <div className="inv-hero__progress">
              <span className="inv-hero__progress-bar" style={{ ['--progress' as never]: `${progress}%` }} />
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        <p className="inv-hero__sub">
          Что произошло в мире за год — и что может произойти. Через несколько секунд начнётся торговля.
        </p>
        <TimerChip endsAt={state.phaseEndsAt} />
      </section>

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 10 }}>
          <Newspaper size={14} /> Заголовки
        </div>
        <div className="inv-news-grid">
          {state.currentEvents.length === 0 ? (
            <p className="inv-text-muted">Спокойный год, новостей не приходит.</p>
          ) : (
            state.currentEvents.map((ev) => (
              <article key={ev.id} className={`inv-news ${toneClassNews(ev)}`}>
                <header className="inv-news__head">
                  <h3 className="inv-news__title">{ev.title}</h3>
                  <span className={`inv-pill ${toneClassPill(ev.type === 'fake' ? 'fake' : ev.tone)}`}>{toneLabel(ev)}</span>
                </header>
                <p className="inv-news__body">{ev.description}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 12 }}>
          <Wallet size={14} /> Твой портфель
        </div>
        <div className="inv-portfolio-summary">
          <PortfolioPie entries={entries} total={total} real={realTotal} />
          <AllocationLegend entries={entries} />
        </div>
      </section>

      {state.leaderboard.length > 1 && (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 10 }}>
            <Crown size={14} /> Лидерборд
          </div>
          <Leaderboard rows={state.leaderboard} selfId={selfId} />
        </section>
      )}
    </div>
  );
}

// ============================================================
// TRADING screen
// ============================================================

function getAssetGroupTitle(group: AssetCatalogItem['group']): string {
  switch (group) {
    case 'cash': return 'Наличные';
    case 'deposit': return 'Депозиты';
    case 'bond': return 'Облигации';
    case 'index': return 'Индексы';
    case 'equity': return 'Акции';
    case 'commodity': return 'Драгметаллы';
    case 'crypto': return 'Криптовалюта';
    case 'realestate': return 'Недвижимость';
  }
}

function getAssetGroupIcon(group: AssetCatalogItem['group']) {
  switch (group) {
    case 'cash':
    case 'deposit':
      return <PiggyBank size={14} />;
    case 'bond':
      return <Receipt size={14} />;
    case 'index':
      return <LineChart size={14} />;
    case 'equity':
      return <TrendingUp size={14} />;
    case 'commodity':
      return <Coins size={14} />;
    case 'crypto':
      return <Sparkles size={14} />;
    case 'realestate':
      return <Building2 size={14} />;
  }
}

const GROUP_ORDER: AssetCatalogItem['group'][] = ['cash', 'deposit', 'bond', 'index', 'equity', 'commodity', 'crypto', 'realestate'];

type PendingAllocation = Record<string, number>; // pct 0-100 per assetId

function buildInitialAllocationPct(portfolio: Portfolio | null, total: number): PendingAllocation {
  const alloc: PendingAllocation = {};
  if (!portfolio || total <= 0) {
    alloc.cash_usd = 100;
    return alloc;
  }
  alloc.cash_usd = (portfolio.cashUsd / total) * 100;
  for (const pos of portfolio.positions) {
    alloc[pos.assetId] = (alloc[pos.assetId] ?? 0) + (pos.valueUsd / total) * 100;
  }
  return alloc;
}

function TradingScreen({ state, selfId, onSubmit }: { state: InvestPlayerState; selfId: string; onSubmit: (a: Record<string, number>, total: number) => Promise<void> }) {
  const portfolio = state.portfolio;
  const total = portfolio ? portfolio.cashUsd + portfolio.positions.reduce((s, p) => s + p.valueUsd, 0) : 0;
  const [allocation, setAllocation] = useState<PendingAllocation>(() => buildInitialAllocationPct(portfolio, total));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Сброс при смене года
  useEffect(() => {
    setAllocation(buildInitialAllocationPct(portfolio, total));
    setError('');
  }, [state.game?.currentYear]);

  if (!state.game || !portfolio) return null;

  const allocated = Object.entries(allocation)
    .filter(([k]) => k !== 'cash_usd')
    .reduce((s, [, v]) => s + (v ?? 0), 0);
  const cashPct = Math.max(0, 100 - allocated);
  const over = allocated > 100.01;
  const submitted = portfolio.pendingOrder !== null;

  // Локированные позиции — minimum %
  const lockedMins: Record<string, number> = {};
  for (const pos of portfolio.positions) {
    if (pos.lockedUntilYear >= state.game.currentYear) {
      const pct = (pos.valueUsd / total) * 100;
      lockedMins[pos.assetId] = (lockedMins[pos.assetId] ?? 0) + pct;
    }
  }

  const catalogByGroup = useMemo(() => {
    const groups: Record<string, AssetCatalogItem[]> = {};
    for (const item of state.catalog) {
      if (item.id === 'cash_usd') continue;
      const arr = (groups[item.group] = groups[item.group] ?? []);
      arr.push(item);
    }
    return groups;
  }, [state.catalog]);

  function setAlloc(assetId: string, pct: number) {
    const min = lockedMins[assetId] ?? 0;
    const clamped = Math.max(min, Math.min(100, pct));
    setAllocation((prev) => ({ ...prev, [assetId]: clamped }));
  }

  function fillRest() {
    const allocSum = Object.entries(allocation)
      .filter(([k]) => k !== 'cash_usd')
      .reduce((s, [, v]) => s + (v ?? 0), 0);
    setAllocation((prev) => ({ ...prev, cash_usd: Math.max(0, 100 - allocSum) }));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const targetAlloc: Record<string, number> = {};
      let nonCashSum = 0;
      for (const [id, pct] of Object.entries(allocation)) {
        if (id === 'cash_usd') continue;
        if (pct > 0) {
          const usd = (total * pct) / 100;
          targetAlloc[id] = usd;
          nonCashSum += usd;
        }
      }
      targetAlloc.cash_usd = Math.max(0, total - nonCashSum);
      await onSubmit(targetAlloc, total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function useInsiderBrief(assetId: string) {
    try {
      await api('/api/invest/powerup/insider', {
        method: 'POST',
        body: JSON.stringify({ participantId: selfId, assetId })
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function useSkipYear() {
    try {
      await api('/api/invest/powerup/skip', {
        method: 'POST',
        body: JSON.stringify({ participantId: selfId })
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="inv-shell">
      <header className="inv-trading-header">
        <div className="inv-trading-header__year">
          <span>Год {state.game.currentYear}</span>
          <strong>{formatUsdFull(total)}</strong>
        </div>
        <TimerChip endsAt={state.phaseEndsAt} />
      </header>

      <div className="inv-trading">
        <div className="inv-shell">
          {GROUP_ORDER.map((group) => {
            const items = catalogByGroup[group];
            if (!items || items.length === 0) return null;
            return (
              <section key={group} className="inv-cat-group">
                <div className="inv-cat-group__title">
                  {getAssetGroupIcon(group)}
                  {getAssetGroupTitle(group)}
                </div>
                <div className="inv-asset-grid">
                  {items.map((asset) => (
                    <AssetTradeCard
                      key={asset.id}
                      asset={asset}
                      pct={allocation[asset.id] ?? 0}
                      lockedMin={lockedMins[asset.id]}
                      currentYear={state.game!.currentYear}
                      lastReturn={state.lastYearReturns[asset.id]}
                      isRevealed={portfolio.revealedAssets.includes(asset.id)}
                      onChange={(p) => setAlloc(asset.id, p)}
                      onReveal={portfolio.powerups.insiderBrief > 0 && !portfolio.revealedAssets.includes(asset.id) ? () => useInsiderBrief(asset.id) : null}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="inv-side">
          <div className="inv-side-balance">
            <span className="inv-side-balance__label">Текущий капитал</span>
            <span className="inv-side-balance__value">{formatUsdFull(total)}</span>
            {portfolio.history.length > 0 && (
              <span className={`inv-side-balance__delta ${portfolio.history.at(-1)!.yearReturnPct > 0 ? 'is-up' : portfolio.history.at(-1)!.yearReturnPct < 0 ? 'is-down' : ''}`}>
                {portfolio.history.at(-1)!.yearReturnPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {' '}за прошлый год: {formatPct(portfolio.history.at(-1)!.yearReturnPct)}
              </span>
            )}
          </div>

          <div className={`inv-alloc-progress${over ? ' is-over' : ''}`}>
            <div>
              <div className="inv-alloc-progress__bar" style={{ ['--alloc' as never]: `${Math.min(100, allocated).toFixed(1)}%` }} />
              <p className="inv-text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                Распределено: <strong className="inv-mono">{allocated.toFixed(0)}%</strong>, в кэше: <strong className="inv-mono">{cashPct.toFixed(0)}%</strong>
              </p>
            </div>
            <span className="inv-alloc-progress__pct">{Math.round(allocated)}%</span>
          </div>

          {error && <p style={{ color: 'var(--inv-red-dark)', fontSize: '0.88rem', margin: 0 }}>{error}</p>}

          <div className="inv-side-actions">
            <button
              type="button"
              className={`inv-submit-button${submitted ? ' is-locked-in' : ''}`}
              onClick={submit}
              disabled={over || submitting || submitted}
            >
              {submitted ? (
                <>
                  <ShieldCheck size={18} /> Ход зафиксирован
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> {submitting ? 'Отправка...' : 'Зафиксировать ход'}
                </>
              )}
            </button>

            <button
              type="button"
              className="inv-powerup"
              onClick={fillRest}
              disabled={submitted}
              style={{ textAlign: 'center' }}
            >
              <div className="inv-powerup__head">
                <strong style={{ fontSize: '0.85rem' }}>Авто-кэш</strong>
              </div>
              <p className="inv-powerup__hint">Остаток уйдёт в наличные USD</p>
            </button>
          </div>

          <div>
            <div className="inv-section-title" style={{ marginBottom: 8 }}>
              <Sparkles size={14} /> Карты стратегий
            </div>
            <div className="inv-powerups">
              <button
                type="button"
                className="inv-powerup"
                disabled={portfolio.powerups.skipYear <= 0 || submitted}
                onClick={useSkipYear}
              >
                <div className="inv-powerup__head">
                  <strong>⏳ Skip Year</strong>
                  <span className="inv-powerup__count">{portfolio.powerups.skipYear}</span>
                </div>
                <p className="inv-powerup__hint">Парковка в кэш без комиссий</p>
              </button>
              <div className="inv-powerup" style={{ cursor: 'default', opacity: 0.65 }}>
                <div className="inv-powerup__head">
                  <strong>🔍 Insider Brief</strong>
                  <span className="inv-powerup__count">{portfolio.powerups.insiderBrief}</span>
                </div>
                <p className="inv-powerup__hint">Нажми «👁» на карточке актива чтобы раскрыть</p>
              </div>
            </div>
          </div>

          <div>
            <div className="inv-section-title" style={{ marginBottom: 8 }}>
              <Crown size={14} /> Лидерборд
            </div>
            <Leaderboard rows={state.leaderboard} selfId={selfId} max={5} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function AssetTradeCard({
  asset,
  pct,
  lockedMin,
  currentYear,
  lastReturn,
  isRevealed,
  onChange,
  onReveal
}: {
  asset: AssetCatalogItem;
  pct: number;
  lockedMin?: number;
  currentYear: number;
  lastReturn?: number;
  isRevealed: boolean;
  onChange: (pct: number) => void;
  onReveal: (() => void) | null;
}) {
  const isUsedAndCodename = asset.kind === 'equity' || asset.kind === 'index';
  const isLocked = !!lockedMin && lockedMin > 0;
  const active = pct > 0;

  return (
    <div className={`inv-asset-card${active ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}>
      <div className="inv-asset-card__head">
        <div className="inv-asset-card__name">
          <strong>{asset.displayName}</strong>
          <small>{asset.sector}</small>
        </div>
        {typeof lastReturn === 'number' ? (
          <div className={`inv-asset-card__last ${lastReturn > 0.5 ? 'is-up' : lastReturn < -0.5 ? 'is-down' : ''}`}>
            {formatPct(lastReturn)}
          </div>
        ) : null}
      </div>

      <p className="inv-asset-card__hint">{isRevealed ? `${asset.realName}: ${asset.hintFull}` : asset.hintShort}</p>

      <div className="inv-asset-card__alloc">
        <input
          type="range"
          className="inv-asset-card__slider"
          min={lockedMin ?? 0}
          max={100}
          step="1"
          value={Math.round(pct)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="inv-asset-card__pct">{Math.round(pct)}%</span>
      </div>

      {isLocked && (
        <span className="inv-asset-card__lock">
          <Lock size={11} /> Заперт до {currentYear + (asset.lockYears - (currentYear - currentYear)) - 1}
        </span>
      )}

      {isUsedAndCodename && (
        <button
          type="button"
          className={`inv-asset-card__codename${isRevealed ? ' is-revealed' : ''}`}
          onClick={onReveal ?? undefined}
          disabled={!onReveal || isRevealed}
          title={isRevealed ? 'Раскрыт' : onReveal ? 'Раскрыть реальное имя (Insider Brief)' : 'Insider Brief закончились'}
          style={{ border: 0, cursor: onReveal && !isRevealed ? 'pointer' : 'default' }}
        >
          {isRevealed ? <Eye size={11} /> : <EyeOff size={11} />}
          {isRevealed ? 'раскрыт' : asset.refCode}
        </button>
      )}
    </div>
  );
}

// ============================================================
// EVENT REVEAL screen
// ============================================================

function EventRevealScreen({ state }: { state: InvestPlayerState }) {
  if (!state.game) return null;
  return (
    <div className="inv-shell">
      <section className="inv-event-stage">
        <div className="inv-section-title" style={{ justifyContent: 'center', marginBottom: 4 }}>
          <Newspaper size={14} /> Что случилось в {state.game.currentYear}
        </div>
        {state.currentEvents.length === 0 ? (
          <div className="inv-event-card inv-event-card--neutral">
            <h2 className="inv-event-card__title">Спокойный год</h2>
            <p className="inv-event-card__body">Ничего экстраординарного. Рынки шли своим чередом.</p>
          </div>
        ) : (
          state.currentEvents.map((ev, i) => (
            <div
              key={ev.id}
              className={`inv-event-card inv-event-card--${ev.tone}`}
              style={{ animationDelay: `${i * 0.18}s` }}
            >
              <h2 className="inv-event-card__title">{ev.title}</h2>
              <p className="inv-event-card__body">{ev.description}</p>
              {ev.effects.length > 0 && (
                <div className="inv-event-card__effects">
                  {ev.effects.map((eff, idx) => {
                    const dir = eff.multiplier > 1 ? 'up' : eff.multiplier < 1 ? 'down' : 'flat';
                    return (
                      <span key={idx} className={`inv-effect-chip is-${dir}`}>
                        {effectLabel(eff)} × {eff.multiplier.toFixed(2)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function effectLabel(eff: EventCard['effects'][number]): string {
  switch (eff.target.kind) {
    case 'ticker': return `Тикер ${eff.target.ticker}`;
    case 'sector': return `Сектор ${eff.target.sector}`;
    case 'index': return `Индекс ${eff.target.code}`;
    case 'asset': return `Актив ${eff.target.assetId}`;
  }
}

// ============================================================
// RESULTS screen
// ============================================================

function ResultsScreen({ state, selfId }: { state: InvestPlayerState; selfId: string }) {
  if (!state.game || !state.portfolio) return null;
  const last = state.portfolio.history.at(-1);
  if (!last) return null;
  const before = state.portfolio.history.length >= 2 ? state.portfolio.history.at(-2)!.totalUsd : last.totalUsd / (1 + last.yearReturnPct / 100);

  // Топ-5 движений по моим позициям
  const ownReturns: Array<{ assetId: string; name: string; ret: number }> = [];
  for (const pos of state.portfolio.positions) {
    const ret = state.lastYearReturns[pos.assetId];
    if (typeof ret === 'number') {
      const asset = state.catalog.find((a) => a.id === pos.assetId);
      ownReturns.push({ assetId: pos.assetId, name: asset?.displayName ?? pos.assetId, ret });
    }
  }
  ownReturns.sort((a, b) => b.ret - a.ret);

  const deltaClass = last.yearReturnPct > 0.5 ? 'is-up' : last.yearReturnPct < -0.5 ? 'is-down' : 'is-flat';

  return (
    <div className="inv-shell">
      <section className="inv-results-hero">
        <div className="inv-section-title" style={{ justifyContent: 'center' }}>
          <Repeat size={14} /> Год {state.game.currentYear} закрыт
        </div>
        <div className={`inv-results-hero__delta ${deltaClass}`}>{formatPct(last.yearReturnPct)}</div>
        <div className="inv-results-hero__sub">
          {formatUsd(before)} → <strong>{formatUsdFull(last.totalUsd)}</strong>
        </div>
        <p className="inv-text-muted" style={{ fontSize: '0.92rem' }}>
          В реальных долларах: {formatUsd(last.totalUsdReal)} (с учётом инфляции от {state.game.startYear})
        </p>
      </section>

      {ownReturns.length > 0 && (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 8 }}>
            <LineChart size={14} /> Доходности твоих позиций
          </div>
          <div className="inv-asset-returns">
            {ownReturns.map((r) => (
              <div className="inv-asset-return" key={r.assetId}>
                <strong>{r.name}</strong>
                <span className={r.ret > 0.5 ? 'is-up' : r.ret < -0.5 ? 'is-down' : 'is-flat'}>{formatPct(r.ret)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 10 }}>
          <Crown size={14} /> Лидерборд
        </div>
        <Leaderboard rows={state.leaderboard} selfId={selfId} />
      </section>

      <p className="inv-text-muted" style={{ textAlign: 'center', fontSize: '0.92rem' }}>
        Следующий год через несколько секунд...
      </p>
    </div>
  );
}

// ============================================================
// FINAL screen
// ============================================================

function FinalScreen({ state, selfId, selfNickname }: { state: InvestPlayerState; selfId: string; selfNickname: string }) {
  const [summary, setSummary] = useState<InvestFinalSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<InvestFinalSummary>('/api/invest/final').then(
      (s) => { if (!cancelled) setSummary(s); },
      (e) => { if (!cancelled) setError((e as Error).message); }
    );
    return () => { cancelled = true; };
  }, []);

  if (!state.game) return null;
  if (error) return <p style={{ color: 'var(--inv-red-dark)' }}>{error}</p>;
  if (!summary) return <p className="inv-text-muted">Загружаем итоги...</p>;

  const myFinal = state.portfolio?.history.at(-1);

  return (
    <div className="inv-final inv-shell">
      <section className="inv-final-hero">
        <h1>🏆 Игра завершена</h1>
        <p>
          {summary.startYear}–{summary.endYear} · {summary.totalPlayers} {summary.totalPlayers === 1 ? 'игрок' : 'игроков'}
        </p>
        <div className="inv-final-stats">
          <div className="inv-final-stat">
            <span>Твой итог</span>
            <strong>{formatUsd(myFinal?.totalUsd ?? 0)}</strong>
          </div>
          <div className="inv-final-stat">
            <span>В реальных $</span>
            <strong>{formatUsd(myFinal?.totalUsdReal ?? 0)}</strong>
          </div>
          <div className="inv-final-stat">
            <span>Твоё место</span>
            <strong>#{state.leaderboard.find((r) => r.participantId === selfId)?.rank ?? '?'}</strong>
          </div>
        </div>
      </section>

      <section>
        <h2 className="inv-heading-lg" style={{ marginBottom: 10, padding: '0 4px' }}>
          🎖 Награды
        </h2>
        <div className="inv-awards-grid">
          {summary.awards.map((aw) => (
            <article key={aw.id} className="inv-award">
              <header className="inv-award__head">
                <div className="inv-award__emoji">{aw.emoji}</div>
                <div className="inv-award__title">
                  <strong>{aw.title}</strong>
                  <small>{aw.metric}</small>
                </div>
              </header>
              <div className="inv-award__winners">
                {aw.winners.length === 0 ? (
                  <p className="inv-text-muted">—</p>
                ) : (
                  aw.winners.map((w) => (
                    <div className="inv-award__winner" key={w.participantId}>
                      <strong>{w.nickname}</strong>
                      <span>{w.value}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="inv-card">
        <div className="inv-section-title" style={{ marginBottom: 10 }}>
          <LineChart size={14} /> Капитал по годам
        </div>
        <HistoryChart leaderboard={state.leaderboard} portfolio={state.portfolio} selfNickname={selfNickname} />
      </section>

      {summary.codenameReveal.length > 0 && (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 10 }}>
            <Eye size={14} /> Раскрытие codenames
          </div>
          <div className="inv-codename-reveal">
            {summary.codenameReveal.map((c) => (
              <div className="inv-codename-reveal__row" key={c.assetId}>
                <strong>{c.codename}</strong>
                <span>{c.realName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.altHistoryReveal.length > 0 && (
        <section className="inv-card">
          <div className="inv-section-title" style={{ marginBottom: 10 }}>
            <Sparkles size={14} /> Альтернативная реальность
          </div>
          <p className="inv-text-muted" style={{ marginBottom: 10, fontSize: '0.92rem' }}>
            Эти модификаторы тайно влияли на доходности в этой партии. В другой партии они могут быть совсем другими.
          </p>
          <div className="inv-althistory-reveal">
            {summary.altHistoryReveal.map((mod) => (
              <div className="inv-althistory-row" key={mod.id}>
                <strong>{mod.title}</strong>
                <p>{mod.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// История капитала: SVG line chart
function HistoryChart({
  leaderboard,
  portfolio,
  selfNickname
}: {
  leaderboard: InvestPlayerState['leaderboard'];
  portfolio: Portfolio | null;
  selfNickname: string;
}) {
  // Берём только историю текущего игрока (без знания чужих историй)
  const series = portfolio?.history ?? [];
  if (series.length === 0) return <p className="inv-text-muted">Нет данных</p>;

  const minVal = Math.min(...series.map((s) => s.totalUsd));
  const maxVal = Math.max(...series.map((s) => s.totalUsd));
  const range = Math.max(1, maxVal - minVal);
  const padTop = 20;
  const padBot = 30;
  const padLeft = 50;
  const padRight = 16;
  const w = 720;
  const h = 260;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBot;

  const points = series.map((s, i) => {
    const x = padLeft + (i / Math.max(1, series.length - 1)) * innerW;
    const y = padTop + innerH - ((s.totalUsd - minVal) / range) * innerH;
    return { x, y, ...s };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${points.at(-1)!.x.toFixed(1)},${padTop + innerH} L${padLeft},${padTop + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="inv-history-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="inv-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#inv-area-grad)" />
      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      {points.map((p) => (
        <circle key={p.year} cx={p.x} cy={p.y} r="3.5" fill="#2563eb" />
      ))}
      {points.map((p, i) => (
        <text key={`y${p.year}`} x={p.x} y={h - 10} fill="#64748b" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono">
          {i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 8)) === 0 ? p.year : ''}
        </text>
      ))}
      <text x="6" y={padTop + 4} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono">{formatUsd(maxVal)}</text>
      <text x="6" y={padTop + innerH + 4} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono">{formatUsd(minVal)}</text>
      <text x={padLeft + 4} y={padTop + 14} fill="#0f1729" fontSize="12" fontWeight="700">{selfNickname}</text>
    </svg>
  );
}

// ============================================================
// TOP-LEVEL Dispatch
// ============================================================

export function InvestPlayerView({
  state,
  selfId,
  selfNickname
}: {
  state: InvestPlayerState;
  selfId: string;
  selfNickname: string;
}) {
  async function submitOrder(targetAllocation: Record<string, number>, _total: number) {
    await api('/api/invest/order', {
      method: 'POST',
      body: JSON.stringify({ participantId: selfId, targetAllocation })
    });
  }

  if (!state.active || !state.phase) {
    return (
      <div className="inv-shell">
        <section className="inv-hero">
          <div className="inv-hero__year">
            <strong>🎯</strong>
            <span className="inv-section-title">
              <Landmark size={14} /> Инвест-игра
            </span>
          </div>
          <p className="inv-hero__sub">
            Ожидание модератора. Когда игра начнётся — здесь появится первый год и заголовки новостей.
          </p>
        </section>
      </div>
    );
  }

  switch (state.phase) {
    case 'invest-briefing':
      return <BriefingScreen state={state} selfId={selfId} />;
    case 'invest-trading':
      return <TradingScreen state={state} selfId={selfId} onSubmit={submitOrder} />;
    case 'invest-event-reveal':
      return <EventRevealScreen state={state} />;
    case 'invest-results':
      return <ResultsScreen state={state} selfId={selfId} />;
    case 'invest-final':
      return <FinalScreen state={state} selfId={selfId} selfNickname={selfNickname} />;
    default:
      return null;
  }
}

export { Trophy };
