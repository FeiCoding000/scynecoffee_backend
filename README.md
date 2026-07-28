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

## Development

```bash
npm run start:dev
```

Default server URL:

```txt
http://localhost:3000
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

```bash
npm run build
npm run start:prod
```

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

Or use Docker Compose:

```bash
docker compose up --build
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
npm run lint        Run ESLint
npm run format      Format source files
```
