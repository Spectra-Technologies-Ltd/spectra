# Local development

Everything needed to run the Spectra platform (backend + dashboard) on a fresh machine.

## Prerequisites

- **Node 22.x** (`node -v`) and npm 11+
- **Docker Desktop** running (Postgres + Redis run in containers)
- Git

## 1. Services (Postgres + Redis)

```bash
docker compose up -d
```

| Service | Host port | Credentials |
|---|---|---|
| Postgres (`spectra_db`) | **5433** | `postgres` / `postgrespassword` |
| Redis | **6379** | — |

Check they are up: `docker ps`.
If a container already exists with the *wrong* port mapping, `docker compose up -d` recreates it from `docker-compose.yml`.

## 2. Backend (`backend/`)

Create `backend/.env` (see `backend/.env.example`). Minimum:

```
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/spectra_db"
JWT_SECRET="<any long random string>"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

Install, create the schema, seed, run:

```bash
cd backend
npm install          # use install, not ci — see Troubleshooting
CHECKPOINT_DISABLE=1 npx prisma db push
npx prisma db seed   # base data: CEO user, guards, sites, 8 days attendance, 30 days history
npm run seed:alerts  # refresh 30 days of incidents/patrols + labelled demo alerts
npm run start:dev    # http://localhost:3001, all routes prefixed /api/v1
```

`npm run start:dev` runs `nest start --watch` (recompiles on save).

### Seeded logins

| Role | Email | Password |
|---|---|---|
| CEO | `ceo@spectra.com` | `Password123!` |

### Seeded data

- 2 sites: `seed-site-chevron-main-gate`, `seed-site-banana-island`
- 8 guards, 2 patrol routes, 7 checkpoints
- **30 days** of incidents (1–4/day/site) and patrols (2–3/day/site), ending **yesterday** — baselines intentionally exclude the in-progress day
- 8 days of attendance (baselines use the 7 completed days)
- 3 labelled demo alerts (1 real, 1 false, 1 unlabelled) for the training set

## 3. Frontend (`frontend/`)

```bash
cd frontend
npm install
node node_modules/next/dist/bin/next dev -p 3000    # or: npm run dev
```

`next.config.ts` proxies `/api/:path*` to `http://localhost:3001/api/:path*`, so the dashboard is same-origin in dev — no CORS or `NEXT_PUBLIC_API_URL` needed. Log in at http://localhost:3000/login.

## 4. Verify the intelligence layer

```bash
# session cookie
curl -s -c /tmp/c.txt -H 'Content-Type: application/json' \
  -d '{"email":"ceo@spectra.com","password":"Password123!"}' \
  http://localhost:3001/api/v1/auth/login

# baselines per site (today excluded)
curl -s -b /tmp/c.txt http://localhost:3001/api/v1/baselines/seed-site-chevron-main-gate

# surprise for one observation
curl -s -b /tmp/c.txt 'http://localhost:3001/api/v1/baselines/surprise?siteId=seed-site-chevron-main-gate&metric=INCIDENT_COUNT&value=5'

# ranked unread feed
curl -s -b /tmp/c.txt http://localhost:3001/api/v1/alerts/unread

# training data (per-event rollup + per-rule samples)
curl -s -b /tmp/c.txt http://localhost:3001/api/v1/alerts/training-data
curl -s -b /tmp/c.txt 'http://localhost:3001/api/v1/alerts/training-data?includeSilent=true'
```

Alert rules fire from `POST /api/v1/incidents`:

```bash
curl -s -b /tmp/c.txt -H 'Content-Type: application/json' \
  -d '{"siteId":"seed-site-chevron-main-gate","severity":"CRITICAL","type":"FIRE"}' \
  http://localhost:3001/api/v1/incidents
```

Configurable thresholds (`backend/.env`): `ALERTS_SURGE_THRESHOLD` (5),
`ALERTS_SURGE_WINDOW_MINUTES` (10), `ALERTS_ANOMALY_THRESHOLD` (0.9).

## Troubleshooting

**`npm ci` fails with EUSAGE / "Missing: @emnapi/core from lock file".**
The committed lockfiles were out of sync with their `package.json`; `npm install`
reconciles them (both lockfiles are already fixed in this branch). If you hit it
elsewhere, run `npm install` once.

**Installs hang or fail with ECONNRESET / ENOTFOUND.**
The registry connection is flaky on some networks. Retry with:

```bash
npm install --prefer-offline --fetch-retries=8 \
  --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=30000
```

**`prisma db push` stalls.**
Prisma's update check is the culprit — disable it:

```bash
CHECKPOINT_DISABLE=1 npx prisma db push
```

**`next` is not recognised / `npm run dev` fails with a missing binary.**
A partially-extracted `node_modules` may lack the `.bin` shims. Either reinstall,
or invoke the binary directly:

```bash
node node_modules/next/dist/bin/next dev
```

**First page load takes 1–2 minutes.**
Expected on Windows with real-time antivirus scanning `node_modules`; only the
first compile is slow.

**Phantom TypeScript errors after `prisma db push` (e.g. a model that exists).**
`nest --watch` caches incremental state in `backend/dist/tsconfig.build.tsbuildinfo`;
delete it and restart.

**Timestamps look wrong in SQL, or `now()` disagrees with the app.**
The Docker VM clock can drift from the host. App-side comparisons (baselines,
alerts) all use the app clock consistently, so this only misleads hand-written
SQL. If a container is far off, restart Docker Desktop.

**Port already in use.**
`3000` dashboard · `3001` backend · `5433` Postgres · `6379` Redis. Stop the
offending process, or start the dashboard on another port with `-p 3002`.

**SSE stream logs `401 {"message":"Missing token"}`.**
The realtime endpoint authenticates with the httpOnly `access_token` cookie. Once
that 15-minute cookie lapses the browser drops it and the stream reconnects
without one; polling (and the alerts page's offline-refetch) covers the gap until
the axios interceptor rotates the cookie.
