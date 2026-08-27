import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.FORGOT_PASSWORD ||
    pathname === ROUTES.RESET_PASSWORD ||
    pathname === ROUTES.AUTH_CONFIRM;

  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    // Supabase injoignable (DNS, projet en pause, panne réseau...).
    // Sans ce catch, l'exception remonte et TOUTES les pages renvoient un 500.
    console.error("Supabase unreachable in proxy:", error);

    if (isAuthPage) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    url.searchParams.set("error", "auth_unavailable");
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login page
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page (but allow reset-password)
  if (user && pathname === ROUTES.LOGIN) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.HOME;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};

export const proxy = async (request: NextRequest) => {
  return updateSession(request);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA assets: sw.js, workbox*.js, manifest.json, icons, splash
     * - API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|manifest\\.json|icons/.*|splash/.*|apple-touch-icon\\.png|splash-hide\\.js|api/).*)",
  ],
};
