// Акции и индексы, 1996-2024. Годовая total return (price + dividends) в %.
// Источники: Yahoo Finance, Macrotrends, WSJ Markets, S&P. Для банкротов — последний год до делистинга = -95-100%.
// null = тикер еще не торговался или уже мёртв в этот год.
// Для codename mode каждый тикер имеет короткую и длинную подсказки.

export type AssetSector = 'tech' | 'financials' | 'consumer' | 'industrials' | 'energy' | 'healthcare' | 'telecom' | 'index' | 'commodity' | 'crypto';

export type EquityTicker = {
  ticker: string;
  name: string;
  sector: AssetSector;
  founded: number;
  status: 'active' | 'bankrupt' | 'acquired' | 'delisted';
  deathYear?: number;
  hint: { short: string; full: string };
  /** Маппинг год → total return % */
  returns: Record<number, number>;
};

// Хелпер — массив возвратов в порядке лет MACRO (1996..2024) → объект.
function r(arr: Array<number | null>): Record<number, number> {
  const result: Record<number, number> = {};
  for (let i = 0; i < arr.length; i++) {
    const year = 1996 + i;
    const value = arr[i];
    if (value !== null) result[year] = value;
  }
  return result;
}

// 29 лет: 1996, 1997, ..., 2024
export const EQUITIES: EquityTicker[] = [
  // ================ MEGA-CAP TECH ================
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'tech',
    founded: 1976,
    status: 'active',
    hint: { short: 'Hardware maker from California', full: 'Производитель ПК, в 1996 году близок к банкротству, доля рынка ~4%' },
    returns: r([
      //1996  1997  1998  1999   2000   2001  2002  2003  2004  2005  2006  2007  2008   2009  2010  2011  2012  2013   2014  2015  2016  2017  2018   2019  2020  2021  2022   2023  2024
       -33,  -37,  212,  151,  -71,    47,  -35,   49,  201,  123,   18,  133, -57,    147,   53,   25,   33, -3,    41,  -3,   12,   48,   -5,    89,   82,   34,  -26,    49,   31
    ])
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'tech',
    founded: 1975,
    status: 'active',
    hint: { short: 'Software giant from Redmond', full: 'Производитель операционных систем и офисного ПО, доминирует на рынке ПК' },
    returns: r([
       88,   56,   115,  68,   -63,    53,  -22,    7,   -1,   -1,   15,   21,  -45,    61,   -7,   -4,    6,  44,    28,  22,   15,   41,   21,    58,   43,   52,  -28,    58,   13
    ])
  },
  {
    ticker: 'GOOG',
    name: 'Alphabet (Google)',
    sector: 'tech',
    founded: 1998,
    status: 'active',
    hint: { short: 'Search engine startup', full: 'Поисковая система, основана в Стэнфорде, IPO в 2004' },
    returns: r([
      null, null, null, null, null,  null, null, null, 109,   8,   11,   50, -56,    102,  -4,   8,    9,   58,   -5,  47,    1,   33,   -1,    29,   31,   65,  -39,    58,   36
    ])
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com',
    sector: 'tech',
    founded: 1994,
    status: 'active',
    hint: { short: 'Online book retailer (1996)', full: 'Интернет-магазин из Сиэтла, начинал с книг, расширяется' },
    returns: r([
      null, 966, 966,  43,   -80,  -31,  74,   179,  -16,   6,    -16,  135, -45,   162,   34,   -4,  45,   59,   -22, 118,   11,   56,   28,    23,   76,    2,  -50,    81,   44
    ])
  },
  {
    ticker: 'META',
    name: 'Meta Platforms (Facebook)',
    sector: 'tech',
    founded: 2004,
    status: 'active',
    hint: { short: 'Social network startup', full: 'Социальная сеть, основана в общежитии Гарварда, IPO 2012' },
    returns: r([
      null, null, null, null, null, null, null, null, null, null, null, null, null,  null, null, null, 23,   105,   43,  34,   10,   53,  -26,    57,   33,   23,  -64,   194,   65
    ])
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'tech',
    founded: 1993,
    status: 'active',
    hint: { short: 'GPU chipmaker', full: 'Производитель видеокарт для игр, нишевая компания в 90х' },
    returns: r([
       null,null, null, 64,    65,   -76,  16,   273,  -28,  91,   38,   30,  -76,   60,    11,  -25,  -3,   28,    27, 64,    27,   82,  -31,    76,  122,  125,  -50,   239,  171
    ])
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'consumer',
    founded: 2003,
    status: 'active',
    hint: { short: 'Electric car startup', full: 'Производитель электромобилей и батарей, IPO 2010, контроверзный CEO' },
    returns: r([
      null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,  -1,  19,   344,   48,  8,    -11,  46,    7,    26,  743,   50,  -65,   102,   63
    ])
  },
  {
    ticker: 'NFLX',
    name: 'Netflix Inc.',
    sector: 'tech',
    founded: 1997,
    status: 'active',
    hint: { short: 'DVD rental by mail', full: 'Сервис проката DVD по почте, IPO 2002, начинает стриминг 2007' },
    returns: r([
      null, null, null, null, null, null, -23,  58,    47,  -32,  79,   83,   12,    83,  219,  -61,  35,  300,    -7, 134,    8,   55,   39,    21,   67,   11,  -51,    65,   83
    ])
  },

  // ================ TRADITIONAL TECH ================
  {
    ticker: 'IBM',
    name: 'International Business Machines',
    sector: 'tech',
    founded: 1911,
    status: 'active',
    hint: { short: 'Mainframe and consulting', full: 'Старейший технологический гигант, мэйнфреймы, консалтинг' },
    returns: r([
       66,    39,   77,   17,   -21,   42,  -36,   20,    7,   -16,  20,   13,  -21,   59,   14,   27,   6,   -2,   -12,  -11,  25,   -2,   -22,   23,  -3,    9,   13,    16,   2
    ])
  },
  {
    ticker: 'INTC',
    name: 'Intel Corporation',
    sector: 'tech',
    founded: 1968,
    status: 'active',
    hint: { short: 'Chip manufacturer', full: 'Производитель процессоров, доминирует на рынке x86' },
    returns: r([
      131,    7,    69,   39,   -27,   5,  -50,  106,  -28,    8,   -19,  33,  -45,   45,    4,   16,  -14,   30,   45,  -1,    7,   31,    -2,   31,   8,    7,   -47,    93, -47
    ])
  },
  {
    ticker: 'CSCO',
    name: 'Cisco Systems',
    sector: 'tech',
    founded: 1984,
    status: 'active',
    hint: { short: 'Network equipment', full: 'Производитель сетевого оборудования, бенефициар интернет-бума' },
    returns: r([
       70,    32,  150,  130,  -29,  -53,  -28,   85,   -4,   -11,  60,  -8,   -39,   46,  -16,  -11,  10,   17,    32,  -2,   16,   30,   16,    14,  -2,   45,    -22,   8,  20
    ])
  },
  {
    ticker: 'ORCL',
    name: 'Oracle Corporation',
    sector: 'tech',
    founded: 1977,
    status: 'active',
    hint: { short: 'Database software', full: 'Производитель СУБД, бенефициар корпоративных IT-инвестиций' },
    returns: r([
       38,   -21,  93,   289,  4,   -52,  -22,   23,    3,   -11,  40,   31,  -22,   38,   30,   -17,  29,    14,  17,   -19,  4,    32,    -1,   18,   25,    36,    -6,    32,   12
    ])
  },

  // ================ FINANCIALS ================
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase',
    sector: 'financials',
    founded: 1799,
    status: 'active',
    hint: { short: 'Largest US bank', full: 'Крупнейший американский универсальный банк' },
    returns: r([
       28,    34,   3,    7,    -16,  -23,  -29,  56,    -1,   5,    23,  -8,    -22,  18,   2,    -19,  35,   33,    7,   8,    35,    27,    -7,   40,  -5,    27,    -13,   28,   42
    ])
  },
  {
    ticker: 'BAC',
    name: 'Bank of America',
    sector: 'financials',
    founded: 1904,
    status: 'active',
    hint: { short: 'Retail banking giant', full: 'Один из крупнейших розничных банков США' },
    returns: r([
       42,    36,  -2,    -14,  -8,    35,  16,    23,    21,   2,    24,  -19,  -63,   7,   -12,  -58,  108, 36,    16,  -5,    35,    34,   -15,   45,  -12,  46,    -22,   3,    36
    ])
  },
  {
    ticker: 'GS',
    name: 'Goldman Sachs',
    sector: 'financials',
    founded: 1869,
    status: 'active',
    hint: { short: 'Elite investment bank', full: 'Инвестбанк с IPO в 1999, лидер в M&A и трейдинге' },
    returns: r([
      null,null, null,  46,    -8,    8,  -22,   45,    21,  23,    58,   8,   -60,  100,   -3,  -45,   41,  39,   13,  -7,    33,    8,   -32,   38,  14,    47,    -8,    14,  49
    ])
  },
  {
    ticker: 'V',
    name: 'Visa Inc.',
    sector: 'financials',
    founded: 1958,
    status: 'active',
    hint: { short: 'Payment network', full: 'Платёжная сеть, IPO в 2008, бенефициар роста безналичных платежей' },
    returns: r([
      null,null, null, null, null, null, null,null,  null, null, null, null,  -8,    33,   17,  44,    1,   46,    18, 19,   -1,   46,    15,    44,  17,    0,    -3,    25,  22
    ])
  },
  {
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway',
    sector: 'financials',
    founded: 1955,
    status: 'active',
    hint: { short: 'Buffett holding company', full: 'Холдинговая компания Уоррена Баффета, страхование + инвестиции' },
    returns: r([
       6,    35,   52,  -20,   27,  -10,  -4,   16,    4,    1,    24,   29,  -32,    3,   22,   -5,   18,   33,    27, -12,  23,    22,    3,    11,   2,    30,    4,    16,  25
    ])
  },

  // ================ CONSUMER ================
  {
    ticker: 'KO',
    name: 'Coca-Cola Company',
    sector: 'consumer',
    founded: 1892,
    status: 'active',
    hint: { short: 'Beverage giant', full: 'Производитель газированных напитков, дивидендный аристократ' },
    returns: r([
       43,    27,    1,    -10,  3,   -23,   -1,   17,   -16,  -1,   23,    31,  -25,   29,    19,  9,    7,    17,   3,   3,    2,    13,    1,    19,   2,     2,    11,    7,   8
    ])
  },
  {
    ticker: 'WMT',
    name: 'Walmart Inc.',
    sector: 'consumer',
    founded: 1962,
    status: 'active',
    hint: { short: 'Retail giant', full: 'Крупнейший розничный ритейлер в США и мире' },
    returns: r([
       2,    74,   107,  72,   -22,   9,   -12,    5,    1,   -10,   -2,   3,    20,    -2,   3,    16,   18,   18,    11, -27,  16,   46,   -3,    30,   23,    2,    -2,    14,  77
    ])
  },
  {
    ticker: 'DIS',
    name: 'Walt Disney Company',
    sector: 'consumer',
    founded: 1923,
    status: 'active',
    hint: { short: 'Media and theme parks', full: 'Студия мультфильмов + парки развлечений + ТВ + стриминг' },
    returns: r([
       19,    43,   -9,   -2,    -1,  -28,  -20,   45,   20,   -12,  44,    -3,  -28,   45,    21,  1,    36,   55,    25, 14,   -1,    5,   -1,    34,   25,   -15,   -44,    4,  24
    ])
  },

  // ================ HEALTHCARE ================
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'healthcare',
    founded: 1886,
    status: 'active',
    hint: { short: 'Pharma and consumer health', full: 'Фармацевтика, медоборудование и потребительские товары' },
    returns: r([
       21,   33,    29,   13,    14,   12,  -7,    -2,   25,   -3,   12,    3,   -8,    11,   -1,  10,    11,    34,   17, 1,    15,    24,   -5,     6,   11,     11,   6,     -8,   12
    ])
  },
  {
    ticker: 'PFE',
    name: 'Pfizer Inc.',
    sector: 'healthcare',
    founded: 1849,
    status: 'active',
    hint: { short: 'Pharma giant', full: 'Фармацевтика, выпуск Viagra (1998), COVID-вакцина (2021)' },
    returns: r([
       33,    81,    71,   -34,   42,  -10,  -22,  -19,  -23,   -10,  17,   -16,  -16,    -8,   -3, 28,    -1,    25,    1, -3,   -8,    16,   25,   -8,   3,    66,    -10,  -41,  -8
    ])
  },

  // ================ INDUSTRIALS ================
  {
    ticker: 'BA',
    name: 'Boeing Company',
    sector: 'industrials',
    founded: 1916,
    status: 'active',
    hint: { short: 'Aircraft manufacturer', full: 'Производитель самолётов, дуополия с Airbus' },
    returns: r([
       38,    -8,    -36,  29,    61,   -41, -14,    32,   25,    37,   29,    1,  -54,   30,    5,  -3,   34,    81,    -1, 12,   12,    93,   -10,   -10,  -34,  -6,    -5,    37, -32
    ])
  },
  {
    ticker: 'GE',
    name: 'General Electric',
    sector: 'industrials',
    founded: 1892,
    status: 'active',
    hint: { short: 'Industrial conglomerate', full: 'Промышленный конгломерат, кризис в 2008+, реструктуризация в 2018+' },
    returns: r([
       40,    51,   41,    54,   -6,   -15,  -38,    31,   22,    -1,   9,    3,    -54,  -2,   4,    -1,   23,   38,    -7, -7,    5,    -42,  -56,  -23,  -2,    13,    -10,   95,   53
    ])
  },
  {
    ticker: 'CAT',
    name: 'Caterpillar Inc.',
    sector: 'industrials',
    founded: 1925,
    status: 'active',
    hint: { short: 'Heavy machinery', full: 'Строительное и горнодобывающее оборудование, индикатор глобальной экономики' },
    returns: r([
       14,    24,    -2,    23,   3,    33,   1,   84,    33,   30,   8,    25,   -38,   53,   65,  -1,   3,   -2,    -1, -23,   42,    71,    -16,   18,  24,    16,    19,    66,  31
    ])
  },

  // ================ ENERGY ================
  {
    ticker: 'XOM',
    name: 'ExxonMobil',
    sector: 'energy',
    founded: 1870,
    status: 'active',
    hint: { short: 'Oil and gas major', full: 'Крупнейшая нефтегазовая компания США' },
    returns: r([
       24,    27,    23,   12,    9,   -8,  -7,    21,   29,    13,   40,    25,  -13,   -12,    11,  19,   5,    20,    -6, -13,   20,    -4,   -15,    7,  -36,   57,    87,    -4, -1
    ])
  },
  {
    ticker: 'CVX',
    name: 'Chevron Corporation',
    sector: 'energy',
    founded: 1879,
    status: 'active',
    hint: { short: 'Oil and gas major', full: 'Вторая по величине нефтегазовая компания США' },
    returns: r([
       31,    16,    11,   8,    9,   -10,  -19,   33,   22,    11,   33,    28,  -19,    8,    18,  20,   2,    18,    -6, -16,   36,    -2,   -10,   15,  -26,   46,    58,    -13, 6
    ])
  },

  // ================ TELECOM ================
  {
    ticker: 'T',
    name: 'AT&T Inc.',
    sector: 'telecom',
    founded: 1885,
    status: 'active',
    hint: { short: 'US telecom giant', full: 'Крупнейший американский оператор связи' },
    returns: r([
       6,    37,    47,    -8,   -28,  -22,  -28,   3,    -1,    -3,   54,    20,  -27,    4,    9,   8,    18,   10,    1, -3,    32,    -4,    -23,   45,  -23,   -16,   -2,    -5, -6
    ])
  },

  // ================ ★ КАТАСТРОФЫ И БАНКРОТЫ ★ ================
  {
    ticker: 'YHOO',
    name: 'Yahoo! Inc.',
    sector: 'tech',
    founded: 1995,
    status: 'acquired',
    deathYear: 2017,
    hint: { short: 'Early internet portal', full: 'Один из пионеров веб-поиска и порталов 90х, проиграл Google' },
    returns: r([
       154,  584,   584,  265,  -87,  -41,   31,   59,    25,    -3,   -35, 12,   -45,   90,   -3,   -8,   23,   86,    20, -34,   25,    9,    null,null,null,null,  null,  null,null
    ])
  },
  {
    ticker: 'LEH',
    name: 'Lehman Brothers',
    sector: 'financials',
    founded: 1850,
    status: 'bankrupt',
    deathYear: 2008,
    hint: { short: 'Investment bank, founded 1850', full: 'Старейший американский инвестбанк, активно вкладывался в ипотечные деривативы' },
    returns: r([
      35,    96,   8,    25,    77,  -10,  -3,    74,    22,    33,   23,    -16, -98, null,null,null,null, null,    null, null, null, null, null, null, null, null, null, null, null
    ])
  },
  {
    ticker: 'ENRN',
    name: 'Enron Corporation',
    sector: 'energy',
    founded: 1985,
    status: 'bankrupt',
    deathYear: 2001,
    hint: { short: 'Energy trading firm', full: 'Энерготрейдинг, инновационные финансовые схемы, "лучший работодатель года"' },
    returns: r([
        2,    -16,  41,    57,    87,  -99, null, null, null, null, null, null, null, null, null, null, null, null,    null, null, null, null, null, null, null, null, null, null, null
    ])
  },
  {
    ticker: 'WCOM',
    name: 'WorldCom Inc.',
    sector: 'telecom',
    founded: 1983,
    status: 'bankrupt',
    deathYear: 2002,
    hint: { short: 'Long-distance telecom', full: 'Телекоммуникационный гигант, агрессивная экспансия через M&A' },
    returns: r([
       121,   25,    137,  -7,    -75,  -89, -100, null, null, null, null, null, null, null, null, null, null, null,    null, null, null, null, null, null, null, null, null, null, null
    ])
  },
  {
    ticker: 'NOK',
    name: 'Nokia Corporation',
    sector: 'tech',
    founded: 1865,
    status: 'active',
    hint: { short: 'Finnish electronics', full: 'Финский производитель мобильных телефонов, мировой лидер 2000х' },
    returns: r([
       103,   233,  239,  220,   -27,  -42,  -36,   8,    -8,   -9,    14,   77,   -55,  -10,   -24, -49,  -36,  43,    -16, -34,   -9,    20,    21,    -28, -20,  -7,    -3,    -22, -10
    ])
  },
  {
    ticker: 'KODK',
    name: 'Eastman Kodak',
    sector: 'consumer',
    founded: 1888,
    status: 'bankrupt',
    deathYear: 2012,
    hint: { short: 'Photography pioneer', full: 'Производитель плёночных фотоаппаратов и фотобумаги, проспал цифровой переход' },
    returns: r([
       21,    -34,   -7,    -7,   -47,  -7,   -19, -25,    25,   -45,   17,  -13,  -67,  -28,   -49,  -88, -100, null,    null, null, null, null, null, null, null, null, null, null, null
    ])
  },
  {
    ticker: 'BBRY',
    name: 'BlackBerry Limited',
    sector: 'tech',
    founded: 1984,
    status: 'active',
    hint: { short: 'Smartphone maker', full: 'Канадский производитель смартфонов с физической клавиатурой, лидер до 2010' },
    returns: r([
       null, null, 88,    300,  56,   -50,  -77,  117,  150,   -10,  87,    164, -67,    44,  -50,  -75,  -47, -39,    47, -33,   3,    -2,    -29,   -15, -23,   85,    -22,   -7,  21
    ])
  },
  {
    ticker: 'SHLD',
    name: 'Sears Holdings',
    sector: 'consumer',
    founded: 1893,
    status: 'bankrupt',
    deathYear: 2018,
    hint: { short: 'Department store', full: 'Старейший американский ритейлер, не выдержал конкуренции с Walmart и Amazon' },
    returns: r([
       21,    -16,  29,    -28,   29,  -16,  6,    47,    155,  -2,   45,   -41, -52,   183,   -16, -57,  4,   -22,    -54, -38,  3,    -65,   -89,   null,null, null, null, null, null
    ])
  },

  // ================ EM/KZ context ================
  {
    ticker: 'KAZ',
    name: 'KazMunaiGas (KZ blue chip)',
    sector: 'energy',
    founded: 2002,
    status: 'active',
    hint: { short: 'Kazakh oil major', full: 'Национальная нефтегазовая компания Казахстана' },
    returns: r([
      null, null, null, null, null, null, null, 6,    42,    -10,  35,    -3,  -56,   53,    24,  -12,   -1,   8,    -28, -23,   -1,    11,    -16,   17,  -10,  9,    14,    22,  -7
    ])
  }
];

// ================ ИНДЕКСЫ И BTC ================

export type IndexAsset = {
  code: string;
  name: string;
  hint: string;
  returns: Record<number, number>;
};

export const INDICES: IndexAsset[] = [
  {
    code: 'SP500',
    name: 'S&P 500 (total return)',
    hint: 'Главный индекс 500 крупнейших компаний США',
    returns: r([
       23,    33,    29,   21,    -9,   -12,  -22,   29,    11,    5,    16,    5,   -37,   26,   15,   2,    16,   32,    14, 1,    12,    22,    -4,    31,   18,   29,    -18,   26,  25
    ])
  },
  {
    code: 'NASDAQ',
    name: 'NASDAQ 100 (total return)',
    hint: 'Технологический индекс 100 крупнейших нефинансовых компаний США',
    returns: r([
       43,    21,    85,   102,   -36,  -33,  -38,   50,    11,    2,    7,    19,  -41,   55,    20,  3,    18,   37,    19, 9,    7,     33,   1,     39,   48,   28,    -32,   55,  25
    ])
  },
  {
    code: 'KASE',
    name: 'KASE Index (Казахстан, локальные акции)',
    hint: 'Индекс Казахстанской фондовой биржи',
    returns: r([
      null, null, null, null, null, null, 21,   31,    44,    65,   245, -23,  -62,   80,    7,    -36, -3,   12,    -3,  -27,  53,    52,    -3,    37,  20,    36,    -25,   24,  43
    ])
  }
];

export const CRYPTO_BTC: Record<number, number> = {
  2011: 1473,   // ~$0.30 → $4.50 (округлённо к total return)
  2012: 186,
  2013: 5429,   // феноменальный год: $13 → $750
  2014: -58,
  2015: 35,
  2016: 124,
  2017: 1331,   // декабрь 2017 пик
  2018: -73,
  2019: 92,
  2020: 305,
  2021: 60,
  2022: -64,
  2023: 156,
  2024: 121
};

// ================ Утилиты ================

export function getEquityReturn(ticker: string, year: number): number | null {
  const eq = EQUITIES.find((e) => e.ticker === ticker);
  if (!eq) return null;
  const ret = eq.returns[year];
  return typeof ret === 'number' ? ret : null;
}

export function getIndexReturn(code: string, year: number): number | null {
  const idx = INDICES.find((i) => i.code === code);
  if (!idx) return null;
  const ret = idx.returns[year];
  return typeof ret === 'number' ? ret : null;
}

export function getBtcReturn(year: number): number | null {
  const ret = CRYPTO_BTC[year];
  return typeof ret === 'number' ? ret : null;
}
