# Todo API

A small REST API built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

Currently exposes a health check and user registration. Todo endpoints, login, and
authentication for protected routes are planned.

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `DATABASE_URL` | yes | PostgreSQL connection string |
   | `JWT_SECRET` | yes | Secret used to sign access tokens; at least 32 characters. Generate one with `openssl rand -base64 48` |
   | `JWT_EXPIRES_IN` | yes | Token lifetime, for example `1h` |
   | `PORT` | no | Server port, default `3000` |
   | `NODE_ENV` | no | Default `development` |
   | `CORS_ORIGIN` | no | Comma-separated allowed origins; no CORS headers when empty |

3. Apply migrations:

   ```powershell
   npm run db:migrate
   ```

4. Start the dev server:

   ```powershell
   npm run dev
   ```

## Scripts

- `npm run dev` - dev server with watch mode
- `npm run typecheck` - type check without emitting
- `npm run build` - compile to `dist/`
- `npm start` - run the built server
- `npm run db:migrate` - create and apply migrations in development
- `npm run db:deploy` - apply pending migrations in production

## Endpoints

### `GET /health`

Returns `200` with `{ "status": "ok", "service": "todo-api" }`.

### `POST /api/v1/auth/register`

Public. Creates a user and returns a JWT access token.

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123"
}
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

- `400` invalid input, with `errors` listing each field
- `409` email already registered
- `429` rate limited (10 requests per 15 minutes per IP)
