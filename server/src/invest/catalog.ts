import { AssetCatalogItem, InvestGameConfig } from './types.js';
import { EQUITIES, INDICES, AssetSector } from './data/equities.js';
import { FIRST_YEAR, LAST_YEAR } from './data/macro.js';

// Стабильные codenames на тикер — генерируются по сектору + порядку.
// Это сохраняет анонимность акции в codenameMode, но даёт игроку
// маленький намёк через префикс сектора.
function generateCodenames(): Record<string, string> {
  const codenames: Record<string, string> = {};
  const sectorPrefixes: Partial<Record<AssetSector, string>> = {
    tech: 'TECH',
    financials: 'FIN',
    consumer: 'CONS',
    industrials: 'INDR',
    energy: 'ENRG',
    healthcare: 'HLTH',
    telecom: 'TELE'
  };
  const sectorCounters: Record<string, number> = {};

  for (const eq of EQUITIES) {
    const prefix = sectorPrefixes[eq.sector] ?? 'MISC';
    const n = (sectorCounters[prefix] = (sectorCounters[prefix] ?? 0) + 1);
    codenames[eq.ticker] = `${prefix}-${String(n).padStart(2, '0')}`;
  }
  return codenames;
}

const CODENAMES = generateCodenames();

function indexCodename(code: string): string {
  if (code === 'SP500') return 'IDX-AMER-500';
  if (code === 'NASDAQ') return 'IDX-AMER-TECH';
  if (code === 'KASE') return 'IDX-EM-LOCAL';
  return `IDX-${code}`;
}

function isAvailable(item: AssetCatalogItem, fromYear: number, toYear: number): boolean {
  return item.availableFrom <= toYear && item.availableTo >= fromYear;
}

export function buildCatalog(config: InvestGameConfig): AssetCatalogItem[] {
  const codename = config.codenameMode;
  const items: AssetCatalogItem[] = [];

  // Кэш и депозиты
  items.push({
    id: 'cash_usd',
    kind: 'cash_usd',
    displayName: 'Наличные USD',
    realName: 'Наличные USD',
    sector: 'index',
    hintShort: 'Долларовый кэш — без доходности, но без риска',
    hintFull: 'Сидит и ждёт. Не растёт. Не падает. Кроме девальвации тенге, которая его не касается, и инфляции, которая касается.',
    lockYears: 0,
    buyFeePct: 0,
    sellFeePct: 0,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'CASH_USD',
    group: 'cash'
  });

  items.push({
    id: 'deposit_usd_12m',
    kind: 'deposit_usd_12m',
    displayName: 'Депозит USD 12м',
    realName: 'Депозит USD 12м в KZ-банке',
    sector: 'index',
    hintShort: 'Срочный долларовый вклад на год',
    hintFull: 'Заперт на 1 год, ставка ~1-7% годовых в USD. Под госгарантией до $20K.',
    lockYears: 1,
    buyFeePct: 0,
    sellFeePct: 0,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'DEP_USD_12M',
    group: 'deposit'
  });

  items.push({
    id: 'deposit_kzt_12m',
    kind: 'deposit_kzt_12m',
    displayName: 'Депозит KZT 12м',
    realName: 'Депозит KZT 12м',
    sector: 'index',
    hintShort: 'Срочный тенговый вклад на год',
    hintFull: 'Заперт на 1 год. Высокая ставка, но валютный риск.',
    lockYears: 1,
    buyFeePct: 0,
    sellFeePct: 0,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'DEP_KZT_12M',
    group: 'deposit'
  });

  items.push({
    id: 'deposit_kzt_36m',
    kind: 'deposit_kzt_36m',
    displayName: 'Депозит KZT 36м',
    realName: 'Депозит KZT 36м',
    sector: 'index',
    hintShort: 'Срочный тенговый вклад на 3 года',
    hintFull: 'Заперт на 3 года, ставка чуть выше. Высокий валютный риск.',
    lockYears: 3,
    buyFeePct: 0,
    sellFeePct: 0,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'DEP_KZT_36M',
    group: 'deposit'
  });

  // Облигации
  items.push({
    id: 'us_treasury_10y',
    kind: 'us_treasury_10y',
    displayName: 'US Treasury 10Y',
    realName: 'US Treasury 10Y',
    sector: 'index',
    hintShort: '10-летние гособлигации США',
    hintFull: 'Самый надёжный долговой инструмент в мире. Низкий доход, низкий риск.',
    lockYears: 0,
    buyFeePct: 0.1,
    sellFeePct: 0.1,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'UST10Y',
    group: 'bond'
  });

  items.push({
    id: 'us_corp_bbb',
    kind: 'us_corp_bbb',
    displayName: 'US Corp BBB',
    realName: 'Корпоративные облигации США (BBB)',
    sector: 'index',
    hintShort: 'Корпоративный долг рейтинга BBB',
    hintFull: 'Чуть выше доходность, чуть выше риск. В кризис может больно ударить.',
    lockYears: 0,
    buyFeePct: 0.2,
    sellFeePct: 0.2,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'USCORP_BBB',
    group: 'bond'
  });

  items.push({
    id: 'kz_govt_bond',
    kind: 'kz_govt_bond',
    displayName: 'KZ Government Bond',
    realName: 'МЕОКАМ Казахстана',
    sector: 'index',
    hintShort: 'Государственные облигации Казахстана',
    hintFull: 'KZT-номинированные, валютный риск. Доходность выше депозита.',
    lockYears: 0,
    buyFeePct: 0.3,
    sellFeePct: 0.3,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'KZGOVT',
    group: 'bond'
  });

  // Драгметаллы
  items.push({
    id: 'gold',
    kind: 'metal_gold',
    displayName: 'Золото',
    realName: 'Золото (XAU)',
    sector: 'commodity',
    hintShort: 'Защитный актив тысячелетий',
    hintFull: 'Цена в USD за тройскую унцию (31.1г). Растёт в кризисы, стагнирует в благополучные времена.',
    lockYears: 0,
    buyFeePct: 1.0,
    sellFeePct: 1.0,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'GOLD',
    group: 'commodity'
  });

  items.push({
    id: 'silver',
    kind: 'metal_silver',
    displayName: 'Серебро',
    realName: 'Серебро (XAG)',
    sector: 'commodity',
    hintShort: 'Промышленный драгметалл',
    hintFull: 'Более волатильно, чем золото. Используется в промышленности (электроника, фотовольтаика).',
    lockYears: 0,
    buyFeePct: 1.5,
    sellFeePct: 1.5,
    availableFrom: FIRST_YEAR,
    availableTo: LAST_YEAR,
    refCode: 'SILVER',
    group: 'commodity'
  });

  // BTC
  items.push({
    id: 'btc',
    kind: 'btc',
    displayName: 'Биткоин',
    realName: 'Bitcoin (BTC)',
    sector: 'crypto',
    hintShort: 'Криптовалюта, появилась в 2009',
    hintFull: 'Децентрализованная цифровая валюта. Экстремальная волатильность.',
    lockYears: 0,
    buyFeePct: 1.0,
    sellFeePct: 1.0,
    availableFrom: 2011,
    availableTo: LAST_YEAR,
    refCode: 'BTC',
    group: 'crypto'
  });

  // Индексы
  for (const idx of INDICES) {
    const realName = idx.name;
    items.push({
      id: `index_${idx.code.toLowerCase()}`,
      kind: 'index',
      displayName: codename ? indexCodename(idx.code) : realName,
      realName,
      sector: 'index',
      hintShort: codename ? `Композитный индекс рынка (${idx.code === 'KASE' ? 'EM' : 'developed'})` : idx.hint,
      hintFull: idx.hint,
      lockYears: 0,
      buyFeePct: idx.code === 'KASE' ? 0.5 : 0.1,
      sellFeePct: idx.code === 'KASE' ? 0.5 : 0.1,
      availableFrom: idx.code === 'KASE' ? 2002 : FIRST_YEAR,
      availableTo: LAST_YEAR,
      refCode: idx.code,
      group: 'index'
    });
  }

  // Акции
  for (const eq of EQUITIES) {
    const code = CODENAMES[eq.ticker] ?? eq.ticker;
    items.push({
      id: `equity_${eq.ticker.toLowerCase().replace(/\./g, '_')}`,
      kind: 'equity',
      displayName: codename ? code : eq.name,
      realName: eq.name,
      sector: eq.sector,
      hintShort: eq.hint.short,
      hintFull: eq.hint.full,
      lockYears: 0,
      buyFeePct: 0.2,
      sellFeePct: 0.2,
      availableFrom: Math.max(eq.founded, FIRST_YEAR),
      availableTo: eq.deathYear ?? LAST_YEAR,
      refCode: eq.ticker,
      group: 'equity'
    });
  }

  // Недвижимость Казахстан
  const realEstateDefs: Array<{
    id: string;
    name: string;
    refCode: string;
    hint: string;
  }> = [
    { id: 'realestate_almaty_primary', name: 'Алматы — первичка', refCode: 'RE_ALM_PRIM', hint: 'Новостройки Алматы, средний сегмент' },
    { id: 'realestate_almaty_secondary', name: 'Алматы — вторичка', refCode: 'RE_ALM_SEC', hint: 'Вторичка Алматы, средний сегмент' },
    { id: 'realestate_astana_primary', name: 'Астана — первичка', refCode: 'RE_AST_PRIM', hint: 'Новостройки Астаны, средний сегмент' },
    { id: 'realestate_astana_secondary', name: 'Астана — вторичка', refCode: 'RE_AST_SEC', hint: 'Вторичка Астаны, средний сегмент' }
  ];

  for (const re of realEstateDefs) {
    items.push({
      id: re.id,
      kind: 'real_estate',
      displayName: re.name,
      realName: re.name,
      sector: 'index',
      hintShort: re.hint,
      hintFull: `${re.hint}. Покупка с комиссией 5%, продажа 3%, минимум 2 года владения. Арендный доход уже учтён.`,
      lockYears: 2,
      buyFeePct: 5.0,
      sellFeePct: 3.0,
      availableFrom: FIRST_YEAR,
      availableTo: LAST_YEAR,
      refCode: re.refCode,
      group: 'realestate'
    });
  }

  // Фильтр по доступным типам и периоду
  return items.filter(
    (item) => config.allowedKinds.includes(item.kind) && isAvailable(item, config.startYear, config.endYear)
  );
}
