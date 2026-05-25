import { AssetCatalogItem, InvestmentGame } from './types.js';
import { EQUITIES, INDICES, CRYPTO_BTC, getEquityReturn, getIndexReturn, getBtcReturn } from './data/equities.js';
import { MACRO, macroByYear } from './data/macro.js';
import { FIXED_INCOME, fixedIncomeByYear } from './data/fixedIncome.js';
import { REAL_ESTATE, realEstateByYear } from './data/realEstate.js';
import { AltHistoryModifier } from './data/altHistory.js';
import { EventCard } from './data/events.js';

/**
 * Базовая доходность актива в указанный год (без модификаторов).
 * Возвращает процент годовой доходности В USD.
 * null = актив был недоступен этот год.
 */
export function baseAssetReturn(asset: AssetCatalogItem, year: number): number | null {
  if (year < asset.availableFrom || year > asset.availableTo) return null;

  switch (asset.kind) {
    case 'cash_usd':
      return 0;

    case 'deposit_usd_12m': {
      const fi = fixedIncomeByYear(year);
      return fi.depositUsd12m;
    }

    case 'deposit_kzt_12m':
    case 'deposit_kzt_36m': {
      const fi = fixedIncomeByYear(year);
      const macro = macroByYear(year);
      const rate = asset.kind === 'deposit_kzt_36m' ? fi.depositKzt36m : fi.depositKzt12m;
      // FX-корректировка: тенге → USD через изменение курса
      const prevFx = year === MACRO[0].year ? macro.usdKzt : macroByYear(year - 1).usdKzt;
      const fxFactor = prevFx / macro.usdKzt;
      return ((1 + rate / 100) * fxFactor - 1) * 100;
    }

    case 'us_treasury_10y': {
      const fi = fixedIncomeByYear(year);
      return fi.usTreasury10y;
    }

    case 'us_corp_bbb': {
      const fi = fixedIncomeByYear(year);
      return fi.usCorpBbb;
    }

    case 'kz_govt_bond': {
      const fi = fixedIncomeByYear(year);
      const macro = macroByYear(year);
      const prevFx = year === MACRO[0].year ? macro.usdKzt : macroByYear(year - 1).usdKzt;
      const fxFactor = prevFx / macro.usdKzt;
      return ((1 + fi.kzGovtBond / 100) * fxFactor - 1) * 100;
    }

    case 'metal_gold': {
      if (year === MACRO[0].year) return 0;
      const prev = MACRO.find((m) => m.year === year - 1);
      const curr = MACRO.find((m) => m.year === year);
      if (!prev || !curr) return null;
      return (curr.goldUsdOz / prev.goldUsdOz - 1) * 100;
    }

    case 'metal_silver': {
      if (year === MACRO[0].year) return 0;
      const prev = MACRO.find((m) => m.year === year - 1);
      const curr = MACRO.find((m) => m.year === year);
      if (!prev || !curr) return null;
      return (curr.silverUsdOz / prev.silverUsdOz - 1) * 100;
    }

    case 'btc': {
      return getBtcReturn(year);
    }

    case 'equity': {
      return getEquityReturn(asset.refCode, year);
    }

    case 'index': {
      const ret = getIndexReturn(asset.refCode, year);
      if (ret === null) return null;
      // KASE котируется в KZT, корректируем
      if (asset.refCode === 'KASE') {
        const macro = macroByYear(year);
        const prevFx = year === MACRO[0].year ? macro.usdKzt : macroByYear(year - 1).usdKzt;
        const fxFactor = prevFx / macro.usdKzt;
        return ((1 + ret / 100) * fxFactor - 1) * 100;
      }
      return ret;
    }

    case 'real_estate': {
      if (year === MACRO[0].year) return 0;
      const prev = REAL_ESTATE.find((r) => r.year === year - 1);
      const curr = REAL_ESTATE.find((r) => r.year === year);
      if (!prev || !curr) return null;
      const priceChange = priceChangeForRealEstate(asset.refCode, prev, curr);
      const yieldPct = rentalYieldForRealEstate(asset.refCode, curr);
      // Управление + амортизация = -3%
      return priceChange + yieldPct - 3.0;
    }
  }
}

function priceChangeForRealEstate(refCode: string, prev: typeof REAL_ESTATE[number], curr: typeof REAL_ESTATE[number]): number {
  switch (refCode) {
    case 'RE_ALM_PRIM': return (curr.almatyPrimaryUsdSqm / prev.almatyPrimaryUsdSqm - 1) * 100;
    case 'RE_ALM_SEC':  return (curr.almatySecondaryUsdSqm / prev.almatySecondaryUsdSqm - 1) * 100;
    case 'RE_AST_PRIM': return (curr.astanaPrimaryUsdSqm / prev.astanaPrimaryUsdSqm - 1) * 100;
    case 'RE_AST_SEC':  return (curr.astanaSecondaryUsdSqm / prev.astanaSecondaryUsdSqm - 1) * 100;
    default: return 0;
  }
}

function rentalYieldForRealEstate(refCode: string, curr: typeof REAL_ESTATE[number]): number {
  if (refCode.startsWith('RE_ALM')) return curr.rentalYieldAlmaty;
  if (refCode.startsWith('RE_AST')) return curr.rentalYieldAstana;
  return 0;
}

/**
 * Применить модификаторы alt-history и event cards к базовой доходности.
 */
export function applyModifiers(
  asset: AssetCatalogItem,
  year: number,
  baseReturn: number,
  altHistory: AltHistoryModifier[],
  events: EventCard[]
): number {
  let multiplier = 1.0;

  // 1+r → ×mult → -1
  const compound = (r: number, mult: number) => (1 + r / 100) * mult - 1;

  for (const mod of altHistory) {
    if (mod.years) {
      if (year < mod.years.from || year > mod.years.to) continue;
    }
    if (modifierMatches(mod.target, asset)) {
      multiplier *= mod.multiplier;
    }
  }

  for (const ev of events) {
    for (const effect of ev.effects) {
      if (eventMatches(effect.target, asset)) {
        multiplier *= effect.multiplier;
      }
    }
  }

  if (multiplier === 1.0) return baseReturn;
  return compound(baseReturn, multiplier) * 100;
}

function modifierMatches(target: AltHistoryModifier['target'], asset: AssetCatalogItem): boolean {
  switch (target.kind) {
    case 'ticker': return asset.kind === 'equity' && asset.refCode === target.ticker;
    case 'sector': return asset.sector === target.sector;
    case 'index':  return asset.kind === 'index' && asset.refCode === target.code;
    case 'metal':  return (target.name === 'gold' ? asset.kind === 'metal_gold' : asset.kind === 'metal_silver');
    case 'asset':  return asset.id === target.assetId;
  }
}

function eventMatches(target: EventCard['effects'][number]['target'], asset: AssetCatalogItem): boolean {
  switch (target.kind) {
    case 'ticker': return asset.kind === 'equity' && asset.refCode === target.ticker;
    case 'sector': return asset.sector === target.sector;
    case 'index':  return asset.kind === 'index' && asset.refCode === target.code;
    case 'asset':  return asset.id === target.assetId;
  }
}

/**
 * Полный расчёт доходностей: возвращает finalReturns[assetId][year] = pct.
 */
export function computeAllReturns(
  catalog: AssetCatalogItem[],
  game: InvestmentGame
): Record<string, Record<number, number>> {
  const result: Record<string, Record<number, number>> = {};
  const { config, altHistoryActive, resolvedEventsByYear } = game;

  for (const asset of catalog) {
    result[asset.id] = {};
    for (let year = config.startYear; year <= config.endYear; year++) {
      const base = baseAssetReturn(asset, year);
      if (base === null) continue;
      const events = resolvedEventsByYear[year] ?? [];
      result[asset.id][year] = applyModifiers(asset, year, base, altHistoryActive, events);
    }
  }

  return result;
}

/**
 * Инфляция США кумулятивно от startYear до year.
 */
export function cumulativeInflationUsa(startYear: number, year: number): number {
  let factor = 1;
  for (let y = startYear + 1; y <= year; y++) {
    const m = MACRO.find((x) => x.year === y);
    if (m) factor *= 1 + m.cpiUsPct / 100;
  }
  return factor;
}
