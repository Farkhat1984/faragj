import { randomUUID } from 'node:crypto';
import {
  AssetCatalogItem,
  InvestmentGame,
  InvestGameConfig,
  PendingOrder,
  Portfolio
} from './types.js';
import {
  applyOrder,
  applyYearReturns,
  createGame,
  createPortfolio,
  submitOrder,
  useInsiderBrief,
  useSkipYear
} from './engine.js';
import { getInvestState, setInvestState, clearInvestState } from './state.js';
import { EventCard } from './data/events.js';

type PhaseCallbacks = {
  /** Сменили invest-phase (или вышли). Вызвать emit полного состояния. */
  emit: () => void;
};

let phaseTimer: NodeJS.Timeout | null = null;

function clearPhaseTimer(): void {
  if (phaseTimer) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
}

function schedulePhaseAdvance(ms: number, cb: () => void): void {
  clearPhaseTimer();
  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    cb();
  }, ms);
}

export function abortInvestGame(): void {
  clearPhaseTimer();
  clearInvestState();
}

export function startInvestmentGame(config: InvestGameConfig, participantIds: string[], callbacks: PhaseCallbacks): { ok: true } | { ok: false; message: string } {
  if (config.startYear >= config.endYear) {
    return { ok: false, message: 'Конечный год должен быть позже начального' };
  }
  if (participantIds.length === 0) {
    return { ok: false, message: 'Нет игроков' };
  }

  clearPhaseTimer();
  const { game, catalog } = createGame(config);

  const portfolios = new Map<string, Portfolio>();
  for (const pid of participantIds) {
    portfolios.set(pid, createPortfolio(pid, game));
  }

  setInvestState({
    active: true,
    phase: 'invest-briefing',
    game,
    catalog,
    portfolios,
    phaseEndsAt: Date.now() + config.briefingSeconds * 1000,
    currentEvents: game.resolvedEventsByYear[config.startYear] ?? []
  });

  // Briefing → trading автоматически
  schedulePhaseAdvance(config.briefingSeconds * 1000, () => advanceToTrading(callbacks));
  callbacks.emit();
  return { ok: true };
}

export function addLatePlayer(participantId: string): void {
  const state = getInvestState();
  if (!state.active || !state.game) return;
  if (state.portfolios.has(participantId)) return;
  state.portfolios.set(participantId, createPortfolio(participantId, state.game));
}

function advanceToTrading(callbacks: PhaseCallbacks): void {
  const state = getInvestState();
  if (!state.active || !state.game) return;
  // В briefing/trading фейки видимы (новости с шумом), реальные эффекты пока не применены
  state.phase = 'invest-trading';
  state.phaseEndsAt = Date.now() + state.game.config.tradingSeconds * 1000;
  // Сбрасываем готовность игроков и pendingOrder — они должны принять решение сейчас
  for (const p of state.portfolios.values()) {
    p.ready = false;
    p.pendingOrder = null;
  }
  schedulePhaseAdvance(state.game.config.tradingSeconds * 1000, () => advanceToEventReveal(callbacks));
  callbacks.emit();
}

function advanceToEventReveal(callbacks: PhaseCallbacks): void {
  const state = getInvestState();
  if (!state.active || !state.game) return;
  // Применяем ордера всех игроков
  for (const p of state.portfolios.values()) {
    if (p.pendingOrder) {
      applyOrder(p, state.catalog, state.game);
    }
  }
  // Раскрываем события года
  const events = state.currentEvents.filter((e) => e.type !== 'fake');
  state.game.revealedEventsByYear[state.game.currentYear] = events;
  state.phase = 'invest-event-reveal';
  state.phaseEndsAt = Date.now() + state.game.config.eventRevealSeconds * 1000;
  schedulePhaseAdvance(state.game.config.eventRevealSeconds * 1000, () => advanceToResults(callbacks));
  callbacks.emit();
}

function advanceToResults(callbacks: PhaseCallbacks): void {
  const state = getInvestState();
  if (!state.active || !state.game) return;
  // Применяем доходности на конец года
  for (const p of state.portfolios.values()) {
    applyYearReturns(p, state.catalog, state.game);
  }
  state.phase = 'invest-results';
  state.phaseEndsAt = Date.now() + state.game.config.resultsSeconds * 1000;
  schedulePhaseAdvance(state.game.config.resultsSeconds * 1000, () => advanceYear(callbacks));
  callbacks.emit();
}

function advanceYear(callbacks: PhaseCallbacks): void {
  const state = getInvestState();
  if (!state.active || !state.game) return;
  const nextYear = state.game.currentYear + 1;
  if (nextYear > state.game.config.endYear) {
    state.phase = 'invest-final';
    state.phaseEndsAt = null;
    clearPhaseTimer();
    callbacks.emit();
    return;
  }
  state.game.currentYear = nextYear;
  state.currentEvents = state.game.resolvedEventsByYear[nextYear] ?? [];
  state.phase = 'invest-briefing';
  state.phaseEndsAt = Date.now() + state.game.config.briefingSeconds * 1000;
  schedulePhaseAdvance(state.game.config.briefingSeconds * 1000, () => advanceToTrading(callbacks));
  callbacks.emit();
}

export function forceNextPhase(callbacks: PhaseCallbacks): { ok: true } | { ok: false; message: string } {
  const state = getInvestState();
  if (!state.active || !state.game) return { ok: false, message: 'Нет активной игры' };
  switch (state.phase) {
    case 'invest-briefing': advanceToTrading(callbacks); return { ok: true };
    case 'invest-trading':  advanceToEventReveal(callbacks); return { ok: true };
    case 'invest-event-reveal': advanceToResults(callbacks); return { ok: true };
    case 'invest-results':  advanceYear(callbacks); return { ok: true };
    case 'invest-final':    return { ok: false, message: 'Игра завершена' };
    default: return { ok: false, message: 'Неизвестная фаза' };
  }
}

export function submitPlayerOrder(
  participantId: string,
  targetAllocation: Record<string, number>
): { ok: true } | { ok: false; message: string } {
  const state = getInvestState();
  if (!state.active || !state.game) return { ok: false, message: 'Нет активной игры' };
  if (state.phase !== 'invest-trading') return { ok: false, message: 'Сейчас не торги' };
  const portfolio = state.portfolios.get(participantId);
  if (!portfolio) return { ok: false, message: 'Вы не участвуете в этой игре' };

  const order: PendingOrder = {
    year: state.game.currentYear,
    targetAllocation,
    submittedAt: Date.now()
  };
  return submitOrder(portfolio, state.catalog, order, state.game);
}

export function applyInsiderBrief(participantId: string, assetId: string): { ok: true } | { ok: false; message: string } {
  const state = getInvestState();
  if (!state.active) return { ok: false, message: 'Нет активной игры' };
  const portfolio = state.portfolios.get(participantId);
  if (!portfolio) return { ok: false, message: 'Вы не в игре' };
  return useInsiderBrief(portfolio, assetId);
}

export function applySkipYear(participantId: string): { ok: true } | { ok: false; message: string } {
  const state = getInvestState();
  if (!state.active || !state.game) return { ok: false, message: 'Нет активной игры' };
  if (state.phase !== 'invest-trading') return { ok: false, message: 'Skip Year только в торгах' };
  const portfolio = state.portfolios.get(participantId);
  if (!portfolio) return { ok: false, message: 'Вы не в игре' };

  const result = useSkipYear(portfolio, state.game);
  if (!result.ok) return result;

  // Skip Year = выставить аллокацию: всё в cash_usd, без комиссий
  // Считаем текущий total и формируем order
  let total = portfolio.cashUsd;
  for (const pos of portfolio.positions) {
    // Заблокированные позиции остаются
    if (pos.lockedUntilYear < state.game.currentYear) {
      total += pos.valueUsd;
    }
  }
  const targetAllocation: Record<string, number> = { cash_usd: total };
  for (const pos of portfolio.positions) {
    if (pos.lockedUntilYear >= state.game.currentYear) {
      targetAllocation[pos.assetId] = pos.valueUsd;
    }
  }

  // Принимаем как ордер, обходя комиссии: ставим pendingOrder напрямую
  portfolio.pendingOrder = {
    year: state.game.currentYear,
    targetAllocation,
    submittedAt: Date.now()
  };
  portfolio.ready = true;

  return { ok: true };
}
