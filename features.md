# AtomQuest - Goal Setting & Tracking Portal

## 1. Tech Stack
- **Frontend**: React 18, Vite, React Router v6, TanStack Query (caching/server state), Axios, React Hook Form + Zod (validation), Tailwind CSS, Lucide Icons.
  *Rationale: Optimized for fast rendering, declarative data fetching, robust client-side validation, and responsive, maintainable styling.*
- **Backend**: Node.js, Express.js.
  *Rationale: Fast, unopinionated server logic, easy REST API creation.*
- **Database**: PostgreSQL (relational DB), Prisma ORM (schema definition, migrations, and strongly-typed queries).
- **Authentication**: JWT (JSON Web Tokens) with short-lived access tokens (15m) and long-lived refresh tokens (7d), managed via httpOnly cookies. bcryptjs for password hashing.
- **Exporting**: ExcelJS for generating detailed `.xlsx` reports in a streamable format.
- **Dev Tooling**: Concurrently (run both client and server), Nodemon (hot-reloading).

## 2. Architecture Overview
- **Monorepo Structure**: The repository contains two root-level directories (`client/` and `server/`), connected by a root `package.json` that provides scripts to install dependencies and run both environments concurrently.
- **Client/Server Separation**: The React frontend acts entirely independent of the backend state, requesting updates and authenticating via HTTP REST calls (`/api/...`).
- **Authentication Flow**: Users log in to receive an `accessToken` and `refreshToken` securely stored in `httpOnly` cookies. The frontend intercepts 401 Unauthorized API responses and automatically hits `/api/auth/refresh` to renew the `accessToken` seamlessly.

## 3. User Roles & Access Matrix

| Feature | Employee | Manager (L1) | Admin / HR |
| --- | --- | --- | --- |
| Create Goals | ✅ | ✅ (Own goals) | ❌ |
| Edit Draft Goals | ✅ | ✅ (Own goals) | ❌ |
| Submit Goal Sheet | ✅ | ✅ (Own goals) | ❌ |
| Approve Team Goals | ❌ | ✅ | ✅ |
| Return Goals for Rework | ❌ | ✅ | ✅ |
| Log Quarterly Check-ins | ✅ | ✅ (Own goals) | ❌ |
| Add Manager Comment | ❌ | ✅ | ❌ |
| Push Shared Goals | ❌ | ✅ | ✅ |
| Unlock Locked Goals | ❌ | ❌ | ✅ |
| View Org Reports | ❌ | ✅ (Team only) | ✅ (All) |
| Manage Cycles | ❌ | ❌ | ✅ |

## 4. All Implemented Features
- **Authentication & RBAC**: Handled via `authController.js`, `auth.js` middleware, and frontend `AuthContext` + `ProtectedRoute`.
- **Employee Dashboard**: Completely redesigned. Features a "My Goal Sheet" table, live weightage tracking (must be exactly 100%), and clear banners for RETURNED or APPROVED states.
- **Goal Form**: Built as a modal `GoalFormModal.jsx` within the dashboard. Validates min 10% weightage and max 8 goals.
- **Goal Submission**: The entire goal sheet is submitted at once with server-side validation.
- **Manager Dashboard**: Features a 4-card stat overview, Team Member Cards showing progress bars, and a Pending Approvals tab.
- **Manager Approvals**: `ApproveGoals.jsx` provides inline editing of target/weightage, with a live weightage calculator, and ability to return goals with a mandatory manager comment.
- **Quarterly Check-ins**: Employees update progress via `CheckInModal.jsx`. Score dynamically generated. Managers review and add comments via `ManagerCheckIn.jsx`.
- **Admin Dashboard**: Separated into 5 distinct tab views: Overview, Users, Cycles, Reports, and Audit Log. Uses sub-components for clean architecture.

## 5. Database Schema
Defined in `server/prisma/schema.prisma`.
- **User**: Stores credentials, role (`EMPLOYEE`, `MANAGER`, `ADMIN`), and manager self-relation (`managerId`).
- **Goal**: Links to a `User` (owner) and a `Cycle`. Stores target, weightage, UoM, and status. Indexes on `[ownerId, cycleId]`.
- **Cycle**: Represents a goal-setting year (e.g., FY 25-26). Defines open/close dates for goal setting.
- **Quarter**: Belongs to a cycle. Defines `windowOpen` and `windowClose` for check-ins.
- **QuarterlyData**: Links a `Goal` to a `Quarter`. Stores `actual`, `progressStatus`, and `score`. Indexes on `[goalId, quarterId]`.
- **CheckIn**: Links to `QuarterlyData` and stores the manager's comment.
- **SharedGoalRecipient**: Maps a duplicated shared goal to its recipients.
- **AuditLog**: Records critical state changes (locking, unlocking, returning) for accountability.

## 6. API Reference
- `POST /api/auth/login`: Accepts `email`, `password`. Sets httpOnly cookies.
- `GET /api/auth/me`: Validates access token, returns user profile.
- `GET /api/goals?cycleId=...`: Returns goals for the user (or team if manager).
- `POST /api/goals`: Creates goal. Body: `cycleId, title, uom, target, weightage...`
- `PATCH /api/goals/:id`: Updates a goal.
- `POST /api/goals/:id/submit`: Submits all draft/returned goals for a cycle.
- `POST /api/goals/:id/approve` & `/return` & `/unlock`: State change actions.
- `POST /api/checkins`: Logs actuals and completion dates.
- `GET /api/checkins/my/:quarterId`: Fetches own check-in data.
- `GET /api/cycles/active`: Returns currently active cycle and open quarter.
- `GET /api/reports/achievement/export`: Streams Excel report blob.

## 7. Validation Rules
- **Total Weightage**: Must equal exactly 100% at submission. Enforced in `submitGoalSheet` (Server).
- **Goal Weightage Limits**: Min 10%. Max 8 goals. Enforced in `createGoal` (Server) and Zod schema (Client).
- **Locking**: Only DRAFT goals can be edited by Employee. APPROVED goals are locked.
- **Windows**: `createCheckIn` verifies `windowOpen <= now <= windowClose` and returns a 403 error specifying the next window date if closed.

## 8. Score Computation Logic
Found in `server/src/utils/scoreCalculator.js`. Called server-side exclusively.
- **NUMERIC_MIN** (Higher is better): `(actual / target)`, capped at 1.5.
- **NUMERIC_MAX** (Lower is better): `(target / actual)`, capped at 1.5.
- **TIMELINE**: If `completionDate <= deadline`, score = 1.0. Otherwise, score decreases by `1/30` per day late, min 0.
- **ZERO**: `1.0` if actual is 0, else `0.0`.

## 9. Quarterly Window System
Check-ins can only happen during specific dates (`windowOpen` to `windowClose`). The server queries `getActiveQuarter()` which checks if `now` is within these dates.

## 10. Shared Goals Mechanism
- **Push**: Admins/Managers can call `pushSharedGoal` to replicate a goal across multiple users, linking them via `sharedGroupId`.
- **Sync**: Calling `syncAchievement` replicates the quarterly progress from the primary source goal to all linked recipients.

## 11. UI Appearance & Design System
- **Colors**: Primary is Indigo-600. Success is Green-600. Warnings are Amber-600. Page background is off-white `#F9FAFB`.
- **Components**: Used a mix of Tailwind and Lucide icons. Banners are heavily utilized to display goal status (Approved/Returned).
- **Forms & Inputs**: Clean inputs with gray borders, transitioning to indigo focus rings.
- **Layout**: Fixed 240px persistent white sidebar navigation on the left, top header with user context, and a main content area with a 1200px max-width layout.
- **Login Page**: Split screen with a premium indigo gradient and tagline on the left, and a white card with demo credentials on the right.
- **Feedback**: Skeleton loaders during data fetch, SVG empty states, and react-hot-toast for immediate API feedback.

## 12. Demo Credentials
- Admin: `admin@company.com` / `Admin@123`
- Manager: `manager@company.com` / `Manager@123`
- Employee: `employee@company.com` / `Employee@123`

## 13. Setup Instructions
1. Navigate to the root directory.
2. Install dependencies: `npm install && cd server && npm install && cd ../client && npm install`
3. Configure `.env` in `server/` with a valid PostgreSQL `DATABASE_URL` and `JWT_SECRET`.
4. Run migrations: `cd server && npx prisma migrate dev`
5. Seed database: `cd server && npx prisma db seed`
6. Run the application: From root, run `npm run dev` to start both client and server concurrently.

## 14. Known Limitations / Out of Scope
- Dynamic weightage recalculation when shared goals are pushed.
- Real-time websockets or email notifications (toast notifications are used).
- Full user profile / avatar upload features.

## 15. API Efficiency Decisions
- **Server-Side Filtering**: Endpoints like `getGoals` heavily utilize Prisma's `where` clause rather than array mapping.
- **Prisma Selection**: Used nested `select` limits to prevent N+1 queries and over-fetching user hashes.
- **React Query Caching**: Stale time set to `5 minutes` to reduce redundant fetches of cycles and standard data. Queries invalidated efficiently.
- **Server-Side Scoring**: Ensures calculations are untampered by the client and centralized.
