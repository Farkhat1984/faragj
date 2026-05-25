// Депозиты и облигации, 1996-2024.
// Депозитные ставки KZT — оценочно по бюллетеням НБ РК (avg по системе).
// USD-депозиты в РК — приблизительная средневзвешенная по основным банкам (БВУ).
// US Treasury 10Y — FRED DGS10 (среднегодовая).
// US Corp BBB — Moody's Seasoned Baa Corporate Bond Yield.
// KZ Government bonds (МЕОКАМ-10y приближение) — НБ РК.

export type FixedIncomeYear = {
  year: number;
  depositKzt12m: number;     // % годовых, депозит в KZT на 12 мес
  depositKzt36m: number;     // на 36 мес (выше ставка, но заперт)
  depositUsd12m: number;     // % годовых, депозит в USD в KZ-банке
  usTreasury10y: number;     // годовая доходность
  usCorpBbb: number;         // годовая доходность
  kzGovtBond: number;        // годовая доходность KZ govt
};

export const FIXED_INCOME: FixedIncomeYear[] = [
  { year: 1996, depositKzt12m: 20.0, depositKzt36m: 22.0, depositUsd12m: 8.5, usTreasury10y: 6.44, usCorpBbb: 8.05, kzGovtBond: 18.0 },
  { year: 1997, depositKzt12m: 17.0, depositKzt36m: 19.0, depositUsd12m: 8.0, usTreasury10y: 6.35, usCorpBbb: 7.86, kzGovtBond: 15.0 },
  { year: 1998, depositKzt12m: 16.0, depositKzt36m: 18.0, depositUsd12m: 7.5, usTreasury10y: 5.26, usCorpBbb: 7.22, kzGovtBond: 22.0 },
  { year: 1999, depositKzt12m: 15.0, depositKzt36m: 17.5, depositUsd12m: 7.0, usTreasury10y: 5.65, usCorpBbb: 7.87, kzGovtBond: 18.0 },
  { year: 2000, depositKzt12m: 13.0, depositKzt36m: 15.0, depositUsd12m: 7.0, usTreasury10y: 6.03, usCorpBbb: 8.36, kzGovtBond: 14.0 },
  { year: 2001, depositKzt12m: 11.5, depositKzt36m: 13.5, depositUsd12m: 6.5, usTreasury10y: 5.02, usCorpBbb: 7.95, kzGovtBond: 9.0  },
  { year: 2002, depositKzt12m: 10.5, depositKzt36m: 12.5, depositUsd12m: 6.0, usTreasury10y: 4.61, usCorpBbb: 7.80, kzGovtBond: 8.5  },
  { year: 2003, depositKzt12m: 10.0, depositKzt36m: 11.5, depositUsd12m: 5.5, usTreasury10y: 4.02, usCorpBbb: 6.77, kzGovtBond: 7.5  },
  { year: 2004, depositKzt12m: 9.0,  depositKzt36m: 10.5, depositUsd12m: 5.0, usTreasury10y: 4.27, usCorpBbb: 6.39, kzGovtBond: 7.0  },
  { year: 2005, depositKzt12m: 9.5,  depositKzt36m: 11.0, depositUsd12m: 5.5, usTreasury10y: 4.29, usCorpBbb: 6.06, kzGovtBond: 7.5  },
  { year: 2006, depositKzt12m: 10.0, depositKzt36m: 11.5, depositUsd12m: 6.0, usTreasury10y: 4.79, usCorpBbb: 6.48, kzGovtBond: 8.0  },
  { year: 2007, depositKzt12m: 11.0, depositKzt36m: 12.5, depositUsd12m: 7.0, usTreasury10y: 4.63, usCorpBbb: 6.48, kzGovtBond: 9.0  },
  { year: 2008, depositKzt12m: 11.5, depositKzt36m: 13.0, depositUsd12m: 7.5, usTreasury10y: 3.66, usCorpBbb: 7.45, kzGovtBond: 10.0 },
  { year: 2009, depositKzt12m: 12.0, depositKzt36m: 13.5, depositUsd12m: 7.0, usTreasury10y: 3.26, usCorpBbb: 7.30, kzGovtBond: 9.0  },
  { year: 2010, depositKzt12m: 10.0, depositKzt36m: 11.5, depositUsd12m: 6.0, usTreasury10y: 3.22, usCorpBbb: 6.04, kzGovtBond: 7.5  },
  { year: 2011, depositKzt12m: 9.5,  depositKzt36m: 11.0, depositUsd12m: 5.5, usTreasury10y: 2.78, usCorpBbb: 5.66, kzGovtBond: 7.0  },
  { year: 2012, depositKzt12m: 8.5,  depositKzt36m: 10.0, depositUsd12m: 5.0, usTreasury10y: 1.80, usCorpBbb: 4.94, kzGovtBond: 6.5  },
  { year: 2013, depositKzt12m: 8.5,  depositKzt36m: 10.0, depositUsd12m: 5.0, usTreasury10y: 2.35, usCorpBbb: 5.10, kzGovtBond: 6.0  },
  { year: 2014, depositKzt12m: 9.0,  depositKzt36m: 10.5, depositUsd12m: 5.0, usTreasury10y: 2.54, usCorpBbb: 4.86, kzGovtBond: 7.5  },
  { year: 2015, depositKzt12m: 14.0, depositKzt36m: 15.0, depositUsd12m: 4.0, usTreasury10y: 2.14, usCorpBbb: 5.00, kzGovtBond: 12.0 },
  { year: 2016, depositKzt12m: 13.0, depositKzt36m: 14.5, depositUsd12m: 2.5, usTreasury10y: 1.84, usCorpBbb: 4.71, kzGovtBond: 10.5 },
  { year: 2017, depositKzt12m: 11.0, depositKzt36m: 12.5, depositUsd12m: 1.5, usTreasury10y: 2.33, usCorpBbb: 4.42, kzGovtBond: 9.0  },
  { year: 2018, depositKzt12m: 10.0, depositKzt36m: 11.5, depositUsd12m: 1.5, usTreasury10y: 2.91, usCorpBbb: 4.80, kzGovtBond: 9.0  },
  { year: 2019, depositKzt12m: 10.0, depositKzt36m: 11.5, depositUsd12m: 1.0, usTreasury10y: 2.14, usCorpBbb: 4.05, kzGovtBond: 9.5  },
  { year: 2020, depositKzt12m: 9.5,  depositKzt36m: 11.0, depositUsd12m: 1.0, usTreasury10y: 0.89, usCorpBbb: 3.10, kzGovtBond: 10.0 },
  { year: 2021, depositKzt12m: 9.0,  depositKzt36m: 10.5, depositUsd12m: 1.0, usTreasury10y: 1.45, usCorpBbb: 3.20, kzGovtBond: 9.5  },
  { year: 2022, depositKzt12m: 15.0, depositKzt36m: 16.0, depositUsd12m: 1.5, usTreasury10y: 2.95, usCorpBbb: 5.36, kzGovtBond: 15.0 },
  { year: 2023, depositKzt12m: 16.0, depositKzt36m: 17.0, depositUsd12m: 1.5, usTreasury10y: 3.96, usCorpBbb: 5.85, kzGovtBond: 14.0 },
  { year: 2024, depositKzt12m: 14.0, depositKzt36m: 15.0, depositUsd12m: 2.0, usTreasury10y: 4.20, usCorpBbb: 5.60, kzGovtBond: 12.5 }
];

export function fixedIncomeByYear(year: number): FixedIncomeYear {
  const item = FIXED_INCOME.find((f) => f.year === year);
  if (!item) throw new Error(`No fixed income data for year ${year}`);
  return item;
}
