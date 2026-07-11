# Spectra Operations Platform — Engineering Handover

**Project Repository:** https://github.com/kabiru-js/spectra  
**Owner:** Kabiru  
**Status:** MVP Complete — Pending Final Deployment & Production Hardening

---

## 🤖 Prompt for the Next Engineer's AI Agent

Copy and paste the following prompt exactly into your AI agent to continue this project:

---

> **AGENT PROMPT — COPY FROM HERE:**
>
> You are a senior full-stack engineer taking over the Spectra Operations Intelligence Platform from a previous engineer. This is an enterprise-grade Operations platform for a private security company — think Palantir Foundry for field security operations.
>
> **Your job is to complete the deployment of the platform to production, then harden and expand it.**
>
> ---
>
> ### Project Context
>
> The previous engineer completed the full MVP. The codebase is hosted at:
> **GitHub:** `https://github.com/kabiru-js/spectra`
>
> The platform consists of:
> - **`/backend`** — A NestJS REST API running on port 3001 using TypeScript, Prisma ORM, PostgreSQL, Redis, and BullMQ.
> - **`/frontend`** — A Next.js 15 web application using TypeScript, Tailwind CSS v4, ShadCN UI, Lucide icons, and React Query.
> - **`/docker-compose.yml`** — Spins up PostgreSQL and Redis for local development.
>
> ---
>
> ### What Has Already Been Built (Do NOT Rebuild)
>
> #### Backend Modules (NestJS)
> - `AuthModule` — JWT authentication with Role-Based Access Control (RBAC). Roles: `CEO`, `OPERATIONS_MANAGER`, `HR`, `SUPERVISOR`, `GUARD`, `CLIENT`.
> - `GuardModule` — Full CRUD for 250+ guards including pagination, search, and status management.
> - `ClientModule` — Full CRUD for corporate security clients.
> - `SiteModule` — Full CRUD for deployment sites with coordinates, risk levels, and guard capacity.
> - `AttendanceModule` — GPS-verified check-in/check-out using the Haversine geofencing algorithm (200m radius enforcement).
> - `PatrolModule` — Patrol route and checkpoint scanning APIs.
> - `IncidentModule` — Incident creation with severity classification (LOW/MEDIUM/HIGH/CRITICAL) and categorical tagging.
> - `NotificationsModule` — BullMQ-powered async background job queue connected to Redis.
> - `ReportsModule` — PDFKit-based PDF report generator for daily site operations reports.
>
> #### Frontend Pages (Next.js)
> - `/login` — JWT-based login form.
> - `/` (Dashboard) — CEO overview with live stats, area charts, pie charts, and activity feeds.
> - `/guards` — Paginated guards directory with search.
> - `/clients` — Clients directory.
> - `/sites` — Sites directory.
> - `/analytics` — Advanced analytics with Recharts (Bar, Line, Area charts).
> - `/mobile` — Guard PWA home with GPS check-in button.
> - `/mobile/patrol` — Guard patrol route tracker with checkpoint scanning.
> - `/mobile/incidents` — Guard incident reporting form with photo upload and severity selector.
>
> #### Data Model (Prisma Schema)
> Key entities and their relationships:
> - `User` (Auth) → has a `role` field (enum).
> - `Guard` → belongs to `Sites` (many-to-many via deployments).
> - `Client` → owns multiple `Sites`.
> - `Site` → has lat/lng coordinates for geofencing, `riskLevel`, and `guardCapacity`.
> - `Attendance` → records GPS-verified check-in/out timestamps per guard per site.
> - `Patrol` → links guards to `PatrolRoutes` with checkpoint scan timestamps.
> - `Incident` → stores type, severity, status (OPEN/INVESTIGATING/RESOLVED/CLOSED), media URLs, and resolution notes.
>
> ---
>
> ### Your Immediate Tasks (In Priority Order)
>
> #### 1. Complete Deployment on Render + Vercel
> - **Backend:** Deploy the `/backend` directory as a **Render Web Service**.
>   - Build command: `npm install && npm run build`
>   - Start command: `npm run start:prod`
>   - Environment variables needed: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`
> - **Database:** Create a **Render PostgreSQL** service named `spectra-db`. Use the Internal Database URL.
> - **Redis:** Create a **Render Key Value** (Redis) service named `spectra-redis`. Use the Internal Redis URL for host/port.
> - **Database Seeding:** After the backend is deployed, run `npx prisma db push` then `npx prisma db seed` using the **External Database URL**.
> - **Frontend:** Deploy the `/frontend` directory to **Vercel**.
>   - Root Directory: `frontend`
>   - Environment variable: `NEXT_PUBLIC_API_URL=https://YOUR_RENDER_BACKEND_URL/api/v1`
>
> #### 2. Post-Deployment Verification
> - Confirm that `POST /api/v1/auth/login` works with seeded user `ceo@spectra.com` / `Password123!`.
> - Confirm that the frontend dashboard loads and displays stats.
> - Confirm that the mobile guard view works on a phone browser.
>
> #### 3. Production Hardening (After Deployment Confirmed Working)
> - Add a `Procfile` or `render.yaml` for zero-config Render deployments.
> - Set proper CORS origin on the NestJS backend to only allow the Vercel frontend domain.
> - Add Cloudinary integration for real media uploads in `IncidentModule` (currently mock).
> - Add PWA `manifest.json` and service worker to the `/frontend/public` directory.
> - Add a guard assignment flow to `SiteModule` (currently guards and sites exist but the assignment UI is missing).
>
> #### 4. Nice-to-Have Enhancements
> - Email notifications via Nodemailer or Resend when an incident is reported.
> - A real-time dashboard using Socket.io or Server-Sent Events to push live attendance/incident updates to the CEO dashboard without page refresh.
> - A `/schedule` page for managing guard shift schedules and replacements.
>
> ---
>
> ### Local Development Setup
>
> Prerequisites: Node.js v20+, Docker Desktop.
>
> ```bash
> # 1. Clone the repo
> git clone https://github.com/kabiru-js/spectra.git
> cd spectra
>
> # 2. Start the database and Redis
> docker-compose up -d
>
> # 3. Start the backend
> cd backend
> cp .env.example .env  # Fill in the values
> npm install
> npx prisma generate
> npx prisma db push
> npx prisma db seed
> npm run start:dev
>
> # 4. Start the frontend (in a new terminal)
> cd ../frontend
> npm install
> npm run dev
> ```
>
> - Backend runs on: `http://localhost:3001`
> - Frontend runs on: `http://localhost:3000`
> - Mock CEO login: `ceo@spectra.com` / `Password123!`
>
> **AGENT PROMPT — END.**

---

## 📋 Deployment Guidelines for the Next Engineer

### Infrastructure Overview

| Service | Platform | Purpose |
|---|---|---|
| PostgreSQL Database | Render (Postgres) | Main relational data store |
| Redis Cache & Queue | Render (Key Value) | BullMQ background jobs |
| NestJS REST API | Render (Web Service) | Backend API server |
| Next.js Frontend | Vercel | Desktop + Mobile PWA UI |

### Environment Variables Reference

#### Backend (Render Web Service)
| Variable | Where to get it | Example |
|---|---|---|
| `DATABASE_URL` | Render PostgreSQL → Internal URL | `postgres://user:pass@dpg-xxx:5432/spectra` |
| `REDIS_HOST` | Render Key Value → Internal Host | `red-xxx.render.com` |
| `REDIS_PORT` | Always 6379 | `6379` |
| `JWT_SECRET` | Generate a random string | `SpectraOps2026SuperSecret!` |

#### Frontend (Vercel)
| Variable | Where to get it | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Render Web Service public URL + `/api/v1` | `https://spectra-api-xxx.onrender.com/api/v1` |

### Critical Notes

> [!IMPORTANT]
> The NestJS backend is configured to use `api/v1` as the global prefix. Every API call from the frontend must use the `/api/v1` prefix. This is set in `backend/src/main.ts`.

> [!WARNING]
> Do NOT commit the `.env` file to GitHub. The `.gitignore` at the root is already configured to exclude it. Always add secrets via the hosting platform's environment variable dashboard.

> [!WARNING]
> The free tier of Render Web Services spins down after 15 minutes of inactivity. On first visit, the API may take 30-60 seconds to wake up. Upgrade to a paid tier for production use.

> [!TIP]
> After running `npx prisma db seed`, the following test accounts are available:
> - **CEO:** `ceo@spectra.com` / `Password123!`
> - **Operations Manager:** `ops@spectra.com` / `Password123!`
> - Guard and Supervisor accounts are seeded with their badge numbers as passwords.

### Files to Be Aware Of

| File | Purpose |
|---|---|
| [`backend/prisma/schema.prisma`](https://github.com/kabiru-js/spectra/blob/main/backend/prisma/schema.prisma) | The entire data model. Modify this to add new tables or fields. |
| [`backend/prisma/seed.ts`](https://github.com/kabiru-js/spectra/blob/main/backend/prisma/seed.ts) | Mock data seeder. Run this after every fresh `db push`. |
| [`backend/src/app.module.ts`](https://github.com/kabiru-js/spectra/blob/main/backend/src/app.module.ts) | Root NestJS module. Register all new feature modules here. |
| [`frontend/src/lib/api.ts`](https://github.com/kabiru-js/spectra/blob/main/frontend/src/lib/api.ts) | The Axios instance. All API calls go through this. The base URL reads from `NEXT_PUBLIC_API_URL`. |
| [`frontend/src/providers/AuthProvider.tsx`](https://github.com/kabiru-js/spectra/blob/main/frontend/src/providers/AuthProvider.tsx) | Global auth context. Exposes `user`, `token`, `login()`, and `logout()`. |
| `docker-compose.yml` | Local dev only — starts PostgreSQL on port 5432 and Redis on port 6379. |
