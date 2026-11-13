import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const proxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === ROUTES.LOGIN;
  const isApi = pathname.startsWith("/api/");

  // Login / logout restent accessibles sans session
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  const isAuthenticated = await isValidSessionValue(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  // API : 401 en JSON plutôt qu'une redirection
  if (isApi && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect unauthenticated users to login page
  if (!isAuthenticated && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.HOME;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA assets: sw.js, workbox*.js, manifest.json, icons, splash
     * Les routes API passent par le proxy : elles exigent une session valide
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|manifest\\.json|icons/.*|splash/.*|apple-touch-icon\\.png|splash-hide\\.js).*)",
  ],
};
