"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const INVALID_LINK_MESSAGE =
  "Le lien de réinitialisation est invalide ou a expiré.";
const UNAVAILABLE_MESSAGE =
  "Le service d'authentification est injoignable. Réessayez dans quelques minutes.";

const ResetPasswordPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();

      // Supabase renvoie les paramètres soit en query string (flux PKCE et
      // token_hash), soit dans le fragment `#` (ancien flux implicite).
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const clearUrl = () => {
        window.history.replaceState(null, "", window.location.pathname);
      };

      const fail = (message: string) => {
        setError(message);
        setIsValidSession(false);
      };

      // 1. Supabase a refusé le lien (expiré, déjà utilisé...)
      const errorDescription =
        queryParams.get("error_description") ??
        hashParams.get("error_description") ??
        queryParams.get("error") ??
        hashParams.get("error");

      if (errorDescription) {
        clearUrl();
        fail(errorDescription);
        return;
      }

      try {
        // 2. Ancien flux implicite : tokens dans le fragment
        const accessToken = hashParams.get("access_token");
        if (accessToken && hashParams.get("type") === "recovery") {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") ?? "",
          });

          if (sessionError) {
            fail(INVALID_LINK_MESSAGE);
            return;
          }

          clearUrl();
          setIsValidSession(true);
          return;
        }

        // 3. Flux PKCE : `?code=...` à échanger contre une session
        const code = queryParams.get("code");
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            fail(INVALID_LINK_MESSAGE);
            return;
          }

          clearUrl();
          setIsValidSession(true);
          return;
        }

        // 4. Template email `{{ .TokenHash }}` : `?token_hash=...&type=recovery`
        const tokenHash = queryParams.get("token_hash");
        if (tokenHash) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });

          if (otpError) {
            fail(INVALID_LINK_MESSAGE);
            return;
          }

          clearUrl();
          setIsValidSession(true);
          return;
        }

        // 5. Sinon : l'utilisateur a-t-il déjà une session valide ?
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsValidSession(!!user);

        if (!user) {
          fail(
            "Aucune session valide. Demandez un nouveau lien de réinitialisation."
          );
        }
      } catch (caught) {
        console.error("Reset password session check failed:", caught);
        fail(UNAVAILABLE_MESSAGE);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
    } catch (caught) {
      console.error("Password update failed:", caught);
      setError(UNAVAILABLE_MESSAGE);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);

    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push(ROUTES.HOME);
      router.refresh();
    }, 2000);
  };

  if (isValidSession === null) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {success ? "Mot de passe modifié" : "Nouveau mot de passe"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="size-16 text-success" />
              <p className="text-center text-muted-foreground">
                Votre mot de passe a été modifié avec succès. Redirection...
              </p>
            </div>
          ) : !isValidSession ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
              <Link href={ROUTES.FORGOT_PASSWORD}>
                <Button variant="outline" className="w-full">
                  Demander un nouveau lien
                </Button>
              </Link>
              <Link href={ROUTES.LOGIN} className="text-center">
                <Button variant="link" className="text-sm">
                  <ArrowLeft className="size-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="mt-2">
                {isLoading ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default ResetPasswordPage;
