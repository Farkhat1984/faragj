// Макроэкономические данные 1996-2024.
// Источники: FRED CPIAUCSL, FEDFUNDS; stat.gov.kz; Нацбанк РК; LBMA.
// Все ставки в процентах годовых. Цены золота — USD/oz (среднее за год).
// Курс USD/KZT — среднегодовой.

export type MacroYear = {
  year: number;
  cpiUsPct: number;      // годовая инфляция США
  cpiKzPct: number;      // годовая инфляция Казахстана
  usdKzt: number;        // среднегодовой курс
  fedFundsPct: number;   // средневзвешенная ставка ФРС
  nbkRatePct: number;    // базовая ставка Нацбанка РК
  goldUsdOz: number;     // золото, USD за тройскую унцию (LBMA avg)
  silverUsdOz: number;   // серебро, USD/oz
  oilUsdBbl: number;     // нефть Brent, USD/барр (для событий)
};

export const MACRO: MacroYear[] = [
  { year: 1996, cpiUsPct: 2.9,  cpiKzPct: 39.1,  usdKzt: 67.6,   fedFundsPct: 5.30, nbkRatePct: 35.0, goldUsdOz: 387,    silverUsdOz: 5.18,  oilUsdBbl: 20.6  },
  { year: 1997, cpiUsPct: 2.3,  cpiKzPct: 17.4,  usdKzt: 75.4,   fedFundsPct: 5.46, nbkRatePct: 18.5, goldUsdOz: 331,    silverUsdOz: 4.90,  oilUsdBbl: 19.1  },
  { year: 1998, cpiUsPct: 1.6,  cpiKzPct: 7.3,   usdKzt: 79.4,   fedFundsPct: 5.35, nbkRatePct: 25.0, goldUsdOz: 294,    silverUsdOz: 5.54,  oilUsdBbl: 12.7  },
  { year: 1999, cpiUsPct: 2.2,  cpiKzPct: 8.4,   usdKzt: 119.5,  fedFundsPct: 4.97, nbkRatePct: 18.0, goldUsdOz: 279,    silverUsdOz: 5.22,  oilUsdBbl: 17.9  },
  { year: 2000, cpiUsPct: 3.4,  cpiKzPct: 13.3,  usdKzt: 142.1,  fedFundsPct: 6.24, nbkRatePct: 14.0, goldUsdOz: 279,    silverUsdOz: 4.95,  oilUsdBbl: 28.5  },
  { year: 2001, cpiUsPct: 2.8,  cpiKzPct: 8.4,   usdKzt: 146.7,  fedFundsPct: 3.89, nbkRatePct: 9.0,  goldUsdOz: 271,    silverUsdOz: 4.39,  oilUsdBbl: 24.4  },
  { year: 2002, cpiUsPct: 1.6,  cpiKzPct: 5.9,   usdKzt: 153.3,  fedFundsPct: 1.67, nbkRatePct: 7.5,  goldUsdOz: 310,    silverUsdOz: 4.60,  oilUsdBbl: 25.0  },
  { year: 2003, cpiUsPct: 2.3,  cpiKzPct: 6.4,   usdKzt: 149.6,  fedFundsPct: 1.13, nbkRatePct: 7.0,  goldUsdOz: 363,    silverUsdOz: 4.88,  oilUsdBbl: 28.9  },
  { year: 2004, cpiUsPct: 2.7,  cpiKzPct: 6.9,   usdKzt: 136.0,  fedFundsPct: 1.35, nbkRatePct: 7.0,  goldUsdOz: 409,    silverUsdOz: 6.66,  oilUsdBbl: 38.3  },
  { year: 2005, cpiUsPct: 3.4,  cpiKzPct: 7.6,   usdKzt: 132.9,  fedFundsPct: 3.22, nbkRatePct: 8.0,  goldUsdOz: 445,    silverUsdOz: 7.32,  oilUsdBbl: 54.4  },
  { year: 2006, cpiUsPct: 3.2,  cpiKzPct: 8.6,   usdKzt: 126.1,  fedFundsPct: 4.97, nbkRatePct: 9.0,  goldUsdOz: 604,    silverUsdOz: 11.55, oilUsdBbl: 65.1  },
  { year: 2007, cpiUsPct: 2.9,  cpiKzPct: 18.8,  usdKzt: 122.6,  fedFundsPct: 5.02, nbkRatePct: 11.0, goldUsdOz: 696,    silverUsdOz: 13.38, oilUsdBbl: 72.5  },
  { year: 2008, cpiUsPct: 3.8,  cpiKzPct: 9.5,   usdKzt: 120.3,  fedFundsPct: 1.92, nbkRatePct: 10.5, goldUsdOz: 872,    silverUsdOz: 14.99, oilUsdBbl: 96.9  },
  { year: 2009, cpiUsPct: -0.4, cpiKzPct: 6.2,   usdKzt: 147.5,  fedFundsPct: 0.16, nbkRatePct: 7.0,  goldUsdOz: 972,    silverUsdOz: 14.67, oilUsdBbl: 61.7  },
  { year: 2010, cpiUsPct: 1.6,  cpiKzPct: 7.8,   usdKzt: 147.4,  fedFundsPct: 0.18, nbkRatePct: 7.0,  goldUsdOz: 1224,   silverUsdOz: 20.19, oilUsdBbl: 79.5  },
  { year: 2011, cpiUsPct: 3.2,  cpiKzPct: 7.4,   usdKzt: 146.6,  fedFundsPct: 0.10, nbkRatePct: 7.5,  goldUsdOz: 1572,   silverUsdOz: 35.12, oilUsdBbl: 111.3 },
  { year: 2012, cpiUsPct: 2.1,  cpiKzPct: 6.0,   usdKzt: 149.1,  fedFundsPct: 0.14, nbkRatePct: 5.5,  goldUsdOz: 1669,   silverUsdOz: 31.15, oilUsdBbl: 111.6 },
  { year: 2013, cpiUsPct: 1.5,  cpiKzPct: 4.8,   usdKzt: 152.1,  fedFundsPct: 0.11, nbkRatePct: 5.5,  goldUsdOz: 1411,   silverUsdOz: 23.79, oilUsdBbl: 108.6 },
  { year: 2014, cpiUsPct: 1.6,  cpiKzPct: 7.4,   usdKzt: 179.2,  fedFundsPct: 0.09, nbkRatePct: 5.5,  goldUsdOz: 1266,   silverUsdOz: 19.08, oilUsdBbl: 99.0  },
  { year: 2015, cpiUsPct: 0.1,  cpiKzPct: 13.6,  usdKzt: 222.3,  fedFundsPct: 0.13, nbkRatePct: 16.0, goldUsdOz: 1160,   silverUsdOz: 15.68, oilUsdBbl: 52.4  },
  { year: 2016, cpiUsPct: 1.3,  cpiKzPct: 8.5,   usdKzt: 342.2,  fedFundsPct: 0.39, nbkRatePct: 12.0, goldUsdOz: 1251,   silverUsdOz: 17.14, oilUsdBbl: 43.7  },
  { year: 2017, cpiUsPct: 2.1,  cpiKzPct: 7.1,   usdKzt: 326.0,  fedFundsPct: 1.00, nbkRatePct: 10.25,goldUsdOz: 1257,   silverUsdOz: 17.05, oilUsdBbl: 54.2  },
  { year: 2018, cpiUsPct: 2.4,  cpiKzPct: 5.3,   usdKzt: 344.7,  fedFundsPct: 1.83, nbkRatePct: 9.25, goldUsdOz: 1268,   silverUsdOz: 15.71, oilUsdBbl: 71.3  },
  { year: 2019, cpiUsPct: 1.8,  cpiKzPct: 5.4,   usdKzt: 382.7,  fedFundsPct: 2.16, nbkRatePct: 9.25, goldUsdOz: 1393,   silverUsdOz: 16.21, oilUsdBbl: 64.4  },
  { year: 2020, cpiUsPct: 1.2,  cpiKzPct: 7.5,   usdKzt: 412.9,  fedFundsPct: 0.36, nbkRatePct: 9.0,  goldUsdOz: 1770,   silverUsdOz: 20.55, oilUsdBbl: 41.8  },
  { year: 2021, cpiUsPct: 4.7,  cpiKzPct: 8.4,   usdKzt: 425.9,  fedFundsPct: 0.08, nbkRatePct: 9.75, goldUsdOz: 1799,   silverUsdOz: 25.14, oilUsdBbl: 70.9  },
  { year: 2022, cpiUsPct: 8.0,  cpiKzPct: 20.3,  usdKzt: 460.5,  fedFundsPct: 1.68, nbkRatePct: 16.75,goldUsdOz: 1800,   silverUsdOz: 21.78, oilUsdBbl: 101.0 },
  { year: 2023, cpiUsPct: 4.1,  cpiKzPct: 9.8,   usdKzt: 456.3,  fedFundsPct: 5.02, nbkRatePct: 15.75,goldUsdOz: 1943,   silverUsdOz: 23.35, oilUsdBbl: 82.5  },
  { year: 2024, cpiUsPct: 2.9,  cpiKzPct: 8.6,   usdKzt: 475.0,  fedFundsPct: 5.10, nbkRatePct: 14.25,goldUsdOz: 2390,   silverUsdOz: 28.30, oilUsdBbl: 80.0  }
];

export function macroByYear(year: number): MacroYear {
  const item = MACRO.find((m) => m.year === year);
  if (!item) throw new Error(`No macro data for year ${year}`);
  return item;
}

export const FIRST_YEAR = MACRO[0].year;
export const LAST_YEAR = MACRO[MACRO.length - 1].year;
