# Spectra Operations Platform Manual

## 1. System Purpose

Spectra is an operations management platform for a private security company. It helps the company manage guards, clients, deployment sites, attendance, patrols, incident reporting, operational analytics, and daily PDF reports.

The system has two main user experiences:

- Desktop operations dashboard for administrators, executives, supervisors, and operations staff.
- Mobile guard interface for check-in/check-out, patrol activity, and incident reporting.

The codebase is split into:

- `backend`: NestJS REST API, Prisma ORM, PostgreSQL, Redis, BullMQ, PDFKit.
- `frontend`: Next.js web app, React Query, Tailwind CSS, Recharts, Lucide icons.
- `docker-compose.yml`: local PostgreSQL and Redis services.

## 2. High-Level Architecture

1. A user opens the Next.js frontend.
2. The frontend sends API requests through `frontend/src/lib/api.ts`.
3. The NestJS API receives requests under `/api/v1`.
4. Authenticated routes are protected by JWT cookies or bearer tokens.
5. Controllers validate requests and call service classes.
6. Services use `PrismaService` to read and write PostgreSQL data.
7. Redis and BullMQ support background notification jobs.
8. PDFKit generates downloadable site reports.
9. Uploaded media is intended to be served from the backend `/uploads` static path.

## 3. Authentication and Access Control

Authentication uses email and password login. On success, the backend sets two httpOnly cookies:

- `access_token`: short-lived JWT used for protected API access.
- `refresh_token`: 7-day token stored as a hash in the `RefreshToken` database table.

The frontend also calls `/auth/me` on load to restore the current session.

Implemented role normalization:

| Business Role | Normalized Access |
|---|---|
| `ADMIN` | Admin |
| `CEO` | Admin |
| `OPERATIONS_MANAGER` | Admin |
| `HR` | Admin |
| `SUPERVISOR` | Admin |
| `EMPLOYEE` | Employee |
| `GUARD` | Employee |

Admin-level routes can manage records and view dashboards. Employee-level routes are mainly used by mobile guard workflows.

## 4. Main Data Objects

| Object | What It Represents |
|---|---|
| `Organization` | A tenant or company using Spectra. |
| `User` | Login identity with role, password hash, and profile relations. |
| `Guard` | Security personnel record with status, shift, site assignment, IDs, and verification details. |
| `Client` | Corporate or estate customer receiving security service. |
| `Site` | Physical deployment location with coordinates, risk level, client, and guard target. |
| `Attendance` | Guard check-in/check-out record with GPS position and verification status. |
| `PatrolRoute` | Route assigned to a site, with scheduled times and checkpoints. |
| `PatrolCheckpoint` | Ordered checkpoint on a route, normally scanned by QR. |
| `PatrolRecord` | One patrol session started by a guard. |
| `PatrolLog` | Individual checkpoint scan log. The current UI mainly updates `PatrolRecord`. |
| `Incident` | Security incident report with type, severity, status, site, reporter, and media fields. |
| `Notification` | In-app/email/SMS notification record. |
| `RefreshToken` | Hashed refresh token for session rotation. |
| `AuditLog` | Audit trail model exists in the schema, but is not yet actively written by services. |

## 5. Desktop Sections

### Login

Path: `/login`

The login page accepts email and password, posts to `/auth/login`, and stores the resulting session in httpOnly cookies. The frontend `AuthProvider` redirects unauthenticated users back to `/login`.

### Dashboard

Path: `/`

Shows command-center metrics:

- total guards
- active guards
- late check-ins
- absent count
- total sites
- high-risk sites
- open incidents
- attendance percentage
- weekly attendance trend
- incidents by type
- site risk distribution
- recent activity feed

Data comes from `/dashboard/stats`, `/dashboard/incidents-by-type`, `/dashboard/site-risk-distribution`, `/dashboard/attendance-trend`, and `/dashboard/recent-activities`.

### Guards

Path: `/guards`

Shows a searchable, paginated guard directory with:

- guard name
- NIN
- assigned site
- current shift
- status

The API also supports creating, updating, transferring, and deactivating guards through `/guards`, but the current desktop page mainly lists data. The visible Add Guard and Filter buttons are not fully wired to forms yet.

Clicking a guard's name navigates to their full profile at `/guards/:id`.

### Guard Profile

Path: `/guards/:id`

Displays a comprehensive guard dossier with two-column layout:

**Left column — Identity Card:**
- Photo (with initials fallback if no photo)
- Name, status badge (ACTIVE/ON_LEAVE/SUSPENDED/INACTIVE), shift (DAY/NIGHT/OFF)
- Performance score with color coding (green ≥90%, amber ≥70%, red <70%)
- Contact details: phone, address, emergency contact
- Identification: NIN, masked BVN, guarantor details
- Employment: hire date, assigned site (linked), assigned supervisor

**Right column — Records & Activity:**
- Background verification status (VERIFIED/PENDING/FAILED) with traffic-light card
- Training records and certificates (parsed from JSON)
- Disciplinary history timeline
- Recent attendance table (last 10 records with site, times, status)

Data comes from `GET /guards/:id` which includes `assignedSite`, `assignedSupervisor`, and `attendances`.

### Clients

Path: `/clients`

Shows client and estate records:

- company name
- estate name
- contact person
- phone
- active sites
- contract expiry
- billing status

The API supports client CRUD. The current page focuses on listing and searching.

### Sites

Path: `/sites`

Shows deployed site records:

- site name
- address
- associated client
- risk level
- current guards vs target guards
- incident count

The API supports site CRUD. The current page focuses on listing and searching.

### Attendance

Path: `/attendance`

Shows attendance history:

- guard
- site
- check-in time
- check-out time
- status
- method

Check-in and check-out are performed from the mobile UI. Admin users can review history from this section.

### Incidents

Path: `/incidents`

Shows incident records:

- title
- incident type
- severity
- site
- reporter
- status
- report date

Admin users can update incident status through the API, while the visible desktop page currently focuses on viewing records.

### Patrols

Path: `/patrols`

Shows patrol history:

- route
- guard
- site
- start and end time
- status
- completion percentage

Mobile guards start patrols and submit checkpoint scans.

### Analytics

Path: `/analytics`

Shows deeper charts using dashboard aggregate endpoints:

- incidents by type
- attendance rate trend
- site risk distribution

### Reports

Path: `/reports`

Loads sites from `/sites` and provides download links to daily PDF reports:

`/reports/site/:siteId/daily/pdf`

Each PDF includes site info, client info, date, risk level, attendance summary, and incident summary.

## 6. Mobile Sections

### Mobile Home

Path: `/mobile`

Used by guards. It shows:

- greeting and assigned site
- check-in/check-out button
- current time
- optional verification photo preview
- GPS-based attendance action

Check-in sends latitude and longitude to `/attendance/check-in`. If a photo is selected, it attempts to upload it to `/uploads/attendance/:id/photo`.

### Mobile Patrol

Path: `/mobile/patrol`

The page:

1. Calls `/auth/me` to find the guard's assigned site.
2. Calls `/patrols/routes/:siteId` to load patrol routes.
3. Starts a patrol through `/patrols/start`.
4. Simulates checkpoint scanning and submits scans to `/patrols/submit`.

The current scanning behavior is a simulation of the next pending checkpoint. A production version should connect this to a QR scanner.

### Mobile Incidents

Path: `/mobile/incidents`

The page lets a guard enter:

- title
- type
- severity
- site ID
- description
- photos

It posts an incident to `/incidents` and uploads photos to `/uploads/incident/:id/photo`.

## 7. Backend Modules

| Module | Responsibility |
|---|---|
| `AuthModule` | Register first admin, create employees, login, refresh, logout, get current user. |
| `GuardModule` | Guard directory, search, pagination, create, update, transfer, deactivate, stats. |
| `ClientModule` | Client directory, search, billing filter, create, update, delete. |
| `SiteModule` | Site directory, risk/client filters, create, update, delete. |
| `AttendanceModule` | GPS check-in/check-out, 200m geofence validation, attendance history. |
| `PatrolModule` | Route lookup, patrol start, patrol submission, patrol history. |
| `IncidentModule` | Incident report creation, status updates, incident lookup and listing. |
| `UploadsModule` | Attach uploaded file URLs to incident and attendance records. |
| `DashboardModule` | Aggregate counts, charts, attendance trend, recent activity feed. |
| `ReportsModule` | Daily site PDF report generation. |
| `NotificationsModule` | BullMQ jobs for incident alerts and attendance reports. |
| `DatabaseModule` | Shared Prisma client and database lifecycle. |

## 8. API Surface Summary

All routes are prefixed with `/api/v1`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/employees`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Guards | `GET /guards`, `GET /guards/stats`, `GET /guards/:id`, `POST /guards`, `PATCH /guards/:id`, `POST /guards/:id/transfer`, `DELETE /guards/:id` |
| Clients | `GET /clients`, `GET /clients/:id`, `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id` |
| Sites | `GET /sites`, `GET /sites/:id`, `POST /sites`, `PATCH /sites/:id`, `DELETE /sites/:id` |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/history` |
| Patrols | `GET /patrols/routes/:siteId`, `POST /patrols/start`, `POST /patrols/submit`, `GET /patrols/history` |
| Incidents | `POST /incidents`, `PATCH /incidents/:id/status`, `GET /incidents`, `GET /incidents/:id` |
| Uploads | `POST /uploads/incident/:id/photo`, `POST /uploads/incident/:id/video`, `POST /uploads/incident/:id/voice`, `POST /uploads/attendance/:id/photo` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/incidents-by-type`, `GET /dashboard/site-risk-distribution`, `GET /dashboard/attendance-trend`, `GET /dashboard/recent-activities` |
| Reports | `GET /reports/site/:siteId/daily/pdf` |

## 9. Important Workflows

### Login and Session Refresh

1. User submits email/password from `/login`.
2. Backend validates password hash.
3. Backend creates access and refresh tokens.
4. Tokens are stored as httpOnly cookies.
5. Frontend calls protected routes with cookies.
6. If a route returns 401, the Axios interceptor calls `/auth/refresh`.
7. If refresh succeeds, the original request is retried.
8. If refresh fails, the user is redirected to `/login`.

### Guard Check-In

1. Guard opens `/mobile`.
2. Browser gets GPS coordinates.
3. Frontend posts coordinates to `/attendance/check-in`.
4. Backend resolves the guard profile from the logged-in user.
5. Backend resolves the assigned site.
6. Backend calculates distance from site coordinates using the Haversine formula.
7. If within 200 meters, attendance is verified and marked `ON_TIME`.
8. If outside 200 meters, attendance is marked `FLAGGED`.
9. Optional verification photo is attached after the attendance record is created.

### Patrol Completion

1. Guard opens `/mobile/patrol`.
2. Frontend loads routes for the assigned site.
3. Guard starts a patrol.
4. Backend creates a `PatrolRecord` with status `IN_PROGRESS`.
5. Guard scans checkpoints.
6. Frontend submits scans.
7. Backend compares scanned checkpoints against expected route checkpoints.
8. Backend stores scanned and missed checkpoint IDs, marks the patrol `COMPLETED`, and calculates completion percentage.

### Incident Reporting

1. Guard opens `/mobile/incidents`.
2. Guard enters incident details and optional photos.
3. Frontend posts the incident to `/incidents`.
4. Backend validates the site belongs to the same organization.
5. Backend creates an `Incident` with status `OPEN`.
6. Photos are uploaded and appended to the incident photo list.
7. Admin users can review incidents from `/incidents` and update status through the API.

### PDF Report Download

1. Admin opens `/reports`.
2. Frontend loads sites.
3. User clicks Download Daily PDF.
4. Backend gathers site, attendance, guard, and incident counts for the day.
5. PDFKit renders the report and streams it as a downloadable PDF.

## 10. Local Development

Prerequisites:

- Node.js 20+
- Docker Desktop

Typical setup:

```bash
docker-compose up -d
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/api/v1`

Seed login:

- `ceo@spectra.com`
- `Password123!`

## 11. Implementation Notes and Current Gaps

These notes describe the current code as inspected in this workspace.

| Area | Note |
|---|---|
| Role labels | Business roles exist in seed/schema comments, while many route decorators use `ADMIN` and `EMPLOYEE`. `RolesGuard` normalizes business roles to those access groups. |
| Desktop forms | Several pages show Add/Filter/action buttons, but the pages mainly implement read/list behavior. Backend CRUD endpoints exist. |
| Mobile incident payload | The backend incident DTO requires `siteId`, `latitude`, and `longitude`. The current mobile form treats Site ID as optional and does not include latitude/longitude in the POST body, even though it requests geolocation. |
| Upload storage | `UploadsService` expects `file.filename`, but no explicit Multer disk storage configuration is visible. With default memory storage, filename may be missing. |
| Notifications | BullMQ notification service and worker exist, but incident creation does not currently trigger `sendIncidentAlert`. |
| Audit logs | `AuditLog` exists in the Prisma schema, but service methods do not currently write audit events. |
| Attendance checkout | Check-out stores `checkOutLocation` as JSON but does not currently populate `checkOutLatitude`, `checkOutLongitude`, or geofence verification on checkout. |
| Patrol logs | The schema has `PatrolLog`, but current patrol submission stores scans inside `PatrolRecord.scannedCheckpoints` JSON rather than creating individual `PatrolLog` rows. |
| PDF downloads broken | `reports/page.tsx` uses a plain `<a href>` tag for PDF downloads. Browser native downloads do not send httpOnly cookies cross-origin, so every download returns 401. Needs authenticated fetch + Blob download. |
| Incidents search input decorative | `incidents/page.tsx` has a visible search input with no `onChange` handler or state — purely decorative. |
| Dead Add/Filter buttons | Guards, Clients, and Sites pages all render "Add X" and "Filter" buttons with no `onClick` handlers. Backend CRUD endpoints exist. |
| Dead action menus | Every table row on Guards, Clients, and Sites pages has a `MoreVertical` (⋮) button with no dropdown or action menu. |
| Mobile patrol simulates scanning | Patrol checkpoint scanning comments note "In a real app, scanning would involve QR code reading. For now, simulate…" — no real QR integration. |
| Type mismatches in Incidents/Patrols pages | Incidents page interface expects `status` and `reportedAt` but schema uses `investigationStatus`. Patrols page expects `PatrolRecord` fields that may not exist on `PatrolLog`. |
| No file size limits on uploads | Upload controller has no validation for file size. A large file would be accepted without restriction. |
| Seed placeholder images | Guard photos use `via.placeholder.com/150` — external dependency that will break when the service is down. |
| Mobile user menu dead | The user avatar button in the mobile header (`mobile/layout.tsx`) has no onClick — no logout or profile access. |
| `uploads/` directory not gitignored | Files uploaded during local development are tracked by git and could be committed accidentally. |

