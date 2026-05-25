import { randomUUID } from 'node:crypto';
import {
  AssetCatalogItem,
  AssetKind,
  InvestFinalAward,
  InvestFinalSummary,
  InvestGameConfig,
  InvestLeaderboardRow,
  InvestmentGame,
  PendingOrder,
  Portfolio,
  YearSnapshot
} from './types.js';
import { buildCatalog } from './catalog.js';
import { computeAllReturns, cumulativeInflationUsa } from './returns.js';
import { ALL_EVENTS, FAKE_EVENTS, FLOATING_EVENTS, REAL_EVENTS, EventCard, eventsForYear } from './data/events.js';
import { ALT_HISTORY_DECK, AltHistoryModifier, pickAltHistory } from './data/altHistory.js';
import { macroByYear } from './data/macro.js';

export const DEFAULT_KINDS_EASY: AssetKind[] = [
  'cash_usd',
  'deposit_usd_12m',
  'deposit_kzt_12m',
  'metal_gold',
  'index'
];

export const DEFAULT_KINDS_NORMAL: AssetKind[] = [
  'cash_usd',
  'deposit_usd_12m',
  'deposit_kzt_12m',
  'deposit_kzt_36m',
  'us_treasury_10y',
  'us_corp_bbb',
  'kz_govt_bond',
  'metal_gold',
  'metal_silver',
  'index',
  'real_estate',
  'equity',
  'btc'
];

export const DEFAULT_KINDS_HARD: AssetKind[] = [...DEFAULT_KINDS_NORMAL];

export const DEFAULT_CONFIG: InvestGameConfig = {
  startYear: 2000,
  endYear: 2024,
  difficulty: 'normal',
  codenameMode: false,
  startUsd: 100000,
  startKzt: 10000000,
  capPerAssetPct: 30,
  capPerSectorPct: 60,
  tradingSeconds: 90,
  briefingSeconds: 18,
  eventRevealSeconds: 7,
  resultsSeconds: 10,
  allowedKinds: DEFAULT_KINDS_NORMAL,
  enableAltHistory: true,
  altHistoryCount: 3
};

function sample<T>(arr: T[], rng: () => number): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function resolveEventsForGame(
  startYear: number,
  endYear: number,
  rng: () => number
): Record<number, EventCard[]> {
  const events: Record<number, EventCard[]> = {};
  // Каждый id → год последнего появления. Карта на кулдауне COOLDOWN_YEARS.
  const lastUsed: Record<string, number> = {};
  const COOLDOWN_YEARS = 4;
  // Минимум 2 fake-карты среди подобранных, минимум 2 floating — для разнообразия.
  const MIN_FAKE = 1;
  const MIN_FLOATING = 2;

  function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  for (let y = startYear; y <= endYear; y++) {
    const yearEvents: EventCard[] = [];
    const usedThisYear = new Set<string>();

    // 1) Все реальные привязанные к году
    for (const real of eventsForYear(y)) {
      yearEvents.push(real);
      usedThisYear.add(real.id);
      lastUsed[real.id] = y;
    }

    // Цель — 5..10 карт в год
    const target = 5 + Math.floor(rng() * 6);

    function pick(pool: EventCard[], minCount: number) {
      const available = shuffle(
        pool.filter(
          (e) => !usedThisYear.has(e.id) && (lastUsed[e.id] === undefined || y - lastUsed[e.id] >= COOLDOWN_YEARS)
        )
      );
      // Если кулдаун слишком жёсткий — берём «старейшие» из пула, игнорируя кулдаун
      const fallback =
        available.length < minCount
          ? shuffle(pool.filter((e) => !usedThisYear.has(e.id)))
              .sort((a, b) => (lastUsed[a.id] ?? -Infinity) - (lastUsed[b.id] ?? -Infinity))
          : [];
      let added = 0;
      for (const e of [...available, ...fallback]) {
        if (yearEvents.length >= target) break;
        if (usedThisYear.has(e.id)) continue;
        yearEvents.push(e);
        usedThisYear.add(e.id);
        lastUsed[e.id] = y;
        added++;
        if (added >= pool.length) break;
      }
      return added;
    }

    // 2) Минимум floating и fake
    let floatingAdded = 0;
    let fakeAdded = 0;
    // отдельно посчитаем — итеративно
    const floatingPool = FLOATING_EVENTS;
    const fakePool = FAKE_EVENTS;

    // сначала добиваем минимум floating
    {
      const before = yearEvents.length;
      pick(floatingPool, MIN_FLOATING);
      floatingAdded = yearEvents.length - before;
    }
    // потом минимум fake
    {
      const before = yearEvents.length;
      pick(fakePool, MIN_FAKE);
      fakeAdded = yearEvents.length - before;
    }

    // 3) Добиваем до target смесью floating/fake
    while (yearEvents.length < target) {
      const mix = shuffle([...floatingPool, ...fakePool]);
      let progressed = false;
      for (const e of mix) {
        if (yearEvents.length >= target) break;
        if (usedThisYear.has(e.id)) continue;
        if (lastUsed[e.id] !== undefined && y - lastUsed[e.id] < COOLDOWN_YEARS) continue;
        yearEvents.push(e);
        usedThisYear.add(e.id);
        lastUsed[e.id] = y;
        progressed = true;
      }
      if (!progressed) break; // больше карт нет — выйдем
    }

    // Перемешаем порядок отображения, но real события вынесем вперёд для контекста
    const reals = yearEvents.filter((e) => e.type === 'real');
    const others = shuffle(yearEvents.filter((e) => e.type !== 'real'));
    events[y] = [...reals, ...others];
  }

  return events;
}

export function createGame(config: InvestGameConfig): { game: InvestmentGame; catalog: AssetCatalogItem[] } {
  const rng = Math.random; // detached, simple — game-level entropy

  const altHistoryActive = config.enableAltHistory
    ? pickAltHistory(Math.max(0, Math.min(config.altHistoryCount, ALT_HISTORY_DECK.length)), rng)
    : [];

  const resolvedEventsByYear = resolveEventsForGame(config.startYear, config.endYear, rng);

  const catalog = buildCatalog(config);

  const partialGame: InvestmentGame = {
    id: randomUUID(),
    config,
    currentYear: config.startYear,
    altHistoryActive,
    revealedEventsByYear: {},
    resolvedEventsByYear,
    finalReturns: {},
    startedAt: Date.now()
  };

  partialGame.finalReturns = computeAllReturns(catalog, partialGame);

  return { game: partialGame, catalog };
}

export function createPortfolio(participantId: string, game: InvestmentGame): Portfolio {
  // Стартовый капитал: USD напрямую + KZT конвертация по курсу startYear
  const macro = macroByYear(game.config.startYear);
  const kztInUsd = game.config.startKzt / macro.usdKzt;
  const totalUsd = game.config.startUsd + kztInUsd;

  return {
    participantId,
    positions: [],
    cashUsd: totalUsd,
    history: [],
    powerups: {
      insiderBrief: 1,
      hedge: 2,
      skipYear: 1,
      crystalBall: 1
    },
    powerupsUsed: [],
    revealedAssets: [],
    pendingOrder: null,
    ready: false
  };
}

export function portfolioTotalUsd(p: Portfolio): number {
  return p.cashUsd + p.positions.reduce((sum, pos) => sum + pos.valueUsd, 0);
}

export function portfolioRealUsd(p: Portfolio, startYear: number, currentYear: number): number {
  const total = portfolioTotalUsd(p);
  const inflFactor = cumulativeInflationUsa(startYear, currentYear);
  return total / inflFactor;
}

/**
 * Принять ордер игрока. Возвращает ошибку или null.
 * Целевая аллокация — словарь assetId → USD value. Сумма должна быть равна текущему totalUsd
 * (с допустимой погрешностью). Заблокированные позиции не могут уменьшаться.
 */
export function submitOrder(
  portfolio: Portfolio,
  catalog: AssetCatalogItem[],
  order: PendingOrder,
  game: InvestmentGame
): { ok: true } | { ok: false; message: string } {
  const total = portfolioTotalUsd(portfolio);
  const sumOrder = Object.values(order.targetAllocation).reduce((a, b) => a + b, 0);

  if (Math.abs(sumOrder - total) > total * 0.01 + 1) {
    return { ok: false, message: `Сумма аллокации (${sumOrder.toFixed(0)}) не совпадает с балансом (${total.toFixed(0)})` };
  }

  // Проверка cap на актив
  for (const [assetId, value] of Object.entries(order.targetAllocation)) {
    if (value < 0) return { ok: false, message: 'Отрицательные суммы не допускаются' };
    const asset = catalog.find((a) => a.id === assetId);
    if (!asset) return { ok: false, message: `Неизвестный актив: ${assetId}` };
    if (game.currentYear < asset.availableFrom || game.currentYear > asset.availableTo) {
      if (value > 0) return { ok: false, message: `${asset.displayName} недоступен в ${game.currentYear}` };
    }
    if (asset.id !== 'cash_usd' && value / total > game.config.capPerAssetPct / 100 + 0.001) {
      return {
        ok: false,
        message: `Максимум ${game.config.capPerAssetPct}% портфеля в один актив (${asset.displayName})`
      };
    }
  }

  // Проверка cap на сектор
  const sectorTotals: Record<string, number> = {};
  for (const [assetId, value] of Object.entries(order.targetAllocation)) {
    const asset = catalog.find((a) => a.id === assetId);
    if (!asset) continue;
    if (asset.kind === 'cash_usd') continue;
    if (asset.kind === 'equity') {
      sectorTotals[asset.sector] = (sectorTotals[asset.sector] ?? 0) + value;
    }
  }
  for (const [sector, value] of Object.entries(sectorTotals)) {
    if (value / total > game.config.capPerSectorPct / 100 + 0.001) {
      return {
        ok: false,
        message: `Максимум ${game.config.capPerSectorPct}% портфеля в один сектор (${sector})`
      };
    }
  }

  // Проверка локов: текущие заблокированные позиции должны сохраниться (>= текущей valueUsd)
  for (const pos of portfolio.positions) {
    if (pos.lockedUntilYear >= game.currentYear) {
      const requested = order.targetAllocation[pos.assetId] ?? 0;
      if (requested + 0.5 < pos.valueUsd) {
        const asset = catalog.find((a) => a.id === pos.assetId);
        return {
          ok: false,
          message: `${asset?.displayName ?? pos.assetId} заблокирован до ${pos.lockedUntilYear}`
        };
      }
    }
  }

  portfolio.pendingOrder = order;
  portfolio.ready = true;
  return { ok: true };
}

/**
 * Применить order: исполнить аллокацию, списав комиссии. Если order = null, использовать текущую.
 */
export function applyOrder(portfolio: Portfolio, catalog: AssetCatalogItem[], game: InvestmentGame): void {
  const order = portfolio.pendingOrder;
  if (!order) return;

  // Сохраним currentValues для расчёта delta и комиссий
  const currentByAsset: Record<string, number> = { cash_usd: portfolio.cashUsd };
  for (const pos of portfolio.positions) {
    currentByAsset[pos.assetId] = (currentByAsset[pos.assetId] ?? 0) + pos.valueUsd;
  }

  // Применяем
  const newPositions: PortfolioPositionMap = {};
  let newCash = 0;
  for (const [assetId, target] of Object.entries(order.targetAllocation)) {
    const current = currentByAsset[assetId] ?? 0;
    const delta = target - current;
    const asset = catalog.find((a) => a.id === assetId);
    if (!asset) continue;

    let actualValue = target;
    if (delta > 0 && asset.buyFeePct > 0) {
      const fee = delta * (asset.buyFeePct / 100);
      actualValue -= fee;
    } else if (delta < 0 && asset.sellFeePct > 0) {
      const fee = -delta * (asset.sellFeePct / 100);
      actualValue -= fee;
    }

    if (asset.kind === 'cash_usd') {
      newCash += actualValue;
    } else {
      newPositions[assetId] = actualValue;
    }
  }

  // Сохраним oldPosition acquired/lock years чтобы не сбросить
  const oldLockMap: Record<string, { acquiredYear: number; lockedUntilYear: number }> = {};
  for (const pos of portfolio.positions) {
    oldLockMap[pos.assetId] = { acquiredYear: pos.acquiredYear, lockedUntilYear: pos.lockedUntilYear };
  }

  portfolio.positions = Object.entries(newPositions)
    .filter(([, v]) => v > 0.5)
    .map(([assetId, value]) => {
      const asset = catalog.find((a) => a.id === assetId)!;
      const prevLock = oldLockMap[assetId];
      const acquiredYear = prevLock?.acquiredYear ?? game.currentYear;
      const lockedUntilYear = prevLock?.lockedUntilYear ?? (asset.lockYears > 0 ? game.currentYear + asset.lockYears - 1 : 0);
      return { assetId, valueUsd: value, acquiredYear, lockedUntilYear };
    });
  portfolio.cashUsd = newCash;
  portfolio.pendingOrder = null;
}

type PortfolioPositionMap = Record<string, number>;

/**
 * Применить доходности на конец года, обновить history.
 */
export function applyYearReturns(portfolio: Portfolio, catalog: AssetCatalogItem[], game: InvestmentGame): void {
  const year = game.currentYear;
  const beforeTotal = portfolioTotalUsd(portfolio);

  for (const pos of portfolio.positions) {
    const ret = game.finalReturns[pos.assetId]?.[year];
    if (typeof ret === 'number') {
      pos.valueUsd *= 1 + ret / 100;
    }
  }
  // Кэш USD: 0% доходность (но влияет на inflation)
  // (cash already 0%)

  const afterTotal = portfolioTotalUsd(portfolio);
  const yearReturn = beforeTotal > 0 ? (afterTotal / beforeTotal - 1) * 100 : 0;

  // Кладём snapshot
  const allocation: Record<string, number> = {};
  if (afterTotal > 0) {
    allocation.cash_usd = portfolio.cashUsd / afterTotal;
    for (const pos of portfolio.positions) {
      allocation[pos.assetId] = (allocation[pos.assetId] ?? 0) + pos.valueUsd / afterTotal;
    }
  }

  portfolio.history.push({
    year,
    totalUsd: afterTotal,
    totalUsdReal: afterTotal / cumulativeInflationUsa(game.config.startYear, year),
    allocation,
    yearReturnPct: yearReturn,
    events: (game.revealedEventsByYear[year] ?? []).map((e) => e.id)
  });
}

export function computeLeaderboard(portfolios: Map<string, Portfolio>, nicknames: Map<string, string>): InvestLeaderboardRow[] {
  const rows: InvestLeaderboardRow[] = [];
  for (const [pid, p] of portfolios.entries()) {
    const last = p.history[p.history.length - 1];
    rows.push({
      participantId: pid,
      nickname: nicknames.get(pid) ?? 'Игрок',
      totalUsd: last ? last.totalUsd : portfolioTotalUsd(p),
      totalUsdReal: last ? last.totalUsdReal : portfolioTotalUsd(p),
      yearReturnPct: last ? last.yearReturnPct : 0,
      rank: 0
    });
  }
  rows.sort((a, b) => b.totalUsd - a.totalUsd);
  rows.forEach((row, i) => (row.rank = i + 1));
  return rows;
}

export function computeFinalSummary(
  game: InvestmentGame,
  catalog: AssetCatalogItem[],
  portfolios: Map<string, Portfolio>,
  nicknames: Map<string, string>
): InvestFinalSummary {
  const players = [...portfolios.entries()].map(([pid, p]) => ({
    pid,
    nickname: nicknames.get(pid) ?? 'Игрок',
    portfolio: p
  }));

  function format(n: number, suffix = '$'): string {
    if (suffix === '%') return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    return `${suffix}${Math.round(n).toLocaleString('en-US')}`;
  }

  function maxBy<T>(arr: T[], key: (item: T) => number): T[] {
    if (arr.length === 0) return [];
    let bestVal = -Infinity;
    for (const item of arr) {
      const v = key(item);
      if (v > bestVal) bestVal = v;
    }
    return arr.filter((item) => key(item) === bestVal);
  }
  function minBy<T>(arr: T[], key: (item: T) => number): T[] {
    if (arr.length === 0) return [];
    let bestVal = Infinity;
    for (const item of arr) {
      const v = key(item);
      if (v < bestVal) bestVal = v;
    }
    return arr.filter((item) => key(item) === bestVal);
  }

  function finalTotal(pl: typeof players[0]) {
    return pl.portfolio.history.length > 0
      ? pl.portfolio.history[pl.portfolio.history.length - 1].totalUsd
      : portfolioTotalUsd(pl.portfolio);
  }
  function finalReal(pl: typeof players[0]) {
    return pl.portfolio.history.length > 0
      ? pl.portfolio.history[pl.portfolio.history.length - 1].totalUsdReal
      : portfolioTotalUsd(pl.portfolio);
  }
  function maxDrawdown(pl: typeof players[0]) {
    let peak = -Infinity;
    let dd = 0;
    const seq = pl.portfolio.history.map((h) => h.totalUsd);
    for (const v of seq) {
      if (v > peak) peak = v;
      const drop = peak > 0 ? (peak - v) / peak : 0;
      if (drop > dd) dd = drop;
    }
    return dd;
  }
  function bestYear(pl: typeof players[0]) {
    return Math.max(0, ...pl.portfolio.history.map((h) => h.yearReturnPct));
  }
  function worstYear(pl: typeof players[0]) {
    return Math.min(0, ...pl.portfolio.history.map((h) => h.yearReturnPct));
  }
  function diversification(pl: typeof players[0]) {
    // Средний HHI обратный
    if (pl.portfolio.history.length === 0) return 0;
    const hhi = pl.portfolio.history.map((h) => {
      const shares = Object.values(h.allocation);
      return shares.reduce((s, x) => s + x * x, 0);
    });
    const mean = hhi.reduce((a, b) => a + b, 0) / hhi.length;
    return 1 - mean;
  }
  function vol(pl: typeof players[0]) {
    const returns = pl.portfolio.history.map((h) => h.yearReturnPct);
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
  }
  function sharpeLike(pl: typeof players[0]) {
    const returns = pl.portfolio.history.map((h) => h.yearReturnPct);
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const v = vol(pl);
    return v === 0 ? 0 : mean / v;
  }

  function awardEntry(id: string, emoji: string, title: string, metric: string, winners: Array<{ pid: string; nickname: string; value: string }>): InvestFinalAward {
    return {
      id,
      emoji,
      title,
      metric,
      winners: winners.map((w) => ({ participantId: w.pid, nickname: w.nickname, value: w.value }))
    };
  }

  const awards: InvestFinalAward[] = [];

  awards.push(awardEntry(
    'capitalist',
    '🥇',
    'Капиталист года',
    'Максимальный итоговый капитал (номинально)',
    maxBy(players, finalTotal).map((p) => ({ pid: p.pid, nickname: p.nickname, value: format(finalTotal(p)) }))
  ));

  awards.push(awardEntry(
    'real-master',
    '💎',
    'Реальный мастер',
    'Лучший капитал с учётом инфляции',
    maxBy(players, finalReal).map((p) => ({ pid: p.pid, nickname: p.nickname, value: format(finalReal(p)) }))
  ));

  awards.push(awardEntry(
    'cold-blood',
    '⚖️',
    'Хладнокровный',
    'Лучшее соотношение доходность/риск',
    maxBy(players, sharpeLike).map((p) => ({ pid: p.pid, nickname: p.nickname, value: sharpeLike(p).toFixed(2) }))
  ));

  awards.push(awardEntry(
    'survivor',
    '🛡️',
    'Стойкий',
    'Минимальная максимальная просадка',
    minBy(players, maxDrawdown).map((p) => ({ pid: p.pid, nickname: p.nickname, value: format(maxDrawdown(p) * 100, '%') }))
  ));

  awards.push(awardEntry(
    'diversifier',
    '🌈',
    'Диверсификатор',
    'Самое сбалансированное распределение',
    maxBy(players, diversification).map((p) => ({ pid: p.pid, nickname: p.nickname, value: (diversification(p) * 100).toFixed(0) + '/100' }))
  ));

  awards.push(awardEntry(
    'bull',
    '🚀',
    'Бык',
    'Лучший единичный год',
    maxBy(players, bestYear).map((p) => ({ pid: p.pid, nickname: p.nickname, value: format(bestYear(p), '%') }))
  ));

  awards.push(awardEntry(
    'crisis-king',
    '🐻',
    'Антикризис',
    'Лучший результат в худший год',
    maxBy(players, worstYear).map((p) => ({ pid: p.pid, nickname: p.nickname, value: format(worstYear(p), '%') }))
  ));

  return {
    totalPlayers: players.length,
    startYear: game.config.startYear,
    endYear: game.config.endYear,
    awards,
    altHistoryReveal: game.altHistoryActive,
    codenameReveal: game.config.codenameMode
      ? catalog
          .filter((a) => a.kind === 'equity' || a.kind === 'index')
          .map((a) => ({ assetId: a.id, codename: a.displayName, realName: a.realName }))
      : []
  };
}

/**
 * Использовать power-up: Insider Brief — раскрыть имя одного актива.
 */
export function useInsiderBrief(portfolio: Portfolio, assetId: string): { ok: true } | { ok: false; message: string } {
  if (portfolio.powerups.insiderBrief <= 0) return { ok: false, message: 'Нет доступных Insider Brief' };
  if (portfolio.revealedAssets.includes(assetId)) return { ok: false, message: 'Уже раскрыт' };
  portfolio.powerups.insiderBrief -= 1;
  portfolio.powerupsUsed.push(`insider:${assetId}`);
  portfolio.revealedAssets.push(assetId);
  return { ok: true };
}

/**
 * Использовать Skip Year — парковка в кэш без комиссий.
 */
export function useSkipYear(portfolio: Portfolio, game: InvestmentGame): { ok: true } | { ok: false; message: string } {
  if (portfolio.powerups.skipYear <= 0) return { ok: false, message: 'Нет доступных Skip Year' };
  portfolio.powerups.skipYear -= 1;
  portfolio.powerupsUsed.push(`skip:${game.currentYear}`);
  return { ok: true };
}
