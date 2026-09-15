import { z } from "zod";

const envSchema = z.object({
  APP_PIN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at runtime.
 * Returns undefined if validation fails (for build-time when env vars may not be set).
 */
export const getEnv = (): Env | undefined => {
  const result = envSchema.safeParse({
    APP_PIN: process.env.APP_PIN,
  });

  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Missing auth environment variables:", result.error.format());
    }
    return undefined;
  }

  return result.data;
};

/**
 * Throws if env vars are not configured - use in runtime code that requires auth.
 */
export const requireEnv = (): Env => {
  const env = getEnv();
  if (!env) {
    throw new Error("Missing required environment variable: APP_PIN");
  }
  return env;
};
