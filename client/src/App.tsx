import {
  Award,
  BarChart3,
  Check,
  CircleStop,
  Clock3,
  Crown,
  Gift,
  Image as ImageIcon,
  ListChecks,
  LogIn,
  Medal,
  Menu,
  MonitorUp,
  Pencil,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Video,
  Volume2,
  Trophy,
  Users,
  Vote,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from './api';
import { PlayerState, PublicState, QuestionMedia, QuizQuestion, QuizRound, RandomDrawState } from './types';

const PARTICIPANT_KEY = 'vibe-code-participant';
const ADMIN_TOKEN_KEY = 'vibe-code-admin-token';
const IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const VIDEO_LIMIT_BYTES = 30 * 1024 * 1024;
const AUDIO_LIMIT_BYTES = 15 * 1024 * 1024;

type StoredParticipant = {
  id: string;
  nickname: string;
};

type PlayerMode = 'menu' | 'quiz' | 'voting' | 'random';
type AdminMode = 'home' | 'quiz' | 'voting' | 'roulette';

type NavigationItem<T extends string> = {
  id: T;
  label: string;
  status: string;
  icon: React.ReactNode;
};

function createQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    text: 'Новый вопрос',
    options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
    correctIndex: 0
  };
}

function createRound(title = 'Новая викторина'): QuizRound {
  return {
    id: crypto.randomUUID(),
    title,
    timerSeconds: 15,
    speedBonus: {
      first: 3,
      second: 2,
      default: 1
    },
    questions: [createQuestion(), createQuestion(), createQuestion(), createQuestion()]
  };
}

function formatMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}с`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function formatPlace(place: number) {
  return `${place}-е место`;
}

function mediaKindLabel(kind: QuestionMedia['kind']) {
  if (kind === 'image') return 'Изображение';
  if (kind === 'video') return 'Видео';
  return 'Аудио';
}

function mediaQuestionLabel(kind: QuestionMedia['kind']) {
  if (kind === 'image') return 'Фото к вопросу';
  if (kind === 'video') return 'Видео к вопросу';
  return 'Аудио к вопросу';
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не получилось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function BurgerMenu<T extends string>({
  title,
  subtitle,
  activeId,
  items,
  onSelect
}: {
  title: string;
  subtitle: string;
  activeId: T;
  items: Array<NavigationItem<T>>;
  onSelect: (id: T) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function selectItem(id: T) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <>
      <button
        className="burger-button"
        type="button"
        aria-label="Открыть меню"
        aria-expanded={open}
        title="Меню"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>
      {open && (
        <>
          <button className="menu-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} />
          <aside className="side-menu" role="dialog" aria-modal="true" aria-label={title}>
            <div className="side-menu__head">
              <div className="side-menu__title">
                <span className="eyebrow">{subtitle}</span>
                <strong>{title}</strong>
              </div>
              <button className="side-menu__close" type="button" aria-label="Закрыть меню" title="Закрыть" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="side-menu__nav" aria-label={title}>
              {items.map((item) => (
                <button
                  className={cls('side-menu__item', activeId === item.id && 'is-active')}
                  type="button"
                  key={item.id}
                  onClick={() => selectItem(item.id)}
                >
                  <span className="side-menu__icon">{item.icon}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <em>{item.status}</em>
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

function useTicker(interval = 250) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);

  return now;
}

function usePlayerSocket(participantId: string | null) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [connected, setConnected] = useState(false);
  const [kickedMessage, setKickedMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (!participantId) return;

    setKickedMessage('');
    setResetMessage('');

    const socket: Socket = io();
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('player:join', participantId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('player:state', (nextState: PlayerState) => setState(nextState));
    socket.on('player:kicked', (message: string) => {
      setKickedMessage(message);
      localStorage.removeItem(PARTICIPANT_KEY);
    });
    socket.on('player:not-found', (message: string) => {
      setResetMessage(message);
      localStorage.removeItem(PARTICIPANT_KEY);
    });
    socket.on('player:reset', (message: string) => {
      setResetMessage(message);
      localStorage.removeItem(PARTICIPANT_KEY);
    });

    return () => {
      socket.disconnect();
    };
  }, [participantId]);

  return { state, connected, kickedMessage, resetMessage };
}

function useAdminSocket(token: string | null) {
  const [state, setState] = useState<PublicState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io();
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('admin:join', token);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('admin:state', (nextState: PublicState) => setState(nextState));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return { state, connected };
}

function TimerRing({ endsAt, compact = false }: { endsAt: number | null; compact?: boolean }) {
  const now = useTicker();
  const remaining = Math.max(0, (endsAt ?? now) - now);
  const seconds = Math.ceil(remaining / 1000);
  const circumference = 2 * Math.PI * 42;
  const percentage = endsAt ? Math.min(1, remaining / 15000) : 0;

  return (
    <div className={cls('timer-ring', compact && 'timer-ring--compact')} aria-label={`Осталось ${seconds} секунд`}>
      <svg viewBox="0 0 100 100">
        <circle className="timer-ring__track" cx="50" cy="50" r="42" />
        <circle
          className="timer-ring__bar"
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percentage)}
        />
      </svg>
      <strong>{seconds}</strong>
    </div>
  );
}

function TimerText({ endsAt }: { endsAt: number | null }) {
  const now = useTicker();
  const remaining = Math.max(0, (endsAt ?? now) - now);
  const seconds = Math.ceil(remaining / 1000);
  return <span className="timer-text" aria-label={`Осталось ${seconds} секунд`}>{seconds}с</span>;
}

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <span className={cls('connection-pill', connected ? 'is-online' : 'is-offline')}>
      {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
      {connected ? 'live' : 'offline'}
    </span>
  );
}

function QuestionMediaView({ media, compact = false }: { media: QuestionMedia; compact?: boolean }) {
  const icon =
    media.kind === 'image' ? <ImageIcon size={15} /> : media.kind === 'video' ? <Video size={15} /> : <Volume2 size={15} />;

  return (
    <figure className={cls('question-media', compact && 'question-media--compact')}>
      {media.kind === 'image' ? (
        <img src={media.url} alt={media.name || 'Медиа к вопросу'} />
      ) : media.kind === 'audio' ? (
        <audio src={media.url} controls preload="metadata" />
      ) : (
        <video src={media.url} controls playsInline preload="metadata" />
      )}
      <figcaption>
        {icon}
        {mediaQuestionLabel(media.kind)}
      </figcaption>
    </figure>
  );
}

function LoginScreen({
  onLogin
}: {
  onLogin: (participant: StoredParticipant) => void;
}) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const result = await api<{ participant: StoredParticipant }>('/api/join', {
        method: 'POST',
        body: JSON.stringify({ nickname })
      });
      localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(result.participant));
      onLogin(result.participant);
    } catch (caught) {
      const apiError = caught as Error & { suggestions?: string[] };
      setError(apiError.message);
      setSuggestions(apiError.suggestions ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="player-shell login-shell">
      <section className="login-hero">
        <h1>quiz.ai by faragj</h1>
        <p>Введи ник, отвечай быстро, голосуй честно.</p>
      </section>

      <form className="login-card" onSubmit={submit}>
        <label htmlFor="nickname">Никнейм</label>
        <input
          id="nickname"
          autoFocus
          maxLength={24}
          placeholder="Например, Aigerim"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setNickname(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <button className="primary-button" type="submit" disabled={loading}>
          <LogIn size={19} />
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}

function PlayerApp() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(() => {
    const raw = localStorage.getItem(PARTICIPANT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredParticipant;
    } catch {
      return null;
    }
  });

  const { state, connected, kickedMessage, resetMessage } = usePlayerSocket(participant?.id ?? null);
  const [answerStatus, setAnswerStatus] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<{
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
    correctIndex: number;
  } | null>(null);
  const [voteStatus, setVoteStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('menu');

  const quizCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setAnswerStatus('');
    setAnswerFeedback(null);
    if (state?.activeQuestion?.id && state.phase === 'quiz-question') {
      requestAnimationFrame(() => {
        quizCardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
  }, [state?.activeQuestion?.id, state?.phase]);

  useEffect(() => {
    setVoteStatus('');
    setSelectedRating(null);
  }, [state?.voting.target?.id]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'quiz-question' || state.phase === 'quiz-results') {
      setPlayerMode('quiz');
    }
    if (state.phase === 'voting' || state.phase === 'voting-results') {
      setPlayerMode('voting');
    }
    if (state.phase === 'random-drawing' || state.phase === 'random-results') {
      setPlayerMode('random');
    }
  }, [state?.phase]);

  if (!participant || kickedMessage || resetMessage) {
    return <LoginScreen onLogin={setParticipant} />;
  }

  async function answer(selectedIndex: number) {
    if (!participant || !state?.activeQuestion || state.hasAnswered) return;
    const questionId = state.activeQuestion.id;
    setAnswerStatus('Отправляем...');

    try {
      const result = await api<{ accepted: boolean; awardedPoints: number; isCorrect: boolean; correctIndex: number }>(
        '/api/quiz/answer',
        {
          method: 'POST',
          body: JSON.stringify({ participantId: participant.id, selectedIndex })
        }
      );
      setAnswerFeedback({ questionId, selectedIndex, isCorrect: result.isCorrect, correctIndex: result.correctIndex });
      setAnswerStatus(
        result.isCorrect
          ? result.awardedPoints > 0
            ? `Верно · +${result.awardedPoints} балл`
            : 'Верно'
          : 'Не угадал'
      );
    } catch (caught) {
      setAnswerStatus((caught as Error).message);
    }
  }

  async function vote(score: number) {
    if (!participant || !state?.voting.active || state.voting.hasVoted) return;
    setSelectedRating(score);
    setVoteStatus('Отправляем...');

    try {
      await api('/api/voting/vote', {
        method: 'POST',
        body: JSON.stringify({ participantId: participant.id, score })
      });
      setVoteStatus('Голос принят');
    } catch (caught) {
      setVoteStatus((caught as Error).message);
    }
  }

  const leaderboardRows = state?.leaderboard ?? [];
  const quizStatus =
    state?.phase === 'quiz-question' ? 'Вопрос в эфире' : state?.phase === 'quiz-results' ? 'Результаты готовы' : 'Ждем старта';
  const votingStatus =
    state?.phase === 'voting' ? 'Голосование активно' : state?.phase === 'voting-results' ? 'Итоги готовы' : 'Ждем запуска';
  const randomStatus = state?.random.active
    ? 'Рулетка крутится'
    : state?.random.winners.length
      ? `${state.random.winners.length} побед.`
      : 'Ждем розыгрыш';
  const playerHomeStatus = state ? `${state.participant.score} баллов · ${connected ? 'онлайн' : 'нет связи'}` : 'Подключаемся';
  const playerMenuItems: Array<NavigationItem<PlayerMode>> = [
    { id: 'menu', label: 'Главная', status: playerHomeStatus, icon: <Sparkles size={20} /> },
    { id: 'quiz', label: 'Викторина', status: quizStatus, icon: <ListChecks size={20} /> },
    { id: 'voting', label: 'Голосование', status: votingStatus, icon: <Vote size={20} /> },
    { id: 'random', label: 'Рандом', status: randomStatus, icon: <Shuffle size={20} /> }
  ];

  return (
    <main className="player-shell">
      <header className="player-topbar">
        <BurgerMenu title="Меню участника" subtitle="участник" activeId={playerMode} items={playerMenuItems} onSelect={setPlayerMode} />
        <div className="shell-title">
          <span className="eyebrow">участник</span>
          <h1>
            <span
              className={cls('status-dot', connected ? 'is-online' : 'is-offline')}
              aria-label={connected ? 'в сети' : 'нет связи'}
              title={connected ? 'в сети' : 'нет связи'}
            />
            {state?.participant.nickname ?? participant.nickname}
          </h1>
        </div>
        <div className="score-chip">
          <Trophy size={17} />
          {state?.participant.score ?? 0}
        </div>
      </header>

      {!state && (
        <section className="stage-card waiting-card">
          <Sparkles size={34} />
          <h2>Подключаемся...</h2>
          <p>Секунда, ищу эфир.</p>
        </section>
      )}

      {state && playerMode === 'menu' && (
        <section className="stage-card player-home-card">
          <div className="player-home-head">
            <span className="eyebrow">главная</span>
            <h2>{phaseLabel(state.phase)}</h2>
            <p>{leaderboardRows[0] ? `Лидер сейчас: ${leaderboardRows[0].nickname}` : 'Рейтинг появится после первых ответов'}</p>
          </div>
          <div className="player-status-grid">
            <div className="status-tile">
              <Trophy size={20} />
              <span>Мои баллы</span>
              <strong>{state.participant.score}</strong>
            </div>
            <div className="status-tile">
              <ListChecks size={20} />
              <span>Викторина</span>
              <strong>{quizStatus}</strong>
            </div>
            <div className="status-tile">
              <Vote size={20} />
              <span>Голосование</span>
              <strong>{votingStatus}</strong>
            </div>
            <div className="status-tile">
              <Shuffle size={20} />
              <span>Рандом</span>
              <strong>{randomStatus}</strong>
            </div>
          </div>
        </section>
      )}

      {state && playerMode === 'quiz' && state.phase === 'idle' && (
        <section className="stage-card waiting-card">
          <ListChecks size={38} />
          <h2>Викторина ждет старта</h2>
          <p>Ведущий скоро запустит вопрос.</p>
        </section>
      )}

      {state && playerMode === 'quiz' && state.phase === 'voting' && (
        <section className="stage-card waiting-card">
          <ListChecks size={38} />
          <h2>Викторина на паузе</h2>
          <p>Сейчас в эфире голосование.</p>
        </section>
      )}

      {state && playerMode === 'quiz' && state.phase === 'voting-results' && (
        <section className="stage-card waiting-card">
          <ListChecks size={38} />
          <h2>Викторина на паузе</h2>
          <p>Посмотри итоги в меню голосования.</p>
        </section>
      )}

      {state && playerMode === 'quiz' && (state.phase === 'random-drawing' || state.phase === 'random-results') && (
        <section className="stage-card waiting-card">
          <ListChecks size={38} />
          <h2>Викторина на паузе</h2>
          <p>Сейчас идет розыгрыш победителей.</p>
        </section>
      )}

      {state && playerMode === 'quiz' && state.phase === 'quiz-question' && state.activeQuestion && (
        <section className="quiz-card" ref={quizCardRef}>
          <div className="quiz-meta">
            <span>{state.activeQuestion.roundTitle}</span>
            <span>
              <TimerText endsAt={state.questionEndsAt} /> · {state.activeQuestion.number}/{state.activeQuestion.total}
            </span>
          </div>
          {state.activeQuestion.media && <QuestionMediaView media={state.activeQuestion.media} />}
          <div className="question-head">
            <h2>{state.activeQuestion.text}</h2>
          </div>
          <div className="answer-grid">
            {state.activeQuestion.options.map((option, index) => {
              const feedback =
                answerFeedback && answerFeedback.questionId === state.activeQuestion!.id && answerFeedback.selectedIndex === index
                  ? answerFeedback
                  : null;
              return (
                <button
                  key={option + index}
                  className={cls(feedback?.isCorrect && 'is-correct', feedback && !feedback.isCorrect && 'is-wrong')}
                  disabled={state.hasAnswered || Boolean(answerStatus)}
                  onClick={() => answer(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              );
            })}
          </div>
          <p className="action-status">{state.hasAnswered ? answerStatus || 'Ответ принят' : answerStatus}</p>
        </section>
      )}

      {state && playerMode === 'quiz' && state.phase === 'quiz-results' && (
        <section className="stage-card results-card">
          <Award size={38} />
          <h2>
            {state.activeQuestion && state.activeQuestion.number < state.activeQuestion.total
              ? 'Следующий вопрос скоро'
              : 'Викторина завершена'}
          </h2>
          <Leaderboard rows={leaderboardRows} compact pageSize={10} />
        </section>
      )}

      {state &&
        playerMode === 'voting' &&
        (state.phase === 'idle' ||
          state.phase === 'quiz-question' ||
          state.phase === 'quiz-results' ||
          state.phase === 'random-drawing' ||
          state.phase === 'random-results') && (
          <section className="stage-card waiting-card">
            <Vote size={38} />
            <h2>Голосование ждет запуска</h2>
            <p>Когда ведущий выберет участника или приложение, оценка появится здесь.</p>
          </section>
        )}

      {state && playerMode === 'voting' && state.phase === 'voting' && state.voting.target && (
        <section className="vote-card">
          <span className="eyebrow">оценка 1-5</span>
          <h2>{state.voting.target.name}</h2>
          {state.voting.target.description && <p>{state.voting.target.description}</p>}
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                className={cls(selectedRating === score && 'is-selected')}
                disabled={state.voting.hasVoted || Boolean(voteStatus)}
                onClick={() => vote(score)}
              >
                <Star size={22} fill="currentColor" />
                {score}
              </button>
            ))}
          </div>
          <p className="action-status">{state.voting.hasVoted ? voteStatus || 'Голос принят' : voteStatus}</p>
        </section>
      )}

      {state && playerMode === 'voting' && state.phase === 'voting-results' && (
        <section className="stage-card results-card">
          <BarChart3 size={38} />
          <h2>Голосование завершено</h2>
          {state.voting.results.map((result) => (
            <div className="vote-result" key={result.targetId}>
              <strong>{result.average.toFixed(2)}</strong>
              <span>{result.name}</span>
              <small>{result.votesCount} голосов</small>
            </div>
          ))}
        </section>
      )}

      {state && playerMode === 'random' && state.phase !== 'random-drawing' && state.phase !== 'random-results' && state.random.winners.length === 0 && (
        <section className="stage-card waiting-card">
          <Gift size={38} />
          <h2>Рандом ждет запуска</h2>
          <p>Когда ведущий включит рулетку, окно откроется здесь автоматически.</p>
        </section>
      )}

      {state &&
        playerMode === 'random' &&
        (state.phase === 'random-drawing' || state.phase === 'random-results' || state.random.winners.length > 0) && (
          <RandomDrawView
            participants={leaderboardRows.map((row) => ({
              id: row.participantId ?? row.nickname,
              nickname: row.nickname,
              score: row.score,
              online: row.online
            }))}
            random={state.random}
            currentParticipantId={state.participant.id}
          />
        )}

      <aside className="mobile-board">
        <h3>Баллы участников</h3>
        <Leaderboard rows={leaderboardRows} compact pageSize={10} />
      </aside>
    </main>
  );
}

function PagerControls({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pager-controls">
      <button className="ghost-button" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
        Назад
      </button>
      <span>
        {page + 1}/{totalPages}
      </span>
      <button className="ghost-button" onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
        Далее
      </button>
    </div>
  );
}

function Leaderboard({
  rows,
  compact = false,
  pageSize = 10
}: {
  rows: Array<{ participantId?: string; nickname: string; score: number; online: boolean }>;
  compact?: boolean;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  if (rows.length === 0) {
    return <p className="empty-text">Пока пусто</p>;
  }

  return (
    <>
      <div className={cls('leaderboard', compact && 'leaderboard--compact')}>
        {visibleRows.map((row, index) => (
          <div className="leader-row" key={row.participantId ?? row.nickname}>
            <span className="rank">{page * pageSize + index + 1}</span>
            <span className={cls('online-dot', row.online && 'is-online')} />
            <strong>{row.nickname}</strong>
            <em>{row.score}</em>
          </div>
        ))}
      </div>
      <PagerControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

function ParticipantPager({
  participants,
  pageSize = 10
}: {
  participants: Array<{ id: string; nickname: string; score: number; online: boolean }>;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(participants.length / pageSize));
  const visibleParticipants = participants.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  if (participants.length === 0) {
    return <p className="empty-text">Ждем входов</p>;
  }

  return (
    <>
      <div className="participant-list">
        {visibleParticipants.map((participant) => (
          <div key={participant.id}>
            <span className={cls('online-dot', participant.online && 'is-online')} />
            <strong>{participant.nickname}</strong>
            <em>{participant.score}</em>
          </div>
        ))}
      </div>
      <PagerControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

function RandomDrawView({
  participants,
  random,
  currentParticipantId,
  compact = false
}: {
  participants: Array<{ id: string; nickname: string; score?: number; online?: boolean }>;
  random: RandomDrawState;
  currentParticipantId?: string;
  compact?: boolean;
}) {
  const baseNames = participants.length > 0 ? participants.map((participant) => participant.nickname) : random.winners.map((winner) => winner.nickname);
  const reelItems = Array.from({ length: Math.max(18, baseNames.length * 3 || 18) }, (_, index) => baseNames[index % Math.max(1, baseNames.length)] ?? 'Ждем участников');
  const placeCount = random.winnersCount || random.winners.length || 1;
  const totalCount = random.participantsCount || participants.length;
  const ownWinner = currentParticipantId ? random.winners.find((winner) => winner.participantId === currentParticipantId) : null;
  const hasResults = random.winners.length > 0;

  return (
    <article className={cls('random-card', compact && 'random-card--compact', ownWinner && 'is-own-winner')} aria-live="polite">
      <div className="random-card__head">
        <span className="random-kicker">
          {random.active ? <Clock3 size={16} /> : hasResults ? <Medal size={16} /> : <Shuffle size={16} />}
          Розыгрыш
        </span>
        <div>
          <h2>{random.active ? 'Крутим рулетку' : hasResults ? 'Победители выбраны' : 'Рандом готов'}</h2>
          <p>
            {totalCount > 0
              ? `${random.active ? 'Выбираем' : 'Выбрано'} ${placeCount} из ${totalCount}`
              : 'Участники появятся после входа'}
          </p>
        </div>
      </div>

      <div className="random-machine">
        <div className="random-machine__marker" />
        <div className="random-reel">
          <div className={cls('random-reel__track', random.active && 'is-spinning')}>
            {reelItems.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        </div>
      </div>

      {random.active && <p className="random-hint">Список прокручивается, места откроются после остановки.</p>}

      {!random.active && hasResults && (
        <>
          {ownWinner && (
            <p className="random-own-result">
              Ты победитель: <strong>{formatPlace(ownWinner.place)}</strong>
            </p>
          )}
          <div className="winner-grid">
            {random.winners.map((winner) => (
              <div className={cls('winner-row', winner.participantId === currentParticipantId && 'is-current')} key={winner.participantId}>
                <span className={cls('place-badge', winner.place === 1 && 'is-first', winner.place === 2 && 'is-second', winner.place === 3 && 'is-third')}>
                  {winner.place === 1 ? <Crown size={16} /> : <Medal size={16} />}
                  {formatPlace(winner.place)}
                </span>
                <strong>{winner.nickname}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      {!random.active && !hasResults && <p className="empty-text">Нажми старт в админке, чтобы выбрать победителей.</p>}
    </article>
  );
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      onLogin(result.token);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <form className="login-card admin-login-card" onSubmit={submit}>
        <div className="brand-mark">
          <MonitorUp size={18} />
          Admin Live Desk
        </div>
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          autoFocus
          placeholder="vibe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          <LogIn size={19} />
          {loading ? 'Проверяем...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}

function AdminApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const { state, connected } = useAdminSocket(token);
  const [draftRounds, setDraftRounds] = useState<QuizRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [savingRounds, setSavingRounds] = useState(false);
  const [selectedVoteParticipantId, setSelectedVoteParticipantId] = useState('');
  const [voteDescription, setVoteDescription] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [adminMode, setAdminMode] = useState<AdminMode>('home');
  const [randomWinnerCount, setRandomWinnerCount] = useState(1);

  useEffect(() => {
    if (!state || draftRounds.length > 0) return;
    setDraftRounds(state.quiz.rounds);
    setSelectedRoundId(state.quiz.rounds[0]?.id ?? '');
  }, [draftRounds.length, state]);

  const selectedRound = draftRounds.find((round) => round.id === selectedRoundId) ?? draftRounds[0];
  const effectiveRoundId = selectedRoundId || draftRounds[0]?.id || state?.quiz.rounds[0]?.id || '';
  const leaderboardRows = state?.quiz.leaderboard ?? [];
  const activeRound = state?.quiz.rounds.find((round) => round.id === state.quiz.activeRoundId);
  const participants = state?.participants ?? [];
  const random = state?.random;
  const onlineParticipantsCount = participants.filter((participant) => participant.online).length;
  const adminQuizStatus =
    state?.phase === 'quiz-question' ? 'Вопрос в эфире' : state?.phase === 'quiz-results' ? 'Результаты' : 'Настройка викторин';
  const adminVotingStatus =
    state?.phase === 'voting' ? 'Голосование активно' : state?.phase === 'voting-results' ? 'Итоги голосования' : 'Оценка приложений';
  const adminParticipantsStatus = `${onlineParticipantsCount} онлайн · ${participants.length} всего`;
  const adminRatingStatus = leaderboardRows[0] ? `Лидер: ${leaderboardRows[0].nickname}` : 'Пока пусто';
  const adminHomeStatus = leaderboardRows[0] ? `${adminParticipantsStatus} · ${adminRatingStatus}` : adminParticipantsStatus;
  const adminRandomStatus = random?.active
    ? 'Крутится'
    : random?.winners.length
      ? `${random.winners.length} побед.`
      : `${participants.length} участников`;
  const adminMenuItems: Array<NavigationItem<AdminMode>> = [
    { id: 'home', label: 'Главная', status: adminHomeStatus, icon: <Sparkles size={20} /> },
    { id: 'quiz', label: 'Викторина', status: adminQuizStatus, icon: <ListChecks size={20} /> },
    { id: 'voting', label: 'Голосование', status: adminVotingStatus, icon: <Vote size={20} /> },
    { id: 'roulette', label: 'Рулетка', status: adminRandomStatus, icon: <Shuffle size={20} /> }
  ];
  const votedParticipantIds = useMemo(() => new Set(state?.voting.history.map((result) => result.targetId) ?? []), [state?.voting.history]);
  const availableVoteParticipants = useMemo(
    () => participants.filter((participant) => !votedParticipantIds.has(participant.id)),
    [participants, votedParticipantIds]
  );
  const selectedVoteParticipant =
    participants.find((participant) => participant.id === selectedVoteParticipantId) ?? availableVoteParticipants[0] ?? null;

  useEffect(() => {
    if (!state) return;
    if (
      selectedVoteParticipantId &&
      participants.some((participant) => participant.id === selectedVoteParticipantId && !votedParticipantIds.has(participant.id))
    ) {
      return;
    }
    setSelectedVoteParticipantId(availableVoteParticipants[0]?.id ?? '');
  }, [availableVoteParticipants, participants, selectedVoteParticipantId, state, votedParticipantIds]);

  useEffect(() => {
    setRandomWinnerCount((count) => Math.max(1, Math.min(count, Math.max(1, participants.length))));
  }, [participants.length]);

  if (!token) {
    return <AdminLogin onLogin={setToken} />;
  }

  async function adminCall(path: string, body?: unknown) {
    if (!token) return null;
    setAdminMessage('');
    try {
      return await api<PublicState>(
        path,
        {
          method: 'POST',
          body: body ? JSON.stringify(body) : JSON.stringify({})
        },
        token
      );
    } catch (caught) {
      setAdminMessage((caught as Error).message);
      return null;
    }
  }

  async function saveRounds() {
    if (!token) return;
    const hasUntitledRound = draftRounds.some((round) => !round.title.trim());
    if (hasUntitledRound) {
      setAdminMessage('У каждой викторины должно быть название');
      return;
    }

    setSavingRounds(true);
    setAdminMessage('');
    try {
      const roundsToSave = draftRounds.map((round) => ({
        ...round,
        title: round.title.trim()
      }));
      await api<PublicState>(
        '/api/admin/rounds',
        {
          method: 'PUT',
          body: JSON.stringify({ rounds: roundsToSave })
        },
        token
      );
      setAdminMessage('Викторины сохранены');
    } catch (caught) {
      setAdminMessage((caught as Error).message);
    } finally {
      setSavingRounds(false);
    }
  }

  function updateRound(roundId: string, patch: Partial<QuizRound>) {
    setDraftRounds((rounds) => rounds.map((round) => (round.id === roundId ? { ...round, ...patch } : round)));
  }

  function addRound(event?: React.FormEvent) {
    event?.preventDefault();
    const title = newRoundTitle.trim();
    if (!title) {
      setAdminMessage('Введи название викторины');
      return;
    }

    const round = createRound(title);
    setDraftRounds((rounds) => [...rounds, round]);
    setSelectedRoundId(round.id);
    setNewRoundTitle('');
    setAdminMessage('Викторина добавлена. Не забудь сохранить.');
  }

  function updateQuestion(roundId: string, questionId: string, patch: Partial<QuizQuestion>) {
    setDraftRounds((rounds) =>
      rounds.map((round) =>
        round.id === roundId
          ? {
              ...round,
              questions: round.questions.map((question) => (question.id === questionId ? { ...question, ...patch } : question))
            }
          : round
      )
    );
  }

  function updateOption(roundId: string, questionId: string, index: number, value: string) {
    setDraftRounds((rounds) =>
      rounds.map((round) =>
        round.id === roundId
          ? {
              ...round,
              questions: round.questions.map((question) => {
                if (question.id !== questionId) return question;
                const options = [...question.options];
                options[index] = value;
                return { ...question, options };
              })
            }
          : round
      )
    );
  }

  async function startVoting() {
    if (!selectedVoteParticipant) {
      setAdminMessage('Нет участника для голосования');
      return;
    }

    if (votedParticipantIds.has(selectedVoteParticipant.id)) {
      setAdminMessage(`За "${selectedVoteParticipant.nickname}" уже голосовали`);
      return;
    }

    await adminCall('/api/admin/voting/start', {
      target: {
        id: selectedVoteParticipant.id,
        name: selectedVoteParticipant.nickname,
        description: voteDescription.trim()
      }
    });
  }

  async function startRandomDraw() {
    if (participants.length === 0) {
      setAdminMessage('Нет участников для розыгрыша');
      return;
    }

    const winnersCount = Math.max(1, Math.min(randomWinnerCount, participants.length));
    await adminCall('/api/admin/random/start', { winnersCount });
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <BurgerMenu title="Меню админа" subtitle="админ" activeId={adminMode} items={adminMenuItems} onSelect={setAdminMode} />
        <div className="admin-actions">
          <ConnectionPill connected={connected} />
          <button
            className="ghost-button"
            onClick={() => {
              localStorage.removeItem(ADMIN_TOKEN_KEY);
              setToken(null);
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {adminMessage && <p className="admin-message admin-message--global">{adminMessage}</p>}

      {adminMode === 'home' && (
        <section className="admin-home-grid">
          <div className="console-panel admin-home-summary">
            <div className="panel-title">
              <Sparkles size={18} />
              Главная
            </div>
            <div className="live-state">
              <div className="live-state__info">
                <strong>{phaseLabel(state?.phase ?? 'idle')}</strong>
                <span>{activeRound ? activeRound.title : 'Викторина не запущена'}</span>
              </div>
            </div>
            <div className="home-metrics">
              <div className="home-metric">
                <Users size={18} />
                <span>Онлайн</span>
                <strong>{onlineParticipantsCount}</strong>
              </div>
              <div className="home-metric">
                <Users size={18} />
                <span>Всего</span>
                <strong>{participants.length}</strong>
              </div>
              <div className="home-metric">
                <Trophy size={18} />
                <span>Лидер</span>
                <strong>{leaderboardRows[0]?.nickname ?? 'Пока нет'}</strong>
              </div>
              <div className="home-metric">
                <Vote size={18} />
                <span>Оценено</span>
                <strong>{state?.voting.history.length ?? 0}</strong>
              </div>
            </div>
            <div className="admin-session-actions">
              <button className="danger-button" onClick={() => adminCall('/api/admin/reset-session')}>
                <Trash2 size={18} />
                Новая сессия
              </button>
            </div>
          </div>

          <div className="console-panel">
            <div className="panel-title">
              <Users size={18} />
              Участники
            </div>
            <div className="stats-row">
              <strong>{onlineParticipantsCount}</strong>
              <span>онлайн</span>
              <strong>{participants.length}</strong>
              <span>всего</span>
            </div>
            <ParticipantPager participants={participants} pageSize={10} />
          </div>

          <div className="console-panel">
            <div className="panel-title">
              <Trophy size={18} />
              Рейтинг
            </div>
            <Leaderboard rows={leaderboardRows} pageSize={10} />
          </div>
        </section>
      )}

      {adminMode === 'roulette' && (
        <section className="admin-roulette-grid">
          <div className="console-panel admin-roulette-controls">
            <div className="panel-title">
              <Shuffle size={18} />
              Рулетка
            </div>
            <div className="random-admin__row">
              <label>
                Победителей
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, participants.length)}
                  value={randomWinnerCount}
                  onChange={(event) => setRandomWinnerCount(Number(event.target.value))}
                  disabled={participants.length === 0 || random?.active}
                />
              </label>
              <div className="random-count">
                <strong>{participants.length === 0 ? 0 : Math.min(randomWinnerCount, participants.length)}</strong>
                <span>из {participants.length}</span>
              </div>
            </div>
            <div className="button-grid two">
              <button className="primary-button" onClick={startRandomDraw} disabled={participants.length === 0 || random?.active}>
                <Shuffle size={18} />
                Старт
              </button>
              <button className="secondary-button" onClick={() => adminCall('/api/admin/random/reset')} disabled={!random?.active && !random?.winners.length}>
                <RotateCcw size={18} />
                Сброс
              </button>
            </div>
          </div>
          {random ? <RandomDrawView participants={participants} random={random} /> : <p className="empty-text">Ждем состояние эфира</p>}
        </section>
      )}

      {adminMode === 'quiz' && (
        <section className="admin-grid admin-grid--single">
          <div className="console-panel">
            <div className="panel-title">
              <Play size={18} />
              Эфир
            </div>
            <div className="live-state">
              <div className="live-state__info">
                <strong>{phaseLabel(state?.phase ?? 'idle')}</strong>
                <span>{activeRound ? activeRound.title : 'Викторина не запущена'}</span>
              </div>
              {state?.phase === 'quiz-question' && <TimerRing endsAt={state.quiz.questionEndsAt} compact />}
            </div>
            <div className="button-grid">
              <select value={effectiveRoundId} onChange={(event) => setSelectedRoundId(event.target.value)}>
                {draftRounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.title}
                  </option>
                ))}
              </select>
              <button className="primary-button" onClick={() => adminCall('/api/admin/quiz/start', { roundId: effectiveRoundId })}>
                <Play size={18} />
                Старт / продолжить
              </button>
              <button className="secondary-button" onClick={() => adminCall('/api/admin/quiz/end-question')}>
                <CircleStop size={18} />
                Стоп вопрос
              </button>
              <button className="danger-button" onClick={() => adminCall('/api/admin/reset-scores')}>
                <RotateCcw size={18} />
                Сброс баллов
              </button>
            </div>
          </div>
        </section>
      )}

      {adminMode === 'voting' && (
        <section className="admin-grid admin-grid--single">
          <div className="console-panel voting-panel">
            <div className="panel-title">
              <Vote size={18} />
              Голосование
            </div>
            <label>
              Участник для оценки
              <select
                value={selectedVoteParticipantId}
                onChange={(event) => setSelectedVoteParticipantId(event.target.value)}
                disabled={participants.length === 0 || availableVoteParticipants.length === 0}
              >
                {participants.length === 0 && <option value="">Пока нет участников</option>}
                {participants.length > 0 && availableVoteParticipants.length === 0 && <option value="">Все уже оценены</option>}
                {participants.map((participant) => {
                  const alreadyVoted = votedParticipantIds.has(participant.id);
                  return (
                    <option key={participant.id} value={participant.id} disabled={alreadyVoted}>
                      {participant.nickname}
                      {alreadyVoted ? ' — уже голосовали' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
            <input
              placeholder="Короткое описание, например: приложение команды"
              value={voteDescription}
              onChange={(event) => setVoteDescription(event.target.value)}
            />
            <div className="button-grid two">
              <button className="primary-button" onClick={startVoting} disabled={!selectedVoteParticipant || votedParticipantIds.has(selectedVoteParticipant.id)}>
                <Radio size={18} />
                Запустить
              </button>
              <button className="secondary-button" onClick={() => adminCall('/api/admin/voting/stop')}>
                <CircleStop size={18} />
                Завершить
              </button>
            </div>
            {state?.voting.session.target && (
              <div className="vote-summary">
                <strong>{state.voting.session.target.name}</strong>
                <span>{state.voting.session.votes.length} голосов</span>
                {state.voting.results[0] && <em>{state.voting.results[0].average.toFixed(2)}</em>}
              </div>
            )}
            <div className="voting-history">
              <div className="panel-title">
                <Check size={17} />
                Уже голосовали
              </div>
              {state?.voting.history.length ? (
                state.voting.history.map((result) => (
                  <div className="voting-history__row" key={result.targetId}>
                    <strong>{result.name}</strong>
                    <span>{result.votesCount} голосов</span>
                    <em>{result.average.toFixed(2)}</em>
                  </div>
                ))
              ) : (
                <p className="empty-text">Пока никто не оценен</p>
              )}
            </div>
          </div>
        </section>
      )}

      {adminMode === 'quiz' && (
        <section className="editor-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">контент</span>
              <h2>Новая викторина</h2>
            </div>
            <form className="round-create-form" onSubmit={addRound}>
              <input
                aria-label="Название новой викторины"
                placeholder="Название новой викторины"
                value={newRoundTitle}
                onChange={(event) => setNewRoundTitle(event.target.value)}
              />
              <button className="secondary-button" type="submit">
                <Plus size={18} />
                Создать
              </button>
              <button className="primary-button" type="button" onClick={saveRounds} disabled={savingRounds}>
                <Save size={18} />
                {savingRounds ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </form>
          </div>

          {selectedRound && (
            <RoundEditor
              round={selectedRound}
              rounds={draftRounds}
              onSelect={setSelectedRoundId}
              onUpdateRound={updateRound}
              onUpdateQuestion={updateQuestion}
              onUpdateOption={updateOption}
              onDeleteRound={(roundId) => {
                const next = draftRounds.filter((round) => round.id !== roundId);
                const fallbackRounds = next.length > 0 ? next : [createRound('Новая викторина')];
                setDraftRounds(fallbackRounds);
                setSelectedRoundId(fallbackRounds[0]?.id ?? '');
                setAdminMessage('Викторина удалена. Нажми сохранить, чтобы применить.');
              }}
              onAddQuestion={(roundId) => {
                setDraftRounds((rounds) =>
                  rounds.map((round) => (round.id === roundId ? { ...round, questions: [...round.questions, createQuestion()] } : round))
                );
              }}
              onDeleteQuestion={(roundId, questionId) => {
                setDraftRounds((rounds) =>
                  rounds.map((round) =>
                    round.id === roundId
                      ? { ...round, questions: round.questions.filter((question) => question.id !== questionId) }
                      : round
                  )
                );
              }}
            />
          )}
        </section>
      )}

      {adminMode === 'quiz' && state?.quiz.questionResults.length ? (
        <section className="editor-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">последний вопрос</span>
              <h2>Ответы</h2>
            </div>
          </div>
          <div className="answers-table">
            {state.quiz.questionResults.map((result) => (
              <div key={result.participantId}>
                <strong>{result.nickname}</strong>
                <span>{result.isCorrect ? 'верно' : 'мимо'}</span>
                <span>{formatMs(result.elapsedMs)}</span>
                <em>+{result.awardedPoints}</em>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function RoundEditor({
  round,
  rounds,
  onSelect,
  onUpdateRound,
  onUpdateQuestion,
  onUpdateOption,
  onDeleteRound,
  onAddQuestion,
  onDeleteQuestion
}: {
  round: QuizRound;
  rounds: QuizRound[];
  onSelect: (roundId: string) => void;
  onUpdateRound: (roundId: string, patch: Partial<QuizRound>) => void;
  onUpdateQuestion: (roundId: string, questionId: string, patch: Partial<QuizQuestion>) => void;
  onUpdateOption: (roundId: string, questionId: string, index: number, value: string) => void;
  onDeleteRound: (roundId: string) => void;
  onAddQuestion: (roundId: string) => void;
  onDeleteQuestion: (roundId: string, questionId: string) => void;
}) {
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const currentQuestion = round.questions[activeQuestionIndex] ?? round.questions[0];

  const ROUND_TAB_PAGE_SIZE = 3;
  const [tabPage, setTabPage] = useState(0);
  const totalTabPages = Math.max(1, Math.ceil(rounds.length / ROUND_TAB_PAGE_SIZE));
  const visibleTabs = rounds.slice(tabPage * ROUND_TAB_PAGE_SIZE, tabPage * ROUND_TAB_PAGE_SIZE + ROUND_TAB_PAGE_SIZE);

  useEffect(() => {
    const idx = rounds.findIndex((item) => item.id === round.id);
    if (idx >= 0) {
      setTabPage(Math.floor(idx / ROUND_TAB_PAGE_SIZE));
    }
  }, [round.id, rounds]);

  useEffect(() => {
    if (tabPage > totalTabPages - 1) setTabPage(Math.max(0, totalTabPages - 1));
  }, [tabPage, totalTabPages]);

  useEffect(() => {
    setActiveQuestionIndex(0);
  }, [round.id]);

  useEffect(() => {
    if (activeQuestionIndex > round.questions.length - 1) {
      setActiveQuestionIndex(Math.max(0, round.questions.length - 1));
    }
  }, [activeQuestionIndex, round.questions.length]);

  async function handleMediaUpload(questionId: string, file: File) {
    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
          ? 'audio'
          : null;

    if (!kind) {
      setMediaErrors((errors) => ({ ...errors, [questionId]: 'Можно добавить только изображение, видео или аудио' }));
      return;
    }

    const limit = kind === 'image' ? IMAGE_LIMIT_BYTES : kind === 'video' ? VIDEO_LIMIT_BYTES : AUDIO_LIMIT_BYTES;
    if (file.size > limit) {
      setMediaErrors((errors) => ({
        ...errors,
        [questionId]: `${mediaKindLabel(kind)} слишком тяжелое. Лимит ${formatBytes(limit)}.`
      }));
      return;
    }

    const url = await readFileAsDataUrl(file);
    onUpdateQuestion(round.id, questionId, {
      media: {
        kind,
        url,
        name: file.name,
        mimeType: file.type
      }
    });
    setMediaErrors((errors) => ({ ...errors, [questionId]: '' }));
  }

  function addQuestionFromCarousel() {
    onAddQuestion(round.id);
    setActiveQuestionIndex(round.questions.length);
  }

  function deleteCurrentQuestion(questionId: string) {
    onDeleteQuestion(round.id, questionId);
    setActiveQuestionIndex((index) => Math.max(0, Math.min(index, round.questions.length - 2)));
  }

  return (
    <div className="round-editor">
      <aside className="round-tabs">
        <div className="round-tabs__list">
          {visibleTabs.map((item) => (
            <div key={item.id} className={cls('quiz-tab', item.id === round.id && 'is-active')}>
              <button className="quiz-tab__select" onClick={() => onSelect(item.id)}>
                <Pencil size={15} />
                <span>
                  <strong>{item.title || 'Без названия'}</strong>
                  <small>
                    {item.questions.length} вопр. · {item.timerSeconds} сек
                  </small>
                </span>
              </button>
              <button className="quiz-tab__delete" title="Удалить викторину" onClick={() => onDeleteRound(item.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <PagerControls page={tabPage} totalPages={totalTabPages} onPageChange={setTabPage} />
      </aside>

      <div className="round-body">
        <details className="round-settings-toggle">
          <summary>
            <span>
              <strong>Настройки викторины</strong>
              <small>
                {round.timerSeconds} сек · {round.speedBonus.first}/{round.speedBonus.second}/{round.speedBonus.default}
              </small>
            </span>
          </summary>
          <div className="round-settings">
            <label>
              Название викторины
              <input value={round.title} onChange={(event) => onUpdateRound(round.id, { title: event.target.value })} />
            </label>
            <label>
              Таймер
              <input
                type="number"
                min={5}
                max={90}
                value={round.timerSeconds}
                onChange={(event) => onUpdateRound(round.id, { timerSeconds: Number(event.target.value) })}
              />
            </label>
            <label>
              1-й
              <input
                type="number"
                min={1}
                value={round.speedBonus.first}
                onChange={(event) =>
                  onUpdateRound(round.id, { speedBonus: { ...round.speedBonus, first: Number(event.target.value) } })
                }
              />
            </label>
            <label>
              2-й
              <input
                type="number"
                min={1}
                value={round.speedBonus.second}
                onChange={(event) =>
                  onUpdateRound(round.id, { speedBonus: { ...round.speedBonus, second: Number(event.target.value) } })
                }
              />
            </label>
            <label>
              Остальные
              <input
                type="number"
                min={1}
                value={round.speedBonus.default}
                onChange={(event) =>
                  onUpdateRound(round.id, { speedBonus: { ...round.speedBonus, default: Number(event.target.value) } })
                }
              />
            </label>
            <button className="danger-button round-delete-button" title="Удалить викторину" onClick={() => onDeleteRound(round.id)}>
              <Trash2 size={18} />
              Удалить
            </button>
          </div>
        </details>

        <div className="question-carousel">
          <div className="question-carousel__top">
            <div>
              <span className="eyebrow">вопросы</span>
              <h3>
                {currentQuestion ? activeQuestionIndex + 1 : 0}/{round.questions.length || 0}
              </h3>
            </div>
            <div className="question-carousel__actions">
              <button
                className="secondary-button"
                onClick={() => setActiveQuestionIndex((index) => Math.max(0, index - 1))}
                disabled={activeQuestionIndex === 0}
              >
                Назад
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveQuestionIndex((index) => Math.min(round.questions.length - 1, index + 1))}
                disabled={activeQuestionIndex >= round.questions.length - 1}
              >
                Далее
              </button>
              <button className="primary-button" onClick={addQuestionFromCarousel}>
                <Plus size={18} />
                Вопрос
              </button>
            </div>
          </div>

          <div className="question-number-strip" aria-label="Номера вопросов">
            {round.questions.map((question, index) => (
              <button
                key={question.id}
                className={cls(index === activeQuestionIndex && 'is-active', question.media && 'has-media')}
                onClick={() => setActiveQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion ? (
            <article className="question-editor" key={currentQuestion.id}>
              <div className="question-editor__head">
                <span>Вопрос {activeQuestionIndex + 1}</span>
                <button className="ghost-button icon-only" title="Удалить вопрос" onClick={() => deleteCurrentQuestion(currentQuestion.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
              <textarea
                value={currentQuestion.text}
                onChange={(event) => onUpdateQuestion(round.id, currentQuestion.id, { text: event.target.value })}
              />
              <div className="question-media-editor">
                <div className="question-media-editor__head">
                  <span>Медиафайл</span>
                  {currentQuestion.media && (
                    <button className="ghost-button" onClick={() => onUpdateQuestion(round.id, currentQuestion.id, { media: undefined })}>
                      Убрать медиа
                    </button>
                  )}
                </div>
                {currentQuestion.media ? (
                  <div className="admin-media-preview">
                    <QuestionMediaView media={currentQuestion.media} compact />
                    <div>
                      <strong>{currentQuestion.media.name}</strong>
                      <small>{mediaKindLabel(currentQuestion.media.kind)}</small>
                    </div>
                  </div>
                ) : (
                  <p className="media-helper">Добавь изображение, видео или аудио для вопроса.</p>
                )}
                <label className="media-upload-button">
                  <Upload size={18} />
                  Добавить медиафайл
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0];
                      if (file) await handleMediaUpload(currentQuestion.id, file);
                      input.value = '';
                    }}
                  />
                </label>
                {mediaErrors[currentQuestion.id] && <p className="form-error media-error">{mediaErrors[currentQuestion.id]}</p>}
              </div>
              <div className="option-editor-grid">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className={cls(currentQuestion.correctIndex === index && 'is-correct')}>
                    <input
                      type="radio"
                      checked={currentQuestion.correctIndex === index}
                      onChange={() => onUpdateQuestion(round.id, currentQuestion.id, { correctIndex: index })}
                    />
                    <span>{String.fromCharCode(65 + index)}</span>
                    <input value={option} onChange={(event) => onUpdateOption(round.id, currentQuestion.id, index, event.target.value)} />
                  </label>
                ))}
              </div>
            </article>
          ) : (
            <div className="question-empty-state">
              <h3>Вопросов пока нет</h3>
              <button className="primary-button" onClick={addQuestionFromCarousel}>
                <Plus size={18} />
                Добавить вопрос
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function phaseLabel(phase: string) {
  const labels: Record<string, string> = {
    idle: 'Ожидание',
    'quiz-question': 'Вопрос в эфире',
    'quiz-results': 'Результаты викторины',
    voting: 'Голосование',
    'voting-results': 'Итоги голосования',
    'random-drawing': 'Розыгрыш',
    'random-results': 'Итоги розыгрыша'
  };

  return labels[phase] ?? phase;
}

export function App() {
  const isAdmin = useMemo(() => window.location.pathname.startsWith('/admin'), []);

  return isAdmin ? <AdminApp /> : <PlayerApp />;
}
