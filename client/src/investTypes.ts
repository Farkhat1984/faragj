// Зеркало server/src/invest/types.ts (синхронизируется вручную, как существующие types.ts).

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

export type AssetSector = 'tech' | 'financials' | 'consumer' | 'industrials' | 'energy' | 'healthcare' | 'telecom' | 'index' | 'commodity' | 'crypto';

export type AssetCatalogItem = {
  id: string;
  kind: AssetKind;
  displayName: string;
  realName: string;
  sector: AssetSector;
  hintShort: string;
  hintFull: string;
  lockYears: number;
  buyFeePct: number;
  sellFeePct: number;
  availableFrom: number;
  availableTo: number;
  refCode: string;
  group: 'cash' | 'deposit' | 'bond' | 'equity' | 'index' | 'commodity' | 'crypto' | 'realestate';
  unitDisplay?: string;
};

export type Position = {
  assetId: string;
  valueUsd: number;
  acquiredYear: number;
  lockedUntilYear: number;
};

export type PendingOrder = {
  year: number;
  targetAllocation: Record<string, number>;
  submittedAt: number;
};

export type YearSnapshot = {
  year: number;
  totalUsd: number;
  totalUsdReal: number;
  allocation: Record<string, number>;
  yearReturnPct: number;
  events: string[];
};

export type Portfolio = {
  participantId: string;
  positions: Position[];
  cashUsd: number;
  history: YearSnapshot[];
  powerups: {
    insiderBrief: number;
    hedge: number;
    skipYear: number;
    crystalBall: number;
  };
  powerupsUsed: string[];
  revealedAssets: string[];
  pendingOrder: PendingOrder | null;
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

export type EventCard = {
  id: string;
  title: string;
  description: string;
  type: 'real' | 'floating' | 'fake';
  year?: number;
  effects: Array<{
    target:
      | { kind: 'ticker'; ticker: string }
      | { kind: 'sector'; sector: string }
      | { kind: 'index'; code: string }
      | { kind: 'asset'; assetId: string };
    multiplier: number;
  }>;
  tone: 'crisis' | 'boom' | 'shock' | 'neutral';
};

export type AltHistoryModifier = {
  id: string;
  title: string;
  description: string;
  target:
    | { kind: 'ticker'; ticker: string }
    | { kind: 'sector'; sector: string }
    | { kind: 'index'; code: string }
    | { kind: 'metal'; name: 'gold' | 'silver' }
    | { kind: 'asset'; assetId: string };
  years?: { from: number; to: number };
  multiplier: number;
};

export type InvestmentGameSummary = {
  id: string;
  startYear: number;
  endYear: number;
  currentYear: number;
  difficulty: InvestDifficulty;
  codenameMode: boolean;
};

export type InvestLeaderboardRow = {
  participantId: string;
  nickname: string;
  totalUsd: number;
  totalUsdReal: number;
  yearReturnPct: number;
  rank: number;
};

export type InvestPublicState = {
  active: boolean;
  phase: InvestPhase | null;
  game: {
    id: string;
    config: InvestGameConfig;
    currentYear: number;
    altHistoryActive: AltHistoryModifier[];
  } | null;
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
  currentEvents: EventCard[];
};

export type InvestPlayerState = {
  active: boolean;
  phase: InvestPhase | null;
  game: InvestmentGameSummary | null;
  catalog: AssetCatalogItem[];
  portfolio: Portfolio | null;
  currentEvents: EventCard[];
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
