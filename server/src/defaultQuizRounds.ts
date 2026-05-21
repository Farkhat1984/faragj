import type { QuizRound } from './types.js';

export const defaultQuizRounds: QuizRound[] = [
  {
    id: 'school-geography-world',
    title: 'География мира',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'geo-world-1',
        text: 'Какая страна самая большая в мире по площади?',
        options: ['Канада', 'Россия', 'Китай', 'США'],
        correctIndex: 1
      },
      {
        id: 'geo-world-2',
        text: 'Какая река считается самой длинной в мире в школьной географии?',
        options: ['Нил', 'Амазонка', 'Янцзы', 'Миссисипи'],
        correctIndex: 0
      },
      {
        id: 'geo-world-3',
        text: 'Где находится пустыня Сахара?',
        options: ['В Южной Америке', 'В Северной Африке', 'В Австралии', 'В Центральной Азии'],
        correctIndex: 1
      },
      {
        id: 'geo-world-4',
        text: 'Какая гора самая высокая на Земле?',
        options: ['Килиманджаро', 'Эльбрус', 'Эверест', 'Монблан'],
        correctIndex: 2
      },
      {
        id: 'geo-world-5',
        text: 'Какой океан самый большой?',
        options: ['Атлантический', 'Индийский', 'Северный Ледовитый', 'Тихий'],
        correctIndex: 3
      },
      {
        id: 'geo-world-6',
        text: 'Столица Австралии — это...',
        options: ['Сидней', 'Мельбурн', 'Канберра', 'Перт'],
        correctIndex: 2
      },
      {
        id: 'geo-world-7',
        text: 'Какой пролив разделяет Европу и Африку?',
        options: ['Берингов пролив', 'Гибралтарский пролив', 'Магелланов пролив', 'Босфор'],
        correctIndex: 1
      },
      {
        id: 'geo-world-8',
        text: 'Какая страна расположена на Апеннинском полуострове?',
        options: ['Испания', 'Италия', 'Греция', 'Португалия'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'school-world-history',
    title: 'Всемирная история',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'history-world-1',
        text: 'В какой стране возникла демократия в древности?',
        options: ['Египет', 'Греция', 'Китай', 'Персия'],
        correctIndex: 1
      },
      {
        id: 'history-world-2',
        text: 'Кто был первым императором Рима?',
        options: ['Юлий Цезарь', 'Октавиан Август', 'Нерон', 'Константин'],
        correctIndex: 1
      },
      {
        id: 'history-world-3',
        text: 'В каком году началась Первая мировая война?',
        options: ['1905', '1914', '1917', '1939'],
        correctIndex: 1
      },
      {
        id: 'history-world-4',
        text: 'Какая революция произошла во Франции в 1789 году?',
        options: ['Промышленная', 'Великая французская', 'Февральская', 'Культурная'],
        correctIndex: 1
      },
      {
        id: 'history-world-5',
        text: 'Кто открыл морской путь в Индию вокруг Африки?',
        options: ['Христофор Колумб', 'Фернан Магеллан', 'Васко да Гама', 'Джеймс Кук'],
        correctIndex: 2
      },
      {
        id: 'history-world-6',
        text: 'Какая цивилизация построила пирамиды в Гизе?',
        options: ['Майя', 'Древний Египет', 'Шумер', 'Древний Рим'],
        correctIndex: 1
      },
      {
        id: 'history-world-7',
        text: 'В каком году закончилась Вторая мировая война?',
        options: ['1941', '1943', '1945', '1949'],
        correctIndex: 2
      },
      {
        id: 'history-world-8',
        text: 'Как назывался торговый путь, связывавший Восток и Запад через Центральную Азию?',
        options: ['Янтарный путь', 'Великий шелковый путь', 'Северный морской путь', 'Путь специй'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'school-science-nature',
    title: 'Наука и природа',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'science-nature-1',
        text: 'Какая планета находится ближе всего к Солнцу?',
        options: ['Венера', 'Меркурий', 'Марс', 'Земля'],
        correctIndex: 1
      },
      {
        id: 'science-nature-2',
        text: 'Какой газ необходим человеку для дыхания?',
        options: ['Азот', 'Кислород', 'Углекислый газ', 'Водород'],
        correctIndex: 1
      },
      {
        id: 'science-nature-3',
        text: 'Сколько хромосом обычно у человека?',
        options: ['23', '44', '46', '48'],
        correctIndex: 2
      },
      {
        id: 'science-nature-4',
        text: 'Как называется процесс, при котором растения создают органические вещества на свету?',
        options: ['Испарение', 'Фотосинтез', 'Дыхание', 'Кристаллизация'],
        correctIndex: 1
      },
      {
        id: 'science-nature-5',
        text: 'Какой химический символ у воды?',
        options: ['CO2', 'O2', 'H2O', 'NaCl'],
        correctIndex: 2
      },
      {
        id: 'science-nature-6',
        text: 'Какая сила удерживает планеты на орбитах вокруг Солнца?',
        options: ['Трение', 'Магнетизм', 'Гравитация', 'Давление'],
        correctIndex: 2
      },
      {
        id: 'science-nature-7',
        text: 'Какой орган отвечает за перекачивание крови в организме человека?',
        options: ['Легкие', 'Сердце', 'Печень', 'Желудок'],
        correctIndex: 1
      },
      {
        id: 'science-nature-8',
        text: 'Какая единица измерения используется для силы тока?',
        options: ['Вольт', 'Ампер', 'Ом', 'Ватт'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'school-culture-art',
    title: 'Культура и искусство',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'culture-art-1',
        text: 'Кто написал трагедию "Ромео и Джульетта"?',
        options: ['Мольер', 'Уильям Шекспир', 'Гомер', 'Данте Алигьери'],
        correctIndex: 1
      },
      {
        id: 'culture-art-2',
        text: 'Кто является автором картины "Мона Лиза"?',
        options: ['Рафаэль', 'Леонардо да Винчи', 'Микеланджело', 'Винсент ван Гог'],
        correctIndex: 1
      },
      {
        id: 'culture-art-3',
        text: 'Какой композитор написал "Лунную сонату"?',
        options: ['Моцарт', 'Бетховен', 'Бах', 'Чайковский'],
        correctIndex: 1
      },
      {
        id: 'culture-art-4',
        text: 'Как называется древнегреческая поэма о возвращении Одиссея домой?',
        options: ['Илиада', 'Одиссея', 'Энеида', 'Божественная комедия'],
        correctIndex: 1
      },
      {
        id: 'culture-art-5',
        text: 'Где находится музей Лувр?',
        options: ['В Лондоне', 'В Париже', 'В Риме', 'В Мадриде'],
        correctIndex: 1
      },
      {
        id: 'culture-art-6',
        text: 'Какой архитектурный памятник находится в Индии?',
        options: ['Тадж-Махал', 'Колизей', 'Парфенон', 'Стоунхендж'],
        correctIndex: 0
      },
      {
        id: 'culture-art-7',
        text: 'Какой жанр искусства связан с изображением природы?',
        options: ['Портрет', 'Пейзаж', 'Натюрморт', 'Карикатура'],
        correctIndex: 1
      },
      {
        id: 'culture-art-8',
        text: 'Кто написал "Божественную комедию"?',
        options: ['Данте Алигьери', 'Петрарка', 'Сервантес', 'Гете'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'school-erudition-mix',
    title: 'Ассорти: общая эрудиция',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'erudition-mix-1',
        text: 'Сколько минут в одном часе?',
        options: ['50', '60', '90', '100'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-2',
        text: 'Какой язык является одним из официальных языков ООН?',
        options: ['Латинский', 'Арабский', 'Шведский', 'Хинди'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-3',
        text: 'Какая фигура имеет три стороны?',
        options: ['Квадрат', 'Треугольник', 'Ромб', 'Пятиугольник'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-4',
        text: 'Какой металл обозначается символом Fe?',
        options: ['Фтор', 'Железо', 'Серебро', 'Медь'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-5',
        text: 'Как называется столица Японии?',
        options: ['Сеул', 'Пекин', 'Токио', 'Бангкок'],
        correctIndex: 2
      },
      {
        id: 'erudition-mix-6',
        text: 'Какой прибор показывает стороны света?',
        options: ['Барометр', 'Компас', 'Термометр', 'Секундомер'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-7',
        text: 'Какое число идет после 999?',
        options: ['100', '1000', '9999', '1001'],
        correctIndex: 1
      },
      {
        id: 'erudition-mix-8',
        text: 'Что изучает астрономия?',
        options: ['Живые организмы', 'Небесные тела', 'Минералы', 'Языки'],
        correctIndex: 1
      }
    ]
  }
];
