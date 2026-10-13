// Build entry point used by Vercel (`npm run vercel-build`).
// Resolves the database connection from whichever Postgres integration is connected
// (Neon, Vercel Postgres, Supabase, …), prepares the schema, seeds an empty database,
// then builds the app.
import { execSync } from "node:child_process";

// Local runs: also read .env (Vercel injects its variables directly).
try {
  process.loadEnvFile?.(".env");
} catch {}

const env = { ...process.env };
const pick = (...names) => names.map((n) => env[n]).find((v) => v && /^postgres(ql)?:\/\//.test(v));

env.DATABASE_URL = pick("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
env.DATABASE_URL_UNPOOLED = pick("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL");

if (!env.DATABASE_URL) {
  console.error(`
──────────────────────────────────────────────────────────────────────
 CELESTIA: no database is connected to this project yet.

 In Vercel open your project → Storage → Create Database → Neon,
 connect it to the project, then Deployments → ⋯ → Redeploy.
──────────────────────────────────────────────────────────────────────
`);
  process.exit(1);
}
if (!env.ADMIN_PASSWORD) {
  console.warn("CELESTIA: ADMIN_PASSWORD is not set — the admin account will not be created. Add it in Settings → Environment Variables.");
}

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
run("prisma generate");
run("prisma db push --skip-generate");
run("tsx prisma/seed.ts --if-empty");
run("next build");
