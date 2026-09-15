"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";

const GENERIC_ERROR_MESSAGE = "Une erreur est survenue. Réessayez.";

const LoginPage = () => {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? GENERIC_ERROR_MESSAGE);
        setIsLoading(false);
        return;
      }
    } catch (caught) {
      console.error("Sign in failed:", caught);
      setError(GENERIC_ERROR_MESSAGE);
      setIsLoading(false);
      return;
    }

    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="loginGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#D97757" />
                  <stop offset="100%" stopColor="#E8956F" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="96" fill="url(#loginGrad)" />
              <g transform="translate(56, 80)">
                <ellipse cx="200" cy="280" rx="160" ry="100" fill="white" />
                <circle cx="320" cy="180" r="80" fill="white" />
                <path
                  d="M380 180 L440 165 L440 195 L380 180 Z"
                  fill="#fbbf24"
                />
                <circle cx="350" cy="165" r="12" fill="#0f172a" />
                <path
                  d="M80 260 Q140 200 200 260 Q140 240 80 260 Z"
                  fill="#e2e8f0"
                />
              </g>
            </svg>
          </div>
          <CardTitle className="text-2xl">Bank Account du Duck</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="pin" className="text-sm font-medium">
                Code PIN
              </label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="current-password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
                className="text-center tracking-[0.5em] text-lg"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default LoginPage;
