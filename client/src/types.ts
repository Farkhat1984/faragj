export type Phase = 'idle' | 'quiz-question' | 'quiz-results' | 'voting' | 'voting-results' | 'random-drawing' | 'random-results';

export type Participant = {
  id: string;
  nickname: string;
  score: number;
  online?: boolean;
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  media?: QuestionMedia;
};

export type QuestionMedia = {
  kind: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  mimeType?: string;
};

export type QuizRound = {
  id: string;
  title: string;
  timerSeconds: number;
  speedBonus: {
    first: number;
    second: number;
    default: number;
  };
  questions: QuizQuestion[];
};

export type PublicQuestion = {
  id: string;
  roundTitle: string;
  number: number;
  total: number;
  text: string;
  options: string[];
  media?: QuestionMedia;
};

export type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  score: number;
  online: boolean;
};

export type QuestionResult = {
  participantId: string;
  nickname: string;
  selectedIndex: number;
  isCorrect: boolean;
  elapsedMs: number;
  awardedPoints: number;
};

export type VoteTarget = {
  id: string;
  name: string;
  description?: string;
};

export type VotingResult = {
  targetId: string;
  name: string;
  average: number;
  votesCount: number;
  total: number;
};

export type RandomWinner = {
  participantId: string;
  nickname: string;
  place: number;
};

export type RandomDrawState = {
  id: string;
  active: boolean;
  winnersCount: number;
  participantsCount: number;
  startedAt: number | null;
  endedAt: number | null;
  winners: RandomWinner[];
};

export type PublicState = {
  phase: Phase;
  participants: Array<Participant & { online: boolean }>;
  quiz: {
    rounds: QuizRound[];
    activeRoundId: string | null;
    activeQuestionIndex: number;
    questionStartedAt: number | null;
    questionEndsAt: number | null;
    questionResults: QuestionResult[];
    leaderboard: LeaderboardEntry[];
  };
  voting: {
    session: {
      id: string;
      target: VoteTarget | null;
      active: boolean;
      votes: Array<{ participantId: string; score: number; votedAt: number }>;
      startedAt: number | null;
      endedAt: number | null;
    };
    results: VotingResult[];
    history: VotingResult[];
  };
  random: RandomDrawState;
};

export type PlayerState = {
  participant: Participant;
  phase: Phase;
  activeQuestion: PublicQuestion | null;
  questionEndsAt: number | null;
  hasAnswered: boolean;
  leaderboard: LeaderboardEntry[];
  voting: {
    target: VoteTarget | null;
    active: boolean;
    hasVoted: boolean;
    results: VotingResult[];
  };
  random: RandomDrawState;
};
