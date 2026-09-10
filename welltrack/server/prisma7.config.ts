import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. CI/prod) — real env vars are expected to be injected already.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
