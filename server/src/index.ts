import cors from 'cors';
import express from 'express';
import { randomInt, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';
import { defaultQuizRounds } from './defaultQuizRounds.js';
import {
  AnswerRecord,
  LeaderboardEntry,
  Participant,
  Phase,
  PlayerState,
  PublicQuestion,
  PublicState,
  QuestionResult,
  RandomDrawState,
  RandomWinner,
  QuizRound,
  VotingResult,
  VotingSession,
  VoteTarget
} from './types.js';

const PORT = Number(process.env.PORT ?? 4000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'vibe';
const QUESTION_RESULT_PAUSE_MS = 3000;
const RANDOM_DRAW_MS = 2800;
const QUIZ_ROUNDS_FILE = path.resolve(process.cwd(), 'data/quiz-rounds.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '80mb' }));
app.use(express.static(path.resolve(process.cwd(), 'dist/client')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  maxHttpBufferSize: 100 * 1024 * 1024
});

const participants = new Map<string, Participant>();
const participantSockets = new Map<string, string>();
const socketParticipants = new Map<string, string>();

let phase: Phase = 'idle';
let roundTimer: NodeJS.Timeout | null = null;
let randomTimer: NodeJS.Timeout | null = null;

const legacyDemoQuizRounds: QuizRound[] = [
  {
    id: 'round-demo',
    title: 'Разминка: Vibe Code',
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [
      {
        id: 'q-demo-1',
        text: 'Что важнее всего для хорошего вайб-кода на старте?',
        options: ['Сразу усложнить архитектуру', 'Понять сценарий пользователя', 'Писать без проверки', 'Выбрать самый модный стек'],
        correctIndex: 1
      },
      {
        id: 'q-demo-2',
        text: 'Что помогает быстро улучшать результат с AI?',
        options: ['Короткая обратная связь', 'Молчать до финала', 'Менять цель каждые 30 секунд', 'Удалять тесты'],
        correctIndex: 0
      },
      {
        id: 'q-demo-3',
        text: 'Какой экран нужен участнику во время викторины?',
        options: ['Много настроек', 'Большой вопрос и 4 ответа', 'Таблица логов', 'JSON-редактор'],
        correctIndex: 1
      },
      {
        id: 'q-demo-4',
        text: 'Почему realtime важен для выступления?',
        options: ['Чтобы зал видел живую реакцию', 'Чтобы усложнить деплой', 'Чтобы спрятать результаты', 'Чтобы отключить телефоны'],
        correctIndex: 0
      }
    ]
  }
];

function cloneQuizRounds(rounds: QuizRound[]) {
  return structuredClone(rounds);
}

function normalizeQuizRounds(rounds: QuizRound[]) {
  return rounds.map((round) => ({
    ...round,
    id: round.id || randomUUID(),
    timerSeconds: Math.max(5, Number(round.timerSeconds) || 15),
    speedBonus: {
      first: Math.max(1, Number(round.speedBonus?.first) || 3),
      second: Math.max(1, Number(round.speedBonus?.second) || 2),
      default: Math.max(1, Number(round.speedBonus?.default) || 1)
    },
    questions: round.questions.map((question) => ({
      ...question,
      id: question.id || randomUUID(),
      options: question.options.slice(0, 4),
      correctIndex: Math.min(3, Math.max(0, Number(question.correctIndex) || 0)),
      media:
        question.media?.url && (question.media.kind === 'image' || question.media.kind === 'video' || question.media.kind === 'audio')
          ? {
              kind: question.media.kind,
              url: question.media.url,
              name: question.media.name || 'media',
              mimeType: question.media.mimeType
            }
          : undefined
    }))
  }));
}

function loadQuizRounds() {
  if (fs.existsSync(QUIZ_ROUNDS_FILE)) {
    try {
      const rounds = JSON.parse(fs.readFileSync(QUIZ_ROUNDS_FILE, 'utf8')) as QuizRound[];
      if (Array.isArray(rounds) && rounds.length > 0) {
        return normalizeQuizRounds(rounds);
      }
    } catch (error) {
      console.warn('Could not load saved quiz rounds, using defaults.', error);
    }
  }

  return cloneQuizRounds(defaultQuizRounds.length > 0 ? defaultQuizRounds : legacyDemoQuizRounds);
}

function saveQuizRounds(rounds: QuizRound[]) {
  fs.mkdirSync(path.dirname(QUIZ_ROUNDS_FILE), { recursive: true });
  fs.writeFileSync(QUIZ_ROUNDS_FILE, `${JSON.stringify(rounds, null, 2)}\n`, 'utf8');
}

let quizRounds: QuizRound[] = loadQuizRounds();

let quiz = {
  activeRoundId: null as string | null,
  activeQuestionIndex: -1,
  questionStartedAt: null as number | null,
  questionEndsAt: null as number | null,
  answers: [] as AnswerRecord[]
};

let voteTargets: VoteTarget[] = [
  { id: 'target-demo-1', name: 'Команда 1', description: 'Первое демо-приложение' },
  { id: 'target-demo-2', name: 'Команда 2', description: 'Второе демо-приложение' }
];

let voting: VotingSession = {
  id: randomUUID(),
  target: null,
  active: false,
  votes: [],
  startedAt: null,
  endedAt: null
};

let votingHistory: VotingResult[] = [];

function createRandomDrawState(): RandomDrawState {
  return {
    id: randomUUID(),
    active: false,
    winnersCount: 0,
    participantsCount: 0,
    startedAt: null,
    endedAt: null,
    winners: []
  };
}

let randomDraw: RandomDrawState = createRandomDrawState();

function normalizeNickname(name: string) {
  const latinMap: Record<string, string> = {
    а: 'a',
    е: 'e',
    ё: 'e',
    о: 'o',
    р: 'p',
    с: 'c',
    у: 'y',
    х: 'x',
    к: 'k',
    м: 'm',
    т: 't',
    в: 'b',
    н: 'h'
  };

  return name
    .trim()
    .toLowerCase()
    .replace(/[аеёорсухкмтвн]/g, (letter) => latinMap[letter] ?? letter)
    .replace(/[^a-zа-я0-9]/g, '')
    .replace(/\s+/g, '');
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, y) =>
    Array.from({ length: a.length + 1 }, (_, x) => (x === 0 ? y : y === 0 ? x : 0))
  );

  for (let y = 1; y <= b.length; y += 1) {
    for (let x = 1; x <= a.length; x += 1) {
      matrix[y][x] =
        b[y - 1] === a[x - 1]
          ? matrix[y - 1][x - 1]
          : Math.min(matrix[y - 1][x - 1] + 1, matrix[y][x - 1] + 1, matrix[y - 1][x] + 1);
    }
  }

  return matrix[b.length][a.length];
}

function isTooSimilar(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length <= 3 || b.length <= 3) return a === b;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) >= 4;

  const distance = levenshtein(a, b);
  const threshold = Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.25));
  return distance <= threshold;
}

function nicknameSuggestions(base: string) {
  const clean = base.trim().replace(/\s+/g, '');
  const short = clean.length > 0 ? clean.slice(0, 12) : 'viber';
  return [`${short}${Math.floor(10 + Math.random() * 89)}`, `${short}_code`, `${short}_${new Date().getSeconds()}`];
}

function findSimilarNickname(normalized: string) {
  for (const participant of participants.values()) {
    if (isTooSimilar(normalized, participant.normalizedName)) {
      return participant.nickname;
    }
  }

  return null;
}

function leaderboard(): LeaderboardEntry[] {
  return [...participants.values()]
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((participant) => ({
      participantId: participant.id,
      nickname: participant.nickname,
      score: participant.score,
      online: participant.online
    }));
}

function activeRound() {
  return quizRounds.find((round) => round.id === quiz.activeRoundId) ?? null;
}

function activeQuestion(): PublicQuestion | null {
  const round = activeRound();
  if (!round) return null;

  const question = round.questions[quiz.activeQuestionIndex];
  if (!question) return null;

  return {
    id: question.id,
    roundTitle: round.title,
    number: quiz.activeQuestionIndex + 1,
    total: round.questions.length,
    text: question.text,
    options: question.options,
    media: question.media
  };
}

function currentQuestionResults(): QuestionResult[] {
  const question = activeQuestion();
  if (!question) return [];

  return quiz.answers
    .filter((answer) => answer.questionId === question.id)
    .map((answer) => {
      const participant = participants.get(answer.participantId);
      return {
        participantId: answer.participantId,
        nickname: participant?.nickname ?? 'Участник',
        selectedIndex: answer.selectedIndex,
        isCorrect: answer.isCorrect,
        elapsedMs: answer.elapsedMs,
        awardedPoints: answer.awardedPoints
      };
    })
    .sort((a, b) => b.awardedPoints - a.awardedPoints || a.elapsedMs - b.elapsedMs);
}

function votingResults(): VotingResult[] {
  const target = voting.target;
  if (!target) return [];

  const total = voting.votes.reduce((sum, vote) => sum + vote.score, 0);
  const votesCount = voting.votes.length;
  return [
    {
      targetId: target.id,
      name: target.name,
      average: votesCount > 0 ? Number((total / votesCount).toFixed(2)) : 0,
      votesCount,
      total
    }
  ];
}

function pickRandomWinners(pool: Participant[], winnersCount: number): RandomWinner[] {
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, winnersCount).map((participant, index) => ({
    participantId: participant.id,
    nickname: participant.nickname,
    place: index + 1
  }));
}

function publicState(): PublicState {
  return {
    phase,
    participants: [...participants.values()].map((participant) => ({
      id: participant.id,
      nickname: participant.nickname,
      score: participant.score,
      online: participant.online
    })),
    quiz: {
      rounds: quizRounds,
      activeRoundId: quiz.activeRoundId,
      activeQuestionIndex: quiz.activeQuestionIndex,
      questionStartedAt: quiz.questionStartedAt,
      questionEndsAt: quiz.questionEndsAt,
      questionResults: currentQuestionResults(),
      leaderboard: leaderboard()
    },
    voting: {
      session: voting,
      results: votingResults(),
      history: votingHistory
    },
    random: randomDraw
  };
}

function playerState(participantId: string): PlayerState | null {
  const participant = participants.get(participantId);
  if (!participant) return null;

  const question = activeQuestion();
  const hasAnswered = question ? quiz.answers.some((answer) => answer.participantId === participantId && answer.questionId === question.id) : false;

  return {
    participant: {
      id: participant.id,
      nickname: participant.nickname,
      score: participant.score
    },
    phase,
    activeQuestion: question,
    questionEndsAt: quiz.questionEndsAt,
    hasAnswered,
    leaderboard: leaderboard(),
    voting: {
      target: voting.target,
      active: voting.active,
      hasVoted: voting.votes.some((vote) => vote.participantId === participantId),
      results: votingResults()
    },
    random: randomDraw
  };
}

function emitState() {
  io.to('admin').emit('admin:state', publicState());

  for (const [participantId, socketId] of participantSockets.entries()) {
    const state = playerState(participantId);
    if (state) io.to(socketId).emit('player:state', state);
  }
}

function clearRoundTimer() {
  if (roundTimer) {
    clearTimeout(roundTimer);
    roundTimer = null;
  }
}

function clearRandomTimer() {
  if (randomTimer) {
    clearTimeout(randomTimer);
    randomTimer = null;
  }
}

function resetRandomDraw() {
  clearRandomTimer();
  randomDraw = createRandomDrawState();
  if (phase === 'random-drawing' || phase === 'random-results') {
    phase = 'idle';
  }
}

function resetLiveSession() {
  clearRoundTimer();
  clearRandomTimer();

  for (const socketId of participantSockets.values()) {
    io.to(socketId).emit('player:reset', 'Началась новая сессия. Войди заново.');
  }

  participants.clear();
  participantSockets.clear();
  socketParticipants.clear();

  phase = 'idle';
  quiz = {
    activeRoundId: null,
    activeQuestionIndex: -1,
    questionStartedAt: null,
    questionEndsAt: null,
    answers: []
  };
  voting = {
    id: randomUUID(),
    target: null,
    active: false,
    votes: [],
    startedAt: null,
    endedAt: null
  };
  votingHistory = [];
  randomDraw = createRandomDrawState();
}

function startQuestion(round: QuizRound, questionIndex: number) {
  clearRoundTimer();
  quiz.activeRoundId = round.id;
  quiz.activeQuestionIndex = questionIndex;
  quiz.questionStartedAt = Date.now();
  quiz.questionEndsAt = Date.now() + round.timerSeconds * 1000;
  phase = 'quiz-question';
  roundTimer = setTimeout(() => endQuestion({ autoAdvance: true }), round.timerSeconds * 1000);
  emitState();
}

function endQuestion({ autoAdvance = false }: { autoAdvance?: boolean } = {}) {
  clearRoundTimer();

  const round = activeRound();
  if (!round) {
    phase = 'idle';
    quiz.questionStartedAt = null;
    quiz.questionEndsAt = null;
    emitState();
    return;
  }

  phase = 'quiz-results';
  quiz.questionEndsAt = Date.now();
  emitState();

  const nextIndex = quiz.activeQuestionIndex + 1;
  if (autoAdvance && nextIndex < round.questions.length) {
    roundTimer = setTimeout(() => startQuestion(round, nextIndex), QUESTION_RESULT_PAUSE_MS);
  }
}

function assertAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Нужен пароль администратора' });
    return;
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/join', (req, res) => {
  const nickname = String(req.body?.nickname ?? '').trim();
  if (nickname.length < 2 || nickname.length > 24) {
    res.status(400).json({ message: 'Никнейм должен быть от 2 до 24 символов' });
    return;
  }

  const normalizedName = normalizeNickname(nickname);
  if (normalizedName.length < 2) {
    res.status(400).json({ message: 'В никнейме нужны буквы или цифры' });
    return;
  }

  const similar = findSimilarNickname(normalizedName);
  if (similar) {
    res.status(409).json({
      message: `Похоже на уже занятый ник "${similar}". Выбери чуть другой вариант.`,
      suggestions: nicknameSuggestions(nickname)
    });
    return;
  }

  const id = randomUUID();
  const now = Date.now();
  const participant: Participant = {
    id,
    nickname,
    normalizedName,
    score: 0,
    joinedAt: now,
    lastSeenAt: now,
    online: true
  };

  participants.set(id, participant);
  emitState();
  res.json({ participant: { id, nickname, score: 0 } });
});

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password ?? '');
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Неверный пароль' });
    return;
  }

  res.json({ token: ADMIN_PASSWORD });
});

app.get('/api/admin/state', assertAdmin, (_req, res) => {
  res.json(publicState());
});

app.put('/api/admin/rounds', assertAdmin, (req, res) => {
  const rounds = req.body?.rounds as QuizRound[];
  if (!Array.isArray(rounds) || rounds.length === 0) {
    res.status(400).json({ message: 'Нужна хотя бы одна викторина' });
    return;
  }

  for (const round of rounds) {
    if (!round.title || !Array.isArray(round.questions) || round.questions.length === 0) {
      res.status(400).json({ message: 'В каждой викторине нужны название и вопросы' });
      return;
    }
  }

  quizRounds = normalizeQuizRounds(rounds);
  saveQuizRounds(quizRounds);

  emitState();
  res.json(publicState());
});

app.post('/api/admin/quiz/start', assertAdmin, (req, res) => {
  if (randomDraw.active) {
    res.status(400).json({ message: 'Дождись окончания розыгрыша' });
    return;
  }

  const roundId = String(req.body?.roundId ?? quizRounds[0]?.id ?? '');
  const round = quizRounds.find((item) => item.id === roundId);
  if (!round) {
    res.status(404).json({ message: 'Раунд не найден' });
    return;
  }

  const shouldResume =
    quiz.activeRoundId === round.id &&
    phase === 'quiz-results' &&
    quiz.activeQuestionIndex >= 0 &&
    quiz.activeQuestionIndex < round.questions.length - 1;

  if (phase === 'quiz-question' && quiz.activeRoundId === round.id) {
    res.json(publicState());
    return;
  }

  if (!shouldResume) {
    quiz.answers = quiz.answers.filter((answer) => !round.questions.some((question) => question.id === answer.questionId));
  }

  startQuestion(round, shouldResume ? quiz.activeQuestionIndex + 1 : 0);
  res.json(publicState());
});

app.post('/api/admin/quiz/next', assertAdmin, (_req, res) => {
  const round = activeRound();
  if (!round) {
    res.status(400).json({ message: 'Сначала запусти викторину' });
    return;
  }

  clearRoundTimer();
  const nextIndex = quiz.activeQuestionIndex + 1;
  if (nextIndex >= round.questions.length) {
    phase = 'quiz-results';
    quiz.questionStartedAt = null;
    quiz.questionEndsAt = null;
    emitState();
    res.json(publicState());
    return;
  }

  startQuestion(round, nextIndex);
  res.json(publicState());
});

app.post('/api/admin/quiz/end-question', assertAdmin, (_req, res) => {
  endQuestion({ autoAdvance: false });
  res.json(publicState());
});

app.post('/api/admin/reset-scores', assertAdmin, (_req, res) => {
  for (const participant of participants.values()) {
    participant.score = 0;
  }
  quiz.answers = [];
  emitState();
  res.json(publicState());
});

app.post('/api/admin/reset-session', assertAdmin, (_req, res) => {
  resetLiveSession();
  emitState();
  res.json(publicState());
});

app.post('/api/admin/voting/start', assertAdmin, (req, res) => {
  if (randomDraw.active) {
    res.status(400).json({ message: 'Дождись окончания розыгрыша' });
    return;
  }

  const target = req.body?.target as VoteTarget;
  if (!target?.id) {
    res.status(400).json({ message: 'Выбери участника из списка' });
    return;
  }

  if (voting.active) {
    res.status(400).json({ message: 'Сначала заверши текущее голосование' });
    return;
  }

  const participant = participants.get(target.id);
  if (!participant) {
    res.status(404).json({ message: 'Участник не найден' });
    return;
  }

  if (votingHistory.some((result) => result.targetId === participant.id)) {
    res.status(409).json({ message: `За "${participant.nickname}" уже голосовали` });
    return;
  }

  const normalizedTarget: VoteTarget = {
    id: participant.id,
    name: participant.nickname,
    description: target.description?.trim() || 'Оценка участника'
  };

  voteTargets = [normalizedTarget, ...voteTargets.filter((item) => item.id !== normalizedTarget.id)].slice(0, 20);
  voting = {
    id: randomUUID(),
    target: normalizedTarget,
    active: true,
    votes: [],
    startedAt: Date.now(),
    endedAt: null
  };
  phase = 'voting';
  emitState();
  res.json(publicState());
});

app.post('/api/admin/voting/stop', assertAdmin, (_req, res) => {
  const results = votingResults();
  const result = results[0];
  if (result && !votingHistory.some((item) => item.targetId === result.targetId)) {
    votingHistory = [result, ...votingHistory];
  }

  voting.active = false;
  voting.endedAt = Date.now();
  phase = 'voting-results';
  emitState();
  res.json(publicState());
});

app.post('/api/admin/random/start', assertAdmin, (req, res) => {
  if (randomDraw.active) {
    res.status(400).json({ message: 'Розыгрыш уже идет' });
    return;
  }

  if (phase === 'quiz-question') {
    res.status(400).json({ message: 'Сначала останови текущий вопрос' });
    return;
  }

  if (phase === 'voting' && voting.active) {
    res.status(400).json({ message: 'Сначала заверши голосование' });
    return;
  }

  const pool = [...participants.values()];
  const winnersCount = Number(req.body?.winnersCount);
  if (pool.length === 0) {
    res.status(400).json({ message: 'Нет участников для розыгрыша' });
    return;
  }

  if (!Number.isInteger(winnersCount) || winnersCount < 1 || winnersCount > pool.length) {
    res.status(400).json({ message: `Укажи число победителей от 1 до ${pool.length}` });
    return;
  }

  const winners = pickRandomWinners(pool, winnersCount);
  randomDraw = {
    id: randomUUID(),
    active: true,
    winnersCount,
    participantsCount: pool.length,
    startedAt: Date.now(),
    endedAt: null,
    winners: []
  };
  phase = 'random-drawing';
  emitState();

  randomTimer = setTimeout(() => {
    randomDraw = {
      ...randomDraw,
      active: false,
      endedAt: Date.now(),
      winners
    };
    phase = 'random-results';
    randomTimer = null;
    emitState();
  }, RANDOM_DRAW_MS);

  res.json(publicState());
});

app.post('/api/admin/random/reset', assertAdmin, (_req, res) => {
  resetRandomDraw();
  emitState();
  res.json(publicState());
});

app.get('/api/admin/vote-targets', assertAdmin, (_req, res) => {
  res.json({ targets: voteTargets });
});

app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist/client/index.html'));
});

app.post('/api/quiz/answer', (req, res) => {
  const participantId = String(req.body?.participantId ?? '');
  const selectedIndex = Number(req.body?.selectedIndex);
  const participant = participants.get(participantId);
  const round = activeRound();
  const question = round?.questions[quiz.activeQuestionIndex];

  if (!participant || !round || !question || phase !== 'quiz-question') {
    res.status(400).json({ message: 'Сейчас нет активного вопроса' });
    return;
  }

  if (Date.now() > (quiz.questionEndsAt ?? 0)) {
    res.status(400).json({ message: 'Время вышло' });
    return;
  }

  if (quiz.answers.some((answer) => answer.participantId === participantId && answer.questionId === question.id)) {
    res.status(409).json({ message: 'Ответ уже принят' });
    return;
  }

  const now = Date.now();
  const isCorrect = selectedIndex === question.correctIndex;
  const correctBefore = quiz.answers
    .filter((answer) => answer.questionId === question.id && answer.isCorrect)
    .sort((a, b) => a.answeredAt - b.answeredAt);

  let awardedPoints = 0;
  if (isCorrect) {
    if (correctBefore.length === 0) awardedPoints = round.speedBonus.first;
    else if (correctBefore.length === 1) awardedPoints = round.speedBonus.second;
    else awardedPoints = round.speedBonus.default;
  }

  participant.score += awardedPoints;
  participant.lastSeenAt = now;

  quiz.answers.push({
    participantId,
    questionId: question.id,
    selectedIndex,
    isCorrect,
    answeredAt: now,
    elapsedMs: Math.max(0, now - (quiz.questionStartedAt ?? now)),
    awardedPoints
  });

  emitState();
  res.json({ accepted: true, awardedPoints, isCorrect, correctIndex: question.correctIndex });
});

app.post('/api/voting/vote', (req, res) => {
  const participantId = String(req.body?.participantId ?? '');
  const score = Number(req.body?.score);
  const participant = participants.get(participantId);

  if (!participant || !voting.active || !voting.target) {
    res.status(400).json({ message: 'Сейчас нет активного голосования' });
    return;
  }

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
    return;
  }

  if (voting.votes.some((vote) => vote.participantId === participantId)) {
    res.status(409).json({ message: 'Голос уже принят' });
    return;
  }

  voting.votes.push({
    participantId,
    score,
    votedAt: Date.now()
  });
  participant.lastSeenAt = Date.now();
  emitState();
  res.json({ accepted: true });
});

io.on('connection', (socket) => {
  socket.on('admin:join', (token: string) => {
    if (token === ADMIN_PASSWORD) {
      socket.join('admin');
      socket.emit('admin:state', publicState());
    }
  });

  socket.on('player:join', (participantId: string) => {
    const participant = participants.get(participantId);
    if (!participant) {
      socket.emit('player:not-found', 'Сессия участника устарела. Войди заново.');
      return;
    }

    const previousSocket = participantSockets.get(participantId);
    if (previousSocket && previousSocket !== socket.id) {
      io.to(previousSocket).emit('player:kicked', 'Открыта новая вкладка с этим никнеймом');
      io.sockets.sockets.get(previousSocket)?.disconnect(true);
    }

    participant.online = true;
    participant.lastSeenAt = Date.now();
    participantSockets.set(participantId, socket.id);
    socketParticipants.set(socket.id, participantId);
    socket.emit('player:state', playerState(participantId));
    emitState();
  });

  socket.on('disconnect', () => {
    const participantId = socketParticipants.get(socket.id);
    if (!participantId) return;

    const participant = participants.get(participantId);
    if (participant) {
      participant.online = false;
      participant.lastSeenAt = Date.now();
    }

    participantSockets.delete(participantId);
    socketParticipants.delete(socket.id);
    emitState();
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Vibe Code Live server: http://localhost:${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
