import { execFileSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set; skipping prisma migrate deploy and db seed.");
  process.exit(0);
}

execFileSync("pnpm", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
execFileSync("pnpm", ["prisma", "db", "seed"], { stdio: "inherit" });
