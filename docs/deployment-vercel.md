# Vercel Deployment

## Required Environment Variables

- `DATABASE_URL`: PostgreSQL-compatible connection string from Vercel Postgres or Neon.
- `ADMIN_PASSWORD`: password used to enter `/admin`.
- `ADMIN_SESSION_SECRET`: at least 32 random characters.
- `NEXT_PUBLIC_APP_URL`: deployed site URL, for example `https://mats2004-practice.vercel.app`.

## Deployment Steps

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Create or attach a PostgreSQL database, such as Neon or Vercel Postgres.
4. Add the required environment variables in Vercel.
5. Run the Prisma migration against the production database:

```bash
pnpm prisma migrate deploy
```

6. Seed production data:

```bash
pnpm prisma db seed
```

7. Open the public Vercel URL for practice.
8. Open `/admin` and log in with `ADMIN_PASSWORD`.

## Notes

Question images are stored in `public/questions/` and are deployed as static assets.

The app records anonymous aggregate attempts only. It does not collect names, student IDs, emails, or accounts.
