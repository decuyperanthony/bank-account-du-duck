import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at runtime.
 * Returns undefined if validation fails (for build-time when env vars may not be set).
 */
export const getEnv = (): Env | undefined => {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Missing Supabase environment variables:", result.error.format());
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
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return env;
};
