# Development Guide

## Local Database Setup

Start the local PostgreSQL container:

```bash
docker compose up -d postgres
```

Apply existing Prisma migrations:

```bash
npm run prisma:migrate
```

This reads migration files from:

```txt
prisma/schema/migrations/
```

and records applied migrations in the database table:

```txt
_prisma_migrations
```

Do not use `--name init` for normal local setup. A named migration should only be created after changing the Prisma schema.

## Local Seed Data

For local development/testing, seed activation codes:

```bash
npm run prisma:seed
```

The seed script creates random activation codes in this format:

```txt
AA0000
```

That means two uppercase letters followed by four digits, for example:

```txt
XH2593
VS8382
WG3423
```

The local seed target is 200 activation codes. Re-running the seed script will not keep adding unlimited codes; it only fills missing codes up to the target count.

## Production Rule

Do not run the local seed script automatically in production deployments.

Production deployments should apply existing migrations only:

```bash
npx prisma migrate deploy --schema prisma/schema
```

For Docker Compose deployments, use the `migrate` service. It is built from the Dockerfile `migration` target, includes the locked Prisma CLI and `prisma/schema` migration files, and runs before the API service starts:

```bash
docker compose up --build
```

Activation codes are business credentials. In production, they should be generated through a controlled admin/service flow, not through automatic deployment seed data.

## When to Create a Migration

Create a new named migration only when the Prisma schema changes:

```bash
npm run prisma:migrate -- --name add_some_feature
```

Examples:

```bash
npm run prisma:migrate -- --name add_order_table
npm run prisma:migrate -- --name add_user_avatar
```

If only application code changes and the database schema does not change, do not create a migration.
