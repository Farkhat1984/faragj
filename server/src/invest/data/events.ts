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

// REAL — точно бьют в год публикации
export const REAL_EVENTS: EventCard[] = [
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
  {
    id: 'nine-eleven',
    title: '🛑 11 сентября 2001',
    description: 'Террористическая атака на башни-близнецы. Авиаперевозки остановлены, страховая отрасль шокирована, оборонный сектор резко вырастает.',
    type: 'real',
    year: 2001,
    tone: 'shock',
    effects: [
      { target: { kind: 'index', code: 'SP500' }, multiplier: 0.95 }
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
  {
    id: 'kz-realestate-boom',
    title: '🏗️ Бум недвижимости в Казахстане',
    description: 'Цены на квартиры в Алматы и Астане растут на десятки процентов в год. Все вокруг покупают вторую и третью квартиру в кредит.',
    type: 'real',
    year: 2006,
    tone: 'boom',
    effects: [
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 1.10 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 1.10 }
    ]
  },
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
      { target: { kind: 'asset', assetId: 'realestate_almaty_primary' }, multiplier: 0.95 },
      { target: { kind: 'asset', assetId: 'realestate_astana_primary' }, multiplier: 0.95 }
    ]
  },
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
    id: 'kzt-float-2015',
    title: '💱 Свободное плавание тенге',
    description: 'Нацбанк отпустил тенге в свободное плавание. За полгода курс ушёл с 185 до 340. Депозиты в KZT обесценились вдвое.',
    type: 'real',
    year: 2015,
    tone: 'shock',
    effects: []
  },
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
    id: 'ai-boom-2023',
    title: '🤖 AI-революция',
    description: 'ChatGPT и большие языковые модели меняют экономику. Производители GPU взлетают, IT-консалтинг переориентируется на AI.',
    type: 'real',
    year: 2023,
    tone: 'boom',
    effects: [
      { target: { kind: 'ticker', ticker: 'NVDA' }, multiplier: 1.10 },
      { target: { kind: 'sector', sector: 'tech' }, multiplier: 1.05 }
    ]
  }
];

// FLOATING — могут случиться в любой год периода (мультипликатор сильнее)
export const FLOATING_EVENTS: EventCard[] = [
  {
    id: 'cyberattack',
    title: '🛡️ Крупная кибератака',
    description: 'Хакеры взломали системы нескольких банков. Финансовые акции под давлением, кибербезопасность в спросе.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'financials' }, multiplier: 0.96 }
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
    id: 'trade-war',
    title: '🌐 Торговая война',
    description: 'Введены взаимные пошлины между крупнейшими экономиками. Производственные цепочки рвутся.',
    type: 'floating',
    tone: 'shock',
    effects: [
      { target: { kind: 'sector', sector: 'industrials' }, multiplier: 0.94 },
      { target: { kind: 'sector', sector: 'consumer' }, multiplier: 0.97 }
    ]
  }
];

// FAKE — для шума и Counter-narrative
export const FAKE_EVENTS: EventCard[] = [
  {
    id: 'fake-1',
    title: '📰 Слухи о слиянии гигантов',
    description: 'Источники сообщают о возможном слиянии двух крупнейших технологических компаний. Официальных подтверждений нет.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-2',
    title: '📰 Анонимный аналитик прогнозирует крах',
    description: 'Известный, но анонимный финансовый блогер предсказывает резкое падение рынка в течение года.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-3',
    title: '📰 Инсайдер из Кремниевой долины',
    description: 'Бывший сотрудник Apple якобы раскрыл секретные планы. Рынок ждёт подтверждений.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  },
  {
    id: 'fake-4',
    title: '📰 Тенге укрепится — обещают эксперты',
    description: 'Экономисты прогнозируют возврат курса USD/KZT к уровню начала года.',
    type: 'fake',
    tone: 'neutral',
    effects: []
  }
];

export const ALL_EVENTS: EventCard[] = [...REAL_EVENTS, ...FLOATING_EVENTS, ...FAKE_EVENTS];

export function eventsForYear(year: number): EventCard[] {
  return REAL_EVENTS.filter((e) => e.year === year);
}
