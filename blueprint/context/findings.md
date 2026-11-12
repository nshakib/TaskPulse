# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] fixed - Non-syntax body-parser errors return 500 instead of a 4xx

**File:** src/middleware/error-handler.ts:18
**Found:** 2026-11-11 by /audit independent current (scope: current; lens: quality, security)
**Why it matters:** `express.json()` (body-parser 2.4.0 with raw-body) reports client body problems as `http-errors` objects that are not `SyntaxError`. An oversized body raises a 413 `entity.too.large` error (node_modules/raw-body/index.js:163), and an unsupported charset or content encoding raises 415. The handler only special-cases `SyntaxError` with `status === 400`, so these fall through to the generic branch at lines 23-24: it logs a stack trace and answers `500 Internal server error` for what is a client error. The new endpoint reaches this today with a `POST /api/v1/auth/register` body larger than the 100 kb `express.json()` default.
**Suggested fix:** Before the 500 fallback, treat any non-AppError carrying a numeric `status` or `statusCode` in the 400-499 range as a client error and respond with that status plus a short fixed message that does not echo internal detail; keep the generic 500 for everything else. No current requirement is lost.
**Resolution:** 2026-11-11 by /implement repair pass: `src/middleware/error-handler.ts` maps any non-AppError error with numeric `status` 400-499 to that status with a short fixed message (413 "Request body too large", 415 "Unsupported content type or encoding", otherwise "Invalid request"). Verified live: a 200 KB body returns `413 Request body too large`, not `500`.

### F-02 [P3] open - Node runtime floor for `process.loadEnvFile` is undocumented

**File:** src/config/env.ts:1
**Found:** 2026-11-11 by /audit independent current (scope: current; lens: quality)
**Why it matters:** `loadEnvFile` was added to `node:process` in Node 20.12. On an older runtime the named import fails while the module is being linked, so the process dies with a module export error before the intended fail-fast configuration message can run. Neither README.md setup nor package.json states a Node version, so a user or a host with an older default Node cannot tell why startup fails.
**Suggested fix:** Add `"engines": { "node": ">=20.12" }` to package.json or state the Node requirement in the README setup section. No current requirement is lost.
**Resolution:**

### F-03 [P3] open - `JWT_EXPIRES_IN` shape is not validated at startup

**File:** src/config/env.ts:15
**Found:** 2026-11-11 by /audit independent current (scope: current; lens: quality)
**Why it matters:** The schema only requires a non-empty string. `jsonwebtoken` rejects a value `ms()` cannot parse (for example `1hour`) and `signAccessToken` throws. That throw happens in `registerUser` after `prisma.user.create` has committed, so the account row exists, the client receives `500`, and a retry receives `409` for an account whose token was never returned. The spec's fail-fast requirement covers a missing variable, so this is a robustness gap rather than a spec violation.
**Suggested fix:** Validate `JWT_EXPIRES_IN` in `envSchema` with a duration shape (an integer or a value such as `1h`, `30m`, `7d`) so a malformed value fails startup with the existing clear message. No current requirement is lost.
**Resolution:**

### F-04 [P2] fixed - Password composition check accepts only ASCII letters and digits

**File:** src/modules/auth/auth.schema.ts:19
**Found:** 2026-11-11 by /audit (scope: current; lens: quality, security)
**Why it matters:** The password rules use `/[A-Za-z]/` and `/[0-9]/`, so letters or digits outside ASCII are not recognized. The spec requires "at least one letter and one digit" with no script restriction. Verified against the compiled schema: `пароль123` is rejected with "Password must contain at least one letter", and `password١٢٣` is rejected with "Password must contain at least one number". Users with non-Latin passwords cannot register with an otherwise valid password.
**Suggested fix:** Use Unicode property escapes: `/\p{L}/u` for the letter check and `/\p{N}/u` (or `/\d/u`) for the digit check. Add a validation test when the test runner exists.
**Resolution:** 2026-11-11 by /implement repair pass: `src/modules/auth/auth.schema.ts` now uses `/\p{L}/u` and `/\p{N}/u`. Verified live: `пароль123` registers with `201` and a token.

### F-05 [P3] open - 72-character password cap does not enforce bcrypt's 72-byte limit

**File:** src/modules/auth/auth.schema.ts:18
**Found:** 2026-11-11 by /audit (scope: current; lens: security, quality)
**Why it matters:** `.max(72)` counts UTF-16 code units, while bcrypt truncates its input at 72 bytes. A password of 30 emoji plus `a1` is 32 characters and 122 UTF-8 bytes; it passes validation, but only the first 72 bytes are hashed. Two passwords that share those first 72 bytes would be equivalent for login. The spec's own rationale is the bcrypt byte limit, so the byte contract is not implemented. Login is not built yet, but the stored credential format is already affected.
**Suggested fix:** Replace the character cap with a `refine` that checks `Buffer.byteLength(password, "utf8") <= 72`, with a message stating the byte limit. Add a validation test when the test runner exists.
**Resolution:**

### F-06 [P2] fixed - JWT secret strength is enforced nowhere, and the local secret was short

**File:** src/config/env.ts:14
**Found:** 2026-11-11 by /audit current second pass (scope: current; lens: security) as A-02, report-only
**Why it matters:** `JWT_SECRET` only required a non-empty string, so any short value was accepted. The local `.env` secret was measured at 15 characters. Once Feature 2 adds token verification, a weak secret becomes a token-forgery surface.
**Suggested fix:** Require at least 32 characters at startup, rotate the local secret, and document the minimum and generation (`openssl rand -base64 48`).
**Resolution:** 2026-11-11 by /implement repair pass: `src/config/env.ts` now enforces `min(32)`; the untracked `.env` secret was rotated to a 64-character random value (never printed); `.env.example` and the README document the minimum and generation. Verified live: startup with a 5-character `JWT_SECRET` exits with `JWT_SECRET: JWT_SECRET must be at least 32 characters`.

### F-07 [P2] fixed - Auth rate limiter is mounted after the JSON parser

**File:** src/app.ts:13,31
**Found:** 2026-11-11 by /audit current second pass (scope: current; lens: security) as A-04, report-only
**Why it matters:** `express.json()` ran before the limiter, so malformed or oversized auth requests threw during parsing and never incremented the limit. An unauthenticated client could send unlimited auth-path bodies, bypassing the 10-per-15-minute window.
**Suggested fix:** Mount `authRateLimiter` on `/api/v1/auth` before `express.json()`.
**Resolution:** 2026-11-11 by /implement repair pass: `src/app.ts` mounts the limiter before the JSON parser. Verified live: a sequence of malformed-JSON auth requests returned `400` for the first 8 and `429` for requests 11 and 12 in the same window, proving they count toward the limit.
