# Feature: User Registration

**From build-plan:** feature 1
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/user-registration`

## Goal

Let a new user create an account with name, email, and password, and receive a JWT access token immediately. Registration must reject invalid input, prevent duplicate emails, and store only a bcrypt hash of the password.

## In scope

- `POST /api/v1/auth/register` with the request and response contract below.
- PostgreSQL `User` table via Prisma, with a case-normalized unique email.
- Zod request validation: name, email, password.
- Password hashing with bcrypt before persistence.
- HS256 JWT access token issued in the registration response.
- Duplicate email handling through the unique constraint, mapped to `409`.
- Minimal app foundation required by this endpoint: typed environment config, Prisma client singleton, centralized error handler, JSON 404 handler, Helmet, CORS from `CORS_ORIGIN`, and a rate limiter on `/api/v1/auth`.
- `.env.example` and README setup notes for migrations and running the API.

## Out of scope

- Login, refresh tokens, logout, password reset, email verification.
- Authentication middleware for protected routes (Feature 2). Registration is public.
- Profile read/update (Feature 3), todos (Features 4-10).
- Swagger docs and changing the health path to `/api/v1/health` (Feature 11). Keep the existing `GET /health`.
- Automated unit and integration tests (Feature 12). No test runner is configured yet.

## Build loop

- `workflow.stepReview` is `feature`: finish all steps, then present one review packet.
- `workflow.checkpointCommits` is `disabled`: no checkpoint commits; `/complete` makes the final feature commit.
- Never implement beyond this spec. Stop and ask if a step needs a product decision that is not recorded here.

## Build steps

- [x] **Step 1 - Add dependencies, env config, and the User model** - Install runtime deps (`@prisma/client`, `zod`, `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`) and dev deps (`prisma`, `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/cors`). Add `prisma/schema.prisma` with a PostgreSQL datasource and the `User` model. Add `src/config/env.ts` (Zod-validated `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, optional `CORS_ORIGIN`), `src/lib/prisma.ts` singleton, `.env.example`, and `db:migrate` / `db:deploy` scripts. *Done when:* `npx prisma migrate dev --name add-user` applies against the provided database, `npm run typecheck` passes, `.env` stays untracked, and `.env.example` lists every variable.

- [x] **Step 2 - Add password and token primitives** - Add `src/lib/password.ts` with `hashPassword` (bcryptjs, cost factor 12) and `src/lib/jwt.ts` with `signAccessToken` (HS256, `sub` = user id, `email` claim, expiry from `JWT_EXPIRES_IN`). Add `src/errors/app-error.ts` with an `AppError` carrying status, message, and optional field errors. *Done when:* `npm run typecheck` and `npm run build` pass, and no password value is logged or included in any helper return type.

- [x] **Step 3 - Build the registration domain path** - Add the Zod schema for the register body (name 1-100 after trim; email trimmed, lowercased, max 254, valid format; password 8-72 characters with at least one letter and one digit). Add `auth.service.ts` that normalizes the email, hashes the password, creates the user, maps Prisma `P2002` to `AppError(409)`, signs the access token, and returns only public user fields plus the token. *Done when:* `npm run typecheck` passes and the service never returns `password`.

- [x] **Step 4 - Expose the HTTP endpoint** - Split the app from the listener (`src/app.ts`, `src/server.ts`). Add the auth controller, route, validate middleware, centralized error handler, and JSON 404 handler. Mount routes under `/api/v1`, keep `GET /health` unchanged, enable Helmet, configure CORS from `CORS_ORIGIN` (comma-separated list; no CORS headers when unset), set `trust proxy` to 1, and apply the auth rate limiter (10 requests per 15 minutes per IP) to `/api/v1/auth`. *Done when:* against the provided database, `curl` shows `201` with token and public user, `400` with field errors for bad input, `409` for a duplicate email, and `429` on the 11th request in the window; unknown routes return JSON `404`; `/health` still returns `200`; the created row stores a bcrypt hash, not the password; `npm run typecheck` and `npm run build` pass.

- [x] **Step 5 - Document setup and verify end to end** - Update `README.md` with required env vars, migration commands, and run commands. Re-run the full registration flow from a fresh `.env` against the provided database. *Done when:* following the README from this checkout starts the API, applies migrations, and completes registration, duplicate-email, and validation checks; `npm run build` passes.

- [x] **Step 6 - Repair important audit findings (repair pass)** - Fix the four Important findings from the audit: (A-01/F-04) password composition regexes use Unicode property escapes `/\p{L}/u` and `/\p{N}/u` so non-Latin letters and digits count; (A-02) `JWT_SECRET` requires at least 32 characters at startup, the local `.env` secret is rotated, and the README/`.env.example` document the minimum and generation; (A-03/F-01) the error handler maps non-`AppError` body-parser client errors (`http-errors` with status 400-499, e.g. 413 oversized, 415 unsupported) to their status with a short fixed message instead of 500; (A-04) the `/api/v1/auth` rate limiter is mounted before `express.json()` so malformed and oversized bodies count toward the limit. *Done when:* the compiled schema accepts `пароль123` and `password١٢٣`; a short `JWT_SECRET` fails startup with a clear message; an oversized body returns `413` (not `500`); malformed JSON requests count toward the rate limit and eventually return `429`; `npm run typecheck` and `npm run build` pass.

## Files / areas

- `package.json`, `package-lock.json` - dependencies and scripts.
- `prisma/schema.prisma`, `prisma/migrations/**` - datasource and `User` model.
- `src/config/env.ts` - environment parsing.
- `src/lib/prisma.ts`, `src/lib/password.ts`, `src/lib/jwt.ts` - shared primitives.
- `src/errors/app-error.ts` - typed application error.
- `src/modules/auth/auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts` - registration slice.
- `src/middleware/validate.ts`, `src/middleware/error-handler.ts`, `src/middleware/rate-limit.ts` - request pipeline.
- `src/app.ts`, `src/server.ts` - app wiring and listener.
- `.env.example`, `README.md` - configuration and setup documentation.

## Data / contracts

### User model

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- `email` is stored trimmed and lowercased before insert; the unique index enforces duplicate prevention, including concurrent requests.
- `password` stores only the bcrypt hash. It is never selected into a response.
- No `Todo` relation yet; Feature 4 adds it.

### Endpoint

`POST /api/v1/auth/register` (public)

Request body:

```json
{ "name": "Ada Lovelace", "email": "Ada@Example.com", "password": "secret123" }
```

Success `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt"
  }
}
```

Errors:

- `400` validation: `{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "..." }] }`
- `409` duplicate: `{ "success": false, "message": "Email is already registered" }`
- `429` rate limited: `{ "success": false, "message": "Too many requests, try again later" }`
- `500` unexpected: `{ "success": false, "message": "Internal server error" }` with no stack trace or internal detail.

### Environment

- Required: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (for example `1h`).
- Optional: `PORT` (default 3000), `NODE_ENV` (default `development`), `CORS_ORIGIN` (comma-separated allowlist).
- Startup fails fast with a clear message when a required variable is missing.

### Security

- Bcrypt cost factor 12; password length capped at 72 characters because bcrypt truncates beyond that.
- JWT signed with `JWT_SECRET`; the token contains only `sub`, `email`, `iat`, and `exp`.
- Rate limiting applies to the whole `/api/v1/auth` namespace so Feature 2's login inherits it.
- Error responses and logs never include password values, hashes, or JWT secrets.

## Testing

- No test command is configured in `AGENTS.md`, so no automated test gate applies here; Feature 12 owns the suite. Do not install a runner in this feature.
- Verify with `npm run typecheck`, `npm run build`, and live HTTP calls against the provided PostgreSQL database:
  - valid registration returns `201`, a token, public user fields, and no password;
  - missing or malformed fields return `400` with per-field messages;
  - a duplicate email (including different casing) returns `409`;
  - the 11th request inside 15 minutes returns `429`;
  - the database row contains a bcrypt hash.
- Record the exact commands and observed status codes in the review packet.

## Notes for AI

- Use npm, not Bun. The repository has `package-lock.json` and npm scripts.
- TypeScript is `NodeNext` with `"type": "module"`, so relative imports need `.js` extensions.
- Express 5 forwards rejected async handlers to the error middleware; still call `next(error)` explicitly where a handler is not async.
- Follow `blueprint/project-plan.md` over the untuned Next.js, Clerk, and Server Action guidance in `coding-standards.md`.
- Registration returns a token, so Feature 2 is reduced to login and auth middleware. Do not add login or protected routes now.
- `DATABASE_URL` is a user prerequisite. If it is absent or unreachable, stop and ask instead of switching databases.
- Do not add refresh tokens, email verification, Swagger, or todo models.

## Open questions

None. The remaining plan gaps are recorded for review: centralized error handling and Helmet/CORS/rate limiting have no dedicated build-plan item, so their minimal versions land here; Feature 2 now covers login plus authentication middleware only.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10479,"specSha256":"683e265c15004c4b3bf52a4f7b0171d881d91fc53dd75c364b6ce6a7c5f2427f","branch":"refs/heads/feature/user-registration","head":"6b9b2b6d028d50caf0873d2abfca274a43f4c941","baseRef":"refs/heads/main","baseCommit":"a21b2397cc4e089ca1f8d4dec02d0b59364b7dfe","sourceTree":"2d19b7b6647da05f4f729ad1cc9610e2f27eb7b1","landing":"local-merge","absentOptional":[]} -->

**Status:** passed
**Target commit:** 6b9b2b6d028d50caf0873d2abfca274a43f4c941
**Base commit:** a21b2397cc4e089ca1f8d4dec02d0b59364b7dfe
**Base ref:** main
**Spec hash:** 683e265c15004c4b3bf52a4f7b0171d881d91fc53dd75c364b6ce6a7c5f2427f
**Prepared by:** opencode
**Builder model:** GLM-5.3-Flash Free
**Requested reviewer:** opencode
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-11-12T13:47:11+06:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** opencode
**Reviewer model:** GLM-5.3-Flash Free
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-12T13:50:43+06:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npm run typecheck`: pass
- `npm run build`: pass

## Evidence

- Phase B preconditions verified: `HEAD` = 6b9b2b6d028d50caf0873d2abfca274a43f4c941, `git merge-base main HEAD` = a21b2397cc4e089ca1f8d4dec02d0b59364b7dfe, SHA-256 of `blueprint/context/current-feature.md` = 683e265c15004c4b3bf52a4f7b0171d881d91fc53dd75c364b6ce6a7c5f2427f; only dirty path before this pass was `blueprint/context/review.md`.
- Reviewed the complete `a21b2397..6b9b2b6` delta (24 files): all four auth-slice files, `src/app.ts`, `src/config/env.ts`, `src/lib/{jwt,password,prisma}.ts`, `src/errors/app-error.ts`, `src/middleware/{validate,error-handler,rate-limit}.ts`, `src/server.ts`, `prisma/schema.prisma` + `20261111094552_add_user/migration.sql`, `package.json`, `.env.example`, README env table, spec, findings ledger, project overview (targeted), coding standards (targeted), AGENTS.md.
- Repair verification (ledger marked `fixed`, re-examined fresh): F-01 → `src/middleware/error-handler.ts:28-35` maps non-AppError 400-499 statuses to fixed messages; F-04 → `src/modules/auth/auth.schema.ts:19-20` uses `/\p{L}/u` and `/\p{N}/u`; F-06 → `src/config/env.ts:14-16` enforces `JWT_SECRET` `min(32)`, README:21 and `.env.example` document the minimum and generation; F-07 → `src/app.ts:16-17` mounts the auth limiter before `express.json()`. All four repairs are genuinely in the target code and none introduced a new defect.
- Security review of the new surface: bcrypt-only password storage (`src/modules/auth/auth.service.ts:13-22` selects public fields only), 409 via Prisma `P2002` mapping, rate limiter on the whole `/api/v1/auth` namespace with standard headers, Helmet enabled, CORS only from an explicit `CORS_ORIGIN` allowlist, no secrets or password values in any response or log path, `.env` ignored and untracked.
- Performance: single `prisma.user.create` per request, no N+1 or unbounded work; the only hot-path cost is intentional bcrypt cost 12 per spec.
- Tests: no test runner is configured (spec explicitly defers the suite to Feature 12); no skipped, focused, or placeholder tests exist.

## Findings

- None recorded this pass. Existing ledger entries re-examined and left unchanged: F-01, F-04, F-06, F-07 remain `fixed` with repairs verified in code; F-02, F-03, F-05 remain `open` at P3.

## Remaining risk

- No test command is configured (`npm test` is the placeholder), so no automated test signal exists for this delta; Feature 12 owns the suite per the spec.
- Check was not required and was not run; live HTTP/database behavior was verified by the builder separately and was not re-proved by this reviewer.
- `trust proxy` is hard-coded to 1 (`src/app.ts:11`): when the app is exposed without a reverse proxy, a direct client can spoof `X-Forwarded-For` to rotate rate-limit keys. Spec-mandated value; revisit at deployment hardening.
- `JWT_EXPIRES_IN` accepts any non-empty string and fails at token-sign time rather than startup (tracked as open F-03).
- Node runtime floor for `process.loadEnvFile` is undocumented (tracked as open F-02).

## Findings at completion

No findings were resolved at completion. The ledger entries below remain in
`blueprint/context/findings.md` for later re-review and are not archived here:

- `1/F-01`, `1/F-04`, `1/F-06`, `1/F-07` - `fixed` (P2), repairs verified live and by fresh independent review.
- `1/F-02`, `1/F-03`, `1/F-05` - `open` (P3), deferred.

## Try it now

Run or do:

```powershell
npm run dev
```

In a second terminal, verify the repaired behavior:

```powershell
curl.exe -i -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Repair Check\",\"email\":\"repair.check@example.com\",\"password\":\"пароль123\"}'
```

Expected: `201 Created` with the user and an access token. This password was
rejected before the repair pass; Unicode letters and digits now count. A short
`JWT_SECRET` (under 32 characters) in `.env` blocks startup instead of starting
silently, and a body over 100 KB returns `413` rather than `500`.
