// Карты событий. Применяются после торговой фазы и влияют на возвраты активов.
// type: 'real' — привязано к конкретному году (исторический факт).
//       'floating' — может случиться в любой год периода.
//       'fake' — отображается как новость, эффекта нет (для шума).

export type EventEffectTarget =
  | { kind: 'ticker'; ticker: string }
  | { kind: 'sector'; sector: string }
  | { kind: 'index'; code: string }
  | { kind: 'asset'; assetId: string };

export type EventCard = {
  id: string;
  title: string;
  description: string;
  type: 'real' | 'floating' | 'fake';
  year?: number;             // только для real
  effects: Array<{
    target: EventEffectTarget;
    multiplier: number;      // мультипликатор на годовую доходность
  }>;
  tone: 'crisis' | 'boom' | 'shock' | 'neutral';
};

// =====================================================================
// REAL — точно бьют в год публикации (исторические факты)
// =====================================================================

export const REAL_EVENTS: EventCard[] = [
  // 1997
  {
    id: 'asian-crisis-1997',
    title: '🌏 Азиатский финансовый кризис',
    description: 'Девальвация таиландского бата запускает цепную реакцию. Корея, Индонезия, Малайзия — валюты в свободном падении, МВФ выдает рекордные кредиты.',
    type: 'real',
    year: 1997,
    tone: 'crisis',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.97 }
    ]
  },

  // 1998
  {
    id: 'russia-default-1998',
    title: '🪆 Дефолт России и крах LTCM',
    description: 'Россия объявляет технический дефолт по ГКО. Хедж-фонд LTCM с лауреатами Нобеля разоряется, ФРС координирует bail-out на $3.6 млрд.',
    type: 'real',
    year: 1998,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.93 }
    ]
  },

  // 1999
  {
    id: 'y2k-panic-1999',
    title: '🖥️ Y2K-паника',
    description: 'СМИ пугают: 1 января 2000 года компьютеры по всему миру откажут. Корпорации тратят миллиарды на патчи. IT-консалтинг переживает золотой год.',
    type: 'real',
    year: 1999,
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.08 }
    ]
  },
  {
    id: 'euro-launch-1999',
    title: '💶 Запуск евро',
    description: 'Введён единый евровалютный режим для 11 стран ЕС. Глобальные финансовые рынки переоценивают валютные риски.',
    type: 'real',
    year: 1999,
    tone: 'neutral',
    effects: []
  },

  // 2000
  {
    id: 'dotcom-bust',
    title: '🔥 Лопается пузырь доткомов',
    description: 'Технологический сектор обвалился. NASDAQ потерял почти половину стоимости за год. Инвесторы сжигают деньги, мечтавшие об IPO стартапы массово банкротятся.',
    type: 'real',
    year: 2000,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.85 }
    ]
  },

  // 2001
  {
    id: 'nine-eleven',
    title: '🛑 11 сентября 2001',
    description: 'Террористическая атака на башни-близнецы. Авиаперевозки остановлены, страховая отрасль шокирована, оборонный сектор резко вырастает.',
    type: 'real',
    year: 2001,
    tone: 'shock',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.95 },
      { target: { kind: 'ticker', ticker: 'BA' }, multiplier: 0.90 }
    ]
  },
  {
    id: 'enron-scandal',
    title: '⚠️ Крах Enron',
    description: 'Энергетический гигант оказался финансовой пирамидой. Скандал ударил по доверию к корпоративной отчётности США.',
    type: 'real',
    year: 2001,
    tone: 'shock',
    effects: [
      { target: { kind: 'ticker', ticker: 'ENRN' }, multiplier: 0.01 }
    ]
  },

  // 2002
  {
    id: 'worldcom-scandal-2002',
    title: '📉 Скандал WorldCom',
    description: 'Раскрыто бухгалтерское мошенничество на $11 млрд. Крупнейшее банкротство в истории на тот момент. Доверие к телеком-сектору подорвано.',
    type: 'real',
    year: 2002,
    tone: 'crisis',
    effects: [
      { target: { kind: 'ticker', ticker: 'WCOM' }, multiplier: 0.01 },
      { target: { kind: 'sector', sector: 'telecom' }, multiplier: 0.92 }
    ]
  },

  // 2003
  {
    id: 'iraq-war-2003',
    title: '🛢️ Война в Ираке',
    description: 'Коалиция США вторгается в Ирак. Цена нефти растёт, оборонные акции на максимумах, ралли на ожидании восстановления.',
    type: 'real',
    year: 2003,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.05 }
    ]
  },

  // 2004
  {
    id: 'google-ipo-2004',
    title: '🔎 IPO Google',
    description: 'Google выходит на биржу по необычной схеме голландского аукциона. Размещение по $85, к концу года акция выше $190.',
    type: 'real',
    year: 2004,
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'GOOG' }, multiplier: 1.15 }
    ]
  },

  // 2005
  {
    id: 'katrina-2005',
    title: '🌀 Ураган Катрина',
    description: 'Один из самых разрушительных ураганов в истории США. Нефтедобыча в Мексиканском заливе остановлена, цены на бензин бьют рекорды.',
    type: 'real',
    year: 2005,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.06 }
    ]
  },

  // 2006
  {
    id: 'kz-realestate-boom',
    title: '🏗️ Бум недвижимости в Казахстане',
    description: 'Цены на квартиры в Алматы и Астане растут на десятки процентов в год. Все вокруг покупают вторую и третью квартиру в кредит.',
    type: 'real',
    year: 2006,
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 1.10 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 1.10 },
      { target: { kind: 'asset', assetId: 'realestate_almaty_secondary' }, multiplier: 1.08 }
    ]
  },

  // 2007
  {
    id: 'subprime-cracks-2007',
    title: '🏚️ Первые трещины ипотечного рынка',
    description: 'Bear Stearns закрывает два хедж-фонда, потерявших всё на subprime. BNP Paribas замораживает фонды. Запах кризиса в воздухе.',
    type: 'real',
    year: 2007,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.95 }
    ]
  },

  // 2008
  {
    id: 'gfc',
    title: '💥 Глобальный финансовый кризис',
    description: 'Lehman Brothers объявил банкротство. Рынки в свободном падении, банки в панике, ФРС снижает ставки до нуля. Кризис распространяется по всему миру.',
    type: 'real',
    year: 2008,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.90 },
      { target: { kind: 'ticker', ticker: 'LEH' }, multiplier: 0.02 }
    ]
  },
  {
    id: 'kz-realestate-bust',
    title: '🏚️ Обвал недвижимости в Казахстане',
    description: 'Кризис ликвидности у строителей, БТА банк национализирован. Цены на жильё падают на 30-40% за год.',
    type: 'real',
    year: 2008,
    tone: 'crisis',
    effects: [
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 0.92 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 0.92 }
    ]
  },

  // 2009
  {
    id: 'stimulus-rally-2009',
    title: '💰 Стимул и ралли восстановления',
    description: 'Конгресс принимает пакет стимула на $787 млрд. ФРС запускает QE. Рынки разворачиваются — начинается одно из самых длинных бычьих ралли.',
    type: 'real',
    year: 2009,
    tone: 'boom',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 1.05 },
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 1.08 }
    ]
  },

  // 2010
  {
    id: 'greek-crisis-2010',
    title: '🇬🇷 Долговой кризис в Греции',
    description: 'Греция на грани дефолта. Тройка (МВФ, ЕС, ЕЦБ) выделяет первый пакет на €110 млрд. Евро-зона трещит по швам, банки в Европе под ударом.',
    type: 'real',
    year: 2010,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.96 }
    ]
  },
  {
    id: 'flash-crash-2010',
    title: '⚡ Flash Crash 6 мая',
    description: 'Алгоритмическая торговля устроила обвал Dow на 9% за 36 минут. Восстановление к закрытию, но регуляторы впервые задумываются о HFT.',
    type: 'real',
    year: 2010,
    tone: 'shock',
    effects: []
  },

  // 2011
  {
    id: 'sp-downgrade-2011',
    title: '🇺🇸 S&P снижает рейтинг США',
    description: 'Впервые в истории США теряют AAA-рейтинг от S&P. Парадокс — Treasuries растут, акции падают. Золото бьёт исторические максимумы.',
    type: 'real',
    year: 2011,
    tone: 'shock',
    effects: [
      { target: { kind: 'asset', assetId: 'gold' }, multiplier: 1.10 },
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.96 }
    ]
  },

  // 2012
  {
    id: 'facebook-ipo-2012',
    title: '📘 IPO Facebook',
    description: 'Социальная сеть выходит на биржу по $38. NASDAQ глючит во время торгов, акция падает ниже $20 за месяцы. Долгое восстановление.',
    type: 'real',
    year: 2012,
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'META' }, multiplier: 1.05 }
    ]
  },

  // 2013
  {
    id: 'taper-tantrum-2013',
    title: '📈 Taper Tantrum',
    description: 'Бернанке намекает на сворачивание QE. Доходности Treasury взлетают, развивающиеся рынки распродают валюты. Облигации в минусе впервые за годы.',
    type: 'real',
    year: 2013,
    tone: 'shock',
    effects: [
      { target: { kind: 'asset', assetId: 'us_treasury_10y' }, multiplier: 0.93 }
    ]
  },

  // 2014
  {
    id: 'kzt-devalue-2014',
    title: '💸 Девальвация тенге',
    description: 'Нацбанк РК провёл одномоментную девальвацию: курс с 155 до 185 за доллар. Тенговые активы за день потеряли ~20% долларового эквивалента.',
    type: 'real',
    year: 2014,
    tone: 'shock',
    effects: []
  },
  {
    id: 'oil-crash-2014',
    title: '🛢️ Обвал цен на нефть',
    description: 'С июня по декабрь Brent падает с $115 до $50. Сланцевая революция в США + отказ ОПЕК сокращать добычу. Энергетические акции рушатся.',
    type: 'real',
    year: 2014,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 0.88 }
    ]
  },

  // 2015
  {
    id: 'kzt-float-2015',
    title: '💱 Свободное плавание тенге',
    description: 'Нацбанк отпустил тенге в свободное плавание. За полгода курс ушёл с 185 до 340. Депозиты в KZT обесценились вдвое.',
    type: 'real',
    year: 2015,
    tone: 'shock',
    effects: []
  },
  {
    id: 'china-slowdown-2015',
    title: '🇨🇳 Замедление Китая',
    description: 'Шанхайский индекс рушится на 30% за лето. Юань впервые девальвирован. Сырьевые рынки и развивающиеся страны под ударом.',
    type: 'real',
    year: 2015,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 }
    ]
  },

  // 2016
  {
    id: 'brexit-2016',
    title: '🇬🇧 Брексит',
    description: 'Великобритания голосует за выход из ЕС. Фунт стерлингов теряет 10% за день, банки переоценивают европейские активы.',
    type: 'real',
    year: 2016,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.96 }
    ]
  },
  {
    id: 'trump-elect-2016',
    title: '🇺🇸 Победа Трампа',
    description: 'Неожиданная победа на выборах в США. Фьючерсы Dow падают на 800 пунктов ночью, но к утру разворачиваются. Ралли на ожиданиях снижения налогов.',
    type: 'real',
    year: 2016,
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 1.05 }
    ]
  },

  // 2017
  {
    id: 'crypto-mania-2017',
    title: '🚀 Криптомания',
    description: 'Bitcoin взлетает с $1000 до $20000 за год. ICO-проекты собирают миллиарды. CNBC учит бабушек покупать Ethereum.',
    type: 'real',
    year: 2017,
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 1.20 }
    ]
  },

  // 2018
  {
    id: 'crypto-crash-2018',
    title: '🪙 Криптозима',
    description: 'Bitcoin падает с $20000 до $3200 за год. ICO-пузырь сдувается, биржи под расследованиями SEC. Криптоэнтузиасты в депрессии.',
    type: 'real',
    year: 2018,
    tone: 'crisis',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 0.65 }
    ]
  },
  {
    id: 'us-china-trade-2018',
    title: '🌐 Торговая война США-Китай',
    description: 'Введены тарифы $200 млрд на китайские товары. Apple, Caterpillar и другие глобальные компании предупреждают о падении прибыли.',
    type: 'real',
    year: 2018,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 },
      { target: { kind: 'ticker', ticker: 'AAPL' }, multiplier: 0.92 }
    ]
  },

  // 2019
  {
    id: 'yield-inversion-2019',
    title: '📉 Инверсия кривой доходности',
    description: 'Короткие Treasuries дают доходность выше длинных — классический сигнал рецессии. Все экономисты предсказывают кризис в 2020. (И были правы, но не угадали причину.)',
    type: 'real',
    year: 2019,
    tone: 'shock',
    effects: []
  },

  // 2020
  {
    id: 'covid-2020',
    title: '🦠 Пандемия COVID-19',
    description: 'Глобальный локдаун. Авиаперевозки остановлены, нефть кратко уходит в минус. Технологии и фарма растут на удалёнке и вакцинной гонке.',
    type: 'real',
    year: 2020,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.08 },
      { target: { kind: 'sector', sector: 'healthcare' }, multiplier: 1.05 },
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 0.85 }
    ]
  },

  // 2021
  {
    id: 'meme-stocks-2021',
    title: '🦍 Восстание мемных акций',
    description: 'WallStreetBets устраивает short squeeze GameStop и AMC. Hedge fund Melvin Capital теряет миллиарды. Robinhood ограничивает покупки.',
    type: 'real',
    year: 2021,
    tone: 'shock',
    effects: []
  },
  {
    id: 'evergrande-2021',
    title: '🏗️ Кризис Evergrande',
    description: 'Крупнейший китайский застройщик не может обслуживать $300 млрд долга. Эксперты предсказывают «Lehman момент» для Китая.',
    type: 'real',
    year: 2021,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.97 }
    ]
  },

  // 2022
  {
    id: 'inflation-surge-2022',
    title: '📈 Инфляционный шок',
    description: 'Инфляция в США достигла 9%, ФРС агрессивно поднимает ставки. Облигации и акции роста падают синхронно. Сырьё и энергоносители на максимумах.',
    type: 'real',
    year: 2022,
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.88 },
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.10 }
    ]
  },
  {
    id: 'war-2022',
    title: '⚔️ Война в Восточной Европе',
    description: 'Военный конфликт между Россией и Украиной. Цены на нефть и газ взлетают, оборонные акции растут, ESG-фонды переоценивают позиции.',
    type: 'real',
    year: 2022,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.05 }
    ]
  },
  {
    id: 'ftx-collapse-2022',
    title: '💀 Крах FTX',
    description: 'Третья по величине крипто-биржа лопается за дни. SBF арестован, $8 млрд клиентских средств испарилось. Bitcoin падает к $16k.',
    type: 'real',
    year: 2022,
    tone: 'crisis',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 0.85 }
    ]
  },

  // 2023
  {
    id: 'ai-boom-2023',
    title: '🤖 AI-революция',
    description: 'ChatGPT и большие языковые модели меняют экономику. Производители GPU взлетают, IT-консалтинг переориентируется на AI.',
    type: 'real',
    year: 2023,
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'NVDA' }, multiplier: 1.15 },
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.05 }
    ]
  },
  {
    id: 'banking-crisis-2023',
    title: '🏦 Региональные банки США падают',
    description: 'Silicon Valley Bank, Signature, First Republic — три крупных банка лопаются за месяц. ФРС и FDIC экстренно стабилизируют систему.',
    type: 'real',
    year: 2023,
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.94 }
    ]
  },

  // 2024
  {
    id: 'btc-halving-2024',
    title: '⛏️ Халвинг биткоина + ETF',
    description: 'Четвёртое сокращение награды майнеров вдвое + одобрение спотовых BTC-ETF. Институционалы массово заходят в крипту.',
    type: 'real',
    year: 2024,
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 1.15 }
    ]
  },
  {
    id: 'nvidia-trillion-2024',
    title: '💎 NVIDIA — $3 трлн капитализации',
    description: 'NVIDIA обгоняет Apple и Microsoft по капитализации. Каждый AI-стартап покупает GPU в долг. Скептики говорят о пузыре.',
    type: 'real',
    year: 2024,
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'NVDA' }, multiplier: 1.10 }
    ]
  }
];

// =====================================================================
// FLOATING — могут случиться в любой год периода
// =====================================================================

export const FLOATING_EVENTS: EventCard[] = [
  // --- TECH ---
  {
    id: 'cyberattack',
    title: '🛡️ Крупная кибератака на банки',
    description: 'Хакеры взломали системы нескольких банков. Финансовые акции под давлением, кибербезопасность в спросе.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'data-breach-mega',
    title: '🔓 Утечка данных миллиардов пользователей',
    description: 'Крупнейший в истории leak персональных данных. Доверие к big tech подорвано, регуляторы готовят штрафы.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.94 }
    ]
  },
  {
    id: 'quantum-breakthrough',
    title: '⚛️ Прорыв в квантовых вычислениях',
    description: 'Исследователи объявляют о практическом превосходстве квантового процессора. Tech-сектор в эйфории — будущее наступает.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.07 }
    ]
  },
  {
    id: 'semiconductor-shortage',
    title: '🔌 Дефицит полупроводников',
    description: 'Автопроизводители останавливают конвейеры. Производители чипов — рекордная маржа, остальные индустрии — простой.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'ticker', ticker: 'NVDA' }, multiplier: 1.10 },
      { target: { kind: 'ticker', ticker: 'INTC' }, multiplier: 1.08 },
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.93 }
    ]
  },
  {
    id: 'cloud-outage-cascade',
    title: '☁️ Каскадный сбой облачных сервисов',
    description: 'AWS/Azure лежали 14 часов. Тысячи бизнесов парализованы. Вопрос диверсификации инфраструктуры — впервые на первой полосе.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'ticker', ticker: 'AMZN' }, multiplier: 0.95 },
      { target: { kind: 'ticker', ticker: 'MSFT' }, multiplier: 0.96 }
    ]
  },
  {
    id: 'ai-regulation-panic',
    title: '⚖️ AI-регулирование: жёсткие правила',
    description: 'ЕС и США одновременно вводят строгие правила для AI-моделей. Открытые LLM ограничены, comply-cost растёт.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'antitrust',
    title: '⚖️ Антимонопольное расследование',
    description: 'Регулятор инициирует разбирательство против крупнейших технологических корпораций.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'social-media-crackdown',
    title: '📱 Бунт против социальных сетей',
    description: 'Серия скандалов: алгоритмы вредят подросткам, выборы манипулируются ботами. Регуляторы готовят жёсткий contentact act.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'ticker', ticker: 'META' }, multiplier: 0.90 }
    ]
  },

  // --- FINANCIALS ---
  {
    id: 'hedge-fund-blowup',
    title: '💥 Крах крупного хедж-фонда',
    description: 'Известный фонд с активами $30+ млрд не выдерживает margin call. Кредиторы (банки) объявляют о списании миллиардных позиций.',
    type: 'floating',
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.93 }
    ]
  },
  {
    id: 'central-bank-hike-surprise',
    title: '📈 Внезапная ставка ФРС',
    description: 'Регулятор повышает ставку на 75 б.п. вместо ожидавшихся 50. Облигации в минусе, акции роста падают сильнее всех.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'asset', assetId: 'us_treasury_10y' }, multiplier: 0.95 },
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.94 }
    ]
  },
  {
    id: 'sovereign-default',
    title: '🏛️ Дефолт развивающейся экономики',
    description: 'Аргентина (или похожая страна) объявляет дефолт. Облигации EM-рынков распродаются, инвесторы бегут в качество.',
    type: 'floating',
    tone: 'crisis',
    effects: [
      { target: { kind: 'asset', assetId: 'kz_govt_bond' }, multiplier: 0.94 }
    ]
  },
  {
    id: 'bank-stress-test',
    title: '🏦 Банковский стресс-тест провалили',
    description: 'Несколько крупных банков не прошли стресс-тест ФРС. Дивиденды под угрозой.',
    type: 'floating',
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.93 }
    ]
  },
  {
    id: 'insider-trading-scandal',
    title: '🕵️ Скандал с инсайдерской торговлей',
    description: 'SEC поймала руководителей крупного банка на торговле по непубличной информации. Штрафы и отставки.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.96 }
    ]
  },

  // --- ENERGY / COMMODITIES ---
  {
    id: 'oil-deal',
    title: '🛢️ ОПЕК+ снижает добычу',
    description: 'Картель резко сокращает квоты на добычу нефти. Цены на сырьё растут.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.07 }
    ]
  },
  {
    id: 'energy-shortage',
    title: '⚡ Энергетический кризис',
    description: 'Дефицит электроэнергии в крупных регионах. Промышленность сокращает производство.',
    type: 'floating',
    tone: 'crisis',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.92 },
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.06 }
    ]
  },
  {
    id: 'saudi-refinery-attack',
    title: '💣 Удар по саудовским НПЗ',
    description: 'Дрон-атака на ключевые нефтепереработки. 5% мировой добычи offline. Brent взлетает за час на 15%.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.09 }
    ]
  },
  {
    id: 'lithium-rush',
    title: '🔋 Литиевая лихорадка',
    description: 'Спрос на батареи для EV выходит из-под контроля. Литий +200% за год. EV-производители страдают, добытчики ликуют.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'TSLA' }, multiplier: 0.95 },
      { target: { kind: 'asset', assetId: 'silver' }, multiplier: 1.07 }
    ]
  },
  {
    id: 'rare-earths-embargo',
    title: '🌐 Эмбарго на редкоземельные металлы',
    description: 'Китай ограничивает экспорт галлия и германия. Производители электроники ищут альтернативы — найти будет непросто.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 0.95 },
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 }
    ]
  },
  {
    id: 'pipeline-rupture',
    title: '🛢️ Авария на крупном трубопроводе',
    description: 'Разрыв магистрали на пару недель отрезает поставки. Спред между сортами нефти достиг рекорда.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.04 }
    ]
  },
  {
    id: 'carbon-tax-wave',
    title: '🌱 Волна углеродных налогов',
    description: 'Несколько крупных экономик одновременно вводят carbon tax. Нефтегаз и тяжпром платят, технологии и возобновляемая энергетика выигрывают.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 0.93 },
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.03 }
    ]
  },

  // --- HEALTHCARE ---
  {
    id: 'biotech-breakthrough',
    title: '💊 Прорыв в биотехнологиях',
    description: 'Открыт новый класс лекарств против рака. Фармацевтика в эйфории.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'healthcare' }, multiplier: 1.08 }
    ]
  },
  {
    id: 'drug-pricing-reform',
    title: '💉 Реформа цен на лекарства',
    description: 'Конгресс согласует ограничение цен на популярные препараты. Pfizer, J&J и др. ждут падения маржи.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'healthcare' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'pandemic-scare-false-alarm',
    title: '🌡️ Эпидемическая тревога',
    description: 'Новый патоген в Юго-Восточной Азии. Авиаперевозки и туризм в нокауте. Через полгода окажется, что это была ложная тревога.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'healthcare' }, multiplier: 1.05 },
      { target: { kind: 'ticker', ticker: 'DIS' }, multiplier: 0.93 }
    ]
  },

  // --- CONSUMER / INDUSTRIAL ---
  {
    id: 'consumer-confidence-up',
    title: '🛒 Рост потребительского спроса',
    description: 'Индекс потребительского доверия на максимуме за десятилетие. Ритейл и развлечения в плюсе.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 1.06 }
    ]
  },
  {
    id: 'auto-strike',
    title: '🚗 Забастовка автоконцернов',
    description: 'UAW объявляет одновременную забастовку на Ford, GM, Stellantis. Производство встало, акции автопроизводителей падают.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 0.94 }
    ]
  },
  {
    id: 'streaming-wars',
    title: '🎬 Стриминг-войны накаляются',
    description: 'Netflix, Disney+ и Amazon Prime ведут ценовые войны. Маржа стриминга падает у всех, кроме победителя.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'ticker', ticker: 'NFLX' }, multiplier: 0.92 },
      { target: { kind: 'ticker', ticker: 'DIS' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'container-crisis',
    title: '🚢 Кризис контейнерных перевозок',
    description: 'Пробка в Суэцком канале + рост ставок фрахта в 5 раз. Импортёры платят, экспортёры ждут.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 },
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 0.96 }
    ]
  },
  {
    id: 'food-shortage-drought',
    title: '🌾 Засуха ударяет по урожаю',
    description: 'Аномальная жара в США и Европе. Пшеница, кукуруза, соя — цены растут. Сетям ресторанов и производителям не сладко.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 0.95 }
    ]
  },
  {
    id: 'trade-war',
    title: '🌐 Новая волна торговых пошлин',
    description: 'Введены взаимные пошлины между крупнейшими экономиками. Производственные цепочки рвутся.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 },
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 0.97 }
    ]
  },

  // --- GEOPOLITICAL ---
  {
    id: 'election-shock',
    title: '🗳️ Неожиданный исход выборов',
    description: 'В крупной экономике победил кандидат с радикальной программой. Рынки переоценивают всё подряд.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.97 }
    ]
  },
  {
    id: 'sanctions-wave',
    title: '🚫 Новая волна санкций',
    description: 'Несколько стран попали под жёсткие санкции. Глобальные банки замораживают активы, нефть растёт.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'energy' }, multiplier: 1.05 },
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.96 }
    ]
  },

  // --- REAL ESTATE / KZ ---
  {
    id: 'mortgage-rate-spike',
    title: '🏠 Резкий скачок ипотечных ставок',
    description: 'Ипотека дорожает на 2 п.п. за квартал. Рынок жилья замирает, строители режут планы.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 0.96 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 0.96 }
    ]
  },
  {
    id: 'foreign-investment-kz',
    title: '💰 Большие иностранные инвестиции в Казахстан',
    description: 'Подписаны контракты с китайскими и эмиратскими фондами на $5+ млрд. Алматы и Астана в фокусе.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 1.06 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 1.06 },
      { target: { kind: 'ticker', ticker: 'KAZ' }, multiplier: 1.05 }
    ]
  },
  {
    id: 'kz-tax-reform',
    title: '📜 Налоговая реформа в Казахстане',
    description: 'Введены новые льготы для МСБ и IT-сектора. Иностранные инвесторы переоценивают KZ-активы.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'KAZ' }, multiplier: 1.04 }
    ]
  },

  // --- CRYPTO ---
  {
    id: 'btc-etf-approval',
    title: '🪙 Регулятор одобряет BTC-ETF',
    description: 'SEC одобряет спотовый Bitcoin-ETF. Институциональные деньги хлынули в крипту.',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 1.20 }
    ]
  },
  {
    id: 'stablecoin-depeg',
    title: '💔 Стейблкоин теряет привязку',
    description: 'Крупный USD-стейблкоин обвалился до $0.85. Криптобиржи в панике, regulators готовят жёсткие меры.',
    type: 'floating',
    tone: 'crisis',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 0.85 }
    ]
  },
  {
    id: 'crypto-mining-crackdown',
    title: '⛏️ Запрет крипто-майнинга',
    description: 'Крупная страна запретила майнинг. Хешрейт обвалился, биткоин под давлением.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'asset', assetId: 'btc' }, multiplier: 0.88 }
    ]
  },

  // --- MARKETS / MOOD ---
  {
    id: 'fomo-retail-rally',
    title: '🎉 FOMO-ралли',
    description: 'Соцсети накручивают энтузиазм. Розничные инвесторы массово заходят в рынок. Кто-то говорит «пузырь».',
    type: 'floating',
    tone: 'boom',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 1.04 },
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.06 }
    ]
  },
  {
    id: 'volatility-spike',
    title: '📊 Скачок волатильности',
    description: 'VIX взлетел до 40. Хедж-фонды сворачивают позиции, маржин-коллы каскадом.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.96 },
      { target: { kind: 'asset', assetId: 'gold' }, multiplier: 1.04 }
    ]
  },
  {
    id: 'short-squeeze',
    title: '🦍 Short squeeze на мемной акции',
    description: 'Толпа Reddit-трейдеров загнала шортистов в угол. Один из хедж-фондов потерял $2 млрд за неделю.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.97 }
    ]
  }
];

// =====================================================================
// FAKE — для шума и Counter-narrative
// =====================================================================

export const FAKE_EVENTS: EventCard[] = [
  {
    id: 'fake-merger-rumors',
    title: '📰 Слухи о слиянии гигантов',
    description: 'Источники сообщают о возможном слиянии двух крупнейших технологических компаний. Официальных подтверждений нет.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-anon-crash-pred',
    title: '📰 Анонимный аналитик прогнозирует крах',
    description: 'Известный, но анонимный финансовый блогер предсказывает резкое падение рынка в течение года.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-silicon-insider',
    title: '📰 Инсайдер из Кремниевой долины',
    description: 'Бывший сотрудник Apple якобы раскрыл секретные планы. Рынок ждёт подтверждений.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-tenge-stable',
    title: '📰 Тенге укрепится — обещают эксперты',
    description: 'Экономисты прогнозируют возврат курса USD/KZT к уровню начала года.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-astrologer',
    title: '🔮 Астролог предсказывает год Тельца',
    description: 'Известный астролог утверждает, что Сатурн в Овне даст бычье ралли. Финтвиттер делится анекдотом.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-ceo-cryptic-tweet',
    title: '🐦 CEO загадочно твитнул',
    description: 'Известный CEO опубликовал тыкву🎃 без комментариев. Reddit разобрал на молекулы, выводов нет.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-bloomberg-mistake',
    title: '📺 Bloomberg ошиблась с заголовком',
    description: 'Опечатка в заголовке Bloomberg отправила фьючерсы вверх на 2 минуты. Опровергли — всё откатилось.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-btc-whale',
    title: '🐋 Загадочный BTC-кит купил $500M',
    description: 'On-chain аналитики засекли крупный перевод. Кит может быть институциональным игроком — или может быть кошельком биржи.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-shaman-crash',
    title: '🌫️ Корейский шаман предсказал крах',
    description: 'Видео с предсказанием набрало 50М просмотров. CNBC мимоходом упомянул в эфире.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-reddit-cure',
    title: '🧪 Reddit-тред про секретное лекарство',
    description: 'Анонимный автор утверждает, что знает биотех, готовящий лекарство от рака. Доказательств нет.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-cargo-ship-lost',
    title: '🚢 Слух о пропавшем сухогрузе',
    description: 'Telegram-каналы пишут о пропавшем контейнеровозе с грузом для Apple. Никто из официальных источников не подтверждает.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-ufo-nyse',
    title: '🛸 UFO над Нью-Йоркской биржей',
    description: 'Снимки с дрона разлетелись по соцсетям. Эксперты делятся мнениями, NYSE отказывается комментировать.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-cat-video',
    title: '🐱 Котик уронил Tesla на $5',
    description: 'Вирусное видео где кот случайно купил TSLA puts. Tesla кратко падает, через час восстанавливается.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-ai-says-boom',
    title: '🤖 AI-аналитик: «всё будет расти»',
    description: 'Бот в одном из инвестчатов выдал сводку с уверенностью 99%. Скептики посмеиваются.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-anonymous-billionaire',
    title: '💼 «Анонимный миллиардер» намекает на распродажу',
    description: 'Источники TheStreet якобы получили инсайд от безымянного фигуранта Forbes 400. Подтверждений нет.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-telegram-bull-run',
    title: '📲 Telegram-канал обещает супер-ралли',
    description: 'Канал с 200к подписчиков обещает ралли в 1000% по обещанной монете. Спойлер: монета не дожила до следующего месяца.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-economist-leaves',
    title: '👔 Главный экономист банка уходит',
    description: 'Известный экономист покидает Goldman. СМИ ищут «истинную причину», находят слухи о новой работе у конкурента.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-red-tie-luck',
    title: '👔 Менеджер фонда надел красный галстук',
    description: 'Финансовый блогер заметил корреляцию между гардеробом известного хедж-фонд-менеджера и доходностью. Статистика — на уровне суеверий.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  }
];

export const ALL_EVENTS: EventCard[] = [...REAL_EVENTS, ...FLOATING_EVENTS, ...FAKE_EVENTS];

export function eventsForYear(year: number): EventCard[] {
  return REAL_EVENTS.filter((e) => e.year === year);
}
