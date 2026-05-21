# Vibe Code Live

Vibe Code Live is a small real-time event app for live quizzes and audience voting. Participants join with a nickname, answer timed quiz questions, and vote on participants or demo apps while an admin controls the session from a separate dashboard.

## Features

- Participant login by nickname with similar-name checks.
- Real-time state updates with Socket.IO.
- Timed quiz rounds with speed-based scoring.
- Admin dashboard for quiz control, score resets, and session resets.
- Editable quiz rounds, questions, answers, timers, and scoring bonuses.
- Optional image or video media for quiz questions.
- 1-5 audience voting for participants or demos.
- Mobile-friendly participant and admin views.

## Tech Stack

- React 19
- Vite
- TypeScript
- Express
- Socket.IO

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development servers:

```bash
npm run dev
```

Open the app:

- Participant view: `http://localhost:5173`
- Admin view: `http://localhost:5173/admin`
- Server health check: `http://localhost:4000/api/health`

The default admin password is:

```text
vibe
```

## Configuration

You can change the admin password with `ADMIN_PASSWORD`:

```bash
ADMIN_PASSWORD=secret npm run dev
```

You can change the server port with `PORT`:

```bash
PORT=5000 npm run dev
```

On Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD="secret"; npm run dev
```

## Scripts

```bash
npm run dev
```

Starts the Express server and Vite client together.

```bash
npm run build
```

Builds the server and client for production.

```bash
npm start
```

Runs the built server from `server/dist/index.js`. Run `npm run build` first.

## Project Structure

```text
client/
  src/
    App.tsx       React app for participant and admin views
    api.ts        Fetch helper
    styles.css    App styles
    types.ts      Shared client-side types
server/
  src/
    index.ts      Express API, Socket.IO server, and in-memory session state
    types.ts      Shared server-side types
dist/             Production build output
```

## Admin Workflow

1. Open `http://localhost:5173/admin`.
2. Log in with the admin password.
3. Create or edit quiz rounds and questions.
4. Save the quiz content.
5. Start a quiz round, move between questions, or end questions manually.
6. Use voting mode to collect 1-5 ratings from participants.
7. Reset scores or reset the whole live session when needed.

## Media Uploads

Quiz questions can include one image or video:

- Images: up to 5 MB.
- Videos: up to 30 MB.

Media is stored in the current in-memory quiz session as data URLs, so short clips work best.

## Notes

- Session data is stored in memory and resets when the server restarts.
- Production serving expects the client build in `dist/client`.
- The app is intended for local live-event use, demos, and lightweight presentations.
