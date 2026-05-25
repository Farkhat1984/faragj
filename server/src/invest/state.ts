import {
  AssetCatalogItem,
  InvestmentGame,
  InvestPhase,
  InvestPlayerState,
  InvestPublicState,
  Portfolio
} from './types.js';
import {
  computeLeaderboard,
  portfolioTotalUsd
} from './engine.js';
import { EventCard } from './data/events.js';

type ParticipantInfo = { id: string; nickname: string; online: boolean };

export type InvestModuleState = {
  active: boolean;
  phase: InvestPhase | null;
  game: InvestmentGame | null;
  catalog: AssetCatalogItem[];
  portfolios: Map<string, Portfolio>;
  phaseEndsAt: number | null;
  /** Текущие события для отображения в briefing / event-reveal / results */
  currentEvents: EventCard[];
};

let mod: InvestModuleState = {
  active: false,
  phase: null,
  game: null,
  catalog: [],
  portfolios: new Map(),
  phaseEndsAt: null,
  currentEvents: []
};

export function getInvestState(): InvestModuleState {
  return mod;
}

export function setInvestState(next: InvestModuleState): void {
  mod = next;
}

export function clearInvestState(): void {
  mod = {
    active: false,
    phase: null,
    game: null,
    catalog: [],
    portfolios: new Map(),
    phaseEndsAt: null,
    currentEvents: []
  };
}

export function buildInvestPublicState(participants: Map<string, ParticipantInfo>): InvestPublicState {
  const nicknames = new Map<string, string>();
  for (const p of participants.values()) nicknames.set(p.id, p.nickname);

  const leaderboard = mod.game ? computeLeaderboard(mod.portfolios, nicknames) : [];

  const participantsPayload = Array.from(participants.values()).map((p) => {
    const portfolio = mod.portfolios.get(p.id);
    const totalUsd = portfolio ? portfolioTotalUsd(portfolio) : 0;
    return {
      participantId: p.id,
      nickname: p.nickname,
      online: p.online,
      totalUsd,
      ready: portfolio?.ready ?? false,
      pendingOrderSubmitted: !!portfolio?.pendingOrder
    };
  });

  return {
    active: mod.active,
    phase: mod.phase,
    game: mod.game
      ? {
          id: mod.game.id,
          config: mod.game.config,
          currentYear: mod.game.currentYear,
          altHistoryActive: mod.phase === 'invest-final' ? mod.game.altHistoryActive : []
        }
      : null,
    catalog: mod.catalog,
    leaderboard,
    participants: participantsPayload,
    phaseEndsAt: mod.phaseEndsAt,
    currentEvents: mod.currentEvents.filter((e) => e.type !== 'fake' || mod.phase === 'invest-briefing' || mod.phase === 'invest-trading')
  };
}

export function buildInvestPlayerState(
  participantId: string,
  participants: Map<string, ParticipantInfo>
): InvestPlayerState {
  const nicknames = new Map<string, string>();
  for (const p of participants.values()) nicknames.set(p.id, p.nickname);

  const portfolio = mod.portfolios.get(participantId) ?? null;
  const leaderboard = mod.game ? computeLeaderboard(mod.portfolios, nicknames) : [];

  // Доходности прошлого года (для отображения "что было") — только в results/briefing
  const lastYearReturns: Record<string, number> = {};
  if (mod.game && mod.phase === 'invest-results') {
    const year = mod.game.currentYear;
    for (const asset of mod.catalog) {
      const r = mod.game.finalReturns[asset.id]?.[year];
      if (typeof r === 'number') lastYearReturns[asset.id] = r;
    }
  }

  // В briefing/trading фейки видны; в event-reveal — только настоящие
  const currentEvents = mod.currentEvents.filter((e) => {
    if (mod.phase === 'invest-event-reveal' || mod.phase === 'invest-results') return e.type !== 'fake';
    return true;
  });

  return {
    active: mod.active,
    phase: mod.phase,
    game: mod.game
      ? {
          id: mod.game.id,
          startYear: mod.game.config.startYear,
          endYear: mod.game.config.endYear,
          currentYear: mod.game.currentYear,
          difficulty: mod.game.config.difficulty,
          codenameMode: mod.game.config.codenameMode
        }
      : null,
    catalog: mod.catalog,
    portfolio,
    currentEvents,
    lastYearReturns,
    leaderboard,
    phaseEndsAt: mod.phaseEndsAt
  };
}
