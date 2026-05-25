// Альтернативно-исторические модификаторы. Выбираются случайно при старте игры.
// Это анти-хиндсайт механика: одни и те же активы в разных партиях ведут себя по-разному.
// Игроки не знают, какие модификаторы активны (раскрываются в финале).

export type AltHistoryModifier = {
  id: string;
  title: string;
  description: string;
  /** Применяется только к указанному тикеру/активу */
  target:
    | { kind: 'ticker'; ticker: string }
    | { kind: 'sector'; sector: string }
    | { kind: 'index'; code: string }
    | { kind: 'metal'; name: 'gold' | 'silver' }
    | { kind: 'asset'; assetId: string };
  /** Применяется в эти годы (если undefined — всегда) */
  years?: { from: number; to: number };
  /** Мультипликатор на годовую доходность */
  multiplier: number;
};

export const ALT_HISTORY_DECK: AltHistoryModifier[] = [
  {
    id: 'no-iphone',
    title: 'iPhone никогда не выпустили',
    description: 'В этой реальности Apple так и не выпустил iPhone в 2007. Компания остаётся производителем компьютеров второго эшелона.',
    target: { kind: 'ticker', ticker: 'AAPL' },
    years: { from: 2007, to: 2024 },
    multiplier: 0.55
  },
  {
    id: 'yahoo-buys-google',
    title: 'Yahoo купил Google',
    description: 'В 2002 Yahoo всё-таки купил Google за миллиард. Поиск умер от безразличия.',
    target: { kind: 'ticker', ticker: 'GOOG' },
    years: { from: 2004, to: 2024 },
    multiplier: 0.35
  },
  {
    id: 'lehman-survives',
    title: 'Lehman выжил',
    description: 'Правительство США выделило Lehman Brothers экстренный пакет помощи в 2008.',
    target: { kind: 'ticker', ticker: 'LEH' },
    years: { from: 2008, to: 2024 },
    multiplier: 5.0
  },
  {
    id: 'tenge-stable',
    title: 'Тенге стабилизировали',
    description: 'Нацбанк РК провёл более мягкую политику. Девальвации 2014 и 2015 были незначительными.',
    target: { kind: 'sector', sector: 'KZT_STABLE' },
    years: { from: 2014, to: 2016 },
    multiplier: 0.5
  },
  {
    id: 'crypto-banned',
    title: 'Биткоин запретили',
    description: 'Большая семёрка одновременно запретила криптовалюты в 2018. Майнинг ушёл в чёрный рынок.',
    target: { kind: 'sector', sector: 'crypto' },
    years: { from: 2018, to: 2024 },
    multiplier: 0.15
  },
  {
    id: 'nvidia-flop',
    title: 'NVIDIA не выиграла AI',
    description: 'AMD оказался быстрее на рынке AI-чипов. NVIDIA осталась нишевым геймерским производителем.',
    target: { kind: 'ticker', ticker: 'NVDA' },
    years: { from: 2020, to: 2024 },
    multiplier: 0.3
  },
  {
    id: 'amazon-stays-books',
    title: 'Amazon остался книжным магазином',
    description: 'Безос не стал расширять каталог за пределы книг и видео.',
    target: { kind: 'ticker', ticker: 'AMZN' },
    years: { from: 2002, to: 2024 },
    multiplier: 0.4
  },
  {
    id: 'tesla-bankrupt',
    title: 'Tesla обанкротилась в 2018',
    description: 'Маск не справился с производством Model 3. Tesla продана китайскому концерну за бесценок.',
    target: { kind: 'ticker', ticker: 'TSLA' },
    years: { from: 2018, to: 2024 },
    multiplier: 0.05
  },
  {
    id: 'kz-realestate-boom-extended',
    title: 'Бум недвижимости в KZ продлился',
    description: 'Власти Казахстана искусственно поддержали рынок до 2009. Цены не упали.',
    target: { kind: 'asset', assetId: 'realestate_almaty_primary' },
    years: { from: 2008, to: 2009 },
    multiplier: 1.5
  },
  {
    id: 'gold-decade',
    title: 'Десятилетие золота',
    description: 'Центробанки агрессивно накапливают золото. Цена бьёт рекорды быстрее реальности.',
    target: { kind: 'metal', name: 'gold' },
    years: { from: 2010, to: 2019 },
    multiplier: 1.3
  },
  {
    id: 'oil-collapse',
    title: 'Эра нефти закончилась раньше',
    description: 'Электромобили массово вытеснили ДВС к 2020. Нефть упала до $30 на долгие годы.',
    target: { kind: 'sector', sector: 'energy' },
    years: { from: 2018, to: 2024 },
    multiplier: 0.55
  },
  {
    id: 'covid-no-recovery',
    title: 'Рынки не отскочили после COVID',
    description: 'Восстановление 2020-2021 не случилось. Локдауны затянулись на годы.',
    target: { kind: 'index', code: 'SP500' },
    years: { from: 2020, to: 2021 },
    multiplier: 0.4
  },
  {
    id: 'nokia-survives',
    title: 'Nokia не пропустила смартфоны',
    description: 'Финны выпустили Symbian S60 с touch-интерфейсом раньше iPhone. Nokia сохранила лидерство.',
    target: { kind: 'ticker', ticker: 'NOK' },
    years: { from: 2008, to: 2024 },
    multiplier: 2.5
  },
  {
    id: 'meta-vr-failure',
    title: 'Facebook не выжил в эру TikTok',
    description: 'Метавселенная провалилась, молодёжь ушла в TikTok. Meta стагнирует.',
    target: { kind: 'ticker', ticker: 'META' },
    years: { from: 2020, to: 2024 },
    multiplier: 0.4
  }
];

export function pickAltHistory(count: number, rng: () => number = Math.random): AltHistoryModifier[] {
  const shuffled = [...ALT_HISTORY_DECK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
