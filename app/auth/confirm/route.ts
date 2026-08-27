import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

/**
 * Point d'entrée des liens envoyés par email par Supabase.
 *
 * Supabase peut appeler cette route de deux façons selon le template email :
 * - `?token_hash=...&type=recovery` (template `{{ .TokenHash }}`)
 * - `?code=...` (flux PKCE)
 *
 * Dans les deux cas on pose la session en cookie côté serveur, puis on
 * redirige vers la page permettant de choisir un nouveau mot de passe.
 */
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = (searchParams.get("type") ?? "recovery") as EmailOtpType;
  const next = searchParams.get("next") ?? ROUTES.RESET_PASSWORD;

  const redirectWithError = (message: string) => {
    const url = new URL(ROUTES.RESET_PASSWORD, origin);
    url.searchParams.set("error_description", message);
    return NextResponse.redirect(url);
  };

  try {
    const supabase = await createClient();

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (error) return redirectWithError(error.message);
      return NextResponse.redirect(new URL(next, origin));
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return redirectWithError(error.message);
      return NextResponse.redirect(new URL(next, origin));
    }

    return redirectWithError("Lien de réinitialisation incomplet.");
  } catch (error) {
    console.error("Auth confirm failed:", error);
    return redirectWithError(
      "Le service d'authentification est indisponible. Réessayez plus tard."
    );
  }
};
