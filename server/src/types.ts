export type Phase =
  | 'idle'
  | 'quiz-question'
  | 'quiz-results'
  | 'voting'
  | 'voting-results';

export type Participant = {
  id: string;
  nickname: string;
  normalizedName: string;
  score: number;
  joinedAt: number;
  lastSeenAt: number;
  online: boolean;
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  media?: QuestionMedia;
};

export type QuestionMedia = {
  kind: 'image' | 'video';
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

export type AnswerRecord = {
  participantId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  answeredAt: number;
  elapsedMs: number;
  awardedPoints: number;
};

export type QuizRuntime = {
  activeRoundId: string | null;
  activeQuestionIndex: number;
  questionStartedAt: number | null;
  questionEndsAt: number | null;
  answers: AnswerRecord[];
};

export type VoteTarget = {
  id: string;
  name: string;
  description?: string;
};

export type VotingSession = {
  id: string;
  target: VoteTarget | null;
  active: boolean;
  votes: Array<{
    participantId: string;
    score: number;
    votedAt: number;
  }>;
  startedAt: number | null;
  endedAt: number | null;
};

export type PublicState = {
  phase: Phase;
  participants: Array<Pick<Participant, 'id' | 'nickname' | 'score' | 'online'>>;
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
    session: VotingSession;
    results: VotingResult[];
    history: VotingResult[];
  };
};

export type PlayerState = {
  participant: Pick<Participant, 'id' | 'nickname' | 'score'>;
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

export type QuestionResult = {
  participantId: string;
  nickname: string;
  selectedIndex: number;
  isCorrect: boolean;
  elapsedMs: number;
  awardedPoints: number;
};

export type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  score: number;
  online: boolean;
};

export type VotingResult = {
  targetId: string;
  name: string;
  average: number;
  votesCount: number;
  total: number;
};
