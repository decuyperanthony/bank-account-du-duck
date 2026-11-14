import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit ne lit pas les fichiers .env comme Next : on charge .env.local puis .env
// (les variables déjà définies dans le terminal restent prioritaires)
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
