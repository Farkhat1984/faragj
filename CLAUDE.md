# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — runs server (`tsx watch`) and client (`vite`) together via `concurrently`. Server on `:4000`, client on `:5173`. Vite proxies `/api` and `/socket.io` to the server.
- `npm run build` — runs `server:build` (tsc → `server/dist`) then `client:build` (tsc check + vite build → `dist/client`). Order matters: server build must precede client build because the production server statically serves `dist/client`.
- `npm start` — runs `node server/dist/index.js`. Requires a prior `npm run build`.
- `npm run e2e:full` — `node scripts/e2e-full.mjs`. Spins up many simulated participants over Socket.IO and exercises the full admin → participant flow against a running dev stack. Env vars: `E2E_API_BASE` (default `http://localhost:4000`), `E2E_UI_BASE`, `E2E_PARTICIPANTS` (default 30), `ADMIN_PASSWORD`.
- No unit test framework, no linter, and no formatter are configured. TypeScript `strict` is on for both packages — the client build runs `tsc -p client/tsconfig.json` purely as a type check (the client has `noEmit: true`; Vite does the actual transpile).

Runtime config:
- `ADMIN_PASSWORD` (default `vibe`) — also doubles as the admin bearer token (see below).
- `PORT` (default `4000`).

## Architecture

This is a single-process live-event app: one Express + Socket.IO server holds **all** session state in memory, and one React SPA renders both the participant view (`/`) and the admin view (`/admin`). There is no database, no auth system beyond a shared password, and no per-user persistence — restarting the server wipes everything except saved quiz content.

### Server (`server/src/index.ts`)

The entire backend lives in this one ~900-line file. Treat it as the single source of truth for session state:

- **Module-scoped mutable state**: `participants` map, `quiz` runtime object, `voting` session, `votingHistory`, `randomDraw`, `voteTargets`, plus a top-level `phase: Phase` that drives the global state machine (`idle | quiz-question | quiz-results | voting | voting-results | random-drawing | random-results`).
- **Single emit path**: `emitState()` is called after every mutation. It pushes the full `PublicState` to the `admin` socket room and a per-participant `PlayerState` to each connected player socket. Whenever you mutate state in a new code path, make sure `emitState()` runs before returning — otherwise clients silently desync.
- **Persistence**: only `quizRounds` is persisted, to `data/quiz-rounds.json` via `loadQuizRounds` / `saveQuizRounds`. `data/` is created lazily. Everything else (scores, answers, votes, draws) is intentionally ephemeral.
- **Quiz timing**: `startQuestion` sets `roundTimer` (a `setTimeout`) to auto-call `endQuestion`. `endQuestion` either advances (auto) or holds on `quiz-results` (manual `next`). Always go through these two functions — don't mutate `quiz.activeQuestionIndex` directly.
- **Admin auth**: `assertAdmin` middleware checks `Authorization: Bearer <ADMIN_PASSWORD>`. The "token" returned by `POST /api/admin/login` is literally the password. Socket.IO admin join uses the same value via `socket.emit('admin:join', token)`.
- **Nickname collision**: `normalizeNickname` folds visually-similar Cyrillic letters to Latin, then `isTooSimilar` does a Levenshtein check against existing participants. Joining is blocked if a near-match exists; the API responds 409 with `suggestions`.
- **Media in questions**: images/videos/audio are sent as data URLs inside JSON. Express body limit is `80mb` and Socket.IO `maxHttpBufferSize` is `100mb` — both are intentionally high to allow this. Don't lower them without rethinking media flow.
- **SPA fallback**: `app.get(/^\/(?!api|socket\.io).*/, ...)` serves `dist/client/index.html` so client routes like `/admin` work in production.

### Client (`client/src/App.tsx`)

One ~1700-line component file holds the entire UI for both audiences. The root `App` decides whether to render the participant or admin tree based on `window.location.pathname.startsWith('/admin')`. State comes from two sources:

- REST calls via the tiny `api()` helper in `api.ts` (which threads the admin token through `Authorization`).
- Socket.IO subscriptions: participant clients listen for `player:state` / `player:reset` / `player:kicked` / `player:not-found`; admin clients listen for `admin:state`.

The client trusts the server's `phase` for what to render — it does not maintain its own state machine. When adding new phases or fields, extend `server/src/types.ts` and `client/src/types.ts` together; they're kept in sync by hand.

Local storage keys:
- `vibe-code-participant` — `{ id, nickname }` rehydrated on load; the client emits `player:join` with the stored id, and the server replies `player:not-found` if the in-memory session was reset (triggering re-login).
- `vibe-code-admin-token` — stored admin password used for both REST and socket auth.

### Build layout

```
server/dist/index.js   # server build output (npm start runs this)
dist/client/           # client build output (served statically by the server in prod)
data/quiz-rounds.json  # persisted quiz content (created on first save)
```

### Docker

`Dockerfile` is a two-stage Node 20 Alpine build that runs `npm run build`, prunes dev deps, and runs `node server/dist/index.js` on port 4000. `docker-compose.yml` maps host `127.0.0.1:4010 → 4000` and bind-mounts `./data` so the quiz JSON survives container restarts.

## Deploy

Production runs on this same host — there is no remote target, no CI pipeline. "Deploy prod" means rebuild and restart the local container.

- **Container**: `vibe-code-live` (compose project `faragj`), image `vibe-code-live:latest`.
- **Port**: host `127.0.0.1:4010` → container `4000`. A separate nginx (root-owned, in `/etc/nginx/sites-enabled/`) fronts it for public traffic — don't change the bind without coordinating with that config.
- **Data**: `./data` is bind-mounted into `/app/data`. `docker-entrypoint.sh` runs as root and `chown -R node:node /app/data` before dropping to the `node` user (via `su-exec`), so the host UID of `./data` doesn't have to match. Don't remove that chown — see commit `dfd0d3d`.
- **Remote**: `origin` is `github.com/Farkhat1984/faragj`. Pushing is optional — the container builds from the local working tree, not from GitHub. Still push to keep history in sync.

Standard deploy from this directory:

```
git push origin main           # optional — keep GitHub in sync
docker compose up -d --build   # rebuild image and recreate container
docker compose ps              # confirm "healthy"
```

The healthcheck hits `/api/health`; `docker compose ps` shows `healthy` within ~30s of a good build. Restarting wipes all in-memory session state (participants, scores, votes) — only `data/quiz-rounds.json` survives. Don't deploy mid-event.
