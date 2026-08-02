# ScyneCoffee Backend

NestJS backend service for ScyneCoffee.

## Tech Stack

- Node.js
- NestJS
- TypeScript
- Jest
- Docker

## Requirements

- Node.js 22+
- npm
- Docker / Docker Compose optional

## Install

```bash
npm install
```

## Development Documentation

See `docs/development.md` for local database setup, migration rules, seed data usage, and production deployment notes.

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Database Environment

For local development with Docker PostgreSQL, keep:

```env
DATABASE_URL="postgresql://scynecoffee:scynecoffee@localhost:5432/scynecoffee?schema=public"
```

Start the local database:

```bash
docker compose up -d postgres
```

Run existing Prisma migrations:

```bash
npm run prisma:migrate
```

Seed local development activation codes:

```bash
npm run prisma:seed
```

The seed script creates random activation codes using the format `AA0000` - two uppercase letters followed by four digits. It is intended for local development/testing only.

Do not use `--name init` for normal setup. Only create a named migration after changing the Prisma schema.

### Firebase Admin SDK Environment

The backend uses Firebase Admin SDK to verify Firebase Authentication ID tokens.

Do **not** use the frontend Firebase app config. The backend needs a Firebase **Service Account** private key.

To get the required values:

1. Open Firebase Console.
2. Select the ScyneCoffee Firebase project.
3. Go to **Project settings** using the gear icon.
4. Open the **Service accounts** tab.
5. Select **Firebase Admin SDK**.
6. Select **Node.js**.
7. Click **Generate new private key**.
8. Download the generated JSON file.

From the downloaded JSON, copy these fields into `.env`:

```json
{
  "project_id": "...",
  "client_email": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Set them in `.env`:

```env
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

Important notes:

- Keep `FIREBASE_PRIVATE_KEY` as one line in `.env`.
- Preserve the `\n` newline markers inside the private key.
- Never commit `.env` or the downloaded Firebase service account JSON file.

## Development

```bash
npm run start:dev
```

Default server URL:

```txt
http://localhost:3000
```

Swagger API documentation:

```txt
http://localhost:3000/api/docs
```

If port `3000` is already in use, start with another port:

```bash
PORT=3001 npm run start:dev
```

On Windows PowerShell:

```powershell
$env:PORT=3001; npm run start:dev
```

## Build

```bash
npm run build
```

## Production

Apply existing migrations before starting the API in production/deployment environments:

```bash
npx prisma migrate deploy --schema prisma/schema
```

Then build and start:

```bash
npm run build
npm run start:prod
```

For Docker Compose deployments, the `migrate` service runs the same locked Prisma CLI and migration files before the `api` service starts:

```bash
docker compose up --build
```

Do not run the local development seed script automatically in production. Activation codes are business credentials and should be generated through a controlled admin/service flow.

## Test

```bash
npm test
```

## Docker

Build image:

```bash
docker build -t scynecoffee-backend .
```

Run container:

```bash
docker run --rm -p 3000:3000 scynecoffee-backend
```

Or use Docker Compose to start all services. This starts PostgreSQL, runs the migration job, then starts the API:

```bash
docker compose up --build
```

Start only the database:

```bash
docker compose up -d postgres
```

Stop Compose services:

```bash
docker compose down
```

## Project Structure

```txt
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  infrastructure/
    database/
    firebase/
prisma/
  schema/
    schema.prisma
    models/
    migrations/
test/
  app.e2e-spec.ts
```

## Scripts

```txt
npm run start       Start app
npm run start:dev   Start app in watch mode
npm run build       Build production files
npm run start:prod  Run built app
npm test            Run unit tests
npm run test:e2e    Run e2e tests
npm run lint             Run ESLint
npm run format           Format source files
npm run prisma:generate  Generate Prisma Client
npm run prisma:migrate   Run Prisma migration in development
npm run prisma:studio    Open Prisma Studio
```
