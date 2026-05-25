import { AssetSector } from './data/equities.js';
import { AltHistoryModifier } from './data/altHistory.js';
import { EventCard } from './data/events.js';

export type InvestPhase =
  | 'invest-lobby'
  | 'invest-briefing'
  | 'invest-trading'
  | 'invest-event-reveal'
  | 'invest-results'
  | 'invest-final';

export type AssetKind =
  | 'cash_usd'
  | 'deposit_usd_12m'
  | 'deposit_kzt_12m'
  | 'deposit_kzt_36m'
  | 'us_treasury_10y'
  | 'us_corp_bbb'
  | 'kz_govt_bond'
  | 'equity'
  | 'index'
  | 'metal_gold'
  | 'metal_silver'
  | 'btc'
  | 'real_estate';

export type AssetCatalogItem = {
  id: string;
  kind: AssetKind;
  /** Имя для отображения. В codename mode для equity это будет TECH-07 и т.п. */
  displayName: string;
  /** Реальное имя — раскрывается в финале или через Insider Brief */
  realName: string;
  sector: AssetSector;
  /** Краткая подсказка (всегда видна) */
  hintShort: string;
  /** Полная подсказка (видна по запросу) */
  hintFull: string;
  /** Сколько лет позиция заблокирована после покупки */
  lockYears: number;
  /** Комиссия покупки, % */
  buyFeePct: number;
  /** Комиссия продажи, % */
  sellFeePct: number;
  /** Какие года актив доступен (для крипты, IPO, банкротств) */
  availableFrom: number;
  availableTo: number;
  /** Тикер для equity, для остальных — служебный код */
  refCode: string;
  /** Для UI: иконка/цвет/группа */
  group: 'cash' | 'deposit' | 'bond' | 'equity' | 'index' | 'commodity' | 'crypto' | 'realestate';
  /** Стартовая цена для отображения (в USD) — за акцию/унцию/sqm/единицу */
  unitDisplay?: string;
};

export type Position = {
  assetId: string;
  /** Текущая стоимость позиции в USD */
  valueUsd: number;
  /** Год покупки */
  acquiredYear: number;
  /** Заблокировано до конца года включительно */
  lockedUntilYear: number;
};

export type PendingOrder = {
  year: number;
  /** Целевая аллокация в USD по assetId. Остаток уходит в cash_usd */
  targetAllocation: Record<string, number>;
  submittedAt: number;
};

export type YearSnapshot = {
  year: number;
  totalUsd: number;
  /** Inflation-adjusted к startYear */
  totalUsdReal: number;
  allocation: Record<string, number>;
  yearReturnPct: number;
  events: string[];
};

export type Portfolio = {
  participantId: string;
  positions: Position[];
  /** Кэш в USD (синтетический объединённый, чтобы упростить) */
  cashUsd: number;
  history: YearSnapshot[];
  /** Power-up cards available + used */
  powerups: {
    insiderBrief: number;
    hedge: number;
    skipYear: number;
    crystalBall: number;
  };
  powerupsUsed: string[];
  /** Раскрытые через Insider Brief assetIds */
  revealedAssets: string[];
  pendingOrder: PendingOrder | null;
  /** Готов к следующей фазе */
  ready: boolean;
};

export type InvestDifficulty = 'easy' | 'normal' | 'hard';

export type InvestGameConfig = {
  startYear: number;
  endYear: number;
  difficulty: InvestDifficulty;
  codenameMode: boolean;
  startUsd: number;
  startKzt: number;
  capPerAssetPct: number;
  capPerSectorPct: number;
  tradingSeconds: number;
  briefingSeconds: number;
  eventRevealSeconds: number;
  resultsSeconds: number;
  allowedKinds: AssetKind[];
  enableAltHistory: boolean;
  altHistoryCount: number;
};

export type InvestmentGame = {
  id: string;
  config: InvestGameConfig;
  currentYear: number;
  altHistoryActive: AltHistoryModifier[];
  /** Раскрытые события по годам, заполняется по мере прогресса */
  revealedEventsByYear: Record<number, EventCard[]>;
  /** Все события партии (предварительно собранные) */
  resolvedEventsByYear: Record<number, EventCard[]>;
  /** Все доходности активов на партию (с применением altHistory + events) */
  finalReturns: Record<string, Record<number, number>>;
  startedAt: number;
};

export type InvestLeaderboardRow = {
  participantId: string;
  nickname: string;
  totalUsd: number;
  totalUsdReal: number;
  yearReturnPct: number;
  rank: number;
};

export type InvestPublicGameView = {
  id: string;
  config: InvestGameConfig;
  currentYear: number;
  altHistoryActive: AltHistoryModifier[];
};

export type InvestPublicState = {
  active: boolean;
  phase: InvestPhase | null;
  game: InvestPublicGameView | null;
  catalog: AssetCatalogItem[];
  leaderboard: InvestLeaderboardRow[];
  participants: Array<{
    participantId: string;
    nickname: string;
    online: boolean;
    totalUsd: number;
    ready: boolean;
    pendingOrderSubmitted: boolean;
  }>;
  phaseEndsAt: number | null;
  /** Текущие события (для invest-event-reveal и invest-results) */
  currentEvents: EventCard[];
};

export type InvestmentGameSummary = {
  id: string;
  startYear: number;
  endYear: number;
  currentYear: number;
  codenameMode: boolean;
  difficulty: InvestDifficulty;
};

export type InvestPlayerState = {
  active: boolean;
  phase: InvestPhase | null;
  game: InvestmentGameSummary | null;
  catalog: AssetCatalogItem[];
  portfolio: Portfolio | null;
  /** Доступные сейчас игроку события и новости (включая фейки в briefing) */
  currentEvents: EventCard[];
  /** Доходности активов за прошлый год — для отображения "что было" */
  lastYearReturns: Record<string, number>;
  leaderboard: InvestLeaderboardRow[];
  phaseEndsAt: number | null;
};

export type InvestFinalAward = {
  id: string;
  emoji: string;
  title: string;
  metric: string;
  winners: Array<{ participantId: string; nickname: string; value: string }>;
};

export type InvestFinalSummary = {
  totalPlayers: number;
  startYear: number;
  endYear: number;
  awards: InvestFinalAward[];
  altHistoryReveal: AltHistoryModifier[];
  codenameReveal: Array<{ assetId: string; codename: string; realName: string }>;
};
