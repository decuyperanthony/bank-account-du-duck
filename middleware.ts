import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // Si les variables ne sont pas définies, on laisse passer
  if (!user || !pass) {
    return NextResponse.next();
  }

  // Exclure les fichiers statiques
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        // Utiliser atob au lieu de Buffer pour la compatibilité Edge Runtime
        const decoded = atob(encoded);
        const [u, p] = decoded.split(":");
        if (u === user && p === pass) {
          return NextResponse.next();
        }
      } catch (error) {
        // En cas d'erreur de décodage, on refuse l'accès
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Gestion Prélèvements"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
