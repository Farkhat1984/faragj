import { io } from 'socket.io-client';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:4000';
const UI_BASE = process.env.E2E_UI_BASE ?? 'http://localhost:5173';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'vibe';
const PARTICIPANT_COUNT = Number(process.env.E2E_PARTICIPANTS ?? 30);
const NICKNAME_SEEDS = [
  'AsterPeak',
  'BlueForge',
  'CopperVale',
  'DriftMesa',
  'EmberLane',
  'FrostHill',
  'GroveMint',
  'HarborSky',
  'IvoryStone',
  'JadeSignal',
  'KiteOrbit',
  'LumenBay',
  'MapleQuest',
  'NimbusGate',
  'OnyxRiver',
  'PrismField',
  'QuartzRoad',
  'RubyHarbor',
  'SolarCrest',
  'TinLantern',
  'UrbanEcho',
  'VelvetNorth',
  'WillowCode',
  'XenonTrail',
  'YellowSpark',
  'ZenithLoop',
  'AmberCircuit',
  'BinaryCloud',
  'CobaltBridge',
  'DeltaPilot'
];

const steps = [];
const users = [];
let adminToken = null;
let adminSocket = null;
let originalQuizRounds = null;
let restoredOriginalQuizRounds = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message, details = undefined) {
  if (!condition) {
    const error = new Error(message);
    if (details !== undefined) error.details = details;
    throw error;
  }
}

async function step(name, fn) {
  const startedAt = Date.now();
  try {
    const details = await fn();
    steps.push({ name, status: 'PASS', ms: Date.now() - startedAt, details });
    console.log(`PASS ${name}`);
    return details;
  } catch (error) {
    steps.push({
      name,
      status: 'FAIL',
      ms: Date.now() - startedAt,
      error: error.message,
      details: error.details
    });
    console.error(`FAIL ${name}: ${error.message}`);
    if (error.details) console.error(JSON.stringify(error.details, null, 2));
    throw error;
  }
}

async function request(method, path, body = undefined, token = undefined) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

async function expectStatus(method, path, status, body = undefined, token = undefined) {
  const response = await request(method, path, body, token);
  assert(response.status === status, `${method} ${path} expected ${status}, got ${response.status}`, response.payload);
  return response.payload;
}

async function admin(method, path, body = undefined) {
  assert(adminToken, 'Admin token is not set');
  const response = await request(method, path, body, adminToken);
  assert(response.ok, `${method} ${path} failed with ${response.status}`, response.payload);
  return response.payload;
}

async function waitUntil(name, predicate, timeoutMs = 5000, intervalMs = 50) {
  const startedAt = Date.now();
  let lastValue;

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await predicate();
    if (lastValue) return lastValue;
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for ${name}`);
}

function waitForEvent(socket, eventName, predicate = () => true, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for socket event ${eventName}`));
    }, timeoutMs);

    function handler(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(payload);
    }

    socket.on(eventName, handler);
  });
}

async function connectPlayer(user) {
  const socket = io(API_BASE, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });

  user.states = [];
  user.resetMessages = [];
  user.kickedMessages = [];
  user.notFoundMessages = [];

  socket.on('player:state', (state) => {
    user.latestState = state;
    user.states.push(state);
  });
  socket.on('player:reset', (message) => user.resetMessages.push(message));
  socket.on('player:kicked', (message) => user.kickedMessages.push(message));
  socket.on('player:not-found', (message) => user.notFoundMessages.push(message));

  await waitForEvent(socket, 'connect');
  socket.emit('player:join', user.id);
  await waitForEvent(socket, 'player:state', (state) => state.participant.id === user.id);
  user.socket = socket;
  return socket;
}

async function connectAdminSocket() {
  adminSocket = io(API_BASE, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });

  await waitForEvent(adminSocket, 'connect');
  adminSocket.emit('admin:join', adminToken);
  return waitForEvent(adminSocket, 'admin:state', (state) => state.phase === 'idle');
}

async function publicState() {
  return admin('GET', '/api/admin/state');
}

async function waitForAdminState(name, predicate, timeoutMs = 5000) {
  return waitUntil(name, async () => {
    const state = await publicState();
    return predicate(state) ? state : null;
  }, timeoutMs);
}

async function waitForPlayers(name, predicate, timeoutMs = 5000) {
  return waitUntil(name, () => {
    return users.every((user) => user.latestState && predicate(user.latestState, user)) ? true : null;
  }, timeoutMs);
}

function makeRound() {
  return {
    id: 'e2e-round',
    title: 'Проверочная викторина',
    timerSeconds: 10,
    speedBonus: {
      first: 5,
      second: 3,
      default: 1
    },
    questions: [
      {
        id: 'e2e-q1',
        text: 'Сколько будет 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
        media: {
          kind: 'image',
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
          name: 'pixel.png',
          mimeType: 'image/png'
        }
      },
      {
        id: 'e2e-q2',
        text: 'Какой цвет у ясного дневного неба?',
        options: ['Красный', 'Зеленый', 'Желтый', 'Синий'],
        correctIndex: 3,
        media: {
          kind: 'video',
          url: 'data:video/mp4;base64,AAAA',
          name: 'sample.mp4',
          mimeType: 'video/mp4'
        }
      },
      {
        id: 'e2e-q3',
        text: 'Какой файл звучит в вопросе?',
        options: ['Фото', 'Видео', 'Аудио', 'Текст'],
        correctIndex: 2,
        media: {
          kind: 'audio',
          url: 'data:audio/mpeg;base64,AAAA',
          name: 'sample.mp3',
          mimeType: 'audio/mpeg'
        }
      }
    ]
  };
}

function scoreSum(answers) {
  return answers.reduce((sum, answer) => sum + Number(answer.payload.awardedPoints ?? 0), 0);
}

function nicknameFor(index) {
  return NICKNAME_SEEDS[index] ?? `Unique${index + 1}Trail`;
}

async function cleanup() {
  if (adminToken && originalQuizRounds && !restoredOriginalQuizRounds) {
    try {
      await admin('PUT', '/api/admin/rounds', { rounds: originalQuizRounds });
      restoredOriginalQuizRounds = true;
    } catch (error) {
      console.error(`WARN could not restore original quiz rounds: ${error.message}`);
    }
  }

  for (const user of users) {
    user.socket?.disconnect();
  }
  adminSocket?.disconnect();
}

async function main() {
  await step('health and frontend are reachable', async () => {
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.payload.ok === true, 'Health endpoint is not OK', health);

    const html = await fetch(UI_BASE).then((response) => response.text());
    assert(html.includes('<div id="root">'), 'Frontend HTML root was not served');
    return { health: health.payload, uiBase: UI_BASE };
  });

  await step('admin authentication and authorization guards', async () => {
    await expectStatus('GET', '/api/admin/state', 401);
    await expectStatus('POST', '/api/admin/login', 401, { password: 'wrong-password' });
    const login = await expectStatus('POST', '/api/admin/login', 200, { password: ADMIN_PASSWORD });
    assert(login.token === ADMIN_PASSWORD, 'Admin token does not match expected password token');
    adminToken = login.token;
    originalQuizRounds = (await publicState()).quiz.rounds;
    await admin('POST', '/api/admin/reset-session');
    return { tokenReceived: Boolean(adminToken) };
  });

  await step('admin realtime socket receives initial state', async () => {
    const state = await connectAdminSocket();
    assert(state.phase === 'idle', 'Admin socket did not receive idle state', state);
    return { phase: state.phase };
  });

  await step(`join ${PARTICIPANT_COUNT} participants and connect realtime sockets`, async () => {
    await expectStatus('POST', '/api/join', 400, { nickname: 'A' });

    const joined = await Promise.all(
      Array.from({ length: PARTICIPANT_COUNT }, (_, index) =>
        expectStatus('POST', '/api/join', 200, { nickname: nicknameFor(index) })
      )
    );

    for (const result of joined) {
      users.push({
        id: result.participant.id,
        nickname: result.participant.nickname
      });
    }

    await expectStatus('POST', '/api/join', 409, { nickname: users[0].nickname });
    await Promise.all(users.map((user) => connectPlayer(user)));

    const state = await waitForAdminState('all participants online', (nextState) => {
      return nextState.participants.length === PARTICIPANT_COUNT && nextState.participants.every((participant) => participant.online);
    });

    return {
      participants: state.participants.length,
      online: state.participants.filter((participant) => participant.online).length
    };
  });

  await step('single-nickname duplicate tab is kicked and replacement continues', async () => {
    const user = users[0];
    const oldSocket = user.socket;
    const kicked = waitForEvent(oldSocket, 'player:kicked');
    const replacement = await connectPlayer(user);
    const message = await kicked;
    assert(user.kickedMessages.length >= 1, 'Original socket did not record kicked message');
    assert(replacement.connected, 'Replacement socket did not remain connected');
    return { message };
  });

  await step('participant disconnect and reconnect updates online state', async () => {
    const user = users[1];
    user.socket.disconnect();

    await waitForAdminState('one participant offline', (state) => {
      return state.participants.some((participant) => participant.id === user.id && !participant.online);
    });

    await connectPlayer(user);
    const state = await waitForAdminState('participant back online', (nextState) => {
      return nextState.participants.some((participant) => participant.id === user.id && participant.online);
    });

    return {
      online: state.participants.filter((participant) => participant.online).length
    };
  });

  await step('quiz round validation and media payload save', async () => {
    await expectStatus('PUT', '/api/admin/rounds', 401, { rounds: [] });
    await expectStatus('PUT', '/api/admin/rounds', 400, { rounds: [] }, adminToken);

    const state = await admin('PUT', '/api/admin/rounds', { rounds: [makeRound()] });
    const round = state.quiz.rounds.find((item) => item.id === 'e2e-round');
    assert(round, 'E2E round was not saved', state.quiz.rounds);
    assert(round.questions[0].media?.kind === 'image', 'Image media was not saved');
    assert(round.questions[1].media?.kind === 'video', 'Video media was not saved');
    assert(round.questions[2].media?.kind === 'audio', 'Audio media was not saved');

    await expectStatus('POST', '/api/admin/quiz/start', 404, { roundId: 'missing-round' }, adminToken);
    return {
      rounds: state.quiz.rounds.length,
      mediaKinds: round.questions.map((question) => question.media?.kind)
    };
  });

  await step('quiz question 1: 30 answers, duplicate answer, manual end, late answer rejected', async () => {
    await admin('POST', '/api/admin/quiz/start', { roundId: 'e2e-round' });
    await waitForPlayers('players receive first question', (state) => {
      return state.phase === 'quiz-question' && state.activeQuestion?.id === 'e2e-q1';
    });

    const answers = await Promise.all(
      users.map((user, index) => {
        const selectedIndex = index % 2 === 0 ? 1 : 0;
        return request('POST', '/api/quiz/answer', { participantId: user.id, selectedIndex });
      })
    );

    assert(answers.every((answer) => answer.status === 200), 'Not all question 1 answers were accepted', answers);
    assert(scoreSum(answers) === 21, 'Question 1 speed scoring total is wrong', answers);

    await expectStatus('POST', '/api/quiz/answer', 409, { participantId: users[0].id, selectedIndex: 1 });

    const resultsState = await publicState();
    assert(resultsState.quiz.questionResults.length === PARTICIPANT_COUNT, 'Admin did not receive all question 1 results');

    await admin('POST', '/api/admin/quiz/end-question');
    await waitForPlayers('players receive question 1 results', (state) => state.phase === 'quiz-results');
    await expectStatus('POST', '/api/quiz/answer', 400, { participantId: users[2].id, selectedIndex: 1 });

    return {
      accepted: answers.length,
      awardedPoints: scoreSum(answers),
      results: resultsState.quiz.questionResults.length
    };
  });

  await step('quiz question 2: next question, 30 correct answers, final leaderboard', async () => {
    await admin('POST', '/api/admin/quiz/next');
    await waitForPlayers('players receive second question', (state) => {
      return state.phase === 'quiz-question' && state.activeQuestion?.id === 'e2e-q2';
    });

    const answers = await Promise.all(
      users.map((user) => request('POST', '/api/quiz/answer', { participantId: user.id, selectedIndex: 3 }))
    );

    assert(answers.every((answer) => answer.status === 200), 'Not all question 2 answers were accepted', answers);
    assert(scoreSum(answers) === 36, 'Question 2 speed scoring total is wrong', answers);

    await admin('POST', '/api/admin/quiz/end-question');
    const state = await waitForAdminState('quiz results after second question', (nextState) => {
      return nextState.phase === 'quiz-results' && nextState.quiz.leaderboard.length === PARTICIPANT_COUNT;
    });

    const totalScore = state.quiz.leaderboard.reduce((sum, row) => sum + row.score, 0);
    assert(totalScore === 57, 'Total leaderboard score is wrong after two questions', state.quiz.leaderboard);

    return {
      accepted: answers.length,
      awardedPoints: scoreSum(answers),
      totalScore
    };
  });

  await step('score reset clears all participant points', async () => {
    const state = await admin('POST', '/api/admin/reset-scores');
    assert(state.quiz.leaderboard.every((row) => row.score === 0), 'Some scores were not reset', state.quiz.leaderboard);
    return {
      participants: state.quiz.leaderboard.length,
      totalScore: state.quiz.leaderboard.reduce((sum, row) => sum + row.score, 0)
    };
  });

  await step('voting: active guard, invalid score, 30 votes, duplicate vote, final average', async () => {
    await admin('POST', '/api/admin/voting/start', {
      target: {
        id: users[0].id,
        name: users[0].nickname,
        description: 'E2E voting target'
      }
    });

    await waitForPlayers('players receive active voting', (state) => {
      return state.phase === 'voting' && state.voting.active && state.voting.target?.id === users[0].id;
    });

    await expectStatus(
      'POST',
      '/api/admin/voting/start',
      400,
      { target: { id: users[1].id, name: users[1].nickname } },
      adminToken
    );
    await expectStatus('POST', '/api/voting/vote', 400, { participantId: users[0].id, score: 6 });

    const votes = await Promise.all(
      users.map((user, index) => request('POST', '/api/voting/vote', { participantId: user.id, score: (index % 5) + 1 }))
    );
    assert(votes.every((vote) => vote.status === 200), 'Not all votes were accepted', votes);

    await expectStatus('POST', '/api/voting/vote', 409, { participantId: users[0].id, score: 5 });

    const state = await admin('POST', '/api/admin/voting/stop');
    const result = state.voting.results[0];
    assert(result.votesCount === PARTICIPANT_COUNT, 'Voting result count is wrong', result);
    assert(result.total === 90, 'Voting total is wrong', result);
    assert(result.average === 3, 'Voting average is wrong', result);

    await expectStatus(
      'POST',
      '/api/admin/voting/start',
      409,
      { target: { id: users[0].id, name: users[0].nickname } },
      adminToken
    );

    return result;
  });

  await step('random draw: validation, realtime spin, 3 unique winners, reset', async () => {
    await expectStatus('POST', '/api/admin/random/start', 401, { winnersCount: 1 });
    await expectStatus('POST', '/api/admin/random/start', 400, { winnersCount: 0 }, adminToken);
    await expectStatus('POST', '/api/admin/random/start', 400, { winnersCount: PARTICIPANT_COUNT + 1 }, adminToken);

    const drawing = await admin('POST', '/api/admin/random/start', { winnersCount: 3 });
    assert(drawing.phase === 'random-drawing', 'Random draw did not enter drawing phase', drawing);
    assert(drawing.random.active === true, 'Random draw was not marked active', drawing.random);
    assert(drawing.random.winnersCount === 3, 'Random draw winner count is wrong', drawing.random);
    assert(drawing.random.participantsCount === PARTICIPANT_COUNT, 'Random draw participant count is wrong', drawing.random);

    await waitForPlayers('players receive random drawing phase', (state) => {
      return state.phase === 'random-drawing' && state.random.active && state.random.winnersCount === 3;
    });

    await expectStatus('POST', '/api/admin/random/start', 400, { winnersCount: 1 }, adminToken);

    const state = await waitForAdminState('random winners ready', (nextState) => {
      return nextState.phase === 'random-results' && !nextState.random.active && nextState.random.winners.length === 3;
    }, 7000);

    await waitForPlayers('players receive random results', (playerState) => {
      return playerState.phase === 'random-results' && playerState.random.winners.length === 3;
    }, 7000);

    const winnerIds = new Set(state.random.winners.map((winner) => winner.participantId));
    assert(winnerIds.size === 3, 'Random winners are not unique', state.random.winners);
    assert(state.random.winners.every((winner, index) => winner.place === index + 1), 'Random places are not sequential', state.random.winners);
    assert(
      state.random.winners.every((winner) => users.some((user) => user.id === winner.participantId)),
      'Random winner is not an existing participant',
      state.random.winners
    );

    const reset = await admin('POST', '/api/admin/random/reset');
    assert(reset.phase === 'idle', 'Random reset did not return phase to idle', reset);
    assert(reset.random.winners.length === 0 && !reset.random.active, 'Random reset did not clear winners', reset.random);

    return {
      winners: state.random.winners.map((winner) => `${winner.place}:${winner.nickname}`),
      participants: state.random.participantsCount
    };
  });

  await step('session reset notifies all players and stale participant ids are rejected', async () => {
    const resetPromises = users.map((user) => waitForEvent(user.socket, 'player:reset'));
    await admin('POST', '/api/admin/reset-session');
    const messages = await Promise.all(resetPromises);

    const state = await waitForAdminState('empty idle session after reset', (nextState) => {
      return nextState.phase === 'idle' && nextState.participants.length === 0;
    });

    const staleUser = {
      id: users[0].id,
      nickname: users[0].nickname
    };
    const staleSocket = io(API_BASE, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });
    await waitForEvent(staleSocket, 'connect');
    const staleRejected = waitForEvent(staleSocket, 'player:not-found');
    staleSocket.emit('player:join', staleUser.id);
    const staleMessage = await staleRejected;
    staleSocket.disconnect();

    assert(messages.length === PARTICIPANT_COUNT, 'Not every participant received reset message', messages);

    if (originalQuizRounds) {
      await admin('PUT', '/api/admin/rounds', { rounds: originalQuizRounds });
      restoredOriginalQuizRounds = true;
    }

    return {
      resetMessages: messages.length,
      participantsAfterReset: state.participants.length,
      staleMessage
    };
  });
}

try {
  await main();
  console.log('\nE2E SUMMARY');
  console.table(steps.map((item) => ({ status: item.status, ms: item.ms, name: item.name })));
  await cleanup();
  process.exit(0);
} catch (error) {
  console.log('\nE2E SUMMARY');
  console.table(steps.map((item) => ({ status: item.status, ms: item.ms, name: item.name, error: item.error ?? '' })));
  await cleanup();
  process.exit(1);
}
