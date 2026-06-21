# MATS2004 Practice App

Public practice app for MATS2004 tutorial questions.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Set:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`

Generate question images and seed data:

```bash
pnpm run extract:pdf
pnpm run build:seed
```

Run database migration and seed:

```bash
pnpm run db:migrate
pnpm run db:seed
```

Start the app:

```bash
pnpm run dev
```

Public app:

```text
http://127.0.0.1:3000
```

Admin app:

```text
http://127.0.0.1:3000/admin
```
