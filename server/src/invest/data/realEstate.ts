// Недвижимость Казахстан, 1996-2024.
// Источники: krisha.kz (исторические сводки), stat.gov.kz, аналитика КЦДК и БК.
// Цена за кв.м в USD, среднегодовая. До 2002 — оценка на основе исторических обзоров.
// rental_yield — годовая арендная доходность gross (без расходов на содержание).

export type RealEstateYear = {
  year: number;
  almatyPrimaryUsdSqm: number;     // первичка, среднее
  almatySecondaryUsdSqm: number;   // вторичка
  astanaPrimaryUsdSqm: number;
  astanaSecondaryUsdSqm: number;
  rentalYieldAlmaty: number;       // % годовых от цены
  rentalYieldAstana: number;
};

export const REAL_ESTATE: RealEstateYear[] = [
  { year: 1996, almatyPrimaryUsdSqm: 280,  almatySecondaryUsdSqm: 220,  astanaPrimaryUsdSqm: 200,  astanaSecondaryUsdSqm: 160,  rentalYieldAlmaty: 14.0, rentalYieldAstana: 13.0 },
  { year: 1997, almatyPrimaryUsdSqm: 310,  almatySecondaryUsdSqm: 250,  astanaPrimaryUsdSqm: 240,  astanaSecondaryUsdSqm: 190,  rentalYieldAlmaty: 13.5, rentalYieldAstana: 12.5 },
  { year: 1998, almatyPrimaryUsdSqm: 290,  almatySecondaryUsdSqm: 230,  astanaPrimaryUsdSqm: 260,  astanaSecondaryUsdSqm: 210,  rentalYieldAlmaty: 13.0, rentalYieldAstana: 12.0 },
  { year: 1999, almatyPrimaryUsdSqm: 270,  almatySecondaryUsdSqm: 210,  astanaPrimaryUsdSqm: 280,  astanaSecondaryUsdSqm: 220,  rentalYieldAlmaty: 13.0, rentalYieldAstana: 12.0 },
  { year: 2000, almatyPrimaryUsdSqm: 330,  almatySecondaryUsdSqm: 260,  astanaPrimaryUsdSqm: 320,  astanaSecondaryUsdSqm: 250,  rentalYieldAlmaty: 12.5, rentalYieldAstana: 12.0 },
  { year: 2001, almatyPrimaryUsdSqm: 430,  almatySecondaryUsdSqm: 350,  astanaPrimaryUsdSqm: 380,  astanaSecondaryUsdSqm: 300,  rentalYieldAlmaty: 11.5, rentalYieldAstana: 11.0 },
  { year: 2002, almatyPrimaryUsdSqm: 560,  almatySecondaryUsdSqm: 470,  astanaPrimaryUsdSqm: 460,  astanaSecondaryUsdSqm: 370,  rentalYieldAlmaty: 11.0, rentalYieldAstana: 10.5 },
  { year: 2003, almatyPrimaryUsdSqm: 720,  almatySecondaryUsdSqm: 620,  astanaPrimaryUsdSqm: 580,  astanaSecondaryUsdSqm: 480,  rentalYieldAlmaty: 10.5, rentalYieldAstana: 10.0 },
  { year: 2004, almatyPrimaryUsdSqm: 950,  almatySecondaryUsdSqm: 830,  astanaPrimaryUsdSqm: 740,  astanaSecondaryUsdSqm: 620,  rentalYieldAlmaty: 10.0, rentalYieldAstana: 9.5  },
  { year: 2005, almatyPrimaryUsdSqm: 1280, almatySecondaryUsdSqm: 1120, astanaPrimaryUsdSqm: 990,  astanaSecondaryUsdSqm: 830,  rentalYieldAlmaty: 9.0,  rentalYieldAstana: 8.5  },
  { year: 2006, almatyPrimaryUsdSqm: 2050, almatySecondaryUsdSqm: 1870, astanaPrimaryUsdSqm: 1680, astanaSecondaryUsdSqm: 1450, rentalYieldAlmaty: 7.5,  rentalYieldAstana: 7.0  },
  { year: 2007, almatyPrimaryUsdSqm: 2950, almatySecondaryUsdSqm: 2780, astanaPrimaryUsdSqm: 2280, astanaSecondaryUsdSqm: 2050, rentalYieldAlmaty: 6.5,  rentalYieldAstana: 6.5  },
  { year: 2008, almatyPrimaryUsdSqm: 2480, almatySecondaryUsdSqm: 2350, astanaPrimaryUsdSqm: 1850, astanaSecondaryUsdSqm: 1680, rentalYieldAlmaty: 7.0,  rentalYieldAstana: 7.0  },
  { year: 2009, almatyPrimaryUsdSqm: 1620, almatySecondaryUsdSqm: 1480, astanaPrimaryUsdSqm: 1240, astanaSecondaryUsdSqm: 1110, rentalYieldAlmaty: 8.5,  rentalYieldAstana: 8.5  },
  { year: 2010, almatyPrimaryUsdSqm: 1480, almatySecondaryUsdSqm: 1370, astanaPrimaryUsdSqm: 1180, astanaSecondaryUsdSqm: 1060, rentalYieldAlmaty: 9.0,  rentalYieldAstana: 8.5  },
  { year: 2011, almatyPrimaryUsdSqm: 1560, almatySecondaryUsdSqm: 1450, astanaPrimaryUsdSqm: 1240, astanaSecondaryUsdSqm: 1130, rentalYieldAlmaty: 8.5,  rentalYieldAstana: 8.0  },
  { year: 2012, almatyPrimaryUsdSqm: 1690, almatySecondaryUsdSqm: 1580, astanaPrimaryUsdSqm: 1340, astanaSecondaryUsdSqm: 1230, rentalYieldAlmaty: 8.0,  rentalYieldAstana: 7.5  },
  { year: 2013, almatyPrimaryUsdSqm: 1820, almatySecondaryUsdSqm: 1690, astanaPrimaryUsdSqm: 1430, astanaSecondaryUsdSqm: 1310, rentalYieldAlmaty: 7.5,  rentalYieldAstana: 7.5  },
  { year: 2014, almatyPrimaryUsdSqm: 1740, almatySecondaryUsdSqm: 1600, astanaPrimaryUsdSqm: 1360, astanaSecondaryUsdSqm: 1240, rentalYieldAlmaty: 8.0,  rentalYieldAstana: 7.5  },
  { year: 2015, almatyPrimaryUsdSqm: 1390, almatySecondaryUsdSqm: 1280, astanaPrimaryUsdSqm: 1110, astanaSecondaryUsdSqm: 1010, rentalYieldAlmaty: 9.0,  rentalYieldAstana: 8.5  },
  { year: 2016, almatyPrimaryUsdSqm: 870,  almatySecondaryUsdSqm: 790,  astanaPrimaryUsdSqm: 720,  astanaSecondaryUsdSqm: 650,  rentalYieldAlmaty: 10.0, rentalYieldAstana: 9.5  },
  { year: 2017, almatyPrimaryUsdSqm: 920,  almatySecondaryUsdSqm: 840,  astanaPrimaryUsdSqm: 770,  astanaSecondaryUsdSqm: 700,  rentalYieldAlmaty: 9.5,  rentalYieldAstana: 9.0  },
  { year: 2018, almatyPrimaryUsdSqm: 980,  almatySecondaryUsdSqm: 900,  astanaPrimaryUsdSqm: 810,  astanaSecondaryUsdSqm: 740,  rentalYieldAlmaty: 9.0,  rentalYieldAstana: 8.5  },
  { year: 2019, almatyPrimaryUsdSqm: 950,  almatySecondaryUsdSqm: 880,  astanaPrimaryUsdSqm: 780,  astanaSecondaryUsdSqm: 720,  rentalYieldAlmaty: 9.0,  rentalYieldAstana: 8.5  },
  { year: 2020, almatyPrimaryUsdSqm: 980,  almatySecondaryUsdSqm: 920,  astanaPrimaryUsdSqm: 800,  astanaSecondaryUsdSqm: 740,  rentalYieldAlmaty: 8.5,  rentalYieldAstana: 8.0  },
  { year: 2021, almatyPrimaryUsdSqm: 1180, almatySecondaryUsdSqm: 1090, astanaPrimaryUsdSqm: 970,  astanaSecondaryUsdSqm: 890,  rentalYieldAlmaty: 7.5,  rentalYieldAstana: 7.5  },
  { year: 2022, almatyPrimaryUsdSqm: 1310, almatySecondaryUsdSqm: 1220, astanaPrimaryUsdSqm: 1080, astanaSecondaryUsdSqm: 990,  rentalYieldAlmaty: 7.0,  rentalYieldAstana: 7.0  },
  { year: 2023, almatyPrimaryUsdSqm: 1450, almatySecondaryUsdSqm: 1340, astanaPrimaryUsdSqm: 1170, astanaSecondaryUsdSqm: 1070, rentalYieldAlmaty: 7.0,  rentalYieldAstana: 6.5  },
  { year: 2024, almatyPrimaryUsdSqm: 1540, almatySecondaryUsdSqm: 1430, astanaPrimaryUsdSqm: 1240, astanaSecondaryUsdSqm: 1140, rentalYieldAlmaty: 6.5,  rentalYieldAstana: 6.5  }
];

export function realEstateByYear(year: number): RealEstateYear {
  const item = REAL_ESTATE.find((r) => r.year === year);
  if (!item) throw new Error(`No real estate data for year ${year}`);
  return item;
}
