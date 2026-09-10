# StudyBoard

A collaborative study room platform: group video meetings (WebRTC), real-time
chat, a scrollable shared whiteboard, AI session summaries, and whiteboard/notes
→ PDF export. Built to deploy cleanly on Render with an external managed MySQL
database.

## Tech stack

| Layer     | Technology                                                        |
|-----------|--------------------------------------------------------------------|
| Frontend  | React + Vite + Tailwind CSS — Render **Static Site**               |
| Backend   | Java 17 + Spring Boot (Docker) — Render **Web Service**            |
| Database  | MySQL — **external** managed provider (Railway, Aiven, etc.)       |
| Real-time | Spring WebSocket + STOMP (chat, whiteboard sync, WebRTC signaling) |
| Video     | WebRTC (mesh), public Google STUN server, no self-hosted TURN      |
| File storage | Cloudinary (PDF exports) — never on local disk                  |

## Project structure

```
studyboard/
├── backend/                  Spring Boot app
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd / .mvn/
│   └── src/main/java/com/studyboard/
│       ├── config/            Security, WebSocket, CORS, exception handling
│       ├── controller/        REST controllers
│       ├── websocket/         STOMP controllers (chat, whiteboard, signaling)
│       ├── service/           Business logic, Cloudinary, PDF, AI summarization
│       ├── security/          JWT util + filter
│       ├── entity/ repository/ dto/
│       └── src/main/resources/application.properties   (env-var driven)
├── frontend/                 React + Vite + Tailwind app
│   ├── src/{pages,components,hooks,context,api,utils}
│   └── .env.example
├── schema.sql                 Reference MySQL schema (optional — Hibernate auto-creates it)
├── render.yaml                 Render Blueprint (deploys both services)
└── README.md
```

## How the pieces fit together

- **Auth**: JWT issued on register/login, sent as `Authorization: Bearer <token>`
  on every REST call and on the STOMP CONNECT frame.
- **Rooms**: 6-character join codes; creating a room auto-adds you as a member.
- **Chat**: sent over `/app/rooms/{roomId}/chat.send`, broadcast on
  `/topic/rooms/{roomId}/chat`, persisted to MySQL, fetched via REST on room load.
- **Whiteboard**: incremental strokes broadcast on `/topic/rooms/{roomId}/board`;
  periodic full-state checkpoints saved to MySQL (`whiteboard_snapshots`) so a
  user who joins late or reloads can restore the board.
- **Video**: WebRTC mesh (one peer connection per participant), signaled over
  the same WebSocket connection (`/topic/rooms/{roomId}/signal`) using the
  public STUN server `stun:stun.l.google.com:19302`. No TURN server is run —
  Render's free-tier web services don't reliably support the persistent UDP a
  TURN server needs, and most peers connect fine via STUN alone. For
  restrictive corporate NATs, plug in a third-party TURN provider later.
- **PDF export**: generated with iText into `/tmp` (ephemeral), immediately
  uploaded to Cloudinary, and only the resulting URL is stored in MySQL — the
  backend never depends on local disk surviving a restart.
- **AI summary**: sends the room's chat transcript to an AI API (Anthropic's
  Messages API by default) and stores the resulting summary.

---

## 1. Provision an external MySQL database

Render doesn't offer native MySQL, so create one on a managed provider first:

- **Railway** → New Project → provision MySQL → copy the connection string
- **Aiven** → create a free MySQL service → copy host/port/user/password

You need: host, port, database name, username, password. Build `DB_URL` as a
standard JDBC URL, e.g.:

```
jdbc:mysql://<host>:<port>/<database>?useSSL=true&requireSSL=true&serverTimezone=UTC
```

Run `schema.sql` against it if you'd rather create tables manually — otherwise
just leave `DDL_AUTO=update` and Hibernate creates them on first boot.

## 2. Deploy via Render Blueprint (recommended)

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint Instance**, point it at your repo.
   Render reads `render.yaml` and creates both services.
3. Render will prompt for the env vars marked `sync: false` — fill in:
   - `DB_URL`, `DB_USER`, `DB_PASSWORD` (from step 1)
   - `FRONTEND_URL` — leave blank for now, come back after the frontend deploys
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
     (from your Cloudinary dashboard → Settings → Access Keys)
   - `AI_API_KEY` — your Anthropic (or other AI provider) API key
   - `VITE_API_URL` on the frontend service — leave blank for now
4. Deploy. Once the **backend** finishes, copy its URL
   (`https://studyboard-backend-xxxx.onrender.com`).
5. Go to the **frontend** service → Environment → set
   `VITE_API_URL=https://studyboard-backend-xxxx.onrender.com` → trigger a
   manual redeploy (build-time env vars require a rebuild to take effect).
6. Once the **frontend** finishes, copy its URL
   (`https://studyboard-frontend-xxxx.onrender.com`).
7. Go to the **backend** service → Environment → set
   `FRONTEND_URL=https://studyboard-frontend-xxxx.onrender.com` → save
   (this restarts the backend with the correct CORS/WebSocket origin).
8. Visit the frontend URL, register an account, and test.

## 3. Manual deployment (without the Blueprint)

### Backend (Web Service, Docker)

1. New → Web Service → connect repo → set **Root Directory** to `backend`.
2. Runtime: **Docker** (Render auto-detects the `Dockerfile`).
3. Health Check Path: `/health`.
4. Environment variables (Environment tab):

   | Key | Value |
   |---|---|
   | `DB_URL` | `jdbc:mysql://<host>:<port>/<db>?useSSL=true&serverTimezone=UTC` |
   | `DB_USER` | your MySQL username |
   | `DB_PASSWORD` | your MySQL password |
   | `FRONTEND_URL` | your frontend's Render URL (set after step below) |
   | `JWT_SECRET` | any long random string (32+ chars) |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
   | `AI_API_KEY` | your AI provider API key |

   `PORT` is injected automatically by Render — don't set it yourself.

5. Deploy. Render builds the Docker image (`./mvnw clean package` runs inside
   the image, producing `target/studyboard-backend.jar`, then
   `java -jar app.jar` starts it reading `$PORT`).

### Frontend (Static Site)

1. New → Static Site → connect repo → set **Root Directory** to `frontend`.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Add a rewrite rule so client-side routes don't 404: source `/*` →
   destination `/index.html`.
5. Environment variable: `VITE_API_URL=https://<your-backend>.onrender.com`
6. Deploy.
7. Go back to the backend service and set `FRONTEND_URL` to this frontend's URL.

## Local development

```bash
# Backend
cd backend
export DB_URL=jdbc:mysql://localhost:3306/studyboard
export DB_USER=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=dev-secret-change-me-please-32chars-min
export FRONTEND_URL=http://localhost:5173
export CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
export AI_API_KEY=...
./mvnw clean package
java -jar target/studyboard-backend.jar

# Frontend (in another terminal)
cd frontend
cp .env.example .env   # then edit VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

Or test the backend container locally exactly as Render will run it:

```bash
cd backend
docker build -t studyboard-backend .
docker run -p 8080:8080 -e PORT=8080 \
  -e DB_URL=jdbc:mysql://host.docker.internal:3306/studyboard \
  -e DB_USER=root -e DB_PASSWORD=yourpassword \
  -e JWT_SECRET=dev-secret-change-me-please-32chars-min \
  -e FRONTEND_URL=http://localhost:5173 \
  studyboard-backend
```

## Notes on Render's free tier

- **Cold starts**: free web services sleep after ~15 minutes of inactivity.
  The frontend shows a "waking up the server" loading state on the first
  request if it takes more than ~2.5s, since a cold start can take 20-30s.
- **WebSocket over TLS**: Render terminates TLS at the edge, so the same
  `/ws` endpoint is reachable as `wss://` in production automatically — the
  frontend builds the scheme dynamically from `VITE_API_URL`
  (`src/utils/ws.js`), never hardcoding `ws://localhost`.
- **No TURN server**: only the public STUN server is used for WebRTC NAT
  traversal. This works for most home/office networks. If some users are
  behind symmetric NATs and can't connect, add a third-party TURN provider
  (e.g. Twilio, Metered) and extend the `ICE_SERVERS` array in
  `frontend/src/hooks/useWebRTC.js`.

## Build order this project followed

1. Spring Boot backend + MySQL schema + JWT auth, env-var config from day one
2. Dockerfile + local Docker test on injected `$PORT`
3. Deploy backend to Render, confirm `/health` passes
4. Room create/join APIs + WebSocket chat, tested over `wss://`
5. WebRTC video signaling
6. Scrollable whiteboard with real-time sync
7. PDF export wired to Cloudinary (not local disk)
8. Session summarization via AI API
9. React frontend with env-based API URL, deployed as a Render Static Site
10. `render.yaml` + this README for one-click redeploys
