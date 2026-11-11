# Todo App Backend - Project Overview

<!-- blueprint:source-hash 3e23f3f6b3df1a9ab00bb3a9f3391d7f9695413c44ebb000797877e0e9262df7 -->

> Secure, maintainable REST API for managing personal todos with JWT authentication and per-user ownership.

## Problem

People need a simple, reliable way to organize daily tasks, track progress, and manage personal work. This project delivers a backend-only Todo API that lets users create, organize, update, complete, and delete their tasks, while demonstrating secure authentication and maintainable modular architecture.

## Users

- **Individuals** - manage personal tasks and daily activities.
- **Students** - organize assignments and study schedules.
- **Professionals** - manage personal work and responsibilities.
- **Developers** - integrate todo functionality into frontend clients via the API.

Every user manages their own tasks. Access is scoped per registered user; no anonymous or shared access tier exists.

## Usage model

- Backend-only REST API, internet-facing after deployment.
- Multiple registered users; authentication required for protected endpoints.
- Each user may only read or modify their own todos; ownership is enforced server-side, including against ID tampering.
- Passwords hashed before storage; secrets supplied through environment variables.
- Request bodies and query parameters validated; auth endpoints rate limited.
- Production errors must not expose stack traces or internal details.
- Database relationships and constraints maintain data integrity.
- Explicit exclusions: frontend app, social/sharing, team collaboration, real-time notifications, file uploads, payments, AI features, microservices.

## Features

In build order (from `build-plan.md`):

1. **User Registration** - register with name, email, password; validation, duplicate email prevention, password hashing.
2. **User Authentication** - email/password login, JWT access tokens, auth middleware for protected routes.
3. **User Profile Management** - read and update the authenticated user's profile with ownership protection.
4. **Todo Creation** - create todos with title, description, priority, optional due date, owned by the authenticated user.
5. **Todo Retrieval** - fetch one todo and list only the authenticated user's todos.
6. **Todo Updating** - update title, description, priority, due date; ownership verified.
7. **Todo Status Management** - mark todos completed or pending under defined business rules.
8. **Todo Deletion** - delete a todo after ownership verification.
9. **Todo Search and Filtering** - search by title; filter by status and priority.
10. **Todo Sorting and Pagination** - sort by creation date and due date; page-based pagination with metadata.
11. **API Documentation and Health Check** - Swagger/OpenAPI docs plus health endpoint.
12. **Automated Testing and Quality Assurance** - unit and integration tests for auth, authorization, todo operations, validation, and error handling.

## Data model

### User

- `id` (UUID) - primary key.
- `name` (string) - display name.
- `email` (string, unique) - login identifier.
- `password` (string) - bcrypt hash, never plaintext.
- `createdAt` (datetime), `updatedAt` (datetime).
- One-to-many with `Todo` (owner).

### Todo

- `id` (UUID) - primary key.
- `title` (string) - required.
- `description` (string, optional).
- `status` (enum: `PENDING` | `COMPLETED`) - defaults to `PENDING`.
- `priority` (enum: `LOW` | `MEDIUM` | `HIGH`).
- `dueDate` (datetime, optional).
- `userId` (UUID, foreign key -> `User.id`, indexed) - owner.
- `createdAt` (datetime), `updatedAt` (datetime).
- Indexes support retrieval by owner, status/priority filtering, title search, and sorting by `createdAt` / `dueDate`.

### Authentication

- JWT access tokens (`JWT_SECRET`, `JWT_EXPIRES_IN`).
- Refresh tokens only if refresh-token auth is explicitly approved into scope.

> Lock these shapes at Feature 1; later features (retrieval, search, sorting, pagination) depend on the enum values, ownership field, and timestamps.

## Tech stack

- **Node.js** - runtime.
- **Express.js** (v5 already scaffolded) - HTTP framework.
- **TypeScript** (strict) - application language.
- **PostgreSQL** - primary database.
- **Prisma ORM** - schema, migrations, queries.
- **JWT** - access-token authentication and authorization.
- **bcrypt** - password hashing.
- **Zod** - request validation schemas.
- **Helmet, CORS, rate limiting** - HTTP security hardening.
- **Swagger/OpenAPI** - API documentation.
- **ESLint + Prettier** - code quality and formatting.
- **Vitest or Jest** - automated tests (runner not yet chosen).
- **npm** - installed package manager (`package-lock.json` present).

Architecture: route -> controller -> service -> repository, centralized middleware and error handling, reusable validation schemas, environment-based configuration.

## Monetization

Not in v1. Educational/portfolio project. Freemium, premium features, team collaboration, and integrations are explicitly out of scope.

## UI/UX

Backend only; no frontend UI. API contract qualities:

- Consistent JSON envelope: `{ success, message, data }` (errors mirrored with failure status).
- Predictable HTTP status codes and descriptive error messages.
- RESTful, consistently named endpoints under `/api/v1/...`.
- Pagination metadata in list responses.
- Interactive Swagger UI documentation.
- Health check: `GET /api/v1/health`.

## Deployment

- **Host:** Render; **database:** Render PostgreSQL or another managed PostgreSQL.
- **Type:** Node.js REST API running compiled TypeScript output (`dist/`).
- **Build:** `bun run build` (plan) / existing `npm run build` = `tsc`.
- **Start:** `bun run start` (plan) / existing `npm run start` = `node dist/server.js`.
- **Migrations:** run during deployment.
- **Env vars:** `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`.
- **Health path:** `GET /api/v1/health`. HTTPS enabled. No workers or cron jobs.
- **Domain:** provider default initially; custom domain later.

## Open questions

> Gaps and contradictions found between the two plans. Resolve in the plans, then re-run `/overview`.

- Security hardening (Helmet, CORS, rate limiting on auth endpoints) and centralized error handling appear in `project-plan.md` sections 3 and 5 but have no dedicated build-plan feature. Decide whether they belong inside Feature 1/2 or get their own item.
- Package manager mismatch: the plan prefers Bun or npm "using the existing project configuration," and names `bun run build` / `bun run start`, while the repo is npm-based (`package-lock.json`, `npm run build`, `npm run start`). Confirm npm commands for deployment.
- Test runner is undecided (Vitest or Jest); `package.json` still has the placeholder test script.
- Prisma/PostgreSQL setup and the initial migration are not a build-plan item; assumed to land inside Feature 1.
